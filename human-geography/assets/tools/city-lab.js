/* City lab page (docs/aphug-spec.md section 6). OWNED BY THIS TOOL ONLY
   (builder T4). Mounts into #app with ApHugTools; the model is
   ApHugMath.cityLab (human-geography/assets/tools/math/city-lab.js), the content
   human-geography/data/tools/city-lab.json (served filtered as
   assets/tool-data/city-lab.json). The frame is ApHugTools.modes (Explore,
   then Test yourself) on the Tool Studio.

   Explore, four scenes, drawn at the page's own pixel size:
     Bid rent and rings  von Thünen's rings (or a city's land-use bands)
                         beside the bid-rent lines that make them (ApHugPlot):
                         move transport cost or the price of milk, add
                         refrigerated trucks or a river, and both redraw
     City models         the seven models the CED names, zones numbered in the
                         drawing and named in the key; pick a second to see
                         them side by side (stacked on a phone)
     Central places      a lattice of villages, towns and one city; pick a good
                         and see which places can offer it (range, threshold)
     Rank-size           a country's cities against the rank-size rule, or with
                         a primate city
   Test yourself: ApHugTools.drill over the model's generate(). */
(function(){
  'use strict';
  var T = window.ApHugTools, M = window.ApHugMath, Plot = window.ApHugPlot;
  if(!T || !M || !M.cityLab || M.cityLab.stub) return;
  var CL = M.cityLab, esc = T.esc;
  function n1(v){ return Math.round(v * 10) / 10; }
  function phone(){ return (window.innerWidth || 1280) <= 640; }
  function numBadge(x, y, n, cls){ return '<g class="cl-num ' + (cls || '') + '"><circle cx="' + n1(x) + '" cy="' + n1(y) + '" r="11"/><text x="' + n1(x) + '" y="' + n1(y + 4.5) + '" text-anchor="middle">' + n + '</text></g>'; }
  function tag(x, y, text, W){
    var w = text.length * 7.6 + 14, cx = Math.max(w / 2 + 3, Math.min((W || 9999) - w / 2 - 3, x));
    return '<g class="cl-tag"><rect x="' + n1(cx - w / 2) + '" y="' + n1(y - 11) + '" width="' + n1(w) + '" height="22" rx="11"/><text x="' + n1(cx) + '" y="' + n1(y + 4.5) + '" text-anchor="middle">' + esc(text) + '</text></g>';
  }

  /* --------------------------------------------------- rings and bids */
  var MAXD = { farm: 45, city: 16 };
  // Ring widths on a square-root scale, so the inner rings stay big enough to read; the graph keeps true distances.
  function rr(f){ return Math.sqrt(Math.max(0, Math.min(1, f))); }
  function ringsSvg(S, cx, cy, R, uses, o, maxD){
    var bands = CL.rings(uses, o), out = [], st = o.river ? 1.55 : 1;
    if(o.river) out.push('<path class="cl-river" d="M' + n1(cx - R * st - 10) + ' ' + n1(cy) + 'H' + n1(cx + R * st + 10) + '"/>');
    bands.slice().reverse().forEach(function(b){
      var i = uses.indexOf(CL.useBy(uses, b.id)), r = R * rr(b.to / maxD);
      out.push('<ellipse class="cl-band s' + (i + 1) + '" cx="' + n1(cx) + '" cy="' + n1(cy) + '" rx="' + n1(r * st) + '" ry="' + n1(r) + '"/>');
    });
    if(o.river) out.push('<path class="cl-river is-top" d="M' + n1(cx - R * st - 10) + ' ' + n1(cy) + 'H' + n1(cx + R * st + 10) + '"/>');
    // Numbers on each band; a number that would touch an earlier one turns further round the ring.
    var placed = [];
    if(R < 90){
      // Small rings (a phone): numbers stand outside, each with a leader to its ring.
      var shown = bands.filter(function(b){ return R * (rr(b.to / maxD) - rr(b.from / maxD)) >= 3; }), n = shown.length;
      shown.forEach(function(b, k){
        var i = uses.indexOf(CL.useBy(uses, b.id)), mid = R * (rr(b.from / maxD) + rr(b.to / maxD)) / 2;
        var bx = cx + R * st + 26, by = cy + (k - (n - 1) / 2) * 25, ax = cx + mid * st * Math.cos(-0.3 + 0.2 * k), ay = cy + mid * Math.sin(-0.3 + 0.2 * k);
        out.push('<path class="cl-lead" d="M' + n1(ax) + ' ' + n1(ay) + 'L' + n1(bx - 11) + ' ' + n1(by) + '"/><circle class="cl-leaddot" cx="' + n1(ax) + '" cy="' + n1(ay) + '" r="2.4"/>');
        out.push(numBadge(bx, by, i + 1));
      });
      out.push('<circle class="cl-market" cx="' + n1(cx) + '" cy="' + n1(cy) + '" r="5"/>');
      return { svg: out.join(''), bands: bands };
    }
    bands.forEach(function(b){
      var i = uses.indexOf(CL.useBy(uses, b.id)), r0 = R * rr(b.from / maxD), r1 = R * rr(b.to / maxD), mid = (r0 + r1) / 2;
      if(r1 - r0 < 12) return;
      if(i === 0) mid = Math.max(mid, Math.min(r1 - 4, 20));
      var ang = -Math.PI / 4 - 0.35 * i, x = 0, y = 0;
      for(var tries = 0; tries < 24; tries++){
        x = cx + mid * Math.cos(ang) * st; y = cy + mid * Math.sin(ang);
        if(placed.every(function(q){ return Math.hypot(q[0] - x, q[1] - y) >= 25; }) && Math.hypot(x - cx, y - cy) >= 19) break;
        ang -= 0.32;
      }
      placed.push([x, y]);
      out.push(numBadge(x, y, i + 1));
    });
    out.push('<circle class="cl-market" cx="' + n1(cx) + '" cy="' + n1(cy) + '" r="7"/>');
    return { svg: out.join(''), bands: bands };
  }
  function bidPlot(uses, o, maxD, w, h, mark){
    var top = Math.max.apply(null, uses.map(function(u){ return CL.bid(u, 0, o); }));
    var spec = { label: 'Bid-rent lines: what each land use can pay for land at each distance from the ' + (uses === CL.FARM ? 'market' : 'city center'), width: Math.max(260, Math.round(w)), height: Math.max(200, Math.round(h)),
      x: [0, maxD], y: [0, Math.ceil(top * 1.08 / 50) * 50], xLabel: w < 420 ? '' : 'Distance (km)', yLabel: uses === CL.FARM ? 'Bid rent ($ per hectare)' : 'Bid rent ($ per square meter)',
      curves: uses.map(function(u, i){ var z = CL.bid(u, 0, o) / (CL.bid(u, 0, o) - CL.bid(u, 1, o)); return { fn: function(d){ return CL.bid(u, d, o); }, domain: [0, Math.min(maxD, z)], cls: 's' + (i + 1) }; }),
      asymptotes: (mark != null ? [{ x: mark }] : []) };
    return Plot.svg(spec);
  }
  function bandLegend(uses, narrow){ return '<ul class="cl-legend" aria-label="Legend">' + uses.map(function(u, i){ return '<li><span class="cl-sw s' + (i + 1) + '" aria-hidden="true"></span>' + (i + 1) + '. ' + esc(u.name) + '</li>'; }).join('') + (narrow ? '<li>Graph, across: distance (km)</li>' : '') + '</ul>'; }

  /* -------------------------------------------------------- city models */
  /* Each model in a 240 x 240 box: zones as shapes, numbers as badges; the
     names are in the key under the drawing. */
  function sector(cx, cy, r0, r1, a0, a1){
    var f = function(r, a){ var t = a * Math.PI / 180; return n1(cx + r * Math.cos(t)) + ' ' + n1(cy + r * Math.sin(t)); }, big = a1 - a0 > 180 ? 1 : 0;
    return 'M' + f(r1, a0) + 'A' + r1 + ' ' + r1 + ' 0 ' + big + ' 1 ' + f(r1, a1) + (r0 ? 'L' + f(r0, a1) + 'A' + r0 + ' ' + r0 + ' 0 ' + big + ' 0 ' + f(r0, a0) : 'L' + n1(cx) + ' ' + n1(cy)) + 'Z';
  }
  function at(cx, cy, r, a){ var t = a * Math.PI / 180; return [cx + r * Math.cos(t), cy + r * Math.sin(t)]; }
  var DRAW = {
    concentric: function(){ var o = [], n = []; for(var i = 5; i >= 1; i--) o.push(['c', 120, 120, 22 * i, i]); for(var j = 1; j <= 5; j++){ var p = at(120, 120, j === 1 ? 0 : 22 * j - 11, -50); n.push([p[0], p[1], j]); } return { shapes: o, nums: n }; },
    sector: function(){ var o = [['c', 120, 120, 112, 4]], W = [[-14, 14, 2], [14, 60, 3], [-60, -14, 3], [60, 140, 4], [-140, -60, 4], [140, 220, 5]];
      W.forEach(function(w){ o.push(['p', sector(120, 120, 0, 112, w[0], w[1]), w[2]]); }); o.push(['c', 120, 120, 22, 1]);
      var n = [[120, 120, 1]]; [[0, 2], [37, 3], [-37, 3], [100, 4], [-100, 4], [180, 5]].forEach(function(q){ var p = at(120, 120, 74, q[0]); n.push([p[0], p[1], q[1]]); }); return { shapes: o, nums: n }; },
    nuclei: function(){ var B = [[0, 0, 80, 60, 4], [80, 0, 80, 60, 3], [160, 0, 80, 60, 2], [0, 60, 60, 60, 4], [60, 60, 60, 60, 3], [120, 60, 50, 60, 1], [170, 60, 70, 60, 2], [0, 120, 70, 60, 5], [70, 120, 70, 60, 4], [140, 120, 50, 60, 7], [190, 120, 50, 60, 6], [0, 180, 80, 60, 8], [80, 180, 80, 60, 4], [160, 180, 80, 60, 9]];
      return { shapes: B.map(function(b){ return ['r', b[0], b[1], b[2], b[3], b[4]]; }), nums: B.map(function(b){ return [b[0] + b[2] / 2, b[1] + b[3] / 2, b[4]]; }) }; },
    galactic: function(){ var o = [['r', 0, 0, 240, 240, 4], ['c', 120, 120, 46, 1]], n = [[120, 120, 1], [30, 30, 4]];
      o.push(['road', 'M120 4V236M4 120H236']); o.push(['ring', 120, 120, 84]);
      [[0, 3], [90, 3], [180, 3], [270, 3]].forEach(function(q){ var p = at(120, 120, 84, q[0]); o.push(['c', p[0], p[1], 15, 3]); });
      var e = at(120, 120, 84, 0); n.push([e[0], e[1] + 0, 3]);
      var a = at(120, 120, 84, -45); o.push(['r', a[0] - 18, a[1] - 14, 36, 28, 5]); n.push([a[0], a[1], 5]);
      var rr = at(120, 120, 84, 135); n.push([rr[0], rr[1], 2]); return { shapes: o, nums: n }; },
    latin: function(){ var o = [['c', 120, 120, 114, 5], ['c', 120, 120, 84, 4], ['c', 120, 120, 54, 3]];
      o.push(['p', sector(120, 120, 18, 114, -13, 13), 2]); o.push(['p', sector(120, 120, 18, 114, 160, 196), 6]); o.push(['r', 196, 150, 40, 32, 7]); o.push(['c', 120, 120, 20, 1]);
      var n = [[120, 120, 1]]; var p2 = at(120, 120, 72, 0); n.push([p2[0], p2[1], 2]); var p3 = at(120, 120, 38, -90); n.push([p3[0], p3[1], 3]); var p4 = at(120, 120, 69, -105); n.push([p4[0], p4[1], 4]);
      var p5 = at(120, 120, 99, -120); n.push([p5[0], p5[1], 5]); var p6 = at(120, 120, 72, 178); n.push([p6[0], p6[1], 6]); n.push([216, 166, 7]); return { shapes: o, nums: n }; },
    seasian: function(){ var cx = 120, cy = 226, o = [['r', 0, 0, 240, 240, 8]], n = [];
      o.push(['p', sector(cx, cy, 98, 140, 180, 230), 6], ['p', sector(cx, cy, 98, 140, 230, 262), 7], ['p', sector(cx, cy, 98, 140, 262, 318), 6], ['p', sector(cx, cy, 98, 140, 318, 345), 7], ['p', sector(cx, cy, 98, 140, 345, 360), 6]);
      o.push(['p', sector(cx, cy, 62, 98, 180, 222), 4], ['p', sector(cx, cy, 62, 98, 222, 360), 5], ['p', sector(cx, cy, 28, 62, 180, 270), 2], ['p', sector(cx, cy, 28, 62, 270, 360), 3], ['p', sector(cx, cy, 0, 28, 180, 360), 1]);
      o.push(['sea', 0, cy, 240, 240 - cy]);
      [[0, 14, 270, 1], [45, 225, 2], [45, 315, 3], [80, 200, 4], [80, 290, 5], [119, 200, 6], [119, 246, 7], [119, 290, 6], [180, 300, 8]].forEach(function(q){ if(q.length === 4){ n.push([cx, cy - q[1], q[3]]); return; } var p = at(cx, cy, q[0], q[1]); n.push([p[0], p[1], q[2]]); });
      return { shapes: o, nums: n }; },
    african: function(){ var o = [['r', 0, 0, 240, 240, 6], ['c', 120, 120, 92, 4]], n = [];
      o.push(['p', sector(120, 120, 0, 92, -40, 20), 5]);
      o.push(['c', 92, 106, 20, 1], ['c', 138, 98, 18, 2], ['r', 96, 132, 50, 26, 3]);
      [[30, 30], [210, 210], [30, 210], [210, 40]].forEach(function(p){ o.push(['c', p[0], p[1], 15, 6]); });
      n.push([92, 106, 1], [138, 98, 2], [121, 145, 3], [70, 170, 4], [182, 106, 5], [30, 30, 6]); return { shapes: o, nums: n }; }
  };
  function cityModelSvg(k, X, Y, S, cur){
    var d = DRAW[k](), out = [], P = function(x, y){ return [n1(X + x * S), n1(Y + y * S)]; };
    d.shapes.forEach(function(s){
      if(s[0] === 'c'){ var c = P(s[1], s[2]); out.push('<circle class="cl-z z' + s[4] + (cur === s[4] ? ' is-cur' : '') + '" cx="' + c[0] + '" cy="' + c[1] + '" r="' + n1(s[3] * S) + '"/>'); }
      else if(s[0] === 'r'){ var a = P(s[1], s[2]); out.push('<rect class="cl-z z' + s[5] + (cur === s[5] ? ' is-cur' : '') + '" x="' + a[0] + '" y="' + a[1] + '" width="' + n1(s[3] * S) + '" height="' + n1(s[4] * S) + '" rx="3"/>'); }
      else if(s[0] === 'p') out.push('<path class="cl-z z' + s[2] + (cur === s[2] ? ' is-cur' : '') + '" transform="translate(' + n1(X) + ' ' + n1(Y) + ') scale(' + n1(S * 100) / 100 + ')" d="' + s[1] + '" style="stroke-width:' + n1(1.2 / S) + 'px"/>');
      else if(s[0] === 'road') out.push('<path class="cl-road" transform="translate(' + n1(X) + ' ' + n1(Y) + ') scale(' + n1(S * 100) / 100 + ')" d="' + s[1] + '" style="stroke-width:' + n1(4 / S) + 'px"/>');
      else if(s[0] === 'ring'){ var rc = P(s[1], s[2]); out.push('<circle class="cl-ringroad" cx="' + rc[0] + '" cy="' + rc[1] + '" r="' + n1(s[3] * S) + '"/>'); }
      else if(s[0] === 'sea'){ var sa = P(s[1], s[2]); out.push('<rect class="cl-sea" x="' + sa[0] + '" y="' + sa[1] + '" width="' + n1(s[3] * S) + '" height="' + n1(s[4] * S) + '"/>'); }
    });
    // Each number names its zone on tap (second pass, 2026-11-10).
    d.nums.forEach(function(q){ var p = P(q[0], q[1]); out.push(numBadge(p[0], p[1], q[2], 'is-tap' + (cur === q[2] ? ' is-cur' : '')).replace('<g ', '<g data-m="' + k + '" data-n="' + q[2] + '" ')); });
    return out.join('');
  }
  /* The zones are named one at a time: a line under the drawing names the
     zone whose number was tapped; the whole key opens on tap (All zones). */
  function zoneLine(z, two){
    if(!z || !z.n) return '<p class="cl-zline is-hint">Tap a number to name its zone.</p>';
    var C = CL.CITY[z.m]; return '<p class="cl-zline"><span class="cl-zn" aria-hidden="true">' + z.n + '</span>' + esc(C.zones[z.n - 1]) + (two ? ' <span class="cl-zm">(' + esc(C.name) + ')</span>' : '') + '</p>';
  }
  function modelKey(k){ var C = CL.CITY[k]; return '<div class="cl-key"><p class="cl-key-h">' + esc(C.full) + '</p><ol>' + C.zones.map(function(z){ return '<li>' + esc(z) + '</li>'; }).join('') + '</ol></div>'; }

  /* ----------------------------------------------------- central places */
  var ORDER_N = { low: 1, middle: 2, high: 3 };
  function centralSvg(W, H, g){
    var a = Math.min(W, H) / 7.2, cx = W / 2, cy = H / 2, out = [], places = [], need = g.id === 'heart' ? 4 : ORDER_N[g.order];
    for(var q = -4; q <= 4; q++) for(var r = -4; r <= 4; r++){
      var x = cx + a * (q + r / 2), y = cy + a * r * Math.sqrt(3) / 2;
      if(x < 16 || x > W - 16 || y < 16 || y > H - 16) continue;
      var lvl = q === 0 && r === 0 ? 3 : ((q - r) % 3 === 0 && Math.abs(q) + Math.abs(r) + Math.abs(q + r) <= 4) ? 2 : 1;
      places.push({ x: x, y: y, lvl: lvl });
    }
    // Hexagonal market areas around every place that can offer the good.
    var size = need >= 4 ? a * 3.4 : need === 3 ? a * 1.75 : need === 2 ? a * 1.0 : a * 0.56;
    places.filter(function(p){ return p.lvl >= Math.min(need, 3); }).forEach(function(p){
      var pts = []; for(var i = 0; i < 6; i++){ var t = Math.PI / 6 + i * Math.PI / 3; pts.push(n1(p.x + size * Math.cos(t)) + ' ' + n1(p.y + size * Math.sin(t))); }
      out.push('<path class="cl-hex" d="M' + pts.join('L') + 'Z"/>');
    });
    places.forEach(function(p){ var on = p.lvl >= Math.min(need, 3); out.push(p.lvl === 3 ? '<rect class="cl-cp' + (on ? ' is-on' : '') + '" x="' + n1(p.x - 8) + '" y="' + n1(p.y - 8) + '" width="16" height="16" rx="2"/>' : '<circle class="cl-cp' + (on ? ' is-on' : '') + '" cx="' + n1(p.x) + '" cy="' + n1(p.y) + '" r="' + (p.lvl === 2 ? 7 : 4) + '"/>'); });
    out.push(tag(cx, cy + 24, 'City', W));
    return out.join('');
  }

  /* ---------------------------------------------------------- rank-size */
  var RS = { rule: [6, 3.2, 1.9, 1.4, 1.25, 0.95], primate: [6, 1.2, 0.9, 0.8, 0.6, 0.5] };
  /* Bars for the cities, dots on a line for the rule (drawn here: the shared
     bar chart puts its legend and axis title on top of each other when narrow). */
  function rsPlot(kind, w, h){
    var P1 = 6, pred = [1, 2, 3, 4, 5, 6].map(function(n){ return window.ApHugCalc.evaluate({ fn: 'rankSize', args: [P1, n] }); });
    var L = 40, R = w - 12, T = 18, B = h - 30, X = function(i){ return L + (R - L) * (i + 0.5) / 6; }, Y = function(v){ return B - (B - T) * v / 7; }, bw = (R - L) / 6 * 0.56, o = [];
    [0, 1, 2, 3, 4, 5, 6, 7].forEach(function(v){ if(v > 7) return; o.push('<path class="cl-grid" d="M' + L + ' ' + n1(Y(v)) + 'H' + R + '"/>'); if(v % 2 === 0 || h > 300) o.push('<text class="cl-tick" x="' + (L - 6) + '" y="' + n1(Y(v) + 4) + '" text-anchor="end">' + v + '</text>'); });
    RS[kind].forEach(function(v, i){ o.push('<rect class="cl-bar" x="' + n1(X(i) - bw / 2) + '" y="' + n1(Y(v)) + '" width="' + n1(bw) + '" height="' + n1(B - Y(v)) + '" rx="2"/>'); o.push('<text class="cl-tick" x="' + n1(X(i)) + '" y="' + (B + 18) + '" text-anchor="middle">' + (i + 1) + '</text>'); });
    o.push('<path class="cl-rule" d="M' + pred.map(function(v, i){ return n1(X(i)) + ' ' + n1(Y(v)); }).join('L') + '"/>');
    pred.forEach(function(v, i){ o.push('<circle class="cl-ruledot" cx="' + n1(X(i)) + '" cy="' + n1(Y(v)) + '" r="5"/>'); });
    o.push('<path class="cl-axis" d="M' + L + ' ' + T + 'V' + B + 'H' + R + '"/>');
    return '<svg class="cl-svg" viewBox="0 0 ' + n1(w) + ' ' + n1(h) + '" role="img" aria-label="Bar chart of the six largest cities of an invented country, in millions, with the rank-size rule drawn as dots: ' + RS[kind].map(function(v, i){ return 'rank ' + (i + 1) + ' ' + v + ' million, rule ' + n1(pred[i]); }).join('; ') + '.">' + o.join('') + '</svg>';
  }

  /* ---------------------------------------------------------- mount */
  T.mount('city-lab', function(app, data){
    var ex = null;
    T.modes(app, { slug: 'city-lab',
      explore: function(host){ ex = explore(host, data); },
      quiz: function(host){ quiz(host, data); },
      studio: { explore: function(pane, s){ ex.studio(pane, s); } } });
  });
  function chips(cls, label, items){
    return '<div class="cl-row ' + cls + '" role="group" aria-label="' + esc(label) + '"><p class="cl-lbl" aria-hidden="true">' + esc(label) + '</p><div class="cl-chips">' + items.map(function(x){ return '<button type="button" class="tchip" data-k="' + x[0] + '" aria-pressed="false">' + esc(x[1]) + '</button>'; }).join('') + '</div></div>';
  }
  var SCENES = [['bid', 'Bid rent and rings'], ['models', 'City models'], ['central', 'Central places'], ['rank', 'Rank-size']];

  /* ------------------------------------------------------------ explore */
  function explore(host, data){
    var scene = 'bid', place = 'farm', tc = 1, price = 1, fridge = false, river = false, model = 'concentric', vs = 'none', good = 'clothes', rk = 'rule', zf = { m: '', n: 0 }, LS = null, nid = T.nid('cl'), touched = false;
    function $(q){ return host.querySelector(q) || (LS ? LS.root.querySelector(q) : null); }
    host.innerHTML = '<section class="bt-problem cl-card" aria-labelledby="' + nid + '-h"><h2 id="' + nid + '-h" class="sr-only">City lab</h2>' +
      '<div class="cl-fig"><div class="cl-pic"></div><div class="cl-leg"></div></div>' +
      '<div class="cl-ctl">' + chips('cl-scene', 'Show', SCENES) +
        '<div class="cl-grp cl-grp-bid">' + chips('cl-place', 'Land around', [['farm', 'A market town (von Thünen)'], ['city', 'A city center']]) + '<div class="cl-tc"></div><div class="cl-pr"></div>' + chips('cl-opt', 'Add', [['fridge', 'Refrigerated trucks'], ['river', 'A river']]) + '</div>' +
        '<div class="cl-grp cl-grp-models">' + chips('cl-model', 'Model', CL.CITY_IDS.map(function(k){ return [k, CL.CITY[k].name.replace(' model', '')]; })) + chips('cl-vs', 'Side by side with', [['none', 'None']].concat(CL.CITY_IDS.map(function(k){ return [k, CL.CITY[k].name.replace(' model', '')]; }))) + '</div>' +
        '<div class="cl-grp cl-grp-central">' + chips('cl-good', 'Good or service', CL.GOODS.map(function(g){ var t = g.name.replace(/^A /, ''); return [g.id, t.charAt(0).toUpperCase() + t.slice(1)]; })) + '</div>' +
        '<div class="cl-grp cl-grp-rank">' + chips('cl-rk', 'Country', [['rule', 'Follows the rule'], ['primate', 'A primate city']]) + '</div>' +
      '</div><div class="cl-say"></div><div class="cl-more"></div><p class="sr-only cl-live" role="status" aria-live="polite"></p></section>';
    var say = T.announcer($('.cl-live'));
    var cue = T.cue('Make transport cheaper or dearer, and watch the bid-rent lines and the rings move together.');
    $('.cl-ctl').insertBefore(cue.el, $('.cl-ctl').firstChild);
    function act(){ if(!touched){ touched = true; cue.done(); } }
    var sTc = T.slider({ label: 'Cost of transport (100% is the start)', min: 0.5, max: 1.5, step: 0.1, value: 1, decimals: 1, onInput: function(v){ act(); tc = v; draw(); words(); } });
    var sPr = T.slider({ label: 'Price of milk and vegetables (100% is the start)', min: 0.6, max: 1.4, step: 0.1, value: 1, decimals: 1, onInput: function(v){ act(); price = v; draw(); words(); } });
    [[sTc, function(v){ return Math.round(v * 100) + '% of the start'; }], [sPr, function(v){ return Math.round(v * 100) + '% of the start'; }]].forEach(function(x){
      var s = x[0], out = s.el.querySelector('output'), inp = s.input;
      // The box shows the percent alone (with "of the start" it wrapped onto two lines); the label says what 100% is.
      function show(){ out.textContent = Math.round(+inp.value * 100) + '%'; inp.setAttribute('aria-valuetext', x[1](+inp.value)); }
      inp.addEventListener('input', show); s.el.querySelectorAll('.bt-step').forEach(function(b){ b.addEventListener('click', show); }); show();
    });
    $('.cl-tc').appendChild(sTc.el); $('.cl-pr').appendChild(sPr.el);
    function opts(){ return { transport: tc, price: place === 'farm' ? price : 1, fridge: place === 'farm' && fridge, river: place === 'farm' && river }; }
    function onClick(e){
      var zn = e.target.closest && e.target.closest('.cl-num[data-n]');
      if(zn && scene === 'models'){ act(); zf = { m: zn.getAttribute('data-m'), n: +zn.getAttribute('data-n') }; draw(); say(CL.CITY[zf.m].zones[zf.n - 1]); return; }
      var b = e.target.closest('.cl-row button'); if(!b || !(LS ? LS.root : host).contains(b)) return;
      var row = b.closest('.cl-row'), k = b.getAttribute('data-k');
      act();
      if(row.classList.contains('cl-scene')) scene = k;
      else if(row.classList.contains('cl-place')) place = k;
      else if(row.classList.contains('cl-opt')){ if(k === 'fridge') fridge = !fridge; else river = !river; }
      else if(row.classList.contains('cl-model')){ model = k; if(vs === k) vs = 'none'; zf = { m: '', n: 0 }; }
      else if(row.classList.contains('cl-vs')) vs = k === model ? 'none' : k;
      else if(row.classList.contains('cl-good')) good = k;
      else if(row.classList.contains('cl-rk')) rk = k;
      sync(); draw(); words(); say(T.sayHead($('.cl-say')).replace(/<[^>]+>/g, ''));
    }
    host.addEventListener('click', onClick);
    function sync(){
      var root = LS ? LS.root : host, single = { 'cl-scene': scene, 'cl-place': place, 'cl-model': model, 'cl-vs': vs, 'cl-good': good, 'cl-rk': rk };
      Object.keys(single).forEach(function(cls){ root.querySelectorAll('.' + cls + ' button').forEach(function(b){ b.setAttribute('aria-pressed', String(b.getAttribute('data-k') === single[cls])); }); });
      root.querySelectorAll('.cl-opt button').forEach(function(b){ b.setAttribute('aria-pressed', String(b.getAttribute('data-k') === 'fridge' ? fridge : river)); });
      ['bid', 'models', 'central', 'rank'].forEach(function(k){ var el = $('.cl-grp-' + k); if(el) el.hidden = k !== scene; });
      var farmOnly = place === 'farm'; sPr.el.hidden = !farmOnly; var ro = $('.cl-opt'); if(ro) ro.hidden = !farmOnly;
      var pv = $('.cl-vs'); if(pv) pv.querySelectorAll('button').forEach(function(b){ b.hidden = b.getAttribute('data-k') === model; });
    }
    function size(){ var f = $('.cl-pic'), r = f ? f.getBoundingClientRect() : { width: 600, height: 420 }; return { W: Math.max(300, Math.round(r.width) || 600), H: Math.max(260, Math.round(r.height) || 420) }; }
    function draw(){
      var z = size(), W = z.W, H = z.H, pic = $('.cl-pic'), leg = '', narrow = W < 560;
      pic.classList.toggle('is-scroll', false);
      if(scene === 'bid'){
        var uses = place === 'farm' ? CL.FARM : CL.TOWN, maxD = MAXD[place], o = opts();
        var rw = narrow ? W : W * 0.44, rh = narrow ? H * 0.5 : H, R = Math.min((rw - (narrow ? 70 : 0)) / (o.river ? 1.55 : 1) / 2 - 12, rh / 2 - 12);
        var rg = ringsSvg(null, narrow ? rw / 2 - 30 : rw / 2, rh / 2, R, uses, o, maxD);
        var pw = narrow ? W : W - rw - 12, ph = narrow ? H - rh - 8 : H;
        pic.innerHTML = '<div class="cl-split' + (narrow ? ' is-stack' : '') + '"><svg class="cl-svg cl-ringsvg" viewBox="0 0 ' + n1(rw) + ' ' + n1(rh) + '" style="height:' + n1(rh) + 'px" role="img" aria-label="' + esc(ringLabel(rg.bands, uses)) + '">' + rg.svg + '</svg><div class="cl-plotbox" style="height:' + n1(ph) + 'px">' + bidPlot(uses, o, maxD, pw, ph) + '</div></div>';
        leg = bandLegend(uses, pw < 420) + '<p class="bt-small cl-note">Numbers invented for practice. ' + (place === 'farm' ? 'Center: the market town. ' : 'Center: the city center. ') + 'Ring widths are not to scale; the graph shows true distances. ' + (o.river ? 'With the river, rings stretch along it (a simplified picture).' : '') + '</p>';
      } else if(scene === 'models'){
        var two = vs !== 'none', boxes = two ? 2 : 1, S, html = '';
        if(two && narrow){ S = (W - 20) / 240; pic.classList.add('is-scroll');
          html = '<svg class="cl-svg" viewBox="0 0 ' + W + ' ' + n1(2 * 240 * S + 40) + '" style="height:' + n1(2 * 240 * S + 40) + 'px" role="img" aria-label="' + esc(CL.CITY[model].full + ' above, ' + CL.CITY[vs].full + ' below') + '">' + cityModelSvg(model, 10, 10, S, zf.m === model ? zf.n : 0) + cityModelSvg(vs, 10, 30 + 240 * S, S, zf.m === vs ? zf.n : 0) + '</svg>';
        } else { S = Math.min((W - 20 - (boxes - 1) * 24) / (240 * boxes), (H - 20) / 240); var ox = (W - (240 * S * boxes + (boxes - 1) * 24)) / 2;
          html = '<svg class="cl-svg" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(CL.CITY[model].full + (two ? ' beside the ' + CL.CITY[vs].full : '') + ': numbered zones, named in the key') + '">' + cityModelSvg(model, ox, (H - 240 * S) / 2, S, zf.m === model ? zf.n : 0) + (two ? cityModelSvg(vs, ox + 240 * S + 24, (H - 240 * S) / 2, S, zf.m === vs ? zf.n : 0) : '') + '</svg>'; }
        pic.innerHTML = html;
        leg = zoneLine(zf, two) + '<details class="cl-allz"><summary>All zones</summary><div class="cl-keys' + (two ? ' is-two' : '') + '">' + modelKey(model) + (two ? modelKey(vs) : '') + '</div></details>';
      } else if(scene === 'central'){
        var g = CL.GOODS.filter(function(x){ return x.id === good; })[0];
        pic.innerHTML = '<svg class="cl-svg" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc('Central places: ' + g.name.toLowerCase() + ' is offered in the places marked dark, each serving the market area around it.') + '">' + centralSvg(W, H, g) + '</svg>';
        leg = '<ul class="cl-legend" aria-label="Legend"><li><span class="cl-sw is-cp" aria-hidden="true"></span>Offers it</li><li><span class="cl-sw is-cpoff" aria-hidden="true"></span>Does not</li><li><span class="cl-sw is-hex" aria-hidden="true"></span>Its market area</li><li>Square: the city; large dots: towns; small dots: villages</li></ul>';
      } else {
        pic.innerHTML = '<div class="cl-plotbox" style="height:' + H + 'px">' + rsPlot(rk, W, H) + '</div>';
        leg = '<ul class="cl-legend" aria-label="Legend"><li><span class="cl-sw is-bar" aria-hidden="true"></span>Actual population, millions (invented)</li><li><span class="cl-sw is-rule" aria-hidden="true"></span>Rank-size rule: largest / rank</li><li>Across: city rank</li></ul>';
      }
      $('.cl-leg').innerHTML = leg;
    }
    function ringLabel(bands, uses){ return 'Rings around the center: ' + bands.map(function(b){ return CL.useBy(uses, b.id).name + ' from ' + fmtKm(b.from) + ' to ' + fmtKm(b.to) + ' km'; }).join('; ') + '.'; }
    function fmtKm(v){ return String(Math.round(v * 10) / 10); }
    function words(){
      var head, sub, why, pills = [];
      if(scene === 'bid'){
        var uses = place === 'farm' ? CL.FARM : CL.TOWN, bands = CL.rings(uses, opts()), first = CL.useBy(uses, bands[0].id);
        head = place === 'farm' ? 'Von Thünen\'s rings come from bid rent.' : 'Bid rent sorts the city too.';
        sub = bands.map(function(b, i){ return (i + 1) + '. ' + CL.useBy(uses, b.id).short + ' to ' + fmtKm(b.to) + ' km'; }).join(', ') + '.';
        pills = [{ k: 'Ring 1 ends', html: fmtKm(bands[0].to) + ' km', tone: 'readout' }, { k: 'Last ring ends', html: fmtKm(bands[bands.length - 1].to) + ' km', tone: 'readout' }];
        void first;
        why = '<p><b>Bid-rent theory:</b> every land use can pay a certain rent for land at the center, and less the farther out it is, because getting there costs more. Each piece of land goes to whoever bids most, so the steepest line wins near the center and the flattest far out. The upper edge of the lines draws the rings.</p>' +
          (place === 'farm' ? '<p><b>Von Thünen (1826)</b> imagined one market town on a flat, even plain, with carts as the only transport. ' + CL.FARM.map(function(u, i){ return '<b>' + (i + 1) + '. ' + esc(u.name) + '.</b> ' + esc(u.why); }).join(' ') + '</p><p><b>Limits:</b> real land is not flat or even, there are many markets, and trucks, rail and refrigeration flatten the lines. Specialty farms, such as wine or flowers, often break the rings.</p>'
            : '<p>' + CL.TOWN.map(function(u, i){ return '<b>' + (i + 1) + '. ' + esc(u.name) + '.</b> ' + esc(u.why); }).join(' ') + '</p><p>This is why land values and building heights peak downtown, as the concentric zone model assumes.</p>');
      } else if(scene === 'models'){
        var C = CL.CITY[model], V = vs !== 'none' ? CL.CITY[vs] : null;
        head = C.full + (V ? ' beside the ' + V.full : '') + '.';
        sub = 'Look for ' + C.clues + '.';
        why = '<p><b>' + esc(C.full) + '.</b> Based on ' + esc(C.based) + '. ' + esc(cap(C.clues)) + '. <b>Limit:</b> ' + esc(C.limit) + '</p>' + (V ? '<p><b>' + esc(V.full) + '.</b> Based on ' + esc(V.based) + '. ' + esc(cap(V.clues)) + '. <b>Limit:</b> ' + esc(V.limit) + '</p>' : '') +
          '<p>Every model simplifies. Real cities mix features of several, so name the model whose pattern fits best and say where it fails.</p>';
      } else if(scene === 'central'){
        var g = CL.GOODS.filter(function(x){ return x.id === good; })[0];
        head = g.name + ': a ' + g.order + '-order ' + (g.id === 'heart' ? 'service' : 'good') + '.';
        sub = 'Range about ' + g.range + ' km; threshold about ' + CL.fmtN(g.threshold) + ' people (invented figures).';
        pills = [{ k: 'Range', html: g.range + ' km', tone: 'readout' }, { k: 'Threshold', html: CL.fmtN(g.threshold), tone: 'readout' }];
        why = '<p><b>Central place theory</b> says settlements serve the area around them. The <b>range</b> is the farthest people will travel for a good; the <b>threshold</b> is the fewest customers it needs to stay in business. Low-order goods (bread) have a small range and threshold, so even villages have them; high-order goods (heart surgery) need so many customers that only the largest cities offer them. Market areas are drawn as hexagons because hexagons fill a plain with no gaps or overlaps.</p><p><b>Limits:</b> it assumes a flat plain, people spread evenly and shoppers who always go to the nearest place. Online shopping and cars change ranges.</p>';
      } else {
        head = rk === 'rule' ? 'These cities follow the rank-size rule.' : 'This country has a primate city.';
        sub = rk === 'rule' ? 'The second city is about half the largest, the third about a third.' : 'The largest city is five times the second: far more than the rule predicts.';
        why = '<p>The <b>rank-size rule</b> says the city of rank n has 1/n the population of the largest. Countries with many connected cities often come close. A <b>primate city</b> is far larger than the second city and dominates the country\'s politics, economy and culture, often as a former colonial capital.</p><p>Which pattern a country shows depends on how its cities are defined (city proper or metro area), so always name the definition and source.</p>';
      }
      T.explain($('.cl-say'), '<b>' + esc(head) + '</b> ' + esc(sub), why);
      more();
      if(LS){ LS.caption('<b>' + esc(head) + '</b> ' + esc(sub), 'explore'); LS.pills(pills, 'left', 'explore'); }
    }
    function cap(s){ return s.charAt(0).toUpperCase() + s.slice(1); }
    function more(){
      var el = $('.cl-more'); if(!el) return;
      el.innerHTML = '<h3 class="ls-title-l">The bid-rent lines (invented numbers)</h3>' + T.dataTable(['Land use', 'Bid at the center', 'Falls per km'], CL.FARM.concat(CL.TOWN).map(function(u){ return [u.name, '$' + CL.fmtN(u.A), '$' + CL.fmtN(u.a)]; }), 'Farm uses per hectare a year; city uses per square meter a year') +
        '<h3 class="ls-title-l">The city models</h3>' + T.dataTable(['Model', 'Look for', 'A limit'], CL.CITY_IDS.map(function(k){ var C = CL.CITY[k]; return [C.full, cap(C.clues), C.limit]; }), 'Urban models (CED 6.5)') +
        '<p class="bt-small">The Latin American, Southeast Asian and African models are named by region, as the course framework names them.</p>';
    }
    function studio(pane, s){
      LS = s;
      T.studioPane(pane, s, { stage: [$('.cl-fig')], dock: [$('.cl-ctl')], why: [$('.cl-say')], details: [$('.cl-more')] });
      s.root.addEventListener('click', onClick);
      host.removeEventListener('click', onClick);
      sync(); draw(); words();
      if(s.mode() === 'explore') T.hintSlot(s, sTc.el, 'Start here: change the cost of transport', { cls: 'cl-tipslot' });
      if(window.ResizeObserver){ var t = null; new ResizeObserver(function(){ clearTimeout(t); t = setTimeout(draw, 60); }).observe($('.cl-pic')); }
    }
    sync(); draw(); words();
    return { studio: studio };
  }

  /* ------------------------------------------------------ test yourself */
  var TITLES = { rings: 'Von Thünen\'s rings', bidrent: 'Bid rent', models: 'City models', central: 'Central place theory', ranksize: 'The rank-size rule' };
  function quiz(host, data){
    T.drill(host, data, { slug: 'city-lab', noun: 'drill',
      generate: function(r, ctx, type){ return CL.generate(r, ctx, type); },
      types: [{ value: 'rings', label: 'Von Thünen\'s rings' }, { value: 'bidrent', label: 'Bid rent' }, { value: 'models', label: 'City models' }, { value: 'central', label: 'Central place theory' }, { value: 'ranksize', label: 'The rank-size rule' }],
      typeLabel: 'Kind of problem',
      title: function(p){ return TITLES[p.type] || 'Practice problem'; },
      extra: function(el, p){ figure(el, p); }
    });
  }
  function figure(el, p){
    var g = p.figure; if(!g || g.kind !== 'bidrent'){ el.innerHTML = ''; return; }
    var W = phone() ? 340 : 560, H = phone() ? 260 : 340, inner = '';
    if(g.kind === 'bidrent'){
      var uses = g.farm ? CL.FARM : CL.TOWN, u = CL.useBy(uses, g.u), v = CL.useBy(uses, g.v), maxD = Math.ceil(Math.max(u.A / u.a, v.A / v.a) / 5) * 5;
      var two = [u, v];
      var spec = { label: 'Two bid-rent lines, ' + u.name.toLowerCase() + ' and ' + v.name.toLowerCase() + ', with a dashed line at ' + g.d + ' km', width: W, height: H, x: [0, maxD], y: [0, Math.ceil(u.A * 1.08 / 50) * 50],
        xLabel: phone() ? '' : 'Distance (km)', yLabel: g.farm ? 'Bid rent ($ per hectare)' : 'Bid rent ($ per square meter)', asymptotes: [{ x: g.d }],
        curves: two.map(function(w){ var i = uses.indexOf(w); return { fn: function(d){ return CL.bid(w, d, {}); }, domain: [0, w.A / w.a], cls: 's' + (i + 1) }; }) };
      inner = Plot.svg(spec) + '<ul class="cl-legend" aria-label="Legend">' + two.map(function(w){ var i = uses.indexOf(w); return '<li><span class="cl-sw s' + (i + 1) + '" aria-hidden="true"></span>' + esc(w.name) + '</li>'; }).join('') + '<li><span class="cl-sw is-dash" aria-hidden="true"></span>' + g.d + ' km</li>' + (phone() ? '<li>Across: distance (km)</li>' : '') + '</ul>';
    }
    el.innerHTML = '<figure class="cd-fig cl-qfig">' + inner + '</figure>';
  }
})();
