/* AP® Biology Exams (docs/apbio-spec.md section 1, "Exams"; forked from
   anatomy-physiology/assets/apps/exams.js).

     Unit test       one unit, weighted by topic: every published topic of the
                     unit gets an equal share of the questions, stimulus sets
                     kept whole and in authored order. 15, 25 or all.
     Practice exam   the hybrid format. Section I: 60 multiple-choice
                     questions in 90 minutes, drawn from each unit in
                     proportion to the midpoint of its exam weight range,
                     sets kept whole. Section II: 6 free-response questions
                     in 90 minutes, one of each type (two long 9-point, four
                     4-point), shown on screen with a printable answer
                     booklet. Then rubric self-scoring, point by point.

   When the bank cannot fill a full exam, the setup says so plainly (what a
   full exam needs, what exists per unit and per FRQ type) and offers a
   shorter exam from what exists, labelled as such; no count is invented.

   Timing: a visible clock. Section I and unit tests can be paused (an
   accessibility aid; the question hides while paused); Section II cannot,
   like the real exam. Extra-time settings and an untimed mode.

   An exam grades silently (ApBioQuestions opts.exam, record: false): the
   first tap on an answer locks it in. Every answer is recorded through
   ApBioCore when the exam ends (A&P decision 42), an unanswered question as
   a miss, so misses reach review. Results: MCQ score, FRQ self-score, by
   unit and by science practice, and for practice exams a readiness band
   (1-5) labelled "Not calibrated". History goes to apbio_prefs_v1
   .examHistory (the dashboard reads it).

     Mixed timed set the cram kit's timed sets (spec decision 26): 10, 20 or
                     30 questions from every published unit by the midpoint
                     of its exam weight (as Section I), sets whole, at the
                     exam's pace of 1.5 min a question; then the same review
                     with explanations. Opened from cram.html as
                     ?mode=mixed&n=10|20|30.

   Free tier: one exam of any kind (ApBioCore.freeExam), used when it starts;
   an exam in progress can always be finished. Mixed timed sets are part of
   the cram kit instead: Premium (ApBioCore.allowed('cram')), and they never
   use the free exam. */
(function(){
  var BASE = window.ApBioBase || '';
  var app = document.getElementById('app');
  if(!app) return;
  var hero = document.querySelector('.bio-hero');
  var CUR = window.ApBioCurriculum || { units: [], topics: [], practices: [] };
  var Core = window.ApBioCore, Q = window.ApBioQuestions;
  var PREFS = 'apbio_prefs_v1';
  var MCQ_TOTAL = 60, MCQ_SEC = 90;                 // Section I: 60 in 90 min
  var FRQ_SEC = { long: 25 * 60, short: 10 * 60 };  // Section II: 2 x 25 + 4 x 10 = 90 min
  var LONG = { iee: 1, 'iee-graph': 1 };
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
  var cfg = { kind: 'full', unit: '', len: 25, n: 20, timing: 'std' };
  var MIXED = [10, 20, 30];
  function cramOk(){ return !Core.allowed || Core.allowed('cram'); }

  function kit(){
    if(window.ApBioFrq) return Promise.resolve(window.ApBioFrq);
    return new Promise(function(res){
      var s = document.createElement('script');
      s.src = BASE + 'assets/pages/frq-kit.js';
      s.onload = function(){ res(window.ApBioFrq || null); };
      s.onerror = function(){ res(null); };
      document.head.appendChild(s);
    });
  }

  /* ------------------------------------------------------ planning */

  function makeBlocks(list){
    var out = [];
    list.forEach(function(q){
      var last = out[out.length - 1];
      if(q.stimulus && last && last.stimulus === q.stimulus && last.topic === q.topic) last.items.push(q);
      else out.push({ stimulus: q.stimulus || null, items: [q], topic: q.topic, unit: q.unit });
    });
    return out;
  }
  function courseUnits(){ return CUR.units.filter(function(u){ return u.part === 'course'; }); }
  function builtUnits(){ var h = {}; CUR.topics.forEach(function(t){ if(t.built && t.qn) h[t.unit] = 1; }); return courseUnits().filter(function(u){ return h[u.id]; }); }
  function unitBlocks(u){ return blocks.filter(function(b){ return b.unit === u; }); }
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

  /* The full exam: what it needs, what exists, and the exam we can give. */
  function examPlan(){
    var us = courseUnits(), w = {}, have = {};
    us.forEach(function(u){ w[u.id] = mid(u); have[u.id] = size(unitBlocks(u.id)); });
    var need = split(MCQ_TOTAL, w);
    var mcqFull = us.length && us.every(function(u){ return have[u.id] >= need[u.id]; });
    var types = {}; frqList.forEach(function(f){ (types[f.type] = types[f.type] || []).push(f); });
    var order = K ? K.ORDER : ['iee', 'iee-graph', 'investigation', 'conceptual', 'model', 'data'];
    var frqFull = order.every(function(t){ return types[t]; });
    var plan = { units: us, need: need, have: have, types: types, order: order, full: mcqFull && frqFull, mcqFull: mcqFull, frqFull: frqFull };
    if(mcqFull) plan.alloc = need;
    else {
      // Shorter exam: each built unit keeps its full-exam share, capped by
      // what exists; unbuilt units are left out, not filled from elsewhere.
      var bw = {}, cap = {};
      builtUnits().forEach(function(u){ bw[u.id] = w[u.id] || 1; cap[u.id] = have[u.id]; });
      var share = Object.keys(bw).reduce(function(s, k){ return s + (need[k] || 0); }, 0);
      plan.alloc = split(Math.max(Object.keys(bw).length ? 1 : 0, share), bw, cap);
    }
    plan.mcqN = Object.keys(plan.alloc).reduce(function(s, k){ return s + plan.alloc[k]; }, 0);
    plan.frqs = order.filter(function(t){ return types[t]; }).map(function(t){ return t; });
    return plan;
  }

  /* ------------------------------------------------------ setup */

  function view(name){ if(hero) hero.classList.toggle('bio-hero-min', name !== 'setup'); app.setAttribute('data-view', name); window.scrollTo(0, 0); }
  function timing(){ return TIMINGS.filter(function(t){ return t.id === cfg.timing; })[0]; }
  function timingField(){
    return '<label class="bio-pr-field"><span>Timing</span><select name="timing">' + TIMINGS.map(function(t){ return '<option value="' + t.id + '"' + (t.id === cfg.timing ? ' selected' : '') + '>' + t.name + '</option>'; }).join('') + '</select></label>';
  }
  function freeExamHtml(fe){
    if(fe.unlimited) return '';
    if(!fe.available) return Core.gate('exams', 'exams');
    return '<p class="bio-ex-note bio-ex-free"><b>Your free exam.</b> One exam is free: starting any exam below uses it, and once started you can always finish it. ' + (Core.badge ? Core.badge() : '') + '</p>';
  }
  function frqSec(types){ return types.reduce(function(s, t){ return s + (LONG[t] ? FRQ_SEC.long : FRQ_SEC.short); }, 0); }

  function panelHtml(){
    if(cfg.kind === 'mixed'){
      if(!cramOk()) return Core.gate('cram', 'cram-sets');
      var mp = mixedPlan(cfg.n);
      return '<fieldset class="bio-ex-group bio-ex-inline"><legend>Questions</legend>' + MIXED.map(function(v){
          return '<label class="bio-pr-chip"><input type="radio" name="n" value="' + v + '"' + (cfg.n === v ? ' checked' : '') + '><span>' + v + '</span></label>';
        }).join('') + '</fieldset>' + timingField() +
        '<div class="bio-ex-note"><p><b>How this set is drawn.</b> From every published unit by the middle of its exam weight range, with stimulus sets kept whole (so a set can run a question or two long). Timed at the exam\'s pace: ' + minutes(MCQ_SEC) + ' a question.</p><ul class="bio-ex-alloc">' +
          mp.units.map(function(u){ return '<li><span>' + esc(unitName(u.id)) + '</span><b>' + (mp.alloc[u.id] || 0) + '</b></li>'; }).join('') + '</ul></div>';
    }
    if(cfg.kind === 'unit'){
      var us = builtUnits(), p = unitPlan(cfg.unit, cfg.len);
      return '<label class="bio-pr-field"><span>Unit</span><select name="unit">' + us.map(function(u){ return '<option value="' + u.id + '"' + (u.id === cfg.unit ? ' selected' : '') + '>' + esc(unitName(u.id)) + '</option>'; }).join('') + '</select></label>' +
        '<fieldset class="bio-ex-group bio-ex-inline"><legend>Length</legend>' + [15, 25, 0].map(function(v){
          return '<label class="bio-pr-chip"><input type="radio" name="len" value="' + v + '"' + (cfg.len === v ? ' checked' : '') + '><span>' + (v || 'All ' + p.total) + '</span></label>';
        }).join('') + '</fieldset>' + timingField() +
        '<div class="bio-ex-note"><p><b>How this test is split.</b> Every published topic in the unit gets an equal share; stimulus sets stay whole.</p><ul class="bio-ex-alloc">' +
          p.topics.map(function(t){ return '<li><span>' + esc((t.ced ? t.ced + ' ' : '') + t.title) + '</span><b>' + (p.alloc[t.id] || 0) + '</b></li>'; }).join('') + '</ul></div>';
    }
    var plan = examPlan(), t = timing();
    var unitRows = plan.units.map(function(u){
      var ok = plan.have[u.id] >= plan.need[u.id];
      return '<li class="' + (plan.have[u.id] ? 'is-on' : 'is-off') + '"><span>' + esc(unitName(u.id)) + (Array.isArray(u.weight) ? ' <span class="bio-small">(' + u.weight[0] + '–' + u.weight[1] + '%)</span>' : '') + '</span><b>' +
        (plan.mcqFull ? plan.need[u.id] : (plan.alloc[u.id] || 0) + ' of ' + plan.need[u.id] + (ok ? '' : ' (' + plan.have[u.id] + ' written)')) + '</b></li>';
    }).join('');
    var typeRows = plan.order.map(function(ty){
      return '<li class="' + (plan.types[ty] ? 'is-on' : 'is-off') + '"><span>' + esc(K ? K.TYPES[ty] : ty) + ' <span class="bio-small">(' + (LONG[ty] ? 9 : 4) + ' points)</span></span><b>' + (plan.types[ty] ? 'ready' : 'not written yet') + '</b></li>';
    }).join('');
    return '<div class="bio-ex-note">' +
      (plan.full ? '<p><b>The full hybrid format.</b> Section I: ' + MCQ_TOTAL + ' multiple-choice questions in ' + minutes(MCQ_TOTAL * MCQ_SEC) + ', drawn from each unit by the midpoint of its exam weight, with stimulus sets kept whole. Section II: 6 free-response questions in 90 min, then you score them with the rubrics.</p>'
        : '<p><b>Not enough questions for a full practice exam yet.</b> A full exam needs ' + MCQ_TOTAL + ' multiple-choice questions spread over ' + (plan.units.length === 1 ? 'the course\'s one unit' : 'all ' + plan.units.length + ' units') + ' by exam weight, and 6 free-response questions, one of each type. ' +
          'Today the bank can give a <b>shorter exam</b>: ' + plural(plan.mcqN, 'multiple-choice question') + (plan.frqs.length ? ' and ' + plural(plan.frqs.length, 'free-response question') : ' and no free-response section') + ', each unit keeping the share it would have in a full exam. Units with no questions yet are left out, not filled in from other units.</p>') +
      '<h2 class="bio-ex-h3">Section I, by unit</h2><ul class="bio-ex-areas">' + unitRows + '</ul>' +
      '<h2 class="bio-ex-h3">Section II, by question type</h2><ul class="bio-ex-areas">' + typeRows + '</ul></div>' +
      timingField() +
      '<p class="bio-small">' + (t.k ? 'Section I: ' + minutes(plan.mcqN * MCQ_SEC * t.k) + (plan.frqs.length ? '. Section II: ' + minutes(frqSec(plan.frqs) * t.k) : '') + (t.k > 1 ? ', with extra time' : '') + '.' : 'Untimed: the clock counts up instead of down.') + '</p>';
  }
  function summary(){
    if(cfg.kind === 'mixed'){ if(!cramOk()) return 'Mixed timed sets are part of Premium.'; var m = mixedPlan(cfg.n); return m.n ? 'Mixed timed set: about ' + plural(m.n, 'question') + (timing().k ? ', ' + minutes(m.n * MCQ_SEC * timing().k) : ', untimed') + '.' : 'No questions are published yet.'; }
    if(cfg.kind === 'unit'){ var p = unitPlan(cfg.unit, cfg.len); return p.n ? plural(p.n, 'question') + (timing().k ? ', ' + minutes(p.n * MCQ_SEC * timing().k) : ', untimed') + '.' : 'No questions are published for this unit yet.'; }
    var plan = examPlan();
    if(!plan.mcqN) return 'No questions are published yet.';
    return (plan.full ? 'Full practice exam: ' : 'Shorter practice exam: ') + plural(plan.mcqN, 'multiple-choice question') + (plan.frqs.length ? ' + ' + plural(plan.frqs.length, 'free-response question') : '') + '.';
  }

  function renderSetup(){
    view('setup');
    if(!cfg.unit && builtUnits()[0]) cfg.unit = builtUnits()[0].id;
    var fe = Core.freeExam ? Core.freeExam() : { unlimited: true, available: true };
    app.innerHTML = freeExamHtml(fe) + '<form class="bio-pr-setup bio-ex-setup" novalidate>' +
      '<fieldset class="bio-pr-modes"><legend>Choose an exam</legend>' +
        '<label class="bio-pr-mode"><input type="radio" name="kind" value="full"' + (cfg.kind === 'full' ? ' checked' : '') + '><span class="bio-pr-mode-t">Practice exam</span><span class="bio-pr-mode-d">The hybrid format: multiple choice, then free response, scored with rubrics.</span></label>' +
        '<label class="bio-pr-mode"><input type="radio" name="kind" value="unit"' + (cfg.kind === 'unit' ? ' checked' : '') + (builtUnits().length ? '' : ' disabled') + '><span class="bio-pr-mode-t">Unit test</span><span class="bio-pr-mode-d">One unit, weighted by topic.</span></label>' +
        '<label class="bio-pr-mode"><input type="radio" name="kind" value="mixed"' + (cfg.kind === 'mixed' ? ' checked' : '') + (builtUnits().length ? '' : ' disabled') + '><span class="bio-pr-mode-t">Mixed timed set</span><span class="bio-pr-mode-d">10, 20 or 30 questions from every unit at exam pace (part of the cram kit).</span></label>' +
      '</fieldset><div class="bio-ex-panel">' + panelHtml() + '</div>' +
      '<p class="bio-pr-avail" aria-live="polite"></p>' +
      '<p class="bio-small bio-ex-how">Exam mode shows no feedback until the end. Your first tap on an answer locks it in; you can skip a question and come back. At the end you review every question with its explanation, and anything you missed goes to your review queue.</p>' +
      '<button type="submit" class="btn-press bio-pr-start">Start</button></form>' +
      historyHtml();
    var form = app.querySelector('form');
    function refresh(){
      var s = summary(), el = app.querySelector('.bio-pr-avail');
      el.textContent = s;
      var btn = app.querySelector('.bio-pr-start');
      btn.disabled = (cfg.kind === 'mixed' ? !cramOk() : !fe.available) || /^No /.test(s);
      btn.textContent = cfg.kind === 'mixed' ? 'Start the timed set' : cfg.kind === 'unit' ? 'Start the unit test' : (examPlan().full ? 'Start the practice exam' : 'Start the shorter exam');
    }
    form.addEventListener('change', function(e){
      var n = e.target.name, v = e.target.value;
      if(n === 'kind') cfg.kind = v;
      if(n === 'unit') cfg.unit = v;
      if(n === 'len') cfg.len = +v;
      if(n === 'n') cfg.n = +v;
      if(n === 'timing'){ cfg.timing = v; setPref('examTiming', v); }
      if(n === 'kind' || n === 'unit' || n === 'len' || n === 'n' || n === 'timing'){
        app.querySelector('.bio-ex-panel').innerHTML = panelHtml();
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
    return '<h2 class="bio-ex-h2">Your recent exams</h2><ul class="bio-pr-next-list">' + h.map(function(x){
      return '<li><div><b>' + esc(x.label) + '</b><span class="bio-small">' + new Date(x.ts).toLocaleDateString() + ' &middot; multiple choice ' + x.mcq.c + '/' + x.mcq.n +
        (x.frq && x.frq.of ? ' &middot; free response ' + x.frq.got + '/' + x.frq.of : '') + (x.band ? ' &middot; rough band ' + x.band + ' (not calibrated)' : '') + '</span></div></li>';
    }).join('') + '</ul>';
  }

  /* ------------------------------------------------------ building */

  function begin(){
    var picked = [], label, meta = { kind: cfg.kind }, frqTypes = [];
    if(cfg.kind === 'unit'){
      var up = unitPlan(cfg.unit, cfg.len);
      up.topics.forEach(function(t){ picked = picked.concat(fill(blocks.filter(function(b){ return b.topic === t.id; }), up.alloc[t.id] || 0)); });
      label = 'Unit test: ' + unitName(cfg.unit); meta.unit = cfg.unit;
    } else if(cfg.kind === 'mixed'){
      if(!cramOk()) return;
      var mp = mixedPlan(cfg.n);
      Object.keys(mp.alloc).forEach(function(u){ picked = picked.concat(fill(unitBlocks(u), mp.alloc[u])); });
      label = 'Mixed timed set';
    } else {
      var plan = examPlan();
      Object.keys(plan.alloc).forEach(function(u){ picked = picked.concat(fill(unitBlocks(u), plan.alloc[u])); });
      frqTypes = plan.frqs;
      meta.partial = !plan.full;
      label = plan.full ? 'Practice exam' : 'Shorter practice exam';
    }
    if(!picked.length) return;
    picked = shuffle(picked);
    var stubsList = []; picked.forEach(function(b){ b.items.forEach(function(q){ stubsList.push(q); }); });
    var btn = app.querySelector('.bio-pr-start');
    if(btn){ btn.disabled = true; btn.textContent = 'Loading questions…'; }
    var frqPick = frqTypes.map(function(t){ var list = examPlan().types[t]; return list[Math.floor(Math.random() * list.length)]; });
    Promise.all([Core.loadQuestions(BASE, stubsList), Promise.all(frqPick.map(function(f){ return K.load(BASE, f.id); }))]).then(function(r){
      var full = r[0];
      if(full.length !== stubsList.length) throw new Error('missing questions');
      if(cfg.kind !== 'mixed' && Core.freeExam && !Core.freeExam().use()){ renderSetup(); return; }
      var t = timing();
      startSectionOne(full, r[1], label, meta, t.k);
    }).catch(function(){
      if(btn){ btn.disabled = false; btn.textContent = 'Start'; }
      var msg = app.querySelector('.bio-pr-avail'); if(msg) msg.textContent = 'The exam questions did not load. Check your connection and try again.';
    });
  }

  /* ------------------------------------------------------ Section I */

  function clockHtml(limit, pausable){
    return '<div class="bio-ex-clock"><span class="bio-ex-time" role="timer" aria-label="' + (limit ? 'Time left' : 'Time used') + '">' + (limit ? mmss(limit) : '0:00') + '</span>' +
      (limit ? '' : '<span class="bio-small">Untimed</span>') + (pausable && limit ? '<button type="button" class="btn-outline bio-ex-pause" aria-pressed="false">Pause</button>' : '') + '</div>';
  }
  function startClock(limit, onEnd){
    run.limit = limit; run.left = limit; run.used = 0; run.last = Date.now(); run.paused = false; run.warned = {};
    clearInterval(run.tick);
    run.tick = setInterval(function(){
      if(!run || run.done) return;
      var t = Date.now(), d = t - run.last; run.last = t;
      if(run.paused) return;
      run.used += d;
      var el = app.querySelector('.bio-ex-time');
      if(!run.limit){ if(el) el.textContent = mmss(run.used); return; }
      run.left -= d;
      if(el){ el.textContent = mmss(run.left); el.classList.toggle('is-low', run.left < 60000); }
      [[600000, '10 minutes left.'], [300000, '5 minutes left.'], [60000, '1 minute left.']].forEach(function(w){
        if(run.limit > w[0] * 2 && run.left <= w[0] && !run.warned[w[0]]){ run.warned[w[0]] = 1; var sr = app.querySelector('.bio-ex-sr'); if(sr) sr.textContent = w[1]; }
      });
      if(run.left <= 0){ clearInterval(run.tick); onEnd(true); }
    }, 250);
  }
  function guard(e){ if(run && !run.done){ e.preventDefault(); e.returnValue = ''; } }

  function startSectionOne(qs, frqs, label, meta, k){
    run = { qs: qs, frqs: frqs, label: label, meta: meta, k: k, i: 0, els: {}, res: {}, startedAt: Date.now(), done: false, section: 1 };
    view('run');
    var limit = k ? Math.round(qs.length * MCQ_SEC * k * 1000) : 0;
    app.innerHTML = '<div class="bio-ex-run">' +
      '<div class="bio-ex-top"><div class="bio-ex-title"><span class="bio-pr-label">' + esc(label) + (frqs.length ? ' &middot; Section I' : '') + '</span><span class="bio-small bio-ex-status" aria-live="polite"></span></div>' + clockHtml(limit, true) + '</div>' +
      '<p class="bio-ex-sr" aria-live="assertive"></p>' +
      '<details class="bio-ex-navwrap"' + (window.matchMedia && window.matchMedia('(min-width: 700px)').matches ? ' open' : '') + '><summary>All questions <span class="bio-ex-navcount"></span></summary>' +
      '<nav class="bio-ex-nav" aria-label="Questions">' + qs.map(function(q, i){ return '<button type="button" data-go="' + i + '" aria-label="Question ' + (i + 1) + ', not answered">' + (i + 1) + '</button>'; }).join('') + '</nav></details>' +
      '<div class="bio-ex-paused" hidden><p><b>Paused.</b> The question is hidden while the clock is stopped.</p><button type="button" class="btn-press bio-ex-resume">Resume</button></div>' +
      '<h2 class="sr-only">Section I questions</h2><div class="bio-ex-stage"></div>' +
      '<div class="bio-ex-controls"><button type="button" class="btn-outline bio-ex-prev">Previous</button><button type="button" class="btn-press bio-ex-next">Next</button><button type="button" class="btn-outline bio-ex-finish">' + (frqs.length ? 'End Section I' : 'Finish exam') + '</button></div>' +
      '<div class="bio-ex-confirm" hidden role="alertdialog" aria-labelledby="bio-ex-confirm-t"><p id="bio-ex-confirm-t"></p><button type="button" class="btn-press bio-ex-yes">' + (frqs.length ? 'End Section I' : 'Finish now') + '</button> <button type="button" class="btn-outline bio-ex-no">Keep working</button></div>' +
    '</div>';
    app.querySelector('.bio-ex-nav').addEventListener('click', function(e){ var b = e.target.closest('[data-go]'); if(b) go(+b.getAttribute('data-go')); });
    app.querySelector('.bio-ex-prev').addEventListener('click', function(){ go(run.i - 1); });
    app.querySelector('.bio-ex-next').addEventListener('click', nextUnanswered);
    app.querySelector('.bio-ex-finish').addEventListener('click', askFinish);
    app.querySelector('.bio-ex-yes').addEventListener('click', function(){ endSectionOne(false); });
    app.querySelector('.bio-ex-no').addEventListener('click', function(){ app.querySelector('.bio-ex-confirm').hidden = true; app.querySelector('.bio-ex-finish').focus(); });
    var pb = app.querySelector('.bio-ex-pause');
    if(pb){ pb.addEventListener('click', function(){ pause(!run.paused); }); app.querySelector('.bio-ex-resume').addEventListener('click', function(){ pause(false); }); }
    window.addEventListener('beforeunload', guard);
    startClock(limit, function(){ endSectionOne(true); });
    go(0);
  }
  function pause(on){
    run.paused = on;
    var b = app.querySelector('.bio-ex-pause');
    b.setAttribute('aria-pressed', on ? 'true' : 'false'); b.textContent = on ? 'Resume' : 'Pause';
    ['.bio-ex-stage', '.bio-ex-navwrap', '.bio-ex-controls'].forEach(function(s){ app.querySelector(s).hidden = on; });
    app.querySelector('.bio-ex-paused').hidden = !on;
    (on ? app.querySelector('.bio-ex-resume') : b).focus();
  }
  function answered(){ return Object.keys(run.res).length; }
  function status(){
    app.querySelector('.bio-ex-status').textContent = 'Question ' + (run.i + 1) + ' of ' + run.qs.length + ' · ' + answered() + ' answered';
    app.querySelectorAll('.bio-ex-nav button').forEach(function(b, i){
      var d = !!run.res[run.qs[i].id];
      b.classList.toggle('is-done', d);
      if(i === run.i) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current');
      b.setAttribute('aria-label', 'Question ' + (i + 1) + ', ' + (d ? 'answered' : 'not answered'));
    });
    app.querySelector('.bio-ex-navcount').textContent = '(' + answered() + ' of ' + run.qs.length + ' answered)';
    app.querySelector('.bio-ex-prev').disabled = run.i === 0;
    var left = run.qs.length - answered();
    app.querySelector('.bio-ex-next').textContent = !left ? (run.frqs.length ? 'End Section I' : 'Finish exam') : (run.res[run.qs[run.i].id] ? 'Next' : 'Skip for now');
  }
  function go(i){
    if(i < 0 || i >= run.qs.length) return;
    run.i = i;
    var stage = app.querySelector('.bio-ex-stage');
    Object.keys(run.els).forEach(function(k){ run.els[k].hidden = true; });
    var q = run.qs[i];
    if(!run.els[q.id]){
      var box = document.createElement('div');
      box.className = 'bio-ex-q';
      stage.appendChild(box);
      run.els[q.id] = box;
      // A set's stimulus is shown with each of its questions.
      Q.hydrate(box, [q], { exam: true, record: false, onAnswer: function(res){ lockedIn(q, box, res); } });
      var nEl = box.querySelector('.bio-q-n'); if(nEl) nEl.textContent = (i + 1) + '.';
      var chk = box.querySelector('.bio-check'); if(chk) chk.textContent = 'Lock in answer';
    }
    run.els[q.id].hidden = false;
    status();
    var stem = run.els[q.id].querySelector('.bio-q-stem');
    if(stem){ stem.setAttribute('tabindex', '-1'); try{ stem.focus({ preventScroll: true }); }catch(e){ stem.focus(); } }
    var top = app.querySelector('.bio-ex-run');
    if(top && top.getBoundingClientRect().top < 0) top.scrollIntoView();
  }
  function capture(q, box, res){
    var body = box.querySelector('.bio-q-body');
    if(q.type === 'predict') return q.variables.map(function(v, k){ var b = body.querySelector('tr[data-k="' + k + '"] button[aria-checked="true"]'); return b ? b.getAttribute('data-v') : null; });
    if(q.type === 'order' || q.type === 'numeric') return res.pick;
    var picked = [].map.call(body.querySelectorAll('.bio-opt[aria-checked="true"]'), function(b){ return +b.getAttribute('data-i'); });
    return q.type === 'multi' ? picked : (picked.length ? picked[0] : null);
  }
  function lockedIn(q, box, res){
    run.res[q.id] = { correct: res.correct, score: res.score, pick: capture(q, box, res) };
    box.querySelectorAll('.bio-q-body button').forEach(function(b){ b.disabled = true; });
    var fb = box.querySelector('.bio-q-feedback'); if(fb) fb.innerHTML = '<p class="bio-small">Answer locked in.</p>';
    status();
    var nb = app.querySelector('.bio-ex-next'); try{ nb.focus({ preventScroll: true }); }catch(e){ nb.focus(); }
  }
  function nextUnanswered(){
    var n = run.qs.length;
    if(answered() === n) return askFinish();
    for(var s = 1; s <= n; s++){ var j = (run.i + s) % n; if(!run.res[run.qs[j].id]){ go(j); return; } }
  }
  function askFinish(){
    var left = run.qs.length - answered(), box = app.querySelector('.bio-ex-confirm');
    box.querySelector('p').textContent = (left ? plural(left, 'question') + ' not answered yet. Unanswered questions count as wrong. ' : 'All ' + run.qs.length + ' answered. ') +
      (run.frqs.length ? 'You cannot come back to Section I. End it now?' : 'Finish and see your results?');
    box.hidden = false;
    box.querySelector('.bio-ex-yes').focus();
  }
  function endSectionOne(timeUp){
    if(run.section !== 1) return;
    clearInterval(run.tick);
    run.timeUp1 = timeUp; run.used1 = run.used;
    run.rows = run.qs.map(function(q){ return { q: q, r: run.res[q.id] || { correct: false, score: 0, pick: null, skipped: true } }; });
    if(!run.frqs.length) return finish();
    run.section = 2;
    view('break');
    var sec = frqSec(run.frqs.map(function(f){ return f.type; }));
    app.innerHTML = '<div class="bio-ex-break-card"><h2 tabindex="-1">' + (timeUp ? 'Time is up for Section I.' : 'Section I is done.') + '</h2>' +
      '<p>Section II has ' + plural(run.frqs.length, 'free-response question') + (run.k ? ' and ' + minutes(sec * run.k) + ' on the clock. The clock cannot be paused, as on the real exam' : ', untimed') + '. Answer on screen, or print the answer booklet and write on paper.</p>' +
      '<p class="bio-small">Your Section I answers are saved and scored at the end.</p>' +
      '<div class="bio-pr-actions"><button type="button" class="btn-press" data-act="s2">Start Section II</button><button type="button" class="btn-outline" data-act="booklet">Print the answer booklet</button></div></div>';
    app.querySelector('[data-act="s2"]').addEventListener('click', startSectionTwo);
    app.querySelector('[data-act="booklet"]').addEventListener('click', booklet);
    app.querySelector('h2').focus();
  }

  /* ------------------------------------------------------ Section II */

  function booklet(){ K.printOnly(K.bookletHtml(run.frqs, { title: run.label + ': Section II answer booklet', note: 'Write your answer to each part in the lined space under it.' })); }
  function startSectionTwo(){
    view('run2');
    var limit = run.k ? Math.round(frqSec(run.frqs.map(function(f){ return f.type; })) * run.k * 1000) : 0;
    run.fi = 0;
    app.innerHTML = '<div class="bio-ex-run bio-ex-s2">' +
      '<div class="bio-ex-top"><div class="bio-ex-title"><span class="bio-pr-label">' + esc(run.label) + ' &middot; Section II</span><span class="bio-small bio-ex-status" aria-live="polite"></span></div>' + clockHtml(limit, false) + '</div>' +
      '<p class="bio-ex-sr" aria-live="assertive"></p>' +
      '<nav class="bio-ex-nav" aria-label="Free-response questions">' + run.frqs.map(function(f, i){ return '<button type="button" data-go="' + i + '">' + (i + 1) + '</button>'; }).join('') + '</nav>' +
      '<h2 class="sr-only">Section II questions</h2><div class="bio-ex-stage">' + run.frqs.map(function(f, i){ return '<div class="bio-ex-fq" data-i="' + i + '" hidden>' + K.questionHtml(f, { n: i + 1, write: true, draftKey: '' }) + '</div>'; }).join('') + '</div>' +
      '<div class="bio-ex-controls"><button type="button" class="btn-outline bio-ex-prev">Previous</button><button type="button" class="btn-press bio-ex-next">Next question</button>' +
        '<button type="button" class="btn-outline" data-act="booklet">Print the answer booklet</button><button type="button" class="btn-outline bio-ex-finish">End Section II</button></div>' +
      '<div class="bio-ex-confirm" hidden role="alertdialog" aria-labelledby="bio-ex-confirm2-t"><p id="bio-ex-confirm2-t">End Section II and score your answers with the rubrics?</p><button type="button" class="btn-press bio-ex-yes">End and score</button> <button type="button" class="btn-outline bio-ex-no">Keep working</button></div>' +
    '</div>';
    app.querySelector('.bio-ex-nav').addEventListener('click', function(e){ var b = e.target.closest('[data-go]'); if(b) goF(+b.getAttribute('data-go')); });
    app.querySelector('.bio-ex-prev').addEventListener('click', function(){ goF(run.fi - 1); });
    app.querySelector('.bio-ex-next').addEventListener('click', function(){ goF(run.fi + 1); });
    app.querySelector('[data-act="booklet"]').addEventListener('click', booklet);
    app.querySelector('.bio-ex-finish').addEventListener('click', function(){ var c = app.querySelector('.bio-ex-confirm'); c.hidden = false; c.querySelector('.bio-ex-yes').focus(); });
    app.querySelector('.bio-ex-yes').addEventListener('click', function(){ selfScore(false); });
    app.querySelector('.bio-ex-no').addEventListener('click', function(){ app.querySelector('.bio-ex-confirm').hidden = true; app.querySelector('.bio-ex-finish').focus(); });
    startClock(limit, function(){ selfScore(true); });
    goF(0);
  }
  function goF(i){
    if(i < 0 || i >= run.frqs.length) return;
    run.fi = i;
    app.querySelectorAll('.bio-ex-fq').forEach(function(el){ el.hidden = +el.getAttribute('data-i') !== i; });
    app.querySelectorAll('.bio-ex-nav button').forEach(function(b, k){ if(k === i) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current'); b.setAttribute('aria-label', 'Free-response question ' + (k + 1)); });
    app.querySelector('.bio-ex-status').textContent = 'Question ' + (i + 1) + ' of ' + run.frqs.length;
    app.querySelector('.bio-ex-prev').disabled = i === 0;
    app.querySelector('.bio-ex-next').disabled = i === run.frqs.length - 1;
    var k = app.querySelector('.bio-ex-fq[data-i="' + i + '"] .bio-fq-k');
    if(k){ k.setAttribute('tabindex', '-1'); try{ k.focus({ preventScroll: true }); }catch(e){ k.focus(); } }
  }
  function answersOf(i){
    var out = {};
    app.querySelectorAll('.bio-ex-fq[data-i="' + i + '"] .bio-fq-answer').forEach(function(t){ out[t.getAttribute('data-part')] = t.value; });
    return out;
  }
  function selfScore(timeUp){
    if(run.section !== 2) return;
    clearInterval(run.tick);
    run.section = 3; run.timeUp2 = timeUp;
    run.answers = run.frqs.map(function(f, i){ return answersOf(i); });
    view('score');
    app.innerHTML = '<div class="bio-ex-score"><h2 tabindex="-1">' + (timeUp ? 'Time is up for Section II. ' : '') + 'Score your free responses</h2>' +
      '<p>For each part, read your answer, then check every rubric point it earns. Check a point only if your answer says it, in your own words. If you wrote on paper, score the booklet.</p>' +
      run.frqs.map(function(f, i){
        return '<section class="bio-ex-fscore" aria-labelledby="fs-' + i + '"><h3 id="fs-' + i + '">Question ' + (i + 1) + ': ' + esc(f.title) + ' <span class="bio-small">(' + plural(f.points, 'point') + ')</span></h3>' +
          '<details class="bio-ex-fprompt"><summary>Show the question</summary>' + K.questionHtml(f, {}) + '</details>' +
          '<div class="bio-ex-yours">' + f.parts.map(function(p){ var a = run.answers[i][p.label]; return '<p><b>Your answer to (' + esc(p.label) + '):</b> ' + (a ? esc(a).replace(/\n/g, '<br>') : '<span class="bio-small">nothing typed</span>') + '</p>'; }).join('') + '</div>' +
          K.rubricHtml(f) + '<p class="bio-fq-total" aria-live="polite"></p></section>';
      }).join('') +
      '<div class="bio-pr-actions"><button type="button" class="btn-press" data-act="results">See my results</button></div></div>';
    function totals(){ app.querySelectorAll('.bio-ex-fscore').forEach(function(sec){ var s = K.score(sec); sec.querySelector('.bio-fq-total').textContent = s.got + ' of ' + s.of + ' points checked.'; }); }
    app.addEventListener('change', totals); totals();
    app.querySelector('[data-act="results"]').addEventListener('click', function(){
      app.removeEventListener('change', totals);
      run.frqScores = [].map.call(app.querySelectorAll('.bio-ex-fscore'), function(sec){ return K.score(sec); });
      finish();
    });
    app.querySelector('h2').focus();
  }

  /* ------------------------------------------------------ results */

  function band(p){ return p >= 75 ? 5 : p >= 60 ? 4 : p >= 45 ? 3 : p >= 30 ? 2 : 1; }
  function finish(){
    if(!run || run.done) return;
    run.done = true;
    clearInterval(run.tick);
    window.removeEventListener('beforeunload', guard);
    var rows = run.rows || run.qs.map(function(q){ return { q: q, r: run.res[q.id] || { correct: false, score: 0, pick: null, skipped: true } }; });
    // Recorded now, at the end (A&P decision 42); unanswered counts as a miss.
    rows.forEach(function(x){ Core.record(x.q.id, !!x.r.correct, { topic: x.q.topic, unit: x.q.unit, practice: x.q.practice, level: x.q.level, diff: x.q.diff, src: 'q' }); });
    var right = rows.filter(function(x){ return x.r.correct; }).length, total = rows.length;
    var fg = 0, fo = 0; (run.frqScores || []).forEach(function(s){ fg += s.got; fo += s.of; });
    var mcqP = pctOf(right, total), composite = fo ? Math.round(0.6 * mcqP + 0.4 * (fg / fo * 100)) : mcqP;
    var isExam = run.meta.kind === 'full';
    var b = isExam ? band(composite) : 0;
    var hist = prefs().examHistory || [];
    hist.push({ ts: Date.now(), kind: run.meta.kind, label: run.label, unit: run.meta.unit || null, mcq: { c: right, n: total }, frq: fo ? { got: fg, of: fo } : null, band: b || null, partial: !!run.meta.partial });
    setPref('examHistory', hist.slice(-30));
    // Each FRQ's self-score also counts as an attempt on the FRQ page.
    (run.frqScores || []).forEach(function(s, i){ var f = run.frqs[i]; K.saveScore(f.id, { got: s.got, of: s.of, parts: s.parts, title: f.title, type: f.type, units: f.units, exam: true }); });
    Core.event('apbio-exam-finish', { kind: run.meta.kind, correct: right, total: total, frq: fg, frqOf: fo, partial: !!run.meta.partial });
    var stage = app.querySelector('.bio-ex-stage') || app;
    stage.insertAdjacentHTML('afterbegin', '<p class="bio-small">Marking your exam and loading the explanations…</p>');
    Promise.all(rows.map(function(x){ return Core.loadWhy(BASE, x.q); })).then(function(){ results(rows, right, fg, fo, composite, b); }, function(){ results(rows, right, fg, fo, composite, b); });
  }
  function tally(rows, keyFn){
    var out = {}, order = [];
    rows.forEach(function(x){ var k = keyFn(x.q); if(!k) return; if(!out[k]){ out[k] = { n: 0, c: 0 }; order.push(k); } out[k].n++; if(x.r.correct) out[k].c++; });
    return order.map(function(k){ return { key: k, n: out[k].n, c: out[k].c }; });
  }
  function barTable(title, list, name, link, unitWord){
    if(!list.length) return '';
    return '<section class="bio-ex-break"><h3>' + title + '</h3><ul class="bio-ex-bars">' + list.map(function(x){
      var p = pctOf(x.c, x.n), nm = esc(name(x.key)), href = link && link(x.key);
      return '<li><span class="bio-ex-bar-name">' + (href ? '<a href="' + href + '">' + nm + '</a>' : nm) + '</span><span class="track thin" aria-hidden="true"><i class="' + (p >= 80 ? 'is-hi' : p >= 60 ? 'is-mid' : 'is-lo') + '" style="width:' + p + '%"></i></span><span class="bio-ex-bar-v">' + x.c + '/' + x.n + (unitWord ? ' ' + unitWord : '') + '</span></li>';
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
    app.innerHTML = '<div class="bio-ex-results">' +
      '<div class="bio-pr-score"><span class="bio-pr-score-big">' + right + '<small>/' + total + '</small></span><span><b>Multiple choice: ' + pctOf(right, total) + '%</b><span class="bio-small">' + esc(run.label) +
        (run.timeUp1 ? ' · time ran out in Section I' : '') + '</span></span></div>' +
      (fo ? '<div class="bio-pr-score bio-ex-fsum"><span class="bio-pr-score-big">' + fg + '<small>/' + fo + '</small></span><span><b>Free response (your self-score): ' + pctOf(fg, fo) + '%</b><span class="bio-small">' + plural(run.frqs.length, 'question') + ' scored with the rubrics' + (run.timeUp2 ? ' · time ran out in Section II' : '') + '</span></span></div>' : '') +
      (k === 'full' ? '<section class="bio-ex-band" aria-labelledby="bio-ex-band-h"><h2 id="bio-ex-band-h">Readiness estimate: band ' + b + ' of 5</h2>' +
        '<p class="bio-ex-band-warn"><b>' + NOT_CALIBRATED + '</b></p>' +
        '<p class="bio-small">How it is worked out: multiple choice counts 60% and free response 40%, as the two sections do on the exam, giving ' + composite + '%; then 75% and up is band 5, 60% band 4, 45% band 3, 30% band 2, below that band 1. These cut-offs are our guess, not the College Board\'s scale' +
        (run.meta.partial ? ', and this was a shorter exam that leaves out units with no questions yet' : '') + '.</p></section>' : '') +
      (missedN ? '<p>' + plural(missedN, 'missed question') + ' went to your <a href="' + BASE + 'review.html">review queue</a>.</p>' : '<p>Every multiple-choice question right.</p>') +
      (weak.length ? '<h2>Study next</h2><ul class="bio-pr-next-list">' + weak.map(function(x){
        return '<li><div><b>' + esc(TOPIC[x.key] ? TOPIC[x.key].title : x.key) + '</b><span class="bio-small">' + x.c + ' of ' + x.n + ' right</span></div><a class="btn-outline" href="' + BASE + 'lessons/' + x.key + '.html">Lesson</a><a class="btn-outline" href="' + BASE + 'notes/' + x.key + '.html">Notes</a></li>';
      }).join('') + '</ul>' : '') +
      '<h2>Your score, broken down</h2><div class="bio-ex-breaks">' +
        barTable('Multiple choice by unit', byUnit, unitName, function(key){ return BASE + 'units/' + key + '.html'; }) +
        (fo ? barTable('Free response by unit (points)', Object.keys(frqByUnit).map(function(u){ return frqByUnit[u]; }), unitName, null, 'pts') : '') +
        barTable('Multiple choice by science practice', byPractice, function(key){ return key + (PRACTICE[key] ? '. ' + PRACTICE[key].name : ''); }) +
        barTable('By topic', byTopic, function(key){ return TOPIC[key] ? TOPIC[key].title : key; }, function(key){ return BASE + 'lessons/' + key + '.html'; }) +
        barTable('By level', byLevel, function(key){ return LEVEL_NAME[key] || key; }) +
      '</div>' +
      '<div class="bio-pr-actions">' + (missedN ? '<a class="btn-press" href="' + BASE + 'practice.html?mode=missed">Practice your misses</a>' : '') + '<button type="button" class="btn-outline" data-act="again">Another exam</button></div>' +
      '<h2>Review every question</h2>' +
      '<div class="bio-ex-filter" role="group" aria-label="Show"><button type="button" class="bio-pr-chip-b" aria-pressed="true" data-f="all">All ' + total + '</button><button type="button" class="bio-pr-chip-b" aria-pressed="false" data-f="miss"' + (missedN ? '' : ' disabled') + '>Missed ' + missedN + '</button></div>' +
      '<ol class="bio-ex-review">' + rows.map(function(x, i){ return reviewItem(x.q, x.r, i + 1); }).join('') + '</ol>' +
      (window.LevlPremium && window.LevlPremium.card ? window.LevlPremium.card('apbio', 'summary') : '') +
      '<div class="bio-pr-actions"><button type="button" class="btn-outline" data-act="again">Another exam</button></div></div>';
    app.querySelectorAll('[data-act="again"]').forEach(function(x){ x.addEventListener('click', renderSetup); });
    app.querySelectorAll('[data-f]').forEach(function(x){
      x.addEventListener('click', function(){
        var miss = x.getAttribute('data-f') === 'miss';
        app.querySelectorAll('[data-f]').forEach(function(y){ y.setAttribute('aria-pressed', y === x ? 'true' : 'false'); });
        app.querySelectorAll('.bio-ex-ritem').forEach(function(li){ li.hidden = miss && li.classList.contains('is-ok'); });
      });
    });
    var h = app.querySelector('.bio-pr-score'); h.setAttribute('tabindex', '-1'); h.focus();
  }

  /* One question in the review, options in authored order, each with its
     own explanation; explanations never name a position. */
  function reviewItem(q, r, n){
    var cls = r.correct ? 'is-ok' : (r.score > 0 ? 'is-part' : 'is-no');
    var verdict = r.skipped ? 'Not answered' : r.correct ? 'Correct' : r.score > 0 ? 'Partly right' : 'Missed';
    var why = q.why || {}, opts = why.options || [], body = '';
    function tag(t, c){ return '<span class="bio-ex-tag ' + c + '">' + t + '</span>'; }
    if(q.type === 'predict'){
      body = '<ul class="bio-ex-vars">' + q.variables.map(function(v, k){
        var mine = r.pick && r.pick[k], ok = mine === v.answer;
        function dir(d){ return d === 'up' ? 'Increases' : d === 'down' ? 'Decreases' : d === 'none' ? 'No change' : 'No answer'; }
        return '<li class="' + (ok ? 'is-ok' : 'is-no') + '"><span class="bio-ex-vname"><span class="bio-ex-mark" aria-hidden="true">' + (ok ? '✓' : '✗') + '</span>' + html(v.name) + '</span><span class="bio-ex-vpick">You: ' + dir(mine) + (ok ? '' : ' · Answer: <b>' + dir(v.answer) + '</b>') + '<span class="bio-ex-sr"> (' + (ok ? 'right' : 'wrong') + ')</span></span>' + (v.why ? '<span class="bio-ex-vwhy">' + html(v.why) + '</span>' : '') + '</li>';
      }).join('') + '</ul>';
    } else if(q.type === 'order'){
      var mine = r.pick || [];
      body = '<div class="bio-ex-orders">' + (mine.length ? '<div><p class="bio-small">Your order</p><ol class="bio-order">' + mine.map(function(i, k){ return '<li class="' + (i === k ? 'pos-ok' : 'pos-no') + '"><span class="bio-ex-mark" aria-hidden="true">' + (i === k ? '✓' : '✗') + '</span><span class="bio-order-text">' + html(q.options[i]) + '</span><span class="bio-ex-sr">' + (i === k ? ' (right place)' : ' (wrong place)') + '</span></li>'; }).join('') + '</ol></div>' : '') +
        '<div><p class="bio-small">Correct order</p><ol class="bio-order">' + q.options.map(function(o){ return '<li><span class="bio-order-text">' + html(o) + '</span></li>'; }).join('') + '</ol></div></div>';
    } else if(q.type === 'numeric'){
      var N = q.numeric || {}, keyTxt = Number(N.answer).toFixed(N.decimals != null ? N.decimals : 2) + (N.unit ? ' ' + N.unit : '');
      body = '<p>You: <b>' + (r.pick ? esc(r.pick) : 'no answer') + '</b> · Answer: <b>' + esc(keyTxt) + '</b></p>';
    } else {
      var key = [].concat(q.correct), picks = r.pick == null ? [] : [].concat(r.pick);
      body = '<ul class="bio-ex-opts">' + (q.options || []).map(function(o, i){
        var isKey = key.indexOf(i) > -1, isPick = picks.indexOf(i) > -1;
        return '<li class="' + (isKey ? 'is-right' : isPick ? 'is-wrong' : '') + '"><span class="bio-ex-otext">' + html(o) + '</span>' + (isPick ? tag('Your answer', isKey ? 'ok' : 'no') : '') + (isKey ? tag(q.type === 'multi' ? 'Correct' : 'Correct answer', 'key') : '') + (opts[i] ? '<span class="bio-opt-why">' + html(opts[i]) + '</span>' : '') + '</li>';
      }).join('') + '</ul>';
    }
    var t = TOPIC[q.topic];
    return '<li class="bio-q bio-ex-ritem ' + cls + '"><p class="bio-ex-verdict"><span class="bio-ex-vtag">' + verdict + (r.score > 0 && !r.correct ? ' (' + Math.round(r.score * 100) + '%)' : '') + '</span><span class="bio-small">' + esc(t ? t.title : '') + ' · Practice ' + esc(q.practice || '') + '</span></p>' +
      (q.stim ? '<details class="bio-ex-stimd"><summary>Show the ' + esc((q.stim.kind === 'table' ? 'data table' : q.stim.kind === 'graph' ? 'graph' : q.stim.kind === 'model' ? 'model' : 'setup')) + ': ' + esc(q.stim.title) + '</summary>' + Q.stimulusPanel(q.stimulus, q.stim) + '</details>' : '') +
      '<p class="bio-q-stem"><span class="bio-q-n">' + n + '.</span> ' + html(q.q) + '</p>' + body + (why.correct ? '<p class="bio-ex-why"><b>Why:</b> ' + html(why.correct) + '</p>' : '') +
      '<p class="bio-ex-links"><a href="' + BASE + 'lessons/' + q.topic + '.html">Lesson</a> <span aria-hidden="true">&middot;</span> <a href="' + BASE + 'notes/' + q.topic + '.html">Notes</a>' + (window.LevlReport ? ' ' + window.LevlReport.button('apbio', q.id) : '') + '</p></li>';
  }

  /* ------------------------------------------------------ boot */

  function boot(){
    if(!Q || !Core){ app.innerHTML = '<p>Exams could not start. Reload the page to try again.</p>'; return; }
    app.innerHTML = '<p class="bio-small">Loading the question bank…</p>';
    Promise.all([Core.loadIndex(BASE), kit()]).then(function(r){
      K = r[1];
      bank = r[0].filter(function(q){ return TOPIC[q.topic] && TOPIC[q.topic].built; });
      blocks = makeBlocks(bank);
      return K ? K.index(BASE).then(function(l){ frqList = l || []; }, function(){ frqList = []; }) : null;
    }).then(function(){
      if(!bank.length){ app.innerHTML = '<p>No exam questions are published yet. Meanwhile, read the <a href="' + BASE + 'learn.html">free notes</a>.</p>'; return; }
      var p = new URLSearchParams(location.search), saved = prefs().examTiming;
      if(TIMINGS.some(function(t){ return t.id === saved; })) cfg.timing = saved;
      if(builtUnits().some(function(u){ return u.id === p.get('unit'); })){ cfg.unit = p.get('unit'); cfg.kind = 'unit'; }
      if(p.get('mode') === 'unit' || p.get('mode') === 'full' || p.get('mode') === 'mixed') cfg.kind = p.get('mode');
      if(MIXED.indexOf(+p.get('n')) > -1) cfg.n = +p.get('n');
      renderSetup();
      if(p.toString()){ var s = app.querySelector('.bio-pr-start'); if(s && !s.disabled) s.focus(); }
    }).catch(function(){ app.innerHTML = '<p>The question bank did not load. Check your connection and reload.</p>'; });
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
