/* Validator for physics/data/tools/fluids-tank.json (Fluids tank), run by
   scripts/check-apphys-content.mjs. OWNED BY THIS TOOL ONLY.
   300 seeded problems per context and type from ApPhysMath.fluidsTank.generate
   (the code the page runs), each checked by _drills.mjs and then recomputed
   here without the model: density from mass over volume, F_b = ρ_fluid·V·g,
   the floating fraction from ρ_obj/ρ_fluid, the scale reading F_g − F_b,
   P = P_atm + ρgh from the depth below the surface, continuity from the
   diameters, Bernoulli with heights, and v = √(2gh) at a hole. */
import { frame, sweep, close } from './_drills.mjs';
import { runtime } from './_shared.mjs';

const TYPES = ['density', 'buoyant', 'float', 'apparent', 'pressure', 'continuity', 'bernoulli', 'hole'];
const SCENES = ['float', 'scale', 'pressure', 'pipe', 'hole'];
const FLUIDS = { water: 1000, oil: 800, salt: 1025 };
const g = 9.8, ATM = 1.0e5;

export function check(data, map) {
  const errs = [];
  frame(data, 'fluids-tank', 'simulator', map, errs);
  const { model } = runtime('fluids-tank');
  if (!model || typeof model.generate !== 'function') { errs.push('physics/assets/tools/math/fluids-tank.js does not register ApPhysMath.fluidsTank with a generate()'); return errs; }
  for (const s of data.scenes || []) {
    if (!SCENES.includes(s.id)) errs.push(`scene "${s.id}" is not one of ${SCENES.join(', ')}`);
    if (!map.topicById(s.topic)) errs.push(`scene ${s.id}: unknown topic "${s.topic}"`);
  }
  for (const c of data.contexts || []) {
    if (!Array.isArray(c.types) || !c.types.length || c.types.some(t => !TYPES.includes(t))) errs.push(`context ${c.id}: types must come from ${TYPES.join(', ')}`);
    for (const f of c.fluids || []) if (!(f in FLUIDS)) errs.push(`context ${c.id}: unknown fluid "${f}"`);
  }
  // The explorer's fixed numbers: the objects and fluids against the table densities.
  for (const [k, rho] of Object.entries(FLUIDS)) if (model.FLUIDS[k].rho !== rho) errs.push(`fluid ${k}: density ${model.FLUIDS[k].rho}, expected ${rho}`);

  sweep(data, errs, (r, c, t) => model.generate(r, c, t), (p, c, w) => {
    const v = p.values, step = k => p.steps.find(s => s.key === k), ans = k => step(k).cell.answer;
    const bad = (cond, msg) => { if (cond) errs.push(`${w}: ${msg}`); };
    if (v.rhoF != null) bad(!Object.values(FLUIDS).includes(v.rhoF), `fluid density ${v.rhoF} is not one of the tool's fluids`);
    if (/g =/.test(p.text) || ['buoyant', 'apparent', 'pressure', 'bernoulli', 'hole'].includes(p.type)) bad(!/g = 9\.8 m\/s²/.test(p.text), 'the text must state g = 9.8 m/s²');
    switch (p.type) {
      case 'density': {
        const [a, b, cc] = (p.text.match(/(\d+) cm × (\d+) cm × (\d+) cm/) || []).slice(1).map(Number);
        const V = a * b * cc * 1e-6;
        bad(!close(ans('V'), V, 1e-9), `volume ${ans('V')}, recomputed ${V}`);
        bad(!close(ans('rho'), v.m / V, 1e-9), 'density is not m / V');
        bad(step('sink').correct !== (v.m / V > v.rhoF ? 1 : 0), 'float or sink key is wrong');
        bad(Math.abs(v.m / V / v.rhoF - 1) < 0.02, 'the block is too close to the fluid\'s density to call');
        break;
      }
      case 'buoyant': {
        const side = Number((p.text.match(/A (\d+) cm cube/) || [])[1]) / 100;
        bad(!close(ans('V'), side ** 3, 1e-9), 'displaced volume is not side³');
        bad(!close(ans('Fb'), v.rhoF * side ** 3 * g, 1e-9), 'F_b is not ρ_fluid·V·g');
        bad(!(v.rhoO > v.rhoF) || step('cmp').correct !== 0, 'a sunk cube must have F_b < F_g');
        break;
      }
      case 'float': {
        bad(!(v.rhoO < v.rhoF), 'a floating object must be less dense than the fluid');
        bad(!close(ans('frac'), v.rhoO / v.rhoF, 1e-9), 'fraction is not ρ_obj / ρ_fluid');
        const side = Number((p.text.match(/A (\d+) cm cube/) || [])[1]);
        bad(!close(ans('depth'), side * v.rhoO / v.rhoF, 1e-9), 'depth is not fraction × side');
        bad(step('why').correct !== 0, 'floating at rest means F_b = F_g');
        break;
      }
      case 'apparent': {
        const Fg = v.m * g, Fb = v.rhoF * (v.m / v.rhoO) * g;
        bad(!close(ans('Fg'), Fg, 1e-9) || !close(ans('Fb'), Fb, 1e-9), 'F_g or F_b disagrees');
        bad(!close(ans('T'), Fg - Fb, 1e-9), 'scale reading is not F_g − F_b');
        bad(!(Fg - Fb > 0), 'the object must sink (the scale holds it)');
        break;
      }
      case 'pressure': {
        const d = v.H - v.above;
        bad(!(d > 0), 'the sensor must be under the surface');
        bad(!close(ans('d'), d, 1e-9), 'depth is not H − height above the bottom');
        bad(!close(ans('gauge'), v.rhoF * g * d / 1000, 1e-9), 'gauge pressure is not ρgh');
        bad(!close(ans('abs'), (ATM + v.rhoF * g * d) / 1000, 1e-9), 'absolute pressure is not P_atm + ρgh');
        break;
      }
      case 'continuity': {
        const A1 = Math.PI * (v.d1 / 100) ** 2 / 4;
        bad(!close(ans('Q'), A1 * v.v1, 1e-9), 'Q is not A₁v₁');
        bad(!close(ans('v2'), v.v1 * (v.d1 / v.d2) ** 2, 1e-9), 'v₂ is not v₁(d₁/d₂)²');
        bad(!(ans('v2') > v.v1), 'the narrow part must be faster');
        break;
      }
      case 'bernoulli': {
        const v2 = v.v1 * (v.d1 / v.d2) ** 2, P2 = v.P1 + 0.5 * 1000 * (v.v1 ** 2 - v2 ** 2) + 1000 * g * (0 - v.dy);
        bad(!close(ans('v2'), v2, 1e-9), 'v₂ disagrees with continuity');
        bad(!close(ans('P2'), P2 / 1000, 1e-9), `P₂ ${ans('P2')} kPa, recomputed ${P2 / 1000}`);
        bad(!(P2 > 20000), 'P₂ is too low for a liquid (it would cavitate)');
        bad(step('cmp').correct !== 0, 'the reason key is wrong');
        bad(v.dy > 0 !== /higher/.test(p.text), 'the text and the rise disagree');
        break;
      }
      case 'hole': {
        const h = v.H - v.yHole;
        bad(!(h > 0), 'the hole must be under the surface');
        bad(!close(ans('h'), h, 1e-9), 'depth of the hole disagrees');
        bad(!close(ans('v'), Math.sqrt(2 * g * h), 1e-9), 'v is not √(2gh)');
        break;
      }
      default: errs.push(`${w}: unknown type ${p.type}`);
    }
  }, c => c.types);
  return errs;
}
