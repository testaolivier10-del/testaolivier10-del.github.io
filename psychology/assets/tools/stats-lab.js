/* Stats lab trainer page (docs/appsych-spec.md section 6). OWNED BY THIS
   TOOL ONLY. Mounts into #app with ApPsychTools; the model is
   ApPsychMath.statsLab (psychology/assets/tools/math/stats-lab.js), the content
   psychology/data/tools/stats-lab.json (served filtered as
   assets/tool-data/stats-lab.json).

   Job: The normal curve with the 68-95-99.7 rule, z scores and percentile ranks, central tendency and variation, and correlation from a scatterplot, all worked by hand.

   Phase 0 stub: the page builds only once its data file exists and its
   topic is published, so this script does nothing until Phase 2 writes the
   trainer (Explore pane, Test yourself drills). */
(function(){
  'use strict';
  var T = window.ApPsychTools, M = window.ApPsychMath;
  if(!T || !M || !M.statsLab || M.statsLab.stub) return;
})();
