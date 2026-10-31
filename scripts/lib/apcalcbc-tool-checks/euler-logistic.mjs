/* Validator for calculus-bc/data/tools/euler-logistic.json (Euler and logistic), run by
   scripts/check-apcalcbc-content.mjs. OWNED BY THIS TOOL ONLY (builder T3).
   check(data, map) -> problems. It regenerates 300 problems per context and
   kind with the model the page runs (ApCalcMath.eulerLogistic) and recomputes
   every key from the givens, never through the model: the equation is parsed
   by ApCalcExpr from the problem's own string, Euler's table is rebuilt by a
   loop here, the true solution under an over/under question by this file's
   own Runge-Kutta, d²y/dx² by numerical implicit differentiation, and the
   logistic numbers by root-finding and maximising the parsed rate. */
import { frame, sweep, close } from '../apcalc-tool-checks/_drills.mjs';
import { runtime } from './_shared.mjs';

const KINDS = ['euler', 'model', 'overunder', 'logistic'];
const strip = s => String(s).replace(/<annotation[\s\S]*?<\/annotation>/g, '').replace(/<[^>]+>/g, '').replace(/[−–]/g, '-').replace(/\s+/g, ' ').trim();

/* The true y(x1), RK4 with 4000 steps (independent of the model's rk4). */
function trueY(f, x0, y0, x1) {
  const N = 4000, h = (x1 - x0) / N; let x = x0, y = y0;
  for (let i = 0; i < N; i++) {
    const a = f(x, y), b = f(x + h / 2, y + h * a / 2), c = f(x + h / 2, y + h * b / 2), d = f(x + h, y + h * c);
    y += h * (a + 2 * b + 2 * c + d) / 6; x = x0 + (i + 1) * h;
  }
  return y;
}

export function check(data, map) {
  const errs = [];
  frame(data, 'euler-logistic', 'simulator', map, errs);
  const { M, model } = runtime('euler-logistic');
  if (!model) { errs.push('no model registered (ApCalcMath.eulerLogistic)'); return errs; }
  if (model.stub) { errs.push('the model is still the Phase 0 stub (calculus-bc/assets/tools/math/euler-logistic.js)'); return errs; }
  for (const c of data.contexts || []) if (!KINDS.includes(c.kind)) errs.push(`context ${c.id}: kind "${c.kind}" is not one of ${KINDS.join(', ')}`);
  const f2 = s => { const g = M.fn(s, ['x', 'y']); return (x, y) => g({ x, y }); };
  const recheck = (p, ctx, w) => {
    const bad = m => errs.push(`${w}: ${m}`);
    const step = k => p.steps.find(s => s.key === k);
    if (p.type !== ctx.kind) bad(`asked for ${ctx.kind}, got ${p.type}`);
    // the equation the student reads is the one keyed: no number in it needs more than 6 decimals
    for (const t of String(p.de).match(/\d*\.\d+/g) || []) if (t.split('.')[1].length > 6) bad(`coefficient ${t} cannot be printed exactly`);
    if (p.type === 'euler' || p.type === 'model') {
      const F = p.fig, f = f2(p.de);
      let x = F.x0, y = F.y0;
      for (let i = 0; i < F.n; i++) {
        const m = f(x, y), sm = step('m' + i), sy = step('y' + (i + 1));
        if (!sm || !close(sm.cell.answer, m, 1e-9, 1e-9)) bad(`slope at step ${i + 1}: keyed ${sm && sm.cell.answer}, the equation gives ${m}`);
        y = y + m * F.h; x = F.x0 + (i + 1) * F.h;
        if (!sy || !close(sy.cell.answer, y, 1e-9, 1e-9)) bad(`y after step ${i + 1}: keyed ${sy && sy.cell.answer}, Euler gives ${y}`);
      }
      if (p.steps.length !== 2 * F.n) bad(`${p.steps.length} steps for ${F.n} Euler steps`);
      // the question asks for the value at x0 + n h
      const xn = +(F.x0 + F.n * F.h).toFixed(9), q = strip(p.text);
      if (!q.includes(String(xn))) bad(`the question does not ask for the value at ${xn}`);
      if (!q.includes(`${F.n} steps`)) bad('the question does not state the number of steps');
    }
    if (p.type === 'overunder') {
      const F = p.fig, f = f2(p.de);
      const m = f(F.x0, F.y0), y1 = F.y0 + m * F.h;
      if (!close(step('e1').cell.answer, y1, 1e-9, 1e-9)) bad(`one Euler step: keyed ${step('e1').cell.answer}, want ${y1}`);
      const key = f2(step('d2').cell.expr.answer);
      for (const [x, y] of [[0.3, 0.7], [-1.1, 0.4], [1.3, -0.8], [F.x0, F.y0]]) {
        const h = 1e-5, fx = (f(x + h, y) - f(x - h, y)) / (2 * h), fy = (f(x, y + h) - f(x, y - h)) / (2 * h), want = fx + fy * f(x, y);
        if (!close(key(x, y), want, 1e-5, 1e-6)) bad(`d2y/dx2 key at (${x}, ${y}) is ${key(x, y)}, implicit differentiation gives ${want}`);
      }
      const v = key(F.x0, F.y0);
      if (!close(step('d2v').cell.answer, v, 1e-9, 1e-9)) bad('d2y/dx2 at the point');
      // the sign of d2y/dx2 holds along the true solution over the whole step
      for (let i = 0; i <= 20; i++) { const xx = F.x0 + F.h * i / 20, yy = i ? trueY(f, F.x0, F.y0, xx) : F.y0; if (Math.sign(key(xx, yy)) !== Math.sign(v)) { bad(`d2y/dx2 changes sign on the step at x = ${xx}`); break; } }
      const yt = trueY(f, F.x0, F.y0, F.x0 + F.h), under = yt > y1;
      if (Math.abs(yt - y1) < 1e-6) bad('the Euler value equals the true value');
      const c = strip(step('ou').options[step('ou').correct]);
      if (!(under ? /^An underestimate/ : /^An overestimate/).test(c)) bad(`keyed "${c}" but the true value ${yt} is ${under ? 'above' : 'below'} the Euler value ${y1}`);
      if (!(v > 0 ? /concave up/ : /concave down/).test(c)) bad(`keyed "${c}" for d2y/dx2 = ${v}`);
    }
    if (p.type === 'logistic') {
      const F = p.fig, rate = M.fn(p.de, ['P']);
      // carrying capacity: the positive zero of the rate, by bisection
      let lo = 1e-6, hi = 1e6;
      if (!(rate(lo) > 0 && rate(hi) < 0)) bad('the rate is not positive for small P and negative for large P');
      for (let i = 0; i < 200; i++) { const mid = (lo + hi) / 2; if (rate(mid) > 0) lo = mid; else hi = mid; }
      const L = (lo + hi) / 2;
      if (!close(step('cap').cell.answer, L, 1e-6, 1e-6)) bad(`carrying capacity keyed ${step('cap').cell.answer}, the rate is 0 at ${L}`);
      if (!close(step('lim').cell.answer, L, 1e-6, 1e-6)) bad('the limit is not the carrying capacity');
      if (!(F.P0 > 0)) bad('P(0) must be positive');
      // fastest growth: maximise the rate on (0, L) by golden section
      let a = 0, b = L; const gr = (Math.sqrt(5) - 1) / 2;
      for (let i = 0; i < 200; i++) { const c1 = b - gr * (b - a), c2 = a + gr * (b - a); if (rate(c1) > rate(c2)) b = c2; else a = c1; }
      const Pm = (a + b) / 2;
      if (!close(step('half').cell.answer, Pm, 1e-6, 1e-4)) bad(`fastest growth keyed at ${step('half').cell.answer}, the rate peaks at ${Pm}`);
      if (!close(step('rate').cell.answer, rate(Pm), 1e-6, 1e-6)) bad(`largest rate keyed ${step('rate').cell.answer}, want ${rate(Pm)}`);
      // the shape at t = 0: dP/dt and d2P/dt2 = rate'(P) rate(P)
      const r0 = rate(F.P0), hh = 1e-4 * Math.max(1, F.P0), d2 = (rate(F.P0 + hh) - rate(F.P0 - hh)) / (2 * hh) * r0;
      const want = (r0 > 0 ? 'increasing' : 'decreasing') + ' and concave ' + (d2 > 0 ? 'up' : 'down');
      const got = strip(step('shape').options[step('shape').correct]);
      if (got !== want) bad(`shape keyed "${got}", want "${want}"`);
    }
  };
  sweep(data, errs, (r, c, t) => model.generate(r, c, t), recheck, c => [c.kind]);
  return errs;
}
