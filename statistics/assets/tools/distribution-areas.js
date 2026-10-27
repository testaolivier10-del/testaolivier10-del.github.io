/* Distribution areas (simulator; docs/apstat-spec.md section 6). OWNED BY THIS TOOL
   ONLY. The model is ApStatMath.distributionAreas (statistics/assets/tools/math/
   distribution-areas.js); every area and number comes from ApStatDist through
   it; math text is ApStatTex; the frame is ApStatTools.modes on the Tool
   Studio. Styles: distribution-areas.css.

   Explore, two distributions:
     Normal     the curve in its context's units with z under it; one or two
                boundary handles to drag (or arrow keys); the region (less
                than, between, greater than) shaded and its probability; the
                68-95-99.7 rule as an overlay. Details: the study, μ and σ,
                a boundary from an area (inverse normal), every number.
     Binomial   the bars of P(X = k); the event in words (at most, fewer
                than, exactly, at least, more than) and its counts shaded; the
                boundary count k to drag; the normal shape with mean np and SD
                √(np(1 − p)) drawn over the bars for comparison only.
   Why holds the work as the exam wants it: distribution, parameters,
   boundary, direction, then the probability, by technology and by table.

   Test yourself: ApStatTools.drill on distributionAreas.generate (a normal
   area, a boundary from an area, a binomial event in words, the empirical
   rule against the exact area); the figure on the stage fills in as the
   steps are answered. */
(function(){
  'use strict';
  var T = window.ApStatTools, M = window.ApStatMath;
  if(!T || !M || !M.distributionAreas) return;
  var DA = M.distributionAreas, esc = T.esc, SLUG = 'distribution-areas';
  var uid = 0;
  function D(){ return window.ApStatDist; }
  function TX(){ return window.ApStatTex; }
  function tx(s){ return TX() ? TX().html(String(s), { wrap: true }) : esc(s); }
  function F(x, d){ return T.F(x, d); }
  function P4(p){ return p < 0.00005 ? '< 0.0001' : p > 0.99995 ? '> 0.9999' : DA.P4(p); }
  function cap1(t){ return t.charAt(0).toUpperCase() + t.slice(1); }
  function EQ(p){ var t = P4(p); return /^[<>]/.test(t) ? t : '= ' + t; }
  // A percent that never shows 100.0% for 0.9996 or 0.0% for 0.0004.
  function PCT(p){ var x = p * 100; if(x >= 99.995) return 'more than 99.99'; if(x <= 0.005) return 'less than 0.01'; return x < 1 || x > 99 ? F(x, 2) : F(x, 1); }
  function el(tag, cls, html){ var e = document.createElement(tag); if(cls) e.className = cls; if(html != null) e.innerHTML = html; return e; }

  /* ================================================================ drawing */
  function frame(cfg){
    var p = cfg.pad, iw = cfg.W - p.l - p.r, ih = cfg.H - p.t - p.b;
    return { W: cfg.W, H: cfg.H, l: p.l, r: cfg.W - p.r, t: p.t, b: cfg.H - p.b, lo: cfg.lo, hi: cfg.hi, ymax: cfg.ymax,
      sx: function(v){ return p.l + (v - cfg.lo) / (cfg.hi - cfg.lo) * iw; },
      sy: function(v){ return p.t + ih - v / cfg.ymax * ih; },
      ix: function(px){ return cfg.lo + (px - p.l) / iw * (cfg.hi - cfg.lo); } };
  }
  function f2(v){ return (Math.round(v * 10) / 10).toFixed(1); }
  function curvePath(f, G, a, b, n){
    a = a == null ? G.lo : Math.max(G.lo, a); b = b == null ? G.hi : Math.min(G.hi, b); n = n || 160;
    var d = ''; for(var i = 0; i <= n; i++){ var x = a + (b - a) * i / n; d += (i ? 'L' : 'M') + f2(G.sx(x)) + ' ' + f2(G.sy(Math.min(G.ymax * 1.02, f(x)))); }
    return d;
  }
  function areaPath(f, G, a, b){
    a = Math.max(G.lo, a); b = Math.min(G.hi, b);
    if(!(b > a)) return '';
    return 'M' + f2(G.sx(a)) + ' ' + f2(G.sy(0)) + curvePath(f, G, a, b, Math.max(8, Math.round(140 * (b - a) / (G.hi - G.lo)))).replace(/^M/, 'L') + 'L' + f2(G.sx(b)) + ' ' + f2(G.sy(0)) + 'Z';
  }
  function niceStep(raw){ var p = Math.pow(10, Math.floor(Math.log10(raw))), m = raw / p; return (m <= 1 ? 1 : m <= 2 ? 2 : m <= 2.5 ? 2.5 : m <= 5 ? 5 : 10) * p; }
  function ticks(a, b, n){ var s = niceStep((b - a) / n), out = []; for(var v = Math.ceil(a / s - 1e-9) * s; v <= b + 1e-9; v += s) out.push(+v.toPrecision(10)); return { list: out, step: s }; }
  function decs(step){ var s = String(+step.toPrecision(6)); return s.indexOf('.') < 0 ? 0 : s.length - s.indexOf('.') - 1; }
  function minus(s){ return String(s).replace(/^-/, '−'); }
  function txt(x, y, t, cls, anchor){ return '<text x="' + f2(x) + '" y="' + f2(y) + '" class="' + (cls || '') + '" text-anchor="' + (anchor || 'middle') + '">' + esc(t) + '</text>'; }
  function tag(G, x, y, t, cls){
    var w = t.length * 7.3 + 16, h = 22, left = Math.max(2, Math.min(G.W - 2 - w, x - w / 2));
    return '<g class="da-tag ' + (cls || '') + '"><rect x="' + f2(left) + '" y="' + f2(y - h) + '" width="' + f2(w) + '" height="' + h + '" rx="11"/>' + txt(left + w / 2, y - 7, t) + '</g>';
  }
  function xAxis(G, o){
    var out = [], b = G.b, tk = ticks(G.lo, G.hi, G.W < 420 ? 5 : 8), d = Math.max(o.minDec || 0, decs(tk.step));
    out.push('<line class="da-axis" x1="' + f2(G.l) + '" y1="' + f2(b) + '" x2="' + f2(G.r) + '" y2="' + f2(b) + '"/>');
    (o.list || tk.list).forEach(function(v){ var x = G.sx(v); if(x < G.l + 6 || x > G.W - 6) return; if((o.avoid || []).some(function(h){ return Math.abs(h - x) < 22; })) return; out.push('<line class="da-tick" x1="' + f2(x) + '" y1="' + f2(b) + '" x2="' + f2(x) + '" y2="' + f2(b + 5) + '"/>' + txt(x, b + 19, minus(o.list ? String(v) : v.toFixed(d)), 'da-tl')); });
    if(o.z){
      var zb = b + 34;
      for(var k = -4; k <= 4; k++){ var zx = G.sx(o.z.mu + k * o.z.sd); if(zx < G.l + 6 || zx > G.r) continue; out.push('<line class="da-ztick" x1="' + f2(zx) + '" y1="' + f2(zb - 9) + '" x2="' + f2(zx) + '" y2="' + f2(zb - 4) + '"/>' + txt(zx, zb + 7, minus(String(k)), 'da-zl')); }
      out.push(txt(G.l - 6, zb + 7, 'z', 'da-an', 'end'));
    }
    if(o.label) out.push(txt((G.l + G.r) / 2, o.z ? b + 58 : b + 38, o.label, 'da-axl'));
    return out.join('');
  }

  /* The normal picture. v: { mu, sd, mode, a, b, shade, showP, emp, W, H,
     label, hideX, small, noZ } */
  function normalFig(v){
    var mu = v.mu, sd = v.sd, f = function(x){ return D().normPdf(x, mu, sd); }, W = v.W, H = v.H, small = W < 420 || v.small;
    var lo = mu - 3.8 * sd, hi = mu + 3.8 * sd, peak = f(mu);
    var bot = v.noZ ? (v.label ? 42 : 30) : (v.label ? 68 : 52);
    var G = frame({ W: W, H: H, lo: lo, hi: hi, ymax: peak * (v.emp ? 1.42 : 1.16), pad: { l: small ? 24 : 34, r: v.noZ ? 14 : 50, t: 16, b: bot } });
    var out = [], a = v.a, b = v.b, regs = [];
    out.push('<path class="da-under" d="' + areaPath(f, G, G.lo, G.hi) + '"/>');
    if(v.mode === 'less') regs = [[G.lo, b]]; else if(v.mode === 'greater') regs = [[a, G.hi]]; else if(v.mode === 'between') regs = [[a, b]]; else if(v.mode === 'outside') regs = [[G.lo, a], [b, G.hi]];
    if(v.shade) regs.forEach(function(r){ out.push('<path class="da-shade" d="' + areaPath(f, G, r[0], r[1]) + '"/>'); });
    if(v.emp){
      for(var k = -3; k <= 3; k++){ var ex = G.sx(mu + k * sd); out.push('<line class="da-empl' + (k === 0 ? ' is-mid' : '') + '" x1="' + f2(ex) + '" y1="' + f2(G.sy(f(mu + k * sd))) + '" x2="' + f2(ex) + '" y2="' + f2(G.b) + '"/>'); }
      [[1, '68%'], [2, '95%'], [3, '99.7%']].forEach(function(e, i){
        var y = G.sy(peak * (1.08 + i * 0.11)), x1 = G.sx(mu - e[0] * sd), x2 = G.sx(mu + e[0] * sd);
        out.push('<path class="da-brk" d="M' + f2(x1) + ' ' + f2(y + 5) + 'V' + f2(y) + 'H' + f2(x2) + 'V' + f2(y + 5) + '"/>' + txt((x1 + x2) / 2, y - 4, e[1], 'da-brkl'));
      });
    }
    out.push('<path class="da-curve" d="' + curvePath(f, G) + '"/>');
    var bounds = v.mode === 'less' ? [b] : v.mode === 'greater' ? [a] : [a, b];
    bounds.forEach(function(x){ if(x < G.lo || x > G.hi) return; var px = G.sx(x); out.push('<line class="da-bline" x1="' + f2(px) + '" y1="' + f2(G.sy(f(x)) - 10) + '" x2="' + f2(px) + '" y2="' + f2(G.b) + '"/>'); });
    if(v.tags !== false) bounds.forEach(function(x, i){
      if(x < G.lo || x > G.hi) return;
      var t = v.hideX ? 'x = ?' : (v.fmt ? v.fmt(x) : F(x, v.places != null ? v.places : 1));
      var y = G.sy(f(x)) - 14;
      if(bounds.length === 2 && Math.abs(G.sx(bounds[0]) - G.sx(bounds[1])) < 90) y = i ? y : y - 26;
      out.push(tag(G, G.sx(x), Math.max(22, y), t, 'da-btag'));
    });
    if(v.showP && v.shade){
      var p = DA.normal(mu, sd, v.mode === 'outside' ? 'between' : v.mode, a, b).p; if(v.mode === 'outside') p = 1 - p;
      var cx = v.mode === 'less' ? Math.max(G.lo + sd * 0.6, Math.min(b - sd * 0.45, mu)) : v.mode === 'greater' ? Math.min(G.hi - sd * 0.6, Math.max(a + sd * 0.45, mu)) : (a + b) / 2;
      var room = v.mode === 'between' ? (b - a) / sd : v.mode === 'less' ? (b - G.lo) / sd : (G.hi - a) / sd;
      var lbl = P4(p), y0 = G.sy(Math.min(f(cx) * 0.42, peak * 0.4));
      if(room > 1.4 && f(cx) > peak * 0.15) out.push(txt(G.sx(cx), y0, lbl, 'da-parea'));
      else {
        // A thin tail: a leader to the label above it.
        var ix = v.mode === 'less' ? b - sd * 0.25 : a + sd * 0.25, iy = G.sy(f(ix) * 0.3), side = v.mode === 'less' ? -1 : 1;
        var lx = Math.max(40, Math.min(G.W - 40, G.sx(ix) + side * 30)), ly = Math.min(G.sy(peak * 0.5), G.sy(f(ix)) - 30);
        out.push('<path class="da-lead" d="M' + f2(G.sx(ix)) + ' ' + f2(iy) + 'L' + f2(lx) + ' ' + f2(ly + 4) + '"/>' + txt(lx, ly, lbl, 'da-parea', side > 0 ? 'start' : 'end'));
      }
    }
    if(v.yours){
      var Y = v.yours;
      if(Y.lo != null){
        var ylo = Math.max(G.lo, Y.lo), yhi = Math.min(G.hi, Y.hi);
        if(yhi > ylo) out.push('<path class="da-yours-a" d="' + areaPath(f, G, ylo, yhi) + '"/>');
      }
      if(Y.x != null && Y.x > G.lo && Y.x < G.hi){
        var yx = G.sx(Y.x);
        out.push('<line class="stat-yours" x1="' + f2(yx) + '" y1="' + f2(G.t + 26) + '" x2="' + f2(yx) + '" y2="' + f2(G.b) + '"/>');
      }
      if(Y.text){
        var tx0 = Y.x != null ? G.sx(Math.max(G.lo, Math.min(G.hi, Y.x))) : Y.lo != null ? G.sx(Math.max(G.lo, Math.min(G.hi, (Math.max(G.lo, Y.lo) + Math.min(G.hi, Y.hi)) / 2))) : (G.l + G.r) / 2;
        out.push(tag(G, tx0, G.t + 22, 'Yours ' + Y.text, 'da-ytag'));
      }
    }
    out.push(txt(G.sx(mu), G.sy(peak) - 6, 'μ', 'da-cl'));
    out.push(xAxis(G, { minDec: v.places || 0, z: v.noZ ? null : { mu: mu, sd: sd }, label: v.label, avoid: v.handles ? bounds.map(function(x){ return G.sx(x); }) : null }));
    return { svg: out.join(''), G: G };
  }

  /* The binomial picture. v: { n, p, lo, hi, shade, curve, W, H, label, k } */
  function binomFig(v){
    var n = v.n, p = v.p, W = v.W, H = v.H, small = W < 420, pm = [], top = 0, k;
    for(k = 0; k <= n; k++){ pm.push(D().binomPmf(k, n, p)); if(pm[k] > top) top = pm[k]; }
    var mean = n * p, sd = Math.sqrt(n * p * (1 - p));
    // Show the counts that carry the probability (the whole range when n is small).
    var lo = n <= 30 ? -0.5 : Math.max(-0.5, Math.floor(mean - 5 * sd) - 0.5), hi = n <= 30 ? n + 0.5 : Math.min(n + 0.5, Math.ceil(mean + 5 * sd) + 0.5);
    if(v.lo != null){ lo = Math.min(lo, Math.max(-0.5, v.lo - 1.5)); hi = Math.max(hi, Math.min(n + 0.5, (v.hi === n ? v.lo : v.hi) + 1.5)); }
    var G = frame({ W: W, H: H, lo: lo, hi: hi, ymax: top * 1.2, pad: { l: small ? 34 : 44, r: v.small ? 10 : 50, t: 16, b: v.label ? 44 : 30 } });
    var out = [], bw = Math.max(1, (G.sx(1) - G.sx(0)) * 0.78);
    // y gridlines with probability labels
    var yt = ticks(0, top * 1.15, small ? 3 : 4);
    yt.list.forEach(function(y){ if(y <= 0) return; var py = G.sy(y); out.push('<line class="da-grid" x1="' + f2(G.l) + '" y1="' + f2(py) + '" x2="' + f2(G.r) + '" y2="' + f2(py) + '"/>' + txt(G.l - 5, py + 4, String(+y.toFixed(decs(yt.step))), 'da-yl', 'end')); });
    for(k = Math.ceil(lo); k <= Math.floor(hi); k++){
      var x = G.sx(k), y = G.sy(pm[k]), inE = v.shade && v.lo != null && k >= v.lo && k <= v.hi;
      out.push('<rect class="da-bar' + (inE ? ' is-in' : '') + (k === v.k ? ' is-k' : '') + '" x="' + f2(x - bw / 2) + '" y="' + f2(y) + '" width="' + f2(bw) + '" height="' + f2(Math.max(0, G.b - y)) + '" rx="' + (bw > 10 ? 2 : 0) + '"/>');
    }
    if(v.curve){ var fN = function(x){ return D().normPdf(x, mean, sd); }; out.push('<path class="da-ncurve" d="' + curvePath(fN, G, lo, hi) + '"/>'); }
    if(v.barLabels && bw >= 30 && n <= 20) for(k = Math.ceil(lo); k <= Math.floor(hi); k++){ if(pm[k] < 0.0005) continue; out.push(txt(G.sx(k), G.sy(pm[k]) - 5, pm[k].toFixed(3).replace(/^0/, ''), 'da-bl' + (v.shade && v.lo != null && k >= v.lo && k <= v.hi ? ' is-in' : ''))); }
    if(v.showP && v.shade && v.lo != null && v.hi >= v.lo){
      // A bracket over the bars in the event, with their total.
      var s = 0, mx = 0; for(k = v.lo; k <= v.hi; k++){ s += pm[k]; if(pm[k] > mx) mx = pm[k]; }
      var a0 = Math.max(v.lo, Math.ceil(lo)), b0 = Math.min(v.hi, Math.floor(hi)), x1 = G.sx(a0) - bw / 2, x2 = G.sx(b0) + bw / 2, by = Math.max(G.t + 22, G.sy(mx) - (v.barLabels && bw >= 30 && n <= 20 ? 24 : 10));
      out.push('<path class="da-brk is-ev" d="M' + f2(x1) + ' ' + f2(by + 6) + 'V' + f2(by) + 'H' + f2(x2) + 'V' + f2(by + 6) + '"/>');
      out.push(txt(Math.max(G.l + 34, Math.min(G.r - 34, (x1 + x2) / 2)), by - 6, P4(Math.min(1, s)), 'da-parea'));
    }
    if(v.yours){
      if(v.yours.x != null && v.yours.x > lo && v.yours.x < hi){ var yb = G.sx(v.yours.x); out.push('<line class="stat-yours" x1="' + f2(yb) + '" y1="' + f2(G.t + 26) + '" x2="' + f2(yb) + '" y2="' + f2(G.b) + '"/>'); }
      if(v.yours.text) out.push(tag(G, v.yours.x != null ? G.sx(Math.max(lo, Math.min(hi, v.yours.x))) : (G.l + G.r) / 2, G.t + 22, 'Yours ' + v.yours.text, 'da-ytag'));
    }
    out.push(txt(G.l - 5, G.t + 2, 'P(X = k)', 'da-yl da-ylab', 'start'));
    // count axis
    out.push('<line class="da-axis" x1="' + f2(G.l) + '" y1="' + f2(G.b) + '" x2="' + f2(G.r) + '" y2="' + f2(G.b) + '"/>');
    var span = Math.floor(hi) - Math.ceil(lo), every = span <= 12 ? 1 : span <= 25 ? (small ? 5 : 2) : span <= 60 ? 5 : 10;
    for(k = Math.ceil(lo); k <= Math.floor(hi); k++){ if(k % every && k !== v.k) continue; var tx0 = G.sx(k); out.push(txt(tx0, G.b + 17, String(k), 'da-tl' + (k === v.k ? ' is-k' : ''))); }
    if(v.label) out.push(txt((G.l + G.r) / 2, G.b + 37, v.label, 'da-axl'));
    return { svg: out.join(''), G: G, pm: pm };
  }

  function picSvg(pc, k, i){
    var id = 'dap' + (++uid) + '-' + i, a = isFinite(pc.a) ? pc.a : pc.b, b = isFinite(pc.b) ? pc.b : pc.a;
    var v = { mu: pc.mu, sd: pc.sd, mode: k === 'height' ? 'none' : k, a: a, b: b, shade: k !== 'height', W: 260, H: 100, noZ: true, tags: false, small: true };
    var r = normalFig(v), extra = '';
    if(k === 'height'){ var G = r.G, x = k === 'height' ? (isFinite(pc.b) ? pc.b : pc.a) : 0, px = G.sx(x), py = G.sy(D().normPdf(x, pc.mu, pc.sd)); extra = '<line class="da-hline" x1="' + f2(px) + '" y1="' + f2(G.b) + '" x2="' + f2(px) + '" y2="' + f2(py) + '"/><circle class="da-hdot" cx="' + f2(px) + '" cy="' + f2(py) + '" r="5"/>'; }
    var names = { less: 'the area to the left of the boundary', greater: 'the area to the right of the boundary', between: 'the area between the two boundaries', outside: 'the area outside the two boundaries', height: 'the height of the curve at the boundary' };
    return '<svg class="da-pic" id="' + id + '" viewBox="0 0 260 100" role="img" aria-label="Normal curve showing ' + names[k] + '">' + r.svg + extra + '</svg>';
  }

  // The problem text is also the plain caption: H₀ and Hₐ read as letters there.
  function hText(t){ return String(t).replace(/\$H_0\$/g, 'H₀').replace(/\$H_a\$/g, 'Hₐ').replace(/\$H_0: /g, 'H₀: $').replace(/\$H_a: /g, 'Hₐ: $'); }
  function texify(p){
    var q = {}; for(var k in p) q[k] = p[k];
    q.text = tx(hText(p.text)); q.solution = p.solution.map(tx);
    q.steps = p.steps.map(function(s){
      var t = {}; for(var k2 in s) t[k2] = s[k2];
      t.label = tx(s.label); if(s.hint) t.hint = tx(s.hint);
      if(s.options) t.options = s.options.map(tx);
      if(s.why) t.why = s.why.map(tx);
      if(s.cell){ t.cell = {}; for(var k3 in s.cell) t.cell[k3] = s.cell[k3]; t.cell.mistakes = s.cell.mistakes.map(function(m){ return { value: m.value, why: tx(m.why) }; }); }
      if(s.pics) t.optionsHtml = s.pics.list.map(function(k, i){ return picSvg(s.pics, k, i); });
      return t;
    });
    return q;
  }

  /* ================================================================ EXPLORE */
  function fit(box, draw){
    var w0 = 0, h0 = 0, pending = false;
    function go(){ pending = false; var w = Math.round(box.clientWidth), h = Math.round(box.clientHeight); if(w < 50 || h < 50) return; if(w === w0 && h === h0) return; w0 = w; h0 = h; draw(w, h); }
    function later(){ if(pending) return; pending = true; (window.requestAnimationFrame || setTimeout)(go); }
    if(window.ResizeObserver) new ResizeObserver(later).observe(box);
    window.addEventListener('resize', later);
    later();
    return { redraw: function(){ if(w0) draw(w0, h0); }, size: function(){ return [w0, h0]; } };
  }
  function seg(label, items, value, onPick, cls){
    var g = el('div', 'da-segw');
    g.innerHTML = (label ? '<span class="da-seglab" aria-hidden="true">' + label + '</span>' : '') + '<div class="' + (cls || 'ls-seg') + ' da-seg" role="group" aria-label="' + esc(label || 'Choose') + '">' + items.map(function(it){
      return '<button type="button" class="' + (cls ? 'tchip' : '') + '" data-v="' + esc(it.value) + '" aria-pressed="' + (it.value === value) + '">' + it.label + '</button>';
    }).join('') + '</div>';
    g.addEventListener('click', function(e){ var b = e.target.closest('button[data-v]'); if(!b) return; set(b.getAttribute('data-v')); onPick(b.getAttribute('data-v')); });
    function set(v){ g.querySelectorAll('button[data-v]').forEach(function(b){ var on = b.getAttribute('data-v') === String(v); b.setAttribute('aria-pressed', String(on)); b.classList.toggle('on', on && !!cls); }); }
    set(value);
    return { el: g, set: set };
  }
  function handleEl(cls){ return '<g class="da-handle ' + cls + '" tabindex="0" role="slider"><circle class="da-hit" r="24"/><circle class="da-halo" r="15"/><circle class="da-dot" r="8"/></g>'; }

  function explore(host, data){
    var id = 'da' + (++uid), ex = data.explore || {}, NS = ex.normal || [], BS = ex.binomial || [];
    if(!NS.length && !BS.length){ host.innerHTML = '<p class="bt-small">The explore studies arrive with their unit.</p>'; return { studio: function(){} }; }
    var S = { dist: NS.length ? 'normal' : 'binom', ns: null, mu: 0, sd: 1, mode: 'greater', a: 0, b: 0, emp: false, bs: null, n: 10, p: 0.5, rel: 'atMost', k: 3, curve: false, touched: false };
    host.innerHTML = '<section class="bt-problem da-ex" aria-labelledby="' + id + '-h"><h2 id="' + id + '-h" class="sr-only">Explore: areas under a distribution</h2>' +
      '<div class="da-stage"><div class="da-fig"><svg class="da-svg" role="group" aria-labelledby="' + id + '-t"><title id="' + id + '-t">Distribution</title><g class="da-layer"></g>' + handleEl('da-h1') + handleEl('da-h2') + '</svg></div><p class="sr-only da-live"></p></div>' +
      '<div class="da-dock"><div class="da-dists"></div><div class="da-dn"></div><div class="da-db" hidden></div></div>' +
      '<div class="da-why"></div><div class="da-det"></div></section>';
    var LS = null;
    var q = function(s){ return host.querySelector(s) || (LS ? LS.root.querySelector(s) : null); };
    var svg = q('.da-svg'), layer = q('.da-layer'), h1 = q('.da-h1'), h2 = q('.da-h2'), title = q('#' + id + '-t'), live = T.announcer(q('.da-live'));
    var start = T.cue('Drag the boundary along the axis and read the shaded probability.');
    q('.da-dock').insertBefore(start.el, q('.da-dock').firstChild);
    function act(){ if(!S.touched){ S.touched = true; start.done(); } }

    var items = []; if(NS.length) items.push({ value: 'normal', label: 'Normal' }); if(BS.length) items.push({ value: 'binom', label: 'Binomial' });
    var distSeg = seg('', items, S.dist, function(v){ act(); setDist(v); });
    if(items.length > 1) q('.da-dists').appendChild(distSeg.el);
    // Normal controls
    var modeSeg = seg('Region', [{ value: 'less', label: 'Less than' }, { value: 'between', label: 'Between' }, { value: 'greater', label: 'Greater than' }], S.mode, function(v){ act(); setMode(v); });
    q('.da-dn').appendChild(modeSeg.el);
    var empB = el('button', 'bt-btn da-empb', '68-95-99.7 rule'); empB.type = 'button'; empB.setAttribute('aria-pressed', 'false');
    empB.addEventListener('click', function(){ act(); S.emp = !S.emp; empB.setAttribute('aria-pressed', String(S.emp)); draw(); });
    var nrow = el('div', 'da-row'); nrow.appendChild(empB); q('.da-dn').appendChild(nrow);
    // Binomial controls
    var relSeg = seg('Event', [{ value: 'atMost', label: 'at most' }, { value: 'fewer', label: 'fewer than' }, { value: 'exactly', label: 'exactly' }, { value: 'atLeast', label: 'at least' }, { value: 'more', label: 'more than' }], S.rel, function(v){ act(); S.rel = v; buildK(); draw(); }, 'da-chips');
    q('.da-db').appendChild(relSeg.el);
    var kBox = el('div', 'da-kbox'); q('.da-db').appendChild(kBox);
    var kSl = null;
    var curB = el('button', 'bt-btn da-curb', 'Normal shape'); curB.type = 'button'; curB.setAttribute('aria-pressed', 'false');
    curB.addEventListener('click', function(){ act(); S.curve = !S.curve; curB.setAttribute('aria-pressed', String(S.curve)); draw(); });
    var setupB = el('button', 'ls-linkrow da-setup', '<span><span class="ls-k">Setup</span> <span class="ls-v"></span></span>'); setupB.type = 'button';
    setupB.addEventListener('click', function(){ if(LS) LS.open('details', det.querySelector('.da-bpick select')); });
    var brow = el('div', 'da-row'); brow.appendChild(curB); q('.da-db').appendChild(brow); q('.da-db').appendChild(setupB);
    var nSetup = el('button', 'ls-linkrow da-setup', '<span><span class="ls-k">Setup</span> <span class="ls-v"></span></span>'); nSetup.type = 'button';
    nSetup.addEventListener('click', function(){ if(LS) LS.open('details', det.querySelector('.da-npick select')); });
    q('.da-dn').appendChild(nSetup);

    /* --- Details --- */
    var det = q('.da-det');
    det.innerHTML = '<div class="da-detn"><h3 class="ls-title-l">Normal</h3><div class="da-npick"></div><div class="da-musd"></div><h3 class="ls-title-l">A boundary from an area</h3><p class="bt-small">The inverse normal: pick the area to the left and the boundary moves there (the region becomes "less than").</p><div class="da-inv"></div></div>' +
      '<div class="da-detb"><h3 class="ls-title-l">Binomial</h3><div class="da-bpick"></div><div class="da-np"></div></div><h3 class="ls-title-l">Every number</h3><div class="da-nums"></div>';
    var npick = NS.length ? T.choiceSelect({ label: 'Normal study', options: NS.map(function(s){ return { value: s.id, label: s.name }; }), value: NS[0].id, onChange: function(v){ act(); setNs(NS.filter(function(s){ return s.id === v; })[0]); } }) : null;
    if(npick) det.querySelector('.da-npick').appendChild(npick.el);
    var bpick = BS.length ? T.choiceSelect({ label: 'Binomial study', options: BS.map(function(s){ return { value: s.id, label: s.name }; }), value: BS[0].id, onChange: function(v){ act(); setBs(BS.filter(function(s){ return s.id === v; })[0]); } }) : null;
    if(bpick) det.querySelector('.da-bpick').appendChild(bpick.el);
    var muSl, sdSl, invSl, nSl, pSl;
    function buildMuSd(){
      var c = S.ns, box = det.querySelector('.da-musd'); box.innerHTML = '';
      var st = c.grid || 1;
      muSl = T.slider({ label: 'Mean μ (' + c.units + ')', min: M.round(c.mu - 4 * c.sd, 2), max: M.round(c.mu + 4 * c.sd, 2), step: st, value: S.mu, decimals: c.places, onInput: function(v){ act(); S.mu = v; clampAB(); draw(); } });
      sdSl = T.slider({ label: 'Standard deviation σ (' + c.units + ')', min: Math.max(st, M.round(c.sd / 3, c.places)), max: M.round(c.sd * 2, c.places), step: st / (c.places ? 1 : 1), value: S.sd, decimals: c.places, onInput: function(v){ act(); S.sd = v; clampAB(); draw(); } });
      box.appendChild(muSl.el); box.appendChild(sdSl.el);
      var ib = det.querySelector('.da-inv'); ib.innerHTML = '';
      invSl = T.slider({ label: 'Area to the left', min: 0.01, max: 0.99, step: 0.01, value: 0.5, decimals: 2, onInput: function(v){ act(); var r = DA.inverse(S.mu, S.sd, v, 'left'); S.mode = 'less'; modeSeg.set('less'); S.b = r.x; draw(); } });
      ib.appendChild(invSl.el);
    }
    function buildNP(){
      var box = det.querySelector('.da-np'); box.innerHTML = '';
      nSl = T.slider({ label: 'Number of trials n', min: 1, max: 60, step: 1, value: S.n, onInput: function(v){ act(); S.n = v; buildK(); draw(); } });
      pSl = T.slider({ label: 'Probability of success p', min: 0.01, max: 0.99, step: 0.01, value: S.p, decimals: 2, onInput: function(v){ act(); S.p = v; draw(); } });
      box.appendChild(nSl.el); box.appendChild(pSl.el);
    }
    /* "Fewer than 0" and "more than n" hold no counts: k stays where the event exists. */
    function kRange(){ return [S.rel === 'fewer' ? 1 : 0, S.rel === 'more' ? Math.max(0, S.n - 1) : S.n]; }
    function clampK(){ var r = kRange(); S.k = Math.max(r[0], Math.min(r[1], S.k)); }
    function buildK(){
      clampK();
      var r = kRange();
      kSl = T.slider({ label: 'Boundary count k', min: r[0], max: r[1], step: 1, value: S.k, onInput: function(v){ act(); S.k = v; draw(); } });
      kBox.innerHTML = ''; kBox.appendChild(kSl.el);
    }
    function clampAB(){ var lo = S.mu - 3.6 * S.sd, hi = S.mu + 3.6 * S.sd; S.a = Math.max(lo, Math.min(hi, S.a)); S.b = Math.max(lo, Math.min(hi, S.b)); if(S.mode === 'between' && S.a > S.b){ var t = S.a; S.a = S.b; S.b = t; } }
    function setNs(c){ S.ns = c; S.mu = c.mu; S.sd = c.sd; S.a = c.a; S.b = c.b; S.mode = c.mode; modeSeg.set(c.mode); if(npick) npick.set(c.id); buildMuSd(); draw(); }
    function setBs(c){ S.bs = c; S.n = c.n; S.p = c.p; S.k = c.k; S.rel = c.rel; relSeg.set(c.rel); if(bpick) bpick.set(c.id); buildNP(); buildK(); draw(); }
    function setMode(m){
      S.mode = m;
      if(m === 'between' && !(S.a < S.b)){ S.a = S.mu - S.sd; S.b = S.mu + S.sd; }
      draw();
    }
    function setDist(v){
      S.dist = v; distSeg.set(v);
      q('.da-dn').hidden = v !== 'normal'; q('.da-db').hidden = v !== 'binom';
      det.querySelector('.da-detn').hidden = v !== 'normal'; det.querySelector('.da-detb').hidden = v !== 'binom';
      if(LS && LS.hint && v === 'binom' && kSl) {}
      draw();
    }

    /* --- handles --- */
    var G = null, drag = null;
    function snap(x){ var g = (S.ns && S.ns.grid) || 0.1; return M.round(Math.round(x / g * 10) / 10 * g, 4); }
    function nearest(px){
      if(S.dist === 'binom') return 'k';
      if(S.mode === 'less') return 'b'; if(S.mode === 'greater') return 'a';
      return Math.abs(px - G.sx(S.a)) <= Math.abs(px - G.sx(S.b)) ? 'a' : 'b';
    }
    function setFromPx(which, px){
      var v = G.ix(px);
      if(which === 'k'){ var kr = kRange(); S.k = Math.max(kr[0], Math.min(kr[1], Math.round(v))); kSl.set(S.k); }
      else {
        var lo = S.mu - 3.6 * S.sd, hi = S.mu + 3.6 * S.sd, x = Math.max(lo, Math.min(hi, snap(v)));
        if(which === 'a'){ S.a = S.mode === 'between' ? Math.min(x, S.b - (S.ns.grid || 0.1)) : x; }
        else { S.b = S.mode === 'between' ? Math.max(x, S.a + (S.ns.grid || 0.1)) : x; }
      }
      draw();
    }
    function local(e){ var r = svg.getBoundingClientRect(); return (e.clientX - r.left) * (G ? G.W / Math.max(1, r.width) : 1); }
    svg.addEventListener('pointerdown', function(e){
      if(!G) return;
      act(); var px = local(e); drag = e.target.closest('.da-h2') ? (S.dist === 'binom' ? 'k' : 'b') : e.target.closest('.da-h1') ? (S.dist === 'binom' ? 'k' : (S.mode === 'less' ? 'b' : 'a')) : nearest(px);
      try{ svg.setPointerCapture(e.pointerId); }catch(err){}
      svg.classList.add('is-drag'); setFromPx(drag, px); e.preventDefault();
    });
    svg.addEventListener('pointermove', function(e){ if(drag) setFromPx(drag, local(e)); });
    function up(){ if(!drag) return; drag = null; svg.classList.remove('is-drag'); say(true); }
    svg.addEventListener('pointerup', up); svg.addEventListener('pointercancel', up);
    function keyOn(h, which){
      h.addEventListener('keydown', function(e){
        var k = e.key, big = e.shiftKey || k === 'PageUp' || k === 'PageDown' ? 10 : 1, dir = 0;
        if(k === 'ArrowRight' || k === 'ArrowUp' || k === 'PageUp') dir = 1; else if(k === 'ArrowLeft' || k === 'ArrowDown' || k === 'PageDown') dir = -1; else return;
        e.preventDefault(); act();
        var w = which();
        if(w === 'k'){ var kr2 = kRange(); S.k = Math.max(kr2[0], Math.min(kr2[1], S.k + dir * (big > 1 ? 5 : 1))); kSl.set(S.k); }
        else {
          var g = (S.ns.grid || 0.1) * big, lo = S.mu - 3.6 * S.sd, hi = S.mu + 3.6 * S.sd;
          if(w === 'a') S.a = Math.max(lo, Math.min(S.mode === 'between' ? S.b - S.ns.grid : hi, M.round(S.a + dir * g, 4)));
          else S.b = Math.min(hi, Math.max(S.mode === 'between' ? S.a + S.ns.grid : lo, M.round(S.b + dir * g, 4)));
        }
        draw(); say(true);
      });
    }
    keyOn(h1, function(){ return S.dist === 'binom' ? 'k' : S.mode === 'less' ? 'b' : 'a'; });
    keyOn(h2, function(){ return 'b'; });

    /* --- drawing --- */
    var sized = null;
    function evTex(){
      var c = S.ns, d = c.places;
      return S.mode === 'less' ? 'X < ' + F(S.b, d) : S.mode === 'greater' ? 'X > ' + F(S.a, d) : F(S.a, d) + ' < X < ' + F(S.b, d);
    }
    function draw(){
      if(!sized) return;
      var wh = sized.size(); if(!wh[0]) return;
      var W = wh[0], H = wh[1];
      svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H); svg.setAttribute('width', W); svg.setAttribute('height', H);
      if(S.dist === 'binom') clampK();
      if(S.dist === 'normal'){
        var c = S.ns, r = normalFig({ mu: S.mu, sd: S.sd, mode: S.mode, a: S.a, b: S.b, shade: true, showP: true, emp: S.emp, W: W, H: H, handles: true, label: c.var.charAt(0).toUpperCase() + c.var.slice(1) + ' (' + c.units + ')', places: c.places });
        layer.innerHTML = r.svg; G = r.G;
        var hs = S.mode === 'less' ? [S.b] : S.mode === 'greater' ? [S.a] : [S.a, S.b];
        h1.setAttribute('transform', 'translate(' + f2(G.sx(hs[0])) + ' ' + f2(G.b) + ')'); h1.style.display = '';
        h2.style.display = hs.length > 1 ? '' : 'none';
        if(hs.length > 1) h2.setAttribute('transform', 'translate(' + f2(G.sx(hs[1])) + ' ' + f2(G.b) + ')');
        var res = DA.normal(S.mu, S.sd, S.mode, S.a, S.b);
        h1.setAttribute('aria-label', hs.length > 1 ? 'Lower boundary' : 'Boundary'); h1.setAttribute('aria-valuetext', F(hs[0], c.places) + ' ' + c.units + ', probability ' + P4(res.p));
        h2.setAttribute('aria-label', 'Upper boundary'); h2.setAttribute('aria-valuetext', F(S.b, c.places) + ' ' + c.units + ', probability ' + P4(res.p));
        tellN(res);
      } else {
        var b = DA.binom(S.n, S.p, S.rel, S.k), bs = S.bs;
        var rb = binomFig({ n: S.n, p: S.p, lo: b.lo, hi: b.hi, shade: true, showP: true, curve: S.curve, W: W, H: H, barLabels: true, label: bs ? 'X = ' + bs.X : 'X', k: S.k });
        layer.innerHTML = rb.svg; G = rb.G;
        h1.setAttribute('transform', 'translate(' + f2(G.sx(S.k)) + ' ' + f2(G.b) + ')'); h1.style.display = ''; h2.style.display = 'none';
        h1.setAttribute('aria-label', 'Boundary count k'); h1.setAttribute('aria-valuetext', 'k = ' + S.k + ', probability ' + P4(b.p));
        tellB(b);
      }
      numbers();
    }
    function tellN(res){
      var c = S.ns, d = c.places, u = ' ' + c.units, ev = evTex(), pct = res.p * 100;
      var words = c.who + ' have a ' + c.var + (S.mode === 'less' ? ' below ' + F(S.b, d) + u : S.mode === 'greater' ? ' above ' + F(S.a, d) + u : ' between ' + F(S.a, d) + ' and ' + F(S.b, d) + u);
      if(LS){
        LS.caption((/^(more|less)/.test(PCT(res.p)) ? cap1(PCT(res.p)) : 'About ' + PCT(res.p)) + '% of ' + esc(words) + ': ' + tx('$P(' + ev + ') ' + EQ(res.p) + '$') + '.', 'explore');
        var zp = S.mode === 'between' ? [{ k: 'z', html: minus(F(res.za, 2)) + ' to ' + minus(F(res.zb, 2)), tone: 'ghost' }] : [{ k: 'z', html: minus(F(S.mode === 'less' ? res.zb : res.za, 2)), tone: 'ghost' }];
        LS.pills([{ k: esc(plainEv(ev)), html: P4(res.p), tone: 'readout' }].concat(zp), 'left', 'explore');
      }
      nSetup.querySelector('.ls-v').textContent = 'μ = ' + F(S.mu, d) + ', σ = ' + F(S.sd, d) + ' ' + c.units;
      title.textContent = 'Normal curve with mean ' + F(S.mu, d) + ' and SD ' + F(S.sd, d) + ', the region ' + ev.replace('<', 'less than').replace('>', 'greater than') + ' shaded';
      whyN(res);
    }
    function tellB(b){
      var rel = S.rel, k = S.k, eq = b.lo === 0 ? 'X \\le ' + b.hi : b.hi === S.n && rel !== 'exactly' ? 'X \\ge ' + b.lo : 'X = ' + b.lo;
      if(b.hi < b.lo) eq = '\\text{no counts}';
      var shown = { atMost: 'X \\le ' + k, fewer: 'X < ' + k, exactly: 'X = ' + k, atLeast: 'X \\ge ' + k, more: 'X > ' + k }[rel];
      var same = shown === eq;
      if(LS){
        LS.caption('<b>' + esc(b.words.charAt(0).toUpperCase() + b.words.slice(1)) + ' ' + k + '</b> means ' + tx('$' + (same ? eq : shown + '$, that is $' + eq) + '$') + ': ' + tx('$P ' + EQ(b.p) + '$') + '.', 'explore');
        LS.pills([{ k: esc(plainEv(shown)), html: P4(b.p), tone: 'readout' }, { k: 'mean', html: F(b.mean, 2), tone: 'ghost' }], 'left', 'explore');
      }
      setupB.querySelector('.ls-v').textContent = 'n = ' + S.n + ', p = ' + F(S.p, 2);
      title.textContent = 'Binomial distribution with n = ' + S.n + ' and p = ' + F(S.p, 2) + ', counts ' + b.lo + ' to ' + b.hi + ' shaded';
      whyB(b, eq);
    }
    function say(now){
      var t;
      if(S.dist === 'normal'){ var r = DA.normal(S.mu, S.sd, S.mode, S.a, S.b); t = 'Probability ' + P4(r.p) + ' for ' + evTex().replace('<', 'less than').replace('>', 'greater than') + '.'; }
      else { var b = DA.binom(S.n, S.p, S.rel, S.k); t = b.words + ' ' + S.k + ': counts ' + b.lo + ' to ' + b.hi + ', probability ' + P4(b.p) + '.'; }
      live(t, now);
    }

    /* --- Why: the work as the exam wants it --- */
    function openWhy(){ var d = whyEl.querySelector('details.bt-why'); if(d) d.open = true; }
    var whyEl = q('.da-why');
    function whyN(res){
      var c = S.ns, d = c.places, ev = evTex(), Dd = D();
      var zline = S.mode === 'between' ? '$z = \\frac{' + F(S.a, d) + ' - ' + F(S.mu, d) + '}{' + F(S.sd, d) + '} = ' + texN(res.za) + '$ and $z = \\frac{' + F(S.b, d) + ' - ' + F(S.mu, d) + '}{' + F(S.sd, d) + '} = ' + texN(res.zb) + '$'
        : '$z = \\frac{' + F(S.mode === 'less' ? S.b : S.a, d) + ' - ' + F(S.mu, d) + '}{' + F(S.sd, d) + '} = ' + texN(S.mode === 'less' ? res.zb : res.za) + '$';
      var pline = S.mode === 'less' ? '$P(' + ev + ') = P(Z < ' + texN(res.zb) + ') ' + EQ(res.p) + '$'
        : S.mode === 'greater' ? '$P(' + ev + ') = P(Z > ' + texN(res.za) + ') = 1 - ' + DA.P4(Dd.normCdf(res.za)) + ' ' + EQ(res.p) + '$'
        : '$P(' + ev + ') = ' + DA.P4(Dd.normCdf(res.zb)) + ' - ' + DA.P4(Dd.normCdf(res.za)) + ' ' + EQ(res.p) + '$';
      var body = '<ol class="da-work"><li>' + tx('<b>Name the distribution and its parameters.</b> $X$ = ' + c.var + ', normal with $\\mu = ' + F(S.mu, d) + '$ and $\\sigma = ' + F(S.sd, d) + '$ ' + c.units + '.') + '</li>' +
        '<li>' + tx('<b>Boundary and direction.</b> The event is $' + ev + '$: the area ' + (S.mode === 'less' ? 'to the left of ' + F(S.b, d) : S.mode === 'greater' ? 'to the right of ' + F(S.a, d) : 'between ' + F(S.a, d) + ' and ' + F(S.b, d)) + '.') + '</li>' +
        '<li>' + tx('<b>Standardize.</b> ' + zline + '.') + '</li>' +
        '<li>' + tx('<b>The area.</b> ' + pline + '. Table A, with z to two places, gives ' + P4(res.pTable) + '.') + '</li></ol>' +
        '<p class="bt-small">' + tx('For a normal variable $P(X < x)$ and $P(X \\le x)$ are equal: a single value has probability 0. Calculator syntax alone, like normalcdf(...), is not work; name the distribution, the parameters, the boundary and the direction.') + '</p>' +
        (S.emp ? '<p>' + tx('<b>The 68-95-99.7 rule</b> is an approximation: the exact areas within 1, 2 and 3 standard deviations are 0.6827, 0.9545 and 0.9973.') + '</p>' : '');
      T.explain(whyEl, 'A normal probability is an area: find the boundary in z-scores, then the area on the side the question asks for.', body); openWhy();
    }
    function whyB(b, eq){
      var n = S.n, p = S.p, q1 = M.round(1 - p, 4);
      var how = b.lo === 0 ? '$P(X \\le ' + b.hi + ')$ adds the bars from 0 to ' + b.hi + ' (technology: the binomial cdf).'
        : b.hi === n && S.rel !== 'exactly' ? '$P(X \\ge ' + b.lo + ') = 1 - P(X \\le ' + (b.lo - 1) + ')$: technology adds from 0, so take the complement.'
        : '$P(X = ' + b.lo + ') = \\binom{' + n + '}{' + b.lo + '}(' + F(p, 2) + ')^{' + b.lo + '}(' + q1 + ')^{' + (n - b.lo) + '}$, one bar.';
      var body = '<ol class="da-work"><li>' + tx('<b>Name the distribution and its parameters.</b> $X$ = ' + (S.bs ? S.bs.X : 'the count') + ', binomial with $n = ' + n + '$ and $p = ' + F(p, 2) + '$.') + '</li>' +
        '<li>' + tx('<b>Words to symbols.</b> "' + b.words + ' ' + S.k + '" is $' + eq + '$' + (S.rel === 'fewer' ? ': ' + S.k + ' itself is left out.' : S.rel === 'more' ? ': ' + S.k + ' itself is left out.' : S.rel === 'exactly' ? '.' : ': ' + S.k + ' itself is included.')) + '</li>' +
        '<li>' + tx('<b>The probability.</b> ' + how + ' $' + EQ(b.p) + '$.') + '</li>' +
        '<li>' + tx('<b>Center and spread.</b> $\\mu_X = np = ' + F(b.mean, 2) + '$, $\\sigma_X = \\sqrt{np(1 - p)} = ' + F(b.sd, 3) + '$.') + '</li></ol>' +
        '<p class="bt-small">' + tx('"Fewer than" and "more than" leave the boundary out; "at most" and "at least" keep it. For counts this changes the answer; the reader report names it as a common slip.') + '</p>' +
        (S.curve ? '<p>' + tx('The dashed curve is the normal shape with the same mean and SD, drawn only to compare shapes. With $np$ and $n(1 - p)$ both large the bars follow it closely; every probability here is still the exact binomial one.') + '</p>' : '');
      T.explain(whyEl, 'A binomial probability adds bars: translate the words into the counts they include, then add those bars.', body); openWhy();
    }
    function plainEv(e){ return 'P(' + e.replace(/\\le/g, '≤').replace(/\\ge/g, '≥').replace(/\s+/g, ' ').trim() + ')'; }
    function texN(z){ var s = F(z, 2); return s.charAt(0) === '−' || s.charAt(0) === '-' ? '{-' + s.slice(1) + '}' : s; }

    function numbers(){
      var h;
      if(S.dist === 'normal'){
        var c = S.ns, d = c.places, r = DA.normal(S.mu, S.sd, S.mode, S.a, S.b);
        h = '<table class="ls-tbl"><tbody><tr><th scope="row">Distribution</th><td>Normal, μ = ' + F(S.mu, d) + ', σ = ' + F(S.sd, d) + ' ' + esc(c.units) + '</td></tr>' +
          '<tr><th scope="row">Event</th><td>' + tx('$' + evTex() + '$') + '</td></tr>' +
          (S.mode !== 'less' ? '<tr><th scope="row">z of ' + F(S.a, d) + '</th><td>' + minus(F(r.za, 3)) + '</td></tr>' : '') +
          (S.mode !== 'greater' ? '<tr><th scope="row">z of ' + F(S.b, d) + '</th><td>' + minus(F(r.zb, 3)) + '</td></tr>' : '') +
          '<tr><th scope="row">Technology</th><td>' + P4(r.p) + '</td></tr><tr><th scope="row">Table A</th><td>' + P4(r.pTable) + '</td></tr></tbody></table>';
      } else {
        var b = DA.binom(S.n, S.p, S.rel, S.k), rows = '';
        for(var k = b.lo; k <= b.hi && k - b.lo < 12; k++) rows += '<tr><td>' + k + '</td><td>' + P4(D().binomPmf(k, S.n, S.p)) + '</td></tr>';
        if(b.hi - b.lo >= 12) rows += '<tr><td colspan="2">… ' + (b.hi - b.lo - 11) + ' more counts</td></tr>';
        h = '<table class="ls-tbl"><tbody><tr><th scope="row">Distribution</th><td>Binomial, n = ' + S.n + ', p = ' + F(S.p, 2) + '</td></tr><tr><th scope="row">Counts</th><td>' + b.lo + ' to ' + b.hi + '</td></tr><tr><th scope="row">Probability</th><td>' + P4(b.p) + '</td></tr><tr><th scope="row">Mean, SD</th><td>' + F(b.mean, 2) + ', ' + F(b.sd, 3) + '</td></tr></tbody></table>' +
          '<table class="ls-tbl da-pmf"><caption>The bars in the event</caption><thead><tr><th scope="col">k</th><th scope="col">P(X = k)</th></tr></thead><tbody>' + rows + '</tbody></table>';
      }
      q('.da-nums').innerHTML = h;
    }

    function studio(pane, s){
      LS = s;
      if(s.detailsTitle) s.detailsTitle('Studies & numbers');
      var o = { mode: 'explore' };
      var stage = el('div', 'da-ls-stage'); stage.appendChild(q('.da-stage')); s.add('stage', stage, o);
      var dock = q('.da-dock'); dock.classList.add('da-ls-dock'); s.add('dock', dock, o);
      var w = el('div', 'ls-sec da-ls-why'); w.appendChild(start.el); w.appendChild(whyEl); s.add('why', w, o);
      var d = el('div', 'ls-sec da-ls-det'); d.appendChild(det);
      Array.prototype.slice.call(pane.querySelectorAll(':scope > *')).forEach(function(k){ if(k.textContent.trim() && !k.classList.contains('da-ex')) d.appendChild(k); });
      s.add('details', d, o);
      boot();
      if(s.mode() === 'explore') s.hint({ target: h1, text: 'Drag the boundary' });
    }
    function boot(){
      sized = fit(q('.da-fig'), function(){ draw(); });
      if(BS.length) setBs(BS[0]);
      if(NS.length) setNs(NS[0]);
      setDist(S.dist);
    }
    if(!(window.LevlStudio && T.studioOf(host))) boot();
    return { studio: studio };
  }

  /* ================================================================ QUIZ */
  function quizFigure(host, p, api){
    var fg = p.fig;
    if(!fg) return;
    var box = el('div', 'da-qfig');
    box.innerHTML = '<svg class="da-svg" role="img"><title></title><g class="da-layer"></g>' + handleEl('da-qh') + '</svg>';
    host.appendChild(box);
    var svg = box.querySelector('svg'), layer = box.querySelector('.da-layer'), title = box.querySelector('title'), hq = box.querySelector('.da-qh');
    var st = { shade: fg.kind === 'normal' && !!fg.hideX, showP: !!fg.hideX, x: false, emp: false, yours: null, drag: false, at: null }, G = null;
    hq.style.display = 'none';
    function draw(w, h){
      svg.setAttribute('viewBox', '0 0 ' + w + ' ' + h); svg.setAttribute('width', w); svg.setAttribute('height', h);
      if(fg.kind === 'binom'){
        var rb = binomFig({ n: fg.n, p: fg.p, lo: fg.lo, hi: fg.hi, shade: st.shade, showP: st.showP, W: w, H: h, label: fg.label, yours: st.yours });
        layer.innerHTML = rb.svg; G = rb.G;
        title.textContent = 'Binomial distribution with n = ' + fg.n + ' and p = ' + fg.p + (st.shade ? ', the event shaded' : '') + (st.yours && st.yours.text ? '. Your answer: ' + st.yours.text : '');
      } else {
        var a = isFinite(fg.a) ? fg.a : fg.b, b = isFinite(fg.b) ? fg.b : fg.a;
        // Dragging the boundary (inverse problem): the region follows the student's x.
        if(st.drag && st.at != null){ a = st.at; b = st.at; }
        var r = normalFig({ mu: fg.mu, sd: fg.sd, mode: fg.mode, a: a, b: b, shade: st.shade || fg.emp && st.emp || st.drag, showP: (st.showP || st.drag) && !fg.emp, emp: fg.emp && st.emp, W: w, H: h, label: fg.label, hideX: fg.hideX && !st.x && !(st.drag && st.at != null), places: fg.places != null ? fg.places + (st.drag ? 1 : 0) : 1, tags: fg.emp ? st.emp : true, yours: st.yours });
        layer.innerHTML = r.svg; G = r.G;
        title.textContent = 'Normal curve with mean ' + fg.mu + ' and standard deviation ' + fg.sd + (st.yours && st.yours.text ? '. Your answer: ' + st.yours.text : '');
        if(st.drag){
          var hx = st.at != null ? st.at : fg.mu;
          hq.style.display = ''; hq.setAttribute('transform', 'translate(' + f2(G.sx(hx)) + ' ' + f2(G.b) + ')');
          hq.setAttribute('aria-label', 'Boundary: drag to set ' + (fg.label || 'x')); hq.setAttribute('aria-valuetext', st.at != null ? F(st.at, (fg.places || 0) + 1) : 'not set');
        } else hq.style.display = 'none';
      }
    }
    var sized = fit(box, draw);
    function setAt(px){
      if(!G) return;
      var dp = (fg.places || 0) + 1, lo = fg.mu - 3.6 * fg.sd, hi = fg.mu + 3.6 * fg.sd;
      st.at = Math.max(lo, Math.min(hi, M.round(G.ix(px), dp)));
      st.yours = null; sized.redraw();
      if(api.answer) api.answer(st.at, dp);
    }
    function local(e){ var rc = svg.getBoundingClientRect(); return (e.clientX - rc.left) * (G ? G.W / Math.max(1, rc.width) : 1); }
    var dragging = false;
    svg.addEventListener('pointerdown', function(e){ if(!st.drag) return; dragging = true; svg.classList.add('is-drag'); try{ svg.setPointerCapture(e.pointerId); }catch(x){} setAt(local(e)); e.preventDefault(); });
    svg.addEventListener('pointermove', function(e){ if(dragging) setAt(local(e)); });
    function up(){ dragging = false; svg.classList.remove('is-drag'); }
    svg.addEventListener('pointerup', up); svg.addEventListener('pointercancel', up);
    hq.addEventListener('keydown', function(e){
      if(!st.drag) return;
      var dir = e.key === 'ArrowRight' || e.key === 'ArrowUp' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowDown' ? -1 : 0; if(!dir || !G) return;
      e.preventDefault(); var g = fg.sd / 20 * (e.shiftKey ? 10 : 1); st.at = M.round((st.at != null ? st.at : fg.mu) + dir * g, (fg.places || 0) + 1); setAt(G.sx(st.at));
    });
    api.daFig = {
      set: function(k){ st[k] = true; if(k === 'x'){ st.drag = false; box.classList.remove('is-drag-on'); } st.yours = null; sized.redraw(); },
      clear: function(){ st.yours = null; sized.redraw(); },
      // The inverse problem's x step: drag the boundary to the student's answer.
      drag: function(on){ st.drag = !!on; st.at = null; box.classList.toggle('is-drag-on', !!on); svg.style.touchAction = on ? 'none' : ''; sized.redraw(); },
      yours: function(y){ st.yours = y; sized.redraw(); }
    };
  }
  // The student's wrong number, as something to draw: a z or an x as a boundary,
  // a probability as the region it is the area of (or a tag), a mean as a line.
  function yoursOf(s, v, p){
    var fg = p.fig, d = p.data || {}, Dd = D();
    if(!isFinite(v) || !fg) return null;
    var dsh = function(x){ return F(x, s.d != null ? s.d : 2); };
    if(fg.kind === 'binom'){
      if(s.key === 'mean') return { x: v, text: dsh(v) };
      return { text: dsh(v) };
    }
    var mu = fg.mu, sd = fg.sd;
    if(s.key === 'z' || s.key === 'za' || s.key === 'zb' || s.key === 'zstar') return { x: mu + v * sd, text: 'z = ' + minus(dsh(v)) };
    if(s.key === 'x') return { x: v, text: dsh(v) };
    if((s.key === 'p' || s.key === 'exact') && v > 0 && v < 1){
      // The region whose area is the student's number, on the side the event asks for.
      if(fg.mode === 'less') return { lo: -Infinity, hi: mu + Dd.invNorm(v) * sd, text: dsh(v) };
      if(fg.mode === 'greater') return { lo: mu + Dd.invNorm(1 - v) * sd, hi: Infinity, text: dsh(v) };
      return { text: dsh(v) };
    }
    if(s.key === 'pct') return { text: dsh(v) + '%' };
    return { text: dsh(v) };
  }
  // One method hint per step, in this problem's numbers.
  function methodOf(s, p){
    var d = p.data || {}, fg = p.fig || {}, pl = fg.places || 0;
    var X = { sketch: '"Less than" is the area to the left of the boundary, "greater than" to the right. A probability is an area, never a height.',
      event: 'Translate the words: "at most k" keeps k, "fewer than k" stops at k − 1, "at least k" keeps k, "more than k" starts at k + 1.',
      work: 'Full credit names the distribution, its parameters, the boundary and the direction, then gives the number.',
      check: 'A small upper tail is above the mean; a small lower tail is below it.' };
    if(X[s.key]) return X[s.key];
    if(fg.kind === 'normal' && /^z[ab]?$/.test(s.key)){
      var bx = s.key === 'za' || (s.key === 'z' && fg.mode === 'greater') ? fg.a : fg.b;
      if(fg.emp) return null;
      return tx('Standardize the boundary: $z = \\frac{x - \\mu}{\\sigma} = \\frac{' + F(bx, pl) + ' - ' + F(fg.mu, pl) + '}{' + F(fg.sd, pl + (fg.sd < 1 ? 2 : 0)) + '}$. Values above the mean get positive z. Your z is the dashed line.');
    }
    if(s.key === 'p' && fg.kind === 'normal') return tx(fg.mode === 'less' ? 'Read the area to the LEFT of z: $P(Z < z)$ from technology or Table A. The dashed region is the area your number would be.' : fg.mode === 'greater' ? 'Technology and Table A give the area to the left; "greater than" is $1 - P(Z < z)$. The dashed region is the area your number would be.' : 'Subtract the two left areas: $P(Z < z_b) - P(Z < z_a)$.');
    if(s.key === 'p') return tx(d.rel === 'atLeast' || d.rel === 'more' ? 'Technology adds from 0: use $1 - P(X \\le ' + (d.lo - 1) + ')$ with $n = ' + d.n + '$ and $p = ' + d.p + '$.' : d.rel === 'exactly' ? 'One bar: $\\binom{n}{k}p^k(1 - p)^{n - k}$ with $n = ' + d.n + '$, $k = ' + d.k + '$.' : 'Add the shaded bars from 0 to ' + d.hi + ': the binomial cdf with $n = ' + d.n + '$ and $p = ' + d.p + '$.');
    if(s.key === 'zstar') return tx(d.side === 'right' ? 'Technology and Table A use the area to the left: look up $' + F(1 - d.area, 2) + '$, not ' + F(d.area, 2) + '.' : 'Look up an area of $' + F(d.area, 2) + '$ to the left (inverse normal).');
    if(s.key === 'x') return tx('$x = \\mu + z\\sigma$ with the z from step 1. You can also drag the boundary on the curve until the shaded area is ' + F(d.area, 2) + '.');
    if(s.key === 'pct') return 'Mark the boundaries as whole standard deviations from the mean, then add the halves of each band: 34%, 13.5% and 2.35% on each side.';
    if(s.key === 'exact') return tx('Use the exact z-scores of the two boundaries: $P(Z < z_b) - P(Z < z_a)$.');
    return null;
  }

  T.mount(SLUG, function(app, data){
    var ex = null;
    T.modes(app, {
      slug: SLUG,
      explore: function(pane){ ex = explore(pane, data); },
      quiz: function(pane){
        T.drill(pane, data, {
          slug: SLUG, noun: 'problem',
          types: [{ value: 'normal', label: 'A normal area' }, { value: 'inverse', label: 'A boundary from an area' }, { value: 'binomial', label: 'A binomial event in words' }, { value: 'empirical', label: 'The 68-95-99.7 rule' }],
          generate: function(r, c, t){ return texify(DA.generate(r, c, t)); },
          extra: quizFigure,
          onStep: function(s, right, api){
            if(!api.daFig) return;
            if(s.key === 'sketch' || s.key === 'event') api.daFig.set('shade');
            if(s.key === 'p'){ api.daFig.set('shade'); api.daFig.set('showP'); }
            if(s.key === 'x') api.daFig.set('x');
            if(s.key === 'pct') api.daFig.set('emp');
          },
          onStepStart: function(s, api){ if(!api.daFig) return; api.daFig.clear(); api.daFig.drag(s.key === 'x'); },
          onTry: function(s, t, api){ if(api.daFig && !t.right && s.kind === 'num') api.daFig.yours(yoursOf(s, t.value, api.problem)); },
          method: methodOf
        });
      },
      studio: { explore: function(pane, s){ if(ex) ex.studio(pane, s); } }
    });
  });
})();
