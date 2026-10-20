/* AP® Statistics Exams (docs/apstat-spec.md decisions 6 and 7; forked from
   AP® Calculus AB's calculus/assets/pages/exams.js).

     Unit test       one unit, weighted by topic: every published topic of the
                     unit gets an equal share of the questions, stimulus sets
                     kept whole and in authored order. 15, 25 or all.
     Practice exam   the fully digital format of May 2027, in two timed
                     sections: Section I, 42 four-option multiple-choice
                     questions in 90 minutes (drawn from every unit in
                     proportion to the midpoint of its exam weight range,
                     sets kept whole); Section II, 4 free-response questions
                     in 90 minutes, 10 points each (40). A graphing
                     calculator is allowed in both. A section, once ended,
                     cannot be reopened. Then rubric self-scoring, point by
                     point.

   When the bank cannot fill a full exam, the setup says so plainly (what a
   full exam needs, what exists per unit and part, and per free-response
   part) and offers a shorter exam from what exists, labeled as such; no
   count is invented.

   Timing: a visible clock per part. Section I and unit tests can be paused
   (an accessibility aid; the question hides while paused); Section II
   cannot, like the real exam. Extra-time settings and an untimed mode.

   An exam grades silently (ApStatQuestions opts.exam, record: false): the
   first tap on an answer locks it in. Every answer is recorded through
   ApStatCore when the exam ends (A&P decision 42), an unanswered question as
   a miss, so misses reach review. Results: MCQ score, FRQ self-score, by
   unit and by skill and practice. No readiness band and nothing labeled an
   AP® score (spec decision 6: 2027 is a new format with no score data).
   History goes to apstat_prefs_v1
   .examHistory (the dashboard reads it).

     Fixed exams     two complete practice exams written to the real format
                     (assets/exams/forms.json, docs/apstat-architecture.md,
                     "Practice exams"): the same 42 questions in a set
                     order, weighted by unit, with one probability set and
                     one regression set of 3, and the same 4 free-response questions,
                     for every student, so a score can be compared with a
                     friend's or a second try. Some questions appear only in
                     these exams (assets/exams/items.json). ?mode=full&form=1.

     Mixed timed set the cram kit's timed sets (spec decision 26): 10, 20 or
                     30 questions from every published unit by the midpoint
                     of its exam weight (as Section I), sets whole, at the
                     exam's pace (90 min for 42 questions, about 2 min 9 s
                     each); then the same review
                     with explanations. Opened from cram.html as
                     ?mode=mixed&n=10|20|30.

   Free tier: one exam of any kind (ApStatCore.freeExam), used when it starts;
   an exam in progress can always be finished. Mixed timed sets are part of
   the cram kit instead: Premium (ApStatCore.allowed('cram')), and they never
   use the free exam. */
(function(){
  var BASE = window.ApStatBase || '';
  var app = document.getElementById('app');
  if(!app) return;
  var hero = document.querySelector('.page-head, .stat-hero');
  var CUR = window.ApStatCurriculum || { units: [], topics: [], practices: [] };
  var Core = window.ApStatCore, Q = window.ApStatQuestions;
  var PREFS = 'apstat_prefs_v1';
  // The May 2027 sections (docs/apstat-research/framework.md, section 4): one
  // part each, no calculator split. A part with no key is a whole section.
  // calc is false for both so every item (none carries a calc flag) fits.
  var MCQ_TOTAL = 42;
  var MCQ_PARTS = [{ key: '', n: 42, sec: 90 * 60, calc: false }];
  var FRQ_PARTS = [{ key: '', n: 4, sec: 90 * 60, calc: false }];
  var FRQ_POINTS = 10;
  // A question's time at the exam's pace.
  function qSec(){ return MCQ_PARTS[0].sec / MCQ_PARTS[0].n; }
  function qsSec(qs){ return qs.reduce(function(s, q){ return s + qSec(q); }, 0); }
  var MCQ_SEC = 90 * 60 / 42;   // the pace, for set summaries
  // The exam's own graphing calculator is in Bluebook; here, a free one in a new tab.
  var DESMOS = 'https://www.desmos.com/calculator';
  function calcNotice(){
    return '<p class="cx-notice stat-ex-calc is-on"><b>Calculator allowed.</b> A graphing calculator with statistics functions is allowed in both sections. Use your own or the free <a href="' + DESMOS + '" target="_blank" rel="noopener">Desmos graphing calculator<span class="sr-only"> (opens in a new tab)</span></a> (on the real exam, Desmos is built into the test app). The reference sheet is on the <a href="' + BASE + 'formula-sheet.html">formulas page</a>. Show the work: name the procedure or distribution, the values substituted, then the answer.</p>';
  }
  var TIMINGS = [
    { id: 'std', name: 'Standard time', k: 1 }, { id: 'x15', name: 'Extra time (1.5×)', k: 1.5 },
    { id: 'x2', name: 'Double time', k: 2 }, { id: 'off', name: 'Untimed', k: 0 }
  ];
  var LEVEL_NAME = { recall: 'Recall', apply: 'Apply', analyze: 'Analyze' };

  function esc(s){ return String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
  function html(s){ return String(s == null ? '' : s); }
  function plural(n, w, ws){ return n + ' ' + (n === 1 ? w : (ws || w + 's')); }
  function shuffle(a){ return Q ? Q.shuffle(a) : a.slice(); }
  function byId(list){ var o = {}; list.forEach(function(x){ o[x.id] = x; }); return o; }
  function pctOf(c, n){ return n ? Math.round(c / n * 100) : 0; }
  function mmss(ms){ var s = Math.max(0, Math.ceil(ms / 1000)), h = Math.floor(s / 3600), m = Math.floor(s / 60) % 60; s = s % 60; return (h ? h + ':' + (m < 10 ? '0' : '') : '') + m + ':' + (s < 10 ? '0' : '') + s; }
  function minutes(sec){ var m = Math.round(sec / 6) / 10; return (m % 1 ? m.toFixed(1) : m) + ' min'; }
  var TOPIC = byId(CUR.topics), UNIT = byId(CUR.units);
  var PRACTICE = {}; (CUR.practices || []).forEach(function(p){ PRACTICE[String(p.id)] = p; });
  function unitName(u){ var c = UNIT[u]; return c ? (c.part === 'course' ? 'Unit ' + c.n + ': ' : '') + c.title : u; }
  function prefs(){ try{ return JSON.parse(localStorage.getItem(PREFS) || '{}') || {}; }catch(e){ return {}; } }
  function setPref(k, v){ try{ var p = prefs(); p[k] = v; localStorage.setItem(PREFS, JSON.stringify(p)); }catch(e){} }

  var bank = null, blocks = null, frqList = [], K = null, run = null;
  var FORMS = [], OWN = { items: [], stimuli: {} };
  var cfg = { kind: 'full', unit: '', len: 25, n: 20, timing: 'std', form: '' };
  function formById(id){ return FORMS.filter(function(f){ return f.id === id; })[0] || null; }
  var MIXED = [10, 20, 30];
  function cramOk(){ return !Core.allowed || Core.allowed('cram'); }

  function kit(){
    if(window.ApStatFrq) return Promise.resolve(window.ApStatFrq);
    return new Promise(function(res){
      var s = document.createElement('script');
      s.src = BASE + 'assets/pages/frq-kit.js';
      s.onload = function(){ res(window.ApStatFrq || null); };
      s.onerror = function(){ res(null); };
      document.head.appendChild(s);
    });
  }

  /* ------------------------------------------------------ planning */

  function makeBlocks(list){
    var out = [];
    list.forEach(function(q){
      var last = out[out.length - 1];
      if(q.stimulus && last && last.stimulus === q.stimulus && last.topic === q.topic && last.calc === !!q.calc) last.items.push(q);
      else out.push({ stimulus: q.stimulus || null, items: [q], topic: q.topic, unit: q.unit, calc: !!q.calc });
    });
    return out;
  }
  function courseUnits(){ return CUR.units.filter(function(u){ return u.part === 'course'; }); }
  function builtUnits(){ var h = {}; CUR.topics.forEach(function(t){ if(t.built && t.qn) h[t.unit] = 1; }); return courseUnits().filter(function(u){ return h[u.id]; }); }
  function unitBlocks(u, calc){ return blocks.filter(function(b){ return b.unit === u && (calc === undefined || b.calc === calc); }); }
  function size(bs){ return bs.reduce(function(n, b){ return n + b.items.length; }, 0); }

  /* About `want` questions from these blocks, sets whole: sets first while
     they fit, then standalone questions; a set may take it one or two over
     only when nothing else is left. */
  function fill(bs, want){
    var sets = shuffle(bs.filter(function(b){ return b.stimulus; })), singles = shuffle(bs.filter(function(b){ return !b.stimulus; }));
    var out = [], n = 0;
    sets.forEach(function(b){ if(n + b.items.length <= want){ out.push(b); n += b.items.length; } });
    singles.forEach(function(b){ if(n < want){ out.push(b); n++; } });
    if(n < want){ var rest = sets.filter(function(b){ return out.indexOf(b) < 0; }).sort(function(a, b){ return a.items.length - b.items.length; }); if(rest[0] && n + rest[0].items.length - want <= 2){ out.push(rest[0]); } }
    return out;
  }
  /* Largest-remainder split of n over keys by weight, capped by what exists. */
  function split(n, weights, caps){
    var keys = Object.keys(weights), tw = keys.reduce(function(s, k){ return s + weights[k]; }, 0), out = {}, sum = 0;
    if(!tw) return out;
    keys.forEach(function(k){ out[k] = Math.min(caps ? caps[k] : Infinity, Math.floor(n * weights[k] / tw)); sum += out[k]; });
    var guard = 0;
    while(sum < n && guard++ < 1000){
      var best = null;
      keys.forEach(function(k){ if((caps ? out[k] < caps[k] : true) && (best === null || (n * weights[k] / tw - out[k]) > (n * weights[best] / tw - out[best]))) best = k; });
      if(best === null) break;
      out[best]++; sum++;
    }
    return out;
  }

  /* Unit test: an equal share for every published topic of the unit. */
  function unitPlan(u, len){
    var ts = CUR.topics.filter(function(t){ return t.unit === u && t.built && t.qn; });
    var have = {}, w = {};
    ts.forEach(function(t){ have[t.id] = size(blocks.filter(function(b){ return b.topic === t.id; })); w[t.id] = 1; });
    var total = ts.reduce(function(s, t){ return s + have[t.id]; }, 0);
    var n = len ? Math.min(len, total) : total;
    return { topics: ts, alloc: split(n, w, have), n: n, total: total };
  }
  function mid(u){ return Array.isArray(u.weight) ? (u.weight[0] + u.weight[1]) / 2 : 0; }
  /* Mixed timed set: n questions over the published units by exam weight. */
  function mixedPlan(n){
    var w = {}, have = {};
    builtUnits().forEach(function(u){ w[u.id] = mid(u) || 1; have[u.id] = size(unitBlocks(u.id)); });
    var total = Object.keys(have).reduce(function(s, k){ return s + have[k]; }, 0);
    n = Math.min(n, total);
    return { alloc: split(n, w, have), n: n, units: builtUnits() };
  }

  /* The full exam: what it needs, what exists, and the exam we can give.
     Section I is one part split over the units by exam weight; Section II
     needs 4 FRQs (one of each type when the bank has them). */
  function examPlan(){
    var us = courseUnits(), w = {};
    us.forEach(function(u){ w[u.id] = mid(u); });
    var parts = MCQ_PARTS.map(function(P){
      var have = {}; us.forEach(function(u){ have[u.id] = size(unitBlocks(u.id, P.calc)); });
      var need = split(P.n, w);
      var full = us.length && us.every(function(u){ return have[u.id] >= need[u.id]; });
      var alloc;
      if(full) alloc = need;
      else {
        // Shorter part: each unit with questions keeps its full-exam share,
        // capped by what exists; units with none are left out.
        var bw = {}, cap = {};
        us.forEach(function(u){ if(have[u.id]){ bw[u.id] = w[u.id] || 1; cap[u.id] = have[u.id]; } });
        var share = Object.keys(bw).reduce(function(s2, k){ return s2 + (need[k] || 0); }, 0);
        alloc = split(Math.max(Object.keys(bw).length ? 1 : 0, share), bw, cap);
      }
      var n = Object.keys(alloc).reduce(function(s2, k){ return s2 + alloc[k]; }, 0);
      return { key: P.key, calc: P.calc, need: need, have: have, alloc: alloc, full: !!full, n: n };
    });
    var pools = FRQ_PARTS.map(function(){ return frqList.slice(); });
    var frqParts = FRQ_PARTS.map(function(P, i){ return { key: P.key, calc: P.calc, need: P.n, have: pools[i].length, n: Math.min(P.n, pools[i].length) }; });
    var mcqFull = parts.every(function(p){ return p.full; }), frqFull = frqParts.every(function(p){ return p.have >= p.need; });
    return { units: us, parts: parts, frqParts: frqParts, pools: pools, full: mcqFull && frqFull, mcqFull: mcqFull, frqFull: frqFull,
      mcqN: parts.reduce(function(a, p){ return a + p.n; }, 0), frqN: frqParts.reduce(function(a, p){ return a + p.n; }, 0) };
  }

  /* ------------------------------------------------------ setup */

  function view(name){ if(hero) hero.hidden = name !== 'setup'; app.setAttribute('data-view', name); window.scrollTo(0, 0); }
  function timing(){ return TIMINGS.filter(function(t){ return t.id === cfg.timing; })[0]; }
  function timingField(){
    return '<label class="cx-field"><span>Timing</span><select name="timing">' + TIMINGS.map(function(t){ return '<option value="' + t.id + '"' + (t.id === cfg.timing ? ' selected' : '') + '>' + t.name + '</option>'; }).join('') + '</select></label>';
  }
  function freeExamHtml(fe){
    if(fe.unlimited) return '';
    if(!fe.available) return Core.gate('exams', 'exams');
    return '<p class="cx-notice stat-ex-free"><b>Your free exam.</b> One exam is free: starting any exam below uses it, and once started you can always finish it. ' + (Core.badge ? Core.badge() : '') + '</p>';
  }
  // Section II time for a list of FRQs: each part's time, in proportion when a part is short.
  function frqSec(fs){ return FRQ_PARTS[0].sec * fs.length / FRQ_PARTS[0].n; }

  function panelHtml(){
    if(cfg.kind === 'mixed'){
      if(!cramOk()) return Core.gate('cram', 'cram-sets');
      var mp = mixedPlan(cfg.n);
      return '<fieldset class="cx-group"><legend>Questions</legend><div class="cx-pills">' + MIXED.map(function(v){
          return '<label class="cx-pill"><input type="radio" name="n" value="' + v + '"' + (cfg.n === v ? ' checked' : '') + '><span>' + v + '</span></label>';
        }).join('') + '</div></fieldset>' + timingField() +
        '<div class="cx-note stat-ex-note"><p><b>How this set is drawn.</b> From every published unit by the middle of its exam weight range, with stimulus sets kept whole (so a set can run a question or two long). Timed at the exam\'s pace: ' + minutes(MCQ_PARTS[0].sec / MCQ_PARTS[0].n) + ' a question.</p><ul class="stat-ex-alloc">' +
          mp.units.map(function(u){ return '<li><span>' + esc(unitName(u.id)) + '</span><b>' + (mp.alloc[u.id] || 0) + '</b></li>'; }).join('') + '</ul></div>';
    }
    if(cfg.kind === 'unit'){
      var us = builtUnits(), p = unitPlan(cfg.unit, cfg.len);
      return '<label class="cx-field"><span>Unit</span><select name="unit">' + us.map(function(u){ return '<option value="' + u.id + '"' + (u.id === cfg.unit ? ' selected' : '') + '>' + esc(unitName(u.id)) + '</option>'; }).join('') + '</select></label>' +
        '<fieldset class="cx-group"><legend>Length</legend><div class="cx-pills">' + [15, 25, 0].map(function(v){
          return '<label class="cx-pill"><input type="radio" name="len" value="' + v + '"' + (cfg.len === v ? ' checked' : '') + '><span>' + (v || 'All ' + p.total) + '</span></label>';
        }).join('') + '</div></fieldset>' + timingField() +
        '<div class="cx-note stat-ex-note"><p><b>How this test is split.</b> Every published topic in the unit gets an equal share; stimulus sets stay whole.</p><ul class="stat-ex-alloc">' +
          p.topics.map(function(t){ return '<li><span>' + esc((t.ced ? t.ced + ' ' : '') + t.title) + '</span><b>' + (p.alloc[t.id] || 0) + '</b></li>'; }).join('') + '</ul></div>';
    }
    var t = timing();
    var formPick = FORMS.length ? '<fieldset class="cx-group"><legend>Which exam</legend><div class="cx-pills">' +
      FORMS.map(function(f){ return '<label class="cx-pill"><input type="radio" name="form" value="' + f.id + '"' + (cfg.form === f.id ? ' checked' : '') + '><span>' + esc(f.title) + '</span></label>'; }).join('') +
      '<label class="cx-pill"><input type="radio" name="form" value=""' + (cfg.form ? '' : ' checked') + '><span>New mixed exam</span></label></div></fieldset>' : '';
    var fm = formById(cfg.form);
    var fmt = '<p>Section I: 42 multiple-choice questions with four options in 90 min, including one set of 3 on probability and one set of 3 on regression. Section II: 4 free-response questions in 90 min, each worth 10 points: collecting data, analyzing data, an inference question, and a question across several units. A calculator is allowed throughout. Then you score your free responses with the rubrics.</p>';
    if(fm){
      var fu = {}; fm.mcq.forEach(function(b){ b.forEach(function(id){ var q = byIdQ(id); if(q) fu[q.unit] = (fu[q.unit] || 0) + 1; }); });
      return formPick + '<div class="cx-note stat-ex-note"><p><b>' + esc(fm.title) + ': a complete exam in the real format.</b> The same questions in a set order for everyone, so you can compare a second try.</p>' + fmt +
        '<h2 class="stat-ex-h3">Section I, by unit</h2><ul class="stat-ex-areas">' + courseUnits().map(function(u){ return '<li class="is-on"><span>' + esc(unitName(u.id)) + (Array.isArray(u.weight) ? ' <span class="stat-small">(' + u.weight[0] + '–' + u.weight[1] + '%)</span>' : '') + '</span><b>' + (fu[u.id] || 0) + '</b></li>'; }).join('') + '</ul></div>' +
        timingField() + '<p class="stat-small">' + (t.k ? 'Section I: ' + minutes(90 * 60 * t.k) + '. Section II: ' + minutes(90 * 60 * t.k) + (t.k > 1 ? ', with extra time' : '') + '.' : 'Untimed: the clock counts up instead of down.') + '</p>';
    }
    var plan = examPlan();
    var unitRows = plan.units.map(function(u){
      var cells = plan.parts.map(function(p){ return plan.mcqFull ? p.need[u.id] : (p.alloc[u.id] || 0) + '/' + p.need[u.id]; });
      var any = plan.parts.some(function(p){ return p.have[u.id]; });
      return '<li class="' + (any ? 'is-on' : 'is-off') + '"><span>' + esc(unitName(u.id)) + (Array.isArray(u.weight) ? ' <span class="stat-small">(' + u.weight[0] + '–' + u.weight[1] + '%)</span>' : '') + '</span><b>' + cells[0] + '</b></li>';
    }).join('');
    var partRows = plan.frqParts.map(function(p){
      return '<li class="' + (p.have ? 'is-on' : 'is-off') + '"><span>Free response <span class="stat-small">(' + p.need + ' &times; ' + FRQ_POINTS + ' points)</span></span><b>' + (p.have >= p.need ? 'ready' : p.have + ' of ' + p.need + ' written') + '</b></li>';
    }).join('');
    return formPick + '<div class="cx-note stat-ex-note">' +
      (plan.full ? '<p><b>The full May 2027 format.</b> Each part is drawn from every unit by the midpoint of its exam weight, with stimulus sets kept whole.</p>' + fmt
        : '<p><b>Not enough questions for a full practice exam yet.</b> A full exam needs 42 multiple-choice questions spread over ' + (plan.units.length === 1 ? 'the course\'s one unit' : 'all ' + plan.units.length + ' units') + ' by exam weight, and 4 free-response questions. ' +
          'Today the bank can give a <b>shorter exam</b>: ' + plural(plan.mcqN, 'multiple-choice question') + (plan.frqN ? ' and ' + plural(plan.frqN, 'free-response question') : ' and no free-response section') + ', each unit keeping the share it would have in a full exam. Units with no questions yet are left out, not filled in from other units.</p>') +
      '<h2 class="stat-ex-h3">Section I, by unit</h2><ul class="stat-ex-areas">' + unitRows + '</ul>' +
      '<h2 class="stat-ex-h3">Section II</h2><ul class="stat-ex-areas">' + partRows + '</ul></div>' +
      timingField() +
      '<p class="stat-small">' + (t.k ? 'Section I: ' + minutes(plan.parts.reduce(function(s2, p){ return s2 + MCQ_PARTS[0].sec * p.n / MCQ_PARTS[0].n; }, 0) * t.k) + (plan.frqN ? '. Section II: ' + minutes(plan.frqParts.reduce(function(s2, p){ return s2 + FRQ_PARTS[0].sec * p.n / FRQ_PARTS[0].n; }, 0) * t.k) : '') + (t.k > 1 ? ', with extra time' : '') + '.' : 'Untimed: the clock counts up instead of down.') + '</p>';
  }
  function summary(){
    if(cfg.kind === 'mixed'){ if(!cramOk()) return 'Mixed timed sets are part of Premium.'; var m = mixedPlan(cfg.n); return m.n ? 'Mixed timed set: about ' + plural(m.n, 'question') + (timing().k ? ', about ' + minutes(m.n * MCQ_SEC * timing().k) : ', untimed') + '.' : 'No questions are published yet.'; }
    if(cfg.kind === 'unit'){ var p = unitPlan(cfg.unit, cfg.len); return p.n ? plural(p.n, 'question') + (timing().k ? ', about ' + minutes(p.n * MCQ_SEC * timing().k) : ', untimed') + '.' : 'No questions are published for this unit yet.'; }
    if(formById(cfg.form)) return formById(cfg.form).title + ': 42 multiple-choice questions + 4 free-response questions.';
    var plan = examPlan();
    if(!plan.mcqN) return 'No questions are published yet.';
    return (plan.full ? 'Full practice exam: ' : 'Shorter practice exam: ') + plural(plan.mcqN, 'multiple-choice question') + (plan.frqN ? ' + ' + plural(plan.frqN, 'free-response question') : '') + '.';
  }

  /* The same rail as Practice and Review (assets/course/study.js). */
  function examRail(){
    var d = Core.load(), answered = 0, topics = {};
    Object.keys(d.q || {}).forEach(function(k){ var r = d.q[k]; if(r.n) answered++; if(r && r.t) topics[r.t] = 1; });
    Object.keys(d.lessons || {}).forEach(function(t){ topics[t] = 1; });
    var due = Core.reviewCount ? Core.reviewCount() : 0, miss = (Core.missed ? Core.missed() : []).length;
    return LevlStudy.rail({
      stats: [
        ['Answered', answered, answered ? 'questions and tool items' : 'nothing yet'],
        ['Due for review', due, due ? 'waiting in your queue' : 'nothing due now', due ? 'is-due' : ''],
        ['To fix', miss, miss ? 'missed, not yet right' : 'no open misses'],
        ['Topics studied', Object.keys(topics).length, 'lessons or questions']
      ],
      due: { n: due, href: BASE + 'review.html', pill: Core.badge ? Core.badge() : '' },
      links: [
        { href: BASE + 'practice.html', title: 'Practice', sub: 'Untimed, with feedback after every answer.' },
        { href: BASE + 'flashcards.html', title: 'Flashcards', sub: 'Spaced cards from the glossary.' }
      ]
    });
  }

  function renderSetup(){
    view('setup');
    if(!cfg.unit && builtUnits()[0]) cfg.unit = builtUnits()[0].id;
    var fe = Core.freeExam ? Core.freeExam() : { unlimited: true, available: true };
    var n1 = '<span class="cx-step-n" aria-hidden="true">';
    app.innerHTML = '<div class="cx-body has-rail"><div class="cx-main">' + freeExamHtml(fe) +
      '<form class="cx-card cx-builder stat-pr-setup stat-ex-setup" novalidate aria-label="Set up an exam">' +
      '<fieldset class="cx-step"><legend>' + n1 + '1</span>Choose an exam</legend><div class="cx-choices">' +
        '<label class="cx-choice"><input type="radio" name="kind" value="full"' + (cfg.kind === 'full' ? ' checked' : '') + '><span><b>Practice exam</b><span>The May 2027 format: multiple choice, then free response, scored with rubrics.</span></span></label>' +
        '<label class="cx-choice"><input type="radio" name="kind" value="unit"' + (cfg.kind === 'unit' ? ' checked' : '') + (builtUnits().length ? '' : ' disabled') + '><span><b>Unit test</b><span>One unit, weighted by topic.</span></span></label>' +
        '<label class="cx-choice"><input type="radio" name="kind" value="mixed"' + (cfg.kind === 'mixed' ? ' checked' : '') + (builtUnits().length ? '' : ' disabled') + '><span><b>Mixed timed set</b><span>10, 20 or 30 questions from every unit at exam pace (part of the cram kit).</span></span></label>' +
      '</div></fieldset><div class="cx-step"><h2 class="cx-step-h">' + n1 + '2</span>Settings</h2><div class="stat-ex-panel">' + panelHtml() + '</div></div>' +
      '<div class="cx-start"><p class="cx-sum"><span class="stat-pr-avail" aria-live="polite"></span>' +
      '<small>No feedback until the end. Your first tap locks an answer in; you can skip and come back. Then you review every question with its explanation, and misses go to your review queue.</small></p>' +
      '<button type="submit" class="btn-press stat-pr-start">Start</button></div></form>' +
      historyHtml() + '</div>' + examRail() + '</div>';
    var form = app.querySelector('form');
    function refresh(){
      var s = summary(), el = app.querySelector('.stat-pr-avail');
      el.textContent = s;
      var btn = app.querySelector('.stat-pr-start');
      btn.disabled = (cfg.kind === 'mixed' ? !cramOk() : !fe.available) || /^No /.test(s);
      btn.textContent = cfg.kind === 'mixed' ? 'Start the timed set' : cfg.kind === 'unit' ? 'Start the unit test' : formById(cfg.form) ? 'Start ' + formById(cfg.form).title.toLowerCase() : (examPlan().full ? 'Start the practice exam' : 'Start the shorter exam');
    }
    form.addEventListener('change', function(e){
      var n = e.target.name, v = e.target.value;
      if(n === 'kind') cfg.kind = v;
      if(n === 'unit') cfg.unit = v;
      if(n === 'len') cfg.len = +v;
      if(n === 'n') cfg.n = +v;
      if(n === 'form') cfg.form = v;
      if(n === 'timing'){ cfg.timing = v; setPref('examTiming', v); }
      if(n === 'kind' || n === 'unit' || n === 'len' || n === 'n' || n === 'timing' || n === 'form'){
        app.querySelector('.stat-ex-panel').innerHTML = panelHtml();
        var again = form.querySelector('[name="' + n + '"]' + (e.target.type === 'radio' ? '[value="' + v + '"]' : '')); if(again) again.focus();
      }
      refresh();
    });
    form.addEventListener('submit', function(e){ e.preventDefault(); begin(); });
    refresh();
  }
  function historyHtml(){
    var h = (prefs().examHistory || []).slice(-5).reverse();
    if(!h.length) return '';
    return '<h2 class="stat-ex-h2">Your recent exams</h2><ul class="stat-pr-next-list">' + h.map(function(x){
      return '<li><div><b>' + esc(x.label) + '</b><span class="stat-small">' + new Date(x.ts).toLocaleDateString() + ' &middot; multiple choice ' + x.mcq.c + '/' + x.mcq.n +
        (x.frq && x.frq.of ? ' &middot; free response ' + x.frq.got + '/' + x.frq.of : '') + '</span></div></li>';
    }).join('') + '</ul>';
  }

  /* ------------------------------------------------------ building */

  /* A question of a fixed exam, as a stub: from the bank index, or exam-only. */
  function byIdQ(id){
    for(var i = 0; i < bank.length; i++) if(bank[i].id === id) return bank[i];
    for(var j = 0; j < OWN.items.length; j++) if(OWN.items[j].id === id) return OWN.items[j];
    return null;
  }
  function beginForm(f){
    var ids = []; f.mcq.forEach(function(b){ b.forEach(function(id){ ids.push(id); }); });
    var own = {}; OWN.items.forEach(function(q){ own[q.id] = q; });
    var btn = app.querySelector('.stat-pr-start');
    if(btn){ btn.disabled = true; btn.textContent = 'Loading questions…'; }
    var fromBank = ids.filter(function(id){ return !own[id]; }).map(function(id){ return byIdQ(id) || id; });
    Promise.all([Core.loadQuestions(BASE, fromBank), Promise.all(f.frq.map(function(id){ return K.load(BASE, id); }))]).then(function(r){
      var by = {}; r[0].forEach(function(q){ by[q.id] = q; });
      var qs = ids.map(function(id){
        if(by[id]) return by[id];
        var q = own[id]; if(!q) return null;
        q = JSON.parse(JSON.stringify(q)); q.own = true;
        if(q.stimulus && OWN.stimuli[q.stimulus]) q.stim = OWN.stimuli[q.stimulus];
        return q;
      });
      if(qs.some(function(q){ return !q; })) throw new Error('missing questions');
      if(Core.freeExam && !Core.freeExam().use()){ renderSetup(); return; }
      startExam(qs, r[1], f.title, { kind: 'full', form: f.id }, timing().k);
    }).catch(function(){
      if(btn){ btn.disabled = false; btn.textContent = 'Start'; }
      var msg = app.querySelector('.stat-pr-avail'); if(msg) msg.textContent = 'The exam questions did not load. Check your connection and try again.';
    });
  }
  /* FRQs for a part: distinct types first, then any. */
  function pickFrqs(pool, n){
    var seen = {}, first = [], rest = [];
    shuffle(pool.slice()).forEach(function(f){ (seen[f.type] ? rest : first).push(f); seen[f.type] = 1; });
    return first.concat(rest).slice(0, n);
  }
  function begin(){
    var picked = [], label, meta = { kind: cfg.kind }, frqPick = [];
    if(cfg.kind === 'full' && formById(cfg.form)) return beginForm(formById(cfg.form));
    if(cfg.kind === 'unit'){
      var up = unitPlan(cfg.unit, cfg.len);
      up.topics.forEach(function(t){ picked = picked.concat(fill(blocks.filter(function(b){ return b.topic === t.id; }), up.alloc[t.id] || 0)); });
      label = 'Unit test: ' + unitName(cfg.unit); meta.unit = cfg.unit;
      picked = shuffle(picked);
    } else if(cfg.kind === 'mixed'){
      if(!cramOk()) return;
      var mp = mixedPlan(cfg.n);
      Object.keys(mp.alloc).forEach(function(u){ picked = picked.concat(fill(unitBlocks(u), mp.alloc[u])); });
      label = 'Mixed timed set';
      picked = shuffle(picked);
    } else {
      var plan = examPlan();
      // Section I, shuffled with sets kept whole.
      plan.parts.forEach(function(p){
        var part = [];
        Object.keys(p.alloc).forEach(function(u){ part = part.concat(fill(unitBlocks(u, p.calc), p.alloc[u])); });
        picked = picked.concat(shuffle(part));
      });
      frqPick = plan.frqParts.reduce(function(out, p, i){ return out.concat(pickFrqs(plan.pools[i], p.n)); }, []);
      meta.partial = !plan.full;
      label = plan.full ? 'Practice exam' : 'Shorter practice exam';
    }
    if(!picked.length) return;
    var stubsList = []; picked.forEach(function(b){ b.items.forEach(function(q){ stubsList.push(q); }); });
    var btn = app.querySelector('.stat-pr-start');
    if(btn){ btn.disabled = true; btn.textContent = 'Loading questions…'; }
    Promise.all([Core.loadQuestions(BASE, stubsList), Promise.all(frqPick.map(function(f){ return K.load(BASE, f.id); }))]).then(function(r){
      var full = r[0];
      if(full.length !== stubsList.length) throw new Error('missing questions');
      if(cfg.kind !== 'mixed' && Core.freeExam && !Core.freeExam().use()){ renderSetup(); return; }
      startExam(full, r[1], label, meta, timing().k);
    }).catch(function(){
      if(btn){ btn.disabled = false; btn.textContent = 'Start'; }
      var msg = app.querySelector('.stat-pr-avail'); if(msg) msg.textContent = 'The exam questions did not load. Check your connection and try again.';
    });
  }

  /* An exam is a list of timed parts. A practice exam has Section I, then
     Section II, one part each; a unit test or a timed set is one part. Empty
     parts are dropped. */
  function startExam(qs, frqs, label, meta, k){
    var full = meta.kind === 'full';
    var mcqParts = full ? MCQ_PARTS.map(function(P){ return { key: P.key, calc: P.calc, qs: qs, sec: P.sec / P.n }; }).filter(function(p){ return p.qs.length; })
      : [{ key: null, calc: null, qs: qs }];
    var frqParts = FRQ_PARTS.map(function(P){ return { key: P.key, calc: P.calc, frqs: (frqs || []).slice(), sec: P.sec / P.n }; }).filter(function(p){ return p.frqs.length; });
    run = { label: label, meta: meta, k: k, res: {}, rows: [], startedAt: Date.now(), done: false, section: 1,
      mcqParts: mcqParts, frqParts: frqParts, frqs: frqParts.reduce(function(o, p){ return o.concat(p.frqs); }, []), answers: [], pi: 0 };
    // Where the exam is left halfway, if it is (assets/analytics.js exam-quit).
    if(window.LevlAnalytics && window.LevlAnalytics.examStart){
      window.LevlAnalytics.examStart('apstat', meta && meta.kind || 'exam', mcqParts.reduce(function(n, p){ return n + p.qs.length; }, 0), function(){ return run && run.res ? Object.keys(run.res).length : 0; });
    }
    window.addEventListener('beforeunload', guard);
    startSectionOne(0);
  }

  /* ------------------------------------------------------ Section I */

  function clockHtml(limit, pausable){
    return '<div class="stat-ex-clock"><span class="stat-ex-time" role="timer" aria-label="' + (limit ? 'Time left' : 'Time used') + '">' + (limit ? mmss(limit) : '0:00') + '</span>' +
      (limit ? '' : '<span class="stat-small">Untimed</span>') + (pausable && limit ? '<button type="button" class="btn-outline stat-ex-pause" aria-pressed="false">Pause</button>' : '') + '</div>';
  }
  function startClock(limit, onEnd){
    run.limit = limit; run.left = limit; run.used = 0; run.last = Date.now(); run.paused = false; run.warned = {};
    clearInterval(run.tick);
    run.tick = setInterval(function(){
      if(!run || run.done) return;
      var t = Date.now(), d = t - run.last; run.last = t;
      if(run.paused) return;
      run.used += d;
      var el = app.querySelector('.stat-ex-time');
      if(!run.limit){ if(el) el.textContent = mmss(run.used); return; }
      run.left -= d;
      if(el){ el.textContent = mmss(run.left); el.classList.toggle('is-low', run.left < 60000); }
      [[600000, '10 minutes left.'], [300000, '5 minutes left.'], [60000, '1 minute left.']].forEach(function(w){
        if(run.limit > w[0] * 2 && run.left <= w[0] && !run.warned[w[0]]){ run.warned[w[0]] = 1; var sr = app.querySelector('.stat-ex-sr'); if(sr) sr.textContent = w[1]; }
      });
      if(run.left <= 0){ clearInterval(run.tick); onEnd(true); }
    }, 250);
  }
  // A flag set or cleared mid exam repaints the question map (assets/course/flags.js).
  document.addEventListener('levl:flag', function(){ if(run && !run.done && run.qs && app.querySelector('.stat-ex-navcount')) status(); });
  function guard(e){ if(run && !run.done){ e.preventDefault(); e.returnValue = ''; } }

  function partName(sec, p){ return p.key ? 'Section ' + sec + ', Part ' + p.key : 'Section ' + (sec === 1 ? 'I' : 'II'); }
  function startSectionOne(pi){
    var P = run.mcqParts[pi], qs = P.qs, frqs = run.frqs, label = run.label, k = run.k;
    run.pi = pi; run.qs = qs; run.i = 0; run.els = {}; run.section = 1;
    view('run');
    var limit = k ? Math.round((P.key ? P.sec * qs.length : qsSec(qs)) * k * 1000) : 0;
    var more = pi < run.mcqParts.length - 1 || frqs.length;
    var endWord = P.key ? 'End Part ' + P.key : frqs.length ? 'End Section I' : 'Finish exam';
    app.innerHTML = '<div class="stat-ex-run">' +
      '<div class="stat-ex-top"><div class="stat-ex-title"><span class="stat-pr-label">' + esc(label) + (P.key ? ' &middot; ' + partName(1, P) : frqs.length ? ' &middot; Section I' : '') + '</span><span class="stat-small stat-ex-status" aria-live="polite"></span></div>' + clockHtml(limit, true) + '</div>' +
      calcNotice() +
      '<p class="stat-ex-sr" aria-live="assertive"></p>' +
      '<details class="stat-ex-navwrap"' + (window.matchMedia && window.matchMedia('(min-width: 700px)').matches ? ' open' : '') + '><summary>All questions <span class="stat-ex-navcount"></span></summary>' +
      '<nav class="stat-ex-nav" aria-label="Questions">' + qs.map(function(q, i){ return '<button type="button" data-go="' + i + '" aria-label="Question ' + (i + 1) + ', not answered">' + (i + 1) + '</button>'; }).join('') + '</nav></details>' +
      '<div class="stat-ex-paused" hidden><p><b>Paused.</b> The question is hidden while the clock is stopped.</p><button type="button" class="btn-press stat-ex-resume">Resume</button></div>' +
      '<h2 class="sr-only">' + (P.key ? partName(1, P) : 'Section I') + ' questions</h2><div class="stat-ex-stage"></div>' +
      '<div class="stat-ex-controls"><button type="button" class="btn-outline stat-ex-prev">Previous</button><button type="button" class="btn-press stat-ex-next">Next</button><button type="button" class="btn-outline stat-ex-finish">' + endWord + '</button></div>' +
      '<div class="stat-ex-confirm" hidden role="alertdialog" aria-labelledby="stat-ex-confirm-t"><p id="stat-ex-confirm-t"></p><div class="cx-flaglist" hidden></div><button type="button" class="btn-press stat-ex-yes">' + (more ? endWord : 'Finish now') + '</button> <button type="button" class="btn-outline stat-ex-no">Keep working</button></div>' +
    '</div>';
    app.querySelector('.stat-ex-nav').addEventListener('click', function(e){ var b = e.target.closest('[data-go]'); if(b) go(+b.getAttribute('data-go')); });
    app.querySelector('.stat-ex-prev').addEventListener('click', function(){ go(run.i - 1); });
    app.querySelector('.stat-ex-next').addEventListener('click', nextUnanswered);
    app.querySelector('.stat-ex-finish').addEventListener('click', askFinish);
    app.querySelector('.stat-ex-yes').addEventListener('click', function(){ endSectionOne(false); });
    app.querySelector('.stat-ex-no').addEventListener('click', function(){ app.querySelector('.stat-ex-confirm').hidden = true; app.querySelector('.stat-ex-finish').focus(); });
    var pb = app.querySelector('.stat-ex-pause');
    if(pb){ pb.addEventListener('click', function(){ pause(!run.paused); }); app.querySelector('.stat-ex-resume').addEventListener('click', function(){ pause(false); }); }
    startClock(limit, function(){ endSectionOne(true); });
    go(0);
  }
  function pause(on){
    run.paused = on;
    var b = app.querySelector('.stat-ex-pause');
    b.setAttribute('aria-pressed', on ? 'true' : 'false'); b.textContent = on ? 'Resume' : 'Pause';
    ['.stat-ex-stage', '.stat-ex-navwrap', '.stat-ex-controls'].forEach(function(s){ app.querySelector(s).hidden = on; });
    app.querySelector('.stat-ex-paused').hidden = !on;
    (on ? app.querySelector('.stat-ex-resume') : b).focus();
  }
  function answered(){ return run.qs.filter(function(q){ return run.res[q.id]; }).length; }
  function moreAfter(){ return run.pi < run.mcqParts.length - 1 || run.frqs.length; }
  function endWord(){ var P = run.mcqParts[run.pi]; return P.key ? 'End Part ' + P.key : run.frqs.length ? 'End Section I' : 'Finish exam'; }
  function status(){
    app.querySelector('.stat-ex-status').textContent = 'Question ' + (run.i + 1) + ' of ' + run.qs.length + ' · ' + answered() + ' answered';
    app.querySelectorAll('.stat-ex-nav button').forEach(function(b, i){
      var d = !!run.res[run.qs[i].id];
      b.classList.toggle('is-done', d);
      if(i === run.i) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current');
      b.setAttribute('aria-label', 'Question ' + (i + 1) + ', ' + (d ? 'answered' : 'not answered'));
    });
    app.querySelector('.stat-ex-navcount').textContent = '(' + answered() + ' of ' + run.qs.length + ' answered)';
    if(window.LevlFlags) window.LevlFlags.markNav(app.querySelectorAll('.stat-ex-nav button'), 'apstat', run.qs);
    app.querySelector('.stat-ex-prev').disabled = run.i === 0;
    var left = run.qs.length - answered();
    app.querySelector('.stat-ex-next').textContent = !left ? endWord() : (run.res[run.qs[run.i].id] ? 'Next' : 'Skip for now');
  }
  function go(i){
    if(i < 0 || i >= run.qs.length) return;
    run.i = i;
    var stage = app.querySelector('.stat-ex-stage');
    Object.keys(run.els).forEach(function(k){ run.els[k].hidden = true; });
    var q = run.qs[i];
    if(!run.els[q.id]){
      var box = document.createElement('div');
      box.className = 'stat-ex-q';
      stage.appendChild(box);
      run.els[q.id] = box;
      // A set's stimulus is shown with each of its questions.
      Q.hydrate(box, [q], { exam: true, record: false, flag: OWN.items.some(function(x){ return x.id === q.id; }) ? 'session' : undefined, onAnswer: function(res){ lockedIn(q, box, res); } });
      var nEl = box.querySelector('.stat-q-n'); if(nEl) nEl.textContent = (i + 1) + '.';
      var chk = box.querySelector('.stat-check'); if(chk) chk.textContent = 'Lock in answer';
    }
    run.els[q.id].hidden = false;
    status();
    var stem = run.els[q.id].querySelector('.stat-q-stem');
    if(stem){ stem.setAttribute('tabindex', '-1'); try{ stem.focus({ preventScroll: true }); }catch(e){ stem.focus(); } }
    var top = app.querySelector('.stat-ex-run');
    if(top && top.getBoundingClientRect().top < 0) top.scrollIntoView();
  }
  function capture(q, box, res){
    var body = box.querySelector('.stat-q-body');
    if(q.type === 'predict') return q.variables.map(function(v, k){ var b = body.querySelector('tr[data-k="' + k + '"] button[aria-checked="true"]'); return b ? b.getAttribute('data-v') : null; });
    if(q.type === 'order' || q.type === 'numeric' || q.type === 'expr') return res.pick;
    var picked = [].map.call(body.querySelectorAll('.stat-opt[aria-checked="true"]'), function(b){ return +b.getAttribute('data-i'); });
    return q.type === 'multi' ? picked : (picked.length ? picked[0] : null);
  }
  function lockedIn(q, box, res){
    run.res[q.id] = { correct: res.correct, score: res.score, pick: capture(q, box, res) };
    box.querySelectorAll('.stat-q-body button').forEach(function(b){ b.disabled = true; });
    var fb = box.querySelector('.stat-q-feedback'); if(fb) fb.innerHTML = '<p class="stat-small">Answer locked in.</p>';
    status();
    var nb = app.querySelector('.stat-ex-next'); try{ nb.focus({ preventScroll: true }); }catch(e){ nb.focus(); }
  }
  function nextUnanswered(){
    var n = run.qs.length;
    if(answered() === n) return askFinish();
    for(var s = 1; s <= n; s++){ var j = (run.i + s) % n; if(!run.res[run.qs[j].id]){ go(j); return; } }
  }
  function askFinish(){
    var left = run.qs.length - answered(), box = app.querySelector('.stat-ex-confirm');
    box.querySelector('p').textContent = (left ? plural(left, 'question') + ' not answered yet. Unanswered questions count as wrong. ' : 'All ' + run.qs.length + ' answered. ') +
      (moreAfter() ? 'You cannot come back to ' + (run.mcqParts[run.pi].key ? 'this part' : 'Section I') + '. End it now?' : 'Finish and see your results?');
    if(window.LevlFlags) window.LevlFlags.examList(box.querySelector('.cx-flaglist'), 'apstat', run.qs, function(i){ box.hidden = true; go(i); });
    box.hidden = false;
    box.querySelector('.stat-ex-yes').focus();
  }
  /* A break between parts: what was done, the next part's calculator rule,
     and a button to start it. */
  function breakCard(title, next, onGo, extra){
    app.innerHTML = '<div class="stat-ex-break-card"><h2 tabindex="-1">' + title + '</h2>' + next +
      '<div class="stat-pr-actions"><button type="button" class="btn-press" data-act="go">Start</button>' + (extra ? '<button type="button" class="btn-outline" data-act="booklet">Print the answer booklet</button>' : '') + '</div></div>';
    app.querySelector('[data-act="go"]').addEventListener('click', onGo);
    var bk = app.querySelector('[data-act="booklet"]'); if(bk) bk.addEventListener('click', booklet);
    app.querySelector('h2').focus();
  }
  function endSectionOne(timeUp){
    if(run.section !== 1) return;
    clearInterval(run.tick);
    var P = run.mcqParts[run.pi];
    if(timeUp) run.timeUp1 = true;
    run.rows = run.rows.concat(run.qs.map(function(q){ return { q: q, r: run.res[q.id] || { correct: false, score: 0, pick: null, skipped: true } }; }));
    var done = (timeUp ? 'Time is up for ' : '') + (P.key ? partName(1, P) : 'Section I') + (timeUp ? '.' : ' is done.');
    if(run.pi < run.mcqParts.length - 1){
      var N = run.mcqParts[run.pi + 1];
      run.section = 0;
      view('break');
      breakCard(done, '<p>' + partName(1, N) + ' has ' + plural(N.qs.length, 'question') + (run.k ? ' and ' + minutes(N.sec * N.qs.length * run.k) + ' on the clock' : ', untimed') + '.</p>' + calcNotice(N.calc) +
        '<p class="stat-small">Your answers so far are saved and scored at the end. You cannot go back to the part you finished.</p>', function(){ startSectionOne(run.pi + 1); });
      return;
    }
    if(!run.frqs.length) return finish();
    run.section = 0;
    view('break');
    var F = run.frqParts[0];
    breakCard(done, '<p>Section II has ' + plural(run.frqs.length, 'free-response question') + ', each worth ' + FRQ_POINTS + ' points, in ' + plural(run.frqParts.length, 'part') + '. ' + (F.key ? partName(2, F) + ': ' + plural(F.frqs.length, 'question') + (run.k ? ' in ' + minutes(F.sec * F.frqs.length * run.k) : '') + '. ' : '') +
      (run.k ? 'The clock cannot be paused, as on the real exam. ' : '') + 'Answer on screen, or print the answer booklet and write on paper.</p>' + calcNotice(F.calc) +
      '<p class="stat-small">Your Section I answers are saved and scored at the end.</p>', function(){ startSectionTwo(0); }, true);
  }

  /* ------------------------------------------------------ Section II */

  function booklet(){ K.printOnly(K.bookletHtml(run.frqs, { title: run.label + ': Section II answer booklet', note: 'Write your answer to each part in the lined space under it. Part A allows a graphing calculator; Part B does not.' })); }
  function startSectionTwo(pi){
    view('run2');
    var P = run.frqParts[pi], fs = P.frqs;
    run.fpi = pi; run.cur = fs; run.section = 2;
    var limit = run.k ? Math.round(P.sec * fs.length * run.k * 1000) : 0;
    var last = pi === run.frqParts.length - 1, base0 = run.frqParts.slice(0, pi).reduce(function(n, p){ return n + p.frqs.length; }, 0);
    run.fi = 0;
    app.innerHTML = '<div class="stat-ex-run stat-ex-s2">' +
      '<div class="stat-ex-top"><div class="stat-ex-title"><span class="stat-pr-label">' + esc(run.label) + ' &middot; ' + partName(2, P) + '</span><span class="stat-small stat-ex-status" aria-live="polite"></span></div>' + clockHtml(limit, false) + '</div>' +
      calcNotice(P.calc) +
      '<p class="stat-ex-sr" aria-live="assertive"></p>' +
      '<nav class="stat-ex-nav" aria-label="Free-response questions">' + fs.map(function(f, i){ return '<button type="button" data-go="' + i + '">' + (base0 + i + 1) + '</button>'; }).join('') + '</nav>' +
      '<h2 class="sr-only">' + partName(2, P) + ' questions</h2><div class="stat-ex-stage">' + fs.map(function(f, i){ return '<div class="stat-ex-fq" data-i="' + i + '" hidden>' + K.questionHtml(f, { n: base0 + i + 1, write: true, draftKey: '' }) + '</div>'; }).join('') + '</div>' +
      '<div class="stat-ex-controls"><button type="button" class="btn-outline stat-ex-prev">Previous</button><button type="button" class="btn-press stat-ex-next">Next question</button>' +
        '<button type="button" class="btn-outline" data-act="booklet">Print the answer booklet</button><button type="button" class="btn-outline stat-ex-finish">' + (P.key ? 'End Part ' + P.key : 'End Section II') + '</button></div>' +
      '<div class="stat-ex-confirm" hidden role="alertdialog" aria-labelledby="stat-ex-confirm2-t"><p id="stat-ex-confirm2-t">' + (last ? 'End Section II and score your answers with the rubrics?' : 'End ' + partName(2, P) + '? You cannot come back to it.') + '</p><button type="button" class="btn-press stat-ex-yes">' + (last ? 'End and score' : P.key ? 'End Part ' + P.key : 'End Section II') + '</button> <button type="button" class="btn-outline stat-ex-no">Keep working</button></div>' +
    '</div>';
    app.querySelector('.stat-ex-nav').addEventListener('click', function(e){ var b = e.target.closest('[data-go]'); if(b) goF(+b.getAttribute('data-go')); });
    app.querySelector('.stat-ex-prev').addEventListener('click', function(){ goF(run.fi - 1); });
    app.querySelector('.stat-ex-next').addEventListener('click', function(){ goF(run.fi + 1); });
    app.querySelector('[data-act="booklet"]').addEventListener('click', booklet);
    app.querySelector('.stat-ex-finish').addEventListener('click', function(){ var c = app.querySelector('.stat-ex-confirm'); c.hidden = false; c.querySelector('.stat-ex-yes').focus(); });
    app.querySelector('.stat-ex-yes').addEventListener('click', function(){ endFrqPart(false); });
    app.querySelector('.stat-ex-no').addEventListener('click', function(){ app.querySelector('.stat-ex-confirm').hidden = true; app.querySelector('.stat-ex-finish').focus(); });
    startClock(limit, function(){ endFrqPart(true); });
    goF(0);
  }
  function endFrqPart(timeUp){
    if(run.section !== 2) return;
    clearInterval(run.tick);
    run.answers = run.answers.concat(run.cur.map(function(f, i){ return answersOf(i); }));
    if(timeUp) run.timeUp2 = true;
    if(run.fpi < run.frqParts.length - 1){
      var P = run.frqParts[run.fpi], N = run.frqParts[run.fpi + 1];
      run.section = 0;
      view('break');
      breakCard((timeUp ? 'Time is up for ' : '') + partName(2, P) + (timeUp ? '.' : ' is done.'),
        '<p>' + partName(2, N) + ' has ' + plural(N.frqs.length, 'question') + (run.k ? ' and ' + minutes(N.sec * N.frqs.length * run.k) + ' on the clock' : ', untimed') + '.</p>' + calcNotice(N.calc), function(){ startSectionTwo(run.fpi + 1); }, true);
      return;
    }
    run.section = 2.5;
    selfScore(timeUp);
  }
  function goF(i){
    if(i < 0 || i >= run.cur.length) return;
    run.fi = i;
    app.querySelectorAll('.stat-ex-fq').forEach(function(el){ el.hidden = +el.getAttribute('data-i') !== i; });
    app.querySelectorAll('.stat-ex-nav button').forEach(function(b, k){ if(k === i) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current'); b.setAttribute('aria-label', 'Free-response question ' + b.textContent); });
    app.querySelector('.stat-ex-status').textContent = 'Question ' + (i + 1) + ' of ' + run.cur.length + ' in this part';
    app.querySelector('.stat-ex-prev').disabled = i === 0;
    app.querySelector('.stat-ex-next').disabled = i === run.cur.length - 1;
    var k = app.querySelector('.stat-ex-fq[data-i="' + i + '"] .stat-fq-k');
    if(k){ k.setAttribute('tabindex', '-1'); try{ k.focus({ preventScroll: true }); }catch(e){ k.focus(); } }
  }
  function answersOf(i){
    var out = {};
    app.querySelectorAll('.stat-ex-fq[data-i="' + i + '"] .stat-fq-answer').forEach(function(t){ out[t.getAttribute('data-part')] = t.value; });
    return out;
  }
  function selfScore(timeUp){
    if(run.section !== 2.5) return;
    clearInterval(run.tick);
    run.section = 3;
    view('score');
    app.innerHTML = '<div class="stat-ex-score"><h2 tabindex="-1">' + (timeUp ? 'Time is up for Section II. ' : '') + 'Score your free responses</h2>' +
      '<p>For each part, read your answer, then check every rubric point it earns. Check a point only if your answer says it, in your own words. If you wrote on paper, score the booklet.</p>' +
      run.frqs.map(function(f, i){
        return '<section class="stat-ex-fscore" aria-labelledby="fs-' + i + '"><h3 id="fs-' + i + '">Question ' + (i + 1) + ': ' + esc(f.title) + ' <span class="stat-small">(' + plural(f.points, 'point') + ')</span></h3>' +
          '<details class="stat-ex-fprompt"><summary>Show the question</summary>' + K.questionHtml(f, {}) + '</details>' +
          '<div class="stat-ex-yours">' + f.parts.map(function(p){ var a = run.answers[i][p.label]; return '<p><b>Your answer to (' + esc(p.label) + '):</b> ' + (a ? esc(a).replace(/\n/g, '<br>') : '<span class="stat-small">nothing typed</span>') + '</p>'; }).join('') + '</div>' +
          K.rubricHtml(f) + '<p class="stat-fq-total" aria-live="polite"></p></section>';
      }).join('') +
      '<div class="stat-pr-actions"><button type="button" class="btn-press" data-act="results">See my results</button></div></div>';
    function totals(){ app.querySelectorAll('.stat-ex-fscore').forEach(function(sec){ var s = K.score(sec); sec.querySelector('.stat-fq-total').textContent = s.got + ' of ' + s.of + ' points checked.'; }); }
    app.addEventListener('change', totals); totals();
    app.querySelector('[data-act="results"]').addEventListener('click', function(){
      app.removeEventListener('change', totals);
      run.frqScores = [].map.call(app.querySelectorAll('.stat-ex-fscore'), function(sec){ return K.score(sec); });
      finish();
    });
    app.querySelector('h2').focus();
  }

  /* ------------------------------------------------------ results */

  function finish(){
    if(!run || run.done) return;
    run.done = true;
    clearInterval(run.tick);
    window.removeEventListener('beforeunload', guard);
    var rows = run.rows;
    // Recorded now, at the end (A&P decision 42); unanswered counts as a miss.
    // Exam-only questions (fixed exams) count in the score, not in practice or review.
    rows.forEach(function(x){ if(!x.q.own) Core.record(x.q.id, !!x.r.correct, { topic: x.q.topic, unit: x.q.unit, practice: x.q.practice, level: x.q.level, diff: x.q.diff, src: 'q' }); });
    var right = rows.filter(function(x){ return x.r.correct; }).length, total = rows.length;
    if(window.StudyHubAccount && window.StudyHubAccount.promptToSave && total >= 10){
      setTimeout(function(){ window.StudyHubAccount.promptToSave('Exam finished \u2014 ' + right + '/' + total, { kind: 'exam', score: right, total: total, missed: total - right }); }, 2600);
    }
    var fg = 0, fo = 0; (run.frqScores || []).forEach(function(s){ fg += s.got; fo += s.of; });
    // No composite and no band (spec decision 6): the two sections are shown apart.
    var composite = 0, b = 0;
    var hist = prefs().examHistory || [];
    hist.push({ ts: Date.now(), kind: run.meta.kind, label: run.label, unit: run.meta.unit || null, form: run.meta.form || null, mcq: { c: right, n: total }, frq: fo ? { got: fg, of: fo } : null, partial: !!run.meta.partial });
    setPref('examHistory', hist.slice(-30));
    // Each FRQ's self-score also counts as an attempt on the FRQ page.
    (run.frqScores || []).forEach(function(s, i){ var f = run.frqs[i]; K.saveScore(f.id, { got: s.got, of: s.of, parts: s.parts, title: f.title, type: f.type, units: f.units, exam: true }); });
    if(window.LevlAnalytics && window.LevlAnalytics.examEnd) window.LevlAnalytics.examEnd();
    Core.event('apstat-exam-finish', { kind: run.meta.kind, correct: right, total: total, frq: fg, frqOf: fo, partial: !!run.meta.partial });
    var stage = app.querySelector('.stat-ex-stage') || app;
    stage.insertAdjacentHTML('afterbegin', '<p class="stat-small">Marking your exam and loading the explanations…</p>');
    Promise.all(rows.map(function(x){ return Core.loadWhy(BASE, x.q); })).then(function(){ results(rows, right, fg, fo, composite, b); }, function(){ results(rows, right, fg, fo, composite, b); });
  }
  function tally(rows, keyFn){
    var out = {}, order = [];
    rows.forEach(function(x){ var k = keyFn(x.q); if(!k) return; if(!out[k]){ out[k] = { n: 0, c: 0 }; order.push(k); } out[k].n++; if(x.r.correct) out[k].c++; });
    return order.map(function(k){ return { key: k, n: out[k].n, c: out[k].c }; });
  }
  function barTable(title, list, name, link, unitWord){
    if(!list.length) return '';
    return '<section class="stat-ex-break"><h3>' + title + '</h3><ul class="stat-ex-bars">' + list.map(function(x){
      var p = pctOf(x.c, x.n), nm = esc(name(x.key)), href = link && link(x.key);
      return '<li><span class="stat-ex-bar-name">' + (href ? '<a href="' + href + '">' + nm + '</a>' : nm) + '</span><span class="track thin" aria-hidden="true"><i class="' + (p >= 80 ? 'is-hi' : p >= 60 ? 'is-mid' : 'is-lo') + '" style="width:' + p + '%"></i></span><span class="stat-ex-bar-v">' + x.c + '/' + x.n + (unitWord ? ' ' + unitWord : '') + '</span></li>';
    }).join('') + '</ul></section>';
  }
  function results(rows, right, fg, fo, composite, b){
    var total = rows.length, k = run.meta.kind, missedN = total - right;
    var byUnit = tally(rows, function(q){ return q.unit; });
    var byTopic = tally(rows, function(q){ return q.topic; }).sort(function(a, c){ return a.c / a.n - c.c / c.n; });
    var byPractice = tally(rows, function(q){ return String(q.practice || '').split('.')[0]; }).sort(function(a, c){ return a.key - c.key; });
    var byLevel = tally(rows, function(q){ return q.level; });
    var frqByUnit = {};
    (run.frqScores || []).forEach(function(s, i){ var u = run.frqs[i].units[0]; frqByUnit[u] = frqByUnit[u] || { key: u, c: 0, n: 0 }; frqByUnit[u].c += s.got; frqByUnit[u].n += s.of; });
    var weak = byTopic.filter(function(x){ return x.c < x.n; }).slice(0, 3);
    view('results');
    app.innerHTML = '<div class="stat-ex-results">' +
      '<div class="stat-pr-score"><span class="stat-pr-score-big">' + right + '<small>/' + total + '</small></span><span><b>Multiple choice: ' + pctOf(right, total) + '%</b><span class="stat-small">' + esc(run.label) +
        (run.timeUp1 ? ' · time ran out in Section I' : '') + '</span></span></div>' +
      (fo ? '<div class="stat-pr-score stat-ex-fsum"><span class="stat-pr-score-big">' + fg + '<small>/' + fo + '</small></span><span><b>Free response (your self-score): ' + pctOf(fg, fo) + '%</b><span class="stat-small">' + plural(run.frqs.length, 'question') + ' scored with the rubrics' + (run.timeUp2 ? ' · time ran out in Section II' : '') + '</span></span></div>' : '') +
      (k === 'full' ? '<p class="stat-small">No AP® score is estimated: May 2027 is the first exam in this format, so there is no score data to calibrate one. Use the section percentages and the breakdowns below.</p>' : '') +
      (missedN ? '<p>' + plural(rows.filter(function(x){ return !x.r.correct && !x.q.own; }).length, 'missed question') + ' went to your <a href="' + BASE + 'review.html">review queue</a>' + (rows.some(function(x){ return !x.r.correct && x.q.own; }) ? ' (questions written only for this exam stay here, in the review below)' : '') + '.</p>' : '<p>Every multiple-choice question right.</p>') +
      (weak.length ? '<h2>Study next</h2><ul class="stat-pr-next-list">' + weak.map(function(x){
        return '<li><div><b>' + esc(TOPIC[x.key] ? TOPIC[x.key].title : x.key) + '</b><span class="stat-small">' + x.c + ' of ' + x.n + ' right</span></div><a class="btn-outline" href="' + BASE + 'lessons/' + x.key + '.html">Lesson</a><a class="btn-outline" href="' + BASE + 'notes/' + x.key + '.html">Notes</a></li>';
      }).join('') + '</ul>' : '') +
      '<h2>Your score, broken down</h2><div class="stat-ex-breaks">' +
        barTable('Multiple choice by unit', byUnit, unitName, function(key){ return BASE + 'units/' + key + '.html'; }) +
        (fo ? barTable('Free response by unit (points)', Object.keys(frqByUnit).map(function(u){ return frqByUnit[u]; }), unitName, null, 'pts') : '') +
        barTable('Multiple choice by practice', byPractice, function(key){ return key + (PRACTICE[key] ? '. ' + PRACTICE[key].name : ''); }) +
        barTable('By topic', byTopic, function(key){ return TOPIC[key] ? TOPIC[key].title : key; }, function(key){ return BASE + 'lessons/' + key + '.html'; }) +
        barTable('By level', byLevel, function(key){ return LEVEL_NAME[key] || key; }) +
      '</div>' +
      '<div class="stat-pr-actions">' + (missedN ? '<a class="btn-press" href="' + BASE + 'practice.html?mode=missed">Practice your misses</a>' : '') + '<button type="button" class="btn-outline" data-act="again">Another exam</button></div>' +
      '<h2>Review every question</h2>' +
      '<div class="stat-ex-filter" role="group" aria-label="Show"><button type="button" class="stat-pr-chip-b" aria-pressed="true" data-f="all">All ' + total + '</button><button type="button" class="stat-pr-chip-b" aria-pressed="false" data-f="miss"' + (missedN ? '' : ' disabled') + '>Missed ' + missedN + '</button></div>' +
      '<ol class="stat-ex-review">' + rows.map(function(x, i){ return reviewItem(x.q, x.r, i + 1); }).join('') + '</ol>' +
      (window.LevlPremium && window.LevlPremium.card ? window.LevlPremium.card('apstat', 'summary') : '') +
      '<div class="stat-pr-actions"><button type="button" class="btn-outline" data-act="again">Another exam</button></div></div>';
    app.querySelectorAll('[data-act="again"]').forEach(function(x){ x.addEventListener('click', renderSetup); });
    app.querySelectorAll('[data-f]').forEach(function(x){
      x.addEventListener('click', function(){
        var miss = x.getAttribute('data-f') === 'miss';
        app.querySelectorAll('[data-f]').forEach(function(y){ y.setAttribute('aria-pressed', y === x ? 'true' : 'false'); });
        app.querySelectorAll('.stat-ex-ritem').forEach(function(li){ li.hidden = miss && li.classList.contains('is-ok'); });
      });
    });
    var h = app.querySelector('.stat-pr-score'); h.setAttribute('tabindex', '-1'); h.focus();
  }

  /* One question in the review, options in authored order, each with its
     own explanation; explanations never name a position. */
  function reviewItem(q, r, n){
    var cls = r.correct ? 'is-ok' : (r.score > 0 ? 'is-part' : 'is-no');
    var verdict = r.skipped ? 'Not answered' : r.correct ? 'Correct' : r.score > 0 ? 'Partly right' : 'Missed';
    var why = q.why || {}, opts = why.options || [], body = '';
    function tag(t, c){ return '<span class="stat-ex-tag ' + c + '">' + t + '</span>'; }
    if(q.type === 'predict'){
      body = '<ul class="stat-ex-vars">' + q.variables.map(function(v, k){
        var mine = r.pick && r.pick[k], ok = mine === v.answer;
        function dir(d){ return d === 'up' ? 'Increases' : d === 'down' ? 'Decreases' : d === 'none' ? 'No change' : 'No answer'; }
        return '<li class="' + (ok ? 'is-ok' : 'is-no') + '"><span class="stat-ex-vname"><span class="stat-ex-mark" aria-hidden="true">' + (ok ? '✓' : '✗') + '</span>' + html(v.name) + '</span><span class="stat-ex-vpick">You: ' + dir(mine) + (ok ? '' : ' · Answer: <b>' + dir(v.answer) + '</b>') + '<span class="stat-ex-sr"> (' + (ok ? 'right' : 'wrong') + ')</span></span>' + (v.why ? '<span class="stat-ex-vwhy">' + html(v.why) + '</span>' : '') + '</li>';
      }).join('') + '</ul>';
    } else if(q.type === 'order'){
      var mine = r.pick || [];
      body = '<div class="stat-ex-orders">' + (mine.length ? '<div><p class="stat-small">Your order</p><ol class="stat-order">' + mine.map(function(i, k){ return '<li class="' + (i === k ? 'pos-ok' : 'pos-no') + '"><span class="stat-ex-mark" aria-hidden="true">' + (i === k ? '✓' : '✗') + '</span><span class="stat-order-text">' + html(q.options[i]) + '</span><span class="stat-ex-sr">' + (i === k ? ' (right place)' : ' (wrong place)') + '</span></li>'; }).join('') + '</ol></div>' : '') +
        '<div><p class="stat-small">Correct order</p><ol class="stat-order">' + q.options.map(function(o){ return '<li><span class="stat-order-text">' + html(o) + '</span></li>'; }).join('') + '</ol></div></div>';
    } else if(q.type === 'numeric'){
      body = '<p>You: <b>' + (r.pick ? esc(typeof r.pick === 'object' ? r.pick.value + ' ' + (r.pick.unit || '') : r.pick) : 'no answer') + '</b> · Answer: <b>' + Q.formatKey(q.numeric || {}, q.calc) + '</b></p>';
    } else if(q.type === 'expr'){
      var E = q.expr || {};
      body = '<p>You: <b>' + (r.pick ? esc(r.pick) : 'no answer') + '</b> · Answer: <b>' + (E.lhsHtml ? E.lhsHtml + ' ' : '') + (E.answerHtml || esc(E.answer)) + '</b></p>';
    } else {
      var key = [].concat(q.correct), picks = r.pick == null ? [] : [].concat(r.pick);
      body = '<ul class="stat-ex-opts">' + (q.options || []).map(function(o, i){
        var isKey = key.indexOf(i) > -1, isPick = picks.indexOf(i) > -1;
        return '<li class="' + (isKey ? 'is-right' : isPick ? 'is-wrong' : '') + '"><span class="stat-ex-otext">' + html(o) + '</span>' + (isPick ? tag('Your answer', isKey ? 'ok' : 'no') : '') + (isKey ? tag(q.type === 'multi' ? 'Correct' : 'Correct answer', 'key') : '') + (opts[i] ? '<span class="stat-opt-why">' + html(opts[i]) + '</span>' : '') + '</li>';
      }).join('') + '</ul>';
    }
    var t = TOPIC[q.topic];
    return '<li class="stat-q stat-ex-ritem ' + cls + '"><p class="stat-ex-verdict"><span class="stat-ex-vtag">' + verdict + (r.score > 0 && !r.correct ? ' (' + Math.round(r.score * 100) + '%)' : '') + '</span><span class="stat-small">' + esc(t ? t.title : '') + ' · Practice ' + esc(q.practice || '') + '</span></p>' +
      (q.stim ? '<details class="stat-ex-stimd"><summary>Show the ' + esc((q.stim.kind === 'table' ? 'table' : q.stim.kind === 'graph' ? 'graph' : 'diagram')) + ': ' + (q.stim.title || '') + '</summary>' + Q.stimulusPanel(q.stimulus, q.stim) + '</details>' : '') +
      '<p class="stat-q-stem"><span class="stat-q-n">' + n + '.</span> ' + html(q.q) + '</p>' + body + (why.correct ? '<p class="stat-ex-why"><b>Why:</b> ' + html(why.correct) + '</p>' : '') +
      '<p class="stat-ex-links"><a href="' + BASE + 'lessons/' + q.topic + '.html">Lesson</a> <span aria-hidden="true">&middot;</span> <a href="' + BASE + 'notes/' + q.topic + '.html">Notes</a>' + (window.LevlReport ? ' ' + window.LevlReport.button('apstat', q.id) : '') + '</p></li>';
  }

  /* ------------------------------------------------------ boot */

  function boot(){
    if(!Q || !Core){ app.innerHTML = '<p>Exams could not start. Reload the page to try again.</p>'; return; }
    app.innerHTML = '<p class="stat-small">Loading the question bank…</p>';
    Promise.all([Core.loadIndex(BASE), kit()]).then(function(r){
      K = r[1];
      bank = r[0].filter(function(q){ return TOPIC[q.topic] && TOPIC[q.topic].built; });
      blocks = makeBlocks(bank);
      var getJ = function(u){ return fetch(BASE + u).then(function(x){ if(!x.ok) throw new Error(u); return x.json(); }); };
      return Promise.all([
        K ? K.index(BASE).then(function(l){ frqList = l || []; }, function(){ frqList = []; }) : null,
        getJ('assets/exams/forms.json').then(function(f){ FORMS = f || []; }, function(){ FORMS = []; }),
        getJ('assets/exams/items.json').then(function(o){ OWN = o || OWN; }, function(){})
      ]);
    }).then(function(){
      if(!bank.length){ app.innerHTML = '<p>No exam questions are published yet. Meanwhile, read the <a href="' + BASE + 'learn.html">free notes</a>.</p>'; return; }
      var p = new URLSearchParams(location.search), saved = prefs().examTiming;
      if(TIMINGS.some(function(t){ return t.id === saved; })) cfg.timing = saved;
      if(builtUnits().some(function(u){ return u.id === p.get('unit'); })){ cfg.unit = p.get('unit'); cfg.kind = 'unit'; }
      if(p.get('mode') === 'unit' || p.get('mode') === 'full' || p.get('mode') === 'mixed') cfg.kind = p.get('mode');
      if(MIXED.indexOf(+p.get('n')) > -1) cfg.n = +p.get('n');
      if(formById('form-' + p.get('form'))){ cfg.form = 'form-' + p.get('form'); cfg.kind = 'full'; }
      else if(cfg.kind === 'full' && FORMS.length && !p.get('form')) cfg.form = FORMS[0].id;
      renderSetup();
      if(p.toString()){ var s = app.querySelector('.stat-pr-start'); if(s && !s.disabled) s.focus(); }
    }).catch(function(){ app.innerHTML = '<p>The question bank did not load. Check your connection and reload.</p>'; });
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
