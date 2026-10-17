/* Validator for statistics/data/tools/distribution-areas.json (Distribution areas), run by
   scripts/check-apstat-content.mjs. OWNED BY THIS TOOL ONLY.
   check(data, map) -> problems. It recomputes every number through the same
   model the page runs (runtime('distribution-areas').model, ApStatMath.distributionAreas).
   Phase 0: the frame only (slug, kind, topic, intro, contexts). Phase 2 adds
   sweep(data, errs, gen, recheck) from _drills.mjs with an independent
   recheck of every answer through ApStatDist. */
import { frame } from './_drills.mjs';
import { runtime } from './_shared.mjs';

export function check(data, map) {
  const errs = [];
  frame(data, 'distribution-areas', 'simulator', map, errs);
  const { model } = runtime('distribution-areas');
  if (!model || typeof model.generate !== 'function') errs.push('statistics/assets/tools/math/distribution-areas.js does not register ApStatMath.distributionAreas with a generate()');
  return errs;
}
