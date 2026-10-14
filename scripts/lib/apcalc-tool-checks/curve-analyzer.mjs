/* Validator for calculus/data/tools/curve-analyzer.json (Curve analyzer), run
   by scripts/check-apcalc-content.mjs. OWNED BY THIS TOOL ONLY.
   check(data, map) -> problems.

   1. The frame, each context's kind, the curve and scene lists.
   2. The Explore curves: f′ and f″ against central differences; every sign
      change of f′ (and of f″) on a fine grid is a listed critical point
      (inflection point) and nothing else is; each extremum's kind from the
      sign of f′ on each side; the absolute extrema against a fine grid of
      f on the closed interval. The optimization scenes: the derivative by
      central differences, the best value against a fine grid.
   3. 300 seeded problems per context (_drills.mjs sweep), every key
      recomputed here by scanning and fine grids, not the model's formulas. */
import { frame, sweep, close } from './_drills.mjs';
import { runtime, topicOk } from './_shared.mjs';

const KINDS = ['incdec', 'extrema', 'candidates', 'concavity', 'fgraph', 'optimize'];
const d1 = (f, x, h = 1e-5) => (f(x + h) - f(x - h)) / (2 * h);
/* x where g changes sign on [a, b], scanning n steps (a zero at a grid point counts once). */
function flips(g, a, b, n = 6000) {
  const out = []; let last = 0, lastX = a;
  for (let i = 0; i <= n; i++) {
    const x = a + (b - a) * i / n, v = g(x);
    if (!isFinite(v)) continue;
    const s = Math.abs(v) < 1e-12 ? 0 : Math.sign(v);
    if (s && last && s !== last) out.push((x + lastX) / 2);
    if (s) { last = s; lastX = x; }
  }
  return out;
}
const near = (list, x, tol) => list.some(z => Math.abs(z - x) < tol);
const strip = s => String(s).replace(/<annotation[\s\S]*?<\/annotation>/g, '').replace(/<[^>]+>/g, '').replace(/−/g, '-');

export function curveProblems(model) {
  const errs = [];
  for (const id of model.ORDER) {
    const c = model.CURVES[id], [a, b] = c.dom, und = c.undef || [];
    for (let i = 1; i < 60; i++) {
      const x = a + (b - a) * i / 60;
      if (und.some(u => Math.abs(u - x) < 0.05)) continue;
      if (!close(c.fp(x), d1(c.f, x), 1e-6, 1e-6)) { errs.push(`curve ${id}: f′ is not the derivative of f at x = ${x}`); break; }
      if (!close(c.fpp(x), d1(c.fp, x), 1e-5, 1e-5)) { errs.push(`curve ${id}: f″ is not the derivative of f′ at x = ${x}`); break; }
    }
    const A = model.analyze(c), tol = (b - a) / 3000;
    const fpFlips = flips(c.fp, a, b), fppFlips = flips(c.fpp, a, b);
    for (const z of fpFlips) if (!near(A.crit.map(k => k.x), z, tol)) errs.push(`curve ${id}: f′ changes sign near ${z}, not a listed critical point`);
    for (const k of A.crit) {
      const l = c.fp(k.x - 1e-3), r = c.fp(k.x + 1e-3), want = l > 0 && r < 0 ? 'max' : l < 0 && r > 0 ? 'min' : 'none';
      if (k.kind !== want) errs.push(`curve ${id}: x = ${k.x} is called ${k.kind}, the signs of f′ say ${want}`);
      if (!k.undef && !(Math.abs(c.fp(k.x)) < 1e-9)) errs.push(`curve ${id}: f′(${k.x}) is not 0`);
      if (k.undef && isFinite(c.fp(k.x)) && Math.abs(c.fp(k.x)) < 1e6) errs.push(`curve ${id}: f′(${k.x}) is defined, yet listed as undefined`);
    }
    if (A.infl.length !== fppFlips.length || fppFlips.some(z => !near(A.infl, z, tol))) errs.push(`curve ${id}: inflection points ${A.infl.join(', ')}, f″ changes sign near ${fppFlips.map(z => z.toFixed(4)).join(', ')}`);
    let gmax = -Infinity, gmin = Infinity;
    for (let i = 0; i <= 20000; i++) { const y = c.f(a + (b - a) * i / 20000); if (y > gmax) gmax = y; if (y < gmin) gmin = y; }
    // no grid point beats the candidates, and the grid comes close to them
    if (gmax > A.absMax.y + 1e-9 || gmin < A.absMin.y - 1e-9 || A.absMax.y - gmax > 0.05 || gmin - A.absMin.y > 0.05) errs.push(`curve ${id}: candidates test gives ${A.absMax.y}, ${A.absMin.y}; a grid gives ${gmax}, ${gmin}`);
    if (A.absMax.y !== c.f(A.absMax.x) || A.absMin.y !== c.f(A.absMin.x)) errs.push(`curve ${id}: an absolute extremum is not f at its point`);
    for (const f of model.features(c)) if (!f.text || /NaN|undefined/.test(f.text.replace(/is undefined/g, ''))) errs.push(`curve ${id}: a feature has no usable sentence`);
  }
  for (const id of model.SORDER) {
    const s = model.SCENES[id], [a, b] = s.dom;
    for (let i = 1; i < 40; i++) { const x = a + (b - a) * i / 40; if (!close(s.dobj(x), d1(s.obj, x), 1e-6, 1e-6)) { errs.push(`scene ${id}: the derivative is wrong at ${x}`); break; } }
    let bx = a, by = s.obj(a);
    for (let i = 0; i <= 40000; i++) { const x = a + (b - a) * i / 40000, y = s.obj(x); if (s.goal === 'max' ? y > by : y < by) { bx = x; by = y; } }
    if (Math.abs(bx - s.best) > (b - a) / 20000) errs.push(`scene ${id}: best ${s.best}, a grid finds ${bx}`);
  }
  return errs;
}

export function check(data, map) {
  const errs = [];
  frame(data, 'curve-analyzer', 'simulator', map, errs);
  const { M, Expr, model } = runtime('curve-analyzer');
  if (!model || typeof model.generate !== 'function') { errs.push('calculus/assets/tools/math/curve-analyzer.js does not register ApCalcMath.curveAnalyzer with a generate()'); return errs; }
  for (const c of data.contexts || []) if (!KINDS.includes(c.kind)) errs.push(`context ${c.id}: kind must be one of ${KINDS.join(', ')}`);
  for (const id of data.curves || []) if (!model.CURVES[id]) errs.push(`curves: unknown curve "${id}"`);
  for (const s of data.optimize || []) { if (!model.SCENES[s.id]) errs.push(`optimize: unknown scene "${s.id}"`); else if (!topicOk(s.topic, map)) errs.push(`optimize: ${s.id} has unknown topic "${s.topic}"`); }
  errs.push(...curveProblems(model));

  const S = (p, k) => p.steps.find(s => s.key === k), ans = (p, k) => S(p, k).cell.answer, opt0 = (p, k) => strip(S(p, k).options[0]);
  sweep(data, errs, (r, c, t) => model.generate(r, c, t), (p, c, w) => {
    const v = p.values, f = p.fig.f;
    if (p.topic !== c.topic) errs.push(`${w}: topic ${p.topic}, context says ${c.topic}`);
    for (const s of p.steps) if (s.kind === 'choice' && s.correct !== 0) errs.push(`${w}: step ${s.key} key is not the first option`);
    if (p.type === 'incdec') {
      const z = flips(f, v.p - 5, v.q + 5);
      if (!close(ans(p, 'z'), Math.min(...z), 1e-3, 1e-3)) errs.push(`${w}: smaller critical point ${ans(p, 'z')}, scan ${z}`);
      const sg = [f(v.p - 1), f((v.p + v.q) / 2), f(v.q + 1)].map(Math.sign);
      if (sg.join() !== v.sg.join()) errs.push(`${w}: signs of f′ disagree`);
      const inc = opt0(p, 'inc');
      if (sg[1] > 0 !== inc.includes(`(${v.p},${v.q})`)) errs.push(`${w}: the increasing intervals key is wrong (${inc})`);
    }
    if (p.type === 'extrema') {
      const want = v.wk === 'max' ? 1 : -1, l = f(v.want - 1e-3), r = f(v.want + 1e-3);
      if (!(Math.sign(l) === want && Math.sign(r) === -want)) errs.push(`${w}: f′ does not change sign the keyed way at ${v.want}`);
      const ol = f(v.other - 1e-3), orr = f(v.other + 1e-3), ok = ol > 0 && orr < 0 ? 'max' : ol < 0 && orr > 0 ? 'min' : 'none';
      if (ok !== v.ok) errs.push(`${w}: at the other zero the key says ${v.ok}, the signs say ${ok}`);
      if (!close(ans(p, 'x'), v.want, 1e-12)) errs.push(`${w}: the x key is not the extremum`);
    }
    if (p.type === 'candidates') {
      let gmax = -Infinity, gmin = Infinity;
      for (let i = 0; i <= 40000; i++) { const y = f(v.a + (v.b - v.a) * i / 40000); gmax = Math.max(gmax, y); gmin = Math.min(gmin, y); }
      if (!close(ans(p, 'max'), gmax, 1e-7, 1e-7) || !close(ans(p, 'min'), gmin, 1e-7, 1e-7)) errs.push(`${w}: extrema ${ans(p, 'max')}, ${ans(p, 'min')}; grid ${gmax}, ${gmin}`);
      const fp = Expr.fn(S(p, 'fp').cell.expr.answer, ['x']);
      for (const x of [-1.3, 0.4, 2.2]) if (!close(fp(x), d1(f, x), 1e-6, 1e-6)) { errs.push(`${w}: f′ key is not the derivative`); break; }
      const crit = flips(x => d1(f, x), v.a, v.b);
      if (!opt0(p, 'cand').includes(String(v.a)) || !opt0(p, 'cand').includes(String(v.b)) || crit.some(z => !opt0(p, 'cand').includes(String(Math.round(z))))) errs.push(`${w}: the candidates key misses a candidate`);
    }
    if (p.type === 'concavity') {
      const fx = x => v.c.reduce((s, k) => s * x + k, 0), f2 = Expr.fn(S(p, 'f2').cell.expr.answer, ['x']);
      for (const x of [-1.7, 0.3, 1.9]) if (!close(f2(x), d1(y => d1(fx, y, 1e-4), x, 1e-4), 1e-4, 1e-3)) { errs.push(`${w}: f″ key is not the second derivative`); break; }
      const ip = flips(f2, -20, 20, 8000);
      if (ip.length !== v.infl.length || ip.some(z => !near(v.infl, z, 0.01))) errs.push(`${w}: inflection points ${v.infl}, f″ changes sign near ${ip}`);
      if (v.trap && !/^Nowhere/.test(opt0(p, 'where'))) errs.push(`${w}: x⁴-type: the key must be "nowhere"`);
    }
    if (p.type === 'fgraph') {
      const g = x => { const P = v.pts; for (let i = 0; i < P.length - 1; i++) if (x <= P[i + 1][0]) return P[i][1] + (P[i + 1][1] - P[i][1]) * (x - P[i][0]) / (P[i + 1][0] - P[i][0]); return P[P.length - 1][1]; };
      const maxs = flips(g, 0, 8, 8000).filter(z => g(z - 1e-3) > 0 && g(z + 1e-3) < 0);
      if (maxs.length !== v.maxs.length || maxs.some(z => !near(v.maxs, z, 2e-3))) errs.push(`${w}: relative maxima ${v.maxs}, scan ${maxs}`);
      const slope = x => d1(g, x, 1e-6), infl = flips(slope, 0.01, 7.99, 8000);
      if (infl.length !== ans(p, 'infl')) errs.push(`${w}: ${ans(p, 'infl')} inflection points keyed, f′ changes direction ${infl.length} times`);
      if (v.pts.some((q, i) => i && q[1] === v.pts[i - 1][1])) errs.push(`${w}: a flat piece of f′ makes inflection ambiguous`);
    }
    if (p.type === 'optimize') {
      const [a, b] = p.fig.dom; let bx = a, by = f(a);
      for (let i = 0; i <= 40000; i++) { const x = a + (b - a) * i / 40000, y = f(x); if (v.kind === 'can' ? y < by : y > by) { bx = x; by = y; } }
      const xk = ans(p, v.kind === 'can' ? 'r' : 'x'), vk = ans(p, v.kind === 'box' ? 'V' : v.kind === 'fence' ? 'A' : 'S');
      if (Math.abs(xk - bx) > (b - a) / 10000) errs.push(`${w}: best ${xk}, a grid finds ${bx}`);
      if (!close(vk, f(xk), 1e-9)) errs.push(`${w}: the optimal value is not the objective at the best point`);
      const obj = Expr.fn(S(p, 'obj').cell.expr.answer, ['x']);
      for (const x of [a + (b - a) * 0.3, a + (b - a) * 0.6]) if (!close(obj(x), f(x), 1e-9)) { errs.push(`${w}: the objective key disagrees with the figure`); break; }
    }
  });
  return errs;
}
