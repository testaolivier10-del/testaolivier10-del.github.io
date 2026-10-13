/* Validator for physics/data/tools/scaling-drills.json (Scaling drills), run
   by scripts/check-apphys-content.mjs. OWNED BY THIS TOOL ONLY.
   300 seeded problems per context and type from
   ApPhysMath.scalingDrills.generate (the code the page runs), each checked by
   _drills.mjs and then recomputed here from tables written out again,
   independently of the model: the power of each variable in each relation,
   the SI base units of each expression, and each conversion factor. It also
   holds every relation, expression and conversion to its topic (a context
   only uses what its topic or an earlier one teaches) and checks that the
   model's own tables agree with these. */
import { frame, sweep, close } from './_drills.mjs';
import { runtime } from './_shared.mjs';

// Relation -> { variable symbol: power } (the physics, from the equations sheet).
const POW = {
  square: { s: 2 }, cube: { s: 3 }, circle: { r: 2 }, trip: { v: -1, d: 1 }, rect: { 'ℓ': 1, w: 1 },
  fromrest: { t: 2, a: 1 }, vat: { t: 1, a: 1 }, droptime: { h: 0.5, g: -0.5 }, range: { 'v₀': 2 },
  newton: { F: 1, m: -1 }, gravity: { r: -2, 'm₁': 1 }, surfaceg: { R: -2, M: 1 }, spring: { x: 1, k: 1 },
  centripetal: { v: 2, r: -1 }, ke: { v: 2, m: 1 }, pespring: { x: 2, k: 1 }, pegrav: { 'Δh': 1, m: 1 },
  power: { 'Δt': -1, W: 1 }, momentum: { v: 1, m: 1 }, impulse: { 'Δt': -1 }, torque: { r: 1, F: 1 },
  inertia: { r: 2, m: 1 }, rotke: { 'ω': 2, I: 1 }, orbitv: { r: -0.5, M: 0.5 },
  pendulum: { L: 0.5, m: 0, g: -0.5 }, springT: { m: 0.5, k: -0.5, A: 0 }, shmE: { A: 2, k: 1 },
  pressure: { h: 1, 'ρ': 1 }, buoyant: { s: 3, 'ρ': 1 }, continuity: { d: -2 }, torricelli: { h: 0.5 },
};
// Expression -> SI base units [m, kg, s].
const DIMS = {
  dt: [1, 0, -1], dvdt: [1, 0, -2], rho: [-3, 1, 0], lw: [2, 0, 0], halfat2: [1, 0, 0], ma: [1, 1, -2], v2r: [1, 0, -2],
  halfmv2: [2, 1, -2], mgh: [2, 1, -2], kx: [1, 1, -2], halfkx2: [2, 1, -2], fv: [2, 1, -3], wt: [2, 1, -3], mv: [1, 1, -1],
  ft: [1, 1, -1], mr2: [2, 1, 0], pend: [0, 0, 1], springT: [0, 0, 1], rhogh: [-1, 1, -2], fa: [-1, 1, -2], rhovg: [1, 1, -2],
  av: [3, 0, -1], sqrt2gh: [1, 0, -1],
};
// Conversion -> factor (value in the SI unit = value × factor).
const K = { kmh: 1000 / 3600, g: 1e-3, cm: 1e-2, mm: 1e-3, cm2: 1e-4, cm3: 1e-6, gcm3: 1e3, min: 60, L: 1e-3, kN: 1e3 };
const TYPES = ['factor', 'combo', 'units', 'convert'];

export function check(data, map) {
  const errs = [];
  frame(data, 'scaling-drills', 'skill', map, errs);
  const { model: S } = runtime('scaling-drills');
  if (!S || typeof S.generate !== 'function') { errs.push('physics/assets/tools/math/scaling-drills.js does not register ApPhysMath.scalingDrills with a generate()'); return errs; }
  const order = map.topics.map(t => t.id), at = id => order.indexOf(id);
  // The model's tables agree with the independent ones here.
  for (const [k, rel] of Object.entries(S.REL)) {
    if (!POW[k]) { errs.push(`relation ${k}: not in the validator's table`); continue; }
    for (const v of rel.vars) if (POW[k][v.sym] !== v.p) errs.push(`relation ${k}: power of ${v.sym} is ${v.p}, expected ${POW[k][v.sym]}`);
    if (!map.topicById(rel.topic)) errs.push(`relation ${k}: unknown topic ${rel.topic}`);
  }
  for (const [k, e] of Object.entries(S.EXPR)) if (!DIMS[k] || S.QTY[e.q].d.join() !== DIMS[k].join()) errs.push(`expression ${k}: base units disagree`);
  for (const [k, c] of Object.entries(S.CONV)) if (!(k in K) || !close(c.k, K[k], 1e-12)) errs.push(`conversion ${k}: factor ${c.k}, expected ${K[k]}`);
  for (const c of data.contexts || []) {
    if (!Array.isArray(c.types) || !c.types.length || c.types.some(t => !TYPES.includes(t))) errs.push(`context ${c.id}: types must come from ${TYPES.join(', ')}`);
    const use = [...(c.relations || []).map(k => [k, S.REL[k]]), ...(c.exprs || []).map(k => [k, S.EXPR[k]]), ...(c.convs || []).map(k => [k, S.CONV[k]])];
    for (const [k, x] of use) {
      if (!x) { errs.push(`context ${c.id}: unknown item ${k}`); continue; }
      if (at(x.topic) > at(c.topic)) errs.push(`context ${c.id}: ${k} is taught in ${x.topic}, after ${c.topic}`);
    }
    if (c.types.includes('factor') && !(c.relations || []).length) errs.push(`context ${c.id}: factor problems need relations`);
    if (c.types.includes('combo') && !(c.relations || []).some(k => S.REL[k].vars.filter(v => v.p !== 0).length >= 2)) errs.push(`context ${c.id}: combo problems need a relation with two variables`);
    if (c.types.includes('units') && !(c.exprs || []).length) errs.push(`context ${c.id}: units problems need expressions`);
    if (c.types.includes('convert') && !(c.convs || []).length) errs.push(`context ${c.id}: convert problems need conversions`);
  }
  // Every relation, expression and conversion is used by some context (nothing orphaned).
  const used = new Set((data.contexts || []).flatMap(c => [...(c.relations || []), ...(c.exprs || []), ...(c.convs || [])]));
  for (const k of [...Object.keys(S.REL), ...Object.keys(S.EXPR), ...Object.keys(S.CONV)]) if (!used.has(k)) errs.push(`${k} is in the model but in no context`);

  sweep(data, errs, (r, c, t) => S.generate(r, c, t), (p, c, w) => {
    const v = p.values, step = k => p.steps.find(s => s.key === k), ans = k => step(k).cell.answer;
    const bad = (cond, msg) => { if (cond) errs.push(`${w}: ${msg}`); };
    if (p.type === 'factor') {
      const pw = POW[v.rel][v.v];
      bad(!close(ans('k'), v.k ** pw, 1e-12), `factor ${ans('k')}, expected ${v.k}^${pw}`);
      bad(step('dep').correct !== 0, 'the dependence key moved');
      bad(!p.text.includes(S.kWord(v.k, '').replace(/^the  is /, '')), 'the text does not say how the variable changes');
    } else if (p.type === 'combo') {
      const fa = v.ka ** POW[v.rel][v.a], fb = v.kb ** POW[v.rel][v.b];
      bad(!close(ans('fa'), fa, 1e-12) || !close(ans('fb'), fb, 1e-12), 'a single factor disagrees');
      bad(!close(ans('tot'), fa * fb, 1e-12), 'the total is not the product');
    } else if (p.type === 'units') {
      bad(step('base').options[step('base').correct] !== S.dimsText(DIMS[v.expr]), 'the base-unit key is wrong');
      bad(new Set(step('base').options).size !== 4, 'the base-unit options are not four different answers');
      bad(new Set(step('qty').options).size !== 4, 'the quantity options are not four different answers');
    } else if (p.type === 'convert') {
      bad(!close(ans('c1'), v.xa * K[v.a], 1e-12) || !close(ans('c2'), v.xb * K[v.b], 1e-12), 'a conversion disagrees');
    } else errs.push(`${w}: unknown type ${p.type}`);
  }, c => c.types);
  return errs;
}
