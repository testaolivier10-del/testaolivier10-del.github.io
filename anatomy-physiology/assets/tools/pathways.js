/* A&P pathway tracer (docs/anp-spec.md section 8.4, docs/anp-tools-contract.md).

   Content: data/tools/pathways.json (read from #app[data-src]). Each pathway is
   played three ways, and each way is one scored item with a permanent id:
     pathways:<pathway>:order     put every step in order (up/down buttons,
                                  per-position feedback)
     pathways:<pathway>:missing   choose the step that fills the gap
     pathways:<pathway>:error     find the one step that is wrong
   After answering, the pathway plays step by step on a diagram drawn in the
   course's visual language ("flows to" arrows for blood, "causes" arrows for
   mechanisms), with each step's "why it comes here".

   Scoring: the first check of a variant on a page visit is recorded through
   AnpCore.toolResult (XP, mastery, misses to review) and fires
   anp-pathway-complete. "Try again" is practice and is not recorded again. */
(function(){
  var app = document.getElementById('app');
  if(!app) return;
  var BASE = window.ANP_BASE || '../';
  var SVGNS = 'http://www.w3.org/2000/svg';
  var VARIANTS = [
    { key: 'order', tab: 'Put in order', short: 'Order' },
    { key: 'missing', tab: 'Missing step', short: 'Missing' },
    { key: 'error', tab: 'Spot the error', short: 'Error' }
  ];
  var DATA = null;
  var scored = {};           // item ids already recorded on this visit
  var player = null;         // the running diagram player, if any
  var booted = false;        // after the first render, moving focus is expected

  function esc(s){ return String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
  function html(s){ return String(s == null ? '' : s); }  // our own content may carry <sub>, <i>
  function plain(s){ return String(s == null ? '' : s).replace(/<[^>]+>/g, ''); }
  function shuffle(a){ a = a.slice(); for(var i = a.length - 1; i > 0; i--){ var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function cur(){ return window.AnpCurriculum || { chapters: [], topics: [] }; }
  function topicInfo(id){ var ts = cur().topics; for(var i = 0; i < ts.length; i++) if(ts[i].id === id) return ts[i]; return null; }
  function chapterInfo(id){ var cs = cur().chapters; for(var i = 0; i < cs.length; i++) if(cs[i].id === id) return cs[i]; return null; }
  function chapterOf(p){ var t = topicInfo(p.topic); return t ? t.chapter : ''; }
  function itemId(p, v){ return 'pathways:' + p.id + ':' + v; }
  function report(id){ return window.LevlReport ? window.LevlReport.button('anp', id) : ''; }
  function find(id){ for(var i = 0; i < DATA.pathways.length; i++) if(DATA.pathways[i].id === id) return DATA.pathways[i]; return null; }
  function status(id){
    try{ var r = window.AnpCore && window.AnpCore.load().q[id]; if(!r || !r.n) return 'new'; return r.right ? 'right' : 'missed'; }catch(e){ return 'new'; }
  }
  function topicLink(id){
    var t = topicInfo(id);
    if(!t) return esc(id);
    return t.built ? '<a href="' + esc(BASE + 'lessons/' + t.id + '.html') + '">' + esc(t.title) + '</a>' : esc(t.title);
  }
  function stopPlayer(){ if(player){ player.stop(); player = null; } }

  /* ---------------------------------------------------------------- routing */
  function route(){
    stopPlayer();
    var h = (location.hash || '').replace(/^#/, '').split('/');
    var p = h[0] ? find(decodeURIComponent(h[0])) : null;
    if(p){
      var v = h[1] && /^(order|missing|error)$/.test(h[1]) ? h[1] : 'order';
      showPathway(p, v, false);
    } else showList();
  }
  function go(hash){
    if(location.hash === hash) route(); else location.hash = hash;
  }

  /* -------------------------------------------------------------- list view */
  function params(){
    var out = {};
    (location.search || '').replace(/^\?/, '').split('&').forEach(function(kv){ if(!kv) return; var p = kv.split('='); out[decodeURIComponent(p[0])] = decodeURIComponent(p[1] || ''); });
    return out;
  }
  var listFilter = null;
  function showList(){
    var q = params();
    if(listFilter === null){
      listFilter = 'all';
      if(q.chapter) listFilter = q.chapter;
      else if(q.topic){ var t = topicInfo(q.topic); if(t) listFilter = t.chapter; }
    }
    var chapters = [];
    DATA.pathways.forEach(function(p){ var c = chapterOf(p); if(c && chapters.indexOf(c) < 0) chapters.push(c); });
    var order = cur().chapters.map(function(c){ return c.id; });
    chapters.sort(function(a, b){ return order.indexOf(a) - order.indexOf(b); });
    if(listFilter !== 'all' && chapters.indexOf(listFilter) < 0) listFilter = 'all';

    var done = 0, total = DATA.pathways.length * 3;
    DATA.pathways.forEach(function(p){ VARIANTS.forEach(function(v){ if(status(itemId(p, v.key)) === 'right') done++; }); });

    var chips = '<div class="pw-chips" role="group" aria-label="Filter by chapter">' +
      '<button type="button" class="pw-chip" data-f="all" aria-pressed="' + (listFilter === 'all') + '">All</button>' +
      chapters.map(function(c){ var ch = chapterInfo(c); return '<button type="button" class="pw-chip" data-f="' + esc(c) + '" aria-pressed="' + (listFilter === c) + '">' + esc(ch ? ch.title : c) + '</button>'; }).join('') + '</div>';

    var groups = chapters.filter(function(c){ return listFilter === 'all' || listFilter === c; }).map(function(c){
      var ch = chapterInfo(c);
      var ps = DATA.pathways.filter(function(p){ return chapterOf(p) === c; });
      var topicOrder = cur().topics.map(function(t){ return t.id; });
      ps.sort(function(a, b){ return topicOrder.indexOf(a.topic) - topicOrder.indexOf(b.topic); });
      return '<section class="pw-group"><h2>' + esc(ch ? ch.title : c) + '</h2><ul class="pw-cards">' + ps.map(function(p){
        var t = topicInfo(p.topic);
        return '<li><a class="pw-card" href="#' + esc(p.id) + '">' +
          '<span class="pw-card-title">' + esc(p.title) + '</span>' +
          '<span class="pw-card-meta">' + p.steps.length + ' steps' + (t ? ' · ' + esc(t.title) : '') + '</span>' +
          '<span class="pw-dots">' + VARIANTS.map(function(v){
            var s = status(itemId(p, v.key));
            var word = s === 'right' ? 'done' : s === 'missed' ? 'missed, try again' : 'not tried';
            return '<span class="pw-dot is-' + s + '" title="' + esc(v.tab + ': ' + word) + '"><span class="sr-only">' + esc(v.tab + ': ' + word) + '. </span><span aria-hidden="true">' + (s === 'right' ? '✓' : s === 'missed' ? '✗' : '') + '</span></span>';
          }).join('') + '</span></a></li>';
      }).join('') + '</ul></section>';
    }).join('');

    app.innerHTML = '<div class="pw">' +
      '<p class="pw-lead">Each pathway comes three ways: <b>put the steps in order</b>, <b>find the missing step</b>, and <b>spot the error</b>. After you answer, the pathway plays step by step on a diagram, with why each step comes where it does.</p>' +
      '<p class="anp-small pw-progress">' + done + ' of ' + total + ' done right · the dots show order, missing step and error</p>' +
      chips + groups + '</div>';
    app.querySelectorAll('.pw-chip').forEach(function(b){
      b.addEventListener('click', function(){ listFilter = b.getAttribute('data-f'); showList(); var again = app.querySelector('.pw-chip[data-f="' + listFilter + '"]'); if(again) again.focus(); });
    });
  }

  /* ----------------------------------------------------------- pathway view */
  function showPathway(p, variant, focusTab){
    var t = topicInfo(p.topic);
    var idx = DATA.pathways.indexOf(p);
    var next = DATA.pathways[(idx + 1) % DATA.pathways.length];
    app.innerHTML = '<div class="pw pw-view">' +
      '<p class="pw-back"><a href="#">← All pathways</a></p>' +
      '<h2 class="pw-title" tabindex="-1">' + esc(p.title) + '</h2>' +
      '<p class="anp-small pw-meta">Topic: ' + topicLink(p.topic) + ' · ' + p.steps.length + ' steps</p>' +
      '<p class="pw-intro">' + html(p.intro) + '</p>' +
      '<div class="pw-tabs" role="tablist" aria-label="Ways to practice this pathway">' + VARIANTS.map(function(v){
        var s = status(itemId(p, v.key));
        return '<button type="button" role="tab" id="pw-tab-' + v.key + '" aria-controls="pw-panel" aria-selected="' + (v.key === variant) + '" tabindex="' + (v.key === variant ? '0' : '-1') + '" data-v="' + v.key + '" class="pw-tab">' +
          esc(v.tab) + (s === 'right' ? ' <span class="pw-tick" aria-label="done">✓</span>' : s === 'missed' ? ' <span class="pw-miss" aria-label="missed last time">✗</span>' : '') + '</button>';
      }).join('') + '</div>' +
      '<div id="pw-panel" class="pw-panel" role="tabpanel" aria-labelledby="pw-tab-' + variant + '"></div>' +
      '<p class="pw-next"><a class="btn-outline" href="#' + esc(next.id) + '">Next pathway: ' + esc(next.title) + ' →</a></p>' +
      '</div>';
    var tabs = app.querySelectorAll('.pw-tab');
    tabs.forEach(function(b, k){
      b.addEventListener('click', function(){ go('#' + p.id + '/' + b.getAttribute('data-v')); });
      b.addEventListener('keydown', function(e){
        var d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
        if(e.key === 'Home') d = -k; if(e.key === 'End') d = tabs.length - 1 - k;
        if(!d) return;
        e.preventDefault();
        var n = (k + d + tabs.length) % tabs.length;
        stopPlayer();
        history.replaceState(null, '', '#' + p.id + '/' + tabs[n].getAttribute('data-v'));
        showPathway(p, tabs[n].getAttribute('data-v'), true);
      });
    });
    var panel = app.querySelector('#pw-panel');
    if(variant === 'order') orderVariant(p, panel);
    else if(variant === 'missing') missingVariant(p, panel);
    else errorVariant(p, panel);
    if(focusTab){ var tb = app.querySelector('#pw-tab-' + variant); if(tb) tb.focus(); }
    else if(booted){ var h = app.querySelector('.pw-title'); if(h) h.focus(); }
  }

  /* Record the first check of each variant on this visit. */
  function score(p, variant, right, total){
    var id = itemId(p, variant);
    var correct = right === total;
    if(scored[id]) return false;
    scored[id] = true;
    var level = variant === 'missing' && p.missing.level ? p.missing.level : variant === 'error' && p.error.level ? p.error.level : p.level;
    if(window.AnpCore){
      window.AnpCore.toolResult('pathways', [{ id: id, correct: correct, topic: p.topic, core: p.core, level: level, diff: p.diff, group: chapterOf(p) }]);
      window.AnpCore.event('anp-pathway-complete', { pathway: p.id, variant: variant, correct: right, total: total });
    }
    if(window.LevlSound && window.LevlSound.answer) try{ window.LevlSound.answer(correct); }catch(e){}
    return true;
  }
  function verdict(correct, partial, first){
    return '<p class="pw-verdict ' + (correct ? 'ok' : 'no') + '"><b>' + (correct ? 'Correct.' : partial ? 'Partly right.' : 'Not quite.') + '</b> ' +
      (first ? (correct ? '' : 'Added to your review queue.') : '<span class="anp-small">Practice try: not scored again this visit.</span>') + '</p>';
  }

  /* Variant 1: put the steps in order. */
  function orderVariant(p, panel){
    var n = p.steps.length;
    var cur = shuffle(p.steps.map(function(s, i){ return i; }));
    if(cur.every(function(v, k){ return v === k; })) cur.reverse();
    panel.innerHTML = '<p class="pw-task">Put the steps in order, first at the top. Use the arrow buttons to move a step.' + (p.cycle ? ' This pathway is a cycle: start with the step the scenario gives you.' : '') + '</p>' +
      '<ol class="anp-order pw-order"></ol>' +
      '<div class="pw-actions"><button type="button" class="btn-press sm pw-check">Check order</button></div>' +
      '<div class="pw-result" aria-live="polite"></div>';
    var list = panel.querySelector('.pw-order');
    var checked = false;
    function paint(focusK, focusD){
      list.innerHTML = cur.map(function(i, k){
        var s = p.steps[i];
        var cls = checked ? (i === k ? 'pos-ok' : 'pos-no') : '';
        var mark = checked ? (i === k ? '<span class="pw-pos ok" aria-label="right position">✓</span>' : '<span class="pw-pos no">belongs at ' + (i + 1) + '</span>') : '';
        return '<li class="' + cls + '"><span class="pw-n" aria-hidden="true">' + (k + 1) + '</span><span class="anp-order-text">' + html(s.text) + mark + '</span>' +
          (checked ? '' : '<span class="pw-move"><button type="button" data-k="' + k + '" data-d="-1" aria-label="Move up: ' + esc(plain(s.label)) + '"' + (k === 0 ? ' disabled' : '') + '>↑</button>' +
          '<button type="button" data-k="' + k + '" data-d="1" aria-label="Move down: ' + esc(plain(s.label)) + '"' + (k === n - 1 ? ' disabled' : '') + '>↓</button></span>') + '</li>';
      }).join('');
      if(checked) return;
      list.querySelectorAll('button[data-k]').forEach(function(b){
        b.addEventListener('click', function(){
          var k = +b.getAttribute('data-k'), d = +b.getAttribute('data-d'), j = k + d;
          var t = cur[k]; cur[k] = cur[j]; cur[j] = t;
          paint(j, d);
        });
      });
      if(focusK !== undefined){
        var again = list.querySelector('button[data-k="' + focusK + '"][data-d="' + focusD + '"]:not([disabled])') || list.querySelector('button[data-k="' + focusK + '"]:not([disabled])');
        if(again) again.focus();
      }
    }
    paint();
    panel.querySelector('.pw-check').addEventListener('click', function(){
      checked = true;
      var right = cur.filter(function(v, k){ return v === k; }).length;
      paint();
      var first = score(p, 'order', right, n);
      var correct = right === n;
      var res = panel.querySelector('.pw-result');
      res.innerHTML = verdict(correct, right > 0, first) +
        '<p>' + right + ' of ' + n + ' steps in the right position.' + (correct ? '' : ' Each step in the wrong place shows where it belongs.') + '</p>';
      afterAnswer(p, panel, 'order', null);
      panel.querySelector('.pw-actions').innerHTML = '<button type="button" class="btn-outline pw-again">Shuffle and try again</button>' + report(itemId(p, 'order'));
      panel.querySelector('.pw-again').addEventListener('click', function(){ stopPlayer(); orderVariant(p, panel); panel.querySelector('.pw-order button:not([disabled])').focus(); });
      res.setAttribute('tabindex', '-1'); res.focus();
    });
  }

  /* Variant 2: one step is blanked; choose what fills it. */
  function missingVariant(p, panel){
    var m = p.missing, at = m.at;
    var choices = shuffle([{ text: p.steps[at].text, why: p.steps[at].why, right: true }].concat(m.distractors.map(function(d){ return { text: d.text, why: d.why, right: false }; })));
    panel.innerHTML = '<p class="pw-task">One step is missing. Choose the step that belongs in the gap.</p>' +
      '<ol class="pw-steps">' + p.steps.map(function(s, k){
        return k === at ? '<li class="pw-gap"><span class="pw-n" aria-hidden="true">' + (k + 1) + '</span><span class="pw-gap-text">Missing step</span></li>'
          : '<li><span class="pw-n" aria-hidden="true">' + (k + 1) + '</span><span>' + html(s.text) + '</span></li>';
      }).join('') + '</ol>' +
      '<p class="pw-task"><b>Which step fills gap ' + (at + 1) + '?</b></p>' +
      '<div class="anp-opt-btns pw-choices" role="group" aria-label="Choices for the missing step">' + choices.map(function(c, k){
        return '<button type="button" class="anp-opt" data-k="' + k + '">' + html(c.text) + '</button>';
      }).join('') + '</div>' +
      '<div class="pw-actions"></div><div class="pw-result" aria-live="polite"></div>';
    var answered = false;
    panel.querySelectorAll('.pw-choices .anp-opt').forEach(function(b){
      b.addEventListener('click', function(){
        if(answered) return;
        answered = true;
        var pick = choices[+b.getAttribute('data-k')];
        panel.querySelectorAll('.pw-choices .anp-opt').forEach(function(x){
          var c = choices[+x.getAttribute('data-k')];
          x.disabled = true;
          if(c.right) x.classList.add('is-right'); else if(c === pick) x.classList.add('is-wrong');
          x.insertAdjacentHTML('beforeend', '<span class="anp-opt-why">' + html(c.why) + '</span>');
        });
        var gap = panel.querySelector('.pw-gap');
        gap.classList.add(pick.right ? 'is-right' : 'is-filled');
        gap.querySelector('.pw-gap-text').innerHTML = html(p.steps[at].text);
        var first = score(p, 'missing', pick.right ? 1 : 0, 1);
        var res = panel.querySelector('.pw-result');
        res.innerHTML = verdict(pick.right, false, first) + '<p><b>Step ' + (at + 1) + ':</b> ' + html(p.steps[at].text) + ' ' + html(p.steps[at].why) + '</p>';
        afterAnswer(p, panel, 'missing', at);
        panel.querySelector('.pw-actions').innerHTML = '<button type="button" class="btn-outline pw-again">Try again</button>' + report(itemId(p, 'missing'));
        panel.querySelector('.pw-again').addEventListener('click', function(){ stopPlayer(); missingVariant(p, panel); panel.querySelector('.pw-choices .anp-opt').focus(); });
        res.setAttribute('tabindex', '-1'); res.focus();
      });
    });
  }

  /* Variant 3: one step has been replaced by a wrong one; find it. */
  function errorVariant(p, panel){
    var e = p.error, at = e.at, pick = -1;
    panel.innerHTML = '<p class="pw-task">One step in this pathway is wrong. Select it, then check.</p>' +
      '<ol class="pw-steps pw-pickable" role="group" aria-label="Steps: select the wrong one">' + p.steps.map(function(s, k){
        return '<li><button type="button" class="pw-pick" aria-pressed="false" data-k="' + k + '"><span class="pw-n" aria-hidden="true">' + (k + 1) + '</span><span class="pw-pick-text">' + html(k === at ? e.text : s.text) + '</span></button></li>';
      }).join('') + '</ol>' +
      '<div class="pw-actions"><button type="button" class="btn-press sm pw-check" disabled>Check</button></div>' +
      '<div class="pw-result" aria-live="polite"></div>';
    var btns = panel.querySelectorAll('.pw-pick');
    var check = panel.querySelector('.pw-check');
    btns.forEach(function(b){
      b.addEventListener('click', function(){
        if(check.hasAttribute('data-done')) return;
        pick = +b.getAttribute('data-k');
        btns.forEach(function(x){ x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
        check.disabled = false;
      });
    });
    check.addEventListener('click', function(){
      if(pick < 0) return;
      check.setAttribute('data-done', '1');
      var ok = pick === at;
      btns.forEach(function(x){
        var k = +x.getAttribute('data-k');
        x.disabled = true;
        if(k === at){
          x.classList.add(ok ? 'is-right' : 'is-answer');
          x.querySelector('.pw-pick-text').innerHTML = '<s>' + html(e.text) + '</s><span class="pw-fix"><b>Should be:</b> ' + html(p.steps[at].text) + '</span>';
        } else if(k === pick) x.classList.add('is-wrong');
      });
      var first = score(p, 'error', ok ? 1 : 0, 1);
      var res = panel.querySelector('.pw-result');
      res.innerHTML = verdict(ok, false, first) +
        (ok ? '' : '<p>Step ' + (pick + 1) + ' is right where it is: ' + html(p.steps[pick].why) + '</p>') +
        '<p><b>The error was step ' + (at + 1) + '.</b> ' + html(e.why) + '</p>';
      afterAnswer(p, panel, 'error', at);
      panel.querySelector('.pw-actions').innerHTML = '<button type="button" class="btn-outline pw-again">Try again</button>' + report(itemId(p, 'error'));
      panel.querySelector('.pw-again').addEventListener('click', function(){ stopPlayer(); errorVariant(p, panel); panel.querySelector('.pw-pick').focus(); });
      res.setAttribute('tabindex', '-1'); res.focus();
    });
  }

  /* After any variant: the summary, the diagram player, and every step's why. */
  function afterAnswer(p, panel, variant, mark){
    var res = panel.querySelector('.pw-result');
    var box = document.createElement('div');
    box.className = 'pw-after';
    box.innerHTML = '<p class="pw-summary">' + html(p.summary) + '</p>' +
      '<h3>Watch the pathway</h3>' +
      '<div class="anp-fig pw-fig"></div>' +
      '<div class="pw-player"><button type="button" class="btn-press sm pw-play">▶ Play</button>' +
      '<button type="button" class="btn-outline pw-prev" aria-label="Previous step">←</button>' +
      '<button type="button" class="btn-outline pw-nextstep" aria-label="Next step">→</button></div>' +
      '<p class="pw-caption" aria-live="polite"></p>' +
      '<details class="pw-whys"><summary>Why each step comes where it does</summary><ol>' + p.steps.map(function(s){
        return '<li><b>' + html(s.text) + '</b> <span>' + html(s.why) + '</span></li>';
      }).join('') + '</ol></details>';
    res.appendChild(box);
    var fig = box.querySelector('.pw-fig');
    var svg = diagram(p, mark);
    fig.appendChild(svg);
    player = makePlayer(p, svg, box);
  }

  /* ---------------------------------------------------------------- diagram
     A two-column "snake": row 0 runs left to right, row 1 right to left, and
     so on, so a long pathway stays compact on a phone. Blood steps are filled
     with the oxygenated or deoxygenated color; exchange steps (capillaries)
     stay neutral. Arrows: "flows" for blood, "causes" for mechanisms. */
  var NW = 156, NH = 48, GX = 36, GY = 34, PAD = 8;
  function nodePos(k){
    var row = Math.floor(k / 2), col = k % 2;
    if(row % 2 === 1) col = 1 - col;
    return { x: PAD + col * (NW + GX), y: PAD + row * (NH + GY), col: col, row: row };
  }
  function wrap(label, max){
    var words = plain(label).split(' '), lines = [''], k = 0;
    words.forEach(function(w){
      if(!lines[k]) lines[k] = w;
      else if((lines[k] + ' ' + w).length <= max) lines[k] += ' ' + w;
      else { k++; lines[k] = w; }
    });
    return lines;
  }
  function el(name, attrs, text){
    var e = document.createElementNS(SVGNS, name);
    for(var a in attrs) if(attrs.hasOwnProperty(a)) e.setAttribute(a, attrs[a]);
    if(text != null) e.textContent = text;
    return e;
  }
  function diagram(p, mark){
    var n = p.steps.length;
    var rows = Math.ceil(n / 2);
    var W = PAD * 2 + NW * 2 + GX;
    var H = PAD * 2 + rows * NH + (rows - 1) * GY + (p.cycle ? 30 : 0);
    var svg = el('svg', { viewBox: '0 0 ' + W + ' ' + H, width: W, height: H, role: 'img', 'class': 'pw-svg',
      'aria-label': p.title + ', step by step: ' + p.steps.map(function(s, k){ return (k + 1) + '. ' + plain(s.label); }).join('; ') + (p.cycle ? '; then back to step 1.' : '.') });
    var arrows = el('g', { 'class': 'pw-arrows' });
    var nodes = el('g', { 'class': 'pw-nodes' });
    svg.appendChild(arrows); svg.appendChild(nodes);
    p.steps.forEach(function(s, k){
      var a = nodePos(k);
      if(k < n - 1){
        var b = nodePos(k + 1), d;
        if(a.row === b.row){
          var y = a.y + NH / 2;
          d = a.col < b.col ? 'M' + (a.x + NW) + ',' + y + ' L' + (b.x - 3) + ',' + y : 'M' + a.x + ',' + y + ' L' + (b.x + NW + 3) + ',' + y;
        } else {
          var x = a.x + NW / 2;
          d = 'M' + x + ',' + (a.y + NH) + ' L' + x + ',' + (b.y - 3);
        }
        var cls = p.kind === 'flow' ? 'flows' + (s.blood === 'o2' || s.blood === 'deo2' ? ' ' + s.blood : '') : 'causes';
        arrows.appendChild(el('path', { d: d, 'class': cls, 'data-k': k }));
      }
      var g = el('g', { 'class': 'pw-node', 'data-k': k });
      var fill = s.blood === 'o2' ? 'o2' : s.blood === 'deo2' ? 'deo2' : 'shape';
      g.appendChild(el('rect', { x: a.x, y: a.y, width: NW, height: NH, rx: 11, 'class': fill + ' pw-box' + (mark === k ? ' pw-marked' : '') }));
      g.appendChild(el('circle', { cx: a.x + 16, cy: a.y + NH / 2, r: 11, 'class': 'pw-num-bg' }));
      g.appendChild(el('text', { x: a.x + 16, y: a.y + NH / 2 + 4.5, 'text-anchor': 'middle', 'class': 'pw-num' }, String(k + 1)));
      var lines = wrap(s.label, 17).slice(0, 2);
      lines.forEach(function(line, i){
        var ty = a.y + NH / 2 + 4.5 + (lines.length === 2 ? (i === 0 ? -8 : 8) : 0);
        g.appendChild(el('text', { x: a.x + 33, y: ty, 'class': 'pw-lbl' }, line));
      });
      nodes.appendChild(g);
    });
    if(p.cycle){
      var last = nodePos(n - 1);
      var ly = last.y + NH + 22;
      svg.appendChild(el('text', { x: last.x + NW / 2, y: ly, 'text-anchor': 'middle', 'class': 'lbl-sm' }, '↻ then back to step 1'));
    }
    return svg;
  }

  function makePlayer(p, svg, box){
    var n = p.steps.length, k = -1, timer = null;
    var cap = box.querySelector('.pw-caption');
    var play = box.querySelector('.pw-play');
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    function show(i){
      k = i;
      svg.querySelectorAll('.pw-node').forEach(function(g){
        var j = +g.getAttribute('data-k');
        g.classList.toggle('is-cur', j === k);
        g.classList.toggle('is-dim', k >= 0 && j > k);
      });
      svg.querySelectorAll('.pw-arrows path').forEach(function(a){
        var j = +a.getAttribute('data-k');
        a.classList.toggle('is-dim', k >= 0 && j >= k);
      });
      var s = p.steps[k];
      cap.innerHTML = s ? '<b>Step ' + (k + 1) + ' of ' + n + ':</b> ' + html(s.text) + ' <span class="pw-cap-why">' + html(s.why) + '</span>' : '';
    }
    function stop(){ if(timer){ clearInterval(timer); timer = null; } play.textContent = '▶ Play'; play.setAttribute('aria-pressed', 'false'); }
    function start(){
      if(k >= n - 1) show(-1);
      play.textContent = '❚❚ Pause'; play.setAttribute('aria-pressed', 'true');
      show(k + 1);
      timer = setInterval(function(){ if(k >= n - 1){ stop(); return; } show(k + 1); }, reduce ? 4200 : 3000);
    }
    play.addEventListener('click', function(){ if(timer) stop(); else start(); });
    box.querySelector('.pw-prev').addEventListener('click', function(){ stop(); show(Math.max(0, k - 1)); });
    box.querySelector('.pw-nextstep').addEventListener('click', function(){ stop(); show(Math.min(n - 1, k + 1)); });
    cap.innerHTML = '<span class="anp-small">Press Play, or step through with the arrows.</span>';
    return { stop: stop };
  }

  /* ------------------------------------------------------------------ boot */
  function fail(msg){ app.innerHTML = '<p class="pw-error">' + esc(msg) + '</p>'; }
  var src = app.getAttribute('data-src');
  if(!src){ fail('No content file for this tool.'); return; }
  fetch(src).then(function(r){ if(!r.ok) throw new Error(r.status); return r.json(); }).then(function(d){
    DATA = d;
    DATA.pathways = (DATA.pathways || []).filter(function(p){ return p && p.steps && p.steps.length; });
    if(window.AnpCore && window.AnpCore.allowed && !window.AnpCore.allowed('pathways')) { fail('This tool is not available right now.'); return; }
    window.addEventListener('hashchange', route);
    route();
    booted = true;
    app.classList.add('is-ready');
  }).catch(function(){ fail('The pathways could not be loaded. Check your connection and reload the page.'); });
})();
