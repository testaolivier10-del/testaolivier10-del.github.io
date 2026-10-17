/* Validator for statistics/data/tools/ci-capture.json (Interval capture), run by
   scripts/check-apstat-content.mjs. OWNED BY THIS TOOL ONLY.
   check(data, map) -> problems. The frame, the explore populations, then 300
   problems per context and type regenerated with the model the page runs
   (ApStatMath.ciCapture) and every key recomputed independently from the
   problem's givens with ApStatDist (ci1prop, ci1mean, invNorm, invT): p-hat,
   the critical value, the standard error and margin of error, the
   interpretation that names the right endpoints and the parameter, the claim
   read against the interval, and the captures counted on the simulated
   intervals. */
import { frame, sweep, close } from './_drills.mjs';
import { runtime } from './_shared.mjs';

export const TYPES = ['prop', 'mean', 'claim', 'capture'];
const step = (p, k) => p.steps.find(s => s.key === k);
const key = s => s.cell.answer;
const right = s => String(s.options[s.correct]).replace(/<[^>]+>/g, ' ');
const fx = (x, d) => (Math.round(x * 10 ** d + (x >= 0 ? 1e-9 : -1e-9)) / 10 ** d).toFixed(d);

export function recheck(p, c, w, errs) {
  const { Dist } = runtime();
  const g = p.given, bad = m => errs.push(`${w}: ${m}`);
  if (!g) return bad('no givens on the problem');
  const L = g.level, q = 1 - (1 - L) / 2;
  if (p.type === 'prop') {
    if (!(g.x >= 10 && g.n - g.x >= 10)) bad('large counts fails for this sample');
    const ph = g.x / g.n, iv = Dist.ci1prop(ph, g.n, L);
    if (!close(key(step(p, 'phat')), ph)) bad('p-hat key');
    if (!close(key(step(p, 'crit')), Dist.invNorm(q))) bad('z* key');
    if (!close(key(step(p, 'se')), iv.se)) bad('SE key');
    if (!close(key(step(p, 'me')), iv.me)) bad('ME key');
    const it = right(step(p, 'interp'));
    if (!it.startsWith('We are ') || !it.includes(`from ${fx(iv.lo, 3)} to ${fx(iv.hi, 3)}`) || !/true proportion/.test(it)) bad(`interpretation key "${it.slice(0, 60)}"`);
    if (!right(step(p, 'level')).startsWith('If we took many random samples of ' + g.n)) bad('level key');
  } else if (p.type === 'mean') {
    const iv = Dist.ci1mean(g.xbar, g.s, g.n, L), d = g.d + 1;
    if (key(step(p, 'df')) !== g.n - 1) bad('df key');
    if (!close(key(step(p, 'crit')), Dist.invT(q, g.n - 1))) bad('t* key');
    if (!close(key(step(p, 'se')), iv.se)) bad('SE key');
    if (!close(key(step(p, 'me')), iv.me)) bad('ME key');
    const it = right(step(p, 'interp'));
    if (!it.startsWith('We are ') || !it.includes(`from ${fx(iv.lo, d)} to ${fx(iv.hi, d)}`) || !/true mean/.test(it)) bad(`interpretation key "${it.slice(0, 60)}"`);
  } else if (p.type === 'claim') {
    const iv = Dist.ci1prop(g.phat, g.n, L);
    if (Math.abs(g.lo - iv.lo) > 0.0005 + 1e-12 || Math.abs(g.hi - iv.hi) > 0.0005 + 1e-12) bad('the interval is not the sample\'s interval');
    if (!close(key(step(p, 'mefrom')), (g.hi - g.lo) / 2)) bad('ME key');
    const yes = g.p0 < g.lo, cl = right(step(p, 'claim'));
    if (!yes && !(g.p0 >= g.lo && g.p0 <= g.hi)) bad('claimed value above the interval');
    if (!(yes ? /^Yes: every value/ : /^No: /).test(cl)) bad('claim key');
    if (!right(step(p, 'wider')).startsWith('wider')) bad('wider key');
    if (!right(step(p, 'bign')).startsWith('half')) bad('4n key');
  } else if (p.type === 'capture') {
    const hits = g.ests.filter(e => { const iv = Dist.ci1prop(e, g.n, L); return iv.lo <= g.p && g.p <= iv.hi; }).length;
    if (key(step(p, 'count')) !== hits) bad(`count key ${key(step(p, 'count'))} vs ${hits}`);
    if (!close(key(step(p, 'longrun')), L * 100)) bad('long run key');
    if (p.figure.ivs.filter(v => v.hit).length !== hits) bad('the picture disagrees with the count');
  } else bad(`unknown type ${p.type}`);
}

export function check(data, map) {
  const errs = [];
  frame(data, 'ci-capture', 'simulator', map, errs);
  const { model } = runtime('ci-capture');
  if (!model || typeof model.generate !== 'function') { errs.push('statistics/assets/tools/math/ci-capture.js does not register ApStatMath.ciCapture with a generate()'); return errs; }
  const E = data.explore || {};
  if (!(E.props || []).length || !(E.means || []).length) errs.push('explore needs props and means');
  for (const x of E.props || []) if (!(x.p > 0 && x.p < 1) || !x.name || !x.id) errs.push(`explore prop ${x.id}: p, name, id`);
  for (const x of E.means || []) if (!(x.sigma > 0) || !['normal', 'skewed'].includes(x.shape) || !x.name || !x.id) errs.push(`explore mean ${x.id}: sigma, shape, name, id`);
  for (const c of data.contexts || []) if (!Array.isArray(c.types) || !c.types.length || c.types.some(t => !TYPES.includes(t))) errs.push(`context ${c.id}: types must be some of ${TYPES.join(', ')}`);
  if (errs.length) return errs;
  sweep(data, errs, model.generate, (p, c, w) => recheck(p, c, w, errs), c => c.types);
  return errs;
}
