/* Curve analyzer model: ApCalcMath.curveAnalyzer (docs/apcalc-architecture.md, "Tools").
   OWNED BY THIS TOOL ONLY: no other tool edits this file, and this tool edits
   no shared file. Pure functions, no DOM, so the validator
   (scripts/lib/apcalc-tool-checks/curve-analyzer.mjs) and the test
   (scripts/test/apcalc-tool-curve-analyzer.test.mjs) run exactly this code.

   Explore, curves: CURVES[id] = { f, fp, fpp, tex, dom: [a, b] } in closed form.
     analyze(c) -> { crit: [{ x, kind: 'max'|'min'|'none', undef }], infl: [x],
       signFp: [{ a, b, s }], signFpp: [{ a, b, s }], cand: [{ x, y, role }],
       absMax, absMin }
     critical points are the interior zeros of f′ and the interior points
     where f′ is undefined (f defined); extrema by the first derivative test
     (the sign of f′ on each side); inflection points where f″ changes sign;
     the candidates test on the closed interval.
     sentence(c, feature) -> the justification a reader accepts.
   Explore, optimization: SCENES[id] = { obj(x), dobj(x), dom, best, ... }:
     box (cut squares from a 12 in sheet), fence (240 m, a river on one
     side), can (355 cm³, least metal).

   Test yourself: generate(rng, ctx) for ctx.kind in incdec, extrema,
   candidates, concavity, fgraph (read f from the graph of f′), optimize. */
(function(G){
  'use strict';
  var M = G.ApCalcMath;
  if(!M) return;
  function H(s){ return G.ApCalcTex ? G.ApCalcTex.html(s, { strict: true }) : s; }
  /* An option that holds math: a plain-text name for screen readers and the
     accessibility checks (MathML alone gives a radio no accessible name),
     the rendered math for the eye. One wrapping span keeps the spaces. */
  function escT(s){ return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function optHtml(t){
    if(String(t).indexOf('$') < 0 || !G.ApCalcTex) return '<span class="cd-opt-t">' + H(t) + '</span>';
    return '<span class="cd-opt-t"><span class="sr-only">' + escT(G.ApCalcTex.plain(t)) + '</span><span aria-hidden="true">' + H(t) + '</span></span>';
  }
  function n(x, d){
    if(Math.abs(x - Math.round(x)) < 1e-9) return String(Math.round(x));
    var s = M.fixed(x, d == null ? 3 : d).replace(/0+$/, '').replace(/\.$/, '');
    return s === '-0' ? '0' : s;
  }
  var PI = Math.PI;
  /* x-values that are multiples of π/6 print as π fractions. */
  function xs(x){
    if(Math.abs(x) > 1e-9){
      var k = x / (PI / 6);
      if(Math.abs(k - Math.round(k)) < 1e-9){
        k = Math.round(k); var g = gcd(Math.abs(k), 6), p = k / g, q = 6 / g;
        return (p === 1 ? '' : p === -1 ? '-' : p) + '\\pi' + (q === 1 ? '' : '/' + q);
      }
    }
    var r = Math.round(x * 1000) / 1000, s3 = Math.abs(x * x - 3) < 1e-9;
    if(s3) return (x < 0 ? '-' : '') + '\\sqrt{3}';
    return n(r);
  }
  function gcd(a, b){ return b ? gcd(b, a % b) : a || 1; }
  function cbrt(x){ return Math.cbrt(x); }

  /* ------------------------------------------------------------ curves */
  var CURVES = {
    cubic: { id: 'cubic', name: 'Cubic', dom: [-2, 4],
      tex: { f: 'x^3 - 3x^2 - 9x + 5', fp: '3x^2 - 6x - 9 = 3(x + 1)(x - 3)', fpp: '6x - 6' },
      f: function(x){ return x * x * x - 3 * x * x - 9 * x + 5; }, fp: function(x){ return 3 * x * x - 6 * x - 9; }, fpp: function(x){ return 6 * x - 6; },
      zfp: [-1, 3], zfpp: [1] },
    quartic: { id: 'quartic', name: 'Quartic', dom: [-1, 4],
      tex: { f: 'x^4 - 4x^3', fp: '4x^3 - 12x^2 = 4x^2(x - 3)', fpp: '12x^2 - 24x = 12x(x - 2)' },
      f: function(x){ return x * x * x * x - 4 * x * x * x; }, fp: function(x){ return 4 * x * x * x - 12 * x * x; }, fpp: function(x){ return 12 * x * x - 24 * x; },
      zfp: [0, 3], zfpp: [0, 2] },
    expo: { id: 'expo', name: 'x·e⁻ˣ', dom: [-0.5, 5],
      tex: { f: 'xe^{-x}', fp: '(1 - x)e^{-x}', fpp: '(x - 2)e^{-x}' },
      f: function(x){ return x * Math.exp(-x); }, fp: function(x){ return (1 - x) * Math.exp(-x); }, fpp: function(x){ return (x - 2) * Math.exp(-x); },
      zfp: [1], zfpp: [2] },
    cusp: { id: 'cusp', name: 'Cusp', dom: [-2, 4],
      tex: { f: 'x^{2/3}(x - 5)', fp: '\\frac{5(x - 2)}{3x^{1/3}}', fpp: '\\frac{10(x + 1)}{9x^{4/3}}' },
      f: function(x){ var c = cbrt(x); return c * c * (x - 5); }, fp: function(x){ return 5 * (x - 2) / (3 * cbrt(x)); }, fpp: function(x){ var c = cbrt(x); return 10 * (x + 1) / (9 * c * c * c * c); },
      zfp: [2], zfpp: [-1], undef: [0] },
    trig: { id: 'trig', name: '2 sin x − x', dom: [0, 2 * PI], piX: true,
      tex: { f: '2\\sin x - x', fp: '2\\cos x - 1', fpp: '-2\\sin x' },
      f: function(x){ return 2 * Math.sin(x) - x; }, fp: function(x){ return 2 * Math.cos(x) - 1; }, fpp: function(x){ return -2 * Math.sin(x); },
      zfp: [PI / 3, 5 * PI / 3], zfpp: [PI] },
    rational: { id: 'rational', name: '4x/(x² + 1)', dom: [-4, 4],
      tex: { f: '\\frac{4x}{x^2 + 1}', fp: '\\frac{4(1 - x^2)}{(x^2 + 1)^2}', fpp: '\\frac{8x(x^2 - 3)}{(x^2 + 1)^3}' },
      f: function(x){ return 4 * x / (x * x + 1); }, fp: function(x){ return 4 * (1 - x * x) / Math.pow(x * x + 1, 2); }, fpp: function(x){ return 8 * x * (x * x - 3) / Math.pow(x * x + 1, 3); },
      zfp: [-1, 1], zfpp: [-Math.sqrt(3), 0, Math.sqrt(3)] }
  };
  var ORDER = ['cubic', 'quartic', 'expo', 'cusp', 'trig', 'rational'];

  /* The sign of g on each piece of [a, b] cut at the given points. */
  function signs(g, a, b, cuts){
    var pts = [a].concat(cuts.filter(function(x){ return x > a + 1e-9 && x < b - 1e-9; }).sort(function(p, q){ return p - q; }), [b]), out = [];
    for(var i = 0; i < pts.length - 1; i++){
      var m = (pts[i] + pts[i + 1]) / 2, v = g(m);
      out.push({ a: pts[i], b: pts[i + 1], s: v > 0 ? 1 : v < 0 ? -1 : 0 });
    }
    return out;
  }
  function analyze(c){
    var a = c.dom[0], b = c.dom[1], inside = function(x){ return x > a + 1e-9 && x < b - 1e-9; };
    var crits = (c.zfp || []).concat(c.undef || []).filter(inside).sort(function(p, q){ return p - q; });
    var h = 1e-4 * Math.max(1, b - a);
    var crit = crits.map(function(x){
      var l = c.fp(x - h), r = c.fp(x + h);
      return { x: x, undef: (c.undef || []).indexOf(x) > -1, kind: l > 0 && r < 0 ? 'max' : l < 0 && r > 0 ? 'min' : 'none', left: l > 0 ? 1 : -1, right: r > 0 ? 1 : -1 };
    });
    var infl = (c.zfpp || []).concat(c.undef || []).filter(inside).filter(function(x){ return c.fpp(x - h) * c.fpp(x + h) < 0; }).sort(function(p, q){ return p - q; });
    var cand = [{ x: a, role: 'endpoint' }].concat(crit.map(function(k){ return { x: k.x, role: 'critical point' }; }), [{ x: b, role: 'endpoint' }])
      .map(function(k){ k.y = c.f(k.x); return k; });
    var absMax = cand.reduce(function(m, k){ return k.y > m.y + 1e-12 ? k : m; }, cand[0]);
    var absMin = cand.reduce(function(m, k){ return k.y < m.y - 1e-12 ? k : m; }, cand[0]);
    return {
      crit: crit, infl: infl, cand: cand, absMax: absMax, absMin: absMin,
      signFp: signs(c.fp, a, b, crits), signFpp: signs(c.fpp, a, b, (c.zfpp || []).concat(c.undef || []))
    };
  }
  /* The sentences the scoring guidelines accept. */
  function sentence(c, feat){
    var X = xs(feat.x), sw = function(s){ return s > 0 ? 'positive' : 'negative'; };
    if(feat.type === 'crit'){
      var why = feat.undef ? '$f\'(' + X + ')$ is undefined (and $f$ is defined there), so $x = ' + X + '$ is a critical point. ' : '$f\'(' + X + ') = 0$, so $x = ' + X + '$ is a critical point. ';
      if(feat.kind === 'max') return why + '$f$ has a relative maximum at $x = ' + X + '$ because $f\'$ changes from positive to negative there.';
      if(feat.kind === 'min') return why + '$f$ has a relative minimum at $x = ' + X + '$ because $f\'$ changes from negative to positive there.';
      return why + '$f$ has neither a maximum nor a minimum at $x = ' + X + '$ because $f\'$ is ' + sw(feat.left) + ' on both sides: it does not change sign.';
    }
    if(feat.type === 'infl') return 'The graph of $f$ has a point of inflection at $x = ' + X + '$ because $f\'\'$ changes sign there (equivalently, $f\'$ changes from ' + (c.fpp(feat.x - 1e-3) > 0 ? 'increasing to decreasing' : 'decreasing to increasing') + ').';
    return '';
  }
  function features(c){
    var A = analyze(c);
    return A.crit.map(function(k){ return { type: 'crit', x: k.x, kind: k.kind, undef: k.undef, left: k.left, right: k.right }; })
      .concat(A.infl.map(function(x){ return { type: 'infl', x: x }; })).sort(function(p, q){ return p.x - q.x; })
      .map(function(f){ f.text = sentence(c, f); return f; });
  }

  /* ----------------------------------------------------- optimization */
  var SCENES = {
    box: { id: 'box', name: 'Open box', W: 12, dom: [0, 6], step: 0.05, start: 1, unit: 'in', ounit: 'in³', var: 'x', what: 'volume', goal: 'max',
      label: 'Side of each cut square', sym: 'V', tex: { obj: 'V(x) = x(12 - 2x)^2', d: "V'(x) = (12 - 2x)(12 - 6x)" },
      obj: function(x){ return x * (12 - 2 * x) * (12 - 2 * x); }, dobj: function(x){ return (12 - 2 * x) * (12 - 6 * x); }, best: 2 },
    fence: { id: 'fence', name: 'Fence by a river', P: 240, dom: [0, 120], step: 1, start: 30, unit: 'm', ounit: 'm²', var: 'x', what: 'area', goal: 'max',
      label: 'Side away from the river', sym: 'A', tex: { obj: 'A(x) = x(240 - 2x)', d: "A'(x) = 240 - 4x" },
      obj: function(x){ return x * (240 - 2 * x); }, dobj: function(x){ return 240 - 4 * x; }, best: 60 },
    can: { id: 'can', name: 'Soda can', V: 355, dom: [1.5, 8], step: 0.01, start: 2, unit: 'cm', ounit: 'cm²', var: 'r', what: 'surface area', goal: 'min',
      label: 'Radius of the can', sym: 'S', tex: { obj: 'S(r) = 2\\pi r^2 + \\frac{710}{r}', d: "S'(r) = 4\\pi r - \\frac{710}{r^2}" },
      obj: function(r){ return 2 * PI * r * r + 710 / r; }, dobj: function(r){ return 4 * PI * r - 710 / (r * r); }, best: Math.cbrt(710 / (4 * PI)) }
  };
  var SORDER = ['box', 'fence', 'can'];
  function sceneSentence(s){
    var b = s.best, B = n(b, 3), O = n(s.obj(b), 3);
    if(s.id === 'box') return '$V\'$ changes from positive to negative at $x = 2$, the only critical point in $(0, 6)$, and $V(0) = V(6) = 0$; so $V(2) = 128$ in³ is the absolute maximum (candidates test).';
    if(s.id === 'fence') return '$A\'$ changes from positive to negative at $x = 60$, the only critical point in $(0, 120)$, and $A(0) = A(120) = 0$; so $A(60) = 7200$ m² is the absolute maximum.';
    return '$S\'$ changes from negative to positive at $r \\approx ' + B + '$, the only critical point for $r > 0$, so $S$ has its absolute minimum there: about ' + O + ' cm², with $h = 2r$.';
  }

  /* ============================================================ the drill */
  /* Keep the options of a choice distinct: a repeated text is replaced by
     the next spare [text, why] from pool. */
  function distinct(list, pool){
    var seen = [], spare = (pool || []).slice();
    return list.map(function(o){
      while(seen.indexOf(o[0]) > -1 && spare.length) o = spare.shift();
      seen.push(o[0]); return o;
    });
  }
  function choice(key, label, list, practice){
    return { key: key, kind: 'choice', label: H(label), options: list.map(function(o){ return optHtml(o[0]); }), why: list.map(function(o){ return H(o[1]); }), correct: 0, practice: practice || '3.E' };
  }
  function numStep(key, label, answer, mistakes, o){
    o = o || {};
    var calc = !!o.calc, whole = !calc && Math.abs(answer - Math.round(answer)) < 1e-9;
    return { key: key, kind: 'num', label: H(label), unit: o.unit || '', practice: o.practice || '1.E', d: whole ? 0 : 3,
      hint: calc ? 'Calculator: correct to three decimal places.' : whole ? '' : 'Exact (like 7/2) or to three decimal places.',
      cell: M.cell(answer, calc ? 0 : 6e-4, (mistakes || []).map(function(m){ return { value: m[0], why: H(m[1]) }; }), calc ? 0.001 : 6e-4) };
  }
  function exprStep(key, label, lhs, answer, mistakes, dom){
    return { key: key, kind: 'expr', label: H(label), lhs: lhs, practice: '1.E',
      cell: M.exprCell(answer, { vars: ['x'], domain: dom || [-3, 3], mistakes: (mistakes || []).map(function(m){ return { expr: m[0], why: m[1] }; }) }) };
  }
  function peval(c, x){ return c.reduce(function(s, k){ return s * x + k; }, 0); }
  function pder(c){ var d = c.length - 1; return c.slice(0, -1).map(function(k, i){ return k * (d - i); }); }
  function polyTex(c){
    var deg = c.length - 1, out = '';
    c.forEach(function(k, i){
      var p = deg - i;
      if(Math.abs(k) < 1e-12) return;
      var a = Math.abs(k), s = k < 0 ? (out ? ' - ' : '-') : (out ? ' + ' : '');
      out += s + (a === 1 && p ? '' : n(a)) + (p ? 'x' + (p > 1 ? '^' + p : '') : '');
    });
    return out || '0';
  }
  function fac(k, r){ return '(x ' + (r < 0 ? '+ ' + (-r) : '- ' + r) + ')' + (k > 1 ? '^' + k : ''); }
  function lead(k){ return k === 1 ? '' : k === -1 ? '-' : String(k); }
  /* Interval text from cut points and signs: "(-∞, -1) and (3, ∞)". */
  function ivText(pts, want, sg){
    var b = [-Infinity].concat(pts, [Infinity]), out = [];
    for(var i = 0; i < b.length - 1; i++) if(sg[i] === want) out.push('(' + (b[i] === -Infinity ? '-\\infty' : n(b[i])) + ', ' + (b[i + 1] === Infinity ? '\\infty' : n(b[i + 1])) + ')');
    return out.length ? '$' + out.join('$ and $') + '$' : 'nowhere';
  }

  var GEN = {};
  GEN.incdec = function(r){
    var p = r.int(-4, 1), q = p + r.int(1, 4), k = r.pick([1, 2, 3, -1, -2]);
    var fp = function(x){ return k * (x - p) * (x - q); };
    var sg = [Math.sign(fp(p - 1)), Math.sign(fp((p + q) / 2)), Math.sign(fp(q + 1))];
    var inc = ivText([p, q], 1, sg), dec = ivText([p, q], -1, sg);
    var text = H('<p>The derivative of a function $f$ is $f\'(x) = ' + lead(k) + fac(1, p) + fac(1, q) + '$ for all real $x$.</p>');
    var steps = [
      numStep('z', 'Find the smaller critical point of $f$.', p, [[q, 'That is the larger one. Solve $f\'(x) = 0$: $x = ' + p + '$ or $x = ' + q + '$.'], [-p, 'Set each factor to 0: $x ' + (p < 0 ? '+ ' + (-p) : '- ' + p) + ' = 0$ gives $x = ' + p + '$.']], { practice: '1.E' }),
      choice('inc', 'On which intervals is $f$ increasing?', distinct([
        [inc, 'Right: $f$ increases where $f\'(x) > 0$. Test a value in each interval between the critical points.'],
        [dec, 'Those are where $f\'(x) < 0$, so $f$ decreases there.'],
        ['$(-\\infty, ' + q + ')$', 'Check the sign of $f\'$ on each interval: it changes at $x = ' + p + '$ too.'],
        ['$(' + n(Math.min(-p, -q)) + ', ' + n(Math.max(-p, -q)) + ')$', 'The critical points are the zeros of the factors: $x = ' + p + '$ and $x = ' + q + '$.']
      ], [['$(' + p + ', \\infty)$', 'Check the sign of $f\'$ on each interval: it changes again at $x = ' + q + '$.'], ['$(-\\infty, ' + p + ')$', 'Check the sign of $f\'$ on each interval between and beyond the critical points.']]), '2.E'),
      choice('why', 'Which reason justifies your answer?', [
        ['$f\'(x) > 0$ on those intervals.', 'Right: name the derivative and its sign on the interval.'],
        ['$f(x) > 0$ on those intervals.', 'The sign of $f$ is about where the graph is above the axis, not whether it rises. Use the sign of $f\'$.'],
        ['$f\'$ is increasing on those intervals.', 'That is concavity: $f\'$ increasing means $f$ is concave up. Rising needs $f\' > 0$.'],
        ['$f\'(' + p + ') = 0$ and $f\'(' + q + ') = 0$.', 'Those zeros only cut the line into intervals; the sign of $f\'$ on each interval decides.']
      ], '3.E')
    ];
    var sol = ['$f\'(x) = 0$ at $x = ' + p + '$ and $x = ' + q + '$; these cut the line into three intervals.', 'Test points: $f\'$ is ' + sg.map(function(s){ return s > 0 ? 'positive' : 'negative'; }).join(', ') + ' on the three intervals.', '$f$ is increasing on ' + inc + ' because $f\'(x) > 0$ there.'];
    return { text: text, steps: steps, solution: sol, fig: { kind: 'fp', f: fp, dom: [p - 2.5, q + 2.5], label: 'Graph of the derivative f′' }, values: { p: p, q: q, k: k, sg: sg } };
  };

  GEN.extrema = function(r){
    // f′ = k(x − p)^m1 (x − q)^m2 with one double factor sometimes
    var p = r.int(-3, 1), q = p + r.int(2, 4), k = r.pick([1, -1, 2]), dbl = r.pick([0, 0, 1, 2]);
    var m1 = dbl === 1 ? 2 : 1, m2 = dbl === 2 ? 2 : 1;
    var fp = function(x){ return k * Math.pow(x - p, m1) * Math.pow(x - q, m2); };
    var kindAt = function(z){ var l = fp(z - 0.01), rr = fp(z + 0.01); return l > 0 && rr < 0 ? 'max' : l < 0 && rr > 0 ? 'min' : 'none'; };
    var kp = kindAt(p), kq = kindAt(q);
    var want = kp !== 'none' ? p : q, wk = kindAt(want), other = want === p ? q : p, ok = kindAt(other);
    var W = wk === 'max' ? 'maximum' : 'minimum';
    var text = H('<p>The derivative of $f$ is $f\'(x) = ' + lead(k) + fac(m1, p) + fac(m2, q) + '$.</p>');
    var steps = [
      numStep('x', 'At what value of $x$ does $f$ have a relative ' + W + '?', want, [[other, ok === 'none' ? '$f\'(' + other + ') = 0$, but $f\'$ does not change sign there (a squared factor), so there is no extremum.' : 'At $x = ' + other + '$, $f$ has a relative ' + (ok === 'max' ? 'maximum' : 'minimum') + ': check which way $f\'$ changes sign.']], { practice: '1.E' }),
      choice('why', 'Which justification earns the point?', [
        ['$f\'$ changes from ' + (wk === 'max' ? 'positive to negative' : 'negative to positive') + ' at $x = ' + want + '$.', 'Right: name $f\'$, say it changes sign, from what to what, and where.'],
        ['$f\'(' + want + ') = 0$.', '$f\' = 0$ alone is not enough: at a double factor $f\' = 0$ with no extremum. Say how $f\'$ changes sign.'],
        ['$f\'$ changes from ' + (wk === 'max' ? 'negative to positive' : 'positive to negative') + ' at $x = ' + want + '$.', 'That change of sign gives a relative ' + (wk === 'max' ? 'minimum' : 'maximum') + '. Check the signs on each side.'],
        ['$f(' + want + ')$ is the ' + (wk === 'max' ? 'largest' : 'smallest') + ' value of $f$.', 'That is a global claim nobody has shown, and a relative extremum needs only a local reason: the sign change of $f\'$.']
      ], '3.E'),
      choice('other', 'What does $f$ have at $x = ' + other + '$?', [
        [ok === 'none' ? 'Neither: $f\'$ does not change sign at $x = ' + other + '$.' : 'A relative ' + (ok === 'max' ? 'maximum' : 'minimum') + ': $f\'$ changes from ' + (ok === 'max' ? 'positive to negative.' : 'negative to positive.'), ok === 'none' ? 'Right: the squared factor keeps $f\'$ from changing sign.' : 'Right: $f\'$ changes sign there.'],
        [ok === 'none' ? 'A relative ' + (wk === 'max' ? 'minimum' : 'maximum') + ', because $f\'(' + other + ') = 0$.' : 'Neither, because $f\'$ is zero there.', ok === 'none' ? '$f\' = 0$ is not enough: $f\'$ has the same sign on both sides of $x = ' + other + '$.' : 'Being zero is not the test; the change of sign is, and $f\'$ does change sign there.'],
        ['A point of inflection, because $f\'(' + other + ') = 0$.', 'An inflection point needs $f\'\'$ to change sign; $f\' = 0$ says nothing about that by itself.'],
        ['A relative ' + W + ' as well.', 'Check the signs of $f\'$ on each side of $x = ' + other + '$.']
      ], '3.E')
    ];
    var sol = ['$f\'(x) = 0$ at $x = ' + p + '$ and $x = ' + q + '$.', 'Signs of $f\'$: ' + [p - 0.5, (p + q) / 2, q + 0.5].map(function(z){ return fp(z) > 0 ? '+' : '−'; }).join(', ') + ' on $(-\\infty, ' + p + ')$, $(' + p + ', ' + q + ')$, $(' + q + ', \\infty)$.', '$f$ has a relative ' + W + ' at $x = ' + want + '$ because $f\'$ changes from ' + (wk === 'max' ? 'positive to negative' : 'negative to positive') + ' there.'];
    return { text: text, steps: steps, solution: sol, fig: { kind: 'fp', f: fp, dom: [p - 2, q + 2], label: 'Graph of the derivative f′' }, values: { p: p, q: q, k: k, m1: m1, m2: m2, want: want, wk: wk, other: other, ok: ok } };
  };

  GEN.candidates = function(r){
    // f = x³ − (3/2)(p + q)x² + 3pq·x + d with p + q even: f′ = 3(x − p)(x − q)
    var p = r.int(-3, 1), q = p + r.pick([2, 4]), d = r.int(-5, 5), s = r.pick([1, -1]);
    var c = [s, -s * 1.5 * (p + q), s * 3 * p * q, d], f = function(x){ return peval(c, x); };
    var a = r.int(p - 3, p - 1), b = r.int(q - 1, q + 2);
    if(b <= q) b = q + 1;
    var crit = [p, q].filter(function(x){ return x > a && x < b; });
    var cand = [a].concat(crit, [b]), vals = cand.map(f);
    var mx = Math.max.apply(null, vals), mn = Math.min.apply(null, vals);
    var xMax = cand[vals.indexOf(mx)], xMin = cand[vals.indexOf(mn)];
    var cp = pder(c);
    var text = H('<p>Let $f(x) = ' + polyTex(c) + '$ on the closed interval $[' + a + ', ' + b + ']$.</p>');
    var critVals = crit.map(f), localMax = Math.max.apply(null, critVals), localMin = Math.min.apply(null, critVals);
    var steps = [
      exprStep('fp', 'Find $f\'(x)$.', "f'(x) =", polyTex(cp), d ? [[polyTex(cp.slice(0, -1).concat([cp[2] + d])), 'The derivative of the constant ' + d + ' is 0.']] : cp[2] ? [[polyTex([cp[0], cp[1], 0]), 'Keep the constant term: the derivative of ' + n(c[2]) + 'x is ' + n(c[2]) + '.']] : []),
      choice('cand', 'Which $x$-values are the candidates for the absolute extrema?', distinct([
        ['$x = ' + cand.join(', ') + '$', 'Right: both endpoints and every critical point inside the interval.'],
        ['$x = ' + (crit.length ? crit : [p, q]).join(', ') + '$', 'Add the endpoints: on a closed interval an absolute extremum can be at an end.'],
        ['$x = ' + a + ', ' + b + '$', 'Add the critical points inside the interval, where $f\'(x) = 0$.'],
        ['$x = ' + [a, p, q, b].sort(function(u, v){ return u - v; }).join(', ') + '$', 'A critical point outside $[' + a + ', ' + b + ']$ is not a candidate.']
      ], [['$x = ' + a + ', ' + (a + b) / 2 + ', ' + b + '$', 'The midpoint is not special. The candidates are the endpoints and the critical points.']]), '3.B'),
      numStep('max', 'What is the absolute maximum value of $f$ on $[' + a + ', ' + b + ']$?', mx, [[xMax, 'That is where the maximum is. The question asks for the value, $f(' + xMax + ')$.'], [localMax, 'That is the largest value at a critical point. Compare with the endpoints too.']], { practice: '1.E' }),
      numStep('min', 'What is the absolute minimum value of $f$ on $[' + a + ', ' + b + ']$?', mn, [[xMin, 'That is where the minimum is. The question asks for the value, $f(' + xMin + ')$.'], [localMin, 'That is the smallest value at a critical point. Compare with the endpoints too.']], { practice: '1.E' }),
      choice('why', 'Which justification of the absolute maximum earns the point?', [
        ['Candidates test: $f$ is continuous on $[' + a + ', ' + b + ']$, and comparing $f$ at the endpoints and critical points, the largest value is $f(' + xMax + ') = ' + n(mx) + '$.', 'Right: an absolute extremum needs a global argument, comparing every candidate.'],
        ['$f\'$ changes from positive to negative at $x = ' + (s > 0 ? p : q) + '$.', 'That is a local argument: it shows a relative maximum, not the absolute one. Compare all the candidates.'],
        ['$f\'(' + xMax + ') = 0$.', 'An endpoint maximum can have $f\' \\ne 0$, and $f\' = 0$ does not prove a maximum. Use the candidates test.'],
        ['$f\'\'(' + (crit[0] != null ? crit[0] : a) + ') ' + (6 * s * (crit[0] != null ? crit[0] : a) - 3 * s * (p + q) < 0 ? '< 0' : '> 0') + '$.', 'The second derivative test is local. The absolute maximum needs every candidate compared.']
      ], '3.E')
    ];
    var sol = ['$f\'(x) = ' + polyTex(cp) + ' = ' + (s < 0 ? '-' : '') + '3(x ' + (p < 0 ? '+ ' + (-p) : '- ' + p) + ')(x ' + (q < 0 ? '+ ' + (-q) : '- ' + q) + ')$, so the critical points are $x = ' + p + '$ and $x = ' + q + '$.',
      'Candidates in $[' + a + ', ' + b + ']$: ' + cand.map(function(x){ return '$f(' + x + ') = ' + n(f(x)) + '$'; }).join(', ') + '.',
      'Absolute maximum $' + n(mx) + '$ at $x = ' + xMax + '$; absolute minimum $' + n(mn) + '$ at $x = ' + xMin + '$ (candidates test).'];
    return { text: text, steps: steps, solution: sol, fig: { kind: 'f', f: f, dom: [a, b], closed: true, label: 'Graph of f on the closed interval' }, values: { c: c, a: a, b: b, p: p, q: q, max: mx, min: mn, xMax: xMax, xMin: xMin, cand: cand } };
  };

  GEN.concavity = function(r){
    var trap = r() < 0.3, c, f2txt, infl;
    if(trap){
      // f = x⁴ + bx: f″ = 12x², zero at 0 without a sign change
      var b = r.nonzero(-4, 4); c = [1, 0, 0, b, 0]; infl = [];
    } else if(r() < 0.5){
      var k = r.nonzero(-3, 3); c = [1, -2 * k, 0, r.int(-4, 4), 0]; infl = [Math.min(0, k), Math.max(0, k)];   // f″ = 12x² − 12kx
    } else {
      var a3 = r.pick([1, -1, 2]), z = r.int(-3, 3); c = [a3, -3 * a3 * z, r.int(-5, 5), r.int(-5, 5)]; infl = [z];   // f″ = 6a(x − z)
    }
    var c1 = pder(c), c2 = pder(c1), f2 = function(x){ return peval(c2, x); };
    var zeros = trap ? [0] : infl;
    var text = H('<p>Let $f(x) = ' + polyTex(c) + '$.</p>');
    var allTxt = function(list){ return list.length ? '$x = ' + list.join('$ and $x = ') + '$' : 'nowhere'; };
    var steps = [
      exprStep('f2', 'Find $f\'\'(x)$.', "f''(x) =", polyTex(c2), [[polyTex(c1), 'That is $f\'(x)$. Differentiate once more.']].concat(c2[c2.length - 1] ? [[polyTex(c2.map(function(v, i){ return i === c2.length - 1 ? 0 : v; })), 'Keep the constant term of $f\'\'$: it comes from differentiating the ' + (c.length === 5 ? 'x³' : 'x²') + ' term twice.']] : [])),
      choice('where', 'Where does the graph of $f$ have a point of inflection?', trap ? [
        ['Nowhere: $f\'\'(x) = 12x^2 \\ge 0$ never changes sign.', 'Right: $f\'\'(0) = 0$, but $f\'\'$ is positive on both sides of $0$.'],
        ['At $x = 0$, because $f\'\'(0) = 0$.', '$f\'\' = 0$ is not enough: $f\'\'$ must change sign, and $12x^2$ never does.'],
        ['At $x = 0$, because $f\'(0) = ' + n(peval(c1, 0)) + '$.', 'Inflection is about the sign of $f\'\'$, not $f\'$.'],
        ['Where $f\'(x) = 0$.', 'Zeros of $f\'$ are critical points, candidates for extrema, not for inflection.']
      ] : distinct([
        [allTxt(infl), 'Right: $f\'\'$ changes sign at each of these.'],
        infl.length > 1 ? ['Only at $x = ' + infl[1] + '$', '$f\'\'$ changes sign at $x = ' + infl[0] + '$ too.'] : ['At $x = ' + (infl[0] ? n(-infl[0]) : '1') + '$', 'Solve $f\'\'(x) = 0$ again, and check the sign of $f\'\'$ on each side.'],
        ['Nowhere', '$f\'\'$ is a ' + (infl.length > 1 ? 'quadratic with two simple zeros' : 'line that crosses zero') + ', so it changes sign.'],
        ['Where $f\'(x) = 0$', 'Zeros of $f\'$ are critical points, candidates for extrema. Inflection is where $f\'\'$ changes sign.']
      ], [['At $x = ' + (infl[0] + 2) + '$', 'Solve $f\'\'(x) = 0$ and check the sign on each side.']]), '2.E'),
      choice('why', 'Which reason justifies a point of inflection?', [
        ['$f\'\'$ changes sign there.', 'Right: concavity changes exactly where $f\'\'$ changes sign (where $f\'$ changes from increasing to decreasing, or back).'],
        ['$f\'\'(x) = 0$ there.', 'A zero of $f\'\'$ is only a candidate: $f(x) = x^4$ has $f\'\'(0) = 0$ and no inflection point.'],
        ['$f\'$ changes sign there.', 'That gives a relative extremum of $f$, not a change of concavity.'],
        ['$f$ changes from increasing to decreasing there.', 'That is a relative maximum. Inflection is about $f\'$ changing from increasing to decreasing.']
      ], '3.E')
    ];
    var sol = ['$f\'(x) = ' + polyTex(c1) + '$ and $f\'\'(x) = ' + polyTex(c2) + '$.', trap ? '$f\'\'(x) = 12x^2$ is $0$ only at $x = 0$ and positive on both sides, so it never changes sign.' : '$f\'\'(x) = 0$ at ' + allTxt(zeros) + ', and $f\'\'$ changes sign at each (test a value on each side).', trap ? 'The graph has no point of inflection: it is concave up everywhere.' : 'Points of inflection at ' + allTxt(infl) + ', because $f\'\'$ changes sign there.'];
    return { text: text, steps: steps, solution: sol, fig: { kind: 'fpp', f: f2, dom: [Math.min(-3, (infl[0] || 0) - 2), Math.max(3, (infl[infl.length - 1] || 0) + 2)], label: 'Graph of the second derivative f″' }, values: { c: c, infl: infl, trap: trap } };
  };

  GEN.fgraph = function(r){
    // the graph of f′: straight pieces through integer points on [0, 8]
    var pts, ts, guard = 0;
    do {
      ts = [0, 2, 4, 6, 8]; if(r() < 0.5) ts = [0, 1, 3, 5, 6, 8];
      pts = ts.map(function(t){ return [t, r.int(-3, 3)]; });
      var signsChange = 0;
      for(var i = 0; i < pts.length - 1; i++) if(pts[i][1] * pts[i + 1][1] < 0) signsChange++;
    } while((signsChange < 1 || pts.some(function(p, i){ return i && p[1] === pts[i - 1][1]; })) && guard++ < 200);
    var lin = function(x){ for(var i = 0; i < pts.length - 1; i++) if(x <= pts[i + 1][0]) return pts[i][1] + (pts[i + 1][1] - pts[i][1]) * (x - pts[i][0]) / (pts[i + 1][0] - pts[i][0]); return pts[pts.length - 1][1]; };
    // relative maxima: where f′ changes from + to −
    var maxs = [], mins = [], h = 1e-6, cuts = [];
    for(var j = 0; j < pts.length - 1; j++){
      var a = pts[j], b = pts[j + 1];
      if(a[1] * b[1] < 0) cuts.push(a[0] + (b[0] - a[0]) * a[1] / (a[1] - b[1]));
      else if(b[1] === 0 && j < pts.length - 2) cuts.push(b[0]);
    }
    cuts.forEach(function(z){ var l = lin(z - 1e-3), rr = lin(z + 1e-3); if(l > 0 && rr < 0) maxs.push(z); if(l < 0 && rr > 0) mins.push(z); });
    // concave up where f′ increases (slope of a piece > 0)
    var up = [];
    for(var k = 0; k < pts.length - 1; k++) if(pts[k + 1][1] > pts[k][1]) up.push('(' + pts[k][0] + ', ' + pts[k + 1][0] + ')');
    var merge = function(list){ // join touching intervals
      var out = []; list.forEach(function(s){ var m = /\(([-\d.]+), ([-\d.]+)\)/.exec(s), last = out[out.length - 1]; if(last && last[1] === +m[1]) last[1] = +m[2]; else out.push([+m[1], +m[2]]); });
      return out.map(function(q){ return '(' + q[0] + ', ' + q[1] + ')'; });
    };
    up = merge(up);
    // inflection points: where the slope of f′ changes sign (increasing ↔ decreasing)
    var infl = [];
    for(var m = 1; m < pts.length - 1; m++){
      var s1 = Math.sign(pts[m][1] - pts[m - 1][1]), s2 = Math.sign(pts[m + 1][1] - pts[m][1]);
      if(s1 && s2 && s1 !== s2) infl.push(pts[m][0]);
    }
    // a flat piece between rising and falling also counts once its ends differ: keep the simple rule (adjacent pieces)
    var X = function(list){ return list.length ? '$x = ' + list.map(function(z){ return n(z); }).join('$ and $x = ') + '$' : 'nowhere'; };
    var text = H('<p>The graph of $f\'$, the derivative of $f$, is shown for $0 \\le x \\le 8$. It is made of straight pieces.</p>');
    var pos = []; for(var pi = 0; pi < pts.length - 1; pi++) if(pts[pi][1] >= 0 && pts[pi + 1][1] >= 0 && (pts[pi][1] || pts[pi + 1][1])) pos.push('(' + pts[pi][0] + ', ' + pts[pi + 1][0] + ')');
    pos = merge(pos);
    var upTxt = up.length ? '$' + up.join('$ and $') + '$' : 'nowhere';
    var steps = [
      choice('max', 'Where does $f$ have a relative maximum on $(0, 8)$?', distinct([
        [X(maxs), maxs.length ? 'Right: $f\'$ changes from positive to negative there.' : 'Right: $f\'$ never changes from positive to negative inside the interval.'],
        [X(mins), 'Where $f\'$ changes from negative to positive, $f$ has a relative minimum.'],
        ['At every zero of $f\'$: ' + X(cuts), 'Only the zeros where $f\'$ changes from positive to negative give maxima.'],
        ['Where the graph of $f\'$ is highest', 'The highest point of $f\'$ is where $f$ rises fastest, not a maximum of $f$.']
      ], [['At $x = 0$, the left end', 'Relative extrema are inside the interval, where $f\'$ changes sign.'], ['At $x = 8$, the right end', 'Relative extrema are inside the interval, where $f\'$ changes sign.']]), '2.E'),
      choice('up', 'On which intervals is the graph of $f$ concave up?', distinct([
        [upTxt, 'Right: $f$ is concave up where $f\'$ is increasing, that is, where the graph of $f\'$ rises.'],
        [pos.length ? '$' + pos.join('$ and $') + '$' : 'Where $f\' > 0$', 'Where $f\' > 0$, $f$ is increasing. Concave up needs $f\'$ to be increasing.'],
        ['$(0, 8)$', 'Only where the graph of $f\'$ rises is $f$ concave up.'],
        ['Where $f\'$ is above the axis and falling', 'Falling $f\'$ means $f$ is concave down.']
      ], [['Where $f\' < 0$', 'The sign of $f\'$ says increasing or decreasing; concavity follows whether $f\'$ rises or falls.'], ['Where $f\'$ is below the axis', 'Being below the axis means $f$ decreases; concavity follows whether $f\'$ rises or falls.']]), '2.E'),
      numStep('infl', 'How many points of inflection does the graph of $f$ have on $(0, 8)$?', infl.length, [[cuts.length, 'Those are the zeros of $f\'$, candidates for extrema. Inflection points are where $f\'$ changes from increasing to decreasing, or back.']], { practice: '2.E' })
    ];
    var sol = ['Relative maximum where $f\'$ changes from positive to negative: ' + X(maxs) + '.', 'Concave up where $f\'$ increases (the graph of $f\'$ rises): ' + (up.length ? '$' + up.join('$ and $') + '$' : 'nowhere') + '.', 'Points of inflection where $f\'$ changes from increasing to decreasing or back: ' + X(infl) + ', so ' + infl.length + '.'];
    return { text: text, steps: steps, solution: sol, fig: { kind: 'fp', pts: pts, f: lin, dom: [0, 8], label: 'Graph of the derivative f′ made of straight pieces' }, values: { pts: pts, maxs: maxs, mins: mins, up: up, infl: infl, cuts: cuts } };
  };

  GEN.optimize = function(r){
    var kind = r.pick(['box', 'box', 'fence', 'can']);
    if(kind === 'box'){
      var W = r.pick([6, 12, 18, 24, 30]), x = W / 6, V = x * (W - 2 * x) * (W - 2 * x);
      var text = H('<p>An open box is made from a square sheet of cardboard ' + W + ' inches on a side by cutting equal squares of side <i>x</i> from the four corners and folding up the sides. What value of <i>x</i> gives the largest volume?</p>');
      var steps = [
        exprStep('obj', 'Write the volume $V(x)$.', 'V(x) =', 'x(' + W + ' - 2x)^2', [['x(' + W + ' - x)^2', 'Two squares come off each side: the base is ' + W + ' − 2x on a side.'], ['(' + W + ' - 2x)^2', 'Multiply by the height, x: the sides fold up to height x.']], [0.2, W / 2 - 0.2]),
        numStep('x', 'Find the critical point of $V$ in $(0, ' + n(W / 2) + ')$.', x, [[W / 2, 'At $x = ' + n(W / 2) + '$ the base vanishes: that is an endpoint where $V = 0$, not the best box.'], [W / 4, 'Solve $V\'(x) = (' + W + ' - 2x)(' + W + ' - 6x) = 0$.']], { practice: '1.E', unit: 'in' }),
        numStep('V', 'What is the largest volume?', V, [[W * W * x, 'The base is $(' + W + ' - 2x)^2$, not $' + W + '^2$.']], { practice: '1.E', unit: 'in³' }),
        choice('why', 'Which reason shows that this is the absolute maximum?', [
          ['$V\'$ changes from positive to negative at $x = ' + n(x) + '$, the only critical point in $(0, ' + n(W / 2) + ')$; $V(0) = V(' + n(W / 2) + ') = 0$.', 'Right: one critical point that is a relative maximum, checked against the endpoints, is the absolute maximum.'],
          ['$V\'(' + n(x) + ') = 0$.', 'A zero of $V\'$ is only a candidate. Show it is a maximum: the sign change of $V\'$, or compare with the endpoints.'],
          ['$V(' + n(x) + ') > 0$.', 'Being positive does not make it the largest. Compare with every candidate, or use the sign change of $V\'$.'],
          ['$V\'\'(' + n(x) + ') > 0$.', 'A positive second derivative means concave up: a minimum, not a maximum. Here $V\'\'(' + n(x) + ') < 0$.']
        ], '3.E')
      ];
      var sol = ['$V(x) = x(' + W + ' - 2x)^2$ for $0 \\le x \\le ' + n(W / 2) + '$.', '$V\'(x) = (' + W + ' - 2x)^2 - 4x(' + W + ' - 2x) = (' + W + ' - 2x)(' + W + ' - 6x)$, zero at $x = ' + n(x) + '$ inside the interval.', '$V\'$ changes from positive to negative at $x = ' + n(x) + '$, and $V(0) = V(' + n(W / 2) + ') = 0$, so $V(' + n(x) + ') = ' + n(V) + '$ in³ is the absolute maximum.'];
      return { text: text, steps: steps, solution: sol, scene: 'box', fig: { kind: 'obj', f: function(t){ return t * (W - 2 * t) * (W - 2 * t); }, dom: [0, W / 2], label: 'Volume of the box against the cut size' }, values: { kind: kind, W: W, x: x, V: V } };
    }
    if(kind === 'fence'){
      var P = r.pick([120, 160, 200, 240, 300, 400]), xf = P / 4, A = xf * (P - 2 * xf);
      var text2 = H('<p>A farmer has ' + P + ' meters of fence to enclose a rectangular field along a straight river. No fence is needed along the river. Let <i>x</i> be the length of each side perpendicular to the river. What dimensions give the largest area?</p>');
      var steps2 = [
        exprStep('obj', 'Write the area $A(x)$.', 'A(x) =', 'x(' + P + ' - 2x)', [['x(' + P + ' - x)', 'Two sides are perpendicular to the river: the side along the river is ' + P + ' − 2x.'], ['x(' + P / 2 + ' - x)', 'That fences all four sides. The river side needs no fence: the parallel side is ' + P + ' − 2x.']], [1, P / 2 - 1]),
        numStep('x', 'Find the critical point of $A$.', xf, [[P / 2, 'At $x = ' + P / 2 + '$ the area is 0: that is an endpoint.'], [P / 6, 'That would split the fence into three equal sides. Solve $A\'(x) = ' + P + ' - 4x = 0$.']], { practice: '1.E', unit: 'm' }),
        numStep('A', 'What is the largest area?', A, [[P * P / 9, 'Use $x = ' + xf + '$: $A(' + xf + ') = ' + xf + '(' + P + ' - ' + 2 * xf + ')$.'], [xf * xf, 'The side along the river is ' + P + ' − 2x = ' + (P - 2 * xf) + ' m, not ' + xf + ' m.']], { practice: '1.E', unit: 'm²' }),
        choice('why', 'Why is this the absolute maximum?', [
          ['$A\'$ changes from positive to negative at $x = ' + xf + '$, the only critical point in $(0, ' + P / 2 + ')$, and $A = 0$ at both ends.', 'Right: a single critical point that is a relative maximum, with the endpoints checked.'],
          ['$A\'(' + xf + ') = 0$.', 'A zero of $A\'$ is only a candidate: show it is a maximum.'],
          ['The field is a square.', 'It is not a square: the side along the river is twice as long. Justify with $A\'$.'],
          ['$A(' + xf + ')$ is a large number.', 'Large is not largest. Compare with the endpoints or use the sign change of $A\'$.']
        ], '3.E')
      ];
      var sol2 = ['$A(x) = x(' + P + ' - 2x)$ for $0 \\le x \\le ' + P / 2 + '$.', '$A\'(x) = ' + P + ' - 4x = 0$ at $x = ' + xf + '$.', '$A\'$ changes from positive to negative there and $A(0) = A(' + P / 2 + ') = 0$, so the field ' + xf + ' m by ' + (P - 2 * xf) + ' m has the largest area, ' + A + ' m².'];
      return { text: text2, steps: steps2, solution: sol2, scene: 'fence', fig: { kind: 'obj', f: function(t){ return t * (P - 2 * t); }, dom: [0, P / 2], label: 'Area of the field against the side x' }, values: { kind: kind, P: P, x: xf, A: A } };
    }
    var V0 = r.pick([250, 330, 355, 400, 500, 1000]), rr = Math.cbrt(V0 / (2 * PI)), S = 2 * PI * rr * rr + 2 * V0 / rr;
    var text3 = H('<p>A closed cylindrical can must hold ' + V0 + ' cm³. Find the radius <i>r</i> that uses the least metal (the smallest surface area <i>S</i>). Use a calculator for the numbers.</p>');
    var steps3 = [
      exprStep('obj', 'With $h = \\frac{' + V0 + '}{\\pi r^2}$, write $S(r) = 2\\pi r^2 + 2\\pi r h$ in terms of $r$ (use x for r).', 'S =', '2pi*x^2 + ' + 2 * V0 + '/x', [['2pi*x^2 + ' + V0 + '/x', 'The side is 2πrh = 2πr·' + V0 + '/(πr²) = ' + 2 * V0 + '/r.'], ['pi*x^2 + ' + 2 * V0 + '/x', 'A closed can has two ends: 2πr².']], [1, 6]),
      numStep('r', 'Find the radius that minimizes $S$, to three decimal places.', rr, [[Math.sqrt(V0 / (2 * PI)), 'Solve $S\'(r) = 4\\pi r - \\frac{' + 2 * V0 + '}{r^2} = 0$: $r^3 = \\frac{' + V0 + '}{2\\pi}$, a cube root.'], [Math.cbrt(V0 / PI), 'Solve $4\\pi r^3 = ' + 2 * V0 + '$: $r^3 = \\frac{' + V0 + '}{2\\pi}$.']], { calc: true, unit: 'cm' }),
      numStep('S', 'What is the least surface area?', S, [[2 * PI * rr * rr + V0 / rr, 'The side is $\\frac{' + 2 * V0 + '}{r}$: $2\\pi r h$ with $h = \\frac{' + V0 + '}{\\pi r^2}$.']], { calc: true, unit: 'cm²' }),
      choice('why', 'Why is this the absolute minimum for $r > 0$?', [
        ['$S\'$ changes from negative to positive at the only critical point, so $S$ decreases then increases.', 'Right: one critical point, a relative minimum, on an interval: it is the absolute minimum.'],
        ['$S\'(r) = 0$ there.', 'A zero of $S\'$ is a candidate only. Show the sign change.'],
        ['$S$ is positive.', 'Positive does not make it smallest.'],
        ['$S\'$ changes from positive to negative there.', 'That would be a maximum. Check: $S\'$ is negative for small $r$ and positive for large $r$.']
      ], '3.E')
    ];
    var sol3 = ['$h = \\frac{' + V0 + '}{\\pi r^2}$, so $S(r) = 2\\pi r^2 + \\frac{' + 2 * V0 + '}{r}$.', '$S\'(r) = 4\\pi r - \\frac{' + 2 * V0 + '}{r^2} = 0$ gives $r = \\sqrt[3]{\\frac{' + V0 + '}{2\\pi}} \\approx ' + M.fixed(rr, 3) + '$ cm.', '$S\'$ changes from negative to positive there, the only critical point, so the least area is about ' + M.fixed(S, 3) + ' cm² (and then $h = 2r$).'];
    return { text: text3, steps: steps3, solution: sol3, scene: 'can', fig: { kind: 'obj', f: function(t){ return 2 * PI * t * t + 2 * V0 / t; }, dom: [Math.max(0.5, rr / 3), rr * 2.6], label: 'Surface area of the can against its radius' }, values: { kind: kind, V0: V0, r: rr, S: S } };
  };

  var TITLE = { incdec: 'Increasing and decreasing', extrema: 'Relative extrema', candidates: 'Absolute extrema on a closed interval', concavity: 'Concavity and inflection', fgraph: 'Reading f from the graph of f′', optimize: 'Optimization' };
  function generate(r, ctx, type){
    var kind = type || ctx.kind;
    if(!GEN[kind]) throw new Error('curve-analyzer: no problem kind "' + kind + '"');
    var p = GEN[kind](r);
    p.ctx = ctx.id; p.topic = ctx.topic; p.type = kind; p.title = TITLE[kind];
    p.solution = p.solution.map(H);
    return p;
  }

  M.register('curveAnalyzer', {
    CURVES: CURVES, ORDER: ORDER, SCENES: SCENES, SORDER: SORDER, KINDS: Object.keys(GEN), TITLE: TITLE,
    analyze: analyze, features: features, sentence: sentence, sceneSentence: sceneSentence, signs: signs,
    generate: generate, n: n, xs: xs, peval: peval, pder: pder, polyTex: polyTex
  });
})(typeof window !== 'undefined' ? window : globalThis);
