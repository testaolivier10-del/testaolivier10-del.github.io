/* Slope fields trainer (simulator; docs/apcalc-spec.md section 6). OWNED BY
   THIS TOOL ONLY. The model is ApCalcMath.slopeFields
   (calculus/assets/tools/math/slope-fields.js); axes and ticks come from
   ApCalcPlot (calc-plot.js), math text from ApCalcTex (calc-math.js), the
   frame from ApCalcTools.modes (Explore, then Test yourself) on the Tool
   Studio.

   Explore: the slope field of a gallery equation on the stage, a draggable
   starting point whose solution curve is traced (adaptive Runge-Kutta) both
   ways across the field, the exact particular solution dashed over it, tap
   a grid point for its slope worked out. Dock: the equation chips, k for
   growth/decay and cooling, "Exact solution" and "Start over". Why: what
   the curve does and why. Details: the separation of variables through the
   point, the numbers, the field density and T_a.

   Test yourself: ApCalcTools.drill with six kinds (slopes, match, sketch,
   separate, concavity, exp). The sketch step is a choice step whose four
   options (follows the field, wrong way, crosses an equilibrium, drifts
   off) are hidden and set by the student's dragged curve through
   ApCalcMath.slopeFields.sketchGrade, so the first try is recorded like any
   other step and the feedback names the slip. */
(function(){
  'use strict';
  var T = window.ApCalcTools, M = window.ApCalcMath, P = window.ApCalcPlot;
  if(!T || !M || !M.slopeFields || !P) return;
  var S = M.slopeFields, esc = T.esc, NS = 'http://www.w3.org/2000/svg';
  function tex(s, o){ return window.ApCalcTex ? window.ApCalcTex.render(s, o || {}) : esc(s); }
  function html(s){ return window.ApCalcTex ? window.ApCalcTex.html(s) : esc(s); }
  function r2(v){ return Math.round(v * 100) / 100; }
  function num(v, d){ return T.F(v, d == null ? 2 : d); }
  function clean(v, d){ return String(+(+v).toFixed(d == null ? 2 : d)).replace('-', '−'); }
  function pathOf(pts, F){
    var out = '', pen = false;
    pts.forEach(function(p){
      if(!isFinite(p[1])){ pen = false; return; }
      out += (pen ? 'L' : 'M') + r2(F.sx(p[0])) + ' ' + r2(F.sy(p[1])); pen = true;
    });
    return out;
  }
  /* A field as SVG lines: every segment the same length on screen. */
  function fieldSvg(f, view, F, n, cls){
    var g = S.grid(view, n), kx = (F.sx(view.x[1]) - F.sx(view.x[0])) / (view.x[1] - view.x[0]), ky = (F.sy(view.y[0]) - F.sy(view.y[1])) / (view.y[1] - view.y[0]);
    var half = 0.36 * Math.min(g.sx * kx, g.sy * ky), out = [];
    g.xs.forEach(function(x){ g.ys.forEach(function(y){
      var m = f(x, y), cx = F.sx(x), cy = F.sy(y);
      if(!isFinite(m)){ out.push('<line x1="' + r2(cx) + '" y1="' + r2(cy - half) + '" x2="' + r2(cx) + '" y2="' + r2(cy + half) + '" class="is-vert"/>'); return; }
      var vx = 1, vy = m * ky / kx, L = Math.sqrt(vx * vx + vy * vy);
      out.push('<line x1="' + r2(cx - vx / L * half) + '" y1="' + r2(cy + vy / L * half) + '" x2="' + r2(cx + vx / L * half) + '" y2="' + r2(cy - vy / L * half) + '"/>');
    }); });
    return '<g class="sf-field' + (cls ? ' ' + cls : '') + '">' + out.join('') + '</g>';
  }
  function segAt(f, x, y, F, view, len, cls){
    var kx = (F.sx(view.x[1]) - F.sx(view.x[0])) / (view.x[1] - view.x[0]), ky = (F.sy(view.y[0]) - F.sy(view.y[1])) / (view.y[1] - view.y[0]);
    var m = f(x, y), cx = F.sx(x), cy = F.sy(y), vx = 1, vy = isFinite(m) ? m * ky / kx : 1e9, L = Math.sqrt(vx * vx + vy * vy);
    return '<line class="' + cls + '" x1="' + r2(cx - vx / L * len) + '" y1="' + r2(cy + vy / L * len) + '" x2="' + r2(cx + vx / L * len) + '" y2="' + r2(cy - vy / L * len) + '"/>';
  }
  /* Catmull-Rom through screen points, as cubic Bezier segments. */
  function smooth(pts){
    if(pts.length < 2) return '';
    var d = 'M' + r2(pts[0][0]) + ' ' + r2(pts[0][1]);
    for(var i = 0; i + 1 < pts.length; i++){
      var p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
      d += 'C' + r2(p1[0] + (p2[0] - p0[0]) / 6) + ' ' + r2(p1[1] + (p2[1] - p0[1]) / 6) + ' ' + r2(p2[0] - (p3[0] - p1[0]) / 6) + ' ' + r2(p2[1] - (p3[1] - p1[1]) / 6) + ' ' + r2(p2[0]) + ' ' + r2(p2[1]);
    }
    return d;
  }
  /* A drag handle on an SVG (pointer + keyboard). o: { x, y, F, label,
     step: [dx, dy], axis: 'y' | null, onMove(x, y), clamp(x, y) -> [x, y] } */
  function handle(svg, o){
    var g = document.createElementNS(NS, 'g'), x = o.x, y = o.y, F = o.F;
    function rebind(s2, F2){ var had = document.activeElement === g; svg = s2; F = F2; svg.appendChild(g); place(); if(had) g.focus(); }
    g.setAttribute('class', 'sf-handle' + (o.cls ? ' ' + o.cls : ''));
    g.setAttribute('tabindex', '0'); g.setAttribute('role', 'slider');
    g.innerHTML = '<circle class="sf-halo" r="18"/><circle class="sf-dot" r="' + (o.r || 8) + '"/>';
    svg.appendChild(g);
    function txt(){ return o.label(x, y); }
    function place(){ g.setAttribute('transform', 'translate(' + r2(F.sx(x)) + ' ' + r2(F.sy(y)) + ')'); g.setAttribute('aria-valuenow', String(+y.toFixed(2))); g.setAttribute('aria-valuetext', txt()); g.setAttribute('aria-label', txt()); }
    function set(nx, ny, fire){ var c = o.clamp ? o.clamp(nx, ny) : [nx, ny]; x = c[0]; y = c[1]; place(); if(fire && o.onMove) o.onMove(x, y); }
    var on = false;
    function local(e){ var pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY; var m = svg.getScreenCTM(); var p = m ? pt.matrixTransform(m.inverse()) : pt; return [F.ix(p.x), F.iy(p.y)]; }
    g.addEventListener('pointerdown', function(e){ if(g.getAttribute('aria-disabled') === 'true') return; on = true; try{ g.setPointerCapture(e.pointerId); }catch(err){} g.classList.add('is-drag'); e.preventDefault(); e.stopPropagation(); });
    g.addEventListener('pointermove', function(e){ if(!on) return; var p = local(e); set(o.axis === 'y' ? x : p[0], p[1], true); });
    function up(){ if(!on) return; on = false; g.classList.remove('is-drag'); if(o.onEnd) o.onEnd(x, y); }
    g.addEventListener('pointerup', up); g.addEventListener('pointercancel', up);
    g.addEventListener('keydown', function(e){
      if(g.getAttribute('aria-disabled') === 'true') return;
      var k = e.key, f = e.shiftKey ? 5 : 1, sx = o.step[0] * f, sy = o.step[1] * f, nx = x, ny = y;
      if(k === 'ArrowUp') ny += sy; else if(k === 'ArrowDown') ny -= sy;
      else if(k === 'ArrowRight' && o.axis !== 'y') nx += sx; else if(k === 'ArrowLeft' && o.axis !== 'y') nx -= sx;
      else if((k === 'Enter' || k === ' ') && o.onEnter){ e.preventDefault(); o.onEnter(x, y); return; }
      else return;
      e.preventDefault(); set(nx, ny, true); if(o.onEnd) o.onEnd(x, y);
    });
    place();
    return { opts: o, el: g, set: set, rebind: rebind, get: function(){ return [x, y]; }, lock: function(v){ g.setAttribute('aria-disabled', v ? 'true' : 'false'); g.classList.toggle('is-locked', !!v); } };
  }

  T.mount('slope-fields', function(app, data){
    var ex = null;
    T.modes(app, { slug: 'slope-fields', explore: function(h){ ex = explore(h, data); }, quiz: function(h){ quiz(h, data); },
      studio: { explore: function(pane, s){ ex.studio(pane, s); } } });
  });

  /* =========================================================== explore */
  function explore(host, data){
    var id = 'x+y', d = S.de(id), params = {}, x0, y0, exactOn = true, density = 13, sel = null, LS = null, touched = false, F = null, svg = null, H = null, view = null, fn = null;
    S.GALLERY.forEach(function(g){ if(g.params) params[g.id] = JSON.parse(JSON.stringify(g.params)); });
    var nid = T.nid('sf');
    function $(q){ return host.querySelector(q) || (LS ? LS.root.querySelector(q) : null); }
    var CHIP = { 'x+y': 'x + y', 'x/y': 'x / y', 'xy': 'xy', 'y-2': 'y − 2', 'ky': 'ky', 'cool': 'Cooling' };
    host.innerHTML = '<section class="bt-problem sf-card" aria-labelledby="' + nid + '-h"><h2 id="' + nid + '-h" class="sr-only">Slope field explorer</h2>' +
      '<div class="sf-fig"><p class="sf-eq"></p><div class="sf-plot"></div></div>' +
      '<div class="sf-ctl"><div class="sf-chips ls-scroll" role="group" aria-label="Differential equation">' + S.GALLERY.map(function(g){ return '<button type="button" class="tchip sf-chip" data-id="' + g.id + '" aria-pressed="false">' + esc(CHIP[g.id]) + '</button>'; }).join('') + '</div>' +
      '<div class="sf-k"></div><div class="bt-buttons sf-btns"><button type="button" class="bt-btn sf-exact" aria-pressed="true">Exact solution</button><button type="button" class="bt-btn sf-reset">Start over</button></div></div>' +
      '<div class="sf-say"></div>' +
      T.moreHtml('<div class="sf-more-b"></div><p class="bt-small">Keyboard: focus the starting point, then arrow keys move it (Shift moves faster); Enter shows the slope at that point.</p>', 'field density, room temperature') +
      '<div class="sf-steps"></div><div class="sf-nums"></div><p class="sr-only sf-live"></p></section>';
    var say = T.announcer($('.sf-live'));
    var cue = T.cue('Drag the dot: the solution through it follows the segments. Tap any grid point to see its slope.');
    $('.sf-ctl').insertBefore(cue.el, $('.sf-ctl').firstChild);
    var kSl = null, taSl = null;
    var dens = T.choiceSelect({ label: 'Field density', options: [{ value: 9, label: 'Sparse' }, { value: 13, label: 'Normal' }, { value: 19, label: 'Dense' }], value: 13, onChange: function(v){ density = +v; build(); } });
    dens.el.classList.add('bt-inline');
    $('.sf-more-b').appendChild(dens.el);
    var taWrap = document.createElement('div'); taWrap.className = 'sf-ta'; $('.sf-more-b').appendChild(taWrap);
    host.querySelectorAll('.sf-chip').forEach(function(b){ b.addEventListener('click', function(){ act(); pick(b.getAttribute('data-id')); }); });
    $('.sf-exact').addEventListener('click', function(){ act(); exactOn = !exactOn; this.setAttribute('aria-pressed', String(exactOn)); update(); });
    $('.sf-reset').addEventListener('click', function(){ act(); x0 = d.start[0]; y0 = d.start[1]; sel = null; if(H) H.set(x0, y0); update(); });
    function act(){ if(!touched){ touched = true; cue.done(); } }
    function fns(){ return S.fns(d, params[id]); }
    function pick(nextId){
      id = nextId; d = S.de(id); view = d.view; x0 = d.start[0]; y0 = d.start[1]; sel = null;
      fn = fns();
      host.querySelectorAll('.sf-chip').forEach(sync); if(LS) LS.root.querySelectorAll('.sf-chip').forEach(sync);
      // k for growth/decay and cooling, in the dock; T_a in More options
      var kw = $('.sf-k'); kw.innerHTML = ''; kSl = null;
      if(d.model === 'exp') kSl = T.slider({ label: 'Growth constant k', min: -0.5, max: 0.5, step: 0.05, value: params.ky.k, decimals: 2, onInput: function(v){ act(); params.ky.k = v; fn = fns(); build(); } });
      if(d.model === 'cool') kSl = T.slider({ label: 'Cooling constant k (per minute)', min: 0.02, max: 0.2, step: 0.01, value: params.cool.k, decimals: 2, onInput: function(v){ act(); params.cool.k = v; fn = fns(); build(); } });
      if(kSl) kw.appendChild(kSl.el);
      taWrap.innerHTML = ''; taSl = null;
      if(d.model === 'cool'){ taSl = T.slider({ label: 'Room temperature T_a (°C)', min: 0, max: 40, step: 1, value: params.cool.Ta, decimals: 0, onInput: function(v){ params.cool.Ta = v; fn = fns(); build(); } }); taWrap.appendChild(taSl.el); }
      $('.sf-eq').innerHTML = tex(eqTex(), { display: false });
      build();
    }
    function sync(b){ b.setAttribute('aria-pressed', String(b.getAttribute('data-id') === id)); }
    function eqTex(){
      var p = params[id] || {};
      if(id === 'ky') return '\\frac{dy}{dt} = ' + String(+p.k.toFixed(2)) + 'y';
      if(id === 'cool') return '\\frac{dT}{dt} = -' + String(+p.k.toFixed(2)) + '(T - ' + p.Ta + ')';
      return '\\frac{dy}{dx} = ' + d.tex;
    }
    function xv(){ return d.xv || 'x'; } function yv(){ return d.yv || 'y'; }
    function clamp(x, y){
      var sn = d.snap, X = Math.round(x / sn[0]) * sn[0], Y = Math.round(y / sn[1]) * sn[1];
      X = Math.max(view.x[0], Math.min(view.x[1], +X.toFixed(6))); Y = Math.max(view.y[0], Math.min(view.y[1], +Y.toFixed(6)));
      if(!isFinite(fn.f(X, Y))) Y = +(Y + sn[1]).toFixed(6); // x/y is undefined on y = 0
      return [X, Y];
    }
    /* The static layers (axes, field, equilibria) and the handle; redrawn
       when the equation, k, T_a, density or the stage size changes. */
    function build(){
      var box = $('.sf-plot'), w = Math.max(280, Math.round(box.clientWidth || 520)), h = Math.max(240, Math.round(box.clientHeight || 0)) || Math.round(w * 0.8);
      if(!LS || !box.clientHeight) h = Math.round(Math.min(w * 0.82, 560));
      var spec = { label: 'Slope field of ' + window.ApCalcTex.text(eqTex()) + ', with the solution curve through the starting point', width: w, height: h, x: view.x, y: view.y, xLabel: xv(), yLabel: yv() };
      var base = P.svg(spec);
      F = P.frame(spec);
      var eqs = d.eq(params[id] || {}).filter(function(v){ return v >= view.y[0] && v <= view.y[1]; });
      var extra = fieldSvg(fn.f, view, F, density) +
        eqs.map(function(v){ return '<line class="sf-eqline" x1="' + F.sx(view.x[0]) + '" x2="' + F.sx(view.x[1]) + '" y1="' + r2(F.sy(v)) + '" y2="' + r2(F.sy(v)) + '"/><text class="sf-eqlab" x="' + r2(F.sx(view.x[0]) + 30) + '" y="' + r2(F.sy(v) - 6) + '" text-anchor="start">' + esc(yv() + ' = ' + clean(v)) + ' (equilibrium)</text>'; }).join('') +
        '<rect class="sf-hit" x="' + F.pad.l + '" y="' + F.pad.t + '" width="' + (F.w - F.pad.l - F.pad.r) + '" height="' + (F.h - F.pad.t - F.pad.b) + '"/>' +
        '<g class="sf-dyn"></g>';
      box.innerHTML = base.replace('</svg>', extra + '</svg>');
      svg = box.querySelector('svg');
      svg.setAttribute('role', 'group'); // it holds a draggable point (a slider), so it is not a plain image
      svg.querySelector('.sf-hit').addEventListener('click', function(e){
        var pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY; var m = svg.getScreenCTM(), q = m ? pt.matrixTransform(m.inverse()) : pt;
        var g = S.grid(view, density), X = F.ix(q.x), Y = F.iy(q.y);
        var gx = g.xs.reduce(function(a, b){ return Math.abs(b - X) < Math.abs(a - X) ? b : a; }), gy = g.ys.reduce(function(a, b){ return Math.abs(b - Y) < Math.abs(a - Y) ? b : a; });
        act(); sel = [gx, gy]; update(); announceSel();
      });
      if(H){ H.rebind(svg, F); H.opts.step = [d.snap[0], d.snap[1]]; update(); return; }
      H = handle(svg, { x: x0, y: y0, F: F, step: [d.snap[0] * (id === 'cool' ? 1 : 1), d.snap[1]], clamp: clamp, label: function(x, y){ return 'Starting point, ' + xv() + ' = ' + clean(x) + ', ' + yv() + ' = ' + clean(y); },
        onMove: function(x, y){ act(); x0 = x; y0 = y; schedule(); }, onEnd: function(){ sayCurve(); }, onEnter: function(x, y){ sel = [x, y]; update(); announceSel(); } });
      update();
    }
    var raf = 0;
    function schedule(){ if(raf) return; raf = (window.requestAnimationFrame || setTimeout)(function(){ raf = 0; update(); }); }
    function update(){
      if(!svg) return;
      var sol = S.solve(fn.f, x0, y0, view), dyn = svg.querySelector('.sf-dyn'), parts = [];
      var ex = d.exact ? d.exact(x0, y0, params[id]) : null;
      parts.push('<path class="sf-sol" d="' + pathOf(sol.pts, F) + '"/>');
      if(exactOn && ex){
        var pts = [], n = 300;
        for(var i = 0; i <= n; i++){ var x = view.x[0] + (view.x[1] - view.x[0]) * i / n; if(x < ex.lo || x > ex.hi){ pts.push([x, NaN]); continue; } var y = ex.fn(x); pts.push([x, y > view.y[1] + (view.y[1] - view.y[0]) || y < view.y[0] - (view.y[1] - view.y[0]) ? NaN : y]); }
        parts.push('<path class="sf-exactc" d="' + pathOf(pts, F) + '"/>');
      }
      [sol.left, sol.right].forEach(function(e){
        if(e.why !== 'vertical') return;
        var p = e === sol.left ? sol.pts[0] : sol.pts[sol.pts.length - 1];
        parts.push('<circle class="sf-end" cx="' + r2(F.sx(p[0])) + '" cy="' + r2(F.sy(p[1])) + '" r="5"/>');
      });
      // doubling / half-life marks for growth and decay
      if(d.model === 'exp' && params.ky.k !== 0){
        var Th = S.halfLife(params.ky.k), up = params.ky.k > 0;
        for(var k = 1; k <= 6; k++){
          var t = x0 + k * Th, yy = y0 * Math.pow(up ? 2 : 0.5, k);
          if(t > view.x[1] || yy > view.y[1] || yy < (view.y[1] - view.y[0]) * 0.03) break;
          parts.push('<circle class="sf-mark" cx="' + r2(F.sx(t)) + '" cy="' + r2(F.sy(yy)) + '" r="4"/><text class="sf-marklab" x="' + r2(F.sx(t) + 6) + '" y="' + r2(F.sy(yy) - 6) + '">' + (up ? '×' + Math.pow(2, k) : '×1/' + Math.pow(2, k)) + '</text>');
        }
      }
      // the tapped grid point: its segment, longer, and its slope
      if(sel){
        var m = fn.f(sel[0], sel[1]);
        parts.push(segAt(fn.f, sel[0], sel[1], F, view, 26, 'sf-selseg') + '<circle class="sf-seldot" cx="' + r2(F.sx(sel[0])) + '" cy="' + r2(F.sy(sel[1])) + '" r="4"/>');
        var tx = F.sx(sel[0]) + 10, ty = F.sy(sel[1]) - 12, right = tx > F.w - 110;
        parts.push('<text class="sf-sellab" x="' + r2(right ? F.sx(sel[0]) - 10 : tx) + '" y="' + r2(Math.max(F.pad.t + 12, ty)) + '" text-anchor="' + (right ? 'end' : 'start') + '">slope ' + (isFinite(m) ? clean(m) : 'vertical') + '</text>');
      }
      dyn.innerHTML = parts.join('');
      if(H){ if(svg.lastChild !== H.el) svg.appendChild(H.el); H.set(x0, y0); }
      svg.setAttribute('aria-label', 'Slope field of ' + window.ApCalcTex.text(eqTex()) + '. ' + curveWords(sol));
      words(sol, ex);
    }
    function curveWords(sol){
      var a = sol.pts[0], b = sol.pts[sol.pts.length - 1];
      return 'The solution through (' + clean(x0) + ', ' + clean(y0) + ') runs from (' + clean(a[0]) + ', ' + clean(a[1]) + ') to (' + clean(b[0]) + ', ' + clean(b[1]) + ')' +
        (sol.left.why === 'vertical' || sol.right.why === 'vertical' ? ', where its slope turns vertical' : '') + '.';
    }
    function sayCurve(){ say(curveWords(S.solve(fn.f, x0, y0, view)) + ' Slope at the point ' + clean(fn.f(x0, y0)) + '.'); }
    function announceSel(){ if(!sel) return; var m = fn.f(sel[0], sel[1]); say('At (' + clean(sel[0]) + ', ' + clean(sel[1]) + ') the slope is ' + (isFinite(m) ? clean(m) : 'undefined: the segment is vertical') + '.', true); }
    /* The one line, its reasoning (Why), the numbers and the separation (Details). */
    function words(sol, ex){
      var m = fn.f(x0, y0), v2 = fn.f2(x0, y0), P0 = '(' + clean(x0) + ', ' + clean(y0) + ')', X = xv(), Y = yv();
      var eqs = d.eq(params[id] || {}), onEq = eqs.some(function(v){ return Math.abs(v - y0) < 1e-9; });
      var vert = [sol.left, sol.right].filter(function(e){ return e.why === 'vertical'; });
      var head;
      if(sel){
        var ms = fn.f(sel[0], sel[1]);
        head = '<b>At (' + clean(sel[0]) + ', ' + clean(sel[1]) + '):</b> ' + (isFinite(ms) ? tex((id === 'ky' || id === 'cool' ? '\\frac{d' + Y + '}{dt}' : '\\frac{dy}{dx}') + ' = ' + d.at(sel[0], sel[1], params[id]) + ' = ' + String(+ms.toFixed(3))) : 'the slope is undefined (division by 0): the segment is vertical.');
      } else if(onEq) head = '<b>On the equilibrium ' + Y + ' = ' + clean(y0) + '.</b> The slope is 0 all along it, so this solution is a flat line.';
      else if(vert.length) head = '<b>Slope ' + clean(m) + ' at ' + P0 + '.</b> The solution stops at ' + X + ' ≈ ' + vert.map(function(e){ return clean(e.x, 3); }).join(' and ') + ', where its slope turns vertical.';
      else head = '<b>Slope ' + clean(m) + ' at ' + P0 + '.</b> The curve is tangent to every segment it meets.';
      var why = '<p>Each segment is drawn with the slope ' + tex('\\frac{d' + Y + '}{d' + X + '}') + ' at its center. A solution curve has exactly that slope wherever it goes, so it runs along the segments: from ' + P0 + ' it leaves with slope ' + clean(m) + '.</p>' +
        (isFinite(v2) && !onEq ? '<p>' + tex('\\frac{d^2' + Y + '}{d' + X + '^2} = ' + (id === 'ky' ? 'k^2 y' : id === 'cool' ? 'k^2(T - T_a)' : d.f2tex)) + ' = ' + clean(v2, 3) + ' there, so the solution is concave ' + (v2 > 0 ? 'up' : v2 < 0 ? 'down' : '(neither way, at this point)') + ' at the point.</p>' : '') +
        (eqs.length ? '<p>' + esc(Y + ' = ' + eqs.map(function(v){ return clean(v); }).join(', ')) + ' is an equilibrium solution (every segment on it is flat). Two solution curves never cross, so a solution above it stays above and one below stays below.</p>' : '') +
        (vert.length ? '<p>A solution is a function of ' + X + ', so it cannot turn back. Where the slope becomes vertical (here on ' + esc(d.undefinedOn || '') + ', where ' + tex('\\frac{dy}{dx}') + ' is undefined), the solution\'s domain ends.</p>' : '') +
        (d.note ? '<p>' + html(d.note) + '</p>' : '') +
        (ex ? '<p>' + (exactOn ? 'The dashed curve is the exact solution from the formula; it sits on the traced curve.' : 'Turn on "Exact solution" to draw the formula over the traced curve.') + '</p>' : '');
      T.explain($('.sf-say'), head, why);
      // the separation of variables
      var st = $('.sf-steps');
      if(st){
        var L = d.sep ? S.steps(id, x0, y0, params[id]) : [];
        st.innerHTML = '<h3 class="ls-title-l">' + (d.sep ? 'Solve it: separation of variables through ' + esc(P0) : 'Solving it') + '</h3>' +
          (d.sep ? '<ol class="ls-steps sf-sep">' + L.map(function(l){ return '<li><div class="sf-sepi"><span>' + html(l[0]) + '</span>' + (l[1] ? '<span class="sf-sepm">' + tex(l[1], { display: true }) + '</span>' : '') + '</div></li>'; }).join('') + '</ol>'
            : '<p class="ls-sub">' + html(d.note || 'Not separable.') + '</p>');
      }
      var nm = $('.sf-nums');
      if(nm){
        var row = function(k, v){ return '<tr><th scope="row">' + k + '</th><td class="r">' + v + '</td></tr>'; };
        var rows = row('Starting point', esc(P0)) + row('Slope ' + tex('\\frac{d' + Y + '}{d' + X + '}'), isFinite(m) ? clean(m, 3) : 'undefined') +
          row('Second derivative', isFinite(v2) ? clean(v2, 3) : 'undefined') +
          row('Curve drawn from', esc(X + ' = ' + clean(sol.left.x, 3) + (sol.left.why === 'vertical' ? ' (vertical slope)' : ' (edge)'))) +
          row('Curve drawn to', esc(X + ' = ' + clean(sol.right.x, 3) + (sol.right.why === 'vertical' ? ' (vertical slope)' : ' (edge)')));
        if(id === 'ky') rows += row('k', clean(params.ky.k)) + (params.ky.k ? row(params.ky.k > 0 ? 'Doubling time' : 'Half-life', clean(S.halfLife(params.ky.k), 3)) : '');
        if(id === 'cool') rows += row('k, T_a', clean(params.cool.k) + ', ' + params.cool.Ta + ' °C') + row('Gap halves every', clean(S.halfLife(params.cool.k), 2) + ' min');
        nm.innerHTML = '<h3 class="ls-title-l">The numbers</h3><table class="ls-tbl"><caption class="sr-only">The starting point and its solution</caption><tbody>' + rows + '</tbody></table>';
      }
      if(LS){
        LS.caption(T.sayHead($('.sf-say')), 'explore');
        var pl = [{ k: 'Slope', html: isFinite(m) ? clean(m) : '—', tone: 'readout' }];
        if(isFinite(v2) && !onEq && v2 !== 0) pl.push({ html: v2 > 0 ? 'Concave up' : 'Concave down', tone: 'ghost' });
        LS.pills(pl, 'left', 'explore');
        var pr = [];
        if(id === 'ky' && params.ky.k) pr.push({ k: params.ky.k > 0 ? 'Doubles every' : 'Half-life', html: clean(S.halfLife(params.ky.k), 2), tone: 'accent' });
        else if(vert.length) pr.push({ html: 'Domain ends', tone: 'warn' });
        else if(onEq) pr.push({ html: 'Equilibrium', tone: 'good' });
        LS.pills(pr, 'right', 'explore');
      }
    }
    function studio(pane, s){
      LS = s;
      var sp = T.studioPane(pane, s, { stage: [$('.sf-fig')], dock: [$('.sf-ctl')], why: [$('.sf-say')], details: [$('.sf-nums'), $('.sf-steps')], moreLabel: 'Field density, room temperature' });
      build();
      if(s.mode() === 'explore') s.hint({ target: s.root.querySelector('.sf-handle'), text: 'Drag the starting point' });
      if(window.ResizeObserver){ var t = null; new ResizeObserver(function(){ clearTimeout(t); t = setTimeout(build, 60); }).observe($('.sf-plot')); }
      sp.open();
    }
    pick('x+y');
    if(!window.LevlStudio && window.ResizeObserver){ var t2 = null; new ResizeObserver(function(){ clearTimeout(t2); t2 = setTimeout(build, 80); }).observe($('.sf-plot')); }
    return { studio: studio };
  }

  /* ===================================================== test yourself */
  var VIEW = { x: [-3, 3], y: [-3, 3] };
  function f2(s){ var g = M.fn(s, ['x', 'y']); return function(x, y){ return g({ x: x, y: y }); }; }
  function quiz(host, data){
    var o = { slug: 'slope-fields', noun: 'drill', typeLabel: 'Kind of problem', textOnStage: true,
      types: [{ value: 'slopes', label: 'Slopes at points' }, { value: 'match', label: 'Match the field' }, { value: 'sketch', label: 'Sketch a solution' },
        { value: 'separate', label: 'Separation of variables' }, { value: 'concavity', label: 'Concavity of a solution' }, { value: 'exp', label: 'Exponential models' }],
      generate: function(r, ctx, type){ return S.generate(r, ctx, type); },
      title: function(p){ return { slopes: 'Slopes from the equation', match: 'Which field is it?', sketch: 'Sketch the solution', separate: 'A particular solution', concavity: 'Concavity of a solution', exp: 'Exponential growth and decay' }[p.type] || 'Practice problem'; },
      extra: function(el, p, api){ api.fig = figure(el, p, api); },
      onStep: function(s, right, api){ if(api.fig && api.fig.after) api.fig.after(s, right); }
    };
    T.drill(host, data, o);
  }
  /* sized(box, draw): draw(w, h) now at a default size, again once the
     Tool Studio has placed the figure, and whenever its box changes, so the
     SVG is drawn at the size it is shown (its text stays readable on a
     phone). */
  function sized(box, draw, ratio){
    var last = '';
    function dims(){
      var st = box.closest && box.closest('.ls-drill-stage'), w = Math.round(box.clientWidth) || 480, h = st ? Math.round(box.clientHeight) : 0;
      if(!st || h < 150) h = st ? 150 : Math.round(Math.min(w * (ratio || 0.9), 470));
      return [Math.max(200, w), h];
    }
    function go(force){ var d = dims(), k = d.join('x'); if(k === last && !force) return; last = k; draw(d[0], d[1]); }
    draw(480, Math.round(480 * (ratio || 0.9)));
    setTimeout(function(){ go(true); }, 0);
    if(window.ResizeObserver){ var t = null; new ResizeObserver(function(){ clearTimeout(t); t = setTimeout(go, 40); }).observe(box); }
  }
  function plotBox(el, spec, extra){
    el.innerHTML = '<figure class="cd-fig sf-qfig">' + P.svg(spec).replace('</svg>', (extra || '') + '<g class="sf-dyn"></g></svg>') + '</figure>';
    return { svg: el.querySelector('svg'), F: P.frame(spec), dyn: el.querySelector('.sf-dyn') };
  }
  function figure(el, p, api){
    var g = p.fig;
    if(g.kind === 'match') return matchFig(el, p);
    if(g.kind === 'sketch') return sketchFig(el, p, api);
    if(g.kind === 'exp') return expFig(el, p);
    var f = f2(g.de), view = g.view || VIEW, done = [], B = null, F = null;
    if(g.kind === 'solution') view = { x: [-3, 3], y: g.y0 > 0 ? [-1, 7] : [-7, 1] };
    function overlay(){
      var shown = [];
      done.forEach(function(key){
        if(g.kind === 'field' && g.marks && /^sl\d$/.test(key)){
          var mk = g.marks.filter(function(m){ return m.step === key; })[0];
          if(mk) shown.push(segAt(f, mk.at[0], mk.at[1], F, view, 24, 'sf-selseg') + '<text class="sf-sellab" x="' + r2(F.sx(mk.at[0]) + 10) + '" y="' + r2(F.sy(mk.at[1]) + 18) + '">slope ' + clean(f(mk.at[0], mk.at[1])) + '</text>');
        }
        if(key === 'iso' && g.zero){
          var z = g.zero, pts = [];
          for(var t = -4; t <= 4.001; t += 0.05){ if(z.type === 'line') pts.push([t, z.m * t + z.q]); else if(z.type === 'parab') pts.push([t, z.a * t * t]); }
          var d = pathOf(pts.filter(function(q){ return q[1] >= view.y[0] - 1 && q[1] <= view.y[1] + 1; }), F);
          if(z.type === 'cross') d = 'M' + r2(F.sx(z.h)) + ' ' + F.pad.t + 'V' + (F.h - F.pad.b) + 'M' + F.pad.l + ' ' + r2(F.sy(0)) + 'H' + (F.w - F.pad.r);
          shown.push('<path class="sf-zero" d="' + d + '"/>');
        }
        if(key === 'conc' && g.tangent){
          var a = g.tangent.at, m = g.tangent.m, sol = S.solve(f, a[0], a[1], view);
          shown.push('<path class="sf-sol" d="' + pathOf(sol.pts, F) + '"/><line class="sf-tan" x1="' + r2(F.sx(a[0] - 1.2)) + '" y1="' + r2(F.sy(a[1] - 1.2 * m)) + '" x2="' + r2(F.sx(a[0] + 1.2)) + '" y2="' + r2(F.sy(a[1] + 1.2 * m)) + '"/>');
        }
        if(key === 'sepY'){
          var Y = M.fn(g.y, ['x']), pp = [];
          for(var i = 0; i <= 240; i++){ var x = view.x[0] + (view.x[1] - view.x[0]) * i / 240; pp.push([x, Y(x)]); }
          shown.push('<path class="sf-sol" d="' + pathOf(pp.filter(function(q){ return q[1] >= view.y[0] - 2 && q[1] <= view.y[1] + 2; }), F) + '"/>');
        }
      });
      B.dyn.innerHTML = shown.join('');
    }
    sized(el, function(w, h){
      var spec = { label: 'Slope field of the differential equation in the problem' + (g.marks ? ', with the point' + (g.marks.length > 1 ? 's ' : ' ') + g.marks.map(function(m){ return m.label; }).join(' and ') + ' marked' : ''), width: w, height: h, x: view.x, y: view.y, xLabel: 'x', yLabel: 'y' };
      var F0 = P.frame(spec);
      var marks = (g.marks || []).map(function(m){ return '<circle class="sf-qmark" cx="' + r2(F0.sx(m.at[0])) + '" cy="' + r2(F0.sy(m.at[1])) + '" r="6"/><text class="sf-qlab" x="' + r2(F0.sx(m.at[0]) + 9) + '" y="' + r2(F0.sy(m.at[1]) - 9) + '">' + esc(m.label) + '</text>'; }).join('');
      if(g.kind === 'solution') marks = '<circle class="sf-qmark" cx="' + r2(F0.sx(0)) + '" cy="' + r2(F0.sy(g.y0)) + '" r="6"/><text class="sf-qlab" x="' + r2(F0.sx(0) + 9) + '" y="' + r2(F0.sy(g.y0) - 9) + '">(0, ' + clean(g.y0) + ')</text>';
      B = plotBox(el, spec, fieldSvg(f, view, F0, w < 360 ? 9 : 13) + marks); F = B.F;
      overlay();
    }, 0.92);
    return { after: function(s){ done.push(s.key); overlay(); } };
  }
  /* Four small fields: drawn edge to edge (no tick labels), so on a phone the
     segments, not the margins, fill the cells. Axes are the two lines
     through 0, ticks at the integers. */
  function thumb(s, view, w, h, label){
    var pad = 4, F = { x: view.x, y: view.y, w: w, h: h, pad: { l: pad, r: pad, t: pad, b: pad },
      sx: function(v){ return pad + (v - view.x[0]) / (view.x[1] - view.x[0]) * (w - 2 * pad); },
      sy: function(v){ return pad + (view.y[1] - v) / (view.y[1] - view.y[0]) * (h - 2 * pad); } };
    var ticks = '';
    for(var k = Math.ceil(view.x[0]); k <= view.x[1]; k++) if(k) ticks += '<line x1="' + r2(F.sx(k)) + '" x2="' + r2(F.sx(k)) + '" y1="' + r2(F.sy(0) - 3) + '" y2="' + r2(F.sy(0) + 3) + '"/>';
    for(k = Math.ceil(view.y[0]); k <= view.y[1]; k++) if(k) ticks += '<line y1="' + r2(F.sy(k)) + '" y2="' + r2(F.sy(k)) + '" x1="' + r2(F.sx(0) - 3) + '" x2="' + r2(F.sx(0) + 3) + '"/>';
    return '<svg class="calc-plot sf-thumb" viewBox="0 0 ' + w + ' ' + h + '" width="' + w + '" height="' + h + '" role="img" aria-label="' + esc(label) + '">' +
      '<g class="calc-plot-axis"><line x1="' + pad + '" x2="' + (w - pad) + '" y1="' + r2(F.sy(0)) + '" y2="' + r2(F.sy(0)) + '"/><line y1="' + pad + '" y2="' + (h - pad) + '" x1="' + r2(F.sx(0)) + '" x2="' + r2(F.sx(0)) + '"/>' + ticks + '</g>' +
      fieldSvg(f2(s), view, F, Math.min(w, h) < 90 ? 7 : Math.min(w, h) < 140 ? 9 : 11) + '</svg>';
  }
  function matchFig(el, p){
    var g = p.fig, view = g.view, key = false;
    sized(el, function(w, h){
      var cw = Math.max(110, Math.floor((w - 10) / 2) - 8), ch = Math.max(80, Math.floor((h - 10) / 2) - 24);
      el.innerHTML = '<div class="sf-match">' + g.des.map(function(s, i){
        return '<figure class="sf-mfig' + (key && i === g.answer ? ' is-key' : '') + '" data-i="' + i + '"><figcaption>Field ' + (i + 1) + '</figcaption>' + thumb(s, view, cw, ch, 'Field ' + (i + 1) + ': a slope field on the square from minus 3 to 3') + '</figure>';
      }).join('') + '</div>';
    }, 0.95);
    return { after: function(s){ if(s.key === 'mf'){ key = true; var fg = el.querySelector('.sf-mfig[data-i="' + g.answer + '"]'); if(fg) fg.classList.add('is-key'); } } };
  }
  function sketchFig(el, p, api){
    var g = p.fig, f = f2(g.de), view = g.view, ys = g.xs.map(function(){ return g.y0; }), hs = [], locked = false, svg = null, F = null, truth = false;
    function drawMine(){
      if(!svg) return;
      var pts = g.xs.map(function(x, i){ return [x, ys[i]]; }).concat([[g.x0, g.y0]]).sort(function(a, b){ return a[0] - b[0]; });
      svg.querySelector('.sf-mine').setAttribute('d', smooth(pts.map(function(q){ return [F.sx(q[0]), F.sy(q[1])]; })));
      if(truth) svg.querySelector('.sf-truth').setAttribute('d', pathOf(S.solve(f, g.x0, g.y0, view).pts, F));
    }
    function stepForm(){ var all = (api.area || el).querySelectorAll('.cd-step'); for(var i = all.length - 1; i >= 0; i--) if(all[i].querySelector('.sf-sk-opt')) return all[i]; return null; }
    function syncRadio(){
      var form = stepForm(); if(!form) return;
      form.classList.add('sf-skstep');
      var r = form.querySelector('input[type=radio][value="' + S.sketchGrade(g, ys) + '"]');
      if(r && !r.disabled) r.checked = true;
    }
    sized(el, function(w, h){
      var spec = { label: 'Slope field with the starting point (' + clean(g.x0) + ', ' + clean(g.y0) + ') and points you drag to draw the solution curve', width: w, height: h, x: view.x, y: view.y, xLabel: 'x', yLabel: 'y' };
      var F0 = P.frame(spec), focused = hs.map(function(hd){ return document.activeElement === hd.el; }).indexOf(true);
      var eq = (g.eq || []).map(function(v){ return '<line class="sf-eqline" x1="' + F0.sx(view.x[0]) + '" x2="' + F0.sx(view.x[1]) + '" y1="' + r2(F0.sy(v)) + '" y2="' + r2(F0.sy(v)) + '"/>'; }).join('');
      var B = plotBox(el, spec, fieldSvg(f, view, F0, w < 360 ? 9 : 13) + eq + '<path class="sf-truth" d=""/><path class="sf-mine" d=""/>');
      F = B.F; svg = B.svg; hs = []; svg.setAttribute('role', 'group');
      g.xs.forEach(function(x, i){
        var hd = handle(svg, { x: x, y: ys[i], F: F, axis: 'y', step: [1, 0.1], r: 7, cls: 'sf-qh',
          clamp: function(X, Y){ return [x, Math.max(view.y[0], Math.min(view.y[1], Math.round(Y * 20) / 20))]; },
          label: function(X, Y){ return 'Your curve at x = ' + x + ': y = ' + clean(Y); },
          onMove: function(X, Y){ if(locked) return; ys[i] = Y; drawMine(); syncRadio(); } });
        if(locked) hd.lock(true);
        hs.push(hd);
      });
      var start = document.createElementNS(NS, 'g');
      start.innerHTML = '<circle class="sf-start" cx="' + r2(F.sx(g.x0)) + '" cy="' + r2(F.sy(g.y0)) + '" r="7"/><text class="sf-qlab" x="' + r2(F.sx(g.x0) + 10) + '" y="' + r2(F.sy(g.y0) - 10) + '">(' + clean(g.x0) + ', ' + clean(g.y0) + ')</text>';
      svg.appendChild(start);
      drawMine();
      if(focused > -1) hs[focused].el.focus();
    }, 0.92);
    // The sketch step appears after the slope step; check it whenever the DOM settles.
    setTimeout(syncRadio, 0);
    return { after: function(s){
      if(s.key === 'skm') setTimeout(syncRadio, 0);
      if(s.key === 'sk'){ locked = true; truth = true; hs.forEach(function(h){ h.lock(true); }); drawMine(); }
    } };
  }
  function expFig(el, p){
    var g = p.fig, tMax = Math.max(g.t1, g.T, Math.log(g.target / g.y0) / g.k) * 1.12, yMax = Math.max(g.y0, g.y0 * Math.exp(g.k * g.t1), g.target, g.grow ? 2 * g.y0 : g.y0) * 1.15, done = [], B = null;
    function overlay(){
      var F = B.F, shown = [];
      done.forEach(function(key){
        if(key === 'expk'){ var pp = []; for(var i = 0; i <= 200; i++){ var t = tMax * i / 200; pp.push([t, g.y0 * Math.exp(g.k * t)]); } shown.push('<path class="sf-sol" d="' + pathOf(pp.filter(function(q){ return q[1] <= yMax; }), F) + '"/>'); }
        if(key === 'expy'){ var y1 = g.y0 * Math.exp(g.k * g.t1); shown.push('<circle class="sf-mark" cx="' + r2(F.sx(g.t1)) + '" cy="' + r2(F.sy(y1)) + '" r="5"/><text class="sf-marklab" x="' + r2(F.sx(g.t1) + 8) + '" y="' + r2(F.sy(y1) + 16) + '">t = ' + g.t1 + '</text>'); }
        if(key === 'expt') shown.push('<line class="sf-eqline" x1="' + F.pad.l + '" x2="' + (F.w - F.pad.r) + '" y1="' + r2(F.sy(g.target)) + '" y2="' + r2(F.sy(g.target)) + '"/>');
      });
      B.dyn.innerHTML = shown.join('');
    }
    sized(el, function(w, h){
      var spec = { label: 'Graph of the amount against time, with the given data points', width: w, height: h, x: [0, tMax], y: [0, yMax], xLabel: 't (' + g.unit + ')', yLabel: 'y' };
      var F0 = P.frame(spec), y2 = g.grow ? 2 * g.y0 : g.y0 / 2;
      var pts = '<circle class="sf-qmark" cx="' + r2(F0.sx(0)) + '" cy="' + r2(F0.sy(g.y0)) + '" r="6"/><text class="sf-qlab" x="' + r2(F0.sx(0) + 9) + '" y="' + r2(F0.sy(g.y0) - 9) + '">(0, ' + g.y0 + ')</text>' +
        '<circle class="sf-qmark" cx="' + r2(F0.sx(g.T)) + '" cy="' + r2(F0.sy(y2)) + '" r="6"/><text class="sf-qlab" x="' + r2(F0.sx(g.T) + 9) + '" y="' + r2(F0.sy(y2) - 9) + '">(' + g.T + ', ' + clean(y2) + ')</text>';
      B = plotBox(el, spec, pts); overlay();
    }, 0.75);
    return { after: function(s){ done.push(s.key); overlay(); } };
  }
})();
