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
  function tier(v, answered){
    if(!answered) return 'Not started';
    if(v >= 0.85) return 'Mastered';
    if(v >= 0.6) return 'Strong';
    if(v >= 0.3) return 'Developing';
    return 'Learning';
  }
  var TOPIC = {}, CHAPTER = {};
  CU.topics.forEach(function(t){ TOPIC[t.id] = t; });
  CU.chapters.forEach(function(c){ CHAPTER[c.id] = c; });
  var builtTopics = CU.topics.filter(function(t){ return t.built; });

  /* One bar row: label (optionally a link), the value as text, a tier word,
     a note, and an optional action link. */
  function bar(o){
    var p = pct(o.value);
    return '<div class="anp-db-row">' +
      '<div class="anp-db-row-top">' +
        '<span class="anp-db-name">' + (o.href ? '<a href="' + esc(o.href) + '">' + esc(o.label) + '</a>' : esc(o.label)) + '</span>' +
        '<span class="anp-db-val"><b>' + (o.text || p + '%') + '</b>' + (o.tier ? ' <span class="anp-db-tier">' + esc(o.tier) + '</span>' : '') + '</span>' +
      '</div>' +
      '<div class="track thin anp-db-track" aria-hidden="true"><i style="width:' + Math.max(o.value > 0 ? 2 : 0, p) + '%"></i></div>' +
      ((o.note || o.action) ? '<div class="anp-db-row-foot">' + (o.note ? '<span>' + o.note + '</span>' : '<span></span>') + (o.action || '') + '</div>' : '') +
    '</div>';
  }
  function action(href, label){ return '<a class="anp-db-go" href="' + esc(href) + '">' + esc(label) + '</a>'; }
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
  function stat(value, label, sub){
    return '<div class="stat-card anp-db-stat"><div class="v">' + value + '</div><div class="l">' + esc(label) + '</div>' + (sub ? '<div class="anp-db-stat-sub">' + sub + '</div>' : '') + '</div>';
  }

  function render(){
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

    var html = '';

    /* --- headline stats --- */
    html += '<div class="stat-row anp-db-stats">' +
      stat(isNew ? '0%' : pct(overall.value) + '%', 'Overall mastery', 'across ' + plural(overall.topics || builtTopics.length, 'built topic')) +
      stat(started + '<small> / ' + builtTopics.length + '</small>', 'Topics started', plural(lessons.length, 'lesson') + ' finished') +
      stat(reviewDue + fc.due, 'Due for review', plural(reviewDue, 'question') + ' &middot; ' + plural(fc.due, 'flashcard')) +
      stat(streak ? streak.current : 0, 'Day streak', streak ? (streak.metToday ? 'Today’s goal met' : streak.todayCount + ' of ' + streak.goal + ' today') : '') +
    '</div>';

    /* --- a new learner --- */
    if(isNew){
      var first = builtTopics[0];
      html += '<section class="panel anp-db-empty" aria-labelledby="anp-db-empty-h">' +
        '<h2 id="anp-db-empty-h">Your dashboard fills in as you study</h2>' +
        '<p>Every question you answer, in a lesson, in practice or in a tool, updates your mastery of its topic, its body system and its core concepts. Nothing here yet, so here is where to start.</p>' +
        '<ol class="anp-db-steps">' +
          (first ? '<li><a href="' + esc(BASE + 'lessons/' + first.id + '.html') + '">Start the first lesson: ' + esc(first.title) + '</a>. Foundations is recommended, not required.</li>' : '') +
          '<li>Or jump in anywhere from <a href="' + esc(BASE + 'learn.html') + '">every chapter and topic</a>.</li>' +
          '<li>Warm up with <a href="' + esc(BASE + 'flashcards.html') + '">flashcards</a> or try a <a href="' + esc(BASE + 'tools.html') + '">tool</a>.</li>' +
        '</ol></section>';
    }

    /* --- next steps --- */
    var steps = [];
    if(reviewDue) steps.push('<li><a href="' + esc(BASE + 'review.html') + '"><b>Review ' + plural(reviewDue, 'question') + '</b></a><span>Missed questions come back just before you would forget them.</span></li>');
    if(fc.due) steps.push('<li><a href="' + esc(BASE + 'flashcards.html') + '"><b>' + plural(fc.due, 'flashcard') + ' due</b></a><span>A few minutes keeps the glossary fresh.</span></li>');
    var weak = A.allowed('weak-spot-analytics') ? A.weakest(5) : [];
    var weakCore = A.allowed('weak-spot-analytics') ? A.weakestCore(3) : [];
    if(weak[0] && weak[0].value < 0.6) steps.push('<li><a href="' + esc(BASE + 'practice.html?topic=' + encodeURIComponent(weak[0].id)) + '"><b>Shore up ' + esc(weak[0].title) + '</b></a><span>Your weakest topic so far, at ' + pct(weak[0].value) + '%.</span></li>');
    if(firstUnstarted && !isNew) steps.push('<li><a href="' + esc(BASE + 'lessons/' + firstUnstarted.id + '.html') + '"><b>Next new topic: ' + esc(firstUnstarted.title) + '</b></a><span>Topic ' + firstUnstarted.n + ', the first one you have not started.</span></li>');
    if(steps.length && !isNew) html += '<section class="panel anp-db-next" aria-labelledby="anp-db-next-h"><h2 id="anp-db-next-h">Study next</h2><ul class="anp-db-nextlist">' + steps.slice(0, 4).join('') + '</ul></section>';

    html += '<div class="anp-db-grid"><div class="anp-db-col">';

    /* --- weakest topics and core concepts --- */
    if(!isNew && A.allowed('weak-spot-analytics')){
      html += '<section class="panel" aria-labelledby="anp-db-weak-h"><h2 id="anp-db-weak-h">Weakest topics</h2>' +
        (weak.length ? weak.map(function(w){
          return bar({ label: w.title, href: BASE + 'lessons/' + w.id + '.html', value: w.value, tier: tier(w.value, w.answered), note: plural(w.answered, 'item') + ' answered',
            action: action(BASE + 'practice.html?topic=' + encodeURIComponent(w.id), 'Practice') });
        }).join('') : '<p class="anp-db-emptynote">Answer a few questions and your weakest topics show up here.</p>') +
        '</section>' +
        '<section class="panel" aria-labelledby="anp-db-weakc-h"><h2 id="anp-db-weakc-h">Weakest core concepts</h2>' +
        (weakCore.length ? weakCore.map(function(w){
          return bar({ label: w.name, href: BASE + 'concepts/' + w.id + '.html', value: w.value, tier: tier(w.value, w.answered), note: plural(w.answered, 'item') + ' answered',
            action: action(BASE + 'practice.html?core=' + encodeURIComponent(w.id), 'Practice') });
        }).join('') : '<p class="anp-db-emptynote">Core concepts appear once you have answered questions tagged with them.</p>') +
        '</section>';
    }

    /* --- mastery by chapter, with its topics --- */
    var chapters = CU.chapters.filter(function(ch){ return builtTopics.some(function(t){ return t.chapter === ch.id; }); });
    html += '<section class="panel" aria-labelledby="anp-db-ch-h"><h2 id="anp-db-ch-h">Mastery by chapter and topic</h2>' +
      '<p class="anp-db-hint">Mastery counts distinct questions you have right, weighted by level and fading slowly if you do not revisit them. Untouched topics count as zero.</p>' +
      chapters.map(function(ch){
        var m = A.chapterMastery(ch.id);
        var ts = builtTopics.filter(function(t){ return t.chapter === ch.id; });
        var st = ts.filter(function(t){ return A.topicMastery(t.id).answered; }).length;
        return '<details class="anp-db-ch"><summary>' +
            bar({ label: ch.n + '. ' + ch.title, value: m.value, tier: tier(m.value, m.answered), note: st + ' of ' + plural(ts.length, 'topic') + ' started' }) +
          '</summary><div class="anp-db-topics">' +
          ts.map(function(t){
            var tm = A.topicMastery(t.id);
            return bar({ label: t.n + '. ' + t.title, href: BASE + 'lessons/' + t.id + '.html', value: tm.value, tier: tier(tm.value, tm.answered),
              note: tm.answered ? plural(tm.answered, 'item') + ' answered' : (store.lessons[t.id] ? 'Lesson finished' : 'Not started'),
              action: action(BASE + 'practice.html?topic=' + encodeURIComponent(t.id), 'Practice') });
          }).join('') +
          '</div></details>';
      }).join('') +
      '</section>';

    html += '</div><div class="anp-db-col">';

    /* --- level and XP --- */
    if(lvl){
      var into = Math.round(lvl.into / lvl.span * 100);
      html += '<section class="anp-db-level" aria-labelledby="anp-db-level-h">' +
        '<div class="anp-db-level-head"><span class="anp-db-ring" aria-hidden="true">' + lvl.level + '</span><div><h2 id="anp-db-level-h">Level ' + lvl.level + ' &middot; ' + esc(lvl.title) + '</h2>' +
        '<span class="anp-db-level-sub">' + anpXp.toLocaleString() + ' XP earned in A&amp;P &middot; ' + lvl.total.toLocaleString() + ' site-wide</span></div></div>' +
        '<div class="anp-db-level-track" aria-hidden="true"><i style="width:' + into + '%"></i></div>' +
        '<p class="anp-db-level-sub">' + lvl.toNext.toLocaleString() + ' XP to level ' + (lvl.level + 1) + '</p>' +
        (streak ? '<p class="anp-db-level-sub">Streak: ' + plural(streak.current, 'day') + ' (best ' + streak.longest + ') &middot; today ' + streak.todayCount + ' of ' + streak.goal + (streak.freezes ? ' &middot; ' + plural(streak.freezes, 'freeze') : '') + '</p>' : '') +
      '</section>';
    }

    /* --- core concepts --- */
    html += '<section class="panel" aria-labelledby="anp-db-core-h"><h2 id="anp-db-core-h">Mastery by core concept</h2>' +
      CU.core.map(function(c){
        var m = A.coreMastery(c.id);
        return bar({ label: c.name, href: BASE + 'concepts/' + c.id + '.html', value: m.value, tier: tier(m.value, m.answered), note: m.answered ? plural(m.answered, 'item') + ' answered' : '' });
      }).join('') +
      '</section>';

    /* --- tool accuracy --- */
    var toolHtml = TOOL_ROWS.map(function(t){
      var s = A.toolStats(t.kind);
      var head = '<h3 class="anp-db-tool-h"><a href="' + esc(BASE + 'tools/' + t.kind + '.html') + '">' + esc(t.name) + '</a></h3>';
      if(!s.n) return head + '<p class="anp-db-emptynote">Not tried yet.</p>';
      var groups = Object.keys(s.by || {}).sort(function(a, b){ return String(a).localeCompare(String(b), undefined, { numeric: true }); });
      return head + bar({ label: 'Overall', value: s.c / s.n, text: pct(s.c / s.n) + '%', note: s.c + ' of ' + s.n + ' right' }) +
        (groups.length ? '<p class="anp-db-by">' + esc(t.by) + '</p>' + groups.map(function(g){
          var x = s.by[g];
          return bar({ label: groupLabel(t.kind, g), value: x.n ? x.c / x.n : 0, note: x.c + ' of ' + x.n + ' right' });
        }).join('') : '');
    }).join('');
    html += '<section class="panel" aria-labelledby="anp-db-tools-h"><h2 id="anp-db-tools-h">Tool accuracy</h2>' +
      '<p class="anp-db-hint">Share of items right in each tool, all time.</p>' + toolHtml + '</section>';

    html += '</div></div>';
    app.innerHTML = html;
  }

  render();
  // Another tab recording answers, or account sync pulling progress, redraws.
  window.addEventListener('storage', function(e){ if(!e.key || /^anp_|hub/.test(e.key)) render(); });
  document.addEventListener('anp:progress', render);
})();
