/* The AP® Psychology tools hub. scripts/build-appsych.mjs writes every published
   tool into the page as the shared tool card (assets/course/hub.js), so the
   list reads and links without JavaScript. This adds what depends on the
   learner: each tool's "Not tried yet" or accuracy (ApPsychCore.toolStats)
   and the Premium pill on Premium tools. */
(function(){
  var app = document.getElementById('app');
  var A = window.ApPsychCore, H = window.LevlHub;
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
  document.addEventListener('appsych:progress', render);
  window.addEventListener('storage', function(e){ if(!e.key || e.key === 'appsych_progress_v1') render(); });
})();
