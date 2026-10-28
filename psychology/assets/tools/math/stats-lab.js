/* Stats lab model: ApPsychMath.statsLab (docs/appsych-architecture.md, "Tools").
   OWNED BY THIS TOOL ONLY (docs/appsych-briefs/t3.md): no other tool edits this
   file, and this tool edits no shared file. Pure functions, no DOM, so the
   validator (scripts/lib/appsych-tool-checks/stats-lab.mjs) and the test
   (scripts/test/appsych-tool-stats-lab.test.mjs) run exactly this code.

   Every number a student sees comes from ApPsychStats (psy-stats.js) through
   a recipe { fn, args }: z scores, percentile ranks, the 68-95-99.7 shares,
   mean, median, mode, range, standard deviation and Pearson's r. The model
   only chooses the data (seeded, so a drill is reproducible).

     SCALES                 the explore scales (mean, SD) for the normal curve
     SETS                   the explore data sets for center and spread
     PAIRS                  the explore variable pairs for correlation
     pdf(x, mean, sd)       the normal curve's height (drawing only)
     normalAt(x, mean, sd)  { z, pct, whole, rule }: z, the exact percentile
                            (normal CDF), and, at a whole SD from -3 to 3, the
                            68-95-99.7 rule's percent below
     center(data)           { mean, median, mode, modes, range, sd, n, sum }
     corrPoints(r, n, seed, pair)
                            n points whose Pearson r is close to r (the shown r
                            is always recomputed from the rounded points)
     generate(rng, ctx, type) -> { ctx, topic, type, text, steps, solution,
                            given, figure } for the drills:
       rule      a score at a whole SD: its z, its percentile by the rule, and
                 what a percentile rank means
       between   the share between two whole-SD scores
       zcompare  two tests, two z scores: which is the better relative standing
       center    mean, median and range of a small data set by hand
       outlier   add an outlier: the new mean, the better center, the skew
       scatter   read r from a scatterplot, then correlation is not causation */
(function(G){
  'use strict';
  var M = G.ApPsychMath;
  if(!M) return;
  function S(){ return M.Stats(); }
  function E(fn, args){ return S().evaluate({ fn: fn, args: args }); }

  var SCALES = [
    { k: 'iq', name: 'Intelligence test', noun: 'score', mean: 100, sd: 15, min: 40, max: 160 },
    { k: 'entrance', name: 'College entrance test', noun: 'score', mean: 500, sd: 100, min: 150, max: 850 },
    { k: 'memory', name: 'Memory test (words recalled)', noun: 'words', mean: 40, sd: 6, min: 19, max: 61 }
  ];
  var SETS = [
    { k: 'texts', name: 'Texts sent in one hour', unit: 'texts', short: 'texts', values: [3, 4, 4, 5, 6, 6, 6, 8, 9], move: 7, lo: 0, hi: 30 },
    { k: 'sleep', name: 'Minutes to fall asleep', unit: 'min', short: 'minutes', values: [8, 10, 12, 12, 15, 15, 15, 18, 20], move: 14, lo: 0, hi: 50 },
    { k: 'recall', name: 'Words recalled (out of 20)', unit: 'words', short: 'words', values: [6, 8, 9, 10, 11, 11, 12, 13, 14], move: 11, lo: 0, hi: 20 }
  ];
  var PAIRS = [
    { k: 'study', x: 'Hours studied', y: 'Test score', xs: [1, 10], ys: [50, 100], xd: 0, yd: 0 },
    { k: 'screens', x: 'Screen time before bed (min)', y: 'Hours of sleep', xs: [0, 120], ys: [5, 9], xd: 0, yd: 1 },
    { k: 'shoe', x: 'Shoe size', y: 'Memory test score', xs: [6, 13], ys: [20, 40], xd: 1, yd: 0 }
  ];

  function pdf(x, mu, sd){ var z = (x - mu) / sd; return Math.exp(-z * z / 2) / (sd * Math.sqrt(2 * Math.PI)); }
  function isWhole(z){ return Math.abs(z - Math.round(z)) < 1e-9 && Math.abs(z) <= 3; }
  function normalAt(x, mu, sd){
    var z = E('z', [x, mu, sd]), whole = isWhole(z);
    return { z: z, pct: E('percentile', [x, mu, sd]), whole: whole, rule: whole ? E('percentileRule', [Math.round(z)]) : null };
  }
  function center(d){
    return { n: d.length, sum: E('sum', [d]), mean: E('mean', [d]), median: E('median', [d]), mode: E('mode', [d]), modes: S().modes(d),
      range: E('range', [d]), sd: E('sd', [d]), min: E('min', d), max: E('max', d) };
  }
  /* Points with a chosen correlation: x spread evenly (jittered), y built from
     the standardized x and a residual made orthogonal to it, so before
     rounding r is exactly the target; rounding moves it a little, and the
     page always shows ApPsychStats.r of the points it draws. */
  function corrPoints(target, n, seed, pair){
    var r = M.rng(seed || 1), p = pair || PAIRS[0];
    var xs = M.repeat(n, function(i){ return p.xs[0] + (p.xs[1] - p.xs[0]) * (i + 0.15 + 0.7 * r()) / n; });
    var e = M.repeat(n, function(){ return M.normal(r); });
    var mx = mean(xs), sx = Math.sqrt(xs.reduce(function(a, x){ return a + (x - mx) * (x - mx); }, 0) / n);
    var zx = xs.map(function(x){ return (x - mx) / sx; });
    var me = mean(e), ec = e.map(function(v){ return v - me; });
    var b = dot(ec, zx) / n; ec = ec.map(function(v, i){ return v - b * zx[i]; });
    var se = Math.sqrt(dot(ec, ec) / n) || 1, ze = ec.map(function(v){ return v / se; });
    var t = Math.max(-1, Math.min(1, target)), q = Math.sqrt(Math.max(0, 1 - t * t));
    var ymid = (p.ys[0] + p.ys[1]) / 2, ysd = (p.ys[1] - p.ys[0]) / 5.2;
    return xs.map(function(x, i){
      var y = ymid + ysd * (t * zx[i] + q * ze[i]);
      y = Math.max(p.ys[0], Math.min(p.ys[1], y));
      return [M.round(x, p.xd), M.round(y, p.yd)];
    });
  }
  function mean(a){ return a.reduce(function(s, v){ return s + v; }, 0) / a.length; }
  function dot(a, b){ var s = 0; for(var i = 0; i < a.length; i++) s += a[i] * b[i]; return s; }

  /* ----------------------------------------------------------- drills */
  // Practice skills (docs/appsych-ced-map.json): 3.B calculate and interpret
  // central tendency, variation and percentile rank; 3.A read a figure; 2.C
  // correlation direction and third variables.
  var SK = { z: '3.B', z1: '3.B', z2: '3.B', za: '3.B', zb: '3.B', below: '3.B', pct: '3.B', mean: '3.B', median: '3.B', range: '3.B', newmean: '3.B',
    meaning: '3.B', better: '3.B', center: '3.B', skew: '3.A', r: '3.A', words: '2.C', cause: '2.C' };
  function step(key, label, o){ var s = { key: key, label: label, practice: SK[key] || '3.B' }; for(var k in o) s[k] = o[k]; return s; }
  function num(key, label, answer, d, o){
    o = o || {};
    var abs = Math.max(o.abs || 0, 0.6 * Math.pow(10, -d));
    return step(key, label, { kind: 'num', d: d, unit: o.unit, hint: o.hint, cell: M.cell(answer, 1e-6, o.mistakes || [], abs) });
  }
  // The first option is the key; the page shuffles.
  function choice(key, label, opts){
    return step(key, label, { kind: 'choice', options: opts.map(function(x){ return x[0]; }), why: opts.map(function(x){ return x[1]; }), correct: 0 });
  }
  function f(x, d){ return M.minus(M.fixed(x, d == null ? 1 : d)); }
  function g(x){ return M.minus(String(M.round(x, 2))); }
  function sgn(z){ return (z > 0 ? '+' : z < 0 ? '−' : '') + String(Math.abs(M.round(z, 2))); }
  function ord(n){ n = Math.round(n); var s = ['th', 'st', 'nd', 'rd'], v = n % 100; return n + (s[(v - 20) % 10] || s[v] || s[0]); }

  function genRule(r, c){
    var sc = c.scale, k = r.pick(c.marks || [-2, -1, 1, 2]), x = E('fromZ', [k, sc.mean, sc.sd]);
    var z = E('z', [x, sc.mean, sc.sd]), below = E('percentileRule', [k]), mid = E('rulePct', [-Math.abs(k), Math.abs(k)]);
    var person = r.pick(c.people || ['Ava', 'Jordan', 'Mateo', 'Priya', 'Sam']);
    var text = '<p>' + c.lead + ' Scores are normally distributed with a mean of ' + sc.mean + ' and a standard deviation of ' + sc.sd + '. ' + person + ' scores ' + x + '.</p>';
    var oneSide = E('rulePct', k > 0 ? [0, k] : [k, 0]);
    var steps = [
      num('z', 'What is ' + person + '’s z score?', z, 1, { hint: 'z = (score − mean) ÷ standard deviation.', mistakes: [
        { value: E('sub', [x, sc.mean]), why: 'That is the distance from the mean in ' + (sc.unitWord || 'points') + '. Divide it by the standard deviation, ' + sc.sd + '.' }] }),
      num('below', 'By the 68-95-99.7 rule, what percent of test takers scored below ' + x + '?', below, 2, { unit: '%', hint: 'Add the bands to the left of the score: 0.15, 2.35, 13.5, 34 (and the same on the right).', mistakes: [
        { value: mid, why: mid + '% is the share within ' + Math.abs(k) + ' SD on both sides of the mean. The question asks for everything below this one score.' },
        { value: oneSide, why: oneSide + '% is only the part between the mean and the score. ' + (k > 0 ? 'Add the 50% below the mean.' : 'The percent below a low score is what is left in the tail.') },
        { value: E('sub', [100, below]), why: 'That is the percent who scored above ' + x + '. Below means to the left of the score.' }] }),
      choice('meaning', 'Which statement about ' + person + '’s score is correct?', [
        ['About ' + g(below) + '% of test takers scored lower than ' + person + '.', 'A percentile rank is the percent of scores below this one.'],
        [person + ' answered about ' + g(below) + '% of the questions correctly.', 'A percentile rank is not a percent correct. It compares ' + person + ' with the other test takers.'],
        ['About ' + g(below) + '% of test takers scored higher than ' + person + '.', 'Reversed: ' + g(below) + '% is the share below the score; ' + g(E('sub', [100, below])) + '% scored higher.'],
        [person + ' scored ' + Math.abs(k) + '% ' + (k > 0 ? 'above' : 'below') + ' the mean.', 'A z score counts standard deviations, not percent: ' + person + ' is ' + Math.abs(k) + ' SD ' + (k > 0 ? 'above' : 'below') + ' the mean.']
      ])
    ];
    var sol = [
      'z = (' + x + ' − ' + sc.mean + ') ÷ ' + sc.sd + ' = ' + sgn(z) + '.',
      'Below z = ' + sgn(k) + ' by the rule: ' + ruleSum(k) + ' = ' + g(below) + '%.',
      'So ' + person + ' is at about the ' + ord(below) + ' percentile: about ' + g(below) + '% of scores are lower.'
    ];
    return { ctx: c.id, topic: c.topic, type: 'rule', text: text, steps: steps, solution: sol,
      given: { mean: sc.mean, sd: sc.sd, x: x }, figure: { kind: 'normal', mean: sc.mean, sd: sc.sd, marks: [x], region: { from: null, to: x }, show: 'below' } };
  }
  /* "0.15 + 2.35 + 13.5" for the bands below a whole-SD mark. */
  function ruleSum(k){
    var B = S().BAND, parts = [];
    if(k >= 0){ parts.push('50'); for(var i = 0; i < k; i++) parts.push(String(B[i])); }
    else for(var t = B.length - 1; t >= -k; t--) parts.push(String(B[t]));
    return parts.join(' + ');
  }
  function genBetween(r, c){
    var sc = c.scale, pairs = [[-1, 1], [-2, 2], [0, 1], [-1, 0], [1, 2], [-2, -1], [0, 2], [-2, 1], [-1, 2]], pr = r.pick(c.betweens || pairs);
    var a = E('fromZ', [pr[0], sc.mean, sc.sd]), b = E('fromZ', [pr[1], sc.mean, sc.sd]), pct = E('rulePct', [pr[0], pr[1]]);
    var za = E('z', [a, sc.mean, sc.sd]), zb = E('z', [b, sc.mean, sc.sd]);
    var text = '<p>' + c.lead + ' Scores are normally distributed with a mean of ' + sc.mean + ' and a standard deviation of ' + sc.sd + '.</p><p>What percent of test takers score between ' + a + ' and ' + b + '?</p>';
    var ms = [{ value: E('percentileRule', [pr[1]]), why: 'That is everything below ' + b + '. Take away the part below ' + a + '.' }];
    // Symmetric marks: the other famous share (68 for 95) means the wrong marks were read.
    if(pr[0] === -pr[1] && pr[1] <= 2){ var o = 3 - pr[1]; ms.push({ value: E('rulePct', [-o, o]), why: 'That is the share within ' + o + ' SD. ' + a + ' and ' + b + ' are ' + pr[1] + ' SD from the mean.' }); }
    if(pr[0] < 0 && pr[1] > 0) ms.push({ value: E('rulePct', [0, pr[1]]), why: 'That is only the part from the mean up to ' + b + '. Add the part from ' + a + ' up to the mean.' });
    var steps = [
      num('za', 'What is the z score of ' + a + '?', za, 1, { hint: 'z = (score − mean) ÷ SD.' }),
      num('zb', 'What is the z score of ' + b + '?', zb, 1, { hint: 'z = (score − mean) ÷ SD.' }),
      num('pct', 'By the 68-95-99.7 rule, what percent score between ' + a + ' and ' + b + '?', pct, 2, { unit: '%', hint: 'Add the bands between the two marks: 34 next to the mean, then 13.5, then 2.35.', mistakes: ms })
    ];
    var sol = [
      'z for ' + a + ' = (' + a + ' − ' + sc.mean + ') ÷ ' + sc.sd + ' = ' + sgn(za) + '; z for ' + b + ' = ' + sgn(zb) + '.',
      'Between z = ' + sgn(pr[0]) + ' and z = ' + sgn(pr[1]) + ': ' + bandList(pr[0], pr[1]) + ' = ' + g(pct) + '%.'
    ];
    return { ctx: c.id, topic: c.topic, type: 'between', text: text, steps: steps, solution: sol,
      given: { mean: sc.mean, sd: sc.sd, a: a, b: b }, figure: { kind: 'normal', mean: sc.mean, sd: sc.sd, marks: [a, b], region: { from: a, to: b }, show: 'between' } };
  }
  function bandList(lo, hi){
    var B = S().BAND, out = [];
    for(var k = lo; k < hi; k++){ var idx = k >= 0 ? k : -k - 1; out.push(String(B[idx])); }
    return out.join(' + ');
  }
  function genZcompare(r, c){
    var t = c.tests, zs = [-1, -0.5, 0.5, 1, 1.5, 2], z1 = r.pick(zs), z2 = r.pick(zs.filter(function(v){ return v !== z1; }));
    var x1 = E('fromZ', [z1, t[0].mean, t[0].sd]), x2 = E('fromZ', [z2, t[1].mean, t[1].sd]);
    var person = r.pick(c.people || ['Leo', 'Nia', 'Omar', 'Rosa']);
    var hi = z1 > z2 ? 0 : 1, raw = x1 > x2 ? 0 : x1 < x2 ? 1 : -1;
    var text = '<p>' + c.lead + ' On the ' + t[0].name + ' (mean ' + t[0].mean + ', standard deviation ' + t[0].sd + ') ' + person + ' scored ' + x1 + '. On the ' + t[1].name + ' (mean ' + t[1].mean + ', standard deviation ' + t[1].sd + ') ' + person + ' scored ' + x2 + '. Both sets of scores are normally distributed.</p>';
    var A = t[hi].name, B = t[1 - hi].name;
    var steps = [
      num('z1', 'What is ' + person + '’s z score on the ' + t[0].name + '?', E('z', [x1, t[0].mean, t[0].sd]), 2, { hint: 'z = (score − mean) ÷ SD.', mistakes: [{ value: E('sub', [x1, t[0].mean]), why: 'Divide the distance from the mean by the standard deviation, ' + t[0].sd + '.' }] }),
      num('z2', 'What is ' + person + '’s z score on the ' + t[1].name + '?', E('z', [x2, t[1].mean, t[1].sd]), 2, { hint: 'z = (score − mean) ÷ SD.', mistakes: [{ value: E('sub', [x2, t[1].mean]), why: 'Divide the distance from the mean by the standard deviation, ' + t[1].sd + '.' }] }),
      choice('better', 'Compared with the other students, on which test did ' + person + ' do better?', [
        ['The ' + A + ', because the z score is higher there.', 'A z score puts both tests on one scale: standard deviations from each test’s own mean.'],
        ['The ' + B + ', because the z score is higher there.', 'Compare the two z scores again: ' + sgn(hi ? z2 : z1) + ' on the ' + A + ' and ' + sgn(hi ? z1 : z2) + ' on the ' + B + '.'],
        [raw === hi || raw === -1 ? 'They are the same, because the raw scores cannot be compared.' : 'The ' + B + ', because the raw score is higher there.', raw === hi || raw === -1 ? 'They can be compared: convert each score to a z score.' : 'A raw score depends on the test’s mean and spread. Compare z scores, not raw scores.'],
        ['Neither: a z score only works when both tests have the same mean.', 'z scores exist exactly so that tests with different means and spreads can be compared.']
      ])
    ];
    var sol = [
      t[0].name + ': z = (' + x1 + ' − ' + t[0].mean + ') ÷ ' + t[0].sd + ' = ' + sgn(z1) + '.',
      t[1].name + ': z = (' + x2 + ' − ' + t[1].mean + ') ÷ ' + t[1].sd + ' = ' + sgn(z2) + '.',
      'Higher z on the ' + A + ', so ' + person + ' stood out more there, whatever the raw scores.'
    ];
    return { ctx: c.id, topic: c.topic, type: 'zcompare', text: text, steps: steps, solution: sol,
      given: { tests: [{ mean: t[0].mean, sd: t[0].sd, x: x1, name: t[0].name }, { mean: t[1].mean, sd: t[1].sd, x: x2, name: t[1].name }] },
      figure: { kind: 'normal2', tests: [{ mean: t[0].mean, sd: t[0].sd, x: x1, name: t[0].name }, { mean: t[1].mean, sd: t[1].sd, x: x2, name: t[1].name }] } };
  }
  /* A small data set of whole numbers whose mean has at most one decimal
     (worked by hand). */
  function dataSet(r, c, n){
    for(var guard = 0; guard < 200; guard++){
      var d = M.repeat(n, function(){ return r.int(c.lo, c.hi); });
      var s = d.reduce(function(a, v){ return a + v; }, 0);
      if((s * 10) % n === 0 && S().modes(d).length === 1 && E('range', [d]) > 0) return d;
    }
    return M.repeat(n, function(i){ return c.lo + i; });
  }
  function genCenter(r, c){
    var n = r.pick(c.ns || [5, 6, 7]), d = dataSet(r, c, n), st = center(d), sorted = d.slice().sort(function(a, b){ return a - b; });
    var text = '<p>' + c.lead + ' The ' + n + ' values (' + c.unit + ') are:</p><p class="sl-data">' + d.join(', ') + '</p>';
    var unsortedMid = n % 2 ? d[(n - 1) / 2] : (d[n / 2 - 1] + d[n / 2]) / 2;
    var steps = [
      num('mean', 'What is the mean?', st.mean, 1, { unit: c.unit, hint: 'Add the values, then divide by how many there are (' + n + ').', mistakes: [
        { value: st.sum, why: 'That is the sum. Divide it by ' + n + ', the number of values.' },
        { value: st.median, why: 'That is the median (the middle value). The mean is the sum divided by ' + n + '.' }] }),
      num('median', 'What is the median?', st.median, 1, { unit: c.unit, hint: n % 2 ? 'Put the values in order and take the middle one.' : 'Put the values in order; with an even count, take the mean of the two middle values.', mistakes: [
        { value: unsortedMid, why: 'That is the middle of the list as written. Put the values in order first: ' + sorted.join(', ') + '.' },
        { value: st.mean, why: 'That is the mean. The median is the middle value once the values are in order.' }] }),
      num('range', 'What is the range?', st.range, 1, { unit: c.unit, hint: 'Highest value minus lowest value.', mistakes: [
        { value: st.max, why: 'That is the highest value. The range is the highest minus the lowest, ' + st.max + ' − ' + st.min + '.' }] })
    ];
    var sol = [
      'Mean = (' + d.join(' + ') + ') ÷ ' + n + ' = ' + st.sum + ' ÷ ' + n + ' = ' + f(st.mean) + '.',
      'In order: ' + sorted.join(', ') + '. Median = ' + (n % 2 ? 'the middle value, ' + f(st.median) : '(' + sorted[n / 2 - 1] + ' + ' + sorted[n / 2] + ') ÷ 2 = ' + f(st.median)) + '.',
      'Range = ' + st.max + ' − ' + st.min + ' = ' + st.range + '.'
    ];
    return { ctx: c.id, topic: c.topic, type: 'center', text: text, steps: steps, solution: sol,
      given: { data: d }, figure: { kind: 'dots', data: d, unit: c.unit } };
  }
  function genOutlier(r, c){
    var hiSide = c.side ? c.side > 0 : r() < 0.5, n, d, before, base, out, d2, after;
    // Data and an outlier that make the new mean one decimal, move the mean
    // more than the median, and leave the mean on the outlier's side.
    for(var tries = 0; tries < 400; tries++){
      n = r.pick([5, 6, 7]); d = dataSet(r, c, n); before = center(d); base = before.sum;
      var far = c.far || [15, 30];
      out = hiSide ? before.max + r.int(far[0], far[1]) : before.min - r.int(far[0], far[1]);
      if(out < (c.floor != null ? c.floor : 0) || ((base + out) * 10) % (n + 1) !== 0) continue;
      d2 = d.concat([out]); after = center(d2);
      if(Math.abs(after.mean - before.mean) > Math.abs(after.median - before.median) + 1 && (hiSide ? after.mean > after.median : after.mean < after.median)) break;
    }
    var text = '<p>' + c.lead + ' The first ' + n + ' values (' + c.unit + ') are ' + d.join(', ') + ', with a mean of ' + f(before.mean) + ' and a median of ' + f(before.median) + '. One more person is added: ' + out + '.</p>';
    var skewWord = hiSide ? 'positively skewed (a tail to the right)' : 'negatively skewed (a tail to the left)';
    var steps = [
      num('newmean', 'What is the new mean of all ' + (n + 1) + ' values?', after.mean, 1, { unit: c.unit, hint: 'New sum ÷ ' + (n + 1) + '.', mistakes: [
        { value: E('div', [E('sum', [d2]), n]), why: 'Divide by ' + (n + 1) + ': there are now ' + (n + 1) + ' values.' },
        { value: E('mean', [[before.mean, out]]), why: 'Averaging the old mean with the new value treats one person like ' + n + '. Add all ' + (n + 1) + ' values and divide by ' + (n + 1) + '.' }] }),
      choice('center', 'Which measure best describes the typical value now?', [
        ['The median, ' + f(after.median) + ', because one extreme value barely moves it.', 'The mean moved from ' + f(before.mean) + ' to ' + f(after.mean) + '; the median only from ' + f(before.median) + ' to ' + f(after.median) + '. With an outlier, report the median.'],
        ['The mean, ' + f(after.mean) + ', because it uses every value.', 'Using every value is why one outlier pulls the mean ' + (hiSide ? 'up' : 'down') + '. The median resists it.'],
        ['The range, ' + after.range + ', because it shows the spread.', 'The range is a measure of variation, not of the typical value. It also grows with one outlier.'],
        ['The mode, because it is always the best measure.', 'The mode is the most frequent value. It can describe the typical value, but here the median is the robust choice.']
      ]),
      choice('skew', 'With the new value, how is the distribution shaped?', [
        [cap(skewWord) + ': the mean is ' + (hiSide ? 'above' : 'below') + ' the median.', 'The outlier pulls the mean toward the tail, so the mean sits on the tail’s side of the median.'],
        [cap(hiSide ? 'negatively skewed (a tail to the left)' : 'positively skewed (a tail to the right)') + ': the mean is ' + (hiSide ? 'above' : 'below') + ' the median.', 'A skew is named for its tail. The extreme value is ' + (hiSide ? 'high' : 'low') + ', so the tail points ' + (hiSide ? 'right: positive' : 'left: negative') + '.'],
        ['Normal: the mean equals the median.', 'In a symmetric distribution they match. Here the mean (' + f(after.mean) + ') and median (' + f(after.median) + ') differ.'],
        ['Bimodal: there are two modes.', 'Bimodal means two peaks. One extreme value makes a tail, not a second peak.']
      ])
    ];
    var sol = [
      'New sum = ' + base + ' + ' + out + ' = ' + after.sum + '. New mean = ' + after.sum + ' ÷ ' + (n + 1) + ' = ' + f(after.mean) + '.',
      'The median moves only from ' + f(before.median) + ' to ' + f(after.median) + ': the median resists outliers, the mean does not.',
      'The mean is pulled toward the ' + (hiSide ? 'high' : 'low') + ' value, so the distribution is ' + skewWord + '.'
    ];
    return { ctx: c.id, topic: c.topic, type: 'outlier', text: text, steps: steps, solution: sol,
      given: { data: d, out: out, high: hiSide }, figure: { kind: 'dots', data: d2, mark: d2.length - 1, unit: c.unit } };
  }
  function cap(s){ return s.charAt(0).toUpperCase() + s.slice(1); }
  var R_CHOICES = [-0.9, -0.6, -0.3, 0, 0.3, 0.6, 0.9];
  function genScatter(r, c){
    var pair = c.pair, signs = c.signs || [1, -1], sign = r.pick(signs), mag = r.pick(c.mags || [0.3, 0.6, 0.9]);
    var target = sign === 0 ? 0 : sign * mag, pts = null, rr = 0;
    for(var k = 0; k < 40; k++){
      var cand = corrPoints(target, c.n || 14, r.int(1, 99999), pair), v = E('r', [cand]);
      if(Math.abs(v - target) <= 0.06){ pts = cand; rr = v; break; }
    }
    if(!pts){ pts = corrPoints(target, c.n || 14, 7, pair); rr = E('r', [pts]); target = nearest(rr); }
    // Always the sign slip (-r), then two that differ clearly in strength or sign.
    var rest = R_CHOICES.filter(function(v){ return Math.abs(v - target) >= 0.55 && Math.abs(v + target) > 1e-9; });
    var others = target === 0 ? M.shuffle(r, rest).slice(0, 3) : [-target].concat(M.shuffle(r, rest).slice(0, 2));
    var desc = S().describe(target), sTr = S().strength(target);
    var text = '<p>' + c.lead + ' The scatterplot shows ' + pts.length + ' ' + (c.who || 'students') + ' (invented data for practice).</p>';
    var steps = [
      choice('r', 'Which correlation coefficient best fits the scatterplot?', [['r = ' + g(target), rWhy(target)]].concat(others.map(function(v){ return ['r = ' + g(v), rSlip(v, target)]; }))),
      choice('words', 'Which description fits?', wordOpts(target)),
      choice('cause', c.claim, [
        [c.right, c.rightWhy],
        [c.wrong, 'A correlation shows that two variables vary together, not that one causes the other. ' + c.thirdWhy],
        [sTr === 'none' ? 'Yes, if the researcher measured more adults.' : 'Yes, because r is ' + (sTr === 'strong' ? 'large' : 'not zero') + '.', 'Even a perfect correlation cannot show cause. Only an experiment, with the variable manipulated and people randomly assigned, can.'],
        ['No, because a correlation needs at least 100 people.', 'Sample size is not the problem. Cause cannot come from any correlational study, however large.']
      ])
    ];
    var sol = [
      (target === 0 ? 'The points show no rising or falling pattern' : 'The points ' + (target > 0 ? 'rise' : 'fall') + ' to the right and lie ' + (Math.abs(target) >= 0.7 ? 'close to' : Math.abs(target) >= 0.4 ? 'loosely around' : 'far from') + ' a line') + ': r ≈ ' + g(target) + ' (computed from these exact points: r = ' + g(M.round(rr, 2)) + ').',
      'That is ' + desc + ' (a rule of thumb: |r| of .7 or more strong, .4 to .7 moderate, .1 to .4 weak).',
      'Correlation is not causation. ' + c.thirdWhy
    ];
    return { ctx: c.id, topic: c.topic, type: 'scatter', text: text, steps: steps, solution: sol,
      given: { points: pts, target: target }, figure: { kind: 'scatter', points: pts, x: pair.x, y: pair.y, xs: pair.xs, ys: pair.ys } };
  }
  function nearest(v){ var best = R_CHOICES[0]; R_CHOICES.forEach(function(c){ if(Math.abs(c - v) < Math.abs(best - v)) best = c; }); return best; }
  function rWhy(t){
    if(t === 0) return 'No line fits: as x goes up, y does not go up or down.';
    return 'The points ' + (t > 0 ? 'rise' : 'fall') + ' to the right (' + (t > 0 ? 'positive' : 'negative') + ') and lie ' + (Math.abs(t) >= 0.7 ? 'close to a line (strong)' : Math.abs(t) >= 0.4 ? 'loosely around a line (moderate)' : 'far from any line (weak)') + '.';
  }
  function rSlip(v, t){
    if(t !== 0 && Math.abs(v + t) < 1e-9) return 'The size is right but the sign is not: the points ' + (t > 0 ? 'rise' : 'fall') + ' to the right, so r is ' + (t > 0 ? 'positive' : 'negative') + '.';
    if(v === 0) return 'r = 0 means no linear pattern. These points ' + (t > 0 ? 'rise' : 'fall') + ' to the right.';
    if(t === 0) return 'These points show no pattern, so r is near 0.';
    if((v > 0) !== (t > 0)) return 'The sign is wrong: the points ' + (t > 0 ? 'rise' : 'fall') + ' to the right.';
    return Math.abs(v) > Math.abs(t) ? 'Too strong: the points are more spread out than r = ' + g(v) + ' would make them.' : 'Too weak: the points lie closer to a line than r = ' + g(v) + '.';
  }
  function wordOpts(t){
    var d = S().describe(t), all = ['a strong positive correlation', 'a moderate positive correlation', 'a weak positive correlation', 'a strong negative correlation', 'a moderate negative correlation', 'a weak negative correlation', 'little or no correlation'];
    var key = [cap(d) + '.', (t === 0 ? 'r near 0: no linear relationship.' : 'The sign gives the direction; the size (|r| = ' + g(Math.abs(t)) + ') gives the strength.')];
    var near = all.filter(function(x){ return x !== d; });
    // Keep the confusions a student makes: the opposite sign, and a neighbor strength.
    var opp = t === 0 ? 'a weak positive correlation' : d.replace(t > 0 ? 'positive' : 'negative', t > 0 ? 'negative' : 'positive');
    var pick = [opp].concat(near.filter(function(x){ return x !== opp; }).filter(function(x){ return t !== 0 ? x.indexOf(t > 0 ? 'positive' : 'negative') > -1 || x === 'little or no correlation' : true; }).slice(0, 2));
    return [key].concat(pick.map(function(x){
      return [cap(x) + '.', x === 'little or no correlation' ? 'The points do follow a ' + (t > 0 ? 'rising' : 'falling') + ' line, so there is a correlation.' : x.indexOf(t > 0 ? 'negative' : 'positive') > -1 && t !== 0 ? 'Direction: the points ' + (t > 0 ? 'rise' : 'fall') + ' to the right, so the correlation is ' + (t > 0 ? 'positive' : 'negative') + '.' : 'Strength: |r| = ' + g(Math.abs(t)) + ' is ' + S().strength(t) + ' by the rule of thumb (.7 strong, .4 moderate, .1 weak).'];
    }));
  }

  var GEN = { rule: genRule, between: genBetween, zcompare: genZcompare, center: genCenter, outlier: genOutlier, scatter: genScatter };
  M.register('statsLab', {
    SCALES: SCALES, SETS: SETS, PAIRS: PAIRS, R_CHOICES: R_CHOICES,
    pdf: pdf, normalAt: normalAt, center: center, corrPoints: corrPoints, ruleSum: ruleSum, bandList: bandList, ord: ord,
    TYPES: Object.keys(GEN),
    generate: function(r, ctx, type){
      var types = ctx.types || Object.keys(GEN);
      var ty = type && types.indexOf(type) > -1 ? type : r.pick(types);
      return GEN[ty](r, ctx);
    }
  });
})(typeof window !== 'undefined' ? window : globalThis);
