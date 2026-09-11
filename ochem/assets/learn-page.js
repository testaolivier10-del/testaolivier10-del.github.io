/* Renders the module/topic list on learn.html from curriculum.js. Split into
   its own file (rather than an inline <script> in learn.html) because the
   site's CI link-checker scans raw HTML for href="..." — a plain-text match
   against generated markup like href="' + t.href + '" would misfire as a
   broken link, since it never runs the JS to see the real value. */
(function(){
  var list = document.getElementById('moduleList');
  var C = window.OchemCurriculum;
  var M = window.OchemMastery;

  /* Badges read concept mastery, not the lesson's own check-question score.
     The lesson score measured how you did with the explanation still on
     screen above the question, and it never decayed — so "92%" could sit
     next to a topic Practice had you failing cold. Rolling up the concepts
     the topic covers means Learn, Practice, Review and Mastery are finally
     four views of one number instead of two scores that disagree. */
  function topicPct(topicId){
    var r = M.topicStrength(topicId);
    return r.strength === null ? null : Math.round(r.strength * 100);
  }

  list.innerHTML = C.MODULES.map(function(mod, i){
    var roll = M.topicsStrength(mod.topics.map(function(t){ return t.id; }));
    var mastery = roll.strength === null ? null : Math.round(roll.strength * 100);
    var masteryLabel = mastery === null ? 'Not started' : mastery + '%';
    var topicsHtml = mod.topics.map(function(t){
      if(t.href){
        var score = topicPct(t.id);
        /* "Start" vs "Revisit": a topic whose lesson was finished but whose
           concepts have never been answered cold is not untouched, and
           labelling it Start sends students back through a lesson they
           already did instead of into Practice. */
        var badge = score === null
          ? (C.topicMastery(t.id) === null
              ? '<span class="badge ready">Start</span>'
              : '<span class="badge ready">Revisit</span>')
          : '<span class="badge score">' + score + '%</span>';
        // The notes link jumps straight to the read-only recap (?notes=1)
        // so returning to "what did this lesson say again" never requires
        // re-running the interactive steps.
        return '<div class="topic-row-wrap">' +
          '<a class="topic-row" href="' + t.href + '"><span class="name">' + t.title + '</span>' + badge + '</a>' +
          '<a class="topic-notes-link" href="' + t.href + '?notes=1" title="View lesson notes">&#128221;</a>' +
        '</div>';
      }
      return '<div class="topic-row locked"><span class="name">' + t.title + '</span><span class="badge soon">Coming soon</span></div>';
    }).join('');

    return '<div class="module-card">' +
      '<div class="module-card__head">' +
        '<p class="module-card__title">Module ' + (i+1) + ' — ' + mod.title + '</p>' +
        '<span class="module-card__mastery' + (mastery !== null ? ' scored' : '') + '">' + masteryLabel + '</span>' +
      '</div>' +
      '<div class="topic-list">' + topicsHtml + '</div>' +
    '</div>';
  }).join('');
})();
