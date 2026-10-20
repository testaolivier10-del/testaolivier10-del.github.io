/* Cycles trainer page (docs/apenv-spec.md section 6). OWNED BY THIS TOOL
   ONLY (builder T2). Mounts into #app with ApEnvTools.mount; the model is
   ApEnvMath.cycles (environmental-science/assets/tools/math/cycles.js), the
   content environmental-science/data/tools/cycles.json (served filtered as
   assets/tool-data/cycles.json). An Explore pane (live scene, one to three
   primary controls, Why and Details sheets) and "Test yourself" (seeded
   drills through ApEnvTools.drill, first try recorded as
   cycles:<context>:<step>), per docs/apenv-briefs/tools-common.md.

   PHASE 0 STUB: no page is built until the data file exists and its context
   topic is published, so this script only mounts. */
(function(){
  'use strict';
  var T = window.ApEnvTools;
  if(!T) return;
  T.mount('cycles', function(app){
    app.insertAdjacentHTML('beforeend', '<p class="env-soon">This trainer is being built.</p>');
  });
})();
