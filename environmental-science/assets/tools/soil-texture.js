/* Soil texture trainer page (docs/apenv-spec.md section 6). OWNED BY THIS TOOL
   ONLY (builder T2). Mounts into #app with ApEnvTools.mount; the model is
   ApEnvMath.soilTexture (environmental-science/assets/tools/math/soil-texture.js),
   the content environmental-science/data/tools/soil-texture.json (served
   filtered as assets/tool-data/soil-texture.json).

   Job: find a soil on the texture triangle and see how it holds water.

   Explore (Tool Studio): the USDA texture triangle, drawn from the model's
   class polygons (so the picture is exactly the rules that classify), with
   a draggable point (pointer, or arrow keys: left/right trade sand and
   silt, up/down trade clay for the other two). Three guide lines run from
   the point to the sand, silt and clay axes, so reading a triangle is
   visible. Beside it: a magnified sample (sand grains, silt and clay
   particles in the right proportions), and the class's porosity,
   permeability and water-holding bars, with a jar of water draining.
   A second view: a soil profile (O, A, E, B, C, R) to tap horizon by
   horizon. Dock: the view, three sliders that always sum to 100 (moving
   one rescales the other two), the class read-out.

   Test yourself: ApEnvTools.drill over the model's kinds (classify a
   point, the missing percent then its class, porosity and permeability,
   horizons, erosion and conservation, a percolation test in cm/hr). */
(function(){
  'use strict';
  var T = window.ApEnvTools, M = window.ApEnvMath;
  if(!T || !M || !M.soilTexture) return;
  var S = M.soilTexture, esc = T.esc, SLUG = 'soil-texture';

  /* ---------------------------------------------------- geometry
     The triangle: clay at the top apex, sand bottom-left, silt bottom-right
     (the USDA layout). A point (sand, silt, clay) sits at
       x = left + side * (silt + clay / 2) / 100,  y = bottom - h * clay / 100. */
  function tri(W, H, phone){
    var padL = phone ? 34 : 54, padR = phone ? 34 : 54, padT = phone ? 26 : 30, padB = phone ? 60 : 64;
    var side = Math.min(W - padL - padR, (H - padT - padB) / 0.866);
    var h = side * 0.866, left = (W - side) / 2;
    padT += Math.max(0, (H - padT - padB - h) / 2);
    var bottom = padT + h;
    function xy(sa, si, cl){ return [left + side * (si + cl / 2) / 100, bottom - h * cl / 100]; }
    function inv(x, y){
      var cl = (bottom - y) / h * 100, si = (x - left) / side * 100 - cl / 2, sa = 100 - si - cl;
      return [sa, si, cl];
    }
    return { side: side, h: h, left: left, bottom: bottom, xy: xy, inv: inv };
  }
  var CLASS_COLOR = { 'sand': 1, 'loamy-sand': 2, 'sandy-loam': 3, 'loam': 4, 'silt-loam': 5, 'silt': 6, 'sandy-clay-loam': 7, 'clay-loam': 8, 'silty-clay-loam': 9, 'sandy-clay': 10, 'silty-clay': 11, 'clay': 12 };
  var SHORT = { 'sand': 'Sand', 'loamy-sand': 'Loamy sand', 'sandy-loam': 'Sandy loam', 'loam': 'Loam', 'silt-loam': 'Silt loam', 'silt': 'Silt', 'sandy-clay-loam': 'Sandy clay loam', 'clay-loam': 'Clay loam', 'silty-clay-loam': 'Silty clay loam', 'sandy-clay': 'Sandy clay', 'silty-clay': 'Silty clay', 'clay': 'Clay' };
  /* Label anchors (fractions) inside each class, placed by hand to read well. */
  var LAB = { 'sand': [90, 6, 4], 'loamy-sand': [80, 13, 7], 'sandy-loam': [64, 25, 11], 'loam': [42, 39, 19], 'silt-loam': [22, 63, 15], 'silt': [7, 87, 6], 'sandy-clay-loam': [60, 12, 28], 'clay-loam': [33, 34, 33], 'silty-clay-loam': [10, 57, 33], 'sandy-clay': [52, 6, 42], 'silty-clay': [7, 46, 47], 'clay': [22, 20, 58] };
  function wrapName(n){ var w = n.split(' '); if(w.length < 2) return [n]; if(w.length === 2) return w; return [w[0] + ' ' + w[1], w[2]]; }

  function triangleSvg(o){
    var W = o.W, H = o.H, phone = o.phone != null ? o.phone : W < 600, G = tri(W, H, phone), out = [];
    var A = G.xy(100, 0, 0), B = G.xy(0, 100, 0), Cc = G.xy(0, 0, 100);
    // class polygons
    Object.keys(S.POLYS).forEach(function(id){
      var d = S.POLYS[id].map(function(q, i){ var p = G.xy(q[0], q[1], q[2]); return (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1); }).join('') + 'Z';
      out.push('<path class="st-cls c' + CLASS_COLOR[id] + (o.cls === id ? ' is-on' : '') + (o.hideClasses ? ' blank' : '') + '" data-c="' + id + '" d="' + d + '"/>');
    });
    // grid every 10%
    for(var k = 10; k < 100; k += 10){
      var a1 = G.xy(100 - k, 0, k), a2 = G.xy(0, 100 - k, k); // clay = k (parallel to the base)
      var b1 = G.xy(k, 100 - k, 0), b2 = G.xy(k, 0, 100 - k); // sand = k
      var c1 = G.xy(100 - k, k, 0), c2 = G.xy(0, k, 100 - k); // silt = k
      out.push('<path class="st-grid" d="M' + a1[0].toFixed(1) + ' ' + a1[1].toFixed(1) + 'L' + a2[0].toFixed(1) + ' ' + a2[1].toFixed(1) + 'M' + b1[0].toFixed(1) + ' ' + b1[1].toFixed(1) + 'L' + b2[0].toFixed(1) + ' ' + b2[1].toFixed(1) + 'M' + c1[0].toFixed(1) + ' ' + c1[1].toFixed(1) + 'L' + c2[0].toFixed(1) + ' ' + c2[1].toFixed(1) + '"/>');
      // tick numbers: clay on the left side, silt on the right side, sand on the base
      if(!phone || k % 20 === 0){
        var cl = G.xy(100 - k, 0, k), si = G.xy(0, 100 - k + 0, k - 0), sa = G.xy(k, 100 - k, 0);
        var siP = G.xy(0, k, 100 - k);
        out.push('<text class="st-tick clay" x="' + (cl[0] - 8).toFixed(1) + '" y="' + (cl[1] + 4).toFixed(1) + '" text-anchor="end">' + k + '</text>');
        out.push('<text class="st-tick silt" x="' + (siP[0] + 8).toFixed(1) + '" y="' + (siP[1] + 4).toFixed(1) + '">' + k + '</text>');
        out.push('<text class="st-tick sand" x="' + sa[0].toFixed(1) + '" y="' + (sa[1] + 17).toFixed(1) + '" text-anchor="middle">' + k + '</text>');
      }
    }
    // class boundaries on top of the grid, then the outline
    Object.keys(S.POLYS).forEach(function(id){
      var d = S.POLYS[id].map(function(q, i){ var p = G.xy(q[0], q[1], q[2]); return (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1); }).join('') + 'Z';
      out.push('<path class="st-edge" d="' + d + '"/>');
    });
    out.push('<path class="st-outline" d="M' + A.join(' ') + 'L' + B.join(' ') + 'L' + Cc.join(' ') + 'Z"/>');
    // axis titles with arrows showing the direction each percent increases
    var fs = phone ? 13 : 15;
    var mid = function(p, q, t){ return [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t]; };
    var pt0 = o.pt || [50, 25, 25];
    var tc = pt0[2] > 50 ? 0.22 : 0.74, ts = pt0[1] < 50 ? 0.24 : 0.74, tb = pt0[0] > 50 ? 0.74 : 0.26;
    var cm = mid(A, Cc, tc), sm = mid(B, Cc, ts), bm = mid(A, B, tb);
    out.push('<text class="st-axis clay" transform="translate(' + (cm[0] - (phone ? 22 : 34)).toFixed(1) + ' ' + (cm[1] - 6).toFixed(1) + ') rotate(-60)" text-anchor="middle">Clay % →</text>');
    out.push('<text class="st-axis silt" transform="translate(' + (sm[0] + (phone ? 22 : 34)).toFixed(1) + ' ' + (sm[1] - 6).toFixed(1) + ') rotate(60)" text-anchor="middle">← Silt %</text>');
    out.push('<text class="st-axis sand" x="' + bm[0].toFixed(1) + '" y="' + (bm[1] + (phone ? 38 : 42)).toFixed(1) + '" text-anchor="middle">← Sand %</text>');
    // class names
    if(!o.hideClasses) Object.keys(LAB).forEach(function(id){
      var q = LAB[id], p = G.xy(q[0], q[1], q[2]), lines = wrapName(SHORT[id]), lf = phone ? 10.5 : 12.5;
      if(phone && (id === 'sand' || id === 'loamy-sand')) lines = [id === 'sand' ? 'S' : 'LS'];
      // The point covers a name: move it off (Loam sideways, since Clay loam
      // sits right above it).
      if(o.pt){ var P0 = G.xy(o.pt[0], o.pt[1], o.pt[2]); if(Math.abs(P0[0] - p[0]) < 30 && Math.abs(P0[1] - p[1]) < 16) p = id === 'loam' ? [p[0] + (P0[0] > p[0] ? -26 : 26), p[1]] : [p[0], p[1] + (P0[1] > p[1] ? -18 : 20)]; }
      out.push('<text class="st-name' + (o.cls === id ? ' is-on' : '') + '" x="' + p[0].toFixed(1) + '" y="' + (p[1] - (lines.length - 1) * lf * 0.55).toFixed(1) + '" text-anchor="middle">' + lines.map(function(l, i){ return '<tspan x="' + p[0].toFixed(1) + '" dy="' + (i ? lf * 1.1 : 0) + '">' + esc(l) + '</tspan>'; }).join('') + '</text>');
    });
    // the point and its three reading lines
    if(o.pt){
      var P = G.xy(o.pt[0], o.pt[1], o.pt[2]);
      var toClay = G.xy(100 - o.pt[2], 0, o.pt[2]);              // along constant clay to the left (clay) side
      var toSilt = G.xy(0, o.pt[1], 100 - o.pt[1]);              // along constant silt to the right (silt) side
      var toSand = G.xy(o.pt[0], 100 - o.pt[0], 0);              // along constant sand to the base
      out.push('<path class="st-read clay" d="M' + P[0].toFixed(1) + ' ' + P[1].toFixed(1) + 'L' + toClay[0].toFixed(1) + ' ' + toClay[1].toFixed(1) + '"/>');
      out.push('<path class="st-read silt" d="M' + P[0].toFixed(1) + ' ' + P[1].toFixed(1) + 'L' + toSilt[0].toFixed(1) + ' ' + toSilt[1].toFixed(1) + '"/>');
      out.push('<path class="st-read sand" d="M' + P[0].toFixed(1) + ' ' + P[1].toFixed(1) + 'L' + toSand[0].toFixed(1) + ' ' + toSand[1].toFixed(1) + '"/>');
      if(o.readouts !== false){
        var tag = function(p, txt, cls, dx, dy, anchor){ var tw = txt.length * 7.4 + 12; var x = anchor === 'end' ? p[0] + dx - tw : anchor === 'middle' ? p[0] + dx - tw / 2 : p[0] + dx; return '<g class="st-tag ' + cls + '"><rect x="' + x.toFixed(1) + '" y="' + (p[1] + dy - 11).toFixed(1) + '" width="' + tw.toFixed(1) + '" height="20" rx="10"/><text x="' + (x + tw / 2).toFixed(1) + '" y="' + (p[1] + dy + 3.5).toFixed(1) + '" text-anchor="middle">' + esc(txt) + '</text></g>'; };
        out.push(tag(toClay, o.pt[2] + '%', 'clay', -6, 0, 'end'));
        out.push(tag(toSilt, o.pt[1] + '%', 'silt', 6, 0, 'start'));
        out.push(tag(toSand, o.pt[0] + '%', 'sand', 0, phone ? 30 : 32, 'middle'));
      }
      out.push('<circle class="st-pt-halo" cx="' + P[0].toFixed(1) + '" cy="' + P[1].toFixed(1) + '" r="' + (phone ? 16 : 14) + '"/><circle class="st-pt" cx="' + P[0].toFixed(1) + '" cy="' + P[1].toFixed(1) + '" r="' + (phone ? 8.5 : 8) + '"/>');
    }
    return { svg: out.join(''), G: G };
  }

  /* ---------------------------------------------------- the sample
     A magnified sample: sand grains (big, tan, angular), silt (small grey
     dots) and clay (tiny dark flakes), in proportion to the percentages;
     a seeded layout so redraws do not jump. */
  function sampleSvg(pt, x, y, w, h){
    var r = M.rng(77), out = ['<clipPath id="st-clip"><rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="12"/></clipPath><g clip-path="url(#st-clip)"><rect class="st-sample-bg" x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '"/>'];
    var nSand = Math.round(pt[0] / 100 * 26), nSilt = Math.round(pt[1] / 100 * 110), nClay = Math.round(pt[2] / 100 * 420);
    var spots = [];
    for(var i = 0; i < 26; i++) spots.push([x + 8 + r() * (w - 16), y + 8 + r() * (h - 16), r() * 360, 0.75 + r() * 0.5]);
    for(i = 0; i < nSand; i++){ var s = spots[i], rr = 8 * s[3] * w / 160; out.push('<path class="st-g-sand" transform="translate(' + s[0].toFixed(1) + ' ' + s[1].toFixed(1) + ') rotate(' + s[2].toFixed(0) + ')" d="M' + (-rr) + ' ' + (-rr * 0.4) + ' L' + (-rr * 0.2) + ' ' + (-rr) + ' L' + rr + ' ' + (-rr * 0.5) + ' L' + (rr * 0.8) + ' ' + (rr * 0.7) + ' L' + (-rr * 0.5) + ' ' + rr + 'Z"/>'); }
    for(i = 0; i < nSilt; i++) out.push('<circle class="st-g-silt" cx="' + (x + 4 + r() * (w - 8)).toFixed(1) + '" cy="' + (y + 4 + r() * (h - 8)).toFixed(1) + '" r="' + (1.6 + r() * 1.2).toFixed(1) + '"/>');
    for(i = 0; i < nClay; i++){ var cx = x + 2 + r() * (w - 4), cy = y + 2 + r() * (h - 4); out.push('<rect class="st-g-clay" x="' + cx.toFixed(1) + '" y="' + cy.toFixed(1) + '" width="2.4" height="1" transform="rotate(' + (r() * 180).toFixed(0) + ' ' + cx.toFixed(1) + ' ' + cy.toFixed(1) + ')"/>'); }
    out.push('</g><rect class="st-sample-frame" x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="12"/>');
    return out.join('');
  }
  function barsSvg(P, x, y, w, phone){
    var rows = [['Porosity (pore space)', P.porosity, (P.porosity - 0.3) / 0.3], ['Permeability (drainage)', P.permeability, P.permeability], ['Water-holding capacity', P.holding, P.holding], ['Nutrients held', P.nutrients, P.nutrients]];
    var lh = phone ? 34 : 38, out = [];
    rows.forEach(function(rw, i){
      var yy = y + i * lh, v = Math.max(0.03, Math.min(1, rw[2]));
      out.push('<text class="st-bar-t" x="' + x + '" y="' + (yy + 11) + '">' + esc(rw[0]) + '</text><text class="st-bar-v" x="' + (x + w) + '" y="' + (yy + 11) + '" text-anchor="end">' + (i === 0 ? M.fmt(rw[1] * 100, 2) + '%' : S.word(rw[1])) + '</text>' +
        '<rect class="st-bar-bg" x="' + x + '" y="' + (yy + 16) + '" width="' + w + '" height="8" rx="4"/><rect class="st-bar b' + i + '" x="' + x + '" y="' + (yy + 16) + '" width="' + (w * v).toFixed(1) + '" height="8" rx="4"/>');
    });
    return out.join('');
  }

  /* ---------------------------------------------------- soil profile */
  var HZ = [
    { id: 'O', t: 0.1, fill: 'o' }, { id: 'A', t: 0.2, fill: 'a' }, { id: 'E', t: 0.12, fill: 'e' }, { id: 'B', t: 0.22, fill: 'b' }, { id: 'C', t: 0.18, fill: 'c' }, { id: 'R', t: 0.18, fill: 'r' }
  ];
  function profileSvg(o){
    var W = o.W, H = o.H, phone = W < 600, x0 = phone ? 18 : 60, w = phone ? 150 : 330, top = phone ? 50 : 56, h = H - top - 20, out = [], y = top, r = M.rng(5);
    out.push('<text class="st-title" x="' + x0 + '" y="' + (top - 26) + '">Soil profile</text>');
    // grass and a plant on top
    out.push('<path class="st-grass" d="M' + x0 + ' ' + top + ' h' + w + ' v-4 h-' + w + 'z"/>' + [0.15, 0.35, 0.6, 0.85].map(function(f){ var gx = x0 + w * f; return '<path class="st-blade" d="M' + gx + ' ' + top + ' q-3 -12 -8 -16 M' + gx + ' ' + top + ' q2 -14 6 -20 M' + gx + ' ' + top + ' q5 -8 12 -10"/>'; }).join(''));
    var sel = o.sel, labels = [];
    HZ.forEach(function(z){
      var zh = h * z.t, H0 = S.HORIZONS.filter(function(x){ return x.id === z.id; })[0], ask = o.ask && o.ask.indexOf(z.id) > -1;
      out.push('<g class="st-hz' + (sel === z.id ? ' is-sel' : '') + (ask ? ' is-ask' : '') + '" data-h="' + z.id + '"' + (o.interactive ? ' role="button" tabindex="0" aria-pressed="' + (sel === z.id) + '" aria-label="' + esc(H0.name + ': ' + H0.what) + '"' : '') + '>' +
        '<rect class="st-hzr ' + z.fill + '" x="' + x0 + '" y="' + y.toFixed(1) + '" width="' + w + '" height="' + zh.toFixed(1) + '"/>');
      // texture inside each layer
      var n = z.id === 'O' ? 14 : z.id === 'R' ? 0 : z.id === 'C' ? 10 : 22;
      for(var i = 0; i < n; i++){
        var px = x0 + 6 + r() * (w - 12), py = y + 4 + r() * (zh - 8);
        if(z.id === 'O') out.push('<ellipse class="st-leaf" cx="' + px.toFixed(1) + '" cy="' + py.toFixed(1) + '" rx="5" ry="2" transform="rotate(' + (r() * 180).toFixed(0) + ' ' + px.toFixed(1) + ' ' + py.toFixed(1) + ')"/>');
        else if(z.id === 'C') out.push('<path class="st-rockbit" d="M' + px.toFixed(1) + ' ' + py.toFixed(1) + ' l7 -3 l5 5 l-6 5 l-7 -2z"/>');
        else out.push('<circle class="st-speck ' + z.fill + '" cx="' + px.toFixed(1) + '" cy="' + py.toFixed(1) + '" r="' + (1 + r() * 1.6).toFixed(1) + '"/>');
      }
      if(z.id === 'R') out.push('<path class="st-crack" d="M' + (x0 + w * 0.3) + ' ' + y + ' l8 ' + (zh * 0.4) + ' l-6 ' + (zh * 0.3) + ' M' + (x0 + w * 0.7) + ' ' + (y + zh * 0.2) + ' l-10 ' + (zh * 0.5) + '"/>');
      if(z.id === 'A' || z.id === 'O') out.push('<path class="st-rootline" d="M' + (x0 + w * 0.6) + ' ' + y + ' q-6 ' + (zh * 0.5) + ' 4 ' + zh + ' M' + (x0 + w * 0.25) + ' ' + y + ' q8 ' + (zh * 0.6) + ' -2 ' + zh + '"/>');
      out.push('<text class="st-hz-id" x="' + (x0 + 12) + '" y="' + (y + Math.min(zh / 2 + 6, 26)).toFixed(1) + '">' + (ask ? '?' : z.id) + '</text></g>');
      labels.push({ z: z, y: y + zh / 2, H0: H0, ask: ask });
      y += zh;
    });
    // the leaching arrow from E to B
    var eY = labels[2].y, bY = labels[3].y;
    out.push('<path class="st-leach" d="M' + (x0 + w - 18) + ' ' + eY + ' V' + (bY - 6) + '" marker-end="url(#st-arr)"/>');
    // names on the right
    var lx = x0 + w + 14, lw = W - lx - 8;
    labels.forEach(function(L){
      var nm = L.ask ? '?' : L.H0.name, ds = L.ask ? '' : L.H0.what.split(':')[0];
      var show = !L.ask && (!o.sel || o.sel === L.z.id || !phone), full = !phone && !L.ask ? L.H0.what.split(': ')[1] || '' : '';
      out.push('<text class="st-hz-n' + (o.sel === L.z.id ? ' is-sel' : '') + '" x="' + lx + '" y="' + (L.y - (full ? 8 : 2)).toFixed(1) + '">' + esc(nm) + '</text>' + (show ? '<text class="st-hz-d" x="' + lx + '" y="' + (L.y + (phone ? 13 : 9)).toFixed(1) + '">' + esc(phone && ds.length > 22 ? ds.slice(0, 22) + '…' : ds) + '</text>' : '') +
        (full ? '<text class="st-hz-f" x="' + lx + '" y="' + (L.y + 26).toFixed(1) + '">' + esc(full.length > 58 ? full.slice(0, 57) + '…' : full) + '</text>' : ''));
      out.push('<path class="st-hz-tick" d="M' + (x0 + w) + ' ' + L.y.toFixed(1) + ' h10"/>');
    });
    void lw;
    return out.join('');
  }

  /* ------------------------------------------------------- mount */
  T.mount(SLUG, function(app, data){
    var ex = null;
    T.modes(app, { slug: SLUG,
      explore: function(host){ ex = explore(host, data); },
      quiz: function(host){ quiz(host, data); },
      studio: { explore: function(pane, s){ ex.studio(pane, s); } } });
  });

  /* ------------------------------------------------------- explore */
  function explore(host, data){
    var X = data.explore || {}, st = { view: 'triangle', pt: (X.start || [40, 40, 20]).slice(), hz: null };
    var LS = null, touched = false, nid = T.nid('st'), geo = null, drag = false;
    function $(q){ return host.querySelector(q) || (LS ? LS.root.querySelector(q) : null); }
    function root(){ return LS ? LS.root : host; }
    host.innerHTML = '<section class="bt-problem st-card" aria-labelledby="' + nid + '-h"><h2 id="' + nid + '-h" class="sr-only">Soil texture triangle</h2>' +
      '<div class="st-fig"><svg class="st-svg" xmlns="http://www.w3.org/2000/svg" tabindex="0" role="application" aria-roledescription="texture triangle" aria-describedby="' + nid + '-k" aria-labelledby="' + nid + '-d"></svg><p class="sr-only" id="' + nid + '-d"></p><p class="sr-only" id="' + nid + '-k">Arrow keys move the point: left and right trade sand for silt, up and down add or remove clay.</p></div>' +
      '<div class="st-ctl">' +
        '<div class="st-views ls-scroll" role="group" aria-label="View"><button type="button" class="tchip st-view" data-v="triangle" aria-pressed="true">Texture triangle</button><button type="button" class="tchip st-view" data-v="profile" aria-pressed="false">Soil horizons</button></div>' +
        '<div class="st-sl"></div>' +
        '<div class="st-presets ls-scroll" role="group" aria-label="Example soils"><button type="button" class="tchip st-pre" data-p="90,5,5">Beach sand</button><button type="button" class="tchip st-pre" data-p="40,40,20">Garden loam</button><button type="button" class="tchip st-pre" data-p="10,30,60">Pottery clay</button><button type="button" class="tchip st-pre" data-p="15,75,10">River silt</button></div>' +
      '</div>' +
      '<div class="st-say"></div>' +
      T.moreHtml('<p class="bt-small">Particle sizes: sand 0.05 to 2 mm, silt 0.002 to 0.05 mm, clay under 0.002 mm. Gravel (over 2 mm) and organic matter are left out: the percents are of the mineral fine earth only.</p>', 'particle sizes') +
      '<div class="st-nums"></div><p class="sr-only st-live" role="status" aria-live="polite"></p></section>';
    var say = T.announcer($('.st-live'));
    var cue = T.cue('Drag the point on the triangle, or use the sliders.');
    $('.st-ctl').insertBefore(cue.el, $('.st-ctl').firstChild);
    function act(){ if(!touched){ touched = true; cue.done(); } }
    var names = ['sand', 'silt', 'clay'], sl = {};
    names.forEach(function(n, i){
      sl[n] = T.slider({ label: n.charAt(0).toUpperCase() + n.slice(1), min: 0, max: 100, step: 1, value: st.pt[i], unit: '%', onInput: function(v){ act(); setOne(i, v); } });
      sl[n].el.classList.add('st-s-' + n);
      $('.st-sl').appendChild(sl[n].el);
    });
    /* Move one fraction; the other two share the change in proportion (so
       the three always sum to 100). */
    function setOne(i, v){
      v = Math.max(0, Math.min(100, Math.round(v)));
      var j = (i + 1) % 3, k = (i + 2) % 3, rest = 100 - v, oj = st.pt[j], ok = st.pt[k], pt = st.pt.slice();
      pt[i] = v;
      if(oj + ok === 0){ pt[j] = Math.round(rest / 2); pt[k] = rest - pt[j]; }
      else { pt[j] = Math.round(rest * oj / (oj + ok)); pt[k] = rest - pt[j]; }
      st.pt = pt; render(false, true);
    }
    function setPt(pt, announce){
      var c = pt.map(function(x){ return Math.max(0, Math.round(x)); }), s = c[0] + c[1] + c[2];
      if(s !== 100){ c[1] += 100 - s; if(c[1] < 0){ c[0] += c[1]; c[1] = 0; } }
      st.pt = c; render(announce);
    }
    var svg = $('.st-svg');
    function onClick(e){
      var b = e.target.closest('.st-view'); if(b){ st.view = b.getAttribute('data-v'); act(); render(true); return; }
      b = e.target.closest('.st-pre'); if(b){ act(); st.view = 'triangle'; setPt(b.getAttribute('data-p').split(',').map(Number), true); return; }
    }
    host.addEventListener('click', onClick);
    function fromEvent(e){
      var r = svg.getBoundingClientRect(), vb = svg.viewBox.baseVal, k = Math.min(r.width / vb.width, r.height / vb.height);
      var ox = (r.width - vb.width * k) / 2, oy = (r.height - vb.height * k) / 2;
      var x = (e.clientX - r.left - ox) / k, y = (e.clientY - r.top - oy) / k;
      var p = geo.G.inv(x, y);
      // clamp into the triangle
      p = p.map(function(v){ return Math.max(0, v); }); var s = p[0] + p[1] + p[2]; p = p.map(function(v){ return v / s * 100; });
      return p;
    }
    svg.addEventListener('pointerdown', function(e){
      if(st.view !== 'triangle'){ var h = e.target.closest('.st-hz'); if(h){ act(); st.hz = st.hz === h.getAttribute('data-h') ? null : h.getAttribute('data-h'); render(true); } return; }
      e.preventDefault(); drag = true; act(); try{ svg.setPointerCapture(e.pointerId); }catch(x){}
      setPt(fromEvent(e));
    });
    svg.addEventListener('pointermove', function(e){ if(drag) setPt(fromEvent(e)); });
    svg.addEventListener('pointerup', function(){ if(drag){ drag = false; render(true); } });
    svg.addEventListener('pointercancel', function(){ drag = false; });
    svg.addEventListener('keydown', function(e){
      if(st.view === 'profile'){
        if(e.key === 'Enter' || e.key === ' '){ var h = e.target.closest('.st-hz'); if(h){ e.preventDefault(); st.hz = h.getAttribute('data-h'); render(true); var f = svg.querySelector('.st-hz[data-h="' + st.hz + '"]'); if(f) f.focus(); } }
        return;
      }
      var p = st.pt.slice(), d = e.shiftKey ? 5 : 1;
      if(e.key === 'ArrowLeft'){ if(p[1] < d) return; p[0] += d; p[1] -= d; }
      else if(e.key === 'ArrowRight'){ if(p[0] < d) return; p[0] -= d; p[1] += d; }
      else if(e.key === 'ArrowUp'){ if(p[0] + p[1] < d) return; p[2] += d; if(p[0] >= p[1]) p[0] -= d; else p[1] -= d; }
      else if(e.key === 'ArrowDown'){ if(p[2] < d) return; p[2] -= d; if(p[0] <= p[1]) p[0] += d; else p[1] += d; }
      else return;
      e.preventDefault(); act(); st.pt = p.map(function(v){ return Math.max(0, v); }); render(true);
    });

    function size(){
      var r = svg.getBoundingClientRect(), w = r.width || 360, h = r.height || 420;
      var W = w < 600 ? 400 : 820, H = Math.round(Math.max(W * 0.62, Math.min(W * 1.4, W * h / w)));
      return { W: W, H: H };
    }
    function words(){
      var id = S.classify(st.pt[0], st.pt[1], st.pt[2]), P = S.props(st.pt[0], st.pt[1], st.pt[2]);
      if(st.view === 'profile'){
        var H0 = st.hz ? S.HORIZONS.filter(function(h){ return h.id === st.hz; })[0] : null;
        return H0 ? { head: H0.name + ': ' + H0.what + '.', why: '<p>' + esc({ O: 'Fallen leaves and dead organisms decompose here into humus, the dark, nutrient-rich organic matter.', A: 'Humus mixed with mineral particles: the most fertile layer, and the one erosion strips away first.', E: 'Water soaking down carries dissolved minerals and clay out of this pale layer (eluviation, or leaching).', B: 'The minerals, iron and clay leached from above collect here (illuviation), so it is often denser and redder.', C: 'Weathered pieces of the parent rock: soil is still forming from it.', R: 'Solid bedrock: the parent material that weathering slowly breaks down into soil.' }[H0.id]) + '</p><p class="bt-small">Soil forms slowly: weathering of parent material plus organic matter, over hundreds to thousands of years per few centimeters.</p>' }
          : { head: 'Tap a horizon, from the O layer at the surface down to bedrock.', why: '<p>Weathering breaks the parent rock (R, C) into particles; organisms add organic matter from the top (O, A); water moves minerals from E down to B.</p>' };
      }
      var name = S.nameOf(id), hold = S.word(P.holding), perm = S.word(P.permeability);
      var head = st.pt[0] + '% sand, ' + st.pt[1] + '% silt, ' + st.pt[2] + '% clay: ' + name.toLowerCase() + '. Drainage ' + perm + ', water held ' + hold + '.';
      var why = '<p>' + esc({ 'sand': 'Big grains leave big pores: water and air move through fast, but little water or nutrients are held. Good drainage, poor for most crops without irrigation.', 'loamy-sand': 'Mostly sand with a little silt and clay: drains fast, holds a little more water than pure sand.', 'sandy-loam': 'Enough silt and clay to hold some water, enough sand to drain: easy to work.', 'loam': 'A balance of sand, silt and clay: drains well yet holds water and nutrients. The best texture for most crops.', 'silt-loam': 'Mostly silt: holds water well and is fertile, but crusts and erodes easily when bare.', 'silt': 'Fine, smooth particles: holds water, drains slowly, erodes easily by water and wind.', 'sandy-clay-loam': 'Sand with a good share of clay: holds water and nutrients, drains moderately.', 'clay-loam': 'Clay-rich but balanced: fertile and water-holding, slow to drain, can compact.', 'silty-clay-loam': 'Silt and clay: holds a lot of water and nutrients, drains slowly.', 'sandy-clay': 'Sand and clay: sticky when wet, hard when dry, slow to drain.', 'silty-clay': 'Fine particles only: holds much water, drains very slowly, waterlogs.', 'clay': 'Tiny, flat particles: the most total pore space and water held, but the pores are so small that water drains very slowly and roots can lack air. Holds nutrients well.' }[id]) + '</p><p class="bt-small">Porosity is the total pore space (clay has the most); permeability is how fast water moves through (sand is fastest, because its pores are big and connected).</p>';
      return { head: head, why: why, id: id, P: P };
    }
    function describe(w){
      if(st.view === 'profile') return 'Soil profile from the surface down: ' + S.HORIZONS.map(function(h){ return h.name + ', ' + h.what; }).join('; ') + '.';
      return 'Texture triangle. Point at ' + st.pt[0] + '% sand, ' + st.pt[1] + '% silt, ' + st.pt[2] + '% clay, in the ' + S.nameOf(w.id).toLowerCase() + ' class. Porosity ' + M.fmt(w.P.porosity * 100, 2) + '%, permeability ' + S.word(w.P.permeability) + ', water-holding capacity ' + S.word(w.P.holding) + '.';
    }
    function nums(w){
      var rows = S.CLASSES.map(function(c){ var q = S.centroid(c.id).map(Math.round); q[1] = 100 - q[0] - q[2]; var P = S.props(q[0], q[1], q[2]); return [esc(c.name) + (c.id === w.id ? ' <b>(here)</b>' : ''), q.join(' / '), S.word(P.permeability), S.word(P.holding), M.fmt(S.INFIL[c.id], 2)]; });
      $('.st-nums').innerHTML = '<h3 class="ls-title-l">Every class</h3>' + T.dataTable(['Class', 'Typical sand / silt / clay (%)', 'Drainage', 'Water held', 'Infiltration (cm/hr)'], rows, 'USDA texture classes') +
        '<p class="bt-small">Classes and boundaries: the USDA soil texture triangle (Soil Survey Manual, 2017). Drainage and water-held words are relative; infiltration rates are typical values, illustrative.</p>';
    }
    function render(announce, fromSlider){
      var sz = size(), w = words();
      svg.setAttribute('viewBox', '0 0 ' + sz.W + ' ' + sz.H);
      var phone = sz.W < 600;
      if(st.view === 'triangle'){
        var side = phone ? 0 : 270, triW = sz.W - side;
        var t = triangleSvg({ W: triW, H: phone ? sz.H - 160 : sz.H, pt: st.pt, cls: w.id, phone: phone });
        geo = t;
        var panel = '';
        if(phone){
          var py = sz.H - 150;
          panel = '<g class="st-panel">' + sampleSvg(st.pt, 10, py, 112, 112) + '<text class="st-cap" x="66" y="' + (py - 6) + '" text-anchor="middle">Magnified</text>' + barsSvg(w.P, 136, py - 4, sz.W - 136 - 52, true).replace(/Porosity \(pore space\)/, 'Porosity').replace('Permeability (drainage)', 'Drainage').replace('Water-holding capacity', 'Water held') + '</g>';
        } else {
          var px = triW + 6, top0 = Math.max(20, t.G.bottom - t.G.h - 20);
          panel = '<g class="st-panel" transform="translate(0 ' + top0.toFixed(1) + ')"><text class="st-class" x="' + px + '" y="24">' + esc(S.nameOf(w.id)) + '</text><text class="st-cap" x="' + px + '" y="48">Magnified sample</text>' + sampleSvg(st.pt, px, 58, 250, 170) + '<text class="st-legend" x="' + px + '" y="248"><tspan class="st-k-sand">◆ sand</tspan>  <tspan class="st-k-silt">● silt</tspan>  <tspan class="st-k-clay">▬ clay</tspan></text>' + barsSvg(w.P, px, 270, 250, false) + '</g>';
        }
        svg.innerHTML = '<defs><marker id="st-arr" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0L10 5L0 10z" class="st-arr-h"/></marker></defs>' + t.svg + panel;
        svg.setAttribute('role', 'application');
      } else {
        svg.innerHTML = '<defs><marker id="st-arr" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0L10 5L0 10z" class="st-arr-h"/></marker></defs>' + profileSvg({ W: sz.W, H: sz.H, sel: st.hz, interactive: true });
        svg.setAttribute('role', 'group');
      }
      if(!fromSlider || true) names.forEach(function(n, i){ if(sl[n].value() !== st.pt[i]) sl[n].set(st.pt[i]); });
      root().querySelectorAll('.st-view').forEach(function(b){ b.setAttribute('aria-pressed', String(b.getAttribute('data-v') === st.view)); });
      $('.st-sl').hidden = st.view !== 'triangle'; $('.st-presets').hidden = st.view !== 'triangle';
      cue.el.querySelector('.bt-cue-t').textContent = st.view === 'triangle' ? 'Drag the point on the triangle, or use the sliders.' : 'Tap a horizon of the soil profile.';
      T.explain($('.st-say'), '<b>' + esc(w.head) + '</b>', w.why);
      $('#' + nid + '-d').textContent = describe(w);
      nums(w);
      if(LS){
        LS.caption('<b>' + esc(w.head) + '</b>', 'explore');
        LS.pills(st.view === 'triangle' ? [{ k: 'Class', html: esc(S.nameOf(w.id)), tone: 'accent' }] : [], 'left', 'explore');
        LS.pills(st.view === 'triangle' ? [{ k: 'Sum', html: (st.pt[0] + st.pt[1] + st.pt[2]) + '%', tone: 'good' }] : [], 'right', 'explore');
        LS.root.querySelectorAll('.env-ls-why details.bt-why').forEach(function(d){ d.open = true; });
      }
      if(announce) say(w.head);
    }
    function studio(pane, s){
      LS = s;
      T.studioPane(pane, s, { stage: [$('.st-fig')], dock: [$('.st-ctl')], why: [$('.st-say')], details: [$('.st-nums')], moreLabel: 'Particle sizes' });
      s.root.addEventListener('click', onClick);
      host.removeEventListener('click', onClick);
      render();
      if(s.mode() === 'explore') s.hint({ target: svg.querySelector('.st-pt') || svg, text: 'Start here: drag the point' });
      if(window.ResizeObserver){ var t = null; new ResizeObserver(function(){ clearTimeout(t); t = setTimeout(function(){ render(); }, 60); }).observe($('.st-fig')); }
    }
    render();
    return { studio: studio };
  }

  /* After a step the drill clears its Check button (the focused element),
     and the figure redraws: keep focus in the drill, on the next step's
     first input, else on the feedback just given, never the page start. */
  function keepFocus(api){
    setTimeout(function(){
      var a = document.activeElement;
      if(a && a !== document.body && document.contains(a) && a.offsetParent !== null) return;
      var area = api.area, root = (area && area.closest('.ls-root')) || document;
      var steps = [].slice.call(root.querySelectorAll('form.cd-step'));
      var open = steps.filter(function(f){ return f.querySelector('button[type=submit]'); }).pop();
      var t = open && [].slice.call(open.querySelectorAll('input:not([readonly]):not([disabled])')).filter(function(x){ return x.offsetParent !== null; })[0];
      if(!t){ var fb = steps.length ? steps[steps.length - 1].querySelector('.cd-fb') : null; if(fb){ fb.setAttribute('tabindex', '-1'); t = fb; } }
      if(!t) t = root.querySelector('.cd-again');
      if(t) try{ t.focus({ preventScroll: true }); }catch(e){}
    }, 30);
  }
  /* ------------------------------------------------------ test yourself */
  function quiz(host, data){
    T.drill(host, data, { slug: SLUG, noun: 'drill',
      generate: function(r, ctx, type){ return S.generate(r, ctx, type); },
      types: [{ value: 'classify', label: 'Read the triangle' }, { value: 'missing', label: 'The missing percent' }, { value: 'porosity', label: 'Porosity and permeability' }, { value: 'horizons', label: 'Soil horizons' }, { value: 'erosion', label: 'Erosion and conservation' }, { value: 'percolation', label: 'Percolation test' }],
      typeLabel: 'Kind of problem',
      title: function(p){ return { classify: 'Read the texture triangle', missing: 'Find the missing percent', porosity: 'Water in soil', horizons: 'Soil horizons', erosion: 'Erosion and conservation', percolation: 'A percolation test' }[p.type] || 'Practice problem'; },
      extra: function(el, p, api){ api.fig = el; figure(el, p, {}); },
      onStep: function(s, right, api){ keepFocus(api); api.done = api.done || {}; api.done[s.key] = true; figure(api.fig, api.problem, api.done); }
    });
  }
  function figure(el, p, done){
    var f = p.figure || {}, phone = (window.innerWidth || 1280) <= 640, W = phone ? 400 : 640, H, inner, label;
    var g = p.givens || {};
    if(f.kind === 'triangle'){
      H = phone ? 380 : 470;
      var known = p.type === 'classify' || (done && done.ans);
      var pt = known ? [g.sand, g.silt, g.clay] : null;
      inner = triangleSvg({ W: W, H: H, pt: pt, cls: done && done['class'] ? g.cls : null, readouts: !!pt }).svg;
      label = 'Soil texture triangle' + (pt ? ' with a point at ' + pt[0] + '% sand, ' + pt[1] + '% silt, ' + pt[2] + '% clay' : '');
    } else if(f.kind === 'profile'){
      H = phone ? 420 : 400;
      inner = profileSvg({ W: W, H: H, ask: (f.ask || []).filter(function(id){ var k = f.ask.indexOf(id); return !(done && done['h' + (k + 1)]); }), interactive: false });
      label = 'A soil profile from the O horizon down to bedrock';
    } else if(f.kind === 'ring'){
      H = phone ? 240 : 220;
      inner = ringSvg(W, H, f, done && done.ans);
      label = 'A percolation test: water in a ring dropping ' + f.drop + ' cm in ' + f.mins + ' minutes';
    } else {
      H = phone ? 400 : 270;
      inner = columnsSvg(W, H);
      label = 'Water poured through columns of sand, loam and clay';
    }
    el.innerHTML = '<figure class="st-qfig"><svg class="st-svg" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(label) + '"><defs><marker id="st-arrq" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0L10 5L0 10z" class="st-arr-h"/></marker></defs>' + inner.replace(/url\(#st-arr\)/g, 'url(#st-arrq)') + '</svg></figure>';
  }
  /* Three columns of soil with water poured on top: drained water in the
     beaker under each (sand most, clay least), the water held in between. */
  function columnsSvg(W, H){
    var out = ['<text class="st-title" x="12" y="22">Same water poured on each</text>'], kinds = [['Sand', [92, 4, 4]], ['Loam', [40, 40, 20]], ['Clay', [15, 25, 60]]];
    var cw = Math.min(110, (W - 60) / 3 - 20), gap = (W - 3 * cw) / 4;
    kinds.forEach(function(k, i){
      var x = gap + i * (cw + gap), y = 46, ch = H * 0.42, P = S.props(k[1][0], k[1][1], k[1][2]);
      out.push('<rect class="st-col-w" x="' + x + '" y="' + y + '" width="' + cw + '" height="' + ch + '" rx="6"/>');
      out.push('<g clip-path="none">' + sampleSvg(k[1], x + 3, y + 3, cw - 6, ch - 6).replace(/st-clip/g, 'st-clip' + i) + '</g>');
      var by = y + ch + 14, bh = H - by - 30, fill = bh * Math.min(0.95, 0.2 + P.permeability * 0.8);
      out.push('<path class="st-drip" d="M' + (x + cw / 2) + ' ' + (y + ch) + ' v10"/>');
      out.push('<path class="st-beaker" d="M' + (x + 8) + ' ' + by + ' v' + bh + ' h' + (cw - 16) + ' v-' + bh + '"/><rect class="st-water" x="' + (x + 9) + '" y="' + (by + bh - fill) + '" width="' + (cw - 18) + '" height="' + fill + '"/>');
      out.push('<text class="st-col-t" x="' + (x + cw / 2) + '" y="' + (H - 10) + '" text-anchor="middle">' + k[0] + '</text>');
    });
    return out.join('');
  }
  function ringSvg(W, H, f, solved){
    var x = W / 2 - 70, top = 40, out = ['<text class="st-title" x="12" y="22">Percolation test</text>'];
    out.push('<rect class="st-soilblock" x="20" y="' + (top + 70) + '" width="' + (W - 40) + '" height="' + (H - top - 80) + '" rx="6"/>');
    out.push('<path class="st-ring" d="M' + x + ' ' + top + ' v' + 110 + ' M' + (x + 140) + ' ' + top + ' v' + 110 + '"/>');
    out.push('<rect class="st-water" x="' + (x + 2) + '" y="' + (top + 20) + '" width="136" height="50" opacity=".35"/><rect class="st-water" x="' + (x + 2) + '" y="' + (top + 40) + '" width="136" height="30"/>');
    out.push('<path class="st-dim" d="M' + (x + 156) + ' ' + (top + 20) + ' V' + (top + 40) + '" marker-end="url(#st-arr)"/><text class="st-col-t" x="' + (x + 166) + '" y="' + (top + 34) + '">' + f.drop + ' cm in ' + f.mins + ' min</text>');
    out.push('<text class="st-cap" x="' + (x + 70) + '" y="' + (top + 16) + '" text-anchor="middle">start</text>');
    if(solved) out.push('<text class="st-class" x="' + (x + 70) + '" y="' + (H - 16) + '" text-anchor="middle">' + M.fmt(f.drop / (f.mins / 60), 3) + ' cm/hr</text>');
    return out.join('');
  }
})();
