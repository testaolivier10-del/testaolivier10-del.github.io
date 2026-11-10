/* The teacher app (teach/index.html, docs/teacher-classes.md). Five tabs (Class, Assignments, Students, Live,
   Settings) and the short band on every inner page (simplified teacher pages, owner 2026-11-08).

   /teach/            sign in, teacher name, the teacher's classes, a new class
   /teach/?c=<id>     one class, by hash:
     #home            what needs you today, mastery by unit; rail: students to check on, tell the class
     #work            every assignment          #a/<id>[/questions|/topics]   one assignment, in three views
     #assign          the builder (#assign/<topicId>, #assign/edit/<id>, #assign/student/<id>)
     #students[/gradebook|/skills]   the list, the gradebook, AP® skills and score bands (AP® only)
     #s/<id>          one student (accommodations, family report, remove)
     #settings[/join|/class|/people|/connect|/school]   one section at a time
     #topic/<id>      where the class struggles on one topic
     #live            live mode: one question at a time on the projector, answers arrive as students submit
     #bank            the teacher's own questions        #print/<id>   a printable worksheet or test with its key
     (old #grades and #skills links go to #students/gradebook and #students/skills)
   /teach/?dept=1     the department: classes the teachers in it share (numbers only, no student names)

   Every number comes from the students' own summaries (assets/class/class-model.js) through teach_class_report;
   nothing is stored on the teacher's side except the class, its order and its assignments. */
(function(){
  'use strict';
  var M = window.LevlClassModel, DAY = 86400000;
  var app = document.getElementById('lvtApp');
  var S = { user: null, profile: undefined, classes: null, rep: null, cur: null, frqs: null, banks: {}, bankWait: {}, stims: {}, qs: null };
  var params = new URLSearchParams(location.search), CLASS_ID = params.get('c');
  // ?demo=1: a sample class with made-up students (assets/class/teach-demo.js), no sign-in, nothing saved.
  var DEMO = params.get('demo') === '1'; if(DEMO) CLASS_ID = 'demo';

  function A(){ return window.StudyHubAccount; }
  function call(name, args){ return DEMO ? window.LevlTeachDemo.call(name, args || {}) : A().rpcData(name, args || {}); }
  function esc(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){ return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]; }); }
  function rich(s){ return window.LevlInline && window.LevlInline.html ? window.LevlInline.html(s || '') : esc(s); }
  function pct(v){ return v == null ? '·' : Math.round(v * 100) + '%'; }
  function plural(n, a, b){ return n + ' ' + (n === 1 ? a : (b || a + 's')); }
  function initials(n){ var p = String(n || '?').trim().split(/\s+/); return ((p[0] || '?')[0] + (p.length > 1 ? (p[p.length - 1][0] || '') : '')).toUpperCase(); }
  function day(t){ return t ? new Date(t).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }) : ''; }
  function ago(t){ if(!t) return 'never studied here'; var d = Math.floor((Date.now() - t) / DAY); return d <= 0 ? 'active today' : d === 1 ? 'active yesterday' : 'last active ' + d + ' days ago'; }
  var CHEV = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>';
  var KIND = { practice: 'Practice', review: 'Review', mastery: 'Mastery', exam: 'Practice exam', frq: 'Free response' };
  var RELEASE = { now: 'right after each answer', after_submit: 'when they hand it in', after_due: 'after the due date' };
  function isOwner(){ return !S.rep || !S.rep.class.role || S.rep.class.role === 'owner'; }
  function ctl(a){ return (a && a.spec && a.spec.controls) || {}; }
  function ctlText(a){
    var c = ctl(a), out = [];
    if(c.timeLimit) out.push(c.timeLimit + ' min timed');
    if(c.shuffle) out.push('shuffled');
    if(c.release && c.release !== 'now') out.push('answers ' + RELEASE[c.release]);
    if(c.questions && c.questions.length) out.push(plural(c.questions.length, 'question') + ' of yours');
    return out.join(' &middot; ');
  }

  /* ------------------------------------------------------------- shapes from the mockup */
  function q(n, a, b){ return '<div class="d5-q"><p class="d5-n">' + n + '</p><h2>' + a + ' <span>' + b + '</span></h2></div>'; }
  function band(o){
    return '<section class="band' + (o.small ? ' tm-band-sm' : ' tm-band-home') + '"><div class="hwrap"><div>' +
      '<p class="issue">' + o.issue + '</p><h1 class="mast">' + o.m1 + '<span>' + (o.m2 || '') + '</span></h1>' +
      (o.hand ? '<p class="hand">' + o.hand + '</p>' : '') + (o.lede ? '<p class="lede">' + o.lede + '</p>' : '') +
      (o.ctas ? '<div class="hero-ctas">' + o.ctas + '</div>' : '') + '</div>' + (o.art || '') + '</div></section>';
  }
  /* The short band every inner teacher page uses (the course inner tabs' band, owner 2026-11-05; simplified teacher
     pages, owner 2026-11-08): breadcrumbs, a kicker, the title, one line, optional buttons and a right-hand box. */
  function sband(o){
    var cr = (o.crumbs || []).map(function(c){ return c[1] ? '<a href="' + c[1] + '">' + c[0] + '</a>' : '<span aria-current="page">' + c[0] + '</span>'; }).join(' <span aria-hidden="true">›</span> ');
    return '<section class="band short tm-sb"><div class="hwrap"><div>' + (cr ? '<nav class="r3-crumb" aria-label="Breadcrumb">' + cr + '</nav>' : '') +
      '<p class="issue">' + o.issue + ' <i></i></p><h1 class="deck">' + o.title + '</h1>' + (o.lede ? '<p class="lede">' + o.lede + '</p>' : '') +
      (o.ctas ? '<div class="tm-ctas">' + o.ctas + '</div>' : '') + '</div>' + (o.right || '') + '</div></section>';
  }
  var YOURS = ['Your classes', '/teach/'];
  function classCrumbs(more){ return [YOURS, [esc(S.rep.class.name), '#home']].concat(more || []); }
  function classIssue(){ return esc(course().name) + ' &middot; ' + esc(S.rep.class.name); }
  function body(inner){ return '<div class="xshell lap tm-body">' + inner + '</div>'; }
  // Sub views inside a page (Students: list, gradebook, skills; an assignment: students, questions, topics), as links.
  function views(items, on){
    return '<nav class="tm-views" aria-label="Views">' + items.map(function(x){ return '<a class="pp-chip" href="' + x[0] + '"' + (x[2] === on ? ' aria-current="page"' : '') + '>' + x[1] + '</a>'; }).join('') + '</nav>';
  }
  // A button that opens a small panel under it (the assignment's Remind, Send grades and More).
  function menu(label, inner, attrs){ return '<details class="tm-menu"' + (attrs || '') + '><summary class="lp-btn sm tm-mline">' + label + '</summary><div class="tm-pop">' + inner + '</div></details>'; }
  function frame(inner, cover, home){
    return '<main id="lvtMain" class="r3 ' + (home ? 'r3-home' : 'r3-inner') + ' d5" data-cover="' + esc(cover || 'apbio') + '">' + inner + '</main>';
  }
  function setNav(active){
    var bar = document.getElementById('lvtBar');
    if(!S.rep){ bar.innerHTML = ''; return; }
    // Five tabs (owner 2026-11-08): Gradebook and AP® skills are views of Students.
    var tabs = [['home', 'Class'], ['work', 'Assignments'], ['students', 'Students'], ['live', 'Live'], ['settings', 'Settings']];
    bar.innerHTML = '<div class="course-nav"><nav class="course-nav__inner" aria-label="' + esc(S.rep.class.name) + ' sections">' +
      tabs.map(function(t){ var on = t[0] === active; return '<a href="#' + t[0] + '" class="course-nav__link' + (on ? ' active' : '') + '"' + (on ? ' aria-current="page"' : '') + '>' + t[1] + '</a>'; }).join('') +
      '<a href="#assign" class="course-nav__link tm-navcta">+ Assign</a></nav></div>';
  }
  // Jump to the top only on a new view; redrawing the same view (a toggle in the builder, a unit moved in
  // settings) keeps the place on the page.
  var lastView = null;
  var DEMO_NOTE = '<div class="lvt-demo" role="note"><div class="hwrap"><p><b>Sample class.</b> Made-up students in the middle of a term. Try anything: changes are not saved.</p><a class="btn-chan" href="/teach/">Make your own class</a></div></div>';
  function render(html, active){
    var view = location.pathname + location.search + location.hash, same = view === lastView, y = window.scrollY;
    setNav(active); app.innerHTML = (DEMO ? DEMO_NOTE : '') + html; lastView = view;
    window.scrollTo(0, same ? y : 0);
  }

  /* ------------------------------------------------------------- data */
  function loadScript(src){ return new Promise(function(res, rej){ var s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = rej; document.head.appendChild(s); }); }
  function course(){ return M.COURSES[S.rep.class.course]; }
  /* The course's curriculum as units and topics (LevlClassModel.curriculum adapts NREMT, ochem and A&P). */
  function curriculum(){
    var C = course(), key = S.rep.class.course, adapt = function(){ return M.curriculum(key, window[C.g]); };
    if(window[C.g]) return Promise.resolve(adapt());
    return loadScript('/' + C.cur).then(adapt);
  }
  function frqIndex(){
    if(S.frqs) return Promise.resolve(S.frqs);
    if(course().frq === false){ S.frqs = []; return Promise.resolve(S.frqs); }
    return fetch('/' + course().dir + '/assets/frq/index.json').then(function(r){ return r.ok ? r.json() : []; }, function(){ return []; }).then(function(x){ S.frqs = Array.isArray(x) ? x : []; return S.frqs; });
  }
  // A unit's questions by id. NREMT and ochem keep one file for the whole course (LevlClassModel.bankUrl), fetched once.
  function bankFor(unit){
    var key = S.rep.class.course, url = M.bankUrl(key, unit), k = course().dir + '/' + unit;
    if(S.banks[k]) return Promise.resolve(S.banks[k]);
    if(!S.bankWait[url]) S.bankWait[url] = fetch(url).then(function(r){ return r.ok ? r.json() : { items: [] }; }, function(){ return { items: [] }; })
      .then(function(b){ var by = {}; M.bankItems(key, b).forEach(function(it){ by[it.id] = it; }); return { by: by, stimuli: (b && !Array.isArray(b) && b.stimuli) || {} }; });
    return S.bankWait[url].then(function(x){ S.banks[k] = x.by; S.stims[k] = x.stimuli; return x.by; });
  }
  /* Stream C's integrations (assets/class/teach-integrations.js) when that file exists: settings(ctx) and
     assignment(ctx) return HTML for the page, wire(ctx) runs after it is drawn. Nothing breaks without it. */
  var INT = null;
  function loadIntegrations(){
    return loadScript('/assets/class/teach-integrations.js').then(function(){ INT = window.LevlTeachIntegrations || null; }, function(){ INT = null; })
      .then(function(){ if(INT && S.rep && /^#(a\/|s\/|settings)/.test(location.hash)) route(); });
  }
  function hook(where, boxId, extra){
    var box = document.getElementById(boxId); if(!box || !INT || typeof INT[where] !== 'function') return;
    // rep: the report this page already holds (members with summaries), so the integrations need no second fetch.
    var ctx = Object.assign({ where: where, demo: DEMO, classId: CLASS_ID, cls: S.rep.class, role: S.rep.class.role || 'owner', box: box, call: call,
      members: D.members.map(function(m){ return { id: m.id, name: m.name }; }), rep: S.rep }, extra || {});
    try{ var h = INT[where](ctx); box.innerHTML = typeof h === 'string' ? h : ''; if(typeof INT.wire === 'function') INT.wire(ctx); }
    catch(e){ box.innerHTML = ''; if(window.console) console.warn('teach-integrations', e); }
  }
  /* The teacher's own questions in this course (#bank), loaded once a view needs them. */
  function myQuestions(force){
    if(S.qs && !force) return Promise.resolve(S.qs);
    return call('teach_questions', { p_course: S.rep.class.course }).then(function(r){ S.qs = Array.isArray(r) ? r : []; return S.qs; }, function(){ S.qs = []; return S.qs; });
  }
  function myClasses(){
    if(S.classes) return Promise.resolve(S.classes);
    return call('teach_my_classes').then(function(r){ S.classes = Array.isArray(r) ? r : []; return S.classes; }, function(){ S.classes = []; return S.classes; });
  }
  function loadClass(){
    return call('teach_class_report', { p_class: CLASS_ID }).then(function(rep){
      if(!rep) throw new Error('none');
      S.rep = rep;
      document.body.setAttribute('data-course', rep.class.course);
      return curriculum();
    }).then(function(cur){ S.cur = cur || { units: [], topics: [] }; compute(); });
  }

  /* Everything the views read, worked out once per load. */
  var D = {};
  function compute(){
    var cur = S.cur, now = Date.now(), rep = S.rep;
    D.topics = {}; cur.topics.forEach(function(t){ D.topics[t.id] = t; });
    D.unitsById = {}; cur.units.forEach(function(u){ D.unitsById[u.id] = u; });
    var withTopics = cur.units.filter(function(u){ return cur.topics.some(function(t){ return t.unit === u.id && t.built !== false; }); });
    // Skills tracks (AP® Bio statistics, design) run alongside the units: assignable, but not part of the class order.
    D.extra = withTopics.filter(function(u){ return u.part && u.part !== 'course'; }).map(function(u){ return u.id; });
    withTopics = withTopics.filter(function(u){ return D.extra.indexOf(u.id) === -1; });
    var order = (rep.class.unit_order || []).filter(function(id){ return D.unitsById[id] && D.extra.indexOf(id) === -1; });
    withTopics.forEach(function(u){ if(order.indexOf(u.id) === -1) order.push(u.id); });
    D.order = order;
    D.current = rep.class.current_unit && order.indexOf(rep.class.current_unit) !== -1 ? rep.class.current_unit : null;
    D.curIdx = D.current ? order.indexOf(D.current) : -1;
    D.members = rep.members.map(function(m){
      var tm = M.topicMastery(m.summary, cur, now), um = {};
      order.forEach(function(u){ um[u] = M.unitMastery(tm, cur, u); });
      // Overall = the units the class has reached, when the teacher has marked where it is.
      var reached = D.curIdx >= 0 ? order.slice(0, D.curIdx + 1) : null;
      return { id: m.id, name: m.name, joined: Date.parse(m.joined_at), extra_days: m.extra_days, extra_time: +m.extra_time || 1, summary: m.summary, tm: tm, um: um,
               overall: reached ? reached.reduce(function(x, u){ return x + um[u]; }, 0) / reached.length : M.overall(tm, cur), last: M.lastActive(m.summary), week: m.summary ? M.answeredSince(m.summary, now - 7 * DAY) : 0 };
    });
    D.byId = {}; D.members.forEach(function(m){ D.byId[m.id] = m; });
    D.assign = rep.assignments.map(function(a){
      var mine = D.members.filter(function(m){ return !a.students || a.students.indexOf(m.id) !== -1; });
      var st = {}; mine.forEach(function(m){
        var due = a.due_at ? Date.parse(a.due_at) + (m.extra_days || 0) * DAY : null;
        var lu = a.late_until ? Date.parse(a.late_until) + (m.extra_days || 0) * DAY : null;
        st[m.id] = M.status(Object.assign({}, a, { due_at: due, late_until: lu }), m.summary, now, cur);
      });
      var done = mine.filter(function(m){ return st[m.id].state === 'done'; });
      var scores = done.map(function(m){ return st[m.id].score; }).filter(function(v){ return v != null; });
      return Object.assign({}, a, { who: mine, st: st, open: Date.parse(a.opens_at) <= now,
        n: { done: done.length, prog: mine.filter(function(m){ return st[m.id].state === 'progress'; }).length,
             not: mine.filter(function(m){ return st[m.id].state === 'not'; }).length, missing: mine.filter(function(m){ return st[m.id].state === 'missing'; }).length,
             late: mine.filter(function(m){ return st[m.id].late; }).length, all: mine.length },
        avg: scores.length ? scores.reduce(function(x, y){ return x + y; }, 0) / scores.length : null });
    });
    D.unitAvg = {}; order.forEach(function(u){ var ms = D.members.filter(function(m){ return m.summary; }); D.unitAvg[u] = ms.length ? ms.reduce(function(x, m){ return x + m.um[u]; }, 0) / ms.length : 0; });
  }
  function unitName(id){ var u = D.unitsById[id]; return u ? (u.n ? (course().unitWord || 'Unit') + ' ' + u.n : u.title) : id; }
  function unitTitle(id){ var u = D.unitsById[id]; return u ? u.title : id; }
  function unitLabel(id){ var u = D.unitsById[id]; return u && u.n ? unitName(id) + ' \u00b7 ' + u.title : unitTitle(id); }
  function topicName(id){ var t = D.topics[id]; return t ? (t.ced ? t.ced + ' ' : '') + t.title : id; }

  /* ------------------------------------------------------------- views: landing */
  function viewSignedOut(){
    render(frame(band({ issue: 'LevlPrep <i></i> For teachers', m1: 'Free classes', m2: 'for teachers', hand: 'assign it, see who struggles, fix it',
      lede: 'Make a class, share a code, and assign practice, review and exams from any LevlPrep course: AP® Biology through AP® Macroeconomics (with free response), EMT (NREMT), organic chemistry, and anatomy and physiology. You see every student’s mastery and the exact questions the class misses.',
      ctas: '<button class="btn-chan" id="lvtSignIn" type="button">Sign in to start</button><a class="btn-ghost" href="/teach/?demo=1">See a sample AP® class</a><a class="btn-ghost" href="/teach/?demo=1&amp;course=nremt">See a sample EMT class</a>' }) +
      '<div class="hwrap"><div class="lv-grid3 tm-up">' +
      '<div class="d5-card"><p class="d5-lead">Your order, their path</p><p class="d5-mut">Set the units in the order you teach them. Every student’s study path follows it.</p></div>' +
      '<div class="d5-card"><p class="d5-lead">See the misconception</p><p class="d5-mut">Each question the class misses, with the wrong answer most of them picked.</p></div>' +
      '<div class="d5-card"><p class="d5-lead">Fix it in one tap</p><p class="d5-mut">Turn any weak topic into an assignment from the class page.</p></div></div>' +
      '<p class="d5-mut" style="margin:28px 0 60px">Free for teachers. Students use the free plan, so nobody has to pay. Students must be 13 or older. <a href="/privacy.html#classes">What teachers see</a>. Student? <a href="/join.html">Join a class</a>.</p></div>', 'apbio', true));
    document.getElementById('lvtSignIn').addEventListener('click', function(){ A().openAuthModal(); });
  }
  function viewProfile(){
    var meta = (S.user && S.user.user_metadata) || {};
    render(frame(sband({ issue: 'LevlPrep &middot; For teachers', title: 'Welcome, teacher', lede: 'One step before your first class.' }) +
      '<div class="xshell lap tm-body"><form class="d5-card lv-narrow" id="lvtProf"><p class="d5-lead">How students see you</p><p class="d5-mut">Shown to students when they join, for example &ldquo;Ms. Rivera&rdquo;.</p>' +
      '<label class="lv-field" style="margin-top:16px"><span>Your name for students</span><input class="lv-in" id="lvtPName" maxlength="60" required value="' + esc(meta.full_name || '') + '"></label>' +
      '<label class="lv-field"><span>School (optional, only you see it)</span><input class="lv-in" id="lvtPSchool" maxlength="120"></label>' +
      '<label class="lvt-check"><input type="checkbox" id="lvtPOk" required> I’ll follow my school’s rules for using online tools with students</label>' +
      '<p style="margin:16px 0 0"><button class="lp-btn gold" type="submit">Continue</button></p><p class="lv-msg" id="lvtPMsg" role="status"></p></form><div style="height:60px"></div></div>'));
    document.getElementById('lvtProf').addEventListener('submit', function(e){
      e.preventDefault();
      call('teach_set_profile', { p_name: document.getElementById('lvtPName').value, p_school: document.getElementById('lvtPSchool').value }).then(function(ok){
        if(!ok){ var m = document.getElementById('lvtPMsg'); m.textContent = 'That did not save. Classes may not be open yet; try again later.'; m.className = 'lv-msg is-bad'; return; }
        S.profile = undefined; start();
      });
    });
  }
  function viewClasses(){
    var list = S.classes || [];
    var cards = list.map(function(c){
      var C = M.COURSES[c.course] || {};
      return '<a class="d5-card" data-cover="' + esc(c.course) + '" href="?c=' + esc(c.id) + '#home" style="display:block;text-decoration:none;color:var(--ink)">' +
        '<span class="lp-pill">' + esc(C.name || c.course) + '</span>' + (c.role === 'co' ? ' <span class="lv-tag">co-teaching with ' + esc(c.teacher || 'its owner') + '</span>' : '') + '<p class="d5-lead" style="margin-top:10px">' + esc(c.name) + (c.archived ? ' (archived)' : '') + '</p>' +
        '<p class="d5-mut">' + plural(c.members, 'student') + ' &middot; code <b style="font-family:var(--font-mono)">' + esc(c.code) + '</b></p></a>';
    }).join('');
    var opts = M.ORDER.map(function(k){ return '<option value="' + k + '"' + (k === 'apbio' ? ' selected' : '') + '>' + esc(M.COURSES[k].name) + '</option>'; }).join('');
    render(frame(sband({ issue: 'LevlPrep &middot; For teachers', title: 'Your classes', lede: list.length ? plural(list.length, 'class', 'classes') : 'Make your first class.' }) +
      '<div class="xshell lap tm-body"><div class="lvt-assign"><div class="main">' +
      (cards ? '<div class="lv-grid2">' + cards + '</div>' : '<div class="d5-card tm-empty"><p class="d5-lead">No classes yet</p><p class="d5-mut">Make one on the right. Each class period gets its own code.</p></div>') +
      '</div><aside class="side"><form class="lp-card" id="lvtNew"><span class="lp-pill">New class</span><h2 class="lp-h2">Make a <span>class</span></h2>' +
      '<label class="lv-field" style="margin-top:12px"><span>Course</span><select class="lv-in" id="lvtNCourse">' + opts + '</select></label>' +
      '<label class="lv-field"><span>Class name</span><input class="lv-in" id="lvtNName" maxlength="60" placeholder="Period 3" required></label>' +
      '<button class="lp-btn gold" type="submit">Make the class</button><p class="lv-msg" id="lvtNMsg" role="status"></p></form>' +
      '<form class="d5-card" id="lvtCoJoin" style="margin-top:16px"><p class="d5-lead">Co-teach a class</p><p class="d5-mut">Another teacher gave you a co-teacher code.</p><label class="lv-field" style="margin-top:10px"><span>Co-teacher code</span><input class="lv-in" id="lvtCoCode" maxlength="8" autocapitalize="characters" spellcheck="false" required></label><button class="lp-btn sm" type="submit">Join as co-teacher</button><p class="lv-msg" id="lvtCoMsg" role="status"></p></form>' +
      '<div class="d5-card" style="margin-top:16px"><p class="d5-lead">Department</p><p class="d5-mut">Share class numbers with your department head and colleagues, without student names.</p><p style="margin:10px 0 0"><a class="lp-btn sm ghost" href="' + deptHref() + '">Department view</a></p></div></aside></div><div style="height:60px"></div></div>'));
    document.getElementById('lvtNew').addEventListener('submit', function(e){
      e.preventDefault();
      call('teach_create_class', { p_course: document.getElementById('lvtNCourse').value, p_name: document.getElementById('lvtNName').value, p_unit_order: [] }).then(function(r){
        if(!r){ var m = document.getElementById('lvtNMsg'); m.textContent = 'That did not work. Check the name and try again.'; m.className = 'lv-msg is-bad'; return; }
        location.href = '?c=' + encodeURIComponent(r.id) + '#settings';
      });
    });
  }

  /* ------------------------------------------------------------- class home */
  function joinLink(){ return location.origin + '/join.html?c=' + S.rep.class.code; }
  function codeArt(){
    var n = D.members.length;
    return '<div class="tm-code" aria-label="Join code"><p class="tm-code-k">Students join with</p><p class="tm-code-v">' + esc(S.rep.class.code) + '</p>' +
      '<p class="tm-code-u">levlprep.com/join</p><div class="tm-code-b"><button class="lp-btn gold sm" data-copy="link" type="button">Copy join link</button><button class="lp-btn sm tm-line" data-show="code" type="button">Show on screen</button></div>' +
      '<p class="hand tm-code-h">' + (n ? plural(n, 'student') + ' so far' : 'no students yet') + '</p></div>';
  }
  function topicWeek(){
    var since = Date.now() - 7 * DAY, by = {};
    D.members.forEach(function(m){ M.rows(m.summary).forEach(function(r){ if(r.seen < since) return; var o = by[r.t] || (by[r.t] = { n: 0, wrong: 0 }); o.n++; if(!r.right) o.wrong++; }); });
    return Object.keys(by).map(function(t){ return { t: t, n: by[t].n, rate: by[t].wrong / by[t].n }; }).filter(function(x){ return x.n >= 6; }).sort(function(a, b){ return b.rate - a.rate; });
  }
  function needs(){
    var out = [], now = Date.now();
    D.assign.forEach(function(a){
      if(!a.required || !a.open || !a.due_at) return;
      var due = Date.parse(a.due_at);
      if(due > now && due - now < 2 * DAY && a.n.not){
        var names = a.who.filter(function(m){ return a.st[m.id].state === 'not'; }).map(function(m){ return m.name; });
        out.push({ t: plural(a.n.not, 'student') + ' haven’t started ' + esc(a.title) + ', due ' + (due - now < DAY ? 'within a day' : 'tomorrow'),
          s: esc(names.slice(0, 3).join(', ')) + (names.length > 3 ? ' and ' + (names.length - 3) + ' more' : ''),
          b: '<a class="lp-btn sm tm-line" href="#a/' + a.id + '">See who</a><button class="lp-btn gold sm" type="button" data-copytext="' + esc(names.join(', ')) + '">Copy their names</button>' });
      }
      if(due < now && now - due < 7 * DAY && a.n.missing) out.push({ t: plural(a.n.missing, 'student') + ' missed ' + esc(a.title), s: 'It was due ' + day(due) + '.', b: '<a class="lp-btn sm tm-line" href="#a/' + a.id + '">See who</a>' });
    });
    var tw = topicWeek()[0];
    if(tw && tw.rate >= 0.4) out.push({ t: 'The class is stuck on ' + esc(topicName(tw.t)), s: Math.round(tw.rate * 100) + '% of this week’s answers on it were wrong.',
      b: '<a class="lp-btn sm tm-line" href="#topic/' + esc(tw.t) + '">See the questions</a><a class="lp-btn gold sm" href="#assign/' + esc(tw.t) + '">Fix it: assign practice</a>' });
    var fc = M.flagCounts(D.members), top = Object.keys(fc).sort(function(x, y){ return fc[y] - fc[x]; })[0];
    if(top && fc[top] >= 2){
      var t = (/^[a-z]+-(.+)-\d+$/.exec(top) || [])[1];
      out.push({ t: fc[top] + ' students flagged the same question as confusing', s: t && D.topics[t] ? esc(topicName(t)) : '', b: t && D.topics[t] ? '<a class="lp-btn sm tm-line" href="#topic/' + esc(t) + '">Look at it</a>' : '' });
    }
    var idle = D.members.filter(function(m){ return !m.last || now - m.last > 7 * DAY; });
    if(idle.length && D.members.length) out.push({ t: plural(idle.length, 'student') + (idle.length === 1 ? ' hasn’t' : ' haven’t') + ' studied in a week', s: esc(idle.slice(0, 3).map(function(m){ return m.name; }).join(', ')) + (idle.length > 3 ? ' and ' + (idle.length - 3) + ' more' : ''), b: '<a class="lp-btn sm tm-line" href="#students">See them</a>' });
    return out.slice(0, 4);
  }
  function arow(a){
    var n = a.n, all = n.all || 1, kind = KIND[a.kind];
    var tags = (a.required ? '<span class="lv-tag is-req">Required</span> ' : '<span class="lv-tag">Optional</span> ') + (n.late ? '<span class="lv-tag is-late">' + n.late + ' late</span> ' : '') + (n.missing ? '<span class="lv-tag is-late">' + n.missing + ' missing</span> ' : '');
    var meta = kind + (a.spec && a.spec.count && a.kind === 'practice' ? ' &middot; ' + a.spec.count + ' questions' : '') + (a.kind === 'mastery' ? ' &middot; to ' + pct(a.spec.target || 0.8) : '') + (ctl(a).timeLimit ? ' &middot; ' + ctl(a).timeLimit + ' min' : '') + (a.due_at ? ' &middot; due ' + day(Date.parse(a.due_at)) : '');
    var score = a.avg == null ? '·' : a.kind === 'frq' && a.spec && a.spec.points ? (a.avg * a.spec.points).toFixed(1) : pct(a.avg);
    return '<a class="lvt-arow" href="#a/' + a.id + '"><div><b>' + esc(a.title) + '</b><small>' + tags + meta + '</small></div><div class="hide"><div class="lv-bar"><i style="width:' + (n.done / all * 100) + '%"></i><i class="p" style="width:' + (n.prog / all * 100) + '%"></i><i class="l" style="width:' + (n.missing / all * 100) + '%"></i></div>' +
      '<small>' + n.done + ' done &middot; ' + n.prog + ' in progress &middot; ' + n.not + ' not started' + (n.missing ? ' &middot; ' + n.missing + ' missing' : '') + '</small></div><div class="lvt-score">' + score + '<small>' + (a.kind === 'frq' && a.spec && a.spec.points ? 'of ' + a.spec.points + ' avg' : 'class avg') + '</small></div></a>';
  }
  function unitRows(fn){
    return D.order.map(function(u, i){
      var cls = i === D.curIdx ? ' is-now' : (D.curIdx >= 0 && i > D.curIdx ? ' is-later' : '');
      return fn(u, cls, i);
    }).join('');
  }
  function checkOn(){
    var now = Date.now(), cu = D.current, out = [];
    D.members.forEach(function(m){
      var missing = D.assign.filter(function(a){ return a.st[m.id] && a.st[m.id].state === 'missing'; }).length;
      var idle = m.last ? Math.floor((now - m.last) / DAY) : 999;
      var cm = cu ? m.um[cu] : m.overall, avg = cu ? D.unitAvg[cu] : 0;
      var score = (idle >= 7 ? 3 : 0) + missing * 2 + (cu && m.summary && cm < avg - 0.2 ? 2 : 0);
      var why = [];
      if(idle >= 7) why.push(idle === 999 ? 'Has not studied here yet' : 'Not active for ' + idle + ' days');
      if(missing) why.push(plural(missing, 'assignment') + ' missing');
      if(cu && m.summary && cm < avg - 0.2) why.push(pct(cm) + ' in ' + unitName(cu) + ' (class ' + pct(avg) + ')');
      if(score) out.push({ m: m, score: score, why: why.join(' &middot; '), tone: 'bad' });
    });
    out.sort(function(a, b){ return b.score - a.score; });
    var res = out.slice(0, 3);
    if(cu){ var ahead = D.members.filter(function(m){ return m.um[cu] >= 0.8; }).sort(function(a, b){ return b.um[cu] - a.um[cu]; })[0];
      if(ahead) res.push({ m: ahead, why: 'Way ahead: ' + pct(ahead.um[cu]) + ' in ' + unitName(cu) + ' already', tone: 'good' }); }
    return res;
  }
  function srow(x){
    var bg = x.tone === 'good' ? 'var(--ctint)' : '#FCE8E3', fg = x.tone === 'good' ? 'var(--accent)' : '#B4412F';
    return '<a class="lvt-srow" href="#s/' + x.m.id + '"><span class="lvt-av" style="background:' + bg + ';color:' + fg + '">' + esc(initials(x.m.name)) + '</span><span style="flex:1"><b>' + esc(x.m.name) + '</b><small>' + x.why + '</small></span>' + CHEV + '</a>';
  }
  function viewHome(){
    var c = S.rep.class, cn = course().name, n = D.members.length;
    var nd = needs();
    var code = '<div class="tm-jc" aria-label="Join code"><span class="k">Join code</span><span class="v">' + esc(c.code) + '</span>' +
      '<button class="lp-btn gold sm" data-copy="link" type="button">Copy join link</button><button class="lp-btn sm tm-line" data-show="code" type="button">Show on screen</button>' +
      '<span class="n">' + (n ? plural(n, 'student') : 'no students yet') + '</span></div>';
    var html = sband({ crumbs: [YOURS, [esc(c.name)]], issue: esc(cn) + ' &middot; Teacher', title: esc(c.name),
      lede: plural(n, 'student') + (D.current ? ' &middot; now teaching ' + esc(unitName(D.current)) : ''), right: code });
    var main = '';
    if(!n){
      main += '<div class="d5-card tm-empty"><p class="d5-lead">No students yet</p><p class="d5-mut">Share the join link or show the code on screen. Students sign in with Google or an emailed code, then see exactly what you’ll see before they join.</p>' +
        '<p class="lv-btns" style="justify-content:center;margin-top:16px"><button class="lp-btn gold" data-copy="link" type="button">Copy join link</button><button class="lp-btn ghost" data-show="code" type="button">Show the code on screen</button><a class="lp-btn ghost" href="#settings">Set your unit order</a></p></div>';
    }
    main += '<div class="d5-now tm-today"><p class="tm-today-h">What needs you today</p>' +
      (nd.length ? nd.map(function(x){ return '<div class="tm-now"><div class="tx"><b>' + x.t + '</b><span>' + x.s + '</span></div>' + x.b + '</div>'; }).join('')
        : '<div class="tm-now"><div class="tx"><b>Nothing needs you right now</b><span>Late work, struggling topics and flagged questions show up here.</span></div><a class="lp-btn gold sm" href="#assign">Assign something</a></div>') +
      '<p class="tm-today-f"><a href="#work">' + (D.assign.length ? 'All ' + plural(D.assign.length, 'assignment') : 'Assign work') + '</a></p></div>';
    var ur = unitRows(function(u, cls){ var v = D.unitAvg[u]; return '<div class="lvt-urow' + cls + '"><div><b>' + esc(unitName(u)) + (cls === ' is-now' ? ' &middot; now' : '') + '</b><small>' + esc(unitTitle(u)) + '</small></div><div class="bar"><i style="width:' + Math.round(v * 100) + '%"></i></div><div class="v">' + pct(v) + '</div></div>'; });
    main += '<div class="d5-card"><p class="d5-lead">Mastery by unit, in your order</p><p class="d5-mut">Class average' + (D.current ? '. Units you haven’t reached yet are faded.' : '. Set the unit you’re on in Settings.') + '</p>' + ur + '</div>';
    var co = checkOn();
    var rail = '<div class="d5-card"><p class="d5-lead">Students to check on</p><p class="d5-mut">Picked from missing work, scores and activity.</p><div style="margin-top:6px">' + (co.length ? co.map(srow).join('') : '<p class="d5-empty">Nobody stands out right now.</p>') + '</div>' +
      (n ? '<p style="margin:12px 0 0"><a href="#students" style="font-weight:800">All ' + plural(n, 'student') + '</a></p>' : '') + '</div>' + announceHtml();
    html += body('<div class="tm-split"><div class="tm-mainc">' + main + '</div><aside class="tm-rail">' + rail + '</aside></div>') + '<div style="height:60px"></div>';
    render(frame(html, c.course), 'home');
    writeDeptStats();
  }

  /* ------------------------------------------------------------- announcements */
  // Tell the class: the box first, the posted ones folded under it (owner 2026-11-08).
  function announceHtml(){
    var list = (S.rep.announcements || []).slice(0, 6);
    return '<form class="d5-card tm-annc" id="lvtAnn"><p class="d5-lead">Tell the class</p>' +
      '<label class="lv-field" style="margin-top:12px"><span class="tm-sr">Announcement</span><textarea class="lv-in tm-ta" id="lvtAnnBody" maxlength="1000" rows="3" placeholder="Unit 4 test moved to Friday. Finish the signaling practice first." required></textarea></label>' +
      '<p class="lv-btns" style="margin:0"><button class="lp-btn gold sm" type="submit">Post to ' + esc(S.rep.class.name) + '</button></p><p class="lv-msg" id="lvtAnnMsg" role="status" style="margin:6px 0 0"></p>' +
      '<p class="d5-mut" style="margin-top:6px">Shows at the top of their course home, under your name.</p>' +
      (list.length ? '<details class="tm-fold"><summary>' + plural(list.length, 'posted', 'posted') + '</summary>' + list.map(function(n){
        return '<div class="tm-ann"><p>' + esc(n.body) + '</p><small>' + esc(n.author) + ' &middot; ' + day(Date.parse(n.created_at)) + (n.mine || isOwner() ? ' &middot; <button type="button" class="tm-link" data-delann="' + esc(n.id) + '">Delete</button>' : '') + '</small></div>';
      }).join('') + '</details>' : '<p class="d5-empty" style="margin-top:10px">Nothing posted yet.</p>') + '</form>';
  }
  function postAnnouncement(){
    var el = document.getElementById('lvtAnnBody'), msg = document.getElementById('lvtAnnMsg'), body = (el.value || '').trim();
    if(!body) return;
    msg.textContent = 'Posting…'; msg.className = 'lv-msg';
    call('teach_post_announcement', { p_class: CLASS_ID, p_body: body }).then(function(id){
      if(!id){ msg.textContent = 'That did not post. Try again.'; msg.className = 'lv-msg is-bad'; return; }
      loadClass().then(function(){ route(); var m = document.getElementById('lvtAnnMsg'); if(m){ m.textContent = 'Posted. Students see it next time they open the course.'; } });
    });
  }

  /* ------------------------------------------------------------- department numbers (no student names) */
  function writeDeptStats(){
    if(DEMO || !S.rep || !S.rep.class.dept_shared) return;
    var key = 'levlprep_teach_dept_' + CLASS_ID, last = 0;
    try{ last = +localStorage.getItem(key) || 0; }catch(e){}
    if(Date.now() - last < 3600000) return;
    try{ localStorage.setItem(key, String(Date.now())); }catch(e){}
    call('teach_update_class', { p_class: CLASS_ID, p_patch: { dept_stats: deptStats() } });
  }
  function deptStats(){
    var now = Date.now(), units = {}, req = D.assign.filter(function(a){ return a.required && a.due_at && Date.parse(a.due_at) < now; });
    D.order.forEach(function(u){ units[u] = Math.round(D.unitAvg[u] * 100) / 100; });
    var slots = 0, onTime = 0; req.forEach(function(a){ a.who.forEach(function(m){ slots++; var x = a.st[m.id]; if(x.state === 'done' && !x.late) onTime++; }); });
    return { n: D.members.length, active7: D.members.filter(function(m){ return m.last && now - m.last < 7 * DAY; }).length, order: D.order, current: D.current, units: units,
             assigned: D.assign.length, onTime: slots ? Math.round(onTime / slots * 100) / 100 : null, overall: D.members.length ? Math.round(D.members.reduce(function(x, m){ return x + m.overall; }, 0) / D.members.length * 100) / 100 : null };
  }

  /* ------------------------------------------------------------- assignments */
  function viewWork(){
    var c = S.rep.class, now = Date.now();
    var soon = D.assign.filter(function(a){ var d = a.due_at && Date.parse(a.due_at); return a.open && d && d > now && d - now < 2 * DAY; }).length;
    var miss = D.assign.filter(function(a){ return a.n.missing; }).length;
    var lede = [plural(D.assign.length, 'assignment')].concat(soon ? [soon + ' due in the next two days'] : []).concat(miss ? [plural(miss, 'has', 'have').replace(/^(\d+) /, '$1 ') + ' missing work'] : []).join(' &middot; ');
    var html = sband({ crumbs: classCrumbs([['Assignments']]), issue: classIssue(), title: 'Assignments', lede: lede,
      ctas: '<a class="btn-chan" href="#assign">Assign work</a><a class="btn-ghost" href="#bank" id="lvtBankLink">Your questions</a>' }) +
      body(D.assign.length ? '<div class="d5-card lvt-list">' + D.assign.map(arow).join('') + '</div>' : '<div class="d5-card tm-empty"><p class="d5-lead">Nothing assigned yet</p><p style="margin:14px 0 0"><a class="lp-btn gold" href="#assign">Assign work</a></p></div>') + '<div style="height:60px"></div>';
    render(frame(html, c.course), 'work');
    myQuestions().then(function(qs){ var l = document.getElementById('lvtBankLink'); if(l && qs.length) l.textContent = 'Your questions (' + qs.length + ')'; });
  }
  function col(title, cls, ms, a, valFn, empty){
    var rows = ms.map(function(m){ return '<a class="lvt-p" href="#s/' + m.id + '" style="text-decoration:none;color:var(--ink)"><span class="lvt-av" style="width:28px;height:28px;font-size:11px">' + esc(initials(m.name)) + '</span><b>' + esc(m.name) + '</b><span>' + valFn(m) + '</span></a>'; });
    var shown = rows.slice(0, 8).join(''), rest = rows.slice(8).join('');
    return '<div class="lvt-col"><h3>' + title + ' <span class="lv-tag ' + cls + '">' + ms.length + '</span></h3>' + (shown || '<p class="d5-mut">' + empty + '</p>') +
      (rest ? '<details><summary class="d5-mut" style="cursor:pointer;margin:6px 4px">' + (rows.length - 8) + ' more</summary>' + rest + '</details>' : '') +
      (ms.length ? '<p style="margin:12px 0 0"><button class="lp-btn sm ghost" type="button" data-copytext="' + esc(ms.map(function(m){ return m.name; }).join(', ')) + '">Copy names</button></p>' : '') + '</div>';
  }
  /* Each question folds to one line (topic, stem, % wrong, the wrong answer most picked); the choices, who got it wrong
     and Assign practice open on tap (owner 2026-11-08). */
  function struggleHtml(id, items){
    if(!items.length) return '<div class="d5-card tm-empty"><p class="d5-lead">Not enough answers yet</p><p class="d5-mut">Questions show here once at least two students have answered them.</p></div>';
    return '<div class="d5-card lvt-list" id="' + id + '">' + items.map(function(o){ return '<div class="lvt-qi tm-qi" data-item="' + esc(o.id) + '"><details class="tm-q"><summary><div class="tm-qs"><p class="lv-kick">' + esc(topicName(o.t)) + '</p><p class="stem d5-mut">Loading the question…</p></div></summary></details></div>'; }).join('') + '</div>';
  }
  function fillStruggle(id, items){
    items.forEach(function(o){
      var t = D.topics[o.t], unit = t ? (t.bank || t.unit) : o.u;
      bankFor(unit).then(function(by){
        var box = document.querySelector('#' + id + ' [data-item="' + (window.CSS && CSS.escape ? CSS.escape(o.id) : o.id) + '"]'); if(!box) return;
        var it = by[o.id], wrongPct = Math.round(o.wrong / o.n * 100), right = '', pick = '';
        if(it && it.type === 'single' && it.options){
          var total = Object.keys(o.picks).reduce(function(x, k){ return x + o.picks[k]; }, 0);
          if(total){
            var top = null;
            right = it.options.map(function(op, i){
              var n = o.picks[i] || 0, p = Math.round(n / total * 100), ok = i === it.correct;
              if(!ok && n && (!top || n > top.n)) top = { i: i, n: n, p: p };
              return '<div class="lvt-opt"><span class="l' + (ok ? ' ok' : '') + '">' + String.fromCharCode(65 + i) + '</span><div class="b"><i class="' + (ok ? 'ok' : n ? 'no' : '') + '" style="width:' + p + '%"></i><span>' + rich(op) + '</span></div><span class="v">' + p + '%</span></div>';
            }).join('') + (top ? '<p class="lvt-miss">most wrong answers picked ' + String.fromCharCode(65 + top.i) + '</p>' : '') + '<p class="d5-mut" style="font-size:12.5px">From ' + plural(total, 'student') + ' whose pick was saved.</p>';
            if(top) pick = '<span class="lv-tag tm-pick">picked ' + String.fromCharCode(65 + top.i) + '</span>';
          }
        }
        var open = box.querySelector('details') && box.querySelector('details').open;
        box.innerHTML = '<details class="tm-q"' + (open ? ' open' : '') + '><summary><div class="tm-qs"><p class="lv-kick">' + esc(topicName(o.t)) + '</p><p class="stem">' + (it ? rich(it.q) : 'Question ' + esc(o.id)) + '</p></div>' +
          '<div class="tm-qt"><span class="lv-tag is-late">' + wrongPct + '% wrong</span><span class="lv-tag">' + plural(o.n, 'answer') + '</span>' + (o.flags ? '<span class="lv-tag is-prog">' + plural(o.flags, 'flag') + '</span>' : '') + pick + '</div></summary>' +
          '<div class="tm-qbody"><div>' + right + '</div><div class="lv-btns"><a class="lp-btn sm ghost" href="#assign/' + esc(o.t) + '">Assign practice on this topic</a>' + (o.who.length ? '<details><summary class="lp-btn sm ghost" style="list-style:none">Who got it wrong</summary><p class="tm-who-list">' + esc(o.who.join(', ')) + '</p></details>' : '') + '</div></div></details>';
      });
    });
  }
  function topicRows(topics, filter){
    return topics.map(function(t){
      var n = 0, w = 0;
      D.members.forEach(function(m){ M.rows(m.summary).forEach(function(r){ if(r.t === t && (!filter || filter(r))){ n++; if(!r.right) w++; } }); });
      if(!n) return '<div class="lvt-trow"><b>' + esc(topicName(t)) + '</b><span class="hide"></span><span class="lvt-score" style="font-size:17px">·</span><span class="d5-mut">No answers yet</span></div>';
      var v = Math.round((n - w) / n * 100), color = v < 60 ? '#D9694F' : v < 80 ? 'var(--amber)' : 'var(--accent)';
      return '<div class="lvt-trow"><b>' + esc(topicName(t)) + '</b><div class="hide lv-bar"><i style="width:' + v + '%;background:' + color + '"></i></div><span class="lvt-score" style="font-size:17px">' + v + '%</span>' +
        (v < 80 ? '<a class="lp-btn sm gold" href="#assign/' + esc(t) + '">Fix it: assign</a>' : '<span class="lv-tag is-done">Solid</span>') + '</div>';
    }).join('');
  }
  function viewAssignment(arg){
    var parts = String(arg || '').split('/'), id = parts[0], view = parts[1] || 'students';
    var a = D.assign.filter(function(x){ return x.id === id; })[0];
    if(!a){ location.hash = '#work'; return; }
    var c = S.rep.class, ms = a.who, st = a.st;
    var not = ms.filter(function(m){ return st[m.id].state === 'not' || st[m.id].state === 'missing'; }),
        prog = ms.filter(function(m){ return st[m.id].state === 'progress'; }),
        done = ms.filter(function(m){ return st[m.id].state === 'done'; }).sort(function(x, y){ return (st[y.id].score || 0) - (st[x.id].score || 0); });
    var topics = (a.spec && a.spec.topics) || [], opens = Date.parse(a.opens_at);
    var filter = function(r){ return r.seen >= opens && (!topics.length || topics.indexOf(r.t) !== -1); };
    var drill = a.kind === 'practice' || a.kind === 'review' || a.kind === 'mastery';
    var items = drill ? M.itemStats(ms, filter).filter(function(o){ return o.wrong; }).slice(0, 6) : [];
    var flags = 0, fc = M.flagCounts(ms); Object.keys(fc).forEach(function(k){ var t = (/^[a-z]+-(.+)-\d+$/.exec(k) || [])[1]; if(!topics.length || topics.indexOf(t) !== -1) flags++; });
    var lateTxt = a.late_until ? 'late work until ' + day(Date.parse(a.late_until)) : 'no late work';
    var lede = [(a.required ? 'Required ' : 'Optional ') + KIND[a.kind].toLowerCase()]
      .concat(a.kind === 'practice' ? [a.spec.count + ' questions'] : [])
      .concat(a.kind === 'mastery' ? ['until ' + pct(a.spec.target || 0.8) + ' on each topic, at least ' + (a.spec.min == null ? 10 : a.spec.min) + ' answers'] : [])
      .concat(a.due_at ? ['due ' + day(Date.parse(a.due_at))] : []).concat([lateTxt]).concat(ctlText(a) ? [ctlText(a)] : [])
      .concat(topics.length ? [esc(topics.map(function(x){ var tt = D.topics[x]; return tt && tt.ced ? tt.ced : topicName(x); }).join(', '))] : []).join(' &middot; ');
    var html = sband({ crumbs: classCrumbs([['Assignments', '#work'], [esc(a.title)]]), issue: classIssue(), title: esc(a.title), lede: lede });
    var out = '<div class="lvt-stats tm-stats0"><div class="lvt-stat"><b>' + a.n.done + ' of ' + a.n.all + '</b><span>done</span></div><div class="lvt-stat"><b>' + (a.avg == null ? '·' : pct(a.avg)) + '</b><span>class average so far</span></div>' +
      '<div class="lvt-stat"><b>' + (a.n.not + a.n.missing) + '</b><span>' + (a.n.missing ? 'not started or missing' : 'not started') + '</span></div><div class="lvt-stat"><b>' + flags + '</b><span>questions flagged as confusing</span></div></div>';
    // One row of actions; reminders and grade passback open from their buttons (cards from teach-integrations.js).
    var nRemind = a.n.not + a.n.missing;
    var more = (a.kind !== 'frq' ? '<a href="#print/' + a.id + '">Print worksheet</a>' : '') + '<button type="button" data-csv="' + a.id + '">Export CSV</button>' +
      (isOwner() ? '<button type="button" class="tm-danger" data-del="' + a.id + '">Delete this assignment</button>' : '<p class="d5-mut" style="margin:6px 12px">Only the class’s owner can delete assignments.</p>');
    out += '<div class="tm-acts"><a class="lp-btn gold sm" href="#assign/edit/' + a.id + '">Edit</a>' +
      menu(nRemind ? 'Remind ' + plural(nRemind, 'student') : 'Remind', '<div id="lvtSlotRemind"></div>', ' data-lvt-slot="lvtSlotRemind" hidden') +
      menu('Send grades', '<div id="lvtSlotGrades"></div>', ' data-lvt-slot="lvtSlotGrades" hidden') +
      menu('More', '<div class="tm-poplist">' + more + '</div>') + '</div>';
    var vs = [['#a/' + a.id, 'Students', 'students']];
    if(drill) vs.push(['#a/' + a.id + '/questions', 'Questions' + (flags ? ' &middot; ' + flags + ' flagged' : ''), 'questions']);
    if(drill && topics.length) vs.push(['#a/' + a.id + '/topics', 'Topics', 'topics']);
    if(!vs.some(function(v){ return v[2] === view; })) view = 'students';
    if(vs.length > 1) out += views(vs, view);
    var val = function(m){ var s = st[m.id]; if(a.kind === 'mastery' && s.state !== 'done') return s.state === 'missing' ? 'missing' : s.since ? pct(s.mastery) + ' &middot; ' + s.met + ' of ' + s.total + ' topics' : ago(m.last);
      return s.state === 'done' ? (s.score == null ? 'done' : pct(s.score)) + (s.late ? ' late' : '') : s.state === 'progress' ? s.answered + ' of ' + s.total : s.state === 'missing' ? 'missing' : ago(m.last); };
    if(view === 'students'){
      out += '<div class="lvt-cols">' + col(a.n.missing ? 'Not started or missing' : 'Not started', 'is-late', not, a, val, 'Everyone has started.') + col('In progress', 'is-prog', prog, a, val, 'Nobody is midway.') + col('Done', 'is-done', done, a, val, 'Nobody has finished yet.') + '</div>';
      var timed = timedHtml(a);
      if(timed) out += '<div style="margin-top:18px">' + timed + '</div>';
      out += '<div id="lvtSlotFrq" class="tm-slotfrq"></div>';
    } else if(view === 'questions'){
      out += '<p class="tm-note">Most missed first. Tap a question to see what the class picked.</p>' + struggleHtml('lvtQs', items);
    } else {
      out += '<div class="d5-card lvt-list">' + topicRows(topics, filter) + '</div>';
    }
    out += '<div id="lvtIntA" hidden></div>';
    html += body(out) + '<div style="height:60px"></div>';
    render(frame(html, c.course), 'work');
    if(view === 'questions') fillStruggle('lvtQs', items);
    hook('assignment', 'lvtIntA', { assignment: a });
  }
  /* Integrity column: time used against the limit (with each student's extra time) and tab leaves, from the
     attempts the course engines record (summary.att). A tab leave is a hint to talk to the student, not proof. */
  function timedHtml(a){
    var lim = ctl(a).timeLimit, rows = a.who.filter(function(m){ return a.st[m.id].att; });
    if(!lim && !rows.length) return '';
    var body = rows.sort(function(x, y){ return (a.st[y.id].tabs || 0) - (a.st[x.id].tabs || 0); }).map(function(m){
      var s = a.st[m.id], allowed = lim ? lim * (m.extra_time || 1) : null, used = Math.round((s.used || 0) / 60000);
      var over = allowed && s.att.end && used > allowed + 1, t = s.tabs || 0;
      return '<tr><td class="nm"><a href="#s/' + m.id + '">' + esc(m.name) + '</a></td><td>' + (s.att.end ? used + ' min' : 'working') + (allowed ? ' <small>of ' + Math.round(allowed) + (m.extra_time > 1 ? ' (extra time)' : '') + '</small>' : '') + (over ? ' <span class="lv-tag is-late">over</span>' : '') + '</td>' +
        '<td>' + (s.att.n || 0) + '</td><td>' + (s.score == null ? '·' : pct(s.score)) + '</td><td>' + (t >= 3 ? '<span class="lv-tag is-late">' + t + ' tab leaves</span>' : t ? '<span class="lv-tag is-prog">' + t + '</span>' : '<span class="lv-tag is-done">none</span>') + '</td></tr>';
    }).join('');
    return '<div class="d5-card"><p class="d5-lead">' + (lim ? lim + '-minute limit' : 'Timed attempts') + '</p><p class="d5-mut">From the course page each student worked on: time used, and how often they left the tab while the clock ran. Leaving the tab is a reason to ask, not proof of cheating.</p>' +
      (body ? '<div class="lvt-gb tm-int"><table><thead><tr><th class="nm">Student</th><th>Time</th><th>Answers</th><th>Score</th><th>Left the tab</th></tr></thead><tbody>' + body + '</tbody></table></div>' : '<p class="d5-empty">No timed attempts yet. They show here as students start.</p>') + '</div>';
  }
  function viewTopic(t){
    if(!D.topics[t]){ location.hash = '#home'; return; }
    var items = M.itemStats(D.members, function(r){ return r.t === t; }).filter(function(o){ return o.wrong; }).slice(0, 8);
    var tw = topicWeek().filter(function(x){ return x.t === t; })[0];
    var html = sband({ crumbs: classCrumbs([[esc(topicName(t))]]), issue: classIssue(), title: esc(topicName(t)),
      lede: (tw ? Math.round(tw.rate * 100) + '% of this week’s answers wrong &middot; ' : '') + 'most missed first &middot; tap a question to see what the class picked',
      ctas: '<a class="btn-chan" href="#assign/' + esc(t) + '">Fix it: assign practice</a>' }) +
      body('<div class="tm-topic">' + struggleHtml('lvtQs', items) + '</div>') + '<div style="height:60px"></div>';
    render(frame(html, S.rep.class.course), 'home');
    fillStruggle('lvtQs', items);
  }

  /* ------------------------------------------------------------- assign builder */
  var B = null;
  function newDraft(arg){
    var now = new Date(), due = new Date(now.getTime() + 3 * DAY); due.setHours(23, 59, 0, 0);
    var d = { id: null, kind: 'practice', topics: [], count: 20, unit: '', frq: '', required: true, opens: '', due: local(due), late: 2, who: 'all', students: [], title: '', titleTouched: false,
              target: 0.8, min: 10, timeLimit: 0, shuffle: false, release: 'now', questions: [], also: [] };
    if(arg && arg.indexOf('edit/') === 0){
      var a = D.assign.filter(function(x){ return x.id === arg.slice(5); })[0];
      if(a){ var dueT = a.due_at ? Date.parse(a.due_at) : null;
        d = { id: a.id, kind: a.kind, topics: (a.spec.topics || []).slice(), count: a.spec.count || 20, unit: a.spec.unit || '', frq: a.spec.frq || '', required: a.required,
              opens: Date.parse(a.opens_at) > Date.now() ? local(new Date(a.opens_at)) : '', due: dueT ? local(new Date(dueT)) : '', late: a.late_until && dueT ? Math.round((Date.parse(a.late_until) - dueT) / DAY) : 0,
              who: a.students ? 'some' : 'all', students: (a.students || []).slice(), title: a.title, titleTouched: true,
              target: a.spec.target || 0.8, min: a.spec.min == null ? 10 : a.spec.min, timeLimit: ctl(a).timeLimit || 0, shuffle: !!ctl(a).shuffle,
              release: ctl(a).release || 'now', questions: (ctl(a).questions || []).slice(), also: [] }; }
    } else if(arg && arg.indexOf('student/') === 0){ d.who = 'some'; d.students = [arg.slice(8)]; }
    else if(arg && D.topics[arg]) d.topics = [arg];
    return d;
  }
  function local(dt){ var p = function(n){ return (n < 10 ? '0' : '') + n; }; return dt.getFullYear() + '-' + p(dt.getMonth() + 1) + '-' + p(dt.getDate()) + 'T' + p(dt.getHours()) + ':' + p(dt.getMinutes()); }
  function autoTitle(){
    var t = B.topics;
    if(B.kind === 'exam') return B.unit ? unitName(B.unit) + ' test: ' + unitTitle(B.unit) : 'Full practice exam';
    if(B.kind === 'frq'){ var f = (S.frqs || []).filter(function(x){ return x.id === B.frq; })[0]; return 'Free response: ' + (f ? f.title : 'pick one'); }
    var word = B.kind === 'review' ? 'review' : B.kind === 'mastery' ? 'mastery' : 'practice';
    var head = t.length === 1 ? D.topics[t[0]].title : t.length ? (function(){ var us = t.map(function(x){ return D.topics[x].unit; }).filter(function(v, i, a){ return a.indexOf(v) === i; }); return us.length === 1 ? unitName(us[0]) + ' ' + word : t.length + ' topics'; })() : (B.kind === 'review' ? 'Review your misses' : B.kind === 'mastery' ? 'Mastery' : 'Practice');
    return B.kind === 'review' && t.length ? 'Review: ' + head : B.kind === 'mastery' && t.length === 1 ? 'Master ' + head : head;
  }
  function weakTopics(){
    var allowed = (D.curIdx >= 0 ? D.order.slice(0, D.curIdx + 1) : D.order).concat(D.extra);
    var by = {}; D.members.forEach(function(m){ M.rows(m.summary).forEach(function(r){ if(allowed.indexOf(r.u) === -1) return; var o = by[r.t] || (by[r.t] = { n: 0, w: 0 }); o.n++; if(!r.right) o.w++; }); });
    return Object.keys(by).filter(function(t){ return by[t].n >= 4 && D.topics[t]; }).sort(function(a, b){ return by[b].w / by[b].n - by[a].w / by[a].n; }).slice(0, 3);
  }
  function viewAssign(arg){
    if(!B || B.arg !== arg){ B = newDraft(arg); B.arg = arg; }
    Promise.all([frqIndex(), myQuestions(), myClasses()]).then(function(){ if(location.hash.indexOf('#assign') === 0) drawAssign(); });
    drawAssign();
  }
  /* The builder is the student Practice panel's layout (owner 2026-11-08): the kind on the left, its settings in the
     middle (only what applies to that kind), a live summary with the title and one button on the right. */
  function cellH(lab, ctl, why, cls){ return '<div class="pp-cell' + (cls ? ' ' + cls : '') + '"><span class="pp-lab">' + lab + '</span><div class="pp-ctl">' + ctl + (why ? '<p class="pp-why">' + why + '</p>' : '') + '</div></div>'; }
  function chipsH(attr, opts){ return '<div class="pp-chips">' + opts.map(function(o){ return '<button type="button" class="pp-chip" data-' + attr + '="' + o[0] + '" aria-pressed="' + !!o[2] + '">' + o[1] + '</button>'; }).join('') + '</div>'; }
  function selH(id, opts, val){ return '<select class="pp-sel" id="' + id + '">' + opts.map(function(o){ return '<option value="' + esc(o[0]) + '"' + (String(val) === String(o[0]) ? ' selected' : '') + '>' + o[1] + '</option>'; }).join('') + '</select>'; }
  // A drop-down of checkboxes that looks like the select (practice-panel.css .pp-ms); key keeps it open across redraws.
  function msH(key, label, inner){ return '<details class="pp-ms" data-ms="' + key + '"' + (B.openMs === key ? ' open' : '') + '><summary class="pp-sel">' + label + '</summary><div class="pp-ms-list">' + inner + '</div></details>'; }
  function controlsHtml(){
    if(B.kind === 'frq') return '';
    // Only the eleven AP® courses run assignments with controls (assets/class/class-run.js, ?la=); elsewhere, say so.
    if(!M.isAp(S.rep.class.course)) return '<div class="pp-grp"><h3 class="pp-gh">Controls</h3><p class="d5-mut" style="margin:0 0 20px">Time limits, shuffled questions, held answers and your own questions work on the AP® courses for now. In ' + esc(course().name || 'this course') + ', students do this assignment on the course’s usual pages, and you see their results here as usual.</p></div>';
    var times = [[0, 'No time limit'], [10, '10 minutes'], [15, '15 minutes'], [20, '20 minutes'], [30, '30 minutes'], [45, '45 minutes'], [60, '1 hour'], [90, '90 minutes'], [180, '3 hours']];
    if(B.timeLimit && !times.some(function(o){ return o[0] === B.timeLimit; })) times.push([B.timeLimit, B.timeLimit + ' minutes']);
    var mineIn = (S.qs || []).filter(function(x){ return !B.topics.length || B.kind === 'exam' || B.topics.indexOf(x.topic) !== -1 || B.questions.indexOf(x.id) !== -1; });
    var xt = D.members.filter(function(m){ return m.extra_time > 1; }).length;
    var mineLabel = B.questions.length ? plural(B.questions.length, 'question') + ' added' : 'None added';
    var mine = mineIn.length ? msH('myq', mineLabel, mineIn.map(function(x){ return '<label class="pp-ms-o"><input type="checkbox" data-myq="' + esc(x.id) + '"' + (B.questions.indexOf(x.id) !== -1 ? ' checked' : '') + '> <span>' + esc(String(x.q).slice(0, 110)) + (x.topic && D.topics[x.topic] ? ' <small class="d5-mut">' + esc(D.topics[x.topic].title) + '</small>' : '') + '</span></label>'; }).join('') + '<p class="tm-msu"><a href="#bank">Write or edit your questions</a></p>')
      : '<p class="d5-mut" style="margin:10px 0 0">' + ((S.qs || []).length ? 'None of your questions are on these topics. ' : 'You have not written any yet. ') + '<a href="#bank">Write questions</a></p>';
    return '<div class="pp-grp tm-2"><h3 class="pp-gh">Controls <small>optional, students see them before they start</small></h3>' +
      cellH('Time limit', selH('lvtTime', times, B.timeLimit), B.timeLimit ? (xt ? plural(xt, 'student') + ' with extra time get' + (xt === 1 ? 's' : '') + ' it on top. ' : '') + 'Set extra time on a student’s page.' : '') +
      cellH('Answers and explanations', selH('lvtRel', ['now', 'after_submit', 'after_due'].map(function(k){ return [k, RELEASE[k].charAt(0).toUpperCase() + RELEASE[k].slice(1)]; }), B.release)) +
      cellH('Shuffle', '<label class="pp-ms-o tm-plain"><input type="checkbox" id="lvtShuf"' + (B.shuffle ? ' checked' : '') + '> Shuffle questions and choices for each student</label>') +
      cellH('Your questions', mine) + '</div>';
  }
  function alsoHtml(){
    if(B.id) return '';
    var others = (S.classes || []).filter(function(c){ return c.id !== CLASS_ID && c.course === S.rep.class.course && !c.archived; });
    if(!others.length) return '';
    return cellH('Also assign to', B.who === 'some' ? '<p class="d5-mut" style="margin:0">Chosen students are in this class only, so other classes are off.</p>'
      : others.map(function(c){ return '<label class="pp-ms-o tm-plain"><input type="checkbox" data-also="' + esc(c.id) + '"' + (B.also.indexOf(c.id) !== -1 ? ' checked' : '') + '> ' + esc(c.name) + ' &middot; ' + plural(c.members, 'student') + '</label>'; }).join(''),
      B.who === 'some' ? '' : 'Same settings and dates; each class gets its own copy.');
  }
  function topicsLabel(){
    if(!B.topics.length) return B.kind === 'review' ? 'Every topic' : 'Pick topics';
    var names = B.topics.map(topicName);
    return esc(names.length > 2 ? names.slice(0, 2).join(', ') + ' and ' + (names.length - 2) + ' more' : names.join(', '));
  }
  function drawAssign(){
    var c = S.rep.class;
    if(!B.titleTouched) B.title = autoTitle();
    var ic = function(d){ return '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + d + '</svg>'; };
    var tile = function(k, n, d, i){ return '<button type="button" class="pp-tile" data-kind="' + k + '" aria-pressed="' + (B.kind === k) + '"><span class="pp-tile-i">' + ic(i) + '</span><span class="pp-tile-x"><b>' + n + '</b><span class="pp-tile-l">' + d + '</span></span></button>'; };
    var tiles = tile('practice', 'Practice', 'Questions on topics you pick', '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>') +
      tile('mastery', 'Mastery', 'Until each topic is mastered', '<path d="M12 3l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.4 6.8 19.1l1-5.8L3.5 9.2l5.9-.9z"/>') +
      tile('review', 'Review', 'Each student redoes their misses', '<path d="M20 11a8 8 0 0 0-14.5-4.5L4 8"/><path d="M4 4v4h4"/><path d="M4 13a8 8 0 0 0 14.5 4.5L20 16"/><path d="M20 20v-4h-4"/>') +
      tile('exam', 'Practice exam', M.isAp(c.course) ? 'A unit test or the full exam' : course().unitExams === false ? 'A full timed practice exam' : 'A ' + esc((course().unitWord || 'unit').toLowerCase()) + ' test or the final', '<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2.5"/><path d="M10 2h4"/>') +
      (course().frq === false ? '' : tile('frq', 'Free response', 'AP&reg; style, rubric scored', '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M14 6l4 4"/>'));
    var what = '';
    if(drillKind(B.kind)){
      var wt = weakTopics();
      var tlist = D.order.concat(D.extra).map(function(u){
        var ts = S.cur.topics.filter(function(t){ return t.unit === u && t.built !== false; });
        var picked = ts.filter(function(t){ return B.topics.indexOf(t.id) !== -1; }).length;
        return '<p class="tm-msu">' + esc(unitName(u)) + ' &middot; ' + esc(unitTitle(u)) + '</p><label class="pp-ms-o"><input type="checkbox" data-unitall="' + esc(u) + '"' + (picked === ts.length && ts.length ? ' checked' : '') + '> <b>The whole ' + esc((course().unitWord || 'unit').toLowerCase()) + '</b></label>' +
          ts.map(function(t){ return '<label class="pp-ms-o"><input type="checkbox" data-topic="' + esc(t.id) + '"' + (B.topics.indexOf(t.id) !== -1 ? ' checked' : '') + '> ' + esc(topicName(t.id)) + '</label>'; }).join('');
      }).join('');
      // NREMT's practice page drills a whole topic area, so a one-topic assignment can take more than one drill.
      var areaNote = course().topicFilter === false ? 'EMT practice drills a whole topic area, so students reach a topic’s questions inside its area’s drill. For practice, the whole area works best.' : '';
      var topicCtl = msH('topics', topicsLabel(), tlist) + (wt.length ? '<p class="tm-bhint">Class is weakest on ' + esc(topicName(wt[0])) + '. <button type="button" class="tm-link" data-weak="1">Use the ' + plural(wt.length, 'weakest topic') + '</button></p>' : '');
      what = cellH('Topics' + (B.kind === 'review' ? ' <small>optional</small>' : ''), topicCtl, B.kind === 'review' && !B.topics.length ? 'No topics picked: each student reviews every miss in the course.' : areaNote);
      if(B.kind === 'mastery'){
        what += cellH('Mastery target', chipsH('target', [0.6, 0.7, 0.8, 0.9].map(function(v){ return [v, pct(v), B.target === v]; })), 'Mastery is the course’s own number: recent right answers on each topic, harder questions counting more.') +
          cellH('At least this many answers', '<input class="pp-sel tm-num" type="number" min="1" max="200" id="lvtMin" value="' + B.min + '">', 'A student who already masters a topic still answers the minimum.');
      } else {
        what += cellH(B.kind === 'practice' ? 'Questions' : 'Most questions to redo', '<input class="pp-sel tm-num" type="number" min="1" max="100" id="lvtCount" value="' + B.count + '">');
      }
    } else if(B.kind === 'exam'){
      what = cellH('Unit test or full exam', selH('lvtUnit', [['', 'Full practice exam']].concat((course().unitExams === false ? [] : D.order).map(function(u){ return [u, esc(unitName(u) + ' test: ' + unitTitle(u))]; })), B.unit), 'Students take it on the course’s Exams page, timed as usual.');
    } else {
      var fs = (S.frqs || []).slice().sort(function(a, b){ return String(a.title).localeCompare(b.title); });
      what = cellH('Free response', selH('lvtFrq', [['', 'Pick one']].concat(fs.map(function(f){ return [f.id, esc(f.title) + (f.points ? ' (' + f.points + ' points)' : '')]; })), B.frq), 'Students score it against the rubric; Premium students can use the AI grader.');
    }
    var lateOpts = [[0, 'Not accepted'], [1, 'Up to 1 day late'], [2, 'Up to 2 days late'], [3, 'Up to 3 days late'], [7, 'Up to a week late']];
    if(B.late && !lateOpts.some(function(o){ return o[0] === B.late; })) lateOpts.push([B.late, 'Up to ' + plural(B.late, 'day') + ' late']);
    var when = '<div class="pp-grp tm-2"><h3 class="pp-gh">When</h3>' +
      cellH('Opens', '<input class="pp-sel" type="datetime-local" id="lvtOpens" value="' + esc(B.opens) + '">', 'Blank opens it now.') +
      cellH('Due', '<input class="pp-sel" type="datetime-local" id="lvtDue" value="' + esc(B.due) + '">') +
      cellH('Counts', chipsH('req', [['1', 'Required', B.required], ['0', 'Optional', !B.required]]), B.required ? 'Counts in the gradebook. Late and missing work is flagged.' : 'Never late and never in the average; you still see who did it.') +
      cellH('Late work', selH('lvtLate', lateOpts, B.late)) + '</div>';
    var who = '<div class="pp-grp"><h3 class="pp-gh">Who</h3>' +
      cellH('Students', chipsH('who', [['all', 'Whole class (' + D.members.length + ')', B.who === 'all'], ['some', 'Choose students', B.who === 'some']]) +
        (B.who === 'some' ? '<div class="tm-picks">' + D.members.map(function(m){ return '<label class="pp-ms-o tm-plain"><input type="checkbox" data-student="' + m.id + '"' + (B.students.indexOf(m.id) !== -1 ? ' checked' : '') + '> ' + esc(m.name) + '</label>'; }).join('') + '</div>' : '')) +
      alsoHtml() + '</div>';
    // The summary, as students will see it.
    var subj = drillKind(B.kind) ? (B.topics.length ? B.topics.map(function(x){ var tt = D.topics[x]; return tt && tt.ced ? tt.ced : tt ? tt.title : x; }).slice(0, 4).join(', ') + (B.topics.length > 4 ? ' and more' : '') : B.kind === 'review' ? 'every miss' : 'no topics yet') : B.kind === 'exam' ? (B.unit ? unitName(B.unit) : 'full exam') : '';
    var sumT = KIND[B.kind] + (B.kind === 'practice' ? ' &middot; ' + B.count + ' questions' : B.kind === 'mastery' ? ' &middot; to ' + pct(B.target) : B.kind === 'review' ? ' &middot; up to ' + B.count : '') + (B.timeLimit && B.kind !== 'frq' ? ' &middot; ' + B.timeLimit + ' min' : '');
    var sumB = [esc(subj)].filter(Boolean).concat(B.due ? ['due ' + esc(day(Date.parse(B.due)))] : []).concat([B.required ? 'required' : 'optional', B.who === 'some' ? plural(B.students.length, 'student') : 'whole class']).join(' &middot; ');
    var go = B.id ? 'Save changes' : 'Assign to ' + esc(c.name) + (B.also.length && B.who !== 'some' ? ' and ' + plural(B.also.length, 'more class', 'more classes') : '');
    var side = '<aside class="pp-side"><div class="pp-sum"><div class="pp-sumcard"><p class="pp-sum-k">Students will see</p><p class="pp-sum-t">' + sumT + '</p><p class="pp-sum-b">' + sumB + '</p>' +
      '<label class="tm-btitle"><span>Title</span><input class="pp-sel" id="lvtTitle" maxlength="120" value="' + esc(B.title) + '"></label>' +
      '<button class="pp-go" type="submit">' + go + '</button><p class="lv-msg tm-amsg" id="lvtAMsg" role="status"></p></div>' +
      '<p class="tm-side-n">From ' + esc((S.profile && S.profile.name) || 'you') + '. Shows at the top of their course home. Works on the free plan; free limits still apply unless they have Premium.</p>' +
      '<p class="tm-side-n"><a href="#' + (B.id ? 'a/' + B.id : 'work') + '">Cancel</a></p></div></aside>';
    var html = sband({ crumbs: classCrumbs([[B.id ? 'Edit' : 'Assign work']]), issue: classIssue(), title: B.id ? 'Edit assignment' : 'Assign work', lede: 'Pick what, then set it up. Everything is on one panel.' }) +
      '<div class="xshell lap tm-body pp-wrap"><form class="pp-v3 pp-v4" id="lvtAssign" novalidate><section class="pp-card" aria-label="Assign work"><div class="pp-rail"><div class="pp-tiles" role="group" aria-label="What should they do?">' + tiles + '</div></div>' +
      '<div class="pp-form"><div class="pp-set"><div class="pp-grp"><h3 class="pp-gh">What</h3>' + what + '</div>' + when + who + controlsHtml() + '</div></div>' + side + '</section></form></div><div style="height:60px"></div>';
    var ms = B.openMs ? document.querySelector('details[data-ms="' + B.openMs + '"] .pp-ms-list') : null, msTop = ms ? ms.scrollTop : 0;
    render(frame(html, c.course), 'work');
    var ms2 = B.openMs ? document.querySelector('details[data-ms="' + B.openMs + '"] .pp-ms-list') : null; if(ms2) ms2.scrollTop = msTop;
  }
  function readForm(){
    var g = function(id){ var el = document.getElementById(id); return el ? el.value : null; };
    if(g('lvtCount') != null) B.count = Math.max(1, Math.min(100, parseInt(g('lvtCount'), 10) || 20));
    if(g('lvtUnit') != null) B.unit = g('lvtUnit');
    if(g('lvtFrq') != null) B.frq = g('lvtFrq');
    if(g('lvtOpens') != null) B.opens = g('lvtOpens');
    if(g('lvtDue') != null) B.due = g('lvtDue');
    if(g('lvtLate') != null) B.late = parseInt(g('lvtLate'), 10) || 0;
    if(g('lvtTarget') != null) B.target = parseFloat(g('lvtTarget')) || 0.8;
    if(g('lvtMin') != null) B.min = Math.max(1, Math.min(200, parseInt(g('lvtMin'), 10) || 10));
    if(g('lvtTime') != null) B.timeLimit = parseInt(g('lvtTime'), 10) || 0;
    if(g('lvtRel') != null) B.release = g('lvtRel');
    var sh = document.getElementById('lvtShuf'); if(sh) B.shuffle = sh.checked;
    var ti = g('lvtTitle'); if(ti != null && ti !== B.title){ B.title = ti; B.titleTouched = true; }
  }
  function drillKind(k){ return k === 'practice' || k === 'review' || k === 'mastery'; }
  function saveAssign(){
    readForm();
    var msg = document.getElementById('lvtAMsg');
    var bad = function(t){ msg.textContent = t; msg.className = 'lv-msg is-bad'; };
    if((B.kind === 'practice' || B.kind === 'mastery') && !B.topics.length) return bad('Pick at least one topic.');
    if(B.kind === 'frq' && !B.frq) return bad('Pick a free-response question.');
    if(B.who === 'some' && !B.students.length) return bad('Pick at least one student.');
    if(!B.title.trim()) return bad('Give it a title.');
    var due = B.due ? new Date(B.due) : null, f = (S.frqs || []).filter(function(x){ return x.id === B.frq; })[0];
    var data = { kind: B.kind, title: B.title.trim(),
      spec: { topics: drillKind(B.kind) ? B.topics : [], topicNames: (drillKind(B.kind) ? B.topics : []).map(function(t){ return D.topics[t] ? D.topics[t].title : t; }),
              count: B.count, unit: B.kind === 'exam' ? B.unit || null : null, frq: B.kind === 'frq' ? B.frq : null, points: f ? f.points : null },
      opens_at: B.opens ? new Date(B.opens).toISOString() : (B.id ? null : new Date().toISOString()),
      due_at: due ? due.toISOString() : null, late_until: due && B.late ? new Date(due.getTime() + B.late * DAY).toISOString() : null,
      required: B.required, students: B.who === 'some' ? B.students : null };
    if(!data.opens_at) delete data.opens_at;
    // qn: questions per topic for full mastery, so the student's browser grades it the same without the curriculum.
    if(B.kind === 'mastery'){ data.spec.target = B.target; data.spec.min = B.min; data.spec.qn = {}; B.topics.forEach(function(t){ if(D.topics[t] && D.topics[t].qn) data.spec.qn[t] = D.topics[t].qn; }); }
    if(B.kind !== 'frq' && (B.timeLimit || B.shuffle || B.release !== 'now' || B.questions.length))
      data.spec.controls = { timeLimit: B.timeLimit || null, shuffle: B.shuffle, release: B.release, questions: B.questions.slice() };
    var also = B.who === 'some' || B.id ? [] : B.also.slice();
    msg.textContent = 'Saving…'; msg.className = 'lv-msg';
    call('teach_save_assignment', { p_class: CLASS_ID, p_id: B.id, p_data: data }).then(function(id){
      if(!id) return bad('That did not save. Try again.');
      var more = Object.assign({}, data, { students: null });
      return Promise.all(also.map(function(cid){ return call('teach_save_assignment', { p_class: cid, p_id: null, p_data: more }); })).then(function(rs){
        var failed = rs.filter(function(r){ return !r; }).length;
        B = null;
        loadClass().then(function(){ location.hash = '#a/' + id; if(failed) setTimeout(function(){ alert(plural(failed, 'other class', 'other classes') + ' did not get it. Open that class and assign it there.'); }, 50); });
      });
    });
  }

  /* ------------------------------------------------------------- students */
  /* Students: List, Gradebook and AP® skills are three views of one tab (owner 2026-11-08). */
  function studentsFrame(view, lede, inner){
    var vs = [['#students', 'List', 'list'], ['#students/gradebook', 'Gradebook', 'gradebook']];
    if(M.isAp(S.rep.class.course)) vs.push(['#students/skills', 'AP&reg; skills', 'skills']);
    var miss = D.members.filter(function(m){ return D.assign.some(function(a){ return a.st[m.id] && a.st[m.id].state === 'missing'; }); }).length;
    return sband({ crumbs: classCrumbs([['Students']]), issue: classIssue(), title: 'Students', lede: plural(D.members.length, 'student') + (miss ? ' &middot; ' + miss + ' with missing work' : '') }) +
      body('<div class="tm-toolbar">' + views(vs, view) + (D.members.length ? '<button class="lp-btn sm tm-mline" type="button" data-csv="all">Export CSV</button>' : '') + '</div>' + inner) + '<div style="height:60px"></div>';
  }
  function viewStudents(view){
    if(view === 'gradebook') return viewGrades();
    if(view === 'skills'){ if(M.isAp(S.rep.class.course)) return viewSkills(); location.replace('#students'); return; }
    var c = S.rep.class, cu = D.current;
    var rows = D.members.slice().sort(function(a, b){ return a.name.localeCompare(b.name); }).map(function(m){
      var req = D.assign.filter(function(a){ return a.required && a.st[m.id]; });
      var done = req.filter(function(a){ return a.st[m.id].state === 'done'; }).length, miss = req.filter(function(a){ return a.st[m.id].state === 'missing'; }).length;
      return '<a class="lvt-arow" href="#s/' + m.id + '"><div><b>' + esc(m.name) + '</b><small>' + ago(m.last) + (miss ? ' &middot; <span style="color:#B4412F;font-weight:800">' + miss + ' missing</span>' : '') + '</small></div>' +
        '<div class="hide"><div class="lv-bar"><i style="width:' + Math.round((cu ? m.um[cu] : m.overall) * 100) + '%"></i></div><small>' + (cu ? pct(m.um[cu]) + ' in ' + esc(unitName(cu)) + ' &middot; ' : '') + done + ' of ' + req.length + ' required done</small></div>' +
        '<div class="lvt-score">' + pct(m.overall) + '<small>mastery</small></div></a>';
    }).join('');
    render(frame(studentsFrame('list', '', rows ? '<div class="d5-card lvt-list">' + rows + '</div>' : '<div class="d5-card tm-empty"><p class="d5-lead">No students yet</p><p class="lv-btns" style="justify-content:center;margin-top:14px"><button class="lp-btn gold" data-copy="link" type="button">Copy join link</button></p></div>'), c.course), 'students');
  }
  function viewStudent(id){
    var m = D.byId[id]; if(!m){ location.hash = '#students'; return; }
    var c = S.rep.class, now = Date.now();
    var mine = D.assign.filter(function(a){ return a.st[m.id] && a.open; });
    var req = mine.filter(function(a){ return a.required; });
    var done = req.filter(function(a){ return a.st[m.id].state === 'done'; }).length, late = mine.filter(function(a){ return a.st[m.id].late; }).length, miss = req.filter(function(a){ return a.st[m.id].state === 'missing'; }).length;
    var band5 = M.isAp(c.course) ? scoreBand(m) : null;
    var first = esc(m.name.split(' ')[0]);
    var html = sband({ crumbs: classCrumbs([['Students', '#students'], [esc(m.name)]]), issue: classIssue(), title: esc(m.name),
      lede: 'In ' + esc(c.name) + ' since ' + day(m.joined) + ' &middot; ' + ago(m.last) + ' &middot; you see their ' + esc(course().name) + ' work only',
      ctas: '<a class="btn-chan" href="#assign/student/' + m.id + '">Assign to ' + first + '</a>' });
    html += '<div class="xshell lap tm-body"><div class="lvt-stats tm-5 tm-stats0"><div class="lvt-stat"><b>' + pct(m.overall) + '</b><span>overall mastery</span></div><div class="lvt-stat"><b>' + done + ' of ' + req.length + '</b><span>required done</span></div>' +
      '<div class="lvt-stat"><b>' + late + '</b><span>late &middot; ' + miss + ' missing</span></div><div class="lvt-stat"><b>' + m.week + '</b><span>questions this week</span></div>' +
      (M.isAp(c.course) ? '<a class="lvt-stat" href="#students/skills" style="text-decoration:none;color:inherit"><b>' + (band5 ? band5.label : '·') + '</b><span>AP® score band, an estimate</span></a>' : '<div class="lvt-stat"><b>' + plural(m.summary ? m.summary.lessons || 0 : 0, 'lesson') + '</b><span>finished</span></div>') + '</div>';
    var bars = unitRows(function(u, cls){ var v = m.um[u], av = D.unitAvg[u], col = v >= 0.6 ? 'var(--accent)' : v >= 0.4 ? 'var(--amber)' : '#D9694F';
      return '<div class="lvt-urow' + cls + '"><div><b>' + esc(unitName(u)) + '</b><small>' + esc(unitTitle(u)) + '</small></div><div class="bar" style="position:relative;overflow:visible"><i style="width:' + Math.round(v * 100) + '%;background:' + col + '"></i><em class="tm-mark" style="left:' + Math.round(av * 100) + '%"></em></div><div class="v">' + pct(v) + '<small style="display:block;font:700 11.5px var(--font-ui);color:var(--muted)">class ' + pct(av) + '</small></div></div>'; });
    var al = mine.slice(0, 8).map(function(a){ var s = a.st[m.id];
      var tag = s.state === 'done' ? '<span class="lv-tag ' + (s.late ? 'is-late">Late' : 'is-done">Done') + '</span>' : s.state === 'missing' ? '<span class="lv-tag is-late">Missing</span>' : s.state === 'progress' ? '<span class="lv-tag is-prog">In progress</span>' : '<span class="lv-tag">Not started</span>';
      return '<div class="lvc-row" style="grid-template-columns:minmax(0,1fr) auto auto"><div><p class="lvc-t">' + esc(a.title) + '</p><p class="lvc-m">' + (a.due_at ? 'due ' + day(Date.parse(a.due_at) + (m.extra_days || 0) * DAY) : KIND[a.kind]) + (s.state === 'progress' ? ' &middot; ' + s.answered + ' of ' + s.total : '') + '</p></div>' + tag + '<span class="lvt-score" style="font-size:17px;min-width:48px">' + (s.score == null ? '' : pct(s.score)) + '</span></div>'; }).join('');
    var weak = Object.keys(m.tm).filter(function(t){ return m.tm[t].answered >= 3 && D.topics[t]; }).sort(function(a, b){ return m.tm[b].wrong / m.tm[b].answered - m.tm[a].wrong / m.tm[a].answered; }).slice(0, 4)
      .filter(function(t){ return m.tm[t].wrong; })
      .map(function(t){ return '<div class="lvc-row"><div><p class="lvc-t">' + esc(topicName(t)) + '</p><p class="lvc-m">' + m.tm[t].wrong + ' of ' + m.tm[t].answered + ' wrong</p></div><a class="lp-btn sm ghost" style="grid-column:2" href="#assign/student/' + m.id + '" data-pretopic="' + esc(t) + '">Assign practice</a></div>'; }).join('');
    var flags = Object.keys((m.summary && m.summary.flags) || {}).map(function(k){ var t = (/^[a-z]+-(.+)-\d+$/.exec(k) || [])[1]; return { k: k, t: t, ts: m.summary.flags[k] }; }).filter(function(x){ return D.topics[x.t]; }).sort(function(a, b){ return b.ts - a.ts; }).slice(0, 5)
      .map(function(x){ var r = m.summary.items && m.summary.items[x.k]; return '<div class="lvc-row"><div><p class="lvc-t">' + esc(topicName(x.t)) + '</p><p class="lvc-m">flagged ' + day(x.ts) + (r ? ' &middot; ' + (r[4] ? 'now answered right' : 'still wrong') : '') + '</p></div><a class="lp-btn sm ghost" style="grid-column:2" href="#topic/' + esc(x.t) + '">Look at it</a></div>'; }).join('');
    var acc = '<div><p class="d5-lead">Accommodations</p><p class="d5-mut">Applied to every assignment, hidden from classmates.</p><div class="lv-grid2" style="margin-top:12px"><label class="lv-field"><span>Extra days on due dates</span><select class="lv-in" id="lvtXd">' +
      [0, 1, 2, 3, 5, 7].map(function(n){ return '<option value="' + n + '"' + (m.extra_days === n ? ' selected' : '') + '>' + (n ? plural(n, 'day') : 'None') + '</option>'; }).join('') + '</select></label>' +
      '<label class="lv-field"><span>Extra time on timed work</span><select class="lv-in" id="lvtXt">' + [[1, 'None'], [1.25, 'Time and a quarter'], [1.5, 'Time and a half'], [2, 'Double time'], [3, 'Triple time']].map(function(o){ return '<option value="' + o[0] + '"' + (+(m.extra_time || 1) === o[0] ? ' selected' : '') + '>' + o[1] + '</option>'; }).join('') + '</select></label></div>' +
      '<p class="lv-btns"><button class="lp-btn gold sm" type="button" data-savem="' + m.id + '">Save</button></p><p class="lv-msg" id="lvtXMsg" role="status"></p></div>';
    var leave = '<div><p class="d5-lead">Leaving the class?</p><p class="d5-mut">' + (isOwner() ? 'Removes ' + first + ' from ' + esc(c.name) + '. Their own LevlPrep progress stays theirs, and they can rejoin with the code.</p><p class="lv-btns" style="margin-top:12px"><button class="tm-link tm-danger" type="button" data-removem="' + m.id + '">Remove from class</button></p>' : 'Only the class’s owner can remove students.</p>') + '</div>';
    html += '<div class="tm-stack"><div class="lv-grid2"><div class="d5-card"><p class="d5-lead">Mastery by unit</p><p class="d5-mut">Their score, with the class average as a line.</p>' + bars + '</div>' +
      '<div class="d5-card"><p class="d5-lead">Their assignments</p>' + (al || '<p class="d5-empty">Nothing assigned to them yet.</p>') + '</div></div>' +
      '<div class="lv-grid2"><div class="d5-card"><p class="d5-lead">Weakest topics</p>' + (weak || '<p class="d5-empty">Not enough answers yet.</p>') + '</div>' +
      '<div class="d5-card"><p class="d5-lead">Questions they flagged</p><p class="d5-mut">Students flag questions they find confusing.</p>' + (flags || '<p class="d5-empty">No flags.</p>') + '</div></div>' +
      '<div class="d5-card tm-for">' + acc + '<div id="lvtIntF"></div>' + leave + '</div></div></div><div style="height:60px"></div>';
    render(frame(html, c.course), 'students');
    hook('student', 'lvtIntF', { student: { id: m.id, name: m.name } });
  }

  /* ------------------------------------------------------------- gradebook */
  var GB_SORT = 'name';
  function cell(a, m){
    var s = a.st[m.id]; if(!s) return '<td><span class="lvt-c e">&ndash;</span></td>';
    var late = s.late ? ' late' : '';
    if(s.state === 'missing') return '<td><span class="lvt-c r">Missing</span></td>';
    if(s.state === 'not') return '<td><span class="lvt-c e">' + (a.required && a.due_at && Date.parse(a.due_at) + (m.extra_days || 0) * DAY < Date.now() ? 'Not done' : '&middot;') + '</span></td>';
    var tabs = s.tabs >= 3 ? ' <span class="tm-tabs" title="Left the tab ' + s.tabs + ' times during timed work">' + s.tabs + '&times;</span>' : '';
    if(s.state === 'progress') return '<td><span class="lvt-c y' + late + '">' + (a.kind === 'mastery' ? pct(s.mastery) : s.answered + '/' + s.total) + '</span>' + tabs + '</td>';
    if(s.score == null) return '<td><span class="lvt-c g' + late + '">Done</span></td>';
    var k = s.score >= 0.8 ? 'g' : s.score >= 0.6 ? 'y' : 'r';
    return '<td><span class="lvt-c ' + k + late + '">' + (a.kind === 'frq' && a.spec.points ? Math.round(s.score * a.spec.points * 10) / 10 : pct(s.score)) + '</span>' + tabs + '</td>';
  }
  function avgFor(m){ var xs = D.assign.filter(function(a){ return a.required && a.st[m.id] && (a.st[m.id].state === 'done' || a.st[m.id].state === 'missing'); }).map(function(a){ var s = a.st[m.id]; return s.state === 'missing' ? 0 : s.score; }).filter(function(v){ return v != null; });
    return xs.length ? xs.reduce(function(x, y){ return x + y; }, 0) / xs.length : null; }
  function viewGrades(){
    var c = S.rep.class, as = D.assign.filter(function(a){ return a.open; }).slice().reverse().slice(-14);
    var ms = D.members.slice().sort(function(a, b){ return GB_SORT === 'avg' ? (avgFor(b) || 0) - (avgFor(a) || 0) : a.name.localeCompare(b.name); });
    var head = '<tr><th class="nm"><button class="tm-gb-sort" data-sort="name" type="button">Student</button></th><th><button class="tm-gb-sort" data-sort="avg" type="button">Average</button><small>required only</small></th>' + as.map(function(a){ return '<th><a href="#a/' + a.id + '" style="color:inherit;text-decoration:none">' + esc(a.title) + '</a><small>' + [a.required ? '' : 'optional', a.due_at ? day(Date.parse(a.due_at)) : ''].filter(Boolean).join(' &middot; ') + '</small></th>'; }).join('') + '</tr>';
    var body = ms.map(function(m){ return '<tr><td class="nm"><a href="#s/' + m.id + '">' + esc(m.name) + '</a></td><td><b class="lvt-score" style="font-size:15px">' + pct(avgFor(m)) + '</b></td>' + as.map(function(a){ return cell(a, m); }).join('') + '</tr>'; }).join('');
    var inner = as.length && ms.length ? '<p class="tm-note">Missing work counts as zero in the average; optional work never counts. Tap a name or an assignment to dig in.</p><div class="d5-card lvt-gb"><table><thead>' + head + '</thead><tbody>' + body + '</tbody></table></div>' +
        '<p class="d5-mut" style="margin-top:14px"><span class="lvt-c g">80%+</span> <span class="lvt-c y">60 to 79% or in progress</span> <span class="lvt-c r">under 60% or missing</span> <span class="lvt-c e late">late</span> <span class="tm-tabs">4&times;</span> left the tab during timed work</p>'
      : '<div class="d5-card tm-empty"><p class="d5-lead">Nothing to grade yet</p><p class="d5-mut">Scores appear once students join and you assign work.</p></div>';
    render(frame(studentsFrame('gradebook', '', inner), c.course), 'students');
  }
  function csv(rows){ return rows.map(function(r){ return r.map(function(v){ v = v == null ? '' : String(v); if(/^[=+\-@\t\r]/.test(v)) v = "'" + v; return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; }).join(','); }).join('\n'); }
  function download(name, text){ var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type: 'text/csv' })); a.download = name; document.body.appendChild(a); a.click(); setTimeout(function(){ URL.revokeObjectURL(a.href); a.remove(); }, 500); }
  function exportCsv(which){
    var as = which === 'all' ? D.assign.filter(function(a){ return a.open; }).slice().reverse() : D.assign.filter(function(a){ return a.id === which; });
    var rows = [['Student', 'Average (required)'].concat(as.map(function(a){ return a.title; }))];
    D.members.forEach(function(m){ rows.push([m.name, avgFor(m) == null ? '' : Math.round(avgFor(m) * 100)].concat(as.map(function(a){ var s = a.st[m.id]; if(!s) return ''; return s.state === 'done' ? (s.score == null ? 'done' : Math.round(s.score * 100)) + (s.late ? ' (late)' : '') : s.state === 'progress' ? s.answered + '/' + s.total : s.state; }))); });
    download((S.rep.class.name + ' ' + (which === 'all' ? 'gradebook' : as[0].title)).replace(/[^\w\- ]+/g, '').trim() + '.csv', csv(rows));
  }

  /* ------------------------------------------------------------- settings */
  var ORDER_DRAFT = null;
  /* Settings: a side menu, one section at a time (owner 2026-11-08). Family reports live on each student's page. */
  function viewSettings(sec){
    var c = S.rep.class;
    if(!ORDER_DRAFT) ORDER_DRAFT = { order: D.order.slice(), current: D.current };
    var o = ORDER_DRAFT, ci = o.current ? o.order.indexOf(o.current) : -1;
    var rows = o.order.map(function(u, i){
      var tag = i === ci ? '<span class="lv-tag is-req">Now</span>' : ci >= 0 && i < ci ? '<span class="lv-tag is-done">Taught</span>' : ci >= 0 && i === ci + 1 ? '<span class="lv-tag">Next</span>' : '<span class="lv-tag">Later</span>';
      return '<div class="lvt-ou' + (i === ci ? ' is-now' : '') + '"><span class="mv"><button type="button" data-up="' + i + '" aria-label="Move ' + esc(unitName(u)) + ' up"' + (i ? '' : ' disabled') + '>&#9650;</button><button type="button" data-down="' + i + '" aria-label="Move ' + esc(unitName(u)) + ' down"' + (i < o.order.length - 1 ? '' : ' disabled') + '>&#9660;</button></span>' +
        '<span><b>' + esc(unitName(u)) + ' &middot; ' + esc(unitTitle(u)) + '</b></span>' + tag + '<button class="lp-btn sm ghost" type="button" data-now="' + esc(u) + '">' + (i === ci ? 'Teaching now' : 'Set as now') + '</button></div>';
    }).join('');
    var S6 = [['order', 'Unit order'], ['join', 'Join code'], ['class', 'Class details'], ['people', 'Co-teachers and department']]
      .concat(isOwner() ? [['connect', 'Google Classroom and LMS']] : []).concat([['school', 'Class Premium and paperwork']]);
    if(!S6.some(function(x){ return x[0] === sec; })) sec = 'order';
    var pane = '';
    if(sec === 'order') pane = '<section class="d5-card"><p class="d5-mut" style="margin:0 0 14px">Put the units in the order you teach them and mark the one you’re on. Students can still study ahead on their own.</p><div class="lvt-order">' + rows + '</div>' +
      '<p class="lv-btns" style="margin-top:14px"><button class="lp-btn gold sm" type="button" data-saveorder="1">Save order</button><span class="lv-msg" id="lvtOMsg" role="status" style="margin:0"></span></p></section>';
    else if(sec === 'join') pane = '<section class="d5-card"><p class="d5-lead">Get students in</p><div class="d5-now" style="display:flex;align-items:center;gap:16px;flex-wrap:wrap;padding:20px 24px;margin-top:12px"><span class="lv-code" style="flex:1;color:#fff">' + esc(c.code) + '</span><button class="lp-btn gold sm" data-copy="link" type="button">Copy join link</button><button class="lp-btn sm tm-line" data-show="code" type="button">Show on screen</button></div>' +
      '<p class="lv-btns" style="margin-top:12px"><button class="lp-btn sm ghost" type="button" data-newcode="1">Make a new code</button><span class="d5-mut">The old code stops working; students already in stay.</span></p><p class="lv-msg" id="lvtCMsg" role="status"></p></section>';
    else if(sec === 'class') pane = '<section class="d5-card"><p class="d5-lead">The class</p><label class="lv-field" style="margin-top:12px"><span>Class name</span><input class="lv-in" id="lvtCName" maxlength="60" value="' + esc(c.name) + '"></label>' +
      '<p class="lv-btns"><button class="lp-btn sm" type="button" data-savename="1">Save</button>' + (isOwner() ? '<button class="lp-btn sm ghost" type="button" data-archive="1">' + (c.archived ? 'Unarchive' : 'Archive at year end') + '</button><button class="lp-btn sm ghost" type="button" data-delclass="1">Delete class</button>' : '') + '</p><p class="lv-msg" id="lvtCMsg" role="status"></p></section>' +
      '<section class="d5-card"><p class="d5-lead">Copy this class</p><p class="d5-mut" style="margin:0 0 14px">For another period or next year: the same course, unit order and assignments, with every date moved. No students, and a new join code.</p>' +
      '<div class="lv-grid2"><label class="lv-field"><span>Name of the copy</span><input class="lv-in" id="lvtCpName" maxlength="60" value="' + esc(c.name + ' (copy)') + '"></label>' +
      '<label class="lv-field"><span>Move every date by</span><select class="lv-in" id="lvtCpShift">' + [[0, 'Keep the same dates'], [1, '1 day'], [7, '1 week'], [14, '2 weeks'], [126, '18 weeks (next semester)'], [364, '52 weeks (next year, same weekday)']].map(function(o){ return '<option value="' + o[0] + '">' + o[1] + '</option>'; }).join('') + '<option value="custom">Another number of days</option></select></label></div>' +
      '<label class="lv-field" id="lvtCpDaysBox" hidden style="max-width:240px"><span>Days (negative moves earlier)</span><input class="lv-in" type="number" id="lvtCpDays" min="-400" max="400" value="0"></label>' +
      '<p class="lv-btns"><button class="lp-btn sm" type="button" data-copyclass="1">Copy the class</button><span class="lv-msg" id="lvtCpMsg" role="status" style="margin:0"></span></p></section>';
    else if(sec === 'people') pane = '<section class="d5-card"><p class="d5-lead">Your co-teachers</p>' + coteachHtml() + '</section>' +
      '<section class="d5-card"><p class="d5-lead">Your department</p><p class="d5-mut" style="margin:0 0 14px">Department heads see each shared class’s averages, never a student’s name or answers.</p>' +
      (isOwner() ? '<label class="lvt-check"><input type="checkbox" id="lvtDeptShare"' + (c.dept_shared ? ' checked' : '') + '> Share this class’s numbers with my department</label>' : '<p class="d5-mut">Only the owner can share this class.</p>') +
      '<p class="lv-btns"><a class="lp-btn sm ghost" href="' + deptHref() + '">Department view</a><span class="lv-msg" id="lvtDMsg" role="status" style="margin:0"></span></p></section>';
    else if(sec === 'connect') pane = '<div id="lvtIntS"></div>';
    else pane = '<div class="lp-card"><span class="lp-pill">Class Premium</span><h2 class="lp-h2">Everything, for <span>the whole class</span></h2><p class="lp-p">Classes work on the free plan, with its normal limits. Class Premium unlocks every lesson, question and exam for every student, at a discount for teachers.</p>' +
      '<p class="d5-mut" style="margin-top:12px">Coming soon. To get it now for your class, email <b>hello@levlprep.com</b> with your class size.</p></div><div id="lvtIntS"></div>';
    var html = sband({ crumbs: classCrumbs([['Settings']]), issue: classIssue(), title: 'Class settings', lede: 'Your unit order drives every student’s path.' }) +
      body('<div class="tm-set"><nav class="tm-side" aria-label="Settings sections">' + S6.map(function(x){ return '<a class="tm-sidebtn" href="#settings' + (x[0] === 'order' ? '' : '/' + x[0]) + '"' + (x[0] === sec ? ' aria-current="page"' : '') + '>' + x[1] + '</a>'; }).join('') + '</nav>' +
        '<div class="tm-panes">' + pane + '</div></div><p class="tm-note" style="margin-top:14px">Family progress reports are on each student’s page.</p>') + '<div style="height:60px"></div>';
    render(frame(html, c.course), 'settings');
    if(sec === 'connect' || sec === 'school') hook('settings', 'lvtIntS', { part: sec });
  }
  function coteachHtml(){
    var c = S.rep.class, list = S.rep.coteachers || [];
    var rows = list.map(function(t){ return '<div class="lvc-row"><div><p class="lvc-t">' + esc(t.name) + '</p><p class="lvc-m">co-teacher since ' + day(Date.parse(t.added_at)) + '</p></div>' + (isOwner() ? '<button class="lp-btn sm ghost" style="grid-column:2" type="button" data-uncoteach="' + esc(t.id) + '">Remove</button>' : '') + '</div>'; }).join('');
    if(!isOwner()) return '<p class="d5-mut" style="margin:-6px 0 12px">You co-teach this class with <b>' + esc(c.owner_name || 'its owner') + '</b>. You can assign, post and change settings; deleting is for the owner.</p>' + rows +
      '<p class="lv-btns"><button class="lp-btn sm ghost" type="button" data-leaveco="1">Stop co-teaching this class</button></p>';
    return '<p class="d5-mut" style="margin:-6px 0 12px">A co-teacher sees everything you see and can assign, post and change settings. They cannot delete the class, delete assignments or remove students.</p>' +
      (rows || '<p class="d5-empty">No co-teachers yet.</p>') +
      '<div class="d5-now" style="display:flex;align-items:center;gap:16px;flex-wrap:wrap;padding:16px 20px;margin-top:12px">' + (c.coteach_code ? '<span class="lv-code" style="flex:1;color:#fff;font-size:28px">' + esc(c.coteach_code) + '</span><button class="lp-btn gold sm" type="button" data-copytext="' + esc(c.coteach_code) + '">Copy</button>' : '<span style="flex:1;color:#C7D3E6">Make a code, then give it to the other teacher. They enter it on their Your classes page.</span>') +
      '<button class="lp-btn sm tm-line" type="button" data-cocode="1">' + (c.coteach_code ? 'New code' : 'Make a co-teacher code') + '</button></div>';
  }
  function patchClass(p, msgId, okText){
    return call('teach_update_class', { p_class: CLASS_ID, p_patch: p }).then(function(r){
      var m = document.getElementById(msgId);
      if(!r){ if(m){ m.textContent = 'That did not save. Try again.'; m.className = 'lv-msg is-bad'; } return; }
      return loadClass().then(function(){ ORDER_DRAFT = null; route(); var m2 = document.getElementById(msgId); if(m2 && okText){ m2.textContent = okText; m2.className = 'lv-msg'; } });
    });
  }

  /* ------------------------------------------------------------- AP® skills and the predicted score band */
  /* The predicted AP® score band is an ESTIMATE, labelled so everywhere it shows (method in docs/teacher-classes.md):
     the course's mastery on each unit, weighted by the unit's share of the AP® exam (the curriculum's exam weight
     range, midpoint), over the units the class has reached (all units when no current unit is set). That weighted
     mastery maps to a band of two scores; fewer than 30 answers in those units gives no band. */
  var BANDS = [[0.2, '1 to 2', 1.5], [0.4, '2 to 3', 2.5], [0.6, '3 to 4', 3.5], [0.8, '4 to 5', 4.5], [2, '5', 5]];
  function weightMid(u){ var w = D.unitsById[u] && D.unitsById[u].weight; return Array.isArray(w) && w.length ? (w[0] + (w[1] == null ? w[0] : w[1])) / 2 : 1; }
  function bandUnits(){ return D.curIdx >= 0 ? D.order.slice(0, D.curIdx + 1) : D.order; }
  function scoreBand(m){
    if(!m.summary) return null;
    var us = bandUnits(), tot = 0, v = 0;
    var n = M.rows(m.summary).filter(function(r){ return us.indexOf(r.u) !== -1; }).length;
    if(n < 30 || !us.length) return null;
    us.forEach(function(u){ var w = weightMid(u); tot += w; v += w * (m.um[u] || 0); });
    var x = tot ? v / tot : 0, b = BANDS.filter(function(b){ return x < b[0]; })[0];
    return { value: x, label: b[1], mid: b[2], n: n };
  }
  function skillOf(it){ return it && it.practice ? String(it.practice) : null; }
  function viewSkills(){
    var c = S.rep.class, cur = S.cur, prs = cur.practices || [];
    var bands = D.members.map(function(m){ return { m: m, b: scoreBand(m) }; });
    var counted = bands.filter(function(x){ return x.b; });
    var dist = BANDS.map(function(b){ return { label: b[1], n: counted.filter(function(x){ return x.b.label === b[1]; }).length }; });
    var classMid = counted.length ? counted.reduce(function(s, x){ return s + x.b.mid; }, 0) / counted.length : null;
    var reach = bandUnits(), maxN = Math.max.apply(null, dist.map(function(d){ return d.n; }).concat([1]));
    var inner = '<div class="lv-grid2"><div class="d5-card"><p class="d5-lead">Predicted AP® score bands <span class="lv-tag is-prog">Estimate</span></p>' +
      '<p class="d5-mut">On ' + (D.curIdx >= 0 ? 'the units taught so far (' + esc(reach.map(unitName).join(', ')) + ')' : 'every unit; set the unit you’re on in Settings to judge only what you’ve taught') + '. Not a College Board score.</p>' +
      dist.map(function(d){ return '<div class="lvt-urow"><div><b>' + d.label + '</b></div><div class="bar"><i style="width:' + Math.round(d.n / maxN * 100) + '%"></i></div><div class="v">' + d.n + '</div></div>'; }).join('') +
      '<p class="d5-mut" style="margin-top:10px">' + (counted.length ? plural(counted.length, 'student') + ' with enough answers' + (classMid ? ', class middle about ' + classMid.toFixed(1) : '') + '. ' : '') + (D.members.length - counted.length ? plural(D.members.length - counted.length, 'student') + ' need' + (D.members.length - counted.length === 1 ? 's' : '') + ' 30 or more answers first.' : '') + '</p>' +
      '<details class="tm-how"><summary>How the estimate works</summary><p>Each unit’s mastery (recent right answers per topic, as on the course pages) is weighted by that unit’s share of the AP® exam, then turned into a band: under 20% is 1 to 2, under 40% is 2 to 3, under 60% is 3 to 4, under 80% is 4 to 5, and 80% or more is 5. Mastery grows with practice, so early in the year bands run low. Treat it as a conversation starter, not a prediction you can promise.</p></details></div>' +
      '<div class="d5-card"><p class="d5-lead">By skill</p><p class="d5-mut">Share of answers right on questions tagged with each ' + (/Calculus|Statistics|Precalculus/.test(course().name) ? 'mathematical' : 'science') + ' practice the exam tests.</p><div id="lvtSkillBox"><p class="d5-mut">Loading the question tags…</p></div></div></div>' +
      '<div class="d5-card lvt-gb" id="lvtSkillGrid" style="margin-top:18px"><p class="d5-mut" style="padding:16px">Loading…</p></div>';
    render(frame(studentsFrame('skills', '', inner), c.course), 'students');
    var units = {};
    D.members.forEach(function(m){ M.rows(m.summary).forEach(function(r){ var t = D.topics[r.t]; units[t && t.bank ? t.bank : r.u] = 1; }); });
    Promise.all(Object.keys(units).filter(Boolean).map(bankFor)).then(function(banks){
      if(location.hash !== '#students/skills') return;
      var by = {}; banks.forEach(function(b){ Object.keys(b).forEach(function(k){ by[k] = b[k]; }); });
      var all = {}, per = {};
      D.members.forEach(function(m){
        var mine = per[m.id] = {};
        M.rows(m.summary).forEach(function(r){
          var sk = skillOf(by[r.id]); if(!sk) return;
          var major = sk.split('.')[0];
          [major, sk].forEach(function(k){ var o = all[k] || (all[k] = { n: 0, r: 0 }); o.n++; if(r.right) o.r++; });
          var p = mine[major] || (mine[major] = { n: 0, r: 0 }); p.n++; if(r.right) p.r++;
        });
      });
      var box = document.getElementById('lvtSkillBox'), grid = document.getElementById('lvtSkillGrid');
      var majors = prs.map(function(p){ return String(p.id); }).filter(function(k){ return all[k]; });
      if(!majors.length){ box.innerHTML = '<p class="d5-empty">This course’s questions are not tagged with skills yet, or nobody has answered tagged questions.</p>'; grid.innerHTML = '<p class="d5-empty" style="padding:16px">Nothing to show yet.</p>'; return; }
      var name = function(k){ var p = prs.filter(function(x){ return String(x.id) === k; })[0]; return p ? p.name : k; };
      box.innerHTML = majors.map(function(k){
        var o = all[k], v = o.r / o.n, col = v < 0.6 ? '#D9694F' : v < 0.8 ? 'var(--amber)' : 'var(--accent)';
        var subs = Object.keys(all).filter(function(x){ return x.indexOf(k + '.') === 0; }).sort();
        return '<details class="tm-skill"><summary><span><b>' + esc(k + '. ' + name(k)) + '</b><small>' + plural(o.n, 'answer') + '</small></span><span class="bar"><i style="width:' + Math.round(v * 100) + '%;background:' + col + '"></i></span><span class="v">' + pct(v) + '</span></summary>' +
          subs.map(function(x){ var s = all[x]; return '<p class="tm-sub"><span>' + esc(x) + '</span><span>' + pct(s.r / s.n) + ' of ' + s.n + '</span></p>'; }).join('') + '</details>';
      }).join('');
      var cell = function(o){ if(!o || o.n < 3) return '<td><span class="lvt-c e">&middot;</span></td>'; var v = o.r / o.n; return '<td><span class="lvt-c ' + (v >= 0.8 ? 'g' : v >= 0.6 ? 'y' : 'r') + '">' + pct(v) + '</span></td>'; };
      grid.innerHTML = '<table><thead><tr><th class="nm">Student</th><th>Score band<small>estimate</small></th>' + majors.map(function(k){ return '<th>' + esc(k + '. ' + name(k)) + '</th>'; }).join('') + '</tr></thead><tbody>' +
        bands.slice().sort(function(a, b){ return a.m.name.localeCompare(b.m.name); }).map(function(x){ return '<tr><td class="nm"><a href="#s/' + x.m.id + '">' + esc(x.m.name) + '</a></td><td><b>' + (x.b ? x.b.label : '<span class="d5-mut">not yet</span>') + '</b></td>' + majors.map(function(k){ return cell(per[x.m.id][k]); }).join('') + '</tr>'; }).join('') + '</tbody></table>';
    });
  }

  /* ------------------------------------------------------------- live mode */
  /* One question at a time on the projector; students answer on levlprep.com/live. The teacher's page polls
     teach_live_state every 2 s while this view is open (no Realtime); students poll class_live_state. */
  var L = { timer: null, queue: [], pos: 0, state: null, source: '' };
  function whyFor(unit){
    var k = course().dir + '/' + unit + '-why', url = M.whyUrl(S.rep.class.course, unit);
    if(S.banks[k]) return Promise.resolve(S.banks[k]);
    if(!url){ S.banks[k] = {}; return Promise.resolve(S.banks[k]); }
    return fetch(url).then(function(r){ return r.ok ? r.json() : {}; }, function(){ return {}; }).then(function(x){ S.banks[k] = x || {}; return S.banks[k]; });
  }
  function liveStop(){ if(L.timer){ clearInterval(L.timer); L.timer = null; } }
  function viewLive(){
    liveStop();
    call('teach_live_state', { p_class: CLASS_ID }).then(function(st){
      if(location.hash !== '#live') return;
      L.state = st && st.open ? st : null;
      if(L.state) drawLive(); else drawLiveStart();
    }, function(){ drawLiveStart('Live mode is not open yet on this site.'); });
  }
  function drawLiveStart(err){
    var c = S.rep.class, reach = (D.curIdx >= 0 ? D.order.slice(0, D.curIdx + 1) : D.order).concat(D.extra);
    var opts = reach.map(function(u){ return '<optgroup label="' + esc(unitLabel(u)) + '">' + S.cur.topics.filter(function(t){ return t.unit === u && t.built !== false; }).map(function(t){ return '<option value="t:' + esc(t.id) + '"' + (L.source === 't:' + t.id ? ' selected' : '') + '>' + esc(topicName(t.id)) + '</option>'; }).join('') + '</optgroup>'; }).join('');
    var wt = weakTopics();
    var html = sband({ crumbs: classCrumbs([['Live']]), issue: classIssue(), title: 'Live in class', lede: 'One question on the projector; students answer at levlprep.com/live; you reveal what the class picked.' });
    html += '<div class="xshell lap tm-body"><div class="lvt-assign"><div class="main"><form class="d5-card" id="lvtLiveGo"><p class="d5-lead">What to ask</p>' +
      '<label class="lv-field" style="margin-top:12px"><span>Questions from</span><select class="lv-in" id="lvtLiveSrc">' + (wt.length ? '<option value="weak">Your class’s weakest topics (' + esc(wt.map(function(t){ return D.topics[t].title; }).join(', ')) + ')</option>' : '') +
      '<option value="mine"' + (L.source === 'mine' ? ' selected' : '') + '>Your own questions</option>' + opts + '</select></label>' +
      '<label class="lv-field" style="max-width:220px"><span>How many</span><input class="lv-in" type="number" id="lvtLiveN" min="1" max="30" value="8"></label>' +
      '<p class="d5-mut">Single-choice questions only. Each one stays open until you reveal it.</p><p class="lv-btns"><button class="lp-btn gold" type="submit">Start live</button><span class="lv-msg' + (err ? ' is-bad' : '') + '" id="lvtLiveMsg" role="status" style="margin:0">' + esc(err || '') + '</span></p></form></div>' +
      '<aside class="side"><div class="d5-now lvt-prev"><p class="d5-starthere" style="text-align:left">what students do</p><ul class="d5-steps"><li>Open levlprep.com/live, signed in</li><li>The question shows on their phone as you start it</li><li>They tap an answer; they can change it until you reveal</li><li>After the reveal they see the right answer and why</li></ul></div></aside></div></div><div style="height:60px"></div>';
    render(frame(html, c.course), 'live');
  }
  function liveQueue(src, n){
    var pick = function(list){ var out = list.slice(), seed = Date.now() % 9973; for(var i = out.length - 1; i > 0; i--){ seed = (seed * 16807) % 2147483647; var j = seed % (i + 1); var x = out[i]; out[i] = out[j]; out[j] = x; } return out.slice(0, n); };
    if(src === 'mine') return myQuestions().then(function(qs){ return pick(qs.map(function(x){ return { id: x.id, q: x.q, options: x.options, correct: x.correct, why: x.why || '', topic: x.topic || '', mine: true }; })); });
    var topics = src === 'weak' ? weakTopics() : [src.slice(2)];
    var units = topics.map(function(t){ var x = D.topics[t]; return x ? (x.bank || x.unit) : null; }).filter(function(v, i, a){ return v && a.indexOf(v) === i; });
    return Promise.all(units.map(function(u){ return Promise.all([bankFor(u), whyFor(u)]); })).then(function(rs){
      var items = [];
      rs.forEach(function(r){ var by = r[0], why = r[1]; Object.keys(by).forEach(function(id){ var it = by[id];
        if(it.type === 'single' && it.options && !it.stimulus && topics.indexOf(it.topic) !== -1) items.push({ id: it.id, q: it.q, options: it.options, correct: it.correct, why: (why[id] && why[id].why && why[id].why.correct) || '', topic: it.topic }); }); });
      return pick(items);
    });
  }
  function liveShow(){
    var it = L.queue[L.pos]; if(!it) return liveEnd();
    return call('teach_live_show', { p_class: CLASS_ID, p_item: it }).then(function(idx){
      if(!idx){ var m = document.getElementById('lvtLiveMsg'); if(m){ m.textContent = 'That did not start. Try again.'; m.className = 'lv-msg is-bad'; } return; }
      L.state = { open: true, idx: idx, item: it, reveal: false, answers: [], members: D.members.length }; drawLive();
    });
  }
  function liveEnd(){ liveStop(); return call('teach_live_stop', { p_class: CLASS_ID }).then(function(){ L.state = null; L.queue = []; L.pos = 0; if(location.hash === '#live') drawLiveStart(); }); }
  function drawLive(){
    var c = S.rep.class;
    var html = '<div class="tm-live" id="lvtLive"><div class="tm-live-top"><span><b>' + esc(c.name) + '</b> &middot; live &middot; students go to <b>levlprep.com/live</b></span><span class="tm-live-b">' +
      '<button class="lp-btn sm tm-line" type="button" data-livefs="1">Full screen</button><button class="lp-btn sm tm-line" type="button" data-liveend="1">End live</button></span></div><div id="lvtLiveBox"></div></div>';
    render(frame(html, c.course), 'live');
    fillLive();
    liveStop();
    L.timer = setInterval(function(){
      if(location.hash !== '#live' || !document.getElementById('lvtLiveBox')){ liveStop(); return; }
      call('teach_live_state', { p_class: CLASS_ID }).then(function(st){ if(st && st.open && L.state && st.idx === L.state.idx){ L.state = st; fillLive(); } });
    }, 2000);
  }
  function fillLive(){
    var box = document.getElementById('lvtLiveBox'), st = L.state; if(!box || !st) return;
    var it = st.item || {}, ans = st.answers || [], total = st.members || D.members.length, counts = {};
    ans.forEach(function(a){ counts[a.pick] = (counts[a.pick] || 0) + 1; });
    var n = ans.length, txt = it.mine ? esc : rich;
    var opts = (it.options || []).map(function(op, i){
      var k = counts[i] || 0, p = n ? Math.round(k / n * 100) : 0, ok = st.reveal && i === it.correct;
      return '<div class="tm-live-o' + (ok ? ' ok' : '') + (st.reveal ? ' is-rev' : '') + '"><span class="l">' + String.fromCharCode(65 + i) + '</span><span class="t">' + txt(op) + '</span>' +
        (st.reveal ? '<span class="b"><i style="width:' + p + '%"></i></span><span class="v">' + p + '%</span>' : '') + '</div>';
    }).join('');
    var left = L.queue.length ? (L.pos + 1) + ' of ' + L.queue.length : 'Question ' + st.idx;
    box.innerHTML = '<p class="tm-live-k">' + left + (it.topic && D.topics[it.topic] ? ' &middot; ' + esc(D.topics[it.topic].title) : '') + '</p><h2 class="tm-live-q">' + txt(it.q) + '</h2><div class="tm-live-os">' + opts + '</div>' +
      (st.reveal && it.why ? '<p class="tm-live-why"><b>Why:</b> ' + txt(it.why) + '</p>' : '') +
      '<div class="tm-live-foot"><p class="tm-live-n"><b>' + n + '</b> of ' + total + ' answered</p><p class="tm-live-who">' + ans.map(function(a){ return '<span>' + esc(a.name) + '</span>'; }).join('') + '</p>' +
      '<p class="lv-btns">' + (st.reveal ? (L.queue.length && L.pos < L.queue.length - 1 ? '<button class="lp-btn gold" type="button" data-livenext="1">Next question</button>' : '<button class="lp-btn gold" type="button" data-liveend="1">Finish</button>') : '<button class="lp-btn gold" type="button" data-livereveal="1">Reveal the answer</button>') + '</p></div>';
  }

  /* ------------------------------------------------------------- the teacher's own questions */
  var QE = null;
  function viewBank(){
    var c = S.rep.class;
    myQuestions().then(function(qs){
      if(location.hash.indexOf('#bank') !== 0) return;
      var topicOpts = function(sel){ return '<option value="">No topic</option>' + D.order.concat(D.extra).map(function(u){ return '<optgroup label="' + esc(unitLabel(u)) + '">' + S.cur.topics.filter(function(t){ return t.unit === u && t.built !== false; }).map(function(t){ return '<option value="' + esc(t.id) + '"' + (sel === t.id ? ' selected' : '') + '>' + esc(topicName(t.id)) + '</option>'; }).join('') + '</optgroup>'; }).join(''); };
      var e = QE || { id: null, topic: '', q: '', options: ['', '', '', ''], correct: 0, why: '' };
      var list = qs.map(function(x){ return '<div class="lvt-qi"><div><p class="lv-kick">' + esc(x.topic && D.topics[x.topic] ? topicName(x.topic) : 'No topic') + '</p><p class="stem">' + esc(x.q) + '</p><ol class="tm-qo">' + x.options.map(function(o, i){ return '<li' + (i === x.correct ? ' class="ok"' : '') + '>' + esc(o) + '</li>'; }).join('') + '</ol></div>' +
        '<div class="lv-btns" style="align-self:start"><button class="lp-btn sm ghost" type="button" data-editq="' + esc(x.id) + '">Edit</button><button class="lp-btn sm ghost" type="button" data-delq="' + esc(x.id) + '">Delete</button></div></div>'; }).join('');
      var html = sband({ crumbs: classCrumbs([['Assignments', '#work'], ['Your questions']]), issue: classIssue(), title: 'Your questions',
        lede: plural(qs.length, 'question') + ' in your ' + esc(course().name) + ' bank &middot; add them to assignments, print them or ask them live &middot; only you and the classes you assign see them' });
      html += '<div class="xshell lap tm-body"><div class="lvt-assign"><div class="main">' + (list ? '<div class="d5-card lvt-list">' + list + '</div>' : '<div class="d5-card tm-empty"><p class="d5-lead">No questions yet</p><p class="d5-mut">Write the first one on the right.</p></div>') + '</div>' +
        '<aside class="side"><form class="d5-card" id="lvtQForm"><p class="d5-lead">' + (e.id ? 'Edit question' : 'New question') + '</p>' +
        '<label class="lv-field"><span>Topic</span><select class="lv-in" id="lvtQTopic">' + topicOpts(e.topic) + '</select></label>' +
        '<label class="lv-field"><span>Question</span><textarea class="lv-in tm-ta" id="lvtQText" rows="3" maxlength="2000" required>' + esc(e.q) + '</textarea></label>' +
        '<fieldset class="tm-fs"><legend>Answer choices: mark the right one</legend>' + e.options.map(function(o, i){ return '<label class="tm-opt"><input type="radio" name="lvtQOk" value="' + i + '"' + (i === e.correct ? ' checked' : '') + ' aria-label="Choice ' + String.fromCharCode(65 + i) + ' is right"><span>' + String.fromCharCode(65 + i) + '</span><input class="lv-in" data-qopt="' + i + '" maxlength="500" value="' + esc(o) + '"' + (i < 2 ? ' required' : '') + '></label>'; }).join('') +
        (e.options.length < 6 ? '<button class="tm-link" type="button" data-qaddopt="1">Add a choice</button>' : '') + '</fieldset>' +
        '<label class="lv-field"><span>Why the answer is right (shown after answering)</span><textarea class="lv-in tm-ta" id="lvtQWhy" rows="2" maxlength="2000">' + esc(e.why || '') + '</textarea></label>' +
        '<p class="lv-btns"><button class="lp-btn gold sm" type="submit">' + (e.id ? 'Save' : 'Add question') + '</button>' + (e.id ? '<button class="lp-btn sm ghost" type="button" data-qnew="1">Cancel</button>' : '') + '</p><p class="lv-msg" id="lvtQMsg" role="status"></p></form></aside></div><div style="height:60px"></div></div>';
      render(frame(html, c.course), 'work');
    });
  }
  function readQForm(){
    var e = QE || { id: null, options: ['', '', '', ''] };
    var opts = [].slice.call(document.querySelectorAll('[data-qopt]')).map(function(x){ return x.value; });
    var ok = document.querySelector('input[name="lvtQOk"]:checked');
    return { id: e.id, topic: document.getElementById('lvtQTopic').value, q: document.getElementById('lvtQText').value, options: opts, correct: ok ? +ok.value : 0, why: document.getElementById('lvtQWhy').value };
  }
  function saveQuestion(){
    var e = readQForm(), msg = document.getElementById('lvtQMsg');
    var keep = []; var correct = 0;
    e.options.forEach(function(o, i){ if(o.trim()){ if(i === e.correct) correct = keep.length; keep.push(o.trim()); } });
    if(!e.q.trim() || keep.length < 2){ msg.textContent = 'Write the question and at least two choices.'; msg.className = 'lv-msg is-bad'; return; }
    if(!e.options[e.correct] || !e.options[e.correct].trim()){ msg.textContent = 'Mark a choice that has text as the right one.'; msg.className = 'lv-msg is-bad'; return; }
    var t = D.topics[e.topic];
    call('teach_save_question', { p_id: e.id, p_data: { course: S.rep.class.course, topic: e.topic, unit: t ? t.unit : '', q: e.q.trim(), options: keep, correct: correct, why: e.why.trim() } }).then(function(id){
      if(!id){ msg.textContent = 'That did not save. Questions may not be open yet; try again later.'; msg.className = 'lv-msg is-bad'; return; }
      QE = null; myQuestions(true).then(viewBank);
    });
  }

  /* ------------------------------------------------------------- printable worksheet or test */
  var PR = { n: 0, key: true, version: 'A' };
  function seeded(list, seed){ var out = list.slice(), h = 7; for(var i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) % 2147483647; for(var j = out.length - 1; j > 0; j--){ h = (h * 16807) % 2147483647; var k = h % (j + 1); var x = out[j]; out[j] = out[k]; out[k] = x; } return out; }
  function viewPrint(id){
    var a = D.assign.filter(function(x){ return x.id === id; })[0];
    if(!a || a.kind === 'frq'){ location.hash = '#work'; return; }
    var c = S.rep.class, topics = (a.spec && a.spec.topics) || [];
    if(a.kind === 'exam') topics = S.cur.topics.filter(function(t){ return (a.spec.unit ? t.unit === a.spec.unit : bandUnits().indexOf(t.unit) !== -1) && t.built !== false; }).map(function(t){ return t.id; });
    if(!PR.n || PR.id !== id){ PR = { id: id, n: Math.min(40, a.kind === 'practice' ? a.spec.count || 20 : 20), key: true, version: 'A' }; }
    var units = topics.map(function(t){ var x = D.topics[t]; return x ? (x.bank || x.unit) : null; }).filter(function(v, i, arr){ return v && arr.indexOf(v) === i; });
    var html = sband({ crumbs: classCrumbs([['Assignments', '#work'], [esc(a.title), '#a/' + a.id], ['Print']]), issue: classIssue(), title: 'Print worksheet', lede: esc(a.title) }) +
      '<div class="xshell lap tm-body"><div class="d5-card tm-noprint"><div class="lv-grid3"><label class="lv-field"><span>Questions</span><input class="lv-in" type="number" id="lvtPrN" min="1" max="60" value="' + PR.n + '"></label>' +
      '<label class="lv-field"><span>Version</span><select class="lv-in" id="lvtPrV"><option' + (PR.version === 'A' ? ' selected' : '') + '>A</option><option' + (PR.version === 'B' ? ' selected' : '') + '>B</option></select></label>' +
      '<label class="lvt-check" style="align-self:end"><input type="checkbox" id="lvtPrK"' + (PR.key ? ' checked' : '') + '> Answer key on its own page</label></div>' +
      '<p class="d5-mut">Single-choice questions from the assignment’s topics' + (ctl(a).questions && ctl(a).questions.length ? ', your own questions first' : '') + '. Version B puts the questions in a different order.</p>' +
      '<p class="lv-btns"><button class="lp-btn gold" type="button" data-print="1">Print</button><a class="lp-btn ghost" href="#a/' + a.id + '">Back to the assignment</a></p></div>' +
      '<div id="lvtSheet" class="tm-sheet"><p class="d5-mut">Loading the questions…</p></div><div style="height:60px"></div></div>';
    render(frame(html, c.course), 'work');
    var mineIds = ctl(a).questions || [];
    // Questions any teacher of the class wrote for it (teach_class_questions), plus the teacher's own bank.
    var classQs = call('teach_class_questions', { p_class: CLASS_ID }).then(function(r){ return Array.isArray(r) ? r : []; }, function(){ return []; });
    Promise.all([Promise.all([myQuestions(), classQs]).then(function(x){ var seen = {}; return x[0].concat(x[1]).filter(function(q){ if(seen[q.id]) return false; seen[q.id] = 1; return true; }); }),
                 Promise.all(units.map(function(u){ return Promise.all([bankFor(u), whyFor(u), fetchStimuli(u)]); }))]).then(function(rs){
      if(location.hash !== '#print/' + id) return;
      var mine = rs[0].filter(function(x){ return mineIds.indexOf(x.id) !== -1; }).map(function(x){ return { id: x.id, q: x.q, options: x.options, correct: x.correct, why: x.why, mine: true }; });
      var pool = [], stim = {};
      rs[1].forEach(function(r){ var by = r[0], why = r[1]; Object.keys(r[2]).forEach(function(k){ stim[k] = r[2][k]; });
        // Graph stimuli are drawn with the course page's styles, so worksheets keep to text and table stimuli.
        Object.keys(by).forEach(function(k){ var it = by[k], sh = it.stimulus && r[2][it.stimulus] ? String(r[2][it.stimulus].html || '') : '';
          if(it.type === 'single' && it.options && topics.indexOf(it.topic) !== -1 && !/<svg|<canvas|<details/i.test(sh)) pool.push({ id: it.id, q: it.q, options: it.options, correct: it.correct, fixed: !!it.fixed, stimulus: it.stimulus, why: (why[k] && why[k].why && why[k].why.correct) || '' }); }); });
      var list = mine.concat(seeded(pool, a.id + PR.version)).slice(0, PR.n);
      if(PR.version === 'B') list = seeded(list, a.id + 'B2');
      /* The answer choices in a dealt order per question and version, with the key following them: the bank keeps
         its authoring order (often the key first), which the course pages shuffle on screen but a printed test
         did not (question audit 2026-11-06). Items marked fixed (a scale, an ordered list) keep their order. */
      list = list.map(function(it){
        if(it.mine || it.fixed || !Array.isArray(it.options) || typeof it.correct !== 'number') return it;   // a teacher's own question keeps the order they wrote (it may end in "all of these")
        var ord = seeded(it.options.map(function(o, i){ return i; }), a.id + PR.version + it.id);
        return Object.assign({}, it, { options: ord.map(function(i){ return it.options[i]; }), correct: ord.indexOf(it.correct) });
      });
      var shown = {}, n = 0;
      var qs = list.map(function(it){
        var txt = it.mine ? esc : rich, st = it.stimulus && stim[it.stimulus] && !shown[it.stimulus] ? stim[it.stimulus] : null;
        if(st) shown[it.stimulus] = 1;
        n++;
        return (st ? '<div class="tm-ps"><p class="tm-ps-t">' + esc(st.title || 'Use this for the questions that follow') + '</p>' + (st.html || '') + '</div>' : '') +
          '<li class="tm-pq"><p>' + txt(it.q) + '</p><ol type="A">' + it.options.map(function(o){ return '<li>' + txt(o) + '</li>'; }).join('') + '</ol></li>';
      }).join('');
      var key = list.map(function(it, i){ return '<li><b>' + String.fromCharCode(65 + it.correct) + '</b>' + (it.why ? ' &middot; ' + (it.mine ? esc : rich)(it.why) : '') + '</li>'; }).join('');
      document.getElementById('lvtSheet').innerHTML = list.length ? '<div class="tm-page"><div class="tm-ph"><div><p class="tm-ph-c">' + esc(course().name) + ' &middot; ' + esc(c.name) + ' &middot; Version ' + PR.version + '</p><h2>' + esc(a.title) + '</h2></div><p class="tm-ph-n">Name ____________________<br>Date ____________</p></div><ol class="tm-pqs">' + qs + '</ol></div>' +
        (PR.key ? '<div class="tm-page tm-key"><div class="tm-ph"><div><p class="tm-ph-c">Answer key &middot; Version ' + PR.version + '</p><h2>' + esc(a.title) + '</h2></div></div><ol class="tm-keys">' + key + '</ol></div>' : '')
        : '<div class="d5-card tm-empty"><p class="d5-lead">No printable questions</p><p class="d5-mut">These topics have no single-choice questions yet.</p></div>';
    });
  }
  function fetchStimuli(unit){ return bankFor(unit).then(function(){ return S.stims[course().dir + '/' + unit] || {}; }); }

  /* ------------------------------------------------------------- department */
  function deptHref(){ return DEMO ? '/teach/?demo=1&dept=1' : '/teach/?dept=1'; }
  function viewDept(){
    call('teach_dept_view').then(function(d){
      var html = sband({ crumbs: [DEMO ? ['Sample class', '/teach/?demo=1'] : YOURS, ['Department']], issue: 'LevlPrep &middot; For teachers', title: 'Your department', lede: d ? esc(d.name) : 'See how every shared class is doing.' });
      if(!d){
        html += '<div class="xshell lap tm-body"><div class="lv-grid2"><form class="d5-card" id="lvtDeptNew"><p class="d5-lead">Start a department</p><p class="d5-mut">For a department head or a team of teachers. You get a code to give the others.</p>' +
          '<label class="lv-field" style="margin-top:12px"><span>Department name</span><input class="lv-in" id="lvtDeptName" maxlength="80" placeholder="Lincoln High Science" required></label><button class="lp-btn gold sm" type="submit">Make the department</button></form>' +
          '<form class="d5-card" id="lvtDeptJoin"><p class="d5-lead">Join one</p><p class="d5-mut">Enter the code your department head gave you. You can be in one department at a time.</p>' +
          '<label class="lv-field" style="margin-top:12px"><span>Department code</span><input class="lv-in" id="lvtDeptCode" maxlength="8" autocapitalize="characters" spellcheck="false" required></label><button class="lp-btn gold sm" type="submit">Join</button><p class="lv-msg" id="lvtDeptMsg" role="status"></p></form></div><div style="height:60px"></div></div>';
        render(frame(html)); return;
      }
      var rows = (d.classes || []).map(function(k){
        var s = k.stats || {}, C = M.COURSES[k.course] || {};
        var units = (s.order || []).map(function(u){ var v = (s.units || {})[u] || 0; return '<span class="tm-du' + (u === s.current ? ' is-now' : '') + '" title="' + esc(u) + ': ' + pct(v) + '"><i style="height:' + Math.max(4, Math.round(v * 100)) + '%"></i></span>'; }).join('');
        return '<tr><td class="nm"><b>' + esc(k.name) + '</b><small style="display:block;color:var(--muted);font-weight:700">' + esc(k.teacher || '') + (k.mine ? ' (you)' : '') + '</small></td><td>' + esc(C.name || k.course) + '</td><td>' + k.members + '</td>' +
          '<td>' + (s.n ? pct(s.active7 / s.n) : '·') + '</td><td>' + pct(s.overall) + '</td><td>' + (s.onTime == null ? '·' : pct(s.onTime)) + '</td><td><span class="tm-dus">' + (units || '<span class="d5-mut">no numbers yet</span>') + '</span></td></tr>';
      }).join('');
      html += '<div class="xshell lap tm-body"><div class="lvt-stats tm-stats0"><div class="lvt-stat"><b>' + (d.classes || []).length + '</b><span>shared classes</span></div><div class="lvt-stat"><b>' + (d.teachers || []).length + '</b><span>teachers</span></div>' +
        '<div class="lvt-stat"><b style="font-family:var(--font-mono);letter-spacing:.08em">' + esc(d.code) + '</b><span>code for other teachers</span></div><div class="lvt-stat"><b>' + (d.classes || []).reduce(function(x, k){ return x + k.members; }, 0) + '</b><span>students</span></div></div>' +
        '<section class="d5-sec">' + q('1', 'Shared', 'classes') + (rows ? '<div class="d5-card lvt-gb"><table><thead><tr><th class="nm">Class</th><th>Course</th><th>Students</th><th>Active this week</th><th>Mastery</th><th>Required work on time</th><th>Mastery by unit<small>in each teacher’s order, current unit marked</small></th></tr></thead><tbody>' + rows + '</tbody></table></div>'
          : '<div class="d5-card tm-empty"><p class="d5-lead">No shared classes yet</p><p class="d5-mut">Each teacher turns on sharing in a class’s Settings.</p></div>') +
        '<p class="d5-mut" style="margin-top:12px">Numbers only, written by each class’s own page when its teacher opens it. No student names, answers or scores leave the class.</p></section>' +
        '<section class="d5-sec">' + q('2', 'Its', 'teachers') + '<div class="d5-card"><p>' + esc((d.teachers || []).join(', ')) + '</p><p class="lv-btns"><button class="lp-btn sm" type="button" data-copytext="' + esc(d.code) + '">Copy the code</button><button class="lp-btn sm ghost" type="button" data-deptleave="1">Leave the department</button></p></div></section></div><div style="height:60px"></div>';
      render(frame(html));
    }, function(){ fail('departments aren’t open yet'); });
  }

  /* ------------------------------------------------------------- shared actions */
  function copy(text, btn){
    var done = function(){ if(btn){ var t = btn.textContent; btn.textContent = 'Copied'; setTimeout(function(){ btn.textContent = t; }, 1600); } };
    if(navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, function(){ prompt('Copy this:', text); });
    else prompt('Copy this:', text);
  }
  function showCode(){
    var o = document.createElement('div'); o.className = 'tm-overlay'; o.setAttribute('role', 'dialog'); o.setAttribute('aria-label', 'Join code');
    o.innerHTML = '<div><p>Go to levlprep.com/join and enter</p><p class="v">' + esc(S.rep.class.code) + '</p><p>' + esc(course().name) + ' &middot; ' + esc(S.rep.class.name) + '</p><p style="margin-top:30px"><button class="lp-btn gold" type="button">Close</button></p></div>';
    o.addEventListener('click', function(){ o.remove(); });
    document.addEventListener('keydown', function esc1(e){ if(e.key === 'Escape'){ o.remove(); document.removeEventListener('keydown', esc1); } });
    document.body.appendChild(o); o.querySelector('button').focus();
  }
  // An open drop-down (the builder's topics, the assignment's Remind, Send grades and More) closes on a click outside it.
  document.addEventListener('click', function(e){
    [].forEach.call(document.querySelectorAll('details.pp-ms[open], details.tm-menu[open]'), function(d){
      if(d.contains(e.target)) return;
      d.open = false; if(B && d.getAttribute('data-ms') === B.openMs) B.openMs = null;
    });
  }, true);
  document.addEventListener('toggle', function(e){ var d = e.target; if(B && d.getAttribute && d.getAttribute('data-ms') && !d.open && d.getAttribute('data-ms') === B.openMs) B.openMs = null; }, true);
  document.addEventListener('click', function(e){
    var t = e.target.closest ? e.target.closest('button,a') : null; if(!t) return;
    var g = function(a){ return t.getAttribute(a); };
    if(g('data-copy') === 'link'){ e.preventDefault(); copy(joinLink(), t); }
    else if(g('data-copytext') != null){ e.preventDefault(); copy(g('data-copytext'), t); }
    else if(g('data-show')){ e.preventDefault(); showCode(); }
    else if(g('data-csv')){ e.preventDefault(); exportCsv(g('data-csv')); }
    else if(g('data-del')){ e.preventDefault(); if(confirm('Delete this assignment? Students stop seeing it. Their own progress is not touched.')) call('teach_delete_assignment', { p_id: g('data-del') }).then(function(){ loadClass().then(function(){ location.hash = '#work'; }); }); }
    else if(g('data-kind')){ e.preventDefault(); readForm(); B.kind = g('data-kind'); if(!B.titleTouched) B.title = ''; drawAssign(); }
    else if(g('data-req')){ e.preventDefault(); readForm(); B.required = g('data-req') === '1'; drawAssign(); }
    else if(g('data-who')){ e.preventDefault(); readForm(); B.who = g('data-who'); drawAssign(); }
    else if(g('data-target')){ e.preventDefault(); readForm(); B.target = parseFloat(g('data-target')) || 0.8; drawAssign(); }
    else if(g('data-weak')){ e.preventDefault(); readForm(); B.topics = weakTopics(); drawAssign(); }
    else if(g('data-untopic')){ e.preventDefault(); readForm(); B.topics = B.topics.filter(function(x){ return x !== g('data-untopic'); }); drawAssign(); }
    else if(g('data-pretopic')){ B = null; var st = g('href').slice(1).split('/').pop(); B = newDraft('student/' + st); B.arg = 'student/' + st; B.topics = [g('data-pretopic')]; }
    else if(g('data-savem')){ call('teach_set_member', { p_class: CLASS_ID, p_student: g('data-savem'), p_patch: { extra_days: parseInt(document.getElementById('lvtXd').value, 10) || 0, extra_time: parseFloat(document.getElementById('lvtXt').value) || 1 } }).then(function(ok){ var m = document.getElementById('lvtXMsg'); m.textContent = ok ? 'Saved.' : 'That did not save.'; m.className = 'lv-msg' + (ok ? '' : ' is-bad'); if(ok) loadClass(); }); }
    else if(g('data-removem')){ if(confirm('Remove this student from the class? You stop seeing their work. They can rejoin with the code.')) call('teach_set_member', { p_class: CLASS_ID, p_student: g('data-removem'), p_patch: { remove: true } }).then(function(){ loadClass().then(function(){ location.hash = '#students'; }); }); }
    else if(g('data-up') != null || g('data-down') != null){ var i = +(g('data-up') != null ? g('data-up') : g('data-down')), j = g('data-up') != null ? i - 1 : i + 1, o = ORDER_DRAFT.order; var x = o[i]; o[i] = o[j]; o[j] = x; viewSettings('order'); var f = document.querySelector('[data-' + (g('data-up') != null ? 'up' : 'down') + '="' + j + '"]'); if(f) f.focus(); }
    else if(g('data-now')){ ORDER_DRAFT.current = g('data-now'); viewSettings('order'); }
    else if(g('data-saveorder')){ patchClass({ unit_order: ORDER_DRAFT.order, current_unit: ORDER_DRAFT.current }, 'lvtOMsg', 'Saved. Students’ paths now follow this order.'); }
    else if(g('data-newcode')){ if(confirm('Make a new code? The old one stops working.')) patchClass({ new_code: true }, 'lvtCMsg', 'New code made.'); }
    else if(g('data-savename')){ patchClass({ name: document.getElementById('lvtCName').value }, 'lvtCMsg', 'Saved.'); }
    else if(g('data-archive')){ patchClass({ archived: !S.rep.class.archived }, 'lvtCMsg', 'Saved.'); }
    else if(g('data-delclass')){ if(confirm('Delete this class for good? Its assignments go too. Students keep their own progress.')) call('teach_delete_class', { p_class: CLASS_ID }).then(function(){ location.href = '/teach/'; }); }
    else if(g('data-sort')){ GB_SORT = g('data-sort'); viewGrades(); }
    else if(g('data-delann')){ if(confirm('Delete this announcement? Students stop seeing it.')) call('teach_delete_announcement', { p_id: g('data-delann') }).then(function(){ loadClass().then(route); }); }
    else if(g('data-cocode')){ if(!S.rep.class.coteach_code || confirm('Make a new co-teacher code? The old one stops working; co-teachers already in stay.')) call('teach_coteach_code', { p_class: CLASS_ID }).then(function(code){ if(!code){ alert('That did not work. Co-teachers may not be open yet.'); return; } loadClass().then(route); }); }
    else if(g('data-uncoteach')){ if(confirm('Remove this co-teacher? They stop seeing the class.')) call('teach_coteach_remove', { p_class: CLASS_ID, p_user: g('data-uncoteach') }).then(function(){ loadClass().then(route); }); }
    else if(g('data-leaveco')){ if(confirm('Stop co-teaching this class? You stop seeing it; the owner can give you a new code.')) call('teach_coteach_remove', { p_class: CLASS_ID, p_user: S.user && S.user.id }).then(function(){ location.href = '/teach/'; }); }
    else if(g('data-copyclass')){ copyClass(); }
    else if(g('data-livereveal')){ call('teach_live_reveal', { p_class: CLASS_ID, p_reveal: true }).then(function(){ if(L.state){ L.state.reveal = true; fillLive(); } }); }
    else if(g('data-livenext')){ L.pos++; liveShow(); }
    else if(g('data-liveend')){ liveEnd(); }
    else if(g('data-livefs')){ var lv = document.getElementById('lvtLive'); if(document.fullscreenElement) document.exitFullscreen(); else if(lv && lv.requestFullscreen) lv.requestFullscreen(); }
    else if(g('data-editq')){ var eq = (S.qs || []).filter(function(x){ return x.id === g('data-editq'); })[0]; if(eq){ QE = { id: eq.id, topic: eq.topic || '', q: eq.q, options: eq.options.slice(), correct: eq.correct, why: eq.why || '' }; viewBank(); } }
    else if(g('data-delq')){ if(confirm('Delete this question? Assignments that use it stop showing it.')) call('teach_delete_question', { p_id: g('data-delq') }).then(function(){ myQuestions(true).then(viewBank); }); }
    else if(g('data-qnew')){ QE = null; viewBank(); }
    else if(g('data-qaddopt')){ QE = readQForm(); if(QE.options.length < 6) QE.options.push(''); viewBank(); }
    else if(g('data-print')){ window.print(); }
    else if(g('data-deptleave')){ if(confirm('Leave the department? Your classes stop being shared with it.')) call('teach_dept_leave').then(viewDept); }
  });
  function copyClass(){
    var msg = document.getElementById('lvtCpMsg'), sel = document.getElementById('lvtCpShift').value;
    var days = sel === 'custom' ? parseInt(document.getElementById('lvtCpDays').value, 10) || 0 : parseInt(sel, 10) || 0;
    msg.textContent = 'Copying…'; msg.className = 'lv-msg';
    call('teach_copy_class', { p_class: CLASS_ID, p_name: document.getElementById('lvtCpName').value, p_shift_days: days }).then(function(r){
      if(!r){ msg.textContent = 'That did not copy. Check the name, or archive an old class first (30 at most).'; msg.className = 'lv-msg is-bad'; return; }
      if(DEMO){ msg.textContent = 'Copied (in the sample, nothing is saved). The copy gets code ' + r.code + '.'; return; }
      location.href = '?c=' + encodeURIComponent(r.id) + '#settings';
    });
  }
  // Panels outside the builder: sharing with the department, the copy's custom shift, print options.
  document.addEventListener('change', function(e){
    var t = e.target;
    if(t.id === 'lvtDeptShare') patchClass({ dept_shared: t.checked, dept_stats: t.checked ? deptStats() : undefined }, 'lvtDMsg', t.checked ? 'Shared with your department.' : 'Not shared.');
    else if(t.id === 'lvtCpShift'){ var bx = document.getElementById('lvtCpDaysBox'); if(bx) bx.hidden = t.value !== 'custom'; }
    else if(t.id === 'lvtPrN' || t.id === 'lvtPrV' || t.id === 'lvtPrK'){ PR.n = Math.max(1, Math.min(60, parseInt(document.getElementById('lvtPrN').value, 10) || 20)); PR.version = document.getElementById('lvtPrV').value; PR.key = document.getElementById('lvtPrK').checked; viewPrint(PR.id); }
  });
  document.addEventListener('change', function(e){
    var t = e.target; if(!B || !document.getElementById('lvtAssign') || !document.getElementById('lvtAssign').contains(t)) return;
    var openMs = t.closest && t.closest('details[data-ms]'); B.openMs = openMs ? openMs.getAttribute('data-ms') : null;
    if(t.hasAttribute('data-topic')){ readForm(); var id = t.getAttribute('data-topic'); B.topics = t.checked ? B.topics.concat([id]) : B.topics.filter(function(x){ return x !== id; }); drawAssign(); }
    else if(t.hasAttribute('data-unitall')){ readForm(); var u = t.getAttribute('data-unitall'), ids = S.cur.topics.filter(function(x){ return x.unit === u && x.built !== false; }).map(function(x){ return x.id; });
      B.topics = B.topics.filter(function(x){ return ids.indexOf(x) === -1; }).concat(t.checked ? ids : []); drawAssign(); }
    else if(t.hasAttribute('data-student')){ readForm(); var s = t.getAttribute('data-student'); B.students = t.checked ? B.students.concat([s]) : B.students.filter(function(x){ return x !== s; }); drawAssign(); }
    else if(t.hasAttribute('data-myq')){ readForm(); var mq = t.getAttribute('data-myq'); B.questions = t.checked ? B.questions.concat([mq]) : B.questions.filter(function(x){ return x !== mq; }); drawAssign(); }
    else if(t.hasAttribute('data-also')){ readForm(); var ac = t.getAttribute('data-also'); B.also = t.checked ? B.also.concat([ac]) : B.also.filter(function(x){ return x !== ac; }); drawAssign(); }
    else if(t.id === 'lvtUnit' || t.id === 'lvtFrq' || t.id === 'lvtCount' || t.id === 'lvtDue' || t.id === 'lvtTime' || t.id === 'lvtMin' || t.id === 'lvtLate'){ readForm(); drawAssign(); }
  });
  document.addEventListener('submit', function(e){
    var id = e.target.id;
    if(id === 'lvtAssign'){ e.preventDefault(); saveAssign(); }
    else if(id === 'lvtAnn'){ e.preventDefault(); postAnnouncement(); }
    else if(id === 'lvtQForm'){ e.preventDefault(); saveQuestion(); }
    else if(id === 'lvtLiveGo'){
      e.preventDefault();
      var src = document.getElementById('lvtLiveSrc').value, n = Math.max(1, Math.min(30, parseInt(document.getElementById('lvtLiveN').value, 10) || 8)), m = document.getElementById('lvtLiveMsg');
      L.source = src; m.textContent = 'Getting the questions…'; m.className = 'lv-msg';
      liveQueue(src, n).then(function(list){
        if(!list.length){ m.textContent = src === 'mine' ? 'You have no questions yet. Write some under Your questions.' : 'No single-choice questions on that topic. Pick another.'; m.className = 'lv-msg is-bad'; return; }
        L.queue = list; L.pos = 0; liveShow();
      });
    }
    else if(id === 'lvtDeptNew'){ e.preventDefault(); call('teach_dept_create', { p_name: document.getElementById('lvtDeptName').value }).then(function(code){ if(code) viewDept(); else alert('That did not work. Departments may not be open yet.'); }); }
    else if(id === 'lvtDeptJoin'){ e.preventDefault(); call('teach_dept_join', { p_code: document.getElementById('lvtDeptCode').value }).then(function(ok){ if(ok) viewDept(); else { var dm = document.getElementById('lvtDeptMsg'); dm.textContent = 'No department has that code.'; dm.className = 'lv-msg is-bad'; } }); }
    else if(id === 'lvtCoJoin'){ e.preventDefault(); call('teach_coteach_join', { p_code: document.getElementById('lvtCoCode').value }).then(function(r){
      if(r && r.id){ location.href = '?c=' + encodeURIComponent(r.id) + '#home'; return; }
      var cm = document.getElementById('lvtCoMsg'); cm.textContent = 'No class has that co-teacher code. Check it with the class’s teacher.'; cm.className = 'lv-msg is-bad'; }); }
  });

  /* ------------------------------------------------------------- routing */
  function route(){
    if(!S.rep) return;
    var h = location.hash.replace(/^#/, '') || 'home', parts = h.split('/'), head = parts[0], rest = parts.slice(1).join('/');
    if(head !== 'assign') B = null;
    if(head !== 'settings') ORDER_DRAFT = null;
    if(head !== 'live') liveStop();
    if(head !== 'bank') QE = null;
    if(head === 'work') viewWork();
    else if(head === 'a') viewAssignment(rest);
    else if(head === 'assign') viewAssign(rest);
    else if(head === 'students') viewStudents(rest);
    else if(head === 's') viewStudent(rest);
    else if(head === 'grades') location.replace('#students/gradebook');   // old links: Gradebook and Skills are views of Students now
    else if(head === 'skills') location.replace(M.isAp(S.rep.class.course) ? '#students/skills' : '#students');
    else if(head === 'settings') viewSettings(rest);
    else if(head === 'topic') viewTopic(rest);
    else if(head === 'live') viewLive();
    else if(head === 'bank') viewBank();
    else if(head === 'print') viewPrint(rest);
    else viewHome();
  }
  window.addEventListener('hashchange', route);

  function fail(text){ render(frame(sband({ issue: 'LevlPrep &middot; For teachers', title: 'Not available', lede: esc(text.charAt(0).toUpperCase() + text.slice(1)) + '.', ctas: '<a class="btn-chan" href="/teach/">Your classes</a>' }) + '<div style="height:60px"></div>')); }
  function start(){
    if(!S.user){ viewSignedOut(); return; }
    call('teach_profile').then(function(p){
      S.profile = p;
      if(!p){ viewProfile(); return; }
      if(params.get('dept') === '1'){ viewDept(); return; }
      if(CLASS_ID){ loadClass().then(route, function(){ fail('this class isn’t yours, or classes aren’t open yet'); }); return; }
      call('teach_my_classes').then(function(list){ S.classes = Array.isArray(list) ? list : []; viewClasses(); });
    });
  }
  function boot(){
    if(!M || !A() || !A().onAuthChange){ app.innerHTML = '<p class="lv-msg is-bad" style="padding:40px 0">This page could not load. Refresh to try again.</p>'; return; }
    loadIntegrations();
    if(DEMO){ S.user = { id: 'demo' }; loadScript('/assets/class/teach-demo.js').then(start, function(){ fail('the sample class could not load'); }); return; }
    var last = null;
    A().onAuthChange(function(u){
      // Signed in but the session is still being restored: wait for it rather than flash the signed-out page.
      if(!u && A().pendingUserId && A().pendingUserId() && !(A().settled && A().settled())) return;
      var key = u ? u.id : 'out';
      if(key === last) return;
      last = key; S.user = u; S.rep = null; start();
    });
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
