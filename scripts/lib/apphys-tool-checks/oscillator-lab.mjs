/* Validator for physics/data/tools/oscillator-lab.json (Oscillator lab), run by
   scripts/check-apphys-content.mjs. OWNED BY THIS TOOL ONLY.
   300 seeded problems per context and type from ApPhysMath.oscillatorLab.generate
   (_drills.mjs sweep), every key recomputed here: T = 2π√(m/k) and 2π√(ℓ/g),
   the factor a change makes, v_max from ½kA² = ½mv², a_max = kA/m, the energy
   split at x, and the graph reading (the marked time's position from
   x = A cos(2πt/T + φ)). The Explore model is checked too: energy kept in an
   undamped run, the measured period equal to the formula. */
import { frame, sweep, close } from './_drills.mjs';
import { runtime } from './_shared.mjs';

const TYPES = ['period', 'change', 'points', 'energy', 'graph'];

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

const TAU = 2 * Math.PI;

export function check(data, map) {
  const errs = [];
  frame(data, 'oscillator-lab', 'simulator', map, errs);
  const { M, model } = runtime('oscillator-lab');
  if (!model || typeof model.generate !== 'function') { errs.push('physics/assets/tools/math/oscillator-lab.js does not register ApPhysMath.oscillatorLab with a generate()'); return errs; }
  for (const c of data.contexts || []) if (!Array.isArray(c.types) || !c.types.length || c.types.some(t => !TYPES.includes(t))) errs.push(`context ${c.id}: types must come from ${TYPES.join(', ')}`);
  sweep(data, errs, (r, c, t) => model.generate(r, c, t), (p, c, w) => {
    const v = p.values, key = k => { const s = p.steps.find(x => x.key === k); return s && s.cell ? s.cell.answer : s ? s.correct : undefined; };
    const eq = (k, x, rel = 1e-6) => { const a = key(k); if (a === undefined || !close(a, x, rel)) errs.push(`${w}: step ${k} is ${a}, recomputed ${x}`); };
    const given = (...xs) => { for (const x of xs) if (!printed(p, x)) errs.push(`${w}: the given value ${x} is not printed exactly in the text`); };
    if (p.type === 'period') given(...(v.sys === 'spring' ? [v.m, v.k, v.A] : [v.m, v.L, v.g]));
    if (p.type === 'change') given(v.T0);
    if (p.type === 'points') given(v.m, v.k, v.A);
    if (p.type === 'energy') given(v.m, v.k, v.A, v.x);
    if (p.type === 'graph') given(v.m);
    if (p.type === 'period') {
      const T = v.sys === 'spring' ? TAU * Math.sqrt(v.m / v.k) : TAU * Math.sqrt(v.L / v.g);
      eq('T', T); eq('f', 1 / T);
      if (key(v.sys === 'spring' ? 'amp' : 'mass') !== 0) errs.push(`${w}: the no-change key is wrong`);
      if (v.sys === 'pendulum' && !p.text.includes(`g = ${v.g} m/s²`)) errs.push(`${w}: g is not stated`);
    }
    if (p.type === 'change') {
      const ratio = { m: Math.sqrt(v.k), L: Math.sqrt(v.k), k: 1 / Math.sqrt(v.k), g: 1 / Math.sqrt(v.k), A: 1, mp: 1 }[v.which];
      eq('T', v.T0 * ratio); eq('f', 1 / (v.T0 * ratio));
      const s = p.steps.find(x => x.key === 'factor'), want = ratio === 1 ? 3 : ratio > 1 === v.k > 1 ? 0 : 1;
      if (s.correct !== want) errs.push(`${w}: the factor key is ${s.correct}, want ${want}`);
      const opt = s.options[s.correct];
      if (ratio !== 1) { const m = /×(1\/)?(\d+)/.exec(opt), val = m ? (m[1] ? 1 / +m[2] : +m[2]) : NaN; if (!close(val, ratio, 1e-9)) errs.push(`${w}: the keyed option "${opt}" is not ×${ratio}`); }
    }
    if (p.type === 'points') {
      eq('vmax', v.A * Math.sqrt(v.k / v.m)); eq('amax', v.k * v.A / v.m);
      if (key('vmaxAt') !== 0 || key('amaxAt') !== 1) errs.push(`${w}: the maxima keys are wrong`);
    }
    if (p.type === 'energy') {
      const E = 0.5 * v.k * v.A ** 2, U = 0.5 * v.k * v.x ** 2;
      eq('E', E); eq('U', U); eq('K', E - U); eq('v', Math.sqrt(2 * (E - U) / v.m));
      if (!(v.x < v.A)) errs.push(`${w}: x is outside the motion`);
    }
    if (p.type === 'graph') {
      const k = 4 * Math.PI ** 2 * v.m / v.T ** 2, phase = { top: 0, 'zero-up': -Math.PI / 2, bottom: Math.PI }[v.start];
      eq('A', v.A); eq('T', v.T); eq('k', k); eq('vmax', TAU * v.A / v.T);
      if (!close(p.fig.A, v.A) || !close(p.fig.T, v.T) || !close(p.fig.phase, phase)) errs.push(`${w}: the drawn graph differs from the values`);
      const x = v.A * Math.cos(TAU * p.fig.mark / v.T + phase), want = Math.abs(x) < v.A * 0.01 ? 0 : x > 0 ? 1 : 2;
      if (key('at') !== want) errs.push(`${w}: the marked-time key is wrong`);
    }
  }, c => c.types);
  // Explore: energy in an undamped run, and the measured period.
  for (const sys of [{ type: 'spring', m: 0.5, k: 20, A: 0.1, g: 9.8 }, { type: 'vspring', m: 0.5, k: 20, A: 0.1, g: 9.8 }, { type: 'pendulum', m: 1, L: 1.2, A: 8, g: 9.8 }]) {
    let s = model.init(sys); const E0 = model.energy(sys, s).E;
    for (let i = 0; i < 100; i++) s = model.advance(sys, s, 1 / 60);
    const E1 = model.energy(sys, s).E;
    if (!close(E1, E0, 1e-3)) errs.push(`explore ${sys.type}: energy drifts more than 0.1%`);
    const Tm = model.measure(sys, 3), T0 = model.period(sys) * (sys.type === 'pendulum' ? model.largeAngle(sys.A) : 1);
    if (!close(Tm, T0, 1e-3)) errs.push(`explore ${sys.type}: measured period ${Tm} vs ${T0}`);
  }
  return errs;
}
