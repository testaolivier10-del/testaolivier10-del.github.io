/* The Organic Chemistry textbook — what Learn is now.

   Learn used to be a launcher: a list of 62 topic rows, each a door into its
   own interactive lesson, with the written explanation for a topic reachable
   only by opening that lesson with ?notes=1. Nothing you could read straight
   through, and no way to look something up without picking a lesson first.

   So the notes moved out of the lessons and into one book, organized the way
   the course already is: 14 modules (chapters), each holding its topics as
   sections. Every topic's prose lives in its own fragment under ochem/notes/
   — a single source of truth, fetched on demand, so opening the book costs one
   chapter rather than all 62 topics at once.

   The interactive lessons are untouched. They are still the main way through
   the course; the book links out to each topic's lesson from the section that
   explains it, and their mastery scores are what the badges here report.

   The rail's box searches the prose, not just the 62 section names: the notes
   are indexed as they are fetched (see textbook-search.js), a query lists the
   passages that match, and picking one opens that chapter and scrolls to the
   exact paragraph with the words lit up. Looking something up no longer
   requires knowing which section it lives in.

   Two kinds of progress, deliberately kept apart:
     mastery  — how the concept model rates you, rolled up per topic and per
                module. Earned by answering, never by reading.
     read     — whether you have actually been through a section. Inferred from
                reaching the end of one (and toggleable by hand), stored in
                'ochem_textbook_read'. It tracks coverage, not competence, and
                is never mixed into the mastery number.  */
(function(){
  var C = window.OchemCurriculum;
  var M = window.OchemMastery;
  var S = window.OchemTextbookSearch;
  if(!C) return;

  var READ_KEY = 'ochem_textbook_read';
  var LAST_KEY = 'ochem_textbook_last';
  var XP_PER_SECTION = 5; // for a first read only; re-reading pays nothing

  var contentsEl = document.getElementById('tbContents');
  var mainEl = document.getElementById('tbMain');
  var chapterEl = document.getElementById('tbChapter');
  var resultsEl = document.getElementById('tbResults');
  var progressEl = document.getElementById('tbProgress');
  var filterEl = document.getElementById('tbFilter');
  var toggleEl = document.getElementById('tbContentsToggle');

  var ALL_TOPICS = [];
  var TOPIC_META = {};
  C.MODULES.forEach(function(mod, i){
    mod.topics.forEach(function(t){
      ALL_TOPICS.push({ topic: t, mod: mod, modIndex: i });
      TOPIC_META[t.id] = { title: t.title, moduleId: mod.id, moduleTitle: mod.title, moduleIndex: i };
    });
  });

  // ---- read state -------------------------------------------------------
  function readRead(){
    try{ var raw = localStorage.getItem(READ_KEY); return raw ? JSON.parse(raw) : {}; }
    catch(e){ return {}; }
  }
  function writeRead(v){ try{ localStorage.setItem(READ_KEY, JSON.stringify(v)); }catch(e){} }
  function isRead(id){ return !!readRead()[id]; }
  function setRead(id, on){
    var r = readRead();
    var was = !!r[id];
    if(on) r[id] = new Date().toISOString(); else delete r[id];
    writeRead(r);
    // XP is for covering new ground, so it is paid once per section ever —
    // un-marking and re-marking a section can't farm it.
    if(on && !was && window.HubProgress) window.HubProgress.award('ochem', XP_PER_SECTION);
    return !was && on;
  }

  function lastModule(){
    try{ return localStorage.getItem(LAST_KEY) || ''; }catch(e){ return ''; }
  }
  function rememberModule(id){ try{ localStorage.setItem(LAST_KEY, id); }catch(e){} }

  // ---- mastery helpers --------------------------------------------------
  function topicPct(id){
    if(!M) return null;
    var r = M.topicStrength(id);
    return r.strength === null ? null : Math.round(r.strength * 100);
  }
  function modulePct(mod){
    if(!M) return null;
    var r = M.topicsStrength(mod.topics.map(function(t){ return t.id; }));
    return r.strength === null ? null : Math.round(r.strength * 100);
  }

  function escapeHtml(s){
    return String(s).replace(/[&<>"']/g, function(c){
      return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c];
    });
  }

  // ---- which chapter are we in -----------------------------------------
  function moduleIndexById(id){
    for(var i = 0; i < C.MODULES.length; i++) if(C.MODULES[i].id === id) return i;
    return -1;
  }
  function moduleIndexForTopic(id){
    for(var i = 0; i < C.MODULES.length; i++){
      for(var j = 0; j < C.MODULES[i].topics.length; j++){
        if(C.MODULES[i].topics[j].id === id) return i;
      }
    }
    return -1;
  }
  /* The hash names a topic ('#pka') or a whole chapter ('#m-acids-bases').
     A topic hash also says which chapter to open, so a deep link from a
     lesson, from Practice or from someone's bookmark lands on the section
     itself rather than the top of the book. */
  function routeFromHash(){
    var h = decodeURIComponent((location.hash || '').replace(/^#/, ''));
    if(!h) return { index: Math.max(0, moduleIndexById(lastModule())), topic: null };
    if(h.indexOf('m-') === 0){
      var mi = moduleIndexById(h.slice(2));
      if(mi !== -1) return { index: mi, topic: null };
    }
    var ti = moduleIndexForTopic(h);
    if(ti !== -1) return { index: ti, topic: h };
    return { index: Math.max(0, moduleIndexById(lastModule())), topic: null };
  }

  // ---- contents ---------------------------------------------------------
  /* `matched`, when given, is the set of topic ids whose *prose* matched the
     current query. Without it the rail can only match titles, which is what
     makes a content-only search look like it found nothing over here while the
     results panel lists a dozen passages. */
  function renderContents(activeIndex, filter, matched){
    var q = (filter || '').trim().toLowerCase();
    var read = readRead();

    var html = C.MODULES.map(function(mod, i){
      var topics = mod.topics.filter(function(t){
        if(!q) return true;
        if(matched && matched[t.id]) return true;
        return t.title.toLowerCase().indexOf(q) !== -1 || mod.title.toLowerCase().indexOf(q) !== -1;
      });
      if(!topics.length) return '';
      var doneCount = mod.topics.filter(function(t){ return read[t.id]; }).length;
      // A search is a lookup, not a browse: show every hit expanded rather
      // than making someone open 14 collapsed chapters to find the one match.
      var open = q ? true : i === activeIndex;
      return '<div class="tb-toc-mod' + (open ? ' open' : '') + '" data-mod="' + mod.id + '">' +
        '<button type="button" class="tb-toc-modhead" data-mod-index="' + i + '" aria-expanded="' + open + '">' +
          '<span class="tb-toc-num">' + (i + 1) + '</span>' +
          '<span class="tb-toc-modtitle">' + escapeHtml(mod.title) + '</span>' +
          '<span class="tb-toc-count' + (doneCount === mod.topics.length ? ' complete' : '') + '">' + doneCount + '/' + mod.topics.length + '</span>' +
        '</button>' +
        '<div class="tb-toc-topics">' + topics.map(function(t){
          return '<a href="#' + t.id + '" class="tb-toc-topic' + (read[t.id] ? ' read' : '') + '" data-topic="' + t.id + '">' +
            '<span class="tb-toc-tick" aria-hidden="true"></span>' +
            escapeHtml(t.title) +
          '</a>';
        }).join('') + '</div>' +
      '</div>';
    }).join('');

    contentsEl.innerHTML = html || '<p class="tb-toc-empty">Nothing in the book matches that.</p>';

    contentsEl.querySelectorAll('.tb-toc-modhead').forEach(function(btn){
      btn.addEventListener('click', function(){
        var group = btn.parentNode;
        var open = !group.classList.contains('open');
        group.classList.toggle('open', open);
        btn.setAttribute('aria-expanded', String(open));
      });
    });
    contentsEl.querySelectorAll('.tb-toc-topic').forEach(function(a){
      a.addEventListener('click', function(){
        // Picking a section from the contents is done searching: show the
        // chapter, but keep the query in the box so the list is one click back.
        hideResults();
        closeContentsOnMobile();
      });
    });
  }

  function renderOverallProgress(){
    var read = readRead();
    var done = ALL_TOPICS.filter(function(e){ return read[e.topic.id]; }).length;
    var pct = Math.round((done / ALL_TOPICS.length) * 100);
    progressEl.innerHTML =
      '<div class="tb-progress-row"><span>' + done + ' of ' + ALL_TOPICS.length + ' sections read</span><span>' + pct + '%</span></div>' +
      '<div class="tb-progress-track"><div class="tb-progress-fill" style="width:' + pct + '%"></div></div>';
  }

  // ---- one chapter ------------------------------------------------------
  var notesCache = {};
  function loadNotes(id){
    if(notesCache[id]) return notesCache[id];
    notesCache[id] = fetch('notes/' + id + '.html', { credentials: 'omit' })
      .then(function(r){
        if(!r.ok) throw new Error('HTTP ' + r.status);
        return r.text();
      })
      .then(function(html){
        // Whatever a section is fetched for — reading it or searching it — it
        // gets indexed once, here, so the two never fetch the same notes twice.
        if(S) S.add(id, TOPIC_META[id] || { title: id, moduleTitle: '', moduleId: '', moduleIndex: 0 }, html);
        return html;
      })
      .catch(function(){
        // Cached fetches fail offline for a section never opened before. Say
        // so in place rather than leaving a section that looks empty.
        delete notesCache[id];
        return '<p class="step-body tb-notes-error">These notes couldn\'t be loaded — check your connection and reload.</p>';
      });
    return notesCache[id];
  }

  function sectionActionsHtml(t){
    var links = [];
    if(t.href) links.push('<a class="btn-press sm" href="' + t.href + '">Do the interactive lesson &rarr;</a>');
    if(t.mechanism) links.push('<a class="btn-press alt sm" href="' + t.mechanism + '">Draw the mechanism &#9883;</a>');
    if(!links.length) return '<p class="tb-soon">The interactive lesson for this section is still being built.</p>';
    return '<div class="tb-actions">' + links.join('') + '</div>';
  }

  function renderChapter(index){
    var mod = C.MODULES[index];
    if(!mod) return;
    rememberModule(mod.id);
    var mastery = modulePct(mod);
    var read = readRead();
    var doneCount = mod.topics.filter(function(t){ return read[t.id]; }).length;

    var sections = mod.topics.map(function(t){
      var pct = topicPct(t.id);
      var done = !!read[t.id];
      return '<section class="tb-section" id="' + t.id + '" data-topic="' + t.id + '">' +
        '<div class="tb-section-head">' +
          '<h2 class="tb-section-title">' + escapeHtml(t.title) + '</h2>' +
          '<div class="tb-section-meta">' +
            (pct === null
              ? '<span class="tb-mastery none" title="Mastery comes from answering questions, not from reading">Not practiced</span>'
              : '<span class="tb-mastery" title="Concept mastery for this topic">' + pct + '% mastery</span>') +
            '<button type="button" class="tb-readtoggle' + (done ? ' done' : '') + '" data-topic="' + t.id + '" aria-pressed="' + done + '">' +
              '<span class="tb-tick" aria-hidden="true"></span><span class="tb-readlabel">' + (done ? 'Read' : 'Mark read') + '</span>' +
            '</button>' +
          '</div>' +
        '</div>' +
        '<div class="notes-view tb-notes" data-notes="' + t.id + '"><p class="tb-loading">Loading&hellip;</p></div>' +
        sectionActionsHtml(t) +
        '<div class="tb-section-end" data-end="' + t.id + '"></div>' +
      '</section>';
    }).join('');

    var prev = C.MODULES[index - 1];
    var next = C.MODULES[index + 1];

    chapterEl.innerHTML =
      '<header class="tb-chapter-head">' +
        '<p class="tb-chapter-eyebrow">Chapter ' + (index + 1) + ' of ' + C.MODULES.length + '</p>' +
        '<h1 class="tb-chapter-title">' + escapeHtml(mod.title) + '</h1>' +
        '<p class="tb-chapter-meta" id="tbChapterMeta" data-mastery="' +
          (mastery === null ? '' : mastery) + '" data-total="' + mod.topics.length + '">' +
          chapterMetaText(mod, doneCount, mastery) +
        '</p>' +
      '</header>' +
      sections +
      '<nav class="tb-chapter-nav">' +
        (prev ? '<a class="tb-chapter-link prev" href="#m-' + prev.id + '"><span>&larr; Previous chapter</span><b>' + escapeHtml(prev.title) + '</b></a>' : '<span></span>') +
        (next ? '<a class="tb-chapter-link next" href="#m-' + next.id + '"><span>Next chapter &rarr;</span><b>' + escapeHtml(next.title) + '</b></a>' : '<span></span>') +
      '</nav>';

    mod.topics.forEach(function(t){
      loadNotes(t.id).then(function(html){
        var slot = mainEl.querySelector('[data-notes="' + t.id + '"]');
        if(slot) slot.innerHTML = html;
        observeEnds();
        applyPendingHit();
      });
    });

    mainEl.querySelectorAll('.tb-readtoggle').forEach(function(btn){
      btn.addEventListener('click', function(){
        var id = btn.getAttribute('data-topic');
        markRead(id, !isRead(id));
      });
    });

    observeEnds();
  }

  // ---- "you've been through this" --------------------------------------
  /* A section counts as read once its end marker has *stayed* on screen for a
     moment — i.e. you got to the last paragraph and lingered there. Marking on
     mere entry would tick off a whole chapter the moment someone flicked to
     the bottom, or on load for any section short enough to fit on screen
     whole; an explicit checkbox alone would leave the progress bar empty for
     people who did read every word. The manual toggle stays for both
     directions, including un-marking something this got wrong. */
  var DWELL_MS = 1500;
  var endObserver = null;
  var dwellTimers = {};
  function observeEnds(){
    if(!('IntersectionObserver' in window)) return;
    if(!endObserver){
      endObserver = new IntersectionObserver(function(entries){
        entries.forEach(function(e){
          var id = e.target.getAttribute('data-end');
          if(!id) return;
          if(!e.isIntersecting){
            clearTimeout(dwellTimers[id]);
            delete dwellTimers[id];
            return;
          }
          if(isRead(id) || dwellTimers[id]) return;
          dwellTimers[id] = setTimeout(function(){
            delete dwellTimers[id];
            if(!isRead(id)) markRead(id, true);
          }, DWELL_MS);
        });
      }, { rootMargin: '0px 0px -12% 0px' });
    }
    mainEl.querySelectorAll('.tb-section-end').forEach(function(el){
      if(el.dataset.observed) return;
      el.dataset.observed = '1';
      endObserver.observe(el);
    });
  }

  function markRead(id, on){
    setRead(id, on);
    var btn = mainEl.querySelector('.tb-readtoggle[data-topic="' + id + '"]');
    if(btn){
      btn.classList.toggle('done', on);
      btn.setAttribute('aria-pressed', String(on));
      var label = btn.querySelector('.tb-readlabel');
      if(label) label.textContent = on ? 'Read' : 'Mark read';
    }
    var tocLink = contentsEl.querySelector('.tb-toc-topic[data-topic="' + id + '"]');
    if(tocLink) tocLink.classList.toggle('read', on);
    refreshCounts();
    renderOverallProgress();
    if(window.HubProgress) window.HubProgress.renderChips();
  }

  function chapterMetaText(mod, doneCount, mastery){
    return mod.topics.length + ' section' + (mod.topics.length === 1 ? '' : 's') +
      ' \u00b7 ' + doneCount + ' read' +
      ' \u00b7 ' + (mastery === null ? 'not practiced yet' : mastery + '% mastery');
  }

  function refreshCounts(){
    var read = readRead();
    var mod = C.MODULES[currentIndex];
    var meta = document.getElementById('tbChapterMeta');
    if(mod && meta){
      var raw = meta.getAttribute('data-mastery');
      meta.textContent = chapterMetaText(mod, mod.topics.filter(function(t){ return read[t.id]; }).length,
        raw === '' ? null : parseInt(raw, 10));
    }
    C.MODULES.forEach(function(mod){
      var el = contentsEl.querySelector('.tb-toc-mod[data-mod="' + mod.id + '"] .tb-toc-count');
      if(!el) return;
      var n = mod.topics.filter(function(t){ return read[t.id]; }).length;
      el.textContent = n + '/' + mod.topics.length;
      el.classList.toggle('complete', n === mod.topics.length);
    });
  }

  // ---- contents drawer (narrow screens) --------------------------------
  function closeContentsOnMobile(){
    if(window.matchMedia('(max-width: 900px)').matches) document.body.classList.remove('tb-toc-open');
  }
  if(toggleEl){
    toggleEl.addEventListener('click', function(){
      document.body.classList.toggle('tb-toc-open');
    });
  }


  // ---- searching the prose ---------------------------------------------
  /* The whole book is 62 small fragments, so the index is built by fetching
     them — no second copy of the text to ship or keep current. It is built
     once, on the first real query, and chapters already read are free because
     they are already in the notes cache. */
  var MIN_QUERY = 2;
  var indexPromise = null;
  var indexReady = false;
  var searchTimer = null;
  var activeQuery = '';
  var lastMatched = null;
  var pendingHit = null;

  function ensureIndex(onProgress){
    if(indexPromise) return indexPromise;
    var ids = ALL_TOPICS.map(function(e){ return e.topic.id; });
    var next = 0, done = 0;
    function lane(){
      if(next >= ids.length) return Promise.resolve();
      var id = ids[next++];
      return loadNotes(id).then(function(){
        done++;
        if(onProgress) onProgress(done, ids.length);
        return lane();
      });
    }
    var lanes = [];
    for(var k = 0; k < 6; k++) lanes.push(lane());
    indexPromise = Promise.all(lanes).then(function(){
      // A section that failed to fetch (offline, say) is simply missing from
      // the index; let the next query try it again rather than searching a
      // permanently short book.
      if(S && S.count() >= ids.length) indexReady = true;
      else indexPromise = null;
    });
    return indexPromise;
  }

  function showResults(){
    resultsEl.hidden = false;
    chapterEl.hidden = true;
  }
  function hideResults(){
    resultsEl.hidden = true;
    chapterEl.hidden = false;
  }
  function closeSearch(){
    clearTimeout(searchTimer);
    activeQuery = '';
    lastMatched = null;
    hideResults();
    resultsEl.innerHTML = '';
  }

  function runSearch(q){
    if(!S){ return; }
    activeQuery = q;
    showResults();
    if(indexReady){
      renderResults(q);
      return;
    }
    resultsEl.innerHTML = '<p class="tb-results-status" id="tbIndexStatus">Reading the whole book so it can be searched&hellip;</p>';
    ensureIndex(function(done, total){
      var el = document.getElementById('tbIndexStatus');
      if(el) el.textContent = 'Reading the whole book so it can be searched… ' + Math.round((done / total) * 100) + '%';
    }).then(function(){
      if(activeQuery === q) renderResults(q);
    });
  }

  function resultHitHtml(topicId, hit){
    return '<button type="button" class="tb-result-hit" data-topic="' + topicId + '" data-block="' + hit.blockIndex + '">' +
      (hit.heading ? '<span class="tb-result-heading">' + S.escapeHtml(hit.heading) + '</span>' : '') +
      '<span class="tb-result-snippet">' + hit.snippet + '</span>' +
    '</button>';
  }

  function renderResults(q){
    var results = S.search(q, { limit: 24 });
    // What was actually searched for, which is not always what was typed:
    // "what is a nucleophile" searches for "nucleophile", and saying so beats
    // a count that claims 33 sections mention the whole sentence.
    var shownQuery = S.escapeHtml(S.terms(q).join(' ') || q);

    lastMatched = {};
    results.forEach(function(r){ lastMatched[r.topicId] = true; });
    renderContents(currentIndex, q, lastMatched);

    if(!results.length){
      resultsEl.innerHTML =
        '<div class="tb-results-head">' +
          '<p class="tb-results-count">Nothing in the book matches <b>' + shownQuery + '</b></p>' +
          '<button type="button" class="tb-results-close" id="tbResultsClose">Back to the chapter</button>' +
        '</div>' +
        '<p class="tb-results-status">Try a single word — the search wants every word you type to appear in the same section.</p>';
    } else {
      resultsEl.innerHTML =
        '<div class="tb-results-head">' +
          '<p class="tb-results-count">' + (results.total > results.length
              ? results.total + ' sections mention <b>' + shownQuery + '</b> &middot; closest ' + results.length
              : results.length + ' section' + (results.length === 1 ? '' : 's') + ' mention <b>' + shownQuery + '</b>') +
          '</p>' +
          '<button type="button" class="tb-results-close" id="tbResultsClose">Back to the chapter</button>' +
        '</div>' +
        results.map(function(r){
          return '<article class="tb-result">' +
            '<button type="button" class="tb-result-head" data-topic="' + r.topicId + '" data-block="-1">' +
              '<span class="tb-result-chapter">Chapter ' + (r.moduleIndex + 1) + ' &middot; ' + S.escapeHtml(r.moduleTitle) + '</span>' +
              '<span class="tb-result-title">' + S.escapeHtml(r.title) + '</span>' +
            '</button>' +
            r.hits.map(function(h){ return resultHitHtml(r.topicId, h); }).join('') +
          '</article>';
        }).join('');
    }

    var close = document.getElementById('tbResultsClose');
    if(close) close.addEventListener('click', function(){
      filterEl.value = '';
      closeSearch();
      renderContents(currentIndex, '');
      filterEl.focus();
    });
    resultsEl.querySelectorAll('[data-topic]').forEach(function(btn){
      btn.addEventListener('click', function(){
        goToHit(btn.getAttribute('data-topic'), parseInt(btn.getAttribute('data-block'), 10));
      });
    });
  }

  /* Open the section a result came from and put the reader on the passage
     itself. The chapter may still be fetching its notes, so the jump is left
     pending and applied by whichever comes last — this call or the fragment
     landing in the page. */
  function goToHit(topicId, blockIndex){
    pendingHit = { topic: topicId, block: isNaN(blockIndex) ? -1 : blockIndex, terms: S.terms(activeQuery) };
    hideResults();
    closeContentsOnMobile();
    var target = '#' + topicId;
    // Either way the jump is finished by route(), which scrolls to the section
    // first and then hands off to applyPendingHit for the exact paragraph.
    if(location.hash === target) route();
    else location.hash = target;
  }

  function clearHits(){
    mainEl.querySelectorAll('.tb-hit').forEach(function(el){ el.classList.remove('tb-hit'); });
    mainEl.querySelectorAll('mark.tb-hit-mark').forEach(function(m){
      var parent = m.parentNode;
      if(!parent) return;
      parent.replaceChild(document.createTextNode(m.textContent), m);
      parent.normalize();
    });
  }

  function markTerms(root, ts){
    if(!ts || !ts.length) return;
    var nodes = [], walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
    var n;
    while((n = walker.nextNode())) nodes.push(n);
    nodes.forEach(function(node){
      var text = node.nodeValue;
      var rs = S.ranges(text, ts);
      if(!rs.length || !node.parentNode) return;
      var frag = document.createDocumentFragment(), at = 0;
      rs.forEach(function(r){
        if(r[0] > at) frag.appendChild(document.createTextNode(text.slice(at, r[0])));
        var m = document.createElement('mark');
        m.className = 'tb-hit-mark';
        m.textContent = text.slice(r[0], r[1]);
        frag.appendChild(m);
        at = r[1];
      });
      if(at < text.length) frag.appendChild(document.createTextNode(text.slice(at)));
      node.parentNode.replaceChild(frag, node);
    });
  }

  function applyPendingHit(){
    if(!pendingHit) return;
    var slot = mainEl.querySelector('[data-notes="' + pendingHit.topic + '"]');
    if(!slot || slot.querySelector('.tb-loading')) return; // notes still in flight
    var hit = pendingHit;
    pendingHit = null;
    clearHits();
    var el = hit.block >= 0 ? slot.children[hit.block] : null;
    if(!el){
      var sec = document.getElementById(hit.topic);
      if(sec) sec.scrollIntoView({ block: 'start' });
      return;
    }
    markTerms(el, hit.terms);
    el.classList.add('tb-hit');
    el.scrollIntoView({ block: 'center' });
    // The flash says "here"; the highlighted words stay so the passage is
    // still readable as an answer once the flash has gone.
    setTimeout(function(){ el.classList.remove('tb-hit'); }, 2600);
  }

  // ---- routing ----------------------------------------------------------
  var currentIndex = -1;
  function route(){
    var r = routeFromHash();
    if(r.index !== currentIndex){
      currentIndex = r.index;
      renderChapter(currentIndex);
      renderContents(currentIndex, filterEl ? filterEl.value : '', lastMatched);
    }
    if(r.topic){
      var el = document.getElementById(r.topic);
      if(el) el.scrollIntoView({ block: 'start' });
    } else {
      window.scrollTo(0, 0);
    }
    contentsEl.querySelectorAll('.tb-toc-topic').forEach(function(a){
      a.classList.toggle('current', a.getAttribute('data-topic') === r.topic);
    });
    applyPendingHit();
  }

  window.addEventListener('hashchange', route);
  if(filterEl){
    filterEl.addEventListener('input', function(){
      var q = filterEl.value.trim();
      clearTimeout(searchTimer);
      if(q.length < MIN_QUERY){
        closeSearch();
        renderContents(currentIndex, filterEl.value);
        return;
      }
      // Titles still filter on every keystroke; the prose search waits for a
      // pause so a long query isn't run once per letter.
      renderContents(currentIndex, filterEl.value, lastMatched);
      searchTimer = setTimeout(function(){ runSearch(q); }, 180);
    });
    filterEl.addEventListener('keydown', function(e){
      if(e.key === 'Escape'){
        filterEl.value = '';
        closeSearch();
        renderContents(currentIndex, '');
      } else if(e.key === 'Enter'){
        e.preventDefault();
        clearTimeout(searchTimer);
        var q = filterEl.value.trim();
        if(q.length >= MIN_QUERY){
          runSearch(q);
          // On a phone the contents are a drawer sitting over the results, so
          // committing a search has to get it out of the way.
          closeContentsOnMobile();
          resultsEl.scrollIntoView({ block: 'start' });
        }
      }
    });
  }

  renderOverallProgress();
  route();
})();
