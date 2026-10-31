/* Polynomials and rationals model: ApPrecalcMath.polyRational (docs/apprecalc-architecture.md, "Tools").
   OWNED BY THIS TOOL ONLY (docs/apprecalc-briefs/t2.md): no other tool edits this
   file, and this tool edits no shared file. Pure functions, no DOM, so the
   validator (scripts/lib/apprecalc-tool-checks/poly-rational.mjs) and the test
   (scripts/test/apprecalc-tool-poly-rational.test.mjs) run exactly this code.

   A function is built from its factored form:
     spec = { a, factors: [{ r, m, where }] }
       a       the leading coefficient (the constant in front)
       r       where the factor (x - r) is zero
       m       its multiplicity (1 to 3)
       where   'num' (a zero), 'den' (in the denominator) or 'hole' (the same
               factor once on top and once below, so it cancels)
   Factors at the same r are combined, so (x - 1)^2 over (x - 1) is a hole
   on the x-axis and (x - 1) over (x - 1)^2 is an asymptote.

     fn(spec)        f(x) as written: undefined (NaN) where a denominator is 0
     simple(spec)    f after canceling: defined at a hole
     analyze(spec)   { degN, degD, zeros, holes, vas, end, yint, signs, slant }
     tex(spec)       the factored formula; expanded(spec) the standard forms
     sentences       zeroText, vaText, holeText, endText (TeX between $)
     PRESETS         starting functions for Explore
     KINDS, generate(rng, ctx, type) -> a "Test yourself" problem
   Text holds TeX between dollar signs; the page renders it (ApPrecalcTex). */
(function(G){
  'use strict';
  var M = G.ApPrecalcMath;
  if(!M) return;

  function sgn(v){ return v > 0 ? 1 : v < 0 ? -1 : 0; }
  function clone(spec){ return { a: spec.a, factors: (spec.factors || []).map(function(f){ return { r: f.r, m: f.m || 1, where: f.where || 'num' }; }) }; }

  /* ------------------------------------------------ numbers as TeX */
  // n: a number as TeX (halves stay decimals: 1.5).
  function n(v){ v = Math.abs(v) < 1e-12 ? 0 : v; var s = String(+v.toFixed(6)); return s; }
  // A rational value as an exact fraction when it is one (denominator up to 400).
  function ratio(v){
    if(!isFinite(v)) return null;
    for(var q = 1; q <= 400; q++){ var p = Math.round(v * q); if(Math.abs(p / q - v) < 1e-9){ var g = gcd(Math.abs(p), q); return [p / g, q / g]; } }
    return null;
  }
  function gcd(a, b){ while(b){ var t = a % b; a = b; b = t; } return a || 1; }
  function frac(v){
    var r = ratio(v);
    if(!r) return M.fixed(v, 3);
    if(r[1] === 1) return String(r[0]);
    return (r[0] < 0 ? '-' : '') + '\\frac{' + Math.abs(r[0]) + '}{' + r[1] + '}';
  }
  // The same value as a student types it (3/4, -2).
  function typed(v){ var r = ratio(v); return !r ? M.fixed(v, 3) : r[1] === 1 ? String(r[0]) : r[0] + '/' + r[1]; }
  function lin(r){ return r === 0 ? 'x' : r > 0 ? '(x - ' + n(r) + ')' : '(x + ' + n(-r) + ')'; }
  function pw(base, m){ return m > 1 ? (base === 'x' ? 'x' : base) + '^{' + m + '}' : base; }
  function lead(a){ return a === 1 ? '' : a === -1 ? '-' : n(a); }
  function coefTex(a, rest){ return a === 1 ? rest : a === -1 ? '-' + rest : n(a) + rest; }
  // a numerator or denominator: one bare factor loses its brackets, (x - 2) -> x - 2
  function part(list){ return list.length === 1 && /^\([^()]*\)$/.test(list[0]) ? list[0].slice(1, -1) : list.join(''); }
  function fracTex(top, bot){ return '\\frac{' + part(top) + '}{' + part(bot) + '}'; }
  function infTex(s){ return s > 0 ? '\\infty' : '-\\infty'; }
  function to(p, side){ return n(p) + (side ? '^{' + side + '}' : ''); }
  function limTex(at, val, name){ return '\\lim_{x \\to ' + at + '} ' + (name || 'f') + '(x) = ' + val; }

  /* ------------------------------------------------ the function */
  // Factors combined by location: { r, n (power on top), d (power below) }.
  function agg(spec){
    var by = {};
    (spec.factors || []).forEach(function(f){
      var k = String(f.r), e = by[k] || (by[k] = { r: f.r, n: 0, d: 0 });
      if(f.where === 'hole'){ e.n += 1; e.d += 1; }
      else if(f.where === 'den') e.d += f.m || 1;
      else e.n += f.m || 1;
    });
    return Object.keys(by).map(function(k){ return by[k]; }).sort(function(p, q){ return p.r - q.r; });
  }
  function fn(spec){
    var A = agg(spec), a = spec.a;
    return function(x){
      var v = a;
      for(var i = 0; i < A.length; i++){
        var t = x - A[i].r;
        if(A[i].d && t === 0) return NaN;
        v *= Math.pow(t, A[i].n - A[i].d);
      }
      return v;
    };
  }
  function simple(spec){
    var A = agg(spec), a = spec.a;
    return function(x){
      var v = a;
      for(var i = 0; i < A.length; i++){
        var net = A[i].n - A[i].d, t = x - A[i].r;
        if(net < 0 && t === 0) return NaN;
        v *= net === 0 ? 1 : Math.pow(t, net);
      }
      return v;
    };
  }

  /* Polynomials as coefficient lists, lowest power first. */
  function polyMul(p, q){ var out = []; for(var i = 0; i < p.length + q.length - 1; i++) out.push(0); p.forEach(function(a, i){ q.forEach(function(b, j){ out[i + j] += a * b; }); }); return out; }
  function expand(A, key, lead){
    var p = [lead];
    A.forEach(function(e){ for(var k = 0; k < e[key]; k++) p = polyMul(p, [-e.r, 1]); });
    return p.map(function(c){ return Math.abs(c) < 1e-12 ? 0 : +c.toFixed(9); });
  }
  // Long division: { q, r } with deg r < deg d.
  function polyDiv(num, den){
    var r = num.slice(), dd = den.length - 1, q = [];
    for(var i = 0; i <= r.length - 1 - dd; i++) q.push(0);
    for(var k = r.length - 1; k >= dd; k--){
      var c = r[k] / den[dd]; q[k - dd] = c;
      for(var j = 0; j <= dd; j++) r[k - dd + j] -= c * den[j];
    }
    return { q: q, r: r.slice(0, Math.max(1, dd)) };
  }
  function polyTex(c, v){
    v = v || 'x';
    var parts = [];
    for(var k = c.length - 1; k >= 0; k--){
      var a = c[k]; if(Math.abs(a) < 1e-12) continue;
      var mag = Math.abs(a), body = k === 0 ? n(mag) : (mag === 1 ? '' : n(mag)) + (k === 1 ? v : v + '^{' + k + '}');
      parts.push((parts.length ? (a < 0 ? ' - ' : ' + ') : (a < 0 ? '-' : '')) + body);
    }
    return parts.length ? parts.join('') : '0';
  }

  /* A simple test value inside (lo, hi): an integer if one fits, else a half,
     never at a hole. */
  function testPt(lo, hi, holes){
    var bad = function(v){ return holes.some(function(h){ return Math.abs(h.x - v) < 1e-9; }); }, c = [], v;
    if(!isFinite(lo) && !isFinite(hi)) c = [0, 1, -1, 2];
    else if(!isFinite(lo)) c = [hi - 1, hi - 2, hi - 0.5];
    else if(!isFinite(hi)) c = [lo + 1, lo + 2, lo + 0.5];
    else { for(v = Math.ceil(lo + 1e-9); v < hi - 1e-9; v++) c.push(v); c.sort(function(p, q){ return Math.abs(p - (lo + hi) / 2) - Math.abs(q - (lo + hi) / 2); }); c.push((lo + hi) / 2, lo + (hi - lo) / 4); }
    for(var i = 0; i < c.length; i++) if(!bad(c[i])) return c[i];
    return isFinite(lo) && isFinite(hi) ? lo + (hi - lo) * 0.37 : c[0] + 0.25;
  }
  function analyze(spec){
    var A = agg(spec), a = spec.a, s = simple(spec);
    var degN = 0, degD = 0;
    A.forEach(function(e){ degN += e.n; degD += e.d; });
    var zeros = [], holes = [], vas = [];
    A.forEach(function(e){
      var net = e.n - e.d;
      if(e.d === 0 && net > 0) zeros.push({ x: e.r, m: net, cross: net % 2 === 1 });
      else if(e.d > 0 && net >= 0) holes.push({ x: e.r, y: s(e.r), onAxis: net > 0 });
      else if(net < 0){
        // the sign of every other factor at x = r, then (x - r)^-k on each side
        var k = -net, rest = sgn(a);
        A.forEach(function(o){ var nt = o.n - o.d; if(o === e || !nt) return; if(e.r - o.r < 0 && Math.abs(nt) % 2 === 1) rest = -rest; });
        vas.push({ x: e.r, k: k, right: rest, left: k % 2 === 1 ? -rest : rest });
      }
    });
    var d = degN - degD, end;
    if(d > 0){
      var rt = sgn(a), lf = d % 2 === 1 ? -rt : rt;
      end = { kind: d === 1 && A.some(function(e){ return e.n < e.d; }) ? 'slant' : 'grow', d: d, left: lf * Infinity, right: rt * Infinity };
    } else end = { kind: 'ha', d: d, ha: d === 0 ? a : 0, left: d === 0 ? a : 0, right: d === 0 ? a : 0 };
    var slant = null;
    if(end.kind === 'slant'){ var qd = polyDiv(expand(A, 'n', a), expand(A, 'd', 1)); slant = { m: qd.q[1], b: qd.q[0] }; }
    // the sign chart: cut at every zero and asymptote; a hole does not change the sign
    var cuts = zeros.map(function(z){ return z.x; }).concat(vas.map(function(v){ return v.x; })).sort(function(p, q){ return p - q; });
    var edges = [-Infinity].concat(cuts, [Infinity]), signs = [];
    for(var i = 0; i < edges.length - 1; i++){
      var lo = edges[i], hi = edges[i + 1], mid = testPt(lo, hi, holes);
      signs.push({ a: lo, b: hi, s: sgn(s(mid)), at: mid });
    }
    var inDom = !A.some(function(e){ return e.d > 0 && e.r === 0; });
    return { degN: degN, degD: degD, d: d, zeros: zeros, holes: holes, vas: vas, end: end, slant: slant, signs: signs,
      yint: inDom ? s(0) : null, rational: degD > 0, numC: expand(A, 'n', a), denC: expand(A, 'd', 1) };
  }

  /* ------------------------------------------------ formulas */
  function tex(spec, name){
    var top = [], bot = [];
    // as written: each factor once, the canceling one on both lines
    (spec.factors || []).slice().sort(function(p, q){ return p.r - q.r; }).forEach(function(f){
      if(f.where === 'hole'){ top.push(lin(f.r)); bot.push(lin(f.r)); }
      else (f.where === 'den' ? bot : top).push(pw(lin(f.r), f.m || 1));
    });
    var lhs = (name || 'f') + '(x) = ', T = top.length ? top.join('') : '1';
    if(!bot.length) return lhs + (top.length ? coefTex(spec.a, T) : n(spec.a));
    return lhs + lead(spec.a) + fracTex(top.length ? top : ['1'], bot);
  }
  function expanded(spec, name){
    var R = analyze(spec), lhs = (name || 'f') + '(x) = ';
    if(!R.rational) return lhs + polyTex(R.numC);
    return lhs + '\\frac{' + polyTex(R.numC) + '}{' + polyTex(R.denC) + '}';
  }

  /* ------------------------------------------------ sentences */
  function ordinal(m){ return m === 1 ? 'multiplicity 1' : 'multiplicity ' + m + (m % 2 ? ' (odd)' : ' (even)'); }
  function zeroText(z){
    return '$x = ' + n(z.x) + '$ is a zero of ' + ordinal(z.m) + ', so the graph ' +
      (!z.cross ? 'touches the $x$-axis there and turns back.' : z.m === 1 ? 'crosses the $x$-axis there.' : 'crosses the $x$-axis there, flattening as it crosses.');
  }
  function vaText(v, name){
    name = name || 'f';
    return '$x = ' + n(v.x) + '$ is a vertical asymptote: the factor $' + lin(v.x) + '$ is still in the denominator after canceling. $' +
      limTex(to(v.x, '-'), infTex(v.left), name) + '$ and $' + limTex(to(v.x, '+'), infTex(v.right), name) + '$.';
  }
  function holeText(h, name){
    name = name || 'f';
    return 'Hole at $(' + n(h.x) + ', ' + frac(h.y) + ')$: the factor $' + lin(h.x) + '$ cancels, so $' + name + '(' + n(h.x) + ')$ is not defined but $' +
      limTex(n(h.x), frac(h.y), name) + '$.';
  }
  function endText(R, name){
    name = name || 'f';
    var E = R.end, L = '$' + limTex('-\\infty', '', name), Rr = '$' + limTex('\\infty', '', name);
    if(E.kind === 'ha'){
      var why = !R.rational ? 'A constant function' : E.d === 0 ? 'The degrees are equal (' + R.degN + ' over ' + R.degD + '), so the horizontal asymptote is the ratio of the leading coefficients, $y = ' + frac(E.ha) + '$'
        : 'The denominator has the higher degree (' + R.degN + ' over ' + R.degD + '), so the horizontal asymptote is $y = 0$';
      return why + ': ' + L + frac(E.left) + '$ and ' + Rr + frac(E.right) + '$.';
    }
    var lead = R.numC[R.numC.length - 1];
    var head = !R.rational ? 'Degree ' + R.degN + ', leading coefficient ' + n(lead) + (lead > 0 ? ' > 0' : ' < 0')
      : 'The numerator has the higher degree (' + R.degN + ' over ' + R.degD + '), so there is no horizontal asymptote' + (E.kind === 'slant' ? ' (a slant asymptote instead)' : '');
    return head + ': ' + L + infTex(E.left) + '$ and ' + Rr + infTex(E.right) + '$.';
  }

  /* ------------------------------------------------ presets (Explore) */
  var PRESETS = {
    cubic: { name: 'Cubic, three zeros', spec: { a: 0.5, factors: [{ r: -3, m: 1, where: 'num' }, { r: 0, m: 1, where: 'num' }, { r: 2, m: 1, where: 'num' }] } },
    touch: { name: 'Repeated zero', spec: { a: 0.25, factors: [{ r: -3, m: 1, where: 'num' }, { r: 1, m: 2, where: 'num' }] } },
    quartic: { name: 'Quartic, a < 0', spec: { a: -0.1, factors: [{ r: -4, m: 1, where: 'num' }, { r: -1, m: 2, where: 'num' }, { r: 3, m: 1, where: 'num' }] } },
    asym: { name: 'Two asymptotes', spec: { a: 2, factors: [{ r: 1, m: 1, where: 'num' }, { r: -2, m: 1, where: 'den' }, { r: 3, m: 1, where: 'den' }] } },
    ha: { name: 'Horizontal asymptote', spec: { a: 2, factors: [{ r: -1, m: 1, where: 'num' }, { r: 2, m: 1, where: 'den' }] } },
    hole: { name: 'A hole', spec: { a: 1, factors: [{ r: 3, m: 1, where: 'num' }, { r: -2, m: 1, where: 'hole' }, { r: 1, m: 1, where: 'den' }] } },
    slant: { name: 'Slant asymptote', spec: { a: 0.5, factors: [{ r: -3, m: 1, where: 'num' }, { r: 3, m: 1, where: 'num' }, { r: 1, m: 1, where: 'den' }] } },
    double: { name: 'Squared asymptote', spec: { a: 3, factors: [{ r: -2, m: 1, where: 'num' }, { r: 2, m: 2, where: 'den' }] } }
  };
  var PRESET_ORDER = ['hole', 'cubic', 'touch', 'quartic', 'ha', 'asym', 'double', 'slant'];

  /* ------------------------------------------------ Test yourself */
  var KINDS = ['zeros', 'end', 'ha', 'rzeros', 'va', 'hole'];
  var TITLE = { zeros: 'Zeros and multiplicity', end: 'End behavior of a polynomial', ha: 'Horizontal asymptotes', rzeros: 'Zeros of a rational function', va: 'Vertical asymptotes', hole: 'Holes' };
  // distinct integers in [lo, hi]
  function picks(r, k, lo, hi, avoid){
    var out = [], guard = 0; avoid = avoid || [];
    while(out.length < k && guard++ < 500){ var v = r.int(lo, hi); if(out.indexOf(v) < 0 && avoid.indexOf(v) < 0) out.push(v); }
    return out;
  }
  function shuffled(r, list){ var a = list.slice(); for(var i = a.length - 1; i > 0; i--){ var j = Math.floor(r() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  var A3 = { abs: 0.001 };
  function num(answer, mistakes, d){ var c = M.cell(answer, 0, mistakes || [], A3.abs); return { kind: 'num', cell: c, d: d == null ? 0 : d }; }
  function step(o, key, label, practice, extra){ o.key = key; o.label = label; o.practice = practice; if(extra) for(var k in extra) o[k] = extra[k]; return o; }
  function choice(options, correct, why){ return { kind: 'choice', options: options, correct: correct, why: why }; }
  // a choice with the correct option first in the authored list, the rest in a seeded order
  function choiceOf(r, right, wrongs){
    var all = [right].concat(wrongs), seen = {}, list = [];
    all.forEach(function(o){ if(!seen[o[0]]){ seen[o[0]] = 1; list.push(o); } });
    list = shuffled(r, list);
    var c = 0; list.forEach(function(o, i){ if(o === right) c = i; });
    return choice(list.map(function(o){ return o[0]; }), c, list.map(function(o){ return o[1]; }));
  }
  function specOf(a, top, bot, holes){
    var f = [];
    top.forEach(function(t){ f.push({ r: t[0], m: t[1] || 1, where: 'num' }); });
    bot.forEach(function(t){ f.push({ r: t[0], m: t[1] || 1, where: 'den' }); });
    (holes || []).forEach(function(h){ f.push({ r: h, m: 1, where: 'hole' }); });
    return { a: a, factors: f };
  }

  var GEN = {};
  /* 1.5: degree, the zero where the graph touches, how it passes another */
  GEN.zeros = function(r){
    var xs = picks(r, 3, -4, 4), ms = shuffled(r, [2, r.pick([1, 3]), r.pick([1, 3])]), a = r.pick([1, 2, -1, -2]);
    var spec = specOf(a, xs.map(function(x, i){ return [x, ms[i]]; }), []);
    var R = analyze(spec), deg = R.degN, even = R.zeros.filter(function(z){ return !z.cross; })[0], odd = R.zeros.filter(function(z){ return z.cross; });
    var o = r.pick(odd);
    var text = 'Let $' + tex(spec) + '$.';
    var steps = [
      step(num(deg, [{ value: 3, why: 'You counted the factors. The degree adds the multiplicities (the exponents): ' + ms.join(' + ') + '.' },
        { value: Math.max.apply(null, ms), why: 'That is the largest multiplicity. The degree is the sum of all the exponents.' }]), 'deg', 'What is the degree of $f$?', '2.A'),
      step(num(even.x, odd.map(function(z){ return { value: z.x, why: 'At $x = ' + n(z.x) + '$ the multiplicity is ' + z.m + ', odd, so the graph crosses there.' }; })
        .concat([{ value: -even.x, why: 'The factor $' + lin(even.x) + '$ is zero at $x = ' + n(even.x) + '$: the sign inside the factor is the opposite of the zero.' }])), 'touch',
        'At which zero does the graph touch the $x$-axis without crossing it?', '2.A', { hint: 'Type the $x$-value.' }),
      step(choiceOf(r, o.m === 1 ? ['It crosses the axis like a line.', 'Right: multiplicity 1 is odd, and a single factor changes sign like a line.'] : ['It crosses the axis, flattening as it crosses.', 'Right: multiplicity 3 is odd (it crosses) and more than 1 (it flattens, like $y = x^3$).'],
        [[o.m === 1 ? 'It crosses the axis, flattening as it crosses.' : 'It crosses the axis like a line.', o.m === 1 ? 'Flattening happens for multiplicity 3 or more; this zero has multiplicity 1.' : 'A line-like crossing is multiplicity 1; this zero has multiplicity 3, so the graph flattens.'],
         ['It touches the axis and turns back.', 'Touching and turning back is an even multiplicity. Multiplicity ' + o.m + ' is odd, so the sign changes.']]), 'pass',
        'How does the graph pass through $x = ' + n(o.x) + '$?', '2.A')
    ];
    var sol = ['The degree is the sum of the multiplicities: $' + ms.join(' + ') + ' = ' + deg + '$.', zeroText(even), zeroText(o)];
    return { text: text, steps: steps, solution: sol, fig: spec, values: { deg: deg, touch: even.x, pass: o.x } };
  };
  /* 1.6: degree, the leading coefficient (watch a (c - x) factor), both limits */
  GEN.end = function(r){
    var xs = picks(r, 3, -4, 4, [0]), ms = [r.pick([1, 2]), r.pick([1, 2]), 1], a = r.pick([1, 2, 3, -1, -2]), flip = r() < 0.6;
    // (c - x) = -(x - c): the leading coefficient changes sign
    var parts = xs.map(function(x, i){ var m = ms[i], f = i === 2 && flip ? '(' + n(x) + ' - x)' : lin(x); return pw(f, m); });
    var deg = ms[0] + ms[1] + ms[2], lead = a * (flip ? -1 : 1);
    var spec = specOf(lead, xs.map(function(x, i){ return [x, ms[i]]; }), []);
    var R = analyze(spec);
    var text = 'Let $f(x) = ' + coefTex(a, parts.join('')) + '$.';
    var li = function(at, s){ return '$' + limTex(at, infTex(s)) + '$'; };
    var words = function(at, s){ return 'As $x$ ' + (at === '\\infty' ? 'gets large' : 'gets very negative') + ', $f(x)$ ' + (s > 0 ? 'gets large' : 'gets very negative') + '.'; };
    function endStep(key, at, s){
      return step(choiceOf(r, [li(at, s), 'Right: degree ' + deg + (deg % 2 ? ' (odd)' : ' (even)') + ' with leading coefficient ' + n(lead) + '.'],
        [[li(at, -s), 'The sign is flipped. ' + (flip ? 'The factor $(' + n(xs[2]) + ' - x)$ has $x$-coefficient $-1$, so it changes the sign of the leading term. ' : '') + 'Check the sign of the leading term $' + coefTex(lead, 'x^{' + deg + '}') + '$ for ' + (at === '\\infty' ? 'large positive' : 'large negative') + ' $x$.'],
         [words(at, s), 'Right idea, but the exam wants limit notation: $' + limTex(at, infTex(s)) + '$.']]), key,
        'Which statement describes the end behavior as $x \\to ' + at + '$?', '3.A');
    }
    var steps = [
      step(num(deg, [{ value: 3, why: 'You counted the factors. The degree adds the exponents: ' + ms.join(' + ') + '.' }]), 'deg', 'What is the degree of $f$?', '2.A'),
      step(num(lead, [{ value: a, why: flip ? 'The factor $(' + n(xs[2]) + ' - x)$ contributes $-x$, so the leading coefficient is $' + n(a) + ' \\cdot (-1) = ' + n(lead) + '$.' : 'Recheck the constant in front.' },
        { value: -lead, why: 'Check the sign: multiply the constant by the $x$-coefficient of each factor.' }]), 'lead', 'What is the leading coefficient of $f$ (the coefficient of $x^{' + deg + '}$)?', '2.A'),
      endStep('right', '\\infty', R.end.right > 0 ? 1 : -1),
      endStep('left', '-\\infty', R.end.left > 0 ? 1 : -1)
    ];
    var sol = ['Degree: $' + ms.join(' + ') + ' = ' + deg + '$. Leading term: $' + coefTex(lead, 'x^{' + deg + '}') + '$' + (flip ? ' (the factor $(' + n(xs[2]) + ' - x)$ contributes $-x$).' : '.'), endText(R)];
    return { text: text, steps: steps, solution: sol, fig: spec, values: { deg: deg, lead: lead } };
  };
  /* 1.7: compare degrees, the horizontal asymptote, the limit at infinity */
  GEN.ha = function(r){
    var k = r.int(1, 3), nd = Math.max(0, k + r.pick([-1, 0, 1, 2])), b = r.pick([1, 2, 3, 4, 5, 6, -2, -3]), dd = r.pick([1, 2, 3]);
    var c = nd ? r.nonzero(-9, 9) : 0, e = r.nonzero(-9, 9);
    if(nd && c * dd === b * e) c = c > 0 ? c + 1 : c - 1;      // the slip c/e must differ from b/d
    var numC = [], denC = [], i;
    for(i = 0; i <= nd; i++) numC.push(0); numC[nd] = b; if(nd) numC[0] = c;
    for(i = 0; i <= k; i++) denC.push(0); denC[k] = dd; denC[0] = e;
    var text = 'Let $r(x) = \\frac{' + polyTex(numC) + '}{' + polyTex(denC) + '}$.';
    var rel = nd < k ? 'less' : nd === k ? 'equal' : 'greater', lead = b / dd, ha = rel === 'less' ? 0 : rel === 'equal' ? lead : null;
    var degs = 'The numerator has degree ' + nd + ' and the denominator degree ' + k + '.';
    var REL = { less: 'The numerator\'s degree is less.', equal: 'The degrees are equal.', greater: 'The numerator\'s degree is greater.' };
    var cmp = step(choiceOf(r, [REL[rel], 'Right. ' + degs], ['less', 'equal', 'greater'].filter(function(x){ return x !== rel; }).map(function(x){ return [REL[x], degs + ' Compare the highest powers.']; })),
      'compare', 'Compare the degree of the numerator with the degree of the denominator.', '2.A');
    var haOpt = function(v){ return '$y = ' + frac(v) + '$'; };
    var right = ha === null ? ['There is no horizontal asymptote.', 'Right: the numerator\'s degree is greater, so $|r(x)|$ grows without bound.']
      : [haOpt(ha), rel === 'less' ? 'Right: the higher degree below sends $r(x)$ toward 0.' : 'Right: equal degrees, so the ratio of the leading coefficients, $\\frac{' + n(b) + '}{' + dd + '}$.'];
    var wr = [];
    if(ha !== 0) wr.push([haOpt(0), 'The asymptote is $y = 0$ only when the denominator has the higher degree.']);
    if(ha === null || ha === 0) wr.push([haOpt(lead), 'The ratio of the leading coefficients is the asymptote only when the degrees are equal.']);
    if(nd && ha !== c / e && lead !== c / e) wr.push([haOpt(c / e), 'That is the ratio of the constant terms, which matters near $x = 0$, not for large $x$. Use the leading terms.']);
    if(ha !== null) wr.push(['There is no horizontal asymptote.', 'With the numerator\'s degree ' + (rel === 'less' ? 'lower' : 'equal') + ', $r(x)$ levels off, so there is one.']);
    var haStep = step(choiceOf(r, right, wr), 'ha', 'What is the horizontal asymptote of the graph of $r$?', '2.A');
    var limVal = ha !== null ? frac(ha) : infTex(sgn(lead)), limRight = '$' + limTex('\\infty', limVal, 'r') + '$';
    var lw = [[ha !== null ? '$r(x) \\approx ' + limVal + '$ for large $x$.' : 'As $x$ gets large, $r(x)$ ' + (lead > 0 ? 'gets large.' : 'gets very negative.'), 'Right idea, but the exam wants limit notation: ' + limRight + '.']];
    if(ha !== null) lw.push(['$' + limTex('\\infty', '\\infty', 'r') + '$', 'With the numerator\'s degree ' + (rel === 'less' ? 'lower' : 'equal') + ', $r(x)$ levels off at its asymptote.']);
    else {
      lw.push(['$' + limTex('\\infty', frac(lead), 'r') + '$', 'Leveling off at the ratio of the leading coefficients needs equal degrees; here the top grows faster.']);
      lw.push(['$' + limTex('\\infty', infTex(-sgn(lead)), 'r') + '$', 'Check the sign of the ratio of the leading terms, $\\frac{' + n(b) + '}{' + dd + '}$, for large positive $x$.']);
    }
    var limStep = step(choiceOf(r, [limRight, 'Right: this is the end behavior in limit notation.'], lw), 'lim', 'Which statement gives the end behavior as $x \\to \\infty$?', '3.A');
    var sol = ['Only the leading terms matter for large $x$: $\\frac{' + n(b) + (nd ? (nd > 1 ? 'x^{' + nd + '}' : 'x') : '') + '}{' + (dd === 1 ? '' : n(dd)) + (k > 1 ? 'x^{' + k + '}' : 'x') + '}$, degree ' + nd + ' over degree ' + k + '.',
      ha === null ? 'The numerator\'s degree is greater, so there is no horizontal asymptote and ' + limRight + '.' : 'So the horizontal asymptote is $y = ' + frac(ha) + '$ and ' + limRight + '.'];
    var spec = { num: numC, den: denC };
    return { text: text, steps: [cmp, haStep, limStep], solution: sol, fig: null, poly: spec, values: { rel: rel, ha: ha, nd: nd, k: k, lead: lead } };
  };
  /* 1.8: a zero, the sign on an interval, what happens at the canceled factor */
  GEN.rzeros = function(r){
    var xs = picks(r, 3, -4, 4), z = xs[0], h = xs[1], p = xs[2], a = r.pick([1, 2, -1, 3]);
    var spec = specOf(a, [[z]], [[p]], [h]), R = analyze(spec);
    var text = 'Let $r(x) = ' + lead(a) + fracTex(z < h ? [lin(z), lin(h)] : [lin(h), lin(z)], h < p ? [lin(h), lin(p)] : [lin(p), lin(h)]) + '$.';
    var steps = [];
    steps.push(step(num(z, [{ value: h, why: 'At $x = ' + n(h) + '$ the denominator is 0 too, so $r$ is not defined there: that canceled factor makes a hole, not a zero.' },
      { value: p, why: '$x = ' + n(p) + '$ makes the denominator 0: a vertical asymptote, not a zero.' },
      { value: -z, why: 'The factor $' + lin(z) + '$ is zero at $x = ' + n(z) + '$: the sign inside the factor is the opposite.' }]), 'zero', 'What is the real zero of $r$?', '2.A', { hint: 'Type the $x$-value.' }));
    var mid = R.signs[1], s = mid.s, iv = function(sg){ return '$(' + (isFinite(sg.a) ? n(sg.a) : '-\\infty') + ', ' + (isFinite(sg.b) ? n(sg.b) : '\\infty') + ')$'; };
    var word = s > 0 ? 'positive' : 'negative';
    steps.push(step(choiceOf(r, [iv(mid), 'Right: test any $x$ in it, for example $x = ' + n(mid.at) + '$, and every factor\'s sign gives $r(x) ' + (s > 0 ? '>' : '<') + ' 0$.'],
      [[iv(R.signs[0]), 'Test a value in it: $r(' + n(R.signs[0].at) + ')$ has the other sign. The sign changes only at the zero $x = ' + n(z) + '$ and the asymptote $x = ' + n(p) + '$ (a hole does not change it).'],
       [iv(R.signs[2]), 'Test a value in it: $r(' + n(R.signs[2].at) + ')$ has the other sign. The sign changes only at the zero $x = ' + n(z) + '$ and the asymptote $x = ' + n(p) + '$.']]), 'sign',
      'On which interval is $r(x)$ ' + word + ' for every $x$ (apart from a hole)?', '2.A'));
    steps.push(step(choiceOf(r, ['A hole: $r$ is not defined there, but the graph has no asymptote.', 'Right: the factor $' + lin(h) + '$ cancels, so the graph has a hole at $x = ' + n(h) + '$.'],
      [['A vertical asymptote.', 'An asymptote needs the factor to stay in the denominator after canceling. $' + lin(h) + '$ cancels.'],
       ['A zero of $r$.', 'A zero needs $r(' + n(h) + ') = 0$, but $r(' + n(h) + ')$ is not defined: the denominator is 0.']]), 'at', 'What does the graph of $r$ have at $x = ' + n(h) + '$?', '2.A'));
    var sol = ['Cancel $' + lin(h) + '$: $r(x) = ' + lead(a) + fracTex([lin(z)], [lin(p)]) + '$ for $x \\ne ' + n(h) + '$.', 'The only zero is $x = ' + n(z) + '$; $x = ' + n(h) + '$ is a hole and $x = ' + n(p) + '$ an asymptote.',
      'Sign: $r(x) ' + (s > 0 ? '>' : '<') + ' 0$ on ' + iv(mid) + ', between the cut points.'];
    return { text: text, steps: steps, solution: sol, fig: spec, values: { z: z, h: h, p: p, mid: s } };
  };
  /* 1.9: where the asymptote is, then both one-sided limits */
  GEN.va = function(r){
    var xs = picks(r, 2, -4, 4), z = xs[0], p = xs[1], k = r.pick([1, 1, 2]), a = r.pick([1, 2, 3, -1, -2]);
    var spec = specOf(a, [[z]], [[p, k]]), R = analyze(spec), v = R.vas[0];
    var text = 'Let $' + tex(spec, 'r') + '$.';
    function side(key, sd, val){
      var at = to(p, sd);
      return step(choiceOf(r, ['$' + limTex(at, infTex(val), 'r') + '$', 'Right: for $x$ just ' + (sd === '-' ? 'left' : 'right') + ' of $' + n(p) + '$, the top is ' + (sgn(a * (p - z)) > 0 ? 'positive' : 'negative') + ' and $' + pw(lin(p), k) + '$ is ' + (k === 2 || sd === '+' ? 'positive' : 'negative') + ' and tiny.'],
        [['$' + limTex(at, infTex(-val), 'r') + '$', 'The sign is flipped. For $x$ just ' + (sd === '-' ? 'left' : 'right') + ' of $' + n(p) + '$, find the sign of the top and of $' + pw(lin(p), k) + '$' + (k === 2 ? ' (a square is never negative)' : '') + '.'],
         ['$' + limTex(at, '0', 'r') + '$', 'Near a vertical asymptote the outputs grow without bound: the limit is $\\infty$ or $-\\infty$, not 0.']]), key,
        'Which is true as $x \\to ' + at + '$?', '3.A');
    }
    var steps = [
      step(num(p, [{ value: z, why: '$x = ' + n(z) + '$ makes the numerator 0: that is a zero of $r$, not an asymptote.' }, { value: -p, why: 'The factor $' + lin(p) + '$ is zero at $x = ' + n(p) + '$.' }]), 'x',
        'Where is the vertical asymptote? Type its $x$-value.', '2.A'),
      side('left', '-', v.left), side('right', '+', v.right)
    ];
    var sol = ['The denominator is 0 at $x = ' + n(p) + '$ and the numerator is not, so $x = ' + n(p) + '$ is a vertical asymptote.', vaText(v, 'r')];
    return { text: text, steps: steps, solution: sol, fig: spec, values: { p: p, left: v.left, right: v.right } };
  };
  /* 1.10: where the hole is, its y-value, and the asymptote */
  GEN.hole = function(r){
    var xs = picks(r, 3, -4, 4), h = xs[0], z = xs[1], p = xs[2], a = r.pick([1, 2, -1, 3, 4]);
    var spec = specOf(a, [[z]], [[p]], [h]), y = a * (h - z) / (h - p);
    var top = [lin(h), lin(z)], bot = [lin(h), lin(p)];
    var text = 'Let $r(x) = ' + lead(a) + fracTex(top, bot) + '$.';
    var steps = [
      step(num(h, [{ value: p, why: 'The factor $' + lin(p) + '$ does not cancel, so $x = ' + n(p) + '$ is a vertical asymptote, not a hole.' }, { value: z, why: '$x = ' + n(z) + '$ is a zero of $r$.' }, { value: -h, why: 'The factor $' + lin(h) + '$ is zero at $x = ' + n(h) + '$.' }]), 'hx',
        'At what $x$ is the hole?', '2.A'),
      step(num(y, [{ value: 0, why: 'A hole is not always on the $x$-axis. Cancel $' + lin(h) + '$, then put $x = ' + n(h) + '$ into what is left.' },
        { value: a * (h - z), why: 'You used only the top. After canceling, divide by the factor still below: $' + lin(p) + '$ at $x = ' + n(h) + '$.' },
        { value: -y, why: 'Check a sign when you put $x = ' + n(h) + '$ in.' }], 3), 'hy', 'What is the $y$-value of the hole? (Exact, like 3/4, or three decimals.)', '1.C'),
      step(num(p, [{ value: h, why: 'That factor cancels, so it makes the hole. The asymptote comes from a factor left in the denominator.' }, { value: -p, why: 'The factor $' + lin(p) + '$ is zero at $x = ' + n(p) + '$.' }]), 'va', 'Where is the vertical asymptote? Type its $x$-value.', '2.A')
    ];
    var sol = ['Cancel the common factor $' + lin(h) + '$: $r(x) = ' + lead(a) + fracTex([lin(z)], [lin(p)]) + '$ for $x \\ne ' + n(h) + '$.',
      'Hole: $x = ' + n(h) + '$, $y = \\frac{' + n(a) + '(' + n(h) + ' - ' + (z < 0 ? '(' + n(z) + ')' : n(z)) + ')}{' + n(h) + ' - ' + (p < 0 ? '(' + n(p) + ')' : n(p)) + '} = ' + frac(y) + '$.',
      'The factor $' + lin(p) + '$ stays below, so $x = ' + n(p) + '$ is a vertical asymptote.'];
    return { text: text, steps: steps, solution: sol, fig: spec, values: { h: h, y: y, p: p } };
  };

  function generate(r, ctx, type){
    var list = ctx.types || [ctx.kind || ctx.id], t = type && list.indexOf(type) > -1 ? type : list[0];
    if(!GEN[t]) throw new Error('poly-rational: unknown kind ' + t);
    var p = GEN[t](r, ctx);
    p.ctx = ctx.id; p.type = t; p.topic = ctx.topic; p.title = TITLE[t];
    return p;
  }

  M.register('polyRational', {
    agg: agg, fn: fn, simple: simple, analyze: analyze, tex: tex, expanded: expanded, polyTex: polyTex, polyDiv: polyDiv, expand: expand,
    zeroText: zeroText, vaText: vaText, holeText: holeText, endText: endText, lin: lin, n: n, frac: frac, typed: typed, ratio: ratio, limTex: limTex, infTex: infTex,
    clone: clone, PRESETS: PRESETS, PRESET_ORDER: PRESET_ORDER, KINDS: KINDS, TITLE: TITLE, GEN: GEN, generate: generate
  });
})(typeof window !== 'undefined' ? window : globalThis);
