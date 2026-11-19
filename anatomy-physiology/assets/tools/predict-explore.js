/* A&P Predict the change, tools v2 Explore (docs/tools-v2-anp-predict-brief.md; standard docs/tools-v2-standard.md).

   The one idea: a change in the body spreads through a mechanism, one cause after another, and some things do not
   change at all. Each screen draws one body system from the bank's scenarios (an arteriole feeding a tissue, breathing
   and the blood, ADH and the collecting duct, the heart filling). The student makes the change with the one knob on
   the picture (squeeze the arteriole, breathe faster or slower, raise or lower ADH, send more or less blood back) and
   watches the effect travel: each link of the chain moves after the one before it, its label gains an arrow as it
   moves, and the cause line names the chain in order. The thing that stays the same is labeled "same".

   The picture is a pure function of the shown values: the knob sets a target, the shown control chases it, and every
   later link chases what its cause shows NOW (a chain of lags), so a jump is seen spreading. Labels, numbers, the cause
   line and the takeaway are all read from the same shown values (never from the targets).

   Data: the bank's scenarios (anatomy-physiology/data/tools/predict.json) name each screen's "Test yourself on this"
   set; nothing here changes an item id or a record (predict.js keeps every scenario in Test yourself).
   window.AnpPredictExplore.build({ data, base, studio, onQuiz(ids) }) -> { stage, ref, shown(on), tab(id?), tabFor(q) } */
(function(){
  'use strict';
  if(window.AnpPredictExplore) return;
  var NS = 'http://www.w3.org/2000/svg';
  function clamp(v, a, b){ return v < a ? a : v > b ? b : v; }
  function lerp(a, b, t){ return a + (b - a) * t; }
  function ss(t){ t = clamp(t, 0, 1); return t * t * (3 - 2 * t); }
  function esc(s){ return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function f1(v){ return (Math.round(v * 10) / 10).toFixed(1); }
  function P(pts){ return pts.map(function(p, i){ return (i ? 'L' : 'M') + f1(p[0]) + ',' + f1(p[1]); }).join(''); }
  function sa(el, k, v){ v = String(v); if(el.getAttribute(k) !== v) el.setAttribute(k, v); }
  function so(el, v){ v = String(v); if(el.style.opacity !== v) el.style.opacity = v; }
  function scatter(n, seed){ var a = [], i; for(i = 0; i < n; i++) a.push([((i + 1) * 0.6180339887 + (seed || 0)) % 1, ((i + 1) * 0.7548776662 + (seed || 0) * 0.37) % 1]); return a; }
  function fmtFac(x){
    if(!isFinite(x) || x <= 0) return '';
    if(x >= 1) return '×' + (x >= 9.5 ? Math.round(x) : x.toFixed(1).replace(/\.0$/, ''));
    var i = 1 / x;
    return '×1/' + (i >= 9.5 ? Math.round(i) : i.toFixed(1).replace(/\.0$/, ''));
  }
  function mixc(a, b, t){
    var x = a.match(/\w\w/g).map(function(h){ return parseInt(h, 16); }), y = b.match(/\w\w/g).map(function(h){ return parseInt(h, 16); });
    return 'rgb(' + x.map(function(v, i){ return Math.round(lerp(v, y[i], clamp(t, 0, 1))); }).join(',') + ')';
  }
  // a circle as path commands (many in one path)
  function circ(x, y, r){ return 'M' + f1(x - r) + ',' + f1(y) + 'a' + f1(r) + ',' + f1(r) + ' 0 1,0 ' + f1(2 * r) + ',0a' + f1(r) + ',' + f1(r) + ' 0 1,0 ' + f1(-2 * r) + ',0'; }
  // a water drop of size k at x, y (path commands)
  function drop(x, y, k){ return 'M' + f1(x) + ',' + f1(y - 7 * k) + 'c' + f1(4 * k) + ',' + f1(5 * k) + ' ' + f1(6 * k) + ',' + f1(9 * k) + ' ' + f1(6 * k) + ',' + f1(11 * k) + 'a' + f1(6 * k) + ',' + f1(6 * k) + ' 0 0 1 ' + f1(-12 * k) + ',0c0,' + f1(-2 * k) + ' ' + f1(2 * k) + ',' + f1(-6 * k) + ' ' + f1(6 * k) + ',' + f1(-11 * k) + 'Z'; }
  function comma(n){ return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ','); }
  var UP = '↑', DN = '↓';
  function arrow(d){ return d > 0 ? UP : d < 0 ? DN : ''; }

  /* ------------------------------------------------------------------ the flow route (cells, drops) */
  /* pts: [x, y, hw] points; a(i) the cross section at point i (speed = flow / a). Positions along the route are kept
     in "volume" units, so the same flow carries a cell slowly where the vessel is wide and fast where it is narrow. */
  function Flow(pts, area){
    var self = this, n = pts.length, L = [0], U = [0], i;
    for(i = 1; i < n; i++) L.push(L[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
    self.pts = pts; self.L = L;
    self.update = function(){
      U = [0];
      for(var j = 1; j < n; j++) U.push(U[j - 1] + (L[j] - L[j - 1]) * (area(j - 1) + area(j)) / 2);
      self.U = U[n - 1];
    };
    self.update();
    // the point (and the normal) at volume position u
    self.at = function(u){
      u = clamp(u, 0, self.U);
      var lo = 0, hi = n - 1;
      while(hi - lo > 1){ var m = (lo + hi) >> 1; if(U[m] <= u) lo = m; else hi = m; }
      var t = (u - U[lo]) / ((U[hi] - U[lo]) || 1), a = pts[lo], b = pts[hi], dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy) || 1;
      return { x: lerp(a[0], b[0], t), y: lerp(a[1], b[1], t), nx: -dy / len, ny: dx / len, i: lo, t: t };
    };
  }

  /* ================================================================== the screens */
  var SCENES = [];

  /* ------------------------------------------------------------------ 1. Arteriole: radius, resistance, flow */
  (function(){
    var R0 = 44;   // the arteriole's lumen half width at its usual radius (picture units; larger on the wide picture)
    function rFmt(r){ return r.toFixed(2).replace(/0$/, '').replace(/\.$/, ''); }
    function muscle(r){ return 9 + 8 / Math.sqrt(r); }   // the smooth muscle coat thickens as it contracts
    /* the route of the blood: artery (cut end) -> arteriole (radius r) -> capillary bed (three capillaries) -> venule
       (cut end). Each point: [x, y, kind, spread]; kind a (artery), r (arteriole), c (capillaries), v (venule). */
    function route(L){
      size(L);
      if(L.id === 'wide') return [
        [40, 262, 'a', 0], [150, 262, 'a', 0], [240, 262, 'a', 0], [286, 262, 'r', 0], [400, 262, 'r', 0], [520, 262, 'r', 0], [600, 262, 'r', 0], [650, 262, 'r', 0],
        [700, 262, 'c', 36], [744, 262, 'c', 150], [810, 262, 'c', 170], [880, 262, 'c', 150], [926, 262, 'c', 36], [968, 262, 'v', 0], [1040, 262, 'v', 0]
      ];
      return [
        [36, 150, 'a', 0], [100, 150, 'a', 0], [150, 150, 'a', 0], [188, 150, 'r', 0], [300, 150, 'r', 0], [400, 152, 'r', 0], [446, 168, 'r', 0],
        [470, 208, 'r', 0], [468, 256, 'r', 0], [446, 300, 'r', 0], [410, 340, 'c', 24], [370, 372, 'c', 82], [300, 380, 'c', 94], [210, 380, 'c', 94], [150, 374, 'c', 82],
        [112, 352, 'c', 24], [88, 400, 'v', 0], [78, 480, 'v', 0], [80, 556, 'v', 0]
      ];
    }
    var HW = { a: 56, v: 50, c: 10 };
    function size(L){ var w = L.id === 'wide'; R0 = w ? 54 : 44; HW.a = w ? 68 : 56; HW.v = w ? 60 : 50; }
    function hw(p, r){ return p[2] === 'r' ? R0 * r : HW[p[2]]; }
    function area(p, r){ return p[2] === 'c' ? 2600 : hw(p, r) * hw(p, r); }
    // the outline of a tube of varying width along points (left edge forward, right edge back)
    function outline(pts, w){
      var left = [], right = [];
      pts.forEach(function(p, i){
        var a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy) || 1, nx = -dy / len, ny = dx / len, d = w(p, i);
        left.push([p[0] + nx * d, p[1] + ny * d]); right.push([p[0] - nx * d, p[1] - ny * d]);
      });
      return P(left.concat(right.reverse())) + 'Z';
    }
    function smooth(pts){
      // a gentle curve through points (quadratic midpoints)
      if(pts.length < 3) return P(pts);
      var d = 'M' + f1(pts[0][0]) + ',' + f1(pts[0][1]);
      for(var i = 1; i < pts.length - 1; i++){ var m = [(pts[i][0] + pts[i + 1][0]) / 2, (pts[i][1] + pts[i + 1][1]) / 2]; d += 'Q' + f1(pts[i][0]) + ',' + f1(pts[i][1]) + ' ' + f1(m[0]) + ',' + f1(m[1]); }
      var e = pts[pts.length - 1];
      return d + 'L' + f1(e[0]) + ',' + f1(e[1]);
    }
    var LAY = { wide: { w: 1080, h: 540 }, tall: { w: 600, h: 600 } };
    // the two gauges: [x, y, stem rotation]
    function gauges(L){ return L.id === 'wide' ? { i: [150, 138, 0], o: [1004, 150, 0] } : { i: [92, 30, 0], o: [168, 500, 90] }; }
    function seg(L, kinds){ return route(L).filter(function(p){ return kinds.indexOf(p[2]) > -1; }); }
    // capillary i's center line (lane -1, 0, 1), from the route's spread
    function capLine(L, lane){
      var pts = route(L), out = [], i;
      for(i = 0; i < pts.length; i++){
        var p = pts[i]; if(p[2] !== 'c' && !(pts[i - 1] && pts[i - 1][2] === 'c') && !(pts[i + 1] && pts[i + 1][2] === 'c')) continue;
        var a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy) || 1;
        var s = p[2] === 'c' ? p[3] : 0;
        out.push([p[0] - dy / len * s * lane, p[1] + dx / len * s * lane]);
      }
      return out;
    }
    // a pressure gauge on its stem; rot turns the stem toward the vessel (0: stem down)
    function gauge(x, y, cls, rot){
      return '<g class="px-gauge" transform="translate(' + f1(x) + ',' + f1(y) + ')' + (rot ? ' rotate(' + rot + ')' : '') + '"><path class="px-gstem" d="M0,26 V44"/><circle class="px-gface" r="25"/>' +
        '<path class="px-gtick" d="M-17,10 L-14,8 M-19,0 L-15.5,0 M-17,-10 L-14,-8 M-10,-17 L-8,-14 M0,-20 V-16 M10,-17 L8,-14 M17,-10 L14,-8"/>' +
        '<path class="px-gneedle ' + cls + '" d="M0,0 L' + (cls === 'is-in' ? '12,-15' : '-17,6') + '"/><circle class="px-gpin" r="3.2"/></g>';
    }
    SCENES.push({
      id: 'vessel', tab: 'Arteriole', short: 'Vessel', topics: ['gradients-flow', 'blood-pressure-flow'],
      bank: ['tube-narrows', 'one-organ-constricts', 'arterioles-dilate', 'coronary-narrowing'],
      purpose: 'Squeeze the arteriole and watch the flow change',
      cue: 'Drag the wall', thing: 'the arteriole wall', layouts: LAY,
      ctl: { min: 0.5, max: 1.3, step: 0.01, base: 1, key: 0.005, label: 'Arteriole radius',
        text: function(v){ return 'radius ' + Math.round(v * 100) + ' percent of usual'; } },
      nodes: [
        // the arteriole's resistance is its geometry, and the flow follows at once (the end pressures are held)
        { id: 'res', from: 'c', sign: -1, tau: 0, f: function(r){ return 1 / Math.pow(r, 4); }, rel: 0.002 },
        // between the gauges the blood passes the arteriole and then the capillary bed; the arteriole is taken as half of
        // that resistance at its usual radius (px-vessel-model), so half the radius gives about 1/8.5 of the flow
        { id: 'flow', from: 'res', sign: -1, tau: 0, f: function(R){ return 2 / (R + 1); }, rel: 0.002 }
      ],
      rest: 'Drag the arteriole’s wall in to squeeze it, or out to let it widen.',
      art: function(E){
        var L = E.L, s = '<defs>' +
          '<linearGradient id="px-art" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#E98A7C"/><stop offset="0.5" stop-color="#D96C5E"/><stop offset="1" stop-color="#B9493D"/></linearGradient>' +
          '<linearGradient id="px-lum" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F6C9B9"/><stop offset="1" stop-color="#EFB09D"/></linearGradient>' +
          '<radialGradient id="px-tis" cx="0.5" cy="0.45" r="0.8"><stop offset="0" stop-color="#FBE8DC"/><stop offset="1" stop-color="#F1D2C0"/></radialGradient>' +
          '<linearGradient id="px-ven" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8E7CB8"/><stop offset="1" stop-color="#5E4E8E"/></linearGradient></defs>';
        s += '<rect class="px-bg" x="-400" y="0" width="' + (L.w + 800) + '" height="' + L.h + '" fill="url(#px-tis)"/>';
        // the tissue the arteriole feeds: connective tissue everywhere, its cells packed round the capillaries
        var cells = '', fib = '', ext = L.id === 'wide' ? [-200, 0, L.w + 200, L.h] : [0, 0, L.w, L.h];
        scatter(L.id === 'wide' ? 70 : 46, 0.13).forEach(function(q, i){
          var x = lerp(ext[0], ext[2], q[0]), y = lerp(ext[1] + 10, ext[3] - 10, q[1]);
          fib += '<path class="px-fib" d="M' + f1(x - 26) + ',' + f1(y) + ' q13,' + ((i % 3) * 6 - 6) + ' 26,0 t26,0"/>';
        });
        var box = L.id === 'wide' ? [700, 70, 940, 460] : [110, 270, 430, 500];
        scatter(L.id === 'wide' ? 26 : 22, 0.31).forEach(function(q, i){
          var x = lerp(box[0], box[2], q[0]), y = lerp(box[1], box[3], q[1]);
          cells += '<g class="px-tcell" transform="translate(' + f1(x) + ',' + f1(y) + ') rotate(' + ((i * 37) % 60 - 30) + ')"><ellipse rx="23" ry="15"/><circle class="px-tnuc" cx="-4" cy="1" r="5"/></g>';
        });
        s += '<g class="px-fibs">' + fib + '</g><g class="px-cells-t">' + cells + '</g>';
        // the capillaries
        [-1, 0, 1].forEach(function(l){ var c = capLine(L, l); s += '<path class="px-capw" d="' + smooth(c) + '"/><path class="px-capl" d="' + smooth(c) + '"/>'; });
        // artery and venule (cut ends drawn as rims)
        var A = seg(L, 'a'), V = seg(L, 'v');
        s += '<path class="px-artw" d="' + outline(A, function(){ return HW.a + 12; }) + '" fill="url(#px-art)"/><path class="px-lumen" d="' + outline(A, function(){ return HW.a; }) + '" fill="url(#px-lum)"/>';
        s += '<path class="px-venw" d="' + outline(V, function(){ return HW.v + 8; }) + '" fill="url(#px-ven)"/><path class="px-lumen is-v" d="' + outline(V, function(){ return HW.v; }) + '"/>';
        var a0 = A[0], v1 = V[V.length - 1], va = V[V.length - 2];
        var vang = Math.atan2(v1[1] - va[1], v1[0] - va[0]) * 180 / Math.PI;
        s += '<ellipse class="px-rim" cx="' + a0[0] + '" cy="' + a0[1] + '" rx="12" ry="' + (HW.a + 12) + '"/><ellipse class="px-rim-in" cx="' + a0[0] + '" cy="' + a0[1] + '" rx="8" ry="' + HW.a + '"/>';
        s += '<g transform="translate(' + v1[0] + ',' + v1[1] + ') rotate(' + f1(vang) + ')"><ellipse class="px-rim is-v" rx="10" ry="' + (HW.v + 8) + '"/><ellipse class="px-rim-in" rx="6" ry="' + HW.v + '"/></g>';
        // the arteriole: wall, lumen and its smooth muscle bands (drawn each frame)
        s += '<path class="px-aw" data-r="aw" fill="url(#px-art)"/><path class="px-lumen" data-r="al" fill="url(#px-lum)"/><g data-r="bands"></g>';
        // pressure gauges at the two ends (the pressure that drives flow)
        var gg = gauges(L);
        s += gauge(gg.i[0], gg.i[1], 'is-in', gg.i[2]) + gauge(gg.o[0], gg.o[1], 'is-out', gg.o[2]);
        return s;
      },
      // the moving blood sits on the picture's own layer (fx), so the drawn tissue is not repainted every frame
      fx: function(){ return '<g data-r="rbc"></g>'; },
      init: function(E, R){
        var L = E.L, pts = route(L), self = this;
        E.r = 1;
        E.flow = new Flow(pts.map(function(p){ return [p[0], p[1]]; }), function(i){ return area(pts[i], E.r); });
        // every red cell is drawn in two paths (rims, pale centres): two attribute writes a frame, not one per cell
        var n = L.id === 'wide' ? 54 : 50, i;
        R.rbc.innerHTML = '<path class="px-rbc-o"/><path class="px-rbc-c"/>';
        E.rbcO = R.rbc.firstChild; E.rbcC = R.rbc.lastChild;
        E.cells = []; for(i = 0; i < n; i++) E.cells.push({ u: (i / n) * E.flow.U, lane: (i % 3) - 1, j: ((i * 7) % 5 - 2) * 0.12 });
        var bands = '';
        for(i = 0; i < 40; i++) bands += '<path class="px-band"/>';
        R.bands.innerHTML = bands;
        E.bands = [].slice.call(R.bands.childNodes);
        E.lastR = -1;
        self._pts = pts;
      },
      paint: function(st, E, R, dt){
        var L = E.L, pts = this._pts, r = st.c;
        // the arteriole's shape (only when the shown radius moved)
        if(Math.abs(r - E.lastR) > 1e-4){
          E.lastR = r; E.r = r; E.flow.update();
          var A = pts.filter(function(p, i){ return p[2] === 'r' || (pts[i + 1] && pts[i + 1][2] === 'r' && p[2] === 'a') || (pts[i - 1] && pts[i - 1][2] === 'r' && p[2] === 'c'); });
          var m = muscle(r);
          sa(R.aw, 'd', outline(A, function(p){ return (p[2] === 'r' ? R0 * r : p[2] === 'a' ? HW.a : 12) + (p[2] === 'r' ? m : 12); }));
          sa(R.al, 'd', outline(A, function(p){ return p[2] === 'r' ? R0 * r : p[2] === 'a' ? HW.a : 10; }));
          // the bands of smooth muscle round it, on both edges, thicker as it squeezes
          var rp = pts.filter(function(p){ return p[2] === 'r'; }), fl = new Flow(rp.map(function(p){ return [p[0], p[1]]; }), function(){ return 1; }), k = 0, nb = E.bands.length / 2;
          for(var b = 0; b < nb; b++){
            var q = fl.at((b + 0.5) / nb * fl.U), w = R0 * r, tilt = 2.5;
            [1, -1].forEach(function(sd){
              var x0 = q.x + q.nx * w * sd, y0 = q.y + q.ny * w * sd, x1 = q.x + q.nx * (w + m) * sd, y1 = q.y + q.ny * (w + m) * sd;
              var tx = -q.ny * tilt, ty = q.nx * tilt;
              sa(E.bands[k++], 'd', 'M' + f1(x0 - tx) + ',' + f1(y0 - ty) + 'L' + f1(x1 + tx) + ',' + f1(y1 + ty));
            });
          }
        }
        // the blood: every cell moves at flow / cross section; the shown flow sets the pace
        var Q = st.v.flow, U = E.flow.U, sp = (L.id === 'wide' ? 0.26 : 0.24) * U / 1000;   // a usual flow crosses in about 4 s
        var dO = '', dC = '';
        E.cells.forEach(function(c){
          if(dt) c.u = (c.u + Q * sp * dt) % U;
          var p = E.flow.at(c.u), pt = pts[p.i], nxt = pts[Math.min(pts.length - 1, p.i + 1)];
          var w = lerp(hw(pt, r), hw(nxt, r), p.t), spr = lerp(pt[2] === 'c' ? pt[3] : 0, nxt[2] === 'c' ? nxt[3] : 0, p.t);
          var off = spr > 1 ? c.lane * spr + c.j * 6 : (c.lane * 0.55 + c.j * 0.5) * Math.max(0, w - 10);
          var sc = clamp(Math.min(w, spr > 1 ? 10 : w) / 10, 0.62, 1);
          dO += circ(p.x + p.nx * off, p.y + p.ny * off, 10 * sc); dC += circ(p.x + p.nx * off, p.y + p.ny * off, 4.6 * sc);
        });
        sa(E.rbcO, 'd', dO); sa(E.rbcC, 'd', dC);
      },
      avoid: function(E){ var g = gauges(E.L); return [[g.i[0] - 28, g.i[1] - 28, g.i[0] + 28, g.i[1] + 28], [g.o[0] - 28, g.o[1] - 28, g.o[0] + 28, g.o[1] + 28]]; },
      track: function(L){
        // the knob rides the arteriole's top wall
        return L.id === 'wide' ? { x: 470, y: 262, dir: -1 } : { x: 214, y: 150, dir: -1 };
      },
      knobAt: function(v, L){ size(L); var t = this.track(L); return [t.x, t.y + t.dir * (R0 * v + muscle(v) * 0.55)]; },
      knobPick: function(x, y, L){ size(L); var t = this.track(L); return ((t.y - y) * -t.dir - 6) / R0; },
      labels: function(st, E){
        var L = E.L, r = st.c, wide = L.id === 'wide', d = st.d, off = !!st.dc;
        var mid = wide ? [560, 262] : [380, 150], cap = wide ? [810, 262 + 156] : [255, 380 + 94], gg = gauges(L), gi = gg.i, go = gg.o;
        return [
          { key: 'r', text: 'Radius ' + (off ? arrow(st.dc) + ' \u00d7' + rFmt(r) : ''), role: 'mus', strong: true, at: [mid[0], mid[1] + R0 * r + muscle(r) * 0.5], side: ['d'] },
          { key: 'res', text: 'Resistance ' + (d.res ? arrow(d.res) + ' ' + fmtFac(st.v.res) : ''), role: 'res', at: [mid[0] - (wide ? 200 : 170), mid[1] - R0 * r - muscle(r)], side: ['u'] },
          { key: 'flow', text: 'Blood flow ' + arrow(d.flow), role: 'flow', at: cap, side: ['d', 'u'] },
          { key: 'pin', text: 'Pressure in' + (st.dc ? ' same' : ''), role: 'same', at: [gi[0] + 28, gi[1]], side: ['r', 'u'] },
          { key: 'pout', text: 'Pressure out' + (st.dc ? ' same' : ''), role: 'same', at: wide ? [go[0] - 28, go[1]] : [go[0] + 28, go[1]], side: wide ? ['l', 'u'] : ['r', 'u'] }
        ];
      },
      words: function(st){
        var d = st.d, out = [{ t: 'Radius ' + arrow(st.dc), role: 'mus', say: (st.dc < 0 ? 'the radius falls' : 'the radius rises') }];
        if(d.res){ out.push({ t: 'Resistance ' + arrow(d.res), role: 'res', say: 'resistance ' + (d.res > 0 ? 'rises' : 'falls') });
          if(d.flow) out.push({ t: 'Flow ' + arrow(d.flow), role: 'flow', say: 'flow ' + (d.flow > 0 ? 'rises' : 'falls') }); }
        return out;
      },
      take: function(st){
        var r = st.c;
        return 'Radius \u00d7' + rFmt(r) + ': arteriole resistance ' + fmtFac(st.v.res) + ', so blood flow ' + (st.v.flow < 1 ? 'falls' : 'rises') + '. End pressures same.';
      },
      note: 'Resistance depends on the fourth power of the radius, so half the radius gives the arteriole 2 × 2 × 2 × 2 = 16 times its resistance. Between the two gauges the blood passes the arteriole and then the capillary bed, so with the pressures at the two ends held the same, the flow falls a great deal but not to one sixteenth (that is true only for a single tube): here the arteriole is taken as half of the resistance at its usual size, so half its radius leaves about one eighth of the flow. The blood cells move at the flow divided by the width of the vessel, so they crowd slowly through the wide capillary bed and speed through a narrow arteriole. Arterioles are where most of an organ’s resistance is, and their smooth muscle sets the radius. Not drawn: the pressure inside the capillaries beyond a squeezed arteriole falls, because more pressure is used up in the arteriole.'
    });
  })();

  /* ------------------------------------------------------------------ 2. Breathing: CO2, H+ and pH */
  (function(){
    var LAY = { wide: { w: 1080, h: 540 }, tall: { w: 600, h: 640 } };
    function pco2(f){ return 40 * 12 / f; }
    function hco3(p){ return 24 + (p < 40 ? 0.2 : 0.1) * (p - 40); }   // acute: buffers only, kidneys not yet
    function hOf(p){ var ph = 6.1 + Math.log10(hco3(p) / (0.03 * p)); return Math.pow(10, 9 - ph); }   // nmol/L
    function sat(p){ var po = 150 - p / 0.8; return 100 / (23400 / (po * po * po + 150 * po) + 1); }
    // geometry per layout: the person, the magnified alveolus, capillary and plasma
    function G(L){
      if(L.id === 'wide') return { man: [26, 6, 0.98], lens: [232, 330, 24], zoom: [400, 22, 660, 496], alv: [730, 222, 300, 150], cap: [400, 352, 1060, 492], track: [70, 504, 320, 504] };
      return { man: [8, 0, 0.66], lens: [147, 218, 18], zoom: [14, 300, 572, 326], alv: [300, 425, 250, 74], cap: [14, 490, 586, 612], track: [236, 150, 520, 150] };
    }
    function person(){
      // a person from the waist up, front view, the chest opened to show the lungs (its own units, about 330 x 470)
      return '<g class="px-man">' +
        '<path class="px-skin" d="M118,118 C110,70 136,32 170,32 C204,32 230,70 222,118 C218,150 196,170 170,170 C144,170 122,150 118,118 Z"/>' +
        '<path class="px-hair" d="M116,96 C112,52 140,22 172,22 C206,22 232,50 226,98 C220,72 206,58 188,56 C168,64 140,62 124,72 C118,80 117,88 116,96 Z"/>' +
        '<ellipse class="px-skin" cx="115" cy="112" rx="8" ry="13"/><ellipse class="px-skin" cx="225" cy="112" rx="8" ry="13"/>' +
        '<path class="px-face" d="M150,102 q6,-5 12,0 M178,102 q6,-5 12,0"/><circle class="px-eye" cx="156" cy="110" r="3.4"/><circle class="px-eye" cx="184" cy="110" r="3.4"/>' +
        '<path class="px-face" d="M170,114 q-4,14 3,18"/><path class="px-mouth" data-r="mouth" d="M158,145 q12,7 24,0"/>' +
        '<path class="px-skin" d="M150,162 h40 v26 h-40 Z"/>' +
        '<path class="px-shirt" d="M40,250 C46,212 84,190 150,182 L190,182 C256,190 294,212 300,250 L318,470 H22 Z"/>' +
        '<path class="px-shirt-f" d="M150,182 L170,206 L190,182 M92,206 C84,260 80,340 84,470 M248,206 C256,260 260,340 256,470"/>' +
        '<path class="px-chest" d="M88,214 C110,200 230,200 252,214 L262,430 C230,446 110,446 78,430 Z"/>' +
        '<g data-r="lungs" class="px-lungs"><path class="px-trach" d="M170,188 V246 M170,246 L140,268 M170,246 L200,268"/>' +
        '<path class="px-lung" d="M160,250 C150,232 128,228 112,240 C92,256 86,320 88,384 C90,414 112,422 138,412 C156,404 162,380 162,350 Z"/>' +
        '<path class="px-lung" d="M180,250 C190,232 212,228 228,240 C248,256 254,320 252,384 C250,414 228,422 202,412 C184,404 178,380 178,350 Z"/>' +
        '<path class="px-bron" d="M140,268 L124,300 M140,268 L142,318 M124,300 L110,338 M124,300 L132,350 M200,268 L216,300 M200,268 L198,318 M216,300 L230,338 M216,300 L208,350"/></g>' +
        '<path class="px-dia" data-r="dia" d="M84,420 C120,394 220,394 256,420"/>' +
        '</g>';
    }
    SCENES.push({
      id: 'breath', tab: 'Breathing', short: 'Breath', topics: ['breathing-control', 'co2-transport'],
      bank: ['hyperventilation', 'breath-hold', 'opioid-overdose', 'fab-anxiety'],
      purpose: 'Change how fast you breathe and watch the blood’s pH',
      cue: 'Drag the breathing rate', thing: 'the breathing rate', layouts: LAY,
      ctl: { min: 8, max: 24, step: 1, base: 12, key: 0.5, label: 'Breaths a minute',
        text: function(v){ return Math.round(v) + ' breaths a minute'; }, tag: function(v){ return Math.round(v) + ' a min'; } },
      nodes: [
        { id: 'co2', from: 'c', sign: -1, tau: 650, f: pco2, rel: 0.002 },
        { id: 'h', from: 'co2', sign: 1, tau: 320, f: hOf, rel: 0.002 },
        { id: 'ph', from: 'h', sign: -1, tau: 0, f: function(h){ return 9 - Math.log10(h); }, abs: 0.001 },
        { id: 'sat', from: 'co2', sign: -1, tau: 380, f: sat, abs: 0.05 }
      ],
      rest: 'Drag the knob to breathe faster or slower than the usual 12 a minute.',
      art: function(E){
        var L = E.L, g = G(L), s = '<defs><radialGradient id="px-bgb" cx="0.3" cy="0.3" r="1"><stop offset="0" stop-color="#F4F7FA"/><stop offset="1" stop-color="#E3EAF1"/></radialGradient>' +
          '<radialGradient id="px-alvg" cx="0.45" cy="0.35" r="0.75"><stop offset="0" stop-color="#FDF3F3"/><stop offset="1" stop-color="#F6D3D4"/></radialGradient>' +
          '<linearGradient id="px-plas" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F7E1B8"/><stop offset="1" stop-color="#EECB8E"/></linearGradient>' +
          '<radialGradient id="px-lungg" cx="0.45" cy="0.4" r="0.75"><stop offset="0" stop-color="#F9C9CB"/><stop offset="1" stop-color="#E5939A"/></radialGradient></defs>';
        s += '<rect class="px-bg is-b" x="-400" y="0" width="' + (L.w + 800) + '" height="' + L.h + '" fill="url(#px-bgb)"/>';
        s += '<g transform="translate(' + g.man[0] + ',' + g.man[1] + ') scale(' + g.man[2] + ')">' + person() + '</g>';
        // the magnifier: from a spot in the right lung to the enlarged view
        var z = g.zoom, lx = g.lens[0], ly = g.lens[1], wideL = L.id === 'wide';
        s += '<path class="px-zl" d="M' + lx + ',' + ly + ' L' + (wideL ? z[0] : z[0] + z[2] * 0.42) + ',' + (wideL ? z[1] + z[3] * 0.62 : z[1]) + '"/><circle class="px-lens" cx="' + lx + '" cy="' + ly + '" r="' + g.lens[2] + '"/>';
        s += '<rect class="px-zoom" x="' + z[0] + '" y="' + z[1] + '" width="' + z[2] + '" height="' + z[3] + '" rx="22"/>';
        s += '<clipPath id="px-zc"><rect x="' + z[0] + '" y="' + z[1] + '" width="' + z[2] + '" height="' + z[3] + '" rx="22"/></clipPath><g clip-path="url(#px-zc)">';
        // neighbouring alveoli, the alveolus, its airway
        var a = g.alv;
        s += '<path class="px-alvw" d="M' + (a[0] - 14) + ',' + (z[1] - 10) + ' V' + (a[1] - a[3] * 0.82) + '"/>';
        [[-1.45, 0.25], [1.45, 0.3], [-0.85, -0.7], [0.9, -0.72]].forEach(function(o){ s += '<ellipse class="px-alvn" cx="' + f1(a[0] + o[0] * a[2] * 0.8) + '" cy="' + f1(a[1] + o[1] * a[3]) + '" rx="' + f1(a[2] * 0.5) + '" ry="' + f1(a[3] * 0.62) + '"/>'; });
        s += '<ellipse class="px-alv" data-r="alv" cx="' + a[0] + '" cy="' + a[1] + '" rx="' + a[2] / 2 + '" ry="' + a[3] * 0.82 + '" fill="url(#px-alvg)"/>';
        // the capillary under it, with plasma
        var c = g.cap;
        s += '<rect class="px-capwall" x="' + (c[0] - 40) + '" y="' + (c[1] - 9) + '" width="' + (c[2] - c[0] + 80) + '" height="' + (c[3] - c[1] + 18) + '"/>';
        s += '<rect class="px-plasma" x="' + (c[0] - 40) + '" y="' + c[1] + '" width="' + (c[2] - c[0] + 80) + '" height="' + (c[3] - c[1]) + '" fill="url(#px-plas)"/>';
        s += '<g data-r="rbc"></g><g data-r="co2b"></g><g data-r="hion"></g><g data-r="co2a"></g>';
        s += '</g>';
        // the exhaled air at the mouth (CO2 leaving)
        s += '<g data-r="puff"></g>';
        var tr = g.track;
        s += '<path class="px-rail" d="M' + tr[0] + ',' + tr[1] + ' H' + tr[2] + '"/>';
        for(var ti = 0; ti <= 4; ti++){ var tx = lerp(tr[0], tr[2], ti / 4); s += '<path class="px-railt" d="M' + f1(tx) + ',' + (tr[1] - 9) + ' V' + (tr[1] + 9) + '"/>'; }
        return s;
      },
      init: function(E, R){
        var L = E.L, g = G(L), c = g.cap, a = g.alv, i, h;
        E.g = g; E.ph = 0;
        // red blood cells in the capillary (drift with the blood)
        h = ''; var nr = L.id === 'wide' ? 9 : 7;
        for(i = 0; i < nr; i++) h += '<g class="px-rbc"><ellipse class="px-rbc-o" rx="17" ry="11"/><ellipse class="px-rbc-c" rx="8" ry="4.2"/></g>';
        R.rbc.innerHTML = h;
        E.rbcs = [].slice.call(R.rbc.childNodes).map(function(n, k){ return { g: n, u: k / nr, y: lerp(c[1] + 18, c[3] - 16, (k * 0.618) % 1) }; });
        // CO2 molecules: a pool in the plasma and in the alveolus; how many show follows PCO2 (10 at 40 mm Hg)
        function mol(cls){ return '<g class="' + cls + '"><circle class="px-c" r="5.2"/><circle class="px-o" cx="-8.6" r="4.4"/><circle class="px-o" cx="8.6" r="4.4"/></g>'; }
        h = ''; for(i = 0; i < 18; i++) h += mol('px-co2'); R.co2b.innerHTML = h;
        h = ''; for(i = 0; i < 18; i++) h += mol('px-co2'); R.co2a.innerHTML = h;
        h = ''; for(i = 0; i < 16; i++) h += '<g class="px-h"><circle r="9"/><path d="M-4.5,0 H4.5 M0,-4.5 V4.5"/></g>'; R.hion.innerHTML = h;
        var pb = scatter(18, 0.17), pa = scatter(18, 0.53), ph = scatter(16, 0.71);
        E.cb = [].slice.call(R.co2b.childNodes).map(function(n, k){ return { g: n, x: lerp(c[0] + 10, c[2] - 10, pb[k][0]), y: lerp(c[1] + 12, c[3] - 12, pb[k][1]), ph: k * 1.7 }; });
        E.ca = [].slice.call(R.co2a.childNodes).map(function(n, k){ var t = pa[k][0] * Math.PI * 2, rr = Math.sqrt(pa[k][1]) * 0.78; return { g: n, x: a[0] + Math.cos(t) * rr * a[2] / 2, y: a[1] + Math.sin(t) * rr * a[3] * 0.8, ph: k * 1.3 }; });
        E.hs = [].slice.call(R.hion.childNodes).map(function(n, k){ return { g: n, x: lerp(c[0] + 14, c[2] - 14, ph[k][0]), y: lerp(c[1] + 14, c[3] - 14, ph[k][1]), ph: k * 2.1 }; });
        // breath puffs from the mouth: each carries CO2 in proportion to the alveolar PCO2
        h = ''; for(i = 0; i < 6; i++) h += '<g class="px-puff"><circle class="px-puffc" r="13"/>' + mol('px-co2 is-sm') + '</g>'; R.puff.innerHTML = h;
        E.puffs = [].slice.call(R.puff.childNodes);
        E.t = 0; E.br = 0;
      },
      paint: function(st, E, R, dt){
        var g = E.g, L = E.L, f = st.c, p = st.v.co2, nH = st.v.h, cap = g.cap;
        if(dt){ E.t += dt / 1000; E.br = (E.br + dt / 1000 * f / 60) % 1; }
        var still = !dt && E.still;
        // the breath: in for the first 40 percent of each cycle, out for the rest
        var ph = E.br, inh = ph < 0.4 ? ss(ph / 0.4) : 1 - ss((ph - 0.4) / 0.6);
        if(E.still) inh = 0.5;
        sa(R.lungs, 'transform', 'translate(170,330) scale(' + (1 + 0.06 * inh).toFixed(3) + ',' + (1 + 0.09 * inh).toFixed(3) + ') translate(-170,-330)');
        sa(R.dia, 'transform', 'translate(0,' + f1(14 * inh) + ')');
        sa(R.alv, 'transform', 'translate(' + g.alv[0] + ',' + g.alv[1] + ') scale(' + (1 + 0.05 * inh).toFixed(3) + ') translate(' + (-g.alv[0]) + ',' + (-g.alv[1]) + ')');
        // CO2: how many show follows the shown PCO2 (one per 4 mm Hg), fading in and out as it changes
        var nC = p / 4;
        function show(list, n, jitter){
          list.forEach(function(m, k){
            var o = clamp(n - k, 0, 1);
            so(m.g, o.toFixed(2));
            if(o <= 0) return;
            var j = 0, jy = 0;   // molecules sit still (a frame at rest moves only the blood, the breath and the beat)
            sa(m.g, 'transform', 'translate(' + f1(m.x + j) + ',' + f1(m.y + jy) + ') scale(' + (0.6 + 0.4 * o).toFixed(2) + ')');
          });
        }
        show(E.cb, nC, true); show(E.ca, nC, true);
        // H+: one per 5 nmol/L
        show(E.hs, nH / 5, true);
        // the red cells drift along the capillary
        var span = cap[2] - cap[0] + 60;
        E.rbcs.forEach(function(r){ if(dt) r.u = (r.u + dt / 1000 * 0.06) % 1; r.x = cap[0] - 30 + r.u * span; sa(r.g, 'transform', 'translate(' + f1(r.x) + ',' + f1(r.y) + ')'); });
        // the exhaled puff: during breathing out, one cloud leaves the mouth with CO2 in proportion to PCO2
        var mx = g.man[0] + 170 * g.man[2], my = g.man[1] + 150 * g.man[2], out = ph >= 0.4 && !E.still ? (ph - 0.4) / 0.6 : -1;
        var nP = Math.round(clamp(p / 40 * 3, 1, 6));
        E.puffs.forEach(function(pf, k){
          var on = out >= 0 && k < nP, t = out, dx = (k % 3 - 1) * 14 + t * 46 * (L.id === 'wide' ? 1 : 0.8), dy = -t * 20 - Math.floor(k / 3) * 16 - 8;
          so(pf, on ? (1 - ss((t - 0.6) / 0.4)).toFixed(2) : '0');
          sa(pf, 'transform', 'translate(' + f1(mx + 34 + dx) + ',' + f1(my + dy) + ') scale(' + (0.75 + 0.25 * t).toFixed(2) + ')');
        });
        sa(R.mouth, 'd', inh > 0.5 && !E.still ? 'M158,145 q12,7 24,0' : 'M160,144 q10,9 20,0 q-10,5 -20,0');
      },
      track: function(L){ var t = G(L).track; return { line: t }; },
      knobAt: function(v, L){ var t = G(L).track, f = (v - 8) / 16; return [lerp(t[0], t[2], f), lerp(t[1], t[3], f)]; },
      knobPick: function(x, y, L){ var t = G(L).track, f = clamp((x - t[0]) / (t[2] - t[0]), 0, 1); return 8 + f * 16; },
      labels: function(st, E){
        var g = E.g, L = E.L, d = st.d, off = !!st.dc, c = g.cap, a = g.alv, wide = L.id === 'wide';
        var man = g.man;
        var firstH = E.hs[0], firstC = E.cb[1];
        var rbx = lerp(c[0], c[2], wide ? 0.3 : 0.22), rby = (c[1] + c[3]) / 2;
        return [
          { key: 'br', text: 'Breathing' + (off ? ' ' + arrow(st.dc) : ''), role: 'air', strong: true, at: [man[0] + 170 * man[2], man[1] + 300 * man[2]], side: wide ? ['r', 'u'] : ['r'] },
          { key: 'co2', text: 'Blood CO₂ ' + Math.round(st.v.co2) + ' mm Hg' + (d.co2 ? ' ' + arrow(d.co2) : ''), role: 'co2', at: [firstC.x, firstC.y], side: ['u', 'd'] },
          { key: 'vt', text: 'Breath size' + (off ? ' same' : ''), role: 'same', at: [man[0] + 120 * man[2], man[1] + 250 * man[2]], side: ['l', 'u'] },
          { key: 'h', text: 'H⁺ ions' + (d.h ? ' ' + arrow(d.h) : ''), role: 'h', at: [firstH.x, firstH.y], side: ['d', 'u'] },
          { key: 'ph', text: 'Blood pH ' + st.v.ph.toFixed(2) + (d.ph ? ' ' + arrow(d.ph) : ''), role: 'ph', at: [wide ? c[2] - 70 : c[2] - 90, c[1] + (c[3] - c[1]) / 2], side: ['u', 'd', 'l'] },
          { key: 'sat', text: 'O₂ saturation ' + st.v.sat.toFixed(1) + '%' + (d.sat ? ' ' + arrow(d.sat) : ''), role: 'o2', at: [rbx, rby], side: ['d', 'u'] }
        ];
      },
      words: function(st){
        var d = st.d, out = [{ t: 'Breathing ' + arrow(st.dc), role: 'air', say: 'breathing ' + (st.dc > 0 ? 'speeds up' : 'slows') }];
        if(d.co2){ out.push({ t: 'Blood CO₂ ' + arrow(d.co2), role: 'co2', say: 'blood carbon dioxide ' + (d.co2 > 0 ? 'rises' : 'falls') });
          if(d.h){ out.push({ t: 'H⁺ ' + arrow(d.h), role: 'h', say: 'hydrogen ions ' + (d.h > 0 ? 'rise' : 'fall') });
            if(d.ph) out.push({ t: 'pH ' + arrow(d.ph), role: 'ph', say: 'pH ' + (d.ph > 0 ? 'rises' : 'falls') }); } }
        return out;
      },
      take: function(st){
        var ph = st.v.ph.toFixed(2), up = st.c > 12, ds = st.d.sat;
        return (up ? 'Faster breathing blows off CO₂: fewer H⁺, pH ' : 'Slower breathing keeps CO₂ in: more H⁺, pH ') + ph + '. O₂ saturation ' + (ds < 0 ? 'falls a little.' : 'rises only a little.');
      },
      note: 'Carbon dioxide leaves the body only through the lungs, so breathing more than your cells make it lowers the PCO₂ of the alveoli and of the blood; breathing less lets it build up. CO₂ + H₂O ⇌ H⁺ + HCO₃⁻: less CO₂ pulls the reaction to the left and uses up H⁺, so pH rises; more CO₂ pushes it right. Each breath out carries CO₂ in proportion to the alveolar PCO₂, so once the blood settles the CO₂ breathed out each minute equals what the cells make. The numbers are for the first minutes, with buffers only: over days the kidneys change bicarbonate and pull the pH back toward 7.40, which is not drawn. Hemoglobin is already about 97 to 98 percent saturated at a normal PO₂, so breathing faster adds only about one percent to it; breathing slower lowers alveolar PO₂ and the saturation falls a little. The rate is changed with each breath the same size (the “same” label).'
    });
  })();

  /* ------------------------------------------------------------------ 3. ADH: the collecting duct */
  (function(){
    var LAY = { wide: { w: 1080, h: 540 }, tall: { w: 600, h: 640 } };
    var VIN = 12.5;   // L a day reaching the collecting ducts (model), at about 100 mOsm/L
    function osmOf(a){ return 50 + 1150 * a; }
    function G(L){
      if(L.id === 'wide') return { duct: [580, 26, 710, 514], cap: [840, 26, 910, 514], left: [20, 20, 372, 520], pit: [176, 112, 1], kid: [150, 344, 0.86], cup: [282, 458], track: [52, 238, 332, 238], cells: 7 };
      return { duct: [250, 258, 360, 630], cap: [452, 258, 506, 630], left: [12, 12, 588, 238], pit: [92, 80, 0.7], kid: [454, 92, 0.5], cup: [548, 182], track: [160, 214, 400, 214], cells: 6 };
    }
    SCENES.push({
      id: 'adh', tab: 'Kidney', short: 'Kidney', topics: ['urine-concentration'],
      bank: ['ur-adh-blocked', 'fab-siadh', 'fab-lost-hiker'],
      purpose: 'Change ADH and watch the urine change',
      cue: 'Drag to change ADH', thing: 'ADH', layouts: LAY,
      ctl: { min: 0, max: 1, step: 0.01, base: 0.35, key: 0.005, label: 'ADH in the blood',
        // on a phone the tag sits beside the knob, toward the middle of the rail, clear of the kidney and the pituitary
        tagSide: function(v, L){ return L.id === 'tall' ? (v > 0.5 ? 'left' : 'right') : null; },
        text: function(v){ return 'ADH ' + word(v); }, tag: function(v){ return 'ADH ' + word(v); } },
      nodes: [
        { id: 'aqp', from: 'c', sign: 1, tau: 420, f: function(a){ return a; }, abs: 0.002 },
        { id: 'water', from: 'aqp', sign: 1, tau: 360, f: function(a){ return VIN - 600 / osmOf(a); }, rel: 0.0005 },
        { id: 'vol', from: 'water', sign: -1, tau: 260, f: function(w){ return VIN - w; }, rel: 0.002 },
        { id: 'osm', from: 'vol', sign: -1, tau: 0, f: function(v){ return 600 / v; }, rel: 0.002 }
      ],
      rest: 'Drag the knob to raise or lower ADH from its usual level.',
      art: function(E){
        var L = E.L, g = G(L), d = g.duct, c = g.cap, s = '<defs>' +
          '<linearGradient id="px-med" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F7EEDF"/><stop offset="1" stop-color="#E9D2A8"/></linearGradient>' +
          '<linearGradient id="px-cellg" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#F3C7B4"/><stop offset="1" stop-color="#E7AE98"/></linearGradient>' +
          '<linearGradient id="px-capg" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#D45C4C"/><stop offset="0.5" stop-color="#E37C6B"/><stop offset="1" stop-color="#C24A3C"/></linearGradient>' +
          '<radialGradient id="px-kidg" cx="0.4" cy="0.35" r="0.8"><stop offset="0" stop-color="#C9655A"/><stop offset="1" stop-color="#93382F"/></radialGradient>' +
          // the duct's fluid: about 100 mOsm/L where it comes in (top), the urine's concentration at the bottom
          '<linearGradient id="px-lumg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="px-lum-top"/><stop offset="0.15" class="px-lum-top"/><stop offset="1" class="px-lum-bot" data-r="lumbot"/></linearGradient></defs>';
        s += '<rect class="px-bg" x="-400" y="0" width="' + (L.w + 800) + '" height="' + L.h + '" fill="url(#px-med)"/>';
        // the left panel: the brain's pituitary releasing ADH into the blood, the kidney, the urine
        var lf = g.left;
        s += '<rect class="px-panel" x="' + lf[0] + '" y="' + lf[1] + '" width="' + (lf[2] - lf[0]) + '" height="' + (lf[3] - lf[1]) + '" rx="20"/>';
        var p = g.pit, ps = p[2];
        s += '<g transform="translate(' + p[0] + ',' + p[1] + ') scale(' + ps + ')"><path class="px-brain" d="M-80,-30 C-86,-74 -30,-96 20,-90 C70,-84 96,-50 88,-12 C82,14 54,20 30,18 C14,30 -10,30 -24,18 C-52,22 -78,8 -80,-30 Z"/>' +
          '<path class="px-brain-l" d="M-60,-40 q20,-12 40,0 q20,12 40,0 q14,-8 30,-2 M-50,-10 q18,-8 34,2"/>' +
          '<path class="px-stalk" d="M2,18 C4,34 6,42 4,52"/><ellipse class="px-pit" cx="6" cy="62" rx="20" ry="13"/></g>';
        // the vessel carrying ADH from the pituitary to the kidney (drawn as one vessel)
        var k = g.kid, ks = k[2], st0 = [p[0] + 24 * ps, p[1] + 64 * ps], hil = [k[0] - 4 * ks, k[1] - 16 * ks];
        var vpts = L.id === 'wide' ? [st0, [st0[0] + 90, st0[1] + 12], [hil[0] + 110, hil[1] - 60], [hil[0] + 60, hil[1] - 6], hil]
          : [st0, [st0[0] + 70, st0[1] + 4], [k[0] + 60 * ks, k[1] - 120 * ks], [k[0] + 50 * ks, k[1] - 30 * ks], hil];
        s += '<path class="px-adhv" d="' + P(vpts) + '"/><path class="px-adhl" d="' + P(vpts) + '"/>';
        // the kidney, its ureter and the urine collecting
        var cu = g.cup, ur0 = [k[0] - 6 * ks, k[1] + 10 * ks];
        s += '<path class="px-ureter" d="M' + f1(ur0[0]) + ',' + f1(ur0[1]) + ' C' + f1(ur0[0] + 40) + ',' + f1(ur0[1] + 10) + ' ' + f1(cu[0] - 30) + ',' + f1(cu[1] - 70) + ' ' + f1(cu[0] - 8) + ',' + f1(cu[1] - 28) + '"/>';
        s += '<g transform="translate(' + k[0] + ',' + k[1] + ') scale(' + ks + ')"><path class="px-kid" d="M-46,-76 C-90,-74 -104,-20 -96,24 C-88,72 -40,92 -6,72 C14,60 10,36 -6,18 C-20,6 -20,-14 -4,-26 C14,-40 16,-64 -4,-76 C-16,-80 -30,-80 -46,-76 Z" fill="url(#px-kidg)"/>' +
          '<path class="px-cortex" d="M-44,-64 C-80,-62 -90,-18 -84,20 C-78,56 -42,74 -14,60 C-4,52 -6,36 -16,26 C-30,10 -32,-14 -16,-30 C-4,-44 -6,-58 -20,-64 C-28,-67 -36,-66 -44,-64 Z"/>' +
          '<path class="px-pyr" d="M-74,-34 L-30,-12 L-70,8 Z M-68,28 L-28,8 L-44,52 Z M-52,-58 L-22,-24 L-10,-54 Z"/>' +
          '<path class="px-pyrs" d="M-68,-26 L-34,-12 M-68,0 L-34,-12 M-58,34 L-32,12 M-48,44 L-32,12 M-44,-50 L-22,-26 M-20,-50 L-22,-26"/>' +
          '<path class="px-pelvis" d="M-30,-14 C-22,-24 -8,-24 -2,-12 L8,10 C-6,14 -22,10 -28,0 Z"/></g>';
        s += '<g transform="translate(' + cu[0] + ',' + cu[1] + ')"><path class="px-bladder" d="M-8,-30 C-30,-32 -40,-10 -36,8 C-32,24 -16,32 0,32 C16,32 32,24 36,8 C40,-10 30,-32 8,-30 Z"/><path class="px-urine" data-r="urine" d="M-34,-4 C-32,16 -16,28 0,28 C16,28 32,16 34,-4 Z"/></g>';
        // the medulla's interstitium: saltier deeper (darker), with the collecting duct and a capillary
        var ix = L.id === 'wide' ? 392 : -10, iy = L.id === 'wide' ? 0 : 248;
        s += '<rect class="px-inter" x="' + ix + '" y="' + iy + '" width="' + (L.w + 400 - ix) + '" height="' + (L.h - iy) + '" fill="url(#px-med)"/>';
        // the duct: two walls of principal cells round the lumen (fluid going down)
        var nC = g.cells, ch = (d[3] - d[1]) / nC, wall = 34, cl = '';
        for(var i = 0; i < nC; i++){
          var y0 = d[1] + i * ch;
          cl += '<rect class="px-pcell" x="' + (d[0] - wall) + '" y="' + f1(y0 + 1.5) + '" width="' + wall + '" height="' + f1(ch - 3) + '" rx="7" fill="url(#px-cellg)"/><circle class="px-pnuc" cx="' + (d[0] - wall * 0.55) + '" cy="' + f1(y0 + ch * 0.5) + '" r="7"/>';
          cl += '<rect class="px-pcell" x="' + d[2] + '" y="' + f1(y0 + 1.5) + '" width="' + wall + '" height="' + f1(ch - 3) + '" rx="7" fill="url(#px-cellg)"/><circle class="px-pnuc" cx="' + (d[2] + wall * 0.55) + '" cy="' + f1(y0 + ch * 0.5) + '" r="7"/>';
        }
        s += '<rect class="px-dlumen" fill="url(#px-lumg)" data-r="dl" x="' + d[0] + '" y="' + (d[1] - 30) + '" width="' + (d[2] - d[0]) + '" height="' + (d[3] - d[1] + 60) + '"/>' + cl;
        s += '<path class="px-memb" d="M' + d[0] + ',' + (d[1] - 30) + ' V' + (d[3] + 30) + ' M' + d[2] + ',' + (d[1] - 30) + ' V' + (d[3] + 30) + '"/>';
        // the capillary (blood returning toward the body)
        s += '<rect class="px-dcap" x="' + c[0] + '" y="' + (c[1] - 30) + '" width="' + (c[2] - c[0]) + '" height="' + (c[3] - c[1] + 60) + '" rx="8" fill="url(#px-capg)"/>';
        s += '<g data-r="aqp"></g>';
        var tr = g.track;
        s += '<path class="px-rail" d="M' + tr[0] + ',' + tr[1] + ' H' + tr[2] + '"/>';
        return s;
      },
      fx: function(){ return '<g data-r="drops"></g><g data-r="adhm"></g><g data-r="udrop"></g>'; },
      init: function(E, R){
        var L = E.L, g = G(L), d = g.duct, c = g.cap, i, h = '';
        E.g = g; E.t = 0;
        // aquaporins: 12 slots on each side of the lumen; inserted ones sit in the membrane, the rest wait in
        // vesicles inside the cell
        var nA = 24;
        for(i = 0; i < nA; i++) h += '<g class="px-aq"><rect class="px-aqb" x="-5" y="-8" width="10" height="16" rx="3"/><path class="px-aqp" d="M0,-6 V6"/><circle class="px-ves" r="10"/></g>';
        R.aqp.innerHTML = h;
        E.uk = '';
        E.aq = [].slice.call(R.aqp.childNodes).map(function(n, k){
          var side = k % 2 ? 1 : -1, j = Math.floor(k / 2), y = lerp(d[1] + 18, d[3] - 18, (j + 0.5) / 12), x = side < 0 ? d[0] : d[2];
          return { g: n, side: side, y: y, x: x, rank: (j * 5 + (side > 0 ? 3 : 0)) % 12 };
        });
        E.aqSide = [E.aq.filter(function(q){ return q.side < 0; }), E.aq.filter(function(q){ return q.side > 0; })];
        // water drops crossing from the lumen through the wall to the capillary
        R.drops.innerHTML = '<path class="px-dropp"/>'; E.dropP = R.drops.firstChild;
        E.drops = []; for(i = 0; i < 20; i++) E.drops.push({ ph: (i * 0.6180339887) % 1, side: i % 2 ? 1 : -1, slot: (i * 7) % 12 });
        // ADH molecules in the capillary and on the vessel
        h = ''; for(i = 0; i < 12; i++) h += '<g class="px-adh"><path d="M-6,-5 L6,-5 L9,0 L6,5 L-6,5 L-9,0 Z"/></g>';
        R.adhm.innerHTML = h;
        var sc = scatter(12, 0.42);
        E.adh = [].slice.call(R.adhm.childNodes).map(function(n, k){
          // two molecules per slot, half the capillary apart, so the group can wrap by half its length seamlessly
          var x = lerp(c[0] + 12, c[2] - 12, sc[k >> 1][0]), y = lerp(c[1] - (c[3] - c[1]) / 2, c[1], sc[k >> 1][1]) + (k % 2) * (c[3] - c[1]) / 2;
          n.setAttribute('transform', 'translate(' + f1(x) + ',' + f1(y) + ')');
          return { g: n, x: x, y: y };
        });
        // urine drops from the duct's end
        R.udrop.innerHTML = '<path class="px-udropp"/>'; E.udP = R.udrop.firstChild;
        E.ud = []; for(i = 0; i < 8; i++) E.ud.push({ u: i / 8 });
      },
      paint: function(st, E, R, dt){
        var g = E.g, d = g.duct, c = g.cap, a = st.v.aqp, still = E.still;
        if(dt) E.t += dt / 1000;
        // aquaporins: rank k is in the membrane when the shown level passes it; the move in or out is drawn
        var n = a * 12;
        E.aq.forEach(function(q){
          var ins = clamp(n - q.rank, 0, 1), inX = q.x + q.side * 20, x = lerp(inX, q.x, ss(ins));
          sa(q.g, 'transform', 'translate(' + f1(x) + ',' + f1(q.y) + ')');
          q.g.classList.toggle('is-in', ins > 0.98);
          so(q.g.lastChild, (1 - ins).toFixed(2));
        });
        // water out: drops leave through the inserted aquaporins at a rate that follows the shown reabsorption
        var w = st.v.water, rate = w / VIN, wide = E.L.id === 'wide';
        var dd = '';
        E.drops.forEach(function(dr, k){
          if(dt) dr.ph = (dr.ph + dt / 1000 * 0.45) % 1;
          if(k >= Math.round(rate * E.drops.length)) return;
          var slot = E.aqSide[dr.side > 0 ? 1 : 0][dr.slot % 12], t = still ? 0.5 : dr.ph;
          var x = lerp((d[0] + d[2]) / 2, dr.side > 0 ? c[0] + 8 : d[0] - 70, t), sz = Math.min(1, t * 6, (1 - t) * 6);
          if(sz > 0.05) dd += drop(x, slot.y, sz);
        });
        sa(E.dropP, 'd', dd);
        // ADH in the blood (the control shown)
        var nA = st.c * 12;
        // the ADH molecules move down the capillary together: one transform on their group, wrapped by a whole row
        E.adh.forEach(function(m, k){ so(m.g, clamp(nA - k, 0, 1).toFixed(2)); });
        var span = c[3] - c[1];
        sa(R.adhm, 'transform', 'translate(0,' + f1(still ? 0 : (E.t * 18) % (span / 2)) + ')');
        // urine: its colour follows the shown concentration; drops at the duct's end at a rate that follows the volume
        var osm = st.v.osm, col = clamp((osm - 50) / 1150, 0, 1);
        // set on the few drawn things only (a custom property on the stage would restyle the whole stage every frame)
        var uk = (8 + col * 80).toFixed(0) + '%';
        if(E.uk !== uk){
          E.uk = uk; var t = (8 + col * 80) / 100;
          sa(R.lumbot, 'stop-color', mixc('#FFFBE6', '#E9C200', t)); sa(R.urine, 'fill', mixc('#FFF8D8', '#D9A300', t));
          sa(E.udP, 'fill', mixc('#FFF3B8', '#D9A300', t));
        }
        var vr = st.v.vol / 1.33;   // 1 at the usual volume
        var ud = '', uk2 = clamp(0.8 + vr * 0.17, 0.8, 1.6);
        E.ud.forEach(function(u, k){
          if(dt) u.u = (u.u + dt / 1000 * 0.5 * Math.min(vr, 6) / 2) % 1;
          if(k >= clamp(Math.round(vr * 1.5), 1, 8) || (still && k)) return;
          ud += drop((d[0] + d[2]) / 2, still ? d[3] - 20 : lerp(d[3] - 10, E.L.h + 10, u.u), uk2);
        });
        sa(E.udP, 'd', ud);
        // the bladder fills to a height that follows the volume
        var lv = clamp(st.v.vol / 12, 0.04, 1);
        sa(R.urine, 'transform', 'translate(0,' + f1(24 * (1 - lv)) + ') scale(1,' + lv.toFixed(3) + ')');
      },
      avoid: function(E){ var g = G(E.L), k = g.kid, s2 = k[2], cu = g.cup; return [[k[0] - 100 * s2, k[1] - 80 * s2, k[0] + 16 * s2, k[1] + 90 * s2], [cu[0] - 36, cu[1] - 30, cu[0] + 36, cu[1] + 30]]; },
      track: function(L){ return { line: G(L).track }; },
      knobAt: function(v, L){ var t = G(L).track; return [lerp(t[0], t[2], v), lerp(t[1], t[3], v)]; },
      knobPick: function(x, y, L){ var t = G(L).track; return clamp((x - t[0]) / (t[2] - t[0]), 0, 1); },
      labels: function(st, E){
        var g = E.g, d = g.duct, c = g.cap, D = st.d, off = !!st.dc, wide = E.L.id === 'wide';
        var aq = E.aq.filter(function(q){ return q.side < 0; })[2], vol = st.v.vol, osm = st.v.osm;
        return [
          { key: 'adh', text: 'ADH' + (off ? ' ' + arrow(st.dc) : ''), role: 'adh', strong: true, at: [g.pit[0] + 6 * g.pit[2], g.pit[1] + 62 * g.pit[2]], side: ['l', 'r', 'd'] },
          { key: 'fin', text: 'Fluid in' + (off ? ' same' : ''), role: 'same', at: [(d[0] + d[2]) / 2, d[1] + 6], side: ['r', 'l'] },
          { key: 'aqp', text: 'Aquaporins' + (D.aqp ? ' ' + arrow(D.aqp) : ''), role: 'aqp', at: [aq.x - 12, aq.y], side: ['l'] },
          { key: 'water', text: 'Water back' + (D.water ? ' ' + arrow(D.water) : ''), role: 'water', at: [c[0], (c[1] + c[3]) / 2 - 40], side: ['r', 'l'] },
          { key: 'vol', text: 'Urine ' + (vol < 1.95 ? vol.toFixed(1) : Math.round(vol)) + ' L a day' + (D.vol ? ' ' + arrow(D.vol) : ''), role: 'urine', at: [g.cup[0], g.cup[1] + (wide ? 30 : -30)], side: wide ? ['d', 'l', 'u'] : ['u', 'l', 'd'] },
          { key: 'osm', text: comma(Math.round(osm / 10) * 10) + ' mOsm/L' + (D.osm ? ' ' + arrow(D.osm) : ''), role: 'urine', at: [(d[0] + d[2]) / 2, d[3] - 30], side: ['r', 'l'] }
        ];
      },
      words: function(st){
        var D = st.d, out = [{ t: 'ADH ' + arrow(st.dc), role: 'adh', say: 'ADH ' + (st.dc > 0 ? 'rises' : 'falls') }];
        if(D.aqp){ out.push({ t: 'Aquaporins ' + arrow(D.aqp), role: 'aqp', say: (D.aqp > 0 ? 'more' : 'fewer') + ' aquaporins in the duct wall' });
          if(D.water){ out.push({ t: 'Water back ' + arrow(D.water), role: 'water', say: (D.water > 0 ? 'more' : 'less') + ' water goes back to the blood' });
            if(D.vol) out.push({ t: 'Urine ' + arrow(D.vol), role: 'urine', say: 'urine volume ' + (D.vol > 0 ? 'rises' : 'falls') }); } }
        return out;
      },
      take: function(st){
        return st.c > 0.35 ? 'More ADH, more aquaporins: more water goes back, so less, darker urine.'
          : 'Less ADH, fewer aquaporins: water stays in the duct, so more, paler urine.';
      },
      note: 'ADH from the posterior pituitary reaches the collecting duct in the blood. On the principal cells it raises cAMP, and vesicles carrying aquaporins fuse with the membrane that faces the duct’s lumen; without ADH the cell pulls them back in. Water then leaves the duct toward the salty medulla and returns to the blood. Fluid leaves the nephron loop at about 100 mOsm/L whatever ADH does, because the loop works without ADH (the “same” label); after that, ADH decides how much water the collecting duct gives back. Model: the kidneys must excrete about 600 mOsm of solute a day, so the urine volume is 600 divided by its concentration, from about 50 mOsm/L (no ADH, about 12 L a day) to about 1,200 mOsm/L (most ADH, about half a liter). Only one duct cell layer and one capillary are drawn.'
    });
    // the tag's word moves off "usual" at the same point the cause line and the arrows do (ctl.key)
    function word(v){ return Math.abs(v - 0.35) < 0.005 ? 'usual' : v < 0.02 ? 'none' : v < 0.35 ? 'lower' : v < 0.75 ? 'higher' : 'very high'; }
  })();

  /* ------------------------------------------------------------------ 4. Heart: venous return, Frank-Starling */
  (function(){
    var LAY = { wide: { w: 1080, h: 540 }, tall: { w: 600, h: 640 } };
    var HR = 70;
    function svOf(edv){ return 110 * (1 - Math.exp(-(edv - 45) / 75)); }
    function slOf(edv){ return 1.8 + 0.4 * (edv - 90) / 70; }   // sarcomere length at the end of filling (micrometres)
    function G(L){
      if(L.id === 'wide') return { heart: [440, 300, 1.32], sar: [812, 300, 238, 150], aorta: [[492, 160], [494, 80], [540, 40], [640, 34], [716, 70], [742, 140], [744, 520]], ivc: [196], ivcTop: 380, hr: [110, 80], track: [196, 506, 196, 388] };
      return { heart: [262, 290, 1.0], sar: [222, 470, 364, 118], aorta: [[302, 172], [304, 90], [340, 46], [440, 36], [520, 60], [546, 126], [548, 446]], ivc: [70], ivcTop: 420, hr: [72, 60], track: [70, 592, 70, 430] };
    }
    SCENES.push({
      id: 'heart', tab: 'Heart', short: 'Heart', topics: ['cardiac-output'],
      bank: ['venous-return-up', 'afterload-l4', 'sympathetic-surge'],
      purpose: 'Send more blood back and watch each beat',
      cue: 'Drag to send more blood back', thing: 'the venous return', layouts: LAY,
      ctl: { min: 90, max: 160, step: 1, base: 120, key: 0.5, label: 'Venous return',
        text: function(v){ return 'venous return ' + word(v) + ', filling to ' + Math.round(v) + ' mL'; }, tag: function(v){ return word(v); } },
      nodes: [
        { id: 'edv', from: 'c', sign: 1, tau: 420, f: function(v){ return v; }, rel: 0.002 },
        { id: 'sl', from: 'edv', sign: 1, tau: 220, f: slOf, rel: 0.001 },
        { id: 'sv', from: 'sl', sign: 1, tau: 280, f: function(sl){ return svOf(90 + (sl - 1.8) / 0.4 * 70); }, rel: 0.002 },
        { id: 'co', from: 'sv', sign: 1, tau: 280, f: function(sv){ return sv * HR / 1000; }, rel: 0.002 }
      ],
      rest: 'Drag the knob on the vena cava to send more or less blood back.',
      art: function(E){
        var L = E.L, g = G(L), h = g.heart, s = '<defs>' +
          '<radialGradient id="px-myo" cx="0.4" cy="0.35" r="0.85"><stop offset="0" stop-color="#D4685A"/><stop offset="0.7" stop-color="#B2463A"/><stop offset="1" stop-color="#86281F"/></radialGradient>' +
          '<radialGradient id="px-hbg" cx="0.4" cy="0.4" r="0.9"><stop offset="0" stop-color="#FBF3EE"/><stop offset="1" stop-color="#F2E0D6"/></radialGradient></defs>';
        s += '<rect class="px-bg" x="-400" y="0" width="' + (L.w + 800) + '" height="' + L.h + '" fill="url(#px-hbg)"/>';
        // the venae cavae into the right atrium, the aorta out of the left ventricle (drawn in picture units)
        // the aorta behind the heart's top, arching over and down to the body
        s += '<path class="px-aorta" d="' + P(g.aorta) + '"/><path class="px-aorta-l" data-r="aol" d="' + P(g.aorta) + '"/>';
        s += '<g data-r="slug"></g>';
        // the superior vena cava from above into the right atrium
        var ra = [h[0] - 86 * h[2], h[1] - 62 * h[2]];
        s += '<path class="px-cava" d="M' + f1(ra[0] - 10) + ',-20 V' + f1(ra[1] - 20) + '"/><path class="px-cava-l" d="M' + f1(ra[0] - 10) + ',-20 V' + f1(ra[1] - 20) + '"/>';
        // the heart (frontal section, right side on the viewer's left)
        s += '<g transform="translate(' + h[0] + ',' + h[1] + ') scale(' + h[2] + ')">' +
          '<path class="px-aur" d="M-128,-112 C-160,-118 -172,-92 -158,-74 C-150,-64 -138,-70 -132,-80 Z"/><path class="px-aur" d="M112,-118 C140,-132 160,-112 152,-90 C146,-78 130,-82 124,-92 Z"/>' +
          '<path class="px-myo" d="M-134,-104 C-162,-70 -160,10 -140,56 C-112,124 -26,176 50,166 C118,156 156,96 152,16 C150,-40 142,-86 118,-112 C88,-136 40,-134 0,-124 C-40,-136 -98,-132 -134,-104 Z" fill="url(#px-myo)"/>' +
          '<path class="px-sulc" d="M-12,-122 C-20,-60 -8,40 -24,150"/>' +
          '<ellipse class="px-cav is-de" cx="-86" cy="-62" rx="44" ry="38"/><ellipse class="px-cav is-ox" cx="70" cy="-66" rx="42" ry="34"/>' +
          '<g data-r="rv"><path class="px-cav is-de" d="M-118,-12 C-122,44 -92,104 -40,118 C-24,92 -20,40 -20,-12 Z"/></g>' +
          '<g data-r="lv"><path class="px-cav is-ox" d="M4,-12 C4,44 14,108 56,126 C100,112 118,52 112,-12 Z"/></g>' +
          '<path class="px-ring" d="M-118,-14 H-112 M-28,-14 H-22 M2,-14 H8 M106,-14 H112"/>' +
          '<g data-r="valves"><path class="px-leaf" data-x="-112"/><path class="px-leaf" data-x="-28"/><path class="px-leaf" data-x="8"/><path class="px-leaf" data-x="106"/></g>' +
          '<path class="px-cor" d="M-14,-40 C-40,-20 -60,10 -70,60 M-10,20 C20,40 40,80 50,120 M60,-100 C90,-96 120,-70 130,-30"/>' +
          '<path class="px-pt" d="M-46,-104 C-44,-140 -26,-160 6,-168 M6,-168 C30,-172 50,-168 64,-160 M6,-168 C-14,-176 -40,-176 -60,-168"/><path class="px-pt-l" d="M-46,-104 C-44,-140 -26,-160 6,-168 M6,-168 C30,-172 50,-168 64,-160 M6,-168 C-14,-176 -40,-176 -60,-168"/>' +
          '</g>';
        // the inferior vena cava from below, over the heart's edge into the right atrium (the knob rides it)
        var ivx = g.ivc[0], top = g.ivcTop, d2 = 'M' + ivx + ',' + (L.h + 20) + ' V' + top + ' C' + ivx + ',' + f1(top - 110) + ' ' + f1(ra[0] - 70 * h[2]) + ',' + f1(ra[1] + 30) + ' ' + f1(ra[0] - 22 * h[2]) + ',' + f1(ra[1] + 10);
        s += '<path class="px-cava" d="' + d2 + '"/><path class="px-cava-l" data-r="ivcl" d="' + d2 + '"/><ellipse class="px-cav is-de" cx="' + f1(ra[0]) + '" cy="' + f1(ra[1] + 8) + '" rx="' + f1(30 * h[2]) + '" ry="' + f1(24 * h[2]) + '"/>';
        // the beat marker (heart rate, the same through the whole screen)
        s += '<g data-r="beat" class="px-beat" transform="translate(' + g.hr[0] + ',' + g.hr[1] + ')"><path d="M-36,0 H-14 L-8,-12 L0,14 L6,-6 L10,0 H36"/></g>';
        // the stretch: a sarcomere magnified from the left ventricle's wall
        var sr = g.sar, lx = h[0] + 104 * h[2], ly = h[1] + 50 * h[2];
        s += '<path class="px-zl" d="M' + f1(lx) + ',' + f1(ly) + ' L' + sr[0] + ',' + (sr[1] + sr[3] / 2) + '"/><circle class="px-lens" cx="' + f1(lx) + '" cy="' + f1(ly) + '" r="14"/>';
        s += '<rect class="px-zoom" x="' + sr[0] + '" y="' + sr[1] + '" width="' + sr[2] + '" height="' + sr[3] + '" rx="18"/><g data-r="sar"></g>';
        return s;
      },
      init: function(E, R){
        var g = G(E.L), h = '', i;
        E.g = g; E.beat = 0;
        // the sarcomere: two Z discs, thin filaments from each, the thick filament in the middle
        h = '<path class="px-z" data-r="z1"/><path class="px-z" data-r="z2"/><g data-r="thin"></g><g class="px-thick-g"><path class="px-thick" data-r="thick"/></g>';
        R.sar.innerHTML = h;
        R.z1 = R.sar.querySelector('[data-r="z1"]'); R.z2 = R.sar.querySelector('[data-r="z2"]'); R.thin = R.sar.querySelector('[data-r="thin"]'); R.thick = R.sar.querySelector('[data-r="thick"]');
        var t = ''; for(i = 0; i < 8; i++) t += '<path class="px-thin"/>'; R.thin.innerHTML = t;
        // the ejected blood: one slug per beat in the aorta
        R.slug.innerHTML = '<path class="px-slug"/>';
        E.slug = R.slug.firstChild; E.op = '';
        var a = g.aorta, Ls = [0]; for(i = 1; i < a.length; i++) Ls.push(Ls[i - 1] + Math.hypot(a[i][0] - a[i - 1][0], a[i][1] - a[i - 1][1]));
        E.aoL = Ls; E.aoLen = Ls[Ls.length - 1];
      },
      paint: function(st, E, R, dt){
        var g = E.g, h = g.heart, edv = st.v.edv, sv = st.v.sv, esv = edv - sv, still = E.still;
        if(dt) E.beat = (E.beat + dt / 1000 * HR / 60) % 1;
        // the cycle: systole (ejection) in the first 35 percent, then filling
        var b = still ? 0.999 : E.beat, vol, ej;
        if(b < 0.35){ var t = ss(b / 0.35); vol = lerp(edv, esv, t); ej = t; } else { var u = ss((b - 0.35) / 0.65); vol = lerp(esv, edv, u); ej = -1; }
        // drawn area follows the volume (2D: scale by the square root)
        var k = Math.sqrt(vol / 120);
        sa(R.lv, 'transform', 'translate(58,-12) scale(' + k.toFixed(3) + ') translate(-58,12)');
        sa(R.rv, 'transform', 'translate(-70,-12) scale(' + k.toFixed(3) + ') translate(70,12)');
        // the ejected slug moves out along the aorta; its length follows the shown stroke volume
        /* each beat's ejected blood (the stroke volume): it leaves the ventricle during the squeeze and runs the whole
           aorta before the next beat; its drawn length follows the shown stroke volume (86 mL about half the aorta) */
        var slugL = sv / 86 * E.aoLen * 0.5, out = b < 0.35 ? ss(b / 0.35) * 0.35 : b, head = still ? E.aoLen * 0.5 + slugL / 2 : out * (E.aoLen + slugL);
        var s0 = Math.max(0, head - slugL), s1 = Math.min(E.aoLen, head);
        so(E.slug, s1 > s0 + 1 ? '1' : '0');
        if(s1 > s0 + 1) sa(E.slug, 'd', aoPath(g.aorta, E.aoL, s0, s1));
        // the valves: the inlet valves open while the ventricles fill, shut while they squeeze
        var op = b < 0.35 ? 0 : ss((b - 0.35) / 0.1) * (1 - ss((b - 0.9) / 0.1));
        if(still) op = 0.5;
        if(E.op !== op.toFixed(2)){ E.op = op.toFixed(2); R.valves.childNodes.forEach(function(n, i){ var x0 = +n.getAttribute('data-x'), dir = i % 2 ? -1 : 1, ang = (8 + op * 62) * Math.PI / 180, L2 = 34; sa(n, 'd', 'M' + x0 + ',-14 L' + f1(x0 + dir * Math.cos(ang) * L2) + ',' + f1(-14 + Math.sin(ang) * L2)); }); }
        // the sarcomere: length follows the stretch at the end of filling, shortening as the beat squeezes
        // shortening during the squeeze: from the end-of-filling length toward 1.75 um as the volume falls to the end volume
        var sr = g.sar, sl = st.v.sl - (edv - vol) / Math.max(sv, 1) * (st.v.sl - 1.75) * 0.6;
        var cx = sr[0] + sr[2] / 2, cy = sr[1] + sr[3] / 2, px = sr[2] * 0.4 / 2.2;   // picture units per micrometre
        var half = sl / 2 * px;
        sa(R.z1, 'd', 'M' + f1(cx - half) + ',' + f1(sr[1] + 14) + ' V' + f1(sr[1] + sr[3] - 14));
        sa(R.z2, 'd', 'M' + f1(cx + half) + ',' + f1(sr[1] + 14) + ' V' + f1(sr[1] + sr[3] - 14));
        var thinL = 1.0 * px, thick = 1.6 * px / 2;
        sa(R.thick, 'd', 'M' + f1(cx - thick) + ',' + f1(cy - 14) + ' H' + f1(cx + thick) + ' M' + f1(cx - thick) + ',' + f1(cy + 14) + ' H' + f1(cx + thick) + ' M' + f1(cx - thick) + ',' + f1(cy) + ' H' + f1(cx + thick));
        [].forEach.call(R.thin.childNodes, function(n, i){
          var left = i < 4, yy = cy - 21 + (i % 4) * 14, x0 = left ? cx - half : cx + half, x1 = left ? x0 + thinL : x0 - thinL;
          sa(n, 'd', 'M' + f1(x0) + ',' + f1(yy) + ' H' + f1(x1));
        });
        // the beat marker pulses on each beat (the rate does not change)
        so(R.beat, still ? '1' : (0.45 + 0.55 * (b < 0.12 ? 1 - b / 0.12 : 0)).toFixed(2));
      },
      avoid: function(E){ var sr = G(E.L).sar; return [[sr[0], sr[1], sr[0] + sr[2], sr[1] + sr[3]]]; },
      track: function(L){ return { line: G(L).track }; },
      knobAt: function(v, L){ var t = G(L).track, f = (v - 90) / 70; return [lerp(t[0], t[2], f), lerp(t[1], t[3], f)]; },
      knobPick: function(x, y, L){ var t = G(L).track, f = clamp((y - t[1]) / (t[3] - t[1]), 0, 1); return 90 + f * 70; },
      labels: function(st, E){
        var g = E.g, h = g.heart, d = st.d, off = !!st.dc, wide = E.L.id === 'wide', sr = g.sar, a = g.aorta;
        return [
          { key: 'vr', text: 'Venous return' + (off ? ' ' + arrow(st.dc) : ''), role: 'fill', strong: true, at: [g.ivc[0] - 20, g.ivcTop - 34], side: ['l', 'u'] },
          { key: 'edv', text: 'Filling ' + Math.round(st.v.edv) + ' mL' + (d.edv ? ' ' + arrow(d.edv) : ''), role: 'fill', at: [h[0] + 58 * h[2], h[1] + 60 * h[2]], side: ['d', 'r'] },
          { key: 'sl', text: 'Stretch' + (d.sl ? ' ' + arrow(d.sl) : ''), role: 'mus', at: [sr[0] + sr[2] / 2, sr[1] + sr[3] + 2], side: ['d', 'u'] },
          { key: 'sv', text: 'Stroke volume ' + Math.round(st.v.sv) + ' mL' + (d.sv ? ' ' + arrow(d.sv) : ''), role: 'sv', at: a[2], side: ['u', 'd'] },
          { key: 'co', text: 'Output ' + st.v.co.toFixed(1) + ' L/min' + (d.co ? ' ' + arrow(d.co) : ''), role: 'co', at: [a[a.length - 1][0] - 18, a[a.length - 1][1] - 40], side: ['l'] },
          { key: 'hr', text: 'Heart rate ' + HR + (off ? ' same' : ''), role: 'same', at: g.hr, side: ['d', 'r', 'l'] }
        ];
      },
      words: function(st){
        var d = st.d, out = [{ t: 'Return ' + arrow(st.dc), role: 'fill', say: 'venous return ' + (st.dc > 0 ? 'rises' : 'falls') }];
        if(d.edv){ out.push({ t: 'Filling ' + arrow(d.edv), role: 'fill', say: 'the ventricles fill ' + (d.edv > 0 ? 'more' : 'less') });
          if(d.sl){ out.push({ t: 'Stretch ' + arrow(d.sl), role: 'mus', say: 'the muscle is stretched ' + (d.sl > 0 ? 'more' : 'less') });
            if(d.sv){ out.push({ t: 'Stroke vol. ' + arrow(d.sv), role: 'sv', say: 'stroke volume ' + (d.sv > 0 ? 'rises' : 'falls') });
              if(d.co) out.push({ t: 'Output ' + arrow(d.co), role: 'co', say: 'cardiac output ' + (d.co > 0 ? 'rises' : 'falls') }); } } }
        return out;
      },
      take: function(st){
        return st.c > 120 ? 'More filling, more stretch: each beat ejects more at the same heart rate.' : 'Less filling, less stretch: each beat ejects less at the same heart rate.';
      },
      note: 'The Frank–Starling mechanism: more blood returning during filling raises the end-diastolic volume, which stretches the muscle fibers toward the length where they make the most force, so the ventricle contracts harder and ejects more. Contractility (the force at a given length) and the heart rate stay the same here; only the stretch changed. Cardiac output is heart rate times stroke volume. The curve flattens at high filling. Both ventricles fill and eject the same volume each beat; the left one’s output to the aorta is drawn. Model: stroke volume rises from about 50 mL at 90 mL of filling to about 86 mL at 160 mL; heart rate held at 70.'
    });
    function word(v){ return Math.abs(v - 120) < 0.5 ? 'Usual return' : v < 120 ? 'Less blood back' : 'More blood back'; }
    // the aorta's polyline between two lengths along it
    function aoPath(a, Ls, s0, s1){
      var pts = [], i;
      function at(s){ for(var j = 1; j < a.length; j++) if(Ls[j] >= s || j === a.length - 1){ var t = (s - Ls[j - 1]) / ((Ls[j] - Ls[j - 1]) || 1); return [lerp(a[j - 1][0], a[j][0], clamp(t, 0, 1)), lerp(a[j - 1][1], a[j][1], clamp(t, 0, 1))]; } return a[a.length - 1]; }
      pts.push(at(s0));
      for(i = 1; i < a.length - 1; i++) if(Ls[i] > s0 && Ls[i] < s1) pts.push(a[i]);
      pts.push(at(s1));
      return P(pts);
    }
  })();

  /* ================================================================== the engine */
  function build(o){
    var K = window.LevlKit2, DATA = o.data;
    function scen(id){ for(var i = 0; i < DATA.scenarios.length; i++) if(DATA.scenarios[i].id === id) return DATA.scenarios[i]; return null; }
    var scenes = SCENES.filter(function(sc){ sc.ids = sc.bank.filter(function(id){ return !!scen(id); }); return sc.ids.length > 0; });
    if(!scenes.length || !K) return null;
    scenes.forEach(function(sc){ sc.u = sc.ctl.base; });
    var cur = scenes[0], raf = 0, last = 0, onScreen = false, E = { fs: 13, k: 1 }, view = null;

    var stage = document.createElement('div'); stage.className = 'px';
    var tabs = K.tabs({ label: 'Which body system', items: scenes.map(function(sc){ return { value: sc.id, label: sc.tab, short: sc.short }; }), value: cur.id, big: true, onChange: function(v){ setTab(v, true); } });
    stage.appendChild(tabs.el);
    var head = K.head({ purpose: cur.purpose, how: { label: 'Show me how', onClick: function(){ startTour(); } } });
    stage.appendChild(head.el);
    var main = document.createElement('div'); main.className = 'px-main'; main.id = 'px-main';
    main.innerHTML = '<div class="px-pic"><svg class="px-svg" viewBox="0 0 600 600" role="img" xmlns="http://www.w3.org/2000/svg" data-ls-text="keep">' +
      '<g class="px-art"></g></svg>' +
      // the moving things and the labels on a layer of their own (composited), so a frame repaints only them
      '<svg class="px-svg px-fxsvg" viewBox="0 0 600 600" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" data-ls-text="keep"><g class="px-fxg"></g><g class="px-labs"></g></svg>' +
      '<div class="px-over"></div></div>';
    stage.appendChild(main);
    tabs.el.querySelectorAll('.tk2-tab').forEach(function(b){ b.setAttribute('aria-controls', main.id); });
    var pic = main.querySelector('.px-pic'), svg = main.querySelector('.px-svg'), art = svg.querySelector('.px-art'), fxs = main.querySelector('.px-fxsvg'), fxg = fxs.querySelector('.px-fxg'), labs = fxs.querySelector('.px-labs'), over = main.querySelector('.px-over');
    var layer = K.layer(pic);
    var lines = document.createElement('div'); lines.className = 'px-lines';
    var cause = K.cause({ label: 'Why' });
    lines.appendChild(cause.el);
    stage.appendChild(lines);
    var live = document.createElement('p'); live.className = 'tk2-sr'; live.setAttribute('aria-live', 'polite'); stage.appendChild(live);
    var sayT = 0;
    function say(t){ clearTimeout(sayT); sayT = setTimeout(function(){ live.textContent = t; }, 40); }
    var reset = document.createElement('button'); reset.type = 'button'; reset.className = 'px-reset';
    reset.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12a8 8 0 1 0 2.4-5.7M4 4v4.5h4.5"/></svg><span>Start over</span>';
    over.appendChild(reset);
    var R = {}, handle = null, cue = null;

    /* ---- the shown state: the control and every link chase their causes (a chain of lags) */
    function baseVals(sc){
      var b = { c: sc.ctl.base };
      sc.nodes.forEach(function(n){ b[n.id] = n.f(n.from === 'c' ? b.c : b[n.from]); });
      return b;
    }
    function newView(sc){ var b = baseVals(sc), v = {}; sc.nodes.forEach(function(n){ v[n.id] = b[n.id]; }); return { u: sc.u, c: sc.u, v: v, b: b }; }
    function targetOf(sc, n, vw){ return n.f(n.from === 'c' ? vw.c : vw.v[n.from]); }
    function settleAll(sc, vw){ vw.c = vw.u; sc.nodes.forEach(function(n){ vw.v[n.id] = targetOf(sc, n, vw); }); }
    function dirOf(n, val, base){
      var diff = val - base;
      if(n.abs != null) return Math.abs(diff) >= n.abs ? (diff > 0 ? 1 : -1) : 0;
      return Math.abs(diff) >= n.rel * Math.abs(base) ? (diff > 0 ? 1 : -1) : 0;
    }
    /* A link's arrow shows only when it has moved the way its cause implies (the cause's arrow times the link's sign),
       and its cause shows an arrow itself; so on a reversal the chain (labels and cause line alike) stops at the first
       link still pointing the old way until it turns. One threshold for the control (ctl.key) sets "moved" for the
       arrows, the cause line, the "same" labels, the tag's word and the screen reader line alike. */
    function state(){
      var vw = view, d = {}, raw = {};
      var dc = Math.abs(vw.c - cur.ctl.base) >= cur.ctl.key ? (vw.c > cur.ctl.base ? 1 : -1) : 0;
      cur.nodes.forEach(function(n){
        raw[n.id] = dirOf(n, vw.v[n.id], vw.b[n.id]);
        var want = (n.sign || 1) * (n.from === 'c' ? dc : d[n.from]);
        d[n.id] = want && raw[n.id] === want ? want : 0;
      });
      return { c: vw.c, v: vw.v, b: vw.b, d: d, raw: raw, dc: dc };
    }
    function settled(){
      var vw = view;
      if(Math.abs(vw.c - vw.u) > (cur.ctl.max - cur.ctl.min) * 0.002) return false;
      for(var i = 0; i < cur.nodes.length; i++){ var n = cur.nodes[i], t = targetOf(cur, n, vw), sc = Math.abs(vw.b[n.id]) || 1; if(Math.abs(vw.v[n.id] - t) > sc * 0.003) return false; }
      return true;
    }
    function step(dt){
      var vw = view, kc = 1 - Math.exp(-dt / 130);
      vw.c += (vw.u - vw.c) * kc;
      if(Math.abs(vw.u - vw.c) < (cur.ctl.max - cur.ctl.min) * 0.001) vw.c = vw.u;
      cur.nodes.forEach(function(n){ var t = targetOf(cur, n, vw); vw.v[n.id] = n.tau ? vw.v[n.id] + (t - vw.v[n.id]) * (1 - Math.exp(-dt / n.tau)) : t; });
    }

    /* ---- sizes */
    function scale(){ var r = svg.getBoundingClientRect(); return r.width ? r.width / (E.W || 600) : 1; }
    function pickLayout(){ return (stage.clientWidth || 0) >= 900 ? 'wide' : 'tall'; }
    function layout(){
      var id = pickLayout(), L0 = cur.layouts[id], ex = 0, L = { id: id, w: L0.w, h: L0.h };
      if(id === 'wide'){ var avail = Math.max(300, (window.innerHeight || 800) - 330), asp = (stage.clientWidth || 0) / avail; if(asp > L.w / L.h) ex = Math.min(400, Math.round(L.h * asp - L.w)); }
      E.L = L; E.W = L.w + ex; E.H = L.h; E.X0 = -ex / 2;
      svg.setAttribute('viewBox', f1(E.X0) + ' 0 ' + E.W + ' ' + L.h); fxs.setAttribute('viewBox', f1(E.X0) + ' 0 ' + E.W + ' ' + L.h); pic.setAttribute('data-lay', id);
      pic.style.maxWidth = id === 'wide' ? 'calc((100vh - 330px) * ' + (E.W / E.H).toFixed(4) + ')' : 'max(320px, calc((100vh - 330px) * ' + (L.w / L.h).toFixed(4) + '))';
    }
    function metrics(){ var k = scale() || 1; E.k = k; E.fs = clamp((k < 0.8 ? 12.5 : 13.5) / k, 10, 27); E.gap = 6 / k; }
    function buildArt(){
      art.innerHTML = cur.art(E);
      fxg.innerHTML = cur.fx ? cur.fx(E) : '';
      R = {};
      art.querySelectorAll('[data-r]').forEach(function(n){ R[n.getAttribute('data-r')] = n; });
      fxg.querySelectorAll('[data-r]').forEach(function(n){ R[n.getAttribute('data-r')] = n; });
      E.root = stage; E.still = K.reduced();
      if(cur.init) cur.init(E, R);
      labCache = {}; labs.innerHTML = ''; labSig = '';
    }

    /* ---- labels: pills placed clear of each other, the knob and the controls (from the pathway tracer) */
    var labCache = {}, lastPlace = {}, TW = {};
    // label widths from a canvas (no layout is forced, so a frame whose numbers change stays cheap)
    var cv = null, cvFam = '';
    function textW(t){
      var key = t + '|' + E.fs.toFixed(2);
      if(TW[key]) return TW[key];
      if(!cv){ try{ cv = document.createElement('canvas').getContext('2d'); }catch(e){ cv = null; } }
      if(cv && !cvFam){ var m = document.createElementNS(NS, 'text'); m.setAttribute('class', 'px-lab-m'); labs.appendChild(m); cvFam = getComputedStyle(m).fontFamily || 'sans-serif'; labs.removeChild(m); }
      var w = 0;
      if(cv){ cv.font = '900 ' + E.fs.toFixed(2) + 'px ' + cvFam; w = cv.measureText(t).width * 1.03; }
      return (TW[key] = w > 0 ? w : t.length * E.fs * 0.6);
    }
    function inter(a, b, g){ return a[0] < b[2] + g && a[2] > b[0] - g && a[1] < b[3] + g && a[3] > b[1] - g; }
    var OFF = { r: [1, 0], l: [-1, 0], u: [0, -1], d: [0, 1], ur: [0.8, -0.8], ul: [-0.8, -0.8], dr: [0.8, 0.8], dl: [-0.8, 0.8] };
    var ctrlBox = null;
    function ctrlDirty(){ ctrlBox = null; labSig = ''; }
    function boxOf(el){ var pr = pic.getBoundingClientRect(), q = el.getBoundingClientRect(), k = E.k || 1, x0 = E.X0 || 0; return [(q.left - pr.left) / k + x0, (q.top - pr.top) / k, (q.right - pr.left) / k + x0, (q.bottom - pr.top) / k]; }
    /* The controls' boxes are measured only when something about them changes (a layout, the cue, the "before" tick
       showing or hiding, the tag's text length); the tag's box then rides with the knob by its measured offset. */
    var tagRel = null, bfWas = null, tagLen = -1;
    function ctrls(){
      var bf = handle && handle.el.querySelector('.tk2-before'), tg = handle && handle.el.querySelector('.tk2-tag');
      var bfOn = !!(bf && !bf.hidden), tl = tg && !tg.hidden ? tg.textContent.length : -1;
      if(bfOn !== bfWas || tl !== tagLen) ctrlBox = null;
      if(ctrlBox) return ctrlBox;
      bfWas = bfOn; tagLen = tl;
      var out = [];
      if(reset.offsetWidth) out.push(boxOf(reset));
      if(bfOn && bf.offsetWidth) out.push(boxOf(bf));
      if(cue && cue.active()){ var c = pic.querySelector('.tk2-cue'); if(c) out.push(boxOf(c)); }
      tagRel = null;
      if(tl >= 0 && tg.offsetWidth){
        // the tag's box without the kit's slide at the picture's edge (added back in keepOut)
        var tb = boxOf(tg), p = cur.knobAt(handle.value(), E.L), ml = parseFloat(tg.style.marginLeft) || 0, sh = ml / (E.k || 1);
        tagRel = [tb[0] - sh - p[0], tb[1] - p[1], tb[2] - sh - p[0], tb[3] - p[1]];
      }
      return (ctrlBox = out);
    }
    function keepOut(){
      var k = E.k || 1, p = cur.knobAt(view.u, E.L), r = 30 / k, c = ctrls(), out = [[p[0] - r, p[1] - r, p[0] + r, p[1] + r]].concat(c).concat(cur.avoid ? cur.avoid(E) : []);
      if(tagRel){
        var x0 = (E.X0 || 0) + 4, x1 = (E.X0 || 0) + E.W - 4, a0 = p[0] + tagRel[0], a1 = p[0] + tagRel[2], dx = a0 < x0 ? x0 - a0 : a1 > x1 ? x1 - a1 : 0;
        out.push([a0 + dx, p[1] + tagRel[1], a1 + dx, p[1] + tagRel[3]]);
      }
      return out;
    }
    function placeLabels(list){
      var fs = E.fs, h = fs * 1.75, pad = fs * 0.55, placed = keepOut(), used = {}, g = E.gap, x0 = E.X0 || 0;
      list.forEach(function(L){
        var text = L.text.replace(/\s+$/, ''), w = textW(text) + pad * 2, at = L.at, best = null;
        var sides = (L.side || ['r', 'l', 'u', 'd']).concat(['u', 'd', 'r', 'l', 'ur', 'ul', 'dr', 'dl']);
        var cands = [];
        [0.9, 1.6, 2.4, 3.4, 4.6].forEach(function(dd, di){ sides.forEach(function(sd, si){ cands.push({ sd: sd, dd: dd }); }); });
        var prev = lastPlace[cur.id + ':' + L.key];
        if(prev) cands.unshift(prev);
        for(var c = 0; c < cands.length && !best; c++){
          var q = cands[c], o2 = OFF[q.sd], d = q.dd * fs;
          var cx = o2[0] ? at[0] + o2[0] * (w / 2 + d * 0.6) : at[0], cy = at[1] + o2[1] * (h / 2 + d);
          var b = [cx - w / 2, cy - h / 2, cx + w / 2, cy + h / 2];
          if(b[0] < x0 + 4 || b[2] > x0 + E.W - 4 || b[1] < 4 || b[3] > E.H - 4) continue;
          if(placed.some(function(x){ return inter(x, b, g); })) continue;
          best = { b: b, sd: q.sd, dd: q.dd };
        }
        if(!best){
          for(var ring = 1; ring <= 16 && !best; ring++){
            var rr = ring * fs * 1.1, nn = 8 + ring * 4, bestD = Infinity;
            for(var a = 0; a < nn; a++){
              var ang = a / nn * Math.PI * 2, cx2 = at[0] + Math.cos(ang) * (rr + w * 0.35 * Math.abs(Math.cos(ang))), cy2 = at[1] + Math.sin(ang) * rr;
              var b2 = [cx2 - w / 2, cy2 - h / 2, cx2 + w / 2, cy2 + h / 2];
              if(b2[0] < x0 + 4 || b2[2] > x0 + E.W - 4 || b2[1] < 4 || b2[3] > E.H - 4) continue;
              if(placed.some(function(x){ return inter(x, b2, g); })) continue;
              var dd2 = Math.hypot(cx2 - at[0], cy2 - at[1]);
              if(dd2 < bestD){ bestD = dd2; best = { b: b2, far: true }; }
            }
          }
          if(!best){ var bx = clamp(at[0] - w / 2, x0 + 4, x0 + E.W - 4 - w), by = clamp(at[1] - h * 1.6, 4, E.H - 4 - h); best = { b: [bx, by, bx + w, by + h], far: true }; }
        }
        if(!best.far) lastPlace[cur.id + ':' + L.key] = { sd: best.sd, dd: best.dd }; else delete lastPlace[cur.id + ':' + L.key];
        placed.push(best.b);
        used[L.key] = 1;
        drawLab(L, text, best.b, at, !!best.far);
      });
      Object.keys(labCache).forEach(function(k){ if(!used[k]){ labCache[k].g.remove(); delete labCache[k]; } });
    }
    function drawLab(L, text, b, at, lead){
      var c = labCache[L.key];
      if(!c){
        var gEl = document.createElementNS(NS, 'g');
        gEl.innerHTML = '<path class="px-lead"/><circle class="px-lead-dot"/><rect/><text dy="0.36em"/>';
        labs.appendChild(gEl);
        c = labCache[L.key] = { g: gEl, lead: gEl.childNodes[0], dot: gEl.childNodes[1], rect: gEl.childNodes[2], t: gEl.childNodes[3], sig: '' };
      }
      var sig = text + '|' + L.role + '|' + b.map(f1).join(',') + '|' + (lead ? f1(at[0]) + ',' + f1(at[1]) : '') + '|' + E.fs.toFixed(2) + (L.strong ? 's' : '');
      if(sig === c.sig) return;
      c.sig = sig;
      sa(c.g, 'class', 'px-lab is-' + L.role + (L.strong ? ' is-strong' : ''));
      sa(c.g, 'data-lab', L.key);
      var h = b[3] - b[1];
      sa(c.rect, 'x', f1(b[0])); sa(c.rect, 'y', f1(b[1])); sa(c.rect, 'width', f1(b[2] - b[0])); sa(c.rect, 'height', f1(h)); sa(c.rect, 'rx', f1(h / 2));
      sa(c.t, 'x', f1((b[0] + b[2]) / 2)); sa(c.t, 'y', f1((b[1] + b[3]) / 2)); c.t.style.fontSize = E.fs.toFixed(2) + 'px'; if(c.t.textContent !== text) c.t.textContent = text;
      var inside = at[0] > b[0] && at[0] < b[2] && at[1] > b[1] && at[1] < b[3];
      if(lead && !inside){
        var cx = clamp(at[0], b[0], b[2]), cy = clamp(at[1], b[1], b[3]);
        sa(c.lead, 'd', 'M' + f1(cx) + ',' + f1(cy) + 'L' + f1(at[0]) + ',' + f1(at[1]));
        sa(c.dot, 'cx', f1(at[0])); sa(c.dot, 'cy', f1(at[1])); sa(c.dot, 'r', f1(E.fs * 0.22));
        c.lead.style.display = c.dot.style.display = '';
      } else c.lead.style.display = c.dot.style.display = 'none';
    }

    /* ---- one frame */
    var lastSt = null, causeKey = '', tookAt = 0, saidKey = '', labSig = '';
    function draw(dt){
      var st = state();
      lastSt = st;
      cur.paint(st, E, R, dt || 0);
      var list = cur.labels(st, E), ck = ctrls(), sig = E.fs.toFixed(2) + '|' + f1(view.u * 100) + '|' + ck.length + '|' + list.map(function(L){ return L.key + ':' + L.text + '@' + f1(L.at[0]) + ',' + f1(L.at[1]); }).join(';');
      if(sig !== labSig){ labSig = sig; placeLabels(list); }
      // the cause line: the chain as far as it has reached; the takeaway once everything has settled
      var calm = settled(), off = st.dc !== 0;
      var key;
      if(!off && calm){ key = 'rest'; if(causeKey !== key){ cause.take(cur.rest); } }
      else if(calm){
        key = 'take:' + cur.take(st);
        if(causeKey !== key){ cause.take(cur.take(st)); }
      } else {
        var parts = off ? cur.words(st) : [];
        key = 'set:' + parts.map(function(p){ return p.t; }).join('|');
        if(causeKey !== key){ if(parts.length) cause.set(parts); else cause.take(cur.rest); }
      }
      causeKey = key;
      if(calm && key !== saidKey){ saidKey = key; say(key === 'rest' ? cur.tab + '. ' + cur.rest : cur.take(st)); }
      return calm;
    }
    // the loop runs while the screen shows: blood flows, breaths come and go, the heart beats
    function tick(ts){
      raf = 0;
      if(!onScreen) return;
      var dt = last ? Math.min(50, ts - last) : 16; last = ts;
      /* While a change spreads every frame is drawn. At rest only the ambient motion runs (blood, breath, beat), and it is
         drawn on every third frame (about 20 a second, its time carried over), so a settled screen costs a third. */
      acc += dt;
      if(!calmNow || ++skip >= 3){ step(acc); calmNow = draw(acc); acc = 0; skip = 0; }
      raf = requestAnimationFrame(tick);
    }
    var acc = 0, skip = 0, calmNow = false;
    function startLoop(){ calmNow = false; acc = 0; if(!raf && onScreen && !K.reduced() && window.requestAnimationFrame){ last = 0; raf = requestAnimationFrame(tick); } }
    function stopLoop(){ if(raf){ cancelAnimationFrame(raf); raf = 0; } last = 0; }
    function fadeOut(){
      // the picture and its moving layer, frozen, fading out over the new state
      var c = document.createElement('div'); c.className = 'px-fade'; c.setAttribute('aria-hidden', 'true');
      c.appendChild(svg.cloneNode(true)); c.appendChild(fxs.cloneNode(true));
      pic.appendChild(c);
      var done = function(){ if(c.parentNode) c.parentNode.removeChild(c); };
      if(c.animate){ var an = c.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 260, easing: 'linear' }); an.onfinish = done; setTimeout(done, 480); } else done();
    }
    function go(v){
      view.u = v; cur.u = v;
      if(handle) handle.before(Math.abs(v - cur.ctl.base) > (cur.ctl.max - cur.ctl.min) * 0.02 ? cur.ctl.base : null);
      if(K.reduced() || !window.requestAnimationFrame || !onScreen){ if(onScreen) fadeOut(); settleAll(cur, view); E.still = K.reduced(); draw(0); return; }
      calmNow = false;
      startLoop();
    }

    /* ---- the knob on the picture */
    function makeHandle(){
      if(handle){ handle.el.remove(); handle = null; }
      var c = cur.ctl;
      handle = K.handle(layer, { key: 'anp-predict-knob', label: c.label, value: view.u, min: c.min, max: c.max, step: c.step, chip: false,
        at: function(v){ var q = cur.knobAt(v, E.L); return [q[0] - (E.X0 || 0), q[1]]; },
        dir: function(){ var t = cur.track(E.L); if(t.line){ var l = t.line; return Math.atan2(l[3] - l[1], l[2] - l[0]) * 180 / Math.PI; } return 90; },
        pick: function(x, y){ x += E.X0 || 0; return clamp(Math.round(cur.knobPick(x, y, E.L) / c.step) * c.step, c.min, c.max); },
        keys: function(v, key, shift){
          var s = c.step * (shift ? 10 : 1) * (c.step < 0.05 ? 5 : 1);
          if(key === 'ArrowRight' || key === 'ArrowUp') return clamp(v + s, c.min, c.max);
          if(key === 'ArrowLeft' || key === 'ArrowDown') return clamp(v - s, c.min, c.max);
          if(key === 'PageUp') return clamp(v + s * 5, c.min, c.max);
          if(key === 'PageDown') return clamp(v - s * 5, c.min, c.max);
          if(key === 'Home') return c.min;
          if(key === 'End') return c.max;
          return null;
        },
        valuetext: function(v){ return c.text(v); },
        tag: c.tag ? function(v){ return c.tag(v); } : null,
        bounds: function(){ return [4, 4, E.W - 4, E.H - 4]; },
        tagSide: function(v){ if(c.tagSide){ var ts = c.tagSide(v, E.L); if(ts) return ts; } var t = cur.track(E.L); if(!t.line) return 'right'; return Math.abs(t.line[3] - t.line[1]) > Math.abs(t.line[2] - t.line[0]) ? (t.line[0] < E.L.w / 2 ? 'right' : 'left') : E.L.id === 'tall' && t.line[1] < 160 ? 'down' : 'up'; },
        onStart: function(){ hideCue(true); tourDid('drag'); },
        onInput: function(v){ hideCue(true); tourDid('drag'); go(v); },
        onEnd: function(){ ctrlDirty(); }
      });
      handle.before(Math.abs(view.u - cur.ctl.base) > (cur.ctl.max - cur.ctl.min) * 0.02 ? cur.ctl.base : null);
      // a press on the track or the part away from the knob grabs it there (the thing a cue names drags where it is grabbed)
      svg.onpointerdown = function(e){
        if(!handle || (e.pointerType === 'mouse' && e.button !== 0)) return;
        var r = svg.getBoundingClientRect(), k = r.width / E.W, x = (e.clientX - r.left) / k + (E.X0 || 0), y = (e.clientY - r.top) / k;
        var near = nearTrack(x, y, k);
        if(near) handle.grab(e);
      };
    }
    // is a press close enough to the knob's path to take it there?
    function nearTrack(x, y, k){
      var c = cur.ctl, best = Infinity;
      for(var i = 0; i <= 40; i++){ var v = c.min + (c.max - c.min) * i / 40, p = cur.knobAt(v, E.L); best = Math.min(best, Math.hypot(p[0] - x, p[1] - y)); }
      return best * k < 30;
    }
    reset.addEventListener('click', function(){
      fadeOut();
      stopLoop();
      cur.u = cur.ctl.base; view = newView(cur); E.still = K.reduced();
      if(handle){ handle.value(cur.u, false); handle.before(null); }
      ctrlDirty(); causeKey = ''; draw(0); startLoop();
      say('Start over. ' + cur.tab + ' at its usual level.');
    });

    /* ---- tabs */
    function setTab(id, user){
      var sc = scenes.filter(function(x){ return x.id === id; })[0];
      if(!sc) return;
      stopLoop();
      if(cur && view) cur.u = view.u;
      cur = sc; view = newView(sc); settleAll(sc, view);
      tabs.value(sc.id); head.purpose(sc.purpose);
      main.setAttribute('data-scene', sc.id);
      layout(); metrics(); ctrlDirty(); buildArt(); makeHandle(); causeKey = ''; draw(0); refHtml();
      var tl = cur.track(E.L).line; main.setAttribute('data-vt', !tl || Math.abs(tl[3] - tl[1]) > Math.abs(tl[2] - tl[0]) ? '1' : '0');
      if(user){ try{ history.replaceState(null, '', location.pathname + location.search + '#explore/' + sc.id); }catch(e){} }
      if(cue && cue.active()){ cue.hide(false); makeCue(); }
      startLoop();
    }

    /* ---- the first visit cue and "Show me how" */
    function makeCue(){
      var p = cur.knobAt(view.u, E.L);
      cue = K.cue(layer, { key: 'anp-predict', text: cur.cue, side: p[0] - (E.X0 || 0) > E.W * 0.55 ? 'left' : 'right', at: function(){ var q = cur.knobAt(view.u, E.L); return [q[0] - (E.X0 || 0), q[1]]; } });
      cue.show(); ctrlDirty(); causeKey = ''; draw(0);
      setTimeout(function(){ if(cue && cue.active()){ ctrlDirty(); draw(0); } }, 450);
    }
    function hideCue(used){ if(cue && cue.active()){ cue.hide(used); ctrlDirty(); } }
    var tour = K.tour({ key: 'anp-predict', label: 'Show me how', steps: [
      { id: 'drag', text: 'Drag the knob to make the change. Each label gets an arrow as the change reaches it.', target: function(){ return handle ? handle.knob : pic; } },
      { id: 'why', text: 'The line below names the chain in order. When it settles, it says what changed and what stayed the same.', target: function(){ return cause.el; } }],
      onClose: function(had){ if(had) try{ head.how.focus({ preventScroll: true }); }catch(e){} } });
    function tourDid(id){ if(tour.active()) tour.did(id); }
    function startTour(){ hideCue(false); tour.start(true); }

    /* ---- "?" for this screen */
    var ref = document.createElement('div'); ref.className = 'ls-sec px-ref';
    function topicOf(id){ var ts = (window.AnpCurriculum || {}).topics || []; return ts.filter(function(x){ return x.id === id; })[0] || null; }
    function refHtml(){
      var B = o.base || '../', links = cur.topics.map(topicOf).filter(function(t){ return t && t.built; });
      ref.innerHTML = '<h3 class="ls-h">' + esc(cur.tab) + ': ' + esc(cur.purpose.toLowerCase()) + '</h3>' +
        '<p class="ls-sub">Drag the knob on the picture (or use the arrow keys on it). The change spreads one link at a time: each label gets an arrow when the change reaches it, and the line under the picture names the chain in order. A label that says “same” did not change. Pictures are drawn to show the idea, not to scale.</p>' +
        '<p>' + esc(cur.note) + '</p>' +
        '<p><button type="button" class="btn-outline px-ref-q">Test yourself on this</button></p>' +
        (links.length ? '<p>Topic' + (links.length > 1 ? 's' : '') + ': ' + links.map(function(t){ return '<a href="' + esc(B + 'lessons/' + t.id + '.html') + '">' + esc(t.title) + '</a> · <a href="' + esc(B + 'notes/' + t.id + '.html') + '">notes</a>'; }).join('; ') + '</p>' : '') +
        '<p><button type="button" class="tk2-link px-ref-how">Show me how</button></p>';
    }
    ref.addEventListener('click', function(e){
      if(e.target.closest('.px-ref-q')){ if(o.studio && o.studio.close) o.studio.close(); if(o.onQuiz) o.onQuiz(cur.ids.slice()); return; }
      if(e.target.closest('.px-ref-how')){ if(o.studio && o.studio.close) o.studio.close(); setTimeout(startTour, 60); }
    });

    /* ---- sizes */
    var rz = 0, lastW = 0, lastH = 0;
    function resized(){
      clearTimeout(rz);
      rz = setTimeout(function(){
        if(!stage.isConnected || !pic.offsetWidth) return;
        var w = pic.offsetWidth, ih = window.innerHeight;
        if(w === lastW && ih === lastH){ if(handle) handle.place(); return; }
        var was = E.L && E.L.id;
        lastW = w; lastH = ih; layout(); metrics(); ctrlDirty(); TW = {};
        if(was !== E.L.id || !R.__built){ buildArt(); R.__built = 1; }
        draw(0); if(handle) handle.place(); if(cue && cue.active()) cue.place();
      }, 60);
    }
    if(window.ResizeObserver){ var ro = new ResizeObserver(resized); ro.observe(pic); }
    window.addEventListener('resize', resized);

    view = newView(cur);
    setTab(cur.id, false);
    var started = false;
    function shown(on){
      onScreen = !!on;
      if(!on){ stopLoop(); if(view) settleAll(cur, view); hideCue(false); if(tour.active()) tour.stop(); return; }
      setTimeout(function(){ lastW = 0; resized(); if(!started){ started = true; makeCue(); } startLoop(); }, 30);
    }
    var api = {
      stage: stage, ref: ref, shown: shown,
      tab: function(v){ if(v === undefined) return cur.id; setTab(v, false); },
      /* tabFor({ tab } | { topic } | { chapter, topicOf }) -> a screen id or null */
      tabFor: function(q){
        var hit = null;
        scenes.forEach(function(sc){
          if(hit) return;
          if(q.tab && q.tab === sc.id) hit = sc.id;
          else if(q.topic && sc.topics.indexOf(q.topic) > -1) hit = sc.id;
          else if(q.chapter && q.topicOf && sc.topics.some(function(t){ var x = q.topicOf(t); return x && x.chapter === q.chapter; })) hit = sc.id;
        });
        return hit;
      },
      idsOf: function(id){ var sc = scenes.filter(function(x){ return x.id === id; })[0]; return sc ? sc.ids.slice() : []; },
      // tests: one moment, drawn
      _scenes: scenes,
      _st: function(){ return lastSt; },
      _set: function(v){ if(handle) handle.value(v, false); go(v); },
      _frame: function(u0, u, t){
        // settle at u0, jump the control to u and draw the chain t ms later (frames of the spread for the frame test)
        stopLoop(); view.u = u0; settleAll(cur, view); view.u = u; cur.u = u;
        if(handle) handle.value(u, false);
        for(var e = 0; e < t; e += 16) step(16);
        ctrlDirty(); draw(0); return lastSt;
      },
      _settle: function(u){ stopLoop(); view.u = u; cur.u = u; settleAll(cur, view); if(handle){ handle.value(u, false); handle.before(Math.abs(u - cur.ctl.base) > (cur.ctl.max - cur.ctl.min) * 0.02 ? cur.ctl.base : null); } ctrlDirty(); causeKey = ''; draw(0); return lastSt; },
      _cause: function(){ return cause.el.textContent; },
      _labels: function(){ return [].map.call(labs.querySelectorAll('.px-lab'), function(g){ return { key: g.getAttribute('data-lab'), text: g.querySelector('text').textContent }; }); },
      _loop: function(){ return !!raf; },
      _E: function(){ return E; },
      _draw: function(n){ var t = performance.now(); for(var i = 0; i < (n || 1); i++){ step(16); draw(16); } return (performance.now() - t) / (n || 1); },
      _settled: function(){ return settled(); }
    };
    window.AnpPredictExplore.current = api;
    return api;
  }

  window.AnpPredictExplore = { build: build, SCENES: SCENES };
})();
