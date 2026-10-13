/* Accumulation (simulator; docs/apcalc-spec.md section 6). OWNED BY THIS TOOL
   ONLY. Mounts into #app with ApCalcTools.mount; the model is
   ApCalcMath.accumulation (calculus/assets/tools/math/accumulation.js), plots are drawn
   with ApCalcPlot (calc-plot.js), math text with ApCalcTex (calc-math.js),
   the frame is ApCalcTools.modes (Explore, then Test yourself) and
   studioPane / drill on the Tool Studio.
   Phase 0 placeholder: the generator does not build this page until
   calculus/data/tools/accumulation.json exists and its topic is published. */
(function(){
  'use strict';
  var T = window.ApCalcTools, M = window.ApCalcMath;
  if(!T || !M || !M.accumulation) return;
  T.mount('accumulation', function(app, data){
    T.modes(app, {
      slug: 'accumulation',
      explore: function(pane){ pane.innerHTML = '<p class="bt-small">The accumulation explorer arrives in Phase 2.</p>'; },
      quiz: function(pane){ T.drill(pane, data, { slug: 'accumulation', generate: M.accumulation.generate }); }
    });
  });
})();
