/* Scale lab model: ApHugMath.scaleLab (docs/aphug-architecture.md, "Tools").
   OWNED BY THIS TOOL ONLY (builder T2, docs/aphug-briefs/t2.md): no other
   tool edits this file, and this tool edits no shared file. Pure functions,
   no DOM, so the validator (scripts/lib/aphug-tool-checks/scale-lab.mjs) and the
   test (scripts/test/aphug-tool-scale-lab.test.mjs) run exactly this code.

   PHASE 0 STUB (stub: true): the builder replaces it with the real model,
   generate(type, seed, ctx) -> a problem for ApHugTools.drill, every number
   from ApHugCalc, every map from ApHugMap and every model from ApHugModel. */
(function(root){
  'use strict';
  if(!root.ApHugMath) return;
  root.ApHugMath.register('scaleLab', { stub: true, TYPES: [], generate: function(){ throw new Error('scale-lab: not built yet (Phase 2)'); } });
})(typeof window !== 'undefined' ? window : globalThis);
