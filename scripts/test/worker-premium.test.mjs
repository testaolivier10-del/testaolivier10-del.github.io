/* worker/src/premium.js — Polar checkout and webhook.

   What must not break: the pass ids the site sells and the ones the Worker
   knows are the same list; the return address cannot be pointed off-site; a
   webhook is believed only with a fresh, valid signature; and Polar
   delivering the same order twice adds one pass, not two. */
import { test, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { createBrowser } from './harness.mjs';
import worker from '../../worker/src/index.js';
import {
  PASSES, safeReturnTo, successUrl, verifyWebhook, premiumWebhook, refundRefusal, REFUND_WINDOW_DAYS,
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

/* A tiny PostgREST: premium_passes with a unique order_id. */
function fakeDb(rows = []) {
  const calls = [];
  globalThis.fetch = async (url, init = {}) => {
    const u = new URL(url);
    calls.push({ method: init.method || 'GET', url: u.pathname + u.search });
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
  return { rows, calls };
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
  const db = fakeDb();
  const now = Date.UTC(2026, 9, 1);
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
});

test('a second pass starts when the running one ends; refunded ones do not count', async () => {
  const now = Date.UTC(2026, 9, 1);
  const db = fakeDb([
    { user_id: USER, course: 'ochem', order_id: 'old', expires_at: '2026-12-01T00:00:00.000Z' },
    { user_id: USER, course: 'ochem', order_id: 'ref', expires_at: '2027-06-01T00:00:00.000Z', refunded_at: '2026-09-01T00:00:00.000Z' },
  ]);
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
  const db = fakeDb([{ user_id: USER, course: 'nremt', order_id: 'ord_1', expires_at: '2027-01-01T00:00:00.000Z' }]);
  const partial = await premiumWebhook(delivery({ type: 'order.refunded', data: { id: 'ord_1', status: 'partially_refunded', refunded_amount: 500, total_amount: 2900 } }, now), ENV, now);
  assert.equal(partial.status, 200);
  assert.equal(db.rows[0].refunded_at, undefined);
  const full = await premiumWebhook(delivery({ type: 'order.refunded', data: { id: 'ord_1', status: 'refunded' } }, now), ENV, now);
  assert.equal(full.status, 200);
  assert.equal(db.rows[0].refunded_at, new Date(now).toISOString());
  const other = await premiumWebhook(delivery({ type: 'checkout.updated', data: {} }, now), ENV, now);
  assert.ok(other.status >= 200 && other.status < 300);
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
