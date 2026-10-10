/* Skills tool: 95% confidence intervals and error bars. The solver and the seeded problem generator are
   ApBioProblems.solve.ci and generate.ci (bio-skill-problems.js);
   the contexts, the fixed problems and the formula box are data
   (bio/data/tools/confidence-intervals.json); the page is ApBioTools.skillTool.

   The picture: two means as bars with their ±2 SE error bars (the 95% CI,
   ApBioMath.seFrom and ci95), the gap or overlap between the intervals
   marked and named (ApBioMath.overlap).
     Explore: sliders for each group's mean, SD and n (and one "n for both");
     the bars resize live and the verdict flips between overlap and gap.
     Practice: the problem's bars; the student's typed interval ends are
     drawn as brackets beside the true bars as they type; after Check, the
     true intervals with the gap or overlap marked. */
(function(){
  'use strict';
  var T = window.ApBioTools, S = window.ApBioSkillStage, M = window.ApBioMath;
  if(!T || !S) return;
  var F = T.F, esc = T.esc;
  var W = 420, L = 52, R = 16, TP = 14, B = 40, H = 280, pw = W - L - R, ph = H - TP - B;

  /* g: [{ name, mean, sd, n }], o: { unit, yLabel, ymax, mine: [{lo, hi}], marks } */
  function draw(g, o){
    var iv = g.map(function(x){ return M.ci95(x.mean, M.seFrom(x.sd, x.n)); });
    var top = 0; iv.forEach(function(c){ top = Math.max(top, c.hi); });
    var ymax = o.ymax || T.niceMax(top * 1.1), sy = function(v){ return TP + ph - Math.max(0, Math.min(1, v / ymax)) * ph; };
    var p = [], ys = T.niceStep(ymax, 5), n = g.length, cx = function(i){ return L + pw * (i + 0.5) / n; }, bw = Math.min(70, pw / n * 0.42);
    for(var t = 0; t <= ymax + 1e-9; t += ys) p.push('<line class="grid" x1="' + L + '" x2="' + (W - R) + '" y1="' + sy(t).toFixed(1) + '" y2="' + sy(t).toFixed(1) + '"/><text class="tick" x="' + (L - 6) + '" y="' + (sy(t) + 4).toFixed(1) + '" text-anchor="end">' + M.round(t, 6) + '</text>');
    p.push('<line class="axis" x1="' + L + '" x2="' + (W - R) + '" y1="' + (TP + ph) + '" y2="' + (TP + ph) + '"/><line class="axis" x1="' + L + '" x2="' + L + '" y1="' + TP + '" y2="' + (TP + ph) + '"/>');
    p.push('<text class="lbl" transform="translate(14 ' + (TP + ph / 2) + ') rotate(-90)" text-anchor="middle">' + esc((o.yLabel || 'Mean') + (o.unit ? ' (' + o.unit + ')' : '')) + '</text>');
    var ov = M.overlap(iv[0], iv[1]);
    if(o.marks){
      // the band where the two intervals overlap, or the gap between them, across the plot
      var lo = Math.max(iv[0].lo, iv[1].lo), hi = Math.min(iv[0].hi, iv[1].hi);
      var a = sy(Math.max(lo, hi)), b = sy(Math.min(lo, hi));
      p.push('<rect class="ci-band ' + (ov ? 'ov' : 'gap') + '" x="' + L + '" y="' + a.toFixed(1) + '" width="' + pw + '" height="' + Math.max(1.5, b - a).toFixed(1) + '"/>');
      p.push('<text class="ci-bl ' + (ov ? 'ov' : 'gap') + '" x="' + (W - R - 4) + '" y="' + (a - 5).toFixed(1) + '" text-anchor="end">' + (ov ? 'overlap' : 'gap') + '</text>');
    }
    g.forEach(function(x, i){
      var c = cx(i), y = sy(x.mean), e = iv[i];
      p.push('<path class="bar ' + (i ? 's2' : 's1') + ' ci-bar" d="' + T.barPath(c - bw / 2, y, bw, TP + ph - y) + '"/>');
      p.push('<path class="err ci-err" d="M' + c.toFixed(1) + ' ' + sy(e.hi).toFixed(1) + 'V' + sy(e.lo).toFixed(1) + 'M' + (c - 9).toFixed(1) + ' ' + sy(e.hi).toFixed(1) + 'h18M' + (c - 9).toFixed(1) + ' ' + sy(e.lo).toFixed(1) + 'h18"/>');
      p.push('<text class="tick" x="' + c.toFixed(1) + '" y="' + (TP + ph + 17) + '" text-anchor="middle">' + esc(x.name) + '</text>');
      if(o.marks) p.push('<text class="ci-v" x="' + (c + 13).toFixed(1) + '" y="' + (sy(e.hi) + 4).toFixed(1) + '">' + F(e.hi, o.d) + '</text><text class="ci-v" x="' + (c + 13).toFixed(1) + '" y="' + (sy(e.lo) + 4).toFixed(1) + '">' + F(e.lo, o.d) + '</text>');
      var m = (o.mine || [])[i];
      if(m && (isFinite(m.lo) || isFinite(m.hi))){
        var mx = c - bw / 2 - 12, yl = isFinite(m.lo) ? sy(m.lo) : null, yh = isFinite(m.hi) ? sy(m.hi) : null;
        [m.lo, m.hi].forEach(function(v){ if(isFinite(v) && (v > ymax || v < 0)){ var yy = v > ymax ? TP : TP + ph, dir = v > ymax ? -1 : 1; p.push('<path class="ci-off" d="M' + (mx - 3) + ' ' + (yy - dir * 2) + 'l6 ' + (dir * 9) + 'l6 ' + (-dir * 9) + 'z"/>'); } });
        if(yl != null && yh != null) p.push('<path class="ci-mine" d="M' + (mx + 6) + ' ' + yh.toFixed(1) + 'h-6V' + yl.toFixed(1) + 'h6"/>');
        else p.push('<line class="ci-mine" x1="' + (mx - 2) + '" x2="' + (mx + 8) + '" y1="' + (yl != null ? yl : yh).toFixed(1) + '" y2="' + (yl != null ? yl : yh).toFixed(1) + '"/>');
      }
    });
    return { svg: '<svg class="bio-svg ci-fig" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(o.aria || '') + '">' + p.join('') + '</svg>', iv: iv, ov: ov };
  }

  /* ------------------------------------------------------- explore */
  function explore(app, data){
    var ctx = data.contexts[0];
    var g = [{ name: ctx.groups[0], mean: 8.0, sd: 1.6, n: 5 }, { name: ctx.groups[1], mean: 9.5, sd: 1.6, n: 5 }];
    var sec = S.card(app, { title: 'Change n and SD, watch the error bars', lead: esc(ctx.yLabel || 'Mean') + ' for two groups. Each error bar is ±2 SE, the 95% confidence interval. More samples shrink it; more spread widens it.' });
    sec.insertAdjacentHTML('beforeend', '<div class="sk-fig ci-xfig"></div><div class="ci-verdict" role="status" aria-live="polite"></div><div class="bt-controls ci-ctl"></div><details class="bt-how ci-more"><summary>Set each group separately</summary><div class="bt-how-body bt-controls ci-ctl2"></div></details><p class="sk-say" aria-live="polite"></p><div class="sk-goalhost"></div>');
    var fig = sec.querySelector('.ci-xfig'), ver = sec.querySelector('.ci-verdict'), sayEl = sec.querySelector('.sk-say');
    var last = null, maxY = 14;
    var done = S.goals(sec.querySelector('.sk-goalhost'), [
      { id: 'gap', text: 'Keep the means where they are and raise n until the intervals <b>stop overlapping</b>.' },
      { id: 'sd', text: 'Then raise the SD until they overlap again.' },
      { id: 'four', text: 'Notice: to halve an error bar you need <b>four times</b> the n (SE = SD / √n).' }
    ]);
    var nBoth = T.slider({ label: 'n, samples per group (both)', min: 2, max: 40, step: 1, value: 5, onInput: function(v){ g[0].n = g[1].n = v; n1.set(v); n2.set(v); upd('n'); } });
    var sdBoth = T.slider({ label: 'SD in each group (both)', min: 0.2, max: 4, step: 0.1, value: 1.6, unit: ctx.unit, onInput: function(v){ g[0].sd = g[1].sd = v; s1.set(v); s2.set(v); upd('sd'); } });
    sec.querySelector('.ci-ctl').appendChild(nBoth.el); sec.querySelector('.ci-ctl').appendChild(sdBoth.el);
    var m1 = T.slider({ label: g[0].name + ': mean', min: 2, max: 12, step: 0.1, value: g[0].mean, unit: ctx.unit, onInput: function(v){ g[0].mean = v; upd('m'); } });
    var m2 = T.slider({ label: g[1].name + ': mean', min: 2, max: 12, step: 0.1, value: g[1].mean, unit: ctx.unit, onInput: function(v){ g[1].mean = v; upd('m'); } });
    var n1 = T.slider({ label: g[0].name + ': n', min: 2, max: 40, step: 1, value: 5, onInput: function(v){ g[0].n = v; upd('n'); } });
    var n2 = T.slider({ label: g[1].name + ': n', min: 2, max: 40, step: 1, value: 5, onInput: function(v){ g[1].n = v; upd('n'); } });
    var s1 = T.slider({ label: g[0].name + ': SD', min: 0.2, max: 4, step: 0.1, value: 1.6, unit: ctx.unit, onInput: function(v){ g[0].sd = v; upd('sd'); } });
    var s2 = T.slider({ label: g[1].name + ': SD', min: 0.2, max: 4, step: 0.1, value: 1.6, unit: ctx.unit, onInput: function(v){ g[1].sd = v; upd('sd'); } });
    [m1, m2, n1, n2, s1, s2].forEach(function(x){ sec.querySelector('.ci-ctl2').appendChild(x.el); });
    var firstN = null;
    function upd(what){
      var r = draw(g, { unit: ctx.unit, yLabel: ctx.yLabel, ymax: maxY, marks: true, d: 2, aria: g.map(function(x){ var c = M.ci95(x.mean, M.seFrom(x.sd, x.n)); return x.name + ': mean ' + F(x.mean, 1) + ', 95% CI ' + F(c.lo, 2) + ' to ' + F(c.hi, 2); }).join('. ') + '.' });
      S.redraw(fig, r.svg);
      ver.innerHTML = '<p class="sk-decide">' + (r.ov ? '<span class="sk-verdict keep">Overlap</span> <span>Chance could explain the difference: these data cannot tell the two means apart.</span>' : '<span class="sk-verdict rej">No overlap</span> <span>The difference is likely statistically significant: chance alone rarely gives a gap like this.</span>') + '</p>' +
        S.readout(g.map(function(x){ return [esc(x.name) + ' SE', F(M.seFrom(x.sd, x.n), 2)]; }).concat(g.map(function(x){ var c = M.ci95(x.mean, M.seFrom(x.sd, x.n)); return [esc(x.name) + ' 95% CI', F(c.lo, 2) + '–' + F(c.hi, 2)]; })));
      var se = M.seFrom(g[0].sd, g[0].n), msg = '';
      if(what === 'n'){ msg = 'n = ' + g[0].n + ': SE = SD / √n = ' + F(g[0].sd, 1) + ' / ' + F(Math.sqrt(g[0].n), 2) + ' = ' + F(se, 2) + '.'; if(firstN == null) firstN = { n: g[0].n, se: se }; else if(g[0].n >= 4 * firstN.n){ msg += ' n is ' + F(g[0].n / firstN.n, 1) + ' times bigger and SE is ' + F(firstN.se / se, 1) + ' times smaller.'; done('four'); } }
      if(what === 'sd') msg = 'SD = ' + F(g[0].sd, 1) + ': more spread in the data gives a wider interval (SE = ' + F(se, 2) + ').';
      if(last != null && last !== r.ov){ msg = (r.ov ? 'The intervals overlap again. ' : 'Now there is a gap. ') + msg; if(!r.ov && what === 'n') done('gap'); if(r.ov && what === 'sd') done('sd'); }
      if(what) sayEl.textContent = msg;
      last = r.ov;
    }
    upd('');
  }

  /* ---------------------------------------------------- practice stage */
  function stage(host, s){
    var x = s.input, a = s.answers || {}, chk = s.phase === 'checked', d = x.d == null ? 2 : x.d;
    var mine = x.groups.map(function(gr, k){ return { lo: S.num(a['lo-' + k]), hi: S.num(a['hi-' + k]) }; });
    var r = draw(x.groups, { unit: x.unit, yLabel: x.yLabel, marks: chk, d: d, mine: chk ? [] : mine, aria: 'Bar graph of ' + (x.yLabel || 'the means') + ' for ' + x.groups.map(function(gr){ return gr.name; }).join(' and ') + ', each with error bars of plus or minus 2 SE.' + (chk ? ' The intervals ' + (M.overlap(M.ci95(x.groups[0].mean, M.seFrom(x.groups[0].sd, x.groups[0].n)), M.ci95(x.groups[1].mean, M.seFrom(x.groups[1].sd, x.groups[1].n))) ? 'overlap.' : 'do not overlap.') : '') });
    var typed = mine.some(function(m){ return isFinite(m.lo) || isFinite(m.hi); });
    var cap = chk ? (r.ov ? 'The shaded band is where the two intervals overlap: the true means could be equal, so the data do not show a significant difference.' : 'The shaded band is the gap between the intervals: if the true means were equal, a gap like this would rarely happen by chance.')
      : typed ? 'Your interval ends are the gray brackets left of each bar. They should line up with the ends of that bar’s error bar.' + (mine.some(function(m){ return [m.lo, m.hi].some(function(v){ return isFinite(v) && (v < 0 || v > 1.4 * Math.max.apply(null, x.groups.map(function(gr){ return gr.mean; }))); }); }) ? ' A triangle means a value is off the scale: check it against the mean.' : '')
      : 'Each error bar is ±2 SE around its mean. Type the interval ends and they are drawn beside the bars.';
    S.redraw(host, '<div class="sk-fig">' + r.svg + '</div><p class="sk-cap">' + cap + '</p>');
  }

  T.mount('confidence-intervals', function(app, data){
    explore(app, data);
    T.skillTool(app, data, { slug: 'confidence-intervals', kind: 'ci', stage: stage });
  });
})();
