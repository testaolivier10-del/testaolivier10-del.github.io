/* Validator for calculus/data/tools/curve-analyzer.json (Curve analyzer), run by
   scripts/check-apcalc-content.mjs. OWNED BY THIS TOOL ONLY.
   check(data, map) -> problems. It recomputes every number through the same
   model the page runs (runtime('curve-analyzer').model, ApCalcMath.curveAnalyzer).
   Phase 0: the frame only (slug, kind, topic, intro, contexts). Phase 2 adds
   sweep(data, errs, gen, recheck) from _drills.mjs with an independent
   recheck of every answer (ApCalcMath.integral, deriv, root). */
import { frame } from './_drills.mjs';
import { runtime } from './_shared.mjs';

export function check(data, map) {
  const errs = [];
  frame(data, 'curve-analyzer', 'simulator', map, errs);
  const { model } = runtime('curve-analyzer');
  if (!model || typeof model.generate !== 'function') errs.push('calculus/assets/tools/math/curve-analyzer.js does not register ApCalcMath.curveAnalyzer with a generate()');
  return errs;
}
