/* The Practice panel, version 3 (docs/course-redesign-r4.md decision 5, Practice v3, owner approved
   2026-11-06; mockup docs/redesign-r4/mockups/PracticeV3.dc.txt). One card:
     1 · What do you want to do?   a tile per mode the course has (Practice set, Review with the live due
                                   count, Flashcards with the live new count, Exam, the NREMT adaptive exam and
                                   scenarios, Free response, Justify, Cram plan)
     2 · Set it up                 every setting of the chosen mode at once, in one 3-column grid. Unit, Topic
                                   and How many keep the same cell in every mode (cells 2, 3 and 4). A setting
                                   an engine cannot honour for this course stays in place, disabled, with the
                                   reason under its label.
     the navy bar                  the exact choice in words and one Start whose label fits the mode; sticky to
                                   the bottom of the viewport while the card is on screen.
   The last mode and each mode's settings are kept on this device (localStorage levl_practice_v3_<course>).

   Start runs the mode's existing engine with the settings in the URL and go=1 (the v2 contract, kept):
     set     practice.html?go=1&from=&units=&topic=&practice=|core=&type=&diff=&level=&n=&timer=&expl= (AP® and
             A&P: run here through window.<Glob>PracticeHook; ochem: from=&chapters=&topic=&tier=&type=&n=;
             NREMT: from=&area=&diff=&n=)
     rev     AP® and A&P: practice.html?go=1&from=due&units=&topic=&n=; ochem review.html?go=1&chapter=&n=;
             NREMT review.html?go=1&domain=&n=
     fc      flashcards.html?go=1&deck=&kinds=&new= (ochem chapter=&scope=&types=; NREMT domain=&scope=&types=)
     exam    exams.html?go=1&... (each course's own contract, docs/course-redesign-r4.md decision 5)
     frq     frq.html?go=1&type=&unit= or frq/<id>.html      jus  justify.html?go=1&unit=&topic=&skill= or ?p=
     cram    cram.html?date=&weeks=(&print=1)                cat  exams.html?go=1&exam=cat    scen scenario-sim.html
   The timer for a question set is this file's (a clock over the running session that ends it when time is
   up); explanations at the end are the engine's (pp-defer hides feedback until the summary).
   Config: <script type="application/json" id="ppConfig"> (scripts/lib/practice-panel.mjs panelConfig). */
(function(){
  var cfgEl = document.getElementById('ppConfig'), root = document.getElementById('pp');
  if(!cfgEl || !root) return;
  var C;
  try{ C = JSON.parse(cfgEl.textContent); }catch(e){ return; }
  var W = window, doc = document, fam = C.family;
  var shareEl = doc.getElementById('ppShare'), setEl = doc.getElementById('ppSet'), sumT = doc.getElementById('ppSumT'), sumB = doc.getElementById('ppSumB'), goEl = doc.getElementById('ppGo');
  var wrap = root.parentNode, engine = doc.querySelector(C.engine);
  var URLP = new URLSearchParams(location.search), GO = URLP.get('go') === '1';
  var STORE = 'levl_practice_v3_' + C.course;

  function esc(s){ return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function plural(n, w, ws){ return n + ' ' + (n === 1 ? w : (ws || w + 's')); }
  function fmt(n){ return Number(n || 0).toLocaleString('en-US'); }
  function readJson(k, d){ try{ var v = JSON.parse(localStorage.getItem(k) || 'null'); return v == null ? d : v; }catch(e){ return d; } }
  function query(o){
    var p = new URLSearchParams();
    Object.keys(o).forEach(function(k){ var v = o[k]; if(v !== '' && v != null && v !== false) p.set(k, v === true ? '1' : String(v)); });
    var s = p.toString();
    return s ? '?' + s : '';
  }
  function loadScript(src){ return new Promise(function(res, rej){ var s = doc.createElement('script'); s.src = src; s.onload = res; s.onerror = rej; doc.head.appendChild(s); }); }
  function getJson(url){ return fetch(url).then(function(r){ if(!r.ok) throw new Error(r.status); return r.json(); }); }
  function has(list, v){ return list.indexOf(v) > -1; }
  function strip(h){ return String(h || '').replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&reg;/g, '®'); }
  function dayKey(ms){ var d = new Date(ms); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function cap1(t){ return t ? t.charAt(0).toUpperCase() + t.slice(1) : t; }

  /* ---------------------------------------------------------------- the course's data */
  var A = { ready: Promise.resolve() };
  var AP = fam === 'ap', ANP = fam === 'anp', BANK = AP || ANP;
  var CUR = {}, Core = null, META = (C.glob && W[C.glob + 'PracticeMeta']) || {};
  var UW = C.unitWord === 'Units' ? 'unit' : C.unitWord === 'Domains' ? 'domain' : 'chapter';
  if(BANK){
    CUR = W[C.glob + 'Curriculum'] || {}; Core = W[C.glob + 'Core'];
    var UNITS = (ANP ? CUR.chapters : CUR.units) || [], TOPICS = CUR.topics || [];
    var uOf = function(t){ return ANP ? t.chapter : t.unit; };
    A.units = function(){ var h = {}; TOPICS.forEach(function(t){ if(t.built && t.qn) h[uOf(t)] = 1; }); return UNITS.filter(function(u){ return h[u.id]; }).map(function(u){
      return { id: u.id, chip: ANP ? String(u.n) : (u.part === 'course' ? String(u.n) : u.title), name: ANP ? u.n + '. ' + u.title : (u.part === 'course' ? 'Unit ' + u.n + ': ' : '') + u.title, short: ANP ? 'Chapter ' + u.n : (u.part === 'course' ? 'Unit ' + u.n : u.title), course: !ANP && u.part === 'course' };
    }); };
    A.allUnits = function(){ return UNITS.map(function(u){ return { id: u.id, name: ANP ? u.n + '. ' + u.title : (u.part === 'course' ? 'Unit ' + u.n + ': ' : '') + u.title, short: ANP ? 'Chapter ' + u.n : (u.part === 'course' ? 'Unit ' + u.n : u.title) }; }); };
    A.topics = function(uids, all){ return TOPICS.filter(function(t){ return t.built && (all || t.qn) && (!uids.length || has(uids, uOf(t))); }).map(function(t){ return { id: t.id, unit: uOf(t), name: (t.ced ? t.ced + ' ' : (ANP && t.n ? t.n + '. ' : '')) + t.title, title: t.title }; }); };
    A.practices = function(){ return ANP ? (CUR.core || []).map(function(c){ return { id: c.id, name: c.name }; }) : (CUR.practices || []).map(function(p){ return { id: String(p.id), name: p.id + '. ' + p.name }; }); };
    A.qcount = function(){ return TOPICS.reduce(function(n, t){ return n + (t.built ? (t.qn || 0) : 0); }, 0); };
    A.due = function(){ try{ return Core && Core.reviewCount ? Core.reviewCount() : 0; }catch(e){ return 0; } };
    A.missed = function(){ try{ return Core && Core.missed ? Core.missed().length : 0; }catch(e){ return 0; } };
    A.weak = function(){ try{ return Core && Core.weakest ? Core.weakest(3).filter(function(x){ return x.value < 0.8; }) : []; }catch(e){ return []; } };
    A.studied = function(){
      var d = Core && Core.load ? Core.load() : { q: {}, lessons: {} }, set = {};
      Object.keys(d.lessons || {}).forEach(function(t){ set[t] = 1; });
      Object.keys(d.q || {}).forEach(function(k){ var r = d.q[k]; if(r && r.t) set[r.t] = 1; });
      return TOPICS.filter(function(t){ return t.built && set[t.id]; }).map(function(t){ return t.id; });
    };
  } else if(fam === 'ochem'){
    A.ready = W.OchemPracticeBankReady || Promise.resolve();
    A.units = function(){ return ((W.OchemCurriculum && W.OchemCurriculum.MODULES) || []).map(function(m, i){ return { id: m.id, n: i + 1, chip: String(i + 1), name: (i + 1) + '. ' + m.title, short: 'Chapter ' + (i + 1), topics: m.topics }; }); };
    A.topics = function(uids){ var out = []; A.units().forEach(function(u){ if(!uids.length || has(uids, u.id)) (u.topics || []).forEach(function(t){ out.push({ id: t.id, unit: u.id, name: t.title, title: t.title }); }); }); return out; };
    A.qcount = function(){ try{ return W.OchemQuestionEngine.stats().total; }catch(e){ return 0; } };
    A.due = function(){ try{ return W.OchemQuestionEngine.reviewQueue().dueTotal; }catch(e){ return 0; } };
    A.missed = function(){ try{ return W.OchemMastery.mistakes({ limit: 999 }).length; }catch(e){ return 0; } };
    A.weak = function(){ try{ return W.OchemMastery.weakest(6, 2); }catch(e){ return []; } };
    A.studied = function(){ try{ return W.OchemMastery.overall() ? [1] : []; }catch(e){ return []; } };
  } else if(fam === 'nremt'){
    A.ready = new Promise(function(res){ if(W.NremtQueue) return res(); doc.addEventListener('nremt-queue', function(){ res(); }); });
    var RA = C.reviewAreas || { domains: [], systems: [] };
    A.units = function(){
      return RA.domains.map(function(d){ return { id: d, chip: d, name: d, short: d, exam: true }; })
        .concat(RA.systems.map(function(d){ return { id: 'system:' + d, chip: d, name: d, short: d }; }));
    };
    A.topics = function(){ return []; };
    A.qcount = function(){ return W.NremtQueue ? W.NremtQueue.total : 0; };
    A.due = function(){ try{ return W.NremtQueue ? W.NremtQueue.due() : 0; }catch(e){ return 0; } };
    A.missed = function(){ var m = readJson('nremt_exam100_missed', []); return Array.isArray(m) ? m.length : 0; };
    A.weak = function(){ return [1]; };
  }
  /* New flashcards left today: the deck's daily allowance less the cards already introduced today (the
     schedulers' own store, { fresh: { day, n } }). */
  A.newToday = function(){
    var d = readJson(C.store.cards, {}), per = 20;
    if(BANK){ var p = (readJson(C.store.prefs, {}).flashcards || {}).perDay; if(p >= 5 && p <= 50) per = p; }
    var used = d && d.fresh && d.fresh.day === dayKey(Date.now()) ? (d.fresh.n || 0) : 0;
    return Math.max(0, per - used);
  };

  /* Question types, difficulty levels per course. */
  var ANP_TYPES = [['single', 'Single best answer'], ['vignette', 'Clinical vignettes'], ['multi', 'Select all that apply'],
    ['sequence', 'Sequencing and find the error'], ['predict', 'Prediction tables']];
  var ANP_GROUP = { single: 'single', graph: 'single', image: 'single', vignette: 'vignette', multi: 'multi', order: 'sequence', missing: 'sequence', error: 'sequence', predict: 'predict' };
  function qtypes(){
    if(AP) return (META.kinds || [{ id: 'all', name: 'All types' }]).map(function(k){ return [k.id === 'all' ? '' : k.id, k.id === 'all' ? 'All types' : k.name]; });
    if(ANP) return [['', 'All types']].concat(ANP_TYPES);
    if(fam === 'ochem') return [['', 'All types'], ['interactive', 'Interactive only']];
    return [['', 'All types']];
  }
  function diffs(){
    if(AP) return (META.diffs || [{ id: '', name: 'Any' }]).map(function(d){ return [d.id, d.name]; });
    if(ANP) return [['', 'Any'], ['1', 'Easier'], ['2', 'Medium'], ['3', 'Harder']];
    if(fam === 'ochem') return [['', 'Any'], ['1', 'Foundational'], ['2', 'Intermediate'], ['3', 'Advanced'], ['4', 'Challenge']];
    return [['all', 'All levels'], ['easy', 'Easy'], ['medium', 'Medium'], ['hard', 'Hard'], ['expert', 'Expert']];
  }
  var LEVELS = [['', 'Any level'], ['recall', 'Recall'], ['apply', 'Apply'], ['analyze', 'Analyze']];
  var TIMERS = [['off', 'Off'], ['pace', 'Exam pace'], ['x15', 'Time and a half'], ['x2', 'Double time']];
  var TK = { off: 0, pace: 1, x15: 1.5, x2: 2 };
  var TIMINGS = [['std', 'Standard'], ['x15', 'Time and a half'], ['x2', 'Double'], ['off', 'Untimed']];
  var TIMING_TXT = { std: 'standard time', x15: 'time and a half', x2: 'double time', off: 'untimed' };
  var SRC_SET = (function(){
    var o = [['new', 'Any'], ['weak', 'My weakest'], ['missed', 'I missed']];
    if(has(C.from, 'studied')) o.push(['studied', 'Topics I studied']);
    return o;
  })();

  /* Free response and justify lists load only when that mode is chosen. */
  var FRQ = null, JUS = null, frqData = null, jusData = null;
  function loadFrq(){
    if(FRQ) return FRQ;
    var kitP = W[C.kitGlob] ? Promise.resolve() : loadScript(C.kit);
    return (FRQ = Promise.all([getJson('assets/frq/index.json'), kitP]).then(function(r){ frqData = { list: r[0] || [], K: W[C.kitGlob] || {} }; }, function(){ frqData = { list: [], K: {}, failed: true }; }).then(render));
  }
  function loadJus(){
    if(JUS) return JUS;
    return (JUS = getJson('assets/justify.json').then(function(d){ jusData = d; }, function(){ jusData = { failed: true }; }).then(render));
  }

  /* ---------------------------------------------------------------- state */
  var MODES = [].map.call(root.querySelectorAll('.pp-tile'), function(t){ return t.getAttribute('data-mode'); });
  var EK0 = C.examKinds[0][0];
  function defaultsOf(m){
    if(m === 'set') return { from: 'new', units: [], topic: '', practice: '', qt: ANP ? [] : '', diff: fam === 'nremt' ? 'all' : '', level: '',
      n: C.counts.indexOf(10) > -1 ? 10 : C.counts[0], timer: 'off', expl: 'each' };
    if(m === 'rev') return { units: [], topic: '', n: 0 };
    if(m === 'fc') return { src: 'all', units: [], topic: '', nw: BANK ? 20 : 20, kinds: (C.kinds || []).map(function(k){ return k[0]; }) };
    if(m === 'exam') return { ek: AP ? 'full' : EK0, units: [], n: AP ? 20 : ANP ? 20 : fam === 'ochem' ? 20 : 0, timing: 'std', qt: ANP ? [] : '', diff: fam === 'nremt' ? 'all' : '', practice: '', level: '' };
    if(m === 'frq') return { type: '', unit: '', id: '' };
    if(m === 'jus') return { skill: '', unit: '', topic: '', id: '' };
    if(m === 'cram') return { weeks: 3 };
    return {};
  }
  function fresh(){ var s = { m: MODES[0] }; MODES.forEach(function(m){ s[m] = defaultsOf(m); }); return s; }
  var S = fresh();
  (function restore(){
    var saved = readJson(STORE, null);
    if(!saved || typeof saved !== 'object') return;
    if(has(MODES, saved.m)) S.m = saved.m;
    MODES.forEach(function(m){ var o = saved[m]; if(o && typeof o === 'object') Object.keys(S[m]).forEach(function(k){ if(o[k] !== undefined && typeof o[k] === typeof S[m][k] && Array.isArray(o[k]) === Array.isArray(S[m][k])) S[m][k] = o[k]; }); });
  })();
  function save(){ try{ localStorage.setItem(STORE, JSON.stringify(S)); }catch(e){} }
  function readDate(){ var D = W.LevlExamDate, v = D && D.read ? D.read(C.course) : null; return /^\d{4}-\d{2}-\d{2}$/.test(v || '') ? v : ''; }

  /* The settings in the address: the panel's own go=1 links and the old deep links other pages still make
     (practice.html?unit=, ?topic=, ?chapter=, ?core=, ?mode=missed|weak). They choose Practice set (or Review
     for from=due) and win over the remembered settings. */
  function parseSet(p, base){
    var s = JSON.parse(JSON.stringify(base));
    var units = (p.get('units') || p.get('chapters') || p.get('unit') || p.get('chapter') || p.get('area') || p.get('domain') || '').split(',').filter(Boolean);
    var known = A.units ? A.units().map(function(u){ return u.id; }) : [];
    if(units.length) s.units = units.filter(function(u){ return has(known, u); });
    if(p.get('topic')){ s.topic = p.get('topic'); var t = A.topics([]).filter(function(x){ return x.id === s.topic; })[0]; if(t && !s.units.length) s.units = [t.unit]; if(!t) s.topic = ''; }
    if(p.get('practice') || p.get('core')) s.practice = p.get('practice') || p.get('core');
    var from = p.get('from') || ({ missed: 'missed', weak: 'weak', studied: 'studied', mistakes: 'missed', cumulative: 'studied' })[p.get('mode')] || '';
    if(has(C.from, from)) s.from = from;
    var ty = p.get('type') || '';
    if(ANP) s.qt = ty ? ty.split(',').filter(function(x){ return ANP_TYPES.some(function(y){ return y[0] === x; }); }) : [];
    else if(qtypes().some(function(x){ return x[0] === ty && ty; })) s.qt = ty;
    var df = p.get('diff') || p.get('tier') || '';
    if(diffs().some(function(x){ return x[0] === df; })) s.diff = df;
    if(LEVELS.some(function(x){ return x[0] === p.get('level'); })) s.level = p.get('level');
    var n = p.get('n') || p.get('count');
    if(n !== null && /^\d+$/.test(n)) s.n = +n;
    if(TK[p.get('timer')] !== undefined) s.timer = p.get('timer');
    s.expl = p.get('expl') === 'end' ? 'end' : 'each';
    return s;
  }
  var DEEP = ['units', 'chapters', 'unit', 'chapter', 'area', 'topic', 'practice', 'core', 'from', 'mode', 'type', 'diff', 'tier', 'level', 'n', 'count', 'timer', 'expl'];
  function fromUrl(p){
    if(!DEEP.some(function(k){ return p.get(k) !== null; })) return;
    var s = parseSet(p, defaultsOf('set'));
    if(s.from === 'due'){ S.m = 'rev'; S.rev = { units: s.units, topic: s.topic, n: s.n || 0 }; }
    else { if(!has(C.counts, s.n)) s.n = defaultsOf('set').n; S.m = 'set'; S.set = s; }
  }

  /* ---------------------------------------------------------------- rules per mode */
  /* The reason a cell is disabled for the mode's current settings, or ''. */
  function why(m, cell){
    var s = S[m];
    if(m === 'set'){
      if(cell === 'expl' && !BANK) return 'This course explains each answer as you go';
      if(fam === 'nremt'){
        if(cell === 'type') return 'Every item type is mixed in';
        if(cell === 'topic') return 'NREMT practice goes by domain';
        if((cell === 'units' || cell === 'diff') && s.from === 'weak') return 'Weak-spot practice picks the domains itself';
        if((cell === 'units' || cell === 'diff' || cell === 'n') && s.from === 'missed') return 'Every missed question comes back until it is right';
      }
      return '';
    }
    if(m === 'rev'){
      if(cell === 'topic' && !BANK) return 'Review serves what is due, by ' + UW;
      return '';
    }
    if(m === 'fc'){
      if((cell === 'units' || cell === 'topic') && BANK && s.src !== 'all') return 'The deck comes from ' + ({ missed: 'the questions you missed', weak: 'your weakest topics', studied: 'the topics you studied' })[s.src];
      if(cell === 'topic' && !BANK) return 'Flashcards go by ' + UW;
      if(cell === 'nw' && !BANK) return 'This deck adds 20 new cards a day';
      return '';
    }
    if(m === 'exam'){
      var ek = s.ek;
      if(AP){
        if(cell === 'units') return ek === 'unit' ? '' : 'Only for a unit test';
        if(cell === 'n') return ek === 'full' ? 'The full exam is fixed' : '';
        if(cell === 'timing') return '';
        return ek === 'full' ? 'A full exam keeps the real exam mix' : '';
      }
      if(ANP){
        var custom = ek === 'custom';
        if(cell === 'units') return ek === 'unit' || ek === 'system' || custom ? '' : ek === 'teas' ? 'TEAS practice follows the TEAS areas' : 'A final covers the whole course';
        if(cell === 'timing') return ek === 'unit' ? 'Unit quizzes are untimed' : '';
        if(cell === 'date') return '';
        return custom ? '' : 'Only for a custom exam';
      }
      if(fam === 'ochem'){
        if(cell === 'units') return ek === 'final' ? 'The final covers every chapter' : '';
        if(cell === 'n') return ek === 'final' ? 'The final is 50 questions' : '';
        return '';
      }
      if(cell === 'units') return 'The exam follows the 2025 domain mix';
      if(cell === 'n') return 'The exam is 100 questions';
      if(cell === 'timing') return 'The exam is 2 hours, like the real one';
      return '';
    }
    if(m === 'frq'){ if(cell === 'id' && frqData && frqData.failed) return 'The list did not load'; return ''; }
    if(m === 'jus'){ if(cell === 'id' && jusData && jusData.failed) return 'The list did not load'; return ''; }
    return '';
  }
  /* How the unit picker works: several, one, or a range (the ochem midterm). */
  function unitsMode(m){
    var s = S[m];
    if(m === 'set') return fam === 'nremt' ? 'single' : 'multi';
    if(m === 'rev') return BANK ? 'multi' : 'single';
    if(m === 'fc') return BANK ? 'multi' : 'single';
    if(m === 'exam') return ANP && s.ek === 'custom' ? 'multi' : fam === 'ochem' && s.ek === 'midterm' ? 'range' : 'single';
    return 'single';
  }
  function setCounts(){ return C.counts; }
  function examCounts(){
    var ek = S.exam.ek;
    if(AP) return ek === 'mixed' ? [10, 20, 40, 60] : [5, 10, 20, 40, 0];
    if(ANP) return [10, 20, 40, 0];
    if(fam === 'ochem') return [10, 20, 30, 40, 60];
    return [100];
  }
  /* Keep each mode's state inside what its rules allow. */
  function settle(){
    if(!has(MODES, S.m)) S.m = MODES[0];
    var st = S.set, ex = S.exam, fc = S.fc;
    if(!SRC_SET.some(function(x){ return x[0] === st.from; })) st.from = 'new';
    if(!has(setCounts(), st.n)) st.n = defaultsOf('set').n;
    if(!TK.hasOwnProperty(st.timer)) st.timer = 'off';
    if(!BANK) st.expl = 'each';
    ['set', 'rev', 'fc', 'exam'].forEach(function(m){
      if(!S[m]) return;
      var known = A.units().map(function(u){ return u.id; });
      if(fam === 'nremt' && m === 'fc') S[m].units = S[m].units.filter(function(u){ return (C.domains || []).some(function(d){ return d[0] === u; }); });
      else S[m].units = S[m].units.filter(function(u){ return has(known, u); });
      var um = unitsMode(m);
      if(um === 'single' && S[m].units.length > 1) S[m].units = S[m].units.slice(0, 1);
      if(S[m].topic !== undefined && S[m].topic && !A.topics(S[m].units).some(function(t){ return t.id === S[m].topic; })) S[m].topic = '';
    });
    if(!C.examKinds.some(function(k){ return k[0] === ex.ek; })) ex.ek = AP ? 'full' : EK0;
    var um = unitsMode('exam');
    if(um === 'single' && !why('exam', 'units') && !ex.units.length && A.units().length){
      var first = A.units().filter(function(u){ return !AP || u.course; })[0];
      if(first) ex.units = [first.id];   // an exam on one unit needs one
    }
    if(um === 'range' && !ex.units.length && A.units().length) ex.units = A.units().slice(0, 4).map(function(u){ return u.id; });
    if(!has(examCounts(), ex.n)) ex.n = examCounts().indexOf(20) > -1 ? 20 : examCounts()[0];
    if(!TIMINGS.some(function(t){ return t[0] === ex.timing; })) ex.timing = 'std';
    if(fc){
      var srcs = fcSources().map(function(x){ return x[0]; });
      if(!has(srcs, fc.src)) fc.src = 'all';
      var kk = (C.kinds || []).map(function(k){ return k[0]; });
      fc.kinds = fc.kinds.filter(function(k){ return has(kk, k); });
      if(!fc.kinds.length) fc.kinds = kk.slice();
      if(!has(fcCounts(), fc.nw)) fc.nw = 20;
    }
    if(S.cram && S.cram.weeks !== 2 && S.cram.weeks !== 3) S.cram.weeks = 3;
    if(S.rev && [0, 10, 20].indexOf(S.rev.n) < 0) S.rev.n = 0;
  }
  function fcSources(){
    if(BANK){ var o = [['all', 'Every card'], ['missed', 'I missed'], ['weak', 'My weakest']]; if(has(C.from, 'studied')) o.push(['studied', 'Topics I studied']); return o; }
    if(fam === 'ochem') return [['all', 'Every card'], ['weak', 'My weakest'], ['studied', 'Topics I studied']];
    return [['all', 'Every card'], ['weak', 'My weakest']];
  }
  function fcCounts(){ return BANK ? [0, 10, 20, 30, 50] : [20]; }

  /* ---------------------------------------------------------------- drawing */
  var ICO = {
    cls: '<path d="M12 3v12"/><path d="M7 8l5-5 5 5"/><path d="M5 14v6h14v-6"/>',
    link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
    print: '<path d="M7 9V3h10v6"/><rect x="4" y="9" width="16" height="8" rx="2"/><path d="M7 14h10v7H7z"/>'
  };
  function ico(d){ return '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + d + '</svg>'; }
  var uid = 0;
  function chip(k, v, label, on, off, title){
    return '<button type="button" class="pp-chip" data-k="' + k + '" data-v="' + esc(v) + '" aria-pressed="' + (on ? 'true' : 'false') + '"' +
      (off ? ' disabled' : '') + (title ? ' title="' + esc(title) + '"' : '') + '>' + label + '</button>';
  }
  function chips(k, list, isOn, off){ return '<div class="pp-chips' + (list.length >= 4 && list.some(function(x){ return strip(x[1]).length > 8; }) ? ' pp-chips-l' : '') + '">' + list.map(function(x){ return chip(k, x[0], esc(x[1]), isOn(x[0]), off); }).join('') + '</div>'; }
  function opt(v, t, cur){ return '<option value="' + esc(v) + '"' + (String(v) === String(cur) ? ' selected' : '') + '>' + esc(t) + '</option>'; }
  function select(k, label, opts, val, off){
    return '<select class="pp-sel" data-k="' + k + '" aria-label="' + esc(label) + '"' + (off ? ' disabled' : '') + '>' +
      opts.map(function(o){ return o.group ? '<optgroup label="' + esc(o.group) + '">' + o.list.map(function(x){ return opt(x.v, x.t, val); }).join('') + '</optgroup>' : opt(o.v, o.t, val); }).join('') + '</select>';
  }
  /* One grid cell: the label, the reason when it is disabled, the control. */
  function cell(id, label, reason, body, note){
    var lid = 'ppL' + (++uid);
    return '<div class="pp-cell' + (reason ? ' is-off' : '') + '" data-cell="' + id + '"><span class="pp-lab" id="' + lid + '">' + label + '</span>' +
      '<div class="pp-ctl" role="group" aria-labelledby="' + lid + '"' + (reason ? ' aria-disabled="true"' : '') + '>' + body + '</div>' +
      ((reason || note) ? '<span class="pp-why">' + esc(reason || note) + '</span>' : '') + '</div>';
  }
  /* The unit picker: one unit (a select), or several (a checkbox list in a drop-down that looks like the select). */
  var openMs = null;
  function unitsText(ids, all){
    if(!ids.length) return all || 'Every ' + UW;
    var us = A.units().filter(function(u){ return has(ids, u.id); });
    if(us.length === 1) return us[0].name;
    if(us.length > 3 || C.unitWord === 'Domains') return plural(us.length, UW);
    return (C.unitWord === 'Units' ? 'Units ' : 'Chapters ') + us.map(function(u){ return u.chip; }).join(', ');
  }
  function unitPicker(m, off, allLabel, noAll){
    var s = S[m], um = unitsMode(m), units = A.units();
    if(um === 'single'){
      var opts = noAll ? [] : [{ v: '', t: allLabel || 'Every ' + UW }];
      if(fam === 'nremt' && units.some(function(u){ return u.exam; })){
        opts.push({ group: 'Exam domains', list: units.filter(function(u){ return u.exam; }).map(function(u){ return { v: u.id, t: u.name }; }) });
        opts.push({ group: 'Topic areas', list: units.filter(function(u){ return !u.exam; }).map(function(u){ return { v: u.id, t: u.name }; }) });
      } else opts = opts.concat(units.map(function(u){ return { v: u.id, t: u.name }; }));
      return select('units', C.unitWord, opts, s.units[0] || '', off);
    }
    var head = um === 'range' ? rangeText(s.units) : unitsText(s.units, allLabel);
    return '<details class="pp-ms" data-ms="' + m + '"' + (openMs === m && !off ? ' open' : '') + (off ? ' aria-disabled="true"' : '') + '><summary class="pp-sel"' + (off ? ' tabindex="-1"' : '') + '>' + esc(head) + '</summary>' +
      '<div class="pp-ms-list">' + (um === 'range' ? '<p class="pp-ms-n">Tick the first and last chapter; the midterm covers every chapter between them.</p>' :
        '<label class="pp-ms-o"><input type="checkbox" data-k="uall"' + (s.units.length ? '' : ' checked') + '> ' + esc(allLabel || 'Every ' + UW) + '</label>') +
      units.map(function(u){ return '<label class="pp-ms-o"><input type="checkbox" data-k="unit" value="' + esc(u.id) + '"' + (has(s.units, u.id) ? ' checked' : '') + '> ' + esc(u.name) + '</label>'; }).join('') +
      '</div></details>';
  }
  function range(ids){
    var sel = A.units().filter(function(u){ return has(ids, u.id); });
    var lo = sel.length ? Math.min.apply(null, sel.map(function(u){ return u.n; })) : 1, hi = sel.length ? Math.max.apply(null, sel.map(function(u){ return u.n; })) : 1;
    return [lo, hi];
  }
  function rangeText(ids){ var r = range(ids); return 'Chapters ' + r[0] + (r[1] > r[0] ? ' to ' + r[1] : ''); }
  function topicPicker(m, off, allTopics){
    var s = S[m], us = s.units;
    var first = us.length ? 'Every topic in ' + (us.length > 1 ? 'these ' + UW + 's' : 'this ' + UW) : 'Every topic';
    return select('topic', 'Topic', [{ v: '', t: first }].concat(A.topics(us, allTopics).map(function(t){ return { v: t.id, t: t.name }; })), s.topic, off);
  }
  /* A list of up to 5 short choices shows as buttons (all visible at once); a longer one stays a drop-down. */
  function pick(k, label, list, val, off){
    if(list.length <= 5 && list.every(function(x){ return String(x[1]).length <= 16; })) return chips(k, list, function(v){ return String(v) === String(val); }, off);
    return select(k, label, list.map(function(x){ return { v: x[0], t: x[1] }; }), val, off);
  }
  /* The settings in two groups, each under a heading (Which questions, How it runs; the names fit the mode). */
  var GROUPS = { set: ['Which questions', 'How it runs', ['n', 'timer', 'expl']], rev: ['Which questions', 'How many', ['n']],
    fc: ['Which cards', 'How many', ['nw']], exam: ['Which exam', 'How it runs', ['timing', 'n', 'date']],
    frq: ['Which question', '', []], jus: ['Which prompt', '', []], cram: ['Your exam', 'The plan', ['weeks', 'print']] };
  function col(m, h){
    var g = GROUPS[m], t = doc.createElement('div'), a = '', b = '';
    t.innerHTML = h;
    [].forEach.call(t.children, function(c){ if(has(g[2], c.getAttribute('data-cell'))) b += c.outerHTML; else a += c.outerHTML; });
    return '<div class="pp-grp"><h3 class="pp-gh">' + g[0] + '</h3>' + a + '</div>' + (b ? '<div class="pp-grp"><h3 class="pp-gh">' + g[1] + '</h3>' + b + '</div>' : '');
  }
  function countChips(k, list, cur, off, allLabel){ return chips(k, list.map(function(n){ return [n, n ? String(n) : (allLabel || 'All')]; }), function(v){ return +v === cur; }, off); }
  function shareRow(m){
    var p = printState(m);
    return '<div class="pp-share" role="group" aria-label="Share or print"><span class="pp-share-l">Share or print this ' + (m === 'exam' ? 'exam' : 'set') + '</span>' +
      '<a class="pp-chip" id="ppClass" href="https://classroom.google.com/" target="_blank" rel="noopener">' + ico(ICO.cls) + ' Google Classroom<span class="sr-only"> (opens in a new tab)</span></a>' +
      '<button type="button" class="pp-chip" id="ppCopy">' + ico(ICO.link) + ' Copy link</button>' +
      '<button type="button" class="pp-chip" id="ppPrint"' + (p.ok ? '' : ' disabled title="' + esc(p.why) + '"') + '>' + ico(ICO.print) + ' Worksheet</button>' +
      '<label class="pp-key"><input type="checkbox" id="ppKey"' + (p.ok ? '' : ' disabled') + (keyOn ? ' checked' : '') + '> Answer key on its own page</label>' +
      '<span class="pp-share-n" id="ppShareN" aria-live="polite">' + (p.ok ? '' : esc(p.why)) + '</span></div>';
  }
  var keyOn = false;
  function printState(m){
    if(!C.print) return { ok: false, why: 'Worksheets are not available for this course yet' };
    if(m === 'exam' && S.exam.ek === 'full') return { ok: false, why: 'The full exam is not printed; a unit test or mixed set is' };
    return { ok: true, why: '' };
  }

  function grid(m){
    var s = S[m], h = '', w;
    if(m === 'set'){
      w = why(m, 'from');
      var mc = A.missed();
      h += cell('from', 'Questions from', w, chips('from', SRC_SET.map(function(x){ return [x[0], x[1] + (x[0] === 'missed' ? ' · ' + fmt(mc) : '')]; }), function(v){ return s.from === v; }, !!w));
      w = why(m, 'units'); h += cell('units', fam === 'nremt' ? 'Domain' : C.unitWord === 'Units' ? 'Unit' : 'Chapter', w, unitPicker(m, !!w));
      w = why(m, 'topic'); h += cell('topic', 'Topic', w, fam === 'nremt' ? select('topic', 'Topic', [{ v: '', t: 'Every topic in the domain' }], '', true) : topicPicker(m, !!w));
      w = why(m, 'n'); h += cell('n', 'How many', w, countChips('n', setCounts(), s.n, !!w));
      w = why(m, 'timer'); h += cell('timer', 'Timer', w, chips('timer', TIMERS, function(v){ return s.timer === v; }, !!w));
      w = why(m, 'expl'); h += cell('expl', 'Explanations', w, chips('expl', [['each', 'After each'], ['end', 'At the end']], function(v){ return s.expl === v; }, !!w));
      if(C.practice){ w = why(m, 'practice'); h += cell('practice', C.practice, w, select('practice', C.practice, [{ v: '', t: 'Every ' + C.practice.toLowerCase() }].concat(A.practices().map(function(p){ return { v: p.id, t: p.name }; })), s.practice, !!w)); }
      w = why(m, 'type');
      h += cell('type', 'Question type', w, ANP ? chips('qt', [['', 'All types']].concat(ANP_TYPES), function(v){ return v === '' ? !s.qt.length : has(s.qt, v); }, !!w)
        : pick('qt', 'Question type', qtypes(), s.qt, !!w));
      w = why(m, 'diff');
      h += cell('diff', 'Difficulty', w, pick('diff', 'Difficulty', diffs(), s.diff, !!w));
      if(ANP) h += cell('level', 'Level', w, pick('level', 'Level', LEVELS, s.level, !!w));
      return col(m, h);
    }
    if(m === 'rev'){
      var due = A.due();
      h += cell('from', 'Questions from', '', '<div class="pp-chips">' + chip('rsrc', 'due', 'Due for review · ' + fmt(due), true, false) + '</div>', 'Each comes back right before you would forget it');
      h += cell('units', C.unitWord === 'Units' ? 'Unit' : C.unitWord === 'Domains' ? 'Domain' : 'Chapter', '', unitPicker(m, false));
      w = why(m, 'topic'); h += cell('topic', 'Topic', w, BANK ? topicPicker(m, !!w) : select('topic', 'Topic', [{ v: '', t: 'Every topic' }], '', true));
      h += cell('n', 'How many', '', chips('n', [[0, 'All ' + fmt(due) + ' due'], [10, '10'], [20, '20']], function(v){ return +v === s.n; }, false));
      return col(m, h);
    }
    if(m === 'fc'){
      h += cell('src', 'Cards from', '', chips('src', fcSources(), function(v){ return s.src === v; }, false));
      w = why(m, 'units');
      if(fam === 'nremt') h += cell('units', 'Deck', w, select('units', 'Deck', [{ v: '', t: 'Every domain' }].concat((C.domains || []).map(function(d){ return { v: d[0], t: d[1] }; })), s.units[0] || '', !!w));
      else h += cell('units', 'Deck', w, unitPicker(m, !!w, 'Every ' + UW));
      w = why(m, 'topic'); h += cell('topic', 'Topic', w, BANK ? topicPicker(m, !!w, true) : select('topic', 'Topic', [{ v: '', t: 'Every topic' }], '', true));
      w = why(m, 'nw'); h += cell('nw', 'New cards today', w, chips('nw', fcCounts().map(function(n){ return [n, n ? String(n) : 'None, due only']; }), function(v){ return +v === s.nw; }, !!w));
      h += cell('kinds', 'Card types', '', chips('kinds', C.kinds || [], function(v){ return has(s.kinds, v); }, false), 'Tick one or more');
      return col(m, h);
    }
    if(m === 'exam'){
      h += cell('ek', 'Kind', '', chips('ek', C.examKinds.map(function(k){ return [k[0], AP ? ({ full: 'Full exam', unit: 'Unit test', mixed: 'Mixed set' })[k[0]] || k[1] : k[1]]; }), function(v){ return s.ek === v; }, false));
      w = why(m, 'units'); h += cell('units', C.unitWord === 'Units' ? 'Unit' : C.unitWord === 'Domains' ? 'Domain' : 'Chapter', w, w && unitsMode(m) === 'single' ? select('units', 'Unit', [{ v: '', t: 'Every ' + UW }], '', true) : unitPicker(m, !!w, ANP ? 'Every chapter' : '', unitsMode(m) === 'single'));
      w = why(m, 'timing'); h += cell('timing', 'Timing', w, chips('timing', TIMINGS, function(v){ return !w && s.timing === v; }, !!w));
      w = why(m, 'n'); h += cell('n', 'How many', w, countChips('n', examCounts(), w && examCounts().length > 1 ? -1 : s.n, !!w));
      if(AP){
        w = why(m, 'type'); h += cell('type', 'Question type', w, pick('qt', 'Question type', qtypes(), s.qt, !!w));
        h += cell('diff', 'Difficulty', w, pick('diff', 'Difficulty', diffs(), s.diff, !!w));
        if(C.practice) h += cell('practice', C.practice, w, select('practice', C.practice, [{ v: '', t: 'Every ' + C.practice.toLowerCase() }].concat(A.practices().map(function(p){ return { v: p.id, t: p.name }; })), s.practice, !!w));
      } else if(ANP){
        w = why(m, 'type');
        h += cell('type', 'Question type', w, chips('qt', [['', 'All types']].concat(ANP_TYPES), function(v){ return v === '' ? !s.qt.length : has(s.qt, v); }, !!w));
        h += cell('diff', 'Difficulty', w, pick('diff', 'Difficulty', diffs(), s.diff, !!w));
        h += cell('level', 'Level', w, pick('level', 'Level', LEVELS, s.level, !!w));
      } else if(fam === 'nremt'){
        h += cell('diff', 'Difficulty', '', pick('diff', 'Difficulty', diffs(), s.diff, false));
      }
      if(!C.cram) h += cell('date', 'Exam date', '', '<input type="date" class="pp-sel" data-k="date" value="' + esc(readDate()) + '" aria-label="Exam date">', 'Optional. Used for your pacing.');
      return col(m, h) +
        '<details class="pp-info"><summary>What&rsquo;s in the full exam</summary><p>' + esc(C.exam || '') + '</p></details>';
    }
    if(m === 'frq'){
      if(!frqData) loadFrq();
      var K = frqData && frqData.K || {}, list = frqData && frqData.list || [];
      var types = K.ORDER ? K.ORDER.filter(function(t){ return list.some(function(f){ return f.type === t; }); }) : [];
      h += cell('type', 'Question type', '', select('type', 'Question type', [{ v: '', t: types.length ? 'All ' + (types.length === 6 ? 'six ' : '') + 'types' : 'All types' }].concat(types.map(function(t){ return { v: t, t: K.TYPES[t] }; })), s.type, !frqData));
      var us = []; list.forEach(function(f){ (f.units || []).forEach(function(u){ if(!has(us, u)) us.push(u); }); });
      var names = A.allUnits ? A.allUnits() : [];
      us.sort(function(a, b){ return names.findIndex(function(x){ return x.id === a; }) - names.findIndex(function(x){ return x.id === b; }); });
      h += cell('unit', 'Unit', '', select('unit', 'Unit', [{ v: '', t: 'Every unit' }].concat(us.map(function(u){ var n = names.filter(function(x){ return x.id === u; })[0]; return { v: u, t: n ? n.name : u }; })), s.unit, !frqData));
      var pool = frqMatches(), sc = K.scores ? safe(K.scores) : {};
      w = why(m, 'id');
      h += cell('id', 'Question', w, select('id', 'Question', [{ v: '', t: frqData ? 'Next unanswered' : 'Loading the questions…' }].concat(pool.map(function(f){ var r = sc[f.id]; return { v: f.id, t: f.title + (r ? ' (best ' + r.best + '/' + r.of + ')' : '') }; })), s.id, !frqData || !!w));
      return col(m, h);
    }
    if(m === 'jus'){
      if(!jusData) loadJus();
      var sk = jusData && jusData.skills || {};
      h += cell('skill', 'Skill', '', select('skill', 'Skill', [{ v: '', t: 'Any' }].concat(Object.keys(sk).map(function(k){ return { v: k, t: sk[k] }; })), s.skill, !jusData));
      var ju = []; ((jusData && jusData.prompts) || []).forEach(function(p){ if(!has(ju, p.unit)) ju.push(p.unit); });
      var jn = A.allUnits ? A.allUnits() : [];
      ju.sort(function(a, b){ return jn.findIndex(function(x){ return x.id === a; }) - jn.findIndex(function(x){ return x.id === b; }); });
      h += cell('unit', 'Unit', '', select('unit', 'Unit', [{ v: '', t: 'Every unit' }].concat(ju.map(function(u){ var n = jn.filter(function(x){ return x.id === u; })[0]; return { v: u, t: n ? n.name : u }; })), s.unit, !jusData));
      var tps = []; ((jusData && jusData.prompts) || []).forEach(function(p){ if((!s.unit || p.unit === s.unit) && !has(tps, p.topic)) tps.push(p.topic); });
      var tn = A.topics([], true);
      h += cell('topic', 'Topic', '', select('topic', 'Topic', [{ v: '', t: 'Every topic' }].concat(tps.map(function(t){ var x = tn.filter(function(y){ return y.id === t; })[0]; return { v: t, t: x ? x.name : t }; })), s.topic, !jusData));
      w = why(m, 'id');
      h += cell('id', 'Prompt', w, select('id', 'Prompt', [{ v: '', t: jusData ? 'Next prompt' : 'Loading the prompts…' }].concat(jusMatches().map(function(p){ return { v: p.id, t: p.title }; })), s.id, !jusData || !!w));
      return col(m, h);
    }
    if(m === 'cram'){
      h += cell('date', 'Exam date', '', '<input type="date" class="pp-sel" data-k="date" value="' + esc(readDate()) + '" aria-label="Exam date">', 'Saved for this course');
      h += cell('weeks', 'Plan length', '', chips('weeks', [[3, '3 weeks'], [2, '2 weeks']], function(v){ return +v === s.weeks; }, false));
      h += cell('print', 'Print', '', '<div class="pp-chips"><a class="pp-chip" id="ppCramPrint" href="' + esc(cramHref(true)) + '">' + ico(ICO.print) + ' Print the plan</a></div>');
      return col(m, h);
    }
    if(m === 'cat') return '<p class="pp-fixed">Nothing to set: the adaptive exam picks each question from your last answer, 70 to 120 questions in 2 hours at most, the way the real CAT does. It is a simulation, not the Registry&rsquo;s algorithm.</p>';
    if(m === 'scen') return '<p class="pp-fixed">You choose the call on the next page: medical or trauma, adult or child. Each call runs from dispatch to handoff, and every decision is explained when it ends.</p>';
    return '';
  }
  function safe(f){ try{ return f() || {}; }catch(e){ return {}; } }
  function frqMatches(){
    var s = S.frq, list = frqData && frqData.list || [];
    return list.filter(function(f){ return (!s.type || f.type === s.type) && (!s.unit || (f.units || []).indexOf(s.unit) > -1); });
  }
  function jusMatches(){
    var s = S.jus, list = jusData && jusData.prompts || [];
    return list.filter(function(p){ return (!s.unit || p.unit === s.unit) && (!s.topic || p.topic === s.topic) && (!s.skill || p.skill === s.skill); });
  }

  function paintTiles(){
    [].forEach.call(root.querySelectorAll('.pp-tile'), function(t){ t.setAttribute('aria-pressed', t.getAttribute('data-mode') === S.m ? 'true' : 'false'); });
    var d = root.querySelector('[data-live="due"]'), n = root.querySelector('[data-live="new"]');
    if(d){ var k = A.due(); d.textContent = k ? fmt(k) + ' due now' : 'Nothing due now'; }
    if(n){ var j = A.newToday(); n.textContent = j ? fmt(j) + ' new today' : 'No new cards left today'; }
  }
  function render(){
    settle();
    uid = 0;
    var focus = doc.activeElement && setEl.contains(doc.activeElement) ? keyOf(doc.activeElement) : null;
    setEl.innerHTML = grid(S.m);
    setEl.setAttribute('data-mode', S.m);
    if(shareEl) shareEl.innerHTML = S.m === 'set' || S.m === 'exam' ? shareRow(S.m) : '';
    if(focus){ var el = setEl.querySelector(focus); if(el && !el.disabled) el.focus(); }
    paintTiles();
    paintSummary();
    save();
  }
  function keyOf(el){
    if(el.id) return '#' + el.id;
    var ms = el.closest('.pp-ms');
    if(ms && el.tagName === 'INPUT') return el.value && el.getAttribute('data-k') === 'unit' ? '.pp-ms input[value="' + el.value.replace(/"/g, '\\"') + '"]' : '.pp-ms input[data-k="uall"]';
    if(ms) return '.pp-ms summary';
    var k = el.getAttribute('data-k'), v = el.getAttribute('data-v');
    return k ? '[data-k="' + k + '"]' + (v !== null ? '[data-v="' + v.replace(/"/g, '\\"') + '"]' : '') : null;
  }

  /* ---------------------------------------------------------------- what Start runs */
  function unitName(id){ var u = A.units().filter(function(x){ return x.id === id; })[0]; return u ? u.name : id; }
  function label(list, v){ var x = list.filter(function(y){ return String(y[0]) === String(v); })[0]; return x ? strip(x[1]) : ''; }
  function where(s){
    if(s.topic){ var t = A.topics(s.units, true).filter(function(x){ return x.id === s.topic; })[0]; if(t) return t.title; }
    return unitsText(s.units);
  }
  function timing(t){ return t === 'pace' ? 'std' : t; }
  function filters(s, prac){
    var bits = [];
    if(ANP ? s.qt.length : s.qt) bits.push(ANP ? s.qt.map(function(t){ return label(ANP_TYPES, t); }).join(', ') : label(qtypes(), s.qt));
    if(s.diff && s.diff !== 'all') bits.push(label(diffs(), s.diff).toLowerCase());
    if(ANP && s.level) bits.push(label(LEVELS, s.level).toLowerCase());
    if(prac && C.practice && s.practice) bits.push(strip((A.practices().filter(function(p){ return p.id === s.practice; })[0] || {}).name || ''));
    return bits;
  }
  var TLINE = { off: 'no timer', pace: 'exam pace', x15: 'time and a half', x2: 'double time' };
  var SRC_T = { new: '', weak: ' from your weakest topics', missed: ' you missed', studied: ' from topics you studied' };

  /* { title, line, cta, href, off } in the mockup's wording (renderVals()). */
  function plan(){
    var m = S.m, s = S[m];
    if(m === 'set'){
      var n = s.n, cap = s.from === 'missed' && BANK ? A.missed() : 0, k = cap && (!n || n > cap) ? cap : n, href;
      if(BANK) href = 'practice.html' + query({ go: 1, from: s.from, units: s.units.join(','), topic: s.topic, practice: AP ? s.practice : '', core: ANP ? s.practice : '',
        type: ANP ? s.qt.join(',') : s.qt, diff: s.diff, level: ANP ? s.level : '', n: n, timer: s.timer !== 'off' ? s.timer : '', expl: s.expl === 'end' ? 'end' : '' });
      else if(fam === 'ochem') href = 'practice.html' + query({ go: 1, from: s.from, chapters: s.units.join(','), topic: s.topic, tier: s.diff, type: s.qt, n: n, timer: s.timer !== 'off' ? s.timer : '' });
      else href = 'practice.html' + query({ go: 1, from: s.from, area: s.from === 'new' ? s.units[0] || '' : '', diff: s.from === 'new' && s.diff !== 'all' ? s.diff : '', n: s.from === 'missed' ? '' : n, timer: s.timer !== 'off' ? s.timer : '' });
      var empty = s.from === 'missed' && !A.missed() ? 'Nothing missed yet. Pick Any to start.' :
        s.from === 'weak' && BANK && !A.weak().length ? 'Answer some questions first, then your weakest topics show here.' : s.from === 'studied' && !A.studied().length ? 'Study a topic first.' : '';
      var nremtMiss = fam === 'nremt' && s.from === 'missed';
      var title = (nremtMiss ? 'Every question' : (k ? k : 'All') + ' questions') + SRC_T[s.from];
      var ln = [why('set', 'units') ? (s.from === 'weak' ? 'Domains picked for you' : 'Every domain') : cap1(where(s))].concat(filters(s, true));
      ln.push(TLINE[s.timer]);
      if(BANK) ln.push('explanations ' + (s.expl === 'end' ? 'at the end' : 'after each answer'));
      return { title: title, line: empty || ln.join(' · '), cta: 'Start practice', href: href, off: !!empty };
    }
    if(m === 'rev'){
      var due = A.due(), href2;
      if(BANK) href2 = 'practice.html' + query({ go: 1, from: 'due', units: s.units.join(','), topic: s.topic, n: s.n });
      else href2 = 'review.html' + query(fam === 'ochem' ? { go: 1, chapter: s.units[0] || '', n: s.n || '' } : { go: 1, domain: s.units[0] || '', n: s.n || '' });
      var t2 = s.n ? s.n + ' review questions' : 'All ' + fmt(due) + ' due questions';
      var scope = s.units.length || s.topic ? 'From ' + where(s) + '. ' : '';
      return { title: due ? t2 : 'Nothing is due right now', line: due ? scope + 'Each comes back right before you would forget it.' : 'Questions you answer come back here when they are due.', cta: 'Start review', href: href2, off: !due };
    }
    if(m === 'fc'){
      var kinds = s.kinds.length === (C.kinds || []).length ? 'Every card type' : s.kinds.map(function(x){ return label(C.kinds, x); }).join(', ');
      var t3 = !BANK ? 'Up to ' + A.newToday() + ' new cards, plus any due' : s.nw ? s.nw + ' new cards, plus any due' : 'Due cards only';
      var deckT = s.src !== 'all' && BANK ? ({ missed: 'Terms from questions you missed', weak: 'Your weakest topics', studied: 'Topics you studied' })[s.src] :
        (fam === 'nremt' ? (s.units[0] ? label(C.domains, s.units[0]) : 'Every domain') : cap1(where(s))) + (s.src === 'weak' ? ', weakest cards' : s.src === 'studied' ? ', topics you studied' : '');
      var hr;
      if(BANK){
        var deck, uk = ANP ? 'chapter:' : 'unit:';
        if(s.src === 'missed') deck = 'missed';
        else if(s.src === 'weak') deck = A.weak().map(function(x){ return 'topic:' + x.id; }).join(',') || 'all';
        else if(s.src === 'studied') deck = A.studied().map(function(x){ return 'topic:' + x; }).join(',') || 'all';
        else if(s.topic) deck = 'topic:' + s.topic;
        else if(s.units.length) deck = s.units.map(function(u){ return uk + u; }).join(',');
        else deck = 'all';
        hr = 'flashcards.html' + query({ go: 1, deck: deck, kinds: s.kinds.join(','), 'new': s.nw });
      } else if(fam === 'ochem') hr = 'flashcards.html' + query({ go: 1, chapter: s.units[0] || 'all', scope: s.src, types: s.kinds.join(',') });
      else hr = 'flashcards.html' + query({ go: 1, domain: s.units[0] || 'all', scope: s.src, types: s.kinds.join(',') });
      return { title: t3, line: deckT + ' · ' + kinds + ' · grade yourself as you go', cta: 'Study cards', href: hr };
    }
    if(m === 'exam'){
      var ek = s.ek, tm = TIMING_TXT[s.timing], ff = filters(s, AP);
      if(AP){
        var tt = ek === 'full' ? 'Full practice exam' : ek === 'unit' ? unitName(s.units[0]).replace(/:.*/, '') + ' test' : 'Mixed timed set';
        var ln2 = ek === 'full' ? C.exam : ek === 'unit' ? (s.n ? plural(s.n, 'question') : 'Every question') + ' from ' + unitName(s.units[0]) : plural(s.n, 'question') + ' from every unit';
        return { title: tt, line: [ln2].concat(ek === 'full' ? [] : ff).concat([tm]).join(' · '), cta: 'Start the exam',
          href: 'exams.html' + query({ go: 1, mode: ek, unit: ek === 'unit' ? s.units[0] : '', len: ek === 'unit' ? s.n : '', n: ek === 'mixed' ? s.n : '', timing: timing(s.timing),
            type: ek !== 'full' ? s.qt : '', diff: ek !== 'full' ? s.diff : '', practice: ek !== 'full' ? s.practice : '' }) };
      }
      if(ANP){
        var names = { unit: 'Unit quiz', system: 'System exam', finalI: 'Cumulative final, A&P I', finalII: 'Cumulative final, A&P II', custom: 'Custom exam', teas: 'TEAS A&P practice' };
        var custom = ek === 'custom', mode = ek === 'finalI' || ek === 'finalII' ? 'final' : ek;
        var ln3 = ek === 'unit' || ek === 'system' ? unitName(s.units[0]) : custom ? (s.n ? plural(s.n, 'question') : 'Every matching question') + ' from ' + unitsText(s.units, 'every chapter') : ek === 'teas' ? 'The TEAS 7 A&P areas, at TEAS pace' : 'Every chapter of the course, weighted by topic';
        return { title: names[ek], line: [ln3].concat(custom ? filters(s) : []).concat(ek === 'unit' ? [] : [tm]).join(' · '), cta: 'Start the exam',
          href: 'exams.html' + query({ go: 1, mode: mode, chapter: ek === 'unit' || ek === 'system' ? s.units[0] : '', course: mode === 'final' ? (ek === 'finalI' ? 'I' : 'II') : '',
            chapters: custom ? s.units.join(',') : '', types: custom ? s.qt.join(',') : '', levels: custom ? s.level : '', diffs: custom ? s.diff : '', len: custom ? String(s.n) : '', timing: ek === 'unit' ? '' : timing(s.timing) }) };
      }
      if(fam === 'ochem'){
        var r = range(s.units);
        var t4 = ek === 'chapter' ? 'Chapter test: ' + unitName(s.units[0]) : ek === 'midterm' ? 'Midterm: chapters ' + r[0] + (r[1] > r[0] ? ' to ' + r[1] : '') : 'Cumulative final';
        return { title: t4, line: (ek === 'final' ? '50 questions from every chapter' : plural(s.n, 'question') + ' from ' + (ek === 'midterm' ? 'chapters ' + r[0] + ' to ' + r[1] : unitName(s.units[0]))) + ' · ' + tm, cta: 'Start the exam',
          href: 'exams.html' + query({ go: 1, kind: ek, chapter: ek === 'chapter' ? s.units[0] : '', len: ek === 'final' ? '' : s.n, from: ek === 'midterm' ? r[0] : '', to: ek === 'midterm' ? r[1] : '', timing: timing(s.timing) }) };
      }
      return { title: 'Timed exam: 100 questions', line: 'The 2025 domain mix, 2 hours' + (s.diff !== 'all' ? ', ' + label(diffs(), s.diff).toLowerCase() + ' only' : '') + ' · ' + (ek === 'real' ? 'exam-realistic: no flagging, no going back' : 'no feedback until you submit'),
        cta: 'Start the exam', href: 'exams.html' + query({ go: 1, exam: 'full', diff: s.diff !== 'all' ? s.diff : '', real: ek === 'real' }) };
    }
    if(m === 'frq'){
      var pool = frqMatches(), one = s.id && pool.filter(function(f){ return f.id === s.id; })[0];
      var none = frqData && !frqData.failed && !pool.length;
      var K = frqData && frqData.K || {};
      var bits = [s.type && K.TYPES ? K.TYPES[s.type] : '', s.unit ? (A.allUnits().filter(function(x){ return x.id === s.unit; })[0] || {}).short || s.unit : ''].filter(Boolean);
      return { title: one ? one.title : none ? 'No question matches yet' : 'Next unanswered question', line: (bits.length ? bits.join(' · ') + ' · ' : '') + 'Write each part, then score it with the rubric.', cta: 'Start writing',
        href: one ? 'frq/' + one.id + '.html' : 'frq.html' + query({ go: 1, type: s.type, unit: s.unit }), off: !!none };
    }
    if(m === 'jus'){
      var ps = jusMatches(), p1 = s.id && ps.filter(function(p){ return p.id === s.id; })[0], none2 = jusData && !jusData.failed && !ps.length;
      return { title: p1 ? p1.title : none2 ? 'No prompt matches yet' : 'Next prompt', line: 'Write your answer, then compare it with a model answer.', cta: 'Start a prompt',
        href: p1 ? 'justify.html?p=' + encodeURIComponent(p1.id) : 'justify.html' + query({ go: 1, unit: s.unit, topic: s.topic, skill: s.skill }), off: !!none2 };
    }
    if(m === 'cram'){
      var dt = readDate(), dd = dt ? new Date(dt + 'T12:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '';
      return { title: s.weeks + ' week plan' + (dd ? ' to ' + dd : ''), line: dt ? 'A day by day plan; Premium fits it to your weakest units.' : 'Set your exam date and the plan counts back from it.', cta: 'Make my plan', href: cramHref(false) };
    }
    if(m === 'cat') return { title: 'Adaptive exam', line: '70 to 120 questions, 2 hours at most · a simulation, not the Registry’s algorithm', cta: 'Start adaptive exam', href: 'exams.html' + query({ go: 1, exam: 'cat' }) };
    return { title: 'Scenarios', line: 'One call, from dispatch to handoff · every decision explained when the call ends', cta: 'Choose a call', href: 'scenario-sim.html' };
  }
  function cramHref(print){ return 'cram.html' + query({ date: readDate(), weeks: S.cram ? S.cram.weeks : 3, print: print }); }

  var current = null;
  function paintSummary(){
    var r = current = plan();
    sumT.textContent = r.title;
    sumB.textContent = r.line;
    goEl.textContent = r.cta;
    goEl.href = r.href;
    if(r.off){ goEl.setAttribute('aria-disabled', 'true'); goEl.classList.add('is-off'); } else { goEl.removeAttribute('aria-disabled'); goEl.classList.remove('is-off'); }
    var cls = doc.getElementById('ppClass');
    if(cls) cls.href = 'https://classroom.google.com/share?url=' + encodeURIComponent(absUrl(r.href)) + '&title=' + encodeURIComponent(r.title + ': ' + strip(doc.querySelector('.band .issue') ? doc.querySelector('.band .issue').textContent : '').trim());
  }
  function absUrl(h){ try{ return new URL(h, location.href).href; }catch(e){ return h; } }

  /* ---------------------------------------------------------------- AP® and A&P: the question set */
  var hookP = null;
  function hook(){
    return hookP || (hookP = new Promise(function(res){
      var name = C.glob + 'PracticeHook';
      if(W[name]) return res(W[name]);
      doc.addEventListener('levl-practice-ready', function(){ res(W[name]); });
    }));
  }
  /* The set the settings describe, as a filter over the engine's index stubs. s has the set's shape. */
  function runOpts(s, H, label){
    var ids = null, order = null, weakT = null, studied = null, mode = 'build';
    if(s.from === 'due'){ var q = Core.reviewQueue(), rank = {}; q.forEach(function(id, i){ rank[id] = i; }); ids = rank; order = function(steps){ return steps.slice().sort(function(a, b){ return first(a) - first(b); }); function first(b){ return Math.min.apply(null, b.items.map(function(x){ return x.id in rank ? rank[x.id] : 1e9; })); } }; }
    else if(s.from === 'missed'){ ids = {}; Core.missed().forEach(function(id){ ids[id] = 1; }); mode = 'missed'; }
    else if(s.from === 'weak'){ weakT = {}; A.weak().forEach(function(x){ weakT[x.id] = 1; }); if(ANP && Core.weakestCore) Core.weakestCore(2).filter(function(x){ return x.value < 0.8; }).forEach(function(x){ weakT['core:' + x.id] = 1; }); }
    else if(s.from === 'studied'){ studied = {}; A.studied().forEach(function(t){ studied[t] = 1; }); }
    var units = s.units, topic = s.topic, prac = s.practice;
    var pick = function(x){
      if(ids && !(x.id in ids)) return false;
      if(weakT && !weakT[x.topic] && !(x.core || []).some(function(c){ return weakT['core:' + c]; })) return false;
      if(studied && !studied[x.topic]) return false;
      if(units.length && !has(units, ANP ? x.chapter : x.unit)) return false;
      if(topic && x.topic !== topic) return false;
      if(AP){
        if(!H.matches(x, { unit: '', topic: '', practice: prac, kind: s.qt || 'all', diff: s.diff })) return false;
      } else {
        if(prac && (x.core || []).indexOf(prac) < 0) return false;
        if(s.qt.length && !has(s.qt, ANP_GROUP[x.type] || 'single')) return false;
        if(s.diff && String(x.diff) !== s.diff) return false;
        if(s.level && x.level !== s.level) return false;
      }
      return true;
    };
    return { pick: pick, count: s.n, mode: mode, order: order, label: label, defer: s.expl === 'end' };
  }
  /* go=1 on practice.html: run it as soon as the engine has its index. */
  function goRun(){
    wrap.classList.add('is-go');
    var s = parseSet(URLP, defaultsOf('set'));
    if(URLP.get('from') === 'due') s.from = 'due';
    hook().then(function(H){
      var ok = H.run(runOpts(s, H, current ? current.title + ' · ' + current.line : 'Practice'));
      if(!ok){ wrap.classList.remove('is-go'); H.setup(); clean(); note('No questions match those settings yet. Loosen one of them.'); }
      else startClock();
    });
  }
  function clean(){ try{ history.replaceState(null, '', location.pathname); }catch(e){} }
  function note(t){ clearAlert(); var n = doc.createElement('p'); n.className = 'pp-alert'; n.setAttribute('role', 'status'); n.textContent = t; setEl.parentNode.insertBefore(n, setEl); }
  function clearAlert(){ var a = root.querySelector('.pp-alert'); if(a) a.remove(); }

  /* ---------------------------------------------------------------- the clock over a question set */
  var clock = null;
  function running(){
    if(!engine) return false;
    if(fam === 'nremt'){ var intro = doc.getElementById('introScreen'); return !!intro && intro.style.display === 'none'; }
    if(fam === 'ochem') return engine.hidden;
    var v = engine.getAttribute('data-view');
    return v === 'session' || v === 'summary';
  }
  function inSession(){
    if(fam === 'nremt'){ var qs = doc.getElementById('quizScreen'); return running() && !!qs && qs.style.display !== 'none'; }
    if(fam === 'ochem'){ var se = doc.getElementById('practiceSession'); return !!se && !se.hidden; }
    return engine && engine.getAttribute('data-view') === 'session';
  }
  function sessionTotal(){
    var t = engine && +engine.getAttribute('data-pp-total');
    if(t) return t;
    var el = C.total && doc.querySelector(C.total), m = el && /(?:of|\/)\s*(\d+)/.exec(el.textContent || '');
    return m ? +m[1] : (+URLP.get('n') || 20);
  }
  function startClock(){
    var k = TK[URLP.get('timer')] || 0;
    if(!k || clock) return;
    clock = { sec: 0, left: 0, el: null, t: null };
    var wait = setInterval(function(){
      if(!inSession()) return;
      clearInterval(wait);
      clock.sec = Math.round(C.pace * k * sessionTotal());
      clock.left = clock.sec * 1000;
      var el = clock.el = doc.createElement('div');
      el.className = 'pp-clock'; el.setAttribute('role', 'timer'); el.setAttribute('aria-label', 'Time left');
      doc.body.appendChild(el);
      var last = Date.now();
      clock.t = setInterval(function(){
        var now = Date.now(); clock.left -= now - last; last = now;
        if(!inSession()){ stopClock(); return; }
        var s = Math.max(0, Math.ceil(clock.left / 1000));
        el.textContent = Math.floor(s / 60) + ':' + (s % 60 < 10 ? '0' : '') + (s % 60);
        el.classList.toggle('is-low', s < 60);
        if(s <= 0){ stopClock(); timeUp(); }
      }, 250);
    }, 200);
  }
  function stopClock(){ if(clock){ clearInterval(clock.t); if(clock.el) clock.el.remove(); clock.el = null; } }
  function timeUp(){
    if(fam === 'nremt' && W.NremtPanel && W.NremtPanel.submit){ W.NremtPanel.submit(); return; }
    var b = C.end && doc.querySelector(C.end);
    if(b) b.click();
  }

  /* While a session or its results are up, the engine has the page and the card steps back. */
  function watch(){ var r = running(); wrap.classList.toggle('is-run', r); if(r) wrap.classList.remove('is-go'); }

  /* ---------------------------------------------------------------- events */
  root.querySelector('.pp-tiles').addEventListener('click', function(e){
    var t = e.target.closest('.pp-tile');
    if(!t) return;
    S.m = t.getAttribute('data-mode');
    openMs = null;
    clearAlert();
    render();
  });
  doc.getElementById('ppReset').addEventListener('click', function(){
    S[S.m] = defaultsOf(S.m);
    keyOn = false; openMs = null;
    clearAlert();
    render();
  });
  setEl.addEventListener('click', function(e){
    var b = e.target.closest('button[data-k]');
    if(!b || b.disabled) return;
    var k = b.getAttribute('data-k'), v = b.getAttribute('data-v'), m = S.m, s = S[m];
    if(k === 'qt' && ANP) s.qt = v === '' ? [] : has(s.qt, v) ? s.qt.filter(function(x){ return x !== v; }) : s.qt.concat(v);
    else if(k === 'kinds'){ s.kinds = has(s.kinds, v) ? s.kinds.filter(function(x){ return x !== v; }) : s.kinds.concat(v); if(!s.kinds.length) s.kinds = [v]; }
    else if(k === 'n' || k === 'nw' || k === 'weeks') s[k] = +v;
    else if(k === 'rsrc') return;
    else if(k === 'ek'){ s.ek = v; s.units = []; s.n = AP && v === 'unit' ? 0 : 20; }
    else if(k === 'timer'){ s.timer = v; if(v !== 'off' && s.expl === 'each' && BANK) s.expl = 'end'; }   // as the mockup: a timer explains at the end
    else s[k] = v;
    clearAlert();
    render();
  });
  setEl.addEventListener('toggle', function(e){
    var d = e.target;
    if(!d.classList || !d.classList.contains('pp-ms')) return;
    if(d.getAttribute('aria-disabled') === 'true'){ d.open = false; return; }
    openMs = d.open ? d.getAttribute('data-ms') : null;
  }, true);
  doc.addEventListener('click', function(e){
    var d = setEl.querySelector('.pp-ms[open]');
    if(d && doc.contains(e.target) && !d.contains(e.target)){ d.open = false; openMs = null; }
  });
  doc.addEventListener('keydown', function(e){
    var d = setEl.querySelector('.pp-ms[open]');
    if(d && e.key === 'Escape'){ d.open = false; openMs = null; d.querySelector('summary').focus(); }
  });
  setEl.addEventListener('change', function(e){
    var el = e.target, k = el.getAttribute('data-k') || el.id, m = S.m, s = S[m];
    if(!k) return;
    if(k === 'ppKey'){ keyOn = el.checked; return; }
    if(k === 'date'){
      var v = /^\d{4}-\d{2}-\d{2}$/.test(el.value) ? el.value : '';
      var D = W.LevlExamDate;
      if(D && D.write) D.write(C.course, v);
      paintSummary();
      var cp = doc.getElementById('ppCramPrint'); if(cp) cp.href = cramHref(true);
      return;
    }
    if(k === 'unit' && el.closest('.pp-ms')){
      s.units = el.checked ? (has(s.units, el.value) ? s.units : s.units.concat(el.value)) : s.units.filter(function(x){ return x !== el.value; });
    } else if(k === 'uall'){ s.units = []; }
    else if(k === 'units') s.units = el.value ? [el.value] : [];
    else if(k === 'qt' && ANP) s.qt = el.value ? [el.value] : [];
    else s[k] = el.value;
    if(m === 'frq' && (k === 'type' || k === 'unit')) s.id = '';
    if(m === 'jus' && (k === 'skill' || k === 'unit' || k === 'topic')){ s.id = ''; if(k === 'unit') s.topic = ''; }
    clearAlert();
    render();
  });
  if(shareEl) shareEl.addEventListener('change', function(e){ if(e.target.id === 'ppKey') keyOn = e.target.checked; });
  root.addEventListener('click', function(e){
    var c = e.target.closest('#ppCopy, #ppPrint');
    if(!c || c.disabled) return;
    var shareN = doc.getElementById('ppShareN');
    if(c.id === 'ppCopy'){
      var url = absUrl(current.href), done = function(){ if(shareN) shareN.textContent = 'Link copied. It opens this session.'; };
      if(navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(url).then(done, function(){ prompt('Copy this link', url); });
      else prompt('Copy this link', url);
      return;
    }
    /* The worksheet: the set the settings describe (an exam's unit test or mixed set: the same filters and length). */
    hook().then(function(H){
      if(!H.print) return;
      var s = S.m === 'exam' ? { from: 'new', units: S.exam.ek === 'unit' ? S.exam.units : [], topic: '', practice: S.exam.practice, qt: S.exam.qt, diff: S.exam.diff, level: '', n: S.exam.n, expl: 'each' } : S.set;
      var o = runOpts(s, H, current.title + ' · ' + current.line);
      H.print({ pick: o.pick, count: o.count, label: o.label, key: keyOn, btn: c, gate: function(g){ if(shareN) shareN.innerHTML = g; } });
    });
  });
  goEl.addEventListener('click', function(e){
    if(goEl.getAttribute('aria-disabled') === 'true'){ e.preventDefault(); return; }
    /* A question set or review on this page: the engine runs it here, no reload (the address keeps the settings). */
    if(BANK && (S.m === 'set' || S.m === 'rev') && /^practice\.html/.test(goEl.getAttribute('href'))){
      e.preventDefault();
      URLP = new URLSearchParams(goEl.getAttribute('href').split('?')[1] || '');
      try{ history.replaceState(null, '', location.pathname + '?' + URLP.toString()); }catch(x){}
      goRun();
    }
  });

  /* ---------------------------------------------------------------- the free daily limit, once, in the band */
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
  function paintCount(){ var sub = doc.getElementById('ppSub'), n = A.qcount(); if(sub && n) sub.textContent = fmt(n) + ' questions · every option explained'; }

  function boot(){
    fromUrl(URLP);
    render();
    paintFree(); paintCount();
    if(W.LevlPremium && W.LevlPremium.onChange) W.LevlPremium.onChange(paintFree);
    A.ready.then(function(){ fromUrl(URLP); render(); paintCount(); });
    W.addEventListener('storage', function(){ paintFree(); if(!running()) render(); });
    doc.addEventListener('visibilitychange', function(){ if(!doc.hidden){ paintFree(); if(!running()) render(); } });
    if(engine){
      new MutationObserver(function(){ watch(); paintFree(); if(!running() && !wrap.classList.contains('is-go')) render(); }).observe(engine, { attributes: true, attributeFilter: ['data-view', 'hidden'], childList: fam !== 'nremt' });
      var intro = doc.getElementById('introScreen');
      if(intro) new MutationObserver(watch).observe(intro, { attributes: true, attributeFilter: ['style'] });
    }
    watch();
    if(GO && BANK) goRun();
    else if(GO && URLP.get('timer')) startClock();
    if(GO && !BANK) A.ready.then(function(){ setTimeout(function(){ if(!running()) clean(); }, 400); });
  }
  if(doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', boot); else boot();
})();
