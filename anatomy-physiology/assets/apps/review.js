/* A&P Review: the spaced review queue (docs/anp-spec.md sections 8 and 10).

   A miss anywhere in the course (a lesson check, practice, an exam, a tool)
   puts that item in AnpCore's queue, due ten minutes later; each right answer
   pushes it further out, SM-2 style, until it graduates. This page serves
   what is due now, oldest first, and nothing else: no new material, a queue
   that drains to zero.

   Question items render here with AnpQuestions. Tool items (ids like
   "predict:hemorrhage-l4:heart-rate", whose first part is a tool slug) cannot
   be rebuilt outside their tool, so they link to it instead; they stay due
   until they are answered there. */
(function(){
  var BASE = window.ANP_BASE || '';
  var app = document.getElementById('app');
  if(!app) return;
  var hero = document.querySelector('.anp-hero');
  var CUR = window.AnpCurriculum || { topics: [], chapters: [] };
  var Core = window.AnpCore, Q = window.AnpQuestions;
  var MIN = 60000, DAY = 86400000;
  var SESSION_CAP = 20;

  function esc(s){ return String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
  function plural(n, w, ws){ return n + ' ' + (n === 1 ? w : (ws || w + 's')); }
  var TOPIC = {}; CUR.topics.forEach(function(t){ TOPIC[t.id] = t; });
  var TOOL = {}; (window.AnpTools || []).forEach(function(t){ TOOL[t.slug] = t; });

  var bank = null;     // id -> merged question
  var session = null;
  var refreshTimer = null;

  function loadBank(){
    function get(u){ return fetch(BASE + u).then(function(r){ if(!r.ok) throw new Error(u); return r.json(); }); }
    return Promise.all([get('assets/bank-core.json'), get('assets/bank-why.json').catch(function(){ return {}; })]).then(function(res){
      var why = res[1] || {}, out = {};
      res[0].forEach(function(q){
        var w = why[q.id];
        if(w){ if(w.why) q.why = w.why; if(w.variables) q.variables = w.variables; }
        out[q.id] = q;
      });
      return out;
    });
  }

  /* A due id becomes a question, a tool item, or nothing (a question since
     retired from the bank, or a tool that no longer exists). */
  function classify(id){
    if(bank[id]) return { kind: 'q', id: id, q: bank[id] };
    var parts = id.split(':');
    if(parts.length > 1 && TOOL[parts[0]]) return { kind: 'tool', id: id, tool: TOOL[parts[0]], content: parts[1] || '', item: parts.slice(2).join(':') };
    return null;
  }
  function dueItems(){ return Core.reviewQueue().map(classify).filter(Boolean); }

  function when(ts){
    var d = ts - Date.now();
    if(d <= 0) return 'now';
    if(d < 60 * MIN){ var m = Math.max(1, Math.round(d / MIN)); return 'in ' + plural(m, 'minute'); }
    if(d < 20 * 60 * MIN){ var h = Math.round(d / (60 * MIN)); return 'in about ' + plural(h, 'hour'); }
    var date = new Date(ts);
    var days = Math.round(d / DAY);
    var label = date.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
    return days <= 1 ? 'tomorrow (' + label + ')' : 'on ' + label + ' (in ' + plural(days, 'day') + ')';
  }

  /* Everything scheduled but not yet due, for the empty state and the
     look-ahead. */
  function upcoming(){
    var d = Core.load(), t = Date.now(), list = [];
    Object.keys(d.q || {}).forEach(function(k){ var r = d.q[k]; if(r.due && r.due > t && classify(k)) list.push(r.due); });
    list.sort(function(a, b){ return a - b; });
    var today = new Date(); today.setHours(23, 59, 59, 999);
    return {
      next: list[0] || 0,
      today: list.filter(function(x){ return x <= today.getTime(); }).length,
      week: list.filter(function(x){ return x <= t + 7 * DAY; }).length,
      total: list.length
    };
  }

  function view(name){
    if(hero) hero.hidden = name !== 'home';
    app.setAttribute('data-view', name);
    window.scrollTo(0, 0);
  }

  function toolHref(it){ return BASE + 'tools/' + it.tool.slug + '.html' + (it.content ? '#' + encodeURIComponent(it.content) : ''); }
  function toolLine(it){
    var t = Core.load().q[it.id] || {};
    var topic = TOPIC[t.t];
    return '<li><div><b>' + esc(it.tool.name) + '</b><span class="anp-small">' + esc(it.content.replace(/-/g, ' ')) + (it.item ? ': ' + esc(it.item.replace(/-/g, ' ')) : '') + (topic ? ' · ' + esc(topic.title) : '') + '</span></div>' +
      '<a class="btn-outline" href="' + toolHref(it) + '">Open the tool</a></li>';
  }

  function renderHome(){
    view('home');
    var items = dueItems();
    var qs = items.filter(function(x){ return x.kind === 'q'; });
    var tools = items.filter(function(x){ return x.kind === 'tool'; });
    var up = upcoming();
    var html = '<div class="anp-rv-head">' +
      '<div class="anp-rv-due"><span class="anp-rv-due-n">' + items.length + '</span><span class="anp-rv-due-t">' + (items.length === 1 ? 'item due now' : 'items due now') + '</span></div>';
    if(!items.length){
      html += '<div class="anp-rv-empty"><h2>You are all caught up.</h2>' +
        (up.next
          ? '<p>The next item comes back <b>' + esc(when(up.next)) + '</b>.' + (up.week > 1 ? ' ' + plural(up.week, 'item') + ' come back within the week.' : '') + '</p>'
          : '<p>Nothing is scheduled. Every question you miss, in a lesson, in practice, in an exam or in a tool, lands here and comes back just before you would forget it.</p>') +
        '<p class="anp-rv-links"><a class="btn-press" href="' + BASE + 'practice.html">Practice</a> <a class="btn-outline" href="' + BASE + 'learn.html">Next lesson</a></p></div></div>';
      app.innerHTML = html;
      // Something due within the hour: show it the moment it is due.
      clearTimeout(refreshTimer);
      if(up.next && up.next - Date.now() < 60 * MIN) refreshTimer = setTimeout(function(){ if(app.getAttribute('data-view') === 'home') renderHome(); }, up.next - Date.now() + 1000);
      return;
    }
    html += '<div class="anp-rv-intro"><p>' + (qs.length ? plural(qs.length, 'question') + ' to answer here' : '') + (qs.length && tools.length ? ', and ' : '') +
      (tools.length ? plural(tools.length, 'tool item') + ' to redo in ' + (tools.length === 1 ? 'its tool' : 'their tools') : '') + '.</p>' +
      '<p class="anp-small">Oldest first. A right answer sends an item further out; a miss brings it back in ten minutes.' +
      (up.today ? ' ' + plural(up.today, 'more item') + ' come due later today.' : '') + '</p>' +
      '<div class="anp-rv-actions">' +
        (qs.length ? '<button type="button" class="btn-press" data-n="' + Math.min(SESSION_CAP, qs.length) + '">' + (qs.length > SESSION_CAP ? 'Review the ' + SESSION_CAP + ' oldest' : 'Start review') + '</button>' : '') +
        (qs.length > SESSION_CAP ? '<button type="button" class="btn-outline" data-n="' + qs.length + '">Review all ' + qs.length + '</button>' : '') +
      '</div></div></div>';
    if(tools.length) html += '<h2 class="anp-rv-h">Due in the tools</h2><ul class="anp-rv-tools">' + tools.map(toolLine).join('') + '</ul>';
    app.innerHTML = html;
    app.querySelectorAll('[data-n]').forEach(function(b){
      b.addEventListener('click', function(){ start(+b.getAttribute('data-n')); });
    });
  }

  function start(n){
    // Tool items are interleaved where they fall in the queue so the order
    // stays "oldest first"; they only count toward the cap when served.
    var items = dueItems(), list = [], qn = 0;
    for(var i = 0; i < items.length && qn < n; i++){ list.push(items[i]); if(items[i].kind === 'q') qn++; }
    session = { list: list, i: 0, answered: 0, right: 0, missed: [], done: false };
    view('session');
    app.innerHTML = '<div class="anp-rv-session">' +
      '<div class="anp-pr-bar"><span class="anp-pr-label">Spaced review</span><span class="anp-pr-count-l" aria-live="polite"></span>' +
      '<button type="button" class="btn-outline anp-rv-quit">End review</button></div>' +
      '<div class="track thin anp-pr-track" aria-hidden="true"><i style="width:0%"></i></div>' +
      '<div class="anp-pr-stage"></div><div class="anp-pr-after" hidden></div></div>';
    app.querySelector('.anp-rv-quit').addEventListener('click', finish);
    next();
  }

  function paintProgress(doneCount){
    var total = session.list.length;
    app.querySelector('.anp-pr-count-l').textContent = Math.min(session.i + 1, total) + ' of ' + total;
    app.querySelector('.anp-pr-track i').style.width = Math.round(doneCount / total * 100) + '%';
  }

  function next(){
    if(session.i >= session.list.length) return finish();
    var it = session.list[session.i];
    var stage = app.querySelector('.anp-pr-stage'), after = app.querySelector('.anp-pr-after');
    stage.innerHTML = ''; after.innerHTML = ''; after.hidden = true;
    paintProgress(session.i);
    if(it.kind === 'tool'){
      stage.innerHTML = '<div class="anp-q anp-rv-toolcard"><p class="anp-q-stem" tabindex="-1">This item is from <b>' + esc(it.tool.name) + '</b>.</p>' +
        '<ul class="anp-rv-tools">' + toolLine(it) + '</ul><p class="anp-small">It stays in your queue until you answer it again in the tool.</p></div>';
      showNext(after, 'Skip for now');
    } else {
      Q.render(it.q, stage, { n: session.i + 1, onAnswer: function(res){
        session.answered++; if(res.correct) session.right++; else session.missed.push(it.q);
        var t = TOPIC[it.q.topic];
        after.insertAdjacentHTML('afterbegin', '<p class="anp-pr-from">' + (res.correct ? 'Scheduled further out. ' : 'Back in ten minutes. ') +
          (t && t.built ? 'From <a href="' + BASE + 'lessons/' + it.q.topic + '.html">' + esc(t.title) + '</a>.' : '') + '</p>');
        showNext(after);
        app.querySelector('.anp-pr-track i').style.width = Math.round((session.i + 1) / session.list.length * 100) + '%';
      } });
    }
    var stem = stage.querySelector('.anp-q-stem');
    if(stem){ stem.setAttribute('tabindex', '-1'); try{ stem.focus({ preventScroll: true }); }catch(e){ stem.focus(); } }
  }

  function showNext(after, label){
    var last = session.i + 1 >= session.list.length;
    after.insertAdjacentHTML('beforeend', '<button type="button" class="btn-press anp-pr-next">' + (label || (last ? 'Finish' : 'Next')) + '</button>');
    after.hidden = false;
    var b = after.querySelector('.anp-pr-next');
    b.addEventListener('click', function(){ session.i++; next(); });
    if(!label){ try{ b.focus({ preventScroll: true }); }catch(e){ b.focus(); } }
  }

  function finish(){
    if(!session || session.done) return;
    session.done = true;
    if(session.answered) Core.event('anp-session-finish', { mode: 'review', answered: session.answered, correct: session.right });
    if(!session.answered){ renderHome(); return; }
    var due = dueItems(), up = upcoming();
    var left = due.filter(function(x){ return x.kind === 'q'; }).length, leftTools = due.length - left;
    view('done');
    var missTopics = {};
    session.missed.forEach(function(q){ missTopics[q.topic] = (missTopics[q.topic] || 0) + 1; });
    var mt = Object.keys(missTopics).filter(function(t){ return TOPIC[t] && TOPIC[t].built; }).sort(function(a, b){ return missTopics[b] - missTopics[a]; });
    app.innerHTML = '<div class="anp-pr-summary">' +
      '<div class="anp-pr-score"><span class="anp-pr-score-big">' + session.right + '<small>/' + session.answered + '</small></span>' +
      '<span><b>' + (left ? plural(left, 'question') + ' still due' : leftTools ? 'Questions cleared' : 'Queue cleared') + '</b><span class="anp-small">' +
      (leftTools ? plural(leftTools, 'tool item') + ' still ' + (leftTools === 1 ? 'waits' : 'wait') + ' in ' + (leftTools === 1 ? 'its tool' : 'the tools') + '. ' : '') +
      (session.answered - session.right ? plural(session.answered - session.right, 'miss', 'misses') + ' come back in ten minutes. ' : '') +
      (up.next && !due.length ? 'Next item due ' + esc(when(up.next)) + '.' : '') + '</span></span></div>' +
      (mt.length ? '<h2>Worth a reread</h2><ul class="anp-pr-next-list">' + mt.slice(0, 3).map(function(t){
        return '<li><div><b>' + esc(TOPIC[t].title) + '</b><span class="anp-small">' + plural(missTopics[t], 'miss', 'misses') + ' in this review</span></div>' +
          '<a class="btn-outline" href="' + BASE + 'lessons/' + t + '.html">Lesson</a><a class="btn-outline" href="' + BASE + 'notes/' + t + '.html">Notes</a></li>';
      }).join('') + '</ul>' : '') +
      '<div class="anp-pr-actions">' + (left ? '<button type="button" class="btn-press" data-act="more">Keep going</button>' : '') +
      '<button type="button" class="btn-outline" data-act="home">Back to the queue</button>' +
      '<a class="btn-outline" href="' + BASE + 'practice.html">Practice something new</a></div></div>';
    app.querySelectorAll('[data-act]').forEach(function(b){
      b.addEventListener('click', function(){ if(b.getAttribute('data-act') === 'more') start(SESSION_CAP); else renderHome(); });
    });
    var h = app.querySelector('.anp-pr-score'); h.setAttribute('tabindex', '-1'); h.focus();
  }

  function boot(){
    if(!Q || !Core){ app.innerHTML = '<p>Review could not start. Reload the page to try again.</p>'; return; }
    app.innerHTML = '<p class="anp-small">Loading your queue…</p>';
    loadBank().then(function(b){ bank = b; renderHome(); })
      .catch(function(){ app.innerHTML = '<p>The question bank did not load. Check your connection and reload.</p>'; });
    // Another tab (a lesson, a tool) can add to the queue; refresh the home
    // view when it does, never a running session.
    window.addEventListener('storage', function(e){ if(e.key === Core.KEY && bank && app.getAttribute('data-view') === 'home') renderHome(); });
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
