/* Validator for physics/data/tools/lab-design.json (Lab design), run by
   scripts/check-apphys-content.mjs. OWNED BY THIS TOOL ONLY.
   check(data, map) -> problems. It recomputes every number through the same
   model the page runs (runtime('lab-design').model, ApPhysMath.labDesign).
   Phase 0: the frame only (slug, kind, topic, intro, contexts). Phase 2 adds
   sweep(data, errs, gen, recheck) from _drills.mjs with an independent
   recheck of every answer. */
import { frame } from './_drills.mjs';
import { runtime } from './_shared.mjs';

export function check(data, map) {
  const errs = [];
  frame(data, 'lab-design', 'simulator', map, errs);
  const { model } = runtime('lab-design');
  if (!model || typeof model.generate !== 'function') errs.push('physics/assets/tools/math/lab-design.js does not register ApPhysMath.labDesign with a generate()');
  return errs;
}
