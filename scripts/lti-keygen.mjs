/* Makes the LTI 1.3 tool key for the Worker (worker/src/class-lti.js, docs/teacher-classes.md).

     node scripts/lti-keygen.mjs

   Prints one line: an RSA private key as a JWK with a kid. Paste it as the Worker secret LTI_PRIVATE_KEY
   (cd worker && npx wrangler secret put LTI_PRIVATE_KEY). The public half is served at /lti/jwks, so nothing
   else needs it. Never commit the output. A new key (new kid) can replace the old one at any time; LMSs fetch
   the keyset again when they see an unknown kid. */
const kp = await crypto.subtle.generateKey(
  { name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' },
  true, ['sign', 'verify']);
const jwk = await crypto.subtle.exportKey('jwk', kp.privateKey);
const kid = `levlprep-${new Date().toISOString().slice(0, 10)}-${crypto.randomUUID().slice(0, 8)}`;
const { key_ops: _o, ext: _e, ...rest } = jwk;
console.log(JSON.stringify({ ...rest, kid, alg: 'RS256', use: 'sig' }));
