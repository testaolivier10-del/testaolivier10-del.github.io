/* Euler and logistic: the model, ApCalcMath.eulerLogistic (docs/apcalcbc-architecture.md,
   "Trainers"; docs/apcalcbc-spec.md section 6). OWNED BY THIS TOOL ONLY (builder T3):
   no other tool edits this file, and this tool edits no shared file. Pure
   functions, no DOM, so the validator (scripts/lib/apcalcbc-tool-checks/
   euler-logistic.mjs) and the test (scripts/test/apcalcbc-tool-euler-logistic.test.mjs)
   run exactly this code.

   BC only (CED 7.5 and 7.9): Euler's method as a step procedure (EK FUN-7.C.4),
   over or under from concavity, and the logistic model interpreted without
   solving it (EK FUN-7.H.1-4: carrying capacity, the limit, fastest growth at
   half the carrying capacity). The explicit logistic solution is used only to
   draw the curve; no step asks for it.

   Explore
     GALLERY                  the explorer's equations: { id, tex, f(x, y), f2(x, y)
                              (d²y/dx² along a solution), exact(x0, y0) -> { fn, lo, hi },
                              view, start, snap }
     de(id)                   one gallery entry
     euler(f, x0, y0, h, n)   the Euler table: [{ x, y, m, dy }] (n + 1 rows; the last
                              row has m and dy of the next step, not used)
     rk4(f, x0, y0, x1, N)    y(x1) by classical Runge-Kutta, N steps (tests, the
                              true value under the Euler estimate)
     logistic(k, L, P0)       { P(t), rate(P), L, half, maxRate, tHalf } for
                              dP/dt = kP(1 - P/L)
   Test yourself
     generate(rng, ctx, type) -> { ctx, topic, type, text, steps, solution, fig }
       types: euler (dy/dx in x and y, two or three steps), model (Euler in a
       context: cooling, a drug, a tank), overunder (one step, then concavity),
       logistic (read L, the limit, fastest growth, the largest rate, the shape) */
(function(G){
  'use strict';
  var M = G.ApCalcMath;
  if(!M) return;
  function H(s){ var t = G.ApCalcTex; return t ? t.html(s) : s; }
  function cl(v){ return Math.abs(v) < 1e-12 ? 0 : +(+v).toPrecision(12); }
  /* Decimals a value needs (at most 6): 2.3125 -> 4. */
  function dec(v){ v = cl(v); for(var d = 0; d <= 6; d++) if(Math.abs(+v.toFixed(d) - v) < 1e-9) return d; return 6; }
  /* Decimals a coefficient needs to be written exactly, or 99 if it cannot
     be (0.5/1200 = 0.000416...): such a coefficient is never printed. */
  function exactDec(v){ v = +v; for(var d = 0; d <= 8; d++) if(Math.abs(+v.toFixed(d) - v) < 1e-12 * Math.max(1, Math.abs(v))) return d; return 99; }
  function dn(v, d){ v = cl(v); return String(+v.toFixed(d == null ? Math.min(dec(v), 6) : d)); }
  function tn(v){ var s = dn(v); return s; }
  function pn(v){ return v < 0 ? '(' + tn(v) + ')' : tn(v); }
  function coef(c, v, first){
    if(c === 0) return '';
    var a = Math.abs(c), s = (a === 1 && v ? '' : tn(a)) + v;
    if(first) return (c < 0 ? '-' : '') + s;
    return (c < 0 ? ' - ' : ' + ') + s;
  }
  /* The substitution c1·v1 + c2·v2 + c as TeX: 2(1) - (3) + 2. */
  function subs(terms, c){
    var out = terms.map(function(t){ return (t[0] === 1 ? '' : t[0] === -1 ? '-' : tn(t[0])) + '(' + tn(t[1]) + ')'; }).join(' + ') + (c ? ' + ' + tn(c) : '');
    return out.replace(/\+ -/g, '- ');
  }
  function poly(terms){ var out = ''; terms.forEach(function(t){ if(t[0] === 0) return; out += coef(t[0], t[1], !out); }); return out || '0'; }

  /* ------------------------------------------------------------- explore */
  var GALLERY = [
    { id: 'x+y', tex: 'x + y', f: function(x, y){ return x + y; }, f2: function(x, y){ return 1 + x + y; }, f2tex: '1 + \\frac{dy}{dx} = 1 + x + y',
      exact: function(x0, y0){ var C = (y0 + x0 + 1) * Math.exp(-x0); return { fn: function(x){ return C * Math.exp(x) - x - 1; }, lo: -Infinity, hi: Infinity }; },
      view: { x: [-1, 3], y: [-2, 8] }, start: [0, 1], snap: [0.5, 0.5] },
    { id: 'y', tex: 'y', f: function(x, y){ return y; }, f2: function(x, y){ return y; }, f2tex: '\\frac{dy}{dx} = y',
      exact: function(x0, y0){ return { fn: function(x){ return y0 * Math.exp(x - x0); }, lo: -Infinity, hi: Infinity }; },
      view: { x: [-1, 3], y: [-2, 10] }, start: [0, 1], snap: [0.5, 0.5] },
    { id: 'x-y', tex: 'x - y', f: function(x, y){ return x - y; }, f2: function(x, y){ return 1 - x + y; }, f2tex: '1 - \\frac{dy}{dx} = 1 - x + y',
      exact: function(x0, y0){ var C = (y0 - x0 + 1) * Math.exp(x0); return { fn: function(x){ return x - 1 + C * Math.exp(-x); }, lo: -Infinity, hi: Infinity }; },
      view: { x: [-1, 4], y: [-2, 4] }, start: [0, 2], snap: [0.5, 0.5] },
    { id: 'xy', tex: 'xy', f: function(x, y){ return x * y; }, f2: function(x, y){ return y + x * x * y; }, f2tex: 'y + x\\frac{dy}{dx} = y(1 + x^2)',
      exact: function(x0, y0){ return { fn: function(x){ return y0 * Math.exp((x * x - x0 * x0) / 2); }, lo: -Infinity, hi: Infinity }; },
      view: { x: [-1, 2.5], y: [-1, 7] }, start: [0, 1], snap: [0.5, 0.5] },
    { id: '-x/y', tex: '-\\frac{x}{y}', f: function(x, y){ return -x / y; }, f2: function(x, y){ return -(x * x + y * y) / (y * y * y); }, f2tex: '-\\frac{x^2 + y^2}{y^3}',
      exact: function(x0, y0){ var R = Math.sqrt(x0 * x0 + y0 * y0), s = y0 < 0 ? -1 : 1; return { fn: function(x){ var q = R * R - x * x; return q < 0 ? NaN : s * Math.sqrt(q); }, lo: -R, hi: R }; },
      view: { x: [-1, 3.5], y: [-1, 3.5] }, start: [0, 2], snap: [0.5, 0.5], note: 'The solutions are circles about the origin. Each Euler segment leaves along the tangent line, which lies outside the circle, so the polygon spirals outward.' }
  ];
  function de(id){ return GALLERY.filter(function(d){ return d.id === id; })[0] || GALLERY[0]; }
  function euler(f, x0, y0, h, n){
    var rows = [], x = x0, y = y0;
    for(var i = 0; i <= n; i++){
      var m = f(x, y);
      rows.push({ x: cl(x), y: cl(y), m: cl(m), dy: cl(m * h) });
      if(i === n) break;
      y = cl(y + m * h); x = cl(x0 + (i + 1) * h);
    }
    return rows;
  }
  function rk4(f, x0, y0, x1, N){
    N = N || 2000; var h = (x1 - x0) / N, x = x0, y = y0;
    for(var i = 0; i < N; i++){
      var k1 = f(x, y), k2 = f(x + h / 2, y + h / 2 * k1), k3 = f(x + h / 2, y + h / 2 * k2), k4 = f(x + h, y + h * k3);
      y += h / 6 * (k1 + 2 * k2 + 2 * k3 + k4); x = x0 + (i + 1) * h;
      if(!isFinite(y)) return NaN;
    }
    return y;
  }
  /* dP/dt = kP(1 - P/L), P(0) = P0 > 0. */
  function logistic(k, L, P0){
    var A = (L - P0) / P0;
    return { k: k, L: L, P0: P0, half: L / 2, maxRate: k * L / 4,
      P: function(t){ return L / (1 + A * Math.exp(-k * t)); },
      rate: function(P){ return k * P * (1 - P / L); },
      tHalf: P0 < L / 2 ? Math.log(A) / k : null };
  }

  /* ------------------------------------------------------- step helpers */
  function stepNum(key, label, cell, o){ o = o || {}; return { key: key, kind: 'num', label: label, cell: cell, d: o.d, hint: o.hint, practice: o.practice || '1.E', level: o.level || 'apply' }; }
  function stepChoice(key, label, options, correct, why, o){ o = o || {}; return { key: key, kind: 'choice', label: label, options: options, correct: correct, why: why, fixed: !!o.fixed, hint: o.hint, practice: o.practice || '3.D', level: o.level || 'analyze' }; }
  /* An exact answer: typed as a decimal or a fraction; a slip within the
     tolerance of the key is dropped by M.cell. */
  function exact(v, ms){ return M.cell(v, 1e-9, ms || [], dec(v) > 3 ? 0.0006 : 1e-6); }
  function shuffleIdx(r, n){ var idx = []; for(var i = 0; i < n; i++) idx.push(i); for(var j = n - 1; j > 0; j--){ var k = r.int(0, j), t = idx[j]; idx[j] = idx[k]; idx[k] = t; } return { idx: idx, correct: idx.indexOf(0) }; }

  /* ------------------------------------------------------ euler (x, y) */
  /* Families of dy/dx with small integer coefficients: { s (ApCalcExpr),
     tex, f, at(x, y) -> TeX of the substitution }. */
  function famEuler(r){
    var k = r.int(0, 3);
    if(k === 0){
      var a = r.pick([1, 2, -1, 3]), b = r.pick([1, -1, 2, -2]), c = r.pick([0, 1, -1, 2]);
      return { s: a + '*x + ' + b + '*y + ' + c, tex: poly([[a, 'x'], [b, 'y'], [c, '']]), f: function(x, y){ return a * x + b * y + c; },
        at: function(x, y){ return subs([[a, x], [b, y]], c); } };
    }
    if(k === 1){
      var a1 = r.pick([1, 2, -1]), c1 = r.pick([1, -1, 2, 0]);
      return { s: a1 + '*x*y + ' + c1, tex: poly([[a1, 'xy'], [c1, '']]), f: function(x, y){ return a1 * x * y + c1; },
        at: function(x, y){ return (a1 === 1 ? '' : a1 === -1 ? '-' : tn(a1) + ' \\cdot ') + pn(x) + ' \\cdot ' + pn(y) + (c1 ? (c1 < 0 ? ' - ' : ' + ') + tn(Math.abs(c1)) : ''); } };
    }
    if(k === 2){
      var b2 = r.pick([1, -1, 2]);
      return { s: 'x^2 + ' + b2 + '*y', tex: 'x^2' + coef(b2, 'y', false), f: function(x, y){ return x * x + b2 * y; },
        at: function(x, y){ return pn(x) + '^2' + (b2 < 0 ? ' - ' : ' + ') + (Math.abs(b2) === 1 ? '' : tn(Math.abs(b2)) + ' \\cdot ') + pn(y); } };
    }
    var a3 = r.pick([1, 2, 3]), b3 = r.pick([1, 2]);
    return { s: a3 + ' - ' + b3 + '*x*y', tex: tn(a3) + ' - ' + (b3 === 1 ? '' : tn(b3)) + 'xy', f: function(x, y){ return a3 - b3 * x * y; },
      at: function(x, y){ return tn(a3) + ' - ' + (b3 === 1 ? '' : tn(b3) + ' \\cdot ') + pn(x) + ' \\cdot ' + pn(y); } };
  }
  /* The Euler steps of a problem, with the slips the Chief Reader reports
     name (framework.md section 7, item 14): the step size dropped, the slope
     at the old point reused, y added at the old x, the y forgotten, one step
     too many. */
  function eulerSteps(F, x0, y0, h, n, o){
    var rows = euler(F.f, x0, y0, h, n), steps = [], X = o.x || 'x', Y = o.y || 'y', u = o.unit ? ' ' + o.unit : '';
    for(var i = 0; i < n; i++){
      var R = rows[i], N1 = rows[i + 1], P = '(' + tn(R.x) + ', ' + tn(R.y) + ')';
      var mMis = [];
      if(i > 0){
        var prev = rows[i - 1];
        mMis.push({ value: F.f(R.x, prev.y), why: 'That uses the old ' + Y + ' (' + tn(prev.y) + '). Each step uses the point you just found: (' + tn(R.x) + ', ' + tn(R.y) + ').' });
        mMis.push({ value: F.f(prev.x, R.y), why: 'That uses the old ' + X + ' (' + tn(prev.x) + '). Move ' + X + ' forward by the step size too: ' + X + ' = ' + tn(R.x) + '.' });
        mMis.push({ value: prev.m, why: 'That is the slope from the step before. Euler recomputes the slope at every new point.' });
      }
      mMis.push({ value: F.f(R.y, R.x), why: 'You swapped the coordinates: at ' + P + ', ' + X + ' = ' + tn(R.x) + ' and ' + Y + ' = ' + tn(R.y) + '.' });
      steps.push(stepNum('m' + i, H('$\\frac{d' + Y + '}{d' + X + '}$ at $' + P + '$'), exact(R.m, mMis),
        { d: dec(R.m), hint: i === 0 ? H('Put $' + X + ' = ' + tn(R.x) + '$ and $' + Y + ' = ' + tn(R.y) + '$ into the differential equation.') : null, practice: '1.E', level: 'apply' }));
      var yMis = [
        { value: R.y + R.m, why: 'You added the slope itself. Multiply it by the step size first: Δ' + Y + ' = (d' + Y + '/d' + X + ')·Δ' + X + ' = ' + tn(R.m) + ' · ' + tn(h) + '.' },
        { value: R.m * h, why: 'That is only the change Δ' + Y + '. Add it to the current ' + Y + ' (' + tn(R.y) + ').' },
        { value: R.y - R.m * h, why: 'Sign: the new value is ' + Y + ' + (d' + Y + '/d' + X + ')·Δ' + X + '. Moving right along a segment of slope ' + tn(R.m) + ' changes ' + Y + ' by ' + tn(R.m * h) + '.' },
        { value: R.y + R.m * N1.x, why: 'You multiplied by the new ' + X + ' (' + tn(N1.x) + '), not by the step size Δ' + X + ' = ' + tn(h) + '.' }
      ];
      if(i > 0) yMis.push({ value: R.y + rows[i - 1].m * h, why: 'That reuses the first slope. Use the slope at the point you just reached, ' + tn(R.m) + '.' });
      if(i > 0) yMis.push({ value: rows[0].y + rows[0].m * (N1.x - x0), why: 'That is one long step along the first segment. Euler takes ' + (i + 1) + ' steps of size ' + tn(h) + ', with a new slope at each point.' });
      var last = i === n - 1;
      if(last){
        var extra = euler(F.f, x0, y0, h, n + 1)[n + 1];
        yMis.push({ value: extra.y, why: 'That is one step too many: ' + n + ' steps of ' + tn(h) + ' take ' + X + ' from ' + tn(x0) + ' to ' + tn(N1.x) + '. Stop there.' });
      }
      var lab = last ? (o.ask ? o.ask(N1.x) : H('The Euler approximation of $' + (o.fn || 'f') + '(' + tn(N1.x) + ')$')) : H('$' + Y + '$ at $' + X + ' = ' + tn(N1.x) + '$ (step ' + (i + 1) + ')');
      steps.push(stepNum('y' + (i + 1), lab, exact(N1.y, yMis), { d: dec(N1.y), hint: i === 0 ? H('New $' + Y + '$ = old $' + Y + '$ + $\\frac{d' + Y + '}{d' + X + '} \\cdot \\Delta ' + X + '$, with $\\Delta ' + X + ' = ' + tn(h) + '$.') : null, practice: '1.E', level: 'apply' }));
    }
    return { rows: rows, steps: steps };
  }
  function eulerSolution(F, rows, h, n, o){
    var X = o.x || 'x', Y = o.y || 'y', out = [H('Start at $(' + tn(rows[0].x) + ', ' + tn(rows[0].y) + ')$ with $\\Delta ' + X + ' = ' + tn(h) + '$ and take ' + n + ' steps. Each step: new $' + Y + '$ = old $' + Y + ' + \\frac{d' + Y + '}{d' + X + '}\\,\\Delta ' + X + '$.')];
    for(var i = 0; i < n; i++){
      var R = rows[i], N1 = rows[i + 1];
      out.push(H('At $(' + tn(R.x) + ', ' + tn(R.y) + ')$: $\\frac{d' + Y + '}{d' + X + '} = ' + F.at(R.x, R.y) + ' = ' + tn(R.m) + '$, so $' + Y + '(' + tn(N1.x) + ') \\approx ' + tn(R.y) + (R.m < 0 ? ' + (' + tn(R.m) + ')' : ' + ' + tn(R.m)) + '(' + tn(h) + ') = ' + tn(N1.y) + '$.'));
    }
    return out;
  }
  function genEuler(r, ctx){
    for(var g = 0; g < 300; g++){
      var F = famEuler(r), x0 = r.pick([0, 1, -1, 2]), y0 = r.int(-2, 4), h = r.pick([0.5, 0.5, 1, 0.25, 0.2]);
      var n = h === 1 ? 2 : r.pick([2, 2, 3]);
      if(h < 0.5 && n === 3) n = 2;
      var rows = euler(F.f, x0, y0, h, n + 1);
      if(rows.some(function(q){ return !isFinite(q.y) || Math.abs(q.y) > 60 || dec(q.y) > 4 || dec(q.m) > 4; })) continue;
      if(rows[0].m === 0 || rows[1].m === rows[0].m) continue;
      var E = eulerSteps(F, x0, y0, h, n, {});
      if(!distinct(E.steps)) continue;
      var xn = cl(x0 + n * h);
      return { ctx: ctx.id, topic: ctx.topic, type: 'euler', de: F.s,
        text: H('<p>Let $y = f(x)$ be the solution of $\\frac{dy}{dx} = ' + F.tex + '$ with $f(' + tn(x0) + ') = ' + tn(y0) + '$. Use Euler\'s method, starting at $x = ' + tn(x0) + '$ with ' + n + ' steps of equal size $\\Delta x = ' + tn(h) + '$, to approximate $f(' + tn(xn) + ')$.</p>'),
        steps: E.steps, solution: eulerSolution(F, E.rows, h, n, {}),
        fig: { kind: 'euler', de: F.s, x0: x0, y0: y0, h: h, n: n, rows: E.rows, x: 'x', y: 'y' } };
    }
    throw new Error('genEuler: no problem found');
  }
  function distinct(steps){
    return steps.every(function(s){ return s.key.charAt(0) !== 'y' || s.cell.mistakes.length >= 3; });
  }

  /* ------------------------------------------------ model (in a context) */
  var MODELS = [
    { id: 'cool', who: 'A cup of tea', v: 'H', t: 't', unit: 'minutes', q: 'its temperature in degrees Celsius', k: [0.1, 0.2, 0.25], A: [20, 22, 25], y0: [80, 90, 95], h: [1, 2, 0.5],
      mk: function(k, A){ return { s: '-' + k + '*(y - ' + A + ')', tex: '-' + tn(k) + '(H - ' + A + ')', f: function(t, y){ return -k * (y - A); }, at: function(t, y){ return '-' + tn(k) + '(' + tn(y) + ' - ' + A + ')'; } }; },
      say: function(k, A){ return 'cools so that $\\frac{dH}{dt} = -' + tn(k) + '(H - ' + A + ')$, where $H$ is ' + this.q + ' and $t$ is in minutes'; } },
    { id: 'drug', who: 'A patient on an IV drip', v: 'A', t: 't', unit: 'hours', q: 'the amount of the drug in the body in milligrams', k: [0.1, 0.2, 0.5], A: [10, 20, 40], y0: [0, 10, 30], h: [0.5, 1, 2],
      mk: function(k, R){ return { s: R + ' - ' + k + '*y', tex: R + ' - ' + tn(k) + 'A', f: function(t, y){ return R - k * y; }, at: function(t, y){ return R + ' - ' + tn(k) + ' \\cdot ' + pn(y); } }; },
      say: function(k, R){ return 'receives a drug at ' + R + ' mg per hour while the body removes it, so $\\frac{dA}{dt} = ' + R + ' - ' + tn(k) + 'A$, where $A$ is ' + this.q + ' and $t$ is in hours'; } },
    { id: 'fish', who: 'A pond', v: 'P', t: 't', unit: 'years', q: 'the number of fish, in hundreds', k: [0.5, 0.25], A: [10, 12, 8], y0: [2, 4, 6], h: [0.5, 1],
      mk: function(k, L){ var c = k / L; return { s: k + '*y*(1 - y/' + L + ')', tex: tn(k) + 'P\\left(1 - \\frac{P}{' + L + '}\\right)', f: function(t, y){ return k * y * (1 - y / L); }, at: function(t, y){ return tn(k) + ' \\cdot ' + pn(y) + '\\left(1 - \\frac{' + tn(y) + '}{' + L + '}\\right)'; } }; },
      say: function(k, L){ return 'holds a population of fish with $\\frac{dP}{dt} = ' + tn(k) + 'P\\left(1 - \\frac{P}{' + L + '}\\right)$, where $P$ is ' + this.q + ' and $t$ is in years'; } }
  ];
  function genModel(r, ctx){
    var pool = ctx.models ? MODELS.filter(function(m){ return ctx.models.indexOf(m.id) > -1; }) : MODELS;
    for(var g = 0; g < 300; g++){
      var Mo = r.pick(pool), k = r.pick(Mo.k), A = r.pick(Mo.A), y0 = r.pick(Mo.y0), h = r.pick(Mo.h), n = 2;
      if(Mo.id === 'cool' && y0 <= A) continue;
      var F = Mo.mk(k, A), rows = euler(F.f, 0, y0, h, n + 1);
      if(rows.some(function(q){ return dec(q.y) > 4 || dec(q.m) > 4; }) || rows[0].m === 0) continue;
      var E = eulerSteps(F, 0, y0, h, n, { x: 't', y: Mo.v, fn: Mo.v, ask: function(t){ return H('The Euler approximation of $' + Mo.v + '(' + tn(t) + ')$, ' + Mo.q); } });
      if(!distinct(E.steps)) continue;
      var tn2 = cl(n * h);
      return { ctx: ctx.id, topic: ctx.topic, type: 'model', de: F.s, model: Mo.id,
        text: H('<p>' + Mo.who + ' ' + Mo.say(k, A) + '. At $t = 0$, $' + Mo.v + ' = ' + tn(y0) + '$. Use Euler\'s method with ' + n + ' steps of size $\\Delta t = ' + tn(h) + '$ to approximate $' + Mo.v + '(' + tn(tn2) + ')$.</p>'),
        steps: E.steps, solution: eulerSolution(F, E.rows, h, n, { x: 't', y: Mo.v }),
        fig: { kind: 'euler', de: F.s, x0: 0, y0: y0, h: h, n: n, rows: E.rows, x: 't', y: Mo.v, unit: Mo.unit } };
    }
    throw new Error('genModel: no problem found');
  }

  /* --------------------------------------------- over or under (concavity) */
  /* Families with their d²y/dx² as an expression in x and y (implicit
     differentiation, dy/dx substituted), and the slips: y held constant,
     dy/dx dropped. */
  function famOU(r){
    var k = r.int(0, 2);
    if(k === 0){
      var a = r.pick([1, 2, -1, -2]), b = r.pick([1, -1, 2, -2]);
      return { s: a + '*x + ' + b + '*y', tex: poly([[a, 'x'], [b, 'y']]), f: function(x, y){ return a * x + b * y; },
        d2: a + ' + ' + b + '*(' + a + '*x + ' + b + '*y)', d2tex: tn(a) + (b < 0 ? ' - ' : ' + ') + (Math.abs(b) === 1 ? '' : tn(Math.abs(b))) + '\\frac{dy}{dx} = ' + poly([[a, ''], [b * a, 'x'], [b * b, 'y']]),
        f2: function(x, y){ return a + b * (a * x + b * y); },
        mis: [{ expr: String(a), why: 'That treats y as a constant. y is a function of x, so the y term gives a dy/dx: d/dx(' + b + 'y) = ' + b + '·dy/dx.' },
          { expr: a + ' + ' + b, why: 'd/dx of ' + b + 'y is ' + b + '·dy/dx, not ' + b + ': replace dy/dx by the given formula.' }] };
    }
    if(k === 1){
      var a1 = r.pick([1, 2, -1]);
      return { s: a1 + '*x*y', tex: (a1 === 1 ? '' : a1 === -1 ? '-' : tn(a1)) + 'xy', f: function(x, y){ return a1 * x * y; },
        d2: a1 + '*y + ' + a1 + '*x*(' + a1 + '*x*y)', d2tex: poly([[a1, 'y'], [a1, 'x\\frac{dy}{dx}']]) + ' = ' + poly([[a1, 'y'], [a1 * a1, 'x^2y']]),
        f2: function(x, y){ return a1 * y + a1 * a1 * x * x * y; },
        mis: [{ expr: a1 + '*y', why: 'That treats y as a constant: by the product rule, d/dx(xy) = y + x·dy/dx.' },
          { expr: a1 + '*y + ' + a1 + '*x', why: 'The product rule gives y + x·dy/dx; then replace dy/dx by ' + a1 + 'xy.' }] };
    }
    var c2 = r.pick([1, 2, -1]);
    return { s: 'x^2 + ' + c2 + '*y', tex: 'x^2' + coef(c2, 'y', false), f: function(x, y){ return x * x + c2 * y; },
      d2: '2*x + ' + c2 + '*(x^2 + ' + c2 + '*y)', d2tex: '2x' + (c2 < 0 ? ' - ' : ' + ') + (Math.abs(c2) === 1 ? '' : tn(Math.abs(c2))) + '\\frac{dy}{dx} = ' + poly([[c2, 'x^2'], [2, 'x'], [c2 * c2, 'y']]),
      f2: function(x, y){ return 2 * x + c2 * (x * x + c2 * y); },
      mis: [{ expr: '2*x', why: 'That treats y as a constant. Its term gives ' + c2 + '·dy/dx; replace dy/dx by the given formula.' },
        { expr: '2*x + ' + c2, why: 'd/dx of ' + c2 + 'y is ' + c2 + '·dy/dx, not ' + c2 + '.' }] };
  }
  /* d²y/dx² keeps one sign on the solution from x0 to x0 + h (sampled
     along an RK4 run), so the concavity argument holds on the whole step. */
  function signOn(F, x0, y0, h){
    var s0 = Math.sign(F.f2(x0, y0)), N = 40, x = x0, y = y0, dx = h / N;
    if(!s0) return 0;
    for(var i = 1; i <= N; i++){ y = rk4(F.f, x, y, x + dx, 4); x = x0 + i * dx; var v = F.f2(x, y); if(!isFinite(v) || Math.sign(v) !== s0 || Math.abs(v) < 0.05) return 0; }
    return s0;
  }
  function genOverUnder(r, ctx){
    for(var g = 0; g < 400; g++){
      var F = famOU(r), x0 = r.pick([0, 1, -1, 2]), y0 = r.int(-3, 3), h = r.pick([0.5, 0.25, 0.1, 1]);
      var m = F.f(x0, y0), v = F.f2(x0, y0), sgn = signOn(F, x0, y0, h);
      if(!sgn || m === 0) continue;
      var y1 = cl(y0 + m * h);
      if(dec(y1) > 4 || Math.abs(y1) > 40) continue;
      var bad = F.mis.some(function(ms){ var g2 = M.fn(ms.expr, ['x', 'y']); return Math.abs(g2({ x: x0, y: y0 }) - v) < 1e-9; });
      if(bad) continue;
      var x1 = cl(x0 + h), up = v > 0, P = '(' + tn(x0) + ', ' + tn(y0) + ')';
      var opts = ['An underestimate: the solution is concave up, so the tangent segment lies below it',
        'An overestimate: the solution is concave up, so the tangent segment lies above it',
        'An overestimate: the solution is concave down, so the tangent segment lies above it',
        'An underestimate: the solution is concave down, so the tangent segment lies below it'];
      var right = up ? 0 : 2, others = [0, 1, 2, 3].filter(function(i){ return i !== right; }), ord = [right].concat(others), sh = shuffleIdx(r, 4);
      var whyC = function(i){
        if(i === right) return 'Right: $\\frac{d^2y}{dx^2} ' + (up ? '> 0' : '< 0') + '$ on the step, so the curve bends ' + (up ? 'up, away above' : 'down, away below') + ' its tangent line. Euler follows the tangent line, so it ' + (up ? 'under' : 'over') + 'estimates.';
        if((i < 2) !== up) return 'Check the sign of the second derivative: $\\frac{d^2y}{dx^2} = ' + tn(v) + '$ at $' + P + '$, so the solution is concave ' + (up ? 'up' : 'down') + '.';
        return 'The concavity is right, but a curve that is concave ' + (up ? 'up lies above' : 'down lies below') + ' its tangent lines, so the Euler value is ' + (up ? 'too low' : 'too high') + '.';
      };
      var mis1 = [{ value: y0 + m, why: 'Multiply the slope by the step size: Δy = ' + tn(m) + ' · ' + tn(h) + '.' }, { value: m * h, why: 'Add the change to the starting value ' + tn(y0) + '.' }, { value: y0 - m * h, why: 'Sign: new y = y + (dy/dx)·Δx.' }];
      return { ctx: ctx.id, topic: ctx.topic, type: 'overunder', de: F.s,
        text: H('<p>Let $y = f(x)$ be the solution of $\\frac{dy}{dx} = ' + F.tex + '$ with $f(' + tn(x0) + ') = ' + tn(y0) + '$. The second derivative keeps one sign between $x = ' + tn(x0) + '$ and $x = ' + tn(x1) + '$.</p>'),
        steps: [
          stepNum('e1', H('The Euler approximation of $f(' + tn(x1) + ')$ with one step of size $' + tn(h) + '$'), exact(y1, mis1), { d: dec(y1), practice: '1.E', level: 'apply', hint: H('One step: $f(' + tn(x1) + ') \\approx f(' + tn(x0) + ') + m \\cdot ' + tn(h) + '$, where $m$ is $\\frac{dy}{dx}$ at $' + P + '$.') }),
          { key: 'd2', kind: 'expr', label: H('$\\frac{d^2y}{dx^2}$ in terms of $x$ and $y$'), lhs: '\\frac{d^2y}{dx^2} =', cell: { expr: { answer: F.d2, vars: ['x', 'y'], mode: 'exact', domain: { x: [-2, 2], y: [-2, 2] }, mistakes: F.mis } },
            hint: H('Differentiate $' + F.tex + '$ with respect to $x$. Each $y$ gives a $\\frac{dy}{dx}$; then replace $\\frac{dy}{dx}$ by $' + F.tex + '$.'), practice: '1.E', level: 'apply' },
          stepNum('d2v', H('Its value at $' + P + '$'), exact(v, [{ value: m, why: 'That is dy/dx at the point, the first derivative. Put the point into the second derivative.' }]), { d: dec(v), practice: '1.E', level: 'apply' }),
          stepChoice('ou', H('So the Euler approximation of $f(' + tn(x1) + ')$ is'), sh.idx.map(function(i){ return opts[ord[i]]; }), sh.correct, sh.idx.map(function(i){ return H(whyC(ord[i])); }), { practice: '3.D', level: 'analyze' })
        ],
        solution: [H('One step: $f(' + tn(x1) + ') \\approx ' + tn(y0) + (m < 0 ? ' + (' + tn(m) + ')' : ' + ' + tn(m)) + '(' + tn(h) + ') = ' + tn(y1) + '$.'),
          H('$\\frac{d^2y}{dx^2} = ' + F.d2tex + '$, which is $' + tn(v) + '$ at $' + P + '$.'),
          H((up ? 'Positive' : 'Negative') + ' on the whole step, so the solution is concave ' + (up ? 'up and lies above' : 'down and lies below') + ' the tangent segment Euler follows: $' + tn(y1) + '$ is an ' + (up ? 'under' : 'over') + 'estimate.')],
        fig: { kind: 'ou', de: F.s, x0: x0, y0: y0, h: h, y1: y1, d2: v, up: up } };
    }
    throw new Error('genOverUnder: no problem found');
  }

  /* ------------------------------------------------------------ logistic */
  /* Three ways the exam writes a logistic equation; each has its own slip
     when reading the carrying capacity. */
  function logForm(r, k, L, V){
    var form = r.int(0, 2);
    if(form === 0) return { form: 0, k: k, L: L, tex: tn(k) + V + '\\left(1 - \\frac{' + V + '}{' + L + '}\\right)', s: k + '*P*(1 - P/' + L + ')', rate: function(P){ return k * P * (1 - P / L); },
      capMis: [{ value: k, why: 'That is the growth constant. The carrying capacity is the value of ' + V + ' that makes the factor (1 − ' + V + '/' + L + ') zero.' }] };
    if(form === 1){ var c = cl(k / L); return { form: 1, c: c, L: L, tex: tn(c) + V + '(' + L + ' - ' + V + ')', s: c + '*P*(' + L + ' - P)', rate: function(P){ return c * P * (L - P); },
      capMis: [{ value: 1 / c, why: 'That is 1 over the constant. In ' + V + '(' + L + ' − ' + V + '), the rate is zero at ' + V + ' = ' + L + '.' }, { value: c * L, why: 'That is the constant times ' + L + ', the relative growth rate when ' + V + ' is small, not the limit.' }] }; }
    var a = k, b = cl(k / L);
    return { form: 2, a: a, b: b, L: L, tex: tn(a) + V + ' - ' + tn(b) + V + '^2', s: a + '*P - ' + b + '*P^2', rate: function(P){ return a * P - b * P * P; },
      capMis: [{ value: 1 / b, why: 'Factor first: ' + tn(a) + V + ' − ' + tn(b) + V + '² = ' + tn(b) + V + '(' + tn(a / b) + ' − ' + V + '). The rate is zero at ' + V + ' = ' + tn(a / b) + ', so ' + tn(a) + '/' + tn(b) + ', not 1/' + tn(b) + '.' }, { value: b / a, why: 'The ratio is upside down: the rate is zero where ' + tn(a) + ' = ' + tn(b) + V + ', at ' + V + ' = ' + tn(a) + '/' + tn(b) + '.' }] };
  }
  function genLogistic(r, ctx0){
    // a context may carry several stories (ctx.stories): one is picked per problem
    var ctx = ctx0.stories && ctx0.stories.length ? Object.assign({}, ctx0, r.pick(ctx0.stories)) : ctx0;
    var V = ctx.v || 'P', u = ctx.unit || 'years', noun = ctx.noun || 'the population';
    for(var g = 0; g < 300; g++){
      var L = r.pick(ctx.L || [200, 500, 800, 1000, 1200]), k = r.pick(ctx.k || [0.2, 0.4, 0.5, 0.8, 1.2]);
      var F = logForm(r, k, L, V);
      if(exactDec(F.c || 0) > 6 || exactDec(F.b || 0) > 6) continue;
      var zone = r.pick(ctx.noAbove ? [0, 0, 1] : [0, 0, 1, 2]), P0 = zone === 0 ? cl(L * r.pick([0.1, 0.2, 0.25, 0.3])) : zone === 1 ? cl(L * r.pick([0.6, 0.75, 0.8])) : cl(L * r.pick([1.2, 1.5]));
      var half = L / 2, maxR = F.rate(half), r0 = F.rate(P0);
      if(dec(maxR) > 3 || dec(r0) > 3) continue;
      var inc = r0 > 0, up = (P0 < half) || (P0 > L);
      // the shape near t = 0: dP/dt > 0 below L, and d2P/dt2 = (dP/dt)'(P) dP/dt
      var shapes = ['increasing and concave up', 'increasing and concave down', 'decreasing and concave up', 'decreasing and concave down'];
      var right = inc ? (up ? 0 : 1) : (up ? 2 : 3), ord = [right].concat([0, 1, 2, 3].filter(function(i){ return i !== right; })), sh = shuffleIdx(r, 4);
      var whyS = function(i){
        if(i === right) return 'Right: ' + (P0 > L ? 'above the carrying capacity the rate is negative, so ' + V + ' falls toward ' + L + ', more slowly as it gets closer (concave up).' : P0 < half ? 'below ' + tn(half) + ', half the carrying capacity, the rate is positive and still growing as ' + V + ' grows: increasing and concave up.' : 'between ' + tn(half) + ' and ' + L + ' the rate is positive but shrinking as ' + V + ' grows: increasing and concave down.');
        var j = i;
        if((j < 2) !== inc) return 'Check the sign of $\\frac{d' + V + '}{dt}$ at $' + V + ' = ' + tn(P0) + '$: it is $' + tn(r0) + '$, so ' + V + ' is ' + (inc ? 'increasing' : 'decreasing') + '.';
        return 'Concavity: the rate $\\frac{d' + V + '}{dt}$ is largest at $' + V + ' = ' + tn(half) + '$. ' + (P0 < half ? 'Below it the rate grows as ' + V + ' grows: concave up.' : P0 > L ? 'Above ' + L + ' the rate is negative and moves toward 0 as ' + V + ' falls: concave up.' : 'Above it the rate shrinks as ' + V + ' grows: concave down.');
      };
      var Vt = V + '(t)';
      var steps = [
        stepNum('cap', H('The carrying capacity'), exact(L, F.capMis.concat([{ value: half, why: 'That is half the carrying capacity, where the growth is fastest. The carrying capacity is where the rate returns to 0.' }])), { d: 0, practice: '2.D', level: 'apply', hint: H('Find the positive value of $' + V + '$ that makes $\\frac{d' + V + '}{dt} = 0$.') }),
        stepNum('lim', H('$\\lim_{t \\to \\infty} ' + Vt + '$, given $' + V + '(0) = ' + tn(P0) + '$'), exact(L, [{ value: P0, why: 'That is where it starts. A logistic solution with ' + V + '(0) > 0 approaches the carrying capacity.' }, { value: half, why: 'That is where it grows fastest. It keeps growing past it, toward the carrying capacity.' }, { value: 0, why: 'Only the solution that starts at 0 stays at 0; this one starts at ' + tn(P0) + '.' }]), { d: 0, practice: '3.D', level: 'apply' }),
        stepNum('half', H('The value of $' + V + '$ where ' + noun + ' grows fastest'), exact(half, [{ value: L, why: 'At the carrying capacity the rate is 0. The rate kP(L − P) is a parabola in ' + V + ', largest halfway between its zeros 0 and ' + L + '.' }, { value: P0, why: 'That is the starting value. The rate is largest at half the carrying capacity.' }]), { d: dec(half), practice: '2.D', level: 'apply' }),
        stepNum('rate', H('The largest value of $\\frac{d' + V + '}{dt}$ (in ' + esc(ctx.rateUnit || 'per ' + u.replace(/s$/, '')) + ')'), exact(maxR, [{ value: r0, why: 'That is the rate at the start. Put ' + V + ' = ' + tn(half) + ' into the equation.' }, { value: F.rate(L), why: 'At the carrying capacity the rate is 0. Put ' + V + ' = ' + tn(half) + ' into the equation.' }, { value: 2 * maxR, why: 'Check the arithmetic: put ' + V + ' = ' + tn(half) + ' into the equation.' }]), { d: dec(maxR), practice: '1.E', level: 'apply' }),
        stepChoice('shape', H('Near $t = 0$, the graph of $' + Vt + '$ is'), sh.idx.map(function(i){ return shapes[ord[i]]; }), sh.correct, sh.idx.map(function(i){ return H(whyS(ord[i])); }), { practice: '3.D', level: 'analyze' })
      ];
      var fac = F.form === 0 ? 'the factor $1 - \\frac{' + V + '}{' + L + '}$ is 0 at $' + V + ' = ' + L + '$' : F.form === 1 ? 'the factor $' + L + ' - ' + V + '$ is 0 at $' + V + ' = ' + L + '$' : 'factor: $' + F.tex + ' = ' + tn(F.b) + V + '(' + L + ' - ' + V + ')$, zero at $' + V + ' = ' + L + '$';
      return { ctx: ctx0.id, topic: ctx0.topic, type: 'logistic', de: F.s, story: ctx.sid || null,
        text: H('<p>' + esc(ctx.story || 'A population') + ': $\\frac{d' + V + '}{dt} = ' + F.tex + '$, where $' + V + '$ is ' + esc(noun) + ' and $t$ is in ' + esc(u) + '. At $t = 0$, $' + V + ' = ' + tn(P0) + '$.</p>'),
        steps: steps,
        solution: [H('The rate is 0 where $' + V + ' = 0$ and where ' + fac + ', so the carrying capacity is $' + L + '$.'),
          H('$' + V + '(0) = ' + tn(P0) + ' > 0$, so $\\lim_{t \\to \\infty} ' + Vt + ' = ' + L + '$' + (P0 > L ? ' (from above: it decreases toward ' + L + ').' : '.')),
          H('The rate is a downward parabola in $' + V + '$ with zeros 0 and ' + L + ', so it is largest halfway, at $' + V + ' = ' + tn(half) + '$, where $\\frac{d' + V + '}{dt} = ' + tn(maxR) + '$.'),
          H('At $' + V + ' = ' + tn(P0) + '$, $\\frac{d' + V + '}{dt} = ' + tn(r0) + '$: ' + shapes[right] + '.')],
        fig: { kind: 'logistic', k: k, L: L, P0: P0, half: half, maxRate: maxR, v: V, unit: u, form: F.form, shape: right } };
    }
    throw new Error('genLogistic: no problem found');
  }
  function esc(s){ return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

  var GEN = { euler: genEuler, model: genModel, overunder: genOverUnder, logistic: genLogistic };
  function generate(r, ctx, type){
    var kind = type || ctx.kind || 'euler';
    if(!GEN[kind]) throw new Error('eulerLogistic.generate: no problem kind "' + kind + '"');
    return GEN[kind](r, ctx);
  }

  M.register('eulerLogistic', {
    GALLERY: GALLERY, de: de, euler: euler, rk4: rk4, logistic: logistic, MODELS: MODELS,
    generate: generate, KINDS: Object.keys(GEN), dec: dec, dn: dn, tn: tn
  });
})(typeof window !== 'undefined' ? window : globalThis);
