/* Regression lab model: ApStatMath.regressionLab (docs/apstat-architecture.md, "Tools";
   docs/apstat-spec.md section 6). OWNED BY THIS TOOL ONLY: no other tool edits
   this file, and this tool edits no shared file. Pure functions, no DOM, so the
   validator (scripts/lib/apstat-tool-checks/regression-lab.mjs) and the test
   (scripts/test/apstat-tool-regression-lab.test.mjs) run exactly this code.

   Every fit comes from ApStatDist.lsrl (least squares: b = Sxy / Sxx,
   a = ȳ − b x̄, r, r², s = √(SSE / (n − 2)), residuals y − ŷ). The page and the
   drills show and ask about the numbers these functions compute from the
   points on the screen.

   Explore helpers
     fit(xs, ys)               lsrl plus n, xbar, ybar, sx, sy, sse
     sse(xs, ys, a, b)         sum of squared residuals for any line
     point(xs, ys, i, F?)      one point's story: residual, |resid| / s, leverage,
                               the fit without it (slope, r), and the flags
                               { outlier, leverage, influential } by RULES
     curvature(xs, res)        correlation of the residuals with (x − x̄)²:
                               a bend in the residual plot (> 0.6 in size)
     strength(r)               'strong' | 'moderate' | 'weak' (rule of thumb, RULES)
     direction(r)              'positive' | 'negative'
   Drills
     generate(r, ctx, type)    a seeded "Test yourself" problem for ApStatTools.drill
       types: describe (5.1), correlation (5.2), predict (5.3), residual (5.4), lsrl (5.5)
     makeData(r, ctx, o)       seeded data along a line (or a curve) with noise */
(function(){
  'use strict';
  var M = window.ApStatMath;
  if(!M) return;
  function D(){ return M.Dist(); }

  /* ------------------------------------------------------------ explore */
  var RULES = {
    strength: 'Rule of thumb used here: |r| of 0.8 or more reads as strong, 0.5 to 0.8 as moderate, under 0.5 as weak. The course has no fixed cutoffs.',
    outlier: 'A point is flagged as an outlier when its residual is more than 2s from the line (|residual| > 2s).',
    leverage: 'A point has high leverage when its x is far from x̄: more than 2 standard deviations of x away.',
    influential: 'A point is flagged as influential when removing it changes the slope by more than 20% or r by more than 0.1.'
  };
  function sse(xs, ys, a, b){ var s = 0; for(var i = 0; i < xs.length; i++){ var e = ys[i] - (a + b * xs[i]); s += e * e; } return s; }
  function fit(xs, ys){
    var L = D().lsrl(xs, ys), out = {}, k;
    for(k in L) out[k] = L[k];
    out.n = xs.length; out.xbar = D().mean(xs); out.ybar = D().mean(ys); out.sx = D().sd(xs); out.sy = D().sd(ys);
    out.sse = sse(xs, ys, L.a, L.b);
    return out;
  }
  function strength(r){ var a = Math.abs(r); return a >= 0.8 ? 'strong' : a >= 0.5 ? 'moderate' : 'weak'; }
  function direction(r){ return r >= 0 ? 'positive' : 'negative'; }
  function corr(a, b){
    var ma = D().mean(a), mb = D().mean(b), sab = 0, saa = 0, sbb = 0;
    for(var i = 0; i < a.length; i++){ sab += (a[i] - ma) * (b[i] - mb); saa += (a[i] - ma) * (a[i] - ma); sbb += (b[i] - mb) * (b[i] - mb); }
    return saa > 0 && sbb > 0 ? sab / Math.sqrt(saa * sbb) : 0;
  }
  function curvature(xs, res){ var m = D().mean(xs); return corr(xs.map(function(x){ return (x - m) * (x - m); }), res); }
  function point(xs, ys, i, F){
    F = F || fit(xs, ys);
    var e = F.residuals[i], dx = Math.abs(xs[i] - F.xbar);
    var res = { residual: e, yhat: F.a + F.b * xs[i], std: F.s > 0 ? e / F.s : 0, dx: F.sx > 0 ? dx / F.sx : 0 };
    if(xs.length > 3){
      var xs2 = xs.filter(function(v, j){ return j !== i; }), ys2 = ys.filter(function(v, j){ return j !== i; });
      var vary = xs2.some(function(v){ return v !== xs2[0]; }) && ys2.some(function(v){ return v !== ys2[0]; });
      if(vary){ var G = D().lsrl(xs2, ys2); res.without = { a: G.a, b: G.b, r: G.r }; }
    }
    res.outlier = F.s > 0 && Math.abs(e) > 2 * F.s;
    res.leverage = res.dx > 2;
    res.influential = !!res.without && (Math.abs(res.without.b - F.b) > 0.2 * Math.max(Math.abs(F.b), 1e-9) || Math.abs(res.without.r - F.r) > 0.1);
    return res;
  }

  /* ------------------------------------------------------------- data */
  /* n x values spread over [x.lo, x.hi] (x.dp decimals, no two equal), y on
     the line a + b x (or a bend through it, o.curve) plus normal noise. */
  function makeData(r, c, o){
    o = o || {};
    var n = o.n || r.int(8, 12), X = c.x, Y = c.y, xs = [], guard = 0;
    while(xs.length < n && guard++ < 500){
      var v = M.round(X.lo + (X.hi - X.lo) * r(), X.dp || 0);
      if(xs.indexOf(v) < 0) xs.push(v);
    }
    xs.sort(function(p, q){ return p - q; });
    var b = o.b, a = o.a, sd = o.noise, mx = (X.lo + X.hi) / 2, half = (X.hi - X.lo) / 2;
    var ys = xs.map(function(x){
      var t = (x - mx) / half, bend = o.curve ? o.curve * (t * t - 0.33) : 0;
      return M.round(Math.max(Y.lo, Math.min(Y.hi, a + b * x + bend + M.normal(r, 0, sd))), Y.dp || 0);
    });
    return { xs: xs, ys: ys };
  }
  /* data whose fit passes test(F, xs, ys) */
  function dataUntil(r, c, o, test){
    for(var g = 0; g < 600; g++){
      var d = makeData(r, c, o), F = fit(d.xs, d.ys);
      if(isFinite(F.r) && test(F, d.xs, d.ys)) return d;
    }
    throw new Error('regressionLab: no data for ' + c.id);
  }
  function slopeOf(r, c, sign){ var s = c.slope; return sign * r.between(Math.abs(s[0]), Math.abs(s[1]), 2); }
  /* line parameters for the context: a slope in the context's range, the
     intercept placing the line through the middle of the y range */
  function line(r, c, sign){
    var b = slopeOf(r, c, sign == null ? (c.slope[0] < 0 ? -1 : 1) : sign), mx = (c.x.lo + c.x.hi) / 2, my = (c.y.lo + c.y.hi) / 2;
    return { b: b, a: my - b * mx, span: Math.abs(b) * (c.x.hi - c.x.lo) };
  }

  /* ----------------------------------------------------------- drills */
  var SK = { dir: '4.A', form: '4.A', str: '4.A', pickr: '4.A', rmeans: '4.A', units: '4.B', yhat: '3.A', who: '4.A', how: '4.A', extrap: '4.B',
    resid: '3.A', rsign: '4.A', plot: '4.B', b: '3.A', a: '3.A', r2: '4.A', s: '4.A' };
  var TOPIC = { describe: 'scatterplots', correlation: 'correlation', predict: 'linear-models', residual: 'residuals', lsrl: 'least-squares-regression' };
  var TYPES = [
    { value: 'describe', label: 'Describe a scatterplot' },
    { value: 'correlation', label: 'Correlation r' },
    { value: 'predict', label: 'Predict and interpret the slope' },
    { value: 'residual', label: 'Residuals' },
    { value: 'lsrl', label: 'The line from summary statistics' }
  ];
  function step(key, label, o){ var s = { key: key, label: label, practice: SK[key] || '4.A' }; for(var k in o) s[k] = o[k]; return s; }
  function num(key, label, answer, d, mistakes, o){
    o = o || {};
    return step(key, label, { kind: 'num', d: d, unit: o.unit, hint: o.hint, cell: M.cell(answer, 1e-9, mistakes || [], o.abs || Math.pow(10, -d) * 0.6) });
  }
  function choice(r, key, label, all, fixed){
    var idx = all.map(function(x, i){ return i; });
    if(!fixed) idx = M.shuffle(r, idx);
    return step(key, label, { kind: 'choice', fixed: !!fixed, options: idx.map(function(i){ return all[i].o; }), why: idx.map(function(i){ return all[i].w; }), correct: idx.map(function(i){ return all[i].ok ? 1 : 0; }).indexOf(1) });
  }
  function dpFor(v){ var a = Math.abs(v); return a >= 100 ? 1 : a >= 10 ? 2 : a >= 1 ? 2 : 3; }
  function f(v, d){ return M.fixed(v, d).replace(/^-/, '−'); }
  function eq(c, a, b, da, db){ return 'ŷ = ' + f(a, da) + (b < 0 ? ' − ' : ' + ') + M.fixed(Math.abs(b), db) + 'x'; }
  function uy(c, v){ return v + ' ' + c.y.unit; }
  function ux(c, v){ return v + ' ' + (Math.abs(+v - 1) < 1e-12 && c.x.one ? c.x.one : c.x.unit); }
  function figure(d, c, o){ var g = { xs: d.xs.slice(), ys: d.ys.slice(), x: c.x, y: c.y }; for(var k in (o || {})) g[k] = o[k]; return g; }
  /* The data table, in blocks of 6 points so it fits a phone without scrolling. */
  function table(d, c){
    var out = '', k;
    for(k = 0; k < d.xs.length; k += 6){
      var xs = d.xs.slice(k, k + 6), ys = d.ys.slice(k, k + 6);
      out += '<table class="rl-data">' + (k ? '' : '<caption>' + c.caption + '</caption>') + '<tbody><tr><th scope="row">' + c.x.name + ' (' + c.x.unit + ')</th>' + xs.map(function(v){ return '<td>' + M.fixed(v, c.x.dp || 0) + '</td>'; }).join('') +
        '</tr><tr><th scope="row">' + c.y.name + ' (' + c.y.unit + ')</th>' + ys.map(function(v){ return '<td>' + M.fixed(v, c.y.dp || 0) + '</td>'; }).join('') + '</tr></tbody></table>';
    }
    return out;
  }


  function gDescribe(r, c){
    var sign = c.slope[0] < 0 ? -1 : 1, band = r.pick(['strong', 'moderate', 'weak']), curved = r() < 0.3 && band !== 'weak';
    var L = line(r, c, sign), noise = L.span * ({ strong: 0.06, moderate: 0.2, weak: 0.5 })[band];
    var d = dataUntil(r, c, { a: L.a, b: L.b, noise: noise, curve: curved ? L.span * 0.45 : 0, n: r.int(12, 16) }, function(F, xs){
      var k = Math.abs(curvature(xs, F.residuals)), ar = Math.abs(F.r);
      if(F.r * sign <= 0) return false;
      if(curved ? k < 0.75 : k > 0.35) return false;
      return band === 'strong' ? ar >= 0.88 : band === 'moderate' ? ar >= 0.56 && ar <= 0.72 : ar >= 0.15 && ar <= 0.38;
    });
    var F = fit(d.xs, d.ys), dir = direction(F.r), st = strength(F.r);
    var text = '<p>' + c.lead + ' The scatterplot shows ' + c.y.name + ' against ' + c.x.name + ' for ' + d.xs.length + ' ' + c.noun + '.</p>';
    var steps = [
      choice(r, 'dir', 'What is the direction of the association?', [
        { o: 'Positive', ok: dir === 'positive', w: dir === 'positive' ? 'Right: as ' + c.x.name + ' increases, ' + c.y.name + ' tends to increase (r = ' + f(F.r, 2) + ').' : 'As ' + c.x.name + ' increases, ' + c.y.name + ' tends to decrease, so the association is negative (r = ' + f(F.r, 2) + ').' },
        { o: 'Negative', ok: dir === 'negative', w: dir === 'negative' ? 'Right: as ' + c.x.name + ' increases, ' + c.y.name + ' tends to decrease (r = ' + f(F.r, 2) + ').' : 'As ' + c.x.name + ' increases, ' + c.y.name + ' tends to increase, so the association is positive (r = ' + f(F.r, 2) + ').' }], true),
      choice(r, 'form', 'What is the form?', [
        { o: 'Linear', ok: !curved, w: !curved ? 'Right: the points follow a straight band; the residuals show no bend.' : 'The points bend: the residuals are ' + (curvature(d.xs, F.residuals) > 0 ? 'positive at both ends and negative in the middle' : 'negative at both ends and positive in the middle') + '.' },
        { o: 'Curved (nonlinear)', ok: curved, w: curved ? 'Right: the points bend away from a straight line at the ends.' : 'The points follow a straight band; nothing bends.' }], true),
      choice(r, 'str', 'How strong is it?', [
        { o: 'Strong', ok: st === 'strong', w: 'Here r = ' + f(F.r, 2) + '. ' + (st === 'strong' ? 'The points sit close to a line.' : 'The points are more scattered than a strong association.') },
        { o: 'Moderate', ok: st === 'moderate', w: 'Here r = ' + f(F.r, 2) + '. ' + (st === 'moderate' ? 'A clear trend with visible scatter.' : st === 'strong' ? 'The points sit closer to a line than that.' : 'The trend is weaker than that.') },
        { o: 'Weak', ok: st === 'weak', w: 'Here r = ' + f(F.r, 2) + '. ' + (st === 'weak' ? 'A trend is hard to see through the scatter.' : 'The trend is clearer than that.') }], true)
    ];
    var sol = [
      'Direction: ' + dir + ' (as ' + c.x.name + ' increases, ' + c.y.name + ' tends to ' + (dir === 'positive' ? 'increase' : 'decrease') + ').',
      'Form: ' + (curved ? 'curved; a residual plot of the least-squares line shows a clear bend.' : 'linear.'),
      'Strength: ' + st + ', r = ' + f(F.r, 2) + '. ' + RULES.strength,
      'In context: there is a ' + st + ', ' + dir + ', ' + (curved ? 'curved' : 'linear') + ' association between ' + c.x.name + ' and ' + c.y.name + ' for these ' + c.noun + '.'
    ];
    return { type: 'describe', text: text, steps: steps, solution: sol, data: { xs: d.xs, ys: d.ys, curved: curved, band: band }, figure: figure(d, c, { reveal: { str: 'line' } }) };
  }

  function gCorrelation(r, c){
    var sign = c.slope[0] < 0 ? -1 : 1, band = r.pick(['strong', 'moderate']);
    var L = line(r, c, sign), noise = L.span * (band === 'strong' ? 0.07 : 0.2);
    var d = dataUntil(r, c, { a: L.a, b: L.b, noise: noise, n: r.int(12, 16) }, function(F, xs){
      var ar = Math.abs(F.r);
      return F.r * sign > 0 && Math.abs(curvature(xs, F.residuals)) < 0.35 && (band === 'strong' ? ar >= 0.88 && ar <= 0.97 : ar >= 0.56 && ar <= 0.72);
    });
    var F = fit(d.xs, d.ys), rr = M.round(F.r, 2), ar = Math.abs(rr), sg = rr < 0 ? -1 : 1;
    var weak = M.round(sg * (band === 'strong' ? 0.35 : 0.15), 2), strongish = M.round(sg * (band === 'strong' ? 0.62 : 0.95), 2);
    var opts = [
      { o: 'r = ' + f(rr, 2), ok: true, w: 'Right: r = ' + f(F.r, 2) + ' from the data. ' + (rr > 0 ? 'Positive' : 'Negative') + ' and ' + strength(F.r) + '.' },
      { o: 'r = ' + f(-rr, 2), ok: false, w: 'The sign is wrong: the points ' + (rr > 0 ? 'rise' : 'fall') + ' from left to right, so r is ' + (rr > 0 ? 'positive' : 'negative') + '.' },
      { o: 'r = ' + f(weak, 2), ok: false, w: 'Too weak: the points sit ' + (band === 'strong' ? 'close to' : 'fairly near') + ' a line. The data give r = ' + f(F.r, 2) + '.' },
      { o: 'r = ' + f(strongish, 2), ok: false, w: (band === 'strong' ? 'Too weak for points this close to a line' : 'Too strong: the points scatter visibly around the line') + '. The data give r = ' + f(F.r, 2) + '.' }
    ];
    var alt = c.x.alt || { unit: 'other units', factor: 2 };
    var steps = [
      choice(r, 'pickr', 'Which value is the correlation for these data?', opts),
      choice(r, 'rmeans', 'What does r measure here?', [
        { o: 'The direction and strength of the linear association between ' + c.x.name + ' and ' + c.y.name + '.', ok: true, w: 'Right: r describes a linear association only, from −1 to 1.' },
        { o: 'About ' + Math.round(ar * 100) + '% of ' + c.y.name + ' is explained by ' + c.x.name + '.', ok: false, w: 'That mixes up r with r². And r² is about variation in ' + c.y.name + ', not ' + c.y.name + ' itself.' },
        { o: 'How much ' + c.y.name + ' changes ' + c.x.per.charAt(0).toLowerCase() + c.x.per.slice(1) + '.', ok: false, w: 'That is the slope, b, which has units. The correlation r has no units.' },
        { o: 'That a change in ' + c.x.name + ' causes a change in ' + c.y.name + '.', ok: false, w: 'Correlation is not causation. Only a randomized experiment supports a cause and effect conclusion.' }]),
      choice(r, 'units', 'If ' + c.x.name + ' were measured in ' + alt.unit + ' instead, what would happen to r?', [
        { o: 'It would stay ' + f(F.r, 2) + '.', ok: true, w: 'Right: r has no units, so changing the units of x (or y) does not change it.' },
        { o: 'It would be multiplied by ' + alt.factor + '.', ok: false, w: 'The slope would change; r would not. r is computed from standardized values, so units cancel.' },
        { o: 'It would change sign.', ok: false, w: 'A change of units keeps the order of the values, so the direction (and r) stays the same.' }])
    ];
    var sol = [
      'From the data, r = ' + f(F.r, 3) + ': a ' + strength(F.r) + ', ' + direction(F.r) + ' linear association.',
      'r measures the direction and strength of a linear association; it has no units and is always between −1 and 1.',
      'Changing units changes the slope but not r.'
    ];
    return { type: 'correlation', text: '<p>' + c.lead + ' The scatterplot shows ' + c.y.name + ' against ' + c.x.name + ' for ' + d.xs.length + ' ' + c.noun + '.</p>', steps: steps, solution: sol, data: { xs: d.xs, ys: d.ys }, figure: figure(d, c, { reveal: { pickr: 'line' } }) };
  }

  /* An equation printed as computer output would show it: a and b rounded,
     and the keys computed from those printed numbers. */
  function printed(F){ var da = dpFor(F.a), db = dpFor(F.b); return { a: M.round(F.a, da), b: M.round(F.b, db), da: da, db: db }; }

  function gPredict(r, c){
    var L = line(r, c), d = dataUntil(r, c, { a: L.a, b: L.b, noise: L.span * 0.1 }, function(F, xs){ return Math.abs(F.r) >= 0.8 && Math.abs(curvature(xs, F.residuals)) < 0.4; });
    var F = fit(d.xs, d.ys), P = printed(F), xmin = d.xs[0], xmax = d.xs[d.xs.length - 1];
    var x0 = M.round(xmin + (xmax - xmin) * r.between(0.2, 0.8, 2), c.x.dp || 0), yhat = P.a + P.b * x0;
    var far = M.round(xmax + (xmax - xmin) * r.between(1.5, 3, 2), c.x.dp || 0);
    var up = P.b > 0, bs = M.fixed(Math.abs(P.b), P.db), dy = dpFor(yhat);
    var text = '<p>' + c.lead + ' For ' + d.xs.length + ' ' + c.noun + ', the least-squares regression line is <b>' + eq(c, P.a, P.b, P.da, P.db) + '</b>, where x is ' + c.x.name + ' (' + c.x.unit + ') and ŷ is the predicted ' + c.y.name + ' (' + c.y.unit + ').</p>';
    var steps = [
      num('yhat', 'The predicted ' + c.y.name + ' for x = ' + ux(c, M.fixed(x0, c.x.dp || 0)), yhat, dy, [
        { value: P.b + P.a * x0, why: 'The slope multiplies x: ŷ = a + b x = ' + f(P.a, P.da) + ' + (' + f(P.b, P.db) + ')(' + M.fixed(x0, c.x.dp || 0) + ').' },
        { value: P.b * x0, why: 'Add the intercept ' + f(P.a, P.da) + ' too.' }], { unit: c.y.unit }),
      choice(r, 'who', 'The slope sentence starts “' + c.x.per + ', …”. What changes?', [
        { o: 'the predicted ' + c.y.name, ok: true, w: 'Right: the line predicts; individual ' + c.noun + ' vary around it. Say “predicted”.' },
        { o: 'the ' + c.y.name, ok: false, w: 'The actual ' + c.y.name + ' of a single one varies around the line. The slope describes the predicted value: say “the predicted ' + c.y.name + '”.' },
        { o: 'the ' + c.x.name, ok: false, w: 'x is what changes by one unit; the slope tells how the predicted y responds.' }], true),
      choice(r, 'how', '… the predicted ' + c.y.name + ' …', [
        { o: (up ? 'increases' : 'decreases') + ' by about ' + bs + ' ' + c.y.unit + '.', ok: true, w: 'Right: the slope is ' + f(P.b, P.db) + ' ' + c.y.unit + ' per ' + c.x.one + '.' },
        { o: (up ? 'decreases' : 'increases') + ' by about ' + bs + ' ' + c.y.unit + '.', ok: false, w: 'The slope is ' + (up ? 'positive' : 'negative') + ', so the predicted value ' + (up ? 'increases' : 'decreases') + '.' },
        { o: (up ? 'increases' : 'decreases') + ' by about ' + bs + ' ' + c.x.unit + '.', ok: false, w: 'The slope is in ' + c.y.unit + ' (y) per ' + c.x.one + ' (x): the change is in ' + c.y.unit + '.' },
        { o: 'is ' + f(P.a, P.da) + ' ' + c.y.unit + '.', ok: false, w: 'That is the intercept, the predicted value at x = 0. The slope is the change per ' + c.x.one + '.' }]),
      choice(r, 'extrap', 'Should we use the line to predict ' + c.y.name + ' for x = ' + ux(c, M.fixed(far, c.x.dp || 0)) + '?', [
        { o: 'No: ' + M.fixed(far, c.x.dp || 0) + ' is far outside the x values in the data (' + M.fixed(xmin, c.x.dp || 0) + ' to ' + M.fixed(xmax, c.x.dp || 0) + '), so the prediction is an extrapolation.', ok: true, w: 'Right: the linear pattern may not continue beyond the data.' },
        { o: 'Yes: the association is strong, so the line works for any x.', ok: false, w: 'A strong r describes the data we have; it says nothing about x values outside them. That is extrapolation.' },
        { o: 'Yes, because the slope is ' + (up ? 'positive' : 'negative') + '.', ok: false, w: 'The sign of the slope does not make a prediction outside the data trustworthy.' }])
    ];
    var sol = [
      'ŷ = ' + f(P.a, P.da) + ' + (' + f(P.b, P.db) + ')(' + M.fixed(x0, c.x.dp || 0) + ') = ' + f(yhat, dy) + ' ' + c.y.unit + '.',
      'Slope: ' + c.x.per.charAt(0).toLowerCase() + c.x.per.slice(1) + ', the predicted ' + c.y.name + ' ' + (up ? 'increases' : 'decreases') + ' by about ' + bs + ' ' + c.y.unit + '.',
      'x = ' + M.fixed(far, c.x.dp || 0) + ' is outside ' + M.fixed(xmin, c.x.dp || 0) + ' to ' + M.fixed(xmax, c.x.dp || 0) + ': predicting there is extrapolation.'
    ];
    return { type: 'predict', text: text, steps: steps, solution: sol, data: { xs: d.xs, ys: d.ys, a: P.a, b: P.b, x0: x0, far: far }, figure: figure(d, c, { line: P, at: x0, reveal: { yhat: 'at', extrap: 'far' }, far: far }) };
  }

  function gResidual(r, c){
    var curved = r() < 0.35, L = line(r, c);
    var d = dataUntil(r, c, { a: L.a, b: L.b, noise: L.span * 0.09, curve: curved ? L.span * 0.5 : 0, n: r.int(9, 12) }, function(F, xs){
      var k = Math.abs(curvature(xs, F.residuals));
      return Math.abs(F.r) >= 0.6 && (curved ? k >= 0.75 : k <= 0.35) && F.residuals.some(function(e){ return Math.abs(e) > 0.3 * F.s; });
    });
    var F = fit(d.xs, d.ys), P = printed(F);
    var cand = d.xs.map(function(x, i){ return i; }).filter(function(i){ return Math.abs(d.ys[i] - (P.a + P.b * d.xs[i])) > 0.3 * F.s; });
    var i = r.pick(cand.length ? cand : [0]), xi = d.xs[i], yi = d.ys[i], yh = P.a + P.b * xi, e = yi - yh, dy = Math.max(dpFor(yh), 2);
    var text = '<p>' + c.lead + ' The table gives ' + c.x.name + ' and ' + c.y.name + ' for ' + d.xs.length + ' ' + c.noun + '. The least-squares regression line is <b>' + eq(c, P.a, P.b, P.da, P.db) + '</b>.</p>' + table(d, c);
    var es = M.fixed(Math.abs(e), dy);
    var steps = [
      num('resid', 'The residual for x = ' + ux(c, M.fixed(xi, c.x.dp || 0)) + ' (actual ' + c.y.name + ' ' + uy(c, M.fixed(yi, c.y.dp || 0)) + ')', e, dy, [
        { value: -e, why: 'A residual is actual minus predicted: y − ŷ = ' + M.fixed(yi, c.y.dp || 0) + ' − ' + f(yh, dy) + '.' },
        { value: yh, why: 'That is the predicted value ŷ. The residual is the actual value minus it.' }], { unit: c.y.unit }),
      choice(r, 'rsign', 'What does this residual mean?', [
        { o: 'The actual ' + c.y.name + ' is ' + es + ' ' + c.y.unit + ' ' + (e > 0 ? 'above' : 'below') + ' the value the line predicts.', ok: true, w: 'Right: a ' + (e > 0 ? 'positive' : 'negative') + ' residual means the point is ' + (e > 0 ? 'above' : 'below') + ' the line.' },
        { o: 'The actual ' + c.y.name + ' is ' + es + ' ' + c.y.unit + ' ' + (e > 0 ? 'below' : 'above') + ' the value the line predicts.', ok: false, w: 'Residual = actual − predicted. It is ' + (e > 0 ? 'positive' : 'negative') + ', so the actual value is ' + (e > 0 ? 'above' : 'below') + ' the line.' },
        { o: 'The line predicts ' + c.y.name + ' ' + es + ' ' + c.y.unit + ' too ' + (e > 0 ? 'high' : 'low') + '.', ok: false, w: 'The other way round: a ' + (e > 0 ? 'positive' : 'negative') + ' residual means the prediction is too ' + (e > 0 ? 'low' : 'high') + '.' }]),
      choice(r, 'plot', 'The residual plot is drawn on the stage. Is a linear model appropriate?', [
        { o: 'Yes: the residuals scatter randomly around 0 with no pattern.', ok: !curved, w: !curved ? 'Right: no curve, no fan, just scatter.' : 'There is a pattern: the residuals are ' + (curvature(d.xs, F.residuals) > 0 ? 'positive at both ends and negative in the middle' : 'negative at both ends and positive in the middle') + '.' },
        { o: 'No: the residuals show a curved pattern, so a line misses the form.', ok: curved, w: curved ? 'Right: the residuals curve, so the data are not linear.' : 'The residuals show no curve: they scatter randomly around 0.' },
        { o: 'Yes, because r is ' + f(F.r, 2) + '.', ok: false, w: 'A large |r| does not show that a line is the right form. Check the residual plot for a pattern.' }])
    ];
    var sol = [
      'ŷ = ' + f(P.a, P.da) + ' + (' + f(P.b, P.db) + ')(' + M.fixed(xi, c.x.dp || 0) + ') = ' + f(yh, dy) + '.',
      'Residual = y − ŷ = ' + M.fixed(yi, c.y.dp || 0) + ' − ' + f(yh, dy) + ' = ' + f(e, dy) + ' ' + c.y.unit + '.',
      'The residual plot ' + (curved ? 'curves, so a linear model is not appropriate.' : 'shows random scatter around 0, so a linear model is appropriate.')
    ];
    return { type: 'residual', text: text, steps: steps, solution: sol, data: { xs: d.xs, ys: d.ys, a: P.a, b: P.b, i: i, curved: curved }, figure: figure(d, c, { line: P, sel: i, residPlot: true, reveal: { resid: 'seg', rsign: 'resid' } }) };
  }

  function gLsrl(r, c){
    var L = line(r, c), d = dataUntil(r, c, { a: L.a, b: L.b, noise: L.span * 0.12, n: r.int(10, 16) }, function(F, xs){ return Math.abs(F.r) >= 0.65 && Math.abs(F.r) <= 0.97 && Math.abs(curvature(xs, F.residuals)) < 0.4; });
    var F = fit(d.xs, d.ys);
    var sh = { xbar: M.round(F.xbar, 2), ybar: M.round(F.ybar, 2), sx: M.round(F.sx, 2), sy: M.round(F.sy, 2), r: M.round(F.r, 3), s: M.round(F.s, 2), r2: F.r2 };
    var b = sh.r * sh.sy / sh.sx, db = dpFor(b), a = sh.ybar - b * sh.xbar, da = dpFor(a);
    var aAbs = Math.pow(10, -da) * 0.6 + Math.abs(sh.xbar) * 0.5 * Math.pow(10, -db);
    var pct = Math.round(sh.r * sh.r * 100);
    var text = '<p>' + c.lead + ' For ' + d.xs.length + ' ' + c.noun + ', x = ' + c.x.name + ' (' + c.x.unit + ') and y = ' + c.y.name + ' (' + c.y.unit + ') have</p>' +
      '<p class="rl-sum">x̄ = ' + f(sh.xbar, 2) + ', s<sub>x</sub> = ' + f(sh.sx, 2) + ', ȳ = ' + f(sh.ybar, 2) + ', s<sub>y</sub> = ' + f(sh.sy, 2) + ', r = ' + f(sh.r, 3) + '.</p>';
    var steps = [
      num('b', 'The slope, b = r · s<sub>y</sub> / s<sub>x</sub>', b, db, [
        { value: sh.r * sh.sx / sh.sy, why: 'The ratio is upside down: b = r · s<sub>y</sub> ÷ s<sub>x</sub> (y over x, as rise over run).' },
        { value: sh.sy / sh.sx, why: 'Multiply by r too: b = r · s<sub>y</sub> ÷ s<sub>x</sub>.' },
        { value: sh.r, why: 'r is only the slope when both variables are in standard units. Multiply by s<sub>y</sub> ÷ s<sub>x</sub>.' }], { hint: 'The formula is on the AP® reference sheet.' }),
      num('a', 'The intercept, a = ȳ − b x̄', a, da, [
        { value: sh.ybar + b * sh.xbar, why: 'Subtract: a = ȳ − b x̄. The line passes through (x̄, ȳ).' },
        { value: sh.xbar - b * sh.ybar, why: 'x̄ and ȳ are swapped: a = ȳ − b x̄.' }], { abs: aAbs }),
      choice(r, 'r2', 'r² = ' + f(sh.r * sh.r, 3) + '. Which sentence interprets it?', [
        { o: 'About ' + pct + '% of the variation in ' + c.y.name + ' is accounted for by the linear model using ' + c.x.name + '.', ok: true, w: 'Right: r² is the share of the variation in y that the line accounts for.' },
        { o: 'About ' + pct + '% of the predictions of ' + c.y.name + ' are correct.', ok: false, w: 'r² is not a hit rate: it measures the variation in y accounted for by the line.' },
        { o: 'About ' + pct + '% of the variation in ' + c.x.name + ' is accounted for by ' + c.y.name + '.', ok: false, w: 'Backwards: r² is about the response, the variation in ' + c.y.name + '.' },
        { o: 'The association is ' + pct + '% linear.', ok: false, w: 'r² does not measure how linear the pattern is; a curved pattern can have a large r². It is the share of the variation in y.' }]),
      choice(r, 's', 'The output also gives s = ' + f(sh.s, 2) + '. What does it mean?', [
        { o: 'The actual ' + c.y.name + ' values typically differ from the predicted values by about ' + f(sh.s, 2) + ' ' + c.y.unit + '.', ok: true, w: 'Right: s is the typical size of a residual, in the units of y.' },
        { o: 'The ' + c.y.name + ' values typically differ from the mean ' + c.y.name + ' by about ' + f(sh.s, 2) + ' ' + c.y.unit + '.', ok: false, w: 'That is s<sub>y</sub> (here ' + f(sh.sy, 2) + '). s measures distance from the line, not from ȳ.' },
        { o: 'The slope could be off by about ' + f(sh.s, 2) + '.', ok: false, w: 's is about predictions of y, not about the slope.' },
        { o: 'The predictions are wrong about ' + f(sh.s, 2) + '% of the time.', ok: false, w: 's has the units of y (' + c.y.unit + '); it is not a percent.' }])
    ];
    var sol = [
      'b = r · s_y ÷ s_x = ' + f(sh.r, 3) + ' × ' + f(sh.sy, 2) + ' ÷ ' + f(sh.sx, 2) + ' = ' + f(b, db) + '.',
      'a = ȳ − b x̄ = ' + f(sh.ybar, 2) + ' − (' + f(b, db) + ')(' + f(sh.xbar, 2) + ') = ' + f(a, da) + '.',
      'So ŷ = ' + f(a, da) + (b < 0 ? ' − ' : ' + ') + M.fixed(Math.abs(b), db) + 'x. The line passes through (x̄, ȳ).',
      'r² = ' + f(sh.r * sh.r, 3) + ': about ' + pct + '% of the variation in ' + c.y.name + ' is accounted for by the line. s = ' + f(sh.s, 2) + ' ' + c.y.unit + ' is the typical prediction error.'
    ];
    return { type: 'lsrl', text: text, steps: steps, solution: sol, data: { xs: d.xs, ys: d.ys, shown: sh }, figure: figure(d, c, { reveal: { a: 'line' }, line: { a: a, b: b } }) };
  }

  var GEN = { describe: gDescribe, correlation: gCorrelation, predict: gPredict, residual: gResidual, lsrl: gLsrl };
  function generate(r, ctx, type){
    var types = (ctx.types || ['predict']).filter(function(t){ return GEN[t]; });
    var t = type && types.indexOf(type) > -1 ? type : r.pick(types);
    var p = GEN[t](r, ctx);
    p.ctx = ctx.id; p.topic = ctx.topic || TOPIC[t]; p.type = t;
    return p;
  }

  M.register('regressionLab', {
    fit: fit, sse: sse, point: point, curvature: curvature, strength: strength, direction: direction, corr: corr,
    RULES: RULES, TYPES: TYPES, TOPIC: TOPIC, makeData: makeData, printed: printed, dpFor: dpFor,
    generate: generate
  });
})();
