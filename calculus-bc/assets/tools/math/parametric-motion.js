/* Parametric motion: the model (docs/apcalcbc-architecture.md, "Trainers"): a particle traced by (x(t), y(t)) or a vector function: velocity and acceleration vectors, speed, distance by arc length, dy/dx and d2y/dx2.
   OWNED BY THIS TOOL ONLY (builder T2). Registers ApCalcMath.parametricMotion; pure functions,
   no DOM, so scripts/lib/apcalcbc-tool-checks/parametric-motion.mjs runs it in node. Phase 0 stub:
   "stub: true" until Phase 2 writes generate(rng, context, type) -> a seeded problem in
   ApCalcTools.drill's format (calculus/assets/tools/calc-tools.js). Nothing is served until
   calculus-bc/data/tools/parametric-motion.json exists and its topic (parametric-derivatives) is published. */
(function(){
  'use strict';
  var M = window.ApCalcMath;
  if(!M) return;
  M.register('parametricMotion', {
    stub: true,
    generate: function(){ return null; }
  });
})();
