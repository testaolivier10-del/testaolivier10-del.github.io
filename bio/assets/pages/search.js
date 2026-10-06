/* Search across the AP® Biology course (forked from
   anatomy-physiology/assets/apps/search.js): lessons, notes, glossary,
   free-response questions, tools and course pages, all in the browser.

   Sources, each allowed to fail on its own:
     ApBioCurriculum            the published topics: one lesson result each
     window.ApBioTools          the tools (when the tools branch adds them)
     assets/glossary.json       every defined term
     assets/frq/index.json      the free-response questions
     assets/notes-index.json, then each notes page, split into passages
                                (fetched in the background)
   Matching, ranking and highlighting: the site's shared engine,
   assets/site-search.js (LevlSearch), loaded here. The query lives in
   ?q=, so a search is a shareable link. */
(function(){
  /* assets/glossary.json is the shared shape (scripts/lib/glossary.mjs); this
     file works on the old map {id: {t, d, r, s, p, b}}. */
  function glossMap(g){
    if(!g || !g.terms) return g || {};
    var o = {};
    g.terms.forEach(function(x){ o[x.id] = { t: x.term, d: x.def, r: x.roots || [], s: x.say || '', p: x.topic, b: x.href ? 1 : 0 }; });
    return o;
  }
  var app = document.getElementById('app');
  var CU = window.ApBioCurriculum;
  if(!app || !CU) return;
  var BASE = window.ApBioBase || '';
  var KINDS = ['Lessons', 'Notes', 'Glossary', 'Free response', 'Tools', 'Pages'];
  var PER_GROUP = 8;
  var INDEX = [], S = null, active = 'all', expanded = {}, notesState = 'loading';
  function esc(s){ return String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
  var TOPIC = {}, UNIT = {};
  CU.topics.forEach(function(t){ TOPIC[t.id] = t; });
  CU.units.forEach(function(u){ UNIT[u.id] = u; });
  function unitName(u){ var c = UNIT[u]; return c ? (c.part === 'course' ? 'Unit ' + c.n + ': ' : '') + c.title : ''; }

  var params = new URLSearchParams(location.search);
  app.innerHTML = '<div class="bio-sr">' +
    '<div class="bio-sr-box"><label class="sr-only" for="bio-sr-q">Search the course</label>' +
      '<svg class="bio-sr-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="10.5" cy="10.5" r="6.5" fill="none" stroke="currentColor" stroke-width="2.4"/><path d="M15.5 15.5 21 21" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>' +
      '<input type="search" id="bio-sr-q" class="bio-sr-input" placeholder="Search lessons, notes, terms and questions (e.g. “hydrogen bond”)" autocomplete="off" spellcheck="false" aria-describedby="bio-sr-status bio-sr-help" aria-controls="bio-sr-results"></div>' +
    '<p class="bio-sr-help" id="bio-sr-help">Results appear as you type. <kbd>↓</kbd> moves into the results, <kbd>↑</kbd> <kbd>↓</kbd> between them, <kbd>Enter</kbd> opens one, <kbd>Esc</kbd> returns here.</p>' +
    '<p class="bio-sr-all"><a id="bio-sr-all" href="' + BASE + '../search.html">Search all courses &rarr;</a></p>' +
    '<div class="bio-sr-status" id="bio-sr-status" role="status" aria-live="polite">Building the search index…</div>' +
    '<div class="bio-sr-filters" id="bio-sr-filters" role="group" aria-label="Filter results by kind"></div>' +
    '<div id="bio-sr-results" class="bio-sr-results"></div></div>';
  var box = document.getElementById('bio-sr-q'), statusEl = document.getElementById('bio-sr-status'), filtersEl = document.getElementById('bio-sr-filters'), resultsEl = document.getElementById('bio-sr-results'), allLink = document.getElementById('bio-sr-all');
  box.value = params.get('q') || '';

  function structure(){
    var out = [];
    CU.topics.filter(function(t){ return t.built; }).forEach(function(t){
      out.push({ page: 'Lessons', file: BASE + 'lessons/' + t.id + '.html', heading: t.title, meta: (t.ced ? 'Topic ' + t.ced + ' · ' : '') + unitName(t.unit), text: t.title + '. Lesson in ' + unitName(t.unit) + '.', weight: 3 });
    });
    (window.ApBioTools || []).forEach(function(t){ if(t && t.slug) out.push({ page: 'Tools', file: BASE + 'tools/' + t.slug + '.html', heading: t.name, meta: 'Interactive tool', text: t.name + '. ' + (t.blurb || ''), weight: 3 }); });
    [['practice', 'Practice', 'Questions by unit, topic, science practice, type and difficulty; stimulus sets; missed questions.'],
     ['review', 'Review', 'Your spaced review queue of missed questions.'],
     ['exams', 'Exams', 'Unit tests and full practice exams in the hybrid format, with rubrics.'],
     ['frq', 'Free-response practice', 'All six free-response types with rubrics, sample answers and printable sheets.'],
     ['flashcards', 'Flashcards', 'Spaced-repetition cards from the glossary and lesson summaries.'],
     ['dashboard', 'Dashboard', 'Your mastery by unit, topic and science practice.'],
     ['glossary', 'Glossary', 'Every defined term.'],
     ['teachers', 'For teachers', 'Share links, Google Classroom, printing, framework alignment.'],
     ['learn', 'Learn', 'Every unit and topic in course order.']].forEach(function(p){
      out.push({ page: 'Pages', file: BASE + p[0] + '.html', heading: p[1], meta: 'Course page', text: p[1] + '. ' + p[2], weight: 1.5 });
    });
    return out;
  }
  function glossary(g){
    var byTopic = {};
    Object.keys(g || {}).forEach(function(cid){ var x = g[cid]; (byTopic[x.p] = byTopic[x.p] || []).push(x.t); });
    INDEX.forEach(function(c){ var id = c.page === 'Lessons' && c.file.replace(/^.*lessons\//, '').replace(/\.html$/, ''); if(id && byTopic[id]) c.text += ' Terms taught: ' + byTopic[id].join(', ') + '.'; });
    return Object.keys(g || {}).map(function(cid){
      var x = g[cid], t = TOPIC[x.p];
      return { page: 'Glossary', file: BASE + 'glossary.html#t-' + cid, heading: x.t, meta: t ? 'Taught in ' + t.title : 'Glossary', text: x.d, weight: 2 };
    });
  }
  function frqs(list){
    return (list || []).map(function(f){ return { page: 'Free response', file: BASE + 'frq/' + f.id + '.html', heading: f.title, meta: (f.units || []).map(unitName).join(', ') + ' · ' + f.points + ' points', text: f.title + '. Free-response question. ' + (f.topics || []).map(function(t){ return TOPIC[t] ? TOPIC[t].title : ''; }).join(', '), weight: 2 }; });
  }
  function noteChunks(entry, html){
    var doc = new DOMParser().parseFromString(html, 'text/html');
    var root = doc.querySelector('.bio-prose') || doc.querySelector('main') || doc.body;
    root.querySelectorAll('script,style,nav,.bio-crumb').forEach(function(n){ n.remove(); });
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
    function ok(){ var L = window.LevlSearch; return L && typeof L.rank === 'function' && typeof L.tokenize === 'function'; }
    if(ok()) return Promise.resolve(window.LevlSearch);
    return new Promise(function(res, rej){
      var s = document.createElement('script');
      s.src = BASE + '../assets/site-search.js';
      s.onload = function(){ ok() ? res(window.LevlSearch) : rej(); };
      s.onerror = rej;
      document.head.appendChild(s);
    });
  }
  function counts(hits){ var c = {}; hits.forEach(function(h){ c[h.page] = (c[h.page] || 0) + 1; }); return c; }
  function renderFilters(hits){
    var c = counts(hits), btns = [['all', 'Everything', hits.length]];
    KINDS.forEach(function(k){ if(c[k]) btns.push([k, k, c[k]]); });
    if(active !== 'all' && !c[active]) btns.push([active, active, 0]);
    filtersEl.innerHTML = hits.length ? btns.map(function(b){ return '<button type="button" class="bio-sr-chip" data-kind="' + esc(b[0]) + '" aria-pressed="' + (b[0] === active) + '">' + esc(b[1]) + ' <span>' + b[2] + '</span></button>'; }).join('') : '';
  }
  function run(){
    var q = box.value.trim();
    try{ history.replaceState(null, '', q ? '?q=' + encodeURIComponent(q) : location.pathname); }catch(e){}
    allLink.href = BASE + '../search.html' + (q ? '?q=' + encodeURIComponent(q) : '');
    if(!S) return;
    if(!q){ resultsEl.innerHTML = ''; filtersEl.innerHTML = ''; setStatus(); return; }
    var terms = S.tokenize(q), hits = S.rank(INDEX, q, { limit: 400, maxPerSource: 3 });
    renderFilters(hits);
    var shown = active === 'all' ? hits : hits.filter(function(h){ return h.page === active; });
    if(!shown.length){ resultsEl.innerHTML = '<p class="bio-sr-none">No matches for “' + esc(q) + '”' + (active !== 'all' ? ' in ' + esc(active) : '') + '. Try fewer words, or a related term.</p>'; statusEl.textContent = 'No results.'; return; }
    var groups = {};
    shown.forEach(function(h){ (groups[h.page] = groups[h.page] || []).push(h); });
    resultsEl.innerHTML = KINDS.filter(function(k){ return groups[k]; }).map(function(k){
      var list = groups[k], vis = expanded[k] || active !== 'all' ? list : list.slice(0, PER_GROUP);
      return '<section class="bio-sr-group" aria-label="' + esc(k) + '"><h2 class="bio-sr-gh">' + esc(k) + ' <span>' + list.length + '</span></h2><ul class="bio-sr-list">' +
        vis.map(function(h){
          var href = k === 'Notes' ? S.textFragment(h.file, terms) : h.file;
          return '<li><a class="bio-sr-hit" href="' + esc(href) + '"><span class="bio-sr-title">' + S.highlight(h.heading, terms, { lead: 0, span: 400 }) + '</span><span class="bio-sr-meta">' + esc(h.meta || '') + '</span><span class="bio-sr-snip">' + h.snippet + '</span></a></li>';
        }).join('') + '</ul>' + (vis.length < list.length ? '<button type="button" class="bio-sr-more" data-more="' + esc(k) + '">Show all ' + list.length + ' ' + esc(k.toLowerCase()) + '</button>' : '') + '</section>';
    }).join('');
    statusEl.textContent = shown.length + (shown.length === 1 ? ' result' : ' results') + (notesState === 'loading' ? ' so far (still indexing the notes)' : '') + '.';
  }
  function setStatus(){
    statusEl.textContent = notesState === 'loading' ? 'Indexing the notes… you can search already.' : INDEX.length + ' passages indexed: lessons, notes, glossary and free-response questions.' + (notesState === 'partial' ? ' Some notes pages could not load (offline?), so they are left out.' : '');
  }
  filtersEl.addEventListener('click', function(e){ var b = e.target.closest('button[data-kind]'); if(!b) return; active = b.getAttribute('data-kind'); run(); var again = filtersEl.querySelector('[data-kind="' + active + '"]'); if(again) again.focus(); });
  resultsEl.addEventListener('click', function(e){
    var b = e.target.closest('[data-more]'); if(!b) return;
    var k = b.getAttribute('data-more'); expanded[k] = 1; run();
    var links = resultsEl.querySelectorAll('.bio-sr-group[aria-label="' + k + '"] .bio-sr-hit'); if(links[PER_GROUP]) links[PER_GROUP].focus();
  });
  var timer = 0;
  box.addEventListener('input', function(){ clearTimeout(timer); expanded = {}; timer = setTimeout(run, 40); });
  function hits(){ return Array.prototype.slice.call(resultsEl.querySelectorAll('.bio-sr-hit, .bio-sr-more')); }
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
    if(e.key === '/' && document.activeElement !== box && !/INPUT|TEXTAREA|SELECT/.test((e.target && e.target.tagName) || '')){ e.preventDefault(); box.focus(); box.select(); }
  });

  loadEngine().then(function(engine){
    S = engine;
    INDEX = structure();
    return Promise.all([
      getJson(BASE + 'assets/glossary.json').then(function(g){ INDEX = INDEX.concat(glossary(glossMap(g))); }, function(){}),
      getJson(BASE + 'assets/frq/index.json').then(function(l){ INDEX = INDEX.concat(frqs(l)); }, function(){})
    ]);
  }).then(function(){
    if(!S) return;
    setStatus(); run();
    if(!box.value) box.focus({ preventScroll: true });
    return getJson(BASE + 'assets/notes-index.json').then(function(list){
      var failed = 0;
      return Promise.all(list.map(function(n){
        var id = String(n.file).replace(/^.*\/notes\//, '').replace(/\.html$/, '');
        var entry = { title: n.title, href: BASE + 'notes/' + id + '.html' };
        return fetch(entry.href).then(function(r){ if(!r.ok) throw 0; return r.text(); }).then(function(h){ return noteChunks(entry, h); })
          .catch(function(){ failed++; return [{ page: 'Notes', file: entry.href, heading: n.title, meta: 'Notes', text: n.title, weight: 1 }]; });
      })).then(function(all){ all.forEach(function(c){ INDEX = INDEX.concat(c); }); notesState = failed ? 'partial' : 'done'; });
    }, function(){ notesState = 'partial'; }).then(function(){ if(box.value.trim()) run(); else setStatus(); });
  }).catch(function(){ statusEl.textContent = 'The search engine did not load. Check your connection and reload the page.'; });
})();
