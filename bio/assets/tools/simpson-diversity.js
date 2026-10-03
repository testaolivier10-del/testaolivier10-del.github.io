/* Skills tool: Simpson’s diversity index. The solver and the seeded problem generator are
   ApBioProblems.solve.simpson and generate.simpson (bio-skill-problems.js);
   the contexts, the fixed problems and the formula box are data
   (bio/data/tools/simpson-diversity.json); the page is ApBioTools.skillTool. */
(function(){
  'use strict';
  var T = window.ApBioTools;
  if(!T) return;
  T.mount('simpson-diversity', function(app, data){ T.skillTool(app, data, { slug: 'simpson-diversity', kind: 'simpson' }); });
})();
