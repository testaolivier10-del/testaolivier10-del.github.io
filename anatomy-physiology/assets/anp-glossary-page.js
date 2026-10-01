/* The glossary page. The file is an A-Z index of terms (scripts/build-anp.mjs,
   glossaryPage); the definitions come from assets/glossary.json, drawn one
   letter at a time when that letter is opened, so the page stays short on a
   phone. Also: the filter (terms and their aliases), the A-Z bar marking where
   you are, and deep links to #t-<concept> landing on that term's definition. */
(function(){
  var base = window.ANP_BASE || '';
  var data = null, loading = null;
  var MAX_RESULTS = 60;

  function esc(s){ return String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
  function load(){
    if(data) return Promise.resolve(data);
    if(!loading) loading = fetch(base + 'assets/glossary.json').then(function(r){ return r.json(); })
      .then(function(d){ data = d || {}; return data; })
      .catch(function(){ loading = null; return null; });
    return loading;
  }
  function topicTitle(id){
    var cur = window.AnpCurriculum;
    if(cur && cur.topics) for(var i = 0; i < cur.topics.length; i++) if(cur.topics[i].id === id) return cur.topics[i].title;
    return id;
  }

  /* One term as the old static page wrote it. `withId` only for the copy in
     its letter; a filter result is a second copy and must not repeat the id. */
  function entryHtml(item, g, withId){
    var roots = (g.r || []).length ? '<span class="anp-roots">' + g.r.map(function(r){ return '<i>' + esc(r[0]) + '</i> ' + esc(r[1]); }).join(' · ') + '</span>' : '';
    var title = esc(topicTitle(g.p));
    var taught = g.b ? '<a href="notes/' + esc(g.p) + '.html">' + title + '</a>' : title;
    return '<div class="anp-term"' + (withId ? ' id="t-' + esc(item.id) + '" tabindex="-1"' : '') + ' data-c="' + esc(item.id) + '">' +
      '<dt>' + esc(item.term) + (g.s ? ' <span class="anp-say">(' + esc(g.s) + ')</span>' : '') + '</dt>' +
      '<dd>' + esc(g.d) + ' ' + roots + ' <span class="anp-small">Taught in ' + taught + '.</span></dd></div>';
  }

  function start(){
    var indexEl = document.getElementById('gl-index');
    if(!indexEl) return;
    var input = document.getElementById('gl-filter');
    var results = document.getElementById('gl-results');
    var status = document.getElementById('gl-status');
    var bar = document.querySelector('.anp-letters');

    var items = [], byId = {};
    var sections = Array.prototype.slice.call(indexEl.querySelectorAll('.anp-letter'));
    sections.forEach(function(sec){
      var list = sec.querySelector('.anp-term-index');
      sec._items = [];
      Array.prototype.forEach.call(list.children, function(li){
        var item = {
          id: li.id.replace(/^t-/, ''), li: li, sec: sec,
          term: li.textContent,
          aliases: (li.getAttribute('data-a') || '').split('|').filter(Boolean)
        };
        item.hay = [item.term].concat(item.aliases).join('\n').toLowerCase();
        items.push(item); byId[item.id] = item; sec._items.push(item);
      });
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'anp-gl-more';
      btn.setAttribute('aria-expanded', 'false');
      btn.textContent = 'Show definitions';
      btn.addEventListener('click', function(){
        if(sec._open) close(sec); else open(sec);
      });
      var h2 = sec.querySelector('h2');
      btn.setAttribute('aria-describedby', h2.id);
      h2.parentNode.insertBefore(btn, h2.nextSibling);
      sec._btn = btn; sec._list = list;
    });

    // ---- a letter's definitions ----
    function open(sec){
      if(sec._open) return Promise.resolve(true);
      sec._btn.disabled = true;
      sec._btn.textContent = 'Loading…';
      return load().then(function(d){
        sec._btn.disabled = false;
        if(!d){ sec._btn.textContent = 'Show definitions'; status.textContent = 'The definitions could not be loaded. Each term still links to the page that teaches it.'; return false; }
        var dl = document.createElement('dl');
        dl.className = 'anp-terms-full';
        dl.innerHTML = sec._items.map(function(it){ return d[it.id] ? entryHtml(it, d[it.id], true) : ''; }).join('');
        // The id moves from the index entry to the definition, so a link to
        // #t-<concept> lands on the definition while the letter is open.
        sec._items.forEach(function(it){ it.li.removeAttribute('id'); });
        sec._list.hidden = true;
        sec._list.parentNode.insertBefore(dl, sec._list.nextSibling);
        sec._dl = dl; sec._open = true;
        sec._btn.textContent = 'Hide definitions';
        sec._btn.setAttribute('aria-expanded', 'true');
        return true;
      });
    }
    function close(sec){
      if(!sec._open) return;
      sec._dl.parentNode.removeChild(sec._dl);
      sec._items.forEach(function(it){ it.li.id = 't-' + it.id; });
      sec._list.hidden = false;
      sec._open = false; sec._dl = null;
      sec._btn.textContent = 'Show definitions';
      sec._btn.setAttribute('aria-expanded', 'false');
    }

    function showTerm(item, push){
      clearFilter();
      open(item.sec).then(function(ok){
        var el = ok ? document.getElementById('t-' + item.id) : item.li;
        if(!el) return;
        if(push && history.replaceState) history.replaceState(null, '', '#t-' + item.id);
        el.scrollIntoView({ block: 'start' });
        if(ok){ el.classList.add('hit'); el.focus({ preventScroll: true }); setTimeout(function(){ el.classList.remove('hit'); }, 2400); }
      });
    }

    // A term in the index shows its definition here rather than leaving the page.
    indexEl.addEventListener('click', function(e){
      var a = e.target.closest && e.target.closest('.anp-term-index a');
      if(!a || e.metaKey || e.ctrlKey || e.shiftKey || e.button) return;
      var li = a.closest('li');
      var item = null;
      for(var i = 0; i < items.length; i++) if(items[i].li === li){ item = items[i]; break; }
      if(!item) return;
      e.preventDefault();
      showTerm(item, true);
    });

    // ---- the A-Z bar ----
    if(bar){
      bar.addEventListener('click', function(e){
        var a = e.target.closest && e.target.closest('a');
        if(!a) return;
        clearFilter();
        var sec = document.getElementById(a.getAttribute('href').slice(1));
        if(sec && sec._btn) open(sec);
      });
      // Mark the letter being read, and keep it in view in the scrolling bar.
      if('IntersectionObserver' in window){
        var links = {};
        Array.prototype.forEach.call(bar.querySelectorAll('a'), function(a){ links[a.getAttribute('href').slice(1)] = a; });
        var current = null;
        var io = new IntersectionObserver(function(entries){
          entries.forEach(function(en){
            if(!en.isIntersecting) return;
            var a = links[en.target.id];
            if(!a || a === current) return;
            if(current){ current.classList.remove('on'); current.removeAttribute('aria-current'); }
            current = a; a.classList.add('on'); a.setAttribute('aria-current', 'true');
            if(bar.scrollWidth > bar.clientWidth) bar.scrollLeft = a.offsetLeft - bar.clientWidth / 2;
          });
        }, { rootMargin: '-30% 0px -60% 0px' });
        sections.forEach(function(s){ io.observe(s); });
      }
    }

    // ---- the filter ----
    var timer = null;
    function clearFilter(){
      if(!input || !input.value) return;
      input.value = '';
      runFilter();
    }
    function runFilter(){
      var q = input.value.trim().toLowerCase();
      if(!q){
        results.hidden = true; results.innerHTML = '';
        indexEl.hidden = false; status.textContent = '';
        return;
      }
      var hits = items.filter(function(it){ return it.hay.indexOf(q) !== -1; });
      // Terms that start with what was typed first, then the rest, each in A-Z order.
      hits.sort(function(a, b){
        var pa = a.term.toLowerCase().indexOf(q) === 0 ? 0 : 1, pb = b.term.toLowerCase().indexOf(q) === 0 ? 0 : 1;
        return pa - pb;
      });
      indexEl.hidden = true;
      results.hidden = false;
      status.textContent = hits.length
        ? hits.length + (hits.length === 1 ? ' term matches.' : ' terms match.') + (hits.length > MAX_RESULTS ? ' Showing the first ' + MAX_RESULTS + '; keep typing to narrow it.' : '')
        : 'No term matches “' + input.value.trim() + '”.';
      var shown = hits.slice(0, MAX_RESULTS);
      var draw = function(d){
        if(input.value.trim().toLowerCase() !== q) return;
        results.innerHTML = shown.length ? '<dl class="anp-terms-full">' + shown.map(function(it){
          return d && d[it.id] ? entryHtml(it, d[it.id], false) : '<div class="anp-term"><dt>' + it.li.innerHTML + '</dt></div>';
        }).join('') + '</dl>' : '';
      };
      draw(data);
      if(!data) load().then(draw);
    }
    if(input){
      input.addEventListener('input', function(){ clearTimeout(timer); timer = setTimeout(runFilter, 120); });
      input.addEventListener('keydown', function(e){ if(e.key === 'Escape'){ input.value = ''; runFilter(); } });
    }

    // ---- deep links ----
    function fromHash(){
      var h = decodeURIComponent((location.hash || '').slice(1));
      if(h.indexOf('t-') === 0 && byId[h.slice(2)]) showTerm(byId[h.slice(2)], false);
      else if(/^l-/.test(h)){ var sec = document.getElementById(h); if(sec && sec._btn) open(sec); }
    }
    window.addEventListener('hashchange', fromHash);
    fromHash();
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
