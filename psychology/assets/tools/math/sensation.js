/* Sensation and perception model: ApPsychMath.sensation (docs/appsych-architecture.md, "Tools").
   OWNED BY THIS TOOL ONLY (docs/appsych-briefs/): no other tool edits this
   file, and this tool edits no shared file. Pure functions, no DOM, so the
   validator (scripts/lib/appsych-tool-checks/sensation.mjs) and the test
   (scripts/test/appsych-tool-sensation.test.mjs) run exactly this code.

   Phase 0 stub: registers the name so the page, the validator and the test
   are wired; Phase 2 replaces it with the model and generate(rng, ctx, type)
   (every number from ApPsychStats, never typed). */
(function(G){
  'use strict';
  var M = G.ApPsychMath;
  if(!M) return;
  M.register('sensation', { stub: true, TYPES: [] });
})(typeof window !== 'undefined' ? window : globalThis);
