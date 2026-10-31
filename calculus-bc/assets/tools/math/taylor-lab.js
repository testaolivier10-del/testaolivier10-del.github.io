/* Taylor lab: the model (docs/apcalcbc-architecture.md, "Trainers"): Taylor and Maclaurin polynomials wrapping f as terms are added, a center slider, Lagrange and alternating error bounds drawn as a band.
   OWNED BY THIS TOOL ONLY (builder T1). Registers ApCalcMath.taylorLab; pure functions,
   no DOM, so scripts/lib/apcalcbc-tool-checks/taylor-lab.mjs runs it in node. Phase 0 stub:
   "stub: true" until Phase 2 writes generate(rng, context, type) -> a seeded problem in
   ApCalcTools.drill's format (calculus/assets/tools/calc-tools.js). Nothing is served until
   calculus-bc/data/tools/taylor-lab.json exists and its topic (taylor-polynomials) is published. */
(function(){
  'use strict';
  var M = window.ApCalcMath;
  if(!M) return;
  M.register('taylorLab', {
    stub: true,
    generate: function(){ return null; }
  });
})();
