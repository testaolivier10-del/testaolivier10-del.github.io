/* Validator for precalculus/data/tools/exp-log-lab.json (Exponential and log lab), run by
   scripts/check-apprecalc-content.mjs. OWNED BY THIS TOOL ONLY (builder T2).
   check(data, map) -> problems.

   The frame, the Explore lists (views and data sets known, topics of the
   map), the model's Explore numbers (the semi-log fit against a least-squares
   fit written here, the log rules on numbers, the overtaking point), then
   every problem the drill can generate (300 seeds per context,
   scripts/lib/apprecalc-tool-checks/_drills.mjs) recomputed here from the
   numbers printed in its own text, without the model: differences and
   ratios of the table, b from two points by logarithms, the swapped point
   and the exponent of a log, the log rules, slope and 10^slope on a
   semi-log line. Every string is strict TeX. */
import { frame, sweep, close } from './_drills.mjs';
import { runtime, topicOk } from './_shared.mjs';

const VIEWS = ['ratios', 'inverse', 'rules', 'semilog'];
function texOk(Tex, s, w, errs) { try { Tex.html(String(s), { strict: true }); } catch (e) { errs.push(`${w}: TeX: ${e.message}`); } }
const nums = s => [...String(s).matchAll(/-?\d+(?:\.\d+)?/g)].map(m => Number(m[0]));
// a number shown in TeX: 8, -2, \frac{1}{4}
function texNum(t) { const f = /^(-?)\\frac\{(\d+)\}\{(\d+)\}$/.exec(t.trim()); return f ? (f[1] ? -1 : 1) * Number(f[2]) / Number(f[3]) : Number(t); }

export function exploreProblems(model) {
  const errs = [];
  for (const [id, d] of Object.entries(model.DATASETS)) {
    const P = d.pts, N = P.length, X = P.map(p => p[0]), Y = P.map(p => Math.log10(p[1]));
    const mx = X.reduce((a, b) => a + b) / N, my = Y.reduce((a, b) => a + b) / N;
    const m = X.reduce((s, x, i) => s + (x - mx) * (Y[i] - my), 0) / X.reduce((s, x) => s + (x - mx) ** 2, 0), c = my - m * mx;
    const f = model.fit(P);
    if (!close(f.m, m, 1e-9, 1e-12) || !close(f.c, c, 1e-9, 1e-12) || !close(f.b, 10 ** m, 1e-9) || !close(f.a, 10 ** c, 1e-9)) errs.push(`data set ${id}: the semi-log fit is wrong`);
    if (P.some(p => !(p[1] > 0))) errs.push(`data set ${id}: a value is not positive (no log)`);
    if (id !== 'linear' && Math.abs(f.r) < 0.995) errs.push(`data set ${id}: not straight on a semi-log plot (r = ${f.r})`);
  }
  for (const [b, u, v] of [[2, 2, 4], [10, 3, 7], [3, 9, 2]]) {
    const L = x => Math.log(x) / Math.log(b);
    const p = model.rule('product', b, u, v), q = model.rule('quotient', b, u, v), w = model.rule('power', b, u, v);
    if (!close(p.lhs, L(u * v), 1e-12, 1e-12) || !close(p.rhs, L(u) + L(v), 1e-12, 1e-12) || !close(p.lhs, p.rhs, 1e-12, 1e-12)) errs.push('the product rule is wrong');
    if (!close(q.lhs, L(u / v), 1e-12, 1e-12) || !close(q.lhs, q.rhs, 1e-12, 1e-12)) errs.push('the quotient rule is wrong');
    if (!close(w.lhs, L(u ** v), 1e-12, 1e-12) || !close(w.lhs, w.rhs, 1e-12, 1e-12)) errs.push('the power rule is wrong');
  }
  const t = model.overtake(2, 3, 1.5);
  if (!(t > 0) || Math.abs(2 * 1.5 ** t - (2 + 3 * t)) > 1e-6 || 2 * 1.5 ** (t - 0.1) > 2 + 3 * (t - 0.1)) errs.push('overtake(2, 3, 1.5) is not where the exponential passes the line');
  const rows = model.table(5, 2, 1.2, 4, 1);
  rows.forEach((r, i) => { if (!close(r.L, 5 + 2 * i, 1e-12) || !close(r.E, 5 * 1.2 ** i, 1e-12) || (i && (!close(r.dL, 2, 1e-12) || !close(r.rE, 1.2, 1e-12)))) errs.push(`table row ${i} is wrong`); });
  return errs;
}

export function check(data, map) {
  const errs = [];
  frame(data, 'exp-log-lab', 'simulator', map, errs);
  const { model, Tex } = runtime('exp-log-lab');
  if (!model) { errs.push('the model ApPrecalcMath.expLogLab is not registered (precalculus/assets/tools/math/exp-log-lab.js)'); return errs; }
  if (model.stub) { errs.push('the model is still the Phase 0 stub: build it before adding data (docs/apprecalc-briefs/t2.md)'); return errs; }
  for (const v of data.views || []) { if (!VIEWS.includes(v.id)) errs.push(`view ${v.id}: unknown view`); if (!topicOk(v.topic, map)) errs.push(`view ${v.id}: unknown topic "${v.topic}"`); }
  if (!(data.views || []).length) errs.push('no views for Explore');
  for (const d of data.datasets || []) { if (!model.DATASETS[d.id]) errs.push(`data set ${d.id}: unknown data set`); if (!topicOk(d.topic, map)) errs.push(`data set ${d.id}: unknown topic "${d.topic}"`); }
  for (const c of data.contexts || []) if (!model.KINDS.includes(c.kind)) errs.push(`context ${c.id}: unknown kind "${c.kind}"`);
  errs.push(...exploreProblems(model));

  const recheck = (p, c, w) => {
    const before = errs.length;
    for (const s of [p.text, ...p.solution, ...p.steps.flatMap(s => [s.label, s.hint || '', ...(s.options || []), ...(s.why || []), ...((s.cell && s.cell.mistakes) || []).map(m => m.why)])]) texOk(Tex, s, w, errs);
    if (errs.length > before) return;
    const S = Object.fromEntries(p.steps.map(s => [s.key, s]));
    const A = k => S[k].cell.answer;
    if (p.type === 'table') {
      const cells = [...p.text.matchAll(/<td>(-?[\d.]+)<\/td>/g)].map(m => Number(m[1])), xs = cells.slice(0, 4), ys = cells.slice(4);
      const h = xs[1] - xs[0];
      if (!xs.every((x, i) => !i || close(x - xs[i - 1], h, 1e-12, 1e-12))) errs.push(`${w}: the x steps are not equal`);
      const d = ys.slice(1).map((y, i) => y - ys[i]), r = ys.slice(1).map((y, i) => y / ys[i]);
      const lin = d.every(v => close(v, d[0], 1e-9, 1e-9)), exp = r.every(v => close(v, r[0], 1e-9, 1e-9));
      if (lin === exp) errs.push(`${w}: the table is both or neither linear and exponential`);
      const right = S.type.options[S.type.correct];
      if (!(lin ? /^Linear: /.test(right) : /^Exponential: /.test(right))) errs.push(`${w}: the right reason names the wrong model`);
      if (!close(A('k'), lin ? d[0] : r[0], 1e-9, 1e-9)) errs.push(`${w}: the constant is wrong`);
      if (!close(A('next'), lin ? ys[3] + d[0] : ys[3] * r[0], 1e-9, 1e-9)) errs.push(`${w}: the next value is wrong`);
      if (!new RegExp(`g\\(${xs[3] + h}\\)`).test(S.next.label)) errs.push(`${w}: the next x is not one step on`);
    } else if (p.type === 'model') {
      const [a, yk, k] = [...p.text.matchAll(/y = (-?[\d.]+)\$/g)].map(m => Number(m[1])).concat(Number(/at \$x = (\d+)\$\./.exec(p.text)[1]));
      const B = Math.exp(Math.log(yk / a) / k), t = Number(/x = (\d+)\$\. \(/.exec(S.pred.label)[1]);
      if (A('a') !== a) errs.push(`${w}: a is wrong`);
      if (!close(A('b'), B, 1e-12)) errs.push(`${w}: b is wrong`);
      if (!close(A('pred'), a * B ** t, 1e-12)) errs.push(`${w}: the prediction is wrong`);
    } else if (p.type === 'inverse') {
      const m = /\$\((-?\d+), ([^)]*)\)\$ is on the graph of \$y = (\d+)\^x\$/.exec(p.text), k = Number(m[1]), N = texNum(m[2]), b = Number(m[3]);
      if (!close(N, b ** k, 1e-12)) errs.push(`${w}: the point is not on y = ${b}^x`);
      if (!close(A('lx'), N, 1e-12) || A('ly') !== k) errs.push(`${w}: the mirrored point is wrong`);
      const v = /\\log_\{(\d+)\} (.*)\$ exactly/.exec(S.val.label), arg = texNum(v[2]);
      if (!close(A('val'), Math.log(arg) / Math.log(Number(v[1])), 1e-9, 1e-9)) errs.push(`${w}: the log value is wrong`);
    } else if (p.type === 'rules') {
      const [pp, qq] = [...p.text.matchAll(/= (-?[\d.]+)\$/g)].map(m => Number(m[1]));
      // pick numbers P, Q with these logs (base 2) and evaluate the asked expression directly
      const P = 2 ** pp, Q = 2 ** qq, lg = x => Math.log2(x);
      if (S.pow) { const m = Number(/P\^\{(\d+)\}\$\.$/.exec(S.pow.label)[1]); if (!close(A('pow'), lg(P ** m), 1e-9, 1e-9)) errs.push(`${w}: the power rule value is wrong`); }
      const lab = S.comb.label; let want;
      let mm = /\(P\^\{(\d+)\} Q\)/.exec(lab);
      if (mm) want = lg(P ** Number(mm[1]) * Q);
      else if ((mm = /\\frac\{P\^\{(\d+)\}\}\{Q\}/.exec(lab))) want = lg(P ** Number(mm[1]) / Q);
      else if (/Q\\sqrt\{P\}/.test(lab)) want = lg(Q * Math.sqrt(P));
      if (want === undefined || !close(A('comb'), want, 1e-9, 1e-9)) errs.push(`${w}: the combined log is wrong`);
    } else if (p.type === 'semilog') {
      const [x0, y0, x1, y1] = nums(/line through (.*)\.$/.exec(p.text)[1]);
      const m = (y1 - y0) / (x1 - x0);
      if (x0 !== 0) errs.push(`${w}: the first point is not the intercept`);
      if (!close(A('m'), m, 1e-9, 1e-12) || !close(A('b'), 10 ** m, 1e-9) || !close(A('a'), 10 ** y0, 1e-9)) errs.push(`${w}: the semi-log model is wrong`);
    } else errs.push(`${w}: unknown kind ${p.type}`);
  };
  sweep(data, errs, (r, c, t) => model.generate(r, c, t), recheck);
  return errs;
}
