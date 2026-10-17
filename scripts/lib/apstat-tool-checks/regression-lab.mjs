/* Validator for statistics/data/tools/regression-lab.json (Regression lab), run by
   scripts/check-apstat-content.mjs. OWNED BY THIS TOOL ONLY.
   check(data, map) -> problems. It recomputes every number through the same
   model the page runs (runtime('regression-lab').model, ApStatMath.regressionLab).
   Phase 0: the frame only (slug, kind, topic, intro, contexts). Phase 2 adds
   sweep(data, errs, gen, recheck) from _drills.mjs with an independent
   recheck of every answer through ApStatDist. */
import { frame } from './_drills.mjs';
import { runtime } from './_shared.mjs';

export function check(data, map) {
  const errs = [];
  frame(data, 'regression-lab', 'simulator', map, errs);
  const { model } = runtime('regression-lab');
  if (!model || typeof model.generate !== 'function') errs.push('statistics/assets/tools/math/regression-lab.js does not register ApStatMath.regressionLab with a generate()');
  return errs;
}
