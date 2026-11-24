/* Limit explorer, tools v2 (docs/tools-v2-calc-limit-explorer-brief.md; the standard: docs/tools-v2-standard.md). On
   the shared kit (assets/course/tool-kit2.js) through the course adapter ApCalcTools.studioKit2, after the Tangent
   tracer (its road, car and magnifier are redrawn here, so that tool is untouched). OWNED BY THIS TOOL ONLY. The model
   is ApCalcMath.limitExplorer (tools/math/limit-explorer.js, unchanged); curves are sampled with ApCalcPlot
   (calc-plot.js), math text is ApCalcTex. Styles: limit-explorer.css.

   EXPLORE (free play, nothing graded, no side panel): two tabs, one idea each.
     1 Close in on a point: the curve is a road; drag the purple car (from the left) and the orange car (from the
       right) toward x = a. Each nose is (x, f(x)), its tag reads f(x) and a thin line carries its height to the y
       axis. A magnifier follows them in. A hole is a gap with an open circle, a jump a broken road, a point out of
       place a lamp post, an asymptote a road off the top, sin(1/x) a road that buckles faster than it can be drawn,
       the squeeze a road between two guard rails. "Close in" (to 0.001 from a), "Fill the hole" where it is removable.
     2 Out to infinity: the same road on an x axis squeezed by powers of ten; the cars drive out to x = ±10,000 and
       the height levels off at y = 2. "Drive out".
     The cause line (K.cause) says why, live; the curve picker sits by "Show me how"; "?" holds the table of values,
     the limits, the continuity check, how to say it, the formula and the keys.

   TEST YOURSELF (unchanged): ApCalcTools.drill over the model's twelve kinds; a graph or table figure goes on the
   stage, drawn from the problem's own functions; first tries recorded as limit-explorer:<context>:<step>. */
(function(){
  'use strict';
  var T = window.ApCalcTools, M = window.ApCalcMath, P = window.ApCalcPlot;
  if(!T || !M || !M.limitExplorer || !P) return;
  var LE = M.limitExplorer, esc = T.esc;
  var NS = 'http://www.w3.org/2000/svg';
  function X(){ return window.ApCalcTex; }
  function tx(s){ return X() ? X().html(String(s)) : String(s); }
  function tm(t, display){ return X() ? X().render(t, { display: !!display }) : esc(t); }

  /* Text with its formulas in words, for screen readers (an option that is
     only a formula has no name otherwise). */
  function plainOf(s){ return String(s).replace(/\$\$([\s\S]*?)\$\$|\$([^$]*)\$/g, function(m, a, b){ return X() ? X().text(a || b) : (a || b); }); }
  /* Problems carry TeX between $...$; render every string the drill shows. */
  function texify(p){
    p.text = tx(p.text);
    p.solution = p.solution.map(tx);
    p.steps.forEach(function(s){
      s.label = tx(s.label);
      if(s.hint) s.hint = tx(s.hint);
      // Wrapped, so text and formulas stay one line in a flex label.
      if(s.options) s.options = s.options.map(function(o){ return /\$/.test(o) ? '<span class="le-opt" aria-hidden="true">' + tx(o) + '</span><span class="sr-only">' + esc(plainOf(o)) + '</span>' : '<span class="le-opt">' + tx(o) + '</span>'; });
      if(s.why) s.why = s.why.map(tx);
      if(s.cell && s.cell.mistakes) s.cell.mistakes.forEach(function(m){ m.why = tx(m.why); });
    });
    return p;
  }
  /* ------------------------------------------- Test yourself is visual */
  /* docs/tool-audit-2026-10.md X1. A problem given as a formula gets its
     graph on the stage after the first try (drawn from the problem's own
     functions), and every try is marked on it: the student's value dashed,
     the right one solid, at x = a. */
  var QZ = { marks: T.tries(), last: {}, plot: null, host: null };
  var METHOD = {
    'graph.left': 'Put a finger on the curve left of a and slide it toward a: the height it heads for is the limit, wherever the dot is.',
    'graph.right': 'Slide along the curve from the right toward a. Ignore the filled dot at a itself.',
    two: 'A two-sided limit exists only when the left and right limits are the same number.',
    'graph.value': 'f(a) is the filled dot at x = a. An open circle is a point the graph leaves out.',
    'table.left': 'Read the f(x) column as x comes up to a from below: what number do the values settle on?',
    'table.right': 'Read the values as x comes down to a from above.',
    'onesided.left': 'From the left (x < a), use the piece written for x < a, and substitute x = a into it.',
    'onesided.right': 'From the right (x > a), use the piece written for x ≥ a, and substitute x = a.',
    law1: 'Put the given limit of f in for f(x) and the limit of g in for g(x), then do the arithmetic.',
    law2: 'Put the given limit of f in for f(x) and the limit of g in for g(x), then do the arithmetic.',
    sub: 'Substitute x = a into the top and the bottom separately.',
    move: 'A square root over 0/0: multiply top and bottom by the conjugate.',
    simp: 'Factor top and bottom, cancel the factor that is 0 at x = a, and write what is left.',
    'algebra.lim': 'Substitute x = a into the simplified expression.',
    bounds: 'Start from −1 ≤ sin(…) ≤ 1 (or cos) and multiply through by the size of the factor in front.',
    lo: 'Substitute x = a into the lower bound: the squared term is 0 there.',
    hi: 'Substitute x = a into the upper bound: the squared term is 0 there.',
    'squeeze.lim': 'Both bounds head for the same number, and f is trapped between them.',
    type: 'A hole or a point out of place is removable; two different heights from each side is a jump; a vertical asymptote is infinite.',
    fails: 'Check the three conditions in order: f(a) defined, the limit exists, and the two are equal.',
    value: 'f(a) comes from the line of the definition written for x = a.',
    'continuity.lim': 'Substitute x = a into the left piece and the right piece. Equal results mean the limit is that number.',
    cont: 'Continuous at a means f(a) is defined, the limit exists, and they are equal.',
    rule: 'Continuity at a needs f(a) to equal the limit at a.',
    k: 'Make the left piece at x = a equal to the right piece at x = a, then solve for k.',
    khole: 'k must equal the limit: factor the top, cancel the factor that is 0 at x = a, and substitute x = a into what is left.',
    'remove.right': 'Substitute x = a into the piece for x ≥ a.',
    'vertical.left': 'Find the sign of the top near a, and the sign of the bottom just left of a. Their quotient grows without bound with that sign.',
    'vertical.right': 'Find the sign of the top near a, and the sign of the bottom just right of a.',
    dom: 'For huge |x|, only the highest power on top and on the bottom matters.',
    pinf: 'Compare the degrees: bottom higher gives 0, equal gives the ratio of leading coefficients, top higher gives ±∞.',
    minf: 'Same comparison as x → ∞, but watch the sign of an odd power of a negative x.',
    hyp: 'The IVT needs one thing: f continuous on the closed interval.',
    count: 'Count the intervals between table values where f goes from below the line to above it, or the reverse.',
    just: 'Name continuity on the closed interval and show the target value lies between f(a) and f(b).'
  };
  /* The problem's graph, from its key, for the kinds given as a formula. */
  function quizSpec(p){
    var k = p.key || {}, a = k.a, f = null, curves = [], pts = [], asy = [], x = null, y = null, lab = 'Graph of f';
    // A y window that holds most of the curve (a spike near an asymptote is
    // clipped: 8th to 92nd percentile) and every value the problem names.
    function win(fs, xr, extra){
      var v = [];
      fs.forEach(function(q){ for(var i = 0; i <= 120; i++){ var xx = q[1] + (q[2] - q[1]) * i / 120, yy = q[0](xx); if(isFinite(yy)) v.push(yy); } });
      v.sort(function(p0, q0){ return p0 - q0; });
      var lo = v.length ? v[Math.floor(v.length * 0.08)] : -5, hi = v.length ? v[Math.ceil(v.length * 0.92) - 1] : 5;
      (extra || []).forEach(function(e){ if(isFinite(e)){ lo = Math.min(lo, e); hi = Math.max(hi, e); } });
      var pad = Math.max(1, (hi - lo) * 0.15);
      return [Math.floor(lo - pad), Math.ceil(hi + pad)];
    }
    if(p.type === 'onesided' || p.type === 'continuity'){
      x = [a - 3, a + 3];
      curves = [{ fn: k.left, domain: [a - 3, a], cls: 's1', ends: [null, 'open'] }, { fn: k.right, domain: [a, a + 3], cls: 's1', ends: [p.type === 'onesided' ? 'closed' : 'open', null] }];
      if(p.type === 'continuity') pts.push({ at: [a, k.v], cls: 's1' });
      y = win([[k.left, a - 3, a], [k.right, a, a + 3]], x, [k.v]);
      lab = 'Graph of the piecewise function f near x = ' + a;
    } else if(p.type === 'algebra' || p.type === 'table' || (p.type === 'remove' && k.kind === 'hole')){
      f = k.f; x = [a - 3, a + 3];
      var Lh = p.type === 'remove' ? k.k : k.L != null ? k.L : k.R;
      curves = [{ fn: function(t){ return Math.abs(t - a) < 1e-9 ? NaN : f(t); }, domain: x, cls: 's1' }];
      if(isFinite(Lh)) pts.push({ at: [a, Lh], open: true, cls: 's1' });
      y = win([[f, a - 3, a - 0.01], [f, a + 0.01, a + 3]], x, [Lh]);
      lab = 'Graph of f near x = ' + a + ', with the hole at x = ' + a;
    } else if(p.type === 'remove' && k.kind === 'join'){
      var lf = function(t){ return k.k * t + k.b; }, rf = function(t){ return t * t + k.c; };
      x = [a - 3, a + 3];
      curves = [{ fn: rf, domain: [a, a + 3], cls: 's1', ends: ['closed', null] }];
      y = win([[rf, a, a + 3], [lf, a - 3, a]], x);
      lab = 'Graph of the right piece of f; the left piece is the line kx + b';
      QZ.join = lf;
    } else if(p.type === 'squeeze'){
      a = a || 0; x = [a - 2, a + 2];
      curves = [{ fn: k.lo, domain: x, cls: 's2', label: 'lower' }, { fn: k.hi, domain: x, cls: 's4', label: 'upper' }];
      if(k.f) curves.push({ fn: function(t){ return Math.abs(t - a) < 1e-6 ? NaN : k.f(t); }, domain: x, cls: 's1' });
      y = win([[k.lo, x[0], x[1]], [k.hi, x[0], x[1]]], x);
      lab = 'The two bounds and the function trapped between them near x = ' + a;
    } else if(p.type === 'vertical'){
      f = k.f; x = [a - 3, a + 3];
      curves = [{ fn: f, domain: [a - 3, a - 0.02], cls: 's1' }, { fn: f, domain: [a + 0.02, a + 3], cls: 's1' }];
      asy = [{ x: a }];
      y = [-10, 10];
      lab = 'Graph of f with the vertical asymptote x = ' + a;
    } else if(p.type === 'infinity'){
      f = k.f; x = [-20, 20];
      var safe = function(t){ var v = f(t); return Math.abs(v) > 1e3 ? NaN : v; };
      curves = [{ fn: safe, domain: x, cls: 's1' }];
      y = win([[safe, 5, 20], [safe, -20, -5]], x, [isFinite(k.Lp) ? k.Lp : NaN, isFinite(k.Lm) ? k.Lm : NaN]);
      if(isFinite(k.Lp)) asy.push({ y: k.Lp });
      lab = 'Graph of f for large positive and negative x';
    } else return null;
    if(!(y[1] > y[0])) y = [-5, 5];
    return { label: lab, x: x, y: y, xLabel: 'x', yLabel: 'y', xStep: x[1] - x[0] > 12 ? 5 : 1, yStep: y[1] - y[0] > 12 ? (y[1] - y[0] > 30 ? 5 : 2) : 1, curves: curves, points: pts, asymptotes: asy };
  }
  function quizPlot(p){
    if(QZ.plot) return QZ.plot;
    var spec = quizSpec(p); if(!spec || !QZ.host) return null;
    var box = document.createElement('figure'); box.className = 'cd-fig le-fig le-qplot';
    QZ.host.appendChild(box);
    function draw(){
      if(!box.isConnected) return;
      var r = box.getBoundingClientRect(), w = Math.round(r.width), h = Math.round(r.height);
      spec.width = Math.max(240, Math.min(900, w || 420)); spec.height = Math.max(160, Math.min(560, h > 80 ? h : spec.width * 0.62));
      box.innerHTML = P.svg(spec).replace(/<\/svg>$/, QZ.marks.svg(P.frame(spec)) + '</svg>');
    }
    QZ.plot = { redraw: draw };
    draw(); requestAnimationFrame(function(){ requestAnimationFrame(draw); });
    if(window.ResizeObserver){ var t = null; new ResizeObserver(function(){ clearTimeout(t); t = setTimeout(draw, 60); }).observe(box); }
    return QZ.plot;
  }
  function quizTry(s, t, p){
    var k = p.key || {}, who = t.ok || t.shown ? 'right' : 'yours', mk = [], a = k.a != null ? k.a : 0;
    var val = who === 'right' && s.cell ? s.cell.answer : t.value, N = T.numText;
    // a graph problem draws on its own figure; the rest get their graph now
    var F = p.fig && p.fig.plot && p.type !== 'ivt' ? QZ.figPlot : p.type === 'ivt' ? QZ.figPlot : quizPlot(p);
    if(!F) return false;
    if(p.type === 'ivt' && s.key === 'count'){
      // the intervals where f crosses the line y = k: one guaranteed solution in each
      if(who === 'right') for(var q = 0; q + 1 < k.xs.length; q++) if((k.ys[q] - k.k) * (k.ys[q + 1] - k.k) < 0) mk.push({ line: [[k.xs[q], k.ys[q]], [k.xs[q + 1], k.ys[q + 1]]], who: 'right' });
      if(who === 'right') mk.push({ label: N(val) + ' crossing' + (val === 1 ? '' : 's') + ' of y = ' + N(k.k), at: [k.xs[k.xs.length - 1], 1e9], who: 'right', anchor: 'end' });
      else if(isFinite(val)) mk.push({ label: 'yours: ' + N(val), at: [k.xs[0], 1e9], who: 'yours', anchor: 'start' });
    } else if(s.kind === 'num' && isFinite(val)){
      var side = s.key === 'left' ? -1 : s.key === 'right' ? 1 : 0;
      if(p.type === 'laws') return false;
      if(s.key === 'k' && k.kind === 'join'){
        // the left piece with the typed k, against the right piece
        var kk = val, lf = function(x){ return kk * x + k.b; };
        mk.push({ curve: lf, domain: [a - 3, a], who: who, label: who === 'yours' ? 'yours: k = ' + N(kk) : 'k = ' + N(kk) });
      } else {
        var at = side ? a + side * 0.25 : a;
        mk.push({ point: [at, val], who: who, label: (who === 'yours' ? 'yours: ' : '') + N(val) });
        mk.push({ hline: val, who: who });
      }
    } else if(s.kind === 'expr' && t.fn){
      mk.push({ curve: t.fn, who: who, label: who === 'yours' ? 'yours' : 'what is left' });
    } else if(s.kind === 'choice' && t.pick > -1 && (p.type === 'vertical' || p.type === 'infinity')){
      var txt = T.plainText(String(s.options[t.pick])), inf = /−∞|-∞|-\\infty/.test(txt) ? -1 : /∞|infty/.test(txt) ? 1 : 0;
      if(inf){
        var xEnd = p.type === 'vertical' ? a + (s.key === 'left' ? -0.3 : 0.3) : (s.key === 'minf' ? -18 : 18);
        mk.push({ line: [[xEnd, 0], [xEnd, inf * 1e6]], who: who, label: (who === 'yours' ? 'yours: ' : '') + (inf > 0 ? '+∞' : '−∞') });
      } else return false;
    } else return false;
    if(who === 'yours') QZ.last[s.key] = mk; else if(QZ.last[s.key]) mk = QZ.last[s.key].concat(mk);
    QZ.marks.set(s.key, mk); F.redraw();
    return true;
  }

  /* ------------------------------------------------ the drill's figure */
  function figure(host, p){
    if(!p.fig) return;
    var fig = document.createElement('figure');
    fig.className = 'cd-fig le-fig';
    host.appendChild(fig);
    if(p.fig.table){
      // Two halves side by side, each read top to bottom. A limit table's
      // halves are the two sides of a: purple from the left, orange from
      // the right.
      var tb = p.fig.table, xs = tb.cols.slice(1), ys = tb.rows[0].slice(1), A = tb.a, h = Math.ceil(xs.length / 2);
      var aT = A == null ? '' : (A < 0 ? '{' + A + '}' : String(A));
      var half = function(from, to, side){
        var cap = A == null ? '' : '<caption class="' + side + '">' + tx('$x \\to ' + aT + (side === 'l' ? '^-' : '^+') + '$') + '</caption>';
        return '<table class="le-vtab' + (side ? ' ' + side : '') + '">' + cap + '<thead><tr><th scope="col">' + tx(tb.cols[0]) + '</th><th scope="col">' + tx(tb.rows[0][0]) + '</th></tr></thead><tbody>' +
          xs.slice(from, to).map(function(x, i){ return '<tr><th scope="row">' + tx(x) + '</th><td>' + tx(ys[from + i]) + '</td></tr>'; }).join('') + '</tbody></table>';
      };
      fig.classList.add('le-tfig');
      fig.innerHTML = '<div class="le-vtabs" role="group" aria-label="Table of values">' + half(0, h, A == null ? '' : 'l') + half(h, xs.length, A == null ? '' : 'r') + '</div>';
      if(!p.fig.plot) return;
      // A table with a picture of its points (IVT): the plot beside it.
      fig.classList.add('le-fig2');
      var pf = document.createElement('div');
      pf.className = 'le-fig2-plot';
      fig.appendChild(pf);
      fig = pf;
    }
    var spec = p.fig.plot;
    // Drawn at the size it is shown, so labels keep their size.
    function fit(){
      if(!fig.isConnected) return;
      var r = fig.getBoundingClientRect(), w = Math.round(r.width), h = Math.round(r.height);
      if(fig.classList.contains('le-fig2-plot')) h = Math.min(h, Math.round(w * 0.8));
      // Never drawn wider than its box (a scaled-down svg shrinks its labels).
      spec.width = Math.max(fig.classList.contains('le-fig2-plot') ? 150 : 240, Math.min(900, w || 420));
      spec.height = Math.max(140, Math.min(620, h > 60 ? h : spec.width * 0.66));
      fig.innerHTML = P.svg(spec).replace(/<\/svg>$/, QZ.marks.svg(P.frame(spec)) + '</svg>');
    }
    QZ.figPlot = { redraw: fit };
    fig.innerHTML = P.svg(spec);
    requestAnimationFrame(function(){ requestAnimationFrame(fit); });
    if(window.ResizeObserver){ var t = null; new ResizeObserver(function(){ clearTimeout(t); t = setTimeout(fit, 60); }).observe(fig); }
  }

  /* ======================================================= EXPLORE (tools v2) */
  /* docs/tools-v2-calc-limit-explorer-brief.md. Two tabs, one idea each:
       1 Close in on a point: the curve is a road (its center line IS y = f(x) on the graph's grid). Two cars drive
         toward x = a, purple from the left and orange from the right; each nose is a point (x, f(x)) and its tag
         reads f(x); a thin line from each nose to the y axis shows its height. Within a few millimetres of a, a
         magnifier opens and keeps both noses in view (its zoom follows them). The limit is the height both sides
         head for, whatever happens at a itself. "Close in" drives both to 0.001 from a; "Fill the hole" (a
         removable point only) redefines f(a) as the limit.
       2 Out to infinity: the same road on an x axis squeezed by powers of ten (each grid step is ×10), so the cars
         drive out to x = ±10,000; the height levels off at the horizontal asymptote y = 2. "Drive out".
     Every number on the picture and in the cause line is read from the cars where they are drawn (S.dl, S.dr, S.xl,
     S.xr), never from a target. "?" holds the table of values, the limits, the continuity check, how to say it, the
     formula and the keys. Colours: from the left purple, from the right orange, the limit blue, "no limit" red. */
  var WIN = {
    hole: { x: [-1.5, 3.5], y: [-0.5, 4.5] },
    move: { x: [-0.5, 4.5], y: [-0.5, 6.5] },
    jump: { x: [-1.5, 3.5], y: [-1, 4.5] },
    vasym: { x: [-0.5, 4.5], y: [-6, 6] },
    osc: { x: [-1.5, 1.5], y: [-1.6, 1.6] },
    squeeze: { x: [-1.5, 1.5], y: [-1.6, 1.6] }
  };
  var LENSABLE = { hole: 1, move: 1, jump: 1, squeeze: 1, osc: 1 };
  var DMIN = 0.0001, DEND = 0.001, XMAX = 10000, CLOSE = 0.01, FAR = 1000;
  var uid = 0;
  function el(tag, cls, html){ var e = document.createElement(tag); if(cls) e.className = cls; if(html != null) e.innerHTML = html; return e; }
  function clamp(v, a, b){ return Math.max(a, Math.min(b, v)); }
  function r1(v){ return Math.round(v * 10) / 10; }
  function U(x){ return (x < 0 ? -1 : 1) * Math.log10(1 + Math.abs(x)); }
  function Ui(u){ return (u < 0 ? -1 : 1) * (Math.pow(10, Math.abs(u)) - 1); }
  function commas(s){ return String(s).replace(/\B(?=(\d{3})+(?!\d))/g, ','); }
  function mn(s){ s = String(s); if(s === '-0') s = '0'; return s.replace(/^-/, '−'); }
  /* A panel: a pixel rectangle and its windows; log: the x axis squeezed by powers of ten (U). */
  function frameOf(x, y, L, Tp, W, H, log){
    var f = log ? U : function(v){ return v; }, fi = log ? Ui : function(v){ return v; }, u0 = f(x[0]), u1 = f(x[1]);
    return { x: x, y: y, L: L, T: Tp, R: L + W, B: Tp + H, W: W, H: H, log: !!log,
      sx: function(v){ return L + (f(v) - u0) / (u1 - u0) * W; },
      sy: function(v){ return Tp + (y[1] - v) / (y[1] - y[0]) * H; },
      ix: function(px){ return fi(u0 + (px - L) / W * (u1 - u0)); },
      iy: function(py){ return y[1] - (py - Tp) / H * (y[1] - y[0]); } };
  }
  /* Digits that show a distance d from a: x with as many decimals as d needs, f(x) one more. */
  function decOf(d){ return clamp(1 - Math.floor(Math.log10(d) + 1e-9), 0, 6); }
  function fmtX(x, d){ return mn(String(+(+x).toFixed(decOf(d)))); }
  function fmtY(y, d){
    if(!isFinite(y)) return 'undefined';
    var ay = Math.abs(y);
    if(ay >= 1000) return mn(commas(Math.round(y)));
    if(ay >= 100) return mn(String(+y.toFixed(1)));
    return mn(String(+y.toFixed(clamp(decOf(d) + 1, 2, 5))));
  }
  function fmtBig(x){ var a = Math.abs(x); return mn((x < 0 ? '-' : '') + (a >= 10 ? commas(Math.round(a)) : String(+a.toFixed(1)))); }
  function fmtY2(y){ return mn(String(+y.toFixed(3))); }
  function limWord(v){ return v === Infinity ? '∞' : v === -Infinity ? '−∞' : isNaN(v) ? 'none' : mn(String(v)); }
  /* 2 significant digits (a drag lands on 0.012, not 0.0119384). */
  function sig2(v){ var p = Math.pow(10, Math.floor(Math.log10(v)) - 1); return +(Math.round(v / p) * p).toPrecision(2); }

  function explore(host, data){
    var K = window.LevlKit2, id = 'le' + (++uid), INF = LE.entry('inf');
    var S = { tab: 'point', P: LE.GALLERY[0], dl: 1, dr: 1, tl: 1, tr: 1, xl: 3, xr: 3, txl: 3, txr: 3, filled: false, fillK: 0,
      fillPending: false, mode: 'explore', took: null, closeV: 0, driveV: 0, lensDrag: false, ready: false };
    var LENS = { show: 0, w: 1, frozen: null, pxF: 0, cx: 0, cy: 0, R: 0, yc: 0 };
    var G = null, LS = null;
    function curE(){ return S.tab === 'point' ? S.P : INF; }
    function f(x){ return curE().f(x); }
    function dense(){ return S.tab === 'point' && !!S.P.dense; }
    function dmax(){ var V = WIN[S.P.id], a = S.P.a; return Math.floor((Math.min(a - V.x[0], V.x[1] - a) - 0.05) * 10 + 1e-9) / 10; }
    function xOf(side){ return S.tab === 'point' ? S.P.a + side * (side < 0 ? S.dl : S.dr) : side * (side < 0 ? S.xl : S.xr); }
    function xmin(){ return G && G.xmin ? G.xmin : 3; }
    function xstart(){ return Math.max(3, xmin()); }
    function dOf(side){ return side < 0 ? S.dl : S.dr; }

    /* ---------------------------------------------------- the stage */
    var stage = el('div', 'le2');
    var tabs = K.tabs({ label: 'What to explore', big: true, value: S.tab,
      items: [{ value: 'point', label: 'Close in on a point', short: 'Close in' }, { value: 'inf', label: 'Out to infinity', short: 'To infinity' }],
      onChange: function(v){ setTab(v); } });
    stage.appendChild(tabs.el);
    var head = K.head({ purpose: '', how: { label: 'Show me how', onClick: function(){ startTour(); } } });
    var pickWrap = el('label', 'le2-pick'), pick = el('select', 'le2-sel');
    pickWrap.innerHTML = '<span class="le2-pick-k">Curve</span>';
    pick.setAttribute('aria-label', 'Curve');
    LE.GALLERY.forEach(function(g){ var op = document.createElement('option'); op.value = g.id; op.textContent = g.name; pick.appendChild(op); });
    pick.value = S.P.id;
    pickWrap.appendChild(pick);
    head.el.insertBefore(pickWrap, head.how);
    stage.appendChild(head.el);
    var scene = el('div', 'le2-scene'); scene.id = id + '-scene';
    scene.innerHTML = '<svg class="le2-svg calc-plot" role="img" aria-label="" xmlns="' + NS + '" data-ls-text="keep"><defs></defs><g class="le2-static"></g><g class="le2-dyn"></g></svg>';
    stage.appendChild(scene);
    tabs.el.querySelectorAll('.tk2-tab').forEach(function(b){ b.setAttribute('aria-controls', scene.id); });
    var svg = scene.querySelector('svg'), defs = svg.querySelector('defs'), gS = svg.querySelector('.le2-static'), gD = svg.querySelector('.le2-dyn');
    var layer = K.layer(scene);
    var fillB = el('button', 'le2-fill'); fillB.type = 'button'; fillB.setAttribute('aria-pressed', 'false'); layer.el.appendChild(fillB);
    var lines = el('div', 'le2-lines'), cause = K.cause({ label: 'Why' });
    lines.appendChild(cause.el);
    var close = K.player({ min: 0, max: 1, speed: 1 / 3, labels: { play: 'Close in', pause: 'Pause', again: 'Back out', rest: 'Close in' },
      get: function(){ return S.closeV; }, set: function(v){ closeTo(v); }, before: function(){ return closeStart(); }, onEnd: function(){ closeEnd(); } });
    var drive = K.player({ min: 0, max: 1, speed: 1 / 3, labels: { play: 'Drive out', pause: 'Pause', again: 'Back in', rest: 'Drive out' },
      get: function(){ return S.driveV; }, set: function(v){ driveTo(v); }, before: function(){ return driveStart(); }, onEnd: function(){ driveEnd(); } });
    close.el.classList.add('is-sm'); drive.el.classList.add('is-sm');
    lines.appendChild(close.el); lines.appendChild(drive.el);
    stage.appendChild(lines);
    var live = el('p', 'tk2-sr'); live.setAttribute('aria-live', 'polite'); stage.appendChild(live);
    function say(t){ live.textContent = ''; setTimeout(function(){ live.textContent = t; }, 40); }

    /* ---------------------------------------------------- geometry */
    function geo(W, H){
      var narrow = W < 560, g = { W: W, H: H, narrow: narrow };
      g.car = clamp(W * 0.04, 38, 54); g.rw = narrow ? 10 : 12; g.ringR = g.car * 0.62 + 4;
      var pl = narrow ? 36 : 44, pr = narrow ? 10 : 16, pt = 8, pb = 24, AW = W - pl - pr, AH = H - pt - pb;
      var padX = g.car + 16, padT = g.car * 0.3 + g.ringR + 40, padB = g.ringR + 44, V, kx, ky;
      if(S.tab === 'point'){
        V = WIN[S.P.id]; kx = (AW - 2 * padX) / (V.x[1] - V.x[0]); ky = (AH - padT - padB) / (V.y[1] - V.y[0]);
        g.A = frameOf([V.x[0] - padX / kx, V.x[1] + padX / kx], [V.y[0] - padB / ky, V.y[1] + padT / ky], pl, pt, AW, AH);
      } else {
        // the noses point outward and the bodies trail in toward 0: a little room past ±10,000 is enough
        var u = 4.1, px2 = 16; V = { y: [-1.4, 3.6] }; kx = (AW - 2 * px2) / (2 * u); ky = (AH - padT - padB) / (V.y[1] - V.y[0]);
        var uu = u + px2 / kx;
        // the nearest the cars come to 0: their rings never touch (a phone squeezes the axis more)
        g.xmin = Math.max(1, sig2(Ui((g.car / 2 + g.ringR + 6) / kx)));
        g.A = frameOf([Ui(-uu), Ui(uu)], [V.y[0] - padB / ky, V.y[1] + padT / ky], pl, pt, AW, AH, true);
      }
      g.kx = kx; g.ky = ky;
      return g;
    }
    /* The road as runs of pixel points, sampled every 2 px; broken where f is undefined. */
    function runsOf(A, lo, hi){
      var X0 = A.sx(lo), X1 = A.sx(hi), n = Math.max(60, Math.round(Math.abs(X1 - X0) / 2)), out = [], run = [], F = curE().f;
      function end(){ if(run.length > 1) out.push(run); run = []; }
      if(!(hi > lo)) return out;
      for(var i = 0; i <= n; i++){
        var X = X0 + (X1 - X0) * i / n, x = i === 0 ? lo : i === n ? hi : A.ix(X), y = F(x);
        if(!isFinite(y)){ end(); continue; }
        run.push({ x: x, X: X, Y: clamp(A.sy(y), A.T - 80, A.B + 80) });
      }
      end();
      return out;
    }
    /* Every point curve breaks at a: a hole leaves a gap one slab wide, a jump and an asymptote break the road. */
    function roadRuns(A){
      if(S.tab !== 'point') return runsOf(A, A.x[0], A.x[1]);
      var a = S.P.a, g = S.P.kind === 'removable' ? G.rw * 0.95 / G.kx : 1e-9;
      return runsOf(A, A.x[0], a - g).concat(runsOf(A, a + g, A.x[1]));
    }
    /* sin(1/x) swings with period about 2πx² near 0: where that is under 36 px the swings cannot be drawn one by one,
       so that strip is a band between the curve's bounds (−1 and 1, or ±|x|), and outside it the curve is sampled
       with at least 14 points a swing (capped). */
    function bandHalf(kxp){ return Math.sqrt(36 / (2 * Math.PI * kxp)); }
    function denseRuns(map, lo, hi, kxp){
      var out = [], F = S.P.f, a = S.P.a, xc = bandHalf(kxp);
      function seg(x0, x1){
        if(!(x1 > x0)) return;
        var pts = [], x = x0, n = 0;
        while(n < 5000){
          var y = F(x); if(isFinite(y)) pts.push({ x: x, X: map.sx(x), Y: map.sy(y) });
          if(x >= x1) break;
          var per = 2 * Math.PI * x * x * kxp;
          x = Math.min(x1, x + Math.max(1.5, Math.min(3, per / 14)) / kxp); n++;
        }
        if(pts.length > 1) out.push(pts);
      }
      seg(lo, a - xc); seg(a + xc, hi);
      return out;
    }
    function boundsOf(){ var b = S.P.bounds; return b ? b : [function(){ return -1; }, function(){ return 1; }]; }
    function bandPath(map, kxp, lo, hi){
      var xc = bandHalf(kxp), a = S.P.a, b = boundsOf(), top = [], bot = [], x0 = Math.max(lo, a - xc), x1 = Math.min(hi, a + xc);
      for(var i = 0; i <= 40; i++){ var x = x0 + (x1 - x0) * i / 40; top.push(r1(map.sx(x)) + ' ' + r1(map.sy(b[1](x)))); bot.unshift(r1(map.sx(x)) + ' ' + r1(map.sy(b[0](x)))); }
      return 'M' + top.join('L') + 'L' + bot.join('L') + 'Z';
    }
    /* the strip drawn as a road buckling up and down every 3 px between the bounds */
    function bandZig(map, kxp, lo, hi){
      var xc = bandHalf(kxp), a = S.P.a, b = boundsOf(), x0 = Math.max(lo, a - xc), x1 = Math.min(hi, a + xc), X0 = map.sx(x0), X1 = map.sx(x1), n = Math.max(2, Math.round((X1 - X0) / 3)), d = [];
      for(var i = 0; i <= n; i++){ var x = x0 + (x1 - x0) * i / n; d.push(r1(map.sx(x)) + ' ' + r1(map.sy(b[i % 2](x)))); }
      return '<path class="le2-band" d="' + bandPath(map, kxp, lo, hi) + '"/><path class="le2-zig" d="M' + d.join('L') + '"/>';
    }
    function pathOfRun(r){ return 'M' + r.map(function(p){ return r1(p.X) + ' ' + r1(p.Y); }).join('L'); }
    /* A soft hillside under the road: thinner where the road is steep, never below the x axis (tangent tracer). */
    function bandOf(r, d0, d1, ax){
      function at(i, d){
        var p = r[i], q0 = r[Math.max(0, i - 1)], q1 = r[Math.min(r.length - 1, i + 1)], dx = q1.X - q0.X, s = dx > 0.01 ? (q1.Y - q0.Y) / dx : 9, k = 1 / (1 + s * s), y = p.Y + d * k;
        if(ax != null && p.Y <= ax) y = Math.min(y, ax);
        return r1(p.X) + ' ' + r1(y);
      }
      var top = [], bot = [];
      for(var i = 0; i < r.length; i++){ top.push(at(i, d0)); bot.unshift(at(i, d1)); }
      return 'M' + top.join('L') + 'L' + bot.join('L') + 'Z';
    }
    function roadOf(runs, rw){
      return runs.map(function(r){ var d = pathOfRun(r); return '<path class="le2-shoulder" style="stroke-width:' + (rw + 6) + 'px" d="' + d + '"/><path class="le2-road" style="stroke-width:' + rw + 'px" d="' + d + '"/><path class="le2-lane" d="' + d + '"/>'; }).join('');
    }

    /* ---------------------------------------------------- the static picture: sky, grid, hillside, road */
    function tickLabel(v){ return mn(String(+v.toPrecision(6))); }
    function gridOf(A){
      var o = ['<g class="le2-grid">'], xt, xl;
      if(A.log){
        xt = [-10000, -1000, -100, -10, -1, 0, 1, 10, 100, 1000, 10000];
        xl = G.narrow ? [-10000, -100, 0, 100, 10000] : G.W < 900 ? [-10000, -1000, -100, -10, 0, 10, 100, 1000, 10000] : xt;
      } else {
        var nx = Math.max(3, Math.round(A.W / 70));
        xt = P.ticks(A.x[0], A.x[1], nx);
        for(var k1 = nx + 1; xt.length < 3 && k1 < 14; k1++) xt = P.ticks(A.x[0], A.x[1], k1);
        xl = xt;
      }
      var ny = Math.max(3, Math.round(A.H / 46)), yt = P.ticks(A.y[0], A.y[1], ny);
      for(var k0 = ny + 1; yt.length < 3 && k0 < 12; k0++) yt = P.ticks(A.y[0], A.y[1], k0);
      xt.forEach(function(v){ var p = r1(A.sx(v)); o.push('<line x1="' + p + '" y1="' + A.T + '" x2="' + p + '" y2="' + A.B + '"/>'); });
      yt.forEach(function(v){ var p = r1(A.sy(v)); o.push('<line x1="' + A.L + '" y1="' + p + '" x2="' + A.R + '" y2="' + p + '"/>'); });
      o.push('</g>');
      var ax = A.y[0] <= 0 && A.y[1] >= 0 ? A.sy(0) : null, ay = A.x[0] <= 0 && A.x[1] >= 0 ? A.sx(0) : null;
      o.push('<g class="le2-axis">' + (ax != null ? '<line x1="' + A.L + '" y1="' + r1(ax) + '" x2="' + A.R + '" y2="' + r1(ax) + '"/>' : '') + (ay != null ? '<line x1="' + r1(ay) + '" y1="' + A.T + '" x2="' + r1(ay) + '" y2="' + A.B + '"/>' : '') + '</g>');
      var lab = [];
      xl.forEach(function(v){ var px = A.sx(v); if(px < A.L - 0.5 || px > A.R + 0.5) return; lab.push('<text x="' + r1(px) + '" y="' + r1(A.B + 15) + '" text-anchor="middle">' + (A.log ? fmtBig(v) : tickLabel(v)) + '</text>'); });
      yt.forEach(function(v){ var py = A.sy(v); if(py < A.T + 6 || py > A.B + 0.5) return; lab.push('<text x="' + r1(A.L - 5) + '" y="' + r1(py + 4) + '" text-anchor="end">' + tickLabel(v) + '</text>'); });
      o.push('<g class="le2-ticks">' + lab.join('') + '</g>');
      return o.join('');
    }
    function clipDef(cid, F){ return '<clipPath id="' + cid + '"><rect x="' + F.L + '" y="' + F.T + '" width="' + r1(F.W) + '" height="' + r1(F.H) + '"/></clipPath>'; }
    function railOf(map, b, lo, hi, n){
      var d = [];
      for(var i = 0; i <= n; i++){ var x = lo + (hi - lo) * i / n; d.push(r1(map.sx(x)) + ' ' + r1(map.sy(b(x)))); }
      return '<path class="le2-rail" d="M' + d.join('L') + '"/>';
    }
    function drawStatic(){
      var A = G.A, o = [], e = curE(), rw = G.rw;
      defs.innerHTML = clipDef(id + '-cA', A) +
        '<linearGradient id="' + id + '-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="le2s-sky0"/><stop offset="1" class="le2s-sky1"/></linearGradient>' +
        '<clipPath id="' + id + '-cL"><circle cx="0" cy="0" r="1"/></clipPath>';
      o.push('<rect class="le2-sky" x="' + A.L + '" y="' + A.T + '" width="' + r1(A.W) + '" height="' + r1(A.H) + '" fill="url(#' + id + '-sky)"/>');
      o.push(gridOf(A));
      o.push('<g clip-path="url(#' + id + '-cA)">');
      if(S.tab === 'point'){
        var Xa = r1(A.sx(e.a));
        o.push('<line class="' + (e.vasym != null ? 'le2-vasym' : 'le2-aline') + '" x1="' + Xa + '" y1="' + A.T + '" x2="' + Xa + '" y2="' + A.B + '"/>');
        if(e.bounds) e.bounds.forEach(function(b){ o.push(railOf(A, b, A.x[0], A.x[1], 2)); });
      } else o.push('<line class="le2-hasym" x1="' + A.L + '" y1="' + r1(A.sy(e.hasym)) + '" x2="' + A.R + '" y2="' + r1(A.sy(e.hasym)) + '"/>');
      if(dense()){
        o.push(bandZig(A, G.kx, A.x[0], A.x[1]));
        o.push(roadOf(denseRuns(A, A.x[0], A.x[1], G.kx), Math.round(rw * 0.7)));
      } else {
        var runs = roadRuns(A), ax = A.y[0] < 0 && A.y[1] > 0 ? A.sy(0) : null;
        runs.forEach(function(r){ o.push('<path class="le2-hill h1" d="' + bandOf(r, rw * 0.4, rw * 0.4 + 9, ax) + '"/><path class="le2-hill h2" d="' + bandOf(r, rw * 0.4 + 9, rw * 0.4 + 19, ax) + '"/><path class="le2-hill h3" d="' + bandOf(r, rw * 0.4 + 19, rw * 0.4 + 30, ax) + '"/>'); });
        o.push(roadOf(runs, rw));
      }
      if(S.tab === 'point' && e.kind === 'jump'){
        o.push(ptOf(A.sx(e.a), A.sy(e.left), true) + ptOf(A.sx(e.a), A.sy(e.f(e.a)), false));
      }
      o.push('</g>');
      o.push('<rect class="le2-frame" x="' + A.L + '" y="' + A.T + '" width="' + r1(A.W) + '" height="' + r1(A.H) + '"/>');
      gS.innerHTML = o.join('');
    }
    /* A point of the graph on the road: open (left out) or closed (the value there). */
    function ptOf(X, Y, open, r){ return '<circle class="le2-pt' + (open ? ' is-open' : '') + '" cx="' + r1(X) + '" cy="' + r1(Y) + '" r="' + (r || (G.rw * 0.5 + 1.5)).toFixed(1) + '"/>'; }

    /* ---------------------------------------------------- labels that never overlap */
    var boxes = [], labBoxes = [];
    function hitB(b, q){ return !(b[2] < q[0] || b[0] > q[2] || b[3] < q[1] || b[1] > q[3]); }
    function free(b){ return boxes.every(function(q){ return !hitB(b, q); }); }
    function inside(b, F){ return b[0] >= F.L + 2 && b[2] <= F.R - 2 && b[1] >= F.T + 2 && b[3] <= F.B - 2; }
    function tw(t, size){ return t.length * size * 0.56 + 6; }
    function label(o, t, cls, cands, F, size){
      size = size || 13;
      for(var i = 0; i < cands.length; i++){
        var c = cands[i], w = tw(t, size), x0 = c[2] === 'end' ? c[0] - w : c[2] === 'middle' ? c[0] - w / 2 : c[0], b = [x0 - 2, c[1] - size, x0 + w + 2, c[1] + 4];
        if(inside(b, F) && free(b) && !(F === G.A && roadHit(b, G.rw / 2 + 2))){ boxes.push(b); labBoxes.push(b); o.push('<text class="le2-lab ' + cls + '" x="' + r1(c[0]) + '" y="' + r1(c[1]) + '" text-anchor="' + (c[2] || 'start') + '">' + esc(t) + '</text>'); return true; }
      }
      return false;
    }
    function block(x, y, r){ boxes.push([x - r, y - r, x + r, y + r]); }

    /* ---------------------------------------------------- the cars */
    /* A car, nose along +x, wheels on the road; origin at the middle of the car on the road's center line. */
    function car(L, rw, cls){
      var wr = L * 0.13, cy = -rw / 2 - wr + 2.5, bb = cy + wr * 0.15, bt = bb - L * 0.24, ct = bt - L * 0.2;
      return '<g class="le2-car ' + cls + '">' +
        '<path class="le2-car-b" d="M' + r1(-L / 2) + ' ' + r1(bb) + 'L' + r1(L / 2) + ' ' + r1(bb) + 'Q' + r1(L / 2 + 2) + ' ' + r1(bt) + ' ' + r1(L * 0.36) + ' ' + r1(bt) + 'L' + r1(L * 0.2) + ' ' + r1(bt) +
          'L' + r1(L * 0.08) + ' ' + r1(ct) + 'L' + r1(-L * 0.26) + ' ' + r1(ct) + 'L' + r1(-L * 0.38) + ' ' + r1(bt) + 'L' + r1(-L / 2 + 2) + ' ' + r1(bt) + 'Q' + r1(-L / 2) + ' ' + r1(bt) + ' ' + r1(-L / 2) + ' ' + r1(bb + (bt - bb) * 0.4) + 'Z"/>' +
        '<path class="le2-car-w" d="M' + r1(L * 0.03) + ' ' + r1(bt - 1.5) + 'L' + r1(L * 0.13) + ' ' + r1(bt - 1.5) + 'L' + r1(L * 0.05) + ' ' + r1(ct + 2.5) + 'L' + r1(-L * 0.08) + ' ' + r1(ct + 2.5) + 'Z' +
          'M' + r1(-L * 0.12) + ' ' + r1(bt - 1.5) + 'L' + r1(-L * 0.12) + ' ' + r1(ct + 2.5) + 'L' + r1(-L * 0.24) + ' ' + r1(ct + 2.5) + 'L' + r1(-L * 0.32) + ' ' + r1(bt - 1.5) + 'Z"/>' +
        '<rect class="le2-car-l" x="' + r1(L / 2 - 4) + '" y="' + r1(bt + 3) + '" width="4" height="' + r1(L * 0.07) + '" rx="1.5"/>' +
        [-0.3, 0.3].map(function(k){ return '<circle class="le2-car-t" cx="' + r1(L * k) + '" cy="' + r1(cy) + '" r="' + r1(wr) + '"/><circle class="le2-car-h" cx="' + r1(L * k) + '" cy="' + r1(cy) + '" r="' + r1(wr * 0.42) + '"/>'; }).join('') +
        '</g>';
    }
    /* Where a car is drawn. Its NOSE is the point (x, f(x)); its body trails behind, on its own side of a (or toward
       0 in tab 2). Off the picture (an asymptote) the car stays at the edge, level, with an arrow out. */
    function carGeo(side){
      var A = G.A, L = G.car, x = xOf(side), y = f(x), dir = S.tab === 'point' ? -side : side;
      var Px = A.sx(x), Py = A.sy(y), lo = A.T + L * 0.87 + 34, hi = A.B - L * 0.3 - 34, out = 0;
      if(!isFinite(Py)) Py = (lo + hi) / 2;
      if(Py < lo){ out = -1; Py = lo; } else if(Py > hi){ out = 1; Py = hi; }
      var ang = 0;
      if(!out && !(dense() && Math.abs(x - S.P.a) < bandHalf(G.kx) + L * 1.2 / G.kx)){
        var Xb = Px - dir * L * 0.9, yb = f(A.ix(Xb));
        if(isFinite(yb)){ var Yb = A.sy(yb); ang = dir > 0 ? Math.atan2(Py - Yb, Px - Xb) : Math.atan2(Yb - Py, Xb - Px); }
        ang = clamp(ang, -0.95, 0.95);
      }
      var ux = Math.cos(ang), uy = Math.sin(ang), Cx = Px - dir * ux * L / 2, Cy = Py - dir * uy * L / 2;
      var lift = G.rw / 2 - 2.5 + L * 0.275;
      return { side: side, x: x, y: y, dir: dir, Px: Px, Py: Py, ang: ang, Cx: Cx, Cy: Cy, Rx: Cx + Math.sin(ang) * lift, Ry: Cy - Math.cos(ang) * lift, r: G.ringR, out: out };
    }
    function carSvg(c){
      return '<g transform="translate(' + r1(c.Px) + ' ' + r1(c.Py) + ') rotate(' + (c.ang * 180 / Math.PI).toFixed(2) + ')' + (c.dir < 0 ? ' scale(-1 1)' : '') + ' translate(' + r1(-G.car / 2) + ' 0)">' + car(G.car, G.rw, c.side < 0 ? 'l' : 'r') + '</g>';
    }
    function blockCar(c){ var L = G.car, nx = Math.sin(c.ang), ny = -Math.cos(c.ang), ux = Math.cos(c.ang), uy = Math.sin(c.ang); [-0.32, 0, 0.32].forEach(function(t){ block(c.Cx + nx * L * 0.3 + ux * L * t, c.Cy + ny * L * 0.3 + uy * L * t, L * 0.3); }); }
    function arrowHead(x, y, ang, s){
      var a1 = ang + Math.PI * 0.83, a2 = ang - Math.PI * 0.83;
      return 'M' + r1(x) + ' ' + r1(y) + 'L' + r1(x + Math.cos(a1) * s) + ' ' + r1(y + Math.sin(a1) * s) + 'L' + r1(x + Math.cos(a2) * s) + ' ' + r1(y + Math.sin(a2) * s) + 'Z';
    }

    /* ---------------------------------------------------- the magnifier (tab 1) */
    function lensWanted(){
      if(S.tab !== 'point' || !G || !LENSABLE[S.P.id]) return false;
      return Math.max(S.dl, S.dr) * G.kx <= 0.33 * lensGeo().R;
    }
    function knobsInLens(){ return S.tab === 'point' && LENS.show > 0.5 && (S.lensDrag || lensWanted()); }
    function lensTarget(){ return Math.max(S.dl, S.dr) / 0.7; }
    function lensGeo(){
      var A = G.A, R = clamp(Math.min(A.W, A.H) * 0.25, 70, 132), Px = A.sx(S.P.a), Py = A.sy(lensYc());
      var cands = [[A.R - R - 16, A.T + R + 16], [A.L + R + 16, A.T + R + 16], [A.R - R - 16, A.B - R - 16], [A.L + R + 16, A.B - R - 16]];
      // the corner farthest from a whose glass the road does not cross (else the farthest)
      function crosses(c){ for(var i = 0; i <= 16; i++){ var X = c[0] - R + 2 * R * i / 16, y = S.P.f(A.ix(X)); if(isFinite(y) && Math.abs(A.sy(y) - c[1]) < R + G.rw + 4) return true; } return false; }
      // and never over a car (where it is drawn in the main picture)
      function covers(c){ return mainMarks().some(function(q){ return Math.hypot((q[0] + q[2]) / 2 - c[0], (q[1] + q[3]) / 2 - c[1]) < R + 16; }) || [-1, 1].some(function(sd){ var x = xOf(sd), y = clamp(A.sy(S.P.f(x)), A.T, A.B); return Math.hypot(A.sx(x) - c[0], y - c[1]) < R + G.ringR + G.car * 0.6; }); }
      function bad(c){ return covers(c) * 2 + crosses(c); }
      cands.sort(function(p, q){ return (bad(p) - bad(q)) || (Math.hypot(q[0] - Px, q[1] - Py) - Math.hypot(p[0] - Px, p[1] - Py)); });
      return { cx: cands[0][0], cy: cands[0][1], R: R };
    }
    function lensYc(){ if(S.P.id === 'osc') return 0; var a = S.P.a, yl = S.P.f(a - S.dl), yr = S.P.f(a + S.dr); return isFinite(yl + yr) ? (yl + yr) / 2 : 0; }
    function lensMap(Lg, w){
      var a = S.P.a, px = Lg.R / w, yc = lensYc(), py;
      if(S.P.id === 'osc') py = Lg.R * 0.7;
      else { var sp = Math.max(Math.abs(S.P.f(a - S.dl) - yc), Math.abs(S.P.f(a + S.dr) - yc), 1e-12); py = Math.min(px * G.ky / G.kx, Lg.R * 0.6 / sp); }
      return { sx: function(x){ return Lg.cx + (x - a) * px; }, sy: function(y){ return Lg.cy - (y - yc) * py; }, px: px, py: py, yc: yc };
    }
    /* the marks in the glass a tag must never cover: the hole, the ends of a jump, the other car's nose */
    function lensKeys(){
      var e = S.P, Lm = LENS.map, out = [], a = e.a; if(!Lm) return out;
      function at(y){ var X = Lm.sx(a), Y = Lm.sy(y); out.push([X - 12, Y - 12, X + 12, Y + 12]); }
      if(e.kind === 'removable') at(e.left);
      if(e.kind === 'jump'){ at(e.left); at(e.f(a)); }
      [-1, 1].forEach(function(sd){ var x = xOf(sd), X = Lm.sx(x), Y = clamp(Lm.sy(f(x)), LENS.cy - LENS.R - 8, LENS.cy + LENS.R + 8); out.push([X - 14, Y - 14, X + 14, Y + 14]); });
      return out;
    }
    function lensW(){ return LENS.frozen != null ? LENS.frozen : LENS.w; }
    function drawLens(o, cl, cr){
      var A = G.A, e = S.P, a = e.a, Lg = lensGeo(), R = Lg.R, Lm = lensMap(Lg, lensW()), k = 0.6 + 0.4 * LENS.show;
      LENS.cx = Lg.cx; LENS.cy = Lg.cy; LENS.R = R; LENS.px = Lm.px;
      var g = ['<g class="le2-lens" style="opacity:' + LENS.show.toFixed(3) + '" transform="translate(' + r1(Lg.cx) + ' ' + r1(Lg.cy) + ') scale(' + k.toFixed(3) + ') translate(' + r1(-Lg.cx) + ' ' + r1(-Lg.cy) + ')">'];
      // two lines from the spot on the road the glass looks at, to the glass
      var sx0 = A.sx(a), sy0 = A.sy(Lm.yc), d = Math.hypot(Lg.cx - sx0, Lg.cy - sy0) || 1, ux = (Lg.cx - sx0) / d, uy = (Lg.cy - sy0) / d;
      g.push('<path class="le2-beam" d="M' + r1(sx0) + ' ' + r1(sy0) + 'L' + r1(Lg.cx - uy * R) + ' ' + r1(Lg.cy + ux * R) + 'M' + r1(sx0) + ' ' + r1(sy0) + 'L' + r1(Lg.cx + uy * R) + ' ' + r1(Lg.cy - ux * R) + '"/>');
      var hx = Lg.cx + R * 0.72 * (Lg.cx < A.L + A.W / 2 ? -1 : 1), hy = Lg.cy + R * 0.72 * (Lg.cy < A.T + A.H / 2 ? 1 : -1);
      g.push('<line class="le2-lens-h" x1="' + r1(hx) + '" y1="' + r1(hy) + '" x2="' + r1(Lg.cx + (hx - Lg.cx) * 1.5) + '" y2="' + r1(Lg.cy + (hy - Lg.cy) * 1.5) + '"/>');
      g.push('<circle class="le2-lens-bg" cx="' + r1(Lg.cx) + '" cy="' + r1(Lg.cy) + '" r="' + r1(R) + '"/>');
      g.push('<g clip-path="url(#' + id + '-cL)">');
      var w = lensW(), lo = a - w * 1.6, hi = a + w * 1.6;
      var LF = { x: [lo, hi], L: Lg.cx - R * 1.6, R: Lg.cx + R * 1.6, T: Lg.cy - R * 3, B: Lg.cy + R * 3, sx: Lm.sx, sy: Lm.sy, ix: function(px){ return a + (px - Lg.cx) / Lm.px; } };
      if(e.bounds) e.bounds.forEach(function(b){ g.push(railOf(Lm, b, lo, hi, 2)); });
      if(e.dense){
        g.push(bandZig(Lm, Lm.px, lo, hi));
        g.push(roadOf(denseRuns(Lm, lo, hi, Lm.px), Math.round(G.rw * 0.7)));
      } else {
        var gp = e.kind === 'removable' ? G.rw * 0.95 / Lm.px : 1e-12, runs = [];
        [[lo, a - gp], [a + gp, hi]].forEach(function(iv){
          var n = 80, run = [];
          for(var i = 0; i <= n; i++){ var x = iv[0] + (iv[1] - iv[0]) * i / n, y = e.f(x); if(isFinite(y)) run.push({ X: Lm.sx(x), Y: clamp(Lm.sy(y), Lg.cy - R * 3, Lg.cy + R * 3) }); }
          if(run.length > 1) runs.push(run);
        });
        g.push(roadOf(runs, G.rw));
        if(e.kind === 'jump') g.push(ptOf(Lm.sx(a), Lm.sy(e.left), true) + ptOf(Lm.sx(a), Lm.sy(e.f(a)), false));
      }
      if(e.kind === 'removable') g.push(holeSvg(Lm.sx(a), Lm.sy(e.left), Lm.px, Lm.sy));
      [cl, cr].forEach(function(c){ var X = Lm.sx(c.x), Y = Lm.sy(c.y); g.push('<circle class="le2-ndot ' + (c.side < 0 ? 'l' : 'r') + '" cx="' + r1(X) + '" cy="' + r1(clamp(Y, Lg.cy - R - 8, Lg.cy + R + 8)) + '" r="5.5"/>'); });
      g.push('</g>');
      g.push('<circle class="le2-lens-rim" cx="' + r1(Lg.cx) + '" cy="' + r1(Lg.cy) + '" r="' + r1(R) + '"/>');
      LENS.map = Lm;
      if(knobsInLens()) [-1, 1].forEach(function(sd){ var p = knobAt(sd), t = tagSideOf(sd); if(!p) return; block(p[0], p[1], 14); var b = tagBoxAt(sd, t, p[0], p[1], 26); boxes.push(grow(t === 'up' || t === 'down' ? slideIn(b) : b, 5)); });
      var mag = Lm.px / G.kx, mt = mag >= 100 ? commas(+mag.toPrecision(2)) : String(Math.max(2, Math.round(mag)));
      var zl = [];
      label(zl, 'zoom ×' + mt, 'le2-zoom', [[Lg.cx, Lg.cy + R + 19, 'middle'], [Lg.cx, Lg.cy - R - 9, 'middle'], [Lg.cx + R * 0.75, Lg.cy + R + 6, 'start'], [Lg.cx - R * 0.75, Lg.cy + R + 6, 'end']], A, 12.5);
      g.push(zl.join(''));
      g.push('</g>');
      o.push(g.join(''));
      var cc = defs.querySelector('#' + id + '-cL circle'); if(cc){ cc.setAttribute('cx', r1(Lg.cx)); cc.setAttribute('cy', r1(Lg.cy)); cc.setAttribute('r', r1(R)); }
      boxes.push([Lg.cx - R - 8, Lg.cy - R - 8, Lg.cx + R + 8, Lg.cy + R + 8]);
      LENS.map = Lm;
    }
    /* The hole at (a, L): a gap in the road with an open circle; "Fill the hole" lays a slab in and closes it. */
    function holeSvg(X, Y, kxp, sy){
      var e = S.P, k = S.fillK, rr = G.rw * 0.5 + 1.5, o = '';
      if(k > 0){
        var gp = G.rw * 1.05 * k, a = e.a, x0 = a - gp / kxp, x1 = a + gp / kxp, d = 'M' + r1(X - gp) + ' ' + r1(sy(e.left + (x0 - a) * slopeAt())) + 'L' + r1(X + gp) + ' ' + r1(sy(e.left + (x1 - a) * slopeAt()));
        o += '<g style="opacity:' + Math.min(1, k * 2).toFixed(2) + '"><path class="le2-shoulder" style="stroke-width:' + (G.rw + 6) + 'px" d="' + d + '"/><path class="le2-road" style="stroke-width:' + G.rw + 'px" d="' + d + '"/></g>';
      }
      if(e.id === 'move') return o + (k >= 1 ? ptOf(X, Y, false, rr) : ptOf(X, Y, true, rr));
      return o + ptOf(X, Y, k < 1, rr);
    }
    /* the slope of the road at a (for the slab), from the curve on each side */
    function slopeAt(){ var e = S.P, h = 1e-4; return e.dense ? 0 : (e.f(e.a + h) - e.f(e.a - h)) / (2 * h); }

    /* ---------------------------------------------------- the moving picture */
    function draw(){
      if(!G || !S.ready) return;
      boxes = []; labBoxes = [];
      var A = G.A, o = [], cl = carGeo(-1), cr = carGeo(1), inL = knobsInLens(), e = curE();
      S.drawn = { cl: cl, cr: cr };
      blockCar(cl); blockCar(cr);
      if(!inL){ block(cl.Rx, cl.Ry, cl.r + 2); block(cr.Rx, cr.Ry, cr.r + 2); boxes.push(grow(tagBox(cl), 5)); boxes.push(grow(tagBox(cr), 5)); }
      if(cue.active()) cue.place();
      blockCue();
      o.push('<g clip-path="url(#' + id + '-cA)">');
      if(S.tab === 'point'){
        var Xa = A.sx(e.a);
        // a lamp post at x = a holds f(a) away from the road (a point out of place); filling lifts it into the hole
        if(e.id === 'move'){
          var yL = e.at + (e.fill - e.at) * S.fillK, base = A.sy(Math.max(A.y[0], 0)), top = A.sy(yL), pk = 1 - S.fillK;
          if(pk > 0.01) o.push('<g style="opacity:' + pk.toFixed(2) + '"><line class="le2-post" x1="' + r1(Xa) + '" y1="' + r1(base) + '" x2="' + r1(Xa) + '" y2="' + r1(top + 6) + '"/><rect class="le2-post-b" x="' + r1(Xa - 7) + '" y="' + r1(base - 4) + '" width="14" height="5" rx="2"/><circle class="le2-glow" cx="' + r1(Xa) + '" cy="' + r1(top) + '" r="' + (G.rw * 0.5 + 8).toFixed(1) + '"/></g>');
          if(S.fillK < 1) o.push(ptOf(Xa, top, false));
          block(Xa, top, 14); if(pk > 0.01) boxes.push([Xa - 6, top, Xa + 6, base]);
        }
        if(e.kind === 'removable'){
          var Ya = A.sy(e.left);
          o.push(holeSvg(Xa, Ya, G.kx, A.sy));
          block(Xa, Ya, 12);
          // a cone beside the gap (the road crew's warning); it goes once the hole is filled
          if(e.id === 'hole' && S.fillK < 1){ var cx = Xa + G.rw * 0.5 + 11, cy = Ya + G.rw * 0.5 + 16; o.push('<g class="le2-cone" style="opacity:' + (1 - S.fillK).toFixed(2) + '"><path d="M' + r1(cx - 7) + ' ' + r1(cy) + 'L' + r1(cx) + ' ' + r1(cy - 15) + 'L' + r1(cx + 7) + ' ' + r1(cy) + 'Z"/><path class="le2-cone-s" d="M' + r1(cx - 3.6) + ' ' + r1(cy - 7.5) + 'L' + r1(cx + 3.6) + ' ' + r1(cy - 7.5) + '"/></g>'); block(cx, cy - 7, 10); }
        }
        // each nose's height, carried to the y axis: the two heights close in on the limit there
        [cl, cr].forEach(function(c){
          if(c.out) return;
          o.push('<line class="le2-hline ' + (c.side < 0 ? 'l' : 'r') + '" x1="' + r1(A.L) + '" y1="' + r1(c.Py) + '" x2="' + r1(c.Px) + '" y2="' + r1(c.Py) + '"/>' +
            '<path class="le2-hmark ' + (c.side < 0 ? 'l' : 'r') + '" d="' + arrowHead(A.L + (c.side < 0 ? 9 : 17), c.Py, Math.PI, 8) + '"/>');
        });
      }
      o.push('</g>');
      [cl, cr].forEach(function(c){
        o.push(carSvg(c));
        o.push('<circle class="le2-nose ' + (c.side < 0 ? 'l' : 'r') + '" cx="' + r1(c.Px) + '" cy="' + r1(c.Py) + '" r="3.2"/>');
        if(c.out){ var up = c.out < 0, ay = up ? c.Ry - c.r - 4 : c.Ry + c.r + 4; o.push('<path class="le2-outar ' + (c.side < 0 ? 'l' : 'r') + '" d="M' + r1(c.Px) + ' ' + r1(ay) + 'L' + r1(c.Px) + ' ' + r1(ay + (up ? -10 : 10)) + '"/><path class="le2-outtip ' + (c.side < 0 ? 'l' : 'r') + '" d="' + arrowHead(c.Px, ay + (up ? -18 : 18), up ? -Math.PI / 2 : Math.PI / 2, 9) + '"/>'); block(c.Px, ay + (up ? -10 : 10), 12); }
      });
      if(S.tab === 'point' && (LENS.show > 0.01)) drawLens(o, cl, cr);
      if(S.tab === 'point') placeFill(); else fillB.hidden = true;
      labels(o, cl, cr);
      gD.innerHTML = o.join('');
      S.labBoxes = labBoxes;
      svg.setAttribute('aria-label', picText());
      [hl, hr].forEach(function(h, i){
        var c = i ? cr : cl;
        h.el.classList.toggle('is-ring', !inL);
        h.el.style.setProperty('--le-ring', (2 * c.r * (layer.scale() || 1)).toFixed(1) + 'px');
        h.place();
      });
      if(cue.active()) cue.place();
      words();
    }
    /* Words on the picture (after the shapes, placed clear of them and of each other). */
    function labels(o, cl, cr){
      var A = G.A, e = curE(), sm = 12.5;
      if(S.tab === 'point'){
        var Xa = A.sx(e.a);
        if(e.kind === 'removable' && !e.dense && (S.fillK === 0 || S.fillK === 1)){
          var Ya = A.sy(e.left), t = S.fillK === 1 ? 'f(' + e.a + ') = ' + limWord(e.fill) : 'hole';
          label(o, t, 'le2-cink', [[Xa + 14, Ya - 14, 'start'], [Xa - 14, Ya - 14, 'end'], [Xa + 16, Ya + 24, 'start'], [Xa - 16, Ya + 26, 'end'], [Xa, Ya - 22, 'middle'], [Xa, Ya + 34, 'middle']], A, sm);
        }
        if(e.id === 'move' && S.fillK === 0){ var Yl = A.sy(e.at); label(o, 'f(' + e.a + ') = ' + limWord(e.at), 'le2-cink', [[Xa + 20, Yl + 5, 'start'], [Xa - 20, Yl + 5, 'end'], [Xa + 18, Yl - 14, 'start'], [Xa - 18, Yl - 14, 'end'], [Xa + 18, Yl + 26, 'start']], A, sm); }
        if(e.kind === 'jump'){ var Yj = A.sy((e.left + e.right) / 2); label(o, 'jump', 'le2-cbad', [[Xa + 12, Yj + 4, 'start'], [Xa - 12, Yj + 4, 'end'], [Xa + 12, A.sy(e.right) - 16, 'start']], A, sm); }
        if(e.vasym != null) label(o, 'asymptote', 'le2-cbad', [[Xa - 8, A.sy(3), 'end'], [Xa + 8, A.sy(-3), 'start'], [Xa - 8, A.sy(1.5), 'end'], [Xa + 8, A.sy(-1.5), 'start'], [Xa + 8, A.T + 18, 'start'], [Xa - 8, A.B - 30, 'end']], A, sm);
        else label(o, 'x = ' + e.a, 'le2-cink', [[Xa + 6, A.B - 8, 'start'], [Xa - 6, A.B - 8, 'end'], [Xa + 6, A.T + 18, 'start'], [Xa - 6, A.T + 18, 'end']], A, sm);
        if(e.dense){
          var xc = bandHalf(G.kx), b = boundsOf(), yb = A.sy(b[1](e.a + xc)), yb2 = A.sy(b[0](e.a + xc));
          label(o, G.narrow ? 'too many swings' : 'too many swings to draw', 'le2-cink', [[Xa, yb - 10, 'middle'], [Xa, yb2 + 22, 'middle'], [Xa, A.T + 18, 'middle'], [Xa, A.B - 30, 'middle']], A, sm);
        }
        if(e.bounds){
          [[1, 'y = |x|', -10], [0, 'y = −|x|', 22]].forEach(function(q){
            var cs = [];
            [0.9, 0.1, 0.8, 0.2, 0.7, 0.3].forEach(function(t){ var x = A.x[0] + (A.x[1] - A.x[0]) * t, Y = A.sy(e.bounds[q[0]](x)); cs.push([A.sx(x), Y + q[2], 'middle'], [A.sx(x), Y - q[2] + (q[2] < 0 ? 12 : -12), 'middle']); });
            label(o, q[1], 'le2-crail', cs, A, sm);
          });
        }
      } else {
        var Yh = A.sy(e.hasym);
        label(o, 'y = ' + e.hasym, 'le2-clim', [[A.sx(-3), Yh - 8, 'middle'], [A.sx(-3), Yh + 18, 'middle'], [A.sx(-6), Yh - 8, 'middle'], [A.sx(-1.5), Yh - 8, 'middle'], [A.L + 10, Yh - 18, 'start'], [A.R - 10, Yh + 26, 'end']], A, sm);
        label(o, G.narrow ? 'x: steps ×10' : 'x: each grid step ×10', 'le2-cink', [[A.R - 8, A.B - 8, 'end'], [A.L + 8, A.B - 8, 'start'], [A.R - 8, A.T + 18, 'end']], A, sm);
      }
      roadLabel(o);
    }
    function roadLabel(o){
      var A = G.A, c = [], F = curE().f;
      [0.12, 0.88, 0.3, 0.7, 0.2, 0.8].forEach(function(t){
        var X = A.L + A.W * t, x = A.ix(X), y = F(x); if(!isFinite(y)) return; var Y = A.sy(y); if(Y < A.T + 20 || Y > A.B - 20) return;
        if(dense() && Math.abs(x - S.P.a) < 0.45) return;
        c.push([X, Y - 16, 'middle'], [X, Y + 28, 'middle']);
      });
      label(o, 'y = f(x)', 'le2-croad', c, A, 13);
    }

    /* ---------------------------------------------------- the knobs: one per car (K.handle) */
    function knobAt(side){
      if(!G || !S.ready) return null;
      var c = S.drawn ? (side < 0 ? S.drawn.cl : S.drawn.cr) : carGeo(side);
      if(knobsInLens() && LENS.map){ var Lg = { cx: LENS.cx, cy: LENS.cy, R: LENS.R }, Y = LENS.map.sy(c.y); return [LENS.map.sx(c.x), clamp(Y, Lg.cy - Lg.R - 8, Lg.cy + Lg.R + 8)]; }
      return [c.Rx, c.Ry];
    }
    function tagSize(side){ var h = side < 0 ? hl : hr, t = h && h.el.querySelector('.tk2-tag'), k = layer.scale() || 1; return [t && t.offsetWidth ? t.offsetWidth / k : 120, t && t.offsetHeight ? t.offsetHeight / k : 24]; }
    function tagBoxAt(side, sd, x, y, off){
      var s = tagSize(side), w = s[0], h = s[1];
      return sd === 'up' ? [x - w / 2, y - off - h, x + w / 2, y - off] : sd === 'down' ? [x - w / 2, y + off, x + w / 2, y + off + h] : sd === 'right' ? [x + off, y - h / 2, x + off + w, y + h / 2] : [x - off - w, y - h / 2, x - off, y + h / 2];
    }
    function slideIn(b){ var A = G.A, dx = b[0] < A.L + 2 ? A.L + 2 - b[0] : b[2] > A.R - 2 ? A.R - 2 - b[2] : 0; return [b[0] + dx, b[1], b[2] + dx, b[3]]; }
    function tagSideOf(side){
      if(!G) return 'up';
      var A = G.A, p = knobAt(side); if(!p) return 'up';
      if(knobsInLens()){
        var ql = knobAt(-1), qr = knobAt(1), lowL = ql && qr && ql[1] > qr[1] + 2, keep = lensKeys().concat(carBoxes(), mainMarks());
        var order = side < 0 ? (lowL ? ['down', 'left', 'up', 'right'] : ['up', 'left', 'down', 'right']) : (lowL ? ['up', 'right', 'down', 'left'] : ['down', 'right', 'up', 'left']);
        var other = side < 0 ? null : (function(){ var q = knobAt(-1), sd = tagSideOf(-1), b0 = q ? tagBoxAt(-1, sd, q[0], q[1], 26) : null; return b0 ? grow(sd === 'up' || sd === 'down' ? slideIn(b0) : b0, 5) : null; })();
        for(var i = 0; i < order.length; i++){ var b = tagBoxAt(side, order[i], p[0], p[1], 26); if(order[i] === 'up' || order[i] === 'down') b = slideIn(b); if(inside(b, A) && !keep.some(function(q){ return hitB(b, q); }) && !(other && hitB(b, other))) return order[i]; }
        var hard = lensKeys().concat(carBoxes());
        for(var j = 0; j < order.length; j++){ var b2 = tagBoxAt(side, order[j], p[0], p[1], 26); if(order[j] === 'up' || order[j] === 'down') b2 = slideIn(b2); if(inside(b2, A) && !(other && hitB(b2, other)) && !hard.some(function(q){ return hitB(b2, q); })) return order[j]; }
        for(var m = 0; m < order.length; m++){ var b3 = tagBoxAt(side, order[m], p[0], p[1], 26); if(order[m] === 'up' || order[m] === 'down') b3 = slideIn(b3); if(inside(b3, A) && !(other && hitB(b3, other))) return order[m]; }
        return order[0];
      }
      if(!S.drawn) return side < 0 ? 'up' : 'down';
      var c = side < 0 ? S.drawn.cl : S.drawn.cr, first = side < 0 ? (S.tab === 'point' ? 'up' : 'down') : (S.tab === 'point' ? 'down' : 'up'), second = first === 'up' ? 'down' : 'up';
      var b1 = slideIn(tagBoxAt(side, first, c.Rx, c.Ry, c.r + 6));
      var avoid = mainMarks().concat(carBoxes());
      if(side > 0){ var ob = S.drawn.cl, ot = tagSideOf(-1); avoid.push(grow(slideIn(tagBoxAt(-1, ot, ob.Rx, ob.Ry, ob.r + 6)), 5)); }
      function okB(b, sd){ return b[1] >= A.T + 2 && b[3] <= A.B - 2 && !(c.out && sd === (c.out < 0 ? 'up' : 'down')) && !avoid.some(function(q){ return hitB(b, q); }); }
      if(okB(b1, first)) return first;
      var b2 = slideIn(tagBoxAt(side, second, c.Rx, c.Ry, c.r + 6));
      if(okB(b2, second)) return second;
      var tagOnly = side > 0 ? avoid[avoid.length - 1] : null, inV = function(b){ return b[1] >= A.T + 2 && b[3] <= A.B - 2; };
      if(tagOnly && hitB(b1, tagOnly) && inV(b2) && !hitB(b2, tagOnly)) return second;
      return inV(b1) ? first : second;
    }
    /* the first-time chip goes where it covers no tag, label or mark */
    function chipSideOf(side){
      var p = knobAt(side); if(!p || !G) return 'down';
      var t = tagSideOf(side), opp = { up: 'down', down: 'up', left: 'right', right: 'left' }, order = [opp[t], 'down', 'up', 'right', 'left'], k = layer.scale() || 1;
      var ch = (side < 0 ? hl : hr).el.querySelector('.tk2-chip'), w = ch && ch.offsetWidth ? ch.offsetWidth / k : 70, h = ch && ch.offsetHeight ? ch.offsetHeight / k : 26;
      var off = knobsInLens() ? 30 : (S.drawn ? (side < 0 ? S.drawn.cl : S.drawn.cr).r + 4 : 30), own = tagBoxAt(side, t, p[0], p[1], knobsInLens() ? 26 : off + 2);
      for(var i = 0; i < order.length; i++){
        var sd = order[i]; if(sd === t) continue;
        var b = sd === 'up' ? [p[0] - w / 2, p[1] - off - h, p[0] + w / 2, p[1] - off] : sd === 'down' ? [p[0] - w / 2, p[1] + off, p[0] + w / 2, p[1] + off + h] : sd === 'right' ? [p[0] + off, p[1] - h / 2, p[0] + off + w, p[1] + h / 2] : [p[0] - off - w, p[1] - h / 2, p[0] - off, p[1] + h / 2];
        if(inside(b, G.A) && !hitB(b, own) && labelsFree(b)) return sd;
      }
      return opp[t];
    }
    function labelsFree(b){ return (S.labBoxes || []).every(function(q){ return !hitB(b, q); }); }
    /* the marks on the road a tag must never cover: the hole, a jump's two ends, the lamp */
    function mainMarks(){
      if(S.tab !== 'point' || !G) return [];
      var e = S.P, A = G.A, X = A.sx(e.a), out = [];
      function at(y){ var Y = A.sy(y); out.push([X - 12, Y - 12, X + 12, Y + 12]); }
      if(e.kind === 'removable') at(e.left);
      if(e.kind === 'jump'){ at(e.left); at(e.f(e.a)); }
      if(e.id === 'move') at(e.at + (e.fill - e.at) * S.fillK);
      return out;
    }
    function grow(b, m){ return [b[0] - m, b[1] - m, b[2] + m, b[3] + m]; }
    /* each car's body, as a box (the ring is round, the car inside it is not) */
    function carBoxes(){
      if(!S.drawn) return [];
      return [S.drawn.cl, S.drawn.cr].map(function(c){ var L = G.car, ex = Math.abs(Math.sin(c.ang)) * L * 0.5; return [c.Cx - L * 0.6, c.Cy - L * 0.7 - G.rw / 2 - ex, c.Cx + L * 0.6, c.Cy + L * 0.2 + ex]; });
    }
    function tagBox(c){ return slideIn(tagBoxAt(c.side, tagSideOf(c.side), c.Rx, c.Ry, c.r + 6)); }
    function tagText(side){
      if(!G || !S.ready) return '';
      var x = xOf(side), y = f(x);
      // a phone shows the height alone (the pill's colour says which car; x is in its screen reader text and "?")
      if(G.narrow) return S.tab === 'point' ? fmtY(y, dOf(side)) : fmtY2(y);
      return S.tab === 'point' ? 'f(' + fmtX(x, dOf(side)) + ') = ' + fmtY(y, dOf(side)) : 'f(' + fmtBig(x) + ') = ' + fmtY2(y);
    }
    function valueText(side){
      var x = xOf(side), y = f(x), who = side < 0 ? 'Purple car, from the left' : 'Orange car, from the right';
      if(S.tab === 'point') return who + ': x = ' + fmtX(x, dOf(side)) + ', f(x) = ' + fmtY(y, dOf(side)) + ', ' + fmtX(dOf(side), dOf(side)) + ' from x = ' + S.P.a;
      return (side < 0 ? 'Purple car, toward minus infinity' : 'Orange car, toward infinity') + ': x = ' + fmtBig(x) + ', f(x) = ' + fmtY2(y);
    }
    function clampD(d){ return clamp(d, DMIN, dmax()); }
    function pickAt(side, x){
      if(!G) return null;
      if(S.tab === 'point'){
        var a = S.P.a, xv = S.lensDrag ? a + (x - LENS.cx) / LENS.pxF : G.A.ix(x), d = side < 0 ? a - xv : xv - a;
        return clampD(sig2(Math.max(d, DMIN)));
      }
      var X = side < 0 ? -G.A.ix(x) : G.A.ix(x);
      return clamp(sig2(Math.max(X, xmin())), xmin(), XMAX);
    }
    function keysAt(side, v, k, big){
      var arrow = /^Arrow/.test(k), plus = k === 'ArrowRight' || k === 'ArrowUp', n = big ? 10 : 1, i;
      if(S.tab === 'point'){
        // the knob's value is the distance d from a; toward a is right for the purple car and left for the orange one
        var d = v, toward = side < 0 ? plus : !plus;
        if(arrow){ for(i = 0; i < n; i++) d = toward ? (d > 0.3 ? d - 0.05 : d / 1.2589) : (d >= 0.25 ? d + 0.05 : d * 1.2589); }
        else if(k === 'PageDown') d = v / 10; else if(k === 'PageUp') d = v * 10;
        else if(k === 'Home') d = side < 0 ? dmax() : DMIN; else if(k === 'End') d = side < 0 ? DMIN : dmax();
        else return null;
        return clampD(sig2(d));
      }
      var X = v, out = side < 0 ? !plus : plus;
      if(arrow){ for(i = 0; i < n; i++) X = out ? X * 1.2589 : X / 1.2589; }
      else if(k === 'PageUp') X = v * 10; else if(k === 'PageDown') X = v / 10;
      else if(k === 'Home') X = side < 0 ? XMAX : xmin(); else if(k === 'End') X = side < 0 ? xmin() : XMAX;
      else return null;
      return clamp(sig2(X), xmin(), XMAX);
    }
    function mkHandle(side){
      var h = K.handle(layer, { key: 'apcalc-limit-explorer-' + (side < 0 ? 'l' : 'r'), value: 1, chip: side < 0, quiet: side > 0, hint: 'Drag',
        label: side < 0 ? 'Purple car, coming from the left' : 'Orange car, coming from the right',
        at: function(){ return knobAt(side); },
        dir: function(){ var c = S.drawn && (side < 0 ? S.drawn.cl : S.drawn.cr); return c ? (c.ang * 180 / Math.PI) : 0; },
        pick: function(x){ return pickAt(side, x); },
        keys: function(v, k, big){ return keysAt(side, v, k, big); },
        valuetext: function(){ return valueText(side); },
        tag: function(){ return tagText(side); },
        tagSide: function(){ return tagSideOf(side); },
        chipSide: function(){ return chipSideOf(side); },
        bounds: function(){ return G ? [G.A.L + 2, G.A.T, G.A.R - 2, G.A.B] : null; },
        onStart: function(){ startDrag(side); },
        onInput: function(v){ setVal(side, v); },
        onEnd: function(){ endDrag(side); } });
      h.el.classList.add(side < 0 ? 'le2-hl' : 'le2-hr');
      return h;
    }
    var hl = mkHandle(-1), hr = mkHandle(1);
    function startDrag(side){
      userActs();
      if(side < 0) hr.el.classList.remove('is-quiet');
      S.lensDrag = knobsInLens();
      if(S.lensDrag){ LENS.frozen = LENS.w; LENS.pxF = LENS.R / LENS.w; }
    }
    function endDrag(){
      var was = S.lensDrag; S.lensDrag = false; LENS.frozen = null;
      if(was || lensWanted()) glide();
      kick(); say(cause.text()); refLater();
    }
    function glide(){ [hl, hr].forEach(function(h){ h.el.classList.add('is-glide'); }); setTimeout(function(){ [hl, hr].forEach(function(h){ h.el.classList.remove('is-glide'); }); }, 340); }
    function setVal(side, v){
      var direct = hl.dragging() || hr.dragging() || K.reduced();
      var cv = S.tab === 'point' ? clampD(v) : clamp(v, xmin(), XMAX);
      if(cv !== v){ v = cv; (side < 0 ? hl : hr).value(v); }
      if(S.tab === 'point'){ if(side < 0){ S.tl = v; if(direct) S.dl = v; } else { S.tr = v; if(direct) S.dr = v; } S.closeV = 0; close.paint(); }
      else { if(side < 0){ S.txl = v; if(direct) S.xl = v; } else { S.txr = v; if(direct) S.xr = v; } S.driveV = 0; drive.paint(); }
      tourDid(side < 0 ? 'drag' : 'right');
      kick(); draw(); refLater();
    }

    /* ---------------------------------------------------- "Fill the hole" (a removable point only) */
    function placeFill(){
      var e = S.P, A = G.A;
      fillB.hidden = e.fill == null;
      if(fillB.hidden) return;
      fillB.textContent = S.filled ? 'Undo' : e.id === 'move' ? 'Move the point' : 'Fill the hole';
      fillB.setAttribute('aria-label', S.filled ? 'Undo: f(' + e.a + ') back to ' + (e.at == null ? 'not defined' : e.at) : e.id === 'move' ? 'Move the point to the limit: f(' + e.a + ') = ' + e.fill : 'Fill the hole: define f(' + e.a + ') = ' + e.fill);
      var k = layer.scale() || 1, w = (fillB.offsetWidth || 110) / k, h = (fillB.offsetHeight || 32) / k, Xa = A.sx(e.a), Ya = A.sy(e.left);
      var cands = e.dense ? [[Xa - w / 2, A.B - h - 30], [Xa + 14, A.B - h - 30], [Xa - w - 14, A.B - h - 30]] : (function(){ var c = []; [40, 70, 110].forEach(function(r){ [[0, 1], [-1, 1], [1, 1], [-1, 0], [1, 0], [0, -1], [-1, -1], [1, -1]].forEach(function(d){ c.push([Xa + d[0] * r - w / 2 + d[0] * w / 2, Ya + d[1] * r - h / 2 + d[1] * h / 2]); }); }); c.push([Xa - w / 2, A.B - h - 30]); return c; })();
      var at = cands[0];
      var found = false, i, b;
      for(i = 0; i < cands.length && !found; i++){ b = [cands[i][0], cands[i][1], cands[i][0] + w, cands[i][1] + h]; if(inside(b, A) && free(b) && !roadHit(b)){ at = cands[i]; found = true; } }
      for(i = 0; i < cands.length && !found; i++){ b = [cands[i][0], cands[i][1], cands[i][0] + w, cands[i][1] + h]; if(inside(b, A) && free(b)){ at = cands[i]; found = true; } }
      at = [clamp(at[0], A.L + 4, A.R - w - 4), clamp(at[1], A.T + 4, A.B - h - 4)];
      boxes.push([at[0] - 2, at[1] - 2, at[0] + w + 2, at[1] + h + 2]);
      fillB.style.left = (at[0] * k).toFixed(1) + 'px'; fillB.style.top = (at[1] * k).toFixed(1) + 'px';
    }
    /* does the road (or the lamp post) pass through box b? */
    function roadHit(b, pad){
      var A = G.A; pad = pad == null ? G.rw + 6 : pad;
      for(var i = 0; i <= 8; i++){ var X = b[0] + (b[2] - b[0]) * i / 8, y = f(A.ix(X)); if(!isFinite(y)) continue; var Y = A.sy(y); if(Y > b[1] - pad && Y < b[3] + pad) return true; }
      return false;
    }
    fillB.addEventListener('click', function(){
      userActs();
      S.filled = !S.filled; S.fillPending = true; S.took = null;
      fillB.setAttribute('aria-pressed', String(S.filled));
      if(K.reduced()) fade();
      kick(); refLater();
    });
    function fillDone(){
      S.fillPending = false;
      var e = S.P;
      S.took = S.filled ? (e.id === 'move' ? 'Now f(2) = 4, the limit, so f is continuous at x = 2.' : 'Now f(' + e.a + ') = ' + limWord(e.fill) + ', the limit, so f is continuous at x = ' + e.a + '.') : null;
      wKey = ''; words(); say(S.took || cause.text()); refLater();
    }

    /* ---------------------------------------------------- the cause line */
    var wKey = '';
    function words(){
      var parts, n = G && G.narrow;
      if(S.tab === 'point'){
        var e = S.P, a = e.a, yl = e.f(a - S.dl), yr = e.f(a + S.dr), near = S.dl <= CLOSE + 1e-12 && S.dr <= CLOSE + 1e-12;
        parts = [{ t: (n ? 'left ' : 'from the left ') + fmtY(yl, S.dl), role: 'l', say: 'from the left f is ' + fmtY(yl, S.dl) },
          { t: (n ? 'right ' : 'from the right ') + fmtY(yr, S.dr), role: 'r', join: '+', say: 'from the right f is ' + fmtY(yr, S.dr) }];
        if(!near) parts.push({ t: 'closer to x = ' + a, role: 'ink', say: 'drive both closer to x equals ' + a });
        else if(e.kind === 'removable') parts.push({ t: n ? 'both → ' + limWord(e.left) : 'both head for ' + limWord(e.left), role: 'lim' }, { t: 'limit ' + limWord(e.left), role: 'lim' });
        else if(e.kind === 'jump') parts.push({ t: 'they disagree', role: 'bad' }, { t: 'no limit', role: 'bad' });
        else if(e.kind === 'infinite') parts.push({ t: n ? 'unbounded' : 'grow without bound', role: 'bad' }, { t: 'no limit', role: 'bad' });
        else parts.push({ t: n ? 'swinging' : 'keep swinging', role: 'bad' }, { t: 'no limit', role: 'bad' });
      } else {
        var fl = INF.f(-S.xl), fr = INF.f(S.xr), far = S.xl >= FAR - 1e-9 && S.xr >= FAR - 1e-9;
        parts = [{ t: 'f(' + fmtBig(-S.xl) + ') = ' + fmtY2(fl), role: 'l' }, { t: 'f(' + fmtBig(S.xr) + ') = ' + fmtY2(fr), role: 'r', join: '+' }];
        parts.push(far ? { t: n ? 'level off at 2' : 'both level off at 2', role: 'lim' } : { t: 'drive farther out', role: 'ink' });
      }
      var key = S.took ? 'T' + S.took : JSON.stringify(parts);
      if(key === wKey) return; wKey = key;
      if(S.took) cause.take(S.took); else cause.set(parts);
    }
    function picText(){
      var e = curE();
      return (S.tab === 'point' ? 'The curve ' + e.name + ', drawn as a road; two cars close in on x = ' + e.a + '. ' : 'The curve, drawn as a road on an x axis squeezed by powers of ten; two cars drive out. ') + cause.text();
    }

    /* ---------------------------------------------------- changes */
    function userActs(){
      hideCue(true);
      if(close.playing()) close.stop();
      if(drive.playing()) drive.stop();
      S.took = null;
    }
    function setP(e, how){
      fade();
      close.stop(); drive.stop();
      S.P = e; S.dl = S.dr = S.tl = S.tr = 1; S.filled = false; S.fillK = 0; S.fillPending = false; S.took = null; S.closeV = 0;
      fillB.setAttribute('aria-pressed', 'false');
      LENS.show = 0; LENS.frozen = null; LENS.w = lensTarget();
      if(S.tab === 'point'){ hl.value(S.dl); hr.value(S.dr); }
      pick.value = e.id;
      layout(); close.paint(); refHtml();
      if(how !== 'quiet') say('Curve: ' + e.name + '. ' + cause.text());
    }
    function setTab(v, quiet){
      if(v === S.tab) return;
      fade();
      close.stop(); drive.stop(); tour.stop(); tour2.stop();
      S.tab = v; S.took = null; S.lensDrag = false;
      tabs.value(v);
      if(v === 'inf') hideCue(false);
      LENS.show = 0; LENS.frozen = null; LENS.w = lensTarget();
      head.purpose(v === 'point' ? 'The limit is the height both sides head for.' : 'Far out, f(x) levels off at a horizontal asymptote.');
      close.el.hidden = v !== 'point'; drive.el.hidden = v !== 'inf';
      pick.value = v === 'point' ? S.P.id : 'inf';
      hl.value(v === 'point' ? S.dl : S.xl); hr.value(v === 'point' ? S.dr : S.xr);
      S.drawn = null;
      layout(); kick(); refHtml();
      if(v === 'point' && S.mode === 'explore') cueShow();
      if(!quiet) say((v === 'point' ? 'Close in on a point. ' : 'Out to infinity. ') + cause.text());
    }
    /* A short cross fade of the picture that was there (a new curve, a tab, a result shown at once). */
    function fade(){
      if(!S.ready || !G) return;
      var old = gS.innerHTML + gD.innerHTML;
      if(!old) return;
      var g = document.createElementNS(NS, 'g'); g.setAttribute('class', 'le2-fade'); g.innerHTML = old; svg.appendChild(g);
      var done = function(){ if(g.parentNode) g.parentNode.removeChild(g); };
      if(g.animate){ var an = g.animate([{ opacity: 1 }, { opacity: 0 }], { duration: K.reduced() ? 240 : 300, easing: 'ease-out' }); an.onfinish = done; setTimeout(done, 500); } else done();
    }

    /* ---------------------------------------------------- the one loop: cars glide to a key's value, the glass, the slab */
    var raf = 0, lastT = 0;
    function kick(){ if(!raf && S.ready) { lastT = 0; raf = requestAnimationFrame(frame); } }
    function easeLog(k, t, dt){
      var v = S[k], to = S[t];
      if(Math.abs(Math.log(v / to)) < 0.003){ S[k] = to; return false; }
      S[k] = Math.exp(Math.log(v) + (Math.log(to) - Math.log(v)) * Math.min(1, dt * 12));
      return true;
    }
    function frame(t){
      raf = 0;
      var dt = lastT ? Math.min(0.05, (t - lastT) / 1000) : 0.016; lastT = t;
      var red = K.reduced(), busy = false;
      if(red){ S.dl = S.tl; S.dr = S.tr; S.xl = S.txl; S.xr = S.txr; }
      else [['dl', 'tl'], ['dr', 'tr'], ['xl', 'txl'], ['xr', 'txr']].forEach(function(k){ if(easeLog(k[0], k[1], dt)) busy = true; });
      var ft = S.filled ? 1 : 0;
      if(S.fillK !== ft){
        if(red) S.fillK = ft; else { S.fillK = ft > S.fillK ? Math.min(1, S.fillK + dt / 0.6) : Math.max(0, S.fillK - dt / 0.45); busy = true; }
      }
      var want = lensWanted() ? 1 : 0;
      if(S.lensDrag) want = 1;
      if(red) LENS.show = want;
      else if(Math.abs(LENS.show - want) > 0.001){ LENS.show += (want - LENS.show) * Math.min(1, dt * 12); if(Math.abs(LENS.show - want) < 0.01) LENS.show = want; busy = true; }
      var target = lensTarget();
      if(LENS.show === 0 || red || close.playing()) LENS.w = target;
      else if(Math.abs(Math.log(LENS.w / target)) > 0.002){ LENS.w = Math.exp(Math.log(LENS.w) + (Math.log(target) - Math.log(LENS.w)) * Math.min(1, dt * 9)); busy = true; }
      else LENS.w = target;
      draw();
      if(S.fillPending && S.fillK === ft) fillDone();
      if(busy) raf = requestAnimationFrame(frame);
    }

    /* ---------------------------------------------------- Close in (tab 1) and Drive out (tab 2) */
    var CL = { l0: 1, r0: 1, out: false };
    function closeStart(){
      userActs(); hideCue(true); tourDid('close'); hl.used(); hr.el.classList.remove('is-quiet');
      var out = S.dl <= DEND * 1.01 && S.dr <= DEND * 1.01, back = Math.min(1, dmax());
      CL = { l0: S.dl, r0: S.dr, out: out, back: back };
      if(K.reduced()) fade();
      S.closeV = 0;
      return true;
    }
    function closeTo(v){
      S.closeV = v;
      function to(d0){ return CL.out ? d0 * Math.pow(CL.back / d0, v) : d0 <= DEND ? d0 : d0 * Math.pow(DEND / d0, v); }
      S.dl = S.tl = to(CL.l0); S.dr = S.tr = to(CL.r0);
      hl.value(S.dl); hr.value(S.dr);
      kick(); draw();
    }
    function closeEnd(){
      if(CL.out){ S.closeV = 0; close.paint(); S.took = null; wKey = ''; words(); say(cause.text()); refLater(); return; }
      S.closeV = 1; close.paint();
      S.took = takeaway(); wKey = ''; words(); say(S.took); refLater();
    }
    function takeaway(){
      var e = S.P, F = S.filled;
      switch(e.id){
        case 'hole': return F ? 'The limit is 2 and f(1) = 2, so f is continuous at x = 1.' : 'The limit is 2, even though f(1) is not defined, so f is not continuous at x = 1.';
        case 'move': return F ? 'The limit is 4 and now f(2) = 4, so f is continuous at x = 2.' : 'The limit is 4 even though f(2) = 1: the limit ignores f(2) itself, so f is not continuous at x = 2.';
        case 'jump': return 'From the left f heads for 2, from the right for 3: they disagree, so the limit does not exist.';
        case 'vasym': return 'f decreases without bound from the left and increases without bound from the right, so the limit does not exist.';
        case 'osc': return 'sin(1/x) keeps swinging between −1 and 1 however close you get, so the limit does not exist.';
        case 'squeeze': return F ? 'Trapped between −|x| and |x|, which both head for 0, f heads for 0 too; now f(0) = 0, so f is continuous at x = 0.' : 'Trapped between −|x| and |x|, which both head for 0, f heads for 0 too: the limit is 0.';
      }
      return null;
    }
    var DV = { l0: 1, r0: 1, out: false };
    function driveStart(){
      userActs(); hideCue(true); tourDid('drive'); hl.used(); hr.el.classList.remove('is-quiet');
      DV = { l0: S.xl, r0: S.xr, out: S.xl >= XMAX * 0.99 && S.xr >= XMAX * 0.99 };
      if(K.reduced()) fade();
      S.driveV = 0;
      return true;
    }
    function driveTo(v){
      S.driveV = v;
      function to(x0){ return DV.out ? x0 * Math.pow(xstart() / x0, v) : x0 >= XMAX ? x0 : x0 * Math.pow(XMAX / x0, v); }
      S.xl = S.txl = to(DV.l0); S.xr = S.txr = to(DV.r0);
      hl.value(S.xl); hr.value(S.xr);
      kick(); draw();
    }
    function driveEnd(){
      if(DV.out){ S.driveV = 0; drive.paint(); S.took = null; wKey = ''; words(); say(cause.text()); refLater(); return; }
      S.driveV = 1; drive.paint();
      S.took = 'Far out on both sides f(x) heads for 2, so y = 2 is a horizontal asymptote (the curve crosses it at x = 2/3 on the way).';
      wKey = ''; words(); say(S.took); refLater();
    }

    /* ---------------------------------------------------- the first visit cue and "Show me how" */
    var cueO = { key: 'apcalc-limit-explorer', text: 'Drag the car toward x = 1', side: 'left',
      at: function(){ if(!G || !S.drawn) return [0, 0]; var c = S.drawn.cl; return cueO.side === 'left' ? [c.Rx - c.r + 6, c.Ry] : [c.Rx + c.r - 6, c.Ry]; } };
    var cue = K.cue(layer, cueO);
    function cueShow(){ if(!G || !S.drawn) return; var c = S.drawn.cl, room = c.Rx - c.r - G.A.L; cueO.text = room > 300 ? 'Drag the car toward x = ' + S.P.a : 'Drag the car'; cueO.side = room > 190 ? 'left' : 'right'; if(cue.show()) draw(); }
    function blockCue(){
      var c = cue.active() && scene.querySelector('.tk2-cue'); if(!c) return;
      var r = c.getBoundingClientRect(), sr = scene.getBoundingClientRect(), k = layer.scale() || 1;
      boxes.push([(r.left - sr.left) / k, (r.top - sr.top) / k, (r.right - sr.left) / k, (r.bottom - sr.top) / k]);
    }
    function hideCue(used){ if(cue.active()) cue.hide(used); }
    stage.addEventListener('keydown', function(e){ if(/^(Arrow|Page|Home|End)/.test(e.key)) hideCue(true); }, true);
    var tour = K.tour({ key: 'apcalc-limit-explorer', label: 'Show me how', steps: [
      { id: 'drag', text: 'Drag the purple car toward x = a. Its tag reads f(x) where its nose is.', target: function(){ return hl.knob; } },
      { id: 'right', text: 'Now the orange car, from the other side. The limit is the height both head for.', target: function(){ return hr.knob; } },
      { id: 'close', text: 'Press Close in to drive both to within 0.001 of a.', target: function(){ return close.el; } }],
      onClose: function(had){ if(had) try{ head.how.focus({ preventScroll: true }); }catch(e){} } });
    var tour2 = K.tour({ key: 'apcalc-limit-explorer-2', label: 'Show me how', steps: [
      { id: 'drag', text: 'Drag a car outward. Each grid step is ten times farther.', target: function(){ return hl.knob; } },
      { id: 'drive', text: 'Press Drive out to go to x = ±10,000 and watch the height level off.', target: function(){ return drive.el; } }],
      onClose: function(had){ if(had) try{ head.how.focus({ preventScroll: true }); }catch(e){} } });
    function tourDid(x){ [tour, tour2].forEach(function(t){ if(t.active()) t.did(x); }); }
    function startTour(){ if(S.mode !== 'explore') return; hideCue(false); (S.tab === 'point' ? tour : tour2).start(true); }

    /* ---------------------------------------------------- presses on the road: the car on that side comes */
    scene.addEventListener('pointerdown', function(e){
      if(!G || e.target.closest('.tk2-knob, .tk2-cue, button')) return;
      if(e.pointerType === 'mouse' && e.button !== 0) return;
      var r = scene.getBoundingClientRect(), k = layer.scale() || 1, x = (e.clientX - r.left) / k, y = (e.clientY - r.top) / k, A = G.A;
      if(LENS.show > 0.5 && Math.hypot(x - LENS.cx, y - LENS.cy) < LENS.R){ hideCue(true); (x < LENS.cx ? hl : hr).grab(e); return; }
      if(x < A.L - 6 || x > A.R + 6 || y < A.T - 6 || y > A.B + 6) return;
      var xv = A.ix(x), fy = f(xv);
      if(!(isFinite(fy) && Math.abs(A.sy(fy) - y) < 30)) return;
      hideCue(true);
      var left = S.tab === 'point' ? xv < S.P.a : xv < 0;
      (left ? hl : hr).grab(e);
    });
    pick.addEventListener('change', function(){
      userActs();
      var v = pick.value;
      if(v === 'inf'){ setTab('inf'); return; }
      var e = LE.entry(v);
      if(S.tab !== 'point'){ S.P = e; S.dl = S.dr = S.tl = S.tr = 1; S.filled = false; S.fillK = 0; setTab('point'); return; }
      setP(e);
    });

    /* ---------------------------------------------------- "?": the table, the limits, the continuity check */
    var ref = el('div', 'ls-sec le2-ref'), refT = null;
    function refLater(){ clearTimeout(refT); refT = setTimeout(refHtml, hl.dragging() || hr.dragging() || close.playing() || drive.playing() ? 300 : 60); }
    function justify(e, ck){
      var a = e.a;
      if(ck.continuous) return 'f(' + a + ') = ' + limWord(ck.value) + ' and lim f(x) = ' + limWord(ck.limit.two) + ' as x → ' + a + ', so lim f(x) = f(' + a + ') and f is continuous at x = ' + a + '.';
      if(!ck.defined) return 'f is not continuous at x = ' + a + ' because f(' + a + ') is not defined.';
      if(!ck.exists) return 'f is not continuous at x = ' + a + ' because lim f(x) as x → ' + a + ' does not exist (' + (e.kind === 'infinite' ? 'f decreases without bound from the left and increases without bound from the right' : e.kind === 'oscillating' ? 'the values keep swinging between −1 and 1' : 'the one-sided limits are ' + limWord(e.left) + ' and ' + limWord(e.right)) + ').';
      return 'f is not continuous at x = ' + a + ' because lim f(x) = ' + limWord(ck.limit.two) + ' as x → ' + a + ' but f(' + a + ') = ' + limWord(ck.value) + '.';
    }
    function refHtml(){
      var html = '<p class="le2-howref"><button type="button" class="tk2-how" data-how>Show me how</button> to use it, step by step.</p>';
      if(S.tab === 'point'){
        var e = S.P, a = e.a, ck = LE.check(e, S.filled), rows = LE.rows(e, 4), A = String(a);
        var lt = function(side){ return tm('\\lim_{x \\to ' + A + '^' + side + '} f(x)'); };
        html += '<h3 class="ls-title-l">' + esc(e.name) + '</h3>' + tm(e.tex, true) + (S.filled ? '<p class="bt-small">Filled: f(' + A + ') is now defined as ' + limWord(e.fill) + '.</p>' : '') + '<p>' + esc(e.say) + '</p>' +
          '<h3 class="ls-title-l">Closing in on x = ' + A + '</h3><div class="table-wrap" tabindex="0" role="region" aria-label="Values of f closing in on x = ' + A + '"><table class="le2-tab"><caption class="sr-only">Values of f approaching x = ' + A + ' from each side</caption>' +
          '<thead><tr><th scope="col" class="l">x</th><th scope="col" class="l">f(x)</th><th scope="col" class="r">x</th><th scope="col" class="r">f(x)</th></tr></thead><tbody>' +
          rows.map(function(r){ return '<tr><td class="l">' + fmtX(r.xl, r.h) + '</td><td class="l">' + fmtY(r.fl, r.h) + '</td><td class="r">' + fmtX(r.xr, r.h) + '</td><td class="r">' + fmtY(r.fr, r.h) + '</td></tr>'; }).join('') +
          '</tbody></table></div><p class="bt-small">The purple columns come from the left (x = ' + A + ' − h), the orange ones from the right (x = ' + A + ' + h), with h = 1, 0.1, 0.01, 0.001, 0.0001: exactly where the cars are after Close in and beyond.</p>' +
          '<h3 class="ls-title-l">The limits</h3><table class="ls-tbl le2-lims"><tbody>' +
          '<tr><th scope="row">From the left, ' + lt('-') + '</th><td>' + limWord(e.left) + '</td></tr>' +
          '<tr><th scope="row">From the right, ' + lt('+') + '</th><td>' + limWord(e.right) + '</td></tr>' +
          '<tr><th scope="row">Two-sided, ' + tm('\\lim_{x \\to ' + A + '} f(x)') + '</th><td>' + (ck.limit.exists ? limWord(ck.limit.two) : 'does not exist') + '</td></tr>' +
          '<tr><th scope="row">The value f(' + A + ')</th><td>' + (ck.defined ? limWord(ck.value) : 'not defined') + '</td></tr></tbody></table>' +
          '<p>The limit as x → ' + A + ' depends only on values of f near ' + A + ', never on f(' + A + ') itself. It exists only when the limit from the left and the limit from the right exist, are finite and are the same number.</p>' +
          (e.kind === 'infinite' ? '<p>Here f decreases without bound from the left and increases without bound from the right. We write ' + lt('-') + ' = −∞ and ' + lt('+') + ' = ∞ to describe that, but the limit does not exist: ∞ is not a number. The line x = ' + A + ' is a vertical asymptote.</p>' : '') +
          (e.bounds ? '<p>The squeeze theorem: −|x| ≤ x sin(1/x) ≤ |x| for every x ≠ 0, because the sine stays between −1 and 1. Both bounds head for 0 as x → 0, so the function caught between them does too: the limit is 0.</p>' : '') +
          (e.kind === 'oscillating' ? '<p>A table can fool you here: at x = 1/π, 1/(2π), 1/(3π), … every value is exactly 0, while at other x near 0 the values are 1 or −1. However close you get, f keeps taking every height between −1 and 1, so there is no single height to head for.</p>' : '') +
          '<h3 class="ls-title-l">Continuous at x = ' + A + '?</h3><ol class="le2-check">' +
          '<li class="' + (ck.defined ? 'yes' : 'no') + '">f(' + A + ') is defined: <b>' + (ck.defined ? 'yes, ' + limWord(ck.value) : 'no') + '</b></li>' +
          '<li class="' + (ck.exists ? 'yes' : 'no') + '">the limit exists: <b>' + (ck.exists ? 'yes, ' + limWord(ck.limit.two) : 'no') + '</b></li>' +
          '<li class="' + (ck.equal ? 'yes' : 'no') + '">they are equal: <b>' + (ck.equal ? 'yes' : ck.defined && ck.exists ? 'no' : 'cannot be') + '</b></li></ol>' +
          '<p><b>' + ({ continuous: 'Continuous', removable: 'Removable discontinuity', jump: 'Jump discontinuity', infinite: 'Infinite discontinuity', oscillating: 'Not continuous: the limit does not exist (oscillation)' })[ck.type] + '.</b>' +
          (e.fill != null && !S.filled ? ' Press “' + (e.id === 'move' ? 'Move the point' : 'Fill the hole') + '” to redefine f(' + A + ') = ' + limWord(e.fill) + ': then all three conditions hold, so the discontinuity is removable.' : '') + '</p>' +
          '<h3 class="ls-title-l">How to say it</h3><p>' + esc(justify(e, ck)) + '</p>';
      } else {
        var r2s = LE.rows(INF, 4);
        html += '<h3 class="ls-title-l">' + esc(INF.name) + '</h3>' + tm(INF.tex, true) + '<p>' + esc(INF.say) + '</p>' +
          '<h3 class="ls-title-l">Far out on each side</h3><div class="table-wrap" tabindex="0" role="region" aria-label="Values of f far out"><table class="le2-tab"><caption class="sr-only">Values of f for large negative and positive x</caption>' +
          '<thead><tr><th scope="col" class="l">x</th><th scope="col" class="l">f(x)</th><th scope="col" class="r">x</th><th scope="col" class="r">f(x)</th></tr></thead><tbody>' +
          r2s.map(function(r){ return '<tr><td class="l">' + fmtBig(r.xl) + '</td><td class="l">' + fmtY2(r.fl) + '</td><td class="r">' + fmtBig(r.xr) + '</td><td class="r">' + fmtY2(r.fr) + '</td></tr>'; }).join('') +
          '</tbody></table></div>' +
          '<h3 class="ls-title-l">The limits at infinity</h3><table class="ls-tbl le2-lims"><tbody><tr><th scope="row">' + tm('\\lim_{x \\to -\\infty} f(x)') + '</th><td>2</td></tr><tr><th scope="row">' + tm('\\lim_{x \\to \\infty} f(x)') + '</th><td>2</td></tr></tbody></table>' +
          '<p>For huge |x| only the highest powers matter: (2x² + 3x)/(x² + 1) behaves like 2x²/x² = 2. Top and bottom have the same degree, so the limit is the ratio of the leading coefficients, 2/1 = 2. A bottom of higher degree would give 0; a top of higher degree, no horizontal asymptote.</p>' +
          '<h3 class="ls-title-l">How to say it</h3><p>Since the leading terms of the top and bottom are 2x² and x², lim f(x) = 2 as x → ∞ and as x → −∞, so y = 2 is a horizontal asymptote. The graph may cross it: here f(x) = 2 at x = 2/3.</p>' +
          '<h3 class="ls-title-l">The squeezed axis</h3><p>The x axis in this tab is squeezed: each grid step is ten times farther from 0 than the last (1, 10, 100, 1,000, 10,000), so the cars can drive very far out and stay in the picture. The heights are not squeezed: y is drawn to scale.</p>';
      }
      html += '<p class="bt-small">How it is drawn: the center line of the road is exactly y = f(x) on the grid, and each car’s nose is the point (x, f(x)); the thin line from it to the y axis is its height. The magnifier zooms in on the road around x = a so the farther car sits most of the way to its rim; for a jump it squeezes heights to keep both sides in the glass. Near 0, sin(1/x) swings faster than a screen can draw, so that strip is shaded between its bounds.</p>' +
        '<details class="le2-keys"><summary>Keyboard</summary><p class="bt-small">Tab to a car. Close in on a point: ← → move it along the road (Shift: ten steps), Page Down takes it ten times closer to a, Page Up ten times farther, Home and End go to the ends. Out to infinity: ← → drive it (each step about ×1.26), Page Up ten times farther out, Page Down ten times closer in.</p></details>' +
        '<p class="tool-about-n">Notes for this topic: <a href="../notes/' + (S.tab === 'point' ? ({ hole: 'limits-from-plots', move: 'discontinuity-types', jump: 'limits-from-plots', vasym: 'infinite-limits', osc: 'limits-from-plots', squeeze: 'squeeze-theorem' })[S.P.id] : 'limits-at-infinity') + '.html">' + (S.tab === 'point' ? ({ hole: 'Limits from graphs', move: 'Types of discontinuities', jump: 'Limits from graphs', vasym: 'Infinite limits', osc: 'Limits from graphs', squeeze: 'The squeeze theorem' })[S.P.id] : 'Limits at infinity') + '</a></p>';
      ref.innerHTML = html;
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
      if(S.tab === 'inf'){ ['xl', 'xr', 'txl', 'txr'].forEach(function(k){ if(S[k] < xmin()) S[k] = xmin(); }); hl.value(S.xl); hr.value(S.xr); }
      S.drawn = null;
      drawStatic(); draw(); draw();
    }
    if(window.ResizeObserver){ var rt = 0; new ResizeObserver(function(){ var r = scene.getBoundingClientRect(); if(Math.round(r.width) + 'x' + Math.round(r.height) === lastWH) return; cancelAnimationFrame(rt); rt = requestAnimationFrame(layout); }).observe(scene); }
    else window.addEventListener('resize', layout);

    function boot(){
      S.ready = true;
      head.purpose('The limit is the height both sides head for.');
      drive.el.hidden = true;
      refHtml(); layout();
      setTimeout(function(){ layout(); if(S.mode === 'explore' && !tour.active()) cueShow(); }, 60);
    }
    function stopAll(){ close.stop(); drive.stop(); tour.stop(); tour2.stop(); hideCue(false); if(raf){ cancelAnimationFrame(raf); raf = 0; } S.lensDrag = false; LENS.frozen = null; }
    function shown(m){
      S.mode = m;
      if(m !== 'explore'){ stopAll(); return; }
      setTimeout(function(){ layout(); if(!tour.active() && !tour2.active() && S.tab === 'point') cueShow(); }, 40);
    }
    return {
      kit2: function(pane, s){ LS = s; boot(); return { stage: stage, ref: ref }; },
      plain: function(){ host.appendChild(stage); host.appendChild(ref); boot(); },
      shown: shown, stop: stopAll,
      redraw: function(){ layout(); },
      // for the sweep test and the browser checks only: exposed as window.ApCalcLimitExplorer only when the test sets
      // window.LevlToolTest before the page loads (never in production)
      _t: { S: S, LENS: LENS, G: function(){ return G; }, hl: hl, hr: hr, close: close, drive: drive, cause: cause, setTab: setTab,
        setCurve: function(idv){ pick.value = idv; pick.dispatchEvent(new Event('change')); },
        set: function(side, v){ (side < 0 ? hl : hr).value(v, true); }, tagSideOf: tagSideOf, knobAt: knobAt, fill: function(){ fillB.click(); }, knobsInLens: knobsInLens }
    };
  }

  /* ========================================================= mount */
  function boot(){
    T.mount('limit-explorer', function(app, data){
      var ex = null, kit = !!(window.LevlKit2 && window.LevlStudio && app.getAttribute('data-studio'));
      var md = T.modes(app, { slug: 'limit-explorer', labels: ['Explore', 'Test yourself'],
        explore: function(host){ ex = explore(host, data); if(window.LevlToolTest) window.ApCalcLimitExplorer = ex._t; },
        quiz: function(pane){
          T.drill(pane, data, {
            slug: 'limit-explorer', noun: 'drill', typeLabel: 'Kind of problem', textOnStage: true,
            types: LE.TYPES.map(function(t){ return { value: t.value, label: t.label }; }),
            generate: function(r, ctx, type){ return texify(LE.generate(r, ctx, type)); },
            extra: function(host, p){ QZ.marks.clear(); QZ.last = {}; QZ.plot = null; QZ.figPlot = null; QZ.host = host; figure(host, p); },
            title: function(p){ var t = LE.TYPES.filter(function(x){ return x.value === p.type; })[0]; return t ? t.label : 'Practice problem'; },
            method: function(s, p){ return (s.key === 'k' && p.key && p.key.kind === 'hole' ? METHOD.khole : '') || METHOD[p.type + '.' + s.key] || METHOD[s.key] || ''; },
            onTry: function(s, t, api){ return quizTry(s, t, api.problem); }
          });
        },
        onShow: function(m){
          if(ex) ex.shown(m);
          // A pane that was hidden has no size: draw it again once it shows.
          setTimeout(function(){ if(m === 'explore' && ex) ex.redraw(); }, 30);
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
