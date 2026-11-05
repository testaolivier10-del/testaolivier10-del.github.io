/* LTI 1.3 for teacher classes: Canvas, Schoology and any LTI Advantage platform (docs/teacher-classes.md,
   stream C; school admins: teach/lms.html). Behind CLASS_LTI ("on", or "owner"); needs LTI_PRIVATE_KEY (an RSA
   private JWK with a kid, made by scripts/lti-keygen.mjs) and CLASS_SECRET.

   Endpoints the LMS calls (no Origin, no session):
     GET  /lti/config.json   Canvas's JSON configuration (paste the URL into a developer key)
     GET  /lti/jwks          the tool's public key
     GET|POST /lti/login     OIDC third-party login: state (signed, 10 minutes, carries the nonce) -> platform
     POST /lti/launch        the id_token: RS256 against the platform's JWKS, iss, aud/azp, exp, nonce (signed
                             in the state and used once, lti_nonces), deployment. Then a signed 30-minute
                             ticket in the URL fragment of teach/lti.html, where the person signs in to LevlPrep.
     GET  /lti/return        posts the signed deep-linking response back to the LMS
   Endpoints the site calls (Origin + session):
     POST /lti/platforms           register a platform (issuer, client id, deployment, endpoints)
     POST /lti/platforms/mine      the ones this account registered
     POST /lti/deeplink            a teacher picked a class and assignment: build LtiDeepLinkingResponse
     POST /lti/bind                a signed-in student (or teacher) arrives from a launch
     POST /lti/grades              AGS scores for a required assignment, from the teacher's page

   The state travels in the login redirect rather than a cookie, because LMSs launch tools in iframes where
   third-party cookies are blocked; the nonce inside it is checked against the id_token and can be used once. */
import { sb, timedFetch } from './store.js';
import { siteUrl, apiUrl } from './config.js';
import { urlCourse } from './premium.js';
import { isOwnerEmail } from './umami.js';
import {
  clsUuid, clsBody, clsUser, clsReady, clsFlag, clsOwnClass, clsClass, clsAssignment, clsMembers, clsIsMember, clsUpsert,
  clsLine, clsEsc, clsSign, clsVerify, clsRandom, clsB64u, clsB64uJson, clsUnB64u, clsUnB64uJson, clsPage, clsRedirect,
} from './class-common.js';
import { cleanGrades } from './class-google.js';

const LTI_CLAIM = 'https://purl.imsglobal.org/spec/lti/claim/';
const LTI_DL = 'https://purl.imsglobal.org/spec/lti-dl/claim/';
const LTI_AGS = 'https://purl.imsglobal.org/spec/lti-ags/claim/endpoint';
export const LTI_SCORE_SCOPE = 'https://purl.imsglobal.org/spec/lti-ags/scope/score';
const LTI_RS = { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' };
const ltiEnc = new TextEncoder();

function ltiConfigured(env) {
  return clsReady(env) && !!env.LTI_PRIVATE_KEY;
}
const ltiOn = (env) => clsFlag(env, 'CLASS_LTI') !== 'off' && ltiConfigured(env);

export async function ltiAllowed(env, user) {
  const mode = clsFlag(env, 'CLASS_LTI');
  if (mode === 'off' || !ltiConfigured(env)) return false;
  return mode === 'on' || (await isOwnerEmail(user.email));
}

const ltiOff = { status: 404, body: { error: 'Canvas and Schoology links are not turned on yet.' } };

/* ------------------------------------------------------------ keys and JWTs */

export function ltiPrivateJwk(env) {
  try {
    const k = JSON.parse(env.LTI_PRIVATE_KEY);
    return k && k.kty === 'RSA' && k.d && k.kid ? k : null;
  } catch { return null; }
}

export function ltiPublicJwk(env) {
  const k = ltiPrivateJwk(env);
  return k ? { kty: 'RSA', n: k.n, e: k.e, kid: k.kid, alg: 'RS256', use: 'sig' } : null;
}

export async function ltiSignJwt(env, payload) {
  const jwk = ltiPrivateJwk(env);
  if (!jwk) throw new Error('no LTI key');
  const { kid, alg: _a, key_ops: _o, use: _u, ...raw } = jwk;
  const key = await crypto.subtle.importKey('jwk', { ...raw, alg: 'RS256', ext: true }, LTI_RS, false, ['sign']);
  const head = clsB64uJson({ alg: 'RS256', typ: 'JWT', kid });
  const body = clsB64uJson(payload);
  const sig = await crypto.subtle.sign(LTI_RS, key, ltiEnc.encode(`${head}.${body}`));
  return `${head}.${body}.${clsB64u(sig)}`;
}

const ltiJwksCache = new Map();
async function ltiJwks(url, now, fresh) {
  const hit = ltiJwksCache.get(url);
  if (!fresh && hit && hit.until > now) return hit.keys;
  const res = await timedFetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`jwks ${res.status}`);
  const keys = ((await res.json()) || {}).keys || [];
  if (ltiJwksCache.size > 50) ltiJwksCache.clear();
  ltiJwksCache.set(url, { keys, until: now + 10 * 60 * 1000 });
  return keys;
}

/* The verified payload of an RS256 JWT signed by a key from `jwksUrl`, or null. A kid the cache does not
   know triggers one fresh fetch (platforms rotate keys). */
export async function ltiVerifyJwt(token, jwksUrl, now = Date.now()) {
  const parts = String(token || '').split('.');
  if (parts.length !== 3) return null;
  let head, payload;
  try { head = clsUnB64uJson(parts[0]); payload = clsUnB64uJson(parts[1]); } catch { return null; }
  if (!head || head.alg !== 'RS256' || !payload) return null;
  let keys = await ltiJwks(jwksUrl, now, false);
  let jwk = keys.find((k) => k.kid === head.kid) || (!head.kid && keys.length === 1 ? keys[0] : null);
  if (!jwk) { keys = await ltiJwks(jwksUrl, now, true); jwk = keys.find((k) => k.kid === head.kid); }
  if (!jwk || jwk.kty !== 'RSA') return null;
  try {
    const key = await crypto.subtle.importKey('jwk', { kty: 'RSA', n: jwk.n, e: jwk.e, alg: 'RS256', ext: true }, LTI_RS, false, ['verify']);
    const ok = await crypto.subtle.verify(LTI_RS, key, clsUnB64u(parts[2]), ltiEnc.encode(`${parts[0]}.${parts[1]}`));
    return ok ? payload : null;
  } catch { return null; }
}

/* ------------------------------------------------------------ platforms */

const ltiHttps = (u) => { try { const x = new URL(String(u)); return x.protocol === 'https:' && !x.username && !x.password ? x.href : null; } catch { return null; } };

export function ltiCleanPlatform(p) {
  const issuer = ltiHttps(p && p.issuer);
  const client_id = clsLine(p && p.client_id, 120);
  const auth_url = ltiHttps(p && p.auth_url), token_url = ltiHttps(p && p.token_url), jwks_url = ltiHttps(p && p.jwks_url);
  const dep = clsLine(p && p.deployment_id, 200);
  if (!issuer || !client_id || !auth_url || !token_url || !jwks_url) return null;
  return { issuer: issuer.replace(/\/$/, ''), client_id, auth_url, token_url, jwks_url, deployment: dep || null, label: clsLine(p && p.label, 80) || null };
}

async function ltiPlatform(env, { id, issuer, clientId }) {
  let q;
  if (id) { if (!clsUuid(id)) return null; q = `id=eq.${id}`; }
  else q = `issuer=eq.${encodeURIComponent(issuer)}` + (clientId ? `&client_id=eq.${encodeURIComponent(clientId)}` : '');
  const res = await sb(env, `lti_platforms?select=id,issuer,client_id,deployment_ids,auth_url,token_url,jwks_url,label&${q}&limit=2`);
  if (!res.ok) return null;
  const rows = await res.json();
  return rows.length === 1 ? rows[0] : null;
}

/* POST /lti/platforms { issuer, client_id, deployment_id, auth_url, token_url, jwks_url, label } */
export async function ltiRegister(request, env) {
  const user = await clsUser(env, request);
  if (!user) return { status: 401, body: { error: 'Sign in first.' } };
  if (!(await ltiAllowed(env, user))) return ltiOff;
  const p = ltiCleanPlatform(await clsBody(request));
  if (!p) return { status: 400, body: { error: 'Fill in the issuer, client id and the three https addresses.' } };
  const res = await sb(env, `lti_platforms?select=id,registered_by,deployment_ids&issuer=eq.${encodeURIComponent(p.issuer)}&client_id=eq.${encodeURIComponent(p.client_id)}&limit=1`);
  const have = res.ok ? (await res.json())[0] : null;
  if (have && have.registered_by !== user.id) {
    return { status: 409, body: { error: 'This developer key is already registered. Ask the person who registered it, or email hello@levlprep.com.' } };
  }
  const deps = new Set(have ? have.deployment_ids || [] : []);
  if (p.deployment) deps.add(p.deployment);
  const row = { issuer: p.issuer, client_id: p.client_id, deployment_ids: [...deps], auth_url: p.auth_url, token_url: p.token_url, jwks_url: p.jwks_url, label: p.label, registered_by: user.id };
  if (have) row.id = have.id;
  await clsUpsert(env, 'lti_platforms', [row], 'issuer,client_id');
  return { status: 200, body: { ok: true } };
}

/* POST /lti/platforms/mine */
export async function ltiMine(request, env) {
  const user = await clsUser(env, request);
  if (!user) return { status: 401, body: { error: 'Sign in first.' } };
  if (!(await ltiAllowed(env, user))) return { status: 200, body: { on: false, platforms: [] } };
  const res = await sb(env, `lti_platforms?select=id,issuer,client_id,deployment_ids,label,created_at&registered_by=eq.${user.id}`);
  return { status: 200, body: { on: true, platforms: res.ok ? await res.json() : [], tool: ltiToolUrls(env) } };
}

export function ltiToolUrls(env) {
  const api = apiUrl(env);
  return { login: `${api}/lti/login`, launch: `${api}/lti/launch`, jwks: `${api}/lti/jwks`, config: `${api}/lti/config.json`, redirect: `${api}/lti/launch` };
}

/* ------------------------------------------------------------ the LMS's side */

export function ltiCanvasConfig(env) {
  const u = ltiToolUrls(env);
  return {
    title: 'LevlPrep',
    description: 'LevlPrep AP® course assignments with grades sent back to the gradebook.',
    oidc_initiation_url: u.login,
    target_link_uri: u.launch,
    public_jwk_url: u.jwks,
    scopes: [LTI_SCORE_SCOPE, 'https://purl.imsglobal.org/spec/lti-ags/scope/lineitem.readonly'],
    extensions: [{
      platform: 'canvas.instructure.com',
      privacy_level: 'name_only',
      domain: new URL(apiUrl(env)).host,
      settings: {
        placements: [
          { placement: 'assignment_selection', message_type: 'LtiDeepLinkingRequest', target_link_uri: u.launch, text: 'LevlPrep' },
          { placement: 'link_selection', message_type: 'LtiDeepLinkingRequest', target_link_uri: u.launch, text: 'LevlPrep' },
        ],
      },
    }],
    custom_fields: {},
  };
}

function ltiParams(request, form) {
  const q = new URL(request.url).searchParams;
  const get = (k) => (form && form.get(k)) || q.get(k) || '';
  return get;
}

async function ltiError(title, msg, status = 400) {
  return clsPage(title, `<h1>${clsEsc(title)}</h1><p>${clsEsc(msg)}</p><p>If this keeps happening, show this page to your school’s LMS admin or email hello@levlprep.com.</p>`, { status });
}

/* GET|POST /lti/login */
export async function ltiLogin(request, env) {
  if (!ltiOn(env)) return ltiError('Not turned on', 'LevlPrep links for this LMS are not turned on yet.', 404);
  const form = request.method === 'POST' ? await request.formData().catch(() => null) : null;
  const get = ltiParams(request, form);
  const iss = String(get('iss')).replace(/\/$/, '');
  const platform = await ltiPlatform(env, { issuer: iss, clientId: get('client_id') });
  if (!platform) return ltiError('Not registered', 'This LMS is not registered with LevlPrep yet. Your admin can add it on levlprep.com/teach/lms.html.', 404);
  const target = get('target_link_uri');
  if (target && !target.startsWith(`${apiUrl(env)}/lti/`)) return ltiError('Wrong address', 'The launch address is not LevlPrep’s.');
  const nonce = clsRandom(18);
  const state = await clsSign(env, 'lti-state', { p: platform.id, n: nonce }, 600);
  const q = new URLSearchParams({
    scope: 'openid', response_type: 'id_token', response_mode: 'form_post', prompt: 'none',
    client_id: platform.client_id, redirect_uri: `${apiUrl(env)}/lti/launch`, login_hint: get('login_hint'), state, nonce,
  });
  if (get('lti_message_hint')) q.set('lti_message_hint', get('lti_message_hint'));
  return clsRedirect(`${platform.auth_url}${platform.auth_url.includes('?') ? '&' : '?'}${q}`);
}

/* The checks on a verified id_token. Returns null when it passes, else the reason. */
export function ltiClaimProblem(c, platform, nonce, now = Date.now()) {
  const s = Math.floor(now / 1000);
  if (String(c.iss || '').replace(/\/$/, '') !== platform.issuer) return 'issuer';
  const aud = Array.isArray(c.aud) ? c.aud : [c.aud];
  if (!aud.includes(platform.client_id)) return 'audience';
  if (aud.length > 1 && c.azp !== platform.client_id) return 'azp';
  if (!(Number(c.exp) > s - 60)) return 'expired';
  if (Number(c.iat) > s + 300) return 'iat';
  if (!nonce || c.nonce !== nonce) return 'nonce';
  if (c[`${LTI_CLAIM}version`] !== '1.3.0') return 'version';
  const dep = c[`${LTI_CLAIM}deployment_id`];
  if (!dep) return 'deployment';
  if ((platform.deployment_ids || []).length && !platform.deployment_ids.includes(dep)) return 'deployment';
  if (!c.sub) return 'sub';
  return null;
}

const ltiInstructor = (c) => (c[`${LTI_CLAIM}roles`] || []).some((r) => /#(Instructor|Administrator|ContentDeveloper|TeachingAssistant)$|membership\/Instructor/.test(String(r)));

/* POST /lti/launch (form_post from the platform) */
export async function ltiLaunch(request, env, now = Date.now()) {
  if (!ltiOn(env)) return ltiError('Not turned on', 'LevlPrep links for this LMS are not turned on yet.', 404);
  const form = await request.formData().catch(() => null);
  if (!form) return ltiError('Launch failed', 'The LMS sent nothing LevlPrep could read.');
  if (form.get('error')) return ltiError('Launch failed', `The LMS said: ${clsLine(form.get('error_description') || form.get('error'), 200)}`);
  const st = await clsVerify(env, 'lti-state', String(form.get('state') || ''), now);
  if (!st) return ltiError('Launch expired', 'Open the assignment again from your LMS.');
  const platform = await ltiPlatform(env, { id: st.p });
  if (!platform) return ltiError('Not registered', 'This LMS is no longer registered with LevlPrep.', 404);
  let c;
  try { c = await ltiVerifyJwt(String(form.get('id_token') || ''), platform.jwks_url, now); } catch { c = null; }
  if (!c) return ltiError('Launch failed', 'LevlPrep could not check the LMS’s signature.');
  const why = ltiClaimProblem(c, platform, st.n, now);
  if (why) return ltiError('Launch failed', `The launch did not pass LevlPrep’s checks (${why}).`);
  const used = await sb(env, 'lti_nonces', { method: 'POST', headers: { Prefer: 'return=minimal' }, body: JSON.stringify({ nonce: `${platform.id}:${c.nonce}`, expires_at: new Date(now + 86400000).toISOString() }) });
  if (!used.ok) return ltiError('Launch already used', 'Open the assignment again from your LMS.');
  await sb(env, `lti_nonces?expires_at=lt.${encodeURIComponent(new Date(now).toISOString())}`, { method: 'DELETE' });

  const type = c[`${LTI_CLAIM}message_type`];
  const ctx = c[`${LTI_CLAIM}context`] || {};
  const base = { p: platform.id, sub: String(c.sub), dep: c[`${LTI_CLAIM}deployment_id`], ctx: clsLine(ctx.id, 200), ctxTitle: clsLine(ctx.title, 100), instr: ltiInstructor(c) };
  if (type === 'LtiDeepLinkingRequest') {
    if (!base.instr) return ltiError('Teachers only', 'Only a teacher can add LevlPrep work to a course.', 403);
    const dl = c[`${LTI_DL}deep_linking_settings`] || {};
    const ret = ltiHttps(dl.deep_link_return_url);
    if (!ret) return ltiError('Launch failed', 'The LMS did not say where to send the assignment back.');
    const ticket = await clsSign(env, 'lti-dl', { ...base, ret, data: dl.data == null ? null : String(dl.data).slice(0, 2000) }, 1800, now);
    return clsRedirect(`${siteUrl(env)}/teach/lti.html#dl=${ticket}`, 303);
  }
  if (type === 'LtiResourceLinkRequest') {
    const custom = c[`${LTI_CLAIM}custom`] || {};
    const ags = c[LTI_AGS] || {};
    const ticket = await clsSign(env, 'lti-go', {
      ...base, la: clsUuid(custom.la) ? custom.la : null, cls: clsUuid(custom.class) ? custom.class : null,
      li: ltiHttps(ags.lineitem), name: clsLine(c.given_name || c.name, 60),
    }, 1800, now);
    return clsRedirect(`${siteUrl(env)}/teach/lti.html#go=${ticket}`, 303);
  }
  return ltiError('Not supported', 'LevlPrep does not handle this kind of LMS launch.');
}

/* ------------------------------------------------------------ the site's side */

/* POST /lti/deeplink { ticket, class, assignment } -> { go } */
export async function ltiDeepLink(request, env, now = Date.now()) {
  if (!ltiOn(env)) return ltiOff;
  const user = await clsUser(env, request);
  if (!user) return { status: 401, body: { error: 'Sign in first.' } };
  const p = await clsBody(request);
  const t = p && await clsVerify(env, 'lti-dl', p.ticket, now);
  if (!t) return { status: 400, body: { error: 'This page has expired. Start again from your LMS.' } };
  const cls = await clsOwnClass(env, user.id, p.class);
  if (!cls) return { status: 404, body: { error: 'Class not found.' } };
  const a = await clsAssignment(env, cls.id, p.assignment);
  if (!a) return { status: 404, body: { error: 'Assignment not found.' } };
  const platform = await ltiPlatform(env, { id: t.p });
  if (!platform) return { status: 404, body: { error: 'This LMS is no longer registered.' } };
  const item = { type: 'ltiResourceLink', title: clsLine(a.title, 120), url: `${apiUrl(env)}/lti/launch`, custom: { la: a.id, class: cls.id } };
  if (a.required) item.lineItem = { scoreMaximum: 100, label: clsLine(a.title, 120), resourceId: a.id, tag: 'levlprep' };
  const s = Math.floor(now / 1000);
  const payload = {
    iss: platform.client_id, aud: platform.issuer, iat: s, exp: s + 600, nonce: clsRandom(16),
    [`${LTI_CLAIM}deployment_id`]: t.dep, [`${LTI_CLAIM}message_type`]: 'LtiDeepLinkingResponse', [`${LTI_CLAIM}version`]: '1.3.0',
    [`${LTI_DL}content_items`]: [item],
  };
  if (t.data != null) payload[`${LTI_DL}data`] = t.data;
  const jwt = await ltiSignJwt(env, payload);
  if (t.ctx) await clsUpsert(env, 'class_ext_links', [{ class_id: cls.id, provider: 'lti', platform_id: platform.id, external_id: t.ctx, title: t.ctxTitle || null }], 'class_id,provider,external_id');
  const r = await clsSign(env, 'lti-ret', { u: t.ret, j: jwt }, 300, now);
  return { status: 200, body: { go: `${apiUrl(env)}/lti/return?r=${encodeURIComponent(r)}` } };
}

/* GET /lti/return?r=  posts the signed response to the LMS (a form the browser submits). */
export async function ltiReturn(request, env) {
  const d = ltiOn(env) ? await clsVerify(env, 'lti-ret', new URL(request.url).searchParams.get('r') || '') : null;
  const u = d && ltiHttps(d.u);
  if (!u || typeof d.j !== 'string') return ltiError('Expired', 'Start again from your LMS.');
  const script = 'document.getElementById("f").submit();';
  return clsPage('Sending to your LMS', `<h1>Sending the assignment to your LMS…</h1><form id="f" method="post" action="${clsEsc(u)}"><input type="hidden" name="JWT" value="${clsEsc(d.j)}"><button type="submit">Continue</button></form>`,
    { formAction: clsEsc(new URL(u).origin), script });
}

/* POST /lti/bind { ticket } -> { url } or { join: code } or { teacher: url } */
export async function ltiBind(request, env, now = Date.now()) {
  if (!ltiOn(env)) return ltiOff;
  const user = await clsUser(env, request);
  if (!user) return { status: 401, body: { error: 'Sign in first.' } };
  const p = await clsBody(request);
  const t = p && await clsVerify(env, 'lti-go', p.ticket, now);
  if (!t) return { status: 400, body: { error: 'This page has expired. Open the assignment again from your LMS.' } };
  if (!t.cls || !t.la) return { status: 404, body: { error: 'This LMS link does not point at a LevlPrep assignment. Ask your teacher to add it again.' } };
  const cls = await clsClass(env, t.cls);
  const a = cls && await clsAssignment(env, cls.id, t.la);
  if (!cls || !a || cls.archived) return { status: 404, body: { error: 'This assignment was removed by your teacher.' } };
  if (cls.teacher_id === user.id) return { status: 200, body: { teacher: `${siteUrl(env)}/teach/?c=${cls.id}#a/${a.id}` } };
  if (t.instr) return { status: 403, body: { error: 'This class belongs to another LevlPrep teacher. Sign in with the account that made it.' } };
  if (!(await clsIsMember(env, cls.id, user.id))) return { status: 200, body: { join: cls.code } };
  await clsUpsert(env, 'class_ext_members', [{ class_id: cls.id, student_id: user.id, provider: 'lti', platform_id: t.p, external_user: t.sub }], 'class_id,student_id,provider');
  if (t.li && a.required) await clsUpsert(env, 'class_ext_assignments', [{ assignment_id: a.id, provider: 'lti', platform_id: t.p, external_id: t.li }], 'assignment_id,provider,external_id');
  return { status: 200, body: { url: `${siteUrl(env)}/${urlCourse(cls.course)}/?la=${encodeURIComponent(a.id)}&ref=lti` } };
}

async function ltiServiceToken(env, platform, now) {
  const s = Math.floor(now / 1000);
  const assertion = await ltiSignJwt(env, { iss: platform.client_id, sub: platform.client_id, aud: platform.token_url, iat: s, exp: s + 300, jti: clsRandom(16) });
  const res = await timedFetch(platform.token_url, {
    method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials', client_assertion_type: 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer',
      client_assertion: assertion, scope: LTI_SCORE_SCOPE,
    }),
  });
  if (!res.ok) return null;
  return (await res.json()).access_token || null;
}

export function ltiScoresUrl(lineitem) {
  const u = new URL(lineitem);
  u.pathname = u.pathname.replace(/\/$/, '') + '/scores';
  return u.href;
}

/* POST /lti/grades { class, assignment, grades: [{ student, score }] } -> { sent, skipped } */
export async function ltiGrades(request, env, now = Date.now()) {
  const user = await clsUser(env, request);
  if (!user) return { status: 401, body: { error: 'Sign in again.' } };
  if (!(await ltiAllowed(env, user))) return ltiOff;
  const p = await clsBody(request);
  const cls = p && await clsOwnClass(env, user.id, p.class);
  if (!cls) return { status: 404, body: { error: 'Class not found.' } };
  const a = await clsAssignment(env, cls.id, p.assignment);
  if (!a) return { status: 404, body: { error: 'Assignment not found.' } };
  if (!a.required) return { status: 400, body: { error: 'Grades go back only for required assignments.' } };
  const er = await sb(env, `class_ext_assignments?select=external_id,platform_id&assignment_id=eq.${a.id}&provider=eq.lti`);
  const items = er.ok ? await er.json() : [];
  if (!items.length) return { status: 409, body: { error: 'No student has opened this assignment from your LMS yet, so there is no gradebook column to send to.' } };
  const grades = cleanGrades(p.grades, (await clsMembers(env, cls.id)).map((m) => m.student_id));
  if (!grades.size) return { status: 400, body: { error: 'No grades to send.' } };
  const mr = await sb(env, `class_ext_members?select=student_id,external_user,platform_id&class_id=eq.${cls.id}&provider=eq.lti`);
  const subs = new Map((mr.ok ? await mr.json() : []).map((m) => [m.student_id, m]));
  let sent = 0;
  const skipped = [];
  const tokens = new Map();
  for (const [student, grade] of grades) {
    const m = subs.get(student);
    const item = m && items.find((i) => i.platform_id === m.platform_id);
    if (!item) { skipped.push({ student, why: 'not-launched' }); continue; }
    if (!tokens.has(item.platform_id)) {
      const platform = await ltiPlatform(env, { id: item.platform_id });
      tokens.set(item.platform_id, platform ? await ltiServiceToken(env, platform, now) : null);
    }
    const tok = tokens.get(item.platform_id);
    if (!tok) { skipped.push({ student, why: 'lms-refused' }); continue; }
    const res = await timedFetch(ltiScoresUrl(item.external_id), {
      method: 'POST', headers: { Authorization: `Bearer ${tok}`, 'Content-Type': 'application/vnd.ims.lis.v1.score+json' },
      body: JSON.stringify({ userId: m.external_user, scoreGiven: grade, scoreMaximum: 100, activityProgress: 'Completed', gradingProgress: 'FullyGraded', timestamp: new Date(now).toISOString() }),
    });
    if (res.ok) sent++; else skipped.push({ student, why: `lms-${res.status}` });
  }
  return { status: 200, body: { sent, skipped } };
}
