/* Energy chain model: ApEnvMath.energyChain (docs/apenv-architecture.md, "Tools").
   OWNED BY THIS TOOL ONLY (builder T3, docs/apenv-briefs/t3.md): no
   other tool edits this file, and this tool edits no shared file. Pure
   functions, no DOM, so the validator (scripts/lib/apenv-tool-checks/energy-chain.mjs)
   and the test (scripts/test/apenv-tool-energy-chain.test.mjs) run exactly this code.

   Loaded on environmental-science/tools/energy-chain.html after env-expr.js
   (ApEnvExpr), env-calc.js (ApEnvCalc), env-grade.js (ApEnvGrade) and
   tools/env-tool-math.js (M.rng, M.cell, M.unitCell, M.setupCell), and before
   environmental-science/assets/tools/energy-chain.js.

   PHASE 0 STUB. Phase 2 writes the model: a power plant fuel to outlet with efficiencies; sources compared; kWh, BTU and CO2.
   Every number a drill shows comes from ApEnvCalc (M.Calc()), never typed.
   Drills
     generate(rng, context, type) -> { ctx, topic, type, text, steps, solution } */
(function(G){
  'use strict';
  var M = G.ApEnvMath;
  if(!M) return;
  M.register('energyChain', {
    stub: true,
    TYPES: [],
    generate: function(){ throw new Error('energy-chain: the model is a Phase 0 stub; Phase 2 writes it'); }
  });
})(typeof window !== 'undefined' ? window : globalThis);
