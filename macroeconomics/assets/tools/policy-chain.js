/* Policy chain page (docs/apmacro-spec.md section 6). OWNED BY THIS TOOL ONLY
   (builder T2). Mounts into #app with ApMacroTools.frame once
   macroeconomics/data/tools/policy-chain.json exists and its topic is published; until
   then the generator does not build the page at all.

   PHASE 0 STUB: says the tool is coming; the builder replaces it. */
(function(){
  var app = document.getElementById('app');
  if(!app || !window.ApMacroMath || !window.ApMacroMath.policyChain) return;
  if(window.ApMacroMath.policyChain.stub) app.innerHTML = '<p class="mac-soon">This trainer is being built. Meanwhile, read the <a href="../learn.html">free notes</a>.</p>';
})();
