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
   site. ?premium=success in a URL is something anybody can type. */

import { sb } from './store.js';

/* Must match `passes[].id` in assets/premium.js (scripts/test checks it).
   `days` is what one purchase adds. Semester is five months, so a pass bought
   in late August covers finals in January. */
export const PASSES = {
  'nremt-90':       { course: 'nremt', days: 90 },
  'ochem-semester': { course: 'ochem', days: 150 },
  'ochem-year':     { course: 'ochem', days: 365 },
  'anp-semester':   { course: 'anp',   days: 150 },
  'anp-year':       { course: 'anp',   days: 365 },
};

const isPass = (id) => typeof id === 'string' && Object.prototype.hasOwnProperty.call(PASSES, id);

const SITE = 'https://levlprep.com';
const DAY_MS = 86400000;
// Standard Webhooks' own tolerance, and Polar's SDK uses that library as is.
const WEBHOOK_TOLERANCE_S = 5 * 60;

/* Where Polar may send the student back to. Only our own site: an open
   redirect on a payment page is a phishing kit somebody else gets for free. */
export function safeReturnTo(raw) {
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
export function successUrl(returnTo, course) {
  const u = new URL(safeReturnTo(returnTo));
  u.hash = '';
  u.searchParams.delete('checkout_id');
  u.searchParams.set('premium', 'success');
  u.searchParams.set('course', course);
  return u.href + '&checkout_id={CHECKOUT_ID}';
}

/* POLAR_PRODUCTS is JSON, passId -> Polar product id. Kept in a variable
   rather than in this file so sandbox and production can differ. */
export function productMap(env) {
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
export async function premiumCheckout(request, env) {
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

function bytesToBase64(bytes) {
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s);
}

/* Standard Webhooks, keyed the way Polar keys it. Polar's SDK
   (polar-js src/webhooks.ts, validateEvent) does
     new Webhook(Buffer.from(secret, 'utf-8').toString('base64'))
   and the library base64-decodes that again, so the HMAC key is simply the
   secret string's own bytes, `whsec_` prefix (if any) included.
   Signed content: `${webhook-id}.${webhook-timestamp}.${raw body}`; the
   header holds space-separated `v1,<base64>` entries, any of which may match. */
export async function verifyWebhook(rawBody, headers, secret, nowSeconds = Math.floor(Date.now() / 1000)) {
  const get = (k) => (typeof headers.get === 'function' ? headers.get(k) : headers[k]) || '';
  const id = get('webhook-id');
  const ts = get('webhook-timestamp');
  const sigs = get('webhook-signature');
  if (!secret || !id || !ts || !sigs) return false;

  const t = Number(ts);
  if (!Number.isInteger(t) || Math.abs(nowSeconds - t) > WEBHOOK_TOLERANCE_S) return false;

  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'],
  );
  const mac = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${id}.${ts}.${rawBody}`));
  const expected = bytesToBase64(new Uint8Array(mac));

  return sigs.split(' ').some((entry) => {
    const [version, sig] = entry.split(',');
    if (version !== 'v1' || !sig || sig.length !== expected.length) return false;
    let diff = 0;
    for (let i = 0; i < sig.length; i++) diff |= sig.charCodeAt(i) ^ expected.charCodeAt(i);
    return diff === 0;
  });
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

async function recordRefund(env, order, now) {
  // Only a full refund takes the pass away. A partial one is a goodwill
  // gesture, and revoking access for it would turn that into a penalty.
  const full = order.status === 'refunded'
    || (Number.isInteger(order.refunded_amount) && Number.isInteger(order.total_amount)
        && order.total_amount > 0 && order.refunded_amount >= order.total_amount);
  if (!order.id || !full) return { status: 200, body: { ok: true, ignored: 'partial' } };
  const res = await sb(env,
    `premium_passes?order_id=eq.${encodeURIComponent(order.id)}&refunded_at=is.null`, {
      method: 'PATCH',
      headers: { Prefer: 'return=minimal' },
      body: JSON.stringify({ refunded_at: new Date(now).toISOString() }),
    });
  if (!res.ok) throw new Error(`refund pass ${res.status}`);
  return { status: 200, body: { ok: true } };
}

/* Returns { status, body }. A 5xx makes Polar retry, which is what we want
   when the database blinked; everything else gets a 2xx so an event we do not
   handle never piles up as failed deliveries. */
export async function premiumWebhook(request, env, now = Date.now()) {
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
