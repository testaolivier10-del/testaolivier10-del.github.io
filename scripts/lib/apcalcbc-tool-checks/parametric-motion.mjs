/* Validator for calculus-bc/data/tools/parametric-motion.json (Parametric motion), run by
   scripts/check-apcalcbc-content.mjs. OWNED BY THIS TOOL ONLY (builder T2).
   check(data, map) -> problems.

   1. The frame (AB's frame check, BC map), each context's kind and topic, each listed path.
   2. The Explore paths: x' and x'' (and y', y'') by central differences of the strings the
      page prints; in velocity mode, the position against the start plus a fine midpoint sum;
      the distance against a midpoint sum of the speed; every marked vertical or horizontal
      tangent is a zero of the right component.
   3. 300 seeded problems per context (_drills.mjs sweep). Every key is recomputed here from
      the givens (the expression strings the problem prints), never through the model:
      derivatives by central differences, integrals by fine midpoint sums, the choice keys
      from those numbers. */
import { frame, sweep, close } from '../apcalc-tool-checks/_drills.mjs';
import { runtime, topicOk } from './_shared.mjs';

const KINDS = ['slope', 'second', 'length', 'vector', 'position', 'plane'];
const TOPIC = { slope: 'parametric-derivatives', second: 'parametric-second-derivatives', length: 'parametric-arc-length', vector: 'vector-derivatives', position: 'vector-integrals', plane: 'planar-motion' };
const d1 = (f, t, h = 1e-5) => (f(t + h) - f(t - h)) / (2 * h);
const d2 = (f, t, h = 1e-4) => (f(t + h) - 2 * f(t) + f(t - h)) / (h * h);
function mid(f, a, b, n = 20000) { let s = 0; const h = (b - a) / n; for (let i = 0; i < n; i++) s += f(a + (i + 0.5) * h); return s * h; }
/* An option's plain text: its screen-reader name when it holds math. */
const plain = s => { const m = /<span class="sr-only">([\s\S]*?)<\/span>/.exec(s); return (m ? m[1] : String(s).replace(/<[^>]+>/g, '')).replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&'); };

export function pathProblems(model, Expr) {
  const errs = [], F = s => Expr.fn(s, ['t']);
  for (const id of model.ORDER) {
    const p = model.PATHS[id], [a, b] = p.t, dx = F(p.dx), dy = F(p.dy), ddx = F(p.ddx), ddy = F(p.ddy);
    for (let i = 1; i < 40; i++) {
      const t = a + (b - a) * i / 40;
      if (p.mode === 'x' && (!close(dx(t), d1(F(p.x), t), 1e-6, 1e-6) || !close(dy(t), d1(F(p.y), t), 1e-6, 1e-6))) { errs.push(`path ${id}: x' or y' is not the derivative at t = ${t}`); break; }
      if (!close(ddx(t), d1(dx, t), 1e-5, 1e-5) || !close(ddy(t), d1(dy, t), 1e-5, 1e-5)) { errs.push(`path ${id}: x'' or y'' is not the derivative at t = ${t}`); break; }
    }
    const tb = model.table(p, 240), sp = t => Math.hypot(dx(t), dy(t));
    for (const k of [80, 160, 240]) {
      const t = tb.t[k];
      if (p.mode === 'v') {
        const wx = p.x0 + mid(dx, a, t), wy = p.y0 + mid(dy, a, t);
        if (!close(tb.x[k], wx, 1e-6, 1e-6) || !close(tb.y[k], wy, 1e-6, 1e-6)) errs.push(`path ${id}: position at t = ${t} is not the start plus the integral of velocity`);
      }
      if (!close(tb.d[k], mid(sp, a, t), 1e-6, 1e-6)) errs.push(`path ${id}: distance to t = ${t} is not the integral of the speed`);
    }
    const S = model.special(p);
    for (const z of S.vert) if (!(Math.abs(dx(z)) < 1e-6 && Math.abs(dy(z)) > 1e-3)) errs.push(`path ${id}: t = ${z} is marked vertical but x' = ${dx(z)}, y' = ${dy(z)}`);
    for (const z of S.horiz) if (!(Math.abs(dy(z)) < 1e-6 && Math.abs(dx(z)) > 1e-3)) errs.push(`path ${id}: t = ${z} is marked horizontal but y' = ${dy(z)}`);
    for (const z of S.stop) if (!(Math.abs(dx(z)) < 1e-6 && Math.abs(dy(z)) < 1e-6)) errs.push(`path ${id}: t = ${z} is marked a stop but the speed is ${sp(z)}`);
    // every zero of x' is marked (vertical or stop)
    let flips = 0; for (let i = 0; i < 4000; i++) { const u = dx(a + (b - a) * i / 4000), v = dx(a + (b - a) * (i + 1) / 4000); if (u * v < 0) flips++; }
    if (flips > S.vert.length + S.stop.length) errs.push(`path ${id}: x' changes sign ${flips} times, ${S.vert.length + S.stop.length} marked`);
  }
  return errs;
}

export function check(data, map) {
  const errs = [];
  frame(data, 'parametric-motion', 'simulator', map, errs);
  const { M, Expr, model } = runtime('parametric-motion');
  if (!model) { errs.push('no model registered (ApCalcMath.parametricMotion)'); return errs; }
  if (model.stub) { errs.push('the model is still the Phase 0 stub (calculus-bc/assets/tools/math/parametric-motion.js)'); return errs; }
  for (const c of data.contexts || []) {
    if (!KINDS.includes(c.kind)) errs.push(`context ${c.id}: kind must be one of ${KINDS.join(', ')}`);
    else if (c.topic !== TOPIC[c.kind]) errs.push(`context ${c.id}: a ${c.kind} problem belongs to topic ${TOPIC[c.kind]}`);
  }
  for (const p of data.paths || []) {
    if (!model.PATHS[p.id]) errs.push(`paths: unknown path "${p.id}"`);
    else if (!topicOk(p.topic, map)) errs.push(`paths: ${p.id} has unknown topic "${p.topic}"`);
    else if (model.PATHS[p.id].mode === 'v' && p.topic !== 'vector-integrals') errs.push(`paths: ${p.id} gives velocity, so it belongs to vector-integrals`);
  }
  errs.push(...pathProblems(model, Expr));

  const F = s => Expr.fn(s, ['t']);
  const S = (p, k) => p.steps.find(s => s.key === k), ans = (p, k) => S(p, k).cell.answer, first = (p, k) => plain(S(p, k).options[0]);
  sweep(data, errs, (r, c, t) => model.generate(r, c, t), (p, c, w) => {
    const v = p.values, g = v.given;
    if (p.topic !== c.topic) errs.push(`${w}: topic ${p.topic}, context says ${c.topic}`);
    if (p.type !== c.kind) errs.push(`${w}: kind ${p.type}, context says ${c.kind}`);
    const t0 = v.t0;
    if (p.type === 'slope' || p.type === 'vector') {
      const X = F(g.x), Y = F(g.y), vx = d1(X, t0), vy = d1(Y, t0);
      const k1 = p.type === 'slope' ? 'dxdt' : 'vx', k2 = p.type === 'slope' ? 'dydt' : 'vy';
      if (!close(ans(p, k1), vx, 1e-6, 1e-6)) errs.push(`${w}: dx/dt key ${ans(p, k1)}, differences give ${vx}`);
      if (!close(ans(p, k2), vy, 1e-6, 1e-6)) errs.push(`${w}: dy/dt key ${ans(p, k2)}, differences give ${vy}`);
      if (p.type === 'slope') {
        if (!close(ans(p, 'dydx'), vy / vx, 1e-6, 1e-6)) errs.push(`${w}: dy/dx key is not (dy/dt)/(dx/dt)`);
        if (v.fam === 'poly') {
          // the keyed line passes through (x(t0), y(t0)) with slope dy/dx: read its numbers back
          const L = first(p, 'line').replace(/−/g, '-').replace(/\s/g, '');
          const x0 = Math.round(X(t0)), y0 = Math.round(Y(t0));
          const lhs = y0 === 0 ? 'y=' : `y${y0 < 0 ? '+' : '-'}${Math.abs(y0)}=`;
          if (!L.startsWith(lhs)) errs.push(`${w}: the keyed tangent line does not start ${lhs} (${L})`);
          if (x0 !== 0 && !L.includes(`x${x0 < 0 ? '+' : '-'}${Math.abs(x0)}`)) errs.push(`${w}: the keyed tangent line does not use x(t0) = ${x0} (${L})`);
        } else if (!/t=0andt=π/.test(first(p, 'vert').replace(/\s/g, ''))) errs.push(`${w}: the vertical-tangent key is not t = 0 and t = π`);
        else for (const z of [0, Math.PI]) if (!(Math.abs(d1(X, z)) < 1e-6 && Math.abs(d1(Y, z)) > 0.5)) errs.push(`${w}: dx/dt is not 0 at t = ${z}`);
      } else {
        const ay = d2(Y, t0);
        if (!close(ans(p, 'ay'), ay, 1e-4, 1e-4)) errs.push(`${w}: y'' key ${ans(p, 'ay')}, differences give ${ay}`);
        const want = (vx > 0 ? 'right' : 'left') + ' and ' + (vy > 0 ? 'up' : 'down');
        if (first(p, 'dir').trim() !== want) errs.push(`${w}: the direction key "${first(p, 'dir')}" should be "${want}"`);
      }
    }
    if (p.type === 'second') {
      const X = F(g.x), Y = F(g.y), dydx = t => d1(Y, t, 1e-6) / d1(X, t, 1e-6);
      const dd = d1(dydx, t0, 1e-4), want = dd / d1(X, t0);
      const key = F(S(p, 'dydx').cell.expr.answer);
      for (const t of [t0 * 0.7 + 0.13, t0, t0 * 1.1 + 0.05]) if (Math.abs(d1(X, t)) > 0.1 && !close(key(t), dydx(t), 1e-5, 1e-5)) { errs.push(`${w}: the dy/dx key is not (dy/dt)/(dx/dt) at t = ${t}`); break; }
      if (!close(ans(p, 'dd'), dd, 1e-4, 1e-4)) errs.push(`${w}: d/dt(dy/dx) key ${ans(p, 'dd')}, differences give ${dd}`);
      if (!close(ans(p, 'd2'), want, 1e-4, 1e-4)) errs.push(`${w}: d2y/dx2 key ${ans(p, 'd2')}, differences give ${want}`);
      if (/concave up/.test(first(p, 'cc')) !== (want > 0)) errs.push(`${w}: the concavity key disagrees with the sign of d2y/dx2`);
    }
    if (p.type === 'length') {
      const X = F(g.x), Y = F(g.y), L = mid(t => Math.hypot(d1(X, t), d1(Y, t)), v.a, v.b);
      if (!close(ans(p, 'len'), L, 1e-6, 1e-6)) errs.push(`${w}: length key ${ans(p, 'len')}, midpoint sum ${L}`);
      if (!M.three(ans(p, 'len'), L)) errs.push(`${w}: the length key fails the three-decimal rule`);
      if (!first(p, 'setup').includes('√((x′(t))² + (y′(t))²)')) errs.push(`${w}: the keyed integrand is not the speed`);
    }
    if (p.type === 'position') {
      const u = F(g.dx), vv = F(g.dy), xT = v.x1 + mid(u, v.t1, v.T), yT = v.y1 + mid(vv, v.t1, v.T);
      if (!close(ans(p, 'xT'), xT, 1e-6, 1e-6)) errs.push(`${w}: x(T) key ${ans(p, 'xT')}, start plus midpoint sum ${xT}`);
      if (!close(ans(p, 'yT'), yT, 1e-6, 1e-6)) errs.push(`${w}: y(T) key ${ans(p, 'yT')}, start plus midpoint sum ${yT}`);
      if (!/^-?\d+\+∫/.test(first(p, 'setup').replace(/\s/g, '').replace(/−/g, '-'))) errs.push(`${w}: the keyed setup does not add the start (${first(p, 'setup')})`);
    }
    if (p.type === 'plane') {
      const u = F(g.dx), vv = F(g.dy), sp = Math.hypot(u(t0), vv(t0)), dist = mid(t => Math.hypot(u(t), vv(t)), 0, v.T);
      if (!close(ans(p, 'spd'), sp, 1e-9, 1e-9)) errs.push(`${w}: speed key ${ans(p, 'spd')}, want ${sp}`);
      if (!close(ans(p, 'dist'), dist, 1e-6, 1e-6)) errs.push(`${w}: distance key ${ans(p, 'dist')}, midpoint sum ${dist}`);
      if (/^Yes/.test(first(p, 'yinc').trim()) !== (vv(t0) > 0)) errs.push(`${w}: the y-increasing key disagrees with the sign of y'(t0)`);
      if (!M.three(ans(p, 'dist'), dist)) errs.push(`${w}: the distance key fails the three-decimal rule`);
    }
  });
  return errs;
}
