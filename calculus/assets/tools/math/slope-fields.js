/* Slope fields model: ApCalcMath.slopeFields (docs/apcalc-architecture.md, "Tools").
   OWNED BY THIS TOOL ONLY: no other tool edits this file, and this tool edits
   no shared file. Pure functions, no DOM, so the validator
   (scripts/lib/apcalc-tool-checks/slope-fields.mjs) and the test
   (scripts/test/apcalc-tool-slope-fields.test.mjs) run exactly this code.

   AB only (CED Unit 7): slope fields, solution curves, separation of
   variables, particular solutions, dy/dt = ky. No Euler's method, no
   logistic models (BC).

   Explore
     GALLERY                 the equations of the explorer: { id, tex, f(x, y),
                             f2(x, y) (d²y/dx² along a solution), sep, eq(p),
                             exact(x0, y0, p) -> { fn, lo, hi } , view, snap }
     de(id)                  one gallery entry
     grid(view, n)           the grid the segments sit on: { xs, ys, step }
     field(f, view, n)       [{ x, y, m }] slopes at the grid points
     solve(f, x0, y0, view)  the solution through (x0, y0) by adaptive
                             Runge-Kutta (Dormand-Prince 5(4)), both ways:
                             { pts, left: { x, why }, right: { x, why } };
                             it stops at the view's edge or where the slope
                             turns vertical (a domain restriction)
     rk45(f, x0, y0, x1)     y(x1) by the same integrator (tests)
     steps(id, x0, y0, p)    the separation of variables, TeX lines
     halfLife(k)             ln 2 / |k|
   Test yourself
     generate(rng, ctx, type) -> { ctx, topic, type, text, steps, solution, fig }
       types: slopes, match, sketch, separate, concavity, exp
     sketchGrade(fig, ys)    0 right, 1 wrong way, 2 crosses an equilibrium,
                             3 drifts off; the hidden choice of the sketch step
     MATCH                   the match pool: { s, tex, feature, holds(f) }
     zerosOn(f, z)           whether f is 0 along a described set (validator) */
(function(G){
  'use strict';
  var M = G.ApCalcMath;
  if(!M) return;
  function H(s){ var t = G.ApCalcTex; return t ? t.html(s) : s; }

  /* ------------------------------------------------- numbers as TeX */
  function fracOf(v){
    if(Math.abs(v - Math.round(v)) < 1e-9) return { n: Math.round(v), d: 1 };
    for(var d = 2; d <= 12; d++) if(Math.abs(v * d - Math.round(v * d)) < 1e-9) return { n: Math.round(v * d), d: d };
    return null;
  }
  function tn(v){
    var f = fracOf(v);
    if(f && f.d === 1) return String(f.n);
    if(f) return (f.n < 0 ? '-' : '') + '\\frac{' + Math.abs(f.n) + '}{' + f.d + '}';
    return String(+v.toFixed(3));
  }
  function pn(v){ return v < 0 ? '(' + tn(v) + ')' : tn(v); }
  // decimals for the explorer's dragged points: 0.8, not 4/5
  function dd(v){ return String(+(+v).toFixed(2)); }
  function pd(v){ return v < 0 ? '(' + dd(v) + ')' : dd(v); }
  // a coordinate inside TeX: a negative one grouped, so its minus reads as a sign
  function tp(v){ var s = tn(v); return v < 0 ? '{' + s + '}' : s; }
  function dn(v, d){ return String(+(+v).toFixed(d == null ? 2 : d)); }
  // a term "c·x" written well: 1x -> x, -1x -> -x
  function coef(c, v, first){
    var s = c < 0 ? (first ? '-' : ' - ') : (first ? '' : ' + '), a = Math.abs(c);
    var f = fracOf(a), A = f && f.d === 1 ? (a === 1 && v ? '' : String(f.n)) : tn(a);
    return s + A + v;
  }
  function poly(terms){ // [[c, 'x'], [c, 'y'], [c, '']]
    var out = '', first = true;
    terms.forEach(function(t){ if(!t[0]) return; out += coef(t[0], t[1], first); first = false; });
    return out || '0';
  }
  function sgn(v){ return v > 0 ? 1 : v < 0 ? -1 : 0; }
  function niceStep(raw){ var p = Math.pow(10, Math.floor(Math.log10(raw))), m = raw / p; return (m <= 1 ? 1 : m <= 2 ? 2 : m <= 2.5 ? 2.5 : m <= 5 ? 5 : 10) * p; }

  /* --------------------------------------------- the gallery (explore) */
  var LN2 = Math.LN2;
  var GALLERY = [
    { id: 'x+y', name: 'x + y', tex: 'x + y', f: function(x, y){ return x + y; }, f2: function(x, y){ return 1 + x + y; }, f2tex: '1 + x + y',
      at: function(x, y){ return pd(x) + ' + ' + pd(y); }, sep: false, eq: function(){ return []; },
      exact: function(x0, y0){ var C = (y0 + x0 + 1) * Math.exp(-x0); return { fn: function(x){ return C * Math.exp(x) - x - 1; }, lo: -Infinity, hi: Infinity }; },
      view: { x: [-3, 3], y: [-3, 3] }, snap: [0.1, 0.1], start: [-1, 1],
      note: 'Not separable: $x + y$ is not a function of $x$ times a function of $y$, so AB solves it only by picture. The curve is still exact, traced numerically.' },
    { id: 'x/y', name: 'x / y', tex: '\\frac{x}{y}', f: function(x, y){ return x / y; }, f2: function(x, y){ return (y * y - x * x) / (y * y * y); }, f2tex: '\\frac{y^2 - x^2}{y^3}',
      at: function(x, y){ return '\\frac{' + dd(x) + '}{' + dd(y) + '}'; }, sep: true, eq: function(){ return []; },
      exact: function(x0, y0){
        var K = y0 * y0 - x0 * x0, s = sgn(y0);
        var fn = function(x){ var v = x * x + K; return v >= 0 ? s * Math.sqrt(v) : NaN; };
        if(K > 0) return { fn: fn, lo: -Infinity, hi: Infinity };
        var r = Math.sqrt(-K);
        return x0 > 0 ? { fn: fn, lo: r, hi: Infinity } : { fn: fn, lo: -Infinity, hi: -r };
      },
      view: { x: [-3, 3], y: [-3, 3] }, snap: [0.1, 0.1], start: [1, 2], undefinedOn: 'y = 0' },
    { id: 'xy', name: 'xy', tex: 'xy', f: function(x, y){ return x * y; }, f2: function(x, y){ return y + x * x * y; }, f2tex: 'y + x^2 y',
      at: function(x, y){ return pd(x) + '\\cdot ' + pd(y); }, sep: true, eq: function(){ return [0]; },
      exact: function(x0, y0){ return { fn: function(x){ return y0 * Math.exp((x * x - x0 * x0) / 2); }, lo: -Infinity, hi: Infinity }; },
      view: { x: [-3, 3], y: [-3, 3] }, snap: [0.1, 0.1], start: [0, 0.5] },
    { id: 'y-2', name: 'y − 2', tex: 'y - 2', f: function(x, y){ return y - 2; }, f2: function(x, y){ return y - 2; }, f2tex: 'y - 2',
      at: function(x, y){ return pd(y) + ' - 2'; }, sep: true, eq: function(){ return [2]; },
      exact: function(x0, y0){ return { fn: function(x){ return 2 + (y0 - 2) * Math.exp(x - x0); }, lo: -Infinity, hi: Infinity }; },
      view: { x: [-3, 3], y: [-1, 5] }, snap: [0.1, 0.1], start: [-2, 1.5] },
    { id: 'ky', name: 'ky (growth and decay)', tex: 'ky', xv: 't', f: null, model: 'exp',
      mk: function(p){ var k = p.k; return { f: function(t, y){ return k * y; }, f2: function(t, y){ return k * k * y; } }; },
      f2tex: 'k^2 y', at: function(x, y, p){ return dd(p.k) + '\\cdot ' + pd(y); }, sep: true, eq: function(){ return [0]; },
      exact: function(x0, y0, p){ return { fn: function(t){ return y0 * Math.exp(p.k * (t - x0)); }, lo: -Infinity, hi: Infinity }; },
      view: { x: [0, 10], y: [0, 10] }, snap: [0.1, 0.1], start: [0, 2], params: { k: 0.3 } },
    { id: 'cool', name: 'Cooling', tex: '-k(T - T_a)', xv: 't', yv: 'T', model: 'cool',
      mk: function(p){ var k = p.k, a = p.Ta; return { f: function(t, T){ return -k * (T - a); }, f2: function(t, T){ return k * k * (T - a); } }; },
      f2tex: 'k^2 (T - T_a)', at: function(x, y, p){ return '-' + dd(p.k) + '(' + dd(y) + ' - ' + dd(p.Ta) + ')'; }, sep: true, eq: function(p){ return [p.Ta]; },
      exact: function(x0, y0, p){ return { fn: function(t){ return p.Ta + (y0 - p.Ta) * Math.exp(-p.k * (t - x0)); }, lo: -Infinity, hi: Infinity }; },
      view: { x: [0, 60], y: [0, 100] }, snap: [1, 1], start: [0, 90], params: { k: 0.08, Ta: 20 } }
  ];
  function de(id){ return GALLERY.filter(function(d){ return d.id === id; })[0] || GALLERY[0]; }
  /* f and f2 of an entry with its parameters. */
  function fns(d, p){ if(d.mk) return d.mk(p || d.params); return { f: d.f, f2: d.f2 }; }

  function grid(view, n){
    var sx = niceStep((view.x[1] - view.x[0]) / (n || 13)), sy = niceStep((view.y[1] - view.y[0]) / (n ? n * 0.85 : 11));
    var xs = [], ys = [], v;
    for(v = Math.ceil(view.x[0] / sx - 1e-9) * sx; v <= view.x[1] + 1e-9; v += sx) xs.push(+v.toPrecision(12));
    for(v = Math.ceil(view.y[0] / sy - 1e-9) * sy; v <= view.y[1] + 1e-9; v += sy) ys.push(+v.toPrecision(12));
    return { xs: xs, ys: ys, sx: sx, sy: sy };
  }
  function field(f, view, n){
    var g = grid(view, n), out = [];
    g.xs.forEach(function(x){ g.ys.forEach(function(y){ var m = f(x, y); out.push({ x: x, y: y, m: m }); }); });
    return out;
  }

  /* ------------------------------------- Dormand-Prince 5(4) integrator */
  var A = [[], [1 / 5], [3 / 40, 9 / 40], [44 / 45, -56 / 15, 32 / 9], [19372 / 6561, -25360 / 2187, 64448 / 6561, -212 / 729],
    [9017 / 3168, -355 / 33, 46732 / 5247, 49 / 176, -5103 / 18656], [35 / 384, 0, 500 / 1113, 125 / 192, -2187 / 6784, 11 / 84]];
  var Cc = [0, 1 / 5, 3 / 10, 4 / 5, 8 / 9, 1, 1];
  var B5 = [35 / 384, 0, 500 / 1113, 125 / 192, -2187 / 6784, 11 / 84, 0];
  var B4 = [5179 / 57600, 0, 7571 / 16695, 393 / 640, -92097 / 339200, 187 / 2100, 1 / 40];
  function dp(f, x, y, h){
    var k = [];
    for(var i = 0; i < 7; i++){
      var yi = y;
      for(var j = 0; j < i; j++) yi += h * A[i][j] * k[j];
      k.push(f(x + Cc[i] * h, yi));
    }
    var y5 = y, e = 0;
    for(i = 0; i < 7; i++){ y5 += h * B5[i] * k[i]; e += h * (B5[i] - B4[i]) * k[i]; }
    return { y: y5, err: Math.abs(e), ok: k.every(isFinite) && isFinite(y5) };
  }
  /* One direction from (x0, y0) to xEnd. Stops early where the solution
     leaves [ylo, yhi], where the slope turns vertical (|f| huge, or the
     step underflows), or where f is undefined. */
  function march(f, x0, y0, xEnd, o){
    o = o || {};
    var span = Math.abs(xEnd - x0) || 1, dir = xEnd >= x0 ? 1 : -1, hmax = o.hmax || span / 200, tol = o.tol || 1e-10;
    var x = x0, y = y0, h = dir * Math.min(hmax, span / 50), pts = [[x, y]], why = 'edge', vmax = o.vmax || 1e4;
    if(!isFinite(f(x0, y0))) return { pts: pts, x: x0, why: 'undefined' };
    for(var n = 0; n < 200000; n++){
      if(dir * (xEnd - x) <= 1e-12 * span) break;
      if(dir * (x + h - xEnd) > 0) h = xEnd - x;
      var s = dp(f, x, y, h);
      if(!s.ok){
        h /= 2;
        if(Math.abs(h) < 1e-12 * span){ why = 'vertical'; break; }
        continue;
      }
      var scale = tol * Math.max(1, Math.abs(y));
      if(s.err <= scale){
        x += h; y = s.y; pts.push([x, y]);
        if(o.ylo != null && (y < o.ylo || y > o.yhi)){ why = 'edge'; break; }
        if(Math.abs(f(x, y)) > vmax){ why = 'vertical'; break; }
      }
      var fac = s.err > 0 ? 0.9 * Math.pow(scale / s.err, 0.2) : 4;
      h *= Math.min(4, Math.max(0.2, fac));
      if(Math.abs(h) > hmax) h = dir * hmax;
      if(Math.abs(h) < 1e-12 * span){ why = 'vertical'; break; }
    }
    return { pts: pts, x: x, why: why };
  }
  function rk45(f, x0, y0, x1, o){ var m = march(f, x0, y0, x1, o); return Math.abs(m.x - x1) < 1e-9 * Math.max(1, Math.abs(x1)) ? m.pts[m.pts.length - 1][1] : NaN; }
  function solve(f, x0, y0, view){
    var ys = view.y[1] - view.y[0], o = { ylo: view.y[0] - 0.6 * ys, yhi: view.y[1] + 0.6 * ys, hmax: (view.x[1] - view.x[0]) / 300, tol: 1e-9 };
    var R = march(f, x0, y0, view.x[1], o), L = march(f, x0, y0, view.x[0], o);
    return { pts: L.pts.slice(1).reverse().concat(R.pts), left: { x: L.x, why: L.why }, right: { x: R.x, why: R.why } };
  }
  function halfLife(k){ return LN2 / Math.abs(k); }

  /* The separation of variables for a separable gallery entry, through
     (x0, y0): TeX lines, and the particular solution. */
  function steps(id, x0, y0, p){
    var d = de(id), X = tn(+dn(x0)), Y = tn(+dn(y0)), L = [];
    p = p || d.params;
    if(id === 'x/y'){
      var K = y0 * y0 - x0 * x0, Ks = tn(+K.toFixed(2));
      L.push(['Separate: $y$ terms with $dy$, $x$ terms with $dx$.', 'y\\,dy = x\\,dx'],
        ['Integrate both sides.', '\\frac{y^2}{2} = \\frac{x^2}{2} + C'],
        ['Use the point now, while $C$ is alone.', '\\frac{' + pn(+dn(y0)) + '^2}{2} = \\frac{' + pn(+dn(x0)) + '^2}{2} + C,\\; C = ' + tn(+(K / 2).toFixed(3))],
        ['Solve for $y$; the point is ' + (y0 > 0 ? 'above' : 'below') + ' the $x$-axis, so take the ' + (y0 > 0 ? 'positive' : 'negative') + ' root.', 'y = ' + (y0 < 0 ? '-' : '') + '\\sqrt{x^2 ' + (K >= 0 ? '+ ' + Ks : '- ' + tn(+(-K).toFixed(2))) + '}']);
      if(K < 0) L.push(['Domain: the square root needs $x^2 \\ge ' + tn(+(-K).toFixed(2)) + '$, and at $|x| = ' + dn(Math.sqrt(-K), 3) + '$ the slope is vertical ($y = 0$), so the solution lives on $' + (x0 > 0 ? 'x > ' + dn(Math.sqrt(-K), 3) : 'x < -' + dn(Math.sqrt(-K), 3)) + '$.', '']);
      return L;
    }
    if(id === 'xy' || id === 'y-2' || id === 'ky' || id === 'cool'){
      var v = d.yv || 'y', t = d.xv || 'x', sh = id === 'y-2' ? ' - 2' : id === 'cool' ? ' - ' + tn(p.Ta) : '';
      var rhs = id === 'xy' ? 'x\\,dx' : id === 'y-2' ? 'dx' : id === 'ky' ? tn(p.k) + '\\,dt' : '-' + tn(p.k) + '\\,dt';
      var integ = id === 'xy' ? '\\frac{x^2}{2}' : id === 'y-2' ? 'x' : id === 'ky' ? tn(p.k) + 't' : '-' + tn(p.k) + 't';
      var eq0 = id === 'y-2' ? 2 : id === 'cool' ? p.Ta : 0, gap = y0 - eq0;
      if(Math.abs(gap) < 1e-9){
        L.push(['This point sits on the equilibrium solution $' + v + ' = ' + tn(eq0) + '$: the slope is 0 there, so the solution is the horizontal line.', v + ' = ' + tn(eq0)],
          ['Separating divides by $' + v + sh + '$, which is 0 here: that is why separation misses this solution. Check it: $' + v + ' = ' + tn(eq0) + '$ makes both sides 0.', '']);
        return L;
      }
      var Cv = Math.log(Math.abs(gap)) - (id === 'xy' ? x0 * x0 / 2 : id === 'y-2' ? x0 : id === 'ky' ? p.k * x0 : -p.k * x0);
      var expo = id === 'xy' ? '\\frac{x^2 - ' + pn(+dn(x0)) + '^2}{2}' : id === 'y-2' ? 'x - ' + pn(+dn(x0)) : id === 'ky' ? tn(p.k) + '(t - ' + pn(+dn(x0)) + ')' : '-' + tn(p.k) + '(t - ' + pn(+dn(x0)) + ')';
      if(x0 === 0) expo = id === 'xy' ? '\\frac{x^2}{2}' : id === 'y-2' ? 'x' : id === 'ky' ? tn(p.k) + 't' : '-' + tn(p.k) + 't';
      L.push(['Separate: every $' + v + '$ with $d' + v + '$, every $' + t + '$ with $d' + t + '$.', '\\frac{1}{' + v + sh + '}\\,d' + v + ' = ' + rhs],
        ['Integrate. The antiderivative of $\\frac{1}{u}$ is $\\ln|u|$: keep the absolute value bars.', '\\ln\\left|' + v + sh + '\\right| = ' + integ + ' + C'],
        ['Use the point at once, while $C$ is alone.', '\\ln\\left|' + Y + sh + '\\right| = ' + (id === 'xy' ? '\\frac{' + pn(+dn(x0)) + '^2}{2}' : id === 'y-2' ? X : tn(id === 'ky' ? p.k : -p.k) + '\\cdot ' + pn(+dn(x0))) + ' + C,\\; C \\approx ' + dn(Cv, 3)],
        ['Solve. $|' + v + sh + '| = e^C e^{\\ldots}$, and the sign comes from the point: $' + Y + sh + (gap > 0 ? ' > 0' : ' < 0') + '$.', v + ' = ' + (eq0 ? tn(eq0) + (gap < 0 ? ' - ' : ' + ') + tn(+Math.abs(gap).toFixed(2)) : (gap < 0 ? '-' : '') + tn(+Math.abs(gap).toFixed(2))) + 'e^{' + expo + '}']);
      if(id === 'ky') L.push([(p.k > 0 ? 'Doubling time' : 'Half-life') + ': $' + (p.k > 0 ? 'e^{kt} = 2' : 'e^{kt} = \\frac{1}{2}') + '$ gives $t = \\frac{\\ln 2}{' + tn(Math.abs(p.k)) + '} \\approx ' + dn(halfLife(p.k), 3) + '$.', '']);
      if(id === 'cool') L.push(['The gap $T - ' + tn(p.Ta) + '$ halves every $\\frac{\\ln 2}{' + tn(p.k) + '} \\approx ' + dn(halfLife(p.k), 2) + '$ minutes.', '']);
      return L;
    }
    return [];
  }

  /* ================================================ Test yourself */
  var SK = ['1.E', '1.D', '3.D', '2.B', '3.B', '3.E', '3.F', '4.E'];
  function stepNum(key, label, cell, o){ o = o || {}; return { key: key, kind: 'num', label: label, cell: cell, d: o.d, hint: o.hint, practice: o.practice || '1.E', level: o.level || 'apply' }; }
  function stepChoice(key, label, options, correct, why, o){ o = o || {}; return { key: key, kind: 'choice', label: label, options: options, correct: correct, why: why, fixed: !!o.fixed, hint: o.hint, practice: o.practice || '3.D', level: o.level || 'analyze' }; }
  function stepExpr(key, label, answer, opts, o){ o = o || {}; return { key: key, kind: 'expr', label: label, lhs: o.lhs, cell: M.exprCell(answer, opts), hint: o.hint, practice: o.practice || '1.E', level: o.level || 'apply' }; }
  function shuffleIn(r, correct, wrong){ // returns { options, correct, order } with the correct one at a random place
    var all = [correct].concat(wrong), idx = all.map(function(_, i){ return i; });
    for(var i = idx.length - 1; i > 0; i--){ var j = Math.floor(r() * (i + 1)), t = idx[i]; idx[i] = idx[j]; idx[j] = t; }
    return { idx: idx, correct: idx.indexOf(0) };
  }
  function exact(cellAns, mistakes){ return M.cell(cellAns, 1e-9, mistakes || [], 1e-6); }
  function three(cellAns, mistakes){ return M.cell(cellAns, 0, mistakes || [], 0.001); }

  /* ---------- slopes: the value of dy/dx at points, where it is 0 */
  function famSlopes(r){
    var k = r.int(0, 2);
    if(k === 0){
      var a = r.nonzero(-3, 3), b = r.nonzero(-3, 3), c = r.int(-2, 2);
      if(Math.abs(a) === Math.abs(b) && c === 0) c = 1;
      return { s: a + '*x + ' + b + '*y + ' + c, tex: poly([[a, 'x'], [b, 'y'], [c, '']]), f: function(x, y){ return a * x + b * y + c; },
        at: function(x, y){ return tn(a) + '\\cdot ' + pn(x) + (b < 0 ? ' - ' : ' + ') + Math.abs(b) + '\\cdot ' + pn(y) + (c ? (c < 0 ? ' - ' : ' + ') + Math.abs(c) : ''); },
        zero: { type: 'line', m: -a / b, q: -c / b }, wrong: [{ type: 'line', m: a / b, q: c / b }, { type: 'xline', m: -a / b, q: -c / b }, { type: 'line', m: -b / a, q: -c / a }, { type: 'line', m: 0, q: 0 }, { type: 'vline', h: 0 }],
        say: 'the line' };
    }
    if(k === 1){
      var h = r.nonzero(-2, 2), a1 = r.pick([1, 2, -1, -2]);
      return { s: a1 + '*(x - ' + h + ')*y', tex: (a1 === 1 ? '' : a1 === -1 ? '-' : a1) + '(x ' + (h < 0 ? '+ ' + (-h) : '- ' + h) + ')y', f: function(x, y){ return a1 * (x - h) * y; },
        at: function(x, y){ return (a1 === 1 ? '' : a1 === -1 ? '-' : a1 + '\\cdot ') + '(' + tn(x) + (h < 0 ? ' + ' + (-h) : ' - ' + h) + ')\\cdot ' + pn(y); },
        zero: { type: 'cross', h: h }, wrong: [{ type: 'cross', h: -h }, { type: 'hcross', h: h }, { type: 'line', m: 0, q: h }, { type: 'vline', h: -h }], say: 'the lines' };
    }
    var a2 = r.pick([1, 2, -1, 0.5]);
    return { s: 'y - ' + a2 + '*x^2', tex: 'y ' + (a2 < 0 ? '+ ' : '- ') + (Math.abs(a2) === 1 ? '' : tn(Math.abs(a2))) + 'x^2', f: function(x, y){ return y - a2 * x * x; },
      at: function(x, y){ return pn(y) + (a2 < 0 ? ' + ' : ' - ') + (Math.abs(a2) === 1 ? '' : tn(Math.abs(a2)) + '\\cdot ') + pn(x) + '^2'; },
      zero: { type: 'parab', a: a2 }, wrong: [{ type: 'parab', a: -a2 }, { type: 'xparab', a: a2 }, { type: 'line', m: a2, q: 0 }], say: 'the parabola' };
  }
  function zText(z){
    if(z.type === 'line') return z.m === 0 ? 'Along the line $y = ' + tn(z.q) + '$' : 'Along the line $y = ' + poly([[z.m, 'x'], [z.q, '']]) + '$';
    if(z.type === 'xline') return 'Along the line $x = ' + poly([[z.m, 'y'], [z.q, '']]) + '$';
    if(z.type === 'vline') return 'Only along the line $x = ' + tn(z.h) + '$';
    if(z.type === 'cross') return 'Along the line $x = ' + tn(z.h) + '$ and along the $x$-axis';
    if(z.type === 'hcross') return 'Along the line $y = ' + tn(z.h) + '$ and along the $y$-axis';
    if(z.type === 'parab') return 'Along the parabola $y = ' + poly([[z.a, 'x^2']]) + '$';
    return 'Along the parabola $x = ' + poly([[z.a, 'y^2']]) + '$';
  }
  /* Is f zero along the set z (sampled), and nowhere off it on a test grid? */
  function zerosOn(f, z){ return zPoints(z).every(function(p){ return Math.abs(f(p[0], p[1])) < 1e-9; }); }
  function zPoints(z){
    var pts = [];
    for(var t = -2.5; t <= 2.51; t += 0.5){
      if(z.type === 'line') pts.push([t, z.m * t + z.q]);
      else if(z.type === 'xline') pts.push([z.m * t + z.q, t]);
      else if(z.type === 'vline') pts.push([z.h, t]);
      else if(z.type === 'cross'){ pts.push([z.h, t]); pts.push([t, 0]); }
      else if(z.type === 'hcross'){ pts.push([t, z.h]); pts.push([0, t]); }
      else if(z.type === 'parab') pts.push([t, z.a * t * t]);
      else pts.push([z.a * t * t, t]);
    }
    return pts;
  }
  /* A point of the set z where f is not 0: the proof an option is wrong. */
  function zWitness(f, z){
    var ps = zPoints(z).filter(function(p){ return isFinite(f(p[0], p[1])) && Math.abs(f(p[0], p[1])) > 1e-9; });
    var ints = ps.filter(function(p){ return Math.abs(p[0] - Math.round(p[0])) < 1e-9 && Math.abs(p[1] - Math.round(p[1])) < 1e-9; });
    return (ints.length ? ints : ps)[0] || null;
  }
  function zSame(a, b){ return JSON.stringify(a) === JSON.stringify(b); }
  function genSlopes(r, ctx){
    var F = famSlopes(r), pts = [], guard = 0;
    while(pts.length < 2 && guard++ < 200){
      var x = r.int(-2, 2), y = r.int(-2, 2);
      if(pts.some(function(p){ return p[0] === x && p[1] === y; })) continue;
      var m = F.f(x, y);
      if(!isFinite(m) || (pts.length && m === F.f(pts[0][0], pts[0][1]))) continue;
      if(m === 0 && pts.length === 0) continue;
      pts.push([x, y]);
    }
    var dy = '$\\frac{dy}{dx} = ' + F.tex + '$';
    var stepsOut = pts.map(function(p, i){
      var m = F.f(p[0], p[1]), sw = F.f(p[1], p[0]), ms = [];
      if(sw !== m && sw !== -m) ms.push({ value: sw, why: 'You swapped the coordinates. At $(' + tp(p[0]) + ', ' + tp(p[1]) + ')$, $x = ' + tn(p[0]) + '$ and $y = ' + tn(p[1]) + '$.' });
      return stepNum('sl' + (i + 1), H('The slope of the segment at ' + 'ABCD'.charAt(i) + ' $= (' + tp(p[0]) + ', ' + tp(p[1]) + ')$'), exact(m, ms),
        { hint: H('Substitute both coordinates into ' + dy + '.'), practice: '1.E', level: 'apply' });
    });
    // Where are the segments horizontal?
    var wrong = F.wrong.filter(function(z){ return !zSame(z, F.zero) && zWitness(F.f, z); });
    var seen = [JSON.stringify(F.zero)];
    wrong = wrong.filter(function(z){ var k = JSON.stringify(z); if(seen.indexOf(k) > -1) return false; seen.push(k); return true; }).slice(0, 3);
    var sh = shuffleIn(r, F.zero, wrong), all = [F.zero].concat(wrong);
    var opts = sh.idx.map(function(i){ return H(zText(all[i])); });
    var why = sh.idx.map(function(i){
      if(i === 0) return H('Right: $' + F.tex + ' = 0$ exactly there, so every segment on ' + F.say + ' is flat.');
      var w = zWitness(F.f, all[i]);
      return H('Not there. Test a point of it: at $(' + tp(+w[0].toFixed(3)) + ', ' + tp(+w[1].toFixed(3)) + ')$, $\\frac{dy}{dx} = ' + tn(+F.f(w[0], w[1]).toFixed(3)) + ' \\ne 0$. Set $' + F.tex + ' = 0$ and solve.');
    });
    stepsOut.push(stepChoice('iso', H('Where are the segments horizontal?'), opts, sh.correct, why, { practice: '1.D', level: 'analyze', hint: H('A horizontal segment has slope 0: set ' + dy + ' equal to 0.') }));
    var sol = pts.map(function(p, i){ return H('At ' + 'ABCD'.charAt(i) + ': $\\frac{dy}{dx} = ' + F.at(p[0], p[1]) + ' = ' + tn(F.f(p[0], p[1])) + '$.'); });
    sol.push(H('Horizontal segments: solve $' + F.tex + ' = 0$. ' + zText(F.zero) + '.'));
    return { ctx: ctx.id, topic: ctx.topic, type: 'slopes', de: F.s,
      text: H('<p>The differential equation is ' + dy + '. Its slope field is drawn with the points marked.</p>'),
      steps: stepsOut, solution: sol,
      fig: { kind: 'field', de: F.s, view: { x: [-3, 3], y: [-3, 3] }, marks: pts.map(function(p, i){ return { at: p, label: 'ABCD'.charAt(i), step: 'sl' + (i + 1) }; }), zero: F.zero } };
  }

  /* ---------- match: which field belongs to the equation */
  function onlyX(f){ for(var x = -2; x <= 2; x++) for(var y = -2; y <= 2; y++) if(isFinite(f(x, y)) && Math.abs(f(x, y) - f(x, 1.5)) > 1e-9) return false; return true; }
  function onlyY(f){ for(var x = -2; x <= 2; x++) for(var y = -2; y <= 2; y++) if(isFinite(f(x, y)) && Math.abs(f(x, y) - f(1.5, y)) > 1e-9) return false; return true; }
  function zeroAlong(f, g){ for(var t = -2; t <= 2; t += 0.5){ var p = g(t); if(!(Math.abs(f(p[0], p[1])) < 1e-9)) return false; } return true; }
  var MATCH = [
    { s: 'x', tex: 'x', f: function(x){ return x; }, feature: 'Slopes depend only on $x$, negative left of the $y$-axis and positive right of it',
      holds: function(f){ return onlyX(f) && f(-1, 0.5) < 0 && f(1, 0.5) > 0; } },
    { s: 'x^2', tex: 'x^2', f: function(x){ return x * x; }, feature: 'Slopes depend only on $x$ and are never negative',
      holds: function(f){ return onlyX(f) && f(-1, 0.5) > 0 && f(1, 0.5) > 0; } },
    { s: 'y', tex: 'y', f: function(x, y){ return y; }, feature: 'Slopes depend only on $y$, negative below the $x$-axis and positive above it',
      holds: function(f){ return onlyY(f) && f(0.5, -1) < 0 && f(0.5, 1) > 0; } },
    { s: '-y', tex: '-y', f: function(x, y){ return -y; }, feature: 'Slopes depend only on $y$, positive below the $x$-axis and negative above it',
      holds: function(f){ return onlyY(f) && f(0.5, -1) > 0 && f(0.5, 1) < 0; } },
    { s: 'x + y', tex: 'x + y', f: function(x, y){ return x + y; }, feature: 'Slopes are 0 along the line $y = -x$ and positive above it',
      holds: function(f){ return zeroAlong(f, function(t){ return [t, -t]; }) && f(1, 1) > 0; } },
    { s: 'x - y', tex: 'x - y', f: function(x, y){ return x - y; }, feature: 'Slopes are 0 along the line $y = x$ and negative above it',
      holds: function(f){ return zeroAlong(f, function(t){ return [t, t]; }) && f(-1, 1) < 0; } },
    { s: 'x*y', tex: 'xy', f: function(x, y){ return x * y; }, feature: 'Slopes are 0 along both axes and positive in the first quadrant',
      holds: function(f){ return zeroAlong(f, function(t){ return [t, 0]; }) && zeroAlong(f, function(t){ return [0, t]; }) && f(1, 1) > 0; } },
    { s: '-x*y', tex: '-xy', f: function(x, y){ return -x * y; }, feature: 'Slopes are 0 along both axes and negative in the first quadrant',
      holds: function(f){ return zeroAlong(f, function(t){ return [t, 0]; }) && zeroAlong(f, function(t){ return [0, t]; }) && f(1, 1) < 0; } },
    { s: 'x/y', tex: '\\frac{x}{y}', f: function(x, y){ return x / y; }, feature: 'Slopes are 0 on the $y$-axis, vertical on the $x$-axis, and positive in the first quadrant',
      holds: function(f){ return zeroAlong(f, function(t){ return [0, t || 1]; }) && !isFinite(f(1, 0)) && f(1, 1) > 0; } },
    { s: '-x/y', tex: '-\\frac{x}{y}', f: function(x, y){ return -x / y; }, feature: 'Slopes are 0 on the $y$-axis, vertical on the $x$-axis, and negative in the first quadrant',
      holds: function(f){ return zeroAlong(f, function(t){ return [0, t || 1]; }) && !isFinite(f(1, 0)) && f(1, 1) < 0; } }
  ];
  function genMatch(r, ctx){
    var target = r.pick(MATCH), pool = MATCH.filter(function(d){ return d !== target && !target.holds(d.f) && !d.holds(target.f); });
    var picks = [];
    while(picks.length < 3 && pool.length){ var i = r.int(0, pool.length - 1); picks.push(pool[i]); pool.splice(i, 1); }
    var sh = shuffleIn(r, target, picks), all = [target].concat(picks), cands = sh.idx.map(function(i){ return all[i]; });
    var dy = '$\\frac{dy}{dx} = ' + target.tex + '$';
    var opts = cands.map(function(d, i){ return 'Field ' + (i + 1); });
    var why = cands.map(function(d, i){ return H('Field ' + (i + 1) + ' is the field of $\\frac{dy}{dx} = ' + d.tex + '$: ' + d.feature.charAt(0).toLowerCase() + d.feature.slice(1) + '.'); });
    var sh2 = shuffleIn(r, target, picks), feats = sh2.idx.map(function(i){ return all[i]; });
    var why2 = feats.map(function(d){
      return d === target ? H('Right: for ' + dy + ' this is true, and it is false for the other three fields, so it settles the match.')
        : H('That is true of $\\frac{dy}{dx} = ' + d.tex + '$, not of ' + dy + '. Test it: substitute a point into ' + dy + '.');
    });
    return { ctx: ctx.id, topic: ctx.topic, type: 'match', de: target.s,
      text: H('<p>Which slope field belongs to ' + dy + '?</p>'),
      steps: [
        stepChoice('mf', H('The field of ' + dy), opts, sh.correct, why, { fixed: true, practice: '2.B', level: 'analyze', hint: H('Test a few points: where is ' + dy + ' zero, positive, negative, or vertical?') }),
        stepChoice('mfeat', H('Which feature of the field settles it?'), feats.map(function(d){ return H(d.feature); }), sh2.correct, why2, { practice: '2.B', level: 'analyze' })
      ],
      solution: [H('For ' + dy + ': ' + target.feature.charAt(0).toLowerCase() + target.feature.slice(1) + '.'),
        H('Field ' + (sh.correct + 1) + ' is the only one with that pattern.')].concat(cands.map(function(d, i){ return i === sh.correct ? null : H('Field ' + (i + 1) + ' is $\\frac{dy}{dx} = ' + d.tex + '$.'); }).filter(Boolean)),
      fig: { kind: 'match', des: cands.map(function(d){ return d.s; }), view: { x: [-3, 3], y: [-3, 3] }, answer: sh.correct } };
  }

  /* ---------- sketch: the solution through a point, graded point by point */
  function famSketch(r){
    var k = r.int(0, 4);
    if(k === 0){ var c = r.int(-1, 1); return { s: 'y - ' + c, tex: 'y' + (c ? (c < 0 ? ' + ' + (-c) : ' - ' + c) : ''), f: function(x, y){ return y - c; }, eq: [c],
      ex: function(x0, y0){ return function(x){ return c + (y0 - c) * Math.exp(x - x0); }; }, far: function(x0, y0){ return y0 > c ? 'up' : 'down'; } }; }
    if(k === 1){ var c2 = r.int(-1, 1); return { s: c2 + ' - y', tex: (c2 ? c2 : '') + ' - y', f: function(x, y){ return c2 - y; }, eq: [c2],
      ex: function(x0, y0){ return function(x){ return c2 + (y0 - c2) * Math.exp(-(x - x0)); }; }, far: function(){ return 'eq:' + c2; } }; }
    if(k === 2) return { s: 'x - y', tex: 'x - y', f: function(x, y){ return x - y; }, eq: [],
      ex: function(x0, y0){ var C = (y0 - x0 + 1) * Math.exp(x0); return function(x){ return x - 1 + C * Math.exp(-x); }; }, far: function(){ return 'line'; } };
    if(k === 3) return { s: 'x + y', tex: 'x + y', f: function(x, y){ return x + y; }, eq: [],
      ex: function(x0, y0){ var C = (y0 + x0 + 1) * Math.exp(-x0); return function(x){ return C * Math.exp(x) - x - 1; }; },
      far: function(x0, y0){ var C = (y0 + x0 + 1); return C > 0 ? 'up' : C < 0 ? 'down' : 'line2'; } };
    var a = r.pick([-1, 1, 0.5, -0.5]);
    return { s: a + '*x*y', tex: (a === 1 ? '' : a === -1 ? '-' : tn(a)) + 'xy', f: function(x, y){ return a * x * y; }, eq: [0],
      ex: function(x0, y0){ return function(x){ return y0 * Math.exp(a * (x * x - x0 * x0) / 2); }; }, far: function(x0, y0){ return a < 0 ? 'eq:0' : y0 > 0 ? 'up' : 'down'; } };
  }
  var FAR = { up: 'It increases without bound', down: 'It decreases without bound', line: 'It approaches the line $y = x - 1$', line2: 'It stays on the line $y = -x - 1$' };
  function farText(k){ return k.indexOf('eq:') === 0 ? 'It approaches the equilibrium $y = ' + k.slice(3) + '$' : FAR[k]; }
  function sketchTol(t, y0){ return 0.4 + 0.15 * Math.abs(t - y0); }
  /* The grade of a sketch: ys are the student's heights at fig.xs. */
  function sketchGrade(fig, ys){
    var x0 = fig.x0, y0 = fig.y0, n = fig.xs.length, i;
    // Crossing an equilibrium line: the truth never does.
    for(var e = 0; e < fig.eq.length; e++){
      var side = sgn(y0 - fig.eq[e]);
      for(i = 0; i < n; i++) if(sgn(ys[i] - fig.eq[e]) === -side && Math.abs(ys[i] - fig.eq[e]) > 0.15) return 2;
    }
    // Leaving the point the wrong way (nearest handle each side).
    var right = -1, left = -1;
    for(i = 0; i < n; i++){ if(fig.xs[i] > x0 && right < 0) right = i; if(fig.xs[i] < x0) left = i; }
    var bad = [right, left].some(function(j){
      if(j < 0) return false;
      var t = fig.truth[j], d = t - y0;
      return Math.abs(d) > fig.tol[j] && sgn(ys[j] - y0) === -sgn(d) && Math.abs(ys[j] - y0) > 0.1;
    });
    if(bad) return 1;
    for(i = 0; i < n; i++) if(Math.abs(ys[i] - fig.truth[i]) > fig.tol[i]) return 3;
    return 0;
  }
  function genSketch(r, ctx){
    for(var guard = 0; guard < 200; guard++){
      var F = famSketch(r), x0 = r.int(-2, 0), y0 = r.int(-2, 2);
      if(F.eq.indexOf(y0) > -1 || F.f(x0, y0) === 0) continue;
      var ex = F.ex(x0, y0), xs = [], truth = [], tol = [];
      for(var x = -3; x <= 3; x++){
        if(x === x0) continue;
        var t = ex(x);
        if(!isFinite(t) || t < -2.9 || t > 2.9) continue;
        xs.push(x); truth.push(t); tol.push(sketchTol(t, y0));
      }
      if(xs.length < 3 || xs.filter(function(v){ return v > x0; }).length < 2) continue;
      var fig = { kind: 'sketch', de: F.s, view: { x: [-3, 3], y: [-3, 3] }, x0: x0, y0: y0, xs: xs, truth: truth, tol: tol, eq: F.eq };
      if(sketchGrade(fig, xs.map(function(){ return y0; })) === 0) continue;
      var m0 = F.f(x0, y0), dy = '$\\frac{dy}{dx} = ' + F.tex + '$', P = '$(' + tp(x0) + ', ' + tp(y0) + ')$';
      var opts = ['Your curve follows the slope segments', 'Your curve leaves the point in the wrong direction', 'Your curve crosses an equilibrium solution', 'Your curve drifts away from the segments'];
      var why = [
        H('Right: from ' + P + ' it starts with slope ' + tn(m0) + ' and bends with the segments' + (F.eq.length ? ', never crossing the equilibrium $y = ' + tn(F.eq[0]) + '$' : '') + '.'),
        H('At ' + P + ' the slope is ' + tn(m0) + ', so the solution ' + (m0 > 0 ? 'rises' : 'falls') + ' as $x$ increases' + ' from the point. Start along that segment.'),
        F.eq.length ? H('The line $y = ' + tn(F.eq[0]) + '$ is a solution (its segments are flat). Two solution curves never cross, so yours must stay on the ' + (y0 > F.eq[0] ? 'upper' : 'lower') + ' side.') : H('A solution never crosses another solution curve.'),
        H('Follow each segment from one to the next: the curve is tangent to the segments everywhere, across the whole field, not only near ' + P + '.')
      ];
      var farK = F.far(x0, y0), farAll = ['up', 'down', 'eq:' + (F.eq.length ? F.eq[0] : 0), 'line'].filter(function(k, i, a){ return a.indexOf(k) === i; });
      if(farAll.indexOf(farK) < 0) farAll[3] = farK;
      var sh = shuffleIn(r, farK, farAll.filter(function(k){ return k !== farK; }).slice(0, 3)), farOpts = [farK].concat(farAll.filter(function(k){ return k !== farK; }).slice(0, 3));
      var steps = [
        stepNum('skm', H('The slope at the starting point ' + P), exact(m0, []), { practice: '1.E', level: 'apply', hint: H('Substitute into ' + dy + '.') }),
        { key: 'sk', kind: 'choice', label: H('Drag the points on the field so the curve through ' + P + ' follows the segments, then Check.'),
          options: opts.map(function(o){ return '<span class="sf-sk-opt">' + o + '</span>'; }), correct: 0, why: why, fixed: true, sketch: true, practice: '3.D', level: 'analyze' },
        stepChoice('skfar', H('As $x$ increases, what happens to this solution?'), sh.idx.map(function(i){ return H(farText(farOpts[i])); }), sh.correct,
          sh.idx.map(function(i){ return farOpts[i] === farK ? H('Right: follow the segments to the right edge and beyond.') : H('Follow the segments to the right from your curve: they lead somewhere else.'); }), { practice: '3.D', level: 'analyze' })
      ];
      return { ctx: ctx.id, topic: ctx.topic, type: 'sketch', de: F.s,
        text: H('<p>The slope field of ' + dy + ' is shown. Sketch the solution curve through ' + P + '.</p>'),
        steps: steps,
        solution: [H('At ' + P + ', $\\frac{dy}{dx} = ' + tn(m0) + '$: the curve leaves the point ' + (m0 > 0 ? 'rising' : 'falling') + '.'),
          H('It stays tangent to the segments everywhere' + (F.eq.length ? ' and never crosses $y = ' + tn(F.eq[0]) + '$, itself a solution' : '') + '.'),
          H('Heights of the true solution: ' + xs.map(function(x, i){ return '$y(' + tp(x) + ') \\approx ' + dn(truth[i], 2) + '$'; }).join(', ') + '.'),
          H(farText(farK) + '.')],
        fig: fig };
    }
    throw new Error('genSketch: no problem found');
  }

  /* ---------- separate: separation of variables with an initial condition */
  function famSep(r){
    var k = r.int(0, 4), y0 = r.pick([-4, -3, -2, 2, 3, 4]);
    if(k === 0){
      var a = r.pick([2, 4, 6, -2]), h = a / 2;
      return { chk: { de: a + '*x*y', L: 'ln(abs(y))', R: h + '*x^2', integrand: a + '*x' }, tex: tn(a) + 'xy', y0: y0, sepOk: '\\frac{1}{y}\\,dy = ' + tn(a) + 'x\\,dx',
        sepBad: [['y\\,dy = ' + tn(a) + 'x\\,dx', 'The $y$ factor went the wrong way. Dividing both sides by it puts it under $dy$; multiplying leaves it where it was.'], ['\\frac{1}{y}\\,dy = \\frac{' + tn(a) + '}{x}\\,dx', 'Only the $y$ factor moves. The $x$ part stays as it is on the $dx$ side.'], ['dy = ' + tn(a) + 'xy\\,dx \\text{, then integrate with } y \\text{ held constant}', 'Not separated: $y$ depends on $x$, so it cannot be held constant while you integrate with respect to $x$.']],
        rhs: { lhs: '\\int ' + tn(a) + 'x\\,dx =', ans: h + '*x^2', mis: [{ expr: a + '*x^2', why: 'Divide by the new power: the antiderivative of ' + a + 'x is ' + (h === 1 ? '' : h) + 'x^2, plus C.' }] },
        left: '\\ln|y|', right: tn(h) + 'x^2', Cval: Math.log(Math.abs(y0)), Ctex: '\\ln ' + Math.abs(y0),
        Cmis: [{ value: y0, why: 'C sits inside the logarithm equation: substitute y = ' + y0 + ' into ln|y| = ' + h + 'x^2 + C, so C = ln ' + Math.abs(y0) + '.' }],
        y: y0 + '*e^(' + h + '*x^2)', yTex: tn(y0) + 'e^{' + tn(h) + 'x^2}', dom: [-1.2, 1.2],
        late: 'e^(' + h + '*x^2) + ' + (y0 - 1), forgot: 'e^(' + h + '*x^2)', abs: y0 < 0 ? (-y0) + '*e^(' + h + '*x^2)' : null };
    }
    if(k === 1){
      var c = r.pick([1, 2, -1, -2, 3]), b = r.int(-3, 4), yb = b + r.pick([-3, -2, 2, 3]);
      return { chk: { de: c + '*(y - ' + b + ')', L: 'ln(abs(y - ' + b + '))', R: c + '*x', integrand: '1/(y - ' + b + ')' }, tex: (c === 1 ? '' : c === -1 ? '-' : c) + '(y ' + (b < 0 ? '+ ' + (-b) : '- ' + b) + ')', y0: yb, b: b, vy: true,
        sepOk: '\\frac{1}{y ' + (b < 0 ? '+ ' + (-b) : '- ' + b) + '}\\,dy = ' + (c === 1 ? '' : c === -1 ? '-' : c) + '\\,dx',
        sepBad: [['(y ' + (b < 0 ? '+ ' + (-b) : '- ' + b) + ')\\,dy = ' + (c === 1 ? '' : c === -1 ? '-' : c) + '\\,dx', 'The $y$ factor went the wrong way. Dividing both sides by it puts it under $dy$; multiplying leaves it where it was.'], ['dy = ' + (c === 1 ? '' : c === -1 ? '-' : c) + '(y ' + (b < 0 ? '+ ' + (-b) : '- ' + b) + ')\\,dx \\text{, then integrate with } y \\text{ held constant}', 'Not separated: $y$ depends on $x$, so it cannot be held constant while you integrate with respect to $x$.'], ['\\frac{1}{y}\\,dy = ' + (c === 1 ? '' : c === -1 ? '-' : c) + 'x\\,dx', 'Two slips: the whole factor $y ' + (b < 0 ? '+ ' + (-b) : '- ' + b) + '$ moves (not just $y$), and no $x$ appears on the right, so it stays a constant times $dx$.']],
        rhs: { lhs: '\\int \\frac{1}{y ' + (b < 0 ? '+ ' + (-b) : '- ' + b) + '}\\,dy =', ans: 'ln(abs(y - ' + b + '))', vars: ['y'], dom: [b - 4, b + 4],
          mis: [{ expr: 'ln(y - ' + b + ')', why: 'Keep the absolute value: the antiderivative of 1/u is ln|u|, defined on both sides of u = 0.' }, { expr: '-1/(y - ' + b + ')^2', why: 'That is the derivative of 1/(y - ' + b + '), not its antiderivative. The antiderivative of 1/u is ln|u|.' }] },
        left: '\\ln|y ' + (b < 0 ? '+ ' + (-b) : '- ' + b) + '|', right: (c === 1 ? '' : c === -1 ? '-' : c) + 'x', Cval: Math.log(Math.abs(yb - b)), Ctex: '\\ln ' + Math.abs(yb - b),
        Cmis: [{ value: yb, why: 'Substitute into the logarithm equation: ln|' + yb + ' - ' + b + '| = 0 + C.' }, { value: yb - b, why: 'C is the logarithm: ln|' + (yb - b) + '| = C.' }],
        y: b + ' + ' + (yb - b) + '*e^(' + c + '*x)', yTex: tn(b) + (yb - b < 0 ? ' - ' : ' + ') + Math.abs(yb - b) + 'e^{' + (c === 1 ? '' : c === -1 ? '-' : c) + 'x}', dom: [-1, 1],
        late: b + ' + e^(' + c + '*x) + ' + (yb - b - 1), forgot: b + ' + e^(' + c + '*x)', abs: yb < b ? b + ' + ' + Math.abs(yb - b) + '*e^(' + c + '*x)' : null };
    }
    if(k === 2){
      var a3 = r.pick([1, 2, 3, 4]), y3 = r.pick([-3, -2, 2, 3]);
      return { chk: { de: a3 + '*x/y', L: 'y^2/2', R: (a3 / 2) + '*x^2', integrand: a3 + '*x' }, tex: '\\frac{' + (a3 === 1 ? '' : a3) + 'x}{y}', y0: y3, sq: true, sepOk: 'y\\,dy = ' + (a3 === 1 ? '' : a3) + 'x\\,dx',
        sepBad: [['\\frac{1}{y}\\,dy = ' + (a3 === 1 ? '' : a3) + 'x\\,dx', 'The $y$ is in a denominator, so multiplying both sides by $y$ brings it to the top beside $dy$: $y\\,dy$.'], ['dy = ' + (a3 === 1 ? '' : a3) + 'xy\\,dx', 'The $y$ is divided, not multiplied, and it has to leave the $dx$ side.'], ['y\\,dx = ' + (a3 === 1 ? '' : a3) + 'x\\,dy', '$dx$ and $dy$ swapped sides. From $\\frac{dy}{dx}$, $dy$ stays with the $y$ terms and $dx$ with the $x$ terms.']],
        rhs: { lhs: '\\int ' + (a3 === 1 ? '' : a3) + 'x\\,dx =', ans: (a3 / 2) + '*x^2', mis: [{ expr: a3 + '*x^2', why: 'Divide by the new power: the antiderivative of ' + a3 + 'x is (' + a3 + '/2)x^2, plus C.' }] },
        left: '\\frac{y^2}{2}', right: tn(a3 / 2) + 'x^2', Cval: y3 * y3 / 2, Ctex: tn(y3 * y3 / 2),
        Cmis: [{ value: y3, why: 'Substitute into y^2/2: C = (' + y3 + ')^2 / 2.' }, { value: y3 * y3, why: 'Keep the 1/2: C = (' + y3 + ')^2 / 2.' }],
        y: (y3 < 0 ? '-' : '') + 'sqrt(' + a3 + '*x^2 + ' + (y3 * y3) + ')', yTex: (y3 < 0 ? '-' : '') + '\\sqrt{' + (a3 === 1 ? '' : a3) + 'x^2 + ' + (y3 * y3) + '}', dom: [-2, 2],
        late: 'sqrt(' + a3 + '*x^2) + ' + y3, forgot: (y3 < 0 ? '-' : '') + 'sqrt(' + a3 + '*x^2)', abs: y3 < 0 ? 'sqrt(' + a3 + '*x^2 + ' + (y3 * y3) + ')' : null };
    }
    if(k === 3){
      var a4 = r.pick([1, 2, 3]), y4 = r.pick([-2, -1, 1, 2]);
      return { chk: { de: a4 + '*x^2/y^2', L: 'y^3/3', R: (a4 / 3) + '*x^3', integrand: a4 + '*x^2' }, tex: '\\frac{' + (a4 === 1 ? '' : a4) + 'x^2}{y^2}', y0: y4, sepOk: 'y^2\\,dy = ' + (a4 === 1 ? '' : a4) + 'x^2\\,dx',
        sepBad: [['\\frac{1}{y^2}\\,dy = ' + (a4 === 1 ? '' : a4) + 'x^2\\,dx', 'The $y^2$ is in a denominator, so multiplying both sides by $y^2$ brings it to the top beside $dy$: $y^2\\,dy$.'], ['dy = \\frac{' + (a4 === 1 ? '' : a4) + 'x^2}{y^2}\\,dx \\text{, then integrate with } y \\text{ held constant}', 'Not separated: $y$ depends on $x$, so it cannot be held constant while you integrate with respect to $x$.'], ['y^2\\,dx = ' + (a4 === 1 ? '' : a4) + 'x^2\\,dy', '$dx$ and $dy$ swapped sides. From $\\frac{dy}{dx}$, $dy$ stays with the $y$ terms and $dx$ with the $x$ terms.']],
        rhs: { lhs: '\\int ' + (a4 === 1 ? '' : a4) + 'x^2\\,dx =', ans: (a4 / 3) + '*x^3', mis: [{ expr: (2 * a4) + '*x', why: 'That is the derivative. Integrate: raise the power by 1 and divide by it, (' + a4 + '/3)x^3 + C.' }] },
        left: '\\frac{y^3}{3}', right: tn(a4 / 3) + 'x^3', Cval: y4 * y4 * y4 / 3, Ctex: tn(y4 * y4 * y4 / 3),
        Cmis: [{ value: y4 * y4 * y4, why: 'Keep the 1/3: C = (' + y4 + ')^3 / 3.' }, { value: y4, why: 'Substitute into y^3/3: C = (' + y4 + ')^3 / 3.' }],
        y: '(' + a4 + '*x^3 + ' + (y4 * y4 * y4) + ')^(1/3)', yTex: '\\sqrt[3]{' + (a4 === 1 ? '' : a4) + 'x^3 ' + (y4 < 0 ? '- ' + (-y4 * y4 * y4) : '+ ' + (y4 * y4 * y4)) + '}', dom: [-1.5, 1.5],
        late: '(' + a4 + '*x^3)^(1/3) + ' + y4, forgot: '(' + a4 + '*x^3)^(1/3)', abs: null, lostSign: null };
    }
    var y5 = r.pick([-3, -2, 2, 3]);
    return { chk: { de: 'y*cos(x)', L: 'ln(abs(y))', R: 'sin(x)', integrand: 'cos(x)' }, tex: 'y\\cos x', y0: y5, sepOk: '\\frac{1}{y}\\,dy = \\cos x\\,dx',
      sepBad: [['y\\,dy = \\cos x\\,dx', 'The $y$ factor went the wrong way. Dividing both sides by it puts it under $dy$; multiplying leaves it where it was.'], ['\\frac{1}{y}\\,dy = \\frac{1}{\\cos x}\\,dx', 'Only the $y$ factor moves. The $x$ part stays as it is on the $dx$ side.'], ['dy = y\\cos x\\,dx \\text{, then integrate with } y \\text{ held constant}', 'Not separated: $y$ depends on $x$, so it cannot be held constant while you integrate with respect to $x$.']],
      rhs: { lhs: '\\int \\cos x\\,dx =', ans: 'sin(x)', mis: [{ expr: '-sin(x)', why: 'The derivative of sin x is cos x, so the antiderivative of cos x is sin x (no minus).' }] },
      left: '\\ln|y|', right: '\\sin x', Cval: Math.log(Math.abs(y5)), Ctex: '\\ln ' + Math.abs(y5),
      Cmis: [{ value: y5, why: 'Substitute into ln|y| = sin x + C: ln|' + y5 + '| = sin 0 + C, so C = ln ' + Math.abs(y5) + '.' }],
      y: y5 + '*e^(sin(x))', yTex: tn(y5) + 'e^{\\sin x}', dom: [-3, 3],
      late: 'e^(sin(x)) + ' + (y5 - 1), forgot: 'e^(sin(x))', abs: y5 < 0 ? (-y5) + '*e^(sin(x))' : null };
  }
  // "dy = ... \\text{, then integrate with } y \\text{ held constant}" reads as words after the math
  function optTex(t){ return '$' + t.replace(/\s*\\text\{, then integrate with \} y \\text\{ held constant\}/, '$, then integrate with $y$ held constant').replace(/\$$/, '') + (/held constant$/.test(t.replace(/\s*\\text\{, then integrate with \} y \\text\{ held constant\}/, ' held constant')) ? '' : '$'); }
  function genSeparate(r, ctx){
    var F = famSep(r), dy = '$\\frac{dy}{dx} = ' + F.tex + '$', ic = '$y(0) = ' + tp(F.y0) + '$';
    var all = [[F.sepOk, 'Right: every $y$ (with $dy$) on one side, every $x$ (with $dx$) on the other, nothing left over.']].concat(F.sepBad);
    var sh = shuffleIn(r, all[0], F.sepBad);
    var rhsCell = { answer: F.rhs.ans, vars: F.rhs.vars || ['x'], mode: 'constant', domain: F.rhs.dom || [-2, 2], mistakes: F.rhs.mis };
    var miss = [];
    if(F.abs) miss.push({ expr: F.abs, why: F.sq ? 'The square root has two signs. y(0) = ' + F.y0 + ' is negative, so take the negative root.' : 'You lost the absolute value bars: ln|u| = ... gives |u| = e^C e^(...), and the initial condition y(0) = ' + F.y0 + ' sets the sign. Here it is negative.' });
    miss.push({ expr: F.late, why: 'You applied the initial condition too late: the + C has to be there when you integrate, and you use y(0) = ' + F.y0 + ' at once, before solving for y. Adding C after solving gives a different (wrong) function.' });
    miss.push({ expr: F.forgot, why: 'You forgot + C when you integrated, so the solution cannot pass through (0, ' + F.y0 + ').' });
    var Ctxt = '$' + F.left + ' = ' + F.right + ' + C$';
    var steps = [
      stepChoice('sep', H('Separate the variables in ' + dy + '.'), sh.idx.map(function(i){ return H(optTex(all[i][0])); }), sh.correct, sh.idx.map(function(i){ return H(all[i][1]); }), { practice: '1.E', level: 'apply' }),
      { key: 'int', kind: 'expr', label: H(F.rhs.vars ? 'Integrate the left side.' : 'Integrate the right side.'), lhs: F.rhs.lhs, cell: { expr: rhsCell }, hint: H('An indefinite integral: write $+ C$.'), practice: '1.E', level: 'apply' },
      stepNum('sepC', H('So ' + Ctxt + '. Use ' + ic + ' to find $C$.'), M.cell(F.Cval, 1e-9, F.Cmis, 0.001), { d: 3, practice: '1.E', level: 'apply', hint: H('Exact, like ' + (F.Ctex.indexOf('ln') > -1 ? 'ln(3)' : '9/2') + ', or a decimal to three places.') }),
      { key: 'sepY', kind: 'expr', label: H('Solve for $y$: the particular solution with ' + ic + '.'), lhs: 'y =', cell: { expr: { answer: F.y, vars: ['x'], mode: 'exact', domain: F.dom, mistakes: miss } }, practice: '1.E', level: 'apply' }
    ];
    return { ctx: ctx.id, topic: ctx.topic, type: 'separate', de: F.tex,
      text: H('<p>Find the particular solution of ' + dy + ' with ' + ic + '.</p>'),
      steps: steps,
      solution: [H('Separate: $' + F.sepOk + '$.'), H('Integrate both sides: ' + Ctxt + '.'), H('Apply ' + ic + ' at once: $C = ' + F.Ctex + '$.'),
        H('Solve for $y$, with the sign the initial condition gives: $y = ' + F.yTex + '$.')],
      fig: { kind: 'solution', y: F.y, y0: F.y0, dom: F.dom, de: F.chk.de }, chk: { de: F.chk.de, L: F.chk.L, R: F.chk.R, integrand: F.chk.integrand, y0: F.y0 } };
  }

  /* ---------- concavity: d²y/dx² along a solution */
  function famCon(r){
    var k = r.int(0, 3);
    if(k === 0){
      var a = r.nonzero(-3, 3), b = r.nonzero(-2, 2);
      return { s: a + '*x + ' + b + '*y', tex: poly([[a, 'x'], [b, 'y']]), f: function(x, y){ return a * x + b * y; }, f2: function(x, y){ return a + b * (a * x + b * y); },
        ans: a + ' + ' + b + '*(' + a + '*x + ' + b + '*y)', f2tex: tn(a) + ' + ' + pn(b) + '\\frac{dy}{dx} = ' + tn(a) + ' + ' + pn(b) + '(' + poly([[a, 'x'], [b, 'y']]) + ')',
        mis: [{ expr: String(a), why: 'You treated y as a constant. y depends on x, so d/dx of ' + b + 'y is ' + b + ' dy/dx.' }, { expr: (a + b) + '', why: 'You wrote d/dx of y as 1. By the chain rule it is dy/dx, then substitute dy/dx = ' + a + 'x + ' + b + 'y.' }] };
    }
    if(k === 1){
      var a1 = r.pick([1, 2, -1]);
      return { s: a1 + '*x*y', tex: (a1 === 1 ? '' : a1 === -1 ? '-' : a1) + 'xy', f: function(x, y){ return a1 * x * y; }, f2: function(x, y){ return a1 * y + a1 * x * (a1 * x * y); },
        ans: a1 + '*y + ' + a1 + '*x*(' + a1 + '*x*y)', f2tex: tn(a1) + 'y + ' + tn(a1) + 'x\\frac{dy}{dx} = ' + tn(a1) + 'y + ' + tn(a1 * a1) + 'x^2y',
        mis: [{ expr: a1 + '*y', why: 'You treated y as a constant past the first term. Use the product rule: d/dx(xy) = y + x dy/dx.' }, { expr: a1 + '*y + ' + a1 + '*x', why: 'You wrote d/dx of y as 1. It is dy/dx: substitute dy/dx = ' + a1 + 'xy.' }] };
    }
    if(k === 2){
      var c = r.pick([1, 2, 3]);
      return { s: 'x^2 - ' + c + '*y', tex: 'x^2 - ' + (c === 1 ? '' : c) + 'y', f: function(x, y){ return x * x - c * y; }, f2: function(x, y){ return 2 * x - c * (x * x - c * y); },
        ans: '2*x - ' + c + '*(x^2 - ' + c + '*y)', f2tex: '2x - ' + (c === 1 ? '' : c) + '\\frac{dy}{dx} = 2x - ' + (c === 1 ? '' : c) + '(x^2 - ' + (c === 1 ? '' : c) + 'y)',
        mis: [{ expr: '2*x', why: 'You treated y as a constant. d/dx of ' + c + 'y is ' + c + ' dy/dx.' }, { expr: '2*x - ' + c, why: 'You wrote d/dx of y as 1. It is dy/dx: substitute dy/dx = x^2 - ' + c + 'y.' }] };
    }
    var b3 = r.int(-2, 2);
    return { s: '(y - ' + b3 + ')*x', tex: '(y ' + (b3 < 0 ? '+ ' + (-b3) : '- ' + b3) + ')x', f: function(x, y){ return (y - b3) * x; }, f2: function(x, y){ return (y - b3) + x * (y - b3) * x; },
      ans: '(y - ' + b3 + ') + x*(y - ' + b3 + ')*x', f2tex: '(y ' + (b3 < 0 ? '+ ' + (-b3) : '- ' + b3) + ') + x\\frac{dy}{dx} = (y ' + (b3 < 0 ? '+ ' + (-b3) : '- ' + b3) + ')(1 + x^2)',
      mis: [{ expr: 'y - ' + b3, why: 'You treated y as a constant inside the product. Product rule: d/dx[(y - ' + b3 + ')x] = (y - ' + b3 + ') + x dy/dx.' }, { expr: '(y - ' + b3 + ') + x', why: 'You wrote d/dx of y as 1. It is dy/dx: substitute dy/dx = (y - ' + b3 + ')x.' }] };
  }
  function genConcavity(r, ctx){
    for(var g = 0; g < 200; g++){
      var F = famCon(r), x1 = r.int(-2, 2), y1 = r.int(-2, 2);
      var v = F.f2(x1, y1), m = F.f(x1, y1);
      if(!isFinite(v) || v === 0) continue;
      var good = F.mis.every(function(ms){ var fm = M.fn(ms.expr, ['x', 'y']); return Math.abs(fm({ x: x1, y: y1 }) - v) > 1e-9; });
      if(!good) continue;
      var dy = '$\\frac{dy}{dx} = ' + F.tex + '$', P = '$(' + tp(x1) + ', ' + tp(y1) + ')$';
      var up = v > 0, opts = ['Concave up, so the tangent line there gives an underestimate', 'Concave up, so the tangent line there gives an overestimate', 'Concave down, so the tangent line there gives an overestimate', 'Concave down, so the tangent line there gives an underestimate'];
      var right = up ? 0 : 2, sh = shuffleIn(r, right, [0, 1, 2, 3].filter(function(i){ return i !== right; })), ord = [right].concat([0, 1, 2, 3].filter(function(i){ return i !== right; }));
      var whyC = function(i){
        if(i === right) return 'Right: $\\frac{d^2y}{dx^2} = ' + tn(v) + (up ? ' > 0' : ' < 0') + '$, so the curve bends ' + (up ? 'up, above' : 'down, below') + ' its tangent line, and the line ' + (up ? 'under' : 'over') + 'estimates.';
        if((i < 2) !== up) return 'Check the sign: $\\frac{d^2y}{dx^2} = ' + tn(v) + '$ at ' + P + ', so it is concave ' + (up ? 'up' : 'down') + '.';
        return 'The concavity is right, but a curve that is concave ' + (up ? 'up lies above' : 'down lies below') + ' its tangent line, so the line ' + (up ? 'under' : 'over') + 'estimates.';
      };
      return { ctx: ctx.id, topic: ctx.topic, type: 'concavity', de: F.tex,
        text: H('<p>$y = f(x)$ is a solution of ' + dy + ' through the point ' + P + '.</p>'),
        steps: [
          { key: 'd2', kind: 'expr', label: H('Find $\\frac{d^2y}{dx^2}$ in terms of $x$ and $y$.'), lhs: '\\frac{d^2y}{dx^2} =', cell: { expr: { answer: F.ans, vars: ['x', 'y'], mode: 'exact', domain: { x: [-2, 2], y: [-2, 2] }, mistakes: F.mis } },
            hint: H('Differentiate ' + dy + ' with respect to $x$. $y$ is a function of $x$: each $y$ gives a $\\frac{dy}{dx}$, then substitute.'), practice: '1.E', level: 'apply' },
          stepNum('d2v', H('Its value at ' + P), exact(v, [{ value: F.f(x1, y1), why: 'That is dy/dx at the point, the first derivative. Evaluate the second derivative.' }]), { practice: '1.E', level: 'apply' }),
          stepChoice('conc', H('So near ' + P + ', the solution is'), sh.idx.map(function(i){ return opts[ord[i]]; }), sh.correct, sh.idx.map(function(i){ return H(whyC(ord[i])); }), { practice: '3.D', level: 'analyze' })
        ],
        solution: [H('Differentiate both sides: $\\frac{d^2y}{dx^2} = ' + F.f2tex + '$.'), H('At ' + P + ': $\\frac{dy}{dx} = ' + tn(m) + '$ and $\\frac{d^2y}{dx^2} = ' + tn(v) + '$.'),
          H((up ? 'Positive, so concave up: the tangent line lies below the curve and underestimates.' : 'Negative, so concave down: the tangent line lies above the curve and overestimates.'))],
        fig: { kind: 'field', de: F.s, view: { x: [-3, 3], y: [-3, 3] }, marks: [{ at: [x1, y1], label: 'P' }], tangent: { at: [x1, y1], m: m }, d2: v } };
    }
    throw new Error('genConcavity: no problem found');
  }

  /* ---------- exp: dy/dt = ky in context (calculator, three decimals) */
  function genExp(r, ctx){
    var grow = ctx.trend !== 'decay', y0 = r.pick(ctx.y0 || [100, 200, 500]), T = r.pick(ctx.T || [2, 3, 4, 5]);
    var k = (grow ? 1 : -1) * LN2 / T, t1 = r.pick(ctx.t1 || [1, 6, 7, 10]), u = ctx.unit || 'hours', q = ctx.amount || 'the amount';
    var target = grow ? y0 * r.pick([3, 5, 10]) : y0 * r.pick([0.2, 0.1, 0.3]);
    var y1 = y0 * Math.exp(k * t1), tT = Math.log(target / y0) / k;
    var kr = Math.round(k * 100) / 100, yR = y0 * Math.exp(kr * t1);
    var de = 'The rate at which it changes is proportional to ' + q + '.';
    var opts = ['$\\frac{dy}{dt} = ky$', '$\\frac{dy}{dt} = k$', '$\\frac{dy}{dt} = kt$', '$y = kt$'];
    var why = ['Right: "proportional to the amount" means the rate is a constant times $y$.', 'That is a constant rate: linear change, not proportional to the amount.', 'That rate grows with time, not with the amount.', 'That is not a differential equation, and it is linear.'];
    var sh = shuffleIn(r, 0, [1, 2, 3]);
    var kMis = [{ value: (grow ? 1 : -1) * 2 / T, why: 'From e^(kT) = ' + (grow ? '2' : '1/2') + ', take the natural log: kT = ' + (grow ? 'ln 2' : '-ln 2') + ', so k = ' + (grow ? '' : '-') + 'ln 2 / ' + T + '.' },
      { value: (grow ? 1 : -1) * LN2 * T, why: 'Divide by the time: k = ' + (grow ? '' : '-') + 'ln 2 / ' + T + ', not ln 2 times ' + T + '.' },
      { value: (grow ? 1 : -1) / T, why: 'Use the ratio ' + (grow ? '2' : '1/2') + ': e^(k·' + T + ') = ' + (grow ? '2' : '1/2') + ' gives k = ' + (grow ? '' : '-') + 'ln 2 / ' + T + '.' }];
    var yMis = [{ value: y0 + k * t1, why: 'That is linear growth. The solution of dy/dt = ky is y = y0 e^(kt).' }, { value: y0 * Math.exp(-k * t1), why: 'Sign: ' + (grow ? 'growth has k > 0' : 'decay has k < 0') + '.' }];
    if(Math.abs(yR - y1) > 0.0015) yMis.push({ value: yR, why: 'You rounded k too early. Store k at full precision and round only the final answer.' });
    var tMis = [{ value: Math.log(y0 / target) / k, why: 'The ratio is upside down: e^(kt) = ' + M.fmt(target, 4) + '/' + y0 + '.' }, { value: (target - y0) / (k * y0), why: 'That assumes the rate stays at k·y0. The rate changes as y changes: solve y0 e^(kt) = ' + M.fmt(target, 4) + '.' }];
    var story = grow ? (ctx.story || 'A colony of bacteria') + ' starts with ' + y0 + ' ' + (ctx.noun || '') + ' and doubles every ' + T + ' ' + u + '.' : (ctx.story || 'A radioactive sample') + ' starts at ' + y0 + ' ' + (ctx.noun || '') + ' and has a half-life of ' + T + ' ' + u + '.';
    return { ctx: ctx.id, topic: ctx.topic, type: 'exp', de: 'ky',
      text: H('<p>' + story + ' ' + de + ' Let $y$ be ' + q + ' after $t$ ' + u + '.</p>'),
      steps: [
        stepChoice('expde', H('The differential equation'), sh.idx.map(function(i){ return H(opts[i]); }), sh.correct, sh.idx.map(function(i){ return H(why[i]); }), { practice: '1.C', level: 'apply' }),
        stepNum('expk', H('The constant $k$ (calculator allowed: three decimal places)'), M.cell(k, 0, kMis, 0.001), { d: 3, practice: '1.E', level: 'apply', hint: H('$y = ' + y0 + 'e^{kt}$, and $y(' + T + ') = ' + (grow ? 2 * y0 : y0 / 2) + '$.') }),
        stepNum('expy', H(q.charAt(0).toUpperCase() + q.slice(1) + ' after ' + t1 + ' ' + u), M.cell(y1, 0, yMis, 0.001), { d: 3, practice: '1.E', level: 'apply' }),
        stepNum('expt', H('When ' + q + ' reaches ' + M.fmt(target, 4) + ' (in ' + u + ')'), M.cell(tT, 0, tMis, 0.001), { d: 3, practice: '1.E', level: 'apply' })
      ],
      solution: [H('Proportional to the amount: $\\frac{dy}{dt} = ky$, so $y = ' + y0 + 'e^{kt}$.'),
        H((grow ? 'Doubling' : 'Half-life') + ': $e^{' + T + 'k} = ' + (grow ? '2' : '\\frac{1}{2}') + '$, so $k = ' + (grow ? '' : '-') + '\\frac{\\ln 2}{' + T + '} \\approx ' + dn(k, 4) + '$.'),
        H('$y(' + t1 + ') = ' + y0 + 'e^{' + t1 + 'k} \\approx ' + dn(y1, 3) + '$.'),
        H('$' + y0 + 'e^{kt} = ' + M.fmt(target, 4) + '$ gives $t = \\frac{\\ln(' + M.fmt(target / y0, 4) + ')}{k} \\approx ' + dn(tT, 3) + '$ ' + u + '.')],
      fig: { kind: 'exp', y0: y0, k: k, T: T, t1: t1, target: target, unit: u, grow: grow } };
  }

  var GEN = { slopes: genSlopes, match: genMatch, sketch: genSketch, separate: genSeparate, concavity: genConcavity, exp: genExp };
  function generate(r, ctx, type){
    var kind = type || ctx.kind || 'slopes';
    if(!GEN[kind]) throw new Error('slopeFields.generate: no problem kind "' + kind + '"');
    return GEN[kind](r, ctx);
  }

  M.register('slopeFields', {
    GALLERY: GALLERY, de: de, fns: fns, grid: grid, field: field, solve: solve, march: march, rk45: rk45, steps: steps, halfLife: halfLife,
    MATCH: MATCH, zerosOn: zerosOn, zText: zText, sketchGrade: sketchGrade, sketchTol: sketchTol, generate: generate, KINDS: Object.keys(GEN),
    tn: tn, dn: dn, niceStep: niceStep
  });
})(typeof window !== 'undefined' ? window : globalThis);
