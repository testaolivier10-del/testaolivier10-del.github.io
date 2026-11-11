/* Polar lab (Unit 9, Premium; docs/apcalcbc-spec.md section 6). Job: polar
   curves drawn as θ sweeps, with the area being swept shaded slice by slice
   and the setup ½∫ r² dθ built beside it, the area between two curves, dy/dx
   in polar, and what the sign of dr/dθ says (9.7-9.9). OWNED BY THIS TOOL ONLY
   (builder T2). Runs on calculus-bc/tools/polar-lab.html on top of AB's
   framework (ApCalcTools) and plots (ApCalcPlot), with its own model
   ApCalcMath.polarLab (calculus-bc/assets/tools/math/polar-lab.js).

   Explore: one curve (a region of it: one petal, an inner loop, a whole
   trace) or two curves (the region between them). Press Play, drag around
   the curve, drag on the r(θ) graph, or use the θ slider. The swept area is
   shaded in thin sectors, so a stretch traced twice shows darker; the current
   slice ½r²Δθ is highlighted; where r < 0 the point sits on the opposite ray.
   The r(θ) graph below is tinted where the point moves away from the origin
   (r and dr/dθ share a sign) and hatched where it moves toward it.

   Test yourself: seeded problems (points, dr/dθ, toward or away, dy/dx; the
   area inside a curve: limits, setup, value; the area between two curves:
   where they meet, setup, value), each with its curve. */
(function(){
  'use strict';
  var T = window.ApCalcTools, M = window.ApCalcMath, P = window.ApCalcPlot, X = window.ApCalcTex;
  (function(){
    var app = document.getElementById('app');
    if(app && !app.getAttribute('data-details-title')) app.setAttribute('data-details-title', 'Formulas & numbers');
  })();
  if(!T || !M || !M.polarLab || !P) return;
  var PL = M.polarLab, F = T.F, esc = T.esc, PI = Math.PI;
  function tex(s){ return X ? X.render(s) : esc(s); }
  function html(s){ return X ? X.html(s) : s; }
  function clamp(x, a, b){ return Math.max(a, Math.min(b, x)); }
  function r1(v){ return Math.round(v * 10) / 10; }
  function storeGet(k){ try{ return localStorage.getItem(k); }catch(e){ return null; } }
  function storeSet(k, v){ try{ localStorage.setItem(k, v); }catch(e){} }
  /* θ as the page prints it: a multiple of π/12 when it is one, else 2 places. */
  function thTxt(v){
    var k = Math.round(v / (PI / 12));
    if(Math.abs(v - k * PI / 12) > 1e-6) return F(v, 2);
    if(!k) return '0';
    var g = (function gcd(a, b){ return b ? gcd(b, a % b) : a; })(Math.abs(k), 12), n = k / g, d = 12 / g;
    return (n < 0 ? '−' : '') + (Math.abs(n) === 1 ? '' : Math.abs(n)) + 'π' + (d === 1 ? '' : '/' + d);
  }

  function thTex(v){ var k = Math.round(v / (PI / 12)); return Math.abs(v - k * PI / 12) < 1e-6 ? PL.piT(k, 12).tex : M.fixed(v, 2); }

  T.mount('polar-lab', function(app, data){
    var ex = null;
    T.modes(app, { slug: 'polar-lab',
      explore: function(host){ ex = explore(host, data); },
      quiz: function(host){ quiz(host, data); },
      onShow: function(m){ if(m !== 'explore' && ex) ex.pause(); },
      studio: { explore: function(pane, s){ ex.studio(pane, s); } } });
  });

  /* ============================================================ explore */
  function explore(host, data){
    var LS = null;
    var ids = (data.curves || []).map(function(c){ return c.id; });
    var ones = ids.filter(function(id){ return PL.CURVES[id]; }), twos = ids.filter(function(id){ return PL.PAIRS[id]; });
    if(!ones.length) ones = PL.ORDER.slice();
    var st = { mode: 'one', id: ones[0], reg: null, th: 0, playing: false, touched: false, show: { slice: true, tan: false } };
    try{ var sv = JSON.parse(storeGet('apcalcbc_polar-lab_pick') || 'null'); if(sv && (PL.CURVES[sv.id] && ones.indexOf(sv.id) > -1 || PL.PAIRS[sv.id] && twos.indexOf(sv.id) > -1)){ st.mode = PL.PAIRS[sv.id] ? 'two' : 'one'; st.id = sv.id; st.reg = sv.reg || null; } }catch(e){}
    var cache = {};
    function cur(){ return st.mode === 'two' ? PL.PAIRS[st.id] : PL.CURVES[st.id]; }
    function region(){ var c = cur(); if(st.mode === 'two') return c; return c.regions.filter(function(g){ return g.id === st.reg; })[0] || c.regions[0]; }
    function lims(){ var L = PL.limits(region()); return [L[0].v, L[1].v, L[0], L[1]]; }
    function key(){ return st.id + ':' + (st.mode === 'two' ? '' : region().id); }
    function info(){
      var k = key();
      if(!cache[k]){
        var c = cur(), L = lims(), Fc = PL.compiled(c), N = 480, tb = { th: [], r: [], dr: [], R: [], A: [] }, A = 0;
        for(var i = 0; i <= N; i++){
          var th = L[0] + (L[1] - L[0]) * i / N;
          if(i) A += PL.area(c, L[0] + (L[1] - L[0]) * (i - 1) / N, th);
          tb.th.push(th); tb.r.push(Fc.r(th)); tb.dr.push(Fc.dr(th)); tb.A.push(A);
          if(c.R) tb.R.push(Fc.R(th));
        }
        // the whole curve(s) for the faint outline and the scale
        var full = PL.trace(Fc.r, 0, 2 * PI, 480), fullR = c.R ? PL.trace(Fc.R, 0, 2 * PI, 480) : null;
        var zeros = M.roots(Fc.r, L[0], L[1], 900);
        cache[k] = { tb: tb, full: full, fullR: fullR, zeros: zeros, total: A };
      }
      return cache[k];
    }
    // The area swept up to θ itself, not the table's nearest sample (480 steps), so the three-decimal value
    // matches the upper limit shown in the set-up (θ = 1.88 gave 9.165, the area to 1.885; it is 9.160).
    function areaTo(th){ var L = lims(); return th <= L[0] ? 0 : PL.area(cur(), L[0], th); }
    var cue = T.cue('Press Play, or drag around the curve to sweep θ.');
    host.innerHTML =
      '<section class="bt-problem pl-card" aria-label="Polar lab explorer">' +
        '<div class="pl-stage">' +
          '<div class="pl-plane-wrap" tabindex="0" role="slider" aria-label="The angle θ: drag around the curve or use the arrow keys"><svg class="pl-plane" aria-hidden="true"></svg><div class="pl-setup" aria-hidden="true"></div></div>' +
          '<div class="pl-r-wrap"><svg class="pl-rg" aria-hidden="true"></svg></div>' +
          '<p class="pl-legend" aria-hidden="true"><span class="pl-lg pl-lg-r">r = f(θ)</span><span class="pl-lg pl-lg-R">outer R</span><span class="pl-lg pl-lg-A">area swept</span><span class="pl-lg pl-lg-s">this slice</span><span class="pl-lg pl-lg-up">moving away</span><span class="pl-lg pl-lg-dn">moving toward</span></p>' +
        '</div>' +
        '<div class="pl-ctl">' +
          (twos.length ? '<div class="pl-modes ls-seg" role="group" aria-label="Curves"><button type="button" class="bt-mode" data-m="one">One curve</button><button type="button" class="bt-mode" data-m="two">Between two</button></div>' : '') +
          '<div class="pl-chips ls-scroll" role="group" aria-label="Curve"></div>' +
          '<div class="pl-regs ls-seg" role="group" aria-label="Region"></div>' +
          '<div class="pl-time"><button type="button" class="bt-btn ls-btn ls-pri pl-play">Play</button><div class="pl-slot"></div></div>' +
          '<div class="pl-show ls-seg" role="group" aria-label="Show"><button type="button" class="bt-mode" data-k="slice">Slice</button><button type="button" class="bt-mode" data-k="tan">Tangent line</button></div>' +
        '</div>' +
        '<div class="pl-say"></div>' +
        '<div class="pl-det"></div>' +
        '<p class="sr-only pl-live"></p>' +
      '</section>';
    var card = host.querySelector('.pl-card');
    card.insertBefore(cue.el, card.querySelector('.pl-say'));
    var plane = host.querySelector('.pl-plane'), pwrap = host.querySelector('.pl-plane-wrap'), rg = host.querySelector('.pl-rg'), rwrap = host.querySelector('.pl-r-wrap'), setupEl = host.querySelector('.pl-setup');
    var chips = host.querySelector('.pl-chips'), regs = host.querySelector('.pl-regs'), modesEl = host.querySelector('.pl-modes'), showEl = host.querySelector('.pl-show'), playBtn = host.querySelector('.pl-play'), legend = host.querySelector('.pl-legend');
    var say = T.announcer(host.querySelector('.pl-live'));
    var so = { label: 'Angle θ', min: 0, max: 1, step: 0.005, value: 0, decimals: 2, onInput: function(v){ pause(); setTh(v); } }, slider = T.slider(so);
    host.querySelector('.pl-slot').appendChild(slider.el);
    var loop = null, pl = null, gl = null;

    function syncShow(){ showEl.querySelectorAll('.bt-mode').forEach(function(b){ b.setAttribute('aria-pressed', String(!!st.show[b.getAttribute('data-k')])); }); }
    syncShow();
    showEl.addEventListener('click', function(e){ var b = e.target.closest('.bt-mode'); if(!b) return; var k = b.getAttribute('data-k'); st.show[k] = !st.show[k]; touch(); syncShow(); draw(false); });
    function controls(){
      if(modesEl) modesEl.querySelectorAll('.bt-mode').forEach(function(b){ b.setAttribute('aria-pressed', String(b.getAttribute('data-m') === st.mode)); });
      var list = st.mode === 'two' ? twos : ones, src = st.mode === 'two' ? PL.PAIRS : PL.CURVES;
      chips.innerHTML = list.map(function(id){ return '<button type="button" class="bt-btn pl-chip" data-id="' + id + '" aria-pressed="' + (id === st.id) + '">' + esc(src[id].name) + '</button>'; }).join('');
      var on = chips.querySelector('[aria-pressed="true"]'); if(on) chips.scrollLeft = Math.max(0, on.offsetLeft - chips.offsetLeft - 16);
      var rs = st.mode === 'one' ? cur().regions : [];
      regs.hidden = rs.length < 2;
      regs.innerHTML = rs.map(function(g){ return '<button type="button" class="bt-mode" data-r="' + g.id + '" aria-pressed="' + (g.id === region().id) + '">' + esc(g.name) + '</button>'; }).join('');
      legend.classList.toggle('is-two', st.mode === 'two');
    }
    function setPick(mode, id, reg){
      pause(); st.mode = mode; st.id = id; st.reg = reg || null;
      storeSet('apcalcbc_polar-lab_pick', JSON.stringify({ id: st.id, reg: st.reg }));
      var L = lims(); st.th = Math.round((L[0] + (L[1] - L[0]) * 0.3) * 100) / 100;   // on a slider step, so its readout and the θ pill agree
      so.min = L[0]; so.max = L[1]; slider.input.min = String(L[0]); slider.input.max = String(L[1]); slider.set(st.th);
      pwrap.setAttribute('aria-valuemin', M.fixed(L[0], 2)); pwrap.setAttribute('aria-valuemax', M.fixed(L[1], 2));
      controls(); pl = null; gl = null; draw(true);
    }
    chips.addEventListener('click', function(e){ var b = e.target.closest('.pl-chip'); if(b){ touch(); setPick(st.mode, b.getAttribute('data-id')); } });
    regs.addEventListener('click', function(e){ var b = e.target.closest('.bt-mode'); if(b){ touch(); setPick('one', st.id, b.getAttribute('data-r')); } });
    if(modesEl) modesEl.addEventListener('click', function(e){ var b = e.target.closest('.bt-mode'); if(!b) return; var m = b.getAttribute('data-m'); if(m === st.mode) return; touch(); setPick(m, (m === 'two' ? twos : ones)[0]); });
    function touch(){ if(!st.touched){ st.touched = true; cue.done(); } }
    function setTh(v){ var L = lims(); st.th = clamp(v, L[0], L[1]); touch(); draw(true); }
    function idx(th){ var L = lims(), n = info().tb.th.length - 1; return clamp(Math.round((th - L[0]) / (L[1] - L[0]) * n), 0, n); }

    /* ------------------------------------------------ the polar plane */
    function planeLayout(){
      var w = Math.max(260, Math.round(pwrap.clientWidth || 600)), h = Math.max(200, Math.round(pwrap.clientHeight || 420)), I = info();
      var pts = I.full.concat(I.fullR || []), xs = pts.map(function(q){ return q[0]; }).concat([0]), ys = pts.map(function(q){ return q[1]; }).concat([0]);
      var x0 = Math.min.apply(null, xs), x1 = Math.max.apply(null, xs), y0 = Math.min.apply(null, ys), y1 = Math.max.apply(null, ys);
      var span = Math.max(x1 - x0, y1 - y0, 1), pad = span * 0.12; x0 -= pad; x1 += pad; y0 -= pad; y1 += pad;
      var top = 52, k = Math.min((w - 24) / (x1 - x0), (h - top - 12) / (y1 - y0)), cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
      var X0 = cx - (w / 2) / k, Y1 = cy + ((h + top) / 2 - 6) / k;
      var rmax = Math.max.apply(null, pts.map(function(q){ return Math.hypot(q[0], q[1]); }));
      return { w: w, h: h, k: k, rmax: rmax, sx: function(x){ return (x - X0) * k; }, sy: function(y){ return (Y1 - y) * k; },
        ix: function(px){ return X0 + px / k; }, iy: function(py){ return Y1 - py / k; } };
    }
    function polyPts(g, list){ return list.map(function(q){ return r1(g.sx(q[0])) + ',' + r1(g.sy(q[1])); }).join(' '); }
    function drawPlane(){
      if(!pl) pl = planeLayout();
      var g = pl, c = cur(), I = info(), tb = I.tb, th = st.th, i = idx(th), L = lims(), o = [], two = st.mode === 'two';
      var ox = g.sx(0), oy = g.sy(0);
      plane.setAttribute('viewBox', '0 0 ' + g.w + ' ' + g.h);
      o.push('<rect class="pl-bg" x="0" y="0" width="' + g.w + '" height="' + g.h + '" rx="12"/>');
      // the polar grid: circles at nice radii, rays every π/6
      var rt = P.ticks(0, g.rmax * 1.05, 4).filter(function(v){ return v > 0; }), R0 = rt[rt.length - 1] || g.rmax;
      o.push('<g class="pl-grid">' + rt.map(function(v){ return '<circle cx="' + r1(ox) + '" cy="' + r1(oy) + '" r="' + r1(v * g.k) + '"/>'; }).join('') +
        Array.apply(null, Array(12)).map(function(_, j){ var a = j * PI / 6; return '<line x1="' + r1(ox) + '" y1="' + r1(oy) + '" x2="' + r1(ox + Math.cos(a) * R0 * g.k * 1.04) + '" y2="' + r1(oy - Math.sin(a) * R0 * g.k * 1.04) + '"/>'; }).join('') + '</g>');
      o.push('<g class="pl-tk">' + rt.map(function(v){ return '<text x="' + r1(ox + v * g.k * Math.cos(-0.18) + 2) + '" y="' + r1(oy - v * g.k * Math.sin(-0.18) + 4) + '">' + F(v, v % 1 ? 1 : 0) + '</text>'; }).join('') +
        Array.apply(null, Array(12)).map(function(_, j){ var a = j * PI / 6, px = ox + Math.cos(a) * R0 * g.k * 1.13, py = oy - Math.sin(a) * R0 * g.k * 1.13; if(px < 10 || px > g.w - 10 || py < 54 || py > g.h - 6) return ''; return '<text class="pl-ang" x="' + r1(px) + '" y="' + r1(py + 4) + '" text-anchor="middle">' + thTxt(a) + '</text>'; }).join('') + '</g>');
      // the swept area: thin sectors in groups (a stretch traced twice shows darker)
      var fans = [], step = 8;
      if(two){
        if(i > 0){
          var outer = [], inner = [];
          for(var j = 0; j <= i; j++){ var a1 = tb.th[j]; outer.push([tb.R[j] * Math.cos(a1), tb.R[j] * Math.sin(a1)]); inner.push([tb.r[j] * Math.cos(a1), tb.r[j] * Math.sin(a1)]); }
          fans.push('<polygon class="pl-area" points="' + polyPts(g, outer.concat(inner.reverse())) + '"/>');
        }
      } else for(var s0 = 0; s0 < i; s0 += step){
        var fan = [[0, 0]];
        for(var j2 = s0; j2 <= Math.min(i, s0 + step); j2++){ var a2 = tb.th[j2]; fan.push([tb.r[j2] * Math.cos(a2), tb.r[j2] * Math.sin(a2)]); }
        fans.push('<polygon class="pl-area" points="' + polyPts(g, fan) + '"/>');
      }
      o.push('<g class="pl-areas">' + fans.join('') + '</g>');
      // the curves: faint whole, strong swept part
      o.push('<polyline class="pl-curve-all" points="' + polyPts(g, I.full) + '"/>');
      if(two) o.push('<polyline class="pl-curve-all is-R" points="' + polyPts(g, I.fullR) + '"/>');
      var sw = [], swR = [];
      for(var j3 = 0; j3 <= i; j3++){ var a3 = tb.th[j3]; sw.push([tb.r[j3] * Math.cos(a3), tb.r[j3] * Math.sin(a3)]); if(two) swR.push([tb.R[j3] * Math.cos(a3), tb.R[j3] * Math.sin(a3)]); }
      if(i > 0){ o.push('<polyline class="pl-curve-on" points="' + polyPts(g, sw) + '"/>'); if(two) o.push('<polyline class="pl-curve-on is-R" points="' + polyPts(g, swR) + '"/>'); }
      // the slice at θ
      var Fc = PL.compiled(c), rr = Fc.r(th), dth = (L[1] - L[0]) / 28;
      if(st.show.slice){
        var b0 = Math.max(L[0], th - dth), wedge = [];
        var outerF = two ? Fc.R : Fc.r;
        for(var q = 0; q <= 6; q++){ var a4 = b0 + (th - b0) * q / 6, rv = outerF(a4); wedge.push([rv * Math.cos(a4), rv * Math.sin(a4)]); }
        if(two){ for(var q2 = 6; q2 >= 0; q2--){ var a5 = b0 + (th - b0) * q2 / 6, rv2 = Fc.r(a5); wedge.push([rv2 * Math.cos(a5), rv2 * Math.sin(a5)]); } }
        else wedge.unshift([0, 0]);
        if(th - b0 > 1e-6) o.push('<polygon class="pl-slice" points="' + polyPts(g, wedge) + '"/>');
      }
      // the ray at θ (and, where r < 0, the opposite ray the point sits on)
      var ca = Math.cos(th), sa = Math.sin(th), Rr = R0 * g.k * 1.04;
      o.push('<line class="pl-ray" x1="' + r1(ox) + '" y1="' + r1(oy) + '" x2="' + r1(ox + ca * Rr) + '" y2="' + r1(oy - sa * Rr) + '"/>');
      if(rr < -1e-9) o.push('<line class="pl-ray-neg" x1="' + r1(ox) + '" y1="' + r1(oy) + '" x2="' + r1(ox - ca * Rr * 0.9) + '" y2="' + r1(oy + sa * Rr * 0.9) + '"/>');
      // the angle arc
      var arcR = Math.min(26, R0 * g.k * 0.18), arcN = Math.max(2, Math.round(Math.abs(th) / 0.1)), arc = [];
      for(var q3 = 0; q3 <= arcN; q3++){ var a6 = th * q3 / arcN; arc.push(r1(ox + Math.cos(a6) * arcR) + ',' + r1(oy - Math.sin(a6) * arcR)); }
      o.push('<polyline class="pl-arc" points="' + arc.join(' ') + '"/><text class="pl-arcl" x="' + r1(ox + Math.cos(th / 2) * (arcR + 11)) + '" y="' + r1(oy - Math.sin(th / 2) * (arcR + 11) + 4) + '" text-anchor="middle">θ</text>');
      // tangent line
      var s = PL.at(c, th);
      if(st.show.tan && Math.hypot(s.dx, s.dy) > 1e-6){
        var Lt = Math.max(g.w, g.h) * 0.2, un = Math.hypot(s.dx, s.dy), ux = s.dx / un, uy = s.dy / un, px = g.sx(s.x), py = g.sy(s.y);
        o.push('<line class="pl-tan" x1="' + r1(px - ux * Lt) + '" y1="' + r1(py + uy * Lt) + '" x2="' + r1(px + ux * Lt) + '" y2="' + r1(py - uy * Lt) + '"/>');
      }
      if(two){ var sR = PL.at(c, th, 'R'); o.push('<circle class="pl-dot is-R" cx="' + r1(g.sx(sR.x)) + '" cy="' + r1(g.sy(sR.y)) + '" r="6.5"/>'); }
      o.push('<circle class="pl-origin" cx="' + r1(ox) + '" cy="' + r1(oy) + '" r="3"/>');
      o.push('<circle class="pl-dot" cx="' + r1(g.sx(s.x)) + '" cy="' + r1(g.sy(s.y)) + '" r="7.5"/>');
      plane.innerHTML = o.join('');
      pwrap.setAttribute('aria-valuenow', M.fixed(th, 2));
      pwrap.setAttribute('aria-valuetext', 'θ = ' + thTxt(th) + ': r = ' + F(rr, 2) + ', area swept ' + F(areaTo(th), 2));
    }

    /* ------------------------------------------------ r against θ */
    function rLayout(){
      var w = Math.max(260, Math.round(rwrap.clientWidth || 600)), h = Math.max(70, Math.round(rwrap.clientHeight || 112)), tb = info().tb, L = lims();
      var all = tb.r.concat(tb.R), lo = Math.min(0, Math.min.apply(null, all)), hi = Math.max(0, Math.max.apply(null, all)), pad = (hi - lo) * 0.12 || 1;
      lo -= pad; hi += pad;
      if(h < 96) hi += (hi - lo) * 0.28;   // on a phone's short panel the curves stay under the panel's name
      var Lm = w < 420 ? 34 : 40, R = 10, top = 6, bot = 20;
      return { w: w, h: h, L: Lm, R: R, top: top, bot: bot, pw: w - Lm - R, ph: h - top - bot, lo: lo, hi: hi,
        gx: function(t){ return Lm + (t - L[0]) / (L[1] - L[0]) * (w - Lm - R); }, gy: function(v){ return top + (hi - v) / (hi - lo) * (h - top - bot); } };
    }
    function drawR(){
      if(!gl) gl = rLayout();
      var g = gl, I = info(), tb = I.tb, th = st.th, i = idx(th), L = lims(), N = tb.th.length - 1, o = [], two = st.mode === 'two';
      rg.setAttribute('viewBox', '0 0 ' + g.w + ' ' + g.h);
      o.push('<defs><pattern id="pl-hatch" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="7" class="pl-hatch-l"/></pattern></defs>');
      o.push('<rect class="pl-panel" x="' + g.L + '" y="' + g.top + '" width="' + g.pw + '" height="' + g.ph + '" rx="6"/>');
      // away (r·r′ > 0) tinted, toward hatched
      var j = 0;
      while(j < N){
        var k0 = j, m0 = PL.motion(tb.r[j], tb.dr[j]);
        while(j < N && PL.motion(tb.r[j + 1], tb.dr[j + 1]) === m0) j++;
        j++;
        if(m0 === 'away' || m0 === 'toward') o.push('<rect class="pl-band ' + (m0 === 'away' ? 'is-up' : 'is-dn') + '" x="' + r1(g.gx(tb.th[k0])) + '" y="' + g.top + '" width="' + r1(g.gx(tb.th[Math.min(N, j)]) - g.gx(tb.th[k0])) + '" height="' + g.ph + '"' + (m0 === 'toward' ? ' fill="url(#pl-hatch)"' : '') + '/>');
      }
      P.ticks(g.lo, g.hi, 3).forEach(function(v){ var py = r1(g.gy(v)); o.push('<line class="pl-rgrid' + (Math.abs(v) < 1e-12 ? ' is-zero' : '') + '" x1="' + g.L + '" y1="' + py + '" x2="' + (g.L + g.pw) + '" y2="' + py + '"/><text class="pl-tk2" x="' + (g.L - 5) + '" y="' + (+py + 3.5) + '" text-anchor="end">' + F(v, v % 1 ? 1 : 0) + '</text>'); });
      function line(arr, cls){ var a = []; for(var q = 0; q <= N; q++) a.push(r1(g.gx(tb.th[q])) + ',' + r1(g.gy(arr[q]))); o.push('<polyline class="pl-rcurve ' + cls + '" points="' + a.join(' ') + '"/>'); }
      if(two) line(tb.R, 'is-R');
      line(tb.r, '');
      I.zeros.forEach(function(z){ o.push('<circle class="pl-zero" cx="' + r1(g.gx(z)) + '" cy="' + r1(g.gy(0)) + '" r="4"/>'); });
      // θ ticks: multiples of π/4 (π/6 on a short interval)
      var span = L[1] - L[0], unit = span <= PI / 1.4 ? PI / 12 : span <= 1.6 * PI ? PI / 6 : PI / 4, tt = [];
      for(var v = Math.ceil(L[0] / unit - 1e-9) * unit; v <= L[1] + 1e-9; v += unit) tt.push(v);
      while(tt.length > Math.max(4, Math.min(9, g.pw / 52))) tt = tt.filter(function(x, q){ return q % 2 === 0; });
      o.push('<g class="pl-taxis">' + tt.map(function(v){ return '<text x="' + r1(g.gx(v)) + '" y="' + (g.h - 5) + '" text-anchor="middle">' + thTxt(v) + '</text>'; }).join('') + '</g>');
      o.push('<text class="pl-rl" x="' + (g.L + 6) + '" y="' + (g.top + 13) + '">' + (two ? 'R and r' : 'r') + ' against θ</text>');
      var cx = r1(g.gx(th));
      o.push('<line class="pl-cur" x1="' + cx + '" y1="' + g.top + '" x2="' + cx + '" y2="' + (g.top + g.ph) + '"/><circle class="pl-cur-pt" cx="' + cx + '" cy="' + r1(g.gy(tb.r[i])) + '" r="4.5"/>');
      if(two) o.push('<circle class="pl-cur-pt is-R" cx="' + cx + '" cy="' + r1(g.gy(tb.R[i])) + '" r="4.5"/>');
      rg.innerHTML = o.join('');
    }

    /* ---------------------------------------------------- words */
    var lastCap = '', lastSetup = '';
    function setupTex(){
      var c = cur(), L = lims(), lo = L[2].tex, two = st.mode === 'two';
      var body = two ? '\\left[\\left(' + PL.tx(c.R) + '\\right)^2 - \\left(' + PL.tx(c.r) + '\\right)^2\\right]' : '\\left(' + PL.tx(c.r) + '\\right)^2';
      return { lo: lo, body: body, full: '\\frac{1}{2}\\int_{' + lo + '}^{' + L[3].tex + '} ' + body + '\\,d\\theta' };
    }
    function words(full){
      var c = cur(), th = st.th, I = info(), i = idx(th), A = areaTo(th), d = PL.describe(c, th), s = d.s, two = st.mode === 'two', reg = region(), S = setupTex();
      // the setup line under the plane: built to the current θ
      var sKey = key() + ':' + M.fixed(th, 2);
      if(sKey !== lastSetup){
        lastSetup = sKey;
        // the integral and its value are two pieces, so on a phone the value drops to the next line instead of off the edge
        setupEl.innerHTML = '<span class="pl-su-k">Area swept</span> <span class="pl-su-p">' + tex('\\frac{1}{2}\\int_{' + S.lo + '}^{' + thTex(th) + '} ' + S.body + '\\,d\\theta') + '</span> <span class="pl-su-p">' + tex('\\approx ' + M.fixed(A, 3)) + '</span>';
        setupEl.classList.toggle('is-long', st.mode === 'two');
      }
      var Lm = lims(), whole = M.fixed(I.total, 3);
      var body = '<ul class="pl-why">' +
        '<li><b>The point:</b> $x = r\\cos\\theta \\approx ' + F(s.x, 2) + '$ and $y = r\\sin\\theta \\approx ' + F(s.y, 2) + '$, with $r \\approx ' + F(s.r, 2) + '$.' + (s.r < -1e-9 ? ' Since $r < 0$, the point is on the opposite ray, $|r|$ from the origin.' : '') + '</li>' +
        '<li><b>Toward or away:</b> the distance from the origin is $|r|$. Here $r ' + (s.r > 0 ? '> 0' : s.r < 0 ? '< 0' : '= 0') + '$ and $\\frac{dr}{d\\theta} \\approx ' + F(s.dr, 2) + '$, so the point moves ' + (d.state === 'away' ? 'away from' : d.state === 'toward' ? 'toward' : 'neither toward nor away from') + ' the origin. The sign of $\\frac{dr}{d\\theta}$ alone decides only when $r > 0$.</li>' +
        '<li><b>Slope:</b> $\\frac{dy}{dx} = \\frac{dr/d\\theta\\,\\sin\\theta + r\\cos\\theta}{dr/d\\theta\\,\\cos\\theta - r\\sin\\theta}' + (isFinite(s.slope) ? ' \\approx ' + F(s.slope, 2) + '$.' : '$, whose denominator is $0$ here: a vertical tangent.') + ' It is not $\\frac{dr}{d\\theta}$.</li>' +
        '<li><b>Area:</b> each thin slice is a sector of area about $\\frac{1}{2}r^2\\,\\Delta\\theta$' + (two ? ', and between two curves the slice is $\\frac{1}{2}(R^2 - r^2)\\,\\Delta\\theta$, outer minus inner' : '') + '. Adding the slices: $' + S.full + ' \\approx ' + whole + '$. So far, to this $\\theta$: $' + M.fixed(A, 3) + '$.</li>' +
        (reg.twice ? '<li><b>Traced twice:</b> from $0$ to $2\\pi$ the inner loop is swept twice (it shows darker), so this integral counts it twice. One loop runs between consecutive zeros of $r$.</li>' : '') +
        (!two && I.zeros.length ? '<li><b>Limits:</b> $r = 0$ at $\\theta \\approx ' + I.zeros.map(function(z){ return M.fixed(z, 3); }).join(', ') + '$. A petal or loop runs between consecutive zeros.</li>' : '') +
        '</ul>';
      T.explain(host.querySelector('.pl-say') || (LS && LS.root.querySelector('.pl-say')), d.head, html(body));
      details(c, th, s, A, Lm);
      if(LS && d.head !== lastCap){ LS.caption(esc(d.head), 'explore'); lastCap = d.head; }
      pills();
      if(full) say(d.head + ' Area swept so far ' + F(A, 2) + '.');
    }
    function pills(){
      if(!LS) return;
      var c = cur(), th = st.th, s = PL.at(c, th), A = areaTo(th), narrow = false;
      try{ narrow = LS.root.classList.contains('ls-phone') || matchMedia('(max-width: 599.98px)').matches; }catch(e){}
      LS.pills(narrow ? [{ html: '<span class="pl-pk">r</span> ' + F(s.r, 2) + ' · <span class="pl-pk">dr/dθ</span> ' + F(s.dr, 2), tone: 'ghost' }]
        : [{ k: 'r', html: F(s.r, 2), tone: 'readout' }, { k: 'dr/dθ', html: F(s.dr, 2), tone: 'readout' }], 'left', 'explore');   // pass 2: the area is in the set-up on the picture
      LS.pills([{ html: 'θ = ' + thTxt(th), tone: st.playing ? 'accent' : 'ghost' }], 'right', 'explore');
    }
    function details(c, th, s, A, Lm){
      var two = st.mode === 'two', S = setupTex();
      var rows = two ? [['Outer', '$R = ' + PL.tx(c.R) + '$'], ['Inner', '$r = ' + PL.tx(c.r) + '$'], ['They meet at', '$\\theta = ' + Lm[2].tex + '$ and $\\theta = ' + Lm[3].tex + '$'], ['Area', '$' + S.full + ' = ' + c.exactTex + '$']]
        : [['Curve', '$r = ' + PL.tx(c.r) + '$'], ['Rate', '$\\frac{dr}{d\\theta} = ' + PL.tx(c.dr) + '$'], ['Region', esc(region().name) + ': $' + Lm[2].tex + ' \\le \\theta \\le ' + Lm[3].tex + '$'], ['Area', '$' + S.full + '$']];
      var el = host.querySelector('.pl-det') || (LS && LS.root.querySelector('.pl-det'));
      el.innerHTML = '<h3 class="ls-title-l">' + esc(c.name) + '</h3><table class="ls-tbl pl-ftbl"><tbody>' + rows.map(function(r){ return '<tr><th scope="row">' + r[0] + '</th><td>' + html(r[1]) + '</td></tr>'; }).join('') + '</tbody></table>' +
        '<h3 class="ls-title-l">At θ = ' + thTxt(th) + ' (' + F(th, 3) + ' rad)</h3><table class="ls-tbl"><tbody>' +
        [['r', F(s.r, 3)], ['dr/dθ', F(s.dr, 3)], ['(x, y)', '(' + F(s.x, 3) + ', ' + F(s.y, 3) + ')'], ['dx/dθ', F(s.dx, 3)], ['dy/dθ', F(s.dy, 3)], ['dy/dx', isFinite(s.slope) ? F(s.slope, 3) : 'does not exist (dx/dθ = 0)'],
          ['Area swept so far', F(A, 3)], ['Area of the whole region', F(info().total, 3)]].map(function(r){ return '<tr><th scope="row">' + r[0] + '</th><td class="r">' + r[1] + '</td></tr>'; }).join('') + '</tbody></table>' +
        '<p class="bt-small">Areas are integrated numerically (adaptive Simpson) from the formula shown.' + (two ? ' The exact value above comes from the double-angle identities.' : '') + '</p>';
    }

    /* ---------------------------------------------------- the sweep */
    function draw(full){
      drawPlane(); drawR();
      if(full || !st.playing || (st.th * 6 | 0) !== draw.q){ draw.q = st.th * 6 | 0; words(full); }
      else pills();
      if(Math.abs(slider.value() - st.th) > 1e-6) slider.set(st.th);
    }
    function play(){
      var L = lims();
      if(st.th >= L[1] - 1e-6) st.th = L[0];
      st.playing = true; touch(); playBtn.textContent = 'Pause';
      var rate = (L[1] - L[0]) / 6;
      loop = P.loop(function(dt){ var Q = lims(); st.th = Math.min(Q[1], st.th + dt * rate); draw(false); if(st.th >= Q[1]) return false; },
        { still: function(){ st.th = lims()[1]; }, onEnd: function(){ st.playing = false; playBtn.textContent = 'Play'; draw(true); } });
      loop.start();
    }
    function pause(){ if(loop) loop.stop(); if(st.playing){ st.playing = false; playBtn.textContent = 'Play'; draw(true); } }
    playBtn.addEventListener('click', function(){ if(st.playing) pause(); else play(); });
    (function(){
      // drag on the plane: the nearest point of the region's curve, preferring nearby θ
      function nearest(e){
        var b = plane.getBoundingClientRect(); if(!pl) return st.th;
        var px = (e.clientX - b.left) * pl.w / b.width, py = (e.clientY - b.top) * pl.h / b.height, tb = info().tb, best = 0, bd = Infinity, i0 = idx(st.th), N = tb.th.length - 1;
        for(var j = 0; j <= N; j++){
          var a = tb.th[j], rr = st.mode === 'two' ? tb.R[j] : tb.r[j];
          var d = Math.hypot(pl.sx(rr * Math.cos(a)) - px, pl.sy(rr * Math.sin(a)) - py) + Math.abs(j - i0) * 0.03;
          if(d < bd){ bd = d; best = j; }
        }
        return tb.th[best];
      }
      var on = false;
      plane.addEventListener('pointerdown', function(e){ pause(); on = true; try{ plane.setPointerCapture(e.pointerId); }catch(er){} setTh(nearest(e)); });
      plane.addEventListener('pointermove', function(e){ if(on) setTh(nearest(e)); });
      plane.addEventListener('pointerup', function(){ on = false; });
      plane.addEventListener('pointercancel', function(){ on = false; });
      function toTh(e){ var b = rg.getBoundingClientRect(); if(!gl) return st.th; var px = (e.clientX - b.left) * gl.w / b.width, L = lims(); return clamp(L[0] + (px - gl.L) / gl.pw * (L[1] - L[0]), L[0], L[1]); }
      var on2 = false;
      rg.addEventListener('pointerdown', function(e){ pause(); on2 = true; try{ rg.setPointerCapture(e.pointerId); }catch(er){} setTh(toTh(e)); });
      rg.addEventListener('pointermove', function(e){ if(on2) setTh(toTh(e)); });
      rg.addEventListener('pointerup', function(){ on2 = false; });
      rg.addEventListener('pointercancel', function(){ on2 = false; });
      pwrap.addEventListener('keydown', function(e){
        var L = lims(), k = e.key, d = k === 'ArrowRight' || k === 'ArrowUp' ? 1 : k === 'ArrowLeft' || k === 'ArrowDown' ? -1 : 0;
        if(k === 'Home'){ e.preventDefault(); pause(); return setTh(L[0]); }
        if(k === 'End'){ e.preventDefault(); pause(); return setTh(L[1]); }
        if(!d) return;
        e.preventDefault(); pause(); setTh(st.th + d * (e.shiftKey ? PI / 12 : PI / 180));
      });
    })();
    if(window.ResizeObserver){
      var ro = new ResizeObserver(function(){
        var w1 = Math.round(pwrap.clientWidth), h1 = Math.round(pwrap.clientHeight), w2 = Math.round(rwrap.clientWidth), h2 = Math.round(rwrap.clientHeight);
        if(pl && w1 === pl.w && h1 === pl.h && gl && w2 === gl.w && h2 === gl.h) return;
        pl = null; gl = null; draw(false);
      });
      ro.observe(pwrap); ro.observe(rwrap);
    }

    function studio(pane, s){
      LS = s;
      var o = { mode: 'explore' };
      var stage = document.createElement('div'); stage.className = 'calc-ls-stage pl-ls-stage'; stage.appendChild(host.querySelector('.pl-stage'));
      s.add('stage', stage, o);
      var dock = document.createElement('div'); dock.className = 'calc-ls-dock pl-ls-dock'; dock.appendChild(host.querySelector('.pl-ctl'));
      s.add('dock', dock, o);
      var why = document.createElement('div'); why.className = 'ls-sec calc-ls-why pl-ls-why'; why.appendChild(cue.el); why.appendChild(host.querySelector('.pl-say'));
      s.add('why', why, o);
      why.querySelectorAll('details.bt-why').forEach(function(d){ d.open = true; });
      var det = document.createElement('div'); det.className = 'ls-sec calc-ls-det pl-ls-det'; det.appendChild(host.querySelector('.pl-det'));
      s.add('details', det, o);
      lastCap = ''; lastSetup = ''; pl = null; gl = null;
      draw(true);
      if(s.mode() === 'explore') s.hint({ target: playBtn, text: 'Press Play to sweep θ', key: 'apcalcbc-polar-lab-play' });
    }
    setPick(st.mode, st.id, st.reg);
    return { pause: pause, studio: studio };
  }

  /* ============================================================ test yourself */
  function figSize(w, h){
    var W = window.innerWidth || 1280, Hh = window.innerHeight || 800;
    if(W <= 640) return [340, Math.round(Math.max(260, Math.min(400, Hh * 0.58 - 90)))];
    if(W <= 999 && Hh <= 540) return [440, Math.round(Math.max(220, Math.min(300, Hh - 110)))];
    return [w, h];
  }
  function curvesOf(p){ return p.fig.curves.map(function(c){ return { cls: c.cls, pts: PL.trace(PL.fn(c.r), c.a, c.b, 360) }; }); }
  /* On a phone the quiz stage can be much shorter than the plot was drawn for (a step with four long choices
     leaves it 240px): the plot was then shrunk to fit and its numbers fell to 7px. Redraw it to the slot's shape. */
  function fitSlot(box, me, redraw){
    if(!window.ResizeObserver) return;
    new ResizeObserver(function(){
      var svg = box.querySelector('svg');
      if(!svg || (window.innerWidth || 1280) > 640 || !box.closest || !box.closest('.ls-stage')) return;
      var r = svg.getBoundingClientRect(), vb = svg.viewBox && svg.viewBox.baseVal;
      if(!vb || !vb.height || r.width < 120 || r.height < 120) return;
      var h = Math.max(170, Math.min(440, Math.round(340 * r.height / r.width)));
      if(Math.abs(h - vb.height) / vb.height > 0.12){ me.size = [340, h]; redraw(); }
    }).observe(box);
  }
  function figSpec(p, cs, size){
    var sz = size || figSize(520, 400), all = [].concat.apply([[0, 0]], cs.map(function(c){ return c.pts; }));
    var xs = all.map(function(q){ return q[0]; }), ys = all.map(function(q){ return q[1]; });
    var x0 = Math.min.apply(null, xs), x1 = Math.max.apply(null, xs), y0 = Math.min.apply(null, ys), y1 = Math.max.apply(null, ys), pad = Math.max(x1 - x0, y1 - y0, 1) * 0.08;
    x0 -= pad; x1 += pad; y0 -= pad; y1 += pad;
    var pw = sz[0] - 48, ph = sz[1] - 40, k = Math.min(pw / (x1 - x0), ph / (y1 - y0)), cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
    return { label: p.fig.label, width: sz[0], height: sz[1], x: [cx - pw / 2 / k, cx + pw / 2 / k], y: [cy - ph / 2 / k, cy + ph / 2 / k], xLabel: 'x', yLabel: 'y', curves: [], points: [] };
  }
  function figSvg(Fr, p, cs, shade){
    var o = ['<g class="pl-fig" aria-hidden="true">'], f = p.fig, pts = function(list){ return list.map(function(q){ return r1(Fr.sx(q[0])) + ',' + r1(Fr.sy(q[1])); }).join(' '); };
    if(shade && f.region){
      var g = f.region, out = PL.trace(PL.fn(g.outer), g.a, g.b, 240), poly = g.inner ? out.concat(PL.trace(PL.fn(g.inner), g.a, g.b, 240).reverse()) : [[0, 0]].concat(out);
      o.push('<polygon class="pl-farea" points="' + pts(poly) + '"/>');
      [g.a, g.b].forEach(function(a){ var R = Math.max(Math.abs(Fr.x[1] - Fr.x[0]), Math.abs(Fr.y[1] - Fr.y[0])); o.push('<line class="pl-fray" x1="' + r1(Fr.sx(0)) + '" y1="' + r1(Fr.sy(0)) + '" x2="' + r1(Fr.sx(R * Math.cos(a))) + '" y2="' + r1(Fr.sy(R * Math.sin(a))) + '"/>'); });
    }
    cs.forEach(function(c){ o.push('<polyline class="pl-fcurve is-' + c.cls + '" points="' + pts(c.pts) + '"/>'); });
    if(f.mark){
      var r = PL.fn(f.mark.r)(f.mark.th), x = r * Math.cos(f.mark.th), y = r * Math.sin(f.mark.th), R2 = Math.max(Math.abs(Fr.x[1] - Fr.x[0]), Math.abs(Fr.y[1] - Fr.y[0]));
      o.push('<line class="pl-fray" x1="' + r1(Fr.sx(0)) + '" y1="' + r1(Fr.sy(0)) + '" x2="' + r1(Fr.sx(R2 * Math.cos(f.mark.th))) + '" y2="' + r1(Fr.sy(R2 * Math.sin(f.mark.th))) + '"/>');
      o.push('<circle class="pl-fmark" cx="' + r1(Fr.sx(x)) + '" cy="' + r1(Fr.sy(y)) + '" r="6"/>');
    }
    o.push('</g>');
    return o.join('');
  }
  function polarFigure(box, p){
    var marks = T.tries(), cs = curvesOf(p), me = { marks: marks, shade: p.type !== 'area' };
    function redraw(){
      var spec = figSpec(p, cs, me.size), svg;
      try{ svg = P.svg(spec); }catch(e){ return; }
      var Fr = P.frame(spec);
      box.innerHTML = '<div class="pl-figwrap">' + svg.replace(/<\/svg>$/, figSvg(Fr, p, cs, me.shade) + marks.svg(Fr) + '</svg>') + '</div>';
    }
    redraw();
    me.redraw = redraw;
    fitSlot(box, me, redraw);
    return me;
  }
  var METHOD = {
    x: 'x = r cos θ: find r at that angle first.', dr: 'Differentiate r with respect to θ, then put the angle in.',
    move: 'Compare the signs of r and dr/dθ: the same sign means |r| grows (away), opposite signs mean it shrinks (toward).',
    dydx: 'dy/dx = (dy/dθ) ÷ (dx/dθ), with y = r sin θ and x = r cos θ differentiated by the product rule.',
    lim: 'One petal or loop runs between consecutive zeros of r; a curve with r > 0 everywhere needs a full turn.',
    setup: 'Area = ½∫ r² dθ; between two curves ½∫ (R² − r²) dθ, outer minus inner.',
    area: 'Expand the square, use a double-angle identity (or a calculator), keep the ½.', meet: 'Set the two r-values equal and solve for θ in radians.'
  };
  function onTry(fig, s, t, p){
    if(!fig) return false;
    var who = t.ok || t.shown ? 'right' : 'yours', k = s.key, val = who === 'right' && s.kind === 'num' ? s.cell.answer : t.value, mk = [], last = fig.last || (fig.last = {});
    if(k === 'x' && isFinite(val)) mk.push({ vline: val, who: who, label: (who === 'yours' ? 'yours: ' : '') + 'x = ' + T.numText(val) });
    if(k === 'dydx' && isFinite(val) && p.fig.mark){ var m = p.fig.mark, r = PL.fn(m.r)(m.th); mk.push({ tangent: [r * Math.cos(m.th), r * Math.sin(m.th)], slope: val, half: 1, who: who, label: (who === 'yours' ? 'yours: slope ' : 'slope ') + T.numText(val) }); }
    if(k === 'meet' && isFinite(val) && p.values.given.R){ var rv = PL.fn(p.values.given.r)(val); if(isFinite(rv)) mk.push({ point: [rv * Math.cos(val), rv * Math.sin(val)], who: who, label: (who === 'yours' ? 'yours: ' : '') + 'θ = ' + T.numText(val) }); }
    // the area problem's region is shaded once its limits are right
    if(k === 'lim' && who === 'right' && !fig.shade){ fig.shade = true; fig.redraw(); }
    if(k === 'setup' && who === 'right' && !fig.shade){ fig.shade = true; fig.redraw(); }
    if(!mk.length) return k === 'lim' || k === 'setup' ? who === 'right' : false;
    if(who === 'yours') last[k] = mk; else if(last[k]) mk = last[k].concat(mk);
    fig.marks.set(k, mk); fig.redraw();
    return true;
  }
  function quiz(host, data){
    var fig = null;
    T.drill(host, data, { slug: 'polar-lab', noun: 'drill',
      types: PL.KINDS.map(function(k){ return { value: k, label: PL.TITLE[k] }; }), typeLabel: 'Problem type',
      generate: PL.generate, title: function(p){ return p.title; },
      extra: function(el, p, api){
        var box = document.createElement('div'); box.className = 'pl-figbox'; el.appendChild(box);
        fig = polarFigure(box, p);
        var s = api.area && window.LevlStudio && window.LevlStudio.get && document.getElementById('app').getAttribute('data-studio') ? window.LevlStudio.get() : null;
        if(s) setTimeout(function(){ s.caption(String(p.text).replace(/<\/?p[^>]*>/g, ' ').trim(), 'quiz'); }, 0);
      },
      method: function(s){ return METHOD[s.key]; },
      onTry: function(s, t, api){ return onTry(fig, s, t, api.problem); } });
  }
})();
