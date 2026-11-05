/* Google Classroom for teacher classes (docs/teacher-classes.md, stream C). Behind CLASS_GOOGLE ("on", or
   "owner" for the owner's account while the Google app is unverified); needs GOOGLE_CLIENT_ID,
   GOOGLE_CLIENT_SECRET and CLASS_SECRET.

   OAuth: the teacher's page asks POST /class/google/start for Google's consent URL (state signed, 10
   minutes), Google sends the teacher back to GET /class/google/callback, which hands the refresh token, ENCRYPTED
   (AES-GCM, key derived from CLASS_SECRET) inside a signed 10-minute token, back to the class's Settings; the
   teacher's signed-in page claims it with POST /class/google/finish, which stores it in class_oauth only for the
   account that started the flow.
   Access tokens live only in memory. Disconnect revokes the token at Google and deletes the row.

   What it does, all on the teacher's press:
     courses   the teacher's active Classroom classes, to link one to this LevlPrep class
     roster    the Classroom students matched to class members by email (the match is stored as Google user
               ids for grade passback; addresses are not stored), and those who have not joined
     invite    an email with the join link to Classroom students who have not joined (200 a day per teacher)
     post      the assignment as Classroom coursework with a link to the course
     grades    the scores the teacher's page shows, as Classroom grades, for required assignments only;
               the teacher returns them to students in Classroom
   Scopes are the narrowest that do this; nothing is read from Classroom that the steps above do not need. */
import { sb, timedFetch } from './store.js';
import { siteUrl, apiUrl } from './config.js';
import { COURSE_NAMES, urlCourse } from './premium.js';
import { isOwnerEmail } from './umami.js';
import {
  clsUuid, clsBody, clsUser, clsReady, clsFlag, clsOwnClass, clsAssignment, clsMembers, clsTeacherName, clsRpc, clsUpsert,
  clsLine, clsSign, clsVerify, clsEncrypt, clsDecrypt, clsMail, clsMailReady, clsPage, clsRedirect,
} from './class-common.js';

export const GC_SCOPES = [
  'openid', 'email',
  'https://www.googleapis.com/auth/classroom.courses.readonly',
  'https://www.googleapis.com/auth/classroom.rosters.readonly',
  'https://www.googleapis.com/auth/classroom.profile.emails',
  'https://www.googleapis.com/auth/classroom.coursework.students',
];
const GC_API = 'https://classroom.googleapis.com/v1';
const GC_TOKEN = 'https://oauth2.googleapis.com/token';
const GC_MAX_PAGES = 10;

export const gcRedirectUri = (env) => `${apiUrl(env)}/class/google/callback`;

function gcConfigured(env) {
  return clsReady(env) && !!env.GOOGLE_CLIENT_ID && !!env.GOOGLE_CLIENT_SECRET;
}

export async function gcAllowed(env, user) {
  const mode = clsFlag(env, 'CLASS_GOOGLE');
  if (mode === 'off' || !gcConfigured(env)) return false;
  return mode === 'on' || (await isOwnerEmail(user.email));
}

/* The teacher, when Google Classroom is on for them; otherwise { error } as a route answer. */
async function gcTeacher(env, request) {
  if (clsFlag(env, 'CLASS_GOOGLE') === 'off' || !gcConfigured(env)) return { error: { status: 404, body: { error: 'Google Classroom is not turned on yet.' } } };
  const user = await clsUser(env, request);
  if (!user) return { error: { status: 401, body: { error: 'Sign in again.' } } };
  if (!(await gcAllowed(env, user))) return { error: { status: 404, body: { error: 'Google Classroom is not turned on yet.' } } };
  return { user };
}

/* ------------------------------------------------------------ tokens */

const gcAccessCache = new Map();

async function gcTokenRow(env, uid) {
  const res = await sb(env, `class_oauth?select=refresh_enc,account_email&teacher_id=eq.${uid}&provider=eq.google&limit=1`);
  if (!res.ok) throw new Error(`db ${res.status}`);
  return (await res.json())[0] || null;
}

/* An access token for the teacher, or null when they are not connected (or Google refused the refresh). */
export async function gcAccess(env, uid, now = Date.now()) {
  const hit = gcAccessCache.get(uid);
  if (hit && hit.until > now) return hit.token;
  const row = await gcTokenRow(env, uid);
  if (!row) return null;
  const refresh = await clsDecrypt(env, row.refresh_enc);
  if (!refresh) return null;
  const res = await timedFetch(GC_TOKEN, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: env.GOOGLE_CLIENT_ID, client_secret: env.GOOGLE_CLIENT_SECRET, refresh_token: refresh, grant_type: 'refresh_token' }),
  });
  if (!res.ok) {
    // invalid_grant: the teacher removed access at Google. Forget the token so the page shows "Connect" again.
    if (res.status === 400 || res.status === 401) await sb(env, `class_oauth?teacher_id=eq.${uid}&provider=eq.google`, { method: 'DELETE' });
    return null;
  }
  const t = await res.json();
  if (!t.access_token) return null;
  if (gcAccessCache.size > 200) gcAccessCache.clear();
  gcAccessCache.set(uid, { token: t.access_token, until: now + Math.max(60, (Number(t.expires_in) || 3600) - 300) * 1000 });
  return t.access_token;
}

async function gcGet(token, path) {
  const res = await timedFetch(`${GC_API}${path}`, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) { const e = new Error(`google ${res.status}`); e.status = res.status; throw e; }
  return res.json();
}

async function gcAll(token, path, key) {
  const out = [];
  let page = '';
  for (let i = 0; i < GC_MAX_PAGES; i++) {
    const sep = path.includes('?') ? '&' : '?';
    const r = await gcGet(token, `${path}${sep}pageSize=100${page ? `&pageToken=${encodeURIComponent(page)}` : ''}`);
    out.push(...(r[key] || []));
    if (!r.nextPageToken) break;
    page = r.nextPageToken;
  }
  return out;
}

const gcNeedsConnect = { status: 409, body: { error: 'Connect Google Classroom first.', connect: true } };
const gcFailed = (e) => (e && (e.status === 401 || e.status === 403)
  ? { status: 409, body: { error: 'Google refused. Connect Google Classroom again and allow every box.', connect: true } }
  : { status: 502, body: { error: 'Google Classroom did not answer. Try again.' } });

async function gcLinkedCourse(env, classId) {
  const res = await sb(env, `class_ext_links?select=external_id,title&class_id=eq.${classId}&provider=eq.google&limit=1`);
  return res.ok ? (await res.json())[0] || null : null;
}

/* ------------------------------------------------------------ OAuth */

/* POST /class/google/start { class } -> { url } */
export async function gcStart(request, env) {
  const t = await gcTeacher(env, request);
  if (t.error) return t.error;
  const p = await clsBody(request);
  const cls = p && await clsOwnClass(env, t.user.id, p.class);
  if (!cls) return { status: 404, body: { error: 'Class not found.' } };
  const state = await clsSign(env, 'gstate', { u: t.user.id, c: cls.id }, 600);
  const q = new URLSearchParams({
    client_id: env.GOOGLE_CLIENT_ID, redirect_uri: gcRedirectUri(env), response_type: 'code', scope: GC_SCOPES.join(' '),
    access_type: 'offline', prompt: 'consent', include_granted_scopes: 'false', state,
  });
  if (t.user.email) q.set('login_hint', t.user.email);
  return { status: 200, body: { url: `https://accounts.google.com/o/oauth2/v2/auth?${q}` } };
}

function gcEmailFromIdToken(idToken) {
  try {
    const part = String(idToken || '').split('.')[1];
    const json = JSON.parse(atob(part.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((part.length + 3) % 4)));
    return typeof json.email === 'string' ? json.email : null;
  } catch { return null; }
}

/* GET /class/google/callback?code&state (Google sends the teacher's browser here). */
export async function gcCallback(request, env) {
  const url = new URL(request.url);
  const back = (classId, status) => clsRedirect(`${siteUrl(env)}/teach/?c=${encodeURIComponent(classId || '')}&google=${status}#settings`);
  if (!gcConfigured(env)) return clsPage('Not set up', '<h1>Google Classroom is not set up yet</h1>', { status: 404 });
  const st = await clsVerify(env, 'gstate', url.searchParams.get('state') || '');
  if (!st || !clsUuid(st.u) || !clsUuid(st.c)) return clsPage('Try again', '<h1>That sign-in took too long</h1><p>Go back to your class and press Connect Google Classroom again.</p>', { status: 400 });
  if (url.searchParams.get('error') || !url.searchParams.get('code')) return back(st.c, 'canceled');
  const res = await timedFetch(GC_TOKEN, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code: url.searchParams.get('code'), client_id: env.GOOGLE_CLIENT_ID, client_secret: env.GOOGLE_CLIENT_SECRET,
      redirect_uri: gcRedirectUri(env), grant_type: 'authorization_code',
    }),
  });
  if (!res.ok) return back(st.c, 'failed');
  const tok = await res.json();
  const granted = String(tok.scope || '').split(/\s+/);
  const missing = GC_SCOPES.filter((s) => s.startsWith('https://') && !granted.includes(s));
  if (!tok.refresh_token || missing.length) return back(st.c, missing.length ? 'scopes' : 'failed');
  /* Not stored yet: the teacher's own signed-in page must claim it (POST /class/google/finish), so a consent link
     someone else started cannot attach a victim's Google account to the attacker's LevlPrep account. */
  const pend = await clsSign(env, 'gpend', {
    u: st.u, c: st.c, r: await clsEncrypt(env, tok.refresh_token), e: gcEmailFromIdToken(tok.id_token), s: granted.join(' '),
  }, 600);
  return clsRedirect(`${siteUrl(env)}/teach/?c=${encodeURIComponent(st.c)}&google=finish&gp=${encodeURIComponent(pend)}#settings`);
}

/* POST /class/google/finish { gp } -> { ok } : stores the token for the signed-in teacher who started it. */
export async function gcFinish(request, env) {
  const t = await gcTeacher(env, request);
  if (t.error) return t.error;
  const p = await clsBody(request);
  const d = p && await clsVerify(env, 'gpend', p.gp);
  if (!d) return { status: 400, body: { error: 'That Google sign-in took too long. Press Connect again.' } };
  if (d.u !== t.user.id) return { status: 403, body: { error: 'This Google sign-in was started from another LevlPrep account. Press Connect again.' } };
  if (!(await clsDecrypt(env, d.r))) return { status: 400, body: { error: 'Press Connect again.' } };
  await clsUpsert(env, 'class_oauth', [{
    teacher_id: t.user.id, provider: 'google', refresh_enc: d.r, account_email: d.e || null, scopes: d.s || '', created_at: new Date().toISOString(),
  }], 'teacher_id,provider');
  gcAccessCache.delete(t.user.id);
  return { status: 200, body: { ok: true, class: d.c } };
}

/* POST /class/google/status { class } -> { on, connected, email, linked } (on: false when the flag is off). */
export async function gcStatus(request, env) {
  const user = await clsUser(env, request);
  if (!user) return { status: 401, body: { error: 'Sign in again.' } };
  if (!(await gcAllowed(env, user))) return { status: 200, body: { on: false } };
  const p = await clsBody(request);
  const cls = p && await clsOwnClass(env, user.id, p.class);
  if (!cls) return { status: 404, body: { error: 'Class not found.' } };
  const row = await gcTokenRow(env, user.id);
  return { status: 200, body: { on: true, connected: !!row, email: row ? row.account_email : null, linked: await gcLinkedCourse(env, cls.id) } };
}

/* POST /class/google/disconnect */
export async function gcDisconnect(request, env) {
  const t = await gcTeacher(env, request);
  if (t.error) return t.error;
  const row = await gcTokenRow(env, t.user.id);
  if (row) {
    const refresh = await clsDecrypt(env, row.refresh_enc);
    if (refresh) { try { await timedFetch(`https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(refresh)}`, { method: 'POST' }); } catch { /* deleted below either way */ } }
    await sb(env, `class_oauth?teacher_id=eq.${t.user.id}&provider=eq.google`, { method: 'DELETE' });
  }
  gcAccessCache.delete(t.user.id);
  return { status: 200, body: { ok: true } };
}

/* ------------------------------------------------------------ courses and roster */

/* POST /class/google/courses -> { courses: [{ id, name, section }] } */
export async function gcCourses(request, env) {
  const t = await gcTeacher(env, request);
  if (t.error) return t.error;
  const token = await gcAccess(env, t.user.id);
  if (!token) return gcNeedsConnect;
  try {
    const list = await gcAll(token, '/courses?teacherId=me&courseStates=ACTIVE', 'courses');
    return { status: 200, body: { courses: list.map((c) => ({ id: c.id, name: clsLine(c.name, 100), section: clsLine(c.section, 60) })) } };
  } catch (e) { return gcFailed(e); }
}

/* POST /class/google/link { class, course } (course null to unlink) */
export async function gcLink(request, env) {
  const t = await gcTeacher(env, request);
  if (t.error) return t.error;
  const p = await clsBody(request);
  const cls = p && await clsOwnClass(env, t.user.id, p.class);
  if (!cls) return { status: 404, body: { error: 'Class not found.' } };
  await sb(env, `class_ext_links?class_id=eq.${cls.id}&provider=eq.google`, { method: 'DELETE' });
  if (!p.course) return { status: 200, body: { linked: null } };
  if (!/^[0-9]{1,30}$/.test(String(p.course))) return { status: 400, body: { error: 'Pick a Classroom class.' } };
  const token = await gcAccess(env, t.user.id);
  if (!token) return gcNeedsConnect;
  let course;
  try { course = await gcGet(token, `/courses/${p.course}`); } catch (e) { return gcFailed(e); }
  await clsUpsert(env, 'class_ext_links', [{ class_id: cls.id, provider: 'google', external_id: String(course.id), title: clsLine(course.name, 100) }], 'class_id,provider,external_id');
  return { status: 200, body: { linked: { external_id: String(course.id), title: clsLine(course.name, 100) } } };
}

async function gcRosterFor(env, uid, cls) {
  const link = await gcLinkedCourse(env, cls.id);
  if (!link) return { error: { status: 409, body: { error: 'Link a Classroom class first.' } } };
  const token = await gcAccess(env, uid);
  if (!token) return { error: gcNeedsConnect };
  let students;
  try { students = await gcAll(token, `/courses/${link.external_id}/students`, 'students'); } catch (e) { return { error: gcFailed(e) }; }
  return { link, token, students };
}

/* POST /class/google/roster { class } -> { matched, missing, notInClassroom } */
export async function gcRoster(request, env) {
  const t = await gcTeacher(env, request);
  if (t.error) return t.error;
  const p = await clsBody(request);
  const cls = p && await clsOwnClass(env, t.user.id, p.class);
  if (!cls) return { status: 404, body: { error: 'Class not found.' } };
  const r = await gcRosterFor(env, t.user.id, cls);
  if (r.error) return r.error;
  const people = await clsRpc(env, 'class_member_emails', { p_class: cls.id }) || [];
  const byEmail = new Map(people.filter((m) => m.email).map((m) => [String(m.email).toLowerCase(), m]));
  const matched = [], missing = [], seen = new Set();
  const links = [];
  for (const s of r.students) {
    const email = String((s.profile && s.profile.emailAddress) || '').toLowerCase();
    const gname = clsLine(s.profile && s.profile.name && s.profile.name.fullName, 80);
    const m = email && byEmail.get(email);
    if (m) {
      seen.add(m.id);
      matched.push({ student: m.id, name: m.name, classroom: gname });
      links.push({ class_id: cls.id, student_id: m.id, provider: 'google', external_user: String(s.userId) });
    } else {
      missing.push({ user: String(s.userId), name: gname, email: email || null });
    }
  }
  if (links.length) await clsUpsert(env, 'class_ext_members', links, 'class_id,student_id,provider');
  const notInClassroom = people.filter((m) => !seen.has(m.id)).map((m) => ({ student: m.id, name: m.name }));
  return { status: 200, body: { course: r.link, matched, missing, notInClassroom } };
}

/* POST /class/google/invite { class, users: [Classroom user ids] } -> { sent, skipped } */
export async function gcInvite(request, env) {
  const t = await gcTeacher(env, request);
  if (t.error) return t.error;
  if (!clsMailReady(env)) return { status: 503, body: { error: 'Invite emails are not set up yet. Post the join link in Classroom instead.' } };
  const p = await clsBody(request);
  const cls = p && await clsOwnClass(env, t.user.id, p.class);
  if (!cls) return { status: 404, body: { error: 'Class not found.' } };
  const want = new Set((Array.isArray(p.users) ? p.users : []).map(String).filter((u) => /^[0-9A-Za-z_-]{1,40}$/.test(u)));
  if (!want.size || want.size > 200) return { status: 400, body: { error: 'Pick the students to invite.' } };
  const r = await gcRosterFor(env, t.user.id, cls);
  if (r.error) return r.error;
  const people = await clsRpc(env, 'class_member_emails', { p_class: cls.id }) || [];
  const members = new Set(people.map((m) => String(m.email || '').toLowerCase()));
  const teacher = clsLine(await clsTeacherName(env, t.user.id), 60);
  const join = `${siteUrl(env)}/join.html?c=${encodeURIComponent(cls.code)}`;
  let sent = 0;
  const skipped = [];
  for (const s of r.students) {
    const uid = String(s.userId);
    if (!want.has(uid)) continue;
    const email = String((s.profile && s.profile.emailAddress) || '');
    if (!email) { skipped.push({ user: uid, why: 'no-email' }); continue; }
    if (members.has(email.toLowerCase())) { skipped.push({ user: uid, why: 'already-joined' }); continue; }
    const take = await clsRpc(env, 'class_mail_take', { p_teacher: t.user.id, p_class: cls.id, p_student: null, p_kind: 'invite' });
    if (take !== true) { skipped.push({ user: uid, why: 'limit' }); continue; }
    const first = clsLine(s.profile && s.profile.name && s.profile.name.givenName, 40) || 'there';
    const mail = await clsMail(env, {
      to: email,
      subject: `${teacher} invited you to ${clsLine(cls.name, 60)} on LevlPrep`,
      text: [`Hi ${first},`, '',
        `${teacher} uses LevlPrep for ${clsLine(cls.name, 60)} (${COURSE_NAMES[cls.course] || 'your course'}) and invited you from Google Classroom.`, '',
        `To join, open ${join} and sign in with this school account, or enter the class code ${cls.code}.`, '',
        'Joining is your choice and is for students 13 and older. The join page shows exactly what your teacher will see before you join.', '',
        'You got this one email because you are in your teacher\'s Google Classroom class. LevlPrep does not keep your address unless you sign in.'].join('\n'),
    });
    if (mail.outcome === 'config') return { status: 503, body: { error: 'Invite emails are not set up yet.', sent, skipped } };
    if (mail.ok) sent++; else skipped.push({ user: uid, why: 'send-failed' });
  }
  return { status: 200, body: { sent, skipped } };
}

/* ------------------------------------------------------------ coursework and grades */

export function gcAssignmentUrl(env, course, assignmentId) {
  return `${siteUrl(env)}/${urlCourse(course)}/?la=${encodeURIComponent(assignmentId)}&ref=classroom`;
}

export function gcCourseWork(env, cls, a) {
  const work = {
    title: clsLine(a.title, 120),
    description: `${COURSE_NAMES[cls.course] || 'LevlPrep'} on LevlPrep. Open the link, sign in with your school account, and your work reaches your teacher.`,
    materials: [{ link: { url: gcAssignmentUrl(env, cls.course, a.id), title: clsLine(a.title, 120) } }],
    workType: 'ASSIGNMENT',
    state: 'PUBLISHED',
  };
  if (a.required) work.maxPoints = 100;
  const due = Date.parse(a.due_at || '');
  if (Number.isFinite(due)) {
    const d = new Date(due);
    work.dueDate = { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate() };
    work.dueTime = { hours: d.getUTCHours(), minutes: d.getUTCMinutes() };
  }
  return work;
}

/* POST /class/google/post { class, assignment } -> { posted, link } */
export async function gcPost(request, env) {
  const t = await gcTeacher(env, request);
  if (t.error) return t.error;
  const p = await clsBody(request);
  const cls = p && await clsOwnClass(env, t.user.id, p.class);
  if (!cls) return { status: 404, body: { error: 'Class not found.' } };
  const a = await clsAssignment(env, cls.id, p.assignment);
  if (!a) return { status: 404, body: { error: 'Assignment not found.' } };
  const link = await gcLinkedCourse(env, cls.id);
  if (!link) return { status: 409, body: { error: 'Link a Classroom class first (Settings).' } };
  const prev = await sb(env, `class_ext_assignments?select=external_id&assignment_id=eq.${a.id}&provider=eq.google&limit=1`);
  const had = prev.ok ? (await prev.json())[0] : null;
  if (had) return { status: 200, body: { posted: false, already: true } };
  const token = await gcAccess(env, t.user.id);
  if (!token) return gcNeedsConnect;
  const res = await timedFetch(`${GC_API}/courses/${link.external_id}/courseWork`, {
    method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(gcCourseWork(env, cls, a)),
  });
  if (!res.ok) return gcFailed({ status: res.status });
  const w = await res.json();
  await clsUpsert(env, 'class_ext_assignments', [{ assignment_id: a.id, provider: 'google', external_id: String(w.id), course_id: link.external_id }], 'assignment_id,provider,external_id');
  return { status: 200, body: { posted: true, link: w.alternateLink || null } };
}

/* The grades a teacher sends: [{ student, score: 0..1 }], members of the class only. Shared with LTI. */
export function cleanGrades(raw, memberIds) {
  const ok = new Set(memberIds);
  const out = new Map();
  for (const g of Array.isArray(raw) ? raw.slice(0, 300) : []) {
    const s = Number(g && g.score);
    if (!g || !ok.has(g.student) || !Number.isFinite(s) || s < 0 || s > 1) continue;
    out.set(g.student, Math.round(s * 1000) / 10);
  }
  return out;
}

/* POST /class/google/grades { class, assignment, grades: [{ student, score }] } -> { sent, skipped } */
export async function gcGrades(request, env) {
  const t = await gcTeacher(env, request);
  if (t.error) return t.error;
  const p = await clsBody(request);
  const cls = p && await clsOwnClass(env, t.user.id, p.class);
  if (!cls) return { status: 404, body: { error: 'Class not found.' } };
  const a = await clsAssignment(env, cls.id, p.assignment);
  if (!a) return { status: 404, body: { error: 'Assignment not found.' } };
  if (!a.required) return { status: 400, body: { error: 'Grades go back only for required assignments.' } };
  const er = await sb(env, `class_ext_assignments?select=external_id,course_id&assignment_id=eq.${a.id}&provider=eq.google&limit=1`);
  const ext = er.ok ? (await er.json())[0] : null;
  if (!ext) return { status: 409, body: { error: 'Post this assignment to Classroom first.' } };
  const grades = cleanGrades(p.grades, (await clsMembers(env, cls.id)).map((m) => m.student_id));
  if (!grades.size) return { status: 400, body: { error: 'No grades to send.' } };
  const mr = await sb(env, `class_ext_members?select=student_id,external_user&class_id=eq.${cls.id}&provider=eq.google`);
  const gid = new Map((mr.ok ? await mr.json() : []).map((m) => [m.student_id, m.external_user]));
  const token = await gcAccess(env, t.user.id);
  if (!token) return gcNeedsConnect;
  let subs;
  try { subs = await gcAll(token, `/courses/${ext.course_id}/courseWork/${ext.external_id}/studentSubmissions`, 'studentSubmissions'); } catch (e) { return gcFailed(e); }
  const subByUser = new Map(subs.map((s) => [String(s.userId), s.id]));
  let sent = 0;
  const skipped = [];
  for (const [student, grade] of grades) {
    const g = gid.get(student);
    const sub = g && subByUser.get(g);
    if (!sub) { skipped.push({ student, why: g ? 'no-submission' : 'not-matched' }); continue; }
    const res = await timedFetch(`${GC_API}/courses/${ext.course_id}/courseWork/${ext.external_id}/studentSubmissions/${sub}?updateMask=assignedGrade,draftGrade`, {
      method: 'PATCH', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ assignedGrade: grade, draftGrade: grade }),
    });
    if (res.ok) sent++; else skipped.push({ student, why: `google-${res.status}` });
  }
  return { status: 200, body: { sent, skipped } };
}
