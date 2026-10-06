/* Renders the mastery dashboard on dashboard.html.

   This page used to report OchemCurriculum lesson scores — how you did on
   the check questions inside each lesson, averaged per topic. That was the
   weakest signal on the site: it measured what you did while the answer was
   still on the screen above the question, it never decayed, and it knew
   nothing about the 64-concept model that Practice and Review actually run
   on. A student could be "82% on SN2" here while Review had SN2's backside
   attack benched as a leech.

   So it reads the concept model now, and the two pages finally agree. Topics
   and modules are still shown — that is the shape students think in — but
   they are rolled up from concepts rather than kept as a parallel score.

   Kept out of an inline <script> for the same reason as learn-page.js: the
   site's CI checker textually scans .html files for href="..." and would
   misfire on the generated href="' + topic.href + '" pattern. */
(function(){
  var C = window.OchemCurriculum;
  var M = window.OchemMastery;
  var CN = window.OchemConcepts;

  function esc(s){
    return String(s).replace(/[&<>"]/g, function(c){
      return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c];
    });
  }
  function pct(x){ return Math.round(x * 100); }
  function plural(n, w){ return n + ' ' + w + (n === 1 ? '' : 's'); }
  function set(id, html){ var el = document.getElementById(id); if(el) el.innerHTML = html; }
  var H = window.LevlHub, HP = window.HubProgress;
  if(!H || !M || !C || !CN) return;
  var profiles = M.allProfiles();
  var touched = profiles.filter(function(p){ return p.attempts > 0; });
  // overall() returns null outright when nothing has been attempted, not an
  // object with a null value — so normalize before anything reads .value.
  var overall = M.overall() || { value: null, touched: 0, total: CN.ALL.length };
  var BAND_LVL = { unseen: 0, shaky: 1, developing: 2, solid: 3, mastered: 4 };
  function bandTier(s){ var b = M.bandFor(s); return { label: b.label, lvl: BAND_LVL[b.key] || 0 }; }

  /* ---- headline tiles (the shared dashboard row) ---------------------
     Strength alone is misleading early on: 90% across the three concepts
     you have tried is not 90% of organic chemistry, so the tile's sub-line
     always says how much of the map the number covers. */
  var lessonTopics = [];
  C.MODULES.forEach(function(m){ m.topics.forEach(function(t){ if(C.hasLesson(t)) lessonTopics.push(t); }); });
  var topicsStarted = lessonTopics.filter(function(t){ return M.topicStrength(t.id).strength !== null; }).length;
  var dueNow = M.due(200);
  var st = HP ? HP.streak() : null;
  set('ocStats', H.stats([
    { value: overall.value === null ? '0%' : pct(overall.value) + '%', label: 'Overall mastery', sub: overall.value === null ? 'across ' + overall.total + ' concepts' : plural(overall.touched, 'concept') + ' attempted, of ' + overall.total },
    { value: topicsStarted + '<small> / ' + lessonTopics.length + '</small>', label: 'Topics started', sub: 'with an interactive lesson' },
    { value: dueNow.length, label: 'Due for review', sub: plural(dueNow.length, 'concept') },
    { value: st ? st.current : M.streakDays(), label: 'Day streak', sub: st ? (st.metToday ? 'Today’s goal met' : st.todayCount + ' of ' + st.goal + ' today') : '' }
  ]));

  /* ---- next up, for someone with nothing recorded yet ---- */
  if(!touched.length){
    var firstLesson = lessonTopics[0];
    set('ocStart', H.next({
      intro: 'Every question you answer, in a lesson or in Practice, updates the strength of the concepts it tests. Nothing here yet, so here is where to start.',
      steps: [
        firstLesson ? '<a href="' + esc(firstLesson.href) + '">Start the first lesson: ' + esc(firstLesson.title) + '</a>.' : '',
        'Or read any chapter in <a href="learn.html">the textbook</a>.',
        'Warm up with <a href="flashcards.html">flashcards</a> or try a <a href="tools.html">tool</a>.'
      ].filter(Boolean)
    }));
  }

  /* ---- benched concepts ----------------------------------------------
     A leech is the one thing on this page that is not a score but an
     instruction. Practice has stopped serving it on purpose, so if this page
     showed it as just another weak concept the student would have no idea
     why it never comes up. */
  var leeches = M.leeches();
  set('leechAlerts', !leeches.length ? '' : leeches.map(function(p){
    var t = CN.lessonTopicFor(p.id);
    return '<div class="dep-alert">' +
      '<div class="k">Paused until you re-read it</div>' +
      '<div class="msg">You have missed ' + esc(CN.phrase(p.id)) + ' ' +
        plural(p.attempts - p.correct, 'time') + ' out of ' + p.attempts +
        '. More questions would just be more wrong answers, so Practice has stopped serving it. ' +
        'Read the lesson and it comes straight back into your review queue.</div>' +
      (t ? '<div class="prereqs"><a href="' + t.href + '">' + esc(t.title) + '</a></div>' : '') +
    '</div>';
  }).join(''));

  /* ---- prerequisite gaps ----------------------------------------------
     Concept-level now, not topic-level. "You're weak at E2" is not
     actionable; "you're weak at E2 and the thing underneath it you're also
     weak at is anti-periplanar geometry" is. */
  var gaps = [];
  touched.forEach(function(p){
    if(p.strength === null || p.strength >= 0.55) return;
    var weak = M.weakPrerequisites(p.id);
    if(weak && weak.length) gaps.push({ p: p, prereqs: weak });
  });
  gaps.sort(function(a, b){ return a.p.strength - b.p.strength; });
  set('dependencyAlerts', gaps.slice(0, 3).map(function(g){
    var chips = g.prereqs.map(function(w){
      var t = CN.lessonTopicFor(w.id);
      return t ? '<a href="' + t.href + '">' + esc(w.concept.title) + '</a>'
               : '<span>' + esc(w.concept.title) + '</span>';
    }).join('');
    return '<div class="dep-alert">' +
      '<div class="k">Possible gap underneath this</div>' +
      '<div class="msg">You are at ' + pct(g.p.strength) + '% on ' + esc(CN.phrase(g.p.id)) +
        '. The gap is probably further back:</div>' +
      '<div class="prereqs">' + chips + '</div>' +
    '</div>';
  }).join(''));

  /* ---- what to do next (Premium: built on the gap detection) ---- */
  var weakest = M.weakest(1, 2)[0];
  var recCards = [];
  if(dueNow.length) recCards.push({ href: 'review.html', title: plural(dueNow.length, 'concept') + ' due for review', sub: 'Scheduled by how shaky each was, not by date.' });
  if(weakest) recCards.push({ href: 'practice.html?concept=' + weakest.id, title: 'Drill ' + esc(weakest.concept.title), sub: 'Your weakest concept, at ' + pct(weakest.strength) + '%.' });
  /* A tool for whichever of them you are worst at: silent far more often
     than not, and ranked last, because a sandbox is a thing to offer, not a
     thing to assign. */
  if(window.OchemTools && M.topicsStrength){
    var worstTool = null;
    window.OchemTools.ALL.forEach(function(tool){
      var r = M.topicsStrength([].concat(tool.topic || []));
      if(r.strength === null) return;
      if(!worstTool || r.strength < worstTool.strength) worstTool = { tool: tool, strength: r.strength };
    });
    if(worstTool && worstTool.strength < 0.7) recCards.push({ href: 'tools/' + worstTool.tool.slug + '.html', title: 'Get your hands on it: ' + esc(worstTool.tool.name), sub: esc(worstTool.tool.tagline) });
  }
  if(touched.length && !recCards.length){
    var nextUnlocked = null;
    C.MODULES.some(function(m){
      return m.topics.some(function(t){
        if(C.hasLesson(t) && M.topicStrength(t.id).strength === null){ nextUnlocked = t; return true; }
        return false;
      });
    });
    if(nextUnlocked) recCards.push({ href: nextUnlocked.href, title: 'Next new topic: ' + esc(nextUnlocked.title), sub: 'The first lesson you have not started.' });
  }
  set('recRow', recCards.length ? H.next({ cards: recCards }) : '');

  /* ---- weakest concepts, with a way to act on each ---- */
  var weakList = M.weakest(8, 2);
  set('weakConcepts', !weakList.length ? '' : H.panel({ id: 'oc-weak', title: 'Weakest concepts', body: weakList.map(function(p){
    var s = p.strength === null ? 0 : p.strength;
    return H.row({ label: p.concept.title, value: s, tier: bandTier(p.strength),
      note: p.correct + '/' + p.attempts + ' right' + (p.isDue ? ' &middot; due now' : (p.dueIn !== null && p.dueIn > 0 ? ' &middot; back in ' + plural(p.dueIn, 'day') : '')),
      action: { href: 'practice.html?concept=' + p.id, label: 'Drill' } });
  }).join('') }));

  /* ---- mastery by chapter, rolled up from concepts, with its topics ---- */
  set('moduleStats', H.panel({ id: 'oc-mod', title: 'Mastery by chapter and topic',
    hint: 'Strength comes from the concepts each question tests and decays if you stop practicing. Topics with notes only are not scored.',
    body: C.MODULES.map(function(m, i){
      var ts = m.topics.filter(function(t){ return C.hasLesson(t); });
      var r = M.topicsStrength(ts.map(function(t){ return t.id; }));
      var started = ts.filter(function(t){ return M.topicStrength(t.id).strength !== null; }).length;
      return H.group({ label: (i + 1) + '. ' + m.title, value: r.strength || 0, tier: bandTier(r.strength), note: started + ' of ' + plural(ts.length, 'topic') + ' started' },
        ts.map(function(t){
          var tr = M.topicStrength(t.id);
          return H.row({ label: t.title, href: t.href, value: tr.strength || 0, tier: bandTier(tr.strength),
            note: tr.strength === null ? 'Not started' : tr.touched + ' of ' + plural(tr.total, 'concept') + ' tried',
            action: { href: 'practice.html?topic=' + t.id, label: 'Practice' } });
        }).join('') || '<p class="cx-emptynote">Notes only so far.</p>');
    }).join('') }));

  /* ---- concept families (Premium): the breakdown the engine thinks in,
     which shows a weakness that is really one idea failing in five places. */
  set('familyStats', !touched.length ? '' : H.panel({ id: 'oc-fam', title: 'By concept family', body: M.familyRollup().map(function(f){
    return H.row({ label: f.family, value: f.strength || 0, tier: bandTier(f.strength), note: f.touched + ' of ' + plural(f.total, 'concept') + ' tried' });
  }).join('') }));

  /* Premium: gap detection (benched concepts, prerequisite alerts, the
     recommendations built on them) and the concept-family analytics. Overall
     mastery, the snapshot, the per-module bars, the weakest-concepts list,
     XP, streak and achievements stay free: they are the reader's own
     progress, and earned progress is never locked. */
  var G = window.OchemPremium;
  if(G){
    var ids = ['leechAlerts', 'dependencyAlerts', 'recRow', 'familyStats'];
    G.lock({
      feature: 'mastery', source: 'dashboard',
      hide: ids.map(function(id){ return document.getElementById(id); }),
      after: document.getElementById('ocPremium'),
      notes: 'learn.html', notesText: 'Read the free textbook',
      locked: function(){ return G.locked(); },
      badgeIn: document.querySelector('.page-head .eyebrow'),
      badge: G.badge()
    });
  }
})();
