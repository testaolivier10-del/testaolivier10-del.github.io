/* Teacher classes, the student's side (docs/teacher-classes.md): window.LevlClassStudent.

   Loaded lazily by assets/site-chrome.js on a course page when someone is
   signed in (LevlLazy('class/class-student')). For a student in a class of
   this page's course it:
     - keeps the list of their classes (class_mine, cached 20 minutes in
       localStorage['levlprep_classes_v1'])
     - pushes their summary of this course (LevlClassModel.summarize) after a
       change, at most once a minute, and only when it changed
     - on the course home, loads class-view.js: the Path | My class switch and the
       class pages (overview, assignments, results, class info)
   Nothing runs for anyone not in a class of this course: one cached read. */
(function(){
  'use strict';
  if(window.LevlClassStudent) return;
  // levlprep_ keys: cleared with the rest of a student's data at sign-out and account deletion (assets/account.js).
  var CACHE = 'levlprep_classes_v1', LAST = 'levlprep_class_push_v1', DONE = 'levlprep_class_done_v1', TTL = 20 * 60000, GAP = 60000;
  var list = null, timer = null, lastPushAt = 0, started = false, wired = false, viewLoading = false;

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
  /* Each course's pages take their own parameters (LevlClassModel.href, docs/teacher-classes.md "Links").
     On the eleven AP® courses practice, review, mastery and exam links also carry la=<assignment id>: the page then
     runs the assignment with its controls (assets/class/class-run.js); review and mastery run on the practice page.
     NREMT, ochem and A&P pages have no class runner yet, so their links stay plain. */
  var pageC = null, needTried = false;
  function href(a){
    var c = pageC || pageCourse();
    if(!M().isAp(c) || a.kind === 'frq') return M().href(c, a);
    var la = 'la=' + encodeURIComponent(a.id);
    if(a.kind === 'review' || a.kind === 'mastery') return 'practice.html?' + la;
    var p = M().href(c, a);
    return p + (p.indexOf('?') > -1 ? '&' : '?') + la;
  }
  function dueWords(due, now){
    if(!due) return 'No due date';
    var d = new Date(due), days = Math.round((new Date(d.toDateString()) - new Date(new Date(now).toDateString())) / 86400000);
    var when = days === 0 ? 'today' : days === 1 ? 'tomorrow' : days > 1 && days < 7 ? d.toLocaleDateString(undefined, { weekday: 'long' }) : d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    return 'Due ' + when;
  }
  var KIND = { practice: 'Practice', review: 'Review', mastery: 'Mastery', exam: 'Practice exam', frq: 'Free response' };

  /* The home's Path | My class switch and the class pages live in class-view.js (loaded here, only for a student in a class). */
  function view(){
    if(window.LevlClassView){ window.LevlClassView.mount(pageC); return; }
    if(viewLoading) return; viewLoading = true;
    var s = document.createElement('script'); s.src = '/assets/class/class-view.js';
    s.onload = function(){ if(window.LevlClassView) window.LevlClassView.mount(pageC); };
    document.head.appendChild(s);
  }
  function css(){
    if(document.getElementById('lvClassCss')) return;
    var l = document.createElement('link'); l.id = 'lvClassCss'; l.rel = 'stylesheet'; l.href = '/assets/class/class.css';
    document.head.appendChild(l);
  }

  function start(){
    if(started) return; started = true;
    var course = pageCourse();
    if(!course || !A() || !A().onAuthChange) return;
    pageC = course;
    // A course whose records need a lookup first (NREMT's topic map) loads it before anything is summarized.
    // If it fails to load, carry on without it (the summary then has no topics for that course).
    var need = M().COURSES[course].need;
    if(need && !needTried && !window[M().COURSES[course].g]){
      needTried = true;
      var s = document.createElement('script'); s.src = '/' + need;
      s.onload = s.onerror = function(){ started = false; start(); };
      document.head.appendChild(s); return;
    }
    A().onAuthChange(function(u){
      if(!u) return;
      refresh(false).then(function(){
        if(!mine(course).length) return;
        css();
        if(isHome()) view();
        push(course, false);
        if(wired) return;
        wired = true;
        document.addEventListener(course + ':progress', function(){ push(course, false); if(isHome() && window.LevlClassView) window.LevlClassView.render(); });
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

  window.LevlClassStudent = { refresh: refresh, push: push, noteDone: noteDone, href: href, dueWords: dueWords, list: function(){ return list || []; } };
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
