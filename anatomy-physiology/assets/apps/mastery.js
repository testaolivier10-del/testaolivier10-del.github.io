/* The A&P dashboard (docs/anp-spec.md section 12). Everything here is read
   from AnpCore, which computes it from the answer records in anp_progress_v1,
   plus the site's shared XP and streak (HubProgress) and the flashcard
   schedule (anp_flashcards_v1). Nothing is stored by this page.

   Every bar carries its number as text beside it, and a word for the tier, so
   no reading depends on color or on seeing the bar. */
(function(){
  var app = document.getElementById('app');
  var A = window.AnpCore, CU = window.AnpCurriculum;
  if(!app || !A || !CU) return;
  var BASE = window.ANP_BASE || '';
  var TOOL_ROWS = [
    { kind: 'lab-practical', name: 'Lab practical', by: 'by system' },
    { kind: 'predict', name: 'Predict the change', by: 'by difficulty level' },
    { kind: 'feedback-loops', name: 'Feedback loops', by: 'by loop' },
    { kind: 'pathways', name: 'Pathways', by: 'by pathway' },
    { kind: 'graphs', name: 'Graph reader', by: 'by graph' }
  ];

  function esc(s){ return String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
  function pct(v){ return Math.round((v || 0) * 100); }
  function plural(n, w, ws){ return n + ' ' + (n === 1 ? w : (ws || w + 's')); }
  var TOPIC = {}, CHAPTER = {};
  CU.topics.forEach(function(t){ TOPIC[t.id] = t; });
  CU.chapters.forEach(function(c){ CHAPTER[c.id] = c; });
  var builtTopics = CU.topics.filter(function(t){ return t.built; });

  function flashDue(){
    try{
      var d = JSON.parse(localStorage.getItem('anp_flashcards_v1') || 'null');
      if(!d || !d.cards) return { due: 0, learned: 0 };
      var now = Date.now(), due = 0, learned = 0;
      Object.keys(d.cards).forEach(function(k){ var s = d.cards[k]; if(s && s.t){ learned++; if(s.d <= now) due++; } });
      return { due: due, learned: learned };
    }catch(e){ return { due: 0, learned: 0 }; }
  }
  function groupLabel(kind, g){
    if(/^\d+$/.test(g)) return 'Level ' + g;
    if(/^level-?\d+$/i.test(g)) return 'Level ' + g.replace(/\D/g, '');
    if(CHAPTER[g]) return CHAPTER[g].title;
    if(TOPIC[g]) return TOPIC[g].title;
    var s = String(g).replace(/[-_]+/g, ' ');
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  function render(){
    var H = window.LevlHub;
    if(!H){ app.innerHTML = '<p class="cx-emptynote">The dashboard did not load. Reload the page.</p>'; return; }
    var store = A.load();
    var answeredIds = Object.keys(store.q || {});
    var lessons = Object.keys(store.lessons || {});
    var overall = A.overallMastery();
    var reviewDue = A.reviewCount();
    var fc = flashDue();
    var HP = window.HubProgress;
    var lvl = HP ? HP.levelInfo('anp') : null;
    var streak = HP ? HP.streak() : null;
    var anpXp = HP ? HP.subjectXp('anp') : 0;
    var started = builtTopics.filter(function(t){ return A.topicMastery(t.id).answered > 0; }).length;
    var firstUnstarted = builtTopics.filter(function(t){ return !store.lessons[t.id] && !A.topicMastery(t.id).answered; })[0];
    var isNew = !answeredIds.length && !lessons.length;
    var analytics = A.allowed('analytics'), pill = A.badge ? A.badge() : '';
    var weak = A.weakest(5);
    var weakCore = analytics ? A.weakestCore(3) : [];
    function bar(o){ return H.row(o); }
    function action(href, label){ return { href: href, label: label }; }
    function T(v, n){ return H.tier(v, n); }

    var html = '<div class="cx-db">';

    /* --- headline stats --- */
    html += H.stats([
      { value: isNew ? '0%' : pct(overall.value) + '%', label: 'Overall mastery', sub: 'across ' + plural(overall.topics || builtTopics.length, 'built topic') },
      { value: started + '<small> / ' + builtTopics.length + '</small>', label: 'Topics started', sub: plural(lessons.length, 'lesson') + ' finished' },
      { value: reviewDue + fc.due, label: 'Due for review', sub: plural(reviewDue, 'question') + ' &middot; ' + plural(fc.due, 'flashcard') },
      { value: streak ? streak.current : 0, label: 'Day streak', sub: streak ? (streak.metToday ? 'Today’s goal met' : streak.todayCount + ' of ' + streak.goal + ' today') : '' }
    ]);

    /* --- next up --- */
    if(isNew){
      var first = builtTopics[0];
      html += H.next({
        intro: 'Every question you answer, in a lesson, in practice or in a tool, updates your mastery of its topic, its body system and its core concepts. Nothing here yet, so here is where to start.',
        steps: [
          first ? '<a href="' + esc(BASE + 'lessons/' + first.id + '.html') + '">Start the first lesson: ' + esc(first.title) + '</a>. Foundations is recommended, not required.' : '',
          'Or jump in anywhere from <a href="' + esc(BASE + 'learn.html') + '">every chapter and topic</a>.',
          'Warm up with <a href="' + esc(BASE + 'flashcards.html') + '">flashcards</a> or try a <a href="' + esc(BASE + 'tools.html') + '">tool</a>.'
        ].filter(Boolean)
      });
    } else {
      var cards = [];
      if(reviewDue) cards.push({ href: BASE + 'review.html', title: 'Review ' + plural(reviewDue, 'question'), sub: 'Missed questions come back just before you would forget them.' });
      if(fc.due) cards.push({ href: BASE + 'flashcards.html', title: plural(fc.due, 'flashcard') + ' due', sub: 'A few minutes keeps the glossary fresh.' });
      if(weak[0] && weak[0].value < 0.6) cards.push({ href: BASE + 'practice.html?topic=' + encodeURIComponent(weak[0].id), title: 'Shore up ' + esc(weak[0].title), sub: 'Your weakest topic so far, at ' + pct(weak[0].value) + '%.' });
      if(firstUnstarted) cards.push({ href: BASE + 'lessons/' + firstUnstarted.id + '.html', title: 'Next new topic: ' + esc(firstUnstarted.title), sub: 'Topic ' + firstUnstarted.n + ', the first one you have not started.' });
      if(cards.length) html += H.next({ cards: cards.slice(0, 4) });
    }

    html += '<div id="anpExamDate"></div>';
    html += '<div class="cx-db-grid"><div class="cx-db-col">';

    /* --- weakest topics (free) and core concepts (Premium: the deeper
       analytics, with tool accuracy; mastery, XP and streak are progress and
       stay free, spec decision 72) --- */
    if(!isNew){
      html += H.panel({ id: 'anp-db-weak', title: 'Weakest topics', body: weak.length ? weak.map(function(w){
          return bar({ label: w.title, href: BASE + 'lessons/' + w.id + '.html', value: w.value, tier: T(w.value, w.answered), note: plural(w.answered, 'item') + ' answered',
            action: action(BASE + 'practice.html?topic=' + encodeURIComponent(w.id), 'Practice') });
        }).join('') : '<p class="cx-emptynote">Answer a few questions and your weakest topics show up here.</p>' });
    }
    if(!isNew && analytics){
      html += H.panel({ id: 'anp-db-weakc', title: 'Weakest core concepts' + pill, body: weakCore.length ? weakCore.map(function(w){
          return bar({ label: w.name, href: BASE + 'concepts/' + w.id + '.html', value: w.value, tier: T(w.value, w.answered), note: plural(w.answered, 'item') + ' answered',
            action: action(BASE + 'practice.html?core=' + encodeURIComponent(w.id), 'Practice') });
        }).join('') : '<p class="cx-emptynote">Core concepts appear once you have answered questions tagged with them.</p>' });
    }

    /* --- mastery by chapter, with its topics --- */
    var chapters = CU.chapters.filter(function(ch){ return builtTopics.some(function(t){ return t.chapter === ch.id; }); });
    html += H.panel({ id: 'anp-db-ch', title: 'Mastery by chapter and topic',
      hint: 'Mastery counts distinct questions you have right, weighted by level and fading slowly if you do not revisit them. Untouched topics count as zero.',
      body: chapters.map(function(ch){
        var m = A.chapterMastery(ch.id);
        var ts = builtTopics.filter(function(t){ return t.chapter === ch.id; });
        var st = ts.filter(function(t){ return A.topicMastery(t.id).answered; }).length;
        return H.group({ label: ch.n + '. ' + ch.title, value: m.value, tier: T(m.value, m.answered), note: st + ' of ' + plural(ts.length, 'topic') + ' started' },
          ts.map(function(t){
            var tm = A.topicMastery(t.id);
            return bar({ label: t.n + '. ' + t.title, href: BASE + 'lessons/' + t.id + '.html', value: tm.value, tier: T(tm.value, tm.answered),
              note: tm.answered ? plural(tm.answered, 'item') + ' answered' : (store.lessons[t.id] ? 'Lesson finished' : 'Not started'),
              action: action(BASE + 'practice.html?topic=' + encodeURIComponent(t.id), 'Practice') });
          }).join(''));
      }).join('') });

    html += '</div><div class="cx-db-col">';

    /* --- level and XP --- */
    if(lvl) html += H.level(lvl, { xpLine: anpXp.toLocaleString() + ' XP earned in A&amp;P &middot; ' + lvl.total.toLocaleString() + ' site-wide', sub: streak ? [H.streakLine(streak)] : [] });

    /* --- core concepts --- */
    html += H.panel({ id: 'anp-db-core', title: 'Mastery by core concept', body: CU.core.map(function(c){
        var m = A.coreMastery(c.id);
        return bar({ label: c.name, href: BASE + 'concepts/' + c.id + '.html', value: m.value, tier: T(m.value, m.answered), note: m.answered ? plural(m.answered, 'item') + ' answered' : '' });
      }).join('') });

    /* --- tool accuracy (Premium) or the one Premium card --- */
    if(analytics){
      var toolHtml = TOOL_ROWS.map(function(t){
        var s = A.toolStats(t.kind);
        var head = '<h3 class="cx-row-name" style="display:block;margin:14px 0 2px"><a href="' + esc(BASE + 'tools/' + t.kind + '.html') + '">' + esc(t.name) + '</a></h3>';
        if(!s.n) return head + '<p class="cx-emptynote">Not tried yet.</p>';
        var groups = Object.keys(s.by || {}).sort(function(a, b){ return String(a).localeCompare(String(b), undefined, { numeric: true }); });
        return head + bar({ label: 'Overall', value: s.c / s.n, text: pct(s.c / s.n) + '%', note: s.c + ' of ' + s.n + ' right' }) +
          (groups.length ? '<p class="cx-hint" style="margin:6px 0 0">' + esc(t.by) + '</p>' + groups.map(function(g){
            var x = s.by[g];
            return bar({ label: groupLabel(t.kind, g), value: x.n ? x.c / x.n : 0, note: x.c + ' of ' + x.n + ' right' });
          }).join('') : '');
      }).join('');
      html += H.panel({ id: 'anp-db-tools', title: 'Tool accuracy' + pill, hint: 'Share of items right in each tool, all time.', body: toolHtml });
    } else {
      html += A.gate('analytics', 'dashboard', '', 'Your progress, XP, streak, mastery and weakest topics stay free.');
    }

    html += '</div></div><div id="levlMilestones"></div></div>';
    app.innerHTML = html;
    if(window.LevlLazy) window.LevlLazy('milestones', function(M){ M.renderList(document.getElementById('levlMilestones'), 'anp'); });
    // A cross-course suggestion (assets/cross-course.js), once a finished session has recorded a milestone.
    var cx = document.querySelector('[data-levl-cross]');
    if(cx && window.LevlLazy && /"m":\{"/.test(localStorage.getItem('levlprep_cross') || '')) window.LevlLazy('cross-course', function(X){ X.offer(cx, 'anp'); });
    if(window.LevlExamDate) window.LevlExamDate.mount(document.getElementById('anpExamDate'), {
      subject: 'anp',
      links: { review: BASE + 'review.html', exams: BASE + 'exams.html' },
      target: function(days){
        var left = builtTopics.filter(function(t){ return A.topicMastery(t.id).value < 0.6; }).length;
        if(!left) return { done: 'Every built topic is at strong or better. Keep Review clear and take a cumulative exam.' };
        return { n: Math.ceil(left / days), unit: left === 1 ? 'topic' : 'topics', why: 'brought to strong covers the ' + left + ' not there yet' };
      }
    });
  }

  render();
  // Another tab recording answers, or account sync pulling progress, redraws.
  window.addEventListener('storage', function(e){ if(!e.key || /^anp_|hub/.test(e.key)) render(); });
  document.addEventListener('anp:progress', render);
})();
