/* Design randomizer (simulator; docs/apstat-spec.md section 6). OWNED BY THIS TOOL
   ONLY. Mounts into #app with ApStatTools.mount; the model is
   ApStatMath.designRandomizer (statistics/assets/tools/math/design-randomizer.js), plots are drawn
   with ApStatPlot (stat-plot.js), distributions come from ApStatDist
   (stat-dist.js), math text from ApStatTex (stat-math.js), the frame is
   ApStatTools.modes (Explore, then Test yourself) and studioPane / drill on
   the Tool Studio.
   Phase 0 placeholder: the generator does not build this page until
   statistics/data/tools/design-randomizer.json exists and its topic is published. */
(function(){
  'use strict';
  var T = window.ApStatTools, M = window.ApStatMath;
  if(!T || !M || !M.designRandomizer) return;
  T.mount('design-randomizer', function(app, data){
    T.modes(app, {
      slug: 'design-randomizer',
      explore: function(pane){ pane.innerHTML = '<p class="bt-small">The design randomizer arrives in Phase 2.</p>'; },
      quiz: function(pane){ T.drill(pane, data, { slug: 'design-randomizer', generate: M.designRandomizer.generate }); }
    });
  });
})();
