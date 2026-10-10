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
  function stopPlayer(){ if(player){ player.stop(); player = null; } if(tracer){ tracer.stop(); tracer = null; } }
  var tracer = null;          // the running figure trace, if any

  /* ---------------------------------------------------------------- routing */
  function route(){
    stopPlayer();
    var h = (location.hash || '').replace(/^#/, '').split('/');
    var p = h[0] ? find(decodeURIComponent(h[0])) : null;
    if(p){
      var v = h[1] && /^(order|missing|error)$/.test(h[1]) ? h[1] : 'order';
      showPathway(p, v, false);
    } else if(h[0] === 'all') showList();
    else { var d = defaultItem(); if(d) showPathway(d, firstOpen(d), false); else showList(); }
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
    // On a phone the chips are one select (audit 2026-10: up to 25 chips came before any content).
    chips += '<label class="pw-chsel">Chapter <select id="pw-chsel"><option value="all">All chapters</option>' +
      chapters.map(function(c){ var ch = chapterInfo(c); return '<option value="' + esc(c) + '"' + (listFilter === c ? ' selected' : '') + '>' + esc(ch ? ch.title : c) + '</option>'; }).join('') + '</select></label>';

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
    var sel = app.querySelector('#pw-chsel');
    if(sel) sel.addEventListener('change', function(){ listFilter = sel.value; showList(); var ns = app.querySelector('#pw-chsel'); if(ns) ns.focus(); });
  }

  /* Open on an item, not the list (docs/tools-upgrade.md, P1-A&P): the
     first pathways in list order, within ?chapter= / ?topic=, with something
     not yet answered right; #all is the full list. The picker above the item
     reaches every pathways. */
  function ordered(){
    var q = params(), want = q.chapter || (q.topic && topicInfo(q.topic) ? topicInfo(q.topic).chapter : '');
    var order = cur().chapters.map(function(c){ return c.id; }), topicOrder = cur().topics.map(function(t){ return t.id; });
    var all = DATA.pathways.slice().sort(function(a, b){
      return order.indexOf(chapterOf(a)) - order.indexOf(chapterOf(b)) || topicOrder.indexOf(a.topic) - topicOrder.indexOf(b.topic);
    });
    var inCh = all.filter(function(x){ return chapterOf(x) === want; });
    return inCh.length ? inCh : all;
  }
  function defaultItem(){
    var list = ordered(), q = params();
    if(q.topic){ var t = list.filter(function(x){ return x.topic === q.topic; }); if(t.length) list = t.concat(list.filter(function(x){ return t.indexOf(x) < 0; })); }
    for(var i = 0; i < list.length; i++) if(VARIANTS.some(function(v){ return status(itemId(list[i], v.key)) !== 'right'; })) return list[i];
    return list[0] || null;
  }
  function addPicker(p){
    var host = app.querySelector('.pw-pickhost'), K = window.AnpToolKit;
    if(!host || !K) return;
    var chapters = [];
    var all = DATA.pathways.slice(), order = cur().chapters.map(function(c){ return c.id; }), topicOrder = cur().topics.map(function(t){ return t.id; });
    all.sort(function(a, b){ return order.indexOf(chapterOf(a)) - order.indexOf(chapterOf(b)) || topicOrder.indexOf(a.topic) - topicOrder.indexOf(b.topic); });
    all.forEach(function(x){ var c = chapterOf(x); if(chapters.indexOf(c) < 0) chapters.push(c); });
    K.picker(host, {
      label: 'Pathway', noun: 'pathways', current: p.id, allHref: '#all', allLabel: 'All pathways by chapter',
      groups: chapters.map(function(c){ var ch = chapterInfo(c); return { title: ch ? ch.title : c, items: all.filter(function(x){ return chapterOf(x) === c; }).map(function(x){
        var t = topicInfo(x.topic);
        return { id: x.id, title: x.title, meta: t ? t.title : '', href: '#' + x.id, done: VARIANTS.every(function(v){ return status(itemId(x, v.key)) === 'right'; }) };
      }) }; })
    });
  }

  function firstOpen(p){ for(var i = 0; i < VARIANTS.length; i++) if(status(itemId(p, VARIANTS[i].key)) !== 'right') return VARIANTS[i].key; return 'order'; }

  /* ----------------------------------------------------------- pathway view */
  function showPathway(p, variant, focusTab){
    var t = topicInfo(p.topic);
    var idx = DATA.pathways.indexOf(p);
    var next = DATA.pathways[(idx + 1) % DATA.pathways.length];
    app.innerHTML = '<div class="pw pw-view">' +
      '<div class="pw-pickhost"></div>' +
      '<h2 class="pw-title" tabindex="-1">' + esc(p.title) + '</h2>' +
      '<p class="anp-small pw-meta">Topic: ' + topicLink(p.topic) + ' · ' + p.steps.length + ' steps</p>' +
      '<p class="pw-intro">' + html(p.intro) + '</p>' +
      (p.trace ? '<section class="pt" aria-labelledby="pt-h"></section>' : '') +
      (p.trace ? '<h3 class="pw-drill-h">Drills</h3>' : '') +
      '<div class="pw-tabs" role="tablist" aria-label="Ways to practice this pathway">' + VARIANTS.map(function(v){
        var s = status(itemId(p, v.key));
        return '<button type="button" role="tab" id="pw-tab-' + v.key + '" aria-controls="pw-panel" aria-selected="' + (v.key === variant) + '" tabindex="' + (v.key === variant ? '0' : '-1') + '" data-v="' + v.key + '" class="pw-tab">' +
          esc(v.tab) + (s === 'right' ? ' <span class="pw-tick" aria-label="done">✓</span>' : s === 'missed' ? ' <span class="pw-miss" aria-label="missed last time">✗</span>' : '') + '</button>';
      }).join('') + '</div>' +
      '<div id="pw-panel" class="pw-panel" role="tabpanel" aria-labelledby="pw-tab-' + variant + '"></div>' +
      '<p class="pw-next"><a class="btn-outline" href="#' + esc(next.id) + '">Next pathway: ' + esc(next.title) + ' →</a></p>' +
      '</div>';
    addPicker(p);
    if(p.trace) traceView(p, app.querySelector('.pt'));
    var tabs = app.querySelectorAll('.pw-tab');
    tabs.forEach(function(b, k){
      b.addEventListener('click', function(){ if(player){ player.stop(); player = null; } go('#' + p.id + '/' + b.getAttribute('data-v')); });
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

  /* ------------------------------------------------------- trace on the figure
     Where a pathway has a matching OpenStax figure (data/pathway-traces.json,
     published as p.trace by build-anp.mjs), it plays on the real drawing:
       Watch     a token (a drop of blood, an impulse, a drop of fluid, a bite
                 of food) travels step to step, leaving its path; each step's
                 caption says what happens there and why. Blood changes color
                 where the data says it gains or gives up oxygen.
       Trace it  the token waits; tap where it goes next (the structure or its
                 printed label; labels are buttons for the keyboard). A wrong
                 tap names what you tapped and shows where it really goes.
                 Scored once a visit as pathways:<id>:trace (no wrong taps =
                 right), so misses reach Review like the other drills. */
  function traceView(p, host){
    var T = p.trace, n = p.steps.length, W = T.w, H = T.h;
    var R = Math.max(W, H) * 0.022, SW = Math.max(W, H) * 0.0075;
    var reduce = function(){ try{ return window.LevlMotion ? window.LevlMotion.reduced() : window.matchMedia('(prefers-reduced-motion: reduce)').matches; }catch(e){ return false; } };
    var pct = function(v, of){ return (100 * v / of).toFixed(3) + '%'; };
    var at = function(b){ return 'left:' + pct(b[0], W) + ';top:' + pct(b[1], H) + ';width:' + pct(b[2], W) + ';height:' + pct(b[3], H); };
    var byId = {}; T.boxes.forEach(function(b){ byId[b.id] = b; });
    var noun = { blood: 'drop of blood', impulse: 'impulse', fluid: 'drop of fluid', food: 'bite of food' }[T.token] || 'token';
    var tid = itemId(p, 'trace');
    var st = status(tid);
    host.innerHTML = '<div class="pt-head"><h3 id="pt-h">On the figure</h3>' +
      '<div class="pt-modes" role="group" aria-label="Figure mode"><button type="button" class="pt-mode" data-m="watch" aria-pressed="true">Watch</button>' +
      '<button type="button" class="pt-mode" data-m="trace" aria-pressed="false">Trace it' + (st === 'right' ? ' <span class="pw-tick" aria-label="done">✓</span>' : st === 'missed' ? ' <span class="pw-miss" aria-label="missed last time">✗</span>' : '') + '</button></div></div>' +
      '<div class="pt-stage"><div class="pt-fig" style="aspect-ratio:' + W + ' / ' + H + ';--pt-r:' + (W / H).toFixed(4) + '">' +
        (T.srcset ? '<picture><source type="image/avif" srcset="' + esc(T.srcset) + '" sizes="(max-width: 760px) 100vw, 720px"><img src="' + esc(BASE + T.src) + '" alt="' + esc(T.alt) + '" width="' + W + '" height="' + H + '" decoding="async"></picture>'
          : '<img src="' + esc(BASE + T.src) + '" alt="' + esc(T.alt) + '" width="' + W + '" height="' + H + '" decoding="async">') +
        T.covered.map(function(b){ return '<span class="pt-cover" aria-hidden="true" style="' + at(b) + '"></span>'; }).join('') +
        '<svg class="pt-svg" viewBox="0 0 ' + W + ' ' + H + '" aria-hidden="true" focusable="false"><g class="pt-trail"></g><g class="pt-hint"></g><g class="pt-hits"></g><circle class="pt-token tok-' + esc(T.token) + '" r="' + R + '" cx="-99" cy="-99"/></svg>' +
        '<div class="pt-boxes"></div>' +
      '</div></div>' +
      '<div class="pt-bar"></div>' +
      '<p class="pt-cap" aria-live="polite"></p>' +
      '<p class="lp-credit pt-credit">' + T.attribution + '</p>';
    var svg = host.querySelector('.pt-svg'), trail = host.querySelector('.pt-trail'), hint = host.querySelector('.pt-hint'), hits = host.querySelector('.pt-hits');
    var token = host.querySelector('.pt-token'), bar = host.querySelector('.pt-bar'), cap = host.querySelector('.pt-cap'), boxes = host.querySelector('.pt-boxes');
    var NS = 'http://www.w3.org/2000/svg';
    function mk(name, attrs){ var e = document.createElementNS(NS, name); for(var a in attrs) e.setAttribute(a, attrs[a]); return e; }
    var jump = T.jump || [];
    var k = -1, timer = null, anim = 0, mode = 'watch';
    function tone(i){ var b = p.steps[i] && p.steps[i].blood; return T.token === 'blood' ? (b === 'o2' ? 'o2' : b === 'deo2' ? 'deo2' : 'ex') : ''; }
    function paintToken(i){ token.setAttribute('class', 'pt-token tok-' + T.token + (tone(i) ? ' tone-' + tone(i) : '')); }
    function clearTrail(){ while(trail.firstChild) trail.removeChild(trail.firstChild); while(hint.firstChild) hint.removeChild(hint.firstChild); }
    function seg(i){ // from step i-1 to step i
      var a = T.pts[i - 1], b = T.pts[i];
      if(a[0] === b[0] && a[1] === b[1]) return;
      trail.appendChild(mk('line', { x1: a[0], y1: a[1], x2: b[0], y2: b[1], 'class': 'pt-seg' + (jump.indexOf(i) > -1 ? ' is-jump' : '') + (tone(i) ? ' tone-' + tone(i) : ''), 'stroke-width': SW }));
    }
    function dot(i, cls){ trail.appendChild(mk('circle', { cx: T.pts[i][0], cy: T.pts[i][1], r: R * 0.42, 'class': 'pt-dot' + (cls ? ' ' + cls : '') })); }
    function moveTo(i, done){
      var my = ++anim, b = T.pts[i];
      paintToken(i);
      var x0 = +token.getAttribute('cx'), y0 = +token.getAttribute('cy');
      if(reduce() || x0 < 0 || jump.indexOf(i) > -1){
        token.setAttribute('cx', b[0]); token.setAttribute('cy', b[1]);
        token.classList.remove('pop'); void token.getBBox(); token.classList.add('pop');
        if(done) done(); return;
      }
      var dist = Math.hypot(b[0] - x0, b[1] - y0), dur = Math.min(900, 300 + dist * 0.9), t0 = null;
      requestAnimationFrame(function f(ts){
        if(my !== anim) return;
        if(t0 == null) t0 = ts;
        var u = Math.min(1, (ts - t0) / dur), e = u < .5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2;
        token.setAttribute('cx', x0 + (b[0] - x0) * e); token.setAttribute('cy', y0 + (b[1] - y0) * e);
        if(u < 1) requestAnimationFrame(f); else if(done) done();
      });
    }
    function caption(i, extra){
      var s = p.steps[i];
      cap.innerHTML = (extra || '') + '<b>Step ' + (i + 1) + ' of ' + n + ':</b> ' + html(s.text) + ' <span class="pt-why">' + html(s.why) + '</span>';
    }
    function stop(){ if(timer){ clearTimeout(timer); timer = null; } var pb = bar.querySelector('.pt-play'); if(pb){ pb.textContent = '▶ Play'; pb.setAttribute('aria-pressed', 'false'); } }
    /* ---- Watch */
    function show(i){
      k = i; clearTrail();
      for(var j = 1; j <= i; j++) seg(j);
      for(var j2 = 0; j2 < i; j2++) dot(j2);
      moveTo(i); caption(i);
      bar.querySelector('.pt-prev').disabled = i <= 0;
      bar.querySelector('.pt-next').disabled = i >= n - 1;
    }
    function watch(){
      mode = 'watch'; stop(); anim++; boxes.innerHTML = ''; while(hits.firstChild) hits.removeChild(hits.firstChild);
      host.querySelector('.pt-fig').classList.remove('is-trace');
      bar.innerHTML = '<button type="button" class="btn-press sm pt-play" aria-pressed="false">▶ Play</button>' +
        '<button type="button" class="btn-outline pt-prev" aria-label="Previous step">←</button><button type="button" class="btn-outline pt-next" aria-label="Next step">→</button>' +
        '<span class="pt-n anp-small"></span>';
      var play = bar.querySelector('.pt-play');
      function tick(){ if(k >= n - 1){ stop(); if(p.cycle) cap.insertAdjacentHTML('beforeend', ' <span class="pt-cycle">↻ and round again.</span>'); return; } show(k + 1); timer = setTimeout(tick, reduce() ? 4200 : 2600); }
      play.addEventListener('click', function(){
        if(timer){ stop(); return; }
        if(k >= n - 1) k = -1;
        play.textContent = '❚❚ Pause'; play.setAttribute('aria-pressed', 'true');
        if(k < 0){ token.setAttribute('cx', -99); }
        tick();
      });
      bar.querySelector('.pt-prev').addEventListener('click', function(){ stop(); show(Math.max(0, k - 1)); });
      bar.querySelector('.pt-next').addEventListener('click', function(){ stop(); show(Math.min(n - 1, k + 1)); });
      k = 0; clearTrail(); token.setAttribute('cx', -99); moveTo(0);
      cap.innerHTML = '<span class="anp-small">Press Play to follow the ' + esc(noun) + ' through all ' + n + ' steps, or step with the arrows. Then try <b>Trace it</b>.</span>';
      bar.querySelector('.pt-prev').disabled = true;
    }
    /* ---- Trace it */
    function traceIt(){
      mode = 'trace'; stop(); anim++;
      host.querySelector('.pt-fig').classList.add('is-trace');
      var misses = 0, done = false;
      k = 0; clearTrail(); token.setAttribute('cx', -99); moveTo(0);
      bar.innerHTML = '<span class="pt-score anp-small" aria-live="polite"></span><button type="button" class="btn-outline pt-restart">Start over</button>';
      bar.querySelector('.pt-restart').addEventListener('click', traceIt);
      // Hit areas: every printed label (a button) and a ring on every step point.
      boxes.innerHTML = T.boxes.map(function(b){ return '<button type="button" class="pt-box" data-id="' + esc(b.id) + '" style="' + at(b.box) + '" aria-label="' + esc(b.name) + '"></button>'; }).join('');
      while(hits.firstChild) hits.removeChild(hits.firstChild);
      T.pts.forEach(function(pt, i){ hits.appendChild(mk('circle', { cx: pt[0], cy: pt[1], r: R * 2.1, 'class': 'pt-hit', 'data-i': i })); });
      function score(){ bar.querySelector('.pt-score').textContent = (k + 1) + ' of ' + n + ' steps' + (misses ? ' · ' + misses + ' wrong ' + (misses === 1 ? 'tap' : 'taps') : ''); }
      function ask(){
        // A step at the same place as the one before (a pause, a delay) is
        // passed through with its caption: there is nothing new to tap.
        while(k < n - 1 && T.pts[k + 1][0] === T.pts[k][0] && T.pts[k + 1][1] === T.pts[k][1]){ k++; caption(k, '<span class="pt-same">Same place: </span>'); }
        score();
        if(k >= n - 1) return finish();
        cap.innerHTML = (k === 0 ? '<b>Start:</b> ' + html(p.steps[0].text) + ' ' : '') + '<b class="pt-ask">Where does the ' + esc(noun) + ' go next? Tap it on the figure.</b>';
      }
      function finish(){
        done = true;
        var ok = misses === 0;
        var first = score2(ok);
        boxes.querySelectorAll('.pt-box').forEach(function(b){ b.disabled = true; });
        cap.innerHTML = verdict(ok, ok, first).replace('Partly right.', 'Traced, with help.') + '<p>' + (ok ? 'Every step found on the figure.' : misses + ' wrong ' + (misses === 1 ? 'tap' : 'taps') + ' on the way; each one showed where it really goes.') + ' ' + html(p.summary) + '</p>';
        bar.innerHTML = '<button type="button" class="btn-outline pt-restart">Trace it again</button>' + report(tid);
        bar.querySelector('.pt-restart').addEventListener('click', traceIt);
        var mt = host.querySelector('.pt-mode[data-m="trace"]'); if(mt) mt.innerHTML = 'Trace it ' + (ok ? '<span class="pw-tick" aria-label="done">✓</span>' : '<span class="pw-miss" aria-label="missed">✗</span>');
      }
      function score2(ok){
        if(scored[tid]) return false;
        scored[tid] = true;
        if(window.AnpCore){
          window.AnpCore.toolResult('pathways', [{ id: tid, correct: ok, topic: p.topic, core: p.core, level: 'apply', diff: p.diff, group: chapterOf(p) }]);
          window.AnpCore.event('anp-pathway-complete', { pathway: p.id, variant: 'trace', correct: ok ? 1 : 0, total: 1 });
        }
        if(window.LevlSound && window.LevlSound.answer) try{ window.LevlSound.answer(ok); }catch(e){}
        return true;
      }
      function nameOf(id){ return byId[id] ? byId[id].name : ''; }
      function tapped(labelId, ptIndex){
        if(done) return;
        var want = k + 1, wantLab = T.labels[want];
        var alsoW = (T.also && T.also[want]) || [];
        var ok = labelId ? labelId === wantLab || alsoW.indexOf(labelId) > -1 : ptIndex === want || (ptIndex != null && T.labels[ptIndex] === wantLab);
        while(hint.firstChild) hint.removeChild(hint.firstChild);
        if(ok){
          seg(want); dot(k);
          k = want;
          moveTo(k, function(){});
          caption(k, '<span class="pt-ok">✓</span> ');
          if(window.LevlSound && window.LevlSound.tick) try{ window.LevlSound.tick(); }catch(e){}
          if(k >= n - 1) return finish();
          var c = cap.innerHTML;
          ask();
          if(!done) cap.innerHTML = c + '<br><b class="pt-ask">Next: where does it go from here?</b>';
          return;
        }
        misses++;
        var name = labelId ? nameOf(labelId) : ptIndex != null ? nameOf(T.labels[ptIndex]) : '';
        var where = ptIndex != null && ptIndex <= k ? 'The ' + esc(noun) + ' has already been there' : name ? 'That is the <b>' + esc(name) + '</b>' + (ptIndex != null && ptIndex > want ? ', step ' + (ptIndex + 1) + ': later in the pathway' : labelId && T.labels.indexOf(labelId) < 0 ? ', not where the next step happens' : '') : 'Nothing on the pathway there';
        var b = T.pts[want], a = T.pts[k];
        hint.appendChild(mk('line', { x1: a[0], y1: a[1], x2: b[0], y2: b[1], 'class': 'pt-ghost', 'stroke-width': SW }));
        hint.appendChild(mk('circle', { cx: b[0], cy: b[1], r: R * 1.5, 'class': 'pt-want' }));
        cap.innerHTML = '<span class="pt-no">✗</span> ' + where + '. It goes to the ring: <b>' + html(p.steps[want].label) + '</b>. Tap it to go on.';
        score();
        if(window.LevlSound && window.LevlSound.answer) try{ window.LevlSound.answer(false); }catch(e){}
      }
      boxes.querySelectorAll('.pt-box').forEach(function(bt){ bt.addEventListener('click', function(e){ e.stopPropagation(); tapped(bt.getAttribute('data-id'), null); }); });
      host.querySelector('.pt-fig').onclick = function(e){
        if(mode !== 'trace' || e.target.closest('.pt-box')) return;
        var r = svg.getBoundingClientRect(), x = (e.clientX - r.left) * W / r.width, y = (e.clientY - r.top) * H / r.height;
        var best = -1, bd = Infinity;
        T.pts.forEach(function(pt, i){ var d = Math.hypot(pt[0] - x, pt[1] - y); if(d < bd){ bd = d; best = i; } });
        tapped(null, bd <= R * 2.6 ? best : null);
      };
      ask();
    }
    host.querySelectorAll('.pt-mode').forEach(function(b){
      b.addEventListener('click', function(){
        host.querySelectorAll('.pt-mode').forEach(function(x){ x.setAttribute('aria-pressed', String(x === b)); });
        if(b.getAttribute('data-m') === 'trace') traceIt(); else watch();
      });
    });
    watch();
    tracer = { stop: function(){ stop(); anim++; } };
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
    panel.innerHTML = '<p class="pw-task">Put the steps in order, first at the top. Drag a step by its grip, or use its arrow buttons.' + (p.cycle ? ' This pathway is a cycle: start with the step the scenario gives you.' : '') + '</p>' +
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
        return '<li class="' + cls + '" data-pos="' + k + '">' + (checked ? '' : '<span class="pw-grip" aria-hidden="true" title="Drag to move"></span>') + '<span class="pw-n" aria-hidden="true">' + (k + 1) + '</span><span class="anp-order-text">' + html(s.text) + mark + '</span>' +
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
      dragSort();
      if(focusK !== undefined){
        var again = list.querySelector('button[data-k="' + focusK + '"][data-d="' + focusD + '"]:not([disabled])') || list.querySelector('button[data-k="' + focusK + '"]:not([disabled])');
        if(again) again.focus();
      }
    }
    /* Drag a step by its body to a new place (touch or mouse); the arrow
       buttons stay for keyboard and fine adjustment. The row follows the
       pointer and the others close up around it, then the order is redrawn. */
    function dragSort(){
      list.querySelectorAll('li[data-pos]').forEach(function(li){
        var from = +li.getAttribute('data-pos'), y0 = 0, dragging = false, pid = null, rows = null, to = from;
        li.addEventListener('pointerdown', function(e){
          if(e.button > 0 || e.target.closest('button')) return;
          /* On touch only the grip starts a drag, so swiping a step still scrolls the page. */
          if(e.pointerType !== 'mouse' && !e.target.closest('.pw-grip')) return;
          pid = e.pointerId; y0 = e.clientY; dragging = false; to = from;
        });
        li.addEventListener('pointermove', function(e){
          if(pid !== e.pointerId) return;
          var dy = e.clientY - y0;
          if(!dragging){
            if(Math.abs(dy) < 8) return;
            dragging = true;
            try{ li.setPointerCapture(pid); }catch(err){}
            rows = Array.prototype.map.call(list.children, function(r){ var b = r.getBoundingClientRect(); return { el: r, mid: b.top + b.height / 2, h: b.height }; });
            li.classList.add('is-dragging');
          }
          e.preventDefault();
          li.style.transform = 'translateY(' + dy + 'px)';
          var y = rows[from].mid + dy, h = rows[from].h + 8;
          to = from;
          rows.forEach(function(r, k){
            if(k === from) return;
            var shift = 0;
            if(k > from && y > r.mid){ shift = -h; to = Math.max(to, k); }
            if(k < from && y < r.mid){ shift = h; to = Math.min(to, k); }
            r.el.style.transform = shift ? 'translateY(' + shift + 'px)' : '';
          });
        });
        function end(e){
          if(pid !== e.pointerId) return;
          pid = null;
          if(!dragging) return;
          dragging = false;
          Array.prototype.forEach.call(list.children, function(r){ r.style.transform = ''; });
          li.classList.remove('is-dragging');
          if(to !== from){ var v = cur.splice(from, 1)[0]; cur.splice(to, 0, v); }
          paint();
        }
        li.addEventListener('pointerup', end);
        li.addEventListener('pointercancel', end);
      });
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
      panel.querySelector('.pw-again').addEventListener('click', function(){ if(player){ player.stop(); player = null; } orderVariant(p, panel); panel.querySelector('.pw-order button:not([disabled])').focus(); });
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
        panel.querySelector('.pw-again').addEventListener('click', function(){ if(player){ player.stop(); player = null; } missingVariant(p, panel); panel.querySelector('.pw-choices .anp-opt').focus(); });
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
      panel.querySelector('.pw-again').addEventListener('click', function(){ if(player){ player.stop(); player = null; } errorVariant(p, panel); panel.querySelector('.pw-pick').focus(); });
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
    if(window.AnpToolKit) window.AnpToolKit.strip(box, { topic: p.topic, text: p.title + ' ' + p.intro,
      structures: p.steps.map(function(st){ return st.label; }) });
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
