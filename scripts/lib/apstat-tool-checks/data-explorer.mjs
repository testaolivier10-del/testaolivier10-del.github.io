/* Validator for statistics/data/tools/data-explorer.json (Data explorer), run by
   scripts/check-apstat-content.mjs. OWNED BY THIS TOOL ONLY.
   check(data, map) -> problems. It recomputes every number through the same
   model the page runs (runtime('data-explorer').model, ApStatMath.dataExplorer).
   Phase 0: the frame only (slug, kind, topic, intro, contexts). Phase 2 adds
   sweep(data, errs, gen, recheck) from _drills.mjs with an independent
   recheck of every answer through ApStatDist. */
import { frame } from './_drills.mjs';
import { runtime } from './_shared.mjs';

export function check(data, map) {
  const errs = [];
  frame(data, 'data-explorer', 'simulator', map, errs);
  const { model } = runtime('data-explorer');
  if (!model || typeof model.generate !== 'function') errs.push('statistics/assets/tools/math/data-explorer.js does not register ApStatMath.dataExplorer with a generate()');
  return errs;
}
