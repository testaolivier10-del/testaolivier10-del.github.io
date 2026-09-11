/* Study Hub progression — one level and one streak across every subject.

   The model the site now uses:

     LEVEL is shared.   One number, earned from everything you study. Your
                        NREMT work and your ochem work push the same bar.
     XP is per-subject. The total drives the level; the per-subject splits
                        are what each subject's own dashboard reports.
     STREAK is shared.  Studying ANY subject keeps the flame alive, because a
                        streak is meant to reward showing up, and punishing
                        someone for doing an hour of ochem instead of an hour
                        of NREMT would be exactly backwards.
     TITLES are local.  The level number is shared, but the name next to it is
                        flavored by where you are: Level 7 is "Rig Veteran" on
                        NREMT and "Mechanism Marshal" on ochem. Same rank, and
                        each subject keeps the voice it had.

   ---------------------------------------------------------------------
   STORAGE

   localStorage['hub_xp_v1']
     { v:1, total, subjects: { nremt: n, ochem: n }, badges: { <subject>: {...} } }

   localStorage['hub_activity_v1']
     { v:1, days: { 'YYYY-MM-DD': { nremt: n, ochem: n } }, longest, goal }

   The streak is DERIVED from `days` rather than stored as a counter. A stored
   counter has to be corrected on read anyway (it reflects the streak as of the
   last active day, which may be long past), and deriving it means two subjects
   writing on the same day can't race each other into double-counting.

   Both keys are migrated once from the NREMT-only records that came before
   (`nremt_xp`, `nremt_streak`), so no existing user loses a level or a streak.
   The old keys are left in place and are not read again after the migration.
   ------------------------------------------------------------------ */
(function(){
  var XP_KEY = 'hub_xp_v1';
  var ACTIVITY_KEY = 'hub_activity_v1';
  var MAX_DAYS = 180;

  // Cumulative XP needed to REACH level n (n >= 1). Quadratic, so each level
  // takes a little longer than the last. Unchanged from the NREMT curve, so
  // migrated users land on exactly the level they already had.
  function xpForLevel(n){ return 100 * (n - 1) * (n - 1); }
  function levelForXp(xp){
    var n = 1;
    while(xpForLevel(n + 1) <= xp) n++;
    return n;
  }

  // Rank names by subject. Index is a minimum level; the last one you qualify
  // for wins. 'hub' is the neutral set the Study Hub landing page uses.
  var TITLES = {
    hub: [
      { min: 1,  title: 'Student' },
      { min: 3,  title: 'Regular' },
      { min: 6,  title: 'Dedicated' },
      { min: 10, title: 'Scholar' },
      { min: 15, title: 'Veteran' },
      { min: 20, title: 'Master' },
      { min: 30, title: 'Study Hub Legend' },
    ],
    nremt: [
      { min: 1,  title: 'First Responder' },
      { min: 3,  title: 'EMT Trainee' },
      { min: 6,  title: 'EMT Candidate' },
      { min: 10, title: 'Field Ready' },
      { min: 15, title: 'Rig Veteran' },
      { min: 20, title: 'Code 3 Pro' },
      { min: 30, title: 'NREMT Legend' },
    ],
    ochem: [
      { min: 1,  title: 'Lewis Apprentice' },
      { min: 3,  title: 'Arrow Pusher' },
      { min: 6,  title: 'Stereochemist' },
      { min: 10, title: 'Mechanism Marshal' },
      { min: 15, title: 'Synthetic Planner' },
      { min: 20, title: 'Reaction Oracle' },
      { min: 30, title: 'Ochem Legend' },
    ],
  };

  // Set by each subject's bootstrap (nav.js / ochem-nav.js) so the header chip
  // knows which vocabulary to use. Defaults to the neutral hub set.
  var context = 'hub';
  function setContext(name){ if(TITLES[name]) context = name; renderChips(); }

  function titleForLevel(level, subject){
    var set = TITLES[subject || context] || TITLES.hub;
    var t = set[0].title;
    for(var i = 0; i < set.length; i++){ if(level >= set[i].min) t = set[i].title; }
    return t;
  }

  /* ---- storage -------------------------------------------------------- */

  function readJSON(key, fallback){
    try{
      var raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    }catch(e){ return fallback; }
  }
  function writeJSON(key, value){
    try{ localStorage.setItem(key, JSON.stringify(value)); }catch(e){}
  }

  function loadXp(){
    var s = readJSON(XP_KEY, null);
    if(s && s.v === 1){
      s.subjects = s.subjects || {};
      s.badges = s.badges || {};
      return s;
    }
    return migrateXp();
  }

  // One-time lift of the NREMT-only record into the shared one. Runs at most
  // once per device; after this hub_xp_v1 is the only thing read.
  function migrateXp(){
    var legacy = readJSON('nremt_xp', null);
    var total = (legacy && legacy.total) || 0;
    var state = {
      v: 1,
      total: total,
      subjects: total ? { nremt: total } : {},
      badges: (legacy && legacy.domainTiers) ? { nremt: { domainTiers: legacy.domainTiers } } : {},
    };
    writeJSON(XP_KEY, state);
    return state;
  }

  function loadActivity(){
    var s = readJSON(ACTIVITY_KEY, null);
    if(s && s.v === 1){
      s.days = s.days || {};
      return s;
    }
    return migrateActivity();
  }

  function migrateActivity(){
    var legacy = readJSON('nremt_streak', null);
    var days = {};
    if(legacy && legacy.dailyCounts){
      Object.keys(legacy.dailyCounts).forEach(function(d){
        days[d] = { nremt: legacy.dailyCounts[d] };
      });
    }
    var state = {
      v: 1,
      days: days,
      longest: (legacy && legacy.longestStreak) || 0,
      goal: (legacy && legacy.dailyGoal) || 20,
    };
    writeJSON(ACTIVITY_KEY, state);
    return state;
  }

  /* ---- XP ------------------------------------------------------------- */

  function dayKey(offsetDays){
    var d = new Date();
    if(offsetDays) d.setDate(d.getDate() + offsetDays);
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  // award('ochem', 120, { badges: { concepts: {...} } })
  // Returns the new state so a caller can show "+120 XP, Level 8!".
  function award(subject, amount, opts){
    opts = opts || {};
    var state = loadXp();
    var before = levelForXp(state.total);
    amount = Math.max(0, Math.round(amount || 0));
    state.total += amount;
    if(subject) state.subjects[subject] = (state.subjects[subject] || 0) + amount;
    if(subject && opts.badges){
      state.badges[subject] = Object.assign(state.badges[subject] || {}, opts.badges);
    }
    writeJSON(XP_KEY, state);
    renderChips();
    return {
      total: state.total,
      gained: amount,
      level: levelForXp(state.total),
      leveledUp: levelForXp(state.total) > before,
    };
  }

  function xp(){ return loadXp(); }
  function subjectXp(subject){ return loadXp().subjects[subject] || 0; }
  function badges(subject){ return loadXp().badges[subject] || {}; }
  function setBadges(subject, value){
    var state = loadXp();
    state.badges[subject] = Object.assign(state.badges[subject] || {}, value);
    writeJSON(XP_KEY, state);
  }

  function level(){ return levelForXp(loadXp().total); }

  // Everything the level UI needs, in one read.
  function levelInfo(subject){
    var state = loadXp();
    var lvl = levelForXp(state.total);
    var prev = xpForLevel(lvl), next = xpForLevel(lvl + 1);
    return {
      level: lvl,
      title: titleForLevel(lvl, subject),
      total: state.total,
      into: state.total - prev,
      span: Math.max(1, next - prev),
      toNext: next - state.total,
      subjects: state.subjects,
    };
  }

  /* ---- streak --------------------------------------------------------- */

  // Called whenever real study activity happens, with the number of questions,
  // cards or steps completed. Any subject counts toward the same streak.
  function recordActivity(subject, n){
    n = Math.max(0, Math.round(n || 0));
    if(!n) return streak();
    var state = loadActivity();
    var today = dayKey(0);
    var isNewDay = !state.days[today];
    state.days[today] = state.days[today] || {};
    state.days[today][subject] = (state.days[today][subject] || 0) + n;

    var keys = Object.keys(state.days).sort();
    while(keys.length > MAX_DAYS){ delete state.days[keys.shift()]; }

    writeJSON(ACTIVITY_KEY, state);

    var s = streak();
    if(s.current > state.longest){
      state.longest = s.current;
      writeJSON(ACTIVITY_KEY, state);
    }
    // First activity of a new calendar day earns the show-up bonus once, no
    // matter how much more gets studied today or in which subject.
    if(isNewDay) award(subject, 15);
    renderChips();
    return streak();
  }

  function dayTotal(days, key){
    var d = days[key];
    if(!d) return 0;
    return Object.keys(d).reduce(function(a, k){ return a + (d[k] || 0); }, 0);
  }

  // Derived, never stored: walk back from today over days that have activity.
  // Today not counting yet is fine — the walk starts at yesterday in that case
  // so an evening-only student doesn't watch the flame vanish at midnight.
  function streak(){
    var state = loadActivity();
    var days = state.days;
    var cursor = 0;
    if(!dayTotal(days, dayKey(0))) cursor = -1;
    var n = 0;
    while(dayTotal(days, dayKey(cursor))){ n++; cursor--; }
    var todayCount = dayTotal(days, dayKey(0));
    return {
      current: n,
      longest: Math.max(state.longest || 0, n),
      todayCount: todayCount,
      goal: state.goal || 20,
      metToday: todayCount >= (state.goal || 20),
      days: days,
    };
  }

  function setGoal(n){
    var state = loadActivity();
    state.goal = Math.max(1, Math.round(n));
    writeJSON(ACTIVITY_KEY, state);
  }

  // Per-day totals for a calendar heatmap, oldest first.
  function activitySeries(numDays){
    var state = loadActivity();
    var out = [];
    for(var i = (numDays || 60) - 1; i >= 0; i--){
      var k = dayKey(-i);
      out.push({ day: k, count: dayTotal(state.days, k), bySubject: state.days[k] || {} });
    }
    return out;
  }

  /* ---- header chips --------------------------------------------------- */

  var FLAME_SVG =
    '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true">' +
      '<path d="M12 2c1 4-3 5-3 9a3 3 0 006 0c1.5 1 2 3 2 4.5A5.5 5.5 0 0111.5 21 6 6 0 016 15c0-5 4-6 4-9 0-1.5-.5-2.5-1-3.5C10.5 2 11 2 12 2z" fill="currentColor"/>' +
    '</svg>';

  // NREMT builds its whole header in nav.js and already provides these slots.
  // Ochem's 81 pages each carry a hand-written header instead, so rather than
  // editing all of them, the chips are injected into whatever header is there
  // and the theme toggle is moved into the same right-hand cluster. Pages with
  // no header at all are left alone.
  //   href: where the chips link (a subject's own progress page). Passed in
  //   rather than looked up, because ochem pages live at three different
  //   folder depths and each needs its own relative path.
  function ensureChipSlots(href){
    if(document.getElementById('levelBadge')) return true;
    var inner = document.querySelector('#site-header .site-header__inner');
    if(!inner) return false;

    function chip(className, id, title, inner_){
      var el = document.createElement(href ? 'a' : 'span');
      if(href) el.setAttribute('href', href);
      el.className = className;
      el.id = id;
      el.title = title;
      el.innerHTML = inner_;
      return el;
    }

    var wrap = document.createElement('div');
    wrap.className = 'nav-right';
    var streakEl = chip('nav-streak', 'navStreak', 'Daily streak', FLAME_SVG + '<span id="navStreakCount">0</span>');
    streakEl.hidden = true;
    wrap.appendChild(streakEl);
    wrap.appendChild(chip('level-badge', 'levelBadge', 'Your level', 'L1'));
    var slot = document.createElement('span');
    slot.id = 'accountSlot';
    wrap.appendChild(slot);

    var toggle = inner.querySelector('.theme-toggle');
    if(toggle) inner.insertBefore(wrap, toggle); else inner.appendChild(wrap);
    if(toggle) wrap.appendChild(toggle);
    return true;
  }

  function renderChips(){
    var badge = document.getElementById('levelBadge');
    if(badge){
      var info = levelInfo();
      badge.textContent = 'L' + info.level;
      badge.title = info.title + ' — ' + info.total + ' XP (' + info.into + '/' + info.span + ' to Level ' + (info.level + 1) + ')';
    }
    var chip = document.getElementById('navStreak');
    if(chip){
      var s = streak();
      chip.hidden = s.current < 1;
      var count = document.getElementById('navStreakCount');
      if(count) count.textContent = s.current;
      chip.title = s.current + '-day study streak, across every subject';
    }
  }

  function mount(subject, opts){
    opts = opts || {};
    if(subject) context = subject;
    ensureChipSlots(opts.href || '');
    renderChips();
    if(window.StudyHubAccount) window.StudyHubAccount.renderAccountUI();
  }

  window.HubProgress = {
    // XP & levels
    award: award, xp: xp, subjectXp: subjectXp, level: level, levelInfo: levelInfo,
    xpForLevel: xpForLevel, levelForXp: levelForXp, titleForLevel: titleForLevel,
    badges: badges, setBadges: setBadges,
    // Streak & activity
    recordActivity: recordActivity, streak: streak, setGoal: setGoal,
    activitySeries: activitySeries, dayKey: dayKey,
    // Chrome
    setContext: setContext, mount: mount, renderChips: renderChips,
    SYNC_KEYS: [XP_KEY, ACTIVITY_KEY],
  };

  // The shared keys belong to their own namespace so every subject syncs the
  // same level and streak rather than each carrying a private copy.
  if(window.StudyHubAccount) window.StudyHubAccount.registerNamespace('hub', [XP_KEY, ACTIVITY_KEY]);
})();
