/* The teacher app (teach/index.html, docs/teacher-classes.md).

   /teach/            sign in, teacher name, the teacher's classes, a new class
   /teach/?c=<id>     one class, by hash:
     #home            what needs you, where the work stands, how the class is doing
     #work            every assignment          #a/<id>       one assignment's results
     #assign          the builder (#assign/<topicId>, #assign/edit/<id>, #assign/student/<id>)
     #students        everyone                  #s/<id>       one student
     #grades          the gradebook             #settings     order, code, name
     #topic/<id>      where the class struggles on one topic

   Every number comes from the students' own summaries (assets/class/class-model.js) through teach_class_report;
   nothing is stored on the teacher's side except the class, its order and its assignments. */
(function(){
  'use strict';
  var M = window.LevlClassModel, DAY = 86400000;
  var app = document.getElementById('lvtApp');
  var S = { user: null, profile: undefined, classes: null, rep: null, cur: null, frqs: null, banks: {}, bankWait: {} };
  var params = new URLSearchParams(location.search), CLASS_ID = params.get('c');

  function A(){ return window.StudyHubAccount; }
  function call(name, args){ return A().rpcData(name, args || {}); }
  function esc(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){ return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]; }); }
  function rich(s){ return window.LevlInline && window.LevlInline.html ? window.LevlInline.html(s || '') : esc(s); }
  function pct(v){ return v == null ? '·' : Math.round(v * 100) + '%'; }
  function plural(n, a, b){ return n + ' ' + (n === 1 ? a : (b || a + 's')); }
  function initials(n){ var p = String(n || '?').trim().split(/\s+/); return ((p[0] || '?')[0] + (p.length > 1 ? (p[p.length - 1][0] || '') : '')).toUpperCase(); }
  function day(t){ return t ? new Date(t).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }) : ''; }
  function ago(t){ if(!t) return 'never studied here'; var d = Math.floor((Date.now() - t) / DAY); return d <= 0 ? 'active today' : d === 1 ? 'active yesterday' : 'last active ' + d + ' days ago'; }
  var CHEV = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>';
  var KIND = { practice: 'Practice', review: 'Review', exam: 'Practice exam', frq: 'Free response' };

  /* ------------------------------------------------------------- shapes from the mockup */
  function q(n, a, b){ return '<div class="d5-q"><p class="d5-n">' + n + '</p><h2>' + a + ' <span>' + b + '</span></h2></div>'; }
  function band(o){
    return '<section class="band' + (o.small ? ' tm-band-sm' : ' tm-band-home') + '"><div class="hwrap"><div>' +
      '<p class="issue">' + o.issue + '</p><h1 class="mast">' + o.m1 + '<span>' + (o.m2 || '') + '</span></h1>' +
      (o.hand ? '<p class="hand">' + o.hand + '</p>' : '') + (o.lede ? '<p class="lede">' + o.lede + '</p>' : '') +
      (o.ctas ? '<div class="hero-ctas">' + o.ctas + '</div>' : '') + '</div>' + (o.art || '') + '</div></section>';
  }
  function frame(inner, cover){
    return '<main id="lvtMain" class="r3 r3-home d5" data-cover="' + esc(cover || 'apbio') + '">' + inner + '</main>';
  }
  function setNav(active){
    var bar = document.getElementById('lvtBar');
    if(!S.rep){ bar.innerHTML = ''; return; }
    var tabs = [['home', 'Class'], ['work', 'Assignments'], ['students', 'Students'], ['grades', 'Gradebook'], ['settings', 'Settings']];
    bar.innerHTML = '<div class="course-nav"><nav class="course-nav__inner" aria-label="' + esc(S.rep.class.name) + ' sections">' +
      tabs.map(function(t){ var on = t[0] === active; return '<a href="#' + t[0] + '" class="course-nav__link' + (on ? ' active' : '') + '"' + (on ? ' aria-current="page"' : '') + '>' + t[1] + '</a>'; }).join('') +
      '<a href="#assign" class="course-nav__link tm-navcta">+ Assign</a></nav></div>';
  }
  function render(html, active){ setNav(active); app.innerHTML = html; window.scrollTo(0, 0); }

  /* ------------------------------------------------------------- data */
  function loadScript(src){ return new Promise(function(res, rej){ var s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = rej; document.head.appendChild(s); }); }
  function course(){ return M.COURSES[S.rep.class.course]; }
  function curriculum(){
    var C = course();
    if(window[C.g]) return Promise.resolve(window[C.g]);
    return loadScript('/' + C.cur).then(function(){ return window[C.g]; });
  }
  function frqIndex(){
    if(S.frqs) return Promise.resolve(S.frqs);
    return fetch('/' + course().dir + '/assets/frq/index.json').then(function(r){ return r.ok ? r.json() : []; }, function(){ return []; }).then(function(x){ S.frqs = Array.isArray(x) ? x : []; return S.frqs; });
  }
  function bankFor(unit){
    var k = course().dir + '/' + unit;
    if(S.banks[k]) return Promise.resolve(S.banks[k]);
    if(!S.bankWait[k]) S.bankWait[k] = fetch('/' + course().dir + '/assets/bank/' + unit + '.json').then(function(r){ return r.ok ? r.json() : { items: [] }; }, function(){ return { items: [] }; })
      .then(function(b){ var by = {}; (b.items || []).forEach(function(it){ by[it.id] = it; }); S.banks[k] = by; return by; });
    return S.bankWait[k];
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
      return { id: m.id, name: m.name, joined: Date.parse(m.joined_at), extra_days: m.extra_days, summary: m.summary, tm: tm, um: um,
               overall: reached ? reached.reduce(function(x, u){ return x + um[u]; }, 0) / reached.length : M.overall(tm, cur), last: M.lastActive(m.summary), week: m.summary ? M.answeredSince(m.summary, now - 7 * DAY) : 0 };
    });
    D.byId = {}; D.members.forEach(function(m){ D.byId[m.id] = m; });
    D.assign = rep.assignments.map(function(a){
      var mine = D.members.filter(function(m){ return !a.students || a.students.indexOf(m.id) !== -1; });
      var st = {}; mine.forEach(function(m){
        var due = a.due_at ? Date.parse(a.due_at) + (m.extra_days || 0) * DAY : null;
        var lu = a.late_until ? Date.parse(a.late_until) + (m.extra_days || 0) * DAY : null;
        st[m.id] = M.status(Object.assign({}, a, { due_at: due, late_until: lu }), m.summary, now);
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
  function unitName(id){ var u = D.unitsById[id]; return u ? (u.n ? 'Unit ' + u.n : u.title) : id; }
  function unitTitle(id){ var u = D.unitsById[id]; return u ? u.title : id; }
  function unitLabel(id){ var u = D.unitsById[id]; return u && u.n ? unitName(id) + ' \u00b7 ' + u.title : unitTitle(id); }
  function topicName(id){ var t = D.topics[id]; return t ? (t.ced ? t.ced + ' ' : '') + t.title : id; }

  /* ------------------------------------------------------------- views: landing */
  function viewSignedOut(){
    render(frame(band({ issue: 'LevlPrep <i></i> For teachers', m1: 'Free classes', m2: 'for AP® teachers', hand: 'assign it, see who struggles, fix it',
      lede: 'Make a class, share a code, and assign practice, review, exams and free response from any of LevlPrep’s ten AP® courses. You see every student’s mastery and the exact questions the class misses.',
      ctas: '<button class="btn-chan" id="lvtSignIn" type="button">Sign in to start</button><a class="btn-ghost" href="/join.html">I’m a student</a>' }) +
      '<div class="hwrap"><div class="lv-grid3 tm-up">' +
      '<div class="d5-card"><p class="d5-lead">Your order, their path</p><p class="d5-mut">Set the units in the order you teach them. Every student’s study path follows it.</p></div>' +
      '<div class="d5-card"><p class="d5-lead">See the misconception</p><p class="d5-mut">Each question the class misses, with the wrong answer most of them picked.</p></div>' +
      '<div class="d5-card"><p class="d5-lead">Fix it in one tap</p><p class="d5-mut">Turn any weak topic into an assignment from the class page.</p></div></div>' +
      '<p class="d5-mut" style="margin:28px 0 60px">Free for teachers. Students use the free plan, so nobody has to pay. Students must be 13 or older. <a href="/privacy.html#classes">What teachers see</a></p></div>'));
    document.getElementById('lvtSignIn').addEventListener('click', function(){ A().openAuthModal(); });
  }
  function viewProfile(){
    var meta = (S.user && S.user.user_metadata) || {};
    render(frame(band({ issue: 'LevlPrep <i></i> For teachers', m1: 'Welcome,', m2: 'teacher', hand: 'one step before your first class', small: true }) +
      '<div class="hwrap"><form class="d5-card tm-up lv-narrow" id="lvtProf"><p class="d5-lead">How students see you</p><p class="d5-mut">Shown to students when they join, for example &ldquo;Ms. Rivera&rdquo;.</p>' +
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
        '<span class="lp-pill">' + esc(C.name || c.course) + '</span><p class="d5-lead" style="margin-top:10px">' + esc(c.name) + (c.archived ? ' (archived)' : '') + '</p>' +
        '<p class="d5-mut">' + plural(c.members, 'student') + ' &middot; code <b style="font-family:var(--font-mono)">' + esc(c.code) + '</b></p></a>';
    }).join('');
    var opts = M.ORDER.map(function(k){ return '<option value="' + k + '"' + (k === 'apbio' ? ' selected' : '') + '>' + esc(M.COURSES[k].name) + '</option>'; }).join('');
    render(frame(band({ issue: 'LevlPrep <i></i> For teachers', m1: 'Your', m2: 'classes', hand: list.length ? plural(list.length, 'class', 'classes') : 'make your first class', small: true }) +
      '<div class="hwrap"><div class="lvt-assign tm-up"><div class="main">' +
      (cards ? '<div class="lv-grid2">' + cards + '</div>' : '<div class="d5-card tm-empty"><p class="d5-lead">No classes yet</p><p class="d5-mut">Make one on the right. Each class period gets its own code.</p></div>') +
      '</div><aside class="side"><form class="lp-card" id="lvtNew"><span class="lp-pill">New class</span><h2 class="lp-h2">Make a <span>class</span></h2>' +
      '<label class="lv-field" style="margin-top:12px"><span>Course</span><select class="lv-in" id="lvtNCourse">' + opts + '</select></label>' +
      '<label class="lv-field"><span>Class name</span><input class="lv-in" id="lvtNName" maxlength="60" placeholder="Period 3" required></label>' +
      '<button class="lp-btn gold" type="submit">Make the class</button><p class="lv-msg" id="lvtNMsg" role="status"></p></form></aside></div><div style="height:60px"></div></div>'));
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
    var meta = kind + (a.spec && a.spec.count && a.kind === 'practice' ? ' &middot; ' + a.spec.count + ' questions' : '') + (a.due_at ? ' &middot; due ' + day(Date.parse(a.due_at)) : '');
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
    var c = S.rep.class, cn = course().name;
    var nd = needs(), list = D.assign.filter(function(a){ return a.open; }).slice(0, 5);
    var html = band({ issue: esc(cn) + ' &middot; Teacher <i></i> ' + esc(c.name), m1: esc(c.name), m2: 'at a glance',
      hand: plural(D.members.length, 'student') + (D.current ? ' &middot; now teaching ' + esc(unitName(D.current)) : ''),
      lede: 'Everything your class did on LevlPrep, and what needs you today.',
      ctas: '<a class="btn-chan" href="#assign">Assign work</a><a class="btn-ghost" href="#grades">Gradebook</a>', art: codeArt() });
    html += '<div class="hwrap">';
    if(!D.members.length){
      html += '<section class="d5-sec"><div class="d5-card tm-empty"><p class="d5-lead">No students yet</p><p class="d5-mut">Share the join link or show the code on screen. Students sign in with Google or an emailed code, then see exactly what you’ll see before they join.</p>' +
        '<p class="lv-btns" style="justify-content:center;margin-top:16px"><button class="lp-btn gold" data-copy="link" type="button">Copy join link</button><button class="lp-btn ghost" data-show="code" type="button">Show the code on screen</button><a class="lp-btn ghost" href="#settings">Set your unit order</a></p></div></section>';
    }
    html += '<section class="d5-sec">' + q('1', 'What', 'needs you today') + '<div class="d5-now">' +
      (nd.length ? nd.map(function(x){ return '<div class="tm-now"><div class="tx"><b>' + x.t + '</b><span>' + x.s + '</span></div>' + x.b + '</div>'; }).join('') + '<p class="d5-starthere tm-starthere">start at the top</p>'
        : '<div class="tm-now"><div class="tx"><b>Nothing needs you right now</b><span>Late work, struggling topics and flagged questions show up here.</span></div><a class="lp-btn gold sm" href="#assign">Assign something</a></div>') + '</div></section>';
    html += '<section class="d5-sec">' + q('2', 'Where the', 'work stands') + (list.length ? '<div class="d5-card lvt-list">' + list.map(arow).join('') + '</div>' + (D.assign.length > 5 ? '<p style="margin:12px 0 0;font-weight:800"><a href="#work">All ' + D.assign.length + ' assignments</a></p>' : '')
      : '<div class="d5-card tm-empty"><p class="d5-lead">Nothing assigned yet</p><p class="d5-mut">Practice, review, a practice exam or a free response, in one screen.</p><p style="margin:14px 0 0"><a class="lp-btn gold" href="#assign">Assign work</a></p></div>') + '</section>';
    var ur = unitRows(function(u, cls){ var v = D.unitAvg[u]; return '<div class="lvt-urow' + cls + '"><div><b>' + esc(unitName(u)) + (cls === ' is-now' ? ' &middot; now' : '') + '</b><small>' + esc(unitTitle(u)) + '</small></div><div class="bar"><i style="width:' + Math.round(v * 100) + '%"></i></div><div class="v">' + pct(v) + '</div></div>'; });
    var co = checkOn();
    html += '<section class="d5-sec">' + q('3', 'How the', 'class is doing') + '<div class="lv-grid2"><div class="d5-card"><p class="d5-lead">Mastery by unit, in your order</p><p class="d5-mut">Class average' + (D.current ? '. Units you haven’t reached yet are faded.' : '. Set the unit you’re on in Settings.') + '</p>' + ur + '</div>' +
      '<div class="d5-card"><p class="d5-lead">Students to check on</p><p class="d5-mut">Picked from missing work, scores and activity.</p><div style="margin-top:6px">' + (co.length ? co.map(srow).join('') : '<p class="d5-empty">Nobody stands out right now.</p>') + '</div>' +
      (D.members.length ? '<p style="margin:12px 0 0"><a href="#students" style="font-weight:800">All ' + plural(D.members.length, 'student') + '</a></p>' : '') + '</div></div></section></div><div style="height:60px"></div>';
    render(frame(html, c.course), 'home');
  }

  /* ------------------------------------------------------------- assignments */
  function viewWork(){
    var c = S.rep.class;
    var html = band({ issue: esc(course().name) + ' &middot; ' + esc(c.name) + ' <i></i> Assignments', m1: 'Assign', m2: 'ments', hand: plural(D.assign.length, 'assignment'), small: true, ctas: '<a class="btn-chan" href="#assign">Assign work</a>' }) +
      '<div class="hwrap"><div class="tm-up">' + (D.assign.length ? '<div class="d5-card lvt-list">' + D.assign.map(arow).join('') + '</div>' : '<div class="d5-card tm-empty"><p class="d5-lead">Nothing assigned yet</p><p style="margin:14px 0 0"><a class="lp-btn gold" href="#assign">Assign work</a></p></div>') + '</div><div style="height:60px"></div></div>';
    render(frame(html, c.course), 'work');
  }
  function col(title, cls, ms, a, valFn, empty){
    var rows = ms.map(function(m){ return '<a class="lvt-p" href="#s/' + m.id + '" style="text-decoration:none;color:var(--ink)"><span class="lvt-av" style="width:28px;height:28px;font-size:11px">' + esc(initials(m.name)) + '</span><b>' + esc(m.name) + '</b><span>' + valFn(m) + '</span></a>'; });
    var shown = rows.slice(0, 8).join(''), rest = rows.slice(8).join('');
    return '<div class="lvt-col"><h3>' + title + ' <span class="lv-tag ' + cls + '">' + ms.length + '</span></h3>' + (shown || '<p class="d5-mut">' + empty + '</p>') +
      (rest ? '<details><summary class="d5-mut" style="cursor:pointer;margin:6px 4px">' + (rows.length - 8) + ' more</summary>' + rest + '</details>' : '') +
      (ms.length ? '<p style="margin:12px 0 0"><button class="lp-btn sm ghost" type="button" data-copytext="' + esc(ms.map(function(m){ return m.name; }).join(', ')) + '">Copy names</button></p>' : '') + '</div>';
  }
  function struggleHtml(id, items){
    if(!items.length) return '<div class="d5-card tm-empty"><p class="d5-lead">Not enough answers yet</p><p class="d5-mut">Questions show here once at least two students have answered them.</p></div>';
    return '<div class="d5-card lvt-list" id="' + id + '">' + items.map(function(o){ return '<div class="lvt-qi" data-item="' + esc(o.id) + '"><div><p class="lv-kick">' + esc(topicName(o.t)) + '</p><p class="stem d5-mut">Loading the question…</p></div><div></div></div>'; }).join('') + '</div>';
  }
  function fillStruggle(id, items){
    items.forEach(function(o){
      var t = D.topics[o.t], unit = t ? (t.bank || t.unit) : o.u;
      bankFor(unit).then(function(by){
        var box = document.querySelector('#' + id + ' [data-item="' + (window.CSS && CSS.escape ? CSS.escape(o.id) : o.id) + '"]'); if(!box) return;
        var it = by[o.id], wrongPct = Math.round(o.wrong / o.n * 100);
        var left = '<div><p class="lv-kick">' + esc(topicName(o.t)) + '</p><p class="stem">' + (it ? rich(it.q) : 'Question ' + esc(o.id)) + '</p>' +
          '<p class="lv-btns" style="margin-top:12px"><span class="lv-tag is-late">' + wrongPct + '% wrong</span><span class="lv-tag">' + plural(o.n, 'answer') + '</span>' + (o.flags ? '<span class="lv-tag is-prog">' + plural(o.flags, 'flag') + '</span>' : '') + '</p>' +
          '<div class="lv-btns" style="margin-top:12px"><a class="lp-btn sm ghost" href="#assign/' + esc(o.t) + '">Assign practice on this topic</a>' + (o.who.length ? '<details><summary class="lp-btn sm ghost" style="list-style:none">Who got it wrong</summary><p class="tm-who-list">' + esc(o.who.join(', ')) + '</p></details>' : '') + '</div></div>';
        var right = '';
        if(it && it.type === 'single' && it.options){
          var total = Object.keys(o.picks).reduce(function(x, k){ return x + o.picks[k]; }, 0);
          if(total){
            var top = null;
            right = it.options.map(function(op, i){
              var n = o.picks[i] || 0, p = Math.round(n / total * 100), ok = i === it.correct;
              if(!ok && n && (!top || n > top.n)) top = { i: i, n: n, p: p };
              return '<div class="lvt-opt"><span class="l' + (ok ? ' ok' : '') + '">' + String.fromCharCode(65 + i) + '</span><div class="b"><i class="' + (ok ? 'ok' : n ? 'no' : '') + '" style="width:' + p + '%"></i><span>' + rich(op) + '</span></div><span class="v">' + p + '%</span></div>';
            }).join('') + (top ? '<p class="lvt-miss">most wrong answers picked ' + String.fromCharCode(65 + top.i) + '</p>' : '') + '<p class="d5-mut" style="font-size:12.5px">From ' + plural(total, 'student') + ' whose pick was saved.</p>';
          }
        }
        box.innerHTML = left + '<div>' + right + '</div>';
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
  function viewAssignment(id){
    var a = D.assign.filter(function(x){ return x.id === id; })[0];
    if(!a){ location.hash = '#work'; return; }
    var c = S.rep.class, ms = a.who, st = a.st;
    var not = ms.filter(function(m){ return st[m.id].state === 'not' || st[m.id].state === 'missing'; }),
        prog = ms.filter(function(m){ return st[m.id].state === 'progress'; }),
        done = ms.filter(function(m){ return st[m.id].state === 'done'; }).sort(function(x, y){ return (st[y.id].score || 0) - (st[x.id].score || 0); });
    var topics = (a.spec && a.spec.topics) || [], opens = Date.parse(a.opens_at);
    var filter = function(r){ return r.seen >= opens && (!topics.length || topics.indexOf(r.t) !== -1); };
    var items = (a.kind === 'practice' || a.kind === 'review') ? M.itemStats(ms, filter).filter(function(o){ return o.wrong; }).slice(0, 6) : [];
    var flags = 0, fc = M.flagCounts(ms); Object.keys(fc).forEach(function(k){ var t = (/^[a-z]+-(.+)-\d+$/.exec(k) || [])[1]; if(!topics.length || topics.indexOf(t) !== -1) flags++; });
    var lateTxt = a.late_until ? 'late work until ' + day(Date.parse(a.late_until)) : 'no late work';
    var html = band({ issue: esc(course().name) + ' &middot; ' + esc(c.name) + ' <i></i> ' + (a.required ? 'Required' : 'Optional') + ' &middot; ' + KIND[a.kind],
      m1: esc(a.title), m2: '', hand: (a.due_at ? 'due ' + day(Date.parse(a.due_at)) + ' &middot; ' : '') + a.n.done + ' of ' + a.n.all + ' done',
      lede: (a.kind === 'practice' ? a.spec.count + ' questions &middot; ' : '') + lateTxt + (topics.length ? ' &middot; ' + esc(topics.map(topicName).join(', ')) : ''),
      ctas: '<a class="btn-chan" href="#assign/edit/' + a.id + '">Edit settings or due date</a><button class="btn-ghost" type="button" data-csv="' + a.id + '">Export CSV</button>', small: true });
    html += '<div class="hwrap"><div class="lvt-stats tm-up"><div class="lvt-stat"><b>' + a.n.done + ' of ' + a.n.all + '</b><span>done</span></div><div class="lvt-stat"><b>' + (a.avg == null ? '·' : pct(a.avg)) + '</b><span>class average so far</span></div>' +
      '<div class="lvt-stat"><b>' + (a.n.not + a.n.missing) + '</b><span>' + (a.n.missing ? 'not started or missing' : 'not started') + '</span></div><div class="lvt-stat"><b>' + flags + '</b><span>questions flagged as confusing</span></div></div>';
    var val = function(m){ var s = st[m.id]; return s.state === 'done' ? (s.score == null ? 'done' : pct(s.score)) + (s.late ? ' late' : '') : s.state === 'progress' ? s.answered + ' of ' + s.total : s.state === 'missing' ? 'missing' : ago(m.last); };
    html += '<section class="d5-sec">' + q('1', 'Who’s', 'done') + '<div class="lvt-cols">' + col(a.n.missing ? 'Not started or missing' : 'Not started', 'is-late', not, a, val, 'Everyone has started.') + col('In progress', 'is-prog', prog, a, val, 'Nobody is midway.') + col('Done', 'is-done', done, a, val, 'Nobody has finished yet.') + '</div></section>';
    if(a.kind === 'practice' || a.kind === 'review'){
      html += '<section class="d5-sec">' + q('2', 'Where they', 'struggle') + struggleHtml('lvtQs', items) + '</section>';
      if(topics.length) html += '<section class="d5-sec">' + q('3', 'By', 'topic') + '<div class="d5-card lvt-list">' + topicRows(topics, filter) + '</div></section>';
    }
    html += '<p style="margin:40px 0 60px"><button class="lp-btn sm ghost" type="button" data-del="' + a.id + '">Delete this assignment</button></p></div>';
    render(frame(html, c.course), 'work');
    fillStruggle('lvtQs', items);
  }
  function viewTopic(t){
    if(!D.topics[t]){ location.hash = '#home'; return; }
    var items = M.itemStats(D.members, function(r){ return r.t === t; }).filter(function(o){ return o.wrong; }).slice(0, 8);
    var html = band({ issue: esc(course().name) + ' &middot; ' + esc(S.rep.class.name) + ' <i></i> Topic', m1: esc(D.topics[t].title), m2: '', hand: 'every answer your class gave on this topic', small: true,
      ctas: '<a class="btn-chan" href="#assign/' + esc(t) + '">Fix it: assign practice</a>' }) +
      '<div class="hwrap"><div class="tm-up">' + struggleHtml('lvtQs', items) + '</div><div style="height:60px"></div></div>';
    render(frame(html, S.rep.class.course), 'home');
    fillStruggle('lvtQs', items);
  }

  /* ------------------------------------------------------------- assign builder */
  var B = null;
  function newDraft(arg){
    var now = new Date(), due = new Date(now.getTime() + 3 * DAY); due.setHours(23, 59, 0, 0);
    var d = { id: null, kind: 'practice', topics: [], count: 20, unit: '', frq: '', required: true, opens: '', due: local(due), late: 2, who: 'all', students: [], title: '', titleTouched: false };
    if(arg && arg.indexOf('edit/') === 0){
      var a = D.assign.filter(function(x){ return x.id === arg.slice(5); })[0];
      if(a){ var dueT = a.due_at ? Date.parse(a.due_at) : null;
        d = { id: a.id, kind: a.kind, topics: (a.spec.topics || []).slice(), count: a.spec.count || 20, unit: a.spec.unit || '', frq: a.spec.frq || '', required: a.required,
              opens: Date.parse(a.opens_at) > Date.now() ? local(new Date(a.opens_at)) : '', due: dueT ? local(new Date(dueT)) : '', late: a.late_until && dueT ? Math.round((Date.parse(a.late_until) - dueT) / DAY) : 0,
              who: a.students ? 'some' : 'all', students: (a.students || []).slice(), title: a.title, titleTouched: true }; }
    } else if(arg && arg.indexOf('student/') === 0){ d.who = 'some'; d.students = [arg.slice(8)]; }
    else if(arg && D.topics[arg]) d.topics = [arg];
    return d;
  }
  function local(dt){ var p = function(n){ return (n < 10 ? '0' : '') + n; }; return dt.getFullYear() + '-' + p(dt.getMonth() + 1) + '-' + p(dt.getDate()) + 'T' + p(dt.getHours()) + ':' + p(dt.getMinutes()); }
  function autoTitle(){
    var t = B.topics;
    if(B.kind === 'exam') return B.unit ? unitName(B.unit) + ' test: ' + unitTitle(B.unit) : 'Full practice exam';
    if(B.kind === 'frq'){ var f = (S.frqs || []).filter(function(x){ return x.id === B.frq; })[0]; return 'Free response: ' + (f ? f.title : 'pick one'); }
    var head = t.length === 1 ? D.topics[t[0]].title : t.length ? (function(){ var us = t.map(function(x){ return D.topics[x].unit; }).filter(function(v, i, a){ return a.indexOf(v) === i; }); return us.length === 1 ? unitName(us[0]) + ' ' + (B.kind === 'review' ? 'review' : 'practice') : t.length + ' topics'; })() : (B.kind === 'review' ? 'Review your misses' : 'Practice');
    return B.kind === 'review' && t.length ? 'Review: ' + head : head;
  }
  function weakTopics(){
    var allowed = (D.curIdx >= 0 ? D.order.slice(0, D.curIdx + 1) : D.order).concat(D.extra);
    var by = {}; D.members.forEach(function(m){ M.rows(m.summary).forEach(function(r){ if(allowed.indexOf(r.u) === -1) return; var o = by[r.t] || (by[r.t] = { n: 0, w: 0 }); o.n++; if(!r.right) o.w++; }); });
    return Object.keys(by).filter(function(t){ return by[t].n >= 4 && D.topics[t]; }).sort(function(a, b){ return by[b].w / by[b].n - by[a].w / by[a].n; }).slice(0, 3);
  }
  function viewAssign(arg){
    if(!B || B.arg !== arg){ B = newDraft(arg); B.arg = arg; }
    frqIndex().then(function(){ if(location.hash.indexOf('#assign') === 0) drawAssign(); });
    drawAssign();
  }
  function drawAssign(){
    var c = S.rep.class;
    if(!B.titleTouched) B.title = autoTitle();
    var tile = function(k, n, d){ return '<button class="lvt-tile" type="button" data-kind="' + k + '" aria-pressed="' + (B.kind === k) + '"><b>' + n + '</b><span>' + d + '</span></button>'; };
    var units = D.order.concat(D.extra).map(function(u){
      var ts = S.cur.topics.filter(function(t){ return t.unit === u && t.built !== false; });
      var picked = ts.filter(function(t){ return B.topics.indexOf(t.id) !== -1; }).length;
      return '<details class="lvt-unit"' + (picked || u === D.current ? ' open' : '') + '><summary>' + esc(unitName(u)) + ' &middot; ' + esc(unitTitle(u)) + ' <small>' + (picked ? picked + ' of ' + ts.length + ' picked' : 'none') + '</small></summary><div class="tops">' +
        '<label><input type="checkbox" data-unitall="' + esc(u) + '"' + (picked === ts.length && ts.length ? ' checked' : '') + '> <b>The whole unit</b></label>' +
        ts.map(function(t){ return '<label><input type="checkbox" data-topic="' + esc(t.id) + '"' + (B.topics.indexOf(t.id) !== -1 ? ' checked' : '') + '> ' + esc(topicName(t.id)) + '</label>'; }).join('') + '</div></details>';
    }).join('');
    var wt = weakTopics();
    var chips = B.topics.map(function(t){ return '<a href="#" data-untopic="' + esc(t) + '">' + esc(topicName(t)) + ' &times;</a>'; }).join('');
    var what = '';
    if(B.kind === 'practice' || B.kind === 'review'){
      what = '<section class="d5-card">' + q('2', 'On which', 'topics?') + (chips ? '<p class="lvc-chips" style="margin:0 0 14px">' + chips + '</p>' : B.kind === 'review' ? '<p class="d5-mut" style="margin:0 0 14px">No topics picked: each student reviews every miss in the course.</p>' : '') + units +
        (wt.length ? '<div class="tm-hint"><p><b>Your class is weakest on ' + esc(topicName(wt[0])) + '.</b> From every answer so far in the units you’ve taught.</p><button class="lp-btn sm" type="button" data-weak="1">Use the ' + plural(wt.length, 'weakest topic') + '</button></div>' : '') +
        '<label class="lv-field" style="margin-top:16px;max-width:280px"><span>' + (B.kind === 'practice' ? 'Questions to answer' : 'Most questions to redo') + '</span><input class="lv-in" type="number" min="1" max="100" id="lvtCount" value="' + B.count + '"></label></section>';
    } else if(B.kind === 'exam'){
      what = '<section class="d5-card">' + q('2', 'Which', 'exam?') + '<label class="lv-field"><span>Exam</span><select class="lv-in" id="lvtUnit"><option value="">Full practice exam</option>' + D.order.map(function(u){ return '<option value="' + esc(u) + '"' + (B.unit === u ? ' selected' : '') + '>' + esc(unitName(u) + ' test: ' + unitTitle(u)) + '</option>'; }).join('') + '</select></label><p class="d5-mut">Students take it on the course’s Exams page, timed as usual.</p></section>';
    } else {
      var fs = (S.frqs || []).slice().sort(function(a, b){ return String(a.title).localeCompare(b.title); });
      what = '<section class="d5-card">' + q('2', 'Which', 'free response?') + '<label class="lv-field"><span>Question</span><select class="lv-in" id="lvtFrq"><option value="">Pick one</option>' + fs.map(function(f){ return '<option value="' + esc(f.id) + '"' + (B.frq === f.id ? ' selected' : '') + '>' + esc(f.title) + (f.points ? ' (' + f.points + ' points)' : '') + '</option>'; }).join('') + '</select></label><p class="d5-mut">Students score it against the rubric; Premium students can use the AI grader.</p></section>';
    }
    var seg = function(attr, val, on, label){ return '<button type="button" data-' + attr + '="' + val + '" aria-pressed="' + on + '">' + label + '</button>'; };
    var who = '<div class="lv-seg" role="group" aria-label="Who">' + seg('who', 'all', B.who === 'all', 'Whole class (' + D.members.length + ')') + seg('who', 'some', B.who === 'some', 'Choose students') + '</div>' +
      (B.who === 'some' ? '<div class="lv-grid3" style="margin-top:12px">' + D.members.map(function(m){ return '<label class="lvt-check"><input type="checkbox" data-student="' + m.id + '"' + (B.students.indexOf(m.id) !== -1 ? ' checked' : '') + '> ' + esc(m.name) + '</label>'; }).join('') + '</div>' : '');
    var lateOpts = [[0, 'Not accepted'], [1, 'Up to 1 day late'], [2, 'Up to 2 days late'], [3, 'Up to 3 days late'], [7, 'Up to a week late']];
    if(B.late && !lateOpts.some(function(o){ return o[0] === B.late; })) lateOpts.push([B.late, 'Up to ' + plural(B.late, 'day') + ' late']);
    var html = band({ issue: esc(course().name) + ' &middot; ' + esc(c.name) + ' <i></i> ' + (B.id ? 'Edit' : 'Assign'), m1: B.id ? 'Edit' : 'Assign', m2: 'work', hand: 'one screen, smart defaults', lede: 'Pick what, which topics and when.', small: true }) +
      '<div class="hwrap"><form class="lvt-assign tm-up" id="lvtAssign"><div class="main">' +
      '<section class="d5-card">' + q('1', 'What should', 'they do?') + '<div class="lvt-tiles">' + tile('practice', 'Practice', 'Questions on the topics you pick') + tile('review', 'Review', 'Each student redoes their own misses') + tile('exam', 'Practice exam', 'A unit test or the full AP&reg; exam') + tile('frq', 'Free response', 'AP&reg; style, scored with the rubric') + '</div></section>' +
      what +
      '<section class="d5-card">' + q('3', 'When, and', 'does it count?') + '<div class="lv-grid2"><label class="lv-field"><span>Opens (blank is now)</span><input class="lv-in" type="datetime-local" id="lvtOpens" value="' + esc(B.opens) + '"></label><label class="lv-field"><span>Due</span><input class="lv-in" type="datetime-local" id="lvtDue" value="' + esc(B.due) + '"></label></div>' +
      '<div class="lv-grid2"><div><div class="lv-seg" role="group" aria-label="Required or optional">' + seg('req', '1', B.required, 'Required') + seg('req', '0', !B.required, 'Optional') + '</div><p class="d5-mut" style="margin-top:8px">' + (B.required ? 'Counts in the gradebook. Late and missing work is flagged.' : 'Never late and never in the average; you still see who did it.') + '</p></div>' +
      '<label class="lv-field"><span>Late work</span><select class="lv-in" id="lvtLate">' + lateOpts.map(function(o){ return '<option value="' + o[0] + '"' + (B.late === o[0] ? ' selected' : '') + '>' + o[1] + '</option>'; }).join('') + '</select></label></div></section>' +
      '<section class="d5-card">' + q('4', 'Who', 'gets it?') + who + '</section>' +
      '<section class="d5-card"><label class="lv-field" style="margin:0"><span>Title students see</span><input class="lv-in" id="lvtTitle" maxlength="120" value="' + esc(B.title) + '"></label></section>' +
      '<div class="lv-btns"><button class="lp-btn gold" type="submit">' + (B.id ? 'Save changes' : 'Assign to ' + esc(c.name)) + '</button><a class="lp-btn ghost" href="#' + (B.id ? 'a/' + B.id : 'home') + '">Cancel</a><p class="lv-msg" id="lvtAMsg" role="status" style="margin:0"></p></div>' +
      '</div><aside class="side"><div class="d5-now lvt-prev"><p class="d5-starthere" style="text-align:left">what students will see</p><div class="card"><span class="lv-tag ' + (B.required ? 'is-req' : '') + '">' + (B.required ? (B.due ? 'Due ' + esc(day(Date.parse(B.due))) : 'Required') : 'Optional') + '</span><b>' + esc(B.title) + '</b>' +
      '<p class="d5-mut" style="margin:0">From ' + esc((S.profile && S.profile.name) || 'you') + ' &middot; ' + KIND[B.kind] + (B.kind === 'practice' ? ' &middot; ' + B.count + ' questions' : '') + '</p><p style="margin:12px 0 0"><span class="lp-btn gold sm">Start</span></p></div>' +
      '<ul class="d5-steps"><li>Shows at the top of their course home</li><li>Works on the free plan; free limits still apply unless they have Premium</li><li>Progress updates here as they work</li></ul></div></aside></form><div style="height:60px"></div></div>';
    render(frame(html, c.course), 'work');
  }
  function readForm(){
    var g = function(id){ var el = document.getElementById(id); return el ? el.value : null; };
    if(g('lvtCount') != null) B.count = Math.max(1, Math.min(100, parseInt(g('lvtCount'), 10) || 20));
    if(g('lvtUnit') != null) B.unit = g('lvtUnit');
    if(g('lvtFrq') != null) B.frq = g('lvtFrq');
    if(g('lvtOpens') != null) B.opens = g('lvtOpens');
    if(g('lvtDue') != null) B.due = g('lvtDue');
    if(g('lvtLate') != null) B.late = parseInt(g('lvtLate'), 10) || 0;
    var ti = g('lvtTitle'); if(ti != null && ti !== B.title){ B.title = ti; B.titleTouched = true; }
  }
  function saveAssign(){
    readForm();
    var msg = document.getElementById('lvtAMsg');
    var bad = function(t){ msg.textContent = t; msg.className = 'lv-msg is-bad'; };
    if(B.kind === 'practice' && !B.topics.length) return bad('Pick at least one topic.');
    if(B.kind === 'frq' && !B.frq) return bad('Pick a free-response question.');
    if(B.who === 'some' && !B.students.length) return bad('Pick at least one student.');
    if(!B.title.trim()) return bad('Give it a title.');
    var due = B.due ? new Date(B.due) : null, f = (S.frqs || []).filter(function(x){ return x.id === B.frq; })[0];
    var data = { kind: B.kind, title: B.title.trim(),
      spec: { topics: B.kind === 'practice' || B.kind === 'review' ? B.topics : [], topicNames: (B.kind === 'practice' || B.kind === 'review' ? B.topics : []).map(function(t){ return D.topics[t] ? D.topics[t].title : t; }),
              count: B.count, unit: B.kind === 'exam' ? B.unit || null : null, frq: B.kind === 'frq' ? B.frq : null, points: f ? f.points : null },
      opens_at: B.opens ? new Date(B.opens).toISOString() : (B.id ? null : new Date().toISOString()),
      due_at: due ? due.toISOString() : null, late_until: due && B.late ? new Date(due.getTime() + B.late * DAY).toISOString() : null,
      required: B.required, students: B.who === 'some' ? B.students : null };
    if(!data.opens_at) delete data.opens_at;
    msg.textContent = 'Saving…'; msg.className = 'lv-msg';
    call('teach_save_assignment', { p_class: CLASS_ID, p_id: B.id, p_data: data }).then(function(id){
      if(!id) return bad('That did not save. Try again.');
      B = null;
      loadClass().then(function(){ location.hash = '#a/' + id; });
    });
  }

  /* ------------------------------------------------------------- students */
  function viewStudents(){
    var c = S.rep.class, cu = D.current;
    var rows = D.members.slice().sort(function(a, b){ return a.name.localeCompare(b.name); }).map(function(m){
      var req = D.assign.filter(function(a){ return a.required && a.st[m.id]; });
      var done = req.filter(function(a){ return a.st[m.id].state === 'done'; }).length, miss = req.filter(function(a){ return a.st[m.id].state === 'missing'; }).length;
      return '<a class="lvt-arow" href="#s/' + m.id + '"><div><b>' + esc(m.name) + '</b><small>' + ago(m.last) + (miss ? ' &middot; <span style="color:#B4412F;font-weight:800">' + miss + ' missing</span>' : '') + '</small></div>' +
        '<div class="hide"><div class="lv-bar"><i style="width:' + Math.round((cu ? m.um[cu] : m.overall) * 100) + '%"></i></div><small>' + (cu ? pct(m.um[cu]) + ' in ' + esc(unitName(cu)) + ' &middot; ' : '') + done + ' of ' + req.length + ' required done</small></div>' +
        '<div class="lvt-score">' + pct(m.overall) + '<small>mastery</small></div></a>';
    }).join('');
    var html = band({ issue: esc(course().name) + ' &middot; ' + esc(c.name) + ' <i></i> Students', m1: 'Stu', m2: 'dents', hand: plural(D.members.length, 'student'), small: true }) +
      '<div class="hwrap"><div class="tm-up">' + (rows ? '<div class="d5-card lvt-list">' + rows + '</div>' : '<div class="d5-card tm-empty"><p class="d5-lead">No students yet</p><p class="lv-btns" style="justify-content:center;margin-top:14px"><button class="lp-btn gold" data-copy="link" type="button">Copy join link</button></p></div>') + '</div><div style="height:60px"></div></div>';
    render(frame(html, c.course), 'students');
  }
  function viewStudent(id){
    var m = D.byId[id]; if(!m){ location.hash = '#students'; return; }
    var c = S.rep.class, now = Date.now();
    var mine = D.assign.filter(function(a){ return a.st[m.id] && a.open; });
    var req = mine.filter(function(a){ return a.required; });
    var done = req.filter(function(a){ return a.st[m.id].state === 'done'; }).length, late = mine.filter(function(a){ return a.st[m.id].late; }).length, miss = req.filter(function(a){ return a.st[m.id].state === 'missing'; }).length;
    var html = band({ issue: esc(course().name) + ' &middot; ' + esc(c.name) + ' <i></i> Student', m1: esc(m.name), m2: '', hand: 'in ' + esc(c.name) + ' since ' + day(m.joined) + ' &middot; ' + ago(m.last),
      lede: 'You see their ' + esc(course().name) + ' work only. Their other courses stay private.', ctas: '<a class="btn-chan" href="#assign/student/' + m.id + '">Assign to ' + esc(m.name.split(' ')[0]) + '</a>', small: true });
    html += '<div class="hwrap"><div class="lvt-stats tm-up"><div class="lvt-stat"><b>' + pct(m.overall) + '</b><span>overall mastery</span></div><div class="lvt-stat"><b>' + done + ' of ' + req.length + '</b><span>required done</span></div>' +
      '<div class="lvt-stat"><b>' + late + '</b><span>late &middot; ' + miss + ' missing</span></div><div class="lvt-stat"><b>' + m.week + '</b><span>questions this week</span></div></div>';
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
    html += '<section class="d5-sec">' + q('1', 'How they’re', 'doing') + '<div class="lv-grid2"><div class="d5-card"><p class="d5-lead">Mastery by unit</p><p class="d5-mut">Their score, with the class average as a line.</p>' + bars + '</div>' +
      '<div class="d5-card"><p class="d5-lead">Their assignments</p>' + (al || '<p class="d5-empty">Nothing assigned to them yet.</p>') + '</div></div></section>';
    html += '<section class="d5-sec">' + q('2', 'What they get', 'wrong') + '<div class="lv-grid2"><div class="d5-card"><p class="d5-lead">Weakest topics</p>' + (weak || '<p class="d5-empty">Not enough answers yet.</p>') + '</div>' +
      '<div class="d5-card"><p class="d5-lead">Questions they flagged</p><p class="d5-mut">Students flag questions they find confusing.</p>' + (flags || '<p class="d5-empty">No flags.</p>') + '</div></div></section>';
    html += '<section class="d5-sec">' + q('3', 'Their', 'accommodations') + '<div class="d5-card"><p class="d5-lead">Applied to every assignment, hidden from classmates</p><div class="lv-grid2" style="margin-top:14px"><label class="lv-field"><span>Extra days on due dates</span><select class="lv-in" id="lvtXd">' +
      [0, 1, 2, 3, 5, 7].map(function(n){ return '<option value="' + n + '"' + (m.extra_days === n ? ' selected' : '') + '>' + (n ? plural(n, 'day') : 'None') + '</option>'; }).join('') + '</select></label></div>' +
      '<p class="lv-btns"><button class="lp-btn sm" type="button" data-savem="' + m.id + '">Save</button><button class="lp-btn sm ghost" type="button" data-removem="' + m.id + '">Remove from class</button></p><p class="lv-msg" id="lvtXMsg" role="status"></p></div></section><div style="height:60px"></div></div>';
    render(frame(html, c.course), 'students');
  }

  /* ------------------------------------------------------------- gradebook */
  var GB_SORT = 'name';
  function cell(a, m){
    var s = a.st[m.id]; if(!s) return '<td><span class="lvt-c e">&ndash;</span></td>';
    var late = s.late ? ' late' : '';
    if(s.state === 'missing') return '<td><span class="lvt-c r">Missing</span></td>';
    if(s.state === 'not') return '<td><span class="lvt-c e">' + (a.required && a.due_at && Date.parse(a.due_at) + (m.extra_days || 0) * DAY < Date.now() ? 'Not done' : '&middot;') + '</span></td>';
    if(s.state === 'progress') return '<td><span class="lvt-c y' + late + '">' + s.answered + '/' + s.total + '</span></td>';
    if(s.score == null) return '<td><span class="lvt-c g' + late + '">Done</span></td>';
    var k = s.score >= 0.8 ? 'g' : s.score >= 0.6 ? 'y' : 'r';
    return '<td><span class="lvt-c ' + k + late + '">' + (a.kind === 'frq' && a.spec.points ? Math.round(s.score * a.spec.points * 10) / 10 : pct(s.score)) + '</span></td>';
  }
  function avgFor(m){ var xs = D.assign.filter(function(a){ return a.required && a.st[m.id] && (a.st[m.id].state === 'done' || a.st[m.id].state === 'missing'); }).map(function(a){ var s = a.st[m.id]; return s.state === 'missing' ? 0 : s.score; }).filter(function(v){ return v != null; });
    return xs.length ? xs.reduce(function(x, y){ return x + y; }, 0) / xs.length : null; }
  function viewGrades(){
    var c = S.rep.class, as = D.assign.filter(function(a){ return a.open; }).slice().reverse().slice(-14);
    var ms = D.members.slice().sort(function(a, b){ return GB_SORT === 'avg' ? (avgFor(b) || 0) - (avgFor(a) || 0) : a.name.localeCompare(b.name); });
    var head = '<tr><th class="nm"><button class="tm-gb-sort" data-sort="name" type="button">Student</button></th><th><button class="tm-gb-sort" data-sort="avg" type="button">Average</button><small>required only</small></th>' + as.map(function(a){ return '<th><a href="#a/' + a.id + '" style="color:inherit;text-decoration:none">' + esc(a.title) + '</a><small>' + [a.required ? '' : 'optional', a.due_at ? day(Date.parse(a.due_at)) : ''].filter(Boolean).join(' &middot; ') + '</small></th>'; }).join('') + '</tr>';
    var body = ms.map(function(m){ return '<tr><td class="nm"><a href="#s/' + m.id + '">' + esc(m.name) + '</a></td><td><b class="lvt-score" style="font-size:15px">' + pct(avgFor(m)) + '</b></td>' + as.map(function(a){ return cell(a, m); }).join('') + '</tr>'; }).join('');
    var html = band({ issue: esc(course().name) + ' &middot; ' + esc(c.name) + ' <i></i> Gradebook', m1: 'Grade', m2: 'book', hand: 'tap a name or an assignment to dig in', lede: 'Missing work counts as zero in the average; optional work never counts.', small: true,
      ctas: '<button class="btn-chan" type="button" data-csv="all">Export CSV</button>' }) +
      '<div class="hwrap">' + (as.length && ms.length ? '<div class="d5-card lvt-gb tm-up"><table><thead>' + head + '</thead><tbody>' + body + '</tbody></table></div>' +
        '<p class="d5-mut" style="margin-top:14px"><span class="lvt-c g">80%+</span> <span class="lvt-c y">60 to 79% or in progress</span> <span class="lvt-c r">under 60% or missing</span> <span class="lvt-c e late">late</span></p>'
        : '<div class="d5-card tm-empty tm-up"><p class="d5-lead">Nothing to grade yet</p><p class="d5-mut">Scores appear once students join and you assign work.</p></div>') + '<div style="height:60px"></div></div>';
    render(frame(html, c.course), 'grades');
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
  function viewSettings(){
    var c = S.rep.class;
    if(!ORDER_DRAFT) ORDER_DRAFT = { order: D.order.slice(), current: D.current };
    var o = ORDER_DRAFT, ci = o.current ? o.order.indexOf(o.current) : -1;
    var rows = o.order.map(function(u, i){
      var tag = i === ci ? '<span class="lv-tag is-req">Now</span>' : ci >= 0 && i < ci ? '<span class="lv-tag is-done">Taught</span>' : ci >= 0 && i === ci + 1 ? '<span class="lv-tag">Next</span>' : '<span class="lv-tag">Later</span>';
      return '<div class="lvt-ou' + (i === ci ? ' is-now' : '') + '"><span class="mv"><button type="button" data-up="' + i + '" aria-label="Move ' + esc(unitName(u)) + ' up"' + (i ? '' : ' disabled') + '>&#9650;</button><button type="button" data-down="' + i + '" aria-label="Move ' + esc(unitName(u)) + ' down"' + (i < o.order.length - 1 ? '' : ' disabled') + '>&#9660;</button></span>' +
        '<span><b>' + esc(unitName(u)) + ' &middot; ' + esc(unitTitle(u)) + '</b></span>' + tag + '<button class="lp-btn sm ghost" type="button" data-now="' + esc(u) + '">' + (i === ci ? 'Teaching now' : 'Set as now') + '</button></div>';
    }).join('');
    var html = band({ issue: esc(course().name) + ' &middot; ' + esc(c.name) + ' <i></i> Settings', m1: 'Class', m2: 'settings', hand: 'your order drives every student’s path', small: true }) +
      '<div class="hwrap"><div class="lvt-assign tm-up"><div class="main">' +
      '<section class="d5-card">' + q('1', 'Your', 'order') + '<p class="d5-mut" style="margin:-6px 0 14px">Put the units in the order you teach them and mark the one you’re on. Students can still study ahead on their own.</p><div class="lvt-order">' + rows + '</div>' +
      '<p class="lv-btns" style="margin-top:14px"><button class="lp-btn gold sm" type="button" data-saveorder="1">Save order</button><span class="lv-msg" id="lvtOMsg" role="status" style="margin:0"></span></p></section>' +
      '<section class="d5-card">' + q('2', 'Get', 'students in') + '<div class="d5-now" style="display:flex;align-items:center;gap:16px;flex-wrap:wrap;padding:20px 24px"><span class="lv-code" style="flex:1;color:#fff">' + esc(c.code) + '</span><button class="lp-btn gold sm" data-copy="link" type="button">Copy join link</button><button class="lp-btn sm tm-line" data-show="code" type="button">Show on screen</button></div>' +
      '<p class="lv-btns" style="margin-top:12px"><button class="lp-btn sm ghost" type="button" data-newcode="1">Make a new code</button><span class="d5-mut">The old code stops working; students already in stay.</span></p></section>' +
      '<section class="d5-card">' + q('3', 'The', 'class') + '<label class="lv-field"><span>Class name</span><input class="lv-in" id="lvtCName" maxlength="60" value="' + esc(c.name) + '"></label>' +
      '<p class="lv-btns"><button class="lp-btn sm" type="button" data-savename="1">Save</button><button class="lp-btn sm ghost" type="button" data-archive="1">' + (c.archived ? 'Unarchive' : 'Archive at year end') + '</button><button class="lp-btn sm ghost" type="button" data-delclass="1">Delete class</button></p><p class="lv-msg" id="lvtCMsg" role="status"></p></section>' +
      '</div><aside class="side"><div class="lp-card"><span class="lp-pill">Class Premium</span><h2 class="lp-h2">Everything, for <span>the whole class</span></h2><p class="lp-p">Classes work on the free plan, with its normal limits. Class Premium unlocks every lesson, question and exam for every student, at a discount for teachers.</p>' +
      '<p class="d5-mut" style="margin-top:12px">Coming soon. To get it now for your class, email <b>hello@levlprep.com</b> with your class size.</p></div>' +
      '<div class="d5-card" style="margin-top:16px"><p class="d5-lead">Your classes</p><p class="d5-mut"><a href="/teach/">All classes and a new one</a></p></div></aside></div><div style="height:60px"></div></div>';
    render(frame(html, c.course), 'settings');
  }
  function patchClass(p, msgId, okText){
    return call('teach_update_class', { p_class: CLASS_ID, p_patch: p }).then(function(r){
      var m = document.getElementById(msgId);
      if(!r){ if(m){ m.textContent = 'That did not save. Try again.'; m.className = 'lv-msg is-bad'; } return; }
      return loadClass().then(function(){ ORDER_DRAFT = null; route(); var m2 = document.getElementById(msgId); if(m2 && okText){ m2.textContent = okText; m2.className = 'lv-msg'; } });
    });
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
    else if(g('data-weak')){ e.preventDefault(); readForm(); B.topics = weakTopics(); drawAssign(); }
    else if(g('data-untopic')){ e.preventDefault(); readForm(); B.topics = B.topics.filter(function(x){ return x !== g('data-untopic'); }); drawAssign(); }
    else if(g('data-pretopic')){ B = null; var st = g('href').slice(1).split('/').pop(); B = newDraft('student/' + st); B.arg = 'student/' + st; B.topics = [g('data-pretopic')]; }
    else if(g('data-savem')){ call('teach_set_member', { p_class: CLASS_ID, p_student: g('data-savem'), p_patch: { extra_days: parseInt(document.getElementById('lvtXd').value, 10) || 0 } }).then(function(ok){ var m = document.getElementById('lvtXMsg'); m.textContent = ok ? 'Saved.' : 'That did not save.'; m.className = 'lv-msg' + (ok ? '' : ' is-bad'); if(ok) loadClass(); }); }
    else if(g('data-removem')){ if(confirm('Remove this student from the class? You stop seeing their work. They can rejoin with the code.')) call('teach_set_member', { p_class: CLASS_ID, p_student: g('data-removem'), p_patch: { remove: true } }).then(function(){ loadClass().then(function(){ location.hash = '#students'; }); }); }
    else if(g('data-up') != null || g('data-down') != null){ var i = +(g('data-up') != null ? g('data-up') : g('data-down')), j = g('data-up') != null ? i - 1 : i + 1, o = ORDER_DRAFT.order; var x = o[i]; o[i] = o[j]; o[j] = x; viewSettings(); var f = document.querySelector('[data-' + (g('data-up') != null ? 'up' : 'down') + '="' + j + '"]'); if(f) f.focus(); }
    else if(g('data-now')){ ORDER_DRAFT.current = g('data-now'); viewSettings(); }
    else if(g('data-saveorder')){ patchClass({ unit_order: ORDER_DRAFT.order, current_unit: ORDER_DRAFT.current }, 'lvtOMsg', 'Saved. Students’ paths now follow this order.'); }
    else if(g('data-newcode')){ if(confirm('Make a new code? The old one stops working.')) patchClass({ new_code: true }, 'lvtCMsg', 'New code made.'); }
    else if(g('data-savename')){ patchClass({ name: document.getElementById('lvtCName').value }, 'lvtCMsg', 'Saved.'); }
    else if(g('data-archive')){ patchClass({ archived: !S.rep.class.archived }, 'lvtCMsg', 'Saved.'); }
    else if(g('data-delclass')){ if(confirm('Delete this class for good? Its assignments go too. Students keep their own progress.')) call('teach_delete_class', { p_class: CLASS_ID }).then(function(){ location.href = '/teach/'; }); }
    else if(g('data-sort')){ GB_SORT = g('data-sort'); viewGrades(); }
  });
  document.addEventListener('change', function(e){
    var t = e.target; if(!B || !document.getElementById('lvtAssign') || !document.getElementById('lvtAssign').contains(t)) return;
    if(t.hasAttribute('data-topic')){ readForm(); var id = t.getAttribute('data-topic'); B.topics = t.checked ? B.topics.concat([id]) : B.topics.filter(function(x){ return x !== id; }); drawAssign(); }
    else if(t.hasAttribute('data-unitall')){ readForm(); var u = t.getAttribute('data-unitall'), ids = S.cur.topics.filter(function(x){ return x.unit === u && x.built !== false; }).map(function(x){ return x.id; });
      B.topics = B.topics.filter(function(x){ return ids.indexOf(x) === -1; }).concat(t.checked ? ids : []); drawAssign(); }
    else if(t.hasAttribute('data-student')){ var s = t.getAttribute('data-student'); B.students = t.checked ? B.students.concat([s]) : B.students.filter(function(x){ return x !== s; }); }
    else if(t.id === 'lvtUnit' || t.id === 'lvtFrq' || t.id === 'lvtCount' || t.id === 'lvtDue'){ readForm(); drawAssign(); }
  });
  document.addEventListener('submit', function(e){ if(e.target.id === 'lvtAssign'){ e.preventDefault(); saveAssign(); } });

  /* ------------------------------------------------------------- routing */
  function route(){
    if(!S.rep) return;
    var h = location.hash.replace(/^#/, '') || 'home', parts = h.split('/'), head = parts[0], rest = parts.slice(1).join('/');
    if(head !== 'assign') B = null;
    if(head !== 'settings') ORDER_DRAFT = null;
    if(head === 'work') viewWork();
    else if(head === 'a') viewAssignment(rest);
    else if(head === 'assign') viewAssign(rest);
    else if(head === 'students') viewStudents();
    else if(head === 's') viewStudent(rest);
    else if(head === 'grades') viewGrades();
    else if(head === 'settings') viewSettings();
    else if(head === 'topic') viewTopic(rest);
    else viewHome();
  }
  window.addEventListener('hashchange', route);

  function fail(text){ render(frame(band({ issue: 'LevlPrep <i></i> For teachers', m1: 'Not', m2: 'available', hand: text, small: true, ctas: '<a class="btn-chan" href="/teach/">Your classes</a>' }) + '<div style="height:60px"></div>')); }
  function start(){
    if(!S.user){ viewSignedOut(); return; }
    call('teach_profile').then(function(p){
      S.profile = p;
      if(!p){ viewProfile(); return; }
      if(CLASS_ID){ loadClass().then(route, function(){ fail('this class isn’t yours, or classes aren’t open yet'); }); return; }
      call('teach_my_classes').then(function(list){ S.classes = Array.isArray(list) ? list : []; viewClasses(); });
    });
  }
  function boot(){
    if(!M || !A() || !A().onAuthChange){ app.innerHTML = '<p class="lv-msg is-bad" style="padding:40px 0">This page could not load. Refresh to try again.</p>'; return; }
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
