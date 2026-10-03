/* Premium passes: the checkout and the webhook that records a purchase.

   The browser half is assets/premium.js; the table is premium_passes in
   scripts/sql/schema.sql; the plan is docs/premium.md.

   Two routes, and they trust different things:

   POST /premium/checkout  called by the site, with the student's Supabase
     session. We ask Supabase who that is, then ask Polar for a checkout page
     for that person and that pass, and hand the browser its URL. Nothing is
     written here: a checkout that is opened and abandoned leaves no trace.

   POST /premium/webhook   called by Polar, never by a browser. The only thing
     that makes it trustworthy is the Standard Webhooks signature, so that is
     checked before the body is even parsed. A paid order becomes one row in
     premium_passes; a refunded one gets refunded_at.

   Payment is confirmed by the webhook alone, never by the redirect back to the
   site. ?premium=success in a URL is something anybody can type.

   The cron (bottom of this file) sends the one "your pass ends soon" email
   and, hourly, reconciles against Polar's own order and dispute records. */

import { sb, sha256Hex, timedFetch, EMAIL_BATCH } from './store.js';
import { sendPassEndingEmail } from './email.js';

/* Must match `passes[].id` in assets/premium.js (scripts/test checks it), and
   sell every paid course in assets/courses.js (scripts/check-courses.mjs).
   `days` is what one purchase adds. Semester is five months, so a pass bought
   in late August covers finals in January.

   `until` instead makes a fixed-date pass: it runs to that moment whenever it
   is bought (never shorter; premium_add_pass's p_until), and is off sale after
   it. AP® Biology's ends with June 30, 2027 in Hawaii, the last US time zone
   to finish the day the site promises. Pass ids may reach a URL, so none
   carries the token "ap" (docs/apbio-spec.md decision 2). */
export const PASSES = {
  'nremt-90':       { course: 'nremt', days: 90 },
  'ochem-semester': { course: 'ochem', days: 150 },
  'ochem-year':     { course: 'ochem', days: 365 },
  'anp-semester':   { course: 'anp',   days: 150 },
  'anp-year':       { course: 'anp',   days: 365 },
  'bio-2027':       { course: 'apbio', until: '2027-06-30T23:59:59-10:00' },
};

const isPass = (id) => typeof id === 'string' && Object.prototype.hasOwnProperty.call(PASSES, id);

/* A fixed-date pass is on sale until its end. */
export function passOnSale(pass, now = Date.now()) {
  return !pass.until || now < Date.parse(pass.until);
}

/* What premium_add_pass is given for a pass: a fixed-date pass sends its
   end as p_until and one day as the floor (a purchase that only starts after
   the date, behind another pass, still gets a day rather than nothing). */
export function passTerms(pass) {
  return pass.until ? { days: 1, until: new Date(Date.parse(pass.until)).toISOString() } : { days: pass.days, until: null };
}

/* The course as a URL may name it. A key with the token "ap" in it never
   goes into a URL (docs/apbio-spec.md decision 2), so apbio travels as its
   folder, "bio"; assets/premium.js returnCourse() reads either. */
const URL_COURSE = { apbio: 'bio' };
export const urlCourse = (course) => URL_COURSE[course] || course;

const SITE = 'https://levlprep.com';
const DAY_MS = 86400000;
// Standard Webhooks suggests five minutes, but Polar's "Redeliver" resends an
// event with its original timestamp, so a failed order could never be
// recovered once five minutes had passed. Three days is safe here because a
// replayed event cannot do anything twice: an order is recorded once (order_id
// is unique) and a refund only touches a pass not yet refunded.
const WEBHOOK_TOLERANCE_S = 3 * 24 * 60 * 60;

/* Where Polar may send the student back to. Only our own site: an open
   redirect on a payment page is a phishing kit somebody else gets for free. */
export function safeReturnTo(raw) {
  let u;
  try { u = new URL(String(raw || '')); } catch { return SITE + '/'; }
  if (u.protocol !== 'https:' || u.hostname !== 'levlprep.com' || u.port || u.username || u.password) {
    return SITE + '/';
  }
  return u.href;
}

/* returnTo plus what handleReturn() in assets/premium.js reads. The fragment
   goes, or the query added after it would land inside the hash. The checkout
   id is appended by hand: Polar replaces the literal `{CHECKOUT_ID}`, and
   URLSearchParams would percent-encode the braces out of recognition. */
export function successUrl(returnTo, course) {
  const u = new URL(safeReturnTo(returnTo));
  u.hash = '';
  u.searchParams.delete('checkout_id');
  u.searchParams.set('premium', 'success');
  u.searchParams.set('course', urlCourse(course));
  return u.href + '&checkout_id={CHECKOUT_ID}';
}

/* POLAR_PRODUCTS is JSON, passId -> Polar product id. Kept in a variable
   rather than in this file so sandbox and production can differ. */
export function productMap(env) {
  try {
    const m = JSON.parse(env.POLAR_PRODUCTS || '{}');
    return m && typeof m === 'object' ? m : {};
  } catch {
    return {};
  }
}

function passForProduct(env, productId) {
  if (!productId) return null;
  const hit = Object.entries(productMap(env)).find(([pass, id]) => id === productId && isPass(pass));
  return hit ? hit[0] : null;
}

function polarApi(env) {
  return (env.POLAR_API || 'https://api.polar.sh').replace(/\/+$/, '');
}

/* The Supabase user behind a session token, or null. Supabase answers for
   its own tokens; we never decode one ourselves, so an expired or revoked
   session is refused too. Used by every route that acts for a student,
   including the assistant (index.js). */
export function bearerToken(request) {
  return (request.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '').trim();
}

export async function sessionUser(env, token) {
  if (!token || !env.SUPABASE_URL || !env.SUPABASE_SERVICE_KEY) return null;
  try {
    const who = await timedFetch(`${env.SUPABASE_URL}/auth/v1/user`, {
      headers: { apikey: env.SUPABASE_SERVICE_KEY, Authorization: `Bearer ${token}` },
    });
    if (!who.ok) return null;
    const user = await who.json();
    return user && user.id ? user : null;
  } catch {
    return null;
  }
}

/* Returns { status, body }; index.js adds the CORS headers. */
export async function premiumCheckout(request, env) {
  const token = (request.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '').trim();
  if (!token) return { status: 401, body: { error: 'Sign in first.' } };

  let payload;
  try { payload = await request.json(); } catch { return { status: 400, body: { error: 'Invalid JSON' } }; }

  const passId = String(payload?.pass || '');
  const pass = isPass(passId) ? PASSES[passId] : null;
  if (!pass) return { status: 400, body: { error: 'Unknown pass' } };
  if (!passOnSale(pass)) return { status: 410, body: { error: 'This pass is no longer on sale. Nothing was charged.' } };

  const products = productMap(env);
  const productId = Object.prototype.hasOwnProperty.call(products, passId) ? products[passId] : null;
  if (!env.POLAR_ACCESS_TOKEN || !productId || !env.SUPABASE_URL || !env.SUPABASE_SERVICE_KEY) {
    return { status: 503, body: { error: 'Checkout is not set up yet.' } };
  }

  const user = await sessionUser(env, token);
  if (!user) return { status: 401, body: { error: 'Your session has expired. Sign in again.' } };

  const body = {
    products: [productId],
    external_customer_id: user.id,
    metadata: { user_id: user.id, pass: passId },
    success_url: successUrl(payload?.returnTo, pass.course),
  };
  if (user.email) body.customer_email = user.email;
  if (env.FOUNDING_DISCOUNT_ID) body.discount_id = env.FOUNDING_DISCOUNT_ID;

  const res = await timedFetch(`${polarApi(env)}/v1/checkouts/`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.POLAR_ACCESS_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    console.log('polar checkout failed', res.status, (await res.text()).slice(0, 300));
    return { status: 502, body: { error: 'Checkout is unavailable. Nothing was charged.' } };
  }
  const checkout = await res.json();
  if (!checkout?.url) return { status: 502, body: { error: 'Checkout is unavailable. Nothing was charged.' } };
  return { status: 200, body: { url: checkout.url } };
}

/* POST /premium/refund: a self-serve refund from the account page, with no
   approval step. The rules live here, not in the page, so they cannot be
   skipped by anyone calling this route directly:

   - the order must be the caller's own, a real purchase (not a free month
     or a guarantee extension) and not already refunded;
   - within REFUND_WINDOW_DAYS of buying, as the terms promise, counted
     from Polar's own order time (the reconcile can write the row up to 48
     hours after the purchase, and that delay must not lengthen the window);
   - once per account, ever. Any refund already on the account (self-serve
     or made by hand in Polar) means the next one goes through email, so a
     buy-use-refund loop runs exactly once. premium_ledger also records the
     person (as hashes): the email address normalized (case, +tags, Gmail
     dots), the Polar customer, and the account. Deleting the account does
     not clear it, so neither a new account nor an address alias resets the
     limit.

   Polar refunds the pre-tax amount and the tax with it. The pass is marked
   refunded here at once; order.refunded from Polar then finds nothing left
   to change. */
export const REFUND_WINDOW_DAYS = 7;

export function refundRefusal(row, priorRefunds, now) {
  if (!row || !row.order_id || !(row.amount_cents > 0)) return 'That purchase can’t be refunded here.';
  if (row.refunded_at) return 'That purchase has already been refunded.';
  const bought = Date.parse(row.order_created_at || row.created_at);
  if (!Number.isFinite(bought) || now - bought > REFUND_WINDOW_DAYS * DAY_MS) {
    return `Refunds are available for ${REFUND_WINDOW_DAYS} days after buying, and this purchase is older than that.`;
  }
  if (priorRefunds > 0) return 'This account has already had its one refund, so this purchase can’t be refunded.';
  return null;
}

export async function premiumRefund(request, env, now = Date.now()) {
  const token = bearerToken(request);
  if (!token) return { status: 401, body: { error: 'Sign in first.' } };
  let payload;
  try { payload = await request.json(); } catch { return { status: 400, body: { error: 'Invalid JSON' } }; }
  const orderId = String(payload?.order_id || '');
  if (!/^[0-9a-f-]{36}$/i.test(orderId)) return { status: 400, body: { error: 'Unknown purchase.' } };
  if (!env.POLAR_ACCESS_TOKEN || !env.SUPABASE_URL || !env.SUPABASE_SERVICE_KEY) {
    return { status: 503, body: { error: 'Refunds are not set up yet.' } };
  }

  const user = await sessionUser(env, token);
  if (!user) return { status: 401, body: { error: 'Your session has expired. Sign in again.' } };

  const uid = encodeURIComponent(user.id);
  const rowRes = await sb(env, `premium_passes?select=order_id,amount_cents,refunded_at,created_at,order_created_at,customer_id` +
    `&user_id=eq.${uid}&order_id=eq.${encodeURIComponent(orderId)}&limit=1`);
  if (!rowRes.ok) return { status: 500, body: { error: 'Couldn’t check that purchase. Try again.' } };
  const row = (await rowRes.json())[0];
  const keys = await ledgerKeys({ email: user.email, customerId: row && row.customer_id, userId: user.id });
  const [priorRes, ledger] = await Promise.all([
    sb(env, `premium_passes?select=id&user_id=eq.${uid}&order_id=not.is.null&refunded_at=not.is.null&limit=1`),
    ledgerHas(env, keys, 'refund'),
  ]);
  if (!priorRes.ok || ledger === null) return { status: 500, body: { error: 'Couldn’t check that purchase. Try again.' } };
  const prior = (await priorRes.json()).length + (ledger ? 1 : 0);
  const refusal = refundRefusal(row, prior, now);
  if (refusal) return { status: 409, body: { error: refusal } };
  // Claimed before Polar is asked, so two clicks at once cannot both refund:
  // the second insert hits the unique key. Released if Polar clearly says no.
  const claimed = await ledgerAdd(env, keys, 'refund');
  if (claimed === 'taken') return { status: 409, body: { error: refundRefusal(row, 1, now) } };
  if (claimed !== 'ok') return { status: 500, body: { error: 'Couldn’t check that purchase. Try again.' } };

  let res = null;
  try {
    res = await timedFetch(`${polarApi(env)}/v1/refunds/`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${env.POLAR_ACCESS_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        order_id: orderId,
        reason: 'customer_request',
        amount: row.amount_cents,
        comment: 'Self-serve refund from the levlprep.com account page',
      }),
    });
  } catch (err) {
    console.log('polar refund: no answer', String(err));
  }
  if (!res || !res.ok) {
    if (res) console.log('polar refund failed', res.status, (await res.text()).slice(0, 300));
    // A timeout or a 5xx may still have refunded: the lock stays, so a second
    // click cannot refund twice, and the order.refunded webhook (or a person)
    // settles it. Only a clear refusal (4xx) gives the one refund back.
    if (res && res.status < 500) await ledgerRemove(env, keys, 'refund');
    return { status: 502, body: { error: 'The refund didn’t go through automatically. Email us and we’ll sort it out.' } };
  }
  await refundOrder(env, orderId, now);
  return { status: 200, body: { ok: true } };
}

/* premium_ledger: what a person has already used, kept after the account is
   deleted. Only hashes are stored, and only the Worker (service role) can
   read them. One row per key and kind, so inserting doubles as the lock.

   A person is several keys, any one of which counts as "already used":
   - the email address normalized: lower case, any +tag dropped, and for
     Gmail the dots dropped and googlemail.com read as gmail.com, so
     a.b+x@gmail.com and ab@gmail.com are one person;
   - the address as it was keyed before normalization (rows written before
     this change);
   - the Polar customer id, which follows the card holder across accounts;
   - the account id, which is also the lock when there is no address. */
export function normalizeEmail(email) {
  const s = String(email || '').trim().toLowerCase();
  const at = s.lastIndexOf('@');
  if (at < 1) return s;
  let local = s.slice(0, at);
  let domain = s.slice(at + 1);
  const plus = local.indexOf('+');
  if (plus > 0) local = local.slice(0, plus);
  if (domain === 'googlemail.com') domain = 'gmail.com';
  if (domain === 'gmail.com') local = local.replace(/\./g, '');
  return `${local}@${domain}`;
}

export async function emailKey(email) {
  if (!String(email || '').trim()) return null;
  return sha256Hex('levlprep-ledger:' + normalizeEmail(email));
}

export async function ledgerKeys({ email, customerId, userId }) {
  const keys = [];
  const raw = String(email || '').trim().toLowerCase();
  if (raw) {
    keys.push(await emailKey(raw));
    const legacy = await sha256Hex('levlprep-ledger:' + raw);
    if (!keys.includes(legacy)) keys.push(legacy);
  }
  if (customerId) keys.push(await sha256Hex('levlprep-ledger:polar:' + String(customerId)));
  if (userId) keys.push(await sha256Hex('levlprep-ledger:user:' + String(userId)));
  return keys;
}

async function ledgerHas(env, keys, kind) {
  if (!keys.length) return false;
  const res = await sb(env, `premium_ledger?select=kind&email_key=in.(${keys.join(',')})&kind=eq.${kind}&limit=1`);
  if (!res.ok) return null;
  return (await res.json()).length > 0;
}

/* The first key is the lock: two requests for the same person race on it
   and only one insert succeeds. The rest are recorded as well, so a later
   alias, card or account finds the use. */
async function ledgerAdd(env, keys, kind) {
  if (!keys.length) return 'ok';
  const res = await sb(env, 'premium_ledger', {
    method: 'POST',
    headers: { Prefer: 'return=minimal' },
    body: JSON.stringify({ email_key: keys[0], kind }),
  });
  if (res.status === 409) return 'taken';
  if (!res.ok) return 'error';
  for (const key of keys.slice(1)) {
    await sb(env, 'premium_ledger', {
      method: 'POST',
      headers: { Prefer: 'return=minimal,resolution=ignore-duplicates' },
      body: JSON.stringify({ email_key: key, kind }),
    });
  }
  return 'ok';
}

async function ledgerRemove(env, keys, kind) {
  if (!keys.length) return;
  await sb(env, `premium_ledger?email_key=in.(${keys.join(',')})&kind=eq.${kind}`, { method: 'DELETE' });
}

/* POST /premium/guarantee: Pass-or-extend (its old name was retired 2026-10), claimed from the account
   page with no approval step. Nobody can prove they failed (the National
   Registry publishes who is certified, not who failed), so the rules keep
   what a false claim can win small and make it checkable afterwards:

   - an NREMT pass that was bought (not a free month), not refunded;
   - the exam date falls inside that paid pass and is at most
     GUARANTEE.claimDays ago;
   - at least GUARANTEE.minExams full timed exams taken during the paid
     pass and before the exam date, so the pass was actually used to
     prepare. They are counted from exam_completions, which the database
     stamps (record_exam_completion), not from the synced history the
     browser writes; history entries dated before EXAM_LOG_SINCE still
     count, since nothing recorded exams on the server then;
   - once per account and per email address, ever (premium_ledger again);
   - the claim records the legal name and state the candidate tested under,
     so it can be checked against the Registry's public certification
     lookup. The terms say a claim from someone already certified ends the
     extension.

   It adds GUARANTEE.extendDays, starting when the current pass ends, and
   records which bought pass it extends (funded_by): refunding that order
   takes the extension back (premium_refund_order in schema.sql). */
export const GUARANTEE = { claimDays: 30, extendDays: 90, minExams: 2 };

/* Server-stamped exam records start with the 2026-10 migration. Synced
   history entries dated before this still count toward the guarantee; after
   it, only exam_completions do. Set to the day the migration is applied. */
export const EXAM_LOG_SINCE = Date.parse('2026-10-15T00:00:00Z');
const FULL_EXAM_MIN_QUESTIONS = 50;

/* The exams that count: server records, plus history from before the log. */
export function countableExams(completions, legacyHistory) {
  const server = (completions || [])
    .filter((c) => c && Number(c.questions) >= FULL_EXAM_MIN_QUESTIONS && Number.isFinite(Date.parse(c.finished_at)))
    .map((c) => ({ date: Date.parse(c.finished_at) }));
  const legacy = (legacyHistory || []).filter((h) => h && Number(h.date) < EXAM_LOG_SINCE);
  return server.concat(legacy);
}

/* The bought pass the exam fell in: the one a guarantee extends. */
export function guaranteeFunding(passes, examDate) {
  const exam = Date.parse(examDate + 'T12:00:00Z');
  return (passes || []).find((p) => p.order_id && p.amount_cents > 0 && !p.refunded_at
    && exam >= Date.parse(p.starts_at) - DAY_MS && exam <= Date.parse(p.expires_at) + DAY_MS) || null;
}

export function guaranteeRefusal({ passes, examDate, history, used, now }) {
  const paid = (passes || []).filter((p) => p.order_id && p.amount_cents > 0 && !p.refunded_at);
  if (!paid.length) return 'Pass-or-extend comes with a bought NREMT pass, and this account doesn’t have one.';
  if (used) return 'This account has already used Pass-or-extend.';
  const exam = Date.parse(examDate + 'T12:00:00Z');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(examDate)) || !Number.isFinite(exam)) return 'Enter the date of your exam.';
  if (exam > now + DAY_MS) return 'The exam date can’t be in the future.';
  if (now - exam > GUARANTEE.claimDays * DAY_MS) {
    return `Claims are made within ${GUARANTEE.claimDays} days of the exam, and that date is older than that.`;
  }
  // A day either side, since the date is the candidate's own calendar day.
  const during = paid.find((p) => exam >= Date.parse(p.starts_at) - DAY_MS && exam <= Date.parse(p.expires_at) + DAY_MS);
  if (!during) return 'The exam has to fall within a bought NREMT pass.';
  const from = Math.min(...paid.map((p) => Date.parse(p.starts_at)));
  const exams = (history || []).filter((h) => h && Number(h.date) >= from && Number(h.date) <= exam + DAY_MS).length;
  if (exams < GUARANTEE.minExams) {
    return `Pass-or-extend needs at least ${GUARANTEE.minExams} full timed exams taken during your pass, before the real exam. ` +
      `This account has ${exams}. (An exam counts when you finish it while signed in.)`;
  }
  return null;
}

// The synced NREMT exam history: user_progress.data is { v: 2, ns: { nremt } }
// (older rows are the nremt keys flat), each value the raw localStorage string.
export function examHistory(data) {
  const ns = data && data.v === 2 ? data.ns && data.ns.nremt : data;
  try {
    const list = JSON.parse((ns && ns.nremt_exam100_history) || '[]');
    return Array.isArray(list) ? list : [];
  } catch { return []; }
}

export async function premiumGuarantee(request, env, now = Date.now()) {
  const token = bearerToken(request);
  if (!token) return { status: 401, body: { error: 'Sign in first.' } };
  let payload;
  try { payload = await request.json(); } catch { return { status: 400, body: { error: 'Invalid JSON' } }; }
  const examDate = String(payload?.exam_date || '');
  const name = String(payload?.legal_name || '').trim().replace(/\s+/g, ' ');
  const state = String(payload?.state || '').trim().replace(/\s+/g, ' ');
  if (name.length < 3 || name.length > 100) return { status: 400, body: { error: 'Enter your full legal name as the Registry has it.' } };
  if (state.length < 2 || state.length > 40) return { status: 400, body: { error: 'Enter the state you tested for.' } };
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_KEY) return { status: 503, body: { error: 'This isn’t set up yet.' } };

  const user = await sessionUser(env, token);
  if (!user) return { status: 401, body: { error: 'Your session has expired. Sign in again.' } };

  const uid = encodeURIComponent(user.id);
  const [passRes, examRes, progRes] = await Promise.all([
    sb(env, `premium_passes?select=pass,order_id,amount_cents,refunded_at,starts_at,expires_at,customer_id&user_id=eq.${uid}&course=eq.nremt`),
    sb(env, `exam_completions?select=questions,finished_at&user_id=eq.${uid}&course=eq.nremt&order=finished_at.desc&limit=200`),
    sb(env, `user_progress?select=data&id=eq.${uid}&limit=1`),
  ]);
  if (!passRes.ok || !examRes.ok || !progRes.ok) return { status: 500, body: { error: 'Couldn’t check your account. Try again.' } };
  const passes = await passRes.json();
  const prog = (await progRes.json())[0];
  const history = countableExams(await examRes.json(), examHistory(prog && prog.data));
  const customer = (passes.find((p) => p.customer_id) || {}).customer_id;
  const keys = await ledgerKeys({ email: user.email, customerId: customer, userId: user.id });
  const ledger = await ledgerHas(env, keys, 'guarantee');
  if (ledger === null) return { status: 500, body: { error: 'Couldn’t check your account. Try again.' } };
  const used = ledger || passes.some((p) => p.pass === 'guarantee');
  const refusal = guaranteeRefusal({ passes, examDate, history, used, now });
  if (refusal) return { status: 409, body: { error: refusal } };
  const funding = guaranteeFunding(passes, examDate);

  const claimed = await ledgerAdd(env, keys, 'guarantee');
  if (claimed === 'taken') return { status: 409, body: { error: 'This account has already used Pass-or-extend.' } };
  if (claimed !== 'ok') return { status: 500, body: { error: 'Couldn’t check your account. Try again.' } };

  let added = null;
  try {
    added = await addPass(env, {
      userId: user.id, course: 'nremt', pass: 'guarantee', days: GUARANTEE.extendDays,
      fundedBy: funding ? funding.order_id : null,
    });
  } catch (err) {
    console.log('guarantee insert failed', String(err));
  }
  if (!added || !added.inserted) {
    await ledgerRemove(env, keys, 'guarantee');
    return { status: 500, body: { error: 'That didn’t go through. Try again in a moment.' } };
  }
  const claimRes = await sb(env, 'premium_guarantee_claims', {
    method: 'POST',
    headers: { Prefer: 'return=minimal' },
    body: JSON.stringify({ user_id: user.id, legal_name: name, state, exam_date: examDate }),
  });
  if (!claimRes.ok) console.log('guarantee claim record failed', claimRes.status);
  return { status: 200, body: { ok: true, expires_at: new Date(added.expires_at).toISOString() } };
}

function bytesToBase64(bytes) {
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s);
}

/* Standard Webhooks. Polar has used two keys, and which one signs depends on
   when the endpoint's secret was made (polar.sh/docs, webhook delivery):

   - secrets from September 8, 2026 on: plain Standard Webhooks. Drop the
     `whsec_` prefix and base64-decode the rest; those bytes are the key.
   - older secrets: the key is the UTF-8 bytes of the whole `whsec_...`
     string (polar-js used to base64-encode it before handing it over).

   Polar's own SDKs try both, so this does too. Shipping only the second one
   rejected every real order from a new endpoint with "Bad signature".
   Signed content: `${webhook-id}.${webhook-timestamp}.${raw body}`; the
   header holds space-separated `v1,<base64>` entries, any of which may match. */
function webhookKeys(secret) {
  const keys = [];
  const body = secret.startsWith('whsec_') ? secret.slice(6) : secret;
  try {
    const bin = atob(body);
    if (bin.length) keys.push(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
  } catch { /* not base64: only the legacy key applies */ }
  keys.push(new TextEncoder().encode(secret));
  return keys;
}

export async function verifyWebhook(rawBody, headers, secret, nowSeconds = Math.floor(Date.now() / 1000)) {
  const get = (k) => (typeof headers.get === 'function' ? headers.get(k) : headers[k]) || '';
  const id = get('webhook-id');
  const ts = get('webhook-timestamp');
  const sigs = get('webhook-signature');
  // A secret pasted into the dashboard can pick up a space or a newline.
  secret = String(secret || '').trim();
  if (!secret || !id || !ts || !sigs) {
    console.log('premium webhook: missing', JSON.stringify({ secret: !!secret, id: !!id, ts: !!ts, sigs: !!sigs }));
    return false;
  }

  const t = Number(ts);
  if (!Number.isInteger(t) || Math.abs(nowSeconds - t) > WEBHOOK_TOLERANCE_S) {
    console.log('premium webhook: timestamp outside tolerance', ts);
    return false;
  }

  const signed = new TextEncoder().encode(`${id}.${ts}.${rawBody}`);
  const expected = [];
  for (const raw of webhookKeys(secret)) {
    const key = await crypto.subtle.importKey('raw', raw, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    expected.push(bytesToBase64(new Uint8Array(await crypto.subtle.sign('HMAC', key, signed))));
  }

  const ok = sigs.split(' ').some((entry) => {
    const [version, sig] = entry.split(',');
    if (version !== 'v1' || !sig) return false;
    return expected.some((exp) => {
      if (sig.length !== exp.length) return false;
      let diff = 0;
      for (let i = 0; i < sig.length; i++) diff |= sig.charCodeAt(i) ^ exp.charCodeAt(i);
      return diff === 0;
    });
  });
  // Never logs the secret; the prefix and length are enough to tell a
  // pasted access token or a truncated paste from the real thing.
  if (!ok) console.log('premium webhook: no signature matched', JSON.stringify({ secretPrefix: secret.slice(0, 6), secretLength: secret.length }));
  return ok;
}

/* Creating a pass is one database function, premium_add_pass() in
   scripts/sql/schema.sql: under a per-user lock it reads where the latest
   unrefunded pass ends, starts the new one there (or now), and inserts it,
   so a pass bought early never throws days away and the webhook and the
   reconcile racing on one order cannot stack two passes on the same days.
   It answers { inserted, starts_at, expires_at }; inserted is false for an
   order it already has. */
async function addPass(env, { userId, course, pass, days, until = null, orderId = null, amountCents = null, orderCreatedAt = null, customerId = null, fundedBy = null }) {
  const res = await sb(env, 'rpc/premium_add_pass', {
    method: 'POST',
    body: JSON.stringify({
      // p_until only for a fixed-date pass: the function took no such
      // parameter before migrations/2026-10b-apbio.sql, so leaving it out
      // keeps every other course's purchases working on either schema.
      p_user: userId, p_course: course, p_pass: pass, p_days: days, ...(until ? { p_until: until } : {}),
      p_order_id: orderId, p_amount_cents: amountCents, p_order_created_at: orderCreatedAt,
      p_customer_id: customerId, p_funded_by: fundedBy,
    }),
  });
  if (!res.ok) throw new Error(`add pass ${res.status}: ${(await res.text()).slice(0, 200)}`);
  return res.json();
}

/* A full refund, also one database function (premium_refund_order): marks
   the order's pass, takes back a guarantee it paid for, and re-chains the
   passes queued behind it. Returns how many bought passes it marked. */
async function refundOrder(env, orderId, now) {
  const res = await sb(env, 'rpc/premium_refund_order', {
    method: 'POST',
    body: JSON.stringify({ p_order_id: String(orderId), p_at: new Date(now).toISOString() }),
  });
  if (!res.ok) throw new Error(`refund pass ${res.status}`);
  return Number(await res.json()) || 0;
}

function isoOrNull(v) {
  const t = Date.parse(v || '');
  return Number.isFinite(t) ? new Date(t).toISOString() : null;
}

async function recordPaid(env, order, now) {
  const userId = order.metadata?.user_id || order.customer?.external_id || null;
  const passId = (isPass(order.metadata?.pass) ? order.metadata.pass : null)
    || passForProduct(env, order.product_id || order.product?.id);
  const pass = passId ? PASSES[passId] : null;
  if (!userId || !pass || !order.id) {
    // Retrying cannot fix this, so do not ask Polar to. The log is the trail.
    console.log('premium: order.paid not attributable', JSON.stringify({ order: order.id, userId, passId }));
    return { status: 200, body: { ok: true, ignored: 'unattributable' } };
  }

  const added = await addPass(env, {
    userId, course: pass.course, pass: passId, ...passTerms(pass),
    orderId: order.id,
    amountCents: Number.isInteger(order.net_amount) ? order.net_amount : null,
    orderCreatedAt: isoOrNull(order.created_at),
    customerId: order.customer_id || order.customer?.id || null,
  });
  // A second delivery of the same order adds nothing.
  if (!added || !added.inserted) return { status: 200, body: { ok: true, duplicate: true } };
  // The funnel's last step, counted here where payment is a fact. Best
  // effort: a missed count must not make Polar redeliver the order.
  try {
    await sb(env, 'rpc/count_premium_paid', { method: 'POST', body: JSON.stringify({ p_course: pass.course }) });
  } catch { /* the count is not worth a retry */ }
  return { status: 200, body: { ok: true } };
}

// Only a full refund takes the pass away. A partial one is a goodwill
// gesture, and revoking access for it would turn that into a penalty.
function isFullRefund(order) {
  return order.status === 'refunded'
    || (Number.isInteger(order.refunded_amount) && Number.isInteger(order.total_amount)
        && order.total_amount > 0 && order.refunded_amount >= order.total_amount);
}

async function recordRefund(env, order, now) {
  if (!order.id || !isFullRefund(order)) return { status: 200, body: { ok: true, ignored: 'partial' } };
  await refundOrder(env, order.id, now);
  return { status: 200, body: { ok: true } };
}

/* Revoke the passes of these orders, the same way a refund does, so
   my_premium() stops counting them. Returns how many changed. */
async function revokeOrders(env, orderIds, now) {
  let changed = 0;
  for (const id of new Set(orderIds)) changed += await refundOrder(env, id, now);
  return changed;
}

/* Returns { status, body }. A 5xx makes Polar retry, which is what we want
   when the database blinked; everything else gets a 2xx so an event we do not
   handle never piles up as failed deliveries. */
export async function premiumWebhook(request, env, now = Date.now()) {
  const raw = await request.text();
  const ok = await verifyWebhook(raw, request.headers, env.POLAR_WEBHOOK_SECRET, Math.floor(now / 1000));
  if (!ok) return { status: 403, body: { error: 'Bad signature' } };

  let event;
  try { event = JSON.parse(raw); } catch { return { status: 400, body: { error: 'Invalid JSON' } }; }
  const order = event?.data || {};

  try {
    if (event?.type === 'order.paid') return await recordPaid(env, order, now);
    if (event?.type === 'order.refunded') return await recordRefund(env, order, now);
  } catch (err) {
    console.log('premium webhook failed', event?.type, String(err));
    return { status: 500, body: { error: 'Try again' } };
  }
  return { status: 202, body: { ok: true, ignored: event?.type || 'unknown' } };
}

/* ---------------------------------------------------------------------------
   The cron half (index.js scheduled()).

   runPassEnding    every tick: one email when a pass is about to end.
   reconcilePolar   hourly: whatever the webhook missed, from Polar's own
                    records. Both are idempotent, so a tick that dies halfway
                    is simply finished by the next one.
   --------------------------------------------------------------------------- */

/* For the email. Must match COURSES[].name in assets/premium.js (scripts/test
   checks it). */
// Each paid course in assets/courses.js, by its productName (scripts/check-courses.mjs).
export const COURSE_NAMES = { nremt: 'NREMT-EMT Prep', ochem: 'Organic Chemistry', anp: 'Anatomy & Physiology', apbio: 'AP® Biology' };

export const ENDING_NOTICE_DAYS = 3;

/* "October 3, 2026". UTC, because that is the day the row says. */
export function endsOnText(iso) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
}

/* Which rows get the notice, from every pass the candidate users hold. Per
   user and course, only the latest unrefunded pass counts: a pass with a
   later one queued behind it is not really ending. That latest pass gets the
   notice if it was bought (order_id: the copy says "a pass you bought", so a
   free founding month or a guarantee extension gets nothing), ends within
   ENDING_NOTICE_DAYS and has not had it yet. */
export function passesEnding(rows, now) {
  const latest = new Map();
  for (const r of rows) {
    if (r.refunded_at) continue;
    const key = `${r.user_id}|${r.course}`;
    const cur = latest.get(key);
    if (!cur || Date.parse(r.expires_at) > Date.parse(cur.expires_at)) latest.set(key, r);
  }
  return [...latest.values()].filter((r) => {
    const end = Date.parse(r.expires_at);
    return r.order_id && !r.ending_reminded_at && end > now && end <= now + ENDING_NOTICE_DAYS * DAY_MS;
  });
}

async function userEmail(env, userId) {
  const res = await timedFetch(`${env.SUPABASE_URL}/auth/v1/admin/users/${encodeURIComponent(userId)}`, {
    headers: { apikey: env.SUPABASE_SERVICE_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_KEY}` },
  });
  if (!res.ok) throw new Error(`admin user ${res.status}`);
  const user = await res.json();
  return user?.email || null;
}

export async function runPassEnding(env, now = Date.now()) {
  // Same rule as the study reminders: no provider, no noise.
  if (!env.RESEND_API_KEY || !env.SUPABASE_URL || !env.SUPABASE_SERVICE_KEY) {
    return { skipped: 'no email provider configured' };
  }
  const from = new Date(now).toISOString();
  const to = new Date(now + ENDING_NOTICE_DAYS * DAY_MS).toISOString();

  // Who might be due: a cheap first pass over the window.
  const candRes = await sb(env,
    `premium_passes?select=user_id&refunded_at=is.null&ending_reminded_at=is.null&order_id=not.is.null` +
    `&expires_at=gt.${from}&expires_at=lte.${to}&order=expires_at.asc&limit=200`);
  if (!candRes.ok) return { error: `read failed: ${candRes.status}` };
  const users = [...new Set((await candRes.json()).map((r) => r.user_id))];
  if (!users.length) return { due: 0 };

  // Everything those users still hold, so a queued later pass is seen.
  const rowsRes = await sb(env,
    `premium_passes?select=id,user_id,course,order_id,expires_at,refunded_at,ending_reminded_at` +
    `&refunded_at=is.null&expires_at=gt.${from}&user_id=in.(${users.map(encodeURIComponent).join(',')})`);
  if (!rowsRes.ok) return { error: `read failed: ${rowsRes.status}` };
  const due = passesEnding(await rowsRes.json(), now).slice(0, EMAIL_BATCH);

  let sent = 0, noEmail = 0, dropped = 0, failed = 0;
  for (const row of due) {
    let result;
    try {
      const email = await userEmail(env, row.user_id);
      if (!email) {
        noEmail++;
      } else {
        result = await sendPassEndingEmail(env, {
          to: email, courseName: COURSE_NAMES[row.course] || row.course, endsOn: endsOnText(row.expires_at),
        });
        if (result.config) { failed++; break; } // our sender is wrong: stop, mark nothing
        if (!result.ok && !result.gone) { failed++; continue; } // next tick retries
        if (result.ok) sent++; else dropped++;
      }
    } catch (err) {
      console.log('pass ending: failed', row.id, String(err));
      failed++;
      continue;
    }
    // Recorded on the row, so it goes once. A rejected or missing address is
    // recorded too: retrying it every fifteen minutes cannot help.
    await sb(env, `premium_passes?id=eq.${encodeURIComponent(row.id)}&ending_reminded_at=is.null`, {
      method: 'PATCH',
      headers: { Prefer: 'return=minimal' },
      body: JSON.stringify({ ending_reminded_at: new Date(now).toISOString() }),
    });
  }
  return { due: due.length, sent, noEmail, dropped, failed };
}

/* Reconciliation. The webhook is the normal path; this is the safety net for
   a delivery Polar gave up on, a secret pasted wrong, or a Worker that was
   down. Polar facts (from @polar-sh/sdk 1.0.1, API versions 2026-04 to
   2027-01):

   - GET /v1/orders/ takes created_after, product_id (repeatable), page,
     limit and sorting, answers { items, pagination: { total_count,
     max_page } }, and needs the token scope orders:read. Order.status is
     draft | pending | paid | refunded | partially_refunded | void, and
     nothing on an order says "disputed".
   - Polar sends no webhook for disputes (no dispute.* event type, and
     order.updated carries no dispute state). Disputes are only readable at
     GET /v1/disputes/ (scope disputes:read), with status prevented |
     early_warning | needs_response | under_review | lost | won. A
     "prevented" dispute is one Polar refunded, so order.refunded already
     covers it.

   A token without a scope gets 401/403: logged once per run and skipped, so
   the rest still works. */
const RECONCILE_HOURS = 48;
const RECONCILE_MAX_PAGES = 10;
/* A dispute takes the pass only once it is lost: the money is gone for good.
   While it is open the student keeps access, so a dispute the merchant wins
   does not leave them locked out with a "refunded" pass on their account. */
export const DISPUTE_REVOKES = ['lost'];
/* Only disputes opened in this window are acted on. Every run used to list
   (and re-apply) every lost dispute ever; an old one has long since been
   applied, and one somebody resolved by hand must not be undone hourly. */
export const DISPUTE_WINDOW_DAYS = 120;

async function polarList(env, path, params) {
  const items = [];
  for (let page = 1; page <= RECONCILE_MAX_PAGES; page++) {
    const q = new URLSearchParams();
    for (const [k, v] of Object.entries({ ...params, page, limit: 100 })) {
      for (const one of [].concat(v)) q.append(k, String(one));
    }
    const res = await timedFetch(`${polarApi(env)}${path}?${q}`, {
      headers: { Authorization: `Bearer ${env.POLAR_ACCESS_TOKEN}` },
    });
    if (res.status === 401 || res.status === 403) {
      console.log('premium reconcile: no access to', path, res.status, '(token scope?)');
      return null;
    }
    if (!res.ok) throw new Error(`polar ${path} ${res.status}`);
    const data = await res.json();
    items.push(...(data?.items || []));
    if (page >= (data?.pagination?.max_page || 1)) break;
  }
  return items;
}

export async function reconcilePolar(env, now = Date.now()) {
  if (!env.POLAR_ACCESS_TOKEN || !env.SUPABASE_URL || !env.SUPABASE_SERVICE_KEY) {
    return { skipped: 'not configured' };
  }
  const out = { orders: 0, added: 0, refunded: 0, disputesRevoked: 0 };

  const params = { created_after: new Date(now - RECONCILE_HOURS * 3600000).toISOString(), sorting: '-created_at' };
  const products = Object.values(productMap(env)).filter(Boolean);
  if (products.length) params.product_id = products;
  const orders = await polarList(env, '/v1/orders/', params);
  if (orders === null) {
    out.orders = 'no access';
  } else {
    out.orders = orders.length;
    const known = new Map();
    for (let i = 0; i < orders.length; i += 100) {
      const ids = orders.slice(i, i + 100).map((o) => `"${String(o.id).replace(/"/g, '')}"`).join(',');
      const res = await sb(env, `premium_passes?select=order_id,refunded_at&order_id=in.(${encodeURIComponent(ids)})`);
      if (!res.ok) throw new Error(`read passes ${res.status}`);
      for (const r of await res.json()) known.set(r.order_id, r);
    }
    for (const order of orders) {
      if (!order?.id) continue;
      const row = known.get(order.id);
      if (!row) {
        // Same as the webhook. A paid order later refunded in full never
        // needs a pass; a partial refund keeps it, as it does there.
        if ((order.status === 'paid' || order.status === 'partially_refunded') && !isFullRefund(order)) {
          const r = await recordPaid(env, order, now);
          if (r.body.ok && !r.body.duplicate && !r.body.ignored) {
            out.added++;
            console.log('premium reconcile: added missing pass', order.id);
          }
        }
      } else if (!row.refunded_at && isFullRefund(order)) {
        await recordRefund(env, order, now);
        out.refunded++;
        console.log('premium reconcile: marked refunded', order.id);
      }
    }
  }

  const disputes = await polarList(env, '/v1/disputes/', { status: DISPUTE_REVOKES, sorting: '-created_at' });
  if (disputes === null) {
    out.disputesRevoked = 'no access';
  } else {
    const since = now - DISPUTE_WINDOW_DAYS * DAY_MS;
    const ids = disputes
      .filter((d) => d?.order_id && DISPUTE_REVOKES.includes(d.status))
      .filter((d) => !d.created_at || Date.parse(d.created_at) >= since)
      .map((d) => d.order_id);
    out.disputesRevoked = await revokeOrders(env, ids, now);
    if (out.disputesRevoked) console.log('premium reconcile: revoked for lost disputes', out.disputesRevoked);
  }
  return out;
}
