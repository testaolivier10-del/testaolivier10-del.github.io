/* Validator for bio/data/tools/hardy-weinberg-drift.json (simulator).
   Checks the data's shape, every stimulus question and the mini FRQ, then the
   science through the model itself (ApBioMath.popgen): a very large
   population with no forces stays at Hardy-Weinberg; complete selection
   against aa follows q/(1 + tq); heterozygote advantage settles at
   s_aa/(s_AA + s_aa); mutation settles at v/(u + v); migration pulls p to
   the migrants' p; inbreeding F lowers heterozygotes to 2pq(1 − F); drift
   is unbiased, reproducible from its seed, and fixes alleles sooner in small
   populations; a bottleneck shrinks the population only while it lasts.
   Every number in the stimulus tables (seeded runs included) and the numeric
   answer is recomputed from the model. */
import { runtime, base, question, frq } from './_shared.mjs';

const SLUG = 'hardy-weinberg-drift';
const NOFORCE = { p0: 0.5, N: 0, gens: 50, reps: 1, seed: 1, w: [1, 1, 1], u: 0, v: 0, m: 0, pm: 0.5, F: 0, event: null };

/* The rows a table's "check" spec gives (also used to write the tables). */
export function expectedRows(ck, M) {
  const G = M.popgen, f = (x, d) => M.fixed(x, d);
  if (ck.x === 'fates') return ck.rows.map(r => { const s = G.simulate({ ...ck.base, ...r.set }).fates; return [...r.cells, String(s.fixed), String(s.lost), String(s.poly)]; });
  if (ck.x === 'course') {
    const run = G.simulate({ ...ck.base, reps: 1 }).reps[0];
    return ck.times.map(t => [String(t), ...ck.fields.map(k => f(k === 'p' ? run.p[t] : k === 'q' ? 1 - run.p[t] : k === 'AA' ? run.g[t][0] : k === 'Aa' ? run.g[t][1] : run.g[t][2], ck.d))]);
  }
  if (ck.x === 'geno') {
    const chis = ck.pops.map(c => { const run = G.simulate({ ...c, reps: 1 }).reps[0]; return G.chi(run.g[ck.gen], run.n[ck.gen]); });
    return ['AA', 'Aa', 'aa'].map((name, i) => [name, ...[].concat(...chis.map(x => [String(x.obs[i]), f(x.exp[i], ck.d)]))]);
  }
  throw new Error(`unknown check x "${ck.x}"`);
}
export function chiOf(ck, k, M) {
  const c = ck.pops[k], run = M.popgen.simulate({ ...c, reps: 1 }).reps[0];
  return M.popgen.chi(run.g[ck.gen], run.n[ck.gen]);
}

export function check(data, map) {
  const errs = [];
  const { M } = runtime();
  base(data, SLUG, map, errs, 'simulator');
  const G = M.popgen, near = (a, b, t) => Math.abs(a - b) <= t;
  const D = data.defaults;
  if (!D) { errs.push('no "defaults"'); return errs; }
  for (const k of ['p0', 'N', 'gens', 'reps', 'seed', 'u', 'v', 'm', 'pm', 'F']) if (typeof D[k] !== 'number') errs.push(`defaults.${k} must be a number`);
  if (!Array.isArray(D.w) || D.w.length !== 3) errs.push('defaults.w must be [wAA, wAa, waa]');
  if (!Array.isArray(data.sizes) || !data.sizes.includes(0) || data.sizes.some(n => !Number.isInteger(n) || n < 0 || n > 2000)) errs.push('"sizes" must be whole numbers up to 2000, with 0 for a very large population');
  for (const p of data.presets || []) {
    if (!p.id || !p.label || !p.set) errs.push(`preset ${p.id}: id, label and set are required`);
    for (const k of Object.keys(p.set || {})) if (!(k in D) && k !== 'event') errs.push(`preset ${p.id}: unknown setting "${k}"`);
  }
  // Hardy-Weinberg: no forces, very large population
  const hw = G.simulate({ ...NOFORCE, p0: 0.3 }).reps[0];
  if (!hw.p.every(p => near(p, 0.3, 1e-12)) || !near(hw.g[50][1], 2 * 0.3 * 0.7, 1e-12)) errs.push('with no forces a very large population must stay at p and at p², 2pq, q²');
  // selection against aa: q_t = q0 / (1 + t q0)
  const sel = G.simulate({ ...NOFORCE, w: [1, 1, 0] }).reps[0];
  if (![1, 5, 20, 50].every(t => near(1 - sel.p[t], 0.5 / (1 + 0.5 * t), 1e-9))) errs.push('complete selection against aa must follow q/(1 + tq)');
  // heterozygote advantage
  const het = G.simulate({ ...NOFORCE, p0: 0.1, gens: 300, w: [0.8, 1, 0.6] }).reps[0];
  if (!near(het.p[300], 0.4 / 0.6, 1e-3)) errs.push('heterozygote advantage must settle at s_aa / (s_AA + s_aa)');
  // mutation and migration equilibria
  const mu = G.simulate({ ...NOFORCE, p0: 0.9, gens: 300, u: 0.02, v: 0.01 }).reps[0];
  if (!near(mu.p[300], 1 / 3, 1e-3)) errs.push('mutation must settle at v / (u + v)');
  const mig = G.simulate({ ...NOFORCE, p0: 0.9, gens: 300, m: 0.05, pm: 0.2 }).reps[0];
  if (!near(mig.p[300], 0.2, 1e-3)) errs.push('migration must pull p to the migrants\' p');
  const inb = G.simulate({ ...NOFORCE, p0: 0.4, F: 0.25 }).reps[0];
  if (!near(inb.g[10][1], 2 * 0.4 * 0.6 * 0.75, 1e-12) || !near(inb.p[10], 0.4, 1e-12)) errs.push('inbreeding must lower heterozygotes to 2pq(1 − F) without changing p');
  // drift: reproducible, unbiased, faster in small populations
  const dr = { ...NOFORCE, N: 20, gens: 30, reps: 200, seed: 99 };
  const a = G.simulate(dr), b = G.simulate(dr);
  if (JSON.stringify(a.reps.map(r => r.p)) !== JSON.stringify(b.reps.map(r => r.p))) errs.push('the same seed must give the same run');
  const meanP = a.reps.reduce((s, r) => s + r.p[30], 0) / a.reps.length;
  if (!near(meanP, 0.5, 0.06)) errs.push(`drift must not push p one way (mean p ${meanP.toFixed(3)})`);
  const lost = n => { const f = G.simulate({ ...dr, N: n, gens: 100, reps: 100 }).fates; return f.fixed + f.lost; };
  if (!(lost(10) > lost(50) && lost(50) > lost(500))) errs.push('drift must fix or lose alleles sooner in smaller populations');
  const more = G.simulate({ ...dr, reps: 210 });
  if (JSON.stringify(more.reps.slice(0, 200).map(r => r.p)) !== JSON.stringify(a.reps.map(r => r.p))) errs.push('adding replicates must not change the earlier ones');
  const bot = G.simulate({ ...NOFORCE, N: 500, gens: 20, reps: 1, seed: 5, event: { gen: 5, size: 4, len: 2 } }).reps[0];
  if (!(bot.n[4] === 500 && bot.n[5] === 4 && bot.n[6] === 4 && bot.n[7] === 500)) errs.push('a bottleneck must last exactly its length');
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
  // the numeric item: χ² for population Q in Table 3; both df give the same decision
  const q4 = (data.questions || []).find(q => q.id === `${SLUG}:hwe:4`);
  const t3 = data.stimuli && data.stimuli['hw-s1'] && data.stimuli['hw-s1'].tables[2];
  if (q4 && t3) {
    const x = chiOf(t3.check, 1, M), p = chiOf(t3.check, 0, M);
    if (Math.abs(q4.numeric.answer - Number(M.fixed(x.chi2, q4.numeric.decimals))) > 1e-9) errs.push(`${SLUG}:hwe:4: answer ${q4.numeric.answer}, Table 3 gives ${M.fixed(x.chi2, q4.numeric.decimals)}`);
    if (x.reject1 !== x.reject2 || p.reject1 !== p.reject2) errs.push('Table 3: df 1 and df 2 must give the same decision (needs-author hw-chi-square-df)');
    if (!x.reject2 || p.reject2) errs.push('Table 3: population Q must depart from Hardy-Weinberg and population P must not');
    if (x.small || p.small) errs.push('Table 3: an expected count is below 5');
  }
  if (!data.frq) errs.push('a simulator ends with a mini FRQ'); else frq(data.frq, SLUG, map, errs);
  return errs;
}
