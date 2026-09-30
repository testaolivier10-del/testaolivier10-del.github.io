/* Mastery badges on the chapter and core concept pages. Every number comes
   from AnpCore. */
(function(){
  function paint(){
    var C = window.AnpCore;
    if(!C) return;
    function fill(sel, attr, fn){
      document.querySelectorAll('[' + attr + ']').forEach(function(el){
        var m = fn(el.getAttribute(attr));
        el.textContent = m.answered || m.value ? C.pct(m.value) + ' mastery' : '';
      });
    }
    fill('', 'data-mastery-topic', C.topicMastery);
    fill('', 'data-mastery-chapter', C.chapterMastery);
    fill('', 'data-mastery-core', C.coreMastery);
    document.querySelectorAll('[data-mastery-overall]').forEach(function(el){
      var m = C.overallMastery();
      el.textContent = m.value ? C.pct(m.value) + ' of the built course mastered' : '';
    });
  }
  function start(){ paint(); document.addEventListener('anp:progress', paint); }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
