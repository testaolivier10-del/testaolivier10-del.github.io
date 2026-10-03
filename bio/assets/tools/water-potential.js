/* Skills tool: solute potential and water potential. The solver and the seeded problem generator are
   ApBioProblems.solve.wp and generate.wp (bio-skill-problems.js);
   the contexts, the fixed problems and the formula box are data
   (bio/data/tools/water-potential.json); the page is ApBioTools.skillTool. */
(function(){
  'use strict';
  var T = window.ApBioTools;
  if(!T) return;
  T.mount('water-potential', function(app, data){ T.skillTool(app, data, { slug: 'water-potential', kind: 'wp' }); });
})();
