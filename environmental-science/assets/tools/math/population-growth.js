/* Population growth model: ApEnvMath.populationGrowth (docs/apenv-architecture.md, "Tools").
   OWNED BY THIS TOOL ONLY (builder T1, docs/apenv-briefs/t1.md): no
   other tool edits this file, and this tool edits no shared file. Pure
   functions, no DOM, so the validator (scripts/lib/apenv-tool-checks/population-growth.mjs)
   and the test (scripts/test/apenv-tool-population-growth.test.mjs) run exactly this code.

   Loaded on environmental-science/tools/population-growth.html after env-expr.js
   (ApEnvExpr), env-calc.js (ApEnvCalc), env-grade.js (ApEnvGrade) and
   tools/env-tool-math.js (M.rng, M.cell, M.unitCell, M.setupCell), and before
   environmental-science/assets/tools/population-growth.js.

   PHASE 0 STUB. Phase 2 writes the model: exponential vs logistic, r and K, overshoot, survivorship curves, rule of 70.
   Every number a drill shows comes from ApEnvCalc (M.Calc()), never typed.
   Drills
     generate(rng, context, type) -> { ctx, topic, type, text, steps, solution } */
(function(G){
  'use strict';
  var M = G.ApEnvMath;
  if(!M) return;
  M.register('populationGrowth', {
    stub: true,
    TYPES: [],
    generate: function(){ throw new Error('population-growth: the model is a Phase 0 stub; Phase 2 writes it'); }
  });
})(typeof window !== 'undefined' ? window : globalThis);
