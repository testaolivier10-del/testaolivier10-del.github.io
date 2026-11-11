/* Borders lab page (docs/aphug-spec.md section 6). OWNED BY THIS TOOL ONLY
   (builder T4). Mounts into #app with ApHugTools; the model is
   ApHugMath.bordersLab (human-geography/assets/tools/math/borders-lab.js), the
   content human-geography/data/tools/borders-lab.json (served filtered as
   assets/tool-data/borders-lab.json). The frame is ApHugTools.modes (Explore,
   then Test yourself) on the Tool Studio.

   Explore, five scenes, each drawn at the page's own pixel size:
     Boundary types  an invented borderland (Country A to the north, Country
                     B to the south) and a timeline: Play runs the years, so
                     towns appear and the border is drawn before or after
                     them, along a language divide, through one people's land,
                     as a straight line, or left behind as a relict
     State shapes    the five outlines, with each one's usual challenge
     Forces          Country A with the forces that pull it together (arrows
                     in) and apart (arrows out); tap scenes to add them
     Sea zones       a cross-section from the coast: move a ship out and read
                     what the coastal state may do there (UNCLOS)
     Real cases      four real boundaries, each on its region's base map
                     (ApHugMap, with the border note), dated and worded as
                     "often classed as"
   Test yourself: ApHugTools.drill over the model's generate(). */
(function(){
  'use strict';
  var T = window.ApHugTools, M = window.ApHugMath;
  if(!T || !M || !M.bordersLab || M.bordersLab.stub) return;
  var B = M.bordersLab, esc = T.esc;
  function n1(v){ return Math.round(v * 10) / 10; }
  function phone(){ return (window.innerWidth || 1280) <= 640; }
  function tag(x, y, text, cls, W){
    var w = text.length * 7.6 + 14, h = 22, cx = Math.max(w / 2 + 3, Math.min((W || 9999) - w / 2 - 3, x));
    return '<g class="bl-tag ' + (cls || '') + '"><rect x="' + n1(cx - w / 2) + '" y="' + n1(y - h / 2) + '" width="' + n1(w) + '" height="' + h + '" rx="11"/><text x="' + n1(cx) + '" y="' + n1(y + 4.5) + '" text-anchor="middle">' + esc(text) + '</text></g>';
  }

  /* ----------------------------------------------------- the borderland */
  /* Design space 600 x 300: Country A north of the border, Country B south. */
  var TOWNS = [[60, 60], [150, 40], [250, 70], [350, 45], [450, 75], [540, 50], [100, 110], [200, 115], [300, 100], [410, 118], [520, 110],
    [70, 195], [170, 185], [270, 200], [380, 190], [480, 200], [560, 185], [120, 250], [230, 255], [330, 245], [440, 255], [540, 248]];
  function lineY(kind, x){
    if(kind === 'geometric') return 150;
    if(kind === 'consequent') return 150 + 30 * Math.sin(x / 55) + 12 * Math.sin(x / 19);
    if(kind === 'superimposed') return 150 + 4 * Math.sin(x / 90);
    return 150 + 16 * Math.sin(x / 70);   // the Tarn valley
  }
  // Language of each town: consequent follows the line; superimposed puts the Ardic people astride it.
  function lang(kind, i){
    var t = TOWNS[i];
    if(kind === 'consequent') return t[1] < lineY('consequent', t[0]) ? 'ar' : 'be';
    if(kind === 'superimposed') return inside(HOMELAND, t) ? 'ar' : 'be';
    return '';
  }
  function inside(poly, p){ var c = false; for(var i = 0, j = poly.length - 1; i < poly.length; j = i++){ var a = poly[i], b = poly[j]; if((a[1] > p[1]) !== (b[1] > p[1]) && p[0] < (b[0] - a[0]) * (p[1] - a[1]) / (b[1] - a[1]) + a[0]) c = !c; } return c; }
  function founded(f, i){ return f.settled + (i * 13) % 50; }
  function drawn(f){ return f.drawn; }
  function isRiver(f){ return f.extra !== 'geometric' && f.extra !== 'consequent' && f.extra !== 'superimposed'; }
  /* The land is drawn first (2026-11 tool visuals: "why the line runs
     there"): hills and woods, the Tarn where the border follows a river,
     where each people lives once they have settled, and towns as small
     clusters of houses. Design space 600 x 300. */
  var HILLS = [[22, 88], [44, 82], [66, 90], [384, 88], [404, 82], [560, 222], [582, 228], [292, 228], [314, 222]];
  var WOODS = [[128, 226], [146, 232], [138, 214], [470, 90], [488, 86], [300, 282], [318, 286], [582, 150]];
  // The Ardic homeland, which Corvia's line of 1885 cuts in two.
  var HOMELAND = [[180, 34], [250, 22], [330, 28], [410, 30], [446, 70], [436, 130], [448, 190], [430, 262], [350, 280], [260, 276], [196, 262], [172, 200], [184, 140], [168, 82]];
  function smooth(pts, P){
    // A closed curve through the points (midpoint quadratic Béziers).
    var q = pts.map(function(t){ return P(t[0], t[1]); }), n = q.length, mid = function(a, b){ return [n1((a[0] + b[0]) / 2), n1((a[1] + b[1]) / 2)]; };
    var d = 'M' + mid(q[n - 1], q[0]).join(' ');
    for(var i = 0; i < n; i++) d += 'Q' + q[i].join(' ') + ' ' + mid(q[i], q[(i + 1) % n]).join(' ');
    return d + 'Z';
  }
  function hill(P, x, y, k){ var p = P(x, y), s = Math.max(7, 11 * k); return '<path class="bl-hill" d="M' + n1(p[0] - s) + ' ' + n1(p[1] + s * 0.6) + 'L' + p[0] + ' ' + n1(p[1] - s * 0.8) + 'L' + n1(p[0] + s) + ' ' + n1(p[1] + s * 0.6) + 'Z"/>'; }
  function wood(P, x, y, k){ var p = P(x, y), s = Math.max(4, 6 * k); return '<circle class="bl-wood" cx="' + p[0] + '" cy="' + p[1] + '" r="' + n1(s) + '"/>'; }
  // A town: two or three small houses.
  function town(P, t, i, k, cls){
    var p = P(t[0], t[1]), s = Math.max(4.2, 6 * k), o = '';
    var hs = i % 3 === 0 ? [[-1.1, 0.25], [0, -0.35], [1.1, 0.25]] : [[-0.6, 0], [0.6, -0.2]];
    hs.forEach(function(h){ var x = p[0] + h[0] * s * 1.3, y = p[1] + h[1] * s; o += '<path d="M' + n1(x - s * 0.62) + ' ' + n1(y + s * 0.7) + 'V' + n1(y - s * 0.1) + 'L' + n1(x) + ' ' + n1(y - s * 0.8) + 'L' + n1(x + s * 0.62) + ' ' + n1(y - s * 0.1) + 'V' + n1(y + s * 0.7) + 'Z"/>'; });
    return '<g class="bl-town' + cls + '">' + o + '</g>';
  }
  function landSvg(W, H, f, year, o){
    o = o || {};
    var th = o.timeline === false ? 0 : 74, k = Math.min((W - 16) / 600, (H - th - 16) / 300), ox = (W - 600 * k) / 2, oy = Math.max(8, (H - th - 300 * k) / 2);
    var P = function(x, y){ return [n1(ox + x * k), n1(oy + y * k)]; }, out = [];
    var x0 = P(0, 0), x1 = P(600, 300), cid = 'bl-clip-' + (landSvg.n = (landSvg.n || 0) + 1);
    out.push('<clipPath id="' + cid + '"><rect x="' + x0[0] + '" y="' + x0[1] + '" width="' + n1(x1[0] - x0[0]) + '" height="' + n1(x1[1] - x0[1]) + '" rx="10"/></clipPath>');
    out.push('<rect class="bl-land" x="' + x0[0] + '" y="' + x0[1] + '" width="' + n1(x1[0] - x0[0]) + '" height="' + n1(x1[1] - x0[1]) + '" rx="10"/>');
    var g = [], settled = year >= f.settled;
    // Where each people lives, once they are there.
    if(f.extra === 'consequent' && settled){
      var top = [], bot = [];
      for(var x = 0; x <= 600; x += 10){ top.push(P(x, lineY('consequent', x)).join(' ')); }
      g.push('<path class="bl-area is-ar" d="M' + P(0, 0).join(' ') + 'L' + top.join('L') + 'L' + P(600, 0).join(' ') + 'Z"/>');
      g.push('<path class="bl-area is-be" d="M' + P(0, 300).join(' ') + 'L' + top.join('L') + 'L' + P(600, 300).join(' ') + 'Z"/>');
      void bot;
    }
    if(f.extra === 'superimposed' && settled){
      g.push('<rect class="bl-area is-be" x="' + x0[0] + '" y="' + x0[1] + '" width="' + n1(x1[0] - x0[0]) + '" height="' + n1(x1[1] - x0[1]) + '"/>');
      g.push('<path class="bl-area is-ar bl-home" d="' + smooth(HOMELAND, P) + '"/>');
    }
    // Hills and woods; where the border is geometric, a ridge and a river that the straight line ignores.
    HILLS.forEach(function(h){ g.push(hill(P, h[0], h[1], k)); });
    WOODS.forEach(function(w){ g.push(wood(P, w[0], w[1], k)); });
    if(f.extra === 'geometric'){
      [[300, 128], [318, 140], [306, 156], [326, 166], [312, 178]].forEach(function(h){ g.push(hill(P, h[0], h[1], k * 1.15)); });
      var rn = []; for(var y = 0; y <= 300; y += 10) rn.push(P(500 + 9 * Math.sin(y / 40), y).join(' '));
      g.push('<path class="bl-river" d="M' + rn.join('L') + '"/>');
    }
    if(isRiver(f)){
      var rv = []; for(var x3 = 0; x3 <= 600; x3 += 10) rv.push(P(x3, lineY('river', x3) + 9).join(' '));
      g.push('<path class="bl-river is-wide" d="M' + rv.join('L') + '"/>');
    }
    out.push('<g clip-path="url(#' + cid + ')">' + g.join('') + '</g>');
    var joined = f.extra === 'relict' ? f.drawn + 50 : Infinity, isLine = year >= f.drawn;
    if(isLine){
      var pts = []; for(var x2 = 0; x2 <= 600; x2 += 6) pts.push(P(x2, lineY(f.extra, x2)).join(' '));
      out.push('<path class="bl-border' + (year >= joined ? ' is-relict' : '') + '" d="M' + pts.join('L') + '"/>');
      if(f.extra === 'relict' && year >= joined) [120, 300, 480].forEach(function(xx){ var q = P(xx, lineY('relict', xx)); out.push('<rect class="bl-post" x="' + n1(q[0] - 5) + '" y="' + n1(q[1] - 5) + '" width="10" height="10" rx="1.5"/>'); });
      if(f.extra === 'geometric'){ var gq = P(600, 150); out.push(tag(gq[0] - 28, gq[1] - 16, '41°N', 'is-line', W)); }
      if(f.extra === 'superimposed' && o.name !== false){ var sq = P(600, 150); out.push(tag(sq[0] - 60, sq[1] - 18, 'Corvia\'s line', 'is-line', W)); }
    }
    TOWNS.forEach(function(t, i){
      if(year < founded(f, i)) return;
      var L = lang(f.extra, i);
      out.push(town(P, t, i, k, L ? ' is-' + L : ''));
    });
    var na = P(10, 18), nb = P(10, 290), one = year >= joined;
    out.push('<text class="bl-cname" x="' + n1(na[0] + 8) + '" y="' + n1(na[1] + 8) + '">' + (one ? 'One country since ' + joined : 'Country A') + '</text>');
    if(!one) out.push('<text class="bl-cname" x="' + n1(nb[0] + 8) + '" y="' + n1(nb[1] - 4) + '">Country B</text>');
    // The timeline sits right under the land, not at the foot of the stage.
    if(th) out.push(timeline(W, n1(oy + 300 * k + 6), f, year, joined));
    return out.join('');
  }
  var Y0 = 1700, Y1 = 2000;
  function timeline(W, top, f, year, joined){
    var L = 24, R = W - 24, X = function(y){ return n1(L + (R - L) * (Math.max(Y0, Math.min(Y1, y)) - Y0) / (Y1 - Y0)); }, o = [], yA = top + 26;
    o.push('<line class="bl-axis" x1="' + L + '" y1="' + yA + '" x2="' + R + '" y2="' + yA + '"/>');
    o.push('<rect class="bl-span" x="' + X(f.settled) + '" y="' + (yA - 6) + '" width="' + n1(X(f.settled + 60) - X(f.settled)) + '" height="12" rx="6"/>');
    var ev = [{ y: f.settled, t: String(f.settled), c: 'is-town' }, { y: f.drawn, t: String(f.drawn), c: 'is-line' }];
    if(isFinite(joined)) ev.push({ y: joined, t: String(joined), c: 'is-join' });
    ev.sort(function(a, b){ return a.y - b.y; });
    var lastX = -99, row = 0;
    ev.forEach(function(e){
      var x = +X(e.y); row = x - lastX < 48 ? 1 - row : 0; lastX = x;
      o.push('<circle class="bl-ev ' + e.c + '" cx="' + x + '" cy="' + yA + '" r="6"/><text class="bl-yr" x="' + x + '" y="' + (row ? yA + 24 : yA - 12) + '" text-anchor="middle">' + e.t + '</text>');
    });
    if(year != null) o.push('<path class="bl-now" d="M' + X(year) + ' ' + (yA - 16) + 'V' + (yA + 10) + '"/>');
    return o.join('');
  }
  function landLegend(f){
    var it = ['<li><span class="bl-sw is-town is-house" aria-hidden="true"></span>Towns settled (from ' + f.settled + ')</li>', '<li><span class="bl-sw is-line" aria-hidden="true"></span>Border drawn (' + f.drawn + ')</li>'];
    if(f.extra === 'relict') it.push('<li><span class="bl-sw is-join" aria-hidden="true"></span>Countries join (' + (f.drawn + 50) + ')</li><li><span class="bl-sw is-post" aria-hidden="true"></span>Old customs post</li>');
    if(f.extra === 'consequent' || f.extra === 'superimposed') it.push('<li><span class="bl-sw is-ar" aria-hidden="true"></span>Ardic-speaking town' + (f.extra === 'superimposed' ? ' (shaded: the Ardic homeland)' : '') + '</li><li><span class="bl-sw is-be" aria-hidden="true"></span>Bessan-speaking town</li>');
    if(isRiver(f)) it.push('<li><span class="bl-sw is-river" aria-hidden="true"></span>Tarn River</li>');
    if(f.extra === 'geometric') it.push('<li><span class="bl-sw is-river" aria-hidden="true"></span>River</li>');
    it.push('<li><span class="bl-sw is-hill" aria-hidden="true"></span>Hills</li>');
    return '<ul class="bl-legend" aria-label="Legend">' + it.join('') + '</ul>';
  }

  /* --------------------------------------------------------- the shapes */
  /* Each outline has a capital and the reach from it to its farthest edge
     (2026-11 tool visuals): rings every 300 km out from the capital, clipped
     to the land, so a compact state is covered in a few rings and an
     elongated one needs many; the far edge is named with its distance. One
     unit of the 200 x 140 drawing is 12 km (invented states). `via` bends
     the route around the state inside a perforated one; a fragmented one
     crosses the sea. */
  var KM = 12, RING = 25;
  var REACH = {
    compact: { cap: [100, 72] },
    elongated: { cap: [62, 72] },
    prorupted: { cap: [62, 62] },
    perforated: { cap: [54, 40], via: [[72, 100]] },
    fragmented: { cap: [106, 50] }
  };
  function verts(id){ var v = []; B.SHAPES[id].d.forEach(function(d, i){ if(B.SHAPES[id].hole && i === B.SHAPES[id].hole) return; var n = d.match(/-?[\d.]+/g).map(Number); for(var j = 0; j + 1 < n.length; j += 2) v.push([n[j], n[j + 1]]); }); return v; }
  function reach(id){
    var R = REACH[id], c = R.cap, best = null, len = function(path){ var L = 0; for(var i = 1; i < path.length; i++) L += Math.hypot(path[i][0] - path[i - 1][0], path[i][1] - path[i - 1][1]); return L; };
    verts(id).forEach(function(v){ var path = [c].concat(R.via || [], [v]), L = len(path); if(!best || L > best.L) best = { path: path, L: L }; });
    best.km = Math.round(best.L * KM / 50) * 50;
    return best;
  }
  function thouS(n){ return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ','); }
  function shapeSvg(W, H, id, o){
    o = o || {};
    var S = B.SHAPES[id], k = Math.min((W - 24) / 200, (H - 24) / 140), ox = (W - 200 * k) / 2, oy = (H - 140 * k) / 2;
    var tr = 'translate(' + n1(ox) + ' ' + n1(oy) + ') scale(' + n1(k * 100) / 100 + ')' + (o.flip ? ' translate(200 0) scale(-1 1)' : '') + (o.rot === 180 ? ' rotate(180 100 70)' : '');
    var shapes = S.d.map(function(d, i){ return '<path class="bl-shape' + (S.hole && i === S.hole ? ' is-inner' : '') + '" d="' + d + '"/>'; }).join('');
    var out = '';
    if(o.labels){
      // Explore: the sea behind a fragmented state, the rings of reach, the route and the capital.
      var r = reach(id), cap = REACH[id].cap, cid = 'bl-sh-' + (shapeSvg.n = (shapeSvg.n || 0) + 1), outer = S.d.filter(function(d, i){ return !(S.hole && i === S.hole); }).map(function(d){ return '<path d="' + d + '"/>'; }).join('');
      var rings = ''; for(var rr = RING; rr < r.L + RING; rr += RING) rings += '<circle class="bl-ring' + ((rr / RING) % 2 ? '' : ' is-alt') + '" cx="' + cap[0] + '" cy="' + cap[1] + '" r="' + rr + '"/>';
      var bands = ''; for(var rb = Math.ceil(r.L / RING) * RING; rb >= RING; rb -= RING) bands += '<circle class="bl-band b' + Math.min(6, rb / RING) + '" cx="' + cap[0] + '" cy="' + cap[1] + '" r="' + rb + '"/>';
      if(id === 'fragmented') out += '<rect class="bl-sea" x="0" y="0" width="' + W + '" height="' + H + '" rx="10"/>';
      out += '<g transform="' + tr + '"><clipPath id="' + cid + '">' + outer + '</clipPath>' + shapes.replace(/class="bl-shape"/g, 'class="bl-shape is-land"') +
        '<g clip-path="url(#' + cid + ')">' + bands + rings + '</g>' + (S.hole ? '<path class="bl-shape is-inner" d="' + S.d[S.hole] + '"/>' : '') +
        '<path class="bl-route' + (id === 'fragmented' ? ' is-sea' : '') + '" d="M' + r.path.map(function(q){ return q.join(' '); }).join('L') + '"/></g>';
      var Pp = function(q){ return [n1(ox + q[0] * k), n1(oy + q[1] * k)]; }, cp = Pp(cap), far = Pp(r.path[r.path.length - 1]);
      out += '<circle class="bl-far" cx="' + far[0] + '" cy="' + far[1] + '" r="6"/>';
      out += ICON.star(cp, Math.max(0.9, Math.min(1.3, k / 2.6)));
      out += tag(cp[0], n1(cp[1] + 22), 'Capital', 'is-line', W);
      var fy = far[1] < oy + 70 * k ? far[1] - 20 : far[1] + 22;
      out += tag(far[0], n1(fy), 'Far edge: ' + thouS(r.km) + ' km', 'is-out', W);
    } else out = '<g transform="' + tr + '">' + shapes + '</g>';
    if(o.labels && id === 'prorupted') out += tag(n1(ox + (o.flip ? 200 - 150 : 150) * k), n1(oy + 56 * k) - 16, 'Proruption', 'is-line', W);
    if(o.labels && id === 'perforated') out += tag(n1(ox + 104 * k), n1(oy + 104 * k), 'State inside', 'is-line', W);
    return out;
  }
  function shapeLegend(id){
    var r = reach(id);
    return '<ul class="bl-legend" aria-label="Legend"><li>' + ico('star') + 'Capital</li><li><span class="bl-sw is-ring" aria-hidden="true"></span>Each ring: 300 km farther from the capital</li><li><span class="bl-sw is-route" aria-hidden="true"></span>To the farthest edge: ' + thouS(r.km) + ' km' + (id === 'fragmented' ? ' (dashed: across the sea)' : id === 'perforated' ? ' (around the state inside)' : '') + '</li></ul>';
  }

  /* --------------------------------------------------------- the forces */
  var CA = { north: [[60, 40], [250, 20], [300, 120], [180, 160], [70, 140]], northeast: [[250, 20], [470, 30], [520, 110], [400, 150], [300, 120]], east: [[520, 110], [560, 230], [430, 260], [400, 150]],
    capital: [[300, 120], [400, 150], [430, 260], [320, 270], [260, 200]], west: [[70, 140], [180, 160], [260, 200], [200, 290], [50, 260]], central: [[180, 160], [300, 120], [260, 200]],
    south: [[200, 290], [260, 200], [320, 270], [300, 370], [160, 360]], coast: [[320, 270], [430, 260], [560, 230], [540, 340], [300, 370]] };
  var CEN = { north: [172.8, 89.4], northeast: [385.2, 79.4], east: [478.7, 187.7], capital: [345.3, 200.5], west: [145.3, 216], central: [246.7, 160], south: [251.9, 302.4], coast: [431.7, 304.4] };
  var FSC = [
    { short: 'A national railway', where: ['north', 'east', 'west', 'south', 'coast', 'northeast'] },
    { short: 'One national history', where: ['north', 'northeast', 'east', 'west', 'south', 'coast'] },
    { short: 'A team from everywhere', where: ['north', 'east', 'west', 'coast'] },
    { short: 'Clinics for poor provinces', where: ['south', 'west'] },
    { short: 'A separatist movement', where: ['east'] },
    { short: 'Mountains cut off a region', where: ['west'] },
    { short: 'Investment in one region only', where: ['south'] },
    { short: 'A neighbor\'s claim', where: ['northeast'] },
    { short: 'Attacks on rail lines', where: ['coast'] }
  ];
  /* Forces are drawn as things on the land of the drawn Country A
     (figures/base/country-a.json, as the diffusion lab uses): a rail hub at
     the capital, flags, clinics, factories, a mountain range that cuts the
     Western Uplands off, a neighbor's claim, a region of another language.
     Green marks pull the state together, orange ones pull it apart; a region
     pulled away is shaded. Until the base arrives, the old outline stands in. */
  var BASEA = null, ONBASEA = [];
  function needBaseA(){
    if(needBaseA.p) return needBaseA.p;
    needBaseA.p = fetch((window.ApHugBase || '../') + 'figures/base/country-a.json').then(function(r){ if(!r.ok) throw new Error(r.status); return r.json(); })
      .then(function(b){ BASEA = b; ONBASEA.forEach(function(fn){ try { fn(); } catch(e){} }); }, function(){});
    return needBaseA.p;
  }
  // The mountain range between the Western Uplands and the rest (base pixels).
  var RANGE = [[178, 160], [186, 182], [192, 204], [200, 226], [208, 248], [216, 268]];
  function centers(){ var c = {}; if(BASEA) BASEA.features.forEach(function(f){ c[f.id] = f.c; }); else Object.keys(CEN).forEach(function(id){ c[id] = CEN[id]; }); return c; }
  function railD(a, b){ return 'M' + a.join(' ') + 'L' + b.join(' '); }
  function rail(a, b, cls){ var d = railD(a, b); return '<path class="bl-rail-b ' + (cls || '') + '" d="' + d + '"/><path class="bl-rail-t ' + (cls || '') + '" d="' + d + '"/>'; }
  var ICON = {
    flag: function(p, s, cls){ var x = p[0], y = p[1]; return '<g class="bl-ic ' + cls + '"><path class="bl-pole" d="M' + n1(x - 5 * s) + ' ' + n1(y + 9 * s) + 'V' + n1(y - 10 * s) + '"/><path class="bl-fl" d="M' + n1(x - 5 * s) + ' ' + n1(y - 10 * s) + 'h' + n1(13 * s) + 'l-3 ' + n1(4 * s) + ' 3 ' + n1(4 * s) + 'h' + n1(-13 * s) + 'z"/></g>'; },
    ball: function(p, s, cls){ return '<g class="bl-ic ' + cls + '"><circle class="bl-ball" cx="' + p[0] + '" cy="' + p[1] + '" r="' + n1(7 * s) + '"/><path class="bl-fl" d="M' + p[0] + ' ' + n1(p[1] - 3 * s) + 'l' + n1(3 * s) + ' ' + n1(2.2 * s) + '-' + n1(1.2 * s) + ' ' + n1(3.4 * s) + 'h-' + n1(3.6 * s) + 'l-' + n1(1.2 * s) + '-' + n1(3.4 * s) + 'z"/></g>'; },
    clinic: function(p, s, cls){ var x = p[0], y = p[1]; return '<g class="bl-ic ' + cls + '"><rect class="bl-bld" x="' + n1(x - 9 * s) + '" y="' + n1(y - 8 * s) + '" width="' + n1(18 * s) + '" height="' + n1(15 * s) + '" rx="2"/><path class="bl-plus" d="M' + x + ' ' + n1(y - 5 * s) + 'v' + n1(9 * s) + 'M' + n1(x - 4.5 * s) + ' ' + n1(y - 0.5 * s) + 'h' + n1(9 * s) + '"/></g>'; },
    factory: function(p, s, cls){ var x = p[0] - 10 * s, y = p[1] + 7 * s; return '<g class="bl-ic ' + cls + '"><path class="bl-fac" d="M' + n1(x) + ' ' + n1(y) + 'v' + n1(-10 * s) + 'l' + n1(6 * s) + ' ' + n1(-4 * s) + 'v' + n1(4 * s) + 'l' + n1(6 * s) + ' ' + n1(-4 * s) + 'v' + n1(4 * s) + 'h' + n1(2 * s) + 'v' + n1(-9 * s) + 'h' + n1(4 * s) + 'v' + n1(19 * s) + 'z"/></g>'; },
    down: function(p, s, cls){ var x = p[0], y = p[1]; return '<g class="bl-ic ' + cls + '"><path class="bl-dn" d="M' + n1(x - 3 * s) + ' ' + n1(y - 9 * s) + 'h' + n1(6 * s) + 'v' + n1(9 * s) + 'h' + n1(4 * s) + 'l-' + n1(7 * s) + ' ' + n1(8 * s) + '-' + n1(7 * s) + '-' + n1(8 * s) + 'h' + n1(4 * s) + 'z"/></g>'; },
    blast: function(p, s, cls){ var x = p[0], y = p[1], q = []; for(var i = 0; i < 16; i++){ var r = (i % 2 ? 4 : 10) * s, t = i * Math.PI / 8; q.push(n1(x + r * Math.cos(t)) + ' ' + n1(y + r * Math.sin(t))); } return '<path class="bl-ic bl-blast ' + cls + '" d="M' + q.join('L') + 'Z"/>'; },
    mtn: function(p, s){ var x = p[0], y = p[1]; return '<path class="bl-mtn" d="M' + n1(x - 11 * s) + ' ' + n1(y + 8 * s) + 'L' + x + ' ' + n1(y - 10 * s) + 'L' + n1(x + 11 * s) + ' ' + n1(y + 8 * s) + 'Z"/><path class="bl-snow" d="M' + n1(x - 4 * s) + ' ' + n1(y - 3.5 * s) + 'L' + x + ' ' + n1(y - 10 * s) + 'L' + n1(x + 4 * s) + ' ' + n1(y - 3.5 * s) + 'Z"/>'; },
    star: function(p, s){ var q = []; for(var i = 0; i < 10; i++){ var r = (i % 2 ? 4.2 : 10) * s, t = -Math.PI / 2 + i * Math.PI / 5; q.push(n1(p[0] + r * Math.cos(t)) + ' ' + n1(p[1] + r * Math.sin(t))); } return '<path class="bl-capital" d="M' + q.join('L') + 'Z"/>'; }
  };
  // A legend mark: the same drawing, small.
  function ico(kind){
    var s = 0.8, p = [12, 9], body;
    if(kind === 'rail') body = '<path class="bl-rail-b" d="M1 9H23"/><path class="bl-rail-t" d="M1 9H23"/>';
    else if(kind === 'railcut') body = '<path class="bl-rail-b" d="M1 9H9"/><path class="bl-rail-t" d="M1 9H9"/>' + ICON.mtn([16, 10], 0.65);
    else if(kind === 'claim') body = '<path class="bl-claim" d="M2 3H22V15H2Z"/>';
    else if(kind === 'sep') body = '<rect class="bl-prov is-hot is-sep" x="2" y="2" width="20" height="14" rx="2"/>';
    else if(kind === 'hot') body = '<rect class="bl-prov is-hot" x="2" y="2" width="20" height="14" rx="2"/>';
    else if(kind === 'mtn') body = ICON.mtn([12, 10], 0.7);
    else if(kind === 'star') body = ICON.star([12, 9], 0.8);
    else { var parts = kind.split(' '); body = ICON[parts[0]](p, s, parts[1] || ''); }
    return '<svg class="bl-ico" viewBox="0 0 24 18" aria-hidden="true">' + body + '</svg>';
  }
  function forcesLegend(on){
    var it = [['star', 'Capital, the rail hub']], has = function(i){ return on.indexOf(i) > -1; };
    if(has(0)) it.push(['rail', 'National railway']);
    if(has(1)) it.push(['flag is-in', 'Same history taught everywhere']);
    if(has(2)) it.push(['ball is-in', 'Crowds cheer the national team']);
    if(has(3)) it.push(['clinic is-in', 'New clinic']);
    if(has(4)) it.push(['sep', 'Bessan-speaking region']);
    if(has(5)) it.push([has(0) ? 'railcut' : 'mtn', 'Mountains, snowed in five months a year']);
    if(has(6)) it.push(['factory is-out', 'New factory'], ['down is-out', 'Incomes falling']);
    if(has(7)) it.push(['claim', 'Land Country B claims']);
    if(has(8)) it.push(['blast is-out', 'Rail line bombed']);
    if(on.some(function(i){ return B.SCENES[i].force === 'centrifugal'; })) it.push(['hot', 'A region pulled away']);
    return '<ul class="bl-legend" aria-label="Legend">' + it.map(function(x){ return '<li>' + ico(x[0]) + esc(x[1]) + '</li>'; }).join('') + '<li class="bl-key-c"><span class="bl-sw is-in" aria-hidden="true"></span>Green: pulls together <span class="bl-sw is-out" aria-hidden="true"></span>Orange: pulls apart</li></ul>';
  }
  function forcesSvg(W, H, on){
    var k = Math.min((W - 20) / 510, (H - 20) / 350), ox = (W - 510 * k) / 2 - 50 * k, oy = (H - 350 * k) / 2 - 20 * k;
    var P = function(p){ return [n1(ox + p[0] * k), n1(oy + p[1] * k)]; }, out = [], s = Math.max(0.85, Math.min(1.35, k * 1.25));
    var has = function(i){ return on.indexOf(i) > -1; };
    out.push('<defs><pattern id="bl-hatch" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect class="bl-hatch-bg" width="8" height="8"/><path class="bl-hatch-l" d="M0 0V8"/></pattern></defs>');
    var hot = {}; on.forEach(function(i){ if(B.SCENES[i].force === 'centrifugal') FSC[i].where.forEach(function(w){ hot[w] = true; }); });
    if(BASEA){
      var SC = BASEA.scenery, cid = 'bl-ca-' + (forcesSvg.n = (forcesSvg.n || 0) + 1);
      var land = BASEA.features.map(function(f){ return '<path d="' + f.d + '"/>'; }).join('');
      out.push('<g transform="translate(' + n1(ox) + ' ' + n1(oy) + ') scale(' + n1(k * 1000) / 1000 + ')"><clipPath id="' + cid + '">' + land + '</clipPath>' +
        '<path class="bl-sea2" d="' + SC.sea + '"/>' + (SC.borders || []).map(function(d){ return '<path class="bl-nb" d="' + d + '"/>'; }).join('') +
        BASEA.features.map(function(f){ return '<path class="bl-prov' + (hot[f.id] ? ' is-hot' : '') + (f.id === 'east' && has(4) ? ' is-sep' : '') + '" d="' + f.d + '"/>'; }).join('') +
        '<g clip-path="url(#' + cid + ')">' + (SC.rivers || []).map(function(d){ return '<path class="bl-river2" d="' + d + '"/>'; }).join('') + (SC.lake ? '<path class="bl-lake" d="' + SC.lake + '"/>' : '') + '</g>' +
        (has(7) ? BASEA.features.filter(function(f){ return f.id === 'northeast'; }).map(function(f){ return '<path class="bl-claim" d="' + f.d + '"/>'; }).join('') : '') + '</g>');
      (SC.hills || []).forEach(function(h){ var q = P(h); out.push('<path class="bl-hill" d="M' + n1(q[0] - 6 * s) + ' ' + n1(q[1] + 4 * s) + 'L' + q[0] + ' ' + n1(q[1] - 5 * s) + 'L' + n1(q[0] + 6 * s) + ' ' + n1(q[1] + 4 * s) + 'Z"/>'); });
      (SC.trees || []).forEach(function(t){ var q = P(t); out.push('<circle class="bl-wood" cx="' + q[0] + '" cy="' + q[1] + '" r="' + n1(4 * s) + '"/>'); });
    } else {
      Object.keys(CA).forEach(function(id){ out.push('<path class="bl-prov' + (hot[id] ? ' is-hot' : '') + '" d="M' + CA[id].map(function(q){ return P(q).join(' '); }).join('L') + 'Z"/>'); });
    }
    var C = centers(), cap = P(C.capital), at = function(id, dx, dy){ var q = P(C[id]); return [n1(q[0] + (dx || 0) * s), n1(q[1] + (dy || 0) * s)]; };
    // The range meets the line from the capital to the Western Uplands here.
    var cut = P([197, 214]);
    if(has(5)) RANGE.forEach(function(r, i){ out.push(ICON.mtn(P(r), s * (i % 2 ? 0.9 : 1.1))); });
    if(has(0)) FSC[0].where.forEach(function(w){
      var end = at(w);
      if(w === 'west' && has(5)){ out.push(rail(cap, cut)); out.push('<path class="bl-rail-cut" d="' + railD(cut, end) + '"/>'); }
      else out.push(rail(cap, end, has(8) && w === 'coast' ? 'is-hit' : ''));
      out.push('<circle class="bl-stn" cx="' + end[0] + '" cy="' + end[1] + '" r="' + n1(4 * s) + '"/>');
    });
    if(has(8)){ var c0 = at('coast'); if(!has(0)) out.push(rail(cap, c0, 'is-hit')); var m = [n1((cap[0] + c0[0]) / 2), n1((cap[1] + c0[1]) / 2)]; out.push(ICON.blast(m, s, 'is-out')); out.push(ICON.blast([n1(m[0] + (c0[0] - m[0]) * 0.55), n1(m[1] + (c0[1] - m[1]) * 0.55)], s * 0.8, 'is-out')); }
    if(has(1)) FSC[1].where.forEach(function(w){ out.push(ICON.flag(at(w, -14, -10), s, 'is-in')); });
    if(has(2)) FSC[2].where.forEach(function(w){ out.push(ICON.ball(at(w, 14, -10), s, 'is-in')); });
    if(has(3)) FSC[3].where.forEach(function(w){ out.push(ICON.clinic(at(w, 16, 12), s, 'is-in')); });
    if(has(4)) out.push(ICON.flag(at('east', 0, -22), s * 1.2, 'is-out'));
    if(has(6)){ [[-30, -16], [-34, 8], [26, 18]].forEach(function(d){ out.push(ICON.factory(at('capital', d[0], d[1]), s, 'is-out')); }); out.push(ICON.down(at('south', 18, -4), s * 1.1, 'is-out')); }
    if(has(7)){ var ne = at('northeast'), tip = [ne[0], n1(Math.max(4, ne[1] - 22 * s))], from = [ne[0] + 4, n1(Math.max(2, oy + 2))];
      out.push('<path class="bl-claim-a" d="M' + from.join(' ') + 'L' + tip.join(' ') + '"/><path class="bl-claim-h" d="M' + tip.join(' ') + 'l-6 -9h12z"/>'); }
    out.push(ICON.star(cap, s * 1.15));
    out.push(tag(cap[0], n1(cap[1] + 24 * s), 'Capital', 'is-line', W));
    // Name the regions pulled away, so the scene's words find their place on the map.
    var named = {};
    Object.keys(hot).forEach(function(w){ if(named[w] || !BASEA) return; named[w] = 1; var f = BASEA.features.filter(function(x){ return x.id === w; })[0], q = at(w, 0, w === 'east' ? 18 : w === 'south' ? -26 : 22); if(f) out.push(tag(q[0], q[1], f.name, 'is-out', W)); });
    return out.join('');
  }

  /* ------------------------------------------------------------ the sea */
  var STOPS = [[0, 0], [12, 0.2], [24, 0.36], [200, 0.82], [260, 1]];
  function seaX(nm, L, R){ for(var i = 1; i < STOPS.length; i++) if(nm <= STOPS[i][0]){ var a = STOPS[i - 1], b = STOPS[i]; return L + (R - L) * (a[1] + (b[1] - a[1]) * (nm - a[0]) / (b[0] - a[0])); } return R; }
  function seaSvg(W, H, nm, o){
    o = o || {};
    var land = Math.max(44, W * 0.12), L = land, R = W - 14, top = 34, bot = H - 52, out = [], narrow = W < 420;
    out.push('<rect class="bl-sea" x="' + n1(L) + '" y="' + top + '" width="' + n1(R - L) + '" height="' + (bot - top) + '"/>');
    out.push('<path class="bl-coast" d="M0 ' + (top - 8) + 'H' + n1(L - 6) + 'Q' + n1(L + 4) + ' ' + ((top + bot) / 2) + ' ' + n1(L - 6) + ' ' + (bot + 8) + 'H0Z"/>');
    var bounds = [0, 12, 24, 200, 260];
    for(var i = 0; i < 4; i++){
      var a = seaX(bounds[i], L, R), b = seaX(bounds[i + 1], L, R), on = !o.quiet && nm != null && B.zoneAt(nm) === B.ZONES[i];
      out.push('<rect class="bl-zone z' + (i + 1) + (on ? ' is-on' : '') + '" x="' + n1(a) + '" y="' + top + '" width="' + n1(b - a) + '" height="' + (bot - top) + '"/>');
      out.push('<g class="bl-znum"><circle cx="' + n1((a + b) / 2) + '" cy="' + (top + 22) + '" r="12"/><text x="' + n1((a + b) / 2) + '" y="' + (top + 27) + '" text-anchor="middle">' + (i + 1) + '</text></g>');
      if(i < 3) out.push('<path class="bl-lim" d="M' + n1(b) + ' ' + (top - 4) + 'V' + (bot + 6) + '"/><text class="bl-nm" x="' + n1(b) + '" y="' + (bot + 22) + '" text-anchor="middle">' + bounds[i + 1] + '</text>');
    }
    out.push('<text class="bl-nm" x="' + n1(L) + '" y="' + (bot + 22) + '" text-anchor="middle">0</text>');
    out.push('<text class="bl-cap2" x="' + n1(L) + '" y="' + (bot + 42) + '">' + (narrow ? 'Nautical miles (not to scale)' : 'Nautical miles from the baseline (not to scale)') + '</text>');
    out.push('<text class="bl-cap2" x="6" y="' + (top - 16) + '">Coast</text>');
    if(nm != null){
      var sx = seaX(nm, L, R), sy = (top + bot) / 2 + 14;
      out.push('<g class="bl-ship"><path d="M' + n1(sx - 15) + ' ' + n1(sy) + 'H' + n1(sx + 15) + 'L' + n1(sx + 9) + ' ' + n1(sy + 9) + 'H' + n1(sx - 10) + 'Z"/><rect x="' + n1(sx - 6) + '" y="' + n1(sy - 10) + '" width="11" height="10" rx="1"/></g>');
    }
    return out.join('');
  }
  function seaKey(nm){
    return '<ol class="bl-zkey">' + B.ZONES.map(function(z, i){ var on = nm != null && B.zoneAt(nm) === z; return '<li' + (on ? ' class="is-on"' : '') + '><b>' + (i + 1) + '. ' + esc(z.name) + '</b> (' + (i === 0 ? 'baseline to 12 nautical miles' : i === 1 ? '12 to 24 nautical miles' : i === 2 ? '12 to 200 nautical miles, overlapping the contiguous zone' : 'beyond 200 nautical miles') + ')</li>'; }).join('') + '</ol>';
  }

  /* ------------------------------------------------------- real cases */
  var BASES = {};
  /* The tool page loads hug-map.js (build-aphug.mjs toolShell). */
  function needMap(){ return Promise.resolve(window.ApHugMap); }
  function base(id){
    if(BASES[id]) return BASES[id];
    BASES[id] = needMap().then(function(){ return fetch((window.ApHugBase || '../') + 'figures/base/' + id + '.json'); }).then(function(r){ if(!r.ok) throw new Error(r.status); return r.json(); });
    return BASES[id];
  }
  function realHtml(x, b){
    var Map = window.ApHugMap, spec = { base: x.base, render: 'reference', label: 'Map of the region with the boundary marked ' + x.mark + ': ' + x.name, marks: [{ at: x.at, text: x.mark }] };
    var src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(Map.svg(spec, b));
    var over = Map.overlay(spec, b).filter(function(o){ return o.x != null; }).map(function(o){ return '<span class="hug-map-' + o.kind + (o.low ? ' is-low' : '') + '" style="left:' + o.x + '%;top:' + o.y + '%">' + esc(o.text) + '</span>'; }).join('');
    return '<figure class="hug-map bl-real"><div class="hug-map-pic"><img src="' + src + '" alt="' + esc(spec.label) + '" width="' + b.width + '" height="' + b.height + '"><div class="hug-map-over" aria-hidden="true">' + over + '</div></div><figcaption class="hug-small"><span class="hug-border-note">' + esc(Map.note(b)) + '</span> <span class="hug-base-src">Base map: Natural Earth.</span></figcaption></figure>';
  }

  /* ---------------------------------------------------------- the words */
  var PRESET = {
    antecedent: { first: 'line', extra: 'river', drawn: 1760, settled: 1820 },
    subsequent: { first: 'people', extra: 'river', drawn: 1880, settled: 1760 },
    consequent: { first: 'people', extra: 'consequent', drawn: 1890, settled: 1750 },
    superimposed: { first: 'people', extra: 'superimposed', drawn: 1885, settled: 1740 },
    geometric: { first: 'line', extra: 'geometric', drawn: 1790, settled: 1840 },
    relict: { first: 'line', extra: 'relict', drawn: 1780, settled: 1820 }
  };
  var BT_ORDER = ['antecedent', 'subsequent', 'consequent', 'superimposed', 'geometric', 'relict'];
  var BT_SAY = {
    antecedent: 'The border along the Tarn was drawn in 1760, before anyone settled; towns grew up on both sides from 1820.',
    subsequent: 'Towns spread across the valley from 1760; the border along the Tarn came later, in 1880.',
    consequent: 'The border of 1890 bends to follow where Ardic-speaking towns give way to Bessan-speaking ones. It is also subsequent: the people came first.',
    superimposed: 'In 1885 the empire of Corvia drew a line through the lands of the Ardic people, who now live on both sides of it. It is also subsequent.',
    geometric: 'A straight line along the 41st parallel, agreed in 1790, ignores hills and rivers. It is also antecedent: the towns came later.',
    relict: 'Drawn in 1780, the border stopped working when the two countries joined in 1830; old customs posts still stand along it.'
  };
  var SCENE_LABEL = [['types', 'Boundary types'], ['shapes', 'State shapes'], ['forces', 'Forces'], ['sea', 'Sea zones'], ['real', 'Real cases']];

  /* ---------------------------------------------------------- mount */
  T.mount('borders-lab', function(app, data){
    var ex = null;
    T.modes(app, { slug: 'borders-lab',
      explore: function(host){ ex = explore(host, data); },
      quiz: function(host){ quiz(host, data); },
      studio: { explore: function(pane, s){ ex.studio(pane, s); } } });
  });
  function chips(cls, label, items){
    return '<div class="bl-row ' + cls + '" role="group" aria-label="' + esc(label) + '"><p class="bl-lbl" aria-hidden="true">' + esc(label) + '</p><div class="bl-chips">' + items.map(function(x){ return '<button type="button" class="tchip" data-k="' + x[0] + '" aria-pressed="false">' + esc(x[1]) + '</button>'; }).join('') + '</div></div>';
  }

  /* ------------------------------------------------------------ explore */
  function explore(host, data){
    var scene = 'types', bt = 'antecedent', shape = 'elongated', on = [0, 4], nm = 8, real = 'A', year = 1950, timer = null, LS = null, nid = T.nid('bl'), touched = false;
    function $(q){ return host.querySelector(q) || (LS ? LS.root.querySelector(q) : null); }
    host.innerHTML = '<section class="bt-problem bl-card" aria-labelledby="' + nid + '-h"><h2 id="' + nid + '-h" class="sr-only">Borders lab</h2>' +
      '<div class="bl-fig"><div class="bl-pic"><svg class="bl-svg" role="img" xmlns="http://www.w3.org/2000/svg"></svg><div class="bl-realbox" hidden></div></div><div class="bl-leg"></div></div>' +
      '<div class="bl-ctl">' + chips('bl-scene', 'Show', SCENE_LABEL) +
        '<div class="bl-grp bl-grp-types">' + chips('bl-bt', 'Boundary type', BT_ORDER.map(function(k){ return [k, B.BTYPES[k].name.replace(' boundary', '')]; })) + '<div class="bl-yearslot"></div><button type="button" class="btn-press sm bl-go">Play the years</button></div>' +
        '<div class="bl-grp bl-grp-shapes">' + chips('bl-sh', 'Shape', B.SHAPE_IDS.map(function(k){ return [k, B.SHAPES[k].name]; })) + '</div>' +
        '<div class="bl-grp bl-grp-forces">' + chips('bl-fo', 'Tap to add a force', FSC.map(function(x, i){ return [String(i), x.short]; })) + '</div>' +
        '<div class="bl-grp bl-grp-sea"><div class="bl-nmslot"></div></div>' +
        '<div class="bl-grp bl-grp-real">' + chips('bl-re', 'Real boundary', B.REAL.map(function(x){ return [x.mark, x.mark + ': ' + shortReal(x)]; })) + '</div>' +
      '</div><div class="bl-say"></div><div class="bl-more"></div><p class="sr-only bl-live" role="status" aria-live="polite"></p></section>';
    var say = T.announcer($('.bl-live'));
    var cue = T.cue('Pick a boundary type, then play the years: does the border come before the towns or after?');
    $('.bl-ctl').insertBefore(cue.el, $('.bl-ctl').firstChild);
    function act(){ if(!touched){ touched = true; cue.done(); } }
    var sYear = T.slider({ label: 'Year', min: Y0, max: Y1, step: 10, value: year, onInput: function(v){ act(); stopT(); year = v; draw(); words(); } });
    $('.bl-yearslot').appendChild(sYear.el);
    var sNm = T.slider({ label: 'Ship\'s distance from the baseline', min: 0, max: 260, step: 2, value: nm, unit: 'nautical miles', onInput: function(v){ act(); nm = v; draw(); words(); say(B.zoneAt(nm).name); } });
    $('.bl-nmslot').appendChild(sNm.el);
    function stopT(){ if(timer){ clearInterval(timer); timer = null; } var b = $('.bl-go'); if(b) b.textContent = 'Play the years'; }
    $('.bl-go').addEventListener('click', function(){
      act();
      if(timer){ stopT(); return; }
      if(T.reduced()){ year = 1950; sYear.set(year); draw(); words(); return; }
      if(year >= 1950) year = Y0;
      $('.bl-go').textContent = 'Pause';
      timer = setInterval(function(){ year += 5; if(year >= 1950){ year = 1950; stopT(); } sYear.set(year); draw(); if(year % 50 === 0 || !timer) words(); }, 70);
    });
    function onClick(e){
      var b = e.target.closest('.bl-row button'); if(!b || !(LS ? LS.root : host).contains(b)) return;
      var row = b.closest('.bl-row'), k = b.getAttribute('data-k');
      act();
      if(row.classList.contains('bl-scene')){ scene = k; stopT(); }
      else if(row.classList.contains('bl-bt')){ bt = k; stopT(); year = 1950; sYear.set(year); }
      else if(row.classList.contains('bl-sh')) shape = k;
      else if(row.classList.contains('bl-fo')){ var i = +k, at = on.indexOf(i); if(at > -1) on.splice(at, 1); else on.push(i); }
      else if(row.classList.contains('bl-re')) real = k;
      sync(); draw(); words(); say(T.sayHead($('.bl-say')).replace(/<[^>]+>/g, ''));
    }
    host.addEventListener('click', onClick);
    function sync(){
      var root = LS ? LS.root : host;
      var single = { 'bl-scene': scene, 'bl-bt': bt, 'bl-sh': shape, 'bl-re': real };
      Object.keys(single).forEach(function(cls){ root.querySelectorAll('.' + cls + ' button').forEach(function(b){ b.setAttribute('aria-pressed', String(b.getAttribute('data-k') === single[cls])); }); });
      root.querySelectorAll('.bl-fo button').forEach(function(b){ b.setAttribute('aria-pressed', String(on.indexOf(+b.getAttribute('data-k')) > -1)); });
      ['types', 'shapes', 'forces', 'sea', 'real'].forEach(function(k){ var el = $('.bl-grp-' + k); if(el) el.hidden = k !== scene; });
    }
    function size(){ var f = $('.bl-pic'), r = f ? f.getBoundingClientRect() : { width: 600, height: 420 }; return { W: Math.max(300, Math.round(r.width) || 600), H: Math.max(240, Math.round(r.height) || 420) }; }
    var realTok = 0;
    function draw(){
      var z = size(), svg = $('.bl-svg'), box = $('.bl-realbox'), html = '', label = '', leg = '';
      svg.style.display = scene === 'real' ? 'none' : ''; box.hidden = scene !== 'real';
      if(scene === 'types'){
        var f = PRESET[bt];
        html = landSvg(z.W, z.H, f, year);
        label = 'An invented borderland in ' + year + ': ' + BT_SAY[bt];
        leg = landLegend(f);
      } else if(scene === 'shapes'){
        html = shapeSvg(z.W, z.H, shape, { labels: true });
        label = 'Outline of an invented ' + B.SHAPES[shape].name.toLowerCase() + ' state, with its capital and rings every 300 km: its farthest edge is ' + thouS(reach(shape).km) + ' km from the capital.';
        leg = shapeLegend(shape) + '<p class="bt-small">An invented state. State shapes are an older classification; the current course framework does not list them, but many classes still use them.</p>';
      } else if(scene === 'forces'){
        if(!BASEA){ needBaseA(); if(ONBASEA.indexOf(draw) < 0) ONBASEA.push(draw); }
        html = forcesSvg(z.W, z.H, on);
        var a = on.filter(function(i){ return B.SCENES[i].force === 'centripetal'; }).length;
        label = 'Map of Country A with ' + a + ' forces pulling it together and ' + (on.length - a) + ' pulling it apart: ' + on.map(function(i){ return FSC[i].short; }).join(', ') + '.';
        leg = forcesLegend(on);
      } else if(scene === 'sea'){
        html = seaSvg(z.W, Math.min(z.H, 360), nm);
        label = 'Cross-section of the sea from a coast, with a ship ' + nm + ' nautical miles out, in the ' + B.zoneAt(nm).name.toLowerCase() + '.';
        leg = seaKey(nm);
      } else {
        var x = B.REAL.filter(function(r){ return r.mark === real; })[0], tok = ++realTok;
        box.innerHTML = '<p class="bt-small">Loading the map…</p>';
        base(x.base).then(function(b){ if(tok !== realTok) return; box.innerHTML = realHtml(x, b); }).catch(function(){ box.innerHTML = '<p class="bt-small">The map could not load. The case is described under the map.</p>'; });
        leg = '';
      }
      if(scene !== 'real'){ var hh = scene === 'sea' ? Math.min(z.H, 360) : z.H; svg.setAttribute('viewBox', '0 0 ' + z.W + ' ' + hh); svg.innerHTML = html; svg.setAttribute('aria-label', label); }
      $('.bl-leg').innerHTML = leg;
    }
    function shortReal(x){ return { A: 'the 49th parallel', B: 'East and West Germany', C: 'the Sahara', D: 'Punjab' }[x.mark]; }
    function words(){
      var head, sub, why, pills = [];
      if(scene === 'types'){
        var f = PRESET[bt], Bt = B.BTYPES[bt];
        head = Bt.name + '.'; sub = BT_SAY[bt];
        pills = [{ k: 'Year', html: String(year), tone: 'readout' }];
        why = '<p>' + esc(Bt.def) + '</p><p><b>When it was drawn:</b> every border is antecedent (drawn before most people settled) or subsequent (drawn after). <b>How it was drawn:</b> it may also be consequent (along a cultural divide), superimposed (forced by an outside power), geometric (a straight line) or relict (no longer working, but traces remain). So one boundary can fit more than one type.</p>';
        void f;
      } else if(scene === 'shapes'){
        var S = B.SHAPES[shape]; head = S.name + '.'; sub = S.def;
        why = '<p><b>Its usual challenge:</b> ' + esc(S.challenge) + '</p><p>' + esc(S.real) + '</p><p>Shape is only one influence. Roads, technology and a shared identity often matter more than outline.</p>';
      } else if(scene === 'forces'){
        var cp = on.filter(function(i){ return B.SCENES[i].force === 'centripetal'; }).length, cf = on.length - cp;
        head = on.length ? cp + ' pulling together, ' + cf + ' pulling apart.' : 'Tap a scene to add its force.';
        sub = on.length ? B.SCENES[on[on.length - 1]].t : '';
        pills = [{ k: 'Together', html: String(cp), tone: 'good' }, { k: 'Apart', html: String(cf), tone: cf > cp ? 'warn' : 'readout' }];
        why = '<p><b>Centripetal forces</b> unify a state: shared institutions, infrastructure that reaches every region, a national identity. They can lead to stronger cultural cohesion, fairer infrastructure and, at times, ethnonationalism. <b>Centrifugal forces</b> divide it; they can lead to uneven development, ethnic nationalist movements and, at worst, a failed state.</p><p><b>Devolution factors</b> (moving power from the center to regions, or breakup): ' + B.FIDS.concat(['cleansing']).map(function(k){ return '<b>' + esc(B.FACTORS[k].name.toLowerCase()) + '</b> (' + esc(B.FACTORS[k].def.charAt(0).toLowerCase() + B.FACTORS[k].def.slice(1, -1)) + ')'; }).join('; ') + '.</p><p>The same trait can do both: a shared religion can unite a country while dividing one region where most people hold another.</p>';
      } else if(scene === 'sea'){
        var Z = B.zoneAt(nm); head = Z.name + '.'; sub = Z.rights;
        pills = [{ k: 'Ship', html: nm + ' nmi', tone: 'readout' }];
        why = '<p>The UN Convention on the Law of the Sea (UNCLOS, 1982) measures every zone from a coast\'s baseline. One nautical mile is about 1.85 km. Where two coasts are less than 400 nautical miles apart, their exclusive economic zones overlap and the states must agree on a line, often one halfway between.</p>';
      } else {
        var x = B.REAL.filter(function(r){ return r.mark === real; })[0];
        head = x.name + '.'; sub = x.text;
        why = '<p>Real borders rarely fit one type. Each case gives its dates and says how it is often classed, so the type rests on its history. Disputed places are left out of these cases: no answer here depends on a dispute.</p>';
      }
      T.explain($('.bl-say'), '<b>' + esc(head) + '</b> ' + esc(sub), why);
      more();
      if(LS){ LS.caption('<b>' + esc(head) + '</b> ' + esc(sub), 'explore'); LS.pills(pills, 'left', 'explore'); }
    }
    function more(){
      var el = $('.bl-more'); if(!el) return;
      el.innerHTML = '<h3 class="ls-title-l">Boundary types</h3>' + T.dataTable(['Type', 'What it means'], BT_ORDER.map(function(k){ return [B.BTYPES[k].name, B.BTYPES[k].def]; }), 'Boundary types (CED 4.4)') +
        '<h3 class="ls-title-l">Zones of the sea (UNCLOS, 1982)</h3>' + T.dataTable(['Zone', 'From the baseline', 'What the coastal state may do'], B.ZONES.map(function(z, i){ return [z.name, i === 0 ? 'to 12 nautical miles' : i === 1 ? '12 to 24' : i === 2 ? '12 to 200 (overlaps the contiguous zone)' : 'beyond 200', z.rights]; }), 'Law of the sea zones') +
        '<h3 class="ls-title-l">Real cases</h3>' + T.dataTable(['', 'Boundary', 'Its history'], B.REAL.map(function(x){ return [x.mark, x.name, x.text]; }), 'Four real boundaries') +
        '<p class="bt-small">The borderland, Country A, Country B, the empire of Corvia and the Ardic and Bessan languages are invented for practice.</p>';
    }
    function studio(pane, s){
      LS = s;
      T.studioPane(pane, s, { stage: [$('.bl-fig')], dock: [$('.bl-ctl')], why: [$('.bl-say')], details: [$('.bl-more')] });
      s.root.addEventListener('click', onClick);
      host.removeEventListener('click', onClick);
      sync(); draw(); words();
      if(s.mode() === 'explore') T.hintSlot(s, $('.bl-go'), 'Start here: play the years', { cls: 'bl-tipslot' });
      if(window.ResizeObserver){ var t = null; new ResizeObserver(function(){ clearTimeout(t); t = setTimeout(draw, 60); }).observe($('.bl-pic')); }
    }
    sync(); draw(); words();
    return { studio: studio };
  }

  /* ------------------------------------------------------ test yourself */
  var TITLES = { boundary: 'Boundary types', shape: 'State shapes', forces: 'Forces and devolution', sea: 'Zones of the sea' };
  function quiz(host, data){
    T.drill(host, data, { slug: 'borders-lab', noun: 'drill',
      generate: function(r, ctx, type){ return B.generate(r, ctx, type); },
      types: [{ value: 'boundary', label: 'Boundary types' }, { value: 'shape', label: 'State shapes' }, { value: 'forces', label: 'Forces and devolution' }, { value: 'sea', label: 'Zones of the sea' }],
      typeLabel: 'Kind of problem',
      title: function(p){ return TITLES[p.type] || 'Practice problem'; },
      extra: function(el, p){ figure(el, p); }
    });
  }
  function figure(el, p){
    var g = p.figure; if(!g || g.kind === 'forces'){ el.innerHTML = ''; return; }
    var W = phone() ? 360 : 600, H, inner, label, leg = '';
    if(g.kind === 'boundary'){
      var f = { first: g.facts.first, extra: g.facts.extra === 'consequent' || g.facts.extra === 'superimposed' || g.facts.extra === 'geometric' || g.facts.extra === 'relict' ? g.facts.extra : 'river', drawn: g.facts.drawn, settled: g.facts.settled };
      H = phone() ? 270 : 400; inner = landSvg(W, H, f, 2000, { name: false }); label = 'The invented borderland in 2000, with a timeline of when the towns were settled and the border was drawn.'; leg = landLegend(f);
    } else if(g.kind === 'shape'){
      H = phone() ? 240 : 320; inner = shapeSvg(W, H, g.shape, { flip: g.flip, rot: g.rot }); label = 'The outline of an invented state.';
    } else {
      H = phone() ? 210 : 300; inner = seaSvg(W, H, g.nm, { quiet: true }); label = 'Cross-section of the sea from Country A\'s coast, with four numbered zones and a ship ' + g.nm + ' nautical miles out.';
      leg = phone() ? '' : '<p class="bt-small">The zones are numbered from the coast outward; their names are what the first step asks.</p>';
    }
    el.innerHTML = '<figure class="cd-fig bl-qfig"><svg class="bl-svg" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(label) + '">' + inner + '</svg>' + leg + '</figure>';
  }
})();
