/* Biogeochemical cycles trainer page (docs/apenv-spec.md section 6). OWNED BY
   THIS TOOL ONLY (builder T2). Mounts into #app with ApEnvTools.mount; the
   model is ApEnvMath.cycles (environmental-science/assets/tools/math/cycles.js),
   the content environmental-science/data/tools/cycles.json (served filtered as
   assets/tool-data/cycles.json).

   Job: see where an element is stored, what moves it, and what people change.

   Explore (Tool Studio): one illustrated landscape (sky, land with soil and
   rock under it, the ocean) holds the cycle's reservoirs as cards with their
   amounts; arrows are its processes, their widths from the model's flows,
   with particles travelling along them. Tap a process (on the picture or in
   the dock's row) to light it up and read what moves where and who does it;
   the nitrogen processes carry their exam order 1 to 5. Switch on a human
   change (burn fossil fuels, add fertilizer, pave land...) and the years run
   forward: the cards show each reservoir's change (ApEnvMath.cycles.simulate).
   Dock: the cycle, its processes, the human changes. More options: the
   years since the change. Reduced motion: no particles; the years jump.

   Test yourself: ApEnvTools.drill over the model's kinds (name the process,
   the nitrogen order, reservoirs, human changes, the carbon budget in GtC and
   ppm, residence time); each figure is the same landscape. */
(function(){
  'use strict';
  var T = window.ApEnvTools, M = window.ApEnvMath;
  if(!T || !M || !M.cycles) return;
  var CY = M.cycles, esc = T.esc, SLUG = 'cycles';

  /* ------------------------------------------------------- numbers */
  function grp(x){ var s = String(x).split('.'); s[0] = s[0].replace(/\B(?=(\d{3})+(?!\d))/g, ','); return s.join('.'); }
  function amt(v){
    var a = Math.abs(v);
    if(a >= 1e6) return M.fmt(v / 1e6, 3) + ' million';
    if(a >= 100) return grp(Math.round(v));
    return M.fmt(v, 3);
  }
  function amountText(Y, r, v){
    if(Y.relative) return null;
    return amt(v) + ' ' + Y.unit;
  }
  function deltaText(Y, r, v){
    var d = v - r.amount;
    if(Math.abs(d) < (Y.relative ? 0.5 : Math.max(0.05, r.amount * 0.002))) return '';
    if(Y.relative) return (d > 0 ? '▲ +' : '▼ ') + M.fmt(d, 2) + '%';
    return (d > 0 ? '▲ +' : '▼ ') + amt(d).replace('-', '−');
  }
  function cap(s){ return s.charAt(0).toUpperCase() + s.slice(1); }

  /* ------------------------------------------------------- the scene
     One landscape for every cycle: sky (0 to 0.42), land on the left with
     its soil band and a rock layer under everything, the sea on the right.
     Fixed illustration colours (sky, grass, soil, water), each with a dark
     theme twin through CSS classes. */
  function tree(x, y, s, dark){
    return '<g class="cy-tree" transform="translate(' + x.toFixed(1) + ' ' + y.toFixed(1) + ') scale(' + s + ')">' +
      '<path d="M-3 0 L-2.4 -22 L2.4 -22 L3 0Z" class="cy-trunk"/><path d="M0 -24 L-6 -30 M0 -20 L6 -27" class="cy-trunk-l"/>' +
      '<circle cx="-8" cy="-30" r="10" class="cy-leaf' + (dark ? ' d' : '') + '"/><circle cx="8" cy="-31" r="10" class="cy-leaf' + (dark ? ' d' : '') + '"/><circle cx="0" cy="-40" r="12" class="cy-leaf l"/></g>';
  }
  function pine(x, y, s){ return '<g transform="translate(' + x.toFixed(1) + ' ' + y.toFixed(1) + ') scale(' + s + ')"><path d="M-2 0 V-8 H2 V0Z" class="cy-trunk"/><path d="M0 -40 L-11 -18 H-5 L-13 -6 H13 L5 -18 H11Z" class="cy-leaf d"/></g>'; }
  function cloud(x, y, s, cls){ return '<g transform="translate(' + x.toFixed(1) + ' ' + y.toFixed(1) + ') scale(' + s + ')" class="' + (cls || 'cy-cloud') + '"><ellipse cx="0" cy="0" rx="26" ry="11"/><circle cx="-11" cy="-6" r="11"/><circle cx="7" cy="-10" r="14"/><circle cx="21" cy="-3" r="9"/></g>'; }
  function factory(x, y, s){
    return '<g transform="translate(' + x.toFixed(1) + ' ' + y.toFixed(1) + ') scale(' + s + ')"><path d="M-22 0 V-16 L-12 -22 V-16 L-2 -22 V-16 L8 -22 V0Z" class="cy-bldg"/><rect x="10" y="-38" width="7" height="38" class="cy-bldg d"/><rect x="-18" y="-10" width="5" height="5" class="cy-win"/><rect x="-8" y="-10" width="5" height="5" class="cy-win"/>' +
      '<g class="cy-smoke"><circle cx="14" cy="-44" r="5"/><circle cx="20" cy="-52" r="7"/><circle cx="28" cy="-62" r="9"/></g></g>';
  }
  function scene(cy, W, H, on){
    var sea = H * 0.47, landX = W * 0.62, soilB = H * 0.74, rockT = H * 0.8, out = [];
    out.push('<rect class="cy-sky" x="0" y="0" width="' + W + '" height="' + (sea + 4) + '"/>');
    // sun
    var sx = W * 0.86, sy = H * 0.1, sr = Math.min(W, H) * 0.045;
    out.push('<g class="cy-sun">' + [0, 45, 90, 135, 180, 225, 270, 315].map(function(a){ var r = a * Math.PI / 180; return '<path d="M' + (sx + Math.cos(r) * sr * 1.35).toFixed(1) + ' ' + (sy + Math.sin(r) * sr * 1.35).toFixed(1) + ' L' + (sx + Math.cos(r) * sr * 1.8).toFixed(1) + ' ' + (sy + Math.sin(r) * sr * 1.8).toFixed(1) + '"/>'; }).join('') + '<circle cx="' + sx + '" cy="' + sy + '" r="' + sr.toFixed(1) + '"/></g>');
    out.push(cloud(W * 0.24, H * 0.1, W / 900) + cloud(W * 0.66, H * 0.16, W / 1100));
    // rock layer under everything, with strata
    out.push('<rect class="cy-rock" x="0" y="' + rockT.toFixed(1) + '" width="' + W + '" height="' + (H - rockT).toFixed(1) + '"/>');
    for(var i = 1; i < 4; i++) out.push('<path class="cy-strata" d="M0 ' + (rockT + (H - rockT) * i / 4).toFixed(1) + ' Q' + (W * 0.3) + ' ' + (rockT + (H - rockT) * i / 4 - 6).toFixed(1) + ' ' + (W * 0.6) + ' ' + (rockT + (H - rockT) * i / 4 + 3).toFixed(1) + ' T' + W + ' ' + (rockT + (H - rockT) * i / 4).toFixed(1) + '"/>');
    // ocean: water from sea level to the rock, a sloping sea floor
    out.push('<path class="cy-sea" d="M' + (landX - W * 0.04).toFixed(1) + ' ' + sea.toFixed(1) + ' L' + W + ' ' + sea.toFixed(1) + ' L' + W + ' ' + rockT.toFixed(1) + ' L' + (landX + W * 0.08).toFixed(1) + ' ' + rockT.toFixed(1) + ' Z"/>');
    out.push('<path class="cy-wave" d="' + (function(){ var d = '', n = 7, x0 = landX + W * 0.02, w = (W - x0) / n; for(var k = 0; k < n; k++) d += 'M' + (x0 + k * w).toFixed(1) + ' ' + (sea + 8).toFixed(1) + ' q' + (w / 4).toFixed(1) + ' -5 ' + (w / 2).toFixed(1) + ' 0 t' + (w / 2).toFixed(1) + ' 0 '; return d; })() + '"/>');
    // land: a hill surface, soil band below it
    var surf = 'M0 ' + (sea - H * 0.05).toFixed(1) + ' C' + (W * 0.12) + ' ' + (sea - H * 0.11).toFixed(1) + ' ' + (W * 0.3) + ' ' + (sea - H * 0.02).toFixed(1) + ' ' + (W * 0.42) + ' ' + (sea - H * 0.04).toFixed(1) + ' S' + (landX - W * 0.05) + ' ' + (sea - H * 0.01).toFixed(1) + ' ' + (landX + W * 0.06).toFixed(1) + ' ' + (sea + 3).toFixed(1);
    out.push('<path class="cy-soil" d="' + surf + ' L' + (landX + W * 0.08).toFixed(1) + ' ' + rockT.toFixed(1) + ' L0 ' + rockT.toFixed(1) + 'Z"/>');
    out.push('<path class="cy-grass" d="' + surf + ' L' + (landX + W * 0.06).toFixed(1) + ' ' + (sea + 9).toFixed(1) + ' C' + (landX - W * 0.05) + ' ' + (sea + 6).toFixed(1) + ' ' + (W * 0.3) + ' ' + (sea + 4).toFixed(1) + ' 0 ' + (sea + 2 - H * 0.05).toFixed(1) + 'Z"/>');
    // roots in the soil
    out.push('<path class="cy-root" d="M' + (W * 0.1) + ' ' + (sea - H * 0.03).toFixed(1) + ' q-6 20 4 34 M' + (W * 0.1) + ' ' + (sea - H * 0.03).toFixed(1) + ' q10 16 2 30 M' + (W * 0.31) + ' ' + (sea - H * 0.01).toFixed(1) + ' q-8 18 2 30"/>');
    // per cycle decorations
    var s = W / 820;
    if(cy === 'carbon'){
      out.push(tree(W * 0.08, sea - H * 0.06, 1.25 * s) + tree(W * 0.3, sea - H * 0.02, 1.05 * s, true) + pine(W * 0.38, sea - H * 0.03, 1.1 * s));
      if(on.fuel || on.forest || true) out.push(factory(W * 0.5, sea - H * 0.02, 1.15 * s));
      // coal and oil seams
      out.push('<path class="cy-coal" d="M' + (W * 0.22) + ' ' + (rockT + 8) + ' h' + (W * 0.24) + ' l-8 10 h' + (-W * 0.22) + 'Z"/><ellipse class="cy-oil" cx="' + (W * 0.47) + '" cy="' + (H * 0.93) + '" rx="' + (W * 0.06) + '" ry="' + (H * 0.025) + '"/>');
      // shells on the sea floor (limestone)
      for(var k = 0; k < 5; k++) out.push('<path class="cy-shell" d="M' + (W * (0.72 + k * 0.05)).toFixed(1) + ' ' + (rockT - 1) + ' a5 5 0 0 1 10 0Z"/>');
      if(on.forest) out.push('<g class="cy-stump"><rect x="' + (W * 0.2) + '" y="' + (sea - H * 0.06) + '" width="' + (8 * s) + '" height="' + (8 * s) + '"/><rect x="' + (W * 0.25) + '" y="' + (sea - H * 0.05) + '" width="' + (8 * s) + '" height="' + (7 * s) + '"/></g>');
      if(on.trees) out.push(tree(W * 0.22, sea - H * 0.045, 0.7 * s) + tree(W * 0.255, sea - H * 0.04, 0.6 * s));
    } else if(cy === 'nitrogen'){
      out.push(tree(W * 0.08, sea - H * 0.06, 1.1 * s));
      // a legume with nodules
      var lx = W * 0.26, ly = sea - H * 0.035;
      out.push('<g class="cy-legume"><path d="M' + lx + ' ' + ly + ' v-' + (34 * s) + '" class="cy-stem"/>' + [0, 1, 2].map(function(j){ return '<ellipse cx="' + (lx + (j % 2 ? 9 : -9) * s) + '" cy="' + (ly - (12 + j * 9) * s) + '" rx="' + (8 * s) + '" ry="' + (4 * s) + '" class="cy-leaf"/>'; }).join('') +
        '<path d="M' + lx + ' ' + ly + ' q-10 18 -2 34 M' + lx + ' ' + ly + ' q12 14 6 30" class="cy-root"/>' + [[-6, 14], [3, 24], [8, 12], [-3, 28]].map(function(n){ return '<circle cx="' + (lx + n[0] * s) + '" cy="' + (ly + n[1] * s) + '" r="' + (3.2 * s) + '" class="cy-nodule"/>'; }).join('') + '</g>');
      // a field of crops and a fertilizer bag when on
      for(var c = 0; c < 6; c++) out.push('<path class="cy-crop" d="M' + (W * (0.36 + c * 0.03)).toFixed(1) + ' ' + (sea - H * 0.03).toFixed(1) + ' v-' + (16 * s) + ' m0 4 l-5 -5 m5 9 l5 -5"/>');
      if(on.fert) out.push('<g transform="translate(' + (W * 0.55) + ' ' + (sea - H * 0.03) + ') scale(' + s + ')"><path d="M-10 0 L-12 -26 Q0 -30 12 -26 L10 0Z" class="cy-bag"/><text x="0" y="-9" text-anchor="middle" class="cy-bag-t">N</text></g>');
      // lightning
      out.push('<path class="cy-bolt" d="M' + (W * 0.66) + ' ' + (H * 0.18) + ' l-10 22 h9 l-8 22 l20 -28 h-9 l8 -16z"/>');
      if(on.flood) out.push('<path class="cy-puddle" d="M' + (W * 0.36) + ' ' + (sea - H * 0.015) + ' q' + (W * 0.08) + ' 8 ' + (W * 0.16) + ' 0 z"/>');
    } else if(cy === 'phosphorus'){
      out.push(tree(W * 0.08, sea - H * 0.06, 1.1 * s) + tree(W * 0.34, sea - H * 0.03, 0.9 * s, true));
      // a rock outcrop weathering
      out.push('<path class="cy-outcrop" d="M' + (W * 0.44) + ' ' + (sea - H * 0.02) + ' l' + (14 * s) + ' -' + (30 * s) + ' l' + (12 * s) + ' ' + (8 * s) + ' l' + (16 * s) + ' -' + (12 * s) + ' l' + (14 * s) + ' ' + (34 * s) + 'z"/>');
      // a cow (animals hold phosphorus in bones)
      out.push('<g transform="translate(' + (W * 0.22) + ' ' + (sea - H * 0.045) + ') scale(' + (0.9 * s) + ')"><ellipse cx="0" cy="-12" rx="16" ry="9" class="cy-cow"/><circle cx="18" cy="-16" r="6" class="cy-cow"/><path d="M-10 -4 v8 M-4 -4 v8 M6 -4 v8 M12 -4 v8" class="cy-cow-l"/><circle cx="-4" cy="-14" r="3.5" class="cy-cow-s"/><circle cx="6" cy="-9" r="2.8" class="cy-cow-s"/></g>');
      if(on.mine) out.push('<g transform="translate(' + (W * 0.12) + ' ' + (rockT - 4) + ') scale(' + s + ')"><path d="M-14 0 L0 -18 L14 0Z" class="cy-mine"/><text x="0" y="-4" text-anchor="middle" class="cy-bag-t">P</text></g>');
      if(on.sewage) out.push('<g transform="translate(' + (W * 0.56) + ' ' + (sea - H * 0.01) + ') scale(' + s + ')"><rect x="-10" y="-10" width="20" height="8" rx="4" class="cy-pipe"/></g>');
      if(on.erode) out.push('<path class="cy-mud" d="M' + (W * 0.5) + ' ' + (sea - 2) + ' q' + (W * 0.1) + ' 14 ' + (W * 0.22) + ' 10"/>');
    } else {
      // water: snowy mountain with a glacier, a lake, a well
      var mx = W * 0.14, my = sea - H * 0.05;
      out.push('<path class="cy-mtn" d="M' + (mx - 70 * s) + ' ' + my + ' L' + mx + ' ' + (my - 120 * s) + ' L' + (mx + 80 * s) + ' ' + my + 'Z"/><path class="cy-snow" d="M' + (mx - 26 * s) + ' ' + (my - 76 * s) + ' L' + mx + ' ' + (my - 120 * s) + ' L' + (mx + 30 * s) + ' ' + (my - 74 * s) + ' l-12 8 l-10 -8 l-10 10 z"/>');
      out.push('<ellipse class="cy-lake" cx="' + (W * 0.47) + '" cy="' + (sea - H * 0.02) + '" rx="' + (W * 0.07) + '" ry="' + (H * 0.018) + '"/>');
      out.push(tree(W * 0.3, sea - H * 0.025, 0.9 * s, true) + pine(W * 0.35, sea - H * 0.03, s));
      // aquifer: a lens of water-filled rock
      out.push('<path class="cy-aquifer" d="M' + (W * 0.06) + ' ' + (H * 0.84) + ' Q' + (W * 0.3) + ' ' + (H * 0.8) + ' ' + (W * 0.6) + ' ' + (H * 0.85) + ' Q' + (W * 0.32) + ' ' + (H * 0.97) + ' ' + (W * 0.06) + ' ' + (H * 0.84) + 'Z"/>');
      if(on.pump) out.push('<path class="cy-well" d="M' + (W * 0.24) + ' ' + (sea - H * 0.03) + ' V' + (H * 0.86) + '"/><rect class="cy-bldg" x="' + (W * 0.24 - 6) + '" y="' + (sea - H * 0.03 - 10) + '" width="12" height="10"/>');
      if(on.pave) out.push('<rect class="cy-pave" x="' + (W * 0.38) + '" y="' + (sea - H * 0.03) + '" width="' + (W * 0.2) + '" height="' + (5 * s) + '"/>' + '<rect class="cy-bldg" x="' + (W * 0.4) + '" y="' + (sea - H * 0.03 - 26 * s) + '" width="' + (14 * s) + '" height="' + (26 * s) + '"/><rect class="cy-bldg d" x="' + (W * 0.43) + '" y="' + (sea - H * 0.03 - 38 * s) + '" width="' + (12 * s) + '" height="' + (38 * s) + '"/>');
      // rain from a cloud over the land
      out.push(cloud(W * 0.3, H * 0.2, W / 900, 'cy-cloud rain') + '<path class="cy-rain" d="' + [0, 1, 2, 3, 4].map(function(j){ return 'M' + (W * 0.27 + j * 8 * s) + ' ' + (H * 0.24) + ' l-4 12'; }).join(' ') + '"/>');
    }
    return out.join('');
  }

  /* ------------------------------------------ reservoirs and arrows */
  function cardSize(phone){ return phone ? { w: 116, h: 46 } : { w: 150, h: 50 }; }
  /* Per-process bends (in units of the base bend; the sign picks the side)
     and where the label sits along the arrow, so arrows between the same
     two reservoirs separate and no label sits on another. */
  var BEND = {
    carbon: { photo: 1.6, resp: 1.6, uptake: 1.4, release: 1.4, volcano: -3.2, sediment: 0.4, burial: 0.4, death: 0.6, decomp: 0.9, burn: -1.6, clear: -2.4, plant: 2.6 },
    nitrogen: { fix: -1.2, light: 1.6, haber: 3.2, denit: 1.4, wdenit: -1.8, nitr: 0.8, assim: 1.2, waste: 0.8, ammon: -0.9, leach: 0.8 },
    phosphorus: { weather: 1, assim: 1.4, decomp: 1.4, runoff: 0.8, sediment: 0.6, uplift: 1.2, mine: -1.8, sewage: -1.2 },
    water: { evap: 1.3, oprecip: 1.3, lprecip: -1.2, et: -1.3, runoff: 0.8, infil: 0.8, seep: -1, rivers: 0.9, melt: 2.2, pump: 1.2 }
  };
  var LABEL_T = { carbon: { photo: 0.38, resp: 0.38, uptake: 0.36, release: 0.36, volcano: 0.3 }, water: { evap: 0.36, oprecip: 0.36, et: 0.5 }, nitrogen: { light: 0.62 }, phosphorus: { assim: 0.4, decomp: 0.4 } };
  function layout(cy, W, H){
    var Y = CY.CYCLES[cy], phone = W < 600, cs = cardSize(phone), pos = {};
    Y.reservoirs.forEach(function(r){
      var x = r.at[0] * W, y = r.at[1] * H;
      x = Math.max(cs.w / 2 + 6, Math.min(W - cs.w / 2 - 6, x));
      y = Math.max(cs.h / 2 + 6, Math.min(H - cs.h / 2 - 6, y));
      pos[r.id] = { x: x, y: y, w: cs.w, h: cs.h };
    });
    return pos;
  }
  function outside(p, b, pad){ return Math.abs(p[0] - b.x) > b.w / 2 + pad || Math.abs(p[1] - b.y) > b.h / 2 + pad; }
  function curve(a, b, bend){
    var dx = b.x - a.x, dy = b.y - a.y, L = Math.sqrt(dx * dx + dy * dy) || 1;
    var cx = (a.x + b.x) / 2 - dy / L * bend, cy = (a.y + b.y) / 2 + dx / L * bend;
    function at(t){ var u = 1 - t; return [u * u * a.x + 2 * u * t * cx + t * t * b.x, u * u * a.y + 2 * u * t * cy + t * t * b.y]; }
    var t0 = 0, t1 = 1;
    for(var t = 0; t <= 1; t += 0.01) if(outside(at(t), a, 5)){ t0 = t; break; }
    for(t = 1; t >= 0; t -= 0.01) if(outside(at(t), b, 9)){ t1 = t; break; }
    return { at: function(s){ return at(t0 + (t1 - t0) * s); }, t0: t0, t1: t1, c: [cx, cy] };
  }
  function pathD(cv){ var p = [], n = 24; for(var i = 0; i <= n; i++){ var q = cv.at(i / n); p.push((i ? 'L' : 'M') + q[0].toFixed(1) + ' ' + q[1].toFixed(1)); } return p.join(''); }
  function widthOf(f, phone){ if(!(f > 0)) return phone ? 2 : 2.5; return Math.max(phone ? 2 : 2.5, Math.min(phone ? 8 : 11, (phone ? 1.6 : 2) * Math.log10(f * 10 + 1) + 1)); }

  function draw(cy, o){
    var Y = CY.CYCLES[cy], W = o.W, H = o.H, phone = W < 600, pos = layout(cy, W, H), out = [], on = o.on || {}, pools = o.pools || {}, flux = o.flux || {};
    out.push(scene(cy, W, H, on));
    // arrows
    var cvs = {};
    var procs = Y.processes.filter(function(p){ return !p.human || isOn(Y, on, p.id); });
    procs.forEach(function(p){
      var a = pos[p.from], b = pos[p.to];
      var bend = (phone ? 24 : 30) * ((BEND[cy] || {})[p.id] || 1);
      var cv = curve(a, b, bend); cvs[p.id] = cv;
      var f = flux[p.id] != null ? flux[p.id] : p.flux, sel = o.sel === p.id, dim = o.sel && !sel;
      out.push('<path class="cy-arrow' + (p.human ? ' human' : '') + (p.slow ? ' slow' : '') + (sel ? ' is-sel' : '') + (dim ? ' is-dim' : '') + (o.ask === p.id ? ' is-ask' : '') + '" d="' + pathD(cv) + '" stroke-width="' + widthOf(f, phone).toFixed(1) + '" marker-end="url(#' + o.mk + (p.human ? '-h' : sel || o.ask === p.id ? '-s' : '') + ')"/>');
    });
    // labels on the arrows: the name on desktop, a number badge on a phone
    // (or the nitrogen order); the selected process always by name
    procs.forEach(function(p, i){
      var cv = cvs[p.id], m = cv.at((LABEL_T[cy] || {})[p.id] || 0.5), sel = o.sel === p.id, dim = o.sel && !sel, ask = o.ask === p.id;
      var label = ask && o.hideName ? '?' : p.n ? p.n + '. ' + p.name : p.name;
      if(o.hideLabels && !sel && !ask) return;
      if(phone && !sel && !ask){ label = p.n ? String(p.n) : String(i + 1); }
      var fs = phone ? 11.5 : 12.5, tw = label.length * fs * 0.56 + 12, th = fs + 9;
      out.push('<g class="cy-plabel' + (sel ? ' is-sel' : '') + (dim ? ' is-dim' : '') + (p.human ? ' human' : '') + (ask ? ' is-ask' : '') + '" data-p="' + p.id + '"' + (o.interactive ? ' role="button" tabindex="0" aria-pressed="' + sel + '" aria-label="' + esc(p.name + ': ' + rName(cy, p.from) + ' to ' + rName(cy, p.to)) + '"' : '') + '>' +
        '<rect x="' + (m[0] - tw / 2).toFixed(1) + '" y="' + (m[1] - th / 2).toFixed(1) + '" width="' + tw.toFixed(1) + '" height="' + th + '" rx="' + (th / 2) + '"/>' +
        '<text x="' + m[0].toFixed(1) + '" y="' + (m[1] + fs * 0.36).toFixed(1) + '" text-anchor="middle">' + esc(label) + '</text></g>');
    });
    // reservoir cards
    Y.reservoirs.forEach(function(r){
      var b = pos[r.id], v = pools[r.id] != null ? pools[r.id] : r.amount, d = deltaText(Y, r, v), at = amountText(Y, r, v);
      var hl = o.sel && (Y.processes.filter(function(p){ return p.id === o.sel; })[0] || {});
      var role = hl && (hl.from === r.id ? ' is-from' : hl.to === r.id ? ' is-to' : '');
      var fsN = phone ? 12.5 : 14, fsA = phone ? 11 : 12.5;
      out.push('<g class="cy-res' + (role || '') + '" data-r="' + r.id + '">' +
        '<rect class="cy-card" x="' + (b.x - b.w / 2).toFixed(1) + '" y="' + (b.y - b.h / 2).toFixed(1) + '" width="' + b.w + '" height="' + b.h + '" rx="10"/>' +
        '<text class="cy-res-n" x="' + b.x.toFixed(1) + '" y="' + (b.y - b.h / 2 + fsN + 5).toFixed(1) + '" text-anchor="middle">' + esc(r.name) + '</text>' +
        '<text class="cy-res-a" x="' + b.x.toFixed(1) + '" y="' + (b.y + b.h / 2 - 8).toFixed(1) + '" text-anchor="middle">' + (o.hideAmounts ? esc(r.what) : at ? esc(at) + (d ? ' <tspan class="cy-d ' + (/▲/.test(d) ? 'up' : 'dn') + '">' + esc(d) + '</tspan>' : '') : d ? '<tspan class="cy-d ' + (/▲/.test(d) ? 'up' : 'dn') + '">' + esc(d) + '</tspan>' : esc(r.what)) + '</text></g>');
    });
    return { svg: out.join(''), curves: cvs, pos: pos };
  }
  function isOn(Y, on, pid){ return Y.changes.some(function(c){ return on[c.id] && c.proc === pid; }); }
  function rName(cy, id){ return CY.res(cy, id).name.toLowerCase(); }
  function defs(mk){
    var m = function(id, cls){ return '<marker id="' + mk + id + '" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="3.6" markerHeight="3.6" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10z" class="' + cls + '"/></marker>'; };
    return '<defs>' + m('', 'cy-head') + m('-s', 'cy-head s') + m('-h', 'cy-head h') + '</defs>';
  }
  var mkN = 0;

  /* --------------------------------------------------------- mount */
  T.mount(SLUG, function(app, data){
    var ex = null;
    T.modes(app, { slug: SLUG,
      explore: function(host){ ex = explore(host, data); },
      quiz: function(host){ quiz(host, data); },
      onShow: function(m){ if(ex) ex.active(m === 'explore'); },
      studio: { explore: function(pane, s){ ex.studio(pane, s); } } });
  });

  /* ------------------------------------------------------- explore */
  function explore(host, data){
    var X = data.explore || {}, st = { cy: X.cycle || 'carbon', sel: null, on: {}, years: 0, target: X.years || 50 };
    var LS = null, touched = false, nid = T.nid('cy'), mk = 'cym' + (++mkN), live = true, sim = null, geo = null;
    function $(q){ return host.querySelector(q) || (LS ? LS.root.querySelector(q) : null); }
    function root(){ return LS ? LS.root : host; }
    host.innerHTML = '<section class="bt-problem cy-cardx" aria-labelledby="' + nid + '-h"><h2 id="' + nid + '-h" class="sr-only">Biogeochemical cycles</h2>' +
      '<div class="cy-fig"><svg class="cy-svg" xmlns="http://www.w3.org/2000/svg" role="group" aria-labelledby="' + nid + '-d"></svg><p class="sr-only" id="' + nid + '-d"></p></div>' +
      '<div class="cy-ctl">' +
        '<div class="cy-cycles ls-scroll" role="group" aria-label="Cycle">' + CY.CYCLE_IDS.map(function(id){ return '<button type="button" class="tchip cy-cy" data-c="' + id + '" aria-pressed="false">' + esc(CY.CYCLES[id].name.replace(' cycle', '')) + '</button>'; }).join('') + '</div>' +
        '<div class="cy-lbl ls-lbl">Tap a process</div><div class="cy-procs ls-scroll" role="group" aria-label="Processes"></div>' +
        '<div class="cy-lbl ls-lbl">What people change</div><div class="cy-changes ls-scroll" role="group" aria-label="Human changes"></div>' +
      '</div>' +
      '<div class="cy-say"></div>' +
      T.moreHtml('<div class="cy-years"></div><div class="bt-buttons"><button type="button" class="bt-btn cy-reset">Undo every change</button></div><p class="bt-small">The years run forward when you switch a change on. Carbon is in GtC (billion tonnes of carbon); nitrogen and phosphorus are relative amounts (each reservoir starts at 100%); water is in thousand km³.</p>', 'years, undo') +
      '<div class="cy-nums"></div><p class="sr-only cy-live" role="status" aria-live="polite"></p></section>';
    var say = T.announcer($('.cy-live'));
    var cue = T.cue('Tap a process to see what moves where.');
    $('.cy-ctl').insertBefore(cue.el, $('.cy-ctl').firstChild);
    function act(){ if(!touched){ touched = true; cue.done(); } }
    var yrs = T.slider({ label: 'Years since the change', min: 0, max: 100, step: 5, value: 0, unit: 'years', onInput: function(v){ stopRun(); st.years = v; st.target = v; act(); render(); } });
    $('.cy-years').appendChild(yrs.el);
    var svg = $('.cy-svg');

    function chips(){
      var Y = CY.CYCLES[st.cy];
      var procs = Y.processes.filter(function(p){ return !p.human; });
      if(st.cy === 'nitrogen') procs = procs.slice().sort(function(a, b){ return (a.n || 9) - (b.n || 9); });
      $('.cy-procs').innerHTML = procs.map(function(p){ return '<button type="button" class="tchip cy-p" data-p="' + p.id + '" aria-pressed="false">' + (p.n ? '<span class="cy-n">' + p.n + '</span> ' : '') + esc(p.name) + '</button>'; }).join('');
      $('.cy-changes').innerHTML = Y.changes.map(function(c){ return '<button type="button" class="tchip cy-c" data-ch="' + c.id + '" aria-pressed="false">' + esc(c.name) + '</button>'; }).join('');
    }
    function onClick(e){
      var b = e.target.closest('.cy-cy'); if(b){ var c = b.getAttribute('data-c'); if(c !== st.cy){ st.cy = c; st.sel = null; st.on = {}; st.years = 0; stopRun(); yrs.set(0); chips(); act(); render(true); } return; }
      b = e.target.closest('.cy-p'); if(b){ pickProc(b.getAttribute('data-p')); return; }
      b = e.target.closest('.cy-c'); if(b){ var id = b.getAttribute('data-ch'); st.on[id] = !st.on[id]; if(!st.on[id]) delete st.on[id]; act(); runYears(); return; }
      if(e.target.closest('.cy-reset')){ st.on = {}; stopRun(); st.years = 0; yrs.set(0); render(true); return; }
    }
    host.addEventListener('click', onClick);
    function pickProc(id){ act(); st.sel = st.sel === id ? null : id; render(true); }
    svg.addEventListener('click', function(e){ var g = e.target.closest('.cy-plabel'); if(g) pickProc(g.getAttribute('data-p')); });
    svg.addEventListener('keydown', function(e){ if(e.key === 'Enter' || e.key === ' '){ var g = e.target.closest('.cy-plabel'); if(g){ e.preventDefault(); pickProc(g.getAttribute('data-p')); var f = svg.querySelector('.cy-plabel[data-p="' + g.getAttribute('data-p') + '"]'); if(f) f.focus(); } } });

    var run = 0;
    function stopRun(){ if(run){ cancelAnimationFrame(run); run = 0; } }
    function runYears(){
      stopRun();
      var any = Object.keys(st.on).length;
      st.target = any ? Math.max(st.years, 50) : 0;
      if(!any){ st.years = 0; yrs.set(0); render(true); return; }
      if(T.reduced()){ st.years = st.target; yrs.set(st.years); render(true); return; }
      var y0 = st.years === st.target ? 0 : st.years, t0 = 0;
      function step(t){
        if(!t0) t0 = t;
        var u = Math.min(1, (t - t0) / 1600);
        st.years = Math.round(y0 + (st.target - y0) * (1 - Math.pow(1 - u, 2)));
        yrs.set(st.years); render(u >= 1);
        run = u < 1 ? requestAnimationFrame(step) : 0;
      }
      render(); run = requestAnimationFrame(step);
    }
    function size(){
      var r = svg.getBoundingClientRect(), w = r.width || 360, h = r.height || 420;
      var W = w < 600 ? 400 : 820, H = Math.round(Math.max(W * 0.6, Math.min(W * 1.5, W * h / w)));
      return { W: W, H: H };
    }
    function onIds(){ return Object.keys(st.on); }
    function words(){
      var Y = CY.CYCLES[st.cy], P = st.sel ? Y.processes.filter(function(p){ return p.id === st.sel; })[0] : null, head, why = '';
      var ids = onIds();
      if(P){
        head = (P.n ? P.n + '. ' : '') + P.name + ': ' + rName(st.cy, P.from) + ' → ' + rName(st.cy, P.to) + '.';
        why = '<p><b>' + esc(P.agent) + '</b> ' + esc(P.what) + '</p>' + (P.flux ? '<p class="bt-small">' + (Y.relative ? 'Relative flow ' + M.fmt(P.flux, 3) + ' (per 100 in its source).' : 'About ' + amt(P.flux) + ' ' + Y.funit + (P.slow ? ': a slow, geologic process.' : '.')) + '</p>' : '') +
          (st.cy === 'nitrogen' ? '<p class="bt-small">The order: 1 fixation, 2 nitrification, 3 assimilation, 4 ammonification, 5 denitrification.</p>' : '');
      } else if(ids.length){
        var sm = sim.pools[st.years], parts = [];
        Y.reservoirs.forEach(function(r){ var d = deltaText(Y, r, sm[r.id]); if(d) parts.push(r.name.toLowerCase() + ' ' + d.replace(/[▲▼] ?/, '')); });
        head = ids.map(function(id){ return Y.changes.filter(function(c){ return c.id === id; })[0].did; }).join(' and ') + ', after ' + st.years + ' years: ' + (parts.slice(0, 3).join(', ') || 'little change yet') + '.';
        why = effectWhy(st.cy, ids);
      } else {
        head = { carbon: 'Carbon moves between air, living things, soil, ocean and rock. Tap a process to see what moves where.', nitrogen: 'Bacteria do most of the nitrogen cycle\'s work. Tap the numbered processes in order, 1 to 5.', phosphorus: 'Phosphorus has no gas phase: it moves from rock to soil, life and water, slowly.', water: 'The sun drives the water cycle: evaporation, then precipitation, runoff and infiltration.' }[st.cy];
        why = '<p>' + { carbon: 'The fast cycle (photosynthesis, respiration, decomposition, ocean exchange) moves about 300 GtC a year in nearly balanced pairs. The slow cycle (burial into fossil fuels and limestone, volcanoes) takes millions of years. Burning fossil fuels moves slow-cycle carbon into the fast cycle in years.', nitrogen: 'N₂ is 78% of the air, but plants cannot use it. Nitrogen-fixing bacteria (and lightning, and fertilizer factories) turn it into ammonium; nitrifying bacteria turn that into nitrate; plants assimilate it; decomposers return it as ammonium; denitrifying bacteria return it to the air.', phosphorus: 'Weathering of rock releases phosphate slowly, so it often limits growth. Plants assimilate it for DNA and ATP; runoff carries it to water, where it settles into sediments that become rock again over millions of years.', water: 'The ocean holds about 97% of the water. Of the fresh water, most is ice and groundwater; lakes, rivers and the air hold very little at any moment, but it moves through them fast.' }[st.cy] + '</p>';
      }
      return { head: head, why: why };
    }
    function effectWhy(cy, ids){
      var t = { fuel: 'Fossil carbon, stored for millions of years, is released as CO₂ in a few years. About 45% stays in the air, about 25% dissolves in the ocean (acidifying it) and about 30% is taken up by land plants and soils.', forest: 'Clearing releases the trees\' carbon as CO₂ and removes a carbon sink.', trees: 'Growing trees take CO₂ out of the air by photosynthesis and store it in wood.',
        fert: 'Fertilizer adds fixed nitrogen faster than plants use it; the extra nitrate leaches into streams (eutrophication), and some leaves as N₂O, a greenhouse gas.', legume: 'Bacteria in legume root nodules fix more N₂, adding usable nitrogen to the soil.', flood: 'Waterlogged soil has little oxygen: denitrifying bacteria speed up and turn nitrate back into N₂, while nitrification (which needs oxygen) slows.',
        mine: 'Mining moves phosphate from rock to fields far faster than weathering; runoff carries the extra to lakes, where it feeds algal blooms.', erode: 'Bare soil erodes, and runoff carries soil phosphate into lakes and the ocean.', sewage: 'Wastewater carries phosphate straight into lakes and rivers, a common cause of algal blooms.',
        pave: 'Water cannot soak through pavement: runoff rises (flooding, polluted streams) and infiltration falls, so less recharges groundwater.', pump: 'Pumping takes groundwater out faster than infiltration refills it, so the aquifer shrinks and the water table falls.', warm: 'Warmer air holds more water, so evaporation and precipitation speed up; land ice melts into the ocean and raises sea level (melting sea ice would not).' };
      return '<ul class="cy-why-l">' + ids.map(function(id){ return '<li>' + esc(t[id] || '') + '</li>'; }).join('') + '</ul>';
    }
    function describe(){
      var Y = CY.CYCLES[st.cy], sm = sim.pools[st.years];
      return Y.name + '. Reservoirs: ' + Y.reservoirs.map(function(r){ var a = amountText(Y, r, sm[r.id]), d = deltaText(Y, r, sm[r.id]); return r.name + (a ? ' ' + a : '') + (d ? ' (' + d.replace('▲', 'up').replace('▼', 'down') + ')' : ''); }).join('; ') + '. Processes: ' +
        Y.processes.filter(function(p){ return !p.human || isOn(Y, st.on, p.id); }).map(function(p){ return p.name + ' from ' + rName(st.cy, p.from) + ' to ' + rName(st.cy, p.to); }).join('; ') + '.';
    }
    function nums(){
      var Y = CY.CYCLES[st.cy], sm = sim.pools[st.years];
      var rows = Y.reservoirs.map(function(r){ return [esc(r.name) + '<br><span class="bt-small">' + esc(r.what) + '</span>', Y.relative ? '100%' : esc(amt(r.amount)), Y.relative ? M.fmt(sm[r.id], 3) + '%' : esc(amt(sm[r.id]))]; });
      var prow = Y.processes.filter(function(p){ return !p.human || isOn(Y, st.on, p.id); }).map(function(p){ return [(p.n ? p.n + '. ' : '') + esc(p.name), esc(CY.res(st.cy, p.from).name) + ' → ' + esc(CY.res(st.cy, p.to).name), Y.relative ? M.fmt(sim.flux[p.id], 3) : esc(amt(sim.flux[p.id]))]; });
      var co2 = st.cy === 'carbon' ? '<p class="bt-small">Atmospheric CO₂: ' + M.fmt(sm.atm / CY.PPM, 3) + ' ppm (1 ppm = 2.12 GtC).</p>' : '';
      $('.cy-nums').innerHTML = '<h3 class="ls-title-l">Reservoirs</h3>' + T.dataTable(['Reservoir', 'At the start' + (Y.relative ? '' : ' (' + Y.unit + ')'), 'After ' + st.years + ' years'], rows, Y.name + ': reservoirs') + co2 +
        '<h3 class="ls-title-l">Processes</h3>' + T.dataTable(['Process', 'From → to', 'Flow' + (Y.relative ? ' (relative)' : ' (' + Y.funit + ')')], prow, Y.name + ': processes') +
        '<p class="bt-small">' + (st.cy === 'carbon' ? 'Amounts rounded from IPCC AR6 (2021) and the Global Carbon Project; the split of human emissions (45% air, 25% ocean, 30% land) is the recent average.' : st.cy === 'water' ? 'Amounts rounded from Trenberth et al. (2007).' : 'Relative amounts in a simple box model: each flow is proportional to the amount in its source, so a change spreads around the cycle.') + '</p>';
    }
    function render(announce){
      sim = CY.simulate(st.cy, onIds(), 100);
      var sz = size(), sm = sim.pools[st.years];
      geo = draw(st.cy, { W: sz.W, H: sz.H, on: st.on, sel: st.sel, pools: sm, flux: sim.flux, interactive: true, mk: mk });
      svg.setAttribute('viewBox', '0 0 ' + sz.W + ' ' + sz.H);
      svg.innerHTML = defs(mk) + geo.svg + '<g class="cy-fx" aria-hidden="true"></g>';
      root().querySelectorAll('.cy-cy').forEach(function(b){ b.setAttribute('aria-pressed', String(b.getAttribute('data-c') === st.cy)); });
      root().querySelectorAll('.cy-p').forEach(function(b){ b.setAttribute('aria-pressed', String(b.getAttribute('data-p') === st.sel)); });
      root().querySelectorAll('.cy-c').forEach(function(b){ b.setAttribute('aria-pressed', String(!!st.on[b.getAttribute('data-ch')])); });
      var w = words();
      T.explain($('.cy-say'), '<b>' + esc(w.head) + '</b>', w.why);
      $('#' + nid + '-d').textContent = describe();
      nums();
      if(LS){
        LS.caption('<b>' + esc(w.head) + '</b>', 'explore');
        var Y = CY.CYCLES[st.cy], pills = [];
        if(st.cy === 'carbon') pills.push({ k: 'CO₂', html: M.fmt(sm.atm / CY.PPM, 3) + ' ppm', tone: sm.atm > 871 ? 'warn' : 'readout' });
        else if(onIds().length) pills.push({ k: 'Years', html: String(st.years), tone: 'readout' });
        LS.pills(pills, 'left', 'explore');
        LS.pills(st.sel ? [{ k: 'Process', html: esc((Y.processes.filter(function(p){ return p.id === st.sel; })[0] || {}).name || ''), tone: 'accent' }] : [], 'right', 'explore');
        LS.root.querySelectorAll('.env-ls-why details.bt-why').forEach(function(d){ d.open = true; });
      }
      if(announce) say(w.head);
      kick();
    }

    /* particles along the arrows; rate from each flow */
    var raf = 0, dots = [], last = 0;
    function tick(t){
      raf = 0;
      var fx = svg.querySelector('.cy-fx');
      if(!live || document.hidden || T.reduced() || !fx || !geo){ if(fx) fx.innerHTML = ''; dots = []; return; }
      var dt = last ? Math.min(60, t - last) : 16; last = t;
      var Y = CY.CYCLES[st.cy];
      Y.processes.forEach(function(p){
        var cv = geo.curves[p.id]; if(!cv) return;
        var f = sim.flux[p.id] || 0, rate = st.sel ? (st.sel === p.id ? 0.006 : 0) : (Y.relative ? 0.00006 * f : 0.0009 * Math.log10(f * 10 + 1)) * (p.slow ? 0.25 : 1);
        if(p.human) rate = st.sel && st.sel !== p.id ? 0 : 0.004;
        if(Math.random() < rate * dt) dots.push({ p: p.id, s: 0, h: !!p.human });
      });
      dots = dots.filter(function(d){ d.s += dt / 1800; return d.s < 1 && geo.curves[d.p]; });
      fx.innerHTML = dots.map(function(d){ var q = geo.curves[d.p].at(d.s); return '<circle class="cy-dot ' + st.cy + (d.h ? ' h' : '') + '" cx="' + q[0].toFixed(1) + '" cy="' + q[1].toFixed(1) + '" r="' + (st.sel ? 4.2 : 3.2) + '"/>'; }).join('');
      raf = requestAnimationFrame(tick);
    }
    function kick(){ if(!raf && live && !T.reduced()) raf = requestAnimationFrame(tick); }

    function studio(pane, s){
      LS = s;
      T.studioPane(pane, s, { stage: [$('.cy-fig')], dock: [$('.cy-ctl')], why: [$('.cy-say')], details: [$('.cy-nums')], moreLabel: 'Years and undo' });
      s.root.addEventListener('click', onClick);
      host.removeEventListener('click', onClick);
      render();
      if(s.mode() === 'explore') s.hint({ target: s.root.querySelector('.cy-p') || svg, text: 'Start here: tap a process' });
      if(window.ResizeObserver){ var t = null; new ResizeObserver(function(){ clearTimeout(t); t = setTimeout(function(){ render(); }, 60); }).observe($('.cy-fig')); }
    }
    chips(); render();
    document.addEventListener('visibilitychange', kick);
    return { studio: studio, active: function(on){ live = on; if(on) kick(); } };
  }

  /* ------------------------------------------------------ test yourself */
  function quiz(host, data){
    T.drill(host, data, { slug: SLUG, noun: 'drill',
      generate: function(r, ctx, type){ return CY.generate(r, ctx, type); },
      types: [{ value: 'process', label: 'Name the process' }, { value: 'nitrogen', label: 'Nitrogen in order' }, { value: 'reservoir', label: 'Reservoirs' }, { value: 'human', label: 'Human changes' }, { value: 'budget', label: 'Carbon budget (GtC, ppm)' }, { value: 'residence', label: 'Residence time' }],
      typeLabel: 'Kind of problem',
      title: function(p){ return { process: 'Which process moves it?', nitrogen: 'Follow a nitrogen atom', reservoir: 'Where is it stored?', human: 'What people change', budget: 'The carbon budget', residence: 'How long does it stay?' }[p.type] || 'Practice problem'; },
      extra: function(el, p, api){ api.fig = el; figure(el, p, {}); },
      onStep: function(s, right, api){ api.done = api.done || {}; api.done[s.key] = true; figure(api.fig, api.problem, api.done); }
    });
  }
  function figure(el, p, done){
    var f = p.figure || {}, phone = (window.innerWidth || 1280) <= 640, W = phone ? 400 : 760, H = phone ? 480 : 470, cy = f.cycle || 'carbon', on = {};
    (f.changes || []).forEach(function(c){ on[c] = true; });
    var mk = 'cyq' + (++mkN);
    var o = { W: W, H: H, on: on, mk: mk, interactive: false };
    if(p.type === 'process'){ o.ask = f.ask; o.hideName = !(done && done.name); o.hideLabels = true; if(done && done.name) o.sel = f.ask; }
    if(p.type === 'nitrogen'){ var k = Object.keys(done || {}).length; var ids = CY.NORDER.slice(0, f.numbered + k); o.hideLabels = true; o.sel = ids[ids.length - 1]; }
    if(p.type === 'reservoir' || p.type === 'residence') o.hideLabels = true;
    if(p.type === 'budget'){ o.hideLabels = true; o.on = { fuel: true, forest: true }; }
    var g = draw(cy, o);
    var extra = '';
    if(p.type === 'budget'){
      var b = f.budget, x = W - (phone ? 150 : 210), y = phone ? 14 : 18, lh = phone ? 17 : 19;
      extra = '<g class="cy-ledger"><rect x="' + (x - 10) + '" y="' + (y - 4) + '" width="' + (phone ? 152 : 206) + '" height="' + (lh * 5 + 12) + '" rx="10"/>' +
        [['Sources (GtC)', '', 'h'], ['Fossil fuels', '+' + b.ff, 'src'], ['Forest clearing', '+' + b.luc, 'src'], ['Ocean', '−' + b.oc, 'snk'], ['Land plants, soil', '−' + b.ld, 'snk']].map(function(r, i){ return '<text class="cy-led ' + r[2] + '" x="' + x + '" y="' + (y + lh * (i + 0.8)) + '">' + esc(i ? r[0] : 'One year, in GtC') + '</text>' + (r[1] ? '<text class="cy-led ' + r[2] + '" x="' + (x + (phone ? 132 : 186)) + '" y="' + (y + lh * (i + 0.8)) + '" text-anchor="end">' + esc(r[1]) + '</text>' : ''); }).join('') + '</g>';
    }
    var label = CY.CYCLES[cy].name + (p.type === 'process' ? ', with one process marked by a question mark' : '');
    el.innerHTML = '<figure class="cy-qfig"><svg class="cy-svg" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(label) + '">' + defs(mk) + g.svg + extra + '</svg></figure>';
  }
})();
