/* The glossary page's filter: hides terms that do not match what you type. */
(function(){
  function start(){
    var input = document.getElementById('gl-filter');
    if(!input) return;
    input.addEventListener('input', function(){
      var q = input.value.trim().toLowerCase();
      document.querySelectorAll('.anp-term').forEach(function(t){ t.hidden = !!q && t.getAttribute('data-terms').indexOf(q) === -1; });
      document.querySelectorAll('.anp-letter').forEach(function(l){ l.hidden = !l.querySelector('.anp-term:not([hidden])'); });
    });
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
