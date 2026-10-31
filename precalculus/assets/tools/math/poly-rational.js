/* Polynomials and rationals model: ApPrecalcMath.polyRational (docs/apprecalc-architecture.md, "Tools").
   OWNED BY THIS TOOL ONLY (docs/apprecalc-briefs/t2.md): no other tool edits this
   file, and this tool edits no shared file. Pure functions, no DOM, so the
   validator (scripts/lib/apprecalc-tool-checks/poly-rational.mjs) and the test
   (scripts/test/apprecalc-tool-poly-rational.test.mjs) run exactly this code.

   PHASE 0 STUB (stub: true). Builder T2 replaces it in Phase 2 with the model:
   the data the page explores and generate(rng, ctx, type) -> { ctx, topic,
   type, text, steps, solution, given } for the "Test yourself" drill. Spec:
   docs/apprecalc-spec.md section 6. */
(function(G){
  'use strict';
  var M = G.ApPrecalcMath;
  if(!M) return;
  M.register('polyRational', { stub: true });
})(typeof window !== 'undefined' ? window : globalThis);
