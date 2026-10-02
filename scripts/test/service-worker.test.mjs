/* sw.js: what the site audit found in it ("Payments, security and data",
   the sw.js rows) and what must not come back:
   - one missing precache file failed the install forever;
   - a 206 (audio range request) went to cache.put(), which throws;
   - the static cache was cache-first forever, so a replaced figure never
     refreshed, and network-first had no timeout on weak wifi;
   - a notification click matched every tab ("/" is in every URL) and would
     open any URL the reminder row carried.
   Run in a VM with just enough service-worker globals. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const SRC = readFileSync('sw.js', 'utf8');
const ORIGIN = 'https://levlprep.com';

function boot({ fetchImpl, tabs = [] } = {}) {
  const handlers = {};
  const stores = new Map();
  const opened = [];
  const cacheFor = (name) => {
    if (!stores.has(name)) stores.set(name, new Map());
    const m = stores.get(name);
    return {
      put: async (req, res) => {
        if (res.status === 206) throw new TypeError('Partial response (status code 206) is unsupported');
        m.set(typeof req === 'string' ? new URL(req, ORIGIN + '/').href : req.url, res);
      },
      match: async (req) => m.get(typeof req === 'string' ? new URL(req, ORIGIN + '/').href : req.url),
    };
  };
  const caches = {
    open: async (name) => cacheFor(name),
    keys: async () => [...stores.keys()],
    delete: async (name) => stores.delete(name),
    match: async (req) => {
      for (const name of stores.keys()) { const hit = await cacheFor(name).match(req); if (hit) return hit; }
      return undefined;
    },
  };
  const clients = tabs.map((url) => ({
    url, focused: false, navigatedTo: null,
    focus() { this.focused = true; return Promise.resolve(this); },
    navigate(u) { this.navigatedTo = u; return Promise.resolve(this); },
  }));
  const self = {
    location: new URL(ORIGIN + '/sw.js'),
    addEventListener: (type, fn) => { handlers[type] = fn; },
    skipWaiting: () => Promise.resolve(),
    clients: {
      claim: () => Promise.resolve(),
      matchAll: async () => clients,
      openWindow: async (u) => { opened.push(u); },
    },
    registration: { showNotification: async () => {}, pushManager: { getSubscription: async () => null } },
  };
  class Req {
    constructor(url, init = {}) { this.url = new URL(url, ORIGIN + '/').href; this.cache = init.cache; this.method = 'GET'; this.mode = init.mode || 'cors'; this.headers = new Headers(init.headers || {}); }
  }
  const sandbox = { self, caches, fetch: fetchImpl || (async () => new Response('x', { status: 200 })), Request: Req, Response, Headers, URL, Promise, setTimeout, clearTimeout, console };
  vm.createContext(sandbox);
  vm.runInContext(SRC, sandbox, { filename: 'sw.js' });
  return { handlers, stores, clients, opened, Req };
}

function resp(status, type = 'basic') {
  const r = new Response(status === 204 ? null : 'body', { status });
  Object.defineProperty(r, 'type', { value: type });
  r.clone = () => resp(status, type);
  return r;
}

test('install survives a missing precache file and fetches past the HTTP cache', async () => {
  const seen = [];
  const { handlers, stores } = boot({
    fetchImpl: async (req) => { seen.push(req); return /premium-gates/.test(req.url) ? resp(404) : resp(200); },
  });
  let done;
  handlers.install({ waitUntil: (p) => { done = p; } });
  await done; // must not reject
  assert.ok(seen.length > 20);
  assert.ok(seen.every((r) => r.cache === 'reload'), 'precache went through the HTTP cache');
  const shell = [...stores.values()][0];
  assert.ok(shell.has(ORIGIN + '/index.html'));
  assert.ok(![...shell.keys()].some((k) => k.includes('premium-gates')), 'a 404 was stored');
});

test('install fails only when a page the offline fallback needs is missing', async () => {
  const { handlers } = boot({ fetchImpl: async (req) => (/offline\.html/.test(req.url) ? resp(500) : resp(200)) });
  let done;
  handlers.install({ waitUntil: (p) => { done = p; } });
  await assert.rejects(done);
});

test('a 206 is never handed to cache.put, and static files refresh behind the cached copy', async () => {
  let n = 0;
  const { handlers, stores, Req } = boot({ fetchImpl: async () => (++n === 1 ? resp(206) : resp(200)) });
  const ev = (url) => {
    let response;
    const waits = [];
    handlers.fetch({ request: new Req(url), respondWith: (p) => { response = p; }, waitUntil: (p) => waits.push(p) });
    return { response, waits };
  };
  const a = ev('/assets/audio/clip.mp3');
  assert.equal((await a.response).status, 206);
  await new Promise((r) => setTimeout(r, 10));
  assert.equal([...stores.values()].reduce((k, m) => k + m.size, 0), 0, 'a 206 was cached');
  // A figure: first view fetches and caches; the next is served from cache
  // while a fresh copy replaces it.
  const b = ev('/assets/fig.png');
  assert.equal((await b.response).status, 200);
  await new Promise((r) => setTimeout(r, 10));
  const c = ev('/assets/fig.png');
  assert.equal((await c.response).status, 200);
  assert.equal(c.waits.length, 1, 'no revalidation behind the cached copy');
});

test('a notification opens only this site, and focuses only a tab on exactly that page', async () => {
  const click = async (env, url) => {
    let p;
    env.handlers.notificationclick({ notification: { close() {}, data: { url } }, waitUntil: (x) => { p = x; } });
    await p;
  };
  const env = boot({ tabs: [ORIGIN + '/ochem/learn.html', ORIGIN + '/nremt/practice.html'] });
  await click(env, '/nremt/practice.html');
  assert.equal(env.clients[1].focused, true);
  assert.equal(env.clients[0].focused, false);

  const env2 = boot({ tabs: [ORIGIN + '/ochem/learn.html'] });
  await click(env2, '/');
  assert.equal(env2.clients[0].navigatedTo, ORIGIN + '/', '"/" matched a tab that is not the home page');

  const env3 = boot({ tabs: [] });
  await click(env3, 'https://evil.example/phish');
  assert.deepEqual(env3.opened, [ORIGIN + '/']);
});

test('network-first pages fall back to the cache after a few seconds, not never', () => {
  const m = SRC.match(/const NETWORK_TIMEOUT_MS = (\d+);/);
  assert.ok(m, 'no network timeout');
  assert.ok(Number(m[1]) >= 3000 && Number(m[1]) <= 4000);
});
