/* Data explorer model: ApStatMath.dataExplorer (docs/apstat-architecture.md, "Tools").
   OWNED BY THIS TOOL ONLY: no other tool edits this file, and this tool edits
   no shared file. Pure functions, no DOM, so the validator
   (scripts/lib/apstat-tool-checks/data-explorer.mjs) and the test
   (scripts/test/apstat-tool-data-explorer.test.mjs) run exactly this code.

   Loaded on statistics/tools/data-explorer.html after stat-expr.js (ApStatExpr),
   stat-dist.js (ApStatDist) and stat-tool-math.js (the shared helpers:
   M.rng(seed), M.cell, M.diagnose, samplers) and before
   statistics/assets/tools/data-explorer.js.

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
  M.register('dataExplorer', {
    // Phase 2 replaces this with the real model. It exists so the page, the
    // validator and the test have one known shape to call.
    generate: function(r, ctx){
      return { ctx: ctx.id, topic: ctx.topic, text: 'Placeholder problem.', steps: [], solution: [] };
    }
  });
})();
