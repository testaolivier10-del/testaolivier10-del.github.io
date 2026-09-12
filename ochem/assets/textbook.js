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
  if(!C) return;

  var READ_KEY = 'ochem_textbook_read';
  var LAST_KEY = 'ochem_textbook_last';
  var XP_PER_SECTION = 5; // for a first read only; re-reading pays nothing

  var contentsEl = document.getElementById('tbContents');
  var mainEl = document.getElementById('tbMain');
  var progressEl = document.getElementById('tbProgress');
  var filterEl = document.getElementById('tbFilter');
  var toggleEl = document.getElementById('tbContentsToggle');

  var ALL_TOPICS = [];
  C.MODULES.forEach(function(mod, i){
    mod.topics.forEach(function(t){ ALL_TOPICS.push({ topic: t, mod: mod, modIndex: i }); });
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
  function renderContents(activeIndex, filter){
    var q = (filter || '').trim().toLowerCase();
    var read = readRead();

    var html = C.MODULES.map(function(mod, i){
      var topics = mod.topics.filter(function(t){
        return !q || t.title.toLowerCase().indexOf(q) !== -1 || mod.title.toLowerCase().indexOf(q) !== -1;
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

    contentsEl.innerHTML = html || '<p class="tb-toc-empty">No topic matches that.</p>';

    contentsEl.querySelectorAll('.tb-toc-modhead').forEach(function(btn){
      btn.addEventListener('click', function(){
        var group = btn.parentNode;
        var open = !group.classList.contains('open');
        group.classList.toggle('open', open);
        btn.setAttribute('aria-expanded', String(open));
      });
    });
    contentsEl.querySelectorAll('.tb-toc-topic').forEach(function(a){
      a.addEventListener('click', function(){ closeContentsOnMobile(); });
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

    mainEl.innerHTML =
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

  // ---- routing ----------------------------------------------------------
  var currentIndex = -1;
  function route(){
    var r = routeFromHash();
    if(r.index !== currentIndex){
      currentIndex = r.index;
      renderChapter(currentIndex);
      renderContents(currentIndex, filterEl ? filterEl.value : '');
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
  }

  window.addEventListener('hashchange', route);
  if(filterEl){
    filterEl.addEventListener('input', function(){
      renderContents(currentIndex, filterEl.value);
    });
  }

  renderOverallProgress();
  route();
})();
