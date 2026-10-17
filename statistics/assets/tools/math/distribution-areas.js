/* Distribution areas model: ApStatMath.distributionAreas (docs/apstat-architecture.md, "Tools").
   OWNED BY THIS TOOL ONLY: no other tool edits this file, and this tool edits
   no shared file. Pure functions, no DOM, so the validator
   (scripts/lib/apstat-tool-checks/distribution-areas.mjs) and the test
   (scripts/test/apstat-tool-distribution-areas.test.mjs) run exactly this code.

   Every probability comes from ApStatDist (normCdf, invNorm, binomPmf,
   binomCdf, tableRoute); simulations use the seeded generator.

   Explore
     normal(mu, sd, mode, a, b)  P(X < b), P(X > a) or P(a < X < b) for mode
                                 'less' | 'greater' | 'between':
                                 { p, za, zb, pTable } (pTable: z to two places, Table A)
     inverse(mu, sd, area, side) the boundary with that area to the left
                                 (side 'left') or right: { z, x }
     binom(n, p, rel, k, k2)     rel 'atMost' (X ≤ k), 'fewer' (X < k), 'exactly',
                                 'atLeast' (X ≥ k), 'more' (X > k), 'between'
                                 (k ≤ X ≤ k2): { p, lo, hi, sym, words, mean, sd }
     empirical(k1, k2)           the 68-95-99.7 rule's percent between
                                 μ + k1σ and μ + k2σ (k whole numbers, -3..3)
   Test yourself
     generate(rng, context, type) -> { ctx, topic, type, text, steps, solution, data, fig }
       types: normal (an area), inverse (a boundary from an area), binomial
              (words to an inequality, then the probability, mean and SD),
              empirical (the rule, then the exact normal area)
     Text uses $...$ TeX; the page renders it (ApStatTex). */
(function(){
  'use strict';
  var M = window.ApStatMath;
  if(!M) return;
  function D(){ return M.Dist(); }
  function F(x, d){ return M.fixed(x, d == null ? 2 : d); }
  function N(x, d){ var s = F(x, d); return s.charAt(0) === '-' ? '−' + s.slice(1) : s; }
  function P4(p){ return p < 0.00005 ? '0.0000' : F(p, 4); }
  function T(x){ return x < 0 ? '{-' + Math.abs(x) + '}' : String(x); } // a negative number in TeX
  function texN(x, d){ var s = F(x, d); return s.charAt(0) === '-' ? '{-' + s.slice(1) + '}' : s; }

  /* ------------------------------------------------------------ explore */
  function normal(mu, sd, mode, a, b){
    var Dd = D(), za = (a - mu) / sd, zb = (b - mu) / sd, p, pt, ta = Dd.tableRoute('normal', za), tb = Dd.tableRoute('normal', zb);
    if(mode === 'less'){ p = Dd.normCdf(zb); pt = tb; }
    else if(mode === 'greater'){ p = 1 - Dd.normCdf(za); pt = 1 - ta; }
    else { p = Dd.normCdf(zb) - Dd.normCdf(za); pt = tb - ta; }
    return { p: p, za: za, zb: zb, pTable: pt };
  }
  function inverse(mu, sd, area, side){
    var z = D().invNorm(side === 'right' ? 1 - area : area);
    return { z: z, x: mu + z * sd };
  }
  var REL = {
    atMost: { sym: '\\le', words: 'at most' }, fewer: { sym: '<', words: 'fewer than' }, exactly: { sym: '=', words: 'exactly' },
    atLeast: { sym: '\\ge', words: 'at least' }, more: { sym: '>', words: 'more than' }, between: { sym: '', words: 'between' }
  };
  function binom(n, p, rel, k, k2){
    var Dd = D(), lo, hi;
    if(rel === 'atMost'){ lo = 0; hi = k; }
    else if(rel === 'fewer'){ lo = 0; hi = k - 1; }
    else if(rel === 'exactly'){ lo = k; hi = k; }
    else if(rel === 'atLeast'){ lo = k; hi = n; }
    else if(rel === 'more'){ lo = k + 1; hi = n; }
    else { lo = Math.min(k, k2); hi = Math.max(k, k2); }
    lo = Math.max(0, lo); hi = Math.min(n, hi);
    var pr = 0;
    if(hi >= lo){ pr = Dd.binomCdf(hi, n, p) - (lo > 0 ? Dd.binomCdf(lo - 1, n, p) : 0); if(pr < 0) pr = 0; }
    return { p: pr, lo: lo, hi: hi, mean: n * p, sd: Math.sqrt(n * p * (1 - p)), sym: rel === 'between' ? '' : REL[rel].sym, words: REL[rel].words };
  }
  var EMP = { 1: 68, 2: 95, 3: 99.7 };
  function halfBand(k){ return k === 0 ? 0 : EMP[Math.abs(k)] / 2 * Math.sign(k); }
  function empirical(k1, k2){ return Math.round((halfBand(k2) - halfBand(k1)) * 100) / 100; }
  function simulateNormal(r, mu, sd, a, b, reps){
    var c = 0; for(var i = 0; i < reps; i++){ var x = M.normal(r, mu, sd); if(x > a && x < b) c++; } return c / reps;
  }
  function simulateBinom(r, n, p, reps){
    var counts = []; for(var k = 0; k <= n; k++) counts.push(0);
    for(var i = 0; i < reps; i++) counts[M.bernoulli(r, p, n)]++;
    return counts.map(function(c){ return c / reps; });
  }

  /* ------------------------------------------------------------ cells */
  function probCell(a, alt, ms){
    var rel = a < 0.1 ? 0.01 : 0, abs = a < 0.1 ? 0.00006 : 0.002;
    if(alt != null) abs = Math.max(abs, Math.abs(alt - a) - rel * a + 0.00006);
    return M.cell(a, rel, ms, abs);
  }
  function zCell(a, ms){ return M.cell(a, 0, ms, 0.02); }
  function critCell(a, ms){ return M.cell(a, 0, ms, 0.011); } // z* from Table A is read to two places
  function statCell(a, places, ms, extra){ return M.cell(a, 0.005, ms, 0.5 * Math.pow(10, -places) + (extra || 0)); }
  function choice(key, practice, label, opts, hint){
    var s = { key: key, kind: 'choice', practice: practice, label: label, options: opts.map(function(o){ return o.t; }), why: opts.map(function(o){ return o.why; }), correct: 0 };
    if(hint) s.hint = hint;
    return s;
  }

  /* ------------------------------------------------------------ normal area */
  // A boundary on the context's own grid, 0.2 to 2.6 SDs from the mean.
  function boundary(r, c, mu, sd, sign){
    var g = c.grid || 1, z = (0.2 + r() * 2.4) * sign, x = Math.round((mu + z * sd) / g) * g;
    return M.round(x, c.places || 0);
  }
  function genNormal(r, c){
    var mu = r.pick(c.mus), sd = r.pick(c.sds), mode = r.pick(['less', 'greater', 'between', 'greater', 'less']), a, b;
    var u = c.units ? ' ' + c.units : '', pl = c.places || 0;
    for(var g = 0; g < 100; g++){
      if(mode === 'less'){ b = boundary(r, c, mu, sd, r() < 0.5 ? -1 : 1); a = -Infinity; }
      else if(mode === 'greater'){ a = boundary(r, c, mu, sd, r() < 0.5 ? -1 : 1); b = Infinity; }
      else { a = boundary(r, c, mu, sd, -1); b = boundary(r, c, mu, sd, 1); }
      if(mode !== 'between' || b - a >= (c.grid || 1)) break;
    }
    var res = normal(mu, sd, mode, a, b), p = res.p;
    var Xa = F(a, pl), Xb = F(b, pl);
    var ask = mode === 'less' ? c.less.replace('{b}', Xb + u) : mode === 'greater' ? c.more.replace('{a}', Xa + u) : c.between.replace('{a}', Xa + u).replace('{b}', Xb + u);
    var ev = mode === 'less' ? 'X < ' + Xb : mode === 'greater' ? 'X > ' + Xa : Xa + ' < X < ' + Xb;
    var text = '<p>' + c.setup.replace('{mu}', F(mu, pl) + u).replace('{sd}', F(sd, pl + (sd < 1 ? 2 : 0)) + u) + '</p><p>' + ask + '</p>';
    var shade = choice('sketch', '3.A', 'Which region of the normal curve is the probability you want?', [
      { t: mode === 'less' ? 'The area to the left of ' + Xb : mode === 'greater' ? 'The area to the right of ' + Xa : 'The area between ' + Xa + ' and ' + Xb, why: 'Right: $P(' + ev + ')$ is that region under the curve.' },
      { t: mode === 'less' ? 'The area to the right of ' + Xb : mode === 'greater' ? 'The area to the left of ' + Xa : 'The area outside ' + Xa + ' and ' + Xb, why: 'That is the complement: the other side of the boundary. Read the direction words again.' },
      { t: 'The height of the curve at ' + (mode === 'greater' ? Xa : Xb), why: 'A probability for a continuous variable is an area, never the height of the curve.' }
    ]);
    shade.pics = { mu: mu, sd: sd, list: mode === 'between' ? ['between', 'outside', 'height'] : [mode, mode === 'less' ? 'greater' : 'less', 'height'], a: a, b: b };
    var steps = [shade];
    if(mode !== 'greater') steps.push({ key: mode === 'between' ? 'zb' : 'z', kind: 'num', practice: '3.B', d: 2, label: 'The z-score of ' + Xb + '.', hint: '$z = (x - \\mu)/\\sigma$',
      cell: zCell(res.zb, [{ value: (b - mu) / (sd * sd), why: 'That divides by the variance. Divide by the standard deviation σ = ' + F(sd, 2) + '.' }, { value: (mu - b) / sd, why: 'The order is $x - \\mu$: value minus mean, so values above the mean get positive z.' }]) });
    if(mode !== 'less') steps.splice(mode === 'between' ? 1 : 1, 0, { key: mode === 'between' ? 'za' : 'z', kind: 'num', practice: '3.B', d: 2, label: 'The z-score of ' + Xa + '.', hint: '$z = (x - \\mu)/\\sigma$',
      cell: zCell(res.za, [{ value: (a - mu) / (sd * sd), why: 'That divides by the variance. Divide by the standard deviation σ = ' + F(sd, 2) + '.' }, { value: (mu - a) / sd, why: 'The order is $x - \\mu$: value minus mean, so values below the mean get negative z.' }]) });
    var Dd = D(), pms = [];
    if(mode === 'less') pms.push({ value: 1 - p, why: 'That is the area to the right. "Less than" is the area to the left of the boundary.' });
    if(mode === 'greater') pms.push({ value: 1 - p, why: 'That is the area to the left, what Table A gives. "Greater than" is 1 minus that.' });
    if(mode === 'between'){ pms.push({ value: Dd.normCdf(res.zb) + Dd.normCdf(res.za), why: 'Subtract the two left areas: $P(Z < z_b) - P(Z < z_a)$.' }); pms.push({ value: Dd.normCdf(res.zb), why: 'That is everything below ' + Xb + '. Take away the area below ' + Xa + ' too.' }); }
    pms.push({ value: Dd.normPdf(mode === 'greater' ? res.za : res.zb), why: 'That is the height of the curve, not an area.' });
    steps.push({ key: 'p', kind: 'num', practice: '3.C', d: 4, label: 'The probability $P(' + ev + ')$.', cell: probCell(p, res.pTable, pms) });
    var good = 'X is normal with $\\mu = ' + F(mu, pl) + '$ and $\\sigma = ' + F(sd, pl + (sd < 1 ? 2 : 0)) + '$; $P(' + ev + ') = ' + P4(p) + '$.';
    steps.push(choice('work', '3.C', 'Which answer shows the work the exam asks for?', [
      { t: good, why: 'Right: it names the distribution and its parameters, the boundary and the direction, then gives the probability.' },
      { t: 'normalcdf(' + (mode === 'greater' ? Xa : mode === 'between' ? Xa : '−1E99') + ', ' + (mode === 'less' ? Xb : mode === 'between' ? Xb : '1E99') + ', ' + F(mu, pl) + ', ' + F(sd, pl + (sd < 1 ? 2 : 0)) + ') = ' + P4(p), why: 'Calculator syntax alone is not work: the reader wants the distribution, parameters, boundary and direction in standard notation or words.' },
      { t: 'The answer is ' + P4(p) + '.', why: 'The number alone earns little: show the distribution, its parameters, the boundary and the direction.' },
      { t: 'X is normal with $\\mu = ' + F(mu, pl) + '$ and $\\sigma = ' + F(sd, pl + (sd < 1 ? 2 : 0)) + '$, so the probability is ' + P4(p) + '.', why: 'This names the distribution but not the event: say which boundary and which direction, as in $P(' + ev + ')$.' }
    ]));
    var sol = ['$X$ is normal with $\\mu = ' + F(mu, pl) + '$ and $\\sigma = ' + F(sd, pl + (sd < 1 ? 2 : 0)) + '$; the event is $' + ev + '$, the area ' + (mode === 'less' ? 'to the left of ' + Xb : mode === 'greater' ? 'to the right of ' + Xa : 'between ' + Xa + ' and ' + Xb) + '.'];
    if(mode !== 'less') sol.push('$z = \\frac{' + Xa + ' - ' + F(mu, pl) + '}{' + F(sd, pl + (sd < 1 ? 2 : 0)) + '} = ' + texN(res.za, 2) + '$.');
    if(mode !== 'greater') sol.push('$z = \\frac{' + Xb + ' - ' + F(mu, pl) + '}{' + F(sd, pl + (sd < 1 ? 2 : 0)) + '} = ' + texN(res.zb, 2) + '$.');
    sol.push(mode === 'less' ? '$P(Z < ' + texN(res.zb, 2) + ') = ' + P4(p) + '$.' : mode === 'greater' ? '$P(Z > ' + texN(res.za, 2) + ') = 1 - ' + P4(Dd.normCdf(res.za)) + ' = ' + P4(p) + '$.' : '$P(' + texN(res.za, 2) + ' < Z < ' + texN(res.zb, 2) + ') = ' + P4(Dd.normCdf(res.zb)) + ' - ' + P4(Dd.normCdf(res.za)) + ' = ' + P4(p) + '$.');
    sol.push('Technology gives ' + P4(p) + '; Table A, with each z rounded to two places, gives ' + P4(res.pTable) + '. Both are accepted.');
    return { text: text, steps: steps, solution: sol, data: { mu: mu, sd: sd, mode: mode, a: a, b: b },
      fig: { kind: 'normal', mu: mu, sd: sd, mode: mode, a: a, b: b, label: c.axis } };
  }

  /* ------------------------------------------------------------ inverse */
  function genInverse(r, c){
    var mu = r.pick(c.mus), sd = r.pick(c.sds), pl = c.places || 0, u = c.units ? ' ' + c.units : '';
    var side = r() < 0.5 ? 'left' : 'right', pct = r.pick([1, 2, 5, 10, 15, 20, 25, 30, 75, 80, 90, 95]);
    if(side === 'right' && pct > 50) pct = 100 - pct;
    if(side === 'left' && pct === 50) pct = 40;
    var area = pct / 100, inv = inverse(mu, sd, area, side), z = inv.z, x = inv.x;
    var ask = side === 'left' ? c.low.replace('{pct}', pct + '%') : c.high.replace('{pct}', pct + '%');
    var text = '<p>' + c.setup.replace('{mu}', F(mu, pl) + u).replace('{sd}', F(sd, pl + (sd < 1 ? 2 : 0)) + u) + '</p><p>' + ask + '</p>';
    var zTab = M.round(z, 2), dx = 0.5 * Math.pow(10, -(pl + 1)) + Math.abs(zTab - z) * sd + 0.01 * sd;
    var steps = [
      { key: 'zstar', kind: 'num', practice: '3.B', d: 3, label: 'The z-score with ' + (side === 'left' ? 'an area of ' + F(area, 2) + ' to its left' : 'an area of ' + F(area, 2) + ' to its right') + '.', hint: side === 'right' ? 'Table A and the inverse normal give the area to the left: ' + F(1 - area, 2) + '.' : 'Use the inverse normal, or find ' + F(area, 2) + ' inside Table A.',
        cell: critCell(z, [{ value: -z, why: side === 'right' ? 'That z has ' + F(area, 2) + ' to its left. For the top ' + pct + '%, use an area of ' + F(1 - area, 2) + ' to the left.' : 'That z has ' + F(area, 2) + ' to its right. The bottom ' + pct + '% has ' + F(area, 2) + ' to the left.' }]) },
      { key: 'x', kind: 'num', practice: '3.B', d: pl + 1, unit: c.units || '', label: 'The value of ' + c.var + ' at that boundary.', hint: '$x = \\mu + z\\sigma$',
        cell: statCell(x, pl + 1, [{ value: mu - z * sd, why: 'The sign of z is lost: $x = \\mu + z\\sigma$, and z is ' + (z < 0 ? 'negative here (below the mean)' : 'positive here (above the mean)') + '.' }, { value: mu + z * sd * sd, why: 'That multiplies by the variance. Use $x = \\mu + z\\sigma$ with σ = ' + F(sd, 2) + '.' }], Math.abs(zTab - z) * sd + 0.006 * sd) }
    ];
    steps.push(choice('check', '4.C', 'Does the answer make sense?', [
      { t: (x > mu ? 'Yes: it is above the mean, as the ' : 'Yes: it is below the mean, as the ') + (side === 'right' ? 'top ' : 'bottom ') + pct + '% must be.', why: 'Right: a boundary for a small upper tail is above the mean, for a small lower tail below it.' },
      { t: 'No: a percentile is always above the mean.', why: 'Percentiles below 50% are below the mean of a normal distribution.' },
      { t: 'No: the boundary should equal the mean plus ' + pct + '.', why: 'A percent of the data is an area, not a distance on the scale: convert it with z.' }
    ]));
    var sol = [
      'The boundary has an area of ' + F(area, 2) + ' to its ' + side + (side === 'right' ? ', so ' + F(1 - area, 2) + ' to its left' : '') + '.',
      '$z = ' + texN(z, 3) + '$ (inverse normal; Table A gives ' + texN(zTab, 2) + ').',
      '$x = \\mu + z\\sigma = ' + F(mu, pl) + ' + (' + texN(z, 3) + ')(' + F(sd, pl + (sd < 1 ? 2 : 0)) + ') = ' + F(x, pl + 1) + '$' + u + '.'
    ];
    return { text: text, steps: steps, solution: sol, data: { mu: mu, sd: sd, area: area, side: side },
      fig: { kind: 'normal', mu: mu, sd: sd, mode: side === 'left' ? 'less' : 'greater', a: x, b: x, label: c.axis, hideX: true } };
  }

  /* ------------------------------------------------------------ binomial */
  var BREL = ['fewer', 'atMost', 'atLeast', 'more', 'exactly'];
  function relSym(rel, k){ return { atMost: 'X \\le ' + k, fewer: 'X < ' + k, exactly: 'X = ' + k, atLeast: 'X \\ge ' + k, more: 'X > ' + k }[rel]; }
  function genBinomial(r, c){
    var n = r.pick(c.ns), p = r.pick(c.ps), rel = r.pick(BREL), mean = n * p, sd = Math.sqrt(n * p * (1 - p));
    var k = Math.max(1, Math.min(n - 1, Math.round(mean + (r() * 2.4 - 1.2) * sd)));
    var b = binom(n, p, rel, k), Dd = D();
    var words = c.event.replace('{k}', b.words + ' ' + k);
    var text = '<p>' + c.setup.replace('{n}', n).replace('{p}', String(p)) + '</p><p>Let $X$ = ' + c.X + '. Find the probability that ' + words + '.</p>';
    var equiv = { fewer: 'X \\le ' + (k - 1), atMost: 'X \\le ' + k, atLeast: 'X \\ge ' + k, more: 'X \\ge ' + (k + 1), exactly: 'X = ' + k }[rel];
    var trans = [
      { t: '$P(' + equiv + ')$', why: 'Right: "' + b.words + ' ' + k + '" ' + (rel === 'fewer' ? 'leaves ' + k + ' out, so it is ' + (k - 1) + ' or fewer.' : rel === 'more' ? 'leaves ' + k + ' out, so it is ' + (k + 1) + ' or more.' : rel === 'atMost' ? 'includes ' + k + '.' : rel === 'atLeast' ? 'includes ' + k + '.' : 'is one count only.') }
    ];
    var wrongs = {
      fewer: [['X \\le ' + k, '"Fewer than ' + k + '" does not include ' + k + ': that is $X \\le ' + (k - 1) + '$. The reader report names this slip.'], ['X \\ge ' + k, 'Fewer means smaller counts, the left side.'], ['X = ' + (k - 1), 'Fewer than ' + k + ' is every count from 0 to ' + (k - 1) + ', not one count.']],
      atMost: [['X < ' + k, '"At most ' + k + '" includes ' + k + ': $X \\le ' + k + '$.'], ['X \\ge ' + k, 'At most means ' + k + ' or fewer, the left side.'], ['X = ' + k, 'At most is every count up to ' + k + ', not just ' + k + '.']],
      atLeast: [['X > ' + k, '"At least ' + k + '" includes ' + k + ': $X \\ge ' + k + '$.'], ['X \\le ' + k, 'At least means ' + k + ' or more, the right side.'], ['X = ' + k, 'At least is every count from ' + k + ' up, not just ' + k + '.']],
      more: [['X \\ge ' + k, '"More than ' + k + '" leaves ' + k + ' out: $X \\ge ' + (k + 1) + '$.'], ['X \\le ' + k, 'More means larger counts, the right side.'], ['X = ' + (k + 1), 'More than ' + k + ' is every count from ' + (k + 1) + ' to ' + n + ', not one count.']],
      exactly: [['X \\le ' + k, 'Exactly ' + k + ' is one count, not ' + k + ' or fewer.'], ['X \\ge ' + k, 'Exactly ' + k + ' is one count, not ' + k + ' or more.'], ['X < ' + k, 'Exactly ' + k + ' is the count ' + k + ' itself.']]
    }[rel];
    wrongs.forEach(function(w){ trans.push({ t: '$P(' + w[0] + ')$', why: w[1] }); });
    // Mistakes: the neighbouring inequality, the complement, one bar only.
    var nb = { fewer: binom(n, p, 'atMost', k).p, atMost: binom(n, p, 'fewer', k).p, atLeast: binom(n, p, 'more', k).p, more: binom(n, p, 'atLeast', k).p, exactly: binom(n, p, 'atMost', k).p }[rel];
    var pms = [{ value: nb, why: rel === 'exactly' ? 'That is $P(X \\le ' + k + ')$, every count up to ' + k + '. Exactly ' + k + ' is one bar.' : 'Off by one count: check whether ' + k + ' itself is included ("' + b.words + '").' }];
    pms.push({ value: 1 - b.p, why: 'That is the complement: the other side of ' + k + '.' });
    if(rel !== 'exactly') pms.push({ value: Dd.binomPmf(k, n, p), why: 'That is only $P(X = ' + k + ')$, one bar. Add every count in the event.' });
    var steps = [
      choice('event', '2.A', 'Which probability is "' + words + '"?', trans),
      { key: 'p', kind: 'num', practice: '3.C', d: 4, label: 'The probability, with $n = ' + n + '$ and $p = ' + p + '$.', hint: rel === 'atLeast' || rel === 'more' ? 'Technology gives $P(X \\le k)$; use $1 - P(X \\le ' + (b.lo - 1) + ')$.' : null, cell: probCell(b.p, null, pms) },
      { key: 'mean', kind: 'num', practice: '3.D', d: 2, label: 'The mean of $X$.', hint: '$\\mu_X = np$', cell: statCell(mean, 2, [{ value: p, why: 'That is p. The mean count is $np$.' }]) },
      { key: 'sd', kind: 'num', practice: '3.D', d: 3, label: 'The standard deviation of $X$.', hint: '$\\sigma_X = \\sqrt{np(1 - p)}$', cell: statCell(sd, 3, [{ value: n * p * (1 - p), why: 'That is the variance $np(1 - p)$. Take its square root.' }, { value: Math.sqrt(n * p), why: 'Include the factor $(1 - p)$: $\\sqrt{np(1 - p)}$.' }]) }
    ];
    if(!steps[1].hint) delete steps[1].hint;
    var sol = [
      '$X$ is binomial with $n = ' + n + '$ and $p = ' + p + '$ (fixed number of independent trials, two outcomes, the same probability each time).',
      '"' + b.words.charAt(0).toUpperCase() + b.words.slice(1) + ' ' + k + '" is $' + equiv + '$.',
      '$P(' + equiv + ') = ' + (b.lo === 0 ? 'P(X \\le ' + b.hi + ')' : b.hi === n ? '1 - P(X \\le ' + (b.lo - 1) + ')' : 'P(X = ' + k + ') = \\binom{' + n + '}{' + k + '}(' + p + ')^{' + k + '}(' + M.round(1 - p, 4) + ')^{' + (n - k) + '}') + ' = ' + P4(b.p) + '$.',
      '$\\mu_X = np = ' + n + '(' + p + ') = ' + F(mean, 2) + '$ and $\\sigma_X = \\sqrt{np(1 - p)} = \\sqrt{' + n + '(' + p + ')(' + M.round(1 - p, 4) + ')} = ' + F(sd, 3) + '$.'
    ];
    return { text: text, steps: steps, solution: sol, data: { n: n, p: p, rel: rel, k: k, lo: b.lo, hi: b.hi },
      fig: { kind: 'binom', n: n, p: p, lo: b.lo, hi: b.hi, label: c.axis } };
  }

  /* ------------------------------------------------------------ empirical rule */
  var BANDS = [[-1, 1], [-2, 2], [-3, 3], [-1, 2], [-2, 1], [0, 1], [0, 2], [-2, 0], [1, 3], [-3, -1], [1, 2], [-2, -1]];
  function genEmpirical(r, c){
    var mu = r.pick(c.mus), sd = r.pick(c.sds), pl = c.places || 0, u = c.units ? ' ' + c.units : '', bd = r.pick(BANDS);
    var a = M.round(mu + bd[0] * sd, pl + 2), b = M.round(mu + bd[1] * sd, pl + 2), pct = empirical(bd[0], bd[1]);
    var exact = D().normCdf(bd[1]) - D().normCdf(bd[0]);
    var text = '<p>' + c.setup.replace('{mu}', F(mu, pl) + u).replace('{sd}', F(sd, pl + (sd < 1 ? 2 : 0)) + u) + '</p><p>Use the empirical rule (68-95-99.7) to estimate the percent of ' + c.who + ' between ' + fmtV(a, pl) + u + ' and ' + fmtV(b, pl) + u + ', then compare it with the normal model.</p>';
    var kz = bd[1] !== 0 ? bd[1] : bd[0], vz = kz === bd[1] ? b : a;
    var steps = [
      { key: 'z', kind: 'num', practice: '3.B', d: 0, label: 'The z-score of ' + fmtV(vz, pl) + '.', hint: '$z = (x - \\mu)/\\sigma$', cell: M.cell(kz, 0, [{ value: -kz, why: 'The order is $x - \\mu$: values above the mean have positive z, values below negative.' }], 0.02) },
      { key: 'pct', kind: 'num', practice: '3.C', d: 1, unit: '%', label: 'By the empirical rule, about what percent of ' + c.who + ' are between ' + fmtV(a, pl) + ' and ' + fmtV(b, pl) + '?', hint: 'Half of 68% is 34%, half of 95% is 47.5%, half of 99.7% is 49.85%.',
        cell: M.cell(pct, 0, [{ value: pct === 68 ? 95 : 68, why: 'Count the standard deviations on each side of the mean: ' + bd[0] + ' to ' + bd[1] + '.' }, { value: pct * 2, why: 'Each side of the mean holds half of the band: 34% within one SD on one side, not 68%.' }].filter(function(m){ return m.value <= 100; }), 0.05) },
      { key: 'exact', kind: 'num', practice: '3.C', d: 4, label: 'The same area from the normal model (technology or Table A), as a probability.', cell: probCell(exact, D().tableRoute('normal', bd[1]) - D().tableRoute('normal', bd[0]), [{ value: pct / 100, why: 'That is the rounded empirical rule value. The normal model gives a slightly different area: compute it.' }]) }
    ];
    var sol = [
      '$z = ' + T(bd[0]) + '$ for ' + fmtV(a, pl) + ' and $z = ' + T(bd[1]) + '$ for ' + fmtV(b, pl) + ' (standard deviations from the mean).',
      'Empirical rule: ' + bandWords(bd) + ' = about ' + pct + '%.',
      'The normal model: $P(' + T(bd[0]) + ' < Z < ' + T(bd[1]) + ') = ' + P4(exact) + '$, close to the rule\'s ' + F(pct / 100, 4) + '. The rule is an approximation for distributions that are approximately normal.'
    ];
    return { text: text, steps: steps, solution: sol, data: { mu: mu, sd: sd, k1: bd[0], k2: bd[1], kz: kz },
      fig: { kind: 'normal', mu: mu, sd: sd, mode: 'between', a: a, b: b, label: c.axis, emp: true } };
  }
  function fmtV(v, pl){ return F(v, pl + (Math.abs(v * Math.pow(10, pl) - Math.round(v * Math.pow(10, pl))) > 1e-6 ? 1 : 0)); }
  function bandWords(bd){
    var parts = [];
    for(var k = bd[0]; k < bd[1]; k++) parts.push(k < 0 ? (k === -1 ? '34' : k === -2 ? '13.5' : '2.35') : (k === 0 ? '34' : k === 1 ? '13.5' : '2.35'));
    return parts.join('% + ') + '%';
  }

  var GEN = { normal: genNormal, inverse: genInverse, binomial: genBinomial, empirical: genEmpirical };
  function generate(r, ctx, type){
    var types = ctx.types || ['normal'];
    var t = type && types.indexOf(type) > -1 ? type : r.pick(types);
    var p = GEN[t](r, ctx);
    p.ctx = ctx.id; p.topic = ctx.topic; p.type = t;
    return p;
  }

  M.register('distributionAreas', {
    normal: normal, inverse: inverse, binom: binom, empirical: empirical, simulateNormal: simulateNormal, simulateBinom: simulateBinom,
    generate: generate, REL: REL, P4: P4
  });
})();
