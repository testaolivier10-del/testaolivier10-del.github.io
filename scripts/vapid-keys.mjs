/* Generate a VAPID key pair for study reminders.

   Run once. The pair identifies this site to every browser push service; it is
   not a user credential and does not expire, but replacing it invalidates
   every existing subscription — every browser would have to grant permission
   again, and there is no way to ask a browser that has already said yes.
   So: generate once, keep the private half safe, and do not regenerate for
   tidiness.

     node scripts/vapid-keys.mjs

   The public key goes in two places, both of which are fine to commit:
     worker/wrangler.toml   VAPID_PUBLIC_KEY
     assets/reminders.js    VAPID_PUBLIC_KEY

   The private key goes in exactly one place and is never committed:
     wrangler secret put VAPID_PRIVATE_KEY
*/
import { generateKeyPairSync, createPublicKey } from 'node:crypto';

const b64url = (buf) => Buffer.from(buf).toString('base64')
  .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

const { publicKey, privateKey } = generateKeyPairSync('ec', { namedCurve: 'prime256v1' });

// The uncompressed point (0x04 || x || y), which is what RFC 8292 wants and
// what the browser's applicationServerKey accepts.
const pub = publicKey.export({ type: 'spki', format: 'der' }).subarray(-65);
const jwk = privateKey.export({ format: 'jwk' });

if (pub.length !== 65 || pub[0] !== 0x04) {
  console.error('unexpected public key shape — refusing to print a key that will not work');
  process.exit(1);
}
// Sanity-check that the two halves belong together before printing them: a
// mismatched pair fails at the push service with a bare 401.
const derivedPub = createPublicKey(privateKey).export({ type: 'spki', format: 'der' }).subarray(-65);
if (!derivedPub.equals(pub)) {
  console.error('the generated halves do not match — try again');
  process.exit(1);
}

console.log('VAPID_PUBLIC_KEY  =', b64url(pub));
console.log('VAPID_PRIVATE_KEY =', jwk.d);
console.log('');
console.log('Public key  -> worker/wrangler.toml and assets/reminders.js (both committed).');
console.log('Private key -> wrangler secret put VAPID_PRIVATE_KEY (never committed).');
