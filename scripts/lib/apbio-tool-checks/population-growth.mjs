/* Validator for bio/data/tools/population-growth.json (simulator, Unit 8).
   Checks the data's shape, every stimulus question and the mini FRQ, then the
   science through the model itself (ApBioMath.population): exponential growth
   has a constant per-capita rate r_max; logistic growth levels off at K, its
   dN/dt peaks at N = K/2 (r_max·K/4) and its per-capita rate falls in a
   straight line from r_max at N = 0 to 0 at N = K; a density-independent
   event removes the same fraction at any N; above K, dN/dt is negative; a
   smaller Δt approaches the smooth curve. Every number in the stimulus tables
   and the numeric answer is recomputed from the model. */
import { runtime, base, question, frq } from './_shared.mjs';

const SLUG = 'population-growth';

/* The rows a table's "check" spec gives (also used to write the tables). */
export function expectedRows(ck, M) {
  if (ck.x !== 'series') throw new Error(`unknown check x "${ck.x}"`);
  const sim = M.population.simulate(ck.c);
  return ck.times.map(t => {
    const p = M.population.at(sim, t);
    if (Math.abs(p.t - t) > 1e-9) throw new Error(`time ${t} is not a step of the run`);
    return [String(t), ...ck.cols.map(c => M.fixed(p[c.f], c.d))];
  });
}

export function check(data, map) {
  const errs = [];
  const { M } = runtime();
  base(data, SLUG, map, errs, 'simulator');
  const P = M.population, d = data.defaults, rg = data.ranges;
  if (!d || !rg) { errs.push('"defaults" and "ranges" are required'); return errs; }
  for (const k of ['N0', 'r', 'K', 'tEnd', 'readT']) {
    if (typeof d[k] !== 'number') errs.push(`defaults.${k} must be a number`);
    if (k !== 'readT' && !(rg[k] && rg[k].min <= d[k] && d[k] <= rg[k].max)) errs.push(`defaults.${k} must lie in ranges.${k}`);
  }
  if (!Array.isArray(rg.dt) || !rg.dt.includes(d.dt)) errs.push('defaults.dt must be one of ranges.dt');
  if (!Array.isArray(data.fractions) || !data.fractions.every(f => f > 0 && f < 1)) errs.push('"fractions" (share removed by an event) must lie between 0 and 1');
  // exponential: per-capita rate constant; with a small step N ≈ N0·e^(rt)
  const ex = P.simulate({ model: 'exp', N0: 10, r: 0.5, K: 500, dt: 0.01, tEnd: 4 });
  if (!ex.points.every(p => Math.abs(p.perCap - 0.5) < 1e-12)) errs.push('exponential growth must keep the per-capita rate at r_max');
  if (Math.abs(P.at(ex, 4).N / (10 * Math.exp(2)) - 1) > 0.02) errs.push('a small step must approach N0·e^(r·t)');
  // logistic: levels off at K; dN/dt peaks at K/2; per-capita falls linearly
  const lg = P.simulate({ model: 'log', N0: 10, r: 0.5, K: 500, dt: 0.1, tEnd: 60 });
  if (Math.abs(P.at(lg, 60).N - 500) > 0.5) errs.push('logistic growth must level off at K');
  const top = lg.points.reduce((a, b) => (b.dNdt > a.dNdt ? b : a));
  if (Math.abs(top.N - 250) > 15 || Math.abs(top.dNdt - 0.5 * 500 / 4) > 1) errs.push('logistic dN/dt must peak near N = K/2 at r_max·K/4');
  if (Math.abs(P.perCap('log', 0.5, 500, 250) - 0.25) > 1e-12 || P.rate('log', 0.5, 500, 600) >= 0) errs.push('per-capita rate must fall from r_max to 0 at K and turn negative above K');
  // a density-independent event removes the same fraction at any size
  const ev = (N0, t) => P.simulate({ model: 'log', N0, r: 0.5, K: 500, dt: 1, tEnd: t, disasters: [{ t, f: 0.5 }] });
  for (const N0 of [20, 400]) { const p = P.at(ev(N0, 0), 0); if (Math.abs(p.N - N0 / 2) > 1e-9 || p.pre !== N0) errs.push('an event must remove the same fraction whatever N is'); }
  // a lower K makes a population at the old K shrink toward the new one
  const kc = P.simulate({ model: 'log', N0: 500, r: 0.5, K: 500, dt: 0.1, tEnd: 40, kChange: { t: 5, K: 250 } });
  if (!(P.at(kc, 6).dNdt < 0 && Math.abs(P.at(kc, 40).N - 250) < 1)) errs.push('after K drops the population must shrink to the new K');
  // the stimulus tables, recomputed from the model
  for (const [sid, s] of Object.entries(data.stimuli || {})) for (const t of s.tables || []) {
    if (!t.check) { errs.push(`${sid}: every table needs a "check" spec`); continue; }
    let want;
    try { want = expectedRows(t.check, M); } catch (e) { errs.push(`${sid}: ${e.message}`); continue; }
    if (t.rows.length !== want.length) { errs.push(`${sid} "${t.caption}": ${t.rows.length} rows, the check gives ${want.length}`); continue; }
    want.forEach((row, i) => row.forEach((v, j) => {
      if (t.rows[i][j] !== v) errs.push(`${sid} "${t.caption}": row ${i + 1} column ${j + 1} says ${t.rows[i][j]}, the model gives ${v}`);
    }));
  }
  const qids = new Set();
  for (const q of data.questions || []) question(q, SLUG, map, data.stimuli, errs, qids);
  const n = (data.questions || []).length;
  if (n < 3 || n > 5) errs.push(`a simulator has 3-5 stimulus questions (${n})`);
  // the numeric item: logistic dN/dt for the stated N, r_max and K
  const q1 = (data.questions || []).find(q => q.id === `${SLUG}:growth:1`);
  if (q1) {
    const a = q1.args || {}, want = M.round(P.rate('log', a.r, a.K, a.N), q1.numeric.decimals || 0);
    if (Math.abs(q1.numeric.answer - want) > 1e-9) errs.push(`${SLUG}:growth:1: answer ${q1.numeric.answer}, the logistic equation gives ${want}`);
  } else errs.push(`${SLUG}:growth:1 (the numeric item) is missing`);
  if (!data.frq) errs.push('a simulator ends with a mini FRQ'); else frq(data.frq, SLUG, map, errs);
  return errs;
}
