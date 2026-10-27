/* Social influence trainer page (docs/appsych-spec.md section 6). OWNED BY THIS
   TOOL ONLY. Mounts into #app with ApPsychTools; the model is
   ApPsychMath.socialInfluence (psychology/assets/tools/math/social-influence.js), the content
   psychology/data/tools/social-influence.json (served filtered as
   assets/tool-data/social-influence.json).

   Job: Attribution, conformity, obedience and group effects: change the situation and predict the behavior, then name the concept.

   Phase 0 stub: the page builds only once its data file exists and its
   topic is published, so this script does nothing until Phase 2 writes the
   trainer (Explore pane, Test yourself drills). */
(function(){
  'use strict';
  var T = window.ApPsychTools, M = window.ApPsychMath;
  if(!T || !M || !M.socialInfluence || M.socialInfluence.stub) return;
})();
