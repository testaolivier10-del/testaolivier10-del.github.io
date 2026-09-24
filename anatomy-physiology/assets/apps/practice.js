/* A&P Practice (docs/anp-spec.md section 10).

   One question at a time with immediate feedback and the full explanation,
   drawn from the course question bank (assets/bank/<chapter>.json, with the
   explanations merged in from <chapter>-why.json, via AnpCore.loadBank). Every answer records
   through AnpQuestions -> AnpCore, so XP, mastery and the review queue move
   the same way they do inside a lesson.

   Modes: a topic, a chapter (body system), a core concept across systems,
   everything you have studied (a lesson completed or a question answered),
   your weak spots (lowest mastery), and the questions you missed (retried
   until right). Only built topics are ever offered. The chapter and core
   concept pages deep-link here: ?topic=, ?chapter=, ?core=, ?mode=.

   Three views share #app: setup, session, summary. */
(function(){
  var BASE = window.ANP_BASE || '';
  var app = document.getElementById('app');
  if(!app) return;
  var hero = document.querySelector('.anp-hero');

  var CUR = window.AnpCurriculum || { chapters: [], topics: [], core: [] };
  var Core = window.AnpCore, Q = window.AnpQuestions;

  function esc(s){ return String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
  function plural(n, w, ws){ return n + ' ' + (n === 1 ? w : (ws || w + 's')); }
  function shuffle(a){ return Q ? Q.shuffle(a) : a.slice(); }
  function byId(list){ var o = {}; list.forEach(function(x){ o[x.id] = x; }); return o; }
  var TOPIC = byId(CUR.topics), CHAPTER = byId(CUR.chapters), CORE = byId(CUR.core);
  function lessonHref(t){ return BASE + 'lessons/' + t + '.html'; }
  function notesHref(t){ return BASE + 'notes/' + t + '.html'; }

  var MODES = [
    { id: 'topic',   title: 'One topic',              desc: 'Drill a single topic.' },
    { id: 'chapter', title: 'One chapter',            desc: 'Every built topic in one body system.' },
    { id: 'core',    title: 'A core concept',         desc: 'One big idea, across every system.' },
    { id: 'studied', title: 'Everything I have studied', desc: 'Mixed, from each topic you have started.' },
    { id: 'weak',    title: 'My weak spots',          desc: 'Your lowest-mastery topics and concepts.' },
    { id: 'missed',  title: 'Questions I missed',     desc: 'Retried until you get each one right.' }
  ];
  var MODE = byId(MODES);
  var COUNTS = [5, 10, 20, 0];   // 0 = all

  var bank = null;               // merged questions, built topics only
  var state = { mode: 'topic', topic: '', chapter: '', core: '', count: 10 };
  var session = null;

  /* ------------------------------------------------------------ data */

  function loadBank(){
    return window.AnpCore.loadBank(BASE).then(function(all){
      return all.filter(function(q){ return TOPIC[q.topic] && TOPIC[q.topic].built; });
    });
  }

  function store(){ return Core ? Core.load() : { q: {}, lessons: {} }; }
  function builtTopics(){ return CUR.topics.filter(function(t){ return t.built && t.qn; }); }
  function builtChapters(){
    var has = {}; builtTopics().forEach(function(t){ has[t.chapter] = 1; });
    return CUR.chapters.filter(function(c){ return has[c.id]; });
  }
  function coresWithQuestions(){
    var n = {}; bank.forEach(function(q){ (q.core || []).forEach(function(c){ n[c] = (n[c] || 0) + 1; }); });
    return CUR.core.filter(function(c){ return n[c.id]; });
  }
  /* "Studied": a lesson completed, or any answer recorded on the topic. */
  function studiedTopics(){
    var d = store(), set = {};
    Object.keys(d.lessons || {}).forEach(function(t){ set[t] = 1; });
    Object.keys(d.q || {}).forEach(function(k){ var r = d.q[k]; if(r && r.t) set[r.t] = 1; });
    return builtTopics().filter(function(t){ return set[t.id]; }).map(function(t){ return t.id; });
  }
  function missedIds(){
    var ids = {}; (Core ? Core.missed() : []).forEach(function(id){ ids[id] = 1; });
    return ids;
  }
  function missedToolCount(){
    return (Core ? Core.missed() : []).filter(function(id){ return id.indexOf(':') > -1; }).length;
  }
  function weakSpots(){
    if(!Core) return { topics: [], core: [] };
    return { topics: Core.weakest(3).filter(function(x){ return x.value < 0.8; }), core: Core.weakestCore(2).filter(function(x){ return x.value < 0.8; }) };
  }

  function poolFor(mode, opt){
    opt = opt || state;
    if(mode === 'topic') return bank.filter(function(q){ return q.topic === opt.topic; });
    if(mode === 'chapter') return bank.filter(function(q){ return q.chapter === opt.chapter; });
    if(mode === 'core') return bank.filter(function(q){ return (q.core || []).indexOf(opt.core) > -1; });
    if(mode === 'studied'){ var s = {}; studiedTopics().forEach(function(t){ s[t] = 1; }); return bank.filter(function(q){ return s[q.topic]; }); }
    if(mode === 'missed'){ var m = missedIds(); return bank.filter(function(q){ return m[q.id]; }); }
    if(mode === 'weak'){
      var w = weakSpots(), wt = {}, wc = {};
      w.topics.forEach(function(x){ wt[x.id] = 1; }); w.core.forEach(function(x){ wc[x.id] = 1; });
      return bank.filter(function(q){ return wt[q.topic] || (q.core || []).some(function(c){ return wc[c]; }); });
    }
    return [];
  }

  /* What to ask first: never tried, then missed, then the ones seen longest
     ago. Mixed modes interleave topics, which beats blocked practice for
     telling similar ideas apart. */
  function pickOrder(pool, mixed){
    var d = store();
    var fresh = [], wrong = [], right = [];
    shuffle(pool).forEach(function(q){
      var r = d.q[q.id];
      if(!r || !r.n) fresh.push(q); else if(!r.right) wrong.push(q); else right.push(q);
    });
    right.sort(function(a, b){ return (d.q[a.id].seen || 0) - (d.q[b.id].seen || 0); });
    var ordered = fresh.concat(wrong, right);
    if(!mixed) return ordered;
    var lanes = {}, order = [];
    ordered.forEach(function(q){ if(!lanes[q.topic]){ lanes[q.topic] = []; order.push(q.topic); } lanes[q.topic].push(q); });
    var out = [];
    while(out.length < ordered.length){
      order.forEach(function(t){ if(lanes[t].length) out.push(lanes[t].shift()); });
    }
    return out;
  }

  /* ------------------------------------------------------------ views */

  function view(name){
    if(hero) hero.hidden = name !== 'setup';
    app.setAttribute('data-view', name);
    window.scrollTo(0, 0);
  }

  function statsHtml(){
    var d = store(), answered = 0;
    Object.keys(d.q || {}).forEach(function(k){ if(d.q[k].n) answered++; });
    var due = Core ? Core.reviewCount() : 0;
    var miss = Object.keys(missedIds()).length;
    var studied = studiedTopics().length;
    function tile(k, v, s){ return '<div class="anp-pr-stat"><span class="anp-pr-stat-k">' + k + '</span><span class="anp-pr-stat-v">' + v + '</span><span class="anp-pr-stat-s">' + s + '</span></div>'; }
    return '<div class="anp-pr-stats">' +
      tile('Answered', answered, answered ? 'questions and tool items' : 'nothing yet') +
      tile('Studied', studied, 'of ' + plural(builtTopics().length, 'built topic')) +
      tile('Due for review', due, due ? '<a href="' + BASE + 'review.html">Open your review queue</a>' : 'nothing due now') +
      tile('To fix', miss, miss ? 'missed, not yet right' : 'no open misses') +
      '</div>';
  }

  function optionList(list, sel, label){
    return list.map(function(x){ return '<option value="' + esc(x.id) + '"' + (x.id === sel ? ' selected' : '') + '>' + esc(label(x)) + '</option>'; }).join('');
  }
  function topicSelect(){
    var groups = builtChapters().map(function(c){
      var ts = builtTopics().filter(function(t){ return t.chapter === c.id; });
      return '<optgroup label="' + esc(c.n + '. ' + c.title) + '">' + optionList(ts, state.topic, function(t){ return t.n + '. ' + t.title; }) + '</optgroup>';
    }).join('');
    return '<label class="anp-pr-field"><span>Topic</span><select id="anp-pr-topic">' + groups + '</select></label>';
  }
  function pickerHtml(){
    var m = state.mode;
    if(m === 'topic') return topicSelect();
    if(m === 'chapter') return '<label class="anp-pr-field"><span>Chapter</span><select id="anp-pr-chapter">' +
      optionList(builtChapters(), state.chapter, function(c){ return c.n + '. ' + c.title; }) + '</select></label>' +
      '<p class="anp-small">Only chapters with built topics are listed. The pilot covers Foundations and the cardiovascular system.</p>';
    if(m === 'core') return '<label class="anp-pr-field"><span>Core concept</span><select id="anp-pr-core">' +
      optionList(coresWithQuestions(), state.core, function(c){ return c.name; }) + '</select></label>';
    if(m === 'studied'){
      var st = studiedTopics();
      return '<p class="anp-small">' + (st.length ? 'From ' + plural(st.length, 'topic') + ': ' + st.map(function(t){ return esc(TOPIC[t].title); }).join(', ') + '.' : '') + '</p>';
    }
    if(m === 'weak'){
      var w = weakSpots();
      var bits = w.topics.map(function(x){ return esc(x.title) + ' (' + Core.pct(x.value) + ')'; }).concat(w.core.map(function(x){ return esc(x.name) + ' (' + Core.pct(x.value) + ')'; }));
      return '<p class="anp-small">' + (bits.length ? 'Lowest mastery right now: ' + bits.join(', ') + '.' : '') + '</p>';
    }
    if(m === 'missed'){
      var tools = missedToolCount();
      return tools ? '<p class="anp-small">' + plural(tools, 'missed tool item') + ' (lab practical, predictions, loops and so on) ' + (tools === 1 ? 'waits' : 'wait') + ' in your <a href="' + BASE + 'review.html">review queue</a>, which links you back to each tool.</p>' : '';
    }
    return '';
  }
  function modeUnavailable(id){
    if(id === 'studied' && !studiedTopics().length) return 'Complete a lesson or answer a question first.';
    if(id === 'missed' && !poolFor('missed').length) return 'Nothing missed. Nice.';
    if(id === 'weak' && !poolFor('weak').length) return Core && Core.weakest(1).length ? 'No topic below 80% mastery.' : 'Answer some questions first.';
    return '';
  }

  function availHtml(){
    var pool = poolFor(state.mode);
    if(!pool.length) return 'No questions match yet.';
    var d = store(), fresh = pool.filter(function(q){ return !d.q[q.id] || !d.q[q.id].n; }).length;
    return plural(pool.length, 'question') + ' available' + (state.mode === 'missed' ? '' : ', ' + fresh + ' you have not tried') + '.';
  }

  function renderSetup(){
    view('setup');
    if(MODE[state.mode] && modeUnavailable(state.mode)) state.mode = 'topic';
    app.innerHTML = statsHtml() +
      '<form class="anp-pr-setup" novalidate>' +
        '<fieldset class="anp-pr-modes"><legend>What do you want to practice?</legend>' +
          MODES.map(function(m){
            var why = modeUnavailable(m.id);
            return '<label class="anp-pr-mode' + (why ? ' is-off' : '') + '"><input type="radio" name="mode" value="' + m.id + '"' +
              (m.id === state.mode ? ' checked' : '') + (why ? ' disabled' : '') + '><span class="anp-pr-mode-t">' + esc(m.title) + '</span>' +
              '<span class="anp-pr-mode-d">' + esc(why || m.desc) + '</span></label>';
          }).join('') +
        '</fieldset>' +
        '<div class="anp-pr-pick">' + pickerHtml() + '</div>' +
        '<fieldset class="anp-pr-count"><legend>How many questions?</legend>' +
          COUNTS.map(function(n){ return '<label class="anp-pr-chip"><input type="radio" name="count" value="' + n + '"' + (n === state.count ? ' checked' : '') + '><span>' + (n || 'All') + '</span></label>'; }).join('') +
        '</fieldset>' +
        '<p class="anp-pr-avail" aria-live="polite">' + availHtml() + '</p>' +
        '<button type="submit" class="btn-press anp-pr-start">Start practice</button>' +
      '</form>';

    var form = app.querySelector('form');
    function syncPickers(){
      var t = app.querySelector('#anp-pr-topic'), c = app.querySelector('#anp-pr-chapter'), k = app.querySelector('#anp-pr-core');
      if(t) state.topic = t.value; if(c) state.chapter = c.value; if(k) state.core = k.value;
    }
    function refresh(){
      syncPickers();
      var n = poolFor(state.mode).length;
      app.querySelector('.anp-pr-avail').textContent = availHtml();
      app.querySelector('.anp-pr-start').disabled = !n;
    }
    form.addEventListener('change', function(e){
      if(e.target.name === 'mode'){
        state.mode = e.target.value;
        app.querySelector('.anp-pr-pick').innerHTML = pickerHtml();
      } else if(e.target.name === 'count'){
        state.count = +e.target.value;
      }
      refresh();
    });
    form.addEventListener('submit', function(e){
      e.preventDefault(); syncPickers();
      start(state.mode, state.count);
    });
    refresh();
  }

  /* ------------------------------------------------------------ session */

  function modeLabel(mode){
    if(mode === 'topic') return 'Topic: ' + TOPIC[state.topic].title;
    if(mode === 'chapter') return 'Chapter: ' + CHAPTER[state.chapter].title;
    if(mode === 'core') return 'Core concept: ' + CORE[state.core].name;
    if(mode === 'retry') return 'Retrying your misses';
    return MODE[mode] ? MODE[mode].title : 'Practice';
  }

  function start(mode, count, fixed){
    var pool = fixed || poolFor(mode);
    if(!pool.length) return;
    var mixed = mode !== 'topic';
    var qs = fixed ? shuffle(fixed) : pickOrder(pool, mixed);
    if(count) qs = qs.slice(0, count);
    session = {
      mode: mode, label: modeLabel(mode), queue: qs, i: 0, results: [], firstTry: {},
      tries: {}, retryUntilRight: mode === 'missed' || mode === 'retry', finished: false
    };
    view('session');
    app.innerHTML = '<div class="anp-pr-session">' +
      '<div class="anp-pr-bar"><span class="anp-pr-label">' + esc(session.label) + '</span>' +
        '<span class="anp-pr-count-l" aria-live="polite"></span>' +
        '<button type="button" class="btn-outline anp-pr-quit">End session</button></div>' +
      '<div class="track thin anp-pr-track" aria-hidden="true"><i style="width:0%"></i></div>' +
      '<div class="anp-pr-stage"></div>' +
      '<div class="anp-pr-after" hidden></div>' +
    '</div>';
    app.querySelector('.anp-pr-quit').addEventListener('click', finish);
    ask();
  }

  function progress(){
    var total = session.queue.length, done = session.i;
    app.querySelector('.anp-pr-count-l').textContent = 'Question ' + Math.min(done + 1, total) + ' of ' + total;
    app.querySelector('.anp-pr-track i').style.width = Math.round(done / total * 100) + '%';
  }

  function ask(){
    if(session.i >= session.queue.length) return finish();
    var q = session.queue[session.i];
    var stage = app.querySelector('.anp-pr-stage'), after = app.querySelector('.anp-pr-after');
    stage.innerHTML = ''; after.hidden = true; after.innerHTML = '';
    progress();
    Q.render(q, stage, { n: session.i + 1, onAnswer: function(res){ answered(q, res); } });
    var stem = stage.querySelector('.anp-q-stem');
    if(stem){ stem.setAttribute('tabindex', '-1'); try{ stem.focus({ preventScroll: true }); }catch(e){ stem.focus(); } }
    window.scrollTo(0, 0);
  }

  function answered(q, res){
    session.tries[q.id] = (session.tries[q.id] || 0) + 1;
    if(!(q.id in session.firstTry)){
      session.firstTry[q.id] = res.correct;
      session.results.push({ q: q, correct: res.correct, score: res.score });
    }
    // Missed mode: a miss comes back at the end of this session (three tries
    // at most, so a session always ends).
    var again = session.retryUntilRight && !res.correct && session.tries[q.id] < 3;
    if(again) session.queue.push(q);
    var t = TOPIC[q.topic];
    var after = app.querySelector('.anp-pr-after');
    var last = session.i + 1 >= session.queue.length;
    after.innerHTML = '<p class="anp-pr-from">From <a href="' + lessonHref(q.topic) + '">' + esc(t.title) + '</a> <span aria-hidden="true">&middot;</span> <a href="' + notesHref(q.topic) + '">notes</a>' +
      (again ? ' <span class="anp-pr-again">This one comes back later in the session.</span>' : '') + '</p>' +
      '<button type="button" class="btn-press anp-pr-next">' + (last ? 'See your results' : 'Next question') + '</button>';
    after.hidden = false;
    var next = after.querySelector('.anp-pr-next');
    next.addEventListener('click', function(){ session.i++; ask(); });
    try{ next.focus({ preventScroll: true }); }catch(e){ next.focus(); }
    app.querySelector('.anp-pr-track i').style.width = Math.round((session.i + 1) / session.queue.length * 100) + '%';
  }

  /* ------------------------------------------------------------ summary */

  function finish(){
    if(!session || session.finished) return;
    session.finished = true;
    var res = session.results, right = res.filter(function(r){ return r.correct; }).length;
    if(res.length && Core) Core.event('anp-session-finish', { mode: session.mode === 'retry' ? 'missed' : session.mode, answered: res.length, correct: right });
    if(!res.length){ renderSetup(); return; }

    var byTopic = {}, topicOrder = [], coreMiss = {};
    res.forEach(function(r){
      var t = r.q.topic;
      if(!byTopic[t]){ byTopic[t] = { n: 0, c: 0 }; topicOrder.push(t); }
      byTopic[t].n++; if(r.correct) byTopic[t].c++;
      if(!r.correct) (r.q.core || []).forEach(function(c){ coreMiss[c] = (coreMiss[c] || 0) + 1; });
    });
    var missedQs = res.filter(function(r){ return !r.correct; }).map(function(r){ return r.q; });
    // Fixed later in the session counts as fixed for the "to retry" list.
    var stillWrong = missedQs.filter(function(q){ var rec = store().q[q.id]; return !rec || !rec.right; });

    var weakTopics = topicOrder.filter(function(t){ return byTopic[t].c < byTopic[t].n; })
      .sort(function(a, b){ return (byTopic[a].c / byTopic[a].n) - (byTopic[b].c / byTopic[b].n); });
    var nextHtml;
    if(weakTopics.length){
      nextHtml = '<ul class="anp-pr-next-list">' + weakTopics.slice(0, 4).map(function(t){
        var b = byTopic[t];
        return '<li><div><b>' + esc(TOPIC[t].title) + '</b><span class="anp-small">' + (b.n - b.c) + ' of ' + b.n + ' missed</span></div>' +
          '<a class="btn-outline" href="' + lessonHref(t) + '">Lesson</a><a class="btn-outline" href="' + notesHref(t) + '">Notes</a></li>';
      }).join('') + '</ul>';
    } else {
      var nxt = suggestNextTopic();
      nextHtml = '<p>Everything right. ' + (nxt ? 'Keep going with <a href="' + lessonHref(nxt.id) + '">' + esc(nxt.title) + '</a>, the next topic you have not started.' : 'Try a timed <a href="' + BASE + 'exams.html">system exam</a> to test it under pressure.') + '</p>';
    }
    var cores = Object.keys(coreMiss).sort(function(a, b){ return coreMiss[b] - coreMiss[a]; }).slice(0, 2).filter(function(c){ return CORE[c]; });
    var coreHtml = cores.length ? '<p class="anp-small">The misses cluster on ' + cores.map(function(c){ return '<a href="' + BASE + 'concepts/' + c + '.html">' + esc(CORE[c].name) + '</a>'; }).join(' and ') + '. The concept page shows the same idea in every system.</p>' : '';

    var pctRight = Math.round(right / res.length * 100);
    view('summary');
    app.innerHTML = '<div class="anp-pr-summary">' +
      '<div class="anp-pr-score"><span class="anp-pr-score-big">' + right + '<small>/' + res.length + '</small></span>' +
        '<span><b>' + pctRight + '% right on the first try</b><span class="anp-small">' + esc(session.label) + '</span></span></div>' +
      '<h2>What to study next</h2>' + nextHtml + coreHtml +
      '<h2>By topic</h2><table class="anp-pr-table"><thead><tr><th scope="col">Topic</th><th scope="col">Right</th><th scope="col">Mastery now</th></tr></thead><tbody>' +
        topicOrder.map(function(t){ var b = byTopic[t], m = Core ? Core.topicMastery(t) : { value: 0 };
          return '<tr><th scope="row"><a href="' + lessonHref(t) + '">' + esc(TOPIC[t].title) + '</a></th><td>' + b.c + '/' + b.n + '</td><td>' + (Core ? Core.pct(m.value) : '') + '</td></tr>'; }).join('') +
      '</tbody></table>' +
      '<div class="anp-pr-actions">' +
        (stillWrong.length ? '<button type="button" class="btn-press" data-act="retry">Retry the ' + plural(stillWrong.length, 'miss', 'misses') + '</button>' : '') +
        '<button type="button" class="btn-press' + (stillWrong.length ? ' alt' : '') + '" data-act="again">Another set like this</button>' +
        '<button type="button" class="btn-outline" data-act="setup">Change what to practice</button>' +
        (Core && Core.reviewCount() ? '<a class="btn-outline" href="' + BASE + 'review.html">Review queue (' + Core.reviewCount() + ' due)</a>' : '') +
      '</div></div>';
    var mode = session.mode, count = state.count;
    app.querySelectorAll('[data-act]').forEach(function(b){
      b.addEventListener('click', function(){
        var a = b.getAttribute('data-act');
        if(a === 'retry') start('retry', 0, stillWrong);
        else if(a === 'again') { if(mode === 'retry' || !poolFor(mode).length) renderSetup(); else start(mode, count); }
        else renderSetup();
      });
    });
    var h = app.querySelector('.anp-pr-score'); h.setAttribute('tabindex', '-1'); h.focus();
  }

  /* The first built topic, in course order, with nothing recorded on it. */
  function suggestNextTopic(){
    var st = {}; studiedTopics().forEach(function(t){ st[t] = 1; });
    var ts = builtTopics();
    for(var i = 0; i < ts.length; i++) if(!st[ts[i].id]) return ts[i];
    return null;
  }

  /* ------------------------------------------------------------ boot */

  function boot(){
    if(!Q || !Core){ app.innerHTML = '<p>Practice could not start. Reload the page to try again.</p>'; return; }
    app.innerHTML = '<p class="anp-small anp-pr-loading">Loading the question bank…</p>';
    loadBank().then(function(b){
      bank = b;
      var ts = builtTopics(), chs = builtChapters(), cs = coresWithQuestions();
      if(!bank.length || !ts.length){ app.innerHTML = '<p>No practice questions are built yet.</p>'; return; }
      var p = new URLSearchParams(location.search);
      state.topic = TOPIC[p.get('topic')] && TOPIC[p.get('topic')].built ? p.get('topic') : ts[0].id;
      state.chapter = chs.some(function(c){ return c.id === p.get('chapter'); }) ? p.get('chapter') : chs[0].id;
      state.core = cs.some(function(c){ return c.id === p.get('core'); }) ? p.get('core') : (cs[0] || {}).id;
      if(p.get('topic') && state.topic === p.get('topic')) state.mode = 'topic';
      else if(p.get('chapter') && state.chapter === p.get('chapter')) state.mode = 'chapter';
      else if(p.get('core') && state.core === p.get('core')) state.mode = 'core';
      else if(MODE[p.get('mode')]) state.mode = p.get('mode');
      renderSetup();
      if(p.toString()){ var s = app.querySelector('.anp-pr-start'); if(s && !s.disabled) s.focus(); }
    }).catch(function(){
      app.innerHTML = '<p>The question bank did not load. Check your connection and reload; once a page has loaded online it also works offline.</p>';
    });
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
