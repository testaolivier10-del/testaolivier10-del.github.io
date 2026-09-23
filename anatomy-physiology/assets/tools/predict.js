/* Predict the change (docs/anp-spec.md section 8.2).

   A scenario states a perturbation. The learner predicts, for each variable,
   whether it increases, decreases or does not change, then checks. Every
   variable is marked on its own (partial credit) and shows its causal chain
   as a row of "causes" arrows; "Show the chain" draws the whole stage as one
   branching diagram built from the shared steps. Level 4 scenarios run in two
   stages: the immediate change, then the state after compensation.

   Content: data/tools/predict.json (checked by
   scripts/lib/anp-tool-checks/predict.mjs). Each answer is recorded through
   AnpCore.toolResult('predict', ...) with the id
   predict:<scenario>:<variable> (plus -<stage> for level 4), so misses reach
   the review queue and the dashboard's accuracy-by-level rows. Each finished
   scenario sends the anp-prediction event.

   URL: ?chapter=<id>, ?topic=<id>, ?level=1..4 preset the filters;
   ?id=<scenario> opens one scenario directly. */
(function(){
  'use strict';
  var app = document.getElementById('app');
  if(!app) return;
  var KIND = 'predict';
  var DIRS = [
    { v: 'up', label: 'Increases', glyph: '↑', word: 'increases' },
    { v: 'down', label: 'Decreases', glyph: '↓', word: 'decreases' },
    { v: 'none', label: 'No change', glyph: '=', word: 'does not change' }
  ];
  var LEVEL_NAMES = { 1: 'One step, one system', 2: 'Several steps, one system', 3: 'Across systems', 4: 'Time course: the change, then compensation' };
  var DATA = null;
  var filters = { chapter: '', topic: '', level: 0, length: '8' };
  var session = null;
  var uid = 0;

  function esc(s){ return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function core(){ return window.AnpCore || null; }
  function cur(){ return window.AnpCurriculum || { chapters: [], topics: [] }; }
  function base(){ return window.ANP_BASE || '../'; }
  function shuffle(a){ a = a.slice(); for(var i = a.length - 1; i > 0; i--){ var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function param(k){ try{ return new URLSearchParams(window.location.search).get(k); }catch(e){ return null; } }
  function dirOf(v){ for(var i = 0; i < DIRS.length; i++) if(DIRS[i].v === v) return DIRS[i]; return DIRS[2]; }
  function topicOf(id){ var ts = cur().topics; for(var i = 0; i < ts.length; i++) if(ts[i].id === id) return ts[i]; return { id: id, title: id, chapter: '' }; }
  function chapterOf(id){ var cs = cur().chapters; for(var i = 0; i < cs.length; i++) if(cs[i].id === id) return cs[i]; return { id: id, title: id }; }
  function itemId(s, st, v){ return 'predict:' + s.id + ':' + v.id + (st.id ? '-' + st.id : ''); }
  function report(id){ return window.LevlReport ? window.LevlReport.button('anp', id) : ''; }
  function levelKey(n){ return n >= 3 ? 'analyze' : 'apply'; }
  function arrow(){
    return '<svg class="pc-arr" viewBox="0 0 26 12" width="26" height="12" role="img" aria-label="causes" focusable="false"><path class="causes" d="M1 6 H22"/></svg>';
  }
  function focusEl(el){ if(!el) return; if(!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '-1'); try{ el.focus({ preventScroll: false }); }catch(e){ el.focus(); } }

  /* ------------------------------------------------------------ load */
  app.classList.add('pc-app');
  app.innerHTML = '<p class="pc-loading anp-hint">Loading scenarios…</p>';
  fetch(app.getAttribute('data-src') || (base() + 'data/tools/predict.json'))
    .then(function(r){ if(!r.ok) throw new Error(r.status); return r.json(); })
    .then(init)
    .catch(function(){ app.innerHTML = '<p class="anp-hint">The scenarios could not be loaded. Check your connection and reload the page.</p>'; });

  function init(data){
    DATA = data;
    DATA.scenarios.forEach(function(s){
      if(!s.stages) s.stages = [{ id: '', label: '', prompt: '', start: s.start, steps: s.steps, variables: s.variables }];
      s.chapter = topicOf(s.topic).chapter;
    });
    var ch = param('chapter'), tp = param('topic'), lv = +param('level'), one = param('id');
    if(tp && hasTopic(tp)){ filters.topic = tp; filters.chapter = topicOf(tp).chapter; }
    else if(ch && chapters().indexOf(ch) > -1) filters.chapter = ch;
    if(lv >= 1 && lv <= 4) filters.level = lv;
    var direct = one && DATA.scenarios.filter(function(s){ return s.id === one; })[0];
    if(direct) startSession([direct]); else renderSetup();
  }

  function hasTopic(id){ return DATA.scenarios.some(function(s){ return s.topic === id; }); }
  function chapters(){
    var seen = [];
    DATA.scenarios.forEach(function(s){ if(seen.indexOf(s.chapter) < 0) seen.push(s.chapter); });
    var order = cur().chapters.map(function(c){ return c.id; });
    return seen.sort(function(a, b){ return order.indexOf(a) - order.indexOf(b); });
  }
  function topicsIn(chId){
    var ids = [];
    DATA.scenarios.forEach(function(s){ if((!chId || s.chapter === chId) && ids.indexOf(s.topic) < 0) ids.push(s.topic); });
    return ids.map(topicOf).sort(function(a, b){ return (a.n || 0) - (b.n || 0); });
  }
  function matching(){
    return DATA.scenarios.filter(function(s){
      return (!filters.chapter || s.chapter === filters.chapter) && (!filters.topic || s.topic === filters.topic) && (!filters.level || s.level === filters.level);
    });
  }
  /* The learner's latest result on a scenario, from the progress store. */
  function lastScore(s){
    var c = core(); if(!c) return null;
    var q = c.load().q, n = 0, right = 0, total = 0;
    s.stages.forEach(function(st){ st.variables.forEach(function(v){ total++; var r = q[itemId(s, st, v)]; if(r && r.n){ n++; if(r.right) right++; } }); });
    return n === total ? { right: right, total: total } : null;
  }

  /* ------------------------------------------------------------ setup screen */
  function renderSetup(){
    session = null;
    var list = matching();
    var chs = chapters(), tps = topicsIn(filters.chapter);
    var stats = core() ? core().toolStats(KIND) : { n: 0, c: 0, by: {} };
    var len = filters.length === 'all' ? list.length : Math.min(list.length, +filters.length);
    app.innerHTML =
      '<section class="pc-panel" aria-labelledby="pc-setup-h">' +
        '<h2 id="pc-setup-h" class="pc-h2">Choose your scenarios</h2>' +
        '<p class="pc-intro">Each scenario changes one thing in the body. Predict whether each variable <b>increases</b>, <b>decreases</b> or <b>does not change</b>. Then check, and follow the chain of causes behind every answer.</p>' +
        '<div class="pc-filters">' +
          '<label class="pc-field"><span>Chapter</span><select id="pc-chapter"><option value="">All chapters</option>' +
            chs.map(function(c){ return '<option value="' + esc(c) + '"' + (c === filters.chapter ? ' selected' : '') + '>' + esc(chapterOf(c).title) + '</option>'; }).join('') + '</select></label>' +
          '<label class="pc-field"><span>Topic</span><select id="pc-topic"><option value="">All topics</option>' +
            tps.map(function(t){ return '<option value="' + esc(t.id) + '"' + (t.id === filters.topic ? ' selected' : '') + '>' + (t.n ? t.n + '. ' : '') + esc(t.title) + '</option>'; }).join('') + '</select></label>' +
          '<div class="pc-field"><span id="pc-level-l">Level</span><div class="pc-seg" role="group" aria-labelledby="pc-level-l">' +
            [0, 1, 2, 3, 4].map(function(n){ return '<button type="button" data-level="' + n + '" aria-pressed="' + (filters.level === n) + '"' + (n ? ' title="' + esc(LEVEL_NAMES[n]) + '"' : '') + '>' + (n ? 'Level ' + n : 'All') + '</button>'; }).join('') +
          '</div></div>' +
          '<label class="pc-field"><span>Session length</span><select id="pc-len">' +
            ['5', '8', 'all'].map(function(v){ return '<option value="' + v + '"' + (v === filters.length ? ' selected' : '') + '>' + (v === 'all' ? 'Every match' : v + ' scenarios') + '</option>'; }).join('') + '</select></label>' +
        '</div>' +
        '<div class="pc-startrow"><button type="button" class="btn-press" id="pc-start"' + (list.length ? '' : ' disabled') + '>' + (list.length ? 'Start ' + len + ' scenario' + (len === 1 ? '' : 's') : 'No scenarios match') + '</button>' +
          '<span class="anp-small" aria-live="polite">' + list.length + (list.length === 1 ? ' scenario matches' : ' scenarios match') + ' your filters. Easier levels come first.</span></div>' +
      '</section>' +
      '<section class="pc-panel pc-ladder" aria-labelledby="pc-ladder-h">' +
        '<h2 id="pc-ladder-h" class="pc-h3">The four levels</h2>' +
        '<ol class="pc-levels">' + [1, 2, 3, 4].map(function(n){
          var g = stats.by && stats.by['Level ' + n];
          return '<li><span class="pc-lv">' + n + '</span><span class="pc-lv-name">' + esc(LEVEL_NAMES[n]) + '</span>' +
            '<span class="pc-lv-acc">' + (g && g.n ? Math.round(100 * g.c / g.n) + '% of ' + g.n + ' predictions' : 'not tried yet') + '</span></li>';
        }).join('') + '</ol>' +
      '</section>' +
      '<section class="pc-panel" aria-labelledby="pc-list-h">' +
        '<h2 id="pc-list-h" class="pc-h3">Or pick one scenario</h2>' +
        (list.length ? '<ul class="pc-list">' + list.map(function(s){
          var last = lastScore(s);
          return '<li><button type="button" class="pc-pick" data-id="' + esc(s.id) + '"><span class="pc-pick-t">' + esc(s.title) + '</span>' +
            '<span class="pc-pick-m">Level ' + s.level + ' · ' + esc(topicOf(s.topic).title) + '</span>' +
            (last ? '<span class="pc-pick-s' + (last.right === last.total ? ' full' : '') + '">Last try: ' + last.right + ' of ' + last.total + '</span>' : '') + '</button></li>';
        }).join('') + '</ul>' : '<p class="anp-hint">No scenarios match. Try a different level or chapter.</p>') +
      '</section>';

    app.querySelector('#pc-chapter').addEventListener('change', function(e){ filters.chapter = e.target.value; filters.topic = ''; renderSetup(); focusEl(app.querySelector('#pc-chapter')); });
    app.querySelector('#pc-topic').addEventListener('change', function(e){ filters.topic = e.target.value; renderSetup(); focusEl(app.querySelector('#pc-topic')); });
    app.querySelector('#pc-len').addEventListener('change', function(e){ filters.length = e.target.value; renderSetup(); focusEl(app.querySelector('#pc-len')); });
    app.querySelectorAll('[data-level]').forEach(function(b){
      b.addEventListener('click', function(){ filters.level = +b.getAttribute('data-level'); renderSetup(); focusEl(app.querySelector('[data-level="' + filters.level + '"]')); });
    });
    var start = app.querySelector('#pc-start');
    start.addEventListener('click', function(){ startSession(ordered(list).slice(0, len)); });
    app.querySelectorAll('.pc-pick').forEach(function(b){
      b.addEventListener('click', function(){ var id = b.getAttribute('data-id'); startSession(DATA.scenarios.filter(function(s){ return s.id === id; })); });
    });
  }

  /* Easier levels first, shuffled within a level. */
  function ordered(list){
    var out = [];
    [1, 2, 3, 4].forEach(function(n){ out = out.concat(shuffle(list.filter(function(s){ return s.level === n; }))); });
    return out;
  }

  /* ------------------------------------------------------------ session */
  function startSession(list){
    session = { list: list, i: 0, results: [] };
    renderScenario();
  }

  function renderScenario(){
    var s = session.list[session.i], n = session.list.length;
    var t = topicOf(s.topic);
    var topicLink = t.built ? '<a class="pc-tag" href="' + esc(base() + 'lessons/' + t.id + '.html') + '">' + esc(t.title) + '</a>' : '<span class="pc-tag">' + esc(t.title) + '</span>';
    var res = { id: s.id, title: s.title, level: s.level, right: 0, total: 0, missed: [] };
    session.results[session.i] = res;
    app.innerHTML =
      '<div class="pc-progress"><span class="anp-small">Scenario ' + (session.i + 1) + ' of ' + n + '</span>' +
        '<div class="track thin" aria-hidden="true"><i style="width:' + Math.round(100 * session.i / n) + '%"></i></div>' +
        '<button type="button" class="link-quiet pc-quit">' + (n > 1 ? 'End session' : 'All scenarios') + '</button></div>' +
      '<article class="pc-card" aria-labelledby="pc-title">' +
        '<div class="pc-meta"><span class="pc-tag pc-tag-lv">Level ' + s.level + ' · ' + esc(LEVEL_NAMES[s.level]) + '</span>' + topicLink + '</div>' +
        '<h2 id="pc-title" class="pc-title" tabindex="-1">' + esc(s.title) + '</h2>' +
        '<p class="pc-setup-text">' + esc(s.setup) + '</p>' +
        '<div class="pc-stages"></div>' +
      '</article>';
    app.querySelector('.pc-quit').addEventListener('click', function(){ if(n > 1 && session.results.some(function(r){ return r && r.total; })) renderSummary(); else renderSetup(); });
    renderStage(s, 0, res);
    focusEl(app.querySelector('#pc-title'));
  }

  function renderStage(s, k, res){
    var st = s.stages[k], two = s.stages.length > 1;
    var picks = {};
    var sid = 'pc' + (++uid);
    var box = document.createElement('section');
    box.className = 'pc-stage';
    box.setAttribute('aria-labelledby', sid + '-h');
    box.innerHTML =
      (two ? '<h3 class="pc-stage-h" id="' + sid + '-h" tabindex="-1"><span class="pc-stage-n">Stage ' + (k + 1) + ' of 2</span> ' + esc(st.label) + '</h3><p class="pc-prompt">' + esc(st.prompt) + '</p>'
           : '<h3 class="pc-stage-h pc-sr" id="' + sid + '-h">Your predictions</h3>') +
      '<div class="pc-vars">' + st.variables.map(function(v, i){
        var nid = sid + '-v' + i;
        return '<div class="pc-var" data-k="' + i + '">' +
          '<div class="pc-var-name" id="' + nid + '">' + esc(v.name) + '</div>' +
          '<div class="pc-dir" role="radiogroup" aria-labelledby="' + nid + '">' + DIRS.map(function(d, j){
            return '<button type="button" role="radio" aria-checked="false" tabindex="' + (j === 0 ? '0' : '-1') + '" data-v="' + d.v + '"><span class="pc-g" aria-hidden="true">' + d.glyph + '</span> ' + d.label + '</button>';
          }).join('') + '</div>' +
          '<div class="pc-fb" hidden></div>' +
        '</div>';
      }).join('') + '</div>' +
      '<div class="pc-actions"><button type="button" class="btn-press sm pc-check" disabled>Check predictions</button><span class="anp-small pc-left" aria-live="polite"></span></div>' +
      '<div class="pc-after" hidden></div>';
    app.querySelector('.pc-stages').appendChild(box);
    var check = box.querySelector('.pc-check'), left = box.querySelector('.pc-left');
    function updateLeft(){
      var remaining = st.variables.length - Object.keys(picks).length;
      check.disabled = remaining > 0;
      left.textContent = remaining > 0 ? remaining + ' left to predict' : 'Ready to check';
    }
    updateLeft();

    box.querySelectorAll('.pc-dir').forEach(function(g, i){
      var btns = [].slice.call(g.querySelectorAll('button'));
      function choose(b, focus){
        if(box.classList.contains('is-done')) return;
        btns.forEach(function(x){ x.setAttribute('aria-checked', 'false'); x.tabIndex = -1; });
        b.setAttribute('aria-checked', 'true'); b.tabIndex = 0;
        if(focus) b.focus();
        picks[i] = b.getAttribute('data-v');
        updateLeft();
      }
      btns.forEach(function(b, j){
        b.addEventListener('click', function(){ choose(b, false); });
        b.addEventListener('keydown', function(e){
          var d = (e.key === 'ArrowRight' || e.key === 'ArrowDown') ? 1 : (e.key === 'ArrowLeft' || e.key === 'ArrowUp') ? -1 : 0;
          if(!d) return;
          e.preventDefault();
          choose(btns[(j + d + btns.length) % btns.length], true);
        });
      });
    });

    check.addEventListener('click', function(){
      if(box.classList.contains('is-done')) return;
      box.classList.add('is-done');
      var items = [], right = 0;
      st.variables.forEach(function(v, i){
        var ok = picks[i] === v.answer;
        if(ok) right++;
        var id = itemId(s, st, v);
        items.push({ id: id, correct: ok, topic: s.topic, core: s.core, level: levelKey(s.level), diff: Math.min(3, s.level), group: 'Level ' + s.level });
        if(!ok) res.missed.push({ name: v.name, stage: two ? st.label : '', answer: v.answer });
        var row = box.querySelector('.pc-var[data-k="' + i + '"]');
        row.classList.add(ok ? 'is-ok' : 'is-no');
        row.querySelectorAll('button').forEach(function(b){
          b.disabled = true;
          var val = b.getAttribute('data-v');
          if(val === v.answer) b.classList.add('is-key');
          if(val === picks[i] && !ok) b.classList.add('is-wrong');
        });
        var fb = row.querySelector('.pc-fb');
        var ans = dirOf(v.answer);
        fb.innerHTML =
          '<p class="pc-verdict">' + (ok ? '<b class="ok">Right:</b> it ' + ans.word + '.' : '<b class="no">Not quite.</b> You said it ' + dirOf(picks[i]).word + '; it ' + ans.word + '.') + '</p>' +
          chainHtml(st, v) +
          '<p class="pc-why">' + esc(v.why) + '</p>' +
          '<div class="pc-report">' + report(id) + '</div>';
        fb.hidden = false;
      });
      res.right += right; res.total += st.variables.length;
      if(core()) core().toolResult(KIND, items);
      if(window.LevlSound && window.LevlSound.answer) try{ window.LevlSound.answer(right === st.variables.length); }catch(e){}
      check.hidden = true;
      left.textContent = '';
      var last = k === s.stages.length - 1;
      if(last) core() && core().event('anp-prediction', { scenario: s.id, level: s.level, correct: res.right, total: res.total });
      var after = box.querySelector('.pc-after');
      var treeId = sid + '-tree';
      var nextLabel = !last ? 'Continue: ' + s.stages[k + 1].label.toLowerCase() : session.i < session.list.length - 1 ? 'Next scenario' : (session.list.length > 1 ? 'See your summary' : 'Back to all scenarios');
      after.innerHTML =
        '<p class="pc-score" role="status"><b>' + right + ' of ' + st.variables.length + '</b> right' + (right === st.variables.length ? '. Every prediction correct.' : '. Missed predictions are in your review queue.') + '</p>' +
        '<div class="pc-after-btns"><button type="button" class="btn-outline pc-show" aria-expanded="false" aria-controls="' + treeId + '">Show the chain</button>' +
        '<button type="button" class="btn-press sm pc-next">' + esc(nextLabel) + '</button></div>' +
        '<div class="anp-fig pc-tree" id="' + treeId + '" hidden>' + treeHtml(st, picks) + '</div>';
      after.hidden = false;
      var show = after.querySelector('.pc-show'), tree = after.querySelector('.pc-tree');
      show.addEventListener('click', function(){
        var open = tree.hidden;
        tree.hidden = !open;
        show.setAttribute('aria-expanded', String(open));
        show.textContent = open ? 'Hide the chain' : 'Show the chain';
      });
      after.querySelector('.pc-next').addEventListener('click', function(){
        this.disabled = true;
        if(!last){ renderStage(s, k + 1, res); focusEl(app.querySelectorAll('.pc-stage-h')[k + 1]); return; }
        if(session.i < session.list.length - 1){ session.i++; renderScenario(); window.scrollTo(0, 0); return; }
        if(session.list.length > 1) renderSummary(); else renderSetup();
        window.scrollTo(0, 0);
      });
      focusEl(after.querySelector('.pc-score'));
    });
  }

  /* One variable's chain: the stage's start, then each step, as boxes joined
     by "causes" arrows. The last box carries the variable's direction. */
  function chainHtml(st, v){
    var steps = [st.start].concat(v.chain.map(function(k){ return st.steps[k]; }));
    return '<ol class="anp-fig pc-chain" aria-label="Chain of causes">' + steps.map(function(t, i){
      var end = i === steps.length - 1;
      return '<li>' + (i ? arrow() : '') + '<span class="pc-node' + (i === 0 ? ' pc-root' : '') + (end ? ' pc-end ' + v.answer : '') + '">' + esc(t) +
        (end ? ' <span class="pc-g" aria-hidden="true">' + dirOf(v.answer).glyph + '</span>' : '') + '</span></li>';
    }).join('') + '</ol>';
  }

  /* The whole stage as one diagram: the variables' chains merged where they
     share steps. Straight runs stay on one line; the diagram only indents
     where the chain branches, so it fits a phone. */
  function treeHtml(st, picks){
    var root = { text: st.start, kids: [], vars: [] };
    st.variables.forEach(function(v, i){
      var node = root;
      v.chain.forEach(function(key){
        var kid = null;
        for(var j = 0; j < node.kids.length; j++) if(node.kids[j].key === key) kid = node.kids[j];
        if(!kid){ kid = { key: key, text: st.steps[key], kids: [], vars: [] }; node.kids.push(kid); }
        node = kid;
      });
      node.vars.push({ v: v, ok: picks[i] === v.answer });
    });
    function badge(x){
      return '<span class="pc-badge ' + x.v.answer + '"><span class="pc-mark ' + (x.ok ? 'ok' : 'no') + '">' + (x.ok ? '✓' : '✗') + '</span> ' + esc(x.v.name) + ' <span aria-hidden="true">' + dirOf(x.v.answer).glyph + '</span><span class="pc-sr"> ' + dirOf(x.v.answer).word + (x.ok ? ', you predicted it' : ', you missed it') + '</span></span>';
    }
    function nodeBox(n, isRoot){
      var cls = 'pc-node' + (isRoot ? ' pc-root' : '') + (n.vars.length ? ' pc-end ' + n.vars[0].v.answer : '');
      return '<span class="' + cls + '">' + esc(n.text) + '</span>' + (n.vars.length ? '<span class="pc-badges">' + n.vars.map(badge).join('') + '</span>' : '');
    }
    function segment(n, isRoot){
      var run = [n];
      while(run[run.length - 1].kids.length === 1 && !run[run.length - 1].vars.length) run.push(run[run.length - 1].kids[0]);
      var lastN = run[run.length - 1];
      var html = '<div class="pc-run">' + run.map(function(x, i){ return '<span class="pc-step">' + (i ? arrow() : '') + nodeBox(x, isRoot && i === 0) + '</span>'; }).join('') + '</div>';
      if(lastN.kids.length) html += '<ul class="pc-branch">' + lastN.kids.map(function(kid){ return '<li>' + arrow() + '<div class="pc-sub">' + segment(kid, false) + '</div></li>'; }).join('') + '</ul>';
      return html;
    }
    return '<p class="pc-tree-cap">How the change reaches every variable. Each arrow means “causes”.</p>' + segment(root, true);
  }

  /* ------------------------------------------------------------ summary */
  function renderSummary(){
    var rs = session.results.filter(function(r){ return r && r.total; });
    var right = 0, total = 0, by = {};
    rs.forEach(function(r){
      right += r.right; total += r.total;
      var g = by[r.level] || (by[r.level] = { right: 0, total: 0 });
      g.right += r.right; g.total += r.total;
    });
    var missedScenarios = rs.filter(function(r){ return r.missed.length; });
    if(core()) core().event('anp-session-finish', { mode: 'predict', answered: total, correct: right });
    app.innerHTML =
      '<section class="pc-panel pc-summary" aria-labelledby="pc-sum-h">' +
        '<h2 id="pc-sum-h" class="pc-h2" tabindex="-1">Session summary</h2>' +
        '<p class="pc-big"><b>' + right + ' of ' + total + '</b> predictions right' + (total ? ' (' + Math.round(100 * right / total) + '%)' : '') + ' across ' + rs.length + ' scenario' + (rs.length === 1 ? '' : 's') + '.</p>' +
        '<ul class="pc-bylevel">' + Object.keys(by).sort().map(function(l){
          var g = by[l], p = Math.round(100 * g.right / g.total);
          return '<li><span class="pc-lv">' + l + '</span><span class="pc-lv-name">' + esc(LEVEL_NAMES[l]) + '</span><span class="track thin" aria-hidden="true"><i style="width:' + p + '%"></i></span><span class="pc-lv-acc">' + g.right + ' of ' + g.total + '</span></li>';
        }).join('') + '</ul>' +
        '<h3 class="pc-h3">Scenario by scenario</h3>' +
        '<ul class="pc-sumlist">' + rs.map(function(r){
          return '<li><span class="pc-sum-t">' + esc(r.title) + ' <span class="anp-small">Level ' + r.level + '</span></span><span class="pc-sum-s' + (r.right === r.total ? ' full' : '') + '">' + r.right + ' of ' + r.total + '</span>' +
            (r.missed.length ? '<span class="pc-sum-miss">Missed: ' + r.missed.map(function(m){ return esc(m.name) + (m.stage ? ' (' + esc(m.stage.toLowerCase()) + ')' : '') + ' ' + dirOf(m.answer).word; }).join('; ') + '.</span>' : '') + '</li>';
        }).join('') + '</ul>' +
        (missedScenarios.length ? '<p class="anp-hint">Every missed prediction is in your <a href="' + esc(base() + 'review.html') + '">review queue</a>, and comes back just before you would forget it.</p>' : '<p class="anp-hint">A clean sweep. Try a higher level next.</p>') +
        '<div class="pc-after-btns">' +
          (missedScenarios.length ? '<button type="button" class="btn-press sm pc-retry">Retry the ' + missedScenarios.length + ' scenario' + (missedScenarios.length === 1 ? '' : 's') + ' you missed</button>' : '') +
          '<button type="button" class="btn-outline pc-new">Choose new scenarios</button>' +
        '</div>' +
      '</section>';
    var retry = app.querySelector('.pc-retry');
    if(retry) retry.addEventListener('click', function(){
      var ids = missedScenarios.map(function(r){ return r.id; });
      startSession(DATA.scenarios.filter(function(s){ return ids.indexOf(s.id) > -1; }));
    });
    app.querySelector('.pc-new').addEventListener('click', renderSetup);
    focusEl(app.querySelector('#pc-sum-h'));
  }
})();
