/* Teacher classes, the student's "My class" view (docs/teacher-classes.md): window.LevlClassView.

   Loaded by assets/class/class-student.js on a course home for a student in a class of that course. It adds the
   Path | My class switch under the home's band and, behind My class, a side menu with four pages:
     Overview     what is due, how many are done, the average score, next up, practice to strengthen, announcements
     Assignments  To do, Optional, Done and Missing, each its own block
     Results      topic by topic, then every finished piece of work with its score
     Class info   what the teacher sees, leave the class, join another
   Everything is computed in this browser from the student's own progress (LevlClassModel.summarize and .status), the
   same numbers the teacher sees. Nothing here is stored except which view was last open (sessionStorage).
   The class page is a view of the home, not a page: addresses #path, #class, #class/assign, #class/results, #class/info. */
(function(){
  'use strict';
  if(window.LevlClassView) return;
  var KEY = 'levlprep_class_view_v1';
  var KIND = { practice: 'Practice', review: 'Review', mastery: 'Mastery', exam: 'Practice exam', frq: 'Free response' };
  var SUBS = [['overview', 'Overview'], ['assign', 'Assignments'], ['results', 'Results'], ['info', 'Class info']];
  var st = { course: null, ci: 0, older: {}, wired: false };

  function M(){ return window.LevlClassModel; }
  function S(){ return window.LevlClassStudent; }
  function A(){ return window.StudyHubAccount; }
  function esc(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){ return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]; }); }
  function get(k){ try{ return localStorage.getItem(k); }catch(e){ return null; } }
  function pct(x){ return Math.round(x * 100) + '%'; }
  function day(ms){ return new Date(ms).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }); }
  function mine(){ return S().list().filter(function(c){ return c.course === st.course; }); }
  function cur(){ var C = M().COURSES[st.course], raw = C && window[C.g]; return raw ? M().curriculum(st.course, raw) : null; }
  function host(){ return document.querySelector('main.r3-home'); }
  function col(){ var h = host(); return h && h.querySelector('.band ~ .hwrap'); }

  /* ---- what the student has, per class ---- */
  function model(c){
    var now = Date.now(), sum = M().summarize(st.course, get, now), cu = cur(), g = { todo: [], opt: [], done: [], miss: [] };
    (c.assignments || []).filter(function(a){ return Date.parse(a.opens_at) <= now; }).forEach(function(a){
      var s = M().status(a, sum, now, cu), x = { a: a, s: s };
      if(s.state === 'done') g.done.push(x);
      else if(s.state === 'missing'){ if(a.required) g.miss.push(x); }   // closed optional work just drops out
      else if(a.required) g.todo.push(x);
      else g.opt.push(x);
    });
    var du = function(x){ return Date.parse(x.a.due_at) || Infinity; };
    g.todo.sort(function(x, y){ return du(x) - du(y); });
    g.done.sort(function(x, y){ return (y.s.doneAt || 0) - (x.s.doneAt || 0); });
    g.miss.sort(function(x, y){ return du(y) - du(x); });
    var scored = g.done.filter(function(x){ return x.s.score != null; });
    return { c: c, now: now, sum: sum, cur: cu, g: g,
             avg: scored.length ? scored.reduce(function(t, x){ return t + x.s.score; }, 0) / scored.length : null,
             soon: g.todo.filter(function(x){ var d = du(x); return x.s.late || d - now < 7 * 86400000; }).length,
             tm: cu ? M().topicMastery(sum, cu, now) : null };
  }
  function urgent(){
    var n = 0, live = false;
    mine().forEach(function(c){ var m = model(c); n += m.soon; if(c.live) live = true; });
    return { n: n, live: live };
  }

  /* The unit the class is working on: the unit of the next assignment due, else the newest one opened. */
  function classUnit(m){
    var cu = m.cur, C = M().COURSES[st.course]; if(!cu) return '';
    var open = m.g.todo.concat(m.g.opt, m.g.done), pick = m.g.todo[0] || open.sort(function(x, y){ return Date.parse(y.a.opens_at) - Date.parse(x.a.opens_at); })[0];
    if(!pick) return '';
    var sp = pick.a.spec || {}, uid = sp.unit || '';
    if(!uid && sp.topics && sp.topics.length){ var t = (cu.topics || []).filter(function(x){ return x.id === sp.topics[0]; })[0]; uid = t ? t.unit : ''; }
    var u = (cu.units || []).filter(function(x){ return x.id === uid; })[0];
    return u && u.n ? 'Class is on ' + (C.unitWord || 'Unit') + ' ' + u.n : '';
  }

  /* ---- pieces ---- */
  function tag(kind, text){ return '<span class="lvx-tag is-' + kind + '">' + esc(text) + '</span>'; }
  function btn(text, href, ghost){ return '<a class="lvx-btn' + (ghost ? ' is-ghost' : '') + '" href="' + esc(href) + '">' + esc(text) + '</a>'; }
  function bar(p){ return '<div class="lvx-bar"><i style="width:' + Math.max(0, Math.min(100, p)) + '%"></i></div>'; }
  function scoreText(a, s, c){
    if(c && c.hide_scores) return '';   // the teacher keeps scores to themselves (Settings, Class details)
    if(a.kind === 'frq' && s.frq) return s.frq.got + ' of ' + s.frq.of + ' points';
    if(s.score == null) return '';
    if(a.kind === 'mastery') return 'Mastery ' + pct(s.score);
    if(a.kind === 'practice' || a.kind === 'review') return Math.round(s.score * s.answered) + ' of ' + s.answered + ' right';
    return 'Score ' + pct(s.score);
  }
  function topicsLine(a){
    var t = (a.spec && a.spec.topicNames) || [];
    return t.length ? ' · ' + esc(t.slice(0, 3).join(', ')) + (t.length > 3 ? ' and ' + (t.length - 3) + ' more' : '') : '';
  }
  function row(m, x, o){
    o = o || {};
    var a = x.a, s = x.s, c = m.c, ctl = (a.spec && a.spec.controls) || {}, t = '', meta, b;
    if(s.state === 'done'){
      if(s.late) t = tag('warn', 'Done, late');
      var sc = scoreText(a, s, c);
      meta = 'Finished ' + day(s.doneAt) + (s.late && a.due_at ? ', due ' + day(Date.parse(a.due_at)) : '') + (sc ? ' · <b>' + esc(sc) + '</b>' : '');
      b = btn('Open again', S().href(a), true);
    } else if(s.state === 'missing'){
      meta = 'Closed ' + (a.due_at ? day(Date.parse(a.due_at)) : '') + (a.kind === 'practice' || a.kind === 'review' ? ' · ' + s.answered + ' of ' + s.total + ' questions' : '');
      b = btn('Open', S().href(a), true);
    } else {
      if(a.required) t = s.late ? tag('late', 'Late') : tag('due', S().dueWords(a.due_at, m.now));
      meta = KIND[a.kind] || a.kind;
      if(a.kind === 'practice') meta += ' · ' + s.answered + ' of ' + s.total + ' questions';
      else if(a.kind === 'review') meta += s.total ? ' · ' + s.answered + ' of ' + s.total + ' redone' : ' · nothing to redo yet';
      else if(a.kind === 'mastery') meta += ' · ' + (s.met || 0) + ' of ' + s.total + ' topics at the goal';
      else if(a.kind === 'exam' && ctl.timeLimit) meta += ' · ' + ctl.timeLimit + ' minutes' + (ctl.release === 'after_due' ? ' · answers show after the due date' : '');
      else if(a.kind === 'frq') meta += ' · you write it and send it to ' + esc(c.teacher || 'your teacher');
      if(a.kind !== 'exam' && a.kind !== 'frq') meta += topicsLine(a);
      var started = s.answered > 0;
      b = btn(a.kind === 'frq' ? 'Start writing' : started ? 'Keep going' : 'Start', S().href(a), !o.primary);
    }
    var showBar = (a.kind === 'practice' || a.kind === 'review') && s.state !== 'done' && s.state !== 'missing' && s.total;
    return '<div class="lvx-row' + (o.first ? ' is-first' : '') + '"><div class="lvx-main">' + t + '<p class="lvx-t">' + esc(a.title) + '</p><p class="lvx-m">' + meta + '</p>' +
      (showBar ? bar(Math.round(s.answered / s.total * 100)) : '') + '</div>' + b + '</div>';
  }
  function group(title, items, inner, first){
    return '<section class="lvx-g' + (first ? ' is-first' : '') + '" aria-label="' + esc(title) + '"><h3><span>' + esc(title) + '</span><em>' + items + '</em></h3>' + inner + '</section>';
  }
  function fold(key, total, shown, word){
    if(total <= shown) return '';
    return '<p class="lvx-fold"><button type="button" data-lvx="older" data-key="' + key + '">' + (st.older[key] ? 'Show fewer' : 'Show ' + (total - shown) + ' ' + word) + '</button></p>';
  }
  function card(title, inner, id){ return '<section class="lvx-card"' + (id ? ' id="' + id + '"' : '') + '>' + (title ? '<h2>' + title + '</h2>' : '') + inner + '</section>'; }

  function liveCard(c){
    return c.live ? '<section class="lvx-live" aria-label="Live session"><span class="dot" aria-hidden="true"></span><div><p class="b">A live session is open</p><p>' + esc(c.teacher || 'Your teacher') + ' started a live question set.</p></div>' +
      '<a class="lvx-btn is-gold" href="/live.html?c=' + encodeURIComponent(c.id) + '">Join the live session</a></section>' : '';
  }
  function announcements(c, all){
    var ann = (Array.isArray(c.announcements) ? c.announcements : []).slice().sort(function(x, y){ return (Date.parse(y.created_at || y.at) || 0) - (Date.parse(x.created_at || x.at) || 0); });
    if(!ann.length) return '';
    var n = st.older.ann || all ? ann.length : 1;
    return '<ul class="lvx-ann" aria-label="Announcements">' + ann.slice(0, n).map(function(x){
      var at = Date.parse(x.created_at || x.at);
      return '<li><p>' + esc(x.body || x.text || x.message || '') + '</p>' + (at ? '<span>' + esc(day(at)) + '</span>' : '') + '</li>';
    }).join('') + '</ul>' + (all ? '' : fold('ann', ann.length, 1, 'older'));
  }

  /* ---- the four pages ---- */
  function stat(label, big, sub){ return '<div class="lvx-stat"><p class="k">' + label + '</p><p class="v">' + big + '</p><p class="s">' + sub + '</p></div>'; }
  function weakTopics(m){
    if(!m.tm || !m.cur) return [];
    var names = {}; (m.cur.topics || []).forEach(function(t){ names[t.id] = t.title; });
    return Object.keys(m.tm).filter(function(id){ var o = m.tm[id]; return names[id] && o.answered >= 3 && o.value < 0.5; })
      .sort(function(x, y){ return m.tm[x].value - m.tm[y].value; }).map(function(id){ return { id: id, name: names[id], o: m.tm[id] }; });
  }
  function overview(m){
    var g = m.g, c = m.c, now = m.now, dueSoon = g.todo.filter(function(x){ var d = Date.parse(x.a.due_at); return d && d - now < 2 * 86400000 && !x.s.late; }).length;
    var all = g.todo.length + g.opt.length + g.done.length + g.miss.length;
    var out = liveCard(c);
    out += '<div class="lvx-stats' + (c.hide_scores ? ' is-two' : '') + '">' + stat('TO DO', g.todo.length, dueSoon ? dueSoon + ' due today or tomorrow' : g.todo.length ? 'Nothing due in the next 2 days' : 'All caught up') +
      stat('DONE', g.done.length + ' of ' + all, g.miss.length ? g.miss.length + ' missing' : 'None missing') +
      (c.hide_scores ? '' : stat('AVERAGE SCORE', m.avg == null ? '&ndash;' : pct(m.avg), m.avg == null ? 'Nothing scored yet' : 'on finished work')) + '</div>';
    if(g.todo.length) out += card('Next up', row(m, g.todo[0], { primary: true, first: true }));
    var sug = '', rec = g.opt[0], weak = weakTopics(m)[0];
    if(rec) sug += '<div class="lvx-row is-first"><div class="lvx-main">' + tag('rec', (c.teacher || 'Your teacher') + ' recommends') + '<p class="lvx-t">' + esc(rec.a.title) + '</p><p class="lvx-m">' +
      esc(KIND[rec.a.kind]) + topicsLine(rec.a) + '</p></div>' + btn(rec.s.answered ? 'Keep going' : 'Start', S().href(rec.a)) + '</div>';
    if(weak) sug += '<div class="lvx-row' + (rec ? '' : ' is-first') + '"><div class="lvx-main">' + tag('res', 'From your results') + '<p class="lvx-t">' + esc(weak.name) + '</p><p class="lvx-m">You missed ' + weak.o.wrong +
      ' of the ' + weak.o.answered + ' questions you answered here</p></div>' + btn('Practice', M().topicHref(st.course, weak.id), true) + '</div>';
    if(sug) out += card('Practice to strengthen', '<p class="lvx-note">These do not change your class numbers.</p>' + sug);
    var ann = announcements(c, false);
    if(ann) out += card('Latest announcement', ann);
    if(!g.todo.length && !sug && !ann && !g.done.length) out += card('', '<p class="lvx-empty">Nothing assigned right now.</p>');
    return out;
  }
  function assign(m){
    var g = m.g, doneShown = st.older.done ? g.done.length : 3;
    var out = liveCard(m.c), body = '';
    body += group('To do', g.todo.length, g.todo.length ? g.todo.map(function(x, i){ return row(m, x, { primary: i === 0, first: i === 0 }); }).join('') : '<p class="lvx-empty">Nothing to do right now.</p>', true);
    if(g.opt.length) body += group('Optional', g.opt.length, g.opt.map(function(x, i){ return row(m, x, { first: i === 0 }); }).join(''));
    if(g.done.length) body += group('Done', g.done.length, g.done.slice(0, doneShown).map(function(x, i){ return row(m, x, { first: i === 0 }); }).join('') + fold('done', g.done.length, 3, 'older'));
    if(g.miss.length) body += group('Missing', g.miss.length, g.miss.map(function(x, i){ return row(m, x, { first: i === 0 }); }).join(''));
    return out + card('Assignments', body);
  }
  function label(v){ return v >= 0.75 ? ['Strong', 'ok'] : v >= 0.5 ? ['Okay', 'mid'] : ['Needs work', 'low']; }
  function results(m){
    var out = '', weak = weakTopics(m), names = {};
    if(m.cur) (m.cur.topics || []).forEach(function(t){ names[t.id] = t.title; });
    if(weak.length){
      out += '<div class="lvx-weak"><div><p class="b">Practice your weak topics</p><p>' + esc(weak.slice(0, 2).map(function(w){ return w.name; }).join(' and ')) + '. This does not change your class numbers.</p></div>' +
        btn('Start practice', M().topicHref(st.course, weak[0].id)) + '</div>';
    }
    var ids = m.tm ? Object.keys(m.tm).filter(function(id){ return names[id] && m.tm[id].answered > 0; }).sort(function(x, y){ return m.tm[x].value - m.tm[y].value; }) : [];
    var shown = st.older.topics ? ids.length : 6, rows = ids.slice(0, shown).map(function(id){
      var o = m.tm[id], l = label(o.value);
      return '<div class="lvx-trow"><b>' + esc(names[id]) + '</b><div class="lvx-meter is-' + l[1] + '"><i style="width:' + Math.max(4, Math.round(o.value * 100)) + '%"></i></div><span>' + l[0] + '</span>' +
        (l[1] === 'low' && o.answered >= 3 ? '<a href="' + esc(M().topicHref(st.course, id)) + '">Practice</a>' : '<span></span>') + '</div>';
    }).join('');
    out += card('Topics', ids.length ? '<p class="lvx-note">How you are doing on each topic, from your answers in this course. Weakest first.</p>' + rows + fold('topics', ids.length, 6, 'more topics')
      : '<p class="lvx-empty">Your topic results show up here once you have answered some questions in this course.</p>');
    var fin = m.g.done, fs = st.older.fin ? fin.length : 5;
    out += card('Finished work', fin.length ? (m.c.hide_scores ? '<p class="lvx-note">' + esc(m.c.teacher || 'Your teacher') + ' shares scores in class, so they are not shown here.</p>' : '') + fin.slice(0, fs).map(function(x, i){
      var sc = scoreText(x.a, x.s, m.c);
      return '<div class="lvx-frow' + (i ? '' : ' is-first') + '"><div><p class="lvx-t">' + esc(x.a.title) + '</p><p class="lvx-m">' + esc(KIND[x.a.kind]) + ' · ' + esc(day(x.s.doneAt)) + (x.s.late ? ' · late' : '') +
        '</p></div><b>' + (sc ? esc(sc) : 'Done') + '</b></div>';
    }).join('') + fold('fin', fin.length, 5, 'older') : '<p class="lvx-empty">Nothing finished yet.</p>');
    return out;
  }
  function info(m){
    var c = m.c, name = esc(c.teacher || 'Your teacher'), C = M().COURSES[st.course];
    return card('Class info', '<p class="lvx-t">' + name + ' · ' + esc(c.name) + '</p><p class="lvx-m">' + esc(C.name) + '</p>' +
      '<div class="lvx-two"><div><p class="lvx-h">Shared with ' + name + '</p><ul><li>Your ' + esc(C.name) + ' scores, mastery and assignments</li><li>Which questions you miss or flag, and the answers you pick</li><li>When you last studied</li></ul></div>' +
      '<div><p class="lvx-h">Stays private</p><ul><li>Your other courses</li><li>Your streak and study time</li></ul></div></div>' +
      '<div class="lvx-acts"><button type="button" class="lvx-btn is-ghost" data-lvx="leave" data-id="' + esc(c.id) + '">Leave class</button>' +
      '<a class="lvx-btn is-ghost" href="/join.html">Join another class</a>' + (C.frq === false ? '' : '<a class="lvx-btn is-ghost" href="/join.html#jMineSec">Send a free response draft</a>') + '</div>');
  }

  /* ---- the switch, the side menu, drawing ---- */
  function parse(){
    var h = location.hash;
    if(h === '#path') return { view: 'path' };
    var r = /^#class(?:\/(assign|results|info))?$/.exec(h);
    return r ? { view: 'class', sub: r[1] || 'overview' } : null;
  }
  function remember(v){ try{ sessionStorage.setItem(KEY, v.view === 'path' ? 'path' : 'class/' + v.sub); }catch(e){} }
  function pick(){
    var h = parse(); if(h) return h;
    var s = null; try{ s = sessionStorage.getItem(KEY); }catch(e){}
    if(s === 'path') return { view: 'path' };
    if(s && s.indexOf('class/') === 0) return { view: 'class', sub: s.split('/')[1] || 'overview' };
    var u = urgent(), v = u.n || u.live ? { view: 'class', sub: 'overview' } : { view: 'path' };
    remember(v); return v;
  }
  function go(view, sub){
    var v = { view: view, sub: sub || 'overview' }; remember(v);
    try{ history.replaceState(null, '', location.pathname + location.search + (view === 'path' ? '#path' : '#class' + (v.sub === 'overview' ? '' : '/' + v.sub))); }catch(e){}
    render();
  }
  function switchHtml(v){
    var u = urgent(), badge = u.live ? '<b class="lvs-b is-live">Live now</b>' : u.n ? '<b class="lvs-b">' + u.n + ' due</b>' : '';
    return '<div class="lvs-seg" role="tablist" aria-label="Home views"><a href="#path" role="tab" data-lvx="go" data-view="path" aria-selected="' + (v.view === 'path') + '">Path</a>' +
      '<a href="#class" role="tab" data-lvx="go" data-view="class" aria-selected="' + (v.view === 'class') + '">My class' + badge + '</a></div>';
  }
  function side(m, sub, list){
    var due = m.g.todo.length;
    var pick = list.length > 1 ? '<label class="lvx-pick"><span>Class</span><select data-lvx="class">' + list.map(function(c, i){ return '<option value="' + i + '"' + (i === st.ci ? ' selected' : '') + '>' + esc((c.teacher || 'Teacher') + ' · ' + c.name) + '</option>'; }).join('') + '</select></label>' : '';
    var unit = classUnit(m);
    return '<aside class="lvx-side"><p class="lvx-who">' + esc(m.c.teacher || 'Your teacher') + '</p><p class="lvx-cls">' + esc(m.c.name) + '</p>' + (unit ? '<p><span class="lvx-pill">' + esc(unit) + '</span></p>' : '') + pick +
      '<nav aria-label="My class">' + SUBS.map(function(s){
        return '<a href="#class' + (s[0] === 'overview' ? '' : '/' + s[0]) + '" data-lvx="go" data-view="class" data-sub="' + s[0] + '"' + (s[0] === sub ? ' aria-current="page"' : '') + '>' + s[1] +
          (s[0] === 'assign' && due ? '<b>' + due + '</b>' : '') + '</a>';
      }).join('') + '</nav></aside>';
  }
  function render(){
    var h = host(), cl = col(), list = mine();
    if(!h || !cl) return;
    if(!list.length){ unmount(); return; }
    if(st.ci >= list.length) st.ci = 0;
    var sw = document.getElementById('lvSwitch'), vw = document.getElementById('lvClassView');
    if(!sw){ sw = document.createElement('div'); sw.id = 'lvSwitch'; sw.className = 'lvs is-top'; cl.insertBefore(sw, cl.firstChild); }
    if(!vw){ vw = document.createElement('div'); vw.id = 'lvClassView'; vw.className = 'lvx'; sw.insertAdjacentElement('afterend', vw); }
    cl.classList.add('lv-keep');
    var v = pick();
    sw.innerHTML = switchHtml(v);
    h.classList.toggle('lv-on', v.view === 'class');
    vw.hidden = v.view !== 'class';
    if(v.view !== 'class'){ vw.innerHTML = ''; return; }
    var m = model(list[st.ci]), body = ({ overview: overview, assign: assign, results: results, info: info })[v.sub](m);
    vw.innerHTML = side(m, v.sub, list) + '<div class="lvx-body" aria-live="polite">' + body + '</div>';
  }
  function unmount(){
    var h = host(), cl = col();
    ['lvSwitch', 'lvClassView'].forEach(function(id){ var e = document.getElementById(id); if(e) e.remove(); });
    if(h) h.classList.remove('lv-on');
    if(cl) cl.classList.remove('lv-keep');
  }

  function wire(){
    if(st.wired) return; st.wired = true;
    document.addEventListener('click', function(e){
      var t = e.target.closest && e.target.closest('[data-lvx]'); if(!t) return;
      var a = t.getAttribute('data-lvx');
      if(a === 'go'){ e.preventDefault(); go(t.getAttribute('data-view'), t.getAttribute('data-sub')); }
      else if(a === 'older'){ var k = t.getAttribute('data-key'); st.older[k] = !st.older[k]; render(); }
      else if(a === 'leave'){
        if(!confirm('Leave this class? Your teacher will stop seeing your work in it.')) return;
        A().rpcData('class_leave', { p_class: t.getAttribute('data-id') }).then(function(){
          try{ localStorage.removeItem('levlprep_classes_v1'); }catch(x){}
          return S().refresh(true);
        }).then(function(){ st.ci = 0; if(!mine().length){ var h = parse(); if(h) try{ history.replaceState(null, '', location.pathname + location.search); }catch(x){} } render(); });
      }
    });
    document.addEventListener('change', function(e){
      var t = e.target; if(t && t.getAttribute && t.getAttribute('data-lvx') === 'class'){ st.ci = +t.value || 0; render(); }
    });
    window.addEventListener('hashchange', render);
  }
  function css(){
    if(document.getElementById('lvViewCss')) return;
    var l = document.createElement('link'); l.id = 'lvViewCss'; l.rel = 'stylesheet'; l.href = '/assets/class/class-view.css';
    document.head.appendChild(l);
  }
  function mount(course){ st.course = course; css(); wire(); render(); }

  window.LevlClassView = { mount: mount, render: render, unmount: unmount };
})();
