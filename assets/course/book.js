/* The textbook pages' shared behaviour (docs/course-shell.md, W-B; styles in
   assets/course/book.css):
   - the notes action row: [data-print] prints, [data-copy] copies a link
     (its value, or this page's canonical address when empty), with the label
     saying so for a moment;
   - the phone "Contents" drawer: a .tb-toc-btn[data-bk-toggle] opens and
     closes the rail;
   - "On this page" targets on pages whose prose is kept verbatim (ochem
     notes): article[data-bk-ids] lists the ids for its h3s, in order;
   - sections-read progress on a rail[data-bk-read="<localStorage key>"],
     the key holding {topicId: date} (ochem's textbook read marks).
   AP Bio's bio-nav.js already wires [data-print] and [data-copy], so its
   pages do not load this file. */
(function(){
  function canonical(){
    var l = document.querySelector('link[rel="canonical"]');
    return (l && l.href) || location.href.split('#')[0];
  }
  document.addEventListener('click', function(e){
    var t = e.target && e.target.closest ? e.target : null;
    if(!t || e.defaultPrevented) return;
    if(t.closest('[data-print]')){ e.preventDefault(); window.print(); return; }
    var c = t.closest('[data-copy]');
    if(c){
      e.preventDefault();
      var url = c.getAttribute('data-copy') || canonical();
      var lbl = c.querySelector('.bk-action-lbl') || c;
      var was = lbl.getAttribute('data-label') || lbl.textContent;
      lbl.setAttribute('data-label', was);
      var said = function(s){ lbl.textContent = s; setTimeout(function(){ lbl.textContent = was; }, 2500); };
      try{
        navigator.clipboard.writeText(url).then(function(){ said('Link copied'); }, function(){ window.prompt('Copy this link:', url); });
      }catch(x){ window.prompt('Copy this link:', url); }
      return;
    }
    var b = t.closest('.tb-toc-btn[data-bk-toggle]');
    if(b){
      var open = document.body.classList.toggle('tb-toc-open');
      b.setAttribute('aria-expanded', open ? 'true' : 'false');
    }
  });

  function start(){
    /* Ochem notes name their chapter; its number comes from the curriculum
       at runtime so inserting a chapter cannot leave a stale one in prose. */
    var CU = window.OchemCurriculum, ce = document.querySelector('[data-bk-chapter]');
    if(ce && CU && CU.MODULES) for(var k = 0; k < CU.MODULES.length; k++) if(CU.MODULES[k].id === ce.getAttribute('data-bk-chapter')){ ce.textContent = 'Chapter ' + (k + 1); break; }
    var art = document.querySelector('article[data-bk-ids]');
    if(art){
      var ids = art.getAttribute('data-bk-ids').split(' '), hs = art.querySelectorAll('h3');
      for(var i = 0; i < hs.length && i < ids.length; i++) if(ids[i] && !hs[i].id) hs[i].id = ids[i];
      if(location.hash){ var el = document.getElementById(decodeURIComponent(location.hash.slice(1))); if(el) el.scrollIntoView(); }
    }
    var rail = document.querySelector('[data-bk-read]');
    if(rail){
      var read = {};
      try{ read = JSON.parse(localStorage.getItem(rail.getAttribute('data-bk-read')) || '{}') || {}; }catch(e){}
      var items = rail.querySelectorAll('[data-toc-t]'), n = 0;
      for(var j = 0; j < items.length; j++){ var on = !!read[items[j].getAttribute('data-toc-t')]; items[j].classList.toggle('read', on); if(on) n++; }
      var prog = rail.querySelector('[data-bk-prog]');
      if(prog && items.length){
        var pct = Math.round(n / items.length * 100) + '%';
        prog.querySelector('b').textContent = n;
        prog.querySelector('.bk-toc-pct').textContent = pct;
        prog.querySelector('.tb-progress-fill').style.width = pct;
      }
    }
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
