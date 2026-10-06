/* The AP® Chemistry dashboard (forked from anatomy-physiology/assets/apps/
   mastery.js). Everything is read from ApChemCore, which computes it from the
   answer records in apchem_progress_v1, plus the site's shared XP and streak
   (HubProgress), the flashcard schedule (apchem_flashcards_v1) and the
   free-response self-scores and exam history in apchem_prefs_v1. Nothing is
   stored here.

   Free: overall, mastery by unit and topic, by science practice (the six),
   weakest topics with links to the exact lesson, FRQ self-scores, exam
   history, the exam-date card. Premium (ApChemCore.allowed('analytics')):
   the deeper analytics, mastery by skill (1.A, 4.B...), tool accuracy.

   Exam date: assets/exam-date.js counts down to the course default, the
   AP® Chemistry exam on Thursday 6 May 2027, until the student sets their own
   date (apchem_exam_date). The cram kit (cram.html) is linked under the
   card: its plan counts back from the same date. Every bar carries its
   number as text. */
(function(){
  var app = document.getElementById('app');
  var A = window.ApChemCore, CU = window.ApChemCurriculum;
  if(!app || !A || !CU) return;
  var BASE = window.ApChemBase || '';
  var PREFS = 'apchem_prefs_v1';
  var FRQ_TYPES = { long: 'Long (10 points)', short: 'Short (4 points)' };

  function esc(s){ return String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
  function pct(v){ return Math.round((v || 0) * 100); }
  function plural(n, w, ws){ return n + ' ' + (n === 1 ? w : (ws || w + 's')); }
  function prefs(){ try{ return JSON.parse(localStorage.getItem(PREFS) || '{}') || {}; }catch(e){ return {}; } }
  var TOPIC = {}, UNIT = {};
  CU.topics.forEach(function(t){ TOPIC[t.id] = t; });
  CU.units.forEach(function(u){ UNIT[u.id] = u; });
  var built = CU.topics.filter(function(t){ return t.built; });
  function unitName(u){ var c = UNIT[u]; return c ? (c.part === 'course' ? 'Unit ' + c.n + ': ' : '') + c.title : u; }

  function flashDue(){
    try{
      var d = JSON.parse(localStorage.getItem('apchem_flashcards_v1') || 'null');
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
    var H = window.LevlHub;
    if(!H){ app.innerHTML = '<p class="cx-emptynote">The dashboard did not load. Reload the page.</p>'; return; }
    function bar(o){ return H.row(o); }
    function action(href, label){ return { href: href, label: label }; }
    function tier(v, n){ return H.tier(v, n); }
    var store = A.load(), P = prefs();
    var answeredIds = Object.keys(store.q || {}), lessons = Object.keys(store.lessons || {});
    var overall = A.overallMastery(), reviewDue = A.reviewCount(), fc = flashDue();
    var HP = window.HubProgress, streak = HP ? HP.streak() : null;
    var lvl = HP ? HP.levelInfo('apchem') : null, myXp = HP ? HP.subjectXp('apchem') : 0;
    var started = built.filter(function(t){ return A.topicMastery(t.id).answered > 0; }).length;
    var isNew = !answeredIds.length && !lessons.length;
    var frqScores = P.frqScores || {}, exams = (P.examHistory || []).slice().reverse();
    var analytics = A.allowed('analytics'), pill = A.badge ? A.badge() : '';
    var html = '<div class="cx-db">';

    html += H.stats([
      { value: isNew ? '0%' : pct(overall.value) + '%', label: 'Overall mastery', sub: 'across ' + plural(overall.topics || built.length, 'published topic') },
      { value: started + '<small> / ' + built.length + '</small>', label: 'Topics started', sub: plural(lessons.length, 'lesson') + ' finished' },
      { value: reviewDue + fc.due, label: 'Due for review', sub: plural(reviewDue, 'question') + ' &middot; ' + plural(fc.due, 'flashcard') },
      { value: streak ? streak.current : 0, label: 'Day streak', sub: streak ? (streak.metToday ? 'Today’s goal met' : streak.todayCount + ' of ' + streak.goal + ' today') : '' }
    ]);

    var weak = A.weakest(5);
    if(isNew){
      var first = built[0];
      html += H.next({ intro: 'Every question you answer updates your mastery of its topic, its unit and its science practice. Nothing here yet, so here is where to start.',
        steps: [first ? '<a href="' + esc(BASE + 'lessons/' + first.id + '.html') + '">Start the first lesson: ' + esc(first.title) + '</a>.' : '',
          'Or open any unit from <a href="' + esc(BASE + 'learn.html') + '">the textbook</a>.', 'Warm up with <a href="' + esc(BASE + 'flashcards.html') + '">flashcards</a> or try a <a href="' + esc(BASE + 'tools.html') + '">tool</a>.'].filter(Boolean) });
    } else {
      var cards = [];
      if(reviewDue) cards.push({ href: BASE + 'review.html', title: 'Review ' + plural(reviewDue, 'question'), sub: 'Missed questions come back just before you would forget them.' });
      if(fc.due) cards.push({ href: BASE + 'flashcards.html', title: plural(fc.due, 'flashcard') + ' due', sub: 'A few minutes keeps the terms fresh.' });
      if(weak[0] && weak[0].value < 0.6) cards.push({ href: BASE + 'lessons/' + weak[0].id + '.html', title: 'Reread ' + esc(weak[0].title), sub: 'Your weakest topic so far, at ' + pct(weak[0].value) + '%.' });
      var wp = A.weakestPractice(1)[0];
      if(wp && wp.value < 0.6) cards.push({ href: BASE + 'practice.html?practice=' + wp.id, title: 'Practice ' + wp.id + ': ' + esc(wp.name), sub: 'Your weakest science practice, at ' + pct(wp.value) + '%.' });
      if(cards.length) html += H.next({ cards: cards.slice(0, 4) });
    }

    html += '<div id="chemExamDate" class="chem-db-examdate"></div>' +
      '<p class="chem-db-cram"><a class="btn-outline" href="' + esc(BASE + 'cram.html') + '">Open the cram kit</a> <span>A 3-week or 2-week plan counted back from your exam date, with timed mixed sets.</span></p>' +
      '<div class="cx-db-grid"><div class="cx-db-col">';

    if(!isNew) html += H.panel({ id: 'chem-db-weak', title: 'Weakest topics', body: weak.length ? weak.map(function(w){
        return bar({ label: w.title, href: BASE + 'lessons/' + w.id + '.html', value: w.value, tier: tier(w.value, w.answered), note: plural(w.answered, 'item') + ' answered &middot; <a href="' + esc(BASE + 'notes/' + w.id + '.html') + '">notes</a>', action: action(BASE + 'practice.html?topic=' + encodeURIComponent(w.id), 'Practice') });
      }).join('') : '<p class="cx-emptynote">Answer a few questions and your weakest topics show up here.</p>' });

    var units = CU.units.filter(function(u){ return built.some(function(t){ return t.unit === u.id; }); });
    html += H.panel({ id: 'chem-db-u', title: 'Mastery by unit and topic',
      hint: 'Mastery counts distinct questions you have right, weighted by level and fading slowly if you do not revisit them. Untouched topics count as zero.',
      body: units.length ? units.map(function(u){
        var m = A.unitMastery(u.id), ts = built.filter(function(t){ return t.unit === u.id; });
        return H.group({ label: unitName(u.id), value: m.value, tier: tier(m.value, m.answered), note: ts.filter(function(t){ return A.topicMastery(t.id).answered; }).length + ' of ' + plural(ts.length, 'topic') + ' started' },
          ts.map(function(t){
            var tm = A.topicMastery(t.id);
            return bar({ label: (t.ced ? t.ced + ' ' : '') + t.title, href: BASE + 'lessons/' + t.id + '.html', value: tm.value, tier: tier(tm.value, tm.answered),
              note: tm.answered ? plural(tm.answered, 'item') + ' answered' : (store.lessons[t.id] ? 'Lesson finished' : 'Not started'), action: action(BASE + 'practice.html?topic=' + encodeURIComponent(t.id), 'Practice') });
          }).join(''));
      }).join('') : '<p class="cx-emptynote">Units appear here as they are published.</p>' });

    html += H.panel({ id: 'chem-db-ex', title: 'Exam history', body: exams.length ? '<ul class="chem-db-list">' + exams.slice(0, 8).map(function(x){
        return '<li><b>' + esc(x.label) + '</b> <span class="chem-small">' + esc(new Date(x.ts).toLocaleDateString()) + '</span><br>Multiple choice ' + x.mcq.c + '/' + x.mcq.n + ' (' + pct(x.mcq.n ? x.mcq.c / x.mcq.n : 0) + '%)' +
          (x.frq ? ' &middot; free response ' + x.frq.got + '/' + x.frq.of : '') + (x.band ? ' &middot; rough band ' + x.band + ' of 5 <span class="chem-small">(not calibrated)</span>' : '') + '</li>';
      }).join('') + '</ul>' : '<p class="cx-emptynote">No exams yet. <a href="' + esc(BASE + 'exams.html') + '">Take a unit test or a practice exam</a>.</p>' });

    html += '</div><div class="cx-db-col">';

    if(lvl) html += H.level(lvl, { xpLine: myXp.toLocaleString() + ' XP earned in AP&reg; Chemistry &middot; ' + lvl.total.toLocaleString() + ' site-wide', sub: streak ? [H.streakLine(streak)] : [] });

    html += H.panel({ id: 'chem-db-p', title: 'Mastery by science practice', body: (CU.practices || []).map(function(p){
        var m = A.practiceMastery(p.id);
        return bar({ label: p.id + '. ' + p.name, value: m.value, tier: tier(m.value, m.answered), note: m.answered ? plural(m.answered, 'item') + ' answered' : '', action: m.answered ? action(BASE + 'practice.html?practice=' + p.id, 'Practice') : null });
      }).join('') });

    var fids = Object.keys(frqScores).sort(function(a, b){ return (frqScores[b].ts || 0) - (frqScores[a].ts || 0); });
    html += H.panel({ id: 'chem-db-f', title: 'Free-response self-scores', body: fids.length ? fids.slice(0, 8).map(function(id){
        var s = frqScores[id];
        return bar({ label: s.title || id, href: BASE + 'frq/' + id + '.html', value: s.of ? s.got / s.of : 0, text: s.got + '/' + s.of, note: esc(FRQ_TYPES[s.type] || '') + (s.tries > 1 ? ' &middot; best ' + s.best + ' over ' + s.tries + ' tries' : '') });
      }).join('') + '<p class="cx-hint" style="margin:8px 0 0">Scores you gave yourself with the rubrics.</p>' : '<p class="cx-emptynote">Score a <a href="' + esc(BASE + 'frq.html') + '">free-response question</a> with its rubric and it shows up here.</p>' });

    if(!analytics) html += A.gate('analytics', 'dashboard');
    else if(!isNew){
      var sk = skills();
      html += H.panel({ id: 'chem-db-s', title: 'Mastery by skill' + pill, hint: 'Each science practice splits into skills (4.B: describe data from a table or graph, and so on). Every question is tagged with the one it exercises.',
        body: sk.length ? sk.map(function(s){ return bar({ label: 'Skill ' + s.id, value: s.value, tier: tier(s.value, s.answered), note: plural(s.answered, 'item') + ' answered' }); }).join('') : '<p class="cx-emptynote">Skills appear once you have answered questions.</p>' });
      var tools = window.ApChemToolList || [], trows = tools.map(function(t){ var s = A.toolStats(t.slug); return s.n ? bar({ label: t.name, href: BASE + 'tools/' + t.slug + '.html', value: s.c / s.n, note: s.c + ' of ' + s.n + ' right' }) : ''; }).join('');
      if(trows) html += H.panel({ id: 'chem-db-t', title: 'Tool accuracy' + pill, body: trows });
    }
    html += '</div></div></div>';
    app.innerHTML = html;
    if(window.LevlExamDate) window.LevlExamDate.mount(document.getElementById('chemExamDate'), {
      subject: 'apchem',
      links: { review: BASE + 'review.html', exams: BASE + 'exams.html' },
      target: function(days){
        var left = built.filter(function(t){ return A.topicMastery(t.id).value < 0.6; }).length;
        if(!left) return { done: 'Every published topic is at strong or better. Keep Review clear and take a practice exam.' };
        return { n: Math.ceil(left / Math.max(1, days)), unit: left === 1 ? 'topic' : 'topics', why: 'brought to strong covers the ' + left + ' not there yet' };
      }
    });
  }

  render();
  window.addEventListener('storage', function(e){ if(!e.key || /^apchem_|hub/.test(e.key)) render(); });
  document.addEventListener('apchem:progress', render);
})();
