/* Integration methods: the model, ApCalcMath.integrationMethods (docs/apcalcbc-architecture.md,
   "Trainers"; docs/apcalcbc-spec.md section 6). OWNED BY THIS TOOL ONLY (builder T3): no other
   tool edits this file, and this tool edits no shared file. Pure functions, no DOM, so the
   validator (scripts/lib/apcalcbc-tool-checks/integration-methods.mjs) and the test
   (scripts/test/apcalcbc-tool-integration-methods.test.mjs) run exactly this code.

   BC only (CED 6.11-6.14): integration by parts (u and dv named; tabular for x² times an
   exponential or a sine), partial fractions with distinct linear factors only (EK FUN-6.F.1),
   improper integrals as limits of definite integrals (EK LIM-6.A.1-2), and choosing the method.

   Explore
     PARTS                   the parts gallery: { id, tex, f, u, v, du, a, b: [lo, hi], F (an
                             antiderivative), uTex, dvTex, duTex, vTex, tab? (the tabular rows) }
     PF                      the partial-fraction gallery: { id, tex, p, q, A, B }
     IMPROPER                the improper gallery: { id, tex, f, a, kind: 'inf'|'zero', F, limit }
     partsPicture(g, b)      the uv picture: u and v along x, the two areas and uv at both ends
   Test yourself
     generate(rng, ctx, type) -> { ctx, topic, type, text, steps, solution, fig }
       types: parts, tabular, partial, improper, choose */
(function(G){
  'use strict';
  var M = G.ApCalcMath;
  if(!M) return;
  function H(s){ var t = G.ApCalcTex; return t ? t.html(s) : s; }
  function gcd(a, b){ a = Math.abs(a); b = Math.abs(b); while(b){ var t = a % b; a = b; b = t; } return a || 1; }
  /* A rational number n/d as TeX and as an ApCalcExpr string. */
  function fr(n, d){ if(d < 0){ n = -n; d = -d; } var g = gcd(n, d); return { n: n / g, d: d / g }; }
  function ftex(n, d){ var f = fr(n, d); return f.d === 1 ? String(f.n) : (f.n < 0 ? '-' : '') + '\\frac{' + Math.abs(f.n) + '}{' + f.d + '}'; }
  function fstr(n, d){ var f = fr(n, d); return f.d === 1 ? String(f.n) : '(' + f.n + '/' + f.d + ')'; }
  /* "c·X" as TeX with c = n/d: 1 -> X, -1 -> -X, 1/2 -> \frac{1}{2}X. */
  function ctex(n, d, X, first){
    var f = fr(n, d), s = f.n < 0 ? '-' : '', a = Math.abs(f.n);
    var c = f.d === 1 ? (a === 1 && X ? '' : String(a)) : '\\frac{' + a + '}{' + f.d + '}';
    return (first ? s : (s ? ' - ' : ' + ')) + c + X;
  }
  /* (n/d)·body as an expression string: body, (-body), (n/d)*body. */
  /* (n/d)·body as a readable expression string: body, -body, 3body, body/4, -3body/4
     (a leading minus is wrapped by the caller through sum()). */
  function cmul(n, d, body){ var f = fr(n, d), a = Math.abs(f.n); return (f.n < 0 ? '-' : '') + (a === 1 ? '' : a + '*') + body + (f.d === 1 ? '' : '/' + f.d); }
  /* "a ± b·c" for a term string that may start with a minus. */
  function plus(a, c, t){ var neg = t.charAt(0) === '-', body = neg ? t.slice(1) : t; var sgn = (c < 0) !== neg ? ' - ' : ' + ', k = Math.abs(c); return a + sgn + (k === 1 ? '' : k + '*') + (k === 1 ? body : '(' + body + ')'); }
  function times(pre, t){ return t.charAt(0) === '-' ? '-' + pre + '*' + t.slice(1) : pre + '*' + t; }
  function inner(a){ return a === 1 ? 'x' : a === -1 ? '-x' : a + 'x'; }
  function istr(a){ return a === 1 ? 'x' : a === -1 ? '-x' : a + 'x'; }
  function lin(p){ return p === 0 ? 'x' : p > 0 ? 'x - ' + p : 'x + ' + (-p); }
  function cl(v){ return Math.abs(v) < 1e-12 ? 0 : +(+v).toPrecision(12); }

  /* ------------------------------------------------------------- explore */
  var PARTS = [
    { id: 'xex', tex: 'xe^x', f: function(x){ return x * Math.exp(x); }, u: function(x){ return x; }, v: function(x){ return Math.exp(x); },
      F: function(x){ return (x - 1) * Math.exp(x); }, a: 0, b: [0.25, 1.5], b0: 1, uTex: 'x', dvTex: 'e^x\\,dx', duTex: 'dx', vTex: 'e^x', Ftex: 'xe^x - e^x',
      bad: 'With $u = e^x$ and $dv = x\\,dx$, $v = \\frac{x^2}{2}$ and the new integral $\\int \\frac{x^2}{2}e^x\\,dx$ is harder than the first: the power of $x$ went up.' },
    { id: 'xcos', tex: 'x\\cos x', f: function(x){ return x * Math.cos(x); }, u: function(x){ return x; }, v: function(x){ return Math.sin(x); },
      F: function(x){ return x * Math.sin(x) + Math.cos(x); }, a: 0, b: [0.25, 1.55], b0: 1.2, uTex: 'x', dvTex: '\\cos x\\,dx', duTex: 'dx', vTex: '\\sin x', Ftex: 'x\\sin x + \\cos x',
      bad: 'With $u = \\cos x$ and $dv = x\\,dx$, the new integral $\\int \\frac{x^2}{2}\\sin x\\,dx$ has a higher power of $x$ than the first.' },
    { id: 'lnx', tex: '\\ln x', f: function(x){ return Math.log(x); }, u: function(x){ return Math.log(x); }, v: function(x){ return x; },
      F: function(x){ return x * Math.log(x) - x; }, a: 1, b: [1.25, 3], b0: Math.E, uTex: '\\ln x', dvTex: 'dx', duTex: '\\frac{1}{x}\\,dx', vTex: 'x', Ftex: 'x\\ln x - x',
      bad: '$\\ln x$ has no antiderivative you know yet, so it cannot be $dv$: let $u = \\ln x$ and $dv = dx$. Its derivative $\\frac{1}{x}$ is simple.' },
    { id: 'xlnx', tex: 'x\\ln x', f: function(x){ return x * Math.log(x); }, u: function(x){ return Math.log(x); }, v: function(x){ return x * x / 2; },
      F: function(x){ return x * x / 2 * Math.log(x) - x * x / 4; }, a: 1, b: [1.25, 2.5], b0: 2, uTex: '\\ln x', dvTex: 'x\\,dx', duTex: '\\frac{1}{x}\\,dx', vTex: '\\frac{x^2}{2}', Ftex: '\\frac{x^2}{2}\\ln x - \\frac{x^2}{4}',
      bad: 'With $dv = \\ln x\\,dx$ you would need an antiderivative of $\\ln x$ first. Logarithms make the best $u$ (LIATE: logarithmic before algebraic).' },
    { id: 'x2ex', tex: 'x^2e^x', f: function(x){ return x * x * Math.exp(x); }, u: function(x){ return x * x; }, v: function(x){ return Math.exp(x); },
      F: function(x){ return (x * x - 2 * x + 2) * Math.exp(x); }, a: 0, b: [0.25, 1.5], b0: 1, uTex: 'x^2', dvTex: 'e^x\\,dx', duTex: '2x\\,dx', vTex: 'e^x', Ftex: 'x^2e^x - 2xe^x + 2e^x',
      tab: [['x^2', 'e^x', '+'], ['2x', 'e^x', '-'], ['2', 'e^x', '+'], ['0', 'e^x', '']],
      bad: 'With $u = e^x$, $v = \\frac{x^3}{3}$: the power climbs every time. Differentiate the polynomial until it is 0 (tabular).' }
  ];
  function parts(id){ return PARTS.filter(function(g){ return g.id === id; })[0] || PARTS[0]; }
  /* The uv picture of parts: the curve (v(x), u(x)) for x from a to b; the
     area under it over the v-axis is ∫u dv (the integral asked), the area
     beside it over the u-axis is ∫v du, and together they fill uv at b minus
     uv at a. Every gallery entry has u, v increasing and positive here. */
  function partsPicture(g, b){
    var a = g.a, pts = [];
    for(var i = 0; i <= 160; i++){ var x = a + (b - a) * i / 160; pts.push([g.v(x), g.u(x)]); }
    var udv = g.F(b) - g.F(a), uvb = g.u(b) * g.v(b), uva = g.u(a) * g.v(a);
    return { pts: pts, udv: udv, vdu: uvb - uva - udv, uvb: uvb, uva: uva, ua: g.u(a), ub: g.u(b), va: g.v(a), vb: g.v(b) };
  }
  var PF = [
    { id: 'a', p: 1, q: -2, A: 1, B: -1 },      // 3/((x - 1)(x + 2))
    { id: 'b', p: -1, q: 2, A: 2, B: 3 },       // (5x - 1)/((x + 1)(x - 2))
    { id: 'c', p: 0, q: 3, A: -1, B: 2 },       // (x + 3)/(x(x - 3))
    { id: 'd', p: 2, q: -3, A: 3, B: 1 }        // (4x + 7)/((x - 2)(x + 3))
  ];
  PF.forEach(function(g){ g.c = g.A + g.B; g.d = -(g.A * g.q + g.B * g.p); g.tex = pfTex(g); });
  function pfNum(c, d){ return c === 0 ? String(d) : (c === 1 ? '' : c === -1 ? '-' : c) + 'x' + (d ? (d < 0 ? ' - ' + (-d) : ' + ' + d) : ''); }
  function pfDen(p, q){ var f = function(r){ return r === 0 ? 'x' : '(' + lin(r) + ')'; }; return f(p) + f(q); }
  function pfTex(g){ return '\\frac{' + pfNum(g.c, g.d) + '}{' + pfDen(g.p, g.q) + '}'; }
  function pfOf(id){ return PF.filter(function(g){ return g.id === id; })[0] || PF[0]; }
  var IMPROPER = [
    { id: 'p2', tex: '\\frac{1}{x^2}', f: function(x){ return 1 / (x * x); }, a: 1, kind: 'inf', F: function(x){ return -1 / x; }, limit: 1, Ftex: '-\\frac{1}{x}' },
    { id: 'p1', tex: '\\frac{1}{x}', f: function(x){ return 1 / x; }, a: 1, kind: 'inf', F: function(x){ return Math.log(x); }, limit: Infinity, Ftex: '\\ln x' },
    { id: 'ph', tex: '\\frac{1}{\\sqrt{x}}', f: function(x){ return 1 / Math.sqrt(x); }, a: 1, kind: 'inf', F: function(x){ return 2 * Math.sqrt(x); }, limit: Infinity, Ftex: '2\\sqrt{x}' },
    { id: 'ex', tex: 'e^{-x}', f: function(x){ return Math.exp(-x); }, a: 0, kind: 'inf', F: function(x){ return -Math.exp(-x); }, limit: 1, Ftex: '-e^{-x}' },
    { id: 'z2', tex: '\\frac{1}{\\sqrt{x}}', f: function(x){ return 1 / Math.sqrt(x); }, a: 1, kind: 'zero', F: function(x){ return 2 * Math.sqrt(x); }, limit: 2, Ftex: '2\\sqrt{x}' },
    { id: 'z1', tex: '\\frac{1}{x^2}', f: function(x){ return 1 / (x * x); }, a: 1, kind: 'zero', F: function(x){ return -1 / x; }, limit: Infinity, Ftex: '-\\frac{1}{x}' }
  ];
  function improper(id){ return IMPROPER.filter(function(g){ return g.id === id; })[0] || IMPROPER[0]; }
  /* The partial integral: ∫ from a to b ('inf') or from b to a ('zero'). */
  function partial(g, b){ return g.kind === 'inf' ? g.F(b) - g.F(g.a) : g.F(g.a) - g.F(b); }

  /* ------------------------------------------------------- step helpers */
  function stepNum(key, label, cell, o){ o = o || {}; return { key: key, kind: 'num', label: label, cell: cell, d: o.d, hint: o.hint, practice: o.practice || '1.E', level: o.level || 'apply' }; }
  function stepChoice(key, label, options, correct, why, o){ o = o || {}; return { key: key, kind: 'choice', label: label, options: options, correct: correct, why: why, fixed: !!o.fixed, hint: o.hint, practice: o.practice || '1.C', level: o.level || 'analyze' }; }
  /* An expression step; an authored slip that happens to equal the key (a = 1
     makes "forgot to divide by a" right) or an earlier slip is dropped. */
  function stepExpr(key, label, answer, opts, o){
    o = o || {}; var E = G.ApCalcExpr, kept = [];
    if(opts.mistakes && E) opts.mistakes = opts.mistakes.filter(function(m){
      var cmp = { vars: opts.vars, domain: opts.domain, mode: opts.mode };
      var same = function(x){ try{ return E.compare(m.expr, x, cmp).equal; }catch(e){ return true; } };
      if(same(answer) || kept.some(same)) return false;
      kept.push(m.expr); return true;
    });
    return { key: key, kind: 'expr', label: label, lhs: o.lhs, cell: M.exprCell(answer, opts), hint: o.hint, practice: o.practice || '1.E', level: o.level || 'apply' };
  }
  /* A value typed exactly ("e^2/4 + 1/4", "pi - 2") or to three decimals. */
  function val(v, ms){ return M.cell(v, 0, ms || [], 0.0006); }
  function shuffle(r, opts){ // opts[0] is right: returns { options, why, correct }
    var idx = opts.map(function(x, i){ return i; });
    for(var j = idx.length - 1; j > 0; j--){ var k = r.int(0, j), t = idx[j]; idx[j] = idx[k]; idx[k] = t; }
    return { options: idx.map(function(i){ return H(opts[i][0]); }), why: idx.map(function(i){ return H(opts[i][1]); }), correct: idx.indexOf(0) };
  }

  /* -------------------------------------------------- parts (u and dv) */
  /* g(ax) families: e^{ax}, sin(ax), cos(ax), each with its antiderivatives
     (the I column of the tabular method) as strings and TeX. */
  function fam(kind, a){
    var X = inner(a), s = istr(a);
    if(kind === 'e') return { kind: 'e', a: a, g: 'e^(' + s + ')', gtex: 'e^{' + X + '}', fn: function(x){ return Math.exp(a * x); },
      I: function(k){ return cmul(1, Math.pow(a, k), 'e^(' + s + ')'); }, Itex: function(k){ return ctex(1, Math.pow(a, k), 'e^{' + X + '}', true); } };
    // sin: I1 = -cos/a, I2 = -sin/a², I3 = cos/a³ ; cos: I1 = sin/a, I2 = -cos/a², I3 = -sin/a³
    var cyc = kind === 's' ? [['cos', -1], ['sin', -1], ['cos', 1]] : [['sin', 1], ['cos', -1], ['sin', -1]];
    return { kind: kind, a: a, g: (kind === 's' ? 'sin' : 'cos') + '(' + s + ')', gtex: '\\' + (kind === 's' ? 'sin' : 'cos') + ' ' + (a === 1 ? 'x' : '(' + X + ')'), fn: function(x){ return kind === 's' ? Math.sin(a * x) : Math.cos(a * x); },
      I: function(k){ var c = cyc[k - 1]; return cmul(c[1], Math.pow(a, k), c[0] + '(' + s + ')'); },
      Itex: function(k){ var c = cyc[k - 1]; return ctex(c[1], Math.pow(a, k), '\\' + c[0] + ' ' + (a === 1 ? 'x' : '(' + X + ')'), true); } };
  }
  function genParts(r, ctx){
    var useLn = r.int(0, 3) === 0, def = r.int(0, 1) === 1;
    var o;
    if(useLn){
      var n = r.pick([0, 1, 2]), np = n + 1, xn = n === 0 ? '' : n === 1 ? 'x' : 'x^' + n;
      o = { itex: (xn ? xn + '\\,' : '') + '\\ln x', integrand: (xn ? 'x^' + n + '*' : '') + 'ln(x)', domain: [0.3, 3],
        uTex: '\\ln x', dvTex: (xn || '') + '\\,dx', duTex: '\\frac{1}{x}\\,dx',
        v: 'x^' + np + '/' + np, vtex: np === 1 ? 'x' : '\\frac{x^' + np + '}{' + np + '}',
        vMis: [{ expr: 'x^' + np, why: 'Divide by the new power: an antiderivative of x^' + n + ' is x^' + np + '/' + np + '.' }].concat(n ? [{ expr: n + '*x^' + (n - 1), why: 'That is the derivative of dv. v is an antiderivative of x^' + n + '.' }] : []),
        ans: 'x^' + np + '*ln(x)/' + np + ' - x^' + np + '/' + (np * np), atex: ctex(1, np, 'x^{' + np + '}\\ln x', true).replace('x^{1}', 'x') + ctex(-1, np * np, 'x^{' + np + '}', false).replace('x^{1}', 'x'),
        aMis: [{ expr: 'x^' + np + '*ln(x)/' + np + ' + x^' + np + '/' + (np * np), why: 'Sign: parts is uv minus the integral of v du.' },
          { expr: 'x^' + np + '*ln(x)/' + np, why: 'That is only uv. Subtract the integral of v du = ∫ x^' + n + '/' + np + ' dx.' },
          { expr: 'x^' + np + '/' + np + '*(x*ln(x) - x)', why: 'That multiplies two antiderivatives. Parts is uv − ∫v du, not ∫u·∫dv.' }],
        uOpts: [['$u = \\ln x$, $dv = ' + (xn || '') + '\\,dx$', 'Right: the derivative of $\\ln x$ is $\\frac{1}{x}$, which cancels a power of $x$ in $v\\,du$.'],
          [n ? '$u = ' + xn + '$, $dv = \\ln x\\,dx$' : '$u = 1$, $dv = \\ln x\\,dx$', 'Then $v$ would be an antiderivative of $\\ln x$, which is what parts is for. Let $u = \\ln x$ (LIATE: logs first).'],
          ['$u = ' + (xn ? xn + '\\ln x' : '\\ln x') + '$, $dv = 1$', '$dv$ must include $dx$, and putting the whole integrand in $u$ leaves nothing to integrate.'],
          ['$u = \\frac{1}{x}$, $dv = ' + (xn ? xn + '\\,' : '') + 'dx$', '$\\frac{1}{x}$ is not a factor of the integrand. Choose $u$ from what is there: $\\ln x$.']],
        A: 1, B: Math.E, Fn: function(x){ return Math.pow(x, np) * Math.log(x) / np - Math.pow(x, np) / (np * np); }, Btex: 'e', Atex: '1', kind: 'ln', n: n };
    } else {
      var kind = r.pick(['e', 'e', 's', 'c']), a = def ? 1 : r.pick(kind === 'e' ? [1, 2, 3, -1, -2] : [1, 2, 3]), Fm = fam(kind, a);
      o = { itex: 'x' + Fm.gtex, integrand: 'x*' + Fm.g, domain: [-2, 2], uTex: 'x', dvTex: Fm.gtex + '\\,dx', duTex: 'dx', v: Fm.I(1), vtex: Fm.Itex(1),
        ans: '', atex: '', kind: kind, a: a, n: 1 };
      // x·I1 − I2 (I2 is the antiderivative of I1)
      o.ans = plus(times('x', Fm.I(1)), -1, Fm.I(2));
      o.atex = 'x\\left(' + Fm.Itex(1) + '\\right) - \\left(' + Fm.Itex(2) + '\\right)';
      var I1 = Fm.I(1);
      o.vMis = [];
      if(a !== 1 || kind !== 'e') o.vMis.push({ expr: kind === 'e' ? 'e^(' + istr(a) + ')' : (kind === 's' ? '-cos(' : 'sin(') + istr(a) + ')', why: 'Check by differentiating: the chain rule brings out a factor ' + a + ', so divide by ' + a + '.' });
      if(kind !== 'e') o.vMis.push({ expr: kind === 's' ? fstr(1, a) + '*cos(' + istr(a) + ')' : fstr(-1, a) + '*sin(' + istr(a) + ')', why: 'Sign: the derivative of cos is −sin, so an antiderivative of sin is −cos.' });
      o.vMis.push({ expr: kind === 'e' ? a + '*e^(' + istr(a) + ')' : (kind === 's' ? a + '*cos(' : -a + '*sin(') + istr(a) + ')', why: 'That is the derivative of the factor in dv. v is its antiderivative.' });
      o.aMis = [{ expr: 'x*(' + I1 + ') + (' + Fm.I(2) + ')', why: 'Sign: parts is uv minus the integral of v du.' },
        { expr: 'x*(' + I1 + ')', why: 'That is only uv. Subtract the integral of v du = ∫ v dx.' },
        { expr: '(x^2/2)*(' + I1 + ')', why: 'That multiplies two antiderivatives. Parts is uv − ∫v du, not ∫u·∫dv.' }];
      var gt = Fm.gtex;
      o.uOpts = [['$u = x$, $dv = ' + gt + '\\,dx$', 'Right: $du = dx$, so $\\int v\\,du$ has no $x$ left in front: it is easier than the first.'],
        ['$u = ' + gt + '$, $dv = x\\,dx$', 'Then $v = \\frac{x^2}{2}$ and the new integral has $x^2$ in it: harder than the first. Let $u$ be the power of $x$.'],
        ['$u = x' + gt + '$, $dv = dx$', 'Then $du$ needs the product rule and $\\int v\\,du$ is harder. Split the integrand: $u = x$.'],
        ['$u = 1$, $dv = x' + gt + '\\,dx$', 'Then $v$ is the integral you are trying to find. Let $u = x$.']];
      if(kind === 'e'){ o.A = 0; o.B = 1; o.Btex = '1'; o.Atex = '0'; } else if(kind === 's'){ o.A = 0; o.B = Math.PI; o.Btex = '\\pi'; o.Atex = '0'; } else { o.A = 0; o.B = Math.PI / 2; o.Btex = '\\frac{\\pi}{2}'; o.Atex = '0'; }
      o.Fn = M.fn(o.ans, ['x']);
    }
    var Fx = typeof o.Fn === 'function' ? o.Fn : M.fn(o.ans, ['x']);
    var sh = shuffle(r, o.uOpts);
    var steps = [
      stepChoice('pu', H('Choose $u$ and $dv$'), sh.options, sh.correct, sh.why, { practice: '1.C', level: 'analyze', hint: H('Pick $u$ so that $du$ is simpler, and $dv$ so that you can integrate it.') }),
      stepExpr('pv', H('$v = \\int ' + o.dvTex + '$ (no $+ C$ needed here)'), o.v, { vars: ['x'], domain: o.domain, mode: 'exact', mistakes: o.vMis }, { lhs: 'v =', practice: '1.E', level: 'apply' }),
      stepExpr('pr', H('$\\int ' + o.itex + '\\,dx = uv - \\int v\\,du =$'), o.ans, { vars: ['x'], domain: o.domain, mode: 'constant', mistakes: o.aMis }, { practice: '1.E', level: 'apply', hint: H('$uv - \\int v\\,du$ with $u = ' + o.uTex + '$, $v = ' + o.vtex + '$, $du = ' + o.duTex + '$. Add $+ C$.') })
    ];
    var sol = [H('$u = ' + o.uTex + '$, $dv = ' + o.dvTex + '$, so $du = ' + o.duTex + '$ and $v = ' + o.vtex + '$.'),
      H('$\\int ' + o.itex + '\\,dx = uv - \\int v\\,du = ' + o.atex + ' + C$.')];
    var value = null;
    if(def){
      value = cl(Fx(o.B) - Fx(o.A));
      var uvOnly = (o.kind === 'ln') ? Math.pow(o.B, o.n + 1) * Math.log(o.B) / (o.n + 1) : (function(){ var I1 = M.fn('x*(' + o.v + ')', ['x']); return I1(o.B) - I1(o.A); })();
      steps.push(stepNum('pd', H('$\\int_{' + o.Atex + '}^{' + o.Btex + '} ' + o.itex + '\\,dx$ (exact, or to three decimal places)'), val(value, [
        { value: Fx(o.B), why: 'Evaluate at both bounds: F(' + o.Btex.replace(/\\frac\{(\w+)\}\{(\w+)\}/, '$1/$2').replace('\\pi', 'π') + ') − F(' + o.Atex + ').' },
        { value: uvOnly, why: 'That is only [uv] between the bounds. Subtract the integral of v du between the same bounds.' }]), { d: 3, practice: '1.E', level: 'apply' }));
      sol.push(H('$\\int_{' + o.Atex + '}^{' + o.Btex + '} ' + o.itex + '\\,dx = \\left[' + o.atex + '\\right]_{' + o.Atex + '}^{' + o.Btex + '} \\approx ' + M.fixed(value, 3) + '$.'));
    }
    return { ctx: ctx.id, topic: ctx.topic, type: 'parts',
      text: H('<p>Use integration by parts, $\\int u\\,dv = uv - \\int v\\,du$, to find $\\int ' + o.itex + '\\,dx$' + (def ? ', then evaluate it from $x = ' + o.Atex + '$ to $x = ' + o.Btex + '$.' : '.') + '</p>'),
      steps: steps, solution: sol,
      fig: { kind: 'parts', integrand: o.integrand, u: o.uTex, dv: o.dvTex, v: o.v, ans: o.ans, A: def ? o.A : null, B: def ? o.B : null, value: value } };
  }

  /* ------------------------------------------------------------ tabular */
  function genTabular(r, ctx){
    var kind = r.pick(['e', 'e', 's', 'c']), a = r.pick(kind === 'e' ? [1, 2, 3, -1] : [1, 2, 3]), Fm = fam(kind, a);
    var ans = plus(plus(times('x^2', Fm.I(1)), -1, times('2x', Fm.I(2))), 1, times('2', Fm.I(3)));
    var itex = 'x^2' + Fm.gtex;
    var I3 = Fm.I(3);
    var i3Mis = [];
    if(a !== 1) i3Mis.push({ expr: '(' + I3 + ')*' + (a * a), why: 'Each antiderivative divides by ' + a + ' again (the chain rule in reverse): the third one has 1/' + a + '³, not 1/' + a + '.' });
    if(kind !== 'e') i3Mis.push({ expr: '-(' + I3 + ')', why: 'Track the signs: sin → −cos → −sin → cos, and cos → sin → −cos → −sin.' });
    i3Mis.push({ expr: Fm.I(2), why: 'That is the second entry under the first. Count: the I column starts with the function in dv, then its antiderivatives.' });
    var signs = [['$+,\\ -,\\ +$', 'Right: the signs alternate, starting with $+$.'], ['$+,\\ +,\\ +$', 'Each diagonal alternates in sign: $+$, $-$, $+$. All plus signs is the classic tabular slip.'],
      ['$-,\\ +,\\ -$', 'The first diagonal is $+$: it is $u\\,v$, the first term of parts.'], ['$+,\\ -,\\ -$', 'The signs alternate all the way down: $+$, $-$, $+$.']];
    var sh = shuffle(r, signs);
    var aMis = [{ expr: 'x^2*(' + Fm.I(1) + ') + 2*x*(' + Fm.I(2) + ') + 2*(' + Fm.I(3) + ')', why: 'The signs alternate: +, −, +.' },
      { expr: 'x^2*(' + Fm.I(1) + ') - 2*x*(' + Fm.I(2) + ') + (' + Fm.I(3) + ')', why: 'The last diagonal multiplies the D entry 2 by the third I entry: keep the 2.' },
      { expr: 'x^2*(' + Fm.I(1) + ') - 2*x*(' + Fm.I(2) + ')', why: 'One diagonal is missing. Keep going until the D column reaches 0: three terms here.' }];
    return { ctx: ctx.id, topic: ctx.topic, type: 'tabular',
      text: H('<p>Find $\\int ' + itex + '\\,dx$ with the tabular method: differentiate $x^2$ down the D column until it is 0, integrate $' + Fm.gtex + '$ down the I column, and add the diagonal products with alternating signs.</p>'),
      steps: [
        stepExpr('ti', H('The third antiderivative of $' + Fm.gtex + '$ (the I entry beside the D entry $2$)'), I3, { vars: ['x'], domain: [-2, 2], mode: 'exact', mistakes: i3Mis }, { lhs: 'I_3 =', practice: '1.E', level: 'apply' }),
        stepChoice('ts', H('The signs on the three diagonal products'), sh.options, sh.correct, sh.why, { practice: '1.E', level: 'apply' }),
        stepExpr('tr', H('$\\int ' + itex + '\\,dx =$'), ans, { vars: ['x'], domain: [-2, 2], mode: 'constant', mistakes: aMis }, { practice: '1.E', level: 'apply', hint: H('$x^2 \\cdot I_1 - 2x \\cdot I_2 + 2 \\cdot I_3 + C$.') })
      ],
      solution: [H('D: $x^2,\\ 2x,\\ 2,\\ 0$. I: $' + Fm.gtex + ',\\ ' + Fm.Itex(1) + ',\\ ' + Fm.Itex(2) + ',\\ ' + Fm.Itex(3) + '$.'),
        H('Diagonals: $+x^2\\left(' + Fm.Itex(1) + '\\right)$, $-2x\\left(' + Fm.Itex(2) + '\\right)$, $+2\\left(' + Fm.Itex(3) + '\\right)$.'),
        H('Add them and $+ C$: $\\int ' + itex + '\\,dx = ' + exprTexOf(ans) + ' + C$.')],
      fig: { kind: 'tabular', integrand: 'x^2*' + Fm.g, D: ['x^2', '2x', '2', '0'], I: [Fm.gtex, Fm.Itex(1), Fm.Itex(2), Fm.Itex(3)], Is: [Fm.g, Fm.I(1), Fm.I(2), Fm.I(3)], ans: ans } };
  }

  /* ------------------------------------------------- partial fractions */
  function genPartial(r, ctx){
    for(var gg = 0; gg < 200; gg++){
      var p = r.int(-3, 3), q = r.int(-3, 3), A = r.pick([1, 2, 3, -1, -2, 3]), B = r.pick([1, 2, -1, -3, 4]);
      if(p === q || A === B || p > q) continue;
      var c = A + B, d = -(A * q + B * p);
      var expanded = r.int(0, 1) === 1, s1 = -(p + q), s0 = p * q;
      var den = expanded ? 'x^2' + (s1 ? (s1 < 0 ? ' - ' + (s1 === -1 ? '' : -s1) + 'x' : ' + ' + (s1 === 1 ? '' : s1) + 'x') : '') + (s0 ? (s0 < 0 ? ' - ' + (-s0) : ' + ' + s0) : '') : pfDen(p, q);
      var itex = '\\frac{' + pfNum(c, d) + '}{' + den + '}';
      var N = function(x){ return c * x + d; };
      var Lp = 'ln(abs(' + lin(p) + '))', Lq = 'ln(abs(' + lin(q) + '))';
      var ans = plus(times(String(A), Lp).replace(/^1\*/, '').replace(/^-1\*/, '-'), B, Lq);
      var dom = [p - 2.5, q + 2.5];
      var fac = '(' + lin(p) + ')(' + lin(q) + ')';
      return { ctx: ctx.id, topic: ctx.topic, type: 'partial',
        text: H('<p>Find $\\int ' + itex + '\\,dx$ by partial fractions: ' + (expanded ? 'the denominator factors as $' + fac.replace(/\(x\)/g, 'x') + '$, so ' : '') + 'write $' + itex + ' = \\frac{A}{' + lin(p) + '} + \\frac{B}{' + lin(q) + '}$.</p>'),
        steps: [
          stepNum('fa', H('$A$ (over $' + lin(p) + '$)'), M.cell(A, 1e-9, [{ value: B, why: 'That is B, the coefficient over x ' + (q < 0 ? '+ ' + (-q) : '− ' + q) + '. Cover up x ' + (p < 0 ? '+ ' + (-p) : '− ' + p) + ' and put x = ' + p + ' into what is left.' },
            { value: N(-p) / (-p - q), why: 'Put in the zero of the covered factor: x = ' + p + ', not x = ' + (-p) + '.' }], 1e-6), { d: 0, practice: '1.E', level: 'apply', hint: H('Cover up $' + lin(p) + '$ and put $x = ' + p + '$ into the rest: $A = \\frac{' + pfNum(c, d) + '}{' + lin(q) + '}$ at $x = ' + p + '$.') }),
          stepNum('fb', H('$B$ (over $' + lin(q) + '$)'), M.cell(B, 1e-9, [{ value: A, why: 'That is A. Cover up x ' + (q < 0 ? '+ ' + (-q) : '− ' + q) + ' and put x = ' + q + ' into the rest.' },
            { value: N(-q) / (-q - p), why: 'Put in the zero of the covered factor: x = ' + q + ', not x = ' + (-q) + '.' }], 1e-6), { d: 0, practice: '1.E', level: 'apply' }),
          stepExpr('fr', H('$\\int ' + itex + '\\,dx =$'), ans, { vars: ['x'], domain: dom, mode: 'constant', mistakes: [
            { expr: A + '*ln(' + lin(p) + ') + ' + B + '*ln(' + lin(q) + ')', why: 'Keep the absolute values: ln|x − a| is an antiderivative of 1/(x − a) on both sides of a.' },
            { expr: B + '*' + Lp + ' + ' + A + '*' + Lq, why: 'A and B are swapped: A goes with ln|' + lin(p) + '|.' },
            { expr: -A + '/(' + lin(p) + ')^2 + ' + -B + '/(' + lin(q) + ')^2', why: 'That differentiates. An antiderivative of A/(x − a) is A ln|x − a|.' }] },
            { practice: '1.E', level: 'apply', hint: H('$\\int \\frac{A}{x - a}\\,dx = A\\ln|x - a| + C$.') })
        ],
        solution: [H((expanded ? 'Factor: $' + den + ' = ' + fac.replace(/\(x\)/g, 'x') + '$. ' : '') + 'Cover-up at $x = ' + p + '$: $A = \\frac{' + N(p) + '}{' + (p - q) + '} = ' + A + '$. At $x = ' + q + '$: $B = \\frac{' + N(q) + '}{' + (q - p) + '} = ' + B + '$.'),
          H('Each piece gives a logarithm: $' + ctex(A, 1, '\\ln\\left|' + lin(p) + '\\right|', true) + ctex(B, 1, '\\ln\\left|' + lin(q) + '\\right|', false) + ' + C$.')],
        fig: { kind: 'partial', p: p, q: q, c: c, d: d, A: A, B: B, ans: ans } };
    }
    throw new Error('genPartial: no problem found');
  }

  /* ------------------------------------------------------------ improper */
  var POW = [[2, 1], [3, 1], [1, 1], [1, 2], [3, 2]];   // p = n/d
  function genImproper(r, ctx){
    var form = r.pick(['inf', 'inf', 'exp', 'zero']), k = r.pick([1, 2, 3, 4, 6]);
    var o = {};
    if(form === 'exp'){
      var cN = r.pick([1, 2, 3, 1]), cD = r.pick([1, 1, 2]), ce = fstr(cN, cD);
      o = { a: 0, inf: true, ftex: ctex(k, 1, 'e^{-' + (cN === cD ? '' : ftex(cN, cD)) + 'x}', true), f: k + '*e^(-' + ce + '*x)',
        Fb: fstr(-k * cD, cN) + '*e^(-' + ce + '*b) + ' + fstr(k * cD, cN), conv: true, value: k * cD / cN, dom: [0.5, 6],
        Fbtex: '-' + ftex(k * cD, cN) + 'e^{-' + (cN === cD ? '' : ftex(cN, cD)) + 'b} + ' + ftex(k * cD, cN),
        mis: [{ expr: fstr(k * cD, cN) + '*e^(-' + ce + '*b) - ' + fstr(k * cD, cN), why: 'Sign: the antiderivative of e^(−cx) is −e^(−cx)/c.' }, { expr: k + '*e^(-' + ce + '*b) - ' + k, why: 'Divide by the constant in the exponent: ∫e^(−cx) dx = −e^(−cx)/c.' }] };
    } else {
      var pw = r.pick(form === 'zero' ? [[1, 2], [1, 1], [2, 1], [1, 3]] : POW), pn = pw[0], pd = pw[1], p = pn / pd, a = form === 'zero' ? r.pick(pd === 2 ? [1, 4] : pd === 3 ? [1, 8] : [1, 2]) : r.pick(pd === 1 ? [1, 2] : [1, 4]);
      var e1 = fr(pd - pn, pd);   // 1 - p
      var ptex = pd === 1 ? (pn === 1 ? 'x' : 'x^{' + pn + '}') : pn === 1 && pd === 2 ? '\\sqrt{x}' : pn === 1 && pd === 3 ? '\\sqrt[3]{x}' : 'x^{' + ftex(pn, pd) + '}';
      o.ftex = '\\frac{' + k + '}{' + ptex + '}'; o.f = k + '*x^(-' + fstr(pn, pd) + ')'; o.a = a; o.inf = form !== 'zero';
      var pow = function(v){ return 'b^' + (e1.d === 1 ? '(' + e1.n + ')' : '(' + e1.n + '/' + e1.d + ')'); };
      var Fa = p === 1 ? k * Math.log(a) : k * Math.pow(a, 1 - p) / (1 - p);
      var co = fstr(k * e1.d, e1.n);   // k / (1 - p)
      if(p === 1){ o.Fb = o.inf ? k + '*ln(b) - ' + k + '*ln(' + a + ')' : k + '*ln(' + a + ') - ' + k + '*ln(b)'; o.Fbtex = o.inf ? k + '\\ln b - ' + k + '\\ln ' + a : k + '\\ln ' + a + ' - ' + k + '\\ln b'; }
      else { o.Fb = o.inf ? co + '*' + pow() + ' - (' + cl(Fa) + ')' : '(' + cl(Fa) + ') - ' + co + '*' + pow(); var bt = 'b^{' + ftex(e1.n, e1.d) + '}'; o.Fbtex = o.inf ? ctex(k * e1.d, e1.n, bt, true) + ' - ' + '\\left(' + ftex(Math.round(Fa * 1e6), 1e6) + '\\right)' : ''; }
      o.conv = o.inf ? p > 1 : p < 1;
      o.value = o.conv ? (o.inf ? -Fa : Fa) : null;
      if(o.conv && !o.inf) o.value = Fa;
      if(o.conv && o.inf) o.value = -Fa;
      o.dom = o.inf ? [a + 0.5, a + 8] : [0.05 * a, 0.95 * a];
      o.mis = [{ expr: '-(' + o.Fb + ')', why: o.inf ? 'Order: upper bound minus lower bound, F(b) − F(' + a + ').' : 'Order: upper bound minus lower bound, F(' + a + ') − F(b).' }];
      if(p !== 1) o.mis.push({ expr: o.inf ? fstr(-k * pd, pn + pd) + '*b^(-' + fstr(pn + pd, pd) + ') - ' + fstr(-k * pd, pn + pd) + '*' + a + '^(-' + fstr(pn + pd, pd) + ')' : fstr(-k * pd, pn + pd) + '*' + a + '^(-' + fstr(pn + pd, pd) + ') - ' + fstr(-k * pd, pn + pd) + '*b^(-' + fstr(pn + pd, pd) + ')', why: 'Raise the power by 1: x^(−p) has antiderivative x^(1−p)/(1−p), not x^(−p−1)/(−p−1).' });
      o.p = p;
    }
    var lims = o.inf ? '\\lim_{b \\to \\infty} \\int_{' + o.a + '}^{b}' : '\\lim_{b \\to 0^+} \\int_{b}^{' + o.a + '}';
    var I = o.inf ? '\\int_{' + o.a + '}^{\\infty} ' + o.ftex + '\\,dx' : '\\int_{0}^{' + o.a + '} ' + o.ftex + '\\,dx';
    var setups = o.inf ? [['$' + lims + ' ' + o.ftex + '\\,dx$', 'Right: replace $\\infty$ by $b$, integrate, then take the limit.'],
      ['$F(\\infty) - F(' + o.a + ')$', 'There is no $F(\\infty)$: arithmetic with $\\infty$ earns no credit. Write the limit of a definite integral and keep the limit notation to the end.'],
      ['$\\lim_{x \\to \\infty} ' + o.ftex + '$', 'That is the limit of the integrand. It going to 0 does not decide whether the area is finite ($\\frac{1}{x}$ goes to 0 and its integral diverges).'],
      ['$\\lim_{b \\to 0^+} \\int_{b}^{' + o.a + '} ' + o.ftex + '\\,dx$', 'The trouble is at the infinite upper bound, so the limit goes there: $b \\to \\infty$.']]
      : [['$' + lims + ' ' + o.ftex + '\\,dx$', 'Right: the integrand is unbounded at $x = 0$, so approach 0 from the right with a limit.'],
      ['$F(' + o.a + ') - F(0)$', 'The integrand is not defined at $x = 0$ (it is unbounded there), so the Fundamental Theorem does not apply directly. Use a limit.'],
      ['$\\lim_{b \\to \\infty} \\int_{' + o.a + '}^{b} ' + o.ftex + '\\,dx$', 'The interval here is finite: the trouble is at $x = 0$, where the integrand is unbounded.'],
      ['$\\lim_{b \\to 0^-} \\int_{b}^{' + o.a + '} ' + o.ftex + '\\,dx$', 'The interval is $[0, ' + o.a + ']$: approach 0 from inside it, from the right.']];
    var sh = shuffle(r, setups);
    var cv = [['Converges: the limit is a finite number', 'Right: the limit of the definite integrals exists and is finite.'],
      ['Diverges: the limit is infinite', 'The limit of the definite integrals is a finite number, so the integral converges.'],
      [o.inf ? 'Converges, because the integrand approaches 0' : 'Converges, because the interval is finite', o.inf ? 'An integrand going to 0 is not enough ($\\frac{1}{x}$ does too, and diverges). Decide from the limit.' : 'A finite interval is not enough when the integrand is unbounded. Decide from the limit.'],
      [o.inf ? 'Diverges, because the interval is infinite' : 'Diverges, because the integrand is unbounded', 'Not by itself: decide from the limit of the definite integrals.']];
    if(!o.conv){ var t = cv[0]; cv[0] = ['Diverges: the limit is infinite', 'Right: ' + (o.inf ? 'as $b \\to \\infty$' : 'as $b \\to 0^+$') + ' the definite integrals grow without bound.']; cv[1] = ['Converges: the limit is a finite number', 'Check the limit: ' + (o.p === 1 ? '$\\ln b$' : 'the power of $b$') + ' grows without bound, so there is no finite limit.']; }
    var sh2 = shuffle(r, cv);
    var steps = [
      stepChoice('is', H('Write $' + I + '$ as'), sh.options, sh.correct, sh.why, { practice: '1.C', level: 'apply' }),
      stepExpr('ia', H('$' + (o.inf ? '\\int_{' + o.a + '}^{b}' : '\\int_{b}^{' + o.a + '}') + ' ' + o.ftex + '\\,dx$ in terms of $b$'), o.Fb, { vars: ['b'], domain: o.dom, mode: 'exact', mistakes: o.mis }, { practice: '1.E', level: 'apply', hint: H('Find an antiderivative, then subtract: upper bound minus lower bound.') }),
      stepChoice('ic', H('So the improper integral'), sh2.options, sh2.correct, sh2.why, { practice: '3.D', level: 'analyze' })
    ];
    if(o.conv) steps.push(stepNum('iv', H('Its value (exact, or to three decimal places)'), val(o.value, [{ value: -o.value, why: 'Sign: upper bound minus lower bound.' }]), { d: 3, practice: '1.E', level: 'apply' }));
    var sol = [H('$' + I + ' = ' + lims + ' ' + o.ftex + '\\,dx$.'), H('The definite integral is a function of $b$: $' + plainB(o) + '$.'),
      H(o.conv ? 'As $' + (o.inf ? 'b \\to \\infty' : 'b \\to 0^+') + '$ the $b$ term goes to 0, so the integral converges to $' + M.fixed(o.value, 3).replace(/\.?0+$/, '') + '$.' : 'As $' + (o.inf ? 'b \\to \\infty' : 'b \\to 0^+') + '$ it grows without bound, so the integral diverges.')];
    return { ctx: ctx.id, topic: ctx.topic, type: 'improper',
      text: H('<p>Decide whether $' + I + '$ converges, and find its value if it does.</p>'),
      steps: steps, solution: sol,
      fig: { kind: 'improper', f: o.f, a: o.a, inf: o.inf, Fb: o.Fb, conv: o.conv, value: o.value } };
  }
  function exprTexOf(s){ var E = G.ApCalcExpr; try{ return E ? E.toTex(E.parse(s, { vars: ['x'] })) : s; }catch(e){ return s; } }
  function plainB(o){ var E = G.ApCalcExpr; try{ return E ? E.toTex(E.parse(o.Fb, { vars: ['b'] })) : o.Fb; }catch(e){ return o.Fb; } }

  /* ------------------------------------------------------ which method */
  var METHODS = ['u-substitution', 'Integration by parts', 'Partial fractions (linear factors)', 'Rewrite with algebra, then basic rules'];
  var METHOD_WHY = {
    sub: 'An inner function sits inside, and its derivative (up to a constant) is the other factor: substitute $u$ = the inner function.',
    parts: 'A product of two unrelated kinds of function (a power of $x$ times an exponential, a trig function or a logarithm): no inner derivative to cancel, so integrate by parts.',
    pf: 'A rational function whose denominator factors into distinct linear factors and whose numerator is not a multiple of the denominator\'s derivative: split it into partial fractions.',
    alg: 'Divide or expand first: it becomes a sum of powers of $x$ (and $\\frac{1}{x}$), each integrated by the basic rules.' };
  function pool(r){
    var k = r.pick([1, 2, 3]), a = r.pick([2, 3]), c = r.pick([1, 4, 9]);
    return [
      { m: 'sub', tex: 'xe^{x^2}', f: 'x*e^(x^2)', F: 'e^(x^2)/2', inner: 'x^2', outer: 'e^u', ftex2: '\\frac{1}{2}e^{x^2}', dom: [-1.5, 1.5] },
      { m: 'sub', tex: k + 'x\\cos(x^2)', f: k + '*x*cos(x^2)', F: fstr(k, 2) + '*sin(x^2)', inner: 'x^2', ftex2: ctex(k, 2, '\\sin(x^2)', true), dom: [-1.5, 1.5] },
      { m: 'sub', tex: '\\frac{x}{x^2 + ' + c + '}', f: 'x/(x^2 + ' + c + ')', F: 'ln(x^2 + ' + c + ')/2', inner: 'x^2 + ' + c, ftex2: '\\frac{1}{2}\\ln(x^2 + ' + c + ')', dom: [-3, 3], trap: 'pf' },
      { m: 'sub', tex: '\\frac{\\ln x}{x}', f: 'ln(x)/x', F: 'ln(x)^2/2', inner: 'ln(x)', ftex2: '\\frac{(\\ln x)^2}{2}', dom: [0.3, 4], trap: 'parts' },
      { m: 'sub', tex: '\\sin x\\cos^2 x', f: 'sin(x)*cos(x)^2', F: '-cos(x)^3/3', inner: 'cos(x)', ftex2: '-\\frac{\\cos^3 x}{3}', dom: [-3, 3], trap: 'parts' },
      { m: 'sub', tex: '\\frac{2x + ' + a + '}{x^2 + ' + a + 'x + ' + (a * a) + '}', f: '(2*x + ' + a + ')/(x^2 + ' + a + '*x + ' + (a * a) + ')', F: 'ln(x^2 + ' + a + '*x + ' + (a * a) + ')', inner: 'x^2 + ' + a + '*x + ' + (a * a), ftex2: '\\ln(x^2 + ' + a + 'x + ' + (a * a) + ')', dom: [-3, 3], trap: 'pf' },
      { m: 'parts', tex: 'xe^{' + a + 'x}', f: 'x*e^(' + a + '*x)', F: 'x*e^(' + a + '*x)/' + a + ' - e^(' + a + '*x)/' + (a * a), ftex2: '\\frac{x}{' + a + '}e^{' + a + 'x} - \\frac{1}{' + (a * a) + '}e^{' + a + 'x}', dom: [-1.5, 1.5], trap: 'sub' },
      { m: 'parts', tex: 'x\\sin x', f: 'x*sin(x)', F: 'sin(x) - x*cos(x)', ftex2: '\\sin x - x\\cos x', dom: [-3, 3], trap: 'sub' },
      { m: 'parts', tex: '\\ln x', f: 'ln(x)', F: 'x*ln(x) - x', ftex2: 'x\\ln x - x', dom: [0.3, 4], trap: 'alg' },
      { m: 'parts', tex: 'x^2\\ln x', f: 'x^2*ln(x)', F: 'x^3*ln(x)/3 - x^3/9', ftex2: '\\frac{x^3}{3}\\ln x - \\frac{x^3}{9}', dom: [0.3, 3], trap: 'sub' },
      { m: 'pf', tex: '\\frac{1}{x^2 - ' + (a * a) + '}', f: '1/(x^2 - ' + (a * a) + ')', F: '(ln(abs(x - ' + a + ')) - ln(abs(x + ' + a + ')))/' + (2 * a), ftex2: '\\frac{1}{' + (2 * a) + '}\\ln|x - ' + a + '| - \\frac{1}{' + (2 * a) + '}\\ln|x + ' + a + '|', dom: [-a - 2, a + 2], p: a, q: -a, A: 1 / (2 * a), B: -1 / (2 * a), trap: 'sub' },
      { m: 'pf', tex: '\\frac{' + (a + 1) + '}{(x - 1)(x + ' + a + ')}', f: (a + 1) + '/((x - 1)*(x + ' + a + '))', F: 'ln(abs(x - 1)) - ln(abs(x + ' + a + '))', ftex2: '\\ln|x - 1| - \\ln|x + ' + a + '|', dom: [-a - 2, 3], p: 1, q: -a, A: 1, B: -1, trap: 'sub' },
      { m: 'pf', tex: '\\frac{x}{(x - 1)(x - ' + a + ')}', f: 'x/((x - 1)*(x - ' + a + '))', F: fstr(-1, a - 1) + '*ln(abs(x - 1)) + ' + fstr(a, a - 1) + '*ln(abs(x - ' + a + '))', ftex2: ctex(-1, a - 1, '\\ln|x - 1|', true) + ctex(a, a - 1, '\\ln|x - ' + a + '|', false), dom: [-1, a + 2], p: 1, q: a, A: -1 / (a - 1), B: a / (a - 1), trap: 'sub' },
      { m: 'alg', tex: '\\frac{x^2 + ' + c + '}{x}', f: '(x^2 + ' + c + ')/x', F: 'x^2/2 + ' + c + '*ln(abs(x))', ftex2: '\\frac{x^2}{2} + ' + c + '\\ln|x|', dom: [-3, 3], terms: [[1, 1], [c, -1]], trap: 'pf' },
      { m: 'alg', tex: '\\frac{x^2 - ' + (a * a) + '}{x - ' + a + '}', f: '(x^2 - ' + (a * a) + ')/(x - ' + a + ')', F: 'x^2/2 + ' + a + '*x', ftex2: '\\frac{x^2}{2} + ' + a + 'x', dom: [-3, 3], terms: [[1, 1], [a, 0]], trap: 'pf' },
      { m: 'alg', tex: '\\frac{x + ' + k + '}{\\sqrt{x}}', f: '(x + ' + k + ')/sqrt(x)', F: '(2/3)*x^(3/2) + ' + (2 * k) + '*sqrt(x)', ftex2: '\\frac{2}{3}x^{3/2} + ' + (2 * k) + '\\sqrt{x}', dom: [0.2, 4], terms: [[1, 0.5], [k, -0.5]], trap: 'sub' }
    ];
  }
  function genChoose(r, ctx){
    var P0 = pool(r), want = r.pick(['sub', 'parts', 'pf', 'alg']), list = P0.filter(function(x){ return x.m === want; }), it = r.pick(list);
    var order = ['sub', 'parts', 'pf', 'alg'], right = order.indexOf(it.m);
    var opts = order.map(function(m, i){ return [METHODS[i], i === right ? 'Right. ' + METHOD_WHY[m] : wrongWhy(m, it)]; });
    var first = opts.splice(right, 1)[0]; opts.unshift(first);
    var sh = shuffle(r, opts);
    return { ctx: ctx.id, topic: ctx.topic, type: 'choose',
      text: H('<p>Which method finds $\\int ' + it.tex + '\\,dx$ most directly? Then find it.</p>'),
      steps: [
        stepChoice('cm', H('The method'), sh.options, sh.correct, sh.why, { practice: '1.C', level: 'analyze' }),
        stepExpr('cr', H('$\\int ' + it.tex + '\\,dx =$'), it.F, { vars: ['x'], domain: it.dom, mode: 'constant', mistakes: [] }, { practice: '1.E', level: 'apply' })
      ],
      solution: [H(METHOD_WHY[it.m]), H('$\\int ' + it.tex + '\\,dx = ' + it.ftex2 + ' + C$.')],
      fig: { kind: 'choose', m: it.m, f: it.f, F: it.F, inner: it.inner || null, p: it.p, q: it.q, A: it.A, B: it.B, terms: it.terms || null, dom: it.dom } };
  }
  function wrongWhy(m, it){
    var right = it.m;
    if(m === 'sub') return right === 'parts' ? 'Look for an inner function whose derivative is the other factor: there is none here. ' + (/ln/.test(it.f) ? 'Nothing pairs with the logarithm.' : 'The factor $x$ is not the derivative of anything inside.') : right === 'pf' ? 'The numerator is not a constant times the derivative of the denominator, so $u$ = the denominator does not work.' : 'No substitution is needed: simplify first.';
    if(m === 'parts') return right === 'sub' ? 'Parts would work harder than needed: the derivative of the inner function is already there, so substitute.' : right === 'pf' ? 'This is a rational function with linear factors below: split it, do not use parts.' : 'After dividing it is a sum of powers: no product to split.';
    if(m === 'pf') return right === 'sub' ? (/x\^2 \+/.test(it.f) ? 'The denominator does not factor into linear factors over the reals' + (it.trap === 'pf' && /2\*x/.test(it.f) ? ', and its derivative is the numerator: substitute.' : '.') : 'There is no rational function with factored denominator here.') : right === 'parts' ? 'There is no rational function to split.' : 'Divide first: the numerator\'s degree is not lower than the denominator\'s, or the fraction simplifies.';
    return right === 'alg' ? '' : 'Algebra alone does not turn this into basic forms: ' + (right === 'sub' ? 'it needs a substitution.' : right === 'parts' ? 'it needs parts.' : 'it needs partial fractions.');
  }

  var GEN = { parts: genParts, tabular: genTabular, partial: genPartial, improper: genImproper, choose: genChoose };
  function generate(r, ctx, type){
    var kind = type || ctx.kind || 'parts';
    if(!GEN[kind]) throw new Error('integrationMethods.generate: no problem kind "' + kind + '"');
    return GEN[kind](r, ctx);
  }

  M.register('integrationMethods', {
    PARTS: PARTS, parts: parts, partsPicture: partsPicture, PF: PF, pfOf: pfOf, IMPROPER: IMPROPER, improper: improper, partial: partial,
    METHODS: METHODS, generate: generate, KINDS: Object.keys(GEN), ftex: ftex, fstr: fstr
  });
})(typeof window !== 'undefined' ? window : globalThis);
