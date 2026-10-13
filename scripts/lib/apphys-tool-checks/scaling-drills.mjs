/* Validator for physics/data/tools/scaling-drills.json (Scaling drills), run by
   scripts/check-apphys-content.mjs. OWNED BY THIS TOOL ONLY.
   check(data, map) -> problems. It recomputes every number through the same
   model the page runs (runtime('scaling-drills').model, ApPhysMath.scalingDrills).
   Phase 0: the frame only (slug, kind, topic, intro, contexts). Phase 2 adds
   sweep(data, errs, gen, recheck) from _drills.mjs with an independent
   recheck of every answer. */
import { frame } from './_drills.mjs';
import { runtime } from './_shared.mjs';

export function check(data, map) {
  const errs = [];
  frame(data, 'scaling-drills', 'skill', map, errs);
  const { model } = runtime('scaling-drills');
  if (!model || typeof model.generate !== 'function') errs.push('physics/assets/tools/math/scaling-drills.js does not register ApPhysMath.scalingDrills with a generate()');
  return errs;
}
