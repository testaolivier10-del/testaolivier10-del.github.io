/* The AP® Calculus AB tools hub. scripts/build-apcalc.mjs writes every published
   tool into the page as the shared tool card (assets/course/hub.js), so the
   list reads and links without JavaScript. This adds what depends on the
   learner: each tool's "Not tried yet" or accuracy (ApCalcCore.toolStats)
   and the Premium pill on Premium tools. */
(function(){
  // The course this page belongs to: AP® Calculus AB unless the page says otherwise (AP® Calculus BC
  // runs this same file: window.ApCalcCourse, docs/apcalcbc-architecture.md).
  var CC = window.ApCalcCourse || {}, CK = CC.key || 'apcalc', CN = CC.name || 'AP® Calculus AB';
  var app = document.getElementById('app');
  var A = window.ApCalcCore, H = window.LevlHub;
  if(!app || !A || !H) return;
  var tools = Array.prototype.slice.call(app.querySelectorAll('[data-tool]'));
  if(A.badge && A.badge()) tools.forEach(function(el){
    if(!el.hasAttribute('data-premium')) return;
    var top = el.querySelector('.cx-tool-top');
    if(top) top.insertAdjacentHTML('beforeend', '<span class="premium-badge">Premium</span>');
  });
  function render(){
    tools.forEach(function(el){
      var st = el.querySelector('.cx-tool-status');
      if(st) st.innerHTML = H.toolStatus(A.toolStats(el.getAttribute('data-tool')));
    });
  }
  render();
  document.addEventListener(CK + ':progress', render);
  window.addEventListener('storage', function(e){ if(!e.key || e.key === CK + '_progress_v1') render(); });
})();
