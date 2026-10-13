/* Validator for physics/data/tools/collision-lab.json (Collision lab), run by
   scripts/check-apphys-content.mjs. OWNED BY THIS TOOL ONLY.
   check(data, map) -> problems. 300 seeded problems per context and type
   from the page's own generator (ApPhysMath.collisionLab.generate), every
   key recomputed here from the problem's numbers without the model:
     sticky    p = m1v1 + m2v2, v = p/(m1 + m2), ΔK = K before − K after
     onefinal  v2' from momentum; elastic or not from the two K totals
     explode   v1' = −m2v2'/m1, v_cm = 0, K = ½m1v1'² + ½m2v2'²
     ke        both K totals, conserved or not, momentum conserved
     impulse   J = area of the drawn triangle, rectangle or trapezoid, v_f = v0 + J/m, F_avg = J/Δt
     cm        v_cm = (m1v1 + m2v2)/(m1 + m2)
     choose    the principle for each authored situation
     bars      p = mv in units, totals equal before and after
   It also runs the Explore model: momentum at every instant, the center of
   mass at constant velocity, impulse = area = Δp, final velocities from e. */
import { frame, sweep, close } from './_drills.mjs';
import { runtime } from './_shared.mjs';

const TYPES = ['sticky', 'onefinal', 'explode', 'ke', 'impulse', 'cm', 'choose', 'bars'];
const KE = (m1, m2, a, b) => 0.5 * m1 * a * a + 0.5 * m2 * b * b;

export function check(data, map) {
  const errs = [];
  frame(data, 'collision-lab', 'simulator', map, errs);
  const { M, model } = runtime('collision-lab');
  if (!model || typeof model.generate !== 'function') { errs.push('physics/assets/tools/math/collision-lab.js does not register ApPhysMath.collisionLab with a generate()'); return errs; }
  for (const c of data.contexts || []) if (!Array.isArray(c.types) || !c.types.length || c.types.some(t => !TYPES.includes(t))) errs.push(`context ${c.id}: types must come from ${TYPES.join(', ')}`);
  // Explore model.
  for (const o of [{ m1: 1, m2: 0.5, v1: 1.5, v2: -0.5, e: 1, k: 2000 }, { m1: 2, m2: 0.75, v1: 1, v2: 0, e: 0, k: 800 }, { m1: 0.5, m2: 2.5, v1: 2.5, v2: -1.2, e: 0.45, k: 15000 }, { mode: 'explode', m1: 1.5, m2: 0.5, E: 2, k: 4000 }]) {
    const R = model.run(o), p0 = o.m1 * (o.v1 || 0) + o.m2 * (o.v2 || 0), M0 = o.m1 + o.m2;
    for (let t = 0; t < 3; t += 0.001) {
      const s = R.at(t);
      if (!close(o.m1 * s.v1 + o.m2 * s.v2, p0, 1e-9, 1e-9)) { errs.push(`explore ${JSON.stringify(o)}: momentum changes at t = ${t}`); break; }
      if (!close((o.m1 * s.x1 + o.m2 * s.x2) / M0, R.xcm0 + R.vcm * t, 1e-9, 1e-9)) { errs.push(`explore: the center of mass does not move at constant velocity (t = ${t})`); break; }
    }
    const J = model.area(R.pulse, 0, R.Tc), dp = o.m2 * (R.v2f - (o.v2 || 0));
    if (!close(J, dp, 1e-5, 1e-6) || !close(R.J, dp, 1e-9, 1e-9)) errs.push(`explore: impulse ${J} (area) and ${R.J} differ from Δp ${dp}`);
    if (o.mode !== 'explode') {
      const e = o.e, u = o.v1 - o.v2, w = R.v2f - R.v1f;
      if (!close(w, e * u, 1e-9, 1e-9)) errs.push(`explore: separation speed ${w}, expected e × approach ${e * u}`);
      const K0 = KE(o.m1, o.m2, o.v1, o.v2), K1 = KE(o.m1, o.m2, R.v1f, R.v2f);
      if (e === 1 ? !close(K1, K0, 1e-9) : K1 >= K0) errs.push(`explore: kinetic energy ${K0} → ${K1} for e = ${e}`);
      const end = R.at(2.9);
      if (!close(end.v1, R.v1f, 1e-9, 1e-9) || !close(end.v2, R.v2f, 1e-9, 1e-9)) errs.push('explore: the animation ends at different velocities than the model');
    } else if (!close(KE(o.m1, o.m2, R.v1f, R.v2f), o.E, 1e-9)) errs.push('explore: the explosion does not release the spring energy');
  }
  sweep(data, errs, (r, c, t) => model.generate(r, c, t), (p, c, w) => {
    const step = k => p.steps.find(x => x.key === k), v = p.values;
    const is = (k, x) => { const s = step(k); if (!s) errs.push(`${w}: no step ${k}`); else if (!close(s.cell.answer, x, 1e-9, 1e-9)) errs.push(`${w}: step ${k} is ${s.cell.answer}, recomputed ${x}`); };
    const key = (k, i) => { const s = step(k); if (!s) errs.push(`${w}: no step ${k}`); else if (s.correct !== i) errs.push(`${w}: step ${k} keyed ${s.correct}, expected ${i}`); };
    const shows = (...xs) => { for (const x of xs) if (!p.text.includes(M.fmt(Math.abs(x), 2))) errs.push(`${w}: the text does not show ${M.fmt(Math.abs(x), 2)}`); };
    if (p.type === 'sticky') {
      const P = v.m1 * v.v1 + v.m2 * v.v2, vf = P / (v.m1 + v.m2);
      is('p', P); is('vf', vf); is('dK', KE(v.m1, v.m2, v.v1, v.v2) - 0.5 * (v.m1 + v.m2) * vf * vf); shows(v.m1, v.m2, v.v1);
      if (!(KE(v.m1, v.m2, v.v1, v.v2) > 0.5 * (v.m1 + v.m2) * vf * vf)) errs.push(`${w}: a sticky collision must lose kinetic energy`);
    }
    if (p.type === 'onefinal') {
      const v2f = (v.m1 * v.v1 + v.m2 * v.v2 - v.m1 * v.v1f) / v.m2; is('v2f', v2f);
      const K0 = KE(v.m1, v.m2, v.v1, v.v2), K1 = KE(v.m1, v.m2, v.v1f, v2f);
      if (K1 > K0 * 1.03) errs.push(`${w}: kinetic energy increases (${K0} → ${K1})`);
      if (v2f < v.v1f - 1e-9) errs.push(`${w}: cart B ends up behind cart A moving slower (they would pass through)`);
      key('type', Math.abs(K1 - K0) <= 0.03 * K0 ? 0 : 1);
    }
    if (p.type === 'explode') { is('v1f', -v.m2 * v.v2f / v.m1); is('vcm', 0); is('E', KE(v.m1, v.m2, -v.m2 * v.v2f / v.m1, v.v2f)); shows(v.m1, v.m2, v.v2f); }
    if (p.type === 'ke') {
      const K0 = KE(v.m1, v.m2, v.v1, v.v2), K1 = KE(v.m1, v.m2, v.a1, v.a2); is('K0', K0); is('K1', K1);
      key('cons', Math.abs(K1 - K0) <= 0.01 * K0 ? 0 : 1); key('p', 0);
      if (Math.abs(v.m1 * v.a1 + v.m2 * v.a2 - (v.m1 * v.v1 + v.m2 * v.v2)) > 0.005 * (Math.abs(v.m1 * v.v1) + Math.abs(v.m2 * v.v2))) errs.push(`${w}: the after velocities do not conserve momentum`);
      if (K1 > K0 * 1.01) errs.push(`${w}: kinetic energy increases`);
    }
    if (p.type === 'impulse') {
      const f = p.figure, J = f.shape === 'tri' ? 0.5 * f.Fm * f.dt : f.shape === 'rect' ? f.Fm * f.dt : f.Fm * (f.dt - f.ramp);
      is('J', f.dir * J); is('vf', v.v0 + f.dir * J / v.m);
      if (f.shape !== 'rect') is('Favg', J / f.dt);
    }
    if (p.type === 'cm') { is('vcm', (v.m1 * v.v1 + v.m2 * v.v2) / (v.m1 + v.m2)); key('after', 0); }
    if (p.type === 'choose') {
      v.picks.forEach((i, k) => { const s = model.CHOOSE[i]; key('q' + (k + 1), s.c); if (!p.steps[k].label.startsWith(s.t)) errs.push(`${w}: question ${k + 1} is not situation ${i}`); });
      key('why', 0);
    }
    if (p.type === 'bars') {
      const u = v.u, want = { pA: v.m1 * v.vA / u, pB: v.m2 * v.vB / u, fA: v.m1 * v.wA / u, fB: v.m2 * v.wB / u };
      want.pT = want.pA + want.pB; want.fT = want.fA + want.fB;
      const row = step('bars');
      p.figure.cells.forEach((cl, i) => {
        if (!close(row.cells[i].answer, want[cl.key], 1e-9, 1e-9)) errs.push(`${w}: bar ${cl.key} is ${row.cells[i].answer}, recomputed ${want[cl.key]}`);
        if (Math.abs(want[cl.key] - Math.round(want[cl.key])) > 1e-9 || Math.abs(want[cl.key]) > 8) errs.push(`${w}: bar ${cl.key} (${want[cl.key]}) is not a whole number of units on the chart`);
      });
      if (!close(want.pT, want.fT, 1e-9, 1e-9)) errs.push(`${w}: total momentum changes`);
      if (v.kind === 'sticky' && !close(v.wA, v.wB, 1e-9, 1e-9)) errs.push(`${w}: stuck carts move at different velocities`);
      if (v.kind === 'bounce' && v.wB < v.wA - 1e-9) errs.push(`${w}: cart B ends up slower than A behind it`);
      if (v.kind === 'bounce' && KE(v.m1, v.m2, v.wA, v.wB) > KE(v.m1, v.m2, v.vA, v.vB) * (1 + 1e-9)) errs.push(`${w}: the collision creates kinetic energy`);
      key('total', 0);
    }
  }, c => c.types || TYPES);
  return errs;
}
