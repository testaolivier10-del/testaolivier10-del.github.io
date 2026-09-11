/* Drives review.html — the spaced repetition queue.

   This page was a stub that said review was "coming once there's more to
   review". It isn't a stub any more: mastery-engine.js schedules every
   concept you practice (SM-2-lite, driven by right/wrong plus question
   difficulty), so there is now a real due date per concept to show.

   Review deliberately does NOT run its own question loop. Practice already
   has one, and a second implementation would drift out of sync with the
   diagnostic engine and the mastery writes. Instead this page shows the
   queue and hands off to practice.html?mode=due, which builds a session from
   exactly these concepts — and serves them inside NEW problems on other
   topics rather than replaying the same cards, which is the whole point of
   spacing a concept rather than a flashcard.

   Kept out of an inline <script> for the same reason as the other page
   scripts: the CI checker scans .html files for literal href/src paths. */
(function(){
  var M  = window.OchemMastery;
  var CO = window.OchemConcepts;
  var mount = document.getElementById('reviewBody');
  if(!mount) return;

  function esc(s){
    return String(s == null ? '' : s)
      .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }
  function pct(x){ return Math.round((x || 0) * 100); }
  function fillClass(s){ return s < 0.45 ? 'low' : s < 0.70 ? 'mid' : s < 0.88 ? '' : 'high'; }
  function plural(n, w){ return n + ' ' + w + (n === 1 ? '' : 's'); }

  function rowsHtml(profiles, whenLabel){
    return profiles.map(function(p){
      var s = p.strength === null ? 0 : p.strength;
      return '<div class="concept-row">' +
        '<span class="name">' + esc(p.concept.title) +
          '<small>' + esc(p.band.label + ' · ' + p.correct + '/' + p.attempts + ' · ' + whenLabel(p)) + '</small></span>' +
        '<span class="track"><span class="fill ' + fillClass(s) + '" style="width:' + pct(s) + '%"></span></span>' +
        '<span class="pct">' + pct(s) + '%</span>' +
      '</div>';
    }).join('');
  }

  var due = M.due();
  var scheduled = M.allProfiles()
    .filter(function(p){ return p.attempts > 0 && !p.isDue && p.due; })
    .sort(function(a, b){ return a.due - b.due; });

  if(!due.length && !scheduled.length){
    mount.innerHTML =
      '<div class="empty-panel">' +
        '<h2>Nothing scheduled yet</h2>' +
        '<p>The review queue fills itself in as you practice: every concept you answer a question on gets a review date, which pushes further out each time you get it right and resets the moment you get it wrong.</p>' +
        '<div style="margin-top:18px;display:flex;gap:10px;justify-content:center;flex-wrap:wrap;">' +
          '<a href="practice.html" class="btn-press sm">Start practicing</a>' +
          '<a href="learn.html" class="btn-press alt sm">Go to Learn</a>' +
        '</div>' +
      '</div>';
    return;
  }

  var html = '';

  if(due.length){
    html += '<div class="rec-card">' +
      '<div class="k">Due now</div>' +
      '<h2>' + esc(plural(due.length, 'concept') + ' ready to resurface') + '</h2>' +
      '<p>These are scheduled for today. Reviewing them inside fresh problems — a resonance idea showing up in an acidity question, not the same card again — is what turns a memorized answer into one you can transfer.</p>' +
      '<div class="actions"><a class="btn-press" href="practice.html?mode=due">Review ' +
        Math.min(10, due.length) + ' now</a></div>' +
    '</div>' +
    '<div class="module-card">' + rowsHtml(due, function(p){
      var overdue = p.dueIn === null ? 0 : -p.dueIn;
      return overdue >= 1 ? plural(overdue, 'day') + ' overdue' : 'due today';
    }) + '</div>';
  } else {
    html += '<div class="empty-panel" style="margin-bottom:22px;">' +
      '<h2>Nothing due today</h2>' +
      '<p>You are caught up. Everything you have practiced is scheduled further out — adaptive practice will keep filling the gaps in the meantime.</p>' +
      '<div style="margin-top:18px"><a href="practice.html" class="btn-press alt sm">Adaptive practice</a></div>' +
    '</div>';
  }

  if(scheduled.length){
    html += '<div style="font:900 11px var(--font-ui);letter-spacing:.06em;text-transform:uppercase;color:var(--muted);margin:26px 0 10px;">Coming back later</div>' +
      '<div class="module-card">' + rowsHtml(scheduled.slice(0, 20), function(p){
        return p.dueIn <= 1 ? 'back tomorrow' : 'back in ' + plural(p.dueIn, 'day');
      }) + '</div>';
    if(scheduled.length > 20){
      html += '<p style="margin-top:10px;font:700 12.5px var(--font-ui);color:var(--muted);">' +
        esc('+ ' + plural(scheduled.length - 20, 'more concept') + ' scheduled further out.') + '</p>';
    }
  }

  var mistakes = M.mistakes({ limit: 50 });
  if(mistakes.length){
    html += '<div style="font:900 11px var(--font-ui);letter-spacing:.06em;text-transform:uppercase;color:var(--muted);margin:26px 0 10px;">Still unresolved</div>' +
      '<div class="next-up">' +
      esc(plural(mistakes.length, 'question') + ' you missed and have not answered correctly since. ') +
      'They stay in rotation until you do. <a href="practice.html?mode=mistakes">Work through them</a>.' +
    '</div>';
  }

  mount.innerHTML = html;
})();
