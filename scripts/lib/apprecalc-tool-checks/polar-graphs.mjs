/* Validator for precalculus/data/tools/polar-graphs.json (Polar graphs), run by
   scripts/check-apprecalc-content.mjs. OWNED BY THIS TOOL ONLY (builder T4).
   check(data, map) -> problems.

   PHASE 0: the frame only (slug, kind, topic, intro, howItWorks, contexts,
   trademark). Phase 2 adds: every problem the drill can generate
   (300 seeds per context and type, scripts/lib/apprecalc-tool-checks/_drills.mjs)
   recomputed independently of the model, every key graded right, every
   authored slip graded wrong, and the tool's own rules
   (docs/apprecalc-briefs/tools-common.md). The data file does not exist
   yet, so this runs only once a builder adds it. */
import { frame } from './_drills.mjs';
import { runtime } from './_shared.mjs';

export function check(data, map) {
  const errs = [];
  frame(data, 'polar-graphs', 'simulator', map, errs);
  const { model } = runtime('polar-graphs');
  if (!model) errs.push('the model ApPrecalcMath.polarGraphs is not registered (precalculus/assets/tools/math/polar-graphs.js)');
  else if (model.stub) errs.push('the model is still the Phase 0 stub: build it before adding data (docs/apprecalc-briefs/t4.md)');
  return errs;
}
