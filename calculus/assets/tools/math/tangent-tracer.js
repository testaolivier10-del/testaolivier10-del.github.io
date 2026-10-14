/* Tangent tracer model: ApCalcMath.tangentTracer (docs/apcalc-architecture.md, "Tools").
   OWNED BY THIS TOOL ONLY: no other tool edits this file, and this tool edits
   no shared file. Pure functions, no DOM, so the validator
   (scripts/lib/apcalc-tool-checks/tangent-tracer.mjs) and the test
   (scripts/test/apcalc-tool-tangent-tracer.test.mjs) run exactly this code.

   Loaded after calc-expr.js (ApCalcExpr) and calc-tool-math.js (ApCalcMath).

   Explore
     FUNCS, ORDER          the function shelf: f, its exact derivative d (NaN
                           where f is not differentiable), TeX, view windows,
                           the start point and the special points
     custom(str)           a typed function: { ok, fn, tex, error } (ApCalcExpr)
     dq(f, a, h)           the difference quotient (f(a + h) - f(a)) / h
     table(f, a)           the quotients for h = ±1, ±0.1, ±0.01, ±0.001
     classify(f, a)        { kind: 'smooth' | 'corner' | 'cusp' | 'vertical' |
                           'jump' | 'endpoint' | 'undefined', L, R, slope }
                           from one-sided difference quotients
     slopeAt(F, a)         the derivative used by the picture: the exact one
                           for a shelf function, else a central difference
     hOf(s), sOf(h)        the h slider: s in [-1000, 1000], |h| on a log
                           scale from 0.001 to HMAX, the sign of s the side
     line(a, fa, m)        tangent line pieces: TeX "y = 4 - 3(x - 2)", the
                           answer a student may type, and its value function
   Test yourself
     generate(r, ctx, type?) -> { ctx, topic, type, text, steps, solution, fig }
       type: estimate | table | whichgraph | sketch | tanline | notdiff
       steps: num, choice (optional pics: plot specs), expr, sketch
       fig: what the stage shows (an ApCalcPlot spec, a table, a sketch grid)
     gradeSketch(step, values) -> { ok, points: [{ ok, code, why }] }
   Text is TeX between dollar signs, rendered by ApCalcTex.html on the page. */
(function(){
  'use strict';
  var M = window.ApCalcMath;
  if(!M) return;
  function X(){ return window.ApCalcExpr; }

  /* ------------------------------------------------------------ numbers */
  // A number as TeX or as typed text: integers plain, decimals to 3 places.
  function n(v){ var s = String(+(+v).toFixed(3)); return s === '-0' ? '0' : s; }
  function sgn(v){ return v > 0 ? 1 : v < 0 ? -1 : 0; }
  function words(v){ return v < 0 ? '−' + n(-v) : n(v); }

  /* ------------------------------------------------- the function shelf */
  var PI = Math.PI;
  function cbrt(x){ return x < 0 ? -Math.pow(-x, 1 / 3) : Math.pow(x, 1 / 3); }
  var FUNCS = {
    quad: { name: 'x² (a parabola)', tex: 'f(x) = x^2', f: function(x){ return x * x; }, d: function(x){ return 2 * x; }, dTex: "f'(x) = 2x",
      x: [-3, 3], y: [-1, 9], dy: [-6, 6], a: 1, h: 1, special: [] },
    cubic: { name: 'x³ − 3x (a cubic)', tex: 'f(x) = x^3 - 3x', f: function(x){ return x * x * x - 3 * x; }, d: function(x){ return 3 * x * x - 3; }, dTex: "f'(x) = 3x^2 - 3",
      x: [-2.6, 2.6], y: [-4, 4], dy: [-4, 10], a: -1.5, h: 1, special: [] },
    sin: { name: 'sin x', tex: 'f(x) = \\sin x', f: Math.sin, d: Math.cos, dTex: "f'(x) = \\cos x", piX: true,
      x: [-6.6, 6.6], y: [-1.8, 1.8], dy: [-1.8, 1.8], a: 1, h: 1, special: [] },
    exp: { name: 'eˣ', tex: 'f(x) = e^x', f: Math.exp, d: Math.exp, dTex: "f'(x) = e^x",
      x: [-3, 2.2], y: [-1, 8], dy: [-1, 8], a: 0, h: 1, special: [] },
    ln: { name: 'ln x', tex: 'f(x) = \\ln x', f: function(x){ return x > 0 ? Math.log(x) : NaN; }, d: function(x){ return x > 0 ? 1 / x : NaN; }, dTex: "f'(x) = \\frac{1}{x}",
      x: [-0.5, 6], y: [-3, 2.2], dy: [-0.5, 4], a: 1, h: 1, special: [], domain: 'x > 0' },
    abs: { name: '|x| (a corner)', tex: 'f(x) = |x|', f: Math.abs, d: function(x){ return x > 0 ? 1 : x < 0 ? -1 : NaN; }, dTex: "f'(x) = \\begin{cases} -1 & x < 0 \\\\ 1 & x > 0 \\end{cases}",
      x: [-3, 3], y: [-1, 3.5], dy: [-2, 2], a: 0, h: 0.5, special: [{ x: 0, kind: 'corner', L: -1, R: 1 }] },
    corner: { name: 'Pieces that meet at a corner', tex: 'f(x) = \\begin{cases} x^2 & x < 1 \\\\ 2 - x & x \\ge 1 \\end{cases}',
      f: function(x){ return x < 1 ? x * x : 2 - x; }, d: function(x){ return x < 1 ? 2 * x : x > 1 ? -1 : NaN; },
      dTex: "f'(x) = \\begin{cases} 2x & x < 1 \\\\ -1 & x > 1 \\end{cases}", x: [-1.5, 3.5], y: [-1.5, 2.5], dy: [-3, 4], a: 1, h: 0.5,
      special: [{ x: 1, kind: 'corner', L: 2, R: -1 }] },
    smooth: { name: 'Pieces that join smoothly', tex: 'f(x) = \\begin{cases} x^2 & x < 1 \\\\ 2x - 1 & x \\ge 1 \\end{cases}',
      f: function(x){ return x < 1 ? x * x : 2 * x - 1; }, d: function(x){ return x < 1 ? 2 * x : 2; },
      dTex: "f'(x) = \\begin{cases} 2x & x < 1 \\\\ 2 & x \\ge 1 \\end{cases}", x: [-2, 3.5], y: [-1, 6], dy: [-4, 4], a: 1, h: 0.5, special: [], join: 1 },
    sqrt: { name: '√x near 0', tex: 'f(x) = \\sqrt{x}', f: function(x){ return x >= 0 ? Math.sqrt(x) : NaN; }, d: function(x){ return x > 0 ? 0.5 / Math.sqrt(x) : NaN; }, dTex: "f'(x) = \\frac{1}{2\\sqrt{x}}",
      x: [-0.5, 5], y: [-0.5, 2.5], dy: [-0.5, 3], a: 0, h: 1, special: [{ x: 0, kind: 'endpoint', L: NaN, R: Infinity }], domain: 'x \\ge 0' },
    cbrt: { name: 'x^(1/3): a vertical tangent', tex: 'f(x) = \\sqrt[3]{x}', f: cbrt, d: function(x){ return x === 0 ? NaN : 1 / (3 * Math.pow(cbrt(x), 2)); }, dTex: "f'(x) = \\frac{1}{3\\sqrt[3]{x^2}}",
      x: [-3, 3], y: [-1.8, 1.8], dy: [-0.5, 4], a: 0, h: 1, special: [{ x: 0, kind: 'vertical', L: Infinity, R: Infinity }] },
    cusp: { name: 'x^(2/3): a cusp', tex: 'f(x) = \\sqrt[3]{x^2}', f: function(x){ var c = cbrt(x); return c * c; }, d: function(x){ return x === 0 ? NaN : 2 / (3 * cbrt(x)); }, dTex: "f'(x) = \\frac{2}{3\\sqrt[3]{x}}",
      x: [-3, 3], y: [-0.5, 2.5], dy: [-4, 4], a: 0, h: 1, special: [{ x: 0, kind: 'cusp', L: -Infinity, R: Infinity }] },
    jump: { name: 'A jump', tex: 'f(x) = \\begin{cases} \\frac{x}{2} + 1 & x < 1 \\\\ \\frac{x}{2} & x \\ge 1 \\end{cases}',
      f: function(x){ return x < 1 ? x / 2 + 1 : x / 2; }, d: function(x){ return x === 1 ? NaN : 0.5; }, dTex: "f'(x) = \\frac{1}{2} \\text{ for } x \\ne 1",
      x: [-2, 4], y: [-1, 3.5], dy: [-1, 2], a: 1, h: 0.5, special: [{ x: 1, kind: 'jump', L: -Infinity, R: 0.5 }],
      dots: [{ at: [1, 1.5], open: true }, { at: [1, 0.5] }] }
  };
  var ORDER = ['quad', 'cubic', 'sin', 'exp', 'ln', 'abs', 'corner', 'smooth', 'sqrt', 'cbrt', 'cusp', 'jump'];
  Object.keys(FUNCS).forEach(function(k){ FUNCS[k].id = k; });

  /* A typed function, read by ApCalcExpr (no eval). The view is [-4, 4];
     the page fits y to the curve. */
  function custom(str){
    var r = X().read(String(str || ''), { vars: ['x'] });
    if(!r.ok) return { ok: false, error: r.error };
    var g = X().compile(r.tree), f = function(x){ var v = g({ x: x }); return typeof v === 'number' ? v : NaN; };
    var probe = 0;
    for(var i = 0; i <= 80; i++) if(isFinite(f(-4 + i * 0.1))) probe++;
    if(!probe) return { ok: false, error: 'That function has no values between x = −4 and x = 4.' };
    return { ok: true, id: 'custom', name: 'Your function', tex: 'f(x) = ' + r.tex, f: f, d: null, dn: dNum(f), typed: String(str), x: [-4, 4], special: [], custom: true };
  }

  /* The derivative of a typed function for drawing: a central difference,
     NaN where the one-sided quotients disagree (a corner), so the graph of
     f′ breaks there instead of joining the two sides. */
  function dNum(f){
    return function(x){
      var h = 1e-5 * Math.max(1, Math.abs(x)), f0 = f(x), L = (f0 - f(x - h)) / h, R = (f(x + h) - f0) / h;
      if(!isFinite(L) || !isFinite(R)) return NaN;
      if(Math.abs(L - R) > 1e-2 * Math.max(1, Math.abs(L), Math.abs(R))) return NaN;
      return (L + R) / 2;
    };
  }

  /* ----------------------------------------------- difference quotients */
  function dq(f, a, h){ var fa = f(a), fb = f(a + h); return isFinite(fa) && isFinite(fb) && h !== 0 ? (fb - fa) / h : NaN; }
  var HS = [1, 0.1, 0.01, 0.001];
  function table(f, a){ return HS.map(function(h){ return { h: h, left: dq(f, a, -h), right: dq(f, a, h) }; }); }

  /* One-sided slopes from difference quotients. A side is infinite when the
     quotient keeps growing as h shrinks (it does for √x, ∛x and a jump);
     otherwise its estimate is the quotient at h = 1e-7 (Richardson
     corrected). Continuity is tested first: a jump is not differentiable. */
  function side(f, a, s){
    var fa = f(a), q = [1e-3, 1e-4, 1e-5, 1e-6].map(function(h){ return dq(f, a, s * h); });
    if(q.some(function(v){ return !isFinite(v); })) return { ok: false };
    // Continuity from this side: |f(a + h) - f(a)| must shrink with h. A
    // jump keeps its size; a steep curve (∛x) still shrinks.
    var d9 = Math.abs(f(a + s * 1e-9) - fa), d12 = Math.abs(f(a + s * 1e-12) - fa);
    var jump = d12 > 1e-3 * Math.max(1, Math.abs(fa)) && d12 > 0.5 * d9;
    var big = Math.abs(q[3]), grow = Math.abs(q[3]) > 3 * Math.abs(q[1]) && big > 50;
    if(jump || grow) return { ok: true, inf: sgn(q[3]) * Infinity, jump: jump };
    var q7 = dq(f, a, s * 1e-7), q8 = dq(f, a, s * 2e-7);
    return { ok: true, v: isFinite(q7) && isFinite(q8) ? 2 * q7 - q8 : q[3] };
  }
  function classify(f, a){
    var fa = f(a);
    if(!isFinite(fa)) return { kind: 'undefined' };
    var L = side(f, a, -1), R = side(f, a, 1);
    if(!L.ok && !R.ok) return { kind: 'undefined' };
    if(!L.ok || !R.ok){ var one = L.ok ? L : R; return { kind: 'endpoint', L: L.ok ? (one.inf || one.v) : NaN, R: R.ok ? (one.inf || one.v) : NaN, side: L.ok ? 'left' : 'right' }; }
    if(L.jump || R.jump) return { kind: 'jump', L: L.inf != null ? L.inf : L.v, R: R.inf != null ? R.inf : R.v };
    var li = L.inf != null, ri = R.inf != null, Lv = li ? L.inf : L.v, Rv = ri ? R.inf : R.v;
    if(li && ri) return { kind: Lv === Rv ? 'vertical' : 'cusp', L: Lv, R: Rv };
    if(li || ri) return { kind: 'corner', L: Lv, R: Rv };
    if(Math.abs(Lv - Rv) > 1e-3 * Math.max(1, Math.abs(Lv), Math.abs(Rv))) return { kind: 'corner', L: Lv, R: Rv };
    return { kind: 'smooth', L: Lv, R: Rv, slope: (Lv + Rv) / 2 };
  }
  /* The slope the picture uses: the shelf's exact derivative, else a
     central difference (NaN when the one-sided slopes disagree). */
  function slopeAt(F, a){
    if(F.d){ var v = F.d(a); return isFinite(v) ? v : NaN; }
    if(F.dn){ var c0 = classify(F.f, a); return c0.kind === 'smooth' ? F.dn(a) : NaN; }
    var c = classify(F.f, a);
    return c.kind === 'smooth' ? M.deriv(F.f, a) : NaN;
  }

  /* --------------------------------------------------- the h slider */
  var HMIN = 0.001, HMAX = 2;
  function hOf(s, hmax){
    hmax = hmax || HMAX;
    if(!s) return HMIN;
    var t = Math.min(1, Math.abs(s) / 1000), lo = Math.log10(HMIN), hi = Math.log10(hmax);
    var v = Math.pow(10, lo + t * (hi - lo));
    v = v < 0.0105 ? M.round(v, 4) : v < 0.105 ? M.round(v, 3) : M.round(v, 2);
    return sgn(s) * Math.max(HMIN, Math.min(hmax, v));
  }
  function sOf(h, hmax){
    hmax = hmax || HMAX;
    var lo = Math.log10(HMIN), hi = Math.log10(hmax), t = (Math.log10(Math.max(HMIN, Math.min(hmax, Math.abs(h)))) - lo) / (hi - lo);
    return (h < 0 ? -1 : 1) * Math.max(1, Math.round(t * 1000));
  }

  /* --------------------------------------------- tangent lines as text */
  // a as typed text and as TeX ("pi/2" and "\frac{\pi}{2}").
  function shift(aTyped, aTex){ return { typed: aTyped, tex: aTex }; }
  function aParts(a){
    if(typeof a === 'object') return a;
    return shift(n(a), n(a));
  }
  /* y = fa + m(x - a), written the way a teacher would: no "+ -", no "1(",
     (x + 2) for a = -2. fa and m may be { typed, tex, v } for e, π. */
  function term(v){ return typeof v === 'object' ? v : { typed: n(v), tex: n(v), v: v }; }
  function line(aIn, faIn, mIn){
    var A = aParts(aIn), fa = term(faIn), m = term(mIn), av = typeof aIn === 'object' ? aIn.v : aIn;
    var paren = av === 0 ? { typed: 'x', tex: 'x' } : av < 0 ? { typed: '(x + ' + A.typed.replace(/^-/, '') + ')', tex: '(x + ' + A.tex.replace(/^-/, '') + ')' } : { typed: '(x - ' + A.typed + ')', tex: '(x - ' + A.tex + ')' };
    var mv = m.v, faZero = fa.v === 0;
    function piece(kind){
      var mt = m[kind], body;
      if(mv === 0) return faZero ? '0' : fa[kind];
      if(mv === 1) body = paren[kind];
      else if(mv === -1) body = '-' + paren[kind];
      else body = mt + paren[kind];
      if(faZero) return body;
      return fa[kind] + (body.charAt(0) === '-' ? ' - ' + body.slice(1) : ' + ' + body);
    }
    var typed = piece('typed'), tex = piece('tex');
    return { typed: typed, tex: 'y = ' + tex, slope: mv, at: av, value: fa.v,
      fn: function(x){ return fa.v + mv * (x - av); } };
  }

  /* --------------------------------------------------------- helpers */
  function plotNice(v){ var ok = [1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10, 12, 15, 20, 25, 30, 40, 50]; for(var i = 0; i < ok.length; i++) if(v <= ok[i] + 1e-9) return ok[i]; return Math.ceil(v / 10) * 10; }
  function shuffle(r, a){ a = a.slice(); for(var i = a.length - 1; i > 0; i--){ var j = Math.floor(r() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  // A polynomial as an expression string (for ApCalcExpr) from coefficients
  // c[0] + c[1] x + c[2] x^2 + c[3] x^3, about x0.
  function polyStr(c, x0){
    // Full precision: the curve drawn is the function the keys come from.
    var u = x0 ? '(x - (' + String(x0) + '))' : 'x', parts = [];
    c.forEach(function(k, i){ if(!k) return; parts.push('(' + String(k) + ')' + (i === 0 ? '' : i === 1 ? '*' + u : '*' + u + '^' + i)); });
    return parts.length ? parts.join(' + ') : '0';
  }
  function polyVal(c, x0, x){ var u = x - (x0 || 0), s = 0; for(var i = c.length - 1; i >= 0; i--) s = s * u + c[i]; return s; }
  function polyDer(c){ return c.slice(1).map(function(k, i){ return k * (i + 1); }); }
  // Cubic with f'(x) = k(x - p)(x - q) + nothing else; C centers its peak and valley.
  function cubicPQ(k, p, q, C){ return [C, k * p * q, -k * (p + q) / 2, k / 3]; }

  /* ================================================== test yourself */
  var TYPES = [
    { value: 'estimate', label: 'Estimate f′(a) from a tangent line' },
    { value: 'table', label: 'Difference quotient from a table' },
    { value: 'whichgraph', label: 'Which graph is f′?' },
    { value: 'sketch', label: 'Sketch f′ from f' },
    { value: 'tanline', label: 'Write the tangent line' },
    { value: 'notdiff', label: 'Where is f not differentiable?' }
  ];
  function step(o){ o.level = o.level || 'apply'; return o; }

  /* 1. Estimate f'(a) from the tangent line drawn on a graph (2.3). */
  function genEstimate(r, ctx){
    var a, y0, run, rise, m, c2, c3, c, b, fb, mb, guard = 0;
    do {
      a = r.int(-2, 1); y0 = r.int(-2, 2); run = r.pick([1, 2]);
      rise = r.pick(run === 1 ? [-3, -2, -1, 1, 2, 3] : [-3, -1, 1, 3, 4, -4]);
      m = rise / run; c2 = r.pick([-0.5, -0.4, -0.3, 0.3, 0.4, 0.5]); c3 = r.pick([-0.12, -0.08, 0, 0.08, 0.12]);
      c = [y0, m, c2, c3];
      b = a + r.pick([-2, -1.5, 1.5, 2, 2.5]);
      fb = polyVal(c, a, b); mb = polyVal(polyDer(c), a, b);
    } while(guard++ < 400 && (b < -4 || b > 4 || Math.abs(fb) > 4.2 || Math.abs(fb - y0) < 0.3 || Math.abs(mb - m) < 0.8 || Math.abs(y0 + rise) > 4.5 || a + run > 4));
    var fs = polyStr(c, a), mk = [];
    if(rise !== 0 && Math.abs(run / rise - m) > 0.2) mk.push({ value: run / rise, why: 'That is run over rise. Slope is rise over run: the change in y divided by the change in x.' });
    if(run !== 1) mk.push({ value: rise, why: 'That is the rise alone. Divide it by the run, ' + run + ', to get the slope.' });
    if(Math.abs(y0 - m) > 0.2) mk.push({ value: y0, why: 'That is $f(' + n(a) + ')$, the height of the point. $f\'(' + n(a) + ')$ is the slope of the tangent line there.' });
    var big = mb > m, mbT = n(M.round(mb, 1));
    var truth = 'the tangent slope at $x = ' + n(b) + '$ is about $' + mbT + '$, ' + (big ? 'more' : 'less') + ' than $f\'(' + n(a) + ') = ' + n(m) + '$.';
    var correct = big ? 0 : 1, why = [];
    why[correct] = 'Right: ' + truth;
    // When heights and slopes order the other way, the wrong order is the
    // one a height comparison gives: name that slip.
    why[1 - correct] = (sgn(fb - y0) !== sgn(mb - m) ? 'That compares the heights $f(' + n(b) + ')$ and $f(' + n(a) + ')$. The derivative compares slopes: ' : 'Picture the tangent line at each point: ') + truth;
    why[2] = 'The slopes are different: ' + truth;
    var p1 = [a, y0], p2 = [a + run, y0 + rise];
    return {
      ctx: ctx.id, topic: ctx.topic, type: 'estimate',
      text: 'The graph shows $f$ and the line tangent to it at $x = ' + n(a) + '$. The tangent line passes through the two marked grid points.',
      steps: [
        step({ key: 'slope', kind: 'num', d: 3, practice: '2.B', label: 'Estimate $f\'(' + n(a) + ')$.', hint: 'Slope of the tangent line: rise over run between its two marked points.', cell: M.cell(m, 0, mk, 0.06), mark: { kind: 'triangle', from: p1, to: p2 } }),
        step({ key: 'compare', kind: 'choice', practice: '2.E', level: 'analyze', label: 'Compare $f\'(' + n(b) + ')$ with $f\'(' + n(a) + ')$. Point $B$ is at $x = ' + n(b) + '$.', fixed: true,
          options: ['$f\'(' + n(b) + ') > f\'(' + n(a) + ')$', '$f\'(' + n(b) + ') < f\'(' + n(a) + ')$', '$f\'(' + n(b) + ') = f\'(' + n(a) + ')$'], correct: correct, why: why, mark: { kind: 'tangentAt', x: b, slope: mb } })
      ],
      solution: [
        'The tangent line passes through $(' + n(p1[0]) + ', ' + n(p1[1]) + ')$ and $(' + n(p2[0]) + ', ' + n(p2[1]) + ')$, so its slope is $\\frac{' + n(rise) + '}{' + n(run) + '} = ' + n(m) + '$. The slope of the tangent line is the derivative: $f\'(' + n(a) + ') \\approx ' + n(m) + '$.',
        'At $x = ' + n(b) + '$ the tangent line has slope about $' + n(M.round(mb, 1)) + '$, so $f\'(' + n(b) + ')' + (big ? ' > ' : ' < ') + 'f\'(' + n(a) + ')$. Compare slopes, not heights.'
      ],
      fig: { kind: 'graph', label: 'The graph of f with its tangent line at x = ' + n(a) + ' through two grid points, and point B on f at x = ' + n(b),
        x: [-5, 5], y: [-5, 5], xStep: 1, yStep: 1, xLabel: 'x', yLabel: 'y',
        curves: [{ fn: fs, cls: 's1', label: 'f' }],
        lines: [{ point: p1, slope: m, cls: 's4' }],
        points: [{ at: p1, cls: 's4' }, { at: p2, cls: 's4' }, { at: [b, fb], cls: 's1', label: 'B' }] },
      fn: fs, a: a, m: m, b: b, mb: mb
    };
  }

  /* 2. A difference quotient from a table, with units (2.1, 2.3). */
  var SCEN = [
    { id: 'tank', F: 'W', t: 't', what: 'the amount of water in a tank', unit: 'liters', tu: 'minutes', rate: 'liters per minute', per: 'minutes per liter', acc: 'liters per minute per minute', v0: [120, 200], d: [6, 14], sign: [1, -1] },
    { id: 'coffee', F: 'H', t: 't', what: 'the temperature of a cup of coffee', unit: 'degrees Celsius', tu: 'minutes', rate: 'degrees Celsius per minute', per: 'minutes per degree Celsius', acc: 'degrees Celsius per minute per minute', v0: [80, 92], d: [2, 5], sign: [-1] },
    { id: 'car', F: 's', t: 't', what: 'the distance a car has traveled', unit: 'meters', tu: 'seconds', rate: 'meters per second', per: 'seconds per meter', acc: 'meters per second per second', v0: [0, 20], d: [8, 20], sign: [1] },
    { id: 'snow', F: 'D', t: 't', what: 'the depth of snow on a field', unit: 'centimeters', tu: 'hours', rate: 'centimeters per hour', per: 'hours per centimeter', acc: 'centimeters per hour per hour', v0: [10, 30], d: [1, 4], sign: [1, -1] },
    { id: 'bacteria', F: 'P', t: 't', what: 'the number of bacteria in a dish', unit: 'thousands of bacteria', tu: 'hours', rate: 'thousands of bacteria per hour', per: 'hours per thousand bacteria', acc: 'thousands of bacteria per hour per hour', v0: [20, 60], d: [3, 9], sign: [1] }
  ];
  function genTable(r, ctx){
    var S = r.pick(SCEN), sign = r.pick(S.sign), ts, vs, i, c, guard = 0;
    do {
      ts = [0]; for(var k = 0; k < 4; k++) ts.push(ts[k] + r.pick(k === 1 || k === 2 ? [2, 3, 4, 5] : [1, 2, 3, 4]));
      i = r.int(1, 2);
      var base = r.int(S.d[0], S.d[1]);
      vs = [r.int(S.v0[0], S.v0[1])];
      for(k = 0; k < 4; k++){ var w = ts[k + 1] - ts[k], rate = base * (1 + 0.25 * (k - 1.5) * r.pick([1, -1])); vs.push(vs[k] + sign * Math.max(1, Math.round(rate * w))); }
      c = ts[i] + r.int(1, ts[i + 1] - ts[i] - 1);
    } while(guard++ < 200 && (ts[i + 1] - ts[i] < 2 || vs.some(function(v){ return v < 0; })));
    var F = S.F, T = S.t, w = ts[i + 1] - ts[i], dv = vs[i + 1] - vs[i], ans = dv / w;
    var whole = (vs[4] - vs[0]) / (ts[4] - ts[0]), left = (vs[i] - vs[i - 1]) / (ts[i] - ts[i - 1]), right = (vs[i + 2] - vs[i + 1]) / (ts[i + 2] - ts[i + 1]);
    var iv = function(j, k){ return '$' + T + ' = ' + ts[j] + '$ and $' + T + ' = ' + ts[k] + '$'; };
    var mk = [];
    if(w !== 1) mk.push({ value: dv, why: 'That is the change in ' + F + ' alone. Divide by the change in ' + T + ', ' + w + ' ' + S.tu + '.' });
    if(dv !== 0) mk.push({ value: w / dv, why: 'That is the change in ' + T + ' over the change in ' + F + ', upside down. The rate of ' + F + ' is (change in ' + F + ') ÷ (change in ' + T + ').' });
    mk.push({ value: whole, why: 'That is the average rate over the whole table. Use only the two times that bracket $' + T + ' = ' + c + '$.' });
    mk.push({ value: left, why: 'That interval, ' + ts[i - 1] + ' to ' + ts[i] + ', does not contain $' + T + ' = ' + c + '$.' });
    mk.push({ value: right, why: 'That interval, ' + ts[i + 1] + ' to ' + ts[i + 2] + ', does not contain $' + T + ' = ' + c + '$.' });
    var opts = [iv(i, i + 1), iv(i - 1, i), iv(i + 1, i + 2), iv(0, 4)];
    var whyI = [
      'Right: $' + T + ' = ' + c + '$ lies between ' + ts[i] + ' and ' + ts[i + 1] + ', and that is the smallest interval in the table around it.',
      'This interval ends at $' + T + ' = ' + ts[i] + '$, before $' + T + ' = ' + c + '$: its average rate describes another stretch of time. Use the two times that bracket ' + c + '.',
      'This interval starts at $' + T + ' = ' + ts[i + 1] + '$, after $' + T + ' = ' + c + '$. Use the two times that bracket ' + c + '.',
      'This interval contains $' + T + ' = ' + c + '$, but it is the whole table: its average rate can be far from the rate at ' + c + '. Use the smallest interval around it.'
    ];
    var units = [S.rate, S.unit, S.per, S.acc];
    var whyU = [
      'Right: the derivative divides a change in ' + S.unit + ' by a change in ' + S.tu + '.',
      'That is the unit of $' + F + '(' + T + ')$ itself. $' + F + '\'(' + T + ')$ is a rate: ' + S.unit + ' per unit of time.',
      'That is upside down: the change in $' + F + '$ is on top, so it is ' + S.rate + '.',
      'That is the unit of $' + F + '\'\'$, a rate of a rate. $' + F + '\'$ is one rate: ' + S.rate + '.'
    ];
    var ord = shuffle(r, [0, 1, 2, 3]);
    return {
      ctx: ctx.id, topic: ctx.topic, type: 'table', scen: S.id,
      text: 'The differentiable function $' + F + '$ gives ' + S.what + ', in ' + S.unit + ', at time $' + T + '$ in ' + S.tu + '. The table gives selected values. Estimate $' + F + '\'(' + c + ')$.',
      steps: [
        step({ key: 'interval', kind: 'choice', practice: '1.D', label: 'Which two times give the best estimate of $' + F + '\'(' + c + ')$?', options: ord.map(function(k){ return opts[k]; }), why: ord.map(function(k){ return whyI[k]; }), correct: ord.indexOf(0), fixed: true, mark: { kind: 'interval', i: i } }),
        step({ key: 'value', kind: 'num', d: 3, practice: '1.E', label: 'Estimate $' + F + '\'(' + c + ')$.', hint: 'Change in ' + F + ' divided by change in ' + T + '. Three decimal places if it is not exact.', cell: M.cell(ans, 0, mk, 0.001), mark: { kind: 'secant', i: i } }),
        step({ key: 'units', kind: 'choice', practice: '4.B', label: 'What are the units of $' + F + '\'(' + c + ')$?', options: units, why: whyU, correct: 0 })
      ],
      solution: [
        '$' + T + ' = ' + c + '$ is between $' + T + ' = ' + ts[i] + '$ and $' + T + ' = ' + ts[i + 1] + '$, the smallest interval in the table around it.',
        '$' + F + '\'(' + c + ') \\approx \\frac{' + F + '(' + ts[i + 1] + ') - ' + F + '(' + ts[i] + ')}{' + ts[i + 1] + ' - ' + ts[i] + '} = \\frac{' + vs[i + 1] + ' - ' + vs[i] + '}{' + w + '} = ' + n(M.round(ans, 3)) + '$ ' + S.rate + '.',
        'The units are ' + S.rate + ': a change in ' + S.unit + ' divided by a change in ' + S.tu + '.'
      ],
      fig: { kind: 'table', F: F, t: T, unit: S.unit, tu: S.tu, ts: ts, vs: vs, c: c, i: i },
      answer: ans
    };
  }

  /* Sign pattern of a polynomial in words (option text for screen readers). */
  function signWords(g, a, b){
    var zs = M.roots(g, a, b, 400).filter(function(z){ return z > a + 1e-6 && z < b - 1e-6; }).map(function(z){ return Math.round(z * 100) / 100; });
    zs = zs.filter(function(z, k){ return !k || Math.abs(z - zs[k - 1]) > 1e-6; });
    if(!zs.length) return g((a + b) / 2) > 0 ? 'positive everywhere shown' : 'negative everywhere shown';
    var cuts = [a].concat(zs, [b]), out = [];
    for(var k = 0; k + 1 < cuts.length; k++){
      var mid = (cuts[k] + cuts[k + 1]) / 2, s = g(mid) > 0 ? 'positive' : 'negative';
      out.push(s + (k === 0 ? ' for x < ' + words(zs[0]) : k === cuts.length - 2 ? ' for x > ' + words(zs[zs.length - 1]) : ' from ' + words(cuts[k]) + ' to ' + words(cuts[k + 1])));
    }
    return 'zero at x = ' + zs.map(words).join(' and ') + '; ' + out.join(', ');
  }
  function cubicPick(r){
    var p, q, k, guard = 0;
    do { p = r.int(-3, 1); q = p + r.pick([2, 3, 4]); k = r.pick([1, -1, 0.5, -0.5]); } while(guard++ < 50 && q > 3);
    var c0 = cubicPQ(k, p, q, 0), fp = polyVal(c0, 0, p), fq = polyVal(c0, 0, q), C = -(fp + fq) / 2;
    C = Math.round(C * 2) / 2;
    var c = cubicPQ(k, p, q, C);
    return { p: p, q: q, k: k, c: c, d: polyDer(c), dd: polyDer(polyDer(c)) };
  }

  /* 3. Which graph is f'? (2.2) */
  function genWhich(r, ctx){
    var P = cubicPick(r), p = P.p, q = P.q, k = P.k;
    var fv = function(x){ return polyVal(P.c, 0, x); }, dv = function(x){ return polyVal(P.d, 0, x); };
    var s = q + 1 <= 3 ? 1 : -1, shifted = [k * (p + s) * (q + s), -k * (p + q + 2 * s), k];
    var cands = {
      right: { c: P.d, why: 'Right: where $f$ rises, this graph is above the axis; where $f$ falls, it is below; and it is $0$ at $x = ' + p + '$ and $x = ' + q + '$, where $f$ has its peak and valley.' },
      neg: { c: P.d.map(function(v){ return -v; }), why: 'The signs are reversed: this graph is negative where $f$ rises. A rising $f$ has positive slopes, so $f\' > 0$ there.' },
      shift: { c: shifted, why: 'This graph is $0$ at $x = ' + (p + s) + '$ and $x = ' + (q + s) + '$, but the peak and valley of $f$ are at $x = ' + p + '$ and $x = ' + q + '$. $f\'$ is $0$ exactly where the tangent to $f$ is flat.' },
      second: { c: P.dd, why: 'This line is $0$ at $x = ' + n((p + q) / 2) + '$, where $f$ changes how it bends, not at its peak and valley. It is the slope of $f\'$ (that is $f\'\'$), one derivative too far.' },
      copy: { c: P.c, why: 'This is the graph of $f$ itself, at another scale. $f\'$ shows the slopes of $f$, not its heights.' }
    };
    var keys = ['right', 'neg', 'shift', r.pick(['second', 'copy'])], ord = shuffle(r, keys);
    var Yf = plotNice(Math.max(Math.abs(fv(p)), Math.abs(fv(q))) * 1.6 + 0.5);
    var gy = 0; ord.forEach(function(kk){ var c = cands[kk].c; for(var x = p - 1; x <= q + 1; x += 0.25) gy = Math.max(gy, Math.abs(polyVal(c, 0, x))); });
    var Yo = plotNice(gy * 1.1);
    var guide = function(){ return [{ through: [[p, -100], [p, 100]], cls: 'tt-guide', dashed: true }, { through: [[q, -100], [q, 100]], cls: 'tt-guide', dashed: true }]; };
    var pics = ord.map(function(kk, j){
      return { label: 'Graph ' + (j + 1) + ': a curve ' + signWords(function(x){ return polyVal(cands[kk].c, 0, x); }, -4, 4), x: [-4, 4], y: [-Yo, Yo], xStep: 1, yStep: Yo / 2, grid: true,
        curves: [{ fn: polyStr(cands[kk].c), cls: 's2' }], lines: guide() };
    });
    var zf = M.roots(fv, -4, 4, 400);
    var zText = zf.length ? 'At $x \\approx ' + zf.map(function(z){ return n(M.round(z, 1)); }).join('$ and $x \\approx ') + '$, where $f$ crosses the $x$-axis' : 'Where $f$ crosses the $x$-axis';
    var zOpts = ['$x = ' + p + '$ and $x = ' + q + '$', 'Only at $x = ' + n((p + q) / 2) + '$', zText, 'Nowhere: $f\'$ is never $0$'];
    var zWhy = [
      'Right: the tangent to $f$ is flat at its peak and valley, $x = ' + p + '$ and $x = ' + q + '$, so $f\' = 0$ there.',
      'At $x = ' + n((p + q) / 2) + '$ $f$ is steepest between its peak and valley. Its slope there is not $0$.',
      'That is where $f = 0$. The derivative $f\'$ is $0$ where $f$ is flat: at its peak and valley.',
      'The tangent to $f$ is flat at its peak and valley, so $f\'$ is $0$ there.'
    ];
    var o2 = shuffle(r, [0, 1, 2, 3]);
    return {
      ctx: ctx.id, topic: ctx.topic, type: 'whichgraph',
      text: 'The stage shows the graph of $f$. Dashed lines mark $x = ' + p + '$ and $x = ' + q + '$. Which graph below is the graph of $f\'$?',
      steps: [
        step({ key: 'graph', kind: 'choice', practice: '2.E', level: 'analyze', label: 'Which graph is the graph of $f\'$?', options: pics.map(function(g){ return g.label; }), pics: pics, why: ord.map(function(kk){ return cands[kk].why; }), correct: ord.indexOf('right'), fixed: true }),
        step({ key: 'zeros', kind: 'choice', practice: '2.E', label: 'Where is $f\'(x) = 0$?', options: o2.map(function(j){ return zOpts[j]; }), why: o2.map(function(j){ return zWhy[j]; }), correct: o2.indexOf(0), fixed: true })
      ],
      solution: [
        '$f$ ' + (k > 0 ? 'rises until $x = ' + p + '$, falls until $x = ' + q + '$, then rises again' : 'falls until $x = ' + p + '$, rises until $x = ' + q + '$, then falls again') + '. So $f\'$ is ' + (k > 0 ? 'positive, then negative, then positive' : 'negative, then positive, then negative') + '.',
        'The tangent is flat at the peak and valley, so $f\'(' + p + ') = f\'(' + q + ') = 0$: the graph of $f\'$ crosses the axis exactly at the dashed lines.'
      ],
      fig: { kind: 'graph', label: 'The graph of f, with dashed lines at x = ' + p + ' and x = ' + q, x: [-4, 4], y: [-Yf, Yf], xStep: 1, yStep: Yf / 2, xLabel: 'x', yLabel: 'y',
        curves: [{ fn: polyStr(P.c), cls: 's1', label: 'f' }], lines: guide() },
      fn: polyStr(P.c), d: polyStr(P.d), p: p, q: q, keys: ord
    };
  }

  /* 4. Sketch f' from f (2.2), graded point by point. */
  function genSketch(r, ctx){
    var variant = r.pick(['cubic', 'cubic', 'quad', 'lines']), fs, ds, xs, fv, dv, Yf, top, desc = {}, guard = 0;
    if(variant === 'cubic'){
      var P = cubicPick(r);
      xs = [P.p - 1, P.p, (P.p + P.q) / 2, P.q, P.q + 1].filter(function(x){ return x >= -4 && x <= 4; });
      fv = function(x){ return polyVal(P.c, 0, x); }; dv = function(x){ return polyVal(P.d, 0, x); };
      fs = polyStr(P.c); ds = polyStr(P.d);
      Yf = plotNice(Math.max(Math.abs(fv(P.p)), Math.abs(fv(P.q))) * 1.6 + 0.5);
      desc.turn = {}; desc.turn[P.p] = P.k > 0 ? 'peak' : 'valley'; desc.turn[P.q] = P.k > 0 ? 'valley' : 'peak';
    } else if(variant === 'quad'){
      var v = r.int(-1, 1), kq = r.pick([0.5, -0.5, 1, -1]), cq = kq > 0 ? r.int(-3, -1) : r.int(1, 3), cf = [cq, 0, kq];
      xs = [v - 2, v - 1, v, v + 1, v + 2];
      fv = function(x){ return polyVal(cf, v, x); }; dv = function(x){ return 2 * kq * (x - v); };
      fs = polyStr(cf, v); ds = polyStr([0, 2 * kq], v);
      Yf = plotNice(Math.max(Math.abs(fv(v - 3)), Math.abs(fv(v + 3)), Math.abs(cq)) + 0.5);
      desc.turn = {}; desc.turn[v] = kq > 0 ? 'valley' : 'peak';
    } else {
      // Three line segments, slopes s0, s1, s2, meeting at x = -1 and x = 2.
      var sl, br = [-1, 2];
      do { sl = [r.pick([-2, -1, 1, 2, 0.5, -0.5]), r.pick([-1, 0, 1, 2, -2]), r.pick([-2, -1, 1, 2, 0.5])]; } while(guard++ < 50 && (sl[0] === sl[1] || sl[1] === sl[2]));
      var y1 = r.int(-1, 1), yA = y1, yB = y1 + sl[1] * (br[1] - br[0]);
      fv = function(x){ return x <= br[0] ? yA + sl[0] * (x - br[0]) : x <= br[1] ? yA + sl[1] * (x - br[0]) : yB + sl[2] * (x - br[1]); };
      dv = function(x){ return x < br[0] ? sl[0] : x < br[1] ? sl[1] : sl[2]; };
      fs = null; ds = null;
      xs = [-3, -2, 0, 1, 3];
      Yf = plotNice(Math.max(Math.abs(fv(-4)), Math.abs(fv(4)), Math.abs(yA), Math.abs(yB)) + 1);
      desc.flat = sl[1] === 0;
      top = [{ fn: n(yA) + ' + (' + n(sl[0]) + ')*(x - (' + n(br[0]) + '))', domain: [-4, br[0]], cls: 's1' }, { fn: n(yA) + ' + (' + n(sl[1]) + ')*(x - (' + n(br[0]) + '))', domain: [br[0], br[1]], cls: 's1' }, { fn: n(yB) + ' + (' + n(sl[2]) + ')*(x - (' + n(br[1]) + '))', domain: [br[1], 4], cls: 's1', label: 'f' }];
    }
    var ms = xs.map(dv), fvals = xs.map(fv), Y = plotNice(Math.max.apply(null, ms.map(Math.abs)) * 1.2 + 0.3);
    if(Y < 2) Y = 2;
    var span = 2 * Y;
    var st = step({ key: 'sketch', kind: 'sketch', practice: '2.C', level: 'analyze', label: 'Drag the point above each marked $x$ to the value of $f\'(x)$.', hint: 'Above the axis where $f$ rises, below where it falls, $0$ where it is flat; steeper is farther out.',
      xs: xs, answers: ms, fvals: fvals, Y: Y, snap: Y >= 6 ? 0.5 : 0.25, zeroTol: 0.06 * span, tol: 0.07 * span, rel: 0.3, turn: desc.turn || {}, flat: !!desc.flat, variant: variant });
    var sol = xs.map(function(x, k){
      var m = ms[k];
      return '$x = ' + n(x) + '$: ' + (m === 0 ? (st.turn[x] ? 'the ' + st.turn[x] + ' of $f$, a flat tangent, so $f\'(' + n(x) + ') = 0$.' : '$f$ is flat here, so $f\'(' + n(x) + ') = 0$.') : '$f$ is ' + (m > 0 ? 'rising' : 'falling') + ' with slope $' + n(m) + '$, so $f\'(' + n(x) + ') = ' + n(m) + '$.');
    });
    var curves = top || [{ fn: fs, cls: 's1', label: 'f' }];
    return {
      ctx: ctx.id, topic: ctx.topic, type: 'sketch', variant: variant,
      text: 'The top graph is $f$. Sketch the graph of $f\'$ on the grid below it.',
      steps: [st],
      solution: sol.concat(['Joined up, these points trace the graph of $f\'$' + (variant === 'lines' ? ': a step for each line segment, with no value where the segments meet at a corner.' : '.')]),
      fig: { kind: 'sketch', top: { label: 'The graph of f, with the x-values to sketch f′ at marked', x: [-4, 4], y: [-Yf, Yf], xStep: 1, yStep: Yf / 2, xLabel: 'x', yLabel: 'y', curves: curves },
        bottom: { x: [-4, 4], y: [-Y, Y], yStep: Y / 2 }, d: ds, dPieces: variant === 'lines' ? [[-4, -1], [-1, 2], [2, 4]].map(function(iv){ return { fn: n(dv((iv[0] + iv[1]) / 2)), domain: iv, ends: ['open', 'open'] }; }) : null },
      fv: fv, dv: dv
    };
  }
  /* The sketch, graded point by point. values[k] is null for a point the
     student has not set. Each miss is named. */
  function gradeSketch(s, values){
    var pts = s.xs.map(function(x, k){
      var v = values[k], m = s.answers[k], fx = s.fvals[k], tol = Math.max(s.rel * Math.abs(m), s.tol), X = n(x);
      var heightish = function(){ return Math.abs(v - fx) <= s.tol && Math.abs(fx - m) > tol; };
      var rising = m > 0 ? 'rising' : 'falling';
      if(v == null) return { ok: false, code: 'unset', why: 'Set this point: drag it, or select it and use the arrow keys.' };
      if(m === 0){
        if(Math.abs(v) <= s.zeroTol) return { ok: true, code: 'ok' };
        return { ok: false, code: 'notzero', why: s.turn[x] ? 'At $x = ' + X + '$ $f$ has a ' + s.turn[x] + ': the tangent there is flat, so $f\'(' + X + ') = 0$. Put this point on the axis.' : 'At $x = ' + X + '$ $f$ is flat, so $f\'(' + X + ') = 0$. Put this point on the axis.' };
      }
      if(Math.abs(v) <= s.zeroTol){
        if(Math.abs(fx) <= s.zeroTol) return { ok: false, code: 'fzero', why: 'At $x = ' + X + '$ $f$ crosses the axis, but its slope is not $0$: $f$ is ' + rising + ' there, slope $' + n(m) + '$. Zeros of $f\'$ come from the flat spots of $f$, not from where $f = 0$.' };
        return { ok: false, code: 'zero', why: 'At $x = ' + X + '$ $f$ is ' + rising + ', not flat, so $f\'(' + X + ')$ is not $0$: it is about $' + n(m) + '$.' };
      }
      if(sgn(v) !== sgn(m)){
        if(heightish()) return { ok: false, code: 'height', why: 'You plotted the height $f(' + X + ') = ' + n(fx) + '$. Plot the slope: $f$ is ' + rising + ' at $x = ' + X + '$, so $f\'(' + X + ')$ is about $' + n(m) + '$.' };
        return { ok: false, code: 'sign', why: '$f$ is ' + rising + ' at $x = ' + X + '$, so $f\'(' + X + ')$ is ' + (m > 0 ? 'positive: put it above the axis.' : 'negative: put it below the axis.') };
      }
      if(Math.abs(v - m) <= tol) return { ok: true, code: 'ok' };
      if(heightish()) return { ok: false, code: 'height', why: 'You plotted the height $f(' + X + ') = ' + n(fx) + '$. Plot the slope: about $' + n(m) + '$.' };
      return { ok: false, code: Math.abs(v) > Math.abs(m) ? 'steep' : 'shallow', why: 'Right sign, but ' + (Math.abs(v) > Math.abs(m) ? 'too far from the axis: $f$ is not that steep' : 'too close to the axis: $f$ is steeper than that') + ' at $x = ' + X + '$. Its slope there is about $' + n(m) + '$.' };
    });
    return { ok: pts.every(function(p){ return p.ok; }), points: pts };
  }

  /* 5. Write the tangent line (2.2; with the power rule 2.5; with sin, cos,
     eˣ, ln x 2.7). */
  var TRANS = [
    { g: 'e^x', tex: 'e^x', a: 0, aT: { typed: '0', tex: '0', v: 0 }, fa: 1, m: 1, faT: null, mT: null, x: [-3, 2.5] },
    { g: 'ln(x)', tex: '\\ln x', a: 1, aT: { typed: '1', tex: '1', v: 1 }, fa: 0, m: 1, x: [-0.5, 4.5] },
    { g: 'sin(x)', tex: '\\sin x', a: 0, aT: { typed: '0', tex: '0', v: 0 }, fa: 0, m: 1, x: [-4, 4] },
    { g: 'sin(x)', tex: '\\sin x', a: PI, aT: { typed: 'pi', tex: '\\pi', v: PI }, fa: 0, m: -1, x: [-0.5, 6.5] },
    { g: 'cos(x)', tex: '\\cos x', a: PI / 2, aT: { typed: 'pi/2', tex: '\\frac{\\pi}{2}', v: PI / 2 }, fa: 0, m: -1, x: [-1.5, 4.5] },
    { g: 'e^x', tex: 'e^x', a: 1, aT: { typed: '1', tex: '1', v: 1 }, fa: Math.E, m: Math.E, faT: 'e', mT: 'e', x: [-2, 2.5] },
    { g: 'ln(x)', tex: '\\ln x', a: Math.E, aT: { typed: 'e', tex: 'e', v: Math.E }, fa: 1, m: 1 / Math.E, mT: '1/e', mTex: '\\frac{1}{e}', x: [-0.5, 6] }
  ];
  function genTanline(r, ctx){
    var src = ctx.source || 'given', a, fa, m, text, steps = [], fig, sol = [], fstr = null, L, guard = 0;
    if(src === 'given'){
      var xsT, fT, dT;
      do {
        a = r.pick([-2, -1, 1, 2, 3]); fa = r.int(-5, 5); m = r.pick([-4, -3, -2, -1.5, -0.5, 0.5, 1.5, 2, 3, 4]);
        xsT = [a - 1, a, a + 2]; fT = [r.int(-6, 6), fa, r.int(-6, 6)]; dT = [r.pick([-3, -1, 0, 2, 5]), m, r.pick([-2, 1, 3, 6])];
      } while(guard++ < 100 && (fa === m || fa === 0 || dT[0] === m || dT[2] === m || fT[0] === fT[2] || Math.abs(fa - a) < 1e-9));
      var avg = (fT[2] - fT[0]) / 3;
      var opts = [m, fa, dT[2], avg], whys = [
        'Right: the slope of the tangent line at $x = ' + a + '$ is the derivative there, $f\'(' + a + ') = ' + n(m) + '$.',
        'That is $f(' + a + ')$, the height of the point of tangency. The slope is the derivative, $f\'(' + a + ')$.',
        'That is $f\'(' + (a + 2) + ')$, the slope at another point. Use the row for $x = ' + a + '$.',
        'That is the average rate of change of $f$ from $x = ' + (a - 1) + '$ to $x = ' + (a + 2) + '$, a secant slope. The tangent slope is $f\'(' + a + ')$.'
      ];
      var keep = [0, 1, 2, 3].filter(function(k, j, all){ return all.slice(0, j).every(function(i){ return n(M.round(opts[i], 3)) !== n(M.round(opts[k], 3)); }); });
      var ord = shuffle(r, keep);
      L = line(a, fa, m);
      text = 'The table gives values of the differentiable function $f$ and its derivative $f\'$. Write an equation for the line tangent to the graph of $f$ at $x = ' + a + '$.';
      steps.push(step({ key: 'slope', kind: 'choice', practice: '2.B', label: 'What is the slope of the tangent line at $x = ' + a + '$?', options: ord.map(function(k){ return '$' + n(M.round(opts[k], 3)) + '$'; }), why: ord.map(function(k){ return whys[k]; }), correct: ord.indexOf(0) }));
      fig = { kind: 'given', xs: xsT, f: fT, d: dT, a: a, plot: { label: 'The point of tangency (' + a + ', ' + fa + ') on a grid, with your line drawn as you type', x: [a - 4, a + 4], y: [fa - 5, fa + 5], xStep: 1, yStep: 1, xLabel: 'x', yLabel: 'y', points: [{ at: [a, fa], cls: 's1', label: '(' + words(a) + ', ' + words(fa) + ')' }] } };
      sol.push('The slope is $f\'(' + a + ') = ' + n(m) + '$ and the line passes through $(' + a + ', f(' + a + ')) = (' + a + ', ' + fa + ')$.');
    } else if(src === 'power'){
      var nn, cc, bb, dd;
      do { nn = r.pick([2, 3]); cc = r.pick([-2, -1, 1, 2, 3]); bb = r.int(-3, 3); dd = r.int(-4, 4); a = r.pick([-2, -1, 1, 2]);
        fa = cc * Math.pow(a, nn) + bb * a + dd; m = cc * nn * Math.pow(a, nn - 1) + bb;
      } while(guard++ < 100 && (m === 0 || fa === m || Math.abs(fa) > 20 || cc * Math.pow(a, nn - 1) + bb === m));
      var tx = (cc === 1 ? '' : cc === -1 ? '-' : cc) + 'x^' + nn + (bb ? (bb > 0 ? ' + ' : ' - ') + (Math.abs(bb) === 1 ? '' : Math.abs(bb)) + 'x' : '') + (dd ? (dd > 0 ? ' + ' : ' - ') + Math.abs(dd) : '');
      fstr = cc + '*x^' + nn + ' + (' + bb + ')*x + (' + dd + ')';
      L = line(a, fa, m);
      text = 'Let $f(x) = ' + tx + '$. Write an equation for the line tangent to the graph of $f$ at $x = ' + a + '$.';
      steps.push(step({ key: 'value', kind: 'num', d: 3, practice: '1.E', label: 'Find $f(' + a + ')$.', cell: M.cell(fa, 0, [{ value: m, why: 'That is $f\'(' + a + ')$. First find the point: $f(' + a + ')$.' }], 0.001) }));
      steps.push(step({ key: 'slope', kind: 'num', d: 3, practice: '1.C', label: 'Find $f\'(' + a + ')$.', hint: 'Power rule: the derivative of $x^n$ is $nx^{n-1}$.', cell: M.cell(m, 0, [
        { value: cc * Math.pow(a, nn - 1) + bb, why: 'The power rule brings the exponent down: $\\frac{d}{dx}x^' + nn + ' = ' + nn + (nn - 1 === 1 ? 'x' : 'x^' + (nn - 1)) + '$. Multiply by ' + nn + '.' },
        { value: cc * nn * Math.pow(a, nn) + bb, why: 'Lower the exponent by one: $\\frac{d}{dx}x^' + nn + ' = ' + nn + 'x^{' + (nn - 1) + '}$, not $' + nn + 'x^' + nn + '$.' },
        { value: fa, why: 'That is $f(' + a + ')$, the height. The slope is $f\'(' + a + ')$.' }], 0.001) }));
      sol.push('$f(' + a + ') = ' + n(fa) + '$.', '$f\'(x) = ' + (cc * nn === 1 ? '' : cc * nn === -1 ? '-' : cc * nn) + (nn - 1 === 1 ? 'x' : 'x^' + (nn - 1)) + (bb ? (bb > 0 ? ' + ' : ' - ') + Math.abs(bb) : '') + '$, so $f\'(' + a + ') = ' + n(m) + '$.');
      // y window: the curve near a, at most 9 above or below the point.
      var lo = fa - 3, hi = fa + 3, fq = function(x){ return cc * Math.pow(x, nn) + bb * x + dd; };
      for(var xq = a - 3; xq <= a + 3.001; xq += 0.25){ var vq = fq(xq); lo = Math.min(lo, Math.max(fa - 9, vq)); hi = Math.max(hi, Math.min(fa + 9, vq)); }
      lo = Math.floor(lo - 1); hi = Math.ceil(hi + 1);
      fig = { kind: 'formula', tex: 'f(x) = ' + tx, plot: { label: 'The graph of f with the point of tangency at x = ' + a + ', and your line drawn as you type', x: [a - 3, a + 3], y: [lo, hi], xStep: 1, yStep: hi - lo > 12 ? 2 : 1, xLabel: 'x', yLabel: 'y', curves: [{ fn: fstr, cls: 's1', label: 'f' }], points: [{ at: [a, fa], cls: 's1' }] } };
    } else {
      var T = r.pick(TRANS), k = r.pick([1, 1, 2, 3]);
      a = T.a; fa = k * T.fa; m = k * T.m;
      var kT = k === 1 ? '' : String(k), faT = T.faT ? { typed: kT + T.faT, tex: kT + T.faT, v: fa } : fa, mT = T.mT ? { typed: (k === 1 ? T.mT : (T.mT === '1/e' ? k + '/e' : kT + T.mT)), tex: T.mTex ? (k === 1 ? T.mTex : '\\frac{' + k + '}{e}') : kT + T.mT, v: m } : m;
      L = line(T.aT, faT, mT);
      fstr = (k === 1 ? '' : k + '*') + T.g;
      var fx = (k === 1 ? '' : k) + T.tex, aTex = T.aT.tex;
      text = 'Let $f(x) = ' + fx + '$. Write an equation for the line tangent to the graph of $f$ at $x = ' + aTex + '$.';
      steps.push(step({ key: 'value', kind: 'num', d: 3, practice: '1.E', label: 'Find $f(' + aTex + ')$.', hint: 'Three decimal places if it is not a whole number.', cell: M.cell(fa, 0, Math.abs(fa - m) > 1e-9 ? [{ value: m, why: 'That is $f\'(' + aTex + ')$. First find the point: $f(' + aTex + ')$.' }] : [], 0.001) }));
      var dTex = { 'e^x': 'e^x', 'ln(x)': '\\frac{1}{x}', 'sin(x)': '\\cos x', 'cos(x)': '-\\sin x' }[T.g];
      var wrongD = { 'sin(x)': { value: -m, why: 'The derivative of $\\sin x$ is $\\cos x$, with no minus sign.' }, 'cos(x)': { value: -m, why: 'The derivative of $\\cos x$ is $-\\sin x$: keep the minus sign.' }, 'ln(x)': { value: k * Math.log(T.a), why: 'That is $\\ln$ again. The derivative of $\\ln x$ is $\\frac{1}{x}$.' }, 'e^x': null }[T.g];
      var mks = []; if(wrongD && Math.abs(wrongD.value - m) > 1e-6) mks.push(wrongD); if(Math.abs(fa - m) > 1e-6) mks.push({ value: fa, why: 'That is $f(' + aTex + ')$, the height. The slope is $f\'(' + aTex + ')$.' });
      steps.push(step({ key: 'slope', kind: 'num', d: 3, practice: '1.C', label: 'Find $f\'(' + aTex + ')$.', hint: 'Three decimal places if it is not a whole number.', cell: M.cell(m, 0, mks, 0.001) }));
      sol.push('$f(' + aTex + ') = ' + (T.faT ? (kT + T.faT) + ' \\approx ' + n(M.round(fa, 3)) : n(fa)) + '$.', '$f\'(x) = ' + (k === 1 ? '' : k) + (k !== 1 && dTex.charAt(0) === '-' ? '(' + dTex + ')' : dTex) + '$, so $f\'(' + aTex + ') = ' + (T.mT ? (T.mTex && k === 1 ? T.mTex : mT.tex) + ' \\approx ' + n(M.round(m, 3)) : n(m)) + '$.');
      var lo = Math.min(fa - 3, -2), hi = Math.max(fa + 3, 2);
      fig = { kind: 'formula', tex: 'f(x) = ' + fx, plot: { label: 'The graph of f with the point of tangency, and your line drawn as you type', x: T.x, y: [Math.floor(lo), Math.ceil(hi)], xStep: 1, yStep: 1, piX: T.g === 'sin(x)' || T.g === 'cos(x)', xLabel: 'x', yLabel: 'y', curves: [{ fn: fstr, cls: 's1', label: 'f' }], points: [{ at: [a, fa], cls: 's1' }] } };
    }
    // The line, typed. Mistakes: slope and height swapped, (x + a), no shift.
    var A = typeof a === 'number' ? a : a.v, mk = [];
    function addMk(expr, why){ mk.push({ expr: expr, why: why }); }
    // Full precision, so a mistake written with e or π matches exactly.
    var nA = String(A), nfa = String(fa), nm = String(m);
    if(Math.abs(fa - m) > 1e-9) addMk('(' + nm + ') + (' + nfa + ')*(x - (' + nA + '))', 'The slope and the height are swapped. The line is $y = f(a) + f\'(a)(x - a)$: the slope $f\'(a)$ multiplies $(x - a)$.');
    if(A !== 0) addMk('(' + nfa + ') + (' + nm + ')*(x + (' + nA + '))', 'Check the sign inside the parentheses: the line passes through $x = ' + (aTex || (typeof a === 'number' ? n(A) : 'a')) + '$, so it is $(x - a)$ with $a$ subtracted.');
    if(A !== 0) addMk('(' + nfa + ') + (' + nm + ')*x', 'That line has the right slope but passes through $(0, f(a))$. Shift it: $y = f(a) + f\'(a)(x - a)$.');
    var exprStep = step({ key: 'line', kind: 'expr', practice: '4.C', label: 'Write the equation of the tangent line.', hint: 'Point-slope form: $y = f(a) + f\'(a)(x - a)$.', lhs: 'y =',
      cell: M.exprCell(L.typed, { vars: ['x'], domain: [A - 3, A + 3], mistakes: mk }), line: { a: A, fa: fa, m: m } });
    steps.push(exprStep);
    sol.push('Point-slope form: $' + L.tex + '$.');
    return { ctx: ctx.id, topic: ctx.topic, type: 'tanline', source: src, text: text, steps: steps, solution: sol, fig: fig, line: L, fn: fstr, a: A, fa: fa, m: m };
  }

  /* 6. Where is f not differentiable, and why? (2.4) */
  var KINDS = {
    corner: { word: 'a corner', why: 'the slopes from the left and from the right are different' },
    cusp: { word: 'a cusp', why: 'the slopes go to $-\\infty$ on one side and $+\\infty$ on the other' },
    vertical: { word: 'a vertical tangent', why: 'the tangent line is vertical: its slope is infinite' },
    jump: { word: 'a jump', why: 'f is not continuous there' },
    hole: { word: 'a hole', why: 'f is not continuous there' }
  };
  function genNotDiff(r, ctx){
    var kind = r.pick(['corner', 'corner', 'cusp', 'vertical', 'jump', 'hole']), al, t, be, c, g, curves, points = [], f, guard = 0, s, J, kk, marks, turn = null;
    for(;;){
      guard++;
      al = r.pick([0.15, -0.15, 0.2, -0.2, 0.25, -0.25]); t = r.int(-3, 3); be = r.int(-2, 2); c = r.int(-3, 3);
      if(Math.abs(c - t) < 2) continue;
      g = [be, 0, al]; var gs = polyStr(g, t), gv = function(x){ return polyVal(g, t, x); }, gd = function(x){ return 2 * al * (x - t); };
      var gc = gv(c); if(Math.abs(gc) > 3) continue;
      var tLeft = t < c, keepD = tLeft ? [-5, c] : [c, 5], otherD = tLeft ? [c, 5] : [-5, c];
      if(kind === 'corner'){
        s = r.pick([-2, -1.5, -1, 1, 1.5, 2]); if(Math.abs(s - gd(c)) < 1) continue;
        var other = n(gc) + ' + (' + n(s) + ')*(x - (' + c + '))';
        f = function(x){ return (tLeft ? x <= c : x >= c) ? gv(x) : gc + s * (x - c); };
        curves = [{ fn: gs, domain: keepD, cls: 's1' }, { fn: other, domain: otherD, cls: 's1' }];
      } else if(kind === 'jump'){
        J = r.pick([-2, -1.5, 1.5, 2]);
        f = function(x){ return (tLeft ? x <= c : x >= c) ? gv(x) : gv(x) + J; };
        curves = [{ fn: gs, domain: keepD, cls: 's1' }, { fn: gs + ' + (' + n(J) + ')', domain: otherD, cls: 's1' }];
        points.push({ at: [c, gc], cls: 's1' }, { at: [c, gc + J], open: true, cls: 's1' });
      } else if(kind === 'hole'){
        J = r.pick([-1.5, 1.5, 2, -2]);
        f = function(x){ return x === c ? gc + J : gv(x); };
        curves = [{ fn: gs, cls: 's1' }];
        points.push({ at: [c, gc], open: true, cls: 's1' }, { at: [c, gc + J], cls: 's1' });
      } else {
        kk = r.pick([0.8, -0.8, 1, -1]);
        var piece = kind === 'vertical' ? 'cbrt(x - (' + c + '))' : 'cbrt(x - (' + c + '))^2';
        f = kind === 'vertical' ? function(x){ return gv(x) + kk * cbrt(x - c); } : function(x){ var q = cbrt(x - c); return gv(x) + kk * q * q; };
        curves = [{ fn: gs + ' + (' + n(kk) + ')*' + piece, cls: 's1' }];
      }
      // Marked x-values: c and three smooth integers, with a flat smooth
      // turning point among them when f has one (the trap: f' = 0 exists).
      var ok = function(x){ return x >= -4 && x <= 4 && Math.abs(x - c) >= 1.5 && isFinite(f(x)) && Math.abs(f(x)) <= 4.2; };
      var turnOk = (kind === 'corner' || kind === 'jump' || kind === 'hole') && ok(t) ? t : null;
      marks = [c]; if(turnOk != null) marks.push(turnOk);
      var cand = shuffle(r, [-4, -3, -2, -1, 0, 1, 2, 3, 4]).filter(ok);
      for(var j = 0; j < cand.length && marks.length < 4; j++) if(marks.every(function(m0){ return Math.abs(m0 - cand[j]) >= 1.5; })) marks.push(cand[j]);
      if(marks.length < 4 || guard > 300) { if(guard > 300) break; continue; }
      turn = turnOk;
      break;
    }
    marks.sort(function(x, y){ return x - y; });
    var K = KINDS[kind], Lc = classify(f, c);
    var LS = kind === 'corner' ? (tLeft ? gd(c) : s) : null, RS = kind === 'corner' ? (tLeft ? s : gd(c)) : null;
    var whyAt = function(x){
      if(x === c) return 'Right: at $x = ' + c + '$ the graph has ' + K.word + ', so $f\'(' + c + ')$ does not exist.';
      if(x === turn) return 'At $x = ' + x + '$ the tangent is flat: $f\'(' + x + ') = 0$. A derivative of $0$ still exists, so $f$ is differentiable there.';
      return 'Near $x = ' + x + '$ the graph is smooth: zoom in and it looks like a straight line, so $f\'(' + x + ')$ exists.';
    };
    var reasons = {
      corner: { t: 'The slopes from the left and from the right are different (a corner).', w: 'Right: from the left the slope is $' + n(LS) + '$, from the right $' + n(RS) + '$. They disagree, so the limit of the difference quotient does not exist.' },
      cusp: { t: 'The slopes go to $-\\infty$ on one side and $+\\infty$ on the other (a cusp).', w: 'Right: the graph comes to a sharp point whose sides get steeper and steeper in opposite directions.' },
      vertical: { t: 'The tangent line is vertical: the slope is infinite.', w: 'Right: the difference quotients grow without bound from both sides, so there is no finite slope.' },
      gap: { t: '$f$ is not continuous there.', w: kind === 'hole' ? 'Right: the curve has a hole at $x = ' + c + '$ and $f(' + c + ')$ sits off the curve. A function must be continuous to be differentiable.' : 'Right: the graph jumps at $x = ' + c + '$. A function must be continuous to be differentiable.' },
      flat: { t: '$f\'(' + c + ') = 0$, so the derivative does not exist.', w: 'A derivative of $0$ is a derivative: it means a flat tangent. That is not why $f$ fails here.' }
    };
    var rk = kind === 'jump' || kind === 'hole' ? 'gap' : kind;
    var wrongW = {
      // Each wrong reason, worded for what the graph actually has at c.
      corner: kind === 'cusp' ? 'A corner has two different finite slopes. Here the slopes do not settle on any finite value: they grow without bound, in opposite directions.' : kind === 'vertical' ? 'A corner has two different finite slopes. Here both sides get steeper and steeper in the same direction: a vertical tangent.' : kind === 'corner' ? '' : 'A corner is an unbroken graph with two different slopes. Here the graph itself breaks.',
      cusp: kind === 'vertical' ? 'At a cusp the two sides turn steep in opposite directions (one up, one down). Here both sides go the same way, so the tangent is vertical.' : 'The sides of the graph do not get infinitely steep here.',
      vertical: kind === 'cusp' ? 'At a vertical tangent both sides go steep in the same direction. Here they go in opposite directions: a cusp.' : 'The tangent is not vertical here.',
      gap: 'f is continuous at $x = ' + c + '$: there is no hole or jump. Something else breaks the derivative.'
    };
    var pool = ['corner', 'cusp', 'vertical', 'gap'].filter(function(k){ return k !== rk; });
    var rOpts = shuffle(r, [rk, 'flat'].concat(shuffle(r, pool).slice(0, 2)));
    var cont = !(kind === 'jump' || kind === 'hole');
    var yr = [-5, 5];
    return {
      ctx: ctx.id, topic: ctx.topic, type: 'notdiff', kind: kind,
      text: 'The graph of $f$ is shown. Four $x$-values are marked with dashed lines. At exactly one of them $f$ is not differentiable.',
      steps: [
        step({ key: 'where', kind: 'choice', practice: '2.B', label: 'At which marked $x$-value is $f$ not differentiable?', options: marks.map(function(x){ return '$x = ' + x + '$'; }), why: marks.map(whyAt), correct: marks.indexOf(c), fixed: true }),
        step({ key: 'why', kind: 'choice', practice: '3.E', level: 'analyze', label: 'Why is $f$ not differentiable at $x = ' + c + '$?', options: rOpts.map(function(k){ return reasons[k].t; }), why: rOpts.map(function(k){ return k === rk ? reasons[k].w : k === 'flat' ? reasons.flat.w : wrongW[k]; }), correct: rOpts.indexOf(rk), mark: { kind: 'zoom', x: c } }),
        step({ key: 'continuous', kind: 'choice', practice: '3.D', level: 'analyze', label: 'Is $f$ continuous at $x = ' + c + '$?', options: ['Yes', 'No'], fixed: true, correct: cont ? 0 : 1,
          why: cont ? ['Right: the graph has no break at $x = ' + c + '$. Continuous does not guarantee differentiable: ' + K.word + ' is continuous but has no tangent slope.', 'The graph has no break at $x = ' + c + '$: ' + K.word + ' is continuous. It fails to be differentiable for another reason.']
            : ['The graph breaks at $x = ' + c + '$ (' + K.word + '), so $f$ is not continuous there.', 'Right: ' + K.word + ' is a break. And since differentiable implies continuous, a function that is not continuous cannot be differentiable.'] })
      ],
      solution: [
        'At $x = ' + c + '$ the graph has ' + K.word + '. At the other marked $x$-values the graph is smooth' + (turn != null ? ', including the flat tangent at $x = ' + turn + '$, where $f\'(' + turn + ') = 0$ exists' : '') + '.',
        kind === 'corner' ? 'The one-sided slopes are $' + n(LS) + '$ from the left and $' + n(RS) + '$ from the right. They disagree, so $\\lim_{h \\to 0} \\frac{f(' + c + ' + h) - f(' + c + ')}{h}$ does not exist.' : 'The difference quotient at $x = ' + c + '$ has no finite limit: ' + K.why + '.',
        cont ? '$f$ is continuous at $x = ' + c + '$ but not differentiable: continuity does not imply differentiability.' : 'Differentiable implies continuous. $f$ is not continuous at $x = ' + c + '$, so it cannot be differentiable there.'
      ],
      fig: { kind: 'graph', label: 'The graph of f with four marked x-values, one where f is not differentiable', x: [-5, 5], y: yr, xStep: 1, yStep: 1, xLabel: 'x', yLabel: marks.indexOf(0) > -1 ? '' : 'y',
        curves: curves, points: points, lines: marks.map(function(x){ return { through: [[x, -100], [x, 100]], cls: 'tt-guide', dashed: true }; }), labels: marks.map(function(x){ return { at: [x + 0.12, 4.45], text: 'x = ' + words(x), anchor: 'start' }; }) },
      f: f, c: c, marks: marks, turn: turn, cls: Lc, LS: LS, RS: RS
    };
  }

  var GEN = { estimate: genEstimate, table: genTable, whichgraph: genWhich, sketch: genSketch, tanline: genTanline, notdiff: genNotDiff };
  function generate(r, ctx, type){
    var types = ctx.types || [ctx.type || 'estimate'];
    var t = type && types.indexOf(type) > -1 ? type : r.pick(types);
    return GEN[t](r, ctx);
  }

  M.register('tangentTracer', {
    FUNCS: FUNCS, ORDER: ORDER, HS: HS, HMIN: HMIN, HMAX: HMAX, TYPES: TYPES, KINDS: KINDS,
    custom: custom, dq: dq, table: table, classify: classify, slopeAt: slopeAt, hOf: hOf, sOf: sOf, line: line,
    generate: generate, gradeSketch: gradeSketch, polyVal: polyVal, polyStr: polyStr, n: n, cbrt: cbrt
  });
})();
