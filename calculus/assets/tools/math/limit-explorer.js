/* Limit explorer model: ApCalcMath.limitExplorer (docs/apcalc-architecture.md, "Tools").
   OWNED BY THIS TOOL ONLY: no other tool edits this file, and this tool edits
   no shared file. Pure functions, no DOM, so the validator
   (scripts/lib/apcalc-tool-checks/limit-explorer.mjs) and the test
   (scripts/test/apcalc-tool-limit-explorer.test.mjs) run exactly this code.

   Loaded after calc-expr.js and calc-tool-math.js, before
   calculus/assets/tools/limit-explorer.js.

   Explore (the zoom):
     GALLERY                 the functions to zoom into, each { id, name,
                             short, tex, a (number, or 'inf' for x -> ±∞),
                             f(x), at (f(a) or null), left, right (one-sided
                             limits, ±Infinity, or NaN for no limit), kind,
                             fill (the value that removes the
                             discontinuity), bounds (squeeze), hasym, vasym }
     entry(id)               one of them
     value(e, filled)        f(a), or null where f(a) is not defined
     evalAt(e, x, filled)    f(x), with the filled value at x = a
     limit(e)                { left, right, two, exists }
     check(e, filled)        the continuity checklist: { defined, exists,
                             equal, continuous, type, fails }
     view(e, z)              the window at zoom z (0..4): { x: [a, b],
                             y: [c, d], h } where h is the tracer distance
     rows(e, z)              the table of values that has appeared by zoom z
     zoomLabel(z)            '1×' ... '10,000×'
   Test yourself:
     TYPES                   the drill kinds with their topics
     generate(rng, ctx, type) -> { ctx, type, topic, text, fig, steps,
                             solution, key } (see calc-tools.js drill)
   Text holds TeX between dollar signs; the page renders it (ApCalcTex). */
(function(){
  'use strict';
  var M = window.ApCalcMath;
  if(!M) return;

  /* ---------------------------------------------------- number text */
  function gcd(a, b){ a = Math.abs(a); b = Math.abs(b); while(b){ var t = a % b; a = b; b = t; } return a; }
  // An exact-looking TeX number: integers, small fractions, else 3 decimals.
  // Negative numbers are braced ({-2}) so the minus reads as a sign, not as
  // subtraction, after = or \\to.
  function tn(v){
    if(v < 0 && v !== -Infinity) return '{-' + tn(-v) + '}';
    if(v === Infinity) return '\\infty';
    if(v === -Infinity) return '-\\infty';
    if(Math.abs(v - Math.round(v)) < 1e-9) return String(Math.round(v));
    for(var q = 2; q <= 12; q++){
      var p = v * q;
      if(Math.abs(p - Math.round(p)) < 1e-9){
        p = Math.round(p); var g = gcd(p, q);
        return '\\frac{' + Math.abs(p / g) + '}{' + (q / g) + '}';
      }
    }
    return M.fixed(v, 3);
  }
  function $(t){ return '$' + t + '$'; }
  // a x + b style coefficients as TeX: term(3, 'x', true) -> '+ 3x'
  function sgnTerm(c, body, first){
    if(c === 0) return '';
    var s = c < 0 ? '-' : (first ? '' : '+'), a = Math.abs(c);
    var coef = body && a === 1 ? '' : tn(a);
    return (first ? s : ' ' + s + ' ') + coef + (body || '');
  }
  function poly(cs, v){ // cs[k] coefficient of v^k, highest first in the text
    v = v || 'x';
    var out = '', first = true;
    for(var k = cs.length - 1; k >= 0; k--){
      if(!cs[k]) continue;
      out += sgnTerm(cs[k], k === 0 ? '' : k === 1 ? v : v + '^' + k, first);
      first = false;
    }
    return out || '0';
  }
  function shift(a){ return a === 0 ? 'x' : a > 0 ? 'x - ' + tn(a) : 'x + ' + tn(-a); }

  /* ------------------------------------------------------ the gallery */
  var GALLERY = [
    { id: 'hole', name: 'A hole', short: 'Hole', a: 1, tex: 'f(x) = \\frac{x^2 - 1}{x - 1}',
      f: function(x){ return (x * x - 1) / (x - 1); }, at: null, left: 2, right: 2, kind: 'removable', fill: 2,
      say: 'Away from x = 1 the fraction cancels to x + 1, so both sides head for 2. At x = 1 itself the fraction is 0/0: f(1) is not defined, so the graph has a hole.',
      topic: 'limits-from-plots' },
    { id: 'move', name: 'A point out of place', short: 'Point moved', a: 2,
      tex: 'f(x) = \\begin{cases} \\frac{x^2 - 4}{x - 2} & x \\ne 2 \\\\ 1 & x = 2 \\end{cases}',
      f: function(x){ return (x * x - 4) / (x - 2); }, at: 1, left: 4, right: 4, kind: 'removable', fill: 4,
      say: 'Near x = 2 the curve is x + 2, so the limit is 4. But the function was given the value f(2) = 1: the limit exists and so does the value, yet they differ.',
      topic: 'discontinuity-types' },
    { id: 'jump', name: 'A jump', short: 'Jump', a: 1,
      tex: 'f(x) = \\begin{cases} x + 1 & x < 1 \\\\ 4 - x & x \\ge 1 \\end{cases}',
      f: function(x){ return x < 1 ? x + 1 : 4 - x; }, at: 3, left: 2, right: 3, kind: 'jump',
      say: 'From the left the curve heads for 2, from the right for 3. Zooming in never brings them together, so the two-sided limit does not exist.',
      topic: 'limits-from-plots' },
    { id: 'vasym', name: 'A vertical asymptote', short: 'Asymptote', a: 2, tex: 'f(x) = \\frac{1}{x - 2}',
      f: function(x){ return 1 / (x - 2); }, at: null, left: -Infinity, right: Infinity, kind: 'infinite', vasym: 2,
      say: 'As x gets close to 2 the bottom gets close to 0, so the fraction grows without bound: down to −∞ from the left (negative bottom), up to +∞ from the right.',
      topic: 'infinite-limits' },
    { id: 'osc', name: 'sin(1/x) oscillates', short: 'sin(1/x)', a: 0, tex: 'f(x) = \\sin\\left(\\frac{1}{x}\\right)',
      f: function(x){ return Math.sin(1 / x); }, at: null, left: NaN, right: NaN, kind: 'oscillating', dense: true,
      say: 'As x shrinks, 1/x races to infinity and the sine swings between −1 and 1 faster and faster. The values never settle on one number, however far you zoom.',
      topic: 'limits-from-plots' },
    { id: 'squeeze', name: 'The squeeze theorem', short: 'Squeeze', a: 0, tex: 'f(x) = x\\sin\\left(\\frac{1}{x}\\right)',
      f: function(x){ return x * Math.sin(1 / x); }, at: null, left: 0, right: 0, kind: 'removable', fill: 0, dense: true,
      bounds: [function(x){ return -Math.abs(x); }, function(x){ return Math.abs(x); }],
      say: 'The sine stays between −1 and 1, so x sin(1/x) is trapped between −|x| and |x|. Both of those head for 0, so the function caught between them must too.',
      topic: 'squeeze-theorem' },
    { id: 'inf', name: 'Limits at infinity', short: 'At infinity', a: 'inf', tex: 'f(x) = \\frac{2x^2 + 3x}{x^2 + 1}',
      f: function(x){ return (2 * x * x + 3 * x) / (x * x + 1); }, at: null, left: 2, right: 2, kind: 'infinity', hasym: 2,
      say: 'For huge x the x² terms dominate: (2x² + 3x)/(x² + 1) behaves like 2x²/x² = 2. So f(x) → 2 at both ends, and y = 2 is a horizontal asymptote. The graph may cross it on the way.',
      topic: 'limits-at-infinity' }
  ];
  function entry(id){ for(var i = 0; i < GALLERY.length; i++) if(GALLERY[i].id === id) return GALLERY[i]; return null; }
  function value(e, filled){
    if(e.a === 'inf') return null;
    if(filled && e.fill != null) return e.fill;
    return e.at;
  }
  function evalAt(e, x, filled){
    if(e.a !== 'inf' && x === e.a) return value(e, filled) == null ? NaN : value(e, filled);
    return e.f(x);
  }
  function limit(e){
    var l = e.left, r = e.right, ex = isFinite(l) && isFinite(r) && Math.abs(l - r) < 1e-12;
    return { left: l, right: r, exists: ex, two: ex ? l : NaN };
  }
  /* The three-part check of continuity at x = a (topic 1.11), and the kind
     of discontinuity (1.10). */
  function check(e, filled){
    var v = value(e, filled), L = limit(e), defined = v != null, exists = L.exists, equal = defined && exists && Math.abs(v - L.two) < 1e-12;
    var type = equal ? 'continuous' : exists ? 'removable' : e.kind === 'jump' ? 'jump' : e.kind === 'infinite' ? 'infinite' : 'oscillating';
    var fails = !defined ? 'defined' : !exists ? 'exists' : !equal ? 'equal' : null;
    return { defined: defined, exists: exists, equal: equal, continuous: equal, type: type, fails: fails, value: v, limit: L };
  }
  /* The window at zoom z in [0, 4] (10^z times). Finite a: half width
     2.5·10^-z and tracers at a ± 10^-z (40% of the way to the edge), so the
     table's rows a ± 1, 0.1, ... are exactly where the tracers pass. At
     infinity the window grows instead. */
  function view(e, z){
    z = Math.max(0, Math.min(4, z));
    if(e.a === 'inf'){
      var R = 5 * Math.pow(10, z), hy = 3.5;
      return { x: [-R, R], y: [e.hasym - hy, e.hasym + hy], h: 2 * Math.pow(10, z), far: true };
    }
    var w = 2.5 * Math.pow(10, -z), h = Math.pow(10, -z), a = e.a, yc, hh;
    if(e.kind === 'jump'){ yc = (e.left + e.right) / 2; hh = Math.max(1.1, 0.8 * w); }
    else if(e.kind === 'infinite'){ yc = 0; hh = Math.max(4, 2.4 / h); }
    else if(e.kind === 'oscillating'){ yc = 0; hh = 1.5; }
    else if(e.id === 'squeeze'){ yc = 0; hh = 1.05 * w; }
    else { yc = e.left; hh = 0.8 * w; }
    return { x: [a - w, a + w], y: [yc - hh, yc + hh], h: h };
  }
  /* The rows of the table of values: h = 1, 0.1, ... (x -> a), or x = 1,
     10, 100 ... (x -> ±∞), one more row each time the zoom passes a power of
     ten, up to five rows. */
  function rows(e, z){
    var n = Math.min(5, Math.floor(z + 1e-9) + 2), out = [];
    for(var k = 0; k < n; k++){
      if(e.a === 'inf'){
        var X = Math.pow(10, k);
        out.push({ k: k, h: X, xl: -X, fl: e.f(-X), xr: X, fr: e.f(X) });
      } else {
        var h = Math.pow(10, -k);
        out.push({ k: k, h: h, xl: e.a - h, fl: e.f(e.a - h), xr: e.a + h, fr: e.f(e.a + h) });
      }
    }
    return out;
  }
  function zoomLabel(z){ var v = Math.round(Math.pow(10, z)); return (v >= 1000 ? String(v).replace(/\B(?=(\d{3})+(?!\d))/g, ',') : String(v)) + '×'; }

  /* ================================================== Test yourself */
  var TYPES = [
    { value: 'graph', label: 'Limits from a graph', topic: 'limits-from-plots' },
    { value: 'table', label: 'Limits from a table', topic: 'limits-from-tables' },
    { value: 'onesided', label: 'One-sided limits of a piecewise function', topic: 'limit-laws' },
    { value: 'laws', label: 'Limit laws', topic: 'limit-laws' },
    { value: 'algebra', label: 'Limits by algebra (factor, rationalize)', topic: 'limit-algebra' },
    { value: 'squeeze', label: 'The squeeze theorem', topic: 'squeeze-theorem' },
    { value: 'classify', label: 'Kind of discontinuity', topic: 'discontinuity-types' },
    { value: 'continuity', label: 'Continuity at a point', topic: 'continuity-at-a-point' },
    { value: 'remove', label: 'Make it continuous', topic: 'removing-discontinuities' },
    { value: 'vertical', label: 'Infinite limits', topic: 'infinite-limits' },
    { value: 'infinity', label: 'Limits at infinity', topic: 'limits-at-infinity' },
    { value: 'ivt', label: 'The Intermediate Value Theorem', topic: 'intermediate-value-theorem' }
  ];
  var DNE = 'does not exist';

  // A number step graded exactly (fractions typed or 3 decimals accepted).
  function exact(v, mistakes){ return M.cell(v, 0, (mistakes || []).filter(function(m){ return typeof m.value === 'number' && isFinite(m.value); }), 1e-3); }
  // Shown (and checked) to 3 decimals unless a whole number.
  function numStep(key, label, v, mistakes, practice, extra){
    var s = { key: key, kind: 'num', label: label, cell: exact(v, mistakes), practice: practice || '3.D', d: Math.abs(v - Math.round(v)) < 1e-9 ? 0 : 3 };
    for(var k in extra || {}) s[k] = extra[k];
    return s;
  }
  /* A choice step: opts [{ t, why, ok }], shuffled by the page unless fixed. */
  function choiceStep(key, label, opts, practice, fixed){
    var seen = {}, list = [];
    opts.forEach(function(o){ if(!seen[o.t]){ seen[o.t] = 1; list.push(o); } });
    var c = -1;
    list.forEach(function(o, i){ if(o.ok && c < 0) c = i; });
    return { key: key, kind: 'choice', label: label, options: list.map(function(o){ return o.t; }), why: list.map(function(o){ return o.why; }), correct: c, practice: practice || '1.C', fixed: !!fixed };
  }
  function limTex(a, side, fn){ return '\\lim_{x \\to ' + (a === 'inf' ? '\\infty' : a === '-inf' ? '-\\infty' : tn(a) + (side || '')) + '} ' + (fn || 'f(x)'); }

  /* ---------------------------------------------- 1. graph (1.3) */
  // A piece: L + s (x - a) + q (x - a)^2 (left or right of a).
  function piece(L, s, q, a){ return function(x){ var d = x - a; return L + s * d + q * d * d; }; }
  function yWin(fs, a, extraY){
    var lo = Infinity, hi = -Infinity;
    fs.forEach(function(p){ for(var i = 0; i <= 40; i++){ var x = p[1] + (p[2] - p[1]) * i / 40, y = p[0](x); if(isFinite(y)){ lo = Math.min(lo, y); hi = Math.max(hi, y); } } });
    (extraY || []).forEach(function(y){ if(y != null && isFinite(y)){ lo = Math.min(lo, y); hi = Math.max(hi, y); } });
    lo = Math.floor(lo) - 1; hi = Math.ceil(hi) + 1;
    return [lo, hi];
  }
  function genGraph(r, ctx){
    var a = r.int(-2, 3), L = r.int(-2, 4), shape = r.pick(['same', 'same', 'jump', 'jump', 'hole']);
    var R = shape === 'jump' ? L + r.pick([-3, -2, -1, 1, 2, 3]) : L;
    var v = shape === 'hole' ? null : r.pick([L, R, L + r.pick([-2, 2, 3])]);
    if(shape === 'same' && v === L) v = L + r.pick([-2, 2, 3]);
    var sL = r.pick([-1, -0.5, 0.5, 1]), qL = r.pick([0, 0.25, -0.25]), sR = r.pick([-1, -0.5, 0.5, 1]), qR = r.pick([0, 0.25, -0.25]);
    var fL = piece(L, sL, qL, a), fR = piece(R, sR, qR, a);
    var yr = yWin([[fL, a - 4, a], [fR, a, a + 4]], a, [v]);
    var fig = { plot: { label: 'Graph of f near x = ' + a + ', made of two pieces', x: [a - 4, a + 4], y: yr, xStep: 1, yStep: yr[1] - yr[0] > 10 ? 2 : 1, xLabel: 'x', yLabel: 'y',
      curves: [{ fn: fL, domain: [a - 4, a], cls: 's1', label: 'f', ends: [null, 'open'] }, { fn: fR, domain: [a, a + 4], cls: 's1', ends: ['open', null] }],
      points: v == null ? [] : [{ at: [a, v], cls: 's1' }] } };
    var two = L === R ? L : null;
    var steps = [
      numStep('left', 'Find $' + limTex(a, '^-') + '$.', L, [{ value: R, why: 'That is where the curve arrives from the right. For x → ' + a + '⁻ follow the curve from the left side only.' }, { value: v, why: 'That is the filled dot, the value f(' + a + '). A limit is where the curve is heading, not the value at the point.' }], '2.B', { hint: 'Trace the curve toward x = ' + a + ' from the left.' }),
      numStep('right', 'Find $' + limTex(a, '^+') + '$.', R, [{ value: L, why: 'That is the left-hand limit. For x → ' + a + '⁺ follow the curve from the right side only.' }, { value: v, why: 'That is the filled dot, the value f(' + a + '). A limit is where the curve is heading, not the value at the point.' }], '2.B'),
      choiceStep('two', 'So $' + limTex(a) + '$ is', [
        { t: two != null ? $(tn(two)) : DNE, ok: true, why: two != null ? 'Both one-sided limits are ' + tn(two) + ', so the two-sided limit is ' + tn(two) + ', whatever the value at the point.' : 'The one-sided limits differ (' + L + ' and ' + R + '), so the two-sided limit does not exist.' },
        { t: two != null ? DNE : $(tn(L)), why: two != null ? 'A hole or a dot out of place does not stop a limit: both sides head for ' + tn(two) + '.' : 'That is only the left-hand limit. The right side heads for ' + R + '.' },
        { t: $(tn(R)), why: 'That is only the right-hand limit. The left side heads for ' + L + '.' },
        { t: v == null ? $(tn(L + 1)) : $(tn(v)), why: v == null ? 'Nothing on the graph heads there.' : 'That is f(' + a + '), the value at the point. The limit is about the values near x = ' + a + '.' }
      ], '2.B'),
      choiceStep('value', 'And $f(' + a + ')$ is', [
        { t: v == null ? 'not defined' : $(tn(v)), ok: true, why: v == null ? 'There is only an open circle at x = ' + a + ': no point of the graph sits there, so f(' + a + ') is not defined.' : 'The filled dot is at height ' + v + ', so f(' + a + ') = ' + v + '.' },
        { t: v == null ? $(tn(L)) : 'not defined', why: v == null ? 'The curve heads to ' + L + ', but the circle is open: the function has no value there.' : 'There is a filled dot at x = ' + a + ', so f(' + a + ') is defined.' },
        { t: $(tn(L === v ? R : L)), why: 'An open circle is a point the graph leaves out. The value is the filled dot.' },
        { t: $(tn(R === v || R === L ? L + R + 1 : R)), why: 'An open circle is a point the graph leaves out. The value is the filled dot.' }
      ], '2.B')
    ];
    return { text: 'The graph shows $y = f(x)$. Open circles are points the graph leaves out; a filled dot is the value of $f$ there.', fig: fig, steps: steps,
      key: { a: a, L: L, R: R, v: v },
      solution: [
        'From the left the curve heads to height ' + L + ': $' + limTex(a, '^-') + ' = ' + tn(L) + '$.',
        'From the right it heads to height ' + R + ': $' + limTex(a, '^+') + ' = ' + tn(R) + '$.',
        two != null ? 'The one-sided limits agree, so $' + limTex(a) + ' = ' + tn(two) + '$.' : 'The one-sided limits differ, so $' + limTex(a) + '$ does not exist.',
        v == null ? '$f(' + a + ')$ is not defined (only an open circle).' : '$f(' + a + ') = ' + tn(v) + '$ (the filled dot)' + (two != null && v !== two ? ', which is not the limit.' : '.')
      ] };
  }

  /* ---------------------------------------------- 2. table (1.4) */
  var TABLE_FNS = [
    { tex: '\\frac{\\sin(2x)}{x}', a: 0, f: function(x){ return Math.sin(2 * x) / x; }, L: 2, R: 2 },
    { tex: '\\frac{\\sin(3x)}{x}', a: 0, f: function(x){ return Math.sin(3 * x) / x; }, L: 3, R: 3 },
    { tex: '\\frac{e^{x} - 1}{x}', a: 0, f: function(x){ return (Math.exp(x) - 1) / x; }, L: 1, R: 1 },
    { tex: '\\frac{1 - \\cos x}{x^2}', a: 0, f: function(x){ return (1 - Math.cos(x)) / (x * x); }, L: 0.5, R: 0.5 },
    { tex: '\\frac{\\sqrt{x + 4} - 2}{x}', a: 0, f: function(x){ return (Math.sqrt(x + 4) - 2) / x; }, L: 0.25, R: 0.25 },
    { tex: '\\frac{x^3 - 8}{x - 2}', a: 2, f: function(x){ return (x * x * x - 8) / (x - 2); }, L: 12, R: 12 },
    { tex: '\\frac{x^2 - 9}{x - 3}', a: 3, f: function(x){ return (x * x - 9) / (x - 3); }, L: 6, R: 6 },
    { tex: '\\frac{|x - 1|}{x - 1} + 2', a: 1, f: function(x){ return Math.abs(x - 1) / (x - 1) + 2; }, L: 1, R: 3 },
    { tex: '\\frac{2|x|}{x} + x', a: 0, f: function(x){ return 2 * Math.abs(x) / x + x; }, L: -2, R: 2 },
    { tex: '\\frac{\\ln x}{x - 1}', a: 1, f: function(x){ return Math.log(x) / (x - 1); }, L: 1, R: 1 }
  ];
  function cellText(y){ var s = M.fixed(y, 5); return s.charAt(0) === '-' ? '−' + s.slice(1) : s; }
  function genTable(r){
    var T = r.pick(TABLE_FNS), a = T.a, hs = [0.1, 0.01, 0.001], xs = [];
    hs.forEach(function(h){ xs.push(a - h); });
    hs.slice().reverse().forEach(function(h){ xs.push(a + h); });
    var tab = { a: a, cols: ['$x$'].concat(xs.map(function(x){ return $(x < 0 ? '{' + M.fixed(x, 3) + '}' : M.fixed(x, 3)); })), rows: [['$f(x)$'].concat(xs.map(function(x){ return cellText(T.f(x)); }))] };
    var two = Math.abs(T.L - T.R) < 1e-12 ? T.L : null;
    var est = function(v){ return M.cell(v, 0, [], 0.011); };
    var steps = [
      { key: 'left', kind: 'num', label: 'Estimate $' + limTex(a, '^-') + '$.', cell: est(T.L), practice: '2.B', hint: 'Read the values as x comes up toward ' + a + ' from below.' },
      { key: 'right', kind: 'num', label: 'Estimate $' + limTex(a, '^+') + '$.', cell: est(T.R), practice: '2.B' },
      choiceStep('two', 'What does the table suggest about $' + limTex(a) + '$?', [
        { t: two != null ? 'It is about ' + $(tn(two)) : 'It does not exist', ok: true, why: two != null ? 'Both sides settle on ' + tn(two) + ', so the limit appears to be ' + tn(two) + '.' : 'The left side settles on ' + tn(T.L) + ' and the right on ' + tn(T.R) + ': different numbers, so no two-sided limit.' },
        { t: two != null ? 'It does not exist' : 'It is about ' + $(tn((T.L + T.R) / 2)), why: two != null ? 'Both sides settle on the same number, so the limit exists even though f(' + a + ') is not in the table (it is not defined).' : 'Averaging the two sides is not a limit: each side must head to the same number.' },
        { t: 'It is ' + $('0') + ', because the bottom is ' + $('0') + ' at ' + $('x = ' + tn(a)), why: 'The bottom is 0 only at x = ' + a + ' itself. A limit looks at the values near ' + a + ', which the table shows.' },
        { t: 'It cannot be estimated without ' + $('f(' + tn(a) + ')'), why: 'A limit never needs f(' + a + '). The values near ' + a + ' are enough.' }
      ], '2.B')
    ];
    return { text: 'The table gives values of $f(x) = ' + T.tex + '$ for $x$ near $' + tn(a) + '$.', fig: { table: tab }, steps: steps, key: { a: a, f: T.f, L: T.L, R: T.R },
      solution: [
        'From the left ($x = ' + tn(a) + ' - 0.1, -0.01, -0.001$) the values settle near ' + tn(T.L) + '.',
        'From the right they settle near ' + tn(T.R) + '.',
        two != null ? 'Both sides agree: $' + limTex(a) + ' \\approx ' + tn(two) + '$.' : 'The sides disagree, so $' + limTex(a) + '$ does not exist.'
      ] };
  }

  /* ---------------------------------------------- 3. one-sided, formula (1.5) */
  function genOneSided(r){
    var a = r.int(-1, 3), b2 = r.int(-3, 3), m = r.pick([-2, -1, 1, 2, 3]), L = a * a + b2;
    var jump = r() < 0.5, R = jump ? L + r.pick([-4, -2, -1, 1, 2, 4]) : L, d = R - m * a;
    var lt = poly([b2, 0, 1]), rt = poly([d, m]);
    var tex = 'f(x) = \\begin{cases} ' + lt + ' & x < ' + tn(a) + ' \\\\ ' + rt + ' & x \\ge ' + tn(a) + ' \\end{cases}';
    var steps = [
      numStep('left', 'Find $' + limTex(a, '^-') + '$.', L, [{ value: R, why: 'That uses the piece for x ≥ ' + a + '. From the left (x < ' + a + ') use the top piece.' }], '1.E'),
      numStep('right', 'Find $' + limTex(a, '^+') + '$.', R, [{ value: L, why: 'That uses the piece for x < ' + a + '. From the right (x > ' + a + ') use the bottom piece.' }], '1.E'),
      choiceStep('two', 'So $' + limTex(a) + '$', [
        { t: L === R ? 'is ' + $(tn(L)) : DNE, ok: true, why: L === R ? 'Both one-sided limits are ' + L + '.' : 'The one-sided limits differ (' + L + ' and ' + R + ').' },
        { t: L === R ? DNE : 'is ' + $(tn(L)), why: L === R ? 'Two different formulas can still meet: both sides give ' + L + '.' : 'That is only the left-hand limit.' },
        { t: 'is ' + $(tn(R === L ? L + 1 : R)), why: R === L ? 'Recheck the substitution.' : 'That is only the right-hand limit.' }
      ], '1.E')
    ];
    return { text: 'Let $$' + tex + '$$', steps: steps, key: { a: a, left: function(x){ return x * x + b2; }, right: function(x){ return m * x + d; } },
      solution: [
        'For $x < ' + tn(a) + '$, $f(x) = ' + lt + '$, a polynomial, so substitute: $' + limTex(a, '^-') + ' = ' + tn(L) + '$.',
        'For $x > ' + tn(a) + '$, $f(x) = ' + rt + '$: $' + limTex(a, '^+') + ' = ' + tn(R) + '$.',
        L === R ? 'They agree, so $' + limTex(a) + ' = ' + tn(L) + '$.' : 'They differ, so $' + limTex(a) + '$ does not exist.'
      ] };
  }

  /* ---------------------------------------------- 4. limit laws (1.5) */
  function genLaws(r){
    var a = r.int(-2, 4), p = r.nonzero(-5, 6), q = r.nonzero(-4, 5), k = r.pick([2, 3, 4, -2]);
    var forms = [
      { tex: k + 'f(x) - g(x)', v: k * p - q, miss: [{ value: k * p + q, why: 'Subtract the whole limit of g: k·(lim f) − (lim g).' }, { value: p - q, why: 'The constant multiple stays: lim k·f = k·lim f.' }] },
      { tex: 'f(x)\\,g(x) + ' + k, v: p * q + k, miss: [{ value: p + q + k, why: 'The limit of a product is the product of the limits, not their sum.' }, { value: p * q, why: 'Add the constant too: its limit is itself.' }] },
      { tex: '\\left[g(x)\\right]^2 - f(x)', v: q * q - p, miss: [{ value: -q * q - p, why: 'Square the limit of g: (lim g)² is never negative.' }, { value: 2 * q - p, why: 'A square is the limit times itself, not doubled.' }] },
      { tex: '\\frac{f(x) + g(x)}{' + k + '}', v: (p + q) / k, miss: [{ value: p + q, why: 'Divide by the constant too.' }, { value: p / k + q, why: 'Divide the whole sum, f + g, by the constant.' }] }
    ];
    var F = r.pick(forms), G = r.pick(forms.filter(function(x){ return x !== F; }));
    var lab = function(fm){ return 'Find $\\lim_{x \\to ' + tn(a) + '} \\left(' + fm.tex + '\\right)$.'; };
    var steps = [numStep('law1', lab(F), F.v, F.miss, '1.E'), numStep('law2', lab(G), G.v, G.miss, '1.E')];
    return { text: 'Suppose $\\lim_{x \\to ' + tn(a) + '} f(x) = ' + tn(p) + '$ and $\\lim_{x \\to ' + tn(a) + '} g(x) = ' + tn(q) + '$.', steps: steps, key: { a: a, p: p, q: q, forms: [F.tex, G.tex], k: k },
      solution: [
        'The limit laws let you take the limit of each piece and combine them: sums, differences, constant multiples, products, quotients (bottom limit not 0) and powers.',
        '$\\lim (' + F.tex + ') = ' + tn(F.v) + '$ (put $' + tn(p) + '$ for $f(x)$ and $' + tn(q) + '$ for $g(x)$).',
        '$\\lim (' + G.tex + ') = ' + tn(G.v) + '$.'
      ] };
  }

  /* ---------------------------------------------- 5. algebra (1.6) */
  function genAlgebra(r){
    if(r() < 0.55){
      // (x - c)(x - s) / ((x - c)(x - t)) or (x - c)(x - s) / (x - c)
      var c = r.nonzero(-3, 4), s = r.int(-4, 5), t = r.int(-4, 5);
      while(s === c) s++;
      var lin = r() < 0.5;
      while(!lin && (t === c || t === s)) t++;
      var num = poly([c * s, -(c + s), 1]), den = lin ? shift(c) : poly([c * t, -(c + t), 1]);
      var simp = lin ? 'x - (' + s + ')' : '(x - (' + s + '))/(x - (' + t + '))', simpTex = lin ? shift(s) : '\\frac{' + shift(s) + '}{' + shift(t) + '}';
      var L = lin ? c - s : (c - s) / (c - t);
      var dom = [c + 0.3, c + 2.2];
      if(!lin && t > dom[0] - 0.2 && t < dom[1] + 0.2) dom = [c - 2.2, c - 0.3];
      var steps = [
        choiceStep('sub', 'Substituting $x = ' + tn(c) + '$ straight in gives', [
          { t: $('\\frac{0}{0}') + ', which is indeterminate', ok: true, why: 'Top and bottom are both 0 at x = ' + c + ': that says nothing yet. Rewrite the expression.' },
          { t: $('0') + ', so the limit is ' + $('0'), why: 'The top is 0, but so is the bottom: 0/0 is not 0. It is indeterminate.' },
          { t: 'a division by zero, so the limit does not exist', why: '0/0 does not decide the limit either way. Factor and cancel first.' }
        ], '1.C', true),
        { key: 'simp', kind: 'expr', label: 'Factor and cancel the common factor. What expression is left?', cell: M.exprCell(simp, { domain: dom, mistakes: lin ? [{ expr: 'x - (' + c + ')', why: 'Cancel the factor that makes both top and bottom 0, (x − ' + c + '), and keep the other one.' }] : [{ expr: '(x - (' + c + '))/(x - (' + t + '))', why: 'Cancel the common factor (x − ' + c + ') from top and bottom; keep the other factors.' }] }), practice: '1.E', lhs: 'f(x) =' },
        numStep('lim', 'So $\\lim_{x \\to ' + tn(c) + '} f(x)$ =', L, [{ value: 0, why: '0/0 is not 0. After cancelling, substitute into what is left.' }], '1.E')
      ];
      return { text: 'Find $\\lim_{x \\to ' + tn(c) + '} f(x)$ for $f(x) = \\frac{' + num + '}{' + den + '}$.', steps: steps,
        key: { a: c, f: function(x){ return (x * x - (c + s) * x + c * s) / (lin ? x - c : (x - c) * (x - t)); }, L: L },
        solution: [
          'Substituting $x = ' + tn(c) + '$ gives $\\frac{0}{0}$: rewrite first.',
          'Factor: $\\frac{(' + shift(c) + ')(' + shift(s) + ')}{' + (lin ? shift(c) : '(' + shift(c) + ')(' + shift(t) + ')') + '} = ' + simpTex + '$ for $x \\ne ' + tn(c) + '$.',
          'Now substitute: $\\lim_{x \\to ' + tn(c) + '} f(x) = ' + tn(L) + '$.'
        ] };
    }
    // (sqrt(x + k) - c) / (x - x0), x0 = c^2 - k -> 1/(2c)
    var cc = r.pick([1, 2, 3]), x0 = r.int(-2, 4), k = cc * cc - x0;
    var L2 = 1 / (2 * cc), inner = poly([k, 1]);
    var steps2 = [
      choiceStep('move', 'Substituting gives $\\frac{0}{0}$. What is the best next move?', [
        { t: 'Multiply top and bottom by the conjugate ' + $('\\sqrt{' + inner + '} + ' + cc), ok: true, why: 'The conjugate turns (√(…) − ' + cc + ')(√(…) + ' + cc + ') into a difference of squares with no root, and the factor (' + 'x − ' + x0 + ') appears to cancel.' },
        { t: 'Factor the top as a quadratic', why: 'The top has a square root, so it does not factor like a polynomial. Rationalize it.' },
        { t: 'Conclude the limit does not exist', why: '0/0 is indeterminate: the limit may well exist. Rewrite first.' },
        { t: 'Conclude the limit is ' + $('0'), why: '0/0 is not 0.' }
      ], '1.C'),
      { key: 'simp', kind: 'expr', label: 'After rationalizing and cancelling, what expression is left?', cell: M.exprCell('1/(sqrt(' + (k ? 'x + (' + k + ')' : 'x') + ') + ' + cc + ')', { domain: [Math.max(x0 + 0.2, -k + 0.2), x0 + 3], mistakes: [{ expr: '1/(sqrt(' + (k ? 'x + (' + k + ')' : 'x') + ') - ' + cc + ')', why: 'The conjugate has a plus sign: multiply by √(…) + ' + cc + ', which ends up in the bottom.' }] }), practice: '1.E', lhs: 'f(x) =' },
      numStep('lim', 'So the limit is', L2, [{ value: 0, why: '0/0 is not 0. Substitute into the simplified expression.' }, { value: 1 / cc, why: 'The bottom is √(…) + ' + cc + ' = ' + cc + ' + ' + cc + ' at x = ' + x0 + '.' }], '1.E')
    ];
    return { text: 'Find $\\lim_{x \\to ' + tn(x0) + '} \\frac{\\sqrt{' + inner + '} - ' + cc + '}{' + shift(x0) + '}$.', steps: steps2,
      key: { a: x0, f: function(x){ return (Math.sqrt(x + k) - cc) / (x - x0); }, L: L2 },
      solution: [
        'Substituting $x = ' + tn(x0) + '$ gives $\\frac{0}{0}$.',
        'Multiply by $\\frac{\\sqrt{' + inner + '} + ' + cc + '}{\\sqrt{' + inner + '} + ' + cc + '}$: the top becomes $(' + inner + ') - ' + (cc * cc) + ' = ' + shift(x0) + '$.',
        'Cancel $' + shift(x0) + '$: $f(x) = \\frac{1}{\\sqrt{' + inner + '} + ' + cc + '}$ for $x \\ne ' + tn(x0) + '$.',
        'Substitute: $\\frac{1}{' + cc + ' + ' + cc + '} = ' + tn(L2) + '$.'
      ] };
  }

  /* ---------------------------------------------- 6. squeeze (1.8) */
  function genSqueeze(r){
    if(r() < 0.5){
      var n = r.pick([1, 2, 3]), k = r.pick([1, 2, 3]), trig = r.pick(['\\sin', '\\cos']);
      var xn = n === 1 ? 'x' : 'x^' + n, ab = n === 2 ? 'x^2' : '|' + xn + '|';
      var steps = [
        choiceStep('bounds', 'Which bounds hold for every $x \\ne 0$ and pin the function down?', [
          { t: $('-' + ab + ' \\le ' + xn + ' ' + trig + '\\left(\\frac{' + k + '}{x}\\right) \\le ' + ab), ok: true, why: 'The ' + trig.slice(1) + ' is between −1 and 1; multiply by ' + xn + ' (with absolute values, since ' + xn + ' can be negative). Both bounds go to 0.' },
          { t: $('-1 \\le ' + xn + ' ' + trig + '\\left(\\frac{' + k + '}{x}\\right) \\le 1'), why: 'Not true for large x, and the bounds −1 and 1 do not meet, so they squeeze nothing.' },
          { t: $('0 \\le ' + xn + ' ' + trig + '\\left(\\frac{' + k + '}{x}\\right) \\le ' + ab), why: 'The function is negative for many x near 0. The lower bound must be −' + ab + '.' }
        ], '3.C'),
        numStep('lim', 'So $\\lim_{x \\to 0} ' + xn + ' ' + trig + '\\left(\\frac{' + k + '}{x}\\right)$ =', 0, [], '3.C')
      ];
      steps[1].cell = M.cell(0, 0, [], 1e-3);
      return { text: 'Use the squeeze theorem to find $\\lim_{x \\to 0} ' + xn + ' ' + trig + '\\left(\\frac{' + k + '}{x}\\right)$.', steps: steps,
        key: { L: 0, f: function(x){ return Math.pow(x, n) * (trig === '\\sin' ? Math.sin(k / x) : Math.cos(k / x)); }, lo: function(x){ return -Math.abs(Math.pow(x, n)); }, hi: function(x){ return Math.abs(Math.pow(x, n)); }, a: 0 },
        solution: [
          '$-1 \\le ' + trig + '\\left(\\frac{' + k + '}{x}\\right) \\le 1$ for every $x \\ne 0$.',
          'Multiply by $|' + xn + '|$: $-' + ab + ' \\le ' + xn + ' ' + trig + '\\left(\\frac{' + k + '}{x}\\right) \\le ' + ab + '$.',
          'Both bounds have limit 0 as $x \\to 0$, so by the squeeze theorem the limit is $0$.'
        ] };
    }
    var a = r.int(-2, 3), L = r.int(-3, 5), c1 = r.pick([1, 2, 3]), c2 = r.pick([1, 2, 4]);
    var lo = tn(L) + ' - ' + (c1 === 1 ? '' : c1) + '(' + shift(a) + ')^2', hi = tn(L) + ' + ' + (c2 === 1 ? '' : c2) + '(' + shift(a) + ')^2';
    if(a === 0){ lo = tn(L) + ' - ' + (c1 === 1 ? '' : c1) + 'x^2'; hi = tn(L) + ' + ' + (c2 === 1 ? '' : c2) + 'x^2'; }
    var steps2 = [
      numStep('lo', 'Find $\\lim_{x \\to ' + tn(a) + '} \\left(' + lo + '\\right)$.', L, [{ value: L - c1, why: 'At x = ' + a + ' the squared term is 0, not 1.' }], '1.E'),
      numStep('hi', 'Find $\\lim_{x \\to ' + tn(a) + '} \\left(' + hi + '\\right)$.', L, [{ value: L + c2, why: 'At x = ' + a + ' the squared term is 0, not 1.' }], '1.E'),
      choiceStep('lim', 'What can you conclude about $' + limTex(a) + '$?', [
        { t: 'It equals ' + $(tn(L)) + ', by the squeeze theorem', ok: true, why: 'f is trapped between two functions with the same limit ' + L + ', so its limit is ' + L + ' too.' },
        { t: 'It is between ' + $(tn(L - c1)) + ' and ' + $(tn(L + c2)), why: 'The bounds meet at x = ' + a + ': both have limit ' + L + ', so f is pinned to ' + L + '.' },
        { t: 'Nothing, because the formula for ' + $('f') + ' is not given', why: 'That is exactly when the squeeze theorem helps: the bounds are enough.' }
      ], '3.C')
    ];
    return { text: 'For every $x$ near $' + tn(a) + '$, $' + lo + ' \\le f(x) \\le ' + hi + '$.', steps: steps2,
      key: { L: L, a: a, lo: function(x){ return L - c1 * (x - a) * (x - a); }, hi: function(x){ return L + c2 * (x - a) * (x - a); } },
      solution: [
        'The lower bound has limit $' + tn(L) + '$ as $x \\to ' + tn(a) + '$ (substitute).',
        'The upper bound has limit $' + tn(L) + '$ too.',
        'Since $f$ is between them, the squeeze theorem gives $' + limTex(a) + ' = ' + tn(L) + '$.'
      ] };
  }

  /* ---------------------------------------------- 7. classify (1.10) */
  var KIND_OPTS = [
    { k: 'removable', t: 'Removable (a hole or a point out of place)' },
    { k: 'jump', t: 'Jump' },
    { k: 'infinite', t: 'Infinite (a vertical asymptote)' },
    { k: 'continuous', t: 'None: f is continuous there' }
  ];
  var FAIL_OPTS = [
    { k: 'defined', t: $('f(a)') + ' is not defined' },
    { k: 'exists', t: $('\\lim_{x \\to a} f(x)') + ' does not exist' },
    { k: 'equal', t: 'The limit and ' + $('f(a)') + ' differ' },
    { k: 'none', t: 'None: all three conditions hold' }
  ];
  function genClassify(r){
    var a = r.int(-2, 3), kind = r.pick(['hole', 'moved', 'jump', 'infinite', 'infinite', 'continuous']);
    var L = r.int(-2, 3), s = r.pick([-1, -0.5, 0.5, 1]), q = r.pick([0, 0.25, -0.25]);
    var base = piece(L, s, q, a), curves, points = [], asym = [], type, fails, yr;
    if(kind === 'infinite'){
      var c = r.pick([1, 2, -1, -2]), sq = r() < 0.5, m = r.int(-1, 2);
      var g = function(x){ var d = x - a; return c / (sq ? d * d : d) + m; };
      curves = [{ fn: g, domain: [a - 4, a - 0.02], cls: 's1', label: 'f' }, { fn: g, domain: [a + 0.02, a + 4], cls: 's1' }];
      asym = [{ x: a }]; yr = [m - 6, m + 6]; type = 'infinite'; fails = 'defined';
    } else if(kind === 'jump'){
      var R = L + r.pick([-3, -2, 2, 3]), fR = piece(R, r.pick([-1, 0.5, 1]), 0, a), side = r() < 0.5;
      curves = [{ fn: base, domain: [a - 4, a], cls: 's1', label: 'f', ends: [null, side ? 'closed' : 'open'] }, { fn: fR, domain: [a, a + 4], cls: 's1', ends: [side ? 'open' : 'closed', null] }];
      yr = yWin([[base, a - 4, a], [fR, a, a + 4]]); type = 'jump'; fails = 'exists';
    } else {
      curves = [{ fn: base, domain: [a - 4, a + 4], cls: 's1', label: 'f' }];
      if(kind === 'hole'){ points = [{ at: [a, L], open: true, cls: 's1' }]; type = 'removable'; fails = 'defined'; }
      else if(kind === 'moved'){ var v = L + r.pick([-2, 2, 3]); points = [{ at: [a, L], open: true, cls: 's1' }, { at: [a, v], cls: 's1' }]; type = 'removable'; fails = 'equal'; }
      else { type = 'continuous'; fails = 'none'; points = [{ at: [a, L], cls: 's1' }]; }
      yr = yWin([[base, a - 4, a + 4]], a, points.map(function(p){ return p.at[1]; }));
    }
    var fig = { plot: { label: 'Graph of f near x = ' + a + ' for classifying its behavior there', x: [a - 4, a + 4], y: yr, xStep: 1, yStep: yr[1] - yr[0] > 10 ? 2 : 1, xLabel: 'x', yLabel: 'y', curves: curves, points: points, asymptotes: asym } };
    var whyK = {
      removable: 'The limit exists (both sides meet at one height) but the point is missing or sits elsewhere: redefining one value removes it.',
      jump: 'The one-sided limits are finite but different, so the graph jumps.',
      infinite: 'The function grows without bound near x = ' + a + ': a vertical asymptote.',
      continuous: 'The graph passes through x = ' + a + ' without a break: value and limit agree.'
    };
    var whyF = {
      defined: 'Look for a filled point at x = ' + a + '.',
      exists: 'Compare the heights the two sides head for.',
      equal: 'Compare the filled point with the height the curve heads for.',
      none: 'Check each condition in order: defined, limit exists, equal.'
    };
    var steps = [
      choiceStep('type', 'What kind of discontinuity does $f$ have at $x = ' + tn(a) + '$?', KIND_OPTS.map(function(o){ return { t: o.t, ok: o.k === type, why: o.k === type ? whyK[o.k] : 'Not this one. ' + whyK[type] }; }), '2.B', true),
      choiceStep('fails', 'Check continuity at $a = ' + tn(a) + '$: which condition fails first?', FAIL_OPTS.map(function(o){ return { t: o.t, ok: o.k === fails, why: o.k === fails ? (fails === 'none' ? 'f(' + a + ') is defined, the limit exists, and they are equal.' : fails === 'defined' ? 'There is no filled point at x = ' + a + ', so the very first condition fails.' : fails === 'exists' ? 'f(' + a + ') is defined (the filled point), but the sides head to different heights.' : 'f(' + a + ') is defined and the limit exists, but they are different numbers.') : whyF[o.k] }; }), '3.F', true)
    ];
    return { text: 'The graph shows $y = f(x)$ near $x = ' + tn(a) + '$.', fig: fig, steps: steps, key: { a: a, type: type, fails: fails, curves: curves, points: points },
      solution: [
        'Continuity at $x = a$ needs three things: $f(a)$ is defined, $\\lim_{x \\to a} f(x)$ exists, and the two are equal.',
        whyK[type],
        fails === 'none' ? 'All three hold, so $f$ is continuous at $x = ' + tn(a) + '$.' : 'The first condition to fail: ' + FAIL_OPTS.filter(function(o){ return o.k === fails; })[0].t.replace(/f\(a\)/g, 'f(' + tn(a) + ')') + '.'
      ] };
  }

  /* ---------------------------------------------- 8. continuity check (1.11) */
  function genContinuity(r){
    var a = r.int(-1, 3), b = r.int(-3, 3), L = a * a + b, kind = r.pick(['cont', 'value', 'jump']);
    var m = r.pick([1, 2, 3, -1]), R = kind === 'jump' ? L + r.pick([-2, -1, 1, 2]) : L, d = R - m * a;
    var v = kind === 'value' ? L + r.pick([-3, -1, 2, 4]) : kind === 'cont' ? L : r.pick([L, R]);
    var lt = poly([b, 0, 1]), rt = poly([d, m]);
    var tex = 'f(x) = \\begin{cases} ' + lt + ' & x < ' + tn(a) + ' \\\\ ' + tn(v) + ' & x = ' + tn(a) + ' \\\\ ' + rt + ' & x > ' + tn(a) + ' \\end{cases}';
    var exists = L === R, cont = exists && v === L;
    var steps = [
      numStep('value', 'What is $f(' + tn(a) + ')$?', v, [{ value: L === v ? NaN : L, why: 'f(' + a + ') is given by the middle line, x = ' + a + '.' }], '2.B'),
      choiceStep('lim', 'What is $' + limTex(a) + '$?', [
        { t: exists ? $(tn(L)) : DNE, ok: true, why: exists ? 'Left: ' + lt + ' → ' + L + '. Right: ' + rt + ' → ' + R + '. They agree.' : 'Left: ' + lt + ' → ' + L + '. Right: ' + rt + ' → ' + R + '. They differ.' },
        { t: exists ? DNE : $(tn(L)), why: exists ? 'Both sides give ' + L + ', so the limit exists.' : 'That is only the left-hand limit.' },
        { t: $(tn(v === L ? (R === L ? L + 1 : R) : v)), why: v === L ? 'Substitute ' + a + ' into each piece.' : 'That is f(' + a + '), not the limit.' }
      ], '1.E'),
      choiceStep('cont', 'Is $f$ continuous at $x = ' + tn(a) + '$?', [
        { t: 'Yes: ' + $('f(' + tn(a) + ')') + ' equals the limit', ok: cont, why: cont ? 'All three conditions hold.' : 'Check again: ' + (exists ? 'the limit is ' + L + ' but f(' + a + ') = ' + v + '.' : 'the limit does not exist.') },
        { t: 'No: the limit does not exist', ok: !exists, why: !exists ? 'The one-sided limits differ, so f cannot be continuous there.' : 'The limit does exist: both sides give ' + L + '.' },
        { t: 'No: the limit exists but differs from ' + $('f(' + tn(a) + ')'), ok: exists && !cont, why: exists && !cont ? 'The limit is ' + L + ' but f(' + a + ') = ' + v + ': a removable discontinuity.' : cont ? 'They are equal here.' : 'The limit does not even exist.' }
      ], '3.F', true)
    ];
    return { text: 'Let $$' + tex + '$$', steps: steps, key: { a: a, v: v, L: L, R: R, left: function(x){ return x * x + b; }, right: function(x){ return m * x + d; } },
      solution: [
        '$f(' + tn(a) + ') = ' + tn(v) + '$ (the middle line).',
        'Left: $' + limTex(a, '^-') + ' = ' + tn(L) + '$; right: $' + limTex(a, '^+') + ' = ' + tn(R) + '$.',
        cont ? 'The limit exists and equals $f(' + tn(a) + ')$, so $f$ is continuous at $x = ' + tn(a) + '$.' : exists ? 'The limit $' + tn(L) + '$ is not $f(' + tn(a) + ') = ' + tn(v) + '$: not continuous (removable).' : 'The one-sided limits differ: the limit does not exist, so $f$ is not continuous (a jump).'
      ] };
  }

  /* ---------------------------------------------- 9. remove a discontinuity (1.13) */
  function genRemove(r){
    if(r() < 0.5){
      var c = r.nonzero(-3, 4), s = r.int(-4, 5);
      while(s === c) s++;
      var num = poly([c * s, -(c + s), 1]), K = c - s;
      var steps = [
        choiceStep('rule', 'For $f$ to be continuous at $x = ' + tn(c) + '$, $k$ must equal', [
          { t: $('\\lim_{x \\to ' + tn(c) + '} \\frac{' + num + '}{' + shift(c) + '}'), ok: true, why: 'Continuity means f(' + c + ') = lim f(x), and f(' + c + ') = k.' },
          { t: 'the value of the top at ' + $('x = ' + tn(c)) + ', which is ' + $('0'), why: 'That ignores the bottom. The fraction is 0/0 there; its limit is what k must match.' },
          { t: 'any number: the fraction is not defined at ' + $('x = ' + tn(c)), why: 'Exactly one value of k fills the hole: the limit.' }
        ], '3.F'),
        numStep('k', 'So $k$ =', K, [{ value: 0, why: 'The top is 0 at x = ' + c + ', but the limit of the fraction is not. Factor and cancel.' }, { value: c + s, why: 'Cancel (x − ' + c + '); what is left is x − ' + s + '. Substitute x = ' + c + '.' }], '1.E')
      ];
      return { text: 'Let $f(x) = \\frac{' + num + '}{' + shift(c) + '}$ for $x \\ne ' + tn(c) + '$ and $f(' + tn(c) + ') = k$.', steps: steps,
        key: { kind: 'hole', a: c, k: K, f: function(x){ return (x * x - (c + s) * x + c * s) / (x - c); } },
        solution: [
          'Continuity at $x = ' + tn(c) + '$ needs $f(' + tn(c) + ') = \\lim_{x \\to ' + tn(c) + '} f(x)$.',
          'Factor: $\\frac{(' + shift(c) + ')(' + shift(s) + ')}{' + shift(c) + '} = ' + shift(s) + '$ for $x \\ne ' + tn(c) + '$, so the limit is $' + tn(K) + '$.',
          'So $k = ' + tn(K) + '$.'
        ] };
    }
    // { k x + b, x < a ; x^2 + c, x >= a }, solve k a + b = a^2 + c
    var a = r.pick([-2, -1, 1, 2, 3]), k = r.nonzero(-3, 4), b = r.int(-4, 4), RV = k * a + b, cc = RV - a * a;
    var ak = a === 1 ? 'k' : a === -1 ? '-k' : tn(a) + 'k';
    var tex = 'f(x) = \\begin{cases} kx ' + (b ? (b > 0 ? '+ ' : '- ') + Math.abs(b) : '') + ' & x < ' + tn(a) + ' \\\\ ' + poly([cc, 0, 1]) + ' & x \\ge ' + tn(a) + ' \\end{cases}';
    var steps2 = [
      numStep('right', 'What is $' + limTex(a, '^+') + '$ (which is also $f(' + tn(a) + ')$)?', RV, [], '1.E'),
      numStep('k', 'For which $k$ is $f$ continuous at $x = ' + tn(a) + '$?', k, [{ value: (RV + b) / a, why: 'Move b to the other side with the opposite sign: k·' + a + ' = ' + RV + ' − (' + b + ').' }, { value: RV / a, why: 'Do not forget the constant ' + b + ' on the left piece.' }], '1.E')
    ];
    return { text: 'Let $$' + tex + '$$', steps: steps2, key: { kind: 'join', a: a, k: k, b: b, c: cc },
      solution: [
        'From the right (and at $x = ' + tn(a) + '$): $' + tn(a) + '^2 ' + (cc < 0 ? '- ' + (-cc) : '+ ' + cc) + ' = ' + tn(RV) + '$.',
        'From the left: $' + ak + ' ' + (b ? (b > 0 ? '+ ' : '- ') + Math.abs(b) : '') + '$. Continuity needs the two to match.',
        '$' + ak + ' ' + (b ? (b > 0 ? '+ ' : '- ') + Math.abs(b) : '') + ' = ' + tn(RV) + '$, so $k = ' + tn(k) + '$.'
      ] };
  }

  /* ---------------------------------------------- 10. infinite limits (1.14) */
  var INF_OPTS = ['$\\infty$', '$-\\infty$', '$0$', 'a finite number other than ' + $('0')];
  function genVertical(r){
    var a = r.int(-2, 4), p = r.nonzero(-4, 4), sq = r() < 0.4;
    while(a + p === 0) p++;
    var N = a + p; // numerator at a
    var left = sq ? (N > 0 ? Infinity : -Infinity) : (N > 0 ? -Infinity : Infinity), right = sq ? left : -left;
    var den = sq ? '(' + shift(a) + ')^2' : shift(a), top = poly([p, 1]);
    var o = function(v){ return v === Infinity ? 0 : 1; };
    var mk = function(v, side){
      var sign = side === '-' ? (sq ? 'positive (a square)' : 'negative') : 'positive';
      return INF_OPTS.map(function(t, i){ return { t: t, ok: i === o(v), why: i === o(v) ? 'The top is near ' + N + ' (' + (N > 0 ? 'positive' : 'negative') + ') and the bottom is a tiny ' + sign + ' number, so the fraction is ' + (v > 0 ? 'huge and positive.' : 'huge and negative.') : i >= 2 ? 'The bottom goes to 0 while the top does not, so the fraction grows without bound.' : 'Check the signs: top ' + (N > 0 ? 'positive' : 'negative') + ', bottom ' + sign + '.' }; });
    };
    var steps = [
      choiceStep('left', 'Find $' + limTex(a, '^-') + '$.', mk(left, '-'), '1.E', true),
      choiceStep('right', 'Find $' + limTex(a, '^+') + '$.', mk(right, '+'), '1.E', true)
    ];
    return { text: 'Let $f(x) = \\frac{' + top + '}{' + den + '}$.', steps: steps, key: { a: a, f: function(x){ return (x + p) / (sq ? (x - a) * (x - a) : x - a); }, left: left, right: right },
      solution: [
        'At $x = ' + tn(a) + '$ the top is $' + tn(N) + '$ and the bottom is $0$: the fraction grows without bound, and $x = ' + tn(a) + '$ is a vertical asymptote.',
        'Signs: the top is ' + (N > 0 ? 'positive' : 'negative') + '. ' + (sq ? 'The bottom is a square, positive on both sides.' : 'The bottom is negative for $x < ' + tn(a) + '$ and positive for $x > ' + tn(a) + '$.'),
        '$' + limTex(a, '^-') + ' = ' + tn(left) + '$ and $' + limTex(a, '^+') + ' = ' + tn(right) + '$.'
      ] };
  }

  /* ---------------------------------------------- 11. limits at infinity (1.15) */
  function genInfinity(r){
    var n = r.int(1, 3), m = r.int(1, 3), A = r.nonzero(-5, 6), B = r.pick([1, 2, 3, 4, 5]);
    var tc = [r.int(-5, 5)], bc = [r.nonzero(-6, 6)];
    for(var i = 1; i < n; i++) tc.push(r.int(-4, 4));
    for(var j = 1; j < m; j++) bc.push(r.int(-3, 3));
    tc[n] = A; bc[m] = B;
    var top = poly(tc), bot = poly(bc), lead = function(c, k){ return (c === 1 ? '' : c === -1 ? '-' : tn(c)) + (k === 1 ? 'x' : 'x^' + k); };
    var fv = function(x){ var t = 0, b = 0; for(var k = 0; k <= n; k++) t += tc[k] * Math.pow(x, k); for(var q = 0; q <= m; q++) b += bc[q] * Math.pow(x, q); return t / b; };
    var limAt = function(sign){
      if(n < m) return 0;
      if(n === m) return A / B;
      var s = A / B * Math.pow(sign, n - m);
      return s > 0 ? Infinity : -Infinity;
    };
    var Lp = limAt(1), Lm = limAt(-1);
    var opt = function(v){ return $(tn(v)); };
    var cand = [Lp, Lm, 0, A / B, B / A, Infinity, -Infinity, A];
    var mk = function(v, where){
      var list = [{ t: opt(v), ok: true, why: n < m ? 'The bottom grows faster (degree ' + m + ' > ' + n + '), so the fraction shrinks to 0.' : n === m ? 'Same degree: the ratio of the leading coefficients, ' + tn(A) + '/' + tn(B) + '.' : 'The top grows faster (degree ' + n + ' > ' + m + '): f behaves like ' + tn(A) + '/' + tn(B) + '·x^' + (n - m) + ' ' + where + ', which is ' + (v > 0 ? 'huge and positive.' : 'huge and negative.') }];
      cand.forEach(function(c){ if(list.length < 4 && list.every(function(o){ return o.t !== opt(c); })) list.push({ t: opt(c), why: n < m ? 'Compare the degrees: the bottom wins, so the limit is 0.' : n === m ? 'Same degree: divide the leading coefficients, top over bottom.' : 'The top wins: no finite limit. Check the sign of ' + tn(A) + '/' + tn(B) + '·x^' + (n - m) + ' ' + where + '.' }); });
      return list;
    };
    var steps = [
      choiceStep('dom', 'As $x \\to \\pm\\infty$, $f(x)$ behaves like', [
        { t: $('\\frac{' + lead(A, n) + '}{' + lead(B, m) + '}'), ok: true, why: 'For huge |x| the highest powers dominate top and bottom; the other terms become negligible next to them.' },
        { t: $('\\frac{' + tn(tc[0]) + '}{' + tn(bc[0]) + '}'), why: 'The constant terms matter for x near 0, not for huge x.' },
        { t: $(lead(A, n)), why: 'The bottom does not vanish: keep its leading term too.' }
      ], '1.C'),
      choiceStep('pinf', 'Find $\\lim_{x \\to \\infty} f(x)$.', mk(Lp, 'as x → ∞'), '1.E'),
      choiceStep('minf', 'Find $\\lim_{x \\to -\\infty} f(x)$.', mk(Lm, 'as x → −∞'), '1.E')
    ];
    return { text: 'Let $f(x) = \\frac{' + top + '}{' + bot + '}$.', steps: steps, key: { f: fv, Lp: Lp, Lm: Lm, n: n, m: m },
      solution: [
        'Keep the leading terms: $f(x) \\approx \\frac{' + lead(A, n) + '}{' + lead(B, m) + '}$ for large $|x|$.',
        n < m ? 'The bottom has the higher degree, so $f(x) \\to 0$ at both ends: $y = 0$ is a horizontal asymptote.' : n === m ? 'Same degree: $f(x) \\to ' + tn(A / B) + '$ at both ends, so $y = ' + tn(A / B) + '$ is a horizontal asymptote.' : 'The top has the higher degree: $f$ grows without bound and has no horizontal asymptote.',
        '$\\lim_{x \\to \\infty} f(x) = ' + tn(Lp) + '$ and $\\lim_{x \\to -\\infty} f(x) = ' + tn(Lm) + '$.'
      ] };
  }

  /* ---------------------------------------------- 12. IVT (1.16) */
  function genIvt(r){
    var xs = [0], k = r.int(-1, 3), ys = [], n = 6;
    for(var i = 1; i < n; i++) xs.push(xs[i - 1] + r.pick([1, 1, 2]));
    for(var j = 0; j < n; j++) ys.push(k + r.pick([-4, -3, -2, -1, 1, 2, 3, 4]));
    var count = 0;
    for(var q = 0; q + 1 < n; q++) if((ys[q] - k) * (ys[q + 1] - k) < 0) count++;
    var pair = 0;
    for(q = 0; q + 1 < n; q++) if((ys[q] - k) * (ys[q + 1] - k) < 0){ pair = q; break; }
    if(count === 0){ ys[1] = k + (ys[0] > k ? -2 : 2); count = 0; for(q = 0; q + 1 < n; q++) if((ys[q] - k) * (ys[q + 1] - k) < 0) count++; pair = 0; }
    var a = xs[pair], b = xs[pair + 1], fa = ys[pair], fb = ys[pair + 1];
    var tab = { cols: ['$x$'].concat(xs.map(function(x){ return $(tn(x)); })), rows: [['$f(x)$'].concat(ys.map(function(y){ return $(tn(y)); }))] };
    var lo = Math.min(fa, fb), hi = Math.max(fa, fb);
    var steps = [
      choiceStep('hyp', 'What does the Intermediate Value Theorem need before it can say anything on $[' + a + ', ' + b + ']$?', [
        { t: $('f') + ' is continuous on the closed interval ' + $('[' + a + ', ' + b + ']'), ok: true, why: 'Continuity on the closed interval is the hypothesis; the problem says f is continuous.' },
        { t: $('f') + ' is differentiable on ' + $('(' + a + ', ' + b + ')'), why: 'That is a hypothesis of the Mean Value Theorem. The IVT needs only continuity.' },
        { t: $('f') + ' is increasing on ' + $('[' + a + ', ' + b + ']'), why: 'The IVT works for any continuous function, increasing or not.' }
      ], '3.B'),
      numStep('count', 'What is the least number of solutions of $f(x) = ' + tn(k) + '$ the IVT guarantees on $[' + xs[0] + ', ' + xs[n - 1] + ']$?', count, [{ value: n, why: 'Only an interval where f(x) − ' + k + ' changes sign (one end above ' + k + ', the other below) is guaranteed a solution.' }], '3.D'),
      choiceStep('just', 'Which justification earns the point for a solution in $(' + a + ', ' + b + ')$?', [
        { t: 'Because ' + $('f') + ' is continuous on ' + $('[' + a + ', ' + b + ']') + ' and ' + $('f(' + a + ') ' + (fa < fb ? '<' : '>') + ' ' + tn(k) + ' ' + (fa < fb ? '<' : '>') + ' f(' + b + ')') + ', by the IVT there is a ' + $('c') + ' in ' + $('(' + a + ', ' + b + ')') + ' with ' + $('f(c) = ' + tn(k)) + '.', ok: true, why: 'It names the theorem, states continuity on the closed interval, and shows ' + k + ' is between f(' + a + ') and f(' + b + ').' },
        { t: 'Because ' + $('f(' + a + ') = ' + tn(fa)) + ' and ' + $('f(' + b + ') = ' + tn(fb)) + ', by the IVT there is a ' + $('c') + ' with ' + $('f(c) = ' + tn(k)) + '.', why: 'It never says f is continuous. Readers take the point away for a missing hypothesis.' },
        { t: 'By the Mean Value Theorem there is a ' + $('c') + ' in ' + $('(' + a + ', ' + b + ')') + ' with ' + $('f(c) = ' + tn(k)) + '.', why: 'The MVT is about a slope f\'(c), not a value f(c). This is the IVT.' }
      ], '3.F')
    ];
    var ylo = Math.min.apply(null, ys.concat([k])) - 1, yhi = Math.max.apply(null, ys.concat([k])) + 1;
    var plot = { label: 'The table values of f as points, with the line y = ' + k + '; f is continuous between them but its graph is not shown', x: [-0.5, xs[n - 1] + 0.5], y: [ylo, yhi], xStep: 1, yStep: 1, xLabel: 'x', yLabel: 'y',
      points: xs.map(function(x, i){ return { at: [x, ys[i]], cls: 's1' }; }), lines: [{ point: [0, k], slope: 0, cls: 's2', dashed: true, label: 'y = ' + k }] };
    return { text: 'The function $f$ is continuous on $[' + xs[0] + ', ' + xs[n - 1] + ']$. Some of its values are in the table.', fig: { table: tab, plot: plot }, steps: steps,
      key: { xs: xs, ys: ys, k: k, count: count, a: a, b: b },
      solution: [
        '$f$ is continuous on the closed interval, so the IVT applies on every interval between table values.',
        'A solution of $f(x) = ' + tn(k) + '$ is guaranteed on each interval where $f$ goes from below $' + tn(k) + '$ to above it, or the reverse.',
        'That happens on ' + count + ' interval' + (count === 1 ? '' : 's') + ', so at least ' + count + ' solution' + (count === 1 ? '' : 's') + ' (there may be more between the table points).',
        'On $[' + a + ', ' + b + ']$: $' + tn(lo) + ' < ' + tn(k) + ' < ' + tn(hi) + '$.'
      ] };
  }

  var GEN = { graph: genGraph, table: genTable, onesided: genOneSided, laws: genLaws, algebra: genAlgebra, squeeze: genSqueeze,
    classify: genClassify, continuity: genContinuity, remove: genRemove, vertical: genVertical, infinity: genInfinity, ivt: genIvt };
  function typeOf(ctx, type){
    var list = ctx.types || [ctx.id];
    return type && list.indexOf(type) > -1 ? type : list[0];
  }
  /* Numbers written with tn() land in plain sentences too: outside $...$
     they read as text (−2, 1/2, ∞), not TeX. */
  function plainNums(str){
    return String(str).split(/(\$\$[\s\S]*?\$\$|\$[^$]*\$)/).map(function(seg, i){
      if(i % 2) return seg;
      return seg.replace(/\{-([^{}]*(?:\{[^{}]*\}[^{}]*)*)\}/g, '−$1').replace(/\\frac\{(\d+)\}\{(\d+)\}/g, '$1/$2').replace(/-\\infty/g, '−∞').replace(/\\infty/g, '∞').replace(/(^|[\s(=,\/])-(\d)/g, '$1−$2');
    }).join('');
  }
  function generate(r, ctx, type){
    var t = typeOf(ctx, type), p = GEN[t](r, ctx);
    p.ctx = ctx.id; p.type = t; p.topic = ctx.topic;
    p.text = plainNums(p.text);
    p.solution = p.solution.map(plainNums);
    p.steps.forEach(function(s){
      s.label = plainNums(s.label);
      if(s.hint) s.hint = plainNums(s.hint);
      if(s.options) s.options = s.options.map(plainNums);
      if(s.why) s.why = s.why.map(plainNums);
      if(s.cell && s.cell.mistakes) s.cell.mistakes.forEach(function(m){ m.why = plainNums(m.why); });
    });
    return p;
  }

  M.register('limitExplorer', {
    GALLERY: GALLERY, entry: entry, value: value, evalAt: evalAt, limit: limit, check: check, view: view, rows: rows, zoomLabel: zoomLabel,
    TYPES: TYPES, GEN: GEN, generate: generate, tn: tn, poly: poly
  });
})();
