/* The Practice panel, version 2 (docs/course-redesign-r4.md decision 5, Practice v2, owner approved
   2026-11-06; mockup docs/redesign-r4/mockups/PracticeAll.dc.txt). One card, "Build your session", with
   every setting on its own row, always visible: Format, Exam, Questions from, Units and Topics, the
   course's science practice (or its equivalent), Question type, Difficulty, How many, Timer, Explanations,
   Exam date. A setting that does not apply to the chosen format stays where it is, greyed and not
   clickable, with the reason under its label. Quick picks only fill in the settings.

   The right column mirrors the choice ("Your session") with one Start whose label fits the format, and
   the sharing card (Classroom, copy link, worksheet with an optional answer key).

   Start runs what was chosen, every option honoured, through the format's existing engine with the
   settings in the URL and go=1:
     questions   practice.html?go=1&from=&units=&topic=&practice=&type=&diff=&n=&timer=&expl= (AP® and A&P:
                 this file builds the set through the engine's hook, window.<Glob>PracticeHook; ochem:
                 from=&chapters=&topic=&tier=&type=&n=; NREMT: from=&area=&diff=&n=). "Due for review" in
                 ochem and NREMT is their Review page (review.html?go=1&chapter|domain=&n=).
     timed exam  exams.html?go=1&... (each course's own contract, docs/course-redesign-r4.md decision 5)
     flashcards  flashcards.html?go=1&deck=&kinds=&new= (ochem/NREMT chapter|domain=&scope=&types=)
     free resp.  frq.html?go=1&type=&unit=      justify   justify.html?go=1&unit=&topic=&skill=
   The timer for a question set is this file's (a clock over the running session that ends it when time
   is up); explanations at the end are the engine's (pp-defer hides feedback until the summary).
   Config: <script type="application/json" id="ppConfig"> (scripts/lib/practice-panel.mjs panelConfig). */
(function(){
  var cfgEl = document.getElementById('ppConfig'), root = document.getElementById('pp');
  if(!cfgEl || !root) return;
  var C;
  try{ C = JSON.parse(cfgEl.textContent); }catch(e){ return; }
  var W = window, doc = document, fam = C.family;
  var rowsEl = doc.getElementById('ppRows'), sumT = doc.getElementById('ppSumT'), sumB = doc.getElementById('ppSumB'), goEl = doc.getElementById('ppGo');
  var wrap = root.parentNode, engine = doc.querySelector(C.engine);
  var URLP = new URLSearchParams(location.search), GO = URLP.get('go') === '1';

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

  /* ---------------------------------------------------------------- the course's data */
  var A = { ready: Promise.resolve(), noun: 'question' };
  var AP = fam === 'ap', ANP = fam === 'anp', BANK = AP || ANP;
  var CUR = {}, Core = null, META = (C.glob && W[C.glob + 'PracticeMeta']) || {};
  if(BANK){
    CUR = W[C.glob + 'Curriculum'] || {}; Core = W[C.glob + 'Core'];
    var UNITS = (ANP ? CUR.chapters : CUR.units) || [], TOPICS = CUR.topics || [];
    var uOf = function(t){ return ANP ? t.chapter : t.unit; };
    A.units = function(){ var h = {}; TOPICS.forEach(function(t){ if(t.built && t.qn) h[uOf(t)] = 1; }); return UNITS.filter(function(u){ return h[u.id]; }).map(function(u){
      return { id: u.id, chip: ANP ? String(u.n) : (u.part === 'course' ? String(u.n) : u.title), name: ANP ? u.n + '. ' + u.title : (u.part === 'course' ? 'Unit ' + u.n + ': ' : '') + u.title, course: !ANP && u.part === 'course', part: u.course };
    }); };
    A.topics = function(uids){ return TOPICS.filter(function(t){ return t.built && t.qn && (!uids.length || has(uids, uOf(t))); }).map(function(t){ return { id: t.id, unit: uOf(t), name: (t.ced ? t.ced + ' ' : (ANP && t.n ? t.n + '. ' : '')) + t.title, title: t.title }; }); };
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
    A.noun = 'concept';
    A.units = function(){ return ((W.OchemCurriculum && W.OchemCurriculum.MODULES) || []).map(function(m, i){ return { id: m.id, n: i + 1, chip: String(i + 1), name: (i + 1) + '. ' + m.title, topics: m.topics }; }); };
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
      return RA.domains.map(function(d){ return { id: d, chip: d, name: d, exam: true }; })
        .concat(RA.systems.map(function(d){ return { id: 'system:' + d, chip: d, name: d }; }));
    };
    A.topics = function(){ return []; };
    A.qcount = function(){ return W.NremtQueue ? W.NremtQueue.total : 0; };
    A.due = function(){ try{ return W.NremtQueue ? W.NremtQueue.due() : 0; }catch(e){ return 0; } };
    A.missed = function(){ var m = readJson('nremt_exam100_missed', []); return Array.isArray(m) ? m.length : 0; };
    A.weak = function(){ return [1]; };
  }

  /* Question types, difficulty levels and flashcard kinds per course. */
  var ANP_TYPES = [['single', 'Single best answer'], ['vignette', 'Clinical vignettes'], ['multi', 'Select all that apply'],
    ['sequence', 'Sequencing and find the error'], ['predict', 'Prediction tables']];
  var ANP_GROUP = { single: 'single', graph: 'single', image: 'single', vignette: 'vignette', multi: 'multi', order: 'sequence', missing: 'sequence', error: 'sequence', predict: 'predict' };
  function qtypes(){
    if(AP) return (META.kinds || [{ id: 'all', name: 'All types' }]).map(function(k){ return [k.id === 'all' ? '' : k.id, k.id === 'all' ? 'All' : k.name]; });
    if(ANP) return [['', 'All']].concat(ANP_TYPES);
    if(fam === 'ochem') return [['', 'All'], ['interactive', 'Interactive only']];
    return [['', 'All']];
  }
  function diffs(){
    if(AP) return (META.diffs || [{ id: '', name: 'Any' }]).map(function(d){ return [d.id, d.name]; });
    if(ANP) return [['', 'Any'], ['1', 'Easier'], ['2', 'Medium'], ['3', 'Harder']];
    if(fam === 'ochem') return [['', 'Any'], ['1', 'Foundational'], ['2', 'Intermediate'], ['3', 'Advanced'], ['4', 'Challenge']];
    return [['all', 'All levels'], ['easy', 'Easy'], ['medium', 'Medium'], ['hard', 'Hard'], ['expert', 'Expert']];
  }
  var LEVELS = [['', 'Any level'], ['recall', 'Recall'], ['apply', 'Apply'], ['analyze', 'Analyze']];
  function cardKinds(){
    if(BANK) return C.kinds || [];
    if(fam === 'ochem') return [['concept', 'Concepts'], ['table', 'Facts and values'], ['authored', 'Named reactions']];
    return [['fact', 'Key facts'], ['glossary', 'Terms'], ['mnemonic', 'Mnemonics'], ['reference', 'Reference tables']];
  }
  var TIMERS = [['off', 'Off'], ['pace', 'Exam pace'], ['x15', 'Time and a half'], ['x2', 'Double time']];
  var TK = { off: 0, pace: 1, x15: 1.5, x2: 2 };
  var FROM = { new: 'New questions', due: 'Due for review', missed: 'Ones I missed', weak: 'My weakest topics', studied: 'Topics I have studied' };

  /* Free response and justify lists load only when that format is chosen. */
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
  var FIDS = C.formats.map(function(f){ return f[0]; });
  function defaults(){
    return { f: 'q', from: 'new', units: [], topic: '', practice: '', qt: AP ? '' : [], diff: fam === 'nremt' ? 'all' : '', level: '',
      n: C.counts.indexOf(10) > -1 ? 10 : C.counts[0], timer: 'off', expl: 'each', ek: C.examKinds[0][0],
      ck: cardKinds().map(function(k){ return k[0]; }), ft: '', sk: '', date: '' };
  }
  var S = defaults();
  if(fam === 'ochem' || fam === 'nremt') S.qt = '';
  function readDate(){ var D = W.LevlExamDate, v = D && D.read ? D.read(C.course) : null; return /^\d{4}-\d{2}-\d{2}$/.test(v || '') ? v : ''; }

  /* The settings in the address: the panel's own (go=1 links, "Change the set") and the old deep links
     other pages still make (practice.html?unit=, ?topic=, ?chapter=, ?core=, ?mode=missed|weak). */
  function fromUrl(p){
    var units = (p.get('units') || p.get('chapters') || p.get('unit') || p.get('chapter') || p.get('area') || '').split(',').filter(Boolean);
    var known = A.units ? A.units().map(function(u){ return u.id; }) : [];
    if(units.length) S.units = units.filter(function(u){ return has(known, u); });
    if(p.get('topic')){ S.topic = p.get('topic'); var t = A.topics([]).filter(function(x){ return x.id === S.topic; })[0]; if(t && !S.units.length) S.units = [t.unit]; if(!t) S.topic = ''; }
    if(p.get('practice') || p.get('core')) S.practice = p.get('practice') || p.get('core');
    var from = p.get('from') || ({ missed: 'missed', weak: 'weak', studied: 'studied', mistakes: 'missed', cumulative: 'studied' })[p.get('mode')] || '';
    if(has(C.from, from)) S.from = from;
    var ty = p.get('type') || '';
    if(ANP) S.qt = ty ? ty.split(',').filter(function(x){ return ANP_TYPES.some(function(y){ return y[0] === x; }); }) : [];
    else if(qtypes().some(function(x){ return x[0] === ty && ty; })) S.qt = ty;
    var df = p.get('diff') || p.get('tier') || '';
    if(diffs().some(function(x){ return x[0] === df; })) S.diff = df;
    if(LEVELS.some(function(x){ return x[0] === p.get('level'); })) S.level = p.get('level');
    var n = p.get('n') || p.get('count');
    if(n !== null && has(C.counts, +n)) S.n = +n;
    if(TK[p.get('timer')] !== undefined) S.timer = p.get('timer');
    if(p.get('expl') === 'end') S.expl = 'end';
  }

  /* ---------------------------------------------------------------- rules */
  var NOT = { exam: 'Not used for a timed exam', cards: 'Not used for flashcards', frq: 'Not used for written answers',
    jus: 'Not used for justify prompts', cat: 'Not used for the adaptive exam', scen: 'Not used for scenarios' };
  var REVIEW = fam === 'ochem' || fam === 'nremt';   // "Due for review" is their Review page
  function isReview(s){ return s.f === 'q' && s.from === 'due' && REVIEW; }

  /* The reason a row does not apply, or ''. */
  function why(s, row){
    var f = s.f, ek = s.ek;
    if(row === 'ek') return f === 'exam' ? '' : 'Only for a timed exam';
    if(row === 'date') return '';
    if(f === 'cat' || f === 'scen') return f === 'scen' && row === 'units' ? 'You pick the call on the next page' : NOT[f];
    if(f === 'q'){
      if(isReview(s) && (row === 'topic' || row === 'type' || row === 'diff' || row === 'timer' || row === 'expl')) return 'Review serves what is due, by ' + (fam === 'ochem' ? 'chapter' : 'domain');
      if(fam === 'nremt'){
        if(row === 'type') return 'Every item type is mixed in';
        if((row === 'units' || row === 'diff') && s.from === 'weak') return 'Weak-spot practice picks the domains itself';
        if((row === 'units' || row === 'diff' || row === 'n') && s.from === 'missed') return 'Every missed question comes back until it is right';
      }
      return '';
    }
    if(f === 'exam'){
      if(row === 'from') return AP || fam === 'nremt' ? 'An exam draws from every unit by its exam weight' : 'An exam picks its own questions';
      if(row === 'expl') return 'Exams explain everything at the end';
      if(row === 'topic') return 'An exam covers whole ' + (AP ? 'units' : 'chapters');
      if(AP){
        if(row === 'units') return ek === 'unit' ? '' : ek === 'full' ? 'A full exam covers every unit' : 'A mixed set draws from every unit';
        if(row === 'n') return ek === 'full' ? 'The full exam is fixed' : '';
        if(row === 'timer') return '';
        return 'An exam keeps the real exam mix';
      }
      if(ANP){
        var custom = ek === 'custom';
        if(row === 'units') return ek === 'unit' || ek === 'system' || custom ? '' : ek === 'teas' ? 'TEAS practice follows the TEAS areas' : 'A final covers the whole course';
        if(row === 'timer') return ek === 'unit' ? 'Unit quizzes are untimed' : '';
        if(row === 'type' || row === 'diff' || row === 'n') return custom ? '' : 'Only for a custom exam';
        return 'An exam keeps the course mix';
      }
      if(fam === 'ochem'){
        if(row === 'units') return ek === 'final' ? 'The final covers every chapter' : '';
        if(row === 'n') return ek === 'final' ? 'The final is 50 questions' : '';
        if(row === 'timer') return '';
        return 'An exam keeps the course mix';
      }
      if(row === 'diff') return '';
      if(row === 'units') return 'The exam follows the 2025 domain mix';
      if(row === 'n') return 'The exam is 100 questions';
      if(row === 'timer') return 'The exam is 2 hours, like the real one';
      return 'The exam keeps the real mix';
    }
    if(f === 'cards'){
      if(row === 'from' || row === 'units' || row === 'type') return '';
      if(row === 'topic') return BANK ? '' : 'Flashcards go by ' + (fam === 'ochem' ? 'chapter' : 'domain');
      if(row === 'n') return BANK ? '' : 'Cards come on your daily schedule';
      return NOT.cards;
    }
    if(f === 'frq'){
      if(row === 'units' || row === 'type') return '';
      if(row === 'from') return 'Free response opens the next one you have not scored';
      if(row === 'n') return 'One question at a time';
      if(row === 'timer') return 'Free response is untimed here; the full practice exam times it';
      return NOT.frq;
    }
    if(f === 'jus'){
      if(row === 'units' || row === 'topic' || row === 'type') return '';
      if(row === 'from') return 'Justify opens the next prompt you have not checked';
      if(row === 'n') return 'One prompt at a time';
      return NOT.jus;
    }
    return '';
  }
  /* One chip that cannot be chosen right now (the row itself applies), or ''. */
  function chipWhy(s, row, v){
    if(row === 'from'){
      if(s.f === 'cards' && fam === 'ochem' && (v === 'due' || v === 'missed')) return 'Not for flashcards';
      if(s.f === 'cards' && fam === 'nremt' && v !== 'new' && v !== 'weak') return 'Not for flashcards';
      if(v === 'due' && !A.due()) return 'Nothing is due right now';
      if(v === 'missed' && !A.missed()) return 'Nothing missed';
      if(v === 'weak' && BANK && !A.weak().length) return 'Answer some questions first';
      if(v === 'studied' && !A.studied().length) return 'Study a topic first';
    }
    if(row === 'n' && v === 0 && s.f === 'exam' && (AP || fam === 'ochem')) return 'Pick a number';
    if(row === 'expl' && v === 'end' && REVIEW) return 'This course explains each answer as you go';
    if(row === 'units' && fam === 'nremt' && s.f === 'cards'){ var u = A.units().filter(function(x){ return x.id === v; })[0]; if(u && u.exam) return 'Flashcards are grouped by topic area'; }
    return '';
  }
  /* How the unit chips pick: several, one, or a range (the ochem midterm). */
  function unitsMode(s){
    if(s.f === 'q') return fam === 'nremt' || isReview(s) ? 'single' : 'multi';
    if(s.f === 'exam') return ANP && s.ek === 'custom' ? 'multi' : fam === 'ochem' && s.ek === 'midterm' ? 'range' : 'single';
    if(s.f === 'cards') return BANK ? 'multi' : 'single';
    return 'single';
  }
  /* Keep the state inside what the rules allow. */
  function settle(s){
    if(!has(FIDS, s.f)) s.f = FIDS[0];
    if(!C.examKinds.some(function(k){ return k[0] === s.ek; })) s.ek = C.examKinds[0][0];
    if(!why(s, 'from') && chipWhy(s, 'from', s.from)) s.from = 'new';
    var um = unitsMode(s);
    if(um === 'single' && s.units.length > 1) s.units = s.units.slice(0, 1);
    s.units = s.units.filter(function(u){ return !chipWhy(s, 'units', u); });
    var unitsOff = !!why(s, 'units');
    if((um !== 'single' || unitsOff) && s.autoUnit && s.units.length === 1 && s.units[0] === s.autoUnit) s.units = [];
    if(um !== 'single' || unitsOff) s.autoUnit = null;
    if(s.f === 'exam' && um === 'single' && !unitsOff && !s.units.length && A.units().length){
      var first = A.units().filter(function(u){ return !AP || u.course; })[0];
      if(first){ s.units = [first.id]; s.autoUnit = first.id; }   // an exam on one unit needs one; dropped again if the next choice takes several
    }
    if(s.topic && !A.topics(s.units).some(function(t){ return t.id === s.topic; })) s.topic = '';
    if(chipWhy(s, 'n', s.n)) s.n = C.counts.filter(function(n){ return n; })[1] || C.counts[0];
    if(chipWhy(s, 'expl', s.expl)) s.expl = 'each';
  }

  /* ---------------------------------------------------------------- drawing */
  function chip(row, v, label, on, off, title){
    return '<button type="button" class="pp-chip" data-k="' + row + '" data-v="' + esc(v) + '" aria-pressed="' + (on ? 'true' : 'false') + '"' +
      (off ? ' disabled aria-disabled="true"' : '') + (title ? ' title="' + esc(title) + '"' : '') + '>' + label + '</button>';
  }
  function chips(s, row, list, isOn, rowOff){
    return list.map(function(x){ var cw = rowOff ? '' : chipWhy(s, row, x[0]); return chip(row, x[0], x[1], isOn(x[0]), rowOff || !!cw, cw); }).join('');
  }
  function select(row, label, opts, val, off){
    return '<label class="pp-field"><span class="sr-only">' + label + '</span><select data-k="' + row + '" aria-label="' + esc(label) + '"' + (off ? ' disabled' : '') + '>' +
      opts.map(function(o){ return o.group ? '<optgroup label="' + esc(o.group) + '">' + o.list.map(function(x){ return '<option value="' + esc(x.v) + '"' + (x.v === val ? ' selected' : '') + '>' + esc(x.t) + '</option>'; }).join('') + '</optgroup>'
        : '<option value="' + esc(o.v) + '"' + (o.v === val ? ' selected' : '') + '>' + esc(o.t) + '</option>'; }).join('') + '</select></label>';
  }
  function row(id, label, reason, body, note){
    return '<div class="pp-row' + (reason ? ' is-off' : '') + '" data-row="' + id + '"><div class="pp-lab"><span class="pp-lab-t" id="ppL-' + id + '">' + label + '</span>' +
      ((reason || note) ? '<span class="pp-why">' + esc(reason || note) + '</span>' : '') + '</div>' +
      '<div class="pp-ctl" role="group" aria-labelledby="ppL-' + id + '"' + (reason ? ' aria-disabled="true"' : '') + '>' + body + '</div></div>';
  }

  function render(){
    settle(S);
    var s = S, html = '', w;
    /* Format */
    html += row('f', 'Format', '', C.formats.map(function(f){ return chip('f', f[0], esc(f[1]), s.f === f[0]); }).join(''));
    /* Exam kind */
    w = why(s, 'ek');
    html += row('ek', 'Exam', w, chips(s, 'ek', C.examKinds.map(function(k){ return [k[0], esc(k[1])]; }), function(v){ return s.ek === v; }, w),
      !w && AP && s.ek === 'mixed' ? 'Part of Premium, with the cram kit' : '');
    /* Questions from */
    w = why(s, 'from');
    var due = A.due(), miss = A.missed();
    html += row('from', 'Questions from', w, chips(s, 'from', C.from.map(function(v){
      var lab = FROM[v];
      if(s.f === 'cards' && v === 'new') lab = 'New and due cards';
      if(s.f === 'cards' && v === 'due') lab = 'Due cards only';
      if(s.f === 'cards' && v === 'missed') lab = 'Terms from questions I missed';
      if(v === 'due' && s.f !== 'cards') lab += ' &middot; ' + fmt(due);
      if(v === 'missed' && s.f !== 'cards') lab += ' &middot; ' + fmt(miss);
      return [v, lab];
    }), function(v){ return s.from === v; }, w));
    /* Units and topics */
    w = why(s, 'units');
    var um = unitsMode(s), units = A.units ? A.units() : [], tw = why(s, 'topic') || w;
    var unitChips = (um === 'multi' || (um === 'single' && s.f !== 'exam') ? chip('units', '', 'All', !s.units.length, !!w) : '') +
      chips(s, 'units', units.map(function(u){ return [u.id, esc(u.chip)]; }), function(v){ return has(s.units, v); }, w);
    var topicSel = fam === 'nremt' ? '' : select('topic', 'Topics', [{ v: '', t: s.units.length ? 'Every topic in ' + (s.units.length > 1 ? 'these ' : 'this ') + (C.unitWord === 'Units' ? 'unit' : 'chapter') + (s.units.length > 1 ? 's' : '') : 'Every topic' }]
      .concat(A.topics(s.units).map(function(t){ return { v: t.id, t: t.name }; })), s.topic, !!tw);
    html += row('units', C.unitWord, w, unitChips + topicSel,
      um === 'single' && !w ? 'Pick one' : um === 'range' && !w ? 'From the first to the last you pick' : '');
    /* Science practice or its equivalent */
    if(C.practice){
      w = why(s, 'practice');
      html += row('practice', C.practice, w, select('practice', C.practice, [{ v: '', t: 'Every ' + C.practice.toLowerCase() }].concat(A.practices().map(function(p){ return { v: p.id, t: p.name }; })), s.practice, !!w));
    }
    /* Question type: the kind of thing practised (questions, cards, free-response types, justify skills) */
    w = why(s, 'type');
    var typeBody = '', typeNote = '';
    if(s.f === 'cards'){ typeBody = chips(s, 'ck', cardKinds().map(function(k){ return [k[0], esc(k[1])]; }), function(v){ return has(s.ck, v); }, w); typeNote = w ? '' : 'Card types'; }
    else if(s.f === 'frq'){
      if(!frqData){ loadFrq(); typeBody = '<span class="pp-wait">Loading the types&hellip;</span>'; }
      else { var K = frqData.K, hv = {}; frqData.list.forEach(function(x){ hv[x.type] = 1; });
        typeBody = chips(s, 'ft', [['', 'All']].concat((K.ORDER || Object.keys(K.TYPES || {})).filter(function(t){ return hv[t]; }).map(function(t){ return [t, esc((K.TYPES || {})[t] || t)]; })), function(v){ return s.ft === v; }, w); }
      typeNote = w ? '' : 'Free-response types';
    } else if(s.f === 'jus'){
      if(!jusData){ loadJus(); typeBody = '<span class="pp-wait">Loading the skills&hellip;</span>'; }
      else typeBody = chips(s, 'sk', [['', 'All']].concat(Object.keys(jusData.skills || {}).map(function(k){ return [k, esc(jusData.skills[k])]; })), function(v){ return s.sk === v; }, w);
      typeNote = w ? '' : 'Justify skills';
    } else if(ANP) typeBody = chip('qt', '', 'All', !s.qt.length, !!w) + chips(s, 'qt', ANP_TYPES.map(function(t){ return [t[0], esc(t[1])]; }), function(v){ return has(s.qt, v); }, w);
    else typeBody = chips(s, 'qt', qtypes().map(function(t){ return [t[0], esc(t[1])]; }), function(v){ return s.qt === v; }, w);
    html += row('type', 'Question type', w, typeBody, typeNote);
    /* Difficulty (A&P: and the level) */
    w = why(s, 'diff');
    html += row('diff', 'Difficulty', w, chips(s, 'diff', diffs().map(function(d){ return [d[0], esc(d[1])]; }), function(v){ return s.diff === v; }, w) +
      (ANP ? select('level', 'Level', LEVELS.map(function(l){ return { v: l[0], t: l[1] }; }), s.level, !!w) : ''));
    /* How many */
    w = why(s, 'n');
    html += row('n', 'How many', w, chips(s, 'n', C.counts.map(function(n){ return [n, n ? String(n) : 'All']; }), function(v){ return s.n === v; }, w),
      !w && s.f === 'cards' ? 'New cards today' : '');
    /* Timer */
    w = why(s, 'timer');
    html += row('timer', 'Timer', w, chips(s, 'timer', TIMERS, function(v){ return s.timer === v; }, w));
    /* Explanations */
    w = why(s, 'expl');
    html += row('expl', 'Explanations', w, chips(s, 'expl', [['each', 'After each answer'], ['end', 'At the end']], function(v){ return s.expl === v; }, w), w ? '' : chipWhy(s, 'expl', 'end'));
    /* Exam date */
    s.date = readDate();
    html += row('date', 'Exam date', '', '<label class="pp-field pp-date"><span class="sr-only">Exam date</span><input type="date" data-k="date" value="' + esc(s.date) + '" aria-label="Exam date"></label>' +
      '<span class="pp-dnote">Optional. Used for your ' + (C.cram ? 'cram plan and ' : '') + 'pacing.</span>' +
      (C.cram ? '<a class="pp-more" id="ppCram" href="cram.html' + query({ date: s.date }) + '">Make a cram plan from it</a>' : ''));
    var focus = doc.activeElement && rowsEl.contains(doc.activeElement) ? keyOf(doc.activeElement) : null;
    rowsEl.innerHTML = html;
    if(focus){ var el = rowsEl.querySelector(focus); if(el && !el.disabled) el.focus(); }
    paintSummary();
  }
  function keyOf(el){
    var k = el.getAttribute('data-k'), v = el.getAttribute('data-v');
    return k ? '[data-k="' + k + '"]' + (v !== null ? '[data-v="' + v.replace(/"/g, '\\"') + '"]' : '') : null;
  }

  /* ---------------------------------------------------------------- what Start runs */
  function unitName(id){ var u = (A.units ? A.units() : []).filter(function(x){ return x.id === id; })[0]; return u ? u.name : id; }
  function unitsText(s){
    if(!s.units.length) return 'every ' + (C.unitWord === 'Units' ? 'unit' : C.unitWord === 'Domains' ? 'domain' : 'chapter');
    if(s.topic){ var t = A.topics(s.units).filter(function(x){ return x.id === s.topic; })[0]; if(t) return t.title; }
    if(s.units.length === 1) return unitName(s.units[0]);
    var w = C.unitWord === 'Units' ? 'Units ' : C.unitWord + ' ';
    return w + A.units().filter(function(u){ return has(s.units, u.id); }).map(function(u){ return u.chip; }).join(', ');
  }
  function label(list, v){ var x = list.filter(function(y){ return y[0] === v; })[0]; return x ? strip(x[1]) : ''; }
  function qsec(s){ return Math.round(C.pace * TK[s.timer]); }
  function timing(s){ return s.timer === 'pace' ? 'std' : s.timer; }
  function nOr(s, all){ return s.n || all; }

  /* { title, body: [lines], cta, href, off } */
  function plan(s){
    var f = s.f, n = s.n, lines = [];
    if(f === 'q'){
      var src = { new: 'new questions', due: 'questions due for review', missed: 'questions you missed', weak: 'your weakest topics', studied: 'topics you have studied' }[s.from];
      var cap = s.from === 'due' ? A.due() : s.from === 'missed' && BANK ? A.missed() : 0, k = cap && (!n || n > cap) ? cap : n;
      var title = (k ? k : 'All') + ' ' + (s.from === 'due' ? 'due ' : '') + (fam === 'ochem' && s.from === 'due' ? 'concepts' : 'questions');
      lines.push('From ' + src + (why(s, 'units') ? '' : ', ' + unitsText(s)));
      var bits = [];
      if(!why(s, 'type') && (AP ? s.qt : (ANP ? s.qt.length : s.qt))) bits.push(ANP ? s.qt.map(function(t){ return label(ANP_TYPES, t); }).join(', ') : label(qtypes(), s.qt));
      if(!why(s, 'diff') && s.diff && s.diff !== 'all') bits.push(label(diffs(), s.diff).toLowerCase());
      if(ANP && s.level) bits.push(label(LEVELS, s.level).toLowerCase());
      if(C.practice && s.practice) bits.push(strip((A.practices().filter(function(p){ return p.id === s.practice; })[0] || {}).name || ''));
      if(bits.length) lines.push(bits.join(' · '));
      if(!why(s, 'timer')) lines.push((s.timer === 'off' ? 'No timer' : label(TIMERS, s.timer) + ', ' + Math.round(qsec(s) / 6) / 10 + ' min a question') + (why(s, 'expl') ? '' : ' · explanations ' + (s.expl === 'end' ? 'at the end' : 'after each answer')));
      var href;
      if(isReview(s)) href = 'review.html' + query(fam === 'ochem' ? { go: 1, chapter: s.units[0] || '', n: n || '' } : { go: 1, domain: s.units[0] || '', n: n || '' });
      else if(BANK) href = 'practice.html' + query({ go: 1, from: s.from, units: s.units.join(','), topic: s.topic, practice: AP ? s.practice : '', core: ANP ? s.practice : '',
        type: ANP ? s.qt.join(',') : s.qt, diff: s.diff, level: ANP ? s.level : '', n: n, timer: s.timer !== 'off' ? s.timer : '', expl: s.expl === 'end' ? 'end' : '' });
      else if(fam === 'ochem') href = 'practice.html' + query({ go: 1, from: s.from, chapters: s.units.join(','), topic: s.topic, tier: s.diff, type: s.qt, n: n, timer: s.timer !== 'off' ? s.timer : '' });
      else href = 'practice.html' + query({ go: 1, from: s.from, area: s.from === 'new' ? s.units[0] || '' : '', diff: s.from === 'new' && s.diff !== 'all' ? s.diff : '', n: s.from === 'missed' ? '' : n, timer: s.timer !== 'off' ? s.timer : '' });
      var off = (s.from === 'due' && !A.due()) || (s.from === 'missed' && !A.missed());
      return { title: title, body: lines, cta: s.from === 'due' ? 'Start review' : 'Start practice', href: href, off: off };
    }
    if(f === 'exam'){
      var ek = s.ek, tl = s.timer === 'off' ? 'No timer' : label(TIMERS, s.timer);
      if(AP){
        var t = ek === 'full' ? 'Full practice exam' : ek === 'unit' ? 'Unit test: ' + unitName(s.units[0]) : 'Mixed timed set';
        lines.push(ek === 'full' ? C.exam : (n ? plural(n, 'question') : 'Every question in the unit') + (ek === 'mixed' ? ' from every unit' : ''));
        lines.push(tl + ' · no feedback until the end');
        return { title: t, body: lines, cta: ek === 'full' ? 'Start the exam' : ek === 'unit' ? 'Start the unit test' : 'Start the timed set',
          href: 'exams.html' + query({ go: 1, mode: ek, unit: ek === 'unit' ? s.units[0] : '', len: ek === 'unit' ? n : '', n: ek === 'mixed' ? n : '', timing: timing(s) }) };
      }
      if(ANP){
        var names = { unit: 'Unit quiz', system: 'System exam', finalI: 'Cumulative final, A&P I', finalII: 'Cumulative final, A&P II', custom: 'Custom exam', teas: 'TEAS A&P practice' };
        var custom = ek === 'custom', mode = ek === 'finalI' || ek === 'finalII' ? 'final' : ek;
        if(ek === 'unit' || ek === 'system') lines.push(unitName(s.units[0]));
        if(custom){ lines.push(unitsText(s) + ', ' + (n ? 'up to ' + plural(n, 'question') : 'every question that matches'));
          var cb = []; if(s.qt.length) cb.push(s.qt.map(function(x){ return label(ANP_TYPES, x); }).join(', ')); if(s.diff) cb.push(label(diffs(), s.diff).toLowerCase()); if(s.level) cb.push(label(LEVELS, s.level).toLowerCase()); if(cb.length) lines.push(cb.join(' · ')); }
        lines.push((ek === 'unit' ? 'Untimed' : tl) + ' · no feedback until the end');
        return { title: names[ek], body: lines, cta: { unit: 'Start the unit quiz', system: 'Start the system exam', finalI: 'Start the final', finalII: 'Start the final', custom: 'Start the custom exam', teas: 'Start TEAS practice' }[ek],
          href: 'exams.html' + query({ go: 1, mode: mode, chapter: ek === 'unit' || ek === 'system' ? s.units[0] : '', course: mode === 'final' ? (ek === 'finalI' ? 'I' : 'II') : '',
            chapters: custom ? s.units.join(',') : '', types: custom ? s.qt.join(',') : '', levels: custom ? s.level : '', diffs: custom ? s.diff : '', len: custom ? String(n) : '', timing: ek === 'unit' ? '' : timing(s) }) };
      }
      if(fam === 'ochem'){
        var us = A.units(), sel = us.filter(function(u){ return has(s.units, u.id); }), lo = sel.length ? Math.min.apply(null, sel.map(function(u){ return u.n; })) : 1, hi = sel.length ? Math.max.apply(null, sel.map(function(u){ return u.n; })) : 1;
        var tt = ek === 'chapter' ? 'Chapter test: ' + unitName(s.units[0]) : ek === 'midterm' ? 'Midterm: chapters ' + lo + (hi > lo ? ' to ' + hi : '') : 'Cumulative final';
        lines.push(ek === 'final' ? '50 questions from every chapter' : plural(n, 'question'));
        lines.push(tl + ' · no feedback until you submit');
        return { title: tt, body: lines, cta: ek === 'final' ? 'Start the final' : ek === 'midterm' ? 'Start the midterm' : 'Start the chapter test',
          href: 'exams.html' + query({ go: 1, kind: ek, chapter: ek === 'chapter' ? s.units[0] : '', len: ek === 'final' ? '' : n, from: ek === 'midterm' ? lo : '', to: ek === 'midterm' ? hi : '', timing: timing(s) }) };
      }
      lines.push('100 questions in the 2025 domain mix, 2 hours' + (s.diff !== 'all' ? ', ' + label(diffs(), s.diff).toLowerCase() + ' only' : ''));
      lines.push(ek === 'real' ? 'Exam-realistic: no flagging, no going back' : 'No feedback until you submit');
      return { title: 'Timed exam', body: lines, cta: 'Start the exam', href: 'exams.html' + query({ go: 1, exam: 'full', diff: s.diff !== 'all' ? s.diff : '', real: ek === 'real' }) };
    }
    if(f === 'cards'){
      var ct = s.ck.map(function(k){ return label(cardKinds(), k); }).join(', ');
      if(BANK){
        var deck, what;
        var uk = ANP ? 'chapter:' : 'unit:';
        if(s.from === 'missed'){ deck = 'missed'; what = 'Terms from questions you missed'; }
        else if(s.from === 'weak'){ var wk = A.weak(); deck = wk.map(function(x){ return 'topic:' + x.id; }).join(',') || 'all'; what = 'Your weakest topics'; }
        else if(s.from === 'studied'){ var st = A.studied(); deck = st.map(function(x){ return 'topic:' + x; }).join(',') || 'all'; what = 'Topics you have studied'; }
        else if(s.topic){ deck = 'topic:' + s.topic; what = unitsText(s); }
        else if(s.units.length){ deck = s.units.map(function(u){ return uk + u; }).join(','); what = unitsText(s); }
        else { deck = 'all'; what = 'Every published topic'; }
        if(s.from === 'missed' || s.from === 'weak' || s.from === 'studied'){
          if(s.topic) deck = deck === 'missed' ? deck : deck; // the source decides the deck; units narrow only "new"
        }
        lines.push(what);
        lines.push(s.from === 'due' ? 'Due cards only, no new ones' : 'Up to ' + plural(s.n || 50, 'new card') + ' today, due cards first');
        lines.push(ct);
        return { title: (s.from === 'due' ? 'Due' : (s.n || 'All')) + ' flashcards', body: lines, cta: 'Study cards',
          href: 'flashcards.html' + query({ go: 1, deck: deck, kinds: s.ck.join(','), 'new': s.from === 'due' ? 0 : (s.n || 50) }) };
      }
      var scope = s.from === 'weak' ? 'weak' : s.from === 'studied' ? 'studied' : 'all';
      if(fam === 'ochem'){
        lines.push(s.units.length ? 'Chapter ' + unitName(s.units[0]) : 'All chapters'); lines.push(ct);
        return { title: 'Flashcards', body: lines, cta: 'Study cards', href: 'flashcards.html' + query({ go: 1, chapter: s.units[0] || 'all', scope: scope, types: s.ck.join(',') }) };
      }
      var lab = s.units.length ? s.units[0].replace(/^system:/, '') : '', dm = (C.domains || []).filter(function(d){ return d[1] === lab; })[0];
      lines.push(dm ? dm[1] : 'All domains'); lines.push(ct);
      return { title: 'Flashcards', body: lines, cta: 'Study cards', href: 'flashcards.html' + query({ go: 1, domain: dm ? dm[0] : 'all', scope: scope, types: s.ck.join(',') }) };
    }
    if(f === 'frq'){
      if(!frqData || frqData.failed) return { title: 'Free response', body: [frqData && frqData.failed ? 'The questions did not load. Check your connection.' : 'Loading the questions'], cta: 'Start writing', href: 'frq.html' };
      var m = frqData.list.filter(function(x){ return (!s.ft || x.type === s.ft) && (!s.units.length || (x.units || []).indexOf(s.units[0]) > -1); });
      lines.push(plural(m.length, 'question') + ' match, from ' + unitsText(s));
      lines.push('Write each part, then score it with the rubric');
      return { title: s.ft ? (frqData.K.TYPES || {})[s.ft] || 'Free response' : 'Free response', body: lines, cta: 'Start writing',
        href: 'frq.html' + query({ go: 1, type: s.ft, unit: s.units[0] || '' }), off: !m.length, list: 'frq.html' + query({ type: s.ft, unit: s.units[0] || '' }) };
    }
    if(f === 'jus'){
      if(!jusData || jusData.failed) return { title: 'Justify prompts', body: [jusData && jusData.failed ? 'The prompts did not load. Check your connection.' : 'Loading the prompts'], cta: 'Start a prompt', href: 'justify.html' };
      var ps = (jusData.prompts || []).filter(function(p){ return (!s.units.length || p.unit === s.units[0]) && (!s.topic || p.topic === s.topic) && (!s.sk || p.skill === s.sk); });
      lines.push(plural(ps.length, 'prompt') + ' match, from ' + unitsText(s));
      lines.push('Claim, evidence and reasoning, then check it against the rubric');
      return { title: s.sk ? jusData.skills[s.sk] : 'Justify prompts', body: lines, cta: 'Start a prompt',
        href: 'justify.html' + query({ go: 1, unit: s.units[0] || '', topic: s.topic, skill: s.sk }), off: !ps.length, list: 'justify.html' + query({ list: 1, unit: s.units[0] || '', skill: s.sk }) };
    }
    if(f === 'cat') return { title: 'Adaptive exam', body: ['70 to 120 questions, 2 hours at most', 'Each answer sets the next question; a likely pass or fail at the end', 'A simulation, not the Registry’s algorithm'], cta: 'Start adaptive exam', href: 'exams.html' + query({ go: 1, exam: 'cat' }) };
    return { title: 'Scenarios', body: ['One call, from dispatch to handoff', 'Every decision explained when the call ends'], cta: 'Choose a call', href: 'scenario-sim.html' };
  }

  var current = null;
  function paintSummary(){
    var r = current = plan(S);
    sumT.textContent = r.title;
    sumB.innerHTML = r.body.map(esc).join('<br>') + (r.list ? '<br><a href="' + esc(r.list) + '">See them all as a list</a>' : '');
    goEl.textContent = r.cta;
    goEl.href = r.href;
    if(r.off){ goEl.setAttribute('aria-disabled', 'true'); goEl.classList.add('is-off'); } else { goEl.removeAttribute('aria-disabled'); goEl.classList.remove('is-off'); }
    paintShare(r);
  }

  /* ---------------------------------------------------------------- sharing */
  var shareN = doc.getElementById('ppShareN'), printBtn = doc.getElementById('ppPrint'), keyBox = doc.getElementById('ppKey');
  function absUrl(h){ try{ return new URL(h, location.href).href; }catch(e){ return h; } }
  function paintShare(r){
    var cls = doc.getElementById('ppClass');
    if(cls) cls.href = 'https://classroom.google.com/share?url=' + encodeURIComponent(absUrl(r.href)) + '&title=' + encodeURIComponent(r.title + ': ' + strip(doc.querySelector('.band .issue') ? doc.querySelector('.band .issue').textContent : '').trim());
    if(!C.print) return;
    var can = S.f === 'q' && !isReview(S);
    printBtn.disabled = !can; keyBox.disabled = !can;
    if(shareN && !shareN.getAttribute('data-msg')) shareN.textContent = can ? '' : 'A worksheet is made from a question set: choose Questions as the format.';
  }
  doc.getElementById('ppCopy').addEventListener('click', function(){
    var url = absUrl(current.href), done = function(){ shareN.setAttribute('data-msg', '1'); shareN.textContent = 'Link copied. It opens this session.'; setTimeout(function(){ shareN.removeAttribute('data-msg'); paintShare(current); }, 4000); };
    if(navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(url).then(done, function(){ prompt('Copy this link', url); });
    else { prompt('Copy this link', url); }
  });
  if(printBtn) printBtn.addEventListener('click', function(){
    if(printBtn.disabled) return;
    hook().then(function(H){
      var o = runOpts(S, H);
      if(!H.print) return;
      H.print({ pick: o.pick, count: o.count, label: o.label, key: keyBox.checked, btn: printBtn, gate: function(g){ shareN.innerHTML = g; } });
    });
  });

  /* ---------------------------------------------------------------- AP® and A&P: the question set */
  var hookP = null;
  function hook(){
    return hookP || (hookP = new Promise(function(res){
      var name = C.glob + 'PracticeHook';
      if(W[name]) return res(W[name]);
      doc.addEventListener('levl-practice-ready', function(){ res(W[name]); });
    }));
  }
  /* The set the settings describe, as a filter over the engine's index stubs. */
  function runOpts(s, H){
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
    var r = plan(s);
    return { pick: pick, count: s.n, mode: mode, order: order, label: r.title + ' · ' + r.body[0], defer: s.expl === 'end' };
  }
  /* go=1 on practice.html: run it as soon as the engine has its index. */
  function goRun(){
    wrap.classList.add('is-go');
    hook().then(function(H){
      var ok = H.run(runOpts(S, H));
      if(!ok){ wrap.classList.remove('is-go'); H.setup(); clean(); note('No questions match those settings yet. Loosen one of them.'); }
      else startClock();
    });
  }
  function clean(){ try{ history.replaceState(null, '', location.pathname); }catch(e){} }
  function note(t){ var n = doc.createElement('p'); n.className = 'pp-alert'; n.setAttribute('role', 'status'); n.textContent = t; rowsEl.parentNode.insertBefore(n, rowsEl); }

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
    return m ? +m[1] : (S.n || 20);
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
  rowsEl.addEventListener('click', function(e){
    var b = e.target.closest('button[data-k]');
    if(!b || b.disabled) return;
    var k = b.getAttribute('data-k'), v = b.getAttribute('data-v'), s = S;
    if(k === 'units'){
      var um = unitsMode(s);
      s.autoUnit = null;
      if(v === '') s.units = [];
      else if(um === 'single') s.units = [v];
      else s.units = has(s.units, v) ? s.units.filter(function(x){ return x !== v; }) : s.units.concat(v);
      s.topic = s.topic && A.topics(s.units).some(function(t){ return t.id === s.topic; }) ? s.topic : '';
    } else if(k === 'qt' && ANP){
      s.qt = v === '' ? [] : has(s.qt, v) ? s.qt.filter(function(x){ return x !== v; }) : s.qt.concat(v);
    } else if(k === 'ck'){
      var nx = has(s.ck, v) ? s.ck.filter(function(x){ return x !== v; }) : s.ck.concat(v);
      if(nx.length) s.ck = nx;   // at least one card type
    } else if(k === 'n') s.n = +v;
    else if(k === 'f'){
      s.f = v;
      if(v === 'exam'){ s.timer = 'pace'; }
      if(v === 'q'){ s.expl = s.expl || 'each'; }
    } else s[k] = v;
    clearAlert();
    render();
  });
  rowsEl.addEventListener('change', function(e){
    var el = e.target, k = el.getAttribute('data-k');
    if(!k) return;
    if(k === 'date'){
      var v = /^\d{4}-\d{2}-\d{2}$/.test(el.value) ? el.value : '';
      var D = W.LevlExamDate;
      if(D && D.write) D.write(C.course, v);
      S.date = v;
      var cl = doc.getElementById('ppCram'); if(cl) cl.href = 'cram.html' + query({ date: v });
      return;
    }
    S[k] = el.value;
    render();
  });
  function clearAlert(){ var a = root.querySelector('.pp-alert'); if(a) a.remove(); }
  root.querySelector('.pp-quick').addEventListener('click', function(e){
    var b = e.target.closest('[data-quick]');
    if(!b) return;
    var q = b.getAttribute('data-quick'), d = defaults();
    d.ck = S.ck;
    if(q === 'q10'){ d.n = 10; }
    if(q === 'due'){ d.from = 'due'; d.n = C.counts.indexOf(0) > -1 ? 0 : C.counts[C.counts.length - 1]; }
    if(q === 'exam'){ d.f = 'exam'; d.ek = AP ? 'full' : ANP ? 'finalI' : fam === 'ochem' ? 'final' : 'std'; d.timer = 'pace'; }
    if(q === 'cards'){ d.f = 'cards'; d.n = 20; }
    S = d;
    clearAlert();
    render();
    var r = rowsEl.querySelector('[data-row="f"] [aria-pressed="true"]'); if(r) r.focus();
  });
  goEl.addEventListener('click', function(e){
    if(goEl.getAttribute('aria-disabled') === 'true'){ e.preventDefault(); return; }
    /* A question set on this page: the engine runs it here, no reload (the address keeps the settings). */
    if(BANK && S.f === 'q' && !isReview(S) && /^practice\.html/.test(goEl.getAttribute('href'))){
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
