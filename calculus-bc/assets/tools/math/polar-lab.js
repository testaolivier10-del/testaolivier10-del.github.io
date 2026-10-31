/* Polar lab model: ApCalcMath.polarLab (docs/apcalcbc-architecture.md, "Trainers").
   OWNED BY THIS TOOL ONLY (builder T2). Pure functions, no DOM, so the validator
   (scripts/lib/apcalcbc-tool-checks/polar-lab.mjs) and the test
   (scripts/test/apcalcbc-tool-polar-lab.test.mjs) run exactly this code.

   Every curve is an expression string in theta (ApCalcExpr syntax): the TeX the
   page prints and the function it draws are made from the same string.

   Explore: CURVES[id] (one curve r = f(θ), with its regions: an interval [α, β]
   of θ) and PAIRS[id] (an outer and an inner curve and the interval between
   their meeting angles). at(c, θ) gives r, dr/dθ, x = r cos θ, y = r sin θ,
   dx/dθ, dy/dθ and dy/dx = (dy/dθ)/(dx/dθ); area(c, α, θ) is ½∫ r² dθ (for a
   pair ½∫ (R² − r²) dθ) by adaptive Simpson; motion(r, dr) says whether the
   point moves toward or away from the origin (the sign of r·dr/dθ).

   Test yourself: generate(rng, ctx, type) for the kinds
     coords   9.7  x = r cos θ, dr/dθ, toward or away from the origin, dy/dx
     area     9.8  the θ limits, the ½∫ r² dθ setup, the area
     between  9.9  where the curves meet, the ½∫ (R² − r²) dθ setup, the area */
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
  function n(x, d){
    if(Math.abs(x - Math.round(x)) < 1e-9) return String(Math.round(x));
    var s = M.fixed(x, d == null ? 3 : d).replace(/0+$/, '').replace(/\.$/, '');
    return s === '-0' ? '0' : s;
  }
  function f3(x){ var s = M.fixed(x, 3); return s === '-0.000' ? '0.000' : s; }
  function tx(s){ return M.toTex(M.parse(s, { vars: ['theta'] })); }
  function fn(s){ return M.fn(s, ['theta']); }
  function co(k, s){ return (k === 1 ? '' : k === -1 ? '-' : String(k)) + s; }
  function gcd(a, b){ a = Math.abs(a); b = Math.abs(b); while(b){ var t = a % b; a = b; b = t; } return a || 1; }
  /* k/d of pi: TeX, value and plain text. */
  function piT(k, d){
    if(k === 0) return { tex: '0', v: 0, plain: '0' };
    var g = gcd(k, d); k /= g; d /= g;
    var a = Math.abs(k), s = k < 0 ? '-' : '';
    return { tex: d === 1 ? s + (a === 1 ? '' : a) + '\\pi' : s + '\\frac{' + (a === 1 ? '' : a) + '\\pi}{' + d + '}', v: k * PI / d, plain: s + (a === 1 ? '' : a) + 'π' + (d === 1 ? '' : '/' + d) };
  }
  function sgnWord(x){ return x > 0 ? 'positive' : x < 0 ? 'negative' : 'zero'; }
  function rel(x){ return x > 0 ? '> 0' : x < 0 ? '< 0' : '= 0'; }
  var DR = '\\frac{dr}{d\\theta}', D = '\\frac{dy}{dx}';

  /* ------------------------------------------------------- explore */
  var CURVES = {
    cardioid: { id: 'cardioid', name: 'Cardioid', r: '2 + 2cos(theta)', dr: '-2sin(theta)',
      regions: [{ id: 'all', name: 'Whole curve', a: [0, 1], b: [2, 1] }] },
    limacon: { id: 'limacon', name: 'Limaçon', r: '1 + 2cos(theta)', dr: '-2sin(theta)',
      regions: [{ id: 'inner', name: 'Inner loop', a: [2, 3], b: [4, 3] }, { id: 'all', name: 'Whole trace', a: [0, 1], b: [2, 1], twice: true }] },
    rose3: { id: 'rose3', name: 'Three petals', r: '3sin(3theta)', dr: '9cos(3theta)',
      regions: [{ id: 'petal', name: 'One petal', a: [0, 1], b: [1, 3] }, { id: 'all', name: 'All petals', a: [0, 1], b: [1, 1] }] },
    rose4: { id: 'rose4', name: 'Four petals', r: '2cos(2theta)', dr: '-4sin(2theta)',
      regions: [{ id: 'petal', name: 'One petal', a: [-1, 4], b: [1, 4] }, { id: 'all', name: 'All petals', a: [0, 1], b: [2, 1] }] },
    spiral: { id: 'spiral', name: 'Spiral', r: 'theta/2', dr: '1/2',
      regions: [{ id: 'turn', name: 'First turn', a: [0, 1], b: [2, 1] }] }
  };
  var PAIRS = {
    moon: { id: 'moon', name: 'Circle and cardioid', R: '3cos(theta)', r: '1 + cos(theta)', dR: '-3sin(theta)', dr: '-sin(theta)', a: [-1, 3], b: [1, 3], exact: PI, exactTex: '\\pi' },
    bulge: { id: 'bulge', name: 'Cardioid and circle', R: '2 + 2cos(theta)', r: '2', dR: '-2sin(theta)', dr: '0', a: [-1, 2], b: [1, 2], exact: 8 + PI, exactTex: '8 + \\pi' },
    cap: { id: 'cap', name: 'Two circles', R: '4sin(theta)', r: '2', dR: '4cos(theta)', dr: '0', a: [1, 6], b: [5, 6], exact: 4 * PI / 3 + 2 * Math.sqrt(3), exactTex: '\\frac{4\\pi}{3} + 2\\sqrt{3}' }
  };
  var ORDER = ['cardioid', 'limacon', 'rose3', 'rose4', 'spiral'], PORDER = ['moon', 'bulge', 'cap'];
  function compiled(c){
    if(!c.F) c.F = c.R ? { R: fn(c.R), r: fn(c.r), dR: fn(c.dR), dr: fn(c.dr) } : { r: fn(c.r), dr: fn(c.dr) };
    return c.F;
  }
  function limits(o){ return [piT(o.a[0], o.a[1]), piT(o.b[0], o.b[1])]; }
  /* The state of r = f(θ) at θ. */
  function point(r, dr, th){
    var c = Math.cos(th), s = Math.sin(th), dx = dr * c - r * s, dy = dr * s + r * c;
    return { th: th, r: r, dr: dr, x: r * c, y: r * s, dx: dx, dy: dy, slope: Math.abs(dx) > 1e-9 ? dy / dx : NaN };
  }
  function at(c, th, which){
    var F = compiled(c);
    if(which === 'R') return point(F.R(th), F.dR(th), th);
    return point(F.r(th), F.dr(th), th);
  }
  /* ½∫ r² dθ from a to b (a pair: ½∫ (R² − r²) dθ). */
  function area(c, a, b){
    var F = compiled(c);
    var g = c.R ? function(t){ var R = F.R(t), r = F.r(t); return (R * R - r * r) / 2; } : function(t){ var r = F.r(t); return r * r / 2; };
    // In pieces: on a whole turn the first Simpson samples can agree by symmetry and stop early.
    var N = Math.max(1, Math.ceil(Math.abs(b - a) / 0.4)), s = 0;
    for(var i = 0; i < N; i++) s += M.integral(g, a + (b - a) * i / N, a + (b - a) * (i + 1) / N, 1e-12);
    return s;
  }
  /* Toward or away from the origin: the distance is |r|, so the sign of r·dr/dθ decides. */
  function motion(r, dr){
    if(Math.abs(r) < 1e-9) return 'origin';
    if(Math.abs(dr) < 1e-9) return 'steady';
    return r * dr > 0 ? 'away' : 'toward';
  }
  function describe(c, th){
    var s = at(c, th), m = motion(s.r, s.dr);
    if(m === 'origin') return { state: m, s: s, head: 'r = 0: the curve passes through the origin here.' };
    if(m === 'steady') return { state: m, s: s, head: 'dr/dθ = 0: for an instant the point is neither nearer nor farther from the origin.' };
    var neg = s.r < 0 ? ' r < 0, so the point is plotted on the opposite ray.' : '';
    return { state: m, s: s, head: 'The point moves ' + (m === 'away' ? 'away from' : 'toward') + ' the origin: r and dr/dθ have ' + (m === 'away' ? 'the same sign' : 'opposite signs') + '.' + neg };
  }
  /* The curve as [[x, y, θ]...] for θ in [a, b]. */
  function trace(f, a, b, N){
    N = N || 360;
    var out = [];
    for(var i = 0; i <= N; i++){ var t = a + (b - a) * i / N, r = f(t); out.push([r * Math.cos(t), r * Math.sin(t), t]); }
    return out;
  }

  /* ------------------------------------------------------- the drill */
  function choice(key, label, list, practice){
    return { key: key, kind: 'choice', label: H(label), options: list.map(function(o){ return optHtml(o[0]); }), why: list.map(function(o){ return H(o[1]); }), correct: 0, practice: practice || '3.E' };
  }
  function numStep(key, label, answer, mistakes, o){
    o = o || {};
    var calc = !!o.calc, whole = !calc && Math.abs(answer - Math.round(answer)) < 1e-9;
    return { key: key, kind: 'num', label: H(label), unit: o.unit || '', practice: o.practice || '1.E', d: whole ? 0 : 3,
      hint: o.hint || (calc ? 'Calculator: correct to three decimal places.' : whole ? '' : 'Exact (like pi/3 or sqrt(3)/2) or to three decimal places.'),
      cell: M.cell(answer, calc ? 0 : 6e-4, (mistakes || []).map(function(m){ return { value: m[0], why: H(m[1]) }; }), calc ? 0.001 : 6e-4) };
  }
  /* "½∫ from α to β of (body) dθ" in TeX. */
  function I(a, b, body, half){ return (half === false ? '' : '\\frac{1}{2}') + '\\int_{' + a + '}^{' + b + '} ' + body + '\\,d\\theta'; }

  /* r = f(θ) families for the coordinate kind, derivatives written out. */
  var RFAM = [
    function(r){ var a = r.pick([1, 2, 3]), b = r.pick([1, 2, 3, 4]); return { r: a + ' + ' + co(b, 'cos(theta)'), dr: '-' + co(b, 'sin(theta)') }; },
    function(r){ var a = r.pick([1, 2, 3]), b = r.pick([1, 2, 3, 4]); return { r: a + ' - ' + co(b, 'sin(theta)'), dr: '-' + co(b, 'cos(theta)') }; },
    function(r){ var a = r.pick([2, 3, 4]), k = r.pick([2, 3]); return { r: a + 'sin(' + k + 'theta)', dr: (a * k) + 'cos(' + k + 'theta)' }; },
    function(r){ var a = r.pick([2, 3, 4]), k = r.pick([2, 3]); return { r: a + 'cos(' + k + 'theta)', dr: '-' + (a * k) + 'sin(' + k + 'theta)' }; }
  ];
  var ANG = [[1, 6], [1, 4], [1, 3], [2, 3], [3, 4], [5, 6], [7, 6], [5, 4], [4, 3], [5, 3], [7, 4], [11, 6]];
  var GEN = {};
  GEN.coords = function(r){
    var C, T, s, guard = 0;
    do {
      C = r.pick(RFAM)(r); var q = r.pick(ANG); T = piT(q[0], q[1]);
      s = point(fn(C.r)(T.v), fn(C.dr)(T.v), T.v); guard++;
    } while(guard < 300 && (Math.abs(s.r) < 0.05 || Math.abs(s.dr) < 0.05 || Math.abs(s.dx) < 0.05 || Math.abs(s.dy) < 0.05 || Math.abs(s.x - s.y) < 0.01 || Math.abs(s.slope - s.dr) < 0.01 || Math.abs(s.slope * s.dr - 1) < 0.01));
    var th = T.tex, m = motion(s.r, s.dr), away = m === 'away';
    var text = H('<p>A curve is given in polar coordinates by $r = ' + tx(C.r) + '$.</p>');
    var drAlone = s.dr > 0 ? 'away from' : 'toward';
    var steps = [
      numStep('x', 'Find the $x$-coordinate of the point where $\\theta = ' + th + '$.', s.x, [
        [s.y, 'That is $y = r\\sin\\theta$. The $x$-coordinate is $r\\cos\\theta$.'],
        [s.r, 'That is $r$, the signed distance along the ray. The $x$-coordinate is $r\\cos\\theta$.']], { practice: '1.E' }),
      numStep('dr', 'Find $' + DR + '$ at $\\theta = ' + th + '$.', s.dr, [[s.r, 'That is $r$ itself. Differentiate first: $' + DR + ' = ' + tx(C.dr) + '$.'], [-s.dr, 'Check the sign: the derivative of $\\cos\\theta$ is $-\\sin\\theta$ and of $\\sin\\theta$ is $\\cos\\theta$.']]),
      choice('move', 'At $\\theta = ' + th + '$, is the point on the curve moving toward or away from the origin as $\\theta$ increases?', [
        [(away ? 'Away from' : 'Toward') + ' the origin, because $r$ and $' + DR + '$ have ' + (away ? 'the same sign' : 'opposite signs'), 'Right: the distance from the origin is $|r|$. It grows when $r$ and $' + DR + '$ share a sign and shrinks when they differ.'],
        s.r < 0 ? [drAlone.charAt(0).toUpperCase() + drAlone.slice(1) + ' the origin, because $' + DR + ' ' + rel(s.dr) + '$', 'Here $r ' + rel(s.r) + '$: the point is on the opposite ray, so the sign of $' + DR + '$ alone does not decide. Compare the signs of $r$ and $' + DR + '$.']
          : [(away ? 'Toward' : 'Away from') + ' the origin, because $r ' + rel(s.r) + '$', 'The sign of $r$ alone says which ray the point is on. Compare it with the sign of $' + DR + '$.'],
        [(away ? 'Toward' : 'Away from') + ' the origin, because $' + D + ' ' + rel(s.slope) + '$', '$' + D + '$ is the slope of the tangent line, not the change in distance from the origin. Read $r$ and $' + DR + '$.'],
        ['Neither: $r$ is not zero', 'The point moves toward or away from the origin unless $' + DR + ' = 0$. Compare the signs of $r$ and $' + DR + '$.']
      ], '3.E'),
      numStep('dydx', 'Find the slope $' + D + '$ of the curve at $\\theta = ' + th + '$.', s.slope, [
        [s.dr, 'That is $' + DR + '$, the rate of change of $r$. The slope is $\\frac{dy/d\\theta}{dx/d\\theta}$.'],
        [s.dy, 'That is $\\frac{dy}{d\\theta}$ alone. Divide by $\\frac{dx}{d\\theta} = ' + DR + '\\cos\\theta - r\\sin\\theta$.'],
        [s.dx / s.dy, 'That is $\\frac{dx/d\\theta}{dy/d\\theta}$, upside down.'],
        [-Math.cos(T.v) / Math.sin(T.v), 'That treats $r$ as a constant. Use the product rule on $y = r\\sin\\theta$ and $x = r\\cos\\theta$: each derivative has two terms.']
      ], { practice: '1.E' })
    ];
    var sol = ['$r(' + th + ') = ' + f3(s.r) + '$, so $x = r\\cos\\theta \\approx ' + f3(s.x) + '$ (and $y = r\\sin\\theta \\approx ' + f3(s.y) + '$).', '$' + DR + ' = ' + tx(C.dr) + ' \\approx ' + f3(s.dr) + '$ at $\\theta = ' + th + '$.',
      '$r$ is ' + sgnWord(s.r) + ' and $' + DR + '$ is ' + sgnWord(s.dr) + ': the point moves ' + (away ? 'away from' : 'toward') + ' the origin.',
      '$\\frac{dy}{d\\theta} = ' + DR + '\\sin\\theta + r\\cos\\theta \\approx ' + f3(s.dy) + '$, $\\frac{dx}{d\\theta} = ' + DR + '\\cos\\theta - r\\sin\\theta \\approx ' + f3(s.dx) + '$, so $' + D + ' \\approx ' + f3(s.slope) + '$.'];
    return { text: text, steps: steps, solution: sol, fig: { curves: [{ r: C.r, a: 0, b: 2 * PI, cls: 'in' }], mark: { r: C.r, th: T.v }, label: 'The polar curve with the point at the given angle marked' },
      values: { given: { r: C.r }, th: T.v, x: s.x, dr: s.dr, slope: s.slope, move: m } };
  };

  GEN.area = function(r){
    var fam = r.pick(['petal', 'petal', 'loop', 'calc']), steps, sol, text, A, given, lo, hi, fig;
    var setupOpts = function(a, b, body){ return [
      ['$' + I(a, b, '\\left(' + body + '\\right)^2') + '$', 'Right: each thin slice is a sector of area $\\frac{1}{2}r^2\\,\\Delta\\theta$, and the integral adds them.'],
      ['$' + I(a, b, '\\left(' + body + '\\right)^2', false) + '$', 'The $\\frac{1}{2}$ is missing: a sector of angle $\\Delta\\theta$ has area $\\frac{1}{2}r^2\\,\\Delta\\theta$.'],
      ['$' + I(a, b, '\\left(' + body + '\\right)') + '$', 'Square $r$: a sector\'s area is $\\frac{1}{2}r^2\\,\\Delta\\theta$, not $\\frac{1}{2}r\\,\\Delta\\theta$.'],
      ['$\\pi' + I(a, b, '\\left(' + body + '\\right)^2', false) + '$', 'That is the disk method for a volume. A polar area is $\\frac{1}{2}\\int r^2\\,d\\theta$.']
    ]; };
    if(fam === 'petal'){
      var a = r.pick([2, 3, 4]), k = r.pick([2, 3]), sin = r() < 0.5;
      given = a + (sin ? 'sin(' : 'cos(') + k + 'theta)';
      var L = sin ? [piT(0, 1), piT(1, k)] : [piT(-1, 2 * k), piT(1, 2 * k)];
      lo = L[0].v; hi = L[1].v; A = PI * a * a / (4 * k);
      var trig = sin ? '\\sin(' + k + '\\theta)' : '\\cos(' + k + '\\theta)', body = a + trig, half = piT(1, 2 * k), full = piT(sin ? 2 : 1, k);
      text = H('<p>The curve $r = ' + tx(given) + '$ is a rose with ' + (k % 2 ? k : 2 * k) + ' petals. Find the area of one petal.</p>');
      var limOpts = sin ? [
        ['$0 \\le \\theta \\le ' + L[1].tex + '$', 'Right: $r = 0$ at $\\theta = 0$ and next at $\\theta = ' + L[1].tex + '$, so one petal is traced between them.'],
        ['$0 \\le \\theta \\le ' + half.tex + '$', 'That traces half a petal: $r$ is largest at $\\theta = ' + half.tex + '$, not zero. Go to the next zero of $r$.'],
        ['$0 \\le \\theta \\le ' + full.tex + '$', 'Between those angles $r$ passes through zero, so more than one petal is traced. One petal runs between consecutive zeros of $r$.'],
        ['$0 \\le \\theta \\le 2\\pi$', 'That traces every petal' + (k % 2 ? ' twice' : '') + '. One petal runs between consecutive zeros of $r$.']
      ] : [
        ['$' + L[0].tex + ' \\le \\theta \\le ' + L[1].tex + '$', 'Right: $r = 0$ at $\\theta = \\pm ' + L[1].tex + '$ and $r$ is positive between, so one petal is traced there.'],
        ['$0 \\le \\theta \\le ' + L[1].tex + '$', 'That traces half a petal, from its tip at $\\theta = 0$ to the origin.'],
        ['$0 \\le \\theta \\le ' + piT(1, k).tex + '$', 'At $\\theta = ' + piT(1, k).tex + '$, $r = -' + a + '$: past $' + L[1].tex + '$ the curve starts another petal. One petal runs between consecutive zeros of $r$.'],
        ['$0 \\le \\theta \\le 2\\pi$', 'That traces every petal' + (k % 2 ? ' twice' : '') + '. One petal runs between consecutive zeros of $r$.']
      ];
      steps = [
        choice('lim', 'Which interval of $\\theta$ traces exactly one petal?', limOpts, '2.B'),
        choice('setup', 'Which integral gives the area of one petal?', setupOpts(L[0].tex, L[1].tex, body), '1.D'),
        numStep('area', 'Find the area of one petal.', A, [
          [2 * A, 'That leaves out the $\\frac{1}{2}$.'],
          [a / k, 'That integrates $\\frac{1}{2}r$, not $\\frac{1}{2}r^2$.'],
          [A / 2, 'That is half a petal: integrate between consecutive zeros of $r$.'],
          [PI * a * a / 4, 'Divide by ' + k + ': with $\\sin^2(' + k + '\\theta)$ or $\\cos^2(' + k + '\\theta)$, the petal is only $\\frac{\\pi}{' + k + '}$ wide.']
        ], { hint: 'Exact (like 9pi/8) or to three decimal places.' })
      ];
      sol = ['$r = 0$ at $\\theta = ' + L[0].tex + '$ and $\\theta = ' + L[1].tex + '$, consecutive zeros: one petal.', 'Area $= ' + I(L[0].tex, L[1].tex, '(' + body + ')^2') + ' = \\frac{' + (a * a) + '}{2}' + '\\int_{' + L[0].tex + '}^{' + L[1].tex + '} ' + (sin ? '\\sin^2(' : '\\cos^2(') + k + '\\theta)\\,d\\theta$.',
        'With $' + (sin ? '\\sin^2 u = \\frac{1 - \\cos 2u}{2}' : '\\cos^2 u = \\frac{1 + \\cos 2u}{2}') + '$, the integral is $\\frac{' + (a * a) + '}{2} \\cdot \\frac{\\pi}{' + (2 * k) + '} = \\frac{' + (a * a) + '\\pi}{' + (4 * k) + '} \\approx ' + f3(A) + '$.'];
    } else if(fam === 'loop'){
      var a2 = r.pick([2, 3, 4]), b2 = r.pick([1, 2, 3].filter(function(q){ return q < a2; })), s2 = r() < 0.5;
      given = a2 + ' + ' + co(b2, s2 ? 'sin(theta)' : 'cos(theta)');
      lo = 0; hi = 2 * PI; A = PI * (a2 * a2 + b2 * b2 / 2);
      var body2 = tx(given);
      text = H('<p>The curve $r = ' + body2 + '$ is a limaçon with no inner loop. Find the area of the region it encloses.</p>');
      steps = [
        choice('lim', 'Over which interval does $\\theta$ trace the curve exactly once?', [
          ['$0 \\le \\theta \\le 2\\pi$', 'Right: $r > 0$ for every $\\theta$ (since ' + a2 + ' > ' + b2 + '), so one full turn traces the curve once.'],
          ['$0 \\le \\theta \\le \\pi$', 'That traces only half of the curve. $r$ is never zero, so the curve needs a full turn.'],
          ['$0 \\le \\theta \\le 4\\pi$', 'That traces the curve twice and counts its area twice.'],
          ['$-\\frac{\\pi}{2} \\le \\theta \\le \\frac{\\pi}{2}$', 'That traces only half of the curve.']
        ], '2.B'),
        choice('setup', 'Which integral gives the area enclosed?', setupOpts('0', '2\\pi', body2), '1.D'),
        numStep('area', 'Find the area enclosed by the curve.', A, [
          [2 * A, 'That leaves out the $\\frac{1}{2}$.'],
          [PI * a2, 'That integrates $\\frac{1}{2}r$, not $\\frac{1}{2}r^2$.'],
          [PI * a2 * a2, 'Expand $(' + body2 + ')^2$ fully: the $' + co(b2 * b2, s2 ? '\\sin^2' : '\\cos^2') + '\\theta$ term adds $\\frac{' + co(b2 * b2, '\\pi') + '}{2}$.'],
          [A / 2, 'That is half of the region: $\\theta$ must run through a full turn.']
        ], { hint: 'Exact (like 19pi/2) or to three decimal places.' })
      ];
      sol = ['$r = ' + body2 + ' > 0$ for all $\\theta$, so one turn $0 \\le \\theta \\le 2\\pi$ traces the curve once.', 'Area $= ' + I('0', '2\\pi', '(' + body2 + ')^2') + ' = \\frac{1}{2}\\int_0^{2\\pi} \\left(' + (a2 * a2) + ' + ' + (2 * a2 * b2) + (s2 ? '\\sin' : '\\cos') + '\\theta + ' + co(b2 * b2, s2 ? '\\sin^2' : '\\cos^2') + '\\theta\\right)d\\theta$.',
        'The middle term integrates to $0$ over a full turn; $\\int_0^{2\\pi} ' + (s2 ? '\\sin^2' : '\\cos^2') + '\\theta\\,d\\theta = \\pi$. So the area is $\\frac{1}{2}(' + (2 * a2 * a2) + '\\pi + ' + co(b2 * b2, '\\pi') + ') \\approx ' + f3(A) + '$.'];
    } else {
      var c3 = r.pick([1, 2]), bb = r.pick([[1, 2], [1, 1], [3, 4]]), Bt = piT(bb[0], bb[1]);
      given = 'theta + ' + co(c3, 'cos(theta)');
      lo = 0; hi = Bt.v;
      var fr = fn(given); A = M.integral(function(t){ var q = fr(t); return q * q / 2; }, lo, hi, 1e-12);
      var noHalf = 2 * A, noSq = M.integral(function(t){ return fr(t) / 2; }, lo, hi, 1e-12), body3 = tx(given);
      text = H('<p>Let $R$ be the region bounded by the polar curve $r = ' + body3 + '$ and the rays $\\theta = 0$ and $\\theta = ' + Bt.tex + '$. Use a calculator.</p>');
      steps = [
        choice('setup', 'Which integral gives the area of $R$?', setupOpts('0', Bt.tex, body3), '1.D'),
        numStep('area', 'Find the area of $R$.', A, [[noHalf, 'That leaves out the $\\frac{1}{2}$.'], [noSq, 'That integrates $\\frac{1}{2}r$, not $\\frac{1}{2}r^2$.'], [PI * noHalf, 'That multiplies by $\\pi$ as in a volume. A polar area is $\\frac{1}{2}\\int r^2\\,d\\theta$.']], { calc: true })
      ];
      sol = ['Area $= ' + I('0', Bt.tex, '(' + body3 + ')^2') + '$.', 'With a calculator: $\\approx ' + f3(A) + '$.', 'Show the setup with the $\\frac{1}{2}$ and the square, then the value to three decimal places.'];
    }
    fig = { curves: [{ r: given, a: fam === 'petal' ? 0 : lo, b: fam === 'petal' ? 2 * PI : (fam === 'calc' ? Math.max(hi, PI) : hi), cls: 'in' }], region: { outer: given, a: lo, b: hi }, label: 'The polar curve with the region shaded' };
    return { text: text, steps: steps, solution: sol, fig: fig, values: { fam: fam, given: { r: given }, a: lo, b: hi, area: A } };
  };

  /* Pairs that meet at tidy angles: outer R, inner r, the meeting angles. */
  var BFAM = [
    function(r){ var k = r.pick([1, 2]); return { R: (3 * k) + 'cos(theta)', r: k === 1 ? '1 + cos(theta)' : k + ' + ' + k + 'cos(theta)', a: piT(-1, 3), b: piT(1, 3), meet: piT(1, 3), exact: PI * k * k, cosv: 0.5 }; },
    function(r){ var k = r.pick([1, 2]); return { R: (2 * k) + ' + ' + (2 * k) + 'cos(theta)', r: String(2 * k), a: piT(-1, 2), b: piT(1, 2), meet: piT(1, 2), exact: 8 * k * k + PI * k * k, cosv: 0 }; },
    function(r){ var k = r.pick([1, 2, 3]); return { R: (2 * k) + 'sin(theta)', r: String(k), a: piT(1, 6), b: piT(5, 6), meet: piT(1, 6), exact: k * k * (PI / 3 + Math.sqrt(3) / 2), cosv: null }; },
    function(r){ var k = r.pick([1, 2, 3]); return { R: (2 * k) + 'cos(theta)', r: String(k), a: piT(-1, 3), b: piT(1, 3), meet: piT(1, 3), exact: k * k * (PI / 3 + Math.sqrt(3) / 2), cosv: 0.5 }; }
  ];
  GEN.between = function(r){
    var B = r.pick(BFAM)(r), Rf = fn(B.R), rf = fn(B.r), a = B.a, b = B.b, Rt = tx(B.R), rt = tx(B.r);
    var A = B.exact, sq = M.integral(function(t){ var d = Rf(t) - rf(t); return d * d / 2; }, a.v, b.v, 1e-12);
    var outerOnly = M.integral(function(t){ var q = Rf(t); return q * q / 2; }, a.v, b.v, 1e-12);
    var text = H('<p>Let $S$ be the region inside the curve $r = ' + Rt + '$ and outside the curve $r = ' + rt + '$.</p>');
    var IS = function(body, half){ return I(a.tex, b.tex, body, half); };
    var sq = function(t){ return /^[\d.]+$/.test(t) ? t + '^2' : '\\left(' + t + '\\right)^2'; };
    var meetMs = [[B.meet.v * 180 / PI, 'That is in degrees. Calculus uses radians.']];
    if(B.cosv != null && B.cosv !== 0) meetMs.push([B.cosv, 'That is the value of $\\cos\\theta$ where they meet. Solve for $\\theta$ itself.']);
    var steps = [
      numStep('meet', 'The curves meet where $' + Rt + ' = ' + rt + '$. Find the smallest positive $\\theta$ where they meet.', B.meet.v, meetMs, { hint: 'Radians: exact (like pi/3) or to three decimal places.', practice: '1.E' }),
      choice('setup', 'Which integral gives the area of $S$?', [
        ['$' + IS('\\left[' + sq(Rt) + ' - ' + sq(rt) + '\\right]') + '$', 'Right: the outer curve\'s sectors minus the inner curve\'s, $\\frac{1}{2}\\int (R^2 - r^2)\\,d\\theta$, between the angles where the curves meet.'],
        ['$' + IS('\\left(' + Rt + ' - ' + rt + '\\right)^2') + '$', 'Square each radius first, then subtract: $R^2 - r^2$ is not $(R - r)^2$.'],
        ['$' + IS('\\left[' + sq(rt) + ' - ' + sq(Rt) + '\\right]') + '$', 'That subtracts the outer curve from the inner one, so it comes out negative. Outer minus inner.'],
        ['$' + IS('\\left[' + sq(Rt) + ' - ' + sq(rt) + '\\right]', false) + '$', 'The $\\frac{1}{2}$ is missing: each sector has area $\\frac{1}{2}r^2\\,\\Delta\\theta$.']
      ], '1.D'),
      numStep('area', 'Find the area of $S$.', A, [
        [sq, 'That integrates $\\frac{1}{2}(R - r)^2$. Square each radius, then subtract.'],
        [2 * A, 'That leaves out the $\\frac{1}{2}$.'],
        [outerOnly, 'That is the area inside the outer curve between those angles. Subtract the inner curve\'s part.'],
        [-A, 'Outer minus inner: the area is positive.']
      ], { hint: 'Exact (like pi or 4pi/3 + 2sqrt(3)) or to three decimal places.' })
    ];
    var sol = ['They meet where $' + Rt + ' = ' + rt + '$: $\\theta = ' + a.tex + '$ and $\\theta = ' + b.tex + '$. Between them $r = ' + Rt + '$ is the outer curve.', 'Area $= ' + IS('\\left[' + sq(Rt) + ' - ' + sq(rt) + '\\right]') + '$.', 'Evaluating (a double-angle identity for the squared trig term): area $\\approx ' + f3(A) + '$.'];
    return { text: text, steps: steps, solution: sol,
      fig: { curves: [{ r: B.R, a: 0, b: 2 * PI, cls: 'out' }, { r: B.r, a: 0, b: 2 * PI, cls: 'in' }], region: { outer: B.R, inner: B.r, a: a.v, b: b.v }, label: 'Two polar curves with the region between them shaded' },
      values: { given: { R: B.R, r: B.r }, a: a.v, b: b.v, meet: B.meet.v, area: A } };
  };

  var TITLE = { coords: 'Polar points, rates and slopes', area: 'Area inside a polar curve', between: 'Area between two polar curves' };
  var KINDS = ['coords', 'area', 'between'];
  var TOPIC = { coords: 'polar-derivatives', area: 'polar-area', between: 'polar-area-between' };
  function generate(r, ctx, type){
    var kind = type || ctx.kind;
    if(!GEN[kind]) throw new Error('polar-lab: no problem kind "' + kind + '"');
    var p = GEN[kind](r);
    p.ctx = ctx.id; p.topic = ctx.topic; p.type = kind; p.title = TITLE[kind];
    p.solution = p.solution.map(H);
    return p;
  }

  M.register('polarLab', {
    CURVES: CURVES, PAIRS: PAIRS, ORDER: ORDER, PORDER: PORDER, KINDS: KINDS, TITLE: TITLE, TOPIC: TOPIC,
    compiled: compiled, limits: limits, point: point, at: at, area: area, motion: motion, describe: describe, trace: trace,
    generate: generate, fn: fn, tx: tx, piT: piT, n: n, f3: f3
  });
})(typeof window !== 'undefined' ? window : globalThis);
