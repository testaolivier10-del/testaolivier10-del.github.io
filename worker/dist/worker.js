/* LevlPrep Worker — GENERATED, DO NOT EDIT.
 *
 * Built from worker/src/*.js by scripts/build-worker.mjs. Edit those, then run
 *   node scripts/build-worker.mjs
 * CI fails if this file and the source disagree.
 *
 * This exists so the Worker can be deployed by pasting one file into
 * Cloudflare's dashboard editor, with nothing installed. If you have wrangler,
 * deploy worker/src/ instead and ignore this file — note that the dashboard
 * route cannot create the cron trigger from wrangler.toml, so you have to add
 * it by hand under Settings -> Triggers.
 *
 * Built: store.js, push.js, email.js, reminders.js, premium.js, index.js
 */

/* ===========================================================================
   store.js
   =========================================================================== */

/* Talking to the database, and the two rules both reminder channels share.

   This started as a copy-pasted helper in reminders.js and an identical one in
   email.js, plus the same two constants declared twice. Flattening the Worker
   into one file for the dashboard (scripts/build-worker.mjs) collided them,
   which is a fair way to be told that two identical functions are one
   function. */

/* The site's own database, reached with the service role key so it can see
   tables that row-level security hides from everybody else. push_subscriptions
   and email_reminders have RLS on with no policies at all, like every other
   table here, so this is the only way in — and the key never goes near a
   browser. */
function sb(env, path, init) {
  return fetch(`${env.SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: env.SUPABASE_SERVICE_KEY,
      Authorization: `Bearer ${env.SUPABASE_SERVICE_KEY}`,
      'Content-Type': 'application/json',
      ...(init && init.headers),
    },
  });
}

async function sha256Hex(s) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/* After this many sends with no sign of life, stop. Both channels honour it,
   and they have to honour the same number: somebody with push on one device
   and email on another should not get six nudges for three days' silence.

   A row is only ever written from a page the student is looking at, so
   `unanswered` resetting to zero IS the sign of life — it means they came back.

   Three is deliberate. One is not a reminder, it is a coin flip against whether
   they had their phone. A daily notification forever is how an app gets its
   permission revoked, and a revoked permission cannot be asked for again.
   Three days of "you have work waiting" and then silence is the most a study
   app has earned. */
const MAX_UNANSWERED = 3;

/* Sent at most this many per cron tick, so one run cannot exceed the Worker's
   CPU budget. Anything left over is picked up fifteen minutes later, which for
   a daily reminder is not a delay anybody can perceive.

   Two numbers rather than one called BATCH, because they are not the same
   quantity: handing a push service a payload-less POST is fast, and a round
   trip to an email provider is not, so fewer of the latter fit in a tick. */
const PUSH_BATCH = 200;
const EMAIL_BATCH = 100;

/* ===========================================================================
   push.js
   =========================================================================== */

/* Web Push, from a Cloudflare Worker, with no dependencies.

   The site has a real spaced-repetition scheduler and had no way to tell
   anybody it was due. This is the delivery half.

   WHY THERE IS NO PAYLOAD ENCRYPTION HERE
   ---------------------------------------
   A Web Push message can carry an encrypted payload (RFC 8291: an ECDH key
   agreement with the browser's p256dh key, HKDF, then AES128GCM). Implementing
   that correctly is a few hundred lines of crypto, and getting it subtly wrong
   fails in the worst possible way — a push that silently never arrives.

   It is also unnecessary here. A push with no payload is a valid push: the
   browser wakes the service worker and the service worker asks us what to say,
   over ordinary HTTPS, from the endpoint below. That is one extra round trip
   at a moment nobody is watching, in exchange for deleting the entire
   encryption path. It also means the reminder text is fetched at the moment it
   is shown rather than at the moment it was queued, so it cannot be stale.

   VAPID is still required, and is implemented: it is how a push service knows
   the sender is us and not anybody who scraped an endpoint. A signed ES256 JWT
   plus our public key, per RFC 8292.

   Keys: generate once, keep the private half as a Worker secret.

     node scripts/vapid-keys.mjs

   VAPID_PUBLIC_KEY   also goes into assets/reminders.js — it is public
   VAPID_PRIVATE_KEY  `wrangler secret put VAPID_PRIVATE_KEY`
   VAPID_SUBJECT      a mailto: or https: URL identifying the sender
*/

/* ---- base64url ---------------------------------------------------------- */

function b64urlToBytes(s) {
  const pad = s.replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(pad + '='.repeat((4 - (pad.length % 4)) % 4));
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function bytesToB64url(bytes) {
  let bin = '';
  const b = new Uint8Array(bytes);
  for (let i = 0; i < b.length; i++) bin += String.fromCharCode(b[i]);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/* ---- VAPID -------------------------------------------------------------- */

/* The private key is a raw 32-byte P-256 scalar in base64url, which is what
   every VAPID key generator emits and what WebCrypto will not import. So it is
   rebuilt as a JWK, with the public coordinates taken from the public key —
   they have to agree, or the signature verifies against the wrong key and the
   push service returns 401 with no explanation worth reading. */
async function importPrivateKey(publicB64, privateB64) {
  const pub = b64urlToBytes(publicB64);
  if (pub.length !== 65 || pub[0] !== 0x04) {
    throw new Error('VAPID_PUBLIC_KEY is not an uncompressed P-256 point');
  }
  const jwk = {
    kty: 'EC',
    crv: 'P-256',
    x: bytesToB64url(pub.slice(1, 33)),
    y: bytesToB64url(pub.slice(33, 65)),
    d: bytesToB64url(b64urlToBytes(privateB64)),
    ext: true,
  };
  return crypto.subtle.importKey('jwk', jwk, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']);
}

/* An ES256 JWT, signed by hand because a Worker has no JWT library and this is
   three base64url segments and one WebCrypto call.

   WebCrypto returns the signature as raw r||s, which is exactly what JOSE
   wants — no DER unwrapping, which is the step this usually goes wrong at. */
async function vapidJwt(audience, subject, publicKey, privateKey) {
  const header = bytesToB64url(new TextEncoder().encode(JSON.stringify({ typ: 'JWT', alg: 'ES256' })));
  const claims = bytesToB64url(new TextEncoder().encode(JSON.stringify({
    aud: audience,
    // Twelve hours. The spec caps it at 24; shorter limits what a leaked token
    // is worth and every send mints a fresh one anyway.
    exp: Math.floor(Date.now() / 1000) + 12 * 60 * 60,
    sub: subject,
  })));
  const signingInput = `${header}.${claims}`;
  const key = await importPrivateKey(publicKey, privateKey);
  const sig = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' }, key, new TextEncoder().encode(signingInput));
  return `${signingInput}.${bytesToB64url(sig)}`;
}

/* Send one payload-less push.

   Returns { ok, status, gone }. `gone` is the one that matters operationally:
   404 and 410 mean the browser profile is deleted, the permission was revoked,
   or the subscription expired. Those rows must be deleted, not retried — a
   push service that keeps being asked to deliver to a dead endpoint will
   eventually start rate-limiting the ones that are alive. */
async function sendPush(subscription, env) {
  const url = new URL(subscription.endpoint);
  const audience = `${url.protocol}//${url.host}`;

  let jwt;
  try {
    jwt = await vapidJwt(audience, env.VAPID_SUBJECT || 'mailto:hello@levlprep.com',
                         env.VAPID_PUBLIC_KEY, env.VAPID_PRIVATE_KEY);
  } catch (e) {
    return { ok: false, status: 0, gone: false, error: 'VAPID key problem: ' + e.message };
  }

  const res = await fetch(subscription.endpoint, {
    method: 'POST',
    headers: {
      // No body, so no Content-Encoding and no Content-Type. A push service
      // given TTL 0 drops the message if the device is offline right now;
      // 24 hours means a phone that was in a bag still gets it.
      'TTL': '86400',
      'Urgency': 'low',
      'Content-Length': '0',
      'Authorization': `vapid t=${jwt}, k=${env.VAPID_PUBLIC_KEY}`,
    },
  });

  return {
    ok: res.ok,
    status: res.status,
    gone: res.status === 404 || res.status === 410,
  };
}

/* ===========================================================================
   email.js
   =========================================================================== */

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

/* ?ref=email on the button, so assets/analytics.js can tell a visit the email
   brought from any other: most mail apps send no referrer at all. */
function withRef(url, ref) {
  try {
    const u = new URL(url);
    u.searchParams.set('ref', ref);
    return u.href;
  } catch (e) {
    return url;
  }
}

function render(row, env) {
  const site = (env.SITE_URL || 'https://levlprep.com').replace(/\/$/, '');
  const unsub = `${site}/api/unsubscribe?t=${encodeURIComponent(row.unsub_token)}`;
  const url = withRef(row.url && row.url.startsWith('http') ? row.url : site + (row.url || '/'), 'email');
  return fill({
    title: row.title,
    body: row.body,
    url,
    cta: 'Pick up where you left off',
    footer: 'You turned these on in your LevlPrep settings. They only arrive when you actually have work waiting, and they stop by themselves if you stop studying.' +
      `<br><br><a href="${esc(unsub)}" style="color:#526C66;">Stop sending these</a> &mdash; one click, no sign-in.`,
  });
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

/* The one email about a purchase: a pass is about to end. Called by
   runPassEnding() in src/premium.js, which decides who and records that it
   went. It is transactional, sent once per pass, and not covered by the
   study-reminder opt-out (that is a separate list somebody joined), so there
   is no unsubscribe link; the footer says why in one line. */
async function sendPassEndingEmail(env, { to, courseName, endsOn }) {
  const site = (env.SITE_URL || 'https://levlprep.com').replace(/\/$/, '');
  const title = `Your ${courseName} pass ends on ${endsOn}`;
  const body = `Your LevlPrep pass for ${courseName} ends on ${endsOn}. ` +
    'Your progress is kept either way, and if you extend from your account page you pick up exactly where you left off.';
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: env.REMINDER_FROM || 'LevlPrep <reminders@levlprep.com>',
      to: [to],
      subject: title,
      html: fill({
        title,
        body,
        url: `${site}/account.html`,
        cta: 'Extend your pass',
        footer: 'You’re getting this one-time notice because a pass you bought is ending. It’s about your purchase, not marketing, and we send it once per pass.',
      }),
    }),
  });
  return { ok: res.ok, gone: res.status === 422 || res.status === 400, status: res.status };
}

/* One click out of the email, from the footer link. GET, because that is what
   a link in an email is, and it deletes rather than flags. */
async function unsubscribe(request, env) {
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
async function runEmailReminders(env) {
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

/* ===========================================================================
   reminders.js
   =========================================================================== */

/* The reminder courier.

   Everything that decides WHETHER to remind somebody, WHEN, and WHAT the
   words say happens in the browser (assets/reminders.js). The due counts and
   the streak live in localStorage and never leave it; a server that decided
   when to remind would first have to be told everything the student has ever
   answered, which is the opposite of how the rest of this site works.

   So the browser writes a time and a sentence into one row, and this delivers
   it. Two jobs and nothing else:

     scheduled()   every fifteen minutes, find rows whose time has come, send a
                   payload-less push, and decide whether to schedule another.
     GET /reminders/text
                   what the service worker asks, on waking, for the words to
                   put in the notification.

   Reads and writes go through the Supabase REST API with the service role key,
   because push_subscriptions has RLS on with no policies like every other
   table here — nothing reaching it from a browser can read or write it.

     wrangler secret put SUPABASE_SERVICE_KEY
*/


/* The words for one notification, fetched by the service worker when it wakes.

   Keyed on the endpoint, which the caller must already hold: this returns
   nothing anybody could not already learn by sending that browser a push. It
   deliberately does not accept an id — an id would be a guessable handle on
   somebody else's reminder text. */
async function reminderText(request, env) {
  const endpoint = new URL(request.url).searchParams.get('endpoint');
  if (!endpoint || !endpoint.startsWith('https://')) {
    return new Response(JSON.stringify({ error: 'bad endpoint' }), { status: 400 });
  }

  const id = await sha256Hex(endpoint);
  const res = await sb(env, `push_subscriptions?id=eq.${id}&select=title,body,url`, { method: 'GET' });
  const rows = res.ok ? await res.json() : [];
  const row = rows[0];

  // A subscription we no longer have a row for still gets something to show.
  // The alternative is a notification that says "undefined", or a push the
  // service worker cannot answer — and a service worker that receives a push
  // and shows nothing is, on most platforms, a permission the browser revokes.
  return new Response(JSON.stringify(row || {
    title: 'Time to study',
    body: 'Pick up where you left off.',
    url: '/',
  }), { headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
}

/* The cron. Runs on whatever schedule wrangler.toml declares. */
async function runReminders(env) {
  if (!env.SUPABASE_SERVICE_KEY || !env.VAPID_PRIVATE_KEY) {
    // Not configured is not an error: the site works without reminders, and a
    // half-configured cron that throws every fifteen minutes is noise.
    return { skipped: 'not configured' };
  }

  const now = new Date().toISOString();
  const res = await sb(
    env,
    `push_subscriptions?next_send_at=lte.${now}&next_send_at=not.is.null` +
      `&select=id,endpoint,p256dh,auth,unanswered&order=next_send_at.asc&limit=${PUSH_BATCH}`,
    { method: 'GET' }
  );
  if (!res.ok) return { error: `read failed: ${res.status}` };

  const due = await res.json();
  let sent = 0, dropped = 0, stopped = 0, failed = 0;

  for (const row of due) {
    let result;
    try {
      result = await sendPush(row, env);
    } catch (e) {
      failed++;
      continue;
    }

    if (result.gone) {
      // The endpoint is dead: profile deleted, permission revoked, or expired.
      // Delete rather than retry — a push service asked repeatedly to deliver
      // to dead endpoints starts rate-limiting the live ones.
      await sb(env, `push_subscriptions?id=eq.${row.id}`, { method: 'DELETE' });
      dropped++;
      continue;
    }

    if (!result.ok) {
      // A transient failure keeps its slot: next_send_at is untouched, so the
      // next tick tries again. It does NOT count as unanswered, because
      // nothing reached anybody.
      failed++;
      continue;
    }

    const unanswered = (row.unanswered || 0) + 1;
    const patch = { unanswered, last_sent_at: new Date().toISOString() };

    if (unanswered >= MAX_UNANSWERED) {
      // Silence, until the browser writes a row again — which only happens
      // from a page the student is looking at.
      patch.next_send_at = null;
      stopped++;
    } else {
      // Same time tomorrow. Adding 24 hours to the time that just fired keeps
      // the student's chosen hour without this having to know what it was.
      patch.next_send_at = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    }

    await sb(env, `push_subscriptions?id=eq.${row.id}`, {
      method: 'PATCH',
      headers: { Prefer: 'return=minimal' },
      body: JSON.stringify(patch),
    });
    sent++;
  }

  return { due: due.length, sent, dropped, stopped, failed };
}

/* ===========================================================================
   premium.js
   =========================================================================== */

/* Premium passes: the checkout and the webhook that records a purchase.

   The browser half is assets/premium.js; the table is premium_passes in
   scripts/sql/schema.sql; the plan is docs/premium.md.

   Two routes, and they trust different things:

   POST /premium/checkout  called by the site, with the student's Supabase
     session. We ask Supabase who that is, then ask Polar for a checkout page
     for that person and that pass, and hand the browser its URL. Nothing is
     written here: a checkout that is opened and abandoned leaves no trace.

   POST /premium/webhook   called by Polar, never by a browser. The only thing
     that makes it trustworthy is the Standard Webhooks signature, so that is
     checked before the body is even parsed. A paid order becomes one row in
     premium_passes; a refunded one gets refunded_at.

   Payment is confirmed by the webhook alone, never by the redirect back to the
   site. ?premium=success in a URL is something anybody can type.

   The cron (bottom of this file) sends the one "your pass ends soon" email
   and, hourly, reconciles against Polar's own order and dispute records. */



/* Must match `passes[].id` in assets/premium.js (scripts/test checks it).
   `days` is what one purchase adds. Semester is five months, so a pass bought
   in late August covers finals in January. */
const PASSES = {
  'nremt-90':       { course: 'nremt', days: 90 },
  'ochem-semester': { course: 'ochem', days: 150 },
  'ochem-year':     { course: 'ochem', days: 365 },
  'anp-semester':   { course: 'anp',   days: 150 },
  'anp-year':       { course: 'anp',   days: 365 },
};

const isPass = (id) => typeof id === 'string' && Object.prototype.hasOwnProperty.call(PASSES, id);

const SITE = 'https://levlprep.com';
const DAY_MS = 86400000;
// Standard Webhooks suggests five minutes, but Polar's "Redeliver" resends an
// event with its original timestamp, so a failed order could never be
// recovered once five minutes had passed. Three days is safe here because a
// replayed event cannot do anything twice: an order is recorded once (order_id
// is unique) and a refund only touches a pass not yet refunded.
const WEBHOOK_TOLERANCE_S = 3 * 24 * 60 * 60;

/* Where Polar may send the student back to. Only our own site: an open
   redirect on a payment page is a phishing kit somebody else gets for free. */
function safeReturnTo(raw) {
  let u;
  try { u = new URL(String(raw || '')); } catch { return SITE + '/'; }
  if (u.protocol !== 'https:' || u.hostname !== 'levlprep.com' || u.port || u.username || u.password) {
    return SITE + '/';
  }
  return u.href;
}

/* returnTo plus what handleReturn() in assets/premium.js reads. The fragment
   goes, or the query added after it would land inside the hash. The checkout
   id is appended by hand: Polar replaces the literal `{CHECKOUT_ID}`, and
   URLSearchParams would percent-encode the braces out of recognition. */
function successUrl(returnTo, course) {
  const u = new URL(safeReturnTo(returnTo));
  u.hash = '';
  u.searchParams.delete('checkout_id');
  u.searchParams.set('premium', 'success');
  u.searchParams.set('course', course);
  return u.href + '&checkout_id={CHECKOUT_ID}';
}

/* POLAR_PRODUCTS is JSON, passId -> Polar product id. Kept in a variable
   rather than in this file so sandbox and production can differ. */
function productMap(env) {
  try {
    const m = JSON.parse(env.POLAR_PRODUCTS || '{}');
    return m && typeof m === 'object' ? m : {};
  } catch {
    return {};
  }
}

function passForProduct(env, productId) {
  if (!productId) return null;
  const hit = Object.entries(productMap(env)).find(([pass, id]) => id === productId && isPass(pass));
  return hit ? hit[0] : null;
}

function polarApi(env) {
  return (env.POLAR_API || 'https://api.polar.sh').replace(/\/+$/, '');
}

/* Returns { status, body }; index.js adds the CORS headers. */
async function premiumCheckout(request, env) {
  const token = (request.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '').trim();
  if (!token) return { status: 401, body: { error: 'Sign in first.' } };

  let payload;
  try { payload = await request.json(); } catch { return { status: 400, body: { error: 'Invalid JSON' } }; }

  const passId = String(payload?.pass || '');
  const pass = isPass(passId) ? PASSES[passId] : null;
  if (!pass) return { status: 400, body: { error: 'Unknown pass' } };

  const products = productMap(env);
  const productId = Object.prototype.hasOwnProperty.call(products, passId) ? products[passId] : null;
  if (!env.POLAR_ACCESS_TOKEN || !productId || !env.SUPABASE_URL || !env.SUPABASE_SERVICE_KEY) {
    return { status: 503, body: { error: 'Checkout is not set up yet.' } };
  }

  // Who is this? Supabase answers for its own tokens; we never decode one
  // ourselves, so an expired or revoked session is refused here too.
  const who = await fetch(`${env.SUPABASE_URL}/auth/v1/user`, {
    headers: { apikey: env.SUPABASE_SERVICE_KEY, Authorization: `Bearer ${token}` },
  });
  if (!who.ok) return { status: 401, body: { error: 'Your session has expired. Sign in again.' } };
  const user = await who.json();
  if (!user?.id) return { status: 401, body: { error: 'Your session has expired. Sign in again.' } };

  const body = {
    products: [productId],
    external_customer_id: user.id,
    metadata: { user_id: user.id, pass: passId },
    success_url: successUrl(payload?.returnTo, pass.course),
  };
  if (user.email) body.customer_email = user.email;
  if (env.FOUNDING_DISCOUNT_ID) body.discount_id = env.FOUNDING_DISCOUNT_ID;

  const res = await fetch(`${polarApi(env)}/v1/checkouts/`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.POLAR_ACCESS_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    console.log('polar checkout failed', res.status, (await res.text()).slice(0, 300));
    return { status: 502, body: { error: 'Checkout is unavailable. Nothing was charged.' } };
  }
  const checkout = await res.json();
  if (!checkout?.url) return { status: 502, body: { error: 'Checkout is unavailable. Nothing was charged.' } };
  return { status: 200, body: { url: checkout.url } };
}

/* POST /premium/refund: a self-serve refund from the account page, with no
   approval step. The rules live here, not in the page, so they cannot be
   skipped by anyone calling this route directly:

   - the order must be the caller's own, a real purchase (not a free month
     or a guarantee extension) and not already refunded;
   - within REFUND_WINDOW_DAYS of buying, as the terms promise;
   - once per account, ever. Any refund already on the account (self-serve
     or made by hand in Polar) means the next one goes through email, so a
     buy-use-refund loop runs exactly once. The account's email is also
     written to premium_ledger (as a hash), which deleting the account does
     not clear, so deleting and re-creating it does not reset the limit.

   Polar refunds the pre-tax amount and the tax with it. The pass is marked
   refunded here at once; order.refunded from Polar then finds nothing left
   to change. */
const REFUND_WINDOW_DAYS = 7;

function refundRefusal(row, priorRefunds, now) {
  if (!row || !row.order_id || !(row.amount_cents > 0)) return 'That purchase can’t be refunded here.';
  if (row.refunded_at) return 'That purchase has already been refunded.';
  if (now - Date.parse(row.created_at) > REFUND_WINDOW_DAYS * DAY_MS) {
    return `Refunds are available for ${REFUND_WINDOW_DAYS} days after buying, and this purchase is older than that.`;
  }
  if (priorRefunds > 0) return 'This account has already had its one refund, so this purchase can’t be refunded.';
  return null;
}

async function premiumRefund(request, env, now = Date.now()) {
  const token = (request.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '').trim();
  if (!token) return { status: 401, body: { error: 'Sign in first.' } };
  let payload;
  try { payload = await request.json(); } catch { return { status: 400, body: { error: 'Invalid JSON' } }; }
  const orderId = String(payload?.order_id || '');
  if (!/^[0-9a-f-]{36}$/i.test(orderId)) return { status: 400, body: { error: 'Unknown purchase.' } };
  if (!env.POLAR_ACCESS_TOKEN || !env.SUPABASE_URL || !env.SUPABASE_SERVICE_KEY) {
    return { status: 503, body: { error: 'Refunds are not set up yet.' } };
  }

  const who = await fetch(`${env.SUPABASE_URL}/auth/v1/user`, {
    headers: { apikey: env.SUPABASE_SERVICE_KEY, Authorization: `Bearer ${token}` },
  });
  const user = who.ok ? await who.json() : null;
  if (!user?.id) return { status: 401, body: { error: 'Your session has expired. Sign in again.' } };

  const uid = encodeURIComponent(user.id);
  const key = await emailKey(user.email);
  const [rowRes, priorRes, ledger] = await Promise.all([
    sb(env, `premium_passes?select=order_id,amount_cents,refunded_at,created_at&user_id=eq.${uid}` +
      `&order_id=eq.${encodeURIComponent(orderId)}&limit=1`),
    sb(env, `premium_passes?select=id&user_id=eq.${uid}&order_id=not.is.null&refunded_at=not.is.null&limit=1`),
    ledgerHas(env, key, 'refund'),
  ]);
  if (!rowRes.ok || !priorRes.ok || ledger === null) return { status: 500, body: { error: 'Couldn’t check that purchase. Try again.' } };
  const row = (await rowRes.json())[0];
  const prior = (await priorRes.json()).length + (ledger ? 1 : 0);
  const refusal = refundRefusal(row, prior, now);
  if (refusal) return { status: 409, body: { error: refusal } };
  // Claimed before Polar is asked, so two clicks at once cannot both refund:
  // the second insert hits the unique key. Released if Polar says no.
  const claimed = await ledgerAdd(env, key, 'refund');
  if (claimed === 'taken') return { status: 409, body: { error: refundRefusal(row, 1, now) } };
  if (claimed !== 'ok') return { status: 500, body: { error: 'Couldn’t check that purchase. Try again.' } };

  const res = await fetch(`${polarApi(env)}/v1/refunds/`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.POLAR_ACCESS_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      order_id: orderId,
      reason: 'customer_request',
      amount: row.amount_cents,
      comment: 'Self-serve refund from the levlprep.com account page',
    }),
  });
  if (!res.ok) {
    console.log('polar refund failed', res.status, (await res.text()).slice(0, 300));
    await ledgerRemove(env, key, 'refund');
    return { status: 502, body: { error: 'The refund didn’t go through automatically. Email us and we’ll sort it out.' } };
  }
  await sb(env, `premium_passes?order_id=eq.${encodeURIComponent(orderId)}&refunded_at=is.null`, {
    method: 'PATCH',
    headers: { Prefer: 'return=minimal' },
    body: JSON.stringify({ refunded_at: new Date(now).toISOString() }),
  });
  return { status: 200, body: { ok: true } };
}

/* premium_ledger: what an email address has already used, kept after the
   account is deleted. Only a hash of the lower-cased address is stored, and
   only the Worker (service role) can read it. One row per address and kind,
   so inserting doubles as the lock. */
async function emailKey(email) {
  // Every account here has an address; without one there is nothing to key
  // on, and the per-account checks still apply.
  if (!String(email || '').trim()) return null;
  return sha256Hex('levlprep-ledger:' + String(email || '').trim().toLowerCase());
}

async function ledgerHas(env, key, kind) {
  if (!key) return false;
  const res = await sb(env, `premium_ledger?select=kind&email_key=eq.${key}&kind=eq.${kind}&limit=1`);
  if (!res.ok) return null;
  return (await res.json()).length > 0;
}

async function ledgerAdd(env, key, kind) {
  if (!key) return 'ok';
  const res = await sb(env, 'premium_ledger', {
    method: 'POST',
    headers: { Prefer: 'return=minimal' },
    body: JSON.stringify({ email_key: key, kind }),
  });
  if (res.status === 409) return 'taken';
  return res.ok ? 'ok' : 'error';
}

async function ledgerRemove(env, key, kind) {
  if (!key) return;
  await sb(env, `premium_ledger?email_key=eq.${key}&kind=eq.${kind}`, { method: 'DELETE' });
}

/* POST /premium/guarantee: the NREMT pass guarantee, claimed from the account
   page with no approval step. Nobody can prove they failed (the National
   Registry publishes who is certified, not who failed), so the rules keep
   what a false claim can win small and make it checkable afterwards:

   - an NREMT pass that was bought (not a free month), not refunded;
   - the exam date falls inside that paid pass and is at most
     GUARANTEE.claimDays ago;
   - at least GUARANTEE.minExams full timed exams in the account's synced
     history, taken during the paid pass and before the exam date, so the
     pass was actually used to prepare;
   - once per account and per email address, ever (premium_ledger again);
   - the claim records the legal name and state the candidate tested under,
     so it can be checked against the Registry's public certification
     lookup. The terms say a claim from someone already certified ends the
     extension.

   It adds GUARANTEE.extendDays, starting when the current pass ends. */
const GUARANTEE = { claimDays: 30, extendDays: 90, minExams: 2 };

function guaranteeRefusal({ passes, examDate, history, used, now }) {
  const paid = (passes || []).filter((p) => p.order_id && p.amount_cents > 0 && !p.refunded_at);
  if (!paid.length) return 'The pass guarantee comes with a bought NREMT pass, and this account doesn’t have one.';
  if (used) return 'This account has already used its pass guarantee.';
  const exam = Date.parse(examDate + 'T12:00:00Z');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(examDate)) || !Number.isFinite(exam)) return 'Enter the date of your exam.';
  if (exam > now + DAY_MS) return 'The exam date can’t be in the future.';
  if (now - exam > GUARANTEE.claimDays * DAY_MS) {
    return `Claims are made within ${GUARANTEE.claimDays} days of the exam, and that date is older than that.`;
  }
  // A day either side, since the date is the candidate's own calendar day.
  const during = paid.find((p) => exam >= Date.parse(p.starts_at) - DAY_MS && exam <= Date.parse(p.expires_at) + DAY_MS);
  if (!during) return 'The exam has to fall within a bought NREMT pass.';
  const from = Math.min(...paid.map((p) => Date.parse(p.starts_at)));
  const exams = (history || []).filter((h) => h && Number(h.date) >= from && Number(h.date) <= exam + DAY_MS).length;
  if (exams < GUARANTEE.minExams) {
    return `The guarantee needs at least ${GUARANTEE.minExams} full timed exams taken during your pass, before the real exam. ` +
      `This account has ${exams}. (Exams count once your progress has synced while signed in.)`;
  }
  return null;
}

// The synced NREMT exam history: user_progress.data is { v: 2, ns: { nremt } }
// (older rows are the nremt keys flat), each value the raw localStorage string.
function examHistory(data) {
  const ns = data && data.v === 2 ? data.ns && data.ns.nremt : data;
  try {
    const list = JSON.parse((ns && ns.nremt_exam100_history) || '[]');
    return Array.isArray(list) ? list : [];
  } catch { return []; }
}

async function premiumGuarantee(request, env, now = Date.now()) {
  const token = (request.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '').trim();
  if (!token) return { status: 401, body: { error: 'Sign in first.' } };
  let payload;
  try { payload = await request.json(); } catch { return { status: 400, body: { error: 'Invalid JSON' } }; }
  const examDate = String(payload?.exam_date || '');
  const name = String(payload?.legal_name || '').trim().replace(/\s+/g, ' ');
  const state = String(payload?.state || '').trim().replace(/\s+/g, ' ');
  if (name.length < 3 || name.length > 100) return { status: 400, body: { error: 'Enter your full legal name as the Registry has it.' } };
  if (state.length < 2 || state.length > 40) return { status: 400, body: { error: 'Enter the state you tested for.' } };
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_KEY) return { status: 503, body: { error: 'This isn’t set up yet.' } };

  const who = await fetch(`${env.SUPABASE_URL}/auth/v1/user`, {
    headers: { apikey: env.SUPABASE_SERVICE_KEY, Authorization: `Bearer ${token}` },
  });
  const user = who.ok ? await who.json() : null;
  if (!user?.id) return { status: 401, body: { error: 'Your session has expired. Sign in again.' } };

  const uid = encodeURIComponent(user.id);
  const key = await emailKey(user.email);
  const [passRes, progRes, ledger] = await Promise.all([
    sb(env, `premium_passes?select=pass,order_id,amount_cents,refunded_at,starts_at,expires_at&user_id=eq.${uid}&course=eq.nremt`),
    sb(env, `user_progress?select=data&id=eq.${uid}&limit=1`),
    ledgerHas(env, key, 'guarantee'),
  ]);
  if (!passRes.ok || !progRes.ok || ledger === null) return { status: 500, body: { error: 'Couldn’t check your account. Try again.' } };
  const passes = await passRes.json();
  const prog = (await progRes.json())[0];
  const used = ledger || passes.some((p) => p.pass === 'guarantee');
  const refusal = guaranteeRefusal({ passes, examDate, history: examHistory(prog && prog.data), used, now });
  if (refusal) return { status: 409, body: { error: refusal } };

  const claimed = await ledgerAdd(env, key, 'guarantee');
  if (claimed === 'taken') return { status: 409, body: { error: 'This account has already used its pass guarantee.' } };
  if (claimed !== 'ok') return { status: 500, body: { error: 'Couldn’t check your account. Try again.' } };

  const startsAt = await startFor(env, user.id, 'nremt', now);
  const expiresAt = new Date(startsAt.getTime() + GUARANTEE.extendDays * DAY_MS);
  const [claimRes, passIns] = await Promise.all([
    sb(env, 'premium_guarantee_claims', {
      method: 'POST',
      headers: { Prefer: 'return=minimal' },
      body: JSON.stringify({ user_id: user.id, legal_name: name, state, exam_date: examDate }),
    }),
    sb(env, 'premium_passes', {
      method: 'POST',
      headers: { Prefer: 'return=minimal' },
      body: JSON.stringify({
        user_id: user.id, course: 'nremt', pass: 'guarantee',
        starts_at: startsAt.toISOString(), expires_at: expiresAt.toISOString(),
      }),
    }),
  ]);
  if (!passIns.ok) {
    console.log('guarantee insert failed', passIns.status, (await passIns.text()).slice(0, 200));
    await ledgerRemove(env, key, 'guarantee');
    return { status: 500, body: { error: 'That didn’t go through. Try again in a moment.' } };
  }
  if (!claimRes.ok) console.log('guarantee claim record failed', claimRes.status);
  return { status: 200, body: { ok: true, expires_at: expiresAt.toISOString() } };
}

function bytesToBase64(bytes) {
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s);
}

/* Standard Webhooks. Polar has used two keys, and which one signs depends on
   when the endpoint's secret was made (polar.sh/docs, webhook delivery):

   - secrets from September 8, 2026 on: plain Standard Webhooks. Drop the
     `whsec_` prefix and base64-decode the rest; those bytes are the key.
   - older secrets: the key is the UTF-8 bytes of the whole `whsec_...`
     string (polar-js used to base64-encode it before handing it over).

   Polar's own SDKs try both, so this does too. Shipping only the second one
   rejected every real order from a new endpoint with "Bad signature".
   Signed content: `${webhook-id}.${webhook-timestamp}.${raw body}`; the
   header holds space-separated `v1,<base64>` entries, any of which may match. */
function webhookKeys(secret) {
  const keys = [];
  const body = secret.startsWith('whsec_') ? secret.slice(6) : secret;
  try {
    const bin = atob(body);
    if (bin.length) keys.push(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
  } catch { /* not base64: only the legacy key applies */ }
  keys.push(new TextEncoder().encode(secret));
  return keys;
}

async function verifyWebhook(rawBody, headers, secret, nowSeconds = Math.floor(Date.now() / 1000)) {
  const get = (k) => (typeof headers.get === 'function' ? headers.get(k) : headers[k]) || '';
  const id = get('webhook-id');
  const ts = get('webhook-timestamp');
  const sigs = get('webhook-signature');
  // A secret pasted into the dashboard can pick up a space or a newline.
  secret = String(secret || '').trim();
  if (!secret || !id || !ts || !sigs) {
    console.log('premium webhook: missing', JSON.stringify({ secret: !!secret, id: !!id, ts: !!ts, sigs: !!sigs }));
    return false;
  }

  const t = Number(ts);
  if (!Number.isInteger(t) || Math.abs(nowSeconds - t) > WEBHOOK_TOLERANCE_S) {
    console.log('premium webhook: timestamp outside tolerance', ts);
    return false;
  }

  const signed = new TextEncoder().encode(`${id}.${ts}.${rawBody}`);
  const expected = [];
  for (const raw of webhookKeys(secret)) {
    const key = await crypto.subtle.importKey('raw', raw, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    expected.push(bytesToBase64(new Uint8Array(await crypto.subtle.sign('HMAC', key, signed))));
  }

  const ok = sigs.split(' ').some((entry) => {
    const [version, sig] = entry.split(',');
    if (version !== 'v1' || !sig) return false;
    return expected.some((exp) => {
      if (sig.length !== exp.length) return false;
      let diff = 0;
      for (let i = 0; i < sig.length; i++) diff |= sig.charCodeAt(i) ^ exp.charCodeAt(i);
      return diff === 0;
    });
  });
  // Never logs the secret; the prefix and length are enough to tell a
  // pasted access token or a truncated paste from the real thing.
  if (!ok) console.log('premium webhook: no signature matched', JSON.stringify({ secretPrefix: secret.slice(0, 6), secretLength: secret.length }));
  return ok;
}

/* A pass bought while one is still running starts when that one ends, so
   buying early never throws days away. Refunded passes do not count. */
async function startFor(env, userId, course, now) {
  const res = await sb(env,
    `premium_passes?select=expires_at&user_id=eq.${encodeURIComponent(userId)}` +
    `&course=eq.${course}&refunded_at=is.null&order=expires_at.desc&limit=1`);
  if (!res.ok) throw new Error(`read passes ${res.status}`);
  const rows = await res.json();
  const latest = rows?.[0]?.expires_at ? Date.parse(rows[0].expires_at) : 0;
  return new Date(Math.max(now, latest || 0));
}

async function recordPaid(env, order, now) {
  const userId = order.metadata?.user_id || order.customer?.external_id || null;
  const passId = (isPass(order.metadata?.pass) ? order.metadata.pass : null)
    || passForProduct(env, order.product_id || order.product?.id);
  const pass = passId ? PASSES[passId] : null;
  if (!userId || !pass || !order.id) {
    // Retrying cannot fix this, so do not ask Polar to. The log is the trail.
    console.log('premium: order.paid not attributable', JSON.stringify({ order: order.id, userId, passId }));
    return { status: 200, body: { ok: true, ignored: 'unattributable' } };
  }

  const startsAt = await startFor(env, userId, pass.course, now);
  const expiresAt = new Date(startsAt.getTime() + pass.days * DAY_MS);
  const res = await sb(env, 'premium_passes', {
    method: 'POST',
    headers: { Prefer: 'return=minimal' },
    body: JSON.stringify({
      user_id: userId,
      course: pass.course,
      pass: passId,
      starts_at: startsAt.toISOString(),
      expires_at: expiresAt.toISOString(),
      order_id: order.id,
      amount_cents: Number.isInteger(order.net_amount) ? order.net_amount : null,
    }),
  });
  // order_id is unique: a second delivery of the same order is a 409 from
  // PostgREST, and the pass it would add already exists.
  if (res.status === 409) return { status: 200, body: { ok: true, duplicate: true } };
  if (!res.ok) throw new Error(`insert pass ${res.status}: ${(await res.text()).slice(0, 200)}`);
  return { status: 200, body: { ok: true } };
}

// Only a full refund takes the pass away. A partial one is a goodwill
// gesture, and revoking access for it would turn that into a penalty.
function isFullRefund(order) {
  return order.status === 'refunded'
    || (Number.isInteger(order.refunded_amount) && Number.isInteger(order.total_amount)
        && order.total_amount > 0 && order.refunded_amount >= order.total_amount);
}

async function recordRefund(env, order, now) {
  if (!order.id || !isFullRefund(order)) return { status: 200, body: { ok: true, ignored: 'partial' } };
  const res = await sb(env,
    `premium_passes?order_id=eq.${encodeURIComponent(order.id)}&refunded_at=is.null`, {
      method: 'PATCH',
      headers: { Prefer: 'return=minimal' },
      body: JSON.stringify({ refunded_at: new Date(now).toISOString() }),
    });
  if (!res.ok) throw new Error(`refund pass ${res.status}`);
  return { status: 200, body: { ok: true } };
}

/* Revoke the passes of these orders, the same way a refund does: refunded_at
   set, so my_premium() stops counting them. Returns how many changed. */
async function revokeOrders(env, orderIds, now) {
  let changed = 0;
  for (let i = 0; i < orderIds.length; i += 100) {
    const list = orderIds.slice(i, i + 100).map((id) => `"${String(id).replace(/"/g, '')}"`).join(',');
    const res = await sb(env, `premium_passes?order_id=in.(${encodeURIComponent(list)})&refunded_at=is.null&select=order_id`, {
      method: 'PATCH',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify({ refunded_at: new Date(now).toISOString() }),
    });
    if (!res.ok) throw new Error(`revoke passes ${res.status}`);
    changed += (await res.json()).length;
  }
  return changed;
}

/* Returns { status, body }. A 5xx makes Polar retry, which is what we want
   when the database blinked; everything else gets a 2xx so an event we do not
   handle never piles up as failed deliveries. */
async function premiumWebhook(request, env, now = Date.now()) {
  const raw = await request.text();
  const ok = await verifyWebhook(raw, request.headers, env.POLAR_WEBHOOK_SECRET, Math.floor(now / 1000));
  if (!ok) return { status: 403, body: { error: 'Bad signature' } };

  let event;
  try { event = JSON.parse(raw); } catch { return { status: 400, body: { error: 'Invalid JSON' } }; }
  const order = event?.data || {};

  try {
    if (event?.type === 'order.paid') return await recordPaid(env, order, now);
    if (event?.type === 'order.refunded') return await recordRefund(env, order, now);
  } catch (err) {
    console.log('premium webhook failed', event?.type, String(err));
    return { status: 500, body: { error: 'Try again' } };
  }
  return { status: 202, body: { ok: true, ignored: event?.type || 'unknown' } };
}

/* ---------------------------------------------------------------------------
   The cron half (index.js scheduled()).

   runPassEnding    every tick: one email when a pass is about to end.
   reconcilePolar   hourly: whatever the webhook missed, from Polar's own
                    records. Both are idempotent, so a tick that dies halfway
                    is simply finished by the next one.
   --------------------------------------------------------------------------- */

/* For the email. Must match COURSES[].name in assets/premium.js (scripts/test
   checks it). */
const COURSE_NAMES = { nremt: 'NREMT-EMT Prep', ochem: 'Organic Chemistry', anp: 'Anatomy & Physiology' };

const ENDING_NOTICE_DAYS = 3;

/* "October 3, 2026". UTC, because that is the day the row says. */
function endsOnText(iso) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
}

/* Which rows get the notice, from every pass the candidate users hold. Per
   user and course, only the latest unrefunded pass (paid or 'grant') counts:
   a pass with a later one queued behind it is not really ending. That latest
   pass gets the notice if it ends within ENDING_NOTICE_DAYS and has not had
   it yet. */
function passesEnding(rows, now) {
  const latest = new Map();
  for (const r of rows) {
    if (r.refunded_at) continue;
    const key = `${r.user_id}|${r.course}`;
    const cur = latest.get(key);
    if (!cur || Date.parse(r.expires_at) > Date.parse(cur.expires_at)) latest.set(key, r);
  }
  return [...latest.values()].filter((r) => {
    const end = Date.parse(r.expires_at);
    return !r.ending_reminded_at && end > now && end <= now + ENDING_NOTICE_DAYS * DAY_MS;
  });
}

async function userEmail(env, userId) {
  const res = await fetch(`${env.SUPABASE_URL}/auth/v1/admin/users/${encodeURIComponent(userId)}`, {
    headers: { apikey: env.SUPABASE_SERVICE_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_KEY}` },
  });
  if (!res.ok) throw new Error(`admin user ${res.status}`);
  const user = await res.json();
  return user?.email || null;
}

async function runPassEnding(env, now = Date.now()) {
  // Same rule as the study reminders: no provider, no noise.
  if (!env.RESEND_API_KEY || !env.SUPABASE_URL || !env.SUPABASE_SERVICE_KEY) {
    return { skipped: 'no email provider configured' };
  }
  const from = new Date(now).toISOString();
  const to = new Date(now + ENDING_NOTICE_DAYS * DAY_MS).toISOString();

  // Who might be due: a cheap first pass over the window.
  const candRes = await sb(env,
    `premium_passes?select=user_id&refunded_at=is.null&ending_reminded_at=is.null` +
    `&expires_at=gt.${from}&expires_at=lte.${to}&order=expires_at.asc&limit=200`);
  if (!candRes.ok) return { error: `read failed: ${candRes.status}` };
  const users = [...new Set((await candRes.json()).map((r) => r.user_id))];
  if (!users.length) return { due: 0 };

  // Everything those users still hold, so a queued later pass is seen.
  const rowsRes = await sb(env,
    `premium_passes?select=id,user_id,course,expires_at,refunded_at,ending_reminded_at` +
    `&refunded_at=is.null&expires_at=gt.${from}&user_id=in.(${users.map(encodeURIComponent).join(',')})`);
  if (!rowsRes.ok) return { error: `read failed: ${rowsRes.status}` };
  const due = passesEnding(await rowsRes.json(), now).slice(0, EMAIL_BATCH);

  let sent = 0, noEmail = 0, dropped = 0, failed = 0;
  for (const row of due) {
    let result;
    try {
      const email = await userEmail(env, row.user_id);
      if (!email) {
        noEmail++;
      } else {
        result = await sendPassEndingEmail(env, {
          to: email, courseName: COURSE_NAMES[row.course] || row.course, endsOn: endsOnText(row.expires_at),
        });
        if (!result.ok && !result.gone) { failed++; continue; } // next tick retries
        if (result.ok) sent++; else dropped++;
      }
    } catch (err) {
      console.log('pass ending: failed', row.id, String(err));
      failed++;
      continue;
    }
    // Recorded on the row, so it goes once. A rejected or missing address is
    // recorded too: retrying it every fifteen minutes cannot help.
    await sb(env, `premium_passes?id=eq.${encodeURIComponent(row.id)}&ending_reminded_at=is.null`, {
      method: 'PATCH',
      headers: { Prefer: 'return=minimal' },
      body: JSON.stringify({ ending_reminded_at: new Date(now).toISOString() }),
    });
  }
  return { due: due.length, sent, noEmail, dropped, failed };
}

/* Reconciliation. The webhook is the normal path; this is the safety net for
   a delivery Polar gave up on, a secret pasted wrong, or a Worker that was
   down. Polar facts (from @polar-sh/sdk 1.0.1, API versions 2026-04 to
   2027-01):

   - GET /v1/orders/ takes created_after, product_id (repeatable), page,
     limit and sorting, answers { items, pagination: { total_count,
     max_page } }, and needs the token scope orders:read. Order.status is
     draft | pending | paid | refunded | partially_refunded | void, and
     nothing on an order says "disputed".
   - Polar sends no webhook for disputes (no dispute.* event type, and
     order.updated carries no dispute state). Disputes are only readable at
     GET /v1/disputes/ (scope disputes:read), with status prevented |
     early_warning | needs_response | under_review | lost | won. A
     "prevented" dispute is one Polar refunded, so order.refunded already
     covers it.

   A token without a scope gets 401/403: logged once per run and skipped, so
   the rest still works. */
const RECONCILE_HOURS = 48;
const RECONCILE_MAX_PAGES = 10;
/* A dispute takes the pass only once it is lost: the money is gone for good.
   While it is open the student keeps access, so a dispute the merchant wins
   does not leave them locked out with a "refunded" pass on their account. */
const DISPUTE_REVOKES = ['lost'];

async function polarList(env, path, params) {
  const items = [];
  for (let page = 1; page <= RECONCILE_MAX_PAGES; page++) {
    const q = new URLSearchParams();
    for (const [k, v] of Object.entries({ ...params, page, limit: 100 })) {
      for (const one of [].concat(v)) q.append(k, String(one));
    }
    const res = await fetch(`${polarApi(env)}${path}?${q}`, {
      headers: { Authorization: `Bearer ${env.POLAR_ACCESS_TOKEN}` },
    });
    if (res.status === 401 || res.status === 403) {
      console.log('premium reconcile: no access to', path, res.status, '(token scope?)');
      return null;
    }
    if (!res.ok) throw new Error(`polar ${path} ${res.status}`);
    const data = await res.json();
    items.push(...(data?.items || []));
    if (page >= (data?.pagination?.max_page || 1)) break;
  }
  return items;
}

async function reconcilePolar(env, now = Date.now()) {
  if (!env.POLAR_ACCESS_TOKEN || !env.SUPABASE_URL || !env.SUPABASE_SERVICE_KEY) {
    return { skipped: 'not configured' };
  }
  const out = { orders: 0, added: 0, refunded: 0, disputesRevoked: 0 };

  const params = { created_after: new Date(now - RECONCILE_HOURS * 3600000).toISOString(), sorting: '-created_at' };
  const products = Object.values(productMap(env)).filter(Boolean);
  if (products.length) params.product_id = products;
  const orders = await polarList(env, '/v1/orders/', params);
  if (orders === null) {
    out.orders = 'no access';
  } else {
    out.orders = orders.length;
    const known = new Map();
    for (let i = 0; i < orders.length; i += 100) {
      const ids = orders.slice(i, i + 100).map((o) => `"${String(o.id).replace(/"/g, '')}"`).join(',');
      const res = await sb(env, `premium_passes?select=order_id,refunded_at&order_id=in.(${encodeURIComponent(ids)})`);
      if (!res.ok) throw new Error(`read passes ${res.status}`);
      for (const r of await res.json()) known.set(r.order_id, r);
    }
    for (const order of orders) {
      if (!order?.id) continue;
      const row = known.get(order.id);
      if (!row) {
        // Same as the webhook. A paid order later refunded in full never
        // needs a pass; a partial refund keeps it, as it does there.
        if ((order.status === 'paid' || order.status === 'partially_refunded') && !isFullRefund(order)) {
          const r = await recordPaid(env, order, now);
          if (r.body.ok && !r.body.duplicate && !r.body.ignored) {
            out.added++;
            console.log('premium reconcile: added missing pass', order.id);
          }
        }
      } else if (!row.refunded_at && isFullRefund(order)) {
        await recordRefund(env, order, now);
        out.refunded++;
        console.log('premium reconcile: marked refunded', order.id);
      }
    }
  }

  const disputes = await polarList(env, '/v1/disputes/', { status: DISPUTE_REVOKES, sorting: '-created_at' });
  if (disputes === null) {
    out.disputesRevoked = 'no access';
  } else {
    const ids = disputes.filter((d) => d?.order_id && DISPUTE_REVOKES.includes(d.status)).map((d) => d.order_id);
    out.disputesRevoked = await revokeOrders(env, ids, now);
    if (out.disputesRevoked) console.log('premium reconcile: revoked for lost disputes', out.disputesRevoked);
  }
  return out;
}

/* ===========================================================================
   index.js
   =========================================================================== */

/**
 * LevlPrep Ask — optional AI backend.
 *
 * The site answers questions on its own, in the browser, with no server at all.
 * This Worker is the optional upgrade: it takes the passages the browser already
 * retrieved and has a model write a direct answer from them.
 *
 * It runs on Cloudflare Workers AI, which has a free daily allowance on a free
 * account. There is no API key in the browser — the model is reached through
 * the platform binding, so nothing sensitive ships to the client. When the free
 * allowance is used up the request fails and the site silently falls back to its
 * own answers, so the page never breaks and the bill never starts.
 *
 * Deploy: see ../README.md
 */




// Tried in order until one answers. A single hard-coded model is a time bomb:
// this shipped on @cf/meta/llama-3.1-8b-instruct, which the docs still list but
// the platform had deprecated months earlier, and the assistant fell back to
// quoting notes for every question with nothing on the page saying why.
// A deprecated model fails immediately and costs no inference, so the chain is
// only ever walked when something is genuinely wrong.
const MODELS = [
  '@cf/zai-org/glm-4.7-flash',
  '@cf/google/gemma-4-26b-a4b-it',
  '@cf/nvidia/nemotron-3-120b-a12b',
];

// Only these origins may call the Worker. Without this, anyone could point
// their own site at your endpoint and spend your daily allowance.
const ALLOWED_ORIGINS = [
  'https://levlprep.com',
  'https://www.levlprep.com',
  'http://localhost:8000',
  'http://127.0.0.1:8000',
];

// The model may teach — rephrase, analogize, connect topics — but it may not
// invent the facts it teaches from. The passages are the floor, not the
// ceiling: it can go beyond them to explain, and must say so when it does.
const SHARED_RULES = [
  'You are the study assistant built into LevlPrep. You are given reference passages drawn from the course the student is currently studying.',
  '',
  'How to answer:',
  '1. When the passages cover the question, answer from them and stay consistent with them. They are the course\'s own material and the student is being tested on that version.',
  '2. You MAY go beyond the passages to teach: rephrase an idea more simply, give an analogy, compare two concepts, or connect this topic to a related one. That is often exactly what is being asked for.',
  '3. When you go beyond the passages for something factual, say so briefly — "this isn\'t in your notes, but..." — so the student knows which part came from their course.',
  '4. If you genuinely do not know, say so. Never invent a fact to fill the gap.',
  '5. Answer in 2-5 short sentences, or a short bullet list for steps and criteria. Plain text; **bold** for emphasis is fine. Write to a student, not to a colleague.',
].join('\n');

// Where the two courses differ: a wrong ochem explanation costs an exercise.
// A wrong EMT protocol detail can cost someone their certification, or worse
// if they believe it on a real call.
const COURSE_RULES = {
  nremt: [
    '',
    'This student is preparing for the NREMT-EMT cognitive exam. Additional hard rules:',
    '- NEVER state a protocol step, drug dose, vital-sign threshold, or numeric criterion that is not in the passages. Analogies and plain-language explanation are encouraged; invented clinical specifics are not.',
    '- If asked for a number or a protocol the passages do not contain, say it is not in their material and tell them to check their local protocol — do not estimate it.',
    '- This is exam study material, not medical direction. For anything about a real patient, note that local protocol and medical direction govern real calls.',
    '- Never advise on a real, in-progress emergency. Tell them to call 911 / medical control.',
  ].join('\n'),
  ochem: [
    '',
    'This student is learning Organic Chemistry I. Additional guidance:',
    '- Analogies, alternative framings and worked reasoning are the point — use them freely.',
    '- Be careful with mechanism specifics: arrow direction, stereochemistry and regiochemistry must match the passages where the passages address them.',
    '- If a mechanism question goes beyond what the passages cover, reason it out but flag that you are reasoning rather than quoting their notes.',
  ].join('\n'),
  anp: [
    '',
    'This student is learning Anatomy & Physiology (college A&P I and II, or TEAS prep). Additional guidance:',
    '- Explain physiology as mechanism: name what causes each step. Never explain by purpose ("the body wants", "in order to").',
    '- Use the course\'s terms as the passages use them. Say "sensory receptor" or "receptor protein", never a bare "receptor".',
    '- Do not state a normal range, value or clinical threshold that is not in the passages; say it is not in their material instead.',
    '- This is study material, not medical advice. For anything about a real patient or symptoms, tell them to ask a clinician.',
  ].join('\n'),
};

function systemPrompt(course){
  return SHARED_RULES + (COURSE_RULES[course] || COURSE_RULES.nremt);
}

// Workers AI models do not agree on where the text goes: some return
// {response}, some nest it under result, some use the OpenAI shape, and some
// return the content as an array of parts. Reading only `response` made a
// working model look like a broken one — the call succeeded and the answer was
// thrown away as "Empty response".
function extractText(result) {
  if (!result) return '';
  if (typeof result === 'string') return result.trim();

  const candidates = [
    result.response,
    result.result?.response,
    result.output_text,
    result.choices?.[0]?.message?.content,
    result.choices?.[0]?.text,
    result.message?.content,
    result.text,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.trim()) return candidate.trim();
    if (Array.isArray(candidate)) {
      const joined = candidate
        .map((part) => (typeof part === 'string' ? part : part?.text || part?.content || ''))
        .join('')
        .trim();
      if (joined) return joined;
    }
  }
  return '';
}

function corsHeaders(origin) {
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    // Authorization: /premium/checkout carries the student's Supabase session.
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin',
  };
}

function json(body, status, origin) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
  });
}

export default {
  /* The cron that delivers study reminders. Separate from fetch() entirely: it
     is not triggered by anybody's request and shares nothing with the AI path.
     See src/reminders.js for why the browser decides everything and this only
     delivers. */
  async scheduled(event, env, ctx) {
    // Both channels on the same tick, and independently: an email provider
    // that is down must not stop the push reminders, and vice versa.
    // Premium rides the same tick: the pass-ending email every time, and the
    // Polar reconciliation once an hour (the tick in the first quarter).
    const tasks = [
      runReminders(env).then((r) => console.log('push reminders', JSON.stringify(r))),
      runEmailReminders(env).then((r) => console.log('email reminders', JSON.stringify(r))),
      runPassEnding(env).then((r) => console.log('pass ending', JSON.stringify(r))),
    ];
    if (new Date(event?.scheduledTime || Date.now()).getUTCMinutes() < 15) {
      tasks.push(reconcilePolar(env).then((r) => console.log('premium reconcile', JSON.stringify(r))));
    }
    ctx.waitUntil(Promise.allSettled(tasks).then((results) => {
      results.forEach((r) => { if (r.status === 'rejected') console.log('reminder run failed', String(r.reason)); });
    }));
  },

  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    const path = new URL(request.url).pathname;

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }

    /* The only GET on this Worker, and the only route that is not the
       assistant. A service worker woken by a push asks what to say; the
       notification text is fetched at the moment it is shown rather than
       carried in the push, which is what lets the push itself be payload-less
       and skips the entire RFC 8291 encryption path. See src/push.js.

       Answered for any origin, because the caller is a service worker whose
       fetch carries no Origin header at all — and because it returns only what
       somebody already holding that endpoint could learn anyway. */
    /* The one-click way out of the reminder emails, from the footer link and
       from the List-Unsubscribe header. A GET, because that is what a link in
       an email is, and it must work with nobody signed in on a device that has
       never seen this site. */
    if (path === '/api/unsubscribe' || path === '/reminders/unsubscribe') {
      return unsubscribe(request, env);
    }

    if (path === '/reminders/text') {
      if (request.method !== 'GET') return json({ error: 'GET only' }, 405, origin);
      const res = await reminderText(request, env);
      const headers = new Headers(res.headers);
      headers.set('Access-Control-Allow-Origin', '*');
      return new Response(res.body, { status: res.status, headers });
    }

    /* Polar's webhook. No Origin (it is a server) and no rate limit (Polar
       retries, and a burst of real orders is the good kind); the signature
       check inside is the whole of its trust. See src/premium.js. */
    if (path === '/premium/webhook') {
      if (request.method !== 'POST') return json({ error: 'POST only' }, 405, origin);
      const r = await premiumWebhook(request, env);
      return json(r.body, r.status, origin);
    }

    if (request.method !== 'POST') {
      return json({ error: 'POST only' }, 405, origin);
    }
    // An allowed Origin is REQUIRED, not merely "not a wrong one". A browser
    // always sends Origin on a POST fetch, same-origin or cross-origin, so the
    // only callers this turns away are scripts (curl, a bot) — which used to
    // walk straight through by leaving the header off, and then only the
    // per-IP throttle below stood between them and the day's free allowance.
    // A script can forge the header, but it now has to mean to, and the rate
    // limit still applies to it.
    if (!ALLOWED_ORIGINS.includes(origin)) {
      return json({ error: 'Origin not allowed' }, 403, origin);
    }

    // Per-visitor throttle, so one person (or one script) can't drain the
    // day's free allowance in a minute.
    if (env.RATE_LIMITER) {
      const ip = request.headers.get('CF-Connecting-IP') || 'anonymous';
      const { success } = await env.RATE_LIMITER.limit({ key: ip });
      if (!success) {
        return json({ error: 'Rate limited. The site will answer from its own material instead.' }, 429, origin);
      }
    }

    // Opening a checkout is a browser POST from the site like the assistant,
    // so it shares the Origin check and the throttle above, then leaves.
    if (path === '/premium/checkout') {
      const r = await premiumCheckout(request, env);
      return json(r.body, r.status, origin);
    }
    // A refund from the account page: same Origin check and throttle; the
    // rules that keep it from being abused are in premiumRefund().
    if (path === '/premium/refund') {
      const r = await premiumRefund(request, env);
      return json(r.body, r.status, origin);
    }

    // The NREMT pass guarantee; its rules are in premiumGuarantee().
    if (path === '/premium/guarantee') {
      const r = await premiumGuarantee(request, env);
      return json(r.body, r.status, origin);
    }

    let payload;
    try {
      payload = await request.json();
    } catch {
      return json({ error: 'Invalid JSON' }, 400, origin);
    }

    const question = String(payload?.question || '').trim().slice(0, 500);
    const context = Array.isArray(payload?.context) ? payload.context.slice(0, 6) : [];
    const history = Array.isArray(payload?.history) ? payload.history.slice(-4) : [];
    const course = payload?.course === 'ochem' || payload?.course === 'anp' ? payload.course : 'nremt';

    if (!question) return json({ error: 'Missing question' }, 400, origin);

    // An empty context is legitimate: the student asked something the course
    // doesn't cover. The model answers from general knowledge and is told to
    // label it as such, rather than passing it off as their material.
    const grounded = context.length > 0;
    const references = context
      .map((c, i) => {
        const page = String(c?.page || '').slice(0, 80);
        const heading = String(c?.heading || '').slice(0, 160);
        const text = String(c?.text || '').slice(0, 1200);
        return `[${i + 1}] ${page} — ${heading}\n${text}`;
      })
      .join('\n\n');

    const messages = [{ role: 'system', content: systemPrompt(course) }];
    for (const turn of history) {
      if (turn?.q) messages.push({ role: 'user', content: String(turn.q).slice(0, 300) });
      if (turn?.a) messages.push({ role: 'assistant', content: String(turn.a).slice(0, 600) });
    }
    messages.push({
      role: 'user',
      content: grounded
        ? `Reference passages from this student's course:\n\n${references}\n\n---\nStudent's question: ${question}\n\nAnswer from these passages, staying consistent with them. You may rephrase, give an analogy, or connect to a related idea; say so briefly if you go beyond what the passages state.`
        : `The course material has no passage covering this question.\n\n---\nStudent's question: ${question}\n\nAnswer from general knowledge, and open by making clear this is not covered in their course material. Keep it brief and do not invent course-specific details.`,
    });

    let lastError = null;
    for (const model of MODELS) {
      try {
        const result = await env.AI.run(model, { messages, max_tokens: 500, temperature: 0.2 });
        const answer = extractText(result);
        if (answer) return json({ answer, model }, 200, origin);
        // Name the keys that did come back, so an unfamiliar response shape is
        // a five-second fix instead of another round of guessing.
        const shape = result && typeof result === 'object' ? Object.keys(result).join(',') : typeof result;
        lastError = `${model} returned no text (fields: ${shape})`;
      } catch (err) {
        lastError = String(err);
        // Out of allowance is not a model problem — every model will refuse,
        // so stop rather than burning the remaining names on the same 429.
        if (/\b(3036|429)\b/.test(lastError)) break;
      }
    }
    // Every model failed: say so plainly and let the client fall back to the
    // course's own material rather than pretend to have answered.
    return json({ error: 'Model unavailable', detail: String(lastError).slice(0, 200) }, 502, origin);
  },
};
