/* A&P Review: the spaced review queue (docs/anp-spec.md sections 8 and 10).

   A miss anywhere in the course (a lesson check, practice, an exam, a tool)
   puts that item in AnpCore's queue, due ten minutes later; each right answer
   pushes it further out, SM-2 style, until it graduates. This page serves
   what is due now, oldest first, and nothing else: no new material, a queue
   that drains to zero.

   Question items render here with AnpQuestions. Tool items (ids like
   "predict:hemorrhage-l4:heart-rate", whose first part is a tool slug) cannot
   be rebuilt outside their tool, so they link to it instead; they stay due
   until they are answered there.

   The free tier (spec decision 72): a Foundations question is always served;
   one from any other chapter takes one from the daily allowance shared with
   practice (AnpCore.serve). Out of it, the item stays due, kept for later. */
(function(){
  var BASE = window.ANP_BASE || '';
  var app = document.getElementById('app');
  if(!app) return;
  var hero = document.querySelector('.page-head, .anp-hero');
  var CUR = window.AnpCurriculum || { topics: [], chapters: [] };
  var Core = window.AnpCore, Q = window.AnpQuestions;
  var MIN = 60000, DAY = 86400000;
  var SESSION_CAP = 20;

  function esc(s){ return String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
  function plural(n, w, ws){ return n + ' ' + (n === 1 ? w : (ws || w + 's')); }
  var TOPIC = {}; CUR.topics.forEach(function(t){ TOPIC[t.id] = t; });
  var TOOL = {}; (window.AnpTools || []).forEach(function(t){ TOOL[t.slug] = t; });

  var bank = null;     // id -> question stub (AnpCore.loadIndex); a session
                       // fetches only its questions' chapters (loadQuestions)
  var session = null;
  var refreshTimer = null;

  function loadBank(){
    return window.AnpCore.loadIndex(BASE).then(function(all){
      var out = {};
      all.forEach(function(q){ out[q.id] = q; });
      return out;
    });
  }

  /* A due id becomes a question, a tool item, or nothing (a question since
     retired from the bank, or a tool that no longer exists). */
  function classify(id){
    if(bank[id]) return { kind: 'q', id: id, q: bank[id] };
    var parts = id.split(':');
    // A Premium tool's item waits, kept, while Premium is locked.
    if(parts.length > 1 && TOOL[parts[0]] && !(TOOL[parts[0]].premium && Core.locked && Core.locked())) return { kind: 'tool', id: id, tool: TOOL[parts[0]], content: parts[1] || '', item: parts.slice(2).join(':') };
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
    var a = Core.quota ? Core.quota() : null;
    var free = a && a.limit !== Infinity ? LevlStudy.free('Free: <b>' + a.left + ' of ' + a.limit + '</b> questions left today, shared with practice. Foundations questions are unlimited.' + (Core.badge ? Core.badge() : '')) : '';
    var main;
    if(!items.length){
      main = '<section class="cx-card cx-queue">' + LevlStudy.empty({ num: 0, unit: 'due now', h: 'You are all caught up',
        p: up.next
          ? 'The next item comes back <b>' + esc(when(up.next)) + '</b>.' + (up.week > 1 ? ' ' + plural(up.week, 'item') + ' come back within the week.' : '')
          : 'Nothing is scheduled. Every question you miss, in a lesson, in practice, in an exam or in a tool, lands here and comes back just before you would forget it.',
        actions: [{ href: BASE + 'practice.html', label: 'Practice', primary: true }, { href: BASE + 'learn.html', label: 'Next lesson' }, { href: BASE + 'flashcards.html', label: 'Flashcards' }] }) + '</section>';
    } else {
      var acts = [];
      if(qs.length) acts.push({ act: 'n', attrs: ' data-n="' + Math.min(SESSION_CAP, qs.length) + '"', label: qs.length > SESSION_CAP ? 'Review the ' + SESSION_CAP + ' oldest' : 'Start review', primary: true });
      if(qs.length > SESSION_CAP) acts.push({ act: 'n', attrs: ' data-n="' + qs.length + '"', label: 'Review all ' + qs.length });
      main = '<section class="cx-card cx-queue">' + LevlStudy.empty({ num: items.length, unit: items.length === 1 ? 'item due' : 'items due',
        h: (qs.length ? plural(qs.length, 'question') + ' to answer here' : '') + (qs.length && tools.length ? ', and ' : '') + (tools.length ? plural(tools.length, 'tool item') + ' to redo in ' + (tools.length === 1 ? 'its tool' : 'their tools') : ''),
        p: 'Oldest first. A right answer sends an item further out; a miss brings it back in ten minutes.' + (up.today ? ' ' + plural(up.today, 'more item') + ' come due later today.' : ''),
        actions: acts }) + free + '</section>' +
        (tools.length ? '<section><h2 class="cx-h2">Due in the tools</h2><ul class="cx-list anp-rv-tools">' + tools.map(toolLine).join('') + '</ul></section>' : '');
    }
    var d = Core.load(), answered = 0;
    Object.keys(d.q || {}).forEach(function(k){ if(d.q[k].n) answered++; });
    var miss = (Core.missed ? Core.missed() : []).length;
    app.innerHTML = '<div class="cx-body has-rail"><div class="cx-main">' + main + '</div>' +
      LevlStudy.rail({
        stats: [
          ['Answered', answered, answered ? 'questions and tool items' : 'nothing yet'],
          ['Due for review', items.length, items.length ? 'waiting in your queue' : 'nothing due now', items.length ? 'is-due' : ''],
          ['To fix', miss, miss ? 'missed, not yet right' : 'no open misses'],
          ['This week', up.week, up.week ? 'coming back in 7 days' : 'nothing scheduled']
        ],
        links: [
          { href: BASE + 'flashcards.html', title: 'Flashcards', sub: 'Glossary terms on spaced cards.' },
          { href: BASE + 'exams.html', title: 'Exams', sub: 'Unit quizzes, system exams and finals.' }
        ]
      }) + '</div>';
    if(!items.length){
      clearTimeout(refreshTimer);
      if(up.next && up.next - Date.now() < 60 * MIN) refreshTimer = setTimeout(function(){ if(app.getAttribute('data-view') === 'home') renderHome(); }, up.next - Date.now() + 1000);
      return;
    }
    app.querySelectorAll('[data-n]').forEach(function(b){
      b.addEventListener('click', function(){ start(+b.getAttribute('data-n')); });
    });
  }

  function start(n){
    // Tool items are interleaved where they fall in the queue so the order
    // stays "oldest first"; they only count toward the cap when served.
    var items = dueItems(), list = [], qn = 0;
    for(var i = 0; i < items.length && qn < n; i++){ list.push(items[i]); if(items[i].kind === 'q') qn++; }
    var qs = list.filter(function(it){ return it.kind === 'q'; });
    var btn = app.querySelector('[data-n="' + n + '"]');
    if(btn){ btn.disabled = true; btn.textContent = 'Loading…'; }
    Core.loadQuestions(BASE, qs.map(function(it){ return it.q; })).then(function(full){
      var by = {}; full.forEach(function(q){ by[q.id] = q; });
      list = list.filter(function(it){ if(it.kind !== 'q') return true; it.q = by[it.id]; return !!it.q; });
      begin(list);
    }).catch(function(){
      if(btn){ btn.disabled = false; btn.textContent = 'Try again'; }
    });
  }

  function begin(list){
    session = { list: list, i: 0, answered: 0, right: 0, missed: [], done: false };
    view('session');
    app.innerHTML = '<div class="cx-session anp-rv-session">' +
      '<div class="cx-sbar"><span class="cx-sbar-t">Spaced review</span><span class="cx-sbar-n anp-pr-count-l" aria-live="polite"></span>' +
      '<button type="button" class="cx-end anp-rv-quit">End review</button></div>' +
      '<div class="cx-progress anp-pr-track" aria-hidden="true"><i style="width:0%"></i></div>' +
      '<div class="anp-pr-stage"></div><div class="cx-next-row anp-pr-after" hidden></div></div>';
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
      stage.innerHTML = '<div class="anp-q cx-q anp-rv-toolcard"><p class="anp-q-stem" tabindex="-1">This item is from <b>' + esc(it.tool.name) + '</b>.</p>' +
        '<ul class="cx-list anp-rv-tools">' + toolLine(it) + '</ul><p class="anp-small">It stays in your queue until you answer it again in the tool.</p></div>';
      showNext(after, 'Skip for now');
    } else if(!Core.serve(it.q)){
      // Out of today's allowance: the rest stays due. Skip to the next
      // Foundations item, or end with what was answered.
      var j = session.i + 1;
      while(j < session.list.length && !(session.list[j].kind === 'tool' || Core.serve(session.list[j].q))) j++;
      if(j < session.list.length){ session.i = j; return next(); }
      stage.innerHTML = Core.gate('daily-limit', 'review-limit', '', 'Foundations questions stay free and unlimited, and the allowance resets at midnight. The rest of your queue stays due.');
      after.innerHTML = '<button type="button" class="btn-press cx-next anp-pr-next">' + (session.answered ? 'See how you did' : 'Back to the queue') + '</button>';
      after.hidden = false;
      after.querySelector('.anp-pr-next').addEventListener('click', function(){ if(session.answered) finish(); else { session.done = true; renderHome(); } });
    } else {
      Q.render(it.q, stage, { n: session.i + 1, onAnswer: function(res){
        session.answered++; if(res.correct) session.right++; else session.missed.push(it.q);
        var t = TOPIC[it.q.topic];
        after.insertAdjacentHTML('afterbegin', '<p class="cx-from anp-pr-from">' + (res.correct ? 'Scheduled further out. ' : 'Back in ten minutes. ') +
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
    after.insertAdjacentHTML('beforeend', '<button type="button" class="btn-press cx-next anp-pr-next">' + (label || (last ? 'Finish' : 'Next')) + '</button>');
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
      // One next step (assets/next-step.js): what is still due here comes first.
      (window.LevlNextStep ? LevlNextStep('anp', { due: { n: left, noun: 'question', act: function(){ start(SESSION_CAP); } },
        also: [{ label: 'Back to the queue', act: renderHome }] }) : '') + '</div>';
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
