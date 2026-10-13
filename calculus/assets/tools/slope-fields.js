/* Slope fields (simulator; docs/apcalc-spec.md section 6). OWNED BY THIS TOOL
   ONLY. Mounts into #app with ApCalcTools.mount; the model is
   ApCalcMath.slopeFields (calculus/assets/tools/math/slope-fields.js), plots are drawn
   with ApCalcPlot (calc-plot.js), math text with ApCalcTex (calc-math.js),
   the frame is ApCalcTools.modes (Explore, then Test yourself) and
   studioPane / drill on the Tool Studio.
   Phase 0 placeholder: the generator does not build this page until
   calculus/data/tools/slope-fields.json exists and its topic is published. */
(function(){
  'use strict';
  var T = window.ApCalcTools, M = window.ApCalcMath;
  if(!T || !M || !M.slopeFields) return;
  T.mount('slope-fields', function(app, data){
    T.modes(app, {
      slug: 'slope-fields',
      explore: function(pane){ pane.innerHTML = '<p class="bt-small">The slope fields explorer arrives in Phase 2.</p>'; },
      quiz: function(pane){ T.drill(pane, data, { slug: 'slope-fields', generate: M.slopeFields.generate }); }
    });
  });
})();
