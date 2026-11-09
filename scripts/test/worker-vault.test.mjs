/* The Premium vault route (worker/src/vault.js, docs/premium-vault.md). Supabase and the
   VAULT assets binding are faked; no test reaches a real service. */
import { test, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import worker from '../../worker/src/index.js';
import { vaultPath } from '../../worker/src/vault.js';
import { premiumCourse } from '../vault/rules.mjs';
import { stubFor } from '../build-deploy.mjs';

const realFetch = globalThis.fetch;
afterEach(() => { globalThis.fetch = realFetch; });

const SITE = 'https://levlprep.com';
const PAGE = 'bio/lessons/biotechnology.html';
const users = { 'tok-paid': { id: 'u-paid', courses: ['apbio'] }, 'tok-other': { id: 'u-other', courses: ['apchem'] }, 'tok-expired': { id: 'u-exp', courses: [], expired: ['apbio'] } };

function env(extra = {}) {
  return {
    SUPABASE_URL: 'https://sb.test', SUPABASE_SERVICE_KEY: 'service',
    VAULT: { fetch: async (req) => {
      const p = new URL(req.url).pathname.slice(1);
      if (p === '_index.json') return new Response(JSON.stringify({ [PAGE]: 'apbio' }));
      if (p === PAGE) return new Response('<html>the real lesson</html>');
      return new Response('nope', { status: 404 });
    } },
    ...extra,
  };
}
function fakeSupabase() {
  globalThis.fetch = async (url, init = {}) => {
    const tok = String((init.headers || {}).Authorization || '').replace('Bearer ', '');
    const u = users[tok];
    if (String(url).endsWith('/auth/v1/user')) return u ? new Response(JSON.stringify({ id: u.id })) : new Response('{}', { status: 401 });
    if (String(url).endsWith('/rest/v1/rpc/my_premium')) {
      const live = (u ? u.courses : []).map((c) => ({ course: c, expires_at: new Date(Date.now() + 864e5).toISOString() }));
      const old = (u && u.expired || []).map((c) => ({ course: c, expires_at: new Date(Date.now() - 1000).toISOString() }));
      return new Response(JSON.stringify(live.concat(old)));
    }
    throw new Error('unexpected fetch ' + url);
  };
}
async function call(token, { origin = SITE, p = PAGE, method = 'GET', e = env() } = {}) {
  fakeSupabase();
  const headers = { Origin: origin };
  if (token) headers.Authorization = 'Bearer ' + token;
  return worker.fetch(new Request('https://api.levlprep.com/vault?p=' + encodeURIComponent(p), { method, headers }), e, {});
}

test('a reader with a pass for the course gets the page, never cached publicly', async () => {
  const r = await call('tok-paid');
  assert.equal(r.status, 200);
  assert.equal(await r.text(), '<html>the real lesson</html>');
  assert.match(r.headers.get('Cache-Control'), /private, no-store/);
  assert.equal(r.headers.get('Access-Control-Allow-Origin'), SITE);
});

test('no session, a bad session, another course, an expired pass: no page', async () => {
  assert.equal((await call(null)).status, 401);
  assert.equal((await call('tok-unknown')).status, 401);
  const other = await call('tok-other');
  assert.equal(other.status, 403);
  assert.doesNotMatch(await other.text(), /real lesson/);
  assert.equal((await call('tok-expired')).status, 403);
});

test('only the site, only GET, only vaulted paths, no path tricks', async () => {
  assert.equal((await call('tok-paid', { origin: 'https://evil.example' })).status, 403);
  assert.equal((await call('tok-paid', { origin: '' })).status, 403);
  assert.equal((await call('tok-paid', { method: 'POST' })).status, 405);
  assert.equal((await call('tok-paid', { p: 'bio/lessons/not-there.html' })).status, 404);
  assert.equal((await call('tok-paid', { p: '_index.json' })).status, 400);
  assert.equal(vaultPath('../worker/src/index.js'), null);
  assert.equal(vaultPath('bio/lessons/../../x.html'), null);
  assert.equal(vaultPath('/bio/lessons/a-b.html'), 'bio/lessons/a-b.html');
});

test('the preview origin is allowed only when the Worker names it', async () => {
  const preview = 'https://levlprep-site.example.workers.dev';
  assert.equal((await call('tok-paid', { origin: preview })).status, 403);
  assert.equal((await call('tok-paid', { origin: preview, e: env({ SITE_PREVIEW_ORIGIN: preview }) })).status, 200);
});

test('no vault binding: says so instead of failing open', async () => {
  const e = env(); delete e.VAULT;
  assert.equal((await call('tok-paid', { e })).status, 503);
});

test('the rules read each page the way its lock does', () => {
  const ap = (free) => `<script type="application/json" id="bio-page-data">{"topic":"x","free":${free}}</script>`;
  assert.equal(premiumCourse('bio/lessons/x.html', ap(false)), 'apbio');
  assert.equal(premiumCourse('bio/lessons/x.html', ap(true)), null);
  assert.throws(() => premiumCourse('bio/lessons/x.html', '<p>no data</p>'));
  assert.equal(premiumCourse('bio/notes/x.html', ap(false)), null);
  assert.equal(premiumCourse('ochem/lessons/x.html', '<p data-chapter="foundations">'), null);
  assert.equal(premiumCourse('ochem/lessons/x.html', '<p data-chapter="carbonyl-chemistry">'), 'ochem');
  assert.equal(premiumCourse('nremt/lessons/x.html', '<div data-chapter="ch3">'), null);
  assert.equal(premiumCourse('nremt/lessons/x.html', '<div data-chapter="ch12">'), 'nremt');
});

test('a stub keeps the head, drops every script but the vault loader, and holds none of the lesson', () => {
  const html = `<!doctype html><html><head><title>T</title><meta name="description" content="What it teaches."><script>theme()</script><script src="../../assets/x.js" defer></script><script type="application/ld+json">{"a":1}</script></head><body data-topic="t"><h1>Big &amp; small</h1><p>SECRET lesson body that must not be public, long enough to count as a paragraph.</p></body></html>`;
  const s = stubFor('bio/lessons/t.html', html, 'apbio');
  assert.doesNotMatch(s, /SECRET/);
  assert.doesNotMatch(s, /assets\/x\.js/);
  assert.match(s, /theme\(\)/);
  assert.match(s, /ld\+json/);
  assert.match(s, /<body data-topic="t">/);
  assert.match(s, /<h1>Big &amp; small<\/h1>/);
  assert.match(s, /What it teaches\./);
  assert.match(s, /src="\/assets\/vault\.js" data-course="apbio" data-path="bio\/lessons\/t\.html"/);
});
