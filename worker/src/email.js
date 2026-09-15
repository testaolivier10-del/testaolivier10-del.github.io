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
     SITE_URL           https://levlprep.com

   Unset RESEND_API_KEY and this whole path is skipped, silently and by design:
   the site works without it, and a cron that throws every fifteen minutes
   because a key is missing is noise rather than a signal.
*/

/* The template lives in scripts/email/reminder.html so it can be read and
   edited as a file rather than as a string in a Worker. Inlined here at deploy
   time by whoever pastes this in — kept minimal and in one place so the two
   cannot drift far. */
import { sb, MAX_UNANSWERED, EMAIL_BATCH } from './store.js';

const TEMPLATE = `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>{{TITLE}}</title></head><body style="margin:0;padding:0;background:#F3F6F4;"><div style="display:none;max-height:0;overflow:hidden;opacity:0;">{{BODY}}</div><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F3F6F4;padding:32px 16px;"><tr><td align="center"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:460px;background:#FFFFFF;border-radius:16px;padding:32px 28px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;"><tr><td style="font-size:13px;font-weight:700;color:#127264;letter-spacing:.04em;text-transform:uppercase;padding-bottom:14px;">LevlPrep</td></tr><tr><td style="font-size:21px;font-weight:800;color:#17241F;line-height:1.3;padding-bottom:8px;">{{TITLE}}</td></tr><tr><td style="font-size:15px;font-weight:400;color:#526C66;line-height:1.55;padding-bottom:24px;">{{BODY}}</td></tr><tr><td style="padding-bottom:26px;"><a href="{{URL}}" style="display:inline-block;background:#127264;color:#FFFFFF;font-size:15px;font-weight:700;text-decoration:none;padding:13px 24px;border-radius:12px;">Pick up where you left off</a></td></tr><tr><td style="font-size:12px;font-weight:400;color:#8A9A95;line-height:1.6;border-top:1px solid #E4ECE8;padding-top:18px;">You turned these on in your LevlPrep settings. They only arrive when you actually have work waiting, and they stop by themselves if you stop studying.<br><br><a href="{{UNSUB}}" style="color:#526C66;">Stop sending these</a> &mdash; one click, no sign-in.</td></tr></table></td></tr></table></body></html>`;

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function render(row, env) {
  const site = (env.SITE_URL || 'https://levlprep.com').replace(/\/$/, '');
  const unsub = `${site}/api/unsubscribe?t=${encodeURIComponent(row.unsub_token)}`;
  const url = row.url && row.url.startsWith('http') ? row.url : site + (row.url || '/');
  return TEMPLATE
    .replace(/\{\{TITLE\}\}/g, esc(row.title))
    .replace(/\{\{BODY\}\}/g, esc(row.body))
    .replace(/\{\{URL\}\}/g, esc(url))
    .replace(/\{\{UNSUB\}\}/g, esc(unsub));
}

async function send(row, env) {
  const site = (env.SITE_URL || 'https://levlprep.com').replace(/\/$/, '');
  const unsub = `${site}/api/unsubscribe?t=${encodeURIComponent(row.unsub_token)}`;

  const res = await fetch('https://api.resend.com/emails', {
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
      // Unsubscribe button of its own. Without it, somebody who wants out
      // presses "spam" instead, and that costs the domain's reputation for
      // every message it sends including the password resets.
      headers: {
        'List-Unsubscribe': `<${unsub}>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
      },
    }),
  });

  return {
    ok: res.ok,
    // A hard bounce or a rejected address is not worth retrying tomorrow.
    gone: res.status === 422 || res.status === 400,
    status: res.status,
  };
}

/* One click out of the email, from the footer link. GET, because that is what
   a link in an email is, and it deletes rather than flags. */
export async function unsubscribe(request, env) {
  const token = new URL(request.url).searchParams.get('t');
  const html = (title, note) =>
    new Response(
      `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">` +
      `<title>${title}</title>` +
      `<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#F3F6F4;margin:0;padding:48px 20px;">` +
      `<div style="max-width:420px;margin:0 auto;background:#fff;border-radius:16px;padding:32px 28px;">` +
      `<h1 style="font-size:20px;color:#17241F;margin:0 0 10px;">${title}</h1>` +
      `<p style="font-size:15px;color:#526C66;line-height:1.55;margin:0 0 20px;">${note}</p>` +
      `<a href="${(env.SITE_URL || 'https://levlprep.com')}" style="color:#127264;font-weight:700;">Back to LevlPrep</a>` +
      `</div></body>`,
      { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } });

  if (!token || !env.SUPABASE_SERVICE_KEY) {
    return html('That link didn’t work', 'It may have been cut in half by your mail client. You can also turn reminders off on the privacy page.');
  }

  const res = await sb(env, 'rpc/unsubscribe_email_reminder', {
    method: 'POST',
    body: JSON.stringify({ p_token: token }),
  });
  const removed = res.ok ? await res.json() : false;

  // Both answers are the same page. "That token was already used" is a fact
  // about our database, not about whether this person is going to get another
  // email — and they are not, either way.
  return html(
    removed ? 'Done — no more reminders' : 'You’re already unsubscribed',
    'We won’t email you about studying again. Your account and your progress are untouched, and you can turn reminders back on any time from the privacy page.'
  );
}

/* The cron half. Same shape as the push sender, deliberately: same batch, same
   MAX_UNANSWERED, same "a transient failure keeps its slot" rule. */
export async function runEmailReminders(env) {
  if (!env.RESEND_API_KEY || !env.SUPABASE_SERVICE_KEY) {
    return { skipped: 'no email provider configured' };
  }

  const now = new Date().toISOString();
  const res = await sb(
    env,
    `email_reminders?next_send_at=lte.${now}&next_send_at=not.is.null` +
      `&select=user_id,email,unsub_token,title,body,url,unanswered&order=next_send_at.asc&limit=${EMAIL_BATCH}`,
    { method: 'GET' }
  );
  if (!res.ok) return { error: `read failed: ${res.status}` };

  const due = await res.json();
  let sent = 0, dropped = 0, stopped = 0, failed = 0;

  for (const row of due) {
    let result;
    try {
      result = await send(row, env);
    } catch (e) {
      failed++;
      continue;
    }

    if (result.gone) {
      await sb(env, `email_reminders?user_id=eq.${row.user_id}`, { method: 'DELETE' });
      dropped++;
      continue;
    }
    if (!result.ok) {
      // next_send_at untouched, so the next tick retries. Not counted as
      // unanswered, because nothing reached anybody.
      failed++;
      continue;
    }

    const unanswered = (row.unanswered || 0) + 1;
    const patch = { unanswered, last_sent_at: new Date().toISOString() };
    if (unanswered >= MAX_UNANSWERED) {
      patch.next_send_at = null;
      stopped++;
    } else {
      patch.next_send_at = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    }

    await sb(env, `email_reminders?user_id=eq.${row.user_id}`, {
      method: 'PATCH',
      headers: { Prefer: 'return=minimal' },
      body: JSON.stringify(patch),
    });
    sent++;
  }

  return { due: due.length, sent, dropped, stopped, failed };
}
