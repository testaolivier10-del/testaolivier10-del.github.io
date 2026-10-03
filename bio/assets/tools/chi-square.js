/* Skills tool: the chi-square goodness-of-fit test. The solver and the seeded problem generator are
   ApBioProblems.solve.chi and generate.chi (bio-skill-problems.js);
   the contexts, the fixed problems and the formula box are data
   (bio/data/tools/chi-square.json); the page is ApBioTools.skillTool. */
(function(){
  'use strict';
  var T = window.ApBioTools;
  if(!T) return;
  /* The formula sheet's table of critical values at p = 0.05 and 0.01,
     always on screen: finding the critical value is part of the skill. */
  function critTable(){
    var M = window.ApBioMath, cols = ['p'], r5 = ['0.05'], r1 = ['0.01'];
    for(var df = 1; df <= 8; df++){ cols.push('df = ' + df); r5.push(M.CHI_CRIT['0.05'][df].toFixed(2)); r1.push(M.CHI_CRIT['0.01'][df].toFixed(2)); }
    return '<section class="bt-card" aria-labelledby="chi-crit-h"><h2 id="chi-crit-h">Critical values of χ²</h2>' + T.dataTable(cols, [r5, r1], 'Reject the null hypothesis when χ² is greater than the critical value for your degrees of freedom (df). This course uses p = 0.05.') + '</section>';
  }
  T.mount('chi-square', function(app, data){ T.skillTool(app, data, { slug: 'chi-square', kind: 'chi' }); app.insertAdjacentHTML('beforeend', critTable()); });
})();
