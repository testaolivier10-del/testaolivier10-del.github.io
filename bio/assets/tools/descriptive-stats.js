/* Skills tool: mean, median, range, standard deviation (n − 1) and standard error. The solver and the seeded problem generator are
   ApBioProblems.solve.descriptive and generate.descriptive (bio-skill-problems.js);
   the contexts, the fixed problems and the formula box are data
   (bio/data/tools/descriptive-stats.json); the page is ApBioTools.skillTool.

   The picture: a dot plot on a number line with the mean (solid), the
   median (dashed), a ±1 SD band and a ±1 SE bracket around the mean, all
   from ApBioMath (mean, median, sd, se).
     Explore: drag any dot (or focus it and use the arrow keys); drag one
     far out and the mean chases it while the median barely moves; add or
     remove a dot to see SE shrink with n.
     Practice: the problem's values as dots; the student's typed mean,
     median and ±SD/SE are drawn as they type; the true ones after Check. */
(function(){
  'use strict';
  var T = window.ApBioTools, S = window.ApBioSkillStage, M = window.ApBioMath;
  if(!T || !S) return;
  var F = T.F, esc = T.esc;
  var W = 420, L = 18, R = 18, AY = 150, H = 196;

  /* v: { values, lo, hi, unit, mean, median, sd, se (true or null), mine: {mean, median, sd, se}, drag, dp } */
  function draw(v){
    var p = [], pw = W - L - R, sx = function(x){ return L + (x - v.lo) / (v.hi - v.lo) * pw; };
    var step = T.niceStep(v.hi - v.lo, 6);
    for(var t = Math.ceil(v.lo / step - 1e-9) * step; t <= v.hi + 1e-9; t += step) p.push('<line class="grid" x1="' + sx(t).toFixed(1) + '" x2="' + sx(t).toFixed(1) + '" y1="28" y2="' + AY + '"/><text class="tick" x="' + sx(t).toFixed(1) + '" y="' + (AY + 17) + '" text-anchor="middle">' + M.round(t, 6) + '</text>');
    p.push('<line class="axis" x1="' + L + '" x2="' + (W - R) + '" y1="' + AY + '" y2="' + AY + '"/>');
    p.push('<text class="sk-ph" x="' + (L + pw / 2) + '" y="' + (H - 4) + '" text-anchor="middle">' + esc((v.label || 'Value') + (v.unit ? ' (' + v.unit + ')' : '')) + '</text>');
    function band(m, sd, se, mine){
      if(isFinite(m) && isFinite(sd) && sd > 0) p.push('<rect class="ds-sd' + (mine ? ' mine' : '') + '" x="' + sx(m - sd).toFixed(1) + '" y="40" width="' + (sx(m + sd) - sx(m - sd)).toFixed(1) + '" height="' + (AY - 40) + '"/><text class="ds-bl" x="' + sx(m + sd).toFixed(1) + '" y="36" text-anchor="middle">+1 SD</text><text class="ds-bl" x="' + sx(m - sd).toFixed(1) + '" y="36" text-anchor="middle">−1 SD</text>');
      if(isFinite(m) && isFinite(se) && se > 0) p.push('<path class="ds-se' + (mine ? ' mine' : '') + '" d="M' + sx(m - se).toFixed(1) + ' 58 v-8 M' + sx(m - se).toFixed(1) + ' 54 H' + sx(m + se).toFixed(1) + ' M' + sx(m + se).toFixed(1) + ' 58 v-8"/><text class="ds-bl" x="' + sx(m + se).toFixed(1) + '" y="68" text-anchor="start" dx="3">±1 SE</text>');
    }
    if(v.mean != null) band(v.mean, v.sd, v.se, false);
    else if(v.mine) band(v.mine.mean, v.mine.sd, v.mine.se, true);
    // dots: one that would overlap a dot already placed stacks above it
    var rad = v.drag ? 8 : 6.5, placed = [], order = v.values.map(function(x, i){ return i; }).sort(function(a, b){ return v.values[a] - v.values[b]; });
    var lvl = {};
    order.forEach(function(i){
      var X = sx(v.values[i]), n = 0;
      while(placed.some(function(q){ return q.n === n && Math.abs(q.X - X) < 2 * rad - 1; })) n++;
      placed.push({ X: X, n: n }); lvl[i] = n;
    });
    v.values.forEach(function(x, i){
      var cy = AY - rad - 1 - lvl[i] * (2 * rad - 1);
      p.push('<circle class="ds-dot' + (v.hot === i ? ' hot' : '') + '"' + (v.drag ? ' data-k="' + i + '" tabindex="0" role="slider" aria-label="Value ' + (i + 1) + '" aria-valuemin="' + v.lo + '" aria-valuemax="' + v.hi + '" aria-valuenow="' + M.round(x, v.dp) + '" aria-valuetext="Value ' + (i + 1) + ': ' + F(x, v.dp) + (v.unit ? ' ' + esc(v.unit) : '') + '"' : '') + ' cx="' + sx(x).toFixed(1) + '" cy="' + cy.toFixed(1) + '" r="' + rad + '"/>');
    });
    function line(x, cls, lab, y, anchor){ if(!isFinite(x)) return; var X = sx(Math.min(v.hi, Math.max(v.lo, x))); p.push('<line class="ds-' + cls + '" x1="' + X.toFixed(1) + '" x2="' + X.toFixed(1) + '" y1="76" y2="' + AY + '"/><text class="ds-ml ' + cls + '" x="' + X.toFixed(1) + '" y="' + y + '" text-anchor="' + anchor + '" dx="' + (anchor === 'end' ? -4 : anchor === 'start' ? 4 : 0) + '">' + lab + '</text>'); }
    var mm = v.mean != null ? v.mean : v.mine && v.mine.mean, md = v.median != null ? v.median : v.mine && v.mine.median, mine = v.mean == null;
    var meanLeft = isFinite(mm) && isFinite(md) && mm < md;
    line(md, 'median' + (mine ? ' mine' : ''), (mine ? 'your ' : '') + 'median', 86, meanLeft ? 'start' : 'end');
    line(mm, 'mean' + (mine ? ' mine' : ''), (mine ? 'your ' : '') + 'mean', 86, meanLeft ? 'end' : 'start');
    return '<svg class="bio-svg ds-fig" viewBox="0 0 ' + W + ' ' + H + '" role="' + (v.drag ? 'group' : 'img') + '" aria-label="' + esc(v.aria) + '">' + p.join('') + '</svg>';
  }

  /* ------------------------------------------------------- explore */
  function explore(app){
    var sec = S.card(app, { title: 'Drag a dot, watch the mean and the median', lead: 'Plant heights in centimeters. The solid line is the mean, the dashed line the median; the shaded band is ±1 SD and the bracket ±1 SE. Drag one dot far to the right.' });
    sec.insertAdjacentHTML('beforeend', '<div class="sk-fig sk-drag ds-xfig"></div><p class="ds-key"><span><i class="ds-k mean"></i>mean</span><span><i class="ds-k median"></i>median</span><span><i class="ds-k sd"></i>±1 SD (spread of the values)</span><span><i class="ds-k se"></i>±1 SE (uncertainty in the mean)</span></p><div class="sk-out"></div><p class="sk-say" role="status" aria-live="polite"></p><div class="bt-buttons"><button type="button" class="bt-btn ds-add">Add a dot</button><button type="button" class="bt-btn ds-rm">Remove a dot</button><button type="button" class="bt-btn ds-reset">Reset</button></div><div class="sk-goalhost"></div>');
    var fig = sec.querySelector('.ds-xfig'), out = sec.querySelector('.sk-out'), sayEl = sec.querySelector('.sk-say');
    var BASE = [3.6, 4.5, 5.0, 5.4, 5.9, 6.3, 7.2], vals = BASE.slice(), lo = 2, hi = 14, hot = null;
    var done = S.goals(sec.querySelector('.sk-goalhost'), [
      { id: 'outlier', text: 'Drag one dot past 11 cm: see how far the mean moves compared with the median.' },
      { id: 'sd', text: 'Make the SD as small as you can by bunching the dots.' },
      { id: 'n', text: 'Add dots until n = 12: watch SE shrink even though SD stays about the same.' }
    ]);
    function stats(){ return { m: M.mean(vals), md: M.median(vals), s: vals.length > 1 ? M.sd(vals) : 0, se: vals.length > 1 ? M.se(vals) : 0 }; }
    function render(){
      var r = stats();
      S.redraw(fig, draw({ values: vals, lo: lo, hi: hi, unit: 'cm', label: 'Plant height', mean: r.m, median: r.md, sd: r.s, se: r.se, drag: true, dp: 1, hot: hot,
        aria: vals.length + ' plant heights. Mean ' + F(r.m, 2) + ' cm, median ' + F(r.md, 2) + ' cm, SD ' + F(r.s, 2) + ', SE ' + F(r.se, 2) + '.' }));
      out.innerHTML = S.readout([['n', String(vals.length)], ['Mean', F(r.m, 2)], ['Median', F(r.md, 2)], ['SD (s)', F(r.s, 2)], ['SE', F(r.se, 2)]]);
      return r;
    }
    var before = null;
    function set(i, x){
      if(before == null) before = stats();
      vals[i] = Math.max(lo, Math.min(hi, M.round(x, 1))); hot = i;
      var r = render();
      if(Math.max.apply(null, vals) > 11) done('outlier');
      if(r.s <= 0.3 && vals.length > 2) done('sd');
      return r;
    }
    function settle(i){
      var r = stats(), b = before || r; before = null;
      var dm = r.m - b.m, dmd = r.md - b.md;
      sayEl.textContent = 'Value ' + (i + 1) + ' is now ' + F(vals[i], 1) + ' cm. The mean moved ' + F(Math.abs(dm), 2) + ' and the median ' + F(Math.abs(dmd), 2) + '. ' +
        (Math.abs(dm) > 2 * Math.abs(dmd) + 0.05 ? 'The mean uses every value’s size, so one extreme value pulls it; the median only cares which value is in the middle.' : Math.abs(dm) > 0.01 ? 'SD measures how far values sit from the mean: now ' + F(r.s, 2) + ' cm.' : '');
    }
    S.drag(fig, '[data-k]', { move: function(k, pt){ set(+k, lo + (pt.x - L) / (W - L - R) * (hi - lo)); }, end: function(k){ settle(+k); } });
    S.keys(fig, '.ds-dot', function(k, d, big){ set(+k, vals[+k] + d * (big ? 1 : 0.1)); settle(+k); });
    sec.querySelector('.ds-add').addEventListener('click', function(){
      if(vals.length >= 16){ sayEl.textContent = 'That is plenty of dots.'; return; }
      var a = stats(); vals.push(M.round(a.m + (vals.length % 2 ? 1 : -1) * a.s * 0.6, 1)); hot = vals.length - 1; var r = render();
      sayEl.textContent = 'n = ' + vals.length + '. SD is ' + F(r.s, 2) + ' (about the same: the spread did not change much), but SE = SD / √n fell to ' + F(r.se, 2) + ': more data pin down the mean better.';
      if(vals.length >= 12) done('n');
    });
    sec.querySelector('.ds-rm').addEventListener('click', function(){ if(vals.length <= 3){ sayEl.textContent = 'Keep at least three values.'; return; } vals.pop(); hot = null; var r = render(); sayEl.textContent = 'n = ' + vals.length + ': SE = SD / √n rose to ' + F(r.se, 2) + '.'; });
    sec.querySelector('.ds-reset').addEventListener('click', function(){ vals = BASE.slice(); hot = null; render(); sayEl.textContent = 'Back to the original seven plants.'; });
    render();
  }

  /* ---------------------------------------------------- practice stage */
  function stage(host, s){
    var x = s.input, a = s.answers || {}, chk = s.phase === 'checked', v = x.values;
    var mn = Math.min.apply(null, v), mx = Math.max.apply(null, v), span = Math.max(mx - mn, 1e-6);
    var st = T.niceStep(span * 1.6, 5), lo = Math.floor((mn - span * 0.3) / st) * st, hi = Math.ceil((mx + span * 0.3) / st) * st;
    if(x.min != null || mn >= 0) lo = Math.max(0, lo);
    var spec = { values: v, lo: lo, hi: hi, unit: x.unit, label: x.label === 'Seedling' ? 'Height' : 'Value', dp: x.dp == null ? 1 : x.dp };
    if(chk){ spec.mean = M.mean(v); spec.median = M.median(v); spec.sd = M.sd(v); spec.se = M.se(v); }
    else spec.mine = { mean: S.num(a.mean), median: S.num(a.median), sd: S.num(a.sd), se: S.num(a.se) };
    spec.aria = v.length + ' values on a dot plot' + (chk ? ': mean ' + F(spec.mean, 2) + ', median ' + F(spec.median, 2) + ', SD ' + F(spec.sd, 2) + ', SE ' + F(spec.se, 2) : '') + '.';
    var typed = spec.mine && [spec.mine.mean, spec.mine.median, spec.mine.sd].some(isFinite);
    var cap = chk
      ? 'About two thirds of the values lie within ±1 SD of the mean (the band). The SE bracket is narrower: it is SD / √' + v.length + ', how far this sample’s mean is likely to be from the true mean.' + (Math.abs(spec.mean - spec.median) > 0.25 * spec.sd ? ' The mean and median differ here: the ' + (spec.mean > spec.median ? 'high' : 'low') + ' values pull the mean their way.' : '')
      : typed ? 'Your answers are drawn on the dot plot as you type. Does your mean sit at the balance point of the dots? Does about two thirds of the data fall inside your ±1 SD band?'
      : 'Each dot is one value from the table. Type the mean, median and SD and they are drawn here.';
    S.redraw(host, '<div class="sk-fig">' + draw(spec) + '</div><p class="sk-cap">' + cap + '</p>');
  }

  T.mount('descriptive-stats', function(app, data){
    explore(app);
    T.skillTool(app, data, { slug: 'descriptive-stats', kind: 'descriptive', stage: stage });
  });
})();
