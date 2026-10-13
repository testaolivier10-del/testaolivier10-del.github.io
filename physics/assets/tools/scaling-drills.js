/* Scaling drills (skill; docs/apphys-spec.md section 6). OWNED BY THIS TOOL
   ONLY. Mounts into #app with ApPhysTools.mount; the model is
   ApPhysMath.scalingDrills (physics/assets/tools/math/scaling-drills.js), scenes are drawn
   with ApPhysScene (phys-scene.js), the frame is ApPhysTools.modes (Explore,
   then Test yourself) and studioPane / drill on the Tool Studio.
   Phase 0 placeholder: the generator does not build this page until
   physics/data/tools/scaling-drills.json exists and its topic is published. */
(function(){
  'use strict';
  var T = window.ApPhysTools, M = window.ApPhysMath;
  if(!T || !M || !M.scalingDrills) return;
  T.mount('scaling-drills', function(app, data){
    T.modes(app, {
      slug: 'scaling-drills',
      explore: function(pane){ pane.innerHTML = '<p class="bt-small">The scaling drills explorer arrives in Phase 2.</p>'; },
      quiz: function(pane){ T.drill(pane, data, { slug: 'scaling-drills', generate: M.scalingDrills.generate }); }
    });
  });
})();
