/* Map reader model: ApHugMath.mapReader (docs/aphug-architecture.md, "Tools").
   OWNED BY THIS TOOL ONLY (builder T3, docs/aphug-briefs/t3.md): no other
   tool edits this file, and this tool edits no shared file. Pure functions,
   no DOM, so the validator (scripts/lib/aphug-tool-checks/map-reader.mjs) and the
   test (scripts/test/aphug-tool-map-reader.test.mjs) run exactly this code.

   PHASE 0 STUB (stub: true): the builder replaces it with the real model,
   generate(type, seed, ctx) -> a problem for ApHugTools.drill, every number
   from ApHugCalc, every map from ApHugMap and every model from ApHugModel. */
(function(root){
  'use strict';
  if(!root.ApHugMath) return;
  root.ApHugMath.register('mapReader', { stub: true, TYPES: [], generate: function(){ throw new Error('map-reader: not built yet (Phase 2)'); } });
})(typeof window !== 'undefined' ? window : globalThis);
