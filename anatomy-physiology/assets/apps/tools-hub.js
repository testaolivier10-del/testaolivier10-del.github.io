/* The A&P tools hub. scripts/build-anp.mjs renders the page in full (the
   featured lab practical banner and a card per other tool, with item counts
   per chapter in data- attributes), so it reads and links without JavaScript.
   This script adds:
   - each tool's live status from the learner's own answers (AnpCore.toolStats):
     "Not tried yet", or accuracy with a bar;
   - the ?chapter=<id> filter the chapter pages link to: a bar naming the
     chapter, each tool's count for that chapter, and links that carry the
     filter into the tools that read it. Tools with nothing for the chapter
     stay listed, dimmed, with the full count. */
(function(){
  var app = document.getElementById('app');
  var A = window.AnpCore;
  if(!app) return;
  var BASE = window.ANP_BASE || '';
  var CUR = window.AnpCurriculum || { chapters: [] };
  function esc(s){ return String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

  var chId = null;
  try { chId = new URLSearchParams(location.search).get('chapter'); } catch(e){}
  var chapter = null;
  CUR.chapters.forEach(function(c){ if(c.id === chId) chapter = c; });

  function counts(el){
    var by = {};
    (el.getAttribute('data-ch') || '').split(',').forEach(function(kv){ var p = kv.split(':'); if(p[0]) by[p[0]] = +p[1]; });
    return by;
  }
  function unitWord(el, n){ var u = (el.getAttribute('data-unit') || 'item,items').split(','); return n === 1 ? u[0] : u[1]; }

  function statusHtml(slug){
    if(!A) return '';
    var s = A.toolStats(slug);
    if(!s || !s.n) return '<span class="anp-hub-stat is-new">Not tried yet</span><span class="track thin anp-hub-track" aria-hidden="true"><i style="width:0%"></i></span>';
    var p = Math.round(s.c / s.n * 100);
    return '<span class="anp-hub-stat"><b>' + p + '%</b> right &middot; ' + s.c + ' of ' + s.n + ' items</span>' +
      '<span class="track thin anp-hub-track" aria-hidden="true"><i style="width:' + p + '%"></i></span>';
  }

  var tools = Array.prototype.slice.call(app.querySelectorAll('[data-tool]'));

  function applyChapter(){
    if(!chapter) return;
    var bar = app.querySelector('.anp-hub-filter');
    if(bar){
      bar.innerHTML = '<span>Showing what each tool has for <b>' + esc((chapter.n ? chapter.n + '. ' : '') + chapter.title) + '</b>.</span> <a href="' + esc(BASE + 'tools.html') + '">Show all tools</a>';
      bar.hidden = false;
    }
    tools.forEach(function(el){
      var n = counts(el)[chapter.id] || 0;
      var countEl = el.querySelector('.anp-hub-count');
      if(countEl) countEl.innerHTML = n ? '<b>' + n + '</b> ' + esc(unitWord(el, n)) + ' in this chapter' : 'None in this chapter yet';
      el.classList.toggle('is-empty', !n);
      if(n && el.hasAttribute('data-chq')){
        var links = el.matches('a') ? [el] : Array.prototype.slice.call(el.querySelectorAll('a[href^="tools/"]'));
        links.forEach(function(a){
          var h = a.getAttribute('href').split('#');
          a.setAttribute('href', h[0] + '?chapter=' + encodeURIComponent(chapter.id) + (h[1] ? '#' + h[1] : ''));
        });
      }
    });
  }

  function render(){
    tools.forEach(function(el){
      var st = el.querySelector('.anp-hub-status');
      if(st) st.innerHTML = statusHtml(el.getAttribute('data-tool'));
    });
  }
  applyChapter();
  render();
  app.classList.add('is-ready');
  document.addEventListener('anp:progress', render);
  window.addEventListener('storage', function(e){ if(!e.key || e.key === 'anp_progress_v1') render(); });
})();
