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
    var isNew = !allTotal && !history.length;

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

    // ---------------------------------------------------------------- 1 now
    var now;
    var today = { streak: st.current, count: st.todayCount, goal: st.goal, freezes: st.freezes || 0 };
    var Rem = window.LevlReminders;
    if(Rem && Rem.configured && Rem.configured()){
      var rs = Rem.settings ? Rem.settings() : null;
      today.reminder = rs && rs.subscribed ? { text: 'Reminders on', href: '../privacy.html#reminders' } : { text: 'Get a daily reminder', href: '../privacy.html#reminders' };
    }
    if(isNew){
      now = { title: 'Nothing here yet, so start <span>here.</span>', body: 'Every question you answer, in any mode, updates this page: your accuracy in six topic areas and the five exam domains, your review queue and your readiness.',
        steps: ['<a href="practice.html">Start a 20-question domain drill</a>, each answer checked as you go.', 'Or read the <a href="study-notes.html">study notes</a>, chapter by chapter.', 'Warm up with <a href="flashcards.html">flashcards</a> or try a <a href="tools.html">tool</a>.'], today: today };
    } else {
      var acts = [];
      var quota = window.NremtGates && window.NremtGates.quotaLeft ? window.NremtGates.quotaLeft() : Infinity;
      if(dueCount){
        var n = Math.min(dueCount, 40, quota === Infinity ? 40 : Math.max(quota, 0));
        var shaky = levels[0] + levels[1];
        if(n > 0) acts.push({ title: 'Review your <span>' + plural(n, n === dueCount ? 'question' : 'shakiest question') + '</span>.',
          body: (shaky ? plural(shaky, 'question') + ' you have missed or barely know are in your queue. ' : '') + 'Bringing them back before they fade is the cheapest way to keep what you learned.' + (pace ? ' About ' + Math.max(1, Math.round(n * pace / 60)) + ' minutes at your pace.' : ''),
          href: 'review.html?start=spaced', cta: 'Start review', then: 'Review ' + plural(n, 'due question'), key: 'review' });
      }
      if(costly) acts.push({ title: 'Drill <span>' + esc(costly.d) + '</span>.', body: 'It has cost you ' + costly.miss + ' of ' + costly.total + ' questions so far, more than any other area.' + (NOTES[costly.d] ? ' Read <a href="' + notesHref(NOTES[costly.d]) + '">' + esc(NOTES[costly.d][1]) + '</a> first if it has been a while.' : ''),
        href: 'practice.html?system=' + encodeURIComponent(costly.d), cta: 'Drill it', then: 'Then drill ' + esc(costly.d) + ', your most expensive area', key: 'drill' });
      if(missedCount) acts.push({ title: 'Redo the <span>' + plural(missedCount, 'question') + '</span> your exams got wrong.', body: 'Your missed list from full exams, each with its explanation.', href: 'review.html?start=review', cta: 'Redo them', then: 'Then redo the ' + plural(missedCount, 'question') + ' your exams got wrong', key: 'missed' });
      var lastExam = history.length ? history[history.length - 1].date : 0;
      if(G.canUse('exam') && allTotal >= 40 && (!lastExam || Date.now() - lastExam > 7 * 86400000)) acts.push({ title: history.length ? 'Take a full <span>timed exam</span>.' : 'Take your first <span>full timed exam</span>.',
        body: history.length ? 'Your last was ' + plural(Math.round((Date.now() - lastExam) / 86400000), 'day') + ' ago. Each one makes the readiness reading steadier.' : 'It is scored by exam domain, and your readiness reading starts from it.', href: 'exams.html', cta: 'Start the exam', then: history.length ? 'Then take a full timed exam' : 'Then take your first full timed exam', key: 'exam' });
      if(!acts.length) acts.push({ title: 'Keep the habit: <span>a mixed drill.</span>', body: 'Nothing is due and no area is costing you much. A drill across every area keeps it that way.', href: 'practice.html', cta: 'Practice', then: 'Then a mixed drill', key: 'mixed' });
      var first = acts[0];
      now = { title: first.title, body: first.body, href: first.href, cta: first.cta, today: today,
        then: acts.slice(1, 3).map(function(a){ return { text: a.then, href: a.href, cta: a.key === 'exam' ? 'Exam' : a.key === 'missed' ? 'Redo' : 'Go' }; }) };
    }

    // ---------------------------------------------------------------- 2 progress
    var progress = {
      weeks: weeks, exams: history.map(function(x){ return { t: x.date, pct: Math.round(x.score / x.total * 100) }; }),
      examWord: 'full exams', firstExamWord: 'first full exam',
      sub: overallPct !== null ? 'Overall: ' + overallPct + '% on ' + plural(allTotal, 'answer') + ' in every mode' + (missedCount ? ', ' + missedCount + ' in your missed queue.' : '.') : '',
      goal: { pct: GOAL, label: '80%, the full-exam certificate line', key: 'the certificate line: 80% on a full exam (weekly practice accuracy is not an exam score)' },
      examDate: examT ? { t: examT } : null, allHref: history.length ? 'exams.html' : null, allText: 'Exams',
      empty: overallPct === null ? 'Your line starts with your first answers.' : 'So far: ' + overallPct + '% on ' + plural(allTotal, 'answer') + '. Your weekly line starts now.',
      more: [{ label: 'Score over time and recent exams', html: '<div id="historyBox"></div><div id="activityBox"></div>' }]
    };
    if(!history.length) progress.more = [];

    // ---------------------------------------------------------------- 3 ready
    var title3 = examIso ? 'Will I be ready by <span>' + esc(D.shortDate(examT)) + '?</span>' : 'Will I be <span>ready?</span>';
    var sideBits = [];
    if(daysLeft !== null){
      if(canReady) sideBits.push(plural(daysLeft, 'day') + ' left');
      if(bank && unseen) sideBits.push('about ' + Math.ceil(unseen / Math.max(1, daysLeft)) + ' new questions a day finishes the bank');
    } else sideBits.push('No exam date yet. <a href="#d5ExamDate">Set one</a>');
    var ready = { title: title3, side: sideBits.join('<br>'), gap: [], more: [
      { label: daysLeft === null ? 'Set your exam date' : 'Exam date and daily target', html: '<div id="examDateCard"></div>', open: daysLeft === null && !isNew, id: 'd5ExamDate' }
    ] };
    if(canReady && R.available){
      var v = R.value;
      ready.big = String(v); ready.bigSub = ' / 100'; ready.badge = ' ' + G.badge();
      ready.note = v >= GOAL ? R.label + '. Keep it there.' : (GOAL - v) + ' to go' + (daysLeft !== null ? ', with ' + plural(daysLeft, 'day') + ' left.' : '.');
      ready.scale = { value: v, goal: GOAL, goalText: GOAL + ', on track', aria: 'Readiness ' + v + ' of 100; on track is ' + GOAL + '.' };
      // What closes the gap: each line recomputes the same estimate with one thing changed, so the numbers are real.
      var oneMore = readiness(history.concat([{ score: 80, total: 100 }]), domainStats);
      if(oneMore.value !== v) ready.gap.push({ text: 'One more full exam at 80% would make it ' + oneMore.value, value: (oneMore.value > v ? '+' : '') + (oneMore.value - v), href: 'exams.html' });
      if(R.weakestDomain && R.overall !== null && R.overall - R.weakestPct > 15){
        var lifted = JSON.parse(JSON.stringify(domainStats)), w = lifted[R.weakestDomain];
        w.correct = Math.ceil((R.overall - 15) / 100 * w.total);
        var up = readiness(history, lifted);
        if(up.value > v) ready.gap.push({ text: 'Bring ' + esc(R.weakestDomain) + ' up from ' + R.weakestPct + '% to ' + Math.round(w.correct / w.total * 100) + '%', value: '+' + (up.value - v), href: 'practice.html?system=' + encodeURIComponent(R.weakestDomain) });
      }
      if(R.attempts < 5) ready.gap.push({ text: 'It rests on ' + plural(R.attempts, 'full exam') + '. ' + (5 - R.attempts) + ' more and it stops being pulled toward the middle', value: 'steadier', kind: 'mut', href: 'exams.html' });
      ready.more.push({ label: 'How the readiness estimate works', html: '<div id="readinessBox"></div>' });
    } else if(canReady){
      ready.big = '&mdash;'; ready.note = 'One full timed exam starts your readiness reading.';
      ready.gap.push({ text: 'Take a full timed exam: 100 questions, two hours, scored by domain', value: 'starts it', kind: 'mut', href: 'exams.html' });
    } else {
      ready.big = daysLeft !== null ? String(daysLeft) : (overallPct !== null ? overallPct + '%' : '&mdash;');
      ready.bigSub = daysLeft !== null ? ' days left' : (overallPct !== null ? ' accuracy so far' : '');
      ready.note = 'Your readiness estimate comes with Premium.';
      ready.extra = G.gate('readiness', 'dashboard-domains');
    }
    if(pace) ready.gap.push({ text: 'Pace on your recent full exams: ' + pace + ' s a question. The practice exam gives you ' + EXAM_SECONDS_PER_Q, value: pace <= EXAM_SECONDS_PER_Q * 0.9 ? 'on track' : pace <= EXAM_SECONDS_PER_Q ? 'tight' : 'too slow', kind: pace <= EXAM_SECONDS_PER_Q * 0.9 ? 'ok' : 'mut' });
    ready.foot = 'Built from your own practice scores. Not calibrated against real NREMT results and not a chance of passing.';
    if(!ready.gap.length) delete ready.gap;

    // ---------------------------------------------------------------- 4 focus
    var trows = started.slice().sort(function(a, b){ return b.miss - a.miss; }).concat(topicRows.filter(function(r){ return !r.total; })).map(function(r){
      if(!r.total) return { icon: ICON[r.d], name: r.d, sub: 'not started', bar: 0, cost: '', href: 'practice.html?system=' + encodeURIComponent(r.d), cta: 'Start' };
      var pct = Math.round(r.acc * 100), tag = started.length > 1 && r === lowest ? ', your lowest' : started.length > 1 && r === best ? ', your best' : '';
      return { icon: ICON[r.d], warm: r.acc < 0.7, name: r.d, sub: pct + '% right' + tag, bar: r.miss / maxMiss, cost: r.miss + ' missed of ' + r.total, href: 'practice.html?system=' + encodeURIComponent(r.d), cta: 'Drill' };
    });
    // The Premium pill as text: G.badge() is a button, and a button cannot sit inside the view switch's button.
    var domView = { label: 'Exam domains', badge: G.badge() ? ' <span class="premium-badge">Premium</span>' : '' };
    if(!canReady) domView.locked = '<p class="d5-empty">Your accuracy in the five 2025 exam domains, weighted by each one&rsquo;s share of the exam, comes with Premium, along with the readiness estimate above.</p>';
    else {
      var drows = EXAM_DOMAINS.map(function(x){ var s = examDomainStats[x.d]; return { x: x, s: s, acc: s && s.total ? s.correct / s.total : null }; })
        .filter(function(r){ return r.acc !== null; }).map(function(r){ r.cost = r.x.mid * (1 - r.acc); return r; }).sort(function(a, b){ return b.cost - a.cost; });
      var maxCost = Math.max.apply(null, [0.1].concat(drows.map(function(r){ return r.cost; })));
      domView.rows = drows.map(function(r){
        return { icon: r.x.mid + '%', warm: r.acc < 0.7, name: r.x.d, sub: Math.round(r.acc * 100) + '% right &middot; ' + r.x.band + ' of the exam', bar: r.cost / maxCost,
          cost: '&asymp; ' + (Math.round(r.cost * 10) / 10) + ' of every 100 exam questions', href: 'practice.html?domain=' + encodeURIComponent(r.x.d), cta: 'Drill' };
      });
      domView.empty = 'Answer questions in any mode to see your accuracy by exam domain.';
    }
    var focus = { intro: 'Sorted by how many questions each area costs you, not by its percent. A big area at 63% can cost more than a small one at 54%.',
      views: [{ label: 'Topic areas', rows: started.length ? trows : [], empty: 'Answer a few questions and your six topic areas line up here, the most expensive first.' }, domView],
      more: [{ label: 'Topic areas with their notes', html: '<div id="topicBox"></div>' }].concat(canReady ? [{ label: 'The five exam domains, in detail', html: '<div id="domainBox"></div>' }] : []) };

    // ---------------------------------------------------------------- 5 record
    var info = HP ? HP.levelInfo('nremt') : (function(){
      var total = readJSON('nremt_xp', { total: 0 }).total || 0, f = function(n){ return 100 * (n - 1) * (n - 1); }, lv = 1;
      while(f(lv + 1) <= total) lv++;
      return { level: lv, title: 'First Responder', total: total, into: total - f(lv), span: Math.max(1, f(lv + 1) - f(lv)), toNext: f(lv + 1) - total, subjects: { nremt: total } };
    })();
    var bestExam = history.length ? Math.max.apply(null, history.map(function(x){ return Math.round(x.score / x.total * 100); })) : 0;
    var lvl = HP ? HP.level() : info.level;
    var badgeDefs = [
      { icon: 'flame', label: '7-day streak', have: st.longest, need: 7, prog: function(n){ return 'best ' + plural(n, 'day'); } },
      { icon: 'flame', label: '30-day streak', have: st.longest, need: 30, prog: function(n){ return 'best ' + plural(n, 'day'); } },
      { icon: 'check', label: 'First exam', have: history.length, need: 1, prog: function(){ return 'take one full exam'; } },
      { icon: 'star', label: '90%+ exam', have: bestExam, need: 90, prog: function(n){ return n ? 'best ' + n + '%' : 'score 90% on a full exam'; } },
      { icon: 'stack', label: '500 questions', have: allTotal, need: 500, prog: function(n){ return n.toLocaleString() + ' so far'; } },
      { icon: 'L10', label: 'Level 10', have: lvl, need: 10, prog: function(n){ return plural(10 - n, 'level') + ' away'; } }
    ];
    var earnedN = badgeDefs.filter(function(b){ return b.have >= b.need; }).length;
    var atTop = levels[4] + levels[5];
    var record = {
      stats: [
        { label: 'Level', big: 'Level ' + info.level, sub: '&middot; ' + Number(info.toNext).toLocaleString() + ' XP to ' + (info.level + 1), bar: info.into / info.span },
        { label: 'Memory', big: plural(totalTracked, 'question'), sub: totalTracked ? 'tracked, ' + atTop + ' at the top two levels' : 'tracked so far' },
        { label: 'Answered', big: allTotal.toLocaleString(), sub: 'in every mode &middot; ' + earnedN + ' of ' + badgeDefs.length + ' badges' }
      ],
      badges: badgeDefs.map(function(b){ var e = b.have >= b.need; return { icon: b.icon, label: b.label, earned: e, sub: e ? 'earned' : b.prog(Math.min(b.have, b.need)) }; }),
      next: bestExam >= GOAL ? { text: 'Certificate earned: a full exam at ' + GOAL + '% or higher.', sub: 'Your best is ' + bestExam + '%.', href: '#d5Milestones', cta: 'See it' }
        : { text: 'Next certificate: a full exam at ' + GOAL + '%.', sub: history.length ? 'You are ' + (GOAL - bestExam) + ' points off with ' + bestExam + '%.' : 'Take a full timed exam to start.', href: '#d5Milestones', cta: 'See milestones' },
      more: [
        { label: 'Level and topic badges', html: '<div id="levelBox"></div>' },
        { label: 'Study streak, the last 14 days', html: '<div id="streakBox"></div>' },
        { label: 'Review queue and mastery levels', html: '<div id="masteryBox"></div>' },
        { label: 'Badges', html: '<div id="badgeGrid"></div>' },
        { label: 'Milestones and certificates', html: '<div id="levlMilestones"></div>', id: 'd5Milestones' }
      ]
    };

    var status = isNew ? 'start anywhere, this page fills in as you answer'
      : canReady && R.available ? (R.value >= GOAL ? 'on track, and holding' : (GOAL - R.value) + ' points from on track' + (rising ? ', and climbing' : ''))
      : overallPct !== null ? overallPct + '% across ' + plural(allTotal, 'answer') + (rising ? ', and climbing' : '') : null;

    D.render(root, { now: now, progress: progress, ready: ready, focus: focus, record: record,
      band: { status: status, level: { level: info.level, title: info.title, toNext: info.toNext } }, foot: { account: '../account.html', backup: '../privacy.html#backup', premium: '../premium.html' } });

    // ---- the older panels, drawn into their drawers by the code that always drew them ----
    function accRow(d, s, sub, param){
      var v = s && s.total ? s.correct / s.total : 0;
      return H.row({ label: d, value: v, text: s && s.total ? Math.round(v * 100) + '%' : null, tier: H.tier(v, s && s.total),
        note: [s && s.total ? s.correct + ' of ' + s.total + ' right' : '', sub || '', s && s.total && s.correct < s.total ? notesLink(d) : ''].filter(Boolean).join(' &middot; '),
        action: { href: 'practice.html?' + param + '=' + encodeURIComponent(d), label: 'Practice' } });
    }
    set('topicBox', H.panel({ id: 'nr-topics', title: 'Topic areas', hint: 'Six study areas, grouped by body system the way the notes are. Every mode counts, weakest first. Always free. They are not the exam&rsquo;s five domains.',
      body: topicRows.slice().sort(function(a, b){ return (a.acc === null ? 2 : a.acc) - (b.acc === null ? 2 : b.acc); }).map(function(r){ return accRow(r.d, domainStats[r.d], '', 'system'); }).join('') }));
    if(canReady){
      var attempted = EXAM_DOMAINS.filter(function(x){ return examDomainStats[x.d] && examDomainStats[x.d].total > 0; });
      set('domainBox', H.panel({ id: 'nr-domains', title: 'The five 2025 exam domains ' + G.badge(),
        hint: 'The five domains of the National Registry&rsquo;s EMT exam launched 7 April 2025, with each one&rsquo;s share of the exam. Practice exams here draw questions in the same proportions.',
        body: (attempted.length ? '' : '<p class="cx-emptynote">Answer questions in any mode to see your accuracy by exam domain.</p>') + EXAM_DOMAINS.map(function(x){ return accRow(x.d, examDomainStats[x.d], x.band + ' of the exam', 'domain'); }).join('') }));
      if(R.available){
        var subParts = ['Recent average ' + R.weightedAvg + '% across ' + plural(R.attempts, 'full exam')];
        if(R.weakestDomain) subParts.push('weakest area: ' + R.weakestDomain + ' (' + R.weakestPct + '%)');
        set('readinessBox', H.panel({ id: 'nr-ready', title: 'Readiness estimate ' + G.badge(),
          body: H.row({ label: subParts.join(' &middot; '), value: R.value / 100, text: R.value + '/100', tier: { label: R.label, lvl: R.lvl } }) +
            '<p class="cx-hint" style="margin:8px 0 0">' + (R.lowConfidence ? 'Based on very few attempts, so take a few more full exams for a steadier number. ' : '') +
            'A 0 to 100 readiness scale from your own full exam scores, recent ones weighted more, lowered when one area lags your average by more than 15 points. It is not calibrated against real NREMT results and is not a chance of passing.</p>' }));
      }
    }
    if(totalTracked){
      var maxLevel = Math.max.apply(null, [1].concat(levels));
      set('masteryBox', H.panel({ id: 'nr-mastery', title: 'Mastery and review queue', hint: 'Each question you have seen, by its level (0 to 5). A level drops by one for every four days it goes unseen.',
        body: '<div class="progress-stats"><span>Questions tracked: <b>' + totalTracked + '</b></span><span>Due for review: <b>' + dueCount + '</b></span><span>Missed queue: <b>' + missedCount + '</b></span></div>' +
          '<div class="mastery-bars">' + levels.map(function(c, l){ return '<div class="mastery-bar" style="height:' + Math.max(2, c / maxLevel * 70) + 'px"><span>L' + l + '</span></div>'; }).join('') + '</div>' +
          '<div class="cx-actions"><a class="btn-press sm" href="review.html">Start review</a><a class="btn-outline" href="practice.html" style="padding:11px 20px;font-size:13.5px">Weak-spot practice</a></div>' }));
    } else set('masteryBox', '<p class="cx-emptynote">Questions you answer are tracked here by level, 0 to 5.</p>');
    if(history.length){
      var fmt = function(ts){ var d = new Date(ts), n = new Date(), days = Math.floor((n.setHours(0, 0, 0, 0) - new Date(ts).setHours(0, 0, 0, 0)) / 86400000);
        return days === 0 ? 'Today' : days === 1 ? 'Yesterday' : days < 7 ? days + ' days ago' : d.toLocaleDateString(); };
      set('activityBox', H.panel({ id: 'nr-activity', title: 'Recent exams', body: history.slice(-6).reverse().map(function(x){
        var r2 = x.score / x.total;
        return H.row({ label: x.total + '-question exam', value: r2, text: Math.round(r2 * 100) + '%', note: fmt(x.date) + ' &middot; ' + x.score + '/' + x.total + ' correct' + (x.timeMs ? ' &middot; ' + Math.round(x.timeMs / 60000) + ' min' : '') });
      }).join('') }));
      var pcts = history.map(function(x){ return Math.round(x.score / x.total * 100); });
      var avg = Math.round(pcts.reduce(function(a, b){ return a + b; }, 0) / pcts.length);
      set('historyBox', H.panel({ id: 'nr-history', title: 'Score over time', hint: 'Every full timed exam you have finished, oldest first: the diamonds on the chart above.',
        body: '<p class="db-figs"><span><b>' + avg + '%</b>average</span><span><b>' + Math.max.apply(null, pcts) + '%</b>best</span><span><b>' + history.length + '</b>' + (history.length === 1 ? 'exam' : 'exams') + '</span></p>' }));
    }
    var DOMAIN_TIER_LABELS = ['', 'Proficient', 'Advanced', 'Mastered'];
    var tiers = HP ? (HP.badges('nremt').domainTiers || {}) : (readJSON('nremt_xp', { domainTiers: {} }).domainTiers || {});
    var chips = Object.keys(tiers).filter(function(d){ return tiers[d] > 0; }).map(function(d){ return d + ' · ' + DOMAIN_TIER_LABELS[Math.min(tiers[d], 3)]; });
    var mine = (info.subjects || {}).nremt || 0;
    set('levelBox', H.level(info, { xpLine: mine.toLocaleString() + ' XP earned in NREMT &middot; ' + Number(info.total).toLocaleString() + ' site-wide',
      sub: [H.streakLine(st)].concat(chips.length ? [] : ['Answer 20+ questions in a topic area at 70% accuracy to earn your first topic badge.']), chips: chips }));
    (function(){
      var counts = Object.keys(st.days || {}).reduce(function(acc, k){ var day = st.days[k] || {}; acc[k] = Object.keys(day).reduce(function(n, s){ return n + (day[s] || 0); }, 0); return acc; }, {});
      var todayKey = dayKey(0), DOW = ['S', 'M', 'T', 'W', 'T', 'F', 'S'], html = '', studied = 0;
      for(var i = 13; i >= 0; i--){
        var d = new Date(); d.setDate(d.getDate() - i);
        var k = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
        var done = (counts[k] || 0) > 0; if(done) studied++;
        html += '<div class="cal-day' + (done ? ' done' : '') + (k === todayKey ? ' today' : '') + '" title="' + k + (done ? ', ' + counts[k] + ' questions studied' : '') + '">' + DOW[d.getDay()] + '</div>';
      }
      set('streakBox', H.panel({ id: 'nr-cal', title: st.current ? st.current + '-day streak' : 'Study streak',
        body: '<div class="cal-grid">' + html + '</div><p class="cx-hint" style="margin:12px 0 0">' + studied + ' of 14 days studied &middot; today ' + (counts[todayKey] || 0) + ' of ' + st.goal + (st.freezes ? ' &middot; ' + plural(st.freezes, 'freeze') + ' saved: it covers one missed day' : '') + '</p>' }));
    })();
    var EMOJI = { '7-day streak': '🎖️', '30-day streak': '🔥', 'First exam': '🚑', '90%+ exam': '💯', '500 questions': '📚', 'Level 10': '🏅' };
    set('badgeGrid', H.badges(badgeDefs.map(function(b){
      var e = b.have >= b.need, p = b.prog(Math.min(b.have, b.need));
      return { icon: EMOJI[b.label], label: b.label, earned: e, prog: e ? 'Earned' : p.charAt(0).toUpperCase() + p.slice(1), aria: b.label + ': ' + (e ? 'earned' : 'not yet. ' + p) };
    })));
    if(window.LevlLazy) window.LevlLazy('milestones', function(M){ M.renderList(document.getElementById('levlMilestones'), 'nremt'); });
    if(ED) ED.mount(document.getElementById('examDateCard'), {
      subject: 'nremt', links: { review: 'review.html', exams: 'exams.html' },
      target: function(days){
        if(!bank) return { n: st.goal || 15, unit: 'questions', one: 'question', why: 'is your daily goal' };
        if(!unseen) return { done: 'You have answered every question in the bank. Days from here are for Review and timed exams.' };
        return { n: Math.ceil(unseen / days), unit: 'new questions', one: 'new question', why: 'covers the ' + unseen.toLocaleString() + ' you have not answered yet, plus whatever Review has due' };
      }
    });
  }

  // Premium's onChange draws once now and again whenever a pass is bought or found (assets/premium.js).
  G.onChange(function(){ draw(); });
  // A cross-course suggestion (assets/cross-course.js), once a finished session has recorded a milestone.
  var cx = document.querySelector('[data-levl-cross]');
  if(cx && window.LevlLazy && /"m":\{"/.test(localStorage.getItem('levlprep_cross') || '')) window.LevlLazy('cross-course', function(X){ X.offer(cx, 'nremt'); });
  // Another tab answering questions, or a sync, redraws.
  window.addEventListener('storage', function(e){ if(!e.key || /^nremt_|^hub_/.test(e.key)) draw(); });
})();
