/* p-value explorer (simulator; docs/apstat-spec.md section 6). OWNED BY THIS TOOL
   ONLY. The model is ApStatMath.pValueExplorer (statistics/assets/tools/math/
   p-value-explorer.js); every area and number comes from ApStatDist through it;
   math text is ApStatTex; the frame is ApStatTools.modes on the Tool Studio.
   Styles: p-value-explorer.css.

   Explore, two views of one test:
     p-value          the null distribution (blue), the observed statistic (a
                      handle to drag along the axis, or the slider), the p-value
                      shaded in the direction of Ha (one tail or both), the α
                      cutoff dashed. Axis in the statistic's units with z (or t)
                      under it. Dock: Ha (<, ≠, >) and the observed result.
     Errors & power   the null curve and the curve of p-hat if the true
                      proportion is the value you drag (vermillion); the
                      rejection region; α (Type I) on the null curve, β (Type II)
                      and power (green) on the true curve; a 2 × 2 table of
                      decision against truth. Dock: true p, n, α.
   Why: the reasoning in words with the current numbers; Details: the study,
   n and α, and every number with its formula.

   Test yourself: ApStatTools.drill on pValueExplorer.generate (one-proportion
   z test, one-sample t test, what a p-value says, Type I and II and power);
   the figure on the stage fills in as the steps are answered. */
(function(){
  'use strict';
  var T = window.ApStatTools, M = window.ApStatMath;
  if(!T || !M || !M.pValueExplorer) return;
  var PV = M.pValueExplorer, esc = T.esc, SLUG = 'p-value-explorer', NS = 'http://www.w3.org/2000/svg';
  var uid = 0;
  function D(){ return window.ApStatDist; }
  function TX(){ return window.ApStatTex; }
  function tx(s){ return TX() ? TX().html(String(s), { wrap: true }) : esc(s); }
  function F(x, d){ return T.F(x, d); }
  function P4(p){ return PV.P4(p); }
  // A p-value in a sentence or after "=": "< 0.0001" reads as words there.
  function PW(p){ var s = P4(p); return s.charAt(0) === '<' ? 'less than 0.0001' : s; }
  function PEQ(p){ var s = P4(p); return s.charAt(0) === '<' ? s : '= ' + s; }
  function el(tag, cls, html){ var e = document.createElement(tag); if(cls) e.className = cls; if(html != null) e.innerHTML = html; return e; }
  function r1(v){ return Math.round(v * 10) / 10; }

  /* ================================================================ drawing */
  /* A density picture in pixels: x in data units, y in density units.
     cfg: { W, H, lo, hi, ymax, pad: { l, r, t, b } } */
  function frame(cfg){
    var p = cfg.pad, iw = cfg.W - p.l - p.r, ih = cfg.H - p.t - p.b;
    return {
      W: cfg.W, H: cfg.H, l: p.l, r: cfg.W - p.r, t: p.t, b: cfg.H - p.b, lo: cfg.lo, hi: cfg.hi, ymax: cfg.ymax,
      sx: function(v){ return p.l + (v - cfg.lo) / (cfg.hi - cfg.lo) * iw; },
      sy: function(v){ return p.t + ih - v / cfg.ymax * ih; },
      ix: function(px){ return cfg.lo + (px - p.l) / iw * (cfg.hi - cfg.lo); }
    };
  }
  function f2(v){ return (Math.round(v * 10) / 10).toFixed(1); }
  function curvePath(f, G, a, b, n){
    a = a == null ? G.lo : Math.max(G.lo, a); b = b == null ? G.hi : Math.min(G.hi, b);
    n = n || 160; var d = '';
    for(var i = 0; i <= n; i++){ var x = a + (b - a) * i / n, y = Math.min(G.ymax * 1.02, f(x)); d += (i ? 'L' : 'M') + f2(G.sx(x)) + ' ' + f2(G.sy(y)); }
    return d;
  }
  function areaPath(f, G, a, b){
    a = Math.max(G.lo, a); b = Math.min(G.hi, b);
    if(!(b > a)) return '';
    return 'M' + f2(G.sx(a)) + ' ' + f2(G.sy(0)) + curvePath(f, G, a, b, Math.max(8, Math.round(120 * (b - a) / (G.hi - G.lo)))).replace(/^M/, 'L') + 'L' + f2(G.sx(b)) + ' ' + f2(G.sy(0)) + 'Z';
  }
  function niceStep(raw){ var p = Math.pow(10, Math.floor(Math.log10(raw))), m = raw / p; return (m <= 1 ? 1 : m <= 2 ? 2 : m <= 2.5 ? 2.5 : m <= 5 ? 5 : 10) * p; }
  function ticks(a, b, n){ var s = niceStep((b - a) / n), out = []; for(var v = Math.ceil(a / s - 1e-9) * s; v <= b + 1e-9; v += s) out.push(+v.toPrecision(10)); return { list: out, step: s }; }
  function decs(step){ var s = String(+step.toPrecision(6)); return s.indexOf('.') < 0 ? 0 : s.length - s.indexOf('.') - 1; }
  function minus(s){ return String(s).replace(/^-/, '−'); }
  function svgText(x, y, text, cls, anchor){ return '<text x="' + f2(x) + '" y="' + f2(y) + '" class="' + (cls || '') + '" text-anchor="' + (anchor || 'middle') + '">' + esc(text) + '</text>'; }
  // A label in a rounded tag (the observed value), kept inside the picture.
  function tag(G, x, y, text, cls){
    var w = text.length * 7.4 + 16, h = 22, left = Math.max(G.l - 8, Math.min(G.r + 8 - w, x - w / 2));
    return '<g class="pv-tag ' + (cls || '') + '"><rect x="' + f2(left) + '" y="' + f2(y - h) + '" width="' + f2(w) + '" height="' + h + '" rx="11"/>' + svgText(left + w / 2, y - 7, text) + '</g>';
  }
  // Two axes: the statistic (top row) and z or t (bottom row), aligned.
  function axes(G, o){
    var out = [], b = G.b, tk = ticks(G.lo, G.hi, G.W < 420 ? 6 : 8), d = Math.max(o.minDec || 0, decs(tk.step));
    out.push('<line class="pv-axis" x1="' + f2(G.l) + '" y1="' + f2(b) + '" x2="' + f2(G.r) + '" y2="' + f2(b) + '"/>');
    tk.list.forEach(function(v){ var x = G.sx(v); if(x < G.l + 18 || x > G.W - 6) return; /* clear of the axis name at the left end */ if(o.avoid != null && Math.abs(o.avoid - x) < 22) return; out.push('<line class="pv-tick" x1="' + f2(x) + '" y1="' + f2(b) + '" x2="' + f2(x) + '" y2="' + f2(b + 5) + '"/>' + svgText(x, b + 19, minus(v.toFixed(d)), 'pv-tl')); });
    out.push(svgText(G.l - 4, b + 19, o.name, 'pv-an', 'end'));
    if(o.z){
      var zb = b + 34, zlo = Math.ceil((G.lo - o.z.center) / o.z.se), zhi = Math.floor((G.hi - o.z.center) / o.z.se);
      for(var k = zlo; k <= zhi; k++){ var zx = G.sx(o.z.center + k * o.z.se); if(zx < G.l + 10) continue; out.push('<line class="pv-ztick" x1="' + f2(zx) + '" y1="' + f2(zb - 9) + '" x2="' + f2(zx) + '" y2="' + f2(zb - 4) + '"/>' + svgText(zx, zb + 7, minus(String(k)), 'pv-zl')); }
      out.push(svgText(G.l - 4, zb + 7, o.z.name, 'pv-an pv-zn', 'end'));
    }
    return out.join('');
  }
  function patternDefs(id){
    return '<defs><pattern id="' + id + '-hatch" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="7" height="7" class="pv-hatch-bg"/><line x1="0" y1="0" x2="0" y2="7" class="pv-hatch"/></pattern></defs>';
  }

  /* The figure of one test: the null curve, the observed value and (optionally)
     the shaded p-value. v: { kind: 'prop'|'mean', p0, n, x | mu0, s, xbar, ha,
     alpha, shade: bool, showP: bool, cut: bool, W, H, small } */
  function nullModel(v){
    if(v.kind === 'mean'){
      var se = v.s / Math.sqrt(v.n), df = v.n - 1;
      return { center: v.mu0, se: se, df: df, obs: v.xbar, stat: (v.xbar - v.mu0) / se,
        f: function(x){ return D().tPdf((x - v.mu0) / se, df) / se; }, cdf: function(x){ return D().tCdf((x - v.mu0) / se, df); },
        name: 'x̄', zname: 't', lo: v.mu0 - 4.4 * se, hi: v.mu0 + 4.4 * se };
    }
    var se0 = Math.sqrt(v.p0 * (1 - v.p0) / v.n), ph = v.x / v.n;
    return { center: v.p0, se: se0, obs: ph, stat: (ph - v.p0) / se0,
      f: function(x){ return D().normPdf(x, v.p0, se0); }, cdf: function(x){ return D().normCdf(x, v.p0, se0); },
      name: 'p̂', zname: 'z', lo: v.p0 - 4.2 * se0, hi: v.p0 + 4.2 * se0 };
  }
  function pFigure(v, id){
    var nm = nullModel(v), W = v.W, H = v.H, small = W < 420;
    var lo = nm.lo, hi = nm.hi;
    // Keep the observed value on the picture.
    if(nm.obs < lo + nm.se * 0.3) lo = nm.obs - nm.se * 0.6;
    if(nm.obs > hi - nm.se * 0.3) hi = nm.obs + nm.se * 0.6;
    var peak = nm.f(nm.center);
    var G = frame({ W: W, H: H, lo: lo, hi: hi, ymax: peak * 1.18, pad: { l: small ? 30 : 38, r: v.noZ ? 14 : 50, t: 34, b: v.noZ ? 34 : 60 } });
    var out = [patternDefs(id)], obs = nm.obs, mir = 2 * nm.center - obs, ha = v.ha;
    out.push('<path class="pv-under s1" d="' + areaPath(nm.f, G, G.lo, G.hi) + '"/>');
    if(v.shade){
      var regs = [];
      if(ha === 'greater') regs.push([obs, G.hi]);
      else if(ha === 'less') regs.push([G.lo, obs]);
      else { regs.push([G.lo, Math.min(obs, mir)]); regs.push([Math.max(obs, mir), G.hi]); }
      regs.forEach(function(r){ out.push('<path class="pv-pshade" d="' + areaPath(nm.f, G, r[0], r[1]) + '"/>'); });
    }
    out.push('<path class="pv-curve s1" d="' + curvePath(nm.f, G) + '"/>');
    // α cutoff(s)
    if(v.cut){
      var zs = PV.crit(nm.df ? 't' : 'z', v.alpha, ha, nm.df), cs = [];
      if(ha !== 'less') cs.push(nm.center + zs * nm.se);
      if(ha !== 'greater') cs.push(nm.center - zs * nm.se);
      cs.forEach(function(c){ if(c < G.lo || c > G.hi) return; var x = G.sx(c); out.push('<line class="pv-cut" x1="' + f2(x) + '" y1="' + f2(G.t + 6) + '" x2="' + f2(x) + '" y2="' + f2(G.b) + '"/>'); });
      if(cs.length && !small){ var c0 = cs[0], cx0 = G.sx(c0); if(c0 >= G.lo && c0 <= G.hi) out.push(svgText(cx0 + (c0 >= nm.center ? 5 : -5), G.t + 16, 'α = ' + v.alpha + ' cutoff', 'pv-cutl', c0 >= nm.center ? 'start' : 'end')); }
    }
    // center label
    out.push(svgText(G.sx(nm.center), G.sy(peak) - 8, (v.kind === 'mean' ? 'μ₀ = ' + v.mu0 : 'p₀ = ' + v.p0), 'pv-cl'));
    // observed and its mirror
    var ox = G.sx(Math.max(G.lo, Math.min(G.hi, obs)));
    if(v.noObs){ out.push(axes(G, { name: nm.name, minDec: v.kind === 'mean' ? 1 : 2, z: v.noZ ? null : { center: nm.center, se: nm.se, name: nm.zname } })); return { svg: out.join(''), G: G, nm: nm }; }
    if(ha === 'two' && v.shade && mir > G.lo && mir < G.hi){ var mx = G.sx(mir); out.push('<line class="pv-mirror" x1="' + f2(mx) + '" y1="' + f2(G.sy(nm.f(mir))) + '" x2="' + f2(mx) + '" y2="' + f2(G.b) + '"/>'); }
    if(v.dot){ out.push('<line class="pv-obs" x1="' + f2(ox) + '" y1="' + f2(G.sy(nm.f(obs))) + '" x2="' + f2(ox) + '" y2="' + f2(G.b) + '"/><circle class="pv-obsdot" cx="' + f2(ox) + '" cy="' + f2(G.b) + '" r="5"/>'); out.push(axes(G, { name: nm.name, minDec: 2 })); return { svg: out.join(''), G: G, nm: nm }; }
    out.push('<line class="pv-obs" x1="' + f2(ox) + '" y1="' + f2(Math.min(G.b - 18, G.sy(nm.f(obs)) - 14)) + '" x2="' + f2(ox) + '" y2="' + f2(G.b) + '"/>');
    var lab = (v.kind === 'mean' ? 'x̄ = ' + F(obs, v.places != null ? v.places : 2) : 'p̂ = ' + F(obs, 3));
    out.push(tag(G, ox, Math.min(G.b - 22, G.sy(nm.f(obs)) - 18), lab, 'pv-obstag'));
    if(v.showP && v.shade){
      // A leader from inside the shaded tail to the value, on the open side.
      var p = PV.test(v).p, side = ha === 'less' ? -1 : 1, edge = ha === 'two' ? Math.max(obs, mir) : obs;
      if(ha === 'two' && G.sx(edge) > G.r - 40){ side = -1; edge = Math.min(obs, mir); }
      var inX = Math.max(G.lo, Math.min(G.hi, edge + side * nm.se * 0.35)), inY = G.sy(nm.f(inX) * 0.35);
      var lx = G.sx(inX) + side * Math.max(26, G.W * 0.05), ly = Math.min(G.sy(peak * 0.5), G.sy(nm.f(inX)) - 34);
      var txt = 'p-value ' + P4(p), tw = txt.length * 7.6, anchor = side > 0 ? 'start' : 'end';
      if(side > 0 && lx + tw > G.W - 4){ lx = G.W - 4 - tw; }
      if(side < 0 && lx - tw < 4){ lx = 4 + tw; }
      out.push('<path class="pv-lead" d="M' + f2(G.sx(inX)) + ' ' + f2(inY) + 'L' + f2(lx) + ' ' + f2(ly + 5) + '"/><circle class="pv-leaddot" cx="' + f2(G.sx(inX)) + '" cy="' + f2(inY) + '" r="3"/>');
      out.push(svgText(lx + (side > 0 ? 2 : -2), ly, txt, 'pv-parea', anchor));
    }
    out.push(axes(G, { name: nm.name, minDec: v.kind === 'mean' ? 1 : 2, z: v.noZ ? null : { center: nm.center, se: nm.se, name: nm.zname }, avoid: v.handle ? ox : null }));
    return { svg: out.join(''), G: G, nm: nm };
  }

  /* Errors and power: the null curve and the true curve with the regions. */
  function eFigure(v, id){
    var Dd = D(), se0 = Math.sqrt(v.p0 * (1 - v.p0) / v.n), e = PV.errors({ p0: v.p0, n: v.n, ha: v.ha }, v.alpha, v.pa), sdA = e.sdA;
    var f0 = function(x){ return Dd.normPdf(x, v.p0, se0); }, fA = function(x){ return Dd.normPdf(x, v.pa, sdA); };
    var lo = Math.min(v.p0 - 3.8 * se0, v.pa - 3.8 * sdA), hi = Math.max(v.p0 + 3.8 * se0, v.pa + 3.8 * sdA);
    var small = v.W < 420, peak = Math.max(f0(v.p0), fA(v.pa));
    var G = frame({ W: v.W, H: v.H, lo: lo, hi: hi, ymax: peak * 1.22, pad: { l: small ? 30 : 38, r: 50, t: 30, b: 40 } });
    var out = [patternDefs(id)], cuts = e.cuts, L = cuts.lo != null ? cuts.lo : -Infinity, U = cuts.hi != null ? cuts.hi : Infinity;
    // β: true curve inside the "fail to reject" region; power: the rest.
    out.push('<path class="pv-beta" d="' + areaPath(fA, G, Math.max(G.lo, L), Math.min(G.hi, U)) + '"/>');
    if(cuts.hi != null) out.push('<path class="pv-power" d="' + areaPath(fA, G, U, G.hi) + '"/>');
    if(cuts.lo != null) out.push('<path class="pv-power" d="' + areaPath(fA, G, G.lo, L) + '"/>');
    // α: null curve in the rejection region.
    if(cuts.hi != null) out.push('<path class="pv-alpha" d="' + areaPath(f0, G, U, G.hi) + '" fill="url(#' + id + '-hatch)"/>');
    if(cuts.lo != null) out.push('<path class="pv-alpha" d="' + areaPath(f0, G, G.lo, L) + '" fill="url(#' + id + '-hatch)"/>');
    out.push('<path class="pv-curve s1" d="' + curvePath(f0, G) + '"/>');
    out.push('<path class="pv-curve s2" d="' + curvePath(fA, G) + '"/>');
    [cuts.lo, cuts.hi].forEach(function(c){
      if(c == null || c < G.lo || c > G.hi) return;
      var x = G.sx(c);
      out.push('<line class="pv-cut is-e" x1="' + f2(x) + '" y1="' + f2(G.t - 4) + '" x2="' + f2(x) + '" y2="' + f2(G.b) + '"/>');
    });
    // Region words, placed where the region is.
    var rejX = cuts.hi != null ? G.sx(U) : G.sx(L), rejSide = cuts.hi != null ? 1 : -1;
    out.push(svgText(rejX + rejSide * 6, G.t + 4, small ? 'Reject H₀' : 'Reject H₀ →', 'pv-rl', rejSide > 0 ? 'start' : 'end'));
    if(cuts.hi != null && cuts.lo != null && !small) out.push(svgText(G.sx(L) - 6, G.t + 4, '← Reject H₀', 'pv-rl', 'end'));
    // The two peak labels, pushed apart when the peaks are close.
    var t0 = 'p₀ = ' + v.p0, tA = 'true p = ' + F(v.pa, 3), x0 = G.sx(v.p0), xA = G.sx(v.pa), w0 = t0.length * 6.6, wA = tA.length * 6.6;
    var y0 = G.sy(f0(v.p0)) - 8, yA = G.sy(fA(v.pa)) - 8, a0 = 'middle', aA = 'middle';
    if(Math.abs(x0 - xA) < (w0 + wA) / 2 + 8){ var mid = (x0 + xA) / 2; if(xA >= x0){ a0 = 'end'; aA = 'start'; x0 = mid - 5; xA = mid + 5; } else { a0 = 'start'; aA = 'end'; x0 = mid + 5; xA = mid - 5; } y0 = yA = Math.min(y0, yA); }
    x0 = Math.max(G.l + (a0 === 'end' ? w0 : a0 === 'middle' ? w0 / 2 : 0), Math.min(G.r - (a0 === 'start' ? w0 : a0 === 'middle' ? w0 / 2 : 0), x0));
    xA = Math.max(G.l + (aA === 'end' ? wA : aA === 'middle' ? wA / 2 : 0), Math.min(G.r - (aA === 'start' ? wA : aA === 'middle' ? wA / 2 : 0), xA));
    out.push(svgText(x0, y0, t0, 'pv-cl s1t pv-halo-t', a0));
    out.push(svgText(xA, yA, tA, 'pv-cl s2t pv-halo-t', aA));
    out.push(axes(G, { name: 'p̂', minDec: 2, avoid: v.handle ? G.sx(v.pa) : null }));
    return { svg: out.join(''), G: G, e: e };
  }

  /* Small pictures for the "which picture" step (one per shading). */
  function picSvg(pc, k, i){
    var v = { kind: 'prop', p0: pc.p0, n: pc.n, x: pc.x, ha: k === 'center' ? 'two' : k, shade: k !== 'center', W: 260, H: 110, noZ: true, alpha: 0.05, dot: true };
    var id = 'pvp' + (++uid) + '-' + i, f = pFigure(v, id), extra = '';
    if(k === 'center'){
      var nm = f.nm, G = f.G, a = Math.min(nm.obs, 2 * nm.center - nm.obs), b = Math.max(nm.obs, 2 * nm.center - nm.obs);
      extra = '<path class="pv-pshade" d="' + areaPath(nm.f, G, a, b) + '"/>';
    }
    var names = { greater: 'the right tail', less: 'the left tail', two: 'both tails', center: 'the middle' };
    return '<svg class="pv-pic" viewBox="0 0 260 120" role="img" aria-label="Null distribution with ' + names[k] + ' shaded">' + f.svg.replace('<path class="pv-curve', extra + '<path class="pv-curve') + '</svg>';
  }

  /* ============================================================ TeX in problems */
  // The problem text is also the plain caption: H₀ and Hₐ read as letters there.
  function hText(t){ return String(t).replace(/\$H_0\$/g, 'H₀').replace(/\$H_a\$/g, 'Hₐ').replace(/\$H_0: /g, 'H₀: $').replace(/\$H_a: /g, 'Hₐ: $'); }
  function texify(p){
    var q = {}; for(var k in p) q[k] = p[k];
    q.text = tx(hText(p.text));
    q.solution = p.solution.map(tx);
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
    return { redraw: function(){ if(w0) draw(w0, h0); }, size: function(){ return [w0, h0]; }, force: function(){ w0 = 0; later(); } };
  }
  function seg(label, items, value, onPick){
    var g = el('div', 'pv-segw');
    g.innerHTML = '<span class="pv-seglab" aria-hidden="true">' + label + '</span><div class="ls-seg pv-seg" role="group" aria-label="' + esc(label.replace(/<[^>]+>/g, '')) + '">' + items.map(function(it){
      return '<button type="button" data-v="' + esc(it.value) + '" aria-pressed="' + (it.value === value) + '"' + (it.aria ? ' aria-label="' + esc(it.aria) + '"' : '') + '>' + it.label + '</button>';
    }).join('') + '</div>';
    g.addEventListener('click', function(e){ var b = e.target.closest('button[data-v]'); if(!b) return; set(b.getAttribute('data-v')); onPick(b.getAttribute('data-v')); });
    function set(v){ g.querySelectorAll('button[data-v]').forEach(function(b){ b.setAttribute('aria-pressed', String(b.getAttribute('data-v') === String(v))); }); }
    return { el: g, set: set };
  }

  function explore(host, data){
    var id = 'pv' + (++uid), scs = (data.explore && data.explore.scenarios) || [];
    if(!scs.length){ host.innerHTML = '<p class="bt-small">The explore studies arrive with their unit.</p>'; return { studio: function(){} }; }
    var S = { view: 'p', sc: null, ha: 'greater', x: 0, xbar: 0, n: 0, alpha: 0.05, pa: 0, touched: false };
    host.innerHTML = '<section class="bt-problem pv-ex" aria-labelledby="' + id + '-h"><h2 id="' + id + '-h" class="sr-only">Explore: where a p-value comes from</h2>' +
      '<div class="pv-stage"><div class="pv-fig"><svg class="pv-svg" role="group" aria-labelledby="' + id + '-t"><title id="' + id + '-t">Null distribution</title><g class="pv-layer"></g>' +
      '<g class="pv-handle" tabindex="0" role="slider"><circle class="pv-hit" r="24"/><circle class="pv-halo" r="15"/><circle class="pv-dot" r="8"/></g></svg></div>' +
      '<div class="pv-table" hidden></div><p class="sr-only pv-live"></p></div>' +
      '<div class="pv-dock"><div class="pv-views"></div><div class="pv-dp"></div><div class="pv-de" hidden></div></div>' +
      '<div class="pv-why"></div><div class="pv-det"></div></section>';
    var LS = null;
    var q = function(s){ return host.querySelector(s) || (LS ? LS.root.querySelector(s) : null); };
    var svg = q('.pv-svg'), layer = q('.pv-layer'), handle = q('.pv-handle'), title = q('#' + id + '-t'), tbl = q('.pv-table');
    var live = T.announcer(q('.pv-live'));
    var start = T.cue('Drag the observed result along the axis and watch the shaded p-value.');
    q('.pv-dock').insertBefore(start.el, q('.pv-dock').firstChild);

    /* --- controls --- */
    var views = seg('View', [{ value: 'p', label: 'p-value' }, { value: 'e', label: 'Errors &amp; power' }], 'p', function(v){ act(); setView(v); });
    q('.pv-views').appendChild(views.el);
    var haBox = el('div', 'pv-habox'), haSeg = null;
    q('.pv-dp').appendChild(haBox);
    function buildHa(){
      var sym = isMean() ? 'μ' : 'p', v0 = isMean() ? S.sc.mu0 : S.sc.p0;
      haSeg = seg('Alternative hypothesis', [{ value: 'less', label: sym + ' &lt; ' + v0, aria: sym + ' less than ' + v0 }, { value: 'two', label: sym + ' ≠ ' + v0, aria: sym + ' not equal to ' + v0 }, { value: 'greater', label: sym + ' &gt; ' + v0, aria: sym + ' greater than ' + v0 }], S.ha, function(v){ act(); S.ha = v; draw(); });
      haBox.innerHTML = ''; haBox.appendChild(haSeg.el);
    }
    var obsBox = el('div', 'pv-obsbox'); q('.pv-dp').appendChild(obsBox);
    var obsSl = null, paSl = null, nSl = null, nSl2 = null;
    var aItems = [{ value: '0.01', label: '0.01' }, { value: '0.05', label: '0.05' }, { value: '0.1', label: '0.10' }];
    var aSegE = seg('α', aItems, '0.05', function(v){ act(); S.alpha = +v; aSegD.set(v); draw(); });
    var paBox = el('div', 'pv-pabox'), nBoxE = el('div', 'pv-nbox');
    q('.pv-de').appendChild(paBox); q('.pv-de').appendChild(nBoxE); q('.pv-de').appendChild(aSegE.el);

    /* --- Details: the study, n, α, numbers --- */
    var det = q('.pv-det');
    det.innerHTML = '<h3 class="ls-title-l">The study</h3><div class="pv-scpick"></div><div class="pv-nboxd"></div><div class="pv-ad"></div><h3 class="ls-title-l">Every number</h3><div class="pv-nums"></div>';
    var pick = T.choiceSelect({ label: 'Study', options: scs.map(function(s){ return { value: s.id, label: s.name }; }), value: scs[0].id, onChange: function(v){ act(); setSc(scs.filter(function(s){ return s.id === v; })[0]); } });
    det.querySelector('.pv-scpick').appendChild(pick.el);
    var aSegD = seg('Significance level α', aItems, '0.05', function(v){ act(); S.alpha = +v; aSegE.set(v); draw(); });
    det.querySelector('.pv-ad').appendChild(aSegD.el);

    function isMean(){ return S.sc.kind === 'mean'; }
    function nm(){ return isMean() ? 'x̄' : 'p̂'; }
    function scen(){
      var c = S.sc;
      return isMean() ? { kind: 'mean', mu0: c.mu0, s: c.s, n: S.n, xbar: S.xbar, ha: S.ha, alpha: S.alpha, places: c.places }
        : { kind: 'prop', p0: c.p0, n: S.n, x: S.x, ha: S.ha, alpha: S.alpha };
    }
    function hasTex(){ var sym = isMean() ? '\\mu' : 'p', v = isMean() ? S.sc.mu0 : S.sc.p0; return '$H_a: ' + sym + ' ' + PV.HA_TEX[S.ha] + ' ' + v + '$'; }

    function buildObs(){
      var c = S.sc, o;
      if(isMean()){
        var se = c.s / Math.sqrt(S.n), st = c.step || 0.01, d = c.places != null ? c.places : 2;
        var lo = M.round(c.mu0 - 4 * se, d), hi = M.round(c.mu0 + 4 * se, d);
        S.xbar = Math.max(lo, Math.min(hi, S.xbar));
        o = T.slider({ label: 'Sample mean x̄ (' + c.units + ')', min: lo, max: hi, step: st, value: S.xbar, decimals: d, onInput: function(v){ act(); S.xbar = v; draw(); } });
      } else {
        var se0 = Math.sqrt(c.p0 * (1 - c.p0) / S.n), a = Math.max(0, Math.floor(S.n * (c.p0 - 4 * se0))), b = Math.min(S.n, Math.ceil(S.n * (c.p0 + 4 * se0)));
        S.x = Math.max(a, Math.min(b, S.x));
        o = T.slider({ label: 'Successes out of ' + S.n + ' (' + c.unit + ' who ' + c.trait + ')', min: a, max: b, step: 1, value: S.x, onInput: function(v){ act(); S.x = v; draw(); } });
      }
      obsBox.innerHTML = ''; obsBox.appendChild(o.el); obsSl = o;
    }
    function buildE(){
      var c = S.sc, se0 = Math.sqrt(c.p0 * (1 - c.p0) / S.n);
      var lo = Math.max(0.01, M.round(c.p0 - 5 * se0, 3)), hi = Math.min(0.99, M.round(c.p0 + 5 * se0, 3));
      S.pa = Math.max(lo, Math.min(hi, S.pa));
      paSl = T.slider({ label: 'True proportion p', min: lo, max: hi, step: 0.001, value: S.pa, decimals: 3, onInput: function(v){ act(); S.pa = v; draw(); } });
      paBox.innerHTML = ''; paBox.appendChild(paSl.el);
    }
    function buildN(){
      var mean = isMean(), mk = function(){ return T.slider({ label: 'Sample size n', min: mean ? 5 : 20, max: mean ? 100 : 1000, step: mean ? 1 : 10, value: S.n, onInput: function(v){ act(); setN(v); } }); };
      nSl = mk(); nSl2 = mean ? null : mk();
      var d = det.querySelector('.pv-nboxd'); d.innerHTML = ''; d.appendChild(nSl.el);
      nBoxE.innerHTML = ''; if(nSl2) nBoxE.appendChild(nSl2.el);
    }
    function setN(v){
      if(isMean()){ S.n = v; }
      else { var ph = S.x / S.n; S.n = v; S.x = Math.round(ph * v); }
      [nSl, nSl2].forEach(function(s){ if(s && s.value() !== v) s.set(v); });
      buildObs(); buildE(); draw();
    }
    function setSc(c){
      S.sc = c; S.n = c.n; S.ha = c.ha;
      if(c.kind === 'mean') S.xbar = c.xbar; else { S.x = c.x; S.pa = M.round(c.p0 + (c.ha === 'less' ? -1 : 1) * 2.5 * Math.sqrt(c.p0 * (1 - c.p0) / c.n), 3); }
      buildHa(); pick.set(c.id);
      buildN(); buildObs(); if(!isMean()) buildE();
      if(isMean() && S.view === 'e') setView('p', true);
      draw();
    }
    function setView(v, quiet){
      if(v === 'e' && isMean()){
        var prop = scs.filter(function(s){ return s.kind === 'prop'; })[0];
        if(prop){ S.view = 'e'; setSc(prop); note = 'Errors and power are shown for a test about a proportion, as in topic 3.8.'; }
        else { views.set('p'); return; }
      }
      S.view = v; views.set(v);
      q('.pv-dp').hidden = v !== 'p'; q('.pv-de').hidden = v !== 'e'; tbl.hidden = v !== 'e';
      if(!quiet) draw();
      if(sized) sized.force();
    }
    var note = '';

    /* --- the handle: drag the observed value (p view) or the true p (e view) --- */
    var G = null, dragging = false;
    function valueAt(px){
      if(!G) return null;
      var v = G.ix(px);
      if(S.view === 'e'){ return Math.max(paSl ? +paSl.input.min : 0.01, Math.min(paSl ? +paSl.input.max : 0.99, M.round(v, 3))); }
      if(isMean()) return Math.max(+obsSl.input.min, Math.min(+obsSl.input.max, M.round(v, S.sc.places != null ? S.sc.places : 2)));
      return Math.max(+obsSl.input.min, Math.min(+obsSl.input.max, Math.round(v * S.n)));
    }
    function setVal(v){
      if(v == null) return;
      if(S.view === 'e'){ S.pa = v; paSl.set(v); }
      else if(isMean()){ S.xbar = v; obsSl.set(v); }
      else { S.x = v; obsSl.set(v); }
      draw();
    }
    function local(e){ var r = svg.getBoundingClientRect(); return (e.clientX - r.left) * (G ? G.W / Math.max(1, r.width) : 1); }
    svg.addEventListener('pointerdown', function(e){
      if(!G) return;
      var r = svg.getBoundingClientRect(), y = (e.clientY - r.top) * (G.H / Math.max(1, r.height));
      if(y < G.t - 10) return;
      dragging = true; act(); try{ svg.setPointerCapture(e.pointerId); }catch(err){}
      handle.classList.add('is-drag'); setVal(valueAt(local(e))); e.preventDefault();
    });
    svg.addEventListener('pointermove', function(e){ if(dragging) setVal(valueAt(local(e))); });
    function up(){ if(!dragging) return; dragging = false; handle.classList.remove('is-drag'); say(true); }
    svg.addEventListener('pointerup', up); svg.addEventListener('pointercancel', up);
    handle.addEventListener('keydown', function(e){
      var k = e.key, big = e.shiftKey ? 10 : 1, cur, step;
      if(S.view === 'e'){ cur = S.pa; step = 0.001; }
      else if(isMean()){ cur = S.xbar; step = S.sc.step || 0.01; }
      else { cur = S.x; step = 1; }
      var nv = null;
      if(k === 'ArrowRight' || k === 'ArrowUp') nv = cur + step * big;
      else if(k === 'ArrowLeft' || k === 'ArrowDown') nv = cur - step * big;
      else if(k === 'PageUp') nv = cur + step * 10; else if(k === 'PageDown') nv = cur - step * 10;
      else return;
      e.preventDefault(); act();
      var sl = S.view === 'e' ? paSl : obsSl;
      nv = Math.max(+sl.input.min, Math.min(+sl.input.max, nv));
      setVal(S.view === 'e' ? M.round(nv, 3) : isMean() ? M.round(nv, S.sc.places != null ? S.sc.places : 2) : Math.round(nv));
      say(true);
    });

    function act(){ if(!S.touched){ S.touched = true; start.done(); } }

    /* --- drawing --- */
    var sized = null;
    function draw(){
      if(!sized) return;
      var wh = sized.size(); if(!wh[0]) return;
      var W = wh[0], H = wh[1];
      svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H); svg.setAttribute('width', W); svg.setAttribute('height', H);
      var sc = scen(), r;
      if(S.view === 'p'){
        var v = { W: W, H: H, shade: true, showP: true, cut: true, handle: true }; for(var k in sc) v[k] = sc[k];
        r = pFigure(v, id);
        layer.innerHTML = r.svg; G = r.G;
        var hx = G.sx(Math.max(G.lo, Math.min(G.hi, r.nm.obs)));
        handle.setAttribute('transform', 'translate(' + f2(hx) + ' ' + f2(G.b) + ')');
        var t = PV.test(sc), d = isMean() && S.sc.places != null ? S.sc.places : isMean() ? 2 : 4;
        handle.setAttribute('aria-label', 'Observed ' + (isMean() ? 'sample mean' : 'sample proportion'));
        handle.setAttribute('aria-valuetext', (isMean() ? 'x̄ = ' + F(t.obs, d) : 'p̂ = ' + F(t.obs, 4) + ' (' + S.x + ' of ' + S.n + ')') + ', p-value ' + P4(t.p));
        handle.setAttribute('aria-valuenow', String(isMean() ? S.xbar : S.x));
        tellP(t);
      } else {
        var ve = { W: W, H: H, p0: S.sc.p0, n: S.n, ha: S.ha, alpha: S.alpha, pa: S.pa, handle: true };
        r = eFigure(ve, id);
        layer.innerHTML = r.svg; G = r.G;
        handle.setAttribute('transform', 'translate(' + f2(G.sx(S.pa)) + ' ' + f2(G.b) + ')');
        handle.setAttribute('aria-label', 'True proportion p');
        handle.setAttribute('aria-valuetext', 'true p = ' + F(S.pa, 3) + ', power ' + P4(r.e.power));
        handle.setAttribute('aria-valuenow', String(S.pa));
        tellE(r.e);
      }
      numbers();
    }
    function sideWords(){ return S.ha === 'greater' ? 'or greater' : S.ha === 'less' ? 'or less' : 'or farther from ' + (isMean() ? S.sc.mu0 : S.sc.p0) + ' in either direction'; }
    function tellP(t){
      var c = S.sc, nul = isMean() ? 'μ = ' + c.mu0 : 'p = ' + c.p0, obsT = isMean() ? 'x̄ = ' + F(t.obs, c.places != null ? c.places : 2) : 'p̂ = ' + F(t.obs, 3);
      var rej = t.p < S.alpha, cap = 'If ' + nul + ', a result of ' + obsT + ' ' + sideWords() + ' has probability <b>' + P4(t.p) + '</b>.';
      if(note){ cap = note + ' ' + cap; note = ''; }
      if(LS){
        LS.caption(cap, 'explore');
        LS.pills([{ k: 'p-value', html: P4(t.p), tone: 'readout' }, { html: rej ? 'p-value &lt; α: reject H<sub>0</sub>' : 'p-value ≥ α: fail to reject H<sub>0</sub>', tone: rej ? 'good' : 'warn' }], 'left', 'explore');
      }
      title.textContent = 'Null distribution of ' + nm() + ' centered at ' + (isMean() ? c.mu0 : c.p0) + ' with the p-value shaded';
      why('p', t);
      say();
    }
    function tellE(e){
      var cap = 'If the true proportion is ' + F(S.pa, 3) + ', the test rejects H<sub>0</sub> with probability <b>' + P4(e.power) + '</b> (the power).';
      if(note){ cap = note + ' ' + cap; note = ''; }
      if(LS){
        LS.caption(cap, 'explore');
        LS.pills([{ k: 'Power', html: P4(e.power), tone: 'good' }, { k: 'β', html: P4(e.typeII), tone: 'warn' }, { k: 'α', html: F(S.alpha, 2), tone: 'ghost' }], 'left', 'explore');
      }
      title.textContent = 'Null and true sampling distributions of p̂ with the rejection region';
      tbl.innerHTML = '<table class="pv-2x2"><caption class="sr-only">Decision against the truth</caption><colgroup><col class="pv-c0"><col><col></colgroup><thead><tr><th scope="col"><span class="sr-only">Decision</span></th><th scope="col">H<sub>0</sub> true (p = ' + S.sc.p0 + ')</th><th scope="col">Truth: p = ' + F(S.pa, 3) + '</th></tr></thead><tbody>' +
        '<tr><th scope="row">Reject H<sub>0</sub></th><td class="is-alpha"><b>Type I error</b><span>α = ' + F(S.alpha, 2) + '</span></td><td class="is-power"><b>Correct</b><span>power ' + P4(e.power) + '</span></td></tr>' +
        '<tr><th scope="row">Fail to reject</th><td class="is-ok"><b>Correct</b><span>1 − α = ' + F(1 - S.alpha, 2) + '</span></td><td class="is-beta"><b>Type II error</b><span>β ' + PEQ(e.typeII) + '</span></td></tr></tbody></table>';
      why('e', e);
      say();
    }
    function say(now){
      var t, txt;
      if(S.view === 'p'){ t = PV.test(scen()); txt = (isMean() ? 'Sample mean ' + F(t.obs, S.sc.places != null ? S.sc.places : 2) : 'Sample proportion ' + F(t.obs, 4)) + ', ' + (isMean() ? 't = ' : 'z = ') + F(t.stat, 2) + ', p-value ' + P4(t.p) + (t.p < S.alpha ? ', below α: reject the null hypothesis.' : ', not below α: fail to reject the null hypothesis.'); }
      else { var e = PV.errors({ p0: S.sc.p0, n: S.n, ha: S.ha }, S.alpha, S.pa); txt = 'True proportion ' + F(S.pa, 3) + ', n ' + S.n + ', α ' + S.alpha + ': power ' + P4(e.power) + ', Type II error probability ' + P4(e.typeII) + '.'; }
      live(txt, now);
    }

    /* --- Why: the reasoning with the current numbers --- */
    function openWhy(){ var d = whyEl.querySelector('details.bt-why'); if(d) d.open = true; }
    var whyEl = q('.pv-why');
    function why(view, r){
      var c = S.sc;
      if(view === 'p'){
        var t = r, sym = isMean() ? '\\mu' : 'p', v0 = isMean() ? c.mu0 : c.p0, param = isMean() ? 'the true mean ' + c.measure + ' of all ' + c.pop : 'the true proportion of all ' + c.pop + ' who ' + c.trait;
        var rej = t.p < S.alpha, u = isMean() ? ' ' + c.units : '';
        var head = 'The p-value is the area under the null distribution ' + (S.ha === 'two' ? 'in both tails' : S.ha === 'greater' ? 'to the right of' : 'to the left of') + (S.ha === 'two' ? ', beyond the observed value and its mirror image.' : ' the observed value.');
        var body = '<p>' + tx('The curve is what ' + (isMean() ? '$\\bar{x}$' : '$\\hat{p}$') + ' would do in repeated random samples of ' + S.n + ' if $H_0: ' + sym + ' = ' + v0 + '$ were true. ' + hasTex() + ' decides which results count as at least as extreme as ours.') + '</p>' +
          '<p><b>Read it in context.</b> ' + tx('Assuming ' + param + ' is ' + v0 + u + ', there is a ' + PW(t.p) + ' probability of getting a sample ' + (isMean() ? 'mean' : 'proportion') + ' of ' + (isMean() ? F(t.obs, c.places != null ? c.places : 2) + u : String(+t.obs.toFixed(4))) + ' ' + sideWords() + ' by chance in a random sample of ' + S.n + '.') + '</p>' +
          '<p><b>Decide and conclude.</b> ' + tx('Because the p-value ' + (t.p < 0.00005 ? '(less than 0.0001)' : 'of ' + P4(t.p)) + ' is ' + (rej ? 'less' : 'greater') + ' than $\\alpha = ' + S.alpha + '$, we ' + (rej ? 'reject' : 'fail to reject') + ' $H_0$. There ' + (rej ? 'is' : 'is not') + ' convincing evidence that ' + param + ' is ' + PV.HA_WORD[S.ha] + ' ' + v0 + u + '.') + '</p>' +
          '<p class="bt-small">' + tx('A p-value is not the probability that $H_0$ is true, and failing to reject never proves $H_0$: it only means the data are not convincing.') + '</p>';
        T.explain(whyEl, head, body); openWhy();
      } else {
        var e = r;
        var body2 = '<p>' + tx('The blue curve is $\\hat{p}$ when $H_0$ is true ($p = ' + c.p0 + '$). The orange curve is $\\hat{p}$ if the true proportion is ' + F(S.pa, 3) + '. The dashed line is the cutoff: a sample beyond it gives a p-value below α.') + '</p>' +
          '<ul class="pv-list"><li><b>Type I error</b> (hatched, probability α = ' + S.alpha + '): ' + tx('$H_0$ is true, but the sample lands beyond the cutoff and we reject it.') + '</li>' +
          '<li><b>Type II error</b> (light orange, β ' + PEQ(e.typeII) + '): ' + tx('the true proportion is ' + F(S.pa, 3) + ', but the sample lands short of the cutoff and we fail to reject $H_0$.') + '</li>' +
          '<li><b>Power</b> (green, 1 − β ' + PEQ(e.power) + '): ' + tx('the probability of rejecting $H_0$ when the true proportion is ' + F(S.pa, 3) + '.') + '</li></ul>' +
          '<p><b>More power</b> comes from a larger sample (both curves get narrower), a larger α (the cutoff moves toward ' + tx('$p_0$') + '), or a true value farther from ' + tx('$p_0$') + '. A smaller α means fewer Type I errors but more Type II errors.</p>';
        T.explain(whyEl, 'A test can be wrong in two ways: reject a true null (Type I) or miss a real effect (Type II).', body2); openWhy();
      }
      if(LS && LS.why) { var w = whyEl.querySelector('details.bt-why'); if(w) w.open = true; }
    }

    /* --- Details: every number with its formula --- */
    function numbers(){
      var c = S.sc, h = '';
      if(isMean()){
        var t = PV.test(scen()), d = c.places != null ? c.places : 2;
        h = '<table class="ls-tbl pv-ntbl"><tbody>' +
          '<tr><th scope="row">Hypotheses</th><td>' + tx('$H_0: \\mu = ' + c.mu0 + '$, ' + hasTex()) + '</td></tr>' +
          '<tr><th scope="row">' + tx('$\\bar{x}$, $s$, $n$') + '</th><td>' + F(S.xbar, d) + ', ' + F(c.s, d) + ', ' + S.n + '</td></tr>' +
          '<tr><th scope="row">SE</th><td>' + tx('$s/\\sqrt{n} = ' + F(c.s, d) + '/\\sqrt{' + S.n + '} = ' + F(t.se, 4) + '$') + '</td></tr>' +
          '<tr><th scope="row">' + tx('$t$, df') + '</th><td>' + tx('$t = \\frac{' + F(S.xbar, d) + ' - ' + c.mu0 + '}{' + F(t.se, 4) + '} = ' + minus(F(t.stat, 2)) + '$, $df = ' + t.df + '$') + '</td></tr>' +
          '<tr><th scope="row">p-value</th><td>' + P4(t.p) + '</td></tr>' +
          '<tr><th scope="row">' + tx('$t^*$') + '</th><td>' + F(PV.crit('t', S.alpha, S.ha, t.df), 3) + (S.ha === 'two' ? ' (two-sided)' : '') + '</td></tr></tbody></table>';
      } else {
        var tp = PV.test(scen()), e = PV.errors({ p0: c.p0, n: S.n, ha: S.ha }, S.alpha, S.pa);
        var cut = [e.cuts.lo, e.cuts.hi].filter(function(x){ return x != null; }).map(function(x){ return F(x, 4); }).join(' and ');
        h = '<table class="ls-tbl pv-ntbl"><tbody>' +
          '<tr><th scope="row">Hypotheses</th><td>' + tx('$H_0: p = ' + c.p0 + '$, ' + hasTex()) + '</td></tr>' +
          '<tr><th scope="row">' + tx('$\\hat{p}$') + '</th><td>' + S.x + '/' + S.n + ' = ' + F(tp.obs, 4) + '</td></tr>' +
          '<tr><th scope="row">SE</th><td>' + tx('$\\sqrt{p_0(1 - p_0)/n} = ' + F(tp.se, 4) + '$') + '</td></tr>' +
          '<tr><th scope="row">' + tx('$z$') + '</th><td>' + tx('$\\frac{' + F(tp.obs, 4) + ' - ' + c.p0 + '}{' + F(tp.se, 4) + '} = ' + minus(F(tp.stat, 2)) + '$') + '</td></tr>' +
          '<tr><th scope="row">p-value</th><td>' + P4(tp.p) + ' (Table A with z = ' + minus(F(tp.stat, 2)) + ': ' + P4(tableP(tp.stat)) + ')</td></tr>' +
          '<tr><th scope="row">' + tx('$z^*$, cutoff') + '</th><td>' + F(e.zStar, 3) + '; ' + tx('$\\hat{p}$') + ' beyond ' + cut + '</td></tr>' +
          '<tr><th scope="row">Power</th><td>at true p = ' + F(S.pa, 3) + ': ' + P4(e.power) + tx(' (SD of $\\hat{p}$ there: $\\sqrt{p(1 - p)/n} = ' + F(e.sdA, 4) + '$)') + '</td></tr></tbody></table>';
      }
      q('.pv-nums').innerHTML = h;
    }
    function tableP(z){ var Dd = D(), l = Dd.tableRoute('normal', z); return S.ha === 'less' ? l : S.ha === 'greater' ? 1 - l : Math.min(1, 2 * Math.min(l, 1 - l)); }

    /* --- Tool Studio: picture on the stage; the view switch, Ha and the
       observed result (or true p, n and α) in the dock. --- */
    function studio(pane, s){
      LS = s;
      if(s.detailsTitle) s.detailsTitle('Study & numbers');
      var o = { mode: 'explore' };
      var stage = el('div', 'pv-ls-stage'); stage.appendChild(q('.pv-stage'));
      s.add('stage', stage, o);
      var dock = q('.pv-dock'); dock.classList.add('pv-ls-dock'); s.add('dock', dock, o);
      var w = el('div', 'ls-sec pv-ls-why'); w.appendChild(start.el); w.appendChild(whyEl); s.add('why', w, o);
      var d = el('div', 'ls-sec pv-ls-det'); d.appendChild(det);
      Array.prototype.slice.call(pane.querySelectorAll(':scope > *')).forEach(function(k){ if(k.textContent.trim() && !k.classList.contains('pv-ex')) d.appendChild(k); });
      s.add('details', d, o);
      boot();
      if(s.mode() === 'explore') s.hint({ target: handle, text: 'Drag the observed result' });
    }
    function boot(){
      sized = fit(q('.pv-fig'), function(){ draw(); });
      setSc(scs[0]); setView('p', true);
    }
    if(!(window.LevlStudio && T.studioOf(host))) boot();
    return { studio: studio };
  }

  /* ================================================================ QUIZ */
  /* The drill's figure: the problem's null distribution, filled in as the
     steps are answered (the shading after the tail step, the p-value after
     the p step; for errors, the two curves after the power step). */
  function quizFigure(host, p, api){
    var fg = p.fig;
    if(!fg) return;
    var box = el('div', 'pv-qfig'), svgId = 'pvq' + (++uid);
    box.innerHTML = '<svg class="pv-svg" role="img" aria-labelledby="' + svgId + '-t"><title id="' + svgId + '-t"></title><g class="pv-layer"></g></svg>';
    host.appendChild(box);
    var svg = box.querySelector('svg'), layer = box.querySelector('.pv-layer'), title = box.querySelector('title');
    var state = { shade: false, showP: false, cut: false, power: false };
    function draw(w, h){
      svg.setAttribute('viewBox', '0 0 ' + w + ' ' + h); svg.setAttribute('width', w); svg.setAttribute('height', h);
      if(fg.kind === 'errors'){
        if(state.power){ var r = eFigure({ W: w, H: h, p0: fg.p0, n: fg.n, ha: fg.ha, alpha: fg.alpha, pa: fg.pa }, svgId); layer.innerHTML = r.svg; title.textContent = 'Null and true sampling distributions with the rejection region'; }
        else { var r0 = pFigure({ kind: 'prop', p0: fg.p0, n: fg.n, x: Math.round(fg.p0 * fg.n), ha: fg.ha, alpha: fg.alpha, W: w, H: h, cut: state.cut, noZ: true, noObs: true }, svgId); layer.innerHTML = r0.svg; title.textContent = 'Null distribution with the α cutoff'; }
        return;
      }
      var v = { W: w, H: h, shade: state.shade, showP: state.showP, cut: state.cut }; for(var k in fg) v[k] = fg[k];
      var rr = pFigure(v, svgId); layer.innerHTML = rr.svg;
      title.textContent = 'Null distribution with the observed value' + (state.shade ? ' and the p-value shaded' : '');
    }
    var sized = fit(box, draw);
    api.pvFig = { set: function(k){ state[k] = true; sized.redraw(); } };
  }

  T.mount(SLUG, function(app, data){
    var ex = null;
    T.modes(app, {
      slug: SLUG,
      explore: function(pane){ ex = explore(pane, data); },
      quiz: function(pane){
        T.drill(pane, data, {
          slug: SLUG, noun: 'test', newLabel: 'New problem',
          types: [{ value: 'pvalue', label: 'A z test, step by step' }, { value: 'tmean', label: 'A t test for a mean' }, { value: 'meaning', label: 'What a p-value says' }, { value: 'errors', label: 'Errors and power' }],
          typeLabel: 'Problem type',
          generate: function(r, c, t){ return texify(PV.generate(r, c, t)); },
          extra: quizFigure,
          onStep: function(s, right, api){
            if(!api.pvFig) return;
            if(s.key === 'tail' || s.key === 't' || s.key === 'shade'){ api.pvFig.set('shade'); }
            if(s.key === 'meaning'){ api.pvFig.set('showP'); }
            if(s.key === 'p'){ api.pvFig.set('shade'); api.pvFig.set('showP'); api.pvFig.set('cut'); }
            if(s.key === 'pI') api.pvFig.set('cut');
            if(s.key === 'power') api.pvFig.set('power');
          }
        });
      },
      studio: { explore: function(pane, s){ if(ex) ex.studio(pane, s); } }
    });
  });
})();
