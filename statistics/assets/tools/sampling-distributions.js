/* Sampling distributions (simulator; docs/apstat-spec.md section 6). OWNED BY THIS TOOL
   ONLY. Mounts into #app with ApStatTools.mount; the model is
   ApStatMath.samplingDistributions (statistics/assets/tools/math/sampling-distributions.js), plots are drawn
   with ApStatPlot (stat-plot.js), distributions come from ApStatDist
   (stat-dist.js), math text from ApStatTex (stat-math.js), the frame is
   ApStatTools.modes (Explore, then Test yourself) and studioPane / drill on
   the Tool Studio.
   Phase 0 placeholder: the generator does not build this page until
   statistics/data/tools/sampling-distributions.json exists and its topic is published. */
(function(){
  'use strict';
  var T = window.ApStatTools, M = window.ApStatMath;
  if(!T || !M || !M.samplingDistributions) return;
  T.mount('sampling-distributions', function(app, data){
    T.modes(app, {
      slug: 'sampling-distributions',
      explore: function(pane){ pane.innerHTML = '<p class="bt-small">The sampling distributions arrives in Phase 2.</p>'; },
      quiz: function(pane){ T.drill(pane, data, { slug: 'sampling-distributions', generate: M.samplingDistributions.generate }); }
    });
  });
})();
