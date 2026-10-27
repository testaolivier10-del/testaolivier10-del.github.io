/* The Organic Chemistry dashboard (ochem/dashboard.html, docs/dashboard.md): the five questions of
   assets/course/dash.js, built from the concept model (mastery-engine.js), the lesson curriculum, the exam
   history (ochem_exam_history_v1) and ochem-xp.js. It runs before mastery-page.js and game-panel.js, which still
   draw every panel this page had (Daily Rounds, review debt, benched concepts, prerequisite gaps, weakest concepts,
   mastery by chapter, concept families, level, concept badges, achievements) into the drawers it leaves for them,
   by the same ids, so their Premium locks (ochem-premium.js) still apply.

   Strength bands are the engine's (Solid is 0.70). The readiness question is answered with the share of the
   course's concepts at Solid or better; a chapter's cost is how many of its concepts are not there yet.
   Recommendations built on the gap detection stay Premium, as before: without a pass, "what to do now" is Daily
   Rounds, review and the next lesson, never a pick from the gap detector. */
(function(){
  var D = window.LevlDash, H = window.LevlHub, M = window.OchemMastery, C = window.OchemCurriculum, CN = window.OchemConcepts;
  var XP = window.OchemXP, HP = window.HubProgress, root = document.getElementById('d5Root');
  if(!D || !H || !M || !C || !CN || !root) return;
  var esc = H.esc, plural = H.plural;
  function pct(v){ return Math.round((v || 0) * 100); }
  var SOLID = 0.70;
  var G = window.OchemPremium, locked = !!(G && G.locked && G.locked());

  var profiles = M.allProfiles(), byId = {};
  profiles.forEach(function(p){ byId[p.id] = p; });
  var touched = profiles.filter(function(p){ return p.attempts > 0; });
  var isNew = !touched.length;
  var counts = M.counts(), total = profiles.length || 1;
  var coverage = Math.round(((counts.solid || 0) + (counts.mastered || 0)) / total * 100);
  var dueNow = M.due(200);
  var st = HP ? HP.streak() : null, info = HP ? HP.levelInfo('ochem') : null;
  var quest = XP && XP.quest ? XP.quest() : null, debt = XP && XP.reviewDebt ? XP.reviewDebt() : null;
  var lessonTopics = [];
  C.MODULES.forEach(function(m){ m.topics.forEach(function(t){ if(C.hasLesson(t)) lessonTopics.push(t); }); });

  // Chapters: the concepts each one teaches, how many are Solid, and the weakest lesson topic to practise. Concepts
  // are shared between topics, so each counts once, in the chapter of the lesson that teaches it
  // (OchemConcepts.lessonTopicFor), and the chapters' gaps add up to the course's.
  var chapterOf = {};
  C.MODULES.forEach(function(m){ m.topics.forEach(function(t){ chapterOf[t.id] = m.id; }); });
  var owned = {};
  profiles.forEach(function(p){ var lt = CN.lessonTopicFor(p.id), ch = lt && chapterOf[lt.id]; if(ch) (owned[ch] = owned[ch] || []).push(p); });
  var chapters = C.MODULES.map(function(m, i){
    var ts = m.topics.filter(function(t){ return C.hasLesson(t); });
    var cs = owned[m.id] || [];
    var r = M.topicsStrength(ts.map(function(t){ return t.id; }));
    var started = ts.filter(function(t){ return M.topicStrength(t.id).strength !== null; });
    var weakT = started.slice().sort(function(a, b){ return M.topicStrength(a.id).strength - M.topicStrength(b.id).strength; })[0] || ts[0];
    var notSolid = cs.filter(function(p){ return p.strength === null || p.strength < SOLID; }).length;
    return { n: i + 1, id: m.id, title: m.title, topics: ts, concepts: cs.length, notSolid: notSolid, strength: r.strength, started: started.length > 0, practice: weakT ? 'practice.html?topic=' + weakT.id : 'practice.html' };
  }).filter(function(c){ return c.topics.length; });

  // ---- exam date ----
  var ED = window.LevlExamDate, examIso = ED ? ED.read('ochem') : null, daysLeft = examIso ? ED.daysUntil(examIso) : null, examT = null;
  if(examIso && daysLeft >= 0){ var pp = examIso.split('-').map(Number); examT = new Date(pp[0], pp[1] - 1, pp[2]).getTime(); } else { examIso = null; daysLeft = null; }
  var notSolidAll = profiles.filter(function(p){ return p.strength === null || p.strength < SOLID; }).length;
  var weeks = D.dailyWeeks('ochem');
  var rising = weeks.length >= 2 && weeks[weeks.length - 1].pct - weeks[0].pct >= 3;
  var hist = []; try{ hist = JSON.parse(localStorage.getItem('ochem_exam_history_v1') || '[]') || []; }catch(e){}
  hist = Array.isArray(hist) ? hist.filter(function(e){ return e && e.total >= 5; }) : [];

  // ---------------------------------------------------------------- 1 now
  var today = st ? { streak: st.current, count: st.todayCount, goal: st.goal, freezes: st.freezes || 0 } : {};
  var Rem = window.LevlReminders;
  if(Rem && Rem.configured && Rem.configured()){ var rs = Rem.settings ? Rem.settings() : null; today.reminder = { text: rs && rs.subscribed ? 'Reminders on' : 'Get a daily reminder', href: '../privacy.html#reminders' }; }
  var nextNew = lessonTopics.filter(function(t){ return M.topicStrength(t.id).strength === null; })[0];
  var now;
  if(isNew){
    var firstLesson = lessonTopics[0];
    now = { title: 'Nothing here yet, so start <span>here.</span>', body: 'Every question you answer, in a lesson or in Practice, updates the strength of the concepts it tests.',
      steps: [firstLesson ? '<a href="' + esc(firstLesson.href) + '">Start the first lesson: ' + esc(firstLesson.title) + '</a>.' : '', 'Or read any chapter in <a href="learn.html">the textbook</a>.', 'Warm up with <a href="flashcards.html">flashcards</a> or try a <a href="tools.html">tool</a>.'].filter(Boolean), today: today };
  } else {
    var acts = [];
    if(quest && quest.done < quest.target) acts.push({ title: 'Do today&rsquo;s <span>Daily Rounds</span>.', body: plural(quest.target - quest.done, 'question') + ' to go, from what is due today' + (dueNow.length ? ' (' + plural(dueNow.length, 'concept') + ' due in all)' : '') + '. Strength fades unless you come back to it; Rounds is the short way back.',
      href: 'review.html', cta: 'Start Rounds', then: 'Finish today&rsquo;s Rounds' });
    else if(dueNow.length) acts.push({ title: 'Review the <span>' + plural(dueNow.length, 'concept') + '</span> due.', body: 'Scheduled by how shaky each was, not by date.' + (debt && debt.worstDays > 0 ? ' The oldest is ' + plural(debt.worstDays, 'day') + ' past due.' : ''), href: 'review.html', cta: 'Start review', then: 'Then review the ' + plural(dueNow.length, 'concept') + ' due' });
    if(!locked){
      var weakest = M.weakest(1, 2)[0];
      if(weakest) acts.push({ title: 'Drill <span>' + esc(weakest.concept.title) + '</span>.', body: 'Your weakest concept, at ' + pct(weakest.strength) + '%.', href: 'practice.html?concept=' + weakest.id, cta: 'Drill it', then: 'Then drill ' + esc(weakest.concept.title) + ', your weakest concept' });
    }
    if(nextNew) acts.push({ title: 'Start <span>' + esc(nextNew.title) + '</span>.', body: 'The next lesson in course order that you have not started.', href: nextNew.href, cta: 'Start the lesson', then: 'Then start the next lesson: ' + esc(nextNew.title) });
    if(!acts.length) acts.push({ title: 'Keep it fresh: <span>a mixed set.</span>', body: 'Nothing is due. A mixed set keeps every concept you have learned in reach.', href: 'practice.html?mode=mixed', cta: 'Practice', then: 'Then a mixed set' });
    now = { title: acts[0].title, body: acts[0].body, href: acts[0].href, cta: acts[0].cta, today: today,
      then: acts.slice(1, 3).map(function(a){ return { text: a.then, href: a.href, cta: 'Go' }; }) };
  }

  // ---------------------------------------------------------------- 2 progress
  var ov = M.overall();
  var progress = { weeks: weeks, exams: hist.map(function(e){ return { t: e.ts, pct: Math.round(e.right / e.total * 100) }; }), examWord: 'exams', firstExamWord: 'first exam',
    sub: ov ? 'Overall strength across the ' + plural(ov.touched, 'concept') + ' you have tried: ' + pct(ov.value) + '%.' : '',
    examDate: examT ? { t: examT } : null, allHref: hist.length ? 'exams.html' : null, allText: 'Exams',
    empty: isNew ? 'Your line starts with your first answers.' : 'Your weekly line starts now: each week with 5 or more answers adds a point.' };

  // ---------------------------------------------------------------- 3 ready
  var ready = { title: examIso ? 'Will I be ready by <span>' + esc(D.shortDate(examT)) + '?</span>' : 'How much is <span>solid?</span>', kicker: examIso ? 'exam day' : 'readiness',
    big: coverage + '%', bigSub: ' of the concepts at Solid',
    note: coverage >= 100 ? 'All of them. Keep Rounds going.' : isNew ? 'Every concept you bring to Solid fills this in.' : (100 - coverage) + '% to go' + (daysLeft !== null ? ', with ' + plural(daysLeft, 'day') + ' left.' : '.'),
    scale: { value: coverage, goal: null, lo: '0%', hi: '100%', aria: coverage + '% of the ' + total + ' concepts are at Solid or better.' },
    side: daysLeft !== null ? plural(daysLeft, 'day') + ' left' + (notSolidAll ? '<br>about ' + Math.ceil(notSolidAll / Math.max(1, daysLeft)) + ' concepts a day to Solid covers the rest' : '') : 'No exam date yet. <a href="#d5ExamDate">Set one</a>',
    gapTitle: 'What closes the gap', gap: [],
    foot: 'Strength comes from the concepts each question tests and fades if you stop practising. Solid starts at 70%.',
    more: [{ label: daysLeft === null ? 'Set your exam date' : 'Exam date and daily target', html: '<div id="examDateCard"></div>', open: daysLeft === null && !isNew, id: 'd5ExamDate' }] };
  var under = chapters.filter(function(c){ return c.started && c.notSolid; }).sort(function(a, b){ return b.notSolid - a.notSolid; }).slice(0, 2);
  var nextCh = chapters.filter(function(c){ return !c.started; })[0];
  under.concat(nextCh ? [nextCh] : []).forEach(function(c){
    var gain = Math.round(c.notSolid / total * 100);
    if(gain > 0) ready.gap.push({ text: 'Bring chapter ' + c.n + ', ' + esc(c.title) + ', to Solid' + (c.started ? ' (' + pct(c.strength) + '% now)' : ' (next in order, not started)'), value: '+' + gain + '%', href: c.started ? c.practice : (c.topics[0] && c.topics[0].href) || 'learn.html' });
  });
  if(!ready.gap.length) delete ready.gap;

  // ---------------------------------------------------------------- 4 focus
  var cstarted = chapters.filter(function(c){ return c.started; }), cnot = chapters.filter(function(c){ return !c.started; });
  var maxNS = Math.max.apply(null, [1].concat(cstarted.map(function(c){ return c.notSolid; })));
  var crows = cstarted.slice().sort(function(a, b){ return b.notSolid - a.notSolid; }).concat(cnot.slice(0, 1)).map(function(c){
    if(!c.started) return { icon: String(c.n), name: c.n + '. ' + c.title, sub: 'next in order, not started &middot; ' + plural(c.concepts, 'concept'), bar: 0, cost: '', href: (c.topics[0] && c.topics[0].href) || 'learn.html', cta: 'Start' };
    return { icon: String(c.n), warm: c.strength < 0.45, name: c.n + '. ' + c.title, sub: pct(c.strength) + '% strength &middot; ' + plural(c.concepts, 'concept'), bar: c.notSolid / maxNS,
      cost: !c.concepts ? 'its concepts are taught in other chapters' : c.notSolid ? plural(c.notSolid, 'concept') + ' not yet Solid' : 'all Solid', href: c.practice, cta: 'Practice' };
  });
  var weakList = M.weakest(8, 2);
  var conceptRows = weakList.map(function(p){
    var lt = CN.lessonTopicFor(p.id);
    return { icon: '', warm: (p.strength || 0) < 0.45, name: p.concept.title, sub: pct(p.strength) + '% strength &middot; ' + p.correct + '/' + p.attempts + ' right', bar: 1 - (p.strength || 0),
      cost: p.isDue ? 'due now' : (lt ? 'taught in ' + esc(lt.title) : ''), href: 'practice.html?concept=' + p.id, cta: 'Drill' };
  });
  var focus = { intro: 'Sorted by how many concepts in each chapter are not Solid yet, not by its percent.',
    views: [{ label: 'Chapters', rows: cstarted.length ? crows : [], foot: cstarted.length && cnot.length > 1 ? plural(cnot.length - 1, 'more chapter') + ' not started yet. <a href="learn.html">See them all in the textbook</a>' : '', empty: 'Answer a few questions and your chapters line up here, the most expensive first.' },
      { label: 'Weakest concepts', rows: conceptRows, empty: 'Concepts you have tried twice or more show up here, weakest first.' }],
    more: [
      { label: 'Weakest concepts, in detail', html: '<div id="weakConcepts"></div>' },
      { label: 'Mastery by chapter and topic', html: '<div id="moduleStats"></div>' }
    ] };
  // Gap detection and families are Premium: open, they get drawers; locked, their slots stay for the lock to hide
  // (ochem-premium.js) and the Premium drawer below says what they are.
  var premiumSlots = '<div id="leechAlerts"></div><div id="dependencyAlerts"></div><p class="cx-emptynote" id="d5OcNoGaps" hidden>Nothing benched, and no gap found underneath a weak concept.</p>';
  if(!locked) focus.more.unshift({ label: 'Benched concepts and gaps underneath', html: premiumSlots });
  if(!locked) focus.more.push({ label: 'By concept family', html: '<div id="familyStats"></div>' });

  // ---------------------------------------------------------------- 5 record
  var ICON = { 'First session': 'check', 'Pushed the arrows': 'up', 'Daily Rounds': 'flame', '7 days of Rounds': 'flame', 'Flawless': 'star', '10 concepts solid': 'stack', '10 concepts mastered': 'stack', 'Nothing overdue': 'clock', 'Read the course': 'book' };
  var ach = XP && XP.achievements ? XP.achievements() : [];
  var nearest = profiles.filter(function(p){ return p.strength !== null && p.strength < SOLID && p.attempts > 0; }).sort(function(a, b){ return b.strength - a.strength; })[0];
  var record = {
    stats: [
      info ? { label: 'Level', big: 'Level ' + info.level, sub: '&middot; ' + Number(info.toNext).toLocaleString() + ' XP to ' + (info.level + 1), bar: info.into / info.span } : null,
      { label: 'Concepts', big: ((counts.solid || 0) + (counts.mastered || 0)) + ' of ' + total, sub: 'Solid or Mastered &middot; ' + (counts.mastered || 0) + ' Mastered' },
      { label: 'Work', big: plural(touched.length, 'concept'), sub: 'tried &middot; ' + lessonTopics.filter(function(t){ return M.topicStrength(t.id).strength !== null; }).length + ' of ' + lessonTopics.length + ' topics started' }
    ].filter(Boolean),
    badges: ach.map(function(a){ return { icon: ICON[a.label] || 'star', label: a.label, earned: a.earned, sub: a.earned ? 'earned' : a.blurb }; }),
    next: nearest ? { text: 'Next to reach Solid: ' + esc(nearest.concept.title) + '.', sub: 'It is at ' + pct(nearest.strength) + '%; Solid starts at 70%.', href: 'practice.html?concept=' + nearest.id, cta: 'Drill it' } : null,
    more: [
      { label: 'Daily Rounds and review debt', html: '<div id="gameRounds"></div><div id="gameDebt"></div>' },
      { label: 'Level and XP', html: '<div id="gameLevel"></div>' },
      { label: 'Concept badges', html: '<div id="gameConcepts"></div>' },
      { label: 'Achievements, in detail', html: '<div id="gameAchievements"></div>' },
      { label: 'Milestones and certificates', html: '<div id="levlMilestones"></div>' }
    ] };
  // What Premium adds here, drawn by ochem-premium.js after this slot when locked.
  focus.more.push({ label: locked ? 'Gap detection, concept families and recommendations (Premium)' : 'Suggestions from the gap detector', html: (locked ? '<div hidden>' + premiumSlots + '<div id="familyStats"></div></div>' : '') + '<div id="recRow"></div><div id="ocPremium"></div>', open: false });

  var status = isNew ? 'start anywhere, this page fills in as you answer' : coverage + '% of the concepts at Solid' + (rising ? ', and climbing' : '');
  D.render(root, { now: now, progress: progress, ready: ready, focus: focus, record: record,
    band: { status: status, level: info ? { level: info.level, title: info.title, toNext: info.toNext } : null } });

  // mastery-page.js fills the gap slots after this; say so when it found nothing.
  document.addEventListener('DOMContentLoaded', function(){
    var a = document.getElementById('leechAlerts'), b = document.getElementById('dependencyAlerts'), n = document.getElementById('d5OcNoGaps');
    if(n && a && b && !a.innerHTML.trim() && !b.innerHTML.trim() && !locked) n.hidden = false;
  });
  if(window.LevlLazy) window.LevlLazy('milestones', function(Ms){ Ms.renderList(document.getElementById('levlMilestones'), 'ochem'); });
  var cx = document.querySelector('[data-levl-cross]');
  if(cx && window.LevlLazy && /"m":\{"/.test(localStorage.getItem('levlprep_cross') || '')) window.LevlLazy('cross-course', function(X){ X.offer(cx, 'ochem'); });
  if(ED) ED.mount(document.getElementById('examDateCard'), {
    subject: 'ochem', links: { review: 'review.html', exams: 'exams.html' },
    target: function(days){
      if(!notSolidAll) return { done: 'Every concept is solid or mastered. Keep the review queue clear and take a timed exam.' };
      return { n: Math.ceil(notSolidAll / days), unit: notSolidAll === 1 ? 'concept' : 'concepts', why: 'to solid covers the ' + notSolidAll + ' that are not there yet' };
    }
  });
})();
