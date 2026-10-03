/* Glossary hovers: every defined term marked by the generator (.gl) shows its
   definition on hover, keyboard focus or tap, so a student who enters mid-course
   is never stuck on a word (docs/apbio-architecture.md). A term whose teaching
   page exists is a link as well; one whose page is not built yet is plain text
   with the definition. Definitions load once from assets/glossary.json. */
(function(){
  var base = window.ApBioBase || '';
  var data = null, loading = null, tip = null, current = null, hideTimer = null;
  function esc(s){ return String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
  function load(){
    if(data) return Promise.resolve(data);
    if(!loading) loading = fetch(base + 'assets/glossary.json').then(function(r){ return r.json(); }).then(function(d){ data = d; return d; }).catch(function(){ data = {}; return data; });
    return loading;
  }
  function ensureTip(){
    if(tip) return tip;
    tip = document.createElement('div');
    tip.className = 'bio-tip'; tip.id = 'bio-tip'; tip.setAttribute('role', 'tooltip'); tip.hidden = true;
    tip.addEventListener('mouseenter', function(){ clearTimeout(hideTimer); });
    tip.addEventListener('mouseleave', scheduleHide);
    document.body.appendChild(tip);
    return tip;
  }
  function show(el){
    var id = el.getAttribute('data-c');
    load().then(function(d){
      var g = d[id];
      if(!g) return;
      clearTimeout(hideTimer);
      var t = ensureTip();
      var roots = (g.r || []).map(function(r){ return '<i>' + esc(r[0]) + '</i> ' + esc(r[1]); }).join(' · ');
      t.innerHTML = '<b>' + esc(g.t) + (g.s ? ' <span style="font-weight:700;opacity:.8">(' + esc(g.s) + ')</span>' : '') + '</b>' + esc(g.d) +
        (roots ? '<span class="bio-tip-roots">' + roots + '</span>' : '');
      t.hidden = false;
      current = el;
      el.setAttribute('aria-describedby', 'bio-tip');
      var r = el.getBoundingClientRect();
      var top = window.scrollY + r.bottom + 8;
      var left = Math.max(8, Math.min(window.scrollX + r.left, window.scrollX + document.documentElement.clientWidth - t.offsetWidth - 8));
      t.style.top = top + 'px'; t.style.left = left + 'px';
    });
  }
  function hide(){ if(tip) tip.hidden = true; if(current) current.removeAttribute('aria-describedby'); current = null; }
  function scheduleHide(){ clearTimeout(hideTimer); hideTimer = setTimeout(hide, 180); }
  function termOf(e){ return e.target && e.target.closest ? e.target.closest('.gl') : null; }
  document.addEventListener('mouseover', function(e){ var el = termOf(e); if(el) show(el); });
  document.addEventListener('mouseout', function(e){ if(termOf(e)) scheduleHide(); });
  document.addEventListener('focusin', function(e){ var el = termOf(e); if(el) show(el); else if(!(tip && tip.contains(e.target))) hide(); });
  // Tap: a span shows its definition; a link shows it on the first tap and
  // follows on the second, so a phone user can read before leaving the page.
  document.addEventListener('click', function(e){
    var el = termOf(e);
    if(!el){ if(!(tip && tip.contains(e.target))) hide(); return; }
    if(el.tagName === 'A' && current !== el && window.matchMedia && window.matchMedia('(hover: none)').matches){ e.preventDefault(); show(el); }
    else if(el.tagName !== 'A'){ show(el); }
  });
  document.addEventListener('keydown', function(e){ if(e.key === 'Escape') hide(); });
})();

/* The glossary page's filter: hides terms that do not match what is typed
   (term or alias, from data-a), and the letters left empty. */
(function(){
  var input = document.getElementById('gl-filter');
  if(!input) return;
  var status = document.getElementById('gl-status');
  input.addEventListener('input', function(){
    var v = input.value.trim().toLowerCase(), shown = 0;
    document.querySelectorAll('.bio-term').forEach(function(el){
      var hit = !v || (el.getAttribute('data-a') || '').indexOf(v) > -1;
      el.hidden = !hit; if(hit) shown++;
    });
    document.querySelectorAll('.bio-letter').forEach(function(sec){ sec.hidden = !sec.querySelector('.bio-term:not([hidden])'); });
    if(status) status.textContent = v ? shown + (shown === 1 ? ' term' : ' terms') + ' found' : '';
  });
})();
