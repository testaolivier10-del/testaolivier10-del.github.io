/* Class Premium in the Worker (worker/src/class-premium.js, docs/teacher-classes.md). Supabase and Polar are faked. */
import { test, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { classPrice, classPremiumCheckout, classPaid, classRefund, isClassOrder, CLASS_PRICE, CLASS_UNTIL } from '../../worker/src/class-premium.js';

const realFetch = globalThis.fetch;
afterEach(() => { globalThis.fetch = realFetch; });

const T = '11111111-1111-4111-8111-111111111111', X = '55555555-5555-4555-8555-555555555555';
const C = '66666666-6666-4666-8666-666666666666', PROD = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const USERS = { tok_t: { id: T, email: 'teacher@school.org' }, tok_x: { id: X, email: 'x@school.org' } };
const ENV = { SUPABASE_URL: 'https://db.test', SUPABASE_SERVICE_KEY: 'svc', POLAR_ACCESS_TOKEN: 'polar', POLAR_PRODUCTS: JSON.stringify({ class: PROD, 'bio-2027': 'other' }) };
const NOW = Date.parse('2026-11-12T00:00:00Z');

function fake({ archived = false } = {}) {
  const seen = { polar: [], rpc: [], premium: [] };
  globalThis.fetch = async (url, init = {}) => {
    const u = new URL(String(url));
    const json = (b, status = 200) => new Response(JSON.stringify(b), { status, headers: { 'Content-Type': 'application/json' } });
    if (u.pathname === '/auth/v1/user') {
      const tok = (init.headers.Authorization || '').replace('Bearer ', '');
      return USERS[tok] ? json(USERS[tok]) : json({}, 401);
    }
    if (u.pathname === '/rest/v1/classes') return json(u.search.includes(C) ? [{ id: C, name: 'Period 1', course: 'apbio', code: 'ABCDEFGH', archived, teacher_id: T }] : []);
    if (u.pathname === '/rest/v1/class_coteachers') return json([]);
    if (u.pathname.startsWith('/rest/v1/rpc/')) {
      const name = u.pathname.split('/').pop(), args = JSON.parse(init.body || '{}');
      seen.rpc.push([name, args]);
      if (name === 'class_premium_add') {
        const dup = seen.premium.some((r) => r.order_id === args.p_order_id);
        if (!dup) seen.premium.push({ order_id: args.p_order_id, seats: args.p_seats, class_id: args.p_class });
        return json({ inserted: !dup, seats: args.p_seats, expires_at: args.p_until });
      }
      if (name === 'class_premium_refund') {
        const hit = seen.premium.filter((r) => r.order_id === args.p_order_id && !r.refunded_at);
        hit.forEach((r) => { r.refunded_at = args.p_at; });
        return json(hit.length);
      }
      return json(null);
    }
    if (u.hostname === 'api.polar.sh') { seen.polar.push(JSON.parse(init.body)); return json({ url: 'https://buy.polar.sh/x' }); }
    return json({});   // Umami and anything else
  };
  return seen;
}
const post = (tok, body) => new Request('https://api.levlprep.com/class/premium/checkout', { method: 'POST', headers: { Authorization: `Bearer ${tok}`, 'Content-Type': 'application/json', Origin: 'https://levlprep.com' }, body: JSON.stringify(body) });

test('price: $5 a student, at least 10, never more than $99, every seat at the cap', () => {
  assert.deepEqual(classPrice(1), { seats: 10, cents: 5000 });
  assert.deepEqual(classPrice(10), { seats: 10, cents: 5000 });
  assert.deepEqual(classPrice(14), { seats: 14, cents: 7000 });
  assert.deepEqual(classPrice(19), { seats: 19, cents: 9500 });
  assert.deepEqual(classPrice(20), { seats: 40, cents: 9900 });
  assert.deepEqual(classPrice(40), { seats: 40, cents: 9900 });
  for (const bad of [0, -3, 41, 2.5, 'x', null, undefined]) assert.equal(classPrice(bad), null);
  assert.equal(CLASS_PRICE.capCents, 9900);
  assert.equal(new Date(Date.parse(CLASS_UNTIL)).toISOString(), '2027-07-01T09:59:59.000Z');
});

test('checkout: a session, a teacher of the class, the price set by the Worker', async () => {
  const seen = fake();
  assert.equal((await classPremiumCheckout(post('nope', { classId: C, students: 12 }), ENV, NOW)).status, 401);
  assert.equal((await classPremiumCheckout(post('tok_x', { classId: C, students: 12 }), ENV, NOW)).status, 403);
  assert.equal((await classPremiumCheckout(post('tok_t', { classId: C, students: 0 }), ENV, NOW)).status, 400);
  assert.equal((await classPremiumCheckout(post('tok_t', { classId: 'x', students: 12 }), ENV, NOW)).status, 400);
  assert.equal(seen.polar.length, 0, 'nothing reached Polar');
  const r = await classPremiumCheckout(post('tok_t', { classId: C, students: 12, cents: 1 }), ENV, NOW);
  assert.equal(r.status, 200);
  assert.equal(r.body.url, 'https://buy.polar.sh/x');
  const sent = seen.polar[0];
  assert.deepEqual(sent.products, [PROD]);
  assert.deepEqual(sent.prices[PROD], [{ amount_type: 'fixed', price_amount: 6000, price_currency: 'usd' }]);
  assert.deepEqual(sent.metadata, { kind: 'class', user_id: T, class_id: C, seats: 12, course: 'apbio' });
  assert.equal(sent.customer_email, 'teacher@school.org');
  assert.equal(sent.discount_id, undefined, 'the founding discount is for student passes');
});

test('checkout: off without the product, after the school year, or for an archived class', async () => {
  fake();
  assert.equal((await classPremiumCheckout(post('tok_t', { classId: C, students: 12 }), { ...ENV, POLAR_PRODUCTS: '{"bio-2027":"other"}' }, NOW)).status, 503);
  assert.equal((await classPremiumCheckout(post('tok_t', { classId: C, students: 12 }), ENV, Date.parse('2027-07-02T00:00:00Z'))).status, 410);
  fake({ archived: true });
  assert.equal((await classPremiumCheckout(post('tok_t', { classId: C, students: 12 }), ENV, NOW)).status, 409);
});

test('paid and refunded: one row per order, seats from the checkout, a second delivery adds nothing', async () => {
  const seen = fake();
  const order = { id: 'ord_c1', net_amount: 6000, customer: { email: 'teacher@school.org' }, metadata: { kind: 'class', user_id: T, class_id: C, seats: 12, course: 'apbio' } };
  assert.equal(isClassOrder(order), true);
  assert.equal(isClassOrder({ metadata: { pass: 'bio-2027' } }), false);
  const a = await classPaid(ENV, order);
  assert.deepEqual(a.body, { ok: true, class: true });
  assert.deepEqual(seen.premium, [{ order_id: 'ord_c1', seats: 12, class_id: C }]);
  const add = seen.rpc.find((x) => x[0] === 'class_premium_add')[1];
  assert.equal(add.p_until, '2027-07-01T09:59:59.000Z');
  assert.equal(add.p_amount_cents, 6000);
  assert.equal((await classPaid(ENV, order)).body.duplicate, true);
  assert.equal((await classPaid(ENV, { ...order, id: 'ord_c2', metadata: { ...order.metadata, seats: 999 } })).body.ignored, 'unattributable');
  assert.equal((await classPaid(ENV, { ...order, id: 'ord_c3', metadata: { ...order.metadata, class_id: 'nope' } })).body.ignored, 'unattributable');
  assert.equal(await classRefund(ENV, 'ord_c1', NOW), 1);
  assert.equal(await classRefund(ENV, 'ord_c1', NOW), 0);
});
