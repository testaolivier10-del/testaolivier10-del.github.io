/* AP® Biology flashcards (forked from anatomy-physiology/assets/apps/
   flashcards.js): spaced repetition over
     - the glossary (assets/glossary.json): every defined term of a published
       topic, both ways, term -> definition and definition -> term;
     - the lesson summaries (assets/summaries.json): "sum up this topic",
       one card per published topic.
   Decks: everything, a unit, a topic, or "terms from questions I missed".
   Deep links: ?unit=<id>, ?topic=<id>, ?deck=missed.

   SCHEDULING: the same SM-2 variant as ochem's and A&P's (Again / Hard /
   Good / Easy, 20 new cards a day, studying ahead never lengthens an
   interval).

   STORAGE  localStorage['apbio_flashcards_v1'] (in the apbio sync namespace,
   bio-core.js; merged card by card with the site's mergeCardSchedules):
     { v: 1, cards: { <cardId>: { i, e, d, r, l, t } }, fresh: { day, n }, paid: { day, xp } }
   Card ids are permanent: gl:<concept>:t, gl:<concept>:d, sm:<topic>.

   Self-grading moves no mastery number (cards never touch
   apbio_progress_v1); cards pay XP (2 each, 60 a day at most). */
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
  var KEY = 'apbio_flashcards_v1', PREFS = 'apbio_prefs_v1';
  var MIN = 60000, AGAIN = 1, HARD = 2, GOOD = 3, EASY = 4;
  var GRADES = [null, { label: 'Again' }, { label: 'Hard' }, { label: 'Good' }, { label: 'Easy' }];
  var EASE_START = 2.5, EASE_MIN = 1.3, EASE_MAX = 2.8, MAX_IVL = 365, RELEARN = 10 * MIN, NEW_PER_DAY = 20;
  var AHEAD_SIZE = 20, AGAIN_GAP = 3, CARD_XP = 2, CARD_XP_CAP = 60;

  function esc(s){ return String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
  function plural(n, w, ws){ return n + ' ' + (n === 1 ? w : (ws || w + 's')); }
  function reducedMotion(){ try{ return window.matchMedia('(prefers-reduced-motion: reduce)').matches; }catch(e){ return false; } }

  /* ---- the scheduler ---- */
  function clamp(x, lo, hi){ return x < lo ? lo : x > hi ? hi : x; }
  function dayKey(ms){ var d = new Date(ms); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function midnightPlus(ms, days){ var d = new Date(ms); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() + days); return d.getTime(); }
  function isNew(s){ return !s || !s.t; }
  function isLearning(s){ return !isNew(s) && s.i === 0; }
  function isEarly(s, now){ return !isNew(s) && !isLearning(s) && s.d > now; }
  function next(state, g, now, early){
    var s = state ? { i: state.i || 0, e: state.e || EASE_START, d: state.d || 0, r: state.r || 0, l: state.l || 0, t: state.t || 0 } : { i: 0, e: EASE_START, d: 0, r: 0, l: 0, t: 0 };
    if(early && !isNew(state) && g !== AGAIN) return s;
    var learning = s.i < 1;
    if(g === AGAIN){ if(!learning){ s.l++; s.e -= 0.2; } s.i = 0; s.r = 0; s.d = now + RELEARN; }
    else {
      var ivl;
      if(learning){ ivl = g === EASY ? 4 : 1; if(g === HARD) s.e -= 0.15; if(g === EASY) s.e += 0.15; }
      else if(g === HARD){ ivl = Math.max(s.i + 1, Math.round(s.i * 1.2)); s.e -= 0.15; }
      else if(g === GOOD){ ivl = s.i === 1 ? 3 : Math.max(s.i + 1, Math.round(s.i * s.e)); }
      else { ivl = Math.max(s.i + 2, Math.round(s.i * s.e * 1.3)); s.e += 0.15; }
      s.i = Math.min(MAX_IVL, ivl); s.r++; s.d = midnightPlus(now, s.i);
    }
    s.e = Math.round(clamp(s.e, EASE_MIN, EASE_MAX) * 100) / 100;
    s.t = now;
    return s;
  }
  function ivlLabel(s, now){
    if(s.i === 0) return Math.max(1, Math.round((s.d - now) / MIN)) + 'm';
    var d = s.i;
    return d < 14 ? d + 'd' : d < 60 ? Math.round(d / 7) + 'w' : d < 365 ? Math.round(d / 30) + 'mo' : Math.round(d / 36.5) / 10 + 'y';
  }
  function blank(){ return { v: 1, cards: {}, fresh: { day: '', n: 0 }, paid: { day: '', xp: 0 } }; }
  function load(){
    try{
      var d = JSON.parse(localStorage.getItem(KEY) || 'null');
      if(!d || d.v !== 1 || !d.cards || typeof d.cards !== 'object') return blank();
      if(!d.fresh) d.fresh = { day: '', n: 0 };
      if(!d.paid) d.paid = { day: '', xp: 0 };
      return d;
    }catch(e){ return blank(); }
  }
  function save(d){ try{ localStorage.setItem(KEY, JSON.stringify(d)); }catch(e){} }
  function introducedToday(d, now){ return d.fresh.day === dayKey(now) ? (d.fresh.n || 0) : 0; }
  try{
    var SA = window.StudyHubAccount;
    if(SA && SA.registerNamespace && SA.mergeCardSchedules){ var mm = {}; mm[KEY] = SA.mergeCardSchedules; SA.registerNamespace('apbio', [KEY], mm); }
  }catch(e){}

  /* ---- preferences (apbio_prefs_v1.flashcards) ---- */
  var prefs = { deck: 'all', kinds: { t: true, d: true, s: true } };
  function readPrefs(){ try{ return JSON.parse(localStorage.getItem(PREFS) || '{}') || {}; }catch(e){ return {}; } }
  (function(){
    var p = readPrefs().flashcards;
    if(p && typeof p === 'object'){
      if(typeof p.deck === 'string') prefs.deck = p.deck;
      if(p.kinds && typeof p.kinds === 'object') ['t', 'd', 's'].forEach(function(k){ if(typeof p.kinds[k] === 'boolean') prefs.kinds[k] = p.kinds[k]; });
    }
    var q = new URLSearchParams(location.search);
    ['topic', 'unit'].forEach(function(k){ if(q.get(k)) prefs.deck = k + ':' + q.get(k); });
    if(q.get('deck') === 'missed') prefs.deck = 'missed';
  })();
  function savePrefs(){ try{ var all = readPrefs(); all.flashcards = prefs; localStorage.setItem(PREFS, JSON.stringify(all)); }catch(e){} }

  /* ---- the cards ---- */
  var TOPIC = {}, UNIT = {};
  CU.topics.forEach(function(t){ TOPIC[t.id] = t; });
  CU.units.forEach(function(u){ UNIT[u.id] = u; });
  function built(id){ return !!(TOPIC[id] && TOPIC[id].built); }
  function unitName(u){ var c = UNIT[u]; return c ? (c.part === 'course' ? 'Unit ' + c.n + ': ' : '') + c.title : u; }
  var CARDS = [], BY_ID = {}, GLOSS = {}, missedConcepts = null;
  function escRe(s){ return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
  function maskTerm(def, term){
    var names = [term.replace(/^the\s+/i, '')], paren = term.match(/^(.*?)\s*\(([^)]+)\)\s*$/);
    if(paren) names = [paren[1], paren[2]];
    names.forEach(function(n){
      n = n.trim();
      var sym = /[A-Z]/.test(n.slice(1)) || /^[A-Z]{2,}/.test(n);
      if(n.length < (sym ? 2 : 3)) return;
      def = def.replace(new RegExp('(^|[^\\w-])' + escRe(n) + '(s|es)?(?![\\w-])', sym ? 'g' : 'gi'), '$1_____');
    });
    return def;
  }
  function buildCards(gloss, sums){
    Object.keys(gloss || {}).forEach(function(cid){
      var g = gloss[cid];
      if(!g || !g.d || !built(g.p)) return;
      GLOSS[cid] = g;
      var b = { topic: g.p, concept: cid, term: g.t, def: g.d, order: TOPIC[g.p].n };
      CARDS.push(Object.assign({ id: 'gl:' + cid + ':t', kind: 't' }, b));
      CARDS.push(Object.assign({ id: 'gl:' + cid + ':d', kind: 'd', masked: maskTerm(g.d, g.t) }, b));
    });
    Object.keys(sums || {}).forEach(function(t){
      if(built(t) && sums[t]) CARDS.push({ id: 'sm:' + t, kind: 's', topic: t, back: sums[t], order: TOPIC[t].n + 0.5 });
    });
    CARDS.sort(function(a, b){ return a.order - b.order; });
    CARDS.forEach(function(c){ BY_ID[c.id] = c; });
  }
  function inDeck(c, deck){
    if(!prefs.kinds[c.kind]) return false;
    if(deck === 'all') return true;
    if(deck === 'missed') return !!(missedConcepts && c.concept && missedConcepts[c.concept]);
    var p = deck.split(':');
    if(p[0] === 'topic') return c.topic === p[1];
    if(p[0] === 'unit') return TOPIC[c.topic] && TOPIC[c.topic].unit === p[1];
    return true;
  }
  function deckCards(deck){ return CARDS.filter(function(c){ return inDeck(c, deck); }); }
  function deckName(deck){
    if(deck === 'missed') return 'Terms from questions I missed';
    var p = deck.split(':');
    if(p[0] === 'topic' && TOPIC[p[1]]) return TOPIC[p[1]].title;
    if(p[0] === 'unit' && UNIT[p[1]]) return unitName(p[1]);
    return 'Every published topic';
  }
  function queueFor(cards, now){
    var d = load(), due = [], fresh = [], learned = 0, soon = 0, week = midnightPlus(now, 7);
    cards.forEach(function(c){ var s = d.cards[c.id]; if(isNew(s)) fresh.push(c.id); else { learned++; if(s.d <= now) due.push(c.id); else if(s.d < week) soon++; } });
    due.sort(function(a, b){ return d.cards[a].d - d.cards[b].d; });
    var allowance = Math.max(0, NEW_PER_DAY - introducedToday(d, now));
    return { due: due, fresh: fresh.slice(0, allowance), newTotal: fresh.length, learned: learned, total: cards.length, soon: soon };
  }
  function loadMissed(){
    var ids = window.ApBioCore ? window.ApBioCore.missed().filter(function(id){ return /^bio-/.test(id); }) : [];
    if(!ids.length){ missedConcepts = {}; return Promise.resolve(); }
    return window.ApBioCore.loadQuestions(BASE, ids).then(function(qs){
      var text = qs.map(function(q){ return [q.q].concat(q.options || []).concat((q.variables || []).map(function(v){ return v.name; })).join(' '); }).join(' \n ').replace(/<[^>]+>/g, ' ');
      var found = {};
      Object.keys(GLOSS).forEach(function(cid){
        var t = GLOSS[cid].t.replace(/^the\s+/i, '').replace(/\s*\([^)]*\)\s*$/, '');
        if(t.length >= 3 && new RegExp('(^|[^\\w-])' + escRe(t) + '(s|es)?(?![\\w-])', 'i').test(text)) found[cid] = 1;
      });
      missedConcepts = found;
    }).catch(function(){ missedConcepts = {}; });
  }

  /* ---- the deck view ---- */
  var run = null;
  function kindCount(k){ return CARDS.filter(function(c){ return c.kind === k; }).length; }
  function renderHome(){
    run = null;
    var now = Date.now();
    if(!CARDS.length){
      app.innerHTML = '<div class="bio-fc-empty panel"><h2>No cards yet</h2><p>Cards come from the glossary and lesson summaries of published topics. If you are offline, open this page once while online and it will work offline after that.</p></div>';
      return;
    }
    var cards = deckCards(prefs.deck), q = queueFor(cards, now), todo = q.due.length + q.fresh.length;
    var units = CU.units.filter(function(u){ return CARDS.some(function(c){ return TOPIC[c.topic].unit === u.id; }); });
    var opt = function(v, label){ return '<option value="' + esc(v) + '"' + (v === prefs.deck ? ' selected' : '') + '>' + esc(label) + '</option>'; };
    var count = function(pred){ return CARDS.filter(function(c){ return prefs.kinds[c.kind] && pred(c); }).length; };
    var sel = opt('all', 'Every published topic (' + count(function(){ return true; }) + ')') + opt('missed', 'Terms from questions I missed') +
      '<optgroup label="Units">' + units.map(function(u){ return opt('unit:' + u.id, unitName(u.id) + ' (' + count(function(c){ return TOPIC[c.topic].unit === u.id; }) + ')'); }).join('') + '</optgroup>' +
      units.map(function(u){
        var ts = CU.topics.filter(function(t){ return t.unit === u.id && CARDS.some(function(c){ return c.topic === t.id; }); });
        return '<optgroup label="Topics: ' + esc(unitName(u.id)) + '">' + ts.map(function(t){ return opt('topic:' + t.id, (t.ced ? t.ced + ' ' : '') + t.title + ' (' + count(function(c){ return c.topic === t.id; }) + ')'); }).join('') + '</optgroup>';
      }).join('');
    var kinds = [['t', 'Term → definition', kindCount('t')], ['d', 'Definition → term', kindCount('d')], ['s', 'Topic summaries', kindCount('s')]];
    var missedNote = prefs.deck === 'missed' ? (missedConcepts === null ? '<p class="cx-small">Finding the terms in your missed questions…</p>' : !cards.length ? '<p class="cx-small">No missed terms right now. When you get a question wrong, the glossary terms it uses land in this deck.</p>' : '') : '';
    var stat = function(v, l, cls){ return LevlStudy.stat(l, v, '', cls); };
    // By unit: progress across every card in each unit (the list NREMT and
    // Ochem show by topic area and chapter). A row opens that deck.
    var dd = load();
    var byUnit = units.map(function(u, i){
      var cs = CARDS.filter(function(c){ return prefs.kinds[c.kind] && TOPIC[c.topic].unit === u.id; });
      var learned = 0, due = 0;
      cs.forEach(function(c){ var st = dd.cards[c.id]; if(!isNew(st)){ learned++; if(st.d <= now) due++; } });
      var deck = 'unit:' + u.id;
      return '<button type="button" class="cx-prow" data-deck="' + esc(deck) + '" aria-pressed="' + (prefs.deck === deck) + '">' +
        '<span class="n">' + esc(unitName(u.id)) + '</span>' +
        '<span class="c">' + (due ? '<span class="due">' + due + ' due</span> &middot; ' : '') + learned + '/' + cs.length + '</span>' +
        '<span class="bar" aria-hidden="true"><span style="width:' + (cs.length ? Math.round(learned / cs.length * 100) : 0) + '%"></span></span></button>';
    }).join('');
    app.innerHTML = '<div class="cx-main">' +
      '<section class="cx-card cx-deck" aria-labelledby="bio-fc-deck-h"><h2 id="bio-fc-deck-h">Choose a deck</h2>' +
        '<label class="cx-field" for="bio-fc-deck"><span>Deck</span><select id="bio-fc-deck">' + sel + '</select></label>' +
        '<fieldset class="cx-group bio-fc-kinds"><legend>Card types</legend><div class="cx-pills">' + kinds.map(function(k){
          return '<label class="cx-pill"><input type="checkbox" value="' + k[0] + '"' + (prefs.kinds[k[0]] ? ' checked' : '') + '><span>' + esc(k[1]) + ' <small>' + k[2] + '</small></span></label>';
        }).join('') + '</div></fieldset>' + missedNote + '</section>' +
      '<section class="cx-card cx-deckcard" aria-labelledby="bio-fc-today-h"><h2 id="bio-fc-today-h">' + esc(deckName(prefs.deck)) + '</h2>' +
        '<div class="cx-stats">' + stat(q.due.length, 'Due now', q.due.length ? 'is-due' : '') + stat(q.fresh.length, 'New today') + stat(q.learned, 'Learned') + stat(q.total, 'In this deck') + '</div>' +
        '<p class="cx-small">' + (q.soon ? plural(q.soon, 'card') + ' coming due in the next 7 days. ' : '') + (q.newTotal > q.fresh.length ? plural(q.newTotal - q.fresh.length, 'more new card') + ' will be introduced on later days (' + NEW_PER_DAY + ' a day keeps reviews manageable).' : '') + '</p>' +
        '<div class="cx-actions">' + (todo ? '<button type="button" class="btn-press" data-act="study">Study ' + plural(todo, 'card') + '</button>' : '<p class="cx-caught">' + (q.total ? 'You are caught up on this deck.' : 'This deck has no cards with the card types chosen.') + '</p>') +
          (q.learned && !q.due.length ? '<button type="button" class="btn-outline" data-act="ahead">Study ahead</button>' : '') + '</div>' +
        '<p class="cx-how">Grade yourself honestly: <b>Again</b> if you did not know it, <b>Hard</b> if it took effort, <b>Good</b> if you knew it, <b>Easy</b> if it was instant. Cards do not change your mastery scores; questions do.</p></section>' +
      (byUnit ? '<section aria-labelledby="bio-fc-u-h"><h2 class="cx-h2" id="bio-fc-u-h">By unit</h2><div class="cx-card cx-plist">' + byUnit + '</div></section>' : '') +
    '</div>';
    app.querySelectorAll('[data-deck]').forEach(function(b){
      b.addEventListener('click', function(){
        prefs.deck = b.getAttribute('data-deck'); savePrefs(); renderHome();
        var h = document.getElementById('bio-fc-today-h'); if(h){ h.setAttribute('tabindex', '-1'); h.focus(); }
      });
    });
    var s = document.getElementById('bio-fc-deck');
    s.addEventListener('change', function(){
      prefs.deck = s.value; savePrefs();
      if(prefs.deck === 'missed' && missedConcepts === null){ renderHome(); loadMissed().then(function(){ renderHome(); var x = document.getElementById('bio-fc-deck'); if(x) x.focus(); }); return; }
      renderHome(); document.getElementById('bio-fc-deck').focus();
    });
    app.querySelectorAll('.bio-fc-kinds input').forEach(function(cb){
      cb.addEventListener('change', function(){
        prefs.kinds[cb.value] = cb.checked;
        if(!prefs.kinds.t && !prefs.kinds.d && !prefs.kinds.s) prefs.kinds[cb.value] = true;
        savePrefs(); renderHome();
        var again = app.querySelector('.bio-fc-kinds input[value="' + cb.value + '"]'); if(again) again.focus();
      });
    });
    var study = app.querySelector('[data-act="study"]');
    if(study) study.addEventListener('click', function(){ start(q.due.concat(q.fresh), 'scheduled'); });
    var ahead = app.querySelector('[data-act="ahead"]');
    if(ahead) ahead.addEventListener('click', function(){
      var d = load();
      start(cards.filter(function(c){ return !isNew(d.cards[c.id]); }).sort(function(a, b){ return d.cards[a.id].d - d.cards[b.id].d; }).slice(0, AHEAD_SIZE).map(function(c){ return c.id; }), 'ahead');
    });
  }

  /* ---- a session ---- */
  function start(ids, mode){
    if(!ids.length) return;
    run = { queue: ids.slice(), mode: mode, total: ids.length, done: 0, flipped: false, counts: [0, 0, 0, 0, 0], paidIds: {}, paid: 0, seen: {}, deck: prefs.deck };
    showCard();
  }
  function frontHtml(c){
    if(c.kind === 't') return '<p class="bio-fc-ask">What does this term mean?</p><p class="bio-fc-q">' + esc(c.term) + '</p>';
    if(c.kind === 'd') return '<p class="bio-fc-ask">Which term is this?</p><p class="bio-fc-q bio-fc-q-def">' + esc(c.masked) + '</p>';
    return '<p class="bio-fc-ask">Sum up this topic in two or three sentences, then check.</p><p class="bio-fc-q bio-fc-q-def">' + esc(TOPIC[c.topic].title) + '</p>';
  }
  function backHtml(c){
    var t = TOPIC[c.topic];
    var body = c.kind === 't' ? '<p class="bio-fc-a">' + esc(c.def) + '</p>' : c.kind === 'd' ? '<p class="bio-fc-a bio-fc-a-term">' + esc(c.term) + '</p><p class="bio-fc-a-sub">' + esc(c.def) + '</p>' : '<p class="bio-fc-a">' + esc(c.back) + '</p>';
    return body + '<p class="bio-fc-from">Taught in <a href="' + esc(BASE + 'lessons/' + c.topic + '.html') + '">' + esc(t.title) + '</a> &middot; <a href="' + esc(BASE + 'notes/' + c.topic + '.html') + '">notes</a>' +
      (window.LevlReport ? ' <span class="bio-fc-report">' + window.LevlReport.button('apbio', c.id) + '</span>' : '') + '</p>';
  }
  function showCard(){
    if(!run.queue.length){ finish(); return; }
    var c = BY_ID[run.queue[0]];
    if(!c){ run.queue.shift(); showCard(); return; }
    run.flipped = false;
    var s = load().cards[c.id];
    var st = isNew(s) ? '<span class="bio-fc-tag new">New</span>' : isLearning(s) ? '<span class="bio-fc-tag learn">Learning</span>' : '<span class="bio-fc-tag">Review</span>';
    var p = Math.round(run.done / Math.max(1, run.done + run.queue.length) * 100);
    app.innerHTML = '<div class="cx-session bio-fc-session"><div class="cx-sbar"><span class="cx-sbar-t">' + esc(deckName(run.deck)) + (run.mode === 'ahead' ? ' &middot; studying ahead' : '') + '</span><span class="cx-sbar-n">' + run.done + ' done &middot; ' + run.queue.length + ' to go</span><button type="button" class="cx-end" data-act="quit">End session</button></div>' +
      '<div class="cx-progress" role="progressbar" aria-label="Session progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + p + '"><i style="width:' + p + '%"></i></div>' +
      '<div class="bio-fc-card" id="bio-fc-card"><button type="button" class="bio-fc-face bio-fc-front" data-act="flip" aria-describedby="bio-fc-hint"><span class="bio-fc-meta">' + st + '<span class="bio-fc-tag">' + (c.kind === 's' ? 'Summary' : 'Glossary') + '</span><span>' + esc(TOPIC[c.topic].title) + '</span></span>' +
        frontHtml(c) + '<span class="bio-fc-tap" id="bio-fc-hint">Tap or press Space to show the answer</span></button></div>' +
      '<p class="bio-fc-keys" aria-hidden="true"><kbd>Space</kbd> flip &middot; <kbd>1</kbd> Again &middot; <kbd>2</kbd> Hard &middot; <kbd>3</kbd> Good &middot; <kbd>4</kbd> Easy</p><p class="sr-only" aria-live="polite" id="bio-fc-live"></p></div>';
    app.querySelector('[data-act="quit"]').addEventListener('click', function(){ finish(true); });
    var front = app.querySelector('[data-act="flip"]');
    front.addEventListener('click', flip);
    front.focus({ preventScroll: true });
  }
  function flip(){
    if(!run || run.flipped) return;
    run.flipped = true;
    var c = BY_ID[run.queue[0]], now = Date.now(), s = load().cards[c.id] || null, early = isEarly(s, now);
    var card = document.getElementById('bio-fc-card'), front = card.querySelector('.bio-fc-front');
    var frontInner = front.innerHTML.replace(/<span class="bio-fc-tap"[\s\S]*?<\/span>/, '');
    var grades = [1, 2, 3, 4].map(function(g){
      var stt = next(s, g, now, early), when = early && g !== AGAIN && !isNew(s) ? 'no change' : ivlLabel(stt, now);
      return '<button type="button" class="bio-fc-g g' + g + '" data-g="' + g + '"><span>' + GRADES[g].label + '</span><small>' + when + '</small></button>';
    }).join('');
    card.innerHTML = '<div class="bio-fc-face bio-fc-back" tabindex="-1" aria-labelledby="bio-fc-ans-h"><div class="bio-fc-prompt">' + frontInner + '</div><h3 class="sr-only" id="bio-fc-ans-h">Answer</h3><div class="bio-fc-answer">' + backHtml(c) + '</div></div>' +
      '<div class="bio-fc-grades" role="group" aria-label="How well did you know it?">' + grades + '</div>';
    if(!reducedMotion()){ card.classList.remove('is-turning'); void card.offsetWidth; card.classList.add('is-turning'); }
    card.querySelectorAll('.bio-fc-g').forEach(function(b){ b.addEventListener('click', function(){ grade(+b.getAttribute('data-g')); }); });
    var live = document.getElementById('bio-fc-live'); if(live) live.textContent = 'Answer shown. Grade it: 1 Again, 2 Hard, 3 Good, 4 Easy.';
    card.querySelector('.bio-fc-back').focus({ preventScroll: true });
  }
  function grade(g){
    if(!run || !run.flipped) return;
    var id = run.queue.shift(), now = Date.now(), d = load(), prev = d.cards[id] || null, wasNew = isNew(prev), early = isEarly(prev, now);
    d.cards[id] = next(prev, g, now, early);
    if(wasNew){ var today = dayKey(now); if(d.fresh.day !== today) d.fresh = { day: today, n: 0 }; d.fresh.n++; }
    save(d);
    run.counts[g]++;
    if(!early && run.mode !== 'ahead' && !run.paidIds[id]){ run.paidIds[id] = 1; run.paid++; }
    if(!run.seen[id]){ run.seen[id] = 1; run.done++; }
    if(g === AGAIN) run.queue.splice(Math.min(AGAIN_GAP, run.queue.length), 0, id);
    showCard();
  }
  function settle(){
    if(!run || !run.paid) return 0;
    var n = run.paid; run.paid = 0;
    var d = load(), today = dayKey(Date.now());
    if(d.paid.day !== today) d.paid = { day: today, xp: 0 };
    var xp = Math.min(n * CARD_XP, Math.max(0, CARD_XP_CAP - d.paid.xp));
    d.paid.xp += xp; save(d);
    try{ if(window.HubProgress){ if(xp) window.HubProgress.award('apbio', xp); window.HubProgress.recordActivity('apbio', n); } }catch(e){}
    return xp;
  }
  window.addEventListener('pagehide', function(){ if(run) settle(); });
  function finish(quit){
    if(!run) return;
    var r = run, xp = settle(), graded = r.counts[1] + r.counts[2] + r.counts[3] + r.counts[4];
    if(graded && window.ApBioCore) window.ApBioCore.event('apbio-session-finish', { mode: 'flashcards', answered: graded, correct: graded - r.counts[1] });
    run = null;
    var q = queueFor(deckCards(r.deck), Date.now());
    app.innerHTML = '<section class="bio-fc-done panel" aria-labelledby="bio-fc-done-h" tabindex="-1"><h2 id="bio-fc-done-h">' + (quit && r.done < r.total ? 'Session ended' : 'Session complete') + '</h2>' +
      (graded ? '<p>You worked through ' + plural(r.done, 'card') + ' (' + plural(graded, 'grade') + ').</p><ul class="bio-fc-tally">' + [1, 2, 3, 4].map(function(g){ return '<li class="g' + g + '"><b>' + r.counts[g] + '</b><span>' + GRADES[g].label + '</span></li>'; }).join('') + '</ul>' : '<p>No cards graded this time.</p>') +
      (xp ? '<p class="bio-fc-xp">+' + xp + ' XP</p>' : '') + (r.counts[1] ? '<p class="bio-fc-note">Cards you marked Again come back in about ten minutes.</p>' : '') +
      '<div class="bio-fc-actions">' + (q.due.length + q.fresh.length ? '<button type="button" class="btn-press alt" data-act="more">Keep going (' + (q.due.length + q.fresh.length) + ')</button>' : '') +
      '<button type="button" class="btn-outline" data-act="home">Back to decks</button><a class="btn-outline" href="' + esc(BASE + 'practice.html') + '">Practice questions</a></div></section>';
    var more = app.querySelector('[data-act="more"]');
    if(more) more.addEventListener('click', function(){ start(q.due.concat(q.fresh), 'scheduled'); });
    app.querySelector('[data-act="home"]').addEventListener('click', function(){ renderHome(); var s = document.getElementById('bio-fc-deck'); if(s) s.focus(); });
    app.querySelector('.bio-fc-done').focus({ preventScroll: true });
  }
  document.addEventListener('keydown', function(e){
    if(!run || e.ctrlKey || e.metaKey || e.altKey) return;
    var t = e.target, tag = t && t.tagName;
    if(tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA' || (t && t.isContentEditable)) return;
    if(t && t.closest && t.closest('.auth-modal, [role="dialog"]')) return;
    if(e.key === ' ' || e.key === 'Enter'){
      if((tag === 'BUTTON' && !t.hasAttribute('data-act')) || tag === 'A') return;
      if(tag === 'BUTTON' && t.getAttribute('data-act') !== 'flip') return;
      if(!run.flipped){ e.preventDefault(); flip(); }
    } else if(/^[1-4]$/.test(e.key) && run.flipped){ e.preventDefault(); grade(+e.key); }
  });

  app.innerHTML = '<div class="bio-fc-loading panel" aria-busy="true"><p>Shuffling the deck…</p></div>';
  function getJson(url){ return fetch(url).then(function(r){ if(!r.ok) throw new Error(r.status); return r.json(); }).catch(function(){ return null; }); }
  Promise.all([getJson(BASE + 'assets/glossary.json'), getJson(BASE + 'assets/summaries.json')]).then(function(res){
    buildCards(glossMap(res[0]), res[1]);
    if(!(prefs.deck === 'all' || prefs.deck === 'missed' || deckCards(prefs.deck).length)) prefs.deck = 'all';
    if(prefs.deck === 'missed') return loadMissed().then(renderHome);
    renderHome();
  });
})();
