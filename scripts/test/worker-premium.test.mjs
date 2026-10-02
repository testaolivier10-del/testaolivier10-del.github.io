/* worker/src/premium.js — Polar checkout and webhook.

   What must not break: the pass ids the site sells and the ones the Worker
   knows are the same list; the return address cannot be pointed off-site; a
   webhook is believed only with a fresh, valid signature; and Polar
   delivering the same order twice adds one pass, not two. */
import { test, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { createBrowser } from './harness.mjs';
import { premiumRpc } from './worker-fakes.mjs';
import worker from '../../worker/src/index.js';
import {
  PASSES, safeReturnTo, successUrl, verifyWebhook, premiumWebhook, refundRefusal, REFUND_WINDOW_DAYS,
  COURSE_NAMES, passesEnding, runPassEnding, reconcilePolar, DISPUTE_WINDOW_DAYS,
} from '../../worker/src/premium.js';

const SECRET = 'polar_whs_test_secret';
const realFetch = globalThis.fetch;
afterEach(() => { globalThis.fetch = realFetch; });

function sign(body, { id = 'msg_1', ts = Math.floor(Date.now() / 1000), secret = SECRET } = {}) {
  // Exactly what polar-js validateEvent does: base64(secret) handed to
  // standardwebhooks, which decodes it back, so the key is the secret's bytes.
  const key = Buffer.from(Buffer.from(secret, 'utf-8').toString('base64'), 'base64');
  const sig = createHmac('sha256', key).update(`${id}.${ts}.${body}`).digest('base64');
  return { 'webhook-id': id, 'webhook-timestamp': String(ts), 'webhook-signature': `v1,${sig}` };
}

test('signature: Standard Webhooks key (secrets made from Sept 2026) passes', async () => {
  const secret = 'whsec_' + Buffer.from('a-new-polar-endpoint-key-32bytes').toString('base64');
  const body = '{"type":"order.paid"}';
  const id = 'msg_2';
  const now = Math.floor(Date.now() / 1000);
  // What a Standard Webhooks library signs with: the decoded bytes after whsec_.
  const key = Buffer.from(secret.slice(6), 'base64');
  const sig = createHmac('sha256', key).update(`${id}.${now}.${body}`).digest('base64');
  const headers = { 'webhook-id': id, 'webhook-timestamp': String(now), 'webhook-signature': `v1,${sig}` };
  assert.equal(await verifyWebhook(body, headers, secret, now), true);
  assert.equal(await verifyWebhook(body + ' ', headers, secret, now), false);
  // The legacy key still works for the same secret.
  assert.equal(await verifyWebhook(body, sign(body, { id, ts: now, secret }), secret, now), true);
});

test('PASSES matches every pass the site offers', () => {
  const b = createBrowser();
  b.load('assets/premium.js');
  const site = {};
  for (const [course, c] of Object.entries(b.window.LevlPremium.COURSES)) {
    for (const p of c.passes || []) site[p.id] = course;
  }
  assert.deepEqual(Object.keys(site).sort(), Object.keys(PASSES).sort());
  for (const [id, course] of Object.entries(site)) assert.equal(PASSES[id].course, course, id);
});

test('returnTo is limited to https://levlprep.com', () => {
  assert.equal(safeReturnTo('https://levlprep.com/ochem/practice.html?x=1'), 'https://levlprep.com/ochem/practice.html?x=1');
  for (const bad of ['https://evil.example/', 'http://levlprep.com/', 'https://levlprep.com.evil.example/',
    'https://user@levlprep.com/', 'https://levlprep.com:8443/', 'javascript:alert(1)', '', null, '//evil.example']) {
    assert.equal(safeReturnTo(bad), 'https://levlprep.com/', String(bad));
  }
});

test('success URL carries what handleReturn() reads, braces intact', () => {
  const u = successUrl('https://levlprep.com/nremt/exam.html?a=1#results', 'nremt');
  assert.equal(u, 'https://levlprep.com/nremt/exam.html?a=1&premium=success&course=nremt&checkout_id={CHECKOUT_ID}');
});

test('signature: good passes, wrong secret / tampered body / stale fails', async () => {
  const body = '{"type":"order.paid"}';
  const now = Math.floor(Date.now() / 1000);
  assert.equal(await verifyWebhook(body, sign(body), SECRET, now), true);
  assert.equal(await verifyWebhook(body, sign(body, { secret: 'other' }), SECRET, now), false);
  assert.equal(await verifyWebhook(body + ' ', sign(body), SECRET, now), false);
  assert.equal(await verifyWebhook(body, sign(body, { ts: now - 3 * 86400 - 1 }), SECRET, now), false);
  assert.equal(await verifyWebhook(body, sign(body, { ts: now + 3 * 86400 + 1 }), SECRET, now), false);
  assert.equal(await verifyWebhook(body, sign(body), '', now), false);
  // Redelivered events keep their original timestamp; an hour old still passes.
  assert.equal(await verifyWebhook(body, sign(body, { ts: now - 3600 }), SECRET, now), true);
  // Whitespace around a pasted secret is ignored.
  assert.equal(await verifyWebhook(body, sign(body), SECRET + '\n', now), true);
  // Several signatures (secret rotation): any one valid entry is enough.
  const h = sign(body);
  h['webhook-signature'] = `v1,AAAA ${h['webhook-signature']}`;
  assert.equal(await verifyWebhook(body, h, SECRET, now), true);
});

/* A tiny PostgREST: premium_passes with a unique order_id, and the Premium
   database functions (worker-fakes.mjs) on the database clock `now`. */
function fakeDb(rows = [], now = Date.now()) {
  const calls = [];
  const counts = [];
  globalThis.fetch = async (url, init = {}) => {
    const u = new URL(url);
    calls.push({ method: init.method || 'GET', url: u.pathname + u.search });
    if (u.pathname.startsWith('/rest/v1/rpc/')) {
      return premiumRpc(rows, u.pathname.split('/').pop(), JSON.parse(init.body || '{}'), now, counts) || new Response('{}', { status: 404 });
    }
    if (!u.pathname.endsWith('/rest/v1/premium_passes')) return new Response('{}', { status: 404 });
    if ((init.method || 'GET') === 'GET') {
      const user = u.searchParams.get('user_id').replace('eq.', '');
      const course = u.searchParams.get('course').replace('eq.', '');
      const live = rows.filter((r) => r.user_id === user && r.course === course && !r.refunded_at)
        .sort((a, b) => b.expires_at.localeCompare(a.expires_at));
      return new Response(JSON.stringify(live.slice(0, 1)), { status: 200 });
    }
    if (init.method === 'POST') {
      const row = JSON.parse(init.body);
      if (rows.some((r) => r.order_id === row.order_id)) return new Response('{"code":"23505"}', { status: 409 });
      rows.push(row);
      return new Response(null, { status: 201 });
    }
    if (init.method === 'PATCH') {
      const id = u.searchParams.get('order_id').replace('eq.', '');
      for (const r of rows) if (r.order_id === id && !r.refunded_at) Object.assign(r, JSON.parse(init.body));
      return new Response(null, { status: 204 });
    }
    return new Response('{}', { status: 405 });
  };
  return { rows, calls, counts };
}

const ENV = {
  SUPABASE_URL: 'https://db.example', SUPABASE_SERVICE_KEY: 'svc', POLAR_WEBHOOK_SECRET: SECRET,
  POLAR_PRODUCTS: JSON.stringify({ 'ochem-year': 'prod_oy' }),
};
const USER = '11111111-1111-1111-1111-111111111111';

function delivery(event, now = Date.now()) {
  const body = JSON.stringify(event);
  return new Request('https://w.example/premium/webhook', {
    method: 'POST', body, headers: sign(body, { ts: Math.floor(now / 1000) }),
  });
}

const paid = (over = {}) => ({
  type: 'order.paid',
  data: { id: 'ord_1', status: 'paid', net_amount: 2900, total_amount: 2900, product_id: 'prod_x',
    metadata: { user_id: USER, pass: 'nremt-90' }, customer: { external_id: USER }, ...over },
});

test('order.paid adds one pass; the same order delivered again adds nothing', async () => {
  const now = Date.UTC(2026, 9, 1);
  const db = fakeDb([], now);
  const r1 = await premiumWebhook(delivery(paid(), now), ENV, now);
  const r2 = await premiumWebhook(delivery(paid(), now), ENV, now);
  assert.equal(r1.status, 200);
  assert.equal(r2.status, 200);
  assert.equal(r2.body.duplicate, true);
  assert.equal(db.rows.length, 1);
  const row = db.rows[0];
  assert.equal(row.course, 'nremt');
  assert.equal(row.amount_cents, 2900);
  assert.equal(row.starts_at, new Date(now).toISOString());
  assert.equal(row.expires_at, new Date(now + 90 * 86400000).toISOString());
  // Paid is counted here, once, where it is a fact (not by the browser).
  assert.deepEqual(db.counts, ['nremt']);
});

test('order.paid stores Polar\'s order time and customer for the refund rules', async () => {
  const now = Date.UTC(2026, 9, 3);
  const db = fakeDb([], now);
  const r = await premiumWebhook(delivery(paid({ id: 'ord_t', created_at: '2026-10-01T08:00:00Z', customer_id: 'cus_9' }), now), ENV, now);
  assert.equal(r.status, 200);
  assert.equal(db.rows[0].order_created_at, '2026-10-01T08:00:00.000Z');
  assert.equal(db.rows[0].customer_id, 'cus_9');
});

test('a second pass starts when the running one ends; refunded ones do not count', async () => {
  const now = Date.UTC(2026, 9, 1);
  const db = fakeDb([
    { user_id: USER, course: 'ochem', order_id: 'old', expires_at: '2026-12-01T00:00:00.000Z' },
    { user_id: USER, course: 'ochem', order_id: 'ref', expires_at: '2027-06-01T00:00:00.000Z', refunded_at: '2026-09-01T00:00:00.000Z' },
  ], now);
  // No metadata.pass: falls back to the product id; user from external_id.
  const r = await premiumWebhook(delivery(paid({ id: 'ord_2', metadata: {}, product_id: 'prod_oy' }), now), ENV, now);
  assert.equal(r.status, 200);
  const row = db.rows.find((x) => x.order_id === 'ord_2');
  assert.equal(row.pass, 'ochem-year');
  assert.equal(row.starts_at, '2026-12-01T00:00:00.000Z');
  assert.equal(row.expires_at, new Date(Date.UTC(2026, 11, 1) + 365 * 86400000).toISOString());
});

test('order.refunded marks the pass; partial refunds and unknown events are a 2xx no-op', async () => {
  const now = Date.UTC(2026, 9, 1);
  const db = fakeDb([{ user_id: USER, course: 'nremt', order_id: 'ord_1', expires_at: '2027-01-01T00:00:00.000Z' }], now);
  const partial = await premiumWebhook(delivery({ type: 'order.refunded', data: { id: 'ord_1', status: 'partially_refunded', refunded_amount: 500, total_amount: 2900 } }, now), ENV, now);
  assert.equal(partial.status, 200);
  assert.equal(db.rows[0].refunded_at, undefined);
  const full = await premiumWebhook(delivery({ type: 'order.refunded', data: { id: 'ord_1', status: 'refunded' } }, now), ENV, now);
  assert.equal(full.status, 200);
  assert.equal(db.rows[0].refunded_at, new Date(now).toISOString());
  const other = await premiumWebhook(delivery({ type: 'checkout.updated', data: {} }, now), ENV, now);
  assert.ok(other.status >= 200 && other.status < 300);
});

/* Site audit, Fix-first 4: two passes plus one refund, or a guarantee plus
   a refund, kept up to 180 days for one payment. */
test('a refund re-chains the queued pass and takes back the guarantee it funded', async () => {
  const now = Date.UTC(2026, 9, 1);
  const db = fakeDb([], now);
  await premiumWebhook(delivery(paid({ id: 'A' }), now), ENV, now);
  await premiumWebhook(delivery(paid({ id: 'B' }), now), ENV, now);
  const [a, b] = db.rows;
  assert.equal(b.starts_at, a.expires_at, 'the second pass is queued behind the first');
  db.rows.push({ id: 9, user_id: USER, course: 'nremt', pass: 'guarantee', funded_by: 'A',
    starts_at: b.expires_at, expires_at: new Date(Date.parse(b.expires_at) + 90 * 86400000).toISOString() });
  const r = await premiumWebhook(delivery({ type: 'order.refunded', data: { id: 'A', status: 'refunded' } }, now), ENV, now);
  assert.equal(r.status, 200);
  assert.ok(a.refunded_at);
  assert.equal(b.starts_at, new Date(now).toISOString(), 'B moves up to start now');
  assert.equal(b.expires_at, new Date(now + 90 * 86400000).toISOString());
  assert.ok(db.rows.find((x) => x.pass === 'guarantee').refunded_at, 'the guarantee A paid for is taken back');
});

test('a bad signature never touches the database', async () => {
  const db = fakeDb();
  const req = new Request('https://w.example/premium/webhook', {
    method: 'POST', body: JSON.stringify(paid()), headers: sign('something else'),
  });
  const res = await worker.fetch(req, ENV);
  assert.equal(res.status, 403);
  assert.equal(db.calls.length, 0);
});

test('checkout: verifies the session, then asks Polar with the right fields', async () => {
  const sent = [];
  globalThis.fetch = async (url, init = {}) => {
    sent.push({ url: String(url), init });
    if (String(url).endsWith('/auth/v1/user')) {
      return init.headers.Authorization === 'Bearer good'
        ? new Response(JSON.stringify({ id: USER, email: 'a@b.co' }), { status: 200 })
        : new Response('{}', { status: 401 });
    }
    return new Response(JSON.stringify({ url: 'https://polar.example/c/xyz' }), { status: 201 });
  };
  const env = { ...ENV, POLAR_ACCESS_TOKEN: 'pat', POLAR_API: 'https://sandbox-api.polar.sh', FOUNDING_DISCOUNT_ID: 'disc_1' };
  const req = (token, returnTo) => new Request('https://w.example/premium/checkout', {
    method: 'POST',
    headers: { Origin: 'https://levlprep.com', 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ pass: 'ochem-year', returnTo }),
  });

  const bad = await worker.fetch(req('nope', 'https://levlprep.com/'), env);
  assert.equal(bad.status, 401);

  const res = await worker.fetch(req('good', 'https://evil.example/'), env);
  assert.equal(res.status, 200);
  assert.equal((await res.json()).url, 'https://polar.example/c/xyz');
  const polar = sent.at(-1);
  assert.equal(polar.url, 'https://sandbox-api.polar.sh/v1/checkouts/');
  const body = JSON.parse(polar.init.body);
  assert.deepEqual(body.products, ['prod_oy']);
  assert.equal(body.external_customer_id, USER);
  assert.equal(body.customer_email, 'a@b.co');
  assert.deepEqual(body.metadata, { user_id: USER, pass: 'ochem-year' });
  assert.equal(body.discount_id, 'disc_1');
  assert.equal(body.success_url, 'https://levlprep.com/?premium=success&course=ochem&checkout_id={CHECKOUT_ID}');
});

test('checkout is refused from a foreign origin and answers 503 before setup', async () => {
  globalThis.fetch = async () => { throw new Error('should not be called'); };
  const mk = (origin) => new Request('https://w.example/premium/checkout', {
    method: 'POST', headers: { Origin: origin, Authorization: 'Bearer t' }, body: '{"pass":"nremt-90"}',
  });
  assert.equal((await worker.fetch(mk('https://evil.example'), ENV)).status, 403);
  assert.equal((await worker.fetch(mk('https://levlprep.com'), ENV)).status, 503);
  const pre = await worker.fetch(new Request('https://w.example/premium/checkout', { method: 'OPTIONS', headers: { Origin: 'https://levlprep.com' } }), ENV);
  assert.match(pre.headers.get('Access-Control-Allow-Headers'), /Authorization/);
});

test('self-serve refund rules: own paid order, within 7 days, once per account', () => {
  const now = Date.parse('2026-10-20T12:00:00Z');
  const day = 86400000;
  const row = { order_id: 'o1', amount_cents: 2030, refunded_at: null, created_at: new Date(now - 3 * day).toISOString() };
  assert.equal(REFUND_WINDOW_DAYS, 7);
  assert.equal(refundRefusal(row, 0, now), null);
  assert.match(refundRefusal(undefined, 0, now), /can’t be refunded/);                       // not theirs / unknown
  assert.match(refundRefusal({ ...row, order_id: null }, 0, now), /can’t be refunded/);      // free month
  assert.match(refundRefusal({ ...row, amount_cents: 0 }, 0, now), /can’t be refunded/);
  assert.match(refundRefusal({ ...row, refunded_at: '2026-10-19T00:00:00Z' }, 0, now), /already been refunded/);
  assert.match(refundRefusal({ ...row, created_at: new Date(now - 8 * day).toISOString() }, 0, now), /7 days/);
  assert.equal(refundRefusal({ ...row, created_at: new Date(now - 7 * day + 60000).toISOString() }, 0, now), null);
  assert.match(refundRefusal(row, 1, now), /already had its one refund/);
});

/* ---- The cron: pass-ending email, Polar reconciliation, lost disputes ---- */

/* A slightly bigger PostgREST than fakeDb(): the filters the cron uses, plus
   Supabase's admin user lookup, Resend and Polar's list endpoints. */
function fakeWorld({ rows = [], emails = {}, orders = [], disputes = [], polarStatus = 200, now = Date.UTC(2026, 9, 1, 12) } = {}) {
  const sent = [];
  const polarCalls = [];
  const match = (r, key, cond) => {
    const v = r[key];
    if (cond === 'is.null') return v == null;
    const [op, ...rest] = cond.split('.');
    const arg = rest.join('.');
    if (op === 'not' && arg === 'is.null') return v != null;
    if (op === 'eq') return String(v) === arg;
    if (op === 'gt') return v != null && Date.parse(v) > Date.parse(arg);
    if (op === 'lte') return v != null && Date.parse(v) <= Date.parse(arg);
    if (op === 'in') return arg.slice(1, -1).split(',').map((x) => x.replace(/^"|"$/g, '')).includes(String(v));
    throw new Error('filter ' + cond);
  };
  const filtered = (u) => rows.filter((r) => [...u.searchParams].every(([k, c]) =>
    ['select', 'order', 'limit'].includes(k) || match(r, k, c)));
  let nextId = 1000;
  globalThis.fetch = async (url, init = {}) => {
    const u = new URL(url);
    const method = init.method || 'GET';
    if (u.hostname === 'api.resend.com') {
      sent.push(JSON.parse(init.body));
      return new Response('{"id":"e"}', { status: 200 });
    }
    if (u.pathname.startsWith('/auth/v1/admin/users/')) {
      const id = decodeURIComponent(u.pathname.split('/').pop());
      return new Response(JSON.stringify({ id, email: emails[id] || null }), { status: 200 });
    }
    if (u.hostname === 'api.polar.sh') {
      polarCalls.push(u.pathname + u.search);
      if (polarStatus !== 200) return new Response('{}', { status: polarStatus });
      let items = u.pathname === '/v1/orders/' ? orders : disputes;
      const st = u.searchParams.getAll('status');
      if (u.pathname === '/v1/disputes/' && st.length) items = items.filter((d) => st.includes(d.status));
      return new Response(JSON.stringify({ items, pagination: { total_count: items.length, max_page: 1 } }), { status: 200 });
    }
    if (u.pathname.startsWith('/rest/v1/rpc/')) {
      return premiumRpc(rows, u.pathname.split('/').pop(), JSON.parse(init.body || '{}'), now) || new Response('{}', { status: 404 });
    }
    if (!u.pathname.endsWith('/rest/v1/premium_passes')) return new Response('{}', { status: 404 });
    if (method === 'GET') {
      let out = filtered(u);
      if (u.searchParams.get('order') === 'expires_at.desc') out = out.sort((a, b) => b.expires_at.localeCompare(a.expires_at));
      const limit = Number(u.searchParams.get('limit') || 0);
      return new Response(JSON.stringify(limit ? out.slice(0, limit) : out), { status: 200 });
    }
    if (method === 'POST') {
      const row = JSON.parse(init.body);
      if (rows.some((r) => r.order_id === row.order_id)) return new Response('{"code":"23505"}', { status: 409 });
      rows.push({ id: nextId++, ...row });
      return new Response(null, { status: 201 });
    }
    if (method === 'PATCH') {
      const hit = filtered(u);
      for (const r of hit) Object.assign(r, JSON.parse(init.body));
      return new Response(JSON.stringify(hit), { status: 200 });
    }
    return new Response('{}', { status: 405 });
  };
  return { rows, sent, polarCalls };
}

const CRON_ENV = { ...ENV, RESEND_API_KEY: 're_test', POLAR_ACCESS_TOKEN: 'polar_oat_x' };
const DAY = 86400000;
const iso = (t) => new Date(t).toISOString();

test('COURSE_NAMES match the site', () => {
  const b = createBrowser();
  b.load('assets/premium.js');
  for (const [course, c] of Object.entries(b.window.LevlPremium.COURSES)) assert.equal(COURSE_NAMES[course], c.name, course);
});

test('pass ending: ends in 2 days -> one email, sent once', async () => {
  const now = Date.UTC(2026, 9, 1, 12);
  const USER2 = '22222222-2222-2222-2222-222222222222';
  const w = fakeWorld({
    rows: [
      { id: 1, user_id: USER, course: 'ochem', pass: 'ochem-semester', expires_at: iso(now + 2 * DAY), order_id: 'o1' },
      { id: 2, user_id: USER2, course: 'anp', pass: 'grant', expires_at: iso(now + 10 * DAY) },
    ],
    emails: { [USER]: 'student@example.com', [USER2]: 'other@example.com' },
  });
  const r1 = await runPassEnding(CRON_ENV, now);
  assert.equal(r1.sent, 1);
  assert.equal(w.sent.length, 1);
  assert.deepEqual(w.sent[0].to, ['student@example.com']);
  assert.match(w.sent[0].subject, /Organic Chemistry pass ends on October 3, 2026/);
  assert.match(w.sent[0].html, /https:\/\/levlprep\.com\/account\.html/);
  assert.match(w.sent[0].html, /progress is kept/);
  assert.equal(w.rows[0].ending_reminded_at, iso(now));
  assert.equal(w.rows[1].ending_reminded_at, undefined);
  const r2 = await runPassEnding(CRON_ENV, now + 3600000);
  assert.equal(w.sent.length, 1, 'not sent twice');
  assert.equal(r2.due, 0);
});

test('pass ending: a later pass queued, or a refunded pass, means no email', async () => {
  const now = Date.UTC(2026, 9, 1, 12);
  const w = fakeWorld({
    rows: [
      // Ending soon, but a later pass for the same course follows it.
      { id: 1, user_id: USER, course: 'ochem', expires_at: iso(now + 2 * DAY), order_id: 'o1' },
      { id: 2, user_id: USER, course: 'ochem', expires_at: iso(now + 152 * DAY), order_id: 'o2' },
      // Refunded and ending soon: gone already, nothing to remind about.
      { id: 3, user_id: USER, course: 'nremt', expires_at: iso(now + 1 * DAY), order_id: 'o3', refunded_at: iso(now - DAY) },
    ],
    emails: { [USER]: 'student@example.com' },
  });
  const r = await runPassEnding(CRON_ENV, now);
  assert.equal(w.sent.length, 0);
  assert.equal(r.due, 0);
  assert.ok(w.rows.every((x) => !x.ending_reminded_at));
  // A refunded later pass does not count as "later": the earlier one is ending.
  w.rows[1].refunded_at = iso(now);
  await runPassEnding(CRON_ENV, now);
  assert.equal(w.sent.length, 1);
  assert.equal(w.rows[0].ending_reminded_at, iso(now));
  // Pure selection agrees.
  assert.deepEqual(passesEnding([{ user_id: USER, course: 'anp', expires_at: iso(now + 4 * DAY) }], now), []);
});

test('pass ending: a free grant or a guarantee extension gets no "you bought" email', async () => {
  const now = Date.UTC(2026, 9, 1, 12);
  const w = fakeWorld({
    rows: [
      { id: 1, user_id: USER, course: 'anp', pass: 'grant', expires_at: iso(now + 2 * DAY) },
      { id: 2, user_id: USER, course: 'nremt', pass: 'nremt-90', order_id: 'o1', expires_at: iso(now - DAY) },
      { id: 3, user_id: USER, course: 'nremt', pass: 'guarantee', expires_at: iso(now + 2 * DAY) },
    ],
    emails: { [USER]: 'student@example.com' },
  });
  await runPassEnding(CRON_ENV, now);
  assert.equal(w.sent.length, 0);
  assert.deepEqual(passesEnding([{ user_id: USER, course: 'anp', pass: 'grant', expires_at: iso(now + 2 * DAY) }], now), []);
});

test('reconcile: a paid order with no pass is added once; a full refund is applied', async () => {
  const now = Date.UTC(2026, 9, 1, 12);
  const order = { id: 'ord_missed', status: 'paid', paid: true, net_amount: 4900, total_amount: 4900, refunded_amount: 0,
    product_id: 'prod_oy', metadata: { user_id: USER, pass: 'ochem-year' }, customer: { external_id: USER } };
  const refunded = { id: 'ord_ref', status: 'refunded', paid: true, net_amount: 2900, total_amount: 2900, refunded_amount: 2900,
    product_id: 'prod_oy', metadata: { user_id: USER, pass: 'nremt-90' } };
  const w = fakeWorld({
    rows: [{ id: 1, user_id: USER, course: 'nremt', pass: 'nremt-90', order_id: 'ord_ref', expires_at: iso(now + 80 * DAY) }],
    orders: [order, refunded],
  });
  const r1 = await reconcilePolar(CRON_ENV, now);
  assert.equal(r1.added, 1);
  assert.equal(r1.refunded, 1);
  const added = w.rows.filter((x) => x.order_id === 'ord_missed');
  assert.equal(added.length, 1);
  assert.equal(added[0].pass, 'ochem-year');
  assert.equal(added[0].amount_cents, 4900);
  assert.equal(added[0].expires_at, iso(now + 365 * DAY));
  assert.equal(w.rows[0].refunded_at, iso(now));
  // The call Polar sees: recent orders, our products only.
  const q = new URL('https://x' + w.polarCalls[0]).searchParams;
  assert.equal(q.get('created_after'), iso(now - 48 * 3600000));
  assert.deepEqual(q.getAll('product_id'), ['prod_oy']);
  // Next hour: nothing new.
  const r2 = await reconcilePolar(CRON_ENV, now + 3600000);
  assert.equal(r2.added, 0);
  assert.equal(r2.refunded, 0);
  assert.equal(w.rows.filter((x) => x.order_id === 'ord_missed').length, 1);
});

test('reconcile: a lost dispute revokes the pass; open ones do not', async () => {
  const now = Date.UTC(2026, 9, 1, 12);
  const w = fakeWorld({
    rows: [
      { id: 1, user_id: USER, course: 'ochem', order_id: 'ord_lost', expires_at: iso(now + 100 * DAY) },
      { id: 2, user_id: USER, course: 'anp', order_id: 'ord_open', expires_at: iso(now + 100 * DAY) },
    ],
    disputes: [{ id: 'd1', status: 'lost', order_id: 'ord_lost' }, { id: 'd2', status: 'under_review', order_id: 'ord_open' }],
    now,
  });
  const r = await reconcilePolar(CRON_ENV, now);
  assert.equal(r.disputesRevoked, 1);
  assert.equal(w.rows[0].refunded_at, iso(now));
  assert.equal(w.rows[1].refunded_at, undefined);
  assert.ok(w.polarCalls.some((c) => c.startsWith('/v1/disputes/?status=lost')));
});

test('reconcile: a lost dispute older than the window is left alone', async () => {
  const now = Date.UTC(2026, 9, 1, 12);
  const w = fakeWorld({
    rows: [{ id: 1, user_id: USER, course: 'ochem', order_id: 'ord_old', expires_at: iso(now + 100 * DAY) }],
    disputes: [{ id: 'd1', status: 'lost', order_id: 'ord_old', created_at: iso(now - (DISPUTE_WINDOW_DAYS + 1) * DAY) }],
    now,
  });
  const r = await reconcilePolar(CRON_ENV, now);
  assert.equal(r.disputesRevoked, 0);
  assert.equal(w.rows[0].refunded_at, undefined);
});

test('reconcile: a token without the scope (401/403) is skipped quietly', async () => {
  const w = fakeWorld({ polarStatus: 403 });
  const r = await reconcilePolar(CRON_ENV, Date.UTC(2026, 9, 1));
  assert.equal(r.orders, 'no access');
  assert.equal(r.disputesRevoked, 'no access');
  assert.equal(w.rows.length, 0);
});

test('scheduled(): reconciliation only on the hourly tick', async () => {
  const w = fakeWorld();
  const run = async (minute) => {
    w.polarCalls.length = 0;
    let p;
    await worker.scheduled({ scheduledTime: Date.UTC(2026, 9, 1, 12, minute) }, CRON_ENV, { waitUntil: (x) => { p = x; } });
    await p;
    return w.polarCalls.length;
  };
  assert.ok(await run(0) > 0);
  assert.equal(await run(30), 0);
});
