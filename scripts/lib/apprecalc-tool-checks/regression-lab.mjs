/* Validator for precalculus/data/tools/regression-lab.json (Regression lab), run by
   scripts/check-apprecalc-content.mjs. OWNED BY THIS TOOL ONLY (builder T1).
   check(data, map) -> problems.

   1. The frame, each context's kind, the datasets list (each with a topic).
   2. Every model on every Explore data set against this file's own least
      squares: Householder QR on the raw design matrix (not the model's
      centered normal equations), ln y for ExpReg and ln x for LnReg, and for
      the sinusoid a dense frequency scan with QR at each frequency. The
      constants, the fitted values and the sum of squared residuals agree; each
      data set's own model shows no residual pattern and a linear fit to a
      curved data set does.
   3. 300 seeded problems per context (_drills.mjs sweep), every key
      recomputed with this file's solver; the three-decimal rule: keys are
      full precision, and a prediction from rounded constants is named. */
import { frame, sweep, close } from './_drills.mjs';
import { runtime, topicOk } from './_shared.mjs';

const KINDS = ['linear', 'exponential', 'quadratic', 'residual', 'choose'];

/* Least squares by Householder QR: min |A c - y|. */
export function qrLsq(A, y) {
  const m = A.length, n = A[0].length, R = A.map(r => r.slice()), b = y.slice();
  for (let k = 0; k < n; k++) {
    let norm = 0; for (let i = k; i < m; i++) norm += R[i][k] ** 2;
    norm = Math.sqrt(norm); if (!norm) return null;
    const alpha = R[k][k] > 0 ? -norm : norm, v = new Array(m).fill(0);
    v[k] = R[k][k] - alpha; for (let i = k + 1; i < m; i++) v[i] = R[i][k];
    const vv = v.reduce((s, x) => s + x * x, 0); if (!vv) continue;
    for (let j = k; j < n; j++) { let d = 0; for (let i = k; i < m; i++) d += v[i] * R[i][j]; d = 2 * d / vv; for (let i = k; i < m; i++) R[i][j] -= d * v[i]; }
    let d = 0; for (let i = k; i < m; i++) d += v[i] * b[i]; d = 2 * d / vv; for (let i = k; i < m; i++) b[i] -= d * v[i];
  }
  const c = new Array(n);
  for (let i = n - 1; i >= 0; i--) { let s = b[i]; for (let j = i + 1; j < n; j++) s -= R[i][j] * c[j]; c[i] = s / R[i][i]; }
  return c;
}
const poly = (deg, xs, ys) => qrLsq(xs.map(x => Array.from({ length: deg + 1 }, (_, j) => x ** (deg - j))), ys);   // highest power first
/* This file's own fit of each model: { k, f }. */
export function ownFit(kind, xs, ys) {
  const deg = { linear: 1, quadratic: 2, cubic: 3, quartic: 4 }[kind];
  if (deg) { const k = poly(deg, xs, ys); return { k, f: x => k.reduce((s, c, j) => s + c * x ** (deg - j), 0) }; }
  if (kind === 'exponential') { const l = poly(1, xs, ys.map(Math.log)); const k = [Math.exp(l[1]), Math.exp(l[0])]; return { k, f: x => k[0] * k[1] ** x }; }
  if (kind === 'logarithmic') { const l = poly(1, xs.map(Math.log), ys); const k = [l[1], l[0]]; return { k, f: x => k[0] + k[1] * Math.log(x) }; }
  // sinusoid: scan the frequency densely, least squares for the rest at each one
  const span = Math.max(...xs) - Math.min(...xs), dx = span / (xs.length - 1), lo = Math.PI / span, hi = 2 * Math.PI / (2.2 * dx);
  let best = null;
  const at = b => { const c = qrLsq(xs.map(x => [Math.sin(b * x), Math.cos(b * x), 1]), ys); const sse = xs.reduce((s, x, i) => s + (ys[i] - c[0] * Math.sin(b * x) - c[1] * Math.cos(b * x) - c[2]) ** 2, 0); return { b, c, sse }; };
  for (let i = 0; i <= 20000; i++) { const r = at(lo + (hi - lo) * i / 20000); if (!best || r.sse < best.sse) best = r; }
  const k = [Math.hypot(best.c[0], best.c[1]), best.b, Math.atan2(best.c[1], best.c[0]), best.c[2]];
  return { k, f: x => k[0] * Math.sin(k[1] * x + k[2]) + k[3], sse: best.sse };
}
const sse = (f, xs, ys) => xs.reduce((s, x, i) => s + (ys[i] - f(x)) ** 2, 0);
const strip = s => String(s).replace(/<annotation[\s\S]*?<\/annotation>/g, '').replace(/<span class="sr-only">[\s\S]*?<\/span>/g, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

export function exploreProblems(model) {
  const errs = [];
  for (const id of model.DORDER) {
    const D = model.DATASETS[id], d = model.data(id);
    if (!model.MODELS[D.best]) { errs.push(`dataset ${id}: unknown best model ${D.best}`); continue; }
    if (d.xs.length < 8) errs.push(`dataset ${id}: fewer than 8 points`);
    for (const kind of model.MORDER) {
      if (!model.allowed(kind, d.xs, d.ys)) continue;
      const F = model.fit(kind, d.xs, d.ys), O = ownFit(kind, d.xs, d.ys), w = `dataset ${id} ${kind}`;
      if (!F) { errs.push(`${w}: no fit`); continue; }
      if (kind === 'sinusoidal') {
        // the frequency search may land anywhere in the scan's bin; the fit is judged by its sum of squares
        if (F.sse > O.sse * (1 + 1e-6) + 1e-9) errs.push(`${w}: SSE ${F.sse}, a dense scan finds ${O.sse}`);
        if (F.k[0] < 0) errs.push(`${w}: the amplitude must be positive`);
      } else {
        F.k.forEach((c, i) => { if (!close(c, O.k[i], 1e-6, 1e-7)) errs.push(`${w}: constant ${i} is ${c}, QR gives ${O.k[i]}`); });
        d.xs.forEach((x, i) => { if (!close(F.f(x), O.f(x), 1e-8, 1e-8)) errs.push(`${w}: fitted value at ${x} differs`); });
      }
      if (!close(F.sse, sse(F.f, d.xs, d.ys), 1e-9, 1e-9)) errs.push(`${w}: the stated SSE is not the sum of squared residuals`);
      F.res.forEach((e, i) => { if (!close(e, d.ys[i] - F.f(d.xs[i]), 1e-9, 1e-9)) errs.push(`${w}: residual ${i} is not actual minus predicted`); });
    }
    const own = model.fit(D.best, d.xs, d.ys);
    if (model.pattern(d.xs, own.res).pattern) errs.push(`dataset ${id}: its own model (${D.best}) shows a residual pattern`);
    if (D.best !== 'linear' && !model.pattern(d.xs, model.fit('linear', d.xs, d.ys).res).pattern) errs.push(`dataset ${id}: a linear fit shows no pattern, so the residual lesson does not show`);
  }
  return errs;
}

export function check(data, map) {
  const errs = [];
  frame(data, 'regression-lab', 'simulator', map, errs);
  const { M, model } = runtime('regression-lab');
  if (!model) { errs.push('the model ApPrecalcMath.regressionLab is not registered (precalculus/assets/tools/math/regression-lab.js)'); return errs; }
  if (model.stub) { errs.push('the model is still the Phase 0 stub: build it before adding data (docs/apprecalc-briefs/t1.md)'); return errs; }
  for (const c of data.contexts || []) if (!KINDS.includes(c.kind)) errs.push(`context ${c.id}: kind must be one of ${KINDS.join(', ')}`);
  if (!Array.isArray(data.datasets) || !data.datasets.length) errs.push('datasets: list the Explore data sets, each { id, topic }');
  for (const f of data.datasets || []) {
    if (!model.DATASETS[f.id]) errs.push(`datasets: unknown data set "${f.id}"`);
    if (!topicOk(f.topic, map)) errs.push(`datasets: ${f.id} has unknown topic "${f.topic}"`);
  }
  errs.push(...exploreProblems(model));

  const S = (p, k) => p.steps.find(s => s.key === k), ans = (p, k) => S(p, k).cell.answer;
  sweep(data, errs, (r, c, t) => model.generate(r, c, t), (p, c, w) => {
    const v = p.values;
    if (p.topic !== c.topic) errs.push(`${w}: topic ${p.topic}, context says ${c.topic}`);
    for (const s of p.steps) if (s.kind === 'choice' && s.correct !== 0) errs.push(`${w}: step ${s.key} key is not the first option`);
    for (const s of p.steps) if (s.calc && !(s.cell.abs === 0.001 && s.cell.rel === 0)) errs.push(`${w}: step ${s.key} is a calculator answer not graded to three decimals`);
    if (['linear', 'exponential', 'quadratic'].includes(p.type)) {
      const O = ownFit(p.type, v.xs, v.ys);
      if (!close(ans(p, 'a'), O.k[0], 1e-7, 1e-9)) errs.push(`${w}: a key ${ans(p, 'a')}, QR gives ${O.k[0]}`);
      if (S(p, 'b') && !close(ans(p, 'b'), O.k[1], 1e-7, 1e-9)) errs.push(`${w}: b key ${ans(p, 'b')}, QR gives ${O.k[1]}`);
      if (!close(ans(p, 'p'), O.f(v.x0), 1e-7, 1e-7)) errs.push(`${w}: prediction key ${ans(p, 'p')}, QR gives ${O.f(v.x0)}`);
      if (v.ys.some(y => Math.abs(y * 100 - Math.round(y * 100)) > 1e-6)) errs.push(`${w}: a data value has more than two decimals`);
      if (p.type === 'exponential') {
        const t = strip(S(p, 'kind').options[0]);
        if (!t.startsWith(O.k[1] > 1 ? 'It grows' : 'It decays')) errs.push(`${w}: the keyed meaning of b is wrong`);
      }
      if (p.type === 'quadratic' && !strip(S(p, 'open').options[0]).includes(O.k[0] < 0 ? 'concave down' : 'concave up')) errs.push(`${w}: the keyed concavity is wrong`);
    }
    if (p.type === 'residual') {
      const yhat = v.A * v.x0 + v.B;
      if (!close(ans(p, 'res'), v.y0 - yhat, 1e-9, 1e-9)) errs.push(`${w}: residual key ${ans(p, 'res')}, actual − predicted is ${v.y0 - yhat}`);
      if (v.ys[v.xs.indexOf(v.x0)] !== v.y0) errs.push(`${w}: the point is not in the table`);
      const t = strip(S(p, 'fit').options[0]);
      if (!t.startsWith(v.curved ? 'No' : 'Yes')) errs.push(`${w}: the keyed verdict does not match the shape of the data (${v.curved ? 'curved' : 'linear'})`);
      // this file's own runs count on the residuals of its own line
      const O = ownFit('linear', v.xs, v.ys), sg = v.xs.map((x, i) => Math.sign(v.ys[i] - O.f(x))).filter(Boolean);
      let runs = 1; for (let i = 1; i < sg.length; i++) if (sg[i] !== sg[i - 1]) runs++;
      if (v.curved && runs > 4) errs.push(`${w}: keyed "pattern", yet the residual signs change ${runs - 1} times`);
    }
    if (p.type === 'choose') {
      const diffs = v.ys.slice(1).map((y, i) => y - v.ys[i]), ratios = v.ys.slice(1).map((y, i) => y / v.ys[i]);
      const lin = diffs.every(x => close(x, diffs[0], 1e-12, 1e-12)), exp = ratios.every(x => close(x, ratios[0], 1e-12, 1e-12));
      if (lin === exp) errs.push(`${w}: the table is ${lin ? 'both' : 'neither'} linear and exponential`);
      if (!close(ans(p, 'd'), diffs[0], 1e-12, 1e-12) || !close(ans(p, 'q'), ratios[0], 1e-12, 1e-12)) errs.push(`${w}: difference or ratio key`);
      if (!strip(S(p, 'model').options[0]).startsWith(exp ? 'Exponential' : 'Linear')) errs.push(`${w}: the keyed model type is wrong`);
    }
  });
  return errs;
}
