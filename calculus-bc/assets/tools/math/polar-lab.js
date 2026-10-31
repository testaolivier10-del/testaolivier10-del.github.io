/* Polar lab: the model (docs/apcalcbc-architecture.md, "Trainers"): polar curves drawn as theta sweeps, area swept shaded, area between curves, dy/dx in polar, r and dr/dtheta sign readings.
   OWNED BY THIS TOOL ONLY (builder T2). Registers ApCalcMath.polarLab; pure functions,
   no DOM, so scripts/lib/apcalcbc-tool-checks/polar-lab.mjs runs it in node. Phase 0 stub:
   "stub: true" until Phase 2 writes generate(rng, context, type) -> a seeded problem in
   ApCalcTools.drill's format (calculus/assets/tools/calc-tools.js). Nothing is served until
   calculus-bc/data/tools/polar-lab.json exists and its topic (polar-derivatives) is published. */
(function(){
  'use strict';
  var M = window.ApCalcMath;
  if(!M) return;
  M.register('polarLab', {
    stub: true,
    generate: function(){ return null; }
  });
})();
