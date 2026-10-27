/* Neuron trainer page (docs/appsych-spec.md section 6). OWNED BY THIS
   TOOL ONLY. Mounts into #app with ApPsychTools; the model is
   ApPsychMath.neuron (psychology/assets/tools/math/neuron.js), the content
   psychology/data/tools/neuron.json (served filtered as
   assets/tool-data/neuron.json).

   Job: Fire a neuron: threshold, the all-or-none action potential, the refractory period, and what agonists, antagonists and reuptake inhibitors do at the synapse.

   Phase 0 stub: the page builds only once its data file exists and its
   topic is published, so this script does nothing until Phase 2 writes the
   trainer (Explore pane, Test yourself drills). */
(function(){
  'use strict';
  var T = window.ApPsychTools, M = window.ApPsychMath;
  if(!T || !M || !M.neuron || M.neuron.stub) return;
})();
