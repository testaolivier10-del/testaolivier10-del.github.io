/* ApEnvPlot: SVG plots for AP® Environmental Science (docs/apenv-architecture.md,
   "Plot spec"). Forked from AP® Statistics' stat-plot.js (itself AP®
   Calculus AB's calc-plot.js, which draws functions); environmental science
   replaces the statistics plots with the data figures the exam uses (kind,
   below), each drawn from the numbers in its spec. The same file draws graph
   stimuli at build time (the generator runs svg() through
   scripts/lib/apenv-mathlib.mjs) and every trainer's plots at run time, so a
   figure is always drawn from the data it claims to show. Needs ApEnvExpr
   (env-expr.js) for curves given as expression strings.

   Pure (no DOM, runs in node):
     svg(spec) -> '<svg class="env-plot" role="img" aria-label=...>...</svg>'
     expand(spec) -> the spec with its data kinds turned into shapes
     frame(spec) -> { x, y, w, h, sx(x), sy(y), ix(px), iy(py) }
     ticks(a, b, n) -> nice tick values
     sample(f, a, b, frame, n) -> [[x, y] runs], broken at discontinuities
   DOM (browser):
     mount(host, spec) -> { el, frame, update(spec) }
     draggable(svgEl, frame, o) -> { set(x, y), get(), el }
     loop(step, { duration, still, onEnd }); reduced()

   The spec (every field optional except label):
     { label: 'what the plot shows, 20+ characters', width: 360, height: 260,
       x: [a, b], y: [c, d], xStep, yStep, xLabel, yLabel, grid, axes,
       curves: [{ fn: 'expression' | f, domain, cls, dashed, label }],
       shade, points: [{ at: [x, y], open, label, cls }], lines, labels, rects }

   Data figures: a spec with `kind` is expanded by expand(spec), every shape
   computed from the data:
     { kind: 'line', series: [{ name, points: [[x, y], ...], cls?, dashed? }] }
     { kind: 'bar', categories: [..], values: [..] | series: [{ name, values }] }
     { kind: 'scatter', points: [[x, y], ...], trend?: true }   least-squares line
     { kind: 'dual', series: [{ name, points, axis: 'left'|'right' }], yRight: [c, d], yRightLabel }
                                       two y axes (CO2 and temperature on one x)
     { kind: 'pyramid', groups: [labels], left: [..], right: [..], leftLabel, rightLabel }
                                       a population pyramid (male left, female right)
     { kind: 'curve', points: [[x, y], ...], mark: { y: 50, label: 'LD50' } | { x }, smooth? }
                                       a curve through measured points with a
                                       marked point read off it (the dose at 50%
                                       response, by linear interpolation as
                                       ApEnvCalc.doseAt) and dashed guides
   label, x, y, xLabel, yLabel work as above; x and y default to fit the data. */
(function(root){
  'use strict';
  var BASEPAD = { l: 38, r: 14, t: 12, b: 28 }, PAD = BASEPAD;
  function E(){ return root.ApEnvExpr; }
  function esc(s){ return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function r2(v){ return Math.round(v * 100) / 100; }
  function plain(s){ return root.ApEnvTex ? root.ApEnvTex.plain(s) : String(s); }

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

  /* Text width estimate at the plot's 11 px bold UI font (an average glyph
     is about 6.4 px; generous, so estimates never undershoot by much). */
  function textW(s){ return String(plain(s == null ? '' : s)).length * 6.4; }
  /* A dual-axis plot names its two axes in a band above the plot: left name
     at the left, right name at the right, on one line when both fit with a
     gap, else on two lines (left first). Nothing is drawn inside the plot
     area, so the names can never cover the data or each other. */
  function dualHead(spec, w){
    if(!spec.rightAxis) return null;
    var a = spec.yLabel || '', b = spec.rightAxis.label || '';
    var one = !a || !b || textW(a) + textW(b) + 24 <= w - 8;
    return { one: one, band: (one ? 1 : 2) * 16 + 6 };
  }
  function frame(spec){
    var w = spec.width || 360, h = spec.height || 260;
    var dh = dualHead(spec, w);
    var PAD = spec.rightAxis ? { l: BASEPAD.l, r: 40, t: BASEPAD.t + dh.band, b: BASEPAD.b } : BASEPAD;
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
    if(!spec || String(spec.label || '').trim().length < 20) throw new Error('ApEnvPlot.svg: a plot needs a label of 20+ characters (what it shows, for screen readers).');
    spec = expand(spec);
    var F = frame(spec), out = [], x0 = F.x[0], x1 = F.x[1], y0 = F.y[0], y1 = F.y[1];
    var L = F.pad.l, R = F.w - F.pad.r, T = F.pad.t, B = F.h - F.pad.b;
    var xt = spec.xTicks === false ? [] : spec.piX ? piTicks(x0, x1) : ticks(x0, x1, 7, spec.xStep), yt = spec.yTicks === false ? [] : spec.yTickList ? spec.yTickList.map(function(t){ return t.v; }) : ticks(y0, y1, 6, spec.yStep);
    var yText = function(v){ var t = spec.yTickList && spec.yTickList.filter(function(u){ return u.v === v; })[0]; return t ? String(t.text) : fmtTick(v); };
    var extraH = 0;
    // Grid
    if(spec.grid !== false){
      out.push('<g class="env-plot-grid">' + xt.map(function(v){ return '<line x1="' + r2(F.sx(v)) + '" y1="' + T + '" x2="' + r2(F.sx(v)) + '" y2="' + B + '"/>'; }).join('') +
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
      out.push('<polygon class="env-plot-shade' + (s.cls ? ' ' + esc(s.cls) : '') + '" points="' + pts + '"/>');
    });
    out.push(rectsSvg(spec, F));
    // Axes, ticks, labels
    if(spec.axes !== false){
      var ax = !spec.bottomAxis && y0 <= 0 && y1 >= 0 ? F.sy(0) : B, ay = spec.leftAxis || !(x0 <= 0 && x1 >= 0) ? L : F.sx(0);
      out.push('<g class="env-plot-axis"><line x1="' + L + '" y1="' + r2(ax) + '" x2="' + R + '" y2="' + r2(ax) + '"/><line x1="' + r2(ay) + '" y1="' + T + '" x2="' + r2(ay) + '" y2="' + B + '"/>' +
        xt.filter(function(v){ return Math.abs(v) > 1e-12 || ay === L; }).map(function(v){ var px = r2(F.sx(v)); return '<line x1="' + px + '" y1="' + r2(ax - 3) + '" x2="' + px + '" y2="' + r2(ax + 3) + '"/>'; }).join('') +
        yt.filter(function(v){ return Math.abs(v) > 1e-12 || ax === B; }).map(function(v){ var py = r2(F.sy(v)); return '<line x1="' + r2(ay - 3) + '" y1="' + py + '" x2="' + r2(ay + 3) + '" y2="' + py + '"/>'; }).join('') + '</g>');
      var lab = [];
      xt.forEach(function(v){ if(Math.abs(v) < 1e-12 && ay !== L && !spec.centerAxis) return; lab.push('<text x="' + r2(F.sx(v)) + '" y="' + r2(Math.min(F.h - 4, ax + 15)) + '" text-anchor="middle">' + (spec.piX ? piLabel(v) : fmtTick(spec.absX ? Math.abs(v) : v)) + '</text>'); });
      yt.forEach(function(v){ if(Math.abs(v) < 1e-12 && ax !== B) return; lab.push('<text x="' + r2(Math.max(10, ay - 6)) + '" y="' + r2(F.sy(v) + 4) + '" text-anchor="end">' + yText(v) + '</text>'); });
      // The x-axis name sits under the tick labels, centered, when the axis is
      // the bottom edge (every data plot), so it never covers the data; the
      // picture grows by one line for it. Inside the plot only when the axis
      // runs through it (a function plot through y = 0).
      if(spec.xLabel && ax === B){ extraH = 16; lab.push('<text class="env-plot-axlabel" x="' + r2((L + R) / 2) + '" y="' + r2(B + 31) + '" text-anchor="middle">' + esc(plain(spec.xLabel)) + '</text>'); }
      else if(spec.xLabel) lab.push('<text class="env-plot-axlabel" x="' + (R - 2) + '" y="' + r2(Math.max(T + 10, ax - 6)) + '" text-anchor="end">' + esc(plain(spec.xLabel)) + '</text>');
      if(spec.yLabel && spec.rightAxis) lab.push('<text class="env-plot-axlabel" x="4" y="14" text-anchor="start">' + esc(plain(spec.yLabel)) + '</text>');
      else if(spec.yLabel) lab.push('<text class="env-plot-axlabel" x="' + r2(ay + 6) + '" y="' + (T + 10) + '" text-anchor="start">' + esc(plain(spec.yLabel)) + '</text>');
      out.push('<g class="env-plot-ticks">' + lab.join('') + '</g>');
    }
    (spec.asymptotes || []).forEach(function(a){
      if(a.x != null) out.push('<line class="env-plot-asym" x1="' + r2(F.sx(a.x)) + '" y1="' + T + '" x2="' + r2(F.sx(a.x)) + '" y2="' + B + '"/>');
      else out.push('<line class="env-plot-asym" x1="' + L + '" y1="' + r2(F.sy(a.y)) + '" x2="' + R + '" y2="' + r2(F.sy(a.y)) + '"/>');
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
      out.push('<g class="env-plot-field">' + segs.join('') + '</g>');
    }
    (spec.polys || []).forEach(function(pl){
      out.push('<polyline class="env-plot-curve ' + esc(pl.cls || 's1') + (pl.dashed ? ' is-dashed' : '') + '" points="' + pl.through.map(function(p){ return r2(F.sx(p[0])) + ',' + r2(F.sy(p[1])); }).join(' ') + '"/>');
    });
    if(spec.rightAxis){
      var RY = spec.rightAxis.y, rt = ticks(RY[0], RY[1], 6);
      out.push('<g class="env-plot-axis"><line x1="' + R + '" y1="' + T + '" x2="' + R + '" y2="' + B + '"/></g><g class="env-plot-ticks">' + rt.map(function(v){ var py = F.sy(y0 + (v - RY[0]) / (RY[1] - RY[0]) * (y1 - y0)); return '<text x="' + r2(R + 5) + '" y="' + r2(py + 4) + '" text-anchor="start">' + fmtTick(v) + '</text>'; }).join('') +
        (spec.rightAxis.label ? '<text class="env-plot-axlabel" x="' + r2(F.w - 4) + '" y="' + (dualHead(spec, F.w).one || !spec.yLabel ? 14 : 30) + '" text-anchor="end">' + esc(plain(spec.rightAxis.label)) + '</text>' : '') + '</g>');
    }
    (spec.lines || []).forEach(function(l){
      var e = l.seg ? l.through : lineEnds(l, F);
      if(!e) return;
      out.push('<line class="env-plot-line ' + esc(l.cls || 's2') + (l.dashed ? ' is-dashed' : '') + '" x1="' + r2(F.sx(e[0][0])) + '" y1="' + r2(F.sy(e[0][1])) + '" x2="' + r2(F.sx(e[1][0])) + '" y2="' + r2(F.sy(e[1][1])) + '"/>');
      if(l.label) out.push('<text class="env-plot-label" x="' + r2(F.sx(e[1][0]) - 4) + '" y="' + r2(F.sy(e[1][1]) - 6) + '" text-anchor="end">' + esc(plain(l.label)) + '</text>');
    });
    var dots = [];
    (spec.curves || []).forEach(function(c, i){
      var f = toFn(c.fn), d = c.domain || F.x, runs = sample(f, Math.max(d[0], x0), Math.min(d[1], x1), F, c.samples);
      out.push('<path class="env-plot-curve ' + esc(c.cls || 's' + (i % 5 + 1)) + (c.dashed ? ' is-dashed' : '') + '" d="' + pathOf(runs, F) + '"/>');
      (c.ends || []).forEach(function(kind, j){
        if(!kind) return;
        var x = d[j], y = f(x);
        if(!isFinite(y)){ var h = (d[1] - d[0]) * 1e-7 * (j ? -1 : 1); y = f(x + h); }
        if(isFinite(y)) dots.push({ at: [x, y], open: kind === 'open', cls: c.cls || 's' + (i % 5 + 1) });
      });
      if(c.label && runs.length){
        var lr = runs[runs.length - 1], lp = lr[lr.length - 1];
        out.push('<text class="env-plot-label ' + esc(c.cls || 's' + (i % 5 + 1)) + '" x="' + r2(Math.min(R - 2, F.sx(lp[0]) + 4)) + '" y="' + r2(Math.max(T + 10, F.sy(lp[1]) - 4)) + '" text-anchor="' + (F.sx(lp[0]) > R - 30 ? 'end' : 'start') + '">' + esc(plain(c.label)) + '</text>');
      }
    });
    dots = dots.concat(spec.points || []);
    dots.forEach(function(p){
      if(p.at[0] < x0 || p.at[0] > x1 || p.at[1] < y0 || p.at[1] > y1) return;
      out.push(p.square ? '<rect class="env-plot-pt ' + esc(p.cls || 's1') + '" x="' + r2(F.sx(p.at[0]) - 4) + '" y="' + r2(F.sy(p.at[1]) - 4) + '" width="8" height="8"/>'
        : '<circle class="env-plot-pt ' + esc(p.cls || 's1') + (p.open ? ' is-open' : '') + '" cx="' + r2(F.sx(p.at[0])) + '" cy="' + r2(F.sy(p.at[1])) + '" r="4"/>');
      if(p.label) out.push('<text class="env-plot-label" x="' + r2(F.sx(p.at[0]) + 7) + '" y="' + r2(F.sy(p.at[1]) - 7) + '">' + esc(plain(p.label)) + '</text>');
    });
    (spec.labels || []).forEach(function(t){
      out.push('<text class="env-plot-label' + (t.cls ? ' ' + esc(t.cls) : '') + '" x="' + r2(F.sx(t.at[0])) + '" y="' + r2(F.sy(t.at[1]) + (t.cls ? 4 : 0)) + '" text-anchor="' + (t.anchor || 'middle') + '">' + esc(plain(t.text)) + '</text>');
    });
    // A legend for two or more series, inside the picture so it travels with it.
    // Entries flow left to right and wrap to a new row rather than run into
    // each other or past the edge (a dual plot's "(left axis)" names are long).
    if(spec.legend && spec.legend.length){
      var lx0 = Math.min(L, 8), lmax = F.w - 4, lx = lx0, ly = F.h + extraH + 6, rows = 1, items = [];
      spec.legend.forEach(function(e){
        var ew = 14 + textW(e.name);
        if(lx > lx0 && lx + ew > lmax){ lx = lx0; ly += 18; rows++; }
        items.push('<rect class="env-plot-bar ' + esc(e.cls) + '" x="' + r2(lx) + '" y="' + r2(ly) + '" width="10" height="10"/><text x="' + r2(lx + 14) + '" y="' + r2(ly + 9) + '">' + esc(plain(e.name)) + '</text>');
        lx += ew + 16;
      });
      extraH += 18 * rows;
      out.push('<g class="env-plot-legend">' + items.join('') + '</g>');
    }
    return '<svg class="env-plot" viewBox="0 0 ' + F.w + ' ' + (F.h + extraH) + '" width="' + F.w + '" height="' + (F.h + extraH) + '" role="img" aria-label="' + esc(plain(spec.label)) + '">' + out.join('') + '</svg>';
  }

  /* ---------------------------------------------------------- data figures */
  function pad(a, b, f){ var d = (b - a) || Math.abs(a) || 1; return [a - d * f, b + d * f]; }
  function nice(a, b){ var st = niceStep((b - a) / 6); return [Math.floor(a / st + 1e-9) * st, Math.ceil(b / st - 1e-9) * st]; }
  function fitY(vals, zero){ var lo = Math.min.apply(null, vals), hi = Math.max.apply(null, vals); if(zero !== false && lo > 0) lo = 0; return nice(lo, hi + (hi - lo || Math.abs(hi) || 1) * 0.06); }
  function lsq(pts){
    var n = pts.length, mx = 0, my = 0, sxx = 0, sxy = 0;
    pts.forEach(function(p){ mx += p[0] / n; my += p[1] / n; });
    pts.forEach(function(p){ sxx += (p[0] - mx) * (p[0] - mx); sxy += (p[0] - mx) * (p[1] - my); });
    var b = sxx ? sxy / sxx : 0; return { a: my - b * mx, b: b };
  }
  function interpX(pts, y){
    var p = pts.slice().sort(function(a, b){ return a[0] - b[0]; });
    for(var i = 1; i < p.length; i++){ var a = p[i - 1], c = p[i]; if((y - a[1]) * (y - c[1]) <= 0 && c[1] !== a[1]) return a[0] + (y - a[1]) * (c[0] - a[0]) / (c[1] - a[1]); }
    return null;
  }
  function interpY(pts, x){
    var p = pts.slice().sort(function(a, b){ return a[0] - b[0]; });
    for(var i = 1; i < p.length; i++){ var a = p[i - 1], c = p[i]; if(x >= a[0] && x <= c[0]) return a[1] + (x - a[0]) * (c[1] - a[1]) / ((c[0] - a[0]) || 1); }
    return null;
  }
  function polyline(pts, cls, dashed){
    return { through: pts, cls: cls, poly: true, dashed: dashed };
  }
  function expand(spec){
    if(!spec.kind) return spec;
    var o = {}, k;
    for(k in spec) o[k] = spec[k];
    o.leftAxis = true; o.bottomAxis = true;
    o.rects = (spec.rects || []).slice(); o.points = (spec.points && spec.kind !== 'scatter' && spec.kind !== 'curve' ? spec.points : []).slice(); o.lines = (spec.lines || []).slice();
    o.curves = (spec.curves || []).slice(); o.shade = (spec.shade || []).slice(); o.labels = (spec.labels || []).slice();
    o.polys = [];
    var i;
    if(spec.kind === 'line' || spec.kind === 'dual'){
      var ser = spec.series || [], xs = [], ysL = [], ysR = [];
      ser.forEach(function(se){ se.points.forEach(function(p){ xs.push(p[0]); (se.axis === 'right' ? ysR : ysL).push(p[1]); }); });
      o.x = spec.x || [Math.min.apply(null, xs), Math.max.apply(null, xs)];
      o.y = spec.y || fitY(ysL, spec.zero);
      var R = spec.kind === 'dual' ? (spec.yRight || fitY(ysR, spec.zero)) : null;
      if(R){ o.rightAxis = { y: R, label: spec.yRightLabel || '' }; }
      ser.forEach(function(se, j){
        var cls = se.cls || 's' + (j % 5 + 1);
        var map = se.axis === 'right' && R ? function(v){ return o.y[0] + (v - R[0]) / (R[1] - R[0]) * (o.y[1] - o.y[0]); } : function(v){ return v; };
        var pts = se.points.map(function(p){ return [p[0], map(p[1])]; });
        o.polys.push(polyline(pts, cls, se.dashed));
        if(se.markers !== false) pts.forEach(function(p){ o.points.push({ at: p, cls: cls, square: j % 2 === 1 }); });
      });
      o.legend = ser.length > 1 ? ser.map(function(se, j){ return { name: se.name + (spec.kind === 'dual' ? ' (' + (se.axis === 'right' ? 'right' : 'left') + ' axis)' : ''), cls: se.cls || 's' + (j % 5 + 1) }; }) : null;
    } else if(spec.kind === 'bar'){
      var cats = spec.categories, groups = spec.series || [{ name: '', values: spec.values }], all = [];
      groups.forEach(function(g){ all = all.concat(g.values); });
      o.x = [0, cats.length]; o.y = spec.y || fitY(all.concat([0])); o.xTicks = false;
      var gw = 0.7 / groups.length;
      cats.forEach(function(c, j){
        groups.forEach(function(g, gi){ var x0 = j + 0.15 + gi * gw; o.rects.push({ x0: x0, x1: x0 + gw * 0.92, y0: 0, y1: g.values[j], cls: g.cls || 's' + (gi % 5 + 1) }); });
        o.labels.push({ at: [j + 0.5, o.y[0] - (o.y[1] - o.y[0]) * 0.07], text: c });
      });
      o.legend = groups.length > 1 ? groups.map(function(g, gi){ return { name: g.name, cls: g.cls || 's' + (gi % 5 + 1) }; }) : null;
    } else if(spec.kind === 'scatter'){
      var P = spec.points, X = P.map(function(p){ return p[0]; }), Y = P.map(function(p){ return p[1]; });
      o.x = spec.x || nice(pad(Math.min.apply(null, X), Math.max.apply(null, X), 0.05)[0], pad(Math.min.apply(null, X), Math.max.apply(null, X), 0.05)[1]);
      o.y = spec.y || fitY(Y, spec.zero);
      P.forEach(function(p){ o.points.push({ at: p, cls: spec.cls || 's1' }); });
      if(spec.trend){ var L = lsq(P); o.lines.push({ point: [0, L.a], slope: L.b, cls: 's2', dashed: true }); o.fit = L; }
    } else if(spec.kind === 'pyramid'){
      var G = spec.groups, Lv = spec.left, Rv = spec.right, mx = Math.max.apply(null, Lv.concat(Rv));
      var M = spec.max || nice(0, mx)[1];
      o.x = [-M, M]; o.y = [0, G.length]; o.yTicks = false; o.grid = spec.grid === true; o.absX = true; o.centerAxis = true;
      G.forEach(function(g, j){
        o.rects.push({ x0: -Lv[j], x1: 0, y0: j + 0.08, y1: j + 0.92, cls: spec.leftCls || 's1' });
        o.rects.push({ x0: 0, x1: Rv[j], y0: j + 0.08, y1: j + 0.92, cls: spec.rightCls || 's2' });
        o.labels.push({ at: [0, j + 0.5], text: g, anchor: 'middle', cls: 'env-plot-pylabel' });
      });
      o.legend = [{ name: spec.leftLabel || 'Male', cls: spec.leftCls || 's1' }, { name: spec.rightLabel || 'Female', cls: spec.rightCls || 's2' }];
    } else if(spec.kind === 'curve'){
      var C = spec.points.slice().sort(function(a, b){ return a[0] - b[0]; }), cx = C.map(function(p){ return p[0]; }), cy = C.map(function(p){ return p[1]; });
      o.x = spec.x || [Math.min(0, cx[0]), cx[cx.length - 1]];
      o.y = spec.y || fitY(cy);
      o.polys.push(polyline(C, spec.cls || 's1'));
      if(spec.markers !== false) C.forEach(function(p){ o.points.push({ at: p, cls: spec.cls || 's1' }); });
      if(spec.mark){
        var mxv = spec.mark.x != null ? spec.mark.x : interpX(C, spec.mark.y), myv = spec.mark.y != null ? spec.mark.y : interpY(C, spec.mark.x);
        if(mxv == null || myv == null) throw new Error('ApEnvPlot: the marked point is not on the curve');
        o.polys.push(polyline([[o.x[0], myv], [mxv, myv], [mxv, o.y[0]]], 's2', true));
        o.points.push({ at: [mxv, myv], cls: 's2', label: spec.mark.label });
        o.mark = { x: mxv, y: myv };
      }
    } else throw new Error('ApEnvPlot: unknown plot kind "' + spec.kind + '"');
    return o;
  }
  function rectsSvg(o, F){
    return (o.rects || []).map(function(r){
      var x = F.sx(Math.min(r.x0, r.x1)), y = F.sy(Math.max(r.y0, r.y1));
      return '<rect class="env-plot-bar ' + esc(r.cls || 's1') + '" x="' + r2(x) + '" y="' + r2(y) + '" width="' + r2(Math.abs(F.sx(r.x1) - F.sx(r.x0))) + '" height="' + r2(Math.abs(F.sy(r.y0) - F.sy(r.y1))) + '"/>';
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
    var api = { el: host.firstChild, frame: frame(expand(spec)), spec: spec };
    api.update = function(next){ api.spec = next; host.innerHTML = svg(next); api.el = host.firstChild; api.frame = frame(expand(next)); return api; };
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
    g.setAttribute('class', 'env-plot-handle');
    g.setAttribute('tabindex', '0');
    g.setAttribute('role', 'slider');
    g.setAttribute('aria-label', o.label || 'Point');
    var halo = document.createElementNS(NS, 'circle'); halo.setAttribute('r', '16'); halo.setAttribute('class', 'env-plot-halo');
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

  root.ApEnvPlot = { expand: expand, svg: svg, frame: frame, textW: textW, ticks: ticks, sample: sample,
    mount: mount, draggable: draggable, loop: loop, reduced: reduced, interpX: interpX, interpY: interpY, lsq: lsq };
})(typeof window !== 'undefined' ? window : globalThis);
