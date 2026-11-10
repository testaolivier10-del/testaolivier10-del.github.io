/* Population lab page (docs/aphug-spec.md section 6). OWNED BY THIS TOOL ONLY
   (builder T3). Mounts into #app with ApHugTools.frame once
   human-geography/data/tools/population-lab.json exists and its topic is published; until
   then the generator does not build the page at all.

   PHASE 0 STUB: says the tool is coming; the builder replaces it. */
(function(){
  var app = document.getElementById('app');
  if(!app || !window.ApHugMath || !window.ApHugMath.populationLab) return;
  if(window.ApHugMath.populationLab.stub) app.innerHTML = '<p class="hug-soon">This trainer is being built. Meanwhile, read the <a href="../learn.html">free notes</a>.</p>';
})();
