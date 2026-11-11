/* Euler and logistic: the page script (docs/apcalcbc-architecture.md, "Trainers"). OWNED BY THIS
   TOOL ONLY (builder T3). Runs on calculus-bc/tools/euler-logistic.html on top of AB's framework
   (ApCalcTools, calculus/assets/tools/calc-tools.js) and plots (ApCalcPlot), with its own
   model ApCalcMath.eulerLogistic (calculus-bc/assets/tools/math/euler-logistic.js).

   Explore, two scenes:
     Euler's method: a slope field, a draggable starting point, the true
       solution dashed (from its formula) and the Euler polygon over a fixed
       span, with each step's run and rise drawn; the dock picks the equation
       and the number of steps (1, 2, 4, 8, 16), so the error can be watched
       halving as the steps double. Why: over or under from the concavity.
       Details: the Euler table (x, y, dy/dx, Δy) and the error for each n.
     Logistic growth: P(t) for dP/dt = kP(1 - P/L) beside the rate as a
       parabola in P, linked by one moving point (drag it along the curve, or
       Play); the carrying capacity and L/2 drawn and labelled. Dock: L, k,
       P(0).
   Test yourself: ApCalcTools.drill over four kinds (euler, model, overunder,
   logistic). The figure builds as the steps are answered: the table fills,
   the polygon grows on the field, the true solution appears at the end; a
   wrong try is drawn dashed beside the right one. */
(function(){
  'use strict';
  var T = window.ApCalcTools, M = window.ApCalcMath, P = window.ApCalcPlot;
  if(!T || !M || !M.eulerLogistic || !P) return;
  var S = M.eulerLogistic, esc = T.esc, NS = 'http://www.w3.org/2000/svg';
  function tex(s, o){ return window.ApCalcTex ? window.ApCalcTex.render(s, o || {}) : esc(s); }
  function html(s){ return window.ApCalcTex ? window.ApCalcTex.html(s) : esc(s); }
  function plainTex(s){ return window.ApCalcTex ? window.ApCalcTex.text(s) : s; }
  function r2(v){ return Math.round(v * 100) / 100; }
  function clean(v, d){ return String(+(+v).toFixed(d == null ? 2 : d)).replace('-', '−'); }
  function n3(v){ return clean(v, 3); }
  var uid = 0;
  function pathOf(pts, F){
    var out = '', pen = false;
    pts.forEach(function(p){
      if(!isFinite(p[1])){ pen = false; return; }
      out += (pen ? 'L' : 'M') + r2(F.sx(p[0])) + ' ' + r2(F.sy(p[1])); pen = true;
    });
    return out;
  }
  function sampleFn(fn, a, b, view, n){
    var pts = [], span = view.y[1] - view.y[0];
    for(var i = 0; i <= (n || 240); i++){ var x = a + (b - a) * i / (n || 240), y = fn(x); pts.push([x, isFinite(y) && y > view.y[0] - span && y < view.y[1] + span ? y : NaN]); }
    return pts;
  }
  /* A field as SVG lines: every segment the same length on screen. */
  function fieldSvg(f, view, F, nx, ny){
    var out = [], kx = (F.sx(view.x[1]) - F.sx(view.x[0])) / (view.x[1] - view.x[0]), ky = (F.sy(view.y[0]) - F.sy(view.y[1])) / (view.y[1] - view.y[0]);
    var gx = (view.x[1] - view.x[0]) / nx, gy = (view.y[1] - view.y[0]) / (ny || nx), half = 0.36 * Math.min(gx * kx, gy * ky);
    for(var i = 0; i < nx; i++) for(var j = 0; j < (ny || nx); j++){
      var x = view.x[0] + (i + 0.5) * gx, y = view.y[0] + (j + 0.5) * gy, m = f(x, y), cx = F.sx(x), cy = F.sy(y);
      if(!isFinite(m)){ out.push('<line x1="' + r2(cx) + '" y1="' + r2(cy - half) + '" x2="' + r2(cx) + '" y2="' + r2(cy + half) + '"/>'); continue; }
      var vx = 1, vy = m * ky / kx, L = Math.sqrt(vx * vx + vy * vy);
      out.push('<line x1="' + r2(cx - vx / L * half) + '" y1="' + r2(cy + vy / L * half) + '" x2="' + r2(cx + vx / L * half) + '" y2="' + r2(cy - vy / L * half) + '"/>');
    }
    return '<g class="el-field">' + out.join('') + '</g>';
  }
  function clip(F){
    var id = 'elc' + (++uid);
    return { id: id, def: '<defs><clipPath id="' + id + '"><rect x="' + F.pad.l + '" y="' + F.pad.t + '" width="' + (F.w - F.pad.l - F.pad.r) + '" height="' + (F.h - F.pad.t - F.pad.b) + '"/></clipPath></defs>' };
  }
  /* A drag handle on an SVG (pointer + keyboard): the slope-field trainer's,
     here with its own classes. o: { x, y, F, label(x, y), step: [dx, dy],
     axis, onMove(x, y), onEnd, clamp(x, y) -> [x, y] } */
  function handle(svg, o){
    var g = document.createElementNS(NS, 'g'), x = o.x, y = o.y, F = o.F;
    g.setAttribute('class', 'el-handle' + (o.cls ? ' ' + o.cls : ''));
    g.setAttribute('tabindex', '0'); g.setAttribute('role', 'slider');
    g.innerHTML = '<circle class="el-hitc" r="22"/><circle class="el-halo" r="17"/><circle class="el-dot" r="' + (o.r || 8) + '"/>';
    svg.appendChild(g);
    function place(){ g.setAttribute('transform', 'translate(' + r2(F.sx(x)) + ' ' + r2(F.sy(y)) + ')'); var t = o.label(x, y); g.setAttribute('aria-valuetext', t); g.setAttribute('aria-label', t); g.setAttribute('aria-valuenow', String(+(o.axis === 'x' ? x : y).toFixed(2))); }
    function set(nx, ny, fire){ var c = o.clamp ? o.clamp(nx, ny) : [nx, ny]; x = c[0]; y = c[1]; place(); if(fire && o.onMove) o.onMove(x, y); }
    var on = false;
    function local(e){ var pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY; var m = svg.getScreenCTM(); var p = m ? pt.matrixTransform(m.inverse()) : pt; return [F.ix(p.x), F.iy(p.y)]; }
    g.addEventListener('pointerdown', function(e){ on = true; try{ g.setPointerCapture(e.pointerId); }catch(err){} g.classList.add('is-drag'); e.preventDefault(); e.stopPropagation(); if(o.onStart) o.onStart(); });
    g.addEventListener('pointermove', function(e){ if(!on) return; var p = local(e); set(o.axis === 'y' ? x : p[0], o.axis === 'x' ? y : p[1], true); });
    function up(){ if(!on) return; on = false; g.classList.remove('is-drag'); if(o.onEnd) o.onEnd(x, y); }
    g.addEventListener('pointerup', up); g.addEventListener('pointercancel', up);
    g.addEventListener('keydown', function(e){
      var k = e.key, f = e.shiftKey ? 5 : 1, nx = x, ny = y;
      if(k === 'ArrowUp' && o.axis !== 'x') ny += o.step[1] * f; else if(k === 'ArrowDown' && o.axis !== 'x') ny -= o.step[1] * f;
      else if(k === 'ArrowRight' && o.axis !== 'y') nx += o.step[0] * f; else if(k === 'ArrowLeft' && o.axis !== 'y') nx -= o.step[0] * f;
      else if(k === 'ArrowUp' && o.axis === 'x') nx += o.step[0] * f; else if(k === 'ArrowDown' && o.axis === 'x') nx -= o.step[0] * f;
      else return;
      e.preventDefault(); if(o.onStart) o.onStart(); set(nx, ny, true); if(o.onEnd) o.onEnd(x, y);
    });
    place();
    return { el: g, set: set, get: function(){ return [x, y]; }, rebind: function(s2, F2){ var had = document.activeElement === g; svg = s2; F = F2; svg.appendChild(g); place(); if(had) g.focus(); } };
  }

  T.mount('euler-logistic', function(app, data){
    var ex = null;
    T.modes(app, { slug: 'euler-logistic', explore: function(h){ ex = explore(h, data); }, quiz: function(h){ quiz(h, data); },
      studio: { explore: function(pane, s){ ex.studio(pane, s); } } });
  });

  /* =========================================================== explore */
  var SPAN = { 'x+y': 1.5, 'y': 2, 'x-y': 3, 'xy': 1.5, '-x/y': 1.5 };
  var CHIP = { 'x+y': 'x + y', 'y': 'y', 'x-y': 'x − y', 'xy': 'xy', '-x/y': '−x / y' };
  function explore(host, data){
    var scene = 'euler', id = 'x+y', d = S.de(id), x0 = d.start[0], y0 = d.start[1], n = 4, showTri = true;
    var lg = { L: 800, k: 0.5, P0: 80, t: 0 }, playing = null;
    var LS = null, touched = false, svg = null, F = null, Hd = null, Ht = null, lF = null;
    var nid = T.nid('el');
    function $(q){ return host.querySelector(q) || (LS ? LS.root.querySelector(q) : null) || document.querySelector('#app ' + q) || document.querySelector(q); }
    host.innerHTML = '<section class="bt-problem el-card" aria-labelledby="' + nid + '-h"><h2 id="' + nid + '-h" class="sr-only">Euler and logistic explorer</h2>' +
      '<div class="el-fig"><p class="el-eq"></p><div class="el-plot"></div><div class="el-lplots" hidden><div class="el-lp el-lp1"></div><div class="el-lp el-lp2"></div></div></div>' +
      '<div class="el-ctl"><div class="el-scenes" role="group" aria-label="What to explore"><button type="button" class="el-scene" data-s="euler" aria-pressed="true">Euler\'s method</button><button type="button" class="el-scene" data-s="logistic" aria-pressed="false">Logistic growth</button></div>' +
      '<div class="el-ce"><div class="el-chips ls-scroll" role="group" aria-label="Differential equation">' + S.GALLERY.map(function(g){ return '<button type="button" class="tchip el-chip" data-id="' + esc(g.id) + '" aria-pressed="false">' + esc(CHIP[g.id]) + '</button>'; }).join('') + '</div>' +
      '<div class="el-nrow" role="group" aria-label="Number of Euler steps"><span class="el-nlab">Steps</span>' + [1, 2, 4, 8, 16].map(function(k){ return '<button type="button" class="el-n" data-n="' + k + '" aria-pressed="' + (k === n) + '">' + k + '</button>'; }).join('') + '</div></div>' +
      '<div class="el-cl" hidden></div></div>' +
      '<div class="el-say"></div>' +
      T.moreHtml('<div class="el-more-b el-trirow"><label class="bt-check"><input type="checkbox" class="el-tri" checked> Show each step\'s run Δx and rise Δy</label></div><p class="bt-small">Keyboard: focus the starting point (or, in logistic growth, the moving point), then use the arrow keys; Shift moves faster.</p>', 'step triangles, keyboard') +
      '<div class="el-nums"></div><p class="sr-only el-live"></p></section>';
    var say = T.announcer($('.el-live'));
    var cue = T.cue('Drag the starting point, then double the steps: watch the Euler polygon close in on the true solution.');
    $('.el-ctl').insertBefore(cue.el, $('.el-ctl').firstChild);
    function act(){ if(!touched){ touched = true; cue.done(); } }
    // logistic controls
    var slL = T.slider({ label: 'Carrying capacity L', min: 200, max: 1200, step: 50, value: lg.L, decimals: 0, onInput: function(v){ act(); lg.L = v; if(lg.P0 > 1.6 * v) lg.P0 = Math.round(1.6 * v); slP.set(lg.P0); drawLog(); } });
    var slK = T.slider({ label: 'Growth constant k', min: 0.1, max: 1.5, step: 0.05, value: lg.k, decimals: 2, onInput: function(v){ act(); lg.k = v; drawLog(); } });
    var slP = T.slider({ label: 'Starting value P(0)', min: 10, max: 1800, step: 10, value: lg.P0, decimals: 0, onInput: function(v){ act(); lg.P0 = Math.min(v, Math.round(1.6 * lg.L)); drawLog(); } });
    var play = document.createElement('div'); play.className = 'bt-buttons el-play'; play.innerHTML = '<button type="button" class="bt-btn el-playb" aria-pressed="false">Play</button><button type="button" class="bt-btn el-t0">Back to t = 0</button>';
    [slL.el, slK.el, slP.el, play].forEach(function(e){ $('.el-cl').appendChild(e); });
    play.querySelector('.el-playb').addEventListener('click', function(){ act(); togglePlay(); });
    play.querySelector('.el-t0').addEventListener('click', function(){ act(); stopPlay(); lg.t = 0; drawLog(); });
    host.querySelectorAll('.el-scene').forEach(function(b){ b.addEventListener('click', function(){ act(); setScene(b.getAttribute('data-s')); }); });
    host.querySelectorAll('.el-chip').forEach(function(b){ b.addEventListener('click', function(){ act(); pick(b.getAttribute('data-id')); }); });
    host.querySelectorAll('.el-n').forEach(function(b){ b.addEventListener('click', function(){ act(); n = +b.getAttribute('data-n'); syncN(); update(); }); });
    $('.el-tri').addEventListener('change', function(){ showTri = this.checked; update(); });
    function syncN(){ document.querySelectorAll('.el-n').forEach(function(b){ b.setAttribute('aria-pressed', String(+b.getAttribute('data-n') === n)); }); }
    function setScene(s){
      scene = s; stopPlay();
      document.querySelectorAll('.el-scene').forEach(function(b){ b.setAttribute('aria-pressed', String(b.getAttribute('data-s') === s)); });
      $('.el-ce').hidden = s !== 'euler'; $('.el-cl').hidden = s !== 'logistic';
      $('.el-plot').hidden = s !== 'euler'; $('.el-lplots').hidden = s !== 'logistic';
      var tri = $('.el-trirow'); if(tri) tri.hidden = s !== 'euler';
      if(s === 'euler') build(); else drawLog();
    }
    function pick(nextId){
      id = nextId; d = S.de(id); x0 = d.start[0]; y0 = d.start[1];
      document.querySelectorAll('.el-chip').forEach(function(b){ b.setAttribute('aria-pressed', String(b.getAttribute('data-id') === id)); });
      build();
    }
    function span(){ return SPAN[id] || 2; }
    function clampStart(x, y){
      var sn = d.snap, X = Math.round(x / sn[0]) * sn[0], Y = Math.round(y / sn[1]) * sn[1];
      X = Math.max(d.view.x[0], Math.min(d.view.x[1] - span(), +X.toFixed(6))); Y = Math.max(d.view.y[0], Math.min(d.view.y[1], +Y.toFixed(6)));
      if(id === '-x/y' && Y <= 0) Y = 0.5;               // −x/y is undefined on y = 0
      return [X, Y];
    }
    function dims(box, ratio){
      var w = Math.max(280, Math.round(box.clientWidth || 520)), h = LS && box.clientHeight ? Math.max(220, Math.round(box.clientHeight)) : Math.round(Math.min(w * (ratio || 0.78), 540));
      return [w, h];
    }
    /* ----- Euler scene */
    function build(){
      if(scene !== 'euler') return;
      var box = $('.el-plot'), wh = dims(box), w = wh[0], h = wh[1], view = d.view;
      var spec = { label: 'Slope field of dy/dx = ' + plainTex(d.tex) + ' with the true solution and the Euler polygon', width: w, height: h, x: view.x, y: view.y, xLabel: 'x', yLabel: 'y' };
      F = P.frame(spec);
      var C = clip(F), nx = Math.max(9, Math.round(13 * (w - 48) / 470)), ny = Math.max(7, Math.round(nx * (h - 40) / (w - 48)));
      box.innerHTML = P.svg(spec).replace('</svg>', C.def + '<g clip-path="url(#' + C.id + ')">' + fieldSvg(d.f, view, F, nx, ny) + '<g class="el-dyn"></g></g><g class="el-labs"></g></svg>');
      svg = box.querySelector('svg'); svg.setAttribute('role', 'group');
      if(Hd) Hd.rebind(svg, F);
      else Hd = handle(svg, { x: x0, y: y0, F: F, step: d.snap, clamp: clampStart, label: function(x, y){ return 'Starting point, x = ' + clean(x) + ', y = ' + clean(y); },
        onMove: function(x, y){ act(); x0 = x; y0 = y; schedule(); }, onEnd: function(){ announce(); } });
      Hd.set(x0, y0);
      update();
    }
    var raf = 0;
    function schedule(){ if(raf) return; raf = (window.requestAnimationFrame || setTimeout)(function(){ raf = 0; update(); }); }
    function rowsFor(k){ return S.euler(d.f, x0, y0, span() / k, k); }
    function update(){
      if(scene !== 'euler' || !svg) return;
      var hh = span() / n, rows = rowsFor(n), ex = d.exact(x0, y0), xe = x0 + span(), view = d.view, parts = [], labs = [];
      var lo = Math.max(view.x[0], ex.lo), hi = Math.min(view.x[1], ex.hi);
      parts.push('<path class="el-true" d="' + pathOf(sampleFn(ex.fn, lo, hi, view), F) + '"/>');
      if(showTri && n <= 8) rows.slice(0, n).forEach(function(r){
        var xa = F.sx(r.x), xb = F.sx(r.x + hh), ya = F.sy(r.y), yb = F.sy(r.y + r.dy);
        parts.push('<path class="el-tri" d="M' + r2(xa) + ' ' + r2(ya) + 'H' + r2(xb) + 'V' + r2(yb) + '"/>');
      });
      parts.push('<path class="el-poly" d="' + pathOf(rows.map(function(r){ return [r.x, r.y]; }), F) + '"/>');
      rows.forEach(function(r, i){ if(i && (n <= 8 || i === n)) parts.push('<circle class="el-pt" cx="' + r2(F.sx(r.x)) + '" cy="' + r2(F.sy(r.y)) + '" r="' + (i === n ? 5.5 : 4) + '"/>'); });
      var yE = rows[n].y, yT = ex.fn(xe);
      if(isFinite(yT)) parts.push('<line class="el-err" x1="' + r2(F.sx(xe)) + '" x2="' + r2(F.sx(xe)) + '" y1="' + r2(F.sy(yE)) + '" y2="' + r2(F.sy(yT)) + '"/><circle class="el-tpt" cx="' + r2(F.sx(xe)) + '" cy="' + r2(F.sy(yT)) + '" r="5"/>');
      parts.push('<line class="el-xe" x1="' + r2(F.sx(xe)) + '" x2="' + r2(F.sx(xe)) + '" y1="' + F.pad.t + '" y2="' + (F.h - F.pad.b) + '"/>');
      svg.querySelector('.el-dyn').innerHTML = parts.join('');
      // labels outside the clip: Euler and true values beside the end line
      var inV = function(v){ return v >= view.y[0] && v <= view.y[1]; }, right = F.sx(xe) > F.w - 120, anc = right ? 'end' : 'start', lx = r2(F.sx(xe) + (right ? -9 : 9));
      if(inV(yE)) labs.push('<text class="el-lab el-lab-e" x="' + lx + '" y="' + r2(F.sy(yE) + (yE < yT ? 16 : -8)) + '" text-anchor="' + anc + '">Euler ' + n3(yE) + '</text>');
      if(isFinite(yT) && inV(yT)) labs.push('<text class="el-lab el-lab-t" x="' + lx + '" y="' + r2(F.sy(yT) + (yE < yT ? -8 : 16)) + '" text-anchor="' + anc + '">true ' + n3(yT) + '</text>');
      svg.querySelector('.el-labs').innerHTML = labs.join('');
      if(Hd && svg.lastChild !== Hd.el) svg.appendChild(Hd.el);
      $('.el-eq').innerHTML = tex('\\frac{dy}{dx} = ' + d.tex + ',\\; y(' + clean(x0) + ') = ' + clean(y0) + ',\\; \\Delta x = ' + clean(hh, 4));
      svg.setAttribute('aria-label', 'Slope field of dy/dx = ' + plainTex(d.tex) + '. Euler with ' + n + ' steps of ' + clean(hh, 4) + ' from (' + clean(x0) + ', ' + clean(y0) + ') gives y(' + clean(xe) + ') ≈ ' + n3(yE) + '; the true value is ' + n3(yT) + '.');
      wordsE(rows, hh, ex, xe, yE, yT);
    }
    function announce(){ var rows = rowsFor(n), xe = x0 + span(), yT = d.exact(x0, y0).fn(xe); say('Start (' + clean(x0) + ', ' + clean(y0) + '). Euler gives ' + n3(rows[n].y) + ' at x = ' + clean(xe) + '; true value ' + n3(yT) + '.'); }
    /* The sign of d²y/dx² along the true solution over the span. */
    function concavity(ex, xe){
      var s = 0, mixed = false;
      for(var i = 0; i <= 40; i++){ var x = x0 + (xe - x0) * i / 40, y = ex.fn(x), v = d.f2(x, y); if(!isFinite(v)) continue; var g = v > 1e-9 ? 1 : v < -1e-9 ? -1 : 0; if(!s) s = g; else if(g && g !== s) mixed = true; }
      return mixed ? 0 : s;
    }
    function wordsE(rows, hh, ex, xe, yE, yT){
      var err = yE - yT, cv = concavity(ex, xe), under = err < 0, P0 = '(' + clean(x0) + ', ' + clean(y0) + ')';
      var head = isFinite(yT) ? '<b>' + n + (n === 1 ? ' step' : ' steps') + ' of ' + clean(hh, 4) + ': Euler gives ' + n3(yE) + ', ' + (Math.abs(err) < 5e-4 ? 'on the true value.' : n3(Math.abs(err)) + ' ' + (under ? 'below' : 'above') + ' the true ' + n3(yT) + '.') + '</b>'
        : '<b>Euler gives ' + n3(yE) + ' at x = ' + clean(xe) + '.</b> The true solution has left the field before it.';
      var why = '<p>Each step leaves its point along the tangent segment there: new ' + tex('y') + ' = old ' + tex('y + \\frac{dy}{dx}\\,\\Delta x') + '. The slope is never updated during a step, so the polygon drifts from the curve.</p>' +
        (cv ? '<p>Along this solution ' + tex('\\frac{d^2y}{dx^2} = ' + d.f2tex) + ' stays ' + (cv > 0 ? 'positive: the solution is concave up and bends above every tangent segment, so Euler <b>underestimates</b>.' : 'negative: the solution is concave down and bends below every tangent segment, so Euler <b>overestimates</b>.') + '</p>'
          : '<p>The concavity changes along the way (' + tex('\\frac{d^2y}{dx^2} = ' + d.f2tex) + ' changes sign), so the error can go either way.</p>') +
        '<p>Double the steps and the error roughly halves: Euler\'s method is first order. The exam asks for one to three steps; the table in Details is the layout an FRQ answer should show.</p>' +
        (d.note ? '<p>' + esc(d.note) + '</p>' : '');
      T.explain($('.el-say'), head, why);
      var nm = $('.el-nums');
      if(nm){
        var show = rows.length <= 9 ? rows : rows.slice(0, 4).concat([null]).concat(rows.slice(-3));
        var tr = show.map(function(r, i){ if(!r) return '<tr><td colspan="4" class="el-gap">…</td></tr>'; var last = r === rows[rows.length - 1]; return '<tr><td class="r">' + clean(r.x, 4) + '</td><td class="r">' + clean(r.y, 4) + '</td><td class="r">' + (last ? '' : clean(r.m, 4)) + '</td><td class="r">' + (last ? '' : clean(r.dy, 4)) + '</td></tr>'; }).join('');
        var errs = [1, 2, 4, 8, 16].map(function(k){ var e = rowsFor(k)[k].y - yT; return '<tr' + (k === n ? ' class="is-on"' : '') + '><td class="r">' + k + '</td><td class="r">' + clean(span() / k, 4) + '</td><td class="r">' + n3(rowsFor(k)[k].y) + '</td><td class="r">' + (isFinite(e) ? n3(e) : '—') + '</td></tr>'; }).join('');
        nm.innerHTML = '<h3 class="ls-title-l">The Euler table from ' + esc(P0) + '</h3><div class="table-wrap" tabindex="0" role="region" aria-label="Euler table"><table class="ls-tbl el-tbl"><caption class="sr-only">Euler\'s method, ' + n + ' steps</caption><thead><tr><th scope="col">x</th><th scope="col">y</th><th scope="col">dy/dx</th><th scope="col">Δy = (dy/dx)Δx</th></tr></thead><tbody>' + tr + '</tbody></table></div>' +
          '<h3 class="ls-title-l">More steps, smaller error</h3><div class="table-wrap" tabindex="0" role="region" aria-label="Error by number of steps"><table class="ls-tbl el-tbl"><caption class="sr-only">Euler estimate and error for each number of steps</caption><thead><tr><th scope="col">Steps</th><th scope="col">Δx</th><th scope="col">Euler y(' + clean(xe) + ')</th><th scope="col">Error</th></tr></thead><tbody>' + errs + '</tbody></table></div>';
      }
      if(LS){
        LS.caption(T.sayHead($('.el-say')), 'explore');
        LS.pills([], 'left', 'explore');   // pass 2: the Euler and true values are labeled on the graph; only the error shows here
        LS.pills(isFinite(yT) && Math.abs(err) >= 5e-4 ? [{ k: under ? 'Under' : 'Over', html: n3(Math.abs(err)), tone: under ? 'accent' : 'warn' }] : [], 'right', 'explore');
      }
    }
    /* ----- Logistic scene */
    function model(){ return S.logistic(lg.k, lg.L, lg.P0); }
    function tMax(){ var m = model(), A = Math.abs((lg.L - lg.P0) / lg.P0) || 1; return Math.max(4, Math.ceil((Math.log(Math.max(A, 1)) + 5) / lg.k)); }
    function drawLog(){
      if(scene !== 'logistic') return;
      var m = model(), TM = tMax(), b1 = $('.el-lp1'), b2 = $('.el-lp2'), wide = (LS ? LS.root.clientWidth : host.clientWidth) > 760;
      $('.el-lplots').classList.toggle('is-wide', wide);
      var wh = dims(b1, wide ? 0.72 : 0.62), w = wh[0], h = wh[1];
      lg.t = Math.max(0, Math.min(TM, lg.t));
      var yTop = Math.max(lg.L, lg.P0) * 1.12;
      var spec = { label: 'Graph of P(t), the logistic solution, with its carrying capacity and the level of fastest growth', width: w, height: h, x: [0, TM], y: [0, yTop], xLabel: 't', yLabel: 'P' };
      lF = P.frame(spec);
      var Pt = m.P(lg.t), parts = [];
      parts.push('<line class="el-cap" x1="' + lF.pad.l + '" x2="' + (lF.w - lF.pad.r) + '" y1="' + r2(lF.sy(lg.L)) + '" y2="' + r2(lF.sy(lg.L)) + '"/><text class="el-caplab" x="' + (lF.w - lF.pad.r - 4) + '" y="' + r2(lF.sy(lg.L) - 6) + '" text-anchor="end">carrying capacity L = ' + lg.L + '</text>');
      parts.push('<line class="el-halfl" x1="' + lF.pad.l + '" x2="' + (lF.w - lF.pad.r) + '" y1="' + r2(lF.sy(lg.L / 2)) + '" y2="' + r2(lF.sy(lg.L / 2)) + '"/><text class="el-halflab" x="' + (lF.w - lF.pad.r - 4) + '" y="' + r2(lF.sy(lg.L / 2) + 15) + '" text-anchor="end">L/2 = ' + clean(lg.L / 2) + ': fastest growth</text>');
      parts.push('<path class="el-logc" d="' + pathOf(sampleFn(m.P, 0, TM, spec, 300), lF) + '"/>');
      if(m.tHalf != null && m.tHalf <= TM) parts.push('<circle class="el-infl" cx="' + r2(lF.sx(m.tHalf)) + '" cy="' + r2(lF.sy(lg.L / 2)) + '" r="5"/><text class="el-infllab" x="' + r2(lF.sx(m.tHalf) + 8) + '" y="' + r2(lF.sy(lg.L / 2) - 8) + '">inflection, t ≈ ' + clean(m.tHalf) + '</text>');
      // the tangent at the moving point: slope dP/dt
      var rt = m.rate(Pt), dt = TM * 0.08;
      var ta = Math.max(0, lg.t - dt);
      parts.push('<line class="el-tan" x1="' + r2(lF.sx(ta)) + '" y1="' + r2(lF.sy(Pt - rt * (lg.t - ta))) + '" x2="' + r2(lF.sx(lg.t + dt)) + '" y2="' + r2(lF.sy(Pt + rt * dt)) + '"/>');
      b1.innerHTML = P.svg(spec).replace('</svg>', parts.join('') + '</svg>');
      var s1 = b1.querySelector('svg'); s1.setAttribute('role', 'group');
      Ht = handle(s1, { x: lg.t, y: Pt, F: lF, axis: 'x', step: [TM / 50, 0], r: 7, label: function(t){ return 'Time t = ' + clean(t) + ', P = ' + clean(m.P(t), 1); },
        clamp: function(t){ t = Math.max(0, Math.min(TM, t)); return [t, m.P(t)]; }, onStart: function(){ act(); stopPlay(); }, onMove: function(t){ lg.t = t; phase(); wordsL(); }, onEnd: function(){ say('At t = ' + clean(lg.t) + ', P = ' + clean(m.P(lg.t), 1) + ', growing at ' + clean(m.rate(m.P(lg.t)), 1) + ' per unit time.'); } });
      phase(); wordsL();
      $('.el-eq').innerHTML = tex('\\frac{dP}{dt} = ' + clean(lg.k) + 'P\\left(1 - \\frac{P}{' + lg.L + '}\\right),\\; P(0) = ' + lg.P0);
    }
    /* The rate as a parabola in P, the moving point on it. */
    function phase(){
      var m = model(), b2 = $('.el-lp2'), wide = $('.el-lplots').classList.contains('is-wide'), wh = dims(b2, wide ? 0.72 : 0.5), w = wh[0], h = wh[1];
      var Pmax = Math.max(lg.L, lg.P0) * 1.1, rMin = Math.min(0, m.rate(Pmax)), rMax = m.maxRate * 1.25;
      var spec = { label: 'The rate dP/dt as a function of P: a parabola, zero at 0 and at L, largest at L/2', width: w, height: h, x: [0, Pmax], y: [rMin - (rMax - rMin) * 0.05, rMax], xLabel: 'P', yLabel: 'dP/dt' };
      var F2 = P.frame(spec), Pt = m.P(lg.t), parts = [];
      parts.push('<path class="el-par" d="' + pathOf(sampleFn(m.rate, 0, Pmax, spec, 200), F2) + '"/>');
      parts.push('<line class="el-halfl" x1="' + r2(F2.sx(lg.L / 2)) + '" x2="' + r2(F2.sx(lg.L / 2)) + '" y1="' + F2.pad.t + '" y2="' + (F2.h - F2.pad.b) + '"/>');
      parts.push('<circle class="el-vtx" cx="' + r2(F2.sx(lg.L / 2)) + '" cy="' + r2(F2.sy(m.maxRate)) + '" r="5"/><text class="el-halflab" x="' + r2(F2.sx(lg.L / 2) + 8) + '" y="' + r2(Math.max(12, F2.sy(m.maxRate) - 6)) + '">max ' + clean(m.maxRate, 1) + '</text>');
      parts.push('<circle class="el-cappt" cx="' + r2(F2.sx(lg.L)) + '" cy="' + r2(F2.sy(0)) + '" r="5"/><text class="el-caplab" x="' + r2(F2.sx(lg.L) + 7) + '" y="' + r2(F2.sy(0) - (F2.sx(Pmax) - F2.sx(lg.L) < 44 ? 24 : 9)) + '" text-anchor="start">L</text>');
      parts.push('<circle class="el-now" cx="' + r2(F2.sx(Pt)) + '" cy="' + r2(F2.sy(m.rate(Pt))) + '" r="7"/>');
      b2.innerHTML = P.svg(spec).replace('</svg>', parts.join('') + '</svg>');
      if(Ht) Ht.set(lg.t, Pt);
    }
    function wordsL(){
      var m = model(), Pt = m.P(lg.t), rt = m.rate(Pt), below = Pt < lg.L / 2 - 1e-6, above = Pt > lg.L + 1e-6;
      var head = '<b>t = ' + clean(lg.t) + ': P = ' + clean(Pt, 1) + ', growing at ' + clean(rt, 1) + ' per unit time.</b> ' + (above ? 'Above L it falls toward L.' : below ? 'Below L/2: the growth is speeding up.' : Pt < lg.L - 0.5 ? 'Past L/2: still growing, but slowing.' : 'At the carrying capacity.');
      var why = '<p>The rate ' + tex('kP\\left(1 - \\frac{P}{L}\\right)') + ' is 0 at ' + tex('P = 0') + ' and at ' + tex('P = L = ' + lg.L) + ': those are the equilibrium solutions. Any solution with ' + tex('P(0) > 0') + ' approaches ' + tex('L') + ', from below or from above, so ' + tex('\\lim_{t \\to \\infty} P(t) = ' + lg.L) + '.</p>' +
        '<p>As a function of ' + tex('P') + ' the rate is a downward parabola (right panel), largest halfway between its zeros: at ' + tex('P = \\frac{L}{2} = ' + clean(lg.L / 2)) + ', where ' + tex('\\frac{dP}{dt} = \\frac{kL}{4} = ' + clean(m.maxRate, 2)) + '. That is the fastest growth, and the graph of ' + tex('P(t)') + ' changes concavity there.</p>' +
        '<p>Read all of this from the equation without solving it. If it is written ' + tex('cP(L - P)') + ' or ' + tex('aP - bP^2') + ', factor it first: ' + tex('aP - bP^2 = bP\\left(\\frac{a}{b} - P\\right)') + ', so ' + tex('L = \\frac{a}{b}') + '.</p>';
      T.explain($('.el-say'), head, why);
      var nm = $('.el-nums');
      if(nm){
        var row = function(k, v){ return '<tr><th scope="row">' + k + '</th><td class="r">' + v + '</td></tr>'; };
        nm.innerHTML = '<h3 class="ls-title-l">Read from the equation</h3><table class="ls-tbl"><caption class="sr-only">Logistic model facts</caption><tbody>' +
          row('Carrying capacity L', String(lg.L)) + row('Limit as t → ∞', String(lg.L)) + row('Fastest growth at P =', clean(lg.L / 2)) + row('Largest rate kL/4', clean(m.maxRate, 2)) +
          row('Time of fastest growth', m.tHalf != null ? clean(m.tHalf, 3) : 'none ahead (P(0) ≥ L/2)') + row('Now: P, dP/dt', clean(Pt, 1) + ', ' + clean(rt, 2)) + '</tbody></table>';
      }
      if(LS){
        LS.caption(T.sayHead($('.el-say')), 'explore');
        LS.pills([{ k: 'P', html: clean(Pt, 1), tone: 'readout' }, { k: 'dP/dt', html: clean(rt, 1), tone: 'ghost' }], 'left', 'explore');
        LS.pills([{ k: 'L', html: String(lg.L), tone: 'good' }], 'right', 'explore');
      }
    }
    function stopPlay(){ if(playing){ playing.stop(); playing = null; } var b = $('.el-playb'); if(b){ b.textContent = 'Play'; b.setAttribute('aria-pressed', 'false'); } }
    function togglePlay(){
      if(playing){ stopPlay(); return; }
      var TM = tMax(); if(lg.t >= TM - 1e-9) lg.t = 0;
      var b = $('.el-playb'); b.textContent = 'Pause'; b.setAttribute('aria-pressed', 'true');
      playing = P.loop(function(dt){ lg.t = Math.min(TM, lg.t + dt * TM / 6); phase(); wordsL(); if(lg.t >= TM){ stopPlay(); return false; } },
        { still: function(){ lg.t = TM; phase(); wordsL(); stopPlay(); } });
      playing.start();
    }
    function relayout(){ if(scene === 'euler') build(); else drawLog(); }
    function studio(pane, s){
      LS = s;
      var sp = T.studioPane(pane, s, { stage: [$('.el-fig')], dock: [$('.el-ctl')], why: [$('.el-say')], details: [$('.el-nums')], moreLabel: 'Step triangles, keyboard' });
      relayout();
      if(s.mode() === 'explore') s.hint({ target: s.root.querySelector('.el-handle'), text: 'Drag the starting point' });
      if(window.ResizeObserver){ var t = null; new ResizeObserver(function(){ clearTimeout(t); t = setTimeout(relayout, 60); }).observe($('.el-fig')); }
      sp.open();
    }
    pick('x+y');
    if(!window.LevlStudio && window.ResizeObserver){ var t2 = null; new ResizeObserver(function(){ clearTimeout(t2); t2 = setTimeout(relayout, 80); }).observe($('.el-fig')); }
    return { studio: studio };
  }

  /* ===================================================== test yourself */
  var QM = T.tries();
  function quiz(host, data){
    T.drill(host, data, { slug: 'euler-logistic', noun: 'drill', typeLabel: 'Kind of problem',
      types: [{ value: 'euler', label: 'Euler steps' }, { value: 'model', label: 'Euler in a context' }, { value: 'overunder', label: 'Over or under' }, { value: 'logistic', label: 'Logistic models' }],
      generate: function(r, ctx, type){ return S.generate(r, ctx, type); },
      title: function(p){ return { euler: 'Euler\'s method', model: 'Euler\'s method in a context', overunder: 'Over or under?', logistic: 'Reading a logistic model' }[p.type] || 'Practice problem'; },
      extra: function(el, p, api){ QM.clear(); QM.last = {}; QM.F = null; QM.svgEl = null; api.fig = figure(el, p); },
      onStep: function(s, right, api){ if(api.fig && api.fig.after) api.fig.after(s); },
      method: function(s, p){ return method(s, p); },
      onTry: function(s, t, api){ return onTry(s, t, api.problem); }
    });
  }
  function method(s, p){
    var k = s.key, X = p.fig && p.fig.x || 'x', Y = p.fig && p.fig.y || 'y';
    if(/^m\d/.test(k)) return 'Put the current point into the differential equation. Use the ' + Y + ' you found in the step before, never the true value.';
    if(/^y\d/.test(k) || k === 'e1') return 'New ' + Y + ' = old ' + Y + ' + (d' + Y + '/d' + X + ')·Δ' + X + ': multiply the slope by the step size, then add.';
    return { d2: 'Differentiate dy/dx with respect to x; every y gives a dy/dx factor, which you replace by the given formula.', d2v: 'Put the point into your second derivative.',
      ou: 'Euler follows tangent segments. Concave up: the curve is above its tangents (Euler is low). Concave down: below (Euler is high).',
      cap: 'Set the rate equal to 0 and solve: the positive solution is the carrying capacity. Factor first if it is written aP − bP².',
      lim: 'Any logistic solution that starts above 0 approaches the carrying capacity.', half: 'The rate is a parabola in P with zeros 0 and L: its top is halfway, at L/2.',
      rate: 'Put P = L/2 into the rate.', shape: 'Sign of the rate: increasing or decreasing. Below L/2 the rate grows with P (concave up); between L/2 and L it shrinks (concave down).' }[k] || '';
  }
  function onTry(s, t, p){
    var g = p.fig, who = t.ok || t.shown ? 'right' : 'yours', val = who === 'right' && s.kind === 'num' ? s.cell.answer : t.value, k = s.key, mk = [], N = T.numText;
    if(!isFinite(val) || s.kind !== 'num') return false;
    if(g.kind === 'euler'){
      var i = +k.slice(1), r = g.rows;
      if(k.charAt(0) === 'm') mk.push({ tangent: [r[i].x, r[i].y], slope: val, half: g.h * 0.5, who: who, label: (who === 'yours' ? 'yours: slope ' : 'slope ') + N(val) });
      else mk.push({ point: [r[i].x, val], who: who, label: (who === 'yours' ? 'yours: ' : '') + N(val) });
    } else if(g.kind === 'ou' && k === 'e1') mk.push({ point: [g.x0 + g.h, val], who: who, label: (who === 'yours' ? 'yours: ' : '') + N(val) });
    else if(g.kind === 'logistic' && (k === 'cap' || k === 'lim' || k === 'half')) mk.push({ hline: val, who: who, label: (who === 'yours' ? 'yours: ' : '') + g.v + ' = ' + N(val) });
    else return false;
    // the logistic figure draws the right lines itself once a step is done: keep only a wrong try there
    if(g.kind === 'logistic' && who === 'right'){ mk = QM.last[k] || []; if(!mk.length){ QM.clear(k); return false; } }
    else if(who === 'yours') QM.last[k] = mk; else if(QM.last[k]) mk = QM.last[k].concat(mk);
    QM.set(k, mk);
    if(QM.svgEl && QM.F){ var gg = QM.svgEl.querySelector('.el-tries'); if(gg) gg.innerHTML = QM.svg(QM.F); }
    return true;
  }
  /* sized(box, draw): draw(w, h) at a default size now, again once the
     studio has placed the figure, and whenever its box changes. */
  function sized(box, draw, ratio){
    var last = '';
    function dims(){
      var st = box.closest && box.closest('.ls-drill-stage'), w = Math.round(box.clientWidth) || 480, h = st ? Math.round(box.clientHeight) : 0;
      if(!st || h < 150) h = st ? 150 : Math.round(Math.min(w * (ratio || 0.7), 440));
      return [Math.max(220, w), h];
    }
    function go(force){ var d = dims(), k = d.join('x'); if(k === last && !force) return; last = k; draw(d[0], d[1]); }
    draw(480, Math.round(480 * (ratio || 0.7)));
    setTimeout(function(){ go(true); }, 0);
    if(window.ResizeObserver){ var t = null; new ResizeObserver(function(){ clearTimeout(t); t = setTimeout(go, 40); }).observe(box); }
  }
  function onPhone(el){ var r = el && el.closest && el.closest('.ls-root'); return !!(r && r.classList.contains('ls-phone')) || window.innerWidth <= 640; }
  function figure(el, p){
    var g = p.fig;
    if(g.kind === 'logistic') return logFig(el, p);
    if(g.kind === 'ou') return ouFig(el, p);
    return eulerFig(el, p);
  }
  function f2(s){ var h = M.fn(s, ['x', 'y']); return function(x, y){ return h({ x: x, y: y }); }; }
  function trueCurve(f, x0, y0, a, b){
    var pts = [], N = 120;
    [[x0, b], [x0, a]].forEach(function(seg, k){
      var x = x0, y = y0, out = [[x, y]], hh = (seg[1] - seg[0]) / N;
      if(!hh) return;
      for(var i = 0; i < N; i++){ y = S.rk4(f, x, y, x + hh, 6); x = x0 + (i + 1) * hh; if(!isFinite(y)) break; out.push([x, y]); }
      pts = k ? out.reverse().concat(pts.slice(1)) : out;
    });
    return pts;
  }
  /* Euler on the field, with its table filling in under it. */
  function eulerFig(el, p){
    var g = p.fig, f = f2(g.de), rows = g.rows, n = g.n, X = g.x, Y = g.y, done = {}, B = null, vw = null;
    var xs = [g.x0 - 0.35 * g.h, g.x0 + (n + 0.35) * g.h], ys = rows.map(function(r){ return r.y; });
    var tc = trueCurve(f, g.x0, g.y0, xs[0], xs[1]);
    tc.forEach(function(q){ if(isFinite(q[1])) ys.push(q[1]); });
    var lo = Math.min.apply(null, ys), hi = Math.max.apply(null, ys), pad = Math.max((hi - lo) * 0.18, 0.5);
    vw = { x: xs, y: [lo - pad, hi + pad] };
    function rowHtml(){
      return '<div class="table-wrap el-qtw" tabindex="0" role="region" aria-label="Euler table"><table class="ls-tbl el-tbl el-qtbl"><caption class="sr-only">Euler\'s method table, filled in as you answer</caption><thead><tr><th scope="col">' + esc(X) + '</th><th scope="col">' + esc(Y) + '</th><th scope="col">d' + esc(Y) + '/d' + esc(X) + '</th><th scope="col">Δ' + esc(Y) + ' = (d' + esc(Y) + '/d' + esc(X) + ')(' + clean(g.h, 4) + ')</th></tr></thead><tbody>' +
        rows.map(function(r, i){
          var yv = i === 0 || done['y' + i] ? clean(r.y, 4) : '?', mv = i < n && done['m' + i] ? clean(r.m, 4) : i < n ? '?' : '', dv = i < n && done['m' + i] ? clean(r.dy, 4) : i < n ? '?' : '';
          return '<tr' + (i === n ? ' class="el-last"' : '') + '><td class="r">' + clean(r.x, 4) + '</td><td class="r">' + yv + '</td><td class="r">' + mv + '</td><td class="r">' + dv + '</td></tr>';
        }).join('') + '</tbody></table></div>';
    }
    function draw(w, h){
      var ph = onPhone(el) && el.closest && el.closest('.ls-drill-stage');
      var tblH = 34 * (n + 2) + 6;
      var ph2 = el.closest && el.closest('.ls-drill-stage') ? Math.max(150, h - tblH - (ph ? 36 : 6)) : h;
      var spec = { label: 'Slope field of the differential equation near the starting point (' + clean(g.x0) + ', ' + clean(g.y0) + '), with the Euler steps drawn as you find them', width: w, height: ph2, x: vw.x, y: vw.y, xLabel: X, yLabel: Y };
      var F = P.frame(spec), C = clip(F), nx = Math.max(7, Math.round(11 * w / 480)), ny = Math.max(5, Math.round(nx * ph2 / w));
      var fld = fieldSvg(f, vw, F, nx, ny);
      el.innerHTML = '<div class="el-qfig"><figure class="cd-fig">' + P.svg(spec).replace('</svg>', C.def + '<g clip-path="url(#' + C.id + ')">' + fld + '<g class="el-dyn"></g></g><g class="el-tries">' + QM.svg(F) + '</g></svg>') + '</figure>' + rowHtml() + '</div>';
      B = { F: F, svg: el.querySelector('svg') }; QM.F = F; QM.svgEl = B.svg;
      paint();
    }
    function paint(){
      if(!B) return;
      var F = B.F, parts = [], k = 0;
      while(k < n && done['y' + (k + 1)]) k++;
      if(done.end) parts.push('<path class="el-true" d="' + pathOf(tc, F) + '"/>');
      for(var i = 0; i < n; i++) if(done['m' + i] && !done['y' + (i + 1)]){ var r = rows[i]; parts.push('<line class="el-tanq" x1="' + r2(F.sx(r.x)) + '" y1="' + r2(F.sy(r.y)) + '" x2="' + r2(F.sx(r.x + g.h)) + '" y2="' + r2(F.sy(r.y + r.dy)) + '"/>'); }
      if(k) parts.push('<path class="el-poly" d="' + pathOf(rows.slice(0, k + 1).map(function(r){ return [r.x, r.y]; }), F) + '"/>');
      for(var j = 1; j <= k; j++) parts.push('<path class="el-tri" d="M' + r2(F.sx(rows[j - 1].x)) + ' ' + r2(F.sy(rows[j - 1].y)) + 'H' + r2(F.sx(rows[j].x)) + 'V' + r2(F.sy(rows[j].y)) + '"/>');
      rows.slice(0, k + 1).forEach(function(r, i){ parts.push('<circle class="' + (i ? 'el-pt' : 'el-start') + '" cx="' + r2(F.sx(r.x)) + '" cy="' + r2(F.sy(r.y)) + '" r="' + (i ? 4.5 : 6) + '"/>'); });
      parts.push('<text class="el-qlab" x="' + r2(F.sx(rows[0].x) + 9) + '" y="' + r2(F.sy(rows[0].y) - 9) + '">(' + clean(rows[0].x) + ', ' + clean(rows[0].y) + ')</text>');
      B.svg.querySelector('.el-dyn').innerHTML = parts.join('');
      var tw = el.querySelector('.el-qtw'); if(tw) tw.outerHTML = rowHtml();
    }
    sized(el, draw, 0.95);
    return { after: function(s){ done[s.key] = true; if(s.key === 'y' + n) done.end = true; paint(); } };
  }
  function ouFig(el, p){
    var g = p.fig, f = f2(g.de), done = {}, B = null;
    var x1 = g.x0 + g.h, tc = trueCurve(f, g.x0, g.y0, g.x0 - 0.3 * g.h, x1 + 0.3 * g.h), ys = [g.y0, g.y1];
    tc.forEach(function(q){ if(isFinite(q[1])) ys.push(q[1]); });
    var lo = Math.min.apply(null, ys), hi = Math.max.apply(null, ys), pad = Math.max((hi - lo) * 0.25, 0.4);
    var vw = { x: [g.x0 - 0.3 * g.h, x1 + 0.3 * g.h], y: [lo - pad, hi + pad] };
    function draw(w, h){
      var spec = { label: 'Slope field near (' + clean(g.x0) + ', ' + clean(g.y0) + '), with one Euler step and, at the end, the true solution', width: w, height: h, x: vw.x, y: vw.y, xLabel: 'x', yLabel: 'y' };
      var F = P.frame(spec), C = clip(F), nx = Math.max(7, Math.round(11 * w / 480)), ny = Math.max(5, Math.round(nx * h / w));
      el.innerHTML = '<figure class="cd-fig el-qfig">' + P.svg(spec).replace('</svg>', C.def + '<g clip-path="url(#' + C.id + ')">' + fieldSvg(f, vw, F, nx, ny) + '<g class="el-dyn"></g></g><g class="el-tries">' + QM.svg(F) + '</g></svg>') + '</figure>';
      B = { F: F, svg: el.querySelector('svg') }; QM.F = F; QM.svgEl = B.svg; paint();
    }
    function paint(){
      if(!B) return;
      var F = B.F, parts = [];
      if(done.ou) parts.push('<path class="el-true" d="' + pathOf(tc, F) + '"/>');
      if(done.e1) parts.push('<path class="el-poly" d="M' + r2(F.sx(g.x0)) + ' ' + r2(F.sy(g.y0)) + 'L' + r2(F.sx(x1)) + ' ' + r2(F.sy(g.y1)) + '"/><circle class="el-pt" cx="' + r2(F.sx(x1)) + '" cy="' + r2(F.sy(g.y1)) + '" r="5"/>');
      if(done.ou){ var yt = tc.filter(function(q){ return Math.abs(q[0] - x1) < 1e-9; })[0]; yt = yt ? yt[1] : S.rk4(f, g.x0, g.y0, x1, 400); parts.push('<line class="el-err" x1="' + r2(F.sx(x1)) + '" x2="' + r2(F.sx(x1)) + '" y1="' + r2(F.sy(g.y1)) + '" y2="' + r2(F.sy(yt)) + '"/><text class="el-qlab" x="' + r2(F.sx(x1) - 8) + '" y="' + r2(F.sy((g.y1 + yt) / 2)) + '" text-anchor="end">' + (g.up ? 'Euler low' : 'Euler high') + '</text>'); }
      parts.push('<circle class="el-start" cx="' + r2(F.sx(g.x0)) + '" cy="' + r2(F.sy(g.y0)) + '" r="6"/><text class="el-qlab" x="' + r2(F.sx(g.x0) + 9) + '" y="' + r2(F.sy(g.y0) - 9) + '">(' + clean(g.x0) + ', ' + clean(g.y0) + ')</text>');
      if(done.d2v) parts.push('<text class="el-qlab" x="' + r2(F.sx(g.x0) + 9) + '" y="' + r2(F.sy(g.y0) + 20) + '">y″ = ' + clean(g.d2, 3) + (g.up ? ', concave up' : ', concave down') + '</text>');
      B.svg.querySelector('.el-dyn').innerHTML = parts.join('');
    }
    sized(el, draw, 0.72);
    return { after: function(s){ done[s.key] = true; paint(); } };
  }
  function logFig(el, p){
    var g = p.fig, L = g.L, V = g.v, m = S.logistic(g.k, L, g.P0), done = {}, B = null;
    var A = Math.abs((L - g.P0) / g.P0), TM = Math.max(4, Math.ceil((Math.log(Math.max(A, 1)) + 5) / g.k));
    var top = Math.max(L, g.P0) * 1.4;   // room above, so the axis does not give L away
    function draw(w, h){
      var wide = w > 620 && done.rate, w1 = wide ? Math.round(w * 0.6) - 6 : w, h1 = wide ? h : Math.round(h * (done.rate ? 0.58 : 1)), w2 = wide ? w - w1 - 12 : w, h2 = wide ? h : h - h1 - 8;
      var spec = { label: 'Graph of ' + V + ' against t: the start, then what you find drawn on it', width: w1, height: h1, x: [0, TM], y: [0, top], xLabel: 't (' + g.unit + ')', yLabel: V };
      var F = P.frame(spec), parts = [];
      if(done.cap) parts.push('<line class="el-cap" x1="' + F.pad.l + '" x2="' + (F.w - F.pad.r) + '" y1="' + r2(F.sy(L)) + '" y2="' + r2(F.sy(L)) + '"/><text class="el-caplab" x="' + (F.w - F.pad.r - 4) + '" y="' + r2(F.sy(L) - 6) + '" text-anchor="end">' + V + ' = ' + L + '</text>');
      if(done.lim) parts.push('<path class="el-logc" d="' + pathOf(sampleFn(m.P, 0, TM, spec, 240), F) + '"/>');
      if(done.half){ parts.push('<line class="el-halfl" x1="' + F.pad.l + '" x2="' + (F.w - F.pad.r) + '" y1="' + r2(F.sy(L / 2)) + '" y2="' + r2(F.sy(L / 2)) + '"/><text class="el-halflab" x="' + (F.w - F.pad.r - 4) + '" y="' + r2(F.sy(L / 2) + 15) + '" text-anchor="end">' + V + ' = ' + clean(L / 2) + '</text>'); if(m.tHalf != null && m.tHalf <= TM) parts.push('<circle class="el-infl" cx="' + r2(F.sx(m.tHalf)) + '" cy="' + r2(F.sy(L / 2)) + '" r="5"/>'); }
      if(done.shape){ var dt = TM * 0.1, r0 = m.rate(g.P0); parts.push('<line class="el-tan" x1="' + r2(F.sx(0)) + '" y1="' + r2(F.sy(g.P0)) + '" x2="' + r2(F.sx(dt)) + '" y2="' + r2(F.sy(g.P0 + r0 * dt)) + '"/>'); }
      parts.push('<circle class="el-start" cx="' + r2(F.sx(0)) + '" cy="' + r2(F.sy(g.P0)) + '" r="6"/><text class="el-qlab" x="' + r2(F.sx(0) + 10) + '" y="' + r2(F.sy(g.P0) + (g.P0 > top * 0.8 ? 18 : -9)) + '">' + V + '(0) = ' + clean(g.P0) + '</text>');
      var out = '<div class="el-qlog' + (wide ? ' is-wide' : '') + '"><figure class="cd-fig">' + P.svg(spec).replace('</svg>', parts.join('') + '<g class="el-tries">' + QM.svg(F) + '</g></svg>') + '</figure>';
      if(done.rate){
        var Pm = Math.max(L, g.P0) * 1.1, rmin = Math.min(0, m.rate(Pm));
        var spec2 = { label: 'The rate d' + V + '/dt as a function of ' + V + ', largest at half the carrying capacity', width: w2, height: Math.max(130, h2), x: [0, Pm], y: [rmin - (m.maxRate - rmin) * 0.05, m.maxRate * 1.3], xLabel: V, yLabel: 'rate' };
        var F2 = P.frame(spec2);
        out += '<figure class="cd-fig">' + P.svg(spec2).replace('</svg>', '<path class="el-par" d="' + pathOf(sampleFn(m.rate, 0, Pm, spec2, 160), F2) + '"/><circle class="el-vtx" cx="' + r2(F2.sx(L / 2)) + '" cy="' + r2(F2.sy(m.maxRate)) + '" r="5"/><text class="el-halflab" x="' + r2(F2.sx(L / 2) + 8) + '" y="' + r2(F2.sy(m.maxRate) - 6) + '">' + clean(m.maxRate, 3) + '</text><circle class="el-now" cx="' + r2(F2.sx(g.P0)) + '" cy="' + r2(F2.sy(m.rate(g.P0))) + '" r="5"/></svg>') + '</figure>';
      }
      el.innerHTML = out + '</div>';
      QM.F = F; QM.svgEl = el.querySelector('svg');
    }
    var last = [480, 330];
    sized(el, function(w, h){ last = [w, h]; draw(w, h); }, 0.68);
    return { after: function(s){ done[s.key] = true; draw(last[0], last[1]); } };
  }
})();
