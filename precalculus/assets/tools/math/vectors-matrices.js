/* Vectors and matrices model: ApPrecalcMath.vectorsMatrices (docs/apprecalc-architecture.md, "Tools").
   OWNED BY THIS TOOL ONLY (builder T4, docs/apprecalc-briefs/t4.md): no other tool edits this
   file, and this tool edits no shared file. Pure functions, no DOM, so the
   validator (scripts/lib/apprecalc-tool-checks/vectors-matrices.mjs) and the test
   (scripts/test/apprecalc-tool-vectors-matrices.test.mjs) run exactly this code.

   Unit 4, beyond the exam (docs/apprecalc-spec.md decision 7): never in an
   exam, a unit test's weights or a cram plan.

   Explore data:
     PATHS     parametric motion: x(t), y(t) on a t-interval, their TeX
     MATRICES  2 by 2 presets (rotate, reflect, stretch, shear, a general one,
               a singular one)
   Helpers: add, sub, scale, mag, dot, angle (of a vector, in [0, 2π)),
   det, inverse (null when det = 0), apply (A times a column), mul.

   generate(rng, ctx, type) -> { ctx, topic, type, title, text, steps,
   solution, fig, values } for the "Test yourself" drill. Kinds:
     param      a point of a parametric path, and its direction of motion
     prates     average rates of change of x and of y, and the slope Δy/Δx
     vectors    a combination k·u + v, its magnitude, the dot product u·v
     transform  the image of a point under A (columns, not rows), the area
                of the image of the unit square (|det A|)
     inverse    det A, whether A has an inverse, an entry of A⁻¹ */
(function(G){
  'use strict';
  var M = G.ApPrecalcMath;
  if(!M) return;
  var PI = Math.PI;
  function H(s){ return G.ApPrecalcTex ? G.ApPrecalcTex.html(s, { strict: true }) : s; }
  function escT(s){ return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function optHtml(t){
    if(String(t).indexOf('$') < 0 || !G.ApPrecalcTex) return '<span class="cd-opt-t">' + H(t) + '</span>';
    return '<span class="cd-opt-t"><span class="sr-only">' + escT(G.ApPrecalcTex.plain(t)) + '</span><span aria-hidden="true">' + H(t) + '</span></span>';
  }
  function n(x, d){
    if(Math.abs(x - Math.round(x)) < 1e-9) return String(Math.round(x));
    var s = M.fixed(x, d == null ? 3 : d).replace(/0+$/, '').replace(/\.$/, '');
    return s === '-0' ? '0' : s;
  }
  function gcd(a, b){ a = Math.abs(a); b = Math.abs(b); while(b){ var t = a % b; a = b; b = t; } return a || 1; }
  /* p/q in lowest terms as TeX (an integer as is). */
  function frac(p, q){ if(q < 0){ p = -p; q = -q; } var g = gcd(p, q); p /= g; q /= g; return q === 1 ? String(p) : (p < 0 ? '-' : '') + '\\frac{' + Math.abs(p) + '}{' + q + '}'; }
  /* √m simplified: 2√5, 5, √13 (TeX). */
  function rootTex(m){
    if(m === 0) return '0';
    var out = 1, inn = m;
    for(var k = Math.floor(Math.sqrt(m)); k > 1; k--) if(inn % (k * k) === 0){ out *= k; inn /= k * k; }
    return inn === 1 ? String(out) : (out === 1 ? '' : out) + '\\sqrt{' + inn + '}';
  }

  /* ------------------------------------------------------ vectors */
  function add(u, v){ return [u[0] + v[0], u[1] + v[1]]; }
  function sub(u, v){ return [u[0] - v[0], u[1] - v[1]]; }
  function scale(k, u){ return [k * u[0], k * u[1]]; }
  function mag(u){ return Math.hypot(u[0], u[1]); }
  function dot(u, v){ return u[0] * v[0] + u[1] * v[1]; }
  function angle(u){ var t = Math.atan2(u[1], u[0]); return t < 0 ? t + 2 * PI : t; }
  function vTex(u){ return '\\left\\langle ' + n(u[0]) + ', ' + n(u[1]) + ' \\right\\rangle'; }

  /* ------------------------------------------------------ matrices */
  /* A = [[a, b], [c, d]] (rows). */
  function det(A){ return A[0][0] * A[1][1] - A[0][1] * A[1][0]; }
  function inverse(A){
    var D = det(A);
    if(Math.abs(D) < 1e-12) return null;
    return [[A[1][1] / D, -A[0][1] / D], [-A[1][0] / D, A[0][0] / D]];
  }
  function apply(A, p){ return [A[0][0] * p[0] + A[0][1] * p[1], A[1][0] * p[0] + A[1][1] * p[1]]; }
  function mul(A, B){ return [[A[0][0] * B[0][0] + A[0][1] * B[1][0], A[0][0] * B[0][1] + A[0][1] * B[1][1]], [A[1][0] * B[0][0] + A[1][1] * B[1][0], A[1][0] * B[0][1] + A[1][1] * B[1][1]]]; }
  function mTex(A, f){ f = f || n; return '\\left[ \\begin{matrix} ' + f(A[0][0]) + ' & ' + f(A[0][1]) + ' \\\\ ' + f(A[1][0]) + ' & ' + f(A[1][1]) + ' \\end{matrix} \\right]'; }
  /* The matrix halfway: (1 − s)I + sA, the picture between the plane and its image. */
  function blend(A, s){ return [[1 - s + s * A[0][0], s * A[0][1]], [s * A[1][0], 1 - s + s * A[1][1]]]; }
  var MATRICES = {
    rotate: { name: 'Rotate 90°', A: [[0, -1], [1, 0]], what: 'turns the plane a quarter turn counterclockwise about the origin' },
    reflect: { name: 'Reflect', A: [[0, 1], [1, 0]], what: 'reflects the plane across the line y = x' },
    stretch: { name: 'Stretch', A: [[2, 0], [0, 1.5]], what: 'stretches horizontally by 2 and vertically by 1.5' },
    shear: { name: 'Shear', A: [[1, 1], [0, 1]], what: 'slides each point sideways by its height (a shear)' },
    general: { name: 'General', A: [[2, 1], [1, 2]], what: 'stretches the plane along the line y = x' },
    flat: { name: 'Squash', A: [[2, 1], [4, 2]], what: 'squashes the whole plane onto a line' }
  };
  var MORDER = ['rotate', 'reflect', 'stretch', 'shear', 'general', 'flat'];

  /* ------------------------------------------------------ parametric paths */
  var PATHS = {
    line: { name: 'Line', dom: [0, 4], x: function(t){ return -3 + 1.5 * t; }, y: function(t){ return 2 - t; }, tex: { x: '-3 + 1.5t', y: '2 - t' }, pi: false },
    toss: { name: 'Thrown ball', dom: [0, 3], x: function(t){ return -4 + 2.5 * t; }, y: function(t){ return -2 + 5 * t - 2 * t * t; }, tex: { x: '-4 + 2.5t', y: '-2 + 5t - 2t^2' }, pi: false },
    circle: { name: 'Circle', dom: [0, 2 * PI], x: function(t){ return 3 * Math.cos(t); }, y: function(t){ return 3 * Math.sin(t); }, tex: { x: '3\\cos t', y: '3\\sin t' }, pi: true },
    clock: { name: 'Clockwise', dom: [0, 2 * PI], x: function(t){ return 3 * Math.sin(t); }, y: function(t){ return 3 * Math.cos(t); }, tex: { x: '3\\sin t', y: '3\\cos t' }, pi: true },
    ellipse: { name: 'Ellipse', dom: [0, 2 * PI], x: function(t){ return 4 * Math.cos(t); }, y: function(t){ return 2 * Math.sin(t); }, tex: { x: '4\\cos t', y: '2\\sin t' }, pi: true }
  };
  var PORDER = ['line', 'toss', 'circle', 'clock', 'ellipse'];
  function avgRates(P, t1, t2){ var dt = t2 - t1, dx = P.x(t2) - P.x(t1), dy = P.y(t2) - P.y(t1); return { dx: dx, dy: dy, rx: dx / dt, ry: dy / dt, slope: Math.abs(dx) < 1e-12 ? NaN : dy / dx }; }
  /* Words for a direction from the signs of Δx and Δy. */
  function dirWords(dx, dy){
    var h = Math.abs(dx) < 1e-12 ? '' : dx > 0 ? 'right' : 'left', v = Math.abs(dy) < 1e-12 ? '' : dy > 0 ? 'up' : 'down';
    return h && v ? h + ' and ' + v : h || v || 'nowhere';
  }

  /* ============================================================ the drill */
  function choice(key, label, list, practice){
    return { key: key, kind: 'choice', label: H(label), options: list.map(function(o){ return optHtml(o[0]); }), why: list.map(function(o){ return H(o[1]); }), correct: 0, practice: practice || '3.A' };
  }
  function numStep(key, label, answer, mistakes, o){
    o = o || {};
    var whole = Math.abs(answer - Math.round(answer)) < 1e-9;
    return { key: key, kind: 'num', label: H(label), unit: o.unit || '', practice: o.practice || '1.B', d: whole ? 0 : 3,
      hint: whole ? '' : (o.hint || 'Exact (like sqrt(13) or 5/2) or correct to three decimal places.'),
      cell: M.cell(answer, 0, (mistakes || []).concat(GENERIC(answer, o.sign)).map(function(m){ return { value: m[0], why: H(m[1]) }; }), 1e-3) };
  }
  /* The slips the shared diagnosis would name in calculus words, in this
     tool's words (after the authored ones, so those win). */
  function GENERIC(a, sign){
    return [[-a, 'The size is right but the sign is wrong. ' + (sign || 'Check each sign, and the order of any subtraction.')],
      [2 * a, 'Off by a factor of 2. Check each product and each sum once more.'],
      [a / 2, 'Off by a factor of 2. Check each product and each sum once more.'],
      [a * PI, 'Off by a factor of $\\pi$: nothing here needs $\\pi$.'],
      [a / PI, 'Off by a factor of $\\pi$: nothing here needs $\\pi$.']];
  }
  function distinct(list, pool){
    var seen = [], spare = (pool || []).slice();
    return list.map(function(o){ while(seen.indexOf(o[0]) > -1 && spare.length) o = spare.shift(); seen.push(o[0]); return o; }).filter(function(o, i, all){ return all.findIndex(function(q){ return q[0] === o[0]; }) === i; });
  }
  function nz(r, lo, hi){ return r.nonzero(lo, hi); }
  function sgnTerm(k, s){ return k === 0 ? '' : (k < 0 ? ' - ' : ' + ') + (Math.abs(k) === 1 && s ? '' : Math.abs(k)) + s; }
  function poly(c0, c1, c2){ // c0 + c1 t + c2 t^2 as TeX
    var out = c0 ? String(c0) : '';
    [[c1, 't'], [c2, 't^2']].forEach(function(p){ if(!p[0]) return; var t = sgnTerm(p[0], p[1]); out = out ? out + t : (p[0] < 0 ? '-' : '') + t.replace(/^ [-+] /, ''); });
    return out || '0';
  }
  function pEval(c, t){ return c[0] + c[1] * t + c[2] * t * t; }

  var GEN = {};
  /* x linear, y quadratic in t; the interval stays on one side of the vertex. */
  function pathProblem(r){
    var cx = [r.int(-4, 3), nz(r, -3, 3), 0];
    var a2 = r.pick([1, -1, 2, -2]), vx = r.int(0, 3), cy = [r.int(-3, 3) + a2 * vx * vx, -2 * a2 * vx, a2];   // vertex at t = vx
    return { cx: cx, cy: cy, vx: vx };
  }
  GEN.param = function(r){
    var pp = pathProblem(r), cx = pp.cx, cy = pp.cy, t0 = r.int(0, 4);
    var x0 = pEval(cx, t0), y0 = pEval(cy, t0);
    // an interval of length 1 or 2 on one side of the vertex (t ≥ 0)
    var side = pp.vx === 0 ? 1 : r.pick([-1, 1]), len = r.int(1, 2), t1 = side > 0 ? pp.vx + r.int(0, 1) : Math.max(0, pp.vx - len - r.int(0, 1)), t2 = t1 + len;
    if(side < 0 && t2 > pp.vx){ t1 = pp.vx; t2 = pp.vx + len; }
    var dx = pEval(cx, t2) - pEval(cx, t1), dy = pEval(cy, t2) - pEval(cy, t1), D = dirWords(dx, dy);
    var text = H('<p>A particle moves in the plane with $x(t) = ' + poly(cx[0], cx[1], 0) + '$ and $y(t) = ' + poly(cy[0], cy[1], cy[2]) + '$ for $t \\ge 0$.</p>');
    var all = ['right and up', 'right and down', 'left and up', 'left and down'];
    var steps = [
      numStep('x', 'Find $x(' + t0 + ')$.', x0, [[pEval(cy, t0), 'That is $y(' + t0 + ')$. Put $t = ' + t0 + '$ into $x(t)$.'], [cx[0] + cx[1], 'That is $x(1)$. Use $t = ' + t0 + '$.']], { practice: '1.B' }),
      numStep('y', 'Find $y(' + t0 + ')$.', y0, [[x0, 'That is $x(' + t0 + ')$. Put $t = ' + t0 + '$ into $y(t)$.'], [cy[0] + cy[1] * t0 + cy[2] * t0, 'Square $t$ before multiplying: $t^2 = ' + t0 * t0 + '$.']], { practice: '1.B' }),
      choice('dir', 'As $t$ increases from $' + t1 + '$ to $' + t2 + '$, which way does the particle move?', distinct([
        [D[0].toUpperCase() + D.slice(1), 'Right: $x$ goes from $' + n(pEval(cx, t1)) + '$ to $' + n(pEval(cx, t2)) + '$ and $y$ from $' + n(pEval(cy, t1)) + '$ to $' + n(pEval(cy, t2)) + '$, so the particle moves ' + D + '.'],
      ].concat(all.filter(function(w){ return w !== D; }).map(function(w){
        return [w[0].toUpperCase() + w.slice(1), 'Compare the values at the ends: $x$ goes from $' + n(pEval(cx, t1)) + '$ to $' + n(pEval(cx, t2)) + '$ (' + (dx > 0 ? 'right' : 'left') + ') and $y$ from $' + n(pEval(cy, t1)) + '$ to $' + n(pEval(cy, t2)) + '$ (' + (dy > 0 ? 'up' : 'down') + ').'];
      }))), '2.A')
    ];
    var sol = ['$x(' + t0 + ') = ' + n(x0) + '$ and $y(' + t0 + ') = ' + n(y0) + '$: at $t = ' + t0 + '$ the particle is at $(' + n(x0) + ', ' + n(y0) + ')$.',
      'From $t = ' + t1 + '$ to $t = ' + t2 + '$: $x$ changes by $' + n(dx) + '$ and $y$ by $' + n(dy) + '$, so the particle moves ' + D + '. On this interval $y$ keeps one direction because the turn of $y$ is at $t = ' + pp.vx + '$.'];
    return { text: text, steps: steps, solution: sol, fig: { kind: 'path', cx: cx, cy: cy, dom: [0, Math.max(t2, t0, 3) + 0.5], t0: t0, t1: t1, t2: t2 }, values: { cx: cx, cy: cy, t0: t0, t1: t1, t2: t2, vx: pp.vx, dir: D } };
  };
  GEN.prates = function(r){
    var pp = pathProblem(r), cx = pp.cx, cy = pp.cy, t1 = r.int(0, 2), t2 = t1 + r.int(1, 3);
    var x1 = pEval(cx, t1), x2 = pEval(cx, t2), y1 = pEval(cy, t1), y2 = pEval(cy, t2), dt = t2 - t1, rx = (x2 - x1) / dt, ry = (y2 - y1) / dt;
    if(Math.abs(y2 - y1) < 1e-9){ t2 = t1 + dt + 1; return GEN.prates(r); }
    var I = '[' + t1 + ', ' + t2 + ']';
    var text = H('<p>A particle moves with $x(t) = ' + poly(cx[0], cx[1], 0) + '$ and $y(t) = ' + poly(cy[0], cy[1], cy[2]) + '$. Consider $t$ in $' + I + '$.</p>');
    var steps = [
      numStep('rx', 'Find the average rate of change of $x$ with respect to $t$ on $' + I + '$.', rx, [[x2 - x1, 'That is the change in $x$ alone. Divide by the change in $t$, ' + dt + '.'], [(x2 + x1) / dt, 'Subtract the values at the ends; do not add them.']], { practice: '1.B', sign: 'Subtract in the same order on top and bottom: $x(' + t2 + ') - x(' + t1 + ')$ over $' + t2 + ' - ' + t1 + '$.' }),
      numStep('ry', 'Find the average rate of change of $y$ with respect to $t$ on $' + I + '$.', ry, [[y2 - y1, 'That is the change in $y$ alone. Divide by the change in $t$, ' + dt + '.'], [(y2 + y1) / dt, 'Subtract the values at the ends; do not add them.']], { practice: '1.B', sign: 'Subtract in the same order on top and bottom: $y(' + t2 + ') - y(' + t1 + ')$ over $' + t2 + ' - ' + t1 + '$.' }),
      numStep('m', 'Find the slope of the line segment from the point at $t = ' + t1 + '$ to the point at $t = ' + t2 + '$.', (y2 - y1) / (x2 - x1), [
        [(x2 - x1) / (y2 - y1), 'That is $\\frac{\\Delta x}{\\Delta y}$, upside down. Slope is rise over run: $\\frac{\\Delta y}{\\Delta x}$, the rate of $y$ over the rate of $x$.'],
        [ry, 'That is the rate of $y$ per unit of $t$. The slope compares $y$ with $x$: divide by the rate of $x$.']
      ], { practice: '2.B', sign: 'Slope $= \\frac{\\Delta y}{\\Delta x}$ with both changes taken from $t = ' + t1 + '$ to $t = ' + t2 + '$.' })
    ];
    var sol = ['$x(' + t1 + ') = ' + n(x1) + '$, $x(' + t2 + ') = ' + n(x2) + '$, so $\\frac{\\Delta x}{\\Delta t} = \\frac{' + n(x2) + ' - ' + (x1 < 0 ? '(' + n(x1) + ')' : n(x1)) + '}{' + dt + '} = ' + frac(x2 - x1, dt) + '$.',
      '$y(' + t1 + ') = ' + n(y1) + '$, $y(' + t2 + ') = ' + n(y2) + '$, so $\\frac{\\Delta y}{\\Delta t} = \\frac{' + n(y2) + ' - ' + (y1 < 0 ? '(' + n(y1) + ')' : n(y1)) + '}{' + dt + '} = ' + frac(y2 - y1, dt) + '$.',
      'Slope of the segment $= \\frac{\\Delta y}{\\Delta x} = \\frac{' + n(y2 - y1) + '}{' + n(x2 - x1) + '} = ' + frac(y2 - y1, x2 - x1) + '$, the ratio of the two average rates.'];
    return { text: text, steps: steps, solution: sol, fig: { kind: 'prates', cx: cx, cy: cy, dom: [Math.max(0, t1 - 1), t2 + 1], t1: t1, t2: t2 }, values: { cx: cx, cy: cy, t1: t1, t2: t2 } };
  };
  GEN.vectors = function(r){
    var u = [nz(r, -4, 4), r.int(-4, 4)], v = [r.int(-4, 4), nz(r, -4, 4)], k = r.pick([2, 3, -1, -2]);
    var w = add(scale(k, u), v);
    if(!w[0] && !w[1]) w = add(scale(k, u), v = [v[0] + 1, v[1]]);
    var m2 = w[0] * w[0] + w[1] * w[1], d = dot(u, v);
    var kT = k === -1 ? '-' : String(k);
    var text = H('<p>Let $\\mathbf{u} = ' + vTex(u) + '$ and $\\mathbf{v} = ' + vTex(v) + '$, and let $\\mathbf{w} = ' + kT + '\\mathbf{u} + \\mathbf{v}$.</p>');
    var steps = [
      numStep('wx', 'Find the $x$-component of $\\mathbf{w}$.', w[0], [[k * u[0] + k * v[0], 'Only $\\mathbf{u}$ is multiplied by ' + k + ': $' + kT + '(' + u[0] + ') + (' + v[0] + ')$.'], [u[0] + v[0], 'Multiply $\\mathbf{u}$ by ' + k + ' first.'], [k * u[1] + v[1], 'That is the $y$-component. Use the first entries.']], { practice: '1.B' }),
      numStep('wy', 'Find the $y$-component of $\\mathbf{w}$.', w[1], [[k * u[1] + k * v[1], 'Only $\\mathbf{u}$ is multiplied by ' + k + '.'], [u[1] + v[1], 'Multiply $\\mathbf{u}$ by ' + k + ' first.'], [w[0], 'That is the $x$-component. Use the second entries.']], { practice: '1.B' }),
      numStep('mag', 'Find $\\left\\| \\mathbf{w} \\right\\|$, the magnitude of $\\mathbf{w}$.', Math.sqrt(m2), [[m2, 'That is $\\left\\| \\mathbf{w} \\right\\|^2$. Take the square root.'], [Math.abs(w[0]) + Math.abs(w[1]), 'Components do not add as lengths. Use $\\sqrt{x^2 + y^2}$.'], [Math.sqrt(Math.abs(w[0] * w[0] - w[1] * w[1])), 'Add the squares, never subtract: $\\sqrt{x^2 + y^2}$.']], { practice: '1.B', hint: 'Exact (like sqrt(13)) or correct to three decimal places.' }),
      numStep('dot', 'Find the dot product $\\mathbf{u} \\cdot \\mathbf{v}$.', d, [[u[0] * v[1] + u[1] * v[0], 'That pairs the first entry of one with the second of the other. Multiply matching entries: $u_1 v_1 + u_2 v_2$.'], [u[0] * v[0] - u[1] * v[1], 'Add the two products: $u_1 v_1 + u_2 v_2$.'], [u[0] * v[1] - u[1] * v[0], 'That is the determinant of the two vectors. The dot product is $u_1 v_1 + u_2 v_2$.']], { practice: '1.B' })
    ];
    var sol = ['$\\mathbf{w} = ' + kT + vTex(u) + ' + ' + vTex(v) + ' = ' + vTex(scale(k, u)) + ' + ' + vTex(v) + ' = ' + vTex(w) + '$.',
      '$\\left\\| \\mathbf{w} \\right\\| = \\sqrt{' + (w[0] < 0 ? '(' + w[0] + ')' : w[0]) + '^2 + ' + (w[1] < 0 ? '(' + w[1] + ')' : w[1]) + '^2} = \\sqrt{' + m2 + '} = ' + rootTex(m2) + (Number.isInteger(Math.sqrt(m2)) ? '' : ' \\approx ' + n(Math.sqrt(m2))) + '$.',
      '$\\mathbf{u} \\cdot \\mathbf{v} = (' + u[0] + ')(' + v[0] + ') + (' + u[1] + ')(' + v[1] + ') = ' + d + '$' + (d === 0 ? ': zero, so $\\mathbf{u}$ and $\\mathbf{v}$ are perpendicular.' : d > 0 ? ': positive, so the angle between them is less than $\\frac{\\pi}{2}$.' : ': negative, so the angle between them is more than $\\frac{\\pi}{2}$.')];
    return { text: text, steps: steps, solution: sol, fig: { kind: 'vectors', u: u, v: v, k: k, w: w }, values: { u: u, v: v, k: k, w: w } };
  };
  function randA(r, singular){
    if(singular){ var a = nz(r, -3, 3), b = r.int(-3, 3), m = r.pick([2, -1, -2, 3]); return [[a, b], [m * a, m * b]]; }
    var A;
    do { A = [[r.int(-3, 4), r.int(-3, 3)], [r.int(-3, 3), r.int(-3, 4)]]; } while(!det(A) || A[0][1] === A[1][0]);
    return A;
  }
  GEN.transform = function(r){
    var A = randA(r, false), p = [nz(r, -3, 3), nz(r, -3, 3)], q = apply(A, p), At = [[A[0][0], A[1][0]], [A[0][1], A[1][1]]], qt = apply(At, p), D = det(A);
    var text = H('<p>The matrix $A = ' + mTex(A) + '$ maps each point $(x, y)$ to $A\\left[ \\begin{matrix} x \\\\ y \\end{matrix} \\right]$.</p>');
    var steps = [
      numStep('qx', 'The point $(' + p[0] + ', ' + p[1] + ')$ maps to $(x\', y\')$. Find $x\'$.', q[0], [[qt[0], 'That uses the first column, not the first row. $x\'$ is the first row times the point: $(' + A[0][0] + ')(' + p[0] + ') + (' + A[0][1] + ')(' + p[1] + ')$.'], [A[0][0] * p[0], 'Both entries of the row count: add $(' + A[0][1] + ')(' + p[1] + ')$.']], { practice: '1.B' }),
      numStep('qy', 'Find $y\'$.', q[1], [[qt[1], 'That uses the second column, not the second row: $(' + A[1][0] + ')(' + p[0] + ') + (' + A[1][1] + ')(' + p[1] + ')$.'], [q[0], 'That is $x\'$. Use the second row.']], { practice: '1.B' }),
      numStep('area', 'The unit square (corners $(0, 0)$, $(1, 0)$, $(1, 1)$, $(0, 1)$) maps to a parallelogram. Find its area.', Math.abs(D), [
        [A[0][0] * A[1][1] + A[0][1] * A[1][0], 'The determinant subtracts: $ad - bc$, not $ad + bc$.'],
        [A[0][0] * A[1][1], 'Subtract $bc$ too: the area is $|ad - bc|$.'],
        [Math.abs(A[0][0] + A[1][1]), 'That adds the diagonal. The area factor is $|\\det A| = |ad - bc|$.']
      ], { practice: '3.A', sign: 'An area is never negative: it is $|\\det A|$. A negative determinant means the image is flipped over.' })
    ];
    var sol = ['$A\\left[ \\begin{matrix} ' + p[0] + ' \\\\ ' + p[1] + ' \\end{matrix} \\right] = \\left[ \\begin{matrix} (' + A[0][0] + ')(' + p[0] + ') + (' + A[0][1] + ')(' + p[1] + ') \\\\ (' + A[1][0] + ')(' + p[0] + ') + (' + A[1][1] + ')(' + p[1] + ') \\end{matrix} \\right] = \\left[ \\begin{matrix} ' + q[0] + ' \\\\ ' + q[1] + ' \\end{matrix} \\right]$.',
      'The columns of $A$ are where $(1, 0)$ and $(0, 1)$ go: $(' + A[0][0] + ', ' + A[1][0] + ')$ and $(' + A[0][1] + ', ' + A[1][1] + ')$. They are the sides of the parallelogram.',
      '$\\det A = (' + A[0][0] + ')(' + A[1][1] + ') - (' + A[0][1] + ')(' + A[1][0] + ') = ' + D + '$, so every area is multiplied by $|' + D + '| = ' + Math.abs(D) + '$' + (D < 0 ? ', and the negative sign means the image is flipped over.' : '.')];
    return { text: text, steps: steps, solution: sol, fig: { kind: 'transform', A: A, p: p, q: q }, values: { A: A, p: p, q: q, det: D } };
  };
  GEN.inverse = function(r){
    var sing = r() < 0.25, A = randA(r, sing), D = det(A);
    var text = H('<p>Let $A = ' + mTex(A) + '$.</p>');
    var steps = [
      numStep('det', 'Find $\\det A$.', D, [[A[0][0] * A[1][1] + A[0][1] * A[1][0], 'The determinant subtracts: $ad - bc$.'], [A[0][1] * A[1][0] - A[0][0] * A[1][1], 'The order is $ad - bc$: the main diagonal first.'], [A[0][0] * A[1][0] - A[0][1] * A[1][1], 'Multiply along the diagonals: $ad - bc$ with $a, b$ the first row.']].filter(function(m){ return m[0] !== D; }), { practice: '1.B', sign: 'The order is $ad - bc$: the main diagonal first.' })
    ];
    var sol = ['$\\det A = (' + A[0][0] + ')(' + A[1][1] + ') - (' + A[0][1] + ')(' + A[1][0] + ') = ' + D + '$.'];
    if(D === 0){
      steps.push(choice('inv', 'Does $A$ have an inverse?', [
        ['No: $\\det A = 0$', 'Right: the second row is a multiple of the first, so $A$ squashes the plane onto a line, and no matrix can spread it out again.'],
        ['Yes: every square matrix has an inverse', 'Only a matrix with $\\det A \\ne 0$ has one. Here $\\det A = 0$.'],
        ['Yes: none of its entries is 0', 'Entries of 0 do not decide it; the determinant does. Here $\\det A = 0$.']
      ], '3.C'));
      steps.push(choice('img', 'What is the image of the unit square under $A$?', [
        ['A line segment (area 0)', 'Right: $|\\det A| = 0$ is the area factor, so the square flattens to a segment.'],
        ['A parallelogram with area ' + (Math.abs(A[0][0]) + Math.abs(A[1][1])), 'The area factor is $|\\det A| = 0$: nothing with area is left.'],
        ['The unit square again', 'Only the identity matrix leaves the square in place.']
      ], '3.A'));
      sol.push('$\\det A = 0$, so $A$ has no inverse.', 'Areas are multiplied by $|\\det A| = 0$: the unit square flattens to a segment.');
    } else {
      var Ai = inverse(A);
      steps.push(choice('inv', 'Does $A$ have an inverse?', [
        ['Yes: $\\det A \\ne 0$', 'Right: a $2 \\times 2$ matrix has an inverse exactly when its determinant is not 0.'],
        ['No: one of its entries is negative or 0', 'Entries do not decide it; the determinant does. Here $\\det A = ' + D + ' \\ne 0$.'],
        ['No: $\\det A$ is not 1', 'Any nonzero determinant will do; the inverse divides by it.']
      ], '3.C'));
      steps.push(numStep('i11', 'Find the top-left entry of $A^{-1}$.', Ai[0][0], [
        [A[1][1], 'Divide by the determinant: $A^{-1} = \\frac{1}{\\det A}\\left[ \\begin{matrix} d & -b \\\\ -c & a \\end{matrix} \\right]$.'],
        [A[0][0] / D, 'The diagonal entries swap places: the top-left of $A^{-1}$ is $\\frac{d}{\\det A}$, with $d = ' + A[1][1] + '$.'],
        [1 / A[0][0], 'An inverse matrix is not made of reciprocals of the entries. Use $\\frac{1}{\\det A}\\left[ \\begin{matrix} d & -b \\\\ -c & a \\end{matrix} \\right]$.']
      ].filter(function(m){ return isFinite(m[0]); }), { practice: '1.B', hint: 'Exact (like -3/5) or correct to three decimal places.', sign: 'The diagonal entries swap but keep their signs; only $b$ and $c$ change sign.' }));
      sol.push('$\\det A = ' + D + ' \\ne 0$, so $A$ has an inverse.', '$A^{-1} = \\frac{1}{' + D + '}' + mTex([[A[1][1], -A[0][1]], [-A[1][0], A[0][0]]]) + ' = ' + mTex([[A[1][1], -A[0][1]], [-A[1][0], A[0][0]]].map(function(row){ return row.map(function(x){ return [x, D]; }); }), function(e){ return frac(e[0], e[1]); }) + '$: the top-left entry is $' + frac(A[1][1], D) + '$. Check: $AA^{-1}$ is the identity matrix.');
    }
    return { text: text, steps: steps, solution: sol, fig: { kind: 'inverse', A: A }, values: { A: A, det: D } };
  };

  var TITLE = { param: 'Parametric motion', prates: 'Average rates in parametric motion', vectors: 'Vector combinations', transform: 'Matrices as transformations', inverse: 'Determinant and inverse' };
  function generate(r, ctx, type){
    var kind = type || ctx.kind;
    if(!GEN[kind]) throw new Error('vectors-matrices: no problem kind "' + kind + '"');
    var p = GEN[kind](r);
    p.ctx = ctx.id; p.topic = ctx.topic; p.type = kind; p.title = TITLE[kind];
    p.solution = p.solution.map(H);
    return p;
  }

  M.register('vectorsMatrices', {
    PATHS: PATHS, PORDER: PORDER, MATRICES: MATRICES, MORDER: MORDER, KINDS: Object.keys(GEN), TITLE: TITLE,
    add: add, sub: sub, scale: scale, mag: mag, dot: dot, angle: angle, vTex: vTex,
    det: det, inverse: inverse, apply: apply, mul: mul, blend: blend, mTex: mTex,
    avgRates: avgRates, dirWords: dirWords, pEval: pEval, poly: poly, frac: frac, rootTex: rootTex, n: n,
    generate: generate
  });
})(typeof window !== 'undefined' ? window : globalThis);
