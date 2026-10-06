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
 * Built: config.js, store.js, push.js, email.js, reminders.js, premium.js, index.js
 */

/* ===========================================================================
   config.js
   =========================================================================== */

/* The addresses the Worker hands to people, in one place.

   API_URL is where this Worker answers: the unsubscribe link and the
   List-Unsubscribe header in every reminder email point here. They used to
   point at the site (levlprep.com/api/unsubscribe), which is GitHub Pages and
   answered 404, so nobody could leave the list (site audit, Fix-first 8).

   The value below is the one source for the Worker host across the repo:
   scripts/lib/site-config.mjs reads it, and scripts/build-site-config.mjs
   writes it into the four site files and the CSP of every page. To move to
   api.levlprep.com (owner step in docs/site-audit-notes/w3.md), change it
   here, run `node scripts/build-site-config.mjs`, rebuild the Worker and
   deploy. An API_URL variable on the Worker overrides it without a rebuild,
   for the Worker only. */
const API_URL_DEFAULT = 'https://api.levlprep.com'; // site-config:API_URL
const SITE_URL_DEFAULT = 'https://levlprep.com';

function apiUrl(env) {
  return String((env && env.API_URL) || API_URL_DEFAULT).replace(/\/+$/, '');
}

function siteUrl(env) {
  return String((env && env.SITE_URL) || SITE_URL_DEFAULT).replace(/\/+$/, '');
}

/* A path on this site, or '/'. Reminder links come from the browser that
   wrote the row; an absolute URL, a protocol-relative `//host` or a
   backslash trick would turn a study reminder into a link to anywhere. */
function sitePath(raw) {
  const s = String(raw == null ? '' : raw);
  return s.length <= 200 && /^\/(?![/\\])[^\s\\]*$/.test(s) ? s : '/';
}

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
  return timedFetch(`${env.SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: env.SUPABASE_SERVICE_KEY,
      Authorization: `Bearer ${env.SUPABASE_SERVICE_KEY}`,
      'Content-Type': 'application/json',
      ...(init && init.headers),
    },
  });
}

/* Every outbound call has a deadline. Without one, a hung Polar, Resend or
   push service held a request (or a whole cron tick) open until the platform
   killed it, and the rows after it were never reached. */
const FETCH_TIMEOUT_MS = 10000;

function timedFetch(url, init = {}, ms = FETCH_TIMEOUT_MS) {
  if (init.signal || typeof AbortSignal === 'undefined' || typeof AbortSignal.timeout !== 'function') {
    return fetch(url, init);
  }
  return fetch(url, { ...init, signal: AbortSignal.timeout(ms) });
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

/* A row whose sends keep failing for reasons that are not about the whole
   service (a timeout, a 5xx, a 429) is retried an hour later rather than on
   the next tick, so it cannot sit at the front of the queue forever, and is
   deleted after this many failures in a row. */
const MAX_FAILURES = 5;
const RETRY_AFTER_MS = 60 * 60 * 1000;

/* The next daily send: the time this one was scheduled for plus a day, not
   the time it happened to go out plus a day (which drifted up to fifteen
   minutes later every day). A row that fell behind skips ahead whole days. */
const ONE_DAY_MS = 24 * 60 * 60 * 1000;
function nextDailySend(scheduledIso, now) {
  const at = Date.parse(scheduledIso);
  if (!Number.isFinite(at)) return new Date(now + ONE_DAY_MS).toISOString();
  let t = at + ONE_DAY_MS;
  if (t <= now) t += Math.ceil((now - t + 1) / ONE_DAY_MS) * ONE_DAY_MS;
  return new Date(t).toISOString();
}

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
    return { ok: false, status: 0, gone: false, config: true, error: 'VAPID key problem: ' + e.message };
  }

  const res = await timedFetch(subscription.endpoint, {
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
    // A 401/403 is not treated as "our key is wrong" for everyone: FCM also
    // answers 403 for one subscription made under an older VAPID key. It
    // counts as that row's failure, and the row goes after MAX_FAILURES.
    // Only a key that will not even import (above) stops the whole run.
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

/* CAN-SPAM wants a valid physical postal address in every commercial email,
   and Gmail's bulk-sender rules look for one. The owner fills this in (a PO
   box or a virtual mailbox is fine) and redeploys; until then it is empty and
   the footer simply leaves the line out. */
const POSTAL_ADDRESS = '';

function postalLine() {
  return POSTAL_ADDRESS ? `<br><br>LevlPrep &middot; ${esc(POSTAL_ADDRESS)}` : '';
}

/* The unsubscribe address for one row: on the Worker (API_URL), never on
   the site, which is static hosting and cannot act on it. */
function unsubscribeUrl(row, env) {
  return `${apiUrl(env)}/api/unsubscribe?t=${encodeURIComponent(row.unsub_token)}`;
}

function render(row, env) {
  const unsub = unsubscribeUrl(row, env);
  return fill({
    title: row.title,
    body: row.body,
    // Only ever a page on this site, whatever the row says.
    url: withRef(siteUrl(env) + sitePath(row.url), 'email'),
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
async function resendOutcome(res) {
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
async function sendPassEndingEmail(env, { to, courseName, endsOn }) {
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

async function unsubscribe(request, env) {
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
async function runEmailReminders(env, now = Date.now()) {
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
async function recordFailure(env, where, row, now) {
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
  const out = row ? { title: row.title, body: row.body, url: sitePath(row.url) } : {
    title: 'Time to study',
    body: 'Pick up where you left off.',
    url: '/',
  };
  return new Response(JSON.stringify(out), { headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
}

/* The cron. Runs on whatever schedule wrangler.toml declares. */
async function runReminders(env, now = Date.now()) {
  if (!env.SUPABASE_SERVICE_KEY || !env.VAPID_PRIVATE_KEY) {
    // Not configured is not an error: the site works without reminders, and a
    // half-configured cron that throws every fifteen minutes is noise.
    return { skipped: 'not configured' };
  }

  const res = await sb(
    env,
    `push_subscriptions?next_send_at=lte.${new Date(now).toISOString()}&next_send_at=not.is.null` +
      `&select=*&order=next_send_at.asc&limit=${PUSH_BATCH}`,
    { method: 'GET' }
  );
  if (!res.ok) return { error: `read failed: ${res.status}` };

  const due = await res.json();
  let sent = 0, dropped = 0, stopped = 0, failed = 0, config = null;

  for (const row of due) {
    const where = `push_subscriptions?id=eq.${encodeURIComponent(row.id)}`;
    let result;
    try {
      result = await sendPush(row, env);
    } catch (e) {
      result = { ok: false, status: 0, gone: false };
    }

    if (result.gone) {
      // The endpoint is dead: profile deleted, permission revoked, or expired.
      // Delete rather than retry — a push service asked repeatedly to deliver
      // to dead endpoints starts rate-limiting the live ones.
      await sb(env, where, { method: 'DELETE' });
      dropped++;
      continue;
    }

    if (result.config) {
      // Our VAPID key or JWT is wrong: every row would fail the same way, so
      // stop and touch nothing rather than count failures against them all.
      config = result.status || result.error || 'vapid';
      console.log('push reminders: refused for our own credentials', String(config));
      break;
    }

    if (!result.ok) {
      // A transient failure: retried in an hour, and after MAX_FAILURES in a
      // row the row is dropped. It does NOT count as unanswered, because
      // nothing reached anybody.
      failed++;
      await recordFailure(env, where, row, now);
      continue;
    }

    const unanswered = (row.unanswered || 0) + 1;
    const patch = { unanswered, last_sent_at: new Date(now).toISOString() };
    if ('failures' in row) patch.failures = 0;

    if (unanswered >= MAX_UNANSWERED) {
      // Silence, until the browser writes a row again — which only happens
      // from a page the student is looking at.
      patch.next_send_at = null;
      stopped++;
    } else {
      // Same time tomorrow: the time it was scheduled for plus a day, so the
      // student's chosen hour does not drift with the cron.
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



/* Must match `passes[].id` in assets/premium.js (scripts/test checks it), and
   sell every paid course in assets/courses.js (scripts/check-courses.mjs).
   `days` is what one purchase adds. Semester is five months, so a pass bought
   in late August covers finals in January.

   `until` instead makes a fixed-date pass: it runs to that moment whenever it
   is bought (never shorter; premium_add_pass's p_until), and is off sale after
   it. AP® Biology's ends with June 30, 2027 in Hawaii, the last US time zone
   to finish the day the site promises. Pass ids may reach a URL, so none
   carries the token "ap" (docs/apbio-spec.md decision 2). */
const PASSES = {
  'nremt-90':       { course: 'nremt', days: 90 },
  'ochem-semester': { course: 'ochem', days: 150 },
  'ochem-year':     { course: 'ochem', days: 365 },
  'anp-semester':   { course: 'anp',   days: 150 },
  'anp-year':       { course: 'anp',   days: 365 },
  'bio-2027':       { course: 'apbio', until: '2027-06-30T23:59:59-10:00' },
  // AP® Chemistry mirrors AP® Biology (docs/apchem-spec.md decision 3).
  'chem-2027':      { course: 'apchem', until: '2027-06-30T23:59:59-10:00' },
};

const isPass = (id) => typeof id === 'string' && Object.prototype.hasOwnProperty.call(PASSES, id);

/* A fixed-date pass is on sale until its end. */
function passOnSale(pass, now = Date.now()) {
  return !pass.until || now < Date.parse(pass.until);
}

/* What premium_add_pass is given for a pass: a fixed-date pass sends its
   end as p_until and one day as the floor (a purchase that only starts after
   the date, behind another pass, still gets a day rather than nothing). */
function passTerms(pass) {
  return pass.until ? { days: 1, until: new Date(Date.parse(pass.until)).toISOString() } : { days: pass.days, until: null };
}

/* The course as a URL may name it. A key with the token "ap" in it never
   goes into a URL (docs/apbio-spec.md decision 2), so apbio travels as its
   folder, "bio"; assets/premium.js returnCourse() reads either. */
const URL_COURSE = { apbio: 'bio', apchem: 'chem' };
const urlCourse = (course) => URL_COURSE[course] || course;

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
  u.searchParams.set('course', urlCourse(course));
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

/* The Supabase user behind a session token, or null. Supabase answers for
   its own tokens; we never decode one ourselves, so an expired or revoked
   session is refused too. Used by every route that acts for a student,
   including the assistant (index.js). */
function bearerToken(request) {
  return (request.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '').trim();
}

async function sessionUser(env, token) {
  if (!token || !env.SUPABASE_URL || !env.SUPABASE_SERVICE_KEY) return null;
  try {
    const who = await timedFetch(`${env.SUPABASE_URL}/auth/v1/user`, {
      headers: { apikey: env.SUPABASE_SERVICE_KEY, Authorization: `Bearer ${token}` },
    });
    if (!who.ok) return null;
    const user = await who.json();
    return user && user.id ? user : null;
  } catch {
    return null;
  }
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
  if (!passOnSale(pass)) return { status: 410, body: { error: 'This pass is no longer on sale. Nothing was charged.' } };

  const products = productMap(env);
  const productId = Object.prototype.hasOwnProperty.call(products, passId) ? products[passId] : null;
  if (!env.POLAR_ACCESS_TOKEN || !productId || !env.SUPABASE_URL || !env.SUPABASE_SERVICE_KEY) {
    return { status: 503, body: { error: 'Checkout is not set up yet.' } };
  }

  const user = await sessionUser(env, token);
  if (!user) return { status: 401, body: { error: 'Your session has expired. Sign in again.' } };

  const body = {
    products: [productId],
    external_customer_id: user.id,
    metadata: { user_id: user.id, pass: passId },
    success_url: successUrl(payload?.returnTo, pass.course),
  };
  if (user.email) body.customer_email = user.email;
  if (env.FOUNDING_DISCOUNT_ID) body.discount_id = env.FOUNDING_DISCOUNT_ID;

  const res = await timedFetch(`${polarApi(env)}/v1/checkouts/`, {
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
   - within REFUND_WINDOW_DAYS of buying, as the terms promise, counted
     from Polar's own order time (the reconcile can write the row up to 48
     hours after the purchase, and that delay must not lengthen the window);
   - once per account, ever. Any refund already on the account (self-serve
     or made by hand in Polar) means the next one goes through email, so a
     buy-use-refund loop runs exactly once. premium_ledger also records the
     person (as hashes): the email address normalized (case, +tags, Gmail
     dots), the Polar customer, and the account. Deleting the account does
     not clear it, so neither a new account nor an address alias resets the
     limit.

   Polar refunds the pre-tax amount and the tax with it. The pass is marked
   refunded here at once; order.refunded from Polar then finds nothing left
   to change. */
const REFUND_WINDOW_DAYS = 7;

function refundRefusal(row, priorRefunds, now) {
  if (!row || !row.order_id || !(row.amount_cents > 0)) return 'That purchase can’t be refunded here.';
  if (row.refunded_at) return 'That purchase has already been refunded.';
  const bought = Date.parse(row.order_created_at || row.created_at);
  if (!Number.isFinite(bought) || now - bought > REFUND_WINDOW_DAYS * DAY_MS) {
    return `Refunds are available for ${REFUND_WINDOW_DAYS} days after buying, and this purchase is older than that.`;
  }
  if (priorRefunds > 0) return 'This account has already had its one refund, so this purchase can’t be refunded.';
  return null;
}

async function premiumRefund(request, env, now = Date.now()) {
  const token = bearerToken(request);
  if (!token) return { status: 401, body: { error: 'Sign in first.' } };
  let payload;
  try { payload = await request.json(); } catch { return { status: 400, body: { error: 'Invalid JSON' } }; }
  const orderId = String(payload?.order_id || '');
  if (!/^[0-9a-f-]{36}$/i.test(orderId)) return { status: 400, body: { error: 'Unknown purchase.' } };
  if (!env.POLAR_ACCESS_TOKEN || !env.SUPABASE_URL || !env.SUPABASE_SERVICE_KEY) {
    return { status: 503, body: { error: 'Refunds are not set up yet.' } };
  }

  const user = await sessionUser(env, token);
  if (!user) return { status: 401, body: { error: 'Your session has expired. Sign in again.' } };

  const uid = encodeURIComponent(user.id);
  const rowRes = await sb(env, `premium_passes?select=order_id,amount_cents,refunded_at,created_at,order_created_at,customer_id` +
    `&user_id=eq.${uid}&order_id=eq.${encodeURIComponent(orderId)}&limit=1`);
  if (!rowRes.ok) return { status: 500, body: { error: 'Couldn’t check that purchase. Try again.' } };
  const row = (await rowRes.json())[0];
  const keys = await ledgerKeys({ email: user.email, customerId: row && row.customer_id, userId: user.id });
  const [priorRes, ledger] = await Promise.all([
    sb(env, `premium_passes?select=id&user_id=eq.${uid}&order_id=not.is.null&refunded_at=not.is.null&limit=1`),
    ledgerHas(env, keys, 'refund'),
  ]);
  if (!priorRes.ok || ledger === null) return { status: 500, body: { error: 'Couldn’t check that purchase. Try again.' } };
  const prior = (await priorRes.json()).length + (ledger ? 1 : 0);
  const refusal = refundRefusal(row, prior, now);
  if (refusal) return { status: 409, body: { error: refusal } };
  // Claimed before Polar is asked, so two clicks at once cannot both refund:
  // the second insert hits the unique key. Released if Polar clearly says no.
  const claimed = await ledgerAdd(env, keys, 'refund');
  if (claimed === 'taken') return { status: 409, body: { error: refundRefusal(row, 1, now) } };
  if (claimed !== 'ok') return { status: 500, body: { error: 'Couldn’t check that purchase. Try again.' } };

  let res = null;
  try {
    res = await timedFetch(`${polarApi(env)}/v1/refunds/`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${env.POLAR_ACCESS_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        order_id: orderId,
        reason: 'customer_request',
        amount: row.amount_cents,
        comment: 'Self-serve refund from the levlprep.com account page',
      }),
    });
  } catch (err) {
    console.log('polar refund: no answer', String(err));
  }
  if (!res || !res.ok) {
    if (res) console.log('polar refund failed', res.status, (await res.text()).slice(0, 300));
    // A timeout or a 5xx may still have refunded: the lock stays, so a second
    // click cannot refund twice, and the order.refunded webhook (or a person)
    // settles it. Only a clear refusal (4xx) gives the one refund back.
    if (res && res.status < 500) await ledgerRemove(env, keys, 'refund');
    return { status: 502, body: { error: 'The refund didn’t go through automatically. Email us and we’ll sort it out.' } };
  }
  await refundOrder(env, orderId, now);
  return { status: 200, body: { ok: true } };
}

/* premium_ledger: what a person has already used, kept after the account is
   deleted. Only hashes are stored, and only the Worker (service role) can
   read them. One row per key and kind, so inserting doubles as the lock.

   A person is several keys, any one of which counts as "already used":
   - the email address normalized: lower case, any +tag dropped, and for
     Gmail the dots dropped and googlemail.com read as gmail.com, so
     a.b+x@gmail.com and ab@gmail.com are one person;
   - the address as it was keyed before normalization (rows written before
     this change);
   - the Polar customer id, which follows the card holder across accounts;
   - the account id, which is also the lock when there is no address. */
function normalizeEmail(email) {
  const s = String(email || '').trim().toLowerCase();
  const at = s.lastIndexOf('@');
  if (at < 1) return s;
  let local = s.slice(0, at);
  let domain = s.slice(at + 1);
  const plus = local.indexOf('+');
  if (plus > 0) local = local.slice(0, plus);
  if (domain === 'googlemail.com') domain = 'gmail.com';
  if (domain === 'gmail.com') local = local.replace(/\./g, '');
  return `${local}@${domain}`;
}

async function emailKey(email) {
  if (!String(email || '').trim()) return null;
  return sha256Hex('levlprep-ledger:' + normalizeEmail(email));
}

async function ledgerKeys({ email, customerId, userId }) {
  const keys = [];
  const raw = String(email || '').trim().toLowerCase();
  if (raw) {
    keys.push(await emailKey(raw));
    const legacy = await sha256Hex('levlprep-ledger:' + raw);
    if (!keys.includes(legacy)) keys.push(legacy);
  }
  if (customerId) keys.push(await sha256Hex('levlprep-ledger:polar:' + String(customerId)));
  if (userId) keys.push(await sha256Hex('levlprep-ledger:user:' + String(userId)));
  return keys;
}

async function ledgerHas(env, keys, kind) {
  if (!keys.length) return false;
  const res = await sb(env, `premium_ledger?select=kind&email_key=in.(${keys.join(',')})&kind=eq.${kind}&limit=1`);
  if (!res.ok) return null;
  return (await res.json()).length > 0;
}

/* The first key is the lock: two requests for the same person race on it
   and only one insert succeeds. The rest are recorded as well, so a later
   alias, card or account finds the use. */
async function ledgerAdd(env, keys, kind) {
  if (!keys.length) return 'ok';
  const res = await sb(env, 'premium_ledger', {
    method: 'POST',
    headers: { Prefer: 'return=minimal' },
    body: JSON.stringify({ email_key: keys[0], kind }),
  });
  if (res.status === 409) return 'taken';
  if (!res.ok) return 'error';
  for (const key of keys.slice(1)) {
    await sb(env, 'premium_ledger', {
      method: 'POST',
      headers: { Prefer: 'return=minimal,resolution=ignore-duplicates' },
      body: JSON.stringify({ email_key: key, kind }),
    });
  }
  return 'ok';
}

async function ledgerRemove(env, keys, kind) {
  if (!keys.length) return;
  await sb(env, `premium_ledger?email_key=in.(${keys.join(',')})&kind=eq.${kind}`, { method: 'DELETE' });
}

/* POST /premium/guarantee: Pass-or-extend (its old name was retired 2026-10), claimed from the account
   page with no approval step. Nobody can prove they failed (the National
   Registry publishes who is certified, not who failed), so the rules keep
   what a false claim can win small and make it checkable afterwards:

   - an NREMT pass that was bought (not a free month), not refunded;
   - the exam date falls inside that paid pass and is at most
     GUARANTEE.claimDays ago;
   - at least GUARANTEE.minExams full timed exams taken during the paid
     pass and before the exam date, so the pass was actually used to
     prepare. They are counted from exam_completions, which the database
     stamps (record_exam_completion), not from the synced history the
     browser writes; history entries dated before EXAM_LOG_SINCE still
     count, since nothing recorded exams on the server then;
   - once per account and per email address, ever (premium_ledger again);
   - the claim records the legal name and state the candidate tested under,
     so it can be checked against the Registry's public certification
     lookup. The terms say a claim from someone already certified ends the
     extension.

   It adds GUARANTEE.extendDays, starting when the current pass ends, and
   records which bought pass it extends (funded_by): refunding that order
   takes the extension back (premium_refund_order in schema.sql). */
const GUARANTEE = { claimDays: 30, extendDays: 90, minExams: 2 };

/* Server-stamped exam records start with the 2026-10 migration. Synced
   history entries dated before this still count toward the guarantee; after
   it, only exam_completions do. Set to the day the migration is applied. */
const EXAM_LOG_SINCE = Date.parse('2026-10-15T00:00:00Z');
const FULL_EXAM_MIN_QUESTIONS = 50;

/* The exams that count: server records, plus history from before the log. */
function countableExams(completions, legacyHistory) {
  const server = (completions || [])
    .filter((c) => c && Number(c.questions) >= FULL_EXAM_MIN_QUESTIONS && Number.isFinite(Date.parse(c.finished_at)))
    .map((c) => ({ date: Date.parse(c.finished_at) }));
  const legacy = (legacyHistory || []).filter((h) => h && Number(h.date) < EXAM_LOG_SINCE);
  return server.concat(legacy);
}

/* The bought pass the exam fell in: the one a guarantee extends. */
function guaranteeFunding(passes, examDate) {
  const exam = Date.parse(examDate + 'T12:00:00Z');
  return (passes || []).find((p) => p.order_id && p.amount_cents > 0 && !p.refunded_at
    && exam >= Date.parse(p.starts_at) - DAY_MS && exam <= Date.parse(p.expires_at) + DAY_MS) || null;
}

function guaranteeRefusal({ passes, examDate, history, used, now }) {
  const paid = (passes || []).filter((p) => p.order_id && p.amount_cents > 0 && !p.refunded_at);
  if (!paid.length) return 'Pass-or-extend comes with a bought NREMT pass, and this account doesn’t have one.';
  if (used) return 'This account has already used Pass-or-extend.';
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
    return `Pass-or-extend needs at least ${GUARANTEE.minExams} full timed exams taken during your pass, before the real exam. ` +
      `This account has ${exams}. (An exam counts when you finish it while signed in.)`;
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
  const token = bearerToken(request);
  if (!token) return { status: 401, body: { error: 'Sign in first.' } };
  let payload;
  try { payload = await request.json(); } catch { return { status: 400, body: { error: 'Invalid JSON' } }; }
  const examDate = String(payload?.exam_date || '');
  const name = String(payload?.legal_name || '').trim().replace(/\s+/g, ' ');
  const state = String(payload?.state || '').trim().replace(/\s+/g, ' ');
  if (name.length < 3 || name.length > 100) return { status: 400, body: { error: 'Enter your full legal name as the Registry has it.' } };
  if (state.length < 2 || state.length > 40) return { status: 400, body: { error: 'Enter the state you tested for.' } };
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_KEY) return { status: 503, body: { error: 'This isn’t set up yet.' } };

  const user = await sessionUser(env, token);
  if (!user) return { status: 401, body: { error: 'Your session has expired. Sign in again.' } };

  const uid = encodeURIComponent(user.id);
  const [passRes, examRes, progRes] = await Promise.all([
    sb(env, `premium_passes?select=pass,order_id,amount_cents,refunded_at,starts_at,expires_at,customer_id&user_id=eq.${uid}&course=eq.nremt`),
    sb(env, `exam_completions?select=questions,finished_at&user_id=eq.${uid}&course=eq.nremt&order=finished_at.desc&limit=200`),
    sb(env, `user_progress?select=data&id=eq.${uid}&limit=1`),
  ]);
  if (!passRes.ok || !examRes.ok || !progRes.ok) return { status: 500, body: { error: 'Couldn’t check your account. Try again.' } };
  const passes = await passRes.json();
  const prog = (await progRes.json())[0];
  const history = countableExams(await examRes.json(), examHistory(prog && prog.data));
  const customer = (passes.find((p) => p.customer_id) || {}).customer_id;
  const keys = await ledgerKeys({ email: user.email, customerId: customer, userId: user.id });
  const ledger = await ledgerHas(env, keys, 'guarantee');
  if (ledger === null) return { status: 500, body: { error: 'Couldn’t check your account. Try again.' } };
  const used = ledger || passes.some((p) => p.pass === 'guarantee');
  const refusal = guaranteeRefusal({ passes, examDate, history, used, now });
  if (refusal) return { status: 409, body: { error: refusal } };
  const funding = guaranteeFunding(passes, examDate);

  const claimed = await ledgerAdd(env, keys, 'guarantee');
  if (claimed === 'taken') return { status: 409, body: { error: 'This account has already used Pass-or-extend.' } };
  if (claimed !== 'ok') return { status: 500, body: { error: 'Couldn’t check your account. Try again.' } };

  let added = null;
  try {
    added = await addPass(env, {
      userId: user.id, course: 'nremt', pass: 'guarantee', days: GUARANTEE.extendDays,
      fundedBy: funding ? funding.order_id : null,
    });
  } catch (err) {
    console.log('guarantee insert failed', String(err));
  }
  if (!added || !added.inserted) {
    await ledgerRemove(env, keys, 'guarantee');
    return { status: 500, body: { error: 'That didn’t go through. Try again in a moment.' } };
  }
  const claimRes = await sb(env, 'premium_guarantee_claims', {
    method: 'POST',
    headers: { Prefer: 'return=minimal' },
    body: JSON.stringify({ user_id: user.id, legal_name: name, state, exam_date: examDate }),
  });
  if (!claimRes.ok) console.log('guarantee claim record failed', claimRes.status);
  return { status: 200, body: { ok: true, expires_at: new Date(added.expires_at).toISOString() } };
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

/* Creating a pass is one database function, premium_add_pass() in
   scripts/sql/schema.sql: under a per-user lock it reads where the latest
   unrefunded pass ends, starts the new one there (or now), and inserts it,
   so a pass bought early never throws days away and the webhook and the
   reconcile racing on one order cannot stack two passes on the same days.
   It answers { inserted, starts_at, expires_at }; inserted is false for an
   order it already has. */
async function addPass(env, { userId, course, pass, days, until = null, orderId = null, amountCents = null, orderCreatedAt = null, customerId = null, fundedBy = null }) {
  const res = await sb(env, 'rpc/premium_add_pass', {
    method: 'POST',
    body: JSON.stringify({
      // p_until only for a fixed-date pass: the function took no such
      // parameter before migrations/2026-10b-apbio.sql, so leaving it out
      // keeps every other course's purchases working on either schema.
      p_user: userId, p_course: course, p_pass: pass, p_days: days, ...(until ? { p_until: until } : {}),
      p_order_id: orderId, p_amount_cents: amountCents, p_order_created_at: orderCreatedAt,
      p_customer_id: customerId, p_funded_by: fundedBy,
    }),
  });
  if (!res.ok) throw new Error(`add pass ${res.status}: ${(await res.text()).slice(0, 200)}`);
  return res.json();
}

/* A full refund, also one database function (premium_refund_order): marks
   the order's pass, takes back a guarantee it paid for, and re-chains the
   passes queued behind it. Returns how many bought passes it marked. */
async function refundOrder(env, orderId, now) {
  const res = await sb(env, 'rpc/premium_refund_order', {
    method: 'POST',
    body: JSON.stringify({ p_order_id: String(orderId), p_at: new Date(now).toISOString() }),
  });
  if (!res.ok) throw new Error(`refund pass ${res.status}`);
  return Number(await res.json()) || 0;
}

function isoOrNull(v) {
  const t = Date.parse(v || '');
  return Number.isFinite(t) ? new Date(t).toISOString() : null;
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

  const added = await addPass(env, {
    userId, course: pass.course, pass: passId, ...passTerms(pass),
    orderId: order.id,
    amountCents: Number.isInteger(order.net_amount) ? order.net_amount : null,
    orderCreatedAt: isoOrNull(order.created_at),
    customerId: order.customer_id || order.customer?.id || null,
  });
  // A second delivery of the same order adds nothing.
  if (!added || !added.inserted) return { status: 200, body: { ok: true, duplicate: true } };
  // The funnel's last step, counted here where payment is a fact. Best
  // effort: a missed count must not make Polar redeliver the order.
  try {
    await sb(env, 'rpc/count_premium_paid', { method: 'POST', body: JSON.stringify({ p_course: pass.course }) });
  } catch { /* the count is not worth a retry */ }
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
  await refundOrder(env, order.id, now);
  return { status: 200, body: { ok: true } };
}

/* Revoke the passes of these orders, the same way a refund does, so
   my_premium() stops counting them. Returns how many changed. */
async function revokeOrders(env, orderIds, now) {
  let changed = 0;
  for (const id of new Set(orderIds)) changed += await refundOrder(env, id, now);
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
// Each paid course in assets/courses.js, by its productName (scripts/check-courses.mjs).
const COURSE_NAMES = { nremt: 'NREMT-EMT Prep', ochem: 'Organic Chemistry', anp: 'Anatomy & Physiology', apbio: 'AP® Biology', apchem: 'AP® Chemistry' };

const ENDING_NOTICE_DAYS = 3;

/* "October 3, 2026". UTC, because that is the day the row says. */
function endsOnText(iso) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
}

/* Which rows get the notice, from every pass the candidate users hold. Per
   user and course, only the latest unrefunded pass counts: a pass with a
   later one queued behind it is not really ending. That latest pass gets the
   notice if it was bought (order_id: the copy says "a pass you bought", so a
   free founding month or a guarantee extension gets nothing), ends within
   ENDING_NOTICE_DAYS and has not had it yet. */
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
    return r.order_id && !r.ending_reminded_at && end > now && end <= now + ENDING_NOTICE_DAYS * DAY_MS;
  });
}

async function userEmail(env, userId) {
  const res = await timedFetch(`${env.SUPABASE_URL}/auth/v1/admin/users/${encodeURIComponent(userId)}`, {
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
    `premium_passes?select=user_id&refunded_at=is.null&ending_reminded_at=is.null&order_id=not.is.null` +
    `&expires_at=gt.${from}&expires_at=lte.${to}&order=expires_at.asc&limit=200`);
  if (!candRes.ok) return { error: `read failed: ${candRes.status}` };
  const users = [...new Set((await candRes.json()).map((r) => r.user_id))];
  if (!users.length) return { due: 0 };

  // Everything those users still hold, so a queued later pass is seen.
  const rowsRes = await sb(env,
    `premium_passes?select=id,user_id,course,order_id,expires_at,refunded_at,ending_reminded_at` +
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
        if (result.config) { failed++; break; } // our sender is wrong: stop, mark nothing
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
/* Only disputes opened in this window are acted on. Every run used to list
   (and re-apply) every lost dispute ever; an old one has long since been
   applied, and one somebody resolved by hand must not be undone hourly. */
const DISPUTE_WINDOW_DAYS = 120;

async function polarList(env, path, params) {
  const items = [];
  for (let page = 1; page <= RECONCILE_MAX_PAGES; page++) {
    const q = new URLSearchParams();
    for (const [k, v] of Object.entries({ ...params, page, limit: 100 })) {
      for (const one of [].concat(v)) q.append(k, String(one));
    }
    const res = await timedFetch(`${polarApi(env)}${path}?${q}`, {
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
    const since = now - DISPUTE_WINDOW_DAYS * DAY_MS;
    const ids = disputes
      .filter((d) => d?.order_id && DISPUTE_REVOKES.includes(d.status))
      .filter((d) => !d.created_at || Date.parse(d.created_at) >= since)
      .map((d) => d.order_id);
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
];
// A local copy of the site, only on a Worker that says so (a dev deploy with
// ALLOW_LOCALHOST = "true"). Production never trusts localhost: any page
// someone serves on their own machine would otherwise count as the site.
const DEV_ORIGINS = ['http://localhost:8000', 'http://127.0.0.1:8000'];

function allowedOrigins(env) {
  return env && String(env.ALLOW_LOCALHOST) === 'true' ? ALLOWED_ORIGINS.concat(DEV_ORIGINS) : ALLOWED_ORIGINS;
}

/* The per-IP throttle (wrangler.toml, RATE_LIMITER), bucketed per route so a
   busy assistant does not lock somebody out of unsubscribing. True when this
   request is over the limit. No binding (a dashboard paste) means no limit,
   which is why deploys go through wrangler (.github/workflows/deploy-worker.yml). */
async function throttled(env, request, bucket) {
  if (!env.RATE_LIMITER) return false;
  const ip = request.headers.get('CF-Connecting-IP') || 'anonymous';
  const { success } = await env.RATE_LIMITER.limit({ key: `${bucket}:${ip}` });
  return !success;
}

/* The assistant answers signed-in students only: a Supabase session the
   Worker can verify, which needs no setup beyond what Premium already uses.
   The Origin header alone was the gate, and any script can send one.
   (Turnstile was the other option; it needs a site key and a secret the
   owner would have to create first.) Verified tokens are remembered for a
   few minutes per Worker instance, so a conversation is not one auth call
   per question. */
const SESSION_TTL_MS = 5 * 60 * 1000;
const sessionCache = new Map();
async function signedIn(env, request) {
  const token = bearerToken(request);
  if (!token) return false;
  const hit = sessionCache.get(token);
  if (hit && hit > Date.now()) return true;
  const user = await sessionUser(env, token);
  if (!user) return false;
  if (sessionCache.size > 500) sessionCache.clear();
  sessionCache.set(token, Date.now() + SESSION_TTL_MS);
  return true;
}

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

// One entry per course in assets/courses.js (scripts/check-courses.mjs checks);
// the assistant accepts exactly these course keys.
// Where the courses differ: a wrong ochem explanation costs an exercise.
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
  apbio: [
    '',
    'This student is a high-school student preparing for the AP® Biology exam. Additional guidance:',
    '- Explain at a high-school level, from the basics up, and as mechanism: name what causes each step. Never explain by purpose ("the cell wants", "in order to").',
    '- Use the course\'s terms as the passages use them. Do not state a number, rate or yield that is not in the passages; say it is not in their material instead.',
    '- Never reproduce or quote released AP® exam questions, AP Classroom items or College Board course text, and do not claim to know what will be on the exam.',
    '- For a free-response question, coach the reasoning (claim, evidence, reasoning; prediction with mechanism) rather than writing a finished answer to hand in.',
  ].join('\n'),
  apchem: [
    '',
    'This student is a high-school student preparing for the AP® Chemistry exam. Additional guidance:',
    '- Explain at a high-school level, from the basics up, at the particle level: name the particles, the forces and the cause. Never explain by purpose ("the atom wants a full octet").',
    '- Show calculations with units carried through every step and the answer rounded to the significant figures the data support. Say which logarithm (log or ln) an equation uses.',
    '- Justify with comparisons of both species, Coulomb\'s law, Q versus K, and particle-level entropy (dispersal of matter and energy), never "disorder" or "K changes with concentration".',
    '- Do not state a constant, value or reduction potential that is not in the passages or the official equations sheet; say it is not in their material instead.',
    '- Never reproduce or quote released AP® exam questions, AP Classroom items or College Board course text, and do not claim to know what will be on the exam.',
    '- For a free-response question, coach the reasoning (claim, evidence, reasoning) rather than writing a finished answer to hand in.',
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

function corsHeaders(origin, env) {
  const allowed = allowedOrigins(env).includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    // Authorization: /premium/checkout carries the student's Supabase session.
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin',
  };
}

function json(body, status, origin, env) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders(origin, env) },
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
    const reply = (body, status) => json(body, status, origin, env);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(origin, env) });
    }

    /* The way out of the reminder emails, from the footer link and from the
       List-Unsubscribe header. It must work with nobody signed in on a
       device that has never seen this site, so it takes no Origin. A GET
       shows a confirmation; only the POST deletes (src/email.js says why). */
    if (path === '/api/unsubscribe' || path === '/reminders/unsubscribe') {
      if (await throttled(env, request, 'unsub')) {
        return new Response('Too many requests. Try again in a minute.', { status: 429, headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Retry-After': '60' } });
      }
      return unsubscribe(request, env);
    }

    /* A service worker woken by a push asks what to say; the notification
       text is fetched at the moment it is shown rather than carried in the
       push, which is what lets the push itself be payload-less and skips the
       entire RFC 8291 encryption path. See src/push.js.

       Answered for any origin, because the caller is a service worker whose
       fetch carries no Origin header at all — and because it returns only what
       somebody already holding that endpoint could learn anyway. */
    if (path === '/reminders/text') {
      if (request.method !== 'GET') return reply({ error: 'GET only' }, 405);
      if (await throttled(env, request, 'text')) return reply({ error: 'Rate limited' }, 429);
      const res = await reminderText(request, env);
      const headers = new Headers(res.headers);
      headers.set('Access-Control-Allow-Origin', '*');
      return new Response(res.body, { status: res.status, headers });
    }

    /* Polar's webhook. No Origin (it is a server) and no rate limit (Polar
       retries, and a burst of real orders is the good kind); the signature
       check inside is the whole of its trust. See src/premium.js. */
    if (path === '/premium/webhook') {
      if (request.method !== 'POST') return reply({ error: 'POST only' }, 405);
      const r = await premiumWebhook(request, env);
      return reply(r.body, r.status);
    }

    if (request.method !== 'POST') {
      return reply({ error: 'POST only' }, 405);
    }
    // An allowed Origin is REQUIRED, not merely "not a wrong one". A browser
    // always sends Origin on a POST fetch, same-origin or cross-origin, so the
    // only callers this turns away are scripts (curl, a bot) — which used to
    // walk straight through by leaving the header off. A script can forge the
    // header, which is why the assistant also needs a session (below).
    if (!allowedOrigins(env).includes(origin)) {
      return reply({ error: 'Origin not allowed' }, 403);
    }

    // Per-visitor throttle, so one person (or one script) can't drain the
    // day's free allowance in a minute.
    if (await throttled(env, request, 'post')) {
      return reply({ error: 'Rate limited. The site will answer from its own material instead.' }, 429);
    }

    // Opening a checkout is a browser POST from the site like the assistant,
    // so it shares the Origin check and the throttle above, then leaves.
    if (path === '/premium/checkout') {
      const r = await premiumCheckout(request, env);
      return reply(r.body, r.status);
    }
    // A refund from the account page: same Origin check and throttle; the
    // rules that keep it from being abused are in premiumRefund().
    if (path === '/premium/refund') {
      const r = await premiumRefund(request, env);
      return reply(r.body, r.status);
    }

    // Pass-or-extend (NREMT); its rules are in premiumGuarantee().
    if (path === '/premium/guarantee') {
      const r = await premiumGuarantee(request, env);
      return reply(r.body, r.status);
    }

    // The assistant: signed-in students only (see signedIn above). The site
    // answers from its own material for everyone else.
    if (!(await signedIn(env, request))) {
      return reply({ error: 'Sign in to get AI answers.' }, 401);
    }

    let payload;
    try {
      payload = await request.json();
    } catch {
      return reply({ error: 'Invalid JSON' }, 400);
    }

    const question = String(payload?.question || '').trim().slice(0, 500);
    const context = Array.isArray(payload?.context) ? payload.context.slice(0, 6) : [];
    const history = Array.isArray(payload?.history) ? payload.history.slice(-4) : [];
    // Any course with its own rules; anything else is NREMT, the original.
    const course = typeof payload?.course === 'string' && Object.prototype.hasOwnProperty.call(COURSE_RULES, payload.course)
      ? payload.course : 'nremt';

    if (!question) return reply({ error: 'Missing question' }, 400);

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
        if (answer) return reply({ answer, model }, 200);
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
    // course's own material rather than pretend to have answered. The reason
    // goes to the Worker's log, not to the browser: raw platform errors name
    // models, accounts and limits nobody outside needs to see.
    console.log('assistant: every model failed', String(lastError).slice(0, 300));
    return reply({ error: 'Model unavailable' }, 502);
  },
};
