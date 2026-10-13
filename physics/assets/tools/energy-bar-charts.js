/* Energy bar charts (simulator; docs/apphys-spec.md section 6). OWNED BY THIS TOOL
   ONLY. Mounts into #app with ApPhysTools.mount; the model is
   ApPhysMath.energyBarCharts (physics/assets/tools/math/energy-bar-charts.js), scenes are drawn
   with ApPhysScene (phys-scene.js), the frame is ApPhysTools.modes (Explore,
   then Test yourself) and studioPane / drill on the Tool Studio.
   Phase 0 placeholder: the generator does not build this page until
   physics/data/tools/energy-bar-charts.json exists and its topic is published. */
(function(){
  'use strict';
  var T = window.ApPhysTools, M = window.ApPhysMath;
  if(!T || !M || !M.energyBarCharts) return;
  T.mount('energy-bar-charts', function(app, data){
    T.modes(app, {
      slug: 'energy-bar-charts',
      explore: function(pane){ pane.innerHTML = '<p class="bt-small">The energy bar charts explorer arrives in Phase 2.</p>'; },
      quiz: function(pane){ T.drill(pane, data, { slug: 'energy-bar-charts', generate: M.energyBarCharts.generate }); }
    });
  });
})();
