/* Taylor lab: the model (docs/apcalcbc-architecture.md, "Trainers"; spec section 6). OWNED BY
   THIS TOOL ONLY (builder T1). Registers ApCalcMath.taylorLab; pure functions, no DOM, so
   scripts/lib/apcalcbc-tool-checks/taylor-lab.mjs runs it in node with the code the page runs.

   Explore
     FUNCS                        the gallery: { id, chip, tex, f(x), d(k, t) (the kth derivative),
                                    lo, hi (domain), view, centers: [a, b], alt(c, t) }
     coef(F, c, n)                [f(c), f'(c)/1!, ..., f^(n)(c)/n!]
     poly(F, c, n, x)             P_n(x) about c
     polyTex(F, c, n)             P_n written out term by term (no "+ ...": a polynomial, not a series)
     maxAbsDeriv(F, k, a, b)      max |f^(k)| on [a, b] (exact for e^x, sin, cos, ln(1 + x), 1/(1 - x);
                                    sampled for arctan)
     lagrange(F, c, n, x)         { M, bound }: M |x - c|^(n+1) / (n+1)!, M on the interval from c to x
     altBound(F, c, n, x)         the first omitted nonzero term's size when the series at x alternates
                                    with terms decreasing in size from there on; else null
   Test yourself
     generate(rng, ctx, type)     a seeded problem in ApCalcTools.drill's format. Kinds:
       coef       a table of derivatives at c: coefficients, P_3, an approximation; or P_4 given:
                  f''(c), f'''(c), local max or min
       maclaurin  from a known series (ctx.fams 'known') or built by substituting, multiplying,
                  differentiating or integrating ('built'): a coefficient, P_n, f^(m)(0)
       lagrange   the maximum of |f^(n+1)|, the Lagrange bound, is the approximation good enough
       altbound   an alternating series ('series') or a Taylor polynomial at a point ('taylor'):
                  why the bound applies, the bound, how many terms
     Every problem carries chk (the givens) and codes (one code per option of each choice step),
     so the validator recomputes each key with its own code. */
(function(G){
  'use strict';
  var M = G.ApCalcMath;
  if(!M) return;
  function H(s){ var t = G.ApCalcTex; return t ? t.html(s) : s; }
  function fact(n){ var p = 1; for(var k = 2; k <= n; k++) p *= k; return p; }
  function fracOf(v){
    if(!isFinite(v)) return null;
    for(var d = 1; d <= 5040; d++) if(Math.abs(v * d - Math.round(v * d)) < 1e-9 * Math.max(1, Math.abs(v * d))) return { n: Math.round(v * d), d: d };
    return null;
  }
  function tn(v){ var f = fracOf(v); if(f && f.d === 1) return String(f.n); if(f) return (f.n < 0 ? '-' : '') + '\\frac{' + Math.abs(f.n) + '}{' + f.d + '}'; return String(+v.toFixed(4)); }
  // a number in the student syntax (for expression keys): 3, -1/6
  function en(v){ var f = fracOf(v); if(f && f.d === 1) return String(f.n); if(f) return '(' + f.n + '/' + f.d + ')'; return String(v); }
  function dn(v, d){ var s = (+v).toFixed(d == null ? 3 : d); return /^-0\.?0*$/.test(s) ? s.slice(1) : s; }
  function sci(v){ if(!isFinite(v)) return '?'; var a = Math.abs(v); if(a !== 0 && a < 0.001){ var e = Math.floor(Math.log10(a)), m = v / Math.pow(10, e); return (+m.toFixed(2)) + ' \\times 10^{' + e + '}'; } return String(+v.toPrecision(3)); }
  function cellX(ans, mis){ return M.cell(ans, 0, mis || [], 0.0011); }
  function cellR(ans, mis){ return M.cell(ans, 0.006, mis || [], 0); }
  function shuffle(r, n){ var idx = []; for(var i = 0; i < n; i++) idx.push(i); for(i = n - 1; i > 0; i--){ var j = Math.floor(r() * (i + 1)), t = idx[i]; idx[i] = idx[j]; idx[j] = t; } return idx; }
  function choice(r, key, label, list, o, codes){
    o = o || {};
    var idx = shuffle(r, list.length), opts = idx.map(function(i){ return list[i]; });
    codes[key] = opts.map(function(x){ return x.code; });
    return { key: key, kind: 'choice', label: label, options: opts.map(function(x){ return H(x.html); }), correct: idx.indexOf(0), why: opts.map(function(x){ return H(x.why); }), hint: o.hint, practice: o.practice || '3.D', level: o.level || 'analyze' };
  }
  function stepNum(key, label, cell, o){ o = o || {}; return { key: key, kind: 'num', label: label, cell: cell, d: o.d, hint: o.hint, practice: o.practice || '1.E', level: o.level || 'apply' }; }
  function stepExpr(key, label, answer, opts, o){ o = o || {}; return { key: key, kind: 'expr', label: label, lhs: o.lhs, cell: M.exprCell(answer, opts), hint: o.hint, practice: o.practice || '1.E', level: o.level || 'apply' }; }
  /* (x - c) in TeX and in the student syntax */
  function xc(c){ return c === 0 ? 'x' : '(x ' + (c < 0 ? '+ ' + (-c) : '- ' + c) + ')'; }
  function xcs(c){ return c === 0 ? 'x' : '(x' + (c < 0 ? '+' + (-c) : '-' + c) + ')'; }
  /* A polynomial sum of a_k (x - c)^k: TeX (term by term) and the student syntax. */
  function polyOf(cs, c, from){
    var t = [], s = [];
    cs.forEach(function(a, k){
      k += from || 0;
      if(Math.abs(a) < 1e-12) return;
      var X = k === 0 ? '' : k === 1 ? xc(c) : xc(c) + '^{' + k + '}', Xs = k === 0 ? '' : k === 1 ? xcs(c) : xcs(c) + '^' + k;
      var f = fracOf(Math.abs(a)), mag = k === 0 ? tn(Math.abs(a)) : (f && f.d === 1 ? (f.n === 1 ? '' : String(f.n)) : f ? '\\frac{' + f.n + '}{' + f.d + '}' : String(+Math.abs(a).toFixed(4)));
      if(k > 0 && f && f.d > 1 && f.n === 1) mag = '\\frac{' + X + '}{' + f.d + '}', X = '';
      t.push((a < 0 ? (t.length ? ' - ' : '-') : (t.length ? ' + ' : '')) + mag + X);
      s.push((t.length > 1 || s.length ? (a < 0 ? ' - ' : ' + ') : (a < 0 ? '-' : '')) + (k === 0 ? en(Math.abs(a)) : en(Math.abs(a)) + '*' + Xs));
    });
    return { tex: t.join('') || '0', s: s.join('') || '0' };
  }

  /* ------------------------------------------------------- the gallery */
  var HALFPI = Math.PI / 2;
  var FUNCS = [
    { id: 'exp', chip: 'eˣ', tex: 'e^x', f: Math.exp, d: function(k, t){ return Math.exp(t); }, lo: -Infinity, hi: Infinity, view: { x: [-3.2, 3.2], y: [-1.5, 9] }, centers: [-2, 2],
      altNote: 'At a negative $x$ the terms $\\frac{x^k}{k!}$ alternate in sign.', alt: function(c, t){ return c === 0 && t < 0; } },
    { id: 'sin', chip: 'sin x', tex: '\\sin x', f: Math.sin, d: function(k, t){ return Math.sin(t + k * HALFPI); }, lo: -Infinity, hi: Infinity, view: { x: [-7, 7], y: [-2.6, 2.6] }, centers: [-3, 3], periodic: true,
      altNote: 'About 0 the nonzero terms $\\pm\\frac{x^{2k+1}}{(2k+1)!}$ alternate in sign.', alt: function(c){ return c === 0; } },
    { id: 'cos', chip: 'cos x', tex: '\\cos x', f: Math.cos, d: function(k, t){ return Math.cos(t + k * HALFPI); }, lo: -Infinity, hi: Infinity, view: { x: [-7, 7], y: [-2.6, 2.6] }, centers: [-3, 3], periodic: true,
      altNote: 'About 0 the nonzero terms $\\pm\\frac{x^{2k}}{(2k)!}$ alternate in sign.', alt: function(c){ return c === 0; } },
    { id: 'ln', chip: 'ln(1 + x)', tex: '\\ln(1 + x)', f: function(x){ return x > -1 ? Math.log(1 + x) : NaN; }, d: function(k, t){ return k === 0 ? Math.log(1 + t) : (k % 2 ? 1 : -1) * fact(k - 1) / Math.pow(1 + t, k); }, lo: -1, hi: Infinity, view: { x: [-0.98, 3], y: [-3, 2] }, centers: [-0.5, 1.5],
      altNote: 'About 0 the terms $(-1)^{k+1}\\frac{x^k}{k}$ alternate for $0 < x \\le 1$.', alt: function(c, t){ return c === 0 && t > 0 && t <= 1; } },
    { id: 'geo', chip: '1/(1 − x)', tex: '\\frac{1}{1 - x}', f: function(x){ return x < 1 ? 1 / (1 - x) : NaN; }, d: function(k, t){ return fact(k) / Math.pow(1 - t, k + 1); }, lo: -Infinity, hi: 1, view: { x: [-3, 0.97], y: [-1, 7] }, centers: [-2, 0.5],
      altNote: 'About 0 the terms $x^k$ alternate for $-1 < x < 0$.', alt: function(c, t){ return c === 0 && t < 0 && t > -1; } },
    { id: 'atan', chip: 'arctan x', tex: '\\arctan x', f: Math.atan, d: function(k, t){ if(k === 0) return Math.atan(t); var th = Math.atan(t); return fact(k - 1) * Math.pow(Math.cos(th), k) * Math.sin(k * (th + HALFPI)); }, lo: -Infinity, hi: Infinity, view: { x: [-3, 3], y: [-2.2, 2.2] }, centers: [-1.5, 1.5], sampled: true,
      altNote: 'About 0 the nonzero terms $\\pm\\frac{x^{2k+1}}{2k+1}$ alternate for $|x| \\le 1$.', alt: function(c, t){ return c === 0 && Math.abs(t) <= 1; } }
  ];
  function funcById(id){ for(var i = 0; i < FUNCS.length; i++) if(FUNCS[i].id === id) return FUNCS[i]; return null; }
  function coef(F, c, n){ var out = []; for(var k = 0; k <= n; k++) out.push(F.d(k, c) / fact(k)); return out; }
  function poly(F, c, n, x){ var cs = coef(F, c, n), s = 0, p = 1; for(var k = 0; k <= n; k++){ s += cs[k] * p; p *= (x - c); } return s; }
  // tiny coefficients (sin x at its zeros) are zero, not 1e-17
  function clean(cs){ return cs.map(function(a){ return Math.abs(a) < 1e-12 ? 0 : a; }); }
  function polyTex(F, c, n){
    var cs = clean(coef(F, c, n)), exact = F.id !== 'atan' && (c === 0 || F.id === 'ln' || F.id === 'geo');
    if(exact || cs.every(function(a){ return fracOf(a); })) return polyOf(cs, c).tex;
    // decimals for e^c, sin c, ... at a general center
    return cs.map(function(a, k){ if(!a) return ''; var X = k === 0 ? '' : k === 1 ? xc(c) : xc(c) + '^{' + k + '}'; return (a < 0 ? ' - ' : ' + ') + dn(Math.abs(a), 3) + X; }).join('').replace(/^ \+ /, '').replace(/^ - /, '-') || '0';
  }
  function maxAbsDeriv(F, k, a, b){
    if(a > b){ var t = a; a = b; b = t; }
    var m = Math.max(Math.abs(F.d(k, a)), Math.abs(F.d(k, b)));
    if(F.periodic){
      // |sin(s + k pi/2)| or |cos(...)| reaches 1 where its argument (shifted) is an odd multiple of pi/2
      var off = (F.id === 'sin' ? 0 : HALFPI) + k * HALFPI, j = Math.ceil((a + off - HALFPI) / Math.PI);
      if(HALFPI + j * Math.PI - off <= b) m = 1;
    }
    if(F.sampled) for(var i = 1; i < 800; i++) m = Math.max(m, Math.abs(F.d(k, a + (b - a) * i / 800)));
    return m;
  }
  function lagrange(F, c, n, x){ var Mx = maxAbsDeriv(F, n + 1, c, x); return { M: Mx, bound: Mx * Math.pow(Math.abs(x - c), n + 1) / fact(n + 1) }; }
  function altBound(F, c, n, x){
    if(!F.alt(c, x)) return null;
    var cs = coef(F, c, n + 60), terms = [];
    for(var k = n + 1; k < cs.length; k++){ var v = cs[k] * Math.pow(x - c, k); if(Math.abs(v) > 1e-300 && Math.abs(cs[k]) > 1e-13) terms.push({ k: k, v: v }); }
    if(!terms.length) return null;
    for(var i = 1; i < terms.length && i < 30; i++) if(Math.sign(terms[i].v) === Math.sign(terms[i - 1].v) || Math.abs(terms[i].v) > Math.abs(terms[i - 1].v)) return null;
    return { bound: Math.abs(terms[0].v), k: terms[0].k };
  }

  /* ============================================== Test yourself */
  var D3 = [-18, -12, -6, 6, 12, 18, 3, -3, 9];
  function genCoef(r, ctx){
    var codes = {}, c = r.int(-2, 3);
    if(r() < 0.55){
      var d = [r.int(-5, 5), r.nonzero(-6, 6), r.nonzero(-8, 8), r.pick(D3)], h = r.pick([0.1, 0.2, -0.1, -0.2, 0.5]);
      var cs = [d[0], d[1], d[2] / 2, d[3] / 6], P = polyOf(cs, c), x1 = c + h;
      var Pv = cs[0] + cs[1] * h + cs[2] * h * h + cs[3] * h * h * h, P2v = cs[0] + cs[1] * h + cs[2] * h * h;
      var nofact = polyOf(d, c).s, at0 = polyOf(cs, 0).s;
      var tbl = '<table class="ls-tbl tl-dtab"><caption>Values of $f$ and its derivatives at $x = ' + c + '$</caption><thead><tr><th scope="col">$f(' + c + ')$</th><th scope="col">$f\'(' + c + ')$</th><th scope="col">$f\'\'(' + c + ')$</th><th scope="col">$f\'\'\'(' + c + ')$</th></tr></thead><tbody><tr><td>' + d[0] + '</td><td>' + d[1] + '</td><td>' + d[2] + '</td><td>' + d[3] + '</td></tr></tbody></table>';
      var steps = [
        stepNum('c2', H('The coefficient of $' + xc(c) + '^2$ in $P_3(x)$'), cellX(d[2] / 2, [{ value: d[2], why: H('Divide by $2! = 2$: the coefficient is $\\frac{f\'\'(' + c + ')}{2!}$.') }]), { d: 3, hint: H('$\\frac{f\'\'(' + c + ')}{2!}$') }),
        stepNum('c3', H('The coefficient of $' + xc(c) + '^3$'), cellX(d[3] / 6, [{ value: d[3], why: H('Divide by $3! = 6$.') }, { value: d[3] / 3, why: H('$3! = 3 \\cdot 2 \\cdot 1 = 6$, not 3.') }, { value: d[3] / 2, why: H('That divides by 2; the cubic term divides by $3! = 6$.') }]), { d: 3, hint: H('$\\frac{f\'\'\'(' + c + ')}{3!}$') }),
        stepExpr('P3', H('Write the third-degree Taylor polynomial for $f$ about $x = ' + c + '$.'), P.s, { vars: ['x'], domain: [c - 1, c + 1], mistakes: [
          { expr: nofact, why: 'Each derivative is divided by its factorial: f\'\'(' + c + ')/2! and f\'\'\'(' + c + ')/3!.' },
          { expr: at0, why: 'The polynomial is in powers of ' + (c === 0 ? 'x' : xcs(c)) + ', not x: the center is x = ' + c + '.' }].filter(function(m){ return c !== 0 || m.expr !== at0; }) }, { lhs: 'P_3(x) =', hint: H('$P_3(x) = f(' + c + ') + f\'(' + c + ')' + xc(c) + ' + \\frac{f\'\'(' + c + ')}{2!}' + xc(c) + '^2 + \\frac{f\'\'\'(' + c + ')}{3!}' + xc(c) + '^3$. Type powers with ^.') }),
        stepNum('approx', H('Use $P_3$ to approximate $f(' + tn(x1) + ')$.'), cellX(Pv, [{ value: P2v, why: H('That is $P_2(' + tn(x1) + ')$: include the cubic term too.') }, { value: d[0] + d[1] * h + d[2] * h * h + d[3] * h * h * h, why: H('Use the coefficients with the factorials, $\\frac{f^{(k)}(' + c + ')}{k!}$.') }, { value: cs[0] + cs[1] * x1 + cs[2] * x1 * x1 + cs[3] * x1 * x1 * x1, why: H('Put in $x - ' + c + ' = ' + tn(h) + '$, not $x = ' + tn(x1) + '$.') }]), { d: 3, practice: '1.E', hint: H('Put $x = ' + tn(x1) + '$ into $P_3$: $' + xc(c) + ' = ' + tn(h) + '$.') })
      ];
      return { ctx: ctx.id, topic: ctx.topic, type: 'coef', text: H('<p>A function $f$ has derivatives of all orders. The table gives $f$ and its first three derivatives at $x = ' + c + '$.</p>' + tbl),
        steps: steps, solution: [H('$P_3(x) = ' + P.tex + '$ (each derivative over its factorial).'), H('$f(' + tn(x1) + ') \\approx P_3(' + tn(x1) + ') = ' + dn(Pv, 4) + '$.')],
        fig: { kind: 'coef', c: c, cs: cs, x1: x1 }, chk: { v: 'fwd', c: c, d: d, h: h }, codes: codes };
    }
    // P_4 given: read the derivatives back, and the local behavior at c
    var a = [r.int(-4, 4), 0, r.nonzero(-5, 5) / r.pick([1, 2]), r.nonzero(-4, 4) / r.pick([1, 3]), r.nonzero(-3, 3) / r.pick([1, 4])], Pg = polyOf(a, c);
    var mn = a[2] > 0;
    var steps2 = [
      stepNum('d2', H('Find $f\'\'(' + c + ')$.'), cellX(2 * a[2], [{ value: a[2], why: H('The coefficient is $\\frac{f\'\'(' + c + ')}{2!}$: multiply it by 2.') }]), { d: 3, hint: H('Coefficient of $' + xc(c) + '^2$ times $2!$.') }),
      stepNum('d3', H('Find $f\'\'\'(' + c + ')$.'), cellX(6 * a[3], [{ value: a[3], why: H('The coefficient is $\\frac{f\'\'\'(' + c + ')}{3!}$: multiply it by $3! = 6$.') }, { value: 3 * a[3], why: H('$3! = 6$, not 3.') }]), { d: 3, hint: H('Coefficient of $' + xc(c) + '^3$ times $3!$.') }),
      choice(r, 'ext', H('What does $f$ do at $x = ' + c + '$?'), [
        { code: mn ? 'min' : 'max', html: 'A local ' + (mn ? 'minimum' : 'maximum') + ': $f\'(' + c + ') = 0$ and $f\'\'(' + c + ') ' + (mn ? '> 0' : '< 0') + '$', why: 'Right: the linear term is missing, so $f\'(' + c + ') = 0$, and the second derivative test decides.' },
        { code: mn ? 'max' : 'min', html: 'A local ' + (mn ? 'maximum' : 'minimum') + ': $f\'(' + c + ') = 0$ and $f\'\'(' + c + ') ' + (mn ? '> 0' : '< 0') + '$', why: (mn ? 'A positive' : 'A negative') + ' second derivative at a critical point means a local ' + (mn ? 'minimum' : 'maximum') + '.' },
        { code: 'none', html: 'Neither: $f\'(' + c + ') \\ne 0$', why: 'There is no $' + xc(c) + '$ term, so $f\'(' + c + ') = 0$: it is a critical point.' },
        { code: 'cant', html: 'Cannot tell from a Taylor polynomial', why: 'The polynomial gives $f\'(' + c + ')$ and $f\'\'(' + c + ')$ exactly, and that is all the second derivative test needs.' }
      ], { practice: '3.D', level: 'analyze' }, codes)
    ];
    return { ctx: ctx.id, topic: ctx.topic, type: 'coef', text: H('<p>The fourth-degree Taylor polynomial for $f$ about $x = ' + c + '$ is $P_4(x) = ' + Pg.tex + '$.</p>'),
      steps: steps2, solution: [H('The coefficient of $' + xc(c) + '^k$ is $\\frac{f^{(k)}(' + c + ')}{k!}$, so $f^{(k)}(' + c + ') = k! \\cdot$ coefficient.'), H('$f\'\'(' + c + ') = 2 \\cdot ' + tn(a[2]) + ' = ' + tn(2 * a[2]) + '$ and $f\'\'\'(' + c + ') = 6 \\cdot ' + tn(a[3]) + ' = ' + tn(6 * a[3]) + '$.'), H('No linear term: $f\'(' + c + ') = 0$. With $f\'\'(' + c + ') ' + (mn ? '> 0' : '< 0') + '$, $f$ has a local ' + (mn ? 'minimum' : 'maximum') + ' at $x = ' + c + '$.')],
      fig: { kind: 'coef', c: c, cs: a }, chk: { v: 'rev', c: c, a: a }, codes: codes };
  }

  /* ---------- Maclaurin: from the four memorized series, or built from them */
  // each: { tex (f), s (f in the student syntax), co(k) (the coefficient of x^k), n (degree asked), m (power asked), how (worked line), R }
  var KNOWN = {
    expk: function(r){ var k = r.pick([2, 3, -1, -2]); return { tex: 'e^{' + (k === -1 ? '-' : k) + 'x}', s: 'e^(' + k + '*x)', co: function(j){ return Math.pow(k, j) / fact(j); }, n: 4, m: r.pick([3, 4]), k: k,
      how: 'Put $' + (k === -1 ? '-' : k) + 'x$ for $x$ in $e^x = 1 + x + \\frac{x^2}{2!} + \\cdots$.', slips: function(j){ return [{ value: 1 / fact(j), why: 'Substitute $' + k + 'x$, so $x^' + j + '$ comes with $' + (k < 0 ? '(' + k + ')' : k) + '^' + j + '$.' }, { value: Math.pow(k, j), why: 'Divide by $' + j + '!$ too.' }]; } }; },
    sink: function(r){ var k = r.pick([2, 3]); return { tex: '\\sin(' + k + 'x)', s: 'sin(' + k + '*x)', co: function(j){ return j % 2 ? (j % 4 === 1 ? 1 : -1) * Math.pow(k, j) / fact(j) : 0; }, n: 5, m: r.pick([3, 5]), k: k,
      how: 'Put $' + k + 'x$ for $x$ in $\\sin x = x - \\frac{x^3}{3!} + \\frac{x^5}{5!} - \\cdots$.', slips: function(j){ return [{ value: (j % 4 === 1 ? 1 : -1) / fact(j), why: 'The $(' + k + 'x)^' + j + '$ gives $' + k + '^' + j + ' = ' + Math.pow(k, j) + '$.' }, { value: (j % 4 === 1 ? 1 : -1) * k / fact(j), why: 'Raise $' + k + '$ to the power ' + j + ', not just once: $(' + k + 'x)^' + j + ' = ' + Math.pow(k, j) + 'x^' + j + '$.' }]; } }; },
    cosk: function(r){ var k = r.pick([2, 3]); return { tex: '\\cos(' + k + 'x)', s: 'cos(' + k + '*x)', co: function(j){ return j % 2 ? 0 : (j % 4 === 0 ? 1 : -1) * Math.pow(k, j) / fact(j); }, n: 4, m: r.pick([2, 4]), k: k,
      how: 'Put $' + k + 'x$ for $x$ in $\\cos x = 1 - \\frac{x^2}{2!} + \\frac{x^4}{4!} - \\cdots$.', slips: function(j){ return [{ value: (j % 4 === 0 ? 1 : -1) / fact(j), why: 'The $(' + k + 'x)^' + j + '$ gives $' + k + '^' + j + ' = ' + Math.pow(k, j) + '$.' }, { value: (j % 4 === 0 ? 1 : -1) * k / fact(j), why: 'Raise $' + k + '$ to the power ' + j + '.' }]; } }; },
    cosx2: function(r){ return { tex: '\\cos(x^2)', s: 'cos(x^2)', co: function(j){ return j % 4 ? 0 : (j % 8 === 0 ? 1 : -1) / fact(j / 2); }, n: 8, m: r.pick([4, 8]),
      how: 'Put $x^2$ for $x$ in $\\cos x = 1 - \\frac{x^2}{2!} + \\frac{x^4}{4!} - \\cdots$: $1 - \\frac{x^4}{2!} + \\frac{x^8}{4!} - \\cdots$.', slips: function(j){ return [{ value: (j % 8 === 0 ? 1 : -1) / fact(j), why: 'The factorial belongs to the original power: $x^' + j + '$ came from $(x^2)^{' + j / 2 + '}$, so divide by $' + j / 2 + '!$.' }]; } }; },
    ex2: function(r){ var sg = r.pick([1, -1]); return { tex: 'e^{' + (sg < 0 ? '-' : '') + 'x^2}', s: 'e^(' + (sg < 0 ? '-' : '') + 'x^2)', co: function(j){ return j % 2 ? 0 : Math.pow(sg, j / 2) / fact(j / 2); }, n: 6, m: r.pick([4, 6]),
      how: 'Put $' + (sg < 0 ? '-' : '') + 'x^2$ for $x$ in $e^x$: $1 ' + (sg < 0 ? '-' : '+') + ' x^2 + \\frac{x^4}{2!} ' + (sg < 0 ? '-' : '+') + ' \\frac{x^6}{3!} + \\cdots$.', slips: function(j){ return [{ value: Math.pow(sg, j / 2) / fact(j), why: 'Divide by $' + j / 2 + '!$: $x^' + j + '$ came from $(x^2)^{' + j / 2 + '}$.' }]; } }; },
    geok: function(r){ var k = r.pick([2, 3, -1, -2]); return { tex: '\\frac{1}{1 ' + (k < 0 ? '+ ' + (k === -1 ? '' : -k) : '- ' + k) + 'x}', s: '1/(1 - (' + k + ')*x)', co: function(j){ return Math.pow(k, j); }, n: 4, m: r.pick([3, 4]), k: k, R: 1 / Math.abs(k),
      how: 'Put $' + (k === -1 ? '-' : k) + 'x$ for $x$ in $\\frac{1}{1 - x} = 1 + x + x^2 + \\cdots$.', slips: function(j){ return [{ value: 1, why: 'Each $x$ becomes $' + k + 'x$, so $x^' + j + '$ comes with $' + (k < 0 ? '(' + k + ')' : k) + '^' + j + '$.' }, { value: k, why: 'Raise $' + k + '$ to the power ' + j + '.' }]; } }; }
  };
  var BUILT = {
    ln: function(){ return { tex: '\\ln(1 + x)', s: 'ln(1 + x)', co: function(j){ return j ? (j % 2 ? 1 : -1) / j : 0; }, n: 4, m: 4, how: 'Integrate $\\frac{1}{1 + x} = 1 - x + x^2 - \\cdots$ term by term from 0: $x - \\frac{x^2}{2} + \\frac{x^3}{3} - \\cdots$.', code: 'int-geo',
      slips: function(j){ return [{ value: (j % 2 ? 1 : -1), why: 'Integrating $x^{' + (j - 1) + '}$ gives $\\frac{x^' + j + '}{' + j + '}$: divide by ' + j + '.' }, { value: (j % 2 ? 1 : -1) / fact(j), why: 'Integrate the series of $\\frac{1}{1+x}$; the denominator is $' + j + '$, not $' + j + '!$.' }]; } }; },
    atan: function(){ return { tex: '\\arctan x', s: 'atan(x)', co: function(j){ return j % 2 ? (j % 4 === 1 ? 1 : -1) / j : 0; }, n: 5, m: r5(), how: 'Integrate $\\frac{1}{1 + x^2} = 1 - x^2 + x^4 - \\cdots$ term by term from 0: $x - \\frac{x^3}{3} + \\frac{x^5}{5} - \\cdots$.', code: 'int-geo2',
      slips: function(j){ return [{ value: (j % 4 === 1 ? 1 : -1) / fact(j), why: 'This is not $\\sin x$: integrating $x^{' + (j - 1) + '}$ gives $\\frac{x^' + j + '}{' + j + '}$, no factorial.' }, { value: (j % 4 === 1 ? 1 : -1), why: 'Divide by ' + j + ' when you integrate.' }]; } }; },
    dgeo: function(){ return { tex: '\\frac{1}{(1 - x)^2}', s: '1/(1 - x)^2', co: function(j){ return j + 1; }, n: 4, m: r34(), how: 'Differentiate $\\frac{1}{1 - x} = 1 + x + x^2 + x^3 + \\cdots$ term by term: $1 + 2x + 3x^2 + 4x^3 + \\cdots$.', code: 'diff-geo',
      slips: function(j){ return [{ value: j, why: 'The term $x^' + (j + 1) + '$ differentiates to $' + (j + 1) + 'x^' + j + '$.' }, { value: 1, why: 'Differentiate: the coefficients grow.' }]; } }; },
    x2ex: function(){ return { tex: 'x^2 e^x', s: 'x^2*e^x', co: function(j){ return j < 2 ? 0 : 1 / fact(j - 2); }, n: 5, m: r45(), how: 'Multiply $e^x = 1 + x + \\frac{x^2}{2!} + \\cdots$ by $x^2$: $x^2 + x^3 + \\frac{x^4}{2!} + \\frac{x^5}{3!} + \\cdots$.', code: 'mul-exp',
      slips: function(j){ return [{ value: 1 / fact(j), why: 'Multiplying by $x^2$ shifts every power up by 2: $x^' + j + '$ comes from $\\frac{x^{' + (j - 2) + '}}{' + (j - 2) + '!}$.' }]; } }; },
    xsin: function(){ return { tex: 'x\\sin x', s: 'x*sin(x)', co: function(j){ return j % 2 || j === 0 ? 0 : (j % 4 === 2 ? 1 : -1) / fact(j - 1); }, n: 6, m: r46(), how: 'Multiply $\\sin x = x - \\frac{x^3}{3!} + \\frac{x^5}{5!} - \\cdots$ by $x$: $x^2 - \\frac{x^4}{3!} + \\frac{x^6}{5!} - \\cdots$.', code: 'mul-sin',
      slips: function(j){ return [{ value: (j % 4 === 2 ? 1 : -1) / fact(j), why: 'Multiplying by $x$ raises the power but keeps the factorial: $x^' + j + '$ comes from $\\frac{x^{' + (j - 1) + '}}{' + (j - 1) + '!}$.' }]; } }; }
  };
  var PICK = null; function r5(){ return PICK.pick([3, 5]); } function r34(){ return PICK.pick([3, 4]); } function r45(){ return PICK.pick([4, 5]); } function r46(){ return PICK.pick([4, 6]); }
  var HOW = {
    'int-geo': 'Integrate the series of $\\frac{1}{1 + x}$ term by term',
    'int-geo2': 'Integrate the series of $\\frac{1}{1 + x^2}$ term by term',
    'diff-geo': 'Differentiate the series of $\\frac{1}{1 - x}$ term by term',
    'mul-exp': 'Multiply the series of $e^x$ by $x^2$',
    'mul-sin': 'Multiply the series of $\\sin x$ by $x$',
    'sub-cos': 'Put $x^2$ into the series of $\\cos x$',
    'diff-sin': 'Differentiate the series of $\\sin x$ term by term'
  };
  function genMaclaurin(r, ctx){
    PICK = r;
    var codes = {}, built = (ctx.fams || []).indexOf('built') > -1, pool = built ? BUILT : KNOWN, key = r.pick(Object.keys(pool)), F = pool[key](r), n = F.n, m = F.m;
    var cs = []; for(var j = 0; j <= n; j++) cs.push(F.co(j));
    var P = polyOf(cs, 0), am = F.co(m);
    var nofact = null, flat = null;
    if(!built && key !== 'geok'){ var c2 = cs.map(function(a, j){ return a * fact(j); }); if(key === 'cosx2' || key === 'ex2') c2 = cs.map(function(a, j){ return a * fact(j / 2 | 0); }); nofact = polyOf(c2, 0).s; }
    var allPlus = polyOf(cs.map(Math.abs), 0).s;
    var mistakes = [];
    if(nofact) mistakes.push({ expr: nofact, why: 'Divide each term by its factorial, as in the series of e^x, sin x and cos x.' });
    if(cs.some(function(a){ return a < 0; })) mistakes.push({ expr: allPlus, why: 'Check the signs: the terms alternate.' });
    if(F.k && Math.abs(F.k) > 1){ var noPow = polyOf(cs.map(function(a, j){ return j ? a / Math.pow(F.k, j) * F.k : a; }), 0).s; mistakes.push({ expr: noPow, why: 'Substituting ' + F.k + 'x raises ' + F.k + ' to each power: (' + F.k + 'x)^j = ' + F.k + '^j x^j.' }); }
    var steps = [];
    if(built){
      var other = Object.keys(HOW).filter(function(k){ return k !== F.code; });
      var list = [{ code: F.code, html: HOW[F.code], why: 'Right: ' + F.how }].concat(shuffle(r, other.length).slice(0, 3).map(function(i){ return { code: other[i], html: HOW[other[i]], why: 'That gives a different function. ' + F.how }; }));
      steps.push(choice(r, 'how', H('How do you get the Maclaurin series of $' + F.tex + '$ from a series you know?'), list, { practice: '1.E', level: 'apply' }, codes));
    }
    steps.push(stepNum('co', H('The coefficient of $x^' + m + '$ in the Maclaurin series for $' + F.tex + '$'), cellX(am, F.slips(m)), { d: 3, hint: H('Exact, like ' + (fracOf(am) && fracOf(am).d > 1 ? '-4/3' : '2') + ', or three decimal places.') }));
    steps.push(stepExpr('Pn', H('Write the Taylor polynomial of degree ' + n + ' for $' + F.tex + '$ about $x = 0$.'), P.s, { vars: ['x'], domain: [-0.5, 0.5], mistakes: mistakes }, { lhs: 'P_' + n + '(x) =', hint: H('Term by term, up to $x^' + n + '$; a polynomial, so no "+ ...". Type fractions with /, as in x^3/6.') }));
    steps.push(stepNum('dm', H('Find $f^{(' + m + ')}(0)$ for $f(x) = ' + F.tex + '$.'), cellX(am * fact(m), [{ value: am, why: H('That is the coefficient, $\\frac{f^{(' + m + ')}(0)}{' + m + '!}$: multiply by $' + m + '! = ' + fact(m) + '$.') }, { value: am * m, why: H('Multiply by $' + m + '! = ' + fact(m) + '$, not by ' + m + '.') }]), { d: 3, hint: H('The coefficient of $x^' + m + '$ is $\\frac{f^{(' + m + ')}(0)}{' + m + '!}$.') }));
    return { ctx: ctx.id, topic: ctx.topic, type: 'maclaurin',
      text: H('<p>Let $f(x) = ' + F.tex + '$. ' + (built ? 'Build its Maclaurin series from one you know.' : 'Use a Maclaurin series you know.') + '</p>'),
      steps: steps, solution: [H(F.how), H('$P_' + n + '(x) = ' + P.tex + '$.'), H('The coefficient of $x^' + m + '$ is $' + tn(am) + '$, so $f^{(' + m + ')}(0) = ' + m + '! \\cdot ' + (am < 0 ? '\\left(' + tn(am) + '\\right)' : tn(am)) + ' = ' + tn(am * fact(m)) + '$.')],
      fig: { kind: 'mac', f: F.s, cs: cs, n: n }, chk: { f: F.s, n: n, m: m, code: built ? F.code : null }, codes: codes };
  }

  /* ---------- the Lagrange error bound */
  function genLagrange(r, ctx){
    var codes = {}, v = r.pick(['exp', 'exp', 'ln', 'trig', 'given']), n, c = 0, x1, Mx, Mgiven = null, fTex, fS, dTex, steps = [], mis = [];
    if(v === 'exp'){ n = r.int(2, 4); x1 = r.pick([0.1, 0.2, 0.3, 0.4, 0.5]); Mx = Math.exp(x1); fTex = 'e^x'; fS = 'exp'; dTex = 'e^t';
      mis = [{ value: 1, why: H('$e^t$ is increasing, so on $[0, ' + x1 + ']$ its largest value is at the right end, $e^{' + x1 + '}$, not $e^0$.') }]; }
    else if(v === 'ln'){ n = r.int(2, 3); x1 = r.pick([0.1, 0.2, 0.3]); Mx = fact(n); fTex = '\\ln(1 + x)'; fS = 'ln'; dTex = '\\frac{' + (n % 2 ? '-' : '') + fact(n) + '}{(1 + t)^{' + (n + 1) + '}}';
      mis = [{ value: fact(n) / Math.pow(1 + x1, n + 1), why: H('$\\frac{' + fact(n) + '}{(1 + t)^{' + (n + 1) + '}}$ decreases, so its largest value on $[0, ' + x1 + ']$ is at $t = 0$.') }, { value: fact(n - 1), why: H('Use the derivative of order $n + 1 = ' + (n + 1) + '$, not ' + n + '.') }]; }
    else if(v === 'trig'){ n = r.int(2, 4); x1 = r.pick([0.2, 0.5, 1]); Mgiven = 1; fTex = r.pick(['\\sin x', '\\cos x']); fS = fTex === '\\sin x' ? 'sin' : 'cos'; }
    else { n = r.int(2, 3); c = r.int(1, 3); x1 = c + r.pick([0.1, 0.2, 0.3, -0.1, -0.2]); Mgiven = r.pick([2, 4, 5, 6, 8, 12]); fTex = 'f(x)'; fS = null; }
    var h = Math.abs(x1 - c), bound = (Mgiven != null ? Mgiven : Mx) * Math.pow(h, n + 1) / fact(n + 1), Muse = Mgiven != null ? Mgiven : Mx;
    var eps = Math.pow(10, Math.round(Math.log10(bound) + (r() < 0.5 ? 0.6 : -0.6)));
    if(Math.abs(Math.log10(bound / eps)) < 0.08) eps *= 10;
    var good = bound < eps;
    var given = Mgiven != null ? (fS ? 'Every derivative of $' + fTex + '$ is $\\pm\\sin x$ or $\\pm\\cos x$, so $|f^{(' + (n + 1) + ')}(t)| \\le 1$ for all $t$.' : 'For $' + Math.min(c, x1) + ' \\le t \\le ' + Math.max(c, x1) + '$, $|f^{(' + (n + 1) + ')}(t)| \\le ' + Mgiven + '$.') : '';
    if(Mgiven == null) steps.push(stepNum('M', H('Find the maximum of $|f^{(' + (n + 1) + ')}(t)|$ for $t$ between $' + c + '$ and $' + x1 + '$.'), cellX(Mx, mis), { d: 3, hint: H('$f^{(' + (n + 1) + ')}(t) = ' + dTex + '$ here. Where on the interval is it largest?') }));
    else steps.push(choice(r, 'which', H('Which derivative bounds the error of $P_' + n + '$?'), [
      { code: 'n1', html: '$f^{(' + (n + 1) + ')}$, the next one after the degree', why: 'Right: the Lagrange bound uses the derivative one order above the degree of the polynomial.' },
      { code: 'n', html: '$f^{(' + n + ')}$, the same order as the degree', why: 'The error of $P_' + n + '$ is governed by the next derivative, $f^{(' + (n + 1) + ')}$.' },
      { code: 'n2', html: '$f^{(' + (n + 2) + ')}$', why: 'One order above the degree: $f^{(' + (n + 1) + ')}$.' }
    ], { practice: '3.B', level: 'analyze' }, codes));
    steps.push(stepNum('B', H('Compute the Lagrange error bound for $P_' + n + '(' + x1 + ')$.'), cellR(bound, [
      { value: Muse * Math.pow(h, n + 1) / fact(n), why: H('Divide by $(n + 1)! = ' + (n + 1) + '! = ' + fact(n + 1) + '$, not $' + n + '!$.') },
      { value: Muse * Math.pow(h, n) / fact(n), why: H('Both go up by one: $\\frac{M}{(n+1)!}|x - c|^{n+1}$ with $n + 1 = ' + (n + 1) + '$.') },
      { value: Muse * Math.pow(h, n) / fact(n + 1), why: H('The power is $n + 1 = ' + (n + 1) + '$ too: $|' + x1 + ' - ' + c + '|^{' + (n + 1) + '}$.') }]), { practice: '1.E', level: 'apply', hint: H('$\\frac{M}{(n+1)!}|x - c|^{n+1}$; three significant figures, or scientific notation like 2.5e-5.') }));
    steps.push(choice(r, 'tol', H('Is $P_' + n + '(' + x1 + ')$ guaranteed to be within $' + sci(eps) + '$ of $f(' + x1 + ')$?'), good ? [
      { code: 'yes', html: 'Yes: $|\\text{error}| \\le ' + sci(bound) + ' < ' + sci(eps) + '$', why: 'Right: the error is at most the bound, and the bound is below the tolerance.' },
      { code: 'eq', html: 'Yes: the error equals $' + sci(bound) + '$', why: 'The bound is an upper limit on the error, not its value: say "at most".' },
      { code: 'no', html: 'No: the bound is too small to be sure', why: 'A smaller bound is better: the error is at most $' + sci(bound) + '$, below the tolerance.' }
    ] : [
      { code: 'ng', html: 'Not guaranteed: the bound $' + sci(bound) + '$ is more than $' + sci(eps) + '$', why: 'Right: the bound does not show it. (The actual error may still be smaller; the bound cannot promise it.)' },
      { code: 'no', html: 'No: the error is $' + sci(bound) + '$, more than $' + sci(eps) + '$', why: 'The bound is an upper limit, not the error: the actual error may well be smaller, but it is not guaranteed.' },
      { code: 'yes', html: 'Yes: the error is at most $' + sci(bound) + '$', why: 'At most $' + sci(bound) + '$, and that is more than $' + sci(eps) + '$, so it is not guaranteed.' }
    ], { practice: '4.E', level: 'analyze' }, codes));
    var intro = fS === null ? 'The function $f$ has derivatives of all orders. ' + given + ' Let $P_' + n + '(x)$ be the Taylor polynomial of degree ' + n + ' for $f$ about $x = ' + c + '$, used to approximate $f(' + x1 + ')$.'
      : 'Let $P_' + n + '(x)$ be the Taylor polynomial of degree ' + n + ' for $f(x) = ' + fTex + '$ about $x = 0$, used to approximate $f(' + x1 + ')$.' + (given ? ' ' + given : '');
    return { ctx: ctx.id, topic: ctx.topic, type: 'lagrange', text: H('<p>' + intro + '</p>'), steps: steps,
      solution: [H(Mgiven != null ? given : '$|f^{(' + (n + 1) + ')}(t)| = ' + dTex.replace(/^\\frac\{-/, '\\frac{') + '$ is largest at $t = ' + (v === 'exp' ? x1 : 0) + '$ on the interval: $M = ' + (v === 'exp' ? 'e^{' + x1 + '} \\approx ' + dn(Mx, 4) : fact(n)) + '$.'),
        H('$|f(' + x1 + ') - P_' + n + '(' + x1 + ')| \\le \\frac{M}{' + (n + 1) + '!}|' + x1 + ' - ' + c + '|^{' + (n + 1) + '} \\approx ' + sci(bound) + '$.'), H(good ? 'That is less than $' + sci(eps) + '$: guaranteed.' : 'That is more than $' + sci(eps) + '$: the bound does not guarantee it.')],
      fig: { kind: 'lag', f: fS, c: c, n: n, x1: x1, bound: bound }, chk: { v: v, f: fS, c: c, n: n, x1: x1, M: Mgiven, eps: eps }, codes: codes };
  }

  /* ---------- the alternating series error bound */
  var ALTS = {
    p2: { tex: '\\frac{(-1)^{n+1}}{n^2}', b: function(n){ return 1 / (n * n); }, n0: 1, sumTex: '\\frac{\\pi^2}{12}', sum: Math.PI * Math.PI / 12 },
    p3: { tex: '\\frac{(-1)^{n+1}}{n^3}', b: function(n){ return 1 / (n * n * n); }, n0: 1, sum: null },
    f: { tex: '\\frac{(-1)^{n}}{n!}', b: function(n){ return 1 / fact(n); }, n0: 0, sumTex: '\\frac{1}{e}', sum: 1 / Math.E },
    h2: { tex: '\\frac{(-1)^{n+1}}{n \\, 2^n}', b: function(n){ return 1 / (n * Math.pow(2, n)); }, n0: 1, sumTex: '\\ln\\frac{3}{2}', sum: Math.log(1.5) },
    lb: { tex: '\\frac{(-1)^{n}}{2n + 1}', b: function(n){ return 1 / (2 * n + 1); }, n0: 0, sumTex: '\\frac{\\pi}{4}', sum: Math.PI / 4 }
  };
  function genAlt(r, ctx){
    var codes = {}, taylor = (ctx.fams || []).indexOf('taylor') > -1;
    if(!taylor){
      var id = r.pick(Object.keys(ALTS)), A = ALTS[id], N = r.int(3, 6), last = A.n0 + N - 1, B = A.b(last + 1);
      var k = id === 'lb' ? 2 : id === 'p2' ? 3 : r.pick([3, 4]), eps = Math.pow(10, -k), Nmin = 1; while(A.b(A.n0 + Nmin) >= eps) Nmin++;
      var steps = [
        choice(r, 'why', H('Why does the alternating series error bound apply?'), [
          { code: 'ok', html: 'The terms alternate, and their sizes decrease to 0', why: 'Right: those are the alternating series test\'s conditions, and they make the bound hold.' },
          { code: 'lim', html: 'The terms approach 0', why: 'Also needed: the signs alternate and the sizes decrease.' },
          { code: 'conv', html: 'The series converges absolutely', why: 'The bound needs alternating signs with sizes decreasing to 0; absolute convergence is not what it uses.' },
          { code: 'ratio', html: 'The ratio test limit is less than 1', why: 'That shows convergence, not the size of the error. The bound needs alternating signs with sizes decreasing to 0.' }
        ], { practice: '3.B', level: 'analyze' }, codes),
        stepNum('B', H('The sum of the first ' + N + ' terms, $S_{' + N + '}$, approximates the sum. Give the alternating series error bound.'), cellR(B, [{ value: A.b(last), why: H('That is the last term used. The bound is the first term left out, $|a_{' + (last + 1) + '}|$.') }, { value: A.b(last + 2), why: H('Use the first term left out, $|a_{' + (last + 1) + '}|$.') }]), { hint: H('The size of the first term left out; three significant figures or a fraction.') }),
        stepNum('N', H('How many terms are needed to guarantee an error less than $' + sci(eps) + '$?'), M.cell(Nmin, 0, [{ value: Nmin + 1, why: H('With ' + Nmin + ' terms the bound is $|a_{' + (A.n0 + Nmin) + '}| = ' + sci(A.b(A.n0 + Nmin)) + '$, already less than $' + sci(eps) + '$.') }, { value: Nmin - 1, why: H('With ' + (Nmin - 1) + ' terms the bound is $' + sci(A.b(A.n0 + Nmin - 1)) + '$, not yet less than $' + sci(eps) + '$.') }], 0.01), { d: 0, practice: '1.E', hint: H('Find the first term smaller than $' + sci(eps) + '$: the terms before it are the ones you add.') })
      ];
      return { ctx: ctx.id, topic: ctx.topic, type: 'altbound', text: H('<p>Consider the alternating series $\\sum_{n=' + A.n0 + '}^{\\infty} ' + A.tex + '$.</p>'), steps: steps,
        solution: [H('The series alternates and $|a_n|$ decreases to 0, so $|S - S_N| \\le |a_{N+1}|$, the first term left out.'), H('With ' + N + ' terms (through $n = ' + last + '$): error $\\le ' + sci(B) + '$.'), H('The first term below $' + sci(eps) + '$ is $|a_{' + (A.n0 + Nmin) + '}|$, so ' + Nmin + ' terms are enough.')],
        fig: { kind: 'alt', id: id, n0: A.n0, N: N, sum: A.sum, sumTex: A.sumTex }, chk: { v: 'series', id: id, N: N, eps: eps }, codes: codes };
    }
    // a Maclaurin polynomial at a point
    var f = r.pick(['sin', 'cos', 'expneg']), x1 = f === 'expneg' ? r.pick([0.2, 0.5, 1]) : r.pick([0.1, 0.2, 0.5, 1]), n, cs = [], next, skip;
    if(f === 'sin'){ n = r.pick([3, 5]); for(var j = 0; j <= n + 2; j++) cs.push(j % 2 ? (j % 4 === 1 ? 1 : -1) / fact(j) : 0); next = n + 2; skip = n + 1; }
    else if(f === 'cos'){ n = r.pick([2, 4]); for(j = 0; j <= n + 2; j++) cs.push(j % 2 ? 0 : (j % 4 === 0 ? 1 : -1) / fact(j)); next = n + 2; skip = n + 1; }
    else { n = r.pick([2, 3, 4]); for(j = 0; j <= n + 2; j++) cs.push(Math.pow(-1, j) / fact(j)); next = n + 1; skip = n; }
    var xv = x1, Pv = 0; for(j = 0; j <= n; j++) Pv += cs[j] * Math.pow(xv, j);
    var Bt = Math.abs(cs[next]) * Math.pow(xv, next), fT = f === 'sin' ? '\\sin x' : f === 'cos' ? '\\cos x' : 'e^{-x}', P = polyOf(cs.slice(0, n + 1), 0);
    var wrongB = f === 'expneg' ? Math.pow(xv, n) / fact(n) : Math.pow(xv, skip) / fact(skip);
    var steps2 = [
      choice(r, 'which', H('Which bound is the natural one for $|' + fT.replace(/x/g, '(' + xv + ')') + ' - P_' + n + '(' + xv + ')|$?'), [
        { code: 'alt', html: 'The alternating series error bound: the series at $x = ' + xv + '$ alternates, with sizes decreasing to 0', why: 'Right: the first term left out bounds the error.' },
        { code: 'none', html: 'No bound applies: the series is infinite', why: 'An alternating series with sizes decreasing to 0 has its error bounded by the first term left out.' },
        { code: 'geo', html: 'The geometric series formula', why: 'This is not geometric: the ratio of consecutive terms changes.' }
      ], { practice: '3.B', level: 'analyze' }, codes),
      stepNum('B', H('Give the alternating series error bound for $P_' + n + '(' + xv + ')$.'), cellR(Bt, [{ value: wrongB, why: H(f === 'expneg' ? 'That is the last term used, $\\frac{' + xv + '^' + n + '}{' + n + '!}$. The bound is the first term left out, $\\frac{' + xv + '^{' + next + '}}{' + next + '!}$.' : 'The $x^{' + skip + '}$ term of $' + fT + '$ is 0, so it is not left out. The first nonzero term left out is $\\frac{x^{' + next + '}}{' + next + '!}$.') }, { value: Math.pow(xv, next) / fact(next - 1), why: H('The factorial is $' + next + '! = ' + fact(next) + '$.') }]), { hint: H('The first nonzero term left out, at $x = ' + xv + '$. Three significant figures or scientific notation.') }),
      choice(r, 'say', H('So:'), [
        { code: 'le', html: '$|' + fT.replace(/x/g, '(' + xv + ')') + ' - P_' + n + '(' + xv + ')| \\le ' + sci(Bt) + '$', why: 'Right: "at most", with the bound.' },
        { code: 'eq', html: '$|' + fT.replace(/x/g, '(' + xv + ')') + ' - P_' + n + '(' + xv + ')| = ' + sci(Bt) + '$', why: 'The bound is an upper limit on the error, not its value.' },
        { code: 'ge', html: '$|' + fT.replace(/x/g, '(' + xv + ')') + ' - P_' + n + '(' + xv + ')| \\ge ' + sci(Bt) + '$', why: 'The other way: the error is at most the bound.' }
      ], { practice: '4.E', level: 'analyze' }, codes)
    ];
    return { ctx: ctx.id, topic: ctx.topic, type: 'altbound', text: H('<p>$P_' + n + '(x) = ' + P.tex + '$ is the Taylor polynomial of degree ' + n + ' for $' + fT + '$ about $x = 0$. It approximates $' + fT.replace(/x/g, '(' + xv + ')') + ' \\approx ' + dn(Pv, 6) + '$.</p>'), steps: steps2,
      solution: [H('At $x = ' + xv + '$ the Maclaurin series of $' + fT + '$ alternates, and its terms decrease in size to 0.'), H('The first nonzero term left out is $\\frac{' + xv + '^{' + next + '}}{' + next + '!} \\approx ' + sci(Bt) + '$.'), H('So $|' + fT.replace(/x/g, '(' + xv + ')') + ' - P_' + n + '(' + xv + ')| \\le ' + sci(Bt) + '$.')],
      fig: { kind: 'talt', f: f, n: n, x1: xv, bound: Bt }, chk: { v: 'taylor', f: f, n: n, x1: xv }, codes: codes };
  }

  var GEN = { coef: genCoef, maclaurin: genMaclaurin, lagrange: genLagrange, altbound: genAlt };
  function generate(r, ctx, type){
    var kind = type || ctx.kind || 'coef';
    if(!GEN[kind]) throw new Error('taylorLab.generate: no problem kind "' + kind + '"');
    return GEN[kind](r, ctx);
  }

  M.register('taylorLab', {
    FUNCS: FUNCS, funcById: funcById, coef: coef, poly: poly, polyTex: polyTex, maxAbsDeriv: maxAbsDeriv, lagrange: lagrange, altBound: altBound,
    ALTS: ALTS, generate: generate, KINDS: Object.keys(GEN), fact: fact, tn: tn, dn: dn, sci: sci, polyOf: polyOf
  });
})(typeof window !== 'undefined' ? window : globalThis);
