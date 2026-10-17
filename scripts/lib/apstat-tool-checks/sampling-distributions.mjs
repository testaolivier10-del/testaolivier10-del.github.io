/* Validator for statistics/data/tools/sampling-distributions.json (Sampling distributions), run by
   scripts/check-apstat-content.mjs. OWNED BY THIS TOOL ONLY.
   check(data, map) -> problems. It recomputes every number through the same
   model the page runs (runtime('sampling-distributions').model, ApStatMath.samplingDistributions).
   Phase 0: the frame only (slug, kind, topic, intro, contexts). Phase 2 adds
   sweep(data, errs, gen, recheck) from _drills.mjs with an independent
   recheck of every answer through ApStatDist. */
import { frame } from './_drills.mjs';
import { runtime } from './_shared.mjs';

export function check(data, map) {
  const errs = [];
  frame(data, 'sampling-distributions', 'simulator', map, errs);
  const { model } = runtime('sampling-distributions');
  if (!model || typeof model.generate !== 'function') errs.push('statistics/assets/tools/math/sampling-distributions.js does not register ApStatMath.samplingDistributions with a generate()');
  return errs;
}
