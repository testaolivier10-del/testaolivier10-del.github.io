/* Renders the mastery dashboard on mastery.html. Kept out of an inline
   <script> for the same reason as learn-page.js: the site's CI checker
   textually scans .html files for href="..." and would misfire on the
   generated href="' + nextUnlocked.topic.href + '" pattern. */
(function(){
  var C = window.OchemCurriculum;
  var overall = C.overallMastery();

  document.getElementById('overallCard').innerHTML =
    '<div><div class="k">Overall mastery</div><div class="big">' + (overall === null ? '—' : overall + '%') + '</div></div>' +
    '<div style="max-width:300px;font-size:13.5px;font-weight:700;opacity:.85;">' +
      (overall === null
        ? 'Answer a few questions in any lesson and your mastery starts building here.'
        : 'Based on ' + Object.keys(JSON.parse(localStorage.getItem('ochem_progress') || '{}')).length + ' concept(s) attempted so far.') +
    '</div>';

  // Concept dependencies: if a topic with known prerequisites is being
  // struggled with (5+ attempts, under 60%), recommend reviewing those
  // instead of just serving more questions on the same topic.
  var alerts = [];
  C.MODULES.forEach(function(m){
    m.topics.forEach(function(t){
      var s = C.strugglingPrerequisites(t.id);
      if(s) alerts.push(s);
    });
  });
  document.getElementById('dependencyAlerts').innerHTML = alerts.map(function(s){
    var chips = s.prerequisites.map(function(p){
      return p.href
        ? '<a href="' + p.href + '">' + p.title + '</a>'
        : '<span>' + p.title + ' (not built yet)</span>';
    }).join('');
    return '<div class="dep-alert">' +
      '<div class="k">Possible gap detected</div>' +
      '<div class="msg">You’re at ' + s.score + '% on ' + s.topic.title + '. That often means a gap further back — try reviewing these first:</div>' +
      '<div class="prereqs">' + chips + '</div>' +
    '</div>';
  }).join('');

  // Weakest scored module + one not-yet-started module, so there's always
  // something concrete to do next even before much has been attempted.
  var scoredModules = C.MODULES
    .map(function(m){ return { mod: m, score: C.moduleMastery(m) }; })
    .filter(function(x){ return x.score !== null; })
    .sort(function(a,b){ return a.score - b.score; });

  var nextUnlocked = null;
  C.MODULES.some(function(m){
    return m.topics.some(function(t){
      if(t.href && C.topicMastery(t.id) === null){ nextUnlocked = { mod: m, topic: t }; return true; }
      return false;
    });
  });

  var recCards = [];
  if(scoredModules.length){
    var weakest = scoredModules[0];
    recCards.push('<div class="rec-card"><div class="k">Weakest module</div><div class="v">' + weakest.mod.title + ' — ' + weakest.score + '%</div></div>');
  }
  if(nextUnlocked){
    recCards.push('<div class="rec-card"><div class="k">Recommended next</div><div class="v"><a href="' + nextUnlocked.topic.href + '">' + nextUnlocked.topic.title + ' →</a></div></div>');
  }
  if(!recCards.length){
    recCards.push('<div class="rec-card"><div class="k">Get started</div><div class="v"><a href="learn.html">Open the curriculum →</a></div></div>');
  }
  document.getElementById('recRow').innerHTML = recCards.join('');

  document.getElementById('moduleStats').innerHTML = '<div class="module-card">' +
    C.MODULES.map(function(m){
      var score = C.moduleMastery(m);
      if(score === null){
        return '<div class="mstat-row empty"><span class="name">' + m.title + '</span><span class="track"></span><span class="pct">—</span></div>';
      }
      return '<div class="mstat-row"><span class="name">' + m.title + '</span>' +
        '<span class="track"><span class="fill" style="width:' + score + '%"></span></span>' +
        '<span class="pct">' + score + '%</span></div>';
    }).join('') +
  '</div>';
})();
