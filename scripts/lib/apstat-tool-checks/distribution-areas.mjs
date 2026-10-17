/* Validator for statistics/data/tools/distribution-areas.json (distribution areas), run by
   scripts/check-apstat-content.mjs. OWNED BY THIS TOOL ONLY.
   check(data, map) -> problems. It regenerates 300 problems per context and
   type with the model the page runs (ApStatMath.distributionAreas) and then
   recomputes every key independently from the problem's data with ApStatDist
   (never through the model): z-scores, normal areas, inverse normal
   boundaries, the binomial event from its words (the counts it includes),
   its probability as a sum of binomPmf terms, mean and SD, and the
   empirical-rule percent from 68-95-99.7. */
import { frame, sweep, close } from './_drills.mjs';
import { runtime } from './_shared.mjs';

const TYPES = ['normal', 'inverse', 'binomial', 'empirical'];
const step = (p, k) => p.steps.find(s => s.key === k);
const key = s => s.cell.answer;
const HALF = { 0: 0, 1: 34, 2: 47.5, 3: 49.85 };

export function recheck(p, c, w, errs) {
  const { Dist } = runtime();
  const d = p.data, bad = m => errs.push(`${w}: ${m}`);
  if (!d) return bad('no data on the problem');
  if (p.type === 'normal') {
    const za = (d.a - d.mu) / d.sd, zb = (d.b - d.mu) / d.sd;
    const pr = d.mode === 'less' ? Dist.normCdf(zb) : d.mode === 'greater' ? 1 - Dist.normCdf(za) : Dist.normCdf(zb) - Dist.normCdf(za);
    if (!close(key(step(p, 'p')), pr)) bad('probability key');
    if (d.mode === 'between') { if (!close(key(step(p, 'za')), za) || !close(key(step(p, 'zb')), zb)) bad('z keys'); if (!(d.a < d.b)) bad('empty interval'); }
    else if (!close(key(step(p, 'z')), d.mode === 'less' ? zb : za)) bad('z key');
    const sk = step(p, 'sketch');
    if (sk.pics.list[sk.correct] !== d.mode) bad('sketch key');
    if (!(pr > 0.0005 && pr < 0.9995)) bad('probability too extreme to read');
  } else if (p.type === 'inverse') {
    const left = d.side === 'left' ? d.area : 1 - d.area, z = Dist.invNorm(left);
    if (!close(key(step(p, 'zstar')), z, 1e-9, 1e-9)) bad('z* key');
    if (!close(key(step(p, 'x')), d.mu + z * d.sd, 1e-9, 1e-9)) bad('boundary key');
    if (Math.abs(Dist.normCdf(z) - left) > 1e-9) bad('inverse does not invert');
  } else if (p.type === 'binomial') {
    const { n, p: pp, rel, k } = d;
    const [lo, hi] = { atMost: [0, k], fewer: [0, k - 1], exactly: [k, k], atLeast: [k, n], more: [k + 1, n] }[rel];
    if (lo !== d.lo || hi !== d.hi) bad(`event ${rel} ${k}: counts ${d.lo}..${d.hi}, expected ${lo}..${hi}`);
    let s = 0; for (let i = lo; i <= hi; i++) s += Dist.binomPmf(i, n, pp);
    if (!close(key(step(p, 'p')), s, 1e-9, 1e-12)) bad('binomial probability key');
    if (!close(key(step(p, 'mean')), n * pp)) bad('mean key');
    if (!close(key(step(p, 'sd')), Math.sqrt(n * pp * (1 - pp)))) bad('SD key');
    const ev = step(p, 'event'), want = lo === 0 ? `X \\le ${hi}` : hi === n && rel !== 'exactly' ? `X \\ge ${lo}` : `X = ${lo}`;
    if (!ev.options[ev.correct].includes(want)) bad(`event key "${ev.options[ev.correct]}" is not ${want}`);
    if (k < 1 || k > n - 1) bad('boundary count at an end');
  } else if (p.type === 'empirical') {
    const pct = (Math.sign(d.k2) * HALF[Math.abs(d.k2)]) - (Math.sign(d.k1) * HALF[Math.abs(d.k1)]);
    if (Math.abs(key(step(p, 'pct')) - pct) > 1e-9) bad('empirical percent key');
    if (!close(key(step(p, 'exact')), Dist.normCdf(d.k2) - Dist.normCdf(d.k1))) bad('exact area key');
    if (key(step(p, 'z')) !== d.kz || (d.kz !== d.k2 && d.kz !== d.k1) || d.kz === 0) bad('z key');
  } else bad(`unknown type ${p.type}`);
}

export function check(data, map) {
  const errs = [];
  frame(data, 'distribution-areas', 'simulator', map, errs);
  const { model } = runtime('distribution-areas');
  if (!model || typeof model.generate !== 'function') { errs.push('statistics/assets/tools/math/distribution-areas.js does not register ApStatMath.distributionAreas with a generate()'); return errs; }
  for (const c of data.contexts || []) for (const t of c.types || []) if (!TYPES.includes(t)) errs.push(`context ${c.id}: unknown type ${t}`);
  const ex = data.explore || {};
  for (const s of ex.normal || []) { const r = model.normal(s.mu, s.sd, s.mode, s.a, s.b); if (!(r.p > 0 && r.p < 1)) errs.push(`explore ${s.id}: no area`); }
  for (const s of ex.binomial || []) { const r = model.binom(s.n, s.p, s.rel, s.k); if (!(r.p > 0 && r.p < 1)) errs.push(`explore ${s.id}: no probability`); }
  sweep(data, errs, model.generate, (p, c, w) => recheck(p, c, w, errs), c => c.types || [undefined]);
  return errs;
}
