/* Data explorer, tools v2 (docs/tools-v2-stat-data-explorer-brief.md; the standard: docs/tools-v2-standard.md), on
   the shared kit (assets/course/tool-kit2.js) through the course adapter ApStatTools.studioKit2. OWNED BY THIS TOOL
   ONLY. The model is ApStatMath.dataExplorer (statistics/assets/tools/math/data-explorer.js; ApStatDist underneath).
   Styles: data-explorer.css.

   EXPLORE (free play, nothing graded, no side panel), two tabs on one picture of the same people:
     1. Mean and median. Each value is a person standing on a long plank marked in the data's units (people at the
        same value stand on each other's shoulders, like dots on a dotplot; neighbors overlap side by side). The plank rests on a wedge: it balances
        only when the wedge is under the mean, so when one person is dragged the plank tips and the wedge slides after
        the mean until it settles. A green flag stands at the median. Quiet: the mean ± 1 SD band.
     2. Outliers and the boxplot. The same people on a level board; under it the boxplot is drawn as a crate from Q1
        to Q3 (its green slat the median), ropes to stakes at the whisker ends, and two fence posts at
        Q1 − 1.5 × IQR and Q3 + 1.5 × IQR; a person past a post gets an orange ring and an outlier dot on the boxplot.
        Below, the histogram of the same people, its bin width a quiet knob.
     Main control: drag any person sideways (the kit's knob rides above whoever was touched last; arrows on the knob,
     and the people group picks who with the arrows). Tap a person: their z-score (tab 1) or where they sit against
     the fences (tab 2) in the cause line. Under the cause line: "− 20 students +" (add or remove a person, 5 to 40),
     the ± 1 SD switch (tab 1) and Start over. The data set picker sits beside "Show me how".
     Every number is read from the people AS DRAWN in that frame: a person counts once they have walked in and stops
     counting as they leave; each counted person's value is their drawn place on the plank (to the data's step); the
     mean mark, the wedge, the flag, the crate, the whiskers, the posts, the rings, the bars, the labels and the cause
     line all come from those values, and every moving mark carries the number it is drawn at.
   TEST YOURSELF (unchanged): the drill over the model's generate(), five kinds, records data-explorer:<context>:<step>;
   ?seed= and #quiz open it. Its figure is the old three-view picture (inner(), below), kept as it was. */
(function(){
  'use strict';
  var T = window.ApStatTools, M = window.ApStatMath, P = window.ApStatPlot;
  if(!T || !M || !M.dataExplorer || !P) return;
  var X = M.dataExplorer, esc = T.esc, SLUG = 'data-explorer';
  var NS = 'http://www.w3.org/2000/svg';
  var app0 = document.getElementById('app');
  if(app0 && !app0.getAttribute('data-details-title')) app0.setAttribute('data-details-title', 'Data & numbers');

  function fx(v, d){ return T.F(v, d == null ? 2 : d); }
  function nf(v){ return M.fmt(M.round(v, 4), 6); }
  function phone(){ return (window.innerWidth || 1280) <= 640; }

  /* ------------------------------------------------------- the picture */
  /* inner(o, W, H) -> { html, sx, ix, dots: [{ i, cx, cy, r }], base }: the
     three views on one x scale, every shape from the values in o.values.
     o: { values, lo, hi, unit, label, step, bin, show: { hist, box, whisk,
     mean, median, sd, fences, zscale }, sel, drag, after, mark, given, title } */
  function inner(o, W, H){
    var vals = o.values, S = X.stats(vals), out = [], small = W < 520;
    var padL = 36, padR = small ? 22 : 30, top = 4, axisH = small ? 40 : 42;
    var lo = o.lo, hi = o.hi, pw = W - padL - padR;
    function sx(v){ return padL + (v - lo) / (hi - lo) * pw; }
    function ix(px){ return lo + (px - padL) / pw * (hi - lo); }
    var showHist = !!(o.show && o.show.hist), showBox = o.boxPanel !== false;
    var avail = H - top - axisH, gap = 10;
    // Dots: one column per value, or per a few values on a narrow screen so
    // the dots stay big enough to touch (the column sits at the rounded value).
    var ppu = pw / (hi - lo), st0 = o.step || 1, rMin = small ? 4.6 : 5.2, colStep = st0;
    [1, 2, 5, 10, 20].some(function(m){ colStep = st0 * m; return ppu * colStep >= 2 * rMin; });
    var r = Math.min(small ? 8 : 9.5, ppu * colStep / 2 - 0.4);
    var keyOf = function(v){ return M.round(Math.round(v / colStep) * colStep, 6); };
    var stack = {}, maxStack = 0;
    vals.forEach(function(v){ var k = keyOf(v); stack[k] = (stack[k] || 0) + 1; if(stack[k] > maxStack) maxStack = stack[k]; });
    var want = Math.max(maxStack, o.minStack || 5) * 2 * r + 46;
    var hDot = Math.max(avail * (showHist ? 0.24 : 0.4), Math.min(avail * (showHist ? 0.46 : 0.62), want));
    if(!showHist && !showBox) hDot = avail;
    var dot = { y0: top, y1: top + hDot };
    var restH = avail - hDot - gap;
    var hist = showHist ? { y0: dot.y1 + gap, y1: dot.y1 + gap + restH * 0.6 } : null;
    var box = { y0: (hist ? hist.y1 : dot.y1) + gap, y1: H - axisH };
    if((maxStack * 2 * r) > hDot - 40) r = Math.max(2.6, (hDot - 40) / maxStack / 2);
    var ticks = P.ticks(lo, hi, small ? 5 : 8);
    var fs = small ? 13 : 13.5;
    // grid and the shared axis
    out.push('<g class="dx-grid" aria-hidden="true">' + ticks.map(function(t){ var x = sx(t).toFixed(1); return '<line x1="' + x + '" x2="' + x + '" y1="' + dot.y0 + '" y2="' + box.y1 + '"/>'; }).join('') + '</g>');
    out.push('<g class="dx-axis" aria-hidden="true"><line x1="' + padL + '" x2="' + (W - padR) + '" y1="' + box.y1 + '" y2="' + box.y1 + '"/>' +
      ticks.filter(function(t){ return !small || sx(t) < W - 46; }).map(function(t){ var x = sx(t).toFixed(1); return '<line x1="' + x + '" x2="' + x + '" y1="' + box.y1 + '" y2="' + (box.y1 + 5) + '"/><text x="' + x + '" y="' + (box.y1 + 17) + '" text-anchor="middle" style="font-size:' + fs + 'px">' + esc(M.fmt(t, 6)) + '</text>'; }).join('') +
      '<text class="dx-axt" x="' + (padL + pw / 2) + '" y="' + (H - 6) + '" text-anchor="middle" style="font-size:' + fs + 'px">' + esc(cap(o.label) + ' (' + o.unit + ')') + '</text></g>');
    function title(y, t){ out.push('<text class="dx-ptitle" x="' + padL + '" y="' + (y + 12) + '" style="font-size:' + (fs - 0.5) + 'px" aria-hidden="true">' + esc(t) + '</text>'); }

    // ---- histogram
    var histLabs = '';   // pass 3: bar counts are drawn over the mean and median lines, not under them
    if(hist){
      var start = X.binStart(lo, o.bin), B = X.bins(vals, start, o.bin), mx = Math.max.apply(null, B.counts.concat([1]));
      var hy = function(c){ return hist.y1 - c / mx * (hist.y1 - hist.y0 - 34); };
      var cTicks = P.ticks(0, mx, 3).filter(function(t){ return t === Math.round(t); });
      out.push('<g class="dx-hist">' + cTicks.map(function(t){ var y = hy(t).toFixed(1); return '<line class="dx-hgrid" x1="' + padL + '" x2="' + (W - padR) + '" y1="' + y + '" y2="' + y + '"/><text class="dx-cnt" x="' + (padL - 6) + '" y="' + (+y + 4) + '" text-anchor="end" style="font-size:' + (fs - 1) + 'px">' + t + '</text>'; }).join('') +
        B.counts.map(function(c, j){
          if(!c) return '';
          var x0 = sx(B.edges[j][0]), x1 = sx(B.edges[j][1]), y = hy(c), wpx = x1 - x0;
          if(wpx >= 13) histLabs += '<text class="dx-blab" x="' + ((x0 + x1) / 2).toFixed(1) + '" y="' + (y - 4).toFixed(1) + '" text-anchor="middle" style="font-size:' + (fs - 1) + 'px">' + c + '</text>';
          return '<rect class="dx-bar" x="' + x0.toFixed(1) + '" y="' + y.toFixed(1) + '" width="' + Math.max(0.5, wpx).toFixed(1) + '" height="' + Math.max(0, hist.y1 - y).toFixed(1) + '"/>';
        }).join('') + '<line class="dx-base" x1="' + padL + '" x2="' + (W - padR) + '" y1="' + hist.y1 + '" y2="' + hist.y1 + '"/></g>');
      title(hist.y0, 'Histogram, bins of ' + M.fmt(o.bin, 4) + ' ' + (o.short || o.unit));
    }

    // ---- overlays behind the dots: SD band, mean and median lines
    var sh = o.show || {}, mean = o.given ? o.given.mean : S.mean, sd = o.given ? o.given.sd : S.sd;
    if(sh.sd && sd > 0){
      var a = Math.max(lo, mean - sd), b = Math.min(hi, mean + sd);
      out.push('<rect class="dx-sdband" x="' + sx(a).toFixed(1) + '" y="' + (dot.y0 + 34) + '" width="' + Math.max(0, sx(b) - sx(a)).toFixed(1) + '" height="' + Math.max(0, dot.y1 - dot.y0 - 34).toFixed(1) + '"/>' +
        (mean - sd >= lo ? '<text class="dx-sdl" x="' + (sx(mean - sd) + 4).toFixed(1) + '" y="' + (dot.y0 + 50) + '" style="font-size:' + (fs - 1.5) + 'px">−1 SD</text>' : '') +
        (mean + sd <= hi ? '<text class="dx-sdl" x="' + (sx(mean + sd) - 4).toFixed(1) + '" y="' + (dot.y0 + 50) + '" text-anchor="end" style="font-size:' + (fs - 1.5) + 'px">+1 SD</text>' : ''));
    }
    if(sh.zscale && sd > 0){
      var zs = [-3, -2, -1, 0, 1, 2, 3].filter(function(k){ var v = mean + k * sd; return v >= lo && v <= hi; });
      out.push('<g class="dx-zs">' + zs.map(function(k){ var x = sx(mean + k * sd).toFixed(1); return '<line x1="' + x + '" x2="' + x + '" y1="' + (dot.y0 + 52) + '" y2="' + dot.y1 + '"' + (k ? '' : ' class="is-0"') + '/><text x="' + x + '" y="' + (dot.y0 + 48) + '" text-anchor="middle" style="font-size:' + (fs - 1.5) + 'px">' + (k ? 'z = ' + M.minus(String(k)) : 'z = 0') + '</text>'; }).join('') + '</g>');
    }
    var lineB = showBox ? box.y1 - 4 : dot.y1;
    var labs = [];
    if(sh.mean !== false && sh.mean !== undefined || o.drag){ labs.push({ v: mean, cls: 'mean', t: 'mean ' + fx(mean, 1) }); }
    if(sh.median !== false && sh.median !== undefined || o.drag){ labs.push({ v: S.med, cls: 'median', t: 'median ' + nf(S.med) }); }
    labs.forEach(function(L){ if(L.v < lo || L.v > hi) return; var x = sx(L.v).toFixed(1); out.push('<line class="dx-' + L.cls + '" x1="' + x + '" x2="' + x + '" y1="' + (dot.y0 + 34) + '" y2="' + lineB + '"/>'); });
    // the after-change mean, for the resistance drill
    if(o.after && sh.mean){
      var Sa = X.stats(o.after), xa = sx(Math.min(hi, Sa.mean)).toFixed(1);
      out.push('<line class="dx-mean is-after" x1="' + xa + '" x2="' + xa + '" y1="' + (dot.y0 + 34) + '" y2="' + lineB + '"/>');
      labs.push({ v: Sa.mean, cls: 'mean', t: 'new mean ' + fx(Sa.mean, 1) });
    }

    // ---- the student's answer in Test yourself (a value on this scale)
    if(o.yours && isFinite(o.yours.v)){
      var yv = o.yours.v, yin = yv >= lo && yv <= hi, yxx = sx(Math.max(lo, Math.min(hi, yv)));
      if(yin) out.push('<line class="stat-yours" x1="' + yxx.toFixed(1) + '" x2="' + yxx.toFixed(1) + '" y1="' + (dot.y0 + 36) + '" y2="' + box.y1 + '"/>');
      var yt = 'yours: ' + o.yours.t + (yin ? '' : yv > hi ? ' →' : ' ←'), yw = yt.length * fs * 0.56, yx0 = Math.max(padL, Math.min(W - padR - yw, yxx - yw / 2));
      out.push('<text class="dx-yt" x="' + (yx0 + yw / 2).toFixed(1) + '" y="' + (dot.y0 + 31) + '" text-anchor="middle" style="font-size:' + fs + 'px">' + esc(yt) + '</text>');
    }
    // ---- fences
    if(sh.fences){
      var flab = [];
      S.fences.forEach(function(f, k){
        if(sh.fenceSide && sh.fenceSide !== (k ? 'upper' : 'lower')) return;
        var inside = f >= lo && f <= hi, x = sx(Math.max(lo, Math.min(hi, f)));
        if(inside) out.push('<line class="dx-fence" x1="' + x.toFixed(1) + '" x2="' + x.toFixed(1) + '" y1="' + (dot.y0 + 34) + '" y2="' + box.y1 + '"/>');
        var t = inside ? (k ? 'upper fence ' : 'lower fence ') + fx(f, 1) : (k ? 'upper fence ' + fx(f, 1) + ' →' : '← lower fence ' + fx(f, 1)), w = t.length * (fs - 1.5) * 0.55;
        // beside its line, on the side with room; off the scale, at that edge
        var anchor, x0;
        if(!inside){ anchor = k ? 'end' : 'start'; x0 = k ? W - padR - w : padL; }
        else if(k){ anchor = x + 5 + w <= W - 2 ? 'start' : 'end'; x0 = anchor === 'start' ? x + 5 : x - 5 - w; }
        else { anchor = x - 5 - w >= 2 ? 'end' : 'start'; x0 = anchor === 'end' ? x - 5 - w : x + 5; }
        var yy = box.y0 + 30;
        if(flab.some(function(q){ return x0 < q[1] + 8 && x0 + w > q[0] - 8; })) yy += fs + 2;
        flab.push([x0, x0 + w]);
        out.push('<text class="dx-fl" x="' + (anchor === 'end' ? x0 + w : x0).toFixed(1) + '" y="' + yy + '" text-anchor="' + anchor + '" style="font-size:' + (fs - 1.5) + 'px">' + esc(t) + '</text>');
      });
    }

    // ---- boxplot
    if(showBox){
      var cy = box.y0 + 44 + (box.y1 - box.y0 - 44) * 0.5, bh = Math.max(8, Math.min(small ? 32 : 46, (box.y1 - box.y0 - 44) * 0.75));
      var g = '<g class="dx-box">';
      if(sh.box !== false){
        g += '<rect class="dx-boxr" x="' + sx(S.q1).toFixed(1) + '" y="' + (cy - bh / 2).toFixed(1) + '" width="' + Math.max(1, sx(S.q3) - sx(S.q1)).toFixed(1) + '" height="' + bh.toFixed(1) + '"/>' +
          '<line class="dx-boxm" x1="' + sx(S.med).toFixed(1) + '" x2="' + sx(S.med).toFixed(1) + '" y1="' + (cy - bh / 2).toFixed(1) + '" y2="' + (cy + bh / 2).toFixed(1) + '"/>';
      }
      if(sh.whisk !== false){
        var wk = S.whiskers, side = sh.whiskSide;
        if(!side || side === 'lower') g += '<line class="dx-wh" x1="' + sx(wk[0]).toFixed(1) + '" x2="' + sx(S.q1).toFixed(1) + '" y1="' + cy.toFixed(1) + '" y2="' + cy.toFixed(1) + '"/><line class="dx-wh" x1="' + sx(wk[0]).toFixed(1) + '" x2="' + sx(wk[0]).toFixed(1) + '" y1="' + (cy - bh / 4).toFixed(1) + '" y2="' + (cy + bh / 4).toFixed(1) + '"/>';
        if(!side || side === 'upper') g += '<line class="dx-wh" x1="' + sx(S.q3).toFixed(1) + '" x2="' + sx(wk[1]).toFixed(1) + '" y1="' + cy.toFixed(1) + '" y2="' + cy.toFixed(1) + '"/><line class="dx-wh" x1="' + sx(wk[1]).toFixed(1) + '" x2="' + sx(wk[1]).toFixed(1) + '" y1="' + (cy - bh / 4).toFixed(1) + '" y2="' + (cy + bh / 4).toFixed(1) + '"/>';
        S.outliers.forEach(function(v){ if(side && (side === 'upper') !== (v > S.med)) return; g += '<circle class="dx-bout" cx="' + sx(v).toFixed(1) + '" cy="' + cy.toFixed(1) + '" r="5"/>'; });
      }
      out.push(g + '</g>');
      if(sh.box !== false || sh.whisk !== false) title(box.y0, 'Boxplot');
      else if(o.placeholder) out.push('<text class="dx-ph" x="' + (padL + pw / 2) + '" y="' + cy.toFixed(1) + '" text-anchor="middle" style="font-size:' + (fs - 0.5) + 'px">' + esc(o.placeholder) + '</text>');
    }

    // ---- dots: stacked in their column, lowest value of a column first
    var lvl = {}, seenK = {};
    vals.map(function(v, i){ return i; }).sort(function(p, q){ return vals[p] - vals[q] || p - q; }).forEach(function(i){
      var k = keyOf(o.after && i === o.changedIndex ? o.after[i] : vals[i]); lvl[i] = seenK[k] || 0; seenK[k] = lvl[i] + 1; });
    var L2 = { lv: lvl };
    var dots = [], outSet = S.outliers;
    var ghost = '';
    if(o.after){
      // the changed value: its old place as a ghost, an arrow to the new one
      var oi = o.changedIndex, ov = o.values[oi], nv = o.after[oi], gy = dot.y1 - r - 1;
      ghost = '<g class="dx-move" aria-hidden="true"><path d="M' + (sx(ov) + r + 2).toFixed(1) + ' ' + gy.toFixed(1) + ' H' + (sx(Math.min(hi, nv)) - r - 4).toFixed(1) + '"/><path class="dx-arrow" d="M' + (sx(Math.min(hi, nv)) - r - 10).toFixed(1) + ' ' + (gy - 4).toFixed(1) + ' l6 4 l-6 4"/></g>';
    }
    if(histLabs) out.push('<g class="dx-blabs">' + histLabs + '</g>');
    var dg = '<g class="dx-dots">';
    vals.forEach(function(v, i){
      var cx = sx(keyOf(o.after && i === o.changedIndex ? Math.min(hi, o.after[i]) : v)), cyy = dot.y1 - r - 1 - L2.lv[i] * 2 * r;
      var isOut = v < S.fences[0] || v > S.fences[1];
      var cls = 'dx-dot' + (isOut && (sh.fences || o.drag) ? ' is-out' : '') + (o.sel === i ? ' is-sel' : '') + (o.mark != null && v === o.mark ? ' is-mark' : '') + (o.after && i === o.changedIndex ? ' is-moved' : '');
      dots.push({ i: i, cx: cx, cy: cyy, r: r });
      dg += o.drag
        ? '<circle class="' + cls + '" data-i="' + i + '" cx="' + cx.toFixed(1) + '" cy="' + cyy.toFixed(1) + '" r="' + r.toFixed(1) + '" tabindex="0" role="slider" aria-roledescription="draggable value" aria-label="' + esc(cap(o.label) + ' ' + (i + 1)) + '" aria-valuemin="' + lo + '" aria-valuemax="' + hi + '" aria-valuenow="' + v + '" aria-valuetext="' + esc(nf(v) + ' ' + o.unit + (isOut ? ', an outlier' : '')) + '"/>'
        : '<circle class="' + cls + '" cx="' + cx.toFixed(1) + '" cy="' + cyy.toFixed(1) + '" r="' + r.toFixed(1) + '"/>';
      if(o.after && i === o.changedIndex) ghost = '<circle class="dx-ghost" cx="' + sx(keyOf(v)).toFixed(1) + '" cy="' + (dot.y1 - r - 1 - (seenK[keyOf(v)] || 0) * 2 * r).toFixed(1) + '" r="' + r.toFixed(1) + '"/>' + ghost;
    });
    // pass 3: until the first drag, the dot to drag wears a ring and side arrows, so it reads as draggable
    if(o.grab != null && o.grab > -1 && dots[o.grab]){
      var gd = dots[o.grab], gr = gd.r + 6, gx2 = gd.cx, gy2 = gd.cy;
      dg += '<g class="dx-grab" aria-hidden="true"><circle cx="' + gx2.toFixed(1) + '" cy="' + gy2.toFixed(1) + '" r="' + gr.toFixed(1) + '"/>' +
        '<path d="M' + (gx2 - gr - 4).toFixed(1) + ' ' + (gy2 - 4).toFixed(1) + 'l-5 4l5 4M' + (gx2 + gr + 4).toFixed(1) + ' ' + (gy2 - 4).toFixed(1) + 'l5 4l-5 4"/></g>';
    }
    out.push(ghost + dg + '</g><line class="dx-base" x1="' + padL + '" x2="' + (W - padR) + '" y1="' + dot.y1.toFixed(1) + '" y2="' + dot.y1.toFixed(1) + '"/>');
    title(dot.y0, 'Dotplot' + (o.title ? ', ' + o.title : ''));
    // the selected (or marked) value's label
    var pick = o.sel != null && o.sel > -1 ? o.sel : o.mark != null ? vals.indexOf(o.mark) : -1;
    if(pick > -1){
      var dd = dots[pick], tx = Math.max(padL + 14, Math.min(W - padR - 14, dd.cx));
      out.push('<g class="dx-sel" aria-hidden="true"><line x1="' + dd.cx.toFixed(1) + '" x2="' + dd.cx.toFixed(1) + '" y1="' + (dd.cy + dd.r + 1).toFixed(1) + '" y2="' + dot.y1.toFixed(1) + '"/><text x="' + tx.toFixed(1) + '" y="' + (dd.cy - dd.r - 6).toFixed(1) + '" text-anchor="middle" style="font-size:' + fs + 'px">' + esc(nf(vals[pick])) + '</text></g>');
    }
    // mean / median labels along the top of the dotplot, kept apart
    labs = labs.filter(function(L){ return L.v >= lo && L.v <= hi; }).sort(function(a, b){ return a.v - b.v; });
    var row = [], ly = dot.y0 + 30;
    labs.forEach(function(L, k){
      var x = sx(L.v), w = L.t.length * fs * 0.56, anchor = k === 0 && labs.length > 1 ? 'end' : labs.length > 1 ? 'start' : 'middle';
      var x0 = anchor === 'end' ? x - 4 - w : anchor === 'start' ? x + 4 : x - w / 2;
      if(x0 < padL + 60 && anchor !== 'start' && !hist){ anchor = 'start'; x0 = x + 4; }
      if(x0 < 2){ anchor = 'start'; x0 = x + 4; }
      if(x0 + w > W - 2){ anchor = 'end'; x0 = x - 4 - w; }
      var yy = ly; while(row.some(function(q){ return q.y === yy && x0 < q.x1 + 6 && x0 + w > q.x0 - 6; })) yy += fs + 3;
      row.push({ x0: x0, x1: x0 + w, y: yy });
      out.push('<text class="dx-ml ' + L.cls + '" x="' + (anchor === 'end' ? x - 4 : anchor === 'start' ? x + 4 : x).toFixed(1) + '" y="' + yy + '" text-anchor="' + anchor + '" style="font-size:' + (fs - 0.5) + 'px">' + esc(L.t) + '</text>');
    });
    return { html: out.join(''), sx: sx, ix: ix, dots: dots, dot: dot, S: S };
  }
  function cap(s){ s = String(s || ''); return s.charAt(0).toUpperCase() + s.slice(1); }

  /* ========================================================= EXPLORE (tools v2) */
  function clamp(v, a, b){ return Math.max(a, Math.min(b, v)); }
  function n1(v){ return Math.round(v * 10) / 10; }
  function now(){ return window.performance ? performance.now() : Date.now(); }
  function mk(tag, cls, attrs, parent){ var e = document.createElementNS(NS, tag); if(cls) e.setAttribute('class', cls); if(attrs) for(var k in attrs) e.setAttribute(k, attrs[k]); if(parent) parent.appendChild(e); return e; }
  function at(e, attrs){ for(var k in attrs){ var v = typeof attrs[k] === 'number' ? String(n1(attrs[k])) : attrs[k]; if(e.getAttribute(k) !== v) e.setAttribute(k, v); } }
  function txt(e, s){ if(e.textContent !== s) e.textContent = s; }
  function el(tag, cls, html){ var e = document.createElement(tag); if(cls) e.className = cls; if(html != null) e.innerHTML = html; return e; }
  function easeIO(k){ return k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2; }
  function easeOut(k){ return 1 - Math.pow(1 - k, 3); }
  var mctx = null, mCache = {}, FONT = 'Nunito, "Segoe UI", system-ui, sans-serif';
  function tw(s, px, wt){
    var k = (wt || 800) + '|' + px + '|' + s;
    if(mCache[k] != null) return mCache[k];
    if(!mctx){ var c = document.createElement('canvas'); mctx = c.getContext('2d'); }
    mctx.font = (wt || 800) + ' ' + px + 'px ' + FONT;
    return (mCache[k] = mctx.measureText(s).width);
  }
  function hash(i, k){ var h = Math.imul(i + 1, 2654435761) ^ Math.imul(k + 7, 40503); h ^= h >>> 13; return Math.abs(h) % 997; }
  /* a number as the picture writes it: at most d decimals, no trailing zeros, a real minus sign */
  function num(v, d){ var s = String(+(+v).toFixed(d == null ? 2 : d)); if(s === '-0') s = '0'; return s.charAt(0) === '-' ? '−' + s.slice(1) : s; }
  function one(v){ return fx(v, 1); }
  /* a fence as its sign writes it: an outlier is judged against the number shown */
  function r2(v){ return Math.round(v * 100) / 100; }
  function plural(n, a, b){ return n + ' ' + (n === 1 ? a : b); }

  function explore(host, data){
    var K = window.LevlKit2, E = data.explore || {};
    var SETS = (E.datasets || []).filter(function(d){ return d.values && d.values.length > 2; });
    var S = { tab: 'mean', set: SETS[0], P: [], cur: null, sel: false, sd: false, bin: SETS[0].bin, mode: 'explore', change: null, took: {}, take: null, fresh: true };
    var uid = 0, raf = 0, tLast = 0, adds = 0;
    var MOVE = 240, COME = 520, GO = 420, TAU_D = 70, TAU_F = 260;
    function calm(){ return K.reduced() || !window.requestAnimationFrame; }
    function st(){ return S.set.step || 1; }
    function snap(v){ var s = st(); return clamp(M.round(Math.round(v / s) * s, 6), S.set.x[0], S.set.x[1]); }
    function unit(){ return S.set.short || S.set.unit; }
    function noun(n){ var w = S.set.noun || 'values'; return n === 1 ? w.replace(/s$/, '') : w; }

    /* ---------------------------------------------------- the stage */
    var stage = el('div', 'dx2');
    var tabs = K.tabs({ label: 'What to explore', items: [{ value: 'mean', label: 'Mean and median', short: 'Mean, median' }, { value: 'box', label: 'Outliers and the boxplot', short: 'Boxplot' }], value: 'mean', onChange: function(v){ setTab(v); } });
    stage.appendChild(tabs.el);
    var head = K.head({ purpose: '', how: { label: 'Show me how', onClick: function(){ startTour(); } } });
    var pickWrap = el('label', 'dx2-pick'), pick = el('select', 'dx2-sel');
    pickWrap.innerHTML = '<span class="dx2-pick-k">Data</span>';
    pick.setAttribute('aria-label', 'Data set');
    pick.innerHTML = SETS.map(function(x, i){ return '<option value="' + i + '">' + esc(x.name) + '</option>'; }).join('');
    pickWrap.appendChild(pick);
    head.el.insertBefore(pickWrap, head.how);
    stage.appendChild(head.el);
    var sceneBox = el('div', 'dx2-scene');
    sceneBox.innerHTML = '<svg class="dx2-svg" role="img" xmlns="' + NS + '" data-ls-text="keep"><g class="dx2-back"></g><g class="dx2-wedge"></g>' +
      '<g class="dx2-tilt"><g class="dx2-band"></g><g class="dx2-posts"></g><g class="dx2-flag"></g><g class="dx2-board"></g><g class="dx2-people"></g><g class="dx2-mark"></g></g>' +
      '<g class="dx2-boxp"></g><g class="dx2-hist"></g><g class="dx2-labs"></g></svg>';
    stage.appendChild(sceneBox);
    var svg = sceneBox.querySelector('svg'), gBack = svg.querySelector('.dx2-back'), gWedge = svg.querySelector('.dx2-wedge'), gTilt = svg.querySelector('.dx2-tilt'),
      gBand = svg.querySelector('.dx2-band'), gPosts = svg.querySelector('.dx2-posts'), gFlag = svg.querySelector('.dx2-flag'), gBoard = svg.querySelector('.dx2-board'),
      gPeople = svg.querySelector('.dx2-people'), gMark = svg.querySelector('.dx2-mark'), gBoxp = svg.querySelector('.dx2-boxp'), gHist = svg.querySelector('.dx2-hist'), gLabs = svg.querySelector('.dx2-labs');
    var layer = K.layer(sceneBox);
    // the people can be pressed anywhere in their zone: the nearest drawn person answers; a real focusable group for the keys
    var pickBox = el('div', 'dx2-peoplepick');
    pickBox.tabIndex = 0; pickBox.setAttribute('role', 'group');
    pickBox.setAttribute('aria-label', 'The people, one per value. Left and right arrows pick a person; Tab then moves to the knob that drags them; Escape clears.');
    layer.el.appendChild(pickBox);
    var lines = el('div', 'dx2-lines'), cause = K.cause({ label: 'Why' });
    var acts = el('div', 'dx2-acts');
    acts.innerHTML = '<div class="dx2-step" role="group" aria-label="How many people"><button type="button" class="dx2-sb dx2-rm" aria-label="Remove a person">−</button><span class="dx2-n" aria-live="off"></span><button type="button" class="dx2-sb dx2-add" aria-label="Add a person">+</button></div>' +
      '<button type="button" class="dx2-sdb" aria-pressed="false"><span class="dx2-sw" aria-hidden="true"></span>± 1 SD</button>' +
      '<button type="button" class="tk2-link dx2-reset">Start over</button>';
    var bAdd = acts.querySelector('.dx2-add'), bRm = acts.querySelector('.dx2-rm'), nLab = acts.querySelector('.dx2-n'), bSD = acts.querySelector('.dx2-sdb'), bReset = acts.querySelector('.dx2-reset');
    lines.appendChild(cause.el); lines.appendChild(acts);
    stage.appendChild(lines);
    var live = el('p', 'tk2-sr'); live.setAttribute('aria-live', 'polite'); stage.appendChild(live);
    var lastSaid = '';
    function say(t){ if(!t || t === lastSaid) return; lastSaid = t; live.textContent = ''; setTimeout(function(){ live.textContent = t; }, 40); }
    var ref = el('div', 'dx2-ref');

    /* ---------------------------------------------------- people */
    function person(v, come){
      var p = { id: uid++, v: v, d: v, lv: 0, lt: 0, a: come ? 0 : 1, st: come ? 'come' : 'in', t0: now(), tw: null, el: null, out: false };
      var g = mk('g', 'dx2-p sk' + (hash(p.id, 1) % 4) + ' sh' + (hash(p.id, 2) % 6) + ' hr' + (hash(p.id, 3) % 4), null, gPeople);
      mk('ellipse', 'dx2-ring', { cx: 0, cy: -11.2, rx: 7.6, ry: 13.6 }, g);
      mk('path', 'dx2-legs', { d: 'M-2.4 -0.6 V-7.6 M2.4 -0.6 V-7.6' }, g);
      mk('rect', 'dx2-body', { x: -4.4, y: -15.6, width: 8.8, height: 8.8, rx: 3 }, g);
      mk('circle', 'dx2-head', { cx: 0, cy: -18.9, r: 3.5 }, g);
      mk('path', 'dx2-hair', { d: 'M-3.6 -19.2 A3.6 3.6 0 0 1 3.6 -19.2 Q0 -21 -3.6 -19.2 Z' }, g);
      p.el = g;
      return p;
    }
    function counted(){ return S.P.filter(function(p){ return p.st === 'in'; }); }
    /* a person's value is read from where they are drawn (the picture's x to 0.1 px, as written), to the data's step */
    function dval(p){ return G ? snap(vx(+xv(p.d).toFixed(1))) : snap(p.d); }
    /* the summaries of the people as drawn (each counted person's drawn place, to the data's step) */
    function drawnStats(){
      var c = counted(), xs = c.map(dval);
      if(xs.length < 2) return null;
      var Sx = X.stats(xs); Sx.xs = xs; Sx.ppl = c; return Sx;
    }

    /* ---------------------------------------------------- geometry (picture units = CSS px of the scene) */
    var G = null;
    function layout(){
      var W = sceneBox.clientWidth, H = sceneBox.clientHeight;
      if(!W || !H) return null;
      var g = { W: W, H: H, phone: W < 600, tab: S.tab }, pad = g.phone ? 8 : 14;
      g.pad = pad; g.l = pad + (g.phone ? 18 : 34); g.r = W - pad - (g.phone ? 18 : 34);
      g.fs = g.phone ? 12 : 13.5;
      g.pt = g.phone ? 22 : 28;             // the plank's thickness (its numbers on its face)
      g.pw = g.phone ? 15 : 24;   // a person's width at full size (fitPw() then sizes them to the room)
      if(S.tab === 'mean'){
        g.grass = g.phone ? 40 : 54; g.wedgeH = g.phone ? 34 : 50;
        g.groundY = H - pad - g.grass;
        g.PY = g.groundY - g.wedgeH - g.pt;
        g.clothY = pad + 4; g.clothH = g.phone ? 22 : 26;
        g.sdY = g.clothY + g.clothH + (g.phone ? 17 : 20);
        g.stackTop = g.sdY + 40;           // room for the knob above the highest column
      } else {
        // the boxplot band and the histogram take fixed small sizes; the people get the rest of the height
        var cpt = g.phone ? H < 380 : H < 420;
        g.signY = pad + 2; g.signH = g.phone ? (H < 380 ? 20 : 22) : cpt ? 24 : 26;
        g.stackTop = g.signY + g.signH + (g.phone ? (H < 380 ? 22 : 32) : cpt ? 30 : 40);
        g.boxH = g.phone ? (H < 380 ? 48 : 66) : cpt ? 70 : H < 560 ? 88 : 100;
        var hh = g.phone ? (H < 380 ? 64 : clamp(Math.round(H * 0.2), 64, 100)) : W < 1000 ? clamp(Math.round(H * 0.16), 80, 120) : clamp(Math.round(H * 0.22), 78, 150);
        g.PY = H - pad - 4 - hh - 6 - g.boxH - 6 - g.pt;
        g.boxTop = g.PY + g.pt + 6;
        g.histTop = g.boxTop + g.boxH + 6; g.histBot = H - pad - 4;
      }
      return g;
    }
    var lo = 0, hi = 1;
    function xv(v){ return G.l + (v - lo) / (hi - lo) * (G.r - G.l); }
    function vx(x){ return lo + (x - G.l) / (G.r - G.l) * (hi - lo); }

    /* ---------------------------------------------------- drawn state of the moving marks */
    var Dr = { f: null, med: null, q1: null, q3: null, f0: null, f1: null, w0: null, w1: null, sd: 0, sdA: 0, th: 0 };
    function resetDrawn(){ var s = drawnStats(); if(!s) return; Dr.f = s.mean; Dr.med = s.med; Dr.q1 = s.q1; Dr.q3 = s.q3; Dr.f0 = s.fences[0]; Dr.f1 = s.fences[1]; Dr.w0 = s.whiskers[0]; Dr.w1 = s.whiskers[1]; Dr.th = 0; TG = {}; Lv = {}; }

    /* ---------------------------------------------------- the background, the board, the wedge (rebuilt on a new size or tab) */
    function drawBack(){
      gBack.textContent = ''; gBoard.textContent = ''; gWedge.textContent = '';
      var W = G.W, H = G.H;
      var defs = mk('defs', null, null, gBack), lg = mk('linearGradient', null, { id: 'dx2sky', x1: 0, y1: 0, x2: 0, y2: 1 }, defs);
      mk('stop', 'dx2-sky0', { offset: '0' }, lg); mk('stop', 'dx2-sky1', { offset: '1' }, lg);
      mk('rect', 'dx2-sky', { x: 0, y: 0, width: W, height: H, fill: 'url(#dx2sky)' }, gBack);
      [[0.16, 0.10, 1], [0.58, 0.06, 0.8], [0.86, 0.16, 0.9]].forEach(function(c){ var cx = W * c[0], cy = H * c[1] + 20, r = (G.phone ? 12 : 18) * c[2]; mk('path', 'dx2-cloud', { d: 'M' + (cx - 2.4 * r) + ' ' + cy + ' a ' + r + ' ' + r + ' 0 0 1 ' + (1.6 * r) + ' ' + (-0.6 * r) + ' a ' + (1.2 * r) + ' ' + (1.2 * r) + ' 0 0 1 ' + (2.2 * r) + ' ' + (-0.1 * r) + ' a ' + (0.9 * r) + ' ' + (0.9 * r) + ' 0 0 1 ' + (1.2 * r) + ' ' + (0.7 * r) + ' Z' }, gBack); });
      // far hills, a soft line of trees
      var hy = S.tab === 'mean' ? G.groundY - (G.phone ? 70 : 110) : G.PY - (G.phone ? 46 : 70);
      mk('path', 'dx2-hill', { d: 'M0 ' + (hy + 30) + ' Q ' + W * 0.2 + ' ' + (hy - 10) + ' ' + W * 0.42 + ' ' + (hy + 18) + ' T ' + W * 0.8 + ' ' + (hy + 6) + ' T ' + W + ' ' + (hy + 20) + ' V ' + H + ' H 0 Z' }, gBack);
      if(S.tab === 'mean'){
        mk('rect', 'dx2-grass', { x: 0, y: G.groundY, width: W, height: H - G.groundY }, gBack);
        mk('rect', 'dx2-grass-hi', { x: 0, y: G.groundY, width: W, height: 3 }, gBack);
        // the wedge (a stone block cut to a point), moved by translate only
        var wh = G.wedgeH, ww = wh * 1.15;
        mk('path', 'dx2-wedge-s', { d: 'M' + (-ww / 2 - 4) + ' ' + (wh + 3) + ' H ' + (ww / 2 + 4) }, gWedge);
        mk('path', 'dx2-wedge-b', { d: 'M0 0 L ' + (ww / 2) + ' ' + wh + ' H ' + (-ww / 2) + ' Z' }, gWedge);
        mk('path', 'dx2-wedge-h', { d: 'M0 0 L ' + (-ww / 2) + ' ' + wh + ' H ' + (-ww / 6) + ' Z' }, gWedge);
      } else {
        mk('rect', 'dx2-grass', { x: 0, y: G.PY + G.pt * 0.5, width: W, height: H - G.PY }, gBack);
        // the histogram's board: a pale panel on the grass
        mk('rect', 'dx2-hpanel', { x: G.l - 12, y: G.histTop, width: G.r - G.l + 24, height: G.histBot - G.histTop + 2, rx: 10 }, gBack);
      }
      // the plank (in the tilting group): wood with its numbers on the face
      var x0 = G.l - (G.phone ? 12 : 22), x1 = G.r + (G.phone ? 12 : 22);
      mk('rect', 'dx2-plank', { x: x0, y: G.PY, width: x1 - x0, height: G.pt, rx: 4 }, gBoard);
      mk('rect', 'dx2-plank-hi', { x: x0, y: G.PY, width: x1 - x0, height: 3.5, rx: 2 }, gBoard);
      var ticks = P.ticks(lo, hi, G.phone ? 6 : 10), fsN = G.phone ? 11.5 : 12.5, last = null;
      for(var v = Math.ceil(lo / st()) * st(); v <= hi + 1e-9; v += st()){ var x = xv(v); var big = ticks.some(function(t){ return Math.abs(t - v) < 1e-9; }); if(!big && (G.r - G.l) / ((hi - lo) / st()) < 4) continue; mk('line', 'dx2-tick' + (big ? ' is-big' : ''), { x1: x, x2: x, y1: G.PY + 2, y2: G.PY + (big ? 8 : 5) }, gBoard); }
      ticks.forEach(function(t, k){
        var lab = num(t, 2) + (k === ticks.length - 1 ? ' ' + unit() : '');
        var w = tw(lab, fsN, 800), x = xv(t), anchor = 'middle';
        if(k === ticks.length - 1 && x + w / 2 > x1 - 4){ anchor = 'end'; x = Math.min(x + 6, x1 - 4); }
        var te = mk('text', 'dx2-num', { x: x, y: G.PY + G.pt / 2 + fsN * 0.36 + 2, 'text-anchor': anchor, style: 'font-size:' + fsN + 'px' }, gBoard);
        te.textContent = lab; last = te;
      });
      if(S.tab === 'box'){
        // two short trestles hold the level board
        [x0 + 18, x1 - 18].forEach(function(x){ var y0 = G.PY + G.pt - 1, y1 = G.PY + G.pt + 12; mk('path', 'dx2-leg', { d: 'M' + (x - 4) + ' ' + y0 + ' L ' + (x - 10) + ' ' + y1 + ' M' + (x + 4) + ' ' + y0 + ' L ' + (x + 10) + ' ' + y1 + ' M' + (x - 7.5) + ' ' + (y0 + 7) + ' H ' + (x + 7.5) }, gBoard); });
      }
    }

    /* ---------------------------------------------------- levels: people with the same value stand on each other's shoulders */
    var sc = 1, scy = 1, levelH = 22, pwD = null;
    /* the people's size: the largest that keeps the stacks within about 80% of the room above the plank (worked out
       when nothing is moving, then grown or shrunk smoothly; while a stack grows past the room the figures shrink) */
    /* only people with the same value stand on each other's shoulders, so a stack's height is the count at that value
       (neighbors at other values stand beside them, overlapping in depth) */
    function stackOf(pw, vals){
      var c = {}, mx = 1; vals.forEach(function(v){ var k = snap(v); c[k] = (c[k] || 0) + 1; if(c[k] > mx) mx = c[k]; });
      return mx;
    }
    function fitPw(){
      if(!G) return;
      var vals = S.P.filter(function(p){ return p.st !== 'go' && p.st !== 'gone'; }).map(function(p){ return p.tw ? p.tw.b : p.v; });
      var room = (G.PY - G.stackTop) * 0.95, ppu = (G.r - G.l) / ((hi - lo) / st()), loW = 15, hiW = Math.max(loW, Math.min(G.phone ? 24 : 42, ppu * 3.3)), best = loW;
      for(var pw = hiW; pw >= loW; pw -= 1){ if(stackOf(pw, vals) * 2.26 * pw <= room){ best = pw; break; } }
      G.pw = best;
      if(pwD == null || calm()) pwD = best;
    }
    function levels(){
      var arr = S.P.filter(function(p){ return p.st !== 'gone'; }).slice().sort(function(a, b){ return a.d - b.d || a.id - b.id; });
      var pwNow = pwD == null ? G.pw : pwD, at = {}, maxL = 0;
      arr.slice().sort(function(a, b){ return a.id - b.id; }).forEach(function(p){
        var k = snap(p.d), L = at[k] || 0; at[k] = L + 1; p.lt = L; if(L > maxL) maxL = L;
      });
      // the figures shrink when a column would reach the knob's room
      var room = G.PY - G.stackTop, full = pwNow / 10 * 22.6;
      // a stack taller than the room first makes the figures a little squatter (down to 70% of their height), keeping
      // them at least 15 px wide; only past that do they shrink
      var fit = room / ((maxL + 1) * 22.6), sx = pwNow / 10;
      sc = Math.min(sx, fit / 0.7); scy = Math.min(sc, fit);
      levelH = scy * 22.6;
      return full;
    }
    /* where a person's feet are, in the plank's (untilted) frame */
    function colTop(p){
      var k = snap(p.d), top = p.lv;
      S.P.forEach(function(q){ if(q.st === 'gone') return; if(snap(q.d) === k && q.lv > top) top = q.lv; });
      return G.PY - (top + 1) * levelH;
    }
    /* the tilt: rotate the plank's frame about the wedge's tip */
    function pivot(){ return [xv(Dr.f == null ? (lo + hi) / 2 : Dr.f), G.PY + G.pt]; }
    function rot(pt, inv){
      if(S.tab !== 'mean' || !Dr.th) return pt;
      var pv = pivot(), a = (inv ? -1 : 1) * Dr.th * Math.PI / 180, dx = pt[0] - pv[0], dy = pt[1] - pv[1];
      return [pv[0] + dx * Math.cos(a) - dy * Math.sin(a), pv[1] + dx * Math.sin(a) + dy * Math.cos(a)];
    }

    /* ---------------------------------------------------- the animation */
    function busy(){
      if(S.P.some(function(p){ return p.tw || p.st === 'come' || p.st === 'go' || Math.abs(p.lv - p.lt) > 0.01; })) return true;
      if(pwD != null && G && pwD !== G.pw) return true;
      var s = drawnStats(); if(!s) return false;
      var eps = (hi - lo) * 1e-4;
      if(S.tab === 'mean') return Math.abs(Dr.f - s.mean) > eps || Math.abs(Dr.med - s.med) > eps || Math.abs(Dr.sdA - (S.sd ? 1 : 0)) > 0.01;
      return [['med', s.med], ['q1', s.q1], ['q3', s.q3], ['f0', s.fences[0]], ['f1', s.fences[1]], ['w0', s.whiskers[0]], ['w1', s.whiskers[1]]].some(function(k){ return Math.abs(Dr[k[0]] - k[1]) > eps; });
    }
    function kick(){ if(!raf && !calm()) { tLast = now(); raf = requestAnimationFrame(frame); } }
    function frame(){ raf = 0; var t = now(), dt = Math.min(64, t - tLast); tLast = t; step(t, dt); paint(); if(busy()) kick(); else settled(); }
    /* a mark eases toward its target, never faster than about 1.2 px a millisecond (no jumps on a long slide) */
    function chase(k, target, dt, tau, eps){
      var v = Dr[k], upp = (hi - lo) / (G.r - G.l);
      // a new target: the speed cap is 1.2 px a millisecond, or faster when the slide is long, so it lands within about 450 ms
      if(TG[k] !== target){ VS[k] = Math.max(1.2, v == null ? 1.2 : Math.abs(target - v) / upp / 380); }
      TG[k] = target;
      if(v == null || calm()){ Dr[k] = target; return; }
      var d = (target - v) * (1 - Math.exp(-dt / tau)), cap = (VS[k] || 1.2) * dt * upp;
      v += clamp(d, -cap, cap); if(Math.abs(target - v) < eps) v = target; Dr[k] = v;
    }
    function step(t, dt){
      var c = calm();
      S.P.forEach(function(p){
        if(p.tw){ var k = c ? 1 : clamp((t - p.tw.t0) / p.tw.dur, 0, 1); p.d = p.tw.a + (p.tw.b - p.tw.a) * easeIO(k); if(k >= 1){ p.d = p.tw.b; p.tw = null; } }
        if(p.st === 'come'){ p.a = c ? 1 : clamp((t - p.t0) / COME, 0, 1); if(p.a >= 1){ p.a = 1; p.st = 'in'; } }
        if(p.st === 'go'){ p.a = c ? 0 : 1 - clamp((t - p.t0) / GO, 0, 1); if(p.a <= 0) p.st = 'gone'; }
      });
      var gone = S.P.filter(function(p){ return p.st === 'gone'; });
      if(gone.length){ gone.forEach(function(p){ p.el.remove(); }); S.P = S.P.filter(function(p){ return p.st !== 'gone'; }); if(S.cur && S.cur.st === 'gone') S.cur = farthest(); }
      if(pwD != null && pwD !== G.pw){ pwD = c ? G.pw : pwD + (G.pw - pwD) * (1 - Math.exp(-dt / 120)); if(Math.abs(pwD - G.pw) < 0.05) pwD = G.pw; }
      levels();
      S.P.forEach(function(p){ if(c) p.lv = p.lt; else { p.lv += (p.lt - p.lv) * (1 - Math.exp(-dt / 60)); if(Math.abs(p.lt - p.lv) < 0.01) p.lv = p.lt; } });
      var s = drawnStats(); if(!s) return;
      var eps = (hi - lo) * 1e-4;
      if(S.tab === 'mean'){
        chase('f', s.mean, dt, TAU_F, eps);
        chase('med', s.med, dt, TAU_D, eps);
        Dr.sdA = c ? (S.sd ? 1 : 0) : Dr.sdA + ((S.sd ? 1 : 0) - Dr.sdA) * (1 - Math.exp(-dt / 90)); if(Math.abs(Dr.sdA - (S.sd ? 1 : 0)) < 0.01) Dr.sdA = S.sd ? 1 : 0;
        // the plank tips toward the side the mean has moved to, until the wedge is under it again (the angle is 420 × (mean − tip) ÷ the scale's range, at most 6 degrees: zero only with the tip under the mean)
        Dr.th = clamp(420 * (s.mean - Dr.f) / (hi - lo), -6, 6); if(Math.abs(Dr.th) < 0.01) Dr.th = 0;
      } else {
        Dr.th = 0;
        chase('med', s.med, dt, TAU_D, eps); chase('q1', s.q1, dt, TAU_D, eps); chase('q3', s.q3, dt, TAU_D, eps);
        chase('f0', s.fences[0], dt, TAU_D, eps); chase('f1', s.fences[1], dt, TAU_D, eps); chase('w0', s.whiskers[0], dt, TAU_D, eps); chase('w1', s.whiskers[1], dt, TAU_D, eps);
      }
    }

    /* ---------------------------------------------------- paint one frame from the drawn state */
    var LB = {};   // label elements by key
    function lab(key, cls, parent){ var e = LB[key]; if(!e || e.parentNode !== parent){ e = mk('text', cls, null, parent); LB[key] = e; } return e; }
    function pill(key, parent, cls){ var g = LB[key]; if(!g || g.parentNode !== parent){ g = mk('g', cls, null, parent); mk('rect', null, null, g); mk('text', null, null, g); LB[key] = g; } return g; }
    function setPill(g, x, y, t, fs, anchor, padX){
      var w = tw(t, fs, 800) + 2 * (padX || 7), h = fs + 9, x0 = anchor === 'end' ? x - w : anchor === 'start' ? x : x - w / 2;
      at(g.firstChild, { x: x0, y: y - h / 2, width: w, height: h, rx: h / 2 });
      var te = g.lastChild; at(te, { x: x0 + w / 2, y: y + fs * 0.36, 'text-anchor': 'middle', style: 'font-size:' + fs + 'px' }); txt(te, t);
      g.style.display = ''; return [x0, y - h / 2, w, h];
    }
    function hideEl(e){ if(e && e.style.display !== 'none') e.style.display = 'none'; }
    function showEl(e){ if(e && e.style.display === 'none') e.style.display = ''; }
    /* The moving marks (flag, crate, slat, ropes, posts) are drawn where they are, sliding smoothly. A mark's number is
       shown only while it sits still (then it is exactly the drawn place); while it slides its label fades out (it keeps
       the number it left, faded, class is-moving) and its cause line pill shows "…" until it lands. */
    var Dv = {}, Lv = {}, TG = {}, VS = {}, MKS = ['med', 'q1', 'q3', 'f0', 'f1', 'w0', 'w1'];
    function mv(k){ return TG[k] != null && Dr[k] !== TG[k]; }
    function nm(k){ return mv(k) ? '…' : num(Dv[k], 2); }
    function shownDr(){ MKS.forEach(function(k){ Dv[k] = Dr[k]; if(!mv(k) || Lv[k] == null) Lv[k] = Dr[k]; }); }
    function moving(e, on){ if(e && e.classList.contains('is-moving') !== on) e.classList.toggle('is-moving', on); }
    var lastCause = '';
    function paint(){
      if(!G) return;
      shownDr();
      var s = drawnStats();
      // the people
      var drag = handle && handle.dragging();
      S.P.forEach(function(p){
        var f = [xv(p.d), G.PY - p.lv * levelH], dy = p.st === 'come' ? -(1 - easeOut(p.a)) * 36 : p.st === 'go' ? -(1 - p.a) * 30 : 0;
        p.el.setAttribute('transform', 'translate(' + f[0].toFixed(1) + ' ' + (f[1] + dy).toFixed(1) + ') scale(' + sc.toFixed(3) + (scy !== sc ? ' ' + scy.toFixed(3) : '') + ')');
        var o = p.a < 1 ? p.a.toFixed(2) : ''; if(p.el.style.opacity !== o) p.el.style.opacity = o;
        var isSel = p === S.cur && (S.sel || drag), isOut = S.tab === 'box' && s && p.st === 'in' && (dval(p) < Dv.f0 - 1e-9 || dval(p) > Dv.f1 + 1e-9);
        p.out = isOut;
        var cls = 'dx2-p sk' + (hash(p.id, 1) % 4) + ' sh' + (hash(p.id, 2) % 6) + ' hr' + (hash(p.id, 3) % 4) + (isSel ? ' is-sel' : '') + (isOut ? ' is-out' : '');
        if(p.el.getAttribute('class') !== cls) p.el.setAttribute('class', cls);
      });
      if(!s) return;
      if(S.tab === 'mean') paintMean(s); else paintBox(s);
      if(handle){ handle.place(); }
      if(cue.active()) cue.place();
      words(s);
    }
    function paintMean(s){
      var pv = pivot(), W = G.W;
      gTilt.setAttribute('transform', Dr.th ? 'rotate(' + Dr.th.toFixed(3) + ' ' + pv[0].toFixed(1) + ' ' + pv[1].toFixed(1) + ')' : '');
      gWedge.setAttribute('transform', 'translate(' + pv[0].toFixed(1) + ' ' + pv[1].toFixed(1) + ')');
      // the mean mark under the plank (exactly at the mean of the people as drawn)
      var mx = xv(s.mean), my = G.PY + G.pt;
      var tri = LB.tri || (LB.tri = mk('path', 'dx2-tri', null, gMark));
      at(tri, { d: 'M' + (mx - 7).toFixed(1) + ' ' + (my - 1) + ' L ' + (mx + 7).toFixed(1) + ' ' + (my - 1) + ' L ' + mx.toFixed(1) + ' ' + (my + 7) + ' Z' });
      // its label on the grass, under where the mark is drawn now
      var mp = rot([mx, my]), fsL = G.phone ? 12.5 : 14, tL = 'mean ' + one(s.mean), wL = tw(tL, fsL, 900);
      var lx = clamp(mp[0], 6 + wL / 2 + 7, W - 6 - wL / 2 - 7);
      var mpill = pill('meanP', gLabs, 'dx2-mpill'); setPill(mpill, lx, G.groundY + G.grass / 2 + 1, tL, fsL, 'middle', 7);
      // the median flag (at the median's drawn place, on the plank)
      var fx0 = xv(Dv.med), pole = LB.pole || (LB.pole = mk('line', 'dx2-pole', null, gFlag));
      at(pole, { x1: fx0, x2: fx0, y1: G.clothY + 1, y2: G.PY + 1 });
      var knob = LB.knobf || (LB.knobf = mk('circle', 'dx2-polek', { r: 3 }, gFlag)); at(knob, { cx: fx0, cy: G.clothY });
      var fsC = G.phone ? 12.5 : 14, tC = 'median ' + num(Lv.med, 2), wC = tw(tC, fsC, 900) + 18, right = fx0 + wC + 4 < W - 6;
      var cl = LB.cloth || (LB.cloth = mk('path', 'dx2-cloth', null, gFlag)), cx0 = right ? fx0 + 1 : fx0 - 1 - wC, ch = G.clothH;
      at(cl, { d: right ? 'M' + cx0.toFixed(1) + ' ' + G.clothY + ' H ' + (cx0 + wC).toFixed(1) + ' l -6 ' + (ch / 2) + ' l 6 ' + (ch / 2) + ' H ' + cx0.toFixed(1) + ' Z'
        : 'M' + (cx0 + wC).toFixed(1) + ' ' + G.clothY + ' H ' + cx0.toFixed(1) + ' l 6 ' + (ch / 2) + ' l -6 ' + (ch / 2) + ' H ' + (cx0 + wC).toFixed(1) + ' Z' });
      var ct = lab('clothT', 'dx2-clotht', gFlag); at(ct, { x: (cx0 + wC / 2 + (right ? -3 : 3)).toFixed(1), y: (G.clothY + ch / 2 + fsC * 0.36).toFixed(1), 'text-anchor': 'middle', style: 'font-size:' + fsC + 'px' }); txt(ct, tC); moving(ct, mv('med'));
      // the ± 1 SD band (quiet): from the mean as drawn, its width the SD as drawn
      if(Dr.sdA > 0.001 && s.sd > 0){
        showEl(gBand);
        var a = Math.max(lo, s.mean - s.sd), b = Math.min(hi, s.mean + s.sd), k = Dr.sdA;
        var ax = mx + (xv(a) - mx) * k, bx = mx + (xv(b) - mx) * k;
        var br = LB.band || (LB.band = mk('rect', 'dx2-sdr', null, gBand)); at(br, { x: ax, y: G.sdY - 13, width: Math.max(0, bx - ax), height: G.PY - G.sdY + 13 });
        var fsS = G.phone ? 11.5 : 12.5;
        var t0 = lab('sd0', 'dx2-sdl', gBand), t1 = lab('sd1', 'dx2-sdl', gBand);
        var showL = k > 0.98;
        if(showL){
          var l0 = '−1 SD', l1 = '+1 SD', w0 = tw(l0, fsS, 800), w1 = tw(l1, fsS, 800);
          at(t0, { x: ax + 4, y: G.sdY, 'text-anchor': 'start', style: 'font-size:' + fsS + 'px' }); txt(t0, l0);
          at(t1, { x: bx - 4, y: G.sdY, 'text-anchor': 'end', style: 'font-size:' + fsS + 'px' }); txt(t1, l1);
          var tight = bx - ax < w0 + w1 + 16; t0.style.display = tight ? 'none' : ''; t1.style.display = tight ? 'none' : '';
        } else { hideEl(t0); hideEl(t1); }
      } else hideEl(gBand);
      if(!sdUsed && S.sd) sdUsed = true;
    }
    var sdUsed = false;
    function paintBox(s){
      gTilt.setAttribute('transform', '');
      var W = G.W, fs = G.phone ? 12 : 13.5;
      // fence posts (at the fences as drawn), each with its sign; off the scale: a sign at that edge with an arrow
      var signs = [];
      [0, 1].forEach(function(k){
        var f = k ? Dv.f1 : Dv.f0, inside = f >= lo && f <= hi, x = xv(clamp(f, lo, hi));
        var post = LB['post' + k] || (LB['post' + k] = mk('rect', 'dx2-post', null, gPosts));
        if(inside){ showEl(post); at(post, { x: x - 2.5, y: G.signY + G.signH - 2, width: 5, height: G.PY + 1 - (G.signY + G.signH - 2), rx: 2 }); } else hideEl(post);
        var fl = k ? Lv.f1 : Lv.f0, t = fl >= lo && fl <= hi ? 'fence ' + num(fl, 2) : (k ? 'fence ' + num(fl, 2) + ' →' : '← fence ' + num(fl, 2));
        var w = tw(t, fs, 800) + 14, anchor = 'middle', px = x;
        if(!inside){ anchor = k ? 'end' : 'start'; px = k ? W - G.pad - 2 : G.pad + 2; }
        else if(x - w / 2 < G.pad + 2){ anchor = 'start'; px = G.pad + 2; }
        else if(x + w / 2 > W - G.pad - 2){ anchor = 'end'; px = W - G.pad - 2; }
        signs[k] = { t: t, w: w, x: px, anchor: anchor, post: x, inside: inside };
      });
      // two signs that would touch: each slides to the outer side of its post (the lower to the left, the upper to the right)
      var bx = function(q){ return q.anchor === 'end' ? [q.x - q.w, q.x] : q.anchor === 'start' ? [q.x, q.x + q.w] : [q.x - q.w / 2, q.x + q.w / 2]; };
      if(bx(signs[0])[1] + 6 > bx(signs[1])[0]){
        if(signs[0].inside){ signs[0].anchor = 'end'; signs[0].x = Math.max(G.pad + 2 + signs[0].w, signs[0].post + 10); }
        if(signs[1].inside){ signs[1].anchor = 'start'; signs[1].x = Math.min(W - G.pad - 2 - signs[1].w, signs[1].post - 10); }
        var a0 = bx(signs[0]), a1 = bx(signs[1]);
        if(a0[1] + 6 > a1[0]){ var mid = (a0[0] + a1[1]) / 2, need = signs[0].w + signs[1].w + 6, l0 = clamp(mid - need / 2, G.pad + 2, W - G.pad - 2 - need); signs[0].anchor = 'start'; signs[0].x = l0; signs[1].anchor = 'start'; signs[1].x = l0 + signs[0].w + 6; }
      }
      [0, 1].forEach(function(k){ var q = signs[k], sg = pill('sign' + k, gPosts, 'dx2-sign'); setPill(sg, q.x, G.signY + G.signH / 2, q.t, fs, q.anchor, 7); moving(sg, mv(k ? 'f1' : 'f0')); });
      // the two signs never sit on each other (a narrow box): the upper one moves to the right
      // (they are at opposite ends of the box, so this only happens when both are off one edge, which cannot be)
      // the crate (box) from Q1 to Q3, the median slat, whisker ropes to stakes, outlier dots
      var cy = G.boxTop + G.boxH * 0.5, bh = Math.min(G.phone ? 28 : 36, G.boxH * 0.38);
      var x1 = xv(Dv.q1), x3 = xv(Dv.q3), xm = xv(Dv.med), xw0 = xv(Dv.w0), xw1 = xv(Dv.w1);
      var rope0 = LB.rope0 || (LB.rope0 = mk('line', 'dx2-rope', null, gBoxp)), rope1 = LB.rope1 || (LB.rope1 = mk('line', 'dx2-rope', null, gBoxp));
      at(rope0, { x1: xw0, x2: x1, y1: cy, y2: cy }); at(rope1, { x1: x3, x2: xw1, y1: cy, y2: cy });
      var stk0 = LB.stk0 || (LB.stk0 = mk('path', 'dx2-stake', null, gBoxp)), stk1 = LB.stk1 || (LB.stk1 = mk('path', 'dx2-stake', null, gBoxp));
      at(stk0, { d: 'M' + xw0.toFixed(1) + ' ' + (cy - bh * 0.42).toFixed(1) + ' V ' + (cy + bh * 0.5).toFixed(1) });
      at(stk1, { d: 'M' + xw1.toFixed(1) + ' ' + (cy - bh * 0.42).toFixed(1) + ' V ' + (cy + bh * 0.5).toFixed(1) });
      var crate = LB.crate || (LB.crate = mk('rect', 'dx2-crate', null, gBoxp));
      at(crate, { x: x1, y: cy - bh / 2, width: Math.max(1, x3 - x1), height: bh, rx: 3 });
      var slats = LB.slats || (LB.slats = mk('path', 'dx2-slat', null, gBoxp));
      at(slats, { d: 'M' + x1.toFixed(1) + ' ' + (cy - bh / 6).toFixed(1) + ' H ' + x3.toFixed(1) + ' M' + x1.toFixed(1) + ' ' + (cy + bh / 6).toFixed(1) + ' H ' + x3.toFixed(1) });
      var mline = LB.mline || (LB.mline = mk('line', 'dx2-mslat', null, gBoxp)); at(mline, { x1: xm, x2: xm, y1: cy - bh / 2 - 3, y2: cy + bh / 2 + 3 });
      // outlier dots on the boxplot: one per person past a post
      var outs = S.P.filter(function(p){ return p.out; }).map(function(p){ return dval(p); });
      var od = LB.od || (LB.od = []);
      while(od.length < outs.length) od.push(mk('circle', 'dx2-odot', { r: G.phone ? 4.5 : 5.5 }, gBoxp));
      od.forEach(function(e, i){ if(i < outs.length){ showEl(e); at(e, { cx: xv(outs[i]), cy: cy, r: G.phone ? 4.5 : 5.5 }); } else hideEl(e); });
      // labels: median over the crate, Q1 and Q3 under it, "outlier" beside the outlier dots
      var fsQ = G.phone ? 11.5 : 13, yTop = cy - bh / 2 - 7, yBot = cy + bh / 2 + fsQ + 4;
      var tm = lab('tmed', 'dx2-qlab is-med', gBoxp), tq1 = lab('tq1', 'dx2-qlab', gBoxp), tq3 = lab('tq3', 'dx2-qlab', gBoxp);
      var sm = 'median ' + num(Lv.med, 2), wm = tw(sm, fsQ, 800);
      at(tm, { x: clamp(xm, G.pad + wm / 2 + 2, W - G.pad - wm / 2 - 2), y: yTop, 'text-anchor': 'middle', style: 'font-size:' + fsQ + 'px' }); txt(tm, sm); moving(tm, mv('med'));
      var s1 = 'Q1 ' + num(Lv.q1, 2), s3 = 'Q3 ' + num(Lv.q3, 2), w1 = tw(s1, fsQ, 800), w3 = tw(s3, fsQ, 800);
      var c1 = clamp(x1, G.pad + w1 / 2 + 2, W - G.pad - w1 / 2 - 2), c3 = clamp(x3, G.pad + w3 / 2 + 2, W - G.pad - w3 / 2 - 2);
      if(c3 - c1 < (w1 + w3) / 2 + 8){ var mid = (c1 + c3) / 2, need = (w1 + w3) / 2 + 8; c1 = mid - need / 2; c3 = mid + need / 2; }
      at(tq1, { x: c1, y: yBot, 'text-anchor': 'middle', style: 'font-size:' + fsQ + 'px' }); txt(tq1, s1); moving(tq1, mv('q1'));
      at(tq3, { x: c3, y: yBot, 'text-anchor': 'middle', style: 'font-size:' + fsQ + 'px' }); txt(tq3, s3); moving(tq3, mv('q3'));
      // "outlier" names each group of outlier dots, on the side away from the box
      var groups = []; outs.slice().sort(function(a, b){ return a - b; }).forEach(function(v){ var x = xv(v), g = groups[groups.length - 1]; if(g && x - g.x1 < 46 && (v > Dv.med) === g.hi) { g.x1 = x; g.n++; } else groups.push({ x0: x, x1: x, n: 1, hi: v > Dv.med }); });
      var ol = LB.ol || (LB.ol = []);
      while(ol.length < groups.length) ol.push(mk('text', 'dx2-olab', null, gBoxp));
      var taken = [[clamp(xm, G.pad + wm / 2 + 2, W - G.pad - wm / 2 - 2) - wm / 2, yTop - fsQ, wm, fsQ + 2], [c1 - w1 / 2, yBot - fsQ, w1, fsQ + 2], [c3 - w3 / 2, yBot - fsQ, w3, fsQ + 2], [x1, cy - bh / 2, x3 - x1, bh]];
      outs.forEach(function(v){ var r0 = G.phone ? 4.5 : 5.5; taken.push([xv(v) - r0, cy - r0, 2 * r0, 2 * r0]); });
      var free = function(b){ return b[0] >= G.pad && b[0] + b[2] <= W - G.pad && b[1] >= G.PY + G.pt + 3 && !taken.some(function(q){ return b[0] < q[0] + q[2] + 5 && q[0] < b[0] + b[2] + 5 && b[1] < q[1] + q[3] + 2 && q[1] < b[1] + b[3] + 2; }); };
      ol.forEach(function(e, i){
        var g = groups[i]; if(!g){ hideEl(e); return; }
        var t = g.n > 1 ? 'outliers' : 'outlier', w = tw(t, fsQ, 800), xc = (g.x0 + g.x1) / 2, h = fsQ + 2;
        var tries = g.hi ? [[g.x1 + 9, cy - h / 2], [xc - w / 2, yTop - fsQ], [xc - w / 2, yBot - fsQ], [g.x0 - 9 - w, cy - h / 2]] : [[g.x0 - 9 - w, cy - h / 2], [xc - w / 2, yTop - fsQ], [xc - w / 2, yBot - fsQ], [g.x1 + 9, cy - h / 2]];
        var pick = null;
        tries.some(function(c){ var b = [clamp(c[0], G.pad, W - G.pad - w), c[1], w, h]; if(free(b)){ pick = b; return true; } return false; });
        if(!pick){ hideEl(e); return; }
        taken.push(pick);
        showEl(e); at(e, { x: pick[0], y: pick[1] + fsQ * 0.86, 'text-anchor': 'start', style: 'font-size:' + fsQ + 'px' }); txt(e, t);
      });
      paintHist(s);
    }
    var bars = [], barLabs = [];
    /* the histogram's bins on the picture's scale: bins hold their left edge, except that the last bin stops at the
       scale's maximum and holds it (so nothing falls past the end of the scale); the first starts at the minimum */
    function hbins(xs, w){
      var start = X.binStart(lo, w), nb = Math.max(1, Math.ceil((hi - start) / w - 1e-9)), counts = [], edges = [];
      for(var j = 0; j < nb; j++){ counts.push(0); edges.push([Math.max(lo, M.round(start + j * w, 6)), Math.min(hi, M.round(start + (j + 1) * w, 6))]); }
      xs.forEach(function(v){ var j = v >= hi - 1e-9 ? nb - 1 : Math.floor((v - start) / w + 1e-9); if(j >= 0 && j < nb) counts[j]++; });
      return { counts: counts, edges: edges };
    }
    function paintHist(s){
      var B = hbins(s.xs, S.bin), mx = Math.max.apply(null, B.counts.concat([1]));
      var fs = G.phone ? 11.5 : 12.5, top = G.histTop + (G.H < 380 ? 17 : G.phone ? 21 : 24) + fs + 12, base = G.histBot - 5;
      while(bars.length < B.counts.length){ bars.push(mk('rect', 'dx2-bar', null, gHist)); barLabs.push(mk('text', 'dx2-blab', null, gHist)); }
      var hb = LB.hbase || (LB.hbase = mk('line', 'dx2-hbase', null, gHist)); at(hb, { x1: G.l - 4, x2: G.r + 4, y1: base, y2: base });
      bars.forEach(function(r, j){
        var c = B.counts[j], lb = barLabs[j];
        if(j >= B.counts.length || !c){ hideEl(r); hideEl(lb); return; }
        var a = B.edges[j][0], b = B.edges[j][1], x0 = xv(a), x1 = xv(b), h = c / mx * (base - top), y = base - h;
        showEl(r); at(r, { x: x0 + 0.6, y: y, width: Math.max(0.6, x1 - x0 - 1.2), height: h, rx: 2 });
        if(x1 - x0 >= tw(String(c), fs, 800) + 6){ showEl(lb); at(lb, { x: (x0 + x1) / 2, y: y - 4, 'text-anchor': 'middle', style: 'font-size:' + fs + 'px' }); txt(lb, String(c)); } else hideEl(lb);
      });
      // phones: "Histogram" and the knob's own "bins of 5 min"; wider: the title names the bins, the knob says "bin width"
      var bt = binTrack(), bl = lab('binL', 'dx2-binl', gHist); at(bl, { x: bt[0] - 12, y: bt[1] + 4, 'text-anchor': 'end', style: 'font-size:' + fs + 'px' }); txt(bl, G.phone ? 'bins of ' + num(S.bin, 2) + ' ' + unit() : 'bin width');
      var t = lab('htitle', 'dx2-htitle', gHist), tt = G.phone ? 'Histogram' : 'Histogram, bins of ' + num(S.bin, 2) + ' ' + unit();
      at(t, { x: G.l - 4, y: G.histTop + (G.H < 380 ? 14 : G.phone ? 17 : 20), style: 'font-size:' + (G.phone ? 12 : 13.5) + 'px' }); txt(t, tt);
    }

    /* ---------------------------------------------------- the words: cause line and takeaways, from the drawn state */
    function words(s){
      shownDr();
      if(S.take && !busy()) return;
      var parts = [], u = unit(), n = s.n;
      var ch = S.change, cp = ch && ch.p && ch.p.st === 'in' ? ch.p : null;
      if(S.tab === 'mean'){
        if(cp && dval(cp) !== ch.v0){
          var dm = s.mean - ch.b.mean, md = Dv.med - ch.b.med;
          parts.push({ t: num(ch.v0, 2) + ' → ' + num(dval(cp), 2) + ' ' + u, role: 'val' });
          parts.push({ t: 'mean ' + one(ch.b.mean) + ' → ' + one(s.mean), role: 'mean' });
          parts.push({ t: Math.abs(md) < 1e-9 ? 'median stays ' + nm('med') : 'median ' + num(ch.b.med, 2) + ' → ' + nm('med'), role: 'med' });
        } else if(S.sel && S.cur && S.cur.st === 'in'){
          var v = dval(S.cur), z = s.sd > 0 ? (v - s.mean) / s.sd : 0;
          parts.push({ t: num(v, 2) + ' ' + u, role: 'val' });
          parts.push({ t: 'z = ' + fx(z, 2), role: 'mean' });
          parts.push({ t: Math.abs(z) < 0.005 ? 'at the mean' : fx(Math.abs(z), 2) + ' SD ' + (z > 0 ? 'above' : 'below') + ' the mean', role: 'mean' });
        } else {
          parts.push({ t: plural(n, noun(1), noun(n)), role: 'val' });
          parts.push({ t: 'mean ' + one(s.mean), role: 'mean' });
          parts.push({ t: 'median ' + nm('med'), role: 'med' });
          if(S.sd && Dr.sdA > 0.98) parts.push({ t: 'SD ' + one(s.sd), role: 'mean' });
        }
      } else {
        var outs = S.P.filter(function(p){ return p.out; }).map(dval).sort(function(a, b){ return a - b; });
        var f0 = Dv.f0, f1 = Dv.f1;
        var where = function(v){ return v > f1 + 1e-9 ? { t: num(v, 2) + ' > Q3 + 1.5 × IQR = ' + nm('f1'), out: true } : v < f0 - 1e-9 ? { t: num(v, 2) + ' < Q1 − 1.5 × IQR = ' + nm('f0'), out: true } : { t: 'inside ' + nm('f0') + ' to ' + nm('f1'), out: false }; };
        if(cp && dval(cp) !== ch.v0){
          var w = where(dval(cp));
          parts.push({ t: num(ch.v0, 2) + ' → ' + num(dval(cp), 2) + ' ' + u, role: 'val' });
          parts.push({ t: w.t, role: 'fence' });
          parts.push({ t: w.out ? 'outlier' : 'not an outlier', role: w.out ? 'out' : 'box' });
        } else if(S.sel && S.cur && S.cur.st === 'in'){
          var w2 = where(dval(S.cur));
          parts.push({ t: num(dval(S.cur), 2) + ' ' + u, role: 'val' });
          parts.push({ t: w2.t, role: 'fence' });
          parts.push({ t: w2.out ? 'outlier' : 'not an outlier', role: w2.out ? 'out' : 'box' });
        } else {
          parts.push({ t: 'Q1 ' + nm('q1') + ' · Q3 ' + nm('q3'), role: 'box' });
          parts.push({ t: 'IQR ' + (mv('q1') || mv('q3') ? '…' : num(Dv.q3 - Dv.q1, 2)), role: 'box' });
          parts.push({ t: 'fences ' + nm('f0') + ' and ' + nm('f1'), role: 'fence' });
          parts.push({ t: !outs.length ? 'no outliers' : outs.length === 1 ? '1 outlier: ' + num(outs[0], 2) : outs.length + ' outliers', role: 'out' });
        }
      }
      var key = parts.map(function(x){ return x.t; }).join('|');
      if(key !== lastCause){ lastCause = key; cause.set(parts); }
      txt(nLab, G && G.phone ? 'n = ' + n : plural(n, noun(1), noun(n)));
      bRm.disabled = n <= 5; bAdd.disabled = S.P.filter(function(p){ return p.st !== 'go'; }).length >= 40;
    }
    /* a change has settled: takeaways (once each), the reference, the live line */
    function settled(){
      var s = drawnStats(); if(!s) return;
      if(G && !(handle && handle.dragging())){ var was = G.pw; fitPw(); if(G.pw !== was && !calm()){ kick(); return; } if(G.pw !== was){ step(now(), 16); paint(); } }
      words(s);
      var ch = S.change, cp = ch && ch.p && ch.p.st === 'in' ? ch.p : null;
      if(ch && !ch.told && cp && dval(cp) !== ch.v0 && !(handle && handle.dragging())){
        ch.told = true;
        var t = null, dm = Math.abs(s.mean - ch.b.mean), dmd = Math.abs(s.med - ch.b.med);
        if(S.tab === 'mean'){
          if(dm >= 0.3 && dm > 2 * dmd + 0.05) t = 'resist';
          else if(dmd > dm + 0.05) t = 'middle';
        } else {
          var wasOut = ch.v0 > ch.b.fences[1] || ch.v0 < ch.b.fences[0];
          if(cp.out && !wasOut) t = 'out';
          else if(!cp.out && wasOut) t = 'in';
          else if(Math.abs(s.q1 - ch.b.q1) < 1e-9 && Math.abs(s.q3 - ch.b.q3) < 1e-9 && Math.abs(dval(cp) - ch.v0) >= (hi - lo) * 0.08) t = 'box';
        }
        if(t && !S.took[t] && E.takeaways && E.takeaways[t]){ S.took[t] = true; S.take = t; cause.take(E.takeaways[t]); say(E.takeaways[t]); }
        else say(cause.text());
      }
      refHtml();
    }

    /* ---------------------------------------------------- the knob: the kit's handle, riding above whoever was touched last */
    var press = null;   // { x0, moved } of the pointer that grabbed a person
    var handle = null;
    function knobAt(){
      var p = S.cur; if(!p || !G || p.st === 'gone') return null;
      var x = xv(p.d), y = Math.max(colTop(p) - 22, G.stackTop - 4);
      return rot([x, y]);
    }
    function makeHandle(){
      handle = K.handle(layer, { key: 'apstat-data-explorer-person', label: 'Drag the picked person', value: S.cur ? S.cur.v : 0, min: S.set.x[0], max: S.set.x[1], step: st(), chip: false,
        at: function(){ return knobAt(); },
        pick: function(x, y, v){
          // read on the level scale (the numbers under a resting plank), so a drop lands where the finger is
          if(press && !press.moved){ if(Math.abs(x - press.x0) < 4) return v; press.moved = true; }
          return snap(vx(x));
        },
        valuetext: function(v){ var p = S.cur; if(!p) return ''; var s = drawnStats(), out = S.tab === 'box' && p.out; return num(v, 2) + ' ' + S.set.unit + (out ? ', an outlier' : '') + (s ? '; mean ' + one(s.mean) + ', median ' + num(s.med, 2) : ''); },
        tag: function(v){ return (handle && handle.dragging() && press && press.moved) || (keyed && S.cur && S.cur.tw) ? num(S.cur ? dval(S.cur) : v, 2) + ' ' + unit() : ''; },
        tagSide: function(){ var p = knobAt(); return p && p[0] > G.W / 2 ? 'left' : 'right'; },
        onStart: function(v){ begin(); },
        onInput: function(v){
          var p = S.cur; if(!p) return;
          hideCue(true); tourDid('drag');
          if(handle.dragging()){ p.tw = null; p.v = v; p.d = v; }
          else { keyed = true; p.v = v; p.tw = calm() ? null : { a: p.d, b: v, t0: now(), dur: MOVE }; if(calm()){ p.d = v; fade(); } }
          S.take = null; S.fresh = false;
          if(calm()){ step(now(), 16); paint(); settled(); } else kick();
        },
        onEnd: function(v){
          var p = S.cur; if(!p) return;
          if(press && !press.moved){ press = null; S.change = null; S.sel = !(wasSel && sameP); paint(); if(!busy()) settled(); say(cause.text()); return; }
          press = null;
          if(!busy()) settled(); else kick();
        } });
      handle.knob.addEventListener('blur', function(){ keyed = false; handle.place(); });
      // Delete or Backspace on the knob takes that person away (as the old tool's keys did)
      handle.knob.addEventListener('keydown', function(e){ if(e.key === 'Delete' || e.key === 'Backspace'){ e.preventDefault(); S.sel = true; remove(); } });
    }
    var keyed = false, wasSel = false, sameP = false;
    function begin(){
      var s = drawnStats(); if(!s || !S.cur) return;
      // a new change starts from what is drawn now
      S.change = { p: S.cur, v0: dval(S.cur), b: { mean: s.mean, med: s.med, q1: s.q1, q3: s.q3, fences: s.fences.slice(), sd: s.sd }, told: false };
      S.take = null;
    }
    function setCur(p, selOn){
      if(!p) return;
      S.cur = p; if(selOn != null) S.sel = selOn;
      handle.value(p.v); handle.place();
    }
    function nearest(cx, cy){
      var r = sceneBox.getBoundingClientRect(), k = layer.scale() || 1, q = rot([(cx - r.left) / k, (cy - r.top) / k], true), best = null, bd = Infinity;
      S.P.forEach(function(p){ if(p.st !== 'in' && p.st !== 'come') return; var x = xv(p.d), y = G.PY - (p.lv + 0.5) * levelH, d = Math.hypot(x - q[0], (y - q[1]) * 0.7); if(d < bd){ bd = d; best = p; } });
      return bd <= Math.max(26, G.pw * 1.7) ? best : null;
    }
    pickBox.addEventListener('pointerdown', function(e){
      if(e.pointerType === 'mouse' && e.button !== 0) return;
      var p = nearest(e.clientX, e.clientY);
      hideCue(true);
      if(!p){ if(S.sel){ S.sel = false; S.change = null; paint(); settled(); } return; }
      wasSel = S.sel; sameP = p === S.cur;
      var r = sceneBox.getBoundingClientRect(), k = layer.scale() || 1;
      press = { x0: (e.clientX - r.left) / k, moved: false };
      setCur(p);
      handle.grab(e);
    });
    pickBox.addEventListener('keydown', function(e){
      var arr = counted().slice().sort(function(a, b){ return a.d - b.d || a.id - b.id; }), i = arr.indexOf(S.cur);
      if(e.key === 'ArrowRight' || e.key === 'ArrowUp'){ e.preventDefault(); hideCue(true); setCur(arr[Math.min(arr.length - 1, i + 1)] || arr[0], true); S.change = null; paint(); settled(); say(cause.text()); }
      else if(e.key === 'ArrowLeft' || e.key === 'ArrowDown'){ e.preventDefault(); hideCue(true); setCur(arr[Math.max(0, i - 1)] || arr[0], true); S.change = null; paint(); settled(); say(cause.text()); }
      else if(e.key === 'Escape'){ S.sel = false; S.change = null; paint(); settled(); }
      else if((e.key === 'Delete' || e.key === 'Backspace') && S.sel){ e.preventDefault(); remove(); }
    });

    /* ---------------------------------------------------- the quiet controls */
    function farthest(){
      var c = counted(); if(!c.length) return S.P[0] || null;
      var m = c.reduce(function(a, p){ return a + p.d; }, 0) / c.length, b = c[0];
      c.forEach(function(p){ if(Math.abs(p.d - m) > Math.abs(b.d - m) + 1e-9) b = p; });
      return b;
    }
    function add(){
      var s = drawnStats(), here = S.P.filter(function(p){ return p.st !== 'go'; }).length; if(!s || here >= 40) return;
      // a new value inside the middle half, spread by the golden ratio so new people do not pile on one spot
      adds++; var a0 = Math.max(lo, s.q1 - s.iqr / 2), a1 = Math.min(hi, s.q3 + s.iqr / 2), v = snap(a0 + ((adds * 0.6180339887) % 1) * Math.max(a1 - a0, 2 * st()));
      var p = person(v, !calm()); S.P.push(p);
      S.change = null; S.take = null; S.fresh = false; S.cur = p; S.sel = false; handle.value(v);
      tourDid('count');
      if(calm()){ fade(); step(now(), 16); paint(); settled(); } else kick();
      say('Added ' + num(v, 2) + ' ' + S.set.unit + '.');
    }
    function remove(){
      var s = drawnStats(); if(!s || counted().length <= 5) return;
      var c = counted(), p = S.sel && S.cur && S.cur.st === 'in' ? S.cur : c[c.length - 1];
      p.st = 'go'; p.t0 = now();
      S.change = null; S.take = null; S.fresh = false; S.sel = false;
      if(S.cur === p){ var rest = counted(); S.cur = rest.reduce(function(b, q){ return !b || Math.abs(q.d - s.mean) > Math.abs(b.d - s.mean) ? q : b; }, null); if(S.cur) handle.value(S.cur.v); }
      tourDid('count');
      if(calm()){ fade(); step(now(), 16); paint(); settled(); } else kick();
      say('Removed ' + num(dval(p), 2) + ' ' + S.set.unit + '.');
    }
    function startOver(){
      var vals = S.set.values, c = S.P.filter(function(p){ return p.st !== 'go'; });
      c.forEach(function(p, i){
        if(i < vals.length){ if(p.st === 'come'){ p.st = 'in'; p.a = 1; } p.v = vals[i]; if(Math.abs(p.d - p.v) > 1e-9) p.tw = { a: p.d, b: p.v, t0: now(), dur: MOVE * 1.6 }; }
        else { p.st = 'go'; p.t0 = now(); }
      });
      for(var i = c.length; i < vals.length; i++) S.P.push(person(vals[i], !calm()));
      S.change = null; S.take = null; S.sel = false; S.fresh = true; S.bin = S.set.bin; binKnob.value(S.bin);
      if(calm()){ fade(); step(now(), 16); }
      S.cur = farthestByValue(); handle.value(S.cur.v);
      if(calm()){ paint(); settled(); } else kick();
      say('Start over: the original ' + vals.length + ' values.');
    }
    function farthestByValue(){ var m = S.set.values.reduce(function(a, b){ return a + b; }, 0) / S.set.values.length, b = null; S.P.forEach(function(p){ if(p.st === 'go') return; if(!b || Math.abs(p.v - m) > Math.abs(b.v - m) + 1e-9) b = p; }); return b; }
    function setSet(i){
      S.set = SETS[i] || SETS[0];
      S.P.forEach(function(p){ p.el.remove(); }); S.P = [];
      S.set.values.forEach(function(v){ S.P.push(person(v, false)); });
      S.bin = S.set.bin; lo = S.set.x[0]; hi = S.set.x[1];
      S.change = null; S.take = null; S.sel = false; S.fresh = true; S.took = {};
      S.cur = farthest();
      if(handle){ handle.el.remove(); }
      makeHandle();
      if(binKnob){ binKnob.el.remove(); }
      makeBin();
      fade(); relayout(true); resetDrawn(); paint(); settled();
      say(S.set.name + ': ' + S.set.values.length + ' values.');
    }
    function setSD(on){
      S.sd = on; bSD.setAttribute('aria-pressed', String(on));
      S.change = null; S.take = null; lastCause = '';
      if(calm()){ Dr.sdA = on ? 1 : 0; fade(); paint(); settled(); } else kick();
    }
    function setTab(v){
      if(v === S.tab) return;
      finishAll(true);
      S.tab = v; tabs.value(v); S.change = null; S.take = null; lastCause = '';
      head.purpose((E.purpose || {})[v] || '');
      bSD.hidden = v !== 'mean';
      binKnob.hide(v !== 'box');
      ['meanP'].forEach(function(k){ if(LB[k]) LB[k].style.display = v === 'mean' ? '' : 'none'; });
      gBand.style.display = 'none';
      gFlag.style.display = v === 'mean' ? '' : 'none'; gMark.style.display = v === 'mean' ? '' : 'none'; gWedge.style.display = v === 'mean' ? '' : 'none';
      gPosts.style.display = v === 'box' ? '' : 'none'; gBoxp.style.display = v === 'box' ? '' : 'none'; gHist.style.display = v === 'box' ? '' : 'none';
      sceneBox.setAttribute('data-tab', v);
      fade(); relayout(true); resetDrawn(); paint(); settled();
      tourDid('tab');
    }
    var binKnob = null;
    function binTrack(){ var w = G.phone ? 96 : 150, y = G.histTop + (G.H < 380 ? 10 : G.phone ? 13 : 16); return [G.r - w, y, G.r - 8, y]; }
    function makeBin(){
      binKnob = K.drag(layer, { key: null, label: 'Histogram bin width', min: S.set.binMin, max: S.set.binMax, step: S.set.binStep, value: S.bin, quiet: true, track: G ? binTrack() : [0, 0, 10, 0],
        valuetext: function(v){ return 'bins of ' + num(v, 2) + ' ' + S.set.unit; },
        onInput: function(v){ S.bin = v; hideCue(true); S.change = null; S.take = null; fade(); paint(); settled(); } });
      binKnob.el.classList.add('dx2-binknob');
      binKnob.hide(S.tab !== 'box');
    }

    /* ---------------------------------------------------- the first visit cue (at the knob) and "Show me how" */
    var cue = K.cue(layer, { key: 'apstat-data-explorer', text: 'Drag a person', side: 'above',
      at: function(){ var p = knobAt(); return p ? [p[0], p[1] - 14] : [G ? G.W / 2 : 0, 40]; } });
    function hideCue(used){ if(cue.active()) cue.hide(used); }
    function cueShow(){ if(S.mode !== 'explore' || !S.fresh) return; var p = knobAt(); if(!p) return; cue.show(); }
    var tour = K.tour({ key: 'apstat-data-explorer', label: 'Show me how', steps: [
      { id: 'drag', text: 'Drag any person sideways, far to one side. Watch which follows: the mean (the balance point) or the median (the flag).', target: function(){ return handle ? handle.knob : sceneBox; } },
      { id: 'tab', text: 'The second tab draws the boxplot: the box holds the middle half, and a value past a fence post is an outlier.', target: function(){ return tabs.el; } },
      { id: 'count', text: 'Add or remove a person, or pick another data set. Tap a person to read their z-score.', target: function(){ return acts.querySelector('.dx2-step'); } }],
      onClose: function(had){ if(had) try{ head.how.focus({ preventScroll: true }); }catch(e){} } });
    function tourDid(x){ if(tour.active()) tour.did(x); }
    function startTour(){ if(S.mode !== 'explore') return; hideCue(false); tour.start(true); }

    bAdd.addEventListener('click', function(){ hideCue(true); scrollIn(); add(); });
    bRm.addEventListener('click', function(){ hideCue(true); scrollIn(); remove(); });
    bSD.addEventListener('click', function(){ hideCue(true); scrollIn(); setSD(!S.sd); });
    bReset.addEventListener('click', function(){ scrollIn(); startOver(); });
    pick.addEventListener('change', function(){ setSet(+pick.value); });

    /* ---------------------------------------------------- layout and full redraws */
    function scrollIn(){
      var r = sceneBox.getBoundingClientRect();
      if(r.top < 0) try{ sceneBox.scrollIntoView({ block: 'start', behavior: calm() ? 'auto' : 'smooth' }); }catch(e){}
    }
    function fade(){ sceneBox.classList.remove('is-fade'); void sceneBox.offsetWidth; sceneBox.classList.add('is-fade'); }
    function placeControls(){
      pickBox.style.cssText = 'left:0;top:' + (G.stackTop - 24) + 'px;width:' + G.W + 'px;height:' + (G.PY + G.pt - G.stackTop + 24) + 'px';
      if(binKnob) binKnob.place(binTrack());
    }
    function relayout(force){
      var g = layout(); if(!g) return;
      var key = g.W + 'x' + g.H + ':' + S.tab + ':' + S.set.id;
      if(!force && G && key === G.key) return;
      g.key = key; G = g;
      [].forEach.call(pick.options, function(o, i){ var x = SETS[i]; txt(o, g.phone && x.pickShort ? x.pickShort : x.name); });
      svg.setAttribute('viewBox', '0 0 ' + g.W + ' ' + g.H); svg.setAttribute('width', g.W); svg.setAttribute('height', g.H);
      svg.setAttribute('aria-label', S.set.name + ': ' + counted().length + ' people standing at their values on a plank marked in ' + S.set.unit + (S.tab === 'mean' ? '; the plank balances on a wedge at the mean, a flag stands at the median.' : '; under it the boxplot as a crate, whisker ropes and fence posts, then a histogram.'));
      drawBack();
      pwD = null; fitPw();
      levels(); S.P.forEach(function(p){ p.lv = p.lt; });
      placeControls();
      paint();
      if(busy()) kick();
    }
    function fitHeight(){
      var vw = window.innerWidth || 1024, vh = window.innerHeight || 800;
      if(vw >= 1000){ sceneBox.style.height = ''; return; }
      var top = sceneBox.getBoundingClientRect().top + (window.scrollY || window.pageYOffset || 0);
      // phones: the picture, its knob and the cause line together on the first screen (the quiet buttons may sit below)
      var below = vw < 600 ? (cause.el.offsetHeight || 70) + 12 : lines.offsetHeight || 120;
      var hh = Math.round(vh - (vw < 600 ? top : Math.min(top, vh * 0.34)) - below - 16);
      sceneBox.style.height = clamp(hh, vw < 600 ? (vh < 700 ? 300 : vh < 800 ? 360 : 400) : 520, vw < 600 ? 720 : 900) + 'px';
    }
    var roT = 0;
    function onResize(){ clearTimeout(roT); roT = setTimeout(function(){ fitHeight(); relayout(); }, 40); }
    try{ if(window.ResizeObserver){ new ResizeObserver(function(){ relayout(); }).observe(sceneBox); } }catch(e){}
    window.addEventListener('resize', onResize);

    /* ---------------------------------------------------- the reference behind "?" */
    function refHtml(){
      var s = drawnStats(); if(!s) return;
      var u = S.set.unit, srt = s.xs.slice().sort(function(a, b){ return a - b; }), B = hbins(s.xs, S.bin);
      var outs = s.outliers.length ? s.outliers.map(function(v){ return num(v, 2); }).join(', ') + ' ' + u : 'none';
      var h = '<p class="dx2-howref"><button type="button" class="tk2-how" data-how>Show me how</button> to use it, step by step.</p>';
      h += '<h3>What you are looking at</h3><p>' + esc(S.set.lead) + ' Each person stands at their value on a plank marked in ' + esc(u) + '; people with the same value stand on each other’s shoulders, like the dots of a dotplot, so a stack’s height is how many people have that value (people at nearby values stand beside them, overlapping).</p>';
      h += '<h3>Mean and median</h3><p>The <b>mean</b> (' + esc(fx(s.mean, 2)) + ' ' + esc(u) + ') adds every value and divides by n = ' + s.n + '. It is the <b>balance point</b>: the plank (drawn as if it weighed nothing, so only the people count) balances only when the wedge is under it, because the distances to the values on the left and on the right add up the same (the deviations from the mean sum to 0). Move one value and the mean moves by that change divided by n, so one far value pulls it. The <b>median</b> (' + esc(num(s.med, 2)) + ') is the middle of the ordered values' + (s.n % 2 ? ' (the ' + ((s.n + 1) / 2) + 'th)' : ' (the mean of the ' + (s.n / 2) + 'th and ' + (s.n / 2 + 1) + 'th)') + ': it only moves when a value crosses the middle. The median is <b>resistant</b>; the mean is not.</p>';
      h += '<h3>Spread: SD and IQR</h3><p>The sample standard deviation s = ' + esc(fx(s.sd, 2)) + ' ' + esc(u) + ' (squared distances from the mean, divided by n − 1, then the square root) uses every value: not resistant. The IQR = Q3 − Q1 = ' + esc(num(s.q3, 2)) + ' − ' + esc(num(s.q1, 2)) + ' = ' + esc(num(s.iqr, 2)) + ' is the width of the box, the middle half: resistant. The ± 1 SD switch shades the mean ± one SD.</p>';
      h += '<h3>Quartiles, the way AP® Statistics finds them</h3><p>Order the values. Q1 is the median of the lower half and Q3 the median of the upper half; when n is odd the median itself is left out of both halves. This is also what a TI-84’s 1-Var Stats gives. Some software uses other rules and can give slightly different quartiles.</p>';
      h += '<h3>Outliers: the 1.5 × IQR rule</h3><p>A value is an outlier when it is below Q1 − 1.5 × IQR = ' + esc(num(s.fences[0], 2)) + ' or above Q3 + 1.5 × IQR = ' + esc(num(s.fences[1], 2)) + ' (the fence posts). Here: ' + esc(outs) + '. The whiskers (the ropes) end at the most extreme values inside the fences (' + esc(num(s.whiskers[0], 2)) + ' and ' + esc(num(s.whiskers[1], 2)) + '); each outlier is its own dot.</p>';
      h += '<h3>Shape</h3><p>These ' + esc(S.set.what) + 's look ' + esc(s.shape.word) + '. In a skewed distribution the mean is pulled toward the long tail, away from the median. ' + esc(X.SHAPE_RULE) + ' (Skewness here: ' + esc(fx(s.g, 2)) + '.) A boxplot cannot show gaps or how many peaks there are: the people and the histogram can.</p>';
      h += '<h3>z-scores</h3><p>Tap a person to read their z-score, z = (value − mean) ÷ SD: how many standard deviations above (+) or below (−) the mean they are.</p>';
      h += '<h3>Bins</h3><p>The histogram counts the people in each bin of ' + esc(num(S.bin, 2)) + ' ' + esc(u) + ' (a bin holds its left edge, not its right; the last bin stops at the scale’s end, ' + esc(num(hi, 2)) + ', and holds it, so it can be narrower than the others). Wide bins hide detail; narrow bins look ragged. Drag the small knob on the histogram to change them.</p>';
      h += '<h3>Every summary, from the people</h3><div class="table-wrap" tabindex="0" role="region" aria-label="Summary statistics"><table class="ls-tbl dx-tbl"><tbody>' +
        [['n', String(s.n)], ['Mean, x̄', fx(s.mean, 2)], ['Standard deviation, s', fx(s.sd, 2)], ['Minimum', num(s.min, 2)], ['Q1', num(s.q1, 2)], ['Median', num(s.med, 2)], ['Q3', num(s.q3, 2)], ['Maximum', num(s.max, 2)], ['Range', num(s.range, 2)], ['IQR', num(s.iqr, 2)], ['Fences', num(s.fences[0], 2) + ' and ' + num(s.fences[1], 2)], ['Outliers', s.outliers.length ? s.outliers.map(function(v){ return num(v, 2); }).join(', ') : 'none']]
          .map(function(r){ return '<tr><th scope="row">' + r[0] + '</th><td class="r">' + esc(r[1]) + '</td></tr>'; }).join('') + '</tbody></table></div>';
      h += '<h3>The values, in order</h3><p class="dx-vals">' + esc(srt.map(function(v){ return num(v, 2); }).join(', ')) + ' ' + esc(u) + '</p>';
      h += '<h3>Histogram counts</h3><div class="table-wrap" tabindex="0" role="region" aria-label="Histogram bin counts"><table class="ls-tbl dx-tbl"><thead><tr><th scope="col">Bin</th><th scope="col">Count</th></tr></thead><tbody>' +
        B.counts.map(function(c, j){ return '<tr><td>' + esc(num(B.edges[j][0], 2) + (j === B.counts.length - 1 ? ' to ' : ' to under ') + num(B.edges[j][1], 2)) + '</td><td class="r">' + c + '</td></tr>'; }).join('') + '</tbody></table></div>';
      h += '<h3>Keys</h3><p>Tab to the people, then the left and right arrows pick a person (their z-score or place against the fences shows under the picture); Tab again to the knob above them, whose arrows move them one ' + esc(S.set.unit.replace(/s$/, '')) + ' (Shift or Page Up and Down: ten). Delete takes the picked person away; Escape clears the pick.</p>';
      h += '<div class="dx2-about">' + (data.intro || '') + (data.howItWorks ? '<h3>' + esc(data.howItWorksTitle || 'How it works') + '</h3>' + data.howItWorks : '') + '</div>';
      if(ref._h !== h){ ref._h = h; ref.innerHTML = h; var hw = ref.querySelector('[data-how]'); if(hw) hw.addEventListener('click', function(){ startTour(); }); }
    }

    function boot(){
      fitHeight();
      relayout(true); resetDrawn();
      if(binKnob && G) binKnob.place(binTrack());
      paint(); settled();
      setTimeout(function(){ fitHeight(); relayout(); cueShow(); }, 60);
    }
    function finishAll(quiet){
      // leaving mid change: every move, arrival and departure finishes, the marks settle where the people are
      S.P.forEach(function(p){ if(p.tw){ p.d = p.tw.b; p.tw = null; } if(p.st === 'come'){ p.st = 'in'; p.a = 1; } if(p.st === 'go'){ p.st = 'gone'; } });
      var gone = S.P.filter(function(p){ return p.st === 'gone'; }); gone.forEach(function(p){ p.el.remove(); }); S.P = S.P.filter(function(p){ return p.st !== 'gone'; });
      if(S.cur && S.P.indexOf(S.cur) < 0) S.cur = farthest();
      if(raf){ cancelAnimationFrame(raf); raf = 0; }
      if(G){ levels(); S.P.forEach(function(p){ p.lv = p.lt; }); }
      resetDrawn(); Dr.sdA = S.sd ? 1 : 0;
      if(!quiet && G){ paint(); settled(); }
    }
    function shown(m){
      S.mode = m;
      if(m !== 'explore'){ finishAll(); tour.stop(); hideCue(false); return; }
      setTimeout(function(){ fitHeight(); relayout(true); cueShow(); }, 40);
    }
    // first build
    lo = S.set.x[0]; hi = S.set.x[1];
    S.set.values.forEach(function(v){ S.P.push(person(v, false)); });
    S.cur = farthest();
    head.purpose((E.purpose || {}).mean || '');
    sceneBox.setAttribute('data-tab', 'mean');
    gPosts.style.display = 'none'; gBoxp.style.display = 'none'; gHist.style.display = 'none'; gBand.style.display = 'none';
    makeHandle(); makeBin();
    return {
      kit2: function(pane, s){ boot(); return { stage: stage, ref: ref }; },
      plain: function(){ host.appendChild(stage); host.appendChild(ref); boot(); },
      shown: shown, stop: function(){ finishAll(); },
      // for the sweep test only: window.ApStatDataExplorer when the test sets window.LevlToolTest before the page loads
      _t: { S: S, Dr: Dr, G: function(){ return G; }, xv: xv, vx: vx, lo: function(){ return lo; }, hi: function(){ return hi; }, busy: busy, stats: drawnStats, dval: dval, cause: cause, handle: function(){ return handle; },
        setTab: function(v){ setTab(v); }, setSet: function(i){ pick.value = String(i); setSet(i); }, setSD: setSD, add: add, remove: remove, startOver: startOver,
        levelH: function(){ return levelH; }, sc: function(){ return sc; }, knobAt: knobAt, rot: rot,
        move: function(p, v){ S.cur = p; handle.value(p.v); begin(); handle.value(v, true); },
        select: function(p){ setCur(p, true); S.change = null; paint(); settled(); },
        bin: function(v){ binKnob.value(v, true); }, finish: function(){ finishAll(); }, relayout: relayout,
        kmode: function(m){ var b = document.querySelector('.bt-mode[data-m="' + m + '"]'); if(b) b.click(); } }
    };
  }

  /* ------------------------------------------------------ test yourself */
  function quiz(host, data){
    var o = { slug: 'data-explorer', noun: 'drill', types: X.TYPES, typeLabel: 'Kind of problem',
      // the values are read from the problem text, so it sits on the stage over the dots
      generate: function(r, ctx, type){ var p = X.generate(r, ctx, type); o.textOnStage = p.type !== 'describe'; return p; },
      title: function(p){ return ({ summary: 'Summary statistics', resist: 'Resistant or not?', fences: 'Outliers and the boxplot', describe: 'Describe the distribution', zscore: 'A z-score' })[p.type] || 'Practice problem'; },
      extra: function(el, p, api){ api.fig = el; api.shown = {}; figure(el, p, api.shown); },
      onStep: function(s, right, api){ var f = api.problem.figure, k = f.reveal && f.reveal[s.key]; api.shown.yours = null; if(k) api.shown[k] = true; if(s.key === 'isout' || (api.problem.type === 'describe' && s.key === 'vs')) api.shown.fence = true; figure(api.fig, api.problem, api.shown); },
      // A wrong value on the data's own scale is drawn on the dots (mean, median, quartiles, fence, whisker, the z-score's value).
      onTry: function(s, t, api){
        if(t.right || s.kind !== 'num' || !isFinite(t.value)) return;
        var p = api.problem, d = p.data || {}, v = t.value, lab = M.fixed(v, s.d != null ? s.d : 2);
        if(s.key === 'z' && d.sd) { v = d.mean + t.value * d.sd; lab = 'z = ' + M.fixed(t.value, 2); }
        if(s.key === 'sd' || s.key === 'iqr' || s.key === 'dmean' || s.key === 'dmed') { api.shown.yours = null; api.shown.yoursTag = lab; figure(api.fig, p, api.shown); return; }
        api.shown.yours = { v: v, t: lab }; figure(api.fig, p, api.shown);
      },
      method: function(s, p){
        var H = { mean: 'Add all the values, then divide by how many there are.', median: 'Put the values in order; the median is the middle one (or the mean of the two middle ones).',
          iqr: 'IQR = Q3 − Q1: the medians of the upper and lower halves, not counting the median itself when n is odd.', sd: 'Technology: 1-Var Stats gives s (the sample SD, dividing by n − 1).',
          dmean: 'The mean moves by the change divided by n.', dmed: 'Is the changed value still on the same side of the middle? If so the median does not move.',
          spread: 'Which measure uses every value (not resistant) and which uses only the middle half (resistant)?',
          q1: 'Order the values; Q1 is the median of the lower half.', q3: 'Order the values; Q3 is the median of the upper half.',
          fence: 'Upper fence = Q3 + 1.5 × IQR; lower fence = Q1 − 1.5 × IQR.', isout: 'A value is an outlier when it lies beyond the fence drawn on the plot.',
          whisk: 'A whisker ends at the most extreme data value inside the fences.', shape: 'Look at where the long tail points: the tail names the skew.',
          vs: 'The mean is pulled toward the long tail; the median is not.', sentence: 'Full credit: shape, center, spread and outliers, with numbers and in context.',
          z: 'z = (value − mean) ÷ SD, with the mean and SD given. Your z is drawn as the value it stands for.', zread: 'Say how many SDs above or below the mean, in context.', zrule: 'Is the value more than 2 SDs from the mean, by the z-score?' };
        return H[s.key] || null;
      }
    };
    T.drill(host, data, o);
  }
  /* The drill's picture: the problem's own values; each answered step adds
     its result (keys in figure.reveal). */
  function figure(el, p, shown){
    var f = p.figure, vals = f.values, all = vals.concat(f.after || []);
    var mn = Math.min.apply(null, all), mx = Math.max.apply(null, all), span = Math.max(mx - mn, 1);
    var st = P.ticks(mn, mx, 5), stp = st.length > 1 ? st[1] - st[0] : 1;
    var lo = Math.floor((mn - span * 0.06) / stp) * stp, hi = Math.ceil((mx + span * 0.06) / stp) * stp;
    var show = { hist: !!f.hist, mean: !!(shown.mean || shown.center || shown.zscale), median: !!(shown.median || shown.center),
      box: !!(shown.box || shown.whisk), whisk: !!shown.whisk || (p.type === 'describe' && !!shown.box),
      fences: !!shown.fence, fenceSide: f.side, sd: false, zscale: !!shown.zscale };
    var o = { values: vals, lo: lo, hi: hi, unit: f.unit, label: f.label, step: Math.pow(10, -(f.dp || 0)), bin: niceBin(span), show: show,
      mark: f.mark, given: shown.zscale ? f.given : null, after: f.after || null, changedIndex: p.data.index, yours: shown.yours || (shown.yoursTag ? { v: NaN } : null),
      boxPanel: p.type !== 'zscore' && p.type !== 'resist', placeholder: 'The boxplot is drawn here as you answer.' };
    function render(){
      var box = el.querySelector('.dx-qfig') || el, rc = box.getBoundingClientRect();
      var W = Math.round(rc.width) || 520, H = Math.round(rc.height);
      if(!(H >= 180)) H = phone() ? 300 : f.hist ? 360 : 300;
      W = Math.max(280, Math.min(1200, W)); H = Math.min(H, 760);
      var g = inner(o, W, H);
      el.innerHTML = '<figure class="dx-qfig"><svg class="dx-svg" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(ariaQ(o, g.S, show) + (shown.yours ? ' Your answer: ' + shown.yours.t + '.' : shown.yoursTag ? ' Your answer: ' + shown.yoursTag + '.' : '')) + '">' + g.html + '</svg>' + (shown.yoursTag ? '<figcaption class="dx-ycap">Yours: ' + esc(shown.yoursTag) + '</figcaption>' : '') + '</figure>';
    }
    render();
    if(window.ResizeObserver && !el.__dxRO){ var t = null; el.__dxRO = new ResizeObserver(function(){ clearTimeout(t); t = setTimeout(function(){ if(el.__dxDraw) el.__dxDraw(); }, 60); }); el.__dxRO.observe(el); }
    el.__dxDraw = render;
  }
  function niceBin(span){ var raw = span / 7, p = Math.pow(10, Math.floor(Math.log10(raw))), m = raw / p; return (m <= 1 ? 1 : m <= 2 ? 2 : m <= 5 ? 5 : 10) * p; }
  function ariaQ(o, S, show){
    var t = 'Dotplot of ' + S.n + ' ' + o.label + 's in ' + o.unit + (show.hist ? ', with a histogram' : '');
    if(show.mean) t += '; mean ' + fx(S.mean, 2);
    if(show.median) t += '; median ' + nf(S.med);
    if(show.box) t += '; box from Q1 ' + nf(S.q1) + ' to Q3 ' + nf(S.q3);
    if(show.whisk) t += '; whiskers to ' + nf(S.whiskers[0]) + ' and ' + nf(S.whiskers[1]) + (S.outliers.length ? ', outliers ' + S.outliers.map(nf).join(', ') : '');
    if(show.fences) t += '; fences at ' + fx(S.fences[0], 2) + ' and ' + fx(S.fences[1], 2);
    return t + '.';
  }

  function boot(){
    T.mount(SLUG, function(app, data){
      var ex = null, kit = !!(window.LevlKit2 && window.LevlStudio && app.getAttribute('data-studio'));
      T.modes(app, { slug: SLUG, labels: ['Explore', 'Test yourself'],
        explore: function(host){ ex = explore(host, data); if(window.LevlToolTest) window.ApStatDataExplorer = ex._t; },
        quiz: function(host){ quiz(host, data); },
        onShow: function(m){ if(ex) ex.shown(m); },
        studio: kit ? { kit2: function(pane, s){ return ex.kit2(pane, s); } } : {} });
      // Without the frame (no Tool Studio, or no kit) the stage still works on its own, above Test yourself.
      if(!kit || !T.studioOf(app)) ex.plain();
    });
  }
  /* The page loads the kit (pages.json "kit2": true). A cached copy of the old page would not: fetch it then. */
  if(window.LevlKit2) boot();
  else {
    var up = (window.ApStatBase || '../') + '../assets/course/';
    var l = document.createElement('link'); l.rel = 'stylesheet'; l.href = up + 'tool-kit2.css'; document.head.appendChild(l);
    var sc = document.createElement('script'); sc.src = up + 'tool-kit2.js'; sc.onload = boot; sc.onerror = boot; document.head.appendChild(sc);
  }
})();
