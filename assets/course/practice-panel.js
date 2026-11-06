/* The Practice panel (docs/course-redesign-r4.md decision 5, Olivier 2026-11-05; mockup
   docs/redesign-r4/mockups/Practice.dc.html). One panel on every course's practice.html:

     1 · What do you want to do?   a tile per mode the course has (the links are in the page, from
                                   scripts/lib/practice-panel.mjs, so each still opens its own page
                                   without JavaScript); Review and Flashcards show live counts
     2 · Set it up                 every setting for that mode, nothing folded away. A Practice set is
                                   the practice engine's own builder (#app, #practiceHome or #nrBuilder:
                                   config setRoot); every other mode is drawn here in #ppSet
     the navy bar                  what the choice adds up to and one Start. For a Practice set it is
                                   the engine's own .cx-start, styled as the bar (practice-panel.css)

   Start opens the mode's existing page with the settings in the URL and go=1; each engine reads them
   and starts (review.html?go=1&unit=&n= (ochem chapter=, NREMT domain=), flashcards.html?go=1&deck=&kinds=&new=, exams.html?go=1&mode=...,
   frq/<id>.html or frq.html?go=1&type=&unit=, justify.html?p= or ?go=1, cram.html?date=&weeks=&print=).
   The old pages keep working when opened directly. The free daily limit shows once, in the band.
   Config: <script type="application/json" id="ppConfig"> (scripts/lib/practice-panel.mjs panelConfig). */
(function(){
  var cfgEl = document.getElementById('ppConfig'), root = document.getElementById('pp');
  if(!cfgEl || !root) return;
  var C;
  try{ C = JSON.parse(cfgEl.textContent); }catch(e){ return; }
  var W = window, doc = document;
  var setEl = doc.getElementById('ppSet'), bar = doc.getElementById('ppBar');
  var sumEl = doc.getElementById('ppSum'), sum2El = doc.getElementById('ppSum2'), goEl = doc.getElementById('ppGo');
  var engine = doc.querySelector(C.setRoot);
  var tiles = [].slice.call(root.querySelectorAll('.pp-tile'));
  var HAS = {}; C.modes.forEach(function(m){ HAS[m] = 1; });

  function esc(s){ return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function plural(n, w, ws){ return n + ' ' + (n === 1 ? w : (ws || w + 's')); }
  function fmt(n){ return Number(n || 0).toLocaleString('en-US'); }
  function pad(n){ return (n < 10 ? '0' : '') + n; }
  function dayKey(){ var d = new Date(); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function readJson(k, d){ try{ var v = JSON.parse(localStorage.getItem(k) || 'null'); return v == null ? d : v; }catch(e){ return d; } }
  function query(o){
    var p = new URLSearchParams();
    Object.keys(o).forEach(function(k){ var v = o[k]; if(v !== '' && v != null && v !== false) p.set(k, v === true ? '1' : String(v)); });
    var s = p.toString();
    return s ? '?' + s : '';
  }
  function loadScript(src){
    return new Promise(function(res, rej){ var s = doc.createElement('script'); s.src = src; s.onload = res; s.onerror = rej; doc.head.appendChild(s); });
  }
  function getJson(url){ return fetch(url).then(function(r){ if(!r.ok) throw new Error(r.status); return r.json(); }); }

  /* ---------------------------------------------------------------- the course's data */
  var A = { ready: Promise.resolve(), noun: 'question' };
  var fam = C.family;
  if(fam === 'ap' || fam === 'anp'){
    var CUR = W[C.glob + 'Curriculum'] || {}, Core = W[C.glob + 'Core'];
    var ANP = fam === 'anp';
    var UNITS = (ANP ? CUR.chapters : CUR.units) || [], TOPICS = CUR.topics || [];
    var uOf = function(t){ return ANP ? t.chapter : t.unit; };
    A.unitWord = ANP ? 'chapter' : 'unit';
    A.unitName = function(u){ return ANP ? u.n + '. ' + u.title : (u.part === 'course' ? 'Unit ' + u.n + ': ' : '') + u.title; };
    A.units = function(){ var h = {}; TOPICS.forEach(function(t){ if(t.built && t.qn) h[uOf(t)] = 1; }); return UNITS.filter(function(u){ return h[u.id]; }); };
    A.unitById = function(id){ return UNITS.filter(function(u){ return u.id === id; })[0]; };
    A.topics = function(uid){ return TOPICS.filter(function(t){ return t.built && (!uid || uOf(t) === uid); }); };
    A.topicById = function(id){ return TOPICS.filter(function(t){ return t.id === id; })[0]; };
    A.qcount = function(){ return TOPICS.reduce(function(n, t){ return n + (t.built ? (t.qn || 0) : 0); }, 0); };
    A.due = function(){ try{ return Core && Core.reviewCount ? Core.reviewCount() : 0; }catch(e){ return 0; } };
  } else if(fam === 'ochem'){
    var OC = W.OchemCurriculum;
    A.ready = W.OchemPracticeBankReady || Promise.resolve();
    A.noun = 'concept';
    A.chapters = function(){ return ((OC && OC.MODULES) || []).map(function(m, i){ return { id: m.id, n: i + 1, name: (i + 1) + '. ' + m.title }; }); };
    A.qcount = function(){ try{ return W.OchemQuestionEngine.stats().total; }catch(e){ return 0; } };
    A.due = function(){ try{ return W.OchemQuestionEngine.reviewQueue().dueTotal; }catch(e){ return 0; } };
  } else if(fam === 'nremt'){
    A.ready = new Promise(function(res){
      if(W.NremtQueue) return res();
      doc.addEventListener('nremt-queue', function(){ res(); });
    });
    A.qcount = function(){ return W.NremtQueue ? W.NremtQueue.total : 0; };
    A.due = function(){ try{ return W.NremtQueue ? W.NremtQueue.due() : 0; }catch(e){ return 0; } };
  }

  /* Flashcards: every course stores { cards: { id: { d, t } }, fresh: { day, n } }. */
  function perDay(){
    var p = C.store && C.store.prefs ? (readJson(C.store.prefs, {}).flashcards || {}) : {};
    return p.perDay >= 5 && p.perDay <= 50 ? p.perDay : 20;
  }
  function flashCounts(){
    var key = C.store && C.store.cards;
    if(!key) return null;
    var d = readJson(key, {}) || {}, cards = d.cards || {}, now = Date.now(), due = 0;
    Object.keys(cards).forEach(function(k){ var s = cards[k]; if(s && s.t && s.d <= now) due++; });
    var intro = d.fresh && d.fresh.day === dayKey() ? (d.fresh.n || 0) : 0;
    return { due: due, fresh: Math.max(0, perDay() - intro) };
  }

  /* ---------------------------------------------------------------- fields */
  function opt(o, val){ return '<option value="' + esc(o.v) + '"' + (String(o.v) === String(val) ? ' selected' : '') + '>' + esc(o.t) + '</option>'; }
  function sel(k, label, opts, val, off){
    return '<label class="cx-field"><span>' + label + '</span><select data-k="' + k + '"' + (off ? ' disabled' : '') + '>' + opts.map(function(o){
      return o.group ? '<optgroup label="' + esc(o.group) + '">' + o.list.map(function(x){ return opt(x, val); }).join('') + '</optgroup>' : opt(o, val);
    }).join('') + '</select></label>';
  }
  /* list: [value, label, disabled]; type checkbox takes an array of values. */
  function chips(k, label, list, val, type){
    type = type || 'radio';
    return '<fieldset class="cx-group"><legend>' + label + '</legend><div class="cx-pills">' + list.map(function(x){
      var on = type === 'checkbox' ? val.indexOf(String(x[0])) > -1 : String(x[0]) === String(val);
      return '<label class="cx-pill"><input type="' + type + '" name="pp-' + k + '" data-k="' + k + '" value="' + esc(x[0]) + '"' + (on ? ' checked' : '') + (x[2] ? ' disabled' : '') + '><span>' + esc(x[1]) + '</span></label>';
    }).join('') + '</div></fieldset>';
  }
  function check(k, label, on){ return '<label class="cx-check pp-check"><input type="checkbox" data-k="' + k + '"' + (on ? ' checked' : '') + '> <span>' + label + '</span></label>'; }
  function grid(html){ return '<div class="pp-grid">' + html + '</div>'; }
  function note(html){ return '<p class="pp-note">' + html + '</p>'; }
  var LOADING = note('Loading…');

  var TIMING = [{ v: 'std', t: 'Standard time' }, { v: 'x15', t: 'Extra time (1.5×)' }, { v: 'x2', t: 'Double time' }, { v: 'off', t: 'Untimed' }];
  function timingName(id){ return (TIMING.filter(function(t){ return t.v === id; })[0] || TIMING[0]).t.toLowerCase(); }

  /* ---------------------------------------------------------------- modes */
  var M = {};

  /* Review: the queue, oldest first, filtered by unit and capped. AP® and A&P by unit; ochem by chapter
     (review.html?chapter=: the due concepts that show up in its topics); NREMT by exam domain or topic area
     (review.html?domain=, the drill picker's values). */
  function reviewHow(s, due){ return chips('n', 'How many', [[0, due ? 'All ' + due + ' due' : 'All due'], [10, '10'], [20, '20']], s.n); }
  function reviewArea(s){
    if(fam === 'ochem'){ var ch = A.chapters().filter(function(x){ return x.id === s.unit; })[0]; return ch ? 'Chapter ' + ch.name : ''; }
    if(fam === 'nremt') return s.unit.indexOf('system:') === 0 ? s.unit.slice(7) : s.unit;
    var u = s.unit && A.unitById ? A.unitById(s.unit) : null;
    return u ? A.unitName(u) : '';
  }
  M.review = {
    init: function(s){ s.unit = ''; s.n = 0; },
    html: function(s){
      var due = A.due();
      if(fam === 'ochem') return grid(sel('unit', 'Chapter', [{ v: '', t: 'Every chapter' }].concat(A.chapters().map(function(c){ return { v: c.id, t: c.name }; })), s.unit) + reviewHow(s, due)) +
        note('Today&rsquo;s batch is capped per day; a concept counts for every chapter it shows up in.');
      if(fam === 'nremt'){
        var ra = C.reviewAreas || { domains: [], systems: [] };
        return grid(sel('unit', 'Domain', [{ v: '', t: 'Every domain' },
          { group: 'Exam domains', list: ra.domains.map(function(d){ return { v: d, t: d }; }) },
          { group: 'Topic areas', list: ra.systems.map(function(d){ return { v: 'system:' + d, t: d }; }) }], s.unit) + reviewHow(s, due));
      }
      if(!A.units) return note('Nothing to set: the queue serves what is closest to being forgotten, oldest first.');
      return grid(sel('unit', A.unitWord === 'chapter' ? 'Chapter' : 'Unit', [{ v: '', t: 'Every ' + A.unitWord }].concat(A.units().map(function(u){ return { v: u.id, t: A.unitName(u) }; })), s.unit) +
        reviewHow(s, due));
    },
    sum: function(s){
      var due = A.due(), area = reviewArea(s);
      return {
        sum: due ? 'Review: ' + plural(due, A.noun) + ' due now' + (area ? ', from ' + area : '') : 'Review: nothing is due right now',
        sum2: due ? (s.n ? 'The ' + s.n + ' oldest first. ' : 'Oldest first. ') + 'A right answer sends it further out; a miss brings it back soon.' : 'Misses from anywhere in the course come back here when they are due.',
        cta: due ? 'Start review' : 'Open review',
        href: 'review.html' + (due ? query(fam === 'ochem' ? { go: 1, chapter: s.unit, n: s.n || '' } : fam === 'nremt' ? { go: 1, domain: s.unit, n: s.n || '' } : { go: 1, unit: s.unit, n: s.n || '' }) : '')
      };
    }
  };

  /* Flashcards. */
  M.flash = {
    init: function(s){
      if(fam === 'ap' || fam === 'anp'){
        var p = readJson(C.store.prefs, {}).flashcards || {};
        s.deck = typeof p.deck === 'string' ? p.deck : 'all';
        s.kinds = C.kinds.map(function(k){ return k[0]; }).filter(function(k){ return !p.kinds || p.kinds[k] !== false; });
        s.per = perDay();
      } else if(fam === 'ochem'){
        var o = readJson('ochem_flashcards_prefs', {}) || {};
        s.chapter = typeof o.chapter === 'string' ? o.chapter : 'all';
        s.scope = o.scope || 'all';
        s.types = ['concept', 'table', 'authored'].filter(function(k){ return !o.types || o.types[k] !== false; });
      } else {
        var n = readJson('nremt_flashcards_prefs', {}) || {};
        s.domain = typeof n.domain === 'string' ? n.domain : 'all';
        s.scope = n.scope === 'weak' ? 'weak' : 'all';
        s.types = ['fact', 'glossary', 'mnemonic', 'reference'].filter(function(k){ return !n.types || n.types[k] !== false; });
      }
    },
    html: function(s){
      if(fam === 'ap' || fam === 'anp'){
        var unitKey = ANP ? 'chapter' : 'unit';
        var decks = [{ v: 'all', t: 'Every published topic' }, { v: 'missed', t: 'Terms from questions I missed' },
          { group: ANP ? 'Chapters' : 'Units', list: A.units().map(function(u){ return { v: unitKey + ':' + u.id, t: A.unitName(u) }; }) }]
          .concat(A.units().map(function(u){ return { group: 'Topics: ' + A.unitName(u), list: A.topics(u.id).map(function(t){ return { v: 'topic:' + t.id, t: (t.ced ? t.ced + ' ' : '') + t.title }; }) }; }));
        return grid(sel('deck', 'Deck', decks, s.deck) + chips('kinds', 'Card types', C.kinds, s.kinds, 'checkbox') +
          chips('per', 'New cards a day', [[10, '10'], [20, '20'], [30, '30']], s.per));
      }
      if(fam === 'ochem'){
        return grid(sel('chapter', 'Chapter', [{ v: 'all', t: 'All chapters' }].concat(A.chapters().map(function(c){ return { v: c.id, t: c.name }; })), s.chapter) +
          chips('scope', 'Topics', [['all', 'All'], ['studied', 'Studied'], ['weak', 'Needs work']], s.scope) +
          chips('types', 'Card types', [['concept', 'Concepts'], ['table', 'Facts & values'], ['authored', 'Named reactions']], s.types, 'checkbox'));
      }
      return grid(sel('domain', 'Domain', [{ v: 'all', t: 'All domains' }].concat(C.domains.map(function(d){ return { v: d[0], t: d[1] }; })), s.domain) +
        chips('scope', 'Cards', [['all', 'All'], ['weak', 'Needs work']], s.scope) +
        chips('types', 'Card types', [['fact', 'Key facts'], ['glossary', 'Terms'], ['mnemonic', 'Mnemonics'], ['reference', 'Reference tables']], s.types, 'checkbox'));
    },
    sum: function(s){
      var c = flashCounts() || { due: 0, fresh: 20 }, href, what;
      if(fam === 'ap' || fam === 'anp'){
        var dk = s.deck.split(':'), u = dk[0] === 'unit' || dk[0] === 'chapter' ? A.unitById(dk[1]) : null, t = dk[0] === 'topic' ? A.topicById(dk[1]) : null;
        what = s.deck === 'missed' ? 'terms from questions you missed' : u ? A.unitName(u) : t ? t.title : 'every published topic';
        href = 'flashcards.html' + query({ go: 1, deck: s.deck, kinds: s.kinds.join(','), 'new': s.per });
      } else if(fam === 'ochem'){
        var ch = A.chapters().filter(function(x){ return x.id === s.chapter; })[0];
        what = ch ? 'Chapter ' + ch.name : 'all chapters';
        href = 'flashcards.html' + query({ go: 1, chapter: s.chapter, scope: s.scope, types: s.types.join(',') });
      } else {
        var dm = C.domains.filter(function(d){ return d[0] === s.domain; })[0];
        what = dm ? dm[1] : 'all domains';
        href = 'flashcards.html' + query({ go: 1, domain: s.domain, scope: s.scope, types: s.types.join(',') });
      }
      return {
        sum: 'Flashcards: ' + what,
        sum2: (c.due ? plural(c.due, 'card') + ' due, ' : '') + 'up to ' + plural(c.fresh, 'new card') + ' today. Grade yourself: Again, Hard, Good or Easy.',
        cta: 'Study the cards', href: href
      };
    }
  };

  /* A&P custom exam choices (the exam page's TYPE_GROUPS, LEVEL_NAME and DIFF_NAME in
     anatomy-physiology/assets/apps/exams.js). */
  var ANP_TYPES = [['single', 'Single best answer'], ['vignette', 'Clinical vignettes'], ['multi', 'Select all that apply'],
    ['sequence', 'Sequencing, missing step, find the error'], ['predict', 'Prediction tables']];
  var ANP_LEVELS = [['recall', 'Recall'], ['apply', 'Apply'], ['analyze', 'Analyze']];
  var ANP_DIFFS = [['1', 'Easier'], ['2', 'Medium'], ['3', 'Harder']];
  function ids(list){ return list.map(function(x){ return String(x[0]); }); }
  function anpCustomFill(s, cs){
    if(!s.cch) s.cch = cs.map(function(u){ return u.id; });
    if(!s.ctype) s.ctype = ids(ANP_TYPES);
    if(!s.clevel) s.clevel = ids(ANP_LEVELS);
    if(!s.cdiff) s.cdiff = ids(ANP_DIFFS);
  }
  function anpCustom(s, cs){
    anpCustomFill(s, cs);
    return grid('<div class="pp-wide">' + chips('cch', 'Chapters', cs.map(function(u){ return [u.id, A.unitName(u)]; }), s.cch, 'checkbox') + '</div>' +
      '<div class="pp-wide">' + chips('ctype', 'Question types', ANP_TYPES, s.ctype, 'checkbox') + '</div>' +
      chips('clevel', 'Level', ANP_LEVELS, s.clevel, 'checkbox') + chips('cdiff', 'Difficulty', ANP_DIFFS, s.cdiff, 'checkbox') +
      chips('clen', 'Questions', [[10, '10'], [20, '20'], [40, '40'], [0, 'All that match']], s.clen));
  }
  /* A list in the URL only when it leaves something out (the exam page reads every one as "all"). */
  function some(on, all){ return on && on.length < all.length ? on.join(',') : ''; }

  /* Exam. */
  M.exam = {
    init: function(s){
      if(fam === 'ap'){
        var p = readJson(C.store.prefs, {});
        s.kind = 'full'; s.unit = ''; s.len = 25; s.n = 20;
        s.timing = TIMING.some(function(t){ return t.v === p.examTiming; }) ? p.examTiming : 'std';
      } else if(fam === 'anp'){
        var q = readJson(C.store.prefs, {});
        s.kind = 'system'; s.chapter = ''; s.course = 'I';
        /* Custom exam: the same choices as the exam page's own setup (chapters, question types, level,
           difficulty, length); null means every one. */
        s.cch = null; s.ctype = null; s.clevel = null; s.cdiff = null; s.clen = 20;
        s.timing = TIMING.some(function(t){ return t.v === q.examTiming; }) ? q.examTiming : 'std';
      } else if(fam === 'ochem'){
        var o = readJson('ochem_exam_prefs_v1', {}) || {};
        s.kind = o.kind || 'chapter'; s.chapter = o.chapter || ''; s.chLen = o.chLen === 25 ? 25 : 20; s.midLen = o.midLen === 30 ? 30 : 40;
        var ids = A.chapters().map(function(c){ return c.id; }), fi = ids.indexOf(o.fromId || 'foundations'), ti = ids.indexOf(o.toId || 'alkenes-alkynes');
        s.from = fi > -1 ? fi + 1 : 1; s.to = ti >= fi && ti > -1 ? ti + 1 : Math.min(5, ids.length); s.timing = o.timing || 'std';
      } else {
        s.diff = 'all'; s.real = false;
      }
    },
    html: function(s){
      if(fam === 'ap'){
        var us = A.units().filter(function(u){ return u.part === 'course'; });
        if(!s.unit && us[0]) s.unit = us[0].id;
        var lens = s.kind === 'mixed' ? [[10, '10'], [20, '20'], [30, '30']] : [[15, '15'], [25, '25'], [0, 'All']];
        return grid('<div class="pp-wide">' + chips('kind', 'Kind', [['full', 'Full practice exam'], ['unit', 'Unit test'], ['mixed', 'Mixed timed set']], s.kind) + '</div>' +
          sel('unit', 'Unit (unit test)', us.map(function(u){ return { v: u.id, t: A.unitName(u) }; }), s.unit, s.kind !== 'unit') +
          (s.kind === 'full' ? '<div class="cx-group pp-fixed"><span class="pp-lab">Questions</span><span>The full exam</span></div>' : chips(s.kind === 'mixed' ? 'n' : 'len', 'Questions', lens, s.kind === 'mixed' ? s.n : s.len)) +
          sel('timing', 'Timing', TIMING, s.timing)) +
          '<details class="pp-more"><summary>What&rsquo;s in the full exam</summary><p>' + esc(C.exam) + ' Mixed timed sets come from every unit at the exam&rsquo;s pace and are part of the cram kit.</p></details>';
      }
      if(fam === 'anp'){
        var cs = A.units();
        if(!s.chapter && cs[0]) s.chapter = cs[0].id;
        return grid('<div class="pp-wide">' + chips('kind', 'Kind', [['unit', 'Unit quiz'], ['system', 'System exam'], ['final', 'Cumulative final'], ['custom', 'Custom exam'], ['teas', 'TEAS A&P practice']], s.kind) + '</div>' +
          sel('chapter', 'Chapter (unit quiz, system exam)', cs.map(function(u){ return { v: u.id, t: A.unitName(u) }; }), s.chapter, s.kind !== 'unit' && s.kind !== 'system') +
          chips('course', 'Course (final)', [['I', 'A&P I', s.kind !== 'final'], ['II', 'A&P II', s.kind !== 'final']], s.course) +
          sel('timing', 'Timing', TIMING.map(function(t){ return t.v === 'off' ? { v: 'off', t: 'No timer' } : t; }), s.timing)) +
          (s.kind === 'custom' ? anpCustom(s, cs) : '');
      }
      if(fam === 'ochem'){
        var chs = A.chapters();
        if(!s.chapter && chs[0]) s.chapter = chs[0].id;
        var byN = chs.map(function(c){ return { v: c.n, t: c.name }; });
        return grid('<div class="pp-wide">' + chips('kind', 'Kind', [['chapter', 'Chapter test'], ['midterm', 'Midterm'], ['final', 'Cumulative final']], s.kind) + '</div>' +
          sel('chapter', 'Chapter (chapter test)', chs.map(function(c){ return { v: c.id, t: c.name }; }), s.chapter, s.kind !== 'chapter') +
          sel('from', 'From chapter (midterm)', byN, s.from, s.kind !== 'midterm') + sel('to', 'To chapter (midterm)', byN, s.to, s.kind !== 'midterm') +
          (s.kind === 'final' ? '<div class="cx-group pp-fixed"><span class="pp-lab">Questions</span><span>50, from every chapter</span></div>'
            : s.kind === 'midterm' ? chips('midLen', 'Questions', [[30, '30'], [40, '40']], s.midLen) : chips('chLen', 'Questions', [[20, '20'], [25, '25']], s.chLen)) +
          sel('timing', 'Timing', TIMING.map(function(t){ return t.v === 'off' ? { v: 'off', t: 'No timer' } : t; }), s.timing));
      }
      return grid(sel('diff', 'Difficulty', [{ v: 'all', t: 'All levels' }, { v: 'easy', t: 'Easy only' }, { v: 'medium', t: 'Medium only' }, { v: 'hard', t: 'Hard only' }, { v: 'expert', t: 'Expert only' }], s.diff) +
        '<div class="pp-wide">' + check('real', '<strong>Exam-realistic</strong>: no flagging, no going back, like the real thing', s.real) + '</div>') +
        '<details class="pp-more"><summary>What&rsquo;s in the timed exam</summary><p>100 questions in the 2025 domain proportions, 2 hours (about 72 seconds a question), scored by domain. The real NREMT is adaptive: for that format, choose Adaptive exam. One timed exam is free.</p></details>';
    },
    sum: function(s){
      if(fam === 'ap'){
        var u = A.unitById(s.unit);
        var what = s.kind === 'unit' ? 'Unit test: ' + (u ? A.unitName(u) : '') + ', ' + (s.len ? s.len + ' questions' : 'every question') : s.kind === 'mixed' ? 'Mixed timed set: ' + s.n + ' questions' : 'Full practice exam';
        return { sum: what + ', ' + timingName(s.timing),
          sum2: 'No feedback until the end. Then every question with its explanation; misses go to your review queue.',
          cta: s.kind === 'mixed' ? 'Start the timed set' : s.kind === 'unit' ? 'Start the unit test' : 'Start the practice exam',
          href: 'exams.html' + query({ go: 1, mode: s.kind, unit: s.kind === 'unit' ? s.unit : '', len: s.kind === 'unit' ? s.len : '', n: s.kind === 'mixed' ? s.n : '', timing: s.timing }) };
      }
      if(fam === 'anp'){
        var c = A.unitById(s.chapter), names = { unit: 'Unit quiz', system: 'System exam', final: 'Cumulative final', custom: 'Custom exam', teas: 'TEAS A&P practice' };
        var custom = s.kind === 'custom', cs = A.units();
        if(custom) anpCustomFill(s, cs);
        var go = { unit: 'Start the unit quiz', system: 'Start the system exam', final: 'Start the final', custom: 'Start the custom exam', teas: 'Start TEAS practice' };
        var what = s.kind === 'unit' || s.kind === 'system' ? ': ' + (c ? c.title : '') : s.kind === 'final' ? ': A&P ' + s.course
          : custom ? ': ' + (s.cch.length === cs.length ? 'every chapter' : plural(s.cch.length, 'chapter')) + ', ' + (s.clen ? 'up to ' + s.clen + ' questions' : 'every question that matches') : '';
        return { sum: names[s.kind] + what + ', ' + timingName(s.timing).replace('untimed', 'no timer'),
          sum2: 'No feedback until the end. Then every question with its explanation.',
          cta: go[s.kind],
          href: 'exams.html' + query({ go: 1, mode: s.kind, chapter: s.kind === 'unit' || s.kind === 'system' ? s.chapter : '', course: s.kind === 'final' ? s.course : '',
            chapters: custom ? some(s.cch, cs) : '', types: custom ? some(s.ctype, ANP_TYPES) : '', levels: custom ? some(s.clevel, ANP_LEVELS) : '',
            diffs: custom ? some(s.cdiff, ANP_DIFFS) : '', len: custom ? String(s.clen) : '', timing: s.timing }) };
      }
      if(fam === 'ochem'){
        var ch = A.chapters().filter(function(x){ return x.id === s.chapter; })[0];
        var w = s.kind === 'chapter' ? 'Chapter test: ' + (ch ? ch.name : '') + ', ' + s.chLen + ' questions' : s.kind === 'midterm' ? 'Midterm: chapters ' + Math.min(s.from, s.to) + ' to ' + Math.max(s.from, s.to) + ', ' + s.midLen + ' questions' : 'Cumulative final: 50 questions';
        return { sum: w + ', ' + timingName(s.timing).replace('untimed', 'no timer'),
          sum2: 'No feedback until you submit. Change answers, flag and jump around with the question map.',
          cta: s.kind === 'final' ? 'Start the final' : s.kind === 'midterm' ? 'Start the midterm' : 'Start the chapter test',
          href: 'exams.html' + query({ go: 1, kind: s.kind, chapter: s.kind === 'chapter' ? s.chapter : '', len: s.kind === 'chapter' ? s.chLen : s.kind === 'midterm' ? s.midLen : '',
            from: s.kind === 'midterm' ? Math.min(s.from, s.to) : '', to: s.kind === 'midterm' ? Math.max(s.from, s.to) : '', timing: s.timing }) };
      }
      return { sum: 'Timed exam: 100 questions, 2 hours' + (s.diff !== 'all' ? ', ' + s.diff + ' only' : ''),
        sum2: (s.real ? 'Exam-realistic: no flagging, no going back. ' : '') + 'No feedback until you submit; then every question with its explanation.',
        cta: 'Start timed exam', href: 'exams.html' + query({ go: 1, exam: 'full', diff: s.diff !== 'all' ? s.diff : '', real: s.real }) };
    }
  };

  /* NREMT: the adaptive exam and the scenarios have no settings of their own. */
  M.cat = {
    init: function(){},
    html: function(){
      return '<ul class="pp-rules"><li>Each answer moves the next question harder or easier. It never shows right or wrong until the end.</li>' +
        '<li>Every question needs an answer, and there is no going back, as on the real exam.</li>' +
        '<li>It stops once it is 95% sure you are above or below the passing line, after at least 70 questions, or at 120, or at two hours.</li></ul>' +
        note('<b>A simulation.</b> LevlPrep&rsquo;s model of an adaptive exam, not the National Registry&rsquo;s algorithm; the passing line is our estimate. One adaptive exam is free.');
    },
    sum: function(){ return { sum: 'Adaptive exam: 70 to 120 questions, 2 hours at most', sum2: 'Then a likely pass or fail, and each domain above, near or below the line.', cta: 'Start adaptive exam', href: 'exams.html' + query({ go: 1, exam: 'cat' }) }; }
  };
  M.scen = {
    init: function(){},
    html: function(){ return note('Run a call from dispatch to handoff: size up the scene, assess, treat and transport, with feedback on every decision. You pick the call on the next page.'); },
    sum: function(){ return { sum: 'Scenarios: one call, start to finish', sum2: 'Every decision is explained when the call ends.', cta: 'Choose a call', href: 'scenario-sim.html' }; }
  };

  /* Free response (AP®): the list comes from assets/frq/index.json, the type names from the course's FRQ kit. */
  var FRQ = null, FRQI = null;
  function frqIndex(){ return FRQI || (FRQI = getJson('assets/frq/index.json')); }
  function frqData(){
    return FRQ || (FRQ = Promise.all([frqIndex(), W[C.kitGlob] ? Promise.resolve() : loadScript(C.kit)]).then(function(r){
      return { list: r[0] || [], K: W[C.kitGlob] || {} };
    }));
  }
  M.frq = {
    init: function(s){ s.type = ''; s.unit = ''; s.q = ''; },
    html: function(s){
      if(!s.data){ frqData().then(function(d){ s.data = d; if(mode === 'frq') render(); }, function(){ s.data = { list: [], K: {}, failed: true }; if(mode === 'frq') render(); }); return LOADING; }
      if(s.data.failed) return note('The questions did not load. Check your connection and try again.');
      var K = s.data.K, all = s.data.list, TYPES = K.TYPES || {}, ORDER = K.ORDER || Object.keys(TYPES);
      var have = {}; all.forEach(function(f){ have[f.type] = (have[f.type] || 0) + 1; });
      var units = []; all.forEach(function(f){ (f.units || []).forEach(function(u){ if(units.indexOf(u) < 0) units.push(u); }); });
      units = A.units ? UNITS.filter(function(u){ return units.indexOf(u.id) > -1; }) : [];
      var shown = matchFrq(s), sc = K.scores ? K.scores() : {};
      if(s.q && !shown.some(function(f){ return f.id === s.q; })) s.q = '';
      return grid(sel('type', 'Question type', [{ v: '', t: 'All ' + ORDER.filter(function(t){ return have[t]; }).length + ' types' }].concat(ORDER.filter(function(t){ return have[t]; }).map(function(t){ return { v: t, t: (TYPES[t] || t) + ' (' + have[t] + ')' }; })), s.type) +
        sel('unit', 'Unit', [{ v: '', t: 'Every unit' }].concat(units.map(function(u){ return { v: u.id, t: A.unitName(u) }; })), s.unit) +
        sel('q', 'Question', [{ v: '', t: 'Next one you have not scored' }].concat(shown.map(function(f){ var b = sc[f.id]; return { v: f.id, t: f.title + (b ? ' (best ' + b.best + '/' + b.of + ')' : '') }; })), s.q));
    },
    sum: function(s){
      if(!s.data || s.data.failed) return { sum: 'Free response', sum2: '', cta: 'See the questions', href: 'frq.html' };
      var shown = matchFrq(s), f = s.q ? shown.filter(function(x){ return x.id === s.q; })[0] : null, list = 'frq.html' + query({ type: s.type, unit: s.unit });
      return { sum: f ? f.title : 'Free response: ' + plural(shown.length, 'question') + ' match',
        sum2: 'Write each part, then score yourself with the rubric, point by point. <a href="' + esc(list) + '">See them all as a list</a>.',
        cta: 'Open the question', href: f ? 'frq/' + f.id + '.html' : 'frq.html' + query({ go: 1, type: s.type, unit: s.unit }), off: !shown.length };
    }
  };
  function matchFrq(s){ return s.data.list.filter(function(f){ return (!s.type || f.type === s.type) && (!s.unit || (f.units || []).indexOf(s.unit) > -1); }); }

  /* Justify (AP®): assets/justify.json, loaded only when this mode is chosen (it holds every model answer). */
  var JUS = null;
  M.justify = {
    init: function(s){ s.topic = ''; s.skill = ''; s.p = ''; },
    html: function(s){
      if(!s.data){ (JUS = JUS || getJson('assets/justify.json')).then(function(d){ s.data = d; if(mode === 'justify') render(); }, function(){ s.data = { failed: true }; if(mode === 'justify') render(); }); return LOADING; }
      if(s.data.failed || !s.data.prompts) return note('The prompts did not load. Check your connection and try again.');
      var ps = s.data.prompts, skills = [];
      ps.forEach(function(p){ if(skills.indexOf(p.skill) < 0) skills.push(p.skill); });
      var groups = UNITS.filter(function(u){ return ps.some(function(p){ return p.unit === u.id; }); }).map(function(u){
        var ts = []; ps.forEach(function(p){ if(p.unit === u.id && p.topic && ts.indexOf(p.topic) < 0) ts.push(p.topic); });
        return { group: A.unitName(u), list: [{ v: 'u:' + u.id, t: 'The whole unit' }].concat(ts.map(function(t){ var x = A.topicById(t); return { v: 't:' + t, t: x ? x.title : t }; })) };
      });
      var shown = matchJus(s), sc = (readJson(C.store.prefs, {}) || {}).justify || {};
      if(s.p && s.p !== 'list' && !shown.some(function(p){ return p.id === s.p; })) s.p = '';
      return grid(sel('topic', 'Topic', [{ v: '', t: 'Every topic' }].concat(groups), s.topic) +
        sel('skill', 'Skill', [{ v: '', t: 'Every skill' }].concat(skills.map(function(k){ return { v: k, t: s.data.skills[k] || k }; })), s.skill) +
        sel('p', 'Prompt', [{ v: '', t: 'Next one you have not checked' }, { v: 'list', t: 'All ' + shown.length + ' as a list' }].concat(shown.map(function(p){ var b = sc[p.id]; return { v: p.id, t: p.title + (b ? ' (best ' + b.best + '/' + b.of + ')' : '') }; })), s.p));
    },
    sum: function(s){
      if(!s.data || s.data.failed || !s.data.prompts) return { sum: 'Justify', sum2: '', cta: 'See the prompts', href: 'justify.html?list=1' };
      var shown = matchJus(s), one = s.p && s.p !== 'list' ? shown.filter(function(p){ return p.id === s.p; })[0] : null;
      var unit = s.topic.indexOf('u:') === 0 ? s.topic.slice(2) : '', topic = s.topic.indexOf('t:') === 0 ? s.topic.slice(2) : '';
      return { sum: one ? one.title : 'Justify: ' + plural(shown.length, 'prompt') + ' match',
        sum2: 'Write a claim, the evidence and the reasoning, then tick the rubric points your answer makes and compare two model answers.',
        cta: s.p === 'list' ? 'See the prompts' : 'Start writing',
        href: one ? 'justify.html' + query({ p: one.id }) : s.p === 'list' ? 'justify.html' + query({ list: 1, unit: unit || (topic && A.topicById(topic) ? uOf(A.topicById(topic)) : ''), skill: s.skill }) : 'justify.html' + query({ go: 1, unit: unit, topic: topic, skill: s.skill }),
        off: !shown.length };
    }
  };
  function matchJus(s){
    var unit = s.topic.indexOf('u:') === 0 ? s.topic.slice(2) : '', topic = s.topic.indexOf('t:') === 0 ? s.topic.slice(2) : '';
    return s.data.prompts.filter(function(p){ return (!unit || p.unit === unit) && (!topic || p.topic === topic) && (!s.skill || p.skill === s.skill); });
  }

  /* Cram plan (AP®). */
  M.cram = {
    init: function(s){
      var D = W.LevlExamDate, v = D && D.read ? D.read(C.course) : null;
      s.date = /^\d{4}-\d{2}-\d{2}$/.test(v || '') ? v : '';
      var st = readJson(C.course + '_cram_v1', {}) || {};
      s.weeks = st.weeks === 2 ? 2 : 3; s.print = false;
    },
    html: function(s){
      return grid('<label class="cx-field"><span>Exam date</span><input type="date" data-k="date" value="' + esc(s.date) + '"></label>' +
        chips('weeks', 'Plan length', [[3, '3 weeks'], [2, '2 weeks']], s.weeks) +
        '<div class="cx-group"><span class="pp-lab">Print</span>' + check('print', 'Print the plan when it opens', s.print) + '</div>');
    },
    sum: function(s){
      var nice = '';
      if(s.date){ try{ nice = new Date(s.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' }); }catch(e){} }
      return { sum: 'The ' + s.weeks + '-week plan' + (nice ? ' to ' + nice : ''),
        sum2: (s.weeks === 3 ? '21 days: 14 study days, two practice exams, two rest days.' : '14 days: 8 study days, two practice exams, one rest day.') + ' Weighted by each unit’s share of the exam.',
        cta: 'Open my plan', href: 'cram.html' + query({ date: s.date, weeks: s.weeks, print: s.print }) };
    }
  };

  /* ---------------------------------------------------------------- the panel */
  var S = {}, mode = 'set';
  function state(m){ if(!S[m]){ S[m] = {}; M[m].init(S[m]); } return S[m]; }

  function paintBar(){
    if(mode === 'set' || !M[mode]) return;
    var r = M[mode].sum(state(mode));
    sumEl.textContent = r.sum;
    sum2El.innerHTML = r.sum2 || '';
    sum2El.hidden = !r.sum2;
    goEl.textContent = r.cta;
    goEl.href = r.href;
    if(r.off){ goEl.setAttribute('aria-disabled', 'true'); goEl.classList.add('is-off'); }
    else { goEl.removeAttribute('aria-disabled'); goEl.classList.remove('is-off'); }
  }
  function render(focusSel){
    if(mode === 'set' || !M[mode]) return;
    setEl.innerHTML = M[mode].html(state(mode));
    paintBar();
    if(focusSel){ var f = setEl.querySelector(focusSel); if(f) f.focus(); }
  }
  function pick(m, keepHash){
    if(!HAS[m] || (m !== 'set' && !M[m])) m = 'set';
    mode = m;
    tiles.forEach(function(t){ t.setAttribute('aria-pressed', t.getAttribute('data-mode') === m ? 'true' : 'false'); });
    root.setAttribute('data-mode', m);
    root.classList.toggle('is-run', set && running());
    var set = m === 'set';
    if(engine) engine.classList.toggle('pp-off', !set);
    setEl.hidden = set;
    bar.hidden = set;
    if(!set) render();
    if(!keepHash){ try{ history.replaceState(null, '', location.pathname + location.search + (set ? '' : '#' + m)); }catch(e){} }
  }

  tiles.forEach(function(t){
    t.setAttribute('role', 'button');
    t.addEventListener('click', function(e){
      if(e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) return;
      e.preventDefault();
      pick(t.getAttribute('data-mode'));
    });
    t.addEventListener('keydown', function(e){ if(e.key === ' '){ e.preventDefault(); t.click(); } });
  });

  setEl.addEventListener('change', function(e){
    var el = e.target, k = el.getAttribute('data-k');
    if(!k || !M[mode]) return;
    var s = state(mode), v;
    if(el.type === 'checkbox' && el.name){
      v = [].map.call(setEl.querySelectorAll('input[name="' + el.name + '"]:checked'), function(x){ return x.value; });
      if(!v.length){ el.checked = true; return; }   // at least one card type
    } else if(el.type === 'checkbox') v = el.checked;
    else v = /^\d+$/.test(el.value) && k !== 'q' && k !== 'p' ? +el.value : el.value;
    s[k] = v;
    var sel = '[data-k="' + k + '"]' + (el.type === 'radio' || (el.type === 'checkbox' && el.name) ? '[value="' + el.value + '"]' : '');
    render(sel);
  });
  goEl.addEventListener('click', function(e){ if(goEl.getAttribute('aria-disabled') === 'true') e.preventDefault(); });

  /* A Practice set runs in the engine's own views: while a session or its results are up, the panel
     steps back (no tiles, no headings) and gives the engine the page. */
  function running(){
    if(!engine) return false;
    if(engine.hidden) return true;
    var v = engine.getAttribute('data-view');
    return !!v && v !== 'setup';
  }
  function watch(){
    var run = running();
    /* Only a Practice set runs here; a mode picked by hash keeps its settings while the engine loads. */
    root.classList.toggle('is-run', run && mode === 'set');
  }
  if(engine){
    engine.setAttribute('data-pp-engine', '');
    new MutationObserver(watch).observe(engine, { attributes: true, attributeFilter: ['data-view', 'hidden'] });
  }

  /* The free daily limit, once, in the band: dark text on the pale yellow box. */
  function paintFree(){
    var box = doc.getElementById('ppFree'), P = W.LevlPremium, q = null;
    if(!box) return;
    try{ q = P && P.quota ? P.quota(C.course) : null; }catch(e){}
    if(!q || !isFinite(q.limit)){ box.hidden = true; box.innerHTML = ''; return; }
    box.setAttribute('role', 'status');
    box.innerHTML = '<span class="pp-free-t">' + (q.left > 0 ? q.left + ' of ' + q.limit + ' free today' : 'Today&rsquo;s ' + q.limit + ' free questions are used') + '</span>' +
      '<span class="pp-free-bar" aria-hidden="true"><i style="width:' + Math.round(q.left / q.limit * 100) + '%"></i></span>' +
      '<a class="pp-free-a" href="../premium.html">Get unlimited</a>' +
      '<span class="pp-free-n">' + (q.left > 0 ? 'Shared by Practice and Review.' : 'They come back at midnight.') + (C.note ? ' ' + esc(C.note) : '') + '</span>';
    box.hidden = false;
  }

  function paintLive(){
    var due = A.due(), el = root.querySelector('[data-live="review"]');
    if(el) el.textContent = due ? plural(due, A.noun) + ' due now' : 'Nothing due now';
    var fc = flashCounts(), f = root.querySelector('[data-live="flash"]');
    if(f && fc) f.textContent = fc.fresh + ' new today' + (fc.due ? ', ' + fc.due + ' due' : '');
    var sub = doc.getElementById('ppSub'), n = A.qcount();
    if(sub && n) sub.textContent = fmt(n) + ' questions · every option explained';
    if(mode !== 'set') paintBar();
  }

  function boot(){
    var h = (location.hash || '').slice(1);
    pick(HAS[h] && M[h] ? h : 'set', true);
    paintFree();
    paintLive();
    if(W.LevlPremium && W.LevlPremium.onChange) W.LevlPremium.onChange(paintFree);
    A.ready.then(function(){ paintLive(); if(mode !== 'set') render(); });
    W.addEventListener('storage', function(){ paintFree(); paintLive(); });
    W.addEventListener('hashchange', function(){ var m = (location.hash || '').slice(1); if(HAS[m] && M[m] && m !== mode) pick(m, true); });
    doc.addEventListener('visibilitychange', function(){ if(!doc.hidden){ paintFree(); paintLive(); } });
    /* The free count changes as questions are answered on this page. */
    if(engine) new MutationObserver(function(){ paintFree(); }).observe(engine, { childList: true });
    if(HAS.frq){
      var idle = W.requestIdleCallback || function(f){ return setTimeout(f, 1200); };
      idle(function(){ frqIndex().then(function(list){ var el = root.querySelector('[data-live="frq"]'); if(el && list && list.length) el.textContent = plural(list.length, 'question') + ', with rubrics'; }, function(){}); });
    }
    watch();
  }
  if(doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', boot); else boot();
})();
