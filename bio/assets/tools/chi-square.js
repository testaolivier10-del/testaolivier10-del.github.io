/* Skills tool: the chi-square goodness-of-fit test. The solver and the seeded problem generator are
   ApBioProblems.solve.chi and generate.chi (bio-skill-problems.js);
   the contexts, the fixed problems and the formula box are data
   (bio/data/tools/chi-square.json); the page is ApBioTools.skillTool.

   The picture (one drawing, used twice): observed counts as bars, the
   expected counts as dashed boxes; each category's (o − e)²/e is a segment
   of a stacked meter that runs along the χ² axis to χ²; under it, the χ²
   distribution for the current df (ApBioMath.chiPdf) with the p = 0.05
   critical value from the formula sheet table (ApBioMath.CHI_CRIT) and its
   5% tail shaded.
     Explore: pick a test, drag any observed bar (or use the arrow keys or
     −/+), and χ², the meter and the decision move at once. "Chance sample"
     draws counts from the null's own proportions, so the student sees about
     1 in 20 cross the line by chance.
     Practice: the stage shows the problem's observed counts and draws what
     the student types (their expected counts, their df's curve, their
     critical value, their χ²); after Check it shows the real ones. */
(function(){
  'use strict';
  var T = window.ApBioTools, S = window.ApBioSkillStage, M = window.ApBioMath;
  if(!T || !S) return;
  var F = T.F, esc = T.esc;
  var CLS = ['c1', 'c2', 'c3', 'c4', 'c5', 'c6', 'c7', 'c8', 'c9'];
  /* The formula sheet's table of critical values at p = 0.05 and 0.01,
     always on screen: finding the critical value is part of the skill. */
  function critTable(){
    var cols = ['p'], r5 = ['0.05'], r1 = ['0.01'];
    for(var df = 1; df <= 8; df++){ cols.push('df = ' + df); r5.push(M.CHI_CRIT['0.05'][df].toFixed(2)); r1.push(M.CHI_CRIT['0.01'][df].toFixed(2)); }
    return '<section class="bt-card" aria-labelledby="chi-crit-h"><h2 id="chi-crit-h">Critical values of χ²</h2>' + T.dataTable(cols, [r5, r1], 'Reject the null hypothesis when χ² is greater than the critical value for your degrees of freedom (df). This course uses p = 0.05.') + '</section>';
  }

  /* ------------------------------------------------------- the drawing */
  /* v: { cats, obs, exp (true expected, or null), expMine (typed, or null),
     terms, df, crit, critMine, chi2, chi2Mine (each may be null), ymax, drag, label } */
  var W = 380, L = 36, R = 10, BT = 34, BH = 150, MY = 240, MH = 16, CT = 262, CH = 100, H = 410;
  function draw(v){
    var p = [], n = v.cats.length, pw = W - L - R;
    var cx = function(i){ return L + pw * (i + 0.5) / n; }, bw = Math.min(46, pw / n * 0.56);
    var by = function(c){ return BT + BH - Math.min(1, c / v.ymax) * BH; };
    var step = T.niceStep(v.ymax, 4);
    for(var g = 0; g <= v.ymax + 1e-9; g += step) p.push('<line class="grid" x1="' + L + '" x2="' + (W - R) + '" y1="' + by(g).toFixed(1) + '" y2="' + by(g).toFixed(1) + '"/><text class="tick" x="' + (L - 6) + '" y="' + (by(g) + 4).toFixed(1) + '" text-anchor="end">' + M.round(g, 6) + '</text>');
    p.push('<text class="sk-ph" x="' + L + '" y="' + (BT - 22) + '">Bars: observed. Dashed boxes: expected.</text>');
    p.push('<line class="axis" x1="' + L + '" x2="' + (W - R) + '" y1="' + (BT + BH) + '" y2="' + (BT + BH) + '"/>');
    v.cats.forEach(function(c, i){
      var x = cx(i), o = v.obs[i], top = by(o);
      if(v.drag) p.push('<rect class="sk-col" data-k="' + i + '" x="' + (x - pw / n / 2).toFixed(1) + '" y="' + BT + '" width="' + (pw / n).toFixed(1) + '" height="' + BH + '"/>');
      p.push('<path class="sk-obs ' + CLS[i] + '" d="' + T.barPath(x - bw / 2, top, bw, BT + BH - top) + '"/>');
      var e = v.exp ? v.exp[i] : v.expMine && isFinite(v.expMine[i]) ? v.expMine[i] : null;
      if(e != null){
        var ey = by(e);
        p.push('<rect class="sk-exp' + (v.exp ? '' : ' mine') + '" x="' + (x - bw / 2 - 5).toFixed(1) + '" y="' + ey.toFixed(1) + '" width="' + (bw + 10).toFixed(1) + '" height="' + (BT + BH - ey).toFixed(1) + '"/>');
        if(Math.abs(top - ey) > 5) p.push('<line class="sk-gap" x1="' + (x + bw / 2 + 9).toFixed(1) + '" x2="' + (x + bw / 2 + 9).toFixed(1) + '" y1="' + top.toFixed(1) + '" y2="' + ey.toFixed(1) + '"/>');
      }
      // Near the top of the scale the count would run into the caption, so it moves beside the bar.
      var ly = top - (v.drag ? 16 : 7), side = ly < BT - 8;
      p.push('<text class="sk-val" x="' + (side ? x - bw / 2 - 6 : x).toFixed(1) + '" y="' + (side ? top + 12 : ly).toFixed(1) + '" text-anchor="' + (side ? 'end' : 'middle') + '">' + o + '</text>');
      p.push('<text class="tick sk-cat" x="' + x.toFixed(1) + '" y="' + (BT + BH + 17) + '" text-anchor="middle">' + esc(c) + '</text>');
      if(v.drag) p.push('<circle class="sk-grip" data-k="' + i + '" tabindex="0" role="slider" aria-orientation="vertical" aria-label="' + esc(c + ' observed count') + '" aria-valuemin="0" aria-valuemax="' + v.ymax + '" aria-valuenow="' + o + '" aria-valuetext="' + esc(c + ': observed ' + o + ', expected ' + F(v.exp[i], 1)) + '" cx="' + x.toFixed(1) + '" cy="' + top.toFixed(1) + '" r="8"/>');
    });
    var df = v.df, crit = v.crit != null ? v.crit : v.critMine;
    var far = Math.max(crit || 0, v.chi2Mine || 0, v.chi2 || 0);
    var xmax = T.niceMax(Math.max(df ? M.CHI_CRIT['0.05'][df] * 1.9 : 10, Math.min(far, 60) * 1.12));
    var sx = function(x){ return L + Math.min(1, Math.max(0, x / xmax)) * pw; };
    p.push('<text class="sk-ph" x="' + L + '" y="' + (MY - 8) + '">χ² = Σ (o − e)² / e</text>');
    if(v.terms){
      var acc = 0;
      p.push('<rect class="sk-track" x="' + L + '" y="' + MY + '" width="' + pw + '" height="' + MH + '"/>');
      v.terms.forEach(function(t, i){
        var x0 = sx(acc), x1 = sx(acc + t); acc += t;
        if(x1 - x0 < 0.4) return;
        p.push('<rect class="sk-seg ' + CLS[i] + '" x="' + x0.toFixed(1) + '" y="' + MY + '" width="' + (x1 - x0).toFixed(1) + '" height="' + MH + '"/>');
      });
    } else p.push('<rect class="sk-track" x="' + L + '" y="' + MY + '" width="' + pw + '" height="' + MH + '"/>');
    var base = CT + CH;
    if(df){
      var pts = [], top2 = 0, NP = 160;
      for(var k = 1; k <= NP; k++){ var xx = xmax * k / NP; pts.push([xx, M.chiPdf(xx, df)]); if(df > 1 || xx >= 0.5) top2 = Math.max(top2, pts[k - 1][1]); }
      if(df === 2) top2 = Math.max(top2, 0.5);
      var cy = function(y){ return base - Math.min(1, y / (top2 * 1.08)) * CH; };
      if(crit){
        var tail = pts.filter(function(q){ return q[0] >= crit; });
        if(tail.length) p.push('<path class="sk-tail" d="M' + sx(crit).toFixed(1) + ' ' + base + ' L' + sx(crit).toFixed(1) + ' ' + cy(M.chiPdf(crit, df)).toFixed(1) + ' ' + tail.map(function(q){ return 'L' + sx(q[0]).toFixed(1) + ' ' + cy(q[1]).toFixed(1); }).join(' ') + ' L' + sx(xmax).toFixed(1) + ' ' + base + 'Z"/>');
      }
      p.push('<path class="sk-curve" d="M' + L + ' ' + (df > 2 ? base : df === 2 ? cy(0.5) : CT).toFixed(1) + ' ' + pts.map(function(q){ return 'L' + sx(q[0]).toFixed(1) + ' ' + cy(q[1]).toFixed(1); }).join(' ') + '"/>');
      p.push('<text class="sk-ph" x="' + (W - R) + '" y="' + (MY - 8) + '" text-anchor="end">curve: chance alone, df = ' + df + '</text>');
    } else p.push('<text class="sk-ph sk-dim" x="' + (L + pw / 2) + '" y="' + (CT + CH / 2) + '" text-anchor="middle">Type the degrees of freedom to see its χ² curve</text>');
    p.push('<line class="axis" x1="' + L + '" x2="' + (W - R) + '" y1="' + base + '" y2="' + base + '"/>');
    var xs = T.niceStep(xmax, 5);
    for(var q = 0; q <= xmax + 1e-9; q += xs) p.push('<text class="tick" x="' + sx(q).toFixed(1) + '" y="' + (base + 15) + '" text-anchor="middle">' + M.round(q, 6) + '</text>');
    if(crit){
      var cX = sx(crit), right = cX > W - 120;
      p.push('<line class="sk-crit' + (v.crit == null ? ' mine' : '') + '" x1="' + cX.toFixed(1) + '" x2="' + cX.toFixed(1) + '" y1="' + (MY - 4) + '" y2="' + base + '"/>');
      p.push('<text class="sk-critl" x="' + (cX + (right ? -5 : 5)).toFixed(1) + '" y="' + (CT + 22) + '" text-anchor="' + (right ? 'end' : 'start') + '">' + (v.crit == null ? 'your ' : '') + 'critical ' + F(crit, 2) + '</text>');
      if(df) p.push('<text class="sk-ph sk-dim" x="' + (cX + (right ? -5 : 5)).toFixed(1) + '" y="' + (base - 6) + '" text-anchor="' + (right ? 'end' : 'start') + '">5% tail</text>');
    }
    function marker(x, cls, label, dy){
      var X = sx(x), off = x > xmax;
      p.push('<line class="sk-mark ' + cls + '" x1="' + X.toFixed(1) + '" x2="' + X.toFixed(1) + '" y1="' + (MY - 3) + '" y2="' + base + '"/>');
      p.push('<text class="sk-markl ' + cls + '" x="' + X.toFixed(1) + '" y="' + (base + 31 + (dy || 0)) + '" text-anchor="' + (X > W - 70 ? 'end' : X < L + 40 ? 'start' : 'middle') + '">' + label + (off ? ' →' : '') + '</text>');
    }
    if(v.chi2Mine != null && (v.chi2 == null || Math.abs(v.chi2Mine - v.chi2) > 0.005)) marker(v.chi2Mine, 'mine', 'your χ² ' + F(v.chi2Mine, 2), v.chi2 != null ? 16 : 0);
    if(v.chi2 != null) marker(v.chi2, 'real', 'χ² = ' + F(v.chi2, 2));
    return '<svg class="bio-svg sk-chi" viewBox="0 0 ' + W + ' ' + (H + (v.chi2Mine != null && v.chi2 != null ? 14 : 0)) + '" role="' + (v.drag ? 'group' : 'img') + '" aria-label="' + esc(v.label) + '">' + p.join('') + '</svg>';
  }
  function verdict(rej){ return rej ? '<span class="sk-verdict rej">Reject the null</span>' : '<span class="sk-verdict keep">Fail to reject the null</span>'; }

  /* ------------------------------------------------------- explore */
  function explore(app, data){
    var ctxs = data.contexts, N0 = 120;
    var sec = S.card(app, { title: 'Drag the counts, watch χ²', lead: 'Drag a bar away from its dashed box (what the null expects) and watch the gap add to χ².' });
    sec.insertAdjacentHTML('beforeend', '<div class="bt-controls sk-pick"></div><div class="sk-fig sk-drag"></div><div class="sk-steppers" role="group" aria-label="Observed counts"></div>' +
      '<div class="sk-out"></div><p class="sk-say" aria-live="polite" role="status"></p><div class="bt-buttons"><button type="button" class="bt-btn sk-chance">Chance sample</button><button type="button" class="bt-btn sk-double">Double the sample</button><button type="button" class="bt-btn sk-reset">Reset to expected</button></div><p class="bt-small sk-tally"></p><div class="sk-goalhost"></div>');
    var fig = sec.querySelector('.sk-fig'), out = sec.querySelector('.sk-out'), steppers = sec.querySelector('.sk-steppers');
    var sayEl = sec.querySelector('.sk-say'), tallyEl = sec.querySelector('.sk-tally');
    function say(t){ sayEl.textContent = t; }
    var done = S.goals(sec.querySelector('.sk-goalhost'), [
      { id: 'flip', text: 'Drag one bar until the decision flips to <b>reject</b>.' },
      { id: 'double', text: 'With χ² under the line, <b>double the sample</b>: the same proportions now give twice the χ².' },
      { id: 'df', text: 'Switch to a test with more categories: the critical value moves right (df = categories − 1).' },
      { id: 'chance', text: 'Draw 20 <b>chance samples</b>: about 1 in 20 crosses the line even when the null is true.' }
    ]);
    var c, obs, ymax, tally = { n: 0, over: 0 };
    var start = Math.max(0, ctxs.map(function(x){ return x.cats.length; }).indexOf(3));
    var pick = T.choiceSelect({ label: 'The test', options: ctxs.map(function(x, i){ return { value: i, label: x.cats.join(' / ') + ' (' + x.cats.length + ' categories)' }; }), value: start, onChange: function(i){ var before = c.cats.length; load(+i); if(c.cats.length > before) done('df'); } });
    sec.querySelector('.sk-pick').appendChild(pick.el);
    function load(i){
      c = ctxs[i];
      obs = M.apportion(c.props, N0);
      tally = { n: 0, over: 0 }; tallyEl.textContent = '';
      scale(); render();
      say('The null hypothesis: ' + c.null + '. Counts start at what it expects, so χ² = 0.');
    }
    function scale(){ var N = M.sum(obs); ymax = T.niceMax(Math.max.apply(null, c.props.map(function(q, i){ return Math.max(q * N * 1.9, obs[i] * 1.15); }))); }
    function stats(){ var N = M.sum(obs), exp = c.props.map(function(q){ return q * N; }); var r = M.chiSquare(obs, exp); r.N = N; r.exp = exp; return r; }
    function render(){
      var r = stats();
      S.redraw(fig, draw({ cats: c.cats, obs: obs, exp: r.exp, terms: r.terms, df: r.df, crit: r.crit, chi2: r.chi2, ymax: ymax, drag: true,
        label: 'Observed and expected counts, the chi-square meter and the chi-square curve for df ' + r.df + '. χ² = ' + F(r.chi2, 2) + ', critical value ' + F(r.crit, 2) + ': ' + (r.reject ? 'reject' : 'fail to reject') + ' the null hypothesis.' }));
      steppers.innerHTML = c.cats.map(function(k, i){ return '<span class="sk-stp"><span class="sk-sw ' + CLS[i] + '" aria-hidden="true"></span><span class="sk-stpn">' + esc(k) + '</span><button type="button" class="bt-step" data-i="' + i + '" data-d="-1" aria-label="One fewer: ' + esc(k) + '">−</button><b>' + obs[i] + '</b><button type="button" class="bt-step" data-i="' + i + '" data-d="1" aria-label="One more: ' + esc(k) + '">+</button></span>'; }).join('');
      var low = r.exp.filter(function(e){ return e < 5; }).length;
      out.innerHTML = S.readout([['Total N', String(r.N)], ['df', r.df + ' <small>(' + c.cats.length + ' − 1)</small>'], ['χ²', F(r.chi2, 2)], ['Critical, p = 0.05', F(r.crit, 2)]]) +
        '<p class="sk-decide">' + verdict(r.reject) + ' <span>' + (r.reject ? 'χ² is past the line: gaps this big would happen by chance less than 5% of the time if the null were true.' : 'χ² is short of the line: chance alone could easily give gaps this size.') + '</span></p>' +
        (low ? '<p class="sk-warn">An expected count is under 5: the test is not reliable with a sample this small.</p>' : '');
      // Tool Studio: the result lands on the stage, one line in the caption.
      var LS = window.LevlStudio && window.LevlStudio.get();
      if(LS){
        LS.pills([{ k: 'χ²', html: F(r.chi2, 2), tone: 'readout' }, r.chi2 < 0.005 ? null : { html: r.reject ? 'Reject the null' : 'Fail to reject', tone: r.reject ? 'bad' : 'good' }], 'left', 'explore');
        LS.pills([{ html: 'df ' + r.df + ' · critical ' + F(r.crit, 2), tone: 'ghost' }], 'right', 'explore');
        LS.caption(r.chi2 < 0.005 ? '<b>Observed matches expected,</b> so χ² is 0. Pull a bar away from its box.'
          : '<b>χ² = ' + F(r.chi2, 2) + '</b>, ' + (r.reject ? 'past' : 'short of') + ' the critical value ' + F(r.crit, 2) + ': ' + (r.reject ? 'reject' : 'fail to reject') + ' the null.' + (low ? ' An expected count is under 5.' : ''), 'explore');
      }
      return r;
    }
    function explain(i, r, flip){
      var e = r.exp[i], d = obs[i] - e;
      say((flip ? (r.reject ? 'Decision flipped: reject the null. ' : 'Decision flipped back: fail to reject. ') : '') +
        c.cats[i] + ': observed ' + obs[i] + ', expected ' + F(e, 1) + '. (o − e)² / e = (' + F(d, 1) + ')² / ' + F(e, 1) + ' = ' + F(r.terms[i], 2) + ' of χ² = ' + F(r.chi2, 2) + (d && obs[i] < e ? '. Too few counts add to χ² just like too many.' : '.'));
    }
    function set(i, val, quiet){
      var was = stats().reject;
      obs[i] = Math.max(0, Math.min(Math.floor(ymax), Math.round(val)));
      if(M.sum(obs) === 0) obs[i] = 1;
      var r = render();
      if(was !== r.reject && r.reject) done('flip');
      if(!quiet || was !== r.reject) explain(i, r, was !== r.reject);
    }
    var countAt = function(y){ return (BT + BH - y) / BH * ymax; };
    S.drag(fig, '[data-k]', { move: function(k, pt){ set(+k, countAt(pt.y), true); }, end: function(k){ explain(+k, stats(), false); } });
    S.keys(fig, '.sk-grip', function(k, d, big){ set(+k, obs[+k] + d * (big ? 5 : 1)); });
    steppers.addEventListener('click', function(e){ var b = e.target.closest('button'); if(!b) return; var i = +b.getAttribute('data-i'); set(i, obs[i] + (+b.getAttribute('data-d'))); var f = steppers.querySelector('button[data-i="' + i + '"][data-d="' + b.getAttribute('data-d') + '"]'); if(f) f.focus(); });
    sec.querySelector('.sk-reset').addEventListener('click', function(){ obs = M.apportion(c.props, M.sum(obs) || N0); scale(); render(); say('Back to the expected counts: χ² is about 0.'); });
    sec.querySelector('.sk-double').addEventListener('click', function(){
      var a = stats();
      if(a.N * 2 > 2000){ say('That is plenty of data already. Reset to expected first.'); return; }
      obs = obs.map(function(o){ return o * 2; }); scale(); var r = render();
      say('Every count doubled: same proportions, but χ² went from ' + F(a.chi2, 2) + ' to ' + F(r.chi2, 2) + '. With more data, the same departure is harder to blame on chance.' + (r.reject && !a.reject ? ' The decision flipped to reject.' : ''));
      if(a.chi2 > 0.3 && !a.reject) done('double');
    });
    sec.querySelector('.sk-chance').addEventListener('click', function(){
      var N = M.sum(obs) || N0;
      obs = c.props.map(function(){ return 0; });
      for(var k = 0; k < N; k++){ var u = Math.random(), acc = 0; for(var q = 0; q < c.props.length; q++){ acc += c.props[q]; if(u < acc || q === c.props.length - 1){ obs[q]++; break; } } }
      scale(); var r = render();
      tally.n++; if(r.reject) tally.over++;
      tallyEl.textContent = 'Chance samples: ' + tally.n + '. Past the line: ' + tally.over + ' (' + Math.round(100 * tally.over / tally.n) + '%). When the null is true, about 5% are.';
      say('A sample of ' + N + ' drawn at random from the null’s own proportions: χ² = ' + F(r.chi2, 2) + (r.reject ? ', past the line by chance alone: a false alarm (a type I error).' : ', under the line, as most chance samples are.'));
      if(tally.n >= 20) done('chance');
    });
    load(start);
  }

  /* ---------------------------------------------------- practice stage */
  function stage(host, s){
    var x = s.input, a = s.answers || {}, chk = s.phase === 'checked';
    var N = M.sum(x.obs), exp = x.props.map(function(q){ return q * N; }), res = M.chiSquare(x.obs, exp);
    var mineE = x.cats.map(function(c, i){ return S.num(a['exp-' + i]); });
    var dfT = S.num(a.df), df = chk ? res.df : (dfT >= 1 && dfT <= 8 && dfT === Math.round(dfT) ? dfT : null);
    var cT = S.num(a.crit), xT = S.num(a.chi2);
    var v = { cats: x.cats, obs: x.obs, ymax: T.niceMax(Math.max.apply(null, x.obs.concat(exp)) * 1.2),
      exp: chk ? exp : null, expMine: chk ? null : mineE, terms: chk ? res.terms : null, df: df,
      crit: chk ? res.crit : null, critMine: chk ? null : (cT > 0 && cT < 60 ? cT : null),
      chi2: chk ? res.chi2 : null, chi2Mine: xT >= 0 ? xT : null };
    v.label = 'The observed counts' + (chk ? ', the expected counts, and χ² = ' + F(res.chi2, 2) + ' against the critical value ' + F(res.crit, 2) : '') + '.';
    var cap;
    if(chk){
      var big = 0; res.terms.forEach(function(t, i){ if(t > res.terms[big]) big = i; });
      cap = 'Each colored segment is one category’s (o − e)²/e; together they make χ² = <b>' + F(res.chi2, 2) + '</b>, and the biggest share comes from <b>' + esc(x.cats[big]) + '</b>. χ² lands ' + (res.reject ? '<b>past</b>' : '<b>short of</b>') + ' the critical value ' + F(res.crit, 2) + ', so ' + (res.reject ? 'reject' : 'fail to reject') + ' the null.' +
        (v.chi2Mine != null && Math.abs(v.chi2Mine - res.chi2) > Math.max(0.01, res.chi2 * 0.01) ? ' Your χ² is the dashed marker.' : '');
    } else {
      var typed = mineE.filter(isFinite).length;
      cap = typed ? 'Your expected counts are the dashed boxes; each gap between a bar and its box adds to χ².' + (v.chi2Mine != null ? ' Your χ² is the dashed marker' + (df ? ' on the curve.' : '.') : '')
        : 'These are the observed counts. Type the expected counts and they appear as dashed boxes; type df and its χ² curve appears.';
    }
    S.redraw(host, '<div class="sk-fig">' + draw(v) + '</div><p class="sk-cap">' + cap + '</p>');
  }

  T.mount('chi-square', function(app, data){
    explore(app, data);
    T.skillTool(app, data, { slug: 'chi-square', kind: 'chi', stage: stage });
    app.insertAdjacentHTML('beforeend', critTable());
  });
})();
