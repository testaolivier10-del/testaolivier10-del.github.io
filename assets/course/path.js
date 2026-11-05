/* The guided study path (docs/guided-path.md), for every course.

   Loaded by assets/site-chrome.js (mountPath) on a course's home, its Path
   page, its lesson and notes pages and its textbook, with assets/course/path.css. Reads
   assets/path/<course>.json (scripts/build-paths.mjs) and the course's own
   progress; keeps its own answers in <course>_path_v1 on this device:

     { v:1, mode:'self'|'class'|'cram', anchor, covered:{id:1}, done:{id:1}, dl:'exam'|'date'|'none',
       cram:{ kind:'test'|'exam', topics:[], date }, seen, ack:{} }

   A topic counts as done when the course has it as done (lesson finished;
   ochem also notes read) or the student marked it done here. Nothing here
   locks anything: every stop links to pages that are open as they always were. */
(function(){
  'use strict';
  if(window.LevlPath) return;
  var KEY = document.body && document.body.getAttribute('data-course');
  if(!KEY) return;
  var SK = KEY + '_path_v1', D = null, T = [], U = [], BY = {}, S = null;

  /* ---------- small helpers ---------- */
  function $(s, r){ return (r || document).querySelector(s); }
  function $$(s, r){ return [].slice.call((r || document).querySelectorAll(s)); }
  function esc(s){ return String(s == null ? '' : s).replace(/[&<>"]/g, function(c){ return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function parse(k){ try{ return JSON.parse(localStorage.getItem(k) || 'null'); }catch(e){ return null; } }
  function abs(rel){ if(!rel) return ''; try{ return new URL(rel, location.origin + '/' + D.dir + '/').pathname; }catch(e){ return rel; } }
  function track(name, data){ try{ if(window.LevlAnalytics) window.LevlAnalytics.event(name, Object.assign({ course: KEY }, data || {})); }catch(e){} }
  function today(){ var d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function isoIn(n){ var d = new Date(); d.setDate(d.getDate() + n); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function daysTo(iso){ if(!iso) return null; var p = iso.split('-').map(Number), t = new Date(); t.setHours(0, 0, 0, 0); return Math.round((new Date(p[0], p[1] - 1, p[2]) - t) / 864e5); }
  function niceDate(iso){ var p = iso.split('-').map(Number); return new Date(p[0], p[1] - 1, p[2]).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }); }
  function lower(s){ return String(s); }
  function sm(icon, n){ return icon.replace(/width="\d+" height="\d+"/, 'width="' + n + '" height="' + n + '"'); }

  var ICON = {
    check: '<svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    book: '<svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5zM4 20.5A2.5 2.5 0 0 0 6.5 21H20" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linejoin="round"/></svg>',
    play: '<svg viewBox="0 0 24 24" width="30" height="30" aria-hidden="true"><path d="M8 5.5v13l10.5-6.5z" fill="currentColor"/></svg>',
    review: '<svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true"><path d="M20 12a8 8 0 1 1-2.6-5.9M20 4v4.5h-4.5" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    trophy: '<svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true"><path d="M7 4h10v4a5 5 0 0 1-10 0zM7 6H4a3 3 0 0 0 3 4M17 6h3a3 3 0 0 1-3 4M12 13v4M8 20h8" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    bolt: '<svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true"><path d="M13 2.5L4.5 14H11l-1 7.5L19.5 10H13z" fill="currentColor"/></svg>',
    arrow: '<svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true"><path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    mix: '<svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true"><path d="M4 7h4l8 10h4M4 17h4l2.5-3M14 10l2-3h4M17 4l3 3-3 3M17 14l3 3-3 3" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    cal: '<svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true"><rect x="3.5" y="5" width="17" height="15" rx="3" fill="none" stroke="currentColor" stroke-width="2.3"/><path d="M3.5 10h17M8 3v4M16 3v4" stroke="currentColor" stroke-width="2.3" stroke-linecap="round"/></svg>',
    flag: '<svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true"><path d="M5 21V4M5 4h11l-2 4 2 4H5" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    self: '<svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true"><path d="M4 19l5-5 4 4 7-8" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    cls: '<svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true"><path d="M3 9l9-5 9 5-9 5zM7 11.5V16c0 1.5 2.5 3 5 3s5-1.5 5-3v-4.5" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linejoin="round"/></svg>',
    clock: '<svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true"><circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" stroke-width="2.3"/><path d="M12 7.5V12l3 2" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round"/></svg>'
  };

  /* ---------- state ---------- */
  function blank(){ return { v: 1, mode: null, anchor: null, covered: {}, done: {}, dl: 'none', cram: { kind: 'test', topics: [], date: '' }, seen: 0, ack: {} }; }
  function load(){ var s = parse(SK); if(!s || s.v !== 1) return blank(); var b = blank(); for(var k in b) if(!(k in s)) s[k] = b[k]; if(s.anchor && !BY[s.anchor]) s.anchor = null; if(s.mode === 'class') s.mode = 'self'; return s; }
  function save(){ try{ localStorage.setItem(SK, JSON.stringify(S)); }catch(e){} }

  /* The exam date is shared with the Dashboard's countdown (assets/exam-date.js). */
  var EXAM_KEY = KEY + '_exam_date';
  function examDate(){ var v = null; try{ v = localStorage.getItem(EXAM_KEY); }catch(e){} if(/^\d{4}-\d{2}-\d{2}$/.test(v || '')) return v; if(v === null && D.exam && D.exam.date && daysTo(D.exam.date) >= 0) return D.exam.date; return null; }
  function setExamDate(v){ try{ if(v) localStorage.setItem(EXAM_KEY, v); }catch(e){} }

  /* ---------- the course's own progress ---------- */
  var PROG = null;
  function readProgress(){
    if(D.kind === 'ap' || D.kind === 'anp'){ var p = parse(D.progress) || {}; PROG = { lessons: p.lessons || {}, q: p.q || {} }; }
    else if(D.kind === 'ochem'){ PROG = { op: parse('ochem_progress') || {}, read: parse('ochem_textbook_read') || {} }; }
    else { PROG = { nl: parse('nremt_lessons_v1') || {} }; }
  }
  function courseDone(id){
    if(D.kind === 'ap' || D.kind === 'anp') return !!PROG.lessons[id];
    if(D.kind === 'ochem') return !!((PROG.op[id] && PROG.op[id].completed) || PROG.read[id]);
    // NREMT: a chapter is done once one of its interactive lessons is finished (nremt_lessons_v1).
    var t = BY[id]; return !!(t && (t.lessons || []).some(function(l){ return PROG.nl[l]; }));
  }
  function lessonDone(t){ return courseDone(t.id); }
  var ACC = null;
  function acc(id){
    if(D.kind !== 'ap' && D.kind !== 'anp') return null;
    if(!ACC){ ACC = {}; var q = PROG.q; for(var k in q){ var r = q[k]; if(!r || !r.t) continue; var a = ACC[r.t] || (ACC[r.t] = [0, 0]); a[0] += +r.right || 0; a[1] += +r.seen || 0; } }
    var x = ACC[id]; return x && x[1] >= 3 ? Math.round(100 * x[0] / x[1]) : null;
  }
  function isF(id){ return !!(S.done[id] || S.covered[id] || courseDone(id)); }
  function hasPass(){ try{ return !!(window.LevlPremium && window.LevlPremium.has(KEY)); }catch(e){ return false; } }

  /* ---------- pages for a topic ---------- */
  function practiceUrl(t){ if(!D.practice) return ''; return abs(D.practice) + (D.kind === 'nremt' ? '' : '?topic=' + encodeURIComponent(t.id)); }
  /* The Read | Interactive choice (assets/course/read-toggle.js, levl_book_mode_<dir>): a student who chose Read
     goes to the topic in the textbook, everyone else to the lesson when it is open to them, else the notes. */
  function readMode(){ var m = parse('levl_book_mode_' + D.dir); return !!(m && m.mode === 'read'); }
  function bookUrl(t){ return D.kind === 'nremt' ? abs('study-notes.html') + '#chapter-' + t.n : abs('learn.html') + '#' + encodeURIComponent(t.id); }
  function startUrl(t){ if(readMode() && (t.o || t.l)) return bookUrl(t); if(t.l && (t.f || hasPass())) return abs(t.l); return abs(t.o) || abs(t.l) || practiceUrl(t); }
  function unitLabel(u){ return u.label + (u.title ? ' · ' + u.title : ''); }
  function tName(t){ return (t.n ? t.n + ' ' : '') + t.t; }

  /* ---------- the stops ---------- */
  // The class topic's own prerequisites that are not done yet, at most 3 and in
  // course order. Only direct ones: a prerequisite's prerequisites are for the
  // student to say they covered, not for the path to stack up in front.
  function prereqs(id){
    return (BY[id].p || []).map(function(p){ return p[0]; }).filter(function(pid){ return BY[pid] && !isF(pid); })
      .slice(0, 3).sort(function(a, b){ return BY[a].i - BY[b].i; });
  }
  function reasonFor(pid){ var a = BY[S.anchor], r = null; (a.p || []).forEach(function(p){ if(p[0] === pid) r = p[1]; }); return r; }
  function topicStop(t, extra){ var s = { kind: 'topic', id: t.id, title: t.t, sub: t.n || '', state: isF(t.id) ? 'done' : 'todo' }; for(var k in extra) s[k] = extra[k]; return s; }
  function coveredSummary(){
    var whole = U.filter(function(u, ui){ var ts = T.filter(function(t){ return t.u === ui; }); return ts.length && ts.every(function(t){ return isF(t.id); }); });
    var wholeIdx = whole.map(function(u){ return U.indexOf(u); });
    var part = T.filter(function(t){ return isF(t.id) && wholeIdx.indexOf(t.u) < 0; }).length;
    var s = whole.length === 1 ? whole[0].label : whole.length ? whole.length + ' ' + (D.kind === 'ap' ? 'units' : 'chapters') : '';
    if(part) s += (s ? ' + ' : '') + part + ' topic' + (part > 1 ? 's' : '');
    return s || 'nothing yet';
  }
  // A stretch is one course unit in course order, with the skill topics woven into it (AP® skills units are spread
  // through the year, so a skill topic belongs to the course unit it sits in, never to a stretch of its own).
  function courseUnits(){
    var cus = [];
    U.forEach(function(u, ui){ if(u.label === 'Skills') return; var ts = T.filter(function(t){ return t.u === ui; }); if(ts.length) cus.push({ u: ui, a: ts[0].i, b: ts[ts.length - 1].i }); });
    cus.sort(function(x, y){ return x.a - y.a; });
    cus.forEach(function(c, k){ c.from = k ? cus[k - 1].b + 1 : 0; c.to = k < cus.length - 1 ? c.b : T.length - 1; });
    return cus;
  }
  function stretchOf(ti){ var cus = courseUnits(); for(var k = 0; k < cus.length; k++) if(ti <= cus[k].to) return { c: cus[k], next: cus[k + 1] || null }; return { c: cus[cus.length - 1], next: null }; }
  function stretchTopics(c){ return T.filter(function(t){ return t.i >= c.from && t.i <= c.to; }); }
  function stops(){
    var st = [], m = S.mode;
    if(m === 'self'){
      // The whole course in order: each course unit's topics (skills woven in), a practice set every 4 topics, a review
      // and the unit test at the end of the unit, and a full practice exam at the very end.
      var cus = courseUnits();
      cus.forEach(function(c, k){
        var ts = stretchTopics(c), cnt = 0;
        ts.forEach(function(t, j){ st.push(topicStop(t, { cu: k })); cnt++; if(cnt % 4 === 0 && j < ts.length - 1) st.push({ kind: 'mix', id: 'x:p' + c.u + '-' + cnt, title: 'Practice set', sub: 'the last few topics', state: 'todo', cu: k }); });
        if(D.review) st.push({ kind: 'review', id: 'x:r' + c.u, title: 'Review your misses', sub: U[c.u].label, state: 'todo', cu: k });
        var test = D.tests[U[c.u].id];
        if(test) st.push({ kind: 'test', id: 'x:t' + c.u, title: U[c.u].label + ' test', sub: 'checkpoint', state: 'todo', url: abs(test), cu: k });
      });
      if(D.exams) st.push({ kind: 'exam', id: 'x:exam', title: 'Full practice exam', sub: 'the last stop', state: 'todo', cu: cus.length - 1 });
      // A practice, review or test stop counts as done once marked, or once any later topic is done.
      var lastT = -1; st.forEach(function(x, i){ if(x.kind === 'topic' && x.state === 'done') lastT = i; });
      st.forEach(function(x, i){ if(x.kind !== 'topic' && (S.done[x.id] || i < lastT)) x.state = 'done'; });
    } else if(m === 'class'){
      var a = BY[S.anchor];
      if(T.some(function(t){ return isF(t.id); })) st.push({ kind: 'sum', title: 'Covered and done', sub: coveredSummary(), state: 'done' });
      prereqs(S.anchor).forEach(function(p){ st.push(topicStop(BY[p], { pre: 1, why: reasonFor(p) })); });
      st.push(topicStop(a, { cls: 1 }));
      st.push({ kind: 'review', title: 'Review mix', sub: 'while your class is on it', state: 'todo' });
      var nx = T.filter(function(t){ return t.i > a.i && !isF(t.id); }).slice(0, 3);
      nx.forEach(function(t){ st.push(topicStop(t, { state: 'faded' })); });
      var lastT = nx.length ? nx[nx.length - 1] : a, ls = stretchOf(lastT.i), restU = T.filter(function(t){ return t.i > lastT.i && t.i <= ls.c.to && !isF(t.id); }).length;
      if(restU) st.push({ kind: 'unit', title: 'Rest of ' + U[ls.c.u].label, sub: restU + ' more topic' + (restU > 1 ? 's' : ''), state: 'faded', u: ls.c.u });
      else if(ls.next) st.push({ kind: 'unit', title: U[ls.next.u].label, sub: U[ls.next.u].title, state: 'faded', u: ls.next.u });
    } else if(m === 'cram'){
      var list = S.cram.kind === 'exam'
        ? T.filter(function(t){ return !isF(t.id); }).sort(function(x, y){ var ax = acc(x.id), ay = acc(y.id); return (ax == null ? 101 : ax) - (ay == null ? 101 : ay) || x.i - y.i; }).slice(0, 6)
        : S.cram.topics.filter(function(id){ return BY[id]; }).map(function(id){ return BY[id]; }).sort(function(x, y){ var ax = acc(x.id), ay = acc(y.id); return (ax == null ? 101 : ax) - (ay == null ? 101 : ay) || x.i - y.i; });
      var k = 0;
      list.forEach(function(t){ var p = acc(t.id); st.push(topicStop(t, { sub: isF(t.id) ? 'done' : p == null ? 'not practiced yet' : p + '% right so far', cram: 1, acc: p })); k++; if(k % 3 === 0 && k < list.length) st.push({ kind: 'mix', title: 'Mixed set', sub: 'all your test topics', state: 'todo', ids: list.map(function(t){ return t.id; }) }); });
      st.push({ kind: 'mix', title: 'Timed practice', sub: 'at test speed', state: 'todo', timed: 1 });
      var dd = S.cram.kind === 'exam' ? examDate() : S.cram.date;
      st.push({ kind: 'day', title: S.cram.kind === 'exam' ? 'The ' + D.exam.label : 'Test day', sub: dd ? niceDate(dd) : 'date not set', state: 'todo' });
    }
    var now = -1;
    if(m === 'self') st.forEach(function(s, i){ if(now < 0 && s.state === 'todo') now = i; });
    st.forEach(function(s, i){ if(now < 0 && s.state === 'todo' && s.kind === 'topic') now = i; });
    if(now < 0) st.forEach(function(s, i){ if(now < 0 && s.state === 'todo') now = i; });
    if(now >= 0) st[now].state = 'now';
    st.forEach(function(s, i){ s.key = s.kind === 'topic' ? s.id : (s.id || 'k' + i); });
    return st;
  }
  function nowStop(){ var st = stops(); for(var i = 0; i < st.length; i++) if(st[i].state === 'now') return st[i]; return null; }
  function stopUrl(s){
    if(!s) return '';
    if(s.kind === 'topic') return startUrl(BY[s.id]);
    if(s.kind === 'review') return abs(D.review);
    if(s.kind === 'test') return s.url;
    if(s.kind === 'mix') return s.timed ? (abs(D.exams) || abs(D.practice)) : abs(D.practice);
    if(s.kind === 'unit'){ var cs = courseUnits().filter(function(c){ return c.u === s.u; })[0], t = T.filter(function(x){ return (cs ? x.i >= cs.from && x.i <= cs.to : x.u === s.u) && !isF(x.id); })[0]; return t ? startUrl(t) : ''; }
    if(s.kind === 'finish' || s.kind === 'exam') return abs(D.exams) || abs(D.review);
    return '';
  }

  /* ---------- pace ---------- */
  function deadline(){ if(S.mode === 'cram') return S.cram.kind === 'exam' ? examDate() : S.cram.date; if(S.dl === 'exam') return examDate(); if(S.dl === 'date') return examDate(); return null; }
  function pace(){
    var d = deadline(), days = d ? daysTo(d) : null; if(days == null || days < 0) return null;
    var left = S.mode === 'cram' ? stops().filter(function(s){ return s.kind === 'topic' && s.state !== 'done'; }).length : T.filter(function(t){ return !isF(t.id); }).length;
    var m = Math.round(left * 30 / Math.max(1, days) / 5) * 5;
    return Math.max(10, Math.min(60, m));
  }
  function modeLabel(){ return S.mode === 'self' ? 'Studying on my own' : S.mode === 'class' ? 'Alongside a class' : S.mode === 'cram' ? (S.cram.kind === 'exam' ? 'Exam review' : 'Cramming for a test') : ''; }

  /* ---------- details of one stop ---------- */
  function stepList(t, on){
    var out = [];
    if(t.o) out.push(['Read the notes', abs(t.o), 0, false]);
    if(t.l) out.push(['Interactive lesson', abs(t.l), !t.f && !hasPass(), lessonDone(t)]);
    if(D.practice) out.push(['Practice questions', practiceUrl(t), 0, false]);
    return '<ol class="lp-steps">' + out.map(function(x, i){
      return '<li class="' + (x[3] ? 'ok' : on && i === 0 ? 'on' : '') + '"><a href="' + esc(x[1]) + '"><i>' + (x[3] ? '✓' : i + 1) + '</i>' + x[0] + (x[2] ? ' <em>Premium</em>' : '') + '</a></li>';
    }).join('') + '</ol>';
  }
  /* ---------- one stop, in the side card of the Path page ---------- */
  var KINDLBL = { topic: 'Read', skill: 'Skill', mix: 'Practice', review: 'Review', test: 'Unit test', exam: 'Exam' };
  function isSkill(t){ return !!(t && U[t.u] && U[t.u].label === 'Skills'); }
  function stopKind(s){ return s.kind === 'topic' ? (isSkill(BY[s.id]) ? 'skill' : 'topic') : s.kind === 'day' || s.kind === 'finish' ? 'exam' : s.kind; }
  function stopTitle(s){ return s.kind === 'topic' ? tName(BY[s.id]) : s.title; }
  function selHTML(s){
    if(!s) return '';
    var k = s.state === 'done' ? 'Done' : s.state === 'now' ? 'Up next' : KINDLBL[stopKind(s)] || '', acts = '', note = '';
    if(s.kind === 'topic'){
      var t = BY[s.id];
      if(s.state === 'done') acts = '<a class="lp-btn gold" href="' + esc(startUrl(t)) + '">Open again</a><div class="lnk"><button type="button" class="lp-link" data-act="undone" data-id="' + esc(t.id) + '">Not done after all</button></div>';
      else acts = '<a class="lp-btn gold" href="' + esc(startUrl(t)) + '">' + (s.state === 'now' ? 'Start' : 'Jump here') + '</a><div class="lnk">' +
        (D.practice ? '<button type="button" class="lp-link" data-act="check" data-id="' + esc(t.id) + '">Already know it?</button>' : '') +
        '<button type="button" class="lp-link" data-act="markdone" data-id="' + esc(t.id) + '">Mark done</button></div>';
      if(t.l && !t.f && !hasPass() && s.state !== 'done') note = 'Notes and practice are free. The interactive lesson is Premium.';
      if(s.cram) note = s.acc == null ? 'Not practiced here yet.' : 'About ' + s.acc + '% right so far.';
    } else {
      var url = stopUrl(s), lbl = s.kind === 'mix' ? (s.timed ? 'Open exams' : 'Start practice') : s.kind === 'review' ? 'Start review' : s.kind === 'test' ? 'Take the test' : s.kind === 'exam' ? 'Open exams' : '';
      if(url && lbl) acts = '<a class="lp-btn gold" href="' + esc(url) + '">' + lbl + '</a>';
      if(s.id && s.state !== 'done' && s.kind !== 'day') acts += '<div class="lnk"><button type="button" class="lp-link" data-act="markdone" data-id="' + esc(s.id) + '">Mark done</button></div>';
      if(s.kind === 'day') acts = '<div class="lnk"><button type="button" class="lp-link" data-act="setup">Change the date</button></div>';
      if(s.kind === 'finish') acts = '<button type="button" class="lp-btn gold" data-act="toexam">Switch to exam review</button>';
    }
    return '<p class="lp-k">' + esc(k) + '</p><h3>' + esc(stopTitle(s)) + '</h3>' + (note ? '<p class="free">' + note + '</p>' : '') + '<div class="act">' + acts + '</div>';
  }

  /* ---------- the stops, in groups (one per course unit, or one for cramming) ---------- */
  function groups(){
    var st = stops(), out = [];
    if(S.mode === 'cram'){ out.push({ k: S.cram.kind === 'exam' ? 'Exam review' : 'Your test', t: S.cram.kind === 'exam' ? 'Weakest topics first' : 'The topics on your test', stops: st }); }
    else {
      var by = {};
      st.forEach(function(s){ var g = s.cu || 0; if(!by[g]){ by[g] = { cu: g, stops: [] }; out.push(by[g]); } by[g].stops.push(s); });
      var cus = courseUnits();
      out.forEach(function(g){ var u = U[cus[g.cu].u], ts = g.stops.filter(function(s){ return s.kind === 'topic'; }), dn = ts.filter(function(s){ return s.state === 'done'; }).length;
        g.k = u.label + (u.w ? ' · ' + u.w + ' of the exam' : ''); g.t = u.title || u.label; g.c = dn ? dn + ' of ' + ts.length + ' done' : ts.length + ' topic' + (ts.length > 1 ? 's' : ''); g.short = u.label === 'Skills' ? 'Skills' : u.label; });
    }
    var gi = 0; out.forEach(function(g, k){ g.id = 'lpu-' + k; g.stops.forEach(function(s){ s.gi = gi++; }); });
    return out;
  }
  function stopFace(s){
    if(s.state === 'done') return ICON.check;
    if(s.state === 'now') return ICON.play;
    var k = stopKind(s);
    if(k === 'topic'){ var t = BY[s.id]; return t.n ? '<span class="num">' + esc(t.n) + '</span>' : ICON.book; }
    if(k === 'skill') return '<span class="num">S</span>';
    return k === 'mix' ? ICON.bolt : k === 'review' ? ICON.review : k === 'test' ? ICON.flag : ICON.trophy;
  }

  /* ---------- drawing the whole path ---------- */
  var SEL = null;
  function drawTrack(host){
    var gs = groups(), all = [], W = host.clientWidth || 640, wide = W >= 560, gap = wide ? 104 : 96, top = 64, html = '';
    var nowG = -1; gs.forEach(function(g){ g.stops.forEach(function(s){ all.push(s); if(s.state === 'now' && nowG < 0) nowG = s.gi; }); });
    if(SEL == null || !all.some(function(s){ return s.key === SEL; })) SEL = (all[nowG] || all[all.length - 1] || {}).key;
    var amp = Math.min(170, W * 0.26), g0 = 0;
    gs.forEach(function(g, k){
      var n = g.stops.length, H = top + (n - 1) * gap + 70, pts = g.stops.map(function(s, i){
        var j = g0 + i; return wide ? [Math.round(W / 2 + amp * Math.sin(j * 0.78)), top + i * gap] : [Math.round(52 + 22 * Math.sin(j * 0.9)), top + i * gap]; });
      g0 += n;
      var d = function(a, b, lead, tail){ var s = ''; for(var i = a; i <= b; i++){ var p = pts[i]; if(i === a) s += lead ? 'M' + p[0] + ' 0 L' + p[0] + ' ' + p[1] : 'M' + p[0] + ' ' + p[1]; else { var q = pts[i - 1], m = (q[1] + p[1]) / 2; s += ' C' + q[0] + ' ' + m + ' ' + p[0] + ' ' + m + ' ' + p[0] + ' ' + p[1]; } } if(tail) s += ' L' + pts[b][0] + ' ' + H; return s; };
      var first = g.stops[0].gi, last = g.stops[n - 1].gi, reach = nowG < 0 ? n - 1 : nowG > last ? n - 1 : nowG >= first ? nowG - first : -1;
      var svg = '<svg width="' + W + '" height="' + H + '" viewBox="0 0 ' + W + ' ' + H + '" aria-hidden="true"><path class="ln todo" d="' + d(0, n - 1, k > 0, k < gs.length - 1) + '"/>' +
        (reach >= 0 ? '<path class="ln done" d="' + d(0, reach, k > 0, reach === n - 1 && k < gs.length - 1 && nowG > last) + '"/>' : '') + '</svg>';
      var nodes = g.stops.map(function(s, i){
        var p = pts[i], kd = stopKind(s), right = wide && p[0] >= W / 2, off = s.state === 'now' ? 58 : 44;
        var lab = wide ? (right ? 'right:' + (W - p[0] + off) + 'px;text-align:right' : 'left:' + (p[0] + off) + 'px') : 'left:' + (p[0] + off) + 'px;right:0';
        return '<button type="button" class="lp-s ' + kd + ' ' + s.state + (s.key === SEL ? ' sel' : '') + '" id="lps-' + s.gi + '" data-stop="' + esc(s.key) + '" style="left:' + p[0] + 'px;top:' + p[1] + 'px" aria-pressed="' + (s.key === SEL) + '" aria-label="' + esc(stopTitle(s)) + '"><span class="dot">' + stopFace(s) + '</span></button>' +
          '<p class="lp-sl ' + s.state + '" style="top:' + p[1] + 'px;' + lab + '"><small>' + esc(s.state === 'now' ? 'Up next · ' + KINDLBL[kd] : s.state === 'done' ? KINDLBL[kd] + ' · done' : KINDLBL[kd]) + '</small>' + esc(stopTitle(s)) + '</p>';
      }).join('');
      html += '<section class="lp-g" id="' + g.id + '"><div class="lp-gb' + (nowG >= first && nowG <= last ? ' cur' : '') + '"><div><small>' + esc(g.k) + '</small><b>' + esc(g.t) + '</b></div>' + (g.c ? '<span>' + esc(g.c) + '</span>' : '') + '</div>' +
        '<div class="lp-tr" style="height:' + H + 'px">' + svg + nodes + '</div></section>';
    });
    host.innerHTML = html;
    return { gs: gs, all: all };
  }
  function mapHTML(gs){
    var tot = 0, dn = 0;
    var rows = gs.map(function(g){
      var tn = 0, chips = g.stops.filter(function(s){ return s.kind === 'topic' || s.kind === 'test' || s.kind === 'exam' || s.kind === 'day'; }).map(function(s){
        if(s.kind === 'topic'){ tot++; tn++; if(s.state === 'done') dn++; }
        var kd = stopKind(s), t = s.kind === 'topic' ? BY[s.id] : null;
        return '<button type="button" class="c ' + kd + ' ' + s.state + (s.key === SEL ? ' sel' : '') + '" data-go="' + esc(s.key) + '" title="' + esc(stopTitle(s)) + '" aria-label="' + esc(stopTitle(s)) + '">' + (t ? esc(t.n || (kd === 'skill' ? 'S' : String(tn))) : '★') + '</button>';
      }).join('');
      return '<div class="u"><a href="#' + g.id + '">' + esc(g.short ? g.short + ' · ' + g.t : g.k) + '</a><div class="cs">' + chips + '</div></div>';
    }).join('');
    return '<div class="hd"><b>' + (S.mode === 'cram' ? 'Your list' : 'Course') + '</b><span>' + dn + ' / ' + tot + '</span></div>' + rows;
  }

  /* ---------- the Path page ---------- */
  function metaHTML(){
    var dd = deadline(), n = dd ? daysTo(dd) : null, bits = [];
    bits.push(S.mode === 'cram' ? modeLabel() : 'On my own');
    if(dd && n != null && n >= 0) bits.push(S.mode === 'cram' ? (n === 0 ? 'Today' : n === 1 ? 'Tomorrow' : 'In ' + n + ' days') : 'Exam ' + new Date(dd + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
    var p = pace(); if(p) bits.push('about ' + p + ' min a day');
    return esc(bits.join(' · ')) + ' · <button type="button" class="lp-link" data-act="setup">Change</button>';
  }
  function bannersHTML(){
    var b = '', ex = examDate(), n = ex ? daysTo(ex) : null;
    if(n != null && n > 0 && n <= 49 && S.mode !== 'cram' && !S.ack.exam)
      b += '<div class="lp-banner cool"><div class="tx"><b>The ' + esc(D.exam.label) + ' is about ' + Math.max(1, Math.round(n / 7)) + ' week' + (n > 10 ? 's' : '') + ' away.</b><p>Switch to exam review? Weakest topics first. Everything you did stays done.</p></div><div class="lp-row"><button type="button" class="lp-btn sm" data-act="toexam">Switch</button><button type="button" class="lp-link" data-act="ackexam">Not yet</button></div></div>';
    if(BEHIND && pace())
      b += '<div class="lp-banner warm"><div class="tx"><b>You missed a few days. That is fine.</b><p>New pace: about ' + pace() + ' minutes a day.</p></div><div class="lp-row"><button type="button" class="lp-btn sm" data-act="okbehind">Okay</button><button type="button" class="lp-link" data-act="setup">Change the date</button></div></div>';
    return b;
  }
  var DRAWN = null;
  function selStop(){ if(!DRAWN) return null; for(var i = 0; i < DRAWN.all.length; i++) if(DRAWN.all[i].key === SEL) return DRAWN.all[i]; return null; }
  function renderPath(){
    var host = $('#levlPath'); if(!host) return;
    var made = !!S.mode; if(!made) S.mode = 'self';
    host.innerHTML = '<div class="lp-lay"><aside class="lp-side"><div class="lp-head"><span class="lp-pill">' + esc(D.name) + '</span><h1>Your <span>path</span></h1>' +
      (made ? '<p class="lp-meta2">' + metaHTML() + '</p>' : '') + '</div>' + (made ? bannersHTML() : '') +
      (made ? '' : '<div class="lp-card lp-make"><h3>Create your <span>personalized path</span></h3><p>Three quick questions and it starts in the right place.</p><button type="button" class="lp-btn gold" data-act="setup">Create my path</button></div>') +
      '<div class="lp-card lp-selc" id="lpSel" aria-live="polite"></div><div class="lp-card lp-map" id="lpMap"></div></aside>' +
      '<div class="lp-trw"><div id="lpTrack"></div><p class="lp-hand lp-tnote">jump anywhere, everything you finish stays done</p></div></div>' +
      '<p class="lp-note">Finishing a lesson or marking a stop done moves the path; practice answers do not. Your path’s answers are saved on this device; what you finish counts everywhere you are logged in.</p>';
    DRAWN = drawTrack($('#lpTrack'));
    $('#lpSel').innerHTML = selHTML(selStop());
    $('#lpMap').innerHTML = mapHTML(DRAWN.gs);
    if(!made) S.mode = null;
  }
  function select(key, scroll){
    SEL = key;
    $$('#lpTrack .lp-s').forEach(function(b){ var on = b.getAttribute('data-stop') === key; b.classList.toggle('sel', on); b.setAttribute('aria-pressed', on); });
    $$('#lpMap .c').forEach(function(b){ b.classList.toggle('sel', b.getAttribute('data-go') === key); });
    var made = !!S.mode; if(!made) S.mode = 'self';
    $('#lpSel').innerHTML = selHTML(selStop());
    if(!made) S.mode = null;
    if(scroll){ var b = $('#lpTrack [data-stop="' + key.replace(/"/g, '') + '"]'); if(b) b.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
  }

  /* ---------- the course home card ---------- */
  function miniHTML(list, ni){
    var X = [6, 22, 40, 58, 75, 92], Y = [150, 80, 125, 70, 140, 85], P = list.map(function(s, i){ return [X[i] * 10, Y[i]]; });
    var d = function(a, b){ var s = ''; for(var i = a; i <= b; i++){ var p = P[i]; if(i === a) s += 'M' + p[0] + ' ' + p[1]; else { var q = P[i - 1], m = (q[0] + p[0]) / 2; s += ' C' + m + ' ' + q[1] + ' ' + m + ' ' + p[1] + ' ' + p[0] + ' ' + p[1]; } } return s; };
    var svg = '<svg viewBox="0 0 1000 220" preserveAspectRatio="none" aria-hidden="true">' + (list.length > 1 ? '<path class="ln todo" d="' + d(Math.max(0, ni), list.length - 1) + '"/>' : '') + (ni > 0 ? '<path class="ln done" d="' + d(0, ni) + '"/>' : '') + '</svg>';
    return '<div class="lp-strip"><div class="in">' + svg + list.map(function(s, i){
      var kd = stopKind(s);
      return '<a class="lp-ms ' + kd + ' ' + s.state + '" href="' + esc(stopUrl(s) || abs('path.html')) + '" style="left:' + X[i] + '%;top:' + Y[i] + 'px" aria-label="' + esc(stopTitle(s)) + '"><span class="dot">' + stopFace(s) + '</span></a><p class="lp-ml ' + s.state + '" style="left:' + X[i] + '%;top:' + (Y[i] + (s.state === 'now' ? 46 : 32)) + 'px">' + esc(stopTitle(s)) + '</p>';
    }).join('') + '</div></div>';
  }
  function renderHome(){
    var main = $('main.r3-home'), lead = main && $('.lead', main); if(!lead) return;
    var slot = $('#lpSlot');
    if(!slot){ slot = document.createElement('div'); slot.id = 'lpSlot'; slot.className = 'lp-slot'; lead.parentNode.insertBefore(slot, lead); }
    var pathHref = abs('path.html');
    if(!S.mode){
      slot.innerHTML = '<div class="lp-card lp-hnew"><div class="tx"><span class="lp-pill">Your path</span><h2 class="lp-h2">Create your <span>personalized path</span></h2><p class="lp-p">Three quick questions, then a path through all of ' + esc(D.name) + ', in course order.</p>' +
        '<ol class="lp-qs"><li>How you’re studying</li><li>What you already know</li><li>When your exam is</li></ol>' +
        '<div class="lp-row"><button type="button" class="lp-btn gold" data-act="setup">Create my path</button><a class="lp-btn ghost" href="' + esc(pathHref) + '">Open full path</a></div></div></div>';
      return;
    }
    var st = stops(), ni = -1; st.forEach(function(s, i){ if(ni < 0 && s.state === 'now') ni = i; });
    if(ni < 0) ni = st.length - 1;
    var n = st[ni], from = Math.max(0, ni - 2), mini = st.slice(from, from + 6), url = stopUrl(n);
    var cus = S.mode === 'cram' ? null : courseUnits(), u = cus && n.cu != null ? U[cus[n.cu].u] : null;
    var inU = u ? st.filter(function(s){ return s.cu === n.cu && s.kind === 'topic'; }) : [], dU = inU.filter(function(s){ return s.state === 'done'; }).length;
    slot.innerHTML = '<div class="lp-card lp-hcard"><div class="hd"><div><p class="lp-k">Your path · ' + esc(u ? unitLabel(u) : modeLabel()) + '</p><h2 class="lp-h2">Up next: <span>' + esc(stopTitle(n)) + '</span></h2></div>' +
      '<div class="lp-row">' + (url ? '<a class="lp-btn gold" href="' + esc(url) + '">Continue</a>' : '') + '<a class="lp-btn ghost" href="' + esc(pathHref) + '">Open full path</a></div></div>' +
      miniHTML(mini, ni - from) +
      '<div class="ft"><p class="lp-hand">jump anywhere, everything you finish stays done</p>' + (u ? '<span>' + dU + ' of ' + inU.length + ' in ' + esc(u.label) + '</span>' : '') + '</div></div>';
    [$('#heroPrimaryCta'), $('.sticky-cta a')].forEach(function(a){ if(a && url){ a.textContent = 'Continue your path'; a.setAttribute('href', url); a.classList.remove('cta-pending'); } });
  }

  /* ---------- the end of a lesson or notes page ---------- */
  function pageTopic(){
    var dt = document.body.getAttribute('data-topic');
    if(dt && BY[dt]) return BY[dt];
    if(dt && D.kind === 'nremt'){ var m = /^ch(\d+)-/.exec(dt); if(m && BY['ch' + m[1]]) return BY['ch' + m[1]]; }
    var path = location.pathname.replace(/\/index\.html$/, '/');
    for(var i = 0; i < T.length; i++){ var t = T[i]; if((t.l && abs(t.l) === path) || (t.o && abs(t.o) === path)) return t; }
    return null;
  }
  function endAnchor(){
    var a = $('.cx-ls-end') || $('.lesson-links-row') || $('.tb-chapter-nav');
    if(a) return { el: a, before: true };
    var m = $('main'); return m ? { el: m, before: false } : null;
  }
  function renderEnd(){
    var t = PAGE_T; if(!t || !S.mode) return;
    var box = $('#lpEnd');
    if(!box){ var at = endAnchor(); if(!at) return; box = document.createElement('section'); box.id = 'lpEnd'; box.className = 'lp-endcard'; box.setAttribute('aria-label', 'Your path'); if(at.before) at.el.parentNode.insertBefore(box, at.el); else at.el.appendChild(box); }
    var st = stops(), here = -1; st.forEach(function(s, i){ if(s.kind === 'topic' && s.id === t.id) here = i; });
    var n = nowStop(), inner;
    if(here >= 0 && (st[here].state === 'now' || st[here].state === 'todo') && !isF(t.id)){
      inner = '<div class="tx"><p class="lp-k">On your path · this stop</p><h3>' + esc(tName(t)) + '</h3><p>' + (lessonDone(t) || !t.l ? 'Done with the notes and some practice? Mark it and the path moves on.' : 'Finishing the interactive lesson moves the path on by itself. Using the notes and practice instead? Mark it done when you are ready.') + '</p></div>' + stepList(t, false) +
        '<div class="act"><button type="button" class="lp-btn gold" data-act="markdone" data-id="' + esc(t.id) + '">Mark done</button><a class="lp-link" href="' + esc(abs('path.html')) + '">Back to your path</a></div>';
    } else if(isF(t.id) && (here >= 0 || S.mode !== 'class' || t.id === S.anchor)){
      if(S.mode === 'class' && t.id === S.anchor && S.ack.anchor !== t.id){
        inner = '<div class="tx"><p class="lp-k">Your class topic is done</p><h3>What is your class on now?</h3><p>The path does not guess what your teacher does next. Tell it, and it lines up what you need.</p></div><span></span><div class="act"><button type="button" class="lp-btn gold" data-act="picker">Something new</button><button type="button" class="lp-link" data-act="still">Still on ' + esc(lower(t.t)) + '</button></div>';
      } else {
        inner = '<div class="tx"><p class="lp-k">Done · next on your path</p><h3>' + esc(n ? (n.kind === 'topic' ? tName(BY[n.id]) : n.title) : 'Path complete') + '</h3><p>' + (n && n.cls ? 'Your class topic.' : n && n.pre ? 'Needed before your class topic.' : 'Pick up right where the path goes next.') + '</p></div><span></span><div class="act">' + (n && stopUrl(n) ? '<a class="lp-btn gold" href="' + esc(stopUrl(n)) + '">Continue</a>' : '') + '<a class="lp-link" href="' + esc(abs('path.html')) + '">Back to your path</a></div>';
      }
    } else if(S.mode === 'class' && !S.ack['off:' + t.id]){
      inner = '<div class="tx"><p class="lp-k">Not on your path right now</p><h3>Is your class on ' + esc(lower(t.t)) + ' now?</h3><p>Say yes and the path re-centers here. Everything you have done stays done.</p></div><span></span><div class="act"><button type="button" class="lp-btn gold" data-act="anchor" data-id="' + esc(t.id) + '">Yes, my class is on this</button><button type="button" class="lp-link" data-act="offno" data-id="' + esc(t.id) + '">No, just looking</button></div>';
    } else if(S.mode === 'cram' && S.cram.kind === 'test' && here < 0){
      inner = '<div class="tx"><p class="lp-k">Not on your test list</p><h3>Is ' + esc(lower(t.t)) + ' on your test?</h3></div><span></span><div class="act"><button type="button" class="lp-btn gold" data-act="togglecram" data-id="' + esc(t.id) + '">Add it to my test</button><a class="lp-link" href="' + esc(abs('path.html')) + '">Back to your path</a></div>';
    } else {
      inner = '<div class="tx"><p class="lp-k">Your path</p><h3>Up next: ' + esc(n ? (n.kind === 'topic' ? BY[n.id].t : n.title) : 'nothing left') + '</h3></div><span></span><div class="act">' + (n && stopUrl(n) ? '<a class="lp-btn gold" href="' + esc(stopUrl(n)) + '">Continue your path</a>' : '') + '<a class="lp-link" href="' + esc(abs('path.html')) + '">Open your path</a></div>';
    }
    box.innerHTML = '<div class="lp-det">' + inner + '</div>';
  }

  /* ---------- the end of each section of the textbook ----------
     The textbook (learn.html, NREMT study-notes.html) is many topics on one page, each a section.bk-sec[id]. Each
     topic gets the same card as a lesson or notes page, small: Mark done while it is a stop to do, Done and what is
     next once it is done. NREMT's topics are chapters, so the card goes after the chapter's last section. It sits
     in the section's .rt-end strip (read-toggle.js: Previous topic / Next topic) when there is one. */
  function bookTopic(id){ if(BY[id]) return BY[id]; if(D.kind === 'nremt'){ var m = /^ch(\d+)-/.exec(id); if(m && BY['ch' + m[1]]) return BY['ch' + m[1]]; } return null; }
  function secCard(t){
    var st = stops(), here = -1, n = nowStop(); st.forEach(function(s, i){ if(s.kind === 'topic' && s.id === t.id) here = i; });
    if(isF(t.id)){
      var nx = n && n.kind === 'topic' && n.id === t.id ? null : n;
      return '<div class="tx"><p class="lp-k">' + sm(ICON.check, 14) + ' Done</p>' + (nx ? '<p>Up next on your path: <b>' + esc(nx.kind === 'topic' ? tName(BY[nx.id]) : nx.title) + '</b></p>' : '') + '</div>' +
        '<div class="act">' + (nx && stopUrl(nx) ? '<a class="lp-btn sm gold" href="' + esc(stopUrl(nx)) + '">Continue</a>' : '') + '</div>';
    }
    if(S.mode === 'cram' && here < 0) return '';
    return '<div class="tx"><p class="lp-k">' + (here >= 0 && st[here].state === 'now' ? 'On your path · up next' : 'On your path') + '</p><p>' + (t.l && !lessonDone(t) ? 'Read it here, or finish the interactive lesson. ' : '') + 'Mark it done when you are ready.</p></div>' +
      '<div class="act"><button type="button" class="lp-btn sm gold" data-act="markdone" data-id="' + esc(t.id) + '">Mark done</button><a class="lp-link" href="' + esc(abs('path.html')) + '">Your path</a></div>';
  }
  function renderBook(){
    if(!BOOK || !S.mode) return;
    // The cards go in above the section being read too: it stays where it is on the screen.
    var anc = $$('main.tb-main section.bk-sec[id]').filter(function(x){ return !x.hidden && x.getBoundingClientRect().bottom > 90; })[0], ay = anc && anc.getBoundingClientRect().top;
    bookCards();
    if(anc){ var d = anc.getBoundingClientRect().top - ay; if(Math.abs(d) > 1) window.scrollBy(0, d); }
  }
  function bookCards(){
    var secs = $$('main.tb-main section.bk-sec[id]'), last = {};
    secs.forEach(function(sec){ var t = bookTopic(sec.id); if(t) last[t.id] = sec; });
    secs.forEach(function(sec){
      var t = bookTopic(sec.id), box = $(':scope > .lp-secend, :scope > .rt-end > .lp-secend', sec);
      if(!t || last[t.id] !== sec){ if(box) box.remove(); return; }
      var html = secCard(t), key = t.id + '|' + html.length + '|' + html.slice(0, 80) + html.slice(-120);
      if(!html){ if(box) box.remove(); return; }
      if(!box){
        box = document.createElement('div'); box.className = 'lp-secend'; box.setAttribute('role', 'group'); box.setAttribute('aria-label', 'Your path: ' + tName(t));
        var strip = $(':scope > .rt-end', sec), mark = $(':scope > .tb-section-end', sec);
        if(strip) strip.insertBefore(box, strip.firstChild); else if(mark) sec.insertBefore(box, mark); else sec.appendChild(box);
      }
      if(box.getAttribute('data-k') !== key){ box.setAttribute('data-k', key); box.innerHTML = html; }
    });
  }

  /* ---------- dialogs ---------- */
  var ov, mod, tst, onPick = null;
  function ensureUi(){
    if(ov) return;
    ov = document.createElement('div'); ov.className = 'lp-ov'; ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-modal', 'true'); ov.setAttribute('aria-label', 'Your path');
    mod = document.createElement('div'); mod.className = 'lp-mod'; ov.appendChild(mod); document.body.appendChild(ov);
    tst = document.createElement('div'); tst.className = 'lp-toast'; tst.setAttribute('role', 'status'); tst.hidden = true; document.body.appendChild(tst);
    ov.addEventListener('click', function(e){ if(e.target === ov){ closeM(); return; } var b = e.target.closest('[data-pick]'); if(b && onPick) onPick(b.getAttribute('data-pick')); });
    document.addEventListener('keydown', function(e){ if(e.key === 'Escape' && ov.classList.contains('open')) closeM(); });
  }
  var lastFocus = null;
  function openM(html){ ensureUi(); onPick = null; lastFocus = document.activeElement; mod.innerHTML = html; ov.classList.add('open'); var f = $('.lp-opt,[data-dl],[data-ck],input,.lp-btn', mod) || $('button', mod); if(f) f.focus({ preventScroll: true }); }
  function closeM(){ if(!ov) return; ov.classList.remove('open'); if(lastFocus && lastFocus.focus) try{ lastFocus.focus(); }catch(e){} }
  function toast(m){ ensureUi(); tst.textContent = m; tst.hidden = false; clearTimeout(toast.t); toast.t = setTimeout(function(){ tst.hidden = true; }, 2800); }

  function searchHits(q){
    q = (q || '').toLowerCase().trim(); if(!q) return null;
    var hit = {}; T.forEach(function(t){ if(t.t.toLowerCase().indexOf(q) >= 0 || t.n === q || (t.s || []).some(function(w){ return w.indexOf(q) >= 0 || (q.length > 3 && q.indexOf(w) >= 0); })) hit[t.id] = 1; });
    return hit;
  }
  function listHTML(q, sel, multi){
    var hit = searchHits(q), out = '';
    U.forEach(function(u, ui){
      var ts = T.filter(function(t){ return t.u === ui && (!hit || hit[t.id]); }); if(!ts.length) return;
      out += '<p class="u">' + esc(unitLabel(u)) + '</p>' + ts.map(function(t){
        var on = multi ? sel.indexOf(t.id) >= 0 : t.id === sel;
        return '<button type="button" ' + (multi ? 'data-mt' : 'data-pick') + '="' + esc(t.id) + '" aria-pressed="' + on + '"><span>' + esc(t.t) + '</span><small>' + esc(t.n) + '</small></button>';
      }).join('');
    });
    return out || '<p class="u">No match. Try another word, or clear the search and browse.</p>';
  }
  function pickerHTML(sel){
    return (sel ? '<div class="lp-picked">' + sm(ICON.flag, 20) + esc(BY[sel].t) + ' <span style="font-weight:700;color:var(--muted)">· ' + esc(U[BY[sel].u].label) + '</span></div>' : '') +
      '<input class="lp-in" type="search" id="lpFind" placeholder="Search a topic or a word from class" aria-label="Search a topic" autocomplete="off"><div class="lp-list" id="lpFound">' + listHTML('', sel, false) + '</div><p class="lp-sub">Can’t find it? Pick the closest topic. You can change it any time.</p>';
  }
  function bindFind(sel, multi){ var f = $('#lpFind', mod); if(f) f.addEventListener('input', function(){ $('#lpFound', mod).innerHTML = listHTML(f.value, sel, multi); bindMulti(); }); }

  /* Setup */
  var SU;
  function openSetup(){ SU = { how: S.mode, start: 'begin', known: {}, anchor: S.anchor, covered: {}, dl: examDate() ? (D.exam.date && examDate() === D.exam.date ? 'exam' : 'date') : (D.exam.date ? 'exam' : 'none'), date: examDate() || '', ckind: S.cram.kind || 'test', ctopics: S.cram.topics.slice(), cdate: S.cram.date || isoIn(7), i: 0 }; stepSetup(); }
  function suSteps(){
    if(SU.how === 'self') return ['how', 'start'].concat(SU.start === 'some' ? ['known'] : []).concat(['deadline']);
    if(SU.how === 'class') return ['how', 'on', 'covered', 'deadline'];
    if(SU.how === 'cram') return ['how', 'what'].concat(SU.ckind === 'test' ? ['topics', 'when'] : D.exam.date ? [] : ['when']);
    return ['how'];
  }
  function covHTML(map, anchor){
    return '<div class="lp-cov">' + U.map(function(u, ui){
      var ts = T.filter(function(t){ return t.u === ui && t.id !== anchor; }); if(!ts.length) return '';
      var all = ts.every(function(t){ return map[t.id]; }), some = ts.some(function(t){ return map[t.id]; }), open = (some && !all) || (anchor && BY[anchor].u === ui);
      return '<div><label><input type="checkbox" data-unit="' + ui + '"' + (all ? ' checked' : '') + '>' + esc(unitLabel(u)) + '</label>' +
        (open ? '<div class="sub2">' + ts.map(function(t){ return '<label><input type="checkbox" data-tp="' + esc(t.id) + '"' + (map[t.id] ? ' checked' : '') + '>' + esc(tName(t)) + '</label>'; }).join('') + '</div>'
          : '<button type="button" class="lp-link" style="margin:4px 0 4px 30px;font-size:13px" data-openu="' + ui + '">pick topics</button>') + '</div>';
    }).join('') + '</div>';
  }
  function stepSetup(){
    var steps = suSteps(), id = steps[SU.i], last = SU.how && SU.i === steps.length - 1, body = '', canNext = true;
    if(id === 'how'){
      body = '<p class="lp-q">How are you studying?</p><div class="lp-opts">' + [['self', 'On my own', 'Learn it start to finish, in course order.', ICON.self], ['cram', 'Cramming for a test', 'I have a date coming up and not much time.', ICON.clock]].map(function(o){
        return '<button type="button" class="lp-opt" data-how="' + o[0] + '" aria-pressed="' + (SU.how === o[0]) + '"><span class="ic">' + o[3] + '</span><span><b>' + o[1] + '</b><small>' + o[2] + '</small></span></button>'; }).join('') + '</div>';
      canNext = !!SU.how;
    }
    if(id === 'start') body = '<p class="lp-q">Where do you want to start?</p><div class="lp-opts">' + [['begin', 'From the beginning', 'The first topic of the course.'], ['some', 'I know some of it already', 'Tick what you know and the path skips it.']].map(function(o){
      return '<button type="button" class="lp-opt" data-start="' + o[0] + '" aria-pressed="' + (SU.start === o[0]) + '"><span><b>' + o[1] + '</b><small>' + o[2] + '</small></span></button>'; }).join('') + '</div>';
    if(id === 'known') body = '<p class="lp-q">What do you already know?</p><p class="lp-sub">Tick whole ' + (D.kind === 'ap' ? 'units' : 'chapters') + ', or open one to pick topics. Not sure? Leave it. A quick check on the path can skip it later.</p>' + covHTML(SU.known, null);
    if(id === 'on'){ body = '<p class="lp-q">What is your class on right now?</p>' + pickerHTML(SU.anchor); canNext = !!SU.anchor; }
    if(id === 'covered'){
      var a = BY[SU.anchor];
      var as = stretchOf(a.i).c; if(!SU.pre){ SU.pre = 1; T.forEach(function(t){ if(t.i < as.from) SU.covered[t.id] = 1; }); }
      body = '<p class="lp-q">What has your class already covered?</p><p class="lp-sub">We guessed everything before ' + esc(lower(U[as.u].label)) + '. Fix anything that is wrong. Classes go in all kinds of orders, and that is fine.</p>' + covHTML(SU.covered, a.id);
    }
    if(id === 'deadline'){
      var opts = D.exam.date ? [['exam', 'The ' + D.exam.label + ' (' + niceDate(D.exam.date) + ')'], ['date', 'A different date'], ['none', 'No deadline']] : [['date', 'Pick a date'], ['none', 'No deadline']];
      body = '<p class="lp-q">Is there a deadline?</p><div class="lp-ch">' + opts.map(function(o){ return '<button type="button" data-dl="' + o[0] + '" aria-pressed="' + (SU.dl === o[0]) + '">' + esc(o[1]) + '</button>'; }).join('') + '</div>' +
        (SU.dl === 'date' ? '<label class="lp-sub" for="lpDate">Your ' + esc(D.exam.label) + ' date</label><input class="lp-in" type="date" id="lpDate" value="' + esc(SU.date || isoIn(60)) + '">' : '') +
        '<p class="lp-sub">This only sets a daily pace. Nothing locks.</p>';
    }
    if(id === 'what') body = '<p class="lp-q">What is the test?</p><div class="lp-opts">' + [['test', 'A class test', 'A unit test or quiz on a few topics.'], ['exam', 'The ' + D.exam.label, 'The whole course, weakest topics first.']].map(function(o){
      return '<button type="button" class="lp-opt" data-ck="' + o[0] + '" aria-pressed="' + (SU.ckind === o[0]) + '"><span><b>' + esc(o[1]) + '</b><small>' + o[2] + '</small></span></button>'; }).join('') + '</div>';
    if(id === 'topics'){ body = '<p class="lp-q">Which topics are on it?</p><p class="lp-sub">Pick as many as you need. A review sheet from your teacher helps here.</p><input class="lp-in" type="search" id="lpFind" placeholder="Search a topic" aria-label="Search a topic" autocomplete="off"><div class="lp-list" id="lpFound">' + listHTML('', SU.ctopics, true) + '</div>'; canNext = SU.ctopics.length > 0; }
    if(id === 'when') body = '<p class="lp-q">When is it?</p><input class="lp-in" type="date" id="lpDate" value="' + esc(SU.ckind === 'test' ? SU.cdate : (SU.date || isoIn(30))) + '" aria-label="Date"><p class="lp-sub">The path ends on that day, then asks what is next.</p>';
    var dots = '<div class="lp-dots" aria-hidden="true">' + steps.map(function(s, i){ return '<i class="' + (i <= SU.i ? 'on' : '') + '"></i>'; }).join('') + (SU.how ? '' : '<i></i><i></i>') + '</div>';
    openM('<div class="hd"><div><span class="lp-pill">' + esc(D.name) + '</span><h2>' + (SU.i === 0 ? 'Make your <span>path.</span>' : 'Your <span>path</span>') + '</h2>' + dots + '</div><button type="button" class="x" data-act="skip">Skip, follow the course order</button></div>' + body +
      '<div class="lp-foot">' + (SU.i > 0 ? '<button type="button" class="lp-link" data-act="suback">Back</button>' : '<span></span>') + '<button type="button" class="lp-btn" data-act="sunext"' + (canNext ? '' : ' disabled') + '>' + (last ? 'Make my path' : 'Next') + '</button></div>');
    bindSetup();
  }
  function bindMulti(){
    $$('[data-mt]', mod).forEach(function(b){ b.onclick = function(){ var id = b.getAttribute('data-mt'), i = SU.ctopics.indexOf(id); if(i >= 0) SU.ctopics.splice(i, 1); else SU.ctopics.push(id); b.setAttribute('aria-pressed', i < 0); var nx = $('[data-act="sunext"]', mod); if(nx) nx.disabled = !SU.ctopics.length; }; });
  }
  function bindSetup(){
    var id = suSteps()[SU.i];
    $$('[data-how]', mod).forEach(function(b){ b.onclick = function(){ SU.how = b.getAttribute('data-how'); stepSetup(); }; });
    $$('[data-start]', mod).forEach(function(b){ b.onclick = function(){ SU.start = b.getAttribute('data-start'); stepSetup(); }; });
    $$('[data-dl]', mod).forEach(function(b){ b.onclick = function(){ SU.dl = b.getAttribute('data-dl'); stepSetup(); }; });
    $$('[data-ck]', mod).forEach(function(b){ b.onclick = function(){ SU.ckind = b.getAttribute('data-ck'); stepSetup(); }; });
    var map = id === 'known' ? SU.known : SU.covered;
    $$('[data-unit]', mod).forEach(function(c){ c.onchange = function(){ var ui = +c.getAttribute('data-unit'); T.forEach(function(t){ if(t.u === ui && t.id !== SU.anchor){ if(c.checked) map[t.id] = 1; else delete map[t.id]; } }); stepSetup(); }; });
    $$('[data-tp]', mod).forEach(function(c){ c.onchange = function(){ var tid = c.getAttribute('data-tp'); if(c.checked) map[tid] = 1; else delete map[tid]; }; });
    $$('[data-openu]', mod).forEach(function(b){ b.onclick = function(){ var ui = +b.getAttribute('data-openu'); b.insertAdjacentHTML('afterend', '<div class="sub2">' + T.filter(function(t){ return t.u === ui && t.id !== SU.anchor; }).map(function(t){ return '<label><input type="checkbox" data-tp="' + esc(t.id) + '"' + (map[t.id] ? ' checked' : '') + '>' + esc(tName(t)) + '</label>'; }).join('') + '</div>'); b.remove(); bindSetup(); }; });
    if(id === 'on'){ bindFind(SU.anchor, false); onPick = function(tid){ SU.anchor = tid; SU.pre = 0; SU.covered = {}; stepSetup(); }; }
    if(id === 'topics'){ bindFind(SU.ctopics, true); bindMulti(); }
    var dt = $('#lpDate', mod); if(dt) dt.onchange = function(){ if(id === 'when' && SU.ckind === 'test') SU.cdate = dt.value; else SU.date = dt.value; };
  }
  function applySetup(){
    var keep = S.done, ack = S.ack; S = blank(); S.done = keep; S.ack = {}; S.mode = SU.how; S.seen = Date.now();
    if(SU.how === 'self'){ for(var k in SU.known) S.done[k] = 1; S.dl = SU.dl; }
    if(SU.how === 'class'){ S.anchor = SU.anchor; S.covered = SU.covered; S.dl = SU.dl; }
    if(SU.how === 'cram'){ S.cram = { kind: SU.ckind, topics: SU.ctopics.slice(), date: SU.ckind === 'test' ? SU.cdate : '' }; if(SU.ckind === 'exam' && SU.date && !D.exam.date) setExamDate(SU.date); }
    if((SU.how === 'self' || SU.how === 'class') && SU.dl === 'date' && SU.date) setExamDate(SU.date);
    if((SU.how === 'self' || SU.how === 'class') && SU.dl === 'exam' && D.exam.date){ try{ if(localStorage.getItem(EXAM_KEY) === 'none') localStorage.removeItem(EXAM_KEY); }catch(e){} }
    save(); closeM(); track('path_made', { mode: S.mode });
    if(!$('#levlPath')){ location.href = abs('path.html'); return; }
    toast('Path made. You can change it any time.'); SEL = null; renderAll();
  }
  function openPicker(){
    openM('<div class="hd"><div><span class="lp-pill">Alongside a class</span><h2>My class <span>is on…</span></h2><p class="lp-sub">Pick what your class is doing now. The path re-centers there, and everything you have done stays done.</p></div><button type="button" class="x" data-act="close">Close</button></div>' + pickerHTML(S.anchor));
    bindFind(S.anchor, false); onPick = function(tid){ closeM(); setAnchor(tid); };
  }
  function setAnchor(tid){
    if(S.anchor && S.anchor !== tid && !courseDone(S.anchor) && !S.done[S.anchor]) S.covered[S.anchor] = 1;
    S.anchor = tid; delete S.covered[tid]; S.mode = 'class'; delete S.ack['off:' + tid]; S.ack.anchor = null; SEL = null; save();
    track('path_recentered', {}); toast('Path updated: your class is on ' + BY[tid].t + '.'); renderAll();
  }
  function openTopic(tid){
    var t = BY[tid], m = S.mode, acts = '';
    if(m === 'class') acts = '<button type="button" class="lp-btn" data-act="anchor" data-id="' + esc(tid) + '">My class is on this now</button>' + (courseDone(tid) ? '' : '<button type="button" class="lp-btn ghost" data-act="togglecov" data-id="' + esc(tid) + '">' + (S.covered[tid] ? 'Not covered yet' : 'Mark as covered in class') + '</button>');
    else if(m === 'cram' && S.cram.kind === 'test') acts = '<button type="button" class="lp-btn" data-act="togglecram" data-id="' + esc(tid) + '">' + (S.cram.topics.indexOf(tid) >= 0 ? 'Take it off my test' : 'Add it to my test') + '</button>';
    else acts = courseDone(tid) ? '' : '<button type="button" class="lp-btn ghost" data-act="toggledone" data-id="' + esc(tid) + '">' + (S.done[tid] ? 'Mark as not done' : 'I already know this') + '</button>';
    openM('<div class="hd"><div><span class="lp-pill">' + esc(unitLabel(U[t.u])) + '</span><h2>' + esc(tName(t)) + '</h2><p class="lp-sub">' + (courseDone(tid) ? 'Done.' : S.covered[tid] ? 'Covered in class.' : S.done[tid] ? 'Marked as done.' : 'Not started.') + (t.l && !t.f ? ' The notes are free; the interactive lesson is in Premium.' : '') + '</p></div><button type="button" class="x" data-act="close">Close</button></div><div class="lp-row">' + acts + '<a class="lp-link" href="' + esc(startUrl(t)) + '">Open it</a></div>');
  }
  function openCheck(tid){
    var t = BY[tid];
    openM('<div class="hd"><div><span class="lp-pill">Quick check</span><h2>Know <span>' + esc(lower(t.t)) + '</span> already?</h2><p class="lp-sub">Answer a few practice questions on it. If they go well, come back and mark this stop done. If not, it stays on your path, no harm done.</p></div><button type="button" class="x" data-act="close">Close</button></div><div class="lp-row"><a class="lp-btn" href="' + esc(practiceUrl(t)) + '">Try the questions</a><button type="button" class="lp-link" data-act="markdone" data-id="' + esc(tid) + '">I already know it, mark it done</button></div>');
  }
  function maybeCheckin(){
    var away = S.seen ? (Date.now() - S.seen) / 864e5 : 0;
    BEHIND = away >= 3 && !!pace() && S.ack.behind !== today();
    if(away >= 3 && S.mode === 'class' && S.anchor && !isF(S.anchor)){
      openM('<div class="hd"><div><span class="lp-pill">Welcome back</span><h2>Is your class still on <span>' + esc(lower(BY[S.anchor].t)) + '?</span></h2><p class="lp-sub">It has been a few days. One tap keeps your path matched to your class.</p></div></div><div class="lp-opts"><button type="button" class="lp-opt" data-act="close"><span class="ic">' + sm(ICON.check, 22) + '</span><span><b>Still on it</b><small>Keep the path as it is.</small></span></button><button type="button" class="lp-opt" data-act="picker"><span class="ic">' + sm(ICON.arrow, 22) + '</span><span><b>We moved on</b><small>Pick what your class is on now.</small></span></button></div>');
    }
    S.seen = Date.now(); save();
  }
  var BEHIND = false;

  /* ---------- events ---------- */
  function onClick(e){
    var a = e.target.closest('[data-act]'), sp = e.target.closest('#lpTrack [data-stop]'), go = e.target.closest('#lpMap [data-go]');
    if(sp){ select(sp.getAttribute('data-stop'), false); return; }
    if(go){ select(go.getAttribute('data-go'), true); return; }
    if(!a || !(a.closest('.lp-ov') || a.closest('#levlPath') || a.closest('#lpSlot') || a.closest('#lpEnd') || a.closest('.lp-secend'))) return;
    var act = a.getAttribute('data-act'), id = a.getAttribute('data-id');
    if(act === 'setup') openSetup();
    else if(act === 'skip'){ closeM(); if(!S.mode){ S.mode = 'self'; S.seen = Date.now(); save(); track('path_made', { mode: 'skip' }); } if(!$('#levlPath')) location.href = abs('path.html'); else renderAll(); }
    else if(act === 'sunext'){ if(a.disabled) return; var st = suSteps(); if(SU.how && SU.i < st.length - 1){ SU.i++; stepSetup(); } else if(SU.how) applySetup(); }
    else if(act === 'suback'){ SU.i = Math.max(0, SU.i - 1); stepSetup(); }
    else if(act === 'close') closeM();
    else if(act === 'picker') openPicker();
    else if(act === 'anchor'){ closeM(); setAnchor(id); }
    else if(act === 'togglecov'){ if(S.covered[id]) delete S.covered[id]; else S.covered[id] = 1; save(); closeM(); SEL = null; renderAll(); }
    else if(act === 'toggledone'){ if(S.done[id]) delete S.done[id]; else S.done[id] = 1; save(); closeM(); SEL = null; renderAll(); changed(); }
    else if(act === 'togglecram'){ var i = S.cram.topics.indexOf(id); if(i >= 0) S.cram.topics.splice(i, 1); else S.cram.topics.push(id); save(); closeM(); SEL = null; toast(i >= 0 ? 'Taken off your test.' : 'Added to your test.'); renderAll(); }
    else if(act === 'markdone'){ S.done[id] = 1; save(); closeM(); SEL = null; track('path_stop_done', {}); toast('Done. On to the next one.'); renderAll(); changed(); }
    else if(act === 'undone'){ delete S.done[id]; delete S.covered[id]; save(); SEL = null; renderAll(); changed(); }
    else if(act === 'check') openCheck(id);
    else if(act === 'still'){ S.ack.anchor = S.anchor; save(); toast('Okay. Review and gaps while your class finishes it.'); renderAll(); }
    else if(act === 'offno'){ S.ack['off:' + id] = 1; save(); renderAll(); }
    else if(act === 'okbehind'){ BEHIND = false; S.ack.behind = today(); save(); renderPath(); }
    else if(act === 'toexam'){ S.mode = 'cram'; S.cram = { kind: 'exam', topics: [], date: '' }; S.ack.exam = 1; SEL = null; save(); toast('Switched to exam review. Everything you did stays done.'); if(!$('#levlPath')) location.href = abs('path.html'); else renderAll(); }
    else if(act === 'ackexam'){ S.ack.exam = 1; save(); renderPath(); }
  }

  // The textbook rails (*-toc.js, ochem textbook.js) tick what the path marks done too.
  function changed(){ try{ document.dispatchEvent(new CustomEvent('levl:pathchange', { detail: { course: KEY } })); }catch(e){} }
  function renderAll(){ readProgress(); ACC = null; renderPath(); renderHome(); renderEnd(); renderBook(); }
  var PAGE_T = null, BOOK = false;
  function start(data){
    D = data; U = D.units; T = D.topics.map(function(t, i){ t.i = i; BY[t.id] = t; return t; });
    S = load(); readProgress();
    BOOK = !$('#levlPath') && !$('main.r3-home') && /\/(learn|study-notes)\.html$/.test(location.pathname) && !!$('main.tb-main');
    PAGE_T = $('#levlPath') || $('main.r3-home') || BOOK ? null : pageTopic();
    if(BOOK){ var bq = false, bm = $('main.tb-main'); new MutationObserver(function(){ if(bq) return; bq = true; setTimeout(function(){ bq = false; renderBook(); }, 120); }).observe(bm, { childList: true, subtree: true, attributes: true, attributeFilter: ['hidden'] }); }
    document.addEventListener('click', onClick);
    if($('#levlPath') || $('main.r3-home')) maybeCheckin();
    renderAll();
    // A lesson finishing on this page, or progress from another tab.
    window.addEventListener('storage', function(e){ if(!e.key || e.key === SK || e.key === D.progress || /ochem_|nremt_lessons/.test(e.key)){ S = load(); renderAll(); } });
    document.addEventListener(KEY + ':progress', function(){ renderAll(); });
    window.addEventListener(KEY + ':progress', function(){ renderAll(); });
    if(PAGE_T){ var was = isF(PAGE_T.id); setInterval(function(){ readProgress(); var nowDone = isF(PAGE_T.id); if(nowDone !== was){ was = nowDone; renderEnd(); } }, 4000); }
    // The ochem textbook marks a section read on the page itself (no storage event in the same tab).
    if(BOOK) document.addEventListener('levl:bookread', function(){ readProgress(); renderBook(); });
    var rt, lw = window.innerWidth; window.addEventListener('resize', function(){ clearTimeout(rt); rt = setTimeout(function(){ if(window.innerWidth !== lw && $('#lpTrack')){ lw = window.innerWidth; renderPath(); } }, 150); });
  }
  window.LevlPath = { course: KEY, open: function(){ if(D) openSetup(); } };
  fetch('/assets/path/' + KEY + '.json', { credentials: 'same-origin' }).then(function(r){ return r.ok ? r.json() : null; }).then(function(d){
    if(d && d.v === 1) start(d);
    else { var h = $('#levlPath'); if(h) h.innerHTML = '<p class="lp-load">The path could not load. Refresh the page to try again.</p>'; }
  }).catch(function(){ var h = $('#levlPath'); if(h) h.innerHTML = '<p class="lp-load">The path could not load. Check your connection and refresh.</p>'; });
})();
