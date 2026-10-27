/* Memory lab trainer page (docs/appsych-spec.md section 6). OWNED BY THIS
   TOOL ONLY. Mounts into #app with ApPsychTools; the model is
   ApPsychMath.memoryLab (psychology/assets/tools/math/memory-lab.js), the content
   psychology/data/tools/memory-lab.json (served filtered as
   assets/tool-data/memory-lab.json).

   Job: Encoding, storage and retrieval: the serial position curve, the spacing effect, interference and forgetting, from your own recall.

   Phase 0 stub: the page builds only once its data file exists and its
   topic is published, so this script does nothing until Phase 2 writes the
   trainer (Explore pane, Test yourself drills). */
(function(){
  'use strict';
  var T = window.ApPsychTools, M = window.ApPsychMath;
  if(!T || !M || !M.memoryLab || M.memoryLab.stub) return;
})();
