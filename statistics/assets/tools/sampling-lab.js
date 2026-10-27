/* Sampling lab (simulator; docs/apstat-spec.md section 6). OWNED BY THIS TOOL
   ONLY. The model is ApStatMath.samplingLab (statistics/assets/tools/math/
   sampling-lab.js); the frame is ApStatTools.modes on the Tool Studio.

   Explore: an illustrated population (households on streets, plots in a
   field, students in classrooms) drawn in SVG from the model's fixed
   population. Pick one of six methods, draw a sample (the chosen units light
   up in selection order, with the random numbers, strata, clusters or the
   systematic start shown as a process strip) and its mean lands as a dot on
   a stacked dotplot of sample means, one row per method, against the
   population mean. "Draw 100" fills a row at once, so bias (a row centered
   off the line) and variability (a wide row) are seen, not told. Tap a unit
   to read its label and value. Colors: the population and its mean in the
   first series color, the current sample in the second, the sample means in
   the third.
   Test yourself: ApStatTools.drill over the model's generate(); a "Which
   kind of sample" problem shows its method on a small model of the setting
   once the method step is answered. */
(function(){
  'use strict';
  var T = window.ApStatTools, M = window.ApStatMath, P = window.ApStatPlot;
  if(!T || !M || !M.samplingLab) return;
  var S = M.samplingLab, esc = T.esc;
  var SCENE_FOR = { school: 'school', town: 'street', farm: 'field', factory: null, hospital: null };

  T.mount('sampling-lab', function(app, data){
    var ex = null;
    T.modes(app, { slug: 'sampling-lab',
      explore: function(host){ ex = explore(host, data); },
      quiz: function(host){ quiz(host, data); },
      onShow: function(m){ if(m !== 'explore' && ex) ex.stop(); },
      studio: { explore: function(pane, s){ ex.studio(pane, s); } } });
  });

  function fx(x, d){ return T.F(x, d == null ? 2 : d); }
  function hash(i, k){ var h = Math.imul(i + 1, 2654435761) ^ Math.imul(k + 7, 40503); h ^= h >>> 13; return Math.abs(h) % 997; }

  /* ------------------------------------------------------- the scene */
  /* layout(scene, pop) -> { W, H, at: [{ x, y, w, h }], bg, bands: { strata:
     [{ x, y, w, h, name }], clusters: [{ x, y, w, h, name }] } } in viewBox
     units, and units(scene, pop, o) draws every unit there. */
  function layout(sc, pop){
    var L = { at: [], strata: [], clusters: [] }, bg = [];
    if(sc.kind === 'houses'){
      var W = 1000, m = 16, cw = (W - 2 * m) / sc.cols, rh = 86, top = 40, split = sc.strata.groups[1].from, gapY = 34;
      var rowY = function(y){ return top + y * rh + (y >= split ? gapY : 0); };
      L.W = W; L.H = top + sc.rows * rh + gapY + 44;
      // hill above, river below; the side-of-town bands are the strata
      sc.strata.groups.forEach(function(g, k){
        var y0 = rowY(g.from) - (k ? gapY : top) + 4, y1 = k ? L.H - 30 : rowY(g.to) + rh - 2;
        L.strata.push({ x: 4, y: y0, w: W - 8, h: y1 - y0, name: g.name });
        bg.push('<rect class="sl-land sl-land-' + k + '" x="0" y="' + y0 + '" width="' + W + '" height="' + (y1 - y0 + 6) + '"/>');
      });
      bg.push('<path class="sl-river" d="M0 ' + (L.H - 30) + ' C 160 ' + (L.H - 44) + ', 320 ' + (L.H - 14) + ', 500 ' + (L.H - 30) + ' S 840 ' + (L.H - 44) + ', 1000 ' + (L.H - 28) + ' V ' + L.H + ' H 0 Z"/>');
      bg.push('<path class="sl-ripple" d="M60 ' + (L.H - 14) + ' q 20 -6 40 0 M300 ' + (L.H - 10) + ' q 20 -6 40 0 M620 ' + (L.H - 12) + ' q 20 -6 40 0 M860 ' + (L.H - 9) + ' q 20 -6 40 0"/>');
      for(var y = 0; y < sc.rows; y++){
        var ly = rowY(y) + 62;
        bg.push('<rect class="sl-lane" x="0" y="' + ly + '" width="' + W + '" height="16"/><text class="sl-lane-t" x="10" y="' + (ly + 12) + '" data-y="' + (ly + 12) + '" data-gy="' + (rowY(y) + 40) + '">' + esc(sc.clusters.names[y]) + '</text>');
        L.clusters.push({ x: 6, y: rowY(y) - 4, w: W - 12, h: rh - 4, name: sc.clusters.names[y] });
      }
      L.zones = [{ x: 14, y: 27, name: sc.strata.groups[0].name }, { x: 14, y: rowY(split) - 11, name: sc.strata.groups[1].name }];
      pop.units.forEach(function(u){ L.at.push({ x: m + u.col * cw, y: rowY(u.row), w: cw, h: 60 }); });
    } else if(sc.kind === 'plots'){
      var W2 = 1000, x0 = 78, x1 = 922, y0 = 44, cs = (x1 - x0) / sc.cols;
      L.W = W2; L.H = y0 + sc.rows * cs + 16;
      bg.push('<rect class="sl-grass" x="0" y="0" width="' + W2 + '" height="' + L.H + '"/>');
      bg.push('<rect class="sl-road" x="8" y="0" width="54" height="' + L.H + '"/><path class="sl-road-d" d="M35 6 V ' + (L.H - 6) + '"/><text class="sl-vert" transform="translate(28 ' + (L.H / 2) + ') rotate(-90)" text-anchor="middle">Farm road</text>');
      bg.push('<rect class="sl-canal" x="' + (x1 + 14) + '" y="0" width="56" height="' + L.H + '"/><path class="sl-ripple" d="' + [0.1, 0.26, 0.74, 0.9].map(function(f){ var yy = L.H * f; return 'M' + (x1 + 26) + ' ' + yy + ' q 8 -5 16 0 t 16 0'; }).join(' ') + '"/><text class="sl-vert" transform="translate(' + (x1 + 48) + ' ' + (L.H / 2) + ') rotate(90)" text-anchor="middle">Irrigation canal</text>');
      sc.strata.groups.forEach(function(g, k){
        var a = x0 + g.from * cs, b = x0 + (g.to + 1) * cs;
        L.strata.push({ x: a - 4, y: y0 - 8, w: b - a + 8, h: sc.rows * cs + 12, name: g.name });
        (L.zones = L.zones || []).push({ x: (a + b) / 2, y: 30, name: g.name, mid: true });
      });
      for(var ry = 0; ry < sc.rows; ry++) L.clusters.push({ x: x0 - 5, y: y0 + ry * cs - 5, w: x1 - x0 + 10, h: cs + 10, name: sc.clusters.names[ry] });
      pop.units.forEach(function(u){ L.at.push({ x: x0 + u.col * cs, y: y0 + u.row * cs, w: cs, h: cs }); });
    } else {
      var R = sc.clusters.rooms, W3 = 1000, mg = 14, gap = 12, rw = (W3 - 2 * mg - 3 * gap) / 4, rhh = 300, hall = 74, t0 = 22;
      L.W = W3; L.H = t0 + 2 * rhh + hall + 18;
      bg.push('<rect class="sl-floor" x="0" y="0" width="' + W3 + '" height="' + L.H + '"/>');
      var hy = t0 + rhh;
      bg.push('<rect class="sl-hall" x="0" y="' + hy + '" width="' + W3 + '" height="' + hall + '"/><text class="sl-hall-t" x="' + (W3 / 2) + '" y="' + (hy + hall / 2 + 6) + '" text-anchor="middle">Hallway</text>');
      bg.push('<rect class="sl-office" x="' + mg + '" y="' + (hy + 10) + '" width="150" height="' + (hall - 20) + '" rx="8"/><text class="sl-office-t" x="' + (mg + 75) + '" y="' + (hy + hall / 2 + 6) + '" text-anchor="middle">Main office</text>');
      for(var q = 0; q < R.count; q++){
        var col = q % 4, top2 = q < 4, rx = mg + col * (rw + gap), ry2 = top2 ? t0 : hy + hall;
        var doorX = rx + rw - 64, wallY = top2 ? ry2 + rhh : ry2;
        bg.push('<rect class="sl-room" x="' + rx + '" y="' + ry2 + '" width="' + rw + '" height="' + rhh + '" rx="6"/>');
        bg.push('<path class="sl-door" d="M' + doorX + ' ' + wallY + ' h 40"/>');
        var by = top2 ? ry2 + 16 : ry2 + rhh - 22;
        bg.push('<rect class="sl-board" x="' + (rx + 30) + '" y="' + by + '" width="' + (rw - 60) + '" height="7" rx="3"/>');
        var ty = top2 ? ry2 + 44 : ry2 + rhh - 34;
        bg.push('<text class="sl-room-t" x="' + (rx + 14) + '" y="' + ty + '">' + esc(sc.clusters.names[q]) + '</text><text class="sl-room-g" x="' + (rx + rw - 14) + '" y="' + ty + '" text-anchor="end">' + esc(sc.strata.groups[pop.units.filter(function(u){ return u.room === q; })[0].stratum].name) + '</text>' +
          '<text class="sl-room-g2" x="' + (rx + 14) + '" y="' + (top2 ? ty + 30 : ty - 34) + '">' + esc(sc.strata.groups[pop.units.filter(function(u){ return u.room === q; })[0].stratum].name) + '</text>');
        L.clusters.push({ x: rx - 4, y: ry2 - 4, w: rw + 8, h: rhh + 8, name: sc.clusters.names[q] });
        var sx = (rw - 20) / R.seatCols, sy = (rhh - 86) / R.seatRows, sy0 = top2 ? ry2 + 58 : ry2 + 12;
        for(var s2 = 0; s2 < R.seatRows * R.seatCols; s2++){
          L.at.push({ x: rx + 10 + (s2 % R.seatCols) * sx, y: sy0 + Math.floor(s2 / R.seatCols) * sy, w: sx, h: sy });
        }
      }
      // grade strata: the two rooms of each grade
      sc.strata.groups.forEach(function(g){
        var a = L.clusters[g.from], b = L.clusters[g.to];
        L.strata.push({ x: Math.min(a.x, b.x) - 2, y: Math.min(a.y, b.y) - 2, w: Math.max(a.x + a.w, b.x + b.w) - Math.min(a.x, b.x) + 4, h: Math.max(a.y + a.h, b.y + b.h) - Math.min(a.y, b.y) + 4, name: g.name });
      });
    }
    L.bg = bg.join('');
    return L;
  }
  /* The value scale (5 tones, light to strong) for "Show each value". */
  function tone(v, lo, hi){ return Math.max(0, Math.min(4, Math.floor((v - lo) / (hi - lo + 1e-9) * 5))); }
  function unitSvg(sc, u, a, o){
    var cls = 'sl-u' + (o.values ? ' sl-tone-' + tone(u.value, o.lo, o.hi) : '');
    var g = '<g class="' + cls + '" data-i="' + u.i + '">';
    if(sc.kind === 'houses'){
      var cx = a.x + a.w / 2, base = a.y + 58, w = 76, h = 36, rf = hash(u.i, 1) % 4, wl = hash(u.i, 2) % 3, big = u.stratum === 0;
      if(big){ w = 80; h = 38; }
      var l = cx - w / 2;
      if(hash(u.i, 3) % 3 === 0) g += '<circle class="sl-bush" cx="' + (l - 3) + '" cy="' + (base - 7) + '" r="8"/>';
      g += '<rect class="sl-wall sl-wall-' + wl + '" x="' + l + '" y="' + (base - h) + '" width="' + w + '" height="' + h + '"/>' +
        '<path class="sl-roof sl-roof-' + rf + '" d="M' + (l - 6) + ' ' + (base - h + 1) + ' L' + cx + ' ' + (base - h - 20) + ' L' + (l + w + 6) + ' ' + (base - h + 1) + ' Z"/>' +
        '<rect class="sl-win" x="' + (l + 8) + '" y="' + (base - h + 8) + '" width="13" height="12" rx="1.5"/><rect class="sl-win" x="' + (l + w - 21) + '" y="' + (base - h + 8) + '" width="13" height="12" rx="1.5"/>' +
        '<rect class="sl-doorx" x="' + (cx - 7) + '" y="' + (base - 19) + '" width="14" height="19" rx="1.5"/>' +
        (big && hash(u.i, 4) % 2 ? '<rect class="sl-chim" x="' + (l + w - 16) + '" y="' + (base - h - 18) + '" width="8" height="14"/>' : '') +
        '<rect class="sl-hit" x="' + a.x + '" y="' + (a.y - 4) + '" width="' + a.w + '" height="' + (a.h + 4) + '"/>' +
        '<text class="sl-lab" x="' + (l + w + 3) + '" y="' + (base - 2) + '">' + u.label + '</text>';
    } else if(sc.kind === 'plots'){
      var pad = 3, x = a.x + pad, y = a.y + pad, s = a.w - 2 * pad, zone = u.stratum;
      g += '<rect class="sl-soil sl-soil-' + zone + '" x="' + x + '" y="' + y + '" width="' + s + '" height="' + s + '" rx="4"/>';
      var plants = '';
      for(var rr = 0; rr < 3; rr++){
        var py = y + s * (0.22 + rr * 0.28);
        plants += '<path class="sl-furrow" d="M' + (x + 6) + ' ' + (py + 7) + ' H ' + (x + s - 6) + '"/>';
        for(var cc = 0; cc < 4; cc++){
          var px = x + s * (0.17 + cc * 0.22), big2 = zone === 1 ? 7.4 : 6.2;
          plants += '<circle class="sl-leaf" cx="' + px.toFixed(1) + '" cy="' + py.toFixed(1) + '" r="' + big2 + '"/>' + ((cc + rr + u.i) % 2 ? '<circle class="sl-fruit" cx="' + (px + 3).toFixed(1) + '" cy="' + (py + 2).toFixed(1) + '" r="2.4"/>' : '');
        }
      }
      g += plants + '<rect class="sl-hit" x="' + a.x + '" y="' + a.y + '" width="' + a.w + '" height="' + a.h + '"/><text class="sl-lab sl-lab-plot" x="' + (x + 5) + '" y="' + (y + 13) + '">' + u.label + '</text>';
    } else {
      var cx2 = a.x + a.w / 2, base = a.y + a.h * 0.74, skin = hash(u.i, 5) % 4, hair = hash(u.i, 6) % 4, hy = base - 27;
      // a student at a desk, seen from the front: shoulders, head, hair, desk
      g += '<path class="sl-shirt sl-shirt-' + (hash(u.i, 7) % 4) + '" d="M' + (cx2 - 17) + ' ' + base + ' Q ' + (cx2 - 17) + ' ' + (base - 19) + ' ' + cx2 + ' ' + (base - 19) + ' Q ' + (cx2 + 17) + ' ' + (base - 19) + ' ' + (cx2 + 17) + ' ' + base + ' Z"/>' +
        '<circle class="sl-skin sl-skin-' + skin + '" cx="' + cx2 + '" cy="' + hy + '" r="10"/>' +
        '<path class="sl-hair sl-hair-' + hair + '" d="M' + (cx2 - 10.6) + ' ' + (hy + 1) + ' A 10.6 10.6 0 0 1 ' + (cx2 + 10.6) + ' ' + (hy + 1) + ' Q ' + (cx2 + 4) + ' ' + (hy - 6) + ' ' + (cx2 - 10.6) + ' ' + (hy + 1) + ' Z"/>' +
        '<rect class="sl-desk" x="' + (cx2 - 23) + '" y="' + (base - 3) + '" width="46" height="12" rx="2.5"/>' +
        '<rect class="sl-hit" x="' + a.x + '" y="' + a.y + '" width="' + a.w + '" height="' + a.h + '"/>' +
        '<text class="sl-lab" x="' + (cx2 + 19) + '" y="' + (base - 8) + '">' + u.label + '</text>';
    }
    return g + '</g>';
  }
  /* The ring around a chosen unit (and its label badge). */
  function ringSvg(sc, a, label){
    var cx = a.x + a.w / 2, cy, r, h;
    if(sc.kind === 'plots'){ h = '<rect class="sl-ring" x="' + (a.x + 1.5) + '" y="' + (a.y + 1.5) + '" width="' + (a.w - 3) + '" height="' + (a.h - 3) + '" rx="7"/>'; cx = a.x + a.w - 6; cy = a.y + 6; }
    else { cy = sc.kind === 'houses' ? a.y + 30 : a.y + a.h * 0.74 - 14; r = sc.kind === 'houses' ? 40 : 25; h = '<circle class="sl-ring" cx="' + cx.toFixed(1) + '" cy="' + cy.toFixed(1) + '" r="' + r.toFixed(1) + '"/>'; cx += r * 0.72; cy -= r * 0.72; }
    if(label != null) h += '<g class="sl-badge"><circle cx="' + cx.toFixed(1) + '" cy="' + cy.toFixed(1) + '" r="15"/><text x="' + cx.toFixed(1) + '" y="' + (cy + 5).toFixed(1) + '" text-anchor="middle">' + label + '</text></g>';
    return h;
  }
  function sceneSvg(sc, pop, L, o){
    var lo = Infinity, hi = -Infinity;
    pop.units.forEach(function(u){ lo = Math.min(lo, u.value); hi = Math.max(hi, u.value); });
    o.lo = lo; o.hi = hi;
    return '<svg class="sl-scene sl-' + sc.kind + '" viewBox="0 0 ' + L.W + ' ' + L.H + '" data-w="' + L.W + '" data-h="' + L.H + '" data-ls-text="keep" preserveAspectRatio="xMidYMid meet" role="img" aria-labelledby="' + o.lid + '">' +
      '<title id="' + o.lid + '">' + esc(o.label) + '</title>' +
      '<g class="sl-bg" aria-hidden="true">' + L.bg + '</g><g class="sl-bands" aria-hidden="true"></g>' +
      '<g class="sl-units" aria-hidden="true">' + pop.units.map(function(u){ return unitSvg(sc, u, L.at[u.i], o); }).join('') + '</g>' +
      '<g class="sl-marks" aria-hidden="true"></g>' +
      (L.zones || []).map(function(z, k){ return '<text class="sl-zone" data-z="' + k + '" x="' + z.x + '" y="' + z.y + '"' + (z.mid ? ' text-anchor="middle"' : '') + '>' + esc(z.name) + '</text>'; }).join('') + '</svg>';
  }

  /* Scene text that reads at any size (audit X8). The scene is drawn in
     1000-unit coordinates and shrinks to fit the stage (to about a quarter on
     a phone), so each label's size is set from the drawn scale: at least
     11.5 px on screen. Street names that no longer fit in their lane move
     into a gutter on the left (the picture is height-bound on a phone, so
     the gutter uses spare width); a selected unit's number badge and the
     unit numbers show only where they fit (the strip under the picture
     lists the sample's numbers either way). quick: the badges only. */
  var MINPX = 11.5;
  function readable(svg, sc, quick){
    if(!svg || !svg.isConnected || !svg.getClientRects().length) return;
    var W = +svg.getAttribute('data-w'), H = +svg.getAttribute('data-h'), k = svg._k;
    function all(sel){ return Array.prototype.slice.call(svg.querySelectorAll(sel)); }
    function size(sel, css, min){ var u = Math.max(css, (min || MINPX) / k); all(sel).forEach(function(t){ t.style.fontSize = u.toFixed(1) + 'px'; }); return u; }
    if(!quick || !k){
      var gut = 0;
      for(var pass = 0; pass < 3; pass++){
        svg.setAttribute('viewBox', (-gut) + ' 0 ' + (W + gut) + ' ' + H);
        var m = svg.getScreenCTM(); if(!m || !m.a) return;
        k = svg._k = Math.abs(m.a);
        var need = 0;
        if(sc.kind === 'houses'){
          var fs = Math.max(11, MINPX / k), out = fs > 18, wmax = 0;
          all('.sl-lane-t').forEach(function(t){
            t.style.fontSize = fs.toFixed(1) + 'px';
            t.setAttribute('x', out ? -12 : 10);
            t.setAttribute('text-anchor', out ? 'end' : 'start');
            t.setAttribute('y', out ? (+t.getAttribute('data-gy') + fs * 0.35).toFixed(1) : t.getAttribute('data-y'));
            if(out) wmax = Math.max(wmax, t.getComputedTextLength());
          });
          if(out) need = Math.ceil(wmax + 24);
        }
        if(Math.abs(need - gut) < 4) break;
        gut = need;
      }
      // the streets, the land and the strata bands run into the gutter
      all('.sl-lane, .sl-land').forEach(function(r){ r.setAttribute('x', -gut); r.setAttribute('width', W + gut); });
      svg.classList.toggle('sl-gut', gut > 0);
      var z = size('.sl-zone', 21, 12.5);
      // the top label stays inside the picture
      all('.sl-zone').forEach(function(t, i){ if(sc.kind === 'plots' || i === 0) t.setAttribute('y', Math.max(sc.kind === 'plots' ? 30 : 27, z * 0.85).toFixed(1)); });
      size('.sl-vert', 15);
      size('.sl-room-t', 18, 12);
      size('.sl-hall-t, .sl-office-t', 17);
      // a room's grade: beside its name while that fits, else on the line below
      var g = Math.max(15, MINPX / k), below = g > 17;
      all('.sl-room-g').forEach(function(t){ t.style.display = below ? 'none' : ''; t.style.fontSize = g.toFixed(1) + 'px'; });
      all('.sl-room-g2').forEach(function(t){ t.style.display = below ? 'inline' : 'none'; t.style.fontSize = g.toFixed(1) + 'px'; });
      // a label wider than its room or office is left out (the strip names the groups)
      if(sc.kind === 'rooms'){
        var rw = (W - 2 * 14 - 3 * 12) / 4 - 24;
        // a room's name, then its number alone ("101"), then nothing
        all('.sl-room-t').forEach(function(t){
          var full = t.getAttribute('data-full') || t.textContent; t.setAttribute('data-full', full);
          t.style.display = ''; t.textContent = full;
          if(t.getComputedTextLength() > rw){ t.textContent = full.split(' ').pop(); if(t.getComputedTextLength() > rw) t.style.display = 'none'; }
        });
        all('.sl-room-g2').forEach(function(t){ if(t.style.display !== 'none' && t.getComputedTextLength() > rw) t.style.display = 'none'; });
        all('.sl-office-t').forEach(function(t){ t.style.display = ''; if(t.getComputedTextLength() > 140) t.style.display = 'none'; });
      }
      var lab = Math.max(12, MINPX / k), labOn = lab <= 26;
      all('.sl-lab').forEach(function(t){ t.style.display = labOn ? '' : 'none'; t.style.fontSize = lab.toFixed(1) + 'px'; });
    }
    var b = Math.max(15, MINPX / k), bOn = b <= 32;
    all('.sl-badge').forEach(function(gb){
      gb.style.display = bOn ? '' : 'none';
      if(!bOn) return;
      var c = gb.querySelector('circle'), t = gb.querySelector('text');
      c.setAttribute('r', b.toFixed(1)); t.style.fontSize = b.toFixed(1) + 'px'; t.setAttribute('y', (+c.getAttribute('cy') + b * 0.34).toFixed(1));
    });
  }
  // Re-fit when the drawn size changes (the stage, Enlarge, zoom).
  function keepReadable(svg, sc){
    if(!svg) return;
    readable(svg, sc);
    if(window.ResizeObserver){ var t = 0; new ResizeObserver(function(){ clearTimeout(t); t = setTimeout(function(){ readable(svg, sc); }, 40); }).observe(svg); }
    else window.addEventListener('resize', function(){ readable(svg, sc); });
  }

  /* --------------------------------------------- the dotplot of means */
  /* rows: [{ m, means: [..], last }] in METHODS order; dom [a, b]. Drawn at
     the size of its box in CSS px, so its text is its true size. */
  function meansSvg(rows, dom, mu, w, h, o){
    var padL = 14, padR = 14, top = 18, axis = 40, W = Math.max(240, w), H = Math.max(110, h);
    var pw = W - padL - padR, sx = function(v){ return padL + (v - dom[0]) / (dom[1] - dom[0]) * pw; };
    var n = Math.max(1, rows.length), rh = (H - top - axis) / n, ticks = P.ticks(dom[0], dom[1], W < 420 ? 4 : 7);
    var g = [];
    ticks.forEach(function(t){ g.push('<line class="sl-grid" x1="' + sx(t).toFixed(1) + '" x2="' + sx(t).toFixed(1) + '" y1="' + top + '" y2="' + (H - axis) + '"/><text class="sl-tick" x="' + sx(t).toFixed(1) + '" y="' + (H - axis + 15) + '" text-anchor="middle">' + esc(M.fmt(t, 4)) + '</text>'); });
    g.push('<line class="sl-axis" x1="' + padL + '" x2="' + (W - padR) + '" y1="' + (H - axis) + '" y2="' + (H - axis) + '"/>');
    if(!rows.length) g.push('<text class="sl-empty" x="' + (padL + pw * 0.25) + '" y="' + (top + (H - top - axis) / 2 + 5) + '" text-anchor="middle">' + esc(o.empty) + '</text>');
    var bins = Math.max(24, Math.min(70, Math.round(pw / 7)));
    rows.forEach(function(r, k){
      var y0 = top + k * rh, base = y0 + rh - 5, cnt = {}, maxC = 1;
      r.means.forEach(function(v){ var b = Math.max(0, Math.min(bins - 1, Math.floor((v - dom[0]) / (dom[1] - dom[0]) * bins))); cnt[b] = (cnt[b] || 0) + 1; maxC = Math.max(maxC, cnt[b]); });
      var bw = pw / bins, rad = Math.max(1.4, Math.min(bw / 2 - 0.4, (rh - 10) / maxC / 2 - 0.2, 3.6)), step = Math.min(rad * 2 + 0.6, (rh - 10) / maxC);
      g.push('<text class="sl-rowt' + (r.m === o.cur ? ' is-cur' : '') + '" x="' + (padL + 2) + '" y="' + (y0 + 14) + '">' + esc(S.SHORT[r.m]) + ' <tspan class="sl-rown">' + r.means.length + '</tspan></text>');
      if(k) g.push('<line class="sl-rowsep" x1="' + padL + '" x2="' + (W - padR) + '" y1="' + y0 + '" y2="' + y0 + '"/>');
      var seen = {};
      r.means.forEach(function(v, j){
        var b = Math.max(0, Math.min(bins - 1, Math.floor((v - dom[0]) / (dom[1] - dom[0]) * bins)));
        var lvl = seen[b] = (seen[b] || 0) + 1;
        var off = v < dom[0] || v > dom[1];
        g.push('<circle class="sl-mdot' + (off ? ' is-off' : '') + '" cx="' + (padL + (b + 0.5) * bw).toFixed(1) + '" cy="' + (base - rad - (lvl - 1) * step).toFixed(1) + '" r="' + rad.toFixed(2) + '"/>');
      });
      if(r.last != null && r.m === o.cur){
        var bl = Math.max(0, Math.min(bins - 1, Math.floor((r.last - dom[0]) / (dom[1] - dom[0]) * bins)));
        g.push('<circle class="sl-mlast" cx="' + (padL + (bl + 0.5) * bw).toFixed(1) + '" cy="' + (base - rad - (cnt[bl] - 1) * step).toFixed(1) + '" r="' + Math.max(4.2, rad + 1.6).toFixed(2) + '"/>');
      }
    });
    var mx = sx(mu);
    g.push('<line class="sl-mu" x1="' + mx.toFixed(1) + '" x2="' + mx.toFixed(1) + '" y1="' + (top - 2) + '" y2="' + (H - axis) + '"/>');
    g.push('<text class="sl-mut" x="' + mx.toFixed(1) + '" y="' + (top - 6) + '" text-anchor="middle">μ = ' + esc(o.mu) + '</text>');
    g.push('<text class="sl-axl" x="' + (padL + pw / 2) + '" y="' + (H - 6) + '" text-anchor="middle">' + esc(o.axis) + '</text>');
    return '<svg class="sl-means" viewBox="0 0 ' + W + ' ' + H + '" width="' + W + '" height="' + H + '" role="img" aria-label="' + esc(o.label) + '">' + g.join('') + '</svg>';
  }

  /* --------------------------------------------------------- explore */
  function explore(host, data){
    var scenes = (data.explore && data.explore.scenes) || [];
    var LS = null, nid = T.nid('sl'), sc = scenes[0], pop, L, method = 'srs', n = sc.n, values = false;
    var rows = {}, cur = null, anim = null, touched = false, sel = -1, seed = 1000 + Math.floor(Math.random() * 9000), rng = M.rng(seed);
    function $(s){ return host.querySelector(s) || (LS ? LS.root.querySelector(s) : null); }
    function segBtn(m){ return '<button type="button" data-m="' + m + '" aria-pressed="false"' + (S.RANDOM[m] ? '' : ' aria-label="' + esc(S.SHORT[m]) + ' (not random)"') + '>' + esc(m === 'srs' ? 'Simple' : S.SHORT[m]) + '</button>'; }
    host.innerHTML = '<section class="bt-problem sl-card" aria-labelledby="' + nid + '-h"><h2 id="' + nid + '-h" class="sr-only">Sampling lab</h2>' +
      '<div class="sl-fig"><div class="sl-scenebox"></div><div class="sl-side"><div class="sl-strip" aria-hidden="true" hidden></div>' +
      '<p class="sl-legend" aria-hidden="true"><span class="sl-lg-mu">Population mean μ</span><span class="sl-lg-cur">This sample’s mean</span><span class="sl-lg-dot">Earlier samples</span></p><div class="sl-meansbox"></div></div></div>' +
      '<div class="sl-ctl"><div class="sl-seg" role="group" aria-label="Sampling method"><div class="ls-seg sl-seg-r">' + S.METHODS.filter(function(m){ return S.RANDOM[m]; }).map(segBtn).join('') + '</div>' +
        '<div class="sl-seg-b"><span class="sl-seg-k" aria-hidden="true">Not random</span><div class="ls-seg">' + S.METHODS.filter(function(m){ return !S.RANDOM[m]; }).map(segBtn).join('') + '</div></div></div>' +
      '<div class="sl-n"></div><div class="bt-buttons sl-btns"><button type="button" class="btn-press sl-draw ls-pri">Draw a sample</button><button type="button" class="bt-btn sl-draw100" aria-label="Draw 100 samples">Draw 100</button></div></div>' +
      '<div class="sl-say"></div>' +
      T.moreHtml('<div class="sl-pick"></div><div class="bt-ctl sl-vals"><label class="sl-check"><input type="checkbox" class="sl-values"> Show each unit\'s value as a color</label></div><div class="bt-buttons"><button type="button" class="bt-btn sl-clear">Clear the dots</button></div>', 'population, colors, clear') +
      '<div class="sl-now"></div><div class="sl-table"></div><div class="sl-popinfo"></div><p class="sr-only sl-live" role="status" aria-live="polite"></p></section>';
    var say = T.announcer($('.sl-live'));
    var cue = T.cue('Pick a method, then Draw a sample.');
    $('.sl-ctl').insertBefore(cue.el, $('.sl-ctl').firstChild);
    var nSl = T.slider({ label: 'Sample size, n', min: 4, max: 24, step: 1, value: n, decimals: 0, onInput: function(v){ act(); n = v; stop(); rows = {}; cur = null; sel = -1; marks(); drawMeans(); text(); } });
    $('.sl-n').appendChild(nSl.el);
    var pick = T.choiceSelect({ label: 'Population', options: scenes.map(function(s, i){ return { value: i, label: s.name }; }), value: 0, onChange: function(v){ setScene(scenes[+v]); } });
    $('.sl-pick').appendChild(pick.el);
    host.querySelectorAll('.sl-seg button').forEach(function(b){ b.addEventListener('click', function(){ act(); method = b.getAttribute('data-m'); stop(); cur = null; sel = -1; syncSeg(); bands(); marks(); drawMeans(); text(); }); });
    $('.sl-draw').addEventListener('click', function(){ act(); drawOne(); });
    $('.sl-draw100').addEventListener('click', function(){ act(); drawMany(100); });
    $('.sl-values').addEventListener('change', function(e){ values = e.target.checked; drawScene(); });
    $('.sl-clear').addEventListener('click', function(){ stop(); rows = {}; cur = null; marks(); drawMeans(); text(); say('The dots are cleared.'); });
    function act(){ if(!touched){ touched = true; cue.done(); } }

    function setScene(s){
      stop(); sc = s; pop = S.population(sc); L = layout(sc, pop); rows = {}; cur = null; sel = -1;
      if(method === 'vol' && !sc.voluntary) method = 'srs';
      n = sc.n; nSl.set(n);
      drawScene(); drawMeans(); text(); syncSeg(); popInfo();
      var sv = LS && LS.root.querySelector('.stat-ls-setup .ls-v'); if(sv) sv.textContent = sc.name;
    }
    function dom(){
      var a = pop.mu - 2.3 * pop.sigma, b = pop.mu + 2.3 * pop.sigma, lo = Infinity, hi = -Infinity;
      pop.units.forEach(function(u){ lo = Math.min(lo, u.value); hi = Math.max(hi, u.value); });
      a = Math.max(a, lo); b = Math.min(b, hi);
      var st = (b - a) / 6, p = Math.pow(10, Math.floor(Math.log10(st))); st = [1, 2, 2.5, 5, 10].map(function(k){ return k * p; }).filter(function(k){ return k >= st; })[0];
      return [Math.floor(a / st) * st, Math.ceil(b / st) * st];
    }
    function drawScene(){
      var box = $('.sl-scenebox');
      box.innerHTML = sceneSvg(sc, pop, L, { values: values, lid: nid + '-t', label: sc.name + ': ' + pop.N + ' ' + sc.units + '. Population mean ' + sc.variable + ' ' + fx(pop.mu) + ' ' + sc.unitOf + '.' });
      var svg = box.querySelector('svg');
      svg.addEventListener('click', function(e){
        var g = e.target.closest('.sl-u'); if(!g) return;
        act(); sel = +g.getAttribute('data-i'); marks(); text();
      });
      bands(); marks();
      keepReadable(svg, sc);
    }
    function syncSeg(){
      [host, LS && LS.root].forEach(function(r){ if(!r) return; r.querySelectorAll('.sl-seg button').forEach(function(b){
        var m = b.getAttribute('data-m'); b.setAttribute('aria-pressed', String(m === method));
        var off = m === 'vol' && !sc.voluntary; b.disabled = off; b.title = off ? sc.noVoluntary : '';
      }); });
    }
    /* Strata (stratified) or clusters (cluster) outlined on the picture. */
    function bands(){
      var g = $('.sl-bands'); if(!g) return;
      var list = method === 'strat' ? L.strata : method === 'cluster' ? L.clusters : [], chosen = cur && cur.clusters ? cur.clusters : [];
      g.innerHTML = list.map(function(b, k){
        var on = method === 'cluster' && chosen.indexOf(k) > -1;
        return '<rect class="sl-band ' + (method === 'strat' ? 'is-strat sl-band-' + (k % 4) : 'is-cluster') + (on ? ' is-on' : '') + '" x="' + b.x + '" y="' + b.y + '" width="' + b.w + '" height="' + b.h + '" rx="10"/>';
      }).join('');
      var svg = $('.sl-scene');
      if(svg) svg.querySelectorAll('.sl-zone').forEach(function(z){ var k = +z.getAttribute('data-z'); z.textContent = L.zones[k].name + (method === 'strat' && cur && cur.alloc ? ': ' + cur.alloc[k] + ' chosen' : ''); z.classList.toggle('is-strat', method === 'strat'); });
    }
    /* The chosen units ringed (in the order drawn, shown = how many so far),
       the rest dimmed; the tapped unit outlined. */
    function marks(shown){
      var svg = $('.sl-scene'); if(!svg) return;
      var picks = cur ? cur.order.slice(0, shown == null ? cur.order.length : shown) : [], on = {};
      picks.forEach(function(i){ on[i] = true; });
      svg.classList.toggle('has-sample', !!cur);
      svg.querySelectorAll('.sl-u').forEach(function(g){ var i = +g.getAttribute('data-i'); g.classList.toggle('is-pick', !!on[i]); g.classList.toggle('is-sel', i === sel); });
      var mk = svg.querySelector('.sl-marks'), out = [];
      var badges = cur && cur.method !== 'cluster' && picks.length <= 24;
      picks.forEach(function(i){ out.push(ringSvg(sc, L.at[i], badges ? pop.units[i].label : null)); });
      if(sel > -1){
        var a2 = L.at[sel];
        out.push('<rect class="sl-selbox" x="' + (a2.x + 1) + '" y="' + (a2.y - (sc.kind === 'houses' ? 26 : 0) + 1) + '" width="' + (a2.w - 2) + '" height="' + (a2.h + (sc.kind === 'houses' ? 26 : 0) - 2) + '" rx="8"/>');
      }
      mk.innerHTML = out.join('');
      bands();
      readable(svg, sc, true);
    }
    function drawMeans(){
      var box = $('.sl-meansbox'); if(!box) return;
      var r = box.getBoundingClientRect(), w = Math.round(r.width) || 600, h = Math.round(r.height) || 150;
      var list = S.METHODS.filter(function(m){ return rows[m]; }).map(function(m){ return { m: m, means: rows[m].means, last: rows[m].last }; });
      var fig = $('.sl-fig'); if(fig){ var fr = fig.getBoundingClientRect(); fig.classList.toggle('is-wide', fr.width > 1.25 * fr.height && fr.width > 640); }
      r = box.getBoundingClientRect(); w = Math.round(r.width) || 600; h = Math.round(r.height) || 150;
      box.innerHTML = meansSvg(list, dom(), pop.mu, w, h, { cur: method, mu: fx(pop.mu), axis: 'Sample mean x̄ (' + sc.unitOf + ')', empty: 'Means land here', label: list.length ? 'Dotplot of sample means by method: ' + list.map(function(x){ return S.SHORT[x.m] + ' ' + x.means.length + ' samples, centered at ' + fx(S.mean(x.means)); }).join('; ') + '. Population mean ' + fx(pop.mu) + '.' : 'No samples yet. The population mean is ' + fx(pop.mu) + '.' });
      if(LS) LS.pills(cur ? [{ k: 'x̄', html: fx(cur.mean), tone: 'readout' }] : [], 'left', 'explore');
      if(LS) LS.pills([{ k: 'μ', html: fx(pop.mu), tone: 'ghost' }], 'right', 'explore');
    }
    function strip(){
      var el = $('.sl-strip'); if(!el) return;
      if(!cur){ el.innerHTML = ''; el.hidden = true; return; }
      el.hidden = false;
      var h = '';
      if(cur.method === 'srs') h = '<span class="sl-k">Random integers 1 to ' + pop.N + '</span>' + cur.draws.map(function(d){ return '<span class="sl-num' + (d.repeat ? ' is-rep' : '') + '">' + d.v + '</span>'; }).join('');
      else if(cur.method === 'strat') h = '<span class="sl-k">In proportion</span>' + pop.strata.map(function(s, k){ return '<span class="sl-num">' + esc(s.name) + ' ' + cur.alloc[k] + '</span>'; }).join('');
      else if(cur.method === 'cluster') h = '<span class="sl-k">' + esc(sc.clusters.many.charAt(0).toUpperCase() + sc.clusters.many.slice(1)) + ' chosen</span>' + cur.clusters.map(function(c){ return '<span class="sl-num">' + esc(pop.clusters[c].name) + '</span>'; }).join('');
      else if(cur.method === 'sys') h = '<span class="sl-k">k = ' + pop.N + ' ÷ ' + n + ' ≈ ' + cur.k + ', start ' + cur.start + '</span>' + cur.order.map(function(i){ return '<span class="sl-num">' + pop.units[i].label + '</span>'; }).join('');
      else h = '<span class="sl-k is-bias">' + esc(cur.method === 'conv' ? 'Nearest to the surveyor' : 'Chose to answer') + '</span>' + cur.order.map(function(i){ return '<span class="sl-num">' + pop.units[i].label + '</span>'; }).join('');
      el.innerHTML = h;
    }
    function addMean(m, v){ var r = rows[m] || (rows[m] = { means: [], last: null }); r.means.push(v); r.last = v; }
    function sample(){ return S.draw(rng, pop, method, n, sc); }
    function drawOne(){
      stop();
      var d = sample(); if(!d.ok){ say(d.why); return; }
      cur = d; sel = -1; strip(); bands();
      var N = d.order.length;
      if(T.reduced()){ addMean(d.method, d.mean); marks(); drawMeans(); text(); return; }
      var shown = 0, per = Math.min(0.12, 1.4 / N);
      anim = P.loop(function(dt, t){
        var k = Math.min(N, Math.floor(t / per) + 1);
        if(k !== shown){ shown = k; marks(k); }
        return k < N;
      }, { onEnd: function(){ anim = null; addMean(d.method, d.mean); marks(); drawMeans(); text(); } });
      anim.start();
      text(true);
    }
    function drawMany(k){
      stop();
      var last = null;
      for(var j = 0; j < k; j++){ var d = sample(); if(!d.ok){ say(d.why); return; } addMean(method, d.mean); last = d; }
      cur = last; sel = -1; strip(); marks(); drawMeans(); text();
      say(k + ' more samples drawn. ' + summaryLine(method));
    }
    function stop(){ if(anim){ anim.stop(); anim = null; if(cur){ addMean(cur.method, cur.mean); marks(); drawMeans(); } } }
    function summaryLine(m){
      var r = rows[m]; if(!r || r.means.length < 2) return '';
      var c = S.mean(r.means), spread = S.sd(r.means), off = c - pop.mu, rel = Math.abs(off) / (spread || 1);
      return S.SHORT[m] + ': ' + r.means.length + ' sample means centered at ' + fx(c) + ' (μ = ' + fx(pop.mu) + '), spread SD ' + fx(spread) + '. ' +
        (r.means.length >= 20 ? (rel > 2.2 && Math.abs(off) > 0.02 * Math.abs(pop.mu) ? 'Centered ' + (off > 0 ? 'above' : 'below') + ' μ: this method is biased.' : 'Centered on μ: no sign of bias.') : 'Draw more to see the center.');
    }
    function unitLine(i){
      var u = pop.units[i], where = sc.kind === 'rooms' ? pop.clusters[u.cluster].name : sc.kind === 'plots' ? pop.clusters[u.cluster].name + ', ' + sc.strata.groups[u.stratum].name.toLowerCase() : 'on ' + pop.clusters[u.cluster].name + ' (' + sc.strata.groups[u.stratum].name + ')';
      return cap(sc.unit) + ' ' + u.label + ' ' + (sc.kind === 'houses' ? '' : 'in ') + where + ': ' + fx(u.value, sc.decimals) + ' ' + sc.unitOf + '.';
    }
    function cap(s){ return s.charAt(0).toUpperCase() + s.slice(1); }
    function text(drawing){
      var head, tail;
      if(sel > -1){ head = unitLine(sel); tail = cur && cur.order.indexOf(sel) > -1 ? 'It is in the sample.' : 'Tap another, or draw a sample.'; }
      else if(!cur){ head = pop.N + ' ' + sc.units + ', each with its own ' + sc.variable + '.'; tail = 'Pick a method, then draw a sample.'; }
      else if(drawing){ head = 'Drawing a ' + S.NAME[method] + ' of ' + cur.order.length + '…'; tail = ''; }
      else { head = cap(S.NAME[method]) + ', n = ' + cur.n + ': x̄ = ' + fx(cur.mean) + ' ' + sc.abbr + '.'; tail = (rows[method] && rows[method].means.length >= 20) ? summaryLine(method).split('. ').slice(-1)[0] : 'μ = ' + fx(pop.mu) + '. Draw more to see where the means center.'; }
      var why = whyHtml();
      T.explain($('.sl-say'), '<b>' + esc(head) + '</b> ' + esc(tail), why);
      if(LS){ LS.caption('<b>' + esc(head) + '</b> ' + esc(tail), 'explore'); }
      nowBox(); tableBox();
      if(!drawing) say(head + ' ' + tail);
    }
    function whyHtml(){
      var m = method, w = [];
      var HOW = {
        srs: 'Label every ' + sc.unit + ' 1 to ' + pop.N + ', generate random integers from 1 to ' + pop.N + ', skip repeats, and take the ' + sc.units + ' with the first ' + n + ' different labels. Every group of ' + n + ' is equally likely.',
        strat: 'Split the ' + sc.units + ' into strata (' + sc.strata.groups.map(function(g){ return g.name; }).join(' and ') + '), then take a simple random sample inside each, in proportion to its size. ' + sc.stratWhy + ' So every sample gets the right mix, and the means vary less.',
        cluster: 'Choose whole ' + sc.clusters.many + ' at random and take everyone in them. Cheaper: fewer places to go. ' + sc.clusterWhy,
        sys: 'k = ' + pop.N + ' ÷ ' + n + ' ≈ ' + Math.floor(pop.N / n) + '. Pick a random start from 1 to ' + Math.floor(pop.N / n) + ', then take every ' + S.ord(Math.floor(pop.N / n)) + ' label. Each ' + sc.unit + ' has the same chance, but only ' + Math.floor(pop.N / n) + ' samples are possible.' + (sc.kind === 'plots' && Math.floor(pop.N / n) % sc.cols === 0 ? ' Here the labels run row by row, ' + sc.cols + ' to a row, so every ' + S.ord(Math.floor(pop.N / n)) + ' plot is in the same column: the whole sample is dry or irrigated. A list that repeats in a cycle of k is the danger of systematic sampling.' : ''),
        conv: (sc.convenience ? sc.convenience.note + ' ' : '') + sc.convWhy + ' Nonrandom, so it is biased: drawing more samples just repeats the same mistake.',
        vol: (sc.voluntary ? sc.voluntary.note + ' ' : '') + (sc.volWhy || '') + ' The respondents chose themselves, so the sample is biased.'
      };
      w.push('<p>' + esc(HOW[m]) + '</p>');
      w.push('<p><b>Reading the dots.</b> Each dot is one sample’s mean; the dashed line is the population mean μ. A row centered off the line is <b>biased</b>. A wide row has high <b>variability</b>. A bigger n narrows the spread, but no n fixes bias.</p>');
      if(!S.RANDOM[m]) w.push('<p>On the exam, explain bias as "nonrandom, so the sample is likely not representative", and say which way it pushes the estimate. "The sample is too small" is not the reason.</p>');
      return w.join('');
    }
    function nowBox(){
      var el = $('.sl-now'); if(!el) return;
      if(!cur){ el.innerHTML = '<h3 class="ls-title-l">This sample</h3><p class="bt-small">No sample yet.</p>'; return; }
      var proc = '';
      if(cur.method === 'srs') proc = '<ol class="ls-steps"><li>Label the ' + esc(sc.units) + ' from 1 to ' + pop.N + '.</li><li>Generate random integers from 1 to ' + pop.N + ': ' + cur.draws.map(function(d){ return d.repeat ? '<s>' + d.v + '</s> (repeat, skipped)' : String(d.v); }).join(', ') + '.</li><li>Skip repeats.</li><li>The ' + esc(sc.units) + ' with those ' + cur.n + ' labels are the sample.</li></ol>';
      else if(cur.method === 'sys') proc = '<p>k = ' + pop.N + ' ÷ ' + n + ', rounded down: ' + cur.k + '. Random start from 1 to ' + cur.k + ': ' + cur.start + '. Labels ' + cur.order.map(function(i){ return pop.units[i].label; }).join(', ') + '.</p>';
      else if(cur.method === 'strat') proc = '<p>' + pop.strata.map(function(s, k){ return esc(s.name) + ': ' + cur.alloc[k] + ' of ' + s.n; }).join('; ') + ' (in proportion to size), each a simple random sample.</p>';
      else if(cur.method === 'cluster') proc = '<p>' + esc(cap(sc.clusters.many)) + ' chosen at random: ' + cur.clusters.map(function(c){ return esc(pop.clusters[c].name); }).join(', ') + '. Everyone in them: ' + cur.n + ' ' + esc(sc.units) + '.</p>';
      else proc = '<p>Not chosen by chance: ' + esc(cur.method === 'conv' ? sc.convenience.note : sc.voluntary.note) + '</p>';
      var rowsH = cur.order.map(function(i){ var u = pop.units[i]; return '<tr><th scope="row">' + u.label + '</th><td>' + esc(pop.clusters[u.cluster].name) + '</td><td>' + esc(sc.strata.groups[u.stratum].name) + '</td><td class="r">' + fx(u.value, sc.decimals) + '</td></tr>'; }).join('');
      el.innerHTML = '<h3 class="ls-title-l">This sample: ' + esc(S.NAME[cur.method]) + '</h3>' + proc +
        '<div class="table-wrap" tabindex="0" role="region" aria-label="The ' + esc(sc.units) + ' in this sample"><table class="ls-tbl"><thead><tr><th scope="col">Label</th><th scope="col">' + esc(cap(sc.clusters.one)) + '</th><th scope="col">' + esc(cap(sc.strata.word)) + '</th><th scope="col">' + esc(cap(sc.abbr)) + '</th></tr></thead><tbody>' + rowsH + '</tbody></table></div>' +
        '<p class="bt-small">Sample mean x̄ = ' + fx(cur.mean) + ' ' + esc(sc.unitOf) + '; population mean μ = ' + fx(pop.mu) + '.</p>';
    }
    function tableBox(){
      var el = $('.sl-table'); if(!el) return;
      var ms = S.METHODS.filter(function(m){ return rows[m]; });
      el.innerHTML = '<h3 class="ls-title-l">Every method so far</h3>' + (ms.length ? '<div class="table-wrap" tabindex="0" role="region" aria-label="Sample means by method"><table class="ls-tbl"><thead><tr><th scope="col">Method</th><th scope="col">Samples</th><th scope="col">Mean of x̄</th><th scope="col">SD of x̄</th><th scope="col">Mean minus μ</th></tr></thead><tbody>' +
        ms.map(function(m){ var r = rows[m], c = S.mean(r.means); return '<tr' + (m === method ? ' class="hl"' : '') + '><th scope="row">' + esc(S.SHORT[m]) + '</th><td class="r">' + r.means.length + '</td><td class="r">' + fx(c) + '</td><td class="r">' + (r.means.length > 1 ? fx(S.sd(r.means)) : '') + '</td><td class="r">' + fx(c - pop.mu) + '</td></tr>'; }).join('') + '</tbody></table></div>' : '<p class="bt-small">No samples yet. Draw 100 with each method to compare them.</p>');
    }
    function popInfo(){
      var el = $('.sl-popinfo'); if(!el) return;
      el.innerHTML = '<h3 class="ls-title-l">The population</h3><p>' + pop.N + ' ' + esc(sc.units) + ' in ' + esc(sc.where) + '. Variable: ' + esc(sc.variable) + ' (' + esc(sc.unitOf) + '). μ = ' + fx(pop.mu) + ', σ = ' + fx(pop.sigma) + '.</p>' +
        '<div class="table-wrap" tabindex="0" role="region" aria-label="Strata of the population"><table class="ls-tbl"><thead><tr><th scope="col">' + esc(cap(sc.strata.word)) + '</th><th scope="col">' + esc(cap(sc.units)) + '</th><th scope="col">Mean</th></tr></thead><tbody>' + pop.strata.map(function(s){ return '<tr><th scope="row">' + esc(s.name) + '</th><td class="r">' + s.n + '</td><td class="r">' + fx(s.mu) + '</td></tr>'; }).join('') + '</tbody></table></div>';
    }

    var ro = null;
    function studio(pane, s){
      LS = s;
      var sp = T.studioPane(pane, s, { stage: [$('.sl-fig')], dock: [$('.sl-ctl')], setup: 'Population', moreLabel: 'Population, colors and the dots', why: [$('.sl-say')], details: [$('.sl-now'), $('.sl-table'), $('.sl-popinfo')] });
      sp.setup(sc.name);
      syncSeg(); drawMeans(); text();
      var ab = document.createElement('div'); ab.className = 'ls-sec stat-about';
      ab.innerHTML = (data.intro || '') + (data.howItWorks ? '<h3 class="ls-title-l">' + esc(data.howItWorksTitle || 'How it works') + '</h3>' + data.howItWorks : '');
      s.add('about', ab, { mode: 'explore' });
      if(s.mode() === 'explore') s.hint({ target: s.root.querySelector('.sl-draw'), text: 'Draw a sample' });
      watch($('.sl-meansbox'));
    }
    function watch(el){ if(window.ResizeObserver && el){ var t = null; ro = new ResizeObserver(function(){ clearTimeout(t); t = setTimeout(drawMeans, 60); }); ro.observe(el); } }
    setScene(sc);
    if(!window.LevlStudio) watch($('.sl-meansbox'));
    return { stop: function(){ if(anim){ anim.stop(); anim = null; } }, studio: studio };
  }

  /* ------------------------------------------------------ test yourself */
  function quiz(host, data){
    var scenes = {}, ctxs = {}; ((data.explore && data.explore.scenes) || []).forEach(function(s){ scenes[s.id] = s; });
    (data.contexts || []).forEach(function(c){ ctxs[c.id] = c; });
    var o = { slug: 'sampling-lab', noun: 'drill',
      generate: S.generate,
      types: [{ value: 'method', label: 'Which kind of sample?' }, { value: 'procedure', label: 'Write the procedure' }, { value: 'bias', label: 'Spot the bias' }, { value: 'numbers', label: 'Systematic, strata and clusters' }],
      typeLabel: 'Kind of problem',
      title: function(p){ return { method: 'Which kind of sample?', procedure: 'Write the procedure', bias: 'Spot the bias', numbers: 'The numbers of a sample' }[p.type] || 'Practice problem'; },
      extra: function(el, p, api){ api.fig = el; api.qs = { yours: null, done: {} }; draw(api); },
      onStep: function(s, right, api){ api.qs.done[s.key] = true; api.qs.yours = null; draw(api); },
      onTry: function(s, t, api){
        if(t.right) return;
        if(s.kind === 'choice' && s.key === 'method'){ var m = methodOfOption(s.options[t.value]); if(m) { api.qs.yours = { method: m }; draw(api); } return; }
        if(s.kind === 'num' && isFinite(t.value)){ api.qs.yours = { key: s.key, v: t.value }; draw(api); }
      },
      method: function(s, p){
        var H = { method: 'Look at the picture: one random draw from everyone (simple), a random sample from every group (stratified), whole groups (cluster), every k-th (systematic), or no chance at all (convenience, voluntary).',
          groups: 'Strata are the groups sampled from; clusters are the groups taken whole.', chance: 'Simple random means every GROUP of n is equally likely, not only every unit.',
          represent: 'A nonrandom method can push the estimate one way. Size does not fix that.',
          label: 'Give every unit in the population its own number.', generate: 'Say what the generator makes: integers in the same range as the labels.',
          repeats: 'Sampling is without replacement: a unit cannot be chosen twice.', select: 'Tie the numbers back to the units, and say when to stop.',
          k: 'k = population size ÷ sample size. Your k is marked in red on the list.', start: 'The start is random, within the first k labels.',
          alloc: 'In proportion: sample size × (group size ÷ population size). Your count is the red bar.', within: 'Strata get a random sample inside; clusters are taken whole.',
          m: 'Number of groups = units wanted ÷ units per group. Your choice is outlined in red.',
          bias: 'Ask who was left out, who chose to answer, who did not answer, or what pushed the answers.', direction: 'Think about which way the missing or pushed answers lean.' };
        return H[s.key] || null;
      }
    };
    function draw(api){
      var p = api.problem, st = api.qs;
      if(p.type === 'numbers'){ api.fig.innerHTML = numFig(p.figure, st); return; }
      if(p.type === 'procedure'){ qtape(api.fig, p, st); return; }
      if(!SCENE_FOR[p.ctx] && p.type === 'method' && ctxs[p.ctx]){ api.fig.innerHTML = rosterFig(ctxs[p.ctx], p.figure.method, st); return; }
      qfig(api.fig, p, scenes, st);
    }
    T.drill(host, data, o);
  }
  /* A setting with no drawn scene (batteries, patients): a model of its list,
     100 numbered entries in rows of 10 (a row stands for a box or a day),
     colored by group, with the described sample ringed and, after a wrong
     answer, what the student's method would look like in red dashes. */
  function rosterFig(c, m, st){
    var N = 100, cols = 10, cs = 58, W = cols * cs + 20, top = 34, gN = c.strata.groups.length, sizes = c.strata.groups.map(function(g){ return g.size; });
    var tot = sizes.reduce(function(a, b){ return a + b; }, 0), cuts = [], acc = 0;
    sizes.forEach(function(z){ acc += z; cuts.push(Math.round(acc / tot * N)); });
    var grp = function(i){ for(var k = 0; k < cuts.length; k++) if(i < cuts[k]) return k; return gN - 1; };
    function pick(mm, seed){
      var r = M.rng(seed), out = [], all = []; for(var i = 0; i < N; i++) all.push(i);
      if(mm === 'srs') out = M.sample(r, all, 10);
      else if(mm === 'vol') out = M.sample(r, all.slice(70), 10); // the ones who chose to answer: bunched, not spread by chance
      else if(mm === 'strat'){ var al = S.allocate ? S.allocate(sizes, 10) : sizes.map(function(z){ return Math.round(z / tot * 10); }); al.forEach(function(a, k){ out = out.concat(M.sample(r, all.filter(function(i){ return grp(i) === k; }), a)); }); }
      else if(mm === 'cluster'){ M.sample(r, [0, 1, 2, 3, 4, 5, 6, 7, 8, 9], 1).forEach(function(row){ for(var j = 0; j < cols; j++) out.push(row * cols + j); }); }
      else if(mm === 'sys'){ var st0 = r.int(0, 9); for(var j2 = st0; j2 < N; j2 += 10) out.push(j2); }
      else out = all.slice(0, 10);
      return out;
    }
    var on = {}, yo = {}, Y = st && st.yours && st.yours.method !== m ? st.yours.method : null;
    pick(m, 7).forEach(function(i){ on[i] = true; });
    if(Y) pick(Y, 19).forEach(function(i){ yo[i] = true; });
    var g = ['<text class="sl-rh" x="10" y="20">' + esc('100 of the ' + c.N + ' ' + c.units + ' on the list (each row: one ' + c.clusters.one + ')') + '</text>'];
    for(var i = 0; i < N; i++){
      var x = 10 + (i % cols) * cs, y = top + Math.floor(i / cols) * cs;
      g.push('<g class="sl-ro sl-rg' + (grp(i) % 4) + (on[i] ? ' is-pick' : '') + '"><rect x="' + (x + 3) + '" y="' + (y + 3) + '" width="' + (cs - 6) + '" height="' + (cs - 6) + '" rx="9"/><text x="' + (x + cs / 2) + '" y="' + (y + cs / 2 + 6) + '" text-anchor="middle">' + (i + 1) + '</text>' +
        (yo[i] ? '<rect class="sl-ro-y" x="' + (x + 1) + '" y="' + (y + 1) + '" width="' + (cs - 2) + '" height="' + (cs - 2) + '" rx="11"/>' : '') + '</g>');
    }
    var H = top + 10 * cs + 8;
    var key = c.strata.groups.map(function(gg, k){ return '<span class="sl-rk sl-rg' + (k % 4) + '">' + esc(gg.name) + '</span>'; }).join('');
    return '<figure class="sl-qfig sl-roster"><svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc('A model of the list: 100 numbered ' + c.units + ' colored by group, the sample described ringed' + (Y ? ', and a ' + S.NAME[Y] + ' in red dashes' : '') + '.') + '">' + g.join('') + '</svg>' +
      '<figcaption class="bt-small"><span class="sl-rkey">' + key + '</span>' + (Y ? ' <span class="sl-qy">Red dashes: a ' + esc(S.NAME[Y]) + ', your answer.</span>' : '') + '</figcaption></figure>';
  }
  // The method a choice option names ("Cluster sample" -> 'cluster').
  function methodOfOption(t){ t = String(t).replace(/<[^>]+>/g, '').toLowerCase(); var hit = null; S.METHODS.forEach(function(m){ if(t.indexOf(S.NAME[m]) === 0) hit = m; }); return hit; }
  // The procedure's random number tape; once Select is answered the first n different numbers are marked.
  function qtape(el, p, st){
    var d = p.figure.draws.slice(0, 16), n = 0, fin = st.done && st.done.select, keep = {};
    if(fin){ var seen = 0; p.figure.draws.forEach(function(x, i){ if(!x.repeat && seen < 16){ keep[i] = true; seen++; } }); }
    el.innerHTML = '<figure class="sl-qtape"><figcaption class="bt-small">What a random number generator gave, in order' + (fin ? ': the sample is the first different labels (marked)' : '') + '</figcaption><div class="sl-strip sl-strip-q">' +
      d.map(function(x, i){ return '<span class="sl-num' + (x.repeat ? ' is-rep' : '') + (fin && keep[i] ? ' is-pick' : '') + '">' + x.v + '</span>'; }).join('') + (p.figure.draws.length > 16 ? '<span class="sl-k">and so on</span>' : '') + '</div></figure>';
  }
  /* After a numbers step: the systematic list, the proportional split or the
     chosen clusters, drawn from the problem's own numbers. */
  function numFig(f, st){
    st = st || { done: {} };
    var W = 640, g = [], H, cap, Y = st.yours, done = st.done || {};
    if(f.which === 'sys'){
      var k = f.k, kk = done.k ? k : Y && Y.key === 'k' && Y.v >= 1 && Y.v <= 60 ? Math.round(Y.v) : 0, st0 = Math.ceil(k / 2), show = Math.min(f.N, 3 * k + st0), cols = Math.min(show, 24), cw = (W - 20) / cols, rows = Math.ceil(show / cols);
      H = rows * 44 + 20;
      for(var i = 1; i <= show; i++){
        var x = 10 + ((i - 1) % cols) * cw, y = 10 + Math.floor((i - 1) / cols) * 44, on = done.k && i >= st0 && (i - st0) % k === 0, yours = !done.k && kk && i >= st0 && (i - st0) % kk === 0;
        g.push('<g class="nf-l' + (on ? ' is-on' : '') + (yours ? ' is-yours' : '') + '"><rect x="' + (x + 1) + '" y="' + y + '" width="' + (cw - 2) + '" height="36" rx="6"/><text x="' + (x + cw / 2) + '" y="' + (y + 23) + '" text-anchor="middle">' + i + '</text></g>');
      }
      cap = done.k ? 'With k = ' + k + ' and a random start of, say, ' + st0 + ': labels ' + st0 + ', ' + (st0 + k) + ', ' + (st0 + 2 * k) + ' and so on, ' + f.n + ' in all.'
        : kk ? 'Your k = ' + kk + ' (red): ' + (kk * f.n > f.N ? f.n + ' units that far apart would need ' + (kk * f.n) + ' labels, but there are ' + f.N + '.' : f.n + ' units that far apart reach only label ' + (kk * f.n) + ' of ' + f.N + ', so the end of the list could never be chosen.') : 'The list, labeled 1 to ' + f.N + ' (the start is shown as an example).';
    } else if(f.which === 'strat'){
      var N = f.N, x0 = 10, bw = W - 20, nn = f.n; H = 200;
      g.push('<text class="nf-k" x="10" y="20">Population, ' + N + '</text><text class="nf-k" x="10" y="122">Sample, ' + nn + '</text>');
      var a = x0, b = x0;
      f.sizes.forEach(function(sz, j){
        var w1 = bw * sz / N, w2 = bw * f.alloc[j] / nn, cls = 'nf-s nf-s' + (j % 4) + (j === f.h ? ' is-on' : ''), hide = j === f.h && !done.alloc;
        g.push('<g class="' + cls + '"><rect x="' + a + '" y="28" width="' + Math.max(1, w1 - 3) + '" height="52" rx="6"/><text x="' + (a + w1 / 2) + '" y="59" text-anchor="middle">' + sz + '</text></g>');
        g.push('<g class="' + cls + '"><rect x="' + b + '" y="130" width="' + Math.max(1, w2 - 3) + '" height="52" rx="6"/><text x="' + (b + w2 / 2) + '" y="161" text-anchor="middle">' + (hide ? '?' : f.alloc[j]) + '</text></g>');
        if(hide && Y && Y.key === 'alloc' && Y.v > 0){ var wy = Math.min(bw, bw * Y.v / nn); g.push('<rect class="nf-yours" x="' + b + '" y="186" width="' + Math.max(2, wy - 3) + '" height="10" rx="3"/>'); }
        g.push('<path class="nf-link" d="M' + (a + w1 / 2) + ' 82 L ' + (b + w2 / 2) + ' 128"/>');
        a += w1; b += w2;
      });
      if(Y && Y.key === 'alloc') H = 214;
      cap = done.alloc ? 'Each stratum keeps its share: ' + f.names.map(function(n, j){ return n + ' ' + f.sizes[j] + ' to ' + f.alloc[j]; }).join(', ') + '.'
        : Y && Y.key === 'alloc' ? 'Yours: ' + T.F(Y.v, 0) + ' (the red bar). The sample bar keeps the same shares as the population bar above it.' : 'Each stratum keeps its share of the sample. The highlighted one is asked.';
    } else {
      var cnt = f.count, cols2 = Math.min(cnt, cnt > 60 ? 15 : 10), cs = Math.min(46, (W - 20) / cols2), rows2 = Math.ceil(cnt / cols2), on2 = {}, yo = {};
      if(done.m) (f.pick || []).forEach(function(i){ on2[i] = true; });
      else if(Y && Y.key === 'm' && Y.v > 0) for(var q = 0; q < Math.min(cnt, Math.round(Y.v)); q++) yo[(f.pick && f.pick[q] != null) ? f.pick[q] : q] = true;
      H = rows2 * cs + 20; W = Math.max(cols2 * cs + 20, 200);
      for(var c = 0; c < cnt; c++) g.push('<rect class="nf-c' + (on2[c] ? ' is-on' : '') + (yo[c] ? ' is-yours' : '') + '" x="' + (10 + (c % cols2) * cs + 2) + '" y="' + (10 + Math.floor(c / cols2) * cs + 2) + '" width="' + (cs - 4) + '" height="' + (cs - 4) + '" rx="6"/>');
      cap = done.m ? f.m + ' of the ' + cnt + ' ' + f.many + ' chosen at random, everyone in them sampled.' : Y && Y.key === 'm' ? 'Yours: ' + T.F(Y.v, 0) + ' ' + f.many + ' (red). Each brings the same number of units.' : 'The ' + cnt + ' ' + f.many + '.';
    }
    return '<figure class="sl-nfig"><svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(cap) + '">' + g.join('') + '</svg><figcaption class="bt-small">' + esc(cap) + '</figcaption></figure>';
  }

  /* A drill's picture. Procedure: the random number tape. Method: a small
     model of the setting; once the method is answered, that method's sample
     drawn on it (it is a model of the idea, not the real numbers). */
  function qfig(el, p, scenes, st){
    if(!el) return;
    st = st || {};
    var id = SCENE_FOR[p.ctx], sc = id && scenes[id];
    if(p.type !== 'method' || !sc){ el.innerHTML = ''; return; }
    var pop = S.population(sc), L = layout(sc, pop), lid = T.nid('slq'), m = p.figure.method, Y = st.yours && st.yours.method !== m ? st.yours.method : null;
    var html = '<figure class="sl-qfig">' + sceneSvg(sc, pop, L, { lid: lid, label: 'A small model of the setting: ' + pop.N + ' ' + sc.units + ', with the sample from the problem drawn on it' + (Y ? ', and in red dashes what a ' + S.NAME[Y] + ' would look like' : '') + '.' }) +
      '<figcaption class="bt-small sl-qcap">' + (Y ? '<span class="sl-qy">Red dashes: a ' + esc(S.NAME[Y]) + ', your answer.</span> Orange: the sample described.' : 'The sample described, on a small model of the setting. Tap a ' + esc(sc.unit) + ' to read it.') + '</figcaption></figure>';
    el.innerHTML = html;
    var svg = el.querySelector('svg'), mk = svg.querySelector('.sl-marks'), bandsG = svg.querySelector('.sl-bands');
    function sampleOf(mm, seed){ var nn = mm === 'cluster' ? 2 * pop.N / pop.clusters.length : sc.n; return S.draw(M.rng(seed), pop, mm === 'vol' && !sc.voluntary ? 'conv' : mm, nn, sc); }
    var d2 = sampleOf(m, 7), on = {};
    d2.picks.forEach(function(i){ on[i] = true; });
    svg.classList.add('has-sample');
    svg.querySelectorAll('.sl-u').forEach(function(g){ g.classList.toggle('is-pick', !!on[+g.getAttribute('data-i')]); });
    // The strata or clusters are outlined once the method is answered (the rings alone are the picture of the description).
    var bands = '', named = !!(st.done && st.done.method);
    if(!named){ /* rings only */ }
    else if(m === 'strat') bands += L.strata.map(function(b, k){ return '<rect class="sl-band is-strat sl-band-' + (k % 4) + '" x="' + b.x + '" y="' + b.y + '" width="' + b.w + '" height="' + b.h + '" rx="10"/>'; }).join('');
    else if(m === 'cluster') bands += (d2.clusters || []).map(function(c){ var b = L.clusters[c]; return '<rect class="sl-band is-cluster is-on" x="' + b.x + '" y="' + b.y + '" width="' + b.w + '" height="' + b.h + '" rx="10"/>'; }).join('');
    var marks = d2.picks.map(function(i){ return ringSvg(sc, L.at[i], null); }).join('');
    if(Y){
      var dy = sampleOf(Y, 19);
      if(Y === 'cluster') bands += (dy.clusters || []).map(function(c){ var b = L.clusters[c]; return '<rect class="sl-band is-yours" x="' + b.x + '" y="' + b.y + '" width="' + b.w + '" height="' + b.h + '" rx="10"/>'; }).join('');
      if(Y === 'strat') bands += L.strata.map(function(b){ return '<rect class="sl-band is-yours" x="' + b.x + '" y="' + b.y + '" width="' + b.w + '" height="' + b.h + '" rx="10"/>'; }).join('');
      marks += (dy.picks || []).map(function(i){ return ringSvg(sc, L.at[i], null).replace('class="sl-ring"', 'class="sl-ring is-yours"'); }).join('');
    }
    bandsG.innerHTML = bands; mk.innerHTML = marks;
    keepReadable(svg, sc);
    // Tap a unit to read its label, group and whether it is in the sample.
    svg.addEventListener('click', function(e){
      var g = e.target.closest('.sl-u'); if(!g) return;
      var u = pop.units[+g.getAttribute('data-i')], where = sc.kind === 'rooms' ? pop.clusters[u.cluster].name + ', ' + sc.strata.groups[u.stratum].name : pop.clusters[u.cluster].name + ' (' + sc.strata.groups[u.stratum].name + ')';
      svg.querySelectorAll('.sl-u.is-sel').forEach(function(x){ x.classList.remove('is-sel'); }); g.classList.add('is-sel');
      var cap = el.querySelector('.sl-qcap');
      if(cap) cap.innerHTML = '<b>' + esc(sc.unit.charAt(0).toUpperCase() + sc.unit.slice(1) + ' ' + u.label) + '</b>, ' + esc(where) + ': ' + (on[u.i] ? 'in the sample.' : 'not in the sample.');
    });
  }
})();
