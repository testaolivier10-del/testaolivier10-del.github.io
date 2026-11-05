/* Teacher classes, the student's side (docs/teacher-classes.md): window.LevlClassStudent.

   Loaded lazily by assets/site-chrome.js on a course page when someone is
   signed in (LevlLazy('class/class-student')). For a student in a class of
   this page's course it:
     - keeps the list of their classes (class_mine, cached 20 minutes in
       localStorage['levlprep_classes_v1'])
     - pushes their summary of this course (LevlClassModel.summarize) after a
       change, at most once a minute, and only when it changed
     - draws "From your teacher" on the course home: each assignment, where
       they stand on it and a link to do it
   Nothing runs for anyone not in a class of this course: one cached read. */
(function(){
  'use strict';
  if(window.LevlClassStudent) return;
  // levlprep_ keys: cleared with the rest of a student's data at sign-out and account deletion (assets/account.js).
  var CACHE = 'levlprep_classes_v1', LAST = 'levlprep_class_push_v1', DONE = 'levlprep_class_done_v1', TTL = 20 * 60000, GAP = 60000;
  var list = null, timer = null, lastPushAt = 0, started = false, wired = false;

  function M(){ return window.LevlClassModel; }
  function A(){ return window.StudyHubAccount; }
  function esc(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){ return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]; }); }
  function read(k){ try{ return JSON.parse(localStorage.getItem(k) || 'null'); }catch(e){ return null; } }
  function write(k, v){ try{ localStorage.setItem(k, JSON.stringify(v)); }catch(e){} }

  function pageCourse(){
    var seg = location.pathname.split('/')[1] || '', C = M().COURSES;
    for(var k in C) if(C[k].dir === seg) return k;
    return null;
  }
  function isHome(){ var p = location.pathname.replace(/index\.html$/, ''); return /^\/[^\/]+\/$/.test(p); }
  function mine(course){ return (list || []).filter(function(c){ return c.course === course; }); }

  function refresh(force){
    var c = read(CACHE);
    if(!force && c && c.at > Date.now() - TTL && Array.isArray(c.list)){ list = c.list; return Promise.resolve(list); }
    if(!A() || !A().rpcData) return Promise.resolve(list || []);
    return A().rpcData('class_mine').then(function(r){
      if(Array.isArray(r)){ list = r; write(CACHE, { at: Date.now(), list: r }); }
      return list || [];
    });
  }

  function hash(s){ var h = 0; for(var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return h; }
  function push(course, force){
    if(!mine(course).length || !A() || !A().rpc) return;
    var since = Date.now() - lastPushAt;
    if(!force && since < GAP){ clearTimeout(timer); timer = setTimeout(function(){ push(course); }, GAP - since + 50); return; }
    noteDone(course);
    var sum = M().summarize(course, function(k){ return localStorage.getItem(k); });
    var body = JSON.stringify(sum.items) + JSON.stringify(sum.flags) + JSON.stringify(sum.exams) + JSON.stringify(sum.frq) + sum.lessons + JSON.stringify(sum.att || null);
    var last = read(LAST) || {}, h = hash(body);
    if(last[course] === h && !force) return;
    lastPushAt = Date.now();
    A().rpc('class_push', { p_course: course, p_summary: sum }).then(function(ok){
      if(ok){ last = read(LAST) || {}; last[course] = h; write(LAST, last); }
    });
  }

  /* The first time each assignment is done on this device, kept so a later redo never makes finished work look late. */
  function noteDone(course){
    var now = Date.now(), get = function(k){ return localStorage.getItem(k); }, sum = M().summarize(course, get, now), d = read(DONE) || {}, changed = false;
    mine(course).forEach(function(c){ (c.assignments || []).forEach(function(a){
      if(d[a.id]) return;
      var st = M().status(a, sum, now);
      if(st.state === 'done' && st.doneAt){ d[a.id] = st.doneAt; changed = true; }
    }); });
    if(changed) write(DONE, d);
  }
  function practiceHref(a){
    var s = a.spec || {}, t = s.topics || [];
    if(s.unit && !t.length) return 'practice.html?unit=' + encodeURIComponent(s.unit);
    if(t.length) return 'practice.html?topic=' + encodeURIComponent(t[0]);
    return 'practice.html';
  }
  /* Practice, review, mastery and exam links carry la=<assignment id>: the page then runs the assignment with its
     controls (assets/class/class-run.js). Review and mastery run on the practice page. */
  function href(a){
    var s = a.spec || {}, la = 'la=' + encodeURIComponent(a.id);
    if(a.kind === 'review' || a.kind === 'mastery') return 'practice.html?' + la;
    if(a.kind === 'exam') return 'exams.html' + (s.unit ? '?unit=' + encodeURIComponent(s.unit) : '?mode=full') + '&' + la;
    if(a.kind === 'frq') return s.frq ? 'frq/' + encodeURIComponent(s.frq) + '.html' : 'frq.html';
    var p = practiceHref(a);
    return p + (p.indexOf('?') > -1 ? '&' : '?') + la;
  }
  function dueWords(due, now){
    if(!due) return 'No due date';
    var d = new Date(due), days = Math.round((new Date(d.toDateString()) - new Date(new Date(now).toDateString())) / 86400000);
    var when = days === 0 ? 'today' : days === 1 ? 'tomorrow' : days > 1 && days < 7 ? d.toLocaleDateString(undefined, { weekday: 'long' }) : d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    return 'Due ' + when;
  }
  var KIND = { practice: 'Practice', review: 'Review', mastery: 'Mastery', exam: 'Practice exam', frq: 'Free response' };

  function card(course){
    var host = document.querySelector('main.r3-home');
    var classes = mine(course);
    var old = document.getElementById('lvClassCard'); if(old) old.remove();
    if(!host || !classes.length) return;
    var now = Date.now(), sum = M().summarize(course, function(k){ return localStorage.getItem(k); }, now);
    var html = classes.map(function(c){
      var open = (c.assignments || []).filter(function(a){ return Date.parse(a.opens_at) <= now; });
      var rows = open.map(function(a){
        var st = M().status(a, sum, now), pct = st.total ? Math.round(st.answered / st.total * 100) : 0;
        var tag = st.state === 'done' ? '<span class="lvc-tag is-done">Done' + (st.late ? ', late' : '') + '</span>'
          : st.state === 'missing' ? '<span class="lvc-tag is-late">Missing</span>'
          : !a.required ? '<span class="lvc-tag">Optional</span>'
          : st.late ? '<span class="lvc-tag is-late">Late</span>'
          : '<span class="lvc-tag is-req">' + esc(dueWords(a.due_at, now)) + '</span>';
        var topics = (a.spec && a.spec.topicNames) || [];
        var meta = KIND[a.kind] + (a.kind === 'practice' ? ' · ' + st.answered + ' of ' + st.total + ' questions' : a.kind === 'review' ? (st.total ? ' · ' + st.answered + ' of ' + st.total + ' redone' : ' · nothing to redo yet') : '') +
          (topics.length ? ' · ' + esc(topics.slice(0, 3).join(', ')) + (topics.length > 3 ? ' and ' + (topics.length - 3) + ' more' : '') : '');
        var btn = st.state === 'done' ? '<a class="lvc-btn is-ghost" href="' + esc(href(a)) + '">Open again</a>' : '<a class="lvc-btn" href="' + esc(href(a)) + '">' + (st.answered ? 'Keep going' : 'Start') + '</a>';
        var chips = a.kind === 'practice' && a.spec && a.spec.topics && a.spec.topics.length > 1
          ? '<p class="lvc-chips">' + a.spec.topics.map(function(t, i){ return '<a href="practice.html?topic=' + encodeURIComponent(t) + '">' + esc((a.spec.topicNames || [])[i] || t) + '</a>'; }).join('') + '</p>' : '';
        return '<li class="lvc-row">' + tag + '<p class="lvc-t">' + esc(a.title) + '</p><p class="lvc-m">' + meta + '</p>' +
          ((a.kind === 'practice' || a.kind === 'review') && st.state !== 'done' ? '<div class="lvc-bar"><i style="width:' + pct + '%"></i></div>' : '') + chips + btn + '</li>';
      }).join('');
      // A live session open in class (class_mine live: true), then the teacher's newest five announcements.
      var live = c.live ? '<p class="lvc-live"><a class="lvc-btn" href="/live.html?c=' + encodeURIComponent(c.id) + '">Join the live session</a></p>' : '';
      var ann = (Array.isArray(c.announcements) ? c.announcements : []).slice().sort(function(x, y){ return (Date.parse(y.created_at || y.at) || 0) - (Date.parse(x.created_at || x.at) || 0); }).slice(0, 5);
      var annHtml = ann.length ? '<ul class="lvc-ann" aria-label="Announcements">' + ann.map(function(n){
        var at = Date.parse(n.created_at || n.at);
        return '<li><p>' + esc(n.body || n.text || n.message || '') + '</p>' + (at ? '<span>' + esc(new Date(at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })) + '</span>' : '') + '</li>';
      }).join('') + '</ul>' : '';
      return '<div class="lvc-class"><div class="lvc-head"><h2>From <span>' + esc(c.teacher || 'your teacher') + '</span></h2><p>' + esc(c.name) + '</p></div>' + live + annHtml +
        (rows ? '<ul class="lvc-list">' + rows + '</ul>' : '<p class="lvc-empty">Nothing assigned right now.</p>') + '</div>';
    }).join('');
    var sec = document.createElement('section');
    sec.id = 'lvClassCard'; sec.className = 'lvc'; sec.setAttribute('aria-label', 'From your teacher');
    sec.innerHTML = html + '<p class="lvc-note">Your teacher sees your work in this course only. <a href="/join.html">Your classes</a></p>';
    // Inside the page column, overlapping the band where the path card would, with the path card under it.
    var col = host.querySelector('.band ~ .hwrap');
    if(col){ sec.className = 'lvc is-top'; col.insertBefore(sec, col.firstChild); }
    else host.insertBefore(sec, host.firstChild);
  }

  function css(){
    if(document.getElementById('lvClassCss')) return;
    var l = document.createElement('link'); l.id = 'lvClassCss'; l.rel = 'stylesheet'; l.href = '/assets/class/class.css';
    document.head.appendChild(l);
    // Announcements and the live link (kept here so class.css, shared with the teacher app, stays A1's).
    var st = document.createElement('style');
    st.textContent = '.lvc-live{margin:6px 0 10px}.lvc-live .lvc-btn{display:inline-flex}.lvc-ann{list-style:none;margin:8px 0 6px;padding:0;display:grid;gap:8px}' +
      '.lvc-ann li{background:var(--ctint,var(--surface2));border-radius:14px;padding:10px 14px}.lvc-ann p{margin:0;font-weight:700;color:var(--ink);white-space:pre-line}' +
      '.lvc-ann span{font-size:13px;color:var(--muted)}';
    document.head.appendChild(st);
  }

  function start(){
    if(started) return; started = true;
    var course = pageCourse();
    if(!course || !A() || !A().onAuthChange) return;
    A().onAuthChange(function(u){
      if(!u) return;
      refresh(false).then(function(){
        if(!mine(course).length) return;
        css();
        if(isHome()) card(course);
        push(course, false);
        if(wired) return;
        wired = true;
        document.addEventListener(course + ':progress', function(){ push(course, false); if(isHome()) card(course); });
        // Leaving the page: send a change still waiting out the one-minute gap (unchanged summaries are never resent).
        window.addEventListener('pagehide', function(){ if(timer){ clearTimeout(timer); timer = null; lastPushAt = 0; push(course, false); } });
      });
    });
  }

  function boot(){
    if(M()){ start(); return; }
    var s = document.createElement('script'); s.src = '/assets/class/class-model.js';
    s.onload = start; document.head.appendChild(s);
  }

  window.LevlClassStudent = { refresh: refresh, push: push, noteDone: noteDone, href: href, list: function(){ return list || []; } };
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
