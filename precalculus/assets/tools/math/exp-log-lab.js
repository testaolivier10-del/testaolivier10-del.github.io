/* Exponential and log lab model: ApPrecalcMath.expLogLab (docs/apprecalc-architecture.md, "Tools").
   OWNED BY THIS TOOL ONLY (docs/apprecalc-briefs/t2.md): no other tool edits this
   file, and this tool edits no shared file. Pure functions, no DOM, so the
   validator (scripts/lib/apprecalc-tool-checks/exp-log-lab.mjs) and the test
   (scripts/test/apprecalc-tool-exp-log-lab.test.mjs) run exactly this code.

   Explore
     table(a, m, b, n, h)   rows x = 0, h, ..., n·h of L(x) = a + m x and
                            E(x) = a·b^x, with each step's difference and ratio
     overtake(a, m, b)      the first x > 0 where E passes L (or null)
     log(b, x)              log base b
     rule(kind, b, u, v)    the log rule on numbers: product, quotient, power
                            (v is the exponent k), with both sides
     fit(points)            least squares of log10 y on x: { m, c, a, b, r }
     DATASETS               the semi-log data sets (made from a seeded rng)
   Test yourself: KINDS, generate(rng, ctx, type) -> a problem.
   Text holds TeX between dollar signs; the page renders it (ApPrecalcTex). */
(function(G){
  'use strict';
  var M = G.ApPrecalcMath;
  if(!M) return;

  function n(v){ v = Math.abs(v) < 1e-12 ? 0 : v; return String(+v.toFixed(6)); }
  function log(b, x){ return Math.log(x) / Math.log(b); }
  function table(a, m, b, cnt, h){
    h = h || 1; var rows = [];
    for(var i = 0; i <= cnt; i++){
      var x = i * h, L = a + m * x, E = a * Math.pow(b, x), pL = i ? rows[i - 1] : null;
      rows.push({ x: x, L: L, E: E, dL: pL ? L - pL.L : null, rE: pL && pL.E ? E / pL.E : null, dE: pL ? E - pL.E : null });
    }
    return rows;
  }
  // E(x) - L(x) changes sign once for b > 1 (from E <= L to E > L): find it.
  function overtake(a, m, b){
    var g = function(x){ return a * Math.pow(b, x) - (a + m * x); };
    var prev = 0.01, gp = g(prev);
    for(var x = 0.05; x <= 60; x += 0.05){ var gx = g(x); if(gp <= 0 && gx > 0) return M.root(g, prev, x); prev = x; gp = gx; }
    return null;
  }
  function rule(kind, b, u, v){
    if(kind === 'product') return { lhs: log(b, u * v), parts: [log(b, u), log(b, v)], rhs: log(b, u) + log(b, v), arg: u * v };
    if(kind === 'quotient') return { lhs: log(b, u / v), parts: [log(b, u), log(b, v)], rhs: log(b, u) - log(b, v), arg: u / v };
    return { lhs: log(b, Math.pow(u, v)), parts: [log(b, u)], rhs: v * log(b, u), arg: Math.pow(u, v) };
  }
  function fit(pts){
    var N = pts.length, sx = 0, sy = 0, sxx = 0, sxy = 0, syy = 0;
    pts.forEach(function(p){ var y = Math.log10(p[1]); sx += p[0]; sy += y; sxx += p[0] * p[0]; sxy += p[0] * y; syy += y * y; });
    var m = (N * sxy - sx * sy) / (N * sxx - sx * sx), c = (sy - m * sx) / N;
    var r = (N * sxy - sx * sy) / Math.sqrt((N * sxx - sx * sx) * (N * syy - sy * sy));
    return { m: m, c: c, a: Math.pow(10, c), b: Math.pow(10, m), r: r };
  }
  // Each data set: a model y = a·b^x (or a line) with a few percent of seeded noise.
  function makeSet(id, name, xLabel, yLabel, unit, xs, f, seed, noise){
    var r = M.rng(seed);
    return { id: id, name: name, xLabel: xLabel, yLabel: yLabel, unit: unit,
      pts: xs.map(function(x){ return [x, M.sig(f(x) * (1 + (r() - 0.5) * 2 * noise), 4)]; }) };
  }
  var DATASETS = {
    bacteria: makeSet('bacteria', 'Bacteria in a dish', 'hours', 'cells (thousands)', 'thousand cells', [0, 1, 2, 3, 4, 5, 6, 7, 8], function(x){ return 12 * Math.pow(1.6, x); }, 31, 0.05),
    drug: makeSet('drug', 'Medicine in the blood', 'hours after the dose', 'mg in the blood', 'mg', [0, 1, 2, 3, 4, 5, 6, 8, 10], function(x){ return 400 * Math.pow(0.78, x); }, 47, 0.04),
    savings: makeSet('savings', 'Savings with interest', 'years', 'dollars', 'dollars', [0, 2, 4, 6, 8, 10, 12, 14, 16], function(x){ return 1500 * Math.pow(1.07, x); }, 59, 0.01),
    linear: makeSet('linear', 'A steady (linear) climb', 'minutes', 'meters', 'm', [0, 1, 2, 3, 4, 5, 6, 7, 8], function(x){ return 20 + 15 * x; }, 71, 0.03)
  };
  var DATASET_ORDER = ['bacteria', 'drug', 'savings', 'linear'];

  /* ------------------------------------------------ Test yourself */
  var KINDS = ['table', 'model', 'inverse', 'rules', 'semilog'];
  var TITLE = { table: 'Linear or exponential?', model: 'An exponential model from two points', inverse: 'Exponentials and logs as inverses', rules: 'Log rules with numbers', semilog: 'Reading a semi-log plot' };
  var ABS = 0.001;
  function num(answer, mistakes, d){ return { kind: 'num', cell: M.cell(answer, 0, mistakes || [], ABS), d: d == null ? 0 : d }; }
  function step(o, key, label, practice, extra){ o.key = key; o.label = label; o.practice = practice; if(extra) for(var k in extra) o[k] = extra[k]; return o; }
  function shuffled(r, list){ var a = list.slice(); for(var i = a.length - 1; i > 0; i--){ var j = Math.floor(r() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function choiceOf(r, right, wrongs){
    var all = [right].concat(wrongs), seen = {}, list = [];
    all.forEach(function(o){ if(!seen[o[0]]){ seen[o[0]] = 1; list.push(o); } });
    list = shuffled(r, list);
    var c = 0; list.forEach(function(o, i){ if(o === right) c = i; });
    return { kind: 'choice', options: list.map(function(o){ return o[0]; }), correct: c, why: list.map(function(o){ return o[1]; }) };
  }
  function tbl(xs, ys, yname){
    return '<table class="ell-tbl"><caption class="sr-only">Values of ' + yname + '</caption><thead><tr><th scope="row">$x$</th>' + xs.map(function(x){ return '<td>' + n(x) + '</td>'; }).join('') + '</tr></thead><tbody><tr><th scope="row">$' + yname + '(x)$</th>' + ys.map(function(y){ return '<td>' + n(y) + '</td>'; }).join('') + '</tr></tbody></table>';
  }

  var GEN = {};
  /* 2.2: equal differences or equal ratios over equal input steps */
  var EXPS = [[16, 1.5], [96, 0.5], [625, 0.8], [2, 3], [5, 2], [125, 1.2], [3, 2], [1000, 0.9], [4, 2.5], [64, 0.75]];
  GEN.table = function(r){
    var h = r.pick([1, 1, 2, 5]), x0 = r.pick([0, 0, 1, 2]), xs = [0, 1, 2, 3].map(function(i){ return x0 + i * h; }), lin = r() < 0.5, ys, k;
    if(lin){
      // no output 0 (a ratio would divide by it)
      var a = 0, d = r.pick([3, 4, 5, 6, 7.5, 12, -2, -4, -5, 2.5]), guard = 0;
      do { a = r.int(-10, 40); } while([0, 1, 2, 3, 4].some(function(i){ return a + d * i === 0; }) && guard++ < 50);
      ys = xs.map(function(_, i){ return a + d * i; }); k = d;
    }
    else { var e = r.pick(EXPS); ys = xs.map(function(_, i){ return +(e[0] * Math.pow(e[1], i)).toFixed(6); }); k = e[1]; }
    var nextY = lin ? ys[3] + k : ys[3] * k, nextX = x0 + 4 * h;
    var diffs = ys.slice(1).map(function(y, i){ return +(y - ys[i]).toFixed(6); }), ratios = ys.slice(1).map(function(y, i){ return +(y / ys[i]).toFixed(6); });
    var text = 'The table gives values of a function $g$ at equal steps of $x$.' + tbl(xs, ys, 'g');
    var LIN = 'Linear: over equal steps of $x$ (each ' + n(h) + '), the outputs change by the same amount, $' + (k > 0 ? '+' : '') + n(k) + '$ each step.';
    var EXP = 'Exponential: over equal steps of $x$ (each ' + n(h) + '), the outputs are multiplied by the same factor, $\\times ' + n(k) + '$ each step.';
    var right = lin ? [LIN, 'Right: the differences are all $' + n(k) + '$ and the steps of $x$ are equal.'] : [EXP, 'Right: the ratios are all ' + n(k) + ' and the steps of $x$ are equal.'];
    var wrong = lin ? [['Exponential: over equal steps of $x$, the outputs are multiplied by the same factor, $\\times ' + M.fixed(ratios[0], 2) + '$ each step.', 'The ratios are $' + ratios.map(function(v){ return M.fixed(v, 3); }).join(', ') + '$: not the same. The differences are all $' + n(k) + '$.']]
      : [['Linear: over equal steps of $x$, the outputs change by the same amount, $' + (diffs[0] > 0 ? '+' : '') + n(diffs[0]) + '$ each step.', 'The differences are $' + diffs.map(n).join(', ') + '$: not the same. Try the ratios.']];
    wrong.push([lin ? 'Linear, because the points look like they are on a line.' : 'Exponential, because the outputs ' + (k > 1 ? 'grow faster and faster.' : 'shrink more and more slowly.'),
      'The conclusion is right but the reason earns nothing: name the equal input steps and the constant ' + (lin ? 'difference' : 'ratio') + ', with the numbers.']);
    var steps = [
      step(choiceOf(r, right, wrong), 'type', 'Which model fits, and why?', '2.A'),
      step(num(k, lin ? [{ value: ys[1] / ys[0], why: 'That is a ratio. A linear function has a constant difference: subtract.' }]
        : [{ value: diffs[0], why: 'That is the first difference. An exponential function has a constant ratio: divide one output by the one before it.' }, { value: 1 / k, why: 'Divide each output by the one before it, not the other way round.' }], 3),
        'k', lin ? 'What is the constant difference between outputs?' : 'What is the constant ratio between outputs?', lin ? '1.B' : '1.B'),
      step(num(nextY, lin ? [{ value: ys[3] * ratios[2], why: 'That multiplies by a ratio; this function adds the same amount each step.' }]
        : [{ value: ys[3] + diffs[2], why: 'That adds the last difference. An exponential function multiplies by the same factor each step.' }], 3), 'next',
        'What is $g(' + n(nextX) + ')$?', '1.C')
    ];
    var sol = ['Steps of $x$ are equal (' + n(h) + ' each). Differences: $' + diffs.map(n).join(', ') + '$. Ratios: $' + ratios.map(function(v){ return M.fixed(v, 3); }).join(', ') + '$.',
      lin ? 'The differences are constant, so $g$ is linear with constant difference $' + n(k) + '$ per step.' : 'The ratios are constant, so $g$ is exponential with factor ' + n(k) + ' per step.',
      '$g(' + n(nextX) + ') = ' + n(ys[3]) + (lin ? (k < 0 ? ' - ' + n(-k) : ' + ' + n(k)) : ' \\times ' + n(k)) + ' = ' + n(nextY) + '$.'];
    return { text: text, steps: steps, solution: sol, values: { lin: lin, xs: xs, ys: ys, k: k, next: nextY, h: h } };
  };
  /* 2.5: y = a·b^x from (0, a) and (k, y_k); a prediction (never round b partway) */
  GEN.model = function(r){
    var a = r.pick([20, 50, 80, 120, 200, 500, 1200]), b = r.pick([1.12, 1.25, 1.35, 1.5, 0.85, 0.7, 0.62, 1.08]), k = r.int(3, 6);
    var yk = M.sig(a * Math.pow(b, k) * r.between(0.96, 1.04, 4), 4), B = Math.pow(yk / a, 1 / k), t = k + r.int(2, 4), pred = a * Math.pow(B, t);
    var B2 = Math.round(B * 100) / 100, unit = r.pick([['a culture', 'cells'], ['a town', 'people'], ['an account', 'dollars'], ['a sample', 'grams']]);
    var text = 'An exponential model $y = a \\cdot b^x$ fits ' + unit[0] + ': $y = ' + n(a) + '$ ' + unit[1] + ' at $x = 0$ and $y = ' + n(yk) + '$ ' + unit[1] + ' at $x = ' + k + '$.';
    var steps = [
      step(num(a, [{ value: yk, why: 'The value at $x = 0$ is $a \\cdot b^0 = a$.' }]), 'a', 'What is $a$?', '1.C'),
      step(num(B, [{ value: yk / a, why: 'That is $b^{' + k + '}$, the factor over ' + k + ' steps. Take the ' + k + 'th root: $b = \\left(\\frac{' + n(yk) + '}{' + n(a) + '}\\right)^{1/' + k + '}$.' },
        { value: (yk - a) / k, why: 'That is the average rate of change (a linear slope). An exponential model needs the factor per step.' }], 3), 'b', 'What is $b$? (Three decimal places.)', '1.C'),
      step(num(pred, [{ value: a * Math.pow(B2, t), why: 'You rounded $b$ to ' + n(B2) + ' first. Store the full value of $b$ and round only the final answer.' },
        { value: a * Math.pow(yk / a, t), why: 'Use $b$, the factor for one step, not $\\frac{' + n(yk) + '}{' + n(a) + '}$.' }], 3), 'pred', 'Predict $y$ at $x = ' + t + '$. (Three decimal places.)', '1.C')
    ];
    var sol = ['$a = ' + n(a) + '$, the value at $x = 0$.', '$b^{' + k + '} = \\frac{' + n(yk) + '}{' + n(a) + '}$, so $b = \\left(\\frac{' + n(yk) + '}{' + n(a) + '}\\right)^{1/' + k + '} \\approx ' + M.fixed(B, 3) + '$ (store the full value).',
      '$y(' + t + ') = ' + n(a) + ' \\cdot b^{' + t + '} \\approx ' + M.fixed(pred, 3) + '$ ' + unit[1] + '.'];
    return { text: text, steps: steps, solution: sol, values: { a: a, yk: yk, k: k, t: t, B: B, pred: pred } };
  };
  /* 2.10: a point on y = b^x and its mirror on y = log_b x */
  GEN.inverse = function(r){
    var b = r.pick([2, 3, 4, 5, 10]), k = r.int(-2, 4), N = Math.pow(b, k), j = r.int(-3, 4); if(j === k) j = k + 1;
    var M2 = Math.pow(b, j), Nt = N < 1 ? '\\frac{1}{' + n(1 / N) + '}' : n(N), Mt = M2 < 1 ? '\\frac{1}{' + n(1 / M2) + '}' : n(M2);
    var text = 'The point $(' + k + ', ' + Nt + ')$ is on the graph of $y = ' + b + '^x$.';
    var steps = [
      step(num(N, [{ value: k, why: 'Inverse functions swap inputs and outputs: the $x$-coordinate on $y = \\log_{' + b + '} x$ is the old $y$, ' + Nt + '.' }], Number.isInteger(N) ? 0 : 4), 'lx',
        'On the graph of $y = \\log_{' + b + '} x$, which point matches it? Type its $x$-coordinate.', '2.B'),
      step(num(k, [{ value: N, why: 'The $y$-coordinate on the log graph is the old $x$, the exponent.' }]), 'ly', 'And its $y$-coordinate?', '2.B'),
      step(num(j, [{ value: -j, why: 'Check the sign: ' + (j < 0 ? 'a fraction less than 1 has a negative log.' : 'a number greater than 1 has a positive log here.') },
        { value: M2 / b, why: '$\\log_{' + b + '}$ asks for an exponent: ' + b + ' to what power gives ' + Mt + '?' }]), 'val', 'Evaluate $\\log_{' + b + '} ' + Mt + '$ exactly.', '1.C')
    ];
    var sol = ['$y = \\log_{' + b + '} x$ is the inverse of $y = ' + b + '^x$, so each point $(a, c)$ becomes $(c, a)$: the point $(' + Nt + ', ' + k + ')$.',
      '$\\log_{' + b + '} ' + Mt + ' = ' + j + '$ because $' + b + '^{' + j + '} = ' + Mt + '$.'];
    return { text: text, steps: steps, solution: sol, values: { b: b, k: k, N: N, j: j } };
  };
  /* 2.12: the rules on numbers, with the slips named */
  GEN.rules = function(r){
    var b = r.pick(['b', 'b', '2', '10']), p = r.pick([1.2, 0.7, 2.5, 3, 0.4, 1.5]), q = r.pick([0.3, 2, 1.1, 0.8, 4, 0.6]), m = r.int(2, 4), form = r.pick(['pq', 'qp', 'root']);
    if(p === q) q = q + 0.5;
    var L = '\\log_{' + b + '}', text = 'Suppose $' + L + ' P = ' + n(p) + '$ and $' + L + ' Q = ' + n(q) + '$.';
    var s1 = step(num(m * p, [{ value: Math.pow(p, m), why: 'The power rule brings the exponent to the front: $' + L + ' P^{' + m + '} = ' + m + ' \\cdot ' + L + ' P$, not $(' + L + ' P)^{' + m + '}$.' },
      { value: p + m, why: 'The exponent multiplies the log: $' + m + ' \\cdot ' + L + ' P$.' }], 3), 'pow', 'Evaluate $' + L + ' P^{' + m + '}$.', '1.C');
    var ans, lbl, ms;
    if(form === 'pq'){ ans = m * p + q; lbl = L + '(P^{' + m + '} Q)'; ms = [{ value: m * p * q, why: 'The log of a product is the SUM of the logs, not their product.' }, { value: m * (p + q), why: 'The exponent ' + m + ' belongs to $P$ only.' }]; }
    else if(form === 'qp'){ ans = m * p - q; lbl = L + '\\left(\\frac{P^{' + m + '}}{Q}\\right)'; ms = [{ value: m * p / q, why: 'The log of a quotient is the DIFFERENCE of the logs, not their quotient.' }, { value: q - m * p, why: 'Top minus bottom: $' + L + ' P^{' + m + '} - ' + L + ' Q$.' }]; }
    else { ans = p / 2 + q; lbl = L + '(Q\\sqrt{P})'; ms = [{ value: Math.sqrt(p) + q, why: '$\\sqrt{P} = P^{1/2}$, so its log is $\\frac{1}{2}' + L + ' P$, not $\\sqrt{' + L + ' P}$.' }, { value: p / 2 * q, why: 'The log of a product is the SUM of the logs.' }]; }
    var s2 = step(num(ans, ms, 3), 'comb', 'Evaluate $' + lbl + '$.', '1.C');
    var sol = ['Power rule: $' + L + ' P^{' + m + '} = ' + m + '(' + n(p) + ') = ' + n(m * p) + '$.',
      form === 'pq' ? 'Product rule: $' + lbl + ' = ' + L + ' P^{' + m + '} + ' + L + ' Q = ' + n(m * p) + ' + ' + n(q) + ' = ' + n(ans) + '$.'
        : form === 'qp' ? 'Quotient rule: $' + lbl + ' = ' + L + ' P^{' + m + '} - ' + L + ' Q = ' + n(m * p) + ' - ' + n(q) + ' = ' + n(ans) + '$.'
        : '$\\sqrt{P} = P^{1/2}$: $' + lbl + ' = ' + L + ' Q + \\frac{1}{2}' + L + ' P = ' + n(q) + ' + ' + n(p / 2) + ' = ' + n(ans) + '$.'];
    return { text: text, steps: form === 'root' ? [s2] : [s1, s2], solution: form === 'root' ? sol.slice(1) : sol, values: { p: p, q: q, m: m, form: form, ans: ans } };
  };
  /* 2.15: a line on a semi-log plot gives y = a·b^x */
  GEN.semilog = function(r){
    var c = r.pick([0.4, 0.8, 1.2, 1.5, 2, 2.3]), x1 = r.pick([2, 4, 5, 10]), m = r.pick([0.05, 0.1, 0.15, 0.2, 0.25, -0.1, -0.05, -0.2]), y1 = +(c + m * x1).toFixed(6);
    var text = 'On a semi-log plot ($\\log_{10} y$ on the vertical axis, $x$ on the horizontal), the data lie on the line through $(0, ' + n(c) + ')$ and $(' + x1 + ', ' + n(y1) + ')$.';
    var A = Math.pow(10, c), B = Math.pow(10, m);
    var steps = [
      step(num(m, [{ value: (y1 - c) * x1, why: 'Slope is rise over run: $\\frac{' + n(y1) + ' - ' + n(c) + '}{' + x1 + ' - 0}$.' }, { value: x1 / (y1 - c), why: 'Slope is rise over run, not run over rise.' }], 3), 'm', 'What is the slope of the line?', '1.C'),
      step(num(B, [{ value: m, why: 'The slope is $\\log_{10} b$, not $b$. Undo the log: $b = 10^{' + n(m) + '}$.' }, { value: Math.exp(m), why: 'The plot uses base 10, so $b = 10^{\\text{slope}}$, not $e^{\\text{slope}}$.' }], 3), 'b',
        'The model is $y = a \\cdot b^x$. What is $b$? (Three decimal places.)', '1.C'),
      step(num(A, [{ value: c, why: 'The intercept is $\\log_{10} a$. Undo the log: $a = 10^{' + n(c) + '}$.' }], 3), 'a', 'What is $a$? (Three decimal places.)', '1.C')
    ];
    var sol = ['On a semi-log plot $\\log_{10} y = \\log_{10} a + x \\log_{10} b$, a line with slope $\\log_{10} b$ and intercept $\\log_{10} a$.',
      'Slope $= \\frac{' + n(y1) + ' - ' + n(c) + '}{' + x1 + '} = ' + n(m) + '$, so $b = 10^{' + n(m) + '} \\approx ' + M.fixed(B, 3) + '$.', 'Intercept $' + n(c) + '$, so $a = 10^{' + n(c) + '} \\approx ' + M.fixed(A, 3) + '$.'];
    return { text: text, steps: steps, solution: sol, values: { c: c, m: m, x1: x1, y1: y1, a: A, b: B } };
  };

  function generate(r, ctx, type){
    var list = ctx.types || [ctx.kind || ctx.id], t = type && list.indexOf(type) > -1 ? type : list[0];
    if(!GEN[t]) throw new Error('exp-log-lab: unknown kind ' + t);
    var p = GEN[t](r, ctx);
    p.ctx = ctx.id; p.type = t; p.topic = ctx.topic; p.title = TITLE[t];
    return p;
  }

  M.register('expLogLab', {
    n: n, log: log, table: table, overtake: overtake, rule: rule, fit: fit,
    DATASETS: DATASETS, DATASET_ORDER: DATASET_ORDER, KINDS: KINDS, TITLE: TITLE, GEN: GEN, generate: generate
  });
})(typeof window !== 'undefined' ? window : globalThis);
