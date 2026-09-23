/* Mastery badges on the home, learn, chapter and core concept pages, and the
   A&P I / II filter on learn.html. Every number comes from AnpCore. */
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
  function filter(){
    var sel = document.getElementById('course-filter');
    if(!sel || !window.AnpCurriculum) return;
    var byId = {};
    window.AnpCurriculum.chapters.forEach(function(c){ byId[c.id] = c; });
    sel.addEventListener('change', function(){
      document.querySelectorAll('.anp-chapters li[data-chapter]').forEach(function(li){
        var c = byId[li.getAttribute('data-chapter')];
        li.hidden = !!(sel.value && c && c.course !== sel.value && c.part !== 'foundations');
      });
    });
  }
  function start(){ paint(); filter(); document.addEventListener('anp:progress', paint); }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
