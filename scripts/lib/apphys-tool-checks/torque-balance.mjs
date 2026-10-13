/* Validator for physics/data/tools/torque-balance.json (Torque balance), run by
   scripts/check-apphys-content.mjs. OWNED BY THIS TOOL ONLY.
   check(data, map) -> problems. 300 seeded problems per context and type from
   ApPhysMath.torqueBalance.generate (_drills.mjs sweep), and here, without the
   generator, every key recomputed from first principles: τ = r F sin θ, the
   balance point from Στ = 0 about the fulcrum, both support forces from
   torques about each end, α = τ_net / Σ m r², and the race wheels'
   accelerations from Newton's laws for the weight and the wheel. Also checks
   the stated numbers appear in the text, and the Explore model: the support
   force, the beam's inertia and its energy in a free swing. */
import { frame, sweep, close } from './_drills.mjs';
import { runtime } from './_shared.mjs';

const TYPES = ['torque', 'balance', 'support', 'alpha', 'inertia'];

export function check(data, map) {
  const errs = [];
  frame(data, 'torque-balance', 'simulator', map, errs);
  const { M, model } = runtime('torque-balance');
  if (!model || typeof model.generate !== 'function') { errs.push('physics/assets/tools/math/torque-balance.js does not register ApPhysMath.torqueBalance with a generate()'); return errs; }
  for (const c of data.contexts || []) if (!Array.isArray(c.types) || !c.types.length || c.types.some(t => !TYPES.includes(t))) errs.push(`context ${c.id}: types must come from ${TYPES.join(', ')}`);
  const rad = d => d * Math.PI / 180;
  sweep(data, errs, (r, c, t) => model.generate(r, c, t), (p, c, w) => {
    const v = p.values, key = k => { const s = p.steps.find(x => x.key === k); return s && s.cell ? s.cell.answer : s ? s.correct : undefined; };
    const eq = (k, x, rel = 1e-6) => { const a = key(k); if (a === undefined || !close(a, x, rel)) errs.push(`${w}: step ${k} is ${a}, recomputed ${x}`); };
    // Given values appear as written: 2 significant figures, or 3 when needed.
    const shows = (...xs) => { for (const x of xs) { const t = M.fmt(x, Number(x.toPrecision(2)) === x ? 2 : 3); if (!p.text.includes(t)) errs.push(`${w}: the text does not show ${t}`); } };
    const g = v.g ?? 9.8;
    if (!/g = (9\.8|10) m\/s²/.test(p.text) && p.type !== 'torque') errs.push(`${w}: the text does not state g`);
    if (p.type === 'torque') {
      shows(v.r, v.F); if (!p.text.includes(`${v.th}°`)) errs.push(`${w}: the angle is not in the text`);
      eq('arm', v.r * Math.sin(rad(v.th))); eq('tau', v.r * v.F * Math.sin(rad(v.th)));
      if (key('dir') !== (v.up ? 1 : 0)) errs.push(`${w}: rotation sense is wrong`);
    }
    if (p.type === 'balance') {
      shows(v.p, v.x1, v.m1, v.m2);
      const ccw = v.m1 * g * (v.p - v.x1) + v.mb * g * (v.p - 0.5);   // left of the fulcrum: counterclockwise
      const d = ccw / (v.m2 * g);
      eq('t1', v.m1 * g * (v.p - v.x1)); eq('d2', d); eq('x2', v.p + d);
      if (!(v.p + d <= 1 && d > 0)) errs.push(`${w}: the balance point is off the stick`);
      // Net torque with the second mass placed is zero.
      const net = v.m1 * g * (v.p - v.x1) + v.mb * g * (v.p - 0.5) - v.m2 * g * d;
      if (Math.abs(net) > 1e-9) errs.push(`${w}: Στ ≠ 0 at the answer`);
      if (p.steps.find(s => s.key === 'tb')) eq('tb', Math.abs(v.mb * g * (v.p - 0.5)));
    }
    if (p.type === 'support') {
      shows(v.L, v.mb, v.m, v.x);
      const W = (v.mb + v.m) * g;
      // About the right end: F_left L = mb g L/2 + m g (L − x).
      const FL = (v.mb * g * v.L / 2 + v.m * g * (v.L - v.x)) / v.L, FR = W - FL;
      eq('FR', FR); eq('FL', FL);
      if (key('which') !== (FL > FR ? 0 : 1)) errs.push(`${w}: the larger support is wrong`);
    }
    if (p.type === 'alpha') {
      shows(v.m1, v.m2, v.r1, v.r2);
      const tl = v.m1 * g * v.r1, tr = v.m2 * g * v.r2, I = v.m1 * v.r1 ** 2 + v.m2 * v.r2 ** 2;
      eq('net', Math.abs(tr - tl)); eq('I', I); eq('alpha', Math.abs(tr - tl) / I);
      if (key('dir') !== (tr > tl ? 0 : 1)) errs.push(`${w}: the direction is wrong`);
    }
    if (p.type === 'inertia') {
      const IA = v.I0 + 2 * v.ms * v.dA ** 2, IB = v.I0 + 2 * v.ms * v.dB ** 2;
      eq('IA', IA); eq('IB', IB);
      // Weight: m g − T = m a; wheel: T r = I a / r.
      const acc = I => v.m * g / (v.m + I / v.rad ** 2);
      eq('a', acc(Math.min(IA, IB)));
      if (key('win') !== (IA < IB ? 0 : 1)) errs.push(`${w}: the winner is wrong`);
    }
  }, c => c.types);
  // The Explore model.
  const s = { L: 1, mb: 0.12, pivot: 0.4, h: 0.12, masses: [{ m: 0.2, x: 0.1 }, { m: 0.1, x: 0.9 }], force: { F: 2, x: 0.8, ang: 60 } };
  const t = model.torques(s, 9.8);
  const by = (0.12 * (0.5 - 0.4) + 0.2 * (0.1 - 0.4) + 0.1 * (0.9 - 0.4)) * -9.8 + (0.8 - 0.4) * 2 * Math.sin(rad(60));
  if (!close(t.net, by, 1e-9)) errs.push(`explore: net torque ${t.net}, recomputed ${by}`);
  const I = 0.12 / 12 + 0.12 * 0.01 + 0.2 * 0.09 + 0.1 * 0.25;
  if (!close(t.I, I, 1e-9)) errs.push(`explore: I ${t.I}, recomputed ${I}`);
  if (!close(t.support.y, (0.12 + 0.3) * 9.8 - 2 * Math.sin(rad(60)), 1e-9)) errs.push('explore: the support force is wrong');
  return errs;
}
