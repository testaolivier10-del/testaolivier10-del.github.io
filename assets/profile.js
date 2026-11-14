/* Profile (profile.html; owner 2026-11-13, option 1, docs/progress-profile.md): everything about the student
   rather than one course, moved here from each course's Progress page. One column:
     you and your stats   level (shared across courses), streak, longest streak, badges earned
     your courses         each course you have started: XP there, last studied, link to its Progress
     streak               the last 18 weeks, daily goal, streak freezes, study reminders
     badges and certificates   NREMT badges, ochem concept badges and achievements, every course's milestones
     your data            kept in this browser, sign in to sync, download a backup
   Nothing new is stored: it reads HubProgress (hub_xp_v1, hub_activity_v1), the courses' own records and
   LevlMilestones, and writes only the daily goal (HubProgress.setGoal) and NREMT's in-browser reminder. */
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
  if(!root || !HP) return;
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

  /* NREMT's badges, read from its own records (the six Progress used to show). */
  function nremtBadges(st, lvl){
    var history = (readJSON('nremt_exam100_history', []) || []).filter(function(x){ return x && x.total > 0; });
    var ds = readJSON('nremt_domain_stats_all', {}) || {}, all = 0;
    Object.keys(ds).forEach(function(d){ all += (ds[d] && ds[d].total) || 0; });
    var best = history.length ? Math.max.apply(null, history.map(function(x){ return Math.round(x.score / x.total * 100); })) : 0;
    return [
      ['7', '7-day streak', st.longest, 7, function(n){ return 'best ' + plural(n, 'day'); }],
      ['30', '30-day streak', st.longest, 30, function(n){ return 'best ' + plural(n, 'day'); }],
      ['1st', 'First full exam', history.length, 1, function(){ return 'take one full exam'; }],
      ['90%', '90%+ exam', best, 90, function(n){ return n ? 'best ' + n + '%' : 'score 90% on a full exam'; }],
      ['500', '500 questions', all, 500, function(n){ return n.toLocaleString() + ' so far'; }],
      ['L10', 'Level 10', lvl, 10, function(n){ return plural(10 - n, 'level') + ' away'; }]
    ].map(function(b){ var e = b[2] >= b[3]; return { icon: b[0], label: b[1], earned: e, sub: e ? 'NREMT' : b[4](Math.min(b[2], b[3])) }; });
  }

  function heroCard(st, info, badges){
    var u = window.StudyHubAccount && window.StudyHubAccount.user ? window.StudyHubAccount.user() : null;
    var name = u && u.email ? u.email.split('@')[0] : 'You';
    var earned = badges.filter(function(b){ return b.earned; }).length;
    return '<section class="pf-card pf-hero" aria-labelledby="pfName"><div class="pf-who"><span class="pf-av" aria-hidden="true">' + esc(name.charAt(0).toUpperCase()) + '</span><div>' +
      '<h1 id="pfName">' + esc(name) + '</h1><p class="pf-mut">' + (u ? 'Signed in, synced across devices' : 'Kept in this browser') + '</p></div></div>' +
      '<div class="pf-stats">' +
        '<div class="pf-st"><b>Level ' + info.level + '</b><span>' + Number(info.toNext).toLocaleString() + ' XP to ' + (info.level + 1) + '</span><i class="pf-xp"><i style="width:' + Math.round(info.into / Math.max(1, info.span) * 100) + '%"></i></i></div>' +
        '<div class="pf-st"><b>' + (st.current ? plural(st.current, 'day') : 'No streak') + '</b><span>current streak</span></div>' +
        '<div class="pf-st"><b>' + plural(st.longest || 0, 'day') + '</b><span>longest streak</span></div>' +
        '<div class="pf-st"><b>' + earned + ' of ' + badges.length + '</b><span>badges earned</span></div>' +
      '</div></section>';
  }

  function coursesCard(list){
    if(!list.length) return '<section class="pf-card" aria-labelledby="pfC"><h2 id="pfC">Your courses</h2><p class="pf-mut">Start any course and it shows up here, with what you have earned in it. <a href="/">See every course</a>.</p></section>';
    return '<section class="pf-card" aria-labelledby="pfC"><h2 id="pfC">Your courses</h2><div class="pf-courses">' + list.map(function(x){
      var last = x.last ? (function(){ var p = x.last.split('-').map(Number), d = Math.round((new Date().setHours(0, 0, 0, 0) - new Date(p[0], p[1] - 1, p[2]).getTime()) / DAY); return d <= 0 ? 'studied today' : d === 1 ? 'studied yesterday' : 'last studied ' + plural(d, 'day') + ' ago'; })() : 'not studied recently';
      return '<a class="pf-co" href="' + esc(x.c.path) + 'dashboard.html"><img class="pf-cv" src="/assets/covers/' + esc(x.c.key) + '.svg" alt="" width="640" height="320" loading="lazy" decoding="async"><span><b>' + esc(x.c.name) + '</b>' +
        '<small>' + Number(x.xp).toLocaleString() + ' XP &middot; ' + last + '</small><em>Progress &rarr;</em></span></a>';
    }).join('') + '</div></section>';
  }

  function streakCard(st, list){
    var today = new Date(); today.setHours(0, 0, 0, 0);
    var cells = '', weeks = 18, start = new Date(today); start.setDate(start.getDate() - (weeks * 7 - 1) - ((today.getDay() + 6) % 7 === 6 ? 0 : 0));
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
      '<div class="pf-cal" role="img" aria-label="' + esc(studied + ' days studied in the last ' + weeks + ' weeks') + '">' + cells + '</div>' +
      '<p class="pf-mut pf-cal-k">' + plural(studied, 'day') + ' studied in the last ' + weeks + ' weeks &middot; today ' + st.todayCount + ' of ' + st.goal + (st.eased ? ' (eased off while you were away)' : '') + '</p>' +
      '<div class="pf-row"><div><b><label for="pfGoal">Daily goal</label></b><span>Any course counts. Miss several days and it eases off on its own until you are back.</span></div>' +
        '<select id="pfGoal">' + [10, 15, 20, 30, 50].map(function(g){ return '<option value="' + g + '"' + (goal === g ? ' selected' : '') + '>' + g + ' questions a day</option>'; }).join('') + '</select></div>' +
      '<div class="pf-row"><div><b>Streak freeze</b><span>' + (st.freezes ? plural(st.freezes, 'freeze') + ' saved: each covers one missed day.' : 'None saved yet. Hit your goal 7 days in a row to earn one.') + (st.freezePending ? ' One is holding your streak open now.' : '') + '</span></div></div>' +
      '<div class="pf-row"><div><b>Study reminders</b><span>A daily email or notification when you have not studied yet.</span></div><a class="pf-link" href="/privacy.html#reminders">Manage</a></div>' +
      (hasNremt ? '<div class="pf-row"><div><b><label for="pfNrRem">Browser reminder for NREMT</label></b><span id="pfNrNote">Fires while a LevlPrep tab is open, if your goal is not met by then.</span></div>' +
        '<span class="pf-inl"><input type="checkbox" id="pfNrRem"' + (nr.remindersEnabled ? ' checked' : '') + '> <select id="pfNrHour" aria-label="Reminder time">' + hours + '</select></span></div>' : '') +
      '</section>';
  }

  /* One group per started course, under its name: its badges (NREMT), concept badges and achievements (ochem),
     then its milestones and certificates, drawn by LevlMilestones. */
  function badgesCard(badges, list){
    if(!list.length) return '<section class="pf-card" aria-labelledby="pfB"><h2 id="pfB">Badges and certificates</h2><p class="pf-mut">Badges and certificates come from finishing things: a unit at Strong, a full exam at 80%, a streak.</p></section>';
    return '<section class="pf-card" aria-labelledby="pfB"><h2 id="pfB">Badges and certificates</h2>' + list.map(function(x){
      var k = x.c.key, inner = '';
      if(k === 'nremt' && badges.length) inner += '<ul class="pf-badges">' + badges.map(function(b){
        return '<li class="' + (b.earned ? 'on' : 'off') + '"><span class="pf-med" aria-hidden="true">' + esc(b.icon) + '</span><b>' + esc(b.label) + '</b><small>' + esc(b.earned ? 'earned' : b.sub) + '</small><span class="pf-sr">' + (b.earned ? 'earned' : 'not yet') + '</span></li>';
      }).join('') + '</ul>';
      if(k === 'ochem') inner += '<div class="pf-oc"><div id="gameConcepts"></div><div id="gameAchievements"></div></div>';
      return '<div class="pf-grp"><h3><img src="/assets/covers/' + esc(k) + '.svg" alt="" width="640" height="320" loading="lazy" decoding="async">' + esc(x.c.name) + '</h3>' + inner + '<div class="pf-ms" data-ms="' + esc(k) + '"></div></div>';
    }).join('') + '</section>';
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
    var badges = list.some(function(x){ return x.c.key === 'nremt'; }) ? nremtBadges(st, info.level) : [];
    root.innerHTML = heroCard(st, info, badges) + coursesCard(list) + streakCard(st, list) + badgesCard(badges, list) + dataCard();
    wire();
    // Every started course's milestones and certificates, drawn by the code that owns them.
    function ms(M){ Array.prototype.forEach.call(root.querySelectorAll('[data-ms]'), function(el){ M.renderList(el, el.getAttribute('data-ms')); }); }
    if(window.LevlMilestones) ms(window.LevlMilestones);
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
    var si = document.getElementById('pfSignIn');
    if(si) si.addEventListener('click', function(){ if(window.StudyHubAccount && window.StudyHubAccount.openAuthModal) window.StudyHubAccount.openAuthModal(); });
    var bk = document.getElementById('pfBackup'), dn = document.getElementById('pfDataNote');
    if(bk) bk.addEventListener('click', function(){
      var r = window.LevlBackup ? window.LevlBackup.download() : { ok: false, error: 'Backup is not available on this page.' };
      if(dn) dn.textContent = r && r.ok === false ? r.error : 'Your backup file is downloading.';
    });
  }

  draw();
  if(window.StudyHubAccount && window.StudyHubAccount.onAuthChange) window.StudyHubAccount.onAuthChange(function(){ draw(); });
  window.addEventListener('storage', function(e){ if(!e.key || /^hub_/.test(e.key)) draw(); });
})();
