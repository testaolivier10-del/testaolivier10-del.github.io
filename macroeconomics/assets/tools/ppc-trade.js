/* PPC and trade page (docs/apmacro-spec.md section 6). OWNED BY THIS TOOL ONLY
   (builder T3). Mounts into #app with ApMacroTools.frame once
   macroeconomics/data/tools/ppc-trade.json exists and its topic is published; until
   then the generator does not build the page at all.

   PHASE 0 STUB: says the tool is coming; the builder replaces it. */
(function(){
  var app = document.getElementById('app');
  if(!app || !window.ApMacroMath || !window.ApMacroMath.ppcTrade) return;
  if(window.ApMacroMath.ppcTrade.stub) app.innerHTML = '<p class="mac-soon">This trainer is being built. Meanwhile, read the <a href="../learn.html">free notes</a>.</p>';
})();
