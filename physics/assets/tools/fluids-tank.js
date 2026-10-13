/* Fluids tank (simulator; docs/apphys-spec.md section 6). OWNED BY THIS TOOL
   ONLY. Mounts into #app with ApPhysTools.mount; the model is
   ApPhysMath.fluidsTank (physics/assets/tools/math/fluids-tank.js), scenes are drawn
   with ApPhysScene (phys-scene.js), the frame is ApPhysTools.modes (Explore,
   then Test yourself) and studioPane / drill on the Tool Studio.
   Phase 0 placeholder: the generator does not build this page until
   physics/data/tools/fluids-tank.json exists and its topic is published. */
(function(){
  'use strict';
  var T = window.ApPhysTools, M = window.ApPhysMath;
  if(!T || !M || !M.fluidsTank) return;
  T.mount('fluids-tank', function(app, data){
    T.modes(app, {
      slug: 'fluids-tank',
      explore: function(pane){ pane.innerHTML = '<p class="bt-small">The fluids tank explorer arrives in Phase 2.</p>'; },
      quiz: function(pane){ T.drill(pane, data, { slug: 'fluids-tank', generate: M.fluidsTank.generate }); }
    });
  });
})();
