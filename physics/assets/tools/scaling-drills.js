/* Scaling drills (skills tool, free; docs/apphys-spec.md section 6). OWNED BY
   THIS TOOL ONLY. Job: see how one quantity scales when another is
   multiplied, before computing it.

   Explore: pick a relation the student has reached (contexts unlock with
   their topics), drag a factor slider for each variable, and watch a
   before/after illustration drawn to one honest scale (tiles, garden beds,
   pizzas, stacked boxes, pendulums on a beam swinging at their true period
   ratio, hanging springs, cars with a braking strip, a cart from rest,
   satellites, moons, planets, ledge drops with strobe images, a narrowing
   pipe with tracers) and a pair of bars for every quantity, with the
   factor written as a power ("× 3² = × 9").

   Test yourself: ApPhysTools.drill on ApPhysMath.scalingDrills.generate:
   factor problems (how it depends, then the factor), two changes at once,
   unit checks in kg, m and s, and SI conversions. */
(function(){
  'use strict';
  var T = window.ApPhysTools, M = window.ApPhysMath, S = window.ApPhysScene;
  if(!T || !M || !M.scalingDrills) return;
  var SD = M.scalingDrills, PI = Math.PI;
  var here = document.currentScript && document.currentScript.src;
  if(here && !document.querySelector('link[data-sd-css], link[href$="tools/scaling-drills.css"]')){
    var ln = document.createElement('link'); ln.rel = 'stylesheet'; ln.href = here.replace(/scaling-drills\.js(\?.*)?$/, 'scaling-drills.css'); ln.setAttribute('data-sd-css', '1');
    document.head.appendChild(ln);
  }
  var esc = T.esc, F = T.F, sub = SD.sub;
  function nice(x){ var r = M.round(x, 3); return Math.abs(r - Math.round(r)) < 1e-9 ? String(Math.round(r)) : Math.abs(x - 0.5) < 1e-9 ? '½' : Math.abs(x - 0.25) < 1e-9 ? '¼' : M.fmt(x, 3); }
  function pw(p){ return p === 0.5 ? '<sup>½</sup>' : p === -0.5 ? '<sup>−½</sup>' : p === 1 ? '' : '<sup>' + String(p).replace('-', '−') + '</sup>'; }
  function svgOut(w, h, label, inner){ return S.svg(w, h, label, inner).replace('class="phys-scene"', 'class="phys-scene sd-svg"'); }

  /* ------------------------------------------------------ the pictures
     pic(rel, k, t, f) -> SVG (480 × 280): "before" and "after" side by side
     (or one over the other for scenes that run left to right). Everything
     the relation scales is drawn to one honest scale per scene: when the
     "after" object would not fit, both are shrunk by the same factor.
     k: { sym: factor } for every variable; t: animation time (s) since the
     factors last changed (so swing and orbit counters compare fairly). */
  var W = 480, H = 280, uid = 0;
  function r1(x){ return Math.round(x * 10) / 10; }
  function kOf(k, sym){ return k[sym] == null ? 1 : k[sym]; }
  function relKey(rel){ for(var q in SD.REL) if(SD.REL[q] === rel) return q; return ''; }
  // Relations without a scene of their own borrow the closest one.
  var BORROW = { rect: 'rect', spring: 'spring', pespring: 'spring', surfaceg: 'surface', fromrest: 'run', vat: 'run', trip: 'trip', newton: 'newton', centripetal: 'centri', range: 'range', pressure: 'press', torricelli: 'torri', buoyant: 'buoy', torque: 'torque', inertia: 'inertia', rotke: 'rotke', pegrav: 'lift', power: 'lift', impulse: 'impulse' };
  function sceneOf(rel){ return rel.pic !== 'generic' ? rel.pic : BORROW[relKey(rel)] || 'generic'; }
  function defs(g){
    return '<defs>' +
      '<radialGradient id="' + g + 'bob" cx=".34" cy=".3" r=".8"><stop offset="0" class="sd-g-b1"/><stop offset="1" class="sd-g-b2"/></radialGradient>' +
      '<linearGradient id="' + g + 'brass" x1="0" y1="0" x2="1" y2="0"><stop offset="0" class="sd-g-b2"/><stop offset=".42" class="sd-g-b1"/><stop offset="1" class="sd-g-b2"/></linearGradient>' +
      '<linearGradient id="' + g + 'met" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="sd-g-m1"/><stop offset="1" class="sd-g-m2"/></linearGradient>' +
      '<linearGradient id="' + g + 'wood" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="sd-g-w1"/><stop offset="1" class="sd-g-w2"/></linearGradient>' +
      '<linearGradient id="' + g + 'car" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="sd-g-c1"/><stop offset="1" class="sd-g-c2"/></linearGradient>' +
      '<radialGradient id="' + g + 'pl" cx=".36" cy=".32" r=".85"><stop offset="0" class="sd-g-p1"/><stop offset="1" class="sd-g-p2"/></radialGradient>' +
      '<radialGradient id="' + g + 'moon" cx=".36" cy=".32" r=".85"><stop offset="0" class="sd-g-m1"/><stop offset="1" class="sd-g-m2"/></radialGradient>' +
      '<linearGradient id="' + g + 'wat" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="sd-g-h1"/><stop offset=".5" class="sd-g-h2"/><stop offset="1" class="sd-g-h1"/></linearGradient>' +
      '<linearGradient id="' + g + 'tile" x1="0" y1="0" x2="1" y2="1"><stop offset="0" class="sd-g-t1"/><stop offset="1" class="sd-g-t2"/></linearGradient>' +
      '<pattern id="' + g + 'hatch" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="8" class="sd-hatch"/></pattern>' +
      '</defs>';
  }
  function chip(x, y, txt, after){ var w = txt.length * 7.6 + 18; return '<rect x="' + r1(x - w / 2) + '" y="' + (y - 13) + '" width="' + r1(w) + '" height="20" rx="10" class="sd-chip' + (after ? ' sd-chip-a' : '') + '"/><text x="' + x + '" y="' + (y + 1.5) + '" text-anchor="middle" class="sd-h' + (after ? ' sd-h-a' : '') + '">' + esc(txt) + '</text>'; }
  function txt(x, y, s, cls, anchor){ return '<text x="' + r1(x) + '" y="' + r1(y) + '"' + (anchor ? ' text-anchor="' + anchor + '"' : '') + ' class="' + cls + '">' + s + '</text>'; }
  // A dimension line with end ticks; the label sits beside its middle.
  function dim(x1, y1, x2, y2, lab, side){
    var vert = Math.abs(x1 - x2) < 0.5, o = '<g class="sd-dimg"><line x1="' + r1(x1) + '" y1="' + r1(y1) + '" x2="' + r1(x2) + '" y2="' + r1(y2) + '" class="sd-dim"/>';
    o += vert ? '<path d="M' + r1(x1 - 4) + ' ' + r1(y1) + 'h8M' + r1(x2 - 4) + ' ' + r1(y2) + 'h8" class="sd-dim"/>' : '<path d="M' + r1(x1) + ' ' + r1(y1 - 4) + 'v8M' + r1(x2) + ' ' + r1(y2 - 4) + 'v8" class="sd-dim"/>';
    var mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
    o += vert ? txt(side === 'r' ? mx + 7 : mx - 7, my + 5, lab, 'sd-dl', side === 'r' ? 'start' : 'end') : txt(mx, side === 'b' ? my + 17 : my - 7, lab, 'sd-dl', 'middle');
    return o + '</g>';
  }
  function ssub(x){ return sub(String(x)).replace(/<sub>/g, '<tspan dy="3" font-size=".75em">').replace(/<\/sub>/g, '</tspan><tspan dy="-3"> </tspan>'); }
  /* An arrow whose label may be "F_b × 12": only the letter after _ is a subscript. */
  function arw(x, y, dx, dy, o){
    var lab = o.label, oo = {}; for(var q in o) if(q !== 'label') oo[q] = o[q];
    var out = S.arrow(x, y, dx, dy, oo);
    if(!lab) return out;
    var L = Math.sqrt(dx * dx + dy * dy) || 1, ux = dx / L, uy = dy / L, tx = x + dx + ux * 10 + (Math.abs(uy) > 0.7 ? 8 : 0), ty = y + dy + uy * 12 + 4;
    var anchor = ux < -0.3 ? 'end' : 'start';
    if(anchor === 'start' && tx > W - 40){ anchor = 'end'; ty -= 14; tx = Math.min(tx, W - 4); }
    return out + txt(tx, ty, ssub(lab.split(' ')[0].replace('_', '_')) + (lab.indexOf(' ') > 0 ? ' ' + lab.slice(lab.indexOf(' ') + 1) : ''), 'sd-al', anchor);
  }
  function changes(rel, k){
    var c = rel.vars.filter(function(v){ return Math.abs(kOf(k, v.sym) - 1) > 1e-9; }).map(function(v){ return ssub(v.sym) + ' × ' + nice(kOf(k, v.sym)); });
    return c.length ? c.join(', ') : 'nothing changed yet';
  }
  var hideY = false;
  function yres(rel, f){ if(hideY) return '<tspan class="sd-y">' + ssub(rel.Y.sym) + ' × ?</tspan>'; return '<tspan class="sd-y">' + ssub(rel.Y.sym) + ' × ' + nice(f) + '</tspan>'; }
  // Two side-by-side panels: chips on top, captions at the foot.
  function panels(rel, k, f, foot0, foot1){
    return '<line x1="240" x2="240" y1="16" y2="262" class="sd-div"/>' + chip(120, 18, 'Before') + chip(360, 18, 'After', true) +
      txt(120, 262, foot0 || 'the original', 'sd-cap', 'middle') + txt(360, 262, changes(rel, k), 'sd-cap', 'middle') +
      txt(360, 277, (foot1 ? foot1 + ' · ' : '') + yres(rel, f), 'sd-cap2', 'middle');
  }
  // Two rows (before on top) for scenes that run left to right.
  function rows(rel, k, f){
    return '<line x1="12" x2="468" y1="140" y2="140" class="sd-div"/>' + chip(46, 22, 'Before') + chip(42, 160, 'After', true) +
      txt(468, 26, 'the original', 'sd-cap', 'end') + txt(468, 164, changes(rel, k) + ' → ' + yres(rel, f), 'sd-cap', 'end');
  }

  /* pendulums on one wooden beam: pivot bracket, string, brass bob; they
     swing at their true period ratio and count their swings. */
  function scPend(rel, k, t, f, g){
    var Lk = kOf(k, 'L'), mk = kOf(k, 'm'), gk = kOf(k, 'g'), L0 = 110, sc = Math.min(1, 150 / Math.max(L0, L0 * Lk));
    var o = '<rect x="18" y="34" width="444" height="12" rx="3" fill="url(#' + g + 'wood)" class="sd-wood"/>', n = [];
    [[120, L0 * sc, 1, 1], [360, L0 * Lk * sc, mk, Math.sqrt(Lk / gk)]].forEach(function(q, i){
      var px = q[0], py = 58, Ln = q[1], Tn = 1.5 * q[3], amp = 16 * PI / 180, a = amp * Math.cos(2 * PI * t / Tn), bx = px + Ln * Math.sin(a), by = py + Ln * Math.cos(a), br = 9 * Math.cbrt(q[2]);
      n.push(Math.floor(t / Tn));
      o += '<line x1="' + px + '" y1="' + py + '" x2="' + px + '" y2="' + r1(py + Ln + br + 8) + '" class="sd-rest"/>';
      var ax = Ln * Math.sin(amp), ay = py + Ln * Math.cos(amp);
      o += '<path d="M' + r1(px - ax) + ' ' + r1(ay) + 'A' + r1(Ln) + ' ' + r1(Ln) + ' 0 0 0 ' + r1(px + ax) + ' ' + r1(ay) + '" class="sd-arc"/>';
      o += '<path d="M' + (px - 15) + ' 46h30v5l-9 9h-12l-9-9z" fill="url(#' + g + 'met)" class="sd-metal"/>';
      o += '<line x1="' + px + '" y1="' + py + '" x2="' + r1(bx) + '" y2="' + r1(by) + '" class="sd-string"/><circle cx="' + px + '" cy="' + py + '" r="2.6" class="sd-pin"/>';
      o += '<circle cx="' + r1(bx) + '" cy="' + r1(by) + '" r="' + r1(br) + '" fill="url(#' + g + 'bob)" class="sd-bobo"/><circle cx="' + r1(bx) + '" cy="' + r1(by - br - 1.5) + '" r="1.8" class="sd-metal" fill="url(#' + g + 'met)"/>';
      o += dim(px - 66, py, px - 66, py + Ln, i ? 'L × ' + nice(Lk) : 'L');
    });
    if(gk !== 1) o += '<g>' + S.arrow(442, 70, 0, Math.min(60, 26 * gk), { cls: 'f-grav', head: 8 }) + txt(434, 100 + Math.min(30, 13 * gk), 'g × ' + nice(gk), 'sd-dl', 'end') + '</g>';
    o += panels(rel, k, f, 'swings: ' + n[0], 'swings: ' + n[1]);
    return { svg: o, lab: 'Two pendulums swinging side by side from one beam; the right one has length × ' + nice(Lk) + ', bob mass × ' + nice(mk) + ', g × ' + nice(gk) + ', so its period is × ' + nice(f) + '.' };
  }

  /* a coil spring hanging from a beam with a brass slotted mass. springT and
     shmE oscillate (period ratio √(m/k), amplitude marks ±A); F = kx and
     U = ½kx² show a stretch x from the unstretched mark and the spring's pull. */
  function coil(x, y1, y2, w, sw){
    var N = 14, d = 'M' + x + ' ' + y1 + 'v5', hl = '', L = y2 - y1 - 10;
    for(var i = 0; i <= N; i++){ var yy = y1 + 5 + L * i / N, xx = i === 0 || i === N ? x : x + (i % 2 ? -w : w); d += 'L' + r1(xx) + ' ' + r1(yy); }
    d += 'V' + r1(y2);
    return '<path d="' + d + '" class="sd-coil" style="stroke-width:' + sw.toFixed(1) + '"/><path d="' + d + '" class="sd-coil2" style="stroke-width:' + Math.max(0.6, sw * 0.35).toFixed(1) + '" transform="translate(-0.6 -0.6)"/>';
  }
  function mass(x, yTop, s, g, lab){
    var w = s * 1.25, h = s;
    return '<path d="M' + r1(x - 3) + ' ' + r1(yTop - 7) + 'h6v7h-6z" class="sd-metal" fill="url(#' + g + 'met)"/><rect x="' + r1(x - w / 2) + '" y="' + r1(yTop) + '" width="' + r1(w) + '" height="' + r1(h) + '" rx="3" fill="url(#' + g + 'brass)" class="sd-brass"/>' +
      '<line x1="' + r1(x - w / 2 + 3) + '" x2="' + r1(x + w / 2 - 3) + '" y1="' + r1(yTop + h * 0.34) + '" y2="' + r1(yTop + h * 0.34) + '" class="sd-groove"/>' +
      (lab && s > 22 ? txt(x, yTop + h * 0.78, lab, 'sd-ml', 'middle') : '');
  }
  function scSpring(rel, k, t, f, g){
    var key = relKey(rel), osc = key === 'springT' || key === 'shmE';
    var o = '<rect x="18" y="34" width="444" height="12" rx="3" fill="url(#' + g + 'wood)" class="sd-wood"/>', n = [];
    if(osc){
      var mk = kOf(k, 'm'), kk = kOf(k, 'k'), Ak = kOf(k, 'A'), scA = Math.min(1, 1 / Math.max(1, Ak));
      [[120, 1, 1, 1], [360, mk, kk, Ak]].forEach(function(q, i){
        var px = q[0], Tn = 1.3 * Math.sqrt(q[1] / q[2]), A = 30 * q[3] * scA, yEq = 138, y = yEq - A * Math.cos(2 * PI * t / Tn), s = 26 * Math.cbrt(q[1]);
        n.push(Math.floor(t / Tn));
        o += '<path d="M' + (px - 8) + ' 46h16v6h-16z" class="sd-metal" fill="url(#' + g + 'met)"/>';
        o += coil(px, 52, y - 7, 9 + 2 * Math.min(2, Math.sqrt(q[2])), Math.max(1.2, Math.min(4, 2 * Math.sqrt(q[2]))));
        o += mass(px, y, s, g, i && q[1] !== 1 ? 'm × ' + nice(q[1]) : 'm');
        var mx = px + 52;
        o += '<line x1="' + (px - 44) + '" x2="' + (mx + 8) + '" y1="' + yEq + '" y2="' + yEq + '" class="sd-rest"/>' + txt(mx + 10, yEq + 4, 'eq.', 'sd-tl', 'start');
        o += dim(mx, yEq - A, mx, yEq + A, '', 'r') + txt(mx + 7, yEq - A + 4, '+A', 'sd-tl', 'start') + txt(mx + 7, yEq + A + 4, '−A', 'sd-tl', 'start');
      });
      o += panels(rel, k, f, 'cycles: ' + n[0], 'cycles: ' + n[1]);
      return { svg: o, lab: 'Two blocks oscillating on springs; the right one has ' + changes(rel, k).replace(/<[^>]+>/g, '') + ', so its ' + rel.Y.name + ' is × ' + nice(f) + '.' };
    }
    var xk = kOf(k, 'x'), kk2 = kOf(k, 'k'), x0 = 34, scX = Math.min(1, 88 / (x0 * Math.max(1, xk))), Fmax = Math.max(1, f), scF = Math.min(1, 70 / (34 * Fmax));
    [[120, 1, 1, 1], [360, xk, kk2, f]].forEach(function(q, i){
      var px = q[0] - 14, nat = 108, x = x0 * q[1] * scX, y = nat + x, s = 28;
      o += '<path d="M' + (px - 8) + ' 46h16v6h-16z" class="sd-metal" fill="url(#' + g + 'met)"/>';
      o += coil(px, 52, y - 7, 9 + 2 * Math.min(2, Math.sqrt(q[2])), Math.max(1.2, Math.min(4, 2 * Math.sqrt(q[2]))));
      o += mass(px, y, s, g, '');
      o += '<line x1="' + (px - 46) + '" x2="' + (px + 30) + '" y1="' + nat + '" y2="' + nat + '" class="sd-rest"/>' + txt(px - 50, nat + 4, 'x = 0', 'sd-tl', 'end');
      o += dim(px + 40, nat, px + 40, y, i ? 'x × ' + nice(q[1]) : 'x', 'r');
      if(key === 'spring') o += arw(px - 34, y + s / 2, 0, -Math.max(2, 34 * q[3] * scF), { cls: 'f-spring', head: 8, label: 'F_s' });
      else { var bh = Math.max(2, 34 * q[3] * scF); o += '<rect x="' + (px + 76) + '" y="' + r1(232 - bh) + '" width="16" height="' + r1(bh) + '" rx="2" class="sd-ubar"/><line x1="' + (px + 70) + '" x2="' + (px + 98) + '" y1="232" y2="232" class="sd-axis"/>' + txt(px + 84, 246, 'U_s'.replace('_s', '<tspan dy="3" font-size=".75em">s</tspan>'), 'sd-tl', 'middle'); }
    });
    o += panels(rel, k, f);
    return { svg: o, lab: 'Two springs stretched by a hanging block; the right one has ' + changes(rel, k).replace(/<[^>]+>/g, '') + ', so its ' + rel.Y.name + ' is × ' + nice(f) + '.' };
  }

  /* a car on a road. ke and momentum: the speed arrow and, with the same
     brakes, the braking distance (∝ K) or the time to stop (∝ p).
     fromrest/vat: a cart from rest, its distance Δx and final speed v. */
  function car(x, yRoad, s, g, flip){
    var w = 74 * s, h = 22 * s, b = yRoad - 6 * s, wr = 8 * s;
    var d = 'M' + r1(x) + ' ' + r1(b) + 'v' + r1(-h * 0.55) + 'q0 ' + r1(-h * 0.2) + ' ' + r1(w * 0.08) + ' ' + r1(-h * 0.22) + 'l' + r1(w * 0.16) + ' -2' +
      'l' + r1(w * 0.14) + ' ' + r1(-h * 0.5) + 'h' + r1(w * 0.34) + 'l' + r1(w * 0.16) + ' ' + r1(h * 0.5) + 'l' + r1(w * 0.1) + ' 2q' + r1(w * 0.02) + ' 0 ' + r1(w * 0.02) + ' ' + r1(h * 0.24) + 'v' + r1(h * 0.53) + 'z';
    return '<g' + (flip ? '' : '') + '><path d="' + d + '" fill="url(#' + g + 'car)" class="sd-carb"/>' +
      '<path d="M' + r1(x + w * 0.27) + ' ' + r1(b - h * 0.95) + 'l' + r1(w * 0.11) + ' ' + r1(-h * 0.4) + 'h' + r1(w * 0.13) + 'v' + r1(h * 0.4) + 'z M' + r1(x + w * 0.54) + ' ' + r1(b - h * 0.95) + 'v' + r1(-h * 0.4) + 'h' + r1(w * 0.12) + 'l' + r1(w * 0.12) + ' ' + r1(h * 0.4) + 'z" class="sd-glass"/>' +
      [0.22, 0.78].map(function(p){ return '<circle cx="' + r1(x + w * p) + '" cy="' + r1(yRoad - wr) + '" r="' + r1(wr) + '" class="sd-tire"/><circle cx="' + r1(x + w * p) + '" cy="' + r1(yRoad - wr) + '" r="' + r1(wr * 0.45) + '" class="sd-hub"/>'; }).join('') + '</g>';
  }
  function road(y, x1, x2){ return '<rect x="' + x1 + '" y="' + y + '" width="' + (x2 - x1) + '" height="12" class="sd-road"/><line x1="' + x1 + '" x2="' + x2 + '" y1="' + (y + 6) + '" y2="' + (y + 6) + '" class="sd-lane"/>'; }
  function scCar(rel, k, t, f, g){
    var key = relKey(rel), vk = kOf(k, 'v'), mk = kOf(k, 'm'), o = rows(rel, k, f);
    var stripLab = key === 'momentum' ? 'time to stop (same brakes) ∝ p' : 'braking distance (same brakes) ∝ K';
    var Lb = 90, scS = Math.min(1, 260 / (Lb * Math.max(1, f))), scV = Math.min(1, 1 / Math.max(1, vk));
    [[106, 1, 1, 1], [244, vk, mk, f]].forEach(function(q, i){
      var yR = q[0], s = Math.min(1.35, Math.cbrt(q[2])), w = 74 * s, x = 96;
      o += road(yR, 12, 468) + car(x, yR, s, g);
      var front = x + w + 6, sl = Math.max(2, Lb * q[3] * scS);
      if(key === 'momentum') o += '<rect x="' + r1(front) + '" y="' + (yR - 30) + '" width="' + r1(sl) + '" height="12" rx="6" class="sd-tbar"/>';
      else o += '<rect x="' + r1(front) + '" y="' + (yR + 1) + '" width="' + r1(sl) + '" height="10" fill="url(#' + g + 'hatch)" class="sd-skid"/><path d="M' + r1(front + sl) + ' ' + (yR - 14) + 'l5 14h-10z" class="sd-cone"/>';
      o += txt(front + 2, key === 'momentum' ? yR - 36 : yR + 23, (i ? '× ' + nice(q[3]) + ' ' : '') + (i ? '' : stripLab), 'sd-tl', 'start');
      o += arw(x + w * 0.2, yR - 34 * s - 18, Math.max(2, 46 * q[1] * scV), 0, { cls: 'vel', head: 8, label: i ? 'v × ' + nice(q[1]) : 'v' });
    });
    return { svg: o, lab: 'Two cars on a road; the lower one has ' + changes(rel, k).replace(/<[^>]+>/g, '') + '. With the same brakes its ' + (key === 'momentum' ? 'time to stop' : 'braking distance') + ' is × ' + nice(f) + '.' };
  }
  function scRun(rel, k, t, f, g){
    var key = relKey(rel), tk = kOf(k, 't'), ak = kOf(k, 'a'), dx = tk * tk * ak, vv = tk * ak, o = rows(rel, k, f);
    var L0 = 120, scD = Math.min(1, 330 / (L0 * Math.max(1, dx))), scV = Math.min(1, 1 / Math.max(1, vv));
    [[106, 1, 1], [244, dx, vv]].forEach(function(q, i){
      var yR = q[0], x0 = 30, d = Math.max(1, L0 * q[1] * scD), w = 74 * 0.8;
      o += road(yR, 12, 468) + '<line x1="' + x0 + '" x2="' + x0 + '" y1="' + (yR - 40) + '" y2="' + (yR + 12) + '" class="sd-start"/>' + txt(x0 + 3, yR + 23, 'start, at rest', 'sd-tl', 'start');
      o += '<g opacity=".28">' + car(x0, yR, 0.8, g) + '</g>' + car(x0 + d, yR, 0.8, g);
      o += dim(x0, yR - 52, x0 + d, yR - 52, i ? 'Δx × ' + nice(q[1]) : 'Δx', 't');
      o += arw(x0 + d + w + 6, yR - 18, Math.max(2, 40 * q[2] * scV), 0, { cls: 'vel', head: 8, label: i ? 'v × ' + nice(q[2]) : 'v' });
    });
    return { svg: o, lab: 'A cart starting from rest, before and after; the lower one has ' + changes(rel, k).replace(/<[^>]+>/g, '') + ', so its ' + rel.Y.name + ' is × ' + nice(f) + '.' };
  }

  /* orbits: a satellite circling a planet (true angular-speed ratio v/r),
     or two moons pulling on each other (equal and opposite forces ∝ F). */
  function sat(x, y, ang){
    return '<g transform="translate(' + r1(x) + ' ' + r1(y) + ') rotate(' + r1(ang * 180 / PI) + ')"><rect x="-3" y="-11" width="6" height="7" class="sd-panel"/><rect x="-3" y="4" width="6" height="7" class="sd-panel"/><rect x="-4" y="-4" width="8" height="8" rx="1.5" class="sd-satb"/></g>';
  }
  function scOrbit(rel, k, t, f, g){
    var key = relKey(rel), o = '';
    if(key === 'orbitv'){
      var rk = kOf(k, 'r'), Mk = kOf(k, 'M'), r0 = 66, sc = Math.min(1, 84 / (r0 * Math.max(1, rk))), n = [];
      var rmin = Math.min(r0 * sc, r0 * rk * sc), scV = Math.min(1, 1 / Math.max(1, f));
      [[120, r0 * sc, 1, 1], [360, r0 * rk * sc, Mk, f]].forEach(function(q, i){
        var cx = q[0], cy = 134, R = Math.max(6, Math.min(16 * Math.cbrt(q[2]), 0.55 * rmin)), w = 0.9 * (i ? f / rk : 1), ang = -w * t, sx = cx + q[1] * Math.cos(ang), sy = cy + q[1] * Math.sin(ang);
        n.push(Math.floor(w * t / (2 * PI)));
        o += '<circle cx="' + cx + '" cy="' + cy + '" r="' + r1(q[1]) + '" class="sd-orbit"/><circle cx="' + cx + '" cy="' + cy + '" r="' + r1(R) + '" fill="url(#' + g + 'pl)" class="sd-planet"/>';
        o += sat(sx, sy, ang) + S.arrow(sx, sy, 30 * q[3] * scV * Math.sin(ang), -30 * q[3] * scV * Math.cos(ang), { cls: 'vel', head: 7, width: 2.5 });
        o += dim(cx, cy + q[1] + 12, cx + q[1], cy + q[1] + 12, i ? 'r × ' + nice(rk) : 'r', 'b');
      });
      o += panels(rel, k, f, 'orbits: ' + n[0], 'orbits: ' + n[1]);
      return { svg: o, lab: 'Two satellites in circular orbits; the right orbit has radius × ' + nice(rk) + ' around a planet of mass × ' + nice(Mk) + ', so its speed is × ' + nice(f) + '.' };
    }
    var rk2 = kOf(k, 'r'), mk = kOf(k, 'm₁'), d0 = 150, scD = Math.min(1, 330 / (d0 * Math.max(1, rk2))), scF = Math.min(1, 1 / Math.max(1, f));
    o = rows(rel, k, f);
    [[84, 1, 1, 1], [222, rk2, mk, f]].forEach(function(q, i){
      var y = q[0], x1 = 70, x2 = x1 + d0 * q[1] * scD, Ra = 13 * Math.cbrt(q[2]), Rb = 13, Fl = Math.max(2, 44 * q[3] * scF);
      o += '<circle cx="' + x1 + '" cy="' + y + '" r="' + r1(Ra) + '" fill="url(#' + g + 'moon)" class="sd-moon"/><circle cx="' + r1(x2) + '" cy="' + y + '" r="' + Rb + '" fill="url(#' + g + 'moon)" class="sd-moon"/>';
      o += S.arrow(x1 + Ra + 2, y, Fl, 0, { cls: 'f-grav', head: 8 }) + S.arrow(x2 - Rb - 2, y, -Fl, 0, { cls: 'f-grav', head: 8 });
      o += txt(x1, y + Ra + 16, i ? 'm₁ × ' + nice(q[2]) : 'm₁', 'sd-tl', 'middle') + txt(x2, y + Rb + 16, 'm₂', 'sd-tl', 'middle');
      o += dim(x1, y + 30, x2, y + 30, i ? 'r × ' + nice(q[1]) : 'r', 'b');
      o += txt(x1 + Ra + 4, y - 10, i ? 'F × ' + nice(q[3]) : 'F', 'sd-tl', 'start');
    });
    return { svg: o, lab: 'Two moons pulling on each other with equal and opposite forces; on the lower row ' + changes(rel, k).replace(/<[^>]+>/g, '') + ', so each force arrow is × ' + nice(f) + '.' };
  }
  function scSurface(rel, k, t, f, g){
    var Rk = kOf(k, 'R'), Mk = kOf(k, 'M'), R0 = 58, sc = Math.min(1, 76 / (R0 * Math.max(1, Rk))), scG = Math.min(1, 1 / Math.max(1, f)), o = '';
    [[120, R0 * sc, 1, 1], [360, R0 * Rk * sc, Mk, f]].forEach(function(q, i){
      var cx = q[0], cy = 156, R = q[1];
      o += '<circle cx="' + cx + '" cy="' + cy + '" r="' + r1(R) + '" fill="url(#' + g + 'pl)" class="sd-planet"/>';
      o += '<circle cx="' + cx + '" cy="' + r1(cy - R - 6) + '" r="6" fill="url(#' + g + 'bob)" class="sd-bobo"/>' + arw(cx + 18, cy - R - 46, 0, Math.max(2, 40 * q[3] * scG), { cls: 'f-grav', head: 8, label: i ? 'g × ' + nice(q[3]) : 'g' });
      o += dim(cx, cy, cx + R, cy, i ? 'R × ' + nice(Rk) : 'R', 't') + txt(cx, cy + 20, i ? 'M × ' + nice(q[2]) : 'M', 'sd-ml', 'middle');
    });
    o += panels(rel, k, f);
    return { svg: o, lab: 'Two planets with a ball on the surface; the right one has radius × ' + nice(Rk) + ' and mass × ' + nice(Mk) + ', so g at its surface is × ' + nice(f) + '.' };
  }

  /* drop: a ball let go from a ledge, with faint strobe images at equal time
     steps (the gaps grow: it speeds up); the fall time ratio is true. */
  function scDrop(rel, k, t, f, g){
    var hk = kOf(k, 'h'), gk = kOf(k, 'g'), h0 = 150, sc = Math.min(1, 180 / (h0 * Math.max(1, hk))), T0 = 1.1, cyc = T0 * Math.max(1, f) + 1.2, tt = t % cyc, o = '';
    [[120, h0 * sc, 1], [360, h0 * hk * sc, f]].forEach(function(q, i){
      var px = q[0], yG = 236, Tf = T0 * q[2], top = yG - q[1], st = 0.18;
      o += '<rect x="' + (px - 100) + '" y="' + yG + '" width="200" height="8" class="sd-grass"/><rect x="' + (px - 100) + '" y="' + (yG + 8) + '" width="200" height="6" class="sd-soil"/>';
      o += '<rect x="' + (px - 64) + '" y="' + r1(top + 8) + '" width="22" height="' + r1(yG - top - 8) + '" fill="url(#' + g + 'hatch)" class="sd-wall"/><rect x="' + (px - 70) + '" y="' + r1(top + 4) + '" width="62" height="6" rx="2" fill="url(#' + g + 'wood)" class="sd-wood"/>';
      for(var s = st; s < Tf; s += st){ var yy = top + (q[1] - 8) * (s / Tf) * (s / Tf); o += '<circle cx="' + (px - 8 + 26) + '" cy="' + r1(yy - 0) + '" r="6" class="sd-ghost"/>'; }
      var u = Math.min(1, tt / Tf), yb = top - 2 + (q[1] - 6) * u * u;
      o += '<circle cx="' + (px + 18) + '" cy="' + r1(yb) + '" r="7" fill="url(#' + g + 'bob)" class="sd-bobo"/>';
      o += dim(px + 54, top, px + 54, yG, i ? 'h × ' + nice(hk) : 'h', 'r');
    });
    if(gk !== 1) o += txt(468, 44, 'g × ' + nice(gk), 'sd-dl', 'end');
    o += panels(rel, k, f, 'faint balls: equal time steps');
    return { svg: o, lab: 'Two balls dropped from rest from ledges, with strobe images at equal time steps; on the right the height is × ' + nice(hk) + ' and g is × ' + nice(gk) + ', so the fall time is × ' + nice(f) + '.' };
  }

  /* pipe: water through a full pipe that narrows. Tracer dots are spaced
     equally in time, so they bunch where the water is slow and spread where
     it is fast (the volume per second is the same everywhere). */
  function scPipe(rel, k, t, f, g){
    var dk = kOf(k, 'd'), D = 56, d0 = 34, sc = Math.min(1, 92 / Math.max(D, d0 * dk)), o = rows(rel, k, f), u0 = 26;
    [[86, d0 * sc], [222, d0 * dk * sc]].forEach(function(q, i){
      var yc = q[0], Dw = D * sc, dn = q[1], xa = 24, xb = 160, xc = 196, xd = 300, xe = 336, xf = 456;
      function half(x){ var dd = x < xb || x > xe ? Dw : x < xc ? Dw + (dn - Dw) * (x - xb) / (xc - xb) : x <= xd ? dn : dn + (Dw - dn) * (x - xd) / (xe - xd); return dd / 2; }
      var top = 'M' + xa + ' ' + r1(yc - Dw / 2) + 'H' + xb + 'L' + xc + ' ' + r1(yc - dn / 2) + 'H' + xd + 'L' + xe + ' ' + r1(yc - Dw / 2) + 'H' + xf;
      var bot = 'M' + xa + ' ' + r1(yc + Dw / 2) + 'H' + xb + 'L' + xc + ' ' + r1(yc + dn / 2) + 'H' + xd + 'L' + xe + ' ' + r1(yc + Dw / 2) + 'H' + xf;
      o += '<path d="' + top + 'V' + r1(yc + Dw / 2) + 'H' + xe + 'L' + xd + ' ' + r1(yc + dn / 2) + 'H' + xc + 'L' + xb + ' ' + r1(yc + Dw / 2) + 'H' + xa + 'z" fill="url(#' + g + 'wat)" class="sd-water"/><path d="' + top + bot + '" class="sd-pipe"/>';
      // time-of-flight table along the pipe: dτ = dx / u(x), u = u0 (Dw / d(x))²
      var xs = [], ts = [0], N = 216; for(var j = 0; j <= N; j++) xs.push(xa + (xf - xa) * j / N);
      for(j = 1; j <= N; j++){ var xm = (xs[j] + xs[j - 1]) / 2, u = u0 * Math.pow(Dw / (2 * half(xm)), 2); ts.push(ts[j - 1] + (xs[j] - xs[j - 1]) / u); }
      var Tt = ts[N], gap = 0.62, lanes = [-0.55, 0, 0.55];
      lanes.forEach(function(ln, li){
        for(var s = ((t + li * gap / 3) % gap); s < Tt; s += gap){
          var a = 0, b = N; while(b - a > 1){ var m = (a + b) >> 1; if(ts[m] < s) a = m; else b = m; }
          var x = xs[a] + (xs[b] - xs[a]) * (s - ts[a]) / Math.max(1e-9, ts[b] - ts[a]), hw = half(x), uu = u0 * Math.pow(Dw / (2 * hw), 2), len = Math.min(26, 2 + uu * 0.035);
          o += '<line x1="' + r1(x - len) + '" x2="' + r1(x) + '" y1="' + r1(yc + ln * hw) + '" y2="' + r1(yc + ln * hw) + '" class="sd-tracer"/>';
        }
      });
      o += dim(xd + 10 + 0, yc - dn / 2, xd + 10, yc + dn / 2, '', 'r') + txt(248, r1(yc - Math.max(dn, 14) / 2 - 8), i ? 'd × ' + nice(dk) + ', v × ' + nice(f) : 'd, v', 'sd-tl', 'middle');
    });
    return { svg: o, lab: 'Water flowing through a full pipe that narrows; on the lower row the narrow part has diameter × ' + nice(dk) + ', so the water there moves × ' + nice(f) + ' as fast. Tracer dots are spaced equally in time.' };
  }

  /* squares (tiles), rectangles (garden beds), circles (pizzas, the same
     pepperoni slices: their number scales with the area) and cubes (stacked
     unit boxes): the original size is drawn as a grid inside the new one. */
  function scArea(rel, k, t, f, g){
    var key = relKey(rel), sq = rel.pic === 'square', o = '';
    var a0 = sq ? 72 : 96, b0 = sq ? 72 : 60, ka = sq ? kOf(k, 's') : kOf(k, 'ℓ'), kb = sq ? ka : kOf(k, 'w');
    var sc = Math.min(1, 196 / (a0 * Math.max(1, ka)), 160 / (b0 * Math.max(1, kb)));
    [[120, 1, 1], [360, ka, kb]].forEach(function(q, i){
      var w = a0 * q[1] * sc, h = b0 * q[2] * sc, x = q[0] - w / 2, y = 132 - h / 2, uw = a0 * sc, uh = b0 * sc;
      o += '<rect x="' + r1(x) + '" y="' + r1(y) + '" width="' + r1(w) + '" height="' + r1(h) + '" rx="2" fill="url(#' + g + 'tile)" class="' + (sq ? 'sd-tilef' : 'sd-bed') + '"/>';
      for(var gx = uw; !hideY && gx < w - 0.5; gx += uw) o += '<line x1="' + r1(x + gx) + '" x2="' + r1(x + gx) + '" y1="' + r1(y) + '" y2="' + r1(y + h) + '" class="sd-grout"/>';
      for(var gy = uh; !hideY && gy < h - 0.5; gy += uh) o += '<line x1="' + r1(x) + '" x2="' + r1(x + w) + '" y1="' + r1(y + gy) + '" y2="' + r1(y + gy) + '" class="sd-grout"/>';
      if(i) o += '<rect x="' + r1(x) + '" y="' + r1(y) + '" width="' + r1(uw) + '" height="' + r1(uh) + '" class="sd-orig"/>';
      o += dim(x, y + h + 12, x + w, y + h + 12, sq ? (i ? 's × ' + nice(q[1]) : 's') : (i ? 'ℓ × ' + nice(q[1]) : 'ℓ'), 'b');
      if(!sq) o += dim(x - 12, y, x - 12, y + h, i ? 'w × ' + nice(q[2]) : 'w');
    });
    o += panels(rel, k, f, 'one tile of the original', hideY ? '' : 'dashed: the original');
    return { svg: o, lab: (sq ? 'Two square tiles' : 'Two rectangular garden beds') + ' with the original drawn as a grid inside the new one; the area is × ' + nice(f) + '.' };
  }
  function scCircle(rel, k, t, f, g){
    var rk = kOf(k, 'r'), r0 = 42, sc = Math.min(1, 90 / (r0 * Math.max(1, rk))), o = '', n0 = hideY ? 8 : Math.max(6, Math.round(6 / f)), pr = 0.4 * r0 * sc / Math.sqrt(n0);
    [[120, r0 * sc, n0], [360, r0 * rk * sc, hideY ? 0 : Math.round(n0 * f)]].forEach(function(q, i){
      var cx = q[0], cy = 128, R = q[1], N = Math.min(400, q[2]);
      o += '<circle cx="' + cx + '" cy="' + cy + '" r="' + r1(R) + '" class="sd-crust"/><circle cx="' + cx + '" cy="' + cy + '" r="' + r1(R * 0.86) + '" class="sd-cheese"/>';
      // same-size slices in a sunflower spiral: their number scales with the area
      for(var j = 0; j < N; j++){ var rr = (R * 0.86 - pr - 1) * Math.sqrt((j + 0.5) / N), an = j * 2.39996; o += '<circle cx="' + r1(cx + rr * Math.cos(an)) + '" cy="' + r1(cy + rr * Math.sin(an)) + '" r="' + r1(pr) + '" class="sd-pep"/>'; }
      o += dim(cx, cy + R + 12, cx + R, cy + R + 12, i ? 'r × ' + nice(rk) : 'r', 'b');
    });
    o += hideY ? panels(rel, k, f, 'a pizza') : panels(rel, k, f, n0 + ' slices fit', Math.round(n0 * f) + ' slices fit');
    return { svg: o, lab: 'Two pizzas with same-size pepperoni slices; the right one has radius × ' + nice(rk) + ', so its area (and the number of slices that fit) is × ' + nice(f) + '.' };
  }
  function scCube(rel, k, t, f, g){
    var kk = kOf(k, 's'), e0 = 66, sc = Math.min(1, 124 / (e0 * Math.max(1, kk))), o = '';
    [[120, 1], [360, kk]].forEach(function(q, i){
      var e = e0 * q[1] * sc, u = e0 * sc, d = e * 0.5, dy = d * 0.6, x = q[0] - (e + d) / 2, yb = 138 + (e + dy) / 2, yt = yb - e;
      o += '<path d="M' + r1(x) + ' ' + r1(yt) + 'l' + r1(d) + ' ' + r1(-dy) + 'h' + r1(e) + 'l' + r1(-d) + ' ' + r1(dy) + 'z" class="sd-ctop"/>';
      o += '<path d="M' + r1(x + e) + ' ' + r1(yb) + 'v' + r1(-e) + 'l' + r1(d) + ' ' + r1(-dy) + 'v' + r1(e) + 'z" class="sd-cside"/>';
      o += '<rect x="' + r1(x) + '" y="' + r1(yt) + '" width="' + r1(e) + '" height="' + r1(e) + '" class="sd-cfront"/>';
      var gl = '';
      for(var a = u; !hideY && a < e - 0.5; a += u){
        var fa = a / e;
        gl += 'M' + r1(x + a) + ' ' + r1(yt) + 'v' + r1(e) + 'M' + r1(x) + ' ' + r1(yt + a) + 'h' + r1(e);           // front
        gl += 'M' + r1(x + a) + ' ' + r1(yt) + 'l' + r1(d) + ' ' + r1(-dy) + 'M' + r1(x + d * fa) + ' ' + r1(yt - dy * fa) + 'h' + r1(e); // top
        gl += 'M' + r1(x + e + d * fa) + ' ' + r1(yt - dy * fa) + 'v' + r1(e) + 'M' + r1(x + e) + ' ' + r1(yt + a) + 'l' + r1(d) + ' ' + r1(-dy); // side
      }
      if(gl) o += '<path d="' + gl + '" class="sd-grout"/>';
      if(i) o += '<rect x="' + r1(x) + '" y="' + r1(yb - u) + '" width="' + r1(u) + '" height="' + r1(u) + '" class="sd-orig"/>';
      o += dim(x, yb + 12, x + e, yb + 12, i ? 's × ' + nice(q[1]) : 's', 'b');
    });
    o += panels(rel, k, f, 'one box', hideY ? '' : 'grid: boxes of the original size');
    return { svg: o, lab: 'Two cube-shaped boxes; the right one has edge × ' + nice(kk) + ' and is drawn as a stack of the original box, so its volume is × ' + nice(f) + '.' };
  }

  /* ---- more scenes: every remaining relation gets a real object */
  function tank(x, yT, w, h, wl, g){ // glass tank, water from wl down to the floor
    return '<rect x="' + r1(x) + '" y="' + r1(wl) + '" width="' + r1(w) + '" height="' + r1(yT + h - wl) + '" fill="url(#' + g + 'wat)" class="sd-water" opacity=".75"/>' +
      '<line x1="' + r1(x) + '" x2="' + r1(x + w) + '" y1="' + r1(wl) + '" y2="' + r1(wl) + '" class="sd-surf"/>' +
      '<path d="M' + r1(x) + ' ' + r1(yT) + 'V' + r1(yT + h) + 'H' + r1(x + w) + 'V' + r1(yT) + '" class="sd-glassw"/>';
  }
  function bar(x, yb, hgt, lab){ return '<rect x="' + r1(x) + '" y="' + r1(yb - hgt) + '" width="16" height="' + r1(Math.max(1.5, hgt)) + '" rx="2" class="sd-ybar"/><line x1="' + r1(x - 5) + '" x2="' + r1(x + 21) + '" y1="' + r1(yb) + '" y2="' + r1(yb) + '" class="sd-axis"/>' + txt(x + 8, yb + 14, lab, 'sd-tl', 'middle'); }
  function ysym(rel){ return sub(rel.Y.sym).replace(/<sub>/g, '<tspan dy="3" font-size=".75em">').replace(/<\/sub>/g, '</tspan>'); }
  function plain(rel, k){ return changes(rel, k).replace(/<[^>]+>/g, ''); }
  function scTrip(rel, k, t, f, g){
    var vk = kOf(k, 'v'), dk = kOf(k, 'd'), o = rows(rel, k, f), L0 = 150, scD = Math.min(1, 300 / (L0 * Math.max(1, dk))), T0 = 70, scT = Math.min(1, 300 / (T0 * Math.max(1, f)));
    [[106, 1, 1, 1], [244, vk, dk, f]].forEach(function(q, i){
      var yR = q[0], x0 = 40, d = L0 * q[2] * scD;
      o += road(yR, 12, 468) + car(x0, yR, 0.7, g) + '<path d="M' + r1(x0 + 52 + d) + ' ' + (yR - 30) + 'v30M' + r1(x0 + 52 + d) + ' ' + (yR - 30) + 'h14v9h-14" class="sd-flag"/>';
      o += dim(x0 + 52, yR + 20, x0 + 52 + d, yR + 20, i ? 'd × ' + nice(q[2]) : 'd', 'b');
      o += arw(x0 + 8, yR - 34, Math.max(2, 36 * q[1] / Math.max(1, vk)), 0, { cls: 'vel', head: 7, label: i ? 'v × ' + nice(q[1]) : 'v' });
      o += '<rect x="' + (x0 + 130) + '" y="' + (yR - 44) + '" width="' + r1(Math.max(2, T0 * q[3] * scT)) + '" height="10" rx="5" class="sd-tbar"/>' + txt(x0 + 126, yR - 35, 't', 'sd-tl', 'end');
    });
    return { svg: o, lab: 'A bus on a trip, before and after; the lower one has ' + plain(rel, k) + ', so the time bar is × ' + nice(f) + '.' };
  }
  function cart(x, yR, s, g, lab){
    var w = 60 * s, h = 26 * s;
    return '<rect x="' + r1(x) + '" y="' + r1(yR - h - 8) + '" width="' + r1(w) + '" height="' + r1(h) + '" rx="4" fill="url(#' + g + 'car)" class="sd-carb"/>' +
      [0.22, 0.78].map(function(p){ return '<circle cx="' + r1(x + w * p) + '" cy="' + (yR - 6) + '" r="6" class="sd-tire"/><circle cx="' + r1(x + w * p) + '" cy="' + (yR - 6) + '" r="2.4" class="sd-hub"/>'; }).join('') +
      (lab ? txt(x + w / 2, yR - 8 - h / 2 + 4, lab, 'sd-cl', 'middle') : '');
  }
  function track(y){ return '<rect x="12" y="' + y + '" width="456" height="6" rx="2" fill="url(#' + g0 + 'met)" class="sd-metal"/>'; }
  var g0 = '';
  function scNewton(rel, k, t, f, g){
    g0 = g; var Fk = kOf(k, 'F'), mk = kOf(k, 'm'), o = rows(rel, k, f), scF = Math.min(1, 1 / Math.max(1, Fk)), scA = Math.min(1, 1 / Math.max(1, f));
    [[106, 1, 1, 1], [244, Fk, mk, f]].forEach(function(q, i){
      var yR = q[0], s = Math.min(1.5, Math.cbrt(q[2])), x = 190, w = 60 * s;
      o += track(yR) + cart(x, yR, s, g, i ? 'm × ' + nice(q[2]) : 'm');
      o += '<path d="M' + r1(x - 40) + ' ' + r1(yR - 22) + 'h-16v-12h16z" class="sd-hand"/>' + S.arrow(x - 70 - 50 * q[1] * scF + 20, yR - 20, 50 * q[1] * scF, 0, { cls: 'f-applied', head: 8 });
      o += txt(x - 46, yR - 44, i ? 'F × ' + nice(q[1]) : 'F', 'sd-dl', 'end');
      o += arw(x + w + 16, yR - 20, Math.max(2, 70 * q[3] * scA), 0, { cls: 'acc', head: 8, label: i ? 'a × ' + nice(q[3]) : 'a' });
    });
    return { svg: o, lab: 'A cart pushed along a frictionless track; the lower one has ' + plain(rel, k) + ', so its acceleration arrow is × ' + nice(f) + '.' };
  }
  function scCentri(rel, k, t, f, g){
    var vk = kOf(k, 'v'), rk = kOf(k, 'r'), r0 = 64, sc = Math.min(1, 86 / (r0 * Math.max(1, rk))), scA = Math.min(1, 1 / Math.max(1, f)), scV = Math.min(1, 1 / Math.max(1, vk)), o = '';
    [[120, r0 * sc, 1, 1], [360, r0 * rk * sc, vk, f]].forEach(function(q, i){
      var cx = q[0], cy = 134, R = q[1], w = 0.8 * q[2] / (q[1] / (r0 * sc)), an = -w * t, x = cx + R * Math.cos(an), y = cy + R * Math.sin(an);
      o += '<circle cx="' + cx + '" cy="' + cy + '" r="' + r1(R) + '" class="sd-track"/><circle cx="' + cx + '" cy="' + cy + '" r="2.5" class="sd-pin"/>';
      o += S.arrow(x, y, -Math.cos(an) * Math.min(R - 6, 44 * q[3] * scA), -Math.sin(an) * Math.min(R - 6, 44 * q[3] * scA), { cls: 'acc', head: 7 });
      o += S.arrow(x, y, 34 * q[2] * scV * Math.sin(an), -34 * q[2] * scV * Math.cos(an), { cls: 'vel', head: 7 });
      o += '<g transform="translate(' + r1(x) + ' ' + r1(y) + ') rotate(' + r1(an * 180 / PI) + ')"><rect x="-6" y="-10" width="12" height="20" rx="4" fill="url(#' + g + 'car)" class="sd-carb"/></g>';
      o += dim(cx, cy + R + 12, cx + R, cy + R + 12, i ? 'r × ' + nice(rk) : 'r', 'b');
    });
    o += '<g>' + arw(18, 236, 22, 0, { cls: 'vel', head: 6, width: 2.5, label: 'v' }) + arw(70, 236, 22, 0, { cls: 'acc', head: 6, width: 2.5, label: 'a_c' }) + '</g>';
    o += panels(rel, k, f);
    return { svg: o, lab: 'Top view of a car on a circular track, with its velocity and centripetal acceleration arrows; the right one has ' + plain(rel, k) + ', so a_c is × ' + nice(f) + '.' };
  }
  function scRange(rel, k, t, f, g){
    var vk = kOf(k, 'v₀'), o = rows(rel, k, f), R0 = 150, sc = Math.min(1, 380 / (R0 * Math.max(1, f))), Tf = 1.2, cyc = Tf * Math.max(1, vk) + 1;
    [[118, 1, 1], [256, vk, f]].forEach(function(q, i){
      var yG = q[0], x0 = 40, R = R0 * q[2] * sc, Hm = Math.min(76, R * 0.36), d = 'M' + x0 + ' ' + yG + 'Q' + r1(x0 + R / 2) + ' ' + r1(yG - 2 * Hm) + ' ' + r1(x0 + R) + ' ' + yG;
      o += '<rect x="12" y="' + yG + '" width="456" height="7" class="sd-grass"/><path d="' + d + '" class="sd-traj"/>';
      var u = Math.min(1, (t % cyc) / (Tf * q[1])), bx = x0 + R * u, by = yG - 4 * Hm * u * (1 - u) - 6;
      o += '<circle cx="' + r1(bx) + '" cy="' + r1(by) + '" r="6" fill="url(#' + g + 'bob)" class="sd-bobo"/>';
      o += arw(x0, yG - 6, 28 * q[1] / Math.max(1, vk) * 0.7, -28 * q[1] / Math.max(1, vk) * 0.7, { cls: 'vel', head: 7, label: i ? 'v₀ × ' + nice(q[1]) : 'v₀' });
      o += dim(x0, yG + 14, x0 + R, yG + 14, i ? 'R × ' + nice(q[2]) : 'R', 'b');
    });
    return { svg: o, lab: 'A ball launched at the same angle over level ground; the lower one has launch speed × ' + nice(vk) + ', so its range is × ' + nice(f) + '.' };
  }
  function diver(x, y){ return '<g transform="translate(' + r1(x) + ' ' + r1(y) + ')"><ellipse cx="0" cy="0" rx="16" ry="5.5" class="sd-diver"/><circle cx="-19" cy="-1" r="5" class="sd-diver"/><rect x="-24" y="-4" width="6" height="4" rx="1" class="sd-mask"/><path d="M14 -2l10 -5v12z" class="sd-diver"/><rect x="-8" y="-10" width="14" height="5" rx="2.5" class="sd-tankd"/></g>'; }
  function scPress(rel, k, t, f, g){
    var hk = kOf(k, 'h'), rk = kOf(k, 'ρ'), h0 = 70, sc = Math.min(1, 160 / (h0 * Math.max(1, hk))), scP = Math.min(1, 1 / Math.max(1, f)), o = '';
    [[120, 1, 1, 1], [360, hk, rk, f]].forEach(function(q, i){
      var x = q[0] - 96, wl = 50, d = h0 * q[1] * sc;
      o += '<g style="filter:saturate(' + (0.8 + 0.4 * Math.min(2, q[2])).toFixed(2) + ') brightness(' + (1.08 - 0.1 * Math.min(2, q[2])).toFixed(2) + ')">' + tank(x, 40, 150, 196, wl, g) + '</g>';
      o += diver(x + 70, wl + d) + dim(x + 18, wl, x + 18, wl + d, i ? 'h × ' + nice(q[1]) : 'h', 'r');
      o += bar(q[0] + 70, 230, 150 * 0.4 * q[3] * scP, 'P');
      if(i && q[2] !== 1) o += txt(x + 140, wl + 18, 'ρ × ' + nice(q[2]), 'sd-dl', 'end');
    });
    o += panels(rel, k, f);
    return { svg: o, lab: 'A diver under water at depth h, with a gauge-pressure bar; the right one has ' + plain(rel, k) + ', so the gauge pressure is × ' + nice(f) + '.' };
  }
  function scTorri(rel, k, t, f, g){
    var hk = kOf(k, 'h'), h0 = 60, sc = Math.min(1, 150 / (h0 * Math.max(1, hk))), o = '', yH = 196, scV = Math.min(1, 1 / Math.max(1, f));
    [[120, 1, 1], [360, hk, f]].forEach(function(q, i){
      var x = q[0] - 84, wl = yH - h0 * q[1] * sc, v = 70 * q[2] * scV, drop = 40, reach = v * 0.9;
      o += tank(x, 38, 80, yH - 38 + 18, wl, g) + '<circle cx="' + (x + 80) + '" cy="' + yH + '" r="3" class="sd-pin"/>';
      o += '<path d="M' + (x + 80) + ' ' + yH + 'Q' + r1(x + 80 + reach * 0.55) + ' ' + yH + ' ' + r1(x + 80 + reach) + ' ' + (yH + drop) + '" class="sd-jet"/>';
      o += arw(x + 84, yH - 14, Math.max(2, v * 0.7), 0, { cls: 'vel', head: 7, label: i ? 'v × ' + nice(q[2]) : 'v' });
      o += dim(x - 10, wl, x - 10, yH, i ? 'h × ' + nice(q[1]) : 'h') + '<rect x="' + (x - 20) + '" y="' + (yH + 40) + '" width="220" height="5" class="sd-soil"/>';
    });
    o += panels(rel, k, f);
    return { svg: o, lab: 'Water leaking from a small hole a depth h below the surface; the right one is × ' + nice(hk) + ' as deep, so the water leaves × ' + nice(f) + ' as fast.' };
  }
  function scBuoy(rel, k, t, f, g){
    var sk = kOf(k, 's'), rk = kOf(k, 'ρ'), e0 = 40, sc = Math.min(1, 80 / (e0 * Math.max(1, sk))), scF = Math.min(1, 1 / Math.max(1, f)), o = '';
    [[120, 1, 1, 1], [360, sk, rk, f]].forEach(function(q, i){
      var x = q[0] - 90, e = e0 * q[1] * sc, cx = q[0] - 20, cy = 168, Fl = Math.max(2, 70 * q[3] * scF);
      o += '<g style="filter:saturate(' + (0.8 + 0.4 * Math.min(2, q[2])).toFixed(2) + ')">' + tank(x, 58, 150, 176, 76, g) + '</g>';
      o += '<path d="M' + cx + ' 40V' + r1(cy - e / 2) + '" class="sd-string"/><path d="M' + (cx - 12) + ' 34h24v6h-24z" class="sd-metal" fill="url(#' + g + 'met)"/>';
      o += '<rect x="' + r1(cx - e / 2) + '" y="' + r1(cy - e / 2) + '" width="' + r1(e) + '" height="' + r1(e) + '" rx="2" fill="url(#' + g + 'brass)" class="sd-brass"/>';
      o += arw(cx + e / 2 + 14, cy + Fl / 2, 0, -Fl, { cls: 'f-buoy', head: 8, label: i ? 'F_b × ' + nice(q[3]) : 'F_b' });
      o += dim(cx - e / 2, cy + e / 2 + 12, cx + e / 2, cy + e / 2 + 12, i ? 's × ' + nice(q[1]) : 's', 'b');
      if(i && q[2] !== 1) o += txt(x + 144, 96, 'ρ × ' + nice(q[2]), 'sd-dl', 'end');
    });
    o += panels(rel, k, f);
    return { svg: o, lab: 'A cube held fully under water on a string, with the buoyant force arrow; the right one has ' + plain(rel, k) + ', so the buoyant force is × ' + nice(f) + '.' };
  }
  function scTorque(rel, k, t, f, g){
    var rk = kOf(k, 'r'), Fk = kOf(k, 'F'), L = 170, r0 = 70, sc = Math.min(1, 1 / Math.max(1, rk) * 1.0), scF = Math.min(1, 1 / Math.max(1, Fk)), o = '';
    [[56, 1, 1, 1], [296, rk, Fk, f]].forEach(function(q, i){
      var x0 = q[0], yD = 116, rr = Math.min(L - 6, r0 * q[1] * (rk > 2.4 ? 2.4 / rk : 1));
      o += '<rect x="' + (x0 - 14) + '" y="' + (yD - 34) + '" width="10" height="80" fill="url(#' + g + 'hatch)" class="sd-wall"/>';
      o += '<rect x="' + x0 + '" y="' + (yD - 5) + '" width="' + L + '" height="10" rx="2" fill="url(#' + g + 'wood)" class="sd-wood"/><circle cx="' + x0 + '" cy="' + yD + '" r="5" class="sd-pin"/>';
      o += S.arrow(x0 + rr, yD + 8 + 54 * q[2] * scF, 0, -54 * q[2] * scF, { cls: 'f-applied', head: 8 }) + txt(x0 + rr + 8, yD + 8 + 54 * q[2] * scF, i ? 'F × ' + nice(q[2]) : 'F', 'sd-al', 'start');
      o += dim(x0, yD - 18, x0 + rr, yD - 18, i ? 'r × ' + nice(q[1]) : 'r', 't');
      var ra = 26, sw = Math.min(150, 50 * q[3] / Math.max(1, f) * 1.6);
      o += '<path d="M' + r1(x0 + ra) + ' ' + yD + 'A' + ra + ' ' + ra + ' 0 0 0 ' + r1(x0 + ra * Math.cos(sw * PI / 180)) + ' ' + r1(yD - ra * Math.sin(sw * PI / 180)) + '" class="sd-tarc" style="stroke-width:' + (2 + 3 * q[3] / Math.max(1, f)).toFixed(1) + '"/>' + txt(x0 + 4, yD + 36, 'τ', 'sd-dl', 'middle');
    });
        o += panels(rel, k, f, 'top view of a door on its hinge');
    return { svg: o, lab: 'Top view of a door on its hinge pushed perpendicular to it; the right one has ' + plain(rel, k) + ', so the torque is × ' + nice(f) + '.' };
  }
  function scInertia(rel, k, t, f, g){
    var rk = kOf(k, 'r'), mk = kOf(k, 'm'), r0 = 50, sc = Math.min(1, 92 / (r0 * Math.max(1, rk))), o = '';
    [[120, 1, 1], [360, rk, mk]].forEach(function(q, i){
      var cx = q[0], cy = 132, R = r0 * q[1] * sc, an = -0.9 * t, x = cx + R * Math.cos(an), y = cy + R * Math.sin(an), b = 8 * Math.cbrt(q[2]);
      o += '<circle cx="' + cx + '" cy="' + cy + '" r="' + r1(R) + '" class="sd-orbit"/><line x1="' + cx + '" y1="' + cy + '" x2="' + r1(x) + '" y2="' + r1(y) + '" class="sd-rod"/>';
      o += '<circle cx="' + cx + '" cy="' + cy + '" r="6" fill="url(#' + g + 'met)" class="sd-metal"/><circle cx="' + r1(x) + '" cy="' + r1(y) + '" r="' + r1(b) + '" fill="url(#' + g + 'bob)" class="sd-bobo"/>';
      o += dim(cx, cy + R + 14, cx + R, cy + R + 14, i ? 'r × ' + nice(q[1]) : 'r', 'b') + (i && q[2] !== 1 ? txt(x, y - b - 6, 'm × ' + nice(q[2]), 'sd-dl', 'middle') : '');
    });
    o += panels(rel, k, f, 'same spin rate');
    return { svg: o, lab: 'Top view of a small mass on a light rod spinning about an axis; the right one has ' + plain(rel, k) + ', so its rotational inertia is × ' + nice(f) + '.' };
  }
  function scRotKE(rel, k, t, f, g){
    var wk = kOf(k, 'ω'), Ik = kOf(k, 'I'), o = '';
    [[120, 1, 1], [360, wk, Ik]].forEach(function(q, i){
      var cx = q[0], cy = 130, R = 48 * Math.min(1.7, Math.pow(q[2], 1 / 3)), an = -1.2 * q[1] * t, sp = '';
      for(var j = 0; j < 6; j++){ var a = an + j * PI / 3; sp += 'M' + cx + ' ' + cy + 'L' + r1(cx + R * 0.82 * Math.cos(a)) + ' ' + r1(cy + R * 0.82 * Math.sin(a)); }
      o += '<circle cx="' + cx + '" cy="' + cy + '" r="' + r1(R) + '" fill="url(#' + g + 'met)" class="sd-metal"/><circle cx="' + cx + '" cy="' + cy + '" r="' + r1(R * 0.82) + '" class="sd-fwin"/><path d="' + sp + '" class="sd-spoke"/><circle cx="' + cx + '" cy="' + cy + '" r="7" class="sd-pin"/>';
      o += '<circle cx="' + r1(cx + R * 0.91 * Math.cos(an)) + '" cy="' + r1(cy + R * 0.91 * Math.sin(an)) + '" r="3.5" class="sd-dotm"/>';
      var a1 = -150 * PI / 180, a2 = -150 * PI / 180 + Math.min(2.4, 0.9 * q[1]), Ra = R + 12;
      o += '<path d="M' + r1(cx + Ra * Math.cos(a1)) + ' ' + r1(cy + Ra * Math.sin(a1)) + 'A' + r1(Ra) + ' ' + r1(Ra) + ' 0 0 1 ' + r1(cx + Ra * Math.cos(a2)) + ' ' + r1(cy + Ra * Math.sin(a2)) + '" class="sd-tarc"/>' + txt(cx - Ra - 4, cy - Ra + 10, i ? 'ω × ' + nice(q[1]) : 'ω', 'sd-dl', 'end');
      o += txt(cx, cy + R + 22, i ? 'I × ' + nice(q[2]) : 'I', 'sd-tl', 'middle');
    });
    o += panels(rel, k, f);
    return { svg: o, lab: 'Two spinning flywheels; the right one has ' + plain(rel, k) + ', so its rotational kinetic energy is × ' + nice(f) + '.' };
  }
  function scLift(rel, k, t, f, g){
    var key = relKey(rel), o = '';
    if(key === 'pegrav'){
      var hk = kOf(k, 'Δh'), mk = kOf(k, 'm'), h0 = 70, sc = Math.min(1, 150 / (h0 * Math.max(1, hk)));
      [[120, hk === hk ? 1 : 1, 1, 1], [360, hk, mk, f]].forEach(function(q, i){
        var x = q[0] - 60, yF = 228, hS = h0 * q[1] * sc, s = 26 * Math.min(1.5, Math.cbrt(q[2]));
        o += '<rect x="' + (x - 30) + '" y="' + yF + '" width="180" height="6" class="sd-soil"/><rect x="' + (x + 30) + '" y="' + r1(yF - hS) + '" width="80" height="7" rx="2" fill="url(#' + g + 'wood)" class="sd-wood"/><path d="M' + (x + 106) + ' ' + r1(yF - hS + 7) + 'V' + yF + '" class="sd-leg"/>';
        o += '<rect x="' + r1(x - 20) + '" y="' + r1(yF - s) + '" width="' + r1(s) + '" height="' + r1(s) + '" rx="2" class="sd-box" opacity=".35"/>';
        o += '<rect x="' + r1(x + 54) + '" y="' + r1(yF - hS - s) + '" width="' + r1(s) + '" height="' + r1(s) + '" rx="2" class="sd-box"/><path d="M' + r1(x + 54) + ' ' + r1(yF - hS - s / 2) + 'h' + r1(s) + '" class="sd-tape"/>';
        o += dim(x + 20, yF - hS, x + 20, yF, i ? 'Δh × ' + nice(q[1]) : 'Δh') + (i && q[2] !== 1 ? txt(x + 54 + s / 2, yF - hS - s - 6, 'm × ' + nice(q[2]), 'sd-dl', 'middle') : '');
        o += bar(q[0] + 86, yF, Math.max(1.5, 60 * q[3] / Math.max(1, f)), 'ΔU');
      });
      o += panels(rel, k, f);
      return { svg: o, lab: 'A box lifted from the floor onto a shelf; the right one has ' + plain(rel, k) + ', so its change in gravitational potential energy is × ' + nice(f) + '.' };
    }
    var tk = kOf(k, 'Δt'), Wk = kOf(k, 'W'), cyc = 1.6 * Math.max(1, tk) + 1, scP = Math.min(1, 1 / Math.max(1, f));
    [[120, tk, Wk, 1, 1], [360, tk, Wk, 0, f]].forEach(function(q, i){
      var x = q[0] - 40, Tl = 1.6 * (i ? q[1] : 1), u = Math.min(1, (t % cyc) / Tl), hi = 130, yL = 220 - hi * u, s = 24 * Math.min(1.5, Math.cbrt(i ? q[2] : 1));
      o += '<rect x="' + (x - 10) + '" y="42" width="60" height="30" rx="5" fill="url(#' + g + 'car)" class="sd-carb"/><circle cx="' + (x + 20) + '" cy="57" r="11" fill="url(#' + g + 'met)" class="sd-metal"/>' + txt(x + 20, 36, 'motor', 'sd-tl', 'middle');
      o += '<line x1="' + (x + 31) + '" y1="57" x2="' + (x + 31) + '" y2="' + r1(yL - s) + '" class="sd-string"/>' + '<rect x="' + r1(x + 31 - s / 2) + '" y="' + r1(yL - s) + '" width="' + r1(s) + '" height="' + r1(s) + '" rx="2" fill="url(#' + g + 'brass)" class="sd-brass"/>';
      o += '<rect x="' + (x - 20) + '" y="220" width="110" height="5" class="sd-soil"/>' + txt(x - 18, 100, i ? 'Δt × ' + nice(q[1]) : 'Δt', 'sd-dl', 'start') + (i && q[2] !== 1 ? txt(x - 18, 118, 'W × ' + nice(q[2]), 'sd-dl', 'start') : '');
      o += bar(q[0] + 70, 220, Math.max(1.5, 60 * q[4] * scP), 'P');
    });
    o += panels(rel, k, f, 'lifts in Δt');
    return { svg: o, lab: 'A motor lifting a load; the right one has ' + plain(rel, k) + ', so its average power is × ' + nice(f) + '.' };
  }
  function scImpulse(rel, k, t, f, g){
    var tk = kOf(k, 'Δt'), o = '', scF = Math.min(1, 1 / Math.max(1, f));
    [[120, 1, 1], [360, tk, f]].forEach(function(q, i){
      var cx = q[0], th = Math.min(60, 12 * q[1]), yF = 226, top = yF - th;
      o += '<rect x="' + (cx - 80) + '" y="' + yF + '" width="160" height="6" class="sd-soil"/><rect x="' + (cx - 46) + '" y="' + r1(top) + '" width="92" height="' + r1(th) + '" rx="' + r1(Math.min(8, th / 2)) + '" class="sd-cush"/>';
      o += '<ellipse cx="' + cx + '" cy="' + r1(top - 15) + '" rx="11" ry="15" class="sd-egg"/>';
      o += arw(cx + 30, top - 2, 0, -Math.max(2, 80 * q[2] * scF), { cls: 'f-normal', head: 8, label: i ? 'F × ' + nice(q[2]) : 'F' });
      o += txt(cx - 50, r1(top + th / 2 + 4), i ? 'stops in Δt × ' + nice(q[1]) : 'stops in Δt', 'sd-tl', 'end');
    });
    o += panels(rel, k, f, 'same Δp in both');
    return { svg: o, lab: 'An egg stopped by a softer surface; the right one takes Δt × ' + nice(tk) + ' to stop with the same change in momentum, so the average force is × ' + nice(f) + '.' };
  }
  var SCENES = { trip: scTrip, newton: scNewton, centri: scCentri, range: scRange, press: scPress, torri: scTorri, buoy: scBuoy, torque: scTorque, inertia: scInertia, rotke: scRotKE, lift: scLift, impulse: scImpulse, pendulum: scPend, spring: scSpring, car: scCar, run: scRun, orbit: scOrbit, surface: scSurface, drop: scDrop, pipe: scPipe, square: scArea, rect: scArea, circle: scCircle, cube: scCube };
  var ANIM = { pendulum: 1, spring: 1, orbit: 1, drop: 1, pipe: 1, centri: 1, range: 1, inertia: 1, rotke: 1, lift: 1 };
  function pic(rel, k, t, f){
    var fn = SCENES[sceneOf(rel)];
    if(!fn) return '';
    var g = 'sd' + (++uid) + '-', r = fn(rel, k, t, f, g);
    return svgOut(W, H, r.lab, defs(g) + r.svg);
  }
  /* Bars: for each variable and the result, a "before" bar of 1 and an
     "after" bar of its factor, on one linear scale. */
  function bars(rel, k, f){
    var hide = f == null;
    var items = rel.vars.map(function(v){ return { sym: v.sym, k: kOf(k, v.sym), p: v.p, name: v.name }; }).concat([{ sym: rel.Y.sym, k: hide ? 1 : f, y: true, name: rel.Y.name, hide: hide }]);
    var top = Math.max(1, Math.max.apply(null, items.map(function(x){ return x.k; })));
    var W = 400, rowH = 46, H = 22 + items.length * rowH, x0 = 92, bw = W - x0 - 72, out = '';
    items.forEach(function(it, i){
      var y = 16 + i * rowH, b1 = bw / top, b2 = bw * it.k / top;
      out += '<text x="' + (x0 - 10) + '" y="' + (y + 24) + '" text-anchor="end" class="sd-sym' + (it.y ? ' sd-y' : '') + '">' + sub(it.sym).replace(/<sub>/g, '<tspan dy="4" font-size=".7em">').replace(/<\/sub>/g, '</tspan><tspan dy="-4"></tspan>') + '</text>';
      out += '<rect x="' + x0 + '" y="' + (y + 4) + '" width="' + b1.toFixed(1) + '" height="14" rx="3" class="sd-b0"/>' + (it.hide ? '<rect x="' + x0 + '" y="' + (y + 21) + '" width="' + bw + '" height="14" rx="3" class="sd-bq"/>' : '<rect x="' + x0 + '" y="' + (y + 21) + '" width="' + Math.max(1.5, b2).toFixed(1) + '" height="14" rx="3" class="sd-b1' + (it.y ? ' y' : '') + '"/>');
      out += '<text x="' + (it.hide ? x0 + bw / 2 : x0 + Math.max(b1, b2) + 8).toFixed(1) + '" y="' + (y + 33) + '"' + (it.hide ? ' text-anchor="middle"' : '') + ' class="sd-k' + (it.y ? ' sd-y' : '') + '">' + (it.hide ? '× ?' : '× ' + esc(nice(it.k))) + '</text>';
    });
    var lab = 'Bars before (light) and after (dark): ' + items.map(function(it){ return it.sym.replace(/_/g, '') + (it.hide ? ' × ? (to find)' : ' × ' + nice(it.k)); }).join(', ') + '.';
    return S.svg(W, H, lab, out).replace('class="phys-scene"', 'class="phys-scene sd-svg sd-bars"');
  }

  /* -------------------------------------------------------------- mount */
  T.mount('scaling-drills', function(app, data){
    var ex = null;
    T.modes(app, { slug: 'scaling-drills', labels: ['Explore', 'Test yourself'],
      explore: function(host){ ex = explore(host, data); },
      quiz: function(host){ quiz(host, data); },
      onShow: function(m){ if(ex){ if(m === 'explore') ex.go(); else ex.stop(); } },
      studio: { explore: function(pane, s){ ex.studio(pane, s); } } });
  });

  function explore(host, data){
    var keys = [];
    (data.contexts || []).forEach(function(c){ (c.relations || []).forEach(function(k){ if(keys.indexOf(k) < 0 && SD.REL[k]) keys.push(k); }); });
    if(!keys.length) keys = ['square'];
    // Open on the pendulum when it is live: it is the classic.
    var st = { rel: keys.indexOf('pendulum') > -1 ? 'pendulum' : keys.indexOf('ke') > -1 ? 'ke' : keys[0], k: {} }, LS = null, loop = null, t = 0, sliders = [];
    host.innerHTML = '<section class="bt-problem sd-card"><div class="sd-dock"><div class="sd-relsel"></div><div class="sd-sl"></div><div class="bt-buttons"><button type="button" class="bt-btn sd-reset">Reset to × 1</button></div></div>' +
      '<div class="sd-view show-pic"><div class="sd-vtoggle tseg" role="group" aria-label="Show"><button type="button" data-v="pic" aria-pressed="true" class="on">Picture</button><button type="button" data-v="bar" aria-pressed="false">Bars</button></div><div class="sd-pic"></div><div class="sd-bar"></div><p class="sd-eq"></p></div><div class="sd-say"></div><p class="sr-only sd-live"></p>' +
      T.moreHtml('<div class="sd-table"></div>', 'the formula and the numbers') + '</section>';
    var $ = function(sel){ return host.querySelector(sel) || (LS ? LS.root.querySelector(sel) : null); };
    var dock = host.querySelector('.sd-dock'), view = host.querySelector('.sd-view'), say = T.announcer(host.querySelector('.sd-live'));
    var cue = T.cue('Drag a slider to scale one quantity and watch the other one change.');
    dock.insertBefore(cue.el, dock.firstChild);
    var relSel = T.choiceSelect({ label: 'Relation', options: keys.map(function(k){ var r = SD.REL[k]; return { value: k, label: r.Y.name.charAt(0).toUpperCase() + r.Y.name.slice(1) + ': ' + r.formula.replace(/_/g, '') }; }), value: st.rel, onChange: function(v){ setRel(v); } });
    host.querySelector('.sd-relsel').appendChild(relSel.el);
    view.querySelectorAll('.sd-vtoggle button').forEach(function(b){ b.addEventListener('click', function(){ var v = b.getAttribute('data-v'); view.classList.toggle('show-pic', v === 'pic'); view.classList.toggle('show-bar', v === 'bar'); view.querySelectorAll('.sd-vtoggle button').forEach(function(x){ var on = x === b; x.setAttribute('aria-pressed', String(on)); x.classList.toggle('on', on); }); }); });
    host.querySelector('.sd-reset').addEventListener('click', function(){ sliders.forEach(function(x){ x.sl.set(1); st.k[x.v.sym] = 1; }); t = 0; draw(); });
    function range(p){ var a = Math.abs(p) || 1; return { min: Math.max(0.25, Math.pow(16, -1 / a)), max: Math.min(4, Math.pow(16, 1 / a)) }; }
    function setRel(key){
      st.rel = key; st.k = {};
      var rel = SD.REL[key], h = $('.sd-sl'); h.innerHTML = ''; sliders = [];
      rel.vars.forEach(function(v){
        var rg = range(v.p); st.k[v.sym] = 1;
        var sl = T.slider({ label: cap(v.name) + ', ' + v.sym + ': times', min: M.round(rg.min, 2), max: M.round(rg.max, 2), step: 0.05, value: 1, decimals: 2, onInput: function(x){ cue.done(); st.k[v.sym] = snap(x); t = 0; draw(); } });
        h.appendChild(sl.el); sliders.push({ v: v, sl: sl });
      });
      draw();
      animate();
    }
    // A factor close to a simple fraction snaps to it (⅓, ½, 2, 3...).
    function snap(x){ var c = [0.25, 1 / 3, 0.5, 2 / 3, 0.75, 1, 1.5, 2, 2.5, 3, 4].filter(function(q){ return Math.abs(q - x) < 0.026; })[0]; return c != null ? c : x; }
    function cap(s){ return s.charAt(0).toUpperCase() + s.slice(1); }
    function fac(){ var rel = SD.REL[st.rel]; return rel.vars.reduce(function(a, v){ return a * Math.pow(st.k[v.sym], v.p); }, 1); }
    function animate(){
      if(loop) loop.stop();
      var p = SD.REL[st.rel].pic;
      if(!ANIM[sceneOf(SD.REL[st.rel])] || S.reduced()){ loop = null; t = 0; drawPic(); return; }
      loop = S.loop(function(dt){ t += dt; drawPic(); }, {});
      loop.start();
    }
    function drawPic(){ var rel = SD.REL[st.rel], el = $('.sd-pic'), svg = pic(rel, st.k, t, fac()); el.innerHTML = svg; el.hidden = !svg; view.classList.toggle('no-pic', !svg); }
    var lastHead = '';
    function draw(){
      var rel = SD.REL[st.rel], f = fac();
      drawPic();
      $('.sd-bar').innerHTML = bars(rel, st.k, f);
      var changed = rel.vars.filter(function(v){ return Math.abs(st.k[v.sym] - 1) > 1e-9; });
      var parts = changed.map(function(v){ return '(' + nice(st.k[v.sym]) + ')' + pw(v.p); });
      var eq = sub(rel.Y.sym) + ' × ' + (changed.length ? parts.join(' × ') + ' = <b>× ' + nice(f) + '</b>' : '<b>1</b>');
      $('.sd-eq').innerHTML = eq;
      var hd;
      if(!changed.length) hd = 'Drag a slider: how does ' + sub(rel.Y.sym) + ' change?';
      else if(changed.length === 1 && changed[0].p === 0) hd = sub(rel.Y.sym) + ' does not change: it does not depend on ' + sub(changed[0].sym) + '.';
      else hd = changed.map(function(v){ return sub(v.sym) + ' × ' + nice(st.k[v.sym]); }).join(', ') + ' → ' + sub(rel.Y.sym) + ' × ' + nice(f) + '.';
      var body = '<p><b>' + rel.formula.replace(/_([A-Za-z]+)/g, '<sub>$1</sub>') + '</b>, for ' + rel.say + '.</p><ul class="sd-list">' + rel.vars.map(function(v){
        return '<li>' + (v.p === 0 ? sub(rel.Y.sym) + ' does not depend on ' + sub(v.sym) + ' (the ' + v.name + '): changing it changes nothing.' : sub(rel.Y.sym) + ' ∝ ' + SD.powText(v.sym, v.p) + ': scaling the ' + v.name + ' by k scales ' + sub(rel.Y.sym) + ' by k' + pw(v.p) + (v.p === 0.5 ? ' = √k (4 times as much gives twice as much).' : v.p === -2 ? ' = 1/k² (twice as far gives a quarter).' : v.p === 2 ? ' (three times as much gives nine times).' : v.p === -1 ? ' = 1/k.' : '.')) + '</li>';
      }).join('') + '</ul>' + (changed.length > 1 ? '<p>Two changes at once: the factors multiply.</p>' : '');
      T.explain(host.querySelector('.sd-say') || $('.sd-say'), hd, body);
      $('.sd-table').innerHTML = T.dataTable(['Quantity', 'Power in the formula', 'Scaled by', 'Effect on ' + sub(rel.Y.sym)], rel.vars.map(function(v){ return [sub(v.sym) + ' (' + v.name + ')', v.p === 0.5 ? '½' : v.p === -0.5 ? '−½' : String(v.p).replace('-', '−'), '× ' + nice(st.k[v.sym]), '× ' + nice(Math.pow(st.k[v.sym], v.p))]; }).concat([['<b>' + sub(rel.Y.sym) + '</b>', '', '', '<b>× ' + nice(f) + '</b>']]), rel.formula.replace(/_([A-Za-z]+)/g, '<sub>$1</sub>'));
      if(LS){ LS.pills([{ k: rel.Y.sym.replace(/_([A-Za-z]+)/, '<sub>$1</sub>'), html: '× ' + nice(f), tone: f > 1 + 1e-9 ? 'accent' : f < 1 - 1e-9 ? 'warn' : 'ghost' }], 'left', 'explore'); LS.caption(hd, 'explore'); }
      if(hd !== lastHead){ lastHead = hd; say(hd.replace(/<[^>]+>/g, '')); }
    }
    function studio(pane, s){
      LS = s;
      T.studioPane(pane, s, { stage: [view], dock: [dock], why: [host.querySelector('.sd-say')], details: [] });
      s.detailsTitle('Formula & numbers');
      draw();
      if(s.mode() === 'explore'){ var r = s.root.querySelector('.sd-sl input[type=range]'); if(r) s.hint({ target: r, text: 'Drag to scale it', round: 999 }); }
    }
    setRel(st.rel);
    return { studio: studio, stop: function(){ if(loop) loop.stop(); loop = null; }, go: function(){ animate(); } };
  }

  /* --------------------------------------------------------------- quiz */
  var KINDS = [{ value: 'factor', label: 'One quantity scaled' }, { value: 'combo', label: 'Two changes at once' }, { value: 'units', label: 'Unit check' }, { value: 'convert', label: 'SI conversions' }];
  function quiz(host, data){
    T.drill(host, data, {
      slug: 'scaling-drills', noun: 'drill',
      generate: function(r, ctx, t){ return SD.generate(r, ctx, t); },
      types: KINDS, typeLabel: 'Kind of problem',
      title: function(p){ var k = KINDS.filter(function(x){ return x.value === p.type; })[0]; return k ? k.label : 'Scaling'; },
      extra: function(el, p){
        var v = p.values;
        if(p.type !== 'factor' && p.type !== 'combo'){ el.innerHTML = ''; return; }
        var rel = SD.REL[v.rel], k = {};
        rel.vars.forEach(function(x){ k[x.sym] = 1; });
        if(p.type === 'factor') k[v.v] = v.k; else { k[v.a] = v.ka; k[v.b] = v.kb; }
        // The picture and the bars show the change; the result's bar is a "?" until the end.
        hideY = true;
        var svg = pic(rel, k, 0, rel.vars.reduce(function(a, x){ return a * Math.pow(k[x.sym], x.p); }, 1));
        hideY = false;
        if(svg && rel.pic !== 'square' && rel.pic !== 'circle' && rel.pic !== 'cube') svg = '';
        el.innerHTML = '<figure class="sd-fig cd-fig">' + (svg ? svg.replace(/aria-label="[^"]*"/, 'aria-label="Before and after for ' + esc(rel.say) + '. The result is for you to find."') : '') + bars(rel, k, null) + '</figure>';
      }
    });
  }
})();
