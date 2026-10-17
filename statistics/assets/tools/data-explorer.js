/* Data explorer (simulator; docs/apstat-spec.md section 6). OWNED BY THIS TOOL
   ONLY. The model is ApStatMath.dataExplorer (statistics/assets/tools/math/
   data-explorer.js); every number on the page comes from it (ApStatDist
   underneath), computed from the dots on the screen.

   Explore: one data set as a dotplot, a histogram and a boxplot on one shared
   axis. Drag a dot (mouse, touch, or focus it and use the arrow keys) and the
   mean and median lines, the bars, the box, the whiskers and the outliers move
   with it. Tap a dot to read its z-score and where it sits against the
   fences. The dock holds the bin width and two overlays (mean ± SD, the
   1.5 × IQR fences); Why explains what moved and why; the second sheet has
   every summary, the ordered values, the bin counts and the data set chooser.
   Test yourself: ApStatTools.drill over the model's generate(); the problem's
   data are the dots on the stage, and each answered step draws its result
   there (the mean, the median, the box, a fence, a whisker, the z scale). */
(function(){
  'use strict';
  var T = window.ApStatTools, M = window.ApStatMath, P = window.ApStatPlot;
  if(!T || !M || !M.dataExplorer || !P) return;
  var X = M.dataExplorer, esc = T.esc;
  var NS = 'http://www.w3.org/2000/svg';
  var app0 = document.getElementById('app');
  if(app0 && !app0.getAttribute('data-details-title')) app0.setAttribute('data-details-title', 'Data & numbers');

  T.mount('data-explorer', function(app, data){
    var ex = null;
    T.modes(app, { slug: 'data-explorer',
      explore: function(host){ ex = explore(host, data); },
      quiz: function(host){ quiz(host, data); },
      studio: { explore: function(pane, s){ ex.studio(pane, s); } } });
  });

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
    var fs = small ? 12 : 13.5;
    // grid and the shared axis
    out.push('<g class="dx-grid" aria-hidden="true">' + ticks.map(function(t){ var x = sx(t).toFixed(1); return '<line x1="' + x + '" x2="' + x + '" y1="' + dot.y0 + '" y2="' + box.y1 + '"/>'; }).join('') + '</g>');
    out.push('<g class="dx-axis" aria-hidden="true"><line x1="' + padL + '" x2="' + (W - padR) + '" y1="' + box.y1 + '" y2="' + box.y1 + '"/>' +
      ticks.filter(function(t){ return !small || sx(t) < W - 46; }).map(function(t){ var x = sx(t).toFixed(1); return '<line x1="' + x + '" x2="' + x + '" y1="' + box.y1 + '" y2="' + (box.y1 + 5) + '"/><text x="' + x + '" y="' + (box.y1 + 17) + '" text-anchor="middle" style="font-size:' + fs + 'px">' + esc(M.fmt(t, 6)) + '</text>'; }).join('') +
      '<text class="dx-axt" x="' + (padL + pw / 2) + '" y="' + (H - 6) + '" text-anchor="middle" style="font-size:' + fs + 'px">' + esc(cap(o.label) + ' (' + o.unit + ')') + '</text></g>');
    function title(y, t){ out.push('<text class="dx-ptitle" x="' + padL + '" y="' + (y + 12) + '" style="font-size:' + (fs - 0.5) + 'px" aria-hidden="true">' + esc(t) + '</text>'); }

    // ---- histogram
    if(hist){
      var start = X.binStart(lo, o.bin), B = X.bins(vals, start, o.bin), mx = Math.max.apply(null, B.counts.concat([1]));
      var hy = function(c){ return hist.y1 - c / mx * (hist.y1 - hist.y0 - 34); };
      var cTicks = P.ticks(0, mx, 3).filter(function(t){ return t === Math.round(t); });
      out.push('<g class="dx-hist">' + cTicks.map(function(t){ var y = hy(t).toFixed(1); return '<line class="dx-hgrid" x1="' + padL + '" x2="' + (W - padR) + '" y1="' + y + '" y2="' + y + '"/><text class="dx-cnt" x="' + (padL - 6) + '" y="' + (+y + 4) + '" text-anchor="end" style="font-size:' + (fs - 1) + 'px">' + t + '</text>'; }).join('') +
        B.counts.map(function(c, j){
          if(!c) return '';
          var x0 = sx(B.edges[j][0]), x1 = sx(B.edges[j][1]), y = hy(c), wpx = x1 - x0;
          return '<rect class="dx-bar" x="' + x0.toFixed(1) + '" y="' + y.toFixed(1) + '" width="' + Math.max(0.5, wpx).toFixed(1) + '" height="' + Math.max(0, hist.y1 - y).toFixed(1) + '"/>' +
            (wpx >= 13 ? '<text class="dx-blab" x="' + ((x0 + x1) / 2).toFixed(1) + '" y="' + (y - 4).toFixed(1) + '" text-anchor="middle" style="font-size:' + (fs - 1.5) + 'px">' + c + '</text>' : '');
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
  function ariaOf(o, S){
    return cap(o.label) + 's of ' + S.n + ' ' + (o.noun || 'values') + ' as a dotplot' + (o.show && o.show.hist ? ', a histogram' : '') + ' and a boxplot. Mean ' + fx(S.mean, 2) + ', median ' + nf(S.med) + ', SD ' + fx(S.sd, 2) + ', IQR ' + nf(S.iqr) + ' ' + o.unit + (S.outliers.length ? '; outliers ' + S.outliers.map(nf).join(', ') : '; no outliers') + '.';
  }
  function sizeOf(el, fallbackH){
    var r = el.getBoundingClientRect(), w = Math.round(r.width) || 640, h = Math.round(r.height) || 0;
    w = Math.max(260, Math.min(1400, w));
    if(!h || h < 200) h = fallbackH || Math.round(Math.max(320, Math.min(520, w * 0.7)));
    return [w, Math.min(h, 900)];
  }

  /* --------------------------------------------------------- explore */
  function explore(host, data){
    var sets = ((data.explore || {}).datasets || []).filter(function(d){ return d.values && d.values.length > 2; });
    var cur = sets[0], vals = cur.values.slice(), bin = cur.bin, sel = -1, LS = null, touched = false;
    var show = { sd: false, fences: false }, before = null, lastMsg = '';
    var nid = T.nid('dx');
    function $(q){ return host.querySelector(q) || (LS ? LS.root.querySelector(q) : null); }
    host.innerHTML = '<section class="bt-problem dx-card" aria-labelledby="' + nid + '-h"><h2 id="' + nid + '-h" class="sr-only">Data explorer</h2>' +
      '<div class="dx-fig"><svg class="dx-svg" xmlns="' + NS + '" role="group"></svg></div>' +
      '<div class="dx-ctl"><div class="dx-chips" role="group" aria-label="Show on the graphs">' +
        '<button type="button" class="tchip dx-chip" data-k="sd" aria-pressed="false"><i class="dx-sw sd" aria-hidden="true"></i>Mean ± 1 SD</button>' +
        '<button type="button" class="tchip dx-chip" data-k="fences" aria-pressed="false"><i class="dx-sw fence" aria-hidden="true"></i>Outlier fences</button></div>' +
        '<div class="dx-bin"></div></div>' +
      '<div class="dx-say"></div>' +
      T.moreHtml('<div class="dx-pick"></div><div class="bt-buttons dx-btns"><button type="button" class="bt-btn dx-add">Add a value</button><button type="button" class="bt-btn dx-rm">Remove the selected value</button><button type="button" class="bt-btn dx-reset">Reset the data</button></div><p class="bt-small dx-btn-note" role="status"></p>', 'the data set and its values') +
      '<div class="dx-nums"></div><p class="sr-only dx-live" role="status" aria-live="polite"></p></section>';
    var say = T.announcer($('.dx-live'));
    var cue = T.cue('Drag a dot sideways, far to one side, and watch which line follows it: the mean or the median.');
    $('.dx-ctl').insertBefore(cue.el, $('.dx-ctl').firstChild);
    var binSl = T.slider({ label: 'Histogram bin width', min: cur.binMin, max: cur.binMax, step: cur.binStep, value: bin, unit: cur.short || cur.unit, onInput: function(v){ bin = v; act(); draw(); } });
    $('.dx-bin').appendChild(binSl.el);
    var pick = T.choiceSelect({ label: 'Data set', options: sets.map(function(d, i){ return { value: i, label: d.name }; }), value: 0, onChange: function(v){ load(sets[+v]); } });
    $('.dx-pick').appendChild(pick.el);
    host.querySelectorAll('.dx-chip').forEach(function(b){ b.addEventListener('click', function(){ var k = b.getAttribute('data-k'); show[k] = !show[k]; act(); draw(); }); });
    $('.dx-add').addEventListener('click', function(){
      if(vals.length >= 40){ note('That is plenty of values.'); return; }
      var S = X.stats(vals), v = snap(S.med + (vals.length % 2 ? 1 : -1) * Math.max(cur.step, S.iqr / 3));
      vals.push(v); sel = vals.length - 1; act(); draw(); note('Added ' + nf(v) + ' ' + cur.unit + '. n = ' + vals.length + '.');
    });
    $('.dx-rm').addEventListener('click', function(){
      if(sel < 0){ note('Tap a dot first, then remove it.'); return; }
      if(vals.length <= 5){ note('Keep at least five values.'); return; }
      var v = vals.splice(sel, 1)[0]; sel = -1; act(); draw(); note('Removed ' + nf(v) + '. n = ' + vals.length + '.');
    });
    $('.dx-reset').addEventListener('click', function(){ vals = cur.values.slice(); sel = -1; draw(); note('Back to the original ' + vals.length + ' values.'); });
    function note(t){ var n = $('.dx-btn-note'); if(n) n.textContent = t; }
    function load(d){
      cur = d; vals = d.values.slice(); sel = -1; bin = d.bin;
      binSl.el.remove();
      binSl = T.slider({ label: 'Histogram bin width', min: d.binMin, max: d.binMax, step: d.binStep, value: bin, unit: d.short || d.unit, onInput: function(v){ bin = v; act(); draw(); } });
      $('.dx-bin').appendChild(binSl.el);
      if(LSsetup) LSsetup(d.name);
      draw();
    }
    function act(){ if(!touched){ touched = true; cue.done(); } }
    function snap(v){ var s = cur.step || 1; return Math.max(cur.x[0], Math.min(cur.x[1], M.round(Math.round(v / s) * s, 6))); }

    var svg = $('.dx-svg'), fig = $('.dx-fig'), geo = null;
    function opts(){ return { values: vals, lo: cur.x[0], hi: cur.x[1], unit: cur.unit, short: cur.short, label: cur.what, noun: cur.noun, step: cur.step, bin: bin,
      show: { hist: true, mean: true, median: true, sd: show.sd, fences: show.fences }, sel: sel, drag: true }; }
    function draw(){
      var wh = sizeOf(fig, phone() ? 420 : 460), o = opts();
      svg.setAttribute('viewBox', '0 0 ' + wh[0] + ' ' + wh[1]);
      svg.setAttribute('width', wh[0]); svg.setAttribute('height', wh[1]);
      var focusI = document.activeElement && document.activeElement.getAttribute && document.activeElement.closest && document.activeElement.closest('.dx-svg') ? document.activeElement.getAttribute('data-i') : null;
      geo = inner(o, wh[0], wh[1]);
      svg.innerHTML = geo.html;
      svg.setAttribute('aria-label', ariaOf(o, geo.S));
      if(focusI != null){ var f = svg.querySelector('[data-i="' + focusI + '"]'); if(f){ restoring = true; f.focus({ preventScroll: true }); restoring = false; } }
      var chipSync = function(b){ var on = !!show[b.getAttribute('data-k')]; b.setAttribute('aria-pressed', String(on)); b.classList.toggle('on', on); };
      host.querySelectorAll('.dx-chip').forEach(chipSync);
      if(LS) LS.root.querySelectorAll('.dx-chip').forEach(chipSync);
      words(geo.S);
    }
    var restoring = false;

    /* ---- what the student sees said about it */
    function words(S){
      var u = cur.unit, sh = S.shape, dM = S.mean - S.med;
      var head, sub;
      if(lastMsg){ head = lastMsg; }
      else if(sel > -1){
        var v = vals[sel], zz = S.sd > 0 ? (v - S.mean) / S.sd : 0, out = v < S.fences[0] || v > S.fences[1];
        head = '<b>' + esc(nf(v) + ' ' + u) + ': z = ' + esc(fx(zz, 2)) + '.</b> ' + esc(fx(Math.abs(zz), 2) + ' SD ' + (zz >= 0 ? 'above' : 'below') + ' the mean; ' + (out ? 'an outlier by the 1.5 × IQR rule.' : 'inside the fences, so not an outlier.'));
      } else head = '<b>Mean ' + esc(fx(S.mean, 1)) + ', median ' + esc(nf(S.med)) + ' ' + esc(u) + '.</b> ' + (touched ? esc(cap(sh.word) + ': the mean sits ' + (Math.abs(dM) < 0.05 * S.sd ? 'right at' : dM > 0 ? 'to the right of' : 'to the left of') + ' the median.') : 'Drag a dot far to one side: which line follows it?');
      sub = whyHtml(S);
      T.explain($('.dx-say'), head, sub);
      nums(S);
      if(LS){
        LS.caption(head, 'explore');
        LS.pills([{ k: 'Mean', html: esc(fx(S.mean, 1)), tone: 'readout' }, { k: 'Median', html: esc(nf(S.med)), tone: 'readout' }], 'left', 'explore');
        LS.pills(phone() ? [{ k: 'SD', html: esc(fx(S.sd, 1)) + ' · IQR ' + esc(nf(S.iqr)), tone: 'ghost' }] : [{ k: 'SD', html: esc(fx(S.sd, 1)), tone: 'ghost' }, { k: 'IQR', html: esc(nf(S.iqr)), tone: 'ghost' }], 'right', 'explore');
      }
    }
    function whyHtml(S){
      var u = cur.unit, w = cur.what;
      var outs = S.outliers.length ? S.outliers.map(nf).join(', ') + ' ' + u : 'none';
      return '<h3 class="dx-h">Mean and median</h3><p>The mean (' + esc(fx(S.mean, 2)) + ' ' + esc(u) + ') adds every value, so one far value pulls it. The median (' + esc(nf(S.med)) + ') only cares which value is in the middle: it is <b>resistant</b>. Drag the largest value further out and the mean follows; the median does not.</p>' +
        '<h3 class="dx-h">SD and IQR</h3><p>The SD (' + esc(fx(S.sd, 2)) + ') measures the typical distance from the mean and uses every value, so it is not resistant. The IQR (' + esc(nf(S.iqr)) + ' = Q3 − Q1 = ' + esc(nf(S.q3)) + ' − ' + esc(nf(S.q1)) + ') is the width of the box, the middle half of the data: resistant.</p>' +
        '<h3 class="dx-h">Outliers: the 1.5 × IQR rule</h3><p>A value is an outlier when it is below Q1 − 1.5 × IQR = ' + esc(fx(S.fences[0], 2)) + ' or above Q3 + 1.5 × IQR = ' + esc(fx(S.fences[1], 2)) + '. Here: ' + esc(outs) + '. The whiskers stop at the most extreme values inside the fences (' + esc(nf(S.whiskers[0])) + ' and ' + esc(nf(S.whiskers[1])) + '); outliers are drawn as their own dots.</p>' +
        '<h3 class="dx-h">Shape</h3><p>These ' + esc(w) + 's look ' + esc(S.shape.word) + '. In a skewed distribution the mean is pulled toward the long tail, away from the median. ' + esc(X.SHAPE_RULE) + ' (Skewness here: ' + esc(fx(S.g, 2)) + '.) A boxplot cannot show modality or gaps: the dotplot and histogram can.</p>' +
        '<h3 class="dx-h">z-scores</h3><p>Tap a dot to read its z-score, z = (value − mean) ÷ SD: how many standard deviations it is above (+) or below (−) the mean.</p>' +
        '<h3 class="dx-h">Bin width</h3><p>The same data can look different with other bins: wide bins hide detail, narrow bins look ragged. Bins include their left edge.</p>';
    }
    function nums(S){
      var u = cur.unit, start = X.binStart(cur.x[0], bin), B = X.bins(vals, start, bin);
      var rows = [['n', String(S.n)], ['Mean, x̄', fx(S.mean, 2)], ['Standard deviation, s', fx(S.sd, 2)], ['Minimum', nf(S.min)], ['Q1', nf(S.q1)], ['Median', nf(S.med)], ['Q3', nf(S.q3)], ['Maximum', nf(S.max)], ['Range', nf(S.range)], ['IQR', nf(S.iqr)],
        ['Fences', fx(S.fences[0], 2) + ' and ' + fx(S.fences[1], 2)], ['Outliers', S.outliers.length ? S.outliers.map(nf).join(', ') : 'none']];
      $('.dx-nums').innerHTML = '<h3 class="ls-title-l">Every summary, from the dots</h3><div class="table-wrap" tabindex="0" role="region" aria-label="Summary statistics"><table class="ls-tbl dx-tbl"><caption class="sr-only">Summary statistics of the ' + esc(cur.what) + 's (' + esc(u) + ')</caption><tbody>' +
        rows.map(function(r){ return '<tr><th scope="row">' + r[0] + '</th><td class="r">' + esc(r[1]) + '</td></tr>'; }).join('') + '</tbody></table></div>' +
        '<h3 class="ls-title-l">The values, in order</h3><p class="dx-vals">' + esc(vals.slice().sort(function(a, b){ return a - b; }).map(nf).join(', ')) + ' ' + esc(u) + '</p>' +
        '<h3 class="ls-title-l">Histogram counts</h3><div class="table-wrap" tabindex="0" role="region" aria-label="Histogram bin counts"><table class="ls-tbl dx-tbl"><caption class="sr-only">Count in each bin</caption><thead><tr><th scope="col">Bin</th><th scope="col">Count</th></tr></thead><tbody>' +
        B.counts.map(function(c, j){ return '<tr><td>' + esc(nf(B.edges[j][0]) + ' to under ' + nf(B.edges[j][1])) + '</td><td class="r">' + c + '</td></tr>'; }).join('') + '</tbody></table></div>' +
        '<p class="bt-small">' + esc(cur.lead) + ' Quartiles by the rule AP® Statistics uses (the median left out of both halves when n is odd); SD with n − 1.</p>';
    }

    /* ---- dragging: pointer capture on the svg (it stays while the dots redraw) */
    var drag = null;
    function local(e){ var pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY; var m = svg.getScreenCTM(); return m ? pt.matrixTransform(m.inverse()) : pt; }
    function nearest(p){
      var best = -1, bd = 1e9;
      geo.dots.forEach(function(d){ var dd = Math.hypot(d.cx - p.x, d.cy - p.y); if(dd < bd){ bd = dd; best = d.i; } });
      return bd <= Math.max(22, geo.dots.length ? geo.dots[0].r * 2.6 : 22) ? best : -1;
    }
    svg.addEventListener('pointerdown', function(e){
      if(e.button > 0) return;
      var p = local(e), t = e.target.closest && e.target.closest('[data-i]'), i = t ? +t.getAttribute('data-i') : nearest(p);
      if(i < 0){ if(sel > -1){ sel = -1; lastMsg = ''; draw(); } return; }
      e.preventDefault();
      drag = { i: i, x0: p.x, v0: vals[i], moved: false, id: e.pointerId };
      before = X.stats(vals);
      try{ svg.setPointerCapture(e.pointerId); }catch(err){}
      sel = i; lastMsg = ''; act(); draw();
    });
    svg.addEventListener('pointermove', function(e){
      if(!drag || e.pointerId !== drag.id) return;
      var p = local(e);
      if(!drag.moved && Math.abs(p.x - drag.x0) < 3) return;
      drag.moved = true;
      var v = snap(geo.ix(p.x));
      if(v !== vals[drag.i]){ vals[drag.i] = v; draw(); }
    });
    function up(e){
      if(!drag || (e && e.pointerId !== drag.id)) return;
      var d = drag; drag = null;
      if(d.moved) settle(d.i, d.v0); else { draw(); say(spoken()); }
    }
    svg.addEventListener('pointerup', up); svg.addEventListener('pointercancel', up);
    svg.addEventListener('keydown', function(e){
      var t = e.target.closest && e.target.closest('[data-i]'); if(!t) return;
      var i = +t.getAttribute('data-i'), s = (cur.step || 1) * (e.shiftKey ? 10 : 1), v = vals[i], k = e.key;
      if(k === 'ArrowRight' || k === 'ArrowUp') v += s; else if(k === 'ArrowLeft' || k === 'ArrowDown') v -= s;
      else if(k === 'Home') v = cur.x[0]; else if(k === 'End') v = cur.x[1];
      else if(k === 'PageUp') v += s * 5; else if(k === 'PageDown') v -= s * 5;
      else if(k === 'Delete' || k === 'Backspace'){ e.preventDefault(); sel = i; $('.dx-rm').click(); return; }
      else return;
      e.preventDefault();
      var v0 = vals[i]; before = X.stats(vals); sel = i; act();
      vals[i] = snap(v); draw(); settle(i, v0);
    });
    svg.addEventListener('focusin', function(e){
      if(restoring) return;
      var t = e.target.closest && e.target.closest('[data-i]'); if(!t) return;
      var i = +t.getAttribute('data-i'); if(i === sel) return;
      sel = i; lastMsg = ''; draw();
    });
    function settle(i, v0){
      var b = before || X.stats(vals), a = X.stats(vals), u = cur.unit; before = null;
      if(vals[i] === v0){ lastMsg = ''; draw(); return; }
      var dm = a.mean - b.mean, dmd = a.med - b.med;
      var bigger = Math.abs(dm) > Math.abs(dmd) + 1e-9;
      lastMsg = '<b>' + esc(nf(v0) + ' → ' + nf(vals[i]) + ' ' + u) + ': the mean moved ' + esc(sgn(dm, 2)) + ', the median ' + esc(sgn(dmd, 2)) + '.</b> ' +
        esc(bigger ? 'The mean uses every value, so it follows; the median only cares about the middle.' : Math.abs(dmd) > 1e-9 ? 'This value crossed the middle, so the median moved too.' : 'Neither moved much: try a value at one end.') +
        (Math.abs(a.sd - b.sd) > 1e-9 || Math.abs(a.iqr - b.iqr) > 1e-9 ? ' ' + esc('SD ' + fx(b.sd, 1) + ' → ' + fx(a.sd, 1) + ', IQR ' + nf(b.iqr) + ' → ' + nf(a.iqr) + '.') : '');
      draw();
      say(plain(lastMsg));
      clearTimeout(settle.t); settle.t = setTimeout(function(){ lastMsg = ''; }, 50);
    }
    function sgn(v, d){ return Math.abs(v) < 0.5 * Math.pow(10, -d) ? '0' : (v > 0 ? '+' : '−') + M.fixed(Math.abs(v), d); }
    function plain(h){ var d = document.createElement('div'); d.innerHTML = h; return d.textContent; }
    function spoken(){ var S = X.stats(vals); if(sel < 0) return 'Mean ' + fx(S.mean, 2) + ', median ' + nf(S.med) + '.'; var v = vals[sel]; return 'Value ' + nf(v) + ' ' + cur.unit + ', z-score ' + fx((v - S.mean) / S.sd, 2) + '.'; }

    var LSsetup = null;
    function studio(pane, s){
      LS = s;
      var sp = T.studioPane(pane, s, { stage: [fig], dock: [$('.dx-ctl')], setup: 'Data', moreLabel: 'Data set and values', why: [$('.dx-say')], details: [$('.dx-nums')] });
      LSsetup = function(t){ sp.setup(t); };
      sp.setup(cur.name);
      draw();
      if(s.mode() === 'explore'){ var big = svg.querySelectorAll('.dx-dot'); s.hint({ target: big[big.length - 1] || svg, text: 'Drag a dot sideways' }); }
      if(window.ResizeObserver){ var t = null; new ResizeObserver(function(){ clearTimeout(t); t = setTimeout(draw, 40); }).observe(fig); }
    }
    draw();
    if(!window.LevlStudio && window.ResizeObserver){ var t2 = null; new ResizeObserver(function(){ clearTimeout(t2); t2 = setTimeout(draw, 60); }).observe(fig); }
    return { studio: studio };
  }

  /* ------------------------------------------------------ test yourself */
  function quiz(host, data){
    var o = { slug: 'data-explorer', noun: 'drill', types: X.TYPES, typeLabel: 'Kind of problem',
      // the values are read from the problem text, so it sits on the stage over the dots
      generate: function(r, ctx, type){ var p = X.generate(r, ctx, type); o.textOnStage = p.type !== 'describe'; return p; },
      title: function(p){ return ({ summary: 'Summary statistics', resist: 'Resistant or not?', fences: 'Outliers and the boxplot', describe: 'Describe the distribution', zscore: 'A z-score' })[p.type] || 'Practice problem'; },
      extra: function(el, p, api){ api.fig = el; api.shown = {}; figure(el, p, api.shown); },
      onStep: function(s, right, api){ var f = api.problem.figure, k = f.reveal && f.reveal[s.key]; if(k){ api.shown[k] = true; figure(api.fig, api.problem, api.shown); } }
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
      mark: f.mark, given: shown.zscale ? f.given : null, after: f.after || null, changedIndex: p.data.index,
      boxPanel: p.type !== 'zscore' && p.type !== 'resist', placeholder: 'The boxplot is drawn here as you answer.' };
    function render(){
      var box = el.querySelector('.dx-qfig') || el, rc = box.getBoundingClientRect();
      var W = Math.round(rc.width) || 520, H = Math.round(rc.height);
      if(!(H >= 180)) H = phone() ? 300 : f.hist ? 360 : 300;
      W = Math.max(280, Math.min(1200, W)); H = Math.min(H, 760);
      var g = inner(o, W, H);
      el.innerHTML = '<figure class="dx-qfig"><svg class="dx-svg" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(ariaQ(o, g.S, show)) + '">' + g.html + '</svg></figure>';
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
})();
