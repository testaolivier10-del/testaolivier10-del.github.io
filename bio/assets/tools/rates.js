/* Skills tool: rates of change and percent change. The solver and the seeded problem generator are
   ApBioProblems.solve.rates and generate.rates (bio-skill-problems.js);
   the contexts, the fixed problems and the formula box are data
   (bio/data/tools/rates.json); the page is ApBioTools.skillTool.

   The picture: the data table plotted. Rate problems: a line graph; tapping
   two points draws the slope triangle with its Δy, Δt and Δy/Δt
   (ApBioMath.rate). Percent-change problems: initial and final bars per
   sample; a typed percent change is drawn as a ghost bar at
   initial × (1 + %/100), so a sign or base error shows at once.
     Explore: a data set made by the course's own generator (a fixed seed of
     the first rate context); tap any two points, compare the slopes.
     Practice: typed rates are drawn as slope lines from the interval's
     first point; after Check the true triangles. */
(function(){
  'use strict';
  var T = window.ApBioTools, S = window.ApBioSkillStage, M = window.ApBioMath, P = window.ApBioProblems;
  if(!T || !S) return;
  var F = T.F, esc = T.esc;
  var W = 420, L = 50, R = 14, TP = 16, B = 46, H = 270, pw = W - L - R, ph = H - TP - B;

  /* Line graph with optional triangles: x = { times, values, unitT, unitY, label, dp },
     o: { tris: [{ i, j, cls, label }], lines: [{ i, slope, cls }], pick (index or null), tap } */
  function lineGraph(x, o){
    var t = x.times, y = x.values, tmax = t[t.length - 1], ymax = T.niceMax(Math.max.apply(null, y) * 1.12);
    var sx = function(v){ return L + v / tmax * pw; }, sy = function(v){ return TP + ph - Math.max(0, Math.min(1, v / ymax)) * ph; };
    var p = [], ys = T.niceStep(ymax, 5), xs = T.niceStep(tmax, 6);
    for(var g = 0; g <= ymax + 1e-9; g += ys) p.push('<line class="grid" x1="' + L + '" x2="' + (W - R) + '" y1="' + sy(g).toFixed(1) + '" y2="' + sy(g).toFixed(1) + '"/><text class="tick" x="' + (L - 6) + '" y="' + (sy(g) + 4).toFixed(1) + '" text-anchor="end">' + M.round(g, 6) + '</text>');
    for(var u = 0; u <= tmax + 1e-9; u += xs) p.push('<text class="tick" x="' + sx(u).toFixed(1) + '" y="' + (TP + ph + 16) + '" text-anchor="middle">' + M.round(u, 6) + '</text>');
    p.push('<line class="axis" x1="' + L + '" x2="' + (W - R) + '" y1="' + (TP + ph) + '" y2="' + (TP + ph) + '"/><line class="axis" x1="' + L + '" x2="' + L + '" y1="' + TP + '" y2="' + (TP + ph) + '"/>');
    p.push('<text class="lbl" x="' + (L + pw / 2) + '" y="' + (H - 8) + '" text-anchor="middle">Time (' + esc(x.unitT) + ')</text><text class="lbl" transform="translate(13 ' + (TP + ph / 2) + ') rotate(-90)" text-anchor="middle">' + esc((x.label || 'Amount') + ' (' + x.unitY + ')') + '</text>');
    p.push('<polyline class="series s1" points="' + t.map(function(v, i){ return sx(v).toFixed(1) + ',' + sy(y[i]).toFixed(1); }).join(' ') + '"/>');
    (o.lines || []).forEach(function(l){
      var t0 = t[l.i], y0 = y[l.i], t1 = tmax, y1 = y0 + l.slope * (t1 - t0);
      if(y1 > ymax){ t1 = t0 + (ymax - y0) / l.slope; y1 = ymax; }
      if(y1 < 0){ t1 = t0 + (0 - y0) / l.slope; y1 = 0; }
      p.push('<line class="rt-mine ' + (l.cls || '') + '" x1="' + sx(t0).toFixed(1) + '" y1="' + sy(y0).toFixed(1) + '" x2="' + sx(t1).toFixed(1) + '" y2="' + sy(y1).toFixed(1) + '"/>');
    });
    (o.tris || []).forEach(function(tr){
      var a = tr.i, b = tr.j, xa = sx(t[a]), xb = sx(t[b]), ya = sy(y[a]), yb = sy(y[b]);
      p.push('<path class="rt-tri ' + (tr.cls || '') + '" d="M' + xa.toFixed(1) + ' ' + ya.toFixed(1) + ' H' + xb.toFixed(1) + ' V' + yb.toFixed(1) + ' Z"/>');
      p.push('<line class="rt-hyp ' + (tr.cls || '') + '" x1="' + xa.toFixed(1) + '" y1="' + ya.toFixed(1) + '" x2="' + xb.toFixed(1) + '" y2="' + yb.toFixed(1) + '"/>');
      p.push('<text class="rt-d" x="' + ((xa + xb) / 2).toFixed(1) + '" y="' + (ya + 14).toFixed(1) + '" text-anchor="middle">Δt ' + M.round(t[b] - t[a], 6) + '</text>');
      p.push('<text class="rt-d" x="' + (xb + 5).toFixed(1) + '" y="' + ((ya + yb) / 2 + 4).toFixed(1) + '">Δy ' + F(y[b] - y[a], x.dp) + '</text>');
      if(tr.label) p.push('<text class="rt-lab ' + (tr.cls || '') + '" x="' + ((xa + xb) / 2 - 6).toFixed(1) + '" y="' + ((ya + yb) / 2 - 10).toFixed(1) + '" text-anchor="end">' + tr.label + '</text>');
    });
    t.forEach(function(v, i){
      var on = o.pick === i || (o.tris || []).some(function(tr){ return tr.i === i || tr.j === i; });
      if(o.tap) p.push('<circle class="sk-col" data-k="' + i + '" cx="' + sx(v).toFixed(1) + '" cy="' + sy(y[i]).toFixed(1) + '" r="20"/>');
      p.push('<circle class="pt s1 rt-pt' + (on ? ' on' : '') + '"' + (o.tap ? ' data-k="' + i + '" tabindex="0" role="button" aria-pressed="' + (o.pick === i) + '" aria-label="' + esc('Point at ' + v + ' ' + x.unitT + ', ' + F(y[i], x.dp) + ' ' + x.unitY) + '"' : '') + ' cx="' + sx(v).toFixed(1) + '" cy="' + sy(y[i]).toFixed(1) + '" r="' + (o.tap ? 7 : 5) + '"/>');
    });
    return '<svg class="bio-svg rt-fig" viewBox="0 0 ' + W + ' ' + H + '" role="' + (o.tap ? 'group' : 'img') + '" aria-label="' + esc(o.aria) + '">' + p.join('') + '</svg>';
  }

  /* ------------------------------------------------------- explore */
  function explore(app, data){
    var ctx = (data.contexts || []).filter(function(c){ return c.mode === 'rate'; })[0];
    if(!ctx) return;
    var x = P.generate.rates(M.rng(2024), ctx);
    var sec = S.card(app, { title: 'Tap two points: the slope is the rate', lead: esc(ctx.label || 'Amount') + ' over time, from a catalase run. Tap any two points to draw the triangle between them: the rate is its height over its width, Δy / Δt.' });
    sec.insertAdjacentHTML('beforeend', '<div class="sk-fig rt-xfig"></div><p class="sk-say" role="status" aria-live="polite"></p><div class="rt-log"></div><div class="bt-buttons"><button type="button" class="bt-btn rt-clear">Clear the triangles</button></div><div class="sk-goalhost"></div>');
    var fig = sec.querySelector('.rt-xfig'), sayEl = sec.querySelector('.sk-say'), log = sec.querySelector('.rt-log');
    var pick = null, tris = [], CL = ['a', 'b', 'c'];
    var done = S.goals(sec.querySelector('.sk-goalhost'), [
      { id: 'early', text: 'Find the rate over the <b>first minute</b>.' },
      { id: 'late', text: 'Find a rate near the <b>end</b>: is the reaction speeding up or slowing down?' },
      { id: 'whole', text: 'Take the rate over the <b>whole run</b>: an average hides how the rate changed.' }
    ]);
    function render(){
      S.redraw(fig, lineGraph(x, { tap: true, pick: pick, tris: tris.map(function(tr, k){ return { i: tr[0], j: tr[1], cls: CL[k % 3], label: F(M.rate(x.values[tr[0]], x.values[tr[1]], x.times[tr[0]], x.times[tr[1]]), 2) }; }),
        aria: 'Line graph of ' + (ctx.label || 'amount') + ' against time. Points are buttons: choose two to draw a slope triangle.' }));
      log.innerHTML = tris.length ? '<ul class="rt-list">' + tris.map(function(tr, k){ var a = tr[0], b = tr[1], r = M.rate(x.values[a], x.values[b], x.times[a], x.times[b]); return '<li class="' + CL[k % 3] + '"><span class="rt-sw" aria-hidden="true"></span>' + x.times[a] + ' to ' + x.times[b] + ' ' + esc(x.unitT) + ': (' + F(x.values[b], x.dp) + ' − ' + F(x.values[a], x.dp) + ') / (' + x.times[b] + ' − ' + x.times[a] + ') = <b>' + F(r, 2) + ' ' + esc(x.unitY + '/' + x.unitT) + '</b></li>'; }).join('') + '</ul>' : '';
    }
    function tap(i){
      if(pick == null){ pick = i; render(); sayEl.textContent = 'First point: ' + x.times[i] + ' ' + x.unitT + ', ' + F(x.values[i], x.dp) + ' ' + x.unitY + '. Now tap a second point.'; return; }
      if(pick === i){ pick = null; render(); sayEl.textContent = 'Unselected. Tap two different points.'; return; }
      var a = Math.min(pick, i), b = Math.max(pick, i); pick = null;
      tris.push([a, b]); if(tris.length > 3) tris.shift();
      render();
      var r = M.rate(x.values[a], x.values[b], x.times[a], x.times[b]), rs = tris.map(function(tr){ return M.rate(x.values[tr[0]], x.values[tr[1]], x.times[tr[0]], x.times[tr[1]]); });
      var msg = 'Rate from ' + x.times[a] + ' to ' + x.times[b] + ' ' + x.unitT + ' = Δy / Δt = ' + F(x.values[b] - x.values[a], x.dp) + ' / ' + (x.times[b] - x.times[a]) + ' = ' + F(r, 2) + ' ' + x.unitY + '/' + x.unitT + '.';
      if(rs.length > 1){ var prev = rs[rs.length - 2]; msg += ' The ' + (r < prev ? 'flatter' : 'steeper') + ' triangle has the ' + (r < prev ? 'smaller' : 'larger') + ' rate.'; }
      sayEl.textContent = msg;
      if(a === 0 && b === 1) done('early');
      if(b === x.times.length - 1 && a >= x.times.length - 3){ done('late'); sayEl.textContent += ' Later slopes are flatter: the reaction slows as substrate is used up.'; }
      if(a === 0 && b === x.times.length - 1){ done('whole'); sayEl.textContent += ' This is the average rate over the run: faster at first, slower later.'; }
    }
    fig.addEventListener('click', function(e){ var t = e.target.closest('[data-k]'); if(t) tap(+t.getAttribute('data-k')); });
    fig.addEventListener('keydown', function(e){ if(e.key !== 'Enter' && e.key !== ' ') return; var t = e.target.closest('[data-k]'); if(!t) return; e.preventDefault(); tap(+t.getAttribute('data-k')); });
    sec.querySelector('.rt-clear').addEventListener('click', function(){ tris = []; pick = null; render(); sayEl.textContent = 'Cleared. Tap two points.'; });
    render();
  }

  /* --------------------------------------------- percent-change bars */
  function pctGraph(x, typed, chk){
    var n = x.items.length, top = 0;
    x.items.forEach(function(it, k){ top = Math.max(top, it.initial, it.final); var g = typed[k]; if(isFinite(g)) top = Math.max(top, it.initial * (1 + g / 100)); });
    var ymax = T.niceMax(top * 1.15), sy = function(v){ return TP + ph - Math.max(0, Math.min(1, v / ymax)) * ph; };
    var p = [], ys = T.niceStep(ymax, 5), gw = pw / n, bw = Math.min(46, gw * 0.28);
    for(var g = 0; g <= ymax + 1e-9; g += ys) p.push('<line class="grid" x1="' + L + '" x2="' + (W - R) + '" y1="' + sy(g).toFixed(1) + '" y2="' + sy(g).toFixed(1) + '"/><text class="tick" x="' + (L - 6) + '" y="' + (sy(g) + 4).toFixed(1) + '" text-anchor="end">' + M.round(g, 6) + '</text>');
    p.push('<line class="axis" x1="' + L + '" x2="' + (W - R) + '" y1="' + (TP + ph) + '" y2="' + (TP + ph) + '"/><line class="axis" x1="' + L + '" x2="' + L + '" y1="' + TP + '" y2="' + (TP + ph) + '"/>');
    p.push('<text class="lbl" transform="translate(13 ' + (TP + ph / 2) + ') rotate(-90)" text-anchor="middle">' + esc((x.unit === 'g' || x.unit === 'kg' || x.unit === 'mg' ? 'Mass' : 'Value') + ' (' + x.unit + ')') + '</text>');
    x.items.forEach(function(it, k){
      var c = L + gw * (k + 0.5), xi = c - bw - 3, xf = c + 3;
      p.push('<rect class="bar rt-init" x="' + xi.toFixed(1) + '" y="' + sy(it.initial).toFixed(1) + '" width="' + bw.toFixed(1) + '" height="' + (TP + ph - sy(it.initial)).toFixed(1) + '"/>');
      p.push('<rect class="bar rt-fin" x="' + xf.toFixed(1) + '" y="' + sy(it.final).toFixed(1) + '" width="' + bw.toFixed(1) + '" height="' + (TP + ph - sy(it.final)).toFixed(1) + '"/>');
      p.push('<line class="rt-base" x1="' + (xi - 4).toFixed(1) + '" x2="' + (xf + bw + 4).toFixed(1) + '" y1="' + sy(it.initial).toFixed(1) + '" y2="' + sy(it.initial).toFixed(1) + '"/>');
      var gt = typed[k];
      if(isFinite(gt) && !chk) p.push('<rect class="rt-ghost" x="' + (xf - 3).toFixed(1) + '" y="' + sy(it.initial * (1 + gt / 100)).toFixed(1) + '" width="' + (bw + 6).toFixed(1) + '" height="' + (TP + ph - sy(it.initial * (1 + gt / 100))).toFixed(1) + '"/>');
      p.push('<text class="tick" x="' + c.toFixed(1) + '" y="' + (TP + ph + 16) + '" text-anchor="middle">' + esc(it.name) + '</text>');
      p.push('<text class="rt-d" x="' + (xi + bw / 2).toFixed(1) + '" y="' + (TP + ph + 30) + '" text-anchor="middle">start</text><text class="rt-d" x="' + (xf + bw / 2).toFixed(1) + '" y="' + (TP + ph + 30) + '" text-anchor="middle">end</text>');
      if(chk){ var pc = M.percentChange(it.initial, it.final); p.push('<text class="rt-lab" x="' + (xf + bw / 2).toFixed(1) + '" y="' + (Math.min(sy(it.final), sy(it.initial)) - 6).toFixed(1) + '" text-anchor="middle">' + (pc > 0 ? '+' : '') + F(pc, 1) + '%</text>'); }
    });
    return '<svg class="bio-svg rt-fig" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc('Start and end values for ' + x.items.map(function(it){ return it.name; }).join(' and ') + '.') + '">' + p.join('') + '</svg>';
  }

  /* ---------------------------------------------------- practice stage */
  function stage(host, s){
    var x = s.input, a = s.answers || {}, chk = s.phase === 'checked', cap, svg;
    if(x.mode === 'pct'){
      var typed = x.items.map(function(it, k){ return S.num(a['pct-' + k]); });
      svg = pctGraph(x, typed, chk);
      cap = chk ? 'Each percent change compares the end bar with its own start (the line across): ' + x.items.map(function(it){ var pc = M.percentChange(it.initial, it.final); return esc(it.name) + ' ' + (pc < 0 ? 'lost' : 'gained') + ' ' + F(Math.abs(pc), 1) + '%'; }).join(', ') + '.'
        : typed.some(isFinite) ? 'The dashed outline is where the end bar would be if your percent change were right: start × (1 + your % / 100). It should match the end bar exactly.'
        : 'Start and end values, from the table. Type a percent change and a dashed outline shows the end value it predicts.';
    } else {
      var lines = [], tris = [];
      if(chk){
        tris = [{ i: x.early[0], j: x.early[1], cls: 'a', label: F(M.rate(x.values[x.early[0]], x.values[x.early[1]], x.times[x.early[0]], x.times[x.early[1]]), 2) },
                { i: x.late[0], j: x.late[1], cls: 'b', label: F(M.rate(x.values[x.late[0]], x.values[x.late[1]], x.times[x.late[0]], x.times[x.late[1]]), 2) }];
      } else {
        var e = S.num(a['rate-early']), l = S.num(a['rate-late']);
        if(isFinite(e)) lines.push({ i: x.early[0], slope: e, cls: 'a' });
        if(isFinite(l)) lines.push({ i: x.late[0], slope: l, cls: 'b' });
      }
      svg = lineGraph(x, { tris: tris, lines: lines, aria: 'Line graph of ' + (x.label || 'amount') + ' against time.' + (chk ? ' Slope triangles for both intervals.' : '') });
      cap = chk ? 'Each triangle’s height over its width is a rate. The ' + (tris[1].label < tris[0].label ? 'later triangle is flatter, so the rate is falling' : 'later triangle is steeper, so the rate is rising') + '.' + (x.why ? ' ' + esc(x.why) : '')
        : lines.length ? 'Your rates are drawn as dashed slopes from the start of each interval. A right answer runs along the curve to the end of the interval.'
        : 'The table, plotted. Type a rate and it is drawn as a slope from the start of that interval.';
    }
    S.redraw(host, '<div class="sk-fig">' + svg + '</div><p class="sk-cap">' + cap + '</p>');
  }

  T.mount('rates', function(app, data){
    explore(app, data);
    T.skillTool(app, data, { slug: 'rates', kind: 'rates', stage: stage });
  });
})();
