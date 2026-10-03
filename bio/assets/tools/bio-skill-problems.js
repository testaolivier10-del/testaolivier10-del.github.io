/* AP® Biology skills tools: every problem's solver and its seeded generator
   (docs/apbio-architecture.md, "Tools"). Pure, like bio-tool-math.js, and
   loaded by the validators in Node: an authored problem's printed answer is
   recomputed by the same solver the page uses, so the two cannot disagree.

     ApBioProblems.solve[kind](input) -> { parts, steps, table?, chart? }
       parts: [{ key, label, type: 'num'|'choice', unit, d, answer, tol,
                 options, correct, practice }]
       steps: worked-solution HTML, one string per step, shown after Check
     ApBioProblems.generate[kind](rng, ctx) -> input (ctx from the tool's data)

   Inputs carry everything a solver needs; generated ones also carry the
   problem text, built from the context's template. Every number shown in a
   step is the value the grader uses, rounded only for display. */
(function(root){
  'use strict';
  var M = root.ApBioMath;
  var MINUS = '−';
  /* A number for display: d decimals, a true minus sign. */
  function F(x, d){ var s = M.fixed(x, d == null ? 2 : d); return s.charAt(0) === '-' ? MINUS + s.slice(1) : s; }
  function fill(t, v){ return String(t || '').replace(/\{(\w+)\}/g, function(m, k){ return v[k] != null ? v[k] : m; }); }
  function U(u){ return u ? ' ' + u : ''; }
  function num(key, label, answer, d, unit, practice, opts){
    opts = opts || {};
    return { key: key, label: label, type: 'num', answer: answer, d: d, unit: unit || '', tol: opts.exact ? Math.pow(10, -d) / 2 : M.tol(answer, d, opts.rel), practice: practice || '5.A' };
  }
  function choice(key, label, options, correct, practice){ return { key: key, label: label, type: 'choice', options: options, correct: correct, practice: practice || '5.A' }; }
  function tableHtml(cols, rows, caption){
    return '<table class="bio-data">' + (caption ? '<caption>' + caption + '</caption>' : '') + '<thead><tr>' + cols.map(function(c){ return '<th scope="col">' + c + '</th>'; }).join('') + '</tr></thead><tbody>' +
      rows.map(function(r){ return '<tr>' + r.map(function(v, i){ return i === 0 ? '<th scope="row">' + v + '</th>' : '<td>' + v + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table>';
  }

  /* --------------------------------------------- 1. descriptive stats */
  function descriptive(x){
    var v = x.values, n = v.length, d = x.d == null ? 2 : x.d, dp = x.dp == null ? 1 : x.dp, u = x.unit || '';
    var S = M.sum(v), m = M.mean(v), med = M.median(v), rg = M.range(v), Q = M.sumSq(v), s = M.sd(v), se = M.se(v);
    var srt = M.sorted(v);
    var dev = v.map(function(a){ return [F(a, dp), F(a - m, d + 1), F((a - m) * (a - m), d + 2)]; });
    var mid = n % 2
      ? 'There are ' + n + ' values (odd), so the median is the middle one, value number ' + ((n + 1) / 2) + ': <b>' + F(med, d) + U(u) + '</b>.'
      : 'There are ' + n + ' values (even), so the median is the mean of the two middle ones: (' + F(srt[n / 2 - 1], dp) + ' + ' + F(srt[n / 2], dp) + ') / 2 = <b>' + F(med, d) + U(u) + '</b>.';
    return {
      parts: [
        num('mean', 'Mean (x̄)', m, d, u, '5.A', { rel: 0 }),
        num('median', 'Median', med, d, u, '5.A', { rel: 0 }),
        num('range', 'Range', rg, d, u, '5.A', { rel: 0 }),
        num('sd', 'Standard deviation (s)', s, d, u),
        num('se', 'Standard error (SE)', se, d, u)
      ],
      steps: [
        'Add the ' + n + ' values: Σx = ' + v.map(function(a){ return F(a, dp); }).join(' + ') + ' = ' + F(S, dp + 1) + U(u) + '.',
        'Mean: x̄ = Σx / n = ' + F(S, dp + 1) + ' / ' + n + ' = <b>' + F(m, d) + U(u) + '</b>. (Keep the unrounded mean, ' + F(m, d + 2) + ', for the next steps.)',
        'Median: sort the values: ' + srt.map(function(a){ return F(a, dp); }).join(', ') + '. ' + mid,
        'Range = largest − smallest = ' + F(srt[n - 1], dp) + ' − ' + F(srt[0], dp) + ' = <b>' + F(rg, d) + U(u) + '</b>.',
        'Standard deviation: square each value’s distance from the mean and add them up.' + tableHtml(['x', 'x − x̄', '(x − x̄)²'], dev) + 'Σ(x − x̄)² = ' + F(Q, d + 2) + '.',
        's = √( Σ(x − x̄)² / (n − 1) ) = √( ' + F(Q, d + 2) + ' / ' + (n - 1) + ' ) = √' + F(Q / (n - 1), d + 3) + ' = <b>' + F(s, d) + U(u) + '</b>. Divide by n − 1, not n: distances measured from the sample’s own mean come out a little too small, and dividing by n − 1 corrects for that.',
        'Standard error: SE = s / √n = ' + F(s, d + 2) + ' / √' + n + ' = ' + F(s, d + 2) + ' / ' + F(Math.sqrt(n), 3) + ' = <b>' + F(se, d) + U(u) + '</b>. SE measures how far the sample mean is likely to be from the true mean; it shrinks as n grows.'
      ],
      table: tableHtml([x.label || 'Measurement', 'Value' + (u ? ' (' + u + ')' : '')], v.map(function(a, i){ return [String(i + 1), F(a, dp)]; }), x.caption || '')
    };
  }
  function genDescriptive(r, c){
    var n = r.int(c.n[0], c.n[1]), m = r.real(c.mean[0], c.mean[1]), s = r.real(c.sd[0], c.sd[1]), dp = c.dp == null ? 1 : c.dp, v;
    do {
      v = [];
      for(var i = 0; i < n; i++) v.push(M.round(Math.max(c.min == null ? 0 : c.min, r.normal(m, s)), dp));
    } while(M.range(v) === 0);
    return { kind: 'descriptive', values: v, unit: c.unit, dp: dp, d: c.d == null ? 2 : c.d, label: c.label, text: fill(c.text, { n: n }) };
  }

  /* ------------------------------------- 2. 95% CI and error bars */
  var CI_OVERLAP = ['Yes: the two intervals overlap', 'No: there is a gap between the two intervals'];
  var CI_CONCLUDE = [
    'The difference between the means is likely statistically significant: chance alone is unlikely to explain it',
    'The data do not show a statistically significant difference: chance could explain the gap between the means',
    'The two means are the same, so the treatment had no effect'
  ];
  function ci(x){
    var d = x.d == null ? 2 : x.d, u = x.unit || '', g = x.groups;
    var parts = [], steps = [], iv = [];
    g.forEach(function(gr, k){
      var se = M.seFrom(gr.sd, gr.n), c = M.ci95(gr.mean, se);
      iv.push(c);
      parts.push(num('se-' + k, 'SE of ' + gr.name, se, d, u, '5.B'));
      parts.push(num('lo-' + k, 'Lower end of the 95% CI for ' + gr.name, c.lo, d, u, '5.B'));
      parts.push(num('hi-' + k, 'Upper end of the 95% CI for ' + gr.name, c.hi, d, u, '5.B'));
      steps.push('<b>' + gr.name + ':</b> SE = s / √n = ' + F(gr.sd, d) + ' / √' + gr.n + ' = <b>' + F(se, d) + U(u) + '</b>. 2 SE = ' + F(2 * se, d) + '. 95% CI ≈ x̄ ± 2 SE = ' + F(gr.mean, d) + ' ± ' + F(2 * se, d) + ', from <b>' + F(c.lo, d) + '</b> to <b>' + F(c.hi, d) + U(u) + '</b>.');
    });
    var ov = M.overlap(iv[0], iv[1]);
    var lowI = g[0].mean <= g[1].mean ? 0 : 1, hiI = 1 - lowI;
    parts.push(choice('overlap', 'Do the two 95% confidence intervals (the ±2 SE error bars) overlap?', CI_OVERLAP, ov ? 0 : 1, '5.B'));
    parts.push(choice('conclusion', 'What can you conclude?', CI_CONCLUDE, ov ? 1 : 0, '5.B'));
    steps.push('Compare the intervals: the top of ' + g[lowI].name + '’s interval is ' + F(iv[lowI].hi, d) + ' and the bottom of ' + g[hiI].name + '’s is ' + F(iv[hiI].lo, d) + '. ' +
      (ov ? 'The intervals <b>overlap</b>.' : 'There is a <b>gap</b>: the intervals do not overlap.'));
    steps.push(ov
      ? 'Overlapping ±2 SE bars mean the data do <b>not</b> show a statistically significant difference: the true means could be equal, and chance could explain the gap between the sample means. Overlap does not prove the means are the same; it means this experiment cannot tell them apart.'
      : 'Error bars of ±2 SE that do not overlap mean the difference is <b>likely statistically significant</b>: if the true means were equal, samples this far apart would rarely happen by chance. It does not by itself tell you why the groups differ.');
    return {
      parts: parts, steps: steps,
      table: tableHtml(['Group', 'Mean' + (u ? ' (' + u + ')' : ''), 'Standard deviation' + (u ? ' (' + u + ')' : ''), 'n'], g.map(function(gr){ return [gr.name, F(gr.mean, d), F(gr.sd, d), String(gr.n)]; }), x.caption || ''),
      chart: { type: 'bar', y: x.yLabel || 'Mean', unit: u, bars: g.map(function(gr, k){ return { name: gr.name, mean: gr.mean, err: 2 * M.seFrom(gr.sd, gr.n) }; }) }
    };
  }
  function genCi(r, c){
    var d = c.d == null ? 2 : c.d, tries = 0, x;
    do {
      var n1 = r.int(c.n[0], c.n[1]), n2 = r.int(c.n[0], c.n[1]);
      var m1 = M.round(r.real(c.mean[0], c.mean[1]), c.dp == null ? 1 : c.dp);
      var s1 = M.round(r.real(c.sd[0], c.sd[1]), d), s2 = M.round(r.real(c.sd[0], c.sd[1]), d);
      var se = M.seFrom(s1, n1) + M.seFrom(s2, n2);
      var gap = r() < 0.5 ? r.real(0.2, 1.4) * se : r.real(2.6, 5) * se;   // overlapping or clearly separate
      var m2 = M.round(m1 + (r() < 0.5 ? -1 : 1) * gap, c.dp == null ? 1 : c.dp);
      x = { kind: 'ci', unit: c.unit, d: d, yLabel: c.yLabel, groups: [{ name: c.groups[0], mean: m1, sd: s1, n: n1 }, { name: c.groups[1], mean: m2, sd: s2, n: n2 }], text: c.text };
    } while((m2 <= 0 || ciBorderline(x)) && ++tries < 50);
    return x;
  }
  /* Too close to call by eye: the gap or overlap is under a tenth of an SE. */
  function ciBorderline(x){
    var a = x.groups[0], b = x.groups[1];
    var A = M.ci95(a.mean, M.seFrom(a.sd, a.n)), B = M.ci95(b.mean, M.seFrom(b.sd, b.n));
    var gap = Math.max(A.lo - B.hi, B.lo - A.hi);
    return Math.abs(gap) < 0.1 * (M.seFrom(a.sd, a.n) + M.seFrom(b.sd, b.n)) || Math.abs(gap) < 2 * Math.pow(10, -(x.d == null ? 2 : x.d));
  }

  /* ------------------------------------------------- 3. chi-square */
  var CHI_DECIDE = ['Reject the null hypothesis', 'Fail to reject the null hypothesis'];
  function chi(x){
    var N = M.sum(x.obs), d = x.d == null ? 2 : x.d;
    var exp = x.props.map(function(p){ return N * p; });
    var res = M.chiSquare(x.obs, exp);
    var parts = exp.map(function(e, i){ return num('exp-' + i, 'Expected count: ' + x.cats[i], e, 1, '', '5.C'); });
    parts.push(num('chi2', 'Chi-square value (χ²)', res.chi2, d, '', '5.C'));
    parts.push(num('df', 'Degrees of freedom', res.df, 0, '', '5.C', { exact: true }));
    var crit = num('crit', 'Critical value at p = 0.05', res.crit, 2, '', '5.C', { exact: true });
    crit.tol = 0.011;   // 7.815 is printed 7.82 on the formula sheet; accept 7.81 too
    parts.push(crit);
    parts.push(choice('decision', 'Decision about the null hypothesis', CHI_DECIDE, res.reject ? 0 : 1, '5.D'));
    var rows = x.cats.map(function(c, i){ return [c, String(x.obs[i]), F(exp[i], 1), F(x.obs[i] - exp[i], 1), F(res.terms[i], 3)]; });
    rows.push(['Total', String(N), F(N, 1), '', '<b>χ² = ' + F(res.chi2, d) + '</b>']);
    return {
      parts: parts,
      steps: [
        'Null hypothesis: ' + (x.null || 'the observed counts fit the expected ratio; any difference is due to chance') + '.',
        'Expected counts = total × expected fraction. The total is ' + N + '. ' + x.cats.map(function(c, i){ return c + ': ' + N + ' × ' + F(x.props[i], 4).replace(/0+$/, '').replace(/\.$/, '') + ' = ' + F(exp[i], 1); }).join('; ') + '.',
        'For each category compute (o − e)² / e, then add them:' + tableHtml(['Category', 'Observed (o)', 'Expected (e)', 'o − e', '(o − e)² / e'], rows),
        'Degrees of freedom = number of categories − 1 = ' + x.cats.length + ' − 1 = <b>' + res.df + '</b>.',
        'From the table at p = 0.05 and df = ' + res.df + ', the critical value is <b>' + F(res.crit, 2) + '</b>.',
        res.reject
          ? 'χ² = ' + F(res.chi2, d) + ' is <b>greater than</b> ' + F(res.crit, 2) + ', so <b>reject the null hypothesis</b>: a difference this large would happen by chance less than 5% of the time if the null were true.'
          : 'χ² = ' + F(res.chi2, d) + ' is <b>less than</b> ' + F(res.crit, 2) + ', so <b>fail to reject the null hypothesis</b>: the difference from the expected counts is small enough to be explained by chance. This does not prove the null hypothesis true.'
      ],
      table: tableHtml(['Category', 'Observed count'], x.cats.map(function(c, i){ return [c, String(x.obs[i])]; }), x.caption || '')
    };
  }
  function genChi(r, c){
    var tries = 0, x;
    do {
      var N = r.int(c.N[0], c.N[1]);
      var props = c.props.slice(), use = props.slice();
      if(r() < 0.5){   // a real departure from the expected ratio
        var b = r.real(c.bias[0], c.bias[1]), i = r.int(0, props.length - 1), j = (i + 1 + r.int(0, props.length - 2)) % props.length;
        var shift = Math.min(use[j] * 0.9, b * use[j]);
        use[i] += shift; use[j] -= shift;
      }
      var obs = props.map(function(){ return 0; });
      for(var k = 0; k < N; k++){ var u = r(), acc = 0; for(var q = 0; q < use.length; q++){ acc += use[q]; if(u < acc || q === use.length - 1){ obs[q]++; break; } } }
      x = { kind: 'chi', cats: c.cats.slice(), obs: obs, props: props, d: 2, null: c.null, text: fill(c.text, { N: N }) };
      var res = M.chiSquare(obs, props.map(function(p){ return N * p; }));
    } while((Math.abs(res.chi2 - res.crit) < 0.4 || props.some(function(p){ return N * p < 5; })) && ++tries < 60);
    return x;
  }

  /* ---------------------------------------- 4. rates and percent change */
  var TREND = ['It is speeding up', 'It is slowing down', 'It stays about the same'];
  function rates(x){
    var d = x.d == null ? 2 : x.d;
    if(x.mode === 'pct'){
      var parts = [], steps = [];
      x.items.forEach(function(it, k){
        var pc = M.percentChange(it.initial, it.final);
        parts.push(num('pct-' + k, 'Percent change: ' + it.name, pc, 1, '%'));
        steps.push('<b>' + it.name + ':</b> percent change = (final − initial) / initial × 100 = (' + F(it.final, x.dp) + ' − ' + F(it.initial, x.dp) + ') / ' + F(it.initial, x.dp) + ' × 100 = ' + F(it.final - it.initial, x.dp) + ' / ' + F(it.initial, x.dp) + ' × 100 = <b>' + F(pc, 1) + '%</b>' + (pc < 0 ? ' (a loss: the sign matters).' : ' (a gain).'));
      });
      steps.push('Percent change compares each sample with its own starting value, so samples that started at different sizes can be compared fairly.');
      return { parts: parts, steps: steps, table: tableHtml([x.label || 'Sample', 'Initial (' + x.unit + ')', 'Final (' + x.unit + ')'], x.items.map(function(it){ return [it.name, F(it.initial, x.dp), F(it.final, x.dp)]; }), x.caption || '') };
    }
    var t = x.times, y = x.values, a = x.early, b = x.late, ut = x.unitT, uy = x.unitY;
    var r1 = M.rate(y[a[0]], y[a[1]], t[a[0]], t[a[1]]), r2 = M.rate(y[b[0]], y[b[1]], t[b[0]], t[b[1]]);
    var ratio = r2 / r1, tr = ratio > 1.15 ? 0 : ratio < 0.85 ? 1 : 2;
    var ru = uy + '/' + ut;
    function step(i, rr){ return 'Rate from ' + t[i[0]] + ' to ' + t[i[1]] + ' ' + ut + ' = Δy / Δt = (' + F(y[i[1]], x.dp) + ' − ' + F(y[i[0]], x.dp) + ') / (' + t[i[1]] + ' − ' + t[i[0]] + ') = ' + F(y[i[1]] - y[i[0]], x.dp) + ' / ' + (t[i[1]] - t[i[0]]) + ' = <b>' + F(rr, d) + ' ' + ru + '</b>.'; }
    return {
      parts: [
        num('rate-early', 'Rate from ' + t[a[0]] + ' to ' + t[a[1]] + ' ' + ut, r1, d, ru),
        num('rate-late', 'Rate from ' + t[b[0]] + ' to ' + t[b[1]] + ' ' + ut, r2, d, ru),
        choice('trend', 'How is the rate changing over time?', TREND, tr, '4.B')
      ],
      steps: [step(a, r1), step(b, r2),
        'Compare: ' + F(r2, d) + ' is ' + (tr === 0 ? 'larger than' : tr === 1 ? 'smaller than' : 'about the same as') + ' ' + F(r1, d) + ', so the rate is <b>' + (tr === 0 ? 'speeding up' : tr === 1 ? 'slowing down' : 'about constant') + '</b>.' + (x.why ? ' ' + x.why : '')],
      table: tableHtml(['Time (' + ut + ')', (x.label || 'Amount') + ' (' + uy + ')'], t.map(function(tt, i){ return [String(tt), F(y[i], x.dp)]; }), x.caption || '')
    };
  }
  function genRates(r, c){
    var dp = c.dp == null ? 1 : c.dp;
    if(c.mode === 'pct'){
      var names = r.shuffle([r.pick(c.gainItems), r.pick(c.lossItems)]), items = names.map(function(nm){
        var init = M.round(r.real(c.initial[0], c.initial[1]), dp), gain = c.gainItems.indexOf(nm) > -1;
        var ch = gain ? r.real(c.gain[0], c.gain[1]) : -r.real(c.loss[0], c.loss[1]);
        return { name: nm, initial: init, final: M.round(init * (1 + ch / 100), dp) };
      });
      return { kind: 'rates', mode: 'pct', items: items, unit: c.unit, dp: dp, label: c.label, text: c.text };
    }
    var tries = 0, x;
    do {
      // Amount made by time t when the rate starts at r0 and falls off at k per unit time.
      var r0 = r.real(c.r0[0], c.r0[1]), k = r.real(c.k[0], c.k[1]), A = r0 / k, tEnd = c.times[c.times.length - 1];
      var sdN = 0.01 * A * (1 - Math.exp(-k * tEnd));
      var vals = c.times.map(function(t){ return M.round(Math.max(0, A * (1 - Math.exp(-k * t)) + (t ? r.normal(0, sdN) : 0)), dp); });
      x = { kind: 'rates', mode: 'rate', times: c.times.slice(), values: vals, early: c.early, late: c.late, unitT: c.unitT, unitY: c.unitY, dp: dp, d: c.d == null ? 2 : c.d, label: c.label, why: c.why, text: c.text };
      var sol = rates(x), r1 = sol.parts[0].answer, r2 = sol.parts[1].answer, q = r2 / r1;
    } while(((q > 0.75 && q < 0.95) || (q > 1.05 && q < 1.25) || r1 <= 0 || !vals.every(function(v, i){ return i === 0 || v >= vals[i - 1]; })) && ++tries < 60);
    return x;
  }

  /* -------------------------------------------- 5. water potential */
  var DIRS = ['Into the cell', 'Out of the cell', 'No net movement'];
  function psiStep(lbl, i, C, tc, v){
    return lbl + ': ψs = −iCRT = −(' + i + ')(' + F(C, 2) + ' mol/L)(0.0831 L·bar/(mol·K))(' + (tc + M.K0) + ' K) = <b>' + F(v, 2) + ' bar</b>.';
  }
  function wp(x){
    var tc = x.T;
    if(x.mode === 'zero'){
      var ps = M.psiS(x.sol.i, x.sol.C, tc);
      return {
        parts: [num('psi-sol', 'Solute potential of the ' + F(x.sol.C, 2) + ' M ' + x.sol.name + ' solution', ps, 2, 'bar'), num('psi-tissue', 'Water potential of the tissue', ps, 2, 'bar')],
        steps: [
          'T = ' + tc + ' °C + 273 = ' + (tc + M.K0) + ' K.',
          psiStep('The solution', x.sol.i, x.sol.C, tc, ps) + ' It is in an open beaker, so ψp = 0 and ψ = ψs = ' + F(ps, 2) + ' bar.',
          'No net water moved at this concentration (no mass change), so the tissue’s water potential equals the solution’s: <b>ψ(tissue) = ' + F(ps, 2) + ' bar</b>. Water moves only when the water potentials differ.'
        ]
      };
    }
    var cS = M.psiS(x.cell.i, x.cell.C, tc), cPsi = cS + x.cell.psiP, sS = M.psiS(x.sol.i, x.sol.C, tc);
    var dir = Math.abs(sS - cPsi) < 0.005 ? 2 : sS > cPsi ? 0 : 1;
    return {
      parts: [
        num('psiS-cell', 'Solute potential of the cell (ψs)', cS, 2, 'bar'),
        num('psi-cell', 'Water potential of the cell (ψ)', cPsi, 2, 'bar'),
        num('psi-sol', 'Water potential of the solution (ψ)', sS, 2, 'bar'),
        choice('direction', 'Which way does water move overall?', DIRS, dir, '6.E')
      ],
      steps: [
        'T = ' + tc + ' °C + 273 = ' + (tc + M.K0) + ' K. i = ' + x.cell.i + ' for ' + x.cell.name + (x.cell.i === 1 ? ' (it does not split into ions)' : ' (it splits into ' + x.cell.i + ' particles; we assume it ionizes completely)') + '.',
        psiStep('The cell', x.cell.i, x.cell.C, tc, cS),
        'The cell: ψ = ψs + ψp = ' + F(cS, 2) + ' + ' + F(x.cell.psiP, 2) + ' = <b>' + F(cPsi, 2) + ' bar</b>.',
        psiStep('The solution (' + x.sol.name + ', i = ' + x.sol.i + ')', x.sol.i, x.sol.C, tc, sS) + ' In an open beaker ψp = 0, so ψ = ' + F(sS, 2) + ' bar.',
        dir === 2 ? 'The two water potentials are equal, so there is <b>no net movement</b> of water.'
          : 'Water moves from higher (less negative) to lower (more negative) water potential: ' + F(dir === 0 ? sS : cPsi, 2) + ' bar is higher than ' + F(dir === 0 ? cPsi : sS, 2) + ' bar, so water moves <b>' + (dir === 0 ? 'into the cell' : 'out of the cell') + '</b>.'
      ]
    };
  }
  function genWp(r, c){
    var T = r.int(c.T[0], c.T[1]);
    if(c.mode === 'zero'){
      var C0 = M.round(r.real(c.C[0], c.C[1]), 2);
      return { kind: 'wp', mode: 'zero', T: T, sol: { name: 'sucrose', i: 1, C: C0 }, text: fill(c.text, { C: F(C0, 2), T: T }) };
    }
    var tries = 0, x;
    do {
      var cs = r.pick(c.cellSolutes), ss = r.pick(c.solSolutes);
      x = { kind: 'wp', mode: 'cell', T: T, cell: { name: cs.name, i: cs.i, C: M.round(r.real(c.cellC[0], c.cellC[1]), 2), psiP: M.round(r.real(c.psiP[0], c.psiP[1]), 1) }, sol: { name: ss.name, i: ss.i, C: M.round(r.real(c.solC[0], c.solC[1]), 2) } };
      var cp = M.psiS(x.cell.i, x.cell.C, T) + x.cell.psiP, sp = M.psiS(x.sol.i, x.sol.C, T);
    } while(Math.abs(cp - sp) < 0.5 && ++tries < 60);
    x.text = fill(c.text, { cellC: F(x.cell.C, 2), cellSolute: x.cell.name, psiP: F(x.cell.psiP, 1), solC: F(x.sol.C, 2), solSolute: x.sol.name, T: T });
    return x;
  }

  /* -------------------------------------------- 6. Hardy-Weinberg */
  function hw(x){
    if(x.mode === 'recessive'){
      var q2 = x.affected / x.N, h = M.hwRecessive(q2);
      return {
        parts: [num('q2', 'q² (frequency of the recessive phenotype)', q2, 3, '', '5.A'), num('q', 'q', h.q, 2), num('p', 'p', h.p, 2), num('pq2', '2pq (expected heterozygote frequency)', h.pq2, 2), num('carriers', 'Expected number of heterozygous carriers', h.pq2 * x.N, 0, '', '5.A', { rel: 0.02 })],
        steps: [
          'Only homozygous recessive individuals show the recessive phenotype, so q² = ' + x.affected + ' / ' + x.N + ' = <b>' + F(q2, 3) + '</b>. (This assumes the population is in Hardy-Weinberg equilibrium.)',
          'q = √q² = √' + F(q2, 4) + ' = <b>' + F(h.q, 3) + '</b>.',
          'p = 1 − q = 1 − ' + F(h.q, 3) + ' = <b>' + F(h.p, 3) + '</b>.',
          '2pq = 2 × ' + F(h.p, 3) + ' × ' + F(h.q, 3) + ' = <b>' + F(h.pq2, 3) + '</b>.',
          'Expected carriers = 2pq × N = ' + F(h.pq2, 3) + ' × ' + x.N + ' = <b>' + F(h.pq2 * x.N, 0) + '</b>.',
          'Check: p² + 2pq + q² = ' + F(h.p2, 3) + ' + ' + F(h.pq2, 3) + ' + ' + F(q2, 3) + ' = ' + F(h.p2 + h.pq2 + q2, 3) + '.'
        ]
      };
    }
    var c = M.hwCounts(x.AA, x.Aa, x.aa);
    return {
      parts: [num('p', 'p (frequency of ' + x.A + ')', c.p, 2), num('q', 'q (frequency of ' + x.a + ')', c.q, 2), num('pq2', '2pq (expected heterozygote frequency)', c.pq2, 2), num('het', 'Expected number of heterozygotes', c.pq2 * c.N, 0, '', '5.A', { rel: 0.02 })],
      steps: [
        'Count alleles: each individual has two. Total alleles = 2 × ' + c.N + ' = ' + (2 * c.N) + '.',
        x.A + ' alleles = 2 × ' + x.AA + ' (homozygous) + ' + x.Aa + ' (heterozygous) = ' + (2 * x.AA + x.Aa) + '. p = ' + (2 * x.AA + x.Aa) + ' / ' + (2 * c.N) + ' = <b>' + F(c.p, 3) + '</b>.',
        'q = 1 − p = <b>' + F(c.q, 3) + '</b>. (Check: ' + x.a + ' alleles = 2 × ' + x.aa + ' + ' + x.Aa + ' = ' + (2 * x.aa + x.Aa) + ', and ' + (2 * x.aa + x.Aa) + ' / ' + (2 * c.N) + ' = ' + F(c.q, 3) + '.)',
        'If the population were in Hardy-Weinberg equilibrium, the heterozygote frequency would be 2pq = 2 × ' + F(c.p, 3) + ' × ' + F(c.q, 3) + ' = <b>' + F(c.pq2, 3) + '</b>.',
        'Expected heterozygotes = 2pq × N = ' + F(c.pq2, 3) + ' × ' + c.N + ' = <b>' + F(c.pq2 * c.N, 0) + '</b>; ' + x.Aa + ' were observed. Comparing observed and expected counts (for example with chi-square) tests whether the population is in equilibrium.'
      ],
      table: tableHtml(['Genotype', 'Number of individuals'], [[x.A + x.A, String(x.AA)], [x.A + x.a, String(x.Aa)], [x.a + x.a, String(x.aa)]], x.caption || '')
    };
  }
  function genHw(r, c){
    var N = r.int(c.N[0], c.N[1]);
    if(c.mode === 'recessive'){
      var q2 = r.real(c.q2[0], c.q2[1]), aff = Math.max(1, Math.round(q2 * N));
      return { kind: 'hw', mode: 'recessive', N: N, affected: aff, text: fill(c.text, { N: N, affected: aff }) };
    }
    var p = r.real(c.p[0], c.p[1]), q = 1 - p, dev = r.real(-0.08, 0.08);
    var AA = Math.round(N * p * p), Aa = Math.max(1, Math.round(N * (2 * p * q) * (1 + dev))), aa = Math.max(0, N - AA - Aa);
    return { kind: 'hw', mode: 'counts', AA: AA, Aa: Aa, aa: aa, A: c.A, a: c.a, text: fill(c.text, { N: AA + Aa + aa }) };
  }

  /* -------------------------------------------- 7. Simpson's diversity */
  function simpson(x){
    var s = M.simpson(x.species.map(function(sp){ return sp.n; }));
    var rows = x.species.map(function(sp, i){ return [sp.name, String(sp.n), F(s.props[i], 3), F(s.squares[i], 4)]; });
    rows.push(['Total', String(s.N), '1.000', '<b>' + F(s.sumSq, 4) + '</b>']);
    return {
      parts: [num('N', 'Total number of organisms (N)', s.N, 0, '', '5.A', { exact: true }), num('sum', 'Σ(n/N)²', s.sumSq, 3, '', '5.A', { rel: 0.02 }), num('D', 'Simpson’s diversity index (D)', s.D, 2, '', '5.A', { rel: 0.02 })],
      steps: [
        'N = ' + x.species.map(function(sp){ return sp.n; }).join(' + ') + ' = <b>' + s.N + '</b>.',
        'For each species, divide its count by N, then square it:' + tableHtml(['Species', 'n', 'n/N', '(n/N)²'], rows),
        'D = 1 − Σ(n/N)² = 1 − ' + F(s.sumSq, 4) + ' = <b>' + F(s.D, 2) + '</b>.',
        'D runs from 0 (one species only) toward 1 (many species, evenly represented). It rises with both more species (richness) and more even counts (evenness).'
      ],
      table: tableHtml(['Species', 'Number counted'], x.species.map(function(sp){ return [sp.name, String(sp.n)]; }), x.caption || '')
    };
  }
  function genSimpson(r, c){
    var k = r.int(c.k[0], c.k[1]), names = r.shuffle(c.species).slice(0, k), even = r() < 0.5;
    var sp = names.map(function(nm){ return { name: nm, n: even ? r.int(c.count[0] + 5, Math.round(c.count[1] / 2)) : r.int(c.count[0], c.count[1]) }; });
    return { kind: 'simpson', species: sp, text: c.text };
  }

  root.ApBioProblems = {
    F: F, fill: fill, tableHtml: tableHtml, CI_OVERLAP: CI_OVERLAP, CI_CONCLUDE: CI_CONCLUDE, CHI_DECIDE: CHI_DECIDE, TREND: TREND, DIRS: DIRS,
    solve: { descriptive: descriptive, ci: ci, chi: chi, rates: rates, wp: wp, hw: hw, simpson: simpson },
    generate: { descriptive: genDescriptive, ci: genCi, chi: genChi, rates: genRates, wp: genWp, hw: genHw, simpson: genSimpson },
    ciBorderline: ciBorderline
  };
})(typeof window !== 'undefined' ? window : globalThis);
