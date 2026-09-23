/* A&P flashcards (docs/anp-spec.md 8.8): spaced repetition over
     - the glossary (assets/glossary.json): every defined term, both ways,
       term -> definition and definition -> term;
     - data/tools/flashcards.json: comparison-table and key-fact cards, each
       tagged with a topic and core concepts (checked by
       scripts/lib/anp-tool-checks/flashcards.mjs).
   Only cards whose topic is built are dealt. Decks: everything, a chapter, a
   topic, a core concept, or "terms from questions I missed" (the glossary
   terms that appear in questions whose latest answer was wrong).

   SCHEDULING is the same SM-2 variant as ochem's flashcard-scheduler.js
   (Again / Hard / Good / Easy, a daily allowance of new cards, studying ahead
   never lengthens an interval), ported here because that module hard-codes
   its own storage key.

   STORAGE  localStorage['anp_flashcards_v1'], synced with an account
   (registered by anp-core.js; the card-by-card merge is registered here too):
     { v: 1, cards: { <cardId>: { i, e, d, r, l, t } }, fresh: { day, n },
       paid: { day, xp } }
   i interval (days, 0 = learning), e ease, d due (ms), r reviews in a row,
   l lapses, t last graded (ms; what the merge compares).
   Card ids are permanent: gl:<concept>:t (term -> definition),
   gl:<concept>:d (definition -> term), fc:<authored id>.

   Self-grading moves no mastery number: a card you mark Good yourself is
   weaker evidence than a question the course graded (the rule ochem
   follows), so cards never touch anp_progress_v1. They pay XP (2 per
   scheduled card, 60 a day at most) and count toward the streak. */
(function(){
  var app = document.getElementById('app');
  var CU = window.AnpCurriculum;
  if(!app || !CU) return;
  var BASE = window.ANP_BASE || '';
  var KEY = 'anp_flashcards_v1';
  var PREFS = 'anp_prefs_v1';
  var MIN = 60000;
  var AGAIN = 1, HARD = 2, GOOD = 3, EASY = 4;
  var GRADES = [null, { n: 1, label: 'Again' }, { n: 2, label: 'Hard' }, { n: 3, label: 'Good' }, { n: 4, label: 'Easy' }];
  var EASE_START = 2.5, EASE_MIN = 1.3, EASE_MAX = 2.8, MAX_IVL = 365, RELEARN = 10 * MIN, NEW_PER_DAY = 20;
  var AHEAD_SIZE = 20, AGAIN_GAP = 3, CARD_XP = 2, CARD_XP_CAP = 60;

  function esc(s){ return String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
  // Authored card text may carry <i>, <sub>, <sup>, <b> (the validator allows no other markup).
  function rich(s){ return esc(s).replace(/&lt;(\/?)(i|b|sub|sup|em|strong)&gt;/g, '<$1$2>'); }
  function plural(n, w, ws){ return n + ' ' + (n === 1 ? w : (ws || w + 's')); }
  function reducedMotion(){ try{ return window.matchMedia('(prefers-reduced-motion: reduce)').matches; }catch(e){ return false; } }

  /* ---- the scheduler (same rules as ochem/assets/flashcard-scheduler.js) ---- */
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
    if(g === AGAIN){
      if(!learning){ s.l++; s.e -= 0.2; }
      s.i = 0; s.r = 0; s.d = now + RELEARN;
    } else {
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
    if(d < 14) return d + 'd';
    if(d < 60) return Math.round(d / 7) + 'w';
    if(d < 365) return Math.round(d / 30) + 'mo';
    return Math.round(d / 36.5) / 10 + 'y';
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

  /* Two devices' schedules, card by card: the copy graded more recently wins. */
  function merge(localRaw, cloudRaw){
    var mine = null, theirs = null;
    try{ mine = JSON.parse(localRaw); }catch(e){}
    try{ theirs = JSON.parse(cloudRaw); }catch(e){ return localRaw; }
    function ok(x){ return x && typeof x === 'object' && x.v === 1 && x.cards && typeof x.cards === 'object'; }
    if(!ok(theirs)) return localRaw;
    if(!ok(mine)) return cloudRaw;
    var out = { v: 1, cards: {}, fresh: theirs.fresh || { day: '', n: 0 }, paid: theirs.paid || { day: '', xp: 0 } };
    Object.keys(theirs.cards).forEach(function(id){ out.cards[id] = theirs.cards[id]; });
    Object.keys(mine.cards).forEach(function(id){ var a = mine.cards[id], b = out.cards[id]; if(!b || ((a && a.t) || 0) > ((b && b.t) || 0)) out.cards[id] = a; });
    [['fresh', 'n'], ['paid', 'xp']].forEach(function(p){
      var a = mine[p[0]] || { day: '' }, b = out[p[0]];
      if(String(a.day) > String(b.day)) out[p[0]] = a;
      else if(a.day === b.day){ var o = { day: a.day }; o[p[1]] = Math.max(a[p[1]] || 0, b[p[1]] || 0); out[p[0]] = o; }
    });
    return JSON.stringify(out);
  }
  if(window.StudyHubAccount){ var m = {}; m[KEY] = merge; window.StudyHubAccount.registerNamespace('anp', [KEY], m); }
  window.AnpFlashcards = { KEY: KEY, merge: merge, next: next };

  /* ---- preferences (this browser; stored under anp_prefs_v1.flashcards) ---- */
  var prefs = { deck: 'all', kinds: { t: true, d: true, f: true } };
  function readPrefs(){ try{ return JSON.parse(localStorage.getItem(PREFS) || '{}') || {}; }catch(e){ return {}; } }
  (function(){
    var p = readPrefs().flashcards;
    if(p && typeof p === 'object'){
      if(typeof p.deck === 'string') prefs.deck = p.deck;
      if(p.kinds && typeof p.kinds === 'object') ['t', 'd', 'f'].forEach(function(k){ if(typeof p.kinds[k] === 'boolean') prefs.kinds[k] = p.kinds[k]; });
    }
  })();
  function savePrefs(){ try{ var all = readPrefs(); all.flashcards = prefs; localStorage.setItem(PREFS, JSON.stringify(all)); }catch(e){} }
  // A link can open one deck: ?topic=<id>, ?chapter=<id>, ?core=<id> or ?deck=missed.
  (function(){
    var q = new URLSearchParams(location.search);
    ['topic', 'chapter', 'core'].forEach(function(k){ if(q.get(k)) prefs.deck = k + ':' + q.get(k); });
    if(q.get('deck') === 'missed') prefs.deck = 'missed';
  })();

  /* ---- the curriculum ---- */
  var TOPIC = {}, CHAPTER = {}, CORE = {};
  CU.topics.forEach(function(t){ TOPIC[t.id] = t; });
  CU.chapters.forEach(function(c){ CHAPTER[c.id] = c; });
  CU.core.forEach(function(c){ CORE[c.id] = c; });
  function built(id){ return !!(TOPIC[id] && TOPIC[id].built); }

  /* ---- the cards ---- */
  var CARDS = [], BY_ID = {}, missedConcepts = null;
  var GLOSS = {};
  function escRe(s){ return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
  // The definition -> term card must not show the term it asks for.
  function maskTerm(def, term){
    var names = [term.replace(/^the\s+/i, '')];
    var paren = term.match(/^(.*?)\s*\(([^)]+)\)\s*$/);
    if(paren){ names = [paren[1], paren[2]]; }
    names.forEach(function(n){
      n = n.trim();
      // Symbols and acronyms (pH, ATP) match case-sensitively, so short ones are safe to mask.
      var sym = /[A-Z]/.test(n.slice(1)) || /^[A-Z]{2,}/.test(n);
      if(n.length < (sym ? 2 : 3)) return;
      def = def.replace(new RegExp('(^|[^\\w-])' + escRe(n) + '(s|es)?(?![\\w-])', sym ? 'g' : 'gi'), '$1_____');
    });
    return def;
  }
  function buildCards(gloss, authored){
    var order = function(t){ return TOPIC[t] ? TOPIC[t].n : 9999; };
    Object.keys(gloss || {}).forEach(function(cid){
      var g = gloss[cid];
      if(!g || !g.d || !built(g.p)) return;
      GLOSS[cid] = g;
      var core = (TOPIC[g.p].core || []).slice();
      var base = { topic: g.p, core: core, concept: cid, term: g.t, def: g.d, roots: g.r || [], say: g.s || '', order: order(g.p) };
      CARDS.push(Object.assign({ id: 'gl:' + cid + ':t', kind: 't' }, base));
      CARDS.push(Object.assign({ id: 'gl:' + cid + ':d', kind: 'd', masked: maskTerm(g.d, g.t) }, base));
    });
    ((authored && authored.cards) || []).forEach(function(c){
      if(!c || !c.id || !built(c.topic)) return;
      CARDS.push({ id: 'fc:' + c.id, kind: 'f', topic: c.topic, core: c.core || [], front: c.front, back: c.back, why: c.why, compare: c.compare || '', order: order(c.topic), rid: c.id });
    });
    // Curriculum order, so new cards arrive in the order the course teaches them.
    CARDS.sort(function(a, b){ return a.order - b.order; });
    CARDS.forEach(function(c){ BY_ID[c.id] = c; });
  }

  function inDeck(c, deck){
    if(!prefs.kinds[c.kind]) return false;
    if(deck === 'all') return true;
    if(deck === 'missed') return !!(missedConcepts && c.concept && missedConcepts[c.concept]);
    var p = deck.split(':');
    if(p[0] === 'topic') return c.topic === p[1];
    if(p[0] === 'chapter') return TOPIC[c.topic] && TOPIC[c.topic].chapter === p[1];
    if(p[0] === 'core') return (c.core || []).indexOf(p[1]) > -1;
    return true;
  }
  function deckCards(deck){ return CARDS.filter(function(c){ return inDeck(c, deck); }); }
  function deckName(deck){
    if(deck === 'all') return 'Every built topic';
    if(deck === 'missed') return 'Terms from questions I missed';
    var p = deck.split(':');
    if(p[0] === 'topic' && TOPIC[p[1]]) return TOPIC[p[1]].title;
    if(p[0] === 'chapter' && CHAPTER[p[1]]) return CHAPTER[p[1]].title;
    if(p[0] === 'core' && CORE[p[1]]) return CORE[p[1]].name;
    return 'Every built topic';
  }
  function queueFor(cards, now){
    var d = load(), due = [], fresh = [], learned = 0;
    cards.forEach(function(c){
      var s = d.cards[c.id];
      if(isNew(s)) fresh.push(c.id); else { learned++; if(s.d <= now) due.push(c.id); }
    });
    due.sort(function(a, b){ return d.cards[a].d - d.cards[b].d; });
    var allowance = Math.max(0, NEW_PER_DAY - introducedToday(d, now));
    var soon = 0, week = midnightPlus(now, 7);
    cards.forEach(function(c){ var s = d.cards[c.id]; if(!isNew(s) && s.d > now && s.d < week) soon++; });
    return { due: due, fresh: fresh.slice(0, allowance), newTotal: fresh.length, learned: learned, allowance: allowance, total: cards.length, soon: soon };
  }

  /* ---- "terms from questions I missed" ---- */
  function loadMissed(){
    var ids = window.AnpCore ? window.AnpCore.missed().filter(function(id){ return /^anp-/.test(id); }) : [];
    if(!ids.length){ missedConcepts = {}; return Promise.resolve(); }
    return fetch(BASE + 'assets/bank-core.json').then(function(r){ if(!r.ok) throw 0; return r.json(); }).then(function(bank){
      var want = {}; ids.forEach(function(id){ want[id] = 1; });
      var text = bank.filter(function(q){ return want[q.id]; }).map(function(q){ return [q.q].concat(q.options || []).concat((q.variables || []).map(function(v){ return v.name; })).join(' '); }).join(' \n ').replace(/<[^>]+>/g, ' ');
      var found = {};
      Object.keys(GLOSS).forEach(function(cid){
        var t = GLOSS[cid].t.replace(/^the\s+/i, '').replace(/\s*\([^)]*\)\s*$/, '');
        if(t.length < 3) return;
        if(new RegExp('(^|[^\\w-])' + escRe(t) + '(s|es)?(?![\\w-])', 'i').test(text)) found[cid] = 1;
      });
      missedConcepts = found;
    }).catch(function(){ missedConcepts = {}; });
  }

  /* ---- the deck view ---- */
  var run = null;
  function kindCount(kind){ return CARDS.filter(function(c){ return c.kind === kind; }).length; }

  function renderHome(){
    run = null;
    var now = Date.now();
    if(!CARDS.length){
      app.innerHTML = '<div class="anp-fc-empty panel"><h2>No cards yet</h2><p>The flashcard files did not load. If you are offline, open this page once while online and it will work offline after that.</p></div>';
      return;
    }
    var cards = deckCards(prefs.deck);
    var q = queueFor(cards, now);
    var todo = q.due.length + q.fresh.length;
    var chapters = CU.chapters.filter(function(ch){ return CARDS.some(function(c){ return TOPIC[c.topic].chapter === ch.id; }); });
    var opt = function(v, label){ return '<option value="' + esc(v) + '"' + (v === prefs.deck ? ' selected' : '') + '>' + esc(label) + '</option>'; };
    var count = function(pred){ return CARDS.filter(function(c){ return prefs.kinds[c.kind] && pred(c); }).length; };
    var sel = opt('all', 'Every built topic (' + count(function(){ return true; }) + ')') +
      opt('missed', 'Terms from questions I missed') +
      '<optgroup label="Chapters">' + chapters.map(function(ch){ return opt('chapter:' + ch.id, ch.title + ' (' + count(function(c){ return TOPIC[c.topic].chapter === ch.id; }) + ')'); }).join('') + '</optgroup>' +
      '<optgroup label="Core concepts">' + CU.core.filter(function(k){ return count(function(c){ return c.core.indexOf(k.id) > -1; }); }).map(function(k){ return opt('core:' + k.id, k.name + ' (' + count(function(c){ return c.core.indexOf(k.id) > -1; }) + ')'); }).join('') + '</optgroup>' +
      chapters.map(function(ch){
        var ts = CU.topics.filter(function(t){ return t.chapter === ch.id && CARDS.some(function(c){ return c.topic === t.id; }); });
        return '<optgroup label="Topics: ' + esc(ch.title) + '">' + ts.map(function(t){ return opt('topic:' + t.id, t.n + '. ' + t.title + ' (' + count(function(c){ return c.topic === t.id; }) + ')'); }).join('') + '</optgroup>';
      }).join('');
    var kinds = [['t', 'Term → definition', kindCount('t')], ['d', 'Definition → term', kindCount('d')], ['f', 'Comparisons and key facts', kindCount('f')]];
    var missedNote = prefs.deck === 'missed'
      ? (missedConcepts === null ? '<p class="anp-fc-note">Finding the terms in your missed questions…</p>'
        : !cards.length ? '<p class="anp-fc-note">No missed terms right now. When you get a question wrong in practice, a lesson or a tool, the glossary terms it uses land in this deck.</p>' : '')
      : '';
    var stat = function(v, l, cls){ return '<div class="anp-fc-stat' + (cls ? ' ' + cls : '') + '"><b>' + v + '</b><span>' + l + '</span></div>'; };
    app.innerHTML =
      '<section class="anp-fc-deck panel" aria-labelledby="anp-fc-deck-h">' +
        '<h2 id="anp-fc-deck-h">Choose a deck</h2>' +
        '<label class="anp-fc-field" for="anp-fc-deck">Deck</label>' +
        '<select id="anp-fc-deck" class="anp-fc-select">' + sel + '</select>' +
        '<fieldset class="anp-fc-kinds"><legend>Card types</legend><div class="anp-fc-seg">' + kinds.map(function(k){
          return '<label><input type="checkbox" value="' + k[0] + '"' + (prefs.kinds[k[0]] ? ' checked' : '') + '><span>' + esc(k[1]) + ' <small>' + k[2] + '</small></span></label>';
        }).join('') + '</div></fieldset>' +
        missedNote +
      '</section>' +
      '<section class="anp-fc-today panel" aria-labelledby="anp-fc-today-h">' +
        '<h2 id="anp-fc-today-h">' + esc(deckName(prefs.deck)) + '</h2>' +
        '<div class="anp-fc-stats">' + stat(q.due.length, 'due now', q.due.length ? 'is-due' : '') + stat(q.fresh.length, 'new today') + stat(q.learned, 'learned') + stat(q.total, 'in this deck') + '</div>' +
        '<p class="anp-fc-note">' + (q.soon ? plural(q.soon, 'card') + ' coming due in the next 7 days. ' : '') +
          (q.newTotal > q.fresh.length ? plural(q.newTotal - q.fresh.length, 'more new card') + ' will be introduced on later days (' + NEW_PER_DAY + ' a day keeps reviews manageable).' : '') + '</p>' +
        '<div class="anp-fc-actions">' +
          (todo ? '<button type="button" class="btn-press alt" data-act="study">Study ' + plural(todo, 'card') + '</button>'
                : '<p class="anp-fc-caught">' + (q.total ? 'You are caught up on this deck.' : 'This deck has no cards with the card types chosen.') + '</p>') +
          (q.learned && !q.due.length ? '<button type="button" class="btn-outline" data-act="ahead">Study ahead</button>' : '') +
        '</div>' +
        '<p class="anp-fc-how">Grade yourself honestly: <b>Again</b> if you did not know it, <b>Hard</b> if it took effort, <b>Good</b> if you knew it, <b>Easy</b> if it was instant. Each card comes back just before you would forget it. Cards do not change your mastery scores; questions do.</p>' +
      '</section>';
    var s = document.getElementById('anp-fc-deck');
    s.addEventListener('change', function(){
      prefs.deck = s.value; savePrefs();
      if(prefs.deck === 'missed' && missedConcepts === null){ renderHome(); loadMissed().then(renderHome); return; }
      renderHome(); document.getElementById('anp-fc-deck').focus();
    });
    app.querySelectorAll('.anp-fc-kinds input').forEach(function(cb){
      cb.addEventListener('change', function(){
        prefs.kinds[cb.value] = cb.checked;
        if(!prefs.kinds.t && !prefs.kinds.d && !prefs.kinds.f){ prefs.kinds[cb.value] = true; }
        savePrefs(); renderHome();
        var again = app.querySelector('.anp-fc-kinds input[value="' + cb.value + '"]'); if(again) again.focus();
      });
    });
    var study = app.querySelector('[data-act="study"]');
    if(study) study.addEventListener('click', function(){ start(q.due.concat(q.fresh), 'scheduled'); });
    var ahead = app.querySelector('[data-act="ahead"]');
    if(ahead) ahead.addEventListener('click', function(){
      var d = load();
      var ids = cards.filter(function(c){ var st = d.cards[c.id]; return !isNew(st); })
        .sort(function(a, b){ return d.cards[a.id].d - d.cards[b.id].d; }).slice(0, AHEAD_SIZE).map(function(c){ return c.id; });
      start(ids, 'ahead');
    });
  }

  /* ---- a session ---- */
  function start(ids, mode){
    if(!ids.length) return;
    run = { queue: ids.slice(), mode: mode, total: ids.length, done: 0, flipped: false, counts: [0, 0, 0, 0, 0], paidIds: {}, paid: 0, seen: {}, deck: prefs.deck };
    try{ window.scrollTo({ top: app.getBoundingClientRect().top + window.pageYOffset - 90, behavior: reducedMotion() ? 'auto' : 'smooth' }); }catch(e){}
    showCard();
  }

  function frontHtml(c){
    if(c.kind === 't') return '<p class="anp-fc-ask">What does this term mean?</p><p class="anp-fc-q">' + esc(c.term) + '</p>';
    if(c.kind === 'd') return '<p class="anp-fc-ask">Which term is this?</p><p class="anp-fc-q anp-fc-q-def">' + esc(c.masked) + '</p>';
    return '<p class="anp-fc-ask">' + (c.compare ? esc(c.compare) : 'Key fact') + '</p><p class="anp-fc-q anp-fc-q-def">' + rich(c.front) + '</p>';
  }
  function backHtml(c){
    var t = TOPIC[c.topic];
    var roots = c.roots && c.roots.length ? '<p class="anp-fc-roots"><span>Word roots</span> ' + c.roots.map(function(r){ return '<b>' + esc(r[0]) + '</b> ' + esc(r[1]); }).join(' &middot; ') + '</p>' : '';
    var say = c.say ? ' <span class="anp-fc-say">(' + esc(c.say) + ')</span>' : '';
    var body;
    if(c.kind === 't') body = '<p class="anp-fc-a">' + esc(c.def) + '</p>' + roots;
    else if(c.kind === 'd') body = '<p class="anp-fc-a anp-fc-a-term">' + esc(c.term) + say + '</p><p class="anp-fc-a-sub">' + esc(c.def) + '</p>' + roots;
    else body = '<p class="anp-fc-a">' + rich(c.back) + '</p><p class="anp-fc-why"><span>Why</span> ' + rich(c.why) + '</p>';
    var from = '<p class="anp-fc-from">Taught in <a href="' + esc(BASE + 'lessons/' + c.topic + '.html') + '">' + esc(t.n + '. ' + t.title) + '</a> &middot; <a href="' + esc(BASE + 'notes/' + c.topic + '.html') + '">notes</a>' +
      (window.LevlReport ? ' <span class="anp-fc-report">' + window.LevlReport.button('anp', c.id) + '</span>' : '') + '</p>';
    return body + from;
  }

  function showCard(){
    if(!run.queue.length){ finish(); return; }
    var c = BY_ID[run.queue[0]];
    if(!c){ run.queue.shift(); showCard(); return; }
    run.flipped = false;
    var t = TOPIC[c.topic];
    var kindLabel = c.kind === 'f' ? (c.compare ? 'Comparison' : 'Key fact') : 'Glossary';
    var s = load().cards[c.id];
    var state = isNew(s) ? '<span class="anp-fc-tag new">New</span>' : isLearning(s) ? '<span class="anp-fc-tag learn">Learning</span>' : '<span class="anp-fc-tag">Review</span>';
    var pct = Math.round(run.done / Math.max(1, run.done + run.queue.length) * 100);
    app.innerHTML =
      '<div class="anp-fc-session">' +
        '<div class="anp-fc-bar"><span class="anp-fc-mode">' + esc(deckName(run.deck)) + (run.mode === 'ahead' ? ' &middot; studying ahead' : '') + '</span>' +
          '<button type="button" class="anp-fc-quit" data-act="quit">End session</button></div>' +
        '<div class="anp-fc-prog"><div class="track thin" role="progressbar" aria-label="Session progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + pct + '"><i style="width:' + pct + '%"></i></div>' +
          '<span class="anp-fc-prog-l">' + run.done + ' done &middot; ' + run.queue.length + ' to go</span></div>' +
        '<div class="anp-fc-card" id="anp-fc-card">' +
          '<button type="button" class="anp-fc-face anp-fc-front" data-act="flip" aria-describedby="anp-fc-hint">' +
            '<span class="anp-fc-meta">' + state + '<span class="anp-fc-tag">' + kindLabel + '</span><span>' + esc(t.title) + '</span></span>' +
            frontHtml(c) +
            '<span class="anp-fc-tap" id="anp-fc-hint">Tap or press Space to show the answer</span>' +
          '</button>' +
        '</div>' +
        '<p class="anp-fc-keys" aria-hidden="true"><kbd>Space</kbd> flip &middot; <kbd>1</kbd> Again &middot; <kbd>2</kbd> Hard &middot; <kbd>3</kbd> Good &middot; <kbd>4</kbd> Easy</p>' +
        '<p class="sr-only" aria-live="polite" id="anp-fc-live"></p>' +
      '</div>';
    app.querySelector('[data-act="quit"]').addEventListener('click', function(){ finish(true); });
    var front = app.querySelector('[data-act="flip"]');
    front.addEventListener('click', flip);
    front.focus({ preventScroll: true });
  }

  function flip(){
    if(!run || run.flipped) return;
    run.flipped = true;
    var c = BY_ID[run.queue[0]];
    var now = Date.now();
    var s = load().cards[c.id] || null;
    var early = isEarly(s, now);
    var card = document.getElementById('anp-fc-card');
    var front = card.querySelector('.anp-fc-front');
    var frontInner = front.innerHTML.replace(/<span class="anp-fc-tap"[\s\S]*?<\/span>/, '');
    var grades = [1, 2, 3, 4].map(function(g){
      var st = next(s, g, now, early);
      var when = early && g !== AGAIN && !isNew(s) ? 'no change' : ivlLabel(st, now);
      return '<button type="button" class="anp-fc-g g' + g + '" data-g="' + g + '"><span>' + GRADES[g].label + '</span><small>' + when + '</small></button>';
    }).join('');
    card.innerHTML =
      '<div class="anp-fc-face anp-fc-back" tabindex="-1" aria-labelledby="anp-fc-ans-h">' +
        '<div class="anp-fc-prompt">' + frontInner + '</div>' +
        '<h3 class="sr-only" id="anp-fc-ans-h">Answer</h3>' +
        '<div class="anp-fc-answer">' + backHtml(c) + '</div>' +
      '</div>' +
      '<div class="anp-fc-grades" role="group" aria-label="How well did you know it?">' + grades + '</div>';
    if(!reducedMotion()){ card.classList.remove('is-turning'); void card.offsetWidth; card.classList.add('is-turning'); }
    card.querySelectorAll('.anp-fc-g').forEach(function(b){ b.addEventListener('click', function(){ grade(+b.getAttribute('data-g')); }); });
    var live = document.getElementById('anp-fc-live');
    if(live) live.textContent = 'Answer shown. Grade it: 1 Again, 2 Hard, 3 Good, 4 Easy.';
    card.querySelector('.anp-fc-back').focus({ preventScroll: true });
  }

  function grade(g){
    if(!run || !run.flipped) return;
    var id = run.queue.shift();
    var now = Date.now();
    var d = load();
    var prev = d.cards[id] || null;
    var wasNew = isNew(prev);
    var early = isEarly(prev, now);
    d.cards[id] = next(prev, g, now, early);
    if(wasNew){ var today = dayKey(now); if(d.fresh.day !== today) d.fresh = { day: today, n: 0 }; d.fresh.n++; }
    save(d);
    run.counts[g]++;
    // Scheduled work pays once per card per session; studying ahead pays nothing.
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
    if(window.HubProgress){
      if(xp) window.HubProgress.award('anp', xp);
      window.HubProgress.recordActivity('anp', n);
    }
    return xp;
  }
  window.addEventListener('pagehide', function(){ if(run) settle(); });

  function finish(quit){
    if(!run) return;
    var r = run;
    var xp = settle();
    var graded = r.counts[1] + r.counts[2] + r.counts[3] + r.counts[4];
    if(graded && window.AnpCore) window.AnpCore.event('anp-session-finish', { mode: 'flashcards', answered: graded, correct: graded - r.counts[1] });
    run = null;
    var row = function(g){ return '<li class="g' + g + '"><b>' + r.counts[g] + '</b><span>' + GRADES[g].label + '</span></li>'; };
    var q = queueFor(deckCards(r.deck), Date.now());
    app.innerHTML =
      '<section class="anp-fc-done panel" aria-labelledby="anp-fc-done-h" tabindex="-1">' +
        '<h2 id="anp-fc-done-h">' + (quit && r.done < r.total ? 'Session ended' : 'Session complete') + '</h2>' +
        (graded ? '<p>You worked through ' + plural(r.done, 'card') + ' (' + plural(graded, 'grade') + ').</p><ul class="anp-fc-tally">' + [1, 2, 3, 4].map(row).join('') + '</ul>'
                : '<p>No cards graded this time.</p>') +
        (xp ? '<p class="anp-fc-xp">+' + xp + ' XP</p>' : (r.mode === 'ahead' && graded ? '<p class="anp-fc-note">Studying ahead earns no XP and does not push cards further out, unless you mark one Again.</p>' : '')) +
        (r.counts[1] ? '<p class="anp-fc-note">Cards you marked Again come back in about ten minutes.</p>' : '') +
        '<div class="anp-fc-actions">' +
          (q.due.length + q.fresh.length ? '<button type="button" class="btn-press alt" data-act="more">Keep going (' + (q.due.length + q.fresh.length) + ')</button>' : '') +
          '<button type="button" class="btn-outline" data-act="home">Back to decks</button>' +
          '<a class="btn-outline" href="' + esc(BASE + 'practice.html') + '">Practice questions</a>' +
        '</div>' +
      '</section>';
    var more = app.querySelector('[data-act="more"]');
    if(more) more.addEventListener('click', function(){ start(q.due.concat(q.fresh), 'scheduled'); });
    app.querySelector('[data-act="home"]').addEventListener('click', function(){ renderHome(); var s = document.getElementById('anp-fc-deck'); if(s) s.focus(); });
    app.querySelector('.anp-fc-done').focus({ preventScroll: true });
  }

  document.addEventListener('keydown', function(e){
    if(!run || e.ctrlKey || e.metaKey || e.altKey) return;
    var t = e.target, tag = t && t.tagName;
    if(tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA' || (t && t.isContentEditable)) return;
    if(t && t.closest && t.closest('.auth-modal, [role="dialog"]')) return;
    if(e.key === ' ' || e.key === 'Enter'){
      // A focused grade button, link or the report button does its own thing.
      if((tag === 'BUTTON' && !t.hasAttribute('data-act')) || tag === 'A') return;
      if(tag === 'BUTTON' && t.getAttribute('data-act') !== 'flip') return;
      if(!run.flipped){ e.preventDefault(); flip(); }
    } else if(/^[1-4]$/.test(e.key) && run.flipped){
      e.preventDefault(); grade(+e.key);
    }
  });

  /* ---- boot ---- */
  app.innerHTML = '<div class="anp-fc-loading panel" aria-busy="true"><p>Shuffling the deck…</p></div>';
  function getJson(url){ return fetch(url).then(function(r){ if(!r.ok) throw new Error(r.status); return r.json(); }).catch(function(){ return null; }); }
  Promise.all([getJson(BASE + 'assets/glossary.json'), getJson(BASE + 'data/tools/flashcards.json')]).then(function(res){
    buildCards(res[0], res[1]);
    var valid = prefs.deck === 'all' || prefs.deck === 'missed' || deckCards(prefs.deck).length || /^core:/.test(prefs.deck);
    if(!valid) prefs.deck = 'all';
    if(prefs.deck === 'missed') return loadMissed().then(renderHome);
    renderHome();
  });
})();
