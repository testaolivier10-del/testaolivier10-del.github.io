/* Interval capture model: ApStatMath.ciCapture (docs/apstat-architecture.md, "Tools").
   OWNED BY THIS TOOL ONLY: no other tool edits this file, and this tool edits
   no shared file. Pure functions, no DOM, so the validator
   (scripts/lib/apstat-tool-checks/ci-capture.mjs) and the test
   (scripts/test/apstat-tool-ci-capture.test.mjs) run exactly this code.

   Loaded on statistics/tools/ci-capture.html after stat-expr.js (ApStatExpr),
   stat-dist.js (ApStatDist) and stat-tool-math.js (M.rng, M.cell, M.diagnose)
   and before statistics/assets/tools/ci-capture.js.

   Simulation
     value(r, setup)              one value from the population: normal, or
                                  skewed right (a gamma with shape 2: the sum of
                                  two exponentials, so mu and sigma are exact)
     sample(r, setup)             one random sample, summarized: { est, s?, x? }
     interval(smp, setup, level, o) -> ApStatDist.ci1prop / ci1mean
                                  { est, lo, hi, me, crit, se, df? }; o.z: the
                                  wrong z* for a mean (to see why t* is used)
     captures(iv, setup)          whether lo <= parameter <= hi
     batch(r, setup, k)           k samples
     param(setup)                 the true parameter (p or mu)
   Drills
     generate(rng, context, type) -> { ctx, topic, type, text, steps, solution, figure? }
       type 'prop' | 'mean' | 'claim' | 'capture' */
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
  function t(x, d){ return M.fixed(x, d); }
  function an(L){ return (/^(8|11|18)\b/.test(L) ? 'an ' : 'a ') + L; }
  function pct(level){ return String(+(level * 100).toFixed(1)) + '%'; }

  /* ------------------------------------------------------- simulation */
  function param(s){ return s.kind === 'prop' ? s.p : s.mu; }
  function value(r, s){
    if(s.shape === 'skewed'){
      // gamma(2, theta) + shift: mean shift + 2 theta, SD theta sqrt(2)
      var th = s.sigma / Math.SQRT2, sh = s.mu - 2 * th, u1 = 0, u2 = 0;
      while(u1 === 0) u1 = r(); while(u2 === 0) u2 = r();
      return sh - th * (Math.log(u1) + Math.log(u2));
    }
    return M.normal(r, s.mu, s.sigma);
  }
  /* One sample draws from a local stream seeded by one draw of the seeded
     generator (mulberry32 with Math.imul held locally), so the same seed
     gives the same sample and the validator's vm pays no global lookup per
     draw. */
  var IMUL = Math.imul;
  function stream(r){
    var q = (Math.floor(r() * 4294967296) >>> 0) || 1;
    return function(){ q = (q + 0x6D2B79F5) >>> 0; var t = q; t = IMUL(t ^ (t >>> 15), t | 1); t ^= t + IMUL(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }
  function sample(r, s){
    var q = stream(r);
    if(s.kind === 'prop'){ var x = 0; for(var j = 0; j < s.n; j++) if(q() < s.p) x++; return { x: x, est: x / s.n }; }
    var xs = [], Dd = D();
    for(var i = 0; i < s.n; i++) xs.push(value(q, s));
    return { est: Dd.mean(xs), s: Dd.sd(xs) };
  }
  function interval(smp, s, level, o){
    var Dd = D();
    if(s.kind === 'prop') return Dd.ci1prop(smp.est, s.n, level);
    var iv = Dd.ci1mean(smp.est, smp.s, s.n, level);
    if(o && o.z){ var z = Dd.invNorm(1 - (1 - level) / 2); iv = { est: iv.est, se: iv.se, crit: z, me: z * iv.se, lo: iv.est - z * iv.se, hi: iv.est + z * iv.se, df: iv.df }; }
    return iv;
  }
  function captures(iv, s){ var v = param(s); return iv.lo <= v && v <= iv.hi; }
  /* critical value for a level: z* for a proportion (or a mean with o.z), t* with n - 1 df for a mean */
  var CRIT = {};
  function crit(s, level, o){
    var Dd = D(), q = 1 - (1 - level) / 2, z = s.kind === 'prop' || (o && o.z), k = (z ? 'z' : 't' + (s.n - 1)) + ':' + level;
    if(!(k in CRIT)) CRIT[k] = z ? Dd.invNorm(q) : Dd.invT(q, s.n - 1);   // invT is slow: computed once per df and level
    return CRIT[k];
  }
  /* Many intervals at once (the explore picture): the critical value is
     found once with ApStatDist, then each interval is est +/- crit x SE,
     exactly as ci1prop / ci1mean compute it (the test checks they agree). */
  function intervals(smps, s, level, o){
    var c = crit(s, level, o), v = param(s), hits = 0, out = new Array(smps.length);
    for(var i = 0; i < smps.length; i++){
      var m = smps[i], se = s.kind === 'prop' ? Math.sqrt(m.est * (1 - m.est) / s.n) : m.s / Math.sqrt(s.n), me = c * se, lo = m.est - me, hi = m.est + me, hit = lo <= v && v <= hi;
      if(hit) hits++;
      out[i] = { est: m.est, se: se, me: me, lo: lo, hi: hi, hit: hit };
    }
    return { ivs: out, hits: hits, crit: c };
  }
  function batch(r, s, k){ var out = []; for(var i = 0; i < k; i++) out.push(sample(r, s)); return out; }

  /* ----------------------------------------------------------- drills */
  var SK = { phat: '3.E', crit: '3.E', df: '3.E', se: '3.E', me: '3.E', interp: '4.F', level: '4.F', count: '4.F', longrun: '4.F', claim: '4.G', wider: '4.F', bign: '4.F', mefrom: '3.E' };
  function step(key, label, o){ var s = { key: key, label: label, practice: SK[key] || '3.E' }; for(var k in o) s[k] = o[k]; return s; }
  function num(key, label, answer, d, o){
    o = o || {};
    var abs = Math.max(o.abs || 0, 0.6 * Math.pow(10, -d));
    return step(key, label, { kind: 'num', d: d, unit: o.unit, hint: o.hint, cell: M.cell(answer, 1e-6, o.mistakes || [], abs) });
  }
  function choice(key, label, opts){
    return step(key, label, { kind: 'choice', options: opts.map(function(x){ return x[0]; }), why: opts.map(function(x){ return x[1]; }), correct: 0 });
  }
  function between(r, ab, d){ return M.round(ab[0] + r() * (ab[1] - ab[0]), d); }
  function iv2(lo, hi, d){ return 'from ' + f(lo, d) + ' to ' + f(hi, d); }

  /* The wordings students choose between: the right one and the readings
     the Chief Reader Reports name ("95% of the data", a probability about
     this interval, the sample statistic, the method's level misread). */
  function interpOpts(L, ivTxt, what, n, who, isP, third){
    var par = isP ? 'the true proportion of ' + what : 'the true mean ' + what;
    return [
      ['We are ' + L + ' confident that the interval ' + ivTxt + ' captures ' + par + '.', 'Right. The interval estimates one number, the parameter, and "confident" names the method’s success rate.'],
      ['There is ' + an(L) + ' probability that ' + par + ' is ' + ivTxt.replace(/^from /, 'between ').replace(' to ', ' and ') + '.', 'The parameter is fixed and this interval either captures it or not. The ' + L + ' describes the method, so say "' + L + ' confident".'],
      third,
      ['We are ' + L + ' confident that the interval ' + ivTxt + ' captures the sample ' + (isP ? 'proportion' : 'mean') + '.', 'The sample statistic is always in its own interval, at the center. The interval estimates the population parameter.']
    ];
  }
  function levelOpts(L, n, who, isP){
    var par = isP ? 'the true proportion' : 'the true mean';
    return [
      ['If we took many random samples of ' + n + ' ' + who + ' and built ' + an(L) + ' interval from each, about ' + L + ' of those intervals would capture ' + par + '.', 'Right. The level is the long run capture rate of the method.'],
      ['About ' + L + ' of all random samples of this size would give a sample ' + (isP ? 'proportion' : 'mean') + ' inside this particular interval.', 'Other samples give other intervals. The level counts how often the intervals capture the parameter.'],
      ['There is ' + an(L) + ' chance that this particular interval is correct.', 'Once built, this interval either captures the parameter or not. The ' + L + ' is about the method over many samples.'],
      ['About ' + L + ' of the ' + who + ' in the sample are inside the interval.', 'The level is not about the individuals in the sample. It is how often the method’s intervals capture the parameter.']
    ];
  }

  function genProp(r, c){
    var Dd = D(), n = r.pick(c.ns), L0 = r.pick(c.levels || [0.9, 0.95, 0.99]), L = pct(L0), s = { kind: 'prop', p: between(r, c.p, 2), n: n };
    var smp = sample(r, s), x = smp.x;
    if(x < 10 || n - x < 10){ x = Math.max(10, Math.min(n - 10, x)); }
    var ph = x / n, z = Dd.invNorm(1 - (1 - L0) / 2), se = Math.sqrt(ph * (1 - ph) / n), me = z * se, lo = ph - me, hi = ph + me;
    var zt = { 0.9: 1.645, 0.95: 1.96, 0.99: 2.576 }[L0] || M.round(z, 3), ph3 = M.round(ph, 3), seR = Math.sqrt(ph3 * (1 - ph3) / n);
    var text = '<p>' + um(c.lead + ' In a random sample of $n = ' + n + '$ ' + c.who + ' from ' + c.popAll + ', $' + x + '$ ' + c.yes + '. Construct ' + an(L) + ' confidence interval for $p$, the proportion of ' + c.popAll + ' who ' + c.yes + '.') + '</p>';
    var hp = '\\hat{p}';
    var steps = [
      num('phat', tx('The sample proportion $' + hp + ' =$'), ph, 4, { abs: 0.0006, mistakes: [{ value: 1 - ph, why: 'That is the proportion who do not. Count the ones who ' + c.yes + '.' }] }),
      num('crit', tx('The critical value $z^* =$ for ' + L + ' confidence'), z, 3, { abs: 0.0051, mistakes: [
        { value: Dd.invNorm(L0), why: 'That leaves all of the ' + pct(1 - L0) + ' in one tail. A confidence interval splits it: ' + pct((1 - L0) / 2) + ' in each tail.' }] }),
      num('se', tx('The standard error $\\sqrt{\\frac{' + hp + '(1 - ' + hp + ')}{n}} =$'), se, 4, { abs: Math.max(0.00006, 1.3 * Math.abs(seR - se)), mistakes: [
        { value: ph * (1 - ph) / n, why: 'That is the square of the standard error. Take the square root.' },
        { value: Math.sqrt(ph / n), why: 'Include 1 − p̂ under the square root.' },
        { value: Math.sqrt(ph * (1 - ph)), why: 'Divide by n before taking the square root.' }] }),
      num('me', 'The margin of error, critical value × standard error =', me, 4, { abs: 0.00006 + 1.3 * (Math.abs(zt * M.round(seR, 4) - me) + z * 0.00005), mistakes: [
        { value: se, why: 'That is the standard error alone. Multiply it by z*.' },
        { value: 2 * me, why: 'That is the full width of the interval. The margin of error is half of it.' },
        { value: Dd.invNorm(L0) * se, why: 'That used a one-tail z*. Use z* = ' + f(z, 3) + '.' }] }),
      choice('interp', 'The interval is ' + iv2(lo, hi, 3) + '. Which sentence interprets it correctly?', interpOpts(L, iv2(lo, hi, 3), c.popAll + ' who ' + c.yes, n, c.who, true,
        ['Between ' + f(lo * 100, 1) + '% and ' + f(hi * 100, 1) + '% of the ' + n + ' ' + c.who + ' in the sample ' + c.yes + '.', 'The sample has one proportion, p̂ = ' + f(ph, 3) + ', known exactly. The interval is about the proportion of ' + c.popAll + '.'])),
      choice('level', 'Which sentence explains what ' + L + ' confidence means here?', levelOpts(L, n, c.who, true))
    ];
    var sol = [tx('$' + hp + ' = \\frac{' + x + '}{' + n + '} = ' + t(ph, 4) + '$.'),
      tx('$z^* = ' + t(z, 3) + '$ for ' + L + ' confidence (' + pct((1 - L0) / 2) + ' in each tail).'),
      tx('$\\text{SE} = \\sqrt{\\frac{' + t(ph, 4) + '(' + t(1 - ph, 4) + ')}{' + n + '}} = ' + t(se, 4) + '$.'),
      tx('$\\text{ME} = ' + t(z, 3) + ' \\times ' + t(se, 4) + ' = ' + t(me, 4) + '$, so the interval is $' + t(ph, 4) + ' \\pm ' + t(me, 4) + '$, ' + iv2(lo, hi, 3) + '.'),
      'We are ' + L + ' confident that the interval ' + iv2(lo, hi, 3) + ' captures the true proportion of ' + c.popAll + ' who ' + c.yes + '.'];
    return { ctx: c.id, topic: c.topic, type: 'prop', text: text, steps: steps, solution: sol, given: { x: x, n: n, level: L0 },
      figure: { kind: 'one', est: ph, lo: lo, hi: hi, me: me, crit: z, se: se, sym: '\\hat{p}', par: 'p', d: 3, L: L } };
  }

  function genMean(r, c){
    var Dd = D(), n = r.pick(c.ns), L0 = r.pick(c.levels || [0.9, 0.95, 0.99]), L = pct(L0), d = c.d == null ? 1 : c.d;
    var s = { kind: 'mean', mu: between(r, c.mu, d), sigma: between(r, c.sigma, d), n: n, shape: 'normal' };
    var smp = sample(r, s), xb = M.round(smp.est, d + 1), sd = M.round(smp.s, d + 1), df = n - 1;
    var tc = crit({ kind: 'mean', n: n }, L0), se = sd / Math.sqrt(n), me = tc * se, lo = xb - me, hi = xb + me;
    var tt = Dd.tableRoute('tcrit', L0, df), z = Dd.invNorm(1 - (1 - L0) / 2);
    var text = '<p>' + um(c.lead + ' A random sample of $n = ' + n + '$ ' + c.who + ' from ' + c.popAll + ' has mean ' + c.var + ' $\\bar{x} = ' + t(xb, d + 1) + '$ ' + c.unit + ' and standard deviation $s = ' + t(sd, d + 1) + '$ ' + c.unit + '. A graph of the sample shows no strong skew or outliers. Construct ' + an(L) + ' confidence interval for $\\mu$, the mean ' + c.var + ' of ' + c.popAll + '.') + '</p>';
    var steps = [
      num('df', 'Degrees of freedom, df =', df, 0, { mistakes: [{ value: n, why: 'For a one-sample t interval, df = n − 1.' }] }),
      num('crit', tx('The critical value $t^* =$'), tc, 3, { abs: Math.max(0.0006, 1.3 * Math.abs(tt - tc)), mistakes: [
        { value: z, why: 'That is z*. With s in place of σ, use t* with df = ' + df + ': it is a bit larger.' },
        { value: crit({ kind: 'mean', n: n }, 2 * L0 - 1), why: 'That puts all of the ' + pct(1 - L0) + ' in one tail. Split it between the two tails.' }] }),
      num('se', tx('The standard error $\\frac{s}{\\sqrt{n}} =$'), se, 3, { unit: c.unit, mistakes: [
        { value: sd, why: 'That is s, the spread of single values. Divide by √n.' },
        { value: sd / n, why: 'Divide by the square root of n, not n.' }] }),
      num('me', 'The margin of error, critical value × standard error =', me, 3, { unit: c.unit, abs: 0.0006 + 1.3 * (Math.abs(tt * M.round(se, 3) - me) + tc * 0.0005), mistakes: [
        { value: z * se, why: 'That used z*. The margin of error for a mean with s uses t* = ' + f(tc, 3) + '.' },
        { value: se, why: 'Multiply the standard error by t*.' },
        { value: 2 * me, why: 'That is the full width. The margin of error is half of it.' }] }),
      choice('interp', 'The interval is ' + iv2(lo, hi, d + 1) + ' ' + c.unit + '. Which sentence interprets it correctly?', interpOpts(L, iv2(lo, hi, d + 1) + ' ' + c.unit, c.var + ' of ' + c.popAll, n, c.who, false,
        ['About ' + L + ' of ' + c.popAll + ' have a ' + c.var + ' ' + iv2(lo, hi, d + 1).replace(/^from /, 'between ').replace(' to ', ' and ') + ' ' + c.unit + '.', 'The interval estimates one number, the population mean. Individual values vary much more than that ("' + L + ' of the data" is a common slip).']))
    ];
    var sol = ['df = n − 1 = ' + df + '.',
      tx('$t^* = ' + t(tc, 3) + '$ (technology; Table B row ' + Dd.tableDf(df) + ' gives ' + t(tt, 3) + ').'),
      tx('$\\text{SE} = \\frac{' + t(sd, d + 1) + '}{\\sqrt{' + n + '}} = ' + t(se, 3) + '$ ' + c.unit + '.'),
      tx('$\\text{ME} = ' + t(tc, 3) + ' \\times ' + t(se, 3) + ' = ' + t(me, 3) + '$, so the interval is ' + iv2(lo, hi, d + 1) + ' ' + c.unit + '.'),
      'We are ' + L + ' confident that the interval ' + iv2(lo, hi, d + 1) + ' ' + c.unit + ' captures the true mean ' + c.var + ' of ' + c.popAll + '.'];
    return { ctx: c.id, topic: c.topic, type: 'mean', text: text, steps: steps, solution: sol, given: { xbar: xb, s: sd, n: n, level: L0, d: d },
      figure: { kind: 'one', est: xb, lo: lo, hi: hi, me: me, crit: tc, se: se, sym: '\\bar{x}', par: 'μ', d: d + 1, unit: c.unit, L: L } };
  }

  /* A claim from an interval, and what changes it. */
  function genClaim(r, c){
    var Dd = D(), n = r.pick(c.ns), L0 = r.pick([0.9, 0.95]), L = pct(L0), s = { kind: 'prop', p: between(r, c.p, 2), n: n };
    var x = Math.max(10, Math.min(n - 10, sample(r, s).x)), ph = x / n, iv = Dd.ci1prop(ph, n, L0);
    var lo = M.round(iv.lo, 3), hi = M.round(iv.hi, 3), me = (hi - lo) / 2;
    var yes = r() < 0.5, p0 = yes ? M.round(lo - between(r, [0.01, 0.05], 2), 2) : M.round(lo + (hi - lo) * between(r, [0.2, 0.45], 2), 2);
    if(p0 <= 0.01) { p0 = M.round(lo + (hi - lo) * 0.3, 2); yes = false; }
    yes = p0 < lo;
    var text = '<p>' + um(c.lead + ' A random sample of $' + n + '$ ' + c.who + ' gives ' + an(L) + ' confidence interval for $p$, the proportion of ' + c.popAll + ' who ' + c.yes + ', from ' + t(lo, 3) + ' to ' + t(hi, 3) + '. ' + c.claimer + ' claims that more than $' + t(p0, 2) + '$ of ' + c.popAll + ' ' + c.yes + '.') + '</p>';
    var steps = [
      num('mefrom', 'The margin of error of this interval =', me, 4, { abs: 0.0006, mistakes: [{ value: hi - lo, why: 'That is the width. The margin of error is half the width.' }] }),
      choice('claim', 'Does the interval give convincing evidence for the claim?', yes ? [
        ['Yes: every value in the interval is greater than ' + t(p0, 2) + ', so the claim is supported.', 'Right. ' + t(p0, 2) + ' is below the whole interval, so it is not a plausible value for p.'],
        ['No: ' + t(p0, 2) + ' is close to the interval, so it is still plausible.', 'Plausible values are the ones inside the interval. ' + t(p0, 2) + ' is outside it, below every value.'],
        ['It proves that p is greater than ' + t(p0, 2) + '.', 'An interval gives convincing evidence, never proof: the method misses ' + pct(1 - L0) + ' of the time.'],
        ['Yes, because the sample proportion ' + t(ph, 3) + ' is greater than ' + t(p0, 2) + '.', 'A sample proportion above ' + t(p0, 2) + ' alone is not convincing; the whole interval must be above it.']
      ] : [
        ['No: ' + t(p0, 2) + ' is inside the interval, so it is a plausible value for p.', 'Right. Because ' + t(p0, 2) + ' is in the interval, the data do not rule it out.'],
        ['Yes: most of the interval is greater than ' + t(p0, 2) + '.', 'Most is not enough. A plausible value inside the interval means the claim is not convincingly supported.'],
        ['Yes, because the sample proportion ' + t(ph, 3) + ' is greater than ' + t(p0, 2) + '.', 'The interval includes ' + t(p0, 2) + ', so the sample does not give convincing evidence.'],
        ['It proves that p equals ' + t(p0, 2) + '.', 'Being inside the interval makes ' + t(p0, 2) + ' plausible, not proven. Many other values are plausible too.']
      ]),
      choice('wider', 'With the same sample, a 99% confidence interval would be', [
        ['wider, because z* is larger', 'Right. More confidence needs a larger critical value, so a larger margin of error.'],
        ['narrower, because we are more confident', 'More confidence means a wider net: z* grows from ' + f(Dd.invNorm(1 - (1 - L0) / 2), 3) + ' to 2.576.'],
        ['the same width, because the sample is the same', 'The standard error is the same, but z* changes with the level.'],
        ['centered at a different value', 'The center is still p̂ = ' + t(ph, 3) + '; only the margin of error changes.']]),
      choice('bign', 'With 4 times as many ' + c.who + ' and about the same sample proportion, the margin of error would be about', [
        ['half as large', 'Right. The standard error has √n in the denominator: √4 = 2.'],
        ['one fourth as large', 'The margin of error shrinks with the square root of n: by 2, not 4.'],
        ['twice as large', 'Larger samples give smaller margins of error.'],
        ['the same', 'A larger n makes the standard error smaller.']])
    ];
    var sol = ['ME = (' + t(hi, 3) + ' − ' + t(lo, 3) + ') ÷ 2 = ' + t(me, 4) + '.',
      yes ? 'Every value in the interval is greater than ' + t(p0, 2) + ', so the interval gives convincing evidence that p > ' + t(p0, 2) + '.' : t(p0, 2) + ' is inside the interval, a plausible value for p, so the interval does not give convincing evidence that p > ' + t(p0, 2) + '.',
      'A higher level uses a larger z*, so the interval is wider.', 'ME has √n in the denominator: 4 times n halves it.'];
    return { ctx: c.id, topic: c.topic, type: 'claim', text: text, steps: steps, solution: sol, given: { lo: lo, hi: hi, p0: p0, phat: ph, level: L0, n: n },
      figure: { kind: 'one', est: ph, lo: lo, hi: hi, me: me, sym: '\\hat{p}', par: 'p', d: 3, L: L, p0: p0 } };
  }

  /* What the level means, counted on simulated intervals. */
  function genCapture(r, c){
    var L0 = r.pick([0.8, 0.9, 0.95]), L = pct(L0), n = r.pick(c.ns), s = { kind: 'prop', p: between(r, c.p, 2), n: n }, K = 20;
    var ivs = batch(r, s, K).map(function(smp){ var iv = interval(smp, s, L0); iv.hit = captures(iv, s); return iv; });
    var hits = ivs.filter(function(v){ return v.hit; }).length;
    var text = '<p>' + um(c.lead + ' Suppose the true proportion of ' + c.popAll + ' who ' + c.yes + ' is $p = ' + t(s.p, 2) + '$. A computer takes ' + K + ' random samples of $n = ' + n + '$ and builds ' + an(L) + ' confidence interval from each. The picture shows all ' + K + ', with a line at the true value.') + '</p>';
    var steps = [
      num('count', 'How many of the ' + K + ' intervals capture p?', hits, 0, { hint: 'An interval captures p when the line crosses it.', mistakes: [{ value: K - hits, why: 'That counts the ones that miss. Count the intervals the line crosses.' }] }),
      num('longrun', 'If the computer kept going, about what percent of all the intervals would capture p?', L0 * 100, 0, { unit: '%', mistakes: hits === Math.round(L0 * K) ? [] : [{ value: hits / K * 100, why: 'That is this batch of ' + K + '. Over many intervals the rate settles at the confidence level.' }] }),
      choice('level', 'Which sentence explains ' + L + ' confidence?', levelOpts(L, n, c.who, true))
    ];
    var sol = [hits + ' of the ' + K + ' intervals cross the line at p = ' + t(s.p, 2) + '.',
      'In the long run about ' + L + ' of intervals built this way capture p; one batch of ' + K + ' can be above or below that.',
      'The level is the success rate of the method, not a chance about one interval.'];
    return { ctx: c.id, topic: c.topic, type: 'capture', text: text, steps: steps, solution: sol, given: { p: s.p, n: n, level: L0, ests: ivs.map(function(v){ return v.est; }) },
      figure: { kind: 'many', p: s.p, ivs: ivs.map(function(v){ return { lo: v.lo, hi: v.hi, est: v.est, hit: v.hit }; }), L: L } };
  }

  var GEN = { prop: genProp, mean: genMean, claim: genClaim, capture: genCapture };
  M.register('ciCapture', {
    param: param, value: value, sample: sample, interval: interval, captures: captures, batch: batch, crit: crit, intervals: intervals,
    TYPES: Object.keys(GEN),
    generate: function(r, ctx, type){
      var ty = type && ctx.types.indexOf(type) > -1 ? type : r.pick(ctx.types);
      return GEN[ty](r, ctx);
    }
  });
})(typeof window !== 'undefined' ? window : globalThis);
