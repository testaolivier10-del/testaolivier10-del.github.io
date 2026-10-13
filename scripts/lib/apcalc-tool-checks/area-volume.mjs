/* Validator for calculus/data/tools/area-volume.json (Area and volume), run by
   scripts/check-apcalc-content.mjs. OWNED BY THIS TOOL ONLY.
   check(data, map) -> problems. It recomputes every number through the same
   model the page runs (runtime('area-volume').model, ApCalcMath.areaVolume).
   Phase 0: the frame only (slug, kind, topic, intro, contexts). Phase 2 adds
   sweep(data, errs, gen, recheck) from _drills.mjs with an independent
   recheck of every answer (ApCalcMath.integral, deriv, root). */
import { frame } from './_drills.mjs';
import { runtime } from './_shared.mjs';

export function check(data, map) {
  const errs = [];
  frame(data, 'area-volume', 'simulator', map, errs);
  const { model } = runtime('area-volume');
  if (!model || typeof model.generate !== 'function') errs.push('calculus/assets/tools/math/area-volume.js does not register ApCalcMath.areaVolume with a generate()');
  return errs;
}
