/* Renders the mastery dashboard on mastery.html.

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
  function fillClass(s){ return s < 0.45 ? 'low' : (s < 0.7 ? 'mid' : (s >= 0.88 ? 'high' : '')); }
  function set(id, html){ var el = document.getElementById(id); if(el) el.innerHTML = html; }
  /* A section heading with nothing under it reads as a bug, and on a fresh
     profile most of this page legitimately has nothing to say. Hide the head
     with its body rather than leaving "Weakest concepts" over blank space. */
  function section(headId, bodyId, html){
    set(bodyId, html);
    var head = document.getElementById(headId);
    if(head) head.hidden = !html;
  }

  var profiles = M.allProfiles();
  var touched = profiles.filter(function(p){ return p.attempts > 0; });
  // overall() returns null outright when nothing has been attempted, not an
  // object with a null value — so normalize before anything reads .value.
  var overall = M.overall() || { value: null, touched: 0, total: CN.ALL.length };
  var counts = M.counts();

  /* ---- headline ------------------------------------------------------
     Two numbers, not one. Strength alone is misleading early on: 90% across
     the three concepts you have tried is not 90% of organic chemistry, and
     a single percentage invites exactly that reading. Coverage sits next to
     it so the number is always qualified by how much of the map it covers. */
  set('overallCard',
    '<div><div class="k">Concept mastery</div><div class="big">' +
      (overall.value === null ? '—' : pct(overall.value) + '%') + '</div></div>' +
    '<div style="max-width:320px;font-size:13.5px;font-weight:700;opacity:.85;">' +
      (overall.value === null
        ? 'Answer questions in any lesson, or start a Practice session, and your concept mastery starts building here.'
        : 'Across ' + plural(overall.touched, 'concept') + ' you have actually attempted, out of ' +
          overall.total + ' in the course. Strength decays over time, so this moves down on its own if you stop practicing.') +
    '</div>');

  /* ---- snapshot ---- */
  var leeches = M.leeches();
  set('masterySnapshot', !touched.length ? '' :
    '<div class="snapshot">' +
      '<div class="cell"><div class="k">Mastered</div><div class="v">' + (counts.mastered || 0) + '</div></div>' +
      '<div class="cell"><div class="k">Solid</div><div class="v">' + (counts.solid || 0) + '</div></div>' +
      '<div class="cell"><div class="k">Shaky</div><div class="v">' + ((counts.shaky || 0) + (counts.developing || 0)) + '</div></div>' +
      '<div class="cell"><div class="k">Due now</div><div class="v">' + M.due(200).length + '</div></div>' +
      '<div class="cell"><div class="k">Day streak</div><div class="v">' + M.streakDays() + '</div></div>' +
    '</div>');

  /* ---- benched concepts ----------------------------------------------
     A leech is the one thing on this page that is not a score but an
     instruction. Practice has stopped serving it on purpose, so if this page
     showed it as just another weak concept the student would have no idea
     why it never comes up. */
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
        '. That usually means the gap is further back — these feed into it and are also weak:</div>' +
      '<div class="prereqs">' + chips + '</div>' +
    '</div>';
  }).join(''));

  /* ---- what to do next ---- */
  var weakest = M.weakest(1, 2)[0];
  var dueNow = M.due(200);
  var recCards = [];
  if(dueNow.length){
    recCards.push('<div class="rec-card"><div class="k">Scheduled</div><div class="v">' +
      '<a href="review.html">' + plural(dueNow.length, 'concept') + ' due for review &rarr;</a></div></div>');
  }
  if(weakest){
    recCards.push('<div class="rec-card"><div class="k">Weakest concept</div><div class="v">' +
      '<a href="practice.html?concept=' + esc(weakest.id) + '">' + esc(weakest.concept.title) +
      ' — ' + pct(weakest.strength) + '% &rarr;</a></div></div>');
  }
  if(!recCards.length){
    var nextUnlocked = null;
    C.MODULES.some(function(m){
      return m.topics.some(function(t){
        if(t.href && M.topicStrength(t.id).strength === null){ nextUnlocked = t; return true; }
        return false;
      });
    });
    recCards.push(nextUnlocked
      ? '<div class="rec-card"><div class="k">Start here</div><div class="v"><a href="' + nextUnlocked.href + '">' + esc(nextUnlocked.title) + ' &rarr;</a></div></div>'
      : '<div class="rec-card"><div class="k">Get started</div><div class="v"><a href="learn.html">Open the curriculum &rarr;</a></div></div>');
  }
  set('recRow', recCards.join(''));

  /* ---- concept families ----------------------------------------------
     The breakdown the engine itself thinks in. Families cut across modules
     on purpose — "Electron flow" shows up in substitution, addition, and
     carbonyl chemistry alike — so this is the view that shows a weakness
     that is really one idea failing in five places. */
  section('familyHead', 'familyStats', !touched.length ? '' :
    '<div class="module-card">' + M.familyRollup().map(function(f){
      if(f.strength === null){
        return '<div class="mstat-row empty"><span class="name">' + esc(f.family) + '</span><span class="track"></span><span class="pct">—</span></div>';
      }
      return '<div class="mstat-row"><span class="name">' + esc(f.family) +
        '</span><span class="track"><span class="fill" style="width:' + pct(f.strength) + '%"></span></span>' +
        '<span class="pct">' + pct(f.strength) + '%</span></div>';
    }).join('') + '</div>');

  /* ---- weakest concepts, with a way to act on each ---- */
  var weakList = M.weakest(8, 2);
  section('weakHead', 'weakConcepts', !weakList.length ? '' :
    '<div class="module-card">' + weakList.map(function(p){
      var s = p.strength === null ? 0 : p.strength;
      var sub = p.band.label + ' · ' + p.correct + '/' + p.attempts +
        (p.isDue ? ' · due now' : (p.dueIn !== null && p.dueIn > 0 ? ' · back in ' + plural(p.dueIn, 'day') : ''));
      return '<div class="concept-row">' +
        '<span class="name">' + esc(p.concept.title) + '<small>' + esc(sub) + '</small></span>' +
        '<span class="track"><span class="fill ' + fillClass(s) + '" style="width:' + pct(s) + '%"></span></span>' +
        '<span class="pct">' + pct(s) + '%</span>' +
        '<a class="drill" href="practice.html?concept=' + esc(p.id) + '">Drill</a>' +
      '</div>';
    }).join('') + '</div>');

  /* ---- modules, rolled up from concepts ---- */
  section('moduleHead', 'moduleStats', !touched.length ? '' : '<div class="module-card">' +
    C.MODULES.map(function(m){
      var r = M.topicsStrength(m.topics.map(function(t){ return t.id; }));
      if(r.strength === null){
        return '<div class="mstat-row empty"><span class="name">' + esc(m.title) + '</span><span class="track"></span><span class="pct">—</span></div>';
      }
      return '<div class="mstat-row"><span class="name">' + esc(m.title) + '</span>' +
        '<span class="track"><span class="fill" style="width:' + pct(r.strength) + '%"></span></span>' +
        '<span class="pct">' + pct(r.strength) + '%</span></div>';
    }).join('') + '</div>');
})();
