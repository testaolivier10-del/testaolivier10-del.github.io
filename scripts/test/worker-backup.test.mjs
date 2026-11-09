/* The Worker's nightly backup (worker/src/backup.js, docs/backups.md). Supabase and KV are faked. */
import { test, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import worker from '../../worker/src/index.js';
import { runBackup, contentRange, BACKUP_CRON } from '../../worker/src/backup.js';
import { readFileSync } from 'node:fs';

const realFetch = globalThis.fetch;
afterEach(() => { globalThis.fetch = realFetch; });

function kv() {
  const m = new Map();
  return { m, get: async (k, t) => (m.has(k) ? (t === 'json' ? JSON.parse(m.get(k).v) : m.get(k).v) : null),
    put: async (k, v, o) => { m.set(k, { v: typeof v === 'string' ? v : new TextDecoder().decode(v), o }); } };
}
const DB = { big: 2500, small: 3, empty: 0 };
function fake({ failOn } = {}) {
  let calls = 0;
  globalThis.fetch = async (url, init = {}) => {
    calls++;
    const u = new URL(url);
    const h = init.headers || {};
    assert.equal(h.apikey, 'svc');
    if (u.pathname === '/rest/v1/') return new Response(JSON.stringify({ definitions: Object.fromEntries(Object.keys(DB).map((k) => [k, {}])) }));
    if (u.pathname === '/auth/v1/admin/users') return new Response(JSON.stringify({ users: [{ id: 'a' }, { id: 'b' }] }), { headers: { 'x-total-count': '2' } });
    const t = u.pathname.split('/').pop();
    if (t === failOn) return new Response('boom', { status: 500 });
    const [from, to] = h.Range.split('-').map(Number);
    const n = DB[t];
    if (!n) return new Response('[]', { status: 200, headers: { 'Content-Range': '*/0' } });
    const end = Math.min(to, n - 1);
    const rows = Array.from({ length: end - from + 1 }, (_, i) => ({ id: from + i }));
    return new Response(JSON.stringify(rows), { status: 206, headers: { 'Content-Range': `${from}-${end}/${n}` } });
  };
  return () => calls;
}
const env = (B) => ({ BACKUPS: B, SUPABASE_URL: 'https://sb.test', SUPABASE_SERVICE_KEY: 'svc' });
const T = Date.parse('2026-11-09T10:00:00Z');

test('copies every table page by page, then auth users, and writes the manifest', async () => {
  const B = kv(); fake();
  const r = await runBackup(env(B), T);
  assert.equal(r.done, true);
  assert.deepEqual(JSON.parse(B.m.get('db/2026-11-09/t/big/2.json').v).length, 500);
  assert.equal(JSON.parse(B.m.get('db/2026-11-09/t/small/0.json').v).length, 3);
  assert.ok(B.m.has('db/2026-11-09/t/empty/0.json'));
  assert.ok(B.m.has('db/2026-11-09/auth/0.json'));
  const man = JSON.parse(B.m.get('db/2026-11-09/manifest.json').v);
  assert.deepEqual(man.tables.big, { rows: 2500, pages: 3, bytes: man.tables.big.bytes });
  assert.equal(man.tables['auth.users'].rows, 2);
  assert.equal(JSON.parse(B.m.get('db/latest').v).rows, 2505);
  assert.equal(B.m.get('db/2026-11-09/t/big/0.json').o.expirationTtl, 35 * 24 * 3600);
  // A later step the same day does nothing.
  const calls = fake();
  assert.deepEqual(await runBackup(env(B), T + 1200e3), { day: '2026-11-09', done: true });
  assert.equal(calls(), 0);
});

test('a failure keeps the progress, a later step finishes it, and nothing is marked complete early', async () => {
  const B = kv(); fake({ failOn: 'small' });
  const r1 = await runBackup(env(B), T);
  assert.equal(r1.done, false);
  assert.match(r1.error, /small page 0: 500/);
  assert.ok(!B.m.has('db/latest'));
  fake();
  const r2 = await runBackup(env(B), T + 1200e3);
  assert.equal(r2.done, true);
  assert.ok(B.m.has('db/latest'));
});

test('a short page is an error, not a finished table', async () => {
  const B = kv();
  globalThis.fetch = async (url, init = {}) => {
    const u = new URL(url);
    if (u.pathname === '/rest/v1/') return new Response(JSON.stringify({ definitions: { big: {} } }));
    return new Response('[]', { status: 206, headers: { 'Content-Range': '0-499/2500' } });
  };
  const r = await runBackup(env(B), T);
  assert.equal(r.done, false);
  assert.match(r.error, /came back short/);
});

test('contentRange reads PostgREST counts', () => {
  assert.deepEqual(contentRange('0-999/12691'), { from: 0, to: 999, total: 12691 });
  assert.deepEqual(contentRange('*/0'), { from: null, to: null, total: 0 });
  assert.equal(contentRange('nonsense'), null);
});

test('the cron in wrangler.toml matches, and the scheduled handler routes it to the backup alone', async () => {
  assert.match(readFileSync('worker/wrangler.toml', 'utf8'), new RegExp(`"${BACKUP_CRON.replace(/[*]/g, '\\*')}"`));
  const B = kv(); fake();
  const waits = [];
  await worker.scheduled({ cron: BACKUP_CRON, scheduledTime: T }, env(B), { waitUntil: (p) => waits.push(p) });
  await Promise.all(waits);
  assert.ok(B.m.has('db/latest'));
});
