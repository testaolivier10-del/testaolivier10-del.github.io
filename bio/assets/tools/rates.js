/* Skills tool: rates of change and percent change. The solver and the seeded problem generator are
   ApBioProblems.solve.rates and generate.rates (bio-skill-problems.js);
   the contexts, the fixed problems and the formula box are data
   (bio/data/tools/rates.json); the page is ApBioTools.skillTool. */
(function(){
  'use strict';
  var T = window.ApBioTools;
  if(!T) return;
  T.mount('rates', function(app, data){ T.skillTool(app, data, { slug: 'rates', kind: 'rates' }); });
})();
