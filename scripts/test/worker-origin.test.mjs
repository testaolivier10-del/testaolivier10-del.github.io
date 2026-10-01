/* The Worker's front door. The assistant path spends a free daily allowance,
   so it must answer only the site's own pages: a request with no Origin header
   (curl, a bot) used to pass the check because the test was "a wrong Origin",
   not "a right one". The two non-assistant routes are deliberately open and
   must stay that way. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import worker from '../../worker/src/index.js';

function fakeEnv() {
  const calls = [];
  return {
    calls,
    AI: { run: async (model) => { calls.push(model); return { response: 'An answer.' }; } },
  };
}

const ask = (headers = {}) => new Request('https://w.example/', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', ...headers },
  body: JSON.stringify({ question: 'What is a buffer?', context: [] }),
});

test('a POST with no Origin header is refused and never reaches the model', async () => {
  const env = fakeEnv();
  const res = await worker.fetch(ask(), env);
  assert.equal(res.status, 403);
  assert.equal(env.calls.length, 0);
});

test('a POST from a foreign origin is refused', async () => {
  const env = fakeEnv();
  const res = await worker.fetch(ask({ Origin: 'https://evil.example' }), env);
  assert.equal(res.status, 403);
  assert.equal(env.calls.length, 0);
});

test('a POST from the site is answered', async () => {
  const env = fakeEnv();
  const res = await worker.fetch(ask({ Origin: 'https://levlprep.com' }), env);
  assert.equal(res.status, 200);
  assert.equal((await res.json()).answer, 'An answer.');
  assert.equal(res.headers.get('Access-Control-Allow-Origin'), 'https://levlprep.com');
});

test('the per-IP throttle still applies to allowed origins', async () => {
  const env = { ...fakeEnv(), RATE_LIMITER: { limit: async () => ({ success: false }) } };
  const res = await worker.fetch(ask({ Origin: 'https://levlprep.com' }), env);
  assert.equal(res.status, 429);
});

test('the unsubscribe link still works with no Origin (it is a link in an email)', async () => {
  // No service key configured: the route answers its own page rather than 403.
  const res = await worker.fetch(new Request('https://w.example/api/unsubscribe?t=abc'), {});
  assert.notEqual(res.status, 403);
});
