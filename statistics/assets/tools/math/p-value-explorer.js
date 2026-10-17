/* p-value explorer model: ApStatMath.pValueExplorer (docs/apstat-architecture.md, "Tools").
   OWNED BY THIS TOOL ONLY: no other tool edits this file, and this tool edits
   no shared file. Pure functions, no DOM, so the validator
   (scripts/lib/apstat-tool-checks/p-value-explorer.mjs) and the test
   (scripts/test/apstat-tool-p-value-explorer.test.mjs) run exactly this code.

   Every probability comes from ApStatDist (z1prop, t1, normCdf, invNorm, invT);
   simulations use the seeded generator (ApStatMath.rng, bernoulli, normal).

   Explore
     test(sc)                    { stat, se, df?, p, center, kind }: the test of a
                                 scenario sc = { kind: 'prop', p0, n, x, ha } or
                                 { kind: 'mean', mu0, s, n, xbar, ha }
     crit(kind, alpha, ha, df)   the critical value(s) of the statistic (z or t)
     errors(sc, alpha, pa)       a test about a proportion: the rejection region
                                 in p-hat units and, if the true proportion is pa,
                                 { typeI, typeII, power, cuts, se0, sdA }
                                 (the normal model of p-hat, as on the exam)
     simulateTypeI(r, p0, n, alpha, ha, reps)  the rejection rate of the z test
                                 when H0 is true (a check of the model)
   Test yourself
     generate(rng, context, type) -> { ctx, topic, type, text, steps, solution, data }
       types: pvalue (one-proportion z test), tmean (one-sample t test),
              meaning (what a p-value says), errors (Type I, Type II, power)
     Text uses $...$ TeX; the page renders it (ApStatTex). */
(function(){
  'use strict';
  var M = window.ApStatMath;
  if(!M) return;
  function D(){ return M.Dist(); }

  /* ------------------------------------------------------------ numbers */
  function F(x, d){ return M.fixed(x, d == null ? 2 : d); }
  // A number for text: real minus sign, given places.
  function N(x, d){ var s = F(x, d); return s.charAt(0) === '-' ? '−' + s.slice(1) : s; }
  function A(a){ return a === 0.1 ? '0.10' : String(a); } // α as printed
  function q0(p0){ return String(M.round(1 - p0, 6)); }
  function P4(p){ return p < 0.00005 ? '0.0000' : F(p, 4); } // drills never ask below 0.00005, so a shown p-value is never 0.0000 // shown p-value
  function pText(p){ return p < 0.0001 ? 'less than 0.0001' : F(p, 4); }
  var HA_TEX = { greater: '>', less: '<', two: '\\ne' };
  var HA_WORD = { greater: 'greater than', less: 'less than', two: 'different from' };

  /* ------------------------------------------------------------ explore */
  function test(sc){
    var Dd = D(), r;
    if(sc.kind === 'mean'){
      r = Dd.t1(sc.xbar, sc.mu0, sc.s, sc.n);
      return { kind: 't', stat: r.t, se: r.se, df: r.df, p: r.p[sc.ha], all: r.p, center: sc.mu0, obs: sc.xbar };
    }
    var phat = sc.x / sc.n;
    r = Dd.z1prop(phat, sc.p0, sc.n);
    return { kind: 'z', stat: r.z, se: r.se, p: r.p[sc.ha], all: r.p, center: sc.p0, obs: phat };
  }
  function crit(kind, alpha, ha, df){
    var q = ha === 'two' ? 1 - alpha / 2 : 1 - alpha, Dd = D();
    return kind === 't' ? Dd.invT(q, df) : Dd.invNorm(q);
  }
  /* The z test about a proportion: reject H0 when p-hat is beyond the cut(s).
     Under p = pa, p-hat is about normal with mean pa and SD sqrt(pa(1 - pa)/n). */
  function errors(sc, alpha, pa){
    var Dd = D(), n = sc.n, p0 = sc.p0, se0 = Math.sqrt(p0 * (1 - p0) / n), zs = crit('z', alpha, sc.ha);
    var sdA = Math.sqrt(pa * (1 - pa) / n), cuts, power;
    if(sc.ha === 'greater'){ cuts = { hi: p0 + zs * se0 }; power = 1 - Dd.normCdf((cuts.hi - pa) / sdA); }
    else if(sc.ha === 'less'){ cuts = { lo: p0 - zs * se0 }; power = Dd.normCdf((cuts.lo - pa) / sdA); }
    else { cuts = { lo: p0 - zs * se0, hi: p0 + zs * se0 }; power = Dd.normCdf((cuts.lo - pa) / sdA) + 1 - Dd.normCdf((cuts.hi - pa) / sdA); }
    return { typeI: alpha, typeII: 1 - power, power: power, cuts: cuts, se0: se0, sdA: sdA, zStar: zs };
  }
  function simulateTypeI(r, p0, n, alpha, ha, reps){
    var rej = 0;
    for(var i = 0; i < reps; i++){
      var x = M.bernoulli(r, p0, n), t = D().z1prop(x / n, p0, n);
      if(t.p[ha] < alpha) rej++;
    }
    return rej / reps;
  }

  /* ------------------------------------------------------------ cells */
  // Tolerances follow docs/apstat-spec.md section 7, rule 2.
  function zCell(a, ms){ return M.cell(a, 0, ms, 0.02); }
  function pCell(a, alt, ms){
    var abs = a < 0.05 ? 0.00006 : 0.005, rel = a < 0.05 ? 0.1 : 0;
    if(alt != null) abs = Math.max(abs, Math.abs(alt - a) - rel * a + 0.00006);
    return M.cell(a, rel, ms, abs);
  }
  function probCell(a, ms){ return a < 0.1 ? M.cell(a, 0.01, ms, 0.00006) : M.cell(a, 0, ms, 0.002); }
  function seCell(a, ms){ return M.cell(a, 0.01, ms, 0.00006); }
  function intCell(a, ms){ return M.cell(a, 0, ms, 1e-9); }
  function choice(key, practice, label, opts, correct, hint){
    // opts: [{ t, why }]; the first is the key unless correct says otherwise.
    var s = { key: key, kind: 'choice', practice: practice, label: label, options: opts.map(function(o){ return o.t; }), why: opts.map(function(o){ return o.why; }), correct: correct || 0 };
    if(hint) s.hint = hint;
    return s;
  }

  /* ------------------------------------------------------------ text pieces */
  function propParam(c){ return 'the true proportion of all ' + c.pop + ' ' + (c.rel || 'who') + ' ' + c.trait; }
  function meanParam(c){ return 'the true mean ' + c.measure + ' of all ' + c.pop; }
  function hyp(sym, v, ha){ return '$H_0: ' + sym + ' = ' + v + '$ and $H_a: ' + sym + ' ' + HA_TEX[ha] + ' ' + v + '$'; }
  function tailOptions(ha, statTex){
    var o = [
      { k: 'greater', t: 'The area to the right of ' + statTex + ' under the null distribution' },
      { k: 'less', t: 'The area to the left of ' + statTex + ' under the null distribution' },
      { k: 'two', t: 'The area in both tails, beyond ' + statTex + ' and its mirror image' }
    ];
    var why = {
      greater: 'A "greater than" alternative counts results at least as large as the one observed: the right tail.',
      less: 'A "less than" alternative counts results at least as small as the one observed: the left tail.',
      two: 'A "different from" alternative counts results at least as far from the null value on either side: both tails.'
    };
    var opts = o.map(function(x){ return { t: x.t, why: x.k === ha ? why[ha] : 'Not this one. ' + why[ha] + ' The tail comes from $H_a$, not from where the sample happened to land.' }; });
    var correct = o.map(function(x){ return x.k; }).indexOf(ha);
    return { opts: opts, correct: correct };
  }
  function decideStep(p, alpha, practice){
    var ps = P4(p), a = A(alpha), less = p < alpha;
    var opts = [
      { t: 'Because the p-value of ' + ps + ' is ' + (less ? 'less' : 'greater') + ' than $\\alpha = ' + a + '$, ' + (less ? 'reject $H_0$.' : 'fail to reject $H_0$.'), why: less ? 'A p-value below α is unusual enough under $H_0$ to reject it.' : 'A p-value above α is not unusual enough under $H_0$, so we fail to reject it.' },
      { t: 'Because the p-value of ' + ps + ' is ' + (less ? 'less' : 'greater') + ' than $\\alpha = ' + a + '$, ' + (less ? 'fail to reject $H_0$.' : 'reject $H_0$.'), why: 'The comparison is right but the decision is reversed: reject $H_0$ only when the p-value is less than α.' },
      { t: 'Because the p-value of ' + ps + ' is ' + (less ? 'greater' : 'less') + ' than $\\alpha = ' + a + '$, ' + (less ? 'fail to reject $H_0$.' : 'reject $H_0$.'), why: 'Check the inequality: ' + ps + ' is ' + (less ? 'less' : 'greater') + ' than ' + a + '.' },
      { t: 'Because the p-value of ' + ps + ' is ' + (less ? 'less' : 'greater') + ' than $\\alpha = ' + a + '$, ' + (less ? 'accept $H_a$ as proven.' : 'accept $H_0$.'), why: less ? 'A test never proves anything; it gives convincing evidence. Say "reject $H_0$".' : 'We never "accept" $H_0$: a large p-value only means the data are not convincing. Say "fail to reject $H_0$".' }
    ];
    return choice('decide', practice, 'Compare the p-value with α and decide.', opts, 0);
  }
  function concludeStep(reject, param, ha, v, statWord, practice){
    var dir = HA_WORD[ha];
    var opts = reject ? [
      { t: 'There is convincing evidence that ' + param + ' is ' + dir + ' ' + v + '.', why: 'The evidence language, the parameter in context and the direction of $H_a$.' },
      { t: 'There is convincing evidence that the sample ' + statWord + ' is ' + dir + ' ' + v + '.', why: 'The conclusion is about the population parameter, not the sample: the sample value is known exactly.' },
      { t: 'This proves that ' + param + ' is ' + dir + ' ' + v + '.', why: 'A test gives evidence, never proof: a small p-value can happen by chance even when $H_0$ is true.' },
      { t: 'There is convincing evidence that ' + param + ' is equal to ' + v + '.', why: 'Rejecting $H_0$ gives evidence for $H_a$ (' + dir + ' ' + v + '), not for $H_0$.' }
    ] : [
      { t: 'There is not convincing evidence that ' + param + ' is ' + dir + ' ' + v + '.', why: 'Failing to reject $H_0$ means the data are not convincing evidence for $H_a$, in context.' },
      { t: 'There is convincing evidence that ' + param + ' is equal to ' + v + '.', why: 'Failing to reject never shows $H_0$ is true; it only means the evidence for $H_a$ is not convincing.' },
      { t: 'This proves that ' + param + ' is ' + v + '.', why: 'A test never proves $H_0$. A large p-value says the data are consistent with it, nothing more.' },
      { t: 'There is not convincing evidence that the sample ' + statWord + ' is ' + dir + ' ' + v + '.', why: 'The conclusion is about the population parameter, not the sample, and the sample value is known exactly.' }
    ];
    return choice('conclude', practice, 'Which conclusion is written correctly, in context?', opts, 0);
  }

  /* ------------------------------------------------------------ problem kinds */
  var ALPHAS = [0.05, 0.05, 0.05, 0.01, 0.10];
  // A one-proportion sample whose p-value is clear of α (so the decision is
  // never a rounding call).
  function propSample(r, c){
    var Dd = D();
    for(var g = 0; g < 200; g++){
      var p0 = r.pick(c.p0s), n = r.pick(c.ns), ha = r.pick(c.has), alpha = r.pick(ALPHAS);
      var se = Math.sqrt(p0 * (1 - p0) / n), sgn = ha === 'less' ? -1 : ha === 'greater' ? 1 : (r() < 0.5 ? -1 : 1);
      var zT = 0.25 + r() * 2.9, x = Math.round(n * (p0 + sgn * zT * se));
      if(x <= 0 || x >= n) continue;
      var t = Dd.z1prop(x / n, p0, n), p = t.p[ha];
      if(Math.abs(p - alpha) < 0.012 || Math.abs(p - alpha) < 0.25 * alpha || p < 0.00005) continue;
      if(Math.abs(t.z) < 0.15) continue;
      var tz = Dd.tableRoute('normal', t.z), pTab = ha === 'less' ? tz : ha === 'greater' ? 1 - tz : 2 * Math.min(tz, 1 - tz);
      if((pTab < alpha) !== (p < alpha)) continue;
      return { p0: p0, n: n, ha: ha, alpha: alpha, x: x, phat: x / n, se: se, z: t.z, p: p, pTab: pTab, all: t.p };
    }
    throw new Error('pValueExplorer: no clear sample for context ' + c.id);
  }
  function propText(c, s){
    return '<p>' + c.who + ' wants to know whether the proportion of all ' + c.pop + ' ' + (c.rel || 'who') + ' ' + c.trait + ' is ' + HA_WORD[s.ha] + ' ' + s.p0 + '. ' +
      'In a random sample of ' + s.n + ' ' + c.unit + ', ' + s.x + ' ' + c.trait + '.</p>' +
      '<p>Test ' + hyp('p', s.p0, s.ha) + ' at $\\alpha = ' + A(s.alpha) + '$, where $p$ is ' + propParam(c) + '. The conditions are met.</p>';
  }

  function genPvalue(r, c){
    var s = propSample(r, c), param = propParam(c);
    var seWrong = Math.sqrt(s.phat * (1 - s.phat) / s.n), zWrong = (s.phat - s.p0) / seWrong, pWrongSE = tailFromZ(zWrong, s.ha);
    var tails = tailOptions(s.ha, 'the observed $z$');
    var one = s.ha === 'two' ? Math.min(s.all.less, s.all.greater) : null;
    var pms = [
      { value: pWrongSE, why: 'That p-value comes from a $z$ built with $\\hat{p}$ in the standard error. A test assumes $H_0$, so the SE uses $p_0 = ' + s.p0 + '$.' },
      { value: 1 - s.p, why: 'That is the area on the other side of $z$. The p-value is the area in the direction of $H_a$ (' + HA_WORD[s.ha] + ').' }
    ];
    if(one != null) pms.push({ value: one, why: 'That is one tail only. For $H_a: p \\ne ' + s.p0 + '$ the p-value counts both tails: double it.' });
    else pms.push({ value: Math.min(1, 2 * s.p), why: 'That doubles the tail. Doubling is only for a two-sided $H_a$ (≠); this one is one-sided.' });
    var steps = [
      choice('tail', '3.E', 'Which area is the p-value?', tails.opts, tails.correct),
      { key: 'se', kind: 'num', practice: '3.E', d: 4, label: 'The standard error of $\\hat{p}$ when $H_0$ is true.', hint: '$\\text{SE} = \\sqrt{p_0(1 - p_0)/n}$',
        cell: seCell(s.se, [{ value: seWrong, why: 'That uses $\\hat{p}$. A test assumes $H_0$ is true, so the SE uses $p_0 = ' + s.p0 + '$: $\\sqrt{' + s.p0 + '(' + q0(s.p0) + ')/' + s.n + '}$.' },
          { value: s.p0 * (1 - s.p0) / s.n, why: 'That is the variance. Take the square root to get the standard error.' }]) },
      { key: 'z', kind: 'num', practice: '3.E', d: 2, label: 'The test statistic $z$.', hint: '$z = (\\hat{p} - p_0)/\\text{SE}$, with $\\hat{p} = ' + s.x + '/' + s.n + '$',
        cell: zCell(s.z, [{ value: zWrong, why: 'That $z$ uses $\\hat{p}$ in the standard error. Use $p_0$: the SE is ' + F(s.se, 4) + '.' }]) },
      { key: 'p', kind: 'num', practice: '3.E', d: 4, label: 'The p-value.', hint: 'The ' + (s.ha === 'two' ? 'two tails' : s.ha === 'greater' ? 'right tail' : 'left tail') + ' of the standard normal beyond $z$.', cell: pCell(s.p, s.pTab, pms) },
      decideStep(s.p, s.alpha, '4.G'),
      concludeStep(s.p < s.alpha, param, s.ha, s.p0, 'proportion', '4.F')
    ];
    var sol = [
      'The p-value is the ' + (s.ha === 'two' ? 'area in both tails' : s.ha === 'greater' ? 'area to the right' : 'area to the left') + ' of the observed $z$ under the standard normal, because $H_a$ says the proportion is ' + HA_WORD[s.ha] + ' ' + s.p0 + '.',
      '$\\hat{p} = ' + s.x + '/' + s.n + ' = ' + F(s.phat, 4) + '$ and $\\text{SE} = \\sqrt{\\frac{p_0(1 - p_0)}{n}} = \\sqrt{\\frac{' + s.p0 + '(' + q0(s.p0) + ')}{' + s.n + '}} = ' + F(s.se, 4) + '$.',
      '$z = \\frac{\\hat{p} - p_0}{\\text{SE}} = \\frac{' + F(s.phat, 4) + ' - ' + s.p0 + '}{' + F(s.se, 4) + '} = ' + N(s.z, 2) + '$.',
      'p-value $= ' + pExpr(s.ha, s.z) + ' = ' + P4(s.p) + '$ (technology: a one-proportion z test; from Table A with $z = ' + N(M.round(s.z, 2), 2) + '$ it is ' + P4(s.pTab) + ').',
      'Because the p-value of ' + P4(s.p) + ' is ' + (s.p < s.alpha ? 'less' : 'greater') + ' than $\\alpha = ' + A(s.alpha) + '$, we ' + (s.p < s.alpha ? 'reject' : 'fail to reject') + ' $H_0$. There ' + (s.p < s.alpha ? 'is' : 'is not') + ' convincing evidence that ' + param + ' is ' + HA_WORD[s.ha] + ' ' + s.p0 + '.'
    ];
    return { text: propText(c, s), steps: steps, solution: sol, data: { kind: 'prop', p0: s.p0, n: s.n, x: s.x, ha: s.ha, alpha: s.alpha }, fig: { kind: 'prop', p0: s.p0, n: s.n, x: s.x, ha: s.ha, alpha: s.alpha, reveal: 'p' } };
  }
  function tailFromZ(z, ha){
    var l = D().normCdf(z);
    return ha === 'less' ? l : ha === 'greater' ? 1 - l : Math.min(1, 2 * Math.min(l, 1 - l));
  }
  function pExpr(ha, z){
    var zz = N(z, 2);
    if(ha === 'greater') return 'P(Z \\ge ' + zz + ')';
    if(ha === 'less') return 'P(Z \\le ' + zz + ')';
    return '2P(Z \\ge ' + N(Math.abs(z), 2) + ')';
  }

  function genTmean(r, c){
    var Dd = D(), s, guard = 0;
    for(;;){
      if(guard++ > 300) throw new Error('pValueExplorer: no clear t sample for ' + c.id);
      var mu0 = r.pick(c.mu0s), n = r.pick(c.ns), ha = r.pick(c.has), alpha = r.pick(ALPHAS);
      var sd = M.round(c.sRange[0] + r() * (c.sRange[1] - c.sRange[0]), c.places);
      if(sd <= 0) continue;
      var se = sd / Math.sqrt(n), sgn = ha === 'less' ? -1 : ha === 'greater' ? 1 : (r() < 0.5 ? -1 : 1);
      var xbar = M.round(mu0 + sgn * (0.3 + r() * 3) * se, c.places);
      var t = Dd.t1(xbar, mu0, sd, n), p = t.p[ha];
      if(Math.abs(t.t) < 0.15 || Math.abs(p - alpha) < 0.012 || Math.abs(p - alpha) < 0.25 * alpha || p < 0.00005) continue;
      s = { mu0: mu0, n: n, ha: ha, alpha: alpha, s: sd, xbar: xbar, se: t.se, t: t.t, df: t.df, p: p, all: t.p };
      break;
    }
    var param = meanParam(c), u = c.units ? ' ' + c.units : '';
    var tWrongS = (s.xbar - s.mu0) / s.s, tWrongN = (s.xbar - s.mu0) / (s.s / Math.sqrt(s.n - 1));
    var pZ = tailFromZ(s.t, s.ha), one = s.ha === 'two' ? Math.min(s.all.less, s.all.greater) : null;
    var pms = [
      { value: pZ, why: 'That is the standard normal area. With $s$ in place of σ the statistic has a $t$ distribution with $df = ' + s.df + '$, which has fatter tails.' },
      { value: 1 - s.p, why: 'That is the area on the other side of $t$. The p-value is the area in the direction of $H_a$ (' + HA_WORD[s.ha] + ').' },
      one != null ? { value: one, why: 'That is one tail only. A two-sided $H_a$ counts both tails: double it.' } : { value: Math.min(1, 2 * s.p), why: 'That doubles the tail; doubling is only for a two-sided $H_a$.' }
    ];
    var steps = [
      { key: 'df', kind: 'num', practice: '3.E', d: 0, label: 'The degrees of freedom.', cell: intCell(s.df, [{ value: s.n, why: 'For a one-sample $t$ test, $df = n - 1$, not $n$.' }]) },
      { key: 't', kind: 'num', practice: '3.E', d: 2, label: 'The test statistic $t$.', hint: '$t = (\\bar{x} - \\mu_0)/(s/\\sqrt{n})$',
        cell: zCell(s.t, [{ value: tWrongS, why: 'That divides by $s$. Divide by the standard error $s/\\sqrt{n} = ' + F(s.se, 4) + '$.' }, { value: tWrongN, why: 'The standard error uses $\\sqrt{n}$, not $\\sqrt{n - 1}$; the $n - 1$ is only in the df.' }]) },
      { key: 'p', kind: 'num', practice: '3.E', d: 4, label: 'The p-value.', hint: 'The ' + (s.ha === 'two' ? 'two tails' : s.ha === 'greater' ? 'right tail' : 'left tail') + ' of the $t$ distribution with $df = ' + s.df + '$.', cell: pCell(s.p, null, pms) },
      decideStep(s.p, s.alpha, '4.G'),
      concludeStep(s.p < s.alpha, param, s.ha, s.mu0 + u, 'mean', '4.F')
    ];
    var text = '<p>' + c.claim.replace('{mu0}', s.mu0 + u) + ' ' + c.who + ' suspects the mean is ' + HA_WORD[s.ha] + ' ' + s.mu0 + u + '. A random sample of ' + s.n + ' ' + c.item + ' has $\\bar{x} = ' + F(s.xbar, c.places) + '$' + u + ' and $s = ' + F(s.s, c.places) + '$' + u + '.</p>' +
      '<p>Test ' + hyp('\\mu', s.mu0, s.ha) + ' at $\\alpha = ' + A(s.alpha) + '$, where $\\mu$ is ' + param + '. The conditions are met.</p>';
    var sol = [
      '$df = n - 1 = ' + s.n + ' - 1 = ' + s.df + '$.',
      '$t = \\frac{\\bar{x} - \\mu_0}{s/\\sqrt{n}} = \\frac{' + F(s.xbar, c.places) + ' - ' + s.mu0 + '}{' + F(s.s, c.places) + '/\\sqrt{' + s.n + '}} = ' + N(s.t, 2) + '$.',
      'p-value $= ' + (s.ha === 'greater' ? 'P(t \\ge ' + N(s.t, 2) + ')' : s.ha === 'less' ? 'P(t \\le ' + N(s.t, 2) + ')' : '2P(t \\ge ' + N(Math.abs(s.t), 2) + ')') + ' = ' + P4(s.p) + '$ with $df = ' + s.df + '$ (technology: a one-sample t test).',
      'Because the p-value of ' + P4(s.p) + ' is ' + (s.p < s.alpha ? 'less' : 'greater') + ' than $\\alpha = ' + A(s.alpha) + '$, we ' + (s.p < s.alpha ? 'reject' : 'fail to reject') + ' $H_0$. There ' + (s.p < s.alpha ? 'is' : 'is not') + ' convincing evidence that ' + param + ' is ' + HA_WORD[s.ha] + ' ' + s.mu0 + u + '.'
    ];
    return { text: text, steps: steps, solution: sol, data: { kind: 'mean', mu0: s.mu0, n: s.n, s: s.s, xbar: s.xbar, ha: s.ha, alpha: s.alpha }, fig: { kind: 'mean', mu0: s.mu0, n: s.n, s: s.s, xbar: s.xbar, ha: s.ha, alpha: s.alpha, units: c.units, reveal: 'p' } };
  }

  function genMeaning(r, c){
    var s = propSample(r, c), ph = F(s.phat, 4), dirW = s.ha === 'greater' ? 'or greater' : s.ha === 'less' ? 'or less' : 'or farther from ' + s.p0;
    var tailWord = s.ha === 'two' ? 'at least as far from ' + s.p0 + ' as ' + ph + ' (in either direction)' : ph + ' ' + dirW;
    var opts = [
      { t: 'Assuming ' + propParam(c) + ' is ' + s.p0 + ', there is a ' + P4(s.p) + ' probability of getting a sample proportion ' + tailWord + ' by chance in a random sample of ' + s.n + '.', why: 'It assumes $H_0$, names the statistic and its direction, and keeps the context and the sample size.' },
      { t: 'There is a ' + P4(s.p) + ' probability that ' + propParam(c) + ' is ' + s.p0 + '.', why: 'A p-value is not the probability that $H_0$ is true. It is computed assuming $H_0$ is true.' },
      { t: 'Assuming ' + propParam(c) + ' is ' + s.p0 + ', there is a ' + P4(s.p) + ' probability of getting a sample proportion of exactly ' + ph + ' in a random sample of ' + s.n + '.', why: 'A p-value counts results at least as extreme as the one observed, not that exact value.' },
      { t: 'Assuming ' + propParam(c) + ' is ' + ph + ', there is a ' + P4(s.p) + ' probability of getting a sample proportion ' + tailWord + ' by chance.', why: 'The p-value assumes the null value ' + s.p0 + ', not the sample proportion ' + ph + '.' }
    ];
    var pics = { kind: 'tails', correct: s.ha };
    var picOpts = ['greater', 'less', 'two', 'center'];
    var picWhy = {
      greater: 'the right tail', less: 'the left tail', two: 'both tails', center: 'the middle'
    };
    var picStep = { key: 'shade', kind: 'choice', practice: '3.A', label: 'Which picture shades this p-value? The dot marks the observed $\\hat{p} = ' + ph + '$.',
      options: picOpts.map(function(k){ return 'Shaded: ' + picWhy[k]; }), correct: picOpts.indexOf(s.ha),
      why: picOpts.map(function(k){ return k === s.ha ? '$H_a$ says ' + HA_WORD[s.ha] + ' ' + s.p0 + ', so the p-value is ' + picWhy[k] + ' beyond the observed value.' : 'Not this one. $H_a$ says ' + HA_WORD[s.ha] + ' ' + s.p0 + ', so the p-value is ' + picWhy[s.ha] + ' beyond the observed value' + (k === 'center' ? '; the middle is the results closer to $p_0$ than this one.' : '.'); }),
      fixed: true, pics: { p0: s.p0, n: s.n, x: s.x, ha: s.ha, list: picOpts } };
    var twoStep = s.ha === 'two' ? choice('sides', '2.D', 'Suppose the alternative had been one-sided, in the direction the sample landed. What happens to the p-value?', [
        { t: 'It is cut in half, to ' + P4(s.p / 2) + '.', why: 'The one tail in the direction of the sample is half of the two-sided p-value.' },
        { t: 'It doubles, to ' + P4(Math.min(1, s.p * 2)) + '.', why: 'Doubling goes the other way: from one tail to two. One tail is half as big.' },
        { t: 'It stays ' + P4(s.p) + ', because the data are the same.', why: 'The data are the same, but the p-value counts only the results that support $H_a$, and that set changes.' },
        { t: 'It becomes ' + P4(1 - s.p / 2) + '.', why: 'That is the area on the far side of the sample. The one-sided tail in the direction of the sample is the smaller area.' }
      ]) : choice('sides', '2.D', 'Suppose the alternative had been two-sided ($H_a: p \\ne ' + s.p0 + '$). What happens to the p-value?', [
        { t: 'It doubles, to ' + P4(2 * s.p) + '.', why: 'A two-sided p-value counts both tails, twice the smaller tail.' },
        { t: 'It is cut in half, to ' + P4(s.p / 2) + '.', why: 'Halving goes the other way. Two tails hold more area than one, never less.' },
        { t: 'It stays ' + P4(s.p) + ', because the data are the same.', why: 'The data are the same, but a two-sided alternative counts results that are extreme in either direction.' },
        { t: 'It becomes ' + P4(1 - s.p) + '.', why: 'That is the complement: the area on the other side of the observed value.' }
      ]);
    var steps = [
      picStep,
      choice('meaning', '4.F', 'Which sentence interprets this p-value correctly?', opts, 0),
      twoStep
    ];
    var text = propText(c, s) + '<p>The p-value is ' + P4(s.p) + '.</p>';
    var sol = [
      'The p-value is the area ' + (s.ha === 'two' ? 'in both tails' : s.ha === 'greater' ? 'to the right' : 'to the left') + ' of $\\hat{p} = ' + ph + '$ under the null distribution, centred at $p_0 = ' + s.p0 + '$.',
      'Interpretation: assuming ' + propParam(c) + ' is ' + s.p0 + ', there is a ' + P4(s.p) + ' probability of getting a sample proportion ' + tailWord + ' by chance in a random sample of ' + s.n + '.',
      s.ha === 'two' ? 'A one-sided test in the direction of the sample counts only one of the two tails: ' + P4(s.p / 2) + '.' : 'A two-sided test counts both tails: twice this tail, ' + P4(2 * s.p) + '.'
    ];
    return { text: text, steps: steps, solution: sol, data: { kind: 'prop', p0: s.p0, n: s.n, x: s.x, ha: s.ha, alpha: s.alpha, given: s.p }, fig: { kind: 'prop', p0: s.p0, n: s.n, x: s.x, ha: s.ha, alpha: s.alpha } };
  }

  function genErrors(r, c){
    var Dd = D(), s = propSample(r, c), param = propParam(c), reject = s.p < s.alpha, dir = HA_WORD[s.ha];
    // A true value in the direction of Ha, 1 to 3.5 null SEs away.
    var sgn = s.ha === 'less' ? -1 : 1, pa, e;
    for(var g = 0; g < 100; g++){
      pa = M.round(s.p0 + sgn * (1 + r() * 2.5) * s.se, 3);
      if(pa <= 0.02 || pa >= 0.98 || Math.abs(pa - s.p0) < 0.005) continue;
      e = errors(s, s.alpha, pa);
      if(e.power > 0.08 && e.power < 0.97) break;
    }
    if(!e) throw new Error('pValueExplorer: no true value for ' + c.id);
    var beta = e.typeII;
    var whichOpts = reject ? [
      { t: 'A Type I error: rejecting $H_0$ when it is true.', why: 'The test rejected $H_0$, and rejecting a true $H_0$ is a Type I error.' },
      { t: 'A Type II error: failing to reject $H_0$ when it is false.', why: 'The test rejected $H_0$, so it cannot have failed to reject it. Only a Type I error is possible.' },
      { t: 'Both a Type I and a Type II error.', why: 'Each decision allows only one kind of error. Rejecting $H_0$ can only be a Type I error.' },
      { t: 'No error is possible, because the p-value is small.', why: 'A small p-value can still happen by chance when $H_0$ is true; that is a Type I error.' }
    ] : [
      { t: 'A Type II error: failing to reject $H_0$ when it is false.', why: 'The test failed to reject $H_0$, and failing to reject a false $H_0$ is a Type II error.' },
      { t: 'A Type I error: rejecting $H_0$ when it is true.', why: 'The test did not reject $H_0$, so a Type I error is impossible here.' },
      { t: 'Both a Type I and a Type II error.', why: 'Each decision allows only one kind of error. Failing to reject $H_0$ can only be a Type II error.' },
      { t: 'No error is possible, because we did not reject anything.', why: 'If $H_0$ is actually false, failing to reject it is a Type II error.' }
    ];
    var t1 = [
      { t: 'The true proportion of all ' + c.pop + ' ' + (c.rel || 'who') + ' ' + c.trait + ' is ' + s.p0 + ', but we find convincing evidence that it is ' + dir + ' ' + s.p0 + '.', why: 'The condition ($H_0$ is true) first, then the wrong decision, in context.' },
      { t: 'We find convincing evidence that ' + propParam(c) + ' is ' + dir + ' ' + s.p0 + '.', why: 'This leaves out the condition. A Type I error needs "when the true proportion really is ' + s.p0 + '".' },
      { t: 'The true proportion of all ' + c.pop + ' ' + (c.rel || 'who') + ' ' + c.trait + ' is ' + dir + ' ' + s.p0 + ', but we do not find convincing evidence that it is.', why: 'That is a Type II error: $H_a$ is true but the test misses it.' },
      { t: 'The sample proportion is ' + dir + ' ' + s.p0 + ' by chance alone.', why: 'Errors are about the decision and the truth about the population, not about the sample value.' }
    ];
    var incr = r.pick(['n', 'alpha', 'far']);
    var powOpts = {
      n: [{ t: 'Take a larger random sample.', why: 'A larger $n$ shrinks the spread of $\\hat{p}$, so the two distributions overlap less.' },
          { t: 'Take a smaller random sample.', why: 'A smaller sample spreads $\\hat{p}$ out, so the distributions overlap more and power falls.' },
          { t: 'Use a smaller significance level α.', why: 'A smaller α moves the cutoff away from $p_0$: fewer Type I errors, but less power.' },
          { t: 'Change nothing: power depends only on the sample you happened to get.', why: 'Power is a property of the test before any data: it depends on $n$, α and the true value.' }],
      alpha: [{ t: 'Use a larger significance level α.', why: 'A larger α moves the cutoff toward $p_0$, so more of the alternative distribution is in the rejection region (at the cost of more Type I errors).' },
          { t: 'Use a smaller significance level α.', why: 'A smaller α moves the cutoff away from $p_0$: fewer Type I errors, but less power.' },
          { t: 'Take a smaller random sample.', why: 'A smaller sample spreads $\\hat{p}$ out, so the distributions overlap more and power falls.' },
          { t: 'Report the p-value to more decimal places.', why: 'Rounding has nothing to do with power.' }],
      far: [{ t: 'The true proportion is farther from ' + s.p0 + ' than ' + pa + '.', why: 'A true value farther from $p_0$ moves the alternative distribution away from the null one, so the test detects it more often.' },
          { t: 'The true proportion is closer to ' + s.p0 + ' than ' + pa + '.', why: 'A true value close to $p_0$ is hard to tell apart from it: the distributions overlap more and power falls.' },
          { t: 'A smaller significance level is used.', why: 'A smaller α moves the cutoff away from $p_0$: less power.' },
          { t: 'A smaller random sample is taken.', why: 'A smaller sample spreads $\\hat{p}$ out, so power falls.' }]
    };
    var powLabel = incr === 'far' ? 'Which of these situations gives the test more power?' : 'Which change would increase the power of this test?';
    var steps = [
      choice('which', '2.D', 'The test ' + (reject ? 'rejected' : 'failed to reject') + ' $H_0$ (p-value ' + P4(s.p) + '). Which error could it have made?', whichOpts, 0),
      choice('typeI', '4.F', 'Which sentence describes a Type I error for this test, in context?', t1, 0),
      { key: 'pI', kind: 'num', practice: '2.D', d: 2, label: 'The probability of a Type I error for this test.', hint: 'It is set before the data are collected.', cell: probCell(s.alpha, [{ value: 1 - s.alpha, why: 'That is the probability of correctly failing to reject when $H_0$ is true. P(Type I) is α itself.' }]) },
      { key: 'power', kind: 'num', practice: '3.E', d: 4, label: 'If the true proportion is ' + pa + ', the probability of a Type II error is ' + P4(beta) + '. What is the power of the test against $p = ' + pa + '$?', cell: probCell(1 - M.round(beta, 4), [{ value: M.round(beta, 4), why: 'That is β, the probability of a Type II error. Power is $1 - \\beta$.' }, { value: 1 - s.alpha, why: 'That is $1 - \\alpha$. Power is $1 - \\beta$, the chance of rejecting when the true value is ' + pa + '.' }]) },
      choice('increase', '2.D', powLabel, powOpts[incr], 0)
    ];
    var text = propText(c, s);
    var sol = [
      'The test ' + (reject ? 'rejected' : 'failed to reject') + ' $H_0$, so the only possible error is ' + (reject ? 'a Type I error (rejecting a true $H_0$)' : 'a Type II error (failing to reject a false $H_0$)') + '.',
      'Type I error in context: ' + propParam(c) + ' is ' + s.p0 + ', but we find convincing evidence that it is ' + dir + ' ' + s.p0 + '.',
      'P(Type I error) $= \\alpha = ' + A(s.alpha) + '$.',
      'Power $= 1 - \\beta = 1 - ' + P4(beta) + ' = ' + P4(1 - M.round(beta, 4)) + '$: the probability that the test rejects $H_0$ when the true proportion is ' + pa + '.',
      'Power rises with a larger sample, a larger α, and a true value farther from $p_0$.'
    ];
    return { text: text, steps: steps, solution: sol, data: { kind: 'prop', p0: s.p0, n: s.n, x: s.x, ha: s.ha, alpha: s.alpha, pa: pa, beta: beta, incr: incr },
      fig: { kind: 'errors', p0: s.p0, n: s.n, ha: s.ha, alpha: s.alpha, pa: pa } };
  }

  var GEN = { pvalue: genPvalue, tmean: genTmean, meaning: genMeaning, errors: genErrors };
  function generate(r, ctx, type){
    var types = ctx.types || ['pvalue'];
    var t = type && types.indexOf(type) > -1 ? type : r.pick(types);
    var p = GEN[t](r, ctx);
    p.ctx = ctx.id; p.topic = ctx.topic; p.type = t;
    return p;
  }

  M.register('pValueExplorer', {
    test: test, crit: crit, errors: errors, simulateTypeI: simulateTypeI, generate: generate,
    tailFromZ: tailFromZ, HA_WORD: HA_WORD, HA_TEX: HA_TEX, P4: P4, pText: pText
  });
})();
