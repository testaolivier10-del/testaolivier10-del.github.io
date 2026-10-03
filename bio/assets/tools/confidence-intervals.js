/* Skills tool: 95% confidence intervals and error bars. The solver and the seeded problem generator are
   ApBioProblems.solve.ci and generate.ci (bio-skill-problems.js);
   the contexts, the fixed problems and the formula box are data
   (bio/data/tools/confidence-intervals.json); the page is ApBioTools.skillTool. */
(function(){
  'use strict';
  var T = window.ApBioTools;
  if(!T) return;
  /* The two means as bars with their ±2 SE error bars (the 95% CI). */
  function chart(spec){
    var top = 0;
    spec.bars.forEach(function(b){ top = Math.max(top, b.mean + b.err); });
    var ymax = T.niceMax(top * 1.1);
    return T.plot({ h: 300, title: 'Bar graph of ' + spec.y.toLowerCase() + ' for ' + spec.bars.map(function(b){ return b.name; }).join(' and ') + ', each with error bars of plus or minus 2 SE. The values are in the table above.',
      x: { label: 'Group', categories: spec.bars.map(function(b){ return b.name; }) }, y: { label: spec.y, unit: spec.unit, min: 0, max: ymax, step: T.niceStep(ymax, 5) },
      bars: spec.bars.map(function(b, i){ return { value: b.mean, err: b.err, cls: i ? 's2' : 's1' }; }) });
  }
  T.mount('confidence-intervals', function(app, data){ T.skillTool(app, data, { slug: 'confidence-intervals', kind: 'ci', chart: chart }); });
})();
