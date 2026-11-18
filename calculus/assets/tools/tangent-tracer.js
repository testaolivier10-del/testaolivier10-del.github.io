/* Tangent tracer, tools v2 (docs/tools-v2-tangent-tracer-brief.md; the standard: docs/tools-v2-standard.md). The
   first AP® Calculus AB tool on the shared kit (assets/course/tool-kit2.js), through the course adapter
   ApCalcTools.studioKit2, and the first graph explorer: its points are K.handle. OWNED BY THIS TOOL ONLY. The model
   is ApCalcMath.tangentTracer (calculus/assets/tools/math/tangent-tracer.js); curves are sampled with ApCalcPlot
   (calc-plot.js), math is ApCalcTex (calc-math.js). Styles: tangent-tracer.css.

   EXPLORE (free play, nothing graded, no side panel): two tabs, one idea each.
     1 Slope at a point: the curve is a road (its centre line IS y = f(x) on the graph's grid). Drag P along it: a car
       turned to the tangent, the tangent line and the heading arrow, the rise over a run of 1 (or less), the slope
       on P's knob; below, on graph paper with the same x, a pen draws f′ wherever P has been and an orange bar is
       the slope now. At a corner, cusp, vertical tangent, jump or end the one-sided directions are drawn, the pen
       lifts and the cause line says why f′ does not exist. "Drive across" draws all of f′.
     2 Secant to tangent: drag Q toward P from either side; the secant (purple) turns into the tangent (orange); a
       magnifier keeps Q halfway out from P as h shrinks (its zoom follows h), and Q's knob moves into it. "Slide Q
       in" takes h to 0.001.
     The cause line (K.cause) says why, live; the curve picker sits by "Show me how"; "?" holds the numbers at P, the
     table of secant slopes, the limit with the numbers, the formulas, your own typed curve and the keys.
     Colours: the road and f in ink, the slope and the tangent orange (s4), f′ blue (s2), the secant purple (s5),
     "does not exist" in the warning red.

   TEST YOURSELF (unchanged): seeded problems from tangentTracer.generate (six kinds: estimate f′(a) from a tangent
   line; a difference quotient from a table with units; which graph is f′; SKETCH f′ from f, graded point by point
   with named misses; write the tangent line, typed and drawn live on the graph; where f is not differentiable and
   why), on the shared drill (ApCalcTools.drill: one step at a time, method hint, Show the answer); the figure on the
   stage shows each try, first tries recorded as tangent-tracer:<context>:<step>. */
(function(){
  'use strict';
  var T = window.ApCalcTools, M = window.ApCalcMath, P = window.ApCalcPlot;
  if(!T || !M || !M.tangentTracer || !P) return;
  var TT = M.tangentTracer, esc = T.esc, SLUG = 'tangent-tracer', NS = 'http://www.w3.org/2000/svg';
  var uid = 0;

  /* ----------------------------------------------------------- helpers */
  function TX(){ return window.ApCalcTex; }
  // A minus that starts a number after "=", "(", "," or a relation reads as
  // a sign, not a subtraction: group it ({-2}) before rendering.
  function unary(t){ return String(t).replace(/(^|[=(,<>]\s*|\\(?:approx|le|ge|ne)\s*)-(\d+(?:\.\d+)?)/g, '$1{-$2}'); }
  function tx(s){
    if(!TX()) return esc(s);
    var h = TX().html(String(s).replace(/\$([^$]+)\$/g, function(m, t){ return '$' + unary(t) + '$'; }));
    // Keep a formula and the punctuation after it on one line.
    return h.replace(/(<math\b(?:(?!<math\b)[\s\S])*?<\/math>)([.,;:?!)]+)/g, '<span class="tt-nw">$1$2</span>');
  }
  function mm(t, d){ return TX() ? TX().render(unary(t), { display: !!d }) : esc(t); } // one formula
  function plain(s){ return TX() ? TX().plain(s) : String(s); }
  function n(v){ return TT.n(v); }
  function F3(v){ return isFinite(v) ? T.F(v, 3) : v > 0 ? '∞' : v < 0 ? '−∞' : '—'; }
  function sv(v){ var s = n(v); return s.charAt(0) === '-' ? '−' + s.slice(1) : s; }  // a short value, real minus
  // A value in TeX; a negative one is grouped, so it reads "≈ −1", not "≈ − 1".
  function texN(v){ return isFinite(v) ? (v < 0 ? '{' + n(M.round(v, 3)) + '}' : n(M.round(v, 3))) : v > 0 ? '\\infty' : '{-\\infty}'; }
  function paren(v){ return v < 0 ? '(' + n(M.round(v, 3)) + ')' : texN(v); }
  function r1(v){ return Math.round(v * 10) / 10; }
  function el(tag, cls, html){ var e = document.createElement(tag); if(cls) e.className = cls; if(html != null) e.innerHTML = html; return e; }

  /* Redraw an svg at the pixel size of its box, so text and strokes keep
     their size from a phone to a desktop. */
  function fit(box, draw){
    var last = '';
    function go(force){
      var w = Math.round(box.clientWidth), h = Math.round(box.clientHeight);
      if(w < 60 || h < 60) return;
      var k = w + 'x' + h;
      if(k === last && !force) return;
      last = k; draw(w, h);
    }
    try{ if(window.ResizeObserver) new ResizeObserver(function(){ go(); }).observe(box); }catch(e){}
    window.addEventListener('resize', function(){ go(); });
    go();
    return { redraw: function(){ go(true); }, size: function(){ return [box.clientWidth, box.clientHeight]; } };
  }

  /* A panel: a pixel rectangle and its x and y windows. */
  function frameOf(x, y, L, Tp, W, H){
    return { x: x, y: y, L: L, T: Tp, R: L + W, B: Tp + H, W: W, H: H,
      sx: function(v){ return L + (v - x[0]) / (x[1] - x[0]) * W; },
      sy: function(v){ return Tp + (y[1] - v) / (y[1] - y[0]) * H; },
      ix: function(px){ return x[0] + (px - L) / W * (x[1] - x[0]); },
      iy: function(py){ return y[1] - (py - Tp) / H * (y[1] - y[0]); } };
  }
  function pathOf(runs, F){ return runs.map(function(r){ return 'M' + r.map(function(p){ return r1(F.sx(p[0])) + ' ' + r1(F.sy(p[1])); }).join('L'); }).join(''); }
  function curvePath(f, F, a, b, cls, extra){
    a = Math.max(a == null ? F.x[0] : a, F.x[0]); b = Math.min(b == null ? F.x[1] : b, F.x[1]);
    if(!(b > a)) return '';
    var runs = P.sample(f, a, b, F, Math.max(60, Math.round((F.sx(b) - F.sx(a)) * 1.5)));
    return runs.length ? '<path class="calc-plot-curve ' + cls + '"' + (extra || '') + ' d="' + pathOf(runs, F) + '"/>' : '';
  }
  function piLabel(v){
    var k = Math.round(v / (Math.PI / 2));
    if(k === 0) return '0';
    var num = k % 2 === 0 ? k / 2 : k, den = k % 2 === 0 ? 1 : 2, s = (num < 0 ? '−' : '') + (Math.abs(num) === 1 ? '' : Math.abs(num)) + 'π';
    return den === 1 ? s : s + '/2';
  }
  function tickLabel(v){ var s = String(+v.toPrecision(6)); return s.replace('-', '−'); }
  /* Grid, axes and tick labels of a panel. */
  function axesOf(F, o){
    o = o || {};
    var nx = Math.max(3, Math.round(F.W / 64)), ny = Math.max(3, Math.round(F.H / 42));
    var xt = o.piX && (F.x[1] - F.x[0]) > 3 ? P.piTicks(F.x[0], F.x[1]) : P.ticks(F.x[0], F.x[1], nx);
    var yt = P.ticks(F.y[0], F.y[1], ny);
    // A window like [-4, 4] would get a step of 5 and one tick: ask for more.
    for(var k0 = ny + 1; yt.length < 3 && k0 < 12; k0++) yt = P.ticks(F.y[0], F.y[1], k0);
    for(var k1 = nx + 1; xt.length < 3 && k1 < 14 && !o.piX; k1++) xt = P.ticks(F.x[0], F.x[1], k1);
    if(o.piX && xt.length > nx + 2) xt = xt.filter(function(v){ return Math.abs(Math.round(v / Math.PI) * Math.PI - v) < 1e-9; });
    var ax = F.y[0] <= 0 && F.y[1] >= 0 ? F.sy(0) : F.B, ay = F.x[0] <= 0 && F.x[1] >= 0 ? F.sx(0) : F.L, out = [];
    out.push('<g class="calc-plot-grid">' + xt.map(function(v){ var p = r1(F.sx(v)); return '<line x1="' + p + '" y1="' + F.T + '" x2="' + p + '" y2="' + F.B + '"/>'; }).join('') +
      yt.map(function(v){ var p = r1(F.sy(v)); return '<line x1="' + F.L + '" y1="' + p + '" x2="' + F.R + '" y2="' + p + '"/>'; }).join('') + '</g>');
    out.push('<rect class="tt-frame" x="' + F.L + '" y="' + F.T + '" width="' + r1(F.W) + '" height="' + r1(F.H) + '"/>');
    out.push('<g class="calc-plot-axis"><line x1="' + F.L + '" y1="' + r1(ax) + '" x2="' + F.R + '" y2="' + r1(ax) + '"/><line x1="' + r1(ay) + '" y1="' + F.T + '" x2="' + r1(ay) + '" y2="' + F.B + '"/></g>');
    var lab = [], lx = o.piX && (F.x[1] - F.x[0]) > 3 ? piLabel : tickLabel;
    // Labels sit outside the frame (below it, left of it), so a curve never
    // runs through them; short ticks on the frame mark them.
    xt.forEach(function(v){ var px = F.sx(v); if(px < F.L - 0.5 || px > F.R + 0.5) return; lab.push('<text x="' + r1(px) + '" y="' + r1(F.B + 13) + '" text-anchor="middle">' + lx(v) + '</text>'); });
    yt.forEach(function(v){ var py = F.sy(v); if(py < F.T - 0.5 || py > F.B + 0.5) return; lab.push('<text x="' + r1(F.L - 5) + '" y="' + r1(py + 4) + '" text-anchor="end">' + tickLabel(v) + '</text>'); });
    out.push('<g class="calc-plot-ticks tt-ticks">' + lab.join('') + '</g>');
    return out.join('');
  }
  function clipDef(id, F){ return '<clipPath id="' + id + '"><rect x="' + F.L + '" y="' + F.T + '" width="' + r1(F.W) + '" height="' + r1(F.H) + '"/></clipPath>'; }
  function dot(F, x, y, cls, r, open){ return '<circle class="tt-dot ' + cls + (open ? ' is-open' : '') + '" cx="' + r1(F.sx(x)) + '" cy="' + r1(F.sy(y)) + '" r="' + (r || 4.5) + '"/>'; }
  function lineAcross(F, x0, y0, m, cls, extra, lo, hi){
    lo = lo == null ? F.x[0] : Math.max(lo, F.x[0]); hi = hi == null ? F.x[1] : Math.min(hi, F.x[1]);
    if(!isFinite(m)) return '<line class="' + cls + '" x1="' + r1(F.sx(x0)) + '" y1="' + F.T + '" x2="' + r1(F.sx(x0)) + '" y2="' + F.B + '"' + (extra || '') + '/>';
    return '<line class="' + cls + '" x1="' + r1(F.sx(lo)) + '" y1="' + r1(F.sy(y0 + m * (lo - x0))) + '" x2="' + r1(F.sx(hi)) + '" y2="' + r1(F.sy(y0 + m * (hi - x0))) + '"' + (extra || '') + '/>';
  }
  function niceUp(v){ var ok = [1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10, 12, 15, 20, 25, 30, 40, 50, 60, 80, 100]; for(var i = 0; i < ok.length; i++) if(v <= ok[i] + 1e-9) return ok[i]; return 100; }
  /* A y window that holds most of a curve on [a, b] (typed functions). */
  function autoY(f, a, b, tail){
    var vs = [];
    for(var i = 0; i <= 300; i++){ var v = f(a + (b - a) * i / 300); if(isFinite(v)) vs.push(v); }
    if(!vs.length) return [-5, 5];
    vs.sort(function(p, q){ return p - q; });
    // tail: the share of values left off each end (a derivative near a pole
    // would otherwise squash the rest of its graph).
    var t = tail || 0.03, lo = vs[Math.floor(vs.length * t)], hi = vs[Math.ceil(vs.length * (1 - t)) - 1];
    if(hi - lo < 1){ var c = (hi + lo) / 2; lo = c - 1; hi = c + 1; }
    var pad = (hi - lo) * 0.15; lo -= pad; hi += pad;
    if(lo > 0 && lo < (hi - lo) * 0.4) lo = -(hi - lo) * 0.08;
    if(hi < 0 && -hi < (hi - lo) * 0.4) hi = (hi - lo) * 0.08;
    var span = Math.min(60, hi - lo), mid = (hi + lo) / 2;
    return [M.round(mid - span / 2, 1), M.round(mid + span / 2, 1)];
  }

  /* ======================================================= EXPLORE (tools v2) */
  /* docs/tools-v2-tangent-tracer-brief.md. Two tabs, one idea each:
       1 Slope at a point: drag P (K.handle) along the road; the car on it points along the tangent, the rise and
         run show the slope, and on the graph paper below a pen draws f′ wherever P has been.
       2 Secant to tangent: drag Q toward P; the secant turns into the tangent; a magnifier keeps Q in view as h
         shrinks, so a smooth curve looks straight and a corner stays a corner.
     The road's centre line IS y = f(x) on the graph's own grid: every line and number comes from the function the
     picker names (TT.FUNCS, or a typed one through ApCalcExpr). The reference ("?") holds the numbers, the table of
     secant slopes, the limit with the numbers, the formulas, your own curve and the keys. */
  function explore(host, data){
    var K = window.LevlKit2, id = 'tt' + (++uid);
    var S = { F: TT.FUNCS.quad, tab: 'slope', a: 1, h: 1, dir: 1, trace: [], cls: null, mode: 'explore', took: null,
      driveV: 0, slideV: 0, slideIn: true, qIn: false, ready: false };
    var LENS = { show: 0, w: 1, frozen: null, cx: 0, cy: 0, R: 0 };
    var G = null, LS = null;
    function clamp(v, a, b){ return Math.max(a, Math.min(b, v)); }
    function now(){ return window.performance ? performance.now() : Date.now(); }
    // A number as students read it: real minus, at most d decimals (2 by default), ∞ for an infinite slope.
    function fmtN(v, d){
      if(!isFinite(v)) return v > 0 ? '∞' : v < 0 ? '−∞' : '—';
      var s = String(+(+v).toFixed(d == null ? 2 : d)); if(s === '-0') s = '0';
      return s.replace('-', '−');
    }
    function hText(h){ return fmtN(h, Math.abs(h) < 0.0095 ? 4 : Math.abs(h) < 0.095 ? 3 : 2); }

    /* ---------------------------------------------------- the stage */
    var stage = el('div', 'tt2');
    var tabs = K.tabs({ label: 'What to explore', big: true, value: S.tab,
      items: [{ value: 'slope', label: 'Slope at a point', short: 'Slope' }, { value: 'secant', label: 'Secant to tangent', short: 'Secant' }],
      onChange: function(v){ setTab(v); } });
    stage.appendChild(tabs.el);
    var head = K.head({ purpose: '', how: { label: 'Show me how', onClick: function(){ startTour(); } } });
    var pickWrap = el('label', 'tt2-pick'), pick = el('select', 'tt2-sel');
    pickWrap.innerHTML = '<span class="tt2-pick-k">Curve</span>';
    pick.setAttribute('aria-label', 'Curve');
    TT.ORDER.forEach(function(k){ var op = document.createElement('option'); op.value = k; op.textContent = TT.FUNCS[k].name; pick.appendChild(op); });
    var opOwn = document.createElement('option'); opOwn.value = 'own'; opOwn.textContent = 'Type your own…'; pick.appendChild(opOwn);
    pick.value = 'quad';
    pickWrap.appendChild(pick);
    head.el.insertBefore(pickWrap, head.how);
    stage.appendChild(head.el);
    var scene = el('div', 'tt2-scene'); scene.id = id + '-scene';
    scene.innerHTML = '<svg class="tt2-svg calc-plot" role="img" aria-label="" xmlns="' + NS + '" data-ls-text="keep"><defs></defs><g class="tt2-static"></g><g class="tt2-dyn"></g></svg>';
    stage.appendChild(scene);
    tabs.el.querySelectorAll('.tk2-tab').forEach(function(b){ b.setAttribute('aria-controls', scene.id); });
    var svg = scene.querySelector('svg'), defs = svg.querySelector('defs'), gS = svg.querySelector('.tt2-static'), gD = svg.querySelector('.tt2-dyn');
    var layer = K.layer(scene);
    var lines = el('div', 'tt2-lines'), cause = K.cause({ label: 'Why' });
    lines.appendChild(cause.el);
    var drive = K.player({ min: 0, max: 1, speed: 1 / 6, labels: { play: 'Drive across', pause: 'Pause', again: 'Drive again', rest: 'Drive across' },
      get: function(){ return S.driveV; }, set: function(v){ driveTo(v); },
      before: function(){ return driveStart(); }, onEnd: function(){ driveEnd(); } });
    var slide = K.player({ min: 0, max: 1, speed: 1 / 2.6, labels: { play: 'Slide Q in', pause: 'Pause', again: 'Back to h = 1', rest: 'Slide Q in' },
      get: function(){ return S.slideV; }, set: function(v){ slideTo(v); },
      before: function(){ return slideStart(); }, onEnd: function(){ slideEnd(); } });
    drive.el.classList.add('is-sm'); slide.el.classList.add('is-sm');
    lines.appendChild(drive.el); lines.appendChild(slide.el);
    stage.appendChild(lines);
    var live = el('p', 'tk2-sr'); live.setAttribute('aria-live', 'polite'); stage.appendChild(live);
    function say(t){ live.textContent = ''; setTimeout(function(){ live.textContent = t; }, 40); }

    /* ---------------------------------------------------- the curve and its view */
    function view(){
      var F = S.F;
      return { x: F.x, y: F.y || [-5, 5], dy: F.dy || [-5, 5] };
    }
    function fa(){ return S.F.f(S.a); }
    function slopeNow(){ return (S.cls || {}).kind === 'smooth' ? TT.slopeAt(S.F, S.a) : NaN; }
    function dfun(){ var F = S.F; return F.d ? function(x){ return F.d(x); } : F.dn; }
    function specials(){ var F = S.F; return (F.special || []).map(function(s){ return s.x; }).concat(F.join != null ? [F.join] : []); }
    function recompute(){ S.cls = TT.classify(S.F.f, S.a); }
    function addVisit(x0, x1){
      var lo = Math.min(x0, x1), hi = Math.max(x0, x1), out = [], m = [lo, hi];
      S.trace.forEach(function(iv){ if(iv[1] < m[0] - 1e-9 || iv[0] > m[1] + 1e-9) out.push(iv); else { m[0] = Math.min(m[0], iv[0]); m[1] = Math.max(m[1], iv[1]); } });
      out.push(m); out.sort(function(p, q){ return p[0] - q[0]; });
      S.trace = out;
    }
    function visited(x){ return S.trace.some(function(iv){ return x >= iv[0] - 1e-9 && x <= iv[1] + 1e-9 && iv[1] - iv[0] > 1e-6; }); }

    /* ---------------------------------------------------- geometry */
    function geo(W, H){
      var narrow = W < 560, pl = narrow ? 30 : 42, pr = narrow ? 24 : 26, pt = 10, V = view(), g = { W: W, H: H, narrow: narrow };
      if(S.tab === 'slope'){
        var gap = narrow ? 30 : 34, avail = H - pt - 20 - gap, aH = Math.round(avail * 0.6);
        g.A = frameOf(V.x, V.y, pl, pt, W - pl - pr, aH);
        g.B = frameOf(V.x, V.dy, pl, pt + aH + gap, W - pl - pr, avail - aH);
      } else g.A = frameOf(V.x, V.y, pl, pt, W - pl - pr, H - pt - 22);
      g.kx = g.A.W / (V.x[1] - V.x[0]); g.ky = g.A.H / (V.y[1] - V.y[0]);
      g.rw = narrow ? 10 : 13;
      g.car = clamp(W * 0.05, 40, 60);
      return g;
    }
    /* The road as runs of pixel points: broken where f is undefined or jumps, with the exact special points in. */
    function runsOf(f, A, lo, hi){
      lo = lo == null ? A.x[0] : Math.max(lo, A.x[0]); hi = hi == null ? A.x[1] : Math.min(hi, A.x[1]);
      var n = Math.max(80, Math.round((A.sx(hi) - A.sx(lo)) / 2)), xs = [], sp = specials(), jumps = (S.F.special || []).filter(function(s){ return s.kind === 'jump'; }).map(function(s){ return s.x; });
      for(var i = 0; i <= n; i++) xs.push(lo + (hi - lo) * i / n);
      sp.forEach(function(x){ if(x > lo && x < hi){ xs.push(x); xs.push(x - 1e-9); } });
      xs.sort(function(p, q){ return p - q; });
      var out = [], run = [], ymin = A.T - 60, ymax = A.B + 60;
      function end(){ if(run.length > 1) out.push(run); run = []; }
      for(var j = 0; j < xs.length; j++){
        var x = xs[j], y = f(x);
        if(!isFinite(y)){ end(); continue; }
        if(run.length && jumps.some(function(jx){ return run[run.length - 1].x < jx && x >= jx; })) end();
        run.push({ x: x, X: A.sx(x), Y: clamp(A.sy(y), ymin, ymax) });
      }
      end();
      return out;
    }
    function pathOfRun(r, dy){ return 'M' + r.map(function(p){ return r1(p.X) + ' ' + r1(p.Y + (dy || 0)); }).join('L'); }
    function bandOf(r, d0, d1){ return pathOfRun(r, d0) + 'L' + r.slice().reverse().map(function(p){ return r1(p.X) + ' ' + r1(p.Y + d1); }).join('L') + 'Z'; }
    /* The direction of the road at x in picture units (radians), from a slope m. */
    function angOf(m, dir){
      if(!isFinite(m)) return (m > 0 ? -1 : 1) * Math.PI / 2 * (dir < 0 ? -1 : 1);
      return Math.atan2(-m * G.ky, G.kx);
    }

    /* ---------------------------------------------------- the static picture: sky, grid, hillside, road, paper */
    function gridOf(F, cls){
      var nx = Math.max(3, Math.round(F.W / 70)), ny = Math.max(3, Math.round(F.H / 46)), piX = S.F.piX && (F.x[1] - F.x[0]) > 3;
      var xt = piX ? P.piTicks(F.x[0], F.x[1]) : P.ticks(F.x[0], F.x[1], nx), yt = P.ticks(F.y[0], F.y[1], ny);
      for(var k0 = ny + 1; yt.length < 3 && k0 < 12; k0++) yt = P.ticks(F.y[0], F.y[1], k0);
      for(var k1 = nx + 1; xt.length < 3 && k1 < 14 && !piX; k1++) xt = P.ticks(F.x[0], F.x[1], k1);
      if(piX && xt.length > nx + 2) xt = xt.filter(function(v){ return Math.abs(Math.round(v / Math.PI) * Math.PI - v) < 1e-9; });
      var o = ['<g class="' + cls + '">'];
      xt.forEach(function(v){ var p = r1(F.sx(v)); o.push('<line x1="' + p + '" y1="' + F.T + '" x2="' + p + '" y2="' + F.B + '"/>'); });
      yt.forEach(function(v){ var p = r1(F.sy(v)); o.push('<line x1="' + F.L + '" y1="' + p + '" x2="' + F.R + '" y2="' + p + '"/>'); });
      o.push('</g>');
      var ax = F.y[0] <= 0 && F.y[1] >= 0 ? F.sy(0) : null, ay = F.x[0] <= 0 && F.x[1] >= 0 ? F.sx(0) : null;
      o.push('<g class="tt2-axis">' + (ax != null ? '<line x1="' + F.L + '" y1="' + r1(ax) + '" x2="' + F.R + '" y2="' + r1(ax) + '"/>' : '') + (ay != null ? '<line x1="' + r1(ay) + '" y1="' + F.T + '" x2="' + r1(ay) + '" y2="' + F.B + '"/>' : '') + '</g>');
      var lab = [], lx = piX ? piLabel : tickLabel;
      xt.forEach(function(v){ var px = F.sx(v); if(px < F.L - 0.5 || px > F.R + 0.5) return; lab.push('<text x="' + r1(px) + '" y="' + r1(F.B + 14) + '" text-anchor="middle">' + lx(v) + '</text>'); });
      yt.forEach(function(v){ var py = F.sy(v); if(py < F.T + 6 || py > F.B + 0.5) return; lab.push('<text x="' + r1(F.L - 5) + '" y="' + r1(py + 4) + '" text-anchor="end">' + tickLabel(v) + '</text>'); });
      o.push('<g class="tt2-ticks">' + lab.join('') + '</g>');
      return o.join('');
    }
    function drawStatic(){
      var A = G.A, B = G.B, F = S.F, o = [];
      defs.innerHTML = clipDef(id + '-cA', A) + (B ? clipDef(id + '-cB', B) : '') +
        '<linearGradient id="' + id + '-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="tt2s-sky0"/><stop offset="1" class="tt2s-sky1"/></linearGradient>' +
        '<clipPath id="' + id + '-cL"><circle cx="0" cy="0" r="1"/></clipPath>';
      o.push('<rect class="tt2-sky" x="' + A.L + '" y="' + A.T + '" width="' + r1(A.W) + '" height="' + r1(A.H) + '" fill="url(#' + id + '-sky)"/>');
      o.push(gridOf(A, 'tt2-grid'));
      var runs = runsOf(F.f, A), rw = G.rw;
      o.push('<g clip-path="url(#' + id + '-cA)">');
      // the hillside under the road: three soft bands that fade (not an area down to the axis)
      runs.forEach(function(r){ o.push('<path class="tt2-hill h1" d="' + bandOf(r, rw * 0.4, rw * 0.4 + 16) + '"/><path class="tt2-hill h2" d="' + bandOf(r, rw * 0.4 + 16, rw * 0.4 + 36) + '"/><path class="tt2-hill h3" d="' + bandOf(r, rw * 0.4 + 36, rw * 0.4 + 62) + '"/>'); });
      runs.forEach(function(r){ var d = pathOfRun(r); o.push('<path class="tt2-shoulder" style="stroke-width:' + (rw + 6) + 'px" d="' + d + '"/><path class="tt2-road" style="stroke-width:' + rw + 'px" d="' + d + '"/><path class="tt2-lane" d="' + d + '"/>'); });
      (F.dots || []).forEach(function(d){ o.push('<circle class="tt2-end' + (d.open ? ' is-open' : '') + '" cx="' + r1(A.sx(d.at[0])) + '" cy="' + r1(A.sy(d.at[1])) + '" r="' + (rw * 0.42 + 1).toFixed(1) + '"/>'); });
      (F.special || []).filter(function(s){ return s.kind === 'endpoint'; }).forEach(function(s){ var y = F.f(s.x); if(isFinite(y)) o.push('<circle class="tt2-end" cx="' + r1(A.sx(s.x)) + '" cy="' + r1(A.sy(y)) + '" r="' + (rw * 0.42 + 1).toFixed(1) + '"/>'); });
      o.push('</g>');
      o.push('<rect class="tt2-frame" x="' + A.L + '" y="' + A.T + '" width="' + r1(A.W) + '" height="' + r1(A.H) + '"/>');
      if(B){
        o.push('<rect class="tt2-paper" x="' + B.L + '" y="' + B.T + '" width="' + r1(B.W) + '" height="' + r1(B.H) + '"/>');
        o.push(gridOf(B, 'tt2-pgrid'));
        o.push('<rect class="tt2-frame" x="' + B.L + '" y="' + B.T + '" width="' + r1(B.W) + '" height="' + r1(B.H) + '"/>');
      }
      gS.innerHTML = o.join('');
    }

    /* ---------------------------------------------------- labels that never overlap */
    var boxes = [];
    function free(b){ return boxes.every(function(q){ return b[2] < q[0] || b[0] > q[2] || b[3] < q[1] || b[1] > q[3]; }); }
    function inside(b, F){ return b[0] >= F.L + 2 && b[2] <= F.R - 2 && b[1] >= F.T + 2 && b[3] <= F.B - 2; }
    function tw(t, size){ return t.length * size * 0.56 + 6; }
    /* Put text at the first candidate [x, y, anchor] that is inside the frame and clear of everything placed. */
    function label(o, t, cls, cands, F, size){
      size = size || 13;
      for(var i = 0; i < cands.length; i++){
        var c = cands[i], w = tw(t, size), x0 = c[2] === 'end' ? c[0] - w : c[2] === 'middle' ? c[0] - w / 2 : c[0], b = [x0 - 2, c[1] - size, x0 + w + 2, c[1] + 4];
        if(inside(b, F) && free(b)){ boxes.push(b); o.push('<text class="tt2-lab ' + cls + '" x="' + r1(c[0]) + '" y="' + r1(c[1]) + '" text-anchor="' + (c[2] || 'start') + '">' + esc(t) + '</text>'); return true; }
      }
      return false;
    }
    function block(x, y, r){ boxes.push([x - r, y - r, x + r, y + r]); }

    /* ---------------------------------------------------- drawn things */
    /* The car, nose along +x, wheels on the road; origin at P on the centre line. */
    function car(L, rw, cls){
      var wr = L * 0.13, cy = -rw / 2 - wr + 2.5, bb = cy + wr * 0.15, bt = bb - L * 0.24, ct = bt - L * 0.2;
      return '<g class="tt2-car ' + (cls || '') + '">' +
        '<path class="tt2-car-b" d="M' + r1(-L / 2) + ' ' + r1(bb) + 'L' + r1(L / 2) + ' ' + r1(bb) + 'Q' + r1(L / 2 + 2) + ' ' + r1(bt) + ' ' + r1(L * 0.36) + ' ' + r1(bt) + 'L' + r1(L * 0.2) + ' ' + r1(bt) +
          'L' + r1(L * 0.08) + ' ' + r1(ct) + 'L' + r1(-L * 0.26) + ' ' + r1(ct) + 'L' + r1(-L * 0.38) + ' ' + r1(bt) + 'L' + r1(-L / 2 + 2) + ' ' + r1(bt) + 'Q' + r1(-L / 2) + ' ' + r1(bt) + ' ' + r1(-L / 2) + ' ' + r1(bb + (bt - bb) * 0.4) + 'Z"/>' +
        '<path class="tt2-car-w" d="M' + r1(L * 0.03) + ' ' + r1(bt - 1.5) + 'L' + r1(L * 0.13) + ' ' + r1(bt - 1.5) + 'L' + r1(L * 0.05) + ' ' + r1(ct + 2.5) + 'L' + r1(-L * 0.08) + ' ' + r1(ct + 2.5) + 'Z' +
          'M' + r1(-L * 0.12) + ' ' + r1(bt - 1.5) + 'L' + r1(-L * 0.12) + ' ' + r1(ct + 2.5) + 'L' + r1(-L * 0.24) + ' ' + r1(ct + 2.5) + 'L' + r1(-L * 0.32) + ' ' + r1(bt - 1.5) + 'Z"/>' +
        '<rect class="tt2-car-l" x="' + r1(L / 2 - 4) + '" y="' + r1(bt + 3) + '" width="4" height="' + r1(L * 0.07) + '" rx="1.5"/>' +
        [-0.3, 0.3].map(function(k){ return '<circle class="tt2-car-t" cx="' + r1(L * k) + '" cy="' + r1(cy) + '" r="' + r1(wr) + '"/><circle class="tt2-car-h" cx="' + r1(L * k) + '" cy="' + r1(cy) + '" r="' + r1(wr * 0.42) + '"/>'; }).join('') +
        '</g>';
    }
    function carAt(o, px, py, ang, dir){
      o.push('<g transform="translate(' + r1(px) + ' ' + r1(py) + ') rotate(' + (ang * 180 / Math.PI).toFixed(2) + ')' + (dir < 0 ? ' scale(-1 1)' : '') + '">' + car(G.car, G.rw) + '</g>');
      block(px, py - G.car * 0.25, G.car * 0.55);
    }
    /* A line y = y0 + m (x - x0) across frame F (or a vertical line when m is infinite), on [lo, hi]. */
    function across(F, x0, y0, m, cls, lo, hi){ return lineAcross(F, x0, y0, m, cls, '', lo, hi); }
    /* The ends of that line inside F, as pixel points, for its label. */
    function endsIn(F, x0, y0, m){
      if(!isFinite(m)) return [[F.sx(x0), F.T + 16], [F.sx(x0), F.B - 8]];
      var pts = [], xa = F.x[0], xb = F.x[1];
      var ya = y0 + m * (xa - x0), yb = y0 + m * (xb - x0);
      function clip(x, y){ if(y > F.y[1]){ x = x0 + (F.y[1] - y0) / m; y = F.y[1]; } else if(y < F.y[0]){ x = x0 + (F.y[0] - y0) / m; y = F.y[0]; } return [F.sx(x), F.sy(y)]; }
      pts.push(clip(xa, ya)); pts.push(clip(xb, yb));
      return pts;
    }
    function lineLabel(o, F, x0, y0, m, t, cls, px, py){
      var e = endsIn(F, x0, y0, m), c = [];
      e.sort(function(p, q){ return Math.hypot(q[0] - px, q[1] - py) - Math.hypot(p[0] - px, p[1] - py); });
      e.forEach(function(p){
        var f = 0.86, x = px + (p[0] - px) * f, y = py + (p[1] - py) * f, right = p[0] > px;
        c.push([x, y - 8, right ? 'end' : 'start'], [x, y + 18, right ? 'end' : 'start']);
        f = 0.6; x = px + (p[0] - px) * f; y = py + (p[1] - py) * f;
        c.push([x, y - 8, right ? 'end' : 'start'], [x, y + 18, right ? 'end' : 'start']);
      });
      return label(o, t, cls, c, F);
    }
    function arrowHead(x, y, ang, s){
      var a1 = ang + Math.PI * 0.83, a2 = ang - Math.PI * 0.83;
      return 'M' + r1(x) + ' ' + r1(y) + 'L' + r1(x + Math.cos(a1) * s) + ' ' + r1(y + Math.sin(a1) * s) + 'L' + r1(x + Math.cos(a2) * s) + ' ' + r1(y + Math.sin(a2) * s) + 'Z';
    }
    /* The pen that draws f′, its tip at (x, y) on the paper. */
    function pen(x, y, lifted){
      var dy = lifted ? -16 : 0;
      return '<g class="tt2-pen' + (lifted ? ' is-up' : '') + '" transform="translate(' + r1(x) + ' ' + r1(y + dy) + ') rotate(-38)">' +
        '<path class="tt2-pen-b" d="M0 0L5 -12L5 -46Q5 -50 0 -50Q-5 -50 -5 -46L-5 -12Z"/><path class="tt2-pen-n" d="M0 0L5 -12L-5 -12Z"/><rect class="tt2-pen-c" x="-5" y="-36" width="10" height="5"/></g>';
    }
    function niceRun(A, a, m){
      var opts = [1, 0.5, 0.25, 0.2, 0.1, 2];
      for(var i = 0; i < opts.length; i++){
        var r = opts[i];
        for(var s = 1; s >= -1; s -= 2){
          var x1 = a + s * r, y0 = S.F.f(a), y1 = y0 + m * s * r, runPx = Math.abs(A.sx(x1) - A.sx(a)), risePx = Math.abs(A.sy(y1) - A.sy(y0));
          if(x1 < A.x[0] || x1 > A.x[1] || runPx < 34 || runPx > A.W * 0.4 || risePx > A.H * 0.5 || A.sy(y1) < A.T + 4 || A.sy(y1) > A.B - 4) continue;
          return { r: r, s: s };
        }
      }
      return null;
    }

    /* ---------------------------------------------------- the moving picture */
    function draw(){
      if(!G || !S.ready) return;
      boxes = [];
      var A = G.A, B = G.B, F = S.F, a = S.a, y0 = fa(), c = S.cls || { kind: 'smooth' }, m = slopeNow(), o = [];
      var Px = A.sx(a), Py = A.sy(y0);
      block(Px, Py, 22);
      if(S.tab === 'slope'){ var ts = tagSideP(); boxes.push(ts === 'down' ? [Px - 48, Py + 16, Px + 48, Py + 52] : ts === 'right' ? [Px + 16, Py - 16, Px + 110, Py + 16] : [Px - 110, Py - 16, Px - 16, Py + 16]); }
      var dir = S.dir;
      if(S.tab === 'slope'){
        // the f′ paper: the ink where P has been, the slope now as a bar, the pen
        var df = dfun();
        o.push('<g clip-path="url(#' + id + '-cB)">');
        S.trace.forEach(function(iv){ if(iv[1] - iv[0] > 1e-6) o.push(curvePath(df, B, iv[0], iv[1], 'tt2-ink')); });
        (F.special || []).forEach(function(sp){
          if(!(visited(sp.x) || Math.abs(sp.x - a) < 1e-9)) return;
          if(sp.kind === 'corner') o.push(dot(B, sp.x, sp.L, 'tt2-inkdot', 4.5, true) + dot(B, sp.x, sp.R, 'tt2-inkdot', 4.5, true));
          if(sp.kind === 'jump' && isFinite(sp.R)) o.push(dot(B, sp.x, sp.R, 'tt2-inkdot', 4.5, true));
        });
        o.push('</g>');
        var gx = r1(Px);
        if(Px >= A.L && Px <= A.R) o.push('<line class="tt2-guide" x1="' + gx + '" y1="' + r1(clamp(Py, A.T, A.B)) + '" x2="' + gx + '" y2="' + B.B + '"/>');
        var smooth = c.kind === 'smooth' && isFinite(m);
        if(smooth){
          var b0 = clamp(B.sy(0), B.T, B.B), b1 = clamp(B.sy(m), B.T, B.B);
          o.push('<line class="tt2-bar" x1="' + gx + '" y1="' + r1(b0) + '" x2="' + gx + '" y2="' + r1(b1) + '"/>');
          o.push(pen(Px, b1, false));
          if(B.sy(m) < B.T || B.sy(m) > B.B) o.push('<path class="tt2-off" d="' + arrowHead(Px + 12, B.sy(m) < B.T ? B.T + 2 : B.B - 2, B.sy(m) < B.T ? -Math.PI / 2 : Math.PI / 2, 8) + '"/>');
        } else o.push(pen(Px, clamp(B.sy(0), B.T + 20, B.B), true));
        boxes.push([B.L, B.T, B.L + 150, B.T + 22]);
        o.push('<text class="tt2-lab tt2-c2" x="' + (B.L + 8) + '" y="' + (B.T + 17) + '">' + (G.narrow ? 'f′(x): slope of f' : 'f′(x), the slope of f') + '</text>');
        if(!smooth) label(o, 'no value', 'tt2-cbad', [[Px + 14, clamp(B.sy(0), B.T + 16, B.B) - 14, 'start'], [Px - 14, clamp(B.sy(0), B.T + 16, B.B) - 14, 'end']], B, 12.5);
        // on the road: the tangent, the heading, the rise and run, the car
        o.push('<g clip-path="url(#' + id + '-cA)">');
        if(smooth){
          o.push(across(A, a, y0, m, 'tt2-tan'));
          var ang = angOf(m) + (dir < 0 ? Math.PI : 0), u = [Math.cos(ang), Math.sin(ang)], s0 = G.car * 0.5 + 6, s1 = G.car * 0.5 + (G.narrow ? 44 : 64);
          o.push('<path class="tt2-head" d="M' + r1(Px + u[0] * s0) + ' ' + r1(Py + u[1] * s0) + 'L' + r1(Px + u[0] * (s1 - 6)) + ' ' + r1(Py + u[1] * (s1 - 6)) + '"/><path class="tt2-headtip" d="' + arrowHead(Px + u[0] * s1, Py + u[1] * s1, ang, 11) + '"/>');
          block(Px + u[0] * (s1 - 10), Py + u[1] * (s1 - 10), 12);
          var rr = niceRun(A, a, m);
          if(rr){
            var x1 = a + rr.s * rr.r, X1 = A.sx(x1), Y1 = A.sy(y0 + m * rr.s * rr.r);
            o.push('<path class="tt2-tri" d="M' + r1(Px) + ' ' + r1(Py) + 'H' + r1(X1) + 'V' + r1(Y1) + '"/>');
            S.tri = { run: rr.r, rise: m * rr.r };
          } else S.tri = null;
        } else {
          S.tri = null;
          if(c.kind === 'corner'){
            if(isFinite(c.L)) o.push(across(A, a, y0, c.L, 'tt2-tan is-half', null, a));
            if(isFinite(c.R)) o.push(across(A, a, y0, c.R, 'tt2-tan is-half', a, null));
          } else if(c.kind === 'vertical' || c.kind === 'cusp') o.push(across(A, a, y0, Infinity, 'tt2-tan is-half'));
        }
        var cm = smooth ? m : c.kind === 'corner' || c.kind === 'vertical' || c.kind === 'cusp' ? (dir < 0 ? c.R : c.L) : c.kind === 'endpoint' ? (isFinite(c.R) || Math.abs(c.R) === Infinity ? c.R : c.L) : (isFinite(c.R) ? c.R : c.L);
        if(!isFinite(cm) && !(Math.abs(cm) === Infinity)) cm = 0;
        carAt(o, Px, Py, angOf(cm, dir), dir);
        o.push('</g>');
        // labels on the road (after the shapes, placed clear of them)
        if(smooth){
          if(S.tri){
            var tx1 = A.sx(a + S.tri.run * (rr.s)), ty0 = Py, ty1 = A.sy(y0 + m * rr.s * rr.r), rs = rr.s;
            label(o, 'run ' + fmtN(S.tri.run), 'tt2-c4', [[(Px + tx1) / 2, ty1 < ty0 ? ty0 + 17 : ty0 - 8, 'middle'], [(Px + tx1) / 2, ty1 < ty0 ? ty0 - 8 : ty0 + 17, 'middle']], A, 12.5);
            if(Math.abs(ty1 - ty0) > 14) label(o, 'rise ' + fmtN(S.tri.rise), 'tt2-c4', [[tx1 + (rs > 0 ? 7 : -7), (ty0 + ty1) / 2 + 4, rs > 0 ? 'start' : 'end'], [tx1 + (rs > 0 ? -7 : 7), (ty0 + ty1) / 2 + 4, rs > 0 ? 'end' : 'start']], A, 12.5);
          }
          lineLabel(o, A, a, y0, m, 'tangent', 'tt2-c4', Px, Py);
        } else if(c.kind === 'corner'){
          if(isFinite(c.L)) label(o, 'from the left', 'tt2-c4', [[A.sx(a - (A.x[1] - A.x[0]) * 0.12), A.sy(y0 - c.L * (A.x[1] - A.x[0]) * 0.12) - 10, 'middle'], [A.sx(a - (A.x[1] - A.x[0]) * 0.12), A.sy(y0 - c.L * (A.x[1] - A.x[0]) * 0.12) + 20, 'middle']], A, 12.5);
          if(isFinite(c.R)) label(o, 'from the right', 'tt2-c4', [[A.sx(a + (A.x[1] - A.x[0]) * 0.12), A.sy(y0 + c.R * (A.x[1] - A.x[0]) * 0.12) - 10, 'middle'], [A.sx(a + (A.x[1] - A.x[0]) * 0.12), A.sy(y0 + c.R * (A.x[1] - A.x[0]) * 0.12) + 20, 'middle']], A, 12.5);
        } else if(c.kind === 'vertical' || c.kind === 'cusp') label(o, c.kind === 'cusp' ? 'cusp' : 'vertical tangent', 'tt2-c4', [[Px + 10, A.T + 18, 'start'], [Px - 10, A.T + 18, 'end']], A, 12.5);
        else if(c.kind === 'jump') label(o, 'jump', 'tt2-cbad', [[Px + 14, Py + 24, 'start'], [Px - 14, Py + 24, 'end']], A, 12.5);
        roadLabel(o);
      } else {
        drawSecant(o, A, a, y0, m, c, Px, Py);
      }
      gD.innerHTML = o.join('');
      svg.setAttribute('aria-label', picText());
      hp.place(); if(hq) hq.place();
      if(cue.active()) cue.place();
      words();
    }
    function tagSideP(){
      if(!G) return 'down';
      var y = G.A.sy(fa()), x = G.A.sx(S.a);
      if(y < G.A.B - 50 && x > G.A.L + 44 && x < G.A.R - 44) return 'down';
      return x < G.A.R - 130 ? 'right' : 'left';
    }
    function roadLabel(o){
      var A = G.A, F = S.F, xs = [0.9, 0.1, 0.75, 0.25], pa = (S.a - A.x[0]) / (A.x[1] - A.x[0]);
      xs.sort(function(p, q){ return Math.abs(q - pa) - Math.abs(p - pa); });
      for(var i = 0; i < xs.length; i++){
        var x = A.x[0] + (A.x[1] - A.x[0]) * xs[i], y = F.f(x);
        if(!isFinite(y) || y < A.y[0] || y > A.y[1]) continue;
        var X = A.sx(x), Y = A.sy(y), d = (F.f(x + 1e-4) - y) / 1e-4, steep = isFinite(d) && Math.abs(d * G.ky / G.kx) > 0.7;
        var c = steep ? (d < 0 ? [[X + G.rw + 10, Y + 4, 'start'], [X - G.rw - 10, Y + 4, 'end']] : [[X - G.rw - 10, Y + 4, 'end'], [X + G.rw + 10, Y + 4, 'start']]) : [[X, Y - G.rw - 8, 'middle'], [X, Y + G.rw + 20, 'middle']];
        if(label(o, 'y = f(x)', 'tt2-croad', c, A, 13)) return;
      }
    }

    /* Tab 2: the secant through P and Q, the tangent it closes in on, and the magnifier. */
    function qPoint(){ var x = S.a + S.h, y = S.F.f(x); return { x: x, y: y, ok: isFinite(y) && x >= G.A.x[0] && x <= G.A.x[1] }; }
    function lensWanted(){
      if(S.tab !== 'secant' || !G) return false;
      var q = qPoint(); if(!q.ok) return false;
      return Math.hypot(G.A.sx(q.x) - G.A.sx(S.a), G.A.sy(q.y) - G.A.sy(fa())) < 64;
    }
    function lensGeo(){
      var A = G.A, R = clamp(Math.min(A.W, A.H) * 0.25, 70, 132), Px = A.sx(S.a), Py = A.sy(fa());
      var cands = [[A.R - R - 16, A.T + R + 16], [A.L + R + 16, A.T + R + 16], [A.R - R - 16, A.B - R - 16], [A.L + R + 16, A.B - R - 16]];
      cands.sort(function(p, q){ return Math.hypot(q[0] - Px, q[1] - Py) - Math.hypot(p[0] - Px, p[1] - Py); });
      return { cx: cands[0][0], cy: cands[0][1], R: R };
    }
    function lensMap(L){
      var px = L.R / LENS.w, py = px * G.ky / G.kx, a = S.a, y0 = fa();
      return { sx: function(x){ return L.cx + (x - a) * px; }, sy: function(y){ return L.cy - (y - y0) * py; }, px: px, py: py };
    }
    function drawSecant(o, A, a, y0, m, c, Px, Py){
      var F = S.F, q = qPoint(), sec = q.ok ? (q.y - y0) / S.h : NaN, smooth = c.kind === 'smooth' && isFinite(m);
      o.push('<g clip-path="url(#' + id + '-cA)">');
      if(smooth) o.push(across(A, a, y0, m, 'tt2-tan is-thin'));
      if(q.ok && isFinite(sec)){
        o.push(across(A, a, y0, sec, 'tt2-sec'));
        var Qx = A.sx(q.x), Qy = A.sy(q.y);
        if(Math.abs(Qx - Px) > 6) o.push('<path class="tt2-stri" d="M' + r1(Px) + ' ' + r1(Py) + 'H' + r1(Qx) + 'V' + r1(Qy) + '"/>');
        o.push('<g class="tt2-flag" transform="translate(' + r1(Qx) + ' ' + r1(Qy) + ')"><line x1="0" y1="0" x2="0" y2="-38"/><path d="M0 -38L18 -32L0 -26Z"/></g>');
      }
      carAt(o, Px, Py, angOf(smooth ? m : isFinite(c.R) ? c.R : isFinite(c.L) ? c.L : 0, 1), 1);
      o.push('</g>');
      if(q.ok && isFinite(sec)){
        var Qx2 = A.sx(q.x), Qy2 = A.sy(q.y);
        block(Qx2, Qy2, 20); block(Qx2 + 9, Qy2 - 32, 12);
        if(!qInLens()) boxes.push([Qx2 - 44, Qy2 + 16, Qx2 + 44, Qy2 + 52]);
        if(Math.abs(Qx2 - Px) > 40) label(o, 'h', 'tt2-c5', [[(Px + Qx2) / 2, Qy2 < Py ? Py + 17 : Py - 8, 'middle'], [(Px + Qx2) / 2, Qy2 < Py ? Py - 8 : Py + 17, 'middle']], A, 13);
        if(Math.abs(Qy2 - Py) > 30) label(o, 'Δy', 'tt2-c5', [[Qx2 + (S.h > 0 ? 9 : -9), (Py + Qy2) / 2 + 4, S.h > 0 ? 'start' : 'end'], [Qx2 + (S.h > 0 ? -9 : 9), (Py + Qy2) / 2 + 4, S.h > 0 ? 'end' : 'start']], A, 13);
      }
      // the magnifier
      var Lg = lensGeo();
      if(LENS.show > 0.01 && q.ok){
        LENS.cx = Lg.cx; LENS.cy = Lg.cy; LENS.R = Lg.R;
        var k = 0.6 + 0.4 * LENS.show, R = Lg.R, Lm = lensMap(Lg);
        boxes.push([Lg.cx - R - 8, Lg.cy - R - 8, Lg.cx + R + 8, Lg.cy + R + 30]);
        var g = ['<g class="tt2-lens" style="opacity:' + LENS.show.toFixed(3) + '" transform="translate(' + r1(Lg.cx) + ' ' + r1(Lg.cy) + ') scale(' + k.toFixed(3) + ') translate(' + r1(-Lg.cx) + ' ' + r1(-Lg.cy) + ')">'];
        // the two lines from the small ring at P to the glass
        var d = Math.hypot(Lg.cx - Px, Lg.cy - Py), ux = (Lg.cx - Px) / d, uy = (Lg.cy - Py) / d;
        g.push('<circle class="tt2-ring" cx="' + r1(Px) + '" cy="' + r1(Py) + '" r="15"/>');
        g.push('<path class="tt2-beam" d="M' + r1(Px - uy * 15) + ' ' + r1(Py + ux * 15) + 'L' + r1(Lg.cx - uy * R) + ' ' + r1(Lg.cy + ux * R) + 'M' + r1(Px + uy * 15) + ' ' + r1(Py - ux * 15) + 'L' + r1(Lg.cx + uy * R) + ' ' + r1(Lg.cy - ux * R) + '"/>');
        var hx = Lg.cx + R * 0.72 * (Lg.cx < A.L + A.W / 2 ? -1 : 1), hy = Lg.cy + R * 0.72 * (Lg.cy < A.T + A.H / 2 ? 1 : -1);
        g.push('<line class="tt2-lens-h" x1="' + r1(hx) + '" y1="' + r1(hy) + '" x2="' + r1(Lg.cx + (hx - Lg.cx) * 1.5) + '" y2="' + r1(Lg.cy + (hy - Lg.cy) * 1.5) + '"/>');
        g.push('<circle class="tt2-lens-bg" cx="' + r1(Lg.cx) + '" cy="' + r1(Lg.cy) + '" r="' + r1(R) + '"/>');
        g.push('<g clip-path="url(#' + id + '-cL)">');
        // the road inside, at this zoom
        var Fz = { x: [a - LENS.w * 1.05, a + LENS.w * 1.05] }, pts = [], pieces = [], jumpsX = (F.special || []).filter(function(s){ return s.kind === 'jump'; }).map(function(s){ return s.x; });
        var n = 120, xs = [];
        for(var i = 0; i <= n; i++) xs.push(Fz.x[0] + (Fz.x[1] - Fz.x[0]) * i / n);
        specials().forEach(function(x){ if(x > Fz.x[0] && x < Fz.x[1]){ xs.push(x); xs.push(x - 1e-12); } });
        xs.push(a); xs.sort(function(p, q2){ return p - q2; });
        xs.forEach(function(x){
          var y = F.f(x);
          if(!isFinite(y)){ if(pts.length > 1) pieces.push(pts); pts = []; return; }
          if(pts.length && jumpsX.some(function(jx){ return pts[pts.length - 1][2] < jx && x >= jx; })){ if(pts.length > 1) pieces.push(pts); pts = []; }
          pts.push([Lm.sx(x), clamp(Lm.sy(y), Lg.cy - R * 3, Lg.cy + R * 3), x]);
        });
        if(pts.length > 1) pieces.push(pts);
        pieces.forEach(function(pc){
          var dd = 'M' + pc.map(function(p){ return r1(p[0]) + ' ' + r1(p[1]); }).join('L');
          g.push('<path class="tt2-shoulder" style="stroke-width:' + (G.rw + 6) + 'px" d="' + dd + '"/><path class="tt2-road" style="stroke-width:' + G.rw + 'px" d="' + dd + '"/><path class="tt2-lane" d="' + dd + '"/>');
        });
        var Lf = { x: Fz.x, y: [y0 - R / Lm.py * 1.2, y0 + R / Lm.py * 1.2], T: Lg.cy - R, B: Lg.cy + R, L: Lg.cx - R, R: Lg.cx + R, sx: Lm.sx, sy: Lm.sy };
        if(smooth) g.push(lineAcross(Lf, a, y0, m, 'tt2-tan is-thin'));
        if(isFinite(sec)) g.push(lineAcross(Lf, a, y0, sec, 'tt2-sec'));
        g.push('<circle class="tt2-pdot" cx="' + r1(Lg.cx) + '" cy="' + r1(Lg.cy) + '" r="5"/>');
        if(isFinite(sec) && !S.qIn) g.push('<circle class="tt2-qdot" cx="' + r1(Lm.sx(q.x)) + '" cy="' + r1(Lm.sy(q.y)) + '" r="5"/>');
        g.push('</g>');
        g.push('<circle class="tt2-lens-rim" cx="' + r1(Lg.cx) + '" cy="' + r1(Lg.cy) + '" r="' + r1(R) + '"/>');
        var z = (R / LENS.w) / G.kx, zt = '×' + (z >= 10 ? String(+z.toPrecision(2)) : String(Math.max(1, Math.round(z))));
        g.push('<text class="tt2-lab tt2-zoom" x="' + r1(Lg.cx) + '" y="' + r1(Lg.cy + R + 19) + '" text-anchor="middle">' + esc('zoom ' + zt) + '</text>');
        g.push('</g>');
        o.push(g.join(''));
        // the clip circle follows the glass
        var cc = defs.querySelector('#' + id + '-cL circle'); if(cc){ cc.setAttribute('cx', r1(Lg.cx)); cc.setAttribute('cy', r1(Lg.cy)); cc.setAttribute('r', r1(R)); }
      }
      // labels last
      if(q.ok && isFinite(sec)) lineLabel(o, A, a, y0, sec, 'secant', 'tt2-c5', Px, Py);
      if(smooth) lineLabel(o, A, a, y0, m, 'tangent', 'tt2-c4', Px, Py);
      roadLabel(o);
    }
    function picText(){
      var F = S.F, A = sv(S.a), c = S.cls || {};
      var t = (F.custom ? 'Your curve ' : 'The curve ') + plain('$' + F.tex + '$') + ', drawn as a road. P at x = ' + A + '. ';
      return t + cause.text();
    }

    /* ---------------------------------------------------- the cause line (and the words on the knobs) */
    var wKey = '';
    function words(){
      var c = S.cls || { kind: 'smooth' }, A = sv(S.a), m = slopeNow(), parts = [];
      if(S.tab === 'slope'){
        if(c.kind === 'smooth' && isFinite(m)){
          var w = fmtN(m) === '0' ? 'f flat' : m > 0 ? 'f rising' : 'f falling';
          parts = [{ t: w + ' at x = ' + A, role: 'road' }, { t: 'slope ' + fmtN(m), role: 'slope' }, { t: 'f′(' + A + ') = ' + fmtN(m), role: 'fp', say: 'so f prime of ' + A + ' is ' + fmtN(m) }];
        } else parts = brokenParts(c, A);
      } else {
        var q = qPoint(), sec = q.ok ? (q.y - fa()) / S.h : NaN;
        if(!q.ok || !isFinite(sec)) parts = [{ t: 'Q is off the road', role: 'sec' }, { t: 'move Q to the other side', role: 'ink' }];
        else {
          parts = [{ t: 'h = ' + hText(S.h), role: 'sec' }, { t: 'secant slope ' + fmtN(sec, Math.abs(S.h) < 0.095 ? 3 : 2), role: 'sec' }];
          if(c.kind === 'smooth' && isFinite(m)){ if(Math.abs(sec - m) < 0.005) parts.push({ t: 'almost the tangent, slope ' + fmtN(m), role: 'slope' }); }
          else if(Math.abs(S.h) <= 0.1) parts.push({ t: 'no tangent slope at x = ' + A, role: 'bad' });
        }
      }
      var k = JSON.stringify(parts) + '|' + (S.took || '');
      if(k === wKey) return;
      wKey = k;
      if(S.took) cause.take(S.took); else cause.set(parts);
    }
    function brokenParts(c, A){
      var dne = { t: 'f′(' + A + ') does not exist', role: 'bad' };
      if(c.kind === 'corner') return [{ t: 'left slope ' + fmtN(c.L), role: 'slope' }, { t: 'right slope ' + fmtN(c.R), role: 'slope', join: '+' }, { t: 'they disagree', role: 'ink' }, dne];
      if(c.kind === 'cusp') return [{ t: 'left slope ' + fmtN(c.L), role: 'slope' }, { t: 'right slope ' + fmtN(c.R), role: 'slope', join: '+' }, { t: 'a cusp', role: 'ink' }, dne];
      if(c.kind === 'vertical') return [{ t: 'tangent is vertical', role: 'slope' }, { t: 'no slope', role: 'ink' }, dne];
      if(c.kind === 'jump') return [{ t: 'f jumps at x = ' + A, role: 'road' }, { t: 'not continuous', role: 'ink' }, dne];
      if(c.kind === 'endpoint') return [{ t: 'the road ends at x = ' + A, role: 'road' }, { t: 'one side only', role: 'ink' }, dne];
      return [{ t: 'f is not defined at x = ' + A, role: 'bad' }];
    }

    /* ---------------------------------------------------- the two knobs */
    function snapA(a, px){
      var A = G.A, best = null;
      specials().forEach(function(x){ if(Math.abs(A.sx(x) - A.sx(a)) <= (px || 12) && (best == null || Math.abs(x - a) < Math.abs(best - a))) best = x; });
      if(best != null) return best;
      var span = A.x[1] - A.x[0], st = span > 4 ? 0.01 : 0.001;
      return M.round(Math.round(a / st) * st, 5);
    }
    function validA(a){
      var F = S.F;
      a = clamp(a, F.x[0], F.x[1]);
      if(isFinite(F.f(a))) return a;
      var lo = S.a, hi = a;
      if(!isFinite(F.f(lo))) return null;
      for(var k = 0; k < 40; k++){ var mid = (lo + hi) / 2; if(isFinite(F.f(mid))) lo = mid; else hi = mid; }
      return M.round(lo, 4);
    }
    function stepA(){ var span = S.F.x[1] - S.F.x[0], st = span / 120; return st > 0.04 ? 0.05 : st > 0.004 ? 0.005 : 0.0005; }
    var hp = K.handle(layer, { key: 'apcalc-tangent-tracer-p', label: 'Point P on the curve', value: S.a, chip: false,
      at: function(v){ if(!G) return null; var y = S.F.f(v); return isFinite(y) && y >= G.A.y[0] && y <= G.A.y[1] ? [G.A.sx(v), G.A.sy(y)] : null; },
      dir: function(v){ if(!G) return 0; var m = slopeNow(); return angOf(isFinite(m) ? m : 0) * 180 / Math.PI; },
      pick: function(x){ if(!G) return null; var v = validA(snapA(G.A.ix(x))); return v; },
      keys: function(v, k, big){
        var st = stepA(), to = null, F = S.F;
        if(k === 'ArrowRight' || k === 'ArrowUp') to = v + st * (big ? 10 : 1);
        else if(k === 'ArrowLeft' || k === 'ArrowDown') to = v - st * (big ? 10 : 1);
        else if(k === 'PageUp') to = v + st * 10; else if(k === 'PageDown') to = v - st * 10;
        else if(k === 'Home') to = F.x[0]; else if(k === 'End') to = F.x[1];
        else return null;
        var sp = specials().filter(function(x){ return (x - v) * (x - to) < 0 || Math.abs(x - to) < st / 2; });
        if(sp.length) to = sp.sort(function(p, q){ return Math.abs(p - v) - Math.abs(q - v); })[0];
        else to = M.round(Math.round(to / st) * st, 5);
        if(k === 'Home' || k === 'End'){ to = k === 'Home' ? F.x[0] : F.x[1]; for(var i = 0; i < 400 && !isFinite(F.f(to)); i++) to += (k === 'Home' ? 1 : -1) * (F.x[1] - F.x[0]) / 400; to = M.round(to, 4); }
        return validA(to);
      },
      valuetext: function(v){ var c = S.cls || {}, m = slopeNow(); return 'x = ' + sv(v) + ', f(x) = ' + fmtN(S.F.f(v), 3) + (c.kind === 'smooth' && isFinite(m) ? ', slope ' + fmtN(m) : ', no slope here'); },
      tag: function(){ if(S.tab !== 'slope') return ''; var c = S.cls || {}, m = slopeNow(); return c.kind === 'smooth' && isFinite(m) ? 'slope ' + fmtN(m) : 'no slope'; },
      tagSide: function(){ return tagSideP(); },
      onStart: function(){ userActs(); },
      onInput: function(v){ moveP(v); },
      onEnd: function(){ say(cause.text()); refLater(); } });
    var hq = K.handle(layer, { key: 'apcalc-tangent-tracer-q', label: 'Point Q, the second point of the secant: h is the distance from P', value: S.h, chip: true, hint: 'Drag',
      at: function(v){
        if(!G || S.tab !== 'secant') return null;
        var x = S.a + v, y = S.F.f(x);
        if(!isFinite(y)) return null;
        if(qInLens()){ var Lm = lensMap({ cx: LENS.cx, cy: LENS.cy, R: LENS.R }); return [Lm.sx(x), Lm.sy(y)]; }
        return x >= G.A.x[0] && x <= G.A.x[1] && y >= G.A.y[0] && y <= G.A.y[1] ? [G.A.sx(x), G.A.sy(y)] : null;
      },
      dir: function(){ var q = qPoint(), sec = q.ok ? (q.y - fa()) / S.h : 0; return G ? angOf(isFinite(sec) ? sec : 0) * 180 / Math.PI : 0; },
      pick: function(x){
        if(!G) return null;
        var h;
        if(S.qIn){ var px = LENS.R / LENS.frozen; h = clamp((x - LENS.cx) / px, -LENS.frozen, LENS.frozen); }
        else h = G.A.ix(x) - S.a;
        return validH(snapH(h));
      },
      keys: function(v, k, big){
        var ah = Math.abs(v), sg = v < 0 ? -1 : 1, st = ah > 0.2 ? 0.05 : ah > 0.02 ? 0.005 : ah > 0.002 ? 0.0005 : 0.0001, to = null;
        if(k === 'ArrowRight' || k === 'ArrowUp') to = v + st * (big ? 10 : 1);
        else if(k === 'ArrowLeft' || k === 'ArrowDown') to = v - st * (big ? 10 : 1);
        else if(k === 'PageDown') to = v / 10; else if(k === 'PageUp') to = v * 10;
        else if(k === 'Home') to = -1; else if(k === 'End') to = 1;
        else return null;
        if(to * v <= 0 && k.indexOf('Arrow') === 0) to = -sg * TT.HMIN;
        return validH(snapH(to));
      },
      valuetext: function(v){ var q = qPoint(), sec = q.ok ? (q.y - fa()) / v : NaN; return 'h = ' + hText(v) + (v > 0 ? ', Q to the right of P' : ', Q to the left of P') + (isFinite(sec) ? ', secant slope ' + fmtN(sec, 3) : ', Q is off the curve'); },
      tag: function(v){ return S.tab === 'secant' ? 'h = ' + hText(v) : ''; },
      tagSide: function(){ return 'down'; },
      onStart: function(){ userActs(); S.qIn = qInLens(); if(S.qIn) LENS.frozen = LENS.w; },
      onInput: function(v){ setH(v); },
      onEnd: function(){ var was = S.qIn; S.qIn = false; LENS.frozen = null; if(was || lensWanted()) glide(); kick(); say(cause.text()); refLater(); } });
    function qInLens(){ return S.tab === 'secant' && LENS.show > 0.5 && (S.qIn || (!hq || !hq.dragging() ? lensWanted() : false)); }
    function snapH(h){
      var ah = Math.abs(h), sg = h < 0 ? -1 : 1;
      if(!isFinite(h)) return S.h;
      if(ah < TT.HMIN) return sg * TT.HMIN;
      var p = Math.pow(10, Math.floor(Math.log10(ah)) - 1);
      return sg * M.round(Math.round(ah / p) * p, 6);
    }
    function hmax(){ return Math.min(TT.HMAX * 2, (S.F.x[1] - S.F.x[0]) * 0.8); }
    function validH(h){
      h = clamp(h, -hmax(), hmax());
      var x = S.a + h, y = S.F.f(x);
      if(!isFinite(y) || x < S.F.x[0] || x > S.F.x[1]) return null;
      return h;
    }
    function glide(){ hq.el.classList.add('is-glide'); setTimeout(function(){ hq.el.classList.remove('is-glide'); }, 340); }

    /* ---------------------------------------------------- changes */
    function userActs(){
      hideCue(true);
      if(drive.playing()) drive.stop();
      if(slide.playing()) slide.stop();
      S.took = null;
    }
    function moveP(v, quiet){
      var old = S.a;
      if(v === old && S.cls) return;
      if(v !== old) S.dir = v > old ? 1 : -1;
      S.a = v;
      addVisit(old, v);
      recompute();
      if(S.tab === 'secant' && validH(S.h) == null){ var hh = validH(-S.h); if(hh != null){ S.h = hh; hq.value(hh); } }
      if(!quiet){ S.driveV = 0; drive.paint(); tourDid('drag'); }
      kick(); draw(); refLater();
    }
    function setH(h){
      S.h = h;
      S.slideV = Math.abs(h) <= TT.HMIN * 1.01 ? 1 : 0; slide.paint();
      tourDid('dragq');
      kick(); draw(); refLater();
    }
    function setF(F, how){
      fade();
      drive.stop(); slide.stop();
      S.F = F; S.a = F.a; S.h = F.h || 1; S.trace = []; S.dir = 1; S.took = null; S.driveV = 0; S.slideV = 0;
      LENS.show = 0; LENS.w = 2.2 * Math.abs(S.h);
      recompute(); addVisit(S.a, S.a);
      hp.value(S.a); hq.value(S.h);
      layout(); drive.paint(); slide.paint();
      refHtml();
      if(how !== 'quiet') say('Curve: ' + (F.custom ? 'your function, ' : '') + plain('$' + F.tex + '$') + '. ' + cause.text());
    }
    function setTab(v){
      if(v === S.tab) return;
      fade();
      drive.stop(); slide.stop(); tour.stop(); tour2.stop();
      S.tab = v; S.took = null; LENS.show = 0; LENS.w = 2.2 * Math.abs(S.h);
      head.purpose(v === 'slope' ? 'The derivative is the slope of the curve at each point.' : 'The secant turns into the tangent as h goes to 0.');
      drive.el.hidden = v !== 'slope'; slide.el.hidden = v !== 'secant';
      hq.hide(v !== 'secant');
      hp.el.classList.toggle('is-quiet', v === 'secant');
      layout(); kick();
      say(v === 'slope' ? 'Slope at a point. ' + cause.text() : 'Secant to tangent. ' + cause.text());
    }
    /* A short cross fade of the picture that was there (a new curve, a tab, a result shown at once). */
    function fade(){
      if(!S.ready || !G) return;
      var old = gS.innerHTML + gD.innerHTML;
      if(!old) return;
      var g = document.createElementNS(NS, 'g'); g.setAttribute('class', 'tt2-fade'); g.innerHTML = old; svg.appendChild(g);
      var done = function(){ if(g.parentNode) g.parentNode.removeChild(g); };
      if(g.animate){ var an = g.animate([{ opacity: 1 }, { opacity: 0 }], { duration: K.reduced() ? 240 : 300, easing: 'ease-out' }); an.onfinish = done; setTimeout(done, 500); } else done();
    }

    /* ---------------------------------------------------- the one loop: the magnifier grows in, zooms and leaves */
    var raf = 0, lastT = 0;
    function kick(){ if(!raf && S.ready) { lastT = 0; raf = requestAnimationFrame(frame); } }
    function frame(t){
      raf = 0;
      var dt = lastT ? Math.min(0.05, (t - lastT) / 1000) : 0.016; lastT = t;
      var want = lensWanted() ? 1 : 0, red = K.reduced(), busy = false;
      if(red) LENS.show = want;
      else if(Math.abs(LENS.show - want) > 0.001){ LENS.show += (want - LENS.show) * Math.min(1, dt * 12); if(Math.abs(LENS.show - want) < 0.01) LENS.show = want; busy = true; }
      var target = LENS.frozen != null ? LENS.frozen : 2.2 * Math.abs(S.h);
      if(LENS.show === 0 || red || slide.playing()) LENS.w = target;
      else if(Math.abs(Math.log(LENS.w / target)) > 0.002){ LENS.w = Math.exp(Math.log(LENS.w) + (Math.log(target) - Math.log(LENS.w)) * Math.min(1, dt * 9)); busy = true; }
      else LENS.w = target;
      draw();
      if(busy) raf = requestAnimationFrame(frame);
    }

    /* ---------------------------------------------------- Drive across (tab 1) and Slide Q in (tab 2) */
    var D = { x0: 0, x1: 0 };
    function driveStart(){
      userActs(); hideCue(true); tourDid('drive');
      var F = S.F, x0 = F.x[0], x1 = F.x[1];
      for(var i = 0; i <= 400 && !isFinite(F.f(x0)); i++) x0 += (F.x[1] - F.x[0]) / 400;
      for(var j = 0; j <= 400 && !isFinite(F.f(x1)); j++) x1 -= (F.x[1] - F.x[0]) / 400;
      var pad = (F.x[1] - F.x[0]) * 0.01;
      D = { x0: M.round(x0, 4), x1: M.round(x1, 4), lo: M.round(x0, 4), hi: M.round(x1, 4) };
      if(K.reduced()) fade();
      S.trace = []; S.driveV = 0; S.dir = 1;
      S.a = D.x0; recompute(); addVisit(S.a, S.a); hp.value(S.a);
      return true;
    }
    function driveTo(v){
      S.driveV = v;
      var a = M.round(D.x0 + (D.x1 - D.x0) * v, 4);
      // land exactly on a corner or jump on the way, so the drive shows it
      var sp = specials().filter(function(x){ return (x - S.a) * (x - a) < 0; });
      if(sp.length) a = sp[0];
      if(!isFinite(S.F.f(a))) a = validA(a);
      if(a == null) return;
      hp.value(a); moveP(a, true);
    }
    function driveEnd(){
      S.driveV = 1; drive.paint(); addVisit(D.lo, D.hi); draw();
      var sp = (S.F.special || []).map(function(s){ return s.kind; }), kinds = { corner: 'corner', cusp: 'cusp', vertical: 'vertical tangent', jump: 'jump', endpoint: 'end' };
      var extra = sp.filter(function(k){ return k !== 'endpoint'; }).map(function(k){ return kinds[k]; });
      S.took = extra.length ? 'f′ is the slope of f. At the ' + extra.join(' and ') + ' f has no slope, so f′ has no value.' : 'f′ is the slope of f: above the axis where f rises, below where it falls.';
      wKey = ''; words(); say(S.took); refLater();
    }
    var SL = { h0: 1, side: 1, out: false };
    function slideStart(){
      userActs(); hideCue(true); tourDid('slide');
      var ah = Math.abs(S.h);
      SL = { side: S.h < 0 ? -1 : 1, out: ah <= TT.HMIN * 1.01, h0: ah };
      if(SL.out){ var back = validH(SL.side * 1) != null ? 1 : Math.min(1, hmax()); SL.h0 = back; }
      if(K.reduced()) fade();
      S.slideV = 0;
      return true;
    }
    function slideTo(v){
      S.slideV = v;
      var h = SL.out ? SL.side * TT.HMIN * Math.pow(SL.h0 / TT.HMIN, v) : SL.side * SL.h0 * Math.pow(TT.HMIN / SL.h0, v);
      h = snapH(h);
      if(validH(h) == null) return;
      S.h = h; hq.value(h);
      LENS.w = 2.2 * Math.abs(h);
      kick(); draw();
    }
    function slideEnd(){
      if(SL.out){ S.slideV = 0; slide.paint(); S.took = null; wKey = ''; words(); say(cause.text()); refLater(); return; }
      S.slideV = 1; slide.paint();
      var c = S.cls || {}, A = sv(S.a), m = slopeNow();
      if(c.kind === 'smooth' && isFinite(m)) S.took = 'As h → 0 the secant slopes close in on f′(' + A + ') = ' + fmtN(m) + ', the tangent’s slope.';
      else if(c.kind === 'corner') S.took = 'The two sides close in on ' + fmtN(c.L) + ' and ' + fmtN(c.R) + ': they disagree, so f′(' + A + ') does not exist.';
      else S.took = 'The secant slopes do not close in on one number: f′(' + A + ') does not exist.';
      wKey = ''; words(); say(S.took); refLater();
    }

    /* ---------------------------------------------------- the first visit cue and "Show me how" */
    var cue = K.cue(layer, { key: 'apcalc-tangent-tracer', text: 'Drag P along the road', side: 'left',
      at: function(){ return G ? [G.A.sx(S.a) - 16, G.A.sy(fa())] : [0, 0]; } });
    function hideCue(used){ if(cue.active()) cue.hide(used); }
    stage.addEventListener('keydown', function(e){ if(/^(Arrow|Page|Home|End)/.test(e.key)) hideCue(true); }, true);
    var tour = K.tour({ key: 'apcalc-tangent-tracer', label: 'Show me how', steps: [
      { id: 'drag', text: 'Drag P along the road. The car points along the tangent.', target: function(){ return hp.knob; } },
      { id: 'read', text: 'The slope is on P, and the pen draws it below as the height of f′.', target: function(){ return G ? rectOf(G.B) : scene; } },
      { id: 'drive', text: 'Press Drive across to draw all of f′.', target: function(){ return drive.el; } }],
      onClose: function(had){ if(had) try{ head.how.focus({ preventScroll: true }); }catch(e){} } });
    var tour2 = K.tour({ key: 'apcalc-tangent-tracer-2', label: 'Show me how', steps: [
      { id: 'dragq', text: 'Drag Q toward P. The secant through them turns.', target: function(){ return hq.knob; } },
      { id: 'look', text: 'Close in, the magnifier shows the secant and the tangent becoming one line.', target: function(){ return scene; } },
      { id: 'slide', text: 'Press Slide Q in to take h all the way to 0.001.', target: function(){ return slide.el; } }],
      onClose: function(had){ if(had) try{ head.how.focus({ preventScroll: true }); }catch(e){} } });
    function rectOf(F){ var r = scene.getBoundingClientRect(), k = layer.scale(); return { left: r.left + F.L * k, top: r.top + F.T * k, width: F.W * k, height: F.H * k, right: r.left + F.R * k, bottom: r.top + F.B * k }; }
    function tourDid(x){ [tour, tour2].forEach(function(t){ if(t.active()) t.did(x); }); }
    function startTour(){ if(S.mode !== 'explore') return; hideCue(false); (S.tab === 'slope' ? tour : tour2).start(true); }

    /* ---------------------------------------------------- presses on the picture */
    scene.addEventListener('pointerdown', function(e){
      if(!G || e.target.closest('.tk2-knob, .tk2-cue, button')) return;
      if(e.pointerType === 'mouse' && e.button !== 0) return;
      var r = scene.getBoundingClientRect(), k = layer.scale() || 1, x = (e.clientX - r.left) / k, y = (e.clientY - r.top) / k, A = G.A, B = G.B;
      hideCue(true);
      var inA = x >= A.L - 6 && x <= A.R + 6 && y >= A.T - 6 && y <= A.B + 6, xv = A.ix(x), fy = S.F.f(xv), nearRoad = isFinite(fy) && Math.abs(A.sy(fy) - y) < 30;
      if(S.tab === 'slope'){
        var inB = B && x >= B.L - 6 && x <= B.R + 6 && y >= B.T - 6 && y <= B.B + 6;
        if((inA && nearRoad) || inB) hp.grab(e);
      } else if(inA && nearRoad){
        if(Math.abs(x - A.sx(S.a)) < 18) hp.grab(e); else hq.grab(e);
      }
    });

    /* ---------------------------------------------------- the picker and your own curve */
    pick.addEventListener('change', function(){
      userActs();
      if(pick.value === 'own'){ pick.value = S.F.custom ? 'custom' : S.F.id; if(LS){ LS.open('details'); setTimeout(function(){ var i = ref.querySelector('.tt2-own input'); if(i) i.focus(); }, 80); } return; }
      if(pick.value === 'custom') return;
      setF(TT.FUNCS[pick.value]);
    });
    var ownT = null;
    function goOwn(inp, out){
      var c = TT.custom(inp.value);
      if(!c.ok){ out.innerHTML = '<span class="calc-expr-err">' + esc(c.error || 'Type a function of x.') + '</span>'; return; }
      c.y = autoY(c.f, -4, 4); c.dy = autoY(c.dn, -4, 4, 0.08); c.a = 1; c.h = 1;
      if(!isFinite(c.f(c.a))){ for(var x = -4; x <= 4; x += 0.25) if(isFinite(c.f(x)) && isFinite(c.f(x + 0.5))){ c.a = x; break; } }
      var o = pick.querySelector('option[value="custom"]');
      if(!o){ o = document.createElement('option'); o.value = 'custom'; pick.insertBefore(o, opOwn); }
      o.textContent = 'Your function';
      pick.value = 'custom';
      if(LS) LS.close();
      setF(c);
    }

    /* ---------------------------------------------------- "?": the numbers, the table, the limit, your own curve */
    var ref = el('div', 'ls-sec tt2-ref'), refT = null;
    function refLater(){ clearTimeout(refT); refT = setTimeout(refHtml, hp.dragging() || hq.dragging() || drive.playing() || slide.playing() ? 300 : 60); }
    function refHtml(){
      var F = S.F, a = S.a, y0 = fa(), c = S.cls || {}, m = slopeNow(), h = S.h, fq = F.f(a + h), sec = TT.dq(F.f, a, h), A = texN(a), H = texN(h);
      var own = ref.querySelector('.tt2-own'), keep = own ? own.querySelector('input').value : '';
      var aph = h < 0 ? A + ' - ' + texN(-h) : A + ' + ' + H;
      var rows = [['a', sv(a)], ['f(a)', F3(y0)], ['h', hText(h)], ['f(a + h)', F3(fq)], ['Secant slope', F3(sec)], ['f′(a)', c.kind === 'smooth' ? F3(m) : 'does not exist']];
      var tab = TT.table(F.f, a), lim = c.kind === 'smooth' ? 'f′(' + sv(a) + ') = ' + F3(m) : c.kind === 'corner' ? F3(c.L) + ' and ' + F3(c.R) + ': they disagree' : c.kind === 'undefined' ? '—' : 'no finite limit';
      var html = '<p class="tt2-howref"><button type="button" class="tk2-how" data-how>Show me how</button> to use it, step by step.</p>' +
        '<h3 class="ls-title-l">This point</h3><table class="ls-tbl tt-ntbl"><caption class="sr-only">Values at P</caption><tbody>' + rows.map(function(r){ return '<tr><th scope="row">' + r[0] + '</th><td class="r">' + esc(r[1]) + '</td></tr>'; }).join('') +
        (c.kind === 'smooth' ? '<tr><th scope="row">Tangent line</th><td class="r">' + mm(TT.line(+M.round(a, 6), +M.round(y0, 6), +M.round(m, 3)).tex) + '</td></tr>' : '') + '</tbody></table>' +
        '<h3 class="ls-title-l">Secant slopes as h → 0</h3><div class="table-wrap" tabindex="0" role="region" aria-label="Secant slopes closing in"><table class="tt-dq"><caption>Slopes ' + mm('\\frac{f(a+h)-f(a)}{h}') + ' at a = ' + esc(sv(a)) + '</caption>' +
        '<thead><tr><th scope="col">|h|</th><th scope="col">Q on the left</th><th scope="col">Q on the right</th></tr></thead><tbody>' +
        tab.map(function(r){ return '<tr><th scope="row">' + n(r.h) + '</th><td>' + F3(r.left) + '</td><td>' + F3(r.right) + '</td></tr>'; }).join('') +
        '</tbody><tfoot><tr><th scope="row">h → 0</th><td colspan="2">' + esc(lim) + '</td></tr></tfoot></table></div>' +
        '<h3 class="ls-title-l">The slope of the secant line</h3><p>Q is ' + (h > 0 ? 'to the right' : 'to the left') + ' of P, at distance h = ' + esc(hText(h)) + '. The secant through P and Q has slope</p>' +
        (isFinite(sec) ? mm('\\frac{f(' + aph + ') - f(' + A + ')}{' + H + '} = \\frac{' + texN(fq) + ' - ' + paren(y0) + '}{' + H + '} \\approx ' + texN(sec), true) : '<p>Q is off the graph here: f(a + h) is not defined.</p>') +
        '<h3 class="ls-title-l">The derivative is the limit as h → 0</h3>';
      if(c.kind === 'smooth'){
        html += mm("f'(" + A + ') = \\lim_{h \\to 0} \\frac{f(' + A + ' + h) - f(' + A + ')}{h} \\approx ' + texN(m), true) +
          '<p>From either side the secant slopes close in on the same number, so the limit exists. That number is the slope of the tangent line, and the height of f′ at x = ' + esc(sv(a)) + '.</p>';
      } else if(c.kind === 'corner' || c.kind === 'vertical' || c.kind === 'cusp'){
        html += mm('\\lim_{h \\to 0^-} \\frac{f(' + A + ' + h) - f(' + A + ')}{h} = ' + texN(c.L), true) + mm('\\lim_{h \\to 0^+} \\frac{f(' + A + ' + h) - f(' + A + ')}{h} = ' + texN(c.R), true) +
          '<p>' + (c.kind === 'corner' ? 'The one-sided limits disagree, so the two-sided limit does not exist.' : c.kind === 'vertical' ? 'The secants get steeper and steeper from both sides: the tangent is vertical, and a vertical line has no slope.' : 'The two sides get infinitely steep in opposite directions: a cusp.') +
          ' f is not differentiable at x = ' + esc(sv(a)) + ', though it is continuous there: continuous does not mean differentiable.</p>';
      } else if(c.kind === 'jump') html += '<p>f is not continuous at x = ' + esc(sv(a)) + ': the road breaks. From the side of the jump, f(a + h) − f(a) does not shrink while h does, so the quotient blows up. A differentiable function must be continuous.</p>';
      else if(c.kind === 'endpoint') html += '<p>Only one side of P is on the curve, so the two-sided limit cannot exist.' + (Math.abs(c.R) === Infinity || Math.abs(c.L) === Infinity ? ' From that side the slopes grow without bound: the road starts with a vertical tangent.' : '') + '</p>';
      html += '<h3 class="ls-title-l">The graph of f′</h3><p>The graph paper under the road has the slope of f as its height. Where f rises, f′ is above the axis; where f falls, below; at a peak or valley of f, f′ = 0.</p>' +
        '<h3 class="ls-title-l">The curve</h3>' + mm(F.tex, true) + (F.dTex ? '<p class="bt-small">Its derivative (the rules come in topics 2.5 to 2.7):</p>' + mm(F.dTex, true) : '<p class="bt-small">For a typed function the tool estimates f′ with central differences and checks each side of P separately.</p>') +
        '<h3 class="ls-title-l">Your own curve</h3><div class="tt2-own"><div class="tt-ownrow"><span class="tt-ownl" aria-hidden="true">' + mm('f(x) =') + '</span><label class="sr-only" for="' + id + '-own">Type a function of x</label>' +
        '<input type="text" id="' + id + '-own" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="x^3 - 2x"><button type="button" class="bt-btn tt-owngo">Graph it</button></div>' +
        '<div class="calc-expr-preview tt-ownp" aria-live="polite"><span class="bt-small">Try x^3 - 2x, sin(2x), |x - 1| or sqrt(x).</span></div></div>' +
        '<p class="bt-small">How it is drawn: the centre line of the road is exactly y = f(x) on the grid; the car is turned to the tangent; the tool computes slopes from the exact derivatives of the curves in the list and checks each side of P separately; for a typed function it uses difference quotients with very small h. The magnifier keeps Q halfway out from P, so its zoom grows as h shrinks.</p>' +
        '<details class="tt-keys"><summary>Keyboard</summary><p class="bt-small">Tab to P: ← → move it along the curve (Shift: ten steps), Home and End go to the ends; a corner, cusp or jump is a stop. Tab to Q (Secant to tangent): ← → move it, Page Down makes h ten times smaller, Page Up ten times bigger, Home and End put it at h = −1 and h = 1.</p></details>' +
        '<p class="tool-about-n">Notes for this topic: <a href="../notes/derivative-definition.html">The Derivative and Its Notation</a></p>';
      ref.innerHTML = html;
      var inp = ref.querySelector('.tt2-own input'), out = ref.querySelector('.tt-ownp');
      if(keep) inp.value = keep;
      inp.addEventListener('input', function(){
        clearTimeout(ownT);
        ownT = setTimeout(function(){ var v = inp.value.trim(), r = v ? M.read(v, { vars: ['x'] }) : null; out.innerHTML = !r ? '<span class="bt-small">Try x^3 - 2x, sin(2x), |x - 1| or sqrt(x).</span>' : r.ok ? '<span class="bt-small">Reads as</span> ' + mm('f(x) = ' + r.tex) : '<span class="calc-expr-err">' + esc(r.error) + '</span>'; }, 120);
      });
      inp.addEventListener('keydown', function(e){ if(e.key === 'Enter'){ e.preventDefault(); goOwn(inp, out); } });
      ref.querySelector('.tt-owngo').addEventListener('click', function(){ goOwn(inp, out); });
    }
    ref.addEventListener('click', function(e){ var b = e.target.closest('[data-how]'); if(!b) return; if(LS) LS.close(); setTimeout(startTour, 60); });

    /* ---------------------------------------------------- layout */
    var lastWH = '';
    function layout(){
      if(stage.hidden || !stage.isConnected) return;
      var r = scene.getBoundingClientRect(), W = Math.round(r.width), H = Math.round(r.height);
      if(W < 200 || H < 200) return;
      svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H); svg.setAttribute('width', W); svg.setAttribute('height', H);
      G = geo(W, H); lastWH = W + 'x' + H;
      drawStatic(); draw();
    }
    if(window.ResizeObserver){ var rt = 0; new ResizeObserver(function(){ var r = scene.getBoundingClientRect(); if(Math.round(r.width) + 'x' + Math.round(r.height) === lastWH) return; cancelAnimationFrame(rt); rt = requestAnimationFrame(layout); }).observe(scene); }
    else window.addEventListener('resize', layout);

    function boot(){
      S.ready = true;
      recompute(); addVisit(S.a, S.a);
      head.purpose('The derivative is the slope of the curve at each point.');
      slide.el.hidden = true; hq.hide(true);
      refHtml(); layout();
      setTimeout(function(){ layout(); if(S.mode === 'explore' && !tour.active()) cue.show(); }, 60);
    }
    function shown(m){
      S.mode = m;
      if(m !== 'explore'){ drive.stop(); slide.stop(); tour.stop(); tour2.stop(); hideCue(false); return; }
      setTimeout(function(){ layout(); if(!tour.active() && !tour2.active()) cue.show(); }, 40);
    }
    return {
      kit2: function(pane, s){ LS = s; boot(); return { stage: stage, ref: ref }; },
      plain: function(){ host.appendChild(stage); host.appendChild(ref); boot(); },
      shown: shown, stop: function(){ drive.stop(); slide.stop(); },
      redraw: function(){ layout(); },
      // for the sweep test and the browser checks only
      _t: { S: S, LENS: LENS, G: function(){ return G; }, hp: hp, hq: hq, drive: drive, slide: slide, cause: cause, setF: setF, setTab: setTab, moveP: function(v){ hp.value(v, true); }, setH: function(v){ hq.value(v, true); } }
    };
  }

  /* ========================================================= TEST YOURSELF */
  /* The shared drill (ApCalcTools.drill), the stepper every other calculus
     trainer uses (docs/tool-audit-2026-10.md): the figure is the drill's
     stage, each step is a drill step (the sketch of f′ a custom step drawn
     and graded here), the method hint comes before Show the answer, and
     each try is drawn on the figure: the student's slope, line or graph
     dashed, the right one solid. */
  function quiz(host, data){
    var id = 'tq' + (++uid), Q = { p: null, figEl: null, sized: null, figState: null, SK: null, live: null };
    // The model's TeX strings render once, so the drill shows them as HTML.
    function texify(p){
      p.text = '<p>' + tx(p.text) + '</p>';
      p.solution = p.solution.map(tx);
      p.steps.forEach(function(s){
        s.label = tx(s.label);
        if(s.hint) s.hint = tx(s.hint);
        if(s.why) s.why = s.why.map(tx);
        if(s.cell && s.cell.mistakes) s.cell.mistakes.forEach(function(mk){ mk.why = tx(mk.why); });
        if(s.kind === 'choice'){
          if(s.pics){ s.optionsHtml = s.pics.map(function(g){ return '<span class="tt-pic">' + miniGraph(g) + '</span><span class="sr-only">' + esc(g.label.replace(/^Graph \d+: /, '')) + '</span>'; }); s.picLabel = 'Graph'; s.options = s.options.map(function(o){ return esc(o.replace(/^Graph \d+: /, '')); }); }
          else s.options = s.options.map(function(o){ return '<span class="tt-opt">' + tx(o) + '</span>'; });
        }
        if(s.kind === 'sketch'){ s.kind = 'custom'; s.checkLabel = 'Check my sketch'; }
      });
      return p;
    }
    // Defined before the drill starts: the hint ladder reads the method as the first problem is drawn.
    var METHOD = {
      'estimate.slope': 'Count the grid squares between the two marked points on the tangent line: rise (up or down) over run (across).',
      compare: 'Picture the tangent line at B: is it steeper upward than the one at a, or less steep? Compare slopes, not heights.',
      interval: 'Use the two times closest to the time on either side of it, so the secant is as close to the tangent as the table allows.',
      'table.value': 'Change in the quantity divided by change in time between those two rows.',
      units: 'A rate of change has the units of the quantity per unit of time.',
      graph: 'Where f is flat, f′ = 0; where f rises, f′ is above the axis; where it falls, below.',
      zeros: 'The tangent to f is flat at its peaks and valleys: f′ = 0 there.',
      sketch: 'Above the axis where f rises, below where it falls, on the axis where f is flat; steeper means farther from the axis.',
      'tanline.slope': 'The slope of the tangent line at x = a is f′(a): read it in the f′ row of the table.',
      value: 'Put x = a into f to get the point of tangency.',
      'tanline.line': 'Point-slope form: y = f(a) + f′(a)(x − a), with the numbers from the earlier steps.',
      line: 'Point-slope form: y = f(a) + f′(a)(x − a), with the numbers from the earlier steps.',
      where: 'Zoom in on each dashed line in your mind: smooth curves look straight; a corner, cusp, vertical tangent or break does not.',
      why: 'Compare the slopes from the left and the right, and check whether the graph is unbroken.',
      continuous: 'Continuous means no hole and no jump: you can draw through that x without lifting the pencil.'
    };
    METHOD['tanline.value'] = METHOD.value;

    T.drill(host, data, { slug: SLUG, noun: 'drill', typeLabel: 'Kind of problem',
      types: TT.TYPES.map(function(t){ return { value: t.value, label: t.label }; }),
      generate: function(r, ctx, type){ return texify(TT.generate(r, ctx, type)); },
      title: function(p){ var t = TT.TYPES.filter(function(x){ return x.value === p.type; })[0]; return t ? t.label : 'Practice problem'; },
      detailsHtml: '<details class="tt-keys"><summary>Keyboard</summary><p class="bt-small">Sketch steps: Tab to a point, then ↑ ↓ move it (Page Up and Page Down move it farther), 0 puts it on the axis, Enter keeps it where it is. Every other step is a form: Tab, type or choose, then Enter.</p></details>',
      extra: function(el, p){ Q.p = p; Q.figState = { marks: {}, typed: null, mine: {} }; buildFig(el); },
      onStep: function(s){ afterStep(s); },
      onInput: function(s, raw){ if(s.line){ var g = raw ? T.fnOf(raw, ['x']) : null; Q.figState.typed = g; redrawFig(); } },
      onTry: function(s, t){ return tryOn(s, t); },
      note: function(s, t){ return s.kind === 'expr' && s.line && t.raw ? lineNote(t.raw, s.line) : ''; },
      method: function(s, p){ return p.type === 'tanline' && s.key === 'slope' && s.kind === 'num' ? 'Differentiate f, then put x = a into f′.' : METHOD[p.type + '.' + s.key] || METHOD[s.key] || ''; },
      custom: function(s){ return sketchStep(s); }
    });


    /* ---------------- the stage figure ---------------- */
    function buildFig(host2){
      var p = Q.p, f = p.fig, figEl = document.createElement('div');
      host2.appendChild(figEl); Q.figEl = figEl; Q.SK = null;
      figEl.className = 'tt-qfig tt-fig-' + f.kind;
      if(f.kind === 'graph'){
        figEl.innerHTML = '<div class="tt-fbox"></div>';
        Q.sized = fit(figEl.querySelector('.tt-fbox'), drawGraph);
      } else if(f.kind === 'table' || f.kind === 'given' || f.kind === 'formula'){
        var top = '';
        if(f.kind === 'table'){
          top = '<div class="table-wrap" tabindex="0" role="region" aria-label="Table of values"><table class="tt-vt"><caption class="sr-only">Values of ' + esc(f.F) + '(' + esc(f.t) + ')</caption><tbody><tr><th scope="row">' + tx('$' + f.t + '$') + ' <span class="tt-u">(' + esc(f.tu) + ')</span></th>' + f.ts.map(function(t, j){ return '<td data-c="' + j + '">' + t + '</td>'; }).join('') + '</tr>' +
            '<tr><th scope="row">' + tx('$' + f.F + '(' + f.t + ')$') + ' <span class="tt-u">(' + esc(f.unit) + ')</span></th>' + f.vs.map(function(v, j){ return '<td data-c="' + j + '">' + v + '</td>'; }).join('') + '</tr></tbody></table></div>';
        } else if(f.kind === 'given'){
          top = '<div class="table-wrap" tabindex="0" role="region" aria-label="Values of f and its derivative"><table class="tt-vt"><caption class="sr-only">Values of f and f′</caption><tbody>' +
            '<tr><th scope="row">' + tx('$x$') + '</th>' + f.xs.map(function(x, j){ return '<td data-c="' + j + '"' + (x === f.a ? ' class="is-a"' : '') + '>' + sv(x) + '</td>'; }).join('') + '</tr>' +
            '<tr><th scope="row">' + tx('$f(x)$') + '</th>' + f.f.map(function(v, j){ return '<td data-c="' + j + '"' + (f.xs[j] === f.a ? ' class="is-a"' : '') + '>' + sv(v) + '</td>'; }).join('') + '</tr>' +
            '<tr><th scope="row">' + tx("$f'(x)$") + '</th>' + f.d.map(function(v, j){ return '<td data-c="' + j + '"' + (f.xs[j] === f.a ? ' class="is-a"' : '') + '>' + sv(v) + '</td>'; }).join('') + '</tr></tbody></table></div>';
        } else top = '<p class="tt-formula">' + mm(f.tex, true) + '</p>';
        figEl.innerHTML = '<div class="tt-ftop">' + top + '</div><div class="tt-fbox"></div>';
        Q.sized = fit(figEl.querySelector('.tt-fbox'), drawGraph);
      } else if(f.kind === 'sketch'){
        figEl.innerHTML = '<div class="tt-fbox tt-sk"><svg class="calc-plot tt-svg tt-sksvg" role="group" aria-labelledby="' + id + '-skd"><title id="' + id + '-skd">The graph of f, and a grid to sketch f′ on</title><defs class="tt-skdefs"></defs><g class="tt-skbg"></g><g class="tt-skpts"></g></svg></div><p class="sr-only tt-qlive" aria-live="polite"></p>';
        Q.live = T.announcer(figEl.querySelector('.tt-qlive'));
        setupSketch();
        Q.sized = fit(figEl.querySelector('.tt-fbox'), drawSketch);
      }
      // the stage has its size only once placed: draw again then
      setTimeout(redrawFig, 0); setTimeout(redrawFig, 120);
    }
    function redrawFig(){ if(Q.sized) Q.sized.redraw(); }
    function plotSpec(w, h){
      var p = Q.p, f = p.fig, base = f.kind === 'graph' ? f : f.kind === 'table' ? tableSpec(w) : f.plot, s = JSON.parse(JSON.stringify(base));
      s.width = w; s.height = h;
      s.curves = (s.curves || []).slice(); s.lines = (s.lines || []).slice(); s.points = (s.points || []).slice(); s.labels = (s.labels || []).slice();
      var mk = Q.figState.marks;
      if(p.type === 'estimate' && mk.tangentAt){ s.curves.push({ fn: (function(b, mb, fb){ return function(x){ return Math.abs(x - b) < 1.6 ? fb + mb * (x - b) : NaN; }; })(p.b, p.mb, p.fig.points[2].at[1]), cls: 's4 tt-tanb', dashed: true }); }
      if(p.type === 'whichgraph' && mk.fprime) s.curves.push({ fn: p.d, cls: 's2', label: "f′" });
      if(p.type === 'table'){
        var F = p.fig, i = F.i; s.points = F.ts.map(function(t, j){ return { at: [t, F.vs[j]], cls: j === i || j === i + 1 ? (mk.interval ? 's5' : 's1') : 's1' }; });
        if(mk.interval) s.lines.push({ through: [[F.ts[i], F.vs[i]], [F.ts[i + 1], F.vs[i + 1]]], cls: 's5' });
        s.lines.push({ through: [[F.c, -1e6], [F.c, 1e6]], cls: 'tt-guide', dashed: true });
      }
      if(p.type === 'tanline'){
        if(Q.figState.typed) s.curves.push({ fn: Q.figState.typed, cls: 's5 tt-yours', dashed: true, label: 'yours' });
        if(mk.line) s.curves.push({ fn: p.line.fn, cls: 's4', label: 'tangent' });
      }
      return s;
    }
    /* Marks over the plot in its own coordinates: the rise and run of the
       tangent, a ring at the point in question, and each try (yours dashed,
       the right one solid). */
    function overlay(Fr){
      var p = Q.p, mk = Q.figState.marks, mine = Q.figState.mine, o = [], X = function(v){ return r1(Fr.sx(v)); }, Y = function(v){ return r1(Fr.sy(v)); };
      if(p.type === 'estimate' && mk.triangle){
        var a0 = p.fig.points[0].at, b0 = p.fig.points[1].at;
        o.push('<path class="tt-tri tt-tri-q" d="M' + X(a0[0]) + ' ' + Y(a0[1]) + 'H' + X(b0[0]) + 'V' + Y(b0[1]) + '"/>');
        o.push('<text class="tt-tril tt-c5" x="' + r1((Fr.sx(a0[0]) + Fr.sx(b0[0])) / 2) + '" y="' + r1(Fr.sy(a0[1]) + (b0[1] > a0[1] ? 16 : -7)) + '" text-anchor="middle">run ' + sv(b0[0] - a0[0]) + '</text>');
        o.push('<text class="tt-tril tt-c5" x="' + r1(Fr.sx(b0[0]) + 7) + '" y="' + r1((Fr.sy(a0[1]) + Fr.sy(b0[1])) / 2 + 4) + '">rise ' + sv(b0[1] - a0[1]) + '</text>');
      }
      if(p.type === 'notdiff' && mk.zoom){ var yc = p.f(p.c); if(!isFinite(yc)) yc = 0; o.push('<circle class="tt-ring-c" cx="' + X(p.c) + '" cy="' + Y(Math.max(Fr.y[0], Math.min(Fr.y[1], yc))) + '" r="16"/>'); }
      var list = [];
      Object.keys(mine).forEach(function(k){ list = list.concat(mine[k]); });
      return o.join('') + T.markSvg(Fr, list);
    }
    function tableSpec(w){
      var F = Q.p.fig, lo = Math.min.apply(null, F.vs), hi = Math.max.apply(null, F.vs), pad = Math.max(2, (hi - lo) * 0.15), nw = w < 520;
      return { label: 'The data from the table: ' + F.F + ' against ' + F.t + ', with the time t = ' + F.c + ' marked', x: [F.ts[0] - 0.5, F.ts[4] + (nw ? 0.5 + (F.ts[4] - F.ts[0]) * 0.1 : 0.5)], y: [Math.floor(lo - pad), Math.ceil(hi + pad)], xLabel: nw ? F.t : F.t + ' (' + F.tu + ')', yLabel: F.F + ' (' + F.unit + ')' };
    }
    function drawGraph(w, h){
      var figEl = Q.figEl, box = figEl && figEl.querySelector('.tt-fbox'); if(!box) return;
      var s = plotSpec(w, h), svgS = '';
      try{ svgS = P.svg(s); }catch(e){ svgS = ''; }
      box.innerHTML = svgS.replace(/<\/svg>$/, overlay(P.frame(s)) + '</svg>');
      var sv0 = box.querySelector('svg'); if(sv0) sv0.classList.add('tt-qsvg');
      if(Q.p.type === 'table'){
        var F = Q.p.fig, i = F.i, on = Q.figState.marks.interval, pick = Q.figState.pick;
        figEl.querySelectorAll('.tt-vt td').forEach(function(td){ var j = +td.getAttribute('data-c'); td.classList.toggle('is-pick', !!on && (j === i || j === i + 1)); td.classList.toggle('is-yours', !on && pick != null && pick.indexOf(j) > -1); });
      }
    }
    function afterStep(s){
      var p = Q.p, mk = Q.figState.marks;
      if(p.type === 'estimate' && s.key === 'slope') mk.triangle = true;
      if(p.type === 'estimate' && s.key === 'compare') mk.tangentAt = true;
      if(p.type === 'table' && s.key === 'interval'){ mk.interval = true; Q.figState.pick = null; }
      if(p.type === 'whichgraph' && s.key === 'graph') mk.fprime = true;
      if(p.type === 'notdiff' && s.key === 'where') mk.zoom = true;
      if(p.type === 'tanline' && s.key === 'line') mk.line = true;
      redrawFig();
    }
    /* Each try on the figure: the student's dashed, the right one solid. */
    function tryOn(s, t){
      var p = Q.p, who = t.ok || t.shown ? 'right' : 'yours', mine = Q.figState.mine, mk = [], val = who === 'right' && s.kind === 'num' ? s.cell.answer : t.value, k = s.key;
      var keepYours = function(){ return (mine[k] || []).filter(function(m){ return m.who === 'yours'; }); };
      if(p.type === 'estimate' && k === 'slope' && isFinite(val)){
        var a0 = p.fig.points[0].at;
        mk.push({ tangent: a0, slope: val, half: 1.8, who: who, label: (who === 'yours' ? 'yours: slope ' : 'slope ') + sv(M.round(val, 3)) });
      } else if(p.type === 'estimate' && k === 'compare' && t.pick > -1 && who === 'yours'){
        // the picked order, as a tangent at B steeper or shallower than at a
        var fb = p.fig.points[2].at[1], sl = t.pick === 0 ? p.m + 1.5 : t.pick === 1 ? p.m - 1.5 : p.m;
        mk.push({ tangent: [p.b, fb], slope: sl, half: 1.2, who: 'yours', label: 'yours' });
      } else if(p.type === 'table' && k === 'interval' && t.pick > -1 && who === 'yours'){
        // the two picked times, highlighted in the table and joined on the plot
        var F = p.fig, ts = T.choiceMarks(s.options[t.pick], 't').xs, js = ts.map(function(x){ return F.ts.indexOf(x); }).filter(function(j){ return j > -1; });
        Q.figState.pick = js;
        if(js.length === 2) mk.push({ line: [[F.ts[js[0]], F.vs[js[0]]], [F.ts[js[1]], F.vs[js[1]]]], who: 'yours', label: 'your secant' });
      } else if(p.type === 'table' && k === 'value' && isFinite(val)){
        var G = p.fig, yc = G.vs[G.i] + (G.vs[G.i + 1] - G.vs[G.i]) * (G.c - G.ts[G.i]) / (G.ts[G.i + 1] - G.ts[G.i]);
        mk.push({ tangent: [G.c, yc], slope: val, half: (G.ts[4] - G.ts[0]) / 5, who: who, label: (who === 'yours' ? 'yours: ' : '') + sv(M.round(val, 3)) + ' ' + G.unit + '/' + G.tu.replace(/s$/, '') });
      } else if(p.type === 'whichgraph' && k === 'zeros' && t.pick > -1){
        // x-values where f is flat, as lines: a point on y = 0 would read as a zero of f
        T.choiceMarks(s.options[t.pick], 'x').xs.forEach(function(x, j){ mk.push({ vline: x, who: who, label: who === 'yours' ? (j ? '' : 'yours') : 'x = ' + T.numText(x) }); });
      } else if(p.type === 'tanline' && (k === 'value' || k === 'slope') && isFinite(val)){
        if(k === 'value') mk.push({ point: [p.a, val], who: who, label: (who === 'yours' ? 'yours: ' : '') + '(' + sv(p.a) + ', ' + sv(M.round(val, 3)) + ')' });
        else mk.push({ tangent: [p.a, p.fa], slope: val, half: 1.4, who: who, label: (who === 'yours' ? 'yours: slope ' : 'slope ') + sv(M.round(val, 3)) });
      } else if(p.type === 'tanline' && k === 'slope' && t.pick > -1){
        var vv = T.plainText(s.options[t.pick]).replace(/−/g, '-'), sl2 = parseFloat(vv);
        if(isFinite(sl2)) mk.push({ tangent: [p.a, p.fa], slope: sl2, half: 1.4, who: who, label: (who === 'yours' ? 'yours: slope ' : 'slope ') + sv(sl2) });
      } else if(p.type === 'tanline' && k === 'line'){
        // the typed line is already drawn live (dashed); the right one appears with the step
        return who === 'yours' && !!t.fn ? 'Your line is drawn dashed on the graph: it should touch the curve at the point and match its steepness there.' : false;
      } else if(p.type === 'notdiff' && k === 'where' && t.pick > -1 && who === 'yours'){
        var xw = p.marks[t.pick]; if(xw != null){ var yw = p.f(xw); mk.push({ point: [xw, isFinite(yw) ? yw : 0], who: 'yours', label: 'yours: smooth here' }); }
      } else return false;
      if(!mk.length) return false;
      if(who === 'right') mk = keepYours().concat(mk);
      mine[k] = mk; redrawFig();
      return true;
    }

    /* ---------------- the sketch of f′: a custom drill step ---------------- */
    function setupSketch(){
      var st = Q.p.steps[0], figEl = Q.figEl;
      var SK = Q.SK = { vals: st.xs.map(function(){ return null; }), marks: null, show: false, locked: false, G: null, sel: 0 };
      var pts = figEl.querySelector('.tt-skpts'), svgEl = figEl.querySelector('.tt-sksvg');
      pts.innerHTML = st.xs.map(function(x, j){ return '<g class="tt-skp" data-j="' + j + '" tabindex="0" role="slider" aria-label="f′ at x = ' + sv(x) + '" aria-valuemin="' + n(-st.Y) + '" aria-valuemax="' + n(st.Y) + '"><circle class="tt-hit" r="20"/><circle class="tt-skdot" r="8"/><text class="tt-skq" y="4" text-anchor="middle">?</text><g class="tt-badge" style="display:none"><circle r="9"/><text y="4" text-anchor="middle"></text></g></g>'; }).join('');
      function setV(j, v, say){
        if(SK.locked) return;
        v = Math.max(-st.Y, Math.min(st.Y, Math.round(v / st.snap) * st.snap));
        SK.vals[j] = M.round(v, 4); SK.marks = null; drawSketch();
        if(SK.onChange) SK.onChange();
        if(say && Q.live) Q.live('f′(' + sv(st.xs[j]) + ') set to ' + sv(SK.vals[j]) + '. ' + SK.vals.filter(function(x){ return x != null; }).length + ' of ' + st.xs.length + ' points set.');
      }
      var drag = null;
      function local(e){ var r = svgEl.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; }
      function nearest(px){ var B = SK.G.bot, best = 0; st.xs.forEach(function(x, j){ if(Math.abs(B.sx(x) - px) < Math.abs(B.sx(st.xs[best]) - px)) best = j; }); return Math.abs(B.sx(st.xs[best]) - px) < Math.max(28, (B.sx(1) - B.sx(0)) * 0.6) ? best : -1; }
      svgEl.addEventListener('pointerdown', function(e){
        if(SK.locked || !SK.G) return;
        var pq = local(e), B = SK.G.bot;
        if(pq.y < B.T - 24 || pq.y > B.B + 24) return;
        var j = nearest(pq.x); if(j < 0) return;
        drag = { j: j, moved: false, y0: pq.y };
        SK.sel = j;
        var tgt = e.target.closest('.tt-skp');
        if(!tgt) setV(j, B.iy(pq.y), false); else if(SK.vals[j] == null) setV(j, 0, false);
        try{ svgEl.setPointerCapture(e.pointerId); }catch(x){}
        e.preventDefault();
      });
      svgEl.addEventListener('pointermove', function(e){ if(!drag) return; var pq = local(e); if(Math.abs(pq.y - drag.y0) > 2) drag.moved = true; if(drag.moved) setV(drag.j, SK.G.bot.iy(pq.y), false); });
      function up(){ if(!drag) return; var j = drag.j; drag = null; if(Q.live) Q.live('f′(' + sv(st.xs[j]) + ') set to ' + sv(SK.vals[j]) + '.'); var g = pts.querySelector('[data-j="' + j + '"]'); if(g) g.focus({ preventScroll: true }); }
      svgEl.addEventListener('pointerup', up); svgEl.addEventListener('pointercancel', up);
      pts.addEventListener('keydown', function(e){
        var g = e.target.closest('.tt-skp'); if(!g || SK.locked) return;
        var j = +g.getAttribute('data-j'), v = SK.vals[j] == null ? 0 : SK.vals[j], kk = e.key, d = st.snap;
        if(kk === 'ArrowUp') setV(j, v + d, true); else if(kk === 'ArrowDown') setV(j, v - d, true);
        else if(kk === 'PageUp') setV(j, v + 4 * d, true); else if(kk === 'PageDown') setV(j, v - 4 * d, true);
        else if(kk === '0') setV(j, 0, true); else if(kk === 'Enter' || kk === ' ') setV(j, v, true);
        else if(kk === 'ArrowRight' || kk === 'ArrowLeft'){ var nx = pts.querySelector('[data-j="' + (j + (kk === 'ArrowRight' ? 1 : -1)) + '"]'); if(nx) nx.focus(); }
        else return;
        e.preventDefault();
      });
    }
    function drawSketch(w, h){
      var p = Q.p, st = p.steps[0], f = p.fig, figEl = Q.figEl, SK = Q.SK, svgEl = figEl && figEl.querySelector('.tt-sksvg'); if(!svgEl || !SK) return;
      if(w == null){ var b = figEl.querySelector('.tt-fbox'); w = b.clientWidth; h = b.clientHeight; }
      if(!(w > 60 && h > 60)) return;
      svgEl.setAttribute('viewBox', '0 0 ' + w + ' ' + h); svgEl.setAttribute('width', w); svgEl.setAttribute('height', h);
      var narrow = w < 520, pl = narrow ? 34 : 42, pr = 12, gap = 22, avail = h - 8 - 16 - gap - 16, topH = Math.round(avail * 0.45), botH = avail - topH, W = w - pl - pr;
      var A = frameOf(f.top.x, f.top.y, pl, 8, W, topH), B = frameOf(f.bottom.x, f.bottom.y, pl, 8 + topH + 16 + gap, W, botH);
      SK.G = { top: A, bot: B };
      var o = [], c1 = id + '-k1', c2 = id + '-k2';
      figEl.querySelector('.tt-skdefs').innerHTML = clipDef(c1, A) + clipDef(c2, B);
      o.push(axesOf(A, {}), '<text class="tt-ptitle tt-c1" x="' + (A.L + 8) + '" y="' + (A.T + 16) + '">y = f(x)</text>', '<g clip-path="url(#' + c1 + ')">');
      f.top.curves.forEach(function(c){ var fn = M.fn(c.fn); o.push(curvePath(function(x){ return fn(x); }, A, c.domain ? c.domain[0] : null, c.domain ? c.domain[1] : null, 's1 tt-f')); });
      st.xs.forEach(function(x, j){ o.push(dot(A, x, st.fvals[j], 's1', 3.5)); });
      o.push('</g>');
      st.xs.forEach(function(x){ var gx = r1(A.sx(x)); o.push('<line class="tt-colguide" x1="' + gx + '" y1="' + A.T + '" x2="' + gx + '" y2="' + B.B + '"/>'); });
      o.push(axesOf(B, {}), '<text class="tt-ptitle tt-c2" x="' + (B.L + 8) + '" y="' + (B.T + 16) + '">y = f′(x): your sketch</text>', '<g clip-path="url(#' + c2 + ')">');
      if(SK.show){
        if(f.dPieces) f.dPieces.forEach(function(pc){ var v = +pc.fn; o.push('<line class="calc-plot-curve s2 tt-ans" x1="' + r1(B.sx(pc.domain[0])) + '" y1="' + r1(B.sy(v)) + '" x2="' + r1(B.sx(pc.domain[1])) + '" y2="' + r1(B.sy(v)) + '"/>'); });
        else { var dfn = M.fn(f.d); o.push(curvePath(function(x){ return dfn(x); }, B, null, null, 's2 tt-ans')); }
      }
      var set = st.xs.map(function(x, j){ return SK.vals[j] == null ? null : [x, SK.vals[j]]; }).filter(Boolean);
      if(set.length > 1 && p.variant !== 'lines') o.push('<path class="tt-skline" d="M' + set.map(function(q0){ return r1(B.sx(q0[0])) + ' ' + r1(B.sy(q0[1])); }).join('L') + '"/>');
      o.push('</g>');
      figEl.querySelector('.tt-skbg').innerHTML = o.join('');
      figEl.querySelectorAll('.tt-skp').forEach(function(g){
        var j = +g.getAttribute('data-j'), v = SK.vals[j], mk = SK.marks && SK.marks[j];
        g.setAttribute('transform', 'translate(' + r1(B.sx(st.xs[j])) + ' ' + r1(B.sy(v == null ? 0 : v)) + ')');
        g.classList.toggle('is-unset', v == null); g.classList.toggle('is-ok', !!(mk && mk.ok)); g.classList.toggle('is-bad', !!(mk && !mk.ok)); g.classList.toggle('is-locked', SK.locked);
        g.setAttribute('aria-valuenow', v == null ? '0' : n(v));
        g.setAttribute('aria-valuetext', v == null ? 'not set' : 'f′(' + sv(st.xs[j]) + ') = ' + sv(v) + (mk ? (mk.ok ? ', correct' : ', needs a fix, note ' + mk.n) : ''));
        var bd = g.querySelector('.tt-badge');
        bd.style.display = mk ? '' : 'none'; if(mk){ bd.setAttribute('transform', 'translate(14 -14)'); bd.querySelector('text').textContent = mk.ok ? '✓' : mk.n; }
      });
    }
    /* The sketch as a drill step: the points on the stage are the input;
       Check grades every point (a numbered note for each miss, drawn on its
       point); Show the answer moves them onto f′ and draws f′. */
    function sketchStep(s){
      var LS = T.studioOf(host);
      return {
        html: '<p class="bt-small tt-skhow">Drag each point on the lower graph to the value of f′ there.</p>',
        init: function(){
          if(LS && LS.mode() === 'quiz') setTimeout(function(){ var t0 = Q.figEl && Q.figEl.querySelector('.tt-skp'); if(t0) LS.hint({ target: t0, text: 'Drag each point to the slope of f', key: 'levl_hint_apcalc-tangent-tracer-sketch' }); }, 300);
        },
        check: function(){
          var SK = Q.SK, unset = SK.vals.filter(function(v){ return v == null; }).length;
          if(unset){ var u = Q.figEl.querySelector('.tt-skp.is-unset'); if(u) u.focus({ preventScroll: true }); return { blank: true, msg: 'Set every point first: ' + unset + ' still ' + (unset === 1 ? 'shows' : 'show') + ' “?”. Drag each one, or tap it to keep it on the axis.' }; }
          var g = TT.gradeSketch(s, SK.vals), notes = [], nn = 0;
          SK.marks = g.points.map(function(pt){ if(pt.ok) return { ok: true }; nn++; notes.push('<span class="tt-nb">' + nn + '</span> ' + tx(pt.why)); return { ok: false, n: nn }; });
          if(g.ok){ SK.locked = true; SK.show = true; }
          drawSketch();
          return { ok: g.ok, notes: g.ok ? ['Every point has the right sign and size. The solid curve is the exact graph of f′.'] : notes, drew: true };
        },
        reveal: function(){ var SK = Q.SK; SK.vals = s.answers.slice(); SK.marks = s.answers.map(function(){ return { ok: true }; }); SK.locked = true; SK.show = true; drawSketch(); },
        shownMsg: 'The points are moved to the values of f′, and the solid curve is the graph of f′.',
        lock: function(){ if(Q.SK){ Q.SK.locked = true; drawSketch(); } }
      };
    }

    /* A small picture for a choice: frame, axes, the dashed lines of the
       stage, and the curve; no tick labels (the stage carries the scale). */
    function miniGraph(g){
      var W = 168, H = 104, F = frameOf(g.x, g.y, 4, 4, W - 8, H - 8), fn = M.fn(g.curves[0].fn), o = [];
      o.push('<rect class="tt-frame" x="4" y="4" width="' + (W - 8) + '" height="' + (H - 8) + '"/>');
      o.push('<g class="calc-plot-axis"><line x1="' + F.L + '" y1="' + r1(F.sy(0)) + '" x2="' + F.R + '" y2="' + r1(F.sy(0)) + '"/><line x1="' + r1(F.sx(0)) + '" y1="' + F.T + '" x2="' + r1(F.sx(0)) + '" y2="' + F.B + '"/></g>');
      (g.lines || []).forEach(function(l){ var x = l.through[0][0]; o.push('<line class="tt-guide-v" x1="' + r1(F.sx(x)) + '" y1="' + F.T + '" x2="' + r1(F.sx(x)) + '" y2="' + F.B + '"/>'); });
      o.push(curvePath(function(x){ return fn(x); }, F, null, null, 's2 tt-mini'));
      return '<svg class="calc-plot tt-minisvg" viewBox="0 0 ' + W + ' ' + H + '" aria-hidden="true" focusable="false">' + o.join('') + '</svg>';
    }
    function lineNote(raw, L){
      var g = M.fn(raw), a = L.a, y = g(a), m = (g(a + 1e-4) - g(a - 1e-4)) / 2e-4, bad = [];
      if(Math.abs(y - L.fa) > 1e-6) bad.push('it does not pass through the point $(' + n(a) + ', ' + n(M.round(L.fa, 3)) + ')$: at $x = ' + n(a) + '$ it gives $' + n(M.round(y, 3)) + '$');
      if(Math.abs(m - L.m) > 1e-4) bad.push('its slope is ' + (isFinite(m) ? '$' + n(M.round(m, 3)) + '$' : 'not constant') + ', not $' + n(M.round(L.m, 3)) + '$');
      return bad.length ? tx('Your line ' + bad.join(', and ') + '.') : '';
    }
    return { redraw: redrawFig };
  }

  function boot(){
    T.mount(SLUG, function(app, data){
      var ex = null, qz = null, kit = !!(window.LevlKit2 && window.LevlStudio && app.getAttribute('data-studio'));
      var md = T.modes(app, { slug: SLUG, labels: ['Explore', 'Test yourself'],
        explore: function(host){ ex = explore(host, data); window.ApCalcTangentTracer = ex._t; },
        quiz: function(host){ qz = quiz(host, data); },
        onShow: function(m){
          if(ex) ex.shown(m);
          // A pane that was hidden has no size: draw it again once it shows.
          setTimeout(function(){ if(m === 'explore' && ex) ex.redraw(); if(m === 'quiz' && qz) qz.redraw(); }, 30);
        },
        studio: kit ? { kit2: function(pane, s){ return ex.kit2(pane, s); } } : {} });
      // Without the frame (no Tool Studio, or no kit) the stage still works on its own, above Test yourself.
      if(!kit || !T.studioOf(app)) ex.plain();
      return md;
    });
  }
  /* The page loads the kit (pages.json "kit2": true). A cached copy of the old page would not: fetch it then. */
  if(window.LevlKit2) boot();
  else {
    var up = (window.ApCalcBase || '../') + '../assets/course/';
    var l = document.createElement('link'); l.rel = 'stylesheet'; l.href = up + 'tool-kit2.css'; document.head.appendChild(l);
    var sc = document.createElement('script'); sc.src = up + 'tool-kit2.js'; sc.onload = boot; sc.onerror = boot; document.head.appendChild(sc);
  }
})();
