/* Externality Lab model: ApMicroMath.externalityLab (docs/apmicro-architecture.md, "Tools").
   OWNED BY THIS TOOL ONLY (builder T4, docs/apmicro-briefs/t4.md): no other
   tool edits this file, and this tool edits no shared file. Pure functions,
   no DOM, so the validator (scripts/lib/apmicro-tool-checks/externality-lab.mjs) and the
   test (scripts/test/apmicro-tool-externality-lab.test.mjs) run exactly this code.

   PHASE 0 STUB (stub: true): the builder replaces it with the real model,
   generate(type, seed, ctx) -> a problem for ApMicroTools.drill, every number
   from ApMicroCalc, every graph from ApMicroGraph and every payoff matrix
   from ApMicroMatrix. */
(function(root){
  'use strict';
  if(!root.ApMicroMath) return;
  root.ApMicroMath.register('externalityLab', { stub: true, TYPES: [], generate: function(){ throw new Error('externality-lab: not built yet (Phase 2)'); } });
})(typeof window !== 'undefined' ? window : globalThis);
