/* Validator for statistics/data/tools/regression-lab.json (Regression lab), run by
   scripts/check-apstat-content.mjs. OWNED BY THIS TOOL ONLY.
   check(data, map) -> problems.
   - the frame (slug, kind, topic, intro, contexts) and the trademark wording;
   - the explore data sets: ids, topics, xs and ys of one length inside their
     axes, snapped to their steps, x values that vary;
   - every context and problem type regenerated SEEDS times through the model
     the page runs (ApStatMath.regressionLab.generate), each step sound
     (_drills.mjs), and every key recomputed here: the fit by its own sums
     (checked against ApStatDist.lsrl), predictions and residuals from the
     printed equation, b = r · sy / sx and a = ȳ − b x̄ from the printed
     summaries, and each choice's right option checked against the data
     (direction, strength, form by the residual bend, r, extrapolation).
   recheck(p, ctx, errs, w) is exported so the test can feed it a planted error. */
import { frame, sweep, close } from './_drills.mjs';
import { runtime, topicOk } from './_shared.mjs';

const mean = a => a.reduce((s, v) => s + v, 0) / a.length;
export function myFit(xs, ys) {
  const mx = mean(xs), my = mean(ys);
  let sxy = 0, sxx = 0, syy = 0;
  xs.forEach((x, i) => { sxy += (x - mx) * (ys[i] - my); sxx += (x - mx) ** 2; syy += (ys[i] - my) ** 2; });
  const b = sxy / sxx, a = my - b * mx, r = sxy / Math.sqrt(sxx * syy), res = xs.map((x, i) => ys[i] - a - b * x);
  return { a, b, r, res, mx, my, sx: Math.sqrt(sxx / (xs.length - 1)), sy: Math.sqrt(syy / (xs.length - 1)), s: Math.sqrt(res.reduce((t, e) => t + e * e, 0) / (xs.length - 2)) };
}
function bend(xs, res) {
  const m = mean(xs), q = xs.map(x => (x - m) ** 2), mq = mean(q), me = mean(res);
  let a = 0, b = 0, c = 0; q.forEach((v, i) => { a += (v - mq) * (res[i] - me); b += (v - mq) ** 2; c += (res[i] - me) ** 2; });
  return a / Math.sqrt(b * c);
}
const step = (p, k) => p.steps.find(s => s.key === k);
const right = (p, k) => { const s = step(p, k); return s.options[s.correct]; };
const fixed = (v, d) => { const k = 10 ** d; return (Math.round(v * k + (v >= 0 ? 1e-9 : -1e-9)) / k).toFixed(d); };

export function recheck(p, c, errs, w) {
  const { Dist } = runtime('regression-lab');
  const { xs, ys } = p.data, F = myFit(xs, ys), L = Dist.lsrl(xs, ys);
  const near = (k, want, tol = 1e-9) => { const s = step(p, k); if (!s) { errs.push(`${w}: no step ${k}`); return; } if (!close(s.cell.answer, want, tol, 1e-9)) errs.push(`${w}: ${k} is ${s.cell.answer}, recomputed ${want}`); };
  if (!close(F.b, L.b, 1e-9) || !close(F.r, L.r, 1e-9)) errs.push(`${w}: ApStatDist.lsrl disagrees with the direct sums`);
  if (new Set(xs).size !== xs.length) errs.push(`${w}: two points share an x value`);
  const printedOk = () => {
    // the equation shown is the data's fit, rounded
    if (Math.abs(p.data.a - F.a) > 0.05 * Math.max(1, Math.abs(F.a)) || Math.abs(p.data.b - F.b) > 0.005 * Math.max(1, Math.abs(F.b))) errs.push(`${w}: the printed line ${p.data.a} + ${p.data.b}x is not the data's fit ${F.a} + ${F.b}x`);
  };
  if (p.type === 'describe') {
    const dir = F.r > 0 ? 'Positive' : 'Negative', ar = Math.abs(F.r), st = ar >= 0.8 ? 'Strong' : ar >= 0.5 ? 'Moderate' : 'Weak', k = Math.abs(bend(xs, F.res));
    if (right(p, 'dir') !== dir) errs.push(`${w}: dir: expected ${dir}`);
    if (right(p, 'str') !== st) errs.push(`${w}: str: expected ${st} for r = ${F.r}`);
    if (p.data.curved ? !(k >= 0.6) : !(k <= 0.4)) errs.push(`${w}: form: the residual bend ${k} disagrees with curved = ${p.data.curved}`);
    if (right(p, 'form') !== (p.data.curved ? 'Curved (nonlinear)' : 'Linear')) errs.push(`${w}: form: wrong option marked right`);
  } else if (p.type === 'correlation') {
    if (right(p, 'pickr') !== 'r = ' + fixed(F.r, 2).replace('-', '−')) errs.push(`${w}: pickr: "${right(p, 'pickr')}" but r = ${F.r}`);
    if (!right(p, 'rmeans').startsWith('The direction and strength')) errs.push(`${w}: rmeans: wrong option marked right`);
    if (!right(p, 'units').startsWith('It would stay')) errs.push(`${w}: units: wrong option marked right`);
  } else if (p.type === 'predict') {
    printedOk();
    near('yhat', p.data.a + p.data.b * p.data.x0);
    const mn = Math.min(...xs), mx = Math.max(...xs);
    if (!(p.data.far > mx || p.data.far < mn)) errs.push(`${w}: the extrapolation x is inside the data`);
    if (!(p.data.x0 >= mn && p.data.x0 <= mx)) errs.push(`${w}: the prediction x is outside the data`);
    if (right(p, 'who') !== 'the predicted ' + c.y.name) errs.push(`${w}: who: wrong option marked right`);
    if (!right(p, 'how').startsWith(p.data.b > 0 ? 'increases' : 'decreases') || !right(p, 'how').includes(c.y.unit)) errs.push(`${w}: how: wrong direction or units`);
    if (!right(p, 'extrap').startsWith('No:')) errs.push(`${w}: extrap: wrong option marked right`);
  } else if (p.type === 'residual') {
    printedOk();
    const i = p.data.i, e = ys[i] - (p.data.a + p.data.b * xs[i]);
    near('resid', e);
    if (!right(p, 'rsign').includes(e > 0 ? 'above the value' : 'below the value')) errs.push(`${w}: rsign: wrong side`);
    const k = Math.abs(bend(xs, F.res));
    if (p.data.curved ? !(k >= 0.6) : !(k <= 0.4)) errs.push(`${w}: plot: the residual bend ${k} disagrees with curved = ${p.data.curved}`);
    if (!right(p, 'plot').startsWith(p.data.curved ? 'No:' : 'Yes: the residuals')) errs.push(`${w}: plot: wrong option marked right`);
  } else if (p.type === 'lsrl') {
    const sh = p.data.shown;
    for (const [k, v] of [['xbar', F.mx], ['ybar', F.my], ['sx', F.sx], ['sy', F.sy], ['s', F.s]]) if (Math.abs(sh[k] - v) > 0.005 + 1e-9) errs.push(`${w}: shown ${k} ${sh[k]} is not the data's ${v} rounded`);
    if (Math.abs(sh.r - F.r) > 0.0005 + 1e-9) errs.push(`${w}: shown r is not the data's, rounded`);
    const b = sh.r * sh.sy / sh.sx; near('b', b); near('a', sh.ybar - b * sh.xbar);
    if (!right(p, 'r2').includes('of the variation in ' + c.y.name)) errs.push(`${w}: r2: wrong option marked right`);
    if (!right(p, 's').startsWith('The actual')) errs.push(`${w}: s: wrong option marked right`);
  } else errs.push(`${w}: unknown type ${p.type}`);
}

export function check(data, map) {
  const errs = [];
  frame(data, 'regression-lab', 'simulator', map, errs);
  const { model } = runtime('regression-lab');
  if (!model || typeof model.generate !== 'function') { errs.push('statistics/assets/tools/math/regression-lab.js does not register ApStatMath.regressionLab with a generate()'); return errs; }
  const sets = (data.explore || {}).datasets || [], ids = new Set();
  if (!sets.length) errs.push('explore.datasets: at least one data set');
  for (const d of sets) {
    const w = `explore ${d.id}`;
    if (!d.id || ids.has(d.id)) errs.push(`${w}: missing or duplicate id`); ids.add(d.id);
    if (!topicOk(d.topic, map)) errs.push(`${w}: unknown topic "${d.topic}"`);
    if (!d.name || !d.noun) errs.push(`${w}: name and noun are required`);
    for (const ax of ['x', 'y']) {
      const A = d[ax] || {};
      for (const k of ['name', 'unit', 'short']) if (!A[k]) errs.push(`${w}: ${ax}.${k} is required`);
      if (!(A.hi > A.lo) || !(A.step > 0)) { errs.push(`${w}: ${ax} needs lo < hi and a step`); continue; }
      const vs = d[ax + 's'] || [];
      if (vs.some(v => v < A.lo || v > A.hi)) errs.push(`${w}: a ${ax} value is outside its axis`);
      if (vs.some(v => Math.abs(Math.round(v / A.step) * A.step - v) > 1e-9)) errs.push(`${w}: every ${ax} value must be a multiple of its step`);
    }
    if (!d.x || !d.x.per) errs.push(`${w}: x.per (the slope sentence's start) is required`);
    if (!Array.isArray(d.xs) || d.xs.length !== (d.ys || []).length || d.xs.length < 5) { errs.push(`${w}: xs and ys of one length, 5 or more`); continue; }
    if (new Set(d.xs).size < 2) errs.push(`${w}: the x values must vary`);
    const F = model.fit(d.xs, d.ys), G = myFit(d.xs, d.ys);
    if (!close(F.a, G.a) || !close(F.b, G.b) || !close(F.s, G.s)) errs.push(`${w}: the model's fit disagrees with the direct sums`);
  }
  for (const c of data.contexts || []) {
    for (const t of c.types || []) if (!model.TOPIC[t]) errs.push(`context ${c.id}: unknown type "${t}"`);
    for (const k of ['lead', 'noun', 'caption']) if (!c[k]) errs.push(`context ${c.id}: "${k}" is required`);
    if (!c.x || !c.y || !(c.x.hi > c.x.lo) || !(c.y.hi > c.y.lo) || !c.x.per || !c.x.one) errs.push(`context ${c.id}: x and y need lo < hi; x needs one and per`);
    if (!Array.isArray(c.slope) || c.slope.length !== 2 || Math.sign(c.slope[0]) !== Math.sign(c.slope[1])) errs.push(`context ${c.id}: slope is a [lo, hi] range of one sign`);
  }
  sweep(data, errs, (r, c, t) => model.generate(r, c, t), (p, c, w) => recheck(p, c, errs, w), c => c.types || [undefined]);
  return errs;
}
