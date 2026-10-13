/* Validator for physics/data/tools/collision-lab.json (Collision lab), run by
   scripts/check-apphys-content.mjs. OWNED BY THIS TOOL ONLY.
   check(data, map) -> problems. It recomputes every number through the same
   model the page runs (runtime('collision-lab').model, ApPhysMath.collisionLab).
   Phase 0: the frame only (slug, kind, topic, intro, contexts). Phase 2 adds
   sweep(data, errs, gen, recheck) from _drills.mjs with an independent
   recheck of every answer. */
import { frame } from './_drills.mjs';
import { runtime } from './_shared.mjs';

export function check(data, map) {
  const errs = [];
  frame(data, 'collision-lab', 'simulator', map, errs);
  const { model } = runtime('collision-lab');
  if (!model || typeof model.generate !== 'function') errs.push('physics/assets/tools/math/collision-lab.js does not register ApPhysMath.collisionLab with a generate()');
  return errs;
}
