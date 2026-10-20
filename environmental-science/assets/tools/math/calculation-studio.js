/* Calculation studio model: ApEnvMath.calculationStudio (docs/apenv-architecture.md, "Tools").
   OWNED BY THIS TOOL ONLY (builder T1, docs/apenv-briefs/t1.md): no
   other tool edits this file, and this tool edits no shared file. Pure
   functions, no DOM, so the validator (scripts/lib/apenv-tool-checks/calculation-studio.mjs)
   and the test (scripts/test/apenv-tool-calculation-studio.test.mjs) run exactly this code.

   Loaded on environmental-science/tools/calculation-studio.html after env-expr.js
   (ApEnvExpr), env-calc.js (ApEnvCalc), env-grade.js (ApEnvGrade) and
   tools/env-tool-math.js (M.rng, M.cell, M.unitCell, M.setupCell), and before
   environmental-science/assets/tools/calculation-studio.js.

   PHASE 0 STUB. Phase 2 writes the model: setup and unit drills of every calculation type in spec section 7; a dimensional-analysis chain; scale words and "in what year" follow-ups.
   Every number a drill shows comes from ApEnvCalc (M.Calc()), never typed.
   Drills
     generate(rng, context, type) -> { ctx, topic, type, text, steps, solution } */
(function(G){
  'use strict';
  var M = G.ApEnvMath;
  if(!M) return;
  M.register('calculationStudio', {
    stub: true,
    TYPES: [],
    generate: function(){ throw new Error('calculation-studio: the model is a Phase 0 stub; Phase 2 writes it'); }
  });
})(typeof window !== 'undefined' ? window : globalThis);
