/* Projectile lab model: ApPhysMath.projectileLab (docs/apphys-architecture.md, "Tools").
   OWNED BY THIS TOOL ONLY: no other tool edits this file, and this tool edits
   no shared file. Pure functions, no DOM, so the validator
   (scripts/lib/apphys-tool-checks/projectile-lab.mjs) and the test
   (scripts/test/apphys-tool-projectile-lab.test.mjs) run exactly this code.

   Loaded on physics/tools/projectile-lab.html after phys-tool-math.js (the shared
   helpers: M.C, M.g(item), M.rng(seed), M.cell, M.diagnose, M.vec, M.fmt) and
   before physics/assets/tools/projectile-lab.js.

   The shape every model keeps (Phase 0 placeholder, replaced in Phase 2):
     generate(rng, context, type?) -> { ctx, topic, text, steps, solution }
       a seeded "Test yourself" problem for ApPhysTools.drill (steps: num,
       vol, choice; see phys-tools.js)
   plus whatever the Explore scene needs (state(t, params) -> positions,
   velocities, energies...), all in SI units. */
(function(){
  'use strict';
  var M = window.ApPhysMath;
  if(!M) return;
  M.register('projectileLab', {
    // Phase 2 replaces this with the real model. It exists so the page, the
    // validator and the test have one known shape to call.
    generate: function(r, ctx){
      return { ctx: ctx.id, topic: ctx.topic, text: 'Placeholder problem.', steps: [], solution: [] };
    }
  });
})();
