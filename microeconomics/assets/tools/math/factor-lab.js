/* Factor Market Lab model: ApMicroMath.factorLab (docs/apmicro-architecture.md, "Tools").
   OWNED BY THIS TOOL ONLY (builder T4, docs/apmicro-briefs/t4.md): no other
   tool edits this file, and this tool edits no shared file. Pure functions,
   no DOM, so the validator (scripts/lib/apmicro-tool-checks/factor-lab.mjs) and the
   test (scripts/test/apmicro-tool-factor-lab.test.mjs) run exactly this code.

   PHASE 0 STUB (stub: true): the builder replaces it with the real model,
   generate(type, seed, ctx) -> a problem for ApMicroTools.drill, every number
   from ApMicroCalc, every graph from ApMicroGraph and every payoff matrix
   from ApMicroMatrix. */
(function(root){
  'use strict';
  if(!root.ApMicroMath) return;
  root.ApMicroMath.register('factorLab', { stub: true, TYPES: [], generate: function(){ throw new Error('factor-lab: not built yet (Phase 2)'); } });
})(typeof window !== 'undefined' ? window : globalThis);
