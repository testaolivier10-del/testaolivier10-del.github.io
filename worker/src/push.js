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

export function b64urlToBytes(s) {
  const pad = s.replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(pad + '='.repeat((4 - (pad.length % 4)) % 4));
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export function bytesToB64url(bytes) {
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
export async function sendPush(subscription, env) {
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
