/* Tangent tracer (simulator, the course's flagship trainer; docs/apcalc-spec.md
   section 6). OWNED BY THIS TOOL ONLY. The model is ApCalcMath.tangentTracer
   (calculus/assets/tools/math/tangent-tracer.js); curves are sampled with
   ApCalcPlot (calc-plot.js), math is ApCalcTex (calc-math.js), the frame is
   ApCalcTools.modes on the Tool Studio. Styles: tangent-tracer.css.

   Explore: one stage, two linked graphs sharing x. Top: f, the point P, a
   second point Q at distance h, the secant through them with its rise and
   run, and (on tap) the tangent line. Bottom: the graph of f′, drawn by the
   student as P moves (or by "Trace f′", which sweeps P across), with the
   current secant slope closing in on f′(a). The dock: the function, the h
   slider (log scale, both sides, toward 0 in the middle), h → 0, Tangent,
   Trace f′, and the table of difference quotients for h = ±1 ... ±0.001.
   At a corner, cusp, vertical tangent or jump the two one-sided slopes are
   shown and the caption says why f′(a) does not exist. "Why?" holds the
   limit definition with the numbers; "Numbers & view" the zoom (a smooth
   curve looks straight under it, a corner does not), the f′ formula and the
   values at P. Typed functions go through ApCalcExpr (no eval).

   Colours are the course's: f s1 (crimson), f′ s2 (blue), the tangent s4
   (orange), the secant s5 (purple). Every curve and number comes from the
   function the tool names.

   Test yourself: seeded problems from tangentTracer.generate (six kinds:
   estimate f′(a) from a tangent line; a difference quotient from a table
   with units; which graph is f′; SKETCH f′ from f, graded point by point
   with named misses; write the tangent line, typed and drawn live on the
   graph; where f is not differentiable and why), on the shared drill
   (ApCalcTools.drill: one step at a time, method hint, Show the answer)
   like the other nine trainers; the figure on the stage shows each try,
   first tries recorded as tangent-tracer:<context>:<step>. */
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

  /* =============================================================== EXPLORE */
  function explore(host, data){
    var id = 'tt' + (++uid);
    var S = { F: null, a: 1, h: 1, tan: false, zoom: 1, trace: [], all: false, cls: null, drag: null, anim: null, view: null, hSide: 1, fresh: true };
    host.innerHTML = '<section class="bt-problem tt-ex" aria-labelledby="' + id + '-h"><h2 id="' + id + '-h" class="sr-only">Explore: the secant becomes the tangent</h2>' +
      '<div class="tt-stage"><svg class="calc-plot tt-svg" role="group" aria-labelledby="' + id + '-d"><title id="' + id + '-d">Graphs of f and f′</title><defs class="tt-defs"></defs><g class="tt-bg"></g>' +
      '<g class="tt-hp calc-plot-handle tt-handle" tabindex="0" role="slider" aria-label="Point P on the curve"><circle class="tt-hit" r="24"/><circle class="calc-plot-halo" r="17"/><circle class="tt-pdot" r="8"/></g>' +
      '<g class="tt-hq calc-plot-handle tt-handle" tabindex="0" role="slider" aria-label="Point Q, the second point of the secant"><circle class="tt-hit" r="22"/><circle class="calc-plot-halo" r="14"/><circle class="tt-qdot" r="6.5"/></g></svg></div>' +
      '<p class="sr-only tt-live"></p>' +
      '<div class="tt-dock"><div class="tt-fpick"></div><div class="tt-own" hidden></div>' +
      '<div class="tt-hctl"><div class="tt-hrow"><label for="' + id + '-hs" class="tt-hlab">Distance <i>h</i> from P to Q</label><output class="tt-hout" for="' + id + '-hs" aria-hidden="true"></output></div>' +
      '<input type="range" id="' + id + '-hs" class="tt-hs" min="-1000" max="1000" step="1" value="1000">' +
      '<div class="tt-ruler" aria-hidden="true"></div></div>' +
      '<div class="tt-btns"><button type="button" class="bt-btn tt-shrink">h → 0</button><button type="button" class="bt-btn tt-tan" aria-pressed="false">Tangent</button><button type="button" class="bt-btn tt-trace" aria-pressed="false">Trace f′</button></div>' +
      '<details class="tt-dqd" open><summary>Secant slopes as h → 0</summary><div class="tt-dqw"></div></details></div>' +
      '<div class="tt-why"></div><div class="tt-det"></div></section>';
    var LS = null;
    var q = function(s){ return host.querySelector(s) || (LS ? LS.root.querySelector(s) : null); };
    var svg = q('.tt-svg'), bg = q('.tt-bg'), defs = q('.tt-defs'), hp = q('.tt-hp'), hq = q('.tt-hq'), title = q('#' + id + '-d');
    var live = T.announcer(q('.tt-live')), hs = q('.tt-hs'), hout = q('.tt-hout');
    var shrinkB = q('.tt-shrink'), tanB = q('.tt-tan'), traceB = q('.tt-trace');
    var start = T.cue('Drag P along the curve, then slide h toward 0.');
    q('.tt-dock').insertBefore(start.el, q('.tt-dock').firstChild);

    /* --- the function picker --- */
    var opts = TT.ORDER.map(function(k){ return { value: k, label: TT.FUNCS[k].name }; }).concat([{ value: 'custom', label: 'Type your own…' }]);
    var pick = T.choiceSelect({ label: 'Function', options: opts, value: 'quad', onChange: function(v){ if(v === 'custom'){ own.hidden = false; ownIn.focus(); return; } own.hidden = true; setF(TT.FUNCS[v]); } });
    pick.el.classList.add('bt-inline');
    q('.tt-fpick').appendChild(pick.el);
    var own = q('.tt-own');
    own.innerHTML = '<div class="tt-ownrow"><span class="tt-ownl" aria-hidden="true">' + mm('f(x) =') + '</span><label class="sr-only" for="' + id + '-own">Type a function of x</label>' +
      '<input type="text" id="' + id + '-own" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="x^3 - 2x" aria-describedby="' + id + '-op"><button type="button" class="bt-btn tt-owngo">Graph it</button></div>' +
      '<div class="calc-expr-preview tt-ownp" id="' + id + '-op" aria-live="polite"></div>';
    var ownIn = own.querySelector('input'), ownP = own.querySelector('.tt-ownp'), ownT = null;
    ownIn.addEventListener('input', function(){
      clearTimeout(ownT);
      ownT = setTimeout(function(){
        var v = ownIn.value.trim(), r = v ? M.read(v, { vars: ['x'] }) : null;
        ownP.innerHTML = !r ? '<span class="bt-small">Try x^3 - 2x, sin(2x), |x - 1| or sqrt(x).</span>' : r.ok ? '<span class="bt-small">Reads as</span> ' + mm('f(x) = ' + r.tex) : '<span class="calc-expr-err">' + esc(r.error) + '</span>';
      }, 120);
    });
    function goOwn(){
      var c = TT.custom(ownIn.value);
      if(!c.ok){ ownP.innerHTML = '<span class="calc-expr-err">' + esc(c.error || 'Type a function of x.') + '</span>'; return; }
      c.y = autoY(c.f, -4, 4); c.dy = autoY(c.dn, -4, 4, 0.08); c.a = 1; c.h = 1;
      if(!isFinite(c.f(c.a))){ for(var x = -4; x <= 4; x += 0.25) if(isFinite(c.f(x)) && isFinite(c.f(x + 0.5))){ c.a = x; break; } }
      setF(c);
    }
    own.querySelector('.tt-owngo').addEventListener('click', goOwn);
    ownIn.addEventListener('keydown', function(e){ if(e.key === 'Enter'){ e.preventDefault(); goOwn(); } });

    /* --- state changes --- */
    function setF(F){
      stopAnim();
      S.F = F; S.a = F.a; S.h = F.h || 1; S.trace = []; S.zoom = 1; S.view = null; S.hSide = S.h < 0 ? -1 : 1;
      addVisit(S.a, S.a);
      ruler(); syncH(); zoomBtns(); recompute(); draw(); details();
    }
    function hmax(){ var F = S.F; return Math.min(TT.HMAX, (F.x[1] - F.x[0]) / 3); }
    // Labels under the slider, placed on its log scale.
    function ruler(){
      var mx = hmax(), lo = Math.log10(TT.HMIN), hi = Math.log10(mx);
      q('.tt-ruler').innerHTML = [-1, -0.1, -0.01, 0, 0.01, 0.1, 1].filter(function(v){ return Math.abs(v) <= mx; }).map(function(v){
        var pc = v === 0 ? 50 : 50 + (v < 0 ? -50 : 50) * (Math.log10(Math.abs(v)) - lo) / (hi - lo);
        return '<span' + (v === 0 ? ' class="is-zero"' : '') + ' style="left:' + pc.toFixed(1) + '%">' + sv(v) + '</span>';
      }).join('');
    }
    function syncH(){ hs.value = String(TT.sOf(S.h, hmax())); var t = 'h = ' + sv(S.h); hout.textContent = t; hs.setAttribute('aria-valuetext', t + (S.h > 0 ? ', Q to the right of P' : ', Q to the left of P')); }
    function setH(h, quiet){
      var mx = hmax();
      if(!isFinite(h) || h === 0) h = S.hSide * TT.HMIN;
      h = Math.max(-mx, Math.min(mx, h));
      if(Math.abs(h) < TT.HMIN) h = (h < 0 ? -1 : 1) * TT.HMIN;
      S.h = h; S.hSide = h < 0 ? -1 : 1;
      syncH(); if(!quiet){ draw(); }
    }
    hs.addEventListener('input', function(){ stopAnim(); act(); var v = +hs.value; setH(v === 0 ? S.hSide * TT.HMIN : TT.hOf(v, hmax()), true); syncH(); draw(); });
    function addVisit(x0, x1){
      var lo = Math.min(x0, x1), hi = Math.max(x0, x1), out = [], merged = [lo, hi];
      S.trace.forEach(function(iv){ if(iv[1] < merged[0] - 1e-9 || iv[0] > merged[1] + 1e-9) out.push(iv); else { merged[0] = Math.min(merged[0], iv[0]); merged[1] = Math.max(merged[1], iv[1]); } });
      out.push(merged); out.sort(function(p, r){ return p[0] - r[0]; });
      S.trace = out;
    }
    function visited(x){ return S.trace.some(function(iv){ return x >= iv[0] - 1e-9 && x <= iv[1] + 1e-9 && iv[1] - iv[0] > 1e-6; }); }
    function setA(a, from){
      var F = S.F;
      if(!isFinite(F.f(a))) return false;
      var old = S.a; S.a = a;
      if(from !== 'jump') addVisit(old, a); else addVisit(a, a);
      recompute();
      return true;
    }
    function recompute(){ S.cls = TT.classify(S.F.f, S.a); }
    function act(){ if(S.fresh){ S.fresh = false; start.done(); if(G) say0(); } }
    function say0(){ var F = S.F, a = S.a; say(TT.dq(F.f, a, S.h), (S.cls || {}).kind === 'smooth' ? TT.slopeAt(F, a) : NaN, F.f(a), F.f(a + S.h)); }

    /* --- the view: zoomed windows follow P --- */
    function windows(){
      var F = S.F, x = F.x, y = F.y || [-5, 5], z = S.zoom;
      if(z === 1) return { x: x, y: y };
      if(!S.view || S.view.z !== z){
        var hx = (x[1] - x[0]) / 2 / z, hy = (y[1] - y[0]) / 2 / z, fa = F.f(S.a);
        S.view = { z: z, x: [S.a - hx, S.a + hx], y: [fa - hy, fa + hy] };
      }
      return S.view;
    }
    function recenter(){ if(S.zoom > 1){ S.view = null; } }

    /* --- drawing --- */
    var G = null;
    function layout(w, h){
      var narrow = w < 520, pl = narrow ? 34 : 42, pr = 12, pt = 8, gap = narrow ? 20 : 24;
      var avail = h - pt - 16 - gap - 16, topH = Math.round(avail * 0.6), botH = avail - topH;
      var W = Math.max(40, w - pl - pr), V = windows(), F = S.F;
      var top = frameOf(V.x, V.y, pl, pt, W, topH);
      var dy = F.dy || [-5, 5];
      var bot = frameOf(V.x, dy, pl, pt + topH + 16 + gap, W, botH);
      return { w: w, h: h, top: top, bot: bot, narrow: narrow };
    }
    var sized = null;
    function draw(){
      if(!S.F || !sized) return;
      var dims = sized.size(); if(!dims[0]) return;
      var w = Math.round(dims[0]), h = Math.round(dims[1]);
      if(w < 60 || h < 60) return;
      G = layout(w, h);
      svg.setAttribute('viewBox', '0 0 ' + w + ' ' + h); svg.setAttribute('width', w); svg.setAttribute('height', h);
      var F = S.F, A = G.top, B = G.bot, a = S.a, hh = S.h, fa = F.f(a), xq = a + hh, fq = F.f(xq), sec = TT.dq(F.f, a, hh);
      var c = S.cls || { kind: 'smooth' }, slope = c.kind === 'smooth' ? TT.slopeAt(F, a) : NaN;
      var dfun = F.d ? function(x){ return F.d(x); } : F.dn;
      var o = [], c1 = id + '-c1', c2 = id + '-c2';
      defs.innerHTML = clipDef(c1, A) + clipDef(c2, B);
      // Top: f
      o.push(axesOf(A, { piX: F.piX }));
      o.push('<text class="tt-ptitle tt-c1" x="' + (A.L + 8) + '" y="' + (A.T + 16) + '">y = f(x)</text>');
      o.push('<g clip-path="url(#' + c1 + ')">');
      o.push(curvePath(F.f, A, null, null, 's1 tt-f'));
      (F.dots || []).forEach(function(d){ o.push(dot(A, d.at[0], d.at[1], 's1', 4.5, d.open)); });
      var tanOn = S.tan || (S.anim && S.anim.kind === 'trace');
      if(tanOn){
        if(c.kind === 'smooth' && isFinite(slope)) o.push(lineAcross(A, a, fa, slope, 'tt-tanl s4'));
        else if(c.kind === 'vertical' || c.kind === 'cusp') o.push(lineAcross(A, a, fa, Infinity, 'tt-tanl s4 is-half'));
        else if(c.kind === 'corner'){
          if(isFinite(c.L)) o.push(lineAcross(A, a, fa, c.L, 'tt-tanl s4 is-half', '', null, a));
          if(isFinite(c.R)) o.push(lineAcross(A, a, fa, c.R, 'tt-tanl s4 is-half', '', a, null));
        }
      }
      var showSec = !(S.anim && S.anim.kind === 'trace');
      var oneSided = c.kind !== 'smooth' && c.kind !== 'undefined';
      if(showSec){
        // At a corner, cusp, jump or vertical tangent: both secants (Q on each side).
        var sides = oneSided ? [-Math.abs(hh), Math.abs(hh)] : [hh];
        sides.forEach(function(hv){
          var xv = a + hv, fv = F.f(xv), sl = TT.dq(F.f, a, hv);
          if(!isFinite(fv)) return;
          o.push(oneSided ? lineAcross(A, a, fa, sl, 'tt-secl s5' + (hv !== hh ? ' is-other' : ''), '', hv < 0 ? null : a, hv < 0 ? a : null) : lineAcross(A, a, fa, sl, 'tt-secl s5'));
          if(hv === hh){
            var px = A.sx(xv), py0 = A.sy(fa), py1 = A.sy(fv);
            o.push('<path class="tt-tri s5" d="M' + r1(A.sx(a)) + ' ' + r1(py0) + 'H' + r1(px) + 'V' + r1(py1) + '"/>');
            if(Math.abs(px - A.sx(a)) > 34) o.push('<text class="tt-tril tt-c5" x="' + r1((A.sx(a) + px) / 2) + '" y="' + r1(py0 + (py1 > py0 ? -6 : 15)) + '" text-anchor="middle">h</text>');
            if(Math.abs(py1 - py0) > 30) o.push('<text class="tt-tril tt-c5" x="' + r1(px + (hv > 0 ? 6 : -6)) + '" y="' + r1((py0 + py1) / 2 + 4) + '" text-anchor="' + (hv > 0 ? 'start' : 'end') + '">' + (G.narrow ? 'Δy' : 'f(a + h) − f(a)') + '</text>');
          } else o.push(dot(A, xv, fv, 's5', 4, true));
        });
      }
      o.push('</g>');
      // guide from P down to f′
      var gx = r1(A.sx(a));
      if(gx >= A.L && gx <= A.R) o.push('<line class="tt-guide-v" x1="' + gx + '" y1="' + r1(Math.min(A.B, Math.max(A.T, A.sy(fa)))) + '" x2="' + gx + '" y2="' + B.B + '"/>');
      // Bottom: f′
      o.push(axesOf(B, { piX: F.piX }));
      o.push('<text class="tt-ptitle tt-c2" x="' + (B.L + 8) + '" y="' + (B.T + 16) + '">' + (G.narrow ? 'y = f′(x)' : 'y = f′(x), the slope of f') + '</text>');
      o.push('<g clip-path="url(#' + c2 + ')">');
      if(S.all) o.push(curvePath(dfun, B, null, null, 's2 tt-ghost'));
      S.trace.forEach(function(iv){ if(iv[1] - iv[0] > 1e-6) o.push(curvePath(dfun, B, iv[0], iv[1], 's2 tt-fp')); });
      (F.special || []).forEach(function(sp){
        if(!(S.all || visited(sp.x) || Math.abs(sp.x - a) < 1e-9)) return;
        if(sp.kind === 'corner'){ o.push(dot(B, sp.x, sp.L, 's2', 4.5, true) + dot(B, sp.x, sp.R, 's2', 4.5, true)); }
        else if(sp.kind === 'jump'){ o.push(dot(B, sp.x, sp.R, 's2', 4.5, true)); o.push('<line class="calc-plot-asym" x1="' + r1(B.sx(sp.x)) + '" y1="' + B.T + '" x2="' + r1(B.sx(sp.x)) + '" y2="' + B.B + '"/>'); }
        else o.push('<line class="calc-plot-asym" x1="' + r1(B.sx(sp.x)) + '" y1="' + B.T + '" x2="' + r1(B.sx(sp.x)) + '" y2="' + B.B + '"/>');
      });
      if(isFinite(sec) && showSec && !oneSided) o.push('<path class="tt-secmark s5" d="M' + r1(B.sx(a)) + ' ' + r1(B.sy(sec) - 6) + 'l6 6l-6 6l-6 -6z"/>');
      if(c.kind === 'smooth' && isFinite(slope)) o.push(dot(B, a, slope, 's2 tt-now', 5.5));
      else if(c.kind === 'corner'){ if(isFinite(c.L)) o.push(dot(B, a, c.L, 's2', 5, true)); if(isFinite(c.R)) o.push(dot(B, a, c.R, 's2', 5, true)); }
      o.push('</g>');
      bg.innerHTML = o.join('');
      // handles
      var pIn = isFinite(fa) && fa >= A.y[0] && fa <= A.y[1] && a >= A.x[0] && a <= A.x[1];
      hp.setAttribute('transform', 'translate(' + r1(A.sx(a)) + ' ' + r1(A.sy(Math.max(A.y[0], Math.min(A.y[1], fa)))) + ')');
      hp.classList.toggle('is-off', !pIn);
      // Q sits on P when h is tiny: then only P shows (h stays on the slider).
      var qIn = isFinite(fq) && fq >= A.y[0] && fq <= A.y[1] && xq >= A.x[0] && xq <= A.x[1] && showSec && Math.hypot(A.sx(xq) - A.sx(a), A.sy(fq) - A.sy(fa)) > 9;
      hq.style.display = qIn ? '' : 'none';
      if(qIn) hq.setAttribute('transform', 'translate(' + r1(A.sx(xq)) + ' ' + r1(A.sy(fq)) + ')');
      hp.setAttribute('aria-valuemin', n(F.x[0])); hp.setAttribute('aria-valuemax', n(F.x[1])); hp.setAttribute('aria-valuenow', n(a));
      hp.setAttribute('aria-valuetext', 'x = ' + sv(a) + ', f(x) = ' + F3(fa));
      hq.setAttribute('aria-valuetext', 'h = ' + sv(hh) + (isFinite(fq) ? ', f(a + h) = ' + F3(fq) : ', not on the graph'));
      hq.setAttribute('aria-valuenow', n(hh)); hq.setAttribute('aria-valuemin', n(-hmax())); hq.setAttribute('aria-valuemax', n(hmax()));
      say(sec, slope, fa, fq);
      table();
    }

    /* --- words: caption, pills, live region, the table --- */
    var say = function(sec, slope, fa, fq){
      var F = S.F, a = S.a, c = S.cls || { kind: 'smooth' }, A = sv(a), head, right = [], left = [{ k: 'h', html: sv(S.h), tone: 'readout' }];
      var tanEq = c.kind === 'smooth' && isFinite(slope) ? TT.line(+M.round(a, 6), +M.round(fa, 6), +M.round(slope, 3)) : null;
      if(S.anim && S.anim.kind === 'trace'){
        head = 'Tracing f′: P sweeps across, and the slope of f at each x is plotted below as the height of f′.';
      } else if(c.kind === 'smooth'){
        head = isFinite(sec) ? 'Secant slope <b>' + F3(sec) + '</b>. As h → 0 it closes in on <b>f′(' + A + ') = ' + F3(slope) + '</b>.' : 'Q is off the graph: f(' + sv(a + S.h) + ') is not defined. Move Q to the other side.';
        // First visit: the one thing to do first.
        if(S.fresh && isFinite(sec)) head = '<b>Start here:</b> slide h toward 0. The secant slope, now <b>' + F3(sec) + '</b>, closes in on f′(' + A + ').';
        if(S.tan && tanEq) head = 'Tangent line at x = ' + A + ': <b>' + tx('$' + tanEq.tex + '$') + '</b>. Its slope is f′(' + A + ') = ' + F3(slope) + '.';
        right.push({ html: 'f′(' + A + ') = ' + F3(slope), tone: 'good' });
      } else if(c.kind === 'corner'){
        head = 'At x = ' + A + ' the slope from the left is <b>' + F3(c.L) + '</b> and from the right <b>' + F3(c.R) + '</b>. They disagree, so f′(' + A + ') does not exist: a corner.';
        right.push({ html: 'f′(' + A + ') does not exist', tone: 'warn' });
      } else if(c.kind === 'vertical'){
        head = 'At x = ' + A + ' the secant slopes grow without bound from both sides: the tangent is vertical, so f′(' + A + ') does not exist.';
        right.push({ html: 'vertical tangent', tone: 'warn' });
      } else if(c.kind === 'cusp'){
        head = 'At x = ' + A + ' the slopes head to <b>−∞</b> from one side and <b>+∞</b> from the other: a cusp. f′(' + A + ') does not exist.';
        right.push({ html: 'cusp: no f′(' + A + ')', tone: 'warn' });
      } else if(c.kind === 'jump'){
        head = 'f jumps at x = ' + A + ', so it is not continuous there. From the jumping side the secant slopes blow up: f′(' + A + ') does not exist.';
        right.push({ html: 'not continuous', tone: 'warn' });
      } else if(c.kind === 'endpoint'){
        head = 'P is at the end of the domain: Q can only be on one side' + (Math.abs(c.L) === Infinity || Math.abs(c.R) === Infinity ? ', and there the slopes grow without bound. f′(' + A + ') does not exist.' : '.');
        right.push({ html: 'end of the domain', tone: 'warn' });
      } else head = 'f is not defined at x = ' + A + '.';
      if(isFinite(sec) && c.kind === 'smooth' && !(S.anim && S.anim.kind === 'trace')) left.push({ k: 'secant', html: F3(sec), tone: 'accent' });
      if(LS){ LS.caption(head, 'explore'); LS.pills(left, 'left', 'explore'); LS.pills(right, 'right', 'explore'); }
      else { var cap = q('.tt-cap'); if(cap) cap.innerHTML = head; }
      title.textContent = (F.custom ? 'Your function ' : '') + plain('$' + F.tex + '$') + '. P at x = ' + A + ', Q at h = ' + sv(S.h) + '. ' + plain(head.replace(/<[^>]+>/g, ''));
      if(!S.drag && !S.anim) live(plain(head.replace(/<[^>]+>/g, '')));
      whyLater();
    };
    function table(){
      var F = S.F, a = S.a, rows = TT.table(F.f, a), c = S.cls || {}, ah = Math.abs(S.h);
      var near = rows.reduce(function(b, r, i){ return Math.abs(Math.log10(r.h / ah)) < Math.abs(Math.log10(rows[b].h / ah)) ? i : b; }, 0);
      var lim = c.kind === 'smooth' ? 'f′(' + sv(a) + ') = ' + F3(TT.slopeAt(F, a)) : c.kind === 'corner' ? F3(c.L) + ' and ' + F3(c.R) + ': they disagree' : c.kind === 'vertical' || c.kind === 'cusp' || c.kind === 'jump' || c.kind === 'endpoint' ? 'no finite limit' : '—';
      q('.tt-dqw').innerHTML = '<div class="table-wrap" tabindex="0" role="region" aria-label="Secant slopes closing in"><table class="tt-dq"><caption>Slopes ' + mm('\\frac{f(a+h)-f(a)}{h}') + ' at a = ' + esc(sv(a)) + '</caption>' +
        '<thead><tr><th scope="col">|h|</th><th scope="col">Q on the left</th><th scope="col">Q on the right</th></tr></thead><tbody>' +
        rows.map(function(r, i){ return '<tr' + (i === near ? ' class="is-now"' : '') + '><th scope="row">' + n(r.h) + '</th><td' + (i === near && S.h < 0 ? ' class="is-side"' : '') + '>' + F3(r.left) + '</td><td' + (i === near && S.h > 0 ? ' class="is-side"' : '') + '>' + F3(r.right) + '</td></tr>'; }).join('') +
        '</tbody><tfoot><tr><th scope="row">h → 0</th><td colspan="2">' + esc(lim) + '</td></tr></tfoot></table></div>';
    }

    /* --- Why and Details (rebuilt when idle) --- */
    var whyT = null;
    function whyLater(){ clearTimeout(whyT); whyT = setTimeout(why, S.drag || S.anim ? 260 : 40); }
    function why(){
      var F = S.F, a = S.a, h = S.h, fa = F.f(a), fq = F.f(a + h), c = S.cls || {}, sec = TT.dq(F.f, a, h), A = texN(a), H = texN(h);
      var aph = h < 0 ? A + ' - ' + texN(-h) : A + ' + ' + H;
      var html = '<h3 class="ls-title-l">The slope of the secant line</h3><p>Q is ' + (h > 0 ? 'to the right' : 'to the left') + ' of P, at distance h = ' + esc(sv(h)) + '. The secant through P and Q has slope</p>' +
        (isFinite(sec) ? mm('\\frac{f(' + aph + ') - f(' + A + ')}{' + H + '} = \\frac{' + texN(fq) + ' - ' + paren(fa) + '}{' + H + '} \\approx ' + texN(sec), true) : '<p>Q is off the graph here: f(a + h) is not defined.</p>');
      html += '<h3 class="ls-title-l">The derivative is the limit as h → 0</h3>';
      if(c.kind === 'smooth'){
        var m = TT.slopeAt(F, a), L = TT.line(+M.round(a, 6), +M.round(fa, 6), +M.round(m, 3));
        html += mm("f'(" + A + ') = \\lim_{h \\to 0} \\frac{f(' + A + ' + h) - f(' + A + ')}{h} \\approx ' + texN(m), true) +
          '<p>Slide h toward 0 from either side: the secant slopes in the table close in on the same number, so the limit exists. That number is the slope of the tangent line.</p>' +
          '<h3 class="ls-title-l">The tangent line</h3><p>Through P with slope f′(' + esc(sv(a)) + '):</p>' + mm('y = f(a) + f\'(a)(x - a)', true) + mm(L.tex, true);
      } else if(c.kind === 'corner'){
        html += oneSidedTex(A, c) +
          '<p>The one-sided limits disagree, so the two-sided limit does not exist and f is not differentiable at x = ' + esc(sv(a)) + '. f is still continuous here: continuous does not mean differentiable.</p>';
      } else if(c.kind === 'vertical' || c.kind === 'cusp'){
        html += oneSidedTex(A, c) +
          '<p>' + (c.kind === 'vertical' ? 'The secants get steeper and steeper from both sides: the tangent line is vertical, and a vertical line has no slope.' : 'The two sides of the point get infinitely steep in opposite directions: a cusp.') + ' So f′(' + esc(sv(a)) + ') does not exist, though f is continuous here.</p>';
      } else if(c.kind === 'jump'){
        html += '<p>f is not continuous at x = ' + esc(sv(a)) + ': the graph jumps. From the side of the jump, f(a + h) − f(a) does not shrink while h does, so the quotient blows up. A differentiable function must be continuous.</p>';
      } else if(c.kind === 'endpoint'){
        html += '<p>Only one side of P is on the graph, so the two-sided limit cannot exist. ' + (Math.abs(c.R) === Infinity || Math.abs(c.L) === Infinity ? 'And from that side the slopes grow without bound: the graph starts with a vertical tangent.' : '') + '</p>';
      }
      html += '<h3 class="ls-title-l">The graph of f′</h3><p>The lower graph has the slope of the upper one as its height. Where f rises, f′ is above the axis; where f falls, below; at a peak or valley of f, f′ = 0. Move P (or press Trace f′) and it draws itself.</p>' +
        '<p class="bt-small">Zoom in at P (under Numbers &amp; view): a differentiable curve looks more and more like its tangent line. A corner stays a corner.</p>';
      var w = q('.tt-why'); if(w) w.innerHTML = html;
      details();
    }
    function oneSidedTex(A, c){
      return mm('\\lim_{h \\to 0^-} \\frac{f(' + A + ' + h) - f(' + A + ')}{h} = ' + texN(c.L), true) + mm('\\lim_{h \\to 0^+} \\frac{f(' + A + ' + h) - f(' + A + ')}{h} = ' + texN(c.R), true);
    }
    var zoomSeg = null;
    function details(){
      var d = q('.tt-det'); if(!d || !S.F) return;
      var F = S.F, a = S.a, fa = F.f(a), c = S.cls || {}, m = c.kind === 'smooth' ? TT.slopeAt(F, a) : NaN;
      var nums = q('.tt-nums');
      if(!nums){
        d.innerHTML = '<h3 class="ls-title-l">View</h3><div class="tt-zoom" role="group" aria-label="Zoom in at P"><span class="tt-zl">Zoom in at P</span>' + [1, 4, 16, 64].map(function(z){ return '<button type="button" class="bt-btn tt-z" data-z="' + z + '" aria-pressed="false">×' + z + '</button>'; }).join('') + '</div>' +
          '<div class="bt-check-row"><input type="checkbox" id="' + id + '-all"><label for="' + id + '-all">Show all of f′ (dotted)</label></div>' +
          '<div class="bt-buttons"><button type="button" class="bt-btn tt-clear">Clear the f′ trace</button></div>' +
          '<h3 class="ls-title-l">Numbers at P</h3><div class="tt-nums"></div><div class="tt-fd"></div>' +
          '<details class="tt-keys"><summary>Keyboard</summary><p class="bt-small">Tab to P: ← → move it along the curve (Shift: farther), Home and End jump to the ends. Tab to Q: ← → move it, Page Down sends h ten times closer to 0. On the h slider, the arrow keys move h; the middle of the slider is h = 0.</p></details>';
        nums = q('.tt-nums');
        zoomSeg = d.querySelector('.tt-zoom');
        zoomSeg.addEventListener('click', function(e){ var b = e.target.closest('[data-z]'); if(!b) return; stopAnim(); S.zoom = +b.getAttribute('data-z'); S.view = null; zoomBtns(); draw(); });
        d.querySelector('#' + id + '-all').addEventListener('change', function(){ S.all = this.checked; draw(); });
        d.querySelector('.tt-clear').addEventListener('click', function(){ S.trace = []; addVisit(S.a, S.a); draw(); });
        zoomBtns();
      }
      var rows = [['a', sv(a)], ['f(a)', F3(fa)], ['h', sv(S.h)], ['f(a + h)', F3(F.f(a + S.h))], ['Secant slope', F3(TT.dq(F.f, a, S.h))],
        ["f′(a)", c.kind === 'smooth' ? F3(m) : 'does not exist'], ['Tangent line', c.kind === 'smooth' ? '' : '—']];
      nums.innerHTML = '<table class="ls-tbl tt-ntbl"><caption class="sr-only">Values at P</caption><tbody>' + rows.map(function(r){ return '<tr><th scope="row">' + r[0] + '</th><td class="r">' + (r[0] === 'Tangent line' && c.kind === 'smooth' ? mm(TT.line(+M.round(a, 6), +M.round(fa, 6), +M.round(m, 3)).tex) : esc(r[1])) + '</td></tr>'; }).join('') + '</tbody></table>';
      q('.tt-fd').innerHTML = '<h3 class="ls-title-l">The function</h3>' + mm(F.tex, true) + (F.dTex ? '<p class="bt-small">Its derivative (the rules come in topics 2.5 to 2.7):</p>' + mm(F.dTex, true) : '<p class="bt-small">The tool estimates f′ numerically for a typed function (central differences) and checks each side of P separately.</p>');
    }
    function zoomBtns(){ if(!zoomSeg) return; zoomSeg.querySelectorAll('[data-z]').forEach(function(b){ b.setAttribute('aria-pressed', String(+b.getAttribute('data-z') === S.zoom)); }); }

    /* --- pointer --- */
    function local(e){ var r = svg.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; }
    function snapA(a, F, px){
      var A = G.top, best = null;
      (F.special || []).concat(F.join != null ? [{ x: F.join }] : []).forEach(function(sp){ if(Math.abs(A.sx(sp.x) - A.sx(a)) <= (px || 12) && (!best || Math.abs(sp.x - a) < Math.abs(best - a))) best = sp.x; });
      if(best != null) return best;
      var span = A.x[1] - A.x[0], st = span > 4 ? 0.01 : span > 0.4 ? 0.001 : 0.0001;
      return M.round(Math.round(a / st) * st, 5);
    }
    function clampA(a){ var V = G.top.x; return Math.max(V[0], Math.min(V[1], a)); }
    function nearestValid(a){
      var F = S.F;
      if(isFinite(F.f(a))) return a;
      var lo = S.a, hi = a;
      if(!isFinite(F.f(lo))) return null;
      for(var k = 0; k < 40; k++){ var mid = (lo + hi) / 2; if(isFinite(F.f(mid))) lo = mid; else hi = mid; }
      return lo;
    }
    svg.addEventListener('pointerdown', function(e){
      if(!G) return;
      stopAnim(); act();
      var p = local(e), A = G.top, B = G.bot, ap = { x: A.sx(S.a), y: A.sy(S.F.f(S.a)) };
      var xq = S.a + S.h, fq = S.F.f(xq), qp = { x: A.sx(xq), y: A.sy(fq) };
      var dP = Math.hypot(p.x - ap.x, p.y - ap.y), dQ = isFinite(fq) ? Math.hypot(p.x - qp.x, p.y - qp.y) : 1e9;
      var inTop = p.y >= A.T - 10 && p.y <= A.B + 10, inBot = p.y >= B.T - 10 && p.y <= B.B + 10;
      if(dQ < 24 && dQ < dP) S.drag = { what: 'q' };
      else if(dP < 26) S.drag = { what: 'p' };
      else if(inTop || inBot){ S.drag = { what: 'p' }; moveP(p.x); }
      else return;
      (S.drag.what === 'q' ? hq : hp).classList.add('is-drag');
      try{ svg.setPointerCapture(e.pointerId); }catch(x){}
      e.preventDefault();
    });
    function moveP(px){
      var a = snapA(clampA(G.top.ix(px)), S.F), v = nearestValid(a);
      if(v == null) return;
      if(v !== a) v = M.round(v, 4);
      if(setA(v)) draw();
    }
    svg.addEventListener('pointermove', function(e){
      if(!S.drag || !G) return;
      var p = local(e);
      if(S.drag.what === 'p') moveP(p.x);
      else {
        var xq = G.top.ix(p.x), h = xq - S.a, ah = Math.abs(h);
        h = (h < 0 ? -1 : 1) * (ah < 0.0105 ? M.round(ah, 3) : ah < 0.105 ? M.round(ah, 3) : M.round(ah, 2));
        setH(h);
      }
    });
    function endDrag(){
      if(!S.drag) return;
      hp.classList.remove('is-drag'); hq.classList.remove('is-drag');
      S.drag = null;
      if(S.zoom > 1){ recenter(); }
      draw();
    }
    svg.addEventListener('pointerup', endDrag); svg.addEventListener('pointercancel', endDrag);

    /* --- keyboard on the handles --- */
    hp.addEventListener('keydown', function(e){
      var k = e.key, F = S.F, V = G ? G.top.x : F.x, span = V[1] - V[0], st = span / (S.zoom > 1 ? 80 : 120);
      st = st > 0.04 ? 0.05 : st > 0.004 ? 0.005 : 0.0005;
      var to = null;
      if(k === 'ArrowRight' || k === 'ArrowUp') to = S.a + st * (e.shiftKey ? 10 : 1);
      else if(k === 'ArrowLeft' || k === 'ArrowDown') to = S.a - st * (e.shiftKey ? 10 : 1);
      else if(k === 'PageUp') to = S.a + st * 10; else if(k === 'PageDown') to = S.a - st * 10;
      else if(k === 'Home') to = V[0]; else if(k === 'End') to = V[1];
      else return;
      e.preventDefault(); stopAnim(); act();
      // Land on a special point when the step crosses it.
      var sp = (F.special || []).map(function(s){ return s.x; }).concat(F.join != null ? [F.join] : []).filter(function(x){ return (x - S.a) * (x - to) < 0 || Math.abs(x - to) < st / 2; });
      if(sp.length) to = sp.sort(function(p, r){ return Math.abs(p - S.a) - Math.abs(r - S.a); })[0];
      else to = M.round(Math.round(to / st) * st, 5);
      to = Math.max(F.x[0], Math.min(F.x[1], to));
      var v = nearestValid(to); if(v == null) return;
      setA(v); if(S.zoom > 1) recenter(); draw();
      live(plain(hp.getAttribute('aria-valuetext')) + '. ' + plain(S.cls && S.cls.kind !== 'smooth' ? 'f′ does not exist here.' : 'Slope ' + F3(TT.slopeAt(S.F, S.a)) + '.'));
    });
    hq.addEventListener('keydown', function(e){
      var k = e.key, h = S.h, st = 0.05;
      if(k === 'ArrowRight' || k === 'ArrowUp') h = h + st * (e.shiftKey ? 10 : 1);
      else if(k === 'ArrowLeft' || k === 'ArrowDown') h = h - st * (e.shiftKey ? 10 : 1);
      else if(k === 'PageDown') h = h / 10; else if(k === 'PageUp') h = h * 10;
      else return;
      e.preventDefault(); stopAnim(); act();
      if(S.h * h <= 0) h = (h < 0 ? -1 : 1) * TT.HMIN;
      setH(M.round(h, 4));
      live('h = ' + sv(S.h) + '. Secant slope ' + F3(TT.dq(S.F.f, S.a, S.h)) + '.');
    });

    /* --- buttons --- */
    tanB.addEventListener('click', function(){ act(); S.tan = !S.tan; tanB.setAttribute('aria-pressed', String(S.tan)); draw(); });
    shrinkB.addEventListener('click', function(){
      act();
      if(S.anim && S.anim.kind === 'shrink'){ stopAnim(); return; }
      stopAnim();
      var side = S.h < 0 ? -1 : 1, h0 = Math.abs(S.h) <= TT.HMIN * 1.5 ? Math.min(1, hmax()) : Math.abs(S.h), dur = 2.6;
      S.anim = { kind: 'shrink', loop: P.loop(function(dt, t){ setH(side * h0 * Math.pow(TT.HMIN / h0, Math.min(1, t / dur)), true); syncH(); draw(); }, {
        duration: dur, still: function(){ setH(side * TT.HMIN, true); syncH(); draw(); }, onEnd: function(){ S.anim = null; shrinkB.textContent = 'h → 0'; setH(side * TT.HMIN, true); syncH(); draw(); } }) };
      shrinkB.textContent = 'Stop';
      S.anim.loop.start();
    });
    traceB.addEventListener('click', function(){
      act();
      if(S.anim && S.anim.kind === 'trace'){ stopAnim(); return; }
      stopAnim();
      var F = S.F; S.zoom = 1; S.view = null; zoomBtns();
      var x0 = F.x[0], x1 = F.x[1], dur = 6;
      for(var i = 0; i <= 200 && !isFinite(F.f(x0)); i++) x0 += (x1 - F.x[0]) / 200;
      S.trace = []; S.h = (S.h < 0 ? -1 : 1) * TT.HMIN; syncH();
      setA(x0, 'jump');
      S.anim = { kind: 'trace', loop: P.loop(function(dt, t){ var a = x0 + (x1 - x0) * Math.min(1, t / dur); a = M.round(a, 4); if(isFinite(F.f(a))){ setA(a); } draw(); }, {
        duration: dur, still: function(){ setA(x1); draw(); }, onEnd: function(){ S.anim = null; traceB.setAttribute('aria-pressed', 'false'); traceB.textContent = 'Trace f′'; setA(M.round(x1, 4)); draw(); live('Traced: the blue graph is f′. Each of its heights is a slope of f.'); } }) };
      traceB.setAttribute('aria-pressed', 'true'); traceB.textContent = 'Stop';
      S.anim.loop.start();
    });
    function stopAnim(){
      if(!S.anim) return;
      var k = S.anim.kind; S.anim.loop.stop(); S.anim = null;
      if(k === 'shrink') shrinkB.textContent = 'h → 0';
      if(k === 'trace'){ traceB.setAttribute('aria-pressed', 'false'); traceB.textContent = 'Trace f′'; }
      draw();
    }

    /* --- Tool Studio: the graphs on the stage; the function, h, the
       buttons and the table in the dock; the reasoning in Why; zoom,
       numbers and the formula in Details. --- */
    function studio(pane, s){
      LS = s;
      if(s.detailsTitle) s.detailsTitle('Numbers & view');
      var o = { mode: 'explore' };
      var stage = el('div', 'tt-ls-stage'); stage.appendChild(q('.tt-stage')); stage.appendChild(q('.tt-live'));
      s.add('stage', stage, o);
      var dock = q('.tt-dock'); dock.classList.add('tt-ls-dock');
      s.add('dock', dock, o);
      var w = el('div', 'ls-sec tt-ls-why'); w.appendChild(q('.tt-why')); s.add('why', w, o);
      var d = el('div', 'ls-sec tt-ls-det'); d.appendChild(q('.tt-det'));
      Array.prototype.slice.call(pane.querySelectorAll(':scope > *')).forEach(function(k){ if(k.textContent.trim()) d.appendChild(k); });
      s.add('details', d, o);
      boot();
      // The tip points at the whole h control (label, slider and ruler), so it
      // sits above or below it and never over the "Distance h" label (audit 2026-10).
      if(s.mode() === 'explore') s.hint({ target: q('.tt-hctl'), text: 'Slide h toward 0', round: 14 });
    }
    function boot(){
      // On a phone the stage needs the room: the table starts folded.
      try{ if(window.innerWidth < 600) q('.tt-dqd').open = false; }catch(e){}
      q('.tt-dqd').addEventListener('toggle', function(){ if(sized) setTimeout(sized.redraw, 30); });
      sized = fit(q('.tt-stage'), function(){ draw(); });
      setF(TT.FUNCS.quad);
    }
    if(!(window.LevlStudio && T.studioOf(host))){
      q('.tt-stage').insertAdjacentHTML('afterend', '<p class="tx-where tt-cap"></p>');
      boot();
    }
    return { studio: studio, stop: function(){ stopAnim(); }, redraw: function(){ if(sized) sized.redraw(); } };
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
        T.choiceMarks(s.options[t.pick], 'x').xs.forEach(function(x){ mk.push({ point: [x, 0], who: who, label: who === 'yours' ? 'yours' : '' }); });
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

  T.mount(SLUG, function(app, data){
    var ex = null, qz = null;
    T.modes(app, { slug: SLUG, labels: ['Explore', 'Test yourself'],
      explore: function(host){ ex = explore(host, data); },
      quiz: function(host){ qz = quiz(host, data); },
      onShow: function(m){
        if(m !== 'explore' && ex) ex.stop();
        // A pane that was hidden has no size: draw it again once it shows.
        setTimeout(function(){ if(m === 'explore' && ex) ex.redraw(); if(m === 'quiz' && qz) qz.redraw(); }, 30);
      },
      studio: { explore: function(pane, s){ ex.studio(pane, s); } } });
  });
})();
