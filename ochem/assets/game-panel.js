/* The progression panel at the top of dashboard.html.

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
  if(!XP || !HP || !window.LevlHub) return;

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
    var H = window.LevlHub;
    if(!H) return;
    var info = HP.levelInfo('ochem');
    var streak = HP.streak();
    var mine = info.subjects.ochem || 0;
    // The level is site-wide, so say so plainly rather than implying this
    // course earned all of it.
    set('gameLevel', H.level(info, { xpLine: mine.toLocaleString() + ' XP earned in Organic Chemistry &middot; ' + info.total.toLocaleString() + ' site-wide', sub: [H.streakLine(streak)] }));
  }

  /* ---- daily Rounds ---------------------------------------------------- */

  function renderRounds(){
    var q = XP.quest();
    var streak = XP.roundsStreak(false);
    var done = Math.min(q.done, q.target);
    var complete = q.done >= q.target;
    set('gameRounds', window.LevlHub.panel({ id: 'oc-rounds', title: 'Daily Rounds',
      body: window.LevlHub.row({ label: 'Today', value: done / q.target, text: done + ' / ' + q.target, tier: complete ? { label: 'Done', lvl: 4 } : null,
          note: complete ? 'Done for today. Tomorrow refills from what’s due next.' : plural(q.target - done, 'question') + ' to go, from what’s due today.',
          action: complete ? null : { href: base + 'review.html', label: 'Start Rounds' } }) +
        (streak > 1 ? '<p class="cx-hint" style="margin:6px 0 0">' + streak + ' days of Rounds in a row.</p>' : '') }));
  }

  /* ---- review debt ------------------------------------------------------ */

  var DEBT_COPY = {
    clear:    { label: 'Clear',    line: 'Nothing overdue.' },
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
    var lvl = { clear: 4, light: 3, building: 2, heavy: 1 }[d.level] || 0;
    set('gameDebt', window.LevlHub.panel({ id: 'oc-debt', title: 'Review debt',
      body: '<div class="cx-row" style="border-top:0"><div class="cx-row-top"><span class="cx-row-name">' + plural(d.count, 'concept') + ' due</span><span class="cx-row-val">' + window.LevlHub.chip({ label: copy.label, lvl: lvl }) + '</span></div>' +
        '<div class="cx-row-foot"><span>' + (d.worstDays > 0 ? 'The oldest is ' + plural(d.worstDays, 'day') + ' past due. ' : '') + copy.line + '</span></div></div>' }));
  }

  /* ---- concept badges ---------------------------------------------------- */

  function renderConceptBadges(){
    var counts = XP.conceptTierCounts();
    var total = M && window.OchemConcepts ? window.OchemConcepts.ALL.length : 0;
    var rows = XP.CONCEPT_TIERS.map(function(t){
      var n = counts[t.key];
      return window.LevlHub.row({ label: t.label, value: total ? n / total : 0, text: n + (total ? ' / ' + total : '') });
    }).join('');
    set('gameConcepts', window.LevlHub.panel({ id: 'oc-tiers', title: 'Concept badges', hint: 'Earned on strength, not accuracy. Strength decays; a badge doesn’t.', body: rows }));
  }

  /* ---- achievements ------------------------------------------------------ */

  function renderAchievements(){
    var list = XP.achievements();
    // Each with its own icon, greyed until earned (audit 2026-10); the blurb
    // says how to earn it.
    set('gameAchievements', window.LevlHub.badges(list.map(function(a){
      return { icon: a.icon, label: a.label, earned: a.earned, title: a.blurb, aria: a.label + ': ' + (a.earned ? 'earned' : 'not yet. ' + a.blurb) };
    }), { id: 'oc-ach', title: 'Achievements' }));
  }

  renderLevel();
  renderRounds();
  renderDebt();
  renderConceptBadges();
  renderAchievements();
})();
