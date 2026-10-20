/* Age structure trainer page (docs/apenv-spec.md section 6). OWNED BY THIS TOOL
   ONLY (builder T1). Mounts into #app with ApEnvTools.mount; the model is
   ApEnvMath.ageStructure (environmental-science/assets/tools/math/age-structure.js), the
   content environmental-science/data/tools/age-structure.json (served filtered as
   assets/tool-data/age-structure.json). An Explore pane (live scene, one to three
   primary controls, Why and Details sheets) and "Test yourself" (seeded
   drills through ApEnvTools.drill, first try recorded as
   age-structure:<context>:<step>), per docs/apenv-briefs/tools-common.md.

   PHASE 0 STUB: no page is built until the data file exists and its context
   topic is published, so this script only mounts. */
(function(){
  'use strict';
  var T = window.ApEnvTools;
  if(!T) return;
  T.mount('age-structure', function(app){
    app.insertAdjacentHTML('beforeend', '<p class="env-soon">This trainer is being built.</p>');
  });
})();
