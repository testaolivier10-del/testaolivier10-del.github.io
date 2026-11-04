/* ApPrecalcPlot: SVG plots for AP® Precalculus (docs/apprecalc-architecture.md,
   "Tools"). The same file draws graph stimuli at build time (the generator
   runs svg() through scripts/lib/apprecalc-mathlib.mjs) and every trainer's
   plots at run time, so a picture is always drawn from the function it
   claims to show. Needs ApPrecalcExpr (pcalc-expr.js) for curves given as
   expression strings.

   Pure (no DOM, runs in node):
     svg(spec) -> '<svg class="pcalc-plot" role="img" aria-label=...>...</svg>'
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
       ticks: false (an unscaled graph, as on Q3: axes and axis labels, no
         tick marks, no numbers, no grid unless grid: true); xTicks: false or
         yTicks: false hides one axis's ticks only,
       yLog: true (a semi-log plot: y is drawn on a base-10 log scale; y = [a, b]
         with 0 < a < b in data units, ticks at powers of 10 with a light grid
         at 2-9 times each; the x-axis is drawn along the bottom; every y in
         the spec is in data units; a line is given by `through` (straight
         on the plot), not `slope`; no `field`) } */
(function(root){
  'use strict';
  var PAD = { l: 34, r: 14, t: 12, b: 28 };
  function E(){ return root.ApPrecalcExpr; }
  function esc(s){ return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function r2(v){ return Math.round(v * 100) / 100; }
  function plain(s){ return root.ApPrecalcTex ? root.ApPrecalcTex.plain(s) : String(s); }

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
    // On a log y-axis (yLog) a data value v sits at log10(v); sy and iy take and give data units.
    var lg = !!spec.yLog, ty = lg ? Math.log10 : function(v){ return v; }, uy = lg ? function(v){ return Math.pow(10, v); } : ty;
    var Y0 = ty(y[0]), Y1 = ty(y[1]);
    var f = {
      x: x, y: y, w: w, h: h, pad: PAD, yLog: lg,
      sx: function(v){ return PAD.l + (v - x[0]) / (x[1] - x[0]) * iw; },
      sy: function(v){ return PAD.t + (Y1 - ty(v)) / (Y1 - Y0) * ih; },
      ix: function(px){ return x[0] + (px - PAD.l) / iw * (x[1] - x[0]); },
      iy: function(py){ return uy(Y1 - (py - PAD.t) / ih * (Y1 - Y0)); }
    };
    return f;
  }
  /* A yLog spec as the same picture in log10 units, so the linear drawing
     code draws it: every y is replaced by its log, curves by log10(f), and
     the y ticks are the powers of 10 (labelled in data units). */
  function logSpec(spec){
    var y = spec.y || [];
    if(!(y[0] > 0 && y[1] > y[0])) throw new Error('ApPrecalcPlot.svg: yLog needs y: [a, b] with 0 < a < b.');
    if(spec.field) throw new Error('ApPrecalcPlot.svg: yLog does not draw a slope field.');
    var L = Math.log10, ly = function(p){ return [p[0], L(p[1])]; };
    var lf = function(fn){ var f = toFn(fn); return function(x){ var v = f(x); return v > 0 ? L(v) : NaN; }; };
    var o = {};
    Object.keys(spec).forEach(function(k){ o[k] = spec[k]; });
    o.yLog = false; o.y = [L(y[0]), L(y[1])]; o._axisBottom = true;
    o.curves = (spec.curves || []).map(function(c){ var d = {}; Object.keys(c).forEach(function(k){ d[k] = c[k]; }); d.fn = lf(c.fn); return d; });
    o.shade = (spec.shade || []).map(function(c){ var d = {}; Object.keys(c).forEach(function(k){ d[k] = c[k]; }); d.fn = lf(c.fn); d.fn2 = c.fn2 != null ? lf(c.fn2) : function(){ return o.y[0]; }; return d; });
    o.points = (spec.points || []).map(function(p){ var d = {}; Object.keys(p).forEach(function(k){ d[k] = p[k]; }); d.at = ly(p.at); return d; });
    o.labels = (spec.labels || []).map(function(p){ var d = {}; Object.keys(p).forEach(function(k){ d[k] = p[k]; }); d.at = ly(p.at); return d; });
    o.asymptotes = (spec.asymptotes || []).map(function(a){ return a.y != null ? { y: L(a.y) } : a; });
    o.lines = (spec.lines || []).map(function(l){
      if(!l.through) throw new Error('ApPrecalcPlot.svg: on a yLog plot a line is given by through: [[x1, y1], [x2, y2]].');
      var d = {}; Object.keys(l).forEach(function(k){ d[k] = l[k]; }); d.through = l.through.map(ly); return d;
    });
    var major = [], minor = [];
    for(var k = Math.floor(o.y[0]); k <= Math.ceil(o.y[1]); k++){
      if(k >= o.y[0] - 1e-9 && k <= o.y[1] + 1e-9) major.push(k);
      for(var m = 2; m <= 9; m++){ var v = k + L(m); if(v > o.y[0] && v < o.y[1]) minor.push(v); }
    }
    o._yTicks = major; o._yMinor = minor;
    o._yLabel = function(k){
      return k >= -2 && k <= 2 ? fmtTick(Math.pow(10, k)) : '10<tspan dy="-5" font-size="75%">' + fmtTick(k) + '</tspan>';
    };
    return o;
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
    if(!spec || String(spec.label || '').trim().length < 20) throw new Error('ApPrecalcPlot.svg: a plot needs a label of 20+ characters (what it shows, for screen readers).');
    if(spec.yLog) spec = logSpec(spec);
    var F = frame(spec), out = [], x0 = F.x[0], x1 = F.x[1], y0 = F.y[0], y1 = F.y[1];
    var L = PAD.l, R = F.w - PAD.r, T = PAD.t, B = F.h - PAD.b;
    // ticks: false draws an unscaled graph (no tick marks or numbers, and no grid unless asked for).
    var showX = spec.ticks !== false && spec.xTicks !== false, showY = spec.ticks !== false && spec.yTicks !== false;
    var xt = spec.piX ? piTicks(x0, x1) : ticks(x0, x1, 7, spec.xStep), yt = spec._yTicks || ticks(y0, y1, 6, spec.yStep);
    var yLab = spec._yLabel || fmtTick;
    var tickQ = [], tickAt = -1, ink = [];
    function inkSeg(x1, y1, x2, y2){ var n = Math.max(2, Math.ceil(Math.sqrt((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1)) / 2)); for(var i = 0; i <= n; i++) ink.push([x1 + (x2 - x1) * i / n, y1 + (y2 - y1) * i / n]); }
    function inkBox(l, t, r, b){ for(var X = l; X <= r; X += 2) for(var Y = t; Y <= b; Y += 2) ink.push([X, Y]); }
    function inkText(x, y, str, anchor, size){ var w = 0.6 * size * String(str).length, l = anchor === 'middle' ? x - w / 2 : anchor === 'end' ? x - w : x; inkBox(l, y - 0.8 * size, l + w, y + 0.25 * size); }
    function placeTicks(){
      // A tick number's box at candidate c; other numbers keep a 5px gap so two never read as one.
      function box(t, c){ var w = 6.4 * String(t.s).replace(/&[a-z]+;/g, '#').length, l = c[2] === 'middle' ? c[0] - w / 2 : c[2] === 'end' ? c[0] - w : c[0]; return [l, c[1] - 9, l + w, c[1] + 3]; }
      var at = tickQ.map(function(t){ return box(t, t.c[0]); });
      return tickQ.map(function(t, j){
        var best = 0, bh = Infinity;
        for(var k = 0; k < t.c.length; k++){
          var c = t.c[k], bx = box(t, c), h = 0;
          for(var i = 0; i < ink.length; i++){ var q = ink[i]; if(q[0] > bx[0] - 3 && q[0] < bx[2] + 3 && q[1] > bx[1] && q[1] < bx[3] + 1) h++; }
          for(var m = 0; m < at.length; m++) if(m !== j && bx[0] < at[m][2] + 5 && bx[2] > at[m][0] - 5 && bx[1] < at[m][3] && bx[3] > at[m][1]) h += 100;
          if(h < bh){ bh = h; best = k; }
          if(!h) break;
        }
        var b = t.c[best];
        at[j] = box(t, b);
        return '<text x="' + r2(b[0]) + '" y="' + r2(b[1]) + '" text-anchor="' + b[2] + '">' + t.s + '</text>';
      }).join('');
    }
    // Grid
    if(spec.grid === true || (spec.grid !== false && spec.ticks !== false)){
      out.push('<g class="pcalc-plot-grid">' + (showX ? xt : []).map(function(v){ return '<line x1="' + r2(F.sx(v)) + '" y1="' + T + '" x2="' + r2(F.sx(v)) + '" y2="' + B + '"/>'; }).join('') +
        (showY ? yt : []).map(function(v){ return '<line x1="' + L + '" y1="' + r2(F.sy(v)) + '" x2="' + R + '" y2="' + r2(F.sy(v)) + '"/>'; }).join('') +
        (showY ? spec._yMinor || [] : []).map(function(v){ return '<line class="is-minor" x1="' + L + '" y1="' + r2(F.sy(v)) + '" x2="' + R + '" y2="' + r2(F.sy(v)) + '" stroke-opacity=".45"/>'; }).join('') + '</g>');
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
      out.push('<polygon class="pcalc-plot-shade' + (s.cls ? ' ' + esc(s.cls) : '') + '" points="' + pts + '"/>');
    });
    // Axes, ticks, labels
    if(spec.axes !== false){
      var ax = !spec._axisBottom && y0 <= 0 && y1 >= 0 ? F.sy(0) : B, ay = x0 <= 0 && x1 >= 0 ? F.sx(0) : L;
      if(!showX) xt = [];
      if(!showY) yt = [];
      out.push('<g class="pcalc-plot-axis"><line x1="' + L + '" y1="' + r2(ax) + '" x2="' + R + '" y2="' + r2(ax) + '"/><line x1="' + r2(ay) + '" y1="' + T + '" x2="' + r2(ay) + '" y2="' + B + '"/>' +
        xt.filter(function(v){ return Math.abs(v) > 1e-12 || ay === L; }).map(function(v){ var px = r2(F.sx(v)); return '<line x1="' + px + '" y1="' + r2(ax - 3) + '" x2="' + px + '" y2="' + r2(ax + 3) + '"/>'; }).join('') +
        yt.filter(function(v){ return Math.abs(v) > 1e-12 || ax === B; }).map(function(v){ var py = r2(F.sy(v)); return '<line x1="' + r2(ay - 3) + '" y1="' + py + '" x2="' + r2(ay + 3) + '" y2="' + py + '"/>'; }).join('') + '</g>');
      var lab = [];
      // Tick numbers are placed at the end (see placeTicks): each keeps its usual spot unless a curve,
      // line, point or label covers it, then tries the other side of its axis or a little further out.
      xt.forEach(function(v){
        if(Math.abs(v) < 1e-12 && ay !== L) return;
        var X = F.sx(v), Y = Math.min(F.h - 4, ax + 15), c = [[X, Y, 'middle'], [X, ax - 6, 'middle']];
        [3, 7, 11].forEach(function(d){ c.push([X - d, Y, 'end'], [X + d, Y, 'start'], [X - d, ax - 6, 'end'], [X + d, ax - 6, 'start']); });
        tickQ.push({ s: spec.piX ? piLabel(v) : fmtTick(v), c: c });
      });
      yt.forEach(function(v){
        if(Math.abs(v) < 1e-12 && ax !== B) return;
        var Y = F.sy(v) + 4, c = [[Math.max(10, ay - 6), Y, 'end'], [ay + 6, Y, 'start']];
        [14, 22, 30].forEach(function(d){ if(ay - d > 10) c.push([ay - d, Y, 'end']); c.push([ay + d, Y, 'start']); });
        tickQ.push({ s: yLab(v), c: c });
      });
      tickAt = out.length;
      if(spec.xLabel) lab.push('<text class="pcalc-plot-axlabel" x="' + (R - 2) + '" y="' + r2(Math.max(T + 10, ax - 6)) + '" text-anchor="end">' + esc(plain(spec.xLabel)) + '</text>');
      if(spec.yLabel) lab.push('<text class="pcalc-plot-axlabel" x="' + r2(ay + 6) + '" y="' + (T + 10) + '" text-anchor="start">' + esc(plain(spec.yLabel)) + '</text>');
      out.push('<g class="pcalc-plot-ticks">\u0000' + lab.join('') + '</g>');
      if(spec.xLabel) inkText(R - 2, Math.max(T + 10, ax - 6), plain(spec.xLabel), 'end', 11);
      if(spec.yLabel) inkText(ay + 6, T + 10, plain(spec.yLabel), 'start', 11);
    }
    (spec.asymptotes || []).forEach(function(a){
      if(a.x != null) out.push('<line class="pcalc-plot-asym" x1="' + r2(F.sx(a.x)) + '" y1="' + T + '" x2="' + r2(F.sx(a.x)) + '" y2="' + B + '"/>');
      else out.push('<line class="pcalc-plot-asym" x1="' + L + '" y1="' + r2(F.sy(a.y)) + '" x2="' + R + '" y2="' + r2(F.sy(a.y)) + '"/>');
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
      out.push('<g class="pcalc-plot-field">' + segs.join('') + '</g>');
    }
    (spec.lines || []).forEach(function(l){
      var e = lineEnds(l, F);
      if(!e) return;
      out.push('<line class="pcalc-plot-line ' + esc(l.cls || 's2') + (l.dashed ? ' is-dashed' : '') + '" x1="' + r2(F.sx(e[0][0])) + '" y1="' + r2(F.sy(e[0][1])) + '" x2="' + r2(F.sx(e[1][0])) + '" y2="' + r2(F.sy(e[1][1])) + '"/>');
      inkSeg(F.sx(e[0][0]), F.sy(e[0][1]), F.sx(e[1][0]), F.sy(e[1][1]));
      if(l.label) inkText(F.sx(e[1][0]) - 4, F.sy(e[1][1]) - 6, plain(l.label), 'end', 11);
      if(l.label) out.push('<text class="pcalc-plot-label" x="' + r2(F.sx(e[1][0]) - 4) + '" y="' + r2(F.sy(e[1][1]) - 6) + '" text-anchor="end">' + esc(plain(l.label)) + '</text>');
    });
    var dots = [];
    (spec.curves || []).forEach(function(c, i){
      var f = toFn(c.fn), d = c.domain || F.x, runs = sample(f, Math.max(d[0], x0), Math.min(d[1], x1), F, c.samples);
      out.push('<path class="pcalc-plot-curve ' + esc(c.cls || 's' + (i % 5 + 1)) + (c.dashed ? ' is-dashed' : '') + '" d="' + pathOf(runs, F) + '"/>');
      runs.forEach(function(r){ for(var k = 1; k < r.length; k++) inkSeg(F.sx(r[k - 1][0]), F.sy(r[k - 1][1]), F.sx(r[k][0]), F.sy(r[k][1])); });
      (c.ends || []).forEach(function(kind, j){
        if(!kind) return;
        var x = d[j], y = f(x);
        if(!isFinite(y)){ var h = (d[1] - d[0]) * 1e-7 * (j ? -1 : 1); y = f(x + h); }
        if(isFinite(y)) dots.push({ at: [x, y], open: kind === 'open', cls: c.cls || 's' + (i % 5 + 1) });
      });
      if(c.label && runs.length){
        var lr = runs[runs.length - 1], lp = lr[lr.length - 1];
        inkText(Math.min(R - 2, F.sx(lp[0]) + 4), Math.max(T + 10, F.sy(lp[1]) - 4), plain(c.label), F.sx(lp[0]) > R - 30 ? 'end' : 'start', 11);
        out.push('<text class="pcalc-plot-label ' + esc(c.cls || 's' + (i % 5 + 1)) + '" x="' + r2(Math.min(R - 2, F.sx(lp[0]) + 4)) + '" y="' + r2(Math.max(T + 10, F.sy(lp[1]) - 4)) + '" text-anchor="' + (F.sx(lp[0]) > R - 30 ? 'end' : 'start') + '">' + esc(plain(c.label)) + '</text>');
      }
    });
    dots = dots.concat(spec.points || []);
    dots.forEach(function(p){
      if(p.at[0] < x0 || p.at[0] > x1 || p.at[1] < y0 || p.at[1] > y1) return;
      out.push('<circle class="pcalc-plot-pt ' + esc(p.cls || 's1') + (p.open ? ' is-open' : '') + '" cx="' + r2(F.sx(p.at[0])) + '" cy="' + r2(F.sy(p.at[1])) + '" r="4"/>');
      inkBox(F.sx(p.at[0]) - 4, F.sy(p.at[1]) - 4, F.sx(p.at[0]) + 4, F.sy(p.at[1]) + 4);
      if(p.label) inkText(F.sx(p.at[0]) + 7, F.sy(p.at[1]) - 7, plain(p.label), 'start', 11);
      if(p.label) out.push('<text class="pcalc-plot-label" x="' + r2(F.sx(p.at[0]) + 7) + '" y="' + r2(F.sy(p.at[1]) - 7) + '">' + esc(plain(p.label)) + '</text>');
    });
    (spec.labels || []).forEach(function(t){
      inkText(F.sx(t.at[0]), F.sy(t.at[1]), plain(t.text), t.anchor || 'middle', 11);
      out.push('<text class="pcalc-plot-label" x="' + r2(F.sx(t.at[0])) + '" y="' + r2(F.sy(t.at[1])) + '" text-anchor="' + (t.anchor || 'middle') + '">' + esc(plain(t.text)) + '</text>');
    });
    if(tickAt >= 0) out[tickAt] = out[tickAt].replace('\u0000', placeTicks());
    return '<svg class="pcalc-plot" viewBox="0 0 ' + F.w + ' ' + F.h + '" width="' + F.w + '" height="' + F.h + '" role="img" aria-label="' + esc(plain(spec.label)) + '">' + out.join('') + '</svg>';
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
    g.setAttribute('class', 'pcalc-plot-handle');
    g.setAttribute('tabindex', '0');
    g.setAttribute('role', 'slider');
    g.setAttribute('aria-label', o.label || 'Point');
    var halo = document.createElementNS(NS, 'circle'); halo.setAttribute('r', '16'); halo.setAttribute('class', 'pcalc-plot-halo');
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

  root.ApPrecalcPlot = { svg: svg, frame: frame, ticks: ticks, piTicks: piTicks, sample: sample, tangent: tangent, secant: secant,
    mount: mount, draggable: draggable, loop: loop, reduced: reduced, deriv: deriv };
})(typeof window !== 'undefined' ? window : globalThis);
