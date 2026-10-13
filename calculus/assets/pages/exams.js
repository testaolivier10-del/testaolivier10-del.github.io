/* AP® Calculus AB Exams (docs/apcalc-spec.md decision 5; forked from
   physics/assets/pages/exams.js, itself from AP® Chemistry's and the A&P app).

     Unit test       one unit, weighted by topic: every published topic of the
                     unit gets an equal share of the questions, stimulus sets
                     kept whole and in authored order. 15, 25 or all.
     Practice exam   the hybrid format of May 2027, in its four timed parts:
                     Section I Part A, 29 multiple-choice questions without a
                     calculator in 62 minutes; Part B, 13 with a graphing
                     calculator in 38 minutes (each part drawn from every unit
                     in proportion to the midpoint of its exam weight range,
                     sets kept whole); Section II Part A, 2 free-response
                     questions with a calculator in 30 minutes; Part B, 4
                     without in 60 minutes. Every free-response question is
                     worth 9 points (54). Each part opens with its calculator
                     notice; a part, once ended, cannot be reopened. Then
                     rubric self-scoring, point by point.

   When the bank cannot fill a full exam, the setup says so plainly (what a
   full exam needs, what exists per unit and part, and per free-response
   part) and offers a shorter exam from what exists, labelled as such; no
   count is invented.

   Timing: a visible clock per part. Section I and unit tests can be paused
   (an accessibility aid; the question hides while paused); Section II
   cannot, like the real exam. Extra-time settings and an untimed mode.

   An exam grades silently (ApCalcQuestions opts.exam, record: false): the
   first tap on an answer locks it in. Every answer is recorded through
   ApCalcCore when the exam ends (A&P decision 42), an unanswered question as
   a miss, so misses reach review. Results: MCQ score, FRQ self-score, by
   unit and by mathematical practice, and for practice exams a readiness band
   (1-5) labelled "Not calibrated". History goes to apcalc_prefs_v1
   .examHistory (the dashboard reads it).

     Fixed exams     two complete practice exams written to the real format
                     (assets/exams/forms.json, docs/apcalc-architecture.md,
                     "Practice exams"): the same 29 + 13 questions in a set
                     order, weighted by unit, and the same 2 + 4 free-response questions,
                     for every student, so a score can be compared with a
                     friend's or a second try. Some questions appear only in
                     these exams (assets/exams/items.json). ?mode=full&form=1.

     Mixed timed set the cram kit's timed sets (spec decision 26): 10, 20 or
                     30 questions from every published unit by the midpoint
                     of its exam weight (as Section I), sets whole, at the
                     exam's pace for each question's part (62/29 min without
                     a calculator, 38/13 min with); then the same review
                     with explanations. Opened from cram.html as
                     ?mode=mixed&n=10|20|30.

   Free tier: one exam of any kind (ApCalcCore.freeExam), used when it starts;
   an exam in progress can always be finished. Mixed timed sets are part of
   the cram kit instead: Premium (ApCalcCore.allowed('cram')), and they never
   use the free exam. */
(function(){
  var BASE = window.ApCalcBase || '';
  var app = document.getElementById('app');
  if(!app) return;
  var hero = document.querySelector('.page-head, .calc-hero');
  var CUR = window.ApCalcCurriculum || { units: [], topics: [], practices: [] };
  var Core = window.ApCalcCore, Q = window.ApCalcQuestions;
  var PREFS = 'apcalc_prefs_v1';
  // The May 2027 parts (docs/apcalc-research/framework.md, section 5).
  var MCQ_TOTAL = 42;
  var MCQ_PARTS = [{ key: 'A', n: 29, sec: 62 * 60, calc: false }, { key: 'B', n: 13, sec: 38 * 60, calc: true }];
  var FRQ_PARTS = [{ key: 'A', n: 2, sec: 30 * 60, calc: true }, { key: 'B', n: 4, sec: 60 * 60, calc: false }];
  var FRQ_POINTS = 9;
  // A question's time at the exam's pace for its part.
  function qSec(q){ var p = MCQ_PARTS[q && q.calc ? 1 : 0]; return p.sec / p.n; }
  function qsSec(qs){ return qs.reduce(function(s, q){ return s + qSec(q); }, 0); }
  var MCQ_SEC = (62 + 38) * 60 / 42;   // the average pace, for set summaries
  // The exam's own graphing calculator is in Bluebook; here, a free one in a new tab.
  var DESMOS = 'https://www.desmos.com/calculator';
  function calcNotice(calc){
    return calc
      ? '<p class="cx-notice calc-ex-calc is-on"><b>Calculator allowed.</b> A graphing calculator is required for this part. Use your own approved calculator or the free <a href="' + DESMOS + '" target="_blank" rel="noopener">Desmos graphing calculator<span class="sr-only"> (opens in a new tab)</span></a> (on the real exam, use the Desmos built into the test app or an approved handheld). Show the setup, and give decimal answers correct to three decimal places.</p>'
      : '<p class="cx-notice calc-ex-calc"><b>No calculator.</b> Calculators are not allowed in this part. Leave answers exact (fractions, &pi;, e, roots) unless a decimal is asked for.</p>';
  }
  var TIMINGS = [
    { id: 'std', name: 'Standard time', k: 1 }, { id: 'x15', name: 'Extra time (1.5×)', k: 1.5 },
    { id: 'x2', name: 'Double time', k: 2 }, { id: 'off', name: 'Untimed', k: 0 }
  ];
  var LEVEL_NAME = { recall: 'Recall', apply: 'Apply', analyze: 'Analyze' };
  var NOT_CALIBRATED = 'Not calibrated: a rough guide, not a predicted score.';

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
    if(window.ApCalcFrq) return Promise.resolve(window.ApCalcFrq);
    return new Promise(function(res){
      var s = document.createElement('script');
      s.src = BASE + 'assets/pages/frq-kit.js';
      s.onload = function(){ res(window.ApCalcFrq || null); };
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
     Section I is two parts, each split over the units by exam weight:
     Part A from the no-calculator questions, Part B from the calculator
     ones. Section II needs 2 calculator and 4 no-calculator FRQs. */
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
    var pools = FRQ_PARTS.map(function(P){ return frqList.filter(function(f){ return !!f.calc === P.calc; }); });
    var frqParts = FRQ_PARTS.map(function(P, i){ return { key: P.key, calc: P.calc, need: P.n, have: pools[i].length, n: Math.min(P.n, pools[i].length) }; });
    var mcqFull = parts.every(function(p){ return p.full; }), frqFull = frqParts.every(function(p){ return p.have >= p.need; });
    return { units: us, parts: parts, frqParts: frqParts, pools: pools, full: mcqFull && frqFull, mcqFull: mcqFull, frqFull: frqFull,
      mcqN: parts[0].n + parts[1].n, frqN: frqParts[0].n + frqParts[1].n };
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
    return '<p class="cx-notice calc-ex-free"><b>Your free exam.</b> One exam is free: starting any exam below uses it, and once started you can always finish it. ' + (Core.badge ? Core.badge() : '') + '</p>';
  }
  // Section II time for a list of FRQs: each part's time, in proportion when a part is short.
  function frqSec(fs){ return FRQ_PARTS.reduce(function(s, p){ var k = fs.filter(function(f){ return !!f.calc === p.calc; }).length; return s + p.sec * k / p.n; }, 0); }

  function panelHtml(){
    if(cfg.kind === 'mixed'){
      if(!cramOk()) return Core.gate('cram', 'cram-sets');
      var mp = mixedPlan(cfg.n);
      return '<fieldset class="cx-group"><legend>Questions</legend><div class="cx-pills">' + MIXED.map(function(v){
          return '<label class="cx-pill"><input type="radio" name="n" value="' + v + '"' + (cfg.n === v ? ' checked' : '') + '><span>' + v + '</span></label>';
        }).join('') + '</div></fieldset>' + timingField() +
        '<div class="cx-note calc-ex-note"><p><b>How this set is drawn.</b> From every published unit by the middle of its exam weight range, with stimulus sets kept whole (so a set can run a question or two long). Timed at the exam\'s pace: ' + minutes(MCQ_PARTS[0].sec / MCQ_PARTS[0].n) + ' a question without a calculator, ' + minutes(MCQ_PARTS[1].sec / MCQ_PARTS[1].n) + ' with one.</p><ul class="calc-ex-alloc">' +
          mp.units.map(function(u){ return '<li><span>' + esc(unitName(u.id)) + '</span><b>' + (mp.alloc[u.id] || 0) + '</b></li>'; }).join('') + '</ul></div>';
    }
    if(cfg.kind === 'unit'){
      var us = builtUnits(), p = unitPlan(cfg.unit, cfg.len);
      return '<label class="cx-field"><span>Unit</span><select name="unit">' + us.map(function(u){ return '<option value="' + u.id + '"' + (u.id === cfg.unit ? ' selected' : '') + '>' + esc(unitName(u.id)) + '</option>'; }).join('') + '</select></label>' +
        '<fieldset class="cx-group"><legend>Length</legend><div class="cx-pills">' + [15, 25, 0].map(function(v){
          return '<label class="cx-pill"><input type="radio" name="len" value="' + v + '"' + (cfg.len === v ? ' checked' : '') + '><span>' + (v || 'All ' + p.total) + '</span></label>';
        }).join('') + '</div></fieldset>' + timingField() +
        '<div class="cx-note calc-ex-note"><p><b>How this test is split.</b> Every published topic in the unit gets an equal share; stimulus sets stay whole.</p><ul class="calc-ex-alloc">' +
          p.topics.map(function(t){ return '<li><span>' + esc((t.ced ? t.ced + ' ' : '') + t.title) + '</span><b>' + (p.alloc[t.id] || 0) + '</b></li>'; }).join('') + '</ul></div>';
    }
    var t = timing();
    var formPick = FORMS.length ? '<fieldset class="cx-group"><legend>Which exam</legend><div class="cx-pills">' +
      FORMS.map(function(f){ return '<label class="cx-pill"><input type="radio" name="form" value="' + f.id + '"' + (cfg.form === f.id ? ' checked' : '') + '><span>' + esc(f.title) + '</span></label>'; }).join('') +
      '<label class="cx-pill"><input type="radio" name="form" value=""' + (cfg.form ? '' : ' checked') + '><span>New mixed exam</span></label></div></fieldset>' : '';
    var fm = formById(cfg.form);
    var fmt = '<p>Section I: Part A, 29 multiple-choice questions without a calculator in 62 min; Part B, 13 with a graphing calculator in 38 min. Section II: Part A, 2 free-response questions with a calculator in 30 min; Part B, 4 without in 60 min; each is worth 9 points. Then you score them with the rubrics.</p>';
    if(fm){
      var fu = {}; fm.mcq.forEach(function(b){ b.forEach(function(id){ var q = byIdQ(id); if(q) fu[q.unit] = (fu[q.unit] || 0) + 1; }); });
      return formPick + '<div class="cx-note calc-ex-note"><p><b>' + esc(fm.title) + ': a complete exam in the real format.</b> The same questions in a set order for everyone, so you can compare a second try.</p>' + fmt +
        '<h2 class="calc-ex-h3">Section I, by unit</h2><ul class="calc-ex-areas">' + courseUnits().map(function(u){ return '<li class="is-on"><span>' + esc(unitName(u.id)) + (Array.isArray(u.weight) ? ' <span class="calc-small">(' + u.weight[0] + '–' + u.weight[1] + '%)</span>' : '') + '</span><b>' + (fu[u.id] || 0) + '</b></li>'; }).join('') + '</ul></div>' +
        timingField() + '<p class="calc-small">' + (t.k ? 'Section I: ' + minutes((62 + 38) * 60 * t.k) + '. Section II: ' + minutes(90 * 60 * t.k) + (t.k > 1 ? ', with extra time' : '') + '.' : 'Untimed: the clock counts up instead of down.') + '</p>';
    }
    var plan = examPlan();
    var unitRows = plan.units.map(function(u){
      var cells = plan.parts.map(function(p){ return plan.mcqFull ? p.need[u.id] : (p.alloc[u.id] || 0) + '/' + p.need[u.id]; });
      var any = plan.parts.some(function(p){ return p.have[u.id]; });
      return '<li class="' + (any ? 'is-on' : 'is-off') + '"><span>' + esc(unitName(u.id)) + (Array.isArray(u.weight) ? ' <span class="calc-small">(' + u.weight[0] + '–' + u.weight[1] + '%)</span>' : '') + '</span><b>A ' + cells[0] + ' &middot; B ' + cells[1] + '</b></li>';
    }).join('');
    var partRows = plan.frqParts.map(function(p){
      return '<li class="' + (p.have ? 'is-on' : 'is-off') + '"><span>Part ' + p.key + ', ' + (p.calc ? 'calculator' : 'no calculator') + ' <span class="calc-small">(' + p.need + ' &times; ' + FRQ_POINTS + ' points)</span></span><b>' + (p.have >= p.need ? 'ready' : p.have + ' of ' + p.need + ' written') + '</b></li>';
    }).join('');
    return formPick + '<div class="cx-note calc-ex-note">' +
      (plan.full ? '<p><b>The full hybrid format.</b> Each part is drawn from every unit by the midpoint of its exam weight, with stimulus sets kept whole.</p>' + fmt
        : '<p><b>Not enough questions for a full practice exam yet.</b> A full exam needs 29 no-calculator and 13 calculator multiple-choice questions spread over ' + (plan.units.length === 1 ? 'the course\'s one unit' : 'all ' + plan.units.length + ' units') + ' by exam weight, and 6 free-response questions (2 with a calculator, 4 without). ' +
          'Today the bank can give a <b>shorter exam</b>: ' + plural(plan.mcqN, 'multiple-choice question') + (plan.frqN ? ' and ' + plural(plan.frqN, 'free-response question') : ' and no free-response section') + ', each unit keeping the share it would have in a full exam. Units with no questions yet are left out, not filled in from other units.</p>') +
      '<h2 class="calc-ex-h3">Section I, by unit (Part A &middot; Part B)</h2><ul class="calc-ex-areas">' + unitRows + '</ul>' +
      '<h2 class="calc-ex-h3">Section II, by part</h2><ul class="calc-ex-areas">' + partRows + '</ul></div>' +
      timingField() +
      '<p class="calc-small">' + (t.k ? 'Section I: ' + minutes(plan.parts.reduce(function(s2, p){ return s2 + MCQ_PARTS[p.calc ? 1 : 0].sec * p.n / MCQ_PARTS[p.calc ? 1 : 0].n; }, 0) * t.k) + (plan.frqN ? '. Section II: ' + minutes(plan.frqParts.reduce(function(s2, p){ return s2 + FRQ_PARTS[p.calc ? 0 : 1].sec * p.n / FRQ_PARTS[p.calc ? 0 : 1].n; }, 0) * t.k) : '') + (t.k > 1 ? ', with extra time' : '') + '.' : 'Untimed: the clock counts up instead of down.') + '</p>';
  }
  function summary(){
    if(cfg.kind === 'mixed'){ if(!cramOk()) return 'Mixed timed sets are part of Premium.'; var m = mixedPlan(cfg.n); return m.n ? 'Mixed timed set: about ' + plural(m.n, 'question') + (timing().k ? ', about ' + minutes(m.n * MCQ_SEC * timing().k) : ', untimed') + '.' : 'No questions are published yet.'; }
    if(cfg.kind === 'unit'){ var p = unitPlan(cfg.unit, cfg.len); return p.n ? plural(p.n, 'question') + (timing().k ? ', about ' + minutes(p.n * MCQ_SEC * timing().k) : ', untimed') + '.' : 'No questions are published for this unit yet.'; }
    if(formById(cfg.form)) return formById(cfg.form).title + ': 42 multiple-choice questions (29 + 13) + 6 free-response questions (2 + 4).';
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
      '<form class="cx-card cx-builder calc-pr-setup calc-ex-setup" novalidate aria-label="Set up an exam">' +
      '<fieldset class="cx-step"><legend>' + n1 + '1</span>Choose an exam</legend><div class="cx-choices">' +
        '<label class="cx-choice"><input type="radio" name="kind" value="full"' + (cfg.kind === 'full' ? ' checked' : '') + '><span><b>Practice exam</b><span>The hybrid format: multiple choice, then free response, scored with rubrics.</span></span></label>' +
        '<label class="cx-choice"><input type="radio" name="kind" value="unit"' + (cfg.kind === 'unit' ? ' checked' : '') + (builtUnits().length ? '' : ' disabled') + '><span><b>Unit test</b><span>One unit, weighted by topic.</span></span></label>' +
        '<label class="cx-choice"><input type="radio" name="kind" value="mixed"' + (cfg.kind === 'mixed' ? ' checked' : '') + (builtUnits().length ? '' : ' disabled') + '><span><b>Mixed timed set</b><span>10, 20 or 30 questions from every unit at exam pace (part of the cram kit).</span></span></label>' +
      '</div></fieldset><div class="cx-step"><h2 class="cx-step-h">' + n1 + '2</span>Settings</h2><div class="calc-ex-panel">' + panelHtml() + '</div></div>' +
      '<div class="cx-start"><p class="cx-sum"><span class="calc-pr-avail" aria-live="polite"></span>' +
      '<small>No feedback until the end. Your first tap locks an answer in; you can skip and come back. Then you review every question with its explanation, and misses go to your review queue.</small></p>' +
      '<button type="submit" class="btn-press calc-pr-start">Start</button></div></form>' +
      historyHtml() + '</div>' + examRail() + '</div>';
    var form = app.querySelector('form');
    function refresh(){
      var s = summary(), el = app.querySelector('.calc-pr-avail');
      el.textContent = s;
      var btn = app.querySelector('.calc-pr-start');
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
        app.querySelector('.calc-ex-panel').innerHTML = panelHtml();
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
    return '<h2 class="calc-ex-h2">Your recent exams</h2><ul class="calc-pr-next-list">' + h.map(function(x){
      return '<li><div><b>' + esc(x.label) + '</b><span class="calc-small">' + new Date(x.ts).toLocaleDateString() + ' &middot; multiple choice ' + x.mcq.c + '/' + x.mcq.n +
        (x.frq && x.frq.of ? ' &middot; free response ' + x.frq.got + '/' + x.frq.of : '') + (x.band ? ' &middot; rough band ' + x.band + ' (not calibrated)' : '') + '</span></div></li>';
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
    var btn = app.querySelector('.calc-pr-start');
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
      var msg = app.querySelector('.calc-pr-avail'); if(msg) msg.textContent = 'The exam questions did not load. Check your connection and try again.';
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
      // Part A (no calculator) first, then Part B (calculator), each shuffled.
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
    var btn = app.querySelector('.calc-pr-start');
    if(btn){ btn.disabled = true; btn.textContent = 'Loading questions…'; }
    Promise.all([Core.loadQuestions(BASE, stubsList), Promise.all(frqPick.map(function(f){ return K.load(BASE, f.id); }))]).then(function(r){
      var full = r[0];
      if(full.length !== stubsList.length) throw new Error('missing questions');
      if(cfg.kind !== 'mixed' && Core.freeExam && !Core.freeExam().use()){ renderSetup(); return; }
      startExam(full, r[1], label, meta, timing().k);
    }).catch(function(){
      if(btn){ btn.disabled = false; btn.textContent = 'Start'; }
      var msg = app.querySelector('.calc-pr-avail'); if(msg) msg.textContent = 'The exam questions did not load. Check your connection and try again.';
    });
  }

  /* An exam is a list of timed parts. A practice exam has Section I Part A
     (no calculator) and Part B (calculator), then Section II Part A
     (calculator) and Part B (no calculator); a unit test or a timed set is
     one part. Empty parts are dropped. */
  function startExam(qs, frqs, label, meta, k){
    var full = meta.kind === 'full';
    var mcqParts = full ? MCQ_PARTS.map(function(P){ return { key: P.key, calc: P.calc, qs: qs.filter(function(q){ return !!q.calc === P.calc; }), sec: P.sec / P.n }; }).filter(function(p){ return p.qs.length; })
      : [{ key: null, calc: null, qs: qs }];
    var frqParts = FRQ_PARTS.map(function(P){ return { key: P.key, calc: P.calc, frqs: (frqs || []).filter(function(f){ return !!f.calc === P.calc; }), sec: P.sec / P.n }; }).filter(function(p){ return p.frqs.length; });
    run = { label: label, meta: meta, k: k, res: {}, rows: [], startedAt: Date.now(), done: false, section: 1,
      mcqParts: mcqParts, frqParts: frqParts, frqs: frqParts.reduce(function(o, p){ return o.concat(p.frqs); }, []), answers: [], pi: 0 };
    window.addEventListener('beforeunload', guard);
    startSectionOne(0);
  }

  /* ------------------------------------------------------ Section I */

  function clockHtml(limit, pausable){
    return '<div class="calc-ex-clock"><span class="calc-ex-time" role="timer" aria-label="' + (limit ? 'Time left' : 'Time used') + '">' + (limit ? mmss(limit) : '0:00') + '</span>' +
      (limit ? '' : '<span class="calc-small">Untimed</span>') + (pausable && limit ? '<button type="button" class="btn-outline calc-ex-pause" aria-pressed="false">Pause</button>' : '') + '</div>';
  }
  function startClock(limit, onEnd){
    run.limit = limit; run.left = limit; run.used = 0; run.last = Date.now(); run.paused = false; run.warned = {};
    clearInterval(run.tick);
    run.tick = setInterval(function(){
      if(!run || run.done) return;
      var t = Date.now(), d = t - run.last; run.last = t;
      if(run.paused) return;
      run.used += d;
      var el = app.querySelector('.calc-ex-time');
      if(!run.limit){ if(el) el.textContent = mmss(run.used); return; }
      run.left -= d;
      if(el){ el.textContent = mmss(run.left); el.classList.toggle('is-low', run.left < 60000); }
      [[600000, '10 minutes left.'], [300000, '5 minutes left.'], [60000, '1 minute left.']].forEach(function(w){
        if(run.limit > w[0] * 2 && run.left <= w[0] && !run.warned[w[0]]){ run.warned[w[0]] = 1; var sr = app.querySelector('.calc-ex-sr'); if(sr) sr.textContent = w[1]; }
      });
      if(run.left <= 0){ clearInterval(run.tick); onEnd(true); }
    }, 250);
  }
  function guard(e){ if(run && !run.done){ e.preventDefault(); e.returnValue = ''; } }

  function partName(sec, p){ return p.key ? 'Section ' + sec + ', Part ' + p.key : ''; }
  function startSectionOne(pi){
    var P = run.mcqParts[pi], qs = P.qs, frqs = run.frqs, label = run.label, k = run.k;
    run.pi = pi; run.qs = qs; run.i = 0; run.els = {}; run.section = 1;
    view('run');
    var limit = k ? Math.round((P.key ? P.sec * qs.length : qsSec(qs)) * k * 1000) : 0;
    var more = pi < run.mcqParts.length - 1 || frqs.length;
    var endWord = P.key ? 'End Part ' + P.key : frqs.length ? 'End Section I' : 'Finish exam';
    app.innerHTML = '<div class="calc-ex-run">' +
      '<div class="calc-ex-top"><div class="calc-ex-title"><span class="calc-pr-label">' + esc(label) + (P.key ? ' &middot; ' + partName(1, P) : frqs.length ? ' &middot; Section I' : '') + '</span><span class="calc-small calc-ex-status" aria-live="polite"></span></div>' + clockHtml(limit, true) + '</div>' +
      (P.key ? calcNotice(P.calc) : '') +
      '<p class="calc-ex-sr" aria-live="assertive"></p>' +
      '<details class="calc-ex-navwrap"' + (window.matchMedia && window.matchMedia('(min-width: 700px)').matches ? ' open' : '') + '><summary>All questions <span class="calc-ex-navcount"></span></summary>' +
      '<nav class="calc-ex-nav" aria-label="Questions">' + qs.map(function(q, i){ return '<button type="button" data-go="' + i + '" aria-label="Question ' + (i + 1) + ', not answered">' + (i + 1) + '</button>'; }).join('') + '</nav></details>' +
      '<div class="calc-ex-paused" hidden><p><b>Paused.</b> The question is hidden while the clock is stopped.</p><button type="button" class="btn-press calc-ex-resume">Resume</button></div>' +
      '<h2 class="sr-only">' + (P.key ? partName(1, P) : 'Section I') + ' questions</h2><div class="calc-ex-stage"></div>' +
      '<div class="calc-ex-controls"><button type="button" class="btn-outline calc-ex-prev">Previous</button><button type="button" class="btn-press calc-ex-next">Next</button><button type="button" class="btn-outline calc-ex-finish">' + endWord + '</button></div>' +
      '<div class="calc-ex-confirm" hidden role="alertdialog" aria-labelledby="calc-ex-confirm-t"><p id="calc-ex-confirm-t"></p><button type="button" class="btn-press calc-ex-yes">' + (more ? endWord : 'Finish now') + '</button> <button type="button" class="btn-outline calc-ex-no">Keep working</button></div>' +
    '</div>';
    app.querySelector('.calc-ex-nav').addEventListener('click', function(e){ var b = e.target.closest('[data-go]'); if(b) go(+b.getAttribute('data-go')); });
    app.querySelector('.calc-ex-prev').addEventListener('click', function(){ go(run.i - 1); });
    app.querySelector('.calc-ex-next').addEventListener('click', nextUnanswered);
    app.querySelector('.calc-ex-finish').addEventListener('click', askFinish);
    app.querySelector('.calc-ex-yes').addEventListener('click', function(){ endSectionOne(false); });
    app.querySelector('.calc-ex-no').addEventListener('click', function(){ app.querySelector('.calc-ex-confirm').hidden = true; app.querySelector('.calc-ex-finish').focus(); });
    var pb = app.querySelector('.calc-ex-pause');
    if(pb){ pb.addEventListener('click', function(){ pause(!run.paused); }); app.querySelector('.calc-ex-resume').addEventListener('click', function(){ pause(false); }); }
    startClock(limit, function(){ endSectionOne(true); });
    go(0);
  }
  function pause(on){
    run.paused = on;
    var b = app.querySelector('.calc-ex-pause');
    b.setAttribute('aria-pressed', on ? 'true' : 'false'); b.textContent = on ? 'Resume' : 'Pause';
    ['.calc-ex-stage', '.calc-ex-navwrap', '.calc-ex-controls'].forEach(function(s){ app.querySelector(s).hidden = on; });
    app.querySelector('.calc-ex-paused').hidden = !on;
    (on ? app.querySelector('.calc-ex-resume') : b).focus();
  }
  function answered(){ return run.qs.filter(function(q){ return run.res[q.id]; }).length; }
  function moreAfter(){ return run.pi < run.mcqParts.length - 1 || run.frqs.length; }
  function endWord(){ var P = run.mcqParts[run.pi]; return P.key ? 'End Part ' + P.key : run.frqs.length ? 'End Section I' : 'Finish exam'; }
  function status(){
    app.querySelector('.calc-ex-status').textContent = 'Question ' + (run.i + 1) + ' of ' + run.qs.length + ' · ' + answered() + ' answered';
    app.querySelectorAll('.calc-ex-nav button').forEach(function(b, i){
      var d = !!run.res[run.qs[i].id];
      b.classList.toggle('is-done', d);
      if(i === run.i) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current');
      b.setAttribute('aria-label', 'Question ' + (i + 1) + ', ' + (d ? 'answered' : 'not answered'));
    });
    app.querySelector('.calc-ex-navcount').textContent = '(' + answered() + ' of ' + run.qs.length + ' answered)';
    app.querySelector('.calc-ex-prev').disabled = run.i === 0;
    var left = run.qs.length - answered();
    app.querySelector('.calc-ex-next').textContent = !left ? endWord() : (run.res[run.qs[run.i].id] ? 'Next' : 'Skip for now');
  }
  function go(i){
    if(i < 0 || i >= run.qs.length) return;
    run.i = i;
    var stage = app.querySelector('.calc-ex-stage');
    Object.keys(run.els).forEach(function(k){ run.els[k].hidden = true; });
    var q = run.qs[i];
    if(!run.els[q.id]){
      var box = document.createElement('div');
      box.className = 'calc-ex-q';
      stage.appendChild(box);
      run.els[q.id] = box;
      // A set's stimulus is shown with each of its questions.
      Q.hydrate(box, [q], { exam: true, record: false, onAnswer: function(res){ lockedIn(q, box, res); } });
      var nEl = box.querySelector('.calc-q-n'); if(nEl) nEl.textContent = (i + 1) + '.';
      var chk = box.querySelector('.calc-check'); if(chk) chk.textContent = 'Lock in answer';
    }
    run.els[q.id].hidden = false;
    status();
    var stem = run.els[q.id].querySelector('.calc-q-stem');
    if(stem){ stem.setAttribute('tabindex', '-1'); try{ stem.focus({ preventScroll: true }); }catch(e){ stem.focus(); } }
    var top = app.querySelector('.calc-ex-run');
    if(top && top.getBoundingClientRect().top < 0) top.scrollIntoView();
  }
  function capture(q, box, res){
    var body = box.querySelector('.calc-q-body');
    if(q.type === 'predict') return q.variables.map(function(v, k){ var b = body.querySelector('tr[data-k="' + k + '"] button[aria-checked="true"]'); return b ? b.getAttribute('data-v') : null; });
    if(q.type === 'order' || q.type === 'numeric' || q.type === 'expr') return res.pick;
    var picked = [].map.call(body.querySelectorAll('.calc-opt[aria-checked="true"]'), function(b){ return +b.getAttribute('data-i'); });
    return q.type === 'multi' ? picked : (picked.length ? picked[0] : null);
  }
  function lockedIn(q, box, res){
    run.res[q.id] = { correct: res.correct, score: res.score, pick: capture(q, box, res) };
    box.querySelectorAll('.calc-q-body button').forEach(function(b){ b.disabled = true; });
    var fb = box.querySelector('.calc-q-feedback'); if(fb) fb.innerHTML = '<p class="calc-small">Answer locked in.</p>';
    status();
    var nb = app.querySelector('.calc-ex-next'); try{ nb.focus({ preventScroll: true }); }catch(e){ nb.focus(); }
  }
  function nextUnanswered(){
    var n = run.qs.length;
    if(answered() === n) return askFinish();
    for(var s = 1; s <= n; s++){ var j = (run.i + s) % n; if(!run.res[run.qs[j].id]){ go(j); return; } }
  }
  function askFinish(){
    var left = run.qs.length - answered(), box = app.querySelector('.calc-ex-confirm');
    box.querySelector('p').textContent = (left ? plural(left, 'question') + ' not answered yet. Unanswered questions count as wrong. ' : 'All ' + run.qs.length + ' answered. ') +
      (moreAfter() ? 'You cannot come back to ' + (run.mcqParts[run.pi].key ? 'this part' : 'Section I') + '. End it now?' : 'Finish and see your results?');
    box.hidden = false;
    box.querySelector('.calc-ex-yes').focus();
  }
  /* A break between parts: what was done, the next part's calculator rule,
     and a button to start it. */
  function breakCard(title, next, onGo, extra){
    app.innerHTML = '<div class="calc-ex-break-card"><h2 tabindex="-1">' + title + '</h2>' + next +
      '<div class="calc-pr-actions"><button type="button" class="btn-press" data-act="go">Start</button>' + (extra ? '<button type="button" class="btn-outline" data-act="booklet">Print the answer booklet</button>' : '') + '</div></div>';
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
        '<p class="calc-small">Your answers so far are saved and scored at the end. You cannot go back to the part you finished.</p>', function(){ startSectionOne(run.pi + 1); });
      return;
    }
    if(!run.frqs.length) return finish();
    run.section = 0;
    view('break');
    var F = run.frqParts[0];
    breakCard(done, '<p>Section II has ' + plural(run.frqs.length, 'free-response question') + ', each worth ' + FRQ_POINTS + ' points, in ' + plural(run.frqParts.length, 'part') + '. ' + (F.key ? partName(2, F) + ': ' + plural(F.frqs.length, 'question') + (run.k ? ' in ' + minutes(F.sec * F.frqs.length * run.k) : '') + '. ' : '') +
      (run.k ? 'The clock cannot be paused, as on the real exam. ' : '') + 'Answer on screen, or print the answer booklet and write on paper.</p>' + calcNotice(F.calc) +
      '<p class="calc-small">Your Section I answers are saved and scored at the end.</p>', function(){ startSectionTwo(0); }, true);
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
    app.innerHTML = '<div class="calc-ex-run calc-ex-s2">' +
      '<div class="calc-ex-top"><div class="calc-ex-title"><span class="calc-pr-label">' + esc(run.label) + ' &middot; ' + partName(2, P) + '</span><span class="calc-small calc-ex-status" aria-live="polite"></span></div>' + clockHtml(limit, false) + '</div>' +
      calcNotice(P.calc) +
      '<p class="calc-ex-sr" aria-live="assertive"></p>' +
      '<nav class="calc-ex-nav" aria-label="Free-response questions">' + fs.map(function(f, i){ return '<button type="button" data-go="' + i + '">' + (base0 + i + 1) + '</button>'; }).join('') + '</nav>' +
      '<h2 class="sr-only">' + partName(2, P) + ' questions</h2><div class="calc-ex-stage">' + fs.map(function(f, i){ return '<div class="calc-ex-fq" data-i="' + i + '" hidden>' + K.questionHtml(f, { n: base0 + i + 1, write: true, draftKey: '' }) + '</div>'; }).join('') + '</div>' +
      '<div class="calc-ex-controls"><button type="button" class="btn-outline calc-ex-prev">Previous</button><button type="button" class="btn-press calc-ex-next">Next question</button>' +
        '<button type="button" class="btn-outline" data-act="booklet">Print the answer booklet</button><button type="button" class="btn-outline calc-ex-finish">End Part ' + P.key + '</button></div>' +
      '<div class="calc-ex-confirm" hidden role="alertdialog" aria-labelledby="calc-ex-confirm2-t"><p id="calc-ex-confirm2-t">' + (last ? 'End Section II and score your answers with the rubrics?' : 'End ' + partName(2, P) + '? You cannot come back to it.') + '</p><button type="button" class="btn-press calc-ex-yes">' + (last ? 'End and score' : 'End Part ' + P.key) + '</button> <button type="button" class="btn-outline calc-ex-no">Keep working</button></div>' +
    '</div>';
    app.querySelector('.calc-ex-nav').addEventListener('click', function(e){ var b = e.target.closest('[data-go]'); if(b) goF(+b.getAttribute('data-go')); });
    app.querySelector('.calc-ex-prev').addEventListener('click', function(){ goF(run.fi - 1); });
    app.querySelector('.calc-ex-next').addEventListener('click', function(){ goF(run.fi + 1); });
    app.querySelector('[data-act="booklet"]').addEventListener('click', booklet);
    app.querySelector('.calc-ex-finish').addEventListener('click', function(){ var c = app.querySelector('.calc-ex-confirm'); c.hidden = false; c.querySelector('.calc-ex-yes').focus(); });
    app.querySelector('.calc-ex-yes').addEventListener('click', function(){ endFrqPart(false); });
    app.querySelector('.calc-ex-no').addEventListener('click', function(){ app.querySelector('.calc-ex-confirm').hidden = true; app.querySelector('.calc-ex-finish').focus(); });
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
    app.querySelectorAll('.calc-ex-fq').forEach(function(el){ el.hidden = +el.getAttribute('data-i') !== i; });
    app.querySelectorAll('.calc-ex-nav button').forEach(function(b, k){ if(k === i) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current'); b.setAttribute('aria-label', 'Free-response question ' + b.textContent); });
    app.querySelector('.calc-ex-status').textContent = 'Question ' + (i + 1) + ' of ' + run.cur.length + ' in this part';
    app.querySelector('.calc-ex-prev').disabled = i === 0;
    app.querySelector('.calc-ex-next').disabled = i === run.cur.length - 1;
    var k = app.querySelector('.calc-ex-fq[data-i="' + i + '"] .calc-fq-k');
    if(k){ k.setAttribute('tabindex', '-1'); try{ k.focus({ preventScroll: true }); }catch(e){ k.focus(); } }
  }
  function answersOf(i){
    var out = {};
    app.querySelectorAll('.calc-ex-fq[data-i="' + i + '"] .calc-fq-answer').forEach(function(t){ out[t.getAttribute('data-part')] = t.value; });
    return out;
  }
  function selfScore(timeUp){
    if(run.section !== 2.5) return;
    clearInterval(run.tick);
    run.section = 3;
    view('score');
    app.innerHTML = '<div class="calc-ex-score"><h2 tabindex="-1">' + (timeUp ? 'Time is up for Section II. ' : '') + 'Score your free responses</h2>' +
      '<p>For each part, read your answer, then check every rubric point it earns. Check a point only if your answer says it, in your own words. If you wrote on paper, score the booklet.</p>' +
      run.frqs.map(function(f, i){
        return '<section class="calc-ex-fscore" aria-labelledby="fs-' + i + '"><h3 id="fs-' + i + '">Question ' + (i + 1) + ': ' + esc(f.title) + ' <span class="calc-small">(' + plural(f.points, 'point') + ')</span></h3>' +
          '<details class="calc-ex-fprompt"><summary>Show the question</summary>' + K.questionHtml(f, {}) + '</details>' +
          '<div class="calc-ex-yours">' + f.parts.map(function(p){ var a = run.answers[i][p.label]; return '<p><b>Your answer to (' + esc(p.label) + '):</b> ' + (a ? esc(a).replace(/\n/g, '<br>') : '<span class="calc-small">nothing typed</span>') + '</p>'; }).join('') + '</div>' +
          K.rubricHtml(f) + '<p class="calc-fq-total" aria-live="polite"></p></section>';
      }).join('') +
      '<div class="calc-pr-actions"><button type="button" class="btn-press" data-act="results">See my results</button></div></div>';
    function totals(){ app.querySelectorAll('.calc-ex-fscore').forEach(function(sec){ var s = K.score(sec); sec.querySelector('.calc-fq-total').textContent = s.got + ' of ' + s.of + ' points checked.'; }); }
    app.addEventListener('change', totals); totals();
    app.querySelector('[data-act="results"]').addEventListener('click', function(){
      app.removeEventListener('change', totals);
      run.frqScores = [].map.call(app.querySelectorAll('.calc-ex-fscore'), function(sec){ return K.score(sec); });
      finish();
    });
    app.querySelector('h2').focus();
  }

  /* ------------------------------------------------------ results */

  function band(p){ return p >= 66 ? 5 : p >= 49 ? 4 : p >= 40 ? 3 : p >= 23 ? 2 : 1; }
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
    // Each section is half the exam score (docs/apcalc-research/framework.md, section 2).
    var mcqP = pctOf(right, total), composite = fo ? Math.round(0.5 * mcqP + 0.5 * (fg / fo * 100)) : mcqP;
    var isExam = run.meta.kind === 'full';
    var b = isExam ? band(composite) : 0;
    var hist = prefs().examHistory || [];
    hist.push({ ts: Date.now(), kind: run.meta.kind, label: run.label, unit: run.meta.unit || null, form: run.meta.form || null, mcq: { c: right, n: total }, frq: fo ? { got: fg, of: fo } : null, band: b || null, partial: !!run.meta.partial });
    setPref('examHistory', hist.slice(-30));
    // Each FRQ's self-score also counts as an attempt on the FRQ page.
    (run.frqScores || []).forEach(function(s, i){ var f = run.frqs[i]; K.saveScore(f.id, { got: s.got, of: s.of, parts: s.parts, title: f.title, type: f.type, units: f.units, exam: true }); });
    Core.event('apcalc-exam-finish', { kind: run.meta.kind, correct: right, total: total, frq: fg, frqOf: fo, partial: !!run.meta.partial });
    var stage = app.querySelector('.calc-ex-stage') || app;
    stage.insertAdjacentHTML('afterbegin', '<p class="calc-small">Marking your exam and loading the explanations…</p>');
    Promise.all(rows.map(function(x){ return Core.loadWhy(BASE, x.q); })).then(function(){ results(rows, right, fg, fo, composite, b); }, function(){ results(rows, right, fg, fo, composite, b); });
  }
  function tally(rows, keyFn){
    var out = {}, order = [];
    rows.forEach(function(x){ var k = keyFn(x.q); if(!k) return; if(!out[k]){ out[k] = { n: 0, c: 0 }; order.push(k); } out[k].n++; if(x.r.correct) out[k].c++; });
    return order.map(function(k){ return { key: k, n: out[k].n, c: out[k].c }; });
  }
  function barTable(title, list, name, link, unitWord){
    if(!list.length) return '';
    return '<section class="calc-ex-break"><h3>' + title + '</h3><ul class="calc-ex-bars">' + list.map(function(x){
      var p = pctOf(x.c, x.n), nm = esc(name(x.key)), href = link && link(x.key);
      return '<li><span class="calc-ex-bar-name">' + (href ? '<a href="' + href + '">' + nm + '</a>' : nm) + '</span><span class="track thin" aria-hidden="true"><i class="' + (p >= 80 ? 'is-hi' : p >= 60 ? 'is-mid' : 'is-lo') + '" style="width:' + p + '%"></i></span><span class="calc-ex-bar-v">' + x.c + '/' + x.n + (unitWord ? ' ' + unitWord : '') + '</span></li>';
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
    app.innerHTML = '<div class="calc-ex-results">' +
      '<div class="calc-pr-score"><span class="calc-pr-score-big">' + right + '<small>/' + total + '</small></span><span><b>Multiple choice: ' + pctOf(right, total) + '%</b><span class="calc-small">' + esc(run.label) +
        (run.timeUp1 ? ' · time ran out in Section I' : '') + '</span></span></div>' +
      (fo ? '<div class="calc-pr-score calc-ex-fsum"><span class="calc-pr-score-big">' + fg + '<small>/' + fo + '</small></span><span><b>Free response (your self-score): ' + pctOf(fg, fo) + '%</b><span class="calc-small">' + plural(run.frqs.length, 'question') + ' scored with the rubrics' + (run.timeUp2 ? ' · time ran out in Section II' : '') + '</span></span></div>' : '') +
      (k === 'full' ? '<section class="calc-ex-band" aria-labelledby="calc-ex-band-h"><h2 id="calc-ex-band-h">Readiness estimate: band ' + b + ' of 5</h2>' +
        '<p class="calc-ex-band-warn"><b>' + NOT_CALIBRATED + '</b></p>' +
        '<p class="calc-small">How it is worked out: multiple choice and free response count half each, as the two sections do on the exam, giving ' + composite + '%; then 66% and up is band 5, 49% band 4, 40% band 3, 23% band 2, below that band 1. These cut-offs are our estimate, fitted to the published 2024 to 2026 score distributions; the real ones are not published and change a little each year' +
        (run.meta.partial ? ', and this was a shorter exam that leaves out units with no questions yet' : '') + '. The <a href="' + BASE + 'score-calculator.html">score calculator</a> explains the method.</p></section>' : '') +
      (missedN ? '<p>' + plural(rows.filter(function(x){ return !x.r.correct && !x.q.own; }).length, 'missed question') + ' went to your <a href="' + BASE + 'review.html">review queue</a>' + (rows.some(function(x){ return !x.r.correct && x.q.own; }) ? ' (questions written only for this exam stay here, in the review below)' : '') + '.</p>' : '<p>Every multiple-choice question right.</p>') +
      (weak.length ? '<h2>Study next</h2><ul class="calc-pr-next-list">' + weak.map(function(x){
        return '<li><div><b>' + esc(TOPIC[x.key] ? TOPIC[x.key].title : x.key) + '</b><span class="calc-small">' + x.c + ' of ' + x.n + ' right</span></div><a class="btn-outline" href="' + BASE + 'lessons/' + x.key + '.html">Lesson</a><a class="btn-outline" href="' + BASE + 'notes/' + x.key + '.html">Notes</a></li>';
      }).join('') + '</ul>' : '') +
      '<h2>Your score, broken down</h2><div class="calc-ex-breaks">' +
        barTable('Multiple choice by unit', byUnit, unitName, function(key){ return BASE + 'units/' + key + '.html'; }) +
        (fo ? barTable('Free response by unit (points)', Object.keys(frqByUnit).map(function(u){ return frqByUnit[u]; }), unitName, null, 'pts') : '') +
        barTable('Multiple choice by mathematical practice', byPractice, function(key){ return key + (PRACTICE[key] ? '. ' + PRACTICE[key].name : ''); }) +
        barTable('By topic', byTopic, function(key){ return TOPIC[key] ? TOPIC[key].title : key; }, function(key){ return BASE + 'lessons/' + key + '.html'; }) +
        barTable('By level', byLevel, function(key){ return LEVEL_NAME[key] || key; }) +
      '</div>' +
      '<div class="calc-pr-actions">' + (missedN ? '<a class="btn-press" href="' + BASE + 'practice.html?mode=missed">Practice your misses</a>' : '') + '<button type="button" class="btn-outline" data-act="again">Another exam</button></div>' +
      '<h2>Review every question</h2>' +
      '<div class="calc-ex-filter" role="group" aria-label="Show"><button type="button" class="calc-pr-chip-b" aria-pressed="true" data-f="all">All ' + total + '</button><button type="button" class="calc-pr-chip-b" aria-pressed="false" data-f="miss"' + (missedN ? '' : ' disabled') + '>Missed ' + missedN + '</button></div>' +
      '<ol class="calc-ex-review">' + rows.map(function(x, i){ return reviewItem(x.q, x.r, i + 1); }).join('') + '</ol>' +
      (window.LevlPremium && window.LevlPremium.card ? window.LevlPremium.card('apcalc', 'summary') : '') +
      '<div class="calc-pr-actions"><button type="button" class="btn-outline" data-act="again">Another exam</button></div></div>';
    app.querySelectorAll('[data-act="again"]').forEach(function(x){ x.addEventListener('click', renderSetup); });
    app.querySelectorAll('[data-f]').forEach(function(x){
      x.addEventListener('click', function(){
        var miss = x.getAttribute('data-f') === 'miss';
        app.querySelectorAll('[data-f]').forEach(function(y){ y.setAttribute('aria-pressed', y === x ? 'true' : 'false'); });
        app.querySelectorAll('.calc-ex-ritem').forEach(function(li){ li.hidden = miss && li.classList.contains('is-ok'); });
      });
    });
    var h = app.querySelector('.calc-pr-score'); h.setAttribute('tabindex', '-1'); h.focus();
  }

  /* One question in the review, options in authored order, each with its
     own explanation; explanations never name a position. */
  function reviewItem(q, r, n){
    var cls = r.correct ? 'is-ok' : (r.score > 0 ? 'is-part' : 'is-no');
    var verdict = r.skipped ? 'Not answered' : r.correct ? 'Correct' : r.score > 0 ? 'Partly right' : 'Missed';
    var why = q.why || {}, opts = why.options || [], body = '';
    function tag(t, c){ return '<span class="calc-ex-tag ' + c + '">' + t + '</span>'; }
    if(q.type === 'predict'){
      body = '<ul class="calc-ex-vars">' + q.variables.map(function(v, k){
        var mine = r.pick && r.pick[k], ok = mine === v.answer;
        function dir(d){ return d === 'up' ? 'Increases' : d === 'down' ? 'Decreases' : d === 'none' ? 'No change' : 'No answer'; }
        return '<li class="' + (ok ? 'is-ok' : 'is-no') + '"><span class="calc-ex-vname"><span class="calc-ex-mark" aria-hidden="true">' + (ok ? '✓' : '✗') + '</span>' + html(v.name) + '</span><span class="calc-ex-vpick">You: ' + dir(mine) + (ok ? '' : ' · Answer: <b>' + dir(v.answer) + '</b>') + '<span class="calc-ex-sr"> (' + (ok ? 'right' : 'wrong') + ')</span></span>' + (v.why ? '<span class="calc-ex-vwhy">' + html(v.why) + '</span>' : '') + '</li>';
      }).join('') + '</ul>';
    } else if(q.type === 'order'){
      var mine = r.pick || [];
      body = '<div class="calc-ex-orders">' + (mine.length ? '<div><p class="calc-small">Your order</p><ol class="calc-order">' + mine.map(function(i, k){ return '<li class="' + (i === k ? 'pos-ok' : 'pos-no') + '"><span class="calc-ex-mark" aria-hidden="true">' + (i === k ? '✓' : '✗') + '</span><span class="calc-order-text">' + html(q.options[i]) + '</span><span class="calc-ex-sr">' + (i === k ? ' (right place)' : ' (wrong place)') + '</span></li>'; }).join('') + '</ol></div>' : '') +
        '<div><p class="calc-small">Correct order</p><ol class="calc-order">' + q.options.map(function(o){ return '<li><span class="calc-order-text">' + html(o) + '</span></li>'; }).join('') + '</ol></div></div>';
    } else if(q.type === 'numeric'){
      body = '<p>You: <b>' + (r.pick ? esc(typeof r.pick === 'object' ? r.pick.value + ' ' + (r.pick.unit || '') : r.pick) : 'no answer') + '</b> · Answer: <b>' + Q.formatKey(q.numeric || {}, q.calc) + '</b></p>';
    } else if(q.type === 'expr'){
      var E = q.expr || {};
      body = '<p>You: <b>' + (r.pick ? esc(r.pick) : 'no answer') + '</b> · Answer: <b>' + (E.lhsHtml ? E.lhsHtml + ' ' : '') + (E.answerHtml || esc(E.answer)) + '</b></p>';
    } else {
      var key = [].concat(q.correct), picks = r.pick == null ? [] : [].concat(r.pick);
      body = '<ul class="calc-ex-opts">' + (q.options || []).map(function(o, i){
        var isKey = key.indexOf(i) > -1, isPick = picks.indexOf(i) > -1;
        return '<li class="' + (isKey ? 'is-right' : isPick ? 'is-wrong' : '') + '"><span class="calc-ex-otext">' + html(o) + '</span>' + (isPick ? tag('Your answer', isKey ? 'ok' : 'no') : '') + (isKey ? tag(q.type === 'multi' ? 'Correct' : 'Correct answer', 'key') : '') + (opts[i] ? '<span class="calc-opt-why">' + html(opts[i]) + '</span>' : '') + '</li>';
      }).join('') + '</ul>';
    }
    var t = TOPIC[q.topic];
    return '<li class="calc-q calc-ex-ritem ' + cls + '"><p class="calc-ex-verdict"><span class="calc-ex-vtag">' + verdict + (r.score > 0 && !r.correct ? ' (' + Math.round(r.score * 100) + '%)' : '') + '</span><span class="calc-small">' + esc(t ? t.title : '') + ' · Practice ' + esc(q.practice || '') + '</span></p>' +
      (q.stim ? '<details class="calc-ex-stimd"><summary>Show the ' + esc((q.stim.kind === 'table' ? 'table' : q.stim.kind === 'graph' ? 'graph' : 'diagram')) + ': ' + (q.stim.title || '') + '</summary>' + Q.stimulusPanel(q.stimulus, q.stim) + '</details>' : '') +
      '<p class="calc-q-stem"><span class="calc-q-n">' + n + '.</span> ' + html(q.q) + '</p>' + body + (why.correct ? '<p class="calc-ex-why"><b>Why:</b> ' + html(why.correct) + '</p>' : '') +
      '<p class="calc-ex-links"><a href="' + BASE + 'lessons/' + q.topic + '.html">Lesson</a> <span aria-hidden="true">&middot;</span> <a href="' + BASE + 'notes/' + q.topic + '.html">Notes</a>' + (window.LevlReport ? ' ' + window.LevlReport.button('apcalc', q.id) : '') + '</p></li>';
  }

  /* ------------------------------------------------------ boot */

  function boot(){
    if(!Q || !Core){ app.innerHTML = '<p>Exams could not start. Reload the page to try again.</p>'; return; }
    app.innerHTML = '<p class="calc-small">Loading the question bank…</p>';
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
      if(p.toString()){ var s = app.querySelector('.calc-pr-start'); if(s && !s.disabled) s.focus(); }
    }).catch(function(){ app.innerHTML = '<p>The question bank did not load. Check your connection and reload.</p>'; });
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
