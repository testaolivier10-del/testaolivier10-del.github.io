/* Brain map trainer page (docs/appsych-spec.md section 6). OWNED BY THIS
   TOOL ONLY. Mounts into #app with ApPsychTools; the model is
   ApPsychMath.brainMap (psychology/assets/tools/math/brain-map.js), the content
   psychology/data/tools/brain-map.json (served filtered as
   assets/tool-data/brain-map.json).

   Job: The brain region by region: tap a structure or a lobe to see what it does, then read lesion, imaging and split-brain cases and name the region.

   Phase 0 stub: the page builds only once its data file exists and its
   topic is published, so this script does nothing until Phase 2 writes the
   trainer (Explore pane, Test yourself drills). */
(function(){
  'use strict';
  var T = window.ApPsychTools, M = window.ApPsychMath;
  if(!T || !M || !M.brainMap || M.brainMap.stub) return;
})();
