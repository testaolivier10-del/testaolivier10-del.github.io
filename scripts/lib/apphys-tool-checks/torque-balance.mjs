/* Validator for physics/data/tools/torque-balance.json (Torque balance), run by
   scripts/check-apphys-content.mjs. OWNED BY THIS TOOL ONLY.
   check(data, map) -> problems. It recomputes every number through the same
   model the page runs (runtime('torque-balance').model, ApPhysMath.torqueBalance).
   Phase 0: the frame only (slug, kind, topic, intro, contexts). Phase 2 adds
   sweep(data, errs, gen, recheck) from _drills.mjs with an independent
   recheck of every answer. */
import { frame } from './_drills.mjs';
import { runtime } from './_shared.mjs';

export function check(data, map) {
  const errs = [];
  frame(data, 'torque-balance', 'simulator', map, errs);
  const { model } = runtime('torque-balance');
  if (!model || typeof model.generate !== 'function') errs.push('physics/assets/tools/math/torque-balance.js does not register ApPhysMath.torqueBalance with a generate()');
  return errs;
}
