/* Lab design (simulator; docs/apphys-spec.md section 6). OWNED BY THIS TOOL
   ONLY. Mounts into #app with ApPhysTools.mount; the model is
   ApPhysMath.labDesign (physics/assets/tools/math/lab-design.js), scenes are drawn
   with ApPhysScene (phys-scene.js), the frame is ApPhysTools.modes (Explore,
   then Test yourself) and studioPane / drill on the Tool Studio.
   Phase 0 placeholder: the generator does not build this page until
   physics/data/tools/lab-design.json exists and its topic is published. */
(function(){
  'use strict';
  var T = window.ApPhysTools, M = window.ApPhysMath;
  if(!T || !M || !M.labDesign) return;
  T.mount('lab-design', function(app, data){
    T.modes(app, {
      slug: 'lab-design',
      explore: function(pane){ pane.innerHTML = '<p class="bt-small">The lab design explorer arrives in Phase 2.</p>'; },
      quiz: function(pane){ T.drill(pane, data, { slug: 'lab-design', generate: M.labDesign.generate }); }
    });
  });
})();
