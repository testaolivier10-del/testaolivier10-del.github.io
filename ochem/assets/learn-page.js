/* Renders the module/topic list on learn.html from curriculum.js. Split into
   its own file (rather than an inline <script> in learn.html) because the
   site's CI link-checker scans raw HTML for href="..." — a plain-text match
   against generated markup like href="' + t.href + '" would misfire as a
   broken link, since it never runs the JS to see the real value. */
(function(){
  var list = document.getElementById('moduleList');
  var C = window.OchemCurriculum;

  list.innerHTML = C.MODULES.map(function(mod, i){
    var mastery = C.moduleMastery(mod);
    var masteryLabel = mastery === null ? 'Not started' : mastery + '%';
    var topicsHtml = mod.topics.map(function(t){
      if(t.href){
        var score = C.topicMastery(t.id);
        var badge = score === null
          ? '<span class="badge ready">Start</span>'
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
