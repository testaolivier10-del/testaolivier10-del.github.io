/* The database functions the Worker calls for Premium, modelled in JS for
   the Worker tests' fake PostgREST: premium_add_pass, premium_refund_order
   (with the re-chain) and count_premium_paid, as defined in
   scripts/sql/migrations/2026-10-audit.sql. The SQL itself was run against a
   real Postgres while it was written (docs/site-audit-notes/w3.md); this is
   only so the Worker's side of the contract can be tested without one. */

const DAY = 86400000;
const iso = (t) => new Date(t).toISOString();
const ms = (v) => Date.parse(v);

function rechain(rows, user, course, now) {
  const live = rows.filter((r) => r.user_id === user && r.course === course && !r.refunded_at);
  const running = live.filter((r) => (r.starts_at ? ms(r.starts_at) <= now : true) && ms(r.expires_at) > now);
  let cursor = running.length ? Math.max(...running.map((r) => ms(r.expires_at))) : now;
  const queued = live.filter((r) => r.starts_at && ms(r.starts_at) > now)
    .sort((a, b) => ms(a.starts_at) - ms(b.starts_at) || (a.id || 0) - (b.id || 0));
  for (const r of queued) {
    const len = ms(r.expires_at) - ms(r.starts_at);
    r.starts_at = iso(cursor);
    r.expires_at = iso(cursor + len);
    cursor += len;
  }
}

/* Answers one /rest/v1/rpc/<name> call against `rows` (premium_passes), or
   returns null for an rpc this does not model. `now` is the database clock. */
export function premiumRpc(rows, name, args, now, counts = []) {
  if (name === 'premium_add_pass') {
    if (args.p_order_id && rows.some((r) => r.order_id === args.p_order_id)) {
      return new Response(JSON.stringify({ inserted: false }), { status: 200 });
    }
    const live = rows.filter((r) => r.user_id === args.p_user && r.course === args.p_course && !r.refunded_at);
    const latest = live.length ? Math.max(...live.map((r) => ms(r.expires_at))) : 0;
    const start = Math.max(now, latest || 0);
    // A fixed-date pass runs at least to p_until (2026-10b-apbio.sql).
    const end = Math.max(start + args.p_days * DAY, args.p_until ? ms(args.p_until) : 0);
    const row = {
      id: rows.reduce((m, r) => Math.max(m, r.id || 0), 0) + 1,
      user_id: args.p_user, course: args.p_course, pass: args.p_pass,
      starts_at: iso(start), expires_at: iso(end),
      order_id: args.p_order_id ?? undefined, amount_cents: args.p_amount_cents ?? undefined,
      order_created_at: args.p_order_created_at || iso(now),
      customer_id: args.p_customer_id ?? undefined, funded_by: args.p_funded_by ?? undefined,
    };
    for (const k of Object.keys(row)) if (row[k] === undefined) delete row[k];
    rows.push(row);
    return new Response(JSON.stringify({ inserted: true, starts_at: row.starts_at, expires_at: row.expires_at }), { status: 200 });
  }
  if (name === 'premium_refund_order') {
    const hit = rows.find((r) => r.order_id === args.p_order_id);
    if (!hit) return new Response('0', { status: 200 });
    let changed = 0;
    for (const r of rows) {
      if (r.order_id === args.p_order_id && !r.refunded_at) { r.refunded_at = args.p_at; changed++; }
    }
    const boughtLeft = rows.some((b) => b.user_id === hit.user_id && b.course === hit.course && b.order_id && !b.refunded_at);
    for (const g of rows) {
      if (g.user_id === hit.user_id && g.course === hit.course && g.pass === 'guarantee' && !g.refunded_at
          && (g.funded_by === args.p_order_id || (!g.funded_by && !boughtLeft))) {
        g.refunded_at = args.p_at;
      }
    }
    rechain(rows, hit.user_id, hit.course, ms(args.p_at) || now);
    return new Response(String(changed), { status: 200 });
  }
  if (name === 'count_premium_paid') {
    counts.push(args.p_course);
    return new Response(null, { status: 204 });
  }
  return null;
}
