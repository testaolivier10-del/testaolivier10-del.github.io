/* LevlPrep progression — one level and one streak across every subject.

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
     { v:1, days: { 'YYYY-MM-DD': { nremt: n, ochem: n } }, longest, goal,
       goalBase, goalAuto, frozen: { 'YYYY-MM-DD': 1 }, freezes, freezeEarned }

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

  /* Streak freezes. The day a student loses a twelve-day streak is very often
     the last day they open the site at all — the run was the reason to come
     back, and one bad Tuesday deletes it. A freeze bridges exactly one missed
     day so that a life event costs a day rather than the habit.

     Earned, not given: a week of real study buys one, and you can hold one at
     a time. That keeps it a safety net rather than a way to have a streak
     without studying, which would make the number mean nothing. */
  var MAX_FREEZES = 1;
  var FREEZE_EARN_STREAK = 7;   // days of streak before the first one is earned
  var FREEZE_EARN_EVERY = 7;    // and at most one per this many days after

  var DEFAULT_GOAL = 20;
  var MIN_GOAL = 5;
  var EASE_WINDOW = 3;          // look back this many days...
  var EASE_MISSES = 2;          // ...and ease off after this many were missed

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
  // for wins. 'hub' is the neutral set the LevlPrep landing page uses.
  var TITLES = {
    hub: [
      { min: 1,  title: 'Student' },
      { min: 3,  title: 'Regular' },
      { min: 6,  title: 'Dedicated' },
      { min: 10, title: 'Scholar' },
      { min: 15, title: 'Veteran' },
      { min: 20, title: 'Master' },
      { min: 30, title: 'LevlPrep Legend' },
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
      // Fields added after v1 shipped. Defaulted on read rather than behind a
      // version bump, so an existing record keeps its streak and its goal and
      // simply gains the new behavior on the next page load.
      s.frozen = s.frozen || {};
      if(typeof s.freezes !== 'number') s.freezes = 0;
      if(typeof s.goal !== 'number') s.goal = DEFAULT_GOAL;
      if(typeof s.goalBase !== 'number') s.goalBase = s.goal;
      if(typeof s.goalAuto !== 'boolean') s.goalAuto = true;
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
    var goal = (legacy && legacy.dailyGoal) || DEFAULT_GOAL;
    var state = {
      v: 1,
      days: days,
      longest: (legacy && legacy.longestStreak) || 0,
      goal: goal,
      // A goal the student picked is theirs and is never moved for them.
      // goalBase is what the adaptive goal eases down from and returns to.
      goalBase: goal,
      goalAuto: true,
      frozen: {},
      freezes: 0,
      freezeEarned: null,
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
    var result = {
      total: state.total,
      gained: amount,
      level: levelForXp(state.total),
      leveledUp: levelForXp(state.total) > before,
      title: titleForLevel(levelForXp(state.total), subject),
    };
    // assets/motion.js listens: the "+N XP" chip, and the level-up toast and
    // confetti. Plain DOM events, so nothing here depends on it having loaded.
    emit('levl:xp', result);
    if(result.leveledUp) emit('levl:levelup', result);
    return result;
  }

  function emit(name, detail){
    try{
      document.dispatchEvent(new CustomEvent(name, { detail: detail }));
    }catch(e){ /* very old browser: no motion, no harm */ }
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

    // Studying is the moment a pending freeze is actually paid for, and the
    // moment a new one can be earned. Both before the write, so one save.
    settleFreezes(state);

    var s = walkStreak(state);
    if(s.current > (state.longest || 0)) state.longest = s.current;
    writeJSON(ACTIVITY_KEY, state);
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

  /* Derived, never stored: walk back from today over days that have activity.
     Today not counting yet is fine — the walk starts at yesterday in that case
     so an evening-only student doesn't watch the flame vanish at midnight.

     A missed day can be bridged, once per walk, by a freeze: one already spent
     on that day, or one the student is holding. A held freeze is only bridged
     PROVISIONALLY here, never written — reading the page must not silently
     spend anything. It is committed by recordActivity when they actually come
     back and study, which is the moment the freeze is for. If they never come
     back, nothing was spent and there is no streak left to protect anyway. */
  /* The earliest day this browser has recorded anything. Day keys are
     'YYYY-MM-DD', so they sort and compare as plain strings.

     Both the walk and the easing rule need this bound. Without it they read
     the blank space before a student's first session as missed days, which is
     wrong in two expensive ways: a freeze gets spent bridging a day before the
     student existed, and a brand-new student is handed the eased-off goal
     meant for someone recovering from a bad week. */
  function firstActiveKey(state){
    var keys = Object.keys(state.days || {});
    if(!keys.length) return null;
    return keys.sort()[0];
  }

  function walkStreak(state){
    var days = state.days, frozen = state.frozen || {};
    var held = state.freezes || 0;
    var firstKey = firstActiveKey(state);
    var cursor = 0;
    if(!dayTotal(days, dayKey(0))) cursor = -1;
    var n = 0, bridged = null, usedHeld = false;
    for(;;){
      var key = dayKey(cursor);
      if(dayTotal(days, key)){ n++; cursor--; continue; }
      // A day already paid for stays bridged for as long as the run lasts, and
      // does not count as a study day — the flame survives, the number does not
      // grow for a day nobody studied.
      if(frozen[key]){ cursor--; continue; }
      // Never bridge past the beginning of this student's history.
      if(firstKey && key < firstKey) break;
      // One unpaid gap may be covered, and only if a freeze is in hand.
      if(!usedHeld && held > 0){
        usedHeld = true;
        bridged = key;
        cursor--;
        continue;
      }
      break;
    }
    // A gap bridged into nothing is not a rescue — it is a freeze about to be
    // spent on a streak that does not exist. Only report one that saved a run.
    if(n === 0) bridged = null;
    return { current: n, bridged: bridged };
  }

  /* The goal the student is actually held to today.

     A fixed 20 is the wrong number for someone who has just missed half a
     week: they come back, see a bar they have no chance of filling, and the
     goal stops being a goal. So after a bad stretch it eases off, and it
     comes straight back to their own number as soon as they are studying
     again. Pure — no writes, so what the dashboard shows and what counts as
     met can never drift apart.

     A goal the student picked by hand is never touched. They said what they
     wanted. */
  function effectiveGoal(state){
    var base = state.goalBase || state.goal || DEFAULT_GOAL;
    if(state.goalAuto === false) return state.goal || base;
    var firstKey = firstActiveKey(state);
    if(!firstKey) return base; // nobody has missed anything yet
    var missed = 0;
    for(var i = 1; i <= EASE_WINDOW; i++){
      var key = dayKey(-i);
      if(key < firstKey) continue; // before they started; not a missed day
      if(!dayTotal(state.days, key) && !(state.frozen || {})[key]) missed++;
    }
    if(missed >= EASE_MISSES) return Math.max(MIN_GOAL, Math.round(base / 2));
    return base;
  }

  function streak(){
    var state = loadActivity();
    var walk = walkStreak(state);
    var todayCount = dayTotal(state.days, dayKey(0));
    var goal = effectiveGoal(state);
    return {
      current: walk.current,
      longest: Math.max(state.longest || 0, walk.current),
      todayCount: todayCount,
      goal: goal,
      // What the student set, or the default — for a settings control, which
      // should show their choice rather than today's eased-off version of it.
      goalBase: state.goalBase || state.goal || DEFAULT_GOAL,
      eased: goal < (state.goalBase || state.goal || DEFAULT_GOAL),
      metToday: todayCount >= goal,
      freezes: state.freezes || 0,
      // Set when a missed day is being held open by a freeze they hold. The UI
      // can say so; studying today is what actually spends it.
      freezePending: walk.bridged,
      days: state.days,
    };
  }

  /* Spend a held freeze on the gap the walk is bridging, and grant a new one
     to a student who has kept a week going. Called from recordActivity only,
     so both only ever happen on a day someone actually studied. */
  function settleFreezes(state){
    var walk = walkStreak(state);
    if(walk.bridged && (state.freezes || 0) > 0){
      state.frozen[walk.bridged] = 1;
      state.freezes -= 1;
      walk = walkStreak(state);
    }
    var earnedAgo = state.freezeEarned ? daysSince(state.freezeEarned) : null;
    if(walk.current >= FREEZE_EARN_STREAK &&
       (state.freezes || 0) < MAX_FREEZES &&
       (earnedAgo === null || earnedAgo >= FREEZE_EARN_EVERY)){
      state.freezes = (state.freezes || 0) + 1;
      state.freezeEarned = dayKey(0);
      emit('levl:freeze-earned', { freezes: state.freezes });
    }
    // Frozen days older than the window the walk can reach are dead weight.
    Object.keys(state.frozen).forEach(function(k){
      if(daysSince(k) > MAX_DAYS) delete state.frozen[k];
    });
  }

  function daysSince(key){
    var p = String(key).split('-');
    var then = new Date(+p[0], +p[1] - 1, +p[2]);
    var now = new Date();
    now = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return Math.round((now - then) / 86400000);
  }

  function setGoal(n){
    var state = loadActivity();
    state.goal = Math.max(1, Math.round(n));
    state.goalBase = state.goal;
    state.goalAuto = false; // their number now, not ours
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
      var title = s.current + '-day study streak, across every subject';
      // Say it on the chip, not just in a settings panel nobody opens: the
      // whole point of a freeze is knowing you have one before you need it.
      if(s.freezePending) title += '. Yesterday is being held open by a streak freeze — study today to keep the run.';
      else if(s.freezes) title += '. ' + s.freezes + ' streak freeze in hand: one missed day will not break it.';
      chip.title = title;
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
