/* Euler and logistic: the model (docs/apcalcbc-architecture.md, "Trainers"): Euler's method steps on a slope field, over or under from concavity, logistic growth with its carrying capacity and fastest-growth point.
   OWNED BY THIS TOOL ONLY (builder T3). Registers ApCalcMath.eulerLogistic; pure functions,
   no DOM, so scripts/lib/apcalcbc-tool-checks/euler-logistic.mjs runs it in node. Phase 0 stub:
   "stub: true" until Phase 2 writes generate(rng, context, type) -> a seeded problem in
   ApCalcTools.drill's format (calculus/assets/tools/calc-tools.js). Nothing is served until
   calculus-bc/data/tools/euler-logistic.json exists and its topic (eulers-method) is published. */
(function(){
  'use strict';
  var M = window.ApCalcMath;
  if(!M) return;
  M.register('eulerLogistic', {
    stub: true,
    generate: function(){ return null; }
  });
})();
