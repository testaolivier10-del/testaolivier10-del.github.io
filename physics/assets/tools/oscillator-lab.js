/* Oscillator lab (simulator; docs/apphys-spec.md section 6). OWNED BY THIS TOOL
   ONLY. Mounts into #app with ApPhysTools.mount; the model is
   ApPhysMath.oscillatorLab (physics/assets/tools/math/oscillator-lab.js), scenes are drawn
   with ApPhysScene (phys-scene.js), the frame is ApPhysTools.modes (Explore,
   then Test yourself) and studioPane / drill on the Tool Studio.
   Phase 0 placeholder: the generator does not build this page until
   physics/data/tools/oscillator-lab.json exists and its topic is published. */
(function(){
  'use strict';
  var T = window.ApPhysTools, M = window.ApPhysMath;
  if(!T || !M || !M.oscillatorLab) return;
  T.mount('oscillator-lab', function(app, data){
    T.modes(app, {
      slug: 'oscillator-lab',
      explore: function(pane){ pane.innerHTML = '<p class="bt-small">The oscillator lab explorer arrives in Phase 2.</p>'; },
      quiz: function(pane){ T.drill(pane, data, { slug: 'oscillator-lab', generate: M.oscillatorLab.generate }); }
    });
  });
})();
