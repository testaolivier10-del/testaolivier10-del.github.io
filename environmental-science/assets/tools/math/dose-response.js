/* Dose and response model: ApEnvMath.doseResponse (docs/apenv-architecture.md, "Tools").
   OWNED BY THIS TOOL ONLY (builder T4, docs/apenv-briefs/t4.md): no
   other tool edits this file, and this tool edits no shared file. Pure
   functions, no DOM, so the validator (scripts/lib/apenv-tool-checks/dose-response.mjs)
   and the test (scripts/test/apenv-tool-dose-response.test.mjs) run exactly this code.

   Loaded on environmental-science/tools/dose-response.html after env-expr.js
   (ApEnvExpr), env-calc.js (ApEnvCalc), env-grade.js (ApEnvGrade) and
   tools/env-tool-math.js (M.rng, M.cell, M.unitCell, M.setupCell), and before
   environmental-science/assets/tools/dose-response.js.

   PHASE 0 STUB. Phase 2 writes the model: LD50 and threshold read off a curve; toxicity compared; bioaccumulation vs biomagnification.
   Every number a drill shows comes from ApEnvCalc (M.Calc()), never typed.
   Drills
     generate(rng, context, type) -> { ctx, topic, type, text, steps, solution } */
(function(G){
  'use strict';
  var M = G.ApEnvMath;
  if(!M) return;
  M.register('doseResponse', {
    stub: true,
    TYPES: [],
    generate: function(){ throw new Error('dose-response: the model is a Phase 0 stub; Phase 2 writes it'); }
  });
})(typeof window !== 'undefined' ? window : globalThis);
