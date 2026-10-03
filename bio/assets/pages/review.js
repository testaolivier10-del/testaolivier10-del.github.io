/* AP® Biology Review: the spaced review queue (forked from
   anatomy-physiology/assets/apps/review.js).

   A miss anywhere in the course (a lesson check, practice, an exam, a tool)
   puts that item in ApBioCore's queue, due ten minutes later; each right
   answer pushes it further out, SM-2 style, until it graduates. This page
   serves what is due now, oldest first, and nothing else.

   A question from a stimulus set comes back alone, under its own stimulus
   panel, so it can be answered without the rest of the set. Tool items (ids
   "<tool>:<content>:<item>", A&P tools contract) cannot be rebuilt here, so
   they link to their tool (window.ApBioTools, when the tools branch adds
   it) and stay due until answered there.

   Free tier: a Unit 1 or 2 question is always served; any other takes one
   from the daily allowance shared with practice (ApBioCore.serve). */
(function(){
  var BASE = window.ApBioBase || '';
  var app = document.getElementById('app');
  if(!app) return;
  var hero = document.querySelector('.bio-hero');
  var CUR = window.ApBioCurriculum || { topics: [], units: [] };
  var Core = window.ApBioCore, Q = window.ApBioQuestions;
  var MIN = 60000, DAY = 86400000, SESSION_CAP = 20;

  function esc(s){ return String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
  function plural(n, w, ws){ return n + ' ' + (n === 1 ? w : (ws || w + 's')); }
  var TOPIC = {}; CUR.topics.forEach(function(t){ TOPIC[t.id] = t; });
  var TOOL = {}; (window.ApBioTools || []).forEach(function(t){ if(t && t.slug) TOOL[t.slug] = t; });

  var bank = null, session = null, refreshTimer = null;

  function loadBank(){
    return Core.loadIndex(BASE).then(function(all){ var out = {}; all.forEach(function(q){ out[q.id] = q; }); return out; });
  }
  function classify(id){
    if(bank[id]) return { kind: 'q', id: id, q: bank[id] };
    var parts = id.split(':');
    if(parts.length > 1 && TOOL[parts[0]] && !(TOOL[parts[0]].premium && Core.locked && Core.locked())) return { kind: 'tool', id: id, tool: TOOL[parts[0]], content: parts[1] || '', item: parts.slice(2).join(':') };
    return null;
  }
  function dueItems(){ return Core.reviewQueue().map(classify).filter(Boolean); }

  function when(ts){
    var d = ts - Date.now();
    if(d <= 0) return 'now';
    if(d < 60 * MIN) return 'in ' + plural(Math.max(1, Math.round(d / MIN)), 'minute');
    if(d < 20 * 60 * MIN) return 'in about ' + plural(Math.round(d / (60 * MIN)), 'hour');
    var days = Math.round(d / DAY), label = new Date(ts).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
    return days <= 1 ? 'tomorrow (' + label + ')' : 'on ' + label + ' (in ' + plural(days, 'day') + ')';
  }
  function upcoming(){
    var d = Core.load(), t = Date.now(), list = [];
    Object.keys(d.q || {}).forEach(function(k){ var r = d.q[k]; if(r.due && r.due > t && classify(k)) list.push(r.due); });
    list.sort(function(a, b){ return a - b; });
    var today = new Date(); today.setHours(23, 59, 59, 999);
    return { next: list[0] || 0, today: list.filter(function(x){ return x <= today.getTime(); }).length, week: list.filter(function(x){ return x <= t + 7 * DAY; }).length };
  }
  function view(name){ if(hero) hero.classList.toggle('bio-hero-min', name !== 'home'); app.setAttribute('data-view', name); window.scrollTo(0, 0); }
  function toolHref(it){ return BASE + 'tools/' + it.tool.slug + '.html' + (it.content ? '#' + encodeURIComponent(it.content) : ''); }
  function toolLine(it){
    var t = Core.load().q[it.id] || {}, topic = TOPIC[t.t];
    return '<li><div><b>' + esc(it.tool.name) + '</b><span class="bio-small">' + esc(it.content.replace(/-/g, ' ')) + (it.item ? ': ' + esc(it.item.replace(/-/g, ' ')) : '') + (topic ? ' · ' + esc(topic.title) : '') + '</span></div>' +
      '<a class="btn-outline" href="' + toolHref(it) + '">Open the tool</a></li>';
  }
  function allowance(){
    var a = Core.quota ? Core.quota() : null;
    return a && a.limit !== Infinity ? '<p class="bio-small bio-pr-allow">Free: Units 1 and 2 are unlimited. Questions from other units: <b>' + a.left + ' of ' + a.limit + '</b> left today, shared with practice.' + (Core.badge ? Core.badge() : '') + '</p>' : '';
  }

  function renderHome(){
    view('home');
    var items = dueItems(), qs = items.filter(function(x){ return x.kind === 'q'; }), tools = items.filter(function(x){ return x.kind === 'tool'; }), up = upcoming();
    var html = '<div class="bio-rv-head"><div class="bio-rv-due"><span class="bio-rv-due-n">' + items.length + '</span><span class="bio-rv-due-t">' + (items.length === 1 ? 'item due now' : 'items due now') + '</span></div>';
    if(!items.length){
      app.innerHTML = html + '<div class="bio-rv-empty"><h2>You are all caught up.</h2>' +
        (up.next ? '<p>The next item comes back <b>' + esc(when(up.next)) + '</b>.' + (up.week > 1 ? ' ' + plural(up.week, 'item') + ' come back within the week.' : '') + '</p>'
          : '<p>Nothing is scheduled. Every question you miss, in a lesson, in practice, in an exam or in a tool, lands here and comes back just before you would forget it.</p>') +
        '<p class="bio-rv-links"><a class="btn-press" href="' + BASE + 'practice.html">Practice</a> <a class="btn-outline" href="' + BASE + 'learn.html">Next lesson</a> <a class="btn-outline" href="' + BASE + 'flashcards.html">Flashcards</a></p></div></div>';
      clearTimeout(refreshTimer);
      if(up.next && up.next - Date.now() < 60 * MIN) refreshTimer = setTimeout(function(){ if(app.getAttribute('data-view') === 'home') renderHome(); }, up.next - Date.now() + 1000);
      return;
    }
    html += '<div class="bio-rv-intro"><p>' + (qs.length ? plural(qs.length, 'question') + ' to answer here' : '') + (qs.length && tools.length ? ', and ' : '') +
      (tools.length ? plural(tools.length, 'tool item') + ' to redo in ' + (tools.length === 1 ? 'its tool' : 'their tools') : '') + '.</p>' +
      '<p class="bio-small">Oldest first. A right answer sends an item further out; a miss brings it back in ten minutes.' + (up.today ? ' ' + plural(up.today, 'more item') + ' come due later today.' : '') + '</p>' +
      '<div class="bio-rv-actions">' + (qs.length ? '<button type="button" class="btn-press" data-n="' + Math.min(SESSION_CAP, qs.length) + '">' + (qs.length > SESSION_CAP ? 'Review the ' + SESSION_CAP + ' oldest' : 'Start review') + '</button>' : '') +
      (qs.length > SESSION_CAP ? '<button type="button" class="btn-outline" data-n="' + qs.length + '">Review all ' + qs.length + '</button>' : '') + '</div></div></div>';
    if(tools.length) html += '<h2 class="bio-rv-h">Due in the tools</h2><ul class="bio-rv-tools">' + tools.map(toolLine).join('') + '</ul>';
    html += allowance() + '<p class="bio-small bio-rv-fc">Glossary terms are on spaced <a href="' + BASE + 'flashcards.html">flashcards</a>.</p>';
    app.innerHTML = html;
    app.querySelectorAll('[data-n]').forEach(function(b){ b.addEventListener('click', function(){ start(+b.getAttribute('data-n')); }); });
  }

  function start(n){
    var items = dueItems(), list = [], qn = 0;
    for(var i = 0; i < items.length && qn < n; i++){ list.push(items[i]); if(items[i].kind === 'q') qn++; }
    var btn = app.querySelector('[data-n="' + n + '"]');
    if(btn){ btn.disabled = true; btn.textContent = 'Loading…'; }
    Core.loadQuestions(BASE, list.filter(function(it){ return it.kind === 'q'; }).map(function(it){ return it.q; })).then(function(full){
      var by = {}; full.forEach(function(q){ by[q.id] = q; });
      list = list.filter(function(it){ if(it.kind !== 'q') return true; it.q = by[it.id]; return !!it.q; });
      begin(list);
    }).catch(function(){ if(btn){ btn.disabled = false; btn.textContent = 'Try again'; } });
  }
  function begin(list){
    session = { list: list, i: 0, answered: 0, right: 0, missed: [], done: false };
    view('session');
    app.innerHTML = '<div class="bio-rv-session"><div class="bio-pr-bar"><span class="bio-pr-label">Spaced review</span><span class="bio-pr-count-l" aria-live="polite"></span>' +
      '<button type="button" class="btn-outline bio-rv-quit">End review</button></div><div class="track thin bio-pr-track" aria-hidden="true"><i style="width:0%"></i></div>' +
      '<h2 class="sr-only">Question</h2><div class="bio-pr-stage"></div><div class="bio-pr-after" hidden></div></div>';
    app.querySelector('.bio-rv-quit').addEventListener('click', finish);
    next();
  }
  function paintProgress(k){
    var total = session.list.length;
    app.querySelector('.bio-pr-count-l').textContent = Math.min(session.i + 1, total) + ' of ' + total;
    app.querySelector('.bio-pr-track i').style.width = Math.round(k / total * 100) + '%';
  }
  function next(){
    if(session.i >= session.list.length) return finish();
    var it = session.list[session.i], stage = app.querySelector('.bio-pr-stage'), after = app.querySelector('.bio-pr-after');
    stage.innerHTML = ''; after.innerHTML = ''; after.hidden = true;
    paintProgress(session.i);
    if(it.kind === 'tool'){
      stage.innerHTML = '<div class="bio-q bio-rv-toolcard"><p class="bio-q-stem" tabindex="-1">This item is from <b>' + esc(it.tool.name) + '</b>.</p><ul class="bio-rv-tools">' + toolLine(it) + '</ul><p class="bio-small">It stays in your queue until you answer it again in the tool.</p></div>';
      showNext(after, 'Skip for now');
    } else if(!Core.serve(it.q)){
      var j = session.i + 1;
      while(j < session.list.length && !(session.list[j].kind === 'tool' || Core.serve(session.list[j].q))) j++;
      if(j < session.list.length){ session.i = j; return next(); }
      stage.innerHTML = Core.gate('daily-limit', 'review-limit', it.q.topic);
      after.innerHTML = '<button type="button" class="btn-press bio-pr-next">' + (session.answered ? 'See how you did' : 'Back to the queue') + '</button>';
      after.hidden = false;
      after.querySelector('.bio-pr-next').addEventListener('click', function(){ if(session.answered) finish(); else { session.done = true; renderHome(); } });
    } else {
      Q.hydrate(stage, [it.q], { onAnswer: function(res){
        session.answered++; if(res.correct) session.right++; else session.missed.push(it.q);
        var t = TOPIC[it.q.topic];
        after.insertAdjacentHTML('afterbegin', '<p class="bio-pr-from">' + (res.correct ? 'Scheduled further out. ' : 'Back in ten minutes. ') + (t && t.built ? 'From <a href="' + BASE + 'lessons/' + it.q.topic + '.html">' + esc(t.title) + '</a>.' : '') + '</p>');
        showNext(after);
        app.querySelector('.bio-pr-track i').style.width = Math.round((session.i + 1) / session.list.length * 100) + '%';
      } });
      var nEl = stage.querySelector('.bio-q-n'); if(nEl) nEl.textContent = (session.i + 1) + '.';
    }
    var first = stage.querySelector('.bio-stim h3') || stage.querySelector('.bio-q-stem');
    if(first){ first.setAttribute('tabindex', '-1'); try{ first.focus({ preventScroll: true }); }catch(e){ first.focus(); } }
  }
  function showNext(after, label){
    var last = session.i + 1 >= session.list.length;
    after.insertAdjacentHTML('beforeend', '<button type="button" class="btn-press bio-pr-next">' + (label || (last ? 'Finish' : 'Next')) + '</button>');
    after.hidden = false;
    var b = after.querySelector('.bio-pr-next');
    b.addEventListener('click', function(){ session.i++; next(); });
    if(!label){ try{ b.focus({ preventScroll: true }); }catch(e){ b.focus(); } }
  }
  function finish(){
    if(!session || session.done) return;
    session.done = true;
    if(session.answered) Core.event('apbio-session-finish', { mode: 'review', answered: session.answered, correct: session.right });
    if(!session.answered){ renderHome(); return; }
    var due = dueItems(), up = upcoming(), left = due.filter(function(x){ return x.kind === 'q'; }).length, leftTools = due.length - left;
    var mt = {}; session.missed.forEach(function(q){ mt[q.topic] = (mt[q.topic] || 0) + 1; });
    var tops = Object.keys(mt).filter(function(t){ return TOPIC[t] && TOPIC[t].built; }).sort(function(a, b){ return mt[b] - mt[a]; });
    view('done');
    app.innerHTML = '<div class="bio-pr-summary"><div class="bio-pr-score"><span class="bio-pr-score-big">' + session.right + '<small>/' + session.answered + '</small></span>' +
      '<span><b>' + (left ? plural(left, 'question') + ' still due' : leftTools ? 'Questions cleared' : 'Queue cleared') + '</b><span class="bio-small">' +
      (leftTools ? plural(leftTools, 'tool item') + ' still ' + (leftTools === 1 ? 'waits' : 'wait') + ' in the tools. ' : '') +
      (session.answered - session.right ? plural(session.answered - session.right, 'miss', 'misses') + ' come back in ten minutes. ' : '') +
      (up.next && !due.length ? 'Next item due ' + esc(when(up.next)) + '.' : '') + '</span></span></div>' +
      (tops.length ? '<h2>Worth a reread</h2><ul class="bio-pr-next-list">' + tops.slice(0, 3).map(function(t){
        return '<li><div><b>' + esc(TOPIC[t].title) + '</b><span class="bio-small">' + plural(mt[t], 'miss', 'misses') + ' in this review</span></div><a class="btn-outline" href="' + BASE + 'lessons/' + t + '.html">Lesson</a><a class="btn-outline" href="' + BASE + 'notes/' + t + '.html">Notes</a></li>';
      }).join('') + '</ul>' : '') +
      '<div class="bio-pr-actions">' + (left ? '<button type="button" class="btn-press" data-act="more">Keep going</button>' : '') +
      '<button type="button" class="btn-outline" data-act="home">Back to the queue</button><a class="btn-outline" href="' + BASE + 'practice.html">Practice something new</a></div></div>';
    app.querySelectorAll('[data-act]').forEach(function(b){ b.addEventListener('click', function(){ if(b.getAttribute('data-act') === 'more') start(SESSION_CAP); else renderHome(); }); });
    var h = app.querySelector('.bio-pr-score'); h.setAttribute('tabindex', '-1'); h.focus();
  }

  function boot(){
    if(!Q || !Core){ app.innerHTML = '<p>Review could not start. Reload the page to try again.</p>'; return; }
    app.innerHTML = '<p class="bio-small">Loading your queue…</p>';
    loadBank().then(function(b){ bank = b; renderHome(); }, function(){ app.innerHTML = '<p>The question bank did not load. Check your connection and reload.</p>'; });
    window.addEventListener('storage', function(e){ if(e.key === Core.KEY && bank && app.getAttribute('data-view') === 'home') renderHome(); });
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
