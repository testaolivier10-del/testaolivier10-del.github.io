/* Skills tool: Hardy-Weinberg allele and genotype frequencies. The solver and the seeded problem generator are
   ApBioProblems.solve.hw and generate.hw (bio-skill-problems.js);
   the contexts, the fixed problems and the formula box are data
   (bio/data/tools/hardy-weinberg.json); the page is ApBioTools.skillTool. */
(function(){
  'use strict';
  var T = window.ApBioTools;
  if(!T) return;
  T.mount('hardy-weinberg', function(app, data){ T.skillTool(app, data, { slug: 'hardy-weinberg', kind: 'hw' }); });
})();
