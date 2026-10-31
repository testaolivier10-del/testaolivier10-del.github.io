/* Series lab: the page script (docs/apcalcbc-architecture.md, "Trainers"). OWNED BY THIS
   TOOL ONLY (builder T1). Runs on calculus-bc/tools/series-lab.html on top of AB's framework
   (ApCalcTools, calculus/assets/tools/calc-tools.js) and plots (ApCalcPlot), with its own
   model ApCalcMath.seriesLab. Phase 0 stub: Phase 2 builds Explore and Test yourself. */
(function(){
  'use strict';
  var app = document.getElementById('app');
  if(!app || !window.ApCalcTools) return;
  app.insertAdjacentHTML('beforeend', '<p class="calc-soon">This trainer is being built.</p>');
})();
