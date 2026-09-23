/* Search across the A&P course (docs/anp-spec.md section 3): lessons, notes,
   glossary and tools, all in the browser.

   Sources, each allowed to fail on its own (offline you get whatever the
   service worker has cached, and the status line says what made it in):
     AnpCurriculum      the built topics: one lesson result each
     AnpTools           the tools
     assets/glossary.json   every defined term
     assets/notes-index.json, then each notes page, split into paragraphs so a
                        hit points at the passage (fetched in the background)
   Matching, ranking and highlighting are the site's shared engine,
   assets/site-search.js (LevlSearch), the one NREMT and ochem use. It is not
   among this page's generated script tags, so it is loaded here. */
(function(){
  var app = document.getElementById('app');
  var CU = window.AnpCurriculum;
  if(!app || !CU) return;
  var BASE = window.ANP_BASE || '';
  var KINDS = ['Lessons', 'Notes', 'Glossary', 'Tools', 'Pages'];
  var PER_GROUP = 8;
  var INDEX = [], S = null, active = 'all', expanded = {}, notesState = 'loading';

  function esc(s){ return String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
  var TOPIC = {}, CHAPTER = {}, CORE = {};
  CU.topics.forEach(function(t){ TOPIC[t.id] = t; });
  CU.chapters.forEach(function(c){ CHAPTER[c.id] = c; });
  CU.core.forEach(function(c){ CORE[c.id] = c; });

  var params = new URLSearchParams(location.search);
  app.innerHTML =
    '<div class="anp-sr">' +
      '<div class="anp-sr-box"><label class="sr-only" for="anp-sr-q">Search the course</label>' +
        '<svg class="anp-sr-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="10.5" cy="10.5" r="6.5" fill="none" stroke="currentColor" stroke-width="2.4"/><path d="M15.5 15.5 21 21" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>' +
        '<input type="search" id="anp-sr-q" class="anp-sr-input" placeholder="Search lessons, notes, terms and tools (e.g. “gap junction”)" autocomplete="off" spellcheck="false" aria-describedby="anp-sr-status anp-sr-help" aria-controls="anp-sr-results"></div>' +
      '<p class="anp-sr-help" id="anp-sr-help">Results appear as you type. <kbd>↓</kbd> moves into the results, <kbd>↑</kbd> <kbd>↓</kbd> between them, <kbd>Enter</kbd> opens one, <kbd>Esc</kbd> returns here.</p>' +
      '<div class="anp-sr-status" id="anp-sr-status" role="status" aria-live="polite">Building the search index…</div>' +
      '<div class="anp-sr-filters" id="anp-sr-filters" role="group" aria-label="Filter results by kind"></div>' +
      '<div id="anp-sr-results" class="anp-sr-results"></div>' +
    '</div>';
  var box = document.getElementById('anp-sr-q');
  var statusEl = document.getElementById('anp-sr-status');
  var filtersEl = document.getElementById('anp-sr-filters');
  var resultsEl = document.getElementById('anp-sr-results');
  box.value = params.get('q') || '';

  /* ---- the index ---- */
  function structure(){
    var out = [];
    CU.topics.filter(function(t){ return t.built; }).forEach(function(t){
      var ch = CHAPTER[t.chapter];
      var core = (t.core || []).map(function(k){ return CORE[k] ? CORE[k].name : k; }).join(', ');
      out.push({ page: 'Lessons', file: BASE + 'lessons/' + t.id + '.html', heading: t.title, meta: 'Topic ' + t.n + ' · ' + (ch ? ch.title : ''),
        text: t.title + '. Interactive lesson in ' + (ch ? ch.title : 'the course') + '. Core concepts: ' + core + '.', weight: 3 });
    });
    (window.AnpTools || []).forEach(function(t){
      out.push({ page: 'Tools', file: BASE + 'tools/' + t.slug + '.html', heading: t.name, meta: 'Interactive tool', text: t.name + '. ' + t.blurb, weight: 3 });
    });
    [['practice', 'Practice', 'Drill a topic, a system or a core concept; mixed review; missed questions.'],
     ['review', 'Review', 'Your spaced review queue of missed questions.'],
     ['exams', 'Exams', 'Unit quizzes, system exams and TEAS A&P practice.'],
     ['flashcards', 'Flashcards', 'Spaced-repetition cards from the glossary and comparison tables.'],
     ['mastery', 'Dashboard', 'Your mastery by topic, system and core concept.'],
     ['glossary', 'Glossary', 'Every defined term with word roots and pronunciation.'],
     ['learn', 'Learn', 'Every chapter and topic in course order.']].forEach(function(p){
      out.push({ page: 'Pages', file: BASE + p[0] + '.html', heading: p[1], meta: 'Course page', text: p[1] + '. ' + p[2], weight: 1.5 });
    });
    return out;
  }
  function glossary(g){
    // A lesson also answers for the terms it teaches ("mitral" finds the valves lesson).
    var byTopic = {};
    Object.keys(g || {}).forEach(function(cid){ var x = g[cid]; (byTopic[x.p] = byTopic[x.p] || []).push(x.t); });
    INDEX.forEach(function(c){
      var id = c.page === 'Lessons' && c.file.replace(/^.*lessons\//, '').replace(/\.html$/, '');
      if(id && byTopic[id]) c.text += ' Terms taught: ' + byTopic[id].join(', ') + '.';
    });
    return Object.keys(g || {}).map(function(cid){
      var x = g[cid], t = TOPIC[x.p];
      return { page: 'Glossary', file: BASE + 'glossary.html#t-' + cid, heading: x.t, meta: t ? 'Taught in ' + t.title : 'Glossary',
        text: x.d + (x.r && x.r.length ? ' Word roots: ' + x.r.map(function(r){ return r[0] + ' (' + r[1] + ')'; }).join(', ') + '.' : ''), weight: 2 };
    });
  }
  function noteChunks(entry, html){
    var doc = new DOMParser().parseFromString(html, 'text/html');
    var root = doc.querySelector('.anp-prose') || doc.querySelector('main') || doc.body;
    root.querySelectorAll('script,style,nav,.anp-crumb,.anp-onward').forEach(function(n){ n.remove(); });
    var out = [], heading = entry.title, hid = '';
    root.querySelectorAll('h2,h3,p,li,td,th,dd,figcaption').forEach(function(el){
      var text = (el.textContent || '').replace(/\s+/g, ' ').trim();
      if(!text) return;
      if(/^H[23]$/.test(el.tagName)){ heading = text; hid = el.id || ''; return; }
      if(text.length < 30) return;
      out.push({ page: 'Notes', file: entry.href + (hid ? '#' + hid : ''), heading: entry.title === heading ? entry.title : entry.title + ' — ' + heading, meta: 'Notes', text: text, weight: 1 });
    });
    return out;
  }
  function getJson(url){ return fetch(url).then(function(r){ if(!r.ok) throw 0; return r.json(); }); }
  function loadEngine(){
    if(window.LevlSearch) return Promise.resolve(window.LevlSearch);
    return new Promise(function(res, rej){
      var s = document.createElement('script');
      s.src = BASE + '../assets/site-search.js';
      s.onload = function(){ window.LevlSearch ? res(window.LevlSearch) : rej(); };
      s.onerror = rej;
      document.head.appendChild(s);
    });
  }

  /* ---- results ---- */
  function counts(hits){ var c = {}; hits.forEach(function(h){ c[h.page] = (c[h.page] || 0) + 1; }); return c; }
  var lastHits = [];
  function renderFilters(hits){
    var c = counts(hits);
    var btns = [['all', 'Everything', hits.length]];
    KINDS.forEach(function(k){ if(c[k]) btns.push([k, k, c[k]]); });
    if(active !== 'all' && !c[active]) btns.push([active, active, 0]);
    filtersEl.innerHTML = hits.length ? btns.map(function(b){
      return '<button type="button" class="anp-sr-chip" data-kind="' + esc(b[0]) + '" aria-pressed="' + (b[0] === active) + '">' + esc(b[1]) + ' <span>' + b[2] + '</span></button>';
    }).join('') : '';
  }
  function run(){
    var q = box.value.trim();
    try{ history.replaceState(null, '', q ? '?q=' + encodeURIComponent(q) : location.pathname); }catch(e){}
    if(!S){ return; }
    if(!q){ resultsEl.innerHTML = ''; filtersEl.innerHTML = ''; setStatus(); return; }
    var terms = S.tokenize(q);
    var hits = S.rank(INDEX, q, { limit: 400, maxPerSource: 3 });
    lastHits = hits;
    renderFilters(hits);
    var shown = active === 'all' ? hits : hits.filter(function(h){ return h.page === active; });
    if(!shown.length){
      resultsEl.innerHTML = '<p class="anp-sr-none">No matches for “' + esc(q) + '”' + (active !== 'all' ? ' in ' + esc(active) : '') + '. Try fewer words, or a related term.</p>';
      statusEl.textContent = 'No results.';
      return;
    }
    var groups = {};
    shown.forEach(function(h){ (groups[h.page] = groups[h.page] || []).push(h); });
    resultsEl.innerHTML = KINDS.filter(function(k){ return groups[k]; }).map(function(k){
      var list = groups[k], all = expanded[k] || active !== 'all';
      var vis = all ? list : list.slice(0, PER_GROUP);
      return '<section class="anp-sr-group" aria-label="' + esc(k) + '"><h2 class="anp-sr-gh">' + esc(k) + ' <span>' + list.length + '</span></h2><ul class="anp-sr-list">' +
        vis.map(function(h){
          var href = k === 'Notes' ? S.textFragment(h.file, terms) : h.file;
          return '<li><a class="anp-sr-hit" href="' + esc(href) + '"><span class="anp-sr-title">' + S.highlight(h.heading, terms, { lead: 0, span: 400 }) + '</span>' +
            '<span class="anp-sr-meta">' + esc(h.meta || '') + '</span>' +
            '<span class="anp-sr-snip">' + h.snippet + '</span></a></li>';
        }).join('') + '</ul>' +
        (vis.length < list.length ? '<button type="button" class="anp-sr-more" data-more="' + esc(k) + '">Show all ' + list.length + ' ' + esc(k.toLowerCase()) + '</button>' : '') +
        '</section>';
    }).join('');
    statusEl.textContent = shown.length + (shown.length === 1 ? ' result' : ' results') + (notesState === 'loading' ? ' so far (still indexing the notes)' : '') + '.';
  }
  function setStatus(){
    var n = INDEX.length;
    statusEl.textContent = notesState === 'loading' ? 'Indexing the notes… you can search already.' :
      n + ' passages indexed: lessons, notes, glossary and tools.' + (notesState === 'partial' ? ' Some notes pages could not load (offline?), so they are left out.' : '');
  }

  filtersEl.addEventListener('click', function(e){
    var b = e.target.closest('button[data-kind]'); if(!b) return;
    active = b.getAttribute('data-kind'); run();
    var again = filtersEl.querySelector('[data-kind="' + active + '"]'); if(again) again.focus();
  });
  resultsEl.addEventListener('click', function(e){
    var b = e.target.closest('[data-more]'); if(!b) return;
    var k = b.getAttribute('data-more'); expanded[k] = 1; run();
    var links = resultsEl.querySelectorAll('.anp-sr-group[aria-label="' + k + '"] .anp-sr-hit');
    if(links[PER_GROUP]) links[PER_GROUP].focus();
  });
  var t = 0;
  box.addEventListener('input', function(){ clearTimeout(t); expanded = {}; t = setTimeout(run, 40); });

  /* Keyboard: Down from the box enters the results; Up/Down move between
     them (Home/End jump); Escape returns to the box, or clears it. */
  function hits(){ return Array.prototype.slice.call(resultsEl.querySelectorAll('.anp-sr-hit, .anp-sr-more')); }
  box.addEventListener('keydown', function(e){
    if(e.key === 'ArrowDown'){ var h = hits(); if(h[0]){ e.preventDefault(); h[0].focus(); } }
    else if(e.key === 'Enter'){ var f = hits()[0]; if(f && f.tagName === 'A'){ e.preventDefault(); location.href = f.href; } }
    else if(e.key === 'Escape' && box.value){ e.preventDefault(); box.value = ''; run(); }
  });
  resultsEl.addEventListener('keydown', function(e){
    var h = hits(), i = h.indexOf(document.activeElement);
    if(i < 0) return;
    if(e.key === 'ArrowDown'){ e.preventDefault(); if(h[i + 1]) h[i + 1].focus(); }
    else if(e.key === 'ArrowUp'){ e.preventDefault(); (i ? h[i - 1] : box).focus(); }
    else if(e.key === 'Home'){ e.preventDefault(); h[0].focus(); }
    else if(e.key === 'End'){ e.preventDefault(); h[h.length - 1].focus(); }
    else if(e.key === 'Escape'){ e.preventDefault(); box.focus(); }
  });
  document.addEventListener('keydown', function(e){
    // "/" jumps to the search box from anywhere on the page.
    if(e.key === '/' && document.activeElement !== box && !/INPUT|TEXTAREA|SELECT/.test((e.target && e.target.tagName) || '')){ e.preventDefault(); box.focus(); box.select(); }
  });

  /* ---- boot ---- */
  loadEngine().then(function(engine){
    S = engine;
    INDEX = structure();
    return getJson(BASE + 'assets/glossary.json').then(function(g){ INDEX = INDEX.concat(glossary(g)); }, function(){});
  }).then(function(){
    if(!S) return;
    setStatus(); run();
    if(!box.value) box.focus({ preventScroll: true });
    // Notes last: many small fetches, done in the background.
    return getJson(BASE + 'assets/notes-index.json').then(function(list){
      var failed = 0;
      return Promise.all(list.map(function(n){
        var id = String(n.file).replace(/^.*\/notes\//, '').replace(/\.html$/, '');
        var entry = { title: n.title, href: BASE + 'notes/' + id + '.html' };
        return fetch(entry.href).then(function(r){ if(!r.ok) throw 0; return r.text(); })
          .then(function(html){ return noteChunks(entry, html); })
          .catch(function(){ failed++; return [{ page: 'Notes', file: entry.href, heading: n.title, meta: 'Notes', text: n.title, weight: 1 }]; });
      })).then(function(all){
        all.forEach(function(c){ INDEX = INDEX.concat(c); });
        notesState = failed ? 'partial' : 'done';
      });
    }, function(){ notesState = 'partial'; }).then(function(){
      if(box.value.trim()) run(); else setStatus();
    });
  }).catch(function(){
    statusEl.textContent = 'The search engine did not load. Check your connection and reload the page.';
  });
})();
