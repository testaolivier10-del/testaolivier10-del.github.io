/* Rate of change model: ApPrecalcMath.rateOfChange (docs/apprecalc-architecture.md, "Tools").
   OWNED BY THIS TOOL ONLY (docs/apprecalc-briefs/t1.md): no other tool edits this
   file, and this tool edits no shared file. Pure functions, no DOM, so the
   validator (scripts/lib/apprecalc-tool-checks/rate-of-change.mjs) and the test
   (scripts/test/apprecalc-tool-rate-of-change.test.mjs) run exactly this code.

   Explore: FUNCS (in ORDER), each a context with its function, units and
   the sign of its concavity (conc(x): +1 up, -1 down, 0 a line).
     aroc(f, a, b)               (f(b) - f(a)) / (b - a), the secant's slope
     secants(f, a, d, n)         n secants over equal intervals of width d
     trend(rates)                'up' | 'down' | 'same' | 'mixed'
     concOn(F, p, q)             +1, -1, 0 on [p, q], NaN when it changes
     estimate(f, p, q, x0)       the secant estimate, the true value, over or under
   Words in precalculus terms only: "the rate of change of f is increasing",
   "concave up"; never the calculus phrasing.
   Test yourself: generate(rng, ctx, type) for the kinds in KINDS. */
(function(G){
  'use strict';
  var M = G.ApPrecalcMath;
  if(!M) return;
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
  /* A number in TeX: an integer, a fraction with a small denominator, else three decimals. */
  function nt(x){
    if(Math.abs(x - Math.round(x)) < 1e-9) return String(Math.round(x));
    for(var d = 2; d <= 12; d++){ var k = Math.round(x * d); if(Math.abs(k / d - x) < 1e-9) return (k < 0 ? '-' : '') + '\\frac{' + Math.abs(k) + '}{' + d + '}'; }
    return n(x);
  }

  /* ------------------------------------------------------- contexts */
  var FUNCS = {
    taxi: { name: 'Taxi fare', f: function(x){ return 2.5 + 1.8 * x; }, conc: function(){ return 0; }, dom: [0, 10], tex: 'C(m) = 2.5 + 1.8m',
      fn: 'C', x: 'm', xu: 'mile', xus: 'miles', yu: 'dollars', rate: 'dollars per mile', story: 'The fare $C$, in dollars, for a ride of $m$ miles.', start: 1, d: 2, nn: 3 },
    ball: { name: 'Thrown ball', f: function(x){ return 1.5 + 19.6 * x - 4.9 * x * x; }, conc: function(){ return -1; }, dom: [0, 4], tex: 'h(t) = 1.5 + 19.6t - 4.9t^2',
      fn: 'h', x: 't', xu: 'second', xus: 'seconds', yu: 'meters', rate: 'meters per second', story: 'The height $h$, in meters, of a ball $t$ seconds after it is thrown up.', start: 0, d: 1, nn: 4 },
    cubic: { name: 'Water level', f: function(x){ return x * x * x - 6 * x * x + 9 * x + 2; }, conc: function(x){ return x < 2 ? -1 : x > 2 ? 1 : 0; }, dom: [0, 4.5], tex: 'W(t) = t^3 - 6t^2 + 9t + 2',
      fn: 'W', x: 't', xu: 'hour', xus: 'hours', yu: 'feet', rate: 'feet per hour', story: 'The water level $W$, in feet, in a canal $t$ hours after noon.', start: 0, d: 1, nn: 4 },
    cooling: { name: 'Cooling tea', f: function(x){ return 20 + 60 / (x + 1); }, conc: function(){ return 1; }, dom: [0, 10], tex: 'T(t) = 20 + \\frac{60}{t + 1}',
      fn: 'T', x: 't', xu: 'minute', xus: 'minutes', yu: 'degrees Celsius', rate: 'degrees Celsius per minute', story: 'The temperature $T$, in degrees Celsius, of tea $t$ minutes after it is poured.', start: 0, d: 2, nn: 4 },
    growth: { name: 'Bacteria', f: function(x){ return 50 * Math.pow(1.3, x); }, conc: function(){ return 1; }, dom: [0, 10], tex: 'B(t) = 50(1.3)^t',
      fn: 'B', x: 't', xu: 'hour', xus: 'hours', yu: 'thousand cells', rate: 'thousand cells per hour', story: 'The number of bacteria $B$, in thousands, $t$ hours after a culture starts.', start: 0, d: 2, nn: 4 },
    learning: { name: 'Typing speed', f: function(x){ return 20 + 15 * Math.log(x + 1); }, conc: function(){ return -1; }, dom: [0, 12], tex: 'S(w) = 20 + 15\\ln(w + 1)',
      fn: 'S', x: 'w', xu: 'week', xus: 'weeks', yu: 'words per minute', rate: 'words per minute per week', story: 'A student\'s typing speed $S$, in words per minute, after $w$ weeks of practice.', start: 0, d: 2, nn: 4 }
  };
  var ORDER = ['taxi', 'ball', 'cubic', 'cooling', 'growth', 'learning'];

  function aroc(f, a, b){ return (f(b) - f(a)) / (b - a); }
  function secants(f, a, d, k){
    var out = [];
    for(var i = 0; i < k; i++){ var x0 = a + i * d, x1 = x0 + d; out.push({ a: x0, b: x1, fa: f(x0), fb: f(x1), m: aroc(f, x0, x1) }); }
    return out;
  }
  /* Rates over consecutive equal intervals: rising, falling, constant or mixed. */
  function trend(rates, tol){
    tol = tol == null ? 1e-9 : tol;
    var up = 0, dn = 0;
    for(var i = 1; i < rates.length; i++){ var dd = rates[i] - rates[i - 1]; if(dd > tol * Math.max(1, Math.abs(rates[i]))) up++; else if(dd < -tol * Math.max(1, Math.abs(rates[i]))) dn++; }
    return up && dn ? 'mixed' : up ? 'up' : dn ? 'down' : 'same';
  }
  /* The sign of the concavity of F on [p, q]: NaN when it changes inside. */
  function concOn(F, p, q){
    var s = null;
    for(var i = 0; i <= 40; i++){
      var x = p + (q - p) * i / 40, c = F.conc(x);
      if(i > 0 && i < 40 && c === 0 && F.conc(x - 1e-6) !== F.conc(x + 1e-6)) return NaN;
      if(c === 0) continue;
      if(s === null) s = c; else if(c !== s) return NaN;
    }
    return s === null ? 0 : s;
  }
  function estimate(f, p, q, x0){
    var m = aroc(f, p, q), est = f(p) + m * (x0 - p), tr = f(x0);
    return { m: m, est: est, true: tr, gap: est - tr, over: est > tr + 1e-12, under: est < tr - 1e-12 };
  }
  /* Sentences the Q2 rubric accepts. */
  function arocSentence(F, a, b){
    var m = aroc(F.f, a, b), A = n(a, 2), B = n(b, 2);
    return 'The average rate of change of $' + F.fn + '$ on $[' + A + ', ' + B + ']$ is $\\frac{' + F.fn + '(' + B + ') - ' + F.fn + '(' + A + ')}{' + B + ' - ' + A + '} \\approx ' + n(m, 3) + '$ ' + F.rate +
      ', the slope of the secant line through $(' + A + ', ' + F.fn + '(' + A + '))$ and $(' + B + ', ' + F.fn + '(' + B + '))$.';
  }
  function trendSentence(F, tr, a, b){
    var I = 'on $[' + n(a, 2) + ', ' + n(b, 2) + ']$';
    if(tr === 'same') return 'The average rates over equal intervals are all the same, so the rate of change of $' + F.fn + '$ is constant ' + I + ': the graph is a line, neither concave up nor concave down.';
    if(tr === 'up') return 'The average rates over equal intervals increase, so the rate of change of $' + F.fn + '$ is increasing ' + I + ' and the graph of $' + F.fn + '$ is concave up there.';
    if(tr === 'down') return 'The average rates over equal intervals decrease, so the rate of change of $' + F.fn + '$ is decreasing ' + I + ' and the graph of $' + F.fn + '$ is concave down there.';
    return 'The average rates go up and down ' + I + ': the concavity of $' + F.fn + '$ changes inside this interval.';
  }

  /* ------------------------------------------------------- the drill */
  function distinct(list, pool){
    var seen = [], spare = (pool || []).slice();
    return list.map(function(o){
      while(seen.indexOf(o[0]) > -1 && spare.length) o = spare.shift();
      seen.push(o[0]); return o;
    });
  }
  function choice(key, label, list, practice){
    return { key: key, kind: 'choice', label: H(label), options: list.map(function(o){ return optHtml(o[0]); }), why: list.map(function(o){ return H(o[1]); }), correct: 0, practice: practice || '3.C' };
  }
  function numStep(key, label, answer, mistakes, o){
    o = o || {};
    var whole = Math.abs(answer - Math.round(answer)) < 1e-9;
    return { key: key, kind: 'num', label: H(label), unit: o.unit || '', practice: o.practice || '1.A', d: whole ? 0 : 3,
      hint: whole ? '' : 'Exact (like 7/2) or to three decimal places.',
      cell: M.cell(answer, 6e-4, (mistakes || []).map(function(m){ return { value: m[0], why: H(m[1]) }; }), 6e-4) };
  }
  function polyTex(c, v){
    var deg = c.length - 1, out = '';
    c.forEach(function(k, i){
      var p = deg - i;
      if(Math.abs(k) < 1e-12) return;
      var a = Math.abs(k), s = k < 0 ? (out ? ' - ' : '-') : (out ? ' + ' : '');
      out += s + (a === 1 && p ? '' : nt(a)) + (p ? v + (p > 1 ? '^{' + p + '}' : '') : '');
    });
    return out || '0';
  }
  function peval(c, x){ return c.reduce(function(s, k){ return s * x + k; }, 0); }
  function tableHtml(xs, ys, xl, yl){
    return '<table class="bt-table rc-dtab"><thead><tr><th scope="row">$' + xl + '$</th>' + xs.map(function(x){ return '<td>' + n(x) + '</td>'; }).join('') + '</tr></thead><tbody><tr><th scope="row">$' + yl + '$</th>' + ys.map(function(y){ return '<td>' + n(y) + '</td>'; }).join('') + '</tr></tbody></table>';
  }
  /* A context for a polynomial problem: whole-number values on whole inputs. */
  var STORIES = [
    { fn: 'P', x: 't', what: '$P(t)$ is the number of visitors, in hundreds, at a park $t$ hours after it opens', rate: 'hundred visitors per hour', yu: 'hundred visitors' },
    { fn: 'h', x: 't', what: '$h(t)$ is the height, in feet, of a drone $t$ seconds after it starts a maneuver', rate: 'feet per second', yu: 'feet' },
    { fn: 'G', x: 'x', what: '$G(x)$ is a shop\'s weekly profit, in hundreds of dollars, when it prices a game $x$ dollars above cost', rate: 'hundred dollars per dollar', yu: 'hundred dollars' },
    { fn: 'V', x: 't', what: '$V(t)$ is the volume, in liters, of water in a tank $t$ minutes after a valve opens', rate: 'liters per minute', yu: 'liters' }
  ];
  /* "a + m(x - p)" with the sign of m written once. */
  function lineTex(y0, m, x, p){ return n(y0) + (m < 0 ? ' - ' + nt(-m) : ' + ' + nt(m)) + '(' + x + ' - ' + p + ')'; }
  var GEN = {};

  /* The average rate of change on an interval, as a secant slope. */
  GEN.aroc = function(r){
    var S = r.pick(STORIES), c = [r.pick([-3, -2, -1, 1, 2, 3]), r.int(-8, 12), r.int(5, 30)];
    if(r() < 0.35) c = [r.pick([1, -1]), r.int(-3, 3), r.int(-6, 10), r.int(10, 40)];
    var a = r.int(0, 3), b = a + r.int(2, 4), low = Infinity;
    for(var t = 0; t <= b + 1; t++) low = Math.min(low, peval(c, t));
    if(low < 5) c[c.length - 1] += 5 - low;
    var f = function(x){ return peval(c, x); }, m = aroc(f, a, b);
    var asTable = r() < 0.5, xs = [], ys = [];
    for(var x = 0; x <= b + 1; x++){ xs.push(x); ys.push(f(x)); }
    var text = H('<p>' + S.what + '.</p>' + (asTable ? '<p>Selected values are in the table.</p>' + tableHtml(xs, ys, S.x, S.fn + '(' + S.x + ')') : '<p>$' + S.fn + '(' + S.x + ') = ' + polyTex(c, S.x) + '$.</p>'));
    var F = S.fn, I = '[' + a + ', ' + b + ']';
    var steps = [
      numStep('m', 'Find the average rate of change of $' + F + '$ on $' + I + '$.', m, [
        [f(b) - f(a), 'Divide by the length of the interval: $\\frac{' + F + '(' + b + ') - ' + F + '(' + a + ')}{' + b + ' - ' + a + '}$.'],
        [b !== 0 ? f(b) / b : NaN, 'That is the slope of the line through $(0, 0)$ and $(' + b + ', ' + F + '(' + b + '))$, and $(0, 0)$ is not on the graph. Use the two endpoints of the interval.'],
        [(b - a) / (f(b) - f(a)), 'Outputs over inputs: the change in $' + F + '$ goes on top.'],
        [-m, 'Subtract in the same order on top and bottom: $' + F + '(' + b + ') - ' + F + '(' + a + ')$ over $' + b + ' - ' + a + '$.']
      ], { unit: S.rate, practice: '1.A' }),
      choice('means', 'Which statement interprets this value?', distinct([
        ['From $' + S.x + ' = ' + a + '$ to $' + S.x + ' = ' + b + '$, $' + F + '$ changes by an average of $' + nt(m) + '$ ' + S.rate + '.', 'Right: an average rate of change is the change in the output per unit of input, over the whole interval. It is the slope of the secant line through $(' + a + ', ' + F + '(' + a + '))$ and $(' + b + ', ' + F + '(' + b + '))$.'],
        ['At the moment $' + S.x + ' = ' + b + '$, $' + F + '$ is changing by exactly $' + nt(m) + '$ ' + S.rate + '.', 'An average rate describes the whole interval $' + I + '$, not one moment. The rate at one input can differ from the average.'],
        ['$' + F + '(' + b + ') = ' + nt(m) + '$ ' + S.yu + '.', 'That reads the rate as an output value. $' + F + '(' + b + ') = ' + n(f(b)) + '$; the rate is the change per unit of input.'],
        ['From $' + S.x + ' = ' + a + '$ to $' + S.x + ' = ' + b + '$, $' + F + '$ changes by a total of $' + nt(m) + '$ ' + S.yu + '.', 'The total change is $' + F + '(' + b + ') - ' + F + '(' + a + ') = ' + n(f(b) - f(a)) + '$. The rate divides it by the ' + (b - a) + ' units of input.']
      ], [['$' + F + '$ is increasing on $' + I + '$.', 'An average rate does not say what happens inside the interval: the function can go up and down in between.']]), '3.B')
    ];
    var sol = ['$' + F + '(' + a + ') = ' + n(f(a)) + '$ and $' + F + '(' + b + ') = ' + n(f(b)) + '$.',
      'Average rate of change $= \\frac{' + F + '(' + b + ') - ' + F + '(' + a + ')}{' + b + ' - ' + a + '} = \\frac{' + n(f(b) - f(a)) + '}{' + (b - a) + '} = ' + nt(m) + '$ ' + S.rate + '.',
      'It is the slope of the secant line through $(' + a + ', ' + n(f(a)) + ')$ and $(' + b + ', ' + n(f(b)) + ')$.'];
    return { text: text, steps: steps, solution: sol, fig: { c: c, a: a, b: b, dom: [0, b + 1], fn: F, x: S.x, table: asTable ? [xs, ys] : null }, values: { c: c, a: a, b: b, m: m } };
  };

  /* Estimate on the secant line, then over or under from concavity (Q2). */
  GEN.estimate = function(r){
    var S = r.pick(STORIES), up = r() < 0.5, inc = r() < 0.5;
    // a quadratic with the chosen concavity, monotone on [p, q]
    var A = up ? r.pick([1, 2, 3]) : -r.pick([1, 2, 3]), p = r.int(1, 4), q = p + r.pick([2, 4]);
    var vtx = inc === up ? p - r.int(1, 3) : q + r.int(1, 3);   // vertex outside [p, q] on the side that makes f rise (or fall)
    // f = A(x - vtx)^2 + K, lifted so every value on the picture is positive
    var lo = Math.max(0, p - 2), hi = q + 2, low = Math.min(A * (lo - vtx) * (lo - vtx), A * (hi - vtx) * (hi - vtx), 0);
    var K = r.int(10, 40) - low, c = [A, -2 * A * vtx, A * vtx * vtx + K];
    var f = function(x){ return peval(c, x); }, x0 = p + (q - p) / 2 + (r() < 0.5 ? 0 : (q - p) / 4), E = estimate(f, p, q, x0), F = S.fn;
    var text = H('<p>' + S.what + ', where $' + F + '(' + S.x + ') = ' + polyTex(c, S.x) + '$.</p><p>Use the secant line through $(' + p + ', ' + F + '(' + p + '))$ and $(' + q + ', ' + F + '(' + q + '))$ to estimate $' + F + '(' + n(x0) + ')$.</p>');
    var conc = up ? 'concave up' : 'concave down', rel = up ? 'below' : 'above';
    var steps = [
      numStep('m', 'Find the slope of the secant line: the average rate of change of $' + F + '$ on $[' + p + ', ' + q + ']$.', E.m, [[f(q) - f(p), 'Divide by the length of the interval, $' + q + ' - ' + p + ' = ' + (q - p) + '$.'], [f(q) / q, 'That line goes through $(0, 0)$, which is not on the graph. Use the points at $' + S.x + ' = ' + p + '$ and $' + S.x + ' = ' + q + '$.']], { unit: S.rate, practice: '1.A' }),
      numStep('est', 'Estimate $' + F + '(' + n(x0) + ')$ with the secant line.', E.est, [
        [f(p) + E.m * x0, 'The secant line passes through $(' + p + ', ' + n(f(p)) + ')$: use $' + lineTex(f(p), E.m, S.x, p) + '$, not $' + nt(E.m) + S.x + '$ added on.'],
        [f(q) + E.m * (x0 - p), 'Pair the point with its own input: $' + F + '(' + p + ') + m(' + S.x + ' - ' + p + ')$, or $' + F + '(' + q + ') + m(' + S.x + ' - ' + q + ')$.'],
        [E.true, 'That is the value of $' + F + '$ itself. The question asks for the value on the secant line.']
      ], { unit: S.yu, practice: '2.B' }),
      choice('ou', 'Is the estimate an overestimate or an underestimate of $' + F + '(' + n(x0) + ')$?', [
        [(up ? 'An overestimate' : 'An underestimate') + ': $' + F + '$ is ' + conc + ' on $[' + p + ', ' + q + ']$, so the graph of $' + F + '$ lies ' + rel + ' the secant line there.', 'Right: the reason names the concavity on the interval and where the graph is compared with the secant line.'],
        [(up ? 'An underestimate' : 'An overestimate') + ': $' + F + '$ is ' + conc + ' on $[' + p + ', ' + q + ']$, so the graph lies ' + (up ? 'above' : 'below') + ' the secant line.', 'Check the picture of a ' + (up ? 'bowl (concave up): the curve sags below' : 'hill (concave down): the curve bulges above') + ' the chord joining two of its points.'],
        [(inc ? 'An underestimate' : 'An overestimate') + ': $' + F + '$ is ' + (inc ? 'increasing' : 'decreasing') + ' on $[' + p + ', ' + q + ']$.', 'Whether $' + F + '$ goes up or down does not decide it. Compare the curve with the secant line: that is concavity.'],
        ['Neither: a secant line gives the exact value.', 'A secant line meets the curve only at its two ends here; in between, the ' + conc + ' graph lies ' + rel + ' it.']
      ], '3.C')
    ];
    var sol = ['The secant line has slope $\\frac{' + F + '(' + q + ') - ' + F + '(' + p + ')}{' + q + ' - ' + p + '} = \\frac{' + n(f(q)) + ' - ' + n(f(p)) + '}{' + (q - p) + '} = ' + nt(E.m) + '$.',
      'On that line, $' + F + '(' + n(x0) + ') \\approx ' + lineTex(f(p), E.m, n(x0), p) + ' = ' + nt(E.est) + '$.',
      '$' + F + '$ is ' + conc + ' on $[' + p + ', ' + q + ']$ (the rate of change of $' + F + '$ is ' + (up ? 'increasing' : 'decreasing') + '), so the graph lies ' + rel + ' the secant line and the estimate is an ' + (up ? 'overestimate' : 'underestimate') + ' (the true value is $' + nt(E.true) + '$).'];
    return { text: text, steps: steps, solution: sol, fig: { c: c, p: p, q: q, x0: x0, dom: [Math.max(0, p - 2), q + 2], fn: F, x: S.x }, values: { c: c, p: p, q: q, x0: x0, E: E, up: up, inc: inc } };
  };

  /* Concavity from a table: rates over equal intervals. */
  GEN.concavity = function(r){
    var S = r.pick(STORIES), up = r() < 0.5, inc = r() < 0.5, w = r.pick([1, 2, 5]), x0 = r.pick([0, 1, 2]) * w;
    // four rates over equal intervals: rising (concave up) or falling, all positive (f increasing) or all negative
    var mags = [r.int(1, 4)];
    for(var i = 1; i < 4; i++) mags.push(mags[i - 1] + r.int(1, 3));
    var rates = up ? (inc ? mags : mags.slice().reverse().map(function(v){ return -v; })) : (inc ? mags.slice().reverse() : mags.map(function(v){ return -v; }));
    var xs = [x0], ys = [r.int(10, 40) + (inc ? 0 : mags.reduce(function(t, v){ return t + v; }, 0) * w)];
    for(var k = 0; k < 4; k++){ xs.push(xs[k] + w); ys.push(ys[k] + rates[k] * w); }
    var rr = secants(function(x){ return ys[xs.indexOf(x)]; }, x0, w, 4).map(function(s){ return s.m; });
    var tr = trend(rr), F = S.fn;
    var text = H('<p>' + S.what + '. Selected values are in the table, at equal steps of $' + w + '$.</p>' + tableHtml(xs, ys, S.x, F + '(' + S.x + ')'));
    var steps = [
      numStep('r1', 'The average rate of change of $' + F + '$ on $[' + xs[0] + ', ' + xs[1] + ']$.', rr[0], [[ys[1] - ys[0], 'Divide by the length of the interval, $' + w + '$.']], { unit: S.rate, practice: '2.A' }),
      numStep('r4', 'The average rate of change of $' + F + '$ on $[' + xs[3] + ', ' + xs[4] + ']$.', rr[3], [[ys[4] - ys[3], 'Divide by the length of the interval, $' + w + '$.'], [(ys[4] - ys[0]) / (4 * w), 'That is the rate over the whole table. This asks for the last interval only.']], { unit: S.rate, practice: '2.A' }),
      choice('conc', 'What do the rates over these equal intervals say about the graph of $' + F + '$ on $[' + xs[0] + ', ' + xs[4] + ']$?', [
        [tr === 'up' ? 'Concave up: the average rates of change increase from each interval to the next.' : 'Concave down: the average rates of change decrease from each interval to the next.', 'Right: over equal intervals, rates that ' + (tr === 'up' ? 'increase mean concave up' : 'decrease mean concave down') + ' (' + rr.map(nt).join(', ') + ').'],
        [tr === 'up' ? 'Concave down: the average rates of change decrease from each interval to the next.' : 'Concave up: the average rates of change increase from each interval to the next.', 'List the four rates in order: ' + rr.map(nt).join(', ') + '. Do they go up or down?'],
        [(inc ? 'Concave up' : 'Concave down') + ': $' + F + '$ is ' + (inc ? 'increasing' : 'decreasing') + '.', 'That is about $' + F + '$ going up or down. Concavity is about how the rate of change changes.'],
        ['Neither: the input values are equally spaced.', 'Equal spacing is what lets you compare the rates; it does not decide the concavity.']
      ], '3.C')
    ];
    var sol = ['Over each interval of length $' + w + '$ the average rates of change are ' + rr.map(function(v){ return '$' + nt(v) + '$'; }).join(', ') + ' ' + S.rate + '.',
      'They ' + (tr === 'up' ? 'increase' : 'decrease') + ', so the rate of change of $' + F + '$ is ' + (tr === 'up' ? 'increasing' : 'decreasing') + ' and the graph of $' + F + '$ is concave ' + (tr === 'up' ? 'up' : 'down') + ' on $[' + xs[0] + ', ' + xs[4] + ']$.'];
    return { text: text, steps: steps, solution: sol, fig: { pts: xs.map(function(x, i){ return [x, ys[i]]; }), fn: F, x: S.x }, values: { xs: xs, ys: ys, rates: rr, trend: tr, inc: inc } };
  };

  /* Quadratics: rates over equal intervals change by a constant amount. */
  GEN.quadratic = function(r){
    var S = r.pick(STORIES), a = r.pick([-3, -2, -1, 1, 2, 3]), b = r.int(-6, 6), c0 = r.int(0, 20), w = r.pick([1, 2]), x0 = r.int(0, 2);
    var c = [a, b, c0], f = function(x){ return peval(c, x); }, sc = secants(f, x0, w, 3), rr = sc.map(function(s){ return s.m; }), dd = rr[1] - rr[0], F = S.fn;
    var text = H('<p>Let $' + F + '(' + S.x + ') = ' + polyTex(c, S.x) + '$. Look at the average rates of change of $' + F + '$ over the equal intervals $[' + x0 + ', ' + (x0 + w) + ']$, $[' + (x0 + w) + ', ' + (x0 + 2 * w) + ']$ and $[' + (x0 + 2 * w) + ', ' + (x0 + 3 * w) + ']$.</p>');
    var steps = [
      numStep('r1', 'The average rate of change on $[' + x0 + ', ' + (x0 + w) + ']$.', rr[0], [[f(x0 + w) - f(x0), 'Divide by the length of the interval, $' + w + '$.']], { practice: '1.A' }),
      numStep('r2', 'The average rate of change on $[' + (x0 + w) + ', ' + (x0 + 2 * w) + ']$.', rr[1], [[f(x0 + 2 * w) - f(x0 + w), 'Divide by the length of the interval, $' + w + '$.']], { practice: '1.A' }),
      numStep('dd', 'By how much does the average rate of change go up from one interval to the next?', dd, [[-dd, 'Subtract the earlier rate from the later one: $' + nt(rr[1]) + ' - (' + nt(rr[0]) + ')$.'], [2 * a, 'That is the change for intervals of length 1. Here each interval has length ' + w + '.']], { practice: '2.A' }),
      choice('why', 'Which is true for every quadratic function over consecutive equal intervals?', [
        ['The average rates of change change by the same amount each time, so they form a linear pattern.', 'Right: for $a' + S.x + '^2 + b' + S.x + ' + c$ and intervals of length $w$, each rate is $2aw$ more than the one before (here $2(' + a + ')(' + w + ') = ' + nt(dd) + '$).'],
        ['The average rates of change are all equal.', 'Equal rates over equal intervals describe a linear function.'],
        ['The average rates of change grow by the same factor each time.', 'A constant ratio of outputs over equal intervals describes an exponential function.'],
        ['The average rates of change are always increasing.', 'Only when $a > 0$ (concave up). Here $a = ' + a + '$' + (a < 0 ? ', so they decrease.' : '.')]
      ], '3.A')
    ];
    var sol = ['$' + F + '(' + x0 + ') = ' + n(f(x0)) + '$, $' + F + '(' + (x0 + w) + ') = ' + n(f(x0 + w)) + '$, $' + F + '(' + (x0 + 2 * w) + ') = ' + n(f(x0 + 2 * w)) + '$, $' + F + '(' + (x0 + 3 * w) + ') = ' + n(f(x0 + 3 * w)) + '$.',
      'The rates are $' + rr.map(nt).join('$, $') + '$: each is $' + nt(dd) + '$ more than the one before.',
      'For a quadratic, the rates over consecutive equal intervals change by a constant amount ($2aw = 2(' + a + ')(' + w + ') = ' + nt(2 * a * w) + '$), so the graph is ' + (a > 0 ? 'concave up' : 'concave down') + ' everywhere.'];
    return { text: text, steps: steps, solution: sol, fig: { c: c, secs: sc, dom: [x0 - 0.5, x0 + 3 * w + 0.5], fn: F, x: S.x }, values: { c: c, x0: x0, w: w, rates: rr, dd: dd } };
  };

  var KINDS = ['aroc', 'estimate', 'concavity', 'quadratic'];
  var TITLE = { aroc: 'Average rate of change', estimate: 'Estimate with a secant line', concavity: 'Concavity from a table', quadratic: 'Rates of change of a quadratic' };
  function generate(r, ctx, type){
    var kind = type || ctx.kind;
    if(!GEN[kind]) throw new Error('rate-of-change: no problem kind "' + kind + '"');
    var p = GEN[kind](r);
    p.ctx = ctx.id; p.topic = ctx.topic; p.type = kind; p.title = TITLE[kind];
    p.solution = p.solution.map(H);
    return p;
  }

  M.register('rateOfChange', {
    FUNCS: FUNCS, ORDER: ORDER, KINDS: KINDS, TITLE: TITLE,
    aroc: aroc, secants: secants, trend: trend, concOn: concOn, estimate: estimate, arocSentence: arocSentence, trendSentence: trendSentence,
    n: n, nt: nt, peval: peval, polyTex: polyTex, generate: generate
  });
})(typeof window !== 'undefined' ? window : globalThis);
