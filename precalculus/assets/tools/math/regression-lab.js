/* Regression lab model: ApPrecalcMath.regressionLab (docs/apprecalc-architecture.md, "Tools").
   OWNED BY THIS TOOL ONLY (docs/apprecalc-briefs/t1.md): no other tool edits this
   file, and this tool edits no shared file. Pure functions, no DOM, so the
   validator (scripts/lib/apprecalc-tool-checks/regression-lab.mjs) and the test
   (scripts/test/apprecalc-tool-regression-lab.test.mjs) run exactly this code.

   Models, in the forms a graphing calculator reports them (MODELS):
     linear      y = ax + b                 quadratic  y = ax^2 + bx + c
     cubic       y = ax^3 + bx^2 + cx + d   quartic    y = ax^4 + ... + e
     exponential y = a·b^x  (least squares on ln y, as ExpReg does)
     logarithmic y = a + b ln x  (least squares on ln x, as LnReg does)
     sinusoidal  y = a sin(bx + c) + d  (frequency by search, then least squares)
   fit(kind, xs, ys) -> { kind, k: [constants, stored unrounded], f(x), sse, res: [residuals] }
   pattern(xs, res) -> { runs, expected, pattern: bool }  a runs test on the
     signs of the residuals in x order: too few runs means a pattern.
   DATASETS: the Explore contexts, each made from its seed (data(id)).
   Test yourself: generate(rng, ctx, type) for the kinds in KINDS; every
   calculator answer is keyed at full precision (the three-decimal rule). */
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
  function f3(x){ return M.fixed(x, 3); }

  /* ------------------------------------------------------- least squares */
  /* Solve A x = b (Gaussian elimination, partial pivoting). */
  function solve(A, b){
    var nn = b.length, m = A.map(function(r, i){ return r.concat([b[i]]); });
    for(var c = 0; c < nn; c++){
      var p = c;
      for(var r = c + 1; r < nn; r++) if(Math.abs(m[r][c]) > Math.abs(m[p][c])) p = r;
      var t = m[c]; m[c] = m[p]; m[p] = t;
      if(Math.abs(m[c][c]) < 1e-300) return null;
      for(var r2 = c + 1; r2 < nn; r2++){ var k = m[r2][c] / m[c][c]; for(var j = c; j <= nn; j++) m[r2][j] -= k * m[c][j]; }
    }
    var x = new Array(nn);
    for(var i = nn - 1; i >= 0; i--){ var s = m[i][nn]; for(var j2 = i + 1; j2 < nn; j2++) s -= m[i][j2] * x[j2]; x[i] = s / m[i][i]; }
    return x;
  }
  /* Least squares y ≈ Σ c_j φ_j(x) through the normal equations. */
  function lsq(phis, xs, ys){
    var k = phis.length, A = [], b = [];
    for(var i = 0; i < k; i++){ A.push([]); b.push(0); for(var j = 0; j < k; j++) A[i].push(0); }
    xs.forEach(function(x, r){ var row = phis.map(function(ph){ return ph(x); }); for(var i = 0; i < k; i++){ b[i] += row[i] * ys[r]; for(var j = 0; j < k; j++) A[i][j] += row[i] * row[j]; } });
    return solve(A, b);
  }
  /* A polynomial fit, on centered and scaled x so the normal equations stay
     well conditioned, then expanded back to powers of x (highest first). */
  function polyFit(deg, xs, ys){
    var mu = xs.reduce(function(s, x){ return s + x; }, 0) / xs.length, sd = Math.sqrt(xs.reduce(function(s, x){ return s + (x - mu) * (x - mu); }, 0) / xs.length) || 1;
    var phis = []; for(var p = 0; p <= deg; p++) phis.push((function(q){ return function(x){ return Math.pow((x - mu) / sd, q); }; })(p));
    var t = lsq(phis, xs, ys);
    if(!t) return null;
    // Σ t_q ((x - mu)/sd)^q  ->  Σ c_j x^j
    var c = []; for(var j = 0; j <= deg; j++) c.push(0);
    for(var q = 0; q <= deg; q++) for(var j2 = 0; j2 <= q; j2++) c[j2] += t[q] * binom(q, j2) * Math.pow(-mu, q - j2) / Math.pow(sd, q);
    return c.reverse();   // highest power first
  }
  function binom(a, b){ var r = 1; for(var i = 1; i <= b; i++) r = r * (a - b + i) / i; return r; }
  function peval(c, x){ return c.reduce(function(s, k){ return s * x + k; }, 0); }

  var MODELS = {
    linear: { name: 'Linear', form: 'y = ax + b', letters: ['a', 'b'], deg: 1 },
    quadratic: { name: 'Quadratic', form: 'y = ax^2 + bx + c', letters: ['a', 'b', 'c'], deg: 2 },
    cubic: { name: 'Cubic', form: 'y = ax^3 + bx^2 + cx + d', letters: ['a', 'b', 'c', 'd'], deg: 3 },
    quartic: { name: 'Quartic', form: 'y = ax^4 + bx^3 + cx^2 + dx + e', letters: ['a', 'b', 'c', 'd', 'e'], deg: 4 },
    exponential: { name: 'Exponential', form: 'y = a \\cdot b^x', letters: ['a', 'b'] },
    logarithmic: { name: 'Logarithmic', form: 'y = a + b\\ln x', letters: ['a', 'b'] },
    sinusoidal: { name: 'Sinusoidal', form: 'y = a\\sin(bx + c) + d', letters: ['a', 'b', 'c', 'd'] }
  };
  var MORDER = ['linear', 'quadratic', 'cubic', 'quartic', 'exponential', 'logarithmic', 'sinusoidal'];
  function fnOf(kind, k){
    var D = MODELS[kind];
    if(D.deg) return function(x){ return peval(k, x); };
    if(kind === 'exponential') return function(x){ return k[0] * Math.pow(k[1], x); };
    if(kind === 'logarithmic') return function(x){ return x > 0 ? k[0] + k[1] * Math.log(x) : NaN; };
    return function(x){ return k[0] * Math.sin(k[1] * x + k[2]) + k[3]; };
  }
  /* Can this model be fit to these data? (ExpReg needs y > 0, LnReg x > 0) */
  function allowed(kind, xs, ys){
    if(kind === 'exponential') return ys.every(function(y){ return y > 0; });
    if(kind === 'logarithmic') return xs.every(function(x){ return x > 0; });
    if(MODELS[kind].deg) return xs.length > MODELS[kind].deg;
    return xs.length >= 5;
  }
  function sinFit(xs, ys){
    var span = Math.max.apply(null, xs) - Math.min.apply(null, xs), dx = span / (xs.length - 1);
    var lo = 2 * PI / (span * 2), hi = 2 * PI / (2.2 * dx), best = null;
    function at(b){
      var c = lsq([function(x){ return Math.sin(b * x); }, function(x){ return Math.cos(b * x); }, function(){ return 1; }], xs, ys);
      if(!c) return { sse: Infinity };
      var sse = 0; xs.forEach(function(x, i){ var e = ys[i] - (c[0] * Math.sin(b * x) + c[1] * Math.cos(b * x) + c[2]); sse += e * e; });
      return { b: b, c: c, sse: sse };
    }
    var N = 600, prev = [];
    for(var i = 0; i <= N; i++){ var b = lo + (hi - lo) * i / N, r = at(b); prev.push(r); if(!best || r.sse < best.sse) best = r; }
    // golden-section refinement around the best grid frequency
    var step = (hi - lo) / N, A = Math.max(lo, best.b - step), B = Math.min(hi, best.b + step), g = (Math.sqrt(5) - 1) / 2;
    var x1 = B - g * (B - A), x2 = A + g * (B - A), f1 = at(x1), f2 = at(x2);
    for(var k = 0; k < 80; k++){
      if(f1.sse < f2.sse){ B = x2; x2 = x1; f2 = f1; x1 = B - g * (B - A); f1 = at(x1); }
      else { A = x1; x1 = x2; f1 = f2; x2 = A + g * (B - A); f2 = at(x2); }
    }
    var r2 = f1.sse < f2.sse ? f1 : f2;
    if(r2.sse > best.sse) r2 = best;
    var amp = Math.sqrt(r2.c[0] * r2.c[0] + r2.c[1] * r2.c[1]), ph = Math.atan2(r2.c[1], r2.c[0]);
    return [amp, r2.b, ph, r2.c[2]];
  }
  function fit(kind, xs, ys){
    if(!allowed(kind, xs, ys)) return null;
    var D = MODELS[kind], k;
    if(D.deg) k = polyFit(D.deg, xs, ys);
    else if(kind === 'exponential'){ var l = polyFit(1, xs, ys.map(Math.log)); k = l && [Math.exp(l[1]), Math.exp(l[0])]; }
    else if(kind === 'logarithmic'){ var g = polyFit(1, xs.map(Math.log), ys); k = g && [g[1], g[0]]; }
    else k = sinFit(xs, ys);
    if(!k) return null;
    var f = fnOf(kind, k), res = xs.map(function(x, i){ return ys[i] - f(x); }), sse = res.reduce(function(s, e){ return s + e * e; }, 0);
    return { kind: kind, k: k, f: f, res: res, sse: sse };
  }
  /* Runs test on the residual signs, in x order. */
  function pattern(xs, res){
    var idx = xs.map(function(x, i){ return i; }).sort(function(a, b){ return xs[a] - xs[b]; });
    var scale = Math.max.apply(null, res.map(Math.abs)) || 1;
    var s = idx.map(function(i){ return res[i] > 1e-9 * scale ? 1 : res[i] < -1e-9 * scale ? -1 : 0; }).filter(function(v){ return v; });
    var pos = s.filter(function(v){ return v > 0; }).length, neg = s.length - pos, runs = s.length ? 1 : 0;
    for(var i = 1; i < s.length; i++) if(s[i] !== s[i - 1]) runs++;
    var N = pos + neg, mu = N ? 1 + 2 * pos * neg / N : 0, v = N > 1 ? 2 * pos * neg * (2 * pos * neg - N) / (N * N * (N - 1)) : 0;
    return { runs: runs, expected: mu, pattern: N >= 6 && runs <= mu - Math.sqrt(Math.max(v, 0.25)) };
  }
  /* The equation with three decimals shown (TeX). */
  function eqTex(kind, k){
    function c(v, first){ var s = f3(Math.abs(v)); return (v < 0 ? (first ? '-' : ' - ') : first ? '' : ' + ') + s; }
    var D = MODELS[kind];
    if(D.deg){ var out = '', deg = D.deg; k.forEach(function(v, i){ var p = deg - i; out += c(v, !i) + (p ? 'x' + (p > 1 ? '^{' + p + '}' : '') : ''); }); return 'y = ' + out; }
    if(kind === 'exponential') return 'y = ' + f3(k[0]) + '(' + f3(k[1]) + ')^{x}';
    if(kind === 'logarithmic') return 'y = ' + f3(k[0]) + c(k[1]) + '\\ln x';
    return 'y = ' + f3(k[0]) + '\\sin(' + f3(k[1]) + 'x' + c(k[2]) + ')' + c(k[3]);
  }

  /* ------------------------------------------------------- the Explore data */
  function noisy(seed, xs, f, amp){ var r = M.rng(seed); return xs.map(function(x){ return M.round(f(x) + (r() - 0.5) * 2 * amp, 2); }); }
  function range(a, b, s){ var out = []; for(var x = a; x <= b + 1e-9; x += s) out.push(M.round(x, 6)); return out; }
  var DATASETS = {
    crickets: { name: 'Cricket chirps', story: 'Air temperature against a cricket\'s chirps per minute.', x: 'chirps per minute', y: 'temperature (°F)', best: 'linear', seed: 11,
      xs: range(60, 170, 10), make: function(x){ return 0.25 * x + 40; }, amp: 2.2 },
    stopping: { name: 'Stopping distance', story: 'A car\'s stopping distance against its speed.', x: 'speed (mph)', y: 'distance (ft)', best: 'quadratic', seed: 23,
      xs: range(10, 70, 6), make: function(x){ return 0.05 * x * x + 1.1 * x; }, amp: 7 },
    box: { name: 'Open box', story: 'The volume of an open box cut from a 20 cm by 14 cm card, against the side of the corner squares.', x: 'cut (cm)', y: 'volume (cm³)', best: 'cubic', seed: 31,
      xs: range(0.5, 6.5, 0.6), make: function(x){ return x * (20 - 2 * x) * (14 - 2 * x); }, amp: 9 },
    caffeine: { name: 'Caffeine', story: 'Caffeine left in the body after a 200 mg drink, against hours since drinking it.', x: 'time (hours)', y: 'caffeine (mg)', best: 'exponential', seed: 41,
      xs: range(0, 11, 1), make: function(x){ return 200 * Math.pow(0.87, x); }, amp: 4 },
    practice: { name: 'Practice', story: 'A typing test score against hours of practice.', x: 'practice (hours)', y: 'score', best: 'logarithmic', seed: 59,
      xs: range(1, 34, 3), make: function(x){ return 12 + 9 * Math.log(x); }, amp: 1.3 },
    daylight: { name: 'Daylight', story: 'Hours of daylight in a northern city, against the month (1 is mid-January).', x: 'month', y: 'daylight (hours)', best: 'sinusoidal', seed: 71,
      xs: range(1, 12, 1), make: function(x){ return 3.2 * Math.sin(0.52 * (x - 3.3)) + 12.2; }, amp: 0.18 }
  };
  var DORDER = ['crickets', 'stopping', 'box', 'caffeine', 'practice', 'daylight'];
  function data(id){ var D = DATASETS[id]; return { xs: D.xs.slice(), ys: noisy(D.seed, D.xs, D.make, D.amp) }; }

  /* ------------------------------------------------------- the drill */
  function choice(key, label, list, practice){
    return { key: key, kind: 'choice', label: H(label), options: list.map(function(o){ return optHtml(o[0]); }), why: list.map(function(o){ return H(o[1]); }), correct: 0, practice: practice || '3.A' };
  }
  /* A calculator answer: right when it matches the key to three decimal places. */
  function calcStep(key, label, answer, mistakes, o){
    o = o || {};
    return { key: key, kind: 'num', label: H(label), unit: o.unit || '', practice: o.practice || '1.C', d: 3, calc: true,
      hint: 'Calculator: correct to three decimal places.',
      cell: M.cell(answer, 0, (mistakes || []).map(function(m){ return { value: m[0], why: H(m[1]) }; }), 0.001) };
  }
  function exactStep(key, label, answer, mistakes, o){
    o = o || {};
    var whole = Math.abs(answer - Math.round(answer)) < 1e-9;
    return { key: key, kind: 'num', label: H(label), unit: o.unit || '', practice: o.practice || '2.A', d: whole ? 0 : 3,
      hint: whole ? '' : 'Exact, or correct to three decimal places.',
      cell: M.cell(answer, 6e-4, (mistakes || []).map(function(m){ return { value: m[0], why: H(m[1]) }; }), 6e-4) };
  }
  function tableHtml(xs, ys, xl, yl){
    return '<table class="bt-table rl-dtab"><thead><tr><th scope="row">' + xl + '</th>' + xs.map(function(x){ return '<td>' + n(x, 2) + '</td>'; }).join('') + '</tr></thead><tbody><tr><th scope="row">' + yl + '</th>' + ys.map(function(y){ return '<td>' + n(y, 2) + '</td>'; }).join('') + '</tr></tbody></table>';
  }
  /* A drill data set: a true model, 6 inputs, outputs with two decimals of noise. */
  function drillData(r, kind){
    var xs = [], ys, f;
    if(kind === 'linear'){ var m = r.pick([1, -1]) * r.between(0.6, 4.5, 2), b0 = r.int(5, 40); f = function(x){ return m * x + b0; }; for(var i = 0; i < 6; i++) xs.push(1 + 2 * i); }
    else if(kind === 'exponential'){ var a = r.int(20, 120), g = r.pick([r.between(1.08, 1.35, 3), r.between(0.72, 0.92, 3)]); f = function(x){ return a * Math.pow(g, x); }; for(var j = 0; j < 6; j++) xs.push(j * 2); }
    else { var A = r.pick([-1, 1]) * r.between(0.3, 1.5, 2), h = r.int(3, 7), k0 = r.int(10, 40); f = function(x){ return A * (x - h) * (x - h) + k0; }; for(var q = 0; q < 6; q++) xs.push(1 + 2 * q); }
    ys = xs.map(function(x){ return M.round(f(x) + (r() - 0.5) * Math.max(0.6, Math.abs(f(x)) * 0.04), 2); });
    return { xs: xs, ys: ys };
  }
  var GEN = {};
  GEN.linear = function(r){
    var d = drillData(r, 'linear'), F = fit('linear', d.xs, d.ys), x0 = d.xs[5] + r.int(1, 4) + 0.5, k = F.k;
    var pred = F.f(x0), round2 = M.round(k[0], 2) * x0 + M.round(k[1], 2), round1 = M.round(k[0], 1) * x0 + M.round(k[1], 1);
    var text = H('<p>A city tracks the price of a bus pass, in dollars, $x$ years after 2010.</p>' + tableHtml(d.xs, d.ys, '$x$', '$y$') + '<p>Use linear regression, $y = ax + b$.</p>');
    var lin = fit('exponential', d.xs, d.ys);
    var steps = [
      calcStep('a', 'Give $a$, the slope of the regression line.', k[0], [[(d.ys[5] - d.ys[0]) / (d.xs[5] - d.xs[0]), 'That is the slope through the first and last points only. A regression uses every point: run LinReg on the whole table.']]),
      calcStep('b', 'Give $b$.', k[1], [[d.ys[0] - k[0] * d.xs[0], 'That line goes through the first point. The regression line need not pass through any data point.']]),
      calcStep('p', 'Use the model to predict $y$ when $x = ' + n(x0) + '$.', pred, [[round2, 'You rounded $a$ and $b$ to two decimals before predicting. Store the regression constants and use them unrounded; round only the final answer.'], [round1, 'You rounded $a$ and $b$ before predicting. Store the constants and round only the final answer.'], [lin ? lin.f(x0) : NaN, 'That is the exponential regression\'s prediction. The question asks for the linear model.']], { practice: '3.B' })
    ];
    var sol = ['LinReg on the table gives $' + eqTex('linear', k) + '$ (constants stored, not rounded).', 'At $x = ' + n(x0) + '$: $y \\approx ' + f3(pred) + '$.', 'Rounding $a$ and $b$ first would give $' + f3(round2) + '$: store, then round only at the end.'];
    return { text: text, steps: steps, solution: sol, fig: { xs: d.xs, ys: d.ys, kind: 'linear', k: k, x0: x0 }, values: { xs: d.xs, ys: d.ys, x0: x0, k: k } };
  };
  GEN.exponential = function(r){
    var d = drillData(r, 'exponential'), F = fit('exponential', d.xs, d.ys), x0 = d.xs[5] + r.pick([1, 3]), k = F.k, pred = F.f(x0);
    var L = fit('linear', d.xs, d.ys), rounded = M.round(k[0], 2) * Math.pow(M.round(k[1], 2), x0);
    var text = H('<p>A lab measures the mass, in grams, of a sample $x$ days after it is set out.</p>' + tableHtml(d.xs, d.ys, '$x$', '$y$') + '<p>Use exponential regression, $y = a \\cdot b^x$.</p>');
    var steps = [
      calcStep('a', 'Give $a$.', k[0], [[d.ys[0], 'That is the first data value. The regression uses every point, so $a$ need not equal $y$ at $x = 0$.']]),
      calcStep('b', 'Give $b$, the growth or decay factor.', k[1], [[k[1] - 1, 'That is the rate, $b - 1$. The question asks for the factor $b$ itself.'], [L.k[0], 'That is the slope of a linear regression. Run ExpReg.']]),
      calcStep('p', 'Predict $y$ when $x = ' + n(x0) + '$.', pred, [[rounded, 'You rounded $a$ and $b$ before predicting. A small change in $b$ grows with the power: store the constants and round only the final answer.'], [L.f(x0), 'That is the linear model\'s prediction. Use the exponential model.']], { practice: '3.B' }),
      choice('kind', 'What does $b$ say about the mass?', k[1] > 1 ? [
        ['It grows by about ' + n((k[1] - 1) * 100, 1) + '% per day.', 'Right: $b > 1$, and $b - 1 \\approx ' + f3(k[1] - 1) + '$ is the growth rate per day.'],
        ['It decays by about ' + n((k[1] - 1) * 100, 1) + '% per day.', '$b > 1$ means growth.'],
        ['It grows by about ' + f3(k[1]) + ' grams per day.', 'An exponential model grows by a constant factor, not a constant amount.'],
        ['It grows by about ' + n(k[1] * 100, 1) + '% per day.', 'The rate is $b - 1$, not $b$.']
      ] : [
        ['It decays by about ' + n((1 - k[1]) * 100, 1) + '% per day.', 'Right: $b < 1$, and $1 - b \\approx ' + f3(1 - k[1]) + '$ is the fraction lost per day.'],
        ['It grows by about ' + n((1 - k[1]) * 100, 1) + '% per day.', '$0 < b < 1$ means decay.'],
        ['It decays by about ' + f3(1 - k[1]) + ' grams per day.', 'An exponential model changes by a constant factor, not a constant amount.'],
        ['It decays by about ' + n(k[1] * 100, 1) + '% per day.', 'The fraction lost is $1 - b$; $b$ is the fraction kept.']
      ], '3.B')
    ];
    var sol = ['ExpReg on the table gives $' + eqTex('exponential', k) + '$ (constants stored).', 'At $x = ' + n(x0) + '$: $y \\approx ' + f3(pred) + '$ grams.', '$b ' + (k[1] > 1 ? '> 1$: growth' : '< 1$: decay') + ' by a factor of $' + f3(k[1]) + '$ each day.'];
    return { text: text, steps: steps, solution: sol, fig: { xs: d.xs, ys: d.ys, kind: 'exponential', k: k, x0: x0 }, values: { xs: d.xs, ys: d.ys, x0: x0, k: k } };
  };
  GEN.quadratic = function(r){
    var d = drillData(r, 'quadratic'), F = fit('quadratic', d.xs, d.ys), x0 = r.pick([2, 4, 6, 8]), k = F.k, pred = F.f(x0);
    var L = fit('linear', d.xs, d.ys), rounded = M.round(k[0], 2) * x0 * x0 + M.round(k[1], 2) * x0 + M.round(k[2], 2);
    var text = H('<p>A ball\'s path is recorded: its height $y$, in feet, $x$ feet from the launch point' + (k[0] > 0 ? ' (measured below a reference line)' : '') + '.</p>' + tableHtml(d.xs, d.ys, '$x$', '$y$') + '<p>Use quadratic regression, $y = ax^2 + bx + c$.</p>');
    var steps = [
      calcStep('a', 'Give $a$.', k[0], [[L.k[0], 'That is the slope of a linear regression. Run QuadReg.']]),
      calcStep('p', 'Predict $y$ when $x = ' + x0 + '$.', pred, [[rounded, 'You rounded the constants before predicting. Store them and round only the final answer.'], [L.f(x0), 'That is the linear model\'s prediction.'], [d.ys[d.xs.indexOf(x0 - 1)] != null ? (d.ys[d.xs.indexOf(x0 - 1)] + d.ys[d.xs.indexOf(x0 + 1)]) / 2 : NaN, 'That averages the two neighboring data values. Use the regression model.']], { practice: '3.B' }),
      choice('open', 'What does the sign of $a$ tell you?', k[0] < 0 ? [
        ['$a < 0$: the graph is concave down, so the rate of change of $y$ is decreasing.', 'Right: a negative leading coefficient opens the parabola downward.'],
        ['$a < 0$: $y$ is decreasing for every $x$.', 'The sign of $a$ is about concavity. A downward parabola increases, then decreases.'],
        ['$a < 0$: the graph is concave up.', 'A negative $a$ opens the parabola downward: concave down.'],
        ['Nothing: only $b$ and $c$ matter for the shape.', '$a$ sets which way the parabola opens and how wide it is.']
      ] : [
        ['$a > 0$: the graph is concave up, so the rate of change of $y$ is increasing.', 'Right: a positive leading coefficient opens the parabola upward.'],
        ['$a > 0$: $y$ is increasing for every $x$.', 'The sign of $a$ is about concavity. An upward parabola decreases, then increases.'],
        ['$a > 0$: the graph is concave down.', 'A positive $a$ opens the parabola upward: concave up.'],
        ['Nothing: only $b$ and $c$ matter for the shape.', '$a$ sets which way the parabola opens and how wide it is.']
      ], '3.A')
    ];
    var sol = ['QuadReg on the table gives $' + eqTex('quadratic', k) + '$ (constants stored).', 'At $x = ' + x0 + '$: $y \\approx ' + f3(pred) + '$.', '$a ' + (k[0] < 0 ? '< 0$: concave down' : '> 0$: concave up') + '.'];
    return { text: text, steps: steps, solution: sol, fig: { xs: d.xs, ys: d.ys, kind: 'quadratic', k: k, x0: x0 }, values: { xs: d.xs, ys: d.ys, x0: x0, k: k } };
  };
  /* A residual, and what a residual plot says. */
  GEN.residual = function(r){
    var curved = r() < 0.6, xs = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], ys, F, P, guard = 0;
    // data whose residual plot says what the data are: curved data show a pattern, linear data none
    do {
      if(curved){ var a = r.int(8, 20), g = r.pick([1.25, 1.3, 1.35]); ys = xs.map(function(x){ return M.round(a * Math.pow(g, x) + (r() - 0.5) * 2, 1); }); }
      else { var m = r.between(1.5, 4, 2), b0 = r.int(5, 20); ys = xs.map(function(x){ return M.round(m * x + b0 + (r() - 0.5) * 3, 1); }); }
      F = fit('linear', xs, ys); P = pattern(xs, F.res);
    } while(P.pattern !== curved && guard++ < 60);
    var A = M.round(F.k[0], 2), B = M.round(F.k[1], 2), i0 = r.int(1, 8), x0 = xs[i0], y0 = ys[i0], yhat = A * x0 + B, res = y0 - yhat;
    var text = H('<p>A linear model for the data in the table is $y = ' + n(A, 2) + 'x ' + (B < 0 ? '- ' + n(-B, 2) : '+ ' + n(B, 2)) + '$.</p>' + tableHtml(xs, ys, '$x$', '$y$') + '<p>The residual plot for this model is shown.</p>');
    var steps = [
      exactStep('res', 'Find the residual at $x = ' + x0 + '$.', res, [[-res, 'Residual = actual − predicted: $' + n(y0) + ' - ' + n(yhat, 2) + '$, not the other way round.'], [yhat, 'That is the predicted value. The residual is the actual value minus it.']], { practice: '1.A' }),
      choice('fit', 'Is a linear model appropriate for these data?', P.pattern ? [
        ['No: the residuals show a curved pattern (positive, then negative, then positive).', 'Right: a pattern in the residuals means the model misses the shape of the data.'],
        ['Yes: some residuals are positive and some are negative.', 'Every least-squares line has residuals of both signs. Look at how they are arranged.'],
        ['Yes: the residuals are small compared with the data.', 'Small residuals can still follow a pattern, and a pattern means a better model exists.'],
        ['No: a residual plot must have every residual equal to 0.', 'Real data always leave residuals. The question is whether they look random.']
      ] : [
        ['Yes: the residuals scatter above and below 0 with no clear pattern.', 'Right: residuals with no pattern mean the model captures the shape of the data.'],
        ['No: some residuals are positive and some are negative.', 'Every least-squares line has residuals of both signs. Look for a pattern.'],
        ['No: the residuals are not all 0.', 'Real data always leave residuals. The question is whether they look random.'],
        ['No: the residuals show a curved pattern.', 'Look again: the signs change without a clear curve.']
      ], '3.C')
    ];
    var sol = ['Predicted: $' + n(A, 2) + '(' + x0 + ') ' + (B < 0 ? '- ' + n(-B, 2) : '+ ' + n(B, 2)) + ' = ' + n(yhat, 2) + '$. Residual $= ' + n(y0) + ' - ' + n(yhat, 2) + ' = ' + n(res, 2) + '$.',
      P.pattern ? 'The residual plot curves (the signs come in long runs), so the linear model is not appropriate; an exponential model would fit better.' : 'The residual plot shows no pattern, so the linear model is appropriate.'];
    return { text: text, steps: steps, solution: sol, fig: { xs: xs, ys: ys, kind: 'linear', k: [A, B], resid: true }, values: { xs: xs, ys: ys, A: A, B: B, x0: x0, y0: y0, res: res, pattern: P.pattern, curved: curved } };
  };
  /* Linear or exponential from a table: differences against ratios. */
  GEN.choose = function(r){
    var exp = r() < 0.5, xs = [0, 1, 2, 3, 4], ys;
    if(exp){ var a = r.pick([2, 3, 4, 5, 8]) * r.pick([1, 2, 4]), g = r.pick([1.5, 2, 3, 0.5]); ys = xs.map(function(x){ return a * Math.pow(g, x); }); if(g === 0.5) ys = ys.map(function(y){ return y * 16; }); }
    else { var b0 = r.int(2, 30), m = r.pick([-4, -3, 3, 4, 5, 6, 8]); ys = xs.map(function(x){ return b0 + m * x + 20; }); }
    var d = ys[1] - ys[0], q = ys[1] / ys[0];
    var text = H('<p>The table gives values of a function $f$ at equally spaced inputs.</p>' + tableHtml(xs, ys, '$x$', '$f(x)$'));
    var steps = [
      exactStep('d', 'Find $f(1) - f(0)$.', d, [[-d, 'Later minus earlier: $f(1) - f(0)$.']], { practice: '2.A' }),
      exactStep('q', 'Find $\\frac{f(1)}{f(0)}$.', q, [[1 / q, 'Later over earlier: $\\frac{f(1)}{f(0)}$.'], [d, 'That is the difference. The question asks for the ratio.']], { practice: '2.A' }),
      choice('model', 'Which kind of function fits the table exactly?', exp ? [
        ['Exponential: over equal-length input intervals, the outputs have a constant ratio (each is $' + n(q) + '$ times the one before).', 'Right: both halves are named, equal input intervals and constant ratios, with the number.'],
        ['Linear: over equal-length input intervals, the outputs have a constant difference.', 'Check the differences: ' + ys.slice(1).map(function(y, i){ return n(y - ys[i]); }).join(', ') + '. They are not equal.'],
        ['Exponential, because the outputs ' + (q > 1 ? 'grow faster and faster' : 'shrink') + '.', 'True of this table, but the justification needs the constant ratio over equal input intervals, with its value.'],
        ['Quadratic: the differences change.', 'Check the ratios of consecutive outputs: they are all $' + n(q) + '$.']
      ] : [
        ['Linear: over equal-length input intervals, the outputs have a constant difference (each is $' + n(d) + '$ more than the one before).', 'Right: both halves are named, equal input intervals and constant differences, with the number.'],
        ['Exponential: over equal-length input intervals, the outputs have a constant ratio.', 'Check the ratios: ' + ys.slice(1).map(function(y, i){ return n(y / ys[i], 3); }).join(', ') + '. They are not equal.'],
        ['Linear, because the points look like a line.', 'Looks are not a reason. Name the constant difference over equal input intervals.'],
        ['Quadratic: the outputs change.', 'Every nonconstant function\'s outputs change. Here the differences are all $' + n(d) + '$.']
      ], '3.C')
    ];
    var sol = ['Differences: ' + ys.slice(1).map(function(y, i){ return '$' + n(y - ys[i]) + '$'; }).join(', ') + '. Ratios: ' + ys.slice(1).map(function(y, i){ return '$' + n(y / ys[i], 3) + '$'; }).join(', ') + '.',
      exp ? 'The ratios are constant over equal input intervals, so $f$ is exponential: $f(x) = ' + n(ys[0]) + '(' + n(q) + ')^x$.' : 'The differences are constant over equal input intervals, so $f$ is linear: $f(x) = ' + n(d) + 'x + ' + n(ys[0]) + '$.'];
    return { text: text, steps: steps, solution: sol, fig: { xs: xs, ys: ys, plain: true }, values: { xs: xs, ys: ys, exp: exp, d: d, q: q } };
  };

  var KINDS = ['linear', 'exponential', 'quadratic', 'residual', 'choose'];
  var TITLE = { linear: 'Linear regression', exponential: 'Exponential regression', quadratic: 'Quadratic regression', residual: 'Residuals', choose: 'Linear or exponential?' };
  function generate(r, ctx, type){
    var kind = type || ctx.kind;
    if(!GEN[kind]) throw new Error('regression-lab: no problem kind "' + kind + '"');
    var p = GEN[kind](r);
    p.ctx = ctx.id; p.topic = ctx.topic; p.type = kind; p.title = TITLE[kind];
    p.solution = p.solution.map(H);
    return p;
  }

  M.register('regressionLab', {
    MODELS: MODELS, MORDER: MORDER, DATASETS: DATASETS, DORDER: DORDER, KINDS: KINDS, TITLE: TITLE,
    fit: fit, fnOf: fnOf, allowed: allowed, pattern: pattern, eqTex: eqTex, data: data, peval: peval, n: n, f3: f3, generate: generate
  });
})(typeof window !== 'undefined' ? window : globalThis);
