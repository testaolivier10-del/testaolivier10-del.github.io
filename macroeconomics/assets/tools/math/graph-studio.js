/* Graph studio model: ApMacroMath.graphStudio (docs/apmacro-architecture.md, "Tools").
   OWNED BY THIS TOOL ONLY (builder T1, docs/apmacro-briefs/t1.md): no other
   tool edits this file, and this tool edits no shared file. Pure functions,
   no DOM, so the validator (scripts/lib/apmacro-tool-checks/graph-studio.mjs) and the
   test (scripts/test/apmacro-tool-graph-studio.test.mjs) run exactly this code.

   PHASE 0 STUB (stub: true): the builder replaces it with the real model,
   generate(type, seed, ctx) -> a problem for ApMacroTools.drill, every number
   from ApMacroCalc and every graph from ApMacroGraph. */
(function(root){
  'use strict';
  if(!root.ApMacroMath) return;
  root.ApMacroMath.register('graphStudio', { stub: true, TYPES: [], generate: function(){ throw new Error('graph-studio: not built yet (Phase 2)'); } });
})(typeof window !== 'undefined' ? window : globalThis);
