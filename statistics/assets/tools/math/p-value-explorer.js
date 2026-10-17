/* p-value explorer model: ApStatMath.pValueExplorer (docs/apstat-architecture.md, "Tools").
   OWNED BY THIS TOOL ONLY: no other tool edits this file, and this tool edits
   no shared file. Pure functions, no DOM, so the validator
   (scripts/lib/apstat-tool-checks/p-value-explorer.mjs) and the test
   (scripts/test/apstat-tool-p-value-explorer.test.mjs) run exactly this code.

   Loaded on statistics/tools/p-value-explorer.html after stat-expr.js (ApStatExpr),
   stat-dist.js (ApStatDist) and stat-tool-math.js (the shared helpers:
   M.rng(seed), M.cell, M.diagnose, samplers) and before
   statistics/assets/tools/p-value-explorer.js.

   The shape every model keeps (Phase 0 placeholder, replaced in Phase 2):
     generate(rng, context, type?) -> { ctx, topic, text, steps, solution }
       a seeded "Test yourself" problem for ApStatTools.drill (steps: num,
       choice; see stat-tools.js)
   plus whatever the Explore view needs, all pure. Every number comes from
   ApStatDist; simulations use the seeded generator. */
(function(){
  'use strict';
  var M = window.ApStatMath;
  if(!M) return;
  M.register('pValueExplorer', {
    // Phase 2 replaces this with the real model. It exists so the page, the
    // validator and the test have one known shape to call.
    generate: function(r, ctx){
      return { ctx: ctx.id, topic: ctx.topic, text: 'Placeholder problem.', steps: [], solution: [] };
    }
  });
})();
