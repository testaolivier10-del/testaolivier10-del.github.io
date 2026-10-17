/* Sampling distributions model: ApStatMath.samplingDistributions (docs/apstat-architecture.md, "Tools").
   OWNED BY THIS TOOL ONLY: no other tool edits this file, and this tool edits
   no shared file. Pure functions, no DOM, so the validator
   (scripts/lib/apstat-tool-checks/sampling-distributions.mjs) and the test
   (scripts/test/apstat-tool-sampling-distributions.test.mjs) run exactly this code.

   Loaded on statistics/tools/sampling-distributions.html after stat-expr.js (ApStatExpr),
   stat-dist.js (ApStatDist) and stat-tool-math.js (M.rng, M.cell, M.diagnose)
   and before statistics/assets/tools/sampling-distributions.js.

   Populations (explore and drills)
     POPS[id]                     a population: a histogram density (piecewise
                                  uniform on bins, so x values are continuous
                                  and mu, sigma are exact) or a proportion p
     population(def)              -> { kind, lo, width, weights, cum, mu, sigma, skew, normal }
                                  def: a POPS entry, or { kind:'mean', lo, width, weights } (drawn by hand)
     value(r, pop)                one random value from the population
     draw(r, pop, n)              a random sample (values, or 0/1 for a proportion)
     stat(pop, xs)                the sample mean or the sample proportion
     simulate(r, pop, n, k)       k simulated statistics
     theory(pop, n)               { center, sd, normal, reason, counts? }: the formulas
     theoryDiff(ta, tb)           the same for a difference of two independent statistics
   Drills
     generate(rng, context, type) -> { ctx, topic, type, text, steps, solution, figure? }
       type 'mean' | 'prop' | 'diff' | 'shape' | 'estimator'
   Every probability is ApStatDist.normCdf; every picture of a sampling
   distribution in a drill is drawn from statistics simulated here with the
   drill's seeded generator. */
(function(G){
  'use strict';
  var M = G.ApStatMath;
  if(!M) return;
  function D(){ return G.ApStatDist; }
  function tx(s){ return G.ApStatTex ? G.ApStatTex.html(s) : s; }
  /* Problem text reads as plain Unicode (x̄, p̂, μ, σ, p₁), so the studio's
     one-line caption shows it as written; labels and solutions keep TeX. */
  function um(s){
    return String(s).replace(/\$([^$]*)\$/g, function(_, m){
      return m.replace(/\\bar\{x\}/g, 'x̄').replace(/\\hat\{p\}/g, 'p̂').replace(/\\mu/g, 'μ').replace(/\\sigma/g, 'σ')
        .replace(/_1/g, '₁').replace(/_2/g, '₂').replace(/\\le/g, '≤').replace(/\\ge/g, '≥').replace(/\\pm/g, '±')
        .replace(/\\text\{([^}]*)\}/g, '$1').replace(/\s*-\s*/g, function(x){ return / /.test(x) ? ' − ' : '−'; });
    });
  }
  function f(x, d){ return M.fixed(x, d).replace(/^-/, '−'); }
  function t(x, d){ return M.fixed(x, d); }   // inside TeX (a plain minus)
  function esc(s){ return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }

  /* ------------------------------------------------------- populations */
  var POPS = {
    commute: { id: 'commute', kind: 'mean', name: 'Commute times', shapeWord: 'skewed right', what: 'commute time', whats: 'commute times', unit: 'minutes', who: 'workers',
      lo: 0, width: 5, bins: 18, shape: { dist: 'gamma', k: 2.2, theta: 10 } },
    wait: { id: 'wait', kind: 'mean', name: 'Bus waits', shapeWord: 'uniform', what: 'wait for the bus', whats: 'waiting times', unit: 'minutes', who: 'riders',
      lo: 0, width: 1, bins: 20, shape: { dist: 'uniform' } },
    geyser: { id: 'geyser', kind: 'mean', name: 'Geyser gaps', shapeWord: 'bimodal', what: 'time between eruptions', whats: 'times between eruptions', unit: 'minutes', who: 'eruptions',
      lo: 40, width: 3, bins: 20, shape: { dist: 'mix', parts: [{ w: 0.35, mu: 55, sd: 5 }, { w: 0.65, mu: 80, sd: 6 }] } },
    heights: { id: 'heights', kind: 'mean', name: 'Heights', shapeWord: 'approximately normal', what: 'height', whats: 'heights', unit: 'cm', who: 'adults',
      lo: 142, width: 2, bins: 22, shape: { dist: 'normal', mu: 163, sd: 7 } },
    lefties: { id: 'lefties', kind: 'prop', name: 'Left-handed', p: 0.10, what: 'left-handed', yes: 'left-handed', no: 'right-handed', who: 'students' },
    bond: { id: 'bond', kind: 'prop', name: 'Bond support', p: 0.56, what: 'support the bond', yes: 'support it', no: 'do not', who: 'voters' }
  };
  function shapeWeights(s, lo, w, k){
    var out = [], Dd = D();
    for(var i = 0; i < k; i++){
      var a = lo + i * w, b = a + w, m = a + w / 2, v = 0;
      if(s.dist === 'normal') v = Dd.normCdf(b, s.mu, s.sd) - Dd.normCdf(a, s.mu, s.sd);
      else if(s.dist === 'mix') s.parts.forEach(function(p){ v += p.w * (Dd.normCdf(b, p.mu, p.sd) - Dd.normCdf(a, p.mu, p.sd)); });
      else if(s.dist === 'uniform') v = 1;
      else if(s.dist === 'gamma'){ var x = m - (s.shift || 0); v = x > 0 ? Math.exp((s.k - 1) * Math.log(x) - x / s.theta - Dd.lgamma(s.k) - s.k * Math.log(s.theta)) * w : 0; }
      out.push(v);
    }
    return out;
  }
  function population(def){
    if(def.kind === 'prop'){
      var p = def.p;
      return { kind: 'prop', p: p, mu: p, sigma: Math.sqrt(p * (1 - p)), def: def };
    }
    var w = def.width, lo = def.lo, ws = def.weights ? def.weights.slice() : shapeWeights(def.shape, lo, w, def.bins);
    var tot = ws.reduce(function(a, b){ return a + b; }, 0);
    if(!(tot > 0)) throw new Error('samplingDistributions.population: the weights add to zero');
    ws = ws.map(function(x){ return x / tot; });
    var cum = [], c = 0, mu = 0, ex2 = 0;
    ws.forEach(function(x, i){ c += x; cum.push(c); var m = lo + (i + 0.5) * w; mu += x * m; ex2 += x * (m * m + w * w / 12); });
    cum[cum.length - 1] = 1;
    var sigma = Math.sqrt(Math.max(0, ex2 - mu * mu)), m3 = 0;
    ws.forEach(function(x, i){ var d = lo + (i + 0.5) * w - mu; m3 += x * (d * d * d + d * w * w / 4); });
    return { kind: 'mean', lo: lo, width: w, hi: lo + w * ws.length, weights: ws, cum: cum, mu: mu, sigma: sigma,
      skew: sigma > 0 ? m3 / (sigma * sigma * sigma) : 0, normal: !!(def.shape && def.shape.dist === 'normal'), def: def };
  }
  /* One uniform draw gives both the bar (by the cumulative weights) and the
     point inside it (where u falls within that bar's share): exactly a
     draw from the histogram density. */
  function value(r, pop){
    if(pop.kind === 'prop') return r() < pop.p ? 1 : 0;
    var u = r(), c = pop.cum, a = 0, b = c.length - 1;
    while(a < b){ var h = (a + b) >> 1; if(u < c[h]) b = h; else a = h + 1; }
    var c0 = a ? c[a - 1] : 0, w = c[a] - c0;
    var f = w > 0 ? (u - c0) / w : 0.5;
    return pop.lo + (a + (f < 0.999999999 ? f : 0.999999999)) * pop.width;
  }
  /* A long simulation draws from a local stream seeded by one draw of the
     drill's seeded generator (mulberry32 again, with Math.imul held
     locally): the same seed gives the same samples, and node's vm sandbox
     (the validator) does not pay a global lookup per draw. */
  var IMUL = Math.imul;
  function stream(r){
    var s = (Math.floor(r() * 4294967296) >>> 0) || 1;
    return function(){ s = (s + 0x6D2B79F5) >>> 0; var t = s; t = IMUL(t ^ (t >>> 15), t | 1); t ^= t + IMUL(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }
  function draw(r, pop, n){ var out = []; for(var i = 0; i < n; i++) out.push(value(r, pop)); return out; }
  function stat(pop, xs){ var s = 0; for(var i = 0; i < xs.length; i++) s += xs[i]; return s / xs.length; }
  function simulate(r, pop, n, k){
    var out = []; r = stream(r);
    for(var j = 0; j < k; j++){ var s = 0; for(var i = 0; i < n; i++) s += value(r, pop); out.push(s / n); }
    return out;
  }
  /* The formulas the simulation is compared with, and the AP® shape rule:
     a normal population or n >= 30 for x-bar (the CLT); large counts
     (np and n(1 - p) both at least 10) for p-hat. */
  function theory(pop, n){
    if(pop.kind === 'prop'){
      var a = n * pop.p, b = n * (1 - pop.p);
      return { kind: 'prop', center: pop.p, sd: Math.sqrt(pop.p * (1 - pop.p) / n), counts: [a, b], normal: a >= 10 && b >= 10, reason: a >= 10 && b >= 10 ? 'counts' : 'small', n: n };
    }
    var ok = pop.normal || n >= 30;
    return { kind: 'mean', center: pop.mu, sd: pop.sigma / Math.sqrt(n), normal: ok, reason: pop.normal ? 'normal' : n >= 30 ? 'clt' : 'small', skew: pop.skew / Math.sqrt(n), n: n };
  }
  function theoryDiff(ta, tb){
    return { kind: 'diff', center: ta.center - tb.center, sd: Math.sqrt(ta.sd * ta.sd + tb.sd * tb.sd), normal: ta.normal && tb.normal, a: ta, b: tb };
  }

  /* ----------------------------------------------------------- drills */
  var SK = { mean: '3.D', sd: '3.D', tenpct: '4.E', shape: '4.E', counts: '4.E', prob: '3.C', pic: '4.C', grow: '4.C', unbiased: '4.D', spread: '4.D', best: '2.D' };
  function step(key, label, o){ var s = { key: key, label: label, practice: SK[key] || '3.D' }; for(var k in o) s[k] = o[k]; return s; }
  function num(key, label, answer, d, o){
    o = o || {};
    var abs = o.abs != null ? o.abs : 0.6 * Math.pow(10, -d);
    return step(key, label, { kind: 'num', d: d, unit: o.unit, hint: o.hint, cell: M.cell(answer, 1e-6, o.mistakes || [], abs) });
  }
  /* A choice step: options[0] is the right one; the drill shuffles them. */
  function choice(key, label, opts, o){
    return step(key, label, Object.assign({ kind: 'choice', options: opts.map(function(x){ return x[0]; }), why: opts.map(function(x){ return x[1]; }), correct: 0 }, o || {}));
  }
  function between(r, ab, d){ return M.round(ab[0] + r() * (ab[1] - ab[0]), d); }
  /* A probability from a normal model, keyed at technology precision, with
     the Table A route (z to two places) accepted. */
  function probCell(key, label, x, center, sd, dir, o){
    var Dd = D(), z = (x - center) / sd, p = dir === 'gt' ? 1 - Dd.normCdf(z) : Dd.normCdf(z);
    var zt = Math.round(z * 100) / 100, pt = dir === 'gt' ? 1 - Dd.normCdf(zt) : Dd.normCdf(zt);
    var abs = Math.max(0.0006, 1.25 * Math.abs(pt - p));
    var s = num(key, label, p, 4, { abs: abs, mistakes: o.mistakes, hint: o.hint });
    s.z = z; s.p = p;
    return s;
  }
  function wrongSd(center, sdWrong, x, dir, why){
    var Dd = D(), z = (x - center) / sdWrong;
    return { value: dir === 'gt' ? 1 - Dd.normCdf(z) : Dd.normCdf(z), why: why };
  }

  /* x-bar: center, spread, the 10% condition, shape, a probability. */
  function genMean(r, c){
    var mu = between(r, c.mu, c.dmu == null ? 1 : c.dmu), sigma = between(r, c.sigma, c.dsig == null ? 1 : c.dsig), n = r.pick(c.ns);
    var normalPop = /normal/.test(c.shape), se = sigma / Math.sqrt(n), ok = normalPop || n >= 30;
    var u = c.unit, xb = '\\bar{x}';
    var text = '<p>' + c.lead + ' ' + um('The distribution of ' + c.var + 's is ' + c.shape + ', with mean $\\mu = ' + t(mu, c.dmu == null ? 1 : c.dmu) + '$ ' + u + ' and standard deviation $\\sigma = ' + t(sigma, c.dsig == null ? 1 : c.dsig) + '$ ' + u + '. A random sample of $n = ' + n + '$ ' + c.who + ' is selected from ' + c.pop + ', and $' + xb + '$ is the sample mean ' + c.var + '.') + '</p>';
    var steps = [], sol = [];
    steps.push(num('mean', tx('Mean of the sampling distribution of $' + xb + '$: $\\mu_{' + xb + '} =$'), mu, 2, { unit: u,
      mistakes: [{ value: sigma, why: 'That is σ, the spread. The center of the sampling distribution is the population mean μ.' }] }));
    steps.push(num('sd', tx('Standard deviation of the sampling distribution: $\\sigma_{' + xb + '} =$'), se, 3, { unit: u,
      mistakes: [{ value: sigma, why: 'That is the spread of single ' + c.var + 's. A mean of ' + n + ' values varies less: divide σ by the square root of n.' },
        { value: sigma / n, why: 'Divide by the square root of n, not by n.' },
        { value: sigma * sigma / n, why: 'That is the variance σ²/n. Take its square root, or use σ/√n directly.' }] }));
    var big = '10% of ' + c.popAll;
    steps.push(choice('tenpct', 'The sample is drawn without replacement. Which statement about the 10% condition is right?', [
      [tx('It is met: $n = ' + n + '$ is less than ' + big + ', so $\\sigma / \\sqrt{n}$ is an accurate standard deviation.'), 'Right. The 10% condition is about independence: when the sample is a small part of the population, drawing without replacement barely changes the chances, so σ/√n holds.'],
      [tx('It is met because $n = ' + n + '$ is at least 30.'), 'That mixes up two conditions. n ≥ 30 is about the shape (the Central Limit Theorem); the 10% condition compares n with the population size.'],
      ['It checks whether the sampling distribution is approximately normal.', 'No. Normality comes from the population shape or the Central Limit Theorem. The 10% condition checks that the observations are close to independent, so the standard deviation formula works.'],
      ['It is not needed, because the sample is random.', 'Random sampling and the 10% condition are separate. Without replacement, the 10% condition is still needed for the standard deviation formula.']
    ]));
    var shapeOpts;
    if(normalPop) shapeOpts = [
      [tx('Normal, because the population distribution is normal, for any sample size.'), 'Right. When the population is normal, x̄ is normal for every n; no n ≥ 30 is needed.'],
      [tx('Not approximately normal, because $n = ' + n + '$' + (n < 30 ? ' is less than 30.' : ' is too small a part of the population.')), 'The n ≥ 30 rule is only needed when the population is not normal. Here it is normal, so x̄ is normal for any n.'],
      ['Skewed, because a sample of this size is small.', 'A normal population gives a normal sampling distribution of x̄ at every sample size.'],
      ['Approximately normal only because the sample is random.', 'Randomness lets us use the sampling distribution, but it is not what makes it normal. The normal population does that.']];
    else if(ok) shapeOpts = [
      [tx('Approximately normal, because $n = ' + n + '$ is at least 30 (the Central Limit Theorem).'), 'Right. The population is ' + c.shape + ', but with n ≥ 30 the Central Limit Theorem makes x̄ approximately normal.'],
      ['The same shape as the population, ' + c.shape + '.', 'Single ' + c.var + 's are ' + c.shape + ', but a mean of ' + n + ' of them averages the long tail out: with n ≥ 30 x̄ is approximately normal.'],
      ['Approximately normal, because the population is approximately normal.', 'The problem says the population is ' + c.shape + ', not normal. The reason here is the Central Limit Theorem: n is at least 30.'],
      [tx('Not approximately normal, because $n = ' + n + '$ is less than 10% of the population.'), 'The 10% condition is about independence, not shape. With n ≥ 30 the Central Limit Theorem gives an approximately normal x̄.']];
    else shapeOpts = [
      [tx('Not approximately normal: the population is ' + c.shape + ' and $n = ' + n + '$ is less than 30, so $' + xb + '$ is still somewhat ' + c.shape + '.'), 'Right. With a ' + c.shape + ' population and n < 30 the Central Limit Theorem does not apply, so a normal model for x̄ is not justified.'],
      ['Approximately normal, because the Central Limit Theorem works for every sample size.', 'The Central Limit Theorem needs a large sample (n ≥ 30 is the usual rule) unless the population is normal.'],
      ['Approximately normal, because the sample is random.', 'Random sampling does not make a ' + c.shape + ' population normal. A small n keeps some of the population’s shape.'],
      ['Exactly the same shape and spread as the population.', 'The shape is partly like the population’s, but the spread is smaller: σ/√n, not σ.']];
    steps.push(choice('shape', tx('What is the shape of the sampling distribution of $' + xb + '$?'), shapeOpts));
    sol.push(tx('$\\mu_{' + xb + '} = \\mu = ' + t(mu, 2) + '$ ' + u + '.'));
    sol.push(tx('$\\sigma_{' + xb + '} = \\frac{\\sigma}{\\sqrt{n}} = \\frac{' + t(sigma, 2) + '}{\\sqrt{' + n + '}} = ' + t(se, 3) + '$ ' + u + '.'));
    sol.push(tx('10% condition: $n = ' + n + '$ is less than ' + big + ', so the observations are close to independent.'));
    sol.push(normalPop ? 'Shape: normal, because the population is normal.' : ok ? tx('Shape: approximately normal by the Central Limit Theorem, since $n = ' + n + ' \\ge 30$.') : tx('Shape: not approximately normal, since the population is ' + c.shape + ' and $n = ' + n + ' < 30$.'));
    var fig = { kind: 'normal', type: 'mean', center: mu, sd: se, unit: u, sym: 'x̄', ok: ok, n: n, pops: [{ mu: mu, sigma: sigma, shape: c.shape }] };
    if(ok){
      var k = between(r, [0.6, 2.2], 2) * (r() < 0.5 ? -1 : 1), x = M.round(mu + k * se, c.dx == null ? 1 : c.dx), dir = r() < 0.5 ? 'gt' : 'lt';
      if(Math.abs(x - mu) < se * 0.3) x = M.round(mu + (k > 0 ? 1 : -1) * se, c.dx == null ? 1 : c.dx);
      var sym = dir === 'gt' ? '>' : '<';
      var ps = probCell('prob', tx('Use a normal model to find $P(' + xb + ' ' + sym + ' ' + t(x, c.dx == null ? 1 : c.dx) + ')$.'), x, mu, se, dir, {
        mistakes: [wrongSd(mu, sigma, x, dir, 'That used σ, the spread of single ' + c.var + 's. For x̄ use σ/√n = ' + f(se, 3) + '.')] });
      steps.push(ps);
      fig.x = x; fig.dir = dir; fig.pr = ps.p;
      sol.push(tx('$z = \\frac{' + t(x, 2) + ' - ' + t(mu, 2) + '}{' + t(se, 3) + '} = ' + t(ps.z, 2) + '$, so $P(' + xb + ' ' + sym + ' ' + t(x, 2) + ') = ' + t(ps.p, 4) + '$ (normal, mean ' + t(mu, 2) + ', SD ' + t(se, 3) + ').'));
    } else sol.push('No probability from a normal model here: its condition is not met.');
    return { ctx: c.id, topic: c.topic, type: 'mean', text: text, steps: steps, solution: sol, figure: fig, given: { mu: mu, sigma: sigma, n: n, normalPop: normalPop, x: fig.x, dir: fig.dir } };
  }

  /* p-hat: center, spread, large counts, a probability. */
  function genProp(r, c){
    var p = between(r, c.p, 2), n = r.pick(c.ns), se = Math.sqrt(p * (1 - p) / n), a = n * p, b = n * (1 - p), ok = a >= 10 && b >= 10;
    var ph = '\\hat{p}';
    var text = '<p>' + um(c.lead + ' Suppose $p = ' + t(p, 2) + '$ of ' + c.popAll + ' ' + c.yes + '. A random sample of $n = ' + n + '$ ' + c.who + ' is selected, and $' + ph + '$ is the proportion of the sample who ' + c.yes + '.') + '</p>';
    var steps = [], sol = [];
    steps.push(num('mean', tx('Mean of the sampling distribution of $' + ph + '$: $\\mu_{' + ph + '} =$'), p, 2, {
      mistakes: [{ value: 1 - p, why: 'That is the proportion who do not. The center is p, the proportion who ' + c.yes + '.' }] }));
    steps.push(num('sd', tx('Standard deviation: $\\sigma_{' + ph + '} =$'), se, 4, {
      mistakes: [{ value: Math.sqrt(p * (1 - p)), why: 'That is the spread of single yes or no answers. Divide p(1 − p) by n before the square root.' },
        { value: p * (1 - p) / n, why: 'That is the variance. Take the square root.' },
        { value: Math.sqrt(p / n), why: 'The formula is the square root of p(1 − p)/n: include 1 − p.' }] }));
    var An = f(a, 1).replace(/\.0$/, ''), Bn = f(b, 1).replace(/\.0$/, '');
    var countsOpts = ok ? [
      [tx('Met: $np = ' + An + '$ and $n(1 - p) = ' + Bn + '$ are both at least 10, so $' + ph + '$ is approximately normal.'), 'Right. Both expected counts are at least 10.'],
      [tx('Met because $n = ' + n + '$ is at least 30.'), 'For proportions the check is the expected counts np and n(1 − p), not n ≥ 30.'],
      [tx('Not met, because $p = ' + t(p, 2) + '$ is not 0.5.'), 'p does not need to be 0.5. The check is that np and n(1 − p) are both at least 10.'],
      [tx('Met: $n' + ph + '$ and $n(1 - ' + ph + ')$ are at least 10 for the sample.'), 'Here p is known, so check np and n(1 − p) with the population proportion.']
    ] : [
      ['', 'Right. An expected count under 10 means the sampling distribution is still clearly skewed.'],
      [tx('Met because $n = ' + n + '$ is at least 30.'), 'For proportions the check is the expected counts np and n(1 − p), not n ≥ 30.'],
      ['Met, because the sample is random.', 'Random sampling is a separate condition. The large counts condition needs np and n(1 − p) both at least 10.'],
      [tx('Met: $np$ and $n(1 - p)$ only need to be at least 1.'), 'The threshold is 10 (some books use 5). With a count under 10 the shape is still skewed.']
    ];
    // The not-met option names the small count only.
    if(!ok){
      var small = a < 10 ? tx('$np = ' + An + '$') : tx('$n(1 - p) = ' + Bn + '$');
      countsOpts[0][0] = tx('Not met: ') + small + tx(' is less than 10, so a normal model for $' + ph + '$ is not justified.');
    }
    steps.push(choice('counts', 'Is the large counts condition met?', countsOpts));
    sol.push(tx('$\\mu_{' + ph + '} = p = ' + t(p, 2) + '$.'));
    sol.push(tx('$\\sigma_{' + ph + '} = \\sqrt{\\frac{p(1 - p)}{n}} = \\sqrt{\\frac{' + t(p, 2) + '(' + t(1 - p, 2) + ')}{' + n + '}} = ' + t(se, 4) + '$.'));
    sol.push(tx('Large counts: $np = ' + An + '$ and $n(1 - p) = ' + Bn + '$; ' + (ok ? 'both are at least 10.' : 'not both are at least 10.')));
    var fig = { kind: 'normal', type: 'prop', center: p, sd: se, sym: 'p̂', ok: ok, n: n, pops: [{ p: p }], yes: c.yes };
    if(ok){
      var k = between(r, [0.6, 2.2], 2) * (r() < 0.5 ? -1 : 1), x = M.round(p + k * se, 2), dir = r() < 0.5 ? 'gt' : 'lt';
      if(Math.abs(x - p) < se * 0.3 || x <= 0 || x >= 1) x = M.round(p + (k > 0 ? 1.3 : -1.3) * se, 3);
      var sym = dir === 'gt' ? '>' : '<', xs = String(+x.toFixed(3));
      var ps = probCell('prob', tx('Use a normal model to find $P(' + ph + ' ' + sym + ' ' + xs + ')$.'), x, p, se, dir, {
        mistakes: [wrongSd(p, Math.sqrt(p * (1 - p)), x, dir, 'That used the spread of single answers. For p̂ use the square root of p(1 − p)/n = ' + f(se, 4) + '.')] });
      steps.push(ps);
      fig.x = x; fig.dir = dir; fig.pr = ps.p;
      sol.push(tx('$z = \\frac{' + xs + ' - ' + t(p, 2) + '}{' + t(se, 4) + '} = ' + t(ps.z, 2) + '$, so $P(' + ph + ' ' + sym + ' ' + xs + ') = ' + t(ps.p, 4) + '$.'));
    } else sol.push('No probability from a normal model here: the large counts condition fails.');
    return { ctx: c.id, topic: c.topic, type: 'prop', text: text, steps: steps, solution: sol, figure: fig, given: { p: p, n: n, x: fig.x, dir: fig.dir } };
  }

  /* A difference of two independent statistics. */
  function genDiff(r, c){
    var isP = c.kind === 'prop', steps = [], sol = [], text, a, b, ta, tb, nA = r.pick(c.ns), nB = r.pick(c.ns);
    var gA = c.groups[0], gB = c.groups[1];
    if(isP){
      a = between(r, gA.p, 2); b = between(r, gB.p, 2);
      if(Math.abs(a - b) < 0.03) b = M.round(a - 0.05, 2);
      ta = theory(population({ kind: 'prop', p: a }), nA); tb = theory(population({ kind: 'prop', p: b }), nB);
      text = '<p>' + um(c.lead + ' In ' + gA.name + ', $p_1 = ' + t(a, 2) + '$ ' + c.yes + '; in ' + gB.name + ', $p_2 = ' + t(b, 2) + '$. Independent random samples of $n_1 = ' + nA + '$ and $n_2 = ' + nB + '$ ' + c.who + ' are taken, one from each.') + '</p>';
    } else {
      a = between(r, gA.mu, 1); b = between(r, gB.mu, 1);
      var sa = between(r, gA.sigma, 1), sb = between(r, gB.sigma, 1);
      ta = { center: a, sd: sa / Math.sqrt(nA), normal: /normal/.test(c.shape) || nA >= 30 };
      tb = { center: b, sd: sb / Math.sqrt(nB), normal: /normal/.test(c.shape) || nB >= 30 };
      ta.sig = sa; tb.sig = sb;
      text = '<p>' + um(c.lead + ' ' + gA.Name + ' have mean ' + c.var + ' $\\mu_1 = ' + t(a, 1) + '$ ' + c.unit + ' (SD $\\sigma_1 = ' + t(sa, 1) + '$); ' + gB.name + ' have $\\mu_2 = ' + t(b, 1) + '$ ' + c.unit + ' ($\\sigma_2 = ' + t(sb, 1) + '$). Both distributions are ' + c.shape + '. Independent random samples of $n_1 = ' + nA + '$ and $n_2 = ' + nB + '$ are taken.') + '</p>';
    }
    var th = theoryDiff(ta, tb), S = isP ? '\\hat{p}_1 - \\hat{p}_2' : '\\bar{x}_1 - \\bar{x}_2', u = isP ? undefined : c.unit;
    var va = ta.sd * ta.sd, vb = tb.sd * tb.sd;
    steps.push(num('mean', tx('Mean of the sampling distribution of $' + S + '$:'), th.center, 2, { unit: u,
      mistakes: [{ value: -th.center, why: 'Keep the order: group 1 minus group 2.' }, { value: ta.center + tb.center, why: 'The mean of a difference is the difference of the means.' }] }));
    steps.push(num('sd', tx('Standard deviation of $' + S + '$:'), th.sd, isP ? 4 : 3, { unit: u,
      mistakes: [{ value: ta.sd + tb.sd, why: 'Standard deviations do not add. Variances add: square each, add, then take the square root.' },
        { value: Math.sqrt(Math.abs(va - vb)), why: 'Variances add even for a difference: the difference varies more than either statistic.' },
        { value: va + vb, why: 'That is the variance. Take the square root.' }] }));
    var cond;
    if(isP){
      var cs = [nA * a, nA * (1 - a), nB * b, nB * (1 - b)], okC = cs.every(function(x){ return x >= 10; });
      var list = cs.map(function(x){ return f(x, 1).replace(/\.0$/, ''); }).join(', ');
      cond = choice('counts', tx('Can a normal model be used for $' + S + '$?'), okC ? [
        ['Yes: all four expected counts (' + list + ') are at least 10.', 'Right. Large counts is checked in both groups, for successes and failures.'],
        [tx('Yes, because $n_1$ and $n_2$ are at least 30.'), 'For proportions check the four expected counts, not n ≥ 30.'],
        ['Only if the two samples are the same size.', 'The sample sizes may differ. The check is the four expected counts.'],
        ['No: the two proportions must be equal to use a normal model.', 'The proportions can differ. A normal model needs all four expected counts at least 10.']
      ] : [
        ['No: not all four expected counts (' + list + ') are at least 10.', 'Right. One expected count is under 10, so the shape is still skewed.'],
        [tx('Yes, because $n_1$ and $n_2$ are at least 30.'), 'For proportions check the four expected counts, not n ≥ 30.'],
        ['Yes, because the samples are independent.', 'Independence is needed too, but it does not make the shape normal. Check the four expected counts.'],
        ['Yes, as long as the samples are random.', 'Random samples are a separate condition. One expected count is under 10 here.']
      ]);
      th.normal = okC;
      sol.push(tx('Mean: $p_1 - p_2 = ' + t(a, 2) + ' - ' + t(b, 2) + ' = ' + t(th.center, 2) + '$.'));
      sol.push(tx('SD: $\\sqrt{\\frac{p_1(1 - p_1)}{n_1} + \\frac{p_2(1 - p_2)}{n_2}} = \\sqrt{\\frac{' + t(a, 2) + '(' + t(1 - a, 2) + ')}{' + nA + '} + \\frac{' + t(b, 2) + '(' + t(1 - b, 2) + ')}{' + nB + '}} = ' + t(th.sd, 4) + '$.'));
      sol.push('Expected counts: ' + list + (okC ? ', all at least 10.' : '; not all at least 10.'));
    } else {
      var okN = th.normal, normPop = /normal/.test(c.shape);
      cond = choice('shape', tx('Can a normal model be used for $' + S + '$?'), okN ? [
        [normPop ? 'Yes: both populations are normal, so each sample mean and their difference are normal.' : tx('Yes: $n_1 = ' + nA + '$ and $n_2 = ' + nB + '$ are both at least 30, so the Central Limit Theorem applies to each mean.'), 'Right. When each sample mean is approximately normal, so is their difference.'],
        ['Only if the two populations have the same standard deviation.', 'The standard deviations may differ; the formula adds the two variances.'],
        ['No: a difference of two means is never normal.', 'A difference of two independent approximately normal statistics is approximately normal.'],
        ['Yes, but only because the samples are the same size.', 'Equal sizes are not needed. The reason is the shape of each sampling distribution.']
      ] : [
        ['No: the populations are ' + c.shape + ' and ' + (nA < 30 ? tx('$n_1 = ' + nA + '$') : tx('$n_2 = ' + nB + '$')) + ' is less than 30.', 'Right. With a skewed population and a small sample, that sample mean is not approximately normal.'],
        ['Yes: a difference of two means is always approximately normal.', 'Each mean must be approximately normal first. A small sample from a skewed population is not.'],
        ['Yes, because the samples are independent.', 'Independence lets the variances add, but it does not fix the shape.'],
        ['Yes, as long as the standard deviations are equal.', 'Equal spreads do not make a skewed sampling distribution normal.']
      ]);
      sol.push(tx('Mean: $\\mu_1 - \\mu_2 = ' + t(a, 1) + ' - ' + t(b, 1) + ' = ' + t(th.center, 2) + '$ ' + c.unit + '.'));
      sol.push(tx('SD: $\\sqrt{\\frac{\\sigma_1^2}{n_1} + \\frac{\\sigma_2^2}{n_2}} = \\sqrt{\\frac{' + t(ta.sig, 1) + '^2}{' + nA + '} + \\frac{' + t(tb.sig, 1) + '^2}{' + nB + '}} = ' + t(th.sd, 3) + '$ ' + c.unit + '.'));
      sol.push(okN ? 'Shape: approximately normal, since each sample mean is.' : 'Shape: not approximately normal; a sample is small and the populations are ' + c.shape + '.');
    }
    steps.push(cond);
    var fig = { kind: 'normal', type: 'diff', center: th.center, sd: th.sd, unit: u, sym: isP ? 'p̂₁ − p̂₂' : 'x̄₁ − x̄₂', ok: th.normal, n: [nA, nB], pops: isP ? [{ p: a, name: gA.name }, { p: b, name: gB.name }] : [{ mu: a, sigma: ta.sig, shape: c.shape, name: '1' }, { mu: b, sigma: tb.sig, shape: c.shape, name: '2' }] };
    if(th.normal){
      var dir = th.center > 0 ? 'lt' : 'gt', sym = dir === 'lt' ? '<' : '>';
      var ps = probCell('prob', tx('Use a normal model to find $P(' + S + ' ' + sym + ' 0)$, the chance the sample difference has the "wrong" sign.'), 0, th.center, th.sd, dir, {
        mistakes: [wrongSd(th.center, ta.sd + tb.sd, 0, dir, 'That used the SDs added together. Add the variances, then take the square root.')] });
      steps.push(ps);
      fig.x = 0; fig.dir = dir; fig.pr = ps.p;
      sol.push(tx('$z = \\frac{0 - ' + '(' + t(th.center, 2) + ')}{' + t(th.sd, 4) + '} = ' + t(ps.z, 2) + '$, so $P(' + S + ' ' + sym + ' 0) = ' + t(ps.p, 4) + '$.'));
    } else sol.push('No probability from a normal model here: its condition is not met.');
    return { ctx: c.id, topic: c.topic, type: 'diff', text: text, steps: steps, solution: sol, figure: fig, given: isP ? { kind: 'prop', p1: a, p2: b, n1: nA, n2: nB, dir: fig.dir } : { kind: 'mean', mu1: a, mu2: b, s1: ta.sig, s2: tb.sig, n1: nA, n2: nB, shape: c.shape, dir: fig.dir } };
  }

  /* A tiny histogram (pure svg string) of simulated values on a fixed axis. */
  function miniHist(vals, lo, hi, bins, label){
    var W = 240, H = 96, pl = 6, pr = 6, pt = 6, pb = 20, cw = (W - pl - pr) / bins, cnt = [], mx = 0;
    for(var i = 0; i < bins; i++) cnt.push(0);
    vals.forEach(function(v){ var k = Math.floor((v - lo) / (hi - lo) * bins); if(k >= 0 && k < bins){ cnt[k]++; } });
    cnt.forEach(function(x){ if(x > mx) mx = x; });
    var bars = cnt.map(function(x, k){ var h = mx ? (H - pt - pb) * x / mx : 0; return h > 0 ? '<rect x="' + (pl + k * cw + 0.5).toFixed(1) + '" y="' + (H - pb - h).toFixed(1) + '" width="' + Math.max(0.5, cw - 1).toFixed(1) + '" height="' + h.toFixed(1) + '"/>' : ''; }).join('');
    var tk = [0, 0.5, 1].map(function(q){ var v = lo + q * (hi - lo), x = pl + q * (W - pl - pr); return '<text x="' + x.toFixed(1) + '" y="' + (H - 5) + '" text-anchor="' + (q === 0 ? 'start' : q === 1 ? 'end' : 'middle') + '">' + (+v.toFixed(1)) + '</text>'; }).join('');
    return '<svg class="sd-mini" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(label) + '"><g class="sd-mini-bars">' + bars + '</g><line class="sd-mini-ax" x1="' + pl + '" x2="' + (W - pr) + '" y1="' + (H - pb) + '" y2="' + (H - pb) + '"/>' + tk + '</svg>';
  }
  function describe(vals){ var Dd = D(); return 'mean ' + f(Dd.mean(vals), 1) + ', SD ' + f(Dd.sd(vals), 1); }

  /* The CLT in pictures: which histogram is the sampling distribution? */
  function genShape(r, c){
    var pop = population(POPS[c.pop]), n = r.pick(c.ns || [2, 3, 4, 5, 9]), big = n * 16, K = 300;
    var right = simulate(r, pop, n, K), one = simulate(r, pop, 1, K), narrow = simulate(r, pop, big, K);
    var lo = pop.lo, hi = pop.hi, bins = 30, d = c.d == null ? 1 : c.d;
    var mu = M.round(pop.mu, d), sg = M.round(pop.sigma, d), se = sg / Math.sqrt(n);
    var lab = function(w, v){ return 'Histogram of ' + K + ' simulated values: ' + w + ' (' + describe(v) + ')'; };
    var pics = [[right, 'Right. These ' + K + ' sample means center at μ with SD close to σ/√n = ' + f(se, 2) + '.'],
      [one, 'That is just like the population: single values, SD close to σ = ' + f(sg, 1) + '. Means of ' + n + ' values vary less.'],
      [narrow, 'Too narrow: that is what means of ' + big + ' values look like. With n = ' + n + ' the SD is about ' + f(se, 2) + '.']];
    var pic = step('pic', tx('Each picture shows ' + K + ' simulated values on the same scale. Which one is the sampling distribution of $\\bar{x}$ for samples of $n = ' + n + '$?'),
      { kind: 'choice', options: pics.map(function(x, i){ return 'Picture of ' + ['sample means, n = ' + n, 'single values', 'sample means, n = ' + big][i]; }), why: pics.map(function(x){ return x[1]; }), correct: 0,
        optionsHtml: pics.map(function(x, i){ return miniHist(x[0], lo, hi, bins, lab(['candidate', 'candidate', 'candidate'][i], x[0])); }) });
    var text = '<p>' + um(c.lead + ' The population of ' + POPS[c.pop].whats + ' is ' + POPS[c.pop].shapeWord + ' with $\\mu = ' + t(mu, d) + '$ and $\\sigma = ' + t(sg, d) + '$ ' + POPS[c.pop].unit + '. A computer takes ' + K + ' random samples of $n = ' + n + '$ and records each sample mean $\\bar{x}$.') + '</p>';
    var m = r.pick([4, 9, 16]), root = Math.sqrt(m), word = { 2: 'half', 3: 'one third', 4: 'one fourth' }[root];
    var steps = [pic,
      num('sd', tx('The standard deviation of the sampling distribution of $\\bar{x}$:'), se, 2, { unit: POPS[c.pop].unit,
        mistakes: [{ value: sg, why: 'That is σ, for single values. Divide by √n.' }, { value: sg / n, why: 'Divide by the square root of n, not n.' }] }),
      choice('grow', tx('If the sample size were ' + m + ' times as large ($n = ' + n * m + '$), the standard deviation of $\\bar{x}$ would be'), [
        [word + ' as large', 'Right. σ/√n: multiplying n by ' + m + ' divides the SD by √' + m + ' = ' + root + '.'],
        ['one ' + (m === 4 ? 'fourth' : m === 9 ? 'ninth' : 'sixteenth') + ' as large', 'The SD shrinks with the square root of n: by a factor of ' + root + ', not ' + m + '.'],
        ['the same, because the population did not change', 'The population SD σ stays the same, but the SD of x̄ is σ/√n, so it shrinks.'],
        [root + ' times as large', 'Larger samples give less variable means, not more.']])];
    var sol = ['The sampling distribution of x̄ centers at μ = ' + f(mu, d) + ' with a smaller spread than the population.',
      tx('$\\sigma_{\\bar{x}} = \\frac{\\sigma}{\\sqrt{n}} = \\frac{' + t(sg, d) + '}{\\sqrt{' + n + '}} = ' + t(se, 2) + '$.'),
      'Multiplying n by ' + m + ' divides σ/√n by √' + m + ' = ' + root + '.'];
    return { ctx: c.id, topic: c.topic, type: 'shape', text: text, steps: steps, solution: sol, figure: { kind: 'pop', pop: c.pop },
      given: { mu: mu, sigma: sg, n: n, big: big, m: m, sds: [D().sd(right), D().sd(one), D().sd(narrow)], popSigma: pop.sigma } };
  }

  /* Bias and variability from three simulated sampling distributions. */
  function genEstimator(r, c){
    var theta = between(r, c.theta, c.d || 0), s = between(r, c.sd, c.d || 1);
    var names = M.shuffle(r, ['P', 'Q', 'R']), sign = r() < 0.5 ? -1 : 1;
    var roles = { best: names[0], wide: names[1], biased: names[2] };
    var spec = {}; spec[roles.best] = { bias: 0, sd: s }; spec[roles.wide] = { bias: 0, sd: 2.3 * s }; spec[roles.biased] = { bias: sign * 2.2 * s, sd: 0.55 * s };
    var K = 200, q = stream(r), rows = ['P', 'Q', 'R'].map(function(nm){ var o = spec[nm], v = []; for(var i = 0; i < K; i++) v.push(M.normal(q, theta + o.bias, o.sd)); return { name: nm, values: v }; });
    var Dd = D(), stats = {}; rows.forEach(function(x){ stats[x.name] = { mean: Dd.mean(x.values), sd: Dd.sd(x.values) }; });
    var pair = [roles.best, roles.wide].sort().join(' and ');
    var text = '<p>' + um(c.lead + ' Three statistics, $P$, $Q$ and $R$, are proposed to estimate ' + c.param + '. The picture shows each statistic computed from ' + K + ' random samples; the line marks the true value, ' + c.sym + ' = ' + t(theta, c.d || 0) + '.') + '</p>';
    var biasedWord = 'Its values center near ' + f(stats[roles.biased].mean, c.d == null ? 0 : c.d + 1) + ', not at ' + f(theta, c.d || 0) + ': it is biased, consistently ' + (sign > 0 ? 'too high' : 'too low') + '.';
    var steps = [
      choice('unbiased', 'Which statistics appear to be unbiased estimators?', [
        [pair, 'Right. ' + pair + ' center at the true value; ' + roles.biased + ' does not.'],
        ['only ' + roles.best, roles.wide + ' is spread out, but it also centers at the true value, so it is unbiased too. Spread is variability, not bias.'],
        ['all three', biasedWord],
        [[roles.best, roles.biased].sort().join(' and '), roles.biased + ' is narrow, but narrow is not unbiased. ' + biasedWord]]),
      choice('spread', 'Which statistic has the least variability?', [
        [roles.biased, 'Right. ' + roles.biased + ' has the narrowest sampling distribution (SD about ' + f(stats[roles.biased].sd, (c.d || 0) + 1) + '), even though it is biased.'],
        [roles.best, roles.best + ' is close, but ' + roles.biased + ' is narrower. Variability is spread only, whatever the center.'],
        [roles.wide, roles.wide + ' is the most spread out.']]),
      choice('best', 'Which statistic is the best estimator here?', [
        [roles.best, 'Right. ' + roles.best + ' is unbiased and has low variability: its estimates land close to the true value.'],
        [roles.biased, 'Low variability is good, but ' + roles.biased + ' is biased. ' + biasedWord],
        [roles.wide, roles.wide + ' is unbiased, but its estimates are often far from the true value.']])];
    var sol = [pair + ' are unbiased: their sampling distributions center at the true value ' + f(theta, c.d || 0) + '.',
      roles.biased + ' has the least variability but is biased (center about ' + f(stats[roles.biased].mean, (c.d || 0) + 1) + ').',
      roles.best + ' is best: unbiased with low variability.'];
    return { ctx: c.id, topic: c.topic, type: 'estimator', text: text, steps: steps, solution: sol,
      figure: { kind: 'estimators', theta: theta, sym: c.sym, unit: c.unit || '', rows: rows, d: c.d || 0 }, given: { theta: theta, roles: roles } };
  }

  var GEN = { mean: genMean, prop: genProp, diff: genDiff, shape: genShape, estimator: genEstimator };
  M.register('samplingDistributions', {
    POPS: POPS, population: population, value: value, draw: draw, stream: stream, stat: stat, simulate: simulate,
    theory: theory, theoryDiff: theoryDiff, shapeWeights: shapeWeights, miniHist: miniHist,
    TYPES: Object.keys(GEN),
    generate: function(r, ctx, type){
      var ty = type && ctx.types.indexOf(type) > -1 ? type : r.pick(ctx.types);
      return GEN[ty](r, ctx);
    }
  });
})(typeof window !== 'undefined' ? window : globalThis);
