/* Profile (profile.html; owner 2026-11-13, option 1, docs/progress-profile.md): everything about the student
   rather than one course, moved here from each course's Progress page. One column:
     you and your stats   level (shared across courses), streak, longest streak, badges earned
     all time             questions answered, practice exams, lessons, free responses, days studied (every course)
     your courses         each course you have started, folding open: its numbers, the badges earned in it (each
                          with its own art, assets/profile-badges.js), the rest locked and grey with what it
                          takes on hover or tap, ochem's concept badges and achievements, a link to its Progress
     streak               as many weeks as fit, daily goal, streak freezes, study reminders
     your data            kept in this browser, sign in to sync, download a backup
   Profile v2 (owner 2026-11-23, mockup "LevlPrep Profile mockup"): All time is new, and Your courses took in the
   old Badges and certificates card so nothing is listed twice. Only numbers that never go down are shown.
   Nothing new is stored: it reads HubProgress (hub_xp_v1, hub_activity_v1), the courses' own records
   (LevlClassModel.raw) and LevlMilestones, and writes only the daily goal (HubProgress.setGoal), NREMT's
   in-browser reminder and which courses are folded open (levl_profile_open_v1). */
(function(){
  'use strict';
  // courses:begin COURSE_LIST key,name,path,dir (generated from assets/courses.js by scripts/build-courses.mjs; edit there)
  var COURSE_LIST = [
    { key: 'nremt', name: 'NREMT-EMT', path: '/nremt/', dir: 'nremt' },
    { key: 'ochem', name: 'Organic Chemistry', path: '/ochem/', dir: 'ochem' },
    { key: 'anp', name: 'Anatomy & Physiology', path: '/anatomy-physiology/', dir: 'anatomy-physiology' },
    { key: 'apbio', name: 'AP® Biology', path: '/bio/', dir: 'bio' },
    { key: 'apchem', name: 'AP® Chemistry', path: '/chem/', dir: 'chem' },
    { key: 'apphys', name: 'AP® Physics 1', path: '/physics/', dir: 'physics' },
    { key: 'apcalc', name: 'AP® Calculus AB', path: '/calculus/', dir: 'calculus' },
    { key: 'apstat', name: 'AP® Statistics', path: '/statistics/', dir: 'statistics' },
    { key: 'apenv', name: 'AP® Environmental Science', path: '/environmental-science/', dir: 'environmental-science' },
    { key: 'appsych', name: 'AP® Psychology', path: '/psychology/', dir: 'psychology' },
    { key: 'apprecalc', name: 'AP® Precalculus', path: '/precalculus/', dir: 'precalculus' },
    { key: 'apcalcbc', name: 'AP® Calculus BC', path: '/calculus-bc/', dir: 'calculus-bc' },
    { key: 'apmacro', name: 'AP® Macroeconomics', path: '/macroeconomics/', dir: 'macroeconomics' },
    { key: 'apmicro', name: 'AP® Microeconomics', path: '/microeconomics/', dir: 'microeconomics' },
    { key: 'aphug', name: 'AP® Human Geography', path: '/human-geography/', dir: 'human-geography' },
  ];
  // courses:end
  var root = document.getElementById('pfRoot');
  var HP = window.HubProgress;
  if(!root || !HP || !window.LevlBadges) return;
  var DAY = 86400000;
  function esc(s){ return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function plural(n, w, ws){ return n + ' ' + (n === 1 ? w : (ws || w + 's')); }
  function readJSON(k, f){ try{ var r = localStorage.getItem(k); return r ? JSON.parse(r) : f; }catch(e){ return f; } }
  function dayKey(d){ return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }

  function started(){
    var st = HP.streak(), last = {};
    Object.keys(st.days || {}).forEach(function(k){ var d = st.days[k] || {}; Object.keys(d).forEach(function(c){ if(d[c] && (!last[c] || k > last[c])) last[c] = k; }); });
    return COURSE_LIST.map(function(c){ return { c: c, xp: HP.subjectXp(c.key) || 0, last: last[c.key] || null }; })
      .filter(function(x){ return x.xp > 0 || x.last; }).sort(function(a, b){ return (b.last || '').localeCompare(a.last || '') || b.xp - a.xp; });
  }

  function heroCard(st, info){
    var u = window.StudyHubAccount && window.StudyHubAccount.user ? window.StudyHubAccount.user() : null;
    var name = u && u.email ? u.email.split('@')[0] : 'You';
    return '<section class="pf-card pf-hero" aria-labelledby="pfName"><div class="pf-who"><span class="pf-av" aria-hidden="true">' + esc(name.charAt(0).toUpperCase()) + '</span><div>' +
      '<h1 id="pfName">' + esc(name) + '</h1><p class="pf-mut">' + (u ? 'Signed in, synced across devices' : 'Kept in this browser') + '</p></div></div>' +
      '<div class="pf-stats">' +
        '<div class="pf-st"><b>Level ' + info.level + '</b><span>' + Number(info.toNext).toLocaleString() + ' XP to ' + (info.level + 1) + '</span><i class="pf-xp"><i style="width:' + Math.round(info.into / Math.max(1, info.span) * 100) + '%"></i></i></div>' +
        '<div class="pf-st"><b>' + (st.current ? plural(st.current, 'day') : 'No streak') + '</b><span>current streak</span></div>' +
        '<div class="pf-st"><b>' + plural(st.longest || 0, 'day') + '</b><span>longest streak</span></div>' +
        '<div class="pf-st"><b id="pfBadgeN">&ndash;</b><span>badges earned</span></div>' +
      '</div></section>';
  }

  /* ---- the numbers and badges of each course ---- */
  var CM = window.LevlClassModel, LB = window.LevlBadges, LM = window.LevlMilestones;
  function get(k){ try{ return localStorage.getItem(k); }catch(e){ return null; } }
  function courseStats(key, st){
    var part = null;
    try{ part = CM ? CM.raw(key, get) : null; }catch(e){ part = null; }
    return LB.stats(key, part, st.days || {});
  }
  var OPEN_KEY = 'levl_profile_open_v1';
  function openSet(list){
    var o = readJSON(OPEN_KEY, null);
    if(o && typeof o === 'object') return o;
    o = {}; if(list[0]) o[list[0].c.key] = 1;   // first visit: the course studied last is open
    return o;
  }
  function allTimeCard(st){
    var t = { answers: 0, exams: 0, lessons: 0, frq: 0 }, days = 0;
    COURSE_LIST.forEach(function(c){ var s = courseStats(c.key, st); t.answers += s.answers; t.exams += s.exams; t.lessons += s.lessons; t.frq += s.frq; });
    Object.keys(st.days || {}).forEach(function(k){ var d = st.days[k] || {}; if(Object.keys(d).some(function(c){ return d[c] > 0; })) days++; });
    function tile(n, w){ return '<div class="pf-st"><b>' + Number(n).toLocaleString() + '</b><span>' + w + '</span></div>'; }
    return '<section class="pf-card" aria-labelledby="pfA"><h2 id="pfA">All time</h2><div class="pf-stats pf-all">' +
      tile(t.answers, 'questions answered') + tile(t.exams, 'practice exams taken') + tile(t.lessons, 'lessons finished') + tile(t.frq, 'free responses written') + tile(days, 'days studied') + '</div></section>';
  }
  function coursesCard(list, st){
    if(!list.length) return '<section class="pf-card" aria-labelledby="pfC"><h2 id="pfC">Your courses</h2><p class="pf-mut">Start any course and it shows up here, with the badges you earn in it. <a href="/">See every course</a>.</p></section>';
    var open = openSet(list);
    return '<section class="pf-card" aria-labelledby="pfC"><h2 id="pfC">Your courses</h2><div class="pf-cxs">' + list.map(function(x){
      var last = x.last ? (function(){ var p = x.last.split('-').map(Number), d = Math.round((new Date().setHours(0, 0, 0, 0) - new Date(p[0], p[1] - 1, p[2]).getTime()) / DAY); return d <= 0 ? 'studied today' : d === 1 ? 'studied yesterday' : 'last studied ' + plural(d, 'day') + ' ago'; })() : 'not studied recently';
      var k = x.c.key, s = courseStats(k, st);
      var line = [plural(s.answers, 'question') + ' answered', plural(s.exams, 'practice exam'), plural(s.lessons, 'lesson') + ' finished'];
      if(k === 'nremt' && s.best) line.push('best exam ' + s.best + '%');
      return '<details class="pf-cx" data-cx="' + esc(k) + '"' + (open[k] ? ' open' : '') + '><summary><img class="pf-cv" src="/assets/covers/' + esc(k) + '.svg" alt="" width="640" height="320" loading="lazy" decoding="async">' +
        '<span class="pf-cx-t"><b>' + esc(x.c.name) + '</b><small>' + Number(x.xp).toLocaleString() + ' XP &middot; ' + last + '</small></span>' +
        '<span class="pf-cx-n" data-cxn="' + esc(k) + '"></span><span class="pf-cx-v" aria-hidden="true"></span></summary>' +
        '<div class="pf-cx-b"><p class="pf-cx-s">' + line.join(' &middot; ') + '</p><div data-cxb="' + esc(k) + '"></div>' +
        (k === 'ochem' ? '<div class="pf-oc"><div id="gameConcepts"></div><div id="gameAchievements"></div></div>' : '') +
        '<p class="pf-cx-go"><a class="pf-link" href="' + esc(x.c.path) + 'dashboard.html">Open Progress &rarr;</a></p></div></details>';
    }).join('') + '</div></section>';
  }
  /* One course's badges: the earned ones as cards, the rest as a row of locked shapes that say what they are. */
  function badgesHtml(key, list){
    var got = list.filter(function(b){ return b.earned; }), todo = list.filter(function(b){ return !b.earned; });
    var on = got.map(function(b){
      return '<li class="bd">' + LB.art(b, key) + '<b>' + esc(b.label) + '</b>' + (b.sub ? '<small>' + esc(b.sub) + '</small>' : '') +
        (b.cert && LM ? '<a class="bd-cert" href="' + esc(LM.certUrl(key, b.cert)) + '">Certificate<span class="pf-sr">: ' + esc(b.label) + '</span></a>' : '') + '</li>';
    }).join('');
    var off = todo.map(function(b){
      return '<li class="bd is-locked"><button type="button" class="bd-lock" aria-label="Locked badge: ' + esc(b.label) + '. ' + esc(b.tip) + '">' + LB.art(b, key, true) +
        '<span class="bd-tip" role="tooltip"><b>' + esc(b.label) + '</b>' + esc(b.tip) + '</span></button></li>';
    }).join('');
    return (got.length ? '<ul class="bds">' + on + '</ul>' : '<p class="pf-mut">No badges here yet. Tap a locked one to see what it takes.</p>') +
      (todo.length ? '<div class="bd-more"><ul class="bds is-row">' + off + '</ul><p class="pf-mut">' + todo.length + ' more to earn</p></div>' : '');
  }
  /* Fills each open course once its units are known (LevlMilestones reads the course map); the hero's count last. */
  function fillBadges(list, st, info){
    var total = { got: 0, all: 0 }, left = list.length;
    function put(key, ms){
      var b = LB.forCourse(key, courseStats(key, st), ms, { longest: st.longest, level: info.level });
      var got = b.filter(function(x){ return x.earned; }).length;
      total.got += got; total.all += b.length;
      var box = root.querySelector('[data-cxb="' + key + '"]'), n = root.querySelector('[data-cxn="' + key + '"]');
      if(box) box.innerHTML = badgesHtml(key, b);
      if(n) n.textContent = got + ' of ' + b.length + ' badges';
      if(--left <= 0){ var h = document.getElementById('pfBadgeN'); if(h) h.textContent = total.got + ' of ' + total.all; }
    }
    if(!list.length){ var h0 = document.getElementById('pfBadgeN'); if(h0) h0.textContent = '0'; }
    list.forEach(function(x){
      var key = x.c.key;
      if(!LM || !LM.COURSES[key]) return put(key, []);
      LM.ensure(key).then(function(){ var ms = []; try{ ms = LM.list(key) || []; }catch(e){} put(key, ms); }, function(){ put(key, []); });
    });
  }

  function streakCard(st, list){
    var today = new Date(); today.setHours(0, 0, 0, 0);
    // As many weeks as fill the card's width (owner 2026-11-23: the grid stopped a third of the way across), 12 to 52.
    var inner = ((root && root.clientWidth) || 980) - (window.innerWidth <= 640 ? 38 : 54);
    var cells = '', weeks = Math.max(12, Math.min(52, Math.floor((inner + 4) / (window.innerWidth <= 640 ? 16 : 22))));
    // Columns are weeks (Monday on top), the last one ends today.
    var first = new Date(today); first.setDate(first.getDate() - ((today.getDay() + 6) % 7) - (weeks - 1) * 7);
    var studied = 0;
    for(var i = 0; i < weeks * 7; i++){
      var d = new Date(first); d.setDate(first.getDate() + i);
      if(d > today){ cells += '<i class="pf-d off"></i>'; continue; }
      var k = dayKey(d), day = (st.days || {})[k] || {}, n = Object.keys(day).reduce(function(s, c){ return s + (day[c] || 0); }, 0);
      if(n) studied++;
      var lv = !n ? '' : n < 5 ? 'a' : n < 15 ? 'b' : 'c';
      cells += '<i class="pf-d ' + lv + (k === dayKey(today) ? ' t' : '') + '" title="' + esc(d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) + (n ? ': ' + plural(n, 'question') : ': nothing')) + '"></i>';
    }
    var goal = st.goalBase || st.goal || 15;
    var hasNremt = list.some(function(x){ return x.c.key === 'nremt'; }), nr = readJSON('nremt_streak', {}) || {};
    var hours = [12, 14, 16, 18, 19, 20, 21].map(function(h){ return '<option value="' + h + '"' + ((nr.reminderHour || 18) === h ? ' selected' : '') + '>' + (h > 12 ? (h - 12) + ' PM' : '12 PM') + '</option>'; }).join('');
    return '<section class="pf-card" aria-labelledby="pfS"><h2 id="pfS">Streak</h2>' +
      '<div class="pf-cal" style="grid-template-columns:repeat(' + weeks + ',1fr)" role="img" aria-label="' + esc(studied + ' days studied in the last ' + weeks + ' weeks') + '">' + cells + '</div>' +
      '<p class="pf-mut pf-cal-k">' + plural(studied, 'day') + ' studied in the last ' + weeks + ' weeks &middot; today ' + st.todayCount + ' of ' + st.goal + (st.eased ? ' (eased off while you were away)' : '') + '</p>' +
      '<div class="pf-row"><div><b><label for="pfGoal">Daily goal</label></b><span>Any course counts. Miss several days and it eases off on its own until you are back.</span></div>' +
        '<select id="pfGoal">' + [10, 15, 20, 30, 50].map(function(g){ return '<option value="' + g + '"' + (goal === g ? ' selected' : '') + '>' + g + ' questions a day</option>'; }).join('') + '</select></div>' +
      '<div class="pf-row"><div><b>Streak freeze</b><span>' + (st.freezes ? plural(st.freezes, 'freeze') + ' saved: each covers one missed day.' : 'None saved yet. Hit your goal 7 days in a row to earn one.') + (st.freezePending ? ' One is holding your streak open now.' : '') + '</span></div></div>' +
      '<div class="pf-row"><div><b>Study reminders</b><span>A daily email or notification when you have not studied yet.</span></div><a class="pf-link" href="/privacy.html#reminders">Manage</a></div>' +
      (hasNremt ? '<div class="pf-row"><div><b><label for="pfNrRem">Browser reminder for NREMT</label></b><span id="pfNrNote">Fires while a LevlPrep tab is open, if your goal is not met by then.</span></div>' +
        '<span class="pf-inl"><input type="checkbox" id="pfNrRem"' + (nr.remindersEnabled ? ' checked' : '') + '> <select id="pfNrHour" aria-label="Reminder time">' + hours + '</select></span></div>' : '') +
      '</section>';
  }

  function dataCard(){
    var u = window.StudyHubAccount && window.StudyHubAccount.user ? window.StudyHubAccount.user() : null;
    return '<section class="pf-card" aria-labelledby="pfD"><h2 id="pfD">Your data</h2>' +
      '<div class="pf-row"><div><b>' + (u ? 'Synced to your account' : 'Kept in this browser') + '</b><span>' + (u ? 'Your progress follows you to any device you sign in on.' : 'Sign in to keep it on every device, and to keep it if this browser is cleared.') + '</span></div>' +
        (u ? '<a class="pf-link" href="/account.html">Account</a>' : '<button type="button" class="pf-btn" id="pfSignIn">Sign in to sync</button>') + '</div>' +
      '<div class="pf-row"><div><b>Backup</b><span>A file with all your progress, to keep or move to another browser.</span></div><span class="pf-inl"><button type="button" class="pf-link" id="pfBackup">Download</button> <a class="pf-link" href="/privacy.html#backup">Restore</a></span></div>' +
      '<p class="pf-mut" id="pfDataNote" aria-live="polite"></p></section>';
  }

  function draw(){
    var st = HP.streak(), info = HP.levelInfo(), list = started();
    root.innerHTML = heroCard(st, info) + allTimeCard(st) + coursesCard(list, st) + streakCard(st, list) + dataCard();
    wire();
    fillBadges(list, st, info);
    // Ochem's concept badges and achievements live in its own scripts; load them only for a student who has started it.
    if(document.getElementById('gameConcepts')) loadOchem();
  }

  var ochemLoading = false;
  function loadOchem(){
    if(ochemLoading) return; ochemLoading = true;
    window.OCHEM_BASE = '/ochem/';
    if(!document.querySelector('link[href$="course/hub.css"]')){ var l = document.createElement('link'); l.rel = 'stylesheet'; l.href = '/assets/course/hub.css'; document.head.appendChild(l); }
    var files = ['/ochem/assets/curriculum.js', '/ochem/assets/concepts.js', '/ochem/assets/mastery-engine.js', '/ochem/assets/ochem-xp.js', '/assets/course/hub.js', '/ochem/assets/game-panel.js'];
    (function next(i){
      if(i >= files.length) return;
      var have = Array.prototype.some.call(document.scripts, function(s){ return s.src && s.src.indexOf(files[i]) > -1; });
      if(have) return next(i + 1);
      var s = document.createElement('script'); s.src = files[i]; s.onload = function(){ next(i + 1); }; s.onerror = function(){ next(i + 1); };
      document.body.appendChild(s);
    })(0);
  }

  function wire(){
    var g = document.getElementById('pfGoal');
    if(g) g.addEventListener('change', function(){
      var v = parseInt(g.value, 10);
      if(HP.setGoal) HP.setGoal(v);
      var nr = readJSON('nremt_streak', null); if(nr){ nr.dailyGoal = v; try{ localStorage.setItem('nremt_streak', JSON.stringify(nr)); }catch(e){} }
    });
    var cb = document.getElementById('pfNrRem'), hr = document.getElementById('pfNrHour'), note = document.getElementById('pfNrNote');
    function nrSave(f){ var o = readJSON('nremt_streak', {}) || {}; f(o); try{ localStorage.setItem('nremt_streak', JSON.stringify(o)); }catch(e){} }
    if(hr) hr.addEventListener('change', function(){ nrSave(function(o){ o.reminderHour = parseInt(hr.value, 10); }); });
    if(cb) cb.addEventListener('change', function(){
      function done(on, msg){ nrSave(function(o){ o.remindersEnabled = on; }); cb.checked = on; if(msg && note) note.textContent = msg; }
      if(!cb.checked) return done(false);
      if(typeof Notification === 'undefined') return done(false, 'This browser does not support notifications.');
      if(Notification.permission === 'denied') return done(false, 'Notifications are blocked for this site in your browser settings. Allow them there, then try again.');
      if(Notification.permission === 'granted') return done(true);
      Notification.requestPermission().then(function(pm){ done(pm === 'granted', pm === 'granted' ? '' : 'Reminders need notification permission.'); });
    });
    // Which courses are folded open is kept on this device.
    Array.prototype.forEach.call(root.querySelectorAll('details[data-cx]'), function(d){
      d.addEventListener('toggle', function(){
        var o = {}; Array.prototype.forEach.call(root.querySelectorAll('details[data-cx]'), function(x){ if(x.open) o[x.getAttribute('data-cx')] = 1; });
        try{ localStorage.setItem(OPEN_KEY, JSON.stringify(o)); }catch(e){}
      });
    });
    var si = document.getElementById('pfSignIn');
    if(si) si.addEventListener('click', function(){ if(window.StudyHubAccount && window.StudyHubAccount.openAuthModal) window.StudyHubAccount.openAuthModal(); });
    var bk = document.getElementById('pfBackup'), dn = document.getElementById('pfDataNote');
    if(bk) bk.addEventListener('click', function(){
      var r = window.LevlBackup ? window.LevlBackup.download() : { ok: false, error: 'Backup is not available on this page.' };
      if(dn) dn.textContent = r && r.ok === false ? r.error : 'Your backup file is downloading.';
    });
  }

  /* A locked badge's note: on hover and keyboard focus by CSS, on tap by .is-on; kept inside the window's edges. */
  function place(btn){
    var tip = btn.querySelector('.bd-tip'), r = btn.getBoundingClientRect(), mid = r.left + r.width / 2, half = 103;
    var shift = Math.max(half, Math.min(window.innerWidth - half, mid)) - mid;
    tip.style.left = 'calc(50% + ' + shift + 'px)'; tip.style.setProperty('--ax', (-shift) + 'px');
  }
  function lockOf(e){ return e.target && e.target.closest ? e.target.closest('.bd-lock') : null; }
  root.addEventListener('mouseover', function(e){ var b = lockOf(e); if(b) place(b); });
  root.addEventListener('focusin', function(e){ var b = lockOf(e); if(b) place(b); });
  document.addEventListener('click', function(e){
    var b = lockOf(e), was = b && b.classList.contains('is-on');
    Array.prototype.forEach.call(root.querySelectorAll('.bd-lock.is-on'), function(x){ x.classList.remove('is-on'); });
    if(b && !was){ place(b); b.classList.add('is-on'); }
  });
  document.addEventListener('keydown', function(e){ if(e.key === 'Escape') Array.prototype.forEach.call(root.querySelectorAll('.bd-lock.is-on'), function(x){ x.classList.remove('is-on'); }); });

  draw();
  if(window.StudyHubAccount && window.StudyHubAccount.onAuthChange) window.StudyHubAccount.onAuthChange(function(){ draw(); });
  window.addEventListener('storage', function(e){ if(!e.key || /^hub_/.test(e.key)) draw(); });
})();
