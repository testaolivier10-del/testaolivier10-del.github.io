/* Sensation and perception trainer page (docs/appsych-spec.md section 6). OWNED BY THIS
   TOOL ONLY. Mounts into #app with ApPsychTools; the model is
   ApPsychMath.sensation (psychology/assets/tools/math/sensation.js), the content
   psychology/data/tools/sensation.json (served filtered as
   assets/tool-data/sensation.json).

   Job: Absolute and difference thresholds, signal detection, sensory adaptation, and the perceptual cues and illusions the exam uses.

   Phase 0 stub: the page builds only once its data file exists and its
   topic is published, so this script does nothing until Phase 2 writes the
   trainer (Explore pane, Test yourself drills). */
(function(){
  'use strict';
  var T = window.ApPsychTools, M = window.ApPsychMath;
  if(!T || !M || !M.sensation || M.sensation.stub) return;
})();
