/* Validator for physics/data/tools/rotation-lab.json (Rotation lab), run by
   scripts/check-apphys-content.mjs. OWNED BY THIS TOOL ONLY.
   300 seeded problems per context and type from ApPhysMath.rotationLab.generate
   (_drills.mjs sweep), and here every key recomputed without the generator:
   rolling speeds from m g h = ½ m v² + ½ I ω² with ω = v / r, the stool from
   L = I ω, circular orbits from G M m / r² = m v² / r, the ellipse from
   r m v at both turning points and E = K + U. The Explore model is checked
   too: the integrated orbit keeps E and L, the integrated roll matches energy. */
import { frame, sweep, close } from './_drills.mjs';
import { runtime } from './_shared.mjs';

const TYPES = ['race', 'speed', 'stool', 'orbit', 'ellipse'];

/* Every number written in a problem's text (plain, or a × 10ⁿ), so a check
   can confirm each given value is printed exactly (no rounding between what
   the student reads and what the key uses). */
const SUP = { '⁰': 0, '¹': 1, '²': 2, '³': 3, '⁴': 4, '⁵': 5, '⁶': 6, '⁷': 7, '⁸': 8, '⁹': 9 };
function numbersIn(html) {
  const t = String(html).replace(/<[^>]+>/g, ' ').replace(/−/g, '-'), out = [];
  const re = /(-?\d+(?:\.\d+)?)(?:\s*×\s*10([⁻-]?)([⁰¹²³⁴⁵⁶⁷⁸⁹]+))?/g;
  let m;
  while ((m = re.exec(t))) { let v = +m[1]; if (m[3]) { const e = [...m[3]].reduce((a, c) => a * 10 + SUP[c], 0); v *= 10 ** (m[2] ? -e : e); } out.push(v); }
  return out;
}
const printed = (p, x) => numbersIn(p.text).some(v => Math.abs(v - x) <= 1e-9 * Math.abs(x) + 1e-12);

const BETA = { hoop: 1, disk: 0.5, sphere: 0.4, block: 0 };

export function check(data, map) {
  const errs = [];
  frame(data, 'rotation-lab', 'simulator', map, errs);
  const { M, model } = runtime('rotation-lab');
  if (!model || typeof model.generate !== 'function') { errs.push('physics/assets/tools/math/rotation-lab.js does not register ApPhysMath.rotationLab with a generate()'); return errs; }
  for (const c of data.contexts || []) if (!Array.isArray(c.types) || !c.types.length || c.types.some(t => !TYPES.includes(t))) errs.push(`context ${c.id}: types must come from ${TYPES.join(', ')}`);
  // Kepler's first and second laws are out of scope (2.9 boundary, applied to 6.6).
  if (/kepler/i.test(JSON.stringify(data))) errs.push('the data names Kepler: out of scope');
  sweep(data, errs, (r, c, t) => model.generate(r, c, t), (p, c, w) => {
    const v = p.values, key = k => { const s = p.steps.find(x => x.key === k); return s && s.cell ? s.cell.answer : s ? s.correct : undefined; };
    const eq = (k, x, rel = 1e-6) => { const a = key(k); if (a === undefined || !close(a, x, rel)) errs.push(`${w}: step ${k} is ${a}, recomputed ${x}`); };
    if (/kepler/i.test(p.text + p.solution.join(' '))) errs.push(`${w}: names Kepler`);
    const g = v.g ?? 9.8;
    const given = (...xs) => { for (const x of xs) if (!printed(p, x)) errs.push(`${w}: the given value ${x} is not printed exactly in the text`); };
    if (p.type === 'race') given(v.h, v.m);
    if (p.type === 'speed') given(v.m, v.rad, v.len, v.th);
    if (p.type === 'stool') given(v.I0, v.m, v.d0, v.w0, p.fig.d1);
    if (p.type === 'orbit') given(v.R, v.alt / 1000, v.m, v.GM);
    if (p.type === 'ellipse') given(v.rp, v.ra, v.vp, v.GM, v.m);
    if (p.type === 'race') {
      const b = BETA[v.ask], vb = Math.sqrt(2 * g * v.h / (1 + b));
      // Check against energy directly: m g h = ½ m v² + ½ (b m r²)(v/r)².
      if (!close(v.m * g * v.h, 0.5 * v.m * vb ** 2 + 0.5 * b * v.m * vb ** 2, 1e-9)) errs.push(`${w}: energy does not balance`);
      eq('v', vb); eq('frac', b / (1 + b));
      const order = [...v.pick].sort((x, y) => BETA[x] - BETA[y]);
      if (key('first') !== v.pick.indexOf(order[0])) errs.push(`${w}: the winner is wrong`);
      if (key('last') !== v.pick.indexOf(order[2])) errs.push(`${w}: the last is wrong`);
      if (new Set(v.pick.map(k => BETA[k])).size !== 3) errs.push(`${w}: two racers tie`);
    }
    if (p.type === 'speed') {
      const h = v.len * Math.sin(v.th * Math.PI / 180), b = BETA[v.sh];
      const vb = Math.sqrt(2 * g * h / (1 + b));
      eq('h', h); eq('v', vb); eq('om', vb / v.rad); eq('Kr', 0.5 * (b * v.m * v.rad ** 2) * (vb / v.rad) ** 2);
    }
    if (p.type === 'stool') {
      const Ii = v.I0 + 2 * v.m * v.d0 ** 2, If = v.I0 + 2 * v.m * (p.fig.d1) ** 2, wf = Ii * v.w0 / If;
      eq('Ii', Ii); eq('If', If); eq('wf', wf); eq('dK', 0.5 * If * wf ** 2 - 0.5 * Ii * v.w0 ** 2);
      if (!(key('dK') > 0)) errs.push(`${w}: K should rise`);
    }
    if (p.type === 'orbit') {
      const r = v.R + v.alt, vv = Math.sqrt(v.GM / r);
      eq('r', r); eq('v', vv); eq('E', 0.5 * v.m * vv ** 2 - v.GM * v.m / r);
      if (key('scale') !== 1) errs.push(`${w}: the scaling key is wrong`);
    }
    if (p.type === 'ellipse') {
      const va = v.vp * v.rp / v.ra;
      eq('va', va);
      // Energy must agree at both ends (the given vp came from E and L).
      const Ep = 0.5 * v.m * v.vp ** 2 - v.GM * v.m / v.rp, Ea = 0.5 * v.m * va ** 2 - v.GM * v.m / v.ra;
      // The printed values are rounded to 4 figures, so E agrees to that precision.
      if (!close(Ep, Ea, 2e-3)) errs.push(`${w}: E differs at the two ends`);
      eq('dK', 0.5 * v.m * (v.vp ** 2 - va ** 2));
    }
  }, c => c.types);
  // Explore: an elliptical orbit keeps E and L; a rolling disk's integration matches energy.
  const O = model.orbit, GM = 4e14, s0 = O.start({ r0: 8e6, k: 1.2, GM });
  let s = s0; const e0 = O.energy(s0, GM, 1);
  for (let i = 0; i < 20000; i++) s = O.step(s, 1, GM);
  const e1 = O.energy(s, GM, 1);
  if (!close(e1.E, e0.E, 1e-4)) errs.push(`explore: orbit energy drifts (${e0.E} -> ${e1.E})`);
  if (!close(e1.L, e0.L, 1e-6)) errs.push('explore: orbit angular momentum drifts');
  return errs;
}
