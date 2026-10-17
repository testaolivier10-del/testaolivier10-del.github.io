/* Validator for statistics/data/tools/design-randomizer.json (Design randomizer), run by
   scripts/check-apstat-content.mjs. OWNED BY THIS TOOL ONLY.
   check(data, map) -> problems. It recomputes every number through the same
   model the page runs (runtime('design-randomizer').model, ApStatMath.designRandomizer).
   Phase 0: the frame only (slug, kind, topic, intro, contexts). Phase 2 adds
   sweep(data, errs, gen, recheck) from _drills.mjs with an independent
   recheck of every answer through ApStatDist. */
import { frame } from './_drills.mjs';
import { runtime } from './_shared.mjs';

export function check(data, map) {
  const errs = [];
  frame(data, 'design-randomizer', 'simulator', map, errs);
  const { model } = runtime('design-randomizer');
  if (!model || typeof model.generate !== 'function') errs.push('statistics/assets/tools/math/design-randomizer.js does not register ApStatMath.designRandomizer with a generate()');
  return errs;
}
