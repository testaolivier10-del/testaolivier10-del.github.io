/* Lab design (the Experimental Design and Analysis trainer; docs/apphys-spec.md
   section 6). OWNED BY THIS TOOL ONLY. Job: plan a measurement, take noisy
   data, find the graph that makes a straight line, and read what its slope
   means.

   Explore: a lab bench drawn for each experiment (cart on a ramp with a
   motion detector, pendulum and stopwatch, spring with slotted masses, cart
   and hanging mass, falling mass unwinding a pulley, cylinder on a spring
   scale in a liquid). Take readings one at a time (each with its
   instrument's seeded scatter, ApPhysMath.labDesign.measure), see them in a
   table and on a graph, choose what to plot, get the least-squares line
   (slope and intercept) and what the slope means. For the pendulum, vary the
   bob's mass or the release angle instead and see what (does not) change.

   Test yourself: ApPhysTools.drill on ApPhysMath.labDesign.generate: the
   independent variable, the instruments, what to plot, the slope from the
   fit, the quantity from the slope, a source of error and its effect. */
(function(){
  'use strict';
  var T = window.ApPhysTools, M = window.ApPhysMath, S = window.ApPhysScene;
  if(!T || !M || !M.labDesign) return;
  var LD = M.labDesign, G = M.C.g, PI = Math.PI;
  var here = document.currentScript && document.currentScript.src;
  if(here && !document.querySelector('link[data-ld-css], link[href$="tools/lab-design.css"]')){
    var ln = document.createElement('link'); ln.rel = 'stylesheet'; ln.href = here.replace(/lab-design\.js(\?.*)?$/, 'lab-design.css'); ln.setAttribute('data-ld-css', '1');
    document.head.appendChild(ln);
  }
  var esc = T.esc, F = T.F, sym = LD.sym;
  function fm(x, n){ return M.fmt(x, n || 3); }
  function svgOut(w, h, label, inner, vb){ var s = S.svg(w, h, label, inner).replace('class="phys-scene"', 'class="phys-scene ld-svg"'); return vb ? s.replace('viewBox="0 0 ' + w + ' ' + h + '"', 'viewBox="' + vb + '"') : s; }

  /* ------------------------------------------------------- bench scenes
     bench(exp, P, x, o) -> SVG string. x is the current setting of the
     variable being changed (o.iv: 'mass' or 'angle' for the pendulum),
     o.t an animation phase (s), o.reading the last reading or null. */
  var gid = 0;
  function defs(p){
    return '<defs><linearGradient id="' + p + 'm" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#E9EDF0"/><stop offset=".5" stop-color="#A9B3BA"/><stop offset="1" stop-color="#7D878F"/></linearGradient>' +
      '<linearGradient id="' + p + 'w" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#D8B07A"/><stop offset="1" stop-color="#A9783F"/></linearGradient>' +
      '<radialGradient id="' + p + 'b" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#F3F5F6"/><stop offset=".55" stop-color="#9BA6AE"/><stop offset="1" stop-color="#5D676E"/></radialGradient>' +
      '<pattern id="' + p + 'h" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="7" class="ld-hatch"/></pattern></defs>';
  }
  function table(x, y, w){ return '<rect class="ld-bench" x="' + x + '" y="' + y + '" width="' + w + '" height="12" rx="3"/><rect class="ld-bench-e" x="' + x + '" y="' + (y + 12) + '" width="' + w + '" height="5"/>'; }
  function clamp(x){ return '<rect class="ld-steel" x="' + (x - 4) + '" y="18" width="8" height="300"/><rect class="ld-steel" x="' + (x - 28) + '" y="314" width="56" height="9" rx="3"/>'; }
  function massStack(cx, by, n, p){
    var out = '<rect class="ld-hook" x="' + (cx - 1.5) + '" y="' + (by - 12 - n * 9 - 10) + '" width="3" height="12"/>';
    for(var i = 0; i < n; i++) out += '<rect x="' + (cx - 16) + '" y="' + (by - (i + 1) * 9) + '" width="32" height="8" rx="2" fill="url(#' + p + 'm)" stroke="#59636B" stroke-width="1.2"/>';
    return out + '<rect class="ld-steel" x="' + (cx - 18) + '" y="' + (by - 2) + '" width="36" height="4" rx="1.5"/>';
  }
  function cart(x, y, ang, p, w){
    w = w || 64;
    return '<g transform="translate(' + x.toFixed(1) + ' ' + y.toFixed(1) + ') rotate(' + ang.toFixed(2) + ')">' +
      '<rect x="' + (-w / 2) + '" y="-24" width="' + w + '" height="16" rx="4" class="ld-cart"/><rect x="' + (-w / 2 + 4) + '" y="-22" width="' + (w - 8) + '" height="4" rx="2" class="ld-cart-hi"/>' +
      '<circle cx="' + (-w / 2 + 13) + '" cy="-6" r="6.5" class="ld-wheel"/><circle cx="' + (w / 2 - 13) + '" cy="-6" r="6.5" class="ld-wheel"/><circle cx="' + (-w / 2 + 13) + '" cy="-6" r="2" class="ld-hub"/><circle cx="' + (w / 2 - 13) + '" cy="-6" r="2" class="ld-hub"/></g>';
  }
  function detector(x, y, ang, beam){
    return '<g transform="translate(' + x + ' ' + y + ') rotate(' + ang + ')"><rect x="-14" y="-20" width="20" height="26" rx="4" class="ld-det"/><circle cx="6" cy="-7" r="7" class="ld-det-face"/>' +
      (beam ? '<path d="M14 -7 l' + beam + ' -14 v28 z" class="ld-beam"/>' : '') + '</g>';
  }
  function bench(exp, P, x, o){
    var p = 'ld' + (++gid), t = o.t || 0, inner = defs(p), lab = '';
    if(exp.id === 'ramp'){
      var th = 14, rad = th * PI / 180, x0 = 40, y0 = 90, len = 330, ex = x0 + len * Math.cos(rad), ey = y0 + len * Math.sin(rad);
      inner += table(10, ey + 4, 380) + '<path d="M' + x0 + ' ' + y0 + 'L' + ex.toFixed(1) + ' ' + ey.toFixed(1) + 'L' + x0 + ' ' + ey.toFixed(1) + 'Z" class="ld-ramp-fill"/><line x1="' + x0 + '" y1="' + y0 + '" x2="' + ex.toFixed(1) + '" y2="' + ey.toFixed(1) + '" class="ld-ramp"/>';
      // the cart's position along the ramp: x(t) in meters, 1 m = 220 px, from the detector
      var ts = o.run ? Math.min(x, t) : x, d = exp.truth(P, ts), along = 30 + (d - P.x0) * 220 + 34;
      along = Math.min(len - 36, along);
      var cxp = x0 + along * Math.cos(rad), cyp = y0 + along * Math.sin(rad);
      inner += detector(x0 + 4, y0 - 4, th, Math.max(10, along - 50)) + cart(cxp, cyp, th, p);
      inner += '<text x="' + (x0 + 6) + '" y="' + (y0 - 30) + '" class="ld-lab">motion detector</text>';
      inner += '<text x="250" y="60" class="ld-big">t = ' + F(ts, 2) + ' s</text><text x="250" y="80" class="ld-mut">x = ' + (o.reading != null ? F(o.reading, 3) + ' m' : '…') + '</text>';
      lab = 'A cart rolling down a ramp from rest with a motion detector at the top. At t = ' + F(ts, 2) + ' s.';
      return svgOut(400, 330, lab, inner, '0 36 400 250');
    }
    if(exp.id === 'pendulum'){
      var L = o.iv === 'mass' || o.iv === 'angle' ? P.Lfix : x, th0 = o.iv === 'angle' ? x : P.theta, m = o.iv === 'mass' ? x : 0.2, Tp = LD.pendT(L, th0);
      var ang = th0 * Math.cos(2 * PI * t / Tp) * (o.run ? 1 : 1), ppm = 200, px = 200, py = 34, br = 8 + 12 * Math.cbrt(m / 0.5);
      var bx = px + L * ppm * Math.sin(ang * PI / 180), by = py + L * ppm * Math.cos(ang * PI / 180);
      inner += clamp(330) + '<rect class="ld-steel" x="150" y="22" width="184" height="8" rx="3"/><rect class="ld-steel" x="190" y="26" width="20" height="12" rx="2"/>';
      inner += '<line x1="' + px + '" y1="' + py + '" x2="' + bx.toFixed(1) + '" y2="' + by.toFixed(1) + '" class="ld-string"/><circle cx="' + bx.toFixed(1) + '" cy="' + by.toFixed(1) + '" r="' + br.toFixed(1) + '" fill="url(#' + p + 'b)" stroke="#4A545B" stroke-width="1.5"/>';
      inner += '<line x1="' + px + '" y1="' + py + '" x2="' + px + '" y2="' + (py + L * ppm + 16) + '" class="ld-plumb"/>';
      // a protractor arc and the release angle
      var ra = th0 * PI / 180;
      inner += '<path d="M' + px + ' ' + (py + 46) + ' A46 46 0 0 1 ' + (px + 46 * Math.sin(ra)).toFixed(1) + ' ' + (py + 46 * Math.cos(ra)).toFixed(1) + '" class="ld-arc"/><text x="' + (px + 50 * Math.sin(ra / 2) + 4).toFixed(1) + '" y="' + (py + 60) + '" class="ld-mut">' + F(th0, 0) + '°</text>';
      // the meterstick (L) and a stopwatch
      inner += '<rect x="58" y="' + py + '" width="16" height="' + (1.25 * ppm) + '" class="ld-stick"/>';
      for(var k = 0; k <= 12; k++) inner += '<line x1="58" x2="' + (k % 5 === 0 ? 70 : 64) + '" y1="' + (py + k * 0.1 * ppm) + '" y2="' + (py + k * 0.1 * ppm) + '" class="ld-tick"/>';
      inner += '<path d="M78 ' + py + 'h8M78 ' + (py + L * ppm).toFixed(1) + 'h8M82 ' + py + 'V' + (py + L * ppm).toFixed(1) + '" class="ld-dim"/><text x="90" y="' + (py + L * ppm / 2 + 5).toFixed(1) + '" class="ld-lab">L = ' + F(L, 2) + ' m</text>';
      var sw = o.run ? (t % 100) : 0;
      inner += '<g transform="translate(282 262)"><circle r="28" class="ld-watch"/><rect x="-6" y="-40" width="12" height="9" rx="2" class="ld-steel"/><line x1="0" y1="0" x2="' + (22 * Math.sin(sw / 60 * 2 * PI)).toFixed(1) + '" y2="' + (-22 * Math.cos(sw / 60 * 2 * PI)).toFixed(1) + '" class="ld-needle"/><text y="46" text-anchor="middle" class="ld-mut">' + (o.reading != null ? '10T = ' + F(o.reading * 10, 2) + ' s' : 'stopwatch') + '</text></g>';
      if(o.iv === 'mass') inner += '<text x="' + (bx + br + 6).toFixed(1) + '" y="' + (by + 5).toFixed(1) + '" class="ld-lab">' + F(m * 1000, 0) + ' g</text>';
      lab = 'A pendulum: a bob on a string ' + F(L, 2) + ' m long, released from ' + F(th0, 0) + '°, with a meterstick and a stopwatch.';
      return svgOut(400, 330, lab, inner);
    }
    if(exp.id === 'spring'){
      var stretch = exp.truth(P, x) + (o.run ? 0.004 * Math.exp(-t * 3) * Math.cos(t * Math.sqrt(P.k / Math.max(0.05, x)) ) : 0), ppm2 = 900, top = 40, L0 = 90, n = Math.round(x / 0.025);
      inner += clamp(300) + '<rect class="ld-steel" x="150" y="28" width="154" height="8" rx="3"/>';
      var yEnd = top + L0 + stretch * ppm2, coils = '', N = 14, xc = 190;
      coils = 'M' + xc + ' ' + top + 'v8';
      for(var i = 0; i < N; i++){ var yy = top + 8 + (yEnd - top - 16) * (i + 0.5) / N; coils += 'L' + (xc + (i % 2 ? -11 : 11)) + ' ' + yy.toFixed(1); }
      coils += 'L' + xc + ' ' + (yEnd - 8).toFixed(1) + 'V' + yEnd.toFixed(1);
      inner += '<path d="' + coils + '" class="ld-spring"/>' + massStack(xc, yEnd + 22 + n * 9, n, p);
      // meterstick with the zero at the unstretched end
      inner += '<rect x="230" y="' + (top + L0 - 10) + '" width="16" height="140" class="ld-stick"/>';
      for(var kk = 0; kk <= 13; kk++) inner += '<line x1="230" x2="' + (kk % 5 === 0 ? 242 : 236) + '" y1="' + (top + L0 + kk * 0.01 * ppm2) + '" y2="' + (top + L0 + kk * 0.01 * ppm2) + '" class="ld-tick"/>';
      inner += '<line x1="' + (xc + 14) + '" x2="226" y1="' + (top + L0) + '" y2="' + (top + L0) + '" class="ld-plumb"/><line x1="' + (xc + 14) + '" x2="226" y1="' + yEnd.toFixed(1) + '" y2="' + yEnd.toFixed(1) + '" class="ld-plumb"/>';
      inner += '<text x="252" y="' + (top + L0 - 8) + '" class="ld-mut">0: no load</text><text x="252" y="' + (yEnd + 5).toFixed(1) + '" class="ld-lab">x = ' + (o.reading != null ? F(o.reading * 100, 1) + ' cm' : '…') + '</text>';
      inner += '<text x="60" y="' + (yEnd + 22 + n * 9 - 10).toFixed(1) + '" class="ld-lab">m = ' + F(x * 1000, 0) + ' g</text>';
      lab = 'A spring hanging from a clamp with ' + F(x * 1000, 0) + ' g of slotted masses, stretched ' + F(exp.truth(P, x) * 100, 1) + ' cm, with a meterstick beside it.';
      return svgOut(400, 330, lab, inner);
    }
    if(exp.id === 'atwood'){
      var a = exp.truth(P, x), tt = o.run ? Math.min(t, 0.9) : 0, s = 0.5 * a * tt * tt * 240, nh = Math.round(x / 0.01);
      inner += table(10, 150, 330) + '<rect class="ld-track" x="30" y="140" width="290" height="10" rx="3"/>';
      var cxp2 = 90 + s, pulleyX = 338, pulleyY = 142;
      inner += detector(22, 120, 0, Math.max(10, cxp2 - 70)) + cart(cxp2, 140, 0, p, 70);
      // slotted masses on the cart: what was moved to the hanger is gone from the cart
      for(var j = 0; j < 8 - nh; j++) inner += '<rect x="' + (cxp2 - 24 + j * 6) + '" y="' + (140 - 31) + '" width="5" height="8" rx="1" fill="url(#' + p + 'm)" stroke="#59636B" stroke-width=".8"/>';
      inner += '<line x1="' + (cxp2 + 35) + '" y1="124" x2="' + pulleyX + '" y2="' + (pulleyY - 14) + '" class="ld-string"/><rect class="ld-steel" x="' + (pulleyX - 3) + '" y="' + pulleyY + '" width="6" height="18"/><circle cx="' + pulleyX + '" cy="' + pulleyY + '" r="14" class="ld-pulley"/><circle cx="' + pulleyX + '" cy="' + pulleyY + '" r="3" class="ld-hub"/>';
      var hy = 200 + s;
      inner += '<line x1="' + (pulleyX + 14) + '" y1="' + pulleyY + '" x2="' + (pulleyX + 14) + '" y2="' + (hy - 6 - nh * 9 - 10).toFixed(1) + '" class="ld-string"/>' + massStack(pulleyX + 14, hy, nh, p);
      inner += '<text x="270" y="' + (hy - nh * 4 + 30).toFixed(1) + '" text-anchor="end" class="ld-lab">m = ' + F(x * 1000, 0) + ' g</text>';
      inner += '<text x="30" y="60" class="ld-big">a = ' + (o.reading != null ? F(o.reading, 3) + ' m/s²' : '…') + '</text><text x="30" y="82" class="ld-mut">M<tspan dy="4" font-size=".75em">total</tspan><tspan dy="-4"> = cart + every slotted mass + hanger</tspan></text>';
      lab = 'A cart on a level track pulled by a string over a pulley to a ' + F(x * 1000, 0) + ' g hanging mass, with a motion detector behind the cart.';
      return svgOut(400, 330, lab, inner, '0 30 400 270');
    }
    if(exp.id === 'pulley'){
      var a2 = exp.truth(P, x), tt2 = o.run ? Math.min(t, 1.2) : 0, s2 = Math.min(30, 0.5 * a2 * tt2 * tt2 * 40), nm = Math.max(1, Math.round(x / 0.05)), R = 52, r = 52 * P.r / 0.05;
      var cx3 = 180, cy3 = 78, rot = (s2 / Math.max(6, r)) * 180 / PI;
      inner += clamp(320) + '<rect class="ld-steel" x="' + cx3 + '" y="74" width="144" height="8" rx="3"/>';
      inner += '<g transform="rotate(' + rot.toFixed(1) + ' ' + cx3 + ' ' + cy3 + ')"><circle cx="' + cx3 + '" cy="' + cy3 + '" r="' + R + '" class="ld-wheel2"/>';
      for(var sp = 0; sp < 6; sp++){ var aa = sp * PI / 3; inner += '<line x1="' + cx3 + '" y1="' + cy3 + '" x2="' + (cx3 + (R - 6) * Math.cos(aa)).toFixed(1) + '" y2="' + (cy3 + (R - 6) * Math.sin(aa)).toFixed(1) + '" class="ld-spoke"/>'; }
      inner += '<circle cx="' + cx3 + '" cy="' + cy3 + '" r="' + r.toFixed(1) + '" class="ld-spool"/></g><circle cx="' + cx3 + '" cy="' + cy3 + '" r="4" class="ld-hub"/>';
      var hy2 = 262 + s2;
      inner += '<line x1="' + (cx3 + r).toFixed(1) + '" y1="' + cy3 + '" x2="' + (cx3 + r).toFixed(1) + '" y2="' + (hy2 - nm * 9 - 16).toFixed(1) + '" class="ld-string"/>' + massStack(cx3 + r, hy2, nm, p);
      inner += detector(cx3 + r - 20, 318, -90, 0) + '<text x="' + (cx3 + r + 26).toFixed(1) + '" y="' + (hy2 - 10).toFixed(1) + '" class="ld-lab">m = ' + F(x * 1000, 0) + ' g</text>';
      inner += '<path d="M' + cx3 + ' ' + cy3 + 'L' + (cx3 - r * 0.7).toFixed(1) + ' ' + (cy3 + r * 0.7).toFixed(1) + 'L' + (cx3 - R - 8) + ' ' + (cy3 + R + 14) + '" class="ld-dim"/><text x="' + (cx3 - R - 12) + '" y="' + (cy3 + R + 30) + '" text-anchor="middle" class="ld-mut">spool r = ' + F(P.r * 100, 1) + ' cm</text>';
      inner += '<text x="20" y="230" class="ld-big">a = ' + (o.reading != null ? F(o.reading, 3) : '…') + '</text><text x="20" y="250" class="ld-mut">m/s²</text>';
      lab = 'A pulley wheel with a spool of radius ' + F(P.r * 100, 1) + ' cm; a string wound on the spool holds a ' + F(x * 1000, 0) + ' g mass above a motion detector.';
      return svgOut(400, 330, lab, inner);
    }
    // buoyancy
    var A = PI * Math.pow(P.D / 200, 2), ppm3 = 1500, surf = 190, dd = x, cylH = 0.10 * ppm3, cylW = P.D / 100 * ppm3, Fr = exp.truth(P, x);
    inner += clamp(330) + '<rect class="ld-steel" x="186" y="14" width="148" height="8" rx="3"/>';
    var bot = surf + dd * ppm3, topc = bot - cylH;
    inner += '<rect x="180" y="20" width="22" height="70" rx="6" class="ld-scale"/><line x1="191" x2="191" y1="90" y2="' + topc.toFixed(1) + '" class="ld-string"/>';
    var fr = Math.min(1, Fr / 10);
    inner += '<path d="M185 ' + (30 + fr * 50).toFixed(1) + 'h12" class="ld-ptr"/><text x="174" y="' + (34 + fr * 50).toFixed(1) + '" text-anchor="end" class="ld-lab">' + (o.reading != null ? F(o.reading, 2) + ' N' : '') + '</text>';
    inner += '<rect x="110" y="150" width="170" height="160" class="ld-liquid"/><path d="M106 140V312H284V140" class="ld-glass"/>';
    inner += '<rect x="' + (191 - cylW / 2).toFixed(1) + '" y="' + topc.toFixed(1) + '" width="' + cylW.toFixed(1) + '" height="' + cylH.toFixed(1) + '" rx="3" fill="url(#' + p + 'm)" stroke="#59636B" stroke-width="1.5"/>';
    inner += '<rect x="110" y="' + surf + '" width="170" height="' + (310 - surf) + '" class="ld-liquid2"/><line x1="110" x2="280" y1="' + surf + '" y2="' + surf + '" class="ld-surf"/>';
    inner += '<path d="M' + (191 + cylW / 2 + 8).toFixed(1) + ' ' + surf + 'V' + bot.toFixed(1) + '" class="ld-dim"/><text x="' + (191 + cylW / 2 + 14).toFixed(1) + '" y="' + ((surf + bot) / 2 + 5).toFixed(1) + '" class="ld-lab">d = ' + F(dd * 100, 1) + ' cm</text>';
    lab = 'A metal cylinder on a spring scale, lowered ' + F(dd * 100, 1) + ' cm into a container of liquid.';
    return svgOut(400, 330, lab, inner);
  }

  /* -------------------------------------------------------------- mount */
  T.mount('lab-design', function(app, data){
    var ex = null;
    T.modes(app, { slug: 'lab-design', labels: ['Explore', 'Test yourself'],
      explore: function(host){ ex = explore(host, data); },
      quiz: function(host){ quiz(host, data); },
      onShow: function(m){ if(ex && m !== 'explore') ex.stop(); },
      studio: { explore: function(pane, s){ ex.studio(pane, s); } } });
  });

  /* ------------------------------------------------------------ explore */
  function explore(host, data){
    var exps = (data.contexts || []).map(function(c){ return LD.EXPS[c.exp]; }).filter(Boolean);
    var st = { exp: exps[0].id, seed: 1 + Math.floor(Math.random() * 9999), iv: '', x: null, rows: [], plot: null, fitOn: false };
    var exp, P, r, LS = null, LSP = null, loop = null, animT = 0, running = false, lastReading = null;
    host.innerHTML = '<section class="bt-problem ld-card">' +
      '<div class="ld-dock"><div class="ld-set"></div>' +
      '<div class="bt-buttons ld-acts"><button type="button" class="btn-press sm ld-take">Take a reading</button><button type="button" class="bt-btn ld-auto">Take 6</button></div>' +
      '<div class="ld-plotrow"><div class="ld-plotsel"></div><button type="button" class="bt-btn ld-fit" aria-pressed="false">Best-fit line</button></div></div>' +
      '<div class="ld-view"><div class="ld-vtoggle tseg" role="group" aria-label="Show"><button type="button" data-v="bench" aria-pressed="true" class="on">Bench</button><button type="button" data-v="graph" aria-pressed="false">Graph</button></div><div class="ld-bench-v"></div><div class="ld-graph-v"><div class="ld-graph"></div><div class="ld-fitbox"></div></div></div>' +
      '<div class="ld-say"></div><p class="sr-only ld-live"></p>' +
      T.moreHtml('<div class="ld-pair"><div class="ld-expsel"></div><div class="ld-ivsel"></div></div><div class="bt-buttons"><button type="button" class="bt-btn ld-clear">Clear data</button><button type="button" class="bt-btn ld-new">New apparatus</button></div><div class="ld-data"></div><p class="bt-small">Every reading has the scatter of its instrument: a meterstick ±2 mm, ten swings on a stopwatch ±0.14 s, a motion detector ±2 mm and about 1.5% on an acceleration, a spring scale ±0.02 N. g = 9.8 m/s².</p>', 'experiment, data table, new apparatus') + '</section>';
    var $ = function(sel){ return host.querySelector(sel) || (LS ? LS.root.querySelector(sel) : null); };
    var dock = host.querySelector('.ld-dock'), view = host.querySelector('.ld-view'), say = T.announcer(host.querySelector('.ld-live'));
    var cue = T.cue('Set the ' + 'value, then press <b>Take a reading</b>.');
    dock.insertBefore(cue.el, dock.firstChild);
    var expSel = T.choiceSelect({ label: 'Experiment', options: exps.map(function(e){ return { value: e.id, label: e.name }; }), value: st.exp, onChange: function(v){ setExp(v); } });
    host.querySelector('.ld-expsel').appendChild(expSel.el);
    var ivHost = host.querySelector('.ld-ivsel'), ivSel = null, setSl = null, plotSel = null;
    view.querySelectorAll('.ld-vtoggle button').forEach(function(b){ b.addEventListener('click', function(){ showV(b.getAttribute('data-v')); }); });
    function showV(v){ view.classList.toggle('show-graph', v === 'graph'); view.querySelectorAll('.ld-vtoggle button').forEach(function(x){ var on = x.getAttribute('data-v') === v; x.setAttribute('aria-pressed', String(on)); x.classList.toggle('on', on); }); }

    function ivDef(){ return st.iv ? exp.alt.filter(function(a){ return a.id === st.iv; })[0] : exp.iv; }
    function setExp(id){
      stop(); st.exp = id; exp = LD.EXPS[id]; st.iv = ''; st.rows = []; st.fitOn = false; lastReading = null;
      r = M.rng(st.seed); P = exp.params(r);
      ivHost.innerHTML = '';
      ivSel = null;
      if(exp.alt){
        ivSel = T.choiceSelect({ label: 'Change', options: [{ value: '', label: 'Length L' }].concat(exp.alt.map(function(a){ return { value: a.id, label: a.id === 'mass' ? 'Bob mass m' : 'Release angle θ₀' }; })), value: '', onChange: function(v){ stop(); st.iv = v; st.rows = []; st.fitOn = false; lastReading = null; buildSet(); buildPlots(); draw(); } });
        ivHost.appendChild(ivSel.el);
      }
      $('.ld-pair').classList.toggle('one', !exp.alt);
      buildSet(); buildPlots(); draw();
    }
    function buildSet(){
      var v = ivDef(), h = $('.ld-set');
      h.innerHTML = '';
      st.x = M.round((v.min + v.max) / 2 / v.step, 0) * v.step;
      setSl = T.slider({ label: cap(v.name) + ', ' + sym(v.sym) .replace(/<[^>]+>/g, ''), min: v.min, max: v.max, step: v.step, value: st.x, unit: v.unit, decimals: v.d, onInput: function(x){ stop(); st.x = x; lastReading = null; draw(); } });
      h.appendChild(setSl.el);
      cue.el.querySelector('.bt-cue-t').innerHTML = 'Set the ' + esc(v.name) + ', then press <b>Take a reading</b>.';
    }
    function cap(s){ return s.charAt(0).toUpperCase() + s.slice(1); }
    function plotsNow(){
      if(!st.iv) return exp.plots;
      var v = ivDef(), d = exp.dv;
      return [{ id: 'alt', y: d.sym, x: v.sym, X: function(x){ return x; }, Y: function(y){ return y; }, xl: v.sym, xu: v.unit, yl: d.sym, yu: d.unit, linear: true }];
    }
    function buildPlots(){
      var h = $('.ld-plotsel'); h.innerHTML = '';
      var ps = plotsNow();
      st.plot = ps[0].id;
      plotSel = T.choiceSelect({ label: 'Graph', options: ps.map(function(p){ return { value: p.id, label: LD.plotLabel(p).replace(/<[^>]+>/g, '') }; }), value: st.plot, onChange: function(v){ st.plot = v; draw(); } });
      plotSel.el.classList.add('bt-inline');
      h.appendChild(plotSel.el);
    }
    function plotOf(){ return plotsNow().filter(function(p){ return p.id === st.plot; })[0]; }

    function take(){
      cue.done();
      var reading = LD.measure(exp, P, st.x, r, st.iv || undefined);
      lastReading = reading;
      st.rows.push([st.x, reading]);
      // animate the bench (a short run of the motion) unless motion is off
      run();
      draw();
      say('Reading ' + st.rows.length + ': ' + sym(ivDef().sym).replace(/<[^>]+>/g, '') + ' = ' + F(st.x, ivDef().d) + ' ' + ivDef().unit + ', ' + exp.dv.sym + ' = ' + F(reading, exp.dv.d) + ' ' + exp.dv.unit + '.');
    }
    function run(){
      stop(); animT = 0; running = true;
      if(exp.id === 'buoyancy' || exp.id === 'spring' && S.reduced()){ running = false; return; }
      loop = S.loop(function(dt){ animT += dt; drawBench(); }, { duration: exp.id === 'pendulum' ? 3 : exp.id === 'spring' ? 1.5 : exp.id === 'ramp' ? st.x + 0.3 : 1.3, still: function(){ animT = exp.id === 'ramp' ? st.x : 0; drawBench(); }, onEnd: function(){ running = false; drawBench(); } });
      loop.start();
    }
    function stop(){ if(loop){ loop.stop(); loop = null; } running = false; }
    host.querySelector('.ld-take').addEventListener('click', take);
    host.querySelector('.ld-auto').addEventListener('click', function(){
      cue.done(); stop();
      var v = ivDef(), xs = [], n = 6;
      for(var i = 0; i < n; i++) xs.push(M.round(Math.round((v.min + (v.max - v.min) * i / (n - 1)) / v.step) * v.step, 6));
      xs.forEach(function(x){ st.rows.push([x, LD.measure(exp, P, x, r, st.iv || undefined)]); });
      st.x = xs[xs.length - 1]; setSl.set(st.x); lastReading = st.rows[st.rows.length - 1][1];
      draw(); say(n + ' readings taken across the range.');
    });
    host.querySelector('.ld-fit').addEventListener('click', function(){ st.fitOn = !st.fitOn; this.setAttribute('aria-pressed', String(st.fitOn)); draw(); });
    host.querySelector('.ld-clear').addEventListener('click', function(){ stop(); st.rows = []; lastReading = null; st.fitOn = false; draw(); });
    host.querySelector('.ld-new').addEventListener('click', function(){ st.seed++; setExp(st.exp); });

    function drawBench(){
      var o = { t: animT, run: running || exp.id === 'ramp', reading: lastReading, iv: st.iv };
      if(exp.id === 'ramp' && !running) o.t = st.x;
      $('.ld-bench-v').innerHTML = bench(exp, P, st.x, o);
    }
    function fitNow(){
      var p = plotOf(); if(!p || st.rows.length < 2) return null;
      var pts = st.rows.map(function(rw){ return [p.X(rw[0]), p.Y(rw[1])]; }), f = LD.fit(pts);
      return isFinite(f.m) ? { p: p, pts: pts, f: f } : null;
    }
    function drawGraph(){
      var p = plotOf(), pts = st.rows.map(function(rw){ return [p.X(rw[0]), p.Y(rw[1])]; }), v = ivDef();
      var xs = pts.map(function(q){ return q[0]; }), ys = pts.map(function(q){ return q[1]; });
      // axes from the whole settings range, so the graph does not jump as points arrive
      var lo = p.X(v.min), hi = p.X(v.max), xmin = Math.min(0, lo, hi), xmax = Math.max(lo, hi);
      var ymax = ys.length ? Math.max.apply(null, ys) : 1, ymin = ys.length ? Math.min.apply(null, ys) : 0;
      if(exp.id === 'buoyancy' && !st.iv){ ymin = Math.min(ymin, ymax - 2); }
      var y0 = ymin >= 0 ? 0 : ymin, ytop = T.niceMax(ymax * 1.12 || 1), ystep = T.niceStep(ytop - y0, 5);
      if(exp.id === 'buoyancy' && ys.length){ y0 = Math.floor(ymin / ystep - 1) * ystep; ytop = Math.ceil(ymax / ystep + 1) * ystep; ystep = T.niceStep(ytop - y0, 5); }
      var xtop = T.niceMax(xmax * 1.05), xstep = T.niceStep(xtop - xmin, 5);
      var fit = st.fitOn ? fitNow() : null, curves = [];
      if(fit){ var a = xmin, b = xtop; curves.push({ cls: 's2', points: [[a, fit.f.m * a + fit.f.b], [b, fit.f.m * b + fit.f.b]] }); }
      var title = 'Graph of ' + LD.plotLabel(p).replace(/<[^>]+>/g, '') + ' with ' + pts.length + ' data points' + (fit ? '; best-fit line slope ' + fm(fit.f.m) + ', intercept ' + fm(fit.f.b) : '') + '.';
      var unit = function(u){ return u.replace('s^½', 's½'); };
      $('.ld-graph').innerHTML = T.plot({ w: 400, h: 320, title: title, x: { label: p.xl.replace(/_/g, ''), unit: unit(p.xu), min: xmin, max: xtop, step: xstep }, y: { label: p.yl.replace(/_/g, ''), unit: p.yu, min: y0, max: ytop, step: ystep },
        curves: curves, points: pts.map(function(q, i){ return { x: q[0], y: q[1], cls: i === pts.length - 1 ? 's2' : 's1' }; }) });
      var box = $('.ld-fitbox');
      if(!pts.length) box.innerHTML = '<p class="ld-empty">No data yet. Take a reading.</p>';
      else if(!fit) box.innerHTML = '<p class="ld-empty">' + (pts.length < 2 ? 'Take at least two readings for a line.' : 'Press <b>Best-fit line</b> for the least-squares line.') + '</p>';
      else box.innerHTML = '<p class="ld-fitline">slope = <b>' + fm(fit.f.m) + '</b> ' + slopeUnit(p) + ' &nbsp; intercept = <b>' + fm(fit.f.b) + '</b> ' + p.yu + ' &nbsp; r² = ' + F(fit.f.r2, 4) + '</p>';
    }
    function slopeUnit(p){ return st.iv ? p.yu + '/' + p.xu : p.id === exp.best ? exp.slopeUnit : '(' + p.yu + ')/(' + p.xu + ')'; }
    function meaning(){
      var p = plotOf(), fit = fitNow(), n = st.rows.length, v = ivDef();
      if(st.iv){
        var spread = n ? Math.max.apply(null, st.rows.map(function(q){ return q[1]; })) - Math.min.apply(null, st.rows.map(function(q){ return q[1]; })) : 0;
        if(st.iv === 'mass') return { head: n < 2 ? 'Does the bob\'s mass change the period? Take readings at different masses.' : 'The period stays about ' + F(st.rows[0][1], 2) + ' s whatever the mass.', body: '<p>T = 2π√(L/g) has no mass in it: a heavier bob needs more force to accelerate, and gravity supplies proportionally more. The scatter you see (' + F(spread, 3) + ' s) is the stopwatch\'s, not a trend. A flat line (slope near 0) is the evidence. Here L = ' + F(P.Lfix, 2) + ' m.</p>' };
        return { head: n < 2 ? 'Does the release angle change the period? Try small and large angles.' : 'Small angles: nearly the same period. Large angles: a little longer.', body: '<p>T = 2π√(L/g) is the small-angle result. Up to about 15° it is within 0.5%, smaller than the stopwatch scatter; at 60° the true period is about 7% longer. That is why the procedure says to release from a small angle.</p>' };
      }
      var good = p.id === exp.best;
      if(n < 2) return { head: 'Change the ' + v.name + ' and take readings across the whole range.', body: '<p>' + exp.setup + '</p><p>Model: ' + sym(exp.law) + '.</p><p>Spread the settings over the range and take at least 5 or 6 readings; repeating a setting and averaging shrinks the scatter.</p>' };
      if(!good) return { head: 'Graphing ' + LD.plotLabel(p) + ' does not give a straight line.', body: '<p>The model is ' + sym(exp.law) + '. Rewrite it as y = (slope)·x + intercept: the quantity that goes on each axis is the one that makes it a line. Look at the shape of the points: a curve means the slope changes along the graph and stands for no single quantity.</p>' + (fit ? '<p>A straight line forced through these points has r² = ' + F(fit.f.r2, 4) + ', but the points curve around it.</p>' : '') };
      if(!fit || !st.fitOn) return { head: LD.plotLabel(p) + ' is a straight line. Press Best-fit line.', body: '<p>' + sym(exp.law) + '. ' + sym(exp.slopeMeans) + '</p>' };
      var val = LD.derive(exp, P, fit.f.m, fit.f.b), tr = exp.target.true(P), err = Math.abs(val - tr) / tr * 100;
      return { head: sym(exp.target.sym) + ' = ' + fm(val) + ' ' + exp.target.unit + ' from the slope.', body: '<p>' + sym(exp.slopeMeans) + '</p><p>' + sym(exp.target.how) + ' = ' + fm(val) + ' ' + exp.target.unit + '. The hidden true value is ' + fm(tr) + ' ' + exp.target.unit + ' (' + F(err, 1) + '% away), the difference coming from the scatter of ' + n + ' readings. More readings, or repeated trials averaged, bring it closer.</p><p>The intercept, ' + fm(fit.f.b) + ' ' + p.yu + ', ' + interceptMeans() + '</p>' };
    }
    function interceptMeans(){
      return { ramp: 'is the starting distance x₀ from the detector.', pendulum: 'should be near 0: a pendulum of zero length has zero period.', spring: 'should be near 0: no mass, no stretch.', atwood: 'should be near 0 without friction (a negative intercept is a sign of friction).', pulley: 'is 1/g, the limit for a very heavy hanging mass.', buoyancy: 'is the reading before the cylinder touches the liquid: its weight.' }[exp.id];
    }
    function drawData(){
      var v = ivDef(), rows = st.rows.map(function(rw, i){ return ['' + (i + 1), F(rw[0], v.d), F(rw[1], exp.dv.d)]; });
      var ff = st.fitOn ? fitNow() : null;
      $('.ld-data').innerHTML = (ff ? '<p class="ld-fitline">Best-fit line of ' + LD.plotLabel(ff.p) + ': slope ' + fm(ff.f.m) + ' ' + slopeUnit(ff.p) + ', intercept ' + fm(ff.f.b) + ' ' + ff.p.yu + ', r² = ' + F(ff.f.r2, 4) + '.</p>' : '') + (rows.length ? T.dataTable(['Trial', sym(v.sym) + ' (' + v.unit + ')', sym(exp.dv.sym) + ' (' + exp.dv.unit + ')'], rows, 'Your readings') : '<p class="bt-small">No readings yet.</p>');
    }
    var lastHead = '';
    function draw(){
      drawBench(); drawGraph(); drawData();
      var m = meaning();
      T.explain(host.querySelector('.ld-say') || $('.ld-say'), m.head, m.body);
      var fit = st.fitOn ? fitNow() : null;
      var fb = $('.ld-fit'); if(fb) fb.setAttribute('aria-pressed', String(st.fitOn));
      if(LS){
        var pills = [];
        if(lastReading == null) pills.push({ k: 'Readings', html: String(st.rows.length), tone: 'readout' });
        if(lastReading != null) pills.push({ k: exp.dv.sym, html: F(lastReading, exp.dv.d) + ' ' + exp.dv.unit, tone: 'readout' });
        if(fit && !st.iv) pills.push({ k: 'slope', html: fm(fit.f.m), tone: plotOf().id === exp.best ? 'good' : 'warn' });
        LS.pills(pills, 'left', 'explore');
        LS.caption(m.head, 'explore');
        if(LSP) LSP.setup(exp.name + (st.iv ? ' (' + (st.iv === 'mass' ? 'bob mass' : 'release angle') + ')' : ''));
      }
      if(m.head !== lastHead){ lastHead = m.head; say(m.head.replace(/<[^>]+>/g, '')); }
    }
    function studio(pane, s){
      LS = s;
      LSP = T.studioPane(pane, s, { stage: [view], dock: [dock], why: [host.querySelector('.ld-say')], details: [], setup: 'Experiment', moreLabel: 'Experiment, data and apparatus' });
      s.detailsTitle('Data & settings');
      draw();
      if(s.mode() === 'explore') s.hint({ target: s.root.querySelector('.ld-take'), text: 'Take a reading, then change the setting' });
    }
    setExp(st.exp);
    return { studio: studio, stop: stop };
  }

  /* --------------------------------------------------------------- quiz */
  function quiz(host, data){
    var fig = null, cur = null;
    T.drill(host, data, {
      slug: 'lab-design', noun: 'experiment', studioAsk: true,
      generate: function(r, ctx){ return LD.generate(r, ctx); },
      types: (data.contexts || []).map(function(c){ return { value: c.exp, label: LD.EXPS[c.exp].name }; }),
      typeLabel: 'Experiment',
      title: function(p){ return LD.EXPS[p.exp].name; },
      newLabel: 'New experiment',
      extra: function(el, p){
        cur = p; fig = el;
        var exp = LD.EXPS[p.exp], v = p.values, x = exp.iv.min + (exp.iv.max - exp.iv.min) * 0.6;
        var rows = v.rows.map(function(rw, i){ return ['' + (i + 1), F(rw[0], exp.iv.d), F(rw[1], exp.dv.d)]; });
        el.innerHTML = '<div class="ld-qfig"><div class="ld-qbench">' + bench(exp, v.P, x, { t: 0, run: false, reading: null }) + '</div><div class="ld-qdata">' + T.dataTable(['Trial', sym(exp.iv.sym) + ' (' + exp.iv.unit + ')', sym(exp.dv.sym) + ' (' + exp.dv.unit + ')'], rows, 'The data') + '<div class="ld-qplot"></div></div></div>';
      },
      onStep: function(s, right, api){
        // Once the plot is chosen, the linearized data and its best-fit line appear.
        if(s.key === 'plot' && fig){
          var exp = LD.EXPS[cur.exp], p = LD.plotOf(exp, exp.best), pts = cur.values.lin, f = cur.values.fit;
          var xs = pts.map(function(q){ return q[0]; }), ys = pts.map(function(q){ return q[1]; });
          var xmax = T.niceMax(Math.max.apply(null, xs) * 1.05), ymin = Math.min(0, Math.min.apply(null, ys)), ymax = Math.max.apply(null, ys);
          var y0 = exp.id === 'buoyancy' ? Math.floor(Math.min.apply(null, ys) - 0.3) : ymin, ytop = exp.id === 'buoyancy' ? Math.ceil(ymax + 0.3) : T.niceMax(ymax * 1.1);
          fig.querySelector('.ld-qplot').innerHTML = T.plot({ w: 400, h: 300, title: 'Graph of ' + LD.plotLabel(p).replace(/<[^>]+>/g, '') + ' with the best-fit line.', x: { label: p.xl, unit: p.xu, min: 0, max: xmax, step: T.niceStep(xmax, 5) }, y: { label: p.yl, unit: p.yu, min: y0, max: ytop, step: T.niceStep(ytop - y0, 5) },
            curves: [{ cls: 's2', points: [[0, f.b], [xmax, f.m * xmax + f.b]] }], points: pts.map(function(q){ return { x: q[0], y: q[1], cls: 's1' }; }) });
        }
      }
    });
  }
})();
