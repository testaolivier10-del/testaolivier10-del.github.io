/* Evidence builder trainer page (docs/appsych-spec.md section 6). OWNED BY THIS
   TOOL ONLY. Mounts into #app with ApPsychTools; the model is
   ApPsychMath.evidenceBuilder (psychology/assets/tools/math/evidence-builder.js), the content
   psychology/data/tools/evidence-builder.json (served filtered as
   assets/tool-data/evidence-builder.json).

   Job: The evidence-based question made drillable: three short sources, a claim, evidence from the right source with its citation, and a psychology concept that links them.

   Phase 0 stub: the page builds only once its data file exists and its
   topic is published, so this script does nothing until Phase 2 writes the
   trainer (Explore pane, Test yourself drills). */
(function(){
  'use strict';
  var T = window.ApPsychTools, M = window.ApPsychMath;
  if(!T || !M || !M.evidenceBuilder || M.evidenceBuilder.stub) return;
})();
