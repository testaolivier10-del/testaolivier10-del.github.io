/* Shared markup for the study pages (docs/course-shell.md, W-C).

   Each course's engine works out its own numbers; these helpers turn them
   into the same HTML in every course, so a "Your numbers" rail, an empty
   review queue or a free-tier line cannot drift apart again. Styles are in
   assets/course/study.css and base.css. No storage, no course names.

     LevlStudy.rail({ stats, due, links })   the right-hand rail
     LevlStudy.stat(label, num, sub, cls)    one .cx-stat tile
     LevlStudy.empty({ num, unit, h, p, actions })   a .cx-empty card body
     LevlStudy.actions([{ href|act, label, primary }])
     LevlStudy.free(html)                    the .cx-free line under Start
     LevlStudy.streak()                      the shared day streak (HubProgress) */
(function(){
  function esc(s){ return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function plural(n, w, ws){ return n + ' ' + (n === 1 ? w : (ws || w + 's')); }
  function stat(label, num, sub, cls){
    return '<div class="cx-stat' + (cls ? ' ' + cls : '') + '"><div class="cx-stat-label">' + label + '</div>' +
      '<div class="cx-stat-num">' + num + '</div>' + (sub ? '<div class="cx-stat-sub">' + sub + '</div>' : '') + '</div>';
  }
  function actions(list){
    return '<div class="cx-actions">' + (list || []).map(function(a){
      var cls = a.primary ? 'btn-press sm' : 'btn-outline';
      return a.href ? '<a class="' + cls + '" href="' + esc(a.href) + '">' + a.label + '</a>'
        : '<button type="button" class="' + cls + '" data-act="' + esc(a.act) + '"' + (a.attrs || '') + '>' + a.label + '</button>';
    }).join('') + '</div>';
  }
  /* o.stats: [[label, num, sub, cls]]; o.due: { n, href, pill, noun };
     o.links: [{ href, title, sub }] (siblings: Flashcards, Exams, ...). */
  function rail(o){
    o = o || {};
    var due = o.due;
    return '<aside class="cx-rail" aria-labelledby="cx-rail-h">' +
      '<h2 class="cx-rail-h" id="cx-rail-h">Your numbers</h2>' +
      '<div class="cx-stats">' + (o.stats || []).map(function(s){ return stat(s[0], s[1], s[2], s[3]); }).join('') + '</div>' +
      (due ? '<div class="cx-card cx-qcard"><p class="cx-kicker">Review queue' + (due.pill || '') + '</p>' +
        (due.n ? '<h3>' + plural(due.n, due.noun || 'item') + ' due now</h3><p>' + (due.text || 'What you missed comes back on a spacing schedule, so it sticks. Clear it before new work.') + '</p>'
               : '<h3>Your queue is clear</h3><p>' + (due.text || 'What you miss comes back here on a spacing schedule, so it sticks.') + '</p>') +
        '<a class="cx-more" href="' + esc(due.href || 'review.html') + '">' + (due.n ? 'Start your review' : 'Open review') + ' <span aria-hidden="true">&rarr;</span></a>' +
        '</div>' : '') +
      (o.links && o.links.length ? '<nav class="cx-links" aria-label="More ways to study">' + o.links.map(function(l){
        return '<a class="cx-link" href="' + esc(l.href) + '"><b>' + l.title + (l.sub ? '<small>' + l.sub + '</small>' : '') + '</b><span aria-hidden="true">&rarr;</span></a>';
      }).join('') + '</nav>' : '') +
    '</aside>';
  }
  /* The review empty state: the due-count tile, a heading, a sentence and
     the actions (Practice / Next lesson / Flashcards). */
  function empty(o){
    return '<div class="cx-empty"><div class="cx-empty-num">' + (o.num || 0) + '<small>' + (o.unit || 'due now') + '</small></div>' +
      '<div><h2>' + o.h + '</h2>' + (o.p ? '<p>' + o.p + '</p>' : '') + (o.extra || '') + actions(o.actions) + '</div></div>';
  }
  function free(html){ return html ? '<p class="cx-free">' + html + '</p>' : ''; }
  function streak(){
    try{ var s = window.HubProgress && window.HubProgress.streak(); return s ? s.current : 0; }catch(e){ return 0; }
  }
  window.LevlStudy = { rail: rail, stat: stat, empty: empty, actions: actions, free: free, streak: streak, esc: esc, plural: plural };
})();
