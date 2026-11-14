/* The NREMT-EMT dashboard (nremt/dashboard.html): the five questions of assets/course/dash.js, built from the
   practice-engine records (docs/dashboard.md). Every panel the page had before is still drawn, by the same code,
   into the folded drawer under the question it answers: topic areas with their notes, the five exam domains, the
   readiness estimate, score over time, recent exams, the review queue, level, streak calendar, badges and the
   milestones. Kept out of an inline script so the site check does not read the generated href="' + ... + '"
   strings as links. Readiness and the domains stay Premium (assets/premium-gates.js), drawn when unlocked. */
(function(){
  var H = window.LevlHub, D = window.LevlDash;
  var root = document.getElementById('d5Root');
  if(!H || !D || !root) return;
  var esc = H.esc, plural = H.plural;

  // Topic areas: the body-system labels the bank carries (nremt_domain_stats_all).
  var DOMAINS = ['Assessment', 'Airway & Respiratory', 'Cardiac & Medical', 'Trauma', 'OB/Peds & Special Populations', 'EMS Operations'];
  var ICON = { 'Assessment': 'clipboard', 'Airway & Respiratory': 'lungs', 'Cardiac & Medical': 'heart', 'Trauma': 'bandage', 'OB/Peds & Special Populations': 'person', 'EMS Operations': 'ambulance' };
  // The 2025 exam domains and their bands (EMT examination specifications); DOMAIN_TARGETS in practice-engine.js.
  var EXAM_DOMAINS = [
    { d: 'Scene Size-Up & Safety', band: '15–19%', mid: 17 },
    { d: 'Primary Assessment', band: '39–43%', mid: 41 },
    { d: 'Secondary Assessment', band: '5–9%', mid: 7 },
    { d: 'Patient Treatment & Transport', band: '20–24%', mid: 22 },
    { d: 'Operations', band: '10–14%', mid: 12 }
  ];
  // The notes chapter that teaches each topic area and exam domain (polish 2026-10-17, B7).
  var NOTES = {
    'Assessment': ['principles-of-assessment', 'Principles of assessment'],
    'Airway & Respiratory': ['airway-management', 'Airway management'],
    'Cardiac & Medical': ['cardiac-emergencies', 'Cardiac emergencies'],
    'Trauma': ['multisystem-trauma', 'Multisystem trauma'],
    'OB/Peds & Special Populations': ['obstetric-and-gynecologic-emergencies', 'Obstetric emergencies'],
    'EMS Operations': ['ems-operations', 'EMS operations'],
    'Scene Size-Up & Safety': ['scene-size-up', 'Scene size-up'],
    'Primary Assessment': ['primary-assessment', 'Primary assessment'],
    'Secondary Assessment': ['secondary-assessment', 'Secondary assessment'],
    'Patient Treatment & Transport': ['', 'the chapters by condition', 'study-notes.html'],
    'Operations': ['ems-operations', 'EMS operations']
  };
  function notesHref(n){ return n[2] || 'notes/' + n[0] + '.html'; }
  function notesLink(d){ var n = NOTES[d]; return n ? '<a href="' + notesHref(n) + '">notes: ' + esc(n[1]) + '</a>' : ''; }
  // The full practice exam: 100 questions in two hours (practice-engine.js TIME_LIMIT_MS), 72 seconds a question.
  var EXAM_SECONDS_PER_Q = 72;
  var GOAL = 80; // the site's top band, "On track", and the full-exam certificate (assets/milestones.js)

  function readJSON(key, fallback){ try{ var raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; }catch(e){ return fallback; } }
  function set(id, html){ var el = document.getElementById(id); if(el) el.innerHTML = html; }
  var G = window.NremtGates || { canUse: function(){ return true; }, gate: function(){ return ''; }, badge: function(){ return ''; }, onChange: function(fn){ fn(); } };

  function draw(){
    var history = readJSON('nremt_exam100_history', []).filter(function(x){ return x && x.total > 0; });
    var mastery = readJSON('nremt_mastery', {});
    var domainStats = readJSON('nremt_domain_stats_all', {});
    var examDomainStats = readJSON('nremt_exam_domain_stats', {});
    var missed = readJSON('nremt_exam100_missed', []);
    var legacyStreak = readJSON('nremt_streak', { currentStreak: 0, longestStreak: 0, lastActiveDate: null, dailyCounts: {}, dailyGoal: 15 });
    var HP = window.HubProgress;

    function dayKey(offset){
      var d = new Date(); if(offset) d.setDate(d.getDate() + offset);
      return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    }
    // The streak is site-wide (assets/hub-progress.js), with the old NREMT-only record as a fallback.
    function hubStreak(){
      if(HP) return HP.streak();
      var today = dayKey(0), yesterday = dayKey(-1), counts = legacyStreak.dailyCounts || {};
      var broken = legacyStreak.lastActiveDate !== null && legacyStreak.lastActiveDate !== today && legacyStreak.lastActiveDate !== yesterday;
      return { current: broken ? 0 : (legacyStreak.currentStreak || 0), longest: legacyStreak.longestStreak || 0, todayCount: counts[today] || 0, goal: legacyStreak.dailyGoal || 15,
        metToday: (counts[today] || 0) >= (legacyStreak.dailyGoal || 15), days: Object.keys(counts).reduce(function(a, k){ a[k] = { nremt: counts[k] }; return a; }, {}) };
    }
    var st = hubStreak();

    var allTotal = 0, allCorrect = 0;
    DOMAINS.forEach(function(d){ var s = domainStats[d]; if(s && s.total){ allTotal += s.total; allCorrect += s.correct; } });
    var overallPct = allTotal ? Math.round(allCorrect / allTotal * 100) : null;

    // Due for review: the same rule as the Review queue (practice-engine.js loadDueForReview).
    var levels = [0, 0, 0, 0, 0, 0], dueCount = 0;
    Object.keys(mastery).forEach(function(k){
      var rec = mastery[k], daysSince = (Date.now() - (rec.lastSeen || 0)) / 86400000;
      var eff = Math.max(0, (rec.level || 0) - Math.floor(daysSince / 4));
      levels[Math.min(5, Math.max(0, eff))]++;
      if(eff < 5) dueCount++;
    });
    var totalTracked = Object.keys(mastery).length, missedCount = Array.isArray(missed) ? missed.length : 0;
    // Answers are recorded as each is checked (practice-engine.js recordLive), and any tracked question or missed one
    // counts as a start, so the page fills in mid-session (consistency audit 2026-11, B1).
    var isNew = !allTotal && !history.length && !totalTracked && !missedCount;

    // Pace on full exams: seconds a question, from the time each finished exam took.
    var paced = history.filter(function(x){ return x.timeMs > 0; });
    var pace = paced.length ? Math.round(paced.slice(-3).reduce(function(a, x){ return a + x.timeMs / 1000 / x.total; }, 0) / Math.min(3, paced.length)) : null;

    // ---- readiness (the estimate the practice-exam page shows; same arithmetic) ----
    function readiness(hist, stats){
      var h = hist.filter(function(x){ return x.total > 0; });
      if(!h.length) return { available: false };
      var n = h.length, ws = 0, wt = 0;
      h.forEach(function(x, i){ var w = i + 1; ws += x.score / x.total * 100 * w; wt += w; });
      var weightedAvg = ws / wt, adjusted = weightedAvg, weakestDomain = null, weakestPct = null, overall = null;
      var entries = Object.keys(stats).filter(function(d){ return stats[d].total >= 5; }).map(function(d){ return [d, stats[d].correct / stats[d].total * 100]; });
      if(entries.length){
        entries.sort(function(a, b){ return a[1] - b[1]; });
        weakestDomain = entries[0][0]; weakestPct = entries[0][1];
        var tc = 0, tq = 0; Object.keys(stats).forEach(function(d){ if(stats[d].total >= 5){ tc += stats[d].correct; tq += stats[d].total; } });
        overall = tc / tq * 100;
        var gap = overall - weakestPct;
        if(gap > 15) adjusted -= (gap - 15) * 0.5;
      }
      adjusted = Math.max(0, Math.min(100, adjusted));
      var raw = 1 / (1 + Math.exp(-0.13 * (adjusted - 72))), conf = Math.min(1, n / 5), blended = raw * conf + 0.5 * (1 - conf);
      var v = Math.max(2, Math.min(98, Math.round(blended * 100)));
      return { available: true, value: v, label: v >= 80 ? 'On track' : v >= 55 ? 'Within reach' : 'Needs more practice', lvl: v >= 80 ? 4 : v >= 55 ? 2 : 1,
        attempts: n, weightedAvg: Math.round(weightedAvg), weakestDomain: weakestDomain, weakestPct: weakestPct === null ? null : Math.round(weakestPct), overall: overall, lowConfidence: n < 3 };
    }
    var R = readiness(history, domainStats), canReady = G.canUse('readiness');

    // ---- exam date ----
    var ED = window.LevlExamDate, examIso = ED ? ED.read('nremt') : null, daysLeft = examIso ? ED.daysUntil(examIso) : null;
    var examT = examIso ? (function(p){ return new Date(p[0], p[1] - 1, p[2]).getTime(); })(examIso.split('-').map(Number)) : null;
    if(daysLeft !== null && daysLeft < 0){ examIso = null; daysLeft = null; examT = null; }
    var bank = 0; try{ bank = parseInt(localStorage.getItem('nremt_bank_size'), 10) || 0; }catch(e){}
    var unseen = Math.max(0, bank - totalTracked);
    var weeks = D.dailyWeeks('nremt');
    var rising = weeks.length >= 2 && weeks[weeks.length - 1].pct - weeks[0].pct >= 3;

    // ---- topic areas, by what each costs ----
    var topicRows = DOMAINS.map(function(d){
      var s = domainStats[d] || { total: 0, correct: 0 };
      return { d: d, total: s.total || 0, correct: s.correct || 0, miss: (s.total || 0) - (s.correct || 0), acc: s.total ? s.correct / s.total : null };
    });
    var started = topicRows.filter(function(r){ return r.total; });
    var lowest = started.slice().sort(function(a, b){ return a.acc - b.acc; })[0];
    var best = started.slice().sort(function(a, b){ return b.acc - a.acc; })[0];
    var costly = started.filter(function(r){ return r.total >= 5 && r.acc < 0.8; }).sort(function(a, b){ return b.miss - a.miss; })[0];
    var maxMiss = Math.max.apply(null, [1].concat(started.map(function(r){ return r.miss; })));

    var pastDays = null;
    if(ED){ var rawIso = ED.read('nremt'); if(rawIso){ var dd = ED.daysUntil(rawIso); if(dd < 0) pastDays = -dd; } }

    // ---------------------------------------------------------------- readiness (docs/progress-profile.md)
    // Every answer in every mode (nremt_mastery), scored against each question's difficulty, each exam domain
    // weighted by its share of the 2025 exam. Needs the question meta (assets/qmeta.json), loaded once.
    var RR = window.LevlReady, est = null, answers = [];
    if(QM && RR){
      Object.keys(mastery).forEach(function(id){
        var rec = mastery[id], x = QM.q[id]; if(x == null || !rec) return;
        var tot = (rec.timesCorrect || 0) + (rec.timesWrong || 0); if(!tot) return;
        answers.push({ id: id, area: QM.dom[Math.floor(x / 100)], sys: QM.sys[Math.floor(x / 10) % 10], right: rec.timesCorrect || 0, total: tot, t: rec.lastSeen || 0, diff: QM.diff[x % 10] });
      });
      var bp = {}; EXAM_DOMAINS.forEach(function(x){ bp[x.d] = x.mid; });
      var opts = { bank: QM.bank, blueprint: bp, live: LIVE };
      if(answers.length) est = RR.estimate(Object.assign({ answers: answers }, opts));
      // What bringing one topic area to 80% right would add: the same estimate with that area's misses turned right.
      var gainFor = function(sys){
        if(!est) return 0;
        var lifted = answers.map(function(a){ return a.sys === sys && a.right / a.total < 0.8 ? Object.assign({}, a, { right: a.total * 0.8 }) : a; });
        return RR.estimate(Object.assign({ answers: lifted }, opts)).value - est.value;
      };
    }
    var DOMAIN_TOOL = {
      'Airway & Respiratory': ['sound-trainer.html', 'Sound Trainer'], 'Cardiac & Medical': ['sound-trainer.html', 'Sound Trainer'],
      'Trauma': ['scenario-sim.html', 'Scenarios'], 'Assessment': ['flowcharts.html', 'Flow Diagrams'],
      'EMS Operations': ['flowcharts.html', 'Flow Diagrams'], 'OB/Peds & Special Populations': ['scenario-sim.html', 'Choking toddler scenario']
    };
    function weakTopic(d){
      var t = (domainStats[d] || {}).topics || {}, best = null;
      Object.keys(t).forEach(function(k){ var s = t[k]; if(s && s.total >= 3){ var p = s.correct / s.total; if(!best || p < best.p) best = { name: k, p: p }; } });
      return best ? { name: best.name, pct: Math.round(best.p * 100) } : null;
    }
    var SHORT = { 'OB/Peds & Special Populations': 'OB/Peds', 'Airway & Respiratory': 'Airway', 'Cardiac & Medical': 'Cardiac', 'EMS Operations': 'Operations' };
    function tierOf(acc){ return acc >= 0.8 ? 'ok' : acc >= 0.55 ? 'mid' : ''; }

    // ---------------------------------------------------------------- how close am I
    var GOALT = GOAL + '%, on track';
    var examFact = { big: examIso ? D.shortDate(examT) : 'Set date', label: examIso ? 'exam day, ' + plural(daysLeft, 'day') + ' left' : 'your exam day, for a countdown', button: 'd5ExamCard' };
    var facts = [examFact];
    if(pace) facts.push({ big: pace + ' s', label: 'a question on full exams', note: 'of ' + EXAM_SECONDS_PER_Q + ', ' + (pace <= EXAM_SECONDS_PER_Q * 0.9 ? 'on pace' : pace <= EXAM_SECONDS_PER_Q ? 'tight' : 'too slow'), tone: pace <= EXAM_SECONDS_PER_Q ? 'ok' : 'warn' });
    if(history.length){ var bestE = Math.max.apply(null, history.map(function(x){ return Math.round(x.score / x.total * 100); })); facts.push({ big: bestE + '%', label: 'best full exam, of ' + history.length, href: 'exams.html' }); }
    else facts.push({ big: '100', label: 'questions in a full timed exam', href: 'exams.html' });
    var ready = { badge: G.badge(), facts: facts, slot: 'd5ExamCard',
      foot: 'From your own practice answers: not real NREMT results, and not a chance of passing.' };
    if(!canReady){
      ready.lockRow = { text: '<b>Readiness estimate</b>: your expected score on the real exam, by domain', href: '../premium.html#nremt' };
    } else if(!est || est.value == null){
      ready.value = null;
      ready.empty = QM || !answers.length ? 'Answer questions in any mode and your expected exam score shows up here.' : 'Working it out&hellip;';
    } else {
      var v = est.value;
      ready.value = v; ready.unit = '%';
      ready.pill = v >= GOAL ? { text: 'On track', tier: 'good' } : v >= GOAL - 15 ? { text: 'Within reach', tier: 'mid' } : { text: 'Needs more practice', tier: 'low' };
      ready.scale = { goal: GOAL, goalText: GOALT, range: [est.lo, est.hi], lo: '0%', hi: '100%' };
      ready.explain = 'Your expected score on a full exam today, likely <b>' + est.lo + '% to ' + est.hi + '%</b>. From all ' + Number(est.n).toLocaleString() + ' of your answers: harder questions count more, recent ones most, and each exam domain by its share of the real exam. On track is <b>' + GOAL + '%</b>.' +
        (est.n < 60 ? ' With this few answers the range is wide; it narrows as you practice.' : '');
      if(pastDays !== null && pastDays <= 120) ready.outcome = { course: 'nremt', title: 'How did your NREMT exam go?', choices: [['pass', 'I passed'], ['fail', 'I did not pass'], ['later', 'Not taken yet']], predicted: { value: v, lo: est.lo, hi: est.hi }, n: est.n, days: pastDays };
    }
    if(isNew && canReady){ ready.value = null; ready.empty = 'Answer questions in any mode and your expected exam score shows up here.'; }
    ready.onSlot = function(){
      if(ED) ED.mount(document.getElementById('d5ExamCard'), {
        subject: 'nremt', links: { review: 'review.html', exams: 'exams.html' },
        target: function(days){
          if(!bank) return { n: st.goal || 15, unit: 'questions', one: 'question', why: 'is your daily goal' };
          if(!unseen) return { done: 'You have answered every question in the bank. Days from here are for Review and timed exams.' };
          return { n: Math.ceil(unseen / days), unit: 'new questions', one: 'new question', why: 'covers the ' + unseen.toLocaleString() + ' you have not answered yet, plus whatever Review has due' };
        }
      });
    };

    // ---------------------------------------------------------------- am I getting better
    var fmtD = function(ts){ return D.shortDate(ts); };
    var progress = {
      weeks: weeks, exams: history.map(function(x){ return { t: x.date, pct: Math.round(x.score / x.total * 100) }; }),
      examWord: 'full exams', firstExamWord: 'first full exam',
      goal: { pct: GOAL, label: GOAL + '%, on track', key: 'on track: 80% on a full exam' },
      examDate: examT ? { t: examT } : null, allHref: history.length ? 'exams.html' : null, allText: 'Exams',
      recent: history.slice(-3).reverse().map(function(x){ return { big: Math.round(x.score / x.total * 100) + '%', sub: fmtD(x.date) + ' &middot; ' + x.total + ' questions' + (x.timeMs ? ', ' + Math.round(x.timeMs / 60000) + ' min' : '') }; }),
      empty: overallPct === null ? 'Your line starts with your first answers.' : 'So far: ' + overallPct + '% on ' + plural(allTotal, 'answer') + '. Your weekly line starts now.'
    };

    // ---------------------------------------------------------------- what is holding me back
    var trows = started.slice().sort(function(a, b){ return b.miss - a.miss; }).map(function(r){
      var tool = DOMAIN_TOOL[r.d], n = NOTES[r.d], g = canReady && est ? gainFor(r.d) : 0;
      var links = []; if(tool) links.push({ href: tool[0], label: tool[1], kind: 'tool' }); if(n) links.push({ href: notesHref(n), label: 'Notes' });
      return { name: r.d, pct: Math.round(r.acc * 100), word: 'right', weak: weakTopic(r.d), cost: r.miss + ' missed of ' + r.total, bar: r.acc, tier: tierOf(r.acc),
        gain: g >= 1 ? '+' + Math.round(g) : '', href: 'practice.html?system=' + encodeURIComponent(r.d), cta: 'Practice ' + (SHORT[r.d] || r.d), links: links };
    }).concat(topicRows.filter(function(r){ return !r.total; }).map(function(r){
      return { name: r.d, off: true, sub: 'not started', href: 'practice.html?system=' + encodeURIComponent(r.d), cta: 'Start' };
    }));
    var domView = { label: 'Exam domains', badge: G.badge() ? ' <span class="premium-badge">Premium</span>' : '' };
    if(!canReady) domView.locked = '<p class="d5-empty">Your expected score in each of the five 2025 exam domains, weighted by its share of the exam, comes with Premium.</p>';
    else {
      domView.intro = 'The five domains of the 2025 EMT exam. Expected score is what the readiness estimate predicts there; right is what you have answered so far.';
      domView.rows = EXAM_DOMAINS.map(function(x){
        var s = examDomainStats[x.d], a = est && est.areas[x.d], acc = s && s.total ? s.correct / s.total : null, n = NOTES[x.d];
        return { x: x, acc: acc, a: a, row: { name: x.d, pct: a ? a.pct : null, word: 'expected', sub: (acc !== null ? Math.round(acc * 100) + '% right of ' + s.total + ' &middot; ' : '') + x.band + ' of the exam', bar: a ? a.pct / 100 : 0, tier: a ? tierOf(a.pct / 100) : '',
          href: 'practice.html?domain=' + encodeURIComponent(x.d), cta: 'Practice', links: n ? [{ href: notesHref(n), label: 'Notes' }] : [] } };
      }).sort(function(p, q){ return (q.x.mid * (1 - (q.a ? q.a.pct / 100 : 1))) - (p.x.mid * (1 - (p.a ? p.a.pct / 100 : 1))); }).map(function(z){ return z.row; });
      if(!est) domView.rows = [];
      domView.empty = 'Answer questions in any mode to see your expected score in each exam domain.';
    }
    var focus = { note: started.length ? 'Ranked by how many questions each area costs you' + (canReady && est ? ' &middot; <b class="d5-gain">+</b> is what bringing it to 80% adds to your readiness' : '') : '',
      views: [{ label: 'Topic areas', rows: started.length ? trows : [], empty: 'Answer a few questions and your six topic areas line up here, the most expensive first.' }, domView] };

    var status = isNew ? 'start anywhere, this page fills in as you answer'
      : canReady && est && est.value != null ? (est.value >= GOAL ? est.value + '%, on track' : est.value + '%, ' + (GOAL - est.value) + ' points from on track' + (rising ? ', and climbing' : ''))
      : overallPct !== null ? overallPct + '% across ' + plural(allTotal, 'answer') + (rising ? ', and climbing' : '') : null;
    var info = HP ? HP.levelInfo('nremt') : null;

    D.render(root, { progress: progress, ready: ready, focus: focus,
      band: { status: status, level: info ? { level: info.level } : null, streak: st.current } });
  }

  // The question meta and live difficulty, once; each arrival redraws.
  var QM = null, LIVE = null;
  function loadMeta(){
    if(!window.fetch) return;
    fetch('assets/qmeta.json').then(function(r){ return r.ok ? r.json() : null; }).then(function(m){
      if(!m || !m.q) return;
      var bank = {}; Object.keys(m.q).forEach(function(id){ var x = m.q[id], d = m.dom[Math.floor(x / 100)]; (bank[d] || (bank[d] = [])).push(m.diff[x % 10]); });
      m.bank = bank; QM = m; draw();
    }).catch(function(){});
    if(window.LevlReady) window.LevlReady.live('nremt', function(q){ LIVE = q; if(QM) draw(); });
  }
  loadMeta();

  // Premium's onChange draws once now and again whenever a pass is bought or found (assets/premium.js).
  G.onChange(function(){ draw(); });
  // A cross-course suggestion (assets/cross-course.js), once a finished session has recorded a milestone.
  var cx = document.querySelector('[data-levl-cross]');
  if(cx && window.LevlLazy && /"m":\{"/.test(localStorage.getItem('levlprep_cross') || '')) window.LevlLazy('cross-course', function(X){ X.offer(cx, 'nremt'); });
  // Another tab answering questions, or a sync, redraws.
  window.addEventListener('storage', function(e){ if(!e.key || /^nremt_|^hub_/.test(e.key)) draw(); });
})();
