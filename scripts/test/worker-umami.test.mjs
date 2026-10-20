/* /api/send: analytics forwarded to Umami (worker/src/umami.js). It must keep
   the visitor's IP and user agent for Umami's country and device, drop cloud
   servers and automated browsers, refuse anything that is not an event for
   this site, and never spend the assistant's per-IP allowance. */
import { test, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import worker from '../../worker/src/index.js';
import { UMAMI_WEBSITE_ID, UMAMI_GATEWAY, acceptableEvent, isOwnerEmail, isSource } from '../../worker/src/umami.js';

const realFetch = globalThis.fetch;
afterEach(() => { globalThis.fetch = realFetch; });

const BROWSER = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148';
const body = (over = {}) => JSON.stringify({ type: 'event', payload: { website: UMAMI_WEBSITE_ID, hostname: 'levlprep.com', url: '/nremt/', name: 'visit', ...over } });

function send({ origin = 'https://levlprep.com', ua = BROWSER, asn = 7922, text = body(), ip = '203.0.113.9', limiter } = {}) {
  const forwarded = [];
  globalThis.fetch = async (url, init) => { forwarded.push({ url, init }); return new Response('cache-token', { status: 200 }); };
  const req = new Request('https://api.levlprep.com/api/send', {
    method: 'POST',
    headers: { Origin: origin, 'User-Agent': ua, 'CF-Connecting-IP': ip, 'Content-Type': 'text/plain' },
    body: text,
  });
  Object.defineProperty(req, 'cf', { value: { asn } });
  const env = limiter ? { RATE_LIMITER: limiter } : {};
  return worker.fetch(req, env).then((res) => ({ res, forwarded }));
}

test('a student\'s event is forwarded with their IP and user agent', async () => {
  const { res, forwarded } = await send();
  assert.equal(res.status, 200);
  assert.equal(await res.text(), 'cache-token');
  assert.equal(forwarded.length, 1);
  assert.equal(forwarded[0].url, UMAMI_GATEWAY);
  assert.equal(forwarded[0].init.headers['X-Forwarded-For'], '203.0.113.9');
  assert.equal(forwarded[0].init.headers['User-Agent'], BROWSER);
  assert.equal(res.headers.get('Access-Control-Allow-Origin'), 'https://levlprep.com');
});

test('cloud servers and headless browsers are dropped quietly', async () => {
  for (const r of [await send({ asn: 16509 }), await send({ asn: 45102 }), await send({ ua: 'Mozilla/5.0 HeadlessChrome/120' })]) {
    assert.equal(r.res.status, 204);
    assert.equal(r.forwarded.length, 0);
  }
});

test('iCloud Private Relay (Akamai, Cloudflare) is a real student and is kept', async () => {
  for (const asn of [36183, 13335]) assert.equal((await send({ asn })).forwarded.length, 1);
});

test('no site Origin, another website id, or junk: refused', async () => {
  assert.equal((await send({ origin: '' })).res.status, 403);
  assert.equal((await send({ origin: 'https://evil.example' })).res.status, 403);
  const other = await send({ text: body({ website: '00000000-0000-0000-0000-000000000000' }) });
  assert.equal(other.res.status, 400);
  assert.equal(other.forwarded.length, 0);
  assert.equal((await send({ text: 'x'.repeat(9000) })).res.status, 400);
  assert.equal(acceptableEvent('{"type":"event"}'), null);
});

test('analytics never spends the assistant\'s rate limit', async () => {
  let asked = 0;
  const { res } = await send({ limiter: { limit: async () => { asked++; return { success: false }; } } });
  assert.equal(res.status, 200);
  assert.equal(asked, 0);
});

test('the owner\'s purchases are not counted; sources are single clean words', async () => {
  assert.equal(await isOwnerEmail('TestaOlivier10@gmail.com '), true);
  assert.equal(await isOwnerEmail('student@example.com'), false);
  assert.equal(isSource('tiktok'), true);
  assert.equal(isSource('merlot.org'), true);
  assert.equal(isSource('https://x.com/a'), false);
  assert.equal(isSource('A'.repeat(50)), false);
});
