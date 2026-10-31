/* Validator for calculus-bc/data/tools/polar-lab.json (Polar lab), run by
   scripts/check-apcalcbc-content.mjs. OWNED BY THIS TOOL ONLY (builder T2).
   check(data, map) -> problems. The frame now (AB's frame check, BC map); Phase 2 adds:
   300 seeded problems per context and type regenerated with the model the page runs
   (ApCalcMath.polarLab) and every key recomputed independently from the givens
   (never through the model), planted slips caught. */
import { frame } from '../apcalc-tool-checks/_drills.mjs';
import { runtime } from './_shared.mjs';

export function check(data, map) {
  const errs = [];
  frame(data, 'polar-lab', 'simulator', map, errs);
  const { model } = runtime('polar-lab');
  if (!model) errs.push('no model registered (ApCalcMath.polarLab)');
  else if (model.stub) errs.push('the model is still the Phase 0 stub (calculus-bc/assets/tools/math/polar-lab.js)');
  return errs;
}
