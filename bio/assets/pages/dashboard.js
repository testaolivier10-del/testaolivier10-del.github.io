/* The AP® Biology dashboard (forked from anatomy-physiology/assets/apps/
   mastery.js). Everything is read from ApBioCore, which computes it from the
   answer records in apbio_progress_v1, plus the site's shared XP and streak
   (HubProgress), the flashcard schedule (apbio_flashcards_v1) and the
   free-response self-scores and exam history in apbio_prefs_v1. Nothing is
   stored here except the exam-date default below.

   Free: overall, mastery by unit and topic, by science practice (the six),
   weakest topics with links to the exact lesson, FRQ self-scores, exam
   history, the exam-date card. Premium (ApBioCore.allowed('analytics')):
   the deeper analytics, mastery by skill (1.A, 4.B...), tool accuracy.

   Exam date: assets/exam-date.js has no per-course default, so on the first
   visit this page writes the exam date, Monday 3 May 2027, to
   apbio_exam_date (the key exam-date.js reads) and remembers in
   apbio_prefs_v1.examDateSeeded that it did, so a date the student clears
   or changes stays theirs. Every bar carries its number as text. */
(function(){
  var app = document.getElementById('app');
  var A = window.ApBioCore, CU = window.ApBioCurriculum;
  if(!app || !A || !CU) return;
  var BASE = window.ApBioBase || '';
  var PREFS = 'apbio_prefs_v1', EXAM_DATE = '2027-05-03';
  var FRQ_TYPES = { iee: 'Experimental results (long)', 'iee-graph': 'Experimental results, graphing (long)', investigation: 'Scientific investigation', conceptual: 'Conceptual analysis', model: 'Analyze a model', data: 'Analyze data' };

  function esc(s){ return String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
  function pct(v){ return Math.round((v || 0) * 100); }
  function plural(n, w, ws){ return n + ' ' + (n === 1 ? w : (ws || w + 's')); }
  function tier(v, answered){ if(!answered) return 'Not started'; if(v >= 0.85) return 'Mastered'; if(v >= 0.6) return 'Strong'; if(v >= 0.3) return 'Developing'; return 'Learning'; }
  function prefs(){ try{ return JSON.parse(localStorage.getItem(PREFS) || '{}') || {}; }catch(e){ return {}; } }
  var TOPIC = {}, UNIT = {};
  CU.topics.forEach(function(t){ TOPIC[t.id] = t; });
  CU.units.forEach(function(u){ UNIT[u.id] = u; });
  var built = CU.topics.filter(function(t){ return t.built; });
  function unitName(u){ var c = UNIT[u]; return c ? (c.part === 'course' ? 'Unit ' + c.n + ': ' : '') + c.title : u; }

  (function seedExamDate(){
    try{
      var p = prefs();
      if(p.examDateSeeded) return;
      if(!localStorage.getItem('apbio_exam_date') && new Date(EXAM_DATE + 'T12:00:00') > new Date()) localStorage.setItem('apbio_exam_date', EXAM_DATE);
      p.examDateSeeded = true;
      localStorage.setItem(PREFS, JSON.stringify(p));
    }catch(e){}
  })();

  function bar(o){
    var p = pct(o.value);
    return '<div class="bio-db-row"><div class="bio-db-row-top"><span class="bio-db-name">' + (o.href ? '<a href="' + esc(o.href) + '">' + esc(o.label) + '</a>' : esc(o.label)) + '</span>' +
      '<span class="bio-db-val"><b>' + (o.text || p + '%') + '</b>' + (o.tier ? ' <span class="bio-db-tier">' + esc(o.tier) + '</span>' : '') + '</span></div>' +
      '<div class="track thin bio-db-track" aria-hidden="true"><i style="width:' + Math.max(o.value > 0 ? 2 : 0, p) + '%"></i></div>' +
      ((o.note || o.action) ? '<div class="bio-db-row-foot">' + (o.note ? '<span>' + o.note + '</span>' : '<span></span>') + (o.action || '') + '</div>' : '') + '</div>';
  }
  function action(href, label){ return '<a class="bio-db-go" href="' + esc(href) + '">' + esc(label) + '</a>'; }
  function stat(value, label, sub){ return '<div class="stat-card bio-db-stat"><div class="v">' + value + '</div><div class="l">' + esc(label) + '</div>' + (sub ? '<div class="bio-db-stat-sub">' + sub + '</div>' : '') + '</div>'; }
  function flashDue(){
    try{
      var d = JSON.parse(localStorage.getItem('apbio_flashcards_v1') || 'null');
      if(!d || !d.cards) return { due: 0 };
      var now = Date.now(), due = 0;
      Object.keys(d.cards).forEach(function(k){ var s = d.cards[k]; if(s && s.t && s.d <= now) due++; });
      return { due: due };
    }catch(e){ return { due: 0 }; }
  }
  /* Mastery per skill (4.B): Premium analytics. */
  function skills(){
    var d = A.load(), seen = {};
    Object.keys(d.q || {}).forEach(function(k){ var p = d.q[k].p; if(p && /\./.test(p)) seen[p] = 1; });
    return Object.keys(seen).sort().map(function(s){ var m = A.practiceMastery(s); return { id: s, value: m.value, answered: m.answered }; });
  }

  function render(){
    var store = A.load(), P = prefs();
    var answeredIds = Object.keys(store.q || {}), lessons = Object.keys(store.lessons || {});
    var overall = A.overallMastery(), reviewDue = A.reviewCount(), fc = flashDue();
    var HP = window.HubProgress, streak = HP ? HP.streak() : null;
    var started = built.filter(function(t){ return A.topicMastery(t.id).answered > 0; }).length;
    var isNew = !answeredIds.length && !lessons.length;
    var frqScores = P.frqScores || {}, exams = (P.examHistory || []).slice().reverse();
    var analytics = A.allowed('analytics'), pill = A.badge ? A.badge() : '';
    var html = '';

    html += '<div class="stat-row bio-db-stats">' +
      stat(isNew ? '0%' : pct(overall.value) + '%', 'Overall mastery', 'across ' + plural(overall.topics || built.length, 'published topic')) +
      stat(started + '<small> / ' + built.length + '</small>', 'Topics started', plural(lessons.length, 'lesson') + ' finished') +
      stat(reviewDue + fc.due, 'Due for review', plural(reviewDue, 'question') + ' &middot; ' + plural(fc.due, 'flashcard')) +
      stat(streak ? streak.current : 0, 'Day streak', streak ? (streak.metToday ? 'Today’s goal met' : streak.todayCount + ' of ' + streak.goal + ' today') : '') + '</div>';

    if(isNew){
      var first = built[0];
      html += '<section class="panel bio-db-empty" aria-labelledby="bio-db-empty-h"><h2 id="bio-db-empty-h">Your dashboard fills in as you study</h2>' +
        '<p>Every question you answer updates your mastery of its topic, its unit and its science practice. Nothing here yet, so here is where to start.</p><ol class="bio-db-steps">' +
        (first ? '<li><a href="' + esc(BASE + 'lessons/' + first.id + '.html') + '">Start the first lesson: ' + esc(first.title) + '</a>.</li>' : '') +
        '<li>Or open any unit from <a href="' + esc(BASE + 'learn.html') + '">the textbook</a>.</li><li>Warm up with <a href="' + esc(BASE + 'flashcards.html') + '">flashcards</a>.</li></ol></section>';
    }

    var weak = A.weakest(5);
    var steps = [];
    if(reviewDue) steps.push('<li><a href="' + esc(BASE + 'review.html') + '"><b>Review ' + plural(reviewDue, 'question') + '</b></a><span>Missed questions come back just before you would forget them.</span></li>');
    if(fc.due) steps.push('<li><a href="' + esc(BASE + 'flashcards.html') + '"><b>' + plural(fc.due, 'flashcard') + ' due</b></a><span>A few minutes keeps the terms fresh.</span></li>');
    if(weak[0] && weak[0].value < 0.6) steps.push('<li><a href="' + esc(BASE + 'lessons/' + weak[0].id + '.html') + '"><b>Reread ' + esc(weak[0].title) + '</b></a><span>Your weakest topic so far, at ' + pct(weak[0].value) + '%.</span></li>');
    var wp = A.weakestPractice(1)[0];
    if(wp && wp.value < 0.6) steps.push('<li><a href="' + esc(BASE + 'practice.html?practice=' + wp.id) + '"><b>Practice ' + wp.id + ': ' + esc(wp.name) + '</b></a><span>Your weakest science practice, at ' + pct(wp.value) + '%.</span></li>');
    if(steps.length && !isNew) html += '<section class="panel bio-db-next" aria-labelledby="bio-db-next-h"><h2 id="bio-db-next-h">Study next</h2><ul class="bio-db-nextlist">' + steps.slice(0, 4).join('') + '</ul></section>';

    html += '<div id="bioExamDate" class="bio-db-examdate"></div><div class="bio-db-grid"><div class="bio-db-col">';

    if(!isNew) html += '<section class="panel" aria-labelledby="bio-db-weak-h"><h2 id="bio-db-weak-h">Weakest topics</h2>' + (weak.length ? weak.map(function(w){
        return bar({ label: w.title, href: BASE + 'lessons/' + w.id + '.html', value: w.value, tier: tier(w.value, w.answered), note: plural(w.answered, 'item') + ' answered &middot; <a href="' + esc(BASE + 'notes/' + w.id + '.html') + '">notes</a>', action: action(BASE + 'practice.html?topic=' + encodeURIComponent(w.id), 'Practice') });
      }).join('') : '<p class="bio-db-emptynote">Answer a few questions and your weakest topics show up here.</p>') + '</section>';

    var units = CU.units.filter(function(u){ return built.some(function(t){ return t.unit === u.id; }); });
    html += '<section class="panel" aria-labelledby="bio-db-u-h"><h2 id="bio-db-u-h">Mastery by unit and topic</h2>' +
      '<p class="bio-db-hint">Mastery counts distinct questions you have right, weighted by level and fading slowly if you do not revisit them. Untouched topics count as zero.</p>' +
      (units.length ? units.map(function(u){
        var m = A.unitMastery(u.id), ts = built.filter(function(t){ return t.unit === u.id; });
        return '<details class="bio-db-ch"><summary>' + bar({ label: unitName(u.id), value: m.value, tier: tier(m.value, m.answered), note: ts.filter(function(t){ return A.topicMastery(t.id).answered; }).length + ' of ' + plural(ts.length, 'topic') + ' started' }) + '</summary><div class="bio-db-topics">' +
          ts.map(function(t){
            var tm = A.topicMastery(t.id);
            return bar({ label: (t.ced ? t.ced + ' ' : '') + t.title, href: BASE + 'lessons/' + t.id + '.html', value: tm.value, tier: tier(tm.value, tm.answered),
              note: tm.answered ? plural(tm.answered, 'item') + ' answered' : (store.lessons[t.id] ? 'Lesson finished' : 'Not started'), action: action(BASE + 'practice.html?topic=' + encodeURIComponent(t.id), 'Practice') });
          }).join('') + '</div></details>';
      }).join('') : '<p class="bio-db-emptynote">Units appear here as they are published.</p>') + '</section>';

    html += '<section class="panel" aria-labelledby="bio-db-ex-h"><h2 id="bio-db-ex-h">Exam history</h2>' + (exams.length ? '<ul class="bio-db-list">' + exams.slice(0, 8).map(function(x){
        return '<li><b>' + esc(x.label) + '</b> <span class="bio-small">' + esc(new Date(x.ts).toLocaleDateString()) + '</span><br>Multiple choice ' + x.mcq.c + '/' + x.mcq.n + ' (' + pct(x.mcq.n ? x.mcq.c / x.mcq.n : 0) + '%)' +
          (x.frq ? ' &middot; free response ' + x.frq.got + '/' + x.frq.of : '') + (x.band ? ' &middot; rough band ' + x.band + ' of 5 <span class="bio-small">(not calibrated)</span>' : '') + '</li>';
      }).join('') + '</ul>' : '<p class="bio-db-emptynote">No exams yet. <a href="' + esc(BASE + 'exams.html') + '">Take a unit test or a practice exam</a>.</p>') + '</section>';

    html += '</div><div class="bio-db-col">';

    html += '<section class="panel" aria-labelledby="bio-db-p-h"><h2 id="bio-db-p-h">Mastery by science practice</h2>' + (CU.practices || []).map(function(p){
        var m = A.practiceMastery(p.id);
        return bar({ label: p.id + '. ' + p.name, value: m.value, tier: tier(m.value, m.answered), note: m.answered ? plural(m.answered, 'item') + ' answered' : '', action: m.answered ? action(BASE + 'practice.html?practice=' + p.id, 'Practice') : '' });
      }).join('') + '</section>';

    var fids = Object.keys(frqScores).sort(function(a, b){ return (frqScores[b].ts || 0) - (frqScores[a].ts || 0); });
    html += '<section class="panel" aria-labelledby="bio-db-f-h"><h2 id="bio-db-f-h">Free-response self-scores</h2>' + (fids.length ? fids.slice(0, 8).map(function(id){
        var s = frqScores[id];
        return bar({ label: s.title || id, href: BASE + 'frq/' + id + '.html', value: s.of ? s.got / s.of : 0, text: s.got + '/' + s.of, note: esc(FRQ_TYPES[s.type] || '') + (s.tries > 1 ? ' &middot; best ' + s.best + ' over ' + s.tries + ' tries' : '') });
      }).join('') + '<p class="bio-small">Scores you gave yourself with the rubrics.</p>' : '<p class="bio-db-emptynote">Score a <a href="' + esc(BASE + 'frq.html') + '">free-response question</a> with its rubric and it shows up here.</p>') + '</section>';

    if(!analytics) html += A.gate('analytics', 'dashboard');
    else if(!isNew){
      var sk = skills();
      html += '<section class="panel" aria-labelledby="bio-db-s-h"><h2 id="bio-db-s-h">Mastery by skill' + pill + '</h2><p class="bio-db-hint">Each science practice splits into skills (4.B: describe data from a table or graph, and so on). Every question is tagged with the one it exercises.</p>' +
        (sk.length ? sk.map(function(s){ return bar({ label: 'Skill ' + s.id, value: s.value, tier: tier(s.value, s.answered), note: plural(s.answered, 'item') + ' answered' }); }).join('') : '<p class="bio-db-emptynote">Skills appear once you have answered questions.</p>') + '</section>';
      var tools = window.ApBioTools || [], trows = tools.map(function(t){ var s = A.toolStats(t.slug); return s.n ? bar({ label: t.name, href: BASE + 'tools/' + t.slug + '.html', value: s.c / s.n, note: s.c + ' of ' + s.n + ' right' }) : ''; }).join('');
      if(trows) html += '<section class="panel" aria-labelledby="bio-db-t-h"><h2 id="bio-db-t-h">Tool accuracy' + pill + '</h2>' + trows + '</section>';
    }
    html += '</div></div>';
    app.innerHTML = html;
    if(window.LevlExamDate) window.LevlExamDate.mount(document.getElementById('bioExamDate'), {
      subject: 'apbio',
      links: { review: BASE + 'review.html', exams: BASE + 'exams.html' },
      target: function(days){
        var left = built.filter(function(t){ return A.topicMastery(t.id).value < 0.6; }).length;
        if(!left) return { done: 'Every published topic is at strong or better. Keep Review clear and take a practice exam.' };
        return { n: Math.ceil(left / Math.max(1, days)), unit: left === 1 ? 'topic' : 'topics', why: 'brought to strong covers the ' + left + ' not there yet' };
      }
    });
  }

  render();
  window.addEventListener('storage', function(e){ if(!e.key || /^apbio_|hub/.test(e.key)) render(); });
  document.addEventListener('apbio:progress', render);
})();
