/* Validator for statistics/data/tools/data-explorer.json (Data explorer), run by
   scripts/check-apstat-content.mjs. OWNED BY THIS TOOL ONLY.
   check(data, map) -> problems.
   - the frame (slug, kind, topic, intro, contexts) and the trademark wording;
   - the explore data sets: ids, topics, values inside their axis, a step and a
     bin width range that make sense;
   - every context and problem type regenerated SEEDS times through the model
     the page runs (ApStatMath.dataExplorer.generate), each step sound
     (_drills.mjs), and every key recomputed here: the mean and SD by their own
     loops, quartiles, fences and outliers through ApStatDist.summary, and each
     choice's right option checked against the data (shape by its own skewness,
     mean against median, outlier calls, the 2 SD rule).
   recheck(p, ctx, errs, w) is exported so the test can feed it a planted error. */
import { frame, sweep, close } from './_drills.mjs';
import { runtime, topicOk } from './_shared.mjs';

const mean = a => a.reduce((s, v) => s + v, 0) / a.length;
const sd = a => { const m = mean(a); return Math.sqrt(a.reduce((s, v) => s + (v - m) ** 2, 0) / (a.length - 1)); };
function skew(a) { const n = a.length, m = mean(a), s = sd(a); return n / ((n - 1) * (n - 2)) * a.reduce((t, v) => t + ((v - m) / s) ** 3, 0); }
const step = (p, k) => p.steps.find(s => s.key === k);
const key = (p, k) => step(p, k).cell.answer;
const right = (p, k) => { const s = step(p, k); return s.options[s.correct]; };

export function recheck(p, c, errs, w) {
  const { Dist } = runtime('data-explorer');
  const xs = p.data.values, S = Dist.summary(xs), bad = (k, got, want) => errs.push(`${w}: ${k} is ${got}, recomputed ${want}`);
  const near = (k, want) => { const s = step(p, k); if (!s) { errs.push(`${w}: no step ${k}`); return; } if (!close(s.cell.answer, want, 1e-9, 1e-9)) bad(k, s.cell.answer, want); };
  if (xs.some(v => !(v >= c.lo - 1e-9 && v <= c.hi + 1e-9))) errs.push(`${w}: a value is outside the context's range ${c.lo} to ${c.hi}`);
  if (p.type === 'summary') {
    near('mean', mean(xs)); near('median', S.med); near('iqr', S.q3 - S.q1); near('sd', sd(xs));
  } else if (p.type === 'resist') {
    const ys = p.data.changed, T = Dist.summary(ys);
    near('dmean', mean(ys) - mean(xs)); near('dmed', T.med - S.med);
    if (!(sd(ys) > sd(xs)) || Math.abs(T.iqr - S.iqr) > 1e-9) errs.push(`${w}: the change should raise the SD and keep the IQR`);
    if (right(p, 'spread') !== 'The SD increases; the IQR stays the same.') errs.push(`${w}: spread: wrong option marked right`);
  } else if (p.type === 'fences') {
    const hi = p.data.side === 'upper', fence = hi ? S.q3 + 1.5 * (S.q3 - S.q1) : S.q1 - 1.5 * (S.q3 - S.q1);
    near('q1', S.q1); near('q3', S.q3); near('fence', fence);
    const ext = hi ? Math.max(...xs) : Math.min(...xs), out = hi ? ext > fence : ext < fence;
    if (right(p, 'isout') !== (out ? 'Yes' : 'No')) errs.push(`${w}: isout: the right answer is ${out ? 'Yes' : 'No'}`);
    const inside = xs.filter(v => v >= S.q1 - 1.5 * S.iqr && v <= S.q3 + 1.5 * S.iqr);
    near('whisk', hi ? Math.max(...inside) : Math.min(...inside));
  } else if (p.type === 'describe') {
    const g = skew(xs), sh = p.data.shape, word = { right: 'Skewed right', left: 'Skewed left', sym: 'Roughly symmetric' }[sh];
    if (sh === 'right' && !(g >= 0.6)) errs.push(`${w}: called skewed right but skewness is ${g}`);
    if (sh === 'left' && !(g <= -0.6)) errs.push(`${w}: called skewed left but skewness is ${g}`);
    if (sh === 'sym' && !(Math.abs(g) <= 0.35)) errs.push(`${w}: called symmetric but skewness is ${g}`);
    if (right(p, 'shape') !== word) errs.push(`${w}: shape: "${right(p, 'shape')}" marked right, expected "${word}"`);
    const m = mean(xs), want = sh === 'right' ? 'greater' : sh === 'left' ? 'less' : 'about';
    if (sh === 'right' && !(m > S.med) || sh === 'left' && !(m < S.med) || sh === 'sym' && !(Math.abs(m - S.med) < 0.1 * sd(xs))) errs.push(`${w}: mean ${m} and median ${S.med} disagree with the shape ${sh}`);
    if (!right(p, 'vs').includes(want === 'about' ? 'about the same' : want)) errs.push(`${w}: vs: wrong option marked right`);
    const good = right(p, 'sentence');
    if (!good.includes(c.whats || c.what) || !good.includes(c.unit)) errs.push(`${w}: the full-credit sentence lacks context`);
    if (S.outliers.length === 0 ? !good.includes('no outliers') : good.includes('no outliers')) errs.push(`${w}: the full-credit sentence misstates the outliers`);
  } else if (p.type === 'zscore') {
    const { x, mean: m2, sd: s2 } = p.data;
    if (Math.abs(m2 - mean(xs)) > 0.005 + 1e-9 || Math.abs(s2 - sd(xs)) > 0.005 + 1e-9) errs.push(`${w}: the stated mean or SD is not the data's, rounded`);
    if (!xs.includes(x)) errs.push(`${w}: the value is not one of the data`);
    const z = (x - m2) / s2; near('z', z);
    if (right(p, 'zrule') !== (Math.abs(z) > 2 ? 'Yes' : 'No')) errs.push(`${w}: zrule: wrong option marked right`);
    if (!right(p, 'zread').includes(z > 0 ? 'above the mean' : 'below the mean')) errs.push(`${w}: zread: wrong side`);
  } else errs.push(`${w}: unknown type ${p.type}`);
}

export function check(data, map) {
  const errs = [];
  frame(data, 'data-explorer', 'simulator', map, errs);
  const { M, model } = runtime('data-explorer');
  if (!model || typeof model.generate !== 'function') { errs.push('statistics/assets/tools/math/data-explorer.js does not register ApStatMath.dataExplorer with a generate()'); return errs; }
  const sets = (data.explore || {}).datasets || [], ids = new Set();
  if (!sets.length) errs.push('explore.datasets: at least one data set');
  for (const d of sets) {
    const w = `explore ${d.id}`;
    if (!d.id || ids.has(d.id)) errs.push(`${w}: missing or duplicate id`); ids.add(d.id);
    if (!topicOk(d.topic, map)) errs.push(`${w}: unknown topic "${d.topic}"`);
    for (const k of ['name', 'what', 'unit', 'noun', 'lead']) if (!d[k]) errs.push(`${w}: "${k}" is required`);
    if (!Array.isArray(d.values) || d.values.length < 5 || d.values.some(v => !Number.isFinite(v))) { errs.push(`${w}: values: 5 or more numbers`); continue; }
    if (!Array.isArray(d.x) || !(d.x[1] > d.x[0])) errs.push(`${w}: x must be [lo, hi]`);
    else if (d.values.some(v => v < d.x[0] || v > d.x[1])) errs.push(`${w}: a value is outside the axis`);
    if (!(d.step > 0) || d.values.some(v => Math.abs(Math.round(v / d.step) * d.step - v) > 1e-9)) errs.push(`${w}: every value must be a multiple of step`);
    if (!(d.binMin > 0 && d.binMax >= d.binMin && d.bin >= d.binMin && d.bin <= d.binMax && d.binStep > 0)) errs.push(`${w}: bin, binMin, binMax, binStep`);
    // the explore page's numbers are the model's: spot-check them against our own loops
    const S = model.stats(d.values);
    if (!close(S.mean, mean(d.values)) || !close(S.sd, sd(d.values))) errs.push(`${w}: model mean or SD disagrees`);
    const B = model.bins(d.values, model.binStart(d.x[0], d.bin), d.bin);
    if (B.counts.reduce((s, v) => s + v, 0) !== d.values.length) errs.push(`${w}: the histogram does not count every value`);
  }
  for (const c of data.contexts || []) {
    for (const t of c.types || []) if (!model.TOPIC[t]) errs.push(`context ${c.id}: unknown type "${t}"`);
    for (const k of ['lead', 'what', 'unit', 'noun']) if (!c[k]) errs.push(`context ${c.id}: "${k}" is required`);
    if (!(c.hi > c.lo)) errs.push(`context ${c.id}: lo must be below hi`);
  }
  sweep(data, errs, (r, c, t) => model.generate(r, c, t), (p, c, w) => recheck(p, c, errs, w), c => c.types || [undefined]);
  void M;
  return errs;
}
