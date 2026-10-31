/* Validator for calculus-bc/data/tools/parametric-motion.json (Parametric motion), run by
   scripts/check-apcalcbc-content.mjs. OWNED BY THIS TOOL ONLY (builder T2).
   check(data, map) -> problems. The frame now (AB's frame check, BC map); Phase 2 adds:
   300 seeded problems per context and type regenerated with the model the page runs
   (ApCalcMath.parametricMotion) and every key recomputed independently from the givens
   (never through the model), planted slips caught. */
import { frame } from '../apcalc-tool-checks/_drills.mjs';
import { runtime } from './_shared.mjs';

export function check(data, map) {
  const errs = [];
  frame(data, 'parametric-motion', 'simulator', map, errs);
  const { model } = runtime('parametric-motion');
  if (!model) errs.push('no model registered (ApCalcMath.parametricMotion)');
  else if (model.stub) errs.push('the model is still the Phase 0 stub (calculus-bc/assets/tools/math/parametric-motion.js)');
  return errs;
}
