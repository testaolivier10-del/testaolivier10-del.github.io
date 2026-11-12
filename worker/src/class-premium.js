/* Class Premium (docs/teacher-classes.md): a teacher pays once and the class has Premium for its course.

   Price (owner 2026-11-11, research in the Project doc "LevlPrep class pricing research"): $5 a student for the
   school year, at least 10 students, and never more than $99 for a class. From 20 students up the price is the
   $99 cap and the class gets every seat a class checkout sells (40). Bigger classes use the quote form.

   POST /class/premium/checkout  the owner or a co-teacher of the class, with a session. One Polar product
     ("class" in POLAR_PRODUCTS) with the price set here for this checkout, so nobody can pick their own.
   order.paid / order.refunded   arrive through premium.js's webhook (and its hourly reconcile); an order whose
     metadata says kind "class" comes here. A paid order becomes one row in class_premium; my_premium() then
     counts every covered member, so the site, the vault and the free limits follow with no other change. */
import { sb, timedFetch } from './store.js';
import { clsUser, clsTeachClass, clsRpc, clsUuid, clsBody } from './class-common.js';
import { productMap, COURSE_NAMES } from './premium.js';
import { umamiServerEvent, isOwnerEmail } from './umami.js';

export const CLASS_PRICE = { perSeatCents: 500, minSeats: 10, capCents: 9900, maxSeats: 40 };
/* The school year every class pass covers: the end of June 30, 2027 in Hawaii, like the AP® passes. */
export const CLASS_UNTIL = '2027-06-30T23:59:59-10:00';

/* -> { seats, cents } for the number of students a teacher asks for, or null when it is not a whole number in
   range. `seats` is what the class gets: the count asked for (at least the minimum), or every seat at the cap. */
export function classPrice(students) {
  const n = Number(students);
  if (!Number.isInteger(n) || n < 1 || n > CLASS_PRICE.maxSeats) return null;
  const billed = Math.max(n, CLASS_PRICE.minSeats);
  const cents = Math.min(billed * CLASS_PRICE.perSeatCents, CLASS_PRICE.capCents);
  return { seats: cents >= CLASS_PRICE.capCents ? CLASS_PRICE.maxSeats : billed, cents };
}

export function classOnSale(now = Date.now()) { return now < Date.parse(CLASS_UNTIL); }

export const isClassOrder = (order) => order?.metadata?.kind === 'class';

function classProduct(env) {
  const m = productMap(env);
  return Object.prototype.hasOwnProperty.call(m, 'class') && m.class ? m.class : null;
}
const classPolarApi = (env) => (env.POLAR_API || 'https://api.polar.sh').replace(/\/+$/, '');

/* POST /class/premium/info -> what the Settings card shows: the price table's numbers, whether
   checkout is open and the end date. The class's own seats come with teach_class_report. */
export async function classPremiumInfo(request, env) {
  const user = await clsUser(env, request);
  if (!user) return { status: 401, body: { error: 'Sign in again.' } };
  return {
    status: 200,
    body: {
      open: !!(env.POLAR_ACCESS_TOKEN && classProduct(env)) && classOnSale(),
      price: CLASS_PRICE, until: new Date(Date.parse(CLASS_UNTIL)).toISOString(),
    },
  };
}

/* POST /class/premium/checkout { classId, students } -> { url } */
export async function classPremiumCheckout(request, env, now = Date.now()) {
  const user = await clsUser(env, request);
  if (!user) return { status: 401, body: { error: 'Sign in again.' } };
  const body = await clsBody(request);
  if (!body || !clsUuid(body.classId)) return { status: 400, body: { error: 'Pick a class.' } };
  const price = classPrice(body.students);
  if (!price) return { status: 400, body: { error: `Enter a number of students from 1 to ${CLASS_PRICE.maxSeats}. For a bigger class, ask for a quote.` } };
  if (!classOnSale(now)) return { status: 410, body: { error: 'Class Premium for this school year is no longer on sale. Nothing was charged.' } };
  const productId = classProduct(env);
  if (!env.POLAR_ACCESS_TOKEN || !productId || !env.SUPABASE_URL || !env.SUPABASE_SERVICE_KEY) {
    return { status: 503, body: { error: 'Class Premium checkout is not set up yet. Email hello@levlprep.com and we will sort it out.' } };
  }
  const teach = await clsTeachClass(env, user.id, body.classId);
  if (!teach) return { status: 403, body: { error: 'Only a teacher of this class can buy Class Premium for it.' } };
  if (teach.cls.archived) return { status: 409, body: { error: 'This class is archived. Unarchive it first.' } };

  const req = {
    products: [productId],
    prices: { [productId]: [{ amount_type: 'fixed', price_amount: price.cents, price_currency: 'usd' }] },
    external_customer_id: user.id,
    metadata: { kind: 'class', user_id: user.id, class_id: teach.cls.id, seats: price.seats, course: teach.cls.course },
    success_url: `https://levlprep.com/teach/?c=${teach.cls.id}&premium=success#settings/school`,
  };
  if (user.email) req.customer_email = user.email;
  const res = await timedFetch(`${classPolarApi(env)}/v1/checkouts/`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.POLAR_ACCESS_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  });
  if (!res.ok) {
    console.log('polar class checkout failed', res.status, (await res.text()).slice(0, 300));
    return { status: 502, body: { error: 'Checkout is unavailable. Nothing was charged.' } };
  }
  const checkout = await res.json();
  if (!checkout?.url) return { status: 502, body: { error: 'Checkout is unavailable. Nothing was charged.' } };
  return { status: 200, body: { url: checkout.url, seats: price.seats, cents: price.cents } };
}

/* order.paid for a class order. The metadata was written by classPremiumCheckout, never by the buyer. */
export async function classPaid(env, order) {
  const md = order.metadata || {};
  const seats = Number(md.seats);
  if (!order.id || !clsUuid(md.class_id) || !Number.isInteger(seats) || seats < 1 || seats > CLASS_PRICE.maxSeats) {
    console.log('class premium: order.paid not attributable', JSON.stringify({ order: order.id, class: md.class_id, seats: md.seats }));
    return { status: 200, body: { ok: true, ignored: 'unattributable' } };
  }
  const added = await clsRpc(env, 'class_premium_add', {
    p_class: md.class_id, p_buyer: clsUuid(md.user_id) ? md.user_id : null, p_seats: seats,
    p_until: new Date(Date.parse(CLASS_UNTIL)).toISOString(), p_order_id: String(order.id),
    p_amount_cents: Number.isInteger(order.net_amount) ? order.net_amount : null,
  });
  if (!added) {
    // The class was deleted between checkout and payment: nothing to attach it to. A person refunds it.
    console.log('class premium: paid order for a missing class, refund by hand', order.id);
    return { status: 200, body: { ok: true, ignored: 'no class' } };
  }
  if (!added.inserted) return { status: 200, body: { ok: true, duplicate: true } };
  if (!(await isOwnerEmail(order.customer?.email))) {
    await umamiServerEvent('purchase', {
      course: Object.prototype.hasOwnProperty.call(COURSE_NAMES, md.course) ? md.course : 'unknown', pass: 'class',
      dollars: Number.isInteger(order.net_amount) ? Math.round(order.net_amount / 100) : 0, ref: 'none', src: 'teacher',
    });
  }
  return { status: 200, body: { ok: true, class: true } };
}

/* A full refund of a class order. Returns how many rows changed (0 for any other order). */
export async function classRefund(env, orderId, now = Date.now()) {
  const n = await clsRpc(env, 'class_premium_refund', { p_order_id: String(orderId), p_at: new Date(now).toISOString() });
  return Number(n) || 0;
}

/* Class cover for one user and course, for the Worker's own Premium checks (the FRQ grader). */
export async function classCovers(env, userId, course, now = Date.now()) {
  try {
    const res = await sb(env, 'rpc/class_premium_until', { method: 'POST', body: JSON.stringify({ p_user: userId, p_course: course }) });
    if (!res.ok) return false;
    const until = await res.json();
    return !!until && Date.parse(until) > now;
  } catch { return false; }
}
