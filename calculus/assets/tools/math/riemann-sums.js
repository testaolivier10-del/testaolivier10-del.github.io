/* Riemann sums model: ApCalcMath.riemannSums (docs/apcalc-architecture.md, "Tools").
   OWNED BY THIS TOOL ONLY: no other tool edits this file, and this tool edits
   no shared file. Pure functions, no DOM, so the validator
   (scripts/lib/apcalc-tool-checks/riemann-sums.mjs) and the test
   (scripts/test/apcalc-tool-riemann-sums.test.mjs) run exactly this code.

   Loaded after calc-expr.js (ApCalcExpr), calc-math.js (ApCalcTex) and
   calc-tool-math.js (ApCalcMath), before calculus/assets/tools/riemann-sums.js.

   Explore
     partition(a, b, n) -> [x0 ... xn]                equal widths
     pieces(f, xs, kind) -> [piece]                   one per subinterval of xs:
       { x0, x1, w, at, h, h0, h1, area }             at: the x whose height is used
                                                       (L, R, M); h0/h1 the ends (T);
                                                       area signed (w·h, or w·(h0+h1)/2)
     tablePieces(xs, ys, kind) -> [piece]             a table, widths as given;
                                                       'mid' pairs the subintervals
                                                       and uses the point between
     total(pieces) -> the sum                          (the same number as
                                                       ApCalcMath.riemann / riemannTable)
     shape(f, a, b) -> { inc: 'up'|'down'|null, conc: 'up'|'down'|null }
     verdict(kind, shape) -> { v: 'over'|'under'|null, why }   over/under and the reason
     midOk(xs) -> whether a table allows a midpoint sum (an odd number of points)
   Test yourself
     generate(rng, ctx, type?) -> { ctx, topic, type, text, steps, solution, figure?, table? }
       types: table (L/R/M/T from a table with unequal widths), overunder
       (over or under, with the reason), context (the area under a rate
       graph as an amount, with units and an initial amount), sigma (a limit
       of a sum as a definite integral), tosum (a definite integral as a
       limit of right sums, and one right sum). */
(function(G){
  'use strict';
  var M = G.ApCalcMath;
  if(!M) return;
  var KINDS = ['left', 'right', 'mid', 'trap'];
  var NAME = { left: 'left Riemann sum', right: 'right Riemann sum', mid: 'midpoint Riemann sum', trap: 'trapezoidal sum' };
  var SHORT = { left: 'Left', right: 'Right', mid: 'Midpoint', trap: 'Trapezoid' };
  function tex(s){ return G.ApCalcTex ? G.ApCalcTex.html(s) : s; }
  function m(x){ return M.fmt(x, 6); }                 // a table value as text, real minus
  function n2(x){ return M.round(x, 6); }
  function tn(x){ var s = String(n2(x)); return s; }  // a number inside TeX
  function I(v){ return '<i>' + v + '</i>'; }             // plain-HTML math for text read as a caption
  function toF(f){ return typeof f === 'function' ? f : M.fn(String(f)); }

  /* ------------------------------------------------------------ explore */
  function partition(a, b, n){ var xs = []; for(var i = 0; i <= n; i++) xs.push(i === n ? b : a + (b - a) * i / n); return xs; }
  function piece(x0, x1, kind, f0, f1, fm){
    var w = x1 - x0, p = { x0: x0, x1: x1, w: w };
    if(kind === 'trap'){ p.h0 = f0; p.h1 = f1; p.h = (f0 + f1) / 2; p.at = null; }
    else { p.at = kind === 'left' ? x0 : kind === 'right' ? x1 : (x0 + x1) / 2; p.h = kind === 'left' ? f0 : kind === 'right' ? f1 : fm; }
    p.area = w * p.h;
    return p;
  }
  function pieces(f, xs, kind){
    f = toF(f);
    var out = [];
    for(var i = 0; i + 1 < xs.length; i++) out.push(piece(xs[i], xs[i + 1], kind, f(xs[i]), f(xs[i + 1]), f((xs[i] + xs[i + 1]) / 2)));
    return out;
  }
  function midOk(xs){ return xs.length >= 3 && xs.length % 2 === 1; }
  function tablePieces(xs, ys, kind){
    var out = [], i;
    if(kind === 'mid'){
      if(!midOk(xs)) return [];
      for(i = 0; i + 2 < xs.length; i += 2){ var p = { x0: xs[i], x1: xs[i + 2], w: xs[i + 2] - xs[i], at: xs[i + 1], h: ys[i + 1] }; p.area = p.w * p.h; out.push(p); }
      return out;
    }
    for(i = 0; i + 1 < xs.length; i++) out.push(piece(xs[i], xs[i + 1], kind, ys[i], ys[i + 1], NaN));
    return out;
  }
  function total(ps){ return ps.reduce(function(s, p){ return s + p.area; }, 0); }

  /* Monotonic and concave on [a, b]? From the values on a fine grid (first
     and second differences), so a corner or a flat stretch is honest. */
  function shape(f, a, b){
    f = toF(f);
    var N = 600, h = (b - a) / N, ys = [], i;
    for(i = 0; i <= N; i++) ys.push(f(a + i * h));
    var scale = Math.max(1e-9, Math.max.apply(null, ys.map(Math.abs)));
    var up = 0, dn = 0, cu = 0, cd = 0, e1 = 1e-9 * scale, e2 = 1e-9 * scale;
    for(i = 0; i < N; i++){ var d = ys[i + 1] - ys[i]; if(d > e1) up++; else if(d < -e1) dn++; }
    for(i = 1; i < N; i++){ var c = ys[i + 1] - 2 * ys[i] + ys[i - 1]; if(c > e2) cu++; else if(c < -e2) cd++; }
    return { inc: up && !dn ? 'up' : dn && !up ? 'down' : null, conc: cu && !cd ? 'up' : cd && !cu ? 'down' : null };
  }
  /* The exam's reasons (docs/apcalc-authoring-guide.md, "Justifications"):
     left and right from increasing or decreasing; midpoint and trapezoid
     from concavity. */
  function verdict(kind, s, fn){
    fn = fn || 'f';
    if(kind === 'left' || kind === 'right'){
      if(!s.inc) return { v: null, why: fn + ' is not increasing or decreasing on the whole interval, so a ' + NAME[kind] + ' can land on either side.' };
      var over = (kind === 'left') === (s.inc === 'down');
      return { v: over ? 'over' : 'under', why: fn + ' is ' + (s.inc === 'up' ? 'increasing' : 'decreasing') + ', so each ' + (kind === 'left' ? 'left' : 'right') + ' endpoint gives the ' + (over ? 'largest' : 'smallest') + ' value of ' + fn + ' on its subinterval.' };
    }
    if(!s.conc) return { v: null, why: fn + ' changes concavity on the interval, so a ' + NAME[kind] + ' can land on either side.' };
    var o2 = (kind === 'trap') === (s.conc === 'up');
    return { v: o2 ? 'over' : 'under', why: fn + ' is concave ' + s.conc + ', so ' + (kind === 'trap' ? 'each trapezoid\'s top (a chord) lies ' + (s.conc === 'up' ? 'above' : 'below') + ' the curve.' : 'the midpoint rectangle is the same as a tangent-line trapezoid, and the tangent line lies ' + (s.conc === 'up' ? 'below' : 'above') + ' the curve.') };
  }

  /* ------------------------------------------------------------ drills */
  var SK = { setup: '1.E', sum: '1.E', meaning: '2.D', units: '2.D', verdict: '3.F', reason: '3.F', area: '1.E', total: '2.D', width: '1.D', upper: '1.D', integrand: '1.D', pick: '1.D', value: '1.E' };
  function step(key, label, o){ var s = { key: key, label: label, practice: SK[key] || '1.E' }; for(var k in o) s[k] = o[k]; return s; }
  function choice(key, label, opts, correct, why){ return step(key, label, { kind: 'choice', options: opts, correct: correct, why: why }); }
  function num(key, label, answer, mistakes, o){
    o = o || {};
    var d = o.d != null ? o.d : 3;
    return step(key, label, { kind: 'num', d: d, unit: o.unit, hint: o.hint, cell: M.cell(answer, 1e-6, mistakes || [], d === 3 ? 0.0012 : Math.pow(10, -d) * 0.6) });
  }
  function shuffleIn(r, correct, wrong){
    // the correct option and its distractors in a seeded order (the drill
    // shuffles again on screen; this keeps "correct" honest in the data)
    var all = [correct].concat(wrong), idx = all.map(function(x, i){ return i; });
    for(var i = idx.length - 1; i > 0; i--){ var j = Math.floor(r() * (i + 1)); var t = idx[i]; idx[i] = idx[j]; idx[j] = t; }
    return { options: idx.map(function(i){ return all[i].o; }), why: idx.map(function(i){ return all[i].w; }), correct: idx.indexOf(0) };
  }
  function pickWidths(r, n, total){
    // n unequal positive integer widths summing to total, not all equal
    for(var g = 0; g < 200; g++){
      var ws = [], left = total;
      for(var i = 0; i < n - 1; i++){ var w = r.int(1, Math.max(1, Math.min(left - (n - 1 - i), Math.ceil(total / n) + 2))); ws.push(w); left -= w; }
      ws.push(left);
      if(left >= 1 && ws.some(function(w){ return w !== ws[0]; })) return ws;
    }
    return [1, 2, total - 3 - (n - 3), 1].slice(0, n);
  }
  function cumul(ws, a){ var xs = [a]; ws.forEach(function(w){ xs.push(xs[xs.length - 1] + w); }); return xs; }
  function tableHtml(c, xs, ys){
    return '<table class="calc-data rs-tbl"><caption>Selected values of $' + c.rate + '(' + c.var + ')$</caption><tbody><tr><th scope="row">$' + c.var + '$ (' + c.varUnit + ')</th>' + xs.map(function(x){ return '<td>' + m(x) + '</td>'; }).join('') + '</tr>' +
      '<tr><th scope="row">$' + c.rate + '(' + c.var + ')$ (' + c.rateUnit + ')</th>' + ys.map(function(y){ return '<td>' + m(y) + '</td>'; }).join('') + '</tr></tbody></table>';
  }
  function texVal(t){ return G.ApCalcExpr ? G.ApCalcExpr.number(t.replace(/\\tfrac\{([^}]*)\}\{([^}]*)\}/g, '(($1)/($2))').replace(/\\cdot/g, '*').replace(/&amp;/g, '&')) : NaN; }
  function exprOf(ps, kind){
    // the sum written the way a scoring guideline wants it: width times height
    return ps.map(function(p){
      return kind === 'trap' ? '\\tfrac{1}{2}(' + tn(p.w) + ')(' + tn(p.h0) + ' + ' + tn(p.h1) + ')' : tn(p.w) + '(' + tn(p.h) + ')';
    }).join(' + ');
  }

  function genTable(r, c){
    // a table whose wrong setups all give a different number from the right one
    for(var g = 0; g < 40; g++){ var p = genTable1(r, c); if(p) return p; }
    return genTable1(r, c, true);
  }
  function genTable1(r, c, force){
    var n = 4, ws = pickWidths(r, n, r.pick(c.spans || [10, 12])), xs = cumul(ws, c.start || 0);
    var lo = c.lo || 10, hi = c.hi || 60, ys = [], y = r.int(lo, lo + Math.round((hi - lo) / 3));
    var trend = r.pick(['up', 'down', 'mixed']);
    if(trend === 'down') y = r.int(hi - Math.round((hi - lo) / 3), hi);
    for(var i = 0; i <= n; i++){
      ys.push(y);
      var step = r.int(2, Math.max(3, Math.round((hi - lo) / 5)));
      y = trend === 'up' ? y + step : trend === 'down' ? y - step : (i % 2 ? y + step : y - Math.round(step / 2));
      y = Math.max(lo, Math.min(hi, y));
    }
    var kind = r.pick(KINDS), ps = tablePieces(xs, ys, kind), S = total(ps);
    var a = xs[0], b = xs[n], k = kind === 'mid' ? 2 : n, eqw = (b - a) / k;
    // the common-width slip: (b - a)/k times the heights a correct sum would use
    var equalW = ps.reduce(function(s, p){ return s + eqw * p.h; }, 0);
    var swapKind = kind === 'left' ? 'right' : kind === 'right' ? 'left' : kind === 'trap' ? 'left' : 'trap';
    var swapPs = tablePieces(xs, ys, swapKind), swapS = total(swapPs);
    var noHalf = kind === 'trap' ? 2 * S : null;
    var midAll = kind === 'mid' ? total(tablePieces(xs, ys, 'left')) : null;
    var unitsAmt = c.amtUnit, U = c.rate + '(' + c.var + ')';
    var RT = I(c.rate) + '(' + I(c.var) + ')', V = I(c.var);
    var text = '<p>' + c.lead + ' The rate is ' + RT + ', in ' + c.rateUnit + ', where ' + V + ' is measured in ' + c.varUnit + '. Selected values are in the table.</p>' +
      '<p>Use a <b>' + NAME[kind] + '</b>' + (kind === 'mid' ? ' with the two subintervals [' + xs[0] + ', ' + xs[2] + '] and [' + xs[2] + ', ' + xs[4] + ']' : ' with the four subintervals in the table') + ' to approximate ' + c.amount + ' from ' + V + ' = ' + a + ' to ' + V + ' = ' + b + '.</p>';
    var right = exprOf(ps, kind);
    var wrongs = [
      { o: tex('$' + (kind === 'trap' ? '\\tfrac{' + tn(b - a) + '}{' + n + '}\\cdot\\tfrac{1}{2}(' + ys.map(function(y, i){ return i && i < n ? '2\\cdot ' + tn(y) : tn(y); }).join(' + ') + ')' : '\\tfrac{' + tn(b - a) + '}{' + k + '}(' + ps.map(function(p){ return tn(p.h); }).join(' + ') + ')') + '$'), w: 'This uses one width, ' + M.fmt((b - a) / (kind === 'trap' ? n : k), 4) + ', for every subinterval. The table\'s widths are not equal: multiply each height by its own width.' },
      { o: tex('$' + exprOf(swapPs, swapKind) + '$'), w: 'That is a ' + NAME[swapKind] + ', not a ' + NAME[kind] + '. ' + (kind === 'mid' ? 'A midpoint sum takes each height from the point in the middle of its pair of subintervals.' : kind === 'trap' ? 'A trapezoid averages the two ends of each subinterval.' : 'A ' + kind + ' sum takes each height at the ' + kind + ' end of its subinterval.') }
    ];
    if(kind === 'trap') wrongs.push({ o: tex('$' + ps.map(function(p){ return tn(p.w) + '(' + tn(p.h0) + ' + ' + tn(p.h1) + ')'; }).join(' + ') + '$'), w: 'The ½ is missing: a trapezoid\'s area is the width times the AVERAGE of its two heights.' });
    else if(kind === 'mid') wrongs.push({ o: tex('$' + exprOf(tablePieces(xs, ys, 'left'), 'left') + '$'), w: 'That is a left sum over the four subintervals. A midpoint sum here has two rectangles, each as wide as a pair of subintervals.' });
    else wrongs.push({ o: tex('$' + ps.map(function(p){ return tn(p.h); }).join(' + ') + '$'), w: 'Those are the heights alone. Each term of a Riemann sum is a width times a height.' });
    if(!force && wrongs.some(function(x){ var t = /<annotation encoding="application\/x-tex">([\s\S]*?)<\/annotation>/.exec(x.o); return t && Math.abs(texVal(t[1]) - S) < 1e-9; })) return null;
    var setup = shuffleIn(r, { o: tex('$' + right + '$'), w: 'Each term is a subinterval\'s own width times the ' + (kind === 'trap' ? 'average of its two end heights' : 'height at its ' + (kind === 'mid' ? 'midpoint' : kind + ' end')) + '.' }, wrongs);
    var mist = [{ value: equalW, why: 'You used one width, (b − a) ÷ ' + k + ', for every subinterval. The widths in this table differ: use each one.' },
      { value: swapS, why: 'That is the ' + NAME[swapKind] + '. Check which heights a ' + NAME[kind] + ' uses.' }];
    if(noHalf != null) mist.push({ value: noHalf, why: 'Twice the right answer: the trapezoid area is width × (h₁ + h₂) ÷ 2. The ÷ 2 is missing.' });
    if(midAll != null) mist.push({ value: midAll, why: 'That is the left sum over all four subintervals. The midpoint sum uses two wide rectangles, with heights at the middle points.' });
    var meaning = shuffleIn(r,
      { o: 'About ' + M.fmt(S, 6) + ' ' + unitsAmt + ': an estimate of ' + c.amount + ' from $' + c.var + ' = ' + a + '$ to $' + c.var + ' = ' + b + '$ ' + c.varUnit + '.', w: 'Width (' + c.varUnit + ') times rate (' + c.rateUnit + ') gives ' + unitsAmt + ': the sum adds up the amount over the whole interval.' },
      [{ o: 'About ' + M.fmt(S, 6) + ' ' + c.rateUnit + ': the rate at $' + c.var + ' = ' + b + '$.', w: 'A sum of width times rate is an amount, not a rate. Its unit is ' + unitsAmt + '.' },
       { o: 'About ' + M.fmt(M.round(S / (b - a), 3), 6) + ' ' + c.rateUnit + ': the average rate over the interval.', w: 'That would be the sum divided by the length of the interval. The sum itself is the total amount.' },
       { o: 'About ' + M.fmt(S, 6) + ' ' + c.rateUnit + ': the total amount from $' + c.var + ' = ' + a + '$ to $' + c.var + ' = ' + b + '$.', w: 'Right idea, wrong unit: ' + c.varUnit + ' times ' + c.rateUnit + ' is ' + unitsAmt + '.' }]);
    meaning.options = meaning.options.map(tex);
    return {
      type: 'table', topic: 'riemann-sums', text: tex(text), table: { xs: xs, ys: ys, html: tex(tableHtml(c, xs, ys)) },
      figure: { kind: 'table', xs: xs, ys: ys, sumKind: kind, rate: c.rate, v: c.var, varUnit: c.varUnit, rateUnit: c.rateUnit },
      steps: [
        choice('setup', 'Which expression is the ' + NAME[kind] + '?', setup.options, setup.correct, setup.why),
        num('sum', 'Its value', S, mist, { unit: unitsAmt, d: 3, hint: 'Exact, or to three decimal places.' }),
        choice('meaning', 'What does the value mean?', meaning.options, meaning.correct, meaning.why)
      ],
      solution: [
        tex('The widths are ' + ws.join(', ') + ' ' + c.varUnit + (kind === 'mid' ? '; paired for the midpoint sum: ' + (xs[2] - xs[0]) + ' and ' + (xs[4] - xs[2]) : '') + '. They are not equal, so each term gets its own width.'),
        tex('$' + right + ' = ' + tn(S) + '$'),
        tex('The units: ' + c.varUnit + ' × ' + c.rateUnit + ' = ' + unitsAmt + '. So about ' + M.fmt(S, 6) + ' ' + unitsAmt + ' is an estimate of ' + c.amount + ' over $' + a + ' \\le ' + c.var + ' \\le ' + b + '$.')
      ]
    };
  }

  /* Formulas with a known shape on their interval (the validator rechecks
     every claim with shape()). */
  var SHAPES = [
    { fn: 'x^2 + 1', tex: 'x^2 + 1', a: 0, b: 3 },
    { fn: 'sqrt(x)', tex: '\\sqrt{x}', a: 1, b: 9 },
    { fn: 'e^(-x)', tex: 'e^{-x}', a: 0, b: 2 },
    { fn: '9 - x^2', tex: '9 - x^2', a: 0, b: 3 },
    { fn: 'ln(x)', tex: '\\ln x', a: 1, b: 5 },
    { fn: '1/x', tex: '\\frac{1}{x}', a: 1, b: 4 },
    { fn: 'x^3', tex: 'x^3', a: 0, b: 2 },
    { fn: '4 - sqrt(x)', tex: '4 - \\sqrt{x}', a: 0, b: 9 },
    { fn: 'cos(x)', tex: '\\cos x', a: 0, b: 1.5 },
    { fn: 'sin(x)', tex: '\\sin x', a: 0, b: 1.5 },
    { fn: 'x^2 - 4x + 5', tex: 'x^2 - 4x + 5', a: 0, b: 2 },
    { fn: '2^x', tex: '2^x', a: 0, b: 3 }
  ];
  function genOverUnder(r, c){
    var useRate = r() < 0.5, kind = r.pick(KINDS), sh, fnName, figure = null, intro, a, b;
    if(useRate){
      // a rate described by its derivatives, as the exam states it
      sh = { inc: r.pick(['up', 'down']), conc: r.pick(['up', 'down']) };
      fnName = c.rate; a = c.start || 0; b = a + r.pick(c.spans || [10, 12]);
      intro = c.lead + ' The rate ' + I(c.rate) + '(' + I(c.var) + ') is twice differentiable, with ' + I(c.rate) + '′(' + I(c.var) + ') ' + (sh.inc === 'up' ? '&gt;' : '&lt;') + ' 0 and ' + I(c.rate) + '″(' + I(c.var) + ') ' + (sh.conc === 'up' ? '&gt;' : '&lt;') + ' 0 for ' + a + ' ≤ ' + I(c.var) + ' ≤ ' + b + '.';
    } else {
      var F = r.pick(SHAPES);
      sh = shape(F.fn, F.a, F.b); fnName = 'f'; a = F.a; b = F.b;
      intro = 'Let $f(x) = ' + F.tex + '$ on $' + a + ' \\le x \\le ' + b + '$ (the graph is shown).';
      figure = { kind: 'fn', fn: F.fn, a: a, b: b, sumKind: kind, n: 4 };
      if(!sh.inc || !sh.conc) return genOverUnder(r, c);
    }
    var vd = verdict(kind, sh, fnName);
    var text = '<p>' + intro + '</p><p>Is a <b>' + NAME[kind] + '</b> on [' + a + ', ' + b + '] an overestimate or an underestimate of the area it approximates?</p>';
    var ver = { kind: 'choice', fixed: true, options: ['An overestimate', 'An underestimate'], correct: vd.v === 'over' ? 0 : 1,
      why: [vd.v === 'over' ? vd.why : 'Look again: ' + vd.why, vd.v === 'under' ? vd.why : 'Look again: ' + vd.why] };
    var incW = fnName + ' is ' + (sh.inc === 'up' ? 'increasing' : 'decreasing'), concW = fnName + ' is concave ' + sh.conc;
    var lr = kind === 'left' || kind === 'right';
    var good = lr ? 'Because ' + incW + ' on the interval.' : 'Because ' + concW + ' on the interval.';
    var wrongs = [
      { o: lr ? 'Because ' + concW + ' on the interval.' : 'Because ' + incW + ' on the interval.', w: lr ? 'Concavity decides midpoint and trapezoid sums. A ' + kind + ' sum is decided by whether ' + fnName + ' increases or decreases.' : 'Increasing or decreasing decides left and right sums. A ' + NAME[kind] + ' is decided by concavity.' },
      { o: 'Because ' + fnName + ' is positive on the interval.', w: 'Being positive does not say on which side of the curve the tops fall. The reason is ' + (lr ? 'increasing or decreasing' : 'concavity') + '.' },
      { o: 'Because the subintervals have equal widths.', w: 'The widths do not decide it. ' + vd.why }
    ];
    var rs = shuffleIn(r, { o: good, w: vd.why }, wrongs);
    rs.options = rs.options.map(tex); rs.why = rs.why.map(tex);
    return {
      type: 'overunder', topic: 'riemann-sums', text: tex(text), figure: figure, stageText: !useRate,
      // a rate given only by the signs of its derivatives: the page draws a sketch with that shape
      sketch: figure ? null : { inc: sh.inc, conc: sh.conc, a: a, b: b, sumKind: kind, rate: c.rate, v: c.var, varUnit: c.varUnit },
      steps: [
        step('verdict', 'Over or under?', ver),
        choice('reason', 'Which reason justifies it?', rs.options, rs.correct, rs.why)
      ],
      solution: [tex(vd.why), lr ? 'Left and right sums are decided by increasing or decreasing; midpoint and trapezoidal sums by concavity.' : 'Midpoint and trapezoidal sums are decided by concavity; left and right sums by increasing or decreasing.']
    };
  }

  /* 6.1: the area under a rate graph made of straight pieces is an amount. */
  function genContext(r, c){
    var a = c.start || 0, n = 3, ws = [], xs, ys = [];
    for(var i = 0; i < n; i++) ws.push(r.pick([2, 3, 4]));
    xs = cumul(ws, a);
    var lo = c.lo || 10, hi = c.hi || 60;
    for(var g = 0; g < 50; g++){
      ys = []; for(i = 0; i <= n; i++) ys.push(r.int(lo, hi));
      if(ys.filter(function(y, k){ return ys.indexOf(y) === k; }).length >= 3) break;
    }
    var area = 0; for(i = 0; i < n; i++) area += ws[i] * (ys[i] + ys[i + 1]) / 2;
    var A0 = r.int(2, 9) * (c.initStep || 10), b = xs[n];
    var units = shuffleIn(r, { o: c.amtUnit, w: 'Width in ' + c.varUnit + ' times height in ' + c.rateUnit + ' gives ' + c.amtUnit + '.' },
      [{ o: c.rateUnit, w: 'That is the unit of the rate (the height). The area multiplies it by ' + c.varUnit + '.' },
       { o: c.rateUnit + ' per ' + c.varUnitOne, w: 'That would be the unit of the rate\'s rate of change (a slope), not of an area.' },
       { o: c.varUnit, w: 'That is the unit of the horizontal axis alone.' }]);
    var pts = xs.map(function(x, k){ return '(' + x + ', ' + ys[k] + ')'; }).join(', ');
    var text = '<p>' + c.lead + ' The graph shows the rate ' + I(c.rate) + '(' + I(c.var) + '), in ' + c.rateUnit + ', for ' + a + ' ≤ ' + I(c.var) + ' ≤ ' + b + '; it is made of straight pieces joining ' + pts + '.</p>' +
      '<p>At ' + I(c.var) + ' = ' + a + ' there are ' + A0 + ' ' + c.amtUnit + ' ' + c.have + '.</p>';
    return {
      type: 'context', topic: 'accumulation-of-change', text: tex(text),
      figure: { kind: 'poly', xs: xs, ys: ys, rate: c.rate, v: c.var, varUnit: c.varUnit, rateUnit: c.rateUnit, shade: true },
      steps: [
        choice('units', 'The area between the graph of <i>' + c.rate + '</i> and the horizontal axis is measured in', units.options, units.correct, units.why),
        num('area', 'The area from <i>' + c.var + '</i> = ' + a + ' to <i>' + c.var + '</i> = ' + b + ' (the change in the amount)', area,
          [{ value: ys.reduce(function(s, y, k){ return k < n ? s + ws[k] * y : s; }, 0), why: 'That is a left sum. The pieces are straight, so each strip is a trapezoid: width × (left height + right height) ÷ 2 gives the exact area.' },
           { value: 2 * area, why: 'Twice the area: each trapezoid is width × the AVERAGE of its two heights.' }], { unit: c.amtUnit, d: 3 }),
        num('total', 'The amount ' + c.have + ' at <i>' + c.var + '</i> = ' + b, A0 + area,
          [{ value: area, why: 'That is only the change. Add it to the ' + A0 + ' ' + c.amtUnit + ' that were there at the start.' },
           { value: A0 - area, why: 'The rate is positive, so the amount grows: add the change, do not subtract it.' }], { unit: c.amtUnit, d: 3 })
      ],
      solution: [
        tex('Each strip under a straight piece is a trapezoid: ' + ws.map(function(w, k){ return '$\\tfrac{1}{2}(' + w + ')(' + ys[k] + ' + ' + ys[k + 1] + ')$'; }).join(' + ') + ' = ' + M.fmt(area, 6) + ' ' + c.amtUnit + '.'),
        'Units: ' + c.varUnit + ' × ' + c.rateUnit + ' = ' + c.amtUnit + '.',
        tex('Amount at $' + c.var + ' = ' + b + '$: ' + A0 + ' + ' + M.fmt(area, 6) + ' = ' + M.fmt(A0 + area, 6) + ' ' + c.amtUnit + '. The initial amount plus the change.')
      ]
    };
  }

  /* 6.3: limits of sums and definite integrals. */
  var INTEGRANDS = [
    { ans: 'x^2', tex: function(u){ return '\\left(' + u + '\\right)^2'; }, poly: true },
    { ans: 'x^3', tex: function(u){ return '\\left(' + u + '\\right)^3'; }, poly: true },
    { ans: 'sqrt(x)', tex: function(u){ return '\\sqrt{' + u + '}'; } },
    { ans: 'e^x', tex: function(u){ return 'e^{' + u + '}'; } },
    { ans: 'cos(x)', tex: function(u){ return '\\cos\\left(' + u + '\\right)'; } },
    { ans: '1/x', tex: function(u){ return '\\frac{1}{' + u + '}'; } },
    { ans: 'x^2 + 1', tex: function(u){ return '\\left(' + u + '\\right)^2 + 1'; }, poly: true, sum: true },
    { ans: '2x - 1', tex: function(u){ return '2\\left(' + u + '\\right) - 1'; }, poly: true, sum: true }
  ];
  function fxTex(I){ var t = I.tex('x').replace(/\\left\(x\\right\)/g, 'x'); return I.sum ? '\\left(' + t + '\\right)' : t; }
  function inner(a, w, k){ var t = '\\frac{' + (w === 1 ? '' : w) + k + '}{n}'; return a ? a + ' + ' + t : t; }
  function sumTex(I, a, w, o){
    o = o || {};
    var dx = o.dx1 ? '\\frac{1}{n}' : '\\frac{' + w + '}{n}', u = o.noA ? inner(0, w, 'k') : inner(a, o.dx1 ? 1 : w, 'k');
    var body = I.tex(u);
    if(I.sum && !o.noDx) body = '\\left[' + body + '\\right]';
    return '\\lim_{n \\to \\infty} \\sum_{k=1}^{n} ' + body + (o.noDx ? '' : ' \\cdot ' + dx);
  }
  function genSigma(r, c){
    var I = r.pick(INTEGRANDS), a = r.pick(I.ans === '1/x' || I.ans === 'sqrt(x)' ? [1, 2, 3] : [0, 1, 2, 3]), w = r.pick([2, 3, 4, 5]), b = a + w;
    var s = sumTex(I, a, w);
    var shifted = I.ans.replace(/x/g, '(' + a + ' + ' + w + 'x)');
    var text = '<p>Write the limit as a definite integral $\\int_a^b f(x)\\,dx$ with lower limit $a = ' + a + '$:</p><p>$$' + s + '$$</p>';
    var mist = [{ expr: shifted, why: 'That is f evaluated at a + (b − a)x. With the lower limit ' + a + ', the k-th point is x = ' + a + ' + ' + w + 'k/n, so write f(x), with x itself inside.' }];
    if(a){ mist.push({ expr: I.ans.replace(/x/g, '(x + ' + a + ')'), why: 'This shifts x by the lower limit a second time. The point ' + a + ' + ' + w + 'k/n already is x.' }); }
    return {
      type: 'sigma', topic: 'definite-integral-notation', text: tex(text),
      steps: [
        num('width', 'The length of the interval, <i>b</i> − <i>a</i> (read it from Δ<i>x</i>)', w, [{ value: w + a, why: 'That is b, the upper limit. Δx = (b − a)/n, so the number over n is the length b − a.' }], { d: 0 }),
        num('upper', 'The upper limit <i>b</i>', b, [{ value: w, why: 'That is the length b − a. Add the lower limit: b = ' + a + ' + ' + w + '.' }], { d: 0 }),
        step('integrand', 'The integrand <i>f</i>(<i>x</i>)', { kind: 'expr', lhs: 'f(x) =', cell: M.exprCell(I.ans, { vars: ['x'], domain: [Math.max(a, 0.5), b + 1], mistakes: mist }) })
      ],
      solution: [
        tex('The factor $\\frac{' + w + '}{n}$ is $\\Delta x = \\frac{b - a}{n}$, so $b - a = ' + w + '$ and, with $a = ' + a + '$, $b = ' + b + '$.'),
        tex('The k-th right endpoint is $x_k = ' + inner(a, w, 'k') + '$, and the sum evaluates f there, so $f(x) = ' + I.tex('x').replace(/\\left\(x\\right\)/g, 'x') + '$.'),
        tex('$$' + s + ' = \\int_{' + a + '}^{' + b + '} ' + fxTex(I) + '\\,dx$$')
      ]
    };
  }
  function genToSum(r, c){
    var polys = INTEGRANDS.filter(function(I){ return I.poly; }), I = r.pick(polys), a = r.pick([1, 2]), w = r.pick([2, 4]), b = a + w;
    var fx = fxTex(I);
    var good = '$' + sumTex(I, a, w) + '$';
    var opts = shuffleIn(r, { o: good, w: 'Δx = (' + b + ' − ' + a + ')/n = ' + w + '/n, and the right endpoints are x_k = ' + a + ' + ' + w + 'k/n.' }, [
      { o: '$' + sumTex(I, a, w, { noA: true }) + '$', w: 'These points start at 0, not at ' + a + ': the k-th right endpoint is ' + a + ' + ' + w + 'k/n.' },
      { o: '$' + sumTex(I, a, w, { dx1: true }) + '$', w: 'Δx is (b − a)/n = ' + w + '/n here, not 1/n, and the points step by Δx.' },
      { o: '$' + sumTex(I, a, w, { noDx: true }) + '$', w: 'The factor Δx is missing: each term is a height times a width.' }
    ]);
    opts.options = opts.options.map(tex);
    var f = M.fn(I.ans), R4 = M.riemann(f, a, b, 4, 'right'), L4 = M.riemann(f, a, b, 4, 'left');
    var text = '<p>Consider $\\int_{' + a + '}^{' + b + '} ' + fx + '\\,dx$.</p>';
    return {
      type: 'tosum', topic: 'definite-integral-notation', text: tex(text), stageText: true,
      figure: { kind: 'fn', fn: I.ans, a: a, b: b, sumKind: 'right', n: 4 },
      steps: [
        choice('pick', 'Which limit of right Riemann sums equals it?', opts.options, opts.correct, opts.why),
        num('value', 'The right Riemann sum with <i>n</i> = 4 equal subintervals', R4,
          [{ value: L4, why: 'That is the left sum. A right sum uses x = ' + (a + w / 4) + ', ' + (a + w / 2) + ', ' + (a + 3 * w / 4) + ', ' + b + '.' },
           { value: R4 / (w / 4), why: 'Multiply the sum of the heights by the width Δx = ' + (w / 4) + '.' }], { d: 3 })
      ],
      solution: [
        tex('$\\Delta x = \\frac{' + b + ' - ' + a + '}{n} = \\frac{' + w + '}{n}$ and $x_k = ' + inner(a, w, 'k') + '$, so $$\\int_{' + a + '}^{' + b + '} ' + fx + '\\,dx = ' + sumTex(I, a, w) + '$$'),
        tex('With $n = 4$: $\\Delta x = ' + tn(w / 4) + '$ and the right endpoints are ' + [1, 2, 3, 4].map(function(k){ return tn(a + k * w / 4); }).join(', ') + '. The sum is $' + tn(w / 4) + '(' + [1, 2, 3, 4].map(function(k){ return tn(f(a + k * w / 4)); }).join(' + ') + ') = ' + tn(R4) + '$.')
      ]
    };
  }

  var GEN = { table: genTable, overunder: genOverUnder, context: genContext, sigma: genSigma, tosum: genToSum };
  function generate(r, ctx, type){
    var t = type && GEN[type] && (!ctx.types || ctx.types.indexOf(type) > -1) ? type : r.pick(ctx.types || ['table']);
    var p = GEN[t](r, ctx);
    // one inline box per option, so text and math flow as a sentence
    p.steps.forEach(function(s){ if(s.options && !s.fixed) s.options = s.options.map(function(o){ return '<span class="cd-o">' + o + '</span>'; }); });
    p.ctx = ctx.id; p.type = t;
    return p;
  }

  M.register('riemannSums', {
    KINDS: KINDS, NAME: NAME, SHORT: SHORT, SHAPES: SHAPES, INTEGRANDS: INTEGRANDS,
    partition: partition, pieces: pieces, tablePieces: tablePieces, total: total, midOk: midOk,
    shape: shape, verdict: verdict, generate: generate, pickWidths: pickWidths
  });
})(typeof window !== 'undefined' ? window : globalThis);
