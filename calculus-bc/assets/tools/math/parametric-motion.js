/* Parametric motion model: ApCalcMath.parametricMotion (docs/apcalcbc-architecture.md, "Trainers").
   OWNED BY THIS TOOL ONLY (builder T2). Pure functions, no DOM, so the validator
   (scripts/lib/apcalcbc-tool-checks/parametric-motion.mjs) and the test
   (scripts/test/apcalcbc-tool-parametric-motion.test.mjs) run exactly this code.

   Every curve is given as expression strings (ApCalcExpr syntax, variable t):
   the page's TeX is printed from the same strings (M.toTex), and the
   functions are compiled from them (M.fn), so a picture or a number always
   comes from the function the text states.

   Explore: PATHS[id], a particle traced for t in [a, b].
     mode 'x'  position given: x(t), y(t) with their first and second
               derivatives written out (dx, dy, ddx, ddy)
     mode 'v'  velocity given with a starting point (Units 9.5, 9.6):
               x(t) = x(a) + ∫ x'(s) ds, accumulated by adaptive Simpson
   table(p, N) samples t, x, y, x', y', x'', y'', the speed and the distance
   travelled (∫ speed); at(p, t) gives the state at one time (dy/dx and
   d²y/dx² = (y''x' − y'x'')/x'³); special(p) finds the vertical tangents
   (x' = 0), horizontal tangents (y' = 0) and stops (both 0).

   Test yourself: generate(rng, ctx, type) for the kinds
     slope     9.1  dx/dt, dy/dt, dy/dx at a time; the tangent line or where it is vertical
     second    9.2  dy/dx as an expression in t, d/dt(dy/dx), d²y/dx², concavity
     length    9.3  the arc-length integrand and its value (calculator)
     vector    9.4  velocity and acceleration components, the direction of motion
     position  9.5  position from a velocity vector and a starting point (calculator)
     plane     9.6  speed, distance travelled, whether y increases (calculator) */
(function(G){
  'use strict';
  var M = G.ApCalcMath;
  if(!M) return;
  var PI = Math.PI;
  function H(s){ return G.ApCalcTex ? G.ApCalcTex.html(s, { strict: true }) : s; }
  function escT(s){ return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function optHtml(t){
    if(String(t).indexOf('$') < 0 || !G.ApCalcTex) return '<span class="cd-opt-t">' + H(t) + '</span>';
    return '<span class="cd-opt-t"><span class="sr-only">' + escT(G.ApCalcTex.plain(t)) + '</span><span aria-hidden="true">' + H(t) + '</span></span>';
  }
  /* A number as the page prints it: whole numbers plain, others to 3 places. */
  function n(x, d){
    if(Math.abs(x - Math.round(x)) < 1e-9) return String(Math.round(x));
    var s = M.fixed(x, d == null ? 3 : d).replace(/0+$/, '').replace(/\.$/, '');
    return s === '-0' ? '0' : s;
  }
  function f3(x){ var s = M.fixed(x, 3); return s === '-0.000' ? '0.000' : s; }
  /* TeX of a given expression string, printed by the same parser that compiles it. */
  function tx(s){ return M.toTex(M.parse(s, { vars: ['t'] })); }
  function fn(s){ return M.fn(s, ['t']); }
  function gcd(a, b){ a = Math.abs(a); b = Math.abs(b); while(b){ var t = a % b; a = b; b = t; } return a || 1; }
  /* An exact fraction p/q in TeX (q > 0 after reducing). */
  function frac(p, q){
    if(q < 0){ p = -p; q = -q; }
    var g = gcd(p, q); p /= g; q /= g;
    if(q === 1) return String(p);
    return (p < 0 ? '-' : '') + '\\frac{' + Math.abs(p) + '}{' + q + '}';
  }
  /* A multiple k/d of pi: its TeX and its value. */
  function piT(k, d){
    var g = gcd(k, d); k /= g; d /= g;
    var top = (k === 1 ? '' : k === -1 ? '-' : k) + '\\pi';
    return { tex: d === 1 ? top : (k < 0 ? '-' : '') + '\\frac{' + (Math.abs(k) === 1 ? '' : Math.abs(k)) + '\\pi}{' + d + '}', v: k * PI / d, plain: (d === 1 ? (k === 1 ? '' : k) + 'π' : (Math.abs(k) === 1 ? (k < 0 ? '-' : '') : k) + 'π/' + d) };
  }
  /* k times s with k = 1 and -1 written the usual way ("sin(t)", "-sin(t)"). */
  function co(k, s){ return (k === 1 ? '' : k === -1 ? '-' : String(k)) + s; }
  function sgnWord(x){ return x > 0 ? 'positive' : x < 0 ? 'negative' : 'zero'; }
  function rel(x){ return x > 0 ? '> 0' : x < 0 ? '< 0' : '= 0'; }

  /* Polynomials in t, coefficients high to low. */
  function polyStr(c){
    var deg = c.length - 1, out = '';
    c.forEach(function(k, i){
      var p = deg - i;
      if(!k) return;
      var a = Math.abs(k), s = k < 0 ? (out ? ' - ' : '-') : (out ? ' + ' : '');
      out += s + (a === 1 && p ? '' : n(a)) + (p ? 't' + (p > 1 ? '^' + p : '') : '');
    });
    return out || '0';
  }
  function peval(c, t){ return c.reduce(function(s, k){ return s * t + k; }, 0); }
  function pder(c){ var d = c.length - 1; return d ? c.slice(0, -1).map(function(k, i){ return k * (d - i); }) : [0]; }
  /* "y - 5 = 2(x - 3)" with signs tidied. */
  function lineTex(x0, y0, mTex){
    function side(v, x0){ return x0 === 0 ? v : v + (x0 < 0 ? ' + ' : ' - ') + n(Math.abs(x0)); }
    return side('y', y0) + ' = ' + mTex + (x0 === 0 ? 'x' : '(' + side('x', x0) + ')');
  }

  /* ------------------------------------------------------- explore */
  var PATHS = {
    ellipse: { id: 'ellipse', mode: 'x', name: 'Ellipse', t: [0, 2 * PI], piT: true,
      x: '3cos(t)', y: '2sin(t)', dx: '-3sin(t)', dy: '2cos(t)', ddx: '-3cos(t)', ddy: '-2sin(t)' },
    loop: { id: 'loop', mode: 'x', name: 'Loop', t: [-2, 2],
      x: 't^2', y: 't^3 - 3t', dx: '2t', dy: '3t^2 - 3', ddx: '2', ddy: '6t' },
    eight: { id: 'eight', mode: 'x', name: 'Figure eight', t: [0, 2 * PI], piT: true,
      x: '2sin(t)', y: '1.5sin(2t)', dx: '2cos(t)', dy: '3cos(2t)', ddx: '-2sin(t)', ddy: '-6sin(2t)' },
    wheel: { id: 'wheel', mode: 'x', name: 'Rolling wheel', t: [0, 4 * PI], piT: true, wheel: true,
      x: 't - sin(t)', y: '1 - cos(t)', dx: '1 - cos(t)', dy: 'sin(t)', ddx: 'sin(t)', ddy: 'cos(t)' },
    drift: { id: 'drift', mode: 'v', name: 'Velocity given', t: [0, 5], x0: -2, y0: -1,
      dx: '1 + 2cos(1.5t)', dy: '2sin(t^2/4)', ddx: '-3sin(1.5t)', ddy: 't*cos(t^2/4)' }
  };
  var ORDER = ['ellipse', 'loop', 'eight', 'wheel', 'drift'];
  function compiled(p){
    if(!p.F){
      p.F = { dx: fn(p.dx), dy: fn(p.dy), ddx: fn(p.ddx), ddy: fn(p.ddy) };
      if(p.mode === 'x'){ p.F.x = fn(p.x); p.F.y = fn(p.y); }
    }
    return p.F;
  }
  /* The sampled path: positions accumulate from the start in velocity mode. */
  function table(p, N){
    N = N || 480;
    var F = compiled(p), a = p.t[0], b = p.t[1], out = { t: [], x: [], y: [], vx: [], vy: [], ax: [], ay: [], sp: [], d: [] };
    var x = p.mode === 'x' ? F.x(a) : p.x0, y = p.mode === 'x' ? F.y(a) : p.y0, dist = 0;
    var speed = function(s){ var u = F.dx(s), v = F.dy(s); return Math.sqrt(u * u + v * v); };
    for(var i = 0; i <= N; i++){
      var t = a + (b - a) * i / N;
      if(i){
        var t0 = a + (b - a) * (i - 1) / N;
        if(p.mode === 'x'){ x = F.x(t); y = F.y(t); }
        else { x += M.integral(F.dx, t0, t, 1e-12); y += M.integral(F.dy, t0, t, 1e-12); }
        dist += M.integral(speed, t0, t, 1e-12);
      }
      var vx = F.dx(t), vy = F.dy(t);
      out.t.push(t); out.x.push(x); out.y.push(y); out.vx.push(vx); out.vy.push(vy); out.ax.push(F.ddx(t)); out.ay.push(F.ddy(t));
      out.sp.push(Math.sqrt(vx * vx + vy * vy)); out.d.push(dist);
    }
    return out;
  }
  /* ∫ from a to b in pieces at most 0.5 wide: on a long periodic stretch the
     first Simpson samples can agree by symmetry and stop too early. */
  function integ(f, a, b){
    var N = Math.max(1, Math.ceil(Math.abs(b - a) / 0.5)), s = 0;
    for(var i = 0; i < N; i++) s += M.integral(f, a + (b - a) * i / N, a + (b - a) * (i + 1) / N, 1e-12);
    return s;
  }
  function posAt(p, t){
    var F = compiled(p);
    if(p.mode === 'x') return [F.x(t), F.y(t)];
    return [p.x0 + integ(F.dx, p.t[0], t), p.y0 + integ(F.dy, p.t[0], t)];
  }
  function distTo(p, t){
    var F = compiled(p);
    return integ(function(s){ var u = F.dx(s), v = F.dy(s); return Math.sqrt(u * u + v * v); }, p.t[0], t);
  }
  /* Everything at time t. */
  function at(p, t){
    var F = compiled(p), xy = posAt(p, t), vx = F.dx(t), vy = F.dy(t), ax = F.ddx(t), ay = F.ddy(t), sp = Math.sqrt(vx * vx + vy * vy);
    var slope = Math.abs(vx) > 1e-9 ? vy / vx : NaN, d2 = Math.abs(vx) > 1e-9 ? (ay * vx - vy * ax) / (vx * vx * vx) : NaN;
    return { t: t, x: xy[0], y: xy[1], vx: vx, vy: vy, ax: ax, ay: ay, speed: sp, slope: slope, d2: d2 };
  }
  /* Vertical tangents (x' = 0, y' ≠ 0), horizontal ones, and stops (both 0). */
  function special(p){
    var F = compiled(p), a = p.t[0], b = p.t[1];
    var zx = M.roots(F.dx, a, b, 900), zy = M.roots(F.dy, a, b, 900), out = { vert: [], horiz: [], stop: [] };
    var tol = 1e-6 * Math.max(1, b - a);
    zx.forEach(function(z){ if(Math.abs(F.dy(z)) < 1e-6) out.stop.push(z); else out.vert.push(z); });
    zy.forEach(function(z){ if(Math.abs(F.dx(z)) >= 1e-6) out.horiz.push(z); else if(!out.stop.some(function(w){ return Math.abs(w - z) < 1e-5; })) out.stop.push(z); });
    ['vert', 'horiz', 'stop'].forEach(function(k){ out[k] = out[k].filter(function(z){ return z >= a - tol && z <= b + tol; }); });
    return out;
  }
  /* What the particle is doing at t, in the words the exam rewards. */
  function describe(p, t){
    var s = at(p, t), S = special(p), w = 0.012 * (p.t[1] - p.t[0]);
    var near = function(list){ return list.filter(function(z){ return Math.abs(z - t) < w; })[0]; };
    var st = near(S.stop), vt = near(S.vert), ht = near(S.horiz);
    if(st != null) return { state: 'stop', s: s, head: 'The particle stops for an instant: dx/dt = dy/dt = 0, so its speed is 0' + (p.wheel ? ' (the point touches the road: a cusp).' : '.') };
    if(vt != null) return { state: 'vert', s: s, head: 'Vertical tangent: dx/dt = 0 while dy/dt ≠ 0, so dy/dx does not exist and the particle moves straight ' + (s.vy > 0 ? 'up' : 'down') + '.' };
    if(ht != null) return { state: 'horiz', s: s, head: 'Horizontal tangent: dy/dt = 0 while dx/dt ≠ 0, so dy/dx = 0 and the particle moves straight ' + (s.vx > 0 ? 'right' : 'left') + '.' };
    var dir = (s.vx > 0 ? 'right' : 'left') + ' and ' + (s.vy > 0 ? 'up' : 'down');
    return { state: 'move', s: s, head: 'The particle moves ' + dir + ' (dx/dt ' + rel(s.vx) + ', dy/dt ' + rel(s.vy) + ') at speed ' + n(s.speed, 2) + '.' };
  }

  /* ------------------------------------------------------- the drill */
  function choice(key, label, list, practice){
    return { key: key, kind: 'choice', label: H(label), options: list.map(function(o){ return optHtml(o[0]); }), why: list.map(function(o){ return H(o[1]); }), correct: 0, practice: practice || '3.E' };
  }
  function numStep(key, label, answer, mistakes, o){
    o = o || {};
    var calc = !!o.calc, whole = !calc && Math.abs(answer - Math.round(answer)) < 1e-9;
    return { key: key, kind: 'num', label: H(label), unit: o.unit || '', practice: o.practice || '1.E', d: whole ? 0 : 3,
      hint: calc ? 'Calculator: correct to three decimal places.' : whole ? '' : 'Exact (like 3/2 or sqrt(3)/2) or to three decimal places.',
      cell: M.cell(answer, calc ? 0 : 6e-4, (mistakes || []).map(function(m){ return { value: m[0], why: H(m[1]) }; }), calc ? 0.001 : 6e-4) };
  }
  function exprStep(key, label, lhs, answer, mistakes, domain){
    return { key: key, kind: 'expr', label: H(label), lhs: lhs, practice: '1.E',
      cell: M.exprCell(answer, { vars: ['t'], domain: domain || [0.4, 3], mistakes: (mistakes || []).map(function(m){ return { expr: m[0], why: m[1] }; }) }) };
  }
  /* The problem's figure: the path from its strings (and velocity-mode start). */
  function figOf(g, a, b, o){
    o = o || {};
    return { x: g.x || null, y: g.y || null, dx: g.dx || null, dy: g.dy || null, x0: g.x0, y0: g.y0, a: a, b: b, mark: o.mark, markLabel: o.markLabel || null, rel: !!o.rel, hide: !!o.hide, label: o.label || 'The path of the particle in the xy-plane' };
  }
  var D = '\\frac{dy}{dx}', DXT = '\\frac{dx}{dt}', DYT = '\\frac{dy}{dt}';

  var GEN = {};
  GEN.slope = function(r){
    var fam = r.pick(['poly', 'poly', 'poly', 'trig']);
    if(fam === 'poly'){
      var X, Y, dX, dY, t0, x0, y0, vx, vy;
      for(var guard = 0; guard < 200; guard++){
        X = [1, r.int(-4, 4), r.int(-3, 3)]; Y = [r.pick([1, 1, -1]), r.int(-3, 3), r.int(-6, 6), r.int(-3, 3)];
        dX = pder(X); dY = pder(Y); t0 = r.int(-2, 3);
        vx = peval(dX, t0); vy = peval(dY, t0); x0 = peval(X, t0); y0 = peval(Y, t0);
        if(vx && vy && vx !== 1 && vx !== vy * vy && Math.abs(vx) !== Math.abs(vy) && x0 !== t0 && x0 !== y0 && Math.abs(vx) <= 9) break;
      }
      var xs = polyStr(X), ys = polyStr(Y), m = vy / vx, mT = frac(vy, vx), iT = frac(vx, vy);
      var mT1 = /^-?\d+$/.test(mT) ? (mT === '1' ? '' : mT === '-1' ? '-' : mT) : '\\left(' + mT + '\\right)';
      var iT1 = /^-?\d+$/.test(iT) ? (iT === '1' ? '' : iT === '-1' ? '-' : iT) : '\\left(' + iT + '\\right)';
      var vT1 = vy === 1 ? '' : vy === -1 ? '-' : String(vy);
      var T0 = n(t0);
      var text = H('<p>A curve is defined by the parametric equations $x(t) = ' + tx(xs) + '$ and $y(t) = ' + tx(ys) + '$.</p>');
      var steps = [
        numStep('dxdt', 'Find $' + DXT + '$ at $t = ' + T0 + '$.', vx, [[x0, 'That is $x(' + T0 + ')$, the position. Differentiate first: $' + DXT + ' = ' + tx(polyStr(dX)) + '$.']]),
        numStep('dydt', 'Find $' + DYT + '$ at $t = ' + T0 + '$.', vy, [[y0, 'That is $y(' + T0 + ')$. Differentiate first: $' + DYT + ' = ' + tx(polyStr(dY)) + '$.'], [vx, 'That is $' + DXT + '$. Differentiate $y(t)$ this time.']]),
        numStep('dydx', 'Find the slope $' + D + '$ of the curve at $t = ' + T0 + '$.', m, [[vx / vy, 'That is $\\frac{dx/dt}{dy/dt}$, upside down. The slope is $' + D + ' = \\frac{dy/dt}{dx/dt}$.'], [vy, 'That is $' + DYT + '$ alone. Divide by $' + DXT + '$: $' + D + ' = \\frac{dy/dt}{dx/dt}$.']]),
        choice('line', 'Which is an equation of the tangent line at $t = ' + T0 + '$?', [
          ['$' + lineTex(x0, y0, mT1) + '$', 'Right: the point is $(x(' + T0 + '), y(' + T0 + ')) = (' + n(x0) + ', ' + n(y0) + ')$ and the slope is $\\frac{dy/dt}{dx/dt} = ' + mT + '$.'],
          ['$' + lineTex(x0, y0, iT1) + '$', 'That slope is $\\frac{dx/dt}{dy/dt}$, upside down. The slope is $' + D + ' = \\frac{dy/dt}{dx/dt} = ' + mT + '$.'],
          ['$' + lineTex(x0, y0, vT1) + '$', 'That slope is $' + DYT + '$ alone. The slope of the curve is $' + D + ' = \\frac{dy/dt}{dx/dt} = ' + mT + '$.'],
          ['$' + lineTex(t0, y0, mT1) + '$', 'The point must be $(x(' + T0 + '), y(' + T0 + '))$: its $x$-coordinate is $x(' + T0 + ') = ' + n(x0) + '$, not the time $t = ' + T0 + '$.']
        ], '1.E')
      ];
      var sol = ['$' + DXT + ' = ' + tx(polyStr(dX)) + '$, so $' + DXT + ' = ' + n(vx) + '$ at $t = ' + T0 + '$.', '$' + DYT + ' = ' + tx(polyStr(dY)) + '$, so $' + DYT + ' = ' + n(vy) + '$ at $t = ' + T0 + '$.',
        '$' + D + ' = \\frac{dy/dt}{dx/dt} = \\frac{' + n(vy) + '}{' + n(vx) + '} = ' + mT + '$ (here $' + DXT + ' \\ne 0$).', 'The point is $(' + n(x0) + ', ' + n(y0) + ')$, so the tangent line is $' + lineTex(x0, y0, mT1) + '$.'];
      return { text: text, steps: steps, solution: sol, fig: figOf({ x: xs, y: ys }, Math.min(-2.5, t0 - 1), Math.max(3, t0 + 1), { mark: t0 }),
        values: { fam: fam, given: { x: xs, y: ys }, t0: t0, vx: vx, vy: vy, x0: x0, y0: y0, m: m } };
    }
    // An ellipse x = h + A cos t, y = k + B sin t at a multiple of pi/6.
    var A = r.pick([2, 3, 4, 5]), B = r.pick([2, 3, 4, 5].filter(function(b){ return b !== A; })), h = r.int(-2, 2), k = r.int(-2, 2);
    var tp = r.pick([[1, 6], [1, 3], [2, 3], [5, 6], [7, 6], [4, 3], [5, 3], [11, 6]]), T = piT(tp[0], tp[1]), t1 = T.v;
    var xs2 = (h ? h + ' + ' : '') + co(A, 'cos(t)'), ys2 = (k ? k + ' + ' : '') + co(B, 'sin(t)');
    var ux = -A * Math.sin(t1), uy = B * Math.cos(t1), sl = uy / ux;
    var text2 = H('<p>A particle moves on the ellipse $x(t) = ' + tx(xs2) + '$, $y(t) = ' + tx(ys2) + '$ for $0 \\le t < 2\\pi$.</p>');
    var steps2 = [
      numStep('dxdt', 'Find $' + DXT + '$ at $t = ' + T.tex + '$.', ux, [[-ux, 'The derivative of $\\cos t$ is $-\\sin t$: keep the minus sign.'], [A * Math.cos(t1), 'Differentiate: the derivative of $' + A + '\\cos t$ is $-' + A + '\\sin t$.']]),
      numStep('dydt', 'Find $' + DYT + '$ at $t = ' + T.tex + '$.', uy, [[B * Math.sin(t1), 'Differentiate: the derivative of $' + B + '\\sin t$ is $' + B + '\\cos t$.']]),
      numStep('dydx', 'Find $' + D + '$ at $t = ' + T.tex + '$.', sl, [[ux / uy, 'That is $\\frac{dx/dt}{dy/dt}$, upside down. The slope is $\\frac{dy/dt}{dx/dt}$.'], [uy, 'That is $' + DYT + '$ alone. Divide by $' + DXT + '$.']]),
      choice('vert', 'Where on $0 \\le t < 2\\pi$ is the tangent line vertical?', [
        ['At $t = 0$ and $t = \\pi$, where $' + DXT + ' = 0$ and $' + DYT + ' \\ne 0$', 'Right: a vertical tangent needs $' + DXT + ' = 0$ with $' + DYT + ' \\ne 0$, so $' + D + '$ does not exist there.'],
        ['At $t = \\frac{\\pi}{2}$ and $t = \\frac{3\\pi}{2}$, where $' + DYT + ' = 0$', 'Where $' + DYT + ' = 0$ (and $' + DXT + ' \\ne 0$) the slope is $0$: those tangents are horizontal.'],
        ['Nowhere: the slope always exists', 'At $t = 0$ and $t = \\pi$, $' + DXT + ' = -' + A + '\\sin t = 0$ while $' + DYT + ' \\ne 0$: the slope does not exist and the tangent is vertical.'],
        ['At $t = \\frac{\\pi}{4}$ and $t = \\frac{5\\pi}{4}$', 'There both derivatives are nonzero. Solve $' + DXT + ' = 0$ for a vertical tangent.']
      ], '2.B')
    ];
    var sol2 = ['$' + DXT + ' = -' + A + '\\sin t = ' + f3(ux) + '$ at $t = ' + T.tex + '$.', '$' + DYT + ' = ' + B + '\\cos t = ' + f3(uy) + '$ at $t = ' + T.tex + '$.', '$' + D + ' = \\frac{dy/dt}{dx/dt} = -\\frac{' + B + '\\cos t}{' + A + '\\sin t} \\approx ' + f3(sl) + '$.', 'Vertical tangents: $' + DXT + ' = 0$ at $t = 0$ and $t = \\pi$, where $' + DYT + ' = \\pm ' + B + ' \\ne 0$.'];
    return { text: text2, steps: steps2, solution: sol2, fig: figOf({ x: xs2, y: ys2 }, 0, 2 * PI, { mark: t1, markLabel: T.plain }),
      values: { fam: fam, given: { x: xs2, y: ys2 }, t0: t1, vx: ux, vy: uy, m: sl } };
  };

  GEN.second = function(r){
    var fam = r.pick(['poly', 'poly', 'trig']);
    if(fam === 'poly'){
      var a, b, c, t0, dd, d2;
      for(var guard = 0; guard < 100; guard++){
        a = r.int(-3, 3); b = r.pick([1, 2, -1]); c = r.nonzero(-6, 6); t0 = r.pick([1, 2, 3, -1, -2]);
        dd = 1.5 * b - c / (2 * t0 * t0); d2 = dd / (2 * t0);
        if(Math.abs(d2) > 0.02 && Math.abs(dd - 3 * b * t0) > 0.05) break;
      }
      var xs = 't^2' + (a ? (a > 0 ? ' + ' : ' - ') + Math.abs(a) : ''), ys = polyStr([b, 0, c, 0]);
      var dyk = '(' + polyStr([3 * b, 0, c]) + ')/(2t)', T0 = n(t0), up = d2 > 0;
      var text = H('<p>A curve is given by $x(t) = ' + tx(xs) + '$ and $y(t) = ' + tx(ys) + '$ for $t \\ne 0$.</p>');
      var steps = [
        exprStep('dydx', 'Write $' + D + '$ in terms of $t$.', '\\frac{dy}{dx} =', dyk, [
          ['(2t)/(' + polyStr([3 * b, 0, c]) + ')', 'That is $\\frac{dx/dt}{dy/dt}$, upside down. Divide $' + DYT + '$ by $' + DXT + '$.'],
          [polyStr([3 * b, 0, c]), 'That is $' + DYT + '$ alone. Divide by $' + DXT + ' = 2t$.']]),
        numStep('dd', 'Find $\\frac{d}{dt}\\left(' + D + '\\right)$ at $t = ' + T0 + '$.', dd, [[d2, 'That already divides by $' + DXT + '$. This step is the $t$-derivative of $' + D + '$ only.']]),
        numStep('d2', 'Find $\\frac{d^2y}{dx^2}$ at $t = ' + T0 + '$.', d2, [
          [dd, 'That is $\\frac{d}{dt}\\left(' + D + '\\right)$. Divide it by $' + DXT + ' = ' + n(2 * t0) + '$: $\\frac{d^2y}{dx^2} = \\frac{\\frac{d}{dt}(dy/dx)}{dx/dt}$.'],
          [3 * b * t0, 'That is $\\frac{y\'\'(t)}{x\'\'(t)}$, which is not the second derivative. Differentiate $' + D + '$ with respect to $t$, then divide by $' + DXT + '$.'],
          [dd * 2 * t0, 'Divide by $' + DXT + '$, do not multiply.']]),
        choice('cc', 'At $t = ' + T0 + '$, the curve is', [
          ['concave ' + (up ? 'up' : 'down') + ', because $\\frac{d^2y}{dx^2} ' + rel(d2) + '$', 'Right: concavity is the sign of $\\frac{d^2y}{dx^2}$.'],
          ['concave ' + (up ? 'down' : 'up') + ', because $\\frac{d^2y}{dx^2} ' + (up ? '< 0' : '> 0') + '$', 'Check the sign: $\\frac{d^2y}{dx^2} = ' + f3(d2) + '$.'],
          (dd * d2 < 0 ? ['concave ' + (up ? 'down' : 'up') + ', because $\\frac{d}{dt}\\left(' + D + '\\right) ' + rel(dd) + '$', 'The sign of $\\frac{d}{dt}(dy/dx)$ is not the concavity: here $' + DXT + ' = ' + n(2 * t0) + ' < 0$ flips it. Use $\\frac{d^2y}{dx^2}$.']
            : ['concave ' + (up ? 'down' : 'up') + ', because $' + D + ' ' + (up ? '< 0' : '> 0') + '$', 'The sign of $' + D + '$ says whether the curve rises or falls, not how it bends.']),
          ['neither: the curve has an inflection point there', 'An inflection point needs $\\frac{d^2y}{dx^2}$ to change sign; here it is ' + sgnWord(d2) + '.']
        ], '3.E')
      ];
      var sol = ['$' + D + ' = \\frac{dy/dt}{dx/dt} = \\frac{' + tx(polyStr([3 * b, 0, c])) + '}{2t}$.', '$\\frac{d}{dt}\\left(' + D + '\\right) = ' + n(1.5 * b) + (c > 0 ? ' - ' : ' + ') + '\\frac{' + n(c % 2 ? Math.abs(c) : Math.abs(c) / 2) + '}{' + (c % 2 ? '2t^2' : 't^2') + '}$, which is $' + f3(dd) + '$ at $t = ' + T0 + '$.',
        '$\\frac{d^2y}{dx^2} = \\frac{\\frac{d}{dt}(dy/dx)}{dx/dt} = \\frac{' + f3(dd) + '}{' + n(2 * t0) + '} \\approx ' + f3(d2) + '$.', 'It is ' + sgnWord(d2) + ', so the curve is concave ' + (up ? 'up' : 'down') + ' at $t = ' + T0 + '$.'];
      return { text: text, steps: steps, solution: sol, fig: figOf({ x: xs, y: ys }, t0 > 0 ? 0.25 : -3, t0 > 0 ? 3 : -0.25, { mark: t0 }),
        values: { fam: fam, given: { x: xs, y: ys }, t0: t0, dd: dd, d2: d2, dydx: dyk } };
    }
    var A = r.pick([2, 3, 4]), B = r.pick([2, 3, 5].filter(function(q){ return q !== A; }));
    var tp = r.pick([[1, 6], [1, 4], [1, 3], [1, 2], [2, 3], [3, 4], [5, 6]]), T = piT(tp[0], tp[1]), t1 = T.v, sn = Math.sin(t1);
    var dd2 = B / A / (sn * sn), d22 = -B / (A * A * sn * sn * sn);
    var xs2 = co(A, 'cos(t)'), ys2 = co(B, 'sin(t)'), g2 = A % 2 || B % 2 ? 1 : 2, key2 = '-' + (B / g2 === 1 ? 'cos(t)' : '(' + B / g2 + 'cos(t))') + '/(' + (A / g2 === 1 ? '' : A / g2) + 'sin(t))';
    var text2 = H('<p>A curve is given by $x(t) = ' + tx(xs2) + '$ and $y(t) = ' + tx(ys2) + '$ for $0 < t < \\pi$.</p>');
    var mis2 = [[dd2, 'That is $\\frac{d}{dt}\\left(' + D + '\\right)$. Divide it by $' + DXT + ' = -' + A + '\\sin t$.']];
    if(tp[1] !== 2) mis2.push([(B / A) * Math.tan(t1), 'That is $\\frac{y\'\'(t)}{x\'\'(t)}$, which is not the second derivative.']);
    var steps2 = [
      exprStep('dydx', 'Write $' + D + '$ in terms of $t$.', '\\frac{dy}{dx} =', key2, [
        ['-(' + A + 'sin(t))/(' + B + 'cos(t))', 'That is $\\frac{dx/dt}{dy/dt}$, upside down.'],
        ['(' + B + 'cos(t))/(' + A + 'sin(t))', 'The derivative of $\\cos t$ is $-\\sin t$, so $' + DXT + ' = -' + A + '\\sin t$: the slope has a minus sign.']], [0.3, 2.8]),
      numStep('dd', 'Find $\\frac{d}{dt}\\left(' + D + '\\right)$ at $t = ' + T.tex + '$.', dd2, [[d22, 'That already divides by $' + DXT + '$. This step is the $t$-derivative only.']]),
      numStep('d2', 'Find $\\frac{d^2y}{dx^2}$ at $t = ' + T.tex + '$.', d22, mis2),
      choice('cc', 'For $0 < t < \\pi$, the curve is', [
        ['concave down, because $\\frac{d^2y}{dx^2} < 0$', 'Right: $\\frac{d^2y}{dx^2} = -\\frac{' + B + '}{' + (A * A) + '\\sin^3 t} < 0$ when $\\sin t > 0$: the top half of the ellipse bends down.'],
        ['concave up, because $\\frac{d}{dt}\\left(' + D + '\\right) > 0$', 'The sign of $\\frac{d}{dt}(dy/dx)$ is not the concavity: $' + DXT + ' < 0$ on this interval flips it.'],
        ['concave up, because $\\frac{d^2y}{dx^2} > 0$', 'Check the sign: $\\frac{d^2y}{dx^2} = ' + f3(d22) + '$ at $t = ' + T.tex + '$.'],
        ['concave down, because $' + D + ' < 0$', 'Right conclusion, wrong reason: the sign of $' + D + '$ tells rising or falling. Concavity is the sign of $\\frac{d^2y}{dx^2}$.']
      ], '3.E')
    ];
    var sol2 = ['$' + D + ' = \\frac{' + B + '\\cos t}{-' + A + '\\sin t}$.', '$\\frac{d}{dt}\\left(' + D + '\\right) = \\frac{' + B + '}{' + A + '\\sin^2 t} \\approx ' + f3(dd2) + '$ at $t = ' + T.tex + '$.', '$\\frac{d^2y}{dx^2} = \\frac{' + B + '/(' + A + '\\sin^2 t)}{-' + A + '\\sin t} = -\\frac{' + B + '}{' + (A * A) + '\\sin^3 t} \\approx ' + f3(d22) + '$.', 'It is negative on $0 < t < \\pi$: concave down.'];
    return { text: text2, steps: steps2, solution: sol2, fig: figOf({ x: xs2, y: ys2 }, 0.05, PI - 0.05, { mark: t1, markLabel: T.plain }),
      values: { fam: fam, given: { x: xs2, y: ys2 }, t0: t1, dd: dd2, d2: d22, dydx: key2 } };
  };

  /* Curves for arc length (and their derivatives written out). */
  var LCURVES = [
    function(r){ var p = r.pick([1, 2, 3]), q = r.pick([1, 2]); return { x: co(p, 't^2'), y: co(q, 't^3'), dx: (2 * p) + 't', dy: (3 * q) + 't^2', a: 0, b: r.pick([1, 1.5, 2]) }; },
    function(r){ var A = r.pick([2, 3]), B = r.pick([1, 2]); return { x: 't + ' + A + 'cos(t)', y: co(B, 'sin(t)'), dx: '1 - ' + A + 'sin(t)', dy: co(B, 'cos(t)'), a: 0, b: r.pick([2, 3, 4]) }; },
    function(r){ var A = r.pick([1, 2]); return { x: 'e^(t/2)', y: co(A, 'sin(t)'), dx: '0.5e^(t/2)', dy: co(A, 'cos(t)'), a: 0, b: r.pick([2, 3]) }; },
    function(r){ var c = r.pick([1, 2, 3]); return { x: 'ln(t + 1)', y: 't^2 - ' + c + 't', dx: '1/(t + 1)', dy: '2t - ' + c, a: 0, b: r.pick([2, 3, 4]) }; }
  ];
  function speedFn(dx, dy){ var u = fn(dx), v = fn(dy); return function(t){ var p = u(t), q = v(t); return Math.sqrt(p * p + q * q); }; }
  GEN.length = function(r){
    var C = r.pick(LCURVES)(r), S = speedFn(C.dx, C.dy), u = fn(C.dx), v = fn(C.dy), X = fn(C.x), Y = fn(C.y);
    var L = M.integral(S, C.a, C.b, 1e-12), noRoot = M.integral(function(t){ return u(t) * u(t) + v(t) * v(t); }, C.a, C.b, 1e-12);
    var sum = M.integral(function(t){ return Math.abs(u(t)) + Math.abs(v(t)); }, C.a, C.b, 1e-12);
    var chord = Math.hypot(X(C.b) - X(C.a), Y(C.b) - Y(C.a)), one = M.integral(function(t){ var q = v(t); return Math.sqrt(1 + q * q); }, C.a, C.b, 1e-12);
    var A0 = n(C.a), B0 = n(C.b);
    var text = H('<p>A curve is traced by $x(t) = ' + tx(C.x) + '$ and $y(t) = ' + tx(C.y) + '$ for $' + A0 + ' \\le t \\le ' + B0 + '$. Use a calculator.</p>');
    var I = function(body){ return '$\\int_{' + A0 + '}^{' + B0 + '} ' + body + '\\,dt$'; };
    var steps = [
      choice('setup', 'Which integral gives the length of the curve?', [
        [I('\\sqrt{(x\'(t))^2 + (y\'(t))^2}'), 'Right: arc length adds up the speed, $\\sqrt{(x\')^2 + (y\')^2}$, over the time interval.'],
        [I('\\sqrt{1 + (y\'(t))^2}'), 'That mixes the formula for $y = f(x)$ with the parameter $t$. With $x$ and $y$ both functions of $t$, use $\\sqrt{(x\')^2 + (y\')^2}$.'],
        [I('\\left((x\'(t))^2 + (y\'(t))^2\\right)'), 'The square root is missing: the integrand is the speed, $\\sqrt{(x\')^2 + (y\')^2}$.'],
        [I('\\sqrt{(x(t))^2 + (y(t))^2}'), 'That is the distance from the origin, not the speed. Square the derivatives, not the positions.']
      ], '1.D'),
      numStep('len', 'Find the length of the curve.', L, [
        [noRoot, 'That integrates $(x\')^2 + (y\')^2$ without the square root.'],
        [chord, 'That is the straight-line distance between the endpoints. The curve bends, so integrate the speed.'],
        [sum, 'That integrates $|x\'| + |y\'|$. The speed is $\\sqrt{(x\')^2 + (y\')^2}$.'],
        [one, 'That integrates $\\sqrt{1 + (y\')^2}$ in $t$, which mixes two formulas.']
      ], { calc: true })
    ];
    var sol = ['$x\'(t) = ' + tx(C.dx) + '$ and $y\'(t) = ' + tx(C.dy) + '$.', 'Length $= \\int_{' + A0 + '}^{' + B0 + '} \\sqrt{(' + tx(C.dx) + ')^2 + (' + tx(C.dy) + ')^2}\\,dt \\approx ' + f3(L) + '$.', 'Store the value in the calculator and round only at the end, to three decimal places.'];
    return { text: text, steps: steps, solution: sol, fig: figOf({ x: C.x, y: C.y }, C.a, C.b, {}), values: { given: { x: C.x, y: C.y }, a: C.a, b: C.b, len: L } };
  };

  /* Position functions for the vector kind, with derivatives written out. */
  var VCURVES = [
    function(r){ var X = [r.pick([1, 2, -1]), r.int(-4, 4), 0], Y = [r.pick([1, -1]), r.int(-2, 2), r.int(-5, 5), 0]; var dX = pder(X), dY = pder(Y);
      return { x: polyStr(X), y: polyStr(Y), dx: polyStr(dX), dy: polyStr(dY), ddx: polyStr(pder(dX)), ddy: polyStr(pder(dY)), t0: r.int(-2, 3), calc: false }; },
    function(r){ var A = r.pick([2, 3]), k = r.pick([2, 3]); return { x: A + 'sin(t) + t', y: 'cos(' + k + 't)', dx: A + 'cos(t) + 1', dy: '-' + k + 'sin(' + k + 't)', ddx: '-' + A + 'sin(t)', ddy: '-' + (k * k) + 'cos(' + k + 't)', t0: r.pick([1, 2, 2.5]), calc: true }; },
    function(r){ var c = r.pick([2, 3]); return { x: 'e^(-t) + ' + c + 't', y: 't^2 - ' + c + 'sqrt(t + 1)', dx: '-e^(-t) + ' + c, dy: '2t - ' + c + '/(2sqrt(t + 1))', ddx: 'e^(-t)', ddy: '2 + ' + c + '/(4(t + 1)^(3/2))', t0: r.pick([0.5, 1, 1.5]), calc: true }; }
  ];
  GEN.vector = function(r){
    var C, vx, vy, guard = 0;
    do { C = r.pick(VCURVES)(r); vx = fn(C.dx)(C.t0); vy = fn(C.dy)(C.t0); guard++; }
    while(guard < 200 && (Math.abs(vx) < 0.05 || Math.abs(vy) < 0.05 || Math.abs(Math.abs(vx) - Math.abs(vy)) < 0.01));
    var ay = fn(C.ddy)(C.t0), ax = fn(C.ddx)(C.t0), xt = fn(C.x)(C.t0), yt = fn(C.y)(C.t0), T0 = n(C.t0), o = { calc: C.calc };
    var text = H('<p>A particle moves in the plane with position vector $\\left\\langle ' + tx(C.x) + ', ' + tx(C.y) + ' \\right\\rangle$ at time $t$' + (C.calc ? ' (radians where needed). Use a calculator.' : '.') + '</p>');
    var horiz = vx > 0 ? 'right' : 'left', vert = vy > 0 ? 'up' : 'down', slopeUp = vy / vx > 0 ? 'up' : 'down';
    var dirs = [['right', 'up'], ['right', 'down'], ['left', 'up'], ['left', 'down']];
    var opts = dirs.map(function(d){
      var ok = d[0] === horiz && d[1] === vert, why;
      if(ok) why = 'Right: $x\'(' + T0 + ') ' + rel(vx) + '$ moves it ' + horiz + ' and $y\'(' + T0 + ') ' + rel(vy) + '$ moves it ' + vert + '.';
      else if(d[0] === horiz && d[1] === slopeUp && slopeUp !== vert) why = 'That reads up or down from the sign of $' + D + '$. Up or down is the sign of $y\'(t)$ alone: $y\'(' + T0 + ') ' + rel(vy) + '$.';
      else if(d[0] !== horiz && d[1] === vert) why = 'Left or right is the sign of $x\'(t)$: $x\'(' + T0 + ') ' + rel(vx) + '$, so it moves ' + horiz + '.';
      else if(d[0] === horiz) why = 'Up or down is the sign of $y\'(t)$: $y\'(' + T0 + ') ' + rel(vy) + '$, so it moves ' + vert + '.';
      else why = 'Read each component\'s sign: $x\'(' + T0 + ') ' + rel(vx) + '$ and $y\'(' + T0 + ') ' + rel(vy) + '$.';
      return [ok, d[0] + ' and ' + d[1], why];
    }).sort(function(a, b){ return a[0] === b[0] ? 0 : a[0] ? -1 : 1; }).map(function(q){ return [q[1], q[2]]; });
    var steps = [
      numStep('vx', 'Find the $x$-component of the velocity at $t = ' + T0 + '$.', vx, [[vy, 'That is the $y$-component. The $x$-component of velocity is $x\'(t)$.'], [xt, 'That is the position $x(' + T0 + ')$. Velocity is the derivative.']], o),
      numStep('vy', 'Find the $y$-component of the velocity at $t = ' + T0 + '$.', vy, [[vx, 'That is the $x$-component. The $y$-component of velocity is $y\'(t)$.'], [yt, 'That is the position $y(' + T0 + ')$. Velocity is the derivative.']], o),
      numStep('ay', 'Find the $y$-component of the acceleration at $t = ' + T0 + '$.', ay, [[vy, 'That is the velocity\'s $y$-component. Acceleration is the second derivative, $y\'\'(t)$.'], [ax, 'That is the acceleration\'s $x$-component, $x\'\'(t)$.']], o),
      choice('dir', 'At $t = ' + T0 + '$, the particle is moving', opts, '3.E')
    ];
    var sol = ['Velocity: $\\left\\langle x\'(t), y\'(t) \\right\\rangle = \\left\\langle ' + tx(C.dx) + ', ' + tx(C.dy) + ' \\right\\rangle$.', 'At $t = ' + T0 + '$: $\\left\\langle ' + f3(vx) + ', ' + f3(vy) + ' \\right\\rangle$.', 'Acceleration: $y\'\'(t) = ' + tx(C.ddy) + '$, so $y\'\'(' + T0 + ') \\approx ' + f3(ay) + '$.', 'The signs of $x\'$ and $y\'$ give the direction: ' + horiz + ' and ' + vert + '.'];
    var span = Math.max(2, Math.abs(C.t0) + 1.5);
    return { text: text, steps: steps, solution: sol, fig: figOf({ x: C.x, y: C.y }, C.calc ? 0 : -span, C.calc ? C.t0 + 1.5 : span, { mark: C.t0 }),
      values: { given: { x: C.x, y: C.y }, t0: C.t0, vx: vx, vy: vy, ay: ay } };
  };

  /* Velocity components for the calculator kinds (no tidy antiderivative). */
  var VELS = [
    function(r){ var A = r.pick([2, 3]), k = r.pick([3, 4, 5]); return { dx: A + 'cos(t^2/' + k + ')', dy: '1 + sin(t)' }; },
    function(r){ var B = r.pick([2, 3]); return { dx: 'sqrt(t + 1) - 1', dy: B + 'sin(t^2/4)' }; },
    function(r){ var A = r.pick([1, 2]); return { dx: 'ln(t^2 + 1) - ' + A, dy: 'e^(-t/2)' + (r() < 0.5 ? '' : ' - 0.5') }; },
    function(r){ var A = r.pick([2, 3]); return { dx: 't*cos(t) + 1', dy: A + ' - t^2/2' }; }
  ];
  GEN.position = function(r){
    var V = r.pick(VELS)(r), u = fn(V.dx), v = fn(V.dy), t1 = r.pick([0, 0, 1]), T = t1 + r.pick([2, 2.5, 3]), x1 = r.nonzero(-4, 4), y1 = r.nonzero(-4, 4);
    var Ix = M.integral(u, t1, T, 1e-12), Iy = M.integral(v, t1, T, 1e-12), Ix0 = M.integral(u, 0, T, 1e-12), Iy0 = M.integral(v, 0, T, 1e-12);
    var A1 = n(t1), B1 = n(T);
    var text = H('<p>A particle moves in the plane with velocity vector $\\left\\langle ' + tx(V.dx) + ', ' + tx(V.dy) + ' \\right\\rangle$. At $t = ' + A1 + '$ it is at the point $(' + x1 + ', ' + y1 + ')$. Use a calculator.</p>');
    var I = function(c){ return '\\int_{' + A1 + '}^{' + B1 + '} ' + c + '\\,dt'; };
    var mx = [[x1 - Ix, 'The starting value is added: $x(' + B1 + ') = x(' + A1 + ') + ' + I('x\'(t)') + '$.'], [Ix, 'That is the change in $x$ only. Add the starting value $x(' + A1 + ') = ' + x1 + '$.']];
    if(t1) mx.push([x1 + Ix0, 'The integral runs from the time you know the position, $t = ' + A1 + '$, not from $0$.']);
    var my = [[y1 - Iy, 'The starting value is added: $y(' + B1 + ') = y(' + A1 + ') + ' + I('y\'(t)') + '$.'], [Iy, 'That is the change in $y$ only. Add the starting value $y(' + A1 + ') = ' + y1 + '$.'], [x1 + Iy, 'Use the starting $y$-coordinate, $' + y1 + '$, with the $y$-component.']];
    if(t1) my.push([y1 + Iy0, 'The integral runs from $t = ' + A1 + '$, where the position is known.']);
    var steps = [
      choice('setup', 'Which expression gives $x(' + B1 + ')$?', [
        ['$' + x1 + ' + ' + I('x\'(t)') + '$', 'Right: the position is the starting value plus the accumulated change, $x(' + B1 + ') = x(' + A1 + ') + ' + I('x\'(t)') + '$.'],
        ['$' + x1 + ' - ' + I('x\'(t)') + '$', 'The change is added to the starting value, never subtracted.'],
        ['$' + I('x\'(t)') + '$', 'That is only the change in $x$. Add the starting value $x(' + A1 + ') = ' + x1 + '$.'],
        ['$' + x1 + ' + x\'(' + B1 + ')$', 'That adds a velocity, not a change in position. Integrate $x\'(t)$ over the time interval.']
      ], '1.D'),
      numStep('xT', 'Find $x(' + B1 + ')$.', x1 + Ix, mx, { calc: true }),
      numStep('yT', 'Find $y(' + B1 + ')$.', y1 + Iy, my, { calc: true })
    ];
    var sol = ['$x(' + B1 + ') = ' + x1 + ' + ' + I('x\'(t)') + ' \\approx ' + x1 + ' + (' + f3(Ix) + ') = ' + f3(x1 + Ix) + '$.', '$y(' + B1 + ') = ' + y1 + ' + ' + I('y\'(t)') + ' \\approx ' + y1 + ' + (' + f3(Iy) + ') = ' + f3(y1 + Iy) + '$.', 'Keep the stored values and round only at the end.'];
    return { text: text, steps: steps, solution: sol, fig: figOf({ dx: V.dx, dy: V.dy, x0: x1, y0: y1 }, t1, T, { mark: T, hide: true, label: 'The particle\'s starting point; its path appears once both coordinates are found' }),
      values: { given: { dx: V.dx, dy: V.dy }, t1: t1, T: T, x1: x1, y1: y1, xT: x1 + Ix, yT: y1 + Iy } };
  };

  GEN.plane = function(r){
    var V, u, v, T, t0, dist, disp, sp, vx, vy;
    for(var guard = 0; guard < 200; guard++){
      V = r.pick(VELS)(r); u = fn(V.dx); v = fn(V.dy); T = r.pick([2, 2.5, 3, 3.5]); t0 = r.pick([0.5, 1, 1.5, 2].filter(function(q){ return q < T; }));
      vx = u(t0); vy = v(t0); sp = Math.hypot(vx, vy);
      dist = M.integral(function(t){ return Math.hypot(u(t), v(t)); }, 0, T, 1e-12);
      disp = Math.hypot(M.integral(u, 0, T, 1e-12), M.integral(v, 0, T, 1e-12));
      if(Math.abs(vx) > 0.08 && Math.abs(vy) > 0.08 && dist - disp > 0.05 && Math.abs(sp - Math.abs(vy / vx)) > 0.01) break;
    }
    var ay = M.integral(function(t){ return Math.abs(v(t)); }, 0, T, 1e-12), sq = M.integral(function(t){ return u(t) * u(t) + v(t) * v(t); }, 0, T, 1e-12);
    var T0 = n(t0), B0 = n(T), incr = vy > 0, slopeSign = vy / vx > 0;
    var text = H('<p>A particle moves in the plane with $x\'(t) = ' + tx(V.dx) + '$ and $y\'(t) = ' + tx(V.dy) + '$ for $0 \\le t \\le ' + B0 + '$. Use a calculator.</p>');
    var yes = incr ? 'Yes' : 'No', no = incr ? 'No' : 'Yes';
    var steps = [
      numStep('spd', 'Find the speed of the particle at $t = ' + T0 + '$.', sp, [
        [Math.abs(vy / vx), 'That is $\\left|' + D + '\\right|$, the steepness of the path. Speed is $\\sqrt{(x\')^2 + (y\')^2}$.'],
        [vx * vx + vy * vy, 'Take the square root: speed is $\\sqrt{(x\')^2 + (y\')^2}$.'],
        [Math.abs(vx) + Math.abs(vy), 'Speed is the length of the velocity vector, $\\sqrt{(x\')^2 + (y\')^2}$, not the sum of the components.']], { calc: true }),
      numStep('dist', 'Find the total distance traveled from $t = 0$ to $t = ' + B0 + '$.', dist, [
        [disp, 'That is the straight-line distance from start to finish (the size of the displacement). Distance traveled integrates the speed.'],
        [ay, 'That counts the vertical motion only. Integrate the speed, $\\sqrt{(x\')^2 + (y\')^2}$.'],
        [sq, 'The square root is missing from the integrand.']], { calc: true }),
      choice('yinc', 'Is the $y$-coordinate of the particle increasing at $t = ' + T0 + '$?', [
        [yes + ', because $y\'(' + T0 + ') ' + rel(vy) + '$', 'Right: whether $y$ increases is the sign of $' + DYT + '$ alone.'],
        slopeSign === incr ? [yes + ', because $' + D + ' ' + rel(vy / vx) + '$ there', 'Right answer, wrong reason: $' + D + '$ is the slope of the path. Whether $y$ increases with time is the sign of $' + DYT + '$.']
          : [no + ', because $' + D + ' ' + rel(vy / vx) + '$ there', 'The sign of $' + D + '$ is not the answer: $x\'(' + T0 + ') < 0$ flips it. Whether $y$ increases is the sign of $' + DYT + '$.'],
        [(vx > 0 ? 'Yes' : 'No') + ', because $x\'(' + T0 + ') ' + rel(vx) + '$', 'The sign of $x\'$ says whether $x$ increases. For $y$, read $y\'(t)$.'],
        [no + ', because the speed is ' + (incr ? 'positive' : 'not zero'), 'Speed is never negative, so it cannot say whether $y$ rises or falls.']
      ], '3.E')
    ];
    var sol = ['Speed $= \\sqrt{(x\'(' + T0 + '))^2 + (y\'(' + T0 + '))^2} = \\sqrt{(' + f3(vx) + ')^2 + (' + f3(vy) + ')^2} \\approx ' + f3(sp) + '$.', 'Distance $= \\int_0^{' + B0 + '} \\sqrt{(x\'(t))^2 + (y\'(t))^2}\\,dt \\approx ' + f3(dist) + '$.', '$y\'(' + T0 + ') \\approx ' + f3(vy) + '$ is ' + sgnWord(vy) + ', so $y$ is ' + (incr ? 'increasing' : 'decreasing') + ' at $t = ' + T0 + '$.'];
    return { text: text, steps: steps, solution: sol, fig: figOf({ dx: V.dx, dy: V.dy, x0: 0, y0: 0 }, 0, T, { mark: t0, rel: true, label: 'The shape of the path, drawn from its position at t = 0' }),
      values: { given: { dx: V.dx, dy: V.dy }, t0: t0, T: T, speed: sp, dist: dist, vx: vx, vy: vy } };
  };

  var TITLE = { slope: 'Slope of a parametric curve', second: 'Second derivative and concavity', length: 'Arc length', vector: 'Velocity and acceleration vectors', position: 'Position from velocity', plane: 'Speed and distance in the plane' };
  var KINDS = ['slope', 'second', 'length', 'vector', 'position', 'plane'];
  var TOPIC = { slope: 'parametric-derivatives', second: 'parametric-second-derivatives', length: 'parametric-arc-length', vector: 'vector-derivatives', position: 'vector-integrals', plane: 'planar-motion' };
  function generate(r, ctx, type){
    var kind = type || ctx.kind;
    if(!GEN[kind]) throw new Error('parametric-motion: no problem kind "' + kind + '"');
    var p = GEN[kind](r);
    p.ctx = ctx.id; p.topic = ctx.topic; p.type = kind; p.title = TITLE[kind];
    p.solution = p.solution.map(H);
    return p;
  }
  /* The drill figure's path: [[x, y]...] for t in [a, b], from its strings. */
  function figPath(f, N){
    N = N || 240;
    var out = [], a = f.a, b = f.b, X, Y, u, v, x = f.x0, y = f.y0;
    if(f.x){ X = fn(f.x); Y = fn(f.y); }
    else { u = fn(f.dx); v = fn(f.dy); }
    for(var i = 0; i <= N; i++){
      var t = a + (b - a) * i / N;
      if(f.x) out.push([X(t), Y(t), t]);
      else { if(i){ var t0 = a + (b - a) * (i - 1) / N; x += M.integral(u, t0, t, 1e-11); y += M.integral(v, t0, t, 1e-11); } out.push([x, y, t]); }
    }
    return out;
  }

  M.register('parametricMotion', {
    PATHS: PATHS, ORDER: ORDER, KINDS: KINDS, TITLE: TITLE, TOPIC: TOPIC,
    compiled: compiled, integ: integ, table: table, posAt: posAt, distTo: distTo, at: at, special: special, describe: describe,
    generate: generate, figPath: figPath, n: n, f3: f3, tx: tx, piT: piT
  });
})(typeof window !== 'undefined' ? window : globalThis);
