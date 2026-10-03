/* Skills tool: mean, median, range, standard deviation (n − 1) and standard error. The solver and the seeded problem generator are
   ApBioProblems.solve.descriptive and generate.descriptive (bio-skill-problems.js);
   the contexts, the fixed problems and the formula box are data
   (bio/data/tools/descriptive-stats.json); the page is ApBioTools.skillTool. */
(function(){
  'use strict';
  var T = window.ApBioTools;
  if(!T) return;
  T.mount('descriptive-stats', function(app, data){ T.skillTool(app, data, { slug: 'descriptive-stats', kind: 'descriptive' }); });
})();
