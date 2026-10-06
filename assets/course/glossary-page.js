/* The glossary page, the same in every course (docs/course-shell.md, W-A):
   a list with every definition visible, a filter that matches the term, its
   other names and its definition, a chapter/unit filter, and a sticky A-Z
   rail. The opener, the filter row and the rail are in the HTML the
   generator writes (scripts/lib/glossary.mjs), so nothing moves when this
   runs; it fills #gx-list from the course's glossary.json.

     <script src="../assets/course/glossary-page.js"
             data-glossary="assets/glossary.json" data-course-root="" defer></script>

   Deep links: #t-<id> opens on that term (and clears any filter so it is
   there); #l-<letter> on a letter. ?q= prefills the filter.

   1,000+ terms: the list is built as one string and inserted once; each
   letter group is a content-visibility:auto block (glossary.css), so the
   browser lays out only what is near the screen. Filtering toggles `hidden`
   on rows and groups; nothing is rebuilt. */
(function(){
  var me = document.currentScript;
  var attr = function(n, d){ return (me && me.getAttribute(n)) || d; };
  var DATA = new URL(attr('data-glossary', 'assets/glossary.json'), document.baseURI).href;
  var ROOT = new URL(attr('data-course-root', './'), document.baseURI).href;
  var AZ = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  var NUM = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];
  var GREEK = { 'α': 'alpha', 'β': 'beta', 'γ': 'gamma', 'δ': 'delta', 'ε': 'epsilon', 'κ': 'kappa', 'λ': 'lambda', 'μ': 'mu', 'π': 'pi', 'σ': 'sigma', 'ω': 'omega' };

  function esc(s){ return String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
  function rich(s){ return esc(s).replace(/&lt;(\/?)(i|b|em|strong|sub|sup)&gt;/g, '<$1$2>'); }
  function fold(s){
    return String(s || '').replace(/<[^>]+>/g, '').replace(/[αβγδεκλμπσω]/g, function(c){ return GREEK[c]; })
      .normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  }
  // Same rule as scripts/lib/glossary.mjs letterOf(): 5′ end files under F.
  function letterOf(term){
    var k = fold(term).replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹]/g, '').replace(/^(\d)\s*['′]\s*/, function(_, d){ return NUM[+d] + ' prime '; });
    var m = k.match(/[a-z]/);
    return m ? m[0].toUpperCase() : 'A';
  }

  function start(){
    var list = document.getElementById('gx-list');
    var q = document.getElementById('gx-q');
    var ch = document.getElementById('gx-ch');
    var status = document.getElementById('gx-status');
    var none = document.getElementById('gx-none');
    var rail = document.querySelector('.gx-rail');
    if(!list || !q) return;

    var rows = [], groups = {}, total = 0, statusTimer = null;

    fetch(DATA).then(function(r){ if(!r.ok) throw new Error(r.status); return r.json(); }).then(render).catch(function(){
      status.textContent = 'The definitions could not load. Check your connection and reload.';
    });

    function render(d){
      var chName = {};
      (d.chapters || []).forEach(function(c){ chName[c.id] = c.title; });
      var by = {};
      d.terms.forEach(function(t){ var L = letterOf(t.term); (by[L] = by[L] || []).push(t); });
      var html = '';
      AZ.forEach(function(L){
        var here = by[L];
        if(!here) return;
        html += '<section class="gx-group" id="l-' + L + '" aria-labelledby="gx-h-' + L + '"><h2 id="gx-h-' + L + '">' + L +
          ' <span class="gx-n">' + here.length + (here.length === 1 ? ' term' : ' terms') + '</span></h2><dl class="cx-card gx-terms">';
        here.forEach(function(t){
          var href = t.href ? new URL(t.href, ROOT).href : '';
          var roots = (t.roots || []).map(function(r){ return '<i>' + esc(r[0]) + '</i> ' + esc(r[1]); }).join(' · ');
          html += '<div class="gx-t" id="t-' + esc(t.id) + '"><dt>' + esc(t.term) +
            (t.say ? ' <span class="gx-say">' + esc(t.say) + '</span>' : '') + '</dt><dd>' +
            (roots ? '<span class="gx-roots">' + roots + '</span>' : '') +
            '<span class="gx-def">' + rich(t.def) + '</span>' +
            (t.topicTitle ? '<span class="gx-src">Taught in ' + (href ? '<a href="' + esc(href) + '">' + esc(t.topicTitle) + '</a>' : esc(t.topicTitle) + ' (coming soon)') + '</span>' : '') +
            '</dd></div>';
          rows.push({ id: t.id, L: L, ch: t.chapter || '', hay: fold([t.term].concat(t.aka || []).join(' | ') + ' | ' + t.def), name: fold([t.term].concat(t.aka || []).join(' | ')) });
        });
        html += '</dl></section>';
      });
      list.innerHTML = html;
      var els = list.querySelectorAll('.gx-t');
      rows.forEach(function(r, i){ r.el = els[i]; });
      Array.prototype.forEach.call(list.querySelectorAll('.gx-group'), function(g){ groups[g.id.slice(2)] = g; });
      total = rows.length;

      var params = new URLSearchParams(location.search);
      if(params.get('q')) q.value = params.get('q');
      q.addEventListener('input', function(){ apply(true); });
      if(ch) ch.addEventListener('change', function(){ apply(true); });
      apply(false);
      fromHash();
      window.addEventListener('hashchange', fromHash);
      if(window.LevlGlossary && window.LevlGlossary.load) window.LevlGlossary.load();
    }

    function apply(announce){
      var s = fold(q.value.trim()), c = ch ? ch.value : '', n = 0, seen = {};
      var words = s ? s.split(/\s+/) : [];
      rows.forEach(function(r){
        var on = (!c || r.ch === c) && words.every(function(w){ return r.hay.indexOf(w) > -1; });
        r.el.hidden = !on;
        if(on){ n++; seen[r.L] = 1; }
      });
      Object.keys(groups).forEach(function(L){
        groups[L].hidden = !seen[L];
        var cnt = groups[L].querySelector('.gx-n'), k = 0;
        if(cnt){ rows.forEach(function(r){ if(r.L === L && !r.el.hidden) k++; }); cnt.textContent = k + (k === 1 ? ' term' : ' terms'); }
      });
      Array.prototype.forEach.call(rail.children, function(a){
        var L = a.textContent;
        if(a.tagName !== 'A') return;
        a.classList.toggle('gx-off', !seen[L]);
        if(seen[L]) a.removeAttribute('aria-disabled'); else a.setAttribute('aria-disabled', 'true');
      });
      none.hidden = n > 0;
      var fmt = function(x){ return x.toLocaleString('en-US'); };
      var msg = (s || c) ? fmt(n) + ' of ' + fmt(total) + (n === 1 ? ' term matches.' : ' terms match.') : '';
      clearTimeout(statusTimer);
      // Announce after typing pauses, so a screen reader is not interrupted per key.
      if(announce) statusTimer = setTimeout(function(){ status.textContent = msg; }, 450);
      else status.textContent = msg;
    }

    function reveal(el){
      if(!el) return;
      if(el.hidden || (el.closest('.gx-group') || {}).hidden){ q.value = ''; if(ch) ch.value = ''; apply(false); }
      // content-visibility groups have placeholder heights until drawn, so
      // jump twice: once to get close, once after layout settles.
      el.scrollIntoView({ block: 'start' });
      requestAnimationFrame(function(){ el.scrollIntoView({ block: 'start' }); });
    }
    function fromHash(){
      var h = decodeURIComponent((location.hash || '').slice(1));
      if(!h) return;
      if(/^g-/.test(h)) h = 't-' + h.slice(2); // the old ochem anchors
      var el = document.getElementById(h);
      if(/^t-/.test(h) && el){ reveal(el); el.classList.add('gx-hit'); setTimeout(function(){ el.classList.remove('gx-hit'); }, 2400); }
      else if(/^l-/.test(h)) reveal(el);
    }

    rail.addEventListener('click', function(e){
      var a = e.target.closest && e.target.closest('a');
      if(!a) return;
      e.preventDefault();
      if(a.classList.contains('gx-off')) return;
      var g = groups[a.textContent];
      if(!g) return;
      history.replaceState(null, '', '#l-' + a.textContent);
      reveal(g);
      var h = g.querySelector('h2');
      h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true });
    });
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
