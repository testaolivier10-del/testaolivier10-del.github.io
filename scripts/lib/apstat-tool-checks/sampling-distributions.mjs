/* Validator for statistics/data/tools/sampling-distributions.json (Sampling distributions), run by
   scripts/check-apstat-content.mjs. OWNED BY THIS TOOL ONLY.
   check(data, map) -> problems. The frame (slug, kind, topic, intro,
   contexts), the explore populations, then 300 problems per context and type
   regenerated with the model the page runs (ApStatMath.samplingDistributions)
   and every key recomputed independently from the problem's givens with
   ApStatDist (never through the model): the center and spread of x-bar,
   p-hat and their differences, the AP® shape rules (normal population or
   n >= 30; np and n(1 - p) at least 10), each normal probability in its
   direction, the CLT picture's simulated spreads, and the estimators' bias
   and variability read from their simulated values. */
import { frame, sweep, close } from './_drills.mjs';
import { runtime } from './_shared.mjs';

export const TYPES = ['mean', 'prop', 'diff', 'shape', 'estimator'];
const step = (p, k) => p.steps.find(s => s.key === k);
const key = s => s.cell.answer;
const right = s => String(s.options[s.correct]).replace(/<[^>]+>/g, ' ');

export function recheck(p, c, w, errs) {
  const { Dist } = runtime();
  const g = p.given, bad = m => errs.push(`${w}: ${m}`);
  if (!g) return bad('no givens on the problem');
  const tail = (x, center, sd, dir) => { const v = Dist.normCdf((x - center) / sd); return dir === 'gt' ? 1 - v : v; };
  const prob = (center, sd, ok) => {
    const s = step(p, 'prob');
    if (ok !== !!s) return bad(ok ? 'the normal model fits but there is no probability step' : 'a probability from a normal model whose condition fails');
    if (s && !close(key(s), tail(g.x != null ? g.x : 0, center, sd, g.dir), 1e-9, 1e-12)) bad(`probability key ${key(s)}`);
  };
  if (p.type === 'mean') {
    const se = g.sigma / Math.sqrt(g.n), ok = g.normalPop || g.n >= 30;
    if (!close(key(step(p, 'mean')), g.mu)) bad('mean key');
    if (!close(key(step(p, 'sd')), se)) bad('SD key');
    if (!/^It is met: /.test(right(step(p, 'tenpct')))) bad('10% key');
    const sh = right(step(p, 'shape'));
    if (!(g.normalPop ? /^Normal, because the population/ : ok ? /^Approximately normal, because/ : /^Not approximately normal/).test(sh)) bad(`shape key "${sh.slice(0, 40)}"`);
    prob(g.mu, se, ok);
  } else if (p.type === 'prop') {
    const se = Math.sqrt(g.p * (1 - g.p) / g.n), ok = g.n * g.p >= 10 && g.n * (1 - g.p) >= 10;
    if (!close(key(step(p, 'mean')), g.p)) bad('mean key');
    if (!close(key(step(p, 'sd')), se)) bad('SD key');
    if (!(ok ? /^Met: / : /^Not met: /).test(right(step(p, 'counts')))) bad('large counts key');
    prob(g.p, se, ok);
  } else if (p.type === 'diff') {
    if (g.kind === 'prop') {
      const sd = Math.sqrt(g.p1 * (1 - g.p1) / g.n1 + g.p2 * (1 - g.p2) / g.n2);
      const ok = [g.n1 * g.p1, g.n1 * (1 - g.p1), g.n2 * g.p2, g.n2 * (1 - g.p2)].every(x => x >= 10);
      if (!close(key(step(p, 'mean')), g.p1 - g.p2, 1e-9, 1e-12)) bad('mean key');
      if (!close(key(step(p, 'sd')), sd)) bad('SD key');
      if (!(ok ? /^Yes: all four/ : /^No: not all four/).test(right(step(p, 'counts')))) bad('large counts key');
      prob(g.p1 - g.p2, sd, ok);
    } else {
      const sd = Math.sqrt(g.s1 * g.s1 / g.n1 + g.s2 * g.s2 / g.n2), ok = /normal/.test(g.shape) || (g.n1 >= 30 && g.n2 >= 30);
      if (!close(key(step(p, 'mean')), g.mu1 - g.mu2, 1e-9, 1e-12)) bad('mean key');
      if (!close(key(step(p, 'sd')), sd)) bad('SD key');
      if (!(ok ? /^Yes/ : /^No/).test(right(step(p, 'shape')))) bad('shape key');
      prob(g.mu1 - g.mu2, sd, ok);
    }
    if (g.dir && step(p, 'prob')) { const m = g.kind === 'prop' ? g.p1 - g.p2 : g.mu1 - g.mu2; if ((g.dir === 'lt') !== (m > 0)) bad('the probability is not of the "wrong" sign'); }
  } else if (p.type === 'shape') {
    const se = g.sigma / Math.sqrt(g.n), seTrue = g.popSigma / Math.sqrt(g.n);
    if (!close(key(step(p, 'sd')), se)) bad('SD key');
    const [a, one, narrow] = g.sds;
    if (Math.abs(a / seTrue - 1) > 0.25) bad(`the right picture's simulated SD ${a} is not near sigma/sqrt(n) = ${seTrue}`);
    if (Math.abs(one / g.popSigma - 1) > 0.25) bad(`the single-values picture's SD ${one} is not near sigma`);
    if (!(narrow < a * 0.5)) bad('the narrow picture is not much narrower');
    const pic = step(p, 'pic');
    if (!pic.optionsHtml || pic.optionsHtml.length !== 3 || pic.correct !== 0) bad('picture step');
    const word = { 2: 'half', 3: 'one third', 4: 'one fourth' }[Math.sqrt(g.m)];
    if (!right(step(p, 'grow')).startsWith(word)) bad('grow key');
  } else if (p.type === 'estimator') {
    const rows = p.figure && p.figure.rows, R = g.roles;
    if (!rows || rows.length !== 3) return bad('no simulated estimators');
    const st = Object.fromEntries(rows.map(r => [r.name, { m: Dist.mean(r.values), s: Dist.sd(r.values), n: r.values.length }]));
    for (const nm of [R.best, R.wide]) if (Math.abs(st[nm].m - g.theta) > 4 * st[nm].s / Math.sqrt(st[nm].n)) bad(`${nm} should look unbiased`);
    if (Math.abs(st[R.biased].m - g.theta) < 8 * st[R.biased].s / Math.sqrt(st[R.biased].n)) bad(`${R.biased} should look biased`);
    const least = Object.keys(st).sort((x, y) => st[x].s - st[y].s)[0];
    if (right(step(p, 'spread')) !== least) bad('least variability key');
    if (right(step(p, 'unbiased')) !== [R.best, R.wide].sort().join(' and ')) bad('unbiased key');
    if (right(step(p, 'best')) !== R.best) bad('best key');
  } else bad(`unknown type ${p.type}`);
}

export function check(data, map) {
  const errs = [];
  frame(data, 'sampling-distributions', 'simulator', map, errs);
  const { model } = runtime('sampling-distributions');
  if (!model || typeof model.generate !== 'function') { errs.push('statistics/assets/tools/math/sampling-distributions.js does not register ApStatMath.samplingDistributions with a generate()'); return errs; }
  // explore: every population is in the model and well formed
  const ids = (data.explore && data.explore.populations) || [];
  if (!ids.length) errs.push('explore.populations is empty');
  for (const id of ids) {
    const def = model.POPS[id];
    if (!def) { errs.push(`explore population "${id}" is not in the model`); continue; }
    const pop = model.population(def);
    if (pop.kind === 'mean') {
      const tot = pop.weights.reduce((a, b) => a + b, 0);
      if (!close(tot, 1, 1e-9, 1e-12) || pop.weights.some(x => !(x >= 0))) errs.push(`population ${id}: weights`);
      if (!(pop.mu > pop.lo && pop.mu < pop.hi && pop.sigma > 0)) errs.push(`population ${id}: mu or sigma`);
    } else if (!(pop.p > 0 && pop.p < 1)) errs.push(`population ${id}: p`);
  }
  for (const c of data.contexts || []) {
    if (!Array.isArray(c.types) || !c.types.length || c.types.some(t => !TYPES.includes(t))) errs.push(`context ${c.id}: types must be some of ${TYPES.join(', ')}`);
    if ((c.types || []).includes('shape') && !model.POPS[c.pop]) errs.push(`context ${c.id}: population "${c.pop}" is not in the model`);
  }
  if (errs.length) return errs;
  sweep(data, errs, model.generate, (p, c, w) => recheck(p, c, w, errs), c => c.types);
  return errs;
}
