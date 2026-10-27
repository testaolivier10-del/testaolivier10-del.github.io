/* Article analysis studio trainer page (docs/appsych-spec.md section 6). OWNED BY THIS
   TOOL ONLY. Mounts into #app with ApPsychTools; the model is
   ApPsychMath.articleStudio (psychology/assets/tools/math/article-studio.js), the content
   psychology/data/tools/article-studio.json (served filtered as
   assets/tool-data/article-studio.json).

   Job: The article analysis question made drillable: a study summary taken apart part by part (method, operational definition, statistic, ethics, generalizability, argument), each graded with the slip named.

   Phase 0 stub: the page builds only once its data file exists and its
   topic is published, so this script does nothing until Phase 2 writes the
   trainer (Explore pane, Test yourself drills). */
(function(){
  'use strict';
  var T = window.ApPsychTools, M = window.ApPsychMath;
  if(!T || !M || !M.articleStudio || M.articleStudio.stub) return;
})();
