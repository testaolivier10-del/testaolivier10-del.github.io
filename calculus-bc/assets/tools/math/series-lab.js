/* Series lab: the model (docs/apcalcbc-architecture.md, "Trainers"): choose and justify a convergence test, partial sums plotted against the limit, interval of convergence with both endpoints checked.
   OWNED BY THIS TOOL ONLY (builder T1). Registers ApCalcMath.seriesLab; pure functions,
   no DOM, so scripts/lib/apcalcbc-tool-checks/series-lab.mjs runs it in node. Phase 0 stub:
   "stub: true" until Phase 2 writes generate(rng, context, type) -> a seeded problem in
   ApCalcTools.drill's format (calculus/assets/tools/calc-tools.js). Nothing is served until
   calculus-bc/data/tools/series-lab.json exists and its topic (series-convergence) is published. */
(function(){
  'use strict';
  var M = window.ApCalcMath;
  if(!M) return;
  M.register('seriesLab', {
    stub: true,
    generate: function(){ return null; }
  });
})();
