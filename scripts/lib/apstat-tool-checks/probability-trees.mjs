/* Validator for statistics/data/tools/probability-trees.json (Probability trees), run by
   scripts/check-apstat-content.mjs. OWNED BY THIS TOOL ONLY.
   check(data, map) -> problems. It recomputes every number through the same
   model the page runs (runtime('probability-trees').model, ApStatMath.probabilityTrees).
   Phase 0: the frame only (slug, kind, topic, intro, contexts). Phase 2 adds
   sweep(data, errs, gen, recheck) from _drills.mjs with an independent
   recheck of every answer through ApStatDist. */
import { frame } from './_drills.mjs';
import { runtime } from './_shared.mjs';

export function check(data, map) {
  const errs = [];
  frame(data, 'probability-trees', 'simulator', map, errs);
  const { model } = runtime('probability-trees');
  if (!model || typeof model.generate !== 'function') errs.push('statistics/assets/tools/math/probability-trees.js does not register ApStatMath.probabilityTrees with a generate()');
  return errs;
}
