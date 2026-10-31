/* Polar graphs model: ApPrecalcMath.polarGraphs (docs/apprecalc-architecture.md, "Tools").
   OWNED BY THIS TOOL ONLY (builder T4, docs/apprecalc-briefs/t4.md): no other tool edits this
   file, and this tool edits no shared file. Pure functions, no DOM, so the
   validator (scripts/lib/apprecalc-tool-checks/polar-graphs.mjs) and the test
   (scripts/test/apprecalc-tool-polar-graphs.test.mjs) run exactly this code.

   Curves (the Explore pane and the drills):
     rose      r = a cos(nθ) or a sin(nθ)       n petals (n odd) or 2n (n even)
     limacon   r = a + b cos θ or a + b sin θ   inner loop (|a| < |b|), cardioid
                                                (|a| = |b|), no loop (|a| > |b|)
     circle    r = a cos θ, a sin θ, or a       a circle of diameter |a| through the
                                                origin, or centred on it
   curve(spec) -> { spec, f(θ), slope(θ) (how fast r changes, exact, for the
   pieces; never shown as a word), tex, name, shape, maxR, breaks, period }.
   pieces(c) cuts [0, 2π] where r = 0 or r turns, and says on each piece
   whether r is positive or negative, rising or falling, and so whether the
   distance |r| from the origin is increasing or decreasing.

   Angles in the drills are k·π/12; exact values (p + q√s) come from
   exact(k) so the worked solutions print exact forms.

   generate(rng, ctx, type) -> { ctx, topic, type, title, text, steps,
   solution, fig, values } for the "Test yourself" drill. Kinds:
     convert  polar to rectangular (with negative r) and back (the quadrant of θ)
     graph    r at an angle, the shape (petals, loop), the greatest distance
     rates    the average rate of change of r over an interval, the signs of r
              and of its change, and whether the distance from the origin is
              increasing or decreasing (negative r is the trap) */
(function(G){
  'use strict';
  var M = G.ApPrecalcMath;
  if(!M) return;
  var PI = Math.PI, TAU = 2 * PI;
  function H(s){ return G.ApPrecalcTex ? G.ApPrecalcTex.html(s, { strict: true }) : s; }
  function escT(s){ return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function optHtml(t){
    if(String(t).indexOf('$') < 0 || !G.ApPrecalcTex) return '<span class="cd-opt-t">' + H(t) + '</span>';
    return '<span class="cd-opt-t"><span class="sr-only">' + escT(G.ApPrecalcTex.plain(t)) + '</span><span aria-hidden="true">' + H(t) + '</span></span>';
  }
  /* A number as short text: an integer as is, else up to d decimals. */
  function n(x, d){
    if(Math.abs(x - Math.round(x)) < 1e-9) return String(Math.round(x));
    var s = M.fixed(x, d == null ? 3 : d).replace(/0+$/, '').replace(/\.$/, '');
    return s === '-0' ? '0' : s;
  }
  function gcd(a, b){ a = Math.abs(a); b = Math.abs(b); while(b){ var t = a % b; a = b; b = t; } return a || 1; }

  /* ------------------------------------------------------- angles */
  /* k·π/12 as TeX and text: 0, π/6, π/4, 2π/3, π, 7π/4, 2π. */
  function piTex(k){
    if(k === 0) return '0';
    var g = gcd(k, 12), num = k / g, den = 12 / g, neg = num < 0; num = Math.abs(num);
    var top = (num === 1 ? '' : num) + '\\pi';
    return (neg ? '-' : '') + (den === 1 ? top : '\\frac{' + top + '}{' + den + '}');
  }
  function piText(k){
    if(k === 0) return '0';
    var g = gcd(k, 12), num = k / g, den = 12 / g, neg = num < 0; num = Math.abs(num);
    return (neg ? '−' : '') + (num === 1 ? '' : num) + 'π' + (den === 1 ? '' : '/' + den);
  }
  /* An angle in radians as text: a multiple of π/12 prints as one, else 2 decimals. */
  function angleText(t){
    var k = t / (PI / 12);
    if(Math.abs(k - Math.round(k)) < 1e-6) return piText(Math.round(k));
    return M.fixed(t, 2).replace(/^-/, '−');
  }
  function angleTex(t){
    var k = t / (PI / 12);
    if(Math.abs(k - Math.round(k)) < 1e-6) return piTex(Math.round(k));
    return M.fixed(t, 2);
  }

  /* ------------------------------------------------- exact values */
  /* p + q√s with p, q rational [num, den] and s in {1, 2, 3} (s = 1: q is 0). */
  function rat(a, b){ b = b || 1; if(b < 0){ a = -a; b = -b; } var g = gcd(a, b); return [a / g, b / g]; }
  function radd(x, y){ return rat(x[0] * y[1] + y[0] * x[1], x[1] * y[1]); }
  function rmul(x, y){ return rat(x[0] * y[0], x[1] * y[1]); }
  function ex(p, q, s){ q = q || [0, 1]; if(!q[0] || s === 1){ return { p: s === 1 ? radd(p, q) : p, q: [0, 1], s: 1 }; } return { p: p, q: q, s: s }; }
  /* cos(kπ/12) exactly, for k a multiple of 2 or 3 (null otherwise). */
  function cosExact(k){
    k = ((k % 24) + 24) % 24;
    var T = { 0: [[1, 1], 0, 1], 2: [[0, 1], [1, 2], 3], 3: [[0, 1], [1, 2], 2], 4: [[1, 2], 0, 1], 6: [[0, 1], 0, 1] };
    var sgn = 1, m = k;
    if(m > 12) m = 24 - m;                  // cos(2π − t) = cos t
    if(m > 6){ m = 12 - m; sgn = -1; }      // cos(π − t) = −cos t
    var e = T[m];
    if(!e) return null;
    var p = rat(sgn * e[0][0], e[0][1]), q = e[1] ? rat(sgn * e[1][0], e[1][1]) : [0, 1];
    return ex(p, q, e[2]);
  }
  function sinExact(k){ return cosExact(6 - k); }
  function eAdd(a, b){
    if(a.s !== 1 && b.s !== 1 && a.s !== b.s) return null;
    var s = a.s !== 1 ? a.s : b.s;
    return ex(radd(a.p, b.p), radd(a.q, b.q), s);
  }
  function eMul(a, c){ return ex(rmul(a.p, c), rmul(a.q, c), a.s); }   // times a rational c
  function eInt(v){ return ex(rat(v, 1), [0, 1], 1); }
  function eVal(a){ return a.p[0] / a.p[1] + (a.s === 1 ? 0 : a.q[0] / a.q[1] * Math.sqrt(a.s)); }
  function ratTex(x){ return x[1] === 1 ? String(x[0]) : (x[0] < 0 ? '-' : '') + '\\frac{' + Math.abs(x[0]) + '}{' + x[1] + '}'; }
  function eTex(a){
    var hasQ = a.s !== 1 && a.q[0], hasP = a.p[0] !== 0;
    if(!hasQ) return ratTex(a.p);
    var qn = Math.abs(a.q[0]), qd = a.q[1], root = '\\sqrt{' + a.s + '}';
    var qt = qd === 1 ? (qn === 1 ? '' : qn) + root : '\\frac{' + (qn === 1 ? '' : qn) + root + '}{' + qd + '}';
    if(!hasP) return (a.q[0] < 0 ? '-' : '') + qt;
    return ratTex(a.p) + (a.q[0] < 0 ? ' - ' : ' + ') + qt;
  }
  /* What a student would type for an exact value: 2sqrt(3), -3sqrt(2)/2. */
  function eTyped(a){
    var hasQ = a.s !== 1 && a.q[0];
    var r = function(x){ return x[1] === 1 ? String(x[0]) : x[0] + '/' + x[1]; };
    if(!hasQ) return r(a.p);
    var qn = Math.abs(a.q[0]), qd = a.q[1], qt = (qn === 1 ? '' : qn) + 'sqrt(' + a.s + ')' + (qd === 1 ? '' : '/' + qd);
    return (a.p[0] ? r(a.p) + (a.q[0] < 0 ? ' - ' : ' + ') : a.q[0] < 0 ? '-' : '') + qt;
  }

  /* ------------------------------------------------------- curves */
  /* spec: { fam: 'rose'|'limacon'|'circle', trig: 'cos'|'sin'|'const', a, b, n } */
  function trigF(t){ return t === 'sin' ? Math.sin : t === 'const' ? function(){ return 1; } : Math.cos; }
  function curve(spec){
    var fam = spec.fam, a = spec.a, b = spec.b || 0, nn = spec.n || 1, tg = spec.trig || 'cos', T = trigF(tg);
    var f, slope, tex, breaks = [], shape, name, maxR, period = TAU;
    var tf = function(arg){ return tg === 'const' ? '' : '\\' + tg + arg; };
    if(fam === 'rose'){
      f = function(t){ return a * T(nn * t); };
      slope = tg === 'sin' ? function(t){ return a * nn * Math.cos(nn * t); } : function(t){ return -a * nn * Math.sin(nn * t); };
      tex = 'r = ' + coefTex(a) + tf('(' + nn + '\\theta)');
      // r = 0 and r turning: every quarter of a petal, at multiples of π/(2n)
      for(var k = 0; k <= 4 * nn; k++) breaks.push(k * PI / (2 * nn));
      var pet = nn % 2 ? nn : 2 * nn;
      shape = pet + '-petal rose'; name = 'Rose';
      maxR = Math.abs(a); period = nn % 2 ? PI : TAU;
    } else if(fam === 'limacon'){
      f = function(t){ return a + b * T(t); };
      slope = tg === 'sin' ? function(t){ return b * Math.cos(t); } : function(t){ return -b * Math.sin(t); };
      tex = 'r = ' + n(a) + (b < 0 ? ' - ' : ' + ') + (Math.abs(b) === 1 ? '' : n(Math.abs(b))) + tf('\\theta');
      breaks = tg === 'sin' ? [0, PI / 2, 3 * PI / 2, TAU] : [0, PI, TAU];
      if(b && Math.abs(a / b) <= 1){
        var z = tg === 'sin' ? Math.asin(-a / b) : Math.acos(-a / b);
        var zs = tg === 'sin' ? [z, PI - z] : [z, TAU - z];
        zs.forEach(function(x){ breaks.push(((x % TAU) + TAU) % TAU); });
      }
      var A = Math.abs(a), B = Math.abs(b);
      shape = A < B - 1e-12 ? 'limaçon with an inner loop' : Math.abs(A - B) < 1e-12 ? 'cardioid' : A < 2 * B ? 'limaçon with a dimple' : 'convex limaçon';
      name = Math.abs(A - B) < 1e-12 ? 'Cardioid' : 'Limaçon';
      maxR = A + B;
    } else {
      if(tg === 'const'){ f = function(){ return a; }; slope = function(){ return 0; }; tex = 'r = ' + n(a); shape = 'circle of radius ' + n(Math.abs(a)) + ' centred at the origin'; breaks = [0, TAU]; }
      else {
        f = function(t){ return a * T(t); };
        slope = tg === 'sin' ? function(t){ return a * Math.cos(t); } : function(t){ return -a * Math.sin(t); };
        tex = 'r = ' + coefTex(a) + tf('\\theta');
        for(var j = 0; j <= 4; j++) breaks.push(j * PI / 2);
        shape = 'circle of diameter ' + n(Math.abs(a)) + ' through the origin';
        period = PI;
      }
      name = 'Circle'; maxR = Math.abs(a);
    }
    breaks = uniq(breaks.concat([0, TAU]).filter(function(x){ return x >= -1e-12 && x <= TAU + 1e-12; }).map(function(x){ return Math.min(TAU, Math.max(0, x)); }));
    return { spec: spec, f: f, slope: slope, tex: tex, breaks: breaks, shape: shape, name: name, maxR: maxR, period: period };
  }
  function coefTex(a){ return a === 1 ? '' : a === -1 ? '-' : n(a); }
  function uniq(xs){
    xs = xs.slice().sort(function(p, q){ return p - q; });
    return xs.filter(function(x, i){ return !i || Math.abs(x - xs[i - 1]) > 1e-9; });
  }
  /* The pieces of [0, 2π] between the breaks: the sign of r, whether r rises
     or falls, and whether the distance |r| from the origin increases. */
  function pieces(c){
    var out = [], bs = c.breaks;
    for(var i = 0; i < bs.length - 1; i++){
      var a = bs[i], b = bs[i + 1], m = (a + b) / 2, r = c.f(m), s = c.slope(m);
      var rs = Math.abs(r) < 1e-12 ? 0 : Math.sign(r), ds = Math.abs(s) < 1e-12 ? 0 : Math.sign(s);
      out.push({ a: a, b: b, rs: rs, ds: ds, dist: rs * ds > 0 ? 'away' : rs * ds < 0 ? 'toward' : 'steady' });
    }
    return out;
  }
  function pieceAt(c, t){ var ps = pieces(c); for(var i = 0; i < ps.length; i++) if(t >= ps[i].a - 1e-12 && t <= ps[i].b + 1e-12) return ps[i]; return ps[ps.length - 1]; }
  function rect(r, t){ return [r * Math.cos(t), r * Math.sin(t)]; }
  /* Polar coordinates with r ≥ 0 and θ in [0, 2π). */
  function polar(x, y){ var r = Math.hypot(x, y), t = Math.atan2(y, x); if(t < 0) t += TAU; if(Math.abs(t - TAU) < 1e-12) t = 0; return [r, t]; }
  function avgRate(c, t1, t2){ return (c.f(t2) - c.f(t1)) / (t2 - t1); }
  /* The quadrant of a point (0 when it is on an axis). */
  function quadrant(x, y){ if(Math.abs(x) < 1e-9 || Math.abs(y) < 1e-9) return 0; return x > 0 ? (y > 0 ? 1 : 4) : (y > 0 ? 2 : 3); }
  /* Exact r(kπ/12), or null when the trig value is not exact. */
  function rExact(spec, k){
    var tg = spec.trig || 'cos', fn = tg === 'sin' ? sinExact : cosExact;
    if(spec.fam === 'rose'){ var e = fn(spec.n * k); return e && eMul(e, rat(spec.a)); }
    if(spec.fam === 'limacon'){ var e2 = fn(k); return e2 && eAdd(eInt(spec.a), eMul(e2, rat(spec.b))); }
    if(tg === 'const') return eInt(spec.a);
    var e3 = fn(k); return e3 && eMul(e3, rat(spec.a));
  }

  /* Explore presets (data.curves lists the ones a page offers). */
  var PRESETS = {
    rose: { name: 'Rose', spec: { fam: 'rose', a: 3, n: 3, trig: 'cos' } },
    limacon: { name: 'Limaçon', spec: { fam: 'limacon', a: 1, b: 2, trig: 'cos' } },
    cardioid: { name: 'Cardioid', spec: { fam: 'limacon', a: 2, b: 2, trig: 'cos' } },
    circle: { name: 'Circle', spec: { fam: 'circle', a: 4, trig: 'cos' } }
  };
  var ORDER = ['rose', 'limacon', 'cardioid', 'circle'];

  /* ============================================================ the drill */
  function choice(key, label, list, practice){
    return { key: key, kind: 'choice', label: H(label), options: list.map(function(o){ return optHtml(o[0]); }), why: list.map(function(o){ return H(o[1]); }), correct: 0, practice: practice || '3.A' };
  }
  /* A number step: exact form or three decimals (truncated or rounded). */
  function numStep(key, label, answer, mistakes, o){
    o = o || {};
    var whole = Math.abs(answer - Math.round(answer)) < 1e-9;
    return { key: key, kind: 'num', label: H(label), unit: o.unit || '', practice: o.practice || '1.B', d: whole ? 0 : 3,
      hint: whole ? '' : (o.hint || 'Exact (like 3sqrt(3)/2 or 2pi/3) or correct to three decimal places.'),
      cell: M.cell(answer, 0, (mistakes || []).concat(GENERIC(answer, o.sign)).map(function(m){ return { value: m[0], why: H(m[1]) }; }), 1e-3) };
  }
  /* Slips the shared diagnosis would otherwise name in calculus words: the
     sign, a factor of 2 and a factor of π, in this tool's own words. */
  function GENERIC(a, sign){
    return [[-a, 'The size is right but the sign is wrong. ' + (sign || 'Check the signs of $r$, of $\\cos\\theta$ and of $\\sin\\theta$ in this quadrant, and the order of any subtraction.')],
      [2 * a, 'Off by a factor of 2. Check a value such as $\\frac{1}{2}$ or $\\frac{\\sqrt{3}}{2}$ from the unit circle.'],
      [a / 2, 'Off by a factor of 2. Check a value such as $\\frac{1}{2}$ or $\\frac{\\sqrt{3}}{2}$ from the unit circle.'],
      [a * PI, 'Off by a factor of $\\pi$. Check where $\\pi$ belongs: angles carry it, values of $r$ do not.'],
      [a / PI, 'Off by a factor of $\\pi$. Check where $\\pi$ belongs: angles carry it, values of $r$ do not.']];
  }
  /* Keep the options distinct: a repeated text is replaced by the next spare. */
  function distinct(list, pool){
    var seen = [], spare = (pool || []).slice();
    return list.map(function(o){ while(seen.indexOf(o[0]) > -1 && spare.length) o = spare.shift(); seen.push(o[0]); return o; }).filter(function(o, i, all){ return all.findIndex(function(q){ return q[0] === o[0]; }) === i; });
  }
  var QN = ['on an axis', 'Quadrant I', 'Quadrant II', 'Quadrant III', 'Quadrant IV'];
  function exK(r){ return r.pick([2, 3, 4, 8, 9, 10, 14, 15, 16, 20, 21, 22]); }   // not on an axis, exact

  var GEN = {};
  GEN.convert = function(r){
    if(r() < 0.6){
      var R = r.pick([2, 3, 4, 5, 6]) * (r() < 0.35 ? -1 : 1), k = exK(r), t = k * PI / 12;
      var cx = cosExact(k), sx = sinExact(k), X = eMul(cx, rat(R)), Y = eMul(sx, rat(R)), x = eVal(X), y = eVal(Y);
      var q = quadrant(x, y), qT = quadrant(Math.cos(t), Math.sin(t));
      var deg = function(fn){ return R * fn(t * PI / 180); };
      var text = H('<p>A point has polar coordinates $(r, \\theta) = \\left(' + R + ', ' + piTex(k) + '\\right)$. Find its rectangular coordinates $(x, y)$.</p>');
      var negWhy = 'Here $r = ' + R + '$ is negative: the point is ' + Math.abs(R) + ' units from the origin on the ray opposite the angle. Keep the sign: $x = r\\cos\\theta$ with $r = ' + R + '$.';
      var steps = [
        numStep('x', 'Find $x$.', x, (R < 0 ? [[-x, negWhy]] : []).concat([
          [y, 'That is $y = r\\sin\\theta$. For $x$ use $x = r\\cos\\theta$.'],
          [deg(Math.cos), 'That is cosine of ' + piText(k) + ' read in degrees. Precalculus angles are radians: set the calculator to radian mode, or use the exact value of $\\cos ' + piTex(k) + '$.']
        ]), { practice: '2.B' }),
        numStep('y', 'Find $y$.', y, (R < 0 ? [[-y, negWhy.replace('x = r\\cos\\theta', 'y = r\\sin\\theta')]] : []).concat([
          [x, 'That is $x = r\\cos\\theta$. For $y$ use $y = r\\sin\\theta$.'],
          [deg(Math.sin), 'That is sine of ' + piText(k) + ' read in degrees. Use radians.']
        ]), { practice: '2.B' }),
        choice('quad', 'In which quadrant is the point?', distinct([
          [QN[q], R < 0 ? 'Right: with $r < 0$ the point is on the ray opposite $\\theta = ' + piTex(k) + '$, so it is in the quadrant across the origin from that angle. The signs of $x$ and $y$ agree.' : 'Right: $x$ and $y$ have the signs of ' + QN[q] + ', the quadrant of the angle $' + piTex(k) + '$.'],
          [QN[qT], 'That is the quadrant of the angle $' + piTex(k) + '$. With $r < 0$ the point is on the opposite ray: read the signs of $x$ and $y$.'],
          [QN[q % 4 + 1], 'Check the signs: $x = ' + eTex(X) + '$ and $y = ' + eTex(Y) + '$.'],
          [QN[(q + 1) % 4 + 1], 'Check the signs: $x = ' + eTex(X) + '$ and $y = ' + eTex(Y) + '$.']
        ], [[QN[(q + 2) % 4 + 1], 'Check the signs: $x = ' + eTex(X) + '$ and $y = ' + eTex(Y) + '$.']]), '2.A')
      ];
      var sol = ['$x = r\\cos\\theta = ' + R + '\\cos ' + piTex(k) + ' = ' + eTex(X) + (X.s === 1 ? '' : ' \\approx ' + n(x)) + '$.',
        '$y = r\\sin\\theta = ' + R + '\\sin ' + piTex(k) + ' = ' + eTex(Y) + (Y.s === 1 ? '' : ' \\approx ' + n(y)) + '$.',
        'So $(x, y) = \\left(' + eTex(X) + ', ' + eTex(Y) + '\\right)$, in ' + QN[q] + (R < 0 ? ': $r < 0$ puts the point on the ray opposite the angle.' : '.')];
      return { text: text, steps: steps, solution: sol, variant: 'toRect', fig: { kind: 'convert', r: R, t: t, x: x, y: y, rmax: Math.abs(R) }, values: { r: R, k: k, x: x, y: y, q: q } };
    }
    var R2 = r.pick([2, 3, 4, 5, 6]), k2 = exK(r), t2 = k2 * PI / 12;
    var X2 = eMul(cosExact(k2), rat(R2)), Y2 = eMul(sinExact(k2), rat(R2)), x2 = eVal(X2), y2 = eVal(Y2);
    var raw = Math.atan(y2 / x2);
    var text2 = H('<p>A point has rectangular coordinates $(x, y) = \\left(' + eTex(X2) + ', ' + eTex(Y2) + '\\right)$. Write it in polar coordinates $(r, \\theta)$ with $r > 0$ and $0 \\le \\theta < 2\\pi$.</p>');
    var steps2 = [
      numStep('r', 'Find $r$.', R2, [
        [x2 * x2 + y2 * y2, 'That is $r^2 = x^2 + y^2$. Take the square root: $r = \\sqrt{x^2 + y^2}$.'],
        [Math.abs(x2) + Math.abs(y2), 'Distances do not add along the axes. Use $r = \\sqrt{x^2 + y^2}$.']
      ], { practice: '2.B' }),
      numStep('t', 'Find $\\theta$ in $[0, 2\\pi)$.', t2, [
        [raw, '$\\tan^{-1}\\left(\\frac{y}{x}\\right) = ' + n(raw) + '$ is between $-\\frac{\\pi}{2}$ and $\\frac{\\pi}{2}$, so it only gives the right angle in Quadrants I and IV. This point is in ' + QN[quadrant(x2, y2)] + ': ' + (quadrant(x2, y2) === 4 ? 'add $2\\pi$ to bring it into $[0, 2\\pi)$.' : 'add $\\pi$ to land on its ray.')],
        [raw + TAU, '$\\tan^{-1}\\left(\\frac{y}{x}\\right) + 2\\pi$ is in the right range but on the wrong ray: this point is in ' + QN[quadrant(x2, y2)] + '. Add $\\pi$ instead.'],
        [k2 * 15, 'That is the angle in degrees. Give $\\theta$ in radians.'],
        [t2 - TAU, 'That angle points the right way but is negative. The question asks for $0 \\le \\theta < 2\\pi$: add $2\\pi$.'],
        [Math.atan2(x2, y2) < 0 ? Math.atan2(x2, y2) + TAU : Math.atan2(x2, y2), 'That angle has $x$ and $y$ swapped: $\\tan\\theta = \\frac{y}{x}$, not $\\frac{x}{y}$.']
      ], { practice: '2.B', hint: 'Exact (like 5pi/6) or correct to three decimal places, in radians.', sign: 'A negative angle turns clockwise; this one asks for $0 \\le \\theta < 2\\pi$. Find the quadrant from the signs of $x$ and $y$.' })
    ];
    var sol2 = ['$r = \\sqrt{x^2 + y^2} = \\sqrt{' + n(x2 * x2) + ' + ' + n(y2 * y2) + '} = ' + R2 + '$.',
      'The point is in ' + QN[quadrant(x2, y2)] + '. $\\tan\\theta = \\frac{y}{x}$, and the angle in that quadrant with this tangent is $\\theta = ' + piTex(k2) + '$' + (quadrant(x2, y2) === 1 ? '' : ' (not $\\tan^{-1}\\frac{y}{x} \\approx ' + n(raw) + '$, which points into ' + QN[quadrant(Math.cos(raw), Math.sin(raw))] + ')') + '.',
      'So $(r, \\theta) = \\left(' + R2 + ', ' + piTex(k2) + '\\right)$. Check: $' + R2 + '\\cos ' + piTex(k2) + ' = ' + eTex(X2) + '$.'];
    return { text: text2, steps: steps2, solution: sol2, variant: 'toPolar', fig: { kind: 'convert', r: R2, t: t2, x: x2, y: y2, rmax: R2, shown: true }, values: { r: R2, k: k2, x: x2, y: y2, q: quadrant(x2, y2) } };
  };

  GEN.graph = function(r){
    var pick = r(), spec, c;
    if(pick < 0.5) spec = { fam: 'rose', a: r.pick([2, 3, 4, 5]), n: r.pick([2, 3, 4, 5]), trig: r.pick(['cos', 'sin']) };
    else if(pick < 0.85){ var b = r.pick([1, 2, 3, 4]) * (r() < 0.4 ? -1 : 1), a = r.pick([1, 2, 3, 4, 5, 6]); spec = { fam: 'limacon', a: a, b: b, trig: r.pick(['cos', 'sin']) }; }
    else spec = { fam: 'circle', a: r.pick([2, 3, 4, 5, 6]) * (r() < 0.3 ? -1 : 1), trig: r.pick(['cos', 'sin']) };
    c = curve(spec);
    // an angle where r is exact and not 0
    var ks = []; for(var k = 1; k < 24; k++){ var e = rExact(spec, k); if(e && Math.abs(eVal(e)) > 1e-9 && k % 6) ks.push(k); }
    var kk = r.pick(ks), RE = rExact(spec, kk), rv = eVal(RE);
    var steps = [], tg = spec.trig, deg = c.f(kk * PI / 12 * PI / 180);
    var mist = [[deg, 'That reads ' + piText(kk) + ' as degrees. Use radians.']];
    if(spec.fam === 'rose') mist.unshift([spec.a * trigF(tg)(kk * PI / 12), 'That is $' + spec.a + '\\' + tg + '\\theta$: the angle inside is $' + spec.n + '\\theta = ' + piTex(spec.n * kk) + '$.']);
    if(spec.fam === 'limacon') mist.unshift([spec.a * trigF(tg)(kk * PI / 12) + spec.b, 'The constant ' + spec.a + ' is added, not multiplied: $r = ' + spec.a + (spec.b < 0 ? ' - ' : ' + ') + Math.abs(spec.b) + '\\' + tg + '\\theta$.']);
    steps.push(numStep('r', 'Find $r$ when $\\theta = ' + piTex(kk) + '$.', rv, mist, { practice: '1.B' }));
    var sol = ['$r\\left(' + piTex(kk) + '\\right) = ' + eTex(RE) + (RE.s === 1 ? '' : ' \\approx ' + n(rv)) + '$.'];
    if(spec.fam === 'rose'){
      var P = spec.n % 2 ? spec.n : 2 * spec.n;
      steps.push(choice('shape', 'What does the graph look like?', distinct([
        ['A rose with ' + P + ' petals', spec.n % 2 ? 'Right: $n = ' + spec.n + '$ is odd, so the rose has $n = ' + P + '$ petals (each traced once as $\\theta$ goes from $0$ to $\\pi$).' : 'Right: $n = ' + spec.n + '$ is even, so the rose has $2n = ' + P + '$ petals.'],
        ['A rose with ' + (spec.n % 2 ? 2 * spec.n : spec.n) + ' petals', spec.n % 2 ? 'With $n$ odd each petal is traced twice, so there are only $n = ' + spec.n + '$ petals, not $2n$.' : 'With $n$ even the negative values of $r$ draw new petals, so there are $2n = ' + P + '$ petals.'],
        ['A rose with ' + spec.a + ' petals', '$' + spec.a + '$ is the length of each petal (the greatest $|r|$), not the number of petals.'],
        ['A limaçon with an inner loop', 'A limaçon is $r = a + b\\cos\\theta$. Here $r$ is a multiple of $\\' + tg + '(' + spec.n + '\\theta)$: a rose.']
      ], [['A rose with ' + (P + 1) + ' petals', 'Count the petals from $n$: ' + (spec.n % 2 ? '$n$ odd gives $n$.' : '$n$ even gives $2n$.')]]), '3.A'));
      steps.push(numStep('max', 'What is the greatest distance from the origin to a point on the graph?', Math.abs(spec.a), [
        [Math.abs(spec.a) * spec.n, 'The $n$ in $' + spec.n + '\\theta$ only changes how fast the petals come; the size is $|a| = ' + Math.abs(spec.a) + '$.'],
        [2 * Math.abs(spec.a), 'That is two petals end to end. The distance from the origin is at most $|r| = ' + Math.abs(spec.a) + '$.']
      ], { practice: '2.A' }));
      sol.push('$n = ' + spec.n + '$ is ' + (spec.n % 2 ? 'odd' : 'even') + ', so the graph is a rose with ' + P + ' petals.', 'The greatest $|r|$ is $|' + spec.a + '| = ' + Math.abs(spec.a) + '$, at the tip of each petal.');
    } else if(spec.fam === 'limacon'){
      var A = Math.abs(spec.a), B = Math.abs(spec.b), sh = A < B ? 'A limaçon with an inner loop' : A === B ? 'A cardioid' : 'A limaçon without an inner loop';
      var shWhy = A < B ? 'Right: $|a| = ' + A + ' < |b| = ' + B + '$, so $r$ is negative for some $\\theta$ and those points draw the inner loop.' : A === B ? 'Right: $|a| = |b| = ' + A + '$, so $r$ reaches $0$ at one angle only: the cusp of a cardioid.' : 'Right: $|a| = ' + A + ' > |b| = ' + B + '$, so $r$ is never $0$ and there is no loop.';
      steps.push(choice('shape', 'What does the graph look like?', distinct([
        [sh, shWhy],
        ['A limaçon with an inner loop', 'An inner loop needs $r < 0$ for some $\\theta$, that is $|a| < |b|$. Here $|a| = ' + A + '$ and $|b| = ' + B + '$.'],
        ['A cardioid', 'A cardioid needs $|a| = |b|$. Here $|a| = ' + A + '$ and $|b| = ' + B + '$.'],
        ['A limaçon without an inner loop', 'Without a loop $r$ never reaches $0$: that needs $|a| > |b|$. Here $|a| = ' + A + '$ and $|b| = ' + B + '$.'],
        ['A rose with 2 petals', 'A rose is $r = a\\cos(n\\theta)$ with no constant term. This one has the constant ' + spec.a + ': a limaçon.']
      ]).slice(0, 4), '3.A'));
      steps.push(numStep('max', 'What is the greatest distance from the origin to a point on the graph?', A + B, [
        [A, 'That is $r$ where the trig part is $0$. The greatest $|r|$ is $|a| + |b|$.']
      ].concat(spec.b < 0 ? [[spec.a + spec.b, 'That is $r$ where $\\' + tg + '\\theta = 1$. With $b < 0$ the greatest $|r|$ comes where $\\' + tg + '\\theta = -1$: $r = ' + spec.a + ' + ' + B + ' = ' + (A + B) + '$.']] : [])
        .concat(A !== B ? [[Math.abs(A - B), 'That is $\\left||a| - |b|\\right|$, the value of $|r|$ where the trig part works against $a$. The greatest is $|a| + |b|$.']] : []), { practice: '2.A' }));
      sol.push('$|a| = ' + A + '$ and $|b| = ' + B + '$: ' + (A < B ? '$|a| < |b|$, a limaçon with an inner loop.' : A === B ? 'equal, a cardioid.' : '$|a| > |b|$, a limaçon without an inner loop.'), 'The greatest $|r|$ is $|a| + |b| = ' + (A + B) + '$, where $\\' + tg + '\\theta = ' + (spec.b < 0 ? '-1' : '1') + '$.');
    } else {
      var D = Math.abs(spec.a), cen = tg === 'cos' ? '(' + n(spec.a / 2) + ', 0)' : '(0, ' + n(spec.a / 2) + ')';
      steps.push(choice('shape', 'What does the graph look like?', distinct([
        ['A circle of diameter ' + D + ' centred at $' + cen + '$', 'Right: $r = a\\' + tg + '\\theta$ is a circle through the origin with diameter $|a| = ' + D + '$ along the ' + (tg === 'cos' ? '$x$' : '$y$') + '-axis.'],
        ['A circle of radius ' + D + ' centred at the origin', 'That is $r = ' + D + '$, a constant. Here $r$ changes with $\\theta$ and is $0$ at $\\theta = ' + (tg === 'cos' ? '\\frac{\\pi}{2}' : '0') + '$, so the circle passes through the origin.'],
        ['A circle of diameter ' + D + ' centred at $' + (tg === 'cos' ? '(0, ' + n(spec.a / 2) + ')' : '(' + n(spec.a / 2) + ', 0)') + '$', 'Check where $|r|$ is greatest: at $\\theta = ' + (tg === 'cos' ? '0' : '\\frac{\\pi}{2}') + '$, so the diameter lies along the ' + (tg === 'cos' ? '$x$' : '$y$') + '-axis.'],
        ['A rose with 2 petals', 'A rose has $n\\theta$ inside with $n \\ge 2$. Here $n = 1$: a circle.']
      ]), '3.A'));
      steps.push(numStep('max', 'What is the greatest distance from the origin to a point on the graph?', D, [[D / 2, 'That is the radius of the circle. The farthest point is across the diameter, $|a| = ' + D + '$ from the origin.']], { practice: '2.A' }));
      sol.push('$r = ' + coefTex(spec.a) + '\\' + tg + '\\theta$ is a circle through the origin, diameter $' + D + '$, centred at $' + cen + '$.', 'The greatest distance from the origin is the diameter, $' + D + '$.');
    }
    var text = H('<p>Consider the polar curve $' + c.tex + '$ for $0 \\le \\theta \\le 2\\pi$.</p>');
    return { text: text, steps: steps, solution: sol, fig: { kind: 'graph', spec: spec, t: kk * PI / 12, rmax: c.maxR }, values: { spec: spec, k: kk, r: rv, max: c.maxR, shape: c.shape } };
  };

  /* The curves the rates drill uses: every break at a multiple of π/12. */
  var RATE_SPECS = [];
  [2, 3, 4].forEach(function(a){ [2, 3].forEach(function(nn){ ['cos', 'sin'].forEach(function(tg){ RATE_SPECS.push({ fam: 'rose', a: a, n: nn, trig: tg }); }); }); });
  [[1, 2], [2, 4], [2, 2], [3, 3], [3, 2], [4, 2], [1, -2], [2, -2], [3, -1]].forEach(function(ab){ ['cos', 'sin'].forEach(function(tg){ RATE_SPECS.push({ fam: 'limacon', a: ab[0], b: ab[1], trig: tg }); }); });
  /* Intervals [k1, k2]·π/12 inside one piece (r keeps its sign, r keeps
     rising or keeps falling), at least π/6 wide, r exact at both ends. */
  function rateIntervals(spec){
    var c = curve(spec), ps = pieces(c), out = [];
    ps.forEach(function(pc){
      var lo = Math.ceil(pc.a / (PI / 12) - 1e-9), hi = Math.floor(pc.b / (PI / 12) + 1e-9);
      for(var k1 = lo; k1 <= hi; k1++) for(var k2 = k1 + 2; k2 <= Math.min(hi, k1 + 8); k2++){
        if(!rExact(spec, k1) || !rExact(spec, k2)) continue;
        out.push({ k1: k1, k2: k2, piece: pc });
      }
    });
    return out;
  }
  GEN.rates = function(r){
    var spec = r.pick(RATE_SPECS), c = curve(spec), all = rateIntervals(spec);
    var neg = all.filter(function(iv){ return iv.piece.rs < 0; });
    var iv = neg.length && r() < 0.4 ? r.pick(neg) : r.pick(all), k1 = iv.k1, k2 = iv.k2, t1 = k1 * PI / 12, t2 = k2 * PI / 12;
    var E1 = rExact(spec, k1), E2 = rExact(spec, k2), r1 = eVal(E1), r2 = eVal(E2), dt = t2 - t1, avg = (r2 - r1) / dt;
    var pc = iv.piece, rising = pc.ds > 0, pos = pc.rs > 0, away = pc.dist === 'away';
    var I = '\\left[' + piTex(k1) + ', ' + piTex(k2) + '\\right]';
    var mist = [];
    if(!pos) mist.push([(Math.abs(r2) - Math.abs(r1)) / dt, 'That is the rate of change of the distance $|r|$. The question asks for $r$ itself, sign included: $\\frac{r(' + piTex(k2) + ') - r(' + piTex(k1) + ')}{' + piTex(k2) + ' - ' + piTex(k1) + '}$ with $r(' + piTex(k2) + ') = ' + eTex(E2) + '$.']);
    mist.push([-avg, 'The order is flipped. Subtract in the same order on top and bottom: $\\frac{r(' + piTex(k2) + ') - r(' + piTex(k1) + ')}{' + piTex(k2) + ' - ' + piTex(k1) + '}$.']);
    mist.push([r2 - r1, 'That is the change in $r$ alone. Divide by the change in $\\theta$, $' + piTex(k2 - k1) + '$.']);
    mist.push([(r2 - r1) / ((k2 - k1) * 15), 'That divides by the change in degrees. The change in $\\theta$ is $' + piTex(k2 - k1) + '$ radians.']);
    mist.push([(r2 + r1) / dt, 'Subtract the values of $r$ at the two ends; do not add them.']);
    var facts = function(p, up){ return '$r ' + (p ? '> 0' : '< 0') + '$ and $r$ is ' + (up ? 'increasing' : 'decreasing'); };
    var conseq = function(p, up){ return p === up ? 'so $|r|$, the distance from the origin, is increasing' : 'so $|r|$, the distance from the origin, is decreasing'; };
    var reasonOpts = [[true, true], [true, false], [false, true], [false, false]].map(function(o){
      var right = o[0] === pos && o[1] === rising;
      return [facts(o[0], o[1]) + ' on the interval.', right ? 'Right: on $' + I + '$ ' + facts(pos, rising) + ' (look at the graph of $r$ against $\\theta$).' :
        o[0] !== pos ? 'Look at the sign: on $' + I + '$ the graph of $r$ is ' + (pos ? 'above' : 'below') + ' the $\\theta$-axis, so $r ' + (pos ? '> 0' : '< 0') + '$.' :
        'Look at the direction: from $r(' + piTex(k1) + ') = ' + eTex(E1) + '$ to $r(' + piTex(k2) + ') = ' + eTex(E2) + '$, $r$ is ' + (rising ? 'increasing' : 'decreasing') + '.', right];
    }).sort(function(a, b){ return b[2] - a[2]; }).map(function(o){ return [o[0], o[1]]; });
    var distOpts = [
      [away ? 'Increasing' : 'Decreasing', 'Right: ' + facts(pos, rising) + ', ' + conseq(pos, rising) + '. The point moves ' + (away ? 'away from' : 'toward') + ' the origin.'],
      [away ? 'Decreasing' : 'Increasing', pos ? 'With $r > 0$ the distance is $r$ itself, and $r$ is ' + (rising ? 'increasing' : 'decreasing') + '.' : 'With $r < 0$ the distance is $|r| = -r$: as $r$ ' + (rising ? 'increases toward 0 the distance shrinks' : 'decreases (more negative) the distance grows') + '. Reading the direction of $r$ alone misses the sign.'],
      ['It stays the same', 'The distance is $|r|$, which goes from $' + n(Math.abs(r1)) + '$ to $' + n(Math.abs(r2)) + '$ on this interval.']
    ];
    var steps = [
      numStep('avg', 'Find the average rate of change of $r$ with respect to $\\theta$ on $' + I + '$.', avg, mist, { practice: '1.B', sign: 'Subtract in the same order on top and bottom, later value first: $r(\\theta_2) - r(\\theta_1)$ over $\\theta_2 - \\theta_1$.' }),
      choice('reason', 'Which is true on $' + I + '$?', reasonOpts, '2.A'),
      choice('dist', 'On $' + I + '$, is the distance between the point $(r, \\theta)$ and the origin increasing or decreasing?', distOpts, '3.C')
    ];
    var sol = [
      '$r(' + piTex(k1) + ') = ' + eTex(E1) + '$ and $r(' + piTex(k2) + ') = ' + eTex(E2) + '$.',
      'Average rate of change $= \\frac{r(' + piTex(k2) + ') - r(' + piTex(k1) + ')}{' + piTex(k2) + ' - ' + piTex(k1) + '} \\approx ' + n(avg) + '$: on average $r$ ' + (avg > 0 ? 'rises' : 'falls') + ' ' + n(Math.abs(avg)) + ' per radian. It is the slope of the secant line through the two points on the graph of $r$ against $\\theta$.',
      'On the interval ' + facts(pos, rising) + ', ' + conseq(pos, rising) + '.'
    ];
    var text = H('<p>A polar curve is $' + c.tex + '$. Consider $\\theta$ in $' + I + '$.</p>');
    return { text: text, steps: steps, solution: sol, fig: { kind: 'rates', spec: spec, t1: t1, t2: t2, r1: r1, r2: r2, avg: avg, rmax: c.maxR }, values: { spec: spec, k1: k1, k2: k2, r1: r1, r2: r2, avg: avg, pos: pos, rising: rising, away: away } };
  };

  var TITLE = { convert: 'Polar and rectangular coordinates', graph: 'Reading a polar equation', rates: 'Rates of change in polar curves' };
  function generate(r, ctx, type){
    var kind = type || ctx.kind;
    if(!GEN[kind]) throw new Error('polar-graphs: no problem kind "' + kind + '"');
    var p = GEN[kind](r);
    p.ctx = ctx.id; p.topic = ctx.topic; p.type = kind; p.title = TITLE[kind];
    p.solution = p.solution.map(H);
    return p;
  }

  M.register('polarGraphs', {
    PRESETS: PRESETS, ORDER: ORDER, KINDS: Object.keys(GEN), TITLE: TITLE, RATE_SPECS: RATE_SPECS,
    curve: curve, pieces: pieces, pieceAt: pieceAt, rect: rect, polar: polar, avgRate: avgRate, quadrant: quadrant,
    piTex: piTex, piText: piText, angleText: angleText, angleTex: angleTex, n: n,
    cosExact: cosExact, sinExact: sinExact, rExact: rExact, eVal: eVal, eTex: eTex, eTyped: eTyped, rateIntervals: rateIntervals,
    generate: generate
  });
})(typeof window !== 'undefined' ? window : globalThis);
