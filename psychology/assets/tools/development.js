/* Development trainer page (docs/appsych-spec.md section 6). OWNED BY THIS
   TOOL ONLY. Mounts into #app with ApPsychTools; the model is
   ApPsychMath.development (psychology/assets/tools/math/development.js), the content
   psychology/data/tools/development.json (served filtered as
   assets/tool-data/development.json).

   Job: A lifespan timeline: cognitive development stages, attachment and parenting styles, the psychosocial stages and adolescence to adulthood, each placed and applied.

   Phase 0 stub: the page builds only once its data file exists and its
   topic is published, so this script does nothing until Phase 2 writes the
   trainer (Explore pane, Test yourself drills). */
(function(){
  'use strict';
  var T = window.ApPsychTools, M = window.ApPsychMath;
  if(!T || !M || !M.development || M.development.stub) return;
})();
