/* The progression panel at the top of mastery.html.

   Everything here is a view over state something else already owns: the level
   comes from the shared hub engine, the badges and quest from ochem-xp.js,
   and the due queue from the mastery engine. Nothing is computed twice.

   Kept out of an inline <script> for the same reason as mastery-page.js: the
   site's CI checker textually scans .html files for href="..." and would
   misfire on the generated href="' + base + '..." pattern. */
(function(){
  var XP = window.OchemXP;
  var HP = window.HubProgress;
  var M = window.OchemMastery;
  if(!XP || !HP) return;

  var base = window.OCHEM_BASE || '';

  function esc(s){
    return String(s).replace(/[&<>"]/g, function(c){
      return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c];
    });
  }
  function set(id, html){ var el = document.getElementById(id); if(el) el.innerHTML = html; }
  function plural(n, w){ return n + ' ' + w + (n === 1 ? '' : 's'); }

  /* ---- level ---------------------------------------------------------- */

  function renderLevel(){
    var info = HP.levelInfo('ochem');
    var streak = HP.streak();
    var fill = Math.round(info.into / info.span * 100);
    var mine = info.subjects.ochem || 0;
    // The level is site-wide, so say so plainly rather than implying this
    // course earned all of it.
    var elsewhere = info.total - mine;
    var note = elsewhere > 0
      ? '<p class="game-note">' + mine + ' XP earned here, ' + elsewhere + ' XP elsewhere on LevlPrep — one level across every subject.</p>'
      : '';
    set('gameLevel',
      '<div class="game-level">' +
        '<div class="game-level-top">' +
          '<span class="game-ring">L' + info.level + '</span>' +
          '<div>' +
            '<p class="game-level-title">' + esc(info.title) + '</p>' +
            '<p class="game-level-sub">' + info.total + ' XP total' +
              (streak.current ? ' &middot; ' + streak.current + '-day streak' : '') + '</p>' +
          '</div>' +
        '</div>' +
        '<div class="game-track"><div class="game-fill" style="width:' + fill + '%"></div></div>' +
        '<p class="game-level-sub">' + info.into + ' / ' + info.span + ' XP to Level ' + (info.level + 1) + '</p>' +
        note +
      '</div>');
  }

  /* ---- daily Rounds ---------------------------------------------------- */

  function renderRounds(){
    var q = XP.quest();
    var streak = XP.roundsStreak(false);
    var done = Math.min(q.done, q.target);
    var pct = Math.round(done / q.target * 100);
    var complete = q.done >= q.target;
    var body = complete
      ? '<p class="game-card-body">Done for today. Come back tomorrow — the queue refills with whatever is due next.</p>'
      : '<p class="game-card-body">' + plural(q.target - done, 'question') + ' to go. These are the concepts the review schedule says are due <em>today</em>, so this is the highest-value work available.</p>';
    set('gameRounds',
      '<div class="game-card' + (complete ? ' done' : '') + '">' +
        '<div class="game-card-head">' +
          '<span class="game-card-title">Daily Rounds</span>' +
          '<span class="game-pill">' + done + ' / ' + q.target + '</span>' +
        '</div>' +
        '<div class="game-track sm"><div class="game-fill" style="width:' + pct + '%"></div></div>' +
        body +
        (streak > 1 ? '<p class="game-note">' + streak + ' days of Rounds in a row.</p>' : '') +
        (complete ? '' : '<a class="game-cta" href="' + base + 'review.html">Start Rounds &rarr;</a>') +
      '</div>');
  }

  /* ---- review debt ------------------------------------------------------ */

  var DEBT_COPY = {
    clear:    { label: 'Clear',    line: 'Nothing is overdue. Everything you have learned is on schedule.' },
    light:    { label: 'Light',    line: 'A short queue. One sitting clears it.' },
    building: { label: 'Building', line: 'The queue is growing faster than you are clearing it.' },
    heavy:    { label: 'Heavy',    line: 'A lot is overdue. Start with the oldest — those are the ones actually fading.' },
  };

  function renderDebt(){
    var d = XP.reviewDebt();
    var copy = DEBT_COPY[d.level];
    // Deliberately not a streak: missing a day costs nothing, it just shows
    // you the backlog. A meter you can always empty beats a counter you can
    // permanently lose.
    set('gameDebt',
      '<div class="game-card debt-' + d.level + '">' +
        '<div class="game-card-head">' +
          '<span class="game-card-title">Review debt</span>' +
          '<span class="game-pill">' + copy.label + '</span>' +
        '</div>' +
        '<p class="game-big">' + d.count + '</p>' +
        '<p class="game-card-body">' + (d.count ? plural(d.count, 'concept') + ' due' +
          (d.worstDays > 0 ? ', the oldest ' + plural(d.worstDays, 'day') + ' past due. ' : '. ') : '') +
          copy.line + '</p>' +
      '</div>');
  }

  /* ---- concept badges ---------------------------------------------------- */

  function renderConceptBadges(){
    var counts = XP.conceptTierCounts();
    var total = M && window.OchemConcepts ? window.OchemConcepts.ALL.length : 0;
    var rows = XP.CONCEPT_TIERS.map(function(t, i){
      var n = counts[t.key];
      var pct = total ? Math.round(n / total * 100) : 0;
      return '<div class="tier-row">' +
        '<span class="tier-name tier-' + t.key + '">' + esc(t.label) + '</span>' +
        '<div class="game-track sm"><div class="game-fill" style="width:' + pct + '%"></div></div>' +
        '<span class="tier-count">' + n + (total ? ' / ' + total : '') + '</span>' +
      '</div>';
    }).join('');
    set('gameConcepts',
      '<div class="game-card">' +
        '<div class="game-card-head"><span class="game-card-title">Concept badges</span></div>' +
        '<p class="game-card-body">Earned on the mastery engine’s strength estimate, not on accuracy — so a badge means you still know it, not that you once had a good run. Strength decays, but a badge you earned is never taken back.</p>' +
        rows +
      '</div>');
  }

  /* ---- achievements ------------------------------------------------------ */

  function renderAchievements(){
    var list = XP.achievements();
    set('gameAchievements', list.map(function(a){
      return '<div class="badge" title="' + esc(a.blurb) + '">' +
        '<div class="badge-circle' + (a.earned ? '' : ' locked') + '">' + (a.earned ? a.icon : '🔒') + '</div>' +
        '<span>' + esc(a.label) + '</span>' +
      '</div>';
    }).join(''));
  }

  /* ---- compact strip for the course home page ---------------------------
     Only rendered once there is something to resume, so a first-time visitor
     meets the pitch rather than an empty scoreboard. */
  function renderHome(){
    var el = document.getElementById('gameHome');
    if(!el) return;
    var info = HP.levelInfo('ochem');
    var mine = info.subjects.ochem || 0;
    var debt = XP.reviewDebt();
    var q = XP.quest();
    if(!mine && !debt.count) return;

    var done = Math.min(q.done, q.target);
    var next = debt.count
      ? { href: base + 'review.html', label: 'Review ' + plural(debt.count, 'due concept') + ' \u2192' }
      : { href: base + 'practice.html', label: 'Practice something new \u2192' };

    el.innerHTML =
      '<div class="home-strip">' +
        '<span class="game-ring sm">L' + info.level + '</span>' +
        '<div class="home-strip-main">' +
          '<p class="home-strip-title">' + esc(info.title) + '</p>' +
          '<p class="home-strip-sub">' + mine + ' XP here &middot; Daily Rounds ' + done + '/' + q.target +
            (debt.count ? ' &middot; ' + plural(debt.count, 'concept') + ' due' : ' &middot; nothing overdue') + '</p>' +
        '</div>' +
        '<a class="btn-press" href="' + next.href + '">' + next.label + '</a>' +
      '</div>';
    el.hidden = false;
  }

  renderLevel();
  renderRounds();
  renderDebt();
  renderConceptBadges();
  renderAchievements();
  renderHome();
})();
