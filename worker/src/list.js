/* The study list: an email address from a visitor who is NOT signed in (docs/study-list.md).

   Until now the site never asked a signed-out visitor for an address (docs/reminders.md). This is the
   one opt-in box that does: a course's finals or exam plan, and a heads-up before the founding price
   ends. Double opt-in, so nobody is added who did not ask:

     POST /list/join     {email, course, src}  from the site (Origin + throttle in index.js) → one
                         confirmation email with a signed link (7 days). Nothing is stored yet.
     GET  /list/confirm  ?t=<token>  a page with one button (mail scanners open links; only the POST adds)
     POST /list/confirm  t=<token>   adds the contact to the Resend segment RESEND_LIST_SEGMENT.

   Storage is Resend's own contact list, not Supabase: no migration, and every broadcast sent to the
   segment carries Resend's unsubscribe link, so leaving the list needs nothing here.

   Needs RESEND_API_KEY and CLASS_SECRET (both already set) and the var RESEND_LIST_SEGMENT
   (wrangler.toml). Without any of them POST /list/join answers 503 and the site hides the box. */
import { clsSign, clsVerify, clsMail, clsMailReady, clsPage, clsEsc, clsEmailOk, clsBody } from './class-common.js';
import { apiUrl, siteUrl } from './config.js';
import { timedFetch } from './store.js';

const LIST_KIND = 'list-join';
const LIST_TTL = 7 * 24 * 3600;

/* Course keys the box sends; anything else is "all". The words go in the email, nowhere else. */
const LIST_COURSES = {
  nremt: 'NREMT-EMT', ochem: 'Organic Chemistry', anp: 'Anatomy & Physiology',
  apbio: 'AP® Biology', apchem: 'AP® Chemistry', apphys: 'AP® Physics 1', apcalc: 'AP® Calculus AB',
  apcalcbc: 'AP® Calculus BC', apstat: 'AP® Statistics', apenv: 'AP® Environmental Science',
  appsych: 'AP® Psychology', apprecalc: 'AP® Precalculus', apmacro: 'AP® Macroeconomics',
  apmicro: 'AP® Microeconomics', aphug: 'AP® Human Geography', all: 'LevlPrep',
};

export function listReady(env) {
  return clsMailReady(env) && !!env.CLASS_SECRET && !!env.RESEND_LIST_SEGMENT;
}

const listWord = (s, max) => String(s == null ? '' : s).toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, max);

export async function listJoin(request, env) {
  if (!listReady(env)) return { status: 503, body: { error: 'List is off' } };
  const b = await clsBody(request);
  const email = String((b && b.email) || '').trim().toLowerCase();
  if (!clsEmailOk(email)) return { status: 400, body: { error: 'Check the email address' } };
  // A filled hidden field is a bot; answer as if it worked so it learns nothing.
  if (b && b.website) return { status: 200, body: { ok: true } };
  const course = Object.prototype.hasOwnProperty.call(LIST_COURSES, listWord(b && b.course, 12)) ? listWord(b.course, 12) : 'all';
  const src = listWord(b && b.src, 24) || 'direct';
  const token = await clsSign(env, LIST_KIND, { e: email, c: course, s: src }, LIST_TTL);
  const link = `${apiUrl(env)}/list/confirm?t=${encodeURIComponent(token)}`;
  const name = LIST_COURSES[course];
  const sent = await clsMail(env, {
    to: email,
    subject: 'Confirm your LevlPrep study emails',
    text: [
      `Someone (hopefully you) asked for ${name} study emails from LevlPrep.`,
      '',
      'Confirm here:',
      link,
      '',
      'You will get a short study plan before your exam and one reminder before the founding price ends.',
      'Not you? Ignore this email and nothing happens. The link expires in 7 days.',
      '',
      `LevlPrep, ${siteUrl(env)}`,
    ].join('\n'),
  });
  if (!sent.ok) return { status: sent.outcome === 'gone' ? 400 : 502, body: { error: 'Could not send the email' } };
  return { status: 200, body: { ok: true } };
}

/* Resend contact, in the list segment. A contact that already exists (409/422) is added to the
   segment instead, so confirming twice or joining after an earlier unsubscribe both end subscribed. */
async function listAddContact(env, email, course, src) {
  const headers = { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' };
  const seg = String(env.RESEND_LIST_SEGMENT);
  const res = await timedFetch('https://api.resend.com/contacts', {
    method: 'POST', headers,
    body: JSON.stringify({ email, unsubscribed: false, segments: [{ id: seg }] }),
  });
  if (res.ok) return true;
  if (res.status === 409 || res.status === 422) {
    const id = encodeURIComponent(email);
    await timedFetch(`https://api.resend.com/contacts/${id}`, { method: 'PATCH', headers, body: JSON.stringify({ unsubscribed: false }) });
    const r2 = await timedFetch(`https://api.resend.com/contacts/${id}/segments/${encodeURIComponent(seg)}`, { method: 'POST', headers });
    return r2.ok || r2.status === 409 || r2.status === 422;
  }
  console.log('list add failed', res.status, course, src);
  return false;
}

export async function listConfirm(request, env) {
  const url = new URL(request.url);
  let token = url.searchParams.get('t') || '';
  if (request.method === 'POST') {
    const form = await request.formData().catch(() => null);
    token = (form && form.get('t')) || token;
  }
  const v = listReady(env) ? await clsVerify(env, LIST_KIND, String(token)) : null;
  if (!v) {
    return clsPage('Link expired', '<h1>This link has expired</h1><p>Ask for a new one from any course page.</p>' +
      `<p><a class="b" href="${clsEsc(siteUrl(env))}">Back to LevlPrep</a></p>`, { status: 400 });
  }
  const { e: email, c: course, s: src } = v;
  if (request.method !== 'POST') {
    return clsPage('Confirm', `<h1>One tap to confirm</h1><p>Study emails for ${clsEsc(LIST_COURSES[course] || 'LevlPrep')} to ${clsEsc(email)}.</p>` +
      `<form method="post" action="/list/confirm"><input type="hidden" name="t" value="${clsEsc(token)}"><button type="submit">Confirm</button></form>`);
  }
  const ok = await listAddContact(env, email, course, src);
  if (!ok) return clsPage('Try again', '<h1>Something went wrong</h1><p>Open the link in your email again in a minute.</p>', { status: 502 });
  const back = `${siteUrl(env)}/?ref=email-confirm`;
  return clsPage('Confirmed', '<h1>You are on the list</h1><p>Every email has a one-click unsubscribe link at the bottom.</p>' +
    `<p><a class="b" href="${clsEsc(back)}">Keep studying</a></p>`);
}
