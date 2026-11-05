/* What the teacher-class integrations share (docs/teacher-classes.md, stream C): who is calling, whether
   they own the class, signed tokens, encryption for stored OAuth tokens, plain-text email through Resend,
   and the few small HTML pages the Worker serves itself.

   Secrets (wrangler secret put NAME):
     CLASS_SECRET     32+ random characters. Signs OAuth state, LTI state and tickets, the "stop teacher
                      reminders" link, and (through HKDF, separate keys per use) encrypts the Google refresh
                      token before it is stored. Rotating it signs everyone out of Google Classroom.
     RESEND_API_KEY   already used by the study reminders (src/email.js); REMINDER_FROM is the sender.

   Every name here starts with cls: scripts/build-worker.mjs flattens all modules into one scope. */
import { sb, timedFetch, sha256Hex } from './store.js';
import { sessionUser, bearerToken } from './premium.js';
import { resendOutcome } from './email.js';

const CLS_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const clsUuid = (v) => typeof v === 'string' && CLS_UUID.test(v);
const clsEnc = new TextEncoder();

/* A feature flag: "on", "owner" (the owner's account only, to try it) or "off" (unset). */
export function clsFlag(env, name) {
  const v = String((env && env[name]) || '').trim().toLowerCase();
  return v === 'on' || v === 'owner' ? v : 'off';
}

export async function clsBody(request) {
  try {
    const b = await request.json();
    return b && typeof b === 'object' && !Array.isArray(b) ? b : null;
  } catch { return null; }
}

/* The signed-in user behind the request, or null. */
export async function clsUser(env, request) {
  const token = bearerToken(request);
  if (!token) return null;
  return sessionUser(env, token);
}

export function clsReady(env) {
  return !!(env && env.SUPABASE_URL && env.SUPABASE_SERVICE_KEY && env.CLASS_SECRET && String(env.CLASS_SECRET).length >= 32);
}

async function clsRows(env, path) {
  const res = await sb(env, path);
  if (!res.ok) throw new Error(`db ${res.status}`);
  const rows = await res.json();
  return Array.isArray(rows) ? rows : [];
}

/* The class if `uid` teaches it, else null. */
export async function clsOwnClass(env, uid, classId) {
  if (!clsUuid(classId) || !clsUuid(uid)) return null;
  const rows = await clsRows(env, `classes?select=id,name,course,code,archived,teacher_id&id=eq.${classId}&teacher_id=eq.${uid}&limit=1`);
  return rows[0] || null;
}

/* { cls, role } when `uid` teaches the class as its owner or a co-teacher (class_coteachers), else null.
   Co-teachers may remind, share reports and score; Google, LTI and grade passback use clsOwnClass. */
export async function clsTeachClass(env, uid, classId) {
  if (!clsUuid(classId) || !clsUuid(uid)) return null;
  const cls = await clsClass(env, classId);
  if (!cls) return null;
  if (cls.teacher_id === uid) return { cls, role: 'owner' };
  const res = await sb(env, `class_coteachers?select=user_id&class_id=eq.${classId}&user_id=eq.${uid}&limit=1`);
  if (!res.ok) return null;
  return (await res.json()).length ? { cls, role: 'co' } : null;
}

export async function clsClass(env, classId) {
  if (!clsUuid(classId)) return null;
  const rows = await clsRows(env, `classes?select=id,name,course,code,archived,teacher_id&id=eq.${classId}&limit=1`);
  return rows[0] || null;
}

export async function clsAssignment(env, classId, id) {
  if (!clsUuid(classId) || !clsUuid(id)) return null;
  const rows = await clsRows(env, `class_assignments?select=id,class_id,kind,title,spec,opens_at,due_at,late_until,required,students&id=eq.${id}&class_id=eq.${classId}&limit=1`);
  return rows[0] || null;
}

export async function clsMembers(env, classId) {
  return clsRows(env, `class_members?select=student_id,name&class_id=eq.${classId}`);
}

export async function clsIsMember(env, classId, uid) {
  if (!clsUuid(classId) || !clsUuid(uid)) return false;
  const rows = await clsRows(env, `class_members?select=student_id&class_id=eq.${classId}&student_id=eq.${uid}&limit=1`);
  return rows.length > 0;
}

export async function clsTeacherName(env, uid) {
  try {
    const rows = await clsRows(env, `teacher_profiles?select=display_name&user_id=eq.${uid}&limit=1`);
    return (rows[0] && rows[0].display_name) || 'Your teacher';
  } catch { return 'Your teacher'; }
}

export async function clsRpc(env, name, args) {
  const res = await sb(env, `rpc/${name}`, { method: 'POST', body: JSON.stringify(args || {}) });
  if (!res.ok) throw new Error(`rpc ${name} ${res.status}`);
  const t = await res.text();
  return t ? JSON.parse(t) : null;
}

/* Insert or update rows (PostgREST upsert on the primary key). */
export async function clsUpsert(env, table, rows, onConflict) {
  const q = onConflict ? `?on_conflict=${onConflict}` : '';
  const res = await sb(env, `${table}${q}`, {
    method: 'POST',
    headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify(rows),
  });
  if (!res.ok) throw new Error(`upsert ${table} ${res.status}`);
}

/* ------------------------------------------------------------ text */

/* Bare domains ("evil.example", "bit.ly/x"), which mail apps turn into links. */
const CLS_DOMAIN = /\b(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+(?:com|net|org|io|co|ly|me|info|biz|xyz|app|dev|site|online|link|gg|tk|ru|cn|us|uk|edu|gov|ai|to|cc|tv|page|club|shop|top|live|click|example)\b(?:\/\S*)?/gi;

/* Plain text for an email, newlines kept: no other control characters, no links or bare domains. */
export function clsText(s, max = 1000) {
  return String(s == null ? '' : s)
    .replace(/[\u0000-\u0009\u000b-\u001f\u007f]+/g, ' ')
    .replace(/\b(?:https?:\/\/|www\.)\S+/gi, '')
    .replace(CLS_DOMAIN, '')
    .replace(/[ \t]+/g, ' ').trim().slice(0, max);
}

/* One line of plain text for an email: no control characters, no links or bare domains (a teacher's note must
   not turn our sender into a link shortener), at most `max` characters. */
export function clsLine(s, max = 120) {
  return clsText(String(s == null ? '' : s).replace(/[\r\n]+/g, ' '), 100000).replace(/\s+/g, ' ').trim().slice(0, max);
}

export const clsEmailOk = (e) => typeof e === 'string' && e.length <= 120 && /^[^\s@<>"',;]+@[^\s@<>"',;]+\.[a-z]{2,}$/i.test(e);

export function clsEsc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

/* ------------------------------------------------------------ base64url and keys */

export function clsB64u(bytes) {
  const b = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let s = '';
  for (let i = 0; i < b.length; i += 0x8000) s += String.fromCharCode.apply(null, b.subarray(i, i + 0x8000));
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function clsUnB64u(s) {
  const t = String(s || '').replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(t + '==='.slice((t.length + 3) % 4));
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export const clsB64uJson = (o) => clsB64u(clsEnc.encode(JSON.stringify(o)));
export const clsUnB64uJson = (s) => JSON.parse(new TextDecoder().decode(clsUnB64u(s)));

const clsKeyCache = new Map();
async function clsKey(env, label, algo, usages) {
  const id = `${label}:${env.CLASS_SECRET}`;
  if (clsKeyCache.has(id)) return clsKeyCache.get(id);
  const base = await crypto.subtle.importKey('raw', clsEnc.encode(String(env.CLASS_SECRET)), 'HKDF', false, ['deriveKey']);
  const key = await crypto.subtle.deriveKey(
    { name: 'HKDF', hash: 'SHA-256', salt: clsEnc.encode('levlprep-classes-v1'), info: clsEnc.encode(label) },
    base, algo, false, usages);
  if (clsKeyCache.size > 20) clsKeyCache.clear();
  clsKeyCache.set(id, key);
  return key;
}
const clsHmacKey = (env) => clsKey(env, 'sign', { name: 'HMAC', hash: 'SHA-256', length: 256 }, ['sign', 'verify']);
const clsAesKey = (env) => clsKey(env, 'token-encryption', { name: 'AES-GCM', length: 256 }, ['encrypt', 'decrypt']);

/* A signed, optionally expiring token: base64url(JSON) + "." + base64url(HMAC). `kind` is signed in, so a
   token made for one purpose (an OAuth state) is refused for another (a stop link). ttlSeconds null = no
   expiry. */
export async function clsSign(env, kind, data, ttlSeconds, now = Date.now()) {
  const body = clsB64uJson({ k: kind, d: data, e: ttlSeconds == null ? 0 : Math.floor(now / 1000) + ttlSeconds });
  const sig = await crypto.subtle.sign('HMAC', await clsHmacKey(env), clsEnc.encode(body));
  return `${body}.${clsB64u(sig)}`;
}

export async function clsVerify(env, kind, token, now = Date.now()) {
  if (typeof token !== 'string' || token.length > 8000) return null;
  const dot = token.lastIndexOf('.');
  if (dot < 1) return null;
  const body = token.slice(0, dot);
  let ok = false;
  try {
    ok = await crypto.subtle.verify('HMAC', await clsHmacKey(env), clsUnB64u(token.slice(dot + 1)), clsEnc.encode(body));
  } catch { return null; }
  if (!ok) return null;
  let o;
  try { o = clsUnB64uJson(body); } catch { return null; }
  if (!o || o.k !== kind) return null;
  if (o.e && o.e < Math.floor(now / 1000)) return null;
  return o.d;
}

export async function clsEncrypt(env, text) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, await clsAesKey(env), clsEnc.encode(text));
  return `v1.${clsB64u(iv)}.${clsB64u(ct)}`;
}

export async function clsDecrypt(env, blob) {
  const p = String(blob || '').split('.');
  if (p.length !== 3 || p[0] !== 'v1') return null;
  try {
    const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: clsUnB64u(p[1]) }, await clsAesKey(env), clsUnB64u(p[2]));
    return new TextDecoder().decode(pt);
  } catch { return null; }
}

export function clsRandom(n = 32) {
  return clsB64u(crypto.getRandomValues(new Uint8Array(n)));
}

export const clsHash = (s) => sha256Hex(String(s));

/* ------------------------------------------------------------ email */

export function clsMailReady(env) {
  return !!(env && env.RESEND_API_KEY);
}

/* One plain-text email. Returns { ok, outcome } with resendOutcome()'s words (ok, gone, config, transient). */
export async function clsMail(env, { to, subject, text, replyTo, headers }) {
  const body = {
    from: env.REMINDER_FROM || 'LevlPrep <reminders@levlprep.com>',
    to: [to],
    subject: clsLine(subject, 150),
    text,
  };
  if (replyTo) body.reply_to = replyTo;
  if (headers) body.headers = headers;
  try {
    const res = await timedFetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const outcome = await resendOutcome(res);
    return { ok: outcome === 'ok', outcome };
  } catch {
    return { ok: false, outcome: 'transient' };
  }
}

/* ------------------------------------------------------------ the Worker's own pages */

/* A small page served by the Worker (the stop link, an LTI error, the deep-linking hand-back). No third-party
   anything; `formAction` names where its one form may post; `script` is inline code allowed by its hash. */
export async function clsPage(title, inner, { status = 200, formAction = "'self'", script = '' } = {}) {
  let scriptSrc = "'none'";
  if (script) {
    const d = await crypto.subtle.digest('SHA-256', clsEnc.encode(script));
    scriptSrc = `'sha256-${btoa(String.fromCharCode(...new Uint8Array(d)))}'`;
  }
  const html = '<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">' +
    `<meta name="robots" content="noindex"><title>${clsEsc(title)} | LevlPrep</title>` +
    '<style>body{margin:0;background:#F3F6F4;font:16px/1.55 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;color:#17241F}' +
    'main{max-width:460px;margin:40px auto;background:#fff;border-radius:16px;padding:28px}h1{font-size:21px;margin:0 0 10px}p{color:#526C66}' +
    'button,.b{display:inline-block;background:#127264;color:#fff;border:0;border-radius:12px;padding:12px 22px;font-weight:700;font-size:15px;text-decoration:none;cursor:pointer}</style>' +
    `</head><body><main><p style="font-size:13px;font-weight:700;color:#127264;letter-spacing:.04em;text-transform:uppercase;margin:0 0 12px">LevlPrep</p>${inner}</main>` +
    (script ? `<script>${script}</script>` : '') + '</body></html>';
  return new Response(html, {
    status,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
      'Referrer-Policy': 'no-referrer',
      'Content-Security-Policy': `default-src 'none'; style-src 'unsafe-inline'; script-src ${scriptSrc}; form-action ${formAction}; base-uri 'none'`,
    },
  });
}

export function clsRedirect(url, status = 302) {
  return new Response(null, { status, headers: { Location: url, 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer' } });
}
