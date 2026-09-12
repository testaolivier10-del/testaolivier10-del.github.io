/* Shared site header: renders the flat nav bar into #site-header and
   highlights the current page/section. Keeps every page in sync from one
   file instead of each page hand-copying its own nav markup. */
(function(){
  // The account-wide Study Hub landing page (a separate repo/site) that
  // lists this app as one of several products. Kept as its own link
  // (rather than repurposing the brand logo for it) now that this app has
  // a real homepage of its own to link to.
  var HUB_URL = '/';

  var NAV_ITEMS = [
    { href: 'practice.html', label: 'Practice' },
    { href: 'study-plan.html', label: 'Study Plan' },
    { href: 'study-notes.html', label: 'Notes' },
    { href: 'mnemonics.html', label: 'Mnemonics' },
    { href: 'glossary.html', label: 'Glossary' },
    { href: 'tools.html', label: 'Tools' },
    { href: 'dashboard.html', label: 'Dashboard' }
  ];

  // Pages that live "under" Tools (linked from the tools.html hub) but keep
  // their own URL — the Tools nav link should still read as active on them.
  var TOOLS_SUBPAGES = ['tools.html', 'body-map.html', 'sound-trainer.html', 'scenario-sim.html', 'skillsheets.html', 'flowcharts.html', 'search.html'];

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

  function escapeHtml(s){
    return String(s).replace(/[&<>"']/g, function(c){
      return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c];
    });
  }

  var FLAME_SVG =
    '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true">' +
      '<path d="M12 2c1 4-3 5-3 9a3 3 0 006 0c1.5 1 2 3 2 4.5A5.5 5.5 0 0111.5 21 6 6 0 016 15c0-5 4-6 4-9 0-1.5-.5-2.5-1-3.5C10.5 2 11 2 12 2z" fill="currentColor"/>' +
    '</svg>';

  function renderHeader(){
    var mount = document.getElementById('site-header');
    if(!mount) return;
    var cur = currentFile();

    var itemsHtml = NAV_ITEMS.map(function(item){
      var active = item.href === cur || (item.href === 'tools.html' && TOOLS_SUBPAGES.indexOf(cur) !== -1);
      return '<a href="' + item.href + '" class="nav-link' + (active ? ' active' : '') + '"' +
        (active ? ' aria-current="page"' : '') +
        '>' + escapeHtml(item.label) + '<span class="rule"></span></a>';
    }).join('');

    mount.innerHTML =
      '<div class="site-header__inner">' +
        '<span class="site-header__brand-row">' +
          '<a class="hub-back" href="' + HUB_URL + '" title="Back to Study Hub" aria-label="Back to Study Hub">&larr;</a>' +
          '<a class="site-header__brand" href="index.html">' +
            '<span class="brand-mark" aria-hidden="true">+</span> LevlPrep' +
          '</a>' +
        '</span>' +
        '<nav class="site-header__groups" aria-label="Site sections">' + itemsHtml + '</nav>' +
        '<div class="nav-right">' +
          '<a href="dashboard.html" class="nav-streak" id="navStreak" title="Daily streak" hidden>' + FLAME_SVG + '<span id="navStreakCount">0</span></a>' +
          '<a href="dashboard.html' + (cur === 'dashboard.html' ? '#levelSection' : '') + '" class="level-badge" id="levelBadge" title="Your level">L1</a>' +
          '<span id="accountSlot"></span>' +
          '<button type="button" class="theme-toggle" id="themeToggle" aria-label="Toggle dark mode" title="Toggle dark mode">\u25D1</button>' +
        '</div>' +
      '</div>';

    var fallback = document.querySelector('.site-nav-fallback');
    if(fallback) fallback.remove();

    // The chips and the account button are filled in by the shared modules.
    // Declaring the NREMT context here is what makes the level badge read
    // "Rig Veteran" rather than the neutral hub rank name.
    if(window.HubProgress) window.HubProgress.mount('nremt', { href: 'dashboard.html' });
    if(window.StudyHubAccount) window.StudyHubAccount.renderAccountUI();

    // The pill row scrolls sideways on a phone with its scrollbar hidden, so
    // theme.css fades its right edge to say so. Drop the fade once there's
    // nothing left to scroll to, otherwise the last pill stays half-dimmed.
    var groups = document.querySelector('.site-header__groups');
    if(groups){
      var syncEnd = function(){
        var atEnd = groups.scrollLeft + groups.clientWidth >= groups.scrollWidth - 2;
        groups.classList.toggle('at-end', atEnd);
      };
      groups.addEventListener('scroll', syncEnd, { passive: true });
      window.addEventListener('resize', syncEnd);
      // Re-measure once layout has actually settled. Called synchronously here
      // the row can still measure as un-scrollable — the stylesheet or the web
      // font may not have applied yet — which wrongly marks it "at end" and
      // drops the fade for good, since nothing scrolls it afterwards.
      syncEnd();
      requestAnimationFrame(syncEnd);
      window.addEventListener('load', syncEnd);
      if(window.ResizeObserver) new ResizeObserver(syncEnd).observe(groups);
      if(document.fonts && document.fonts.ready) document.fonts.ready.then(syncEnd);
      // Open on the page you're actually on, so the current section is never
      // the one parked off-screen.
      var active = groups.querySelector('.nav-link.active');
      if(active && active.offsetLeft + active.offsetWidth > groups.clientWidth){
        groups.scrollLeft = active.offsetLeft - 12;
        syncEnd();
      }
    }

    var toggle = document.getElementById('themeToggle');
    if(toggle) toggle.addEventListener('click', function(){
      var isDark = document.documentElement.getAttribute('data-theme') === 'dark';
      setTheme(isDark ? 'light' : 'dark');
    });

    syncHeaderHeightVar();
  }

  // ---- Exposes the sticky header's real rendered height as --site-header-h
  // so pages with their own sticky elements (e.g. the exam timer bar) can
  // stack directly beneath it instead of overlapping it. Re-measured on
  // resize since the nav wraps to a second line on narrow screens. ----
  function syncHeaderHeightVar(){
    var mount = document.getElementById('site-header');
    if(!mount) return;
    document.documentElement.style.setProperty('--site-header-h', mount.offsetHeight + 'px');
  }
  var headerResizeTimer;
  window.addEventListener('resize', function(){
    clearTimeout(headerResizeTimer);
    headerResizeTimer = setTimeout(syncHeaderHeightVar, 150);
  });

  // ---- Dark mode: applied as early as possible (see the inline snippet in
  // each page's <head>) to avoid a flash of the wrong theme; this just keeps
  // the toggle button and localStorage in sync after that. ----
  var THEME_KEY = 'nremt_theme';
  function setTheme(mode){
    if(mode === 'dark'){
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
    try{ localStorage.setItem(THEME_KEY, mode); }catch(e){}
  }

  // ---- Offline support: register the site-wide service worker once per page
  // load. It lives at the root (not under nremt/) so its scope covers the
  // shared /assets/ modules this app now depends on. ----
  if('serviceWorker' in navigator){
    window.addEventListener('load', function(){
      navigator.serviceWorker.register('/sw.js').catch(function(){ /* offline support is best-effort */ });
    });
  }

  // ---- Accounts & cross-device sync now live in the shared
  // assets/account.js (loaded before this file on every page). All this file
  // does is declare which localStorage keys belong to NREMT, so the shared
  // sync writes them into their own namespace and can never be clobbered by
  // another subject's push. ----
  var PROGRESS_KEYS = [
    'nremt_seen_questions', 'nremt_exam100_missed', 'nremt_exam100_flagged',
    'nremt_exam100_history', 'nremt_exam100_best', 'nremt_mastery',
    'nremt_domain_stats_all', 'nremt_streak', 'nremt_xp'
  ];
  // Deliberately left out of sync: nremt_inprogress_exam (an in-progress
  // attempt is device-local to avoid two devices racing on the same quiz),
  // nremt_option_order (just per-browser answer-shuffle display order), and
  // nremt_theme (a display preference, not progress).
  //
  // nremt_streak and nremt_xp stay listed even though hub-progress.js has
  // migrated off them: a device that hasn't run the migration yet still needs
  // them to arrive, and they cost nothing once it has.
  if(window.StudyHubAccount) window.StudyHubAccount.registerNamespace('nremt', PROGRESS_KEYS);

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', renderHeader);
  } else {
    renderHeader();
  }
})();
