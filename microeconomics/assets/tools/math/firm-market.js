/* Firm and Market Lab model: ApMicroMath.firmMarket (docs/apmicro-architecture.md, "Tools").
   OWNED BY THIS TOOL ONLY (builder T2, docs/apmicro-briefs/t2.md): no other
   tool edits this file, and this tool edits no shared file. Pure functions,
   no DOM, so the validator (scripts/lib/apmicro-tool-checks/firm-market.mjs) and the
   test (scripts/test/apmicro-tool-firm-market.test.mjs) run exactly this code.

   PHASE 0 STUB (stub: true): the builder replaces it with the real model,
   generate(type, seed, ctx) -> a problem for ApMicroTools.drill, every number
   from ApMicroCalc, every graph from ApMicroGraph and every payoff matrix
   from ApMicroMatrix. */
(function(root){
  'use strict';
  if(!root.ApMicroMath) return;
  root.ApMicroMath.register('firmMarket', { stub: true, TYPES: [], generate: function(){ throw new Error('firm-market: not built yet (Phase 2)'); } });
})(typeof window !== 'undefined' ? window : globalThis);
