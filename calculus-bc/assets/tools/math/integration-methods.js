/* Integration methods: the model (docs/apcalcbc-architecture.md, "Trainers"): parts (tabular too), linear partial fractions, improper integrals as limits, choosing the method.
   OWNED BY THIS TOOL ONLY (builder T3). Registers ApCalcMath.integrationMethods; pure functions,
   no DOM, so scripts/lib/apcalcbc-tool-checks/integration-methods.mjs runs it in node. Phase 0 stub:
   "stub: true" until Phase 2 writes generate(rng, context, type) -> a seeded problem in
   ApCalcTools.drill's format (calculus/assets/tools/calc-tools.js). Nothing is served until
   calculus-bc/data/tools/integration-methods.json exists and its topic (integration-by-parts) is published. */
(function(){
  'use strict';
  var M = window.ApCalcMath;
  if(!M) return;
  M.register('integrationMethods', {
    stub: true,
    generate: function(){ return null; }
  });
})();
