/* Validator for calculus-bc/data/tools/polar-lab.json (Polar lab), run by
   scripts/check-apcalcbc-content.mjs. OWNED BY THIS TOOL ONLY (builder T2).
   check(data, map) -> problems.

   1. The frame (AB's frame check, BC map), each context's kind and topic, each listed curve or pair.
   2. The Explore curves: dr/dθ by central differences of the printed string; each region's
      area against a fine midpoint sum of ½r²; each pair's meeting angles (R = r there, R ≥ r
      between) and its exact area against a midpoint sum of ½(R² − r²).
   3. 300 seeded problems per context (_drills.mjs sweep). Every key is recomputed here from
      the givens (the strings the problem prints), never through the model: x = r cos θ,
      dr/dθ and dy/dx by central differences, areas by fine midpoint sums, the θ limits from
      the zeros of r, the choice keys from those numbers. */
import { frame, sweep, close } from '../apcalc-tool-checks/_drills.mjs';
import { runtime, topicOk } from './_shared.mjs';

const KINDS = ['coords', 'area', 'between'];
const TOPIC = { coords: 'polar-derivatives', area: 'polar-area', between: 'polar-area-between' };
const d1 = (f, t, h = 1e-5) => (f(t + h) - f(t - h)) / (2 * h);
function mid(f, a, b, n = 20000) { let s = 0; const h = (b - a) / n; for (let i = 0; i < n; i++) s += f(a + (i + 0.5) * h); return s * h; }
const plain = s => { const m = /<span class="sr-only">([\s\S]*?)<\/span>/.exec(s); return (m ? m[1] : String(s).replace(/<[^>]+>/g, '')).replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&'); };
const halfR2 = r => t => r(t) * r(t) / 2;

export function curveProblems(model, Expr) {
  const errs = [], F = s => Expr.fn(s, ['theta']);
  for (const id of model.ORDER) {
    const c = model.CURVES[id], r = F(c.r), dr = F(c.dr);
    for (let i = 1; i < 40; i++) { const t = i * 0.157; if (!close(dr(t), d1(r, t), 1e-6, 1e-6)) { errs.push(`curve ${id}: dr/dθ is not the derivative at θ = ${t}`); break; } }
    for (const g of c.regions) {
      const [a, b] = model.limits(g).map(x => x.v), want = mid(halfR2(r), a, b);
      if (!close(model.area(c, a, b), want, 1e-6, 1e-6)) errs.push(`curve ${id} region ${g.id}: area ${model.area(c, a, b)}, midpoint sum ${want}`);
      if (g.id === 'petal' || g.id === 'inner') {
        if (Math.abs(r(a)) > 1e-9 || Math.abs(r(b)) > 1e-9) errs.push(`curve ${id} region ${g.id}: r is not 0 at both ends`);
        for (let i = 1; i < 200; i++) { const t = a + (b - a) * i / 200; if (Math.abs(r(t)) < 1e-6) { errs.push(`curve ${id} region ${g.id}: r = 0 inside the interval at θ = ${t}`); break; } }
      }
    }
  }
  for (const id of model.PORDER) {
    const c = model.PAIRS[id], R = F(c.R), r = F(c.r), a = c.a[0] * Math.PI / c.a[1], b = c.b[0] * Math.PI / c.b[1];
    if (!close(F(c.dR)(0.7), d1(R, 0.7), 1e-6, 1e-6) || !close(F(c.dr)(0.7), d1(r, 0.7), 1e-6, 1e-6)) errs.push(`pair ${id}: a derivative is wrong`);
    if (Math.abs(R(a) - r(a)) > 1e-9 || Math.abs(R(b) - r(b)) > 1e-9) errs.push(`pair ${id}: the curves do not meet at the ends of the interval`);
    for (let i = 1; i < 200; i++) { const t = a + (b - a) * i / 200; if (R(t) < r(t) - 1e-12) { errs.push(`pair ${id}: the outer curve is inside at θ = ${t}`); break; } }
    const want = mid(t => (R(t) ** 2 - r(t) ** 2) / 2, a, b);
    if (!close(c.exact, want, 1e-6, 1e-6)) errs.push(`pair ${id}: exact area ${c.exact}, midpoint sum ${want}`);
    if (!close(model.area(c, a, b), want, 1e-6, 1e-6)) errs.push(`pair ${id}: the model's area disagrees`);
  }
  return errs;
}

export function check(data, map) {
  const errs = [];
  frame(data, 'polar-lab', 'simulator', map, errs);
  const { M, Expr, model } = runtime('polar-lab');
  if (!model) { errs.push('no model registered (ApCalcMath.polarLab)'); return errs; }
  if (model.stub) { errs.push('the model is still the Phase 0 stub (calculus-bc/assets/tools/math/polar-lab.js)'); return errs; }
  for (const c of data.contexts || []) {
    if (!KINDS.includes(c.kind)) errs.push(`context ${c.id}: kind must be one of ${KINDS.join(', ')}`);
    else if (c.topic !== TOPIC[c.kind]) errs.push(`context ${c.id}: a ${c.kind} problem belongs to topic ${TOPIC[c.kind]}`);
  }
  for (const c of data.curves || []) {
    if (!model.CURVES[c.id] && !model.PAIRS[c.id]) errs.push(`curves: unknown curve "${c.id}"`);
    else if (!topicOk(c.topic, map)) errs.push(`curves: ${c.id} has unknown topic "${c.topic}"`);
    else if (model.PAIRS[c.id] && c.topic !== 'polar-area-between') errs.push(`curves: ${c.id} is a pair, so it belongs to polar-area-between`);
  }
  errs.push(...curveProblems(model, Expr));

  const F = s => Expr.fn(s, ['theta']);
  const S = (p, k) => p.steps.find(s => s.key === k), ans = (p, k) => S(p, k).cell.answer, first = (p, k) => plain(S(p, k).options[0]);
  sweep(data, errs, (r, c, t) => model.generate(r, c, t), (p, c, w) => {
    const v = p.values, g = v.given;
    if (p.topic !== c.topic) errs.push(`${w}: topic ${p.topic}, context says ${c.topic}`);
    if (p.type !== c.kind) errs.push(`${w}: kind ${p.type}, context says ${c.kind}`);
    if (p.type === 'coords') {
      const r = F(g.r), th = v.th, X = t => r(t) * Math.cos(t), Y = t => r(t) * Math.sin(t);
      const dr = d1(r, th), slope = d1(Y, th) / d1(X, th);
      if (!close(ans(p, 'x'), X(th), 1e-9, 1e-9)) errs.push(`${w}: x key ${ans(p, 'x')}, r cos θ = ${X(th)}`);
      if (!close(ans(p, 'dr'), dr, 1e-6, 1e-6)) errs.push(`${w}: dr/dθ key ${ans(p, 'dr')}, differences give ${dr}`);
      if (!close(ans(p, 'dydx'), slope, 1e-6, 1e-6)) errs.push(`${w}: dy/dx key ${ans(p, 'dydx')}, differences give ${slope}`);
      // toward or away: the distance |r| grows or shrinks
      const grows = Math.abs(r(th + 1e-4)) > Math.abs(r(th - 1e-4));
      if (/^Away/.test(first(p, 'move')) !== grows) errs.push(`${w}: the toward/away key disagrees with how |r| changes`);
    }
    if (p.type === 'area') {
      const r = F(g.r), A = mid(halfR2(r), v.a, v.b);
      if (!close(ans(p, 'area'), A, 1e-6, 1e-6)) errs.push(`${w}: area key ${ans(p, 'area')}, midpoint sum ${A}`);
      if (v.fam === 'petal') {
        if (Math.abs(r(v.a)) > 1e-9 || Math.abs(r(v.b)) > 1e-9) errs.push(`${w}: r is not 0 at the keyed limits`);
        for (let i = 1; i < 400; i++) if (r(v.a + (v.b - v.a) * i / 400) <= 0) { errs.push(`${w}: r is not positive across the keyed petal`); break; }
      }
      if (v.fam === 'loop') for (let i = 0; i <= 400; i++) if (r(2 * Math.PI * i / 400) <= 0) { errs.push(`${w}: r is not positive, so the limaçon has an inner loop`); break; }
      if (!/^(½|1\/2) ∫/.test(first(p, 'setup'))) errs.push(`${w}: the keyed setup has no ½ (${first(p, 'setup')})`);
      if (!/²/.test(first(p, 'setup'))) errs.push(`${w}: the keyed setup does not square r (${first(p, 'setup')})`);
      if (v.fam === 'calc' && !M.three(ans(p, 'area'), A)) errs.push(`${w}: the area key fails the three-decimal rule`);
    }
    if (p.type === 'between') {
      const R = F(g.R), r = F(g.r);
      if (Math.abs(R(v.a) - r(v.a)) > 1e-9 || Math.abs(R(v.b) - r(v.b)) > 1e-9) errs.push(`${w}: the curves do not meet at the limits`);
      const m = ans(p, 'meet');
      if (!(m > 0) || Math.abs(R(m) - r(m)) > 1e-9) errs.push(`${w}: the curves do not meet at the keyed angle ${m}`);
      for (let i = 1; i < 2000; i++) { const t = m * i / 2000; if (Math.abs(R(t) - r(t)) < 1e-9) { errs.push(`${w}: the curves meet earlier, at θ = ${t}`); break; } }
      for (let i = 1; i < 400; i++) { const t = v.a + (v.b - v.a) * i / 400; if (R(t) < r(t)) { errs.push(`${w}: the keyed outer curve is inside at θ = ${t}`); break; } }
      const A = mid(t => (R(t) ** 2 - r(t) ** 2) / 2, v.a, v.b);
      if (!close(ans(p, 'area'), A, 1e-6, 1e-6)) errs.push(`${w}: area key ${ans(p, 'area')}, midpoint sum ${A}`);
      if (!/^(½|1\/2) ∫/.test(first(p, 'setup')) || (first(p, 'setup').match(/²/g) || []).length < 2) errs.push(`${w}: the keyed setup is not ½∫(R² − r²) (${first(p, 'setup')})`);
    }
  });
  return errs;
}
