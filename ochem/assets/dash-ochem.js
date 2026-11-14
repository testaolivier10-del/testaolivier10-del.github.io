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
  // A missed or flagged question counts as a start too: the page must not say "nothing here yet" over a
  // missed list (consistency audit 2026-11, B2).
  var missedN = M.mistakes ? M.mistakes({ limit: 999 }).length : 0;
  var flaggedN = window.OchemFlags ? window.OchemFlags.count() : (function(){ try{ return Object.keys(JSON.parse(localStorage.getItem('ochem_flagged_v1') || '{}') || {}).length; }catch(e){ return 0; } })();
  var isNew = !touched.length && !missedN && !flaggedN;
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

  // ---------------------------------------------------------------- Progress option 2 (docs/progress-profile.md)
  var ov = M.overall();
  var facts = [{ big: examIso ? D.shortDate(examT) : 'Set date', label: examIso ? 'exam day, ' + plural(daysLeft, 'day') + ' left' : 'your exam day, for a countdown', button: 'examDateCard' }];
  if(ov) facts.push({ big: pct(ov.value) + '%', label: 'strength across the ' + plural(ov.touched, 'concept') + ' you have tried' });
  if(daysLeft !== null && notSolidAll) facts.push({ big: Math.ceil(notSolidAll / Math.max(1, daysLeft)) + ' a day', label: 'concepts to Solid covers the rest' });
  var ready = { value: isNew ? null : coverage, unit: '%', label: 'of the concepts at Solid', facts: facts, slot: 'examDateCard',
    empty: 'Every concept you bring to Solid fills this in. Start with a lesson or a few practice questions.',
    scale: { zones: false, lo: '0%', hi: '100%' },
    explain: '<b>' + coverage + '%</b> of the course&rsquo;s ' + total + ' concepts are at Solid or better. Strength comes from the concepts each question tests and fades if you stop practising; Solid starts at 70%.',
    foot: 'Every concept counts once. Not a grade prediction.' };
  ready.onSlot = function(){
    if(ED) ED.mount(document.getElementById('examDateCard'), {
      subject: 'ochem', links: { review: 'review.html', exams: 'exams.html' },
      target: function(days){
        if(!notSolidAll) return { done: 'Every concept is solid or mastered. Keep the review queue clear and take a timed exam.' };
        return { n: Math.ceil(notSolidAll / days), unit: notSolidAll === 1 ? 'concept' : 'concepts', why: 'to solid covers the ' + notSolidAll + ' that are not there yet' };
      }
    });
  };
  var progress = { weeks: weeks, exams: hist.map(function(e){ return { t: e.ts, pct: Math.round(e.right / e.total * 100) }; }), examWord: 'exams', firstExamWord: 'first exam',
    examDate: examT ? { t: examT } : null, allHref: hist.length ? 'exams.html' : null, allText: 'Exams',
    recent: hist.slice(-3).reverse().map(function(e){ return { big: Math.round(e.right / e.total * 100) + '%', sub: D.shortDate(e.ts) + ' &middot; ' + e.total + ' questions' }; }),
    empty: isNew ? 'Your line starts with your first answers.' : 'Your weekly line starts now: each week with 5 or more answers adds a point.' };

  function tierOf(v){ return v >= SOLID ? 'ok' : v >= 0.45 ? 'mid' : ''; }
  var cstarted = chapters.filter(function(c){ return c.started; }), cnot = chapters.filter(function(c){ return !c.started; });
  var crows = cstarted.slice().sort(function(a, b){ return b.notSolid - a.notSolid; }).map(function(c){
    var wk = M.weakest(50, 1).filter(function(p){ var lt = CN.lessonTopicFor(p.id); return lt && chapterOf[lt.id] === c.id; })[0];
    var gain = Math.round(c.notSolid / total * 100);
    return { name: c.n + '. ' + c.title, pct: pct(c.strength), word: 'strength', weak: wk ? { name: wk.concept.title, pct: pct(wk.strength), href: 'practice.html?concept=' + wk.id } : null,
      cost: !c.concepts ? 'its concepts are taught in other chapters' : c.notSolid ? plural(c.notSolid, 'concept') + ' not yet Solid' : 'all Solid', bar: c.strength || 0, tier: tierOf(c.strength || 0),
      gain: gain >= 1 ? '+' + gain + '%' : '', href: c.practice, cta: 'Practice chapter ' + c.n };
  });
  if(cnot.length){
    var nx = cnot[0];
    crows.push({ name: cnot.length > 1 ? plural(cnot.length, 'chapter').replace(/^./, function(x){ return x.toUpperCase(); }) + ' not started yet' : nx.n + '. ' + nx.title, off: true,
      sub: cnot.length > 1 ? 'next in order: ' + nx.n + '. ' + esc(nx.title) : 'not started yet', href: (nx.topics[0] && nx.topics[0].href) || 'learn.html', cta: 'Start chapter ' + nx.n });
  }
  var conceptRows = M.weakest(12, 2).map(function(p){
    var lt = CN.lessonTopicFor(p.id);
    return { name: p.concept.title, pct: pct(p.strength), word: 'strength', cost: p.correct + '/' + p.attempts + ' right' + (p.isDue ? ' &middot; due now' : '') + (lt ? ' &middot; taught in ' + esc(lt.title) : ''),
      bar: p.strength || 0, tier: tierOf(p.strength || 0), href: 'practice.html?concept=' + p.id, cta: 'Drill', links: lt && lt.href ? [{ href: lt.href, label: 'Lesson' }] : [] };
  });
  var pill = locked ? ' <span class="premium-badge">Premium</span>' : '';
  // Gap detection and concept families are Premium, drawn by mastery-page.js into these slots (ochem-premium.js
  // hides them and draws what Premium adds into #ocPremium when locked).
  var gapsView = { label: 'Gaps underneath', badge: pill, html: '<div id="leechAlerts"></div><div id="dependencyAlerts"></div><p class="d5-empty" id="d5OcNoGaps" hidden>Nothing benched, and no gap found underneath a weak concept.</p><div id="recRow"></div>' + (locked ? '<div id="ocPremium"></div>' : '') };
  var famView = { label: 'Concept families', badge: pill, html: '<div id="familyStats"></div>' + (locked ? '<p class="d5-empty">Strength by concept family comes with Premium.</p>' : '') };
  var focus = { note: cstarted.length ? 'Ranked by how many concepts in each chapter are not Solid yet &middot; <b class="d5-gain">+</b> is what bringing it to Solid adds to the number above' : '',
    views: [{ label: 'Chapters', rows: cstarted.length ? crows : [], empty: 'Answer a few questions and your chapters line up here, the most expensive first.' },
      { label: 'Weakest concepts', rows: conceptRows, empty: 'Concepts you have tried twice or more show up here, weakest first.' }, gapsView, famView] };

  var status = isNew ? 'start anywhere, this page fills in as you answer' : coverage + '% of the concepts at Solid' + (rising ? ', and climbing' : '');
  D.render(root, { progress: progress, ready: ready, focus: focus,
    band: { status: status, level: info ? { level: info.level } : null, streak: st ? st.current : 0 } });

  // mastery-page.js fills the gap slots after this; say so when it found nothing.
  document.addEventListener('DOMContentLoaded', function(){
    var a = document.getElementById('leechAlerts'), b = document.getElementById('dependencyAlerts'), n = document.getElementById('d5OcNoGaps');
    if(n && a && b && !a.innerHTML.trim() && !b.innerHTML.trim() && !locked) n.hidden = false;
  });
  var cx = document.querySelector('[data-levl-cross]');
  if(cx && window.LevlLazy && /"m":\{"/.test(localStorage.getItem('levlprep_cross') || '')) window.LevlLazy('cross-course', function(X){ X.offer(cx, 'ochem'); });
})();
