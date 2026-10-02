/* The email half of study reminders.

   Push covers most people. It does not cover iOS Safari unless the site has
   been added to the home screen, which is a large share of the people this
   site is for — so there is a second channel, for signed-in students who ask
   for it, and only for them.

   Everything else is the same as the push path: the browser writes the time
   and the sentence, this delivers. See src/reminders.js.

   PROVIDER
   --------
   Resend, because it has a free tier well past this traffic and an API that is
   one POST. Set:

     wrangler secret put RESEND_API_KEY
     REMINDER_FROM      e.g. "LevlPrep <reminders@levlprep.com>" — a verified
                        domain on the provider, not a gmail address, or every
                        message lands in spam
     SITE_URL           https://levlprep.com (the default; links in the
                        email go here, the unsubscribe link goes to API_URL
                        in src/config.js)

   Unset RESEND_API_KEY and this whole path is skipped, silently and by design:
   the site works without it, and a cron that throws every fifteen minutes
   because a key is missing is noise rather than a signal.
*/

/* The template lives in scripts/email/reminder.html so it can be read and
   edited as a file rather than as a string in a Worker. Inlined here at deploy
   time by whoever pastes this in — kept minimal and in one place so the two
   cannot drift far. */
import { sb, timedFetch, MAX_UNANSWERED, EMAIL_BATCH, MAX_FAILURES, RETRY_AFTER_MS, nextDailySend } from './store.js';
import { apiUrl, siteUrl, sitePath } from './config.js';

const TEMPLATE = `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>{{TITLE}}</title></head><body style="margin:0;padding:0;background:#F3F6F4;"><div style="display:none;max-height:0;overflow:hidden;opacity:0;">{{BODY}}</div><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F3F6F4;padding:32px 16px;"><tr><td align="center"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:460px;background:#FFFFFF;border-radius:16px;padding:32px 28px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;"><tr><td style="font-size:13px;font-weight:700;color:#127264;letter-spacing:.04em;text-transform:uppercase;padding-bottom:14px;">LevlPrep</td></tr><tr><td style="font-size:21px;font-weight:800;color:#17241F;line-height:1.3;padding-bottom:8px;">{{TITLE}}</td></tr><tr><td style="font-size:15px;font-weight:400;color:#526C66;line-height:1.55;padding-bottom:24px;">{{BODY}}</td></tr><tr><td style="padding-bottom:26px;"><a href="{{URL}}" style="display:inline-block;background:#127264;color:#FFFFFF;font-size:15px;font-weight:700;text-decoration:none;padding:13px 24px;border-radius:12px;">{{CTA}}</a></td></tr><tr><td style="font-size:12px;font-weight:400;color:#8A9A95;line-height:1.6;border-top:1px solid #E4ECE8;padding-top:18px;">{{FOOTER}}</td></tr></table></td></tr></table></body></html>`;

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

/* `footer` is HTML and is inserted as is, so it is only ever one of the
   fixed strings in this file; everything else is escaped. */
function fill({ title, body, url, cta, footer }) {
  return TEMPLATE
    .replace(/\{\{TITLE\}\}/g, esc(title))
    .replace(/\{\{BODY\}\}/g, esc(body))
    .replace(/\{\{URL\}\}/g, esc(url))
    .replace(/\{\{CTA\}\}/g, esc(cta))
    .replace(/\{\{FOOTER\}\}/g, footer);
}

/* CAN-SPAM wants a valid physical postal address in every commercial email,
   and Gmail's bulk-sender rules look for one. The owner fills this in (a PO
   box or a virtual mailbox is fine) and redeploys; until then it is empty and
   the footer simply leaves the line out. */
export const POSTAL_ADDRESS = '';

function postalLine() {
  return POSTAL_ADDRESS ? `<br><br>LevlPrep &middot; ${esc(POSTAL_ADDRESS)}` : '';
}

/* The unsubscribe address for one row: on the Worker (API_URL), never on
   the site, which is static hosting and cannot act on it. */
export function unsubscribeUrl(row, env) {
  return `${apiUrl(env)}/api/unsubscribe?t=${encodeURIComponent(row.unsub_token)}`;
}

export function render(row, env) {
  const unsub = unsubscribeUrl(row, env);
  return fill({
    title: row.title,
    body: row.body,
    // Only ever a page on this site, whatever the row says.
    url: siteUrl(env) + sitePath(row.url),
    cta: 'Pick up where you left off',
    footer: 'You turned these on in your LevlPrep settings. They only arrive when you actually have work waiting, and they stop by themselves if you stop studying.' +
      `<br><br><a href="${esc(unsub)}" style="color:#526C66;">Stop sending these</a> &mdash; no sign-in needed.` +
      postalLine(),
  });
}

/* What a Resend answer means for the row it was about.

   ok         sent
   gone       this recipient can never be sent to: delete the row
   config     the request itself is wrong (key, sender, domain): stop the
              whole run and touch nothing, because every row would fail the
              same way. A 400 or 422 used to delete the row, so one typo in
              REMINDER_FROM would have deleted every opt-in on the next tick.
   transient  try this row again later */
export async function resendOutcome(res) {
  if (res.ok) return 'ok';
  let body = null;
  try { body = await res.json(); } catch { /* not JSON */ }
  const name = String((body && body.name) || '');
  const message = String((body && body.message) || '');
  if (res.status === 401 || res.status === 403
      || /api_key|from_address|invalid_access|missing_required_field|invalid_region/.test(name)
      || /\bfrom\b|domain|api key/i.test(message)) {
    return 'config';
  }
  if ((res.status === 400 || res.status === 422)
      && /\bto\b|recipient|email address|invalid email/i.test(message)) {
    return 'gone';
  }
  return 'transient';
}

async function send(row, env) {
  const unsub = unsubscribeUrl(row, env);

  const res = await timedFetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: env.REMINDER_FROM || 'LevlPrep <reminders@levlprep.com>',
      to: [row.email],
      subject: row.title,
      html: render(row, env),
      // The header every serious mail client turns into a one-click
      // Unsubscribe button of its own (RFC 8058: the client POSTs to it).
      // Without it, somebody who wants out presses "spam" instead, and that
      // costs the domain's reputation for every message it sends including
      // the password resets.
      headers: {
        'List-Unsubscribe': `<${unsub}>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
      },
    }),
  });

  return { outcome: await resendOutcome(res), status: res.status };
}

/* The one email about a purchase: a pass is about to end. Called by
   runPassEnding() in src/premium.js, which decides who and records that it
   went. It is transactional, sent once per pass, and not covered by the
   study-reminder opt-out (that is a separate list somebody joined), so there
   is no unsubscribe link; the footer says why in one line. */
export async function sendPassEndingEmail(env, { to, courseName, endsOn }) {
  const title = `Your ${courseName} pass ends on ${endsOn}`;
  const body = `Your LevlPrep pass for ${courseName} ends on ${endsOn}. ` +
    'Your progress is kept either way, and if you extend from your account page you pick up exactly where you left off.';
  const res = await timedFetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: env.REMINDER_FROM || 'LevlPrep <reminders@levlprep.com>',
      to: [to],
      subject: title,
      html: fill({
        title,
        body,
        url: `${siteUrl(env)}/account.html`,
        cta: 'Extend your pass',
        footer: 'You’re getting this one-time notice because a pass you bought is ending. It’s about your purchase, not marketing, and we send it once per pass.' +
          postalLine(),
      }),
    }),
  });
  const outcome = await resendOutcome(res);
  return { ok: outcome === 'ok', gone: outcome === 'gone', config: outcome === 'config', status: res.status };
}

/* The way out of the reminder emails, with no sign-in.

   GET (the footer link) shows a page with one button; only the POST it
   sends deletes. Mail scanners and link previewers open every link in a
   message, and a GET that deleted meant people were unsubscribed by their
   own spam filter without ever knowing. The List-Unsubscribe-Post header
   makes Gmail and Apple Mail send that POST themselves (RFC 8058), so their
   one-click button still works in one click. */
const TOKEN_RE = /^[0-9a-f]{20,128}$/i;

function page(env, title, note, extra = '', status = 200) {
  return new Response(
    `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">` +
    `<meta name="robots" content="noindex">` +
    `<title>${esc(title)}</title>` +
    `<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#F3F6F4;margin:0;padding:48px 20px;">` +
    `<main style="max-width:420px;margin:0 auto;background:#fff;border-radius:16px;padding:32px 28px;">` +
    `<h1 style="font-size:20px;color:#17241F;margin:0 0 10px;">${esc(title)}</h1>` +
    `<p style="font-size:15px;color:#526C66;line-height:1.55;margin:0 0 20px;">${esc(note)}</p>` +
    extra +
    `<a href="${esc(siteUrl(env))}/" style="color:#127264;font-weight:700;">Back to LevlPrep</a>` +
    `</main></body></html>`,
    {
      status,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store',
        'Referrer-Policy': 'no-referrer',
        'X-Frame-Options': 'DENY',
        'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; frame-ancestors 'none'; base-uri 'none'",
      },
    });
}

export async function unsubscribe(request, env) {
  const url = new URL(request.url);
  let token = url.searchParams.get('t') || '';
  if (request.method === 'POST' && !token) {
    try { token = String((await request.formData()).get('t') || ''); } catch { /* no form body */ }
  }
  if (!TOKEN_RE.test(token) || !env.SUPABASE_SERVICE_KEY) {
    return page(env, 'That link didn’t work',
      'It may have been cut in half by your mail client. You can also turn reminders off on the privacy page.');
  }

  if (request.method === 'GET' || request.method === 'HEAD') {
    return page(env, 'Stop the reminder emails?',
      'One click and we won’t email you about studying again. Your account and your progress stay as they are.',
      `<form method="post" action="/api/unsubscribe?t=${esc(encodeURIComponent(token))}" style="margin:0 0 20px;">` +
      `<button type="submit" style="font:inherit;font-weight:700;background:#127264;color:#fff;border:0;border-radius:12px;padding:12px 22px;cursor:pointer;">Unsubscribe</button>` +
      `</form>`);
  }
  if (request.method !== 'POST') return page(env, 'Not allowed', 'Use the link in the email.', '', 405);

  const res = await sb(env, 'rpc/unsubscribe_email_reminder', {
    method: 'POST',
    body: JSON.stringify({ p_token: token }),
  });
  if (!res.ok) {
    return page(env, 'That didn’t go through',
      'Something went wrong on our side. Try the link again in a minute, or turn reminders off on the privacy page.', '', 503);
  }
  const removed = await res.json();

  // Both answers are the same page. "That token was already used" is a fact
  // about our database, not about whether this person is going to get another
  // email — and they are not, either way.
  return page(env,
    removed ? 'Done — no more reminders' : 'You’re already unsubscribed',
    'We won’t email you about studying again. Your account and your progress are untouched, and you can turn reminders back on any time from the privacy page.');
}

/* The cron half. Same shape as the push sender, deliberately: same batch, same
   MAX_UNANSWERED, same failure rules (src/store.js). */
export async function runEmailReminders(env, now = Date.now()) {
  if (!env.RESEND_API_KEY || !env.SUPABASE_SERVICE_KEY) {
    return { skipped: 'no email provider configured' };
  }

  const res = await sb(
    env,
    `email_reminders?next_send_at=lte.${new Date(now).toISOString()}&next_send_at=not.is.null` +
      `&select=*&order=next_send_at.asc&limit=${EMAIL_BATCH}`,
    { method: 'GET' }
  );
  if (!res.ok) return { error: `read failed: ${res.status}` };

  const due = await res.json();
  let sent = 0, dropped = 0, stopped = 0, failed = 0, config = null;

  for (const row of due) {
    const where = `email_reminders?user_id=eq.${encodeURIComponent(row.user_id)}`;
    let result;
    try {
      result = await send(row, env);
    } catch (e) {
      result = { outcome: 'transient', status: 0 };
    }

    if (result.outcome === 'config') {
      // Every row would fail the same way. Stop, change nothing, and say so.
      config = result.status;
      console.log('email reminders: provider refused the request itself', result.status);
      break;
    }
    if (result.outcome === 'gone') {
      await sb(env, where, { method: 'DELETE' });
      dropped++;
      continue;
    }
    if (result.outcome !== 'ok') {
      failed++;
      await recordFailure(env, where, row, now);
      continue;
    }

    const unanswered = (row.unanswered || 0) + 1;
    const patch = { unanswered, last_sent_at: new Date(now).toISOString() };
    if ('failures' in row) patch.failures = 0;
    if (unanswered >= MAX_UNANSWERED) {
      patch.next_send_at = null;
      stopped++;
    } else {
      patch.next_send_at = nextDailySend(row.next_send_at, now);
    }

    await sb(env, where, {
      method: 'PATCH',
      headers: { Prefer: 'return=minimal' },
      body: JSON.stringify(patch),
    });
    sent++;
  }

  return { due: due.length, sent, dropped, stopped, failed, ...(config ? { config } : {}) };
}

/* Shared by both channels: back off an hour, and after MAX_FAILURES in a
   row give up on the row. Rows from before the failures column existed
   (the migration not yet applied) keep their slot, as they always did. */
export async function recordFailure(env, where, row, now) {
  if (!('failures' in row)) return;
  const failures = (row.failures || 0) + 1;
  if (failures >= MAX_FAILURES) {
    await sb(env, where, { method: 'DELETE' });
    return;
  }
  await sb(env, where, {
    method: 'PATCH',
    headers: { Prefer: 'return=minimal' },
    body: JSON.stringify({ failures, next_send_at: new Date(now + RETRY_AFTER_MS).toISOString() }),
  });
}
