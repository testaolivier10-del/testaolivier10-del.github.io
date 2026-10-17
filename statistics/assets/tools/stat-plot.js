/* ApStatPlot: SVG plots for AP® Statistics (docs/apstat-architecture.md,
   "Plot spec"). Forked from AP® Calculus AB's calc-plot.js, which draws
   functions; statistics adds data plots on top (kind, below), each drawn from
   the data or distribution in its spec through ApStatDist (stat-dist.js). The same file draws graph stimuli at build time (the generator
   runs svg() through scripts/lib/apstat-mathlib.mjs) and every trainer's
   plots at run time, so a picture is always drawn from the function it
   claims to show. Needs ApStatExpr (stat-expr.js) for curves given as
   expression strings.

   Pure (no DOM, runs in node):
     svg(spec) -> '<svg class="stat-plot" role="img" aria-label=...>...</svg>'
     frame(spec) -> { x, y, w, h, sx(x), sy(y), ix(px), iy(py) }
     ticks(a, b, n) -> nice tick values; piTicks(a, b) -> multiples of pi/2
     sample(f, a, b, frame, n) -> [[x, y] runs], broken at discontinuities
     tangent(f, a) -> { point, slope }; secant(f, a, b) -> { through }
   DOM (browser):
     mount(host, spec) -> { el, frame, update(spec) }
     draggable(svgEl, frame, o) -> { set(x, y), get(), el }
       o: { x, y, label, step, onMove(x, y), constrain(x, y) -> [x, y], axis: 'x'|'y'|null }
       keyboard: arrows move by step (Shift: 10 steps), Home/End jump to the ends
     loop(step, { duration, still, onEnd }) -> { start, stop, reset, running, once, time }
       draws the end state instead of animating under reduced motion
     reduced() -> whether motion is off

   The spec (every field optional except label):
     { label: 'what the plot shows, 20+ characters', width: 360, height: 260,
       x: [-1, 5], y: [-2, 6], xStep, yStep, piX: true (x ticks at multiples of pi/2),
       xLabel: 'x', yLabel: 'y', grid: true, axes: true,
       curves: [{ fn: 'x^2 - 1' | f, domain: [a, b], cls: 's1'..'s5', dashed,
                  label: 'f', ends: ['open'|'closed'|null, 'open'|'closed'|null] }],
       shade: [{ fn, fn2 (default the x-axis), domain: [a, b], cls }],
       points: [{ at: [x, y], open: true, label, cls }],
       asymptotes: [{ x: 2 } | { y: 0 }],
       lines: [{ point: [x, y], slope } | { through: [[x1, y1], [x2, y2]] }, cls, dashed, label],
       field: { dydx: 'x - y', step: 1, len: 0.35 },
       labels: [{ at: [x, y], text, anchor: 'start'|'middle'|'end' }],
       rects: [{ x0, x1, y0, y1, cls }]   (bars, boxes; drawn under curves) }

   Statistics plots: a spec with `kind` is expanded by stats(spec) into the
   fields above, every shape computed from the data:
     { kind: 'dot', data: [..], step? }             dotplot (stacked dots)
     { kind: 'hist', data: [..], bins: { start, width }, rel? }
     { kind: 'box', data: [..] | groups: [{ name, data }] }   AP quartiles,
                                                    1.5 IQR fences, outliers as dots
     { kind: 'scatter', xs, ys, line?: true | { a, b } }   least-squares line from the data
     { kind: 'resid', xs, ys }                      residual plot of the LSRL
     { kind: 'bar', categories: [..], values: [..] }
     { kind: 'density', density: { dist: 'normal'|'t'|'chi2'|'binom', params,
                                   shade: [{ from, to }], marks: [{ at, label }] } }
   label, x, y, xLabel, yLabel work as above; x and y default to fit the data. */
(function(root){
  'use strict';
  var PAD = { l: 34, r: 14, t: 12, b: 28 };
  function E(){ return root.ApStatExpr; }
  function esc(s){ return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function r2(v){ return Math.round(v * 100) / 100; }
  function plain(s){ return root.ApStatTex ? root.ApStatTex.plain(s) : String(s); }

  function niceStep(raw){
    var p = Math.pow(10, Math.floor(Math.log10(raw))), m = raw / p;
    return (m <= 1 ? 1 : m <= 2 ? 2 : m <= 2.5 ? 2.5 : m <= 5 ? 5 : 10) * p;
  }
  function ticks(a, b, n, step){
    var s = step || niceStep((b - a) / (n || 6)), out = [];
    for(var v = Math.ceil(a / s - 1e-9) * s; v <= b + 1e-9; v += s) out.push(Math.abs(v) < s * 1e-9 ? 0 : +v.toPrecision(12));
    return out;
  }
  function piTicks(a, b){
    var out = [], h = Math.PI / 2;
    for(var k = Math.ceil(a / h - 1e-9); k * h <= b + 1e-9; k++) out.push(k * h);
    return out;
  }
  function piLabel(v){
    var k = Math.round(v / (Math.PI / 2));
    if(k === 0) return '0';
    var num = k % 2 === 0 ? k / 2 : k, den = k % 2 === 0 ? 1 : 2;
    var s = (num < 0 ? '−' : '') + (Math.abs(num) === 1 ? '' : Math.abs(num)) + 'π';
    return den === 1 ? s : s + '/2';
  }
  function fmtTick(v){ var s = String(+v.toPrecision(6)); return s.replace('-', '−'); }

  function frame(spec){
    var w = spec.width || 360, h = spec.height || 260;
    var x = spec.x || [-5, 5], y = spec.y || [-5, 5];
    var iw = w - PAD.l - PAD.r, ih = h - PAD.t - PAD.b;
    var f = {
      x: x, y: y, w: w, h: h, pad: PAD,
      sx: function(v){ return PAD.l + (v - x[0]) / (x[1] - x[0]) * iw; },
      sy: function(v){ return PAD.t + (y[1] - v) / (y[1] - y[0]) * ih; },
      ix: function(px){ return x[0] + (px - PAD.l) / iw * (x[1] - x[0]); },
      iy: function(py){ return y[1] - (py - PAD.t) / ih * (y[1] - y[0]); }
    };
    return f;
  }
  function toFn(fn, vars){
    if(typeof fn === 'function') return fn;
    return E().fn(String(fn), vars);
  }

  /* Runs of [x, y] points inside the view. A run breaks where f is not a
     finite number, and at a jump: where two neighbors differ by a visible
     amount, the gap is halved again and again toward the larger change; a
     continuous curve, however steep, closes the gap, a jump or an asymptote
     does not. Where a run leaves the view it ends on the edge. */
  function jumpBetween(f, x0, y0, x1, y1, span){
    for(var k = 0; k < 24; k++){
      var xm = (x0 + x1) / 2, ym = f(xm);
      if(!isFinite(ym)) return true;
      if(Math.abs(ym - y0) >= Math.abs(y1 - ym)){ x1 = xm; y1 = ym; } else { x0 = xm; y0 = ym; }
    }
    return Math.abs(y1 - y0) > span * 1e-3;
  }
  function sample(f, a, b, F, n){
    n = n || 360;
    var lo = F.y[0], hi = F.y[1], span = hi - lo, out = [], run = [], prev = null;
    function edge(p, q){
      var yb = q[1] > hi ? hi : lo, t = (yb - p[1]) / (q[1] - p[1]);
      return [p[0] + t * (q[0] - p[0]), yb];
    }
    function inside(p){ return p[1] >= lo && p[1] <= hi; }
    function end(){ if(run.length > 1) out.push(run); run = []; }
    for(var i = 0; i <= n; i++){
      var x = a + (b - a) * i / n, y = f(x), p = [x, y];
      if(!isFinite(y)){ end(); prev = null; continue; }
      if(prev){
        if(Math.abs(y - prev[1]) > span * 0.02 && jumpBetween(f, prev[0], prev[1], x, y, span)){ end(); prev = p; if(inside(p)) run.push(p); continue; }
        if(inside(prev) && !inside(p)){ run.push(edge(prev, p)); end(); }
        else if(!inside(prev) && inside(p)){ run.push(edge(p, prev)); run.push(p); }
        else if(inside(p)) run.push(p);
        else if((prev[1] - hi) * (p[1] - hi) < 0 || (prev[1] - lo) * (p[1] - lo) < 0){ run.push(edge(prev, p)); run.push(edge(p, prev)); end(); }
      } else if(inside(p)) run.push(p);
      prev = p;
    }
    end();
    return out;
  }
  function pathOf(runs, F){
    return runs.map(function(r){ return 'M' + r.map(function(p){ return r2(F.sx(p[0])) + ' ' + r2(F.sy(p[1])); }).join('L'); }).join('');
  }
  function deriv(f, a){ var h = 1e-4 * Math.max(1, Math.abs(a)); return (f(a + h) - f(a - h)) / (2 * h); }
  function tangent(f, a){ f = toFn(f); return { point: [a, f(a)], slope: deriv(f, a) }; }
  function secant(f, a, b){ f = toFn(f); return { through: [[a, f(a)], [b, f(b)]] }; }

  function lineEnds(l, F){
    var p, m;
    if(l.through){ p = l.through[0]; var q = l.through[1]; if(q[0] === p[0]) return [[p[0], F.y[0]], [p[0], F.y[1]]]; m = (q[1] - p[1]) / (q[0] - p[0]); }
    else { p = l.point; m = l.slope; }
    if(!isFinite(m)) return [[p[0], F.y[0]], [p[0], F.y[1]]];
    var a = l.domain ? l.domain[0] : F.x[0], b = l.domain ? l.domain[1] : F.x[1];
    var g = function(x){ return p[1] + m * (x - p[0]); };
    var runs = sample(g, a, b, F, 2);
    return runs.length ? [runs[0][0], runs[0][runs[0].length - 1]] : null;
  }

  function svg(spec){
    if(!spec || String(spec.label || '').trim().length < 20) throw new Error('ApStatPlot.svg: a plot needs a label of 20+ characters (what it shows, for screen readers).');
    spec = expand(spec);
    var F = frame(spec), out = [], x0 = F.x[0], x1 = F.x[1], y0 = F.y[0], y1 = F.y[1];
    var L = PAD.l, R = F.w - PAD.r, T = PAD.t, B = F.h - PAD.b;
    var xt = spec.xTicks === false ? [] : spec.piX ? piTicks(x0, x1) : ticks(x0, x1, 7, spec.xStep), yt = spec.yTicks === false ? [] : spec.yTickList ? spec.yTickList.map(function(t){ return t.v; }) : ticks(y0, y1, 6, spec.yStep);
    var yText = function(v){ var t = spec.yTickList && spec.yTickList.filter(function(u){ return u.v === v; })[0]; return t ? String(t.text) : fmtTick(v); };
    var extraH = 0;
    // Grid
    if(spec.grid !== false){
      out.push('<g class="stat-plot-grid">' + xt.map(function(v){ return '<line x1="' + r2(F.sx(v)) + '" y1="' + T + '" x2="' + r2(F.sx(v)) + '" y2="' + B + '"/>'; }).join('') +
        yt.map(function(v){ return '<line x1="' + L + '" y1="' + r2(F.sy(v)) + '" x2="' + R + '" y2="' + r2(F.sy(v)) + '"/>'; }).join('') + '</g>');
    }
    // Shaded regions, under everything else
    (spec.shade || []).forEach(function(s){
      var f = toFn(s.fn), g = s.fn2 != null ? toFn(s.fn2) : function(){ return 0; }, a = s.domain[0], b = s.domain[1], n = 160, top = [], bot = [];
      for(var i = 0; i <= n; i++){
        var x = a + (b - a) * i / n, fy = f(x), gy = g(x);
        if(!isFinite(fy) || !isFinite(gy)) continue;
        top.push([x, Math.max(y0, Math.min(y1, fy))]); bot.push([x, Math.max(y0, Math.min(y1, gy))]);
      }
      if(top.length < 2) return;
      var pts = top.concat(bot.reverse()).map(function(p){ return r2(F.sx(p[0])) + ',' + r2(F.sy(p[1])); }).join(' ');
      out.push('<polygon class="stat-plot-shade' + (s.cls ? ' ' + esc(s.cls) : '') + '" points="' + pts + '"/>');
    });
    out.push(rectsSvg(spec, F));
    // Axes, ticks, labels
    if(spec.axes !== false){
      var ax = !spec.bottomAxis && y0 <= 0 && y1 >= 0 ? F.sy(0) : B, ay = spec.leftAxis || !(x0 <= 0 && x1 >= 0) ? L : F.sx(0);
      out.push('<g class="stat-plot-axis"><line x1="' + L + '" y1="' + r2(ax) + '" x2="' + R + '" y2="' + r2(ax) + '"/><line x1="' + r2(ay) + '" y1="' + T + '" x2="' + r2(ay) + '" y2="' + B + '"/>' +
        xt.filter(function(v){ return Math.abs(v) > 1e-12 || ay === L; }).map(function(v){ var px = r2(F.sx(v)); return '<line x1="' + px + '" y1="' + r2(ax - 3) + '" x2="' + px + '" y2="' + r2(ax + 3) + '"/>'; }).join('') +
        yt.filter(function(v){ return Math.abs(v) > 1e-12 || ax === B; }).map(function(v){ var py = r2(F.sy(v)); return '<line x1="' + r2(ay - 3) + '" y1="' + py + '" x2="' + r2(ay + 3) + '" y2="' + py + '"/>'; }).join('') + '</g>');
      var lab = [];
      xt.forEach(function(v){ if(Math.abs(v) < 1e-12 && ay !== L) return; lab.push('<text x="' + r2(F.sx(v)) + '" y="' + r2(Math.min(F.h - 4, ax + 15)) + '" text-anchor="middle">' + (spec.piX ? piLabel(v) : fmtTick(v)) + '</text>'); });
      yt.forEach(function(v){ if(Math.abs(v) < 1e-12 && ax !== B) return; lab.push('<text x="' + r2(Math.max(10, ay - 6)) + '" y="' + r2(F.sy(v) + 4) + '" text-anchor="end">' + yText(v) + '</text>'); });
      // The x-axis name sits under the tick labels, centered, when the axis is
      // the bottom edge (every data plot), so it never covers the data; the
      // picture grows by one line for it. Inside the plot only when the axis
      // runs through it (a function plot through y = 0).
      if(spec.xLabel && ax === B){ extraH = 16; lab.push('<text class="stat-plot-axlabel" x="' + r2((L + R) / 2) + '" y="' + r2(B + 31) + '" text-anchor="middle">' + esc(plain(spec.xLabel)) + '</text>'); }
      else if(spec.xLabel) lab.push('<text class="stat-plot-axlabel" x="' + (R - 2) + '" y="' + r2(Math.max(T + 10, ax - 6)) + '" text-anchor="end">' + esc(plain(spec.xLabel)) + '</text>');
      if(spec.yLabel) lab.push('<text class="stat-plot-axlabel" x="' + r2(ay + 6) + '" y="' + (T + 10) + '" text-anchor="start">' + esc(plain(spec.yLabel)) + '</text>');
      out.push('<g class="stat-plot-ticks">' + lab.join('') + '</g>');
    }
    (spec.asymptotes || []).forEach(function(a){
      if(a.x != null) out.push('<line class="stat-plot-asym" x1="' + r2(F.sx(a.x)) + '" y1="' + T + '" x2="' + r2(F.sx(a.x)) + '" y2="' + B + '"/>');
      else out.push('<line class="stat-plot-asym" x1="' + L + '" y1="' + r2(F.sy(a.y)) + '" x2="' + R + '" y2="' + r2(F.sy(a.y)) + '"/>');
    });
    // Slope field
    if(spec.field){
      var fd = spec.field, g2 = toFn(fd.dydx, ['x', 'y']), st = fd.step || 1, segs = [];
      var kx = (F.sx(x1) - F.sx(x0)) / (x1 - x0), ky = (F.sy(y0) - F.sy(y1)) / (y1 - y0), half = (fd.len || 0.35) * st * kx;
      ticks(x0, x1, 0, st).forEach(function(x){
        ticks(y0, y1, 0, st).forEach(function(y){
          var m = g2({ x: x, y: y });
          if(!isFinite(m)) return;
          // The same length on screen for every segment, whatever its slope.
          var vx = 1, vy = m * ky / kx, n = Math.sqrt(vx * vx + vy * vy), cx = F.sx(x), cy = F.sy(y);
          vx = vx / n * half; vy = vy / n * half;
          segs.push('<line x1="' + r2(cx - vx) + '" y1="' + r2(cy + vy) + '" x2="' + r2(cx + vx) + '" y2="' + r2(cy - vy) + '"/>');
        });
      });
      out.push('<g class="stat-plot-field">' + segs.join('') + '</g>');
    }
    (spec.lines || []).forEach(function(l){
      var e = l.seg ? l.through : lineEnds(l, F);
      if(!e) return;
      out.push('<line class="stat-plot-line ' + esc(l.cls || 's2') + (l.dashed ? ' is-dashed' : '') + '" x1="' + r2(F.sx(e[0][0])) + '" y1="' + r2(F.sy(e[0][1])) + '" x2="' + r2(F.sx(e[1][0])) + '" y2="' + r2(F.sy(e[1][1])) + '"/>');
      if(l.label) out.push('<text class="stat-plot-label" x="' + r2(F.sx(e[1][0]) - 4) + '" y="' + r2(F.sy(e[1][1]) - 6) + '" text-anchor="end">' + esc(plain(l.label)) + '</text>');
    });
    var dots = [];
    (spec.curves || []).forEach(function(c, i){
      var f = toFn(c.fn), d = c.domain || F.x, runs = sample(f, Math.max(d[0], x0), Math.min(d[1], x1), F, c.samples);
      out.push('<path class="stat-plot-curve ' + esc(c.cls || 's' + (i % 5 + 1)) + (c.dashed ? ' is-dashed' : '') + '" d="' + pathOf(runs, F) + '"/>');
      (c.ends || []).forEach(function(kind, j){
        if(!kind) return;
        var x = d[j], y = f(x);
        if(!isFinite(y)){ var h = (d[1] - d[0]) * 1e-7 * (j ? -1 : 1); y = f(x + h); }
        if(isFinite(y)) dots.push({ at: [x, y], open: kind === 'open', cls: c.cls || 's' + (i % 5 + 1) });
      });
      if(c.label && runs.length){
        var lr = runs[runs.length - 1], lp = lr[lr.length - 1];
        out.push('<text class="stat-plot-label ' + esc(c.cls || 's' + (i % 5 + 1)) + '" x="' + r2(Math.min(R - 2, F.sx(lp[0]) + 4)) + '" y="' + r2(Math.max(T + 10, F.sy(lp[1]) - 4)) + '" text-anchor="' + (F.sx(lp[0]) > R - 30 ? 'end' : 'start') + '">' + esc(plain(c.label)) + '</text>');
      }
    });
    dots = dots.concat(spec.points || []);
    dots.forEach(function(p){
      if(p.at[0] < x0 || p.at[0] > x1 || p.at[1] < y0 || p.at[1] > y1) return;
      out.push('<circle class="stat-plot-pt ' + esc(p.cls || 's1') + (p.open ? ' is-open' : '') + '" cx="' + r2(F.sx(p.at[0])) + '" cy="' + r2(F.sy(p.at[1])) + '" r="4"/>');
      if(p.label) out.push('<text class="stat-plot-label" x="' + r2(F.sx(p.at[0]) + 7) + '" y="' + r2(F.sy(p.at[1]) - 7) + '">' + esc(plain(p.label)) + '</text>');
    });
    (spec.labels || []).forEach(function(t){
      out.push('<text class="stat-plot-label" x="' + r2(F.sx(t.at[0])) + '" y="' + r2(F.sy(t.at[1])) + '" text-anchor="' + (t.anchor || 'middle') + '">' + esc(plain(t.text)) + '</text>');
    });
    return '<svg class="stat-plot" viewBox="0 0 ' + F.w + ' ' + (F.h + extraH) + '" width="' + F.w + '" height="' + (F.h + extraH) + '" role="img" aria-label="' + esc(plain(spec.label)) + '">' + out.join('') + '</svg>';
  }

  /* ---------------------------------------------------------- statistics */
  function D(){ return root.ApStatDist; }
  function pad(a, b, f){ var d = (b - a) || Math.abs(a) || 1; return [a - d * f, b + d * f]; }
  function nice(a, b){ var st = niceStep((b - a) / 6); return [Math.floor(a / st) * st, Math.ceil(b / st) * st]; }
  function expand(spec){
    if(!spec.kind) return spec;
    var o = {}, k;
    for(k in spec) o[k] = spec[k];
    // Data plots put the count or density axis at the left edge, not at x = 0,
    // and the x axis at the bottom edge: a residual plot keeps y = 0 as a
    // dashed line among the points, with its tick labels below the plot.
    o.leftAxis = true; o.bottomAxis = true;
    o.rects = (spec.rects || []).slice(); o.points = (spec.points || []).slice(); o.lines = (spec.lines || []).slice();
    o.curves = (spec.curves || []).slice(); o.shade = (spec.shade || []).slice(); o.labels = (spec.labels || []).slice();
    var Dd = D(), lo, hi, i;
    if(spec.kind === 'dot'){
      var xs = spec.data.slice().sort(function(a, b){ return a - b; }), st0 = spec.step || 0, counts = {}, mx = 1;
      lo = xs[0]; hi = xs[xs.length - 1];
      o.x = spec.x || nice(pad(lo, hi, 0.05)[0], pad(lo, hi, 0.05)[1]);
      xs.forEach(function(v){ var key = st0 ? Math.round(v / st0) * st0 : v; counts[key] = (counts[key] || 0) + 1; if(counts[key] > mx) mx = counts[key];
        o.points.push({ at: [+key, counts[key] - 0.5], cls: spec.cls || 's1' }); });
      o.y = spec.y || [0, Math.max(4, mx + 0.5)]; o.grid = spec.grid === true;
      // Count labels at the middle of each row of dots (dot k sits at k - 0.5),
      // never between rows.
      var ys = spec.yStep || Math.max(1, Math.ceil(mx / 5)), yl = [];
      for(var kk = ys; kk - 0.5 <= o.y[1]; kk += ys) yl.push({ v: kk - 0.5, text: kk });
      o.yTickList = yl;
    } else if(spec.kind === 'hist'){
      var b = spec.bins, n = spec.data.length, counts2 = [], top = 0;
      lo = Math.min.apply(null, spec.data); hi = Math.max.apply(null, spec.data);
      var start = b && b.start != null ? b.start : Math.floor(lo), w = b && b.width ? b.width : niceStep((hi - lo) / 8);
      var nb = Math.max(1, Math.floor((hi - start) / w) + 1);
      for(i = 0; i < nb; i++) counts2.push(0);
      spec.data.forEach(function(v){ var j = Math.floor((v - start) / w + 1e-9); if(j >= 0 && j < nb) counts2[j]++; });
      counts2.forEach(function(c, j){ var hgt = spec.rel ? c / n : c; if(hgt > top) top = hgt;
        if(c) o.rects.push({ x0: start + j * w, x1: start + (j + 1) * w, y0: 0, y1: hgt, cls: spec.cls || 's1' }); });
      o.x = spec.x || [start, start + nb * w]; o.y = spec.y || [0, top * 1.12 || 1]; o.xStep = o.xStep || w; o.bins = { start: start, width: w, counts: counts2 };
    } else if(spec.kind === 'box'){
      var groups = spec.groups || [{ name: '', data: spec.data }], all = [];
      groups.forEach(function(g){ all = all.concat(g.data); });
      lo = Math.min.apply(null, all); hi = Math.max.apply(null, all);
      o.x = spec.x || nice(pad(lo, hi, 0.05)[0], pad(lo, hi, 0.05)[1]); o.y = [0, groups.length * 2]; o.yTicks = false; o.grid = false;
      groups.forEach(function(g, gi){
        var S = Dd.summary(g.data), c = groups.length * 2 - 1 - gi * 2, inl = g.data.filter(function(v){ return v >= S.fences[0] && v <= S.fences[1]; });
        var wl = Math.min.apply(null, inl), wh = Math.max.apply(null, inl);
        o.rects.push({ x0: S.q1, x1: S.q3, y0: c - 0.5, y1: c + 0.5, cls: (spec.cls || 's1') + ' is-box' });
        o.lines.push({ through: [[S.med, c - 0.5], [S.med, c + 0.5]], cls: spec.cls || 's1', seg: true });
        o.lines.push({ through: [[wl, c], [S.q1, c]], cls: spec.cls || 's1', seg: true });
        o.lines.push({ through: [[S.q3, c], [wh, c]], cls: spec.cls || 's1', seg: true });
        S.outliers.forEach(function(v){ o.points.push({ at: [v, c], cls: spec.cls || 's1', open: true }); });
        if(g.name) o.labels.push({ at: [o.x[0], c + 0.75], text: g.name, anchor: 'start' });
      });
    } else if(spec.kind === 'scatter' || spec.kind === 'resid'){
      var L2 = Dd.lsrl(spec.xs, spec.ys), X = spec.xs, Y = spec.kind === 'resid' ? L2.residuals : spec.ys;
      lo = Math.min.apply(null, X); hi = Math.max.apply(null, X);
      var ylo = Math.min.apply(null, Y), yhi = Math.max.apply(null, Y);
      if(spec.kind === 'resid'){ var m = Math.max(Math.abs(ylo), Math.abs(yhi)); ylo = -m; yhi = m; }
      o.x = spec.x || nice(pad(lo, hi, 0.05)[0], pad(lo, hi, 0.05)[1]); o.y = spec.y || nice(pad(ylo, yhi, 0.08)[0], pad(ylo, yhi, 0.08)[1]);
      X.forEach(function(x, j){ o.points.push({ at: [x, Y[j]], cls: spec.cls || 's1' }); });
      if(spec.kind === 'resid') o.lines.push({ point: [0, 0], slope: 0, cls: 's2', dashed: true });
      else if(spec.line){ var ab = spec.line === true ? L2 : spec.line; o.lines.push({ point: [0, ab.a], slope: ab.b, cls: 's2' }); }
      o.fit = { a: L2.a, b: L2.b, r: L2.r, r2: L2.r2, s: L2.s };
    } else if(spec.kind === 'bar'){
      var cats = spec.categories, vals = spec.values, mxv = Math.max.apply(null, vals);
      o.x = [0, cats.length]; o.y = spec.y || [0, mxv * 1.12]; o.xTicks = false;
      cats.forEach(function(c, j){ o.rects.push({ x0: j + 0.15, x1: j + 0.85, y0: 0, y1: vals[j], cls: spec.cls || 's1' });
        o.labels.push({ at: [j + 0.5, o.y[0] - (o.y[1] - o.y[0]) * 0.07], text: c }); });
    } else if(spec.kind === 'density'){
      var dn = spec.density, P = dn.params || {}, dist = dn.dist, f, a0, b0;
      if(dist === 'normal'){ var mu = P.mean || 0, sd = P.sd || 1; f = function(x){ return Dd.normPdf(x, mu, sd); }; a0 = mu - 3.6 * sd; b0 = mu + 3.6 * sd; }
      else if(dist === 't'){ f = function(x){ return Dd.tPdf(x, P.df); }; a0 = -4.2; b0 = 4.2; }
      else if(dist === 'chi2'){ f = function(x){ return Dd.chi2Pdf(x, P.df); }; a0 = 0; b0 = Math.max(8, P.df + 4 * Math.sqrt(2 * P.df)); }
      else if(dist === 'binom'){
        var nn = P.n, pp = P.p, top2 = 0;
        for(i = 0; i <= nn; i++){ var pm = Dd.binomPmf(i, nn, pp); if(pm > top2) top2 = pm;
          var inS = (dn.shade || []).some(function(r){ return i >= r.from && i <= r.to; });
          o.rects.push({ x0: i - 0.45, x1: i + 0.45, y0: 0, y1: pm, cls: inS ? 's1 is-shaded' : 's1' }); }
        o.x = spec.x || [-0.5, nn + 0.5]; o.y = spec.y || [0, top2 * 1.15];
      }
      if(f){
        o.x = spec.x || [a0, b0];
        var peak = 0; for(i = 0; i <= 200; i++){ var v = f(o.x[0] + (o.x[1] - o.x[0]) * i / 200); if(isFinite(v) && v > peak) peak = v; }
        o.y = spec.y || [0, Math.min(peak, dist === 'chi2' && P.df < 3 ? 0.6 : peak) * 1.15];
        o.curves.push({ fn: f, cls: spec.cls || 's1' });
        (dn.shade || []).forEach(function(r){ o.shade.push({ fn: f, domain: [Math.max(o.x[0], r.from), Math.min(o.x[1], r.to)], cls: 's1' }); });
      }
      (dn.marks || []).forEach(function(m){ o.lines.push({ through: [[m.at, 0], [m.at, o.y[1] * 0.92]], cls: 's2', dashed: true, seg: true, label: m.label }); });
      o.yTicks = false; o.grid = false;
    } else throw new Error('ApStatPlot: unknown plot kind "' + spec.kind + '"');
    return o;
  }
  function rectsSvg(o, F){
    return (o.rects || []).map(function(r){
      var x = F.sx(Math.min(r.x0, r.x1)), y = F.sy(Math.max(r.y0, r.y1));
      return '<rect class="stat-plot-bar ' + esc(r.cls || 's1') + '" x="' + r2(x) + '" y="' + r2(y) + '" width="' + r2(Math.abs(F.sx(r.x1) - F.sx(r.x0))) + '" height="' + r2(Math.abs(F.sy(r.y0) - F.sy(r.y1))) + '"/>';
    }).join('');
  }

  /* ---------------------------------------------------------- DOM */
  function reduced(){
    try{
      if(root.LevlMotion && root.LevlMotion.reduced) return !!root.LevlMotion.reduced();
      return !!(root.matchMedia && root.matchMedia('(prefers-reduced-motion: reduce)').matches);
    }catch(e){ return false; }
  }
  function loop(step, o){
    o = o || {};
    var raf = null, last = 0, t = 0, on = false;
    var req = root.requestAnimationFrame || function(f){ return setTimeout(function(){ f(Date.now()); }, 16); };
    var cancel = root.cancelAnimationFrame || clearTimeout;
    function tick(now){
      if(!on) return;
      var dt = last ? Math.min(0.05, (now - last) / 1000) : 0;
      last = now; t += dt;
      if(step(dt, t) === false || (o.duration && t >= o.duration)){ on = false; raf = null; if(o.onEnd) o.onEnd(t); return; }
      raf = req(tick);
    }
    return {
      start: function(){
        if(on) return;
        if(reduced()){ if(o.still) o.still(o.duration || t); else step(o.duration || 0, o.duration || t); if(o.onEnd) o.onEnd(o.duration || t); return; }
        on = true; last = 0; raf = req(tick);
      },
      stop: function(){ on = false; if(raf != null) cancel(raf); raf = null; },
      reset: function(){ this.stop(); t = 0; },
      running: function(){ return on; },
      once: function(dt){ t += dt; step(dt, t); },
      time: function(){ return t; }
    };
  }
  function mount(host, spec){
    host.innerHTML = svg(spec);
    var api = { el: host.firstChild, frame: frame(spec), spec: spec };
    api.update = function(next){ api.spec = next; host.innerHTML = svg(next); api.el = host.firstChild; api.frame = frame(next); return api; };
    return api;
  }
  var NS = 'http://www.w3.org/2000/svg';
  function draggable(svgEl, F, o){
    o = o || {};
    var x = o.x || 0, y = o.y || 0, step = o.step || (F.x[1] - F.x[0]) / 100;
    // A picture that holds a slider is a group, not an image (an img role
    // may not have focusable children: axe nested-interactive).
    if(svgEl.getAttribute('role') === 'img') svgEl.setAttribute('role', 'group');
    var g = document.createElementNS(NS, 'g');
    g.setAttribute('class', 'stat-plot-handle');
    g.setAttribute('tabindex', '0');
    g.setAttribute('role', 'slider');
    g.setAttribute('aria-label', o.label || 'Point');
    var halo = document.createElementNS(NS, 'circle'); halo.setAttribute('r', '16'); halo.setAttribute('class', 'stat-plot-halo');
    var dot = document.createElementNS(NS, 'circle'); dot.setAttribute('r', '7');
    g.appendChild(halo); g.appendChild(dot); svgEl.appendChild(g);
    function fmt(v){ return String(+v.toFixed(3)); }
    function set(nx, ny, quiet){
      var c = o.constrain ? o.constrain(nx, ny) : [nx, ny];
      x = Math.max(F.x[0], Math.min(F.x[1], c[0])); y = c[1];
      g.setAttribute('transform', 'translate(' + r2(F.sx(x)) + ' ' + r2(F.sy(y)) + ')');
      g.setAttribute('aria-valuenow', fmt(o.axis === 'y' ? y : x));
      g.setAttribute('aria-valuetext', 'x = ' + fmt(x) + ', y = ' + fmt(y));
      if(!quiet && o.onMove) o.onMove(x, y);
    }
    g.setAttribute('aria-valuemin', fmt(F.x[0])); g.setAttribute('aria-valuemax', fmt(F.x[1]));
    function local(e){
      var pt = svgEl.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY;
      var m = svgEl.getScreenCTM();
      var p = m ? pt.matrixTransform(m.inverse()) : pt;
      return [F.ix(p.x), F.iy(p.y)];
    }
    var dragging = false;
    g.addEventListener('pointerdown', function(e){ dragging = true; try{ g.setPointerCapture(e.pointerId); }catch(err){} g.classList.add('is-drag'); e.preventDefault(); });
    g.addEventListener('pointermove', function(e){ if(!dragging) return; var p = local(e); set(o.axis === 'y' ? x : p[0], o.axis === 'x' ? y : p[1]); });
    function up(){ dragging = false; g.classList.remove('is-drag'); if(o.onEnd) o.onEnd(x, y); }
    g.addEventListener('pointerup', up); g.addEventListener('pointercancel', up);
    g.addEventListener('keydown', function(e){
      var k = e.key, s = step * (e.shiftKey ? 10 : 1), nx = x, ny = y;
      if(k === 'ArrowRight') nx += s; else if(k === 'ArrowLeft') nx -= s;
      else if(k === 'ArrowUp') { if(o.axis === 'y') ny += s; else nx += s; }
      else if(k === 'ArrowDown') { if(o.axis === 'y') ny -= s; else nx -= s; }
      else if(k === 'Home') nx = F.x[0]; else if(k === 'End') nx = F.x[1];
      else return;
      e.preventDefault(); set(nx, ny);
    });
    set(x, y, true);
    return { el: g, set: set, get: function(){ return [x, y]; } };
  }

  root.ApStatPlot = { expand: expand, svg: svg, frame: frame, ticks: ticks, piTicks: piTicks, sample: sample, tangent: tangent, secant: secant,
    mount: mount, draggable: draggable, loop: loop, reduced: reduced, deriv: deriv };
})(typeof window !== 'undefined' ? window : globalThis);
