/* Slope fields, tools v2 (docs/tools-v2-calc-slope-fields-brief.md; the standard: docs/tools-v2-standard.md). On the
   shared kit (assets/course/tool-kit2.js) through the course adapter ApCalcTools.studioKit2, after the Tangent tracer
   and the Limit explorer. OWNED BY THIS TOOL ONLY. The model is ApCalcMath.slopeFields
   (calculus/assets/tools/math/slope-fields.js, unchanged); tick values come from ApCalcPlot (calc-plot.js), math
   text from ApCalcTex (calc-math.js). Styles: slope-fields.css.

   EXPLORE (free play, nothing graded, no side panel): a river seen from above on the exact grid. Every field segment
   is a short current streak with the slope dy/dx at its center; an equilibrium solution is a calm line. The main
   control is the leaf (the starting point; drag it, tap the water, or use the arrow keys): the solution through it
   is drawn at once both ways, and when you let go the leaf floats forward along it to the edge. The equation picker
   sits by "Show me how" (y - 2, xy, x / y, x + y, ky, cooling); k (and the room temperature for cooling) are quiet
   knobs on the picture; "Check with the formula" draws the particular solution as a thin solid line. The cause line
   (K.cause) works out the slope at the leaf and says where the solution goes; "?" holds the numbers, the separation
   of variables through the point, why, and the keys.

   TEST YOURSELF (unchanged): ApCalcTools.drill with six kinds (slopes, match, sketch, separate, concavity, exp). The
   sketch step is a choice step whose four options (follows the field, wrong way, crosses an equilibrium, drifts off)
   are hidden and set by the student's dragged curve through ApCalcMath.slopeFields.sketchGrade, so the first try is
   recorded like any other step and the feedback names the slip. Records slope-fields:<context>:<step>. */
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
    g.innerHTML = '<circle class="sf-hitc" r="22"/><circle class="sf-halo" r="18"/><circle class="sf-dot" r="' + (o.r || 8) + '"/>';
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

  /* ============================================================= explore (tools v2) */
  /* docs/tools-v2-calc-slope-fields-brief.md. A river seen from above on the exact grid: every field segment is a short
     current streak (its slope the segment's slope), an equilibrium solution is a calm line, and the student drops a
     leaf: the solution through it is drawn at once, both ways, and on release the leaf floats forward along it. */
  var uid = 0;
  var KEY = 'apcalc-slope-fields';
  var EQS = [
    { id: 'y-2', label: 'y′ = y − 2' },
    { id: 'xy', label: 'y′ = xy' },
    { id: 'x/y', label: 'y′ = x / y' },
    { id: 'x+y', label: 'y′ = x + y' },
    { id: 'ky', label: 'y′ = ky, growth' },
    { id: 'cool', label: 'Cooling coffee' }];
  // where each equation starts in Explore (y − 2 starts above the calm line, so the leaf floats away from it)
  var START = { 'y-2': [-2, 2.5], 'xy': [-2, 0.5], 'x/y': [1, 2], 'x+y': [-1, 1], 'ky': [0, 2], 'cool': [0, 90] };
  function el(tag, cls){ var e = document.createElement(tag); if(cls) e.className = cls; return e; }
  function cl(v, a, b){ return Math.max(a, Math.min(b, v)); }
  function r1(v){ return Math.round(v * 10) / 10; }
  function pn(v){ return v < 0 ? '(' + clean(v) + ')' : clean(v); }
  /* "= 0.5" when two decimals are exact, "≈ 0.33" when they are not */
  function eqv(m){ return (Math.abs(m - Math.round(m * 100) / 100) > 1e-9 ? '≈ ' : '= ') + clean(m); }
  var MEAS = null, MW = {};
  /* the drawn width of a label: measured once in a hidden svg text with the label's own font */
  function textW(s, px){
    var k = px + '|' + s; if(MW[k]) return MW[k];
    if(!MEAS || !MEAS.isConnected){ var sv = document.createElementNS(NS, 'svg'); sv.setAttribute('class', 'calc-plot'); sv.setAttribute('aria-hidden', 'true'); sv.style.cssText = 'position:absolute;left:-9999px;top:0;width:10px;height:10px;visibility:hidden'; MEAS = document.createElementNS(NS, 'text'); MEAS.setAttribute('class', 'sf2-lab'); sv.appendChild(MEAS); document.body.appendChild(sv); }
    MEAS.style.fontSize = px + 'px'; MEAS.textContent = s;
    var w = MEAS.getComputedTextLength ? MEAS.getComputedTextLength() : 0;
    if(!(w > 0)) return s.length * px * 0.62;
    return (MW[k] = w + 2);
  }

  function explore(host, data){
    var K = window.LevlKit2, nid = 'sf2-' + (++uid);
    var params = {};
    S.GALLERY.forEach(function(g){ if(g.params) params[g.id] = JSON.parse(JSON.stringify(g.params)); });
    var st = { id: 'y-2', x0: START['y-2'][0], y0: START['y-2'][1], exact: false, mode: 'explore', ride: null, took: null, ready: false, drawn: null, fadeLeaf: null };
    var G = null, LS = null, d = S.de(st.id), fn = S.fns(d, params[d.id]);
    function xv(){ return d.xv || 'x'; } function yv(){ return d.yv || 'y'; }
    function prm(){ return params[st.id] || {}; }
    function snap(){ return d.snap; }

    /* ---------------------------------------------------- the stage */
    var stage = el('div', 'sf2');
    var head = K.head({ purpose: '', how: { label: 'Show me how', onClick: function(){ startTour(); } } });
    var pickWrap = el('label', 'sf2-pick'), pick = el('select', 'sf2-sel');
    pickWrap.innerHTML = '<span class="sf2-pick-k">Equation</span>';
    pick.setAttribute('aria-label', 'Differential equation');
    EQS.forEach(function(q){ var op = document.createElement('option'); op.value = q.id; op.textContent = q.label; pick.appendChild(op); });
    pick.value = st.id;
    pickWrap.appendChild(pick);
    head.el.insertBefore(pickWrap, head.how);
    stage.appendChild(head.el);
    var scene = el('div', 'sf2-scene'); scene.id = nid + '-scene';
    scene.innerHTML = '<svg class="sf2-svg calc-plot" role="img" aria-label="" xmlns="' + NS + '" data-ls-text="keep"><defs></defs><g class="sf2-static"></g><g class="sf2-fieldg"></g><g class="sf2-dyn"></g><g class="sf2-leafg"></g><g class="sf2-labs"></g></svg>';
    stage.appendChild(scene);
    var svg = scene.querySelector('svg'), defs = svg.querySelector('defs'), gS = svg.querySelector('.sf2-static'), gF = svg.querySelector('.sf2-fieldg'),
      gD = svg.querySelector('.sf2-dyn'), gL = svg.querySelector('.sf2-leafg'), gT = svg.querySelector('.sf2-labs');
    var layer = K.layer(scene);
    var lines = el('div', 'sf2-lines'), cause = K.cause({ label: 'Why' });
    lines.appendChild(cause.el);
    var checkB = el('button', 'sf2-check'); checkB.type = 'button'; checkB.setAttribute('aria-pressed', 'false'); checkB.textContent = 'Check with the formula';
    lines.appendChild(checkB);
    stage.appendChild(lines);
    var live = el('p', 'tk2-sr'); live.setAttribute('aria-live', 'polite'); stage.appendChild(live);
    function say(t){ live.textContent = ''; setTimeout(function(){ live.textContent = t; }, 40); }

    /* the leaf: one group, moved by its transform (never rebuilt while it floats) */
    gL.innerHTML = '<g class="sf2-wake"><path d="M-17 -2 L-31 -9 M-17 2 L-31 9"/></g><g class="sf2-leaf"><path class="sf2-leaf-b" d="M-15 0 C-9 -8.5 7 -8.5 15 0 C7 8.5 -9 8.5 -15 0 Z"/><path class="sf2-leaf-r" d="M-13 0 L13 0 M-4 0 L1 -4.5 M3 0 L8 -3.5 M-4 0 L1 4.5 M3 0 L8 3.5"/><path class="sf2-leaf-s" d="M-15 0 L-20 1.5"/></g>' +
      '<g class="sf2-leaf sf2-leaf2" opacity="0"><path class="sf2-leaf-b" d="M-15 0 C-9 -8.5 7 -8.5 15 0 C7 8.5 -9 8.5 -15 0 Z"/><path class="sf2-leaf-r" d="M-13 0 L13 0 M-4 0 L1 -4.5 M3 0 L8 -3.5 M-4 0 L1 4.5 M3 0 L8 3.5"/><path class="sf2-leaf-s" d="M-15 0 L-20 1.5"/></g>';
    var leafE = gL.querySelector('.sf2-leaf'), leaf2 = gL.querySelector('.sf2-leaf2'), wake = gL.querySelector('.sf2-wake');

    /* ---------------------------------------------------- geometry */
    function hasK(){ return d.model === 'exp' || d.model === 'cool'; }
    function geo(W, H){
      var narrow = W < 560, g = { W: W, H: H, narrow: narrow };
      var pl = narrow ? 52 : 60, pr = 24, pt = hasK() ? (narrow ? 52 : 56) : (narrow ? 32 : 34), pb = 30;
      var L = pl, T = pt, R = W - pr, B = H - pb, iw = R - L, ih = B - T, v = d.view;
      // equal spans across and up (every equation but the two models): one unit across is as long as one unit up
      var sx = v.x[1] - v.x[0], sy = v.y[1] - v.y[0], x = v.x.slice(), y = v.y.slice();
      if(Math.abs(sx - sy) < 1e-9 && !hasK()){
        var cx = (x[0] + x[1]) / 2, cy = (y[0] + y[1]) / 2;
        if(iw > ih) x = [cx - sx / 2 * iw / ih, cx + sx / 2 * iw / ih]; else y = [cy - sy / 2 * ih / iw, cy + sy / 2 * ih / iw];
        // snap the window to the grid step so the start point's clamp stays on the 0.1 grid
        x = [Math.ceil(x[0] * 10 - 1e-9) / 10, Math.floor(x[1] * 10 + 1e-9) / 10]; y = [Math.ceil(y[0] * 10 - 1e-9) / 10, Math.floor(y[1] * 10 + 1e-9) / 10];
      }
      g.view = { x: x, y: y };
      g.A = { L: L, T: T, R: R, B: B, W: iw, H: ih,
        sx: function(t){ return L + (t - x[0]) / (x[1] - x[0]) * iw; }, sy: function(t){ return T + (y[1] - t) / (y[1] - y[0]) * ih; },
        ix: function(p){ return x[0] + (p - L) / iw * (x[1] - x[0]); }, iy: function(p){ return y[1] - (p - T) / ih * (y[1] - y[0]); } };
      g.kx = iw / (x[1] - x[0]); g.ky = ih / (y[1] - y[0]);
      // the field: about one streak every 44 px (36 on a phone), each at least 14 px long
      var sp = narrow ? 32 : 44, stx = nice(sp / g.kx), sty = nice(sp / g.ky);
      g.grid = { sx: stx, sy: sty, xs: steps(x, stx), ys: steps(y, sty) };
      g.half = Math.max(7, 0.34 * Math.min(stx * g.kx, sty * g.ky));
      return g;
    }
    /* a step of 1, 2, 2.5 or 5 times a power of ten, the nearest to raw */
    function nice(raw){ var p = Math.pow(10, Math.floor(Math.log10(raw))), best = p; [1, 2, 2.5, 5, 10].forEach(function(m){ if(m * p <= raw * 1.15) best = m * p; }); return best; }
    function steps(r, s){ var out = []; for(var t = Math.ceil(r[0] / s - 1e-9) * s; t <= r[1] + 1e-9; t += s) out.push(+t.toPrecision(12)); return out; }
    function inView(x, y){ var v = G.view; return x >= v.x[0] - 1e-9 && x <= v.x[1] + 1e-9 && y >= v.y[0] - 1e-9 && y <= v.y[1] + 1e-9; }

    /* ---------------------------------------------------- the start point, encoded for the kit's slider */
    var OFF = 5000;
    function enc(x, y){ var s = snap(); return (Math.round(x / s[0]) + OFF) + (Math.round(y / s[1]) + OFF) * 1e4; }
    function dec(v){ var s = snap(), iy = Math.floor(v / 1e4 + 1e-9), ix = Math.round(v - iy * 1e4); return [+((ix - OFF) * s[0]).toFixed(6), +((iy - OFF) * s[1]).toFixed(6)]; }
    /* the nearest allowed start point to (x, y): on the grid, in the window, never where the slope is undefined */
    function fit(x, y, from){
      var s = snap(), v = G.view;
      var X = Math.round(x / s[0]) * s[0], Y = Math.round(y / s[1]) * s[1];
      X = +cl(X, Math.ceil(v.x[0] / s[0] - 1e-9) * s[0], Math.floor(v.x[1] / s[0] + 1e-9) * s[0]).toFixed(6);
      Y = +cl(Y, Math.ceil(v.y[0] / s[1] - 1e-9) * s[1], Math.floor(v.y[1] / s[1] + 1e-9) * s[1]).toFixed(6);
      if(!isFinite(fn.f(X, Y))) Y = +(Y + (from != null && from < Y ? s[1] : from != null && from > Y ? -s[1] : (y >= Y ? s[1] : -s[1]))).toFixed(6);
      return [X, Y];
    }
    function startPx(){ return [G.A.sx(st.x0), G.A.sy(st.y0)]; }

    /* ---------------------------------------------------- drawing: banks, water and grid (on a layout or a new equation) */
    function drawStatic(){
      var A = G.A, W = G.W, Ht = G.H, v = G.view, out = [];
      defs.innerHTML = '<linearGradient id="' + nid + '-w" x1="0" y1="0" x2="0.35" y2="1"><stop offset="0" class="sf2s-w0"/><stop offset="0.55" class="sf2s-w1"/><stop offset="1" class="sf2s-w2"/></linearGradient>' +
        '<linearGradient id="' + nid + '-g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="sf2s-g0"/><stop offset="1" class="sf2s-g1"/></linearGradient>' +
        '<radialGradient id="' + nid + '-sh" cx="0.3" cy="0.25" r="0.9"><stop offset="0" class="sf2s-sh0"/><stop offset="1" class="sf2s-sh1"/></radialGradient>' +
        '<clipPath id="' + nid + '-c"><rect x="' + A.L + '" y="' + A.T + '" width="' + A.W + '" height="' + A.H + '"/></clipPath>';
      // the banks: grass, a sandy edge at the water
      out.push('<rect class="sf2-land" x="0" y="0" width="' + W + '" height="' + Ht + '" fill="url(#' + nid + '-g)"/>');
      // grass tufts on the banks, kept off the tick numbers (a fixed scatter, so a redraw never shuffles them)
      var tufts = '', peb = '', rnd = (function(){ var z = 7; return function(){ z = (z * 16807) % 2147483647; return z / 2147483647; }; })();
      function bare(x, y){ return (x > A.L - 9 && x < A.R + 9 && y > A.T - 9 && y < A.B + 9) || (y > A.B + 4 && y < A.B + 25) || (x > A.L - 36 && x < A.L - 2 && y > A.T - 8 && y < A.B + 8) || (y < A.T - 6 && y > 2 && x < A.L + 60); }
      for(var i = 0; i < Math.round(W * Ht / 700); i++){
        var tx = rnd() * W, ty = 6 + rnd() * (Ht - 6);
        if(bare(tx, ty)) continue;
        tufts += 'M' + r1(tx) + ' ' + r1(ty) + 'l-2.5 -6M' + r1(tx) + ' ' + r1(ty) + 'l0.5 -7.5M' + r1(tx) + ' ' + r1(ty) + 'l3.5 -5';
      }
      out.push('<path class="sf2-tuft" d="' + tufts + '"/>');
      // the sandy shore, a little wider than the water, with pebbles
      out.push('<rect class="sf2-sand" x="' + (A.L - 7) + '" y="' + (A.T - 7) + '" width="' + (A.W + 14) + '" height="' + (A.H + 14) + '" rx="11"/>');
      for(i = 0; i < Math.round((A.W + A.H) / 22); i++){
        var u = rnd() * 2 * (A.W + A.H), px, py;
        if(u < A.W){ px = A.L + u; py = A.T - 3.5; } else if(u < 2 * A.W){ px = A.L + u - A.W; py = A.B + 3.5; } else if(u < 2 * A.W + A.H){ px = A.L - 3.5; py = A.T + u - 2 * A.W; } else { px = A.R + 3.5; py = A.T + u - 2 * A.W - A.H; }
        peb += '<ellipse cx="' + r1(px) + '" cy="' + r1(py) + '" rx="' + r1(1.2 + rnd() * 1.6) + '" ry="' + r1(0.9 + rnd() * 1.1) + '"/>';
      }
      out.push('<g class="sf2-peb">' + peb + '</g>');
      // reeds at two corners of the water
      var reeds = '';
      [[A.R - 4, A.T - 4, -1], [A.L + 4, A.B + 3, 1]].forEach(function(c, j){
        for(var r = 0; r < 5; r++){ var bx = c[0] + c[2] * (r * 4 - 2), hgt = 14 + ((r * 7 + j * 3) % 9); reeds += 'M' + r1(bx) + ' ' + r1(c[1] + 2) + 'q' + (c[2] * 2) + ' ' + (-hgt / 2) + ' ' + (c[2] * (1 + r % 2)) + ' ' + (-hgt); }
      });
      out.push('<path class="sf2-reed" d="' + reeds + '"/>');
      out.push('<rect x="' + A.L + '" y="' + A.T + '" width="' + A.W + '" height="' + A.H + '" rx="5" fill="url(#' + nid + '-w)"/>');
      out.push('<rect class="sf2-shine" x="' + A.L + '" y="' + A.T + '" width="' + A.W + '" height="' + A.H + '" rx="5" fill="url(#' + nid + '-sh)"/>');
      // the exact grid on the water, and the axes where they cross it
      var tx2 = P.ticks(v.x[0], v.x[1], Math.max(4, Math.round(A.W / (G.narrow ? 64 : 86)))), ty2 = P.ticks(v.y[0], v.y[1], Math.max(4, Math.round(A.H / 56)));
      var gl = '';
      tx2.forEach(function(t){ var X = r1(A.sx(t)); gl += 'M' + X + ' ' + A.T + 'V' + A.B; });
      ty2.forEach(function(t){ var Y = r1(A.sy(t)); gl += 'M' + A.L + ' ' + Y + 'H' + A.R; });
      out.push('<path class="sf2-grid" d="' + gl + '"/>');
      var ax = '';
      if(v.y[0] < 0 && v.y[1] > 0) ax += 'M' + A.L + ' ' + r1(A.sy(0)) + 'H' + A.R;
      if(v.x[0] < 0 && v.x[1] > 0) ax += 'M' + r1(A.sx(0)) + ' ' + A.T + 'V' + A.B;
      if(ax) out.push('<path class="sf2-axis" d="' + ax + '"/>');
      // tick numbers on the banks
      var tk = '';
      G.tickXs = []; G.hid = '';
      tx2.forEach(function(t){ var X = A.sx(t); if(X < A.L + 6 && t !== v.x[0]) return; G.tickXs.push([X, textW(clean(t), 12)]); tk += '<text class="is-x" x="' + r1(X) + '" y="' + (A.B + 19) + '" text-anchor="middle">' + clean(t) + '</text>'; });
      ty2.forEach(function(t){ var Y = A.sy(t); if(Y > A.B - 4 && Y < A.B + 1 && v.x[0] < 0) return; tk += '<text x="' + (A.L - 8) + '" y="' + r1(Y + 4) + '" text-anchor="end">' + clean(t) + '</text>'; });
      out.push('<g class="sf2-ticks">' + tk + '</g>');
      gS.innerHTML = out.join('');
      G.ticksX = tx2; G.ticksY = ty2;
    }

    /* ---------------------------------------------------- the field (a new equation, k, the room or the layout) */
    function fieldPath(f){
      var A = G.A, g = G.grid, h = G.half, dd = '';
      g.xs.forEach(function(x){ var X = A.sx(x); if(X < A.L + h * 0.6 || X > A.R - h * 0.6) return; g.ys.forEach(function(y){
        var Y = A.sy(y); if(Y < A.T + h * 0.6 || Y > A.B - h * 0.6) return;
        var m = f(x, y), ux, uy;
        if(isNaN(m)) return;                         // 0/0: no slope at all here
        if(!isFinite(m)){ ux = 0; uy = 1; }           // vertical
        else { var vx = G.kx, vy = m * G.ky, L = Math.sqrt(vx * vx + vy * vy); ux = vx / L; uy = vy / L; }
        dd += 'M' + r1(X - ux * h) + ' ' + r1(Y + uy * h) + 'L' + r1(X + ux * h) + ' ' + r1(Y - uy * h);
      }); });
      return dd;
    }
    function eqList(){ return d.eq(prm()).filter(function(v){ return v >= G.view.y[0] - 1e-9 && v <= G.view.y[1] + 1e-9; }); }
    function kZero(){ return d.model === 'exp' && Math.abs(prm().k) < 1e-12; }
    function drawField(){
      var A = G.A, out = ['<path class="sf2-field" d="' + fieldPath(fn.f) + '"/>'];
      if(!kZero()) eqList().forEach(function(e){ var Y = r1(A.sy(e)); out.push('<path class="sf2-calm" d="M' + A.L + ' ' + Y + 'H' + A.R + '"/><path class="sf2-eqline" d="M' + A.L + ' ' + Y + 'H' + A.R + '"/>'); });
      gF.innerHTML = out.join('');
    }

    /* ---------------------------------------------------- the solution through the start point */
    function solution(){
      var sol = S.solve(fn.f, st.x0, st.y0, G.view), A = G.A, pts = [];
      sol.pts.forEach(function(p){ pts.push([A.sx(p[0]), A.sy(p[1]), p[0], p[1]]); });
      // keep only the run through the start point that stays in the water (it stops at the edge, never leaves the picture)
      var i0 = 0; for(var i = 0; i < sol.pts.length; i++) if(Math.abs(sol.pts[i][0] - st.x0) < 1e-12){ i0 = i; break; }
      function inA(p){ return p[1] >= A.T - 0.5 && p[1] <= A.B + 0.5; }
      function edge(a, b){ var yb = b[1] < A.T ? A.T : A.B, t = (yb - a[1]) / (b[1] - a[1]); return [a[0] + (b[0] - a[0]) * t, yb, a[2] + (b[2] - a[2]) * t, A.iy(yb)]; }
      var fwd = [pts[i0]], back = [pts[i0]], fEnd = sol.right.why, bEnd = sol.left.why;
      for(i = i0 + 1; i < pts.length; i++){ if(!inA(pts[i])){ fwd.push(edge(pts[i - 1], pts[i])); fEnd = 'edge'; break; } fwd.push(pts[i]); }
      for(i = i0 - 1; i >= 0; i--){ if(!inA(pts[i])){ back.push(edge(pts[i + 1], pts[i])); bEnd = 'edge'; break; } back.push(pts[i]); }
      return { fwd: fwd, back: back, fEnd: fEnd, bEnd: bEnd, sol: sol };
    }
    function pathD(run){ return 'M' + run.map(function(p){ return r1(p[0]) + ' ' + r1(p[1]); }).join('L'); }
    function exactFn(){ return d.exact ? d.exact(st.x0, st.y0, prm()) : null; }
    function exactPath(){
      var ex = exactFn(); if(!ex) return '';
      var A = G.A, dd = '', pen = false, n = Math.max(120, Math.round(A.W / 2));
      for(var i = 0; i <= n; i++){
        var x = G.view.x[0] + (G.view.x[1] - G.view.x[0]) * i / n;
        var y = x >= ex.lo && x <= ex.hi ? ex.fn(x) : NaN;
        if(!isFinite(y) || y > G.view.y[1] + (G.view.y[1] - G.view.y[0]) || y < G.view.y[0] - (G.view.y[1] - G.view.y[0])){ pen = false; continue; }
        dd += (pen ? 'L' : 'M') + r1(A.sx(x)) + ' ' + r1(A.sy(y)); pen = true;
      }
      return dd;
    }

    /* ---------------------------------------------------- the words */
    function onEq(){ if(kZero()) return true; return d.eq(prm()).some(function(e){ return Math.abs(e - st.y0) < 1e-9; }); }
    function slopeSub(x, y){
      var p = prm(), m = fn.f(x, y);
      if(st.id === 'x+y') return 'y′ = ' + pn(x) + ' + ' + pn(y) + ' ' + eqv(m);
      if(st.id === 'x/y') return 'y′ = ' + clean(x) + ' / ' + pn(y) + ' ' + eqv(m);
      if(st.id === 'xy') return 'y′ = ' + pn(x) + ' · ' + pn(y) + ' ' + eqv(m);
      if(st.id === 'y-2') return 'y′ = ' + clean(y) + ' − 2 ' + eqv(m);
      if(st.id === 'ky') return 'y′ = ' + pn(p.k) + ' · ' + pn(y) + ' ' + eqv(m);
      return 'T′ = −' + clean(p.k) + '(' + clean(y) + ' − ' + clean(p.Ta) + ') ' + eqv(m);
    }
    function heading(m){
      if(Math.abs(m) < 1e-12) return 'level here';
      var a = clean(Math.abs(m));
      if(st.id === 'cool') return (m > 0 ? 'rising ' : 'falling ') + a + ' °C a minute';
      if(st.id === 'ky') return (m > 0 ? 'rising ' : 'falling ') + a + ' per unit of t';
      return 'heading ' + (m > 0 ? 'up ' : 'down ') + a + ' for 1 across';
    }
    function vertEnd(cv){
      var e = [];
      if(cv.fEnd === 'vertical') e.push(cv.fwd[cv.fwd.length - 1][2]);
      if(cv.bEnd === 'vertical') e.push(cv.back[cv.back.length - 1][2]);
      return e;
    }
    function behave(cv){
      var p = prm(), y = st.y0;
      if(onEq()){
        var e = kZero() ? y : d.eq(p).filter(function(v){ return Math.abs(v - y) < 1e-9; })[0];
        if(kZero()) return { t: 'k = 0, so it stays at ' + clean(y), s: 'stays at ' + clean(y), role: 'eq' };
        return { t: 'on ' + yv() + ' = ' + clean(e) + ', so it stays at ' + clean(e), s: 'stays at ' + clean(e), role: 'eq' };
      }
      if(st.id === 'y-2') return { t: (y > 2 ? 'above 2' : 'below 2') + ', so it moves away from 2', s: 'away from 2', role: 'path' };
      if(st.id === 'cool') return { t: (y > p.Ta ? 'above the room, so it falls toward ' : 'below the room, so it rises toward ') + clean(p.Ta), s: (y > p.Ta ? 'falls' : 'rises') + ' toward ' + clean(p.Ta), role: 'path' };
      if(st.id === 'ky') return y > 0 === p.k > 0 ? { t: 'k ' + (p.k > 0 ? '> 0' : '< 0') + ', so it grows: doubles every ' + clean(S.halfLife(p.k)), s: 'doubles every ' + clean(S.halfLife(p.k)), role: 'path' }
        : { t: 'k ' + (p.k > 0 ? '> 0' : '< 0') + ', so it decays: halves every ' + clean(S.halfLife(p.k)), s: 'halves every ' + clean(S.halfLife(p.k)), role: 'path' };
      var ve = vertEnd(cv);
      if(ve.length) return { t: 'vertical at x ≈ ' + ve.map(function(v){ return clean(v); }).join(' and ') + ', so the domain ends', s: 'domain ends', role: 'bad' };
      return null;
    }
    function expo(x0){ return Math.abs(x0) < 1e-9 ? xv() : xv() + (x0 < 0 ? ' + ' : ' − ') + clean(Math.abs(x0)); }
    function coef(c){ return Math.abs(Math.abs(c) - 1) < 1e-9 ? '' : clean(Math.abs(c)); }
    /* the particular solution through the start point, in plain text (null when AB has no formula for it) */
    function formula(){
      var x0 = st.x0, y0 = st.y0, p = prm(), Y = yv();
      if(onEq()) return Y + ' = ' + clean(kZero() ? y0 : d.eq(p).filter(function(v){ return Math.abs(v - y0) < 1e-9; })[0]);
      if(st.id === 'y-2'){ var c = y0 - 2; return 'y = 2 ' + (c < 0 ? '− ' : '+ ') + coef(c) + 'e^(' + expo(x0) + ')'; }
      if(st.id === 'xy') return 'y = ' + (y0 < 0 ? '−' : '') + coef(y0) + 'e^(' + (Math.abs(x0) < 1e-9 ? 'x²/2' : '(x² − ' + clean(x0 * x0) + ')/2') + ')';
      if(st.id === 'ky') return 'y = ' + (y0 < 0 ? '−' : '') + coef(y0) + 'e^(' + clean(p.k) + (Math.abs(x0) < 1e-9 ? 't' : '(' + expo(x0) + ')') + ')';
      if(st.id === 'cool'){ var g = y0 - p.Ta; return 'T = ' + clean(p.Ta) + (g < 0 ? ' − ' : ' + ') + coef(g) + 'e^(−' + clean(p.k) + (Math.abs(x0) < 1e-9 ? 't' : '(' + expo(x0) + ')') + ')'; }
      if(st.id === 'x/y'){
        var Kc = +(y0 * y0 - x0 * x0).toFixed(4);
        if(Math.abs(Kc) < 1e-9) return 'y = ' + ((y0 > 0) === (x0 > 0) ? '' : '−') + 'x';
        return 'y = ' + (y0 < 0 ? '−' : '') + '√(x² ' + (Kc > 0 ? '+ ' : '− ') + clean(Math.abs(Kc)) + ')';
      }
      return null;
    }
    function takeaway(){
      var fm = formula();
      if(onEq()) return 'One starting point, one solution: the flat line ' + fm + '.';
      if(!fm) return 'One starting point, one solution. y′ = x + y is not separable, so this one is traced, not solved.';
      return 'One starting point, one solution: ' + fm + '.';
    }
    function words(cv){
      var n = G && G.W < 600, m = fn.f(st.x0, st.y0), P0 = '(' + clean(st.x0) + ', ' + clean(st.y0) + ')';
      var parts = [{ t: n ? P0 : 'at ' + P0, role: 'pt', say: 'at ' + P0 }, { t: n ? (st.id === 'cool' ? 'T′ ' : 'y′ ') + eqv(m) : slopeSub(st.x0, st.y0), role: 'sl', say: 'the slope is ' + clean(m) }];
      var b = behave(cv);
      if(!n) parts.push({ t: heading(m), role: 'sl' });
      if(b) parts.push({ t: n ? b.s : b.t, role: b.role });
      if(st.took) cause.take(st.took); else cause.set(parts);
    }

    /* ---------------------------------------------------- labels on the picture, placed clear of each other */
    var boxes = [];
    function free(b){ for(var i = 0; i < boxes.length; i++){ var c = boxes[i]; if(b[0] < c[2] + 5 && c[0] < b[2] + 5 && b[1] < c[3] + 5 && c[1] < b[3] + 5) return false; } return true; }
    function inside(b){ var A = G.A; return b[0] >= A.L + 3 && b[2] <= A.R - 3 && b[1] >= A.T + 3 && b[3] <= A.B - 3; }
    function curveHit(b){
      var cv = st.drawn, all = cv ? cv.fwd.concat(cv.back) : [];
      for(var i = 0; i < all.length; i++){ var p = all[i]; if(p[0] > b[0] - 3 && p[0] < b[2] + 3 && p[1] > b[1] - 3 && p[1] < b[3] + 3) return true; }
      return false;
    }
    /* cands: [[x, y, anchor]] (y the baseline); the first that is inside, clear and off the curve; else the first clear */
    function place(text, cls, cands, px){
      px = px || 13; var w = textW(text, px), h = px + 3, pick = null, i, b;
      function boxOf(c){ var x0 = c[2] === 'end' ? c[0] - w : c[2] === 'middle' ? c[0] - w / 2 : c[0]; return [x0 - 2, c[1] - h + 3, x0 + w + 2, c[1] + 4]; }
      for(i = 0; i < cands.length && !pick; i++){ b = boxOf(cands[i]); if(inside(b) && free(b) && !curveHit(b)) pick = cands[i]; }
      for(i = 0; i < cands.length && !pick; i++){ b = boxOf(cands[i]); if(inside(b) && free(b)) pick = cands[i]; }
      if(!pick) return '';
      boxes.push(boxOf(pick));
      return '<text class="sf2-lab ' + cls + '" x="' + r1(pick[0]) + '" y="' + r1(pick[1]) + '" text-anchor="' + (pick[2] || 'start') + '">' + esc(text) + '</text>';
    }
    function blockDom(e, pad){
      if(!e || e.hidden || !e.offsetWidth || e.closest('[hidden]')) return;
      // where it is going, not where a (reduced motion) transition still draws it
      e.style.transition = 'none';
      var r = e.getBoundingClientRect(), sr = scene.getBoundingClientRect(), k = layer.scale() || 1; pad = pad || 0;
      e.style.transition = '';
      boxes.push([(r.left - sr.left) / k - pad, (r.top - sr.top) / k - pad, (r.right - sr.left) / k + pad, (r.bottom - sr.top) / k + pad]);
    }

    /* ---------------------------------------------------- drawing what changes */
    function draw(){
      if(!G) return;
      var A = G.A, cv = solution(), out = [], s0 = startPx();
      st.drawn = cv;
      out.push('<g clip-path="url(#' + nid + '-c)">');
      out.push('<path class="sf2-solh" d="' + pathD(cv.back) + pathD(cv.fwd).replace(/^M/, 'M') + '"/>');
      out.push('<path class="sf2-sol" d="' + pathD(cv.back) + pathD(cv.fwd) + '"/>');
      if(st.exact){ var ep = exactPath(); if(ep) out.push('<path class="sf2-exact' + (st.exactIn ? ' is-in' : '') + '" d="' + ep + '"/>'); }
      out.push('</g>');
      // where the slope turns vertical the solution's domain ends: an open end
      var ends = [];
      if(cv.fEnd === 'vertical') ends.push(cv.fwd[cv.fwd.length - 1]);
      if(cv.bEnd === 'vertical') ends.push(cv.back[cv.back.length - 1]);
      ends.forEach(function(p){ out.push('<circle class="sf2-end" cx="' + r1(p[0]) + '" cy="' + r1(p[1]) + '" r="5"/>'); });
      // growth and decay: where the amount doubles (or halves), forward from the start
      var marks = [];
      if(d.model === 'exp' && !kZero() && Math.abs(st.y0) > 1e-9){
        var Th = S.halfLife(prm().k), up = prm().k > 0;
        for(var k = 1; k <= 4; k++){
          var t = st.x0 + k * Th, yy = st.y0 * Math.pow(up ? 2 : 0.5, k);
          if(t > G.view.x[1] || yy > G.view.y[1] || yy < G.view.y[0] + (G.view.y[1] - G.view.y[0]) * 0.04) break;
          marks.push([A.sx(t), A.sy(yy), up ? '×' + Math.pow(2, k) : '×1/' + Math.pow(2, k)]);
          out.push('<circle class="sf2-mark" cx="' + r1(A.sx(t)) + '" cy="' + r1(A.sy(yy)) + '" r="4.5"/>');
        }
      }
      // the start point (the leaf rests on it)
      out.push('<circle class="sf2-start" cx="' + r1(s0[0]) + '" cy="' + r1(s0[1]) + '" r="4"/>');
      gD.innerHTML = out.join('');
      placeLeaf();
      H.place();
      if(kD) kD.place(kTrack()); if(taD){ taD.place(taTrack()); taD.el.classList.toggle('is-low', prm().Ta < 9); }
      labels(cv, marks, ends);
      words(cv);
      svg.setAttribute('aria-label', 'Slope field of ' + plainEq() + ', drawn as current streaks on a river, with the solution through (' + clean(st.x0) + ', ' + clean(st.y0) + ')' + (st.exact ? ' and the formula ' + (formula() || '') : '') + '.');
    }
    function labels(cv, marks, ends){
      var A = G.A, out = [];
      boxes = [];
      // knobs, their tags, the cue and the chip first: labels keep off them
      [].slice.call(layer.el.querySelectorAll('.tk2-tag:not([hidden]), .tk2-cue, .tk2-chip')).forEach(function(e){ blockDom(e, 2); });
      var nb = boxes.length; [].slice.call(layer.el.querySelectorAll('.tk2-knob')).forEach(function(e){ blockDom(e, 2); });
      var knobBoxes = boxes.slice(nb);
      var s0 = startPx(); boxes.push([s0[0] - 24, s0[1] - 24, s0[0] + 24, s0[1] + 24]);
      if(st.ride){ var lp = st.ride.pos; if(lp) boxes.push([lp[0] - 18, lp[1] - 18, lp[0] + 18, lp[1] + 18]); }
      ends.forEach(function(p){ boxes.push([p[0] - 2.5, p[1] - 2.5, p[0] + 2.5, p[1] + 2.5]); });
      marks.forEach(function(mk){ boxes.push([mk[0] - 1.5, mk[1] - 1.5, mk[0] + 1.5, mk[1] + 1.5]); });
      // the mug (cooling): its temperature is the leaf's
      if(d.model === 'cool') out.push(mugSvg());
      // the calm line
      if(!kZero()) eqList().forEach(function(e){
        var Y = A.sy(e), t = 'equilibrium ' + yv() + ' = ' + clean(e), c = [];
        [0.03, 0.4, 0.7].forEach(function(f){ var X = A.L + 8 + (A.W - 16) * f; c.push([X, Y - 7, 'start'], [X, Y + 17, 'start']); });
        out.push(place(t, 'sf2-ceq', c));
      });
      // the formula's line
      if(st.exact){
        var fm = formula(), ex = exactFn();
        if(fm && ex){
          var c2 = [];
          [0.92, 0.85, 0.78, 0.7, 0.62, 0.55, 0.48, 0.4, 0.33, 0.26, 0.2, 0.14, 0.08, 0.03].forEach(function(f){
            var x = G.view.x[0] + (G.view.x[1] - G.view.x[0]) * f, y = x >= ex.lo && x <= ex.hi ? ex.fn(x) : NaN; if(!isFinite(y)) return;
            var X = A.sx(x), Y = A.sy(y); if(Y < A.T || Y > A.B) return;
            c2.push([X + 8, Y + 18, 'start'], [X - 8, Y - 9, 'end'], [X - 8, Y + 18, 'end'], [X + 8, Y - 9, 'start'], [X + 14, Y + 4, 'start'], [X - 14, Y + 4, 'end'], [X, Y - 12, 'middle'], [X, Y + 22, 'middle']);
          });
          out.push(place(fm, 'sf2-cex', c2));
        }
      }
      marks.forEach(function(mk){ out.push(place(mk[2], 'sf2-cmark', [[mk[0] + 7, mk[1] - 7, 'start'], [mk[0] - 7, mk[1] - 7, 'end'], [mk[0] + 7, mk[1] + 16, 'start'], [mk[0] - 7, mk[1] + 16, 'end']], 12)); });
      ends.forEach(function(p){ out.push(place('domain ends', 'sf2-cbad', [[p[0] + 9, p[1] - 8, 'start'], [p[0] - 9, p[1] - 8, 'end'], [p[0] + 9, p[1] + 18, 'start'], [p[0] - 9, p[1] + 18, 'end'], [p[0] - 12, p[1] + 5, 'end'], [p[0] + 12, p[1] + 5, 'start'], [p[0], p[1] + 24, 'middle'], [p[0], p[1] - 14, 'middle'], [p[0] - 9, p[1] + 34, 'end'], [p[0] + 9, p[1] + 34, 'start']], 12.5)); });
      // the axis names, on the bank
      // the axis names on the banks: x past the last tick (left of a knob that sits there), y turned up the left bank
      var xn = st.id === 'cool' ? 't (min)' : xv(), xw = textW(xn, 13), xe = A.R - 2;
      knobBoxes.forEach(function(b){ if(b[0] < xe + 2 && b[2] > xe - xw - 2 && b[1] < A.B + 24 && b[3] > A.B + 5) xe = Math.min(xe, b[0] - 6); });
      out.push('<text class="sf2-axn" x="' + r1(xe) + '" y="' + (A.B + 19) + '" text-anchor="end">' + esc(xn) + '</text>');
      var yn = st.id === 'cool' ? 'T (°C)' : yv();
      out.push('<text class="sf2-axn" transform="translate(15 ' + r1(A.T + A.H / 2) + ') rotate(-90)" text-anchor="middle">' + esc(yn) + '</text>');
      gT.innerHTML = out.join('');
      // drop a tick number that would touch the x name
      var hid = '';
      (G.tickXs || []).forEach(function(t, i){ if(t[0] + t[1] / 2 > xe - xw - 6 && t[0] - t[1] / 2 < xe + 2) hid += i + ','; });
      if(hid !== G.hid){ G.hid = hid; [].slice.call(gS.querySelectorAll('.sf2-ticks text.is-x')).forEach(function(t, i){ t.style.visibility = (',' + hid).indexOf(',' + i + ',') >= 0 ? 'hidden' : ''; }); }
    }
    /* the mug on the bank: its side reads the temperature where the leaf is drawn */
    function mugSvg(){
      var A = G.A, T = mugT(), y = A.T - 46, hot = cl((T - 20) / 70, 0, 1), s0 = startPx();
      // at the right end of the bank, or left of the leaf's ring (or of a tag) when one is there
      var xs = [A.R - 52, s0[0] - 26 - 58, A.R - 52 - 120, A.L + A.W * 0.5], x = xs[0];
      for(var i = 0; i < xs.length; i++){ if(free([xs[i] - 2, y, xs[i] + 52, y + 38])){ x = xs[i]; break; } }
      boxes.push([x - 2, y, x + 52, y + 38]);
      return '<g class="sf2-mug" transform="translate(' + r1(x) + ' ' + r1(y) + ')"><path class="sf2-mug-h" d="M41 12 q9 0 9 9 t-9 9"/><rect class="sf2-mug-b" x="0" y="4" width="42" height="32" rx="5"/>' +
        '<rect class="sf2-mug-t" x="3" y="7" width="36" height="5" rx="2" style="fill:' + mugColor(hot) + '"/>' +
        '<text class="sf2-lab sf2-cmug" x="21" y="29" text-anchor="middle">' + esc(clean(T, 0) + ' °C') + '</text></g>';
    }
    function mugColor(h){ var a = [92, 140, 200], b = [214, 96, 46]; return 'rgb(' + a.map(function(v, i){ return Math.round(v + (b[i] - v) * h); }).join(',') + ')'; }
    /* the temperature of the drawn leaf: read back from where it is drawn */
    function mugT(){ var p = st.ride && st.ride.pos ? st.ride.pos : startPx(); return G.A.iy(p[1]); }
    function updMug(){
      if(d.model !== 'cool') return;
      var t = gT.querySelector('.sf2-cmug'), tp = gT.querySelector('.sf2-mug-t'); if(!t) return;
      var T = mugT(); t.textContent = clean(T, 0) + ' °C'; tp.style.fill = mugColor(cl((T - 20) / 70, 0, 1));
    }
    function plainEq(){ var p = prm(); return st.id === 'ky' ? 'y′ = ' + clean(p.k) + 'y' : st.id === 'cool' ? 'T′ = −' + clean(p.k) + '(T − ' + p.Ta + ')' : EQS.filter(function(q){ return q.id === st.id; })[0].label; }

    /* ---------------------------------------------------- the leaf */
    function angAt(run, i){
      var a = run[Math.max(0, i - 1)], b = run[Math.min(run.length - 1, i + 1)];
      return Math.atan2(b[1] - a[1], b[0] - a[0]) * 180 / Math.PI;
    }
    function leafAngle(x, y){
      var m = fn.f(x, y);
      if(!isFinite(m)) return -90;
      return Math.atan2(-m * G.ky, G.kx) * 180 / Math.PI;
    }
    function placeLeaf(){
      var s0 = startPx();
      if(st.ride && st.ride.pos){
        var p = st.ride.pos;
        leafE.setAttribute('transform', 'translate(' + r1(p[0]) + ' ' + r1(p[1]) + ') rotate(' + r1(p[2]) + ')');
        leafE.setAttribute('opacity', r1(st.ride.op == null ? 1 : st.ride.op));
        wake.setAttribute('transform', 'translate(' + r1(p[0]) + ' ' + r1(p[1]) + ') rotate(' + r1(p[2]) + ')');
        wake.setAttribute('opacity', st.ride.op == null ? '0.9' : '0');
        leaf2.setAttribute('transform', 'translate(' + r1(s0[0]) + ' ' + r1(s0[1]) + ') rotate(' + r1(leafAngle(st.x0, st.y0)) + ')');
        leaf2.setAttribute('opacity', r1(st.ride.op2 || 0));
      } else {
        leafE.setAttribute('transform', 'translate(' + r1(s0[0]) + ' ' + r1(s0[1]) + ') rotate(' + r1(leafAngle(st.x0, st.y0)) + ')');
        leafE.setAttribute('opacity', '1'); wake.setAttribute('opacity', '0'); leaf2.setAttribute('opacity', '0');
      }
    }
    /* float: the leaf drifts forward along the solution to the edge (about a second), then a new one settles at the start */
    var raf = 0;
    function float(){
      cancelRide();
      if(!G || st.mode !== 'explore' || stage.hidden) return;
      var cv = st.drawn || solution(), run = cv.fwd, len = [0];
      for(var i = 1; i < run.length; i++) len.push(len[i - 1] + Math.hypot(run[i][0] - run[i - 1][0], run[i][1] - run[i - 1][1]));
      var total = len[len.length - 1];
      st.took = null;
      if(K.reduced() || total < 6){ st.took = takeaway(); draw(); say(st.took); refLater(); return; }
      var dur = cl(total / (G.W * 0.55), 0.8, 1.7) * 1000, t0 = performance.now();
      st.ride = { run: run, len: len, total: total, pos: null, t: 0 };
      function at(s){
        var j = 1; while(j < len.length - 1 && len[j] < s) j++;
        var a = run[j - 1], b = run[j], u = len[j] > len[j - 1] ? (s - len[j - 1]) / (len[j] - len[j - 1]) : 0;
        return [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, angAt(run, j)];
      }
      function step(now){
        raf = 0;
        if(!st.ride) return;
        var t = (now - t0) / dur;
        if(t < 1){
          var e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
          st.ride.pos = at(e * total); st.ride.op = null; st.ride.op2 = 0;
        } else {
          var u = cl((now - t0 - dur) / 320, 0, 1);
          st.ride.pos = at(total); st.ride.op = 1 - u; st.ride.op2 = u;
          if(u >= 1){ st.ride = null; st.took = takeaway(); placeLeaf(); updMug(); words(st.drawn); say(st.took); refLater(); return; }
        }
        placeLeaf(); updMug();
        raf = requestAnimationFrame(step);
      }
      raf = requestAnimationFrame(step);
    }
    function cancelRide(){
      if(raf){ cancelAnimationFrame(raf); raf = 0; }
      if(st.ride){
        // the floating leaf fades where it is drawn; the start keeps its own leaf
        var p = st.ride.pos;
        if(p && !K.reduced()){
          var ghost = leafE.cloneNode(true); ghost.classList.add('sf2-fade'); gL.appendChild(ghost);
          var an = ghost.animate ? ghost.animate([{ opacity: +(st.ride.op == null ? 1 : st.ride.op) }, { opacity: 0 }], { duration: 260, easing: 'ease-out' }) : null;
          var gone = function(){ if(ghost.parentNode) ghost.parentNode.removeChild(ghost); };
          if(an) an.onfinish = gone; setTimeout(gone, 400);
        }
        st.ride = null; placeLeaf(); updMug();
      }
    }
    var rideT = 0;
    function floatLater(ms){ clearTimeout(rideT); rideT = setTimeout(float, ms == null ? 260 : ms); }

    /* ---------------------------------------------------- the main control: the leaf (a 2D point on the kit's slider) */
    function valueText(){ var m = fn.f(st.x0, st.y0); return 'Leaf at ' + xv() + ' = ' + clean(st.x0) + ', ' + yv() + ' = ' + clean(st.y0) + '. Slope ' + (isFinite(m) ? clean(m) : 'undefined') + '. ' + (cause.text() || ''); }
    var H = K.handle(layer, { key: KEY, label: 'Leaf: the starting point of the solution', value: enc(st.x0, st.y0), hint: 'Drag',
      at: function(v){ if(!G) return null; var p = dec(v); return [G.A.sx(p[0]), G.A.sy(p[1])]; },
      pick: function(x, y){ if(!G) return null; var p = fit(G.A.ix(x), G.A.iy(y)); return enc(p[0], p[1]); },
      keys: function(v, k, big){
        var p = dec(v), s = snap(), n = big ? 10 : 1, X = p[0], Y = p[1];
        if(k === 'ArrowRight') X += s[0] * n; else if(k === 'ArrowLeft') X -= s[0] * n;
        else if(k === 'ArrowUp') Y += s[1] * n; else if(k === 'ArrowDown') Y -= s[1] * n;
        else if(k === 'PageUp') Y += s[1] * 10; else if(k === 'PageDown') Y -= s[1] * 10;
        else if(k === 'Home') X = G.view.x[0]; else if(k === 'End') X = G.view.x[1];
        else return null;
        var q = fit(X, Y, p[1]); return enc(q[0], q[1]);
      },
      valuetext: function(){ return valueText(); },
      chipSide: function(){ var s0 = startPx(); return s0[1] > G.A.T + 70 ? 'up' : 'down'; },
      onStart: function(){ userActs(); cancelRide(); clearTimeout(rideT); },
      onInput: function(v){ var p = dec(v); st.x0 = p[0]; st.y0 = p[1]; st.took = null; tourDid('drag'); draw(); refLater(); },
      onEnd: function(){ floatLater(H.dragging() ? 0 : 320); } });
    H.el.classList.add('is-ring', 'sf2-h');

    /* presses on the water: the leaf comes to that spot and can be dragged on from there */
    scene.addEventListener('pointerdown', function(e){
      if(!G || e.target.closest('.tk2-knob, .tk2-cue, button, .tk2-drag')) return;
      if(e.pointerType === 'mouse' && e.button !== 0) return;
      var r = scene.getBoundingClientRect(), k = layer.scale() || 1, x = (e.clientX - r.left) / k, y = (e.clientY - r.top) / k, A = G.A;
      if(x < A.L - 4 || x > A.R + 4 || y < A.T - 4 || y > A.B + 4) return;
      hideCue(true); tourDid('tap');
      H.grab(e);
    });
    stage.addEventListener('keydown', function(e){ if(/^(Arrow|Page|Home|End)/.test(e.key)) hideCue(true); }, true);

    /* ---------------------------------------------------- k and the room (quiet knobs on the picture, only for the two models) */
    var kD = null, taD = null;
    // the k knob's tag must stay clear of the mug at the right end of the bank
    function kTrack(){ var A = G.A, x0 = A.L + 26, w = cl(A.R - 150 - x0, 80, G.narrow ? 150 : 220), y = A.T - 26; return [x0, y, x0 + w, y]; }
    function taTrack(){ var A = G.A; return [A.R - 2, A.sy(0), A.R - 2, A.sy(40)]; }
    function mkKnobs(){
      if(kD){ kD.el.remove(); kD = null; } if(taD){ taD.el.remove(); taD = null; }
      if(!G || !hasK()) return;
      var p = prm(), isExp = d.model === 'exp';
      kD = K.drag(layer, { key: KEY + '-k', quiet: true, label: isExp ? 'Growth constant k' : 'Cooling constant k, per minute',
        min: isExp ? -0.5 : 0.02, max: isExp ? 0.5 : 0.2, step: isExp ? 0.05 : 0.01, value: p.k, track: kTrack(),
        valuetext: function(v){ return 'k = ' + clean(v); }, tag: function(v){ return 'k = ' + (isExp ? clean(v) : String(+(+v).toFixed(2))); }, tagSide: 'right',
        onInput: function(v){ userActs(); cancelRide(); p.k = v; fn = S.fns(d, p); st.took = null; drawField(); draw(); refLater(); },
        onEnd: function(){ floatLater(0); } });
      kD.el.classList.add('sf2-k');
      if(!isExp){
        taD = K.drag(layer, { key: KEY + '-ta', quiet: true, label: 'Room temperature, °C', min: 0, max: 40, step: 1, value: p.Ta, track: taTrack(),
          valuetext: function(v){ return 'room ' + v + ' °C'; }, tag: function(v){ return 'room ' + v + ' °C'; }, tagSide: 'left',
          onInput: function(v){ userActs(); cancelRide(); p.Ta = v; fn = S.fns(d, p); st.took = null; drawField(); draw(); refLater(); },
          onEnd: function(){ floatLater(0); } });
        taD.el.classList.add('sf2-ta');
      }
    }

    /* ---------------------------------------------------- a new equation: the streaks cross fade */
    function fadeOut(nodes){
      var g = document.createElementNS(NS, 'g'); g.setAttribute('class', 'sf2-fade');
      nodes.forEach(function(n){ var c = n.cloneNode(true); c.removeAttribute('class'); c.setAttribute('class', n.getAttribute('class')); g.appendChild(c); });
      svg.insertBefore(g, gL);
      var done = function(){ if(g.parentNode) g.parentNode.removeChild(g); };
      var an = g.animate ? g.animate([{ opacity: 1 }, { opacity: 0 }], { duration: K.reduced() ? 220 : 320, easing: 'ease-out' }) : null;
      if(an) an.onfinish = done; setTimeout(done, 520);
    }
    function fadeIn(nodes){ nodes.forEach(function(n){ if(n.animate) n.animate([{ opacity: 0 }, { opacity: 1 }], { duration: K.reduced() ? 220 : 380, easing: 'ease-in' }); }); }
    function setEq(id){
      if(id === st.id) return;
      cancelRide(); clearTimeout(rideT);
      fadeOut([gF, gD]);
      st.id = id; d = S.de(id); fn = S.fns(d, prm()); st.took = null;
      st.x0 = START[id][0]; st.y0 = START[id][1];
      layout(true);
      H.value(enc(st.x0, st.y0));
      draw();
      fadeIn([gF, gD, gS]);
      refLater(); say('Now ' + plainEq() + '. ' + cause.text());
      floatLater(420);
    }
    pick.addEventListener('change', function(){ userActs(); setEq(pick.value); });

    /* ---------------------------------------------------- Check with the formula */
    checkB.addEventListener('click', function(){
      userActs();
      st.exact = !st.exact; checkB.setAttribute('aria-pressed', String(st.exact));
      st.exactIn = st.exact && !K.reduced();
      draw(); tourDid('check');
      var ex = gD.querySelector('.sf2-exact');
      if(ex && st.exactIn && ex.getTotalLength){ var L = ex.getTotalLength(); ex.style.strokeDasharray = L + ' ' + L; ex.style.strokeDashoffset = L; ex.getBoundingClientRect(); ex.style.transition = 'stroke-dashoffset .7s ease-out'; ex.style.strokeDashoffset = '0'; setTimeout(function(){ ex.style.strokeDasharray = ''; ex.style.strokeDashoffset = ''; ex.style.transition = ''; st.exactIn = false; }, 760); }
      else st.exactIn = false;
      if(!st.exact && !K.reduced()){ /* nothing to fade: the line goes with the next frame */ }
      say(st.exact ? (formula() ? 'The formula ' + formula() + ' is drawn: it sits on the traced curve.' : 'This equation has no AB formula: it is traced only.') : 'Formula hidden.');
      refLater();
    });

    /* ---------------------------------------------------- the cue and "Show me how" */
    var touched = false;
    function userActs(){ if(!touched){ touched = true; hideCue(true); } }
    var cueO = { key: KEY, text: 'Drag the leaf', side: 'right',
      at: function(){ if(!G) return [0, 0]; var s0 = startPx(); return cueO.side === 'right' ? [s0[0] + 26, s0[1]] : cueO.side === 'left' ? [s0[0] - 26, s0[1]] : [s0[0], s0[1] + 26]; } };
    var cue = K.cue(layer, cueO);
    function cueShow(){ if(!G) return; var s0 = startPx(); cueO.side = G.A.R - s0[0] > 170 ? 'right' : 'left'; if(cue.show()){ draw(); draw(); } }
    function hideCue(used){ if(cue.active()){ cue.hide(used); if(G) draw(); } }
    var tour = K.tour({ key: KEY, label: 'Show me how', steps: [
      { id: 'drag', text: 'Drag the leaf. The solution through it follows the streaks both ways.', target: function(){ return H.knob; } },
      { id: 'tap', text: 'Or tap the water: the leaf starts there, and the line below works out the slope.', target: function(){ return scene; } },
      { id: 'check', text: 'Check with the formula draws the exact solution through your point.', target: function(){ return checkB; } }],
      onClose: function(had){ if(had) try{ head.how.focus({ preventScroll: true }); }catch(e){} } });
    function tourDid(x){ if(tour.active()) tour.did(x); }
    function startTour(){ if(st.mode !== 'explore') return; hideCue(false); tour.start(true); }

    /* ---------------------------------------------------- "?": the numbers, the separation, why */
    var ref = el('div', 'ls-sec sf2-ref'), refT = null;
    function refLater(){ clearTimeout(refT); refT = setTimeout(refHtml, H.dragging() || st.ride ? 300 : 60); }
    function eqTex(){
      var p = prm();
      if(st.id === 'ky') return '\\frac{dy}{dt} = ' + String(+p.k.toFixed(2)) + 'y';
      if(st.id === 'cool') return '\\frac{dT}{dt} = -' + String(+p.k.toFixed(2)) + '(T - ' + p.Ta + ')';
      return '\\frac{dy}{dx} = ' + d.tex;
    }
    function refHtml(){
      if(!G) return;
      var cv = st.drawn || solution(), m = fn.f(st.x0, st.y0), v2 = fn.f2(st.x0, st.y0), X = xv(), Y = yv(), P0 = '(' + clean(st.x0) + ', ' + clean(st.y0) + ')';
      var eqs = d.eq(prm()), on = onEq(), ve = vertEnd(cv), fm = formula();
      var row = function(k, v){ return '<tr><th scope="row">' + k + '</th><td class="r">' + v + '</td></tr>'; };
      var html = '<p class="sf2-howref"><button type="button" class="tk2-how" data-how>Show me how</button> to use it, step by step.</p>' +
        '<h3 class="ls-title-l">' + esc(EQS.filter(function(q){ return q.id === st.id; })[0].label) + '</h3>' + tex(eqTex(), { display: true });
      var rows = row('Starting point', esc(P0)) + row('Slope there', esc(isFinite(m) ? slopeSub(st.x0, st.y0).replace(/^[yT]′ = /, '') : 'undefined')) +
        row('Second derivative', isFinite(v2) ? tex('\\frac{d^2' + Y + '}{d' + X + '^2} = ' + (st.id === 'ky' ? 'k^2 y' : st.id === 'cool' ? 'k^2(T - T_a)' : d.f2tex)) + ' = ' + clean(v2, 3) + (on ? '' : v2 > 0 ? ', concave up' : v2 < 0 ? ', concave down' : '') : 'undefined') +
        row('Curve drawn from', esc(X + ' = ' + clean(cv.back[cv.back.length - 1][2], 3) + (cv.bEnd === 'vertical' ? ' (vertical slope)' : ' (edge)'))) +
        row('Curve drawn to', esc(X + ' = ' + clean(cv.fwd[cv.fwd.length - 1][2], 3) + (cv.fEnd === 'vertical' ? ' (vertical slope)' : ' (edge)')));
      if(st.id === 'ky') rows += row('k', clean(prm().k)) + (prm().k ? row(prm().k > 0 ? 'Doubling time' : 'Half-life', esc('ln 2 / ' + clean(Math.abs(prm().k)) + ' ≈ ' + clean(S.halfLife(prm().k), 3))) : '');
      if(st.id === 'cool') rows += row('k, room', esc(clean(prm().k) + ' per minute, ' + prm().Ta + ' °C')) + row('The gap halves every', esc(clean(S.halfLife(prm().k), 2) + ' min'));
      html += '<h3 class="ls-title-l">Your starting point</h3><table class="ls-tbl sf2-nums"><caption class="sr-only">The starting point and its solution</caption><tbody>' + rows + '</tbody></table>';
      if(d.sep){
        var L = S.steps(st.id, st.x0, st.y0, prm());
        html += '<h3 class="ls-title-l">Solve it: separation of variables through ' + esc(P0) + '</h3><ol class="ls-steps sf-sep">' + L.map(function(l){ return '<li><div class="sf-sepi"><span>' + html2(l[0]) + '</span>' + (l[1] ? '<span class="sf-sepm">' + tex(l[1], { display: true }) + '</span>' : '') + '</div></li>'; }).join('') + '</ol>';
      } else html += '<h3 class="ls-title-l">Solving it</h3><p>' + html2(d.note || 'Not separable.') + '</p>';
      html += '<h3 class="ls-title-l">Why the curve does this</h3>' +
        '<p>Each streak is drawn with the slope ' + tex('\\frac{d' + Y + '}{d' + X + '}') + ' at its center. A solution has exactly that slope wherever it goes, so it runs along the streaks: from ' + esc(P0) + ' it leaves with slope ' + (isFinite(m) ? clean(m) : 'undefined') + '. The leaf floats forward (to the right, as ' + X + ' grows); the curve is drawn both ways from your point.</p>' +
        (eqs.length && !kZero() ? '<p>' + esc(Y + ' = ' + eqs.map(function(v){ return clean(v); }).join(', ')) + ' is an equilibrium solution (every streak on it is flat), drawn as the calm line. Two solution curves never cross, so a solution above it stays above and one below stays below.' +
          (st.id === 'y-2' ? ' Here solutions move away from it on both sides (an unstable equilibrium).' : st.id === 'cool' ? ' Here solutions move toward it on both sides (a stable equilibrium): the coffee ends at room temperature.' : st.id === 'ky' ? (prm().k > 0 ? ' With k > 0 solutions move away from it.' : ' With k < 0 solutions move toward it.') : '') + '</p>' : '') +
        (kZero() ? '<p>With k = 0 the slope is 0 everywhere: every horizontal line is a solution.</p>' : '') +
        (ve.length ? '<p>A solution is a function of ' + X + ', so it cannot turn back. Where the slope becomes vertical (on ' + esc(d.undefinedOn || '') + ', where ' + tex('\\frac{dy}{dx}') + ' is undefined), the solution\'s domain ends: the open circle.</p>' : '') +
        (st.id === 'ky' && !kZero() ? '<p>The dots mark where the amount is ×2, ×4, … (or ×1/2, ×1/4, …) of the start: every ' + clean(S.halfLife(prm().k), 2) + ' units of time.</p>' : '') +
        (st.id === 'cool' ? '<p>The mug on the bank shows the temperature where the leaf is: it follows the leaf as it floats.</p>' : '') +
        '<h3 class="ls-title-l">Check with the formula</h3><p>' + (fm ? 'The particular solution through your point is ' + esc(fm) + '. "Check with the formula" draws it as a thin purple line: it sits on the traced curve to the pixel.' : 'This equation is not separable, so AB has no formula for it; the curve is traced numerically. "Check with the formula" draws the exact solution from outside AB (y = Ce^x − x − 1) to show they agree.') + '</p>' +
        '<p class="bt-small">How it is drawn: the water is the exact grid. Each streak has the same length on screen; their spacing is set by the size of your screen (about one every 44 px). The solution is traced numerically (an adaptive Runge-Kutta method, accurate to many decimal places) forward and backward from the point and stops at the edge of the water or where the slope turns vertical.' + (hasK() ? ' Drag the small knob on the bank to change k' + (st.id === 'cool' ? ', and the knob on the right edge to change the room temperature' : '') + '.' : '') + '</p>' +
        '<details class="sf2-keys"><summary>Keyboard</summary><p class="bt-small">Tab to the leaf. Arrow keys move it one grid step (0.1' + (st.id === 'cool' ? ', 1 minute or 1 °C' : '') + '), Shift ten steps; Page Up and Page Down move it ten steps up or down; Home and End move it to the left and right edges. The leaf floats once you stop.</p></details>' +
        '<p class="tool-about-n">Notes for this topic: <a href="../notes/sketching-slope-fields.html">Sketching slope fields</a>, <a href="../notes/reasoning-with-slope-fields.html">Reasoning with slope fields</a>, <a href="../notes/' + (st.id === 'ky' ? 'exponential-models' : st.id === 'cool' ? 'modeling-with-des' : 'separation-of-variables') + '.html">' + (st.id === 'ky' ? 'Exponential models' : st.id === 'cool' ? 'Modeling with differential equations' : 'Separation of variables') + '</a></p>';
      ref.innerHTML = html;
    }
    function html2(s){ return window.ApCalcTex ? window.ApCalcTex.html(s) : esc(s); }
    ref.addEventListener('click', function(e){ var b = e.target.closest('[data-how]'); if(!b) return; if(LS) LS.close(); setTimeout(startTour, 60); });

    /* ---------------------------------------------------- layout */
    var lastWH = '';
    function layout(force){
      if(stage.hidden || !stage.isConnected) return;
      var r = scene.getBoundingClientRect(), W = Math.round(r.width), Hh = Math.round(r.height);
      if(W < 200 || Hh < 200) return;
      if(!force && W + 'x' + Hh === lastWH && G) return;
      svg.setAttribute('viewBox', '0 0 ' + W + ' ' + Hh); svg.setAttribute('width', W); svg.setAttribute('height', Hh);
      G = geo(W, Hh); lastWH = W + 'x' + Hh;
      // the start point stays inside the (maybe narrower) window
      var p = fit(st.x0, st.y0); st.x0 = p[0]; st.y0 = p[1];
      mkKnobs();
      drawStatic(); drawField();
      H.value(enc(st.x0, st.y0));
      draw(); draw();
      if(cue.active()) cue.place();
    }
    if(window.ResizeObserver){ var rt = 0; new ResizeObserver(function(){ var r = scene.getBoundingClientRect(); if(Math.round(r.width) + 'x' + Math.round(r.height) === lastWH) return; cancelAnimationFrame(rt); rt = requestAnimationFrame(function(){ cancelRide(); layout(); }); }).observe(scene); }
    else window.addEventListener('resize', function(){ layout(); });

    function boot(){
      st.ready = true;
      head.purpose('A solution follows the slope at every point.');
      layout(true); refHtml();
      setTimeout(function(){ layout(true); refHtml(); if(st.mode === 'explore' && !tour.active()) cueShow(); }, 60);
    }
    function stopAll(){ cancelRide(); clearTimeout(rideT); tour.stop(); if(cue.active()) cue.hide(false); }
    function shown(m){
      st.mode = m;
      if(m !== 'explore'){ stopAll(); return; }
      setTimeout(function(){ layout(true); if(!tour.active()) cueShow(); }, 40);
    }
    return {
      kit2: function(pane, s){ LS = s; boot(); return { stage: stage, ref: ref }; },
      plain: function(){ host.appendChild(stage); host.appendChild(ref); boot(); },
      shown: shown, stop: stopAll, redraw: function(){ layout(true); },
      // for the sweep and the browser checks only: window.ApCalcSlopeFields exists only when a test sets
      // window.LevlToolTest before the page loads (never in production)
      _t: { st: st, G: function(){ return G; }, H: H, cause: cause, params: params, formula: formula, takeaway: takeaway, exactFn: exactFn,
        setEq: function(id){ pick.value = id; pick.dispatchEvent(new Event('change')); },
        set: function(x, y, ride){ clearTimeout(rideT); cancelRide(); var p = fit(x, y); H.value(enc(p[0], p[1]), true); if(ride) float(); },
        setK: function(v){ clearTimeout(rideT); if(kD){ kD.value(v, true); } }, setTa: function(v){ clearTimeout(rideT); if(taD){ taD.value(v, true); } },
        check: function(){ checkB.click(); }, float: float, riding: function(){ return !!st.ride; }, kD: function(){ return kD; }, taD: function(){ return taD; } }
    };
  }

  /* ========================================================= mount */
  function boot(){
    T.mount('slope-fields', function(app, data){
      var ex = null, kit = !!(window.LevlKit2 && window.LevlStudio && app.getAttribute('data-studio'));
      var md = T.modes(app, { slug: 'slope-fields', labels: ['Explore', 'Test yourself'],
        explore: function(h){ ex = explore(h, data); if(window.LevlToolTest) window.ApCalcSlopeFields = ex._t; },
        quiz: function(h){ quiz(h, data); },
        onShow: function(m){
          if(ex) ex.shown(m);
          setTimeout(function(){ if(m === 'explore' && ex) ex.redraw(); }, 30);
        },
        studio: kit ? { kit2: function(pane, s){ return ex.kit2(pane, s); } } : {} });
      if(!kit || !T.studioOf(app)) ex.plain();
      return md;
    });
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
      extra: function(el, p, api){ QM.clear(); QM.last = {}; QM.F = null; QM.svgEl = null; api.fig = figure(el, p, api); },
      onStep: function(s, right, api){ if(api.fig && api.fig.after) api.fig.after(s, right); },
      method: function(s){ return SMETHOD[s.key] || ''; },
      onTry: function(s, t, api){ return sfTry(s, t, api.problem); }
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
    var F = P.frame(spec);
    el.innerHTML = '<figure class="cd-fig sf-qfig">' + P.svg(spec).replace('</svg>', (extra || '') + '<g class="sf-dyn"></g><g class="sf-tries">' + QM.svg(F) + '</g></svg>') + '</figure>';
    QM.F = F; QM.svgEl = el.querySelector('svg');
    return { svg: el.querySelector('svg'), F: F, dyn: el.querySelector('.sf-dyn') };
  }
  /* Test yourself is visual (docs/tool-audit-2026-10.md X1): each try is
     drawn on the figure in place (no full redraw, so drag handles keep
     their state), the student's answer dashed, the right one solid. */
  var QM = T.tries();
  function qmPaint(){ if(QM.svgEl && QM.F){ var g = QM.svgEl.querySelector('.sf-tries'); if(g) g.innerHTML = QM.svg(QM.F); } }
  var SMETHOD = {
    sl1: 'Put the point\'s x and y into dy/dx: the number you get is the slope of the segment there.',
    sl2: 'Put the point\'s x and y into dy/dx. A negative slope tilts down to the right.',
    iso: 'Set dy/dx = 0 and solve: every point on that line or curve has a flat segment.',
    mf: 'Test easy points: where is dy/dx zero, where is it positive, and does it change along a row or a column?',
    mfeat: 'Name what the equation predicts and where you see it: the zero-slope line, or slopes that depend only on x or only on y.',
    skm: 'Put the starting point into dy/dx.',
    sk: 'Start at the point and follow the segments: your curve should be tangent to every segment it passes.',
    skfar: 'Follow the segments far to the right: does the curve level off at a line where dy/dx = 0?',
    sep: 'Get every y (with dy) on one side and every x (with dx) on the other.',
    int: 'Integrate term by term and add + C (once, on one side).',
    sepC: 'Put the initial condition into the integrated equation and solve for C.',
    sepY: 'Solve for y, and keep the branch (sign) that passes through the initial point.',
    d2: 'Differentiate dy/dx with respect to x; every y gives a dy/dx factor, which you replace by the given formula.',
    d2v: 'Put the point into your second derivative.',
    conc: 'A negative second derivative means concave down, so the tangent line is above the curve (an overestimate).',
    expde: 'A rate proportional to the amount is dy/dt = ky.',
    expk: 'Use y(T) = y(0)e^(kT): divide, take ln, divide by T.',
    expy: 'Put t into y = y(0)e^(kt).',
    expt: 'Set y(0)e^(kt) equal to the target, take ln, and solve for t.'
  };
  function sfTry(s, t, p){
    var g = p.fig, who = t.ok || t.shown ? 'right' : 'yours', mk = [], N = T.numText, k = s.key;
    var val = who === 'right' && s.kind === 'num' ? s.cell.answer : t.value;
    if(/^sl\d$/.test(k) && g.marks && isFinite(val)){
      var m = g.marks.filter(function(q){ return q.step === k; })[0];
      if(m) mk.push({ tangent: m.at, slope: val, half: 0.55, who: who, label: (who === 'yours' ? 'yours: slope ' : 'slope ') + N(val) });
    } else if(k === 'skm' && isFinite(val)){
      mk.push({ tangent: [g.x0, g.y0], slope: val, half: 0.55, who: who, label: (who === 'yours' ? 'yours: slope ' : 'slope ') + N(val) });
    } else if(k === 'd2v' && isFinite(val) && g.tangent){
      mk.push({ label: (who === 'yours' ? 'yours: ' : '') + 'd²y/dx² = ' + N(val) + (who === 'right' ? (val < 0 ? ', concave down' : val > 0 ? ', concave up' : '') : ''), at: [g.tangent.at[0], g.tangent.at[1]], who: who, anchor: 'middle' });
    } else if(k === 'sepY' && t.fn){
      mk.push({ curve: t.fn, who: who, label: who === 'yours' ? 'yours' : '' });
    } else if(k === 'sepC' && g.kind === 'solution' && isFinite(val)){
      return false;
    } else if((k === 'expk' || k === 'expy' || k === 'expt') && g.kind === 'exp' && isFinite(val)){
      if(k === 'expk'){ var kk = val; mk.push({ curve: function(x){ return g.y0 * Math.exp(kk * x); }, who: who, label: who === 'yours' ? 'yours: k = ' + N(kk) : '' }); }
      if(k === 'expy') mk.push({ point: [g.t1, val], who: who, label: (who === 'yours' ? 'yours: ' : '') + N(val) });
      if(k === 'expt') mk.push({ vline: val, who: who, label: (who === 'yours' ? 'yours: t = ' : 't = ') + N(val) });
    } else if(k === 'mf' && s.kind === 'choice' && t.pick > -1){
      // the picked field: outlined dashed while wrong (the right one is outlined by the tool once done)
      document.querySelectorAll('.sf-mfig').forEach(function(f){ f.classList.toggle('is-pick', who === 'yours' && +f.getAttribute('data-i') === t.pick); });
      return who === 'yours';
    } else return false;
    if(!mk.length) return false;
    if(who === 'yours') QM.last[k] = mk; else if(QM.last[k]) mk = QM.last[k].concat(mk);
    QM.set(k, mk); qmPaint();
    return true;
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
      // equal units across and up: a slope of 1 is drawn at 45 degrees
      w = h = Math.min(w, h);
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
      fieldSvg(f2(s), view, F, Math.min(w, h) < 90 ? 7 : Math.min(w, h) < 140 ? 9 : Math.min(w, h) < 240 ? 11 : 13) + '</svg>';
  }
  function phone(el){ var r = el && el.closest && el.closest('.ls-root'); return !!(r && r.classList.contains('ls-phone')) || window.innerWidth <= 640; }
  /* The four fields as a 2 by 2 grid of squares, as big as the stage
     allows (on a phone each is about 160 px or more, and the corner under
     the Enlarge button is left free when that costs little). */
  function matchFig(el, p){
    var g = p.fig, view = g.view, key = false;
    sized(el, function(w, h){
      var st = el.closest && el.closest('.ls-drill-stage'), ph = phone(el), gap = 8, box = 12, cap = 22;
      var side = Math.floor((w - gap) / 2) - box;
      if(st && h > 0){
        var fitH = Math.floor((h - gap) / 2) - box - cap, clear = Math.floor((h - 44 - gap) / 2) - box - cap;
        side = Math.min(side, ph && clear >= 156 ? clear : fitH);
      }
      side = Math.max(110, side);
      el.innerHTML = '<div class="sf-match" style="grid-template-columns:repeat(2,' + (side + box) + 'px)">' + g.des.map(function(s, i){
        return '<figure class="sf-mfig' + (key && i === g.answer ? ' is-key' : '') + '" data-i="' + i + '"><figcaption>Field ' + (i + 1) + '</figcaption>' + thumb(s, view, side, side, 'Field ' + (i + 1) + ': a slope field on the square from minus 3 to 3') + '</figure>';
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
      w = h = Math.min(w, h);
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
      // on a phone the bottom strip stays clear for the Enlarge button
      var ph = phone(el) && !!(el.closest && el.closest('.ls-drill-stage'));
      if(ph) h = Math.max(150, h - 40);
      var spec = { label: 'Graph of the amount against time, with the given data points', width: w, height: h, x: [0, tMax], y: [0, yMax], xLabel: 't (' + g.unit + ')', yLabel: 'y' };
      var F0 = P.frame(spec), y2 = g.grow ? 2 * g.y0 : g.y0 / 2;
      var pts = '<circle class="sf-qmark" cx="' + r2(F0.sx(0)) + '" cy="' + r2(F0.sy(g.y0)) + '" r="6"/><text class="sf-qlab" x="' + r2(F0.sx(0) + 9) + '" y="' + r2(F0.sy(g.y0) - 9) + '">(0, ' + g.y0 + ')</text>' +
        '<circle class="sf-qmark" cx="' + r2(F0.sx(g.T)) + '" cy="' + r2(F0.sy(y2)) + '" r="6"/><text class="sf-qlab" x="' + r2(F0.sx(g.T) + 9) + '" y="' + r2(F0.sy(y2) - 9) + '">(' + g.T + ', ' + clean(y2) + ')</text>';
      B = plotBox(el, spec, pts);
      // 4- and 5-digit tick numbers as 2k, 10k, so they fit the left margin
      Array.prototype.forEach.call(B.svg.querySelectorAll('text'), function(t){ if(/^\d{4,}$/.test(t.textContent)) t.textContent = (+t.textContent / 1000) + 'k'; });
      overlay();
      var fg = el.querySelector('.sf-qfig'); if(fg) fg.classList.toggle('is-clear', ph);
    }, 0.75);
    return { after: function(s){ done.push(s.key); overlay(); } };
  }
  /* The page loads the kit (pages.json "kit2": true). A cached copy of the old page would not: fetch it then. */
  if(window.LevlKit2) boot();
  else {
    var up = (window.ApCalcBase || '../') + '../assets/course/';
    var l = document.createElement('link'); l.rel = 'stylesheet'; l.href = up + 'tool-kit2.css'; document.head.appendChild(l);
    var sc = document.createElement('script'); sc.src = up + 'tool-kit2.js'; sc.onload = boot; sc.onerror = boot; document.head.appendChild(sc);
  }
})();
