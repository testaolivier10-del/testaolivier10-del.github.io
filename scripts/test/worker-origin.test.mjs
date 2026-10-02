/* The Worker's front door. The assistant path spends a free daily allowance,
   so it must answer only the site's own pages, and only signed-in students:
   a request with no Origin header (curl, a bot) used to pass the check
   because the test was "a wrong Origin", not "a right one", and an Origin is
   one header any script can send. The unsubscribe and reminder-text routes
   are deliberately open (no Origin) and must stay that way, but throttled. */
import { test, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import worker from '../../worker/src/index.js';

const realFetch = globalThis.fetch;
afterEach(() => { globalThis.fetch = realFetch; });

/* Supabase answers for one good token; the database records unsubscribes. */
function fakeEnv(extra = {}) {
  const calls = [];
  const unsubscribed = [];
  globalThis.fetch = async (url, init = {}) => {
    const u = new URL(url);
    if (u.pathname === '/auth/v1/user') {
      return (init.headers.Authorization || '') === 'Bearer good'
        ? new Response(JSON.stringify({ id: 'u1' }), { status: 200 })
        : new Response('{}', { status: 401 });
    }
    if (u.pathname === '/rest/v1/rpc/unsubscribe_email_reminder') {
      unsubscribed.push(JSON.parse(init.body).p_token);
      return new Response('true', { status: 200 });
    }
    return new Response('{}', { status: 404 });
  };
  return {
    calls,
    unsubscribed,
    SUPABASE_URL: 'https://db.test',
    SUPABASE_SERVICE_KEY: 'svc',
    AI: { run: async (model) => { calls.push(model); return { response: 'An answer.' }; } },
    ...extra,
  };
}

const ask = (headers = {}) => new Request('https://w.example/', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', ...headers },
  body: JSON.stringify({ question: 'What is a buffer?', context: [] }),
});
const SITE = { Origin: 'https://levlprep.com' };
const SIGNED_IN = { ...SITE, Authorization: 'Bearer good' };

test('a POST with no Origin header is refused and never reaches the model', async () => {
  const env = fakeEnv();
  const res = await worker.fetch(ask({ Authorization: 'Bearer good' }), env);
  assert.equal(res.status, 403);
  assert.equal(env.calls.length, 0);
});

test('a POST from a foreign origin is refused', async () => {
  const env = fakeEnv();
  const res = await worker.fetch(ask({ Origin: 'https://evil.example', Authorization: 'Bearer good' }), env);
  assert.equal(res.status, 403);
  assert.equal(env.calls.length, 0);
});

test('the assistant needs a signed-in session, not just the right Origin', async () => {
  const env = fakeEnv();
  assert.equal((await worker.fetch(ask(SITE), env)).status, 401);
  assert.equal((await worker.fetch(ask({ ...SITE, Authorization: 'Bearer forged' }), env)).status, 401);
  assert.equal(env.calls.length, 0);
});

test('a POST from the site, signed in, is answered', async () => {
  const env = fakeEnv();
  const res = await worker.fetch(ask(SIGNED_IN), env);
  assert.equal(res.status, 200);
  assert.equal((await res.json()).answer, 'An answer.');
  assert.equal(res.headers.get('Access-Control-Allow-Origin'), 'https://levlprep.com');
});

test('localhost is an allowed origin only on a Worker that says so', async () => {
  const local = { Origin: 'http://localhost:8000', Authorization: 'Bearer good' };
  assert.equal((await worker.fetch(ask(local), fakeEnv())).status, 403);
  assert.equal((await worker.fetch(ask(local), fakeEnv({ ALLOW_LOCALHOST: 'true' }))).status, 200);
});

test('when every model fails, the browser gets a generic error, not the platform\'s', async () => {
  const env = fakeEnv({ AI: { run: async () => { throw new Error('3036: account acct_123 daily limit'); } } });
  const res = await worker.fetch(ask(SIGNED_IN), env);
  assert.equal(res.status, 502);
  const body = await res.json();
  assert.deepEqual(body, { error: 'Model unavailable' });
});

test('the per-IP throttle still applies to allowed origins', async () => {
  const env = fakeEnv({ RATE_LIMITER: { limit: async () => ({ success: false }) } });
  const res = await worker.fetch(ask(SIGNED_IN), env);
  assert.equal(res.status, 429);
});

test('the unsubscribe link still works with no Origin (it is a link in an email)', async () => {
  // No service key configured: the route answers its own page rather than 403.
  const res = await worker.fetch(new Request('https://w.example/api/unsubscribe?t=abc'), {});
  assert.notEqual(res.status, 403);
});

/* Mail scanners open every link in a message: a GET must never delete. */
test('unsubscribe: GET asks, POST (the button, or RFC 8058 one-click) deletes', async () => {
  const env = fakeEnv();
  const token = 'a'.repeat(36);
  const get = await worker.fetch(new Request(`https://w.example/api/unsubscribe?t=${token}`), env);
  assert.equal(get.status, 200);
  const html = await get.text();
  assert.match(html, /<form method="post"/);
  assert.equal(env.unsubscribed.length, 0, 'a GET unsubscribed someone');
  const post = await worker.fetch(new Request(`https://w.example/api/unsubscribe?t=${token}`, {
    method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: 'List-Unsubscribe=One-Click',
  }), env);
  assert.equal(post.status, 200);
  assert.deepEqual(env.unsubscribed, [token]);
  assert.match(await post.text(), /no more reminders/);
});

test('unsubscribe and reminder text are throttled per IP', async () => {
  const env = fakeEnv({ RATE_LIMITER: { limit: async () => ({ success: false }) } });
  assert.equal((await worker.fetch(new Request('https://w.example/api/unsubscribe?t=' + 'a'.repeat(36)), env)).status, 429);
  assert.equal((await worker.fetch(new Request('https://w.example/reminders/text?endpoint=https://fcm.googleapis.com/x'), env)).status, 429);
});
