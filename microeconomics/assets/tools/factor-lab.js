/* Factor Market Lab page (docs/apmicro-spec.md section 6). OWNED BY THIS TOOL ONLY
   (builder T4). Mounts into #app with ApMicroTools.frame once
   microeconomics/data/tools/factor-lab.json exists and its topic is published; until
   then the generator does not build the page at all.

   PHASE 0 STUB: says the tool is coming; the builder replaces it. */
(function(){
  var app = document.getElementById('app');
  if(!app || !window.ApMicroMath || !window.ApMicroMath.factorLab) return;
  if(window.ApMicroMath.factorLab.stub) app.innerHTML = '<p class="mic-soon">This trainer is being built. Meanwhile, read the <a href="../learn.html">free notes</a>.</p>';
})();
