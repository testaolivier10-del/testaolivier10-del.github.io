/* Symbolic steps model: ApPrecalcMath.symbolicSteps (docs/apprecalc-architecture.md, "Tools").
   OWNED BY THIS TOOL ONLY (docs/apprecalc-briefs/t2.md): no other tool edits this
   file, and this tool edits no shared file. Pure functions, no DOM, so the
   validator (scripts/lib/apprecalc-tool-checks/symbolic-steps.mjs) and the test
   (scripts/test/apprecalc-tool-symbolic-steps.test.mjs) run exactly this code.

   The Q4 drill (docs/apprecalc-authoring-guide.md, "Q4"): rewrite to a single
   power, a single logarithm, a single sine or tangent; solve an exponential
   or logarithmic equation (rejecting what the domain forbids); an equation
   quadratic in e^x (rejecting the impossible root); inverse trig in its
   principal range; every solution of a trig equation in [0, 2π).
   A single-term answer is asked for by its inside: "the expression is
   ln(B); type B", so the form is a single term by construction and B is
   graded by value on the problem's domain (ApPrecalcExpr, domain-aware).

     KINDS, TITLE, generate(rng, ctx, type) -> problem
       problem.values  the parameters (the validator rebuilds every key from them)
       problem.fig     what the page draws: { kind: 'trig'|'quad'|'circle', ... }
     compareForms(a, b, window) -> { pieces: [{ a, b, s }] } for Explore:
       where two expressions are equal, differ, or only one is defined
     EXAMPLES   pairs for Explore
   Text holds TeX between dollar signs; the page renders it (ApPrecalcTex). */
(function(G){
  'use strict';
  var M = G.ApPrecalcMath;
  if(!M) return;
  function E(){ return G.ApPrecalcExpr; }

  /* ------------------------------------------------ exact values */
  // an angle k·π/d as TeX and as typed
  function gcd(a, b){ a = Math.abs(a); b = Math.abs(b); while(b){ var t = a % b; a = b; b = t; } return a || 1; }
  function ang(k, d){
    var g = gcd(k, d); k /= g; d /= g;
    var v = k * Math.PI / d;
    if(k === 0) return { v: 0, t: '0', s: '0' };
    var sg = k < 0 ? '-' : '', a = Math.abs(k);
    var t = d === 1 ? sg + (a === 1 ? '' : a) + '\\pi' : sg + '\\frac{' + (a === 1 ? '' : a) + '\\pi}{' + d + '}';
    var s = d === 1 ? sg + (a === 1 ? '' : a) + 'pi' : sg + (a === 1 ? '' : a) + 'pi/' + d;
    return { v: v, t: t, s: s, k: k, d: d };
  }
  // trig values: name -> { v, t (TeX), s (typed) }
  var VAL = {
    '0': { v: 0, t: '0', s: '0' }, '1': { v: 1, t: '1', s: '1' }, '-1': { v: -1, t: '-1', s: '-1' },
    'h': { v: 0.5, t: '\\frac{1}{2}', s: '1/2' }, '-h': { v: -0.5, t: '-\\frac{1}{2}', s: '-1/2' },
    'r2': { v: Math.SQRT2 / 2, t: '\\frac{\\sqrt{2}}{2}', s: 'sqrt(2)/2' }, '-r2': { v: -Math.SQRT2 / 2, t: '-\\frac{\\sqrt{2}}{2}', s: '-sqrt(2)/2' },
    'r3': { v: Math.sqrt(3) / 2, t: '\\frac{\\sqrt{3}}{2}', s: 'sqrt(3)/2' }, '-r3': { v: -Math.sqrt(3) / 2, t: '-\\frac{\\sqrt{3}}{2}', s: '-sqrt(3)/2' },
    's3': { v: Math.sqrt(3), t: '\\sqrt{3}', s: 'sqrt(3)' }, '-s3': { v: -Math.sqrt(3), t: '-\\sqrt{3}', s: '-sqrt(3)' },
    't3': { v: Math.sqrt(3) / 3, t: '\\frac{\\sqrt{3}}{3}', s: 'sqrt(3)/3' }, '-t3': { v: -Math.sqrt(3) / 3, t: '-\\frac{\\sqrt{3}}{3}', s: '-sqrt(3)/3' }
  };
  var ABS = 0.001;
  function fracT(v){ for(var q = 1; q <= 40; q++){ var p = Math.round(v * q); if(Math.abs(p / q - v) < 1e-9) return q === 1 ? String(p) : (p < 0 ? '-' : '') + '\\frac{' + Math.abs(p) + '}{' + q + '}'; } return M.fixed(v, 3); }
  function num(answer, mistakes, d){ return { kind: 'num', cell: M.cell(answer, 0, mistakes || [], ABS), d: d == null ? 3 : d }; }
  function ex(answer, vars, domain, mistakes){ var c = M.exprCell(answer, { vars: vars, domain: domain, mistakes: mistakes }); return { kind: 'expr', cell: c }; }
  function step(o, key, label, practice, extra){ o.key = key; o.label = label; o.practice = practice; if(extra) for(var k in extra) o[k] = extra[k]; return o; }
  function shuffled(r, list){ var a = list.slice(); for(var i = a.length - 1; i > 0; i--){ var j = Math.floor(r() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function choiceOf(r, right, wrongs){
    var all = [right].concat(wrongs), seen = {}, list = [];
    all.forEach(function(o){ if(!seen[o[0]]){ seen[o[0]] = 1; list.push(o); } });
    list = shuffled(r, list);
    var c = 0; list.forEach(function(o, i){ if(o === right) c = i; });
    return { kind: 'choice', options: list.map(function(o){ return o[0]; }), correct: c, why: list.map(function(o){ return o[1]; }) };
  }
  // a linear expression a·x + b as TeX and as typed
  function linT(a, b, v){ v = v || 'x'; var s = (a === 1 ? '' : a === -1 ? '-' : a) + v; if(!a) s = ''; if(b) s += (s ? (b < 0 ? ' - ' : ' + ') + Math.abs(b) : String(b)); return s || '0'; }
  function linS(a, b, v){ return linT(a, b, v).replace(/ /g, ''); }

  var GEN = {};
  /* 2.4: a single power of the base */
  GEN['single-power'] = function(r){
    var p = r.pick([2, 3, 5]), m = r.pick(p === 5 ? [2] : p === 3 ? [2, 3] : [2, 3, 4]), big = Math.pow(p, m);
    var a1 = r.pick([1, 1, 2]), b1 = r.pick([0, 0, 1, -1]), a2 = r.pick([1, 2, 3, -1]), b2 = r.pick([1, 2, -1, -2, 3]), op = r.pick(['mul', 'div']);
    var A = linS(m * a1, m * b1), sgn = op === 'mul' ? 1 : -1, Bc = [m * a1 + sgn * a2, m * b1 + sgn * b2], B = linS(Bc[0], Bc[1]);
    var e1 = linT(a1, b1), e2 = linT(a2, b2);
    var shown = big + '^{' + e1 + '}', other = p + '^{' + e2 + '}';
    var text = 'Write $' + (op === 'mul' ? shown + ' \\cdot ' + other : '\\frac{' + shown + '}{' + other + '}') + '$ as a single power of ' + p + '.';
    var s1 = step(ex(A, ['x'], [-2, 2], [{ expr: '(' + linS(a1, b1) + ') + ' + m, why: '$' + big + ' = ' + p + '^{' + m + '}$, and a power of a power MULTIPLIES the exponents: $(' + p + '^{' + m + '})^{' + e1 + '} = ' + p + '^{' + m + '(' + e1 + ')}$.' }].concat(b1 ? [{ expr: linS(m * a1, b1), why: 'Multiply the whole exponent by ' + m + ', the constant too: $' + m + '(' + e1 + ')$.' }] : [])),
      'A', 'First write $' + shown + '$ as $' + p + '^{A}$. Type $A$.', '2.A', { lhs: 'A =' });
    var s2mis = op === 'mul'
      ? [{ expr: '(' + A + ')*(' + linS(a2, b2) + ')', why: 'When you MULTIPLY powers of the same base, ADD the exponents (you multiplied them).' }]
      : [{ expr: '(' + A + ')+(' + linS(a2, b2) + ')', why: 'When you DIVIDE powers of the same base, SUBTRACT the exponents.' }, { expr: '(' + A + ')-' + linS(a2, 0) + '+' + b2, why: 'Subtract the whole exponent of the bottom: put it in brackets, $-(' + e2 + ')$.' }];
    var s2 = step(ex(B, ['x'], [-2, 2], s2mis), 'B', 'So the expression equals $' + p + '^{B}$. Type $B$.', '2.A', { lhs: 'B =' });
    var sol = ['$' + big + ' = ' + p + '^{' + m + '}$, so $' + shown + ' = ' + p + '^{' + m + '(' + e1 + ')} = ' + p + '^{' + linT(m * a1, m * b1) + '}$.',
      (op === 'mul' ? 'Multiplying powers adds exponents' : 'Dividing powers subtracts exponents') + ': $' + p + '^{' + linT(m * a1, m * b1) + '} ' + (op === 'mul' ? '\\cdot' : '\\div') + ' ' + other + ' = ' + p + '^{' + linT(Bc[0], Bc[1]) + '}$.'];
    return { text: text, steps: [s1, s2], solution: sol, values: { p: p, m: m, a1: a1, b1: b1, a2: a2, b2: b2, op: op } };
  };
  /* 2.12: a single logarithm, and where the rewrite holds */
  GEN['single-log'] = function(r){
    var L = r.pick([{ t: '\\ln', s: 'ln' }, { t: '\\log_{2}', s: 'log_2' }, { t: '\\log', s: 'log' }]), c = r.pick([2, 3, 2, 'h']), d = r.pick([1, 2, 3, -1]), k = r.pick([2, 3, 5, 4]), sign = r.pick([1, -1]);
    var cT = c === 'h' ? '\\frac{1}{2}' : String(c), pw = c === 'h' ? 'sqrt(x)' : 'x^' + c, pwT = c === 'h' ? '\\sqrt{x}' : 'x^{' + c + '}';
    var inner = '(x ' + (d < 0 ? '- ' + (-d) : '+ ' + d) + ')', innerS = '(x' + (d < 0 ? '-' + (-d) : '+' + d) + ')';
    var text = 'Write $' + cT + L.t + ' x + ' + L.t + inner + ' ' + (sign > 0 ? '-' : '+') + ' ' + L.t + ' ' + k + '$ as a single logarithm.';
    var B = sign > 0 ? pw + innerS + '/' + k : k + pw + innerS;
    var dom = [Math.max(0.15, -d + 0.15), 4.5];
    var s1 = step(ex(pw, ['x'], dom, [{ expr: (c === 'h' ? 'x/2' : c + 'x'), why: 'The coefficient becomes an EXPONENT: $' + cT + L.t + ' x = ' + L.t + '(' + pwT + ')$, not $' + L.t + '(' + cT + 'x)$.' }]),
      'A', 'Power rule first: $' + cT + L.t + ' x = ' + L.t + '(A)$. Type $A$.', '2.A', { lhs: 'A =' });
    var s2 = step(ex(B, ['x'], dom, [{ expr: pw + ' + ' + innerS + (sign > 0 ? ' - ' : ' + ') + k, why: 'A sum of logs is the log of a PRODUCT, not of a sum: $' + L.t + ' a + ' + L.t + ' b = ' + L.t + '(ab)$.' },
      { expr: sign > 0 ? k + pw + innerS : pw + innerS + '/' + k, why: sign > 0 ? 'SUBTRACTING a log divides: $- ' + L.t + ' ' + k + '$ puts ' + k + ' in the denominator.' : 'ADDING a log multiplies: $+ ' + L.t + ' ' + k + '$ multiplies by ' + k + '.' }]),
      'B', 'So the whole expression is $' + L.t + '(B)$. Type $B$.', '2.A', { lhs: 'B =' });
    var right = ['$x > ' + Math.max(0, -d) + '$', 'Right: the original needs $x > 0$ and $x ' + (d < 0 ? '> ' + (-d) : '> ' + (-d)) + '$; the single log is defined on more, so the two are equal only where the original is defined.'];
    var wr = [['All real $x$', 'The original has $' + L.t + ' x$, so it needs $x > 0$.'], ['$x > ' + (-d) + '$ and $x \\ne 0$', 'That is where the single log is defined. The original also needs $' + L.t + ' x$ to be defined: $x > 0$' + (d < 0 ? ' and $x > ' + (-d) + '$' : '') + '.']];
    if(d < 0) wr.push(['$x > 0$', 'The original also has $' + L.t + inner + '$, so it needs $x > ' + (-d) + '$.']);
    var s3 = step(choiceOf(r, right, wr), 'dom', 'For which $x$ are the original expression and $' + L.t + '(B)$ equal?', '2.B');
    var sol = ['Power rule: $' + cT + L.t + ' x = ' + L.t + '(' + pwT + ')$.',
      'Product and quotient rules: $' + L.t + '(' + pwT + ') + ' + L.t + inner + ' ' + (sign > 0 ? '-' : '+') + ' ' + L.t + ' ' + k + ' = ' + L.t + (sign > 0 ? '\\left(\\frac{' + pwT + inner + '}{' + k + '}\\right)' : '(' + k + pwT + inner + ')') + '$.',
      'The rewrite holds where the original is defined: $x > ' + Math.max(0, -d) + '$.'];
    return { text: text, steps: [s1, s2, s3], solution: sol, values: { L: L.s, c: c, d: d, k: k, sign: sign } };
  };
  /* 2.13: isolate the exponential, then undo it with a log */
  GEN['exp-eq'] = function(r){
    var useE = r() < 0.6, a = r.pick([2, 3, 4, 5]), k = r.pick([1, 2, 3]), c = r.pick([-5, -3, 1, 4, 7]), iso, b;
    if(useE){ iso = r.pick([2, 3, 4, 5, 6, 7]); b = 'e'; }
    else { b = r.pick([2, 3, 5]); iso = Math.pow(b, r.int(1, 3)) * (r() < 0.5 ? 1 : b + 1); }
    var d = a * iso + c, base = useE ? 'e' : String(b), powT = base + '^{' + (k === 1 ? 'x' : k + 'x') + '}';
    var text = 'Solve $' + a + powT + (c < 0 ? ' - ' + (-c) : ' + ' + c) + ' = ' + d + '$ exactly.';
    var lg = function(v){ return useE ? Math.log(v) : Math.log(v) / Math.log(b); }, X = lg(iso) / k;
    var lgT = function(v){ return useE ? '\\ln ' + v : '\\log_{' + b + '} ' + v; };
    var s1 = step(num(iso, [{ value: d - c, why: 'Divide by ' + a + ' too: the power stands alone only when its coefficient is gone.' }, { value: d / a - c, why: 'Undo in the reverse order: first ' + (c < 0 ? 'add ' + (-c) : 'subtract ' + c) + ', then divide by ' + a + '.' }]), 'iso',
      'Isolate the power: $' + powT + ' = $ ?', '2.A');
    var ms = [{ value: lg(d - c) / k, why: 'Isolate the power before taking the log.' }, { value: lg(iso) * k, why: '$' + k + 'x = ' + lgT(iso) + '$, so divide by ' + k + '.' }];
    if(useE) ms.push({ value: iso / k, why: 'Undo $e^{\\cdot}$ with $\\ln$: $' + k + 'x = \\ln ' + iso + '$.' });
    var s2 = step(num(X, k === 1 ? ms.slice(0, 1).concat(useE ? [{ value: iso, why: 'Undo $e^x$ with $\\ln$: $x = \\ln ' + iso + '$.' }] : []) : ms), 'x', 'Solve for $x$. (Exact, like ' + (useE ? 'ln(4)/2' : 'log_2(5)') + ', or three decimals.)', '1.C');
    var sol = ['$' + a + powT + ' = ' + (d - c) + '$, so $' + powT + ' = ' + iso + '$.', 'Take ' + (useE ? '$\\ln$' : '$\\log_{' + b + '}$') + ' of both sides: $' + (k === 1 ? 'x' : k + 'x') + ' = ' + lgT(iso) + '$, so $x = ' + (k === 1 ? lgT(iso) : '\\frac{' + lgT(iso) + '}{' + k + '}') + ' \\approx ' + M.fixed(X, 3) + '$.'];
    return { text: text, steps: [s1, s2], solution: sol, values: { a: a, k: k, c: c, d: d, b: useE ? 'e' : b, iso: iso, x: X } };
  };
  /* 2.13: two logs to one, then reject the root the domain forbids */
  var LOGQ = [[2, 3, 4, -2], [2, 3, 2, -4], [2, 4, 8, -2], [2, 4, 2, -8], [3, 2, 9, -1], [3, 2, 1, -9], [10, 1, 5, -2], [10, 1, 2, -5], [2, 5, 8, -4], [2, 5, 4, -8], [3, 3, 9, -3], [2, 6, 16, -4]];
  GEN['log-eq'] = function(r){
    var q = r.pick(LOGQ), b = q[0], c = q[1], r1 = q[2], r2 = q[3], N = Math.pow(b, c), d = -(r1 + r2);
    var Lt = b === 10 ? '\\log' : '\\log_{' + b + '}';
    var text = 'Solve $' + Lt + ' x + ' + Lt + '(x ' + (d < 0 ? '- ' + (-d) : '+ ' + d) + ') = ' + c + '$.';
    var steps = [
      step(num(N, [{ value: b * c, why: '$' + Lt + ' M = ' + c + '$ means $M = ' + b + '^{' + c + '}$, not $' + b + ' \\cdot ' + c + '$.' }, { value: Math.pow(c, b), why: 'The base is ' + b + ': $M = ' + b + '^{' + c + '}$.' }], 0), 'N',
        'Combine and rewrite in exponential form: $x(x ' + (d < 0 ? '- ' + (-d) : '+ ' + d) + ') = $ ?', '2.A'),
      step(num(1, [{ value: 2, why: 'The quadratic has two roots, but at $x = ' + r2 + '$ the term $' + Lt + ' x$ is undefined (a log needs a positive input). Reject it.' }], 0), 'count',
        'The equation $x^2 ' + (d < 0 ? '- ' + (-d) : '+ ' + d) + 'x - ' + N + ' = 0$ has roots $' + r1 + '$ and $' + r2 + '$. How many solutions does the ORIGINAL equation have?', '2.B'),
      step(num(r1, [{ value: r2, why: 'At $x = ' + r2 + '$ the term $' + Lt + ' x$ is undefined: the log of a negative number. Reject it.' }], 0), 'x', 'What is the solution?', '1.C')
    ];
    var sol = ['Product rule: $' + Lt + '[x(x ' + (d < 0 ? '- ' + (-d) : '+ ' + d) + ')] = ' + c + '$, so $x(x ' + (d < 0 ? '- ' + (-d) : '+ ' + d) + ') = ' + b + '^{' + c + '} = ' + N + '$.',
      '$x^2 ' + (d < 0 ? '- ' + (-d) : '+ ' + d) + 'x - ' + N + ' = (x - ' + r1 + ')(x + ' + (-r2) + ') = 0$, so $x = ' + r1 + '$ or $x = ' + r2 + '$.',
      'Check the domain: $x = ' + r2 + '$ gives $' + Lt + '(' + r2 + ')$, which is undefined. The only solution is $x = ' + r1 + '$.'];
    return { text: text, steps: steps, solution: sol, values: { b: b, c: c, r1: r1, r2: r2, d: d } };
  };
  /* 2.13: quadratic in e^x; e^x > 0 rejects a negative root */
  var QUADS = [[3, -2], [2, -1], [4, -3], [5, -2], [2, 3], [2, 5], [1, 4], [3, 4], [6, -1], [3, -5]];
  GEN['quad-ex'] = function(r){
    var q = r.pick(QUADS), u1 = q[0], u2 = q[1], p = -(u1 + u2), cc = u1 * u2, pos = [u1, u2].filter(function(u){ return u > 0; }).sort(function(a, b){ return a - b; }), neg = [u1, u2].filter(function(u){ return u < 0; });
    var mid = p === 0 ? '' : (p < 0 ? ' - ' : ' + ') + (Math.abs(p) === 1 ? '' : Math.abs(p)) + 'e^{x}', tail = cc < 0 ? ' - ' + (-cc) : ' + ' + cc;
    var text = 'Solve $e^{2x}' + mid + tail + ' = 0$ for all real $x$.';
    var uq = 'u^2' + (p === 0 ? '' : (p < 0 ? '-' : '+') + (Math.abs(p) === 1 ? '' : Math.abs(p)) + 'u') + (cc < 0 ? '-' + (-cc) : '+' + cc);
    var steps = [
      step(ex(uq, ['u'], [-3, 3], [{ expr: '2u' + uq.slice(3), why: '$e^{2x} = (e^x)^2 = u^2$, not $2u$.' }]), 'u', 'Let $u = e^x$. Write the left side as a quadratic in $u$.', '2.A', { lhs: '0 =' }),
      step(num(pos.length, pos.length === 1 ? [{ value: 2, why: 'The root $u = ' + neg[0] + '$ gives $e^x = ' + neg[0] + '$, which has no solution: $e^x > 0$ for every real $x$. Reject it.' }]
        : [{ value: 1, why: 'Both roots, $u = ' + pos[0] + '$ and $u = ' + pos[1] + '$, are positive, so each gives a solution.' }], 0), 'count',
        'The quadratic factors as $(u ' + (u1 < 0 ? '+ ' + (-u1) : '- ' + u1) + ')(u ' + (u2 < 0 ? '+ ' + (-u2) : '- ' + u2) + ') = 0$. How many real solutions $x$ are there?', '2.B'),
      step(num(Math.log(pos[0]), [{ value: pos[0], why: '$u = ' + pos[0] + '$ is the value of $e^x$. Solve $e^x = ' + pos[0] + '$: $x = \\ln ' + pos[0] + '$.' }].concat(neg.length ? [{ value: Math.log(-neg[0]), why: '$\\ln ' + (-neg[0]) + '$ solves $e^x = ' + (-neg[0]) + '$, not $e^x = ' + neg[0] + '$, which has no solution.' }] : [])), 'x1',
        pos.length === 1 ? 'What is the solution? (Exact, like ln(5), or three decimals.)' : 'What is the smaller solution? (Exact or three decimals.)', '1.C')
    ];
    if(pos.length === 2) steps.push(step(num(Math.log(pos[1]), [{ value: pos[1], why: 'That is $e^x$. Take $\\ln$: $x = \\ln ' + pos[1] + '$.' }]), 'x2', 'And the larger solution?', '1.C'));
    var sol = ['With $u = e^x$: $' + uq.replace(/u\^2/, 'u^2').replace(/([+-])/g, ' $1 ') + ' = 0$, so $u = ' + u1 + '$ or $u = ' + u2 + '$.',
      neg.length ? '$e^x = ' + neg[0] + '$ has no solution, since $e^x > 0$ for every $x$. Reject it.' : 'Both values of $u$ are positive.',
      pos.map(function(u){ return '$e^x = ' + u + '$ gives $x = \\ln ' + u + ' \\approx ' + M.fixed(Math.log(u), 3) + '$.'; }).join(' ')];
    return { text: text, steps: steps, solution: sol, values: { u1: u1, u2: u2, p: p, c: cc }, fig: { kind: 'quad', u1: u1, u2: u2 } };
  };
  /* 3.9: inverse trig values in the principal range, then a composition */
  var INV = {
    arcsin: { t: '\\sin^{-1}', range: '[-\\frac{\\pi}{2}, \\frac{\\pi}{2}]', args: { '-1': [-1, 2], '-r3': [-1, 3], '-r2': [-1, 4], '-h': [-1, 6], 'h': [1, 6], 'r2': [1, 4], 'r3': [1, 3], '1': [1, 2], '0': [0, 1] } },
    arccos: { t: '\\cos^{-1}', range: '[0, \\pi]', args: { '-1': [1, 1], '-r3': [5, 6], '-r2': [3, 4], '-h': [2, 3], 'h': [1, 3], 'r2': [1, 4], 'r3': [1, 6], '1': [0, 1], '0': [1, 2] } },
    arctan: { t: '\\tan^{-1}', range: '(-\\frac{\\pi}{2}, \\frac{\\pi}{2})', args: { '-s3': [-1, 3], '-1': [-1, 4], '-t3': [-1, 6], 't3': [1, 6], '1': [1, 4], 's3': [1, 3], '0': [0, 1] } }
  };
  var TRIPLES = [[3, 4, 5], [5, 12, 13], [8, 15, 17], [7, 24, 25]];
  GEN['inv-trig'] = function(r){
    var fn = r.pick(['arcsin', 'arccos', 'arctan']), I = INV[fn], keys = Object.keys(I.args).filter(function(k){ return k !== '0' && k !== '1' && k !== '-1' || r() < 0.15; }), key = r.pick(keys), v = VAL[key], A = ang(I.args[key][0], I.args[key][1]);
    // slips: an angle with the same sine (cosine, tangent) outside the range; tan^-1 as 1/tan
    var ms = [];
    if(fn === 'arcsin' && A.v !== 0){ ms.push({ value: Math.PI - A.v, why: 'Same sine, but outside the range of $\\sin^{-1}$, which is ' + '$' + I.range + '$.' }); if(A.v < 0) ms.push({ value: A.v + 2 * Math.PI, why: 'Same sine, but $\\sin^{-1}$ gives an angle in $' + I.range + '$: a negative angle here.' }); }
    if(fn === 'arccos' && A.v !== 0){ ms.push({ value: -A.v, why: 'Same cosine, but $\\cos^{-1}$ gives an angle in $' + I.range + '$, never negative.' }); ms.push({ value: 2 * Math.PI - A.v, why: 'Same cosine, but outside the range $' + I.range + '$.' }); }
    if(fn === 'arctan'){ ms.push({ value: A.v + Math.PI, why: 'Same tangent, but outside the range of $\\tan^{-1}$, $' + I.range + '$.' }); ms.push({ value: 1 / Math.tan(v.v), why: '$\\tan^{-1} x$ is the INVERSE function (an angle), not $\\frac{1}{\\tan x}$.' }); }
    if(fn === 'arcsin' && v.v) ms.push({ value: 1 / Math.sin(v.v), why: '$\\sin^{-1} x$ is the INVERSE function (an angle), not $\\frac{1}{\\sin x}$.' });
    var s1 = step(num(A.v, ms), 'v', 'Evaluate $' + I.t + '\\left(' + v.t + '\\right)$ exactly. (Type pi for $\\pi$, like 2pi/3.)', '1.C');
    // the composition: outer of (inner of p/q) with a right triangle
    var tri = r.pick(TRIPLES), inner = r.pick(['arcsin', 'arccos']), outer = inner === 'arcsin' ? r.pick(['cos', 'tan']) : r.pick(['sin', 'tan']), sg = r.pick([1, -1]);
    var x = sg * tri[0] / tri[2], th = inner === 'arcsin' ? Math.asin(x) : Math.acos(x), val = outer === 'cos' ? Math.cos(th) : outer === 'sin' ? Math.sin(th) : Math.tan(th);
    var xT = (sg < 0 ? '-' : '') + '\\frac{' + tri[0] + '}{' + tri[2] + '}';
    var cms = [{ value: -val, why: 'Check the sign: $\\theta = ' + INV[inner].t + '\\left(' + xT + '\\right)$ is in ' + (inner === 'arcsin' ? (sg > 0 ? 'quadrant I' : 'quadrant IV') : (sg > 0 ? 'quadrant I' : 'quadrant II')) + ', where $\\' + outer + '$ is ' + (val > 0 ? 'positive' : 'negative') + '.' },
      { value: outer === 'tan' ? 1 / val : tri[2] / tri[1], why: outer === 'tan' ? 'Tangent is opposite over adjacent: check which side is which in the triangle.' : 'Use the third side over the hypotenuse: $\\frac{' + tri[1] + '}{' + tri[2] + '}$.' }];
    var s2 = step(num(val, cms), 'comp', 'Evaluate $\\' + outer + '\\left(' + INV[inner].t + '\\left(' + xT + '\\right)\\right)$ exactly.', '1.C');
    var thT = '\\theta = ' + INV[inner].t + '\\left(' + xT + '\\right)';
    var sol = ['$' + I.t + '\\left(' + v.t + '\\right)$ is the angle in $' + I.range + '$ whose ' + { arcsin: 'sine', arccos: 'cosine', arctan: 'tangent' }[fn] + ' is $' + v.t + '$: $' + A.t + '$.',
      'Let $' + thT + '$. Then $\\' + inner.slice(3) + ' \\theta = ' + xT + '$ with $\\theta$ in ' + (inner === 'arcsin' ? '$[-\\frac{\\pi}{2}, \\frac{\\pi}{2}]$' : '$[0, \\pi]$') + '. A right triangle with sides ' + tri.join(', ') + ' gives $\\' + outer + ' \\theta = ' + fracT(val) + '$, with the sign of $\\' + outer + '$ where $\\theta$ lies.'];
    return { text: 'Evaluate exactly. Each inverse trig function gives one angle, in its principal range.', steps: [s1, s2], solution: sol,
      values: { fn: fn, key: key, ang: A.v, inner: inner, outer: outer, x: x, val: val }, fig: { kind: 'circle', fn: fn, ang: A.v, v: v.v } };
  };
  /* 3.10: every solution in [0, 2π) */
  var TEQ = [
    ['sin', '2\\sin x - 1 = 0', 'h'], ['sin', '2\\sin x + 1 = 0', '-h'], ['sin', '2\\sin x - \\sqrt{3} = 0', 'r3'], ['sin', '2\\sin x + \\sqrt{3} = 0', '-r3'], ['sin', '2\\sin x + \\sqrt{2} = 0', '-r2'], ['sin', '\\sqrt{2}\\sin x - 1 = 0', 'r2'],
    ['cos', '2\\cos x - 1 = 0', 'h'], ['cos', '2\\cos x + 1 = 0', '-h'], ['cos', '2\\cos x - \\sqrt{3} = 0', 'r3'], ['cos', '2\\cos x + \\sqrt{3} = 0', '-r3'], ['cos', '2\\cos x + \\sqrt{2} = 0', '-r2'], ['cos', '\\sqrt{2}\\cos x - 1 = 0', 'r2'],
    ['tan', '\\tan x + 1 = 0', '-1'], ['tan', '\\tan x - \\sqrt{3} = 0', 's3'], ['tan', '\\sqrt{3}\\tan x + 1 = 0', '-t3'], ['tan', '3\\tan x - \\sqrt{3} = 0', 't3']
  ];
  var REF = { 'h': [1, 6, 1, 3], 'r2': [1, 4, 1, 4], 'r3': [1, 3, 1, 6], '1': [1, 4], 's3': [1, 3], 't3': [1, 6] };
  GEN['trig-eq'] = function(r){
    var q = r.pick(TEQ), f = q[0], v = VAL[q[2]], key = q[2].replace('-', ''), neg = q[2].charAt(0) === '-';
    // the reference angle α in (0, π/2)
    var ref = f === 'sin' ? ang(REF[key][0], REF[key][1]) : f === 'cos' ? ang(REF[key][2], REF[key][3]) : ang(REF[key][0], REF[key][1]);
    var a = ref.v, sols;
    if(f === 'sin') sols = neg ? [Math.PI + a, 2 * Math.PI - a] : [a, Math.PI - a];
    else if(f === 'cos') sols = neg ? [Math.PI - a, Math.PI + a] : [a, 2 * Math.PI - a];
    else sols = neg ? [Math.PI - a, 2 * Math.PI - a] : [a, Math.PI + a];
    var cands = [a, Math.PI - a, Math.PI + a, 2 * Math.PI - a, -a], WHERE = function(x){ var qd = x < 0 ? 4 : Math.floor(x / (Math.PI / 2)) + 1; return 'quadrant ' + ['', 'I', 'II', 'III', 'IV'][qd]; };
    function slips(right){
      return cands.filter(function(c){ return !sols.some(function(s){ return Math.abs(s - c) < 1e-9; }); }).map(function(c){
        return { value: c, why: c < 0 ? 'That angle is negative; the interval is $[0, 2\\pi)$. Add $2\\pi$.' : 'At that angle (in ' + WHERE(c) + ') $\\' + f + ' x$ has the wrong sign: $\\' + f + ' x = ' + v.t + '$ needs ' + (f === 'sin' ? (neg ? 'quadrants III and IV' : 'quadrants I and II') : f === 'cos' ? (neg ? 'quadrants II and III' : 'quadrants I and IV') : (neg ? 'quadrants II and IV' : 'quadrants I and III')) + '.' };
      }).concat(right != null ? [{ value: sols[1 - right], why: 'That is the ' + (right ? 'smaller' : 'larger') + ' solution.' }] : []);
    }
    var steps = [
      step(num(v.v, [], 3), 'iso', 'Isolate the trig function: $\\' + f + ' x = $ ?', '2.A'),
      step(num(2, [{ value: 1, why: 'There is a second solution in $[0, 2\\pi)$: $\\' + f + '$ takes each value ' + (f === 'tan' ? 'once on each half turn' : 'twice per turn') + '. Look in the other quadrant where $\\' + f + ' x$ has this sign.' }, { value: 4, why: 'In $[0, 2\\pi)$, one full turn, $\\' + f + ' x = ' + v.t + '$ has two solutions.' }], 0), 'count', 'How many solutions are in $[0, 2\\pi)$?', '2.B'),
      step(num(sols[0], slips(0)), 'x1', 'The smaller solution in $[0, 2\\pi)$? (Exact, like 7pi/6.)', '1.C'),
      step(num(sols[1], slips(1)), 'x2', 'And the larger one?', '1.C')
    ];
    var at = function(x){ var k = Math.round(x / (Math.PI / 12)); return ang(k, 12).t; };
    var sol = ['$\\' + f + ' x = ' + v.t + '$. The reference angle is $' + ref.t + '$.',
      '$\\' + f + ' x$ is ' + (neg ? 'negative' : 'positive') + ' in ' + (f === 'sin' ? (neg ? 'quadrants III and IV' : 'quadrants I and II') : f === 'cos' ? (neg ? 'quadrants II and III' : 'quadrants I and IV') : (neg ? 'quadrants II and IV' : 'quadrants I and III')) + ', so $x = ' + at(sols[0]) + '$ or $x = ' + at(sols[1]) + '$.'];
    return { text: 'Solve $' + q[1] + '$ for $0 \\le x < 2\\pi$.', steps: steps, solution: sol, values: { f: f, v: v.v, sols: sols, eq: q[1] }, fig: { kind: 'trig', f: f, v: v.v, sols: sols } };
  };
  /* 3.12: a single sine, cosine or tangent */
  var IDS = [
    { id: 'sum-sin', text: '\\sin x\\cos\\frac{\\pi}{K} + \\cos x\\sin\\frac{\\pi}{K}', f: 'sin' },
    { id: 'dif-sin', text: '\\sin x\\cos\\frac{\\pi}{K} - \\cos x\\sin\\frac{\\pi}{K}', f: 'sin' },
    { id: 'sum-cos', text: '\\cos x\\cos\\frac{\\pi}{K} - \\sin x\\sin\\frac{\\pi}{K}', f: 'cos' },
    { id: 'dbl-sin', text: 'C\\sin x\\cos x', f: 'sin' },
    { id: 'tan-dbl', text: '\\frac{\\sin(2x)}{1 + \\cos(2x)}', f: 'tan' },
    { id: 'tan-pyth', text: '\\frac{1 - \\cos^2 x}{\\sin x\\cos x}', f: 'tan' }
  ];
  GEN['trig-id'] = function(r){
    var I = r.pick(IDS), K = r.pick([3, 4, 6]), C = r.pick([2, 4, 6]), text = I.text.replace(/K/g, K).replace('C', C === 2 ? '2' : C), steps = [], sol = [], dom = [-1.2, 1.2];
    var Ka = 'pi/' + K;
    if(I.id === 'sum-sin' || I.id === 'dif-sin' || I.id === 'sum-cos'){
      var plus = I.id !== 'dif-sin', A = 'x' + (plus ? '+' : '-') + Ka;
      steps.push(step(ex(A, ['x'], [-2, 2], [{ expr: 'x' + (plus ? '-' : '+') + Ka, why: I.f === 'cos' ? '$\\cos(a + b) = \\cos a\\cos b - \\sin a\\sin b$: a MINUS in the expansion means a PLUS inside.' : '$\\sin(a \\pm b) = \\sin a\\cos b \\pm \\cos a\\sin b$: the sign inside matches the sign between the terms.' }, { expr: 'x*' + Ka, why: 'The identity adds (or subtracts) the angles; it does not multiply them.' }]),
        'A', 'Write it as a single ' + (I.f === 'sin' ? 'sine' : 'cosine') + ': $\\' + I.f + '(A)$. Type $A$.', '2.A', { lhs: 'A =' }));
      sol.push((I.f === 'sin' ? '$\\sin(a ' + (plus ? '+' : '-') + ' b) = \\sin a\\cos b ' + (plus ? '+' : '-') + ' \\cos a\\sin b$' : '$\\cos(a + b) = \\cos a\\cos b - \\sin a\\sin b$') + ' with $a = x$, $b = \\frac{\\pi}{' + K + '}$.',
        'So the expression is $\\' + I.f + '\\left(x ' + (plus ? '+' : '-') + ' \\frac{\\pi}{' + K + '}\\right)$.');
    } else if(I.id === 'dbl-sin'){
      steps.push(step(num(C / 2, [{ value: C, why: '$2\\sin x\\cos x = \\sin(2x)$ uses up a factor 2: $' + C + '\\sin x\\cos x = ' + (C / 2) + '(2\\sin x\\cos x)$.' }], 0), 'k', 'Write it as $k\\sin(A)$. What is $k$?', '2.A'));
      steps.push(step(ex('2x', ['x'], [-2, 2], [{ expr: 'x', why: 'The double-angle identity doubles the angle: $2\\sin x\\cos x = \\sin(2x)$.' }, { expr: 'x^2', why: 'Double the angle: $2x$, not $x^2$.' }]), 'A', 'And $A$?', '2.A', { lhs: 'A =' }));
      sol.push('$\\sin(2x) = 2\\sin x\\cos x$, so $' + C + '\\sin x\\cos x = ' + (C / 2 === 1 ? '' : C / 2) + '\\sin(2x)$.');
    } else if(I.id === 'tan-dbl'){
      steps.push(step(ex('2sin(x)cos(x)', ['x'], dom, [{ expr: '2sin(x)', why: '$\\sin(2x) = 2\\sin x\\cos x$, not $2\\sin x$.' }]), 'n', 'Double angle on top: $\\sin(2x) = $', '2.A', { lhs: '\\sin(2x) =' }));
      steps.push(step(ex('2cos(x)^2', ['x'], dom, [{ expr: '1+2cos(x)', why: '$\\cos(2x) = 2\\cos^2 x - 1$, so $1 + \\cos(2x) = 2\\cos^2 x$.' }, { expr: '2cos(x)^2 - 1', why: 'That is $\\cos(2x)$ alone; add the 1.' }]), 'd', 'Double angle below: $1 + \\cos(2x) = $', '2.A', { lhs: '1 + \\cos(2x) =' }));
      steps.push(step(ex('x', ['x'], dom, [{ expr: '2x', why: 'After canceling, $\\frac{2\\sin x\\cos x}{2\\cos^2 x} = \\frac{\\sin x}{\\cos x} = \\tan x$: the angle is $x$, not $2x$.' }]), 'A', 'So the expression is $\\tan(A)$. Type $A$.', '2.A', { lhs: 'A =' }));
      sol.push('$\\sin(2x) = 2\\sin x\\cos x$ and $1 + \\cos(2x) = 1 + (2\\cos^2 x - 1) = 2\\cos^2 x$.', '$\\frac{2\\sin x\\cos x}{2\\cos^2 x} = \\frac{\\sin x}{\\cos x} = \\tan x$, where $\\cos x \\ne 0$.');
    } else {
      steps.push(step(ex('sin(x)^2', ['x'], dom, [{ expr: 'cos(x)^2', why: '$\\sin^2 x + \\cos^2 x = 1$, so $1 - \\cos^2 x = \\sin^2 x$.' }, { expr: '1-cos(x)', why: '$1 - \\cos^2 x$ is not $1 - \\cos x$: use $\\sin^2 x + \\cos^2 x = 1$.' }]), 'n', 'Pythagorean identity on top: $1 - \\cos^2 x = $', '2.A', { lhs: '1 - \\cos^2 x =' }));
      steps.push(step(ex('x', ['x'], dom, [{ expr: '2x', why: '$\\frac{\\sin^2 x}{\\sin x\\cos x} = \\frac{\\sin x}{\\cos x} = \\tan x$.' }]), 'A', 'So the expression is $\\tan(A)$. Type $A$.', '2.A', { lhs: 'A =' }));
      sol.push('$1 - \\cos^2 x = \\sin^2 x$ (Pythagorean identity).', '$\\frac{\\sin^2 x}{\\sin x\\cos x} = \\frac{\\sin x}{\\cos x} = \\tan x$, where $\\sin x\\cos x \\ne 0$.');
    }
    var kind = I.f === 'tan' ? 'a single tangent' : I.f === 'sin' ? 'a single sine' : 'a single cosine';
    return { text: 'Rewrite $' + text + '$ as ' + (I.id === 'dbl-sin' ? 'a multiple of ' : '') + kind + '.', steps: steps, solution: sol, values: { id: I.id, K: K, C: C } };
  };

  var KINDS = ['single-power', 'single-log', 'exp-eq', 'log-eq', 'quad-ex', 'inv-trig', 'trig-eq', 'trig-id'];
  var TITLE = { 'single-power': 'A single power', 'single-log': 'A single logarithm', 'exp-eq': 'Exponential equations', 'log-eq': 'Logarithmic equations', 'quad-ex': 'Quadratic in e^x', 'inv-trig': 'Inverse trig values', 'trig-eq': 'Every solution in an interval', 'trig-id': 'A single sine, cosine or tangent' };
  function generate(r, ctx, type){
    var list = ctx.types || [ctx.kind || ctx.id], t = type && list.indexOf(type) > -1 ? type : list[0];
    if(!GEN[t]) throw new Error('symbolic-steps: unknown kind ' + t);
    var p = GEN[t](r, ctx);
    p.ctx = ctx.id; p.type = t; p.topic = ctx.topic; p.title = TITLE[t];
    return p;
  }

  /* ------------------------------------------------ Explore: is a rewrite equal? */
  /* compareForms(a, b, [lo, hi]) -> { ok, error, pieces: [{ a, b, s }] }: the window
     cut into pieces where s is 'same' (both defined and equal), 'diff' (both
     defined, not equal), 'a' (only the first defined), 'b' (only the second),
     'none'. */
  function compareForms(a, b, win){
    win = win || [-4, 4];
    var X = E(), fa, fb;
    try { fa = X.fn(a); } catch(e){ return { ok: false, error: 'First: ' + e.message }; }
    try { fb = X.fn(b); } catch(e){ return { ok: false, error: 'Second: ' + e.message }; }
    var N = 800, pieces = [], cur = null;
    function kind(x){
      var ya = fa(x), yb = fb(x), da = isFinite(ya) && Math.abs(ya) < 1e9, db = isFinite(yb) && Math.abs(yb) < 1e9;
      return da && db ? (Math.abs(ya - yb) <= 1e-7 * Math.max(1, Math.abs(ya), Math.abs(yb)) ? 'same' : 'diff') : da ? 'a' : db ? 'b' : 'none';
    }
    for(var i = 0; i <= N; i++){
      var x = win[0] + (win[1] - win[0]) * (i + 0.5) / (N + 1), s = kind(x);
      if(cur && cur.s === s) cur.b = x; else { cur = { a: x, b: x, s: s }; pieces.push(cur); }
    }
    // single stray samples (an asymptote's neighbour) are absorbed
    pieces = pieces.filter(function(p, i){ return p.b > p.a || (i === 0 || i === pieces.length - 1) || pieces.length < 3; });
    // each boundary found by bisection, then snapped to a round number when it is one
    for(var j = 1; j < pieces.length; j++){
      var lo = pieces[j - 1].b, hi = pieces[j].a, sl = pieces[j - 1].s;
      for(var k = 0; k < 40; k++){ var m = (lo + hi) / 2; if(kind(m) === sl) lo = m; else hi = m; }
      var bd = (lo + hi) / 2, rd = Math.round(bd * 20) / 20;
      if(Math.abs(rd - bd) < 1e-6) bd = rd;
      pieces[j - 1].b = bd; pieces[j].a = bd;
    }
    if(pieces.length){ pieces[0].a = win[0]; pieces[pieces.length - 1].b = win[1]; }
    return { ok: true, pieces: pieces, fa: fa, fb: fb };
  }
  var EXAMPLES = [
    ['ln(x^2)', '2ln(x)'], ['log_2(8x)', '3 + log_2(x)'], ['e^(2x)/e^x', 'e^x'], ['sin(2x)', '2sin(x)cos(x)'], ['ln(x+1) + ln(x-1)', 'ln(x^2 - 1)'], ['sqrt(x^2)', 'x'], ['arcsin(sin(x))', 'x'], ['ln(x + 2)', 'ln(x) + ln(2)']
  ];

  M.register('symbolicSteps', { ang: ang, VAL: VAL, INV: INV, KINDS: KINDS, TITLE: TITLE, GEN: GEN, generate: generate, compareForms: compareForms, EXAMPLES: EXAMPLES });
})(typeof window !== 'undefined' ? window : globalThis);
