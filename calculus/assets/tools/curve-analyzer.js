/* Curve analyzer (simulator; docs/apcalc-spec.md section 6). OWNED BY THIS TOOL
   ONLY. Mounts into #app with ApCalcTools.mount; the model is
   ApCalcMath.curveAnalyzer (calculus/assets/tools/math/curve-analyzer.js), plots are drawn
   with ApCalcPlot (calc-plot.js), math text with ApCalcTex (calc-math.js),
   the frame is ApCalcTools.modes (Explore, then Test yourself) and
   studioPane / drill on the Tool Studio.
   Phase 0 placeholder: the generator does not build this page until
   calculus/data/tools/curve-analyzer.json exists and its topic is published. */
(function(){
  'use strict';
  var T = window.ApCalcTools, M = window.ApCalcMath;
  if(!T || !M || !M.curveAnalyzer) return;
  T.mount('curve-analyzer', function(app, data){
    T.modes(app, {
      slug: 'curve-analyzer',
      explore: function(pane){ pane.innerHTML = '<p class="bt-small">The curve analyzer explorer arrives in Phase 2.</p>'; },
      quiz: function(pane){ T.drill(pane, data, { slug: 'curve-analyzer', generate: M.curveAnalyzer.generate }); }
    });
  });
})();
