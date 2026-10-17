/* Data explorer model: ApStatMath.dataExplorer (docs/apstat-architecture.md, "Tools";
   docs/apstat-spec.md section 6). OWNED BY THIS TOOL ONLY: no other tool edits
   this file, and this tool edits no shared file. Pure functions, no DOM, so the
   validator (scripts/lib/apstat-tool-checks/data-explorer.mjs) and the test
   (scripts/test/apstat-tool-data-explorer.test.mjs) run exactly this code.

   Every summary comes from ApStatDist.summary (AP quartile rule: the median of
   each half, the median left out when n is odd; 1.5 × IQR fences; sample SD
   with n − 1). Nothing here is typed by hand: the page and the drills draw and
   ask about the numbers these functions compute from the plotted values.

   Explore helpers
     stats(xs)                 ApStatDist.summary(xs) plus skew (g), bowley, shape
     bins(xs, start, width)    histogram counts, bins [a, a + w) (a value on an
                               edge goes in the bin to its right)
     binStart(lo, width)       the first bin edge at or below lo, a multiple of width
     z(x, mean, sd)            standardized value
     skew(xs)                  adjusted Fisher-Pearson skewness g
     shape(xs)                 { key: 'right'|'left'|'sym'|'slight-right'|'slight-left', word }
                               by a stated rule of thumb (SHAPE_RULE)
     whiskers(S, xs)           [low, high]: the most extreme values inside the fences
   Drills
     generate(r, ctx, type)    a seeded "Test yourself" problem for ApStatTools.drill
       types: summary (1.7), resist (1.7), fences (1.8), describe (1.6), zscore (1.9)
     makeData(r, ctx, shape, n) seeded integer (or ctx.dp decimal) data of a shape
     TYPES                     the problem types in the order the page lists them */
(function(){
  'use strict';
  var M = window.ApStatMath;
  if(!M) return;
  function D(){ return M.Dist(); }

  /* ------------------------------------------------------------ explore */
  function skew(xs){
    var n = xs.length; if(n < 3) return 0;
    var m = D().mean(xs), s = D().sd(xs); if(!(s > 0)) return 0;
    var t = 0; for(var i = 0; i < n; i++) t += Math.pow((xs[i] - m) / s, 3);
    return n / ((n - 1) * (n - 2)) * t;
  }
  var SHAPE_RULE = 'Rule of thumb used here: skewness above 0.6 reads as skewed right, below −0.6 as skewed left, between −0.35 and 0.35 (with the mean within 0.2 SD of the median) as roughly symmetric; anything else as slightly skewed.';
  function shape(xs){
    var g = skew(xs), S = D().summary(xs), gap = S.sd > 0 ? (S.mean - S.med) / S.sd : 0;
    if(g >= 0.6) return { key: 'right', word: 'skewed right', g: g };
    if(g <= -0.6) return { key: 'left', word: 'skewed left', g: g };
    if(Math.abs(g) <= 0.35 && Math.abs(gap) <= 0.2) return { key: 'sym', word: 'roughly symmetric', g: g };
    return g > 0 ? { key: 'slight-right', word: 'slightly skewed right', g: g } : { key: 'slight-left', word: 'slightly skewed left', g: g };
  }
  function stats(xs){
    var S = D().summary(xs), out = {}, k;
    for(k in S) out[k] = S[k];
    out.g = skew(xs);
    out.bowley = S.iqr > 0 ? (S.q3 + S.q1 - 2 * S.med) / S.iqr : 0;
    out.shape = shape(xs);
    out.whiskers = whiskers(S, xs);
    return out;
  }
  function whiskers(S, xs){
    var inl = xs.filter(function(v){ return v >= S.fences[0] && v <= S.fences[1]; });
    return [Math.min.apply(null, inl), Math.max.apply(null, inl)];
  }
  function binStart(lo, width){ return Math.floor(lo / width + 1e-9) * width; }
  function bins(xs, start, width){
    var hi = Math.max.apply(null, xs), nb = Math.max(1, Math.floor((hi - start) / width + 1e-9) + 1), counts = [];
    for(var i = 0; i < nb; i++) counts.push(0);
    xs.forEach(function(v){ var j = Math.floor((v - start) / width + 1e-9); if(j >= 0 && j < nb) counts[j]++; });
    return { start: start, width: width, counts: counts, edges: counts.map(function(c, j){ return [M.round(start + j * width, 6), M.round(start + (j + 1) * width, 6)]; }) };
  }
  function z(x, mean, sd){ return (x - mean) / sd; }

  /* ------------------------------------------------------------- data */
  function rnd(v, dp){ return M.round(v, dp || 0); }
  function clampTo(v, c){ return Math.max(c.lo, Math.min(c.hi, v)); }
  /* One seeded value of a shape between ctx.lo and ctx.hi: a gamma(2) tail for
     a skew (mirrored for left), a normal for symmetric. */
  function draw1(r, c, sh){
    var span = c.hi - c.lo;
    if(sh === 'sym') return clampTo(M.normal(r, c.lo + span / 2, span / 7), c);
    var u1 = 1 - r(), u2 = 1 - r(), t = -Math.log(u1) - Math.log(u2), v = span * t / 8;
    return clampTo(sh === 'left' ? c.hi - v : c.lo + v, c);
  }
  function makeData(r, c, sh, n){
    var xs = [];
    for(var i = 0; i < n; i++) xs.push(rnd(draw1(r, c, sh), c.dp));
    return xs;
  }
  function distinct(xs){ var s = {}; xs.forEach(function(v){ s[v] = 1; }); return Object.keys(s).length; }
  /* Data with a clear shape: tries until the rule of thumb agrees with the
     shape asked for, the mean and median sit on the right side of each other,
     and the IQR is not zero. */
  function clearData(r, c, sh, n, more){
    for(var g = 0; g < 400; g++){
      var xs = makeData(r, c, sh, n), S = D().summary(xs), k = shape(xs).key, gap = S.sd > 0 ? (S.mean - S.med) / S.sd : 0;
      if(!(S.iqr > 0) || distinct(xs) < Math.min(n, 6)) continue;
      if(sh === 'right' && !(k === 'right' && gap > 0.1 && skew(xs) >= 0.8)) continue;
      if(sh === 'left' && !(k === 'left' && gap < -0.1 && skew(xs) <= -0.8)) continue;
      if(sh === 'sym' && !(k === 'sym' && Math.abs(gap) < 0.1 && Math.abs(skew(xs)) <= 0.25)) continue;
      if(more && !more(xs, S)) continue;
      return xs;
    }
    throw new Error('dataExplorer: no clear ' + sh + ' data for ' + c.id);
  }
  function whats(c){ return c.whats || c.what + 's'; } // the variable's plural ("battery lives")
  function list(xs, dp){ return xs.map(function(v){ return M.fixed(v, dp || 0); }).join(', '); }

  /* ----------------------------------------------------------- drills */
  var SK = { mean: '3.B', median: '3.B', iqr: '3.B', sd: '3.B', dmean: '4.B', dmed: '4.B', spread: '4.B',
    q1: '3.B', q3: '3.B', fence: '3.B', isout: '4.B', whisk: '3.A', shape: '4.A', vs: '4.B', sentence: '4.A',
    z: '3.B', zread: '4.A', zrule: '4.B' };
  var TOPIC = { summary: 'summary-statistics', resist: 'summary-statistics', fences: 'boxplots', describe: 'describing-distributions', zscore: 'comparing-distributions' };
  var TYPES = [
    { value: 'summary', label: 'Mean, median, IQR and SD' },
    { value: 'resist', label: 'Resistant or not?' },
    { value: 'fences', label: 'Outliers and the boxplot' },
    { value: 'describe', label: 'Describe the distribution' },
    { value: 'zscore', label: 'z-scores' }
  ];
  function step(key, label, o){ var s = { key: key, label: label, practice: SK[key] || '3.B' }; for(var k in o) s[k] = o[k]; return s; }
  function tol(d){ return Math.pow(10, -d) * 0.6; }
  function num(key, label, answer, d, mistakes, o){
    o = o || {};
    return step(key, label, { kind: 'num', d: d, unit: o.unit, hint: o.hint, cell: M.cell(answer, 1e-9, mistakes || [], o.abs || tol(d)) });
  }
  /* A choice step from [{ o, w, ok }] in a seeded order (the drill shuffles
     again on screen unless fixed). */
  function choice(r, key, label, all, fixed){
    var idx = all.map(function(x, i){ return i; });
    if(!fixed) idx = M.shuffle(r, idx);
    return step(key, label, { kind: 'choice', fixed: !!fixed, options: idx.map(function(i){ return all[i].o; }), why: idx.map(function(i){ return all[i].w; }), correct: idx.map(function(i){ return all[i].ok ? 1 : 0; }).indexOf(1) });
  }
  function u(c, v, dp){ return M.fixed(v, dp == null ? c.dp : dp) + ' ' + (Math.abs(v - 1) < 1e-12 && c.unitOne ? c.unitOne : c.unit); }
  function sorted(xs){ return xs.slice().sort(function(a, b){ return a - b; }); }
  /* The quartiles a student gets by keeping the median in both halves
     (the TI rule differs from the AP rule only when n is odd). */
  function inclusiveIqr(xs){
    var a = sorted(xs), n = a.length, h = Math.ceil(n / 2);
    var med = function(b){ var m = b.length; return m % 2 ? b[(m - 1) / 2] : (b[m / 2 - 1] + b[m / 2]) / 2; };
    return med(a.slice(n - h)) - med(a.slice(0, h));
  }
  function figure(xs, c, o){ var f = { values: xs.slice(), unit: c.unit, label: c.what, lo: c.lo, hi: c.hi, dp: c.dp || 0 }; for(var k in (o || {})) f[k] = o[k]; return f; }

  function gSummary(r, c){
    var n = r.int(7, 12), sh = r.pick(c.shapes || ['right', 'sym', 'left']), xs = clearData(r, c, sh, n);
    var S = D().summary(xs), sum = xs.reduce(function(a, b){ return a + b; }, 0);
    var listMid = n % 2 ? xs[(n - 1) / 2] : (xs[n / 2 - 1] + xs[n / 2]) / 2;
    var popSd = Math.sqrt(xs.reduce(function(a, v){ return a + (v - S.mean) * (v - S.mean); }, 0) / n);
    var text = '<p>' + c.lead + ' The ' + whats(c) + ' (' + c.unit + ') of ' + n + ' ' + c.noun + ' are:</p><p class="dx-list">' + list(xs, c.dp) + '</p>';
    var steps = [
      num('mean', 'The mean, x̄, to 2 decimal places', S.mean, 2, [
        { value: sum / (n - 1), why: 'You divided by n − 1. The mean divides the total by n = ' + n + '; n − 1 belongs to the standard deviation.' },
        { value: S.med, why: 'That is the median. The mean adds every value and divides by n.' }], { unit: c.unit }),
      num('median', 'The median', S.med, 1, [
        { value: listMid, why: 'That is the middle of the list as written. Put the values in order first, then take the middle one' + (n % 2 ? '' : ' (the mean of the middle two, since n is even)') + '.' },
        { value: (S.min + S.max) / 2, why: 'That is halfway between the smallest and the largest value (the midrange), not the median.' },
        { value: S.mean, why: 'That is the mean. The median is the middle value of the ordered data.' }], { unit: c.unit }),
      num('iqr', 'The interquartile range, IQR = Q3 − Q1', S.iqr, 1, [
        { value: S.range, why: 'That is the range (max − min). The IQR is Q3 − Q1, the spread of the middle half.' },
        { value: inclusiveIqr(xs), why: 'Leave the median out of both halves when n is odd (the rule AP® Statistics uses): the quartiles are the medians of the values below and above it.' }], { unit: c.unit }),
      num('sd', 'The sample standard deviation, s, to 2 decimal places', S.sd, 2, [
        { value: popSd, why: 'You divided by n. The sample standard deviation divides the sum of squared deviations by n − 1 = ' + (n - 1) + '.' },
        { value: S.sd * S.sd, why: 'That is the variance, s². Take its square root for the standard deviation.' }], { unit: c.unit, hint: 'A calculator’s 1-Var Stats gives it as Sx.' })
    ];
    var sol = [
      'Ordered: ' + list(sorted(xs), c.dp) + ' (n = ' + n + ').',
      'Mean: the total ' + M.fixed(sum, c.dp) + ' ÷ ' + n + ' = ' + M.fixed(S.mean, 2) + ' ' + c.unit + '.',
      'Median: ' + (n % 2 ? 'the middle (' + ((n + 1) / 2) + 'th) value, ' : 'the mean of the ' + (n / 2) + 'th and ' + (n / 2 + 1) + 'th values, ') + M.fixed(S.med, 1) + ' ' + c.unit + '.',
      'Q1 = ' + M.fixed(S.q1, 1) + ' (median of the lower half), Q3 = ' + M.fixed(S.q3, 1) + ' (median of the upper half)' + (n % 2 ? ', the median itself left out' : '') + ', so IQR = ' + M.fixed(S.iqr, 1) + ' ' + c.unit + '.',
      'Sample SD: the square root of the sum of squared deviations from the mean, divided by n − 1: s = ' + M.fixed(S.sd, 2) + ' ' + c.unit + '.'
    ];
    return { type: 'summary', text: text, steps: steps, solution: sol, data: { values: xs }, figure: figure(xs, c, { reveal: { mean: 'mean', median: 'median', iqr: 'box', sd: 'sd' } }) };
  }

  function gResist(r, c){
    var n = r.int(9, 14), xs = clearData(r, c, r.pick(c.shapes || ['right', 'sym']), n);
    var S = D().summary(xs), mx = S.max, i = xs.indexOf(mx);
    var Dv = rnd(Math.max(c.hi - c.lo, 10) * r.between(0.4, 1.1, 2), c.dp), nx = rnd(mx + Dv, c.dp);
    var ys = xs.slice(); ys[i] = nx;
    var T = D().summary(ys), dMean = T.mean - S.mean, dMed = T.med - S.med;
    var text = '<p>' + c.lead + ' The ' + whats(c) + ' (' + c.unit + ') of ' + n + ' ' + c.noun + ' are:</p><p class="dx-list">' + list(xs, c.dp) + '</p>' +
      '<p>The largest value, ' + u(c, mx) + ', was a typing error: it should be ' + u(c, nx) + '.</p>';
    var sdUp = T.sd > S.sd + 1e-9, iqrSame = Math.abs(T.iqr - S.iqr) < 1e-9;
    var steps = [
      num('dmean', 'By how much does the mean increase?', dMean, 2, [
        { value: Dv, why: 'The total grows by ' + M.fixed(Dv, c.dp) + ', but the mean spreads that over all n = ' + n + ' values: ' + M.fixed(Dv, c.dp) + ' ÷ ' + n + '.' },
        { value: Dv / (n - 1), why: 'Divide the change in the total by n = ' + n + ', not n − 1.' }], { unit: c.unit }),
      num('dmed', 'By how much does the median change?', dMed, 1, [
        { value: Dv / 2, why: 'The median is the middle of the ordered values. Making the largest value larger does not move the middle value.' },
        { value: dMean, why: 'That is the change in the mean. The median depends only on the middle of the ordered data.' }], { unit: c.unit, hint: 'Type 0 if it does not change.' }),
      choice(r, 'spread', 'What happens to the standard deviation and the IQR?', [
        { o: 'The SD increases; the IQR stays the same.', ok: sdUp && iqrSame, w: 'Right. The SD uses every value’s distance from the mean, so one far value inflates it (from ' + M.fixed(S.sd, 2) + ' to ' + M.fixed(T.sd, 2) + '). The IQR uses only Q1 and Q3, which do not move: it is resistant.' },
        { o: 'Both increase.', ok: false, w: 'The IQR is Q3 − Q1 = ' + M.fixed(S.iqr, 1) + ' before and after: the quartiles do not depend on how large the largest value is.' },
        { o: 'The IQR increases; the SD stays the same.', ok: false, w: 'It is the other way round. The SD (non-resistant) grows from ' + M.fixed(S.sd, 2) + ' to ' + M.fixed(T.sd, 2) + '; the IQR (resistant) stays ' + M.fixed(S.iqr, 1) + '.' },
        { o: 'Neither changes.', ok: false, w: 'The SD changes: it uses every value, so it grows from ' + M.fixed(S.sd, 2) + ' to ' + M.fixed(T.sd, 2) + '.' }])
    ];
    var sol = [
      'The total rises by ' + M.fixed(Dv, c.dp) + ', so the mean rises by ' + M.fixed(Dv, c.dp) + ' ÷ ' + n + ' = ' + M.fixed(dMean, 2) + ' ' + c.unit + ' (from ' + M.fixed(S.mean, 2) + ' to ' + M.fixed(T.mean, 2) + ').',
      'The median stays ' + M.fixed(S.med, 1) + ' ' + c.unit + ': the middle of the ordered data does not change.',
      'SD: ' + M.fixed(S.sd, 2) + ' → ' + M.fixed(T.sd, 2) + ' (not resistant). IQR: ' + M.fixed(S.iqr, 1) + ' → ' + M.fixed(T.iqr, 1) + ' (resistant).',
      'The mean, SD and range are not resistant to extreme values; the median and IQR are.'
    ];
    return { type: 'resist', text: text, steps: steps, solution: sol, data: { values: xs, changed: ys, index: i }, figure: figure(xs, c, { after: ys, reveal: { dmean: 'mean', dmed: 'median', spread: 'after' } }) };
  }

  function gFences(r, c){
    var hiSide = (c.shapes || ['right'])[0] !== 'left';
    var want = r() < 0.6, n = r.int(11, 15), xs, S;
    xs = clearData(r, c, hiSide ? 'right' : 'left', n, function(v, Q){
      var o = hiSide ? Q.max > Q.fences[1] : Q.min < Q.fences[0];
      if(o !== want) return false;
      // keep the extreme value a clear call either way (not within 0.5 of the fence)
      var gapF = hiSide ? Math.abs(Q.max - Q.fences[1]) : Math.abs(Q.min - Q.fences[0]);
      return gapF >= 0.5 * Math.pow(10, -(c.dp || 0)) + 0.5;
    });
    S = D().summary(xs);
    var ext = hiSide ? S.max : S.min, fence = hiSide ? S.fences[1] : S.fences[0], out = hiSide ? ext > fence : ext < fence;
    var wk = whiskers(S, xs), wEnd = hiSide ? wk[1] : wk[0];
    var text = '<p>' + c.lead + ' The ' + whats(c) + ' (' + c.unit + ') of ' + n + ' ' + c.noun + ' are:</p><p class="dx-list">' + list(xs, c.dp) + '</p>';
    var side = hiSide ? 'upper' : 'lower', sgn = hiSide ? '+' : '−';
    var steps = [
      num('q1', 'The first quartile, Q1', S.q1, 1, [{ value: S.med, why: 'That is the median. Q1 is the median of the lower half of the ordered data.' }], { unit: c.unit }),
      num('q3', 'The third quartile, Q3', S.q3, 1, [{ value: S.med, why: 'That is the median. Q3 is the median of the upper half of the ordered data.' }], { unit: c.unit }),
      num('fence', 'The ' + side + ' fence, ' + (hiSide ? 'Q3 + 1.5 × IQR' : 'Q1 − 1.5 × IQR'), fence, 2, [
        { value: hiSide ? S.q3 + S.iqr : S.q1 - S.iqr, why: 'Multiply the IQR by 1.5 before ' + (hiSide ? 'adding it to Q3' : 'subtracting it from Q1') + '.' },
        { value: hiSide ? S.q3 + 1.5 * S.range : S.q1 - 1.5 * S.range, why: 'The fence uses 1.5 × IQR (Q3 − Q1 = ' + M.fixed(S.iqr, 1) + '), not the range.' },
        { value: hiSide ? S.med + 1.5 * S.iqr : S.med - 1.5 * S.iqr, why: 'Start from ' + (hiSide ? 'Q3' : 'Q1') + ', not from the median.' },
        { value: 1.5 * S.iqr, why: 'That is 1.5 × IQR alone. ' + (hiSide ? 'Add it to Q3.' : 'Subtract it from Q1.') }], { unit: c.unit }),
      choice(r, 'isout', 'Is the ' + (hiSide ? 'largest' : 'smallest') + ' value, ' + u(c, ext) + ', an outlier by the 1.5 × IQR rule?', [
        { o: 'Yes', ok: out, w: out ? 'Right: ' + M.fixed(ext, c.dp) + (hiSide ? ' is above ' : ' is below ') + 'the fence ' + M.fixed(fence, 2) + '.' : 'It is not: ' + M.fixed(ext, c.dp) + (hiSide ? ' is below ' : ' is above ') + 'the fence ' + M.fixed(fence, 2) + ', so it is not beyond 1.5 × IQR from ' + (hiSide ? 'Q3' : 'Q1') + '.' },
        { o: 'No', ok: !out, w: !out ? 'Right: ' + M.fixed(ext, c.dp) + (hiSide ? ' is not above ' : ' is not below ') + 'the fence ' + M.fixed(fence, 2) + '.' : 'It is: ' + M.fixed(ext, c.dp) + (hiSide ? ' is above ' : ' is below ') + 'the fence ' + M.fixed(fence, 2) + '.' }], true),
      num('whisk', 'On a boxplot that marks outliers, where does the ' + side + ' whisker end?', wEnd, c.dp || 0, [
        { value: fence, why: 'A whisker ends at the most extreme data value inside the fences, not at the fence itself.' },
        { value: ext, why: out ? 'That value is an outlier, drawn as its own dot. The whisker stops at the most extreme value that is not an outlier.' : 'Check the outlier step again.' }], { unit: c.unit })
    ];
    if(!out) steps[4].cell.mistakes = steps[4].cell.mistakes.filter(function(m){ return m.value !== ext; });
    var sol = [
      'Ordered: ' + list(sorted(xs), c.dp) + '.',
      'Q1 = ' + M.fixed(S.q1, 1) + ', Q3 = ' + M.fixed(S.q3, 1) + ', IQR = ' + M.fixed(S.iqr, 1) + ' ' + c.unit + '.',
      (hiSide ? 'Upper fence = Q3 + 1.5 × IQR = ' + M.fixed(S.q3, 1) + ' + ' + M.fixed(1.5 * S.iqr, 2) : 'Lower fence = Q1 − 1.5 × IQR = ' + M.fixed(S.q1, 1) + ' − ' + M.fixed(1.5 * S.iqr, 2)) + ' = ' + M.fixed(fence, 2) + '.',
      M.fixed(ext, c.dp) + (out ? ' is beyond the fence, so it is an outlier, drawn as a separate dot.' : ' is inside the fence, so it is not an outlier.'),
      'The ' + side + ' whisker ends at ' + M.fixed(wEnd, c.dp) + ', the most extreme value inside the fences.'
    ];
    return { type: 'fences', text: text, steps: steps, solution: sol, data: { values: xs, side: side }, figure: figure(xs, c, { reveal: { q3: 'box', fence: 'fence', whisk: 'whisk' }, side: side }) };
  }

  function gDescribe(r, c){
    var sh = r.pick(c.shapes || ['right', 'left', 'sym']), n = r.int(16, 24), xs = clearData(r, c, sh, n), S = D().summary(xs);
    var dp = c.dp || 0, skewed = sh !== 'sym';
    var center = skewed ? 'a median of ' + u(c, S.med, Math.max(dp, S.med % 1 ? 1 : 0)) : 'a mean of ' + u(c, S.mean, 1);
    var spread = skewed ? 'an IQR of ' + u(c, S.iqr, Math.max(dp, S.iqr % 1 ? 1 : 0)) : 'a standard deviation of ' + u(c, S.sd, 1);
    var outs = S.outliers, outTxt = !outs.length ? 'There are no outliers by the 1.5 × IQR rule.' :
      outs.length === 1 ? 'There is one ' + (outs[0] > S.med ? 'high' : 'low') + ' outlier at ' + u(c, outs[0]) + '.' : 'There are ' + outs.length + ' outliers (' + list(sorted(outs), dp) + ' ' + c.unit + ').';
    var shapeW = { right: 'skewed right', left: 'skewed left', sym: 'roughly symmetric' };
    var wrongDir = sh === 'left' ? 'skewed right' : 'skewed left';
    var good = 'The distribution of ' + whats(c) + ' is ' + shapeW[sh] + ', with ' + center + ' and ' + spread + '. ' + outTxt;
    var tailNote = 'The values reach ' + M.fixed(S.max - S.med, dp) + ' ' + c.unit + ' above the median and ' + M.fixed(S.med - S.min, dp) + ' ' + c.unit + ' below it.';
    var gap = S.mean - S.med;
    var steps = [
      choice(r, 'shape', 'What is the shape of the distribution?', [
        { o: 'Skewed right', ok: sh === 'right', w: sh === 'right' ? 'Right: the long tail is toward the larger values. ' + tailNote : 'Skewed right means a long tail toward the larger values. ' + tailNote },
        { o: 'Skewed left', ok: sh === 'left', w: sh === 'left' ? 'Right: the long tail is toward the smaller values. ' + tailNote : 'Skewed left means a long tail toward the smaller values. ' + tailNote },
        { o: 'Roughly symmetric', ok: sh === 'sym', w: sh === 'sym' ? 'Right: the two sides of the median look alike. ' + tailNote : 'The sides are not alike. ' + tailNote }], true),
      choice(r, 'vs', 'How do the mean and the median compare?', [
        { o: 'The mean is greater than the median.', ok: sh === 'right', w: 'The mean is ' + M.fixed(S.mean, 2) + ' and the median ' + M.fixed(S.med, 1) + '. ' + (sh === 'right' ? 'A long right tail pulls the mean up toward it.' : sh === 'left' ? 'A long left tail pulls the mean down, below the median.' : 'They are close: symmetric data have the mean near the median.') },
        { o: 'The mean is less than the median.', ok: sh === 'left', w: 'The mean is ' + M.fixed(S.mean, 2) + ' and the median ' + M.fixed(S.med, 1) + '. ' + (sh === 'left' ? 'A long left tail pulls the mean down toward it.' : sh === 'right' ? 'A long right tail pulls the mean up, above the median.' : 'They are close: symmetric data have the mean near the median.') },
        { o: 'They are about the same.', ok: sh === 'sym', w: 'The mean is ' + M.fixed(S.mean, 2) + ' and the median ' + M.fixed(S.med, 1) + ', a difference of ' + M.fixed(Math.abs(gap), 2) + ' (' + M.fixed(Math.abs(gap) / S.sd, 2) + ' SD). ' + (sh === 'sym' ? 'Symmetric data have the mean near the median.' : 'The tail pulls the mean away from the median.') }], true),
      choice(r, 'sentence', 'Which description would earn full credit?', [
        { o: good, ok: true, w: 'Right: shape, center, spread and unusual features, each with a number, in context (the variable and its units).' },
        { o: 'The distribution is ' + shapeW[sh] + ', with a center of ' + M.fixed(skewed ? S.med : S.mean, 1) + ' and a spread of ' + M.fixed(skewed ? S.iqr : S.sd, 1) + '.', ok: false, w: 'No context: say what was measured (' + whats(c) + ') and the units (' + c.unit + '), and mention outliers or say there are none.' },
        { o: 'The distribution of ' + whats(c) + ' is ' + wrongDir + ', with ' + center + ' and ' + spread + '. ' + outTxt, ok: false, w: sh === 'sym' ? 'The data are roughly symmetric, not skewed: ' + tailNote : 'Wrong direction. Skew is named for the long tail: ' + tailNote },
        { o: 'The distribution of ' + whats(c) + ' is ' + shapeW[sh] + ', with ' + center + ' and a spread from ' + u(c, S.min) + ' to ' + u(c, S.max) + '. ' + outTxt, ok: false, w: 'A spread is one number. The range is max − min = ' + u(c, S.range) + ', not an interval “from … to …”.' }])
    ];
    var sol = [
      'Shape: ' + shapeW[sh] + '. ' + tailNote,
      'Center: mean ' + M.fixed(S.mean, 2) + ', median ' + M.fixed(S.med, 1) + ' ' + c.unit + (skewed ? '; for skewed data the median is the better summary.' : '; for symmetric data either works.'),
      'Spread: SD ' + M.fixed(S.sd, 2) + ', IQR ' + M.fixed(S.iqr, 1) + ' ' + c.unit + '. Fences ' + M.fixed(S.fences[0], 2) + ' and ' + M.fixed(S.fences[1], 2) + '. ' + outTxt,
      'Full credit: ' + good
    ];
    return { type: 'describe', text: '<p>' + c.lead + ' The dotplot shows the ' + whats(c) + ' (' + c.unit + ') of ' + n + ' ' + c.noun + '.</p>', steps: steps, solution: sol, data: { values: xs, shape: sh }, figure: figure(xs, c, { hist: true, reveal: { vs: 'center', sentence: 'box' } }) };
  }

  function gZscore(r, c){
    var n = r.int(14, 22), xs = clearData(r, c, 'sym', n), S = D().summary(xs);
    var m2 = M.round(S.mean, 2), s2 = M.round(S.sd, 2), a = sorted(xs);
    // a value from the data that is not near the mean (so the sign matters)
    var pool = xs.filter(function(v){ return Math.abs(v - S.mean) > 0.4 * S.sd; });
    var x = r.pick(pool.length ? pool : [a[0], a[a.length - 1]]);
    var zz = (x - m2) / s2, above = zz > 0, two = Math.abs(zz) > 2;
    var name = r.pick(c.names || ['One of them']);
    var text = '<p>' + c.lead + ' For the ' + whats(c) + ' of these ' + n + ' ' + c.noun + ', the mean is ' + M.fixed(m2, 2) + ' ' + c.unit + ' and the standard deviation is ' + M.fixed(s2, 2) + ' ' + c.unit + '. ' + name + '’s value is ' + u(c, x) + '.</p>';
    var zs = M.fixed(Math.abs(zz), 2);
    var steps = [
      num('z', 'The z-score of ' + u(c, x), zz, 2, [
        { value: -zz, why: 'Subtract in the order value minus mean: (' + M.fixed(x, c.dp) + ' − ' + M.fixed(m2, 2) + ') ÷ ' + M.fixed(s2, 2) + '. A value ' + (above ? 'above' : 'below') + ' the mean has a ' + (above ? 'positive' : 'negative') + ' z-score.' },
        { value: (x - m2) / (s2 * s2), why: 'Divide by the standard deviation, not the variance.' },
        { value: (x - S.med) / s2, why: 'Use the mean, not the median: z = (value − mean) ÷ SD.' },
        { value: x - m2, why: 'That is the distance from the mean in ' + c.unit + '. Divide it by the SD to count standard deviations.' }], { abs: 0.011 }),
      choice(r, 'zread', 'Which sentence interprets the z-score?', [
        { o: name + '’s ' + c.what + ' of ' + u(c, x) + ' is ' + zs + ' standard deviations ' + (above ? 'above' : 'below') + ' the mean ' + c.what + ' of these ' + c.noun + '.', ok: true, w: 'Right: how many SDs, which side of the mean, in context.' },
        { o: name + '’s ' + c.what + ' is ' + zs + ' ' + c.unit + ' ' + (above ? 'above' : 'below') + ' the mean.', ok: false, w: 'A z-score counts standard deviations, not ' + c.unit + '. The distance in ' + c.unit + ' is ' + M.fixed(Math.abs(x - m2), 2) + '.' },
        { o: name + '’s ' + c.what + ' is ' + zs + ' standard deviations ' + (above ? 'below' : 'above') + ' the mean ' + c.what + ' of these ' + c.noun + '.', ok: false, w: 'Wrong side: a ' + (above ? 'positive' : 'negative') + ' z-score means ' + (above ? 'above' : 'below') + ' the mean.' },
        { o: name + '’s ' + c.what + ' is ' + zs + ' standard deviations ' + (above ? 'above' : 'below') + ' the median.', ok: false, w: 'A z-score measures from the mean, not the median.' }]),
      choice(r, 'zrule', 'Is ' + u(c, x) + ' an outlier by the rule “more than 2 standard deviations from the mean”?', [
        { o: 'Yes', ok: two, w: two ? 'Right: |z| = ' + zs + ' is more than 2.' : 'No: |z| = ' + zs + ' is not more than 2.' },
        { o: 'No', ok: !two, w: !two ? 'Right: |z| = ' + zs + ' is within 2.' : 'It is: |z| = ' + zs + ' is more than 2.' }], true)
    ];
    var sol = [
      'z = (value − mean) ÷ SD = (' + M.fixed(x, c.dp) + ' − ' + M.fixed(m2, 2) + ') ÷ ' + M.fixed(s2, 2) + ' = ' + M.fixed(zz, 2) + '.',
      name + '’s ' + c.what + ' is ' + zs + ' standard deviations ' + (above ? 'above' : 'below') + ' the mean.',
      '|z| = ' + zs + (two ? ' > 2, so it is an outlier by the 2 SD rule.' : ' ≤ 2, so it is not an outlier by the 2 SD rule.') + ' (The 1.5 × IQR rule is the other rule the course uses; they can disagree.)'
    ];
    return { type: 'zscore', text: text, steps: steps, solution: sol, data: { values: xs, x: x, mean: m2, sd: s2 }, figure: figure(xs, c, { mark: x, reveal: { z: 'zscale' }, given: { mean: m2, sd: s2 } }) };
  }

  var GEN = { summary: gSummary, resist: gResist, fences: gFences, describe: gDescribe, zscore: gZscore };
  function generate(r, ctx, type){
    var types = (ctx.types || ['summary']).filter(function(t){ return GEN[t]; });
    var t = type && types.indexOf(type) > -1 ? type : r.pick(types);
    var p = GEN[t](r, ctx);
    p.ctx = ctx.id; p.topic = ctx.topic || TOPIC[t]; p.type = t;
    return p;
  }

  M.register('dataExplorer', {
    stats: stats, bins: bins, binStart: binStart, z: z, skew: skew, shape: shape, whiskers: whiskers,
    SHAPE_RULE: SHAPE_RULE, TYPES: TYPES, TOPIC: TOPIC, makeData: makeData, clearData: clearData, inclusiveIqr: inclusiveIqr,
    generate: generate
  });
})();
