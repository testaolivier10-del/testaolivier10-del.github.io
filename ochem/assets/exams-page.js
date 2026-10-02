/* Drives ochem/exams.html: chapter tests, midterms over a range of chapters,
   and the cumulative final.

     Chapter test   one chapter, 20 or 25 questions over all its topics
     Midterm        chapters X to Y, 30 or 40 questions, weighted by topics
     Final          the whole course, 50 questions in 90 minutes

   Every exam is timed at 1.8 minutes a question (the final's 50 in 90), with
   1.5x, 2x and untimed settings for accommodations. There is no pause: the
   deadline is fixed at the start and the clock runs on wall time, so a reload
   or a closed tab does not stop it. Questions come from the practice bank
   (bank-loader.js, read at runtime) and are picked by exam-core.js.

   Exam mode grades silently. Answers can be changed until the exam is
   submitted; nothing is recorded before that. On submit every ANSWERED
   question goes through OchemDiagnostics.applyResult, exactly as a practice
   answer does, so it moves concept mastery, the topic tally, the mistake list
   (which feeds Review) and XP, and the exam is logged as a session. A
   question left blank records nothing: a blank says nothing about which
   concept was missing, and the mastery engine weights evidence by concept.

   The attempt in progress is saved to localStorage after every change and
   offered for resume on the next visit; exam-core.js checks it still matches
   the bank first, since question ids are positions in a bank that is edited.
   Finished attempts are kept in ochem_exam_history_v1, synced with the rest
   of the course (ochem-xp.js registers it). */
(function(){
  var X  = window.OchemExamCore;
  var C  = window.OchemCurriculum;
  var M  = window.OchemMastery;
  var D  = window.OchemDiagnostics;
  var E  = window.OchemQuestionEngine;
  var Mo = window.OchemMolecules;

  var app  = document.getElementById('examApp');
  var hero = document.getElementById('examHero');
  if(!app) return;

  var RUN_KEY = 'ochem_exam_run_v1';
  var HIST_KEY = 'ochem_exam_history_v1';
  var PREF_KEY = 'ochem_exam_prefs_v1';
  var PER_Q_MS = 108000;            // 1.8 minutes a question
  var LETTERS = 'ABCDEFGH';

  var KINDS = [
    { id: 'chapter', title: 'Chapter test', desc: '20 or 25 questions over every topic in one chapter.' },
    { id: 'midterm', title: 'Midterm', desc: 'A range of chapters, weighted by how many topics each has.' },
    { id: 'final', title: 'Cumulative final', desc: '50 questions from all chapters, 90 minutes.' }
  ];
  var KIND_NAME = { chapter: 'Chapter test', midterm: 'Midterm', final: 'Cumulative final' };
  var TIMINGS = [
    { id: 'std', name: 'Standard time', k: 1 },
    { id: 'x15', name: 'Extra time (1.5×)', k: 1.5 },
    { id: 'x2', name: 'Double time', k: 2 },
    { id: 'off', name: 'No timer', k: 0 }
  ];
  var DIFF_NAME = { easy: 'Easier', medium: 'Medium', hard: 'Harder' };
  var TIER_DIFF = { 1: 'easy', 2: 'medium', 3: 'hard', 4: 'hard' };

  function esc(s){
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function plural(n, w){ return n + ' ' + w + (n === 1 ? '' : 's'); }
  function pctOf(c, n){ return n ? Math.round(c / n * 100) : 0; }
  function clock(ms){
    var s = Math.max(0, Math.ceil(ms / 1000)), h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60);
    s = s % 60;
    return (h ? h + ':' + (m < 10 ? '0' : '') : '') + m + ':' + (s < 10 ? '0' : '') + s;
  }
  function minutes(ms){ return Math.round(ms / 60000) + ' min'; }
  function read(key, dflt){ try{ var v = JSON.parse(localStorage.getItem(key)); return v == null ? dflt : v; }catch(e){ return dflt; } }
  function write(key, v){ try{ localStorage.setItem(key, JSON.stringify(v)); }catch(e){} }
  function drop(key){ try{ localStorage.removeItem(key); }catch(e){} }
  function focusEl(el){ if(!el) return; try{ el.focus({ preventScroll: true }); }catch(e){ el.focus(); } }

  /* ---- the course ----------------------------------------------------- */

  var CHAPTERS = C.MODULES.map(function(m, i){ return { id: m.id, n: i + 1, title: m.title, topics: m.topics }; });
  var CHAPTER = {}, TOPIC = {};
  CHAPTERS.forEach(function(ch){
    CHAPTER[ch.id] = ch;
    ch.topics.forEach(function(t){ TOPIC[t.id] = { id: t.id, title: t.title, href: t.href, chapter: ch.id, lesson: C.hasLesson(t) }; });
  });
  function chLabel(ch){ return ch.n + '. ' + ch.title; }

  var POOL = [], BYID = {}, DIFF = {};   // exam-core's view of the bank, and the full questions
  function loadPool(){
    POOL = []; BYID = {}; DIFF = {};
    E.all().forEach(function(q){
      if(q.source !== 'legacy' || !TOPIC[q.topic] || !q.options || q.options.length < 2) return;
      BYID[q.id] = q;
      DIFF[q.id] = TIER_DIFF[q.tier] || 'medium';
      POOL.push({ id: q.id, topic: q.topic, chapter: TOPIC[q.topic].chapter, diff: DIFF[q.id] });
    });
  }
  function poolFor(chapterIds){
    var on = {};
    chapterIds.forEach(function(id){ on[id] = 1; });
    return POOL.filter(function(q){ return on[q.chapter]; });
  }

  /* ---- setup ----------------------------------------------------------- */

  var prefs = read(PREF_KEY, {}) || {};
  var cfg = {
    kind: prefs.kind || 'chapter',
    chapter: prefs.chapter || CHAPTERS[0].id,
    chLen: prefs.chLen === 25 ? 25 : 20,
    // Chapters 1 to 9 (through alkenes and alkynes) is where a first-semester
    // course usually takes its midterm or ends; remembered once changed.
    from: prefs.from || 1,
    to: prefs.to || 9,
    midLen: prefs.midLen === 30 ? 30 : 40,
    timing: prefs.timing || 'std'
  };
  if(!CHAPTER[cfg.chapter]) cfg.chapter = CHAPTERS[0].id;
  if(!TIMINGS.some(function(t){ return t.id === cfg.timing; })) cfg.timing = 'std';
  function savePrefs(){ write(PREF_KEY, cfg); }

  function planFor(){
    var k = cfg.kind;
    if(k === 'chapter'){
      var ch = CHAPTER[cfg.chapter];
      return { kind: k, chapters: [ch.id], n: cfg.chLen, cumulative: false, label: 'Chapter test: ' + chLabel(ch) };
    }
    if(k === 'midterm'){
      var lo = Math.min(cfg.from, cfg.to), hi = Math.max(cfg.from, cfg.to);
      var ids = CHAPTERS.filter(function(c){ return c.n >= lo && c.n <= hi; }).map(function(c){ return c.id; });
      return { kind: k, chapters: ids, n: cfg.midLen, cumulative: true,
               label: 'Midterm: chapters ' + lo + (hi > lo ? '–' + hi : '') };
    }
    return { kind: 'final', chapters: CHAPTERS.map(function(c){ return c.id; }), n: 50, cumulative: true, label: 'Cumulative final' };
  }
  function timingK(){ return TIMINGS.filter(function(t){ return t.id === cfg.timing; })[0].k; }

  function view(name){
    if(hero) hero.hidden = name !== 'setup';
    app.setAttribute('data-view', name);
    window.scrollTo(0, 0);
  }

  function chapterSelect(name, value, label, useN){
    return '<label class="ex-field"><span>' + label + '</span><select name="' + name + '">' + CHAPTERS.map(function(c){
      var v = useN ? c.n : c.id;
      return '<option value="' + v + '"' + (String(v) === String(value) ? ' selected' : '') + '>' + esc(chLabel(c)) + '</option>';
    }).join('') + '</select></label>';
  }
  function chips(name, values, current, fmt){
    return values.map(function(v){
      return '<label class="ex-chip"><input type="radio" name="' + name + '" value="' + v + '"' + (v === current ? ' checked' : '') + '><span>' + fmt(v) + '</span></label>';
    }).join('');
  }

  function panelHtml(){
    var k = cfg.kind, html = '';
    if(k === 'chapter'){
      html = chapterSelect('chapter', cfg.chapter, 'Chapter') +
        '<fieldset class="ex-group"><legend>Length</legend>' + chips('chLen', [20, 25], cfg.chLen, function(v){ return v + ' questions'; }) + '</fieldset>';
    } else if(k === 'midterm'){
      html = '<div class="ex-row">' + chapterSelect('from', cfg.from, 'From chapter', true) + chapterSelect('to', cfg.to, 'To chapter', true) + '</div>' +
        '<fieldset class="ex-group"><legend>Length</legend>' + chips('midLen', [30, 40], cfg.midLen, function(v){ return v + ' questions'; }) + '</fieldset>';
    } else {
      html = '<p class="ex-note">Every chapter is on it, each in proportion to how many topics it has, and every chapter gets at least one question.</p>';
    }
    return html + '<label class="ex-field"><span>Timing</span><select name="timing">' + TIMINGS.map(function(t){
      return '<option value="' + t.id + '"' + (t.id === cfg.timing ? ' selected' : '') + '>' + t.name + '</option>';
    }).join('') + '</select></label>';
  }

  function summary(){
    var p = planFor(), avail = poolFor(p.chapters).length, n = Math.min(p.n, avail), k = timingK();
    if(!n) return { ok: false, text: 'No questions are available for that yet.' };
    var text = plural(n, 'question') + ', ' + (k ? minutes(n * PER_Q_MS * k) + (k > 1 ? ' with extra time' : '') : 'no timer');
    if(p.kind === 'midterm') text += ', from ' + plural(p.chapters.length, 'chapter');
    return { ok: true, text: text + '.' };
  }

  function savedRun(){
    var r = read(RUN_KEY, null);
    if(!r) return null;
    if(!X.validRun(r, function(id){ return BYID[id]; })){ drop(RUN_KEY); return null; }
    return r;
  }

  function historyHtml(){
    var h = read(HIST_KEY, []);
    if(!Array.isArray(h) || !h.length) return '';
    return '<section class="ex-history" aria-labelledby="exHistH"><h2 id="exHistH" class="section-head">Your recent exams</h2><ul>' +
      h.slice(-8).reverse().map(function(e){
        var d = new Date(e.ts);
        return '<li><span class="ex-h-label">' + esc(e.label) + '<span class="ex-small">' + esc(d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })) +
          (e.timeUp ? ' &middot; time ran out' : '') + '</span></span><b class="ex-h-score">' + pctOf(e.right, e.total) + '%</b><span class="ex-small">' + e.right + '/' + e.total + '</span></li>';
      }).join('') + '</ul></section>';
  }

  /* Without Premium: one full exam, any chapters (LevlPremium.freeExam). It
     is used when it starts; an attempt in progress can always be finished. */
  function examAccess(){
    var G = window.OchemPremium;
    return G ? G.freeExam() : { unlimited: true, available: true, use: function(){ return true; } };
  }

  function renderSetup(notice){
    view('setup');
    var r = savedRun();
    var ex = examAccess();
    var spent = !r && !ex.available;
    var startHtml = spent
      ? window.LevlPremium.gate('ochem', 'exam', 'exams') +
        '<p class="ex-small">Practice and Review stay open: the first four chapters without limit, and 15 questions a day from the rest.</p>'
      : '<button type="submit" class="btn-press ex-start"' + (r ? ' disabled' : '') + '>Start exam</button>' +
        (!r && !ex.unlimited ? '<p class="ex-small">This is your free full exam: any chapters, any length. Unlimited exams are part of Premium.</p>' : '');
    var resume = '';
    if(r){
      var answered = r.choices.filter(function(c){ return c !== null; }).length;
      var left = X.timeLeft(r, Date.now());
      resume = '<div class="ex-resume" role="region" aria-label="Exam in progress"><div><b>' + esc(r.label) + '</b> is still open.' +
        '<span class="ex-small">' + answered + ' of ' + r.ids.length + ' answered' +
        (r.deadline ? ' &middot; ' + clock(left) + ' left. The clock kept running while you were away.' : ' &middot; untimed.') + '</span></div>' +
        '<div class="ex-resume-actions"><button type="button" class="btn-press sm" data-act="resume">Resume exam</button>' +
        '<button type="button" class="btn-outline" data-act="discard">Discard</button></div></div>';
    }
    app.innerHTML = (notice ? '<p class="ex-notice" role="status">' + esc(notice) + '</p>' : '') + resume +
      '<form class="ex-setup" novalidate>' +
        '<fieldset class="ex-kinds"><legend class="section-head">Choose an exam</legend>' + KINDS.map(function(k){
          return '<label class="ex-kind"><input type="radio" name="kind" value="' + k.id + '"' + (k.id === cfg.kind ? ' checked' : '') + '>' +
            '<span class="ex-kind-t">' + esc(k.title) + '</span><span class="ex-kind-d">' + esc(k.desc) + '</span></label>';
        }).join('') + '</fieldset>' +
        '<div class="ex-panel">' + panelHtml() + '</div>' +
        '<p class="ex-avail" aria-live="polite"></p>' +
        '<p class="ex-small ex-how">Exam mode shows no feedback until you submit, and the clock does not pause. You can change an answer, flag a question to come back to, and jump around with the question map. Your answers count toward your mastery and XP when you submit; anything you miss goes to your review queue.</p>' +
        startHtml +
        (r ? '<p class="ex-small">Finish or discard the exam in progress to start another.</p>' : '') +
      '</form>' + historyHtml();

    var form = app.querySelector('form');
    function refresh(){
      var s = summary();
      app.querySelector('.ex-avail').textContent = s.text;
      var btn = app.querySelector('.ex-start');
      if(!r && btn) btn.disabled = !s.ok;
    }
    form.addEventListener('change', function(e){
      var n = e.target.name, v = e.target.value;
      if(n === 'kind'){ cfg.kind = v; app.querySelector('.ex-panel').innerHTML = panelHtml(); }
      if(n === 'chapter') cfg.chapter = v;
      if(n === 'chLen') cfg.chLen = +v;
      if(n === 'midLen') cfg.midLen = +v;
      if(n === 'from'){ cfg.from = +v; if(cfg.to < cfg.from){ cfg.to = cfg.from; form.querySelector('[name="to"]').value = String(cfg.to); } }
      if(n === 'to'){ cfg.to = +v; if(cfg.from > cfg.to){ cfg.from = cfg.to; form.querySelector('[name="from"]').value = String(cfg.from); } }
      if(n === 'timing') cfg.timing = v;
      savePrefs();
      refresh();
    });
    form.addEventListener('submit', function(e){ e.preventDefault(); if(!r && !spent) begin(); });
    app.querySelectorAll('[data-act="resume"]').forEach(function(b){ b.addEventListener('click', function(){ resumeRun(r); }); });
    app.querySelectorAll('[data-act="discard"]').forEach(function(b){
      b.addEventListener('click', function(){
        if(!window.confirm('Discard this exam? Nothing from it will be recorded.')) return;
        drop(RUN_KEY); renderSetup('Exam discarded.');
      });
    });
    refresh();
    if(r) focusEl(app.querySelector('[data-act="resume"]'));
  }

  /* ---- running --------------------------------------------------------- */

  var run = null, tickTimer = null, warned = {};

  function begin(){
    var p = planFor();
    var ids = X.pick(poolFor(p.chapters), p.n, { cumulative: p.cumulative });
    if(!ids.length) return;
    // Taken only now that an exam really starts; refused if already spent.
    if(!examAccess().use()){ renderSetup(); return; }
    var k = timingK(), now = Date.now();
    var limit = k ? Math.round(ids.length * PER_Q_MS * k) : 0;
    var r = {
      v: 1, kind: p.kind, label: p.label, chapters: p.chapters,
      ids: ids,
      hashes: ids.map(function(id){ return X.hash(BYID[id].prompt); }),
      // The option order is dealt once and saved with the attempt, so a
      // resumed exam shows every question exactly as it was first shown.
      orders: ids.map(function(id){
        var opts = BYID[id].options;
        return window.OchemShuffle ? window.OchemShuffle.apply(opts, id + ':' + now).toOriginal : opts.map(function(_, i){ return i; });
      }),
      choices: ids.map(function(){ return null; }),
      flags: ids.map(function(){ return false; }),
      cur: 0, startedAt: now, limit: limit, deadline: limit ? now + limit : 0
    };
    if(window.LevlAnalytics){
      window.LevlAnalytics.event('ochem-session-start', { mode: 'exam-' + p.kind });
      window.LevlAnalytics.once('first-questions', { secs: window.LevlAnalytics.secondsIn(), mode: 'exam-' + p.kind });
    }
    startRun(r);
  }

  function resumeRun(r){
    if(r.deadline && X.timeLeft(r, Date.now()) <= 0){ run = r; finish(true, true); return; }
    startRun(r);
  }

  function save(){ if(run) write(RUN_KEY, run); }

  function startRun(r){
    run = r; warned = {};
    save();
    view('run');
    var wide = window.matchMedia && window.matchMedia('(min-width: 900px)').matches;
    app.innerHTML = '<h1 class="sr-only">Organic chemistry exam</h1><div class="ex-run">' +
      '<div class="ex-bar">' +
        '<div class="ex-bar-t"><span class="ex-label">' + esc(r.label) + '</span><span class="ex-status"></span></div>' +
        (r.deadline ? '<div class="ex-clock"><span class="ex-small">Time left</span><span class="ex-time" role="timer" aria-label="Time left">' + clock(X.timeLeft(r, Date.now())) + '</span></div>'
                    : '<div class="ex-clock"><span class="ex-small">Untimed</span></div>') +
      '</div>' +
      '<p class="sr-only" aria-live="assertive" id="exAlert"></p>' +
      '<div class="ex-layout">' +
        '<div class="ex-main">' +
          '<div class="lesson-card ex-card" id="exCard"></div>' +
          '<div class="ex-controls">' +
            '<button type="button" class="btn-outline" data-act="prev">Previous</button>' +
            '<button type="button" class="btn-outline ex-flag" data-act="flag" aria-pressed="false">Flag for review</button>' +
            '<button type="button" class="btn-press sm" data-act="next">Next</button>' +
          '</div>' +
        '</div>' +
        '<aside class="ex-side" aria-label="Exam navigation">' +
          '<details class="ex-navwrap"' + (wide ? ' open' : '') + '><summary>Question map <span class="ex-navcount"></span></summary>' +
            '<nav aria-label="Questions"><div class="ex-nav">' + r.ids.map(function(_, i){
              return '<button type="button" data-go="' + i + '">' + (i + 1) + '</button>';
            }).join('') + '</div></nav>' +
            '<p class="ex-small ex-key"><span class="ex-key-a" aria-hidden="true"></span> answered <span class="ex-key-f" aria-hidden="true"></span> flagged</p>' +
          '</details>' +
          '<button type="button" class="btn-press alt wide" data-act="submit">Submit exam</button>' +
        '</aside>' +
      '</div>' +
      '<dialog class="ex-dialog" aria-labelledby="exConfirmT"><p id="exConfirmT"></p><div class="ex-dialog-actions">' +
        '<button type="button" class="btn-press sm" data-act="confirm">Submit now</button>' +
        '<button type="button" class="btn-outline" data-act="cancel">Keep working</button></div></dialog>' +
    '</div>';

    app.querySelector('.ex-nav').addEventListener('click', function(e){
      var b = e.target.closest('[data-go]');
      if(b) go(+b.getAttribute('data-go'));
    });
    app.querySelector('[data-act="prev"]').addEventListener('click', function(){ go(run.cur - 1); });
    app.querySelector('[data-act="next"]').addEventListener('click', function(){
      if(run.cur < run.ids.length - 1) go(run.cur + 1); else askSubmit();
    });
    app.querySelector('[data-act="flag"]').addEventListener('click', function(){
      run.flags[run.cur] = !run.flags[run.cur]; save(); status();
    });
    app.querySelector('[data-act="submit"]').addEventListener('click', askSubmit);
    var dlg = app.querySelector('.ex-dialog');
    app.querySelector('[data-act="confirm"]').addEventListener('click', function(){ closeDialog(dlg); finish(false); });
    app.querySelector('[data-act="cancel"]').addEventListener('click', function(){ closeDialog(dlg); focusEl(app.querySelector('[data-act="submit"]')); });

    clearInterval(tickTimer);
    if(r.deadline){ tickTimer = setInterval(tick, 1000); tick(); }
    go(r.cur || 0, true);
  }

  function closeDialog(dlg){ if(dlg.open){ if(dlg.close) dlg.close(); else dlg.removeAttribute('open'); } }

  function tick(){
    if(!run) return;
    var left = X.timeLeft(run, Date.now());
    var el = app.querySelector('.ex-time');
    if(el){ el.textContent = clock(left); el.classList.toggle('is-low', left < 300000); }
    [[600000, '10 minutes left.'], [300000, '5 minutes left.'], [60000, '1 minute left.']].forEach(function(w){
      if(run.limit > w[0] * 2 && left <= w[0] && left > w[0] - 5000 && !warned[w[0]]){
        warned[w[0]] = 1;
        var a = document.getElementById('exAlert');
        if(a) a.textContent = w[1];
      }
    });
    if(left <= 0) finish(true);
  }

  function answeredCount(){ return run.choices.filter(function(c){ return c !== null; }).length; }

  function status(){
    var n = run.ids.length, a = answeredCount(), f = run.flags.filter(Boolean).length;
    app.querySelector('.ex-status').textContent = 'Question ' + (run.cur + 1) + ' of ' + n + ' · ' + a + ' answered' + (f ? ' · ' + f + ' flagged' : '');
    app.querySelector('.ex-navcount').textContent = '(' + a + ' of ' + n + ' answered)';
    app.querySelectorAll('.ex-nav button').forEach(function(b, i){
      var done = run.choices[i] !== null, fl = run.flags[i];
      b.classList.toggle('is-done', done);
      b.classList.toggle('is-flag', fl);
      if(i === run.cur) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current');
      b.setAttribute('aria-label', 'Question ' + (i + 1) + ', ' + (done ? 'answered' : 'not answered') + (fl ? ', flagged' : ''));
    });
    var fb = app.querySelector('[data-act="flag"]');
    fb.setAttribute('aria-pressed', run.flags[run.cur] ? 'true' : 'false');
    fb.textContent = run.flags[run.cur] ? 'Flagged' : 'Flag for review';
    app.querySelector('[data-act="prev"]').disabled = run.cur === 0;
    app.querySelector('[data-act="next"]').textContent = run.cur === n - 1 ? 'Review and submit' : 'Next';
  }

  function moleculeHtml(q){
    if(!q.molecule || !Mo || !Mo.get) return '';
    var rec = Mo.get(q.molecule);
    if(!rec) return '';
    // Same overrides as session-runner.js: no caption, and an aria-label
    // that does not name the compound, since the name can be the answer.
    var label = 'Structure for this question' + (rec.formula ? ', molecular formula ' + rec.formula : '');
    return '<div class="q-molecule">' + Mo.svg(q.molecule, { caption: '', label: label }) + '</div>';
  }

  function go(i, quiet){
    if(!run || i < 0 || i >= run.ids.length) return;
    run.cur = i; save();
    var q = BYID[run.ids[i]], order = run.orders[i], pick = run.choices[i];
    var card = document.getElementById('exCard');
    card.innerHTML = '<div class="step-eyebrow">Question ' + (i + 1) + ' of ' + run.ids.length + '</div>' +
      '<fieldset class="ex-q"><legend><h2 class="step-title" id="exStem" tabindex="-1">' + esc(q.prompt) + '</h2></legend>' +
        moleculeHtml(q) +
        '<div class="ex-opts">' + order.map(function(orig, pos){
          return '<label class="ex-opt"><input type="radio" name="exChoice" value="' + orig + '"' + (pick === orig ? ' checked' : '') + '>' +
            '<span class="ex-letter" aria-hidden="true">' + LETTERS[pos] + '</span><span class="ex-otext">' + esc(q.options[orig]) + '</span></label>';
        }).join('') + '</div>' +
      '</fieldset>';
    card.querySelectorAll('input[name="exChoice"]').forEach(function(inp){
      inp.addEventListener('change', function(){ run.choices[run.cur] = +inp.value; save(); status(); });
    });
    status();
    if(!quiet) focusEl(document.getElementById('exStem'));
    var top = app.querySelector('.ex-run');
    if(top && top.getBoundingClientRect().top < 0) top.scrollIntoView();
  }

  function askSubmit(){
    var left = run.ids.length - answeredCount(), f = run.flags.filter(Boolean).length;
    var dlg = app.querySelector('.ex-dialog');
    var parts = [];
    if(left) parts.push(plural(left, 'question') + ' not answered (blank answers score zero)');
    if(f) parts.push(plural(f, 'question') + ' still flagged');
    dlg.querySelector('p').textContent = parts.length ? parts.join(' and ') + '. Submit anyway?' : 'All ' + run.ids.length + ' answered. Submit and see your results?';
    if(dlg.showModal){ if(!dlg.open) dlg.showModal(); } else dlg.setAttribute('open', '');
    focusEl(dlg.querySelector('[data-act="confirm"]'));
  }

  /* ---- grading and results -------------------------------------------- */

  function finish(timeUp, whileAway){
    if(!run) return;
    var r = run;
    run = null;
    clearInterval(tickTimer);
    drop(RUN_KEY);

    var items = r.ids.map(function(id, i){
      var q = BYID[id];
      return { id: id, topic: q.topic, chapter: TOPIC[q.topic].chapter, diff: DIFF[id], answer: q.answer, choice: r.choices[i], flagged: r.flags[i] };
    });
    var s = X.score(items);

    // Record exactly as Practice does: per answer through the diagnostic
    // engine, then the session. See the header for why blanks are skipped.
    var touched = {};
    items.forEach(function(it){
      if(it.choice === null) return;
      var q = BYID[it.id];
      var d = D.applyResult(q, { choice: it.choice });
      touched[E.primaryConcept(q)] = 1;
      if(d && d.conceptId) touched[d.conceptId] = 1;
      E.markSeen(q.id);
    });
    if(s.answered){
      M.recordSession({ mode: 'exam', asked: s.answered, correct: s.right, concepts: Object.keys(touched) });
    }
    var used = Math.min(Date.now() - r.startedAt, r.limit || Infinity);
    var hist = read(HIST_KEY, []);
    write(HIST_KEY, X.addHistory(hist, {
      ts: Date.now(), kind: r.kind, label: r.label, right: s.right, total: s.total, answered: s.answered,
      ms: used, timeUp: !!timeUp,
      chapters: s.byChapter.map(function(x){ return [x.key, x.c, x.n]; })
    }));
    if(window.LevlAnalytics) window.LevlAnalytics.event('ochem-session-finish', { mode: 'exam-' + r.kind, answered: s.answered });
    if(window.LevlSound && window.LevlSound.flourish) window.LevlSound.flourish(s.total ? s.right / s.total : 0);
    if(window.StudyHubAccount && s.total >= 20){
      setTimeout(function(){
        window.StudyHubAccount.promptToSave('Exam finished — ' + s.right + '/' + s.total,
          { kind: 'exam', score: s.right, total: s.total, missed: s.answered - s.right });
      }, 2600);
    }
    renderResults(r, items, s, timeUp, whileAway, used);
  }

  function bars(title, list, name, href){
    if(!list.length) return '';
    return '<section class="ex-break"><h3>' + title + '</h3><ul class="ex-bars">' + list.map(function(x){
      var p = pctOf(x.c, x.n), nm = esc(name(x.key)), h = href && href(x.key);
      return '<li><span class="ex-bar-name">' + (h ? '<a href="' + h + '">' + nm + '</a>' : nm) + '</span>' +
        '<span class="track thin" aria-hidden="true"><i class="' + (p >= 80 ? 'is-hi' : p >= 60 ? 'is-mid' : 'is-lo') + '" style="width:' + p + '%"></i></span>' +
        '<span class="ex-bar-v">' + x.c + '/' + x.n + '<span class="sr-only"> right</span></span></li>';
    }).join('') + '</ul></section>';
  }

  function renderResults(r, items, s, timeUp, whileAway, used){
    view('results');
    var missed = s.answered - s.right, blank = s.total - s.answered;
    var multiChapter = s.byChapter.length > 1;
    var weak = s.weak.slice(0, 5);
    var flaggedN = items.filter(function(it){ return it.flagged; }).length;
    var xp = window.OchemXP && s.answered ? window.OchemXP.summaryHtml() : '';
    var chOrder = {};
    CHAPTERS.forEach(function(c){ chOrder[c.id] = c.n; });
    var byChapter = s.byChapter.slice().sort(function(a, b){ return chOrder[a.key] - chOrder[b.key]; });
    var byTopic = s.byTopic.slice().sort(function(a, b){ return (a.c / a.n - b.c / b.n) || (b.n - a.n); });
    var byDiff = ['easy', 'medium', 'hard'].map(function(d){ return s.byDiff.filter(function(x){ return x.key === d; })[0]; }).filter(Boolean);

    app.innerHTML = '<h1 class="sr-only">Exam results</h1><div class="ex-results">' +
      '<div class="overall-card ex-score" tabindex="-1"><div><div class="k">' + esc(r.label) + '</div><div class="big">' + s.pct + '%</div></div>' +
        '<div class="ex-score-d">' + s.right + ' of ' + s.total + ' right' + (blank ? ', ' + blank + ' left blank' : '') + '. ' +
          (timeUp ? (whileAway ? 'Time ran out while you were away, so it was graded as it stood.' : 'Time ran out.') : 'Finished in ' + clock(used) + '.') + '</div></div>' +
      xp +
      (missed ? '<p>' + plural(missed, 'missed question') + ' went to your <a href="review.html">review queue</a>.</p>' : (s.answered ? '<p>Every answered question right.</p>' : '')) +
      (weak.length ? '<h2 class="section-head">Study next</h2><ul class="ex-next">' + weak.map(function(x){
        var t = TOPIC[x.key];
        return '<li><div><b>' + esc(t.title) + '</b><span class="ex-small">' + x.c + ' of ' + x.n + ' right &middot; ' + esc(chLabel(CHAPTER[t.chapter])) + '</span></div>' +
          '<span class="ex-next-links"><a class="btn-outline" href="learn.html#' + esc(t.id) + '">Read the section</a>' +
          (t.lesson ? '<a class="btn-outline" href="' + esc(t.href) + '">Lesson</a>' : '') + '</span></li>';
      }).join('') + '</ul>' : '') +
      '<h2 class="section-head">Your score, broken down</h2><div class="ex-breaks">' +
        (multiChapter ? bars('By chapter', byChapter, function(k){ return chLabel(CHAPTER[k]); }, function(k){ return 'learn.html#' + CHAPTER[k].topics[0].id; }) : '') +
        bars('By topic', byTopic, function(k){ return TOPIC[k].title; }, function(k){ return 'learn.html#' + k; }) +
        bars('By difficulty', byDiff, function(k){ return DIFF_NAME[k]; }) +
      '</div>' +
      (window.LevlNextStep ? LevlNextStep('ochem', { topics: s.byTopic.map(function(x){ return x.key; }), also: [{ label: 'Take another exam', act: renderSetup }] }) : '') +
      '<h2 class="section-head" id="exReviewH">Review every question</h2>' +
      '<div class="ex-filter" role="group" aria-label="Show">' +
        '<button type="button" class="ex-chip-b" aria-pressed="true" data-f="all">All ' + s.total + '</button>' +
        '<button type="button" class="ex-chip-b" aria-pressed="false" data-f="miss"' + (s.total - s.right ? '' : ' disabled') + '>Missed ' + (s.total - s.right) + '</button>' +
        '<button type="button" class="ex-chip-b" aria-pressed="false" data-f="flag"' + (flaggedN ? '' : ' disabled') + '>Flagged ' + flaggedN + '</button>' +
      '</div>' +
      '<ol class="ex-review">' + items.map(function(it, i){ return reviewItem(it, r.orders[i], i + 1); }).join('') + '</ol>' +
      '<div class="ex-actions"><button type="button" class="btn-outline" data-act="again">Take another exam</button></div>' +
    '</div>';

    app.querySelectorAll('[data-act="again"]').forEach(function(b){ b.addEventListener('click', function(){ renderSetup(); }); });
    app.querySelectorAll('[data-f]').forEach(function(b){
      b.addEventListener('click', function(){
        var f = b.getAttribute('data-f');
        app.querySelectorAll('[data-f]').forEach(function(x){ x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
        app.querySelectorAll('.ex-ritem').forEach(function(li){
          li.hidden = (f === 'miss' && li.classList.contains('is-ok')) || (f === 'flag' && !li.classList.contains('is-flag'));
        });
      });
    });
    focusEl(app.querySelector('.ex-score'));
  }

  /* How a report names an ochem question: id plus a hash of the stem, the
     same shape session-runner.js sends. */
  function questionRef(q){ return q.id + ':' + X.hash(q.prompt); }

  function reviewItem(it, order, n){
    var q = BYID[it.id], t = TOPIC[q.topic];
    var ok = it.choice === it.answer, blank = it.choice === null;
    var verdict = blank ? 'Not answered' : ok ? 'Correct' : 'Missed';
    function tag(text, cls){ return '<span class="ex-tag ' + cls + '">' + text + '</span>'; }
    return '<li class="ex-ritem ' + (ok ? 'is-ok' : 'is-no') + (it.flagged ? ' is-flag' : '') + '">' +
      '<p class="ex-verdict"><span class="ex-vtag">' + verdict + '</span>' + (it.flagged ? tag('Flagged', 'fl') : '') +
        '<span class="ex-small">' + esc(t.title) + ' &middot; ' + esc(DIFF_NAME[it.diff] || '') + '</span></p>' +
      '<p class="ex-rstem"><span class="ex-rn">' + n + '.</span> ' + esc(q.prompt) + '</p>' + moleculeHtml(q) +
      '<ul class="ex-ropts">' + order.map(function(orig, pos){
        var isKey = orig === q.answer, isPick = orig === it.choice;
        return '<li class="' + (isKey ? 'is-right' : isPick ? 'is-wrong' : '') + '"><span class="ex-letter" aria-hidden="true">' + LETTERS[pos] + '</span>' +
          '<span class="ex-otext">' + esc(q.options[orig]) + '</span>' +
          (isPick ? tag('Your answer', isKey ? 'ok' : 'no') : '') + (isKey ? tag('Correct answer', 'key') : '') + '</li>';
      }).join('') + '</ul>' +
      (q.why ? '<p class="ex-why"><b>Why:</b> ' + esc(q.why) + '</p>' : '') +
      '<p class="ex-links"><a href="learn.html#' + esc(q.topic) + '">Read the section</a>' +
        (t.lesson ? ' <span aria-hidden="true">&middot;</span> <a href="' + esc(t.href) + '">Lesson</a>' : '') +
        (window.LevlReport ? ' ' + window.LevlReport.button('ochem', questionRef(q)) : '') + '</p>' +
    '</li>';
  }

  /* ---- boot ------------------------------------------------------------ */

  function boot(){
    app.innerHTML = '<p class="ex-small">Loading the question bank…</p>';
    (window.OchemPracticeBankReady || Promise.resolve()).then(function(){
      loadPool();
      if(!POOL.length){ app.innerHTML = '<p>The question bank did not load. Check your connection and reload.</p>'; return; }
      var p = new URLSearchParams(location.search);
      if(KINDS.some(function(k){ return k.id === p.get('kind'); })) cfg.kind = p.get('kind');
      if(CHAPTER[p.get('chapter')]){ cfg.chapter = p.get('chapter'); if(!p.get('kind')) cfg.kind = 'chapter'; }
      var r = savedRun();
      // An attempt whose time ran out while the page was closed is graded as
      // it stood, the same as if the page had been open when the clock hit 0.
      if(r && r.deadline && X.timeLeft(r, Date.now()) <= 0){ run = r; finish(true, true); return; }
      renderSetup();
      // A pass confirmed after load opens unlimited exams without a reload.
      var wasOpen = examAccess().available;
      if(window.LevlPremium) window.LevlPremium.onChange(function(){
        var now = examAccess().available;
        if(now !== wasOpen && app.getAttribute('data-view') === 'setup'){ wasOpen = now; renderSetup(); }
      });
    });
  }
  boot();
})();
