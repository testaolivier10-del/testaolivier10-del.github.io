/* The once-per-address limits (premium_ledger) and the NREMT pass guarantee.
   worker/src/premium.js: premiumRefund, premiumGuarantee, guaranteeRefusal. */
import { test, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  premiumRefund, premiumGuarantee, guaranteeRefusal, examHistory, emailKey, GUARANTEE,
} from '../../worker/src/premium.js';

const realFetch = globalThis.fetch;
afterEach(() => { globalThis.fetch = realFetch; });

const DAY = 86400000;
const NOW = Date.parse('2026-11-20T15:00:00Z');
const iso = (t) => new Date(t).toISOString();
const ENV = { SUPABASE_URL: 'https://db.test', SUPABASE_SERVICE_KEY: 'svc', POLAR_ACCESS_TOKEN: 'polar_oat_x' };

/* Just enough PostgREST, Supabase auth and Polar for these two routes. The
   ledger and the passes outlive a "deleted account" because the test keeps
   them while swapping the token's user. */
function world({ users, passes = [], progress = {}, polarOk = true }) {
  const ledger = [];
  const claims = [];
  const refundsAsked = [];
  const eq = (r, u) => [...u.searchParams].every(([k, c]) => {
    if (['select', 'order', 'limit'].includes(k)) return true;
    const v = r[k];
    if (c === 'is.null') return v == null;
    if (c === 'not.is.null') return v != null;
    if (c.startsWith('eq.')) return String(v) === c.slice(3);
    throw new Error('filter ' + c);
  });
  globalThis.fetch = async (url, init = {}) => {
    const u = new URL(url);
    const method = init.method || 'GET';
    if (u.pathname === '/auth/v1/user') {
      const tok = (init.headers.Authorization || '').replace('Bearer ', '');
      return users[tok] ? new Response(JSON.stringify(users[tok]), { status: 200 }) : new Response('{}', { status: 401 });
    }
    if (u.hostname === 'api.polar.sh') {
      refundsAsked.push(JSON.parse(init.body));
      return new Response('{}', { status: polarOk ? 201 : 422 });
    }
    const table = u.pathname.replace('/rest/v1/', '');
    const rows = { premium_passes: passes, premium_ledger: ledger, premium_guarantee_claims: claims }[table];
    if (table === 'user_progress') {
      const id = u.searchParams.get('id').slice(3);
      return new Response(JSON.stringify(progress[id] ? [{ data: progress[id] }] : []), { status: 200 });
    }
    if (!rows) return new Response('{}', { status: 404 });
    if (method === 'GET') {
      const out = rows.filter((r) => eq(r, u));
      if (u.searchParams.get('order') === 'expires_at.desc') out.sort((a, b) => b.expires_at.localeCompare(a.expires_at));
      return new Response(JSON.stringify(out), { status: 200 });
    }
    if (method === 'POST') {
      const row = JSON.parse(init.body);
      if (table === 'premium_ledger' && ledger.some((r) => r.email_key === row.email_key && r.kind === row.kind)) {
        return new Response('{"code":"23505"}', { status: 409 });
      }
      rows.push(row);
      return new Response(null, { status: 201 });
    }
    if (method === 'PATCH') {
      for (const r of rows.filter((r) => eq(r, u))) Object.assign(r, JSON.parse(init.body));
      return new Response(null, { status: 204 });
    }
    if (method === 'DELETE') {
      for (const r of rows.filter((r) => eq(r, u))) rows.splice(rows.indexOf(r), 1);
      return new Response(null, { status: 204 });
    }
    return new Response('{}', { status: 405 });
  };
  return { ledger, claims, passes, refundsAsked };
}

const req = (token, body) => new Request('https://w.test/x', {
  method: 'POST', headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' }, body: JSON.stringify(body),
});

const ORDER = '11111111-2222-3333-4444-555555555555';
const ORDER2 = '66666666-2222-3333-4444-555555555555';

test('refund: once per email, even after the account is deleted and made again', async () => {
  const w = world({
    users: { a: { id: 'u1', email: 'Sam@Example.com' }, b: { id: 'u2', email: 'sam@example.com ' } },
    passes: [
      { user_id: 'u1', course: 'nremt', order_id: ORDER, amount_cents: 2030, created_at: iso(NOW - DAY), expires_at: iso(NOW + 80 * DAY) },
      { user_id: 'u2', course: 'nremt', order_id: ORDER2, amount_cents: 2030, created_at: iso(NOW - DAY), expires_at: iso(NOW + 80 * DAY) },
    ],
  });
  const first = await premiumRefund(req('a', { order_id: ORDER }), ENV, NOW);
  assert.equal(first.status, 200);
  assert.equal(w.ledger.length, 1);
  assert.equal(w.ledger[0].email_key, await emailKey('sam@example.com'));
  assert.ok(!JSON.stringify(w.ledger).includes('example'), 'the address itself is never stored');
  // u1 deleted; u2 is the same person with a new account.
  w.passes.splice(0, 1);
  const again = await premiumRefund(req('b', { order_id: ORDER2 }), ENV, NOW);
  assert.equal(again.status, 409);
  assert.match(again.body.error, /one refund/);
  assert.equal(w.refundsAsked.length, 1);
});

test('refund: a refund Polar refuses does not use up the one refund', async () => {
  const w = world({
    users: { a: { id: 'u1', email: 'a@b.co' } },
    passes: [{ user_id: 'u1', course: 'ochem', order_id: ORDER, amount_cents: 2030, created_at: iso(NOW - DAY), expires_at: iso(NOW + 80 * DAY) }],
    polarOk: false,
  });
  const r = await premiumRefund(req('a', { order_id: ORDER }), ENV, NOW);
  assert.equal(r.status, 502);
  assert.equal(w.ledger.length, 0);
  assert.equal(w.passes[0].refunded_at, undefined);
});

const paid = { order_id: 'o1', amount_cents: 2030, refunded_at: null, starts_at: iso(NOW - 60 * DAY), expires_at: iso(NOW + 30 * DAY) };
const day = (t) => new Date(t).toISOString().slice(0, 10);
const exams = (n, at = NOW - 20 * DAY) => Array.from({ length: n }, (_, i) => ({ score: 70, total: 100, date: at + i * 3600000 }));

test('guarantee rules', () => {
  const ok = { passes: [paid], examDate: day(NOW - 5 * DAY), history: exams(2), used: false, now: NOW };
  assert.equal(guaranteeRefusal(ok), null);
  assert.match(guaranteeRefusal({ ...ok, passes: [] }), /bought NREMT pass/);
  assert.match(guaranteeRefusal({ ...ok, passes: [{ ...paid, order_id: null, amount_cents: null }] }), /bought NREMT pass/); // free month
  assert.match(guaranteeRefusal({ ...ok, passes: [{ ...paid, refunded_at: iso(NOW) }] }), /bought NREMT pass/);
  assert.match(guaranteeRefusal({ ...ok, used: true }), /already used/);
  assert.match(guaranteeRefusal({ ...ok, examDate: 'soon' }), /date of your exam/);
  assert.match(guaranteeRefusal({ ...ok, examDate: day(NOW + 3 * DAY) }), /future/);
  assert.match(guaranteeRefusal({ ...ok, examDate: day(NOW - 31 * DAY) }), /within 30 days/);
  assert.match(guaranteeRefusal({ ...ok, examDate: day(NOW - 29 * DAY), passes: [{ ...paid, starts_at: iso(NOW - 10 * DAY) }] }), /fall within/);
  assert.match(guaranteeRefusal({ ...ok, history: exams(1) }), /has 1/);
  // Exams from before the pass, or after the real exam, do not count.
  assert.match(guaranteeRefusal({ ...ok, history: exams(2, NOW - 90 * DAY) }), /has 0/);
  assert.match(guaranteeRefusal({ ...ok, history: exams(2, NOW - 2 * DAY) }), /has 0/);
  assert.equal(GUARANTEE.extendDays, 90);
});

test('exam history is read from both synced row shapes', () => {
  const h = JSON.stringify(exams(3));
  assert.equal(examHistory({ v: 2, ns: { nremt: { nremt_exam100_history: h } } }).length, 3);
  assert.equal(examHistory({ nremt_exam100_history: h }).length, 3);
  assert.deepEqual(examHistory({ v: 2, ns: {} }), []);
  assert.deepEqual(examHistory({ nremt_exam100_history: '{oops' }), []);
  assert.deepEqual(examHistory(null), []);
});

test('guarantee: adds 90 days after the current pass, once, and records the claim', async () => {
  const w = world({
    users: { a: { id: 'u1', email: 'cand@x.org' }, b: { id: 'u2', email: 'CAND@x.org' } },
    passes: [{ user_id: 'u1', course: 'nremt', pass: 'nremt-90', ...paid }],
    progress: { u1: { v: 2, ns: { nremt: { nremt_exam100_history: JSON.stringify(exams(2)) } } } },
  });
  const body = { legal_name: '  Sam   Lee ', state: 'Minnesota', exam_date: day(NOW - 5 * DAY) };
  const r = await premiumGuarantee(req('a', body), ENV, NOW);
  assert.equal(r.status, 200);
  const ext = w.passes.find((p) => p.pass === 'guarantee');
  assert.equal(ext.starts_at, paid.expires_at);
  assert.equal(Date.parse(ext.expires_at) - Date.parse(ext.starts_at), 90 * DAY);
  assert.equal(ext.order_id, undefined);
  assert.deepEqual(w.claims[0], { user_id: 'u1', legal_name: 'Sam Lee', state: 'Minnesota', exam_date: body.exam_date });

  const twice = await premiumGuarantee(req('a', body), ENV, NOW);
  assert.equal(twice.status, 409);
  assert.match(twice.body.error, /already used/);

  // A new account on the same address, with its own bought pass, still can't.
  w.passes.push({ user_id: 'u2', course: 'nremt', pass: 'nremt-90', ...paid, order_id: 'o2' });
  const fresh = await premiumGuarantee(req('b', body), ENV, NOW);
  assert.equal(fresh.status, 409);
  assert.equal(w.passes.filter((p) => p.pass === 'guarantee').length, 1);
});

test('guarantee: refuses a missing name or state, a signed-out caller and a claim without exams', async () => {
  const w = world({ users: { a: { id: 'u1', email: 'c@x.org' } }, passes: [{ user_id: 'u1', course: 'nremt', ...paid }] });
  const good = { legal_name: 'Sam Lee', state: 'MN', exam_date: day(NOW - DAY) };
  assert.equal((await premiumGuarantee(req('a', { ...good, legal_name: 'S' }), ENV, NOW)).status, 400);
  assert.equal((await premiumGuarantee(req('a', { ...good, state: '' }), ENV, NOW)).status, 400);
  assert.equal((await premiumGuarantee(req('nobody', good), ENV, NOW)).status, 401);
  const r = await premiumGuarantee(req('a', good), ENV, NOW);
  assert.equal(r.status, 409);
  assert.match(r.body.error, /has 0/);
  assert.equal(w.ledger.length, 0);
});
