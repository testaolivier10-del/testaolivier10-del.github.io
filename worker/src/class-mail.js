/* Teacher classes, stream C (docs/teacher-classes.md): reminder emails, family progress report links and
   Class Premium quote requests.

   Reminders. Only when a teacher presses Send, only to students in that teacher's class who joined it, never
   on a schedule and never to anyone else (parents are never emailed and their addresses are never stored).
   Co-teachers of the class may send them too. The teacher never sees a student's address: the Worker looks it
   up (class_member_emails) and sends.
   Limits (class_mail_take, atomic in SQL): one teacher reminder per student per 20 hours from any teacher,
   200 a day per teacher, nothing to a student who pressed "stop teacher reminders" in an earlier one; and
   at most 60 students a request. Plain, friendly text, no tracking, no links but the course and the stop link.

   Report links. A teacher (for a student in their class) or the student (for themselves) makes a link that
   shows that student's progress in that class, read only, for 1 to 30 days. Only a SHA-256 of the token is
   stored; leaving the class or removing the student kills every link at once (cascade).

   Quotes. A form for Class Premium by quote or purchase order: stored, emailed to the owner (CLASS_SALES_TO,
   default hello@levlprep.com) with Reply-To the signed-in account, and a short receipt to that account's address
   only (never to a typed address). Typed text loses links and bare domains. Polar, which
   sells Premium, invoices only orders that are already paid (a PDF for every paid order); it has no unpaid
   invoice or net-30 terms, so a purchase order is handled by the owner by email. */
import { sb } from './store.js';
import { siteUrl, apiUrl } from './config.js';
import { COURSE_NAMES, urlCourse } from './premium.js';
import {
  clsUuid, clsBody, clsUser, clsReady, clsTeachClass, clsAssignment, clsText, clsEmailOk, clsIsMember, clsTeacherName, clsRpc,
  clsLine, clsEsc, clsSign, clsVerify, clsRandom, clsHash, clsMail, clsMailReady, clsPage,
} from './class-common.js';

export const CLASS_REMIND_MAX = 60;
export const CLASS_NOTE_MAX = 300;
export const CLASS_REPORT_DAYS = { min: 1, max: 30, default: 14 };
export const CLASS_QUOTES_PER_DAY = 3;

function clsDue(iso, tz) {
  const t = Date.parse(iso || '');
  if (!Number.isFinite(t)) return '';
  let zone = 'UTC';
  try { if (tz) { new Intl.DateTimeFormat('en-US', { timeZone: tz }); zone = tz; } } catch { zone = 'UTC'; }
  return new Intl.DateTimeFormat('en-US', { timeZone: zone, weekday: 'long', month: 'long', day: 'numeric' }).format(new Date(t));
}

const clsFirst = (name) => clsLine(name, 60).split(' ')[0] || 'there';

export function clsStopUrl(env, token) {
  return `${apiUrl(env)}/class/email/stop?s=${encodeURIComponent(token)}`;
}

/* The reminder, as the student reads it. Exported for the tests. */
export function reminderEmail({ student, teacher, className, course, assignment, note, tz, link, stop, now = Date.now() }) {
  const courseName = COURSE_NAMES[course] || 'your course';
  const lines = [`Hi ${clsFirst(student)},`, ''];
  if (assignment) {
    const due = assignment.due_at ? clsDue(assignment.due_at, tz) : '';
    const past = assignment.due_at && Date.parse(assignment.due_at) < now;
    lines.push(`${teacher} sent you a reminder about "${clsLine(assignment.title, 100)}" in ${clsLine(className, 60)} (${courseName}).` +
      (due ? (past ? ` It was due ${due}, and it still counts if you finish it.` : ` It is due ${due}.`) : ''));
  } else {
    lines.push(`${teacher} sent you a reminder about your work in ${clsLine(className, 60)} (${courseName}).`);
  }
  if (note) lines.push('', `${teacher} added: "${note}"`);
  lines.push('', `Open your course: ${link}`, '',
    `You are getting this because you joined ${teacher}'s class on LevlPrep. Your teacher chose to send it; LevlPrep never sends these on its own, and your teacher does not see your email address.`,
    '', `Stop reminders from teachers: ${stop}`);
  const subject = assignment ? `Reminder from ${teacher}: ${clsLine(assignment.title, 80)}` : `A reminder from ${teacher}`;
  return { subject, text: lines.join('\n') };
}

/* POST /class/remind { class, assignment?, students: [ids], note?, tz? } */
export async function classRemind(request, env, now = Date.now()) {
  if (!clsReady(env) || !clsMailReady(env)) return { status: 503, body: { error: 'Reminder emails are not set up yet.' } };
  const user = await clsUser(env, request);
  if (!user) return { status: 401, body: { error: 'Sign in again.' } };
  const p = await clsBody(request);
  if (!p) return { status: 400, body: { error: 'Invalid JSON' } };
  const ids = Array.isArray(p.students) ? [...new Set(p.students.filter(clsUuid))] : [];
  if (!ids.length) return { status: 400, body: { error: 'Pick at least one student.' } };
  if (ids.length > CLASS_REMIND_MAX) return { status: 400, body: { error: `At most ${CLASS_REMIND_MAX} students at a time.` } };
  const tc = await clsTeachClass(env, user.id, p.class);
  const cls = tc && tc.cls;
  if (!cls || cls.archived) return { status: 404, body: { error: 'Class not found.' } };
  let assignment = null;
  if (p.assignment) {
    assignment = await clsAssignment(env, cls.id, p.assignment);
    if (!assignment) return { status: 404, body: { error: 'Assignment not found.' } };
  }
  const note = clsLine(p.note, CLASS_NOTE_MAX);
  const teacher = clsLine(await clsTeacherName(env, user.id), 60);
  const people = await clsRpc(env, 'class_member_emails', { p_class: cls.id });
  const byId = new Map((people || []).map((m) => [m.id, m]));
  const link = `${siteUrl(env)}/${urlCourse(cls.course)}/?ref=class-remind`;
  let sent = 0;
  const skipped = [];
  for (const id of ids) {
    const m = byId.get(id);
    if (!m) { skipped.push({ id, why: 'not-in-class' }); continue; }
    if (assignment && Array.isArray(assignment.students) && !assignment.students.includes(id)) { skipped.push({ id, why: 'not-assigned' }); continue; }
    if (!m.email) { skipped.push({ id, why: 'no-email' }); continue; }
    if (m.optout) { skipped.push({ id, why: 'stopped' }); continue; }
    const take = await clsRpc(env, 'class_mail_take', { p_teacher: user.id, p_class: cls.id, p_student: id, p_kind: 'remind', p_recipient: null });
    if (take !== true) { skipped.push({ id, why: 'limit' }); continue; }
    const stop = clsStopUrl(env, await clsSign(env, 'stop', { u: id }, null));
    const mail = reminderEmail({ student: m.name, teacher, className: cls.name, course: cls.course, assignment, note, tz: p.tz, link, stop, now });
    const r = await clsMail(env, {
      to: m.email, subject: mail.subject, text: mail.text,
      headers: { 'List-Unsubscribe': `<${stop}>`, 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click' },
    });
    if (r.outcome === 'config') return { status: 503, body: { error: 'Reminder emails are not set up yet.', sent, skipped } };
    if (r.ok) sent++; else skipped.push({ id, why: 'send-failed' });
  }
  return { status: 200, body: { sent, skipped } };
}

/* GET /class/email/stop?s=  a confirmation (mail scanners follow links; only the POST acts);
   POST                      stops teacher reminders for that student (also the one-click header). */
export async function classEmailStop(request, env) {
  const url = new URL(request.url);
  const token = url.searchParams.get('s') || '';
  const d = clsReady(env) ? await clsVerify(env, 'stop', token) : null;
  if (!d || !(clsUuid(d.u) || /^[0-9a-f]{64}$/.test(d.h || ''))) {
    return clsPage('Link not valid', '<h1>This link does not work</h1><p>It may have been cut short. Copy the whole link from the email, or reply to your teacher.</p>', { status: 400 });
  }
  if (request.method === 'POST') {
    try {
      if (d.u) await clsRpc(env, 'class_email_stop', { p_student: d.u });
      else await clsRpc(env, 'class_email_stop_addr', { p_hash: d.h });
    } catch {
      return clsPage('Try again', '<h1>That did not work</h1><p>Please try again in a minute.</p>', { status: 503 });
    }
    return clsPage('Stopped', d.u
      ? '<h1>Teacher reminders are off</h1><p>No teacher can send you reminder emails through LevlPrep now. Your classes and your work are not changed.</p>'
      : '<h1>No more invites</h1><p>LevlPrep will not send class invites or teacher reminders to this address again.</p>');
  }
  const action = clsEsc(`${apiUrl(env)}/class/email/stop?s=${encodeURIComponent(token)}`);
  return clsPage('Stop teacher reminders', '<h1>Stop reminder emails from teachers?</h1><p>Your classes stay as they are; only the emails stop.</p>' +
    `<form method="post" action="${action}"><button type="submit">Stop teacher reminders</button></form>`,
  { formAction: clsEsc(apiUrl(env)) });
}

/* ------------------------------------------------------------ family progress reports */

/* Who may make or revoke a link for (class, student): the class's teacher, or the student. */
async function clsReportAllowed(env, uid, classId, studentId) {
  if (!clsUuid(classId) || !clsUuid(studentId)) return false;
  if (uid === studentId) return clsIsMember(env, classId, uid);
  const tc = await clsTeachClass(env, uid, classId);
  return !!tc && clsIsMember(env, classId, studentId);
}

/* POST /class/report-link { class, student, days? } -> { url, expires_at } */
export async function classReportLink(request, env, now = Date.now()) {
  if (!clsReady(env)) return { status: 503, body: { error: 'Share links are not set up yet. Use Print instead.' } };
  const user = await clsUser(env, request);
  if (!user) return { status: 401, body: { error: 'Sign in again.' } };
  const p = await clsBody(request);
  if (!p) return { status: 400, body: { error: 'Invalid JSON' } };
  if (!(await clsReportAllowed(env, user.id, p.class, p.student))) return { status: 404, body: { error: 'Student not found in this class.' } };
  const days = Math.max(CLASS_REPORT_DAYS.min, Math.min(CLASS_REPORT_DAYS.max, Math.round(Number(p.days) || CLASS_REPORT_DAYS.default)));
  const token = clsRandom(24);
  const expires = new Date(now + days * 86400000).toISOString();
  await sb(env, `class_report_links?class_id=eq.${p.class}&student_id=eq.${p.student}&expires_at=lt.${encodeURIComponent(new Date(now).toISOString())}`, { method: 'DELETE' });
  const res = await sb(env, 'class_report_links', {
    method: 'POST', headers: { Prefer: 'return=minimal' },
    body: JSON.stringify({ token_hash: await clsHash(token), class_id: p.class, student_id: p.student, created_by: user.id, expires_at: expires }),
  });
  if (!res.ok) return { status: 503, body: { error: 'Could not make the link. Try again.' } };
  // In the fragment, so the token is never sent to the static host or written in its logs.
  return { status: 200, body: { url: `${siteUrl(env)}/teach/report.html#t=${token}`, expires_at: expires, days } };
}

/* POST /class/report-link/revoke { class, student }: every link for that student in that class. */
export async function classReportRevoke(request, env) {
  if (!clsReady(env)) return { status: 503, body: { error: 'Not set up yet.' } };
  const user = await clsUser(env, request);
  if (!user) return { status: 401, body: { error: 'Sign in again.' } };
  const p = await clsBody(request);
  if (!p || !(await clsReportAllowed(env, user.id, p.class, p.student))) return { status: 404, body: { error: 'Student not found in this class.' } };
  const res = await sb(env, `class_report_links?class_id=eq.${p.class}&student_id=eq.${p.student}`, { method: 'DELETE' });
  return res.ok ? { status: 200, body: { ok: true } } : { status: 503, body: { error: 'Try again.' } };
}

/* POST /class/report { t } -> the report's data, for whoever holds the link. No sign-in. */
export async function classReportGet(request, env) {
  if (!clsReady(env)) return { status: 503, body: { error: 'Not set up yet.' } };
  const p = await clsBody(request);
  const t = p && typeof p.t === 'string' ? p.t : '';
  if (!/^[A-Za-z0-9_-]{20,64}$/.test(t)) return { status: 404, body: { error: 'This link is not valid.' } };
  const data = await clsRpc(env, 'class_report_get', { p_hash: await clsHash(t) });
  if (!data) return { status: 404, body: { error: 'This link has expired or was turned off. Ask for a new one.' } };
  return { status: 200, body: data };
}

/* ------------------------------------------------------------ Class Premium quotes */

const QUOTE_FIELDS = { name: 80, role: 60, school: 120, district: 120, email: 120, phone: 40, students: 10, classes: 10,
  courses: 200, start: 40, po_number: 60, billing: 400, tax_exempt: 10, notes: 1000 };

export function quoteFields(p) {
  const out = {};
  for (const [k, max] of Object.entries(QUOTE_FIELDS)) {
    const v = p && p[k];
    if (v == null || v === '') continue;
    if (k === 'email') { if (clsEmailOk(String(v).trim())) out.email = String(v).trim(); continue; }
    out[k] = k === 'billing' || k === 'notes' ? clsText(v, max) : clsLine(v, max);
  }
  out.kind = p && p.kind === 'po' ? 'po' : 'quote';
  return out;
}

/* POST /class/quote { kind: quote|po, name, school, students, ... } */
export async function classQuote(request, env) {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_KEY || !clsMailReady(env)) {
    return { status: 503, body: { error: 'The form is not set up yet. Email hello@levlprep.com instead.' } };
  }
  const user = await clsUser(env, request);
  if (!user) return { status: 401, body: { error: 'Sign in first, so we can reply to you.' } };
  const p = await clsBody(request);
  if (!p) return { status: 400, body: { error: 'Invalid JSON' } };
  const f = quoteFields(p);
  if (!f.name || !f.school || !(Number(f.students) > 0)) return { status: 400, body: { error: 'Add your name, your school and how many students.' } };
  const since = encodeURIComponent(new Date(Date.now() - 86400000).toISOString());
  const recent = await sb(env, `class_quote_requests?select=id&user_id=eq.${user.id}&created_at=gt.${since}`);
  if (recent.ok && (await recent.json()).length >= CLASS_QUOTES_PER_DAY) {
    return { status: 429, body: { error: 'We already have your request. We answer within two school days.' } };
  }
  // Replies and the receipt go to the signed-in account only; a typed address is shown to the owner, never emailed.
  const reply = user.email || null;
  const saved = await sb(env, 'class_quote_requests', { method: 'POST', headers: { Prefer: 'return=minimal' }, body: JSON.stringify({ user_id: user.id, data: { ...f, account: user.email } }) });
  if (!saved.ok) return { status: 503, body: { error: 'Could not send it. Email hello@levlprep.com instead.' } };
  const label = f.kind === 'po' ? 'Purchase order' : 'Quote';
  const text = [`${label} request for Class Premium`, '',
    ...Object.entries(f).filter(([k]) => k !== 'kind').map(([k, v]) => `${k}: ${v}`),
    '', `Account (reply goes here): ${user.email}`, '',
    'Polar invoices paid orders only; a purchase order needs an invoice from you directly (see docs/teacher-classes.md).'].join('\n');
  const owner = await clsMail(env, { to: env.CLASS_SALES_TO || 'hello@levlprep.com', subject: `${label} request: ${f.school} (${f.students} students)`, text, replyTo: reply || undefined });
  if (!owner.ok) return { status: 503, body: { error: 'Saved, but the email did not go out. We will still see it; you can also email hello@levlprep.com.' } };
  if (reply) {
    await clsMail(env, {
      to: reply, subject: 'We got your Class Premium request',
      text: [`Hi ${clsFirst(f.name)},`, '', `Thanks for asking about Class Premium for ${f.school}. We reply within two school days with a quote` +
        (f.kind === 'po' ? ' and the details your purchasing office needs for the purchase order.' : '.'),
      '', 'Nothing has been charged and nothing changes for your class until you decide.', '', 'LevlPrep', 'hello@levlprep.com'].join('\n'),
    });
  }
  return { status: 200, body: { ok: true } };
}
