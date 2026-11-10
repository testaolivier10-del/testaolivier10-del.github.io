/* Graph Studio model: ApMicroMath.graphStudio (docs/apmicro-architecture.md, "Tools").
   OWNED BY THIS TOOL ONLY (builder T1, docs/apmicro-briefs/t1.md): no other
   tool edits this file, and this tool edits no shared file. Pure functions,
   no DOM, so the validator (scripts/lib/apmicro-tool-checks/graph-studio.mjs) and the
   test (scripts/test/apmicro-tool-graph-studio.test.mjs) run exactly this code.

   PHASE 0 STUB (stub: true): the builder replaces it with the real model,
   generate(type, seed, ctx) -> a problem for ApMicroTools.drill, every number
   from ApMicroCalc, every graph from ApMicroGraph and every payoff matrix
   from ApMicroMatrix. */
(function(root){
  'use strict';
  if(!root.ApMicroMath) return;
  root.ApMicroMath.register('graphStudio', { stub: true, TYPES: [], generate: function(){ throw new Error('graph-studio: not built yet (Phase 2)'); } });
})(typeof window !== 'undefined' ? window : globalThis);
