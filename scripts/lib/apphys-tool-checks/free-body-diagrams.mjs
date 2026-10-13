/* Validator for physics/data/tools/free-body-diagrams.json (Free-body diagrams), run by
   scripts/check-apphys-content.mjs. OWNED BY THIS TOOL ONLY.
   check(data, map) -> problems. It recomputes every number through the same
   model the page runs (runtime('free-body-diagrams').model, ApPhysMath.freeBodyDiagrams).
   Phase 0: the frame only (slug, kind, topic, intro, contexts). Phase 2 adds
   sweep(data, errs, gen, recheck) from _drills.mjs with an independent
   recheck of every answer. */
import { frame } from './_drills.mjs';
import { runtime } from './_shared.mjs';

export function check(data, map) {
  const errs = [];
  frame(data, 'free-body-diagrams', 'simulator', map, errs);
  const { model } = runtime('free-body-diagrams');
  if (!model || typeof model.generate !== 'function') errs.push('physics/assets/tools/math/free-body-diagrams.js does not register ApPhysMath.freeBodyDiagrams with a generate()');
  return errs;
}
