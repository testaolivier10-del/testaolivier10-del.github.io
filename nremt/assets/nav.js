/* NREMT course nav: declares this course's tabs and its localStorage
   namespaces, then hands the rest to the shared site chrome
   (assets/site-chrome.js), which draws the identical two-row header every
   LevlPrep course uses. Everything this file used to own — the header markup,
   the theme toggle, the service-worker registration, the overflow-fade on the
   tab row — now lives there, so NREMT and Organic Chemistry can't drift apart
   again.

   What stays here: the tab list, the subpage active-state rules, the
   window.LevlXP shim the quiz pages were written against, and the sync
   namespace. */
(function(){
  // The same eight tabs, in the same order, as every LevlPrep course: Home,
  // Learn, Practice, Review, Exams, Glossary, Tools, Dashboard. Search is not
  // a tab (the header reaches it), and neither is the old Study Plan, whose
  // countdown is now a card on the Dashboard.
  var NAV_ITEMS = [
    // The wordmark goes to the LevlPrep hub now, so the course's own homepage
    // needs a tab — otherwise there'd be no way back to it from a quiz.
    { href: 'index.html', label: 'Home' },
    { href: 'study-notes.html', label: 'Learn' },
    { href: 'practice.html', label: 'Practice' },
    { href: 'review.html', label: 'Review' },
    { href: 'exams.html', label: 'Exams' },
    { href: 'glossary.html', label: 'Glossary' },
    { href: 'tools.html', label: 'Tools' },
    { href: 'dashboard.html', label: 'Dashboard' }
  ];

  // Pages that live "under" a tab but keep their own URL — that tab should
  // still read as active on them. Learn is the reading (the notes and the
  // mnemonics); Tools is everything interactive that is not a question set;
  // flashcards are a Practice mode; exam-day is about the exam itself.
  var SUBPAGES = {
    'study-notes.html': ['mnemonics.html'],
    'practice.html': ['flashcards.html'],
    'exams.html': ['exam-day.html'],
    'tools.html': ['body-map.html', 'sound-trainer.html', 'scenario-sim.html', 'skillsheets.html', 'flowcharts.html', 'formulary.html', 'reference-cards.html']
  };

  function currentFile(){
    var p = location.pathname.split('/').pop();
    return p || 'index.html';
  }

  // ---- XP, levels & streak now live in the shared assets/hub-progress.js so
  // NREMT, ochem and the hub page all report the same level and the same
  // streak. What stays here is the NREMT-flavored shim the quiz pages already
  // call (window.LevlXP), so practice.html and dashboard.html keep working
  // against the API they were written against. ----

  // Per-domain XP bonuses for crossing accuracy milestones (needs a minimum
  // sample size so an early lucky streak on 3 questions can't claim a
  // "mastery" tier).
  var DOMAIN_TIER_THRESHOLDS = [
    { pct: 70, minTotal: 20, xp: 30 },
    { pct: 85, minTotal: 20, xp: 50 },
    { pct: 95, minTotal: 20, xp: 75 },
  ];

  function HP(){ return window.HubProgress; }

  // Shape kept identical to the old nremt_xp record: { total, domainTiers }.
  // `total` is now the SHARED total (what the level is computed from), which
  // is what every caller used it for.
  function loadXp(){
    var hp = HP();
    if(!hp) return { total: 0, domainTiers: {} };
    return { total: hp.xp().total, domainTiers: hp.badges('nremt').domainTiers || {} };
  }
  function awardXp(amount, domainTierUpdates){
    var hp = HP();
    if(!hp) return { total: 0, domainTiers: {} };
    var opts = null;
    if(domainTierUpdates){
      var tiers = Object.assign({}, hp.badges('nremt').domainTiers || {}, domainTierUpdates);
      opts = { badges: { domainTiers: tiers } };
    }
    hp.award('nremt', amount, opts);
    return loadXp();
  }

  window.LevlXP = {
    loadXp: loadXp,
    awardXp: awardXp,
    xpForLevel: function(n){ return HP() ? HP().xpForLevel(n) : 0; },
    levelForXp: function(x){ return HP() ? HP().levelForXp(x) : 1; },
    titleForLevel: function(l){ return HP() ? HP().titleForLevel(l, 'nremt') : ''; },
    renderLevelBadge: function(){ if(HP()) HP().renderChips(); },
    renderNavStreak: function(){ if(HP()) HP().renderChips(); },
    // Shared daily streak: studying ANY subject keeps it alive.
    recordActivity: function(n){ return HP() ? HP().recordActivity('nremt', n) : null; },
    streak: function(){ return HP() ? HP().streak() : { current: 0, longest: 0, todayCount: 0, goal: 20, metToday: false, days: {} }; },
    DOMAIN_TIER_THRESHOLDS: DOMAIN_TIER_THRESHOLDS,
  };

  function renderHeader(){
    var cur = currentFile();
    if(!window.LevlChrome) return;
    window.LevlChrome.render({
      subject: 'nremt',
      course: 'NREMT-EMT Prep',
      courseHref: 'index.html',
      progressHref: 'dashboard.html',
      items: NAV_ITEMS.map(function(item){
        return {
          href: item.href,
          label: item.label,
          active: item.href === cur || (SUBPAGES[item.href] || []).indexOf(cur) !== -1
        };
      })
    });
  }

  window.LevlChrome && window.LevlChrome.registerServiceWorker();

  // ---- Accounts & cross-device sync now live in the shared
  // assets/account.js (loaded before this file on every page). All this file
  // does is declare which localStorage keys belong to NREMT, so the shared
  // sync writes them into their own namespace and can never be clobbered by
  // another subject's push. ----
  var PROGRESS_KEYS = [
    'nremt_seen_questions', 'nremt_exam100_missed', 'nremt_exam100_flagged',
    'nremt_exam100_history', 'nremt_exam100_best', 'nremt_mastery',
    'nremt_domain_stats_all', 'nremt_streak', 'nremt_xp',
    // The flashcard schedule (flashcards.html). Registered here, on every
    // page, not by the deck: a push replaces the whole 'nremt' bucket, so a
    // key only the deck registered would be dropped by a sync from any other
    // page. Merged card by card, newest grade wins.
    'nremt_flashcards_v1'
  ];
  // Deliberately left out of sync: nremt_inprogress_exam (an in-progress
  // attempt is device-local to avoid two devices racing on the same quiz),
  // nremt_option_order (just per-browser answer-shuffle display order), and
  // nremt_theme (a display preference, not progress).
  //
  // nremt_streak and nremt_xp stay listed even though hub-progress.js has
  // migrated off them: a device that hasn't run the migration yet still needs
  // them to arrive, and they cost nothing once it has.
  if(window.StudyHubAccount){
    window.StudyHubAccount.registerNamespace('nremt', PROGRESS_KEYS,
      window.StudyHubAccount.mergeCardSchedules ? { 'nremt_flashcards_v1': window.StudyHubAccount.mergeCardSchedules } : null);
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', renderHeader);
  } else {
    renderHeader();
  }
})();
