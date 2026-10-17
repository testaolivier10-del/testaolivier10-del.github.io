/* Chi-square lab model: ApStatMath.chiSquareLab (docs/apstat-architecture.md, "Tools").
   OWNED BY THIS TOOL ONLY: no other tool edits this file, and this tool edits
   no shared file. Pure functions, no DOM, so the validator
   (scripts/lib/apstat-tool-checks/chi-square-lab.mjs) and the test
   (scripts/test/apstat-tool-chi-square-lab.test.mjs) run exactly this code.

   Every expected count, component, statistic and p-value comes from
   ApStatDist.chi2table / chi2Sf / invChi2; simulations use the seeded
   generator (ApStatMath.rng).

   Explore
     table(obs)                    ApStatDist.chi2table plus { signs, ok }: the
                                   sign of O - E per cell, and whether every
                                   expected count is at least 5
     chance(r, obs)                a table drawn when H0 is true: each row keeps
                                   its total, and its counts follow the pooled
                                   column proportions
     simulateTypeI(r, rowN, probs, alpha, reps)  the rejection rate when H0 is true
   Test yourself
     generate(rng, context, type) -> { ctx, topic, type, text, steps, solution, data, fig }
       types: expected (one expected count and its component, df, χ², the
              p-value, the decision and the conclusion in context),
              chooser (homogeneity or independence, the hypotheses, the
              expected counts condition)
     Text uses $...$ TeX; the page renders it (ApStatTex). */
(function(){
  'use strict';
  var M = window.ApStatMath;
  if(!M) return;
  function D(){ return M.Dist(); }
  function F(x, d){ return M.fixed(x, d == null ? 2 : d); }
  function P4(p){ return p < 0.00005 ? '0.0000' : F(p, 4); } // drills never ask below 0.00005, so a shown p-value is never 0.0000
  function A(a){ return a === 0.1 ? '0.10' : String(a); }

  /* ------------------------------------------------------------ explore */
  function table(obs){
    var t = D().chi2table(obs), signs = [], ok = t.minExpected >= 5;
    for(var i = 0; i < obs.length; i++){ signs[i] = []; for(var j = 0; j < obs[0].length; j++) signs[i][j] = obs[i][j] > t.expected[i][j] ? 1 : obs[i][j] < t.expected[i][j] ? -1 : 0; }
    t.signs = signs; t.ok = ok;
    return t;
  }
  function draw(r, probs){ var u = r(), s = 0; for(var j = 0; j < probs.length; j++){ s += probs[j]; if(u < s) return j; } return probs.length - 1; }
  function chance(r, obs){
    var t = D().chi2table(obs), C = obs[0].length, probs = t.colTotals.map(function(c){ return c / t.total; });
    return obs.map(function(row, i){
      var out = []; for(var j = 0; j < C; j++) out.push(0);
      for(var k = 0; k < t.rowTotals[i]; k++) out[draw(r, probs)]++;
      return out;
    });
  }
  function simulateTypeI(r, rowN, probs, alpha, reps){
    var rej = 0, C = probs.length;
    for(var s = 0; s < reps; s++){
      var obs = rowN.map(function(n){ var out = []; for(var j = 0; j < C; j++) out.push(0); for(var k = 0; k < n; k++) out[draw(r, probs)]++; return out; });
      // A column with no counts at all has no expected count: such a table is redrawn.
      var t = D().chi2table(obs);
      if(!(t.minExpected > 0)){ s--; continue; }
      if(t.p < alpha) rej++;
    }
    return rej / reps;
  }

  /* ------------------------------------------------------------ cells */
  function statCell(a, places, ms){ return M.cell(a, 0.005, ms, 0.5 * Math.pow(10, -places)); }
  function chiCell(a, ms){ return M.cell(a, 0, ms, a > 10 ? 0.05 : 0.02); }
  function pCell(a, ms){ return a < 0.05 ? M.cell(a, 0.1, ms, 0.00006) : M.cell(a, 0, ms, 0.005); }
  function intCell(a, ms){ return M.cell(a, 0, ms, 1e-9); }
  function choice(key, practice, label, opts){
    return { key: key, kind: 'choice', practice: practice, label: label, options: opts.map(function(o){ return o.t; }), why: opts.map(function(o){ return o.why; }), correct: 0 };
  }

  /* ------------------------------------------------------------ tables */
  function normalize(a){ var s = 0; a.forEach(function(x){ s += x; }); return a.map(function(x){ return x / s; }); }
  function tilt(r, base, size){ return normalize(base.map(function(b){ return Math.max(0.02, b * (1 + size * (r() * 2 - 1))); })); }
  function makeTable(r, c, scale){
    scale = scale || 1;
    var R = c.rows.length, C = c.cols.length, obs = [], i, j, k;
    var size = r.pick(c.tilts || [0, 0.15, 0.3, 0.45]);
    if(c.design === 'independence'){
      var N = Math.round(r.pick(c.Ns) * scale), rp = tilt(r, c.rowBase, 0.15);
      for(i = 0; i < R; i++){ obs.push([]); for(j = 0; j < C; j++) obs[i].push(0); }
      var probsRow = [];
      for(i = 0; i < R; i++) probsRow.push(tilt(r, c.base, size));
      for(k = 0; k < N; k++){ var ri = draw(r, rp), cj = draw(r, probsRow[ri]); obs[ri][cj]++; }
    } else {
      for(i = 0; i < R; i++){
        var n = Math.round(r.pick(c.rowNs) * scale), pr = tilt(r, c.base, size), row = [];
        for(j = 0; j < C; j++) row.push(0);
        for(k = 0; k < n; k++) row[draw(r, pr)]++;
        obs.push(row);
      }
    }
    return obs;
  }
  function hyp(c){
    if(c.design === 'independence') return { h0: 'There is no association between ' + c.rowVar + ' and ' + c.colVar + ' for ' + c.pop + '.', ha: 'There is an association between ' + c.rowVar + ' and ' + c.colVar + ' for ' + c.pop + '.' };
    return { h0: 'The distribution of ' + c.colVar + ' is the same for ' + c.groups + '.', ha: 'The distribution of ' + c.colVar + ' is not the same for ' + c.groups + '.' };
  }
  function conclusions(c, reject){
    var ind = c.design === 'independence';
    var good = ind ? 'There ' + (reject ? 'is' : 'is not') + ' convincing evidence of an association between ' + c.rowVar + ' and ' + c.colVar + ' for ' + c.pop + '.'
      : 'There ' + (reject ? 'is' : 'is not') + ' convincing evidence that the distribution of ' + c.colVar + ' differs for ' + c.groups + '.';
    var opts = [{ t: good, why: 'Evidence language, the claim of $H_a$ in context, and ' + (ind ? 'association' : 'the distributions') + ' named.' }];
    if(reject){
      opts.push({ t: 'This proves that ' + (ind ? c.rowVar + ' and ' + c.colVar + ' are associated' : 'the distribution of ' + c.colVar + ' differs for ' + c.groups) + '.', why: 'A test gives convincing evidence, never proof.' });
      opts.push({ t: ind ? 'There is convincing evidence that ' + c.rowVar + ' causes differences in ' + c.colVar + '.' : 'There is convincing evidence that the sample counts are different from each other.', why: ind ? 'An association from an observational sample is not cause and effect.' : 'The conclusion is about the populations, not the sample counts, which are known exactly.' });
      opts.push({ t: ind ? 'There is convincing evidence that ' + c.rowVar + ' and ' + c.colVar + ' are independent.' : 'There is convincing evidence that the distribution of ' + c.colVar + ' is the same for ' + c.groups + '.', why: 'Rejecting $H_0$ is evidence for $H_a$, not for $H_0$.' });
    } else {
      opts.push({ t: ind ? 'There is convincing evidence that ' + c.rowVar + ' and ' + c.colVar + ' are independent for ' + c.pop + '.' : 'There is convincing evidence that the distribution of ' + c.colVar + ' is the same for ' + c.groups + '.', why: 'Failing to reject never shows $H_0$ is true; the evidence for $H_a$ is just not convincing.' });
      opts.push({ t: 'We accept $H_0$: ' + (ind ? 'the two variables are independent.' : 'the distributions are the same.'), why: 'We never "accept" $H_0$. Say "fail to reject $H_0$" and "not convincing evidence".' });
      opts.push({ t: ind ? 'There is not convincing evidence that the distribution of ' + c.colVar + ' differs for each ' + c.rowVar + ' in the sample.' : 'There is not convincing evidence that the sample counts differ.', why: 'The conclusion is about the population' + (ind ? ' (an association)' : 's') + ', in the words of $H_a$, not about the sample.' });
    }
    return opts;
  }

  /* ------------------------------------------------------------ problem kinds */
  var ALPHAS = [0.05, 0.05, 0.05, 0.01, 0.10];
  function genExpected(r, c){
    var obs, t, alpha, g = 0;
    for(;;){
      if(g++ > 400) throw new Error('chiSquareLab: no clear table for ' + c.id);
      obs = makeTable(r, c); t = table(obs); alpha = r.pick(ALPHAS);
      if(t.minExpected < 5) continue;
      if(Math.abs(t.p - alpha) < 0.012 || Math.abs(t.p - alpha) < 0.3 * alpha || t.p < 0.00005) continue;
      break;
    }
    var R = obs.length, C = obs[0].length, i = r.int(0, R - 1), j = r.int(0, C - 1);
    var E = t.expected[i][j], O = obs[i][j], comp = t.components[i][j], h = hyp(c), reject = t.p < alpha;
    var rowT = t.rowTotals[i], colT = t.colTotals[j], N = t.total;
    var cellName = c.rows[i] + ', ' + c.cols[j];
    var steps = [
      { key: 'E', kind: 'num', practice: '3.C', d: 2, label: 'The expected count for ' + cellName + '.', hint: '$E = \\frac{\\text{row total} \\times \\text{column total}}{\\text{grand total}}$',
        cell: statCell(E, 2, [{ value: rowT * colT, why: 'Divide by the grand total too: $(' + rowT + ')(' + colT + ')/' + N + '$.' }, { value: O, why: 'That is the observed count. The expected count is what $H_0$ predicts: $(\\text{row total})(\\text{column total})/\\text{grand total}$.' },
          { value: N / (R * C), why: 'That splits the grand total evenly over the cells. $H_0$ does not say every cell is equal; use the row and column totals.' }, { value: rowT / C, why: 'That splits the row evenly over the columns. Use the column total: $(' + rowT + ')(' + colT + ')/' + N + '$.' }]) },
      { key: 'comp', kind: 'num', practice: '3.E', d: 3, label: 'That cell\'s component of $\\chi^2$.', hint: '$\\frac{(O - E)^2}{E}$',
        cell: statCell(comp, 3, [{ value: (O - E) * (O - E), why: 'Divide by the expected count: $(O - E)^2/E$.' }, { value: Math.abs(O - E) / E, why: 'Square the difference: $(O - E)^2/E$.' }, { value: (O - E) * (O - E) / O, why: 'Divide by the expected count E, not the observed count O.' }]) },
      { key: 'df', kind: 'num', practice: '3.E', d: 0, label: 'The degrees of freedom.', hint: '$df = (\\text{rows} - 1)(\\text{columns} - 1)$, not counting totals',
        cell: intCell(t.df, [{ value: R * C - 1, why: 'That is (number of cells) − 1, the goodness of fit rule. For a two-way table, $df = (r - 1)(c - 1)$.' }, { value: R * C, why: 'For a two-way table, $df = (r - 1)(c - 1) = (' + R + ' - 1)(' + C + ' - 1)$.' }]) },
      { key: 'chi2', kind: 'num', practice: '3.E', d: 2, label: 'The test statistic $\\chi^2$, the sum of every cell\'s component.', hint: 'The picture now shows every component.', cell: chiCell(t.chi2, [{ value: t.chi2 - comp, why: 'One cell is missing from the sum. Add every component, including ' + cellName + '.' }]) },
      { key: 'p', kind: 'num', practice: '3.E', d: 4, label: 'The p-value.', hint: 'The area to the right of $\\chi^2$ under the $\\chi^2$ distribution with $df = ' + t.df + '$.',
        cell: pCell(t.p, [{ value: 1 - t.p, why: 'That is the area to the left. A $\\chi^2$ test uses only the upper tail: large $\\chi^2$ means far from $H_0$.' }, { value: D().chi2Sf(t.chi2, R * C - 1), why: 'That uses $df = ' + (R * C - 1) + '$. A two-way table has $df = (r - 1)(c - 1) = ' + t.df + '$.' }]) },
      choice('decide', '4.G', 'Compare the p-value with α and decide.', [
        { t: 'Because the p-value of ' + P4(t.p) + ' is ' + (reject ? 'less' : 'greater') + ' than $\\alpha = ' + A(alpha) + '$, ' + (reject ? 'reject' : 'fail to reject') + ' $H_0$.', why: 'Reject only when the p-value is less than α.' },
        { t: 'Because the p-value of ' + P4(t.p) + ' is ' + (reject ? 'less' : 'greater') + ' than $\\alpha = ' + A(alpha) + '$, ' + (reject ? 'fail to reject' : 'reject') + ' $H_0$.', why: 'The comparison is right but the decision is reversed.' },
        { t: 'Because $\\chi^2 = ' + F(t.chi2, 2) + '$ is ' + (t.chi2 > t.df ? 'greater' : 'less') + ' than the ' + t.df + ' degrees of freedom, ' + (t.chi2 > t.df ? 'reject' : 'fail to reject') + ' $H_0$.', why: 'Compare the p-value with α (or $\\chi^2$ with the critical value for $df = ' + t.df + '$ and this α), never $\\chi^2$ with the df.' },
        { t: 'Because the p-value of ' + P4(t.p) + ' is ' + (reject ? 'less' : 'greater') + ' than $\\alpha = ' + A(alpha) + '$, ' + (reject ? 'accept $H_a$ as proven.' : 'accept $H_0$.'), why: reject ? 'A test never proves $H_a$; say "reject $H_0$".' : 'We never accept $H_0$; say "fail to reject $H_0$".' }
      ]),
      choice('conclude', '4.F', 'Which conclusion is written correctly, in context?', conclusions(c, reject))
    ];
    var text = '<p>' + c.story + '</p><p>$H_0$: ' + h.h0 + ' $H_a$: ' + h.ha + ' Use $\\alpha = ' + A(alpha) + '$. The conditions are met.</p>';
    var sol = [
      '$E = \\frac{(\\text{row total})(\\text{column total})}{\\text{grand total}} = \\frac{(' + rowT + ')(' + colT + ')}{' + N + '} = ' + F(E, 2) + '$ for ' + cellName + '.',
      'Its component: $\\frac{(O - E)^2}{E} = \\frac{(' + O + ' - ' + F(E, 2) + ')^2}{' + F(E, 2) + '} = ' + F(comp, 3) + '$.',
      '$df = (r - 1)(c - 1) = (' + R + ' - 1)(' + C + ' - 1) = ' + t.df + '$.',
      '$\\chi^2 = \\sum \\frac{(O - E)^2}{E} = ' + F(t.chi2, 2) + '$ over all ' + (R * C) + ' cells.',
      'p-value $= P(\\chi^2_{' + t.df + '} \\ge ' + F(t.chi2, 2) + ') = ' + P4(t.p) + '$ (technology: a chi-square test of ' + c.design + ').',
      'Because the p-value of ' + P4(t.p) + ' is ' + (reject ? 'less' : 'greater') + ' than $\\alpha = ' + A(alpha) + '$, we ' + (reject ? 'reject' : 'fail to reject') + ' $H_0$. ' + conclusions(c, reject)[0].t
    ];
    return { text: text, steps: steps, solution: sol, data: { obs: obs, i: i, j: j, alpha: alpha, design: c.design },
      fig: { obs: obs, rows: c.rows, cols: c.cols, i: i, j: j, rowVar: c.rowVar, colVar: c.colVar } };
  }

  function genChooser(r, c){
    var obs, t, g = 0, small = r() < 0.4;
    for(;;){
      if(g++ > 400) throw new Error('chiSquareLab: no table for ' + c.id);
      obs = makeTable(r, c, small ? 0.12 + r() * 0.1 : 1); t = table(obs);
      if(!(t.minExpected > 0) || obs.some(function(row){ return row.every(function(x){ return x === 0; }); })) continue;
      if(small ? t.minExpected >= 5 || t.minExpected < 1 : t.minExpected < 5) { if(small && g > 200) small = false; continue; }
      break;
    }
    var h = hyp(c), ind = c.design === 'independence', other = { design: ind ? 'homogeneity' : 'independence', rowVar: c.rowVar, colVar: c.colVar, pop: c.pop, groups: c.groups || ('the ' + c.rows.length + ' groups') };
    var ho = hyp(other);
    var steps = [
      choice('test', '2.C', 'Which test fits this study?', ind ? [
        { t: 'A chi-square test for independence', why: 'One random sample, each individual classified on two categorical variables.' },
        { t: 'A chi-square test for homogeneity', why: 'Homogeneity compares separate samples or treatment groups. Here there is one sample classified two ways.' },
        { t: 'A two-sample z test for a difference of proportions', why: 'That compares one proportion in two groups. This table has more categories than two proportions can hold.' }
      ] : [
        { t: 'A chi-square test for homogeneity', why: 'Separate random samples (or treatment groups), one categorical variable compared across them.' },
        { t: 'A chi-square test for independence', why: 'Independence uses one sample classified on two variables. Here the groups were sampled (or assigned) separately.' },
        { t: 'A two-sample z test for a difference of proportions', why: 'That compares one proportion in two groups. This variable has more than two categories, or there are more than two groups.' }
      ]),
      choice('hyp', '2.E', 'Which null hypothesis matches that test?', [
        { t: '$H_0$: ' + h.h0, why: ind ? 'Independence is "no association" in one population.' : 'Homogeneity is "the same distribution" in every group.' },
        { t: '$H_0$: ' + ho.h0, why: 'That is the hypothesis of the other test. Match the wording to the design.' },
        { t: '$H_0$: ' + h.ha, why: 'That is $H_a$. The null hypothesis is ' + (ind ? 'no association' : 'no difference among the groups') + '.' },
        { t: '$H_0$: Every cell of the table has the same count.', why: '$H_0$ does not say the cells are equal; it is about ' + (ind ? 'association' : 'the distributions being the same') + '.' }
      ]),
      choice('cond', '4.E', 'The smallest expected count is ' + F(t.minExpected, 2) + '. Is the large counts condition met?', t.minExpected >= 5 ? [
        { t: 'Yes: every expected count is at least 5.', why: 'The condition is on the expected counts, all at least 5.' },
        { t: 'No: some observed counts are below 10.', why: 'The condition is about expected counts, at least 5 each, not observed counts.' },
        { t: 'No: the sample size must be at least 30.', why: 'The 30 rule is for means. For chi-square, every expected count must be at least 5.' }
      ] : [
        { t: 'No: an expected count is below 5, so the chi-square distribution may not fit.', why: 'Every expected count must be at least 5.' },
        { t: 'Yes: the grand total is large.', why: 'A large total is not enough: each expected count must be at least 5.' },
        { t: 'Yes: every observed count is at least 1.', why: 'The condition is about expected counts, at least 5 each.' }
      ])
    ];
    var text = '<p>' + c.story + '</p>';
    var sol = [
      ind ? 'One random sample, classified on two categorical variables (' + c.rowVar + ' and ' + c.colVar + '): a chi-square test for independence.' : 'Separate random samples or treatment groups, compared on one categorical variable (' + c.colVar + '): a chi-square test for homogeneity.',
      '$H_0$: ' + h.h0 + ' $H_a$: ' + h.ha,
      'The smallest expected count is ' + F(t.minExpected, 2) + (t.minExpected >= 5 ? ', at least 5, so the large counts condition is met.' : ', below 5, so the large counts condition is not met.')
    ];
    return { text: text, steps: steps, solution: sol, data: { obs: obs, design: c.design, minE: t.minExpected },
      fig: { obs: obs, rows: c.rows, cols: c.cols, i: -1, j: -1, rowVar: c.rowVar, colVar: c.colVar, showE: 'cond' } };
  }

  var GEN = { expected: genExpected, chooser: genChooser };
  function generate(r, ctx, type){
    var types = ctx.types || ['expected'];
    var t = type && types.indexOf(type) > -1 ? type : r.pick(types);
    var p = GEN[t](r, ctx);
    p.ctx = ctx.id; p.topic = ctx.topic; p.type = t;
    return p;
  }

  M.register('chiSquareLab', { table: table, chance: chance, simulateTypeI: simulateTypeI, hyp: hyp, conclusions: conclusions, generate: generate, P4: P4 });
})();
