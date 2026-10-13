/* Validator for physics/data/tools/lab-design.json (Lab design, the
   Experimental Design and Analysis trainer), run by
   scripts/check-apphys-content.mjs. OWNED BY THIS TOOL ONLY.
   300 seeded problems per context from ApPhysMath.labDesign.generate (the
   code the page runs), each checked by _drills.mjs and then recomputed here
   without the model: the linearized data from the raw rows, a least-squares
   fit written out again, the target quantity from the slope with the
   physics of each bench (and within 10% of the hidden true value, so the
   noise is realistic, not overwhelming), the chosen graph really straight
   (r² > 0.98) and every other offered graph really curved, the instrument
   and variable keys, and the error scenario's direction checked by
   simulating it on noise-free data. */
import { frame, sweep, close } from './_drills.mjs';
import { runtime } from './_shared.mjs';

const g = 9.8;
const INST = { ramp: ['motion detector', 'motion detector'], pendulum: ['meterstick', 'stopwatch'], spring: ['electronic balance', 'meterstick'], atwood: ['electronic balance', 'motion detector'], pulley: ['electronic balance', 'motion detector'], buoyancy: ['meterstick', 'spring scale'] };
// The linearization each bench needs, written independently of the model: [X(x), Y(y)].
const LIN = { ramp: [x => x * x, y => y], pendulum: [x => x, y => y * y], spring: [x => x, y => y], atwood: [x => x, y => y], pulley: [x => 1 / x, y => 1 / y], buoyancy: [x => x, y => y] };
const TARGET = {
  ramp: (m) => 2 * m, pendulum: (m) => 4 * Math.PI ** 2 / m, spring: (m) => g / m, atwood: (m) => g / m,
  pulley: (m, P) => m * g * P.r ** 2, buoyancy: (m, P) => -m / (g * Math.PI * (P.D / 200) ** 2),
};
const TRUE = { ramp: P => P.a, pendulum: () => g, spring: P => P.k, atwood: P => P.Mt, pulley: P => P.I, buoyancy: P => P.rho };
function lsq(pts) {
  const n = pts.length, mx = pts.reduce((a, p) => a + p[0], 0) / n, my = pts.reduce((a, p) => a + p[1], 0) / n;
  let sxy = 0, sxx = 0, syy = 0;
  for (const [x, y] of pts) { sxy += (x - mx) * (y - my); sxx += (x - mx) ** 2; syy += (y - my) ** 2; }
  const m = sxy / sxx, b = my - m * mx, ssr = pts.reduce((a, [x, y]) => a + (y - (m * x + b)) ** 2, 0);
  return { m, b, r2: 1 - ssr / syy };
}
/* Simulate an error scenario on noise-free data and return the sign of the
   change in the derived quantity (+1 larger, -1 smaller, 0 unchanged). */
function errorEffect(exp, id, P, xs, truth) {
  const lin = LIN[exp], base = TARGET[exp](lsq(xs.map(x => [lin[0](x), lin[1](truth(x))])).m, P);
  let pts, Pd = P;
  const T = (f) => xs.map(x => { const [X, Y] = f(x); return [lin[0](X), lin[1](Y)]; });
  switch (`${exp}:${id}`) {
    case 'ramp:zero': pts = T(x => [x, truth(x) + 0.05]); break;
    case 'ramp:cal': pts = T(x => [x, truth(x) * 1.03]); break;
    case 'ramp:angle': pts = T(x => [x, truth(x)]); break;
    case 'pendulum:top': pts = T(x => [x - 0.02, truth(x)]); break;
    case 'pendulum:big': pts = T(x => [x, 2 * Math.PI * Math.sqrt(x / g) * (1 + (Math.PI / 4) ** 2 / 16 + 11 * (Math.PI / 4) ** 4 / 3072)]); break;
    case 'pendulum:nine': pts = T(x => [x, truth(x) * 0.9]); break;
    case 'spring:mark': pts = T(x => [x, truth(x) - 0.02]); break;
    case 'spring:limit': pts = T(x => [x, truth(x) * (x > 0.2 ? 1.15 : 1)]); break;
    case 'spring:read': pts = T(x => [x, truth(x) * 1.05]); break;
    case 'atwood:fric': pts = T(x => [x, (x * g - 0.02) / P.Mt]); break;
    case 'atwood:det': pts = T(x => [x, truth(x) * 0.97]); break;
    case 'atwood:hanger': pts = T(x => [x - 0.005, truth(x)]); break;
    case 'pulley:rim': pts = T(x => [x, truth(x)]); Pd = { ...P, r: P.r * 2 }; break;
    case 'pulley:det': pts = T(x => [x, truth(x) * 1.02]); break;
    case 'pulley:axle': pts = T(x => [x, (x * g - 0.01) / (x + P.I / P.r ** 2)]); break;
    case 'buoyancy:zero': pts = T(x => [x, truth(x) + 0.2]); break;
    case 'buoyancy:diam': pts = T(x => [x, truth(x)]); Pd = { ...P, D: P.D * 0.9 }; break;
    case 'buoyancy:rise': pts = T(x => [x, P.m * g - P.rho * g * Math.PI * (P.D / 200) ** 2 * x * 1.08]); break;
    default: return null;
  }
  const v = TARGET[exp](lsq(pts).m, Pd), d = (v - base) / Math.abs(base);
  return Math.abs(d) < 1e-6 ? 0 : d > 0 ? 1 : -1;
}

export function check(data, map) {
  const errs = [];
  frame(data, 'lab-design', 'simulator', map, errs);
  const { M, model } = runtime('lab-design');
  if (!model || typeof model.generate !== 'function') { errs.push('physics/assets/tools/math/lab-design.js does not register ApPhysMath.labDesign with a generate()'); return errs; }
  for (const c of data.contexts || []) {
    const e = model.EXPS[c.exp];
    if (!e) { errs.push(`context ${c.id}: unknown experiment "${c.exp}"`); continue; }
    if (c.topic !== e.topic) errs.push(`context ${c.id}: topic "${c.topic}" but the experiment's physics is taught in "${e.topic}"`);
    // Every error scenario's stated effect matches a simulation of it.
    const P = e.params(M.rng(7)), xs = model.settings(e, 7);
    for (const er of e.errors) {
      const sign = errorEffect(c.exp, er.id, P, xs, x => e.truth(P, x));
      const want = { 0: 1, 1: -1, 2: 0 }[er.effect];
      if (sign === null) errs.push(`context ${c.id}: error scenario "${er.id}" has no independent simulation here`);
      else if (sign !== want) errs.push(`context ${c.id}: error "${er.id}" says ${['too large', 'too small', 'unchanged'][er.effect]}, the simulation gives ${sign > 0 ? 'too large' : sign < 0 ? 'too small' : 'unchanged'}`);
    }
  }
  sweep(data, errs, (r, c) => model.generate(r, c), (p, c, w) => {
    const bad = (cond, msg) => { if (cond) errs.push(`${w}: ${msg}`); };
    const v = p.values, exp = c.exp, step = k => p.steps.find(s => s.key === k), lin = LIN[exp];
    bad(!/g = 9\.8 m\/s²/.test(p.text), 'the text must state g = 9.8 m/s²');
    bad(!/\?\s*<\/p>\s*$/.test(p.text), 'the text must end with the question');
    bad(v.rows.length < 6, 'fewer than 6 data points');
    const pts = v.rows.map(([x, y]) => [lin[0](x), lin[1](y)]), f = lsq(pts);
    bad(!close(step('slope').cell.answer, f.m, 1e-9), `slope ${step('slope').cell.answer}, recomputed ${f.m}`);
    bad(f.r2 < 0.98, `the linearized data are not straight enough (r² ${f.r2.toFixed(4)})`);
    const t = TARGET[exp](f.m, v.P);
    bad(!close(step('target').cell.answer, t, 1e-9), `target ${step('target').cell.answer}, recomputed ${t}`);
    bad(Math.abs(t - TRUE[exp](v.P)) > 0.10 * Math.abs(TRUE[exp](v.P)), `the fit gives ${t}, more than 10% from the true ${TRUE[exp](v.P)}: too noisy`);
    // the instrument key names the two right instruments, in order
    const inst = step('inst'), key = inst.options[inst.correct];
    bad(!key.includes(INST[exp][0]) || key.indexOf(INST[exp][0]) > key.indexOf(INST[exp][1], key.indexOf(',')), 'the instrument key is wrong');
    bad(inst.options.slice(1).some(o => o === key), 'a distractor equals the key');
    bad(step('iv').correct !== 0 || step('plot').correct !== 0, 'the variable or plot key moved');
    // the offered plots: the key is straight on noise-free data, every distractor curved
    const e = model.EXPS[exp], xs = model.settings(e, 7), clean = xs.map(x => [x, e.truth(v.P, x)]);
    e.plots.forEach(pl => {
      const q = clean.map(([x, y]) => [pl.X(x), pl.Y(y)]), r2 = lsq(q).r2;
      if (pl.linear) bad(r2 < 0.99999, `plot ${pl.id} is offered as straight but r² = ${r2}`);
      else {
        // curved: the residuals show a systematic bow (the middle points off the chord)
        const ff = lsq(q), res = q.map(([X, Y]) => Y - (ff.m * X + ff.b)), span = Math.max(...q.map(z => z[1])) - Math.min(...q.map(z => z[1]));
        bad(Math.max(...res.map(Math.abs)) < 0.01 * span, `plot ${pl.id} is offered as curved but is nearly straight`);
      }
    });
    const er = e.errors[v.err];
    bad(step('error').correct !== er.effect, 'the error key does not match the scenario');
  });
  return errs;
}
