/* The guided study path (docs/guided-path.md), for every course.

   Loaded by assets/site-chrome.js (mountPath) on a course's home, its Path
   page and its lesson and notes pages, with assets/course/path.css. Reads
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
  function load(){ var s = parse(SK); if(!s || s.v !== 1) return blank(); var b = blank(); for(var k in b) if(!(k in s)) s[k] = b[k]; if(s.anchor && !BY[s.anchor]) s.anchor = null; if(s.mode === 'class' && !s.anchor) s.mode = 'self'; return s; }
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
    return false;
  }
  function lessonDone(t){
    if(D.kind === 'nremt') return (t.lessons || []).some(function(id){ return PROG.nl[id]; });
    return courseDone(t.id);
  }
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
  function startUrl(t){ if(t.l && (t.f || hasPass())) return abs(t.l); return abs(t.o) || abs(t.l) || practiceUrl(t); }
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
      var rem = T.filter(function(t){ return !isF(t.id); });
      if(!rem.length){ st.push({ kind: 'sum', title: 'Every topic', sub: 'done', state: 'done' }); st.push({ kind: 'finish', title: 'Exam review', sub: 'what is next', state: 'now' }); return st; }
      var sr = stretchOf(rem[0].i), cs = sr.c, cu = cs.u, before = T.filter(function(t){ return t.i < cs.from && isF(t.id); }).length, c = 0;
      if(before) st.push({ kind: 'sum', title: 'Done so far', sub: coveredSummary(), state: 'done' });
      stretchTopics(cs).forEach(function(t){ st.push(topicStop(t)); c++; if(c % 3 === 0) st.push({ kind: 'review', title: 'Review mix', sub: 'your recent misses', state: 'todo' }); });
      var test = D.tests[U[cu].id];
      if(test) st.push({ kind: 'test', title: U[cu].label + ' test', sub: 'checkpoint', state: 'todo', url: abs(test) });
      if(sr.next) st.push({ kind: 'unit', title: U[sr.next.u].label, sub: U[sr.next.u].title, state: 'todo', u: sr.next.u });
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
    st.forEach(function(s, i){ if(now < 0 && s.state === 'todo' && s.kind === 'topic') now = i; });
    if(now < 0) st.forEach(function(s, i){ if(now < 0 && s.state === 'todo') now = i; });
    if(now >= 0) st[now].state = 'now';
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
    if(s.kind === 'finish') return abs(D.exams) || abs(D.review);
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
  function detailHTML(s){
    var k = '', title = s.title, why = '', steps = '', acts = '', free = '';
    if(s.kind === 'topic'){
      var t = BY[s.id];
      title = tName(t);
      k = s.state === 'done' ? 'Done' : s.state === 'faded' ? 'Maybe later · not set' : s.state === 'now' ? (s.pre ? 'Up next · before your class topic' : s.cls ? 'Up next · your class topic' : 'Up next') : s.cls ? 'Your class topic' : s.pre ? 'Before your class topic' : 'Coming up';
      if(s.pre) why = esc(BY[S.anchor].t) + ' builds on this' + (s.why ? ' (' + esc(s.why) + ')' : '') + ', and you have not covered it yet. One short stop here, then on to your class topic.';
      else if(s.cls) why = 'What your class is on right now. When your class moves on, tap “My class is on…” and the path follows.';
      else if(s.state === 'faded') why = 'Many classes do this next, but yours might not. This part of the path redraws as soon as you say what your class is on.';
      else if(s.cram) why = s.acc == null ? 'One of your test topics. You have not practiced it here yet.' : 'One of your test topics. You have about ' + s.acc + '% right on it so far' + (s.acc < 60 ? ', so it comes first.' : '.');
      else if(s.state === 'done') why = 'You finished this. Its questions come back in review so it stays fresh.';
      else why = esc(unitLabel(U[t.u])) + '.';
      steps = stepList(t, s.state === 'now');
      if(t.l && !t.f && !hasPass()) free = 'The notes and practice finish this stop for free. The interactive lesson is in Premium.';
      if(s.state === 'done') acts = '<a class="lp-btn gold" href="' + esc(startUrl(t)) + '">Go over it again</a><button type="button" class="lp-link" data-act="undone" data-id="' + esc(t.id) + '">Not done after all</button>';
      else if(s.state === 'faded') acts = '<button type="button" class="lp-btn gold" data-act="anchor" data-id="' + esc(t.id) + '">My class is on this now</button><a class="lp-link" href="' + esc(startUrl(t)) + '">Get ahead anyway</a>';
      else acts = '<a class="lp-btn gold" href="' + esc(startUrl(t)) + '">' + (s.state === 'now' ? 'Start' : 'Jump here') + '</a>' +
        (s.state === 'now' && D.practice ? '<button type="button" class="lp-link" data-act="check" data-id="' + esc(t.id) + '">Know it already? Quick check</button>' : '') +
        '<button type="button" class="lp-link" data-act="markdone" data-id="' + esc(t.id) + '">Mark this stop done</button>';
    } else if(s.kind === 'sum'){
      k = 'Done'; title = s.title;
      why = S.mode === 'class' ? 'You said your class already covered these, so the path skips them. Their questions still come back in review.' : 'Everything you have finished. It stays done, even if you change how you study.';
      steps = '<ol class="lp-steps"><li class="ok"><i>✓</i>' + esc(coveredSummary()) + '</li></ol>';
      acts = '<button type="button" class="lp-btn gold" data-act="whole">See it in the whole course</button>';
    } else if(s.kind === 'review'){
      k = s.state === 'now' ? 'Up next' : 'Review'; why = 'Questions you missed recently, plus a few from topics you finished earlier, so they stick.';
      acts = D.review ? '<a class="lp-btn gold" href="' + esc(abs(D.review)) + '">Open review</a>' : '';
    } else if(s.kind === 'test'){
      k = 'Checkpoint'; why = 'Checks the whole ' + (D.kind === 'ap' ? 'unit' : 'chapter') + '. Anything you miss goes into review.';
      acts = '<a class="lp-btn gold" href="' + esc(s.url) + '">Take the test</a>';
    } else if(s.kind === 'unit'){
      var u = U[s.u]; k = s.state === 'faded' ? 'Maybe later · not set' : 'Next'; title = unitLabel(u);
      why = s.state === 'faded' ? 'If your class follows the usual order. It rearranges itself when your class goes somewhere else.' : 'The path continues here.';
      if(u.w) steps = '<ol class="lp-steps"><li><i>%</i>' + esc(u.w) + ' of the exam</li></ol>';
      acts = '<button type="button" class="lp-btn gold" data-act="whole">See it in the whole course</button>';
    } else if(s.kind === 'mix'){
      k = 'Practice'; why = s.timed ? 'A timed set at test speed, after your weakest topics.' : 'A mixed set across your test topics, because mixing them up is what the test does.';
      var url = stopUrl(s); acts = url ? '<a class="lp-btn gold" href="' + esc(url) + '">' + (s.timed ? 'Open exams' : 'Open practice') + '</a>' : '';
    } else if(s.kind === 'day'){
      k = 'The finish line'; why = S.cram.kind === 'exam' ? 'Your path aims to cover your weakest topics before then.' : 'Your test. After it, the path asks what is next.';
      acts = '<button type="button" class="lp-link" data-act="setup">Change the date</button>';
    } else if(s.kind === 'finish'){
      k = 'You did it'; title = 'Every topic, done';
      why = 'You have been through the whole course. Exam review goes after your weakest topics first.';
      acts = '<button type="button" class="lp-btn gold" data-act="toexam">Switch to exam review</button>';
    }
    return '<div class="tx"><p class="lp-k">' + k + '</p><h3>' + esc(title) + '</h3>' + (why ? '<p>' + why + '</p>' : '') + (free ? '<p class="free">' + free + '</p>' : '') + '</div>' + (steps || '<span></span>') + '<div class="act">' + acts + '</div>';
  }

  /* ---------- drawing the path ---------- */
  function nodeIcon(s){ if(s.state === 'done') return ICON.check; if(s.kind === 'review') return ICON.review; if(s.kind === 'test' || s.kind === 'finish') return ICON.trophy; if(s.kind === 'unit') return ICON.arrow; if(s.kind === 'mix') return ICON.mix; if(s.kind === 'day') return ICON.cal; if(s.state === 'now') return ICON.play; if(s.cls) return ICON.flag; return ICON.book; }
  var SEL = null;
  function drawStage(host){
    var st = stops();
    if(SEL == null || SEL >= st.length){ SEL = 0; st.forEach(function(s, i){ if(s.state === 'now') SEL = i; }); }
    var w = host.clientWidth || 1000, vert = w < 640, pts = [], W, H, i;
    if(vert){ W = Math.max(300, w); st.forEach(function(s, i){ pts.push([Math.round(W * (i % 2 ? 0.7 : 0.3)), 90 + i * 124]); }); H = 90 + (st.length - 1) * 124 + 90; }
    else { var gap = 142; W = Math.max(w, 90 + gap * (st.length - 1) + 90); var off = (W - gap * (st.length - 1)) / 2; st.forEach(function(s, i){ pts.push([Math.round(off + i * gap), i % 2 ? 92 : 168]); }); H = 270; }
    var seg = '';
    for(i = 1; i < pts.length; i++){
      var a = pts[i - 1], b = pts[i], s = st[i], cl = s.state === 'faded' ? 'faded' : (s.state === 'done' || s.state === 'now') ? 'done' : 'todo';
      var d = vert ? 'M' + a[0] + ' ' + a[1] + ' C ' + a[0] + ' ' + (a[1] + b[1]) / 2 + ', ' + b[0] + ' ' + (a[1] + b[1]) / 2 + ', ' + b[0] + ' ' + b[1]
        : 'M' + a[0] + ' ' + a[1] + ' C ' + (a[0] + b[0]) / 2 + ' ' + a[1] + ', ' + (a[0] + b[0]) / 2 + ' ' + b[1] + ', ' + b[0] + ' ' + b[1];
      seg += '<path class="ln ' + cl + '" d="' + d + '"/>';
    }
    var html = '<div class="lp-stage' + (vert ? ' vert' : '') + '" style="width:' + W + 'px;height:' + H + 'px"><svg width="' + W + '" height="' + H + '" viewBox="0 0 ' + W + ' ' + H + '" aria-hidden="true">' + seg + '</svg>';
    var ff = -1; st.forEach(function(s, i){ if(ff < 0 && s.state === 'faded') ff = i; });
    if(ff >= 0 && vert){ var p = pts[ff]; html += '<span class="lp-fadenote" style="left:' + W / 2 + 'px;top:' + (p[1] - 70) + 'px">if your class follows the usual order</span>'; }
    st.forEach(function(s, i){
      var p = pts[i], c = 'lp-n ' + (vert && i % 2 ? 'lbl-left ' : '') + s.state + (s.cls ? ' cls' : '') + (s.kind === 'test' || s.kind === 'finish' ? ' test' : '') + (s.kind === 'day' ? ' day' : '') + (i === SEL ? ' sel' : '');
      html += '<button type="button" class="' + c + '" data-i="' + i + '" style="left:' + p[0] + 'px;top:' + p[1] + 'px" aria-pressed="' + (i === SEL) + '" aria-label="' + esc(s.title) + '">' +
        (s.state === 'now' ? '<span class="bub">' + (s.kind === 'topic' ? 'Start' : 'Next') + '</span>' : '') +
        (s.cls && s.state !== 'done' ? '<span class="flag">your class</span>' : '') +
        '<span class="dot">' + nodeIcon(s) + '</span><span class="lb">' + esc(s.title) + '<small>' + esc(s.pre ? 'before your class topic' : s.sub || '') + '</small></span></button>';
    });
    host.innerHTML = html + '</div>';
    $$('.lp-n', host).forEach(function(b){ b.addEventListener('click', function(){ SEL = +b.getAttribute('data-i'); drawStage(host); var det = $('#lpDet'); if(det) det.innerHTML = detailHTML(stops()[SEL]); }); });
    if(!vert){ var sel = $('.lp-n.sel', host), sc = host.parentNode; if(sel && sc.scrollWidth > sc.clientWidth) sc.scrollLeft = Math.max(0, parseInt(sel.style.left, 10) - sc.clientWidth / 2); }
  }

  /* ---------- the Path page ---------- */
  var ZOOM = 'stretch';
  function metaHTML(){
    var bits = ['<span class="lp-chip">' + sm(S.mode === 'self' ? ICON.self : S.mode === 'class' ? ICON.cls : ICON.clock, 16) + modeLabel() + '</span>'];
    var dd = deadline(), n = dd ? daysTo(dd) : null;
    if(S.mode === 'cram' && n != null && n >= 0) bits.push('<span class="lp-chip cd">' + (n === 0 ? 'Today' : n === 1 ? 'Tomorrow' : 'In ' + n + ' days') + '</span>');
    if(S.mode === 'class' && S.anchor) bits.push('<span>Your class is on <b style="color:var(--ink)">' + esc(BY[S.anchor].t) + '</b></span>');
    var p = pace();
    if(p) bits.push('<span>about ' + p + ' min a day' + (S.mode !== 'cram' && dd ? ' to be ready by ' + niceDate(dd) : '') + '</span>');
    else if(S.mode !== 'cram') bits.push('<span>no deadline, go at your own pace</span>');
    return bits.join('');
  }
  function bannersHTML(){
    var b = '', ex = examDate(), n = ex ? daysTo(ex) : null;
    if(S.mode === 'class' && S.anchor && isF(S.anchor) && S.ack.anchor !== S.anchor)
      b += '<div class="lp-banner cool"><div class="tx"><b>Your class topic is done: ' + esc(BY[S.anchor].t) + '.</b><p>The path does not guess what your teacher does next. What is your class on now?</p></div><div class="lp-row"><button type="button" class="lp-btn sm" data-act="picker">Something new</button><button type="button" class="lp-link" data-act="still">Still on it</button></div></div>';
    if(n != null && n > 0 && n <= 49 && S.mode !== 'cram' && !S.ack.exam)
      b += '<div class="lp-banner cool"><div class="tx"><b>The ' + esc(D.exam.label) + ' is about ' + Math.max(1, Math.round(n / 7)) + ' week' + (n > 10 ? 's' : '') + ' away.</b><p>Switch to exam review? It goes after the topics you have not done yet, weakest first. Everything you have done stays done.</p></div><div class="lp-row"><button type="button" class="lp-btn sm" data-act="toexam">Switch to exam review</button><button type="button" class="lp-link" data-act="ackexam">Not yet</button></div></div>';
    if(BEHIND && pace())
      b += '<div class="lp-banner warm"><div class="tx"><b>You missed a few days. That is fine.</b><p>New pace: about ' + pace() + ' minutes a day.' + (D.kind === 'nremt' ? '' : ' Your free questions a day still cover it.') + '</p></div><div class="lp-row"><button type="button" class="lp-btn sm" data-act="okbehind">Okay</button><button type="button" class="lp-link" data-act="setup">Change the date</button></div></div>';
    return b;
  }
  function renderPath(){
    var host = $('#levlPath'); if(!host) return;
    if(!S.mode){
      host.innerHTML = '<div class="lp-top"><div><span class="lp-pill">' + esc(D.name) + '</span><h1>Your <span>path</span></h1></div></div><div class="lp-card lp-new"><div class="tx"><h2 class="lp-h2">No path yet</h2><p class="lp-p">Three quick taps and you get a path that starts in the right place, adds only what you are missing and sets a daily pace. Every unit stays open, and you can still open any of it from Learn.</p></div><div class="lp-row"><button type="button" class="lp-btn" data-act="setup">Make my path</button><button type="button" class="lp-link" data-act="skip">Skip, just follow the course order</button></div></div>';
      return;
    }
    var tools = '<div class="lp-seg" role="group" aria-label="How much of the path to show"><button type="button" data-zoom="stretch" aria-pressed="' + (ZOOM === 'stretch') + '">This stretch</button><button type="button" data-zoom="whole" aria-pressed="' + (ZOOM === 'whole') + '">Whole course</button></div>' +
      (S.mode === 'class' ? '<button type="button" class="lp-btn ghost sm" data-act="picker">My class is on…</button>' : '') +
      '<button type="button" class="lp-link" data-act="setup">Change how I study</button>';
    var body = ZOOM === 'stretch'
      ? '<div class="lp-card"><div class="lp-scroll"><div id="lpStage"></div></div><div class="lp-det" id="lpDet" aria-live="polite"></div><p class="lp-hand" style="margin-top:12px;font-size:19px">' + (S.mode === 'cram' ? 'weakest topics first, then timed practice' : S.mode === 'class' ? 'faded stops follow the usual order, and redraw when your class moves' : 'jump anywhere, everything you finish stays done') + '</p></div>'
      : '<div class="lp-card">' + wholeHTML() + '</div>';
    host.innerHTML = '<div class="lp-top"><div><span class="lp-pill">' + esc(D.name) + ' · your path</span><h1>Your <span>path</span></h1><div class="lp-meta">' + metaHTML() + '</div></div><div class="lp-tools">' + tools + '</div></div>' + bannersHTML() + body +
      '<p class="lp-note">Your path’s answers are saved on this device. What you finish counts everywhere you are logged in.</p>';
    if(ZOOM === 'stretch'){ drawStage($('#lpStage')); $('#lpDet').innerHTML = detailHTML(stops()[SEL]); }
  }
  function wholeHTML(){
    var cur = nowStop(), cid = cur && cur.id;
    var leg = '<div class="lp-legend"><span><i style="background:var(--lp-ac)"></i>done</span>' + (S.mode === 'class' ? '<span><i style="background:var(--lp-ct);box-shadow:inset 0 0 0 1px var(--lp-ac)"></i>covered in class</span><span><i style="box-shadow:inset 0 0 0 2px var(--lp-ac)"></i>your class is here</span>' : '') + (S.mode === 'cram' && S.cram.kind === 'test' ? '<span><i style="box-shadow:inset 0 0 0 2px #0B1A33"></i>on your test</span>' : '') + '<span><i style="background:#FFD23F"></i>up next</span><span><i></i>not started</span></div>';
    var rows = U.map(function(u, ui){
      var ts = T.filter(function(t){ return t.u === ui; }); if(!ts.length) return '';
      var dn = ts.filter(function(t){ return isF(t.id); }).length, here = S.mode === 'class' && BY[S.anchor].u === ui;
      var stt = dn === ts.length ? (ts.every(function(t){ return S.covered[t.id]; }) ? 'covered in class' : 'all done') : here ? 'your class is here' : dn ? dn + ' of ' + ts.length + ' done' : 'not started';
      return '<div class="lp-unit"><div class="nm"><b>' + esc(unitLabel(u)) + '</b><small>' + ts.length + ' topic' + (ts.length > 1 ? 's' : '') + (u.w ? ' · ' + esc(u.w) + ' of the exam' : '') + '</small></div><div class="ts">' +
        ts.map(function(t){ var c = 'lp-t' + (courseDone(t.id) || S.done[t.id] ? ' done' : S.covered[t.id] ? ' cov' : '') + (t.id === cid ? ' now' : '') + (S.mode === 'class' && t.id === S.anchor ? ' cls' : '') + (S.mode === 'cram' && S.cram.kind === 'test' && S.cram.topics.indexOf(t.id) >= 0 ? ' cram' : '');
          return '<button type="button" class="' + c + '" data-topic="' + esc(t.id) + '">' + (t.n ? '<b>' + esc(t.n) + '</b>' : '') + esc(t.t) + '</button>'; }).join('') +
        '</div><span class="st">' + stt + '</span></div>';
    }).join('');
    return '<div class="lp-whole"><p class="lp-sub">Tap any topic to ' + (S.mode === 'class' ? 'tell the path your class is on it, or mark it covered' : S.mode === 'cram' ? 'add it to your test or open it' : 'open it or mark it as already known') + '.' + (S.mode === 'class' ? ' After your class topic, the path shows the usual order, and it moves when your class does.' : '') + '</p>' + leg + rows + '</div>';
  }

  /* ---------- the course home card ---------- */
  function renderHome(){
    var main = $('main.r3-home'), lead = main && $('.lead', main); if(!lead) return;
    var slot = $('#lpSlot');
    if(!slot){ slot = document.createElement('div'); slot.id = 'lpSlot'; slot.className = 'lp-slot'; lead.parentNode.insertBefore(slot, lead); }
    var pathHref = abs('path.html');
    if(!S.mode){
      slot.innerHTML = '<div class="lp-card lp-new"><div class="tx"><span class="lp-pill">New · your path</span><h2 class="lp-h2">A path made for <span>how you study.</span></h2><p class="lp-p">On your own, alongside a class, or cramming for a test. Three quick taps and it starts you in the right place, adds only what you are missing, and sets a daily pace. Every unit stays open.</p></div><div class="lp-row"><button type="button" class="lp-btn" data-act="setup">Make my path</button><p class="lp-hand">or just start below</p></div></div>';
      return;
    }
    var st = stops(), ni = 0; st.forEach(function(s, i){ if(s.state === 'now') ni = i; });
    var from = Math.max(0, ni - 1), mini = st.slice(from, from + 5), n = st[ni];
    var why = n.pre ? 'Added because ' + lower(BY[S.anchor].t) + ' builds on it.' : n.cls ? 'What your class is on right now.' : n.cram ? 'One of your test topics, weakest first.' : n.kind === 'topic' ? 'Next in the course order.' : '';
    slot.innerHTML = '<div class="lp-card lp-prev"><div class="tx"><p class="lp-k" style="color:var(--muted)">Your path · ' + modeLabel() + '</p><h2 class="lp-h2" style="margin:0">Up next: <span>' + esc(n.kind === 'topic' ? BY[n.id].t : n.title) + '</span></h2>' + (why ? '<p class="lp-p">' + why + '</p>' : '') +
      '<div class="lp-row" style="margin-top:6px">' + (stopUrl(n) ? '<a class="lp-btn" href="' + esc(stopUrl(n)) + '">Continue</a>' : '') + '<a class="lp-btn ghost" href="' + esc(pathHref) + '">Open your path</a></div></div>' +
      '<div class="lp-mini" aria-label="Your next stops">' + mini.map(function(s){ return '<div class="m ' + s.state + (s.cls ? ' cls' : '') + '"><span class="d">' + sm(nodeIcon(s), 20) + '</span>' + esc(s.title) + '<small>' + (s.state === 'now' ? 'up next' : s.state === 'faded' ? 'maybe later' : s.state === 'done' ? 'done' : '') + '</small></div>'; }).join('') + '</div></div>';
    var url = stopUrl(n);
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
        '<div class="act"><button type="button" class="lp-btn gold" data-act="markdone" data-id="' + esc(t.id) + '">Mark this stop done</button><a class="lp-link" href="' + esc(abs('path.html')) + '">Back to your path</a></div>';
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
      body = '<p class="lp-q">How are you studying?</p><div class="lp-opts">' + [['self', 'On my own', 'No class, or I want to learn it start to finish.', ICON.self], ['class', 'Alongside a class', 'I want to keep up with what my class is doing.', ICON.cls], ['cram', 'Cramming for a test', 'I have a date coming up and not much time.', ICON.clock]].map(function(o){
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
    var a = e.target.closest('[data-act]'), z = e.target.closest('[data-zoom]'), tp = e.target.closest('[data-topic]');
    if(tp && e.target.closest('.lp-whole')){ openTopic(tp.getAttribute('data-topic')); return; }
    if(z){ ZOOM = z.getAttribute('data-zoom'); SEL = null; renderPath(); return; }
    if(!a || !(a.closest('.lp-ov') || a.closest('#levlPath') || a.closest('#lpSlot') || a.closest('#lpEnd'))) return;
    var act = a.getAttribute('data-act'), id = a.getAttribute('data-id');
    if(act === 'setup') openSetup();
    else if(act === 'skip'){ closeM(); if(!S.mode){ S.mode = 'self'; S.seen = Date.now(); save(); track('path_made', { mode: 'skip' }); } if(!$('#levlPath')) location.href = abs('path.html'); else renderAll(); }
    else if(act === 'sunext'){ if(a.disabled) return; var st = suSteps(); if(SU.how && SU.i < st.length - 1){ SU.i++; stepSetup(); } else if(SU.how) applySetup(); }
    else if(act === 'suback'){ SU.i = Math.max(0, SU.i - 1); stepSetup(); }
    else if(act === 'close') closeM();
    else if(act === 'picker') openPicker();
    else if(act === 'anchor'){ closeM(); setAnchor(id); }
    else if(act === 'togglecov'){ if(S.covered[id]) delete S.covered[id]; else S.covered[id] = 1; save(); closeM(); SEL = null; renderAll(); }
    else if(act === 'toggledone'){ if(S.done[id]) delete S.done[id]; else S.done[id] = 1; save(); closeM(); SEL = null; renderAll(); }
    else if(act === 'togglecram'){ var i = S.cram.topics.indexOf(id); if(i >= 0) S.cram.topics.splice(i, 1); else S.cram.topics.push(id); save(); closeM(); SEL = null; toast(i >= 0 ? 'Taken off your test.' : 'Added to your test.'); renderAll(); }
    else if(act === 'markdone'){ S.done[id] = 1; save(); closeM(); SEL = null; track('path_stop_done', {}); toast('Stop done. On to the next one.'); renderAll(); }
    else if(act === 'undone'){ delete S.done[id]; delete S.covered[id]; save(); SEL = null; renderAll(); }
    else if(act === 'check') openCheck(id);
    else if(act === 'whole'){ ZOOM = 'whole'; renderPath(); }
    else if(act === 'still'){ S.ack.anchor = S.anchor; save(); toast('Okay. Review and gaps while your class finishes it.'); renderAll(); }
    else if(act === 'offno'){ S.ack['off:' + id] = 1; save(); renderAll(); }
    else if(act === 'okbehind'){ BEHIND = false; S.ack.behind = today(); save(); renderPath(); }
    else if(act === 'toexam'){ S.mode = 'cram'; S.cram = { kind: 'exam', topics: [], date: '' }; S.ack.exam = 1; SEL = null; save(); toast('Switched to exam review. Everything you did stays done.'); if(!$('#levlPath')) location.href = abs('path.html'); else renderAll(); }
    else if(act === 'ackexam'){ S.ack.exam = 1; save(); renderPath(); }
  }

  function renderAll(){ readProgress(); ACC = null; renderPath(); renderHome(); renderEnd(); }
  var PAGE_T = null;
  function start(data){
    D = data; U = D.units; T = D.topics.map(function(t, i){ t.i = i; BY[t.id] = t; return t; });
    S = load(); readProgress();
    PAGE_T = $('#levlPath') || $('main.r3-home') ? null : pageTopic();
    document.addEventListener('click', onClick);
    if($('#levlPath') || $('main.r3-home')) maybeCheckin();
    renderAll();
    // A lesson finishing on this page, or progress from another tab.
    window.addEventListener('storage', function(e){ if(!e.key || e.key === SK || e.key === D.progress || /ochem_|nremt_lessons/.test(e.key)){ S = load(); renderAll(); } });
    document.addEventListener(KEY + ':progress', function(){ renderAll(); });
    window.addEventListener(KEY + ':progress', function(){ renderAll(); });
    if(PAGE_T){ var was = isF(PAGE_T.id); setInterval(function(){ readProgress(); var nowDone = isF(PAGE_T.id); if(nowDone !== was){ was = nowDone; renderEnd(); } }, 4000); }
    var rt; window.addEventListener('resize', function(){ clearTimeout(rt); rt = setTimeout(function(){ var h = $('#lpStage'); if(h) drawStage(h); }, 150); });
  }
  window.LevlPath = { course: KEY, open: function(){ if(D) openSetup(); } };
  fetch('/assets/path/' + KEY + '.json', { credentials: 'same-origin' }).then(function(r){ return r.ok ? r.json() : null; }).then(function(d){
    if(d && d.v === 1) start(d);
    else { var h = $('#levlPath'); if(h) h.innerHTML = '<p class="lp-load">The path could not load. Refresh the page to try again.</p>'; }
  }).catch(function(){ var h = $('#levlPath'); if(h) h.innerHTML = '<p class="lp-load">The path could not load. Check your connection and refresh.</p>'; });
})();
