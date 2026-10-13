/* Validator for physics/data/tools/rotation-lab.json (Rotation lab), run by
   scripts/check-apphys-content.mjs. OWNED BY THIS TOOL ONLY.
   check(data, map) -> problems. It recomputes every number through the same
   model the page runs (runtime('rotation-lab').model, ApPhysMath.rotationLab).
   Phase 0: the frame only (slug, kind, topic, intro, contexts). Phase 2 adds
   sweep(data, errs, gen, recheck) from _drills.mjs with an independent
   recheck of every answer. */
import { frame } from './_drills.mjs';
import { runtime } from './_shared.mjs';

export function check(data, map) {
  const errs = [];
  frame(data, 'rotation-lab', 'simulator', map, errs);
  const { model } = runtime('rotation-lab');
  if (!model || typeof model.generate !== 'function') errs.push('physics/assets/tools/math/rotation-lab.js does not register ApPhysMath.rotationLab with a generate()');
  return errs;
}
