/* A&P pathway tracer (docs/anp-spec.md section 8.4, docs/anp-tools-contract.md).

   Content: data/tools/pathways.json (read from #app[data-src]). Each pathway is
   played three ways, and each way is one scored item with a permanent id:
     pathways:<pathway>:order     put every step in order (tap to place on
                                  the map, or a drag/arrows list)
     pathways:<pathway>:missing   choose the step that fills the gap
     pathways:<pathway>:error     find the one step that is wrong
   Every drill works on the pathway map, drawn from the step data with an
   icon per kind of step (pathMap below): placing a step lights its node, a
   gap is a dashed "?", and the answer is marked on the map. After answering,
   the pathway plays step by step on the same map, with each step's "why it
   comes here". A first miss gets one hint and Try again or Show the answer;
   only the first check is scored.

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
  /* Tool Studio (docs/tools-calm.md): with the page's studio flag a pathway
     is drawn in #app and moved into the calm frame (studioPathway,
     studioDrill, studioList); lookups go through the document. */
  var S = window.AnpToolKit && window.AnpToolKit.studio ? window.AnpToolKit.studio() : null;
  function Q(){ return S ? document : app; }
  function pq(el, sel){ return (S ? document : el).querySelector(sel); }
  if(S){ S.root.classList.add('pw-ls'); S.caption('Loading pathways…'); }

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

    if(S) S.reset();
    app.innerHTML = '<div class="pw">' +
      '<p class="pw-lead">Each pathway comes three ways: <b>put the steps in order</b>, <b>find the missing step</b>, and <b>spot the error</b>. After you answer, the pathway plays step by step on a diagram, with why each step comes where it does.</p>' +
      '<p class="anp-small pw-progress">' + done + ' of ' + total + ' done right · the dots show order, missing step and error</p>' +
      chips + groups + '</div>';
    Q().querySelectorAll('.pw-chip').forEach(function(b){
      b.addEventListener('click', function(){ listFilter = b.getAttribute('data-f'); showList(); var again = Q().querySelector('.pw-chip[data-f="' + listFilter + '"]'); if(again) again.focus(); });
    });
    var sel = Q().querySelector('#pw-chsel');
    if(sel) sel.addEventListener('change', function(){ listFilter = sel.value; showList(); var ns = Q().querySelector('#pw-chsel'); if(ns) ns.focus(); });    if(S) studioList();
  }

  /* Open on an item, not the list (docs/tools-upgrade.md, P1-A&P): the
     first pathways in list order, within ?chapter= / ?topic=, with something
     not yet answered right; #all is the full list. The picker above the item
     reaches every pathways. */
  // Every pathway in course order (chapter, then topic): the picker's order.
  function sortedAll(){
    var order = cur().chapters.map(function(c){ return c.id; }), topicOrder = cur().topics.map(function(t){ return t.id; });
    return DATA.pathways.slice().sort(function(a, b){
      return order.indexOf(chapterOf(a)) - order.indexOf(chapterOf(b)) || topicOrder.indexOf(a.topic) - topicOrder.indexOf(b.topic);
    });
  }
  // "Next pathway": the next one in that order, inside ?chapter= when set.
  function nextOf(p){ var list = ordered(); if(list.indexOf(p) < 0) list = sortedAll(); return list[(list.indexOf(p) + 1) % list.length]; }
  function ordered(){
    var q = params(), want = q.chapter || (q.topic && topicInfo(q.topic) ? topicInfo(q.topic).chapter : '');
    var all = sortedAll();
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
    var host = Q().querySelector('.pw-pickhost'), K = window.AnpToolKit;
    if(!host || !K) return;
    var chapters = [];
    var all = sortedAll();
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
    var next = nextOf(p);
    if(S) S.reset();
    app.innerHTML = '<div class="pw pw-view">' +
      '<div class="pw-pickhost"></div>' +
      '<h2 class="pw-title" tabindex="-1">' + esc(p.title) + '</h2>' +
      '<p class="anp-small pw-meta">Topic: ' + topicLink(p.topic) + ' · ' + p.steps.length + ' steps</p>' +
      (K() ? K().about('<p>' + html(p.intro) + '</p>', 'About this pathway') : '<p class="pw-intro">' + html(p.intro) + '</p>') +
      (p.trace ? '<section class="pt" aria-labelledby="pt-h"></section>' : '') +
      (p.trace ? '<h3 class="pw-drill-h">Drills</h3>' : '') +
      '<div class="pw-tabs kt-seg" role="tablist" aria-label="Ways to practice this pathway">' + VARIANTS.map(function(v){
        var s = status(itemId(p, v.key));
        return '<button type="button" role="tab" id="pw-tab-' + v.key + '" aria-controls="pw-panel" aria-selected="' + (v.key === variant) + '" tabindex="' + (v.key === variant ? '0' : '-1') + '" data-v="' + v.key + '" class="pw-tab">' +
          esc(v.tab) + (s === 'right' ? ' <span class="pw-tick" aria-label="done">✓</span>' : s === 'missed' ? ' <span class="pw-miss" aria-label="missed last time">✗</span>' : '') + '</button>';
      }).join('') + '</div>' +
      '<div id="pw-panel" class="pw-panel" role="tabpanel" aria-labelledby="pw-tab-' + variant + '"></div>' +
      '<p class="pw-next"><a class="btn-outline" href="#' + esc(next.id) + '">Next pathway: ' + esc(next.title) + ' →</a></p>' +
      '</div>';
    addPicker(p);
    if(p.trace) traceView(p, Q().querySelector('.pt'));
    if(S) studioPathway(p, variant);
    var tabs = Q().querySelectorAll('.pw-tab');
    var panel = Q().querySelector('#pw-panel');
    /* A tab switches the drill below in place: the page keeps its scroll
       position and the figure above keeps its Watch / Trace it state. (It
       used to re-route, which redrew the whole page, reset Trace it and
       jumped focus and scroll to the title.) */
    function drill(v, focus){
      if(player){ player.stop(); player = null; }
      tabs.forEach(function(t){ var on = t.getAttribute('data-v') === v; t.setAttribute('aria-selected', String(on)); t.tabIndex = on ? 0 : -1; if(on && focus) t.focus(); });
      panel.setAttribute('aria-labelledby', 'pw-tab-' + v);
      if(location.hash !== '#' + p.id + '/' + v) history.replaceState(null, '', '#' + p.id + '/' + v);
      if(S && !p.trace) S.mode(v);
      if(v === 'order') orderVariant(p, panel);
      else if(v === 'missing') missingVariant(p, panel);
      else errorVariant(p, panel);
    }
    tabs.forEach(function(b, k){
      b.addEventListener('click', function(){ drill(b.getAttribute('data-v'), false); });
      b.addEventListener('keydown', function(e){
        var d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
        if(e.key === 'Home') d = -k; if(e.key === 'End') d = tabs.length - 1 - k;
        if(!d) return;
        e.preventDefault();
        drill(tabs[(k + d + tabs.length) % tabs.length].getAttribute('data-v'), true);
      });
    });
    drill(variant, focusTab);
    if(!focusTab && booted){ var h = Q().querySelector('.pw-title'); if(h) h.focus(); }
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
      '<div class="pt-modes kt-seg" role="group" aria-label="Figure mode"><button type="button" class="pt-mode" data-m="watch" aria-pressed="true">Watch</button>' +
      '<button type="button" class="pt-mode" data-m="trace" aria-pressed="false">Trace it' + (st === 'right' ? ' <span class="pw-tick" aria-label="done">✓</span>' : st === 'missed' ? ' <span class="pw-miss" aria-label="missed last time">✗</span>' : '') + '</button></div></div>' +
      '<div class="pt-stage"><div class="pt-fig" style="aspect-ratio:' + W + ' / ' + H + ';--pt-r:' + (W / H).toFixed(4) + '">' +
        (T.srcset ? '<picture><source type="image/avif" srcset="' + esc(T.srcset) + '" sizes="(max-width: 760px) 100vw, 720px"><img src="' + esc(BASE + T.src) + '" alt="' + esc(T.alt) + '" width="' + W + '" height="' + H + '" decoding="async"></picture>'
          : '<img src="' + esc(BASE + T.src) + '" alt="' + esc(T.alt) + '" width="' + W + '" height="' + H + '" decoding="async">') +
        T.covered.map(function(b){ return '<span class="pt-cover" aria-hidden="true" style="' + at(b) + '"></span>'; }).join('') +
        '<svg class="pt-svg" viewBox="0 0 ' + W + ' ' + H + '" aria-hidden="true" focusable="false">' +
          /* token art (visual polish 2026-10): a red cell with its pale centre, a glowing impulse, a fluid drop, a food bolus */
          '<defs><radialGradient id="ptg-blood"><stop offset="0" stop-color="#F08A7C"/><stop offset=".42" stop-color="#E35B4B"/><stop offset=".7" stop-color="#C0281C"/><stop offset="1" stop-color="#7E1610"/></radialGradient>' +
          '<radialGradient id="ptg-o2"><stop offset="0" stop-color="#FFB48A"/><stop offset=".42" stop-color="#F07A3A"/><stop offset=".7" stop-color="#D55E00"/><stop offset="1" stop-color="#8A3A00"/></radialGradient>' +
          '<radialGradient id="ptg-deo2"><stop offset="0" stop-color="#9CC3EE"/><stop offset=".42" stop-color="#5C93D3"/><stop offset=".7" stop-color="#2B6CB0"/><stop offset="1" stop-color="#173E68"/></radialGradient>' +
          '<radialGradient id="ptg-ex"><stop offset="0" stop-color="#C9A6E4"/><stop offset=".42" stop-color="#A27CC4"/><stop offset=".7" stop-color="#7A4E9C"/><stop offset="1" stop-color="#4A2C63"/></radialGradient>' +
          '<radialGradient id="ptg-impulse"><stop offset="0" stop-color="#FFFBE0"/><stop offset=".35" stop-color="#FFE066"/><stop offset=".8" stop-color="#F2B400"/><stop offset="1" stop-color="#B07A00"/></radialGradient>' +
          '<radialGradient id="ptg-fluid" cx=".38" cy=".32"><stop offset="0" stop-color="#E4F3FF"/><stop offset=".3" stop-color="#8CC6F5"/><stop offset="1" stop-color="#2F7FCC"/></radialGradient>' +
          '<radialGradient id="ptg-food" cx=".38" cy=".32"><stop offset="0" stop-color="#E8C08C"/><stop offset=".5" stop-color="#B07A44"/><stop offset="1" stop-color="#6E4520"/></radialGradient></defs>' +
          '<g class="pt-trail"></g><g class="pt-hint"></g><g class="pt-hits"></g><circle class="pt-token tok-' + esc(T.token) + '" r="' + R + '" cx="-99" cy="-99"/></svg>' +
        '<div class="pt-boxes"></div>' +
      '</div></div>' +
      '<div class="pt-bar"></div>' +
      '<p class="pt-cap" aria-live="polite"></p>' +
      '<p class="lp-credit pt-credit">' + T.attribution + '</p>';
    var svg = host.querySelector('.pt-svg'), trail = host.querySelector('.pt-trail'), hint = host.querySelector('.pt-hint'), hits = host.querySelector('.pt-hits');
    var token = host.querySelector('.pt-token'), bar = host.querySelector('.pt-bar'), cap = host.querySelector('.pt-cap'), boxes = host.querySelector('.pt-boxes');
    var figEl = host.querySelector('.pt-fig');   // kept: the studio moves the figure out of host
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
      if(jump.indexOf(i) < 0) trail.appendChild(mk('line', { x1: a[0], y1: a[1], x2: b[0], y2: b[1], 'class': 'pt-seg-under', 'stroke-width': SW * 1.9 }));
      trail.appendChild(mk('line', { x1: a[0], y1: a[1], x2: b[0], y2: b[1], 'class': 'pt-seg' + (jump.indexOf(i) > -1 ? ' is-jump' : '') + (tone(i) ? ' tone-' + tone(i) : ''), 'stroke-width': SW * 1.3 }));
      // a chevron at the middle of the segment shows which way it runs
      var len = Math.hypot(b[0] - a[0], b[1] - a[1]);
      if(len > R * 6 && jump.indexOf(i) < 0){
        var ang = Math.atan2(b[1] - a[1], b[0] - a[0]) * 180 / Math.PI, mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2, c = SW * 2.4;
        trail.appendChild(mk('path', { d: 'M' + (-c) + ' ' + (-c) + ' L' + c + ' 0 L' + (-c) + ' ' + c, transform: 'translate(' + mx.toFixed(1) + ' ' + my.toFixed(1) + ') rotate(' + ang.toFixed(1) + ')', 'class': 'pt-chev' + (tone(i) ? ' tone-' + tone(i) : ''), 'stroke-width': Math.max(1.5, SW * 0.7) }));
      }
    }
    function dot(i, cls){
      trail.appendChild(mk('circle', { cx: T.pts[i][0], cy: T.pts[i][1], r: R * 0.5, 'class': 'pt-dot' + (cls ? ' ' + cls : '') + (tone(i) ? ' tone-' + tone(i) : '') }));
      trail.appendChild(mk('circle', { cx: T.pts[i][0], cy: T.pts[i][1], r: R * 0.2, 'class': 'pt-dotc' + (tone(i) ? ' tone-' + tone(i) : '') }));
    }
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
      figEl.classList.remove('is-trace');
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
      cap.innerHTML = '<span class="kt-first">Press Play to follow the ' + esc(noun) + ' through all ' + n + ' steps.</span>';
      bar.querySelector('.pt-prev').disabled = true;
    }
    /* ---- Trace it */
    function traceIt(){
      mode = 'trace'; stop(); anim++;
      figEl.classList.add('is-trace');
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
      figEl.onclick = function(e){
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

  /* ------------------------------------------------------------ Tool Studio
     A pathway with a figure: Watch | Trace it | Drills. The real figure is
     the stage for Watch and Trace it (Play and the step arrows in the dock;
     the step caption is the live caption); Drills puts the drill's steps on
     the stage with the drill choice as one row of chips in the dock. A
     pathway without a figure: the three drills are the modes. In a drill the
     steps (to order, with the gap, or to pick) are the stage, the choices,
     Check and the result the dock; after an answer the pathway's diagram
     tops the stage and its player sits in the dock. The pathway picker is
     one row at the foot of the dock. Why: about this pathway; Details:
     topic, Next pathway, the figure credit. */
  var drillParts = [];
  function studioPathway(p, variant){
    function $(sel){ return app.querySelector(sel); }
    S.modeBar(true);
    var dm = p.trace ? 'drills' : null;
    var first = p.trace ? (/(^|\/)(order|missing|error)$/.test(location.hash) ? 'drills' : 'watch') : variant;
    function modeTo(v){
      if(v === 'watch' || v === 'trace'){ var b = Q().querySelector('.pt-mode[data-m="' + v + '"]'); if(b) b.click(); }
      else if(v === 'drills'){ if(tracer) tracer.stop(); }
      else { var t = Q().querySelector('.pw-tab[data-v="' + v + '"]'); if(t) t.click(); }
    }
    S.modes({
      items: p.trace ? [{ value: 'watch', label: 'Watch' }, { value: 'trace', label: 'Trace it' }, { value: 'drills', label: 'Drills' }]
        : VARIANTS.map(function(v){ return { value: v.key, label: v.key === 'order' ? 'Order' : v.tab }; }),
      value: first, onChange: modeTo
    });
    S.put('stage', $('.pw-title'));
    if(p.trace){
      S.put('stage', $('.pt-stage'), { mode: 'watch trace' });
      S.put('dock', $('.pt-bar'), { mode: 'watch trace' });
      S.mirror($('.pt-cap'));
      var tabs = $('.pw-tabs');
      tabs.classList.add('pw-ls-drills');
      S.put('dock', tabs, { mode: 'drills' });
    }
    S.put('dock', $('#pw-panel'), dm ? { mode: dm } : null);
    S.put('dock', $('.pw-pickhost'));
    var ab = $('.kt-about'), w = document.createElement('div');
    w.className = 'ls-sec';
    w.innerHTML = '<h3 class="ls-h">About this pathway</h3>' + (ab ? ab.querySelector('.kt-about-b').innerHTML : '') +
      '<p class="ls-sub">' + (p.trace ? 'Watch follows the pathway on the real figure; Trace it asks you to tap each next stop (scored once a visit). ' : '') +
      'The drills: put the steps in order, find the missing step, spot the wrong one. After each answer the pathway plays step by step with why each step comes where it does.</p>';
    if(ab) ab.parentNode.removeChild(ab);
    S.put('why', w);
    var d = document.createElement('div');
    d.className = 'ls-sec pw-ls-det';
    [$('.pw-meta'), $('.pw-next'), $('.pt-credit')].forEach(function(x){ if(x) d.appendChild(x); });
    S.put('details', d);
    var dh = $('.pw-drill-h'); if(dh) dh.parentNode.removeChild(dh);
    S.mode(first);
    if(p.trace && first === 'drills' && tracer) tracer.stop();
    if(!studioPathway.hinted){
      studioPathway.hinted = true;
      S.hint(p.trace && first !== 'drills' ? { target: '.ls-dock .pt-play', text: 'Press Play to follow it' } : { target: '.ls-dock .pw-bank .pw-bcard, .ls-stage .pw-pick, .ls-dock .pw-choices .anp-opt', text: 'Start here' });
    }
  }
  function studioDrill(p, panel){
    var dm = p.trace ? 'drills' : null;
    drillParts.forEach(function(x){ if(x.parentNode) x.parentNode.removeChild(x); });
    drillParts = [];
    // the old diagram from an earlier answer goes with its drill
    S.stage.querySelectorAll('.pw-fig').forEach(function(f){ f.parentNode.removeChild(f); });
    /* Stage: the pathway map (and, for Spot the error, the steps to tap).
       Dock: the step bank or the choices, Check, the hint and the result, so
       the map keeps its shape while the student works. */
    ['.pw-cyclenote', '.pw-figslot', '.pw-fulld', '.pw-order', '.pw-pickable'].forEach(function(sel){
      var x = panel.querySelector(sel);
      if(x){ drillParts.push(x); S.put('stage', x, dm ? { mode: dm } : null); }
    });
    var task = panel.querySelector('.kt-first.pw-task');
    if(task){ S.caption(task.innerHTML, dm || undefined); task.parentNode.removeChild(task); }
    if(panel._map) panel._map.fit();
    S.stage.scrollTop = 0;
  }
  function studioList(){
    S.modeBar(false);
    var root = app.querySelector('.pw'), lead = root.querySelector('.pw-lead');
    S.put('stage', root);
    if(lead) S.put('why', lead);
    S.caption('Pick a pathway: watch it, trace it, then drill it.');
    S.stage.scrollTop = 0;
  }

  /* ------------------------------------------------------- the pathway map
     Every pathway is drawn from its own step data (tool audit 2026-10): a
     numbered node per step, each with a small icon for the kind of step
     (heart, vessel, lung, nephron, impulse, channel, hormone and so on), in a
     two- or three-column snake joined by the course's arrows ("flows to"
     dashed for blood and fluid, "causes" solid for mechanisms). Blood steps
     take the oxygenated or deoxygenated color. The drills fill it: placing a
     step lights its node, a gap stays a dashed "?", and after an answer each
     node shows whether it was right, with the student's step struck through
     where it was not. A step can name its own icon with "icon" in the data;
     otherwise it is chosen from its label and text, then from the chapter. */
  var ICON = {
    heart: '<path d="M12 20.5s-7.5-4.6-7.5-10.4A4.2 4.2 0 0 1 12 7.6a4.2 4.2 0 0 1 7.5 2.5c0 5.8-7.5 10.4-7.5 10.4z"/><path d="M9.2 11.2c.5-1.2 1.4-1.8 2.3-1.8"/>',
    valve: '<circle cx="12" cy="12" r="8.5"/><path d="M12 12V3.5M12 12l-7.3 4.2M12 12l7.3 4.2"/><path d="M9.6 6.8 12 9.4l2.4-2.6"/>',
    vessel: '<path d="M2.5 8.2c3.2-1.6 6.3 1.6 9.5 0s6.3-1.6 9.5 0M2.5 15.8c3.2-1.6 6.3 1.6 9.5 0s6.3-1.6 9.5 0"/><ellipse cx="8" cy="12" rx="2" ry="1.4"/><ellipse cx="15.5" cy="12.1" rx="2" ry="1.4"/>',
    lung: '<path d="M12 3v8.5M12 9.5c-.8 1.3-2 2-3 2.2M12 9.5c.8 1.3 2 2 3 2.2"/><path d="M9.3 6.6C6 6.8 4 11.4 4 16.3c0 2.8 1.2 3.9 3 3.9 2 0 3-1.4 3-3.7V9.9M14.7 6.6c3.3.2 5.3 4.8 5.3 9.7 0 2.8-1.2 3.9-3 3.9-2 0-3-1.4-3-3.7V9.9"/>',
    kidney: '<path d="M14.6 3.6c-4.4 0-8.1 3.6-8.1 8.4s3.7 8.4 8.1 8.4c2.7 0 4.2-1.8 4.2-3.8 0-1.6-1.3-2.6-2.7-2.6-1.2 0-2-.8-2-2s.8-2 2-2c1.4 0 2.7-1 2.7-2.6 0-2-1.5-3.8-4.2-3.8z"/><path d="M13.9 12c-1.6 0-2.6 1.2-3.2 3.1M10.7 15.1c-.4 1.7-.6 3.6-.6 5.4"/>',
    gut: '<path d="M9.4 2.8v4.1c0 1.9-4.1 3-4.1 8.3 0 3.8 3 6 7 6 4.6 0 7-3 7-6.2 0-2.6-1.9-4-4-4-1.6 0-2.8.9-2.8-1.1V2.8"/><path d="M8.8 15.4c1.2 1.2 3.1 1.5 4.8.6"/>',
    muscle: '<path d="M4 4.5v15M20 4.5v15"/><path d="M4 8.2h7.2M4 15.8h7.2M20 8.2h-7.2M20 15.8h-7.2"/><path d="M7.8 12h8.4" stroke-width="3.2"/>',
    synapse: '<path d="M2.8 3.8c5.4 0 8.6 3.4 8.6 8.2s-3.2 8.2-8.6 8.2"/><circle cx="6" cy="9" r="1.5"/><circle cx="7.6" cy="13.4" r="1.5"/><circle cx="5" cy="16" r="1.2"/><path d="M17.6 3.8c-1.7 4.5-1.7 11.9 0 16.4"/><circle cx="14.6" cy="9.8" r=".9" class="pwi-f"/><circle cx="14.2" cy="14.2" r=".9" class="pwi-f"/>',
    impulse: '<path d="M2 15h5l2.2-10.5L12.6 20l2.2-5H22"/>',
    eye: '<path d="M2 12s3.8-6.8 10-6.8S22 12 22 12s-3.8 6.8-10 6.8S2 12 2 12z"/><circle cx="12" cy="12" r="3.2"/><circle cx="12" cy="12" r="1.1" class="pwi-f"/>',
    sound: '<path d="M3.5 9.2h3.8L12.2 5v14l-4.9-4.2H3.5z"/><path d="M15.6 9.1a4.2 4.2 0 0 1 0 5.8M18.3 6.4a8.1 8.1 0 0 1 0 11.2"/>',
    brain: '<path d="M12 4.6c-.9-1.6-4.6-1.8-5.7.9-2.7.1-3.9 3.4-2 5.6-1.8 2 .1 5.8 2.9 5.5.9 2 4 2.1 4.8.1zM12 4.6c.9-1.6 4.6-1.8 5.7.9 2.7.1 3.9 3.4 2 5.6 1.8 2-.1 5.8-2.9 5.5-.9 2-4 2.1-4.8.1"/><path d="M12 4.6V18M8.4 9.2c1.1.4 1.6 1.3 1.6 2.4M15.6 9.2c-1.1.4-1.6 1.3-1.6 2.4M7.4 14c1 0 1.9-.4 2.4-1.2M16.6 14c-1 0-1.9-.4-2.4-1.2"/>',
    channel: '<path d="M2 8.6h6.4M15.6 8.6H22M2 15.4h6.4M15.6 15.4H22"/><rect x="8.4" y="6" width="2.6" height="12" rx="1.2"/><rect x="13" y="6" width="2.6" height="12" rx="1.2"/><path d="M12 2.6v18.2M10 18.6l2 2.2 2-2.2"/>',
    receptor: '<path d="M2.5 16.5h19"/><path d="M12 21v-6.2M12 14.8 8.4 10.6M12 14.8l3.6-4.2"/><path d="m9.6 6.4 2.4-2.6 2.4 2.6-2.4 2.6z"/>',
    hormone: '<path d="M12 3.2c3.2 4.2 6 7.2 6 11a6 6 0 0 1-12 0c0-3.8 2.8-6.8 6-11z"/><path d="M9.4 14.6a2.7 2.7 0 0 0 2.6 2.7"/>',
    enzyme: '<path d="M18.6 7.6A8 8 0 1 0 18.6 16.4L12 12z"/><circle cx="20.6" cy="12" r="1.6"/><circle cx="9" cy="8.6" r=".9" class="pwi-f"/>',
    energy: '<path d="M13.4 2.6 5.2 13.6h6.1l-1 7.8 8.4-11.2h-6.2z"/>',
    molecule: '<path d="M12 3.2 19.6 7.6v8.8L12 20.8l-7.6-4.4V7.6z"/><path d="M12 7.4 15.8 9.6M8.2 14.4 12 16.6"/>',
    dna: '<path d="M7 2.8c0 5.2 10 7 10 9.2s-10 4-10 9.2M17 2.8c0 5.2-10 7-10 9.2s10 4 10 9.2"/><path d="M8.6 6.2h6.8M9.6 9.4h4.8M9.6 14.6h4.8M8.6 17.8h6.8"/>',
    bone: '<path d="M7.8 16.2 16.2 7.8" stroke-width="3.4"/><circle cx="5.6" cy="15.4" r="2.3"/><circle cx="8.6" cy="18.4" r="2.3"/><circle cx="15.4" cy="5.6" r="2.3"/><circle cx="18.4" cy="8.6" r="2.3"/>',
    thermo: '<path d="M9.8 4.4a2.2 2.2 0 0 1 4.4 0v9.8a4.4 4.4 0 1 1-4.4 0z"/><path d="M12 8.6v8.2"/><circle cx="12" cy="17.4" r="1.6" class="pwi-f"/>',
    repro: '<circle cx="14" cy="12.4" r="6.4"/><circle cx="14" cy="12.4" r="2.2"/><path d="M2.4 5.6c1.6-.6 2.6.6 4.2.4" /><ellipse cx="7.8" cy="6.4" rx="1.6" ry="1.1" transform="rotate(20 7.8 6.4)"/>',
    gauge: '<path d="M3.6 16.4a8.4 8.4 0 1 1 16.8 0"/><path d="M12 16.4 16.2 10.8"/><circle cx="12" cy="16.4" r="1.5" class="pwi-f"/><path d="M6.2 11.6l1.4.9M12 7.4V9M17.8 11.6l-1.4.9"/>',
    cell: '<circle cx="12" cy="12" r="8.6"/><circle cx="11" cy="11" r="3.2"/><ellipse cx="16.4" cy="15.6" rx="1.8" ry="1" transform="rotate(-30 16.4 15.6)"/><circle cx="7.6" cy="16" r=".9" class="pwi-f"/>',
    clot: '<path d="M3 6.4 21 17.2M3 17.6 21 6.6M2.6 12h18.8M8.4 3.6l7 16.8"/><ellipse cx="12" cy="12" rx="3.4" ry="2.2" class="pwi-f"/>',
    immune: '<path d="M12 21.2v-8.4M12 12.8 6.4 6.6M12 12.8l5.6-6.2M9.6 15.2 5 10.2M14.4 15.2l4.6-5"/><circle cx="5.4" cy="5.2" r="1.7"/><circle cx="18.6" cy="5.2" r="1.7"/>',
    layer: '<path d="m3 7.4 9-4.2 9 4.2-9 4.2z"/><path d="m3 12.2 9 4.2 9-4.2M3 16.8l9 4.2 9-4.2"/>',
    joint: '<path d="M4.2 19.8 9.6 14.4" stroke-width="3"/><path d="M14.4 9.6l5.4-5.4" stroke-width="3"/><circle cx="12" cy="12" r="3.2"/><path d="M5.8 8.6a8.2 8.2 0 0 1 2.8-2.8"/><path d="M8.6 5.8l.4-2M5.8 8.6l-2 .4"/>',
    fluid: '<path d="M12 2.8c2.2 2.8 4.2 5 4.2 7.6a4.2 4.2 0 0 1-8.4 0c0-2.6 2-4.8 4.2-7.6z"/><path d="M2.6 17c3.1-1.8 6.3 1.8 9.4 0s6.3-1.8 9.4 0M2.6 21c3.1-1.8 6.3 1.8 9.4 0s6.3-1.8 9.4 0"/>',
    step: '<circle cx="12" cy="12" r="8.6"/><path d="M8 12h8M13 8.8 16.2 12 13 15.2"/>'
  };
  // the color family of each kind of step (pathways.css --pwk-*)
  var FAM = { heart: 'cv', valve: 'cv', vessel: 'cv', clot: 'cv', lung: 'rs', kidney: 'rn', fluid: 'rn', channel: 'rn', gut: 'gi',
    muscle: 'ms', bone: 'ms', joint: 'ms', layer: 'ms', synapse: 'nv', impulse: 'nv', eye: 'nv', sound: 'nv', brain: 'nv',
    receptor: 'ch', hormone: 'ch', enzyme: 'ch', energy: 'ch', molecule: 'ch', gauge: 'ch', thermo: 'ch',
    dna: 'ce', cell: 'ce', repro: 'ce', immune: 'im', step: 'ce' };
  // tried in order on the label, then on the text; the first match wins
  var KINDS = [
    ['valve', /\bvalves?\b|\bcusps?\b|chordae/i],
    ['brain', /lateral ventricle|third ventricle|fourth ventricle|aqueduct|\bCSF\b|cerebrospinal|choroid|arachnoid granul|apertures?\b/i],
    ['heart', /\batri(a|um|al)\b|(left|right) ventricle|ventricles? (contract|fill|relax)|\bheart\b|cardiac|\bSA node|\bAV node|bundle of his|bundle branch|purkinje|myocard/i],
    ['clot', /platelet|fibrin|thrombin|\bclot|factor [IVX]+|\b[IVX]+a\b|prothrombin|coagul|\bvWF\b|von willebrand/i],
    ['immune', /antibod|antigen|\b[TB] cells?\b|macrophag|phagocyt|neutrophil|lymphocyte|complement|\bMHC\b|immun|helper|cytotoxic|plasma cells?|dendritic|inflamm|histamine|pathogen|mast cell|lymph\b|lymph node/i],
    ['lung', /alveol|\blungs?\b|bronch|trache|airway|inhal|exhal|breath|\bair\b|pharynx|larynx|nasal|diaphragm|pleura|epiglott|ventilat|surfactant|\bcough/i],
    ['kidney', /glomerul|tubule|nephron|filtrate|henle|collecting duct|\burine|ureter|bladder|urethr|bowman|kidney|renal|juxtaglom|macula densa|micturi|limb (loses|gains)|descending limb|ascending limb|\bduct\b/i],
    ['gut', /stomach|intestin|duoden|jejun|ileum|\bcolon|rect(um|al)|esophag|bolus|chyme|swallow|mouth|chew|saliva|\bbile|gallbladder|pancrea|fec(es|al)|digest|gastric|villi|lacteal|micelle|chylomicron|peristal|defecat|\bgut\b|liver|portal vein|hepat/i],
    ['muscle', /myosin|actin|cross-?bridge|sarcomere|troponin|tropomyosin|muscle|myofib|sarcoplasmic|\bSR\b|t[- ]tubule|power stroke|filaments?|myoblast|perimysium|endomysium|epimysium|fascicle/i],
    ['synapse', /vesicle|neurotransmitter|acetylcholine|\bACh\b|exocytosis|synap|cleft|norepinephrine/i],
    ['vessel', /aort|arter|\bveins?\b|vena|venule|capillar|vessel|coronary sinus|bloodstream|circulat|\bblood\b/i],
    ['eye', /\blight\b|retina|photorecept|\brods?\b|\bcones?\b|\blens\b|cornea|pupil|optic|\beyes?\b|rhodopsin|visual|aqueous|vitreous/i],
    ['sound', /sound|cochlea|hair cells?|\bears?\b|tympan|ossicle|stapes|malleus|incus|vibrat|basilar|endolymph|vestibul|odorant|olfact|\btaste\b|gustat/i],
    ['impulse', /action potential|impulse|depolari|repolari|hyperpolar|axon|\bnerves?\b|neurons?\b|signal|conduct|threshold|spinal cord|reflex|sensory receptor|ganglion|motor (neuron|end)|dendrite|\bmV\b|upstroke|dorsal root|ventral root|\broot\b|myelin|sprout/i],
    ['brain', /hypothalam|pituitar|cortex|\bbrain|medulla|\bpons\b|cerebell|thalam|\bCNS\b|control center|brainstem|limbic|amygdala|cerebr/i],
    ['channel', /channels?\b|\bNa\+|\bK\+|Ca2\+|Ca²⁺|Na⁺|K⁺|Cl[⁻−-]|HCO3|sodium|potassium|calcium|chloride|bicarbonate|\bions?\b|\bpump|gradient|diffus|osmo|transporter|symporter|antiporter|\bGLUT|\bNKCC|cotransport|\bH\+|\bNH[34]/i],
    ['receptor', /\bbinds?\b|receptor|binding|attach|second messenger|\bcAMP|G protein|kinase|phosphoryl/i],
    ['hormone', /hormone|secret|gland|insulin|glucagon|cortisol|thyro|\bTSH\b|ACTH|\bADH\b|aldosterone|renin|angiotensin|oxytocin|estrogen|progesterone|testosterone|\bLH\b|\bFSH\b|\bPTH\b|calcitriol|epinephrine|ghrelin|leptin|releas|prolactin|GnRH|\bhCG\b|erythropoietin|\bEPO\b|iodide|\bT[34]\b/i],
    ['enzyme', /enzyme|\w{3,}ase\b|cataly|cleav|breaks? (down|apart)|hydroly|active site|substrate|activates/i],
    ['energy', /\bATP\b|NADH|FADH|electron|proton|oxidative|\bkcal|energy/i],
    ['fluid', /\bwater\b/i],
    ['molecule', /glucose|glycoly|pyruv|acetyl[ -]?CoA|krebs|citric|oxaloacet|fatty acid|ketone|glycogen|amino acid|protein|lactate|lactic|sugar|starch|lipid|triglycer|monosacch|peptide|vitamin|\bfat\b|urea|ammonia|\bCO2\b|\bO2\b|oxygen|carbon dioxide/i],
    ['dna', /\bDNA\b|\bRNA\b|mRNA|\bgenes?\b|transcri|translat|ribosom|codon|nucle(us|i)\b|chromosom|mitosis|meiosis|replicat|chromatid|spindle|gametes?|allele|punnett|genotype/i],
    ['bone', /\bbones?\b|osteo|calcif|cartilage|ossif|marrow|epiphys|fracture|callus|\bskull\b|suture|fontanel|sphenoid|ethmoid|carpal|hamate|scaphoid|lunate|trochanter|\bcrest\b|vertebra|\bribs?\b|femur|humerus|fossa/i],
    ['joint', /\bjoint|flex|extend|extension|abduct|adduct|rotat|lever|tendon|ligament|elbow|knee|shoulder|\bhip\b|\bjaw\b|grip|movement|forearm|\bheel\b|tiptoe|\bcuff\b|bursa/i],
    ['thermo', /temperat|\bheat|\bcold\b|sweat|shiver|fever|thermo/i],
    ['repro', /sperm|\bov(um|a)\b|\beggs?\b|oocyte|follic|ovul|uter(us|ine)|embryo|zygote|fertili[sz]|placent|implant|menstru|\blabor\b|cervi[xc]|\bbaby\b|fetal|fetus|blastocyst|corpus luteum|endometri|gastrul|neural (plate|tube)|germ layer|ectoderm|mesoderm|endoderm|testis|testes|milk|suckl/i],
    ['gauge', /pressure|stretch|baroreceptor|chemoreceptor|set point|detect/i],
    ['layer', /\bskin\b|epiderm|derm(is|al)|keratin|fascia|\blayers?\b|dura|\bpia\b|arachnoid|subcutan|wound|scab|\bscar\b/i],
    ['fluid', /fluid|water|plasma|volume|interstitial|\bedema|\bsalt\b|saline|\bIV\b|\bD5W\b/i],
    ['cell', /\bcells?\b|membrane|cytoplasm|organelle|mitochond|lysosom|golgi|endoplasm/i]
  ];
  var CHAPTER_KIND = { orientation: 'layer', 'chem-physics': 'molecule', cells: 'cell', tissues: 'layer', 'cell-communication': 'receptor',
    integumentary: 'layer', 'bone-tissue': 'bone', skeleton: 'bone', joints: 'joint', 'muscle-tissue': 'muscle', 'muscular-system': 'joint',
    'nervous-tissue': 'impulse', cns: 'brain', pns: 'impulse', 'special-senses': 'eye', autonomic: 'impulse', endocrine: 'hormone',
    blood: 'clot', cardiovascular: 'vessel', 'lymph-immune': 'immune', respiratory: 'lung', digestive: 'gut', metabolism: 'molecule',
    urinary: 'kidney', 'fluid-acid-base': 'fluid', reproductive: 'repro', development: 'repro' };
  function stepKind(p, s){
    if(s.icon && ICON[s.icon]) return s.icon;
    var srcs = [plain(s.label), plain(s.text)];
    for(var a = 0; a < srcs.length; a++) for(var i = 0; i < KINDS.length; i++) if(KINDS[i][1].test(srcs[a])) return KINDS[i][0];
    return CHAPTER_KIND[chapterOf(p)] || 'step';
  }
  function iconSvg(kind, x, y, size, cls){
    var g = el('g', { 'class': 'pwi ' + (cls || ''), transform: 'translate(' + x + ',' + y + ') scale(' + (size / 24) + ')' });
    g.innerHTML = ICON[kind] || ICON.step;
    return g;
  }
  // an inline icon for HTML lists (the step to spot in Spot the error)
  function iconTag(p, s, neutral){
    var k = stepKind(p, s);
    // in the bank a blood step keeps its family color: its oxygen color would say which half it goes in
    return '<span class="pw-ib fam-' + (!neutral && (s.blood === 'o2' || s.blood === 'deo2') ? s.blood : FAM[k]) + '" aria-hidden="true"><svg viewBox="0 0 24 24" class="pwi">' + ICON[k] + '</svg></span>';
  }

  var NW = 168, NH = 58, GX = 30, GY = 30, PAD = 10;
  function colsFor(n){ return n > 6 && window.matchMedia && window.matchMedia('(min-width: 1000px)').matches ? 3 : 2; }
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
    for(var a in attrs) if(attrs.hasOwnProperty(a) && attrs[a] != null) e.setAttribute(a, attrs[a]);
    if(text != null) e.textContent = text;
    return e;
  }
  function pathMap(p, opt){
    opt = opt || {};
    var n = p.steps.length, cols = opt.cols || colsFor(n), rows = Math.ceil(n / cols);
    var W = PAD * 2 + NW * cols + GX * (cols - 1);
    var H = PAD * 2 + 8 + rows * NH + (rows - 1) * GY + (p.cycle ? 30 : 0);
    function pos(k){
      var row = Math.floor(k / cols), col = k % cols;
      if(row % 2 === 1) col = cols - 1 - col;
      return { x: PAD + col * (NW + GX), y: PAD + 8 + row * (NH + GY), col: col, row: row };
    }
    var svg = el('svg', { viewBox: '0 0 ' + W + ' ' + H, width: W, height: H, role: 'img', 'class': 'pw-svg pw-map cols-' + cols });
    var arrows = el('g', { 'class': 'pw-arrows' }), nodes = el('g', { 'class': 'pw-nodes' });
    svg.appendChild(arrows); svg.appendChild(nodes);
    var slot = [];
    for(var k = 0; k < n; k++){
      var a = pos(k);
      if(k < n - 1){
        var b = pos(k + 1), d;
        if(a.row === b.row){
          var y = a.y + NH / 2;
          d = a.col < b.col ? 'M' + (a.x + NW + 2) + ',' + y + ' L' + (b.x - 4) + ',' + y : 'M' + (a.x - 2) + ',' + y + ' L' + (b.x + NW + 4) + ',' + y;
        } else {
          var x = a.x + NW / 2;
          d = 'M' + x + ',' + (a.y + NH + 2) + ' L' + x + ',' + (b.y - 12);
        }
        arrows.appendChild(el('path', { d: d, 'data-k': k, 'class': p.kind === 'flow' ? 'flows' : 'causes' }));
      }
      var g = el('g', { 'class': 'pw-node', 'data-k': k });
      nodes.appendChild(g);
      slot.push({ g: g, a: a, i: null });
    }
    if(p.cycle){
      var last = pos(n - 1);
      svg.appendChild(el('text', { x: last.x + NW / 2, y: last.y + NH + 24, 'text-anchor': 'middle', 'class': 'pw-cyc' }, '↻ then back to step 1'));
    }
    /* fill(k, i, state, extra): slot k shows step i (null: empty or gap).
       state: '' | 'empty' | 'next' | 'gap' | 'ok' | 'no' | 'marked' | 'picked'. */
    function fill(k, i, state, extra){
      var s = slot[k], g = s.g, a = s.a, st = i != null ? p.steps[i] : null;
      s.i = i;
      while(g.firstChild) g.removeChild(g.firstChild);
      var kind = st ? stepKind(p, st) : null;
      var fam = st ? (st.blood === 'o2' || st.blood === 'deo2' ? st.blood : FAM[kind]) : 'none';
      g.setAttribute('class', 'pw-node fam-' + fam + (state ? ' is-' + state : '') + (st ? ' is-lit' : ''));
      g.appendChild(el('rect', { x: a.x, y: a.y, width: NW, height: NH, rx: 13, 'class': 'pw-box' }));
      if(st){
        g.appendChild(el('circle', { cx: a.x + 24, cy: a.y + NH / 2, r: 17, 'class': 'pw-ibg' }));
        g.appendChild(iconSvg(kind, a.x + 13, a.y + NH / 2 - 11, 22));
      } else {
        g.appendChild(el('circle', { cx: a.x + 24, cy: a.y + NH / 2, r: 17, 'class': 'pw-ibg pw-ibg-empty' }));
        g.appendChild(el('text', { x: a.x + 24, y: a.y + NH / 2 + 6, 'text-anchor': 'middle', 'class': 'pw-q' }, state === 'gap' ? '?' : ''));
      }
      var label = st ? st.label : state === 'gap' ? 'Missing step' : state === 'next' ? 'Place the next step' : '';
      var max = 15, lines = wrap(label, max);
      if(lines.length > 2){ max = 18; lines = wrap(label, max); }
      var small = lines.length > 2 || (extra && extra.yours);
      lines = lines.slice(0, extra && extra.yours ? 2 : 3);
      var lh = small ? 12.5 : 15, top = a.y + NH / 2 - (lines.length - 1) * lh / 2 + 4.5 - (extra && extra.yours ? 7 : 0);
      lines.forEach(function(line, j){ g.appendChild(el('text', { x: a.x + 47, y: top + j * lh, 'class': 'pw-lbl' + (small ? ' is-sm' : '') + (st ? '' : ' is-ph') }, line)); });
      if(extra && extra.yours){
        g.appendChild(el('text', { x: a.x + 47, y: a.y + NH - 9, 'class': 'pw-yours' }, (extra.pre || 'yours: ') + cut(extra.yours, 24)));
      }
      // the step number, a tab on the node's top-left corner
      g.appendChild(el('rect', { x: a.x + 8, y: a.y - 9, width: 22, height: 18, rx: 9, 'class': 'pw-num-bg' }));
      g.appendChild(el('text', { x: a.x + 19, y: a.y + 4.5, 'text-anchor': 'middle', 'class': 'pw-num' }, String(k + 1)));
      if(state === 'ok' || state === 'no'){
        g.appendChild(el('circle', { cx: a.x + NW - 4, cy: a.y + 4, r: 10, 'class': 'pw-mk' }));
        g.appendChild(el('path', { d: state === 'ok' ? 'M' + (a.x + NW - 9) + ',' + (a.y + 4) + ' l3.5,3.5 l6.5,-7' : 'M' + (a.x + NW - 8) + ',' + a.y + ' l8,8 m0,-8 l-8,8', 'class': 'pw-mk-t' }));
      }
      // the arrow into this slot takes the color of the blood leaving the step before it
      var arr = arrows.querySelector('path[data-k="' + k + '"]');
      if(arr){ var tone = st && (st.blood === 'o2' || st.blood === 'deo2') ? ' ' + st.blood : ''; arr.setAttribute('class', (p.kind === 'flow' ? 'flows' : 'causes') + tone + (st ? '' : ' is-faint')); }
      var prev = arrows.querySelector('path[data-k="' + (k - 1) + '"]');
      if(prev && !st) prev.classList.add('is-faint');
      // tap target and accessible name
      g.setAttribute('aria-label', 'Step ' + (k + 1) + ': ' + (st ? plain(st.label) : state === 'gap' ? 'missing' : 'empty') + (state === 'ok' ? ', right' : state === 'no' ? ', wrong' : ''));
      fitNode(g, a);
    }
    /* Every label line is measured once the map is on the page: a line wider
       than its node is squeezed to fit (a long word such as
       "Phosphofructokinase"), and a struck-through "yours" line is shortened
       word by word. */
    function fitNode(g, a){
      if(!svg.isConnected) return;
      var avail = NW - 47 - 9;
      [].forEach.call(g.querySelectorAll('.pw-yours'), function(t){
        var tries = 0;
        try{ while(t.getComputedTextLength() > avail && tries++ < 12){ var s2 = t.textContent.replace(/…$/, '').replace(/\s*\S+$/, ''); if(s2 === t.textContent || s2.length < 6) break; t.textContent = s2 + '…'; } }catch(e){}
      });
      [].forEach.call(g.querySelectorAll('.pw-lbl, .pw-yours'), function(t){
        try{ if(t.getComputedTextLength() > avail){ t.setAttribute('textLength', avail); t.setAttribute('lengthAdjust', 'spacingAndGlyphs'); } }catch(e){}
      });
    }
    function fitAll(){ slot.forEach(function(s){ fitNode(s.g, s.a); }); }
    function label(){
      var parts = slot.map(function(s, k){ return (k + 1) + '. ' + (s.i != null ? plain(p.steps[s.i].label) : '?'); });
      svg.setAttribute('aria-label', p.title + ', step by step: ' + parts.join('; ') + (p.cycle ? '; then back to step 1.' : '.'));
    }
    return { svg: svg, n: n, slot: slot, fit: fitAll, fill: function(k, i, st, ex){ fill(k, i, st, ex); label(); }, fillAll: function(fn){ for(var k = 0; k < n; k++){ var r = fn(k) || {}; fill(k, r.i, r.state, r.extra); } label(); } };
  }
  function mapFig(map){
    var fig = document.createElement('figure');
    fig.className = 'anp-fig pw-fig';
    fig.appendChild(map.svg);
    return fig;
  }

  /* Record the first check of each variant on this visit. */
  function K(){ return window.AnpToolKit && window.AnpToolKit.why ? window.AnpToolKit : null; }
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
  /* A miss is not a dead end: one method hint with Try again, or Show the
     answer. The first check is the one scored. */
  function hintBox(panel, html_, onRetry, onReveal){
    var hb = pq(panel, '.pw-hint');
    hb.innerHTML = '<p>' + html_ + '</p><div class="pw-actions"><button type="button" class="btn-press sm pw-retry">Try again</button> <button type="button" class="btn-outline pw-reveal">Show the answer</button></div>';
    hb.hidden = false;
    // while the hint shows, the dock holds only the hint, so the map stays on screen above it
    panel.classList.add('is-hinting');
    hb.querySelector('.pw-retry').addEventListener('click', function(){ hb.hidden = true; panel.classList.remove('is-hinting'); onRetry(); });
    hb.querySelector('.pw-reveal').addEventListener('click', function(){ hb.hidden = true; panel.classList.remove('is-hinting'); onReveal(); });
    if(S) S.caption('Read the hint, then try again or show the answer.', p0mode());
    try{ hb.querySelector('.pw-retry').focus({ preventScroll: true }); }catch(e){ hb.querySelector('.pw-retry').focus(); }
  }
  var curP = null;
  function p0mode(){ return curP && curP.trace ? 'drills' : undefined; }
  // scroll the studio stage so map slot k is on screen
  function slotInView(map, k){
    if(!S || !map.slot[k]) return;
    var g = map.slot[k].g, body = S.stage;
    try{ var r = g.getBoundingClientRect(), b = body.getBoundingClientRect(); if(r.top < b.top + 8 || r.bottom > b.bottom - 8) body.scrollTop += r.top - b.top - (b.height - r.height) / 2; }catch(e){}
  }
  // keep the map in view on a phone: focus the result without scrolling the page to it
  function focusRes(res){ try{ res.focus({ preventScroll: !!S }); }catch(e){ res.focus(); } if(S){ try{ window.scrollTo(0, 0); }catch(e){} } }
  function cut(s, n){ s = plain(s); return s.length > n ? s.slice(0, n - 1).replace(/\s+\S*$/, '') + '…' : s; }

  /* Variant 1: put the steps in order. Tap a step in the bank and it lands
     in the next empty place on the map, which lights up; tap a placed step
     to take it back. "Use a list" switches to the drag-and-arrows list. */
  function orderVariant(p, panel, asList){
    curP = p;
    var n = p.steps.length;
    var bank = shuffle(p.steps.map(function(s, i){ return i; }));
    if(bank.every(function(v, k){ return v === k; })) bank.reverse();
    var place = []; for(var z = 0; z < n; z++) place.push(null);
    var locked = {}, tries = 0, done = false, full = false;
    if(asList){ place = bank.slice(); }
    var map = pathMap(p);
    panel.innerHTML = '<p class="kt-first pw-task">' + (asList ? 'Put the steps in order, first at the top: drag a step or use its arrows. The map follows.' : 'Tap the steps in the order they happen. Each one lights up its place on the map.') + '</p>' +
      (p.cycle ? '<p class="anp-small pw-cyclenote">This pathway is a cycle: start with the step the scenario gives you.</p>' : '') +
      '<div class="pw-figslot"></div>' +
      (asList ? '<ol class="anp-order pw-order"></ol>' : '<div class="pw-bank" role="group" aria-label="Steps to place"></div>') +
      '<div class="pw-actions"><button type="button" class="btn-press sm pw-check"' + (asList ? '' : ' disabled') + '>Check order</button>' +
        (asList ? '' : '<button type="button" class="btn-outline pw-undo" disabled>Undo</button>') + '</div>' +
      '<div class="pw-hint" role="status" hidden></div>' +
      '<div class="pw-result" aria-live="polite"></div>' +
      '<p class="pw-alt"><button type="button" class="pw-link pw-full" aria-pressed="false">Show full sentences</button> · <button type="button" class="pw-link pw-swap">' + (asList ? 'Tap to place instead' : 'Use a list instead') + '</button></p>';
    var fig = mapFig(map); panel._map = map;
    pq(panel, '.pw-figslot').appendChild(fig);
    var check = pq(panel, '.pw-check'), undo = pq(panel, '.pw-undo');
    var bankEl = pq(panel, '.pw-bank'), list = pq(panel, '.pw-order');
    pq(panel, '.pw-swap').addEventListener('click', function(){ orderVariant(p, panel, !asList); });
    pq(panel, '.pw-full').addEventListener('click', function(){ full = !full; this.setAttribute('aria-pressed', String(full)); this.textContent = full ? 'Show short labels' : 'Show full sentences'; paint(); });
    function cardText(i){ return full ? html(p.steps[i].text) : html(p.steps[i].label); }
    function nextFree(){ for(var k = 0; k < n; k++) if(place[k] == null) return k; return -1; }
    function paintMap(){
      var nf = nextFree();
      map.fillAll(function(k){ return place[k] != null ? { i: place[k], state: locked[k] ? 'ok' : '' } : { i: null, state: k === nf ? 'next' : 'empty' }; });
      // a placed, unlocked step is a button: tap it to take it back
      map.slot.forEach(function(s, k){
        var on = !asList && !done && place[k] != null && !locked[k];
        if(on){ s.g.setAttribute('tabindex', '0'); s.g.setAttribute('role', 'button'); s.g.setAttribute('aria-label', 'Step ' + (k + 1) + ': ' + plain(p.steps[place[k]].label) + '. Select to take it back.'); }
        else { s.g.removeAttribute('tabindex'); s.g.removeAttribute('role'); }
        s.g.classList.toggle('is-tap', on);
      });
    }
    function paintBank(){
      var left = bank.filter(function(i){ return place.indexOf(i) < 0; });
      bankEl.innerHTML = left.length ? left.map(function(i){
        var kind = stepKind(p, p.steps[i]);
        return '<button type="button" class="pw-bcard" data-i="' + i + '">' + iconTag(p, p.steps[i], true) + '<span>' + cardText(i) + '</span></button>';
      }).join('') : '<p class="anp-small pw-bank-done">Every step is placed. Check your order, or tap a step on the map to take it back.</p>';
      check.disabled = done || nextFree() >= 0;
      if(undo) undo.disabled = done || !place.some(function(v, k){ return v != null && !locked[k]; });
    }
    function paintList(focusK, focusD){
      list.innerHTML = place.map(function(i, k){
        var s = p.steps[i];
        return '<li data-pos="' + k + '"><span class="pw-grip" aria-hidden="true" title="Drag to move"></span><span class="pw-n" aria-hidden="true">' + (k + 1) + '</span>' + iconTag(p, s) + '<span class="anp-order-text">' + cardText(i) + '</span>' +
          '<span class="pw-move"><button type="button" data-k="' + k + '" data-d="-1" aria-label="Move up: ' + esc(plain(s.label)) + '"' + (k === 0 ? ' disabled' : '') + '>↑</button>' +
          '<button type="button" data-k="' + k + '" data-d="1" aria-label="Move down: ' + esc(plain(s.label)) + '"' + (k === n - 1 ? ' disabled' : '') + '>↓</button></span></li>';
      }).join('');
      list.querySelectorAll('button[data-k]').forEach(function(b){
        b.addEventListener('click', function(){
          var k = +b.getAttribute('data-k'), d = +b.getAttribute('data-d'), j = k + d;
          var t = place[k]; place[k] = place[j]; place[j] = t;
          paint(j, d);
        });
      });
      dragSort();
      if(focusK !== undefined){
        var again = list.querySelector('button[data-k="' + focusK + '"][data-d="' + focusD + '"]:not([disabled])') || list.querySelector('button[data-k="' + focusK + '"]:not([disabled])');
        if(again) again.focus();
      }
    }
    function paint(fk, fd){ paintMap(); if(asList){ if(!done) paintList(fk, fd); } else paintBank(); }
    /* Drag a step by its grip (touch) or body (mouse) to a new place; the
       arrows stay for keyboard and fine adjustment. */
    function dragSort(){
      list.querySelectorAll('li[data-pos]').forEach(function(li){
        var from = +li.getAttribute('data-pos'), y0 = 0, dragging = false, pid = null, rows = null, to = from;
        li.addEventListener('pointerdown', function(e){
          if(e.button > 0 || e.target.closest('button')) return;
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
          if(to !== from){ var v = place.splice(from, 1)[0]; place.splice(to, 0, v); }
          paint();
        }
        li.addEventListener('pointerup', end);
        li.addEventListener('pointercancel', end);
      });
    }
    var lastPlaced = [];
    if(bankEl) bankEl.addEventListener('click', function(e){
      var b = e.target.closest('.pw-bcard'); if(!b || done) return;
      var k = nextFree(); if(k < 0) return;
      place[k] = +b.getAttribute('data-i'); lastPlaced.push(k);
      if(window.LevlSound && window.LevlSound.tick) try{ window.LevlSound.tick(); }catch(err){}
      paint();
      showNext();
      var nb = bankEl.querySelector('.pw-bcard'); try{ (nb || check).focus({ preventScroll: true }); }catch(err){ (nb || check).focus(); }
      if(S){ var nf = nextFree(); S.caption(nf < 0 ? 'Every step is placed. Press <b>Check order</b>.' : 'Step ' + (k + 1) + ' placed. Tap the step that comes next.', p0mode()); }
    });
    // keep the slot being filled in view on a long map
    function showNext(){ var nf = nextFree(); slotInView(map, nf < 0 ? n - 1 : nf); }
    function takeBack(k){
      if(done || asList || place[k] == null || locked[k]) return;
      place[k] = null; lastPlaced = lastPlaced.filter(function(x){ return x !== k; });
      paint();
    }
    fig.addEventListener('click', function(e){ var g = e.target.closest ? e.target.closest('.pw-node.is-tap') : null; if(g) takeBack(+g.getAttribute('data-k')); });
    fig.addEventListener('keydown', function(e){ if(e.key !== 'Enter' && e.key !== ' ') return; var g = e.target.closest ? e.target.closest('.pw-node.is-tap') : null; if(g){ e.preventDefault(); takeBack(+g.getAttribute('data-k')); } });
    if(undo) undo.addEventListener('click', function(){
      while(lastPlaced.length){ var k = lastPlaced.pop(); if(place[k] != null && !locked[k]){ place[k] = null; break; } }
      paint();
    });
    paint();
    if(S) studioDrill(p, panel);
    check.addEventListener('click', function(){
      if(done) return;
      tries++;
      var right = place.filter(function(v, k){ return v === k; }).length;
      var first = score(p, 'order', right, n);
      if(right === n) return finish(true, first);
      if(tries === 1){
        // mark each place, keep the right ones, and give one hint
        map.fillAll(function(k){ return { i: place[k], state: place[k] === k ? 'ok' : 'no' }; });
        var wrongK = -1; for(var k = 0; k < n; k++){ if(place[k] === k) locked[k] = true; else if(wrongK < 0) wrongK = k; }
        check.disabled = true; if(undo) undo.disabled = true;
        var before = wrongK > 0 ? 'Step ' + (wrongK + 1) + ' comes right after <b>' + html(p.steps[wrongK - 1].label) + '</b>. ' : 'Start with what sets the pathway going. ';
        hintBox(panel, '<b>' + right + ' of ' + n + ' in the right place.</b> ' + (right ? 'The green ones stay. ' : '') + before + '<span class="pw-hint-why">Hint: ' + html(p.steps[wrongK].why) + '</span>',
          function(){ for(var k2 = 0; k2 < n; k2++) if(!locked[k2]) place[k2] = asList ? place[k2] : null; lastPlaced = []; paint(); showNext(); if(S) S.caption(asList ? 'Move the red ones, then check again.' : 'Place the rest again. The green ones stay.', p0mode()); var nb = (bankEl || list).querySelector('button'); if(nb) nb.focus(); },
          function(){ finish(false, first); });
        return;
      }
      finish(false, first);
    });
    function finish(correct, first){
      done = true;
      var right = place.filter(function(v, k){ return v === k; }).length;
      // the right pathway, with each place the student got wrong marked and their step struck through
      map.fillAll(function(k){ return { i: k, state: place[k] === k ? 'ok' : 'no', extra: place[k] === k || place[k] == null ? null : { yours: p.steps[place[k]].label } }; });
      map.slot.forEach(function(s){ s.g.removeAttribute('tabindex'); s.g.removeAttribute('role'); s.g.classList.remove('is-tap'); });
      if(bankEl) bankEl.innerHTML = '';
      if(list) list.parentNode.removeChild(list);
      var alt = pq(panel, '.pw-alt'); if(alt) alt.parentNode.removeChild(alt);
      var res = pq(panel, '.pw-result');
      res.innerHTML = verdict(correct, right > 0, first) +
        '<p>' + right + ' of ' + n + ' steps in the right position' + (tries > 1 && !correct ? ' on your second try' : '') + '.' + (correct ? '' : ' The map shows the right order; red places show the step you put there.') + '</p>';
      afterAnswer(p, panel, 'order', null, map);
      pq(panel, '.pw-actions').innerHTML = '<button type="button" class="btn-outline pw-again">Shuffle and try again</button>' + report(itemId(p, 'order'));
      pq(panel, '.pw-again').addEventListener('click', function(){ if(player){ player.stop(); player = null; } orderVariant(p, panel, asList); var b = pq(panel, '.pw-bank .pw-bcard, .pw-order button:not([disabled])'); if(b) b.focus(); });
      res.setAttribute('tabindex', '-1'); focusRes(res);
    }
  }

  /* Variant 2: one step is blanked on the map; choose what fills it. */
  function missingVariant(p, panel){
    curP = p;
    var m = p.missing, at = m.at, tries = 0, done = false, first = false;
    var choices = shuffle([{ text: p.steps[at].text, why: p.steps[at].why, right: true }].concat(m.distractors.map(function(d){ return { text: d.text, why: d.why, right: false }; })));
    var map = pathMap(p);
    map.fillAll(function(k){ return k === at ? { i: null, state: 'gap' } : { i: k }; });
    panel.innerHTML = '<p class="kt-first pw-task">One step is missing from the map. Choose the step that fills gap ' + (at + 1) + '.</p>' +
      '<div class="pw-figslot"></div>' +
      '<details class="pw-fulld"><summary>Read every step in full</summary><ol class="pw-steps">' + p.steps.map(function(s, k){
        return k === at ? '<li class="pw-gap"><span class="pw-n" aria-hidden="true">' + (k + 1) + '</span><span class="pw-gap-text">Missing step</span></li>'
          : '<li><span class="pw-n" aria-hidden="true">' + (k + 1) + '</span><span>' + html(s.text) + '</span></li>';
      }).join('') + '</ol></details>' +
      '<div class="pw-hint" role="status" hidden></div>' +
      '<p class="pw-task pw-ask"><b>Which step fills gap ' + (at + 1) + '?</b></p>' +
      '<div class="anp-opt-btns pw-choices" role="group" aria-label="Choices for the missing step">' + choices.map(function(c, k){
        return '<button type="button" class="anp-opt" data-k="' + k + '">' + html(c.text) + '</button>';
      }).join('') + '</div>' +
      '<div class="pw-actions"></div><div class="pw-result" aria-live="polite"></div>';
    pq(panel, '.pw-figslot').appendChild(mapFig(map)); panel._map = map;
    if(S){ studioDrill(p, panel); requestAnimationFrame(function(){ slotInView(map, at); }); }
    function finish(pick){
      done = true;
      (S ? document : panel).querySelectorAll('.pw-choices .anp-opt').forEach(function(x){
        var c = choices[+x.getAttribute('data-k')];
        x.disabled = true;
        if(c.right) x.classList.add('is-right'); else if(c === pick) x.classList.add('is-wrong');
        if(!x.querySelector('.anp-opt-why')) x.insertAdjacentHTML('beforeend', '<span class="anp-opt-why">' + html(c.why) + '</span>');
      });
      var ok = pick && pick.right && tries === 1;
      map.fill(at, at, pick && pick.right ? 'ok' : 'no', pick && !pick.right ? { yours: cut(pick.text, 40) } : null);
      slotInView(map, at);
      var gap = pq(panel, '.pw-gap');
      if(gap){ gap.classList.add(pick && pick.right ? 'is-right' : 'is-filled'); gap.querySelector('.pw-gap-text').innerHTML = html(p.steps[at].text); }
      var res = pq(panel, '.pw-result');
      res.innerHTML = verdict(ok, false, first) + (pick && pick.right && tries > 1 ? '<p>Right on your second try.</p>' : '') + '<p><b>Step ' + (at + 1) + ':</b> ' + html(p.steps[at].text) + ' ' + html(p.steps[at].why) + '</p>';
      afterAnswer(p, panel, 'missing', at, map);
      pq(panel, '.pw-actions').innerHTML = '<button type="button" class="btn-outline pw-again">Try again</button>' + report(itemId(p, 'missing'));
      pq(panel, '.pw-again').addEventListener('click', function(){ if(player){ player.stop(); player = null; } missingVariant(p, panel); pq(panel, '.pw-choices .anp-opt').focus(); });
      res.setAttribute('tabindex', '-1'); focusRes(res);
    }
    (S ? document : panel).querySelectorAll('.pw-choices .anp-opt').forEach(function(b){
      b.addEventListener('click', function(){
        if(done || b.disabled) return;
        tries++;
        var pick = choices[+b.getAttribute('data-k')];
        if(tries === 1) first = score(p, 'missing', pick.right ? 1 : 0, 1);
        if(pick.right || tries > 1) return finish(pick);
        // first miss: mark it, say why it is wrong, and hint at the gap's neighbours
        b.disabled = true; b.classList.add('is-wrong');
        b.insertAdjacentHTML('beforeend', '<span class="anp-opt-why">' + html(pick.why) + '</span>');
        map.fill(at, null, 'gap', { yours: cut(pick.text, 40) });
        slotInView(map, at);
        var prev = at > 0 ? '<b>' + html(p.steps[at - 1].label) + '</b>' : 'the start', next = at < p.steps.length - 1 ? '<b>' + html(p.steps[at + 1].label) + '</b>' : 'the end';
        hintBox(panel, 'Not that one: the reason is under your choice. Hint: the missing step comes after ' + prev + ' and before ' + next + '. Look for the choice that links the two.',
          function(){ var nb = pq(panel, '.pw-choices .anp-opt:not([disabled])'); if(nb) nb.focus(); if(S) S.caption('Choose again.', p0mode()); },
          function(){ finish(null); });
      });
    });
  }

  /* Variant 3: one step has been replaced by a wrong one; find it. */
  function errorVariant(p, panel){
    curP = p;
    var e = p.error, at = e.at, pick = -1, tries = 0, first = false;
    panel.innerHTML = '<p class="kt-first pw-task">One step is wrong. Tap it, then check.</p>' +
      '<div class="pw-figslot"></div>' +
      '<ol class="pw-steps pw-pickable" role="group" aria-label="Steps: select the wrong one">' + p.steps.map(function(s, k){
        var shown = k === at ? { label: '', text: e.text } : s;
        return '<li><button type="button" class="pw-pick" aria-pressed="false" data-k="' + k + '"><span class="pw-n" aria-hidden="true">' + (k + 1) + '</span>' + iconTag(p, shown) + '<span class="pw-pick-text">' + html(shown.text) + '</span></button></li>';
      }).join('') + '</ol>' +
      '<div class="pw-actions"><button type="button" class="btn-press sm pw-check" disabled>Check</button></div>' +
      '<div class="pw-hint" role="status" hidden></div>' +
      '<div class="pw-result" aria-live="polite"></div>';
    var btns = (S ? document : panel).querySelectorAll('.pw-pick');
    var check = pq(panel, '.pw-check');
    if(S) studioDrill(p, panel);
    btns.forEach(function(b){
      b.addEventListener('click', function(){
        if(check.hasAttribute('data-done')) return;
        pick = +b.getAttribute('data-k');
        btns.forEach(function(x){ x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
        check.disabled = false;
      });
    });
    function finish(ok){
      check.setAttribute('data-done', '1');
      btns.forEach(function(x){
        var k = +x.getAttribute('data-k');
        x.disabled = true;
        if(k === at){
          x.classList.add(ok ? 'is-right' : 'is-answer');
          x.querySelector('.pw-pick-text').innerHTML = '<s>' + html(e.text) + '</s><span class="pw-fix"><b>Should be:</b> ' + html(p.steps[at].text) + '</span>';
        } else if(k === pick && !ok) x.classList.add('is-wrong');
      });
      var res = pq(panel, '.pw-result');
      res.innerHTML = verdict(ok && tries === 1, false, first) + (ok && tries > 1 ? '<p>Found on your second try.</p>' : '') +
        (ok || pick < 0 ? '' : '<p>Step ' + (pick + 1) + ' is right where it is: ' + html(p.steps[pick].why) + '</p>') +
        '<p><b>The error was step ' + (at + 1) + '.</b> ' + html(e.why) + '</p>';
      afterAnswer(p, panel, 'error', at);
      pq(panel, '.pw-actions').innerHTML = '<button type="button" class="btn-outline pw-again">Try again</button>' + report(itemId(p, 'error'));
      pq(panel, '.pw-again').addEventListener('click', function(){ if(player){ player.stop(); player = null; } errorVariant(p, panel); pq(panel, '.pw-pick').focus(); });
      res.setAttribute('tabindex', '-1'); focusRes(res);
    }
    check.addEventListener('click', function(){
      if(pick < 0 || check.hasAttribute('data-done')) return;
      tries++;
      var ok = pick === at;
      if(tries === 1) first = score(p, 'error', ok ? 1 : 0, 1);
      if(ok || tries > 1) return finish(ok);
      var wrongBtn = pq(panel, '.pw-pick[data-k="' + pick + '"]');
      wrongBtn.disabled = true; wrongBtn.classList.add('is-wrong'); wrongBtn.setAttribute('aria-pressed', 'false');
      check.disabled = true;
      var half = at < p.steps.length / 2 ? 'first half' : 'second half';
      hintBox(panel, 'Step ' + (pick + 1) + ' is right where it is: ' + html(p.steps[pick].why) + ' <span class="pw-hint-why">Hint: the wrong step is in the ' + half + ' of the pathway. Read each one against the step before it: does it really follow?</span>',
        function(){ pick = -1; var nb = pq(panel, '.pw-pick:not([disabled])'); if(nb) nb.focus(); if(S) S.caption('Pick another step, then check.', p0mode()); },
        function(){ finish(false); });
    });
  }

  /* After any variant: the summary, the map player, and every step's why.
     A drill that drew its map passes it in (it already shows the answer). */
  function afterAnswer(p, panel, variant, mark, map){
    var res = pq(panel, '.pw-result');
    var box = document.createElement('div');
    box.className = 'pw-after';
    box.innerHTML = (K() ? K().why('<p>' + html(p.summary) + '</p>', { label: 'Why it runs this way' }) : '<p class="pw-summary">' + html(p.summary) + '</p>') +
      '<h3>Watch the pathway</h3>' +
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
    var fig;
    if(!map){
      map = pathMap(p);
      map.fillAll(function(k){ return { i: k, state: k === mark ? 'marked' : '', extra: k === mark && variant === 'error' ? { yours: p.error.text, pre: 'was: ' } : null }; });
      fig = mapFig(map);
      var slotEl = pq(panel, '.pw-figslot');
      if(slotEl) slotEl.appendChild(fig); else box.insertBefore(fig, box.querySelector('.pw-player'));
      if(S){
        S.put('stage', fig, { mode: p.trace ? 'drills' : null, first: true });
        drillParts.push(fig);
        var t = S.stage.querySelector('.pw-title'); if(t) S.stage.insertBefore(t, S.stage.firstChild);
      }
      map.fit();
    }
    player = makePlayer(p, map.svg, box);
    if(S){
      S.stage.scrollTop = 0;
      var h3 = box.querySelector('h3'); if(h3) h3.parentNode.removeChild(h3);
      S.caption('Your answer is marked on the map. Press <b>Play</b> to watch the pathway run.', p.trace ? 'drills' : undefined);
    }
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
      var cur = svg.querySelector('.pw-node.is-cur');
      if(cur && S && cur.scrollIntoView){ try{ cur.scrollIntoView({ block: 'nearest', behavior: reduce ? 'auto' : 'smooth' }); }catch(e){} }
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
  function fail(msg){ if(S){ S.suspend(true); app.classList.remove('kt-staging'); } app.innerHTML = '<p class="pw-error">' + esc(msg) + '</p>'; }
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
