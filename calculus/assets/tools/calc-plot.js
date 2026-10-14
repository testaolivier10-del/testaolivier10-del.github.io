/* ApCalcPlot: SVG plots for AP® Calculus AB (docs/apcalc-architecture.md,
   "Tools"). The same file draws graph stimuli at build time (the generator
   runs svg() through scripts/lib/apcalc-mathlib.mjs) and every trainer's
   plots at run time, so a picture is always drawn from the function it
   claims to show. Needs ApCalcExpr (calc-expr.js) for curves given as
   expression strings.

   Pure (no DOM, runs in node):
     svg(spec) -> '<svg class="calc-plot" role="img" aria-label=...>...</svg>'
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
       labels: [{ at: [x, y], text, anchor: 'start'|'middle'|'end' }] } */
(function(root){
  'use strict';
  var PAD = { l: 34, r: 14, t: 12, b: 28 };
  function E(){ return root.ApCalcExpr; }
  function esc(s){ return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function r2(v){ return Math.round(v * 100) / 100; }
  function plain(s){ return root.ApCalcTex ? root.ApCalcTex.plain(s) : String(s); }

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
    if(!spec || String(spec.label || '').trim().length < 20) throw new Error('ApCalcPlot.svg: a plot needs a label of 20+ characters (what it shows, for screen readers).');
    var F = frame(spec), out = [], x0 = F.x[0], x1 = F.x[1], y0 = F.y[0], y1 = F.y[1];
    var L = PAD.l, R = F.w - PAD.r, T = PAD.t, B = F.h - PAD.b;
    var xt = spec.piX ? piTicks(x0, x1) : ticks(x0, x1, 7, spec.xStep), yt = ticks(y0, y1, 6, spec.yStep);
    // Grid
    if(spec.grid !== false){
      out.push('<g class="calc-plot-grid">' + xt.map(function(v){ return '<line x1="' + r2(F.sx(v)) + '" y1="' + T + '" x2="' + r2(F.sx(v)) + '" y2="' + B + '"/>'; }).join('') +
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
      out.push('<polygon class="calc-plot-shade' + (s.cls ? ' ' + esc(s.cls) : '') + '" points="' + pts + '"/>');
    });
    // Axes, ticks, labels
    if(spec.axes !== false){
      var ax = y0 <= 0 && y1 >= 0 ? F.sy(0) : B, ay = x0 <= 0 && x1 >= 0 ? F.sx(0) : L;
      out.push('<g class="calc-plot-axis"><line x1="' + L + '" y1="' + r2(ax) + '" x2="' + R + '" y2="' + r2(ax) + '"/><line x1="' + r2(ay) + '" y1="' + T + '" x2="' + r2(ay) + '" y2="' + B + '"/>' +
        xt.filter(function(v){ return Math.abs(v) > 1e-12 || ay === L; }).map(function(v){ var px = r2(F.sx(v)); return '<line x1="' + px + '" y1="' + r2(ax - 3) + '" x2="' + px + '" y2="' + r2(ax + 3) + '"/>'; }).join('') +
        yt.filter(function(v){ return Math.abs(v) > 1e-12 || ax === B; }).map(function(v){ var py = r2(F.sy(v)); return '<line x1="' + r2(ay - 3) + '" y1="' + py + '" x2="' + r2(ay + 3) + '" y2="' + py + '"/>'; }).join('') + '</g>');
      var lab = [];
      xt.forEach(function(v){ if(Math.abs(v) < 1e-12 && ay !== L) return; lab.push('<text x="' + r2(F.sx(v)) + '" y="' + r2(Math.min(F.h - 4, ax + 15)) + '" text-anchor="middle">' + (spec.piX ? piLabel(v) : fmtTick(v)) + '</text>'); });
      yt.forEach(function(v){ if(Math.abs(v) < 1e-12 && ax !== B) return; lab.push('<text x="' + r2(Math.max(10, ay - 6)) + '" y="' + r2(F.sy(v) + 4) + '" text-anchor="end">' + fmtTick(v) + '</text>'); });
      if(spec.xLabel) lab.push('<text class="calc-plot-axlabel" x="' + (R - 2) + '" y="' + r2(Math.max(T + 10, ax - 6)) + '" text-anchor="end">' + esc(plain(spec.xLabel)) + '</text>');
      if(spec.yLabel) lab.push('<text class="calc-plot-axlabel" x="' + r2(ay + 6) + '" y="' + (T + 10) + '" text-anchor="start">' + esc(plain(spec.yLabel)) + '</text>');
      out.push('<g class="calc-plot-ticks">' + lab.join('') + '</g>');
    }
    (spec.asymptotes || []).forEach(function(a){
      if(a.x != null) out.push('<line class="calc-plot-asym" x1="' + r2(F.sx(a.x)) + '" y1="' + T + '" x2="' + r2(F.sx(a.x)) + '" y2="' + B + '"/>');
      else out.push('<line class="calc-plot-asym" x1="' + L + '" y1="' + r2(F.sy(a.y)) + '" x2="' + R + '" y2="' + r2(F.sy(a.y)) + '"/>');
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
      out.push('<g class="calc-plot-field">' + segs.join('') + '</g>');
    }
    (spec.lines || []).forEach(function(l){
      var e = lineEnds(l, F);
      if(!e) return;
      out.push('<line class="calc-plot-line ' + esc(l.cls || 's2') + (l.dashed ? ' is-dashed' : '') + '" x1="' + r2(F.sx(e[0][0])) + '" y1="' + r2(F.sy(e[0][1])) + '" x2="' + r2(F.sx(e[1][0])) + '" y2="' + r2(F.sy(e[1][1])) + '"/>');
      if(l.label) out.push('<text class="calc-plot-label" x="' + r2(F.sx(e[1][0]) - 4) + '" y="' + r2(F.sy(e[1][1]) - 6) + '" text-anchor="end">' + esc(plain(l.label)) + '</text>');
    });
    var dots = [];
    (spec.curves || []).forEach(function(c, i){
      var f = toFn(c.fn), d = c.domain || F.x, runs = sample(f, Math.max(d[0], x0), Math.min(d[1], x1), F, c.samples);
      out.push('<path class="calc-plot-curve ' + esc(c.cls || 's' + (i % 5 + 1)) + (c.dashed ? ' is-dashed' : '') + '" d="' + pathOf(runs, F) + '"/>');
      (c.ends || []).forEach(function(kind, j){
        if(!kind) return;
        var x = d[j], y = f(x);
        if(!isFinite(y)){ var h = (d[1] - d[0]) * 1e-7 * (j ? -1 : 1); y = f(x + h); }
        if(isFinite(y)) dots.push({ at: [x, y], open: kind === 'open', cls: c.cls || 's' + (i % 5 + 1) });
      });
      if(c.label && runs.length){
        var lr = runs[runs.length - 1], lp = lr[lr.length - 1];
        out.push('<text class="calc-plot-label ' + esc(c.cls || 's' + (i % 5 + 1)) + '" x="' + r2(Math.min(R - 2, F.sx(lp[0]) + 4)) + '" y="' + r2(Math.max(T + 10, F.sy(lp[1]) - 4)) + '" text-anchor="' + (F.sx(lp[0]) > R - 30 ? 'end' : 'start') + '">' + esc(plain(c.label)) + '</text>');
      }
    });
    dots = dots.concat(spec.points || []);
    dots.forEach(function(p){
      if(p.at[0] < x0 || p.at[0] > x1 || p.at[1] < y0 || p.at[1] > y1) return;
      out.push('<circle class="calc-plot-pt ' + esc(p.cls || 's1') + (p.open ? ' is-open' : '') + '" cx="' + r2(F.sx(p.at[0])) + '" cy="' + r2(F.sy(p.at[1])) + '" r="4"/>');
      if(p.label) out.push('<text class="calc-plot-label" x="' + r2(F.sx(p.at[0]) + 7) + '" y="' + r2(F.sy(p.at[1]) - 7) + '">' + esc(plain(p.label)) + '</text>');
    });
    (spec.labels || []).forEach(function(t){
      out.push('<text class="calc-plot-label" x="' + r2(F.sx(t.at[0])) + '" y="' + r2(F.sy(t.at[1])) + '" text-anchor="' + (t.anchor || 'middle') + '">' + esc(plain(t.text)) + '</text>');
    });
    return '<svg class="calc-plot" viewBox="0 0 ' + F.w + ' ' + F.h + '" width="' + F.w + '" height="' + F.h + '" role="img" aria-label="' + esc(plain(spec.label)) + '">' + out.join('') + '</svg>';
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
    g.setAttribute('class', 'calc-plot-handle');
    g.setAttribute('tabindex', '0');
    g.setAttribute('role', 'slider');
    g.setAttribute('aria-label', o.label || 'Point');
    var halo = document.createElementNS(NS, 'circle'); halo.setAttribute('r', '16'); halo.setAttribute('class', 'calc-plot-halo');
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

  root.ApCalcPlot = { svg: svg, frame: frame, ticks: ticks, piTicks: piTicks, sample: sample, tangent: tangent, secant: secant,
    mount: mount, draggable: draggable, loop: loop, reduced: reduced, deriv: deriv };
})(typeof window !== 'undefined' ? window : globalThis);
