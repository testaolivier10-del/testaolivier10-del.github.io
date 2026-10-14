/* Validator for calculus/data/tools/slope-fields.json (Slope fields), run by
   scripts/check-apcalc-content.mjs. OWNED BY THIS TOOL ONLY.
   check(data, map) -> problems. It regenerates 300 problems per context and
   kind with the model the page runs (ApCalcMath.slopeFields) and recomputes
   every key a second way: slopes and second derivatives from the equation
   parsed by ApCalcExpr (not the model's closures), solution curves by
   numerical integration against the formulas, particular solutions checked
   by substituting them into the equation, exponential numbers from ln 2. */
import { frame, sweep, close } from './_drills.mjs';
import { runtime } from './_shared.mjs';

const KINDS = ['slopes', 'match', 'sketch', 'separate', 'concavity', 'exp'];
const strip = s => String(s).replace(/<annotation[\s\S]*?<\/annotation>/g, '').replace(/<[^>]+>/g, '');

export function check(data, map) {
  const errs = [];
  frame(data, 'slope-fields', 'simulator', map, errs);
  const { M, model } = runtime('slope-fields');
  if (!model || typeof model.generate !== 'function') { errs.push('calculus/assets/tools/math/slope-fields.js does not register ApCalcMath.slopeFields with a generate()'); return errs; }
  for (const c of data.contexts || []) if (!KINDS.includes(c.kind)) errs.push(`context ${c.id}: kind "${c.kind}" is not one of ${KINDS.join(', ')}`);
  const f2 = s => { const g = M.fn(s, ['x', 'y']); return (x, y) => g({ x, y }); };
  const recheck = (p, ctx, w) => {
    const bad = m => errs.push(`${w}: ${m}`);
    const step = k => p.steps.find(s => s.key === k);
    if (p.type !== ctx.kind) bad(`asked for ${ctx.kind}, got ${p.type}`);
    if (p.type === 'slopes') {
      const f = f2(p.fig.de);
      p.fig.marks.forEach(mk => { const s = step(mk.step); if (!close(s.cell.answer, f(mk.at[0], mk.at[1]), 1e-12, 1e-12)) bad(`slope at ${mk.at} is ${s.cell.answer}, the equation gives ${f(mk.at[0], mk.at[1])}`); });
      if (!model.zerosOn(f, p.fig.zero)) bad('the keyed set of horizontal segments is not where dy/dx = 0');
    }
    if (p.type === 'match') {
      const des = p.fig.des, fs = des.map(f2), t = des.indexOf(p.de);
      if (t < 0 || t !== p.fig.answer || step('mf').correct !== t) bad('the keyed field is not the field of the equation');
      for (let i = 0; i < 4; i++) for (let j = i + 1; j < 4; j++) {
        let diff = 0;
        for (let x = -3; x <= 3; x += 0.5) for (let y = -3; y <= 3; y += 0.5) { const a = fs[i](x, y), b = fs[j](x, y); if (isFinite(a) && isFinite(b)) diff = Math.max(diff, Math.abs(a - b)); }
        if (diff < 0.5) bad(`fields ${i + 1} and ${j + 1} look the same`);
      }
      const T = model.MATCH.find(d => d.s === p.de);
      if (!T || !T.holds(fs[t])) bad('the target feature does not hold for its own field');
      des.forEach((s, i) => { if (i === t) return; const D = model.MATCH.find(d => d.s === s); if (T.holds(fs[i]) || D.holds(fs[t])) bad(`feature of ${s} does not separate it from ${p.de}`); });
    }
    if (p.type === 'sketch') {
      const f = f2(p.fig.de), F = p.fig;
      if (!close(step('skm').cell.answer, f(F.x0, F.y0), 1e-12, 1e-12)) bad('slope at the start point');
      F.xs.forEach((x, i) => { const y = model.rk45(f, F.x0, F.y0, x, { tol: 1e-11 }); if (!close(y, F.truth[i], 1e-6, 1e-6)) bad(`the true solution at x = ${x} is ${y}, keyed ${F.truth[i]}`); });
      if (model.sketchGrade(F, F.truth) !== 0) bad('the true solution is not graded right');
      if (model.sketchGrade(F, F.xs.map(() => F.y0)) === 0) bad('the untouched (flat) sketch is graded right');
      F.xs.forEach((x, i) => [1, -1].forEach(sg => { const ys = F.truth.slice(); ys[i] += sg * 1.3 * F.tol[i]; if (model.sketchGrade(F, ys) === 0) bad(`a point ${sg > 0 ? 'above' : 'below'} tolerance at x = ${x} is graded right`); }));
      // Long-run behavior from the integrator, not from the model's formula.
      const run = model.march(f, F.x0, F.y0, 8, { tol: 1e-11, vmax: 1e12, ylo: -1e6, yhi: 1e6 });
      const yEnd = run.pts[run.pts.length - 1][1], y8 = Math.abs(run.x - 8) < 1e-9 ? yEnd : (yEnd > 0 ? Infinity : -Infinity);
      const far = strip(step('skfar').options[step('skfar').correct]);
      let want;
      if (!isFinite(y8) || Math.abs(y8) > 100) want = y8 > 0 ? /increases without bound/ : /decreases without bound/;
      else if (Math.abs(y8 - 7) < 0.01) want = /line y\s*=\s*x\s*[−-]\s*1/;
      else if (Math.abs(y8 + 9) < 0.01) want = /line y\s*=\s*[−-]x\s*[−-]\s*1/;
      else want = new RegExp('equilibrium y\\s*=\\s*' + String(Math.round(y8)).replace('-', '[−-]') + '\\b');
      if (!want.test(far.replace(/\s+/g, ' '))) bad(`long-run behavior keyed "${far}", integration gives y(8) = ${y8}`);
    }
    if (p.type === 'separate') {
      const sy = step('sepY').cell.expr, Y = M.fn(sy.answer, ['x']), f = f2(p.chk.de);
      if (!close(Y(0), p.chk.y0, 1e-9, 1e-9)) bad(`y(0) = ${Y(0)}, not ${p.chk.y0}`);
      for (const x of [-0.7, -0.2, 0.3, 0.8]) { const d = M.deriv(Y, x), r = f(x, Y(x)); if (!close(d, r, 1e-5, 1e-5)) bad(`the particular solution fails the equation at x = ${x}: y' = ${d}, f = ${r}`); }
      const L = M.fn(p.chk.L, ['y']), Rt = M.fn(p.chk.R, ['x']);
      if (!close(step('sepC').cell.answer, L(p.chk.y0) - Rt(0), 1e-9, 1e-9)) bad('C does not satisfy the integrated equation at the initial point');
      const ie = step('int').cell.expr, v = ie.vars[0], K = M.fn(ie.answer, [v]), g = M.fn(p.chk.integrand, [v]);
      for (const t of [ie.domain[0] + 0.37, (ie.domain[0] + ie.domain[1]) / 2 + 0.21, ie.domain[1] - 0.29]) if (!close(M.deriv(K, t), g(t), 1e-5, 1e-5)) bad(`the antiderivative key is wrong at ${v} = ${t}`);
      for (const m of sy.mistakes) { const Z = M.fn(m.expr, ['x']); const ok = close(Z(0), p.chk.y0, 1e-9, 1e-9) && [-0.6, 0.4].every(x => close(M.deriv(Z, x), f(x, Z(x)), 1e-5, 1e-5)); if (ok) bad(`mistake "${m.expr}" is also a solution`); }
    }
    if (p.type === 'concavity') {
      const f = f2(p.fig.de), key = f2(step('d2').cell.expr.answer), [x1, y1] = p.fig.marks[0].at;
      for (const [x, y] of [[0.3, 0.7], [-1.1, 0.4], [1.3, -0.8], [x1, y1]]) {
        const h = 1e-5, fx = (f(x + h, y) - f(x - h, y)) / (2 * h), fy = (f(x, y + h) - f(x, y - h)) / (2 * h), want = fx + fy * f(x, y);
        if (!close(key(x, y), want, 1e-5, 1e-6)) bad(`d2y/dx2 key at (${x}, ${y}) is ${key(x, y)}, implicit differentiation gives ${want}`);
      }
      const v = key(x1, y1);
      if (!close(step('d2v').cell.answer, v, 1e-9, 1e-9)) bad('d2y/dx2 value at the point');
      const c = strip(step('conc').options[step('conc').correct]);
      if (!(v > 0 ? /^Concave up, so the tangent line there gives an underestimate/ : /^Concave down, so the tangent line there gives an overestimate/).test(c)) bad(`concavity keyed "${c}" for d2y/dx2 = ${v}`);
    }
    if (p.type === 'exp') {
      const F = p.fig, k = (F.grow ? 1 : -1) * Math.log(2) / F.T;
      if (!close(step('expk').cell.answer, k, 1e-12, 0)) bad('k');
      if (!close(F.y0 * Math.exp(k * F.T), F.grow ? 2 * F.y0 : F.y0 / 2, 1e-12, 0)) bad('k does not double or halve in T');
      if (!close(step('expy').cell.answer, F.y0 * Math.pow(2, (F.grow ? 1 : -1) * F.t1 / F.T), 1e-9, 0)) bad('amount at t1');
      const tt = step('expt').cell.answer;
      if (!close(F.y0 * Math.exp(k * tt), F.target, 1e-9, 0) || !(tt > 0)) bad('time to reach the target');
      const de = step('expde');
      if (!/dy\s*\/?\s*dt|dydt/.test(strip(de.options[de.correct]).replace(/\s/g, '')) || !/ky/.test(strip(de.options[de.correct]).replace(/\s/g, ''))) bad('the keyed equation is not dy/dt = ky');
    }
  };
  sweep(data, errs, (r, c, t) => model.generate(r, c, t), recheck);
  return errs;
}
