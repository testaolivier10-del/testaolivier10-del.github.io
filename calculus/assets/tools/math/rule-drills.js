/* Rule drills model: ApCalcMath.ruleDrills (docs/apcalc-architecture.md, "Tools").
   OWNED BY THIS TOOL ONLY: no other tool edits this file, and this tool edits
   no shared file. Pure functions, no DOM, so the validator
   (scripts/lib/apcalc-tool-checks/rule-drills.mjs) and the test
   (scripts/test/apcalc-tool-rule-drills.test.mjs) run exactly this code.

   Loaded on calculus/tools/rule-drills.html after calc-expr.js (ApCalcExpr) and
   calc-tool-math.js (the shared helpers: M.rng(seed), M.cell, M.diagnose,
   M.exprCell, M.diagnoseExpr, M.fn, M.deriv, M.integral, M.riemann,
   M.root, M.extrema) and before calculus/assets/tools/rule-drills.js.

   The shape every model keeps (Phase 0 placeholder, replaced in Phase 2):
     generate(rng, context, type?) -> { ctx, topic, text, steps, solution }
       a seeded "Test yourself" problem for ApCalcTools.drill (steps: num,
       expr, choice; see calc-tools.js)
   plus whatever the Explore view needs (curves as expression strings for
   ApCalcPlot.svg, values at a point), all pure. */
(function(){
  'use strict';
  var M = window.ApCalcMath;
  if(!M) return;
  M.register('ruleDrills', {
    // Phase 2 replaces this with the real model. It exists so the page, the
    // validator and the test have one known shape to call.
    generate: function(r, ctx){
      return { ctx: ctx.id, topic: ctx.topic, text: 'Placeholder problem.', steps: [], solution: [] };
    }
  });
})();
