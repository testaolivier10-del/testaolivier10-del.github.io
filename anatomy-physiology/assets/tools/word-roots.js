/* Word root builder (docs/anp-spec.md section 8.7).

   Content: data/tools/word-roots.json, a bank of prefixes, roots and suffixes
   (each with its real meaning and source language) and the terms built from
   them, each tagged with the topic that teaches it.

   Modes:
     Decode     a term is split into its parts; the learner gives each part's
                meaning, suffix first (the order the Word parts lesson
                teaches), then the meaning of the whole term.
     Build      a meaning is given; the learner assembles the term from part
                cards (tap or press Enter to place, tap a placed card to take
                it back). No dragging, so it works by keyboard and on a phone.
     Part bank  every part offered so far, with its origin and example terms.

   The topic filter keeps the ordering rule: only terms whose topic comes at
   or before the chosen topic are offered, and only the parts those terms
   use. Scored items: word-roots:<term>:decode and word-roots:<term>:build,
   recorded through AnpCore so misses reach the review queue. Each term links
   to the course glossary when the glossary defines it, but only after the
   answer, so the definition never gives the answer away. */
(function(){
  var KIND = 'word-roots';
  var app = document.getElementById('app');
  if(!app) return;
  var base = window.ANP_BASE || '../';
  var src = app.getAttribute('data-src') || (base + 'data/tools/word-roots.json');
  var PREF = 'anp_wordroots_prefs_v1';

  function esc(s){ return String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
  function shuffle(a){ a = a.slice(); for(var i = a.length - 1; i > 0; i--){ var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function pick(a){ return a[Math.floor(Math.random() * a.length)]; }

  var DATA = null, GLOSS = {}, PARTS = {}, TOPIC_IDX = {}, TOPICS = [];
  var state = { mode: 'decode', upto: null, cur: null, done: false, placed: [], session: { n: 0, c: 0 } };

  function loadPrefs(){ try{ return JSON.parse(localStorage.getItem(PREF) || '{}') || {}; }catch(e){ return {}; } }
  // The topic filter is saved only once you choose it yourself; until then it
  // follows your progress.
  function savePrefs(withUpto){
    var p = loadPrefs(); p.mode = state.mode;
    if(withUpto) p.upto = state.upto;
    try{ localStorage.setItem(PREF, JSON.stringify(p)); }catch(e){}
  }

  function topicTitle(id){ var t = TOPICS[TOPIC_IDX[id]]; return t ? t.title : id; }
  function topicBuilt(id){ var t = TOPICS[TOPIC_IDX[id]]; return !!(t && t.built); }
  function topicHtml(id){
    var n = TOPIC_IDX[id] + 1;
    return topicBuilt(id) ? '<a href="' + base + 'lessons/' + esc(id) + '.html">' + n + '. ' + esc(topicTitle(id)) + '</a>' : n + '. ' + esc(topicTitle(id));
  }

  /* ------------------------------------------------------ what is offered */

  function available(){
    var lim = state.upto == null ? Infinity : TOPIC_IDX[state.upto];
    return DATA.terms.filter(function(t){ return TOPIC_IDX[t.topic] <= lim; });
  }
  function availableParts(){
    var seen = {}, out = [];
    available().forEach(function(t){ t.segs.forEach(function(s){ if(s[1] && !seen[s[1]]){ seen[s[1]] = 1; out.push(PARTS[s[1]]); } }); });
    return out;
  }
  function labeled(t){ return t.segs.filter(function(s){ return s[1]; }); }
  function itemId(t, mode){ return KIND + ':' + t.id + ':' + mode; }

  /* The next term: never tried in this mode first, then missed, then the one
     seen longest ago; ties broken at random. */
  function nextTerm(){
    var terms = available();
    if(!terms.length) return null;
    var store = window.AnpCore ? window.AnpCore.load().q : {};
    var scored = shuffle(terms).map(function(t){
      var r = store[itemId(t, state.mode)];
      var rank = !r ? 0 : !r.right ? 1 : 2;
      return { t: t, rank: rank, seen: r ? r.seen : 0 };
    });
    scored.sort(function(a, b){ return a.rank - b.rank || a.seen - b.seen; });
    var best = scored[0];
    if(state.cur && best.t.id === state.cur.id && scored.length > 1) best = scored[1];
    return best.t;
  }

  /* The default filter: the furthest topic you have studied (a finished
     lesson or any answered item), so you are not shown terms from pages you
     have not reached. With no progress yet, everything. */
  function defaultUpto(){
    if(!window.AnpCore) return null;
    var d = window.AnpCore.load(), far = -1;
    Object.keys(d.lessons || {}).forEach(function(k){ if(TOPIC_IDX[k] > far) far = TOPIC_IDX[k]; });
    Object.keys(d.q || {}).forEach(function(k){ var t = d.q[k].t; if(t in TOPIC_IDX && TOPIC_IDX[t] > far) far = TOPIC_IDX[t]; });
    if(far < 0) return null;
    var best = null;
    topicsWithTerms().forEach(function(id){ if(TOPIC_IDX[id] <= far) best = id; });
    return best || topicsWithTerms()[0];
  }
  function topicsWithTerms(){
    var seen = {}; DATA.terms.forEach(function(t){ seen[t.topic] = 1; });
    return Object.keys(seen).sort(function(a, b){ return TOPIC_IDX[a] - TOPIC_IDX[b]; });
  }

  /* ------------------------------------------------------ layout */

  function mount(){
    var prefs = loadPrefs();
    var ts = topicsWithTerms();
    state.mode = ['decode', 'build', 'bank'].indexOf(prefs.mode) > -1 ? prefs.mode : 'decode';
    // A saved choice wins ("everything" is saved as null); otherwise the default.
    if(!('upto' in prefs)) state.upto = defaultUpto();
    else state.upto = prefs.upto && ts.indexOf(prefs.upto) > -1 ? prefs.upto : prefs.upto === null ? null : defaultUpto();
    app.innerHTML =
      '<div class="wr">' +
        '<div class="wr-bar">' +
          '<div class="wr-modes" role="group" aria-label="Mode">' +
            '<button type="button" class="wr-mode" data-mode="decode">Decode</button>' +
            '<button type="button" class="wr-mode" data-mode="build">Build</button>' +
            '<button type="button" class="wr-mode" data-mode="bank">Part bank</button>' +
          '</div>' +
          '<label class="wr-filter"><span>Terms taught up to</span><select id="wr-upto">' +
            ts.map(function(id){ return '<option value="' + esc(id) + '">' + (TOPIC_IDX[id] + 1) + '. ' + esc(topicTitle(id)) + '</option>'; }).join('') +
            '<option value="">Everything so far</option>' +
          '</select></label>' +
        '</div>' +
        '<p class="wr-count" aria-live="polite"></p>' +
        '<section class="wr-card"></section>' +
      '</div>';
    var sel = app.querySelector('#wr-upto');
    sel.value = state.upto || '';
    sel.addEventListener('change', function(){ state.upto = sel.value || null; savePrefs(true); state.cur = null; start(); });
    app.querySelectorAll('.wr-mode').forEach(function(b){
      b.addEventListener('click', function(){ state.mode = b.getAttribute('data-mode'); savePrefs(); state.cur = null; start(); });
    });
    start();
  }

  function start(){
    app.querySelectorAll('.wr-mode').forEach(function(b){ b.setAttribute('aria-pressed', b.getAttribute('data-mode') === state.mode ? 'true' : 'false'); });
    var terms = available();
    app.querySelector('.wr-count').textContent = terms.length + ' terms and ' + availableParts().length + ' word parts from ' +
      (state.upto ? 'topics 1 to ' + (TOPIC_IDX[state.upto] + 1) : 'every topic so far') + '.' +
      (state.session.n ? ' This session: ' + state.session.c + ' of ' + state.session.n + ' right.' : '');
    if(state.mode === 'bank') return renderBank();
    state.cur = nextTerm(); state.done = false; state.placed = [];
    if(!state.cur){ app.querySelector('.wr-card').innerHTML = '<p>No terms yet for this range. Choose a later topic.</p>'; return; }
    if(state.mode === 'decode') renderDecode(); else renderBuild();
  }

  function glossLink(t){
    var g = t.concept && GLOSS[t.concept];
    return g ? '<a class="gl wr-gl" data-c="' + esc(t.concept) + '" href="' + base + 'glossary.html#t-' + esc(t.concept) + '">' + esc(t.term) + '</a>' : '<span class="wr-gl-plain">' + esc(t.term) + '</span>';
  }
  function partLine(p){
    return '<b class="wr-form">' + esc(p.form) + '</b> ' + esc(p.meaning) + ' <span class="wr-origin">' + esc(p.origin) + ': <i>' + esc(p.from) + '</i></span>' + (p.note ? '<span class="wr-pnote">' + esc(p.note) + '</span>' : '');
  }
  function splitHtml(t, marks){
    return '<div class="wr-split" aria-label="' + esc(t.term + ' split into its parts') + '">' + t.segs.map(function(s, i){
      if(!s[1]) return '<span class="wr-seg wr-link" title="linking letters">' + esc(s[0]) + '</span>';
      var p = PARTS[s[1]];
      var m = marks ? marks[i] : '';
      return '<span class="wr-seg wr-' + p.type + (m ? ' ' + m : '') + '"><span class="wr-seg-t">' + esc(s[0]) + '</span><span class="wr-seg-k">' + p.type + '</span></span>';
    }).join('') + '</div>';
  }
  function answerFooter(t, mode, ok){
    return '<div class="wr-answer">' +
      '<p class="wr-term-line">' + glossLink(t) + ' <span class="wr-small">taught in ' + topicHtml(t.topic) + '</span></p>' +
      '<p><b>Literally:</b> ' + esc(t.literal) + '.<br><b>Meaning:</b> ' + esc(t.meaning) + '.</p>' +
      (t.note ? '<p class="wr-note">' + esc(t.note) + '</p>' : '') +
      '<ul class="wr-parts">' + labeled(t).map(function(s){ return '<li>' + partLine(PARTS[s[1]]) + '</li>'; }).join('') + '</ul>' +
      '<div class="wr-after"><button type="button" class="btn-press sm wr-next">Next term</button>' + (window.LevlReport ? window.LevlReport.button('anp', itemId(t, mode)) : '') + '</div>' +
    '</div>';
  }
  function recordResult(t, mode, ok){
    state.session.n++; if(ok) state.session.c++;
    var n = labeled(t).length;
    if(window.AnpCore) window.AnpCore.toolResult(KIND, [{ id: itemId(t, mode), correct: ok, topic: t.topic, core: DATA.core, level: 'apply', diff: n >= 4 ? 3 : n === 3 ? 2 : 1, group: mode }]);
    if(window.LevlSound && window.LevlSound.answer) try{ window.LevlSound.answer(ok); }catch(e){}
    var cnt = app.querySelector('.wr-count');
    cnt.textContent = cnt.textContent.replace(/ This session:.*$/, '') + ' This session: ' + state.session.c + ' of ' + state.session.n + ' right.';
  }
  function wireNext(card){
    var nb = card.querySelector('.wr-next');
    if(nb){ nb.addEventListener('click', function(){ start(); var h = app.querySelector('.wr-card h2'); if(h){ h.setAttribute('tabindex', '-1'); h.focus(); } }); nb.focus(); }
  }

  /* ------------------------------------------------------ decode */

  function meaningOptions(p){
    var pool = availableParts().filter(function(x){ return x.type === p.type && x.meaning !== p.meaning; });
    if(pool.length < 3) pool = DATA.parts.filter(function(x){ return x.type === p.type && x.meaning !== p.meaning; });
    var seen = {}; seen[p.meaning] = 1;
    var out = [p.meaning];
    shuffle(pool).forEach(function(x){ if(out.length < 4 && !seen[x.meaning]){ seen[x.meaning] = 1; out.push(x.meaning); } });
    return shuffle(out);
  }
  function wholeOptions(t){
    var pool = available().filter(function(x){ return x.id !== t.id; });
    var ids = labeled(t).map(function(s){ return s[1]; });
    var near = pool.filter(function(x){ return labeled(x).some(function(s){ return ids.indexOf(s[1]) > -1; }); });
    var picks = shuffle(near).slice(0, 2);
    shuffle(pool).forEach(function(x){ if(picks.length < 2 && picks.indexOf(x) < 0) picks.push(x); });
    return shuffle([t].concat(picks)).map(function(x){ return { id: x.id, text: x.meaning }; });
  }

  function renderDecode(){
    var t = state.cur, card = app.querySelector('.wr-card');
    // Suffix first, then prefix, then roots: the decoding order the course teaches.
    var order = [];
    t.segs.forEach(function(s, i){ if(s[1] && PARTS[s[1]].type === 'suffix') order.push(i); });
    t.segs.forEach(function(s, i){ if(s[1] && PARTS[s[1]].type === 'prefix') order.push(i); });
    t.segs.forEach(function(s, i){ if(s[1] && PARTS[s[1]].type === 'root') order.push(i); });
    var whole = wholeOptions(t);
    card.innerHTML =
      '<p class="wr-eyebrow">Decode</p>' +
      '<h2 class="wr-term">' + esc(t.term) + '</h2>' +
      splitHtml(t) +
      '<ol class="wr-steps">' + order.map(function(i, k){
        var s = t.segs[i], p = PARTS[s[1]];
        return '<li class="wr-step" data-seg="' + i + '"><label for="wr-sel-' + i + '"><span class="wr-step-n">' + (k + 1) + '</span> What does the ' + p.type + ' <b class="wr-mono">' + esc(s[0]) + '</b> mean?</label>' +
          '<select id="wr-sel-' + i + '" data-seg="' + i + '"><option value="">Choose a meaning</option>' + meaningOptions(p).map(function(m){ return '<option>' + esc(m) + '</option>'; }).join('') + '</select>' +
          '<p class="wr-step-fb" aria-live="polite"></p></li>';
      }).join('') +
        '<li class="wr-step wr-whole"><p class="wr-q"><span class="wr-step-n">' + (order.length + 1) + '</span> Put it together. What does <b>' + esc(t.term) + '</b> mean?</p>' +
          '<div class="wr-opts" role="group" aria-label="Meaning of the whole term">' + whole.map(function(o){ return '<button type="button" class="wr-opt" aria-pressed="false" data-id="' + esc(o.id) + '">' + esc(o.text) + '</button>'; }).join('') + '</div>' +
        '</li>' +
      '</ol>' +
      '<div class="wr-actions"><button type="button" class="btn-press sm wr-check">Check</button><button type="button" class="btn-outline wr-skip">Skip</button><p class="wr-msg" role="status"></p></div>' +
      '<div class="wr-fb" aria-live="polite"></div>';
    card.querySelectorAll('.wr-opt').forEach(function(b){
      b.addEventListener('click', function(){
        if(state.done) return;
        card.querySelectorAll('.wr-opt').forEach(function(x){ x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
      });
    });
    card.querySelector('.wr-skip').addEventListener('click', function(){ start(); });
    card.querySelector('.wr-check').addEventListener('click', function(){
      if(state.done) return;
      var sels = card.querySelectorAll('select'), chosen = card.querySelector('.wr-opt[aria-pressed="true"]');
      var missing = [].some.call(sels, function(s){ return !s.value; }) || !chosen;
      if(missing){ card.querySelector('.wr-msg').textContent = 'Answer every step first.'; return; }
      card.querySelector('.wr-msg').textContent = '';
      state.done = true;
      var allRight = true, marks = {};
      sels.forEach(function(s){
        var i = +s.getAttribute('data-seg'), p = PARTS[t.segs[i][1]];
        var ok = s.value === p.meaning;
        if(!ok) allRight = false;
        marks[i] = ok ? 'is-right' : 'is-wrong';
        s.disabled = true;
        var li = s.closest('.wr-step');
        li.classList.add(ok ? 'is-right' : 'is-wrong');
        li.querySelector('.wr-step-fb').innerHTML = (ok ? '<span class="wr-ok">Right.</span> ' : '<span class="wr-no">Not quite.</span> ') + partLine(p);
      });
      var wholeOk = chosen.getAttribute('data-id') === t.id;
      if(!wholeOk) allRight = false;
      card.querySelectorAll('.wr-opt').forEach(function(x){
        x.disabled = true;
        if(x.getAttribute('data-id') === t.id) x.classList.add('is-right');
        else if(x === chosen) x.classList.add('is-wrong');
      });
      card.querySelector('.wr-split').outerHTML = splitHtml(t, marks);
      card.querySelector('.wr-actions').hidden = true;
      recordResult(t, 'decode', allRight);
      card.querySelector('.wr-fb').innerHTML = '<p class="wr-verdict ' + (allRight ? 'ok' : 'no') + '">' + (allRight ? 'Correct: every part and the whole term.' : 'Not all right yet. This term is in your review queue.') + '</p>' + answerFooter(t, 'decode', allRight);
      wireNext(card);
    });
  }

  /* ------------------------------------------------------ build */

  function buildCards(t){
    var ids = labeled(t).map(function(s){ return s[1]; });
    var mine = ids.map(function(id){ return PARTS[id]; });
    var meanings = {}; mine.forEach(function(p){ meanings[p.meaning] = 1; });
    // Distractors never share a meaning with a correct part, so a meaning
    // always points to one card (renal and nephric cannot both be right).
    var pool = availableParts().filter(function(p){ return ids.indexOf(p.id) < 0 && !meanings[p.meaning]; });
    var out = [], used = {};
    function add(p){ if(p && !used[p.id]){ used[p.id] = 1; out.push(p); meanings[p.meaning] = 1; } }
    mine.forEach(add);
    mine.forEach(function(p){ add(pick(pool.filter(function(x){ return x.type === p.type && !used[x.id] && !meanings[x.meaning]; })) || null); });
    var target = Math.max(6, out.length + 2);
    shuffle(pool).forEach(function(p){ if(out.length < target && !used[p.id] && !meanings[p.meaning]) add(p); });
    return shuffle(out);
  }

  function renderBuild(){
    var t = state.cur, card = app.querySelector('.wr-card');
    var need = labeled(t).length;
    var cards = buildCards(t);
    card.innerHTML =
      '<p class="wr-eyebrow">Build</p>' +
      '<h2 class="wr-prompt">Build the term that means: <span>' + esc(t.meaning) + '</span></h2>' +
      '<p class="wr-small">It has ' + need + ' parts. Place them in order, first to last; linking vowels are added for you.</p>' +
      '<div class="wr-slots" aria-label="Your term, in order" aria-live="polite"></div>' +
      '<p class="wr-small wr-bank-h">Word parts</p>' +
      '<div class="wr-bankcards" role="group" aria-label="Word parts to place">' + cards.map(function(p){
        return '<button type="button" class="wr-cardbtn wr-' + p.type + '" data-id="' + esc(p.id) + '"><b>' + esc(p.form) + '</b><span>' + esc(p.meaning) + '</span></button>';
      }).join('') + '</div>' +
      '<div class="wr-actions"><button type="button" class="btn-press sm wr-check">Check</button><button type="button" class="btn-outline wr-clear">Clear</button><button type="button" class="btn-outline wr-skip">Skip</button><p class="wr-msg" role="status"></p></div>' +
      '<div class="wr-fb" aria-live="polite"></div>';
    function paint(){
      var slots = card.querySelector('.wr-slots');
      slots.innerHTML = state.placed.length ? state.placed.map(function(id, k){
        var p = PARTS[id];
        return '<button type="button" class="wr-slot wr-' + p.type + '" data-k="' + k + '" aria-label="' + esc(p.form + ', ' + p.meaning + '. Remove') + '"' + (state.done ? ' disabled' : '') + '>' + esc(p.form) + '</button>';
      }).join('<span class="wr-plus" aria-hidden="true">+</span>') : '<span class="wr-empty">Tap a word part to place it here.</span>';
      card.querySelectorAll('.wr-cardbtn').forEach(function(b){ b.disabled = state.done || state.placed.indexOf(b.getAttribute('data-id')) > -1; });
      slots.querySelectorAll('.wr-slot').forEach(function(b){
        b.addEventListener('click', function(){
          if(state.done) return;
          state.placed.splice(+b.getAttribute('data-k'), 1); paint();
          var next = card.querySelector('.wr-slot') || card.querySelector('.wr-cardbtn:not(:disabled)'); if(next) next.focus();
        });
      });
    }
    card.querySelectorAll('.wr-cardbtn').forEach(function(b){
      b.addEventListener('click', function(){
        if(state.done) return;
        state.placed.push(b.getAttribute('data-id')); paint();
        var next = card.querySelector('.wr-cardbtn:not(:disabled)') || card.querySelector('.wr-check'); if(next) next.focus();
      });
    });
    card.querySelector('.wr-clear').addEventListener('click', function(){ if(!state.done){ state.placed = []; paint(); } });
    card.querySelector('.wr-skip').addEventListener('click', function(){ start(); });
    card.querySelector('.wr-check').addEventListener('click', function(){
      if(state.done) return;
      if(!state.placed.length){ card.querySelector('.wr-msg').textContent = 'Place at least one word part first.'; return; }
      card.querySelector('.wr-msg').textContent = '';
      var want = labeled(t).map(function(s){ return s[1]; });
      var ok = state.placed.join('+') === want.join('+');
      state.done = true;
      paint();
      card.querySelectorAll('.wr-slot').forEach(function(b, k){ b.classList.add(state.placed[k] === want[k] ? 'is-right' : 'is-wrong'); });
      card.querySelector('.wr-actions').hidden = true;
      recordResult(t, 'build', ok);
      var why = ok ? '' : buildHint(state.placed, want);
      card.querySelector('.wr-fb').innerHTML = '<p class="wr-verdict ' + (ok ? 'ok' : 'no') + '">' + (ok ? 'Correct.' : 'Not quite. This term is in your review queue.') + (why ? ' ' + why : '') + '</p>' +
        '<p class="wr-small">The term:</p>' + splitHtml(t) + answerFooter(t, 'build', ok);
      wireNext(card);
    });
    paint();
  }
  function buildHint(placed, want){
    var sameSet = placed.length === want.length && placed.slice().sort().join() === want.slice().sort().join();
    if(sameSet) return 'You chose the right parts in the wrong order. Prefixes come first, then roots, and the suffix comes last: ' + want.map(function(id){ return '<b>' + esc(PARTS[id].form) + '</b>'; }).join(' + ') + '.';
    var missing = want.filter(function(id){ return placed.indexOf(id) < 0; }).map(function(id){ return '<b>' + esc(PARTS[id].form) + '</b> (' + esc(PARTS[id].meaning) + ')'; });
    return missing.length ? 'It needs ' + missing.join(' and ') + '.' : '';
  }

  /* ------------------------------------------------------ part bank */

  function renderBank(){
    var card = app.querySelector('.wr-card');
    var parts = availableParts();
    var terms = available();
    var groups = [['prefix', 'Prefixes'], ['root', 'Roots'], ['suffix', 'Suffixes']];
    card.innerHTML = '<p class="wr-eyebrow">Part bank</p><h2>Every word part so far</h2>' +
      '<label class="wr-find"><span>Find a part or meaning</span><input type="search" id="wr-find" autocomplete="off"></label>' +
      groups.map(function(g){
        var ps = parts.filter(function(p){ return p.type === g[0]; }).sort(function(a, b){ return a.form.localeCompare(b.form); });
        if(!ps.length) return '';
        return '<section class="wr-bank-sec"><h3>' + g[1] + ' <span class="wr-small">(' + ps.length + ')</span></h3><ul class="wr-banklist">' + ps.map(function(p){
          var ex = terms.filter(function(t){ return t.segs.some(function(s){ return s[1] === p.id; }); }).slice(0, 4).map(function(t){ return glossLink(t); });
          return '<li class="wr-' + p.type + '" data-find="' + esc((p.form + ' ' + p.meaning).toLowerCase()) + '">' + partLine(p) + '<span class="wr-ex">e.g. ' + ex.join(', ') + '</span></li>';
        }).join('') + '</ul></section>';
      }).join('');
    var f = card.querySelector('#wr-find');
    f.addEventListener('input', function(){
      var q = f.value.trim().toLowerCase();
      card.querySelectorAll('.wr-banklist li').forEach(function(li){ li.hidden = !!q && li.getAttribute('data-find').indexOf(q) < 0; });
    });
  }

  /* ------------------------------------------------------ load */

  var cur = window.AnpCurriculum || { topics: [] };
  TOPICS = cur.topics || [];
  TOPICS.forEach(function(t, i){ TOPIC_IDX[t.id] = i; });
  Promise.all([
    fetch(src).then(function(r){ if(!r.ok) throw new Error(r.status); return r.json(); }),
    fetch(base + 'assets/glossary.json').then(function(r){ return r.ok ? r.json() : {}; }).catch(function(){ return {}; })
  ]).then(function(res){
    DATA = res[0]; GLOSS = res[1] || {};
    DATA.parts.forEach(function(p){ PARTS[p.id] = p; });
    // A term whose topic is not in this curriculum build is left out, never shown out of order.
    DATA.terms = DATA.terms.filter(function(t){ return t.topic in TOPIC_IDX; });
    mount();
  }).catch(function(){
    app.innerHTML = '<p class="wr-msg">The word root builder could not load. Check your connection and reload the page.</p>';
  });
})();
