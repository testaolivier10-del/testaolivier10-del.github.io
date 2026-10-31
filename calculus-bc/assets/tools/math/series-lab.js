/* Series lab: the model (docs/apcalcbc-architecture.md, "Trainers"; spec section 6). OWNED BY
   THIS TOOL ONLY (builder T1). Registers ApCalcMath.seriesLab; pure functions, no DOM, so
   scripts/lib/apcalcbc-tool-checks/series-lab.mjs runs it in node with the code the page runs.

   The six tests the CED assesses (docs/apcalcbc-authoring-guide.md, "Scope"):
     TESTS                      key -> { name, short }: nth, integral, direct, limit, alt, ratio
   Explore
     GALLERY                    number series: { id, chip, tex, a(n), n0, sum, sumTex, verdict,
                                  best, board: { test: [verdict, why] } }; verdict 'abs' | 'cond' | 'div'
     POWER                      power series: { id, chip, tex, center, R, loIn, hiIn, term(x, n), n0,
                                  f(x) | null, fTex, ratioTex, ends: { lo, hi } }
     partial(a, n0, N)          [S_n0, ..., S_(n0+N-1)]: the partial sums, summed in order
     powerAt(P, x, N)           { sums, L (ratio limit at x), where: 'in'|'out'|'lo'|'hi'|'center' }
     geoSum(first, r, N)        the closed form first(1 - r^N)/(1 - r) (tests compare it with partial())
   Test yourself
     generate(rng, ctx, type)   a seeded problem in ApCalcTools.drill's format. Kinds:
       partial   S_n given: a_1, a_3, the sum, does it converge
       sum       geometric: r, the first term, S_3, converges?, the sum
       test      choose and justify a test (ctx.fams: nth, integral, direct, limit, alt, ratio)
       absolute  sum of |a_n|, sum of a_n, absolutely / conditionally / diverges
       interval  ratio test limit, radius, both endpoints, the interval (an interval step,
                 graded by ApCalcBCInterval on the page)
     Every problem carries chk: { fam, prm, ... } (the givens) and codes: { stepKey: [code per
     option] }, so the validator recomputes each key from the givens with its own code. */
(function(G){
  'use strict';
  var M = G.ApCalcMath;
  if(!M) return;
  function H(s){ var t = G.ApCalcTex; return t ? t.html(s) : s; }

  /* ------------------------------------------------- numbers as TeX */
  function gcd(a, b){ a = Math.abs(a); b = Math.abs(b); while(b){ var t = a % b; a = b; b = t; } return a || 1; }
  function fracOf(v){
    if(!isFinite(v)) return null;
    for(var d = 1; d <= 400; d++) if(Math.abs(v * d - Math.round(v * d)) < 1e-9 * Math.max(1, Math.abs(v * d))) return { n: Math.round(v * d), d: d };
    return null;
  }
  function tn(v){
    var f = fracOf(v);
    if(f && f.d === 1) return String(f.n);
    if(f) return (f.n < 0 ? '-' : '') + '\\frac{' + Math.abs(f.n) + '}{' + f.d + '}';
    return String(+v.toFixed(3));
  }
  function pn(v){ return v < 0 ? '\\left(' + tn(v) + '\\right)' : tn(v); }
  function dn(v, d){ var s = (+v).toFixed(d == null ? 3 : d); return /^-0\.?0*$/.test(s) ? s.slice(1) : s; }
  // a decimal, the way a calculator shows it, never "Infinity"
  function dec(v){ return isFinite(v) ? String(+(+v).toPrecision(6)) : 'undefined'; }
  // plain text of a fraction for a typed answer hint: 2/3
  function ft(v){ var f = fracOf(v); return f ? (f.d === 1 ? String(f.n) : f.n + '/' + f.d) : dn(v); }
  function fact(n){ var p = 1; for(var k = 2; k <= n; k++) p *= k; return p; }
  function cellX(ans, mis){ return M.cell(ans, 0, mis || [], 0.0011); }       // exact or to 3 places
  function cellR(ans, mis){ return M.cell(ans, 0.006, mis || [], 0); }        // 3 significant figures
  function shuffle(r, n){ var idx = []; for(var i = 0; i < n; i++) idx.push(i); for(i = n - 1; i > 0; i--){ var j = Math.floor(r() * (i + 1)), t = idx[i]; idx[i] = idx[j]; idx[j] = t; } return idx; }
  function sumTex(atex, n0){ return '\\sum_{n=' + n0 + '}^{\\infty} ' + atex; }

  var TESTS = {
    nth: { name: 'The nth term test', short: 'nth term' },
    integral: { name: 'The integral test', short: 'Integral' },
    direct: { name: 'The direct comparison test', short: 'Direct comparison' },
    limit: { name: 'The limit comparison test', short: 'Limit comparison' },
    alt: { name: 'The alternating series test', short: 'Alternating series' },
    ratio: { name: 'The ratio test', short: 'Ratio' }
  };
  var TNAME = { nth: 'The $n$th term test', integral: 'The integral test', direct: 'The direct comparison test', limit: 'The limit comparison test', alt: 'The alternating series test', ratio: 'The ratio test' };

  /* ---------------------------------------------------------- explore */
  var LN2 = Math.log(2);
  function V(v, why){ return [v, why]; }
  var NA_POS = V('na', 'The terms change sign, and this test needs positive terms.');
  var NA_ALT = V('na', 'The terms are all positive: the series does not alternate.');
  var GALLERY = [
    { id: 'geo', chip: '1/2ⁿ', tex: '\\sum_{n=1}^{\\infty} \\frac{1}{2^n}', a: function(n){ return Math.pow(0.5, n); }, n0: 1, sum: 1, sumTex: '1', verdict: 'abs', best: 'ratio', known: 'A geometric series with ratio $r = \\frac{1}{2}$: it converges because $|r| < 1$, to $\\frac{\\text{first term}}{1 - r} = \\frac{1/2}{1 - 1/2} = 1$.',
      board: { nth: V('inc', '$\\lim a_n = 0$: the nth term test decides nothing when the limit is 0.'), integral: V('works', '$f(x) = 2^{-x}$ is positive, continuous and decreasing, and $\\int_1^{\\infty} 2^{-x}\\,dx$ converges.'), direct: V('works', 'It is itself geometric; compared with itself it converges.'), limit: V('works', 'With $b_n = \\frac{1}{2^n}$ the limit is 1, and $\\sum b_n$ is geometric with $|r| < 1$.'), alt: NA_ALT, ratio: V('works', '$\\lim \\frac{a_{n+1}}{a_n} = \\frac{1}{2} < 1$: it converges.') } },
    { id: 'p2', chip: '1/n²', tex: '\\sum_{n=1}^{\\infty} \\frac{1}{n^2}', a: function(n){ return 1 / (n * n); }, n0: 1, sum: Math.PI * Math.PI / 6, sumTex: '\\frac{\\pi^2}{6}', verdict: 'abs', best: 'integral', known: 'A p-series with $p = 2 > 1$: it converges. Its sum, $\\frac{\\pi^2}{6}$, is a famous result (Euler); the course never asks for it.',
      board: { nth: V('inc', '$\\lim a_n = 0$: no conclusion.'), integral: V('works', '$f(x) = \\frac{1}{x^2}$ is positive, continuous and decreasing, and $\\int_1^{\\infty} \\frac{dx}{x^2} = 1$ converges, so the series converges.'), direct: V('works', 'It is the p-series itself (p = 2 > 1), the benchmark the comparison tests compare with.'), limit: V('works', 'With $b_n = \\frac{1}{n^2}$ the limit is 1.'), alt: NA_ALT, ratio: V('inc', '$\\lim \\frac{a_{n+1}}{a_n} = \\lim \\frac{n^2}{(n+1)^2} = 1$: the ratio test decides nothing.') } },
    { id: 'harm', chip: '1/n', tex: '\\sum_{n=1}^{\\infty} \\frac{1}{n}', a: function(n){ return 1 / n; }, n0: 1, sum: null, verdict: 'div', best: 'integral', known: 'The harmonic series (a p-series with $p = 1$) diverges, even though its terms approach 0. The partial sums grow like $\\ln n$: slowly, but without bound.',
      board: { nth: V('inc', '$\\lim a_n = 0$, so the nth term test decides nothing: terms that approach 0 are needed, not enough.'), integral: V('works', '$f(x) = \\frac{1}{x}$ is positive, continuous and decreasing, and $\\int_1^{\\infty} \\frac{dx}{x} = \\lim_{b \\to \\infty} \\ln b$ diverges.'), direct: V('works', 'It is the p-series with p = 1, the benchmark divergent series.'), limit: V('works', 'With $b_n = \\frac{1}{n}$ the limit is 1.'), alt: NA_ALT, ratio: V('inc', '$\\lim \\frac{n}{n+1} = 1$: no conclusion.') } },
    { id: 'altharm', chip: '(−1)ⁿ⁺¹/n', tex: '\\sum_{n=1}^{\\infty} \\frac{(-1)^{n+1}}{n}', a: function(n){ return (n % 2 ? 1 : -1) / n; }, n0: 1, sum: LN2, sumTex: '\\ln 2', verdict: 'cond', best: 'alt', known: 'The alternating harmonic series converges (to $\\ln 2$), but only conditionally: the series of absolute values is the harmonic series, which diverges.',
      board: { nth: V('inc', '$\\lim a_n = 0$: no conclusion.'), integral: V('na', 'The terms change sign; the integral test needs positive terms.'), direct: NA_POS, limit: NA_POS, alt: V('works', '$|a_n| = \\frac{1}{n}$ decreases and approaches 0, so the series converges.'), ratio: V('inc', '$\\lim \\left|\\frac{a_{n+1}}{a_n}\\right| = 1$: no conclusion.') } },
    { id: 'leib', chip: '(−1)ⁿ/(2n+1)', tex: '\\sum_{n=0}^{\\infty} \\frac{(-1)^{n}}{2n+1}', a: function(n){ return (n % 2 ? -1 : 1) / (2 * n + 1); }, n0: 0, sum: Math.PI / 4, sumTex: '\\frac{\\pi}{4}', verdict: 'cond', best: 'alt', known: 'Leibniz\'s series for $\\frac{\\pi}{4}$ (the Maclaurin series of $\\arctan x$ at $x = 1$). It converges, conditionally, and very slowly.',
      board: { nth: V('inc', '$\\lim a_n = 0$: no conclusion.'), integral: V('na', 'The terms change sign.'), direct: NA_POS, limit: NA_POS, alt: V('works', '$|a_n| = \\frac{1}{2n+1}$ decreases and approaches 0.'), ratio: V('inc', '$\\lim \\left|\\frac{a_{n+1}}{a_n}\\right| = 1$: no conclusion.') } },
    { id: 'fact', chip: '1/n!', tex: '\\sum_{n=0}^{\\infty} \\frac{1}{n!}', a: function(n){ return 1 / fact(n); }, n0: 0, sum: Math.E, sumTex: 'e', verdict: 'abs', best: 'ratio', known: 'The Maclaurin series of $e^x$ at $x = 1$: it converges to $e$, and fast, because $n!$ grows faster than any power.',
      board: { nth: V('inc', '$\\lim a_n = 0$: no conclusion.'), integral: V('na', '$n!$ is defined only at whole numbers: there is no continuous $f(x)$ to integrate.'), direct: V('works', 'For $n \\ge 1$, $\\frac{1}{n!} \\le \\frac{1}{2^{n-1}}$, a convergent geometric series.'), limit: V('inc', 'No simple series has terms of the same size; the ratio test is the natural choice.'), alt: NA_ALT, ratio: V('works', '$\\frac{a_{n+1}}{a_n} = \\frac{n!}{(n+1)!} = \\frac{1}{n+1} \\to 0 < 1$: it converges.') } },
    { id: 'ratio3', chip: '3ⁿ/n!', tex: '\\sum_{n=0}^{\\infty} \\frac{3^n}{n!}', a: function(n){ return Math.pow(3, n) / fact(n); }, n0: 0, sum: Math.exp(3), sumTex: 'e^3', verdict: 'abs', best: 'ratio', known: 'The terms grow at first (up to $n = 3$), then the factorial wins. The sum is $e^3$, the series of $e^x$ at $x = 3$.',
      board: { nth: V('inc', '$\\lim a_n = 0$: no conclusion.'), integral: V('na', 'There is no continuous $f(x)$ for $n!$.'), direct: V('inc', 'Possible, but finding a series to compare with is the hard part.'), limit: V('inc', 'No simple series to compare with.'), alt: NA_ALT, ratio: V('works', '$\\frac{a_{n+1}}{a_n} = \\frac{3}{n+1} \\to 0 < 1$: it converges.') } },
    { id: 'nth', chip: 'n/(n+1)', tex: '\\sum_{n=1}^{\\infty} \\frac{n}{n+1}', a: function(n){ return n / (n + 1); }, n0: 1, sum: null, verdict: 'div', best: 'nth', known: 'The terms approach 1, not 0, so adding them can never settle: each new term adds almost 1.',
      board: { nth: V('works', '$\\lim \\frac{n}{n+1} = 1 \\ne 0$, so the series diverges.'), integral: V('na', '$f(x) = \\frac{x}{x+1}$ increases: the integral test needs a decreasing function.'), direct: V('works', 'For $n \\ge 1$, $\\frac{n}{n+1} \\ge \\frac{1}{2}$, and adding $\\frac{1}{2}$ forever diverges.'), limit: V('works', 'With $b_n = 1$, the limit is 1 and $\\sum 1$ diverges.'), alt: NA_ALT, ratio: V('inc', '$\\lim \\frac{a_{n+1}}{a_n} = 1$: no conclusion.') } },
    { id: 'nlogn', chip: '1/(n ln n)', tex: '\\sum_{n=2}^{\\infty} \\frac{1}{n \\ln n}', a: function(n){ return 1 / (n * Math.log(n)); }, n0: 2, sum: null, verdict: 'div', best: 'integral', known: 'It diverges, more slowly than the harmonic series: its partial sums grow like $\\ln(\\ln n)$, which passes 3 only after about 500 million terms. No picture of partial sums can show divergence; a test has to.',
      board: { nth: V('inc', '$\\lim a_n = 0$: no conclusion.'), integral: V('works', '$f(x) = \\frac{1}{x \\ln x}$ is positive, continuous and decreasing for $x \\ge 2$; with $u = \\ln x$, $\\int_2^{\\infty} \\frac{dx}{x \\ln x} = \\lim_{b \\to \\infty} \\left(\\ln(\\ln b) - \\ln(\\ln 2)\\right)$ diverges.'), direct: V('inc', 'It is smaller than $\\frac{1}{n}$, which diverges: smaller than a divergent series proves nothing.'), limit: V('inc', 'Against $\\frac{1}{n}$ the limit is 0, not a finite positive number.'), alt: NA_ALT, ratio: V('inc', 'The limit is 1: no conclusion.') } }
  ];
  function galleryById(id){ for(var i = 0; i < GALLERY.length; i++) if(GALLERY[i].id === id) return GALLERY[i]; return null; }
  function partial(a, n0, N){ var s = 0, out = []; for(var k = 0; k < N; k++){ s += a(n0 + k); out.push(s); } return out; }
  function geoSum(first, r, N){ return r === 1 ? first * N : first * (1 - Math.pow(r, N)) / (1 - r); }

  /* Power series (Explore). term(x, n): the nth term at x. */
  function li2(x){ var s = 0; for(var n = 1; n < 4000; n++){ var t = Math.pow(x, n) / (n * n); s += t; if(Math.abs(t) < 1e-15) break; } return s; }
  var POWER = [
    { id: 'p1', chip: '(x−3)ⁿ/(n·2ⁿ)', tex: '\\sum_{n=1}^{\\infty} \\frac{(x-3)^n}{n\\,2^n}', center: 3, R: 2, loIn: true, hiIn: false, n0: 1, view: [-0.5, 6.5],
      term: function(x, n){ return Math.pow((x - 3) / 2, n) / n; }, f: function(x){ return -Math.log(1 - (x - 3) / 2); }, fTex: '-\\ln\\left(1 - \\frac{x-3}{2}\\right)',
      ratioTex: '\\frac{|x-3|}{2}', ends: { lo: 'At $x = 1$ the series is $\\sum \\frac{(-1)^n}{n}$: it converges by the alternating series test, so $x = 1$ is included.', hi: 'At $x = 5$ it is $\\sum \\frac{1}{n}$, the harmonic series: it diverges, so $x = 5$ is left out.' } },
    { id: 'p2', chip: 'xⁿ', tex: '\\sum_{n=0}^{\\infty} x^n', center: 0, R: 1, loIn: false, hiIn: false, n0: 0, view: [-2, 2],
      term: function(x, n){ return Math.pow(x, n); }, f: function(x){ return 1 / (1 - x); }, fTex: '\\frac{1}{1-x}',
      ratioTex: '|x|', ends: { lo: 'At $x = -1$ the terms are $(-1)^n$: they do not approach 0, so it diverges.', hi: 'At $x = 1$ the terms are all 1: it diverges.' } },
    { id: 'p3', chip: 'xⁿ/n²', tex: '\\sum_{n=1}^{\\infty} \\frac{x^n}{n^2}', center: 0, R: 1, loIn: true, hiIn: true, n0: 1, view: [-2, 2],
      term: function(x, n){ return Math.pow(x, n) / (n * n); }, f: function(x){ return Math.abs(x) <= 1 ? li2(x) : NaN; }, fTex: null,
      ratioTex: '|x|', ends: { lo: 'At $x = -1$ it is $\\sum \\frac{(-1)^n}{n^2}$: it converges absolutely ($p = 2 > 1$).', hi: 'At $x = 1$ it is $\\sum \\frac{1}{n^2}$, a p-series with $p = 2 > 1$: it converges.' } },
    { id: 'p4', chip: '(−1)ⁿ⁺¹xⁿ/n', tex: '\\sum_{n=1}^{\\infty} \\frac{(-1)^{n+1} x^n}{n}', center: 0, R: 1, loIn: false, hiIn: true, n0: 1, view: [-2, 2],
      term: function(x, n){ return (n % 2 ? 1 : -1) * Math.pow(x, n) / n; }, f: function(x){ return Math.log(1 + x); }, fTex: '\\ln(1+x)',
      ratioTex: '|x|', ends: { lo: 'At $x = -1$ every term is $-\\frac{1}{n}$: the negative of the harmonic series, which diverges.', hi: 'At $x = 1$ it is the alternating harmonic series: it converges by the alternating series test.' } },
    { id: 'p5', chip: 'x²ⁿ/4ⁿ', tex: '\\sum_{n=0}^{\\infty} \\frac{(-1)^n x^{2n}}{4^n}', center: 0, R: 2, loIn: false, hiIn: false, n0: 0, view: [-3.5, 3.5],
      term: function(x, n){ return (n % 2 ? -1 : 1) * Math.pow(x * x / 4, n); }, f: function(x){ return 1 / (1 + x * x / 4); }, fTex: '\\frac{1}{1 + x^2/4}',
      ratioTex: '\\frac{x^2}{4}', ends: { lo: 'At $x = -2$ the terms are $(-1)^n$: they do not approach 0, so it diverges.', hi: 'At $x = 2$ the same: it diverges.' }, note: 'The ratio test gives $\\frac{x^2}{4} < 1$, so $|x| < 2$: take the square root of 4. The radius is 2, not 4.' },
    { id: 'p6', chip: 'xⁿ/n!', tex: '\\sum_{n=0}^{\\infty} \\frac{x^n}{n!}', center: 0, R: Infinity, loIn: false, hiIn: false, n0: 0, view: [-4, 4],
      term: function(x, n){ return Math.pow(x, n) / fact(n); }, f: function(x){ return Math.exp(x); }, fTex: 'e^x',
      ratioTex: '\\frac{|x|}{n+1} \\to 0', ends: null },
    { id: 'p7', chip: 'n!·xⁿ', tex: '\\sum_{n=0}^{\\infty} n!\\,x^n', center: 0, R: 0, loIn: true, hiIn: true, n0: 0, view: [-1, 1],
      term: function(x, n){ return fact(n) * Math.pow(x, n); }, f: function(x){ return x === 0 ? 1 : NaN; }, fTex: null,
      ratioTex: '(n+1)|x| \\to \\infty', ends: null }
  ];
  function powerById(id){ for(var i = 0; i < POWER.length; i++) if(POWER[i].id === id) return POWER[i]; return null; }
  /* The ratio test limit at x for a power series of the gallery, and where x is. */
  function powerAt(P, x, N){
    var sums = [], s = 0, d = Math.abs(x - P.center), L, where;
    for(var k = 0; k < N; k++){ s += P.term(x, P.n0 + k); sums.push(s); }
    if(P.R === Infinity) L = 0; else if(P.R === 0) L = d === 0 ? 0 : Infinity; else L = P.id === 'p5' ? x * x / 4 : d / P.R;
    if(d < 1e-12) where = 'center';
    else if(P.R !== Infinity && Math.abs(d - P.R) < 1e-9) where = x < P.center ? 'lo' : 'hi';
    else where = L < 1 ? 'in' : 'out';
    return { sums: sums, L: L, where: where };
  }

  /* ============================================== Test yourself */
  function stepNum(key, label, cell, o){ o = o || {}; return { key: key, kind: 'num', label: label, cell: cell, d: o.d, hint: o.hint, practice: o.practice || '1.E', level: o.level || 'apply' }; }
  /* A choice step from coded options: list [{ code, html, why }], the right one first. */
  function choice(r, key, label, list, o, codes){
    o = o || {};
    var idx = shuffle(r, list.length), opts = idx.map(function(i){ return list[i]; });
    codes[key] = opts.map(function(x){ return x.code; });
    return { key: key, kind: 'choice', label: label, options: opts.map(function(x){ return H(x.html); }), correct: idx.indexOf(0), why: opts.map(function(x){ return H(x.why); }), hint: o.hint, practice: o.practice || '3.D', level: o.level || 'analyze' };
  }
  function pickN(r, list, n){ var idx = shuffle(r, list.length); return idx.slice(0, n).map(function(i){ return list[i]; }); }

  /* ---------- the families of the "test" kind. Each returns
     { fam, prm, n0, atex, aplain, pos, alt, best, verdict ('abs'|'cond'|'div'),
       wrong: { test: why } (tests that do not settle it; the distractors),
       right: why (the chosen test, with its conditions),
       mid: [steps between the choice and the conclusion], concl: [options, right first],
       sol: [worked solution lines] } */
  var FAMS = {};
  FAMS.nth = function(r){
    var v = r.int(0, 1), a, b, c, d;
    if(v === 0){
      do { a = r.int(1, 5); b = r.int(0, 4); c = r.int(1, 5); d = r.int(1, 9); } while(a * d - b * c <= 0 || gcd(gcd(a, b), gcd(c, d)) > 1 || a === c);
    } else { a = 1; b = 0; c = r.int(2, 5); d = r.int(1, 9); }
    var pw = v ? '^2' : '', num = (a === 1 ? '' : a) + 'n' + pw + (b ? ' + ' + b : ''), den = (c === 1 ? '' : c) + 'n' + pw + ' + ' + d;
    var L = a / c, atex = '\\frac{' + num + '}{' + den + '}';
    return { fam: 'nth', prm: { v: v, a: a, b: b, c: c, d: d }, n0: 1, atex: atex, pos: true, alt: false, best: 'nth', verdict: 'div',
      right: 'Find $\\lim_{n \\to \\infty} a_n$ first: it is $' + tn(L) + '$, not 0, and that alone settles divergence.',
      wrong: { ratio: 'The ratio $\\frac{a_{n+1}}{a_n}$ approaches 1 for a ratio of polynomials, so the ratio test decides nothing.', alt: 'Every term is positive: the series does not alternate.', integral: 'The function $f(x) = ' + atex.replace(/n/g, 'x') + '$ increases, and the integral test needs a decreasing function.' },
      mid: function(r, codes){
        return [stepNum('lim', H('Find $\\lim_{n \\to \\infty} a_n$.'), cellX(L, [{ value: c / a, why: H('Upside down: divide the leading coefficients, numerator over denominator: $\\frac{' + a + '}{' + c + '}$.') }, { value: 0, why: H('The degrees of the top and the bottom are equal, so the limit is the ratio of the leading coefficients, not 0.') }, { value: b / d, why: H('That is $a_0$, the value at $n = 0$. Divide the leading terms: $\\frac{' + (a === 1 ? '' : a) + 'n' + pw + '}{' + (c === 1 ? '' : c) + 'n' + pw + '}$.') }]), { d: 3, hint: H('Exact (like ' + ft(1 / 3) + ') or to three decimal places.') })];
      },
      concl: [
        { code: 'div', html: 'It diverges: $\\lim a_n = ' + tn(L) + ' \\ne 0$', why: 'Right. If the terms do not approach 0, the partial sums keep growing by about $' + tn(L) + '$ each time.' },
        { code: 'convL', html: 'It converges to $' + tn(L) + '$', why: '$' + tn(L) + '$ is the limit of the terms, not of the partial sums. Adding terms near $' + tn(L) + '$ forever cannot settle.' },
        { code: 'conv', html: 'It converges, because $\\lim a_n$ is finite', why: 'The sequence of terms converges, but the series does not: the series converges only when the partial sums settle, and for that the terms must approach 0.' },
        { code: 'inc', html: 'No conclusion: the test can only show divergence', why: 'It can only show divergence, and that is what it shows here: the limit is not 0.' }
      ],
      sol: ['$\\lim_{n \\to \\infty} ' + atex + ' = ' + tn(L) + '$ (the ratio of the leading coefficients).', 'Since $\\lim a_n = ' + tn(L) + ' \\ne 0$, the series diverges by the nth term test.']
    };
  };
  FAMS.integral = function(r){
    var q = r.pick([0.5, 1, 2, 3]), qt = q === 0.5 ? '\\sqrt{\\ln n}' : q === 1 ? '\\ln n' : '(\\ln n)^' + q;
    var atex = '\\frac{1}{n' + (q === 0.5 ? '\\sqrt{\\ln n}' : ' ' + qt) + '}', fx = atex.replace(/n/g, 'x').replace(/\\lx/g, '\\ln'), conv = q > 1;
    var I = conv ? Math.pow(LN2, 1 - q) / (q - 1) : NaN, antider = q === 1 ? '\\ln(\\ln x)' : q === 0.5 ? '2\\sqrt{\\ln x}' : '-\\frac{1}{' + (q - 1 === 1 ? '' : q - 1) + '(\\ln x)^{' + (q - 1) + '}}';
    var steps = function(r, codes){
      var out = [choice(r, 'cond', H('Check the integral test\'s conditions for $f(x) = ' + fx + '$ on $x \\ge 2$.'), [
        { code: 'ok', html: '$f$ is positive, continuous and decreasing for $x \\ge 2$', why: 'Right: the denominator is positive and increasing for $x \\ge 2$, so $f$ is positive and decreasing.' },
        { code: 'lim', html: '$f$ is positive and $f(x) \\to 0$; that is enough', why: 'The test needs $f$ decreasing (and continuous). A limit of 0 alone is never enough: $\\frac{1}{x}$ has limit 0 and its series diverges.' },
        { code: 'no', html: 'It fails: $f$ is not defined at $x = 1$', why: 'The series starts at $n = 2$, so only $x \\ge 2$ matters, and there $f$ is positive, continuous and decreasing.' },
        { code: 'alt', html: 'The terms alternate and decrease', why: 'Every term is positive; nothing alternates.' }
      ], { practice: '3.B', level: 'analyze' }, codes)];
      if(conv) out.push(stepNum('ival', H('Evaluate $\\int_2^{\\infty} ' + fx + '\\,dx$.'), cellX(I, [{ value: Math.pow(LN2, 1 - q), why: H('An antiderivative of $u^{-' + q + '}$ is $\\frac{u^{' + (1 - q) + '}}{' + (1 - q) + '}$: divide by $' + (1 - q) + '$ too.') }, { value: 1 / (2 * Math.pow(LN2, q)), why: H('That is $f(2)$, the first term, not the integral. Substitute $u = \\ln x$, $du = \\frac{dx}{x}$: the integral becomes $\\int_{\\ln 2}^{\\infty} u^{-' + q + '}\\,du$.') }, { value: 1 / (q - 1), why: H('The lower bound is $u = \\ln 2$, not 1: with $u = \\ln x$, $x = 2$ gives $u = \\ln 2$.') }]), { d: 3, practice: '1.E', level: 'apply', hint: H('With $u = \\ln x$; three decimal places.') }));
      else out.push(choice(r, 'intd', H('Evaluate $\\int_2^{\\infty} ' + fx + '\\,dx$.'), [
        { code: 'div', html: 'It diverges: $\\lim_{b \\to \\infty} ' + antider.replace(/x/g, 'b') + '$ is infinite', why: 'Right: with $u = \\ln x$ the integral is $\\int_{\\ln 2}^{\\infty} u^{-' + q + '}\\,du$, which diverges because the power ' + (q === 1 ? 'is 1' : 'is less than 1') + '.' },
        { code: 'zero', html: 'It converges, because $f(x) \\to 0$', why: 'A limit of 0 does not make an improper integral converge: here the antiderivative $' + antider + '$ grows without bound.' },
        { code: 'val', html: 'It converges to $' + (q === 1 ? '\\ln(\\ln 2)' : '2\\sqrt{\\ln 2}') + '$', why: 'That is the antiderivative at the lower bound only. At the upper bound, $\\lim_{b \\to \\infty} ' + antider.replace(/x/g, 'b') + '$ is infinite.' }
      ], { practice: '1.E', level: 'apply' }, codes));
      return out;
    };
    return { fam: 'integral', prm: { q: q }, n0: 2, atex: atex, pos: true, alt: false, best: 'integral', verdict: conv ? 'abs' : 'div',
      right: 'With $u = \\ln x$ the integral of $f(x) = ' + fx + '$ can be found exactly, and $f$ is positive, continuous and decreasing for $x \\ge 2$.',
      wrong: { nth: 'The terms approach 0, so the nth term test decides nothing.', ratio: 'The ratio of consecutive terms approaches 1: no conclusion.', alt: 'The terms are all positive: nothing alternates.' },
      mid: steps,
      concl: conv ? [
        { code: 'conv', html: 'It converges, because the integral converges', why: 'Right. The integral test says the series and the integral both converge or both diverge.' },
        { code: 'convI', html: 'It converges to $' + dn(I) + '$, the value of the integral', why: 'The integral and the series converge together, but to different values: the integral test does not give the sum.' },
        { code: 'div', html: 'It diverges, because $\\ln n$ grows without bound', why: 'The integral converges, so the series converges.' },
        { code: 'inc', html: 'No conclusion: the integral is not 0', why: 'Any finite value of the integral means convergence; it does not need to be 0.' }
      ] : [
        { code: 'div', html: 'It diverges, because the integral diverges', why: 'Right: the series and the integral diverge together.' },
        { code: 'conv', html: 'It converges, because $a_n \\to 0$', why: 'Terms approaching 0 are not enough (the harmonic series is the warning), and here the integral diverges.' },
        { code: 'inc', html: 'No conclusion: the integral test only shows convergence', why: 'It works both ways: a divergent integral means a divergent series.' }
      ],
      sol: ['$f(x) = ' + fx + '$ is positive, continuous and decreasing for $x \\ge 2$.', 'With $u = \\ln x$: $\\int_2^{\\infty} ' + fx + '\\,dx = \\lim_{b \\to \\infty} \\left[' + antider + '\\right]_2^b' + (conv ? ' = ' + dn(I) + '$, which converges.' : '$, which diverges.'), 'By the integral test the series ' + (conv ? 'converges.' : 'diverges.')]
    };
  };
  FAMS.direct = function(r){
    var v = r.int(0, 2), k = r.int(2, 4), trig = r.pick(['sin', 'cos']), p, atex, conv, lo, hi, btex, bsay;
    if(v === 0){ p = r.pick([2, 3]); conv = true; atex = '\\frac{' + k + ' + \\' + trig + ' n}{n^' + p + '}'; btex = '\\frac{' + (k + 1) + '}{n^' + p + '}'; bsay = 'a p-series times ' + (k + 1) + ', with $p = ' + p + ' > 1$'; }
    else if(v === 1){ p = r.pick([1, 0.5]); conv = false; atex = '\\frac{' + k + ' + \\' + trig + ' n}{' + (p === 1 ? 'n' : '\\sqrt{n}') + '}'; btex = '\\frac{' + (k - 1) + '}{' + (p === 1 ? 'n' : '\\sqrt{n}') + '}'; bsay = (k - 1 === 1 ? 'a' : (k - 1) + ' times a') + ' p-series with $p = ' + (p === 1 ? '1' : '\\frac{1}{2}') + ' \\le 1$'; }
    else { p = r.pick([2, 3]); conv = true; atex = '\\frac{\\' + trig + '^2 n}{' + p + '^n}'; btex = '\\frac{1}{' + p + '^n}'; bsay = 'geometric, with $r = \\frac{1}{' + p + '}$, $|r| < 1$'; }
    var pre = v === 2 ? '0 < a_n \\le ' : v === 0 ? '0 < a_n \\le ' : 'a_n \\ge ';
    var why0 = v === 2 ? 'Since $0 < \\' + trig + '^2 n \\le 1$' : v === 0 ? 'Since $\\' + trig + ' n \\le 1$, the numerator is at most ' + (k + 1) : 'Since $\\' + trig + ' n \\ge -1$, the numerator is at least ' + (k - 1);
    var cmp = conv ? [
      { code: 'good', html: '$' + pre + btex + '$, and $\\sum ' + btex + '$ converges', why: 'Right. ' + why0 + ', and $\\sum ' + btex + '$ is ' + bsay + '. Smaller than a convergent series: it converges.' },
      v === 2 ? { code: 'big', html: '$a_n \\ge \\frac{1}{' + (p + 1) + '^n}$, and $\\sum \\frac{1}{' + (p + 1) + '^n}$ converges', why: 'That inequality fails when $\\' + trig + '^2 n$ is near 0, and a lower bound by a convergent series proves nothing anyway.' }
        : { code: 'big', html: '$a_n \\ge \\frac{' + (k - 1) + '}{n^' + p + '}$, and $\\sum \\frac{' + (k - 1) + '}{n^' + p + '}$ converges', why: 'Larger than a convergent series proves nothing: the comparison has to go the other way.' },
      v === 2 ? { code: 'small', html: '$a_n \\le \\frac{1}{n}$, and $\\sum \\frac{1}{n}$ diverges', why: 'Smaller than a divergent series proves nothing. Compare with a convergent series that is larger.' }
        : { code: 'small', html: '$a_n \\le \\frac{' + (k + 1) + '}{n}$, and $\\sum \\frac{' + (k + 1) + '}{n}$ diverges', why: 'Smaller than a divergent series proves nothing. Compare with a convergent series that is larger.' }
    ] : [
      { code: 'good', html: '$a_n \\ge ' + btex + '$, and $\\sum ' + btex + '$ diverges', why: 'Right. ' + why0 + ', and $\\sum ' + btex + '$ is ' + bsay + '. Larger than a divergent series: it diverges.' },
      { code: 'small', html: '$a_n \\le \\frac{' + (k + 1) + '}{' + (p === 1 ? 'n' : '\\sqrt{n}') + '}$, and that series diverges', why: 'Smaller than a divergent series proves nothing: the comparison has to go the other way.' },
      { code: 'big', html: '$a_n \\le \\frac{' + (k + 1) + '}{n^2}$, and $\\sum \\frac{' + (k + 1) + '}{n^2}$ converges', why: 'That inequality is false: for large $n$, $\\frac{1}{' + (p === 1 ? 'n' : '\\sqrt{n}') + '}$ is much larger than $\\frac{1}{n^2}$.' }
    ];
    var wrong = { ratio: 'The ratio $\\frac{a_{n+1}}{a_n}$ keeps oscillating with $\\' + trig + ' n$: it has no limit, so the ratio test cannot be used.', limit: 'Against $' + (v === 2 ? '\\frac{1}{' + p + '^n}' : '\\frac{1}{n^' + (p === 0.5 ? '{1/2}' : p) + '}') + '$ the ratio is $' + (v === 2 ? '\\' + trig + '^2 n' : k + ' + \\' + trig + ' n') + '$, which has no limit: the limit comparison test needs a finite positive limit.', alt: 'The terms are all positive: nothing alternates.', integral: 'Because of $\\' + trig + ' x$, the function $f(x)$ is not decreasing, so the integral test does not apply.' };
    if(!conv) wrong.nth = 'The terms approach 0, so the nth term test decides nothing.';
    return { fam: 'direct', prm: { v: v, k: k, trig: trig, p: p }, n0: 1, atex: atex, pos: true, alt: false, best: 'direct', verdict: conv ? 'abs' : 'div',
      right: 'The $\\' + trig + '$ term stays between bounds, so the terms are trapped by a series you know.',
      wrong: wrong,
      mid: function(r, codes){ return [choice(r, 'cmp', H('Which comparison settles it?'), cmp, { practice: '3.B', level: 'analyze', hint: H('Bound $\\' + trig + (v === 2 ? '^2' : '') + ' n$, then compare with a series whose behavior you know.') }, codes)]; },
      concl: conv ? [
        { code: 'conv', html: 'It converges, by direct comparison', why: 'Right: positive terms below a convergent series.' },
        { code: 'div', html: 'It diverges, because $\\' + trig + ' n$ never settles', why: 'The terms still approach 0 fast enough: they are trapped under a convergent series.' },
        { code: 'convB', html: 'It converges to $\\sum ' + btex + '$', why: 'The comparison gives convergence only, not the sum: the sum is less than that series\' sum.' }
      ] : [
        { code: 'div', html: 'It diverges, by direct comparison', why: 'Right: positive terms above a divergent series.' },
        { code: 'conv', html: 'It converges, because $a_n \\to 0$', why: 'Terms approaching 0 are not enough; these stay above a divergent p-series.' },
        { code: 'inc', html: 'No conclusion: $\\' + trig + ' n$ has no limit', why: 'The comparison does not need a limit, only the inequality, and it holds for every $n$.' }
      ],
      sol: [why0 + ', so $' + (conv ? pre + btex : 'a_n \\ge ' + btex) + '$ for every $n \\ge 1$.', '$\\sum ' + btex + '$ is ' + bsay + ', so it ' + (conv ? 'converges' : 'diverges') + '.', 'By the direct comparison test the series ' + (conv ? 'converges.' : 'diverges.')]
    };
  };
  FAMS.limit = function(r){
    var v = r.int(0, 3), a = r.int(1, 5), c = r.pick(v >= 2 ? [1, 4, 9] : [1, 2, 3, 4, 5]), d = r.int(1, 9), b = r.int(0, 6), atex, q, L, conv;
    if(v === 0){ atex = '\\frac{' + (a === 1 ? '' : a) + 'n' + (b ? ' + ' + b : '') + '}{' + (c === 1 ? '' : c) + 'n^3 + ' + d + '}'; q = 2; L = a / c; }
    else if(v === 1){ atex = '\\frac{' + (a === 1 ? '' : a) + 'n^2' + (b ? ' + ' + b : '') + '}{' + (c === 1 ? '' : c) + 'n^3 + ' + d + '}'; q = 1; L = a / c; }
    else if(v === 2){ a = 1; atex = '\\frac{1}{\\sqrt{' + (c === 1 ? '' : c) + 'n^2 + ' + d + '}}'; q = 1; L = 1 / Math.sqrt(c); }
    else { atex = '\\frac{' + (a === 1 ? '' : a) + 'n}{\\sqrt{' + (c === 1 ? '' : c) + 'n^5 + ' + d + '}}'; q = 1.5; L = a / Math.sqrt(c); }
    conv = q > 1;
    var btex = q === 1.5 ? '\\frac{1}{n^{3/2}}' : '\\frac{1}{n' + (q === 1 ? '' : '^' + q) + '}', pt = q === 1.5 ? '\\frac{3}{2}' : String(q);
    var mis = [{ value: 1, why: H('The limit is the ratio of the leading coefficients' + (v >= 2 ? ' (under the root, take its square root)' : '') + ', not 1. Any finite positive value works for the test.') }];
    if(v >= 2) mis.push({ value: a / c, why: H('Take the square root of the coefficient under the root: $\\sqrt{' + c + 'n^{' + (v === 2 ? 2 : 5) + '}} = ' + Math.sqrt(c) + 'n^{' + (v === 2 ? 1 : '5/2') + '}$.') });
    else mis.push({ value: c / a, why: H('Upside down: $\\frac{a_n}{b_n}$ is the given term divided by $' + btex + '$.') });
    mis.push({ value: 0, why: H('Divide $a_n$ by $b_n = ' + btex + '$ (multiply by $n^{' + pt + '}$) before taking the limit: the powers of $n$ cancel.') });
    return { fam: 'limit', prm: { v: v, a: a, b: b, c: c, d: d }, n0: 1, atex: atex, pos: true, alt: false, best: 'limit', verdict: conv ? 'abs' : 'div',
      right: 'For large $n$, $a_n$ behaves like $\\frac{' + tn(L) + '}{n^{' + pt + '}}$: compare with the p-series $\\sum ' + btex + '$, terms positive.',
      wrong: { ratio: 'For a ratio of powers of $n$ the ratio $\\frac{a_{n+1}}{a_n}$ approaches 1: no conclusion.', nth: 'The terms approach 0, so the nth term test decides nothing.', alt: 'The terms are all positive: nothing alternates.' },
      mid: function(r, codes){ return [stepNum('L', H('With $b_n = ' + btex + '$, find $\\lim_{n \\to \\infty} \\frac{a_n}{b_n}$.'), cellX(L, mis), { d: 3, practice: '1.E', level: 'apply', hint: H('Multiply $a_n$ by $n^{' + pt + '}$, then divide top and bottom by the highest power of $n$.') })]; },
      concl: conv ? [
        { code: 'conv', html: 'It converges: the limit is finite and positive, and $\\sum ' + btex + '$ converges ($p = ' + pt + ' > 1$)', why: 'Right. A finite positive limit means both series behave the same, and the p-series converges.' },
        { code: 'convL', html: 'It converges to $' + tn(L) + '$', why: 'The limit compares the sizes of the terms; it is not the sum of the series.' },
        { code: 'inc', html: 'No conclusion: the limit is not 1', why: 'Any finite positive limit works; it does not need to be 1.' },
        { code: 'div', html: 'It diverges: the limit is positive', why: 'A positive limit means the two series do the same thing, and $\\sum ' + btex + '$ converges.' }
      ] : [
        { code: 'div', html: 'It diverges: the limit is finite and positive, and $\\sum ' + btex + '$ diverges ($p = 1$)', why: 'Right. Both series behave the same, and the harmonic series diverges.' },
        { code: 'convL', html: 'It converges to $' + tn(L) + '$', why: 'The limit compares the sizes of the terms; it is not a sum. And here the comparison series diverges.' },
        { code: 'conv', html: 'It converges, because $a_n \\to 0$', why: 'Terms approaching 0 are not enough: these behave like the harmonic series.' },
        { code: 'inc', html: 'No conclusion: the limit is not 1', why: 'Any finite positive limit works; it does not need to be 1.' }
      ],
      sol: ['Both series have positive terms. With $b_n = ' + btex + '$: $\\lim_{n \\to \\infty} \\frac{a_n}{b_n} = ' + tn(L) + '$, finite and positive.', '$\\sum ' + btex + '$ is a p-series with $p = ' + pt + (conv ? ' > 1$: it converges.' : '$: it diverges.'), 'By the limit comparison test the series ' + (conv ? 'converges.' : 'diverges.')]
    };
  };
  FAMS.alt = function(r){
    var v = r.int(0, 3), atex, btex, n0 = 1, prm, p, k, a, b;
    if(v === 0){ p = r.pick([1, 0.5, 1 / 3]); var den = p === 1 ? 'n' : p === 0.5 ? '\\sqrt{n}' : 'n^{1/3}'; btex = '\\frac{1}{' + den + '}'; atex = '\\frac{(-1)^{n+1}}{' + den + '}'; prm = { v: v, p: p }; }
    else if(v === 1){ n0 = 2; btex = '\\frac{1}{\\ln n}'; atex = '\\frac{(-1)^n}{\\ln n}'; prm = { v: v }; }
    else if(v === 2){ k = r.int(1, 2); btex = '\\frac{n}{n^2 + ' + k + '}'; atex = '\\frac{(-1)^{n+1} n}{n^2 + ' + k + '}'; prm = { v: v, k: k }; }
    else { a = r.int(1, 4); b = r.int(1, 5); var dl = (a === 1 ? '' : a) + 'n + ' + b; btex = '\\frac{1}{' + dl + '}'; atex = '\\frac{(-1)^n}{' + dl + '}'; prm = { v: v, a: a, b: b }; }
    return { fam: 'alt', prm: prm, n0: n0, atex: atex, btex: btex, pos: false, alt: true, best: 'alt', verdict: 'cond',
      right: 'The signs alternate; check that $|a_n| = ' + btex + '$ decreases and approaches 0.',
      wrong: { ratio: '$\\lim \\left|\\frac{a_{n+1}}{a_n}\\right| = 1$ here: the ratio test decides nothing.', nth: 'The terms approach 0, so the nth term test decides nothing.', direct: 'The terms change sign, and the comparison tests need positive terms.', integral: 'The terms change sign, and the integral test needs positive terms.' },
      mid: function(r, codes){ return [choice(r, 'conds', H('Do the conditions hold for $|a_n| = ' + btex + '$?'), [
        { code: 'both', html: 'Yes: $|a_n|$ decreases, and $\\lim |a_n| = 0$', why: 'Right: ' + (v === 2 ? 'for $n \\ge 1$, $\\frac{n}{n^2 + ' + k + '}$ decreases (its derivative $\\frac{' + k + ' - x^2}{(x^2 + ' + k + ')^2}$ is negative for $x > ' + (k === 1 ? '1' : '\\sqrt{2}') + '$, and the first terms already decrease), ' : 'the denominator grows, so $|a_n|$ decreases, ') + 'and the limit is 0.' },
        { code: 'lim', html: 'Only $\\lim |a_n| = 0$ holds; $|a_n|$ does not decrease', why: 'It does decrease: ' + (v === 2 ? 'check a few terms, or the derivative of $\\frac{x}{x^2 + ' + k + '}$.' : 'its denominator increases with $n$.') },
        { code: 'dec', html: 'Only the decrease holds; $\\lim |a_n| \\ne 0$', why: 'The limit is 0: the denominator grows without bound.' },
        { code: 'limonly', html: 'Only the limit matters, and it is 0', why: 'The test needs both conditions, the decrease too. (Here both hold.)' }
      ], { practice: '3.B', level: 'analyze' }, codes)]; },
      concl: [
        { code: 'conv', html: 'It converges, by the alternating series test', why: 'Right. (Only conditionally: $\\sum ' + btex + '$ diverges, so the convergence is not absolute.)' },
        { code: 'abs', html: 'It converges absolutely', why: 'The alternating series test gives convergence, not absolute convergence. Here $\\sum ' + btex + '$ diverges, so it converges only conditionally.' },
        { code: 'div', html: 'It diverges, because $\\sum ' + btex + '$ diverges', why: 'A divergent series of absolute values does not make the alternating series diverge: the alternating series test shows it converges.' },
        { code: 'conv0', html: 'It converges to 0', why: 'The terms approach 0; the sum is not 0. The test gives convergence, not the value.' }
      ],
      sol: ['The series alternates, with $|a_n| = ' + btex + '$.', '$|a_n|$ decreases' + (v === 2 ? ' (for every $n \\ge 1$)' : '') + ' and $\\lim_{n \\to \\infty} |a_n| = 0$.', 'By the alternating series test the series converges.']
    };
  };
  FAMS.ratio = function(r){
    var v = r.int(0, 4), atex, L, prm, n0 = 1, c, k, d, mis = [], conv, how;
    if(v === 0){ c = r.int(2, 6); n0 = r.int(0, 1); atex = '\\frac{' + c + '^n}{n!}'; L = 0; prm = { v: v, c: c }; how = '\\frac{a_{n+1}}{a_n} = \\frac{' + c + '^{n+1}}{(n+1)!} \\cdot \\frac{n!}{' + c + '^n} = \\frac{' + c + '}{n+1} \\to 0';
      mis.push({ value: c, why: H('Cancel the factorials too: $\\frac{n!}{(n+1)!} = \\frac{1}{n+1}$, which sends the ratio to 0.') }); }
    else if(v === 1){ k = r.int(1, 3); c = r.int(2, 5); atex = '\\frac{n' + (k > 1 ? '^' + k : '') + '}{' + c + '^n}'; L = 1 / c; prm = { v: v, k: k, c: c }; how = '\\frac{a_{n+1}}{a_n} = \\left(\\frac{n+1}{n}\\right)^{' + k + '} \\cdot \\frac{1}{' + c + '} \\to \\frac{1}{' + c + '}';
      mis.push({ value: c, why: H('Upside down: $\\frac{' + c + '^n}{' + c + '^{n+1}} = \\frac{1}{' + c + '}$.') }, { value: 1, why: H('$\\left(\\frac{n+1}{n}\\right)^{' + k + '} \\to 1$, but the powers of ' + c + ' leave $\\frac{1}{' + c + '}$.') }); }
    else if(v === 2){ atex = '\\frac{(n!)^2}{(2n)!}'; L = 0.25; prm = { v: v }; how = '\\frac{a_{n+1}}{a_n} = \\frac{(n+1)^2}{(2n+2)(2n+1)} \\to \\frac{1}{4}';
      mis.push({ value: 0.5, why: H('$(2n+2)! = (2n+2)(2n+1)(2n)!$: two new factors, so the limit is $\\frac{n^2}{4n^2} = \\frac{1}{4}$.') }, { value: 1, why: H('Both $(n+1)^2$ and $(2n+2)(2n+1)$ grow like $n^2$, with leading coefficients 1 and 4.') }); }
    else if(v === 3){ atex = '\\frac{n!}{n^n}'; L = 1 / Math.E; prm = { v: v }; how = '\\frac{a_{n+1}}{a_n} = \\left(\\frac{n}{n+1}\\right)^n \\to \\frac{1}{e}';
      mis.push({ value: 1, why: H('$\\left(\\frac{n}{n+1}\\right)^n = \\frac{1}{(1 + 1/n)^n}$, and $(1 + \\frac{1}{n})^n \\to e$, so the limit is $\\frac{1}{e}$, not 1.') }, { value: Math.E, why: H('Upside down: the limit is $\\frac{1}{e}$.') }); }
    else { c = r.int(2, 6); do { d = r.int(3, 8); } while(d <= c || gcd(c, d) > 1); atex = '\\frac{' + c + '^n}{n^2 \\cdot ' + d + '^n}'; L = c / d; prm = { v: v, c: c, d: d }; how = '\\frac{a_{n+1}}{a_n} = \\frac{n^2}{(n+1)^2} \\cdot \\frac{' + c + '}{' + d + '} \\to \\frac{' + c + '}{' + d + '}';
      mis.push({ value: d / c, why: H('Upside down: $\\frac{' + c + '^{n+1}}{' + c + '^n} = ' + c + '$ goes on top.') }); }
    conv = L < 1;
    var wrong = { alt: 'The terms are all positive: nothing alternates.' };
    if(conv) wrong.nth = 'The terms approach 0, so the nth term test decides nothing.';
    if(v === 0 || v === 2 || v === 3) wrong.integral = 'The factorial $n!$ is defined only at whole numbers: there is no continuous $f(x)$ to integrate.';
    if(v === 0 || v === 2) wrong.limit = 'No simple series has terms of the same size as these, so there is nothing natural to compare with.';
    return { fam: 'ratio', prm: prm, n0: n0, atex: atex, pos: true, alt: false, best: 'ratio', verdict: conv ? 'abs' : 'div',
      right: 'Factorials and powers like $' + (v === 1 || v === 4 ? (c + '^n') : 'n!') + '$ simplify in $\\frac{a_{n+1}}{a_n}$: that is when the ratio test works.',
      wrong: wrong,
      mid: function(r, codes){ return [stepNum('L', H('Find $L = \\lim_{n \\to \\infty} \\left|\\frac{a_{n+1}}{a_n}\\right|$.'), cellX(L, mis), { d: 3, practice: '1.E', level: 'apply', hint: H('Write $\\frac{a_{n+1}}{a_n}$, cancel, then take the limit. Exact or three decimal places.') })]; },
      concl: conv ? [
        { code: 'conv', html: 'It converges (absolutely), because $L = ' + tn(L) + ' < 1$', why: 'Right. The terms shrink at least as fast as a geometric series with ratio below 1.' },
        { code: 'convL', html: 'It converges to $' + tn(L) + '$', why: '$L$ is the limit of the ratio of terms, not the sum.' },
        { code: 'div', html: 'It diverges, because $L ' + (L === 0 ? '= 0' : '< 1') + '$', why: 'The other way round: $L < 1$ means convergence, $L > 1$ divergence, $L = 1$ no conclusion.' },
        { code: 'inc', html: 'No conclusion: the ratio test needs $L = 0$', why: 'Any $L < 1$ gives convergence.' }
      ] : [
        { code: 'div', html: 'It diverges, because $L = ' + tn(L) + ' > 1$', why: 'Right. The terms eventually grow, so they cannot approach 0.' },
        { code: 'conv', html: 'It converges, because $L$ is finite', why: 'A finite $L$ is not enough: $L > 1$ means divergence.' },
        { code: 'inc', html: 'No conclusion: $L \\ne 1$', why: 'It is $L = 1$ that decides nothing; $L > 1$ means divergence.' }
      ],
      sol: ['$' + how + '$.', '$L = ' + tn(L) + (conv ? ' < 1$, so by the ratio test the series converges (absolutely).' : ' > 1$, so by the ratio test the series diverges.')]
    };
  };
  var FAM_TOPIC = { nth: 'nth-term-test', integral: 'integral-test', direct: 'comparison-tests', limit: 'comparison-tests', alt: 'alternating-series-test', ratio: 'ratio-test' };
  /* Words for a test that does not settle a series, by test (the default distractor reason). */
  function genTest(r, ctx){
    var fams = ctx.fams && ctx.fams.length ? ctx.fams : Object.keys(FAMS);
    var S = FAMS[r.pick(fams)](r), codes = {};
    var dist = pickN(r, Object.keys(S.wrong), Math.min(3, Object.keys(S.wrong).length));
    var opts = [{ code: S.best, html: TNAME[S.best], why: 'Right. ' + S.right }].concat(dist.map(function(t){ return { code: t, html: TNAME[t], why: S.wrong[t] }; }));
    var Stex = sumTex(S.atex, S.n0);
    var steps = [choice(r, 'test', H('Which test settles $' + Stex + '$?'), opts, { practice: '3.D', level: 'analyze', hint: H('Look at the form of $a_n$: a limit not 0, a function you can integrate, a known series to compare with, alternating signs, or factorials and powers.') }, codes)];
    steps = steps.concat(S.mid(r, codes));
    steps.push(choice(r, 'concl', H('So the series:'), S.concl, { practice: '4.E', level: 'analyze' }, codes));
    // a mixed context records each step under the topic of the family's test
    return { ctx: ctx.id, topic: ctx.fams && ctx.fams.length > 1 ? FAM_TOPIC[S.fam] : ctx.topic, type: 'test', tex: Stex,
      text: H('<p>Does the series $' + Stex + '$ converge or diverge? Choose a test, check what it needs, and conclude.</p>'),
      steps: steps, solution: ['Test: ' + TESTS[S.best].name + '.'].concat(S.sol).map(H),
      fig: { kind: 'series', fam: S.fam, prm: S.prm, n0: S.n0, verdict: S.verdict },
      chk: { fam: S.fam, prm: S.prm, n0: S.n0, best: S.best, verdict: S.verdict, wrong: dist }, codes: codes };
  }

  /* ---------- partial: S_n is given */
  function genPartial(r, ctx){
    var v = r.int(0, 1), codes = {}, S, Stex, sum, prm;
    if(v === 0){ var a = r.int(2, 9), b = r.int(1, 4), c = r.int(1, 6); S = function(n){ return a * n / (b * n + c); }; Stex = '\\frac{' + a + 'n}{' + (b === 1 ? '' : b) + 'n + ' + c + '}'; sum = a / b; prm = { v: v, a: a, b: b, c: c }; }
    else { var k = r.int(1, 6), m = r.int(1, 5), j = r.int(0, 3); S = function(n){ return k - m / (n + j); }; Stex = k + ' - \\frac{' + m + '}{n' + (j ? ' + ' + j : '') + '}'; sum = k; prm = { v: v, k: k, m: m, j: j }; }
    var a1 = S(1), a3 = S(3) - S(2);
    var steps = [
      stepNum('a1', H('Find $a_1$, the first term.'), cellX(a1, [{ value: S(0) || NaN, why: H('$S_0$ is not a partial sum here: the first term is $a_1 = S_1$.') }]), { d: 3, hint: H('The sum of the first one term is the first term: $a_1 = S_1$.') }),
      stepNum('a3', H('Find $a_3$, the third term.'), cellX(a3, [{ value: S(3), why: H('$S_3$ is the sum of the first three terms. The third term alone is $a_3 = S_3 - S_2$.') }, { value: S(3) - S(1), why: H('$S_3 - S_1 = a_2 + a_3$. Subtract $S_2$ instead.') }]), { d: 3, hint: H('$a_3 = S_3 - S_2$.') }),
      stepNum('sum', H('Find $\\sum_{n=1}^{\\infty} a_n$.'), cellX(sum, [{ value: 0, why: H('The terms approach 0, but the sum is the limit of the partial sums: $\\lim_{n \\to \\infty} S_n$.') }, { value: a1, why: H('That is $S_1$. The sum is $\\lim_{n \\to \\infty} S_n$.') }]), { d: 3, practice: '1.E', hint: H('The sum is the limit of the partial sums.') }),
      choice(r, 'concl', H('So the series:'), [
        { code: 'conv', html: 'Converges, because $\\lim S_n = ' + tn(sum) + '$ is finite', why: 'Right: a series converges exactly when its partial sums approach a finite limit.' },
        { code: 'div', html: 'Diverges, because $S_n$ keeps increasing', why: 'Increasing partial sums can still approach a limit, as these do.' },
        { code: 'conv0', html: 'Converges, because $\\lim a_n = 0$', why: '$\\lim a_n = 0$ is needed but never enough (the harmonic series). The reason is that $\\lim S_n$ is finite.' }
      ], { practice: '4.E', level: 'analyze' }, codes)
    ];
    return { ctx: ctx.id, topic: ctx.topic, type: 'partial',
      text: H('<p>The $n$th partial sum of the series $\\sum_{n=1}^{\\infty} a_n$ is $S_n = ' + Stex + '$, the sum of the first $n$ terms.</p>'),
      steps: steps,
      solution: [H('$a_1 = S_1 = ' + tn(a1) + '$.'), H('$a_3 = S_3 - S_2 = ' + tn(S(3)) + ' - ' + tn(S(2)) + ' = ' + tn(a3) + '$.'), H('$\\sum a_n = \\lim_{n \\to \\infty} S_n = ' + tn(sum) + '$: the series converges to $' + tn(sum) + '$.')],
      fig: { kind: 'partial', prm: prm, sum: sum }, chk: { fam: 'partial', prm: prm }, codes: codes };
  }

  /* ---------- sum: geometric */
  var RATIOS = [[1, 2], [1, 3], [2, 3], [3, 4], [1, 4], [2, 5], [3, 5], [4, 5], [1, 5], [5, 6]], BIG = [[3, 2], [5, 4], [4, 3], [2, 1], [5, 3]];
  function genSum(r, ctx){
    var codes = {}, conv = r() < 0.8, pq = r.pick(conv ? RATIOS : BIG), sg = r() < 0.3 ? -1 : 1, A = r.pick([1, 2, 3, 4, 5, 6, 8, 9, 10, 12]), n0 = r.int(0, 2);
    var rr = sg * pq[0] / pq[1], first = A * Math.pow(rr, n0), sum = conv ? first / (1 - rr) : NaN, S3 = first * (1 + rr + rr * rr);
    var rt = sg < 0 ? '\\left(-' + tn(pq[0] / pq[1]) + '\\right)' : '\\left(' + tn(pq[0] / pq[1]) + '\\right)';
    if(pq[1] === 1) rt = sg < 0 ? '(-' + pq[0] + ')' : String(pq[0]);
    var atex = (A === 1 ? '' : A) + rt + '^n', Stex = sumTex(atex, n0);
    var steps = [
      stepNum('r', H('What is the common ratio $r$?'), cellX(rr, [{ value: 1 / rr, why: H('Upside down: $r = \\frac{a_{n+1}}{a_n}$, the factor from one term to the next.') }]), { d: 3, hint: H('Divide a term by the one before it.') }),
      stepNum('first', H('What is the first term (at $n = ' + n0 + '$)?'), cellX(first, n0 ? [{ value: A, why: H('The series starts at $n = ' + n0 + '$: put $n = ' + n0 + '$ into the term. ' + A + ' would be the term at $n = 0$.') }] : [{ value: A * rr, why: H('The series starts at $n = 0$, where $' + rt + '^0 = 1$: the first term is ' + A + '.') }]), { d: 3, hint: H('Put $n = ' + n0 + '$ into $' + atex + '$.') }),
      stepNum('s3', H('Find the partial sum $S_3$: the sum of the first three terms.'), cellX(S3, [{ value: S3 + first * rr * rr * rr, why: H('That adds four terms. $S_3$ is the first three: $n = ' + n0 + ', ' + (n0 + 1) + ', ' + (n0 + 2) + '$.') }, { value: first * (1 + rr), why: H('That is two terms. Add the third.') }]), { d: 3, practice: '1.E', hint: H('Add the first three terms.') }),
      choice(r, 'conv', H('Does the series converge?'), conv ? [
        { code: 'yes', html: 'Yes: $|r| = ' + tn(Math.abs(rr)) + ' < 1$', why: 'Right: a geometric series converges exactly when $|r| < 1$.' },
        { code: 'no', html: 'No: $' + (sg < 0 ? 'r < 0' : 'the terms are all positive') + '$', why: sg < 0 ? 'A negative ratio is fine: only $|r|$ matters.' : 'Positive terms can add to a finite sum when they shrink fast enough; here $|r| < 1$.' },
        { code: 'inc', html: 'It cannot be decided without a test', why: 'For a geometric series $|r|$ decides it: converges when $|r| < 1$.' }
      ] : [
        { code: 'no', html: 'No: $|r| = ' + tn(Math.abs(rr)) + ' \\ge 1$', why: 'Right: with $|r| \\ge 1$ the terms do not approach 0.' },
        { code: 'yes', html: 'Yes: to $\\frac{\\text{first term}}{1 - r}$', why: 'The formula holds only when $|r| < 1$. Here $|r| \\ge 1$: the terms do not even approach 0.' },
        { code: 'inc', html: 'It cannot be decided without a test', why: 'For a geometric series $|r|$ decides it: diverges when $|r| \\ge 1$.' }
      ], { practice: '4.E', level: 'analyze' }, codes)
    ];
    if(conv) steps.push(stepNum('sum', H('Find the sum of the series.'), cellX(sum, [{ value: A / (1 - rr), why: H('$\\frac{' + A + '}{1 - r}$ uses the term at $n = 0$, but the series starts at $n = ' + n0 + '$. Use its first term: $\\frac{' + tn(first) + '}{1 - r}$.') }, { value: first / (1 + rr), why: H('The formula is $\\frac{\\text{first term}}{1 - r}$, with $r = ' + tn(rr) + '$.') }, { value: first * rr / (1 - rr), why: H('The numerator is the first term itself, $' + tn(first) + '$.') }]), { d: 3, practice: '1.E', hint: H('$S = \\frac{\\text{first term}}{1 - r}$.') }));
    return { ctx: ctx.id, topic: ctx.topic, type: 'sum', tex: Stex,
      text: H('<p>Consider the geometric series $' + Stex + '$.</p>'),
      steps: steps,
      solution: [H('$r = ' + tn(rr) + '$; the first term (at $n = ' + n0 + '$) is $' + tn(first) + '$.'), H('$S_3 = ' + tn(first) + ' + ' + pn(first * rr) + ' + ' + pn(first * rr * rr) + ' = ' + tn(S3) + '$.'),
        H(conv ? '$|r| < 1$, so it converges, to $\\frac{' + tn(first) + '}{1 - ' + pn(rr) + '} = ' + tn(sum) + '$.' : '$|r| \\ge 1$, so it diverges: the terms do not approach 0.')],
      fig: { kind: 'geo', first: first, r: rr, sum: conv ? sum : null }, chk: { fam: 'geo', prm: { A: A, r: rr, n0: n0 } }, codes: codes };
  }

  /* ---------- absolute or conditional */
  var ABSD = { 'p+': ['div-p', 'conv-geo', 'conv-ratio', 'div-nth'], 'p-': ['conv-p', 'div-nth', 'conv-ratio', 'conv-geo'], geo: ['conv-p', 'div-p', 'div-nth', 'div-lc'], fact: ['conv-geo', 'div-nth', 'div-p', 'conv-p'], lin: ['div-nth', 'conv-p', 'conv-geo', 'conv-ratio'], nth: ['div-lc', 'conv-p', 'conv-ratio', 'div-p'] };
  var ABS = {
    p: function(r){ var p = r.pick([0.5, 1, 2, 3]); return { prm: { b: 'p', p: p }, btex: p === 0.5 ? '\\frac{1}{\\sqrt{n}}' : p === 1 ? '\\frac{1}{n}' : '\\frac{1}{n^' + p + '}', num: '', den: p === 0.5 ? '\\sqrt{n}' : p === 1 ? 'n' : 'n^' + p, n0: 1, absConv: p > 1, absWhy: p > 1 ? 'a p-series with $p = ' + p + ' > 1$' : 'a p-series with $p = ' + (p === 1 ? '1' : '\\frac{1}{2}') + ' \\le 1$', absCode: p > 1 ? 'conv-p' : 'div-p', ast: true }; },
    geo: function(r){ var k = r.int(2, 5); return { prm: { b: 'geo', k: k }, btex: '\\frac{1}{' + k + '^n}', num: '', den: k + '^n', n0: 1, absConv: true, absWhy: 'geometric with $r = \\frac{1}{' + k + '}$', absCode: 'conv-geo', ast: true }; },
    fact: function(){ return { prm: { b: 'fact' }, btex: '\\frac{1}{n!}', num: '', den: 'n!', n0: 0, absConv: true, absWhy: 'convergent by the ratio test ($L = 0$)', absCode: 'conv-ratio', ast: true }; },
    lin: function(r){ var a = r.int(1, 4), b = r.int(1, 5); return { prm: { b: 'lin', a: a, c: b }, btex: '\\frac{1}{' + (a === 1 ? '' : a) + 'n + ' + b + '}', num: '', den: (a === 1 ? '' : a) + 'n + ' + b, n0: 1, absConv: false, absWhy: 'divergent by limit comparison with $\\sum \\frac{1}{n}$', absCode: 'div-lc', ast: true }; },
    nth: function(r){ var k = r.int(1, 4); return { prm: { b: 'nth', k: k }, btex: '\\frac{n}{n + ' + k + '}', num: ' n', den: 'n + ' + k, n0: 1, absConv: false, absWhy: 'divergent: its terms approach 1, not 0', absCode: 'div-nth', ast: false }; }
  };
  function genAbsolute(r, ctx){
    var codes = {}, B = ABS[r.pick(['p', 'p', 'geo', 'fact', 'lin', 'lin', 'nth'])](r), sg = r() < 0.5 ? '(-1)^n' : '(-1)^{n+1}';
    var aT = '\\frac{' + sg + B.num + '}{' + B.den + '}', Stex;
    Stex = sumTex(aT, B.n0);
    var verdict = B.absConv ? 'abs' : B.ast ? 'cond' : 'div';
    var POOL = {
      'conv-p': { html: 'Converges: a p-series with $p > 1$', why: '$\\sum ' + B.btex + '$ is a p-series with $p > 1$, so it converges.' },
      'div-p': { html: 'Diverges: a p-series with $p \\le 1$', why: 'This is a p-series with $p \\le 1$: it diverges.' },
      'conv-geo': { html: 'Converges: a geometric series with $|r| < 1$', why: 'This is geometric with $|r| < 1$: it converges.' },
      'conv-ratio': { html: 'Converges, by the ratio test', why: 'The ratio test gives $L = 0 < 1$: it converges.' },
      'div-lc': { html: 'Diverges, by limit comparison with $\\sum \\frac{1}{n}$', why: 'Against $\\frac{1}{n}$ the limit is finite and positive, and the harmonic series diverges.' },
      'div-nth': { html: 'Diverges: the terms do not approach 0', why: 'The terms approach 1, so it diverges by the nth term test.' }
    };
    var absList = [{ code: B.absCode, html: POOL[B.absCode].html, why: 'Right: $\\sum ' + B.btex + '$ is ' + B.absWhy + '.' }];
    var dk = B.prm.b === 'p' ? (B.absConv ? 'p+' : 'p-') : B.prm.b;
    pickN(r, ABSD[dk], 3).forEach(function(k){ absList.push({ code: k, html: POOL[k].html, why: 'Not this one: $\\sum ' + B.btex + '$ is ' + B.absWhy + '.' }); });
    absList = absList.slice(0, 4);
    var s2 = B.absConv ? [
      { code: 'conv-abs', html: 'Converges, because $\\sum |a_n|$ converges', why: 'Right: absolute convergence implies convergence.' },
      { code: 'conv-ast', html: 'Its convergence cannot be known without the alternating series test', why: 'No test is needed: a series whose absolute values converge converges.' },
      { code: 'div-nth', html: 'Diverges: the terms do not approach 0', why: 'The terms approach 0.' }
    ] : B.ast ? [
      { code: 'conv-ast', html: 'Converges, by the alternating series test', why: 'Right: $' + B.btex + '$ decreases and approaches 0.' },
      { code: 'div-abs', html: 'Diverges, because $\\sum |a_n|$ diverges', why: 'A divergent series of absolute values says nothing about the alternating series; the alternating series test shows it converges.' },
      { code: 'div-nth', html: 'Diverges: the terms do not approach 0', why: 'They do approach 0.' }
    ] : [
      { code: 'div-nth', html: 'Diverges: the terms do not approach 0', why: 'Right: $|a_n| \\to 1$, so $a_n$ does not approach 0.' },
      { code: 'conv-ast', html: 'Converges, by the alternating series test', why: 'The test needs $|a_n| \\to 0$, and here $|a_n| \\to 1$.' },
      { code: 'div-abs', html: 'Diverges, because $\\sum |a_n|$ diverges', why: 'The conclusion is right but the reason is not: a divergent series of absolute values proves nothing. The nth term test does.' }
    ];
    var s3 = [
      { code: verdict, html: verdict === 'abs' ? 'Converges absolutely' : verdict === 'cond' ? 'Converges conditionally' : 'Diverges', why: 'Right.' },
      { code: verdict === 'abs' ? 'cond' : 'abs', html: verdict === 'abs' ? 'Converges conditionally' : 'Converges absolutely', why: verdict === 'abs' ? 'Conditional means $\\sum a_n$ converges but $\\sum |a_n|$ diverges; here $\\sum |a_n|$ converges.' : 'Absolute means $\\sum |a_n|$ converges; here it diverges.' },
      { code: verdict === 'div' ? 'cond' : 'div', html: verdict === 'div' ? 'Converges conditionally' : 'Diverges', why: verdict === 'div' ? 'Conditional convergence still needs $\\sum a_n$ to converge; it diverges here.' : 'It converges: see the step before.' }
    ];
    var steps = [
      choice(r, 'absS', H('What does $\\sum |a_n| = \\sum ' + B.btex + '$ do?'), absList, { practice: '3.D', level: 'analyze' }, codes),
      choice(r, 'serS', H('What does $' + Stex + '$ itself do?'), s2, { practice: '3.D', level: 'analyze' }, codes),
      choice(r, 'cls', H('So the series:'), s3, { practice: '4.E', level: 'analyze' }, codes)
    ];
    return { ctx: ctx.id, topic: ctx.topic, type: 'absolute', tex: Stex,
      text: H('<p>Does $' + Stex + '$ converge absolutely, converge conditionally, or diverge?</p>'),
      steps: steps,
      solution: [H('$\\sum |a_n| = \\sum ' + B.btex + '$ is ' + B.absWhy + '.'), H(B.absConv ? 'So the series converges absolutely (and so converges).' : B.ast ? 'The series alternates and $' + B.btex + '$ decreases to 0, so it converges by the alternating series test: conditionally.' : '$|a_n| \\to 1 \\ne 0$, so the series diverges by the nth term test.')],
      fig: { kind: 'abs', prm: B.prm, n0: B.n0, sgn: sg, verdict: verdict }, chk: { fam: 'abs', prm: B.prm, n0: B.n0, sgn: sg, verdict: verdict }, codes: codes };
  }

  /* ---------- interval of convergence */
  var EP = {
    'conv-ast': 'It converges, by the alternating series test',
    'conv-p': 'It converges: a p-series with $p > 1$ (absolutely)',
    'div-harm': 'It diverges: the harmonic series',
    'div-nth': 'It diverges: the terms do not approach 0',
    'ratio': 'The ratio test decides it: the limit there is 1',
    'div-p': 'It diverges: a p-series with $p \\le 1$'
  };
  function endCode(alt, p){ // the series sum (+-1)^n / n^p at an endpoint
    if(p > 1) return 'conv-p';
    if(p <= 0) return 'div-nth';
    if(alt) return 'conv-ast';
    return p === 1 ? 'div-harm' : 'div-p';
  }
  function endTex(alt, p, sgn){ var b = p === 0 ? '1' : p === -1 ? 'n' : p === 1 ? '\\frac{1}{n}' : p === 0.5 ? '\\frac{1}{\\sqrt{n}}' : '\\frac{1}{n^' + p + '}';
    if(!alt) return '\\sum ' + (sgn < 0 ? '-' : '') + b; return '\\sum (-1)^n ' + (b === '1' ? '' : b); }
  function endWhy(code){
    return { 'conv-ast': 'the terms alternate and their sizes decrease to 0, so it converges by the alternating series test', 'conv-p': 'it is a p-series with $p > 1$ (in absolute value), so it converges absolutely', 'div-harm': 'it is the harmonic series, which diverges', 'div-nth': 'its terms do not approach 0, so it diverges by the nth term test', 'div-p': 'it is a p-series with $p \\le 1$, which diverges' }[code];
  }
  function genInterval(r, ctx){
    var codes = {}, fam = r.pick(['np', 'np', 'np', 'np', 'sq', 'fact', 'nfact']), a = r.int(-3, 4), steps = [], X = a === 0 ? 'x' : '(x ' + (a < 0 ? '+ ' + (-a) : '- ' + a) + ')', Xa = a === 0 ? '|x|' : '|x ' + (a < 0 ? '+ ' + (-a) : '- ' + a) + '|';
    var p, k, inv, alt, Rr, Rtex, I, sol = [], atex, n0 = 1, prm, ends = {};
    function X2(t){ return t === 1 ? X + '^n' : X + '^{' + t + '}'; }
    if(fam === 'np'){
      p = r.pick([-1, 0, 1, 1, 2, 0.5]); k = r.int(1, 5); inv = k > 1 && r() < 0.25; alt = r() < 0.35;
      Rr = inv ? 1 / k : k; Rtex = tn(Rr);
      var pt = p === -1 ? 'n' : p === 0 ? '' : p === 1 ? 'n' : p === 0.5 ? '\\sqrt{n}' : 'n^' + p;
      var top = (alt ? '(-1)^n' : '') + (p === -1 ? 'n\\,' : '') + (inv ? k + '^n' : '') + X + '^n';
      var bot = (p > 0 ? pt : '') + (!inv && k > 1 ? (p > 0 ? '\\,' : '') + k + '^n' : '');
      atex = bot ? '\\frac{' + top + '}{' + bot + '}' : top; n0 = p > 0 ? 1 : 0; if(p === -1) n0 = 1;
      prm = { fam: fam, a: a, p: p, k: k, inv: inv, alt: alt };
      // at x = a + R the term is (alt ? (-1)^n : 1)/n^p; at a - R, (alt ? 1 : (-1)^n)/n^p
      var hiAlt = alt, loAlt = !alt;
      ends.hi = endCode(hiAlt, p); ends.lo = endCode(loAlt, p);
      I = { lo: ft(a - Rr), hi: ft(a + Rr), loIn: ends.lo.slice(0, 4) === 'conv', hiIn: ends.hi.slice(0, 4) === 'conv' };
      var Lt = inv ? k + Xa : (k > 1 ? '\\frac{' + Xa + '}{' + k + '}' : Xa);
      var ratioList = [{ code: 'ok', html: '$' + Lt + '$', why: 'Right: ' + (p === 0 ? 'the ratio of consecutive terms is ' : 'the powers of $n$ give a factor that approaches 1, leaving ') + '$' + Lt + '$.' },
        k > 1 ? { code: 'inv', html: '$' + (inv ? '\\frac{' + Xa + '}{' + k + '}' : k + Xa) + '$', why: 'Check the constant: $\\frac{a_{n+1}}{a_n}$ carries $' + (inv ? k : '\\frac{1}{' + k + '}') + '$ from the $' + k + '^n$.' }
          : { code: 'inv', html: '$' + Xa + '^2$', why: 'From one term to the next the power of $' + X + '$ goes up by 1, so the factor is $' + Xa + '$, not its square.' },
        { code: 'noabs', html: '$' + (inv ? k + X : (k > 1 ? '\\frac{' + X + '}{' + k + '}' : X)) + '$', why: 'The ratio test uses the absolute value: $\\left|\\frac{a_{n+1}}{a_n}\\right|$.' },
        { code: 'n', html: '$' + Lt + '\\cdot \\frac{n}{n+1}$', why: 'Take the limit as $n \\to \\infty$: no $n$ is left in it.' }];
      steps.push(choice(r, 'L', H('The ratio test: $\\lim_{n \\to \\infty} \\left|\\frac{a_{n+1}}{a_n}\\right| =$'), ratioList, { practice: '1.E', level: 'apply' }, codes));
      steps.push(stepNum('R', H('So the series converges for $' + Lt + ' < 1$. What is the radius of convergence?'), cellX(Rr, [{ value: inv ? k : 1 / k, why: H('Solve $' + Lt + ' < 1$ for $' + Xa + '$: ' + (inv ? 'divide by ' + k : 'multiply by ' + k) + '.') }, { value: a, why: H('That is the center. The radius is the distance from the center to an endpoint.') }, { value: 2 * Rr, why: H('That is the width of the interval. The radius is half of it.') }]), { d: 3, practice: '1.E', hint: H('Solve for $' + Xa + '$: it is less than the radius.') }));
      sol.push('$\\lim \\left|\\frac{a_{n+1}}{a_n}\\right| = ' + Lt + ' < 1$ gives $' + Xa + ' < ' + Rtex + '$: the radius is $' + Rtex + '$.');
    } else if(fam === 'sq'){
      p = r.pick([0, 1, 2]); k = r.pick([2, 3, 4, 9, 5]); Rr = Math.sqrt(k); Rtex = Number.isInteger(Rr) ? String(Rr) : '\\sqrt{' + k + '}';
      atex = '\\frac{' + X + '^{2n}}{' + (p === 0 ? '' : p === 1 ? 'n\\,' : 'n^2\\,') + k + '^n}'; n0 = p ? 1 : 0;
      prm = { fam: fam, a: a, p: p, k: k };
      ends.lo = ends.hi = endCode(false, p);
      I = { lo: Number.isInteger(Rr) ? String(a - Rr) : (a ? a + ' - sqrt(' + k + ')' : '-sqrt(' + k + ')'), hi: Number.isInteger(Rr) ? String(a + Rr) : (a ? a + ' + sqrt(' + k + ')' : 'sqrt(' + k + ')'), loIn: p > 1, hiIn: p > 1 };
      var Ls = '\\frac{' + X + '^2}{' + k + '}';
      steps.push(choice(r, 'L', H('The ratio test: $\\lim_{n \\to \\infty} \\left|\\frac{a_{n+1}}{a_n}\\right| =$'), [
        { code: 'ok', html: '$' + Ls + '$', why: 'Right: the power goes up by 2 from one term to the next, $' + X + '^{2n+2}$ over $' + X + '^{2n}$.' },
        { code: 'one', html: '$\\frac{' + Xa + '}{' + k + '}$', why: 'The exponent is $2n$: from $' + X + '^{2n}$ to $' + X + '^{2n+2}$ the factor is $' + X + '^2$.' },
        { code: 'inv', html: '$' + k + X + '^2$', why: 'The constant: $\\frac{' + k + '^n}{' + k + '^{n+1}} = \\frac{1}{' + k + '}$.' },
        { code: 'n', html: '$' + Ls + '\\cdot \\frac{n}{n+1}$', why: 'Take the limit: no $n$ is left.' }
      ], { practice: '1.E', level: 'apply' }, codes));
      steps.push(stepNum('R', H('So it converges for $' + Ls + ' < 1$. What is the radius of convergence?'), cellX(Rr, [{ value: k, why: H('From $' + X + '^2 < ' + k + '$, take the square root: $' + Xa + ' < ' + Rtex + '$. The radius is $' + Rtex + '$, not ' + k + '.') }, { value: k / 2, why: H('Take the square root of ' + k + ', do not halve it.') }]), { d: 3, practice: '1.E', hint: H('Solve $' + X + '^2 < ' + k + '$: take the square root once. ' + (Number.isInteger(Rr) ? '' : 'Type sqrt(' + k + ') or three decimal places.')) }));
      sol.push('$\\lim \\left|\\frac{a_{n+1}}{a_n}\\right| = ' + Ls + ' < 1$ gives $' + X + '^2 < ' + k + '$, so $' + Xa + ' < ' + Rtex + '$: the radius is $' + Rtex + '$.');
    } else if(fam === 'fact'){
      k = r.int(1, 3); atex = '\\frac{' + X + '^n}{' + (k > 1 ? k + '^n\\,' : '') + 'n!}'; n0 = 0; prm = { fam: fam, a: a, k: k };
      I = { lo: '-inf', hi: 'inf', loIn: false, hiIn: false };
      steps.push(choice(r, 'L', H('The ratio test: $\\lim_{n \\to \\infty} \\left|\\frac{a_{n+1}}{a_n}\\right| =$'), [
        { code: 'ok', html: '$0$, for every $x$', why: 'Right: $\\frac{' + Xa + '}{' + (k > 1 ? k + '(n+1)' : 'n+1') + '} \\to 0$ whatever $x$ is.' },
        { code: 'abs', html: '$' + Xa + '$', why: 'The factorials leave $\\frac{1}{n+1}$, which sends the limit to 0.' },
        { code: 'inf', html: '$\\infty$, unless $x = ' + a + '$', why: 'That is what $n!$ in the numerator would give. Here $n!$ is in the denominator.' }
      ], { practice: '1.E', level: 'apply' }, codes));
      sol.push('$\\left|\\frac{a_{n+1}}{a_n}\\right| = \\frac{' + Xa + '}{' + (k > 1 ? k + '(n+1)' : 'n+1') + '} \\to 0 < 1$ for every $x$: the radius is infinite.');
    } else {
      atex = 'n!\\,' + X + '^n'; n0 = 0; prm = { fam: fam, a: a };
      I = { point: String(a) };
      steps.push(choice(r, 'L', H('The ratio test: $\\lim_{n \\to \\infty} \\left|\\frac{a_{n+1}}{a_n}\\right| =$'), [
        { code: 'ok', html: '$\\infty$, for every $x \\ne ' + a + '$', why: 'Right: $(n+1)' + Xa + '$ grows without bound unless $x = ' + a + '$.' },
        { code: 'zero', html: '$0$, for every $x$', why: 'That is what $n!$ in the denominator would give. Here it multiplies.' },
        { code: 'abs', html: '$' + Xa + '$', why: 'The factorials leave a factor $n + 1$, which grows without bound.' }
      ], { practice: '1.E', level: 'apply' }, codes));
      sol.push('$\\left|\\frac{a_{n+1}}{a_n}\\right| = (n+1)' + Xa + ' \\to \\infty$ unless $x = ' + a + '$: the series converges only at its center.');
    }
    var Stex = sumTex(atex, n0);
    if(ends.lo){
      var loX = fam === 'sq' ? (Number.isInteger(Rr) ? tn(a - Rr) : (a ? a + ' - \\sqrt{' + k + '}' : '-\\sqrt{' + k + '}')) : tn(a - Rr), hiX = fam === 'sq' ? (Number.isInteger(Rr) ? tn(a + Rr) : (a ? a + ' + \\sqrt{' + k + '}' : '\\sqrt{' + k + '}')) : tn(a + Rr);
      [['lo', loX, fam === 'np' ? !alt : false], ['hi', hiX, fam === 'np' ? alt : false]].forEach(function(e){
        var code = ends[e[0]], et = endTex(e[2], p, 1), list = [{ code: code, html: EP[code], why: 'Right: at $x = ' + e[1] + '$ the series is $' + et + '$; ' + endWhy(code) + '.' }];
        // never a second true statement: at an alternating endpoint with p > 1 the alternating series test works too;
        // the series of 1s is also a p-series (p = 0); the harmonic series is a p-series
        var pool = ['ratio', 'conv-ast', 'conv-p', 'div-harm', 'div-nth', 'div-p'].filter(function(c){
          if(c === code) return false;
          if(code === 'conv-p' && e[2] && c === 'conv-ast') return false;
          if((code === 'div-harm' || code === 'div-nth') && c === 'div-p') return false;
          if(code === 'div-p' && c === 'div-harm') return false;
          return true; });
        var pickd = ['ratio'].concat(pickN(r, pool.filter(function(c){ return c !== 'ratio'; }), 2));
        pickd.forEach(function(c){ list.push({ code: c, html: EP[c], why: c === 'ratio' ? 'At an endpoint the ratio test limit is exactly 1, so it decides nothing. Put $x = ' + e[1] + '$ into the series: it is $' + et + '$, and ' + endWhy(code) + '.' : 'At $x = ' + e[1] + '$ the series is $' + et + '$: ' + endWhy(code) + '.' }); });
        steps.push(choice(r, e[0] === 'lo' ? 'lo' : 'hi', H('At the ' + (e[0] === 'lo' ? 'left' : 'right') + ' endpoint, $x = ' + e[1] + '$:'), list, { practice: '3.B', level: 'analyze', hint: H('Put $x = ' + e[1] + '$ into the series, then use a test that can decide that series.') }, codes));
        sol.push('At $x = ' + e[1] + '$: $' + et + '$; ' + endWhy(code) + '.');
      });
    }
    // the interval step (ApCalcBCInterval on the page); its classic slips authored
    var mk = [];
    if(I.point == null && I.lo !== '-inf'){
      var lo = I.lo, hi = I.hi;
      if(I.loIn || I.hiIn) mk.push({ answer: '(' + lo + ', ' + hi + ')', why: 'Both endpoints left out: the ratio test cannot decide an endpoint, so each must be tested on its own; ' + (I.loIn ? 'the left one' : 'the right one') + ' is included.' });
      if(!(I.loIn && I.hiIn)) mk.push({ answer: '[' + lo + ', ' + hi + ']', why: 'Both endpoints included: test each one. ' + (!I.loIn && !I.hiIn ? 'Both diverge.' : (I.loIn ? 'The right one diverges.' : 'The left one diverges.')) });
    }
    var ivWhy = { lo: ends.lo ? 'At x = ' + I.lo + ' the series ' + (I.loIn ? 'converges' : 'diverges') + ': ' + endWhy(ends.lo).replace(/\$/g, '').replace(/\\le/g, '≤').replace(/\\/g, '') + '.' : '', hi: ends.hi ? 'At x = ' + I.hi + ' the series ' + (I.hiIn ? 'converges' : 'diverges') + ': ' + endWhy(ends.hi).replace(/\$/g, '').replace(/\\le/g, '≤').replace(/\\/g, '') + '.' : '' };
    var interval = { lo: I.lo, hi: I.hi, loIn: I.loIn, hiIn: I.hiIn, center: String(a), 'var': 'x', ends: ivWhy, mistakes: mk };
    if(I.point != null) interval = { point: I.point, center: String(a), 'var': 'x', mistakes: [] };
    steps.push({ key: 'int', kind: 'custom', custom: 'interval', label: H('Give the interval of convergence.'), interval: interval, hint: H('Interval notation such as [1, 5), an inequality such as 1 <= x < 5, "all real numbers", or x = 2 for a single point.'), practice: '4.E', level: 'analyze' });
    var ivTex = I.point != null ? 'x = ' + a + '\\text{ only}' : I.lo === '-inf' ? '(-\\infty, \\infty)' : (I.loIn ? '[' : '(') + (fam === 'sq' && !Number.isInteger(Rr) ? (a ? a + ' - \\sqrt{' + k + '}' : '-\\sqrt{' + k + '}') : tn(a - Rr)) + ', ' + (fam === 'sq' && !Number.isInteger(Rr) ? (a ? a + ' + \\sqrt{' + k + '}' : '\\sqrt{' + k + '}') : tn(a + Rr)) + (I.hiIn ? ']' : ')');
    sol.push('The interval of convergence is $' + ivTex + '$.');
    return { ctx: ctx.id, topic: ctx.topic, type: 'interval', tex: Stex,
      text: H('<p>Find the interval of convergence of the power series $' + Stex + '$.</p>'),
      steps: steps, solution: sol.map(H),
      fig: { kind: 'interval', prm: prm, center: a, R: fam === 'fact' ? Infinity : fam === 'nfact' ? 0 : Rr, loIn: !!I.loIn, hiIn: !!I.hiIn, ivTex: ivTex },
      chk: { fam: 'interval', prm: prm, n0: n0, ends: ends }, codes: codes };
  }

  /* The term a_n of a test-kind or absolute problem from its givens, for the page's
     partial-sums figure (the validator has its own). */
  function termOf(fig){
    var P = fig.prm || {};
    if(fig.kind === 'abs'){
      var s = function(n){ return fig.sgn === '(-1)^n' ? (n % 2 ? -1 : 1) : (n % 2 ? 1 : -1); }, b = {
        p: function(n){ return Math.pow(n, -P.p); }, geo: function(n){ return Math.pow(P.k, -n); }, fact: function(n){ return 1 / fact(n); },
        lin: function(n){ return 1 / (P.a * n + P.c); }, nth: function(n){ return n / (n + P.k); } }[P.b];
      return function(n){ return s(n) * b(n); };
    }
    switch(fig.fam){
      case 'nth': return P.v ? function(n){ return n * n / (P.c * n * n + P.d); } : function(n){ return (P.a * n + P.b) / (P.c * n + P.d); };
      case 'integral': return function(n){ return 1 / (n * Math.pow(Math.log(n), P.q)); };
      case 'direct': return P.v === 2 ? function(n){ var t = Math[P.trig](n); return t * t / Math.pow(P.p, n); } : function(n){ return (P.k + Math[P.trig](n)) / Math.pow(n, P.p); };
      case 'limit': return [function(n){ return (P.a * n + P.b) / (P.c * n * n * n + P.d); }, function(n){ return (P.a * n * n + P.b) / (P.c * n * n * n + P.d); }, function(n){ return 1 / Math.sqrt(P.c * n * n + P.d); }, function(n){ return P.a * n / Math.sqrt(P.c * Math.pow(n, 5) + P.d); }][P.v];
      case 'alt': return [function(n){ return (n % 2 ? 1 : -1) / Math.pow(n, P.p); }, function(n){ return (n % 2 ? -1 : 1) / Math.log(n); }, function(n){ return (n % 2 ? 1 : -1) * n / (n * n + P.k); }, function(n){ return (n % 2 ? -1 : 1) / (P.a * n + P.b); }][P.v];
      case 'ratio': return [function(n){ return Math.pow(P.c, n) / fact(n); }, function(n){ return Math.pow(n, P.k) / Math.pow(P.c, n); }, function(n){ return fact(n) * fact(n) / fact(2 * n); }, function(n){ return fact(n) / Math.pow(n, n); }, function(n){ return Math.pow(P.c / P.d, n) / (n * n); }][P.v];
    }
    return null;
  }

  var GEN = { partial: genPartial, sum: genSum, test: genTest, absolute: genAbsolute, interval: genInterval };
  function generate(r, ctx, type){
    var kind = type || ctx.kind || 'test';
    if(!GEN[kind]) throw new Error('seriesLab.generate: no problem kind "' + kind + '"');
    return GEN[kind](r, ctx);
  }

  M.register('seriesLab', {
    TESTS: TESTS, GALLERY: GALLERY, POWER: POWER, galleryById: galleryById, powerById: powerById, partial: partial, powerAt: powerAt, geoSum: geoSum,
    generate: generate, KINDS: Object.keys(GEN), FAMS: Object.keys(FAMS), FAM_TOPIC: FAM_TOPIC, termOf: termOf, fact: fact, tn: tn, dn: dn, dec: dec
  });
})(typeof window !== 'undefined' ? window : globalThis);
