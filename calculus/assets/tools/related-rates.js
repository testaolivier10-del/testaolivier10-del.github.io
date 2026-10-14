/* Related rates (Unit 4, Premium; docs/apcalc-spec.md section 6). Job: watch
   rates change together in a real scene, then write the chain of equations
   that links them. OWNED BY THIS TOOL ONLY. Model: ApCalcMath.relatedRates
   (calculus/assets/tools/math/related-rates.js); frame: ApCalcTools.modes and
   drill on the Tool Studio; small graph: ApCalcPlot.

   Explore: five illustrated scenes (sliding ladder, filling cone, shadow
   under a streetlight, spreading ripple, rising balloon). One quantity is
   driven at a rate the student sets with the slider; drag the moving part
   (or use the arrow keys on it) to choose the moment, or press Play to let
   time run. Every quantity and its rate is read live beside the scene, the
   scene carries arrows for the given rate (blue) and the rate it causes
   (crimson), and "Why?" holds the chain of equations with this moment's
   numbers. Details: the watched rate against the driver (a graph), and every
   number.

   Test yourself: seeded problems from the model (relation, d/dt, the
   moment's values, the rate with its sign, its meaning), each with the
   scene drawn from the problem's own numbers. */
(function(){
  'use strict';
  var T = window.ApCalcTools, M = window.ApCalcMath, P = window.ApCalcPlot, X = window.ApCalcTex;
  (function(){
    var app = document.getElementById('app');
    if(app && !app.getAttribute('data-details-title')) app.setAttribute('data-details-title', 'Graph & numbers');
  })();
  if(!T || !M || !M.relatedRates || !P) return;
  var RR = M.relatedRates, F = T.F, esc = T.esc;
  var NS = 'http://www.w3.org/2000/svg';
  function tex(s){ return X ? X.render(s) : esc(s); }
  function html(s){ return X ? X.html(s) : s; }
  function clamp(x, a, b){ return Math.max(a, Math.min(b, x)); }
  function r1(v){ return Math.round(v * 10) / 10; }
  function fv(x, d){ return F(x, d == null ? 2 : d); }
  function sig(x){ return M.minus(M.fmt(x, 3)); }
  /* A rate's name in plain text: dx/dt, dθ/dt, d(x + s)/dt. */
  function rsym(k){ return 'd' + (k === 't' ? 'θ' : k === 'z' ? '(x+s)' : k) + '/dt'; }

  /* ============================================================ drawing */
  /* Small SVG helpers; every coordinate in the scene's own viewBox units. */
  function arrow(x1, y1, x2, y2, cls, w){
    var dx = x2 - x1, dy = y2 - y1, L = Math.sqrt(dx * dx + dy * dy);
    if(L < 4) return '';
    var ux = dx / L, uy = dy / L, hw = w || 6, hl = 10;
    var bx = x2 - ux * hl, by = y2 - uy * hl;
    return '<g class="rr-arrow ' + cls + '"><line x1="' + r1(x1) + '" y1="' + r1(y1) + '" x2="' + r1(bx) + '" y2="' + r1(by) + '"/>' +
      '<path d="M' + r1(x2) + ' ' + r1(y2) + 'L' + r1(bx - uy * hw) + ' ' + r1(by + ux * hw) + 'L' + r1(bx + uy * hw) + ' ' + r1(by - ux * hw) + 'Z"/></g>';
  }
  function text(x, y, s, cls, anchor){ return '<text class="rr-t ' + (cls || '') + '" x="' + r1(x) + '" y="' + r1(y) + '" text-anchor="' + (anchor || 'middle') + '">' + esc(s) + '</text>'; }
  /* A dimension line with end ticks and its label beside it. */
  function dim(x1, y1, x2, y2, label, side, cls){
    var dx = x2 - x1, dy = y2 - y1, L = Math.sqrt(dx * dx + dy * dy) || 1, nx = -dy / L * 5, ny = dx / L * 5;
    var mx = (x1 + x2) / 2, my = (y1 + y2) / 2, o = side || 14;
    var lx = mx - dy / L * o, ly = my + dx / L * o;
    return '<g class="rr-dim ' + (cls || '') + '"><line x1="' + r1(x1) + '" y1="' + r1(y1) + '" x2="' + r1(x2) + '" y2="' + r1(y2) + '"/>' +
      '<line x1="' + r1(x1 - nx) + '" y1="' + r1(y1 - ny) + '" x2="' + r1(x1 + nx) + '" y2="' + r1(y1 + ny) + '"/><line x1="' + r1(x2 - nx) + '" y1="' + r1(y2 - ny) + '" x2="' + r1(x2 + nx) + '" y2="' + r1(y2 + ny) + '"/></g>' +
      text(lx, ly + 4, label, 'rr-dl ' + (cls || ''), Math.abs(dx) > Math.abs(dy) ? 'middle' : (o > 0 === dy > 0 ? 'end' : 'start'));
  }
  /* Scale an arrow to a rate: long enough to see, never off the picture. */
  function alen(rate, unit, max){ var v = Math.abs(rate) * unit; return Math.sign(rate) * Math.min(max || 60, v < 1e-9 ? 0 : Math.max(14, v)); }

  /* Each scene: geo(params) -> layout; art(g, st) -> svg markup; handle
     position and drag mapping. st = { u, rate, q, d, labels, given, watch, fig } */
  var ART = {};
  ART.ladder = {
    vb: [420, 290],
    geo: function(p){ var L = p.L || 13, s = 200 / L; return { L: L, s: s, X0: 156, Y0: 252 }; },
    art: function(g, st){
      var s = g.s, X0 = g.X0, Y0 = g.Y0, x = st.q.x, y = st.q.y, bx = X0 + x * s, ty = Y0 - y * s, o = [];
      // sky, floor, wall
      o.push('<rect class="rr-sky" x="0" y="0" width="420" height="' + Y0 + '"/>');
      o.push('<rect class="rr-floor" x="0" y="' + Y0 + '" width="420" height="' + (290 - Y0) + '"/>');
      o.push('<line class="rr-floor-l" x1="0" y1="' + Y0 + '" x2="420" y2="' + Y0 + '"/>');
      var wall = ['<rect class="rr-wall" x="' + (X0 - 34) + '" y="18" width="34" height="' + (Y0 - 18) + '"/>'];
      for(var row = 0, yy = Y0 - 14; yy > 18; yy -= 14, row++){
        wall.push('<line class="rr-brick" x1="' + (X0 - 34) + '" y1="' + yy + '" x2="' + X0 + '" y2="' + yy + '"/>');
        var off = row % 2 ? 0 : 9; for(var bxk = X0 - 34 + off; bxk < X0; bxk += 18) wall.push('<line class="rr-brick" x1="' + bxk + '" y1="' + yy + '" x2="' + bxk + '" y2="' + (yy + 14) + '"/>');
      }
      o.push('<g>' + wall.join('') + '</g>');
      // the angle at the foot
      var th = Math.atan2(y, x), ar = th < 0.75 ? 40 : 26;
      o.push('<path class="rr-arc" d="M' + r1(bx - ar) + ' ' + Y0 + 'A' + ar + ' ' + ar + ' 0 0 1 ' + r1(bx - ar * Math.cos(th)) + ' ' + r1(Y0 - ar * Math.sin(th)) + '"/>');
      // a flat ladder leaves no room inside the arc: the θ sits on the ground, beyond it
      if(th < 0.75) o.push(text(bx - ar - 13, Y0 - 3, 'θ', 'rr-th'));
      else o.push(text(bx - (ar + 12) * Math.cos(th / 2), Y0 - (ar + 12) * Math.sin(th / 2) + 5, 'θ', 'rr-th'));
      // the ladder: two rails and rungs
      var ux = (X0 - bx), uy = (ty - Y0), Lp = Math.sqrt(ux * ux + uy * uy), nx = -uy / Lp * 6, ny = ux / Lp * 6;
      var lad = ['<line class="rr-rail" x1="' + r1(bx + nx) + '" y1="' + r1(Y0 + ny) + '" x2="' + r1(X0 + nx) + '" y2="' + r1(ty + ny) + '"/>',
        '<line class="rr-rail" x1="' + r1(bx - nx) + '" y1="' + r1(Y0 - ny) + '" x2="' + r1(X0 - nx) + '" y2="' + r1(ty - ny) + '"/>'];
      var rungs = Math.floor(g.L) - 1;
      for(var k = 1; k <= rungs; k++){ var f = k / (rungs + 1), cx = bx + ux * f, cy = Y0 + uy * f; lad.push('<line class="rr-rung" x1="' + r1(cx + nx) + '" y1="' + r1(cy + ny) + '" x2="' + r1(cx - nx) + '" y2="' + r1(cy - ny) + '"/>'); }
      o.push('<g>' + lad.join('') + '</g>');
      o.push(text((bx + X0) / 2 - uy / Lp * 20, (Y0 + ty) / 2 + ux / Lp * 20 + 4, g.L + ' ft', 'rr-len', 'middle'));
      // dimensions
      o.push(dim(X0, Y0 + 20, bx, Y0 + 20, st.labels.x, 14, st.given === 'x' ? 'is-given' : st.watch === 'x' ? 'is-watch' : ''));
      o.push(dim(X0 - 44, Y0, X0 - 44, ty, st.labels.y, -8, st.given === 'y' ? 'is-given' : st.watch === 'y' ? 'is-watch' : ''));
      // rate arrows
      var sp = 12;
      if(st.d){
        var ax = alen(st.d.x, sp), ay = alen(st.d.y, sp), gap = st.fig ? 8 : 24;
        o.push(arrow(bx + Math.sign(ax) * gap, Y0 - 12, bx + Math.sign(ax) * gap + ax, Y0 - 12, st.given === 'x' ? 'is-given' : 'is-watch'));
        o.push(arrow(X0 + 18, ty + (ay > 0 ? -6 : 6), X0 + 18, ty + (ay > 0 ? -6 : 6) - ay, st.given === 'y' ? 'is-given' : 'is-watch'));
      }
      return o.join('');
    },
    handle: function(g, st){ return [g.X0 + st.q.x * g.s, g.Y0]; },
    drag: function(g, px){ return (px - g.X0) / g.s; },
    axis: 'x', hint: 'Drag the foot of the ladder'
  };
  ART.cone = {
    vb: [420, 290],
    geo: function(p){ var R = p.R || 4, H = p.H || 10, s = Math.min(210 / H, 130 / R); return { R: R, H: H, s: s, cx: 196, top: 268 - H * s, tip: 268 }; },
    art: function(g, st){
      var s = g.s, cx = g.cx, tip = g.tip, top = g.top, R = g.R * s, h = st.q.h, r = st.q.r * s, wy = tip - h * s, o = [];
      o.push('<rect class="rr-sky" x="0" y="0" width="420" height="290"/>');
      // the stand
      o.push('<path class="rr-stand" d="M' + (cx - R * 0.55) + ' ' + (top + (tip - top) * 0.45) + 'L' + (cx - R * 0.8) + ' 284M' + (cx + R * 0.55) + ' ' + (top + (tip - top) * 0.45) + 'L' + (cx + R * 0.8) + ' 284"/>');
      o.push('<line class="rr-floor-l" x1="20" y1="284" x2="400" y2="284"/>');
      // back rim, water, front wall
      o.push('<ellipse class="rr-rim-b" cx="' + cx + '" cy="' + r1(top) + '" rx="' + r1(R) + '" ry="' + r1(R * 0.16) + '"/>');
      o.push('<path class="rr-tank" d="M' + r1(cx - R) + ' ' + r1(top) + 'L' + cx + ' ' + tip + 'L' + r1(cx + R) + ' ' + r1(top) + '"/>');
      if(h > 0.02){
        o.push('<path class="rr-water" d="M' + r1(cx - r) + ' ' + r1(wy) + 'L' + cx + ' ' + tip + 'L' + r1(cx + r) + ' ' + r1(wy) + 'A' + r1(r) + ' ' + r1(r * 0.16) + ' 0 0 1 ' + r1(cx - r) + ' ' + r1(wy) + 'Z"/>');
        o.push('<ellipse class="rr-surface" cx="' + cx + '" cy="' + r1(wy) + '" rx="' + r1(r) + '" ry="' + r1(r * 0.16) + '"/>');
      }
      o.push('<path class="rr-rim" d="M' + r1(cx - R) + ' ' + r1(top) + 'A' + r1(R) + ' ' + r1(R * 0.16) + ' 0 0 0 ' + r1(cx + R) + ' ' + r1(top) + '"/>');
      // inflow pipe and stream, or the drain at the tip
      if(!st.fig){
        o.push('<path class="rr-pipe" d="M10 ' + r1(top - 46) + 'H' + (cx - 14) + 'V' + r1(top - 34) + '"/>');
        if(st.rate > 0) o.push('<path class="rr-stream" d="M' + (cx - 14) + ' ' + r1(top - 34) + 'V' + r1(wy) + '"/>');
        if(st.rate < 0) o.push('<path class="rr-stream" d="M' + cx + ' ' + (tip + 2) + 'V' + 283 + '"/>');
        o.push('<rect class="rr-valve" x="' + (cx - 6) + '" y="' + (tip - 2) + '" width="12" height="7" rx="2"/>');
      }
      // radius and depth
      if(h > 0.3){
        o.push('<line class="rr-rad ' + (st.watch === 'r' ? 'is-watch' : '') + '" x1="' + cx + '" y1="' + r1(wy) + '" x2="' + r1(cx - r) + '" y2="' + r1(wy) + '"/>');
        o.push(text(cx - r - 6, wy + 4, st.labels.r, 'rr-dl' + (st.watch === 'r' ? ' is-watch' : ''), 'end'));
      }
      o.push(dim(cx + R + 26, tip, cx + R + 26, wy, st.labels.h, -10, st.watch === 'h' ? 'is-watch' : ''));
      o.push(dim(cx - R, top - 22, cx, top - 22, g.R + ' ft', 12));
      o.push(dim(cx - R - 22, top, cx - R - 22, tip, g.H + ' ft', 12));
      if(st.d && Math.abs(st.d.h) > 1e-9) o.push(arrow(cx + R + 52, wy, cx + R + 52, wy - alen(st.d.h, 40, 50), 'is-watch'));
      return o.join('');
    },
    handle: function(g, st){ return [g.cx + st.q.r * g.s, g.tip - st.q.h * g.s]; },
    drag: function(g, px, py){ return (g.tip - py) / g.s; },
    axis: 'y', hint: 'Drag the water level'
  };
  ART.shadow = {
    vb: [420, 290],
    geo: function(p){ var Hl = p.Hl || 15, hp = p.hp || 6, xmax = p.xmax || 24, k = hp / (Hl - hp), s = Math.min(350 / (xmax * (1 + k)), 200 / Hl); return { Hl: Hl, hp: hp, k: k, s: s, X0: 44, Y0: 232 }; },
    art: function(g, st){
      var s = g.s, X0 = g.X0, Y0 = g.Y0, x = st.q.x, sh = st.q.s, px = X0 + x * s, tipx = X0 + (x + sh) * s, ly = Y0 - g.Hl * s, hy = Y0 - g.hp * s, o = [];
      o.push('<rect class="rr-night" x="0" y="0" width="420" height="' + Y0 + '"/>');
      o.push('<rect class="rr-street" x="0" y="' + Y0 + '" width="420" height="' + (290 - Y0) + '"/>');
      // the pool of light, then the shadow
      o.push('<path class="rr-light" d="M' + (X0 + 8) + ' ' + r1(ly + 6) + 'L' + r1(Math.min(418, tipx + 60)) + ' ' + Y0 + 'L' + (X0 - 30) + ' ' + Y0 + 'Z"/>');
      o.push('<path class="rr-shade" d="M' + r1(px) + ' ' + Y0 + 'L' + r1(tipx) + ' ' + Y0 + 'L' + r1(tipx) + ' ' + (Y0 + 3) + 'L' + r1(px) + ' ' + (Y0 + 5) + 'Z"/>');
      o.push('<line class="rr-shadow" x1="' + r1(px) + '" y1="' + (Y0 + 1) + '" x2="' + r1(tipx) + '" y2="' + (Y0 + 1) + '"/>');
      o.push('<line class="rr-ray" x1="' + (X0 + 10) + '" y1="' + r1(ly + 4) + '" x2="' + r1(tipx) + '" y2="' + Y0 + '"/>');
      // the post and lamp
      o.push('<rect class="rr-post" x="' + (X0 - 3) + '" y="' + r1(ly) + '" width="6" height="' + r1(Y0 - ly) + '"/>');
      o.push('<path class="rr-post" d="M' + X0 + ' ' + r1(ly) + 'q2 -10 14 -8" fill="none" stroke-width="4"/>');
      o.push('<circle class="rr-glow" cx="' + (X0 + 10) + '" cy="' + r1(ly + 2) + '" r="14"/><path class="rr-lamp" d="M' + (X0 + 2) + ' ' + r1(ly - 2) + 'h16l-3 7h-10z"/>');
      // the person, legs swinging with the walk
      var ph = g.hp * s, hr = ph * 0.085, swing = st.fig ? 0.25 : Math.sin(st.phase || 0) * 0.35;
      var hip = Y0 - ph * 0.47, sho = Y0 - ph * 0.8, legL = ph * 0.47;
      o.push('<g class="rr-person">' +
        '<line x1="' + r1(px) + '" y1="' + r1(hip) + '" x2="' + r1(px + Math.sin(swing) * legL) + '" y2="' + Y0 + '"/>' +
        '<line x1="' + r1(px) + '" y1="' + r1(hip) + '" x2="' + r1(px - Math.sin(swing) * legL) + '" y2="' + Y0 + '"/>' +
        '<line x1="' + r1(px) + '" y1="' + r1(hip) + '" x2="' + r1(px) + '" y2="' + r1(sho) + '"/>' +
        '<line x1="' + r1(px) + '" y1="' + r1(sho + 2) + '" x2="' + r1(px - Math.sin(swing) * ph * 0.3) + '" y2="' + r1(sho + ph * 0.3) + '"/>' +
        '<line x1="' + r1(px) + '" y1="' + r1(sho + 2) + '" x2="' + r1(px + Math.sin(swing) * ph * 0.3) + '" y2="' + r1(sho + ph * 0.3) + '"/>' +
        '<circle cx="' + r1(px) + '" cy="' + r1(hy + hr) + '" r="' + r1(hr) + '"/></g>');
      o.push(text(X0 - 8, ly + 26, g.Hl + ' ft', 'rr-len', 'end'));
      o.push(text(px + 8, hy + 12, g.hp + ' ft', 'rr-len', 'start'));
      o.push(dim(X0, Y0 + 18, px, Y0 + 18, st.labels.x, 12, st.given === 'x' ? 'is-given' : ''));
      o.push(dim(px, Y0 + 34, tipx, Y0 + 34, st.labels.s, 12, st.watch === 's' ? 'is-watch' : ''));
      if(st.d){
        o.push(arrow(px + (st.fig ? 0 : 24) * Math.sign(st.d.x || 1), hy - 16, px + (st.fig ? 0 : 24) * Math.sign(st.d.x || 1) + alen(st.d.x, 9, 50), hy - 16, 'is-given'));
        o.push(arrow(tipx, Y0 - 12, tipx + alen(st.d.z, 9, 70), Y0 - 12, 'is-watch'));
      }
      return o.join('');
    },
    handle: function(g, st){ return [g.X0 + st.q.x * g.s, g.Y0 - g.hp * g.s - 16]; },
    drag: function(g, px){ return (px - g.X0) / g.s; },
    axis: 'x', hint: 'Drag the person'
  };
  ART.ripple = {
    vb: [420, 290],
    geo: function(p){ var rmax = p.rmax || 14; return { s: 128 / rmax, cx: 210, cy: 145 }; },
    art: function(g, st){
      var s = g.s, cx = g.cx, cy = g.cy, r = st.q.r * s, o = [];
      o.push('<rect class="rr-pond" x="0" y="0" width="420" height="290"/>');
      o.push('<g class="rr-pads"><path d="M52 52a17 13 0 1 0 12 -10l-12 10z"/><path d="M360 236a20 15 0 1 0 14 -12l-14 12z"/><path d="M380 60a12 9 0 1 0 8 -7l-8 7z"/><circle class="rr-bloom" cx="366" cy="228" r="4"/></g>');
      o.push('<g class="rr-reeds"><path d="M14 290q6 -40 2 -70M24 290q-2 -30 8 -56M396 290q-8 -36 -2 -64M406 290q2 -30 -8 -50"/></g>');
      o.push('<circle class="rr-area ' + (st.watch === 'A' ? 'is-watch' : '') + '" cx="' + cx + '" cy="' + cy + '" r="' + r1(r) + '"/>');
      for(var k = 1; k <= 2; k++) if(r * (1 - 0.18 * k) > 4) o.push('<circle class="rr-wave-in" cx="' + cx + '" cy="' + cy + '" r="' + r1(r * (1 - 0.18 * k)) + '" style="opacity:' + (0.5 - 0.15 * k) + '"/>');
      o.push('<circle class="rr-wave" cx="' + cx + '" cy="' + cy + '" r="' + r1(r) + '"/>');
      o.push('<circle class="rr-stone" cx="' + cx + '" cy="' + cy + '" r="4"/>');
      // the radius runs left, so the drag handle (right edge) never covers its label
      o.push('<line class="rr-rad is-given" x1="' + cx + '" y1="' + cy + '" x2="' + r1(cx - r) + '" y2="' + cy + '"/>');
      o.push(text(cx - r / 2, cy - 10, st.labels.r, 'rr-dl is-given'));
      o.push(r > 70 ? text(cx, cy + r * 0.5, st.labels.A, 'rr-dl is-watch') : text(cx, Math.min(282, cy + r + 22), st.labels.A, 'rr-dl is-watch'));
      if(st.d && Math.abs(st.d.r) > 1e-9){
        var a = alen(st.d.r, 14, 40);
        o.push(arrow(cx - r * 0.7071, cy - r * 0.7071, cx - (r + a) * 0.7071, cy - (r + a) * 0.7071, 'is-given'));
        o.push(arrow(cx + r * 0.7071, cy + r * 0.7071, cx + (r + a) * 0.7071, cy + (r + a) * 0.7071, 'is-given'));
      }
      return o.join('');
    },
    handle: function(g, st){ return [g.cx + st.q.r * g.s, g.cy]; },
    drag: function(g, px){ return (px - g.cx) / g.s; },
    axis: 'x', hint: 'Drag the edge of the ripple'
  };
  ART.balloon = {
    vb: [420, 290],
    geo: function(p){ var d = p.d || 500, hmax = p.hmax || 900, s = Math.min(250 / d, 214 / hmax); return { d: d, s: s, X0: 60, Y0: 262 }; },
    art: function(g, st){
      var s = g.s, X0 = g.X0, Y0 = g.Y0, Lx = X0 + g.d * s, h = st.q.h, by = Y0 - h * s, o = [];
      o.push('<rect class="rr-sky" x="0" y="0" width="420" height="' + Y0 + '"/>');
      o.push('<g class="rr-cloud"><ellipse cx="330" cy="54" rx="34" ry="12"/><ellipse cx="312" cy="46" rx="18" ry="12"/><ellipse cx="96" cy="88" rx="26" ry="9"/></g>');
      o.push('<rect class="rr-grass" x="0" y="' + Y0 + '" width="420" height="' + (290 - Y0) + '"/>');
      // the observer
      o.push('<g class="rr-obs"><line x1="' + (X0 - 4) + '" y1="' + (Y0 - 12) + '" x2="' + (X0 - 8) + '" y2="' + Y0 + '"/><line x1="' + (X0 - 4) + '" y1="' + (Y0 - 12) + '" x2="' + X0 + '" y2="' + Y0 + '"/><line x1="' + (X0 - 4) + '" y1="' + (Y0 - 12) + '" x2="' + (X0 - 4) + '" y2="' + (Y0 - 26) + '"/><circle cx="' + (X0 - 4) + '" cy="' + (Y0 - 30) + '" r="4"/></g>');
      // line of sight and the angle
      var th = Math.atan2(h, g.d), ar = 34;
      o.push('<line class="rr-sight" x1="' + X0 + '" y1="' + Y0 + '" x2="' + r1(Lx) + '" y2="' + r1(by) + '"/>');
      o.push('<path class="rr-arc is-watch" d="M' + (X0 + ar) + ' ' + Y0 + 'A' + ar + ' ' + ar + ' 0 0 0 ' + r1(X0 + ar * Math.cos(th)) + ' ' + r1(Y0 - ar * Math.sin(th)) + '"/>');
      o.push(text(X0 + ar + 6, Y0 - 6 - Math.min(18, ar * Math.sin(th) / 2), 'θ', 'rr-th is-watch', 'start'));
      o.push(dim(X0, Y0 + 16, Lx, Y0 + 16, g.d + ' ft', 10));
      o.push('<line class="rr-plumb" x1="' + r1(Lx) + '" y1="' + Y0 + '" x2="' + r1(Lx) + '" y2="' + r1(by) + '"/>');
      o.push(dim(Lx + 30, Y0, Lx + 30, by, st.labels.h, -10, 'is-given'));
      // the balloon: envelope, gores, basket
      var bw = 22, bh = 28, cy = by - 10 - bh;
      o.push('<g class="rr-balloon"><path class="rr-env" d="M' + r1(Lx) + ' ' + r1(by - 10) + 'C' + r1(Lx - bw * 1.4) + ' ' + r1(cy + bh * 0.4) + ' ' + r1(Lx - bw) + ' ' + r1(cy - bh * 0.9) + ' ' + r1(Lx) + ' ' + r1(cy - bh * 0.9) + 'C' + r1(Lx + bw) + ' ' + r1(cy - bh * 0.9) + ' ' + r1(Lx + bw * 1.4) + ' ' + r1(cy + bh * 0.4) + ' ' + r1(Lx) + ' ' + r1(by - 10) + 'Z"/>' +
        '<path class="rr-gore" d="M' + r1(Lx) + ' ' + r1(by - 10) + 'C' + r1(Lx - bw * 0.5) + ' ' + r1(cy) + ' ' + r1(Lx - bw * 0.45) + ' ' + r1(cy - bh * 0.6) + ' ' + r1(Lx) + ' ' + r1(cy - bh * 0.9) + 'C' + r1(Lx + bw * 0.45) + ' ' + r1(cy - bh * 0.6) + ' ' + r1(Lx + bw * 0.5) + ' ' + r1(cy) + ' ' + r1(Lx) + ' ' + r1(by - 10) + '"/>' +
        '<line class="rr-rope" x1="' + r1(Lx - 4) + '" y1="' + r1(by - 10) + '" x2="' + r1(Lx - 4) + '" y2="' + r1(by - 3) + '"/><line class="rr-rope" x1="' + r1(Lx + 4) + '" y1="' + r1(by - 10) + '" x2="' + r1(Lx + 4) + '" y2="' + r1(by - 3) + '"/>' +
        '<rect class="rr-basket" x="' + r1(Lx - 6) + '" y="' + r1(by - 4) + '" width="12" height="8" rx="2"/></g>');
      if(st.d && Math.abs(st.d.h) > 1e-9) o.push(arrow(Lx - 34, by - 20, Lx - 34, by - 20 - alen(st.d.h, 0.2, 46), 'is-given'));
      return o.join('');
    },
    handle: function(g, st){ return [g.X0 + g.d * g.s, g.Y0 - st.q.h * g.s - 30]; },
    drag: function(g, px, py){ return (g.Y0 - py - 30) / g.s; },
    axis: 'y', hint: 'Drag the balloon up or down'
  };

  /* Labels on the scene: this moment's values, or the problem's knowns. */
  function liveLabels(id, q){
    var f = function(v, u){ return fv(v, Math.abs(v) >= 100 ? 0 : 1) + ' ' + u; };
    return {
      ladder: { x: 'x = ' + f(q.x, 'ft'), y: 'y = ' + f(q.y, 'ft') },
      cone: { h: 'h = ' + f(q.h, 'ft'), r: 'r = ' + f(q.r, 'ft') },
      shadow: { x: 'x = ' + f(q.x, 'ft'), s: 's = ' + f(q.s, 'ft') },
      ripple: { r: 'r = ' + f(q.r, 'ft'), A: 'A = ' + f(q.A, 'ft²') },
      balloon: { h: 'h = ' + f(q.h, 'ft') }
    }[id];
  }

  /* ============================================================ explore */
  T.mount('related-rates', function(app, data){
    var ex = null;
    T.modes(app, { slug: 'related-rates',
      explore: function(host){ ex = explore(host, data); },
      quiz: function(host){ quiz(host, data); },
      onShow: function(m){ if(m !== 'explore' && ex) ex.pause(); },
      studio: { explore: function(pane, s){ ex.studio(pane, s); } } });
  });

  function explore(host, data){
    var LS = null, scenes = RR.ORDER.filter(function(id){ return !data.scenes || data.scenes.indexOf(id) > -1; });
    var st = { id: scenes[0], u: 0, rate: 0, t: 0, playing: false, phase: 0, touched: false };
    var cue = T.cue('Drag the moving part, or press Play. The slider sets the given rate.');
    host.innerHTML =
      '<section class="bt-problem rr-card" aria-label="Related rates explorer">' +
        '<div class="rr-stage">' +
          '<div class="rr-scene-wrap"><svg class="rr-scene" viewBox="0 0 420 290" preserveAspectRatio="xMidYMid meet" role="group"><g class="rr-art" aria-hidden="true"></g></svg></div>' +
          '<div class="rr-side"><div class="rr-read"></div><div class="rr-graph rr-graph-stage" aria-hidden="true"></div></div>' +
        '</div>' +
        '<div class="rr-ctl">' +
          '<div class="rr-scenes ls-scroll" role="group" aria-label="Scene">' + scenes.map(function(id){ return '<button type="button" class="bt-btn rr-sc" data-s="' + id + '" aria-pressed="false" aria-label="' + esc(RR.SCENES[id].name) + '">' + esc(RR.SCENES[id].short) + '</button>'; }).join('') + '</div>' +
          '<div class="rr-slot"></div>' +
          '<div class="bt-buttons rr-btns"><button type="button" class="bt-btn ls-btn ls-pri rr-play">Play</button><button type="button" class="bt-btn ls-btn rr-reset">Start over</button></div>' +
        '</div>' +
        '<div class="rr-say"></div>' +
        '<div class="rr-det"><h3 class="ls-title-l">The watched rate along the way</h3><div class="rr-graph rr-graph-det"></div><div class="rr-all"></div></div>' +
        '<p class="sr-only rr-live"></p>' +
      '</section>';
    var card = host.querySelector('.rr-card');
    card.insertBefore(cue.el, card.querySelector('.rr-say'));
    var $ = function(sel){ return host.querySelector(sel) || (LS ? LS.root.querySelector(sel) : null); };
    var svg = host.querySelector('.rr-scene'), artG = svg.querySelector('.rr-art'), chips = host.querySelector('.rr-scenes');
    var say = T.announcer(host.querySelector('.rr-live'));
    var slider = null, geo = null, loop = null;

    // the drag handle: one element, kept across redraws (focus and pointer capture survive)
    var hd = document.createElementNS(NS, 'g');
    hd.setAttribute('class', 'rr-handle'); hd.setAttribute('tabindex', '0'); hd.setAttribute('role', 'slider');
    // an invisible 27-unit hit circle: at least 44 px across on a 360 px phone
    hd.innerHTML = '<circle class="rr-hit" r="27"/><circle class="rr-halo" r="20"/><circle class="rr-dot" r="8"/>';
    svg.appendChild(hd);

    function scene(){ return RR.SCENES[st.id]; }
    function art(){ return ART[st.id]; }
    function now(){ return scene().at(st.u, st.rate); }

    function setScene(id){
      pause();
      st.id = id; var S = scene();
      st.u = S.driver.start; st.rate = S.rate.value; st.t = 0;
      geo = art().geo(S);
      chips.querySelectorAll('.rr-sc').forEach(function(b){ b.setAttribute('aria-pressed', String(b.getAttribute('data-s') === id)); });
      var slot = $('.rr-slot');
      slider = T.slider({ label: S.rate.label, min: S.rate.min, max: S.rate.max, step: S.rate.step, value: S.rate.value, unit: S.rate.unit,
        onInput: function(v){ st.rate = v; touch(); draw(true); } });
      slot.innerHTML = ''; slot.appendChild(slider.el);
      var D = S.driver, q = S.qs.filter(function(x){ return x.key === D.key; })[0];
      hd.setAttribute('aria-label', art().hint + ' (' + q.name.toLowerCase() + ')');
      hd.setAttribute('aria-valuemin', String(D.min)); hd.setAttribute('aria-valuemax', String(D.max));
      draw(true);
    }
    function touch(){ if(!st.touched){ st.touched = true; cue.done(); } }

    /* -------- drawing */
    function labelsFor(c){ return liveLabels(st.id, c.q); }
    function draw(full){
      var S = scene(), c = now(), A = art();
      var st2 = { q: c.q, d: c.d, rate: st.rate, labels: labelsFor(c), given: S.rate.key === 'V' ? 'V' : S.rate.key, watch: S.watch, phase: st.phase };
      artG.innerHTML = A.art(geo, st2);
      var hp = A.handle(geo, st2);
      hd.setAttribute('transform', 'translate(' + r1(hp[0]) + ' ' + r1(hp[1]) + ')');
      var D = S.driver, dq = S.qs.filter(function(x){ return x.key === D.key; })[0];
      hd.setAttribute('aria-valuenow', M.fixed(st.u, 2));
      hd.setAttribute('aria-valuetext', dq.name + ' ' + fv(c.q[D.key], 2) + ' ' + dq.unit);
      svg.setAttribute('aria-label', S.name + ': ' + S.qs.map(function(x){ return x.name + ' ' + fv(c.q[x.key], 2) + ' ' + x.unit + ', changing at ' + sig(c.d[x.key]) + ' ' + x.rate; }).join('; ') + '.');
      readouts(c);
      if(full || !st.playing || (st.t * 4 | 0) !== draw.q){ draw.q = st.t * 4 | 0; words(c, full); graphs(c); }
      else pills(c);
    }
    function readouts(c){
      var S = scene();
      $('.rr-read').innerHTML = '<table class="ls-tbl rr-tbl"><caption class="sr-only">Every quantity and its rate now</caption><thead><tr><th scope="col">Quantity</th><th scope="col" class="r">Now</th><th scope="col" class="r">Rate</th></tr></thead><tbody>' +
        S.qs.map(function(x){
          var role = x.key === S.rate.key ? 'is-given' : x.key === S.watch ? 'is-watch' : '';
          var val = c.q[x.key], dv = c.d[x.key];
          return '<tr class="' + role + '"><th scope="row"><span class="rr-key"></span>' + tex(x.sym) + ' <span class="rr-qn">' + esc(x.name) + '</span></th>' +
            '<td class="r">' + fv(val, Math.abs(val) >= 100 ? 0 : 2) + ' <span class="rr-u">' + esc(x.unit) + '</span></td>' +
            '<td class="r">' + (dv > 0 ? '+' : '') + sig(dv) + ' <span class="rr-u">' + esc(x.rate) + '</span></td></tr>';
        }).join('') + '</tbody></table>';
    }
    function graphs(c){
      var S = scene(), Pl = S.plot, from = Pl.from != null ? Pl.from : S.driver.min, pts = [], n = 120;
      for(var i = 0; i <= n; i++){ var u = from + (S.driver.max - from) * i / n; pts.push(S.at(u, st.rate).d[S.watch]); }
      var lo = Math.min(0, Math.min.apply(null, pts)), hi = Math.max(0, Math.max.apply(null, pts));
      if(hi - lo < 1e-9){ hi = 1; lo = -1; }
      var pad = (hi - lo) * 0.12; lo -= lo < 0 ? pad : 0; hi += hi > 0 ? pad : 0;
      if(lo === 0) lo = -(hi - lo) * 0.2; if(hi === 0) hi = (hi - lo) * 0.2;
      var cur = c.d[S.watch];
      var spec = function(w, h){ return { label: Pl.label + ', at a given rate of ' + fv(st.rate, 2) + ' ' + S.rate.unit, width: w, height: h, x: [Pl.x[0], Pl.x[1]], y: [lo, hi], xLabel: Pl.xLabel, yLabel: Pl.yLabel,
        curves: [{ fn: function(u){ return u < from - 1e-9 ? NaN : S.at(u, st.rate).d[S.watch]; }, domain: [from, S.driver.max], cls: 's1' }],
        points: [{ at: [st.u, cur], cls: 's1' }], lines: [{ through: [[st.u, lo], [st.u, hi]], cls: 'rr-ucur', dashed: true }] }; };
      try{
        $('.rr-graph-stage').innerHTML = P.svg(spec(300, 170));
        $('.rr-graph-det').innerHTML = P.svg(spec(340, 200));
      }catch(e){}
      var all = S.qs.map(function(x){ return [x.name + ' (' + X.text(x.sym) + ')', fv(c.q[x.key], 3) + ' ' + x.unit, sig(c.d[x.key]) + ' ' + x.rate]; });
      if(st.id === 'ladder' || st.id === 'balloon') all.push(['Angle in degrees', fv(c.q.t * 180 / Math.PI, 1) + '°', sig(c.d.t * 180 / Math.PI) + ' °/' + S.time]);
      all.push(['Time since you pressed Play', fv(st.t, 1) + ' ' + S.time, '']);
      $('.rr-all').innerHTML = '<h3 class="ls-title-l">Every number</h3><table class="ls-tbl"><caption class="sr-only">Every value and rate</caption><thead><tr><th scope="col">Quantity</th><th scope="col" class="r">Value</th><th scope="col" class="r">Rate</th></tr></thead><tbody>' +
        all.map(function(r){ return '<tr><th scope="row">' + esc(r[0]) + '</th><td class="r">' + esc(r[1]) + '</td><td class="r">' + esc(r[2]) + '</td></tr>'; }).join('') + '</tbody></table>' +
        '<p class="bt-small">The graph is the watched rate (crimson in the scene) at every position of the moving part, with the given rate held where the slider is. The dashed line is this moment.</p>';
    }
    var lastCap = '';
    function words(c, full){
      var S = scene(), head = S.meaning(st.u, st.rate), end = S.ends(st.u, st.rate);
      var chain = S.chain(st.u, st.rate);
      var body = '<ol class="rr-chain">' + chain.map(function(k){ return '<li><p>' + html(k.say) + '</p><div class="rr-eq">' + (X ? X.render(k.tex, { display: true }) : esc(k.tex)) + '</div></li>'; }).join('') + '</ol>' +
        '<p class="rr-rule"><b>Substitute after you differentiate.</b> A value like ' + html('$' + S.driver.key + ' = ' + RR.n(st.u, 2) + '$') + ' is true for one instant only. Put it in first and that quantity looks constant, so its rate disappears from the equation.</p>';
      T.explain($('.rr-say'), head + (end ? ' <b>' + esc(end) + '</b>' : ''), body);
      if(LS){
        var cap = head + (end ? ' ' + end : '');
        if(cap !== lastCap){ LS.caption(esc(cap), 'explore'); lastCap = cap; }
        pills(c);
      }
      if(full) say(head);
    }
    function pills(c){
      var S = scene();
      if(LS){
        var g = S.qs.filter(function(x){ return x.key === S.rate.key; })[0], w = S.qs.filter(function(x){ return x.key === S.watch; })[0];
        var narrow = LS.root.classList.contains('ls-phone'); try{ narrow = narrow || matchMedia('(max-width: 599.98px)').matches; }catch(e){}
        var gTxt = (st.rate > 0 ? '+' : '') + fv(st.rate, S.rate.step < 1 ? 2 : 0) + ' ' + esc(g.rate), wTxt = (c.d[S.watch] > 0 ? '+' : '') + sig(c.d[S.watch]) + ' ' + esc(w.rate);
        LS.pills(narrow ? [{ html: '<span class="rr-pk is-given">' + rsym(S.rate.key) + '</span> ' + gTxt + ' · <span class="rr-pk is-watch">' + rsym(S.watch) + '</span> ' + wTxt, tone: 'ghost' }]
          : [{ k: rsym(S.rate.key), html: gTxt, tone: 'readout' }, { k: rsym(S.watch), html: '<span class="rr-pv-w">' + wTxt + '</span>', tone: 'readout' }], 'left', 'explore');
        LS.pills(st.playing || st.t > 0 ? [{ html: (st.playing ? '● ' : '') + 't = ' + fv(st.t, 1) + ' ' + S.time, tone: st.playing ? 'accent' : 'ghost' }] : [], 'right', 'explore');
      }
    }

    /* -------- time */
    function play(){
      var S = scene();
      if(S.ends(st.u, st.rate)) { st.u = S.driver.start; st.t = 0; }
      if(Math.abs(st.rate) < 1e-9){ say('Set a rate first: the slider is at 0.'); return; }
      st.playing = true; touch();
      $('.rr-play').textContent = 'Pause';
      loop = P.loop(function(dt){
        var S2 = scene(), u2 = RR.step(S2, st.u, st.rate, dt * S2.speed);
        st.t += dt * S2.speed; st.phase += dt * 7 * Math.sign(st.rate);
        st.u = u2;
        var stop = !!S2.ends(st.u, st.rate);
        draw(false);
        if(stop) return false;
      }, { still: function(){
        // Reduced motion: the end state, at once.
        var S2 = scene(), lim = st.rate > 0 ? S2.driver.max : S2.driver.min, u0 = st.u, guard = 0;
        while(Math.abs(st.u - lim) > 1e-6 && guard++ < 4000){ st.u = RR.step(S2, st.u, st.rate, 0.05 * S2.speed); st.t += 0.05 * S2.speed; }
        if(Math.abs(u0 - st.u) < 1e-9) st.t = 0;
      }, onEnd: function(){ st.playing = false; $('.rr-play').textContent = 'Play'; draw(true); } });
      loop.start();
    }
    function pause(){ if(loop) loop.stop(); if(st.playing){ st.playing = false; var b = $('.rr-play'); if(b) b.textContent = 'Play'; draw(true); } }
    host.querySelector('.rr-play').addEventListener('click', function(){ if(st.playing) pause(); else play(); });
    host.querySelector('.rr-reset').addEventListener('click', function(){ pause(); var S = scene(); st.u = S.driver.start; st.t = 0; st.rate = S.rate.value; slider.set(st.rate); draw(true); });
    host.querySelector('.rr-scenes').addEventListener('click', function(e){ var b = e.target.closest('.rr-sc'); if(b && b.getAttribute('data-s') !== st.id){ touch(); setScene(b.getAttribute('data-s')); } });

    /* -------- dragging the moving part (pointer and keyboard) */
    function setU(u){ var D = scene().driver; st.u = clamp(u, D.min, D.max); touch(); draw(true); }
    function local(e){ var pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY; var m = svg.getScreenCTM(); var p = m ? pt.matrixTransform(m.inverse()) : pt; return [p.x, p.y]; }
    var dragging = false;
    hd.addEventListener('pointerdown', function(e){ pause(); dragging = true; try{ hd.setPointerCapture(e.pointerId); }catch(er){} hd.classList.add('is-drag'); e.preventDefault(); });
    hd.addEventListener('pointermove', function(e){ if(!dragging) return; var p = local(e); setU(art().drag(geo, p[0], p[1])); });
    function up(){ if(dragging){ dragging = false; hd.classList.remove('is-drag'); } }
    hd.addEventListener('pointerup', up); hd.addEventListener('pointercancel', up);
    hd.addEventListener('keydown', function(e){
      var D = scene().driver, step = (D.max - D.min) / 100 * (e.shiftKey ? 10 : 1), k = e.key, u = st.u;
      if(k === 'ArrowRight' || k === 'ArrowUp') u += step; else if(k === 'ArrowLeft' || k === 'ArrowDown') u -= step;
      else if(k === 'Home') u = D.min; else if(k === 'End') u = D.max; else return;
      e.preventDefault(); pause(); setU(u);
    });

    function hint(){ if(LS && LS.mode() === 'explore') LS.hint({ target: hd, text: art().hint, key: 'apcalc-related-rates-drag' }); }
    function studio(pane, s){
      LS = s;
      var o = { mode: 'explore' };
      var stage = document.createElement('div'); stage.className = 'calc-ls-stage rr-ls-stage'; stage.appendChild(host.querySelector('.rr-stage'));
      s.add('stage', stage, o);
      var dock = document.createElement('div'); dock.className = 'calc-ls-dock rr-ls-dock'; dock.appendChild(host.querySelector('.rr-ctl'));
      s.add('dock', dock, o);
      var why = document.createElement('div'); why.className = 'ls-sec calc-ls-why rr-ls-why'; why.appendChild(cue.el); why.appendChild(host.querySelector('.rr-say'));
      s.add('why', why, o);
      why.querySelectorAll('details.bt-why').forEach(function(d){ d.open = true; });
      var det = document.createElement('div'); det.className = 'ls-sec calc-ls-det rr-ls-det'; det.appendChild(host.querySelector('.rr-det'));
      s.add('details', det, o);
      lastCap = '';
      draw(true);
      hint();
    }
    setScene(st.id);
    return { pause: pause, studio: studio };
  }

  /* ============================================================ test yourself */
  /* The problem's scene, drawn from its own numbers: knowns labelled,
     the unknown rate marked "?". */
  function figure(p){
    var v = p.values, id = p.type, A = ART[id], g, q, labels, d = null, given = '', watch = '';
    if(id === 'ladder'){ g = A.geo({ L: v.L }); q = { x: v.x, y: v.y }; labels = { x: 'x = ' + v.x + ' ft', y: 'y = ' + v.y + ' ft' }; given = v.top ? 'y' : 'x'; watch = v.top ? 'x' : 'y';
      d = v.top ? { x: 1, y: -v.k } : { x: v.k, y: -1 }; }
    else if(id === 'cone'){ g = A.geo({ R: v.R, H: v.H }); q = { h: v.h, r: v.h * v.R / v.H }; labels = { h: 'h = ' + v.h + ' ft', r: 'r' }; watch = 'h'; d = { h: v.dV > 0 ? 1 : -1 }; }
    else if(id === 'shadow'){ g = A.geo({ Hl: v.Hl, hp: v.hp, xmax: v.x }); q = { x: v.x, s: v.x * g.k }; labels = { x: 'x = ' + v.x + ' ft', s: 's' }; given = 'x'; watch = 's'; d = { x: v.w, z: 1 }; }
    else if(id === 'ripple'){ g = A.geo({ rmax: v.r0 * 1.6 }); q = { r: v.r0, A: v.A }; labels = { r: v.byArea ? 'r' : 'r = ' + v.r0 + ' ft', A: v.byArea ? 'A = ' + (v.r0 * v.r0) + 'π ft²' : 'A' }; watch = 'A'; d = { r: v.k }; }
    else { g = A.geo({ d: v.d, hmax: v.h * 1.25 }); q = { h: v.h }; labels = { h: 'h = ' + RR.n(v.h) + ' ft' }; watch = 't'; d = { h: 1 }; }
    var art = A.art(g, { q: q, d: d, rate: 1, labels: labels, given: given, watch: watch, fig: true, phase: 0 });
    var leg = {
      ladder: v.top ? ['dy/dt = −' + RR.n(v.k) + ' ft/s', 'dx/dt'] : ['dx/dt = ' + RR.n(v.k) + ' ft/s', 'dy/dt'],
      cone: ['dV/dt = ' + (v.dV < 0 ? '−' : '') + RR.n(Math.abs(v.dV)) + ' ft³/min', 'dh/dt and dr/dt'],
      shadow: ['dx/dt = ' + v.w + ' ft/s', 'ds/dt and the tip\'s speed'],
      ripple: ['dr/dt = ' + RR.n(v.k) + ' ft/s', 'dA/dt'],
      balloon: ['dh/dt = ' + v.v + ' ft/min', 'dθ/dt']
    }[id];
    // the knowns and the unknown in a band above the scene, never over it
    art += '<g class="rr-legend">' + text(410, -28, '', 'rr-leg', 'end').replace('></text>', '><tspan class="rr-leg-k">Given </tspan><tspan class="is-given">' + esc(leg[0]) + '</tspan></text>').replace('class="rr-t rr-leg"', 'class="rr-t rr-leg"') +
      text(410, -8, '', 'rr-leg', 'end').replace('></text>', '><tspan class="rr-leg-k">Find </tspan><tspan class="is-watch">' + esc(leg[1]) + '</tspan></text>') + '</g>';
    return '<svg class="rr-scene rr-fig" viewBox="0 -48 420 338" role="img" aria-label="' + esc(p.title + ': the situation in the problem, with the known lengths labeled') + '">' + art + '</svg>';
  }
  function quiz(host, data){
    T.drill(host, data, { slug: 'related-rates', noun: 'drill',
      types: RR.KINDS.map(function(k){ return { value: k, label: RR.TITLE[k] }; }), typeLabel: 'Scene',
      generate: RR.generate, title: function(p){ return p.title; }, studioAsk: true,
      extra: function(el, p){ el.innerHTML = '<div class="rr-figwrap">' + figure(p) + '</div>'; } });
  }
})();
