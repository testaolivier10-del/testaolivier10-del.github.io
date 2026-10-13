/* Collision lab (simulator; docs/apphys-spec.md section 6). OWNED BY THIS TOOL
   ONLY. Mounts into #app with ApPhysTools.mount; the model is
   ApPhysMath.collisionLab (physics/assets/tools/math/collision-lab.js), scenes are drawn
   with ApPhysScene (phys-scene.js), the frame is ApPhysTools.modes (Explore,
   then Test yourself) and studioPane / drill on the Tool Studio.
   Phase 0 placeholder: the generator does not build this page until
   physics/data/tools/collision-lab.json exists and its topic is published. */
(function(){
  'use strict';
  var T = window.ApPhysTools, M = window.ApPhysMath;
  if(!T || !M || !M.collisionLab) return;
  T.mount('collision-lab', function(app, data){
    T.modes(app, {
      slug: 'collision-lab',
      explore: function(pane){ pane.innerHTML = '<p class="bt-small">The collision lab explorer arrives in Phase 2.</p>'; },
      quiz: function(pane){ T.drill(pane, data, { slug: 'collision-lab', generate: M.collisionLab.generate }); }
    });
  });
})();
