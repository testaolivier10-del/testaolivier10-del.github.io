/* Validator for physics/data/tools/projectile-lab.json (Projectile lab), run by
   scripts/check-apphys-content.mjs. OWNED BY THIS TOOL ONLY.
   check(data, map) -> problems. It recomputes every number through the same
   model the page runs (runtime('projectile-lab').model, ApPhysMath.projectileLab).
   Phase 0: the frame only (slug, kind, topic, intro, contexts). Phase 2 adds
   sweep(data, errs, gen, recheck) from _drills.mjs with an independent
   recheck of every answer. */
import { frame } from './_drills.mjs';
import { runtime } from './_shared.mjs';

export function check(data, map) {
  const errs = [];
  frame(data, 'projectile-lab', 'simulator', map, errs);
  const { model } = runtime('projectile-lab');
  if (!model || typeof model.generate !== 'function') errs.push('physics/assets/tools/math/projectile-lab.js does not register ApPhysMath.projectileLab with a generate()');
  return errs;
}
