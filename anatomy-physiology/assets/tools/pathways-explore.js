/* A&P Pathway tracer, tools v2 Explore (docs/tools-v2-anp-pathways-brief.md; standard docs/tools-v2-standard.md).

   The one idea: a physiological pathway is a chain of causes through real body parts. Each screen draws the body route
   of one pathway from the bank (blood through the heart, the knee jerk reflex arc, the stress hormone axis, a chemical
   synapse). The student drags the thing that travels (a blood cell, the signal, the hormone, the transmitter) along
   the drawn route; each step happens in place as it arrives (a valve opens, a ventricle squeezes, a neuron fires, a
   gland releases), and the steps it has reached are named in order beside the picture. After one full run a part can
   be broken (a root cut, a gland damaged, channels blocked, no fresh air): the next run stops there or changes there,
   and everything downstream shows what fails.

   One control: the knob on the route (K.handle; arrow keys, Home, End step through). The picture is a pure function of
   the position it shows, which chases the knob, so a jump is seen happening. The rail, the labels and the cause line
   are all read from the same state of the drawn position (never from the target).

   Data: the pathway's own steps (anatomy-physiology/data/tools/pathways.json) give the rail's step names and "?".
   Nothing here changes an item id or a record: Test yourself (pathways.js) keeps every pathway and drill.
   window.AnpPathExplore.build({ data, base, studio, onQuiz(id) }) -> { stage, ref, shown(on), tab(id?), tabFor(q), pathOf(tab) } */
(function(){
  'use strict';
  if(window.AnpPathExplore) return;
  var NS = 'http://www.w3.org/2000/svg';
  var W = 720, H = 540;   // every picture's viewBox
  function clamp(v, a, b){ return v < a ? a : v > b ? b : v; }
  function lerp(a, b, t){ return a + (b - a) * t; }
  function ss(t){ t = clamp(t, 0, 1); return t * t * (3 - 2 * t); }
  function ramp(x, a, b){ return ss((x - a) / (b - a)); }
  function bump(x, a, b, c, d){ return ramp(x, a, b) * (1 - ramp(x, c, d)); }
  function esc(s){ return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function f1(v){ return (Math.round(v * 10) / 10).toFixed(1); }
  function P(pts){ return pts.map(function(p, i){ return (i ? 'L' : 'M') + f1(p[0]) + ',' + f1(p[1]); }).join(''); }
  function mix(c1, c2, t){
    var a = c1.match(/\w\w/g).map(function(h){ return parseInt(h, 16); }), b = c2.match(/\w\w/g).map(function(h){ return parseInt(h, 16); });
    return '#' + a.map(function(x, i){ var v = Math.round(lerp(x, b[i], clamp(t, 0, 1))); return (v < 16 ? '0' : '') + v.toString(16); }).join('');
  }
  // a fixed scatter in [0,1]^2 (golden ratio): the same on every visit
  function scatter(n, seed){ var a = [], i; for(i = 0; i < n; i++) a.push([((i + 1) * 0.6180339887 + (seed || 0)) % 1, ((i + 1) * 0.7548776662 + (seed || 0) * 0.37) % 1]); return a; }
  // set an attribute or a style only when it changes: an unchanged write still costs the browser a style pass
  function sa(el, k, v){ v = String(v); if(el.getAttribute(k) !== v) el.setAttribute(k, v); }
  function so(el, v){ v = String(v); if(el.style.opacity !== v) el.style.opacity = v; }
  function arrowHead(x, y, ang, s){
    var c = Math.cos(ang), d = Math.sin(ang);
    return 'M' + f1(x - c * s - d * s * 0.6) + ',' + f1(y - d * s + c * s * 0.6) + 'L' + f1(x) + ',' + f1(y) + 'L' + f1(x - c * s + d * s * 0.6) + ',' + f1(y - d * s - c * s * 0.6);
  }

  /* ------------------------------------------------------------------ the route: one polyline per step */
  /* segs[k] runs from step k's place to step k+1's (its first point is step k's place). v in [0, segs.length]:
     v = k is at step k's place. */
  function Route(segs){
    var self = this, L = [];
    segs.forEach(function(pts){
      var acc = [0];
      for(var i = 1; i < pts.length; i++) acc.push(acc[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
      L.push(acc);
    });
    self.n = segs.length;
    self.at = function(v){
      v = clamp(v, 0, self.n);
      var k = Math.min(self.n - 1, Math.floor(v)), t = v - k, pts = segs[k], acc = L[k], d = t * acc[acc.length - 1];
      for(var i = 1; i < pts.length; i++) if(acc[i] >= d || i === pts.length - 1){
        var u = (d - acc[i - 1]) / ((acc[i] - acc[i - 1]) || 1);
        return [lerp(pts[i - 1][0], pts[i][0], clamp(u, 0, 1)), lerp(pts[i - 1][1], pts[i][1], clamp(u, 0, 1))];
      }
      return pts[pts.length - 1].slice();
    };
    self.dir = function(v){ var a = self.at(clamp(v - 0.02, 0, self.n)), b = self.at(clamp(v + 0.02, 0, self.n)); return Math.atan2(b[1] - a[1], b[0] - a[0]) * 180 / Math.PI; };
    // dense samples for picking
    var S = [];
    for(var i = 0; i <= self.n * 100; i++){ var v = i / 100, p = self.at(v); S.push([v, p[0], p[1]]); }
    self.near = function(x, y, lo, hi){
      var best = null, bd = Infinity;
      for(var i = 0; i < S.length; i++){ var s = S[i]; if(s[0] < lo - 1e-9 || s[0] > hi + 1e-9) continue; var d = (s[1] - x) * (s[1] - x) + (s[2] - y) * (s[2] - y); if(d < bd){ bd = d; best = s[0]; } }
      return best == null ? null : { v: best, d: Math.sqrt(bd) };
    };
    // the arc length from 0 to v (picture units), for revealing a trail with a dash
    self.len = function(v){
      v = clamp(v, 0, self.n); var k = Math.min(self.n - 1, Math.floor(v)), d = 0, i;
      for(i = 0; i < k; i++) d += L[i][L[i].length - 1];
      return d + (v - k) * L[k][L[k].length - 1];
    };
    // the drawn path from v0 to v1 (for trails)
    self.path = function(v0, v1){
      var pts = [], st = 0.02;
      for(var v = v0; v < v1; v += st) pts.push(self.at(v));
      pts.push(self.at(v1));
      return P(pts);
    };
  }

  /* ================================================================== the screens */
  var SCENES = [];

  /* ------------------------------------------------------------------ layouts */
  /* Every screen has two compositions of the same drawn parts: "wide" (2:1, a desktop stage) and "tall" (1:1, a phone
     or a tablet held upright). A part is drawn once in its own coordinates and placed by its group's transform
     [dx, dy, scale] (a negative scale is never used); points tagged with a group ([x, y, 'g']) are mapped through it,
     untagged points are already in the picture's coordinates. */
  function T(L, p){ var g = p[2] ? L.g[p[2]] : null; return g ? [g[0] + p[0] * g[2], g[1] + p[1] * g[2]] : [p[0], p[1]]; }
  function TS(L, pts){ return pts.map(function(p){ return T(L, p); }); }
  function G(L, name, inner){ var g = L.g[name]; return '<g transform="translate(' + f1(g[0]) + ',' + f1(g[1]) + ') scale(' + g[2] + ')">' + inner + '</g>'; }
  // a soft curve between two points, sampled as a polyline (bend: how far the middle bows, picture units)
  function bow(a, b, bend, n){
    var mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2, dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy) || 1, nx = -dy / len, ny = dx / len, out = [];
    n = n || 10;
    for(var i = 0; i <= n; i++){ var t = i / n, k = 4 * t * (1 - t) * bend; out.push([a[0] + dx * t + nx * k, a[1] + dy * t + ny * k]); }
    return out;
  }
  function offset(pts, d){
    return pts.map(function(p, i){
      var a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy) || 1;
      return [p[0] - dy / len * d, p[1] + dx / len * d];
    });
  }

  /* ------------------------------------------------------------------ 1. Heart: blood through the heart and body */
  (function(){
    var DE = '4F6FA8', OX = 'D2452A';
    function ox(v, br){ var up = br ? 0 : ramp(v, 4.9, 5.6); return up * (1 - ramp(v, 10.9, 11.6)); }
    // at: where on the route the cell passes this part (with no fresh air, an oxygen rich part turns oxygen poor then)
    function tube(pts, cls, w, at){ return '<path class="pe-vw" style="stroke-width:' + w + 'px" d="' + P(pts) + '"/><path class="pe-vb ' + cls + '"' + (at != null ? ' data-oxat="' + at + '"' : '') + ' style="stroke-width:' + (w - 7) + 'px" d="' + P(pts) + '"/>'; }
    function leaflet(x, y, dx, cls){ return '<path class="pe-leaf ' + cls + '" d="M' + x + ',' + y + 'l' + dx + ',0"/>'; }
    // the heart's own coordinates (the frontal section, right side on the viewer's left)
    var HP = { ra: [282, 238], tri: [286, 283], rv: [300, 345], pv: [341, 262], la: [440, 236], mit: [444, 283], lv: [422, 350], av: [379, 262] };
    function H(k, L){ return T(L, [HP[k][0], HP[k][1], 'heart']); }
    function heartBody(){
      var s = '<path class="pe-myo" d="M246,198 C220,214 222,290 232,330 C250,396 330,444 430,432 C482,424 508,372 502,300 C498,252 492,214 472,200 C440,190 300,188 246,198 Z"/>';
      s += '<ellipse class="pe-cav is-de" cx="284" cy="240" rx="42" ry="36"/><ellipse class="pe-cav is-ox" data-oxat="5.9" cx="444" cy="238" rx="40" ry="33"/>';
      s += '<path class="pe-cav is-de" data-r="rv" d="M254,290 C250,340 278,392 330,406 C346,380 350,330 350,290 Z"/>';
      s += '<path class="pe-cav is-ox" data-r="lv" data-oxat="7.6" d="M372,290 C372,340 380,394 420,412 C462,398 478,340 472,290 Z"/>';
      s += tube([[341, 296], [341, 250]], 'is-de', 22) + tube([[379, 296], [379, 250]], 'is-ox', 24, 8.9);
      s += '<path class="pe-ring" d="M256,283 H316 M416,283 H474"/>';
      s += '<g data-r="tri">' + leaflet(260, 283, 26, 'a') + leaflet(312, 283, -26, 'b') + '</g>';
      s += '<g data-r="mit">' + leaflet(418, 283, 27, 'a') + leaflet(470, 283, -27, 'b') + '</g>';
      s += '<g data-r="pv">' + leaflet(332, 262, 9, 'a') + leaflet(350, 262, -9, 'b') + '</g>';
      s += '<g data-r="av">' + leaflet(369, 262, 10, 'a') + leaflet(389, 262, -10, 'b') + '</g>';
      return s;
    }
    /* the tall composition is the original one (lungs above, body below), placed whole; the wide one puts the body's
       tissue on the left, the heart in the middle and the lungs on the right, so the pulmonary trunk runs to the right
       (as it does) and the pulmonary veins enter the left atrium from the right. */
    var LAY = {
      tall: { w: 600, h: 600, g: { heart: [-115.5, 0, 1.1], all: [-115.5, 0, 1.1] } },
      wide: { w: 1080, h: 540, g: { heart: [-17, -124, 1.35] } }
    };
    function geo(L){
      if(L.id === 'tall'){
        var a = function(pts){ return TS(L, pts.map(function(p){ return [p[0], p[1], 'all']; })); };
        return {
          segs: [
            a([[282, 238], [286, 283]]), a([[286, 283], [296, 320], [300, 345]]), a([[300, 345], [322, 330], [338, 300], [341, 262]]),
            a([[341, 262], [341, 190], [328, 160], [290, 140], [250, 128]]), a([[250, 128], [218, 112], [196, 88], [205, 62], [225, 56]]),
            a([[225, 56], [252, 60], [276, 82], [292, 112], [330, 150], [376, 172], [420, 196], [436, 212], [440, 236]]),
            a([[440, 236], [444, 283]]), a([[444, 283], [434, 320], [422, 350]]), a([[422, 350], [396, 330], [382, 298], [379, 262]]),
            a([[379, 262], [379, 180], [400, 154], [470, 152], [570, 154], [602, 186], [602, 300]]), a([[602, 300], [602, 455], [576, 488], [400, 488]]),
            a([[400, 488], [232, 488], [202, 460], [202, 380]]), a([[202, 380], [202, 300], [222, 268], [255, 250], [282, 238]])
          ],
          alv: a([[200, 50], [222, 36], [246, 40], [266, 56], [214, 76], [240, 74], [264, 86], [190, 98], [282, 66]]),
          cells: a([[250, 515], [312, 512], [374, 516], [436, 513], [498, 516], [560, 514], [282, 462], [344, 460], [406, 463], [468, 460], [530, 462], [140, 515], [184, 516], [626, 513], [156, 462], [600, 462]]),
          trach: a([[362, 22]])[0], lungsAt: a([[470, 60]])[0], bodyAt: a([[160, 500]])[0], o2At: a([[190, 30]])[0], o2bAt: a([[470, 470]])[0]
        };
      }
      return {
        segs: [
          [H('ra', L), H('tri', L)], [H('tri', L), [378, 300], H('rv', L)], [H('rv', L), [418, 325], [438, 290], H('pv', L)],
          [H('pv', L), [443, 110], [460, 70], [520, 56], [720, 56], [770, 90], [790, 120]],
          [[790, 120], [780, 170], [790, 230]],
          [[790, 230], [805, 290], [790, 340], [745, 362], [700, 336], [660, 280], [628, 232], H('la', L)],
          [H('la', L), H('mit', L)], [H('mit', L), [566, 300], H('lv', L)], [H('lv', L), [520, 325], [500, 290], H('av', L)],
          [H('av', L), [495, 110], [478, 84], [430, 74], [330, 74]],
          [[330, 74], [262, 90], [238, 120], [190, 180], [160, 250], [150, 300]],
          [[150, 300], [160, 380], [200, 440], [236, 468], [270, 466]],
          [[270, 466], [266, 420], [262, 360], [262, 262], [278, 224], [312, 206], H('ra', L)]
        ],
        alv: [[762, 150], [812, 142], [770, 196], [822, 190], [806, 244], [760, 246], [838, 236], [818, 288], [772, 290]],
        cells: [[95, 240], [215, 238], [95, 330], [210, 330], [105, 150], [110, 412], [45, 230], [45, 320], [165, 62], [45, 150], [45, 70], [105, 70], [45, 410], [60, 490], [130, 500], [205, 420]],
        trach: [912, 22], lungsAt: [995, 300], bodyAt: [60, 500], o2At: [720, 170], o2bAt: [60, 280]
      };
    }
    SCENES.push({
      id: 'heart', tab: 'Heart', short: 'Heart', path: 'blood-flow',
      purpose: 'Carry one blood cell through the heart, lungs and body',
      cue: 'Drag the blood cell', token: 'the blood cell', thing: 'blood cell',
      layouts: LAY, last: 13, steps: 13, cycle: true,
      segs: function(L){ return geo(L).segs; },
      breaks: [{ id: 'air', at: 4.5, pass: true, place: function(L){ var t = geo(L).trach; return [t[0] - 10, t[1] + 16]; }, off: [-1, 0], tag: 'No fresh air', label: 'Stop air', aria: 'Stop fresh air reaching the lungs', name: 'No fresh air in the lungs', step: 5 }],
      take: 'Right heart pumps to the lungs, left heart to the body.',
      brokenTake: 'No fresh air: the heart still pumps, but the body gets less O₂.',
      art: function(E){
        var L = E.L, g = geo(L), s = '<defs><radialGradient id="pe-lung" cx="0.45" cy="0.4" r="0.75"><stop offset="0" stop-color="#F9C9CB"/><stop offset="1" stop-color="#E9969C"/></radialGradient>' +
          '<radialGradient id="pe-myo" cx="0.4" cy="0.35" r="0.85"><stop offset="0" stop-color="#D4685A"/><stop offset="0.7" stop-color="#B2463A"/><stop offset="1" stop-color="#86281F"/></radialGradient>' +
          '<linearGradient id="pe-tis" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F3D5C6"/><stop offset="1" stop-color="#E9BFA9"/></linearGradient></defs>';
        s += '<rect class="pe-bg" x="-400" y="0" width="' + (L.w + 800) + '" height="' + L.h + '"/>';
        var cells = '';
        g.cells.forEach(function(c, i){ cells += '<g data-r="cell' + i + '"><rect class="pe-tcell" x="' + f1(c[0] - 27) + '" y="' + f1(c[1] - 19) + '" width="54" height="38" rx="14"/><circle class="pe-tnuc" cx="' + f1(c[0] - 6) + '" cy="' + f1(c[1]) + '" r="6"/></g>'; });
        var alv = '';
        g.alv.forEach(function(a, i){ alv += '<circle class="pe-alv" data-r="alv' + i + '" cx="' + f1(a[0]) + '" cy="' + f1(a[1]) + '" r="' + (L.id === 'tall' ? 14.3 : 15) + '"/>'; });
        if(L.id === 'tall'){
          var lungL = 'M330,40 C320,16 290,8 262,12 C210,20 168,58 158,108 C154,130 170,140 196,138 C240,134 290,132 322,130 C336,110 338,70 330,40 Z';
          var back = '<path class="pe-lung" d="' + lungL + '"/><path class="pe-lung" transform="translate(724,0) scale(-1,1)" d="' + lungL + '"/>' +
            '<path class="pe-trach" d="M362,0 V40 M362,40 L326,64 M362,40 L398,64"/><path class="pe-trach-r" d="M354,8 h16 M354,18 h16 M354,28 h16"/>' +
            '<path class="pe-tissue" d="M90,448 H660 V560 H90 Z"/>';
          s += G(L, 'all', back) + alv + cells;
          var vt = function(pts, cls, w, at){ return G(L, 'all', tube(pts, cls, w, at)); };
          s += vt([[341, 290], [341, 190], [328, 160], [290, 140], [250, 128], [222, 114]], 'is-de', 22);
          s += G(L, 'all', '<path class="pe-cap is-de" d="M250,128 L218,112 L196,88 L205,62 L225,56"/><path class="pe-cap is-ox" data-oxat="5" d="M225,56 L252,60 L276,82 L292,112"/>');
          s += vt([[379, 290], [379, 180], [400, 154], [470, 152], [570, 154], [602, 186], [602, 455], [578, 486]], 'is-ox', 24, 9.4);
          s += G(L, 'all', '<path class="pe-cap is-ox" data-oxat="10.4" d="M578,488 H400"/><path class="pe-cap is-de" d="M400,488 H232"/>');
          s += vt([[232, 488], [202, 460], [202, 300], [222, 268], [252, 252]], 'is-de', 24) + vt([[272, 150], [274, 205]], 'is-de', 20);
          s += G(L, 'heart', heartBody());
          // the pulmonary veins run over the aorta's root and into the left atrium (drawn over the heart wall)
          s += vt([[292, 112], [330, 150], [376, 172], [420, 196], [436, 214], [440, 228]], 'is-ox', 18, 5.6);
        } else {
          // body tissue (left), lungs (right)
          s += '<path class="pe-tissue" d="M-400,0 H250 C262,180 262,360 250,540 H-400 Z"/>' + cells;
          s += '<g><path class="pe-lung" d="M860,70 C900,80 905,150 900,250 C896,350 890,440 860,470 C800,482 742,470 722,430 C706,380 708,300 716,230 C724,150 760,78 860,70 Z"/>' +
            '<path class="pe-lung" d="M930,80 C1000,70 1050,140 1060,240 C1068,340 1060,430 1030,465 C990,476 950,470 935,440 C925,360 922,250 925,170 C926,120 925,92 930,80 Z"/>' +
            '<path class="pe-trach" d="M912,0 V40 M912,40 L888,72 M912,40 L936,72"/><path class="pe-trach-r" d="M904,8 h16 M904,18 h16 M904,28 h16"/></g>' + alv;
          s += tube([[443, 280], [443, 110], [460, 70], [520, 56], [720, 56], [770, 90], [790, 118]], 'is-de', 24);
          s += '<path class="pe-cap is-de" d="' + P([[790, 120], [780, 170], [790, 230]]) + '"/><path class="pe-cap is-ox" data-oxat="5" d="' + P([[790, 230], [805, 290], [790, 340]]) + '"/>';
          s += tube([[495, 280], [495, 110], [478, 84], [430, 74], [330, 74], [262, 90], [238, 120]], 'is-ox', 26, 9.4);
          s += '<path class="pe-cap is-ox" data-oxat="10.4" d="' + P([[238, 120], [190, 180], [160, 250], [150, 300]]) + '"/><path class="pe-cap is-de" d="' + P([[150, 300], [160, 380], [200, 440], [236, 468]]) + '"/>';
          s += G(L, 'heart', heartBody());
          // the inferior vena cava runs up outside the heart's wall and opens into the right atrium
          s += tube([[236, 468], [270, 466], [266, 420], [262, 360], [262, 262], [278, 224], [314, 206]], 'is-de', 26);
          s += tube([[790, 340], [745, 362], [700, 336], [660, 280], [628, 232], [610, 214]], 'is-ox', 20, 5.6);
        }
        s += '<g data-r="cuts"></g><g data-r="gas"></g>';
        return s;
      },
      fxInit: function(fx, R){
        var h = '';
        for(var i = 0; i < 6; i++) h += '<circle class="pe-o2m" r="5.5" cx="-50" cy="-50"/>';
        for(i = 0; i < 4; i++) h += '<circle class="pe-co2m" r="5" cx="-50" cy="-50"/>';
        R.gas.innerHTML = h;
      },
      state: function(v, br){
        var noAir = !!(br && br.id === 'air');
        // a step's words show from 0.12 before its place, except a ventricle's: they come as its inlet valve starts to shut
        var k = Math.min(12, Math.floor(v + 0.12)); if(v >= 1.71 && v < 1.88) k = 2; if(v >= 7.71 && v < 7.88) k = 8;
        var st = { v: v, lap: v >= 12.9, k: v >= 12.9 ? 0 : k, stop: null, noAir: noAir };
        st.ox = ox(v, noAir);
        st.tri = bump(v, 0.58, 0.88, 1.69, 1.86); st.rvSq = bump(v, 1.69, 1.95, 3.3, 3.7); st.pv = bump(v, 2.6, 2.88, 3.88, 4.1);
        st.mit = bump(v, 6.58, 6.88, 7.69, 7.86); st.lvSq = bump(v, 7.69, 7.95, 9.3, 9.7); st.av = bump(v, 8.6, 8.88, 9.88, 10.1);
        st.lungX = bump(v, 4.7, 4.88, 5.88, 6.05);
        st.bodyX = bump(v, 10.7, 10.88, 11.88, 12.05);
        return st;
      },
      valves: function(L){ return [['tri', H('tri', L)], ['mit', H('mit', L)], ['pv', H('pv', L)], ['av', H('av', L)]]; },
      fails: function(st){ var f = []; if(st.noAir){ if(st.v >= 4.88 || st.lap) f.push(5); if(st.v >= 10.88 || st.lap) f.push(11); } return f; },
      paint: function(R, st, E){
        function open(g, t, ang){ var a = g.childNodes[0], b = g.childNodes[1], d = t * ang; sa(a, 'transform', 'rotate(' + f1(d) + ' ' + a.getAttribute('d').match(/M([\d.]+),([\d.]+)/).slice(1).join(' ') + ')'); sa(b, 'transform', 'rotate(' + f1(-d) + ' ' + b.getAttribute('d').match(/M([\d.]+),([\d.]+)/).slice(1).join(' ') + ')'); }
        open(R.tri, st.tri, 68); open(R.mit, st.mit, 68); open(R.pv, st.pv, -70); open(R.av, st.av, -70);
        sa(R.rv, 'transform', st.rvSq ? 'translate(302,330) scale(' + (1 - st.rvSq * 0.2).toFixed(3) + ') translate(-302,-330)' : '');
        sa(R.lv, 'transform', st.lvSq ? 'translate(422,335) scale(' + (1 - st.lvSq * 0.2).toFixed(3) + ') translate(-422,-335)' : '');
        var g = geo(E.L);
        g.alv.forEach(function(a, i){ sa(R['alv' + i], 'class', 'pe-alv' + (st.noAir ? ' is-stale' : '')); });
        if(!R.oxs) R.oxs = [].slice.call(R.rv.ownerSVGElement.querySelectorAll('[data-oxat]'));
        R.oxs.forEach(function(el){ el.classList.toggle('is-low', !!st.noAir && (st.v >= +el.getAttribute('data-oxat') || st.lap)); });
        var p = this.route.at(st.v), kids = R.gas.childNodes, i, t;
        for(i = 0; i < 6; i++){
          var c = kids[i], a = g.alv[i], b = g.cells[i];
          if(st.lungX > 0 && !st.noAir){ t = ramp(st.v, 4.88 + i * 0.04, 5.6); sa(c, 'cx', f1(lerp(a[0], p[0], t))); sa(c, 'cy', f1(lerp(a[1], p[1], t))); so(c, f1(st.lungX)); }
          else if(st.bodyX > 0 && (!st.noAir || i < 1)){ t = ramp(st.v, 10.88 + i * 0.04, 11.6); sa(c, 'cx', f1(lerp(p[0], b[0], t))); sa(c, 'cy', f1(lerp(p[1], b[1], t))); so(c, f1(st.bodyX)); }
          else so(c, '0');
        }
        for(i = 0; i < 4; i++){
          var d = kids[6 + i], a2 = g.alv[5 + i % 4], b2 = g.cells[6 + i];
          if(st.lungX > 0 && !st.noAir){ t = ramp(st.v, 4.88 + i * 0.05, 5.6); sa(d, 'cx', f1(lerp(p[0], a2[0], t))); sa(d, 'cy', f1(lerp(p[1], a2[1], t))); so(d, f1(st.lungX)); }
          else if(st.bodyX > 0){ t = ramp(st.v, 10.88 + i * 0.05, 11.6); sa(d, 'cx', f1(lerp(b2[0], p[0], t))); sa(d, 'cy', f1(lerp(b2[1], p[1], t))); so(d, f1(st.bodyX)); }
          else so(d, '0');
        }
        for(i = 0; i < g.cells.length; i++) sa(R['cell' + i], 'class', st.v >= 11.4 && !st.lap && (!st.noAir || i < 1) ? 'is-fed' : '');
      },
      tokenRole: function(st){ return st.ox > 0.5 ? 'o2' : 'de'; },
      tokenFill: function(st){ return mix(DE, OX, st.ox); },
      trailFor: function(st){ return st.noAir ? [[0, 13, 'de']] : [[0, 4.95, 'de'], [4.95, 10.95, 'o2'], [10.95, 13, 'de']]; },
      labels: function(st, E){
        var L = E.L, g = geo(L), wide = L.id === 'wide' || E.k >= 0.95, na = st.noAir;
        var out = [
          { key: 'lungs', text: 'Lungs', role: 'air', at: g.lungsAt, side: ['r', 'u', 'd'] },
          { key: 'body', text: 'Body cells', role: 'mus', at: g.bodyAt, side: ['u', 'r', 'l'] }
        ];
        var CUR = [
          ['Right atrium', H('ra', L), 'de'], ['Tricuspid valve', H('tri', L), 'valve'], ['Right ventricle', T(L, [300, 352, 'heart']), 'de'], ['Pulmonary valve', H('pv', L), 'valve'],
          ['Pulmonary artery', this.route.at(4), 'de'], ['Lung capillaries', this.route.at(5), na ? 'de' : 'o2'], ['Left atrium', H('la', L), na ? 'de' : 'o2'], ['Mitral valve', H('mit', L), 'valve'],
          ['Left ventricle', T(L, [422, 352, 'heart']), na ? 'de' : 'o2'], ['Aortic valve', H('av', L), 'valve'], ['Aorta', this.route.at(10), na ? 'de' : 'o2'], ['Body capillaries', this.route.at(11), 'de'], ['Vena cava', this.route.at(12), 'de']
        ], c = CUR[st.k];
        if(wide){
          [['Right atrium', [270, 226], 'de'], ['Right ventricle', [290, 370], 'de'], ['Left atrium', [458, 226], 'o2'], ['Left ventricle', [430, 372], 'o2']].forEach(function(x){
            if(x[0] !== c[0]) out.push({ key: x[0], text: x[0], role: na && x[2] === 'o2' ? 'de' : x[2], at: T(L, [x[1][0], x[1][1], 'heart']), side: ['l', 'r', 'd'] });
          });
        }
        out.push({ key: 'cur', text: c[0], role: c[2], at: c[1], side: ['l', 'r', 'u', 'd'], lead: true, strong: true });
        if(st.lungX > 0.2 && !na) out.push({ key: 'o2', text: 'O₂ in', role: 'o2', at: g.o2At, side: ['l', 'u', 'd'] });
        if(st.bodyX > 0.2) out.push({ key: 'o2b', text: na ? 'Less O₂ out' : 'O₂ out', role: na ? 'bad' : 'o2', at: g.o2bAt, side: ['u', 'r', 'd'] });
        return out;
      },
      words: function(st){
        var na = st.noAir;
        if(st.lap) return na ? [{ t: 'No fresh air', role: 'bad' }, { t: 'heart still pumps', role: 'mus' }, { t: 'body cells got less O₂', say: 'body cells got less oxygen', role: 'bad' }]
          : [{ t: 'Body', role: 'de' }, { t: 'veins', role: 'de' }, { t: 'back to the right atrium', role: 'de' }];
        return [
          [{ t: 'Blood from the body', role: 'de' }, { t: 'right atrium', role: 'de' }],
          [{ t: 'Atrium pressure above ventricle', role: 'de' }, { t: 'tricuspid valve opens', role: 'valve' }],
          [{ t: 'Right ventricle squeezes', role: 'mus' }, { t: 'tricuspid valve shuts', role: 'valve' }, { t: 'blood pushed up', role: 'de' }],
          [{ t: 'Pressure opens the pulmonary valve', role: 'valve' }, { t: 'blood to the lungs', role: 'de' }],
          [{ t: 'Pulmonary artery', role: 'de' }, { t: 'low O₂ blood to the lungs', say: 'low oxygen blood to the lungs', role: 'de' }],
          na ? [{ t: 'No fresh air', role: 'bad' }, { t: 'blood picks up no new O₂', say: 'blood picks up no new oxygen', role: 'de' }]
             : [{ t: 'Air in the alveoli', role: 'air' }, { t: 'O₂ in, CO₂ out', say: 'oxygen in, carbon dioxide out', role: 'o2' }],
          [{ t: 'Pulmonary veins', role: na ? 'de' : 'o2' }, { t: na ? 'low O₂ blood to the left atrium' : 'O₂ rich blood to the left atrium', say: na ? 'low oxygen blood to the left atrium' : 'oxygen rich blood to the left atrium', role: na ? 'de' : 'o2' }],
          [{ t: 'Atrium pressure above ventricle', role: na ? 'de' : 'o2' }, { t: 'mitral valve opens', role: 'valve' }],
          [{ t: 'Left ventricle squeezes', role: 'mus' }, { t: 'mitral valve shuts', role: 'valve' }, { t: 'pressure builds', role: na ? 'de' : 'o2' }],
          [{ t: 'Pressure opens the aortic valve', role: 'valve' }, { t: 'blood into the aorta', role: na ? 'de' : 'o2' }],
          [{ t: 'Aorta and arteries', role: na ? 'de' : 'o2' }, { t: na ? 'low O₂ blood to every organ' : 'O₂ rich blood to every organ', say: na ? 'low oxygen blood to every organ' : 'oxygen rich blood to every organ', role: na ? 'de' : 'o2' }],
          na ? [{ t: 'Less O₂ arrives', say: 'less oxygen arrives', role: 'bad' }, { t: 'body cells get less O₂', say: 'body cells get less oxygen', role: 'bad' }]
             : [{ t: 'Body cells take O₂', say: 'body cells take oxygen', role: 'o2' }, { t: 'blood picks up CO₂', say: 'blood picks up carbon dioxide', role: 'de' }],
          [{ t: 'Veins', role: 'de' }, { t: 'low O₂ blood back to the heart', say: 'low oxygen blood back to the heart', role: 'de' }]
        ][st.k];
      },
      cut: function(b, R, at, cv, E){ var t = geo(E.L).trach; return '<g class="pe-cut"><rect class="pe-plug" x="' + f1(t[0] - 12) + '" y="' + f1(t[1] - 14) + '" width="24" height="30" rx="5"/><path class="pe-cutend" d="M' + f1(t[0] - 16) + ',' + f1(t[1] - 8) + ' l32,18 M' + f1(t[0] + 16) + ',' + f1(t[1] - 8) + ' l-32,18"/></g>'; }
    });
  })();

  /* ------------------------------------------------------------------ 2. Reflex arc: the knee jerk */
  (function(){
    var KNEE = [404, 334];   // the lower leg turns here (leg coordinates)
    function rot(p, a){ var c = Math.cos(a), s = Math.sin(a), x = p[0] - KNEE[0], y = p[1] - KNEE[1]; return [KNEE[0] + x * c - y * s, KNEE[1] + x * s + y * c]; }
    // a seated person in profile, facing right, cut to the lower back and the leg; the cord section enlarged beside it
    var LAY = {
      tall: { w: 600, h: 600, g: { leg: [86, 86, 0.84], cord: [-104, -14, 1] } },
      wide: { w: 1080, h: 540, g: { leg: [120, 0, 1], cord: [185, 14, 1.25] } }
    };
    var J = [360, 186];            // where the two roots join the spinal nerve (cord coordinates)
    var ENTRY = [262, 268];        // where the nerve enters the thigh (leg coordinates)
    function nerve(L){ var a = T(L, [ENTRY[0], ENTRY[1], 'leg']), b = T(L, [J[0], J[1], 'cord']); return bow(a, b, L.id === 'wide' ? -40 : 18, 12); }
    function sens(L){ var n = nerve(L); return TS(L, [[290, 296, 'leg'], [276, 282, 'leg']]).concat(offset(n, -4).slice(1, -1)).concat(TS(L, [[385, 120, 'cord'], [405, 92, 'cord']])); }
    function mot(L){ var n = nerve(L).slice().reverse(); return TS(L, [[458, 206, 'cord'], [392, 198, 'cord']]).concat(offset(n, -4).slice(1, -1)).concat(TS(L, [[264, 266, 'leg'], [226, 296, 'leg']])); }
    // the vertebra at the level of the L2 to L4 cord segments (about T12 and L1; the cord ends near L1 to L2)
    var VERT = [[-74, 40], [-70, 72], [-65, 104], [-61, 136], [-58, 168], [-57, 200], [-59, 232], [-63, 264]];
    var LUM = 3;
    SCENES.push({
      id: 'reflex', tab: 'Reflex arc', short: 'Reflex', path: 'reflex-arc-knee',
      purpose: 'Send the knee jerk signal around the reflex arc',
      cue: 'Drag the signal', token: 'the signal', thing: 'signal',
      layouts: LAY, last: 6,
      segs: function(L){
        return [
          TS(L, [[441, 362, 'leg'], [438, 332, 'leg'], [420, 302, 'leg'], [360, 292, 'leg'], [290, 296, 'leg']]),
          sens(L),
          TS(L, [[405, 92, 'cord'], [440, 93, 'cord'], [465, 96, 'cord'], [494, 116, 'cord'], [503, 150, 'cord'], [505, 172, 'cord']]),
          TS(L, [[505, 172, 'cord'], [516, 186, 'cord'], [482, 204, 'cord'], [458, 206, 'cord']]),
          mot(L),
          TS(L, [[226, 296, 'leg'], [292, 299, 'leg'], [352, 296, 'leg']])
        ];
      },
      // a broken run goes as far as the signal really goes; the cut is drawn just beyond, on the root
      breaks: [
        { id: 'dorsal', stopV: 2.0, cutMin: 2.2, cutMax: 2.7, place: function(L){ return T(L, [440, 93, 'cord']); }, off: [0, -1], tag: 'Cut', label: 'Cut', aria: 'Cut the dorsal root', name: 'Dorsal root cut', step: 2 },
        { id: 'ventral', stopV: 3.55, cutMin: 3.6, cutMax: 4.2, place: function(L){ return T(L, [470, 205, 'cord']); }, off: [0, 1], tag: 'Cut', label: 'Cut', aria: 'Cut the ventral root', name: 'Ventral root cut', step: 4 }
      ],
      take: 'Receptor, sensory neuron, synapse, motor neuron, effector.',
      art: function(E){
        var L = E.L, s = '';
        s += '<defs><linearGradient id="pe-skin" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F6DCC8"/><stop offset="1" stop-color="#E8BFA4"/></linearGradient>' +
          '<linearGradient id="pe-skinH" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#E3B497"/><stop offset="0.45" stop-color="#F4D6C1"/><stop offset="1" stop-color="#EAC3A8"/></linearGradient>' +
          '<linearGradient id="pe-mus" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#D86A57"/><stop offset="1" stop-color="#A9402F"/></linearGradient>' +
          '<linearGradient id="pe-shirt" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#5E7894"/><stop offset="0.6" stop-color="#8AA1BA"/><stop offset="1" stop-color="#6F87A2"/></linearGradient>' +
          '<linearGradient id="pe-shorts" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4C5870"/><stop offset="1" stop-color="#394459"/></linearGradient>' +
          '<radialGradient id="pe-wm" cx="0.45" cy="0.4" r="0.7"><stop offset="0" stop-color="#FFFDF7"/><stop offset="1" stop-color="#EDE2CF"/></radialGradient>' +
          '<radialGradient id="pe-gm" cx="0.5" cy="0.5" r="0.6"><stop offset="0" stop-color="#E9C9CF"/><stop offset="1" stop-color="#D5A7B0"/></radialGradient></defs>';
        s += '<rect class="pe-bg" x="-400" y="0" width="' + (L.w + 800) + '" height="' + L.h + '"/>';
        var leg = '';
        // the chair
        leg += '<path class="pe-chair" d="M-600,404 H352 a10,10 0 0 1 0,20 H-600 Z"/><path class="pe-chair-leg" d="M300,424 V640 M-60,424 V640"/>';
        leg += '<path class="pe-chairback" d="M-138,404 C-146,300 -150,160 -146,-120 L-120,-120 C-124,160 -120,300 -112,404 Z"/>';
        // the lower leg (turns at the knee; its top is round about the knee so it turns cleanly), with the shin bone
        leg += '<g data-r="leg"><path class="pe-skin" d="M360,334 A44,44 0 0 1 448,334 C450,410 448,460 452,494 C470,496 500,500 528,512 C538,520 534,534 520,534 L400,534 C380,532 374,520 372,500 C368,470 362,420 360,334 Z"/>' +
          '<path class="pe-sole" d="M400,534 L520,534 C534,534 538,524 534,516"/><path class="pe-bone" d="M382,350 C380,420 384,470 388,494 L408,494 C410,470 414,420 418,350 Z"/></g>';
        // the trunk in profile: the back curves (upper back out, lower back in, buttock out), the belly in front
        leg += '<path class="pe-skinT" d="M-100,-130 C-90,-40 -86,40 -84,110 C-82,170 -78,210 -84,250 C-92,290 -114,320 -114,356 C-114,388 -96,404 -60,404 L130,404 L130,262 C116,230 112,180 106,120 C100,40 94,-40 90,-130 Z"/>';
        leg += '<path class="pe-shirt" d="M-100,-130 C-90,-40 -86,40 -84,110 C-82,170 -78,210 -84,250 C-86,262 -90,274 -94,286 L124,284 C118,262 114,230 110,180 C104,100 96,0 90,-130 Z"/>';
        leg += '<path class="pe-fold" d="M-80,236 C-30,250 50,250 112,236"/>';
        // the near arm: the upper arm down the side, the forearm forward, the hand resting on the thigh
        var arm = '<path class="pe-skinT" d="M-30,-130 C-26,-40 -6,80 14,150 C22,174 46,176 54,154 C40,90 34,-20 36,-130 Z"/>' +
          '<path class="pe-skinT" d="M18,150 C40,190 80,226 112,246 C122,252 132,242 126,232 C98,210 68,182 52,148 Z"/>' +
          '<path class="pe-hand" d="M106,240 C120,230 148,232 160,244 C168,254 156,264 140,262 C126,262 112,256 106,248 Z"/><path class="pe-fingers" d="M142,248 h14 M140,254 h14"/>' +
          '<path class="pe-sleeve" d="M-36,-130 C-34,-80 -28,-40 -24,-16 L40,-20 C38,-60 38,-100 40,-130 Z"/>';
        // the thigh (skin), the femur and the quadriceps under it; shorts at the hip
        leg += '<path class="pe-skin" d="M-40,262 C120,252 300,258 392,266 C434,270 454,300 452,334 C450,366 420,392 384,396 C250,400 120,404 -40,404 Z"/>';
        leg += '<path class="pe-shorts" d="M-94,280 L124,270 C150,266 176,268 190,272 L196,402 L-60,404 C-96,404 -114,388 -114,356 C-114,320 -100,300 -94,280 Z"/>';
        leg += '<path class="pe-bone" d="M150,346 C220,340 300,338 376,336 C400,326 420,334 422,350 C420,368 398,372 380,362 C300,360 220,364 150,364 Z"/>';
        leg += '<g data-r="quad"><path class="pe-mus" data-r="quadm" d="M110,276 C180,268 300,270 392,282 C410,288 418,300 414,312 C380,318 300,320 220,322 C170,323 130,322 110,320 Z"/>';
        for(var i = 0; i < 7; i++){ var x = 130 + i * 38; leg += '<path class="pe-stria" d="M' + x + ',' + (277 - i * 0.3) + ' C' + (x + 12) + ',292 ' + (x + 8) + ',306 ' + (x + 18) + ',318"/>'; }
        leg += '</g>';
        // a window in the lower back: the vertebrae and discs, with the one at the level of the arc's cord segments
        leg += '<path class="pe-backwin" d="M-100,24 C-86,18 -52,18 -38,24 L-38,290 C-52,296 -86,296 -100,290 Z"/>';
        VERT.forEach(function(v0, i){ leg += '<path class="pe-vert' + (i === LUM ? ' is-lum' : '') + '" d="M' + v0[0] + ',' + v0[1] + ' h28 a5,5 0 0 1 5,5 v14 a5,5 0 0 1 -5,5 h-28 a5,5 0 0 1 -5,-5 v-14 a5,5 0 0 1 5,-5 Z"/><path class="pe-spinous" d="M' + (v0[0] - 5) + ',' + (v0[1] + 12) + ' l-12,4"/>' + (i < VERT.length - 1 ? '<path class="pe-disc" d="M' + (v0[0] + 2) + ',' + (v0[1] + 28) + ' h24"/>' : ''); });
        leg += arm;
        // muscle spindle and its sensory ending
        leg += '<g data-r="spindle"><ellipse class="pe-spindle" cx="300" cy="298" rx="30" ry="7"/><path class="pe-anulo" data-r="anulo" d="M286,298 c2,-7 4,7 6,0 c2,-7 4,7 6,0 c2,-7 4,7 6,0 c2,-7 4,7 6,0"/></g>';
        leg += '<path class="pe-tendon" d="M392,286 C412,292 428,302 436,314"/>';
        leg += '<path class="pe-lig" data-r="lig" d="M438,334 C442,350 440,368 432,392"/>';
        leg += '<ellipse class="pe-patella" data-r="pat" cx="438" cy="320" rx="12" ry="18"/>';
        // nerve endings on the muscle (the motor neuron's junction)
        leg += '<path class="pe-eff" d="M226,296 l-12,8 M226,296 l-4,12 M226,296 l10,10"/>';
        leg += '<g data-r="hammer"><path class="pe-ham-h" d="M478,370 L548,500"/><path class="pe-ham" d="M448,368 L494,346 L500,380 Z"/></g>';
        s += G(L, 'leg', leg);
        // zoom lines from the vertebra to the cord section
        var v0 = VERT[LUM], za = T(L, [v0[0] + 30, v0[1] + 2, 'leg']), zb = T(L, [v0[0] + 30, v0[1] + 22, 'leg']), ca = T(L, [470, 84, 'cord']), cb = T(L, [470, 216, 'cord']);
        s += '<path class="pe-zoom" d="M' + f1(za[0]) + ',' + f1(za[1]) + ' L' + f1(ca[0]) + ',' + f1(ca[1]) + ' M' + f1(zb[0]) + ',' + f1(zb[1]) + ' L' + f1(cb[0]) + ',' + f1(cb[1]) + '"/>';
        // the spinal nerve (both neurons in one sheath) from the cord's roots to the thigh
        var n = nerve(L);
        s += '<path class="pe-sheath" d="' + P(n) + '"/>';
        s += G(L, 'cord', '<ellipse class="pe-wm" cx="532" cy="150" rx="104" ry="78"/>' +
          '<path class="pe-gm" d="M532,118 C520,96 498,84 484,92 C478,104 494,118 508,128 C504,140 496,152 486,166 C474,184 486,204 508,202 C522,198 528,186 532,176 C536,186 542,198 556,202 C578,204 590,184 578,166 C568,152 560,140 556,128 C570,118 586,104 580,92 C566,84 544,96 532,118 Z"/>' +
          '<circle class="pe-canal" cx="532" cy="152" r="4"/>' +
          '<path class="pe-root" d="' + P([[352, 184], [384, 124], [405, 92], [440, 93], [470, 98]]) + '"/><path class="pe-root" d="' + P([[352, 188], [392, 198], [458, 206], [486, 202]]) + '"/>' +
          '<ellipse class="pe-drg" cx="405" cy="92" rx="20" ry="13"/>');
        // the two neurons, drawn whole, through the nerve
        s += '<path class="pe-aff" d="' + P(sens(L).concat(TS(L, [[440, 93, 'cord'], [465, 96, 'cord'], [494, 116, 'cord'], [503, 150, 'cord'], [505, 172, 'cord']]))) + '"/>';
        s += '<path class="pe-eff" d="' + P(TS(L, [[516, 186, 'cord'], [482, 204, 'cord']]).concat(mot(L))) + '"/>';
        s += G(L, 'cord', '<circle class="pe-aff-soma" cx="405" cy="92" r="6.5"/><path class="pe-eff-soma" d="M516,186 l-9,-11 l13,2 l6,-9 l3,13 l11,4 l-12,6 l-1,10 l-8,-8 Z"/><g data-r="syn"><circle class="pe-syn" cx="505" cy="172" r="5"/></g>');
        s += '<g data-r="cuts"></g>';
        return s;
      },
      state: function(v, br){
        var st = { v: v, k: Math.min(6, Math.floor(v + 0.12)), stop: null };
        if(v >= 5.71 && v < 5.88) st.k = 6;   // the kick's words come as the kick starts
        if(br && v >= Math.min(br.stopV - 0.01, br.step - 0.12)) st.stop = br;
        st.kick = br ? 0 : ramp(v, 5.69, 6);
        st.squeeze = br ? 0 : ramp(v, 5.5, 5.8);
        st.stretch = 1 - ramp(v, 0.88, 1.3);
        st.fire = bump(v, 0.7, 0.88, 1.88, 2.1);
        st.synOn = br && br.id === 'dorsal' ? 0 : bump(v, 2.7, 2.88, 3.88, 4.1);
        st.hit = 1 - ramp(v, 0, 0.45);
        return st;
      },
      paint: function(R, st, E){
        var a = -st.kick * 28 * Math.PI / 180;
        sa(R.leg, 'transform', 'rotate(' + f1(a * 180 / Math.PI) + ' ' + KNEE[0] + ' ' + KNEE[1] + ')');
        var p0 = [438, 336], p1 = rot([432, 392], a);
        sa(R.lig, 'd', 'M' + f1(p0[0]) + ',' + f1(p0[1]) + ' C' + f1(p0[0] + 4 - st.hit * 7) + ',' + f1(p0[1] + 18) + ' ' + f1(p1[0] + 8 - st.hit * 9) + ',' + f1(p1[1] - 22) + ' ' + f1(p1[0]) + ',' + f1(p1[1]));
        sa(R.pat, 'cx', f1(438 + st.kick * 3)); sa(R.pat, 'cy', f1(320 - st.kick * 6));
        var hb = 1 - st.hit;
        sa(R.hammer, 'transform', 'translate(' + f1(hb * 36) + ',' + f1(hb * 30) + ') rotate(' + f1(hb * 26) + ' 548 500)');
        sa(R.quadm, 'class', 'pe-mus' + (st.squeeze > 0.5 ? ' is-on' : ''));
        // the stretch lengthens the muscle a little; the contraction shortens and thickens it (both from the hip end)
        var sx = 1 - st.squeeze * 0.06 + st.stretch * 0.025, sy = 1 + st.squeeze * 0.16 - st.stretch * 0.05;
        sa(R.quad, 'transform', sx !== 1 || sy !== 1 ? 'translate(110,297) scale(' + sx.toFixed(3) + ',' + sy.toFixed(3) + ') translate(-110,-297)' : '');
        sa(R.anulo, 'class', 'pe-anulo' + (st.fire > 0.3 ? ' is-on' : ''));
        sa(R.spindle, 'transform', st.stretch ? 'translate(300,298) scale(' + (1 + st.stretch * 0.1).toFixed(3) + ',' + (1 - st.stretch * 0.15).toFixed(3) + ') translate(-300,-298)' : '');
        sa(R.syn, 'class', st.synOn > 0.3 ? 'is-on' : '');
      },
      // the tap stretches the muscle (muscle colour); the sensory neuron starts at the spindle
      trail: [[0, 1, 'mus'], [1, 3, 'aff'], [3, 6, 'eff']],
      labels: function(st, E){
        var L = E.L, out = [
          { key: 'quad', text: 'Quadriceps', role: 'mus', at: T(L, [190, 282, 'leg']), side: ['u', 'd'] },
          { key: 'cord', text: 'Spinal cord', role: 'cord', at: T(L, [575, 76, 'cord']), side: ['u', 'r', 'd'] },
          { key: 'sens', text: 'Sensory neuron', role: 'aff', at: sens(L)[4], side: ['ul', 'l', 'u'], lead: true },
          { key: 'mot', text: 'Motor neuron', role: 'eff', at: mot(L)[mot(L).length - 5], side: ['dr', 'd', 'r'], lead: true }
        ];
        var cur = [
          { text: 'Tap', at: [446, 368, 'leg'], role: 'cord', side: ['r', 'd'] },
          { text: 'Muscle spindle', at: [300, 298, 'leg'], role: 'aff', side: ['d', 'u'] },
          { text: 'Dorsal root', at: [430, 92, 'cord'], role: 'aff', side: ['u', 'ul'] },
          { text: 'Synapse', at: [505, 172, 'cord'], role: 'cord', side: ['r', 'd'] },
          { text: 'Ventral root', at: [462, 206, 'cord'], role: 'eff', side: ['d', 'dr'] },
          { text: 'Neuromuscular junction', at: [226, 296, 'leg'], role: 'eff', side: ['d', 'dr', 'dl'] },
          { text: 'Knee straightens', at: [470, 470, 'leg'], role: 'mus', side: ['r', 'u'] }
        ][st.k];
        // a stopped run names where the signal is (its last real step), not the step it never reaches
        if(st.stop) cur = st.stop.id === 'dorsal' ? { text: 'Dorsal root ganglion', at: [405, 92, 'cord'], role: 'aff', side: ['u', 'l'] } : { text: 'Motor neuron', at: [505, 194, 'cord'], role: 'eff', side: ['d', 'r'] };
        if(cur && !(st.k === 6 && st.kick < 0.9 && !st.stop)) out.push({ key: 'cur', text: cur.text, role: cur.role, at: T(L, cur.at), side: cur.side, lead: true, strong: true });
        if(st.stop && st.stop.id === 'ventral') out = out.filter(function(x){ return x.key !== 'mot'; });
        if(st.stop) out.push({ key: 'fail', text: 'No kick', role: 'bad', at: T(L, [470, 470, 'leg']), side: ['r', 'u'], strong: true });
        return out;
      },
      words: function(st){
        if(st.stop){
          return st.stop.id === 'dorsal' ? [{ t: 'Dorsal root cut', role: 'bad' }, { t: 'signal never reaches the cord', role: 'aff' }, { t: 'no kick', role: 'bad' }]
            : [{ t: 'Motor neuron fires', role: 'eff' }, { t: 'ventral root cut', role: 'bad' }, { t: 'no kick', role: 'bad' }];
        }
        return [
          [{ t: 'Tap stretches the tendon', role: 'cord' }, { t: 'quadriceps stretched', role: 'mus' }],
          [{ t: 'Stretch', role: 'mus' }, { t: 'muscle spindle', role: 'aff' }, { t: 'sensory neuron fires', role: 'aff' }],
          [{ t: 'Sensory neuron', role: 'aff' }, { t: 'dorsal root', role: 'aff' }, { t: 'into the cord', role: 'cord' }],
          [{ t: 'Glutamate', role: 'aff' }, { t: 'one synapse', role: 'cord' }, { t: 'motor neuron', role: 'eff' }],
          [{ t: 'Motor neuron fires', role: 'eff' }, { t: 'out the ventral root', role: 'eff' }],
          [{ t: 'Acetylcholine', role: 'eff' }, { t: 'muscle fibers fire', role: 'mus' }],
          [{ t: 'Quadriceps contracts', role: 'mus' }, { t: 'knee straightens', role: 'mus' }]
        ][st.k];
      },
      cut: function(b, R, at, cv){
        var p = at(cv), q = at(cv + 0.03), ang = Math.atan2(q[1] - p[1], q[0] - p[0]), c = Math.cos(ang), s = Math.sin(ang), g = 7;
        return '<g class="pe-cut"><path class="pe-cutgap" d="M' + f1(p[0] - c * g) + ',' + f1(p[1] - s * g) + 'L' + f1(p[0] + c * g) + ',' + f1(p[1] + s * g) + '"/>' +
          '<path class="pe-cutend" d="M' + f1(p[0] - c * g - s * 9) + ',' + f1(p[1] - s * g + c * 9) + 'L' + f1(p[0] - c * g + s * 9) + ',' + f1(p[1] - s * g - c * 9) + 'M' + f1(p[0] + c * g - s * 9) + ',' + f1(p[1] + s * g + c * 9) + 'L' + f1(p[0] + c * g + s * 9) + ',' + f1(p[1] + s * g - c * 9) + '"/></g>';
      },
      cutAt: function(b){ return b; },
      tokenRole: function(st){ return st.v < 1 ? 'mus' : st.v < 3 ? 'aff' : 'eff'; }
    });
  })();

  /* ------------------------------------------------------------------ 3. Hormones: the stress axis (HPA) */
  (function(){
    // the hypothalamus and pituitary in a magnifier (mag coordinates, centre 215,235, radius 195), beside a person cut
    // at the hips (person coordinates, the head's centre at 0,0); one blood vessel joins them
    var C = [215, 235], RAD = 195;
    var LAY = {
      tall: { w: 600, h: 600, g: { mag: [-2.8, -4, 0.92], person: [494, 100, 0.95] } },
      wide: { w: 1080, h: 540, g: { mag: [42.75, 0, 1.15], person: [830, 74, 1] } }
    };
    var EDGE = [400, 300];                              // where the vessel leaves the magnifier (mag)
    function gap(L){ return bow(T(L, [EDGE[0], EDGE[1], 'mag']), T(L, [0, 92, 'person']), L.id === 'wide' ? -20 : -14, 8); }
    function role(v){ return v < 0.8 ? 'aff' : v < 2.85 ? 'crh' : v < 3.9 ? 'acth' : 'cort'; }
    var SPOTS = [[232, 290], [240, 306], [236, 318], [248, 300], [228, 300], [246, 316]];   // CRH in the portal veins (mag)
    SCENES.push({
      id: 'hormone', tab: 'Hormones', short: 'Hormones', path: 'hpa-axis',
      purpose: 'Follow stress from the brain to cortisol and back',
      cue: 'Drag the signal', token: 'the signal', thing: 'signal',
      layouts: LAY, last: 6,
      segs: function(L){
        var g = gap(L), down = TS(L, [[0, 120, 'person'], [0, 240, 'person'], [-12, 256, 'person'], [-28, 256, 'person']]);
        return [
          TS(L, [[120, 120, 'mag'], [160, 160, 'mag'], [184, 190, 'mag'], [206, 232, 'mag'], [215, 262, 'mag']]),
          TS(L, [[215, 262, 'mag'], [230, 290, 'mag'], [244, 318, 'mag']]),
          TS(L, [[244, 318, 'mag'], [256, 338, 'mag'], [270, 360, 'mag']]),
          TS(L, [[270, 360, 'mag'], [320, 382, 'mag'], [368, 350, 'mag'], [EDGE[0], EDGE[1], 'mag']]).concat(g.slice(1)).concat(down),
          TS(L, [[-28, 256, 'person'], [-12, 252, 'person'], [0, 224, 'person'], [-14, 178, 'person'], [-30, 170, 'person']]),
          TS(L, [[-30, 170, 'person'], [-10, 172, 'person'], [0, 150, 'person'], [0, 120, 'person']]).concat(g.slice().reverse().slice(1)).concat(TS(L, [[380, 316, 'mag'], [340, 262, 'mag'], [300, 224, 'mag']]))
        ];
      },
      breaks: [
        { id: 'pit', stopV: 2.3, place: function(L){ return L.id === 'wide' ? T(L, [146, 392, 'mag']) : T(L, [196, 434, 'mag']); }, off: function(L){ return L.id === 'wide' ? [-1, 0] : [0, 1]; }, tag: 'Damaged', label: 'Damage', aria: 'Damage the pituitary gland', name: 'Pituitary damaged', step: 3, mark: function(L){ return T(L, [275, 372, 'mag']); } },
        { id: 'adr', stopV: 3.88, place: function(L){ return L.id === 'wide' ? T(L, [-74, 258, 'person']) : T(L, [-30, 326, 'person']); }, off: function(L){ return L.id === 'wide' ? [-1, 0] : [0, 1]; }, tag: 'Damaged', label: 'Damage', aria: 'Damage the adrenal cortex', name: 'Adrenal cortex damaged', step: 4, mark: function(L){ return T(L, [-30, 252, 'person']); } }
      ],
      take: 'Three glands in a chain, braked by cortisol’s feedback.',
      art: function(E){
        var L = E.L, s = '<defs><radialGradient id="pe-brain" cx="0.45" cy="0.3" r="0.8"><stop offset="0" stop-color="#F3DCD8"/><stop offset="1" stop-color="#DDB0AC"/></radialGradient>' +
          '<radialGradient id="pe-face" cx="0.45" cy="0.4" r="0.7"><stop offset="0" stop-color="#F8DFCC"/><stop offset="1" stop-color="#E3B596"/></radialGradient>' +
          '<linearGradient id="pe-skin2" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#E0AD8E"/><stop offset="0.5" stop-color="#F4D4BE"/><stop offset="1" stop-color="#DDA888"/></linearGradient>' +
          '<linearGradient id="pe-shirt2" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#3F6A51"/><stop offset="0.35" stop-color="#5F927A"/><stop offset="0.7" stop-color="#5A8C73"/><stop offset="1" stop-color="#3F6A51"/></linearGradient>' +
          '<linearGradient id="pe-pants2" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#4A556B"/><stop offset="0.5" stop-color="#5E6A82"/><stop offset="1" stop-color="#4A556B"/></linearGradient>' +
          '<radialGradient id="pe-liver" cx="0.4" cy="0.35" r="0.8"><stop offset="0" stop-color="#B5574A"/><stop offset="1" stop-color="#7E2F26"/></radialGradient>' +
          '<clipPath id="pe-mag"><circle cx="' + C[0] + '" cy="' + C[1] + '" r="' + RAD + '"/></clipPath></defs>';
        s += '<rect class="pe-bg" x="-400" y="0" width="' + (L.w + 800) + '" height="' + L.h + '"/>';
        // the person: arms, trunk in a shirt, trousers, neck and head with a face
        var p = '';
        p += '<path class="pe-pants2" d="M-74,392 C-60,388 60,388 74,392 L84,520 L10,520 L0,440 L-10,520 L-84,520 Z"/>';
        p += '<path class="pe-skin2" d="M-104,196 C-112,250 -116,300 -112,346 C-110,366 -100,378 -90,376 C-84,350 -84,300 -82,250 Z M104,196 C112,250 116,300 112,346 C110,366 100,378 90,376 C84,350 84,300 82,250 Z"/>';
        p += '<path class="pe-hand" d="M-112,346 C-122,356 -120,380 -104,388 C-92,392 -84,382 -88,368 C-90,358 -96,352 -100,350 Z M112,346 C122,356 120,380 104,388 C92,392 84,382 88,368 C90,358 96,352 100,350 Z"/>';
        p += '<path class="pe-shirt2" d="M-18,82 C-50,88 -84,98 -98,118 C-110,140 -112,180 -108,210 L-80,214 L-78,196 C-80,260 -78,340 -74,400 L74,400 C78,340 80,260 78,196 L80,214 L108,210 C112,180 110,140 98,118 C84,98 50,88 18,82 Z"/>';
        p += '<path class="pe-fold2" d="M-78,214 C-70,230 -72,250 -76,262 M78,214 C70,230 72,250 76,262 M-40,382 C-10,388 20,388 44,382"/>';
        p += '<path class="pe-skin2" d="M-16,40 L-16,88 C-8,96 8,96 16,88 L16,40 Z"/>';
        p += '<path class="pe-collar" d="M-20,84 C-10,100 10,100 20,84"/>';
        p += '<ellipse class="pe-ear" cx="-42" cy="4" rx="8" ry="13"/><ellipse class="pe-ear" cx="42" cy="4" rx="8" ry="13"/>';
        p += '<ellipse class="pe-head" cx="0" cy="0" rx="42" ry="52"/>';
        p += '<path class="pe-hair" d="M-44,-4 C-48,-44 -22,-60 2,-58 C30,-56 50,-38 44,-4 C38,-24 22,-34 4,-34 C-16,-34 -34,-24 -44,-4 Z"/>';
        p += '<path class="pe-brow" d="M-24,-10 q9,-5 17,0 M7,-10 q9,-5 17,0"/><ellipse class="pe-eye" cx="-15" cy="0" rx="4" ry="4.6"/><ellipse class="pe-eye" cx="15" cy="0" rx="4" ry="4.6"/>';
        p += '<path class="pe-nose" d="M0,4 C-3,14 -6,20 -1,23 C2,24 5,23 6,21"/><path class="pe-mouth" d="M-12,34 C-6,31 6,31 12,34"/>';
        p += '<circle class="pe-pitdot" cx="0" cy="8" r="6"/>';
        // the window into the trunk: liver, kidneys and adrenal glands, the main vessel
        p += '<path class="pe-win" d="M-62,134 C-30,124 30,124 62,134 L62,334 C30,342 -30,342 -62,334 Z"/>';
        p += '<path class="pe-liverS" data-r="liver" d="M-58,160 C-44,146 4,144 30,152 C42,158 36,180 18,186 C-10,194 -40,192 -52,186 C-64,178 -66,166 -58,160 Z"/>';
        p += '<path class="pe-kid" d="M-46,270 C-52,290 -46,316 -30,320 C-16,322 -10,298 -12,280 C-14,264 -26,256 -34,258 Z"/><path class="pe-kid" d="M46,270 C52,290 46,316 30,320 C16,322 10,298 12,280 C14,264 26,256 34,258 Z"/>';
        p += '<g data-r="adr"><path class="pe-adr" d="M-46,258 C-44,240 -30,234 -16,242 C-10,248 -12,260 -22,264 C-32,268 -44,266 -46,258 Z"/><path class="pe-adrm" d="M-36,254 C-34,246 -26,245 -22,250 C-20,254 -24,258 -30,258 C-33,258 -36,256 -36,254 Z"/>' +
          '<path class="pe-adr" d="M46,258 C44,240 30,234 16,242 C10,248 12,260 22,264 C32,268 44,266 46,258 Z"/></g>';
        p += '<path class="pe-bv" d="' + P([[0, 92], [0, 240], [-12, 256], [-24, 256]]) + '"/><path class="pe-bv" d="' + P([[0, 150], [-10, 172], [-26, 170]]) + '"/>';
        s += G(L, 'person', p);
        // zoom lines from the pituitary in the head to the magnifier, then the one vessel between them
        var hd = T(L, [0, 8, 'person']), za = T(L, [215, 40, 'mag']), zb = T(L, [330, 395, 'mag']);
        s += '<path class="pe-zoom" d="M' + f1(hd[0]) + ',' + f1(hd[1]) + ' L' + f1(za[0]) + ',' + f1(za[1]) + ' M' + f1(hd[0]) + ',' + f1(hd[1]) + ' L' + f1(zb[0]) + ',' + f1(zb[1]) + '"/>';
        s += '<path class="pe-bv" d="' + P(gap(L)) + '"/>';
        var m = '<circle class="pe-magbg" cx="' + C[0] + '" cy="' + C[1] + '" r="' + RAD + '"/><g clip-path="url(#pe-mag)">';
        m += '<path class="pe-brain" d="M0,0 H430 V218 C380,236 320,246 270,250 C240,252 226,256 215,262 C204,256 190,252 160,250 C110,246 50,236 0,218 Z"/>';
        m += '<path class="pe-gyri" d="M60,90 c20,-14 30,10 50,-2 M90,150 c22,-10 34,12 56,0 M300,90 c16,12 36,4 48,18 M320,160 c18,-8 28,8 46,0"/>';
        m += '<path class="pe-vent" d="M208,120 C204,150 206,180 212,206 C218,180 222,150 218,120 Z"/>';
        m += '<path class="pe-hypo" data-r="hypo" d="M150,186 C170,168 260,168 282,186 C292,206 270,236 240,246 C226,250 204,250 190,246 C160,236 140,206 150,186 Z"/>';
        [[176, 196], [214, 184], [254, 198]].forEach(function(n){ m += '<path class="pe-crhn" d="M' + n[0] + ',' + n[1] + ' C' + n[0] + ',' + (n[1] + 30) + ' 214,236 215,258"/><circle class="pe-crhs" cx="' + n[0] + '" cy="' + n[1] + '" r="8"/>'; });
        // the stalk runs down into the posterior lobe; the portal veins run down its front into the anterior lobe
        m += '<path class="pe-sella" d="M90,360 C100,430 150,446 222,446 C292,446 336,430 346,360"/>';
        m += '<g data-r="pit"><path class="pe-stalk" d="M196,256 C196,286 190,312 186,340 L222,340 C224,312 230,286 234,256 Z"/>' +
          '<ellipse class="pe-pitp" cx="196" cy="378" rx="42" ry="38"/><ellipse class="pe-pita" data-r="pita" cx="276" cy="372" rx="62" ry="46"/>' +
          '<circle class="pe-cortico" cx="262" cy="362" r="6"/><circle class="pe-cortico" cx="286" cy="384" r="6"/><circle class="pe-cortico" cx="300" cy="358" r="6"/></g>';
        m += '<path class="pe-plex" d="M200,262 c6,-8 12,8 18,0 c6,-8 12,8 18,0"/>';
        m += '<path class="pe-portal" d="M232,266 C238,290 246,316 258,340 M224,268 C230,294 238,320 250,344"/>';
        m += '<path class="pe-bv" d="' + P([[270, 360], [320, 382], [368, 350], [430, 286]]) + '"/><path class="pe-bv is-thin" d="' + P([[380, 316], [340, 262], [300, 224], [258, 214]]) + '"/>';
        m += '</g><circle class="pe-magring" cx="' + C[0] + '" cy="' + C[1] + '" r="' + RAD + '"/>';
        s += G(L, 'mag', m);
        s += '<g data-r="mol"></g><g data-r="brk"></g><g data-r="cuts"></g>';
        return s;
      },
      fxInit: function(fx, R, E){
        var L = E.L, h = '';
        for(var i = 0; i < 6; i++) h += '<circle class="pe-mol is-crh" r="5.5" cx="-50" cy="-50"/>';
        for(i = 0; i < 6; i++) h += '<rect class="pe-mol is-acth" width="10" height="10" rx="2" x="-50" y="-50"/>';
        for(i = 0; i < 5; i++) h += '<path class="pe-mol is-glu" d="M0,-6 L5.2,-3 L5.2,3 L0,6 L-5.2,3 L-5.2,-3 Z" transform="translate(-50,-50)"/>';
        R.mol.innerHTML = h;
        var b1 = T(L, [292, 214, 'mag']), b2 = T(L, [352, 340, 'mag']);
        R.brk.innerHTML = '<g class="pe-brake"><circle cx="' + f1(b1[0]) + '" cy="' + f1(b1[1]) + '" r="13"/><path d="M' + f1(b1[0] - 7) + ',' + f1(b1[1]) + ' h14"/></g><g class="pe-brake"><circle cx="' + f1(b2[0]) + '" cy="' + f1(b2[1]) + '" r="13"/><path d="M' + f1(b2[0] - 7) + ',' + f1(b2[1]) + ' h14"/></g>';
        R.b1 = R.brk.childNodes[0]; R.b2 = R.brk.childNodes[1];
      },
      state: function(v, br){
        var st = { v: v, k: Math.min(6, Math.floor(v + 0.12)), stop: null };
        var s0 = br ? Math.min(br.stopV - 0.01, br.step - 0.12) : 0;
        if(br && v >= s0) st.stop = br;
        var pit = br && br.id === 'pit', adr = br && br.id === 'adr';
        st.crh = ramp(v, 0.6, 0.88);
        st.crhDown = ramp(v, 1.0, 2.2);
        st.acth = pit ? 0 : ramp(v, 2.6, 2.88);
        st.cort = adr || pit ? 0 : ramp(v, 3.6, 3.88);
        st.glu = adr || pit ? 0 : ramp(v, 4.6, 4.88);
        st.brake = adr || pit ? 0 : ramp(v, 5.6, 5.88);
        st.pile = st.stop ? ramp(v, s0 - 0.3, s0) : 0;
        st.pit = pit; st.adr = adr;
        return st;
      },
      paint: function(R, st, E){
        var L = E.L, kids = R.mol.childNodes, i;
        for(i = 0; i < 6; i++){
          var c = kids[i], on = i < 3 ? st.crh * (1 - st.brake * 0.6) : st.pit ? st.pile : 0, sp = SPOTS[i], t = i < 3 ? st.crhDown : 1;
          var q = T(L, [lerp(210 + i * 4, sp[0], t), lerp(262, sp[1], t), 'mag']);
          sa(c, 'cx', f1(q[0])); sa(c, 'cy', f1(q[1])); so(c, f1(on));
        }
        var gp = gap(L);
        for(i = 0; i < 6; i++){
          var a = kids[6 + i], b = i < 3 ? gp[2 + i * 2] : gp[3 + (i - 3) * 2], onA = i < 3 ? st.acth * (1 - st.brake * 0.6) : st.adr ? st.pile : 0;
          sa(a, 'x', f1(b[0] - 5)); sa(a, 'y', f1(b[1] - 9)); so(a, f1(onA));
        }
        for(i = 0; i < 5; i++){
          var gq = T(L, [-50 + i * 18, 200 + (i % 2) * 8 + st.glu * 6, 'person']);
          sa(kids[12 + i], 'transform', 'translate(' + f1(gq[0]) + ',' + f1(gq[1]) + ')'); so(kids[12 + i], f1(st.glu));
        }
        sa(R.hypo, 'class', 'pe-hypo' + (st.crh > 0.3 && st.brake < 0.5 ? ' is-on' : ''));
        sa(R.pita, 'class', 'pe-pita' + (st.pit ? ' is-dead' : st.acth > 0.3 && st.brake < 0.5 ? ' is-on' : ''));
        sa(R.adr, 'class', st.adr ? 'is-dead' : st.cort > 0.3 ? 'is-on' : '');
        sa(R.liver, 'class', 'pe-liverS' + (st.glu > 0.4 ? ' is-on' : ''));
        so(R.b1, f1(st.brake)); so(R.b2, f1(st.brake));
      },
      cut: function(){ return ''; },
      tokenRole: function(st){ return role(st.v); },
      trailFor: function(st){ return [[0, 0.8, 'aff'], [0.8, 2.85, 'crh'], [2.85, 3.9, 'acth'], [3.9, 6, 'cort']]; },
      labels: function(st, E){
        var L = E.L, out = [
          { key: 'hypo', text: 'Hypothalamus', role: 'crh', at: T(L, [150, 200, 'mag']), side: ['l', 'ul', 'u'], lead: true },
          { key: 'pit', text: 'Pituitary', role: 'acth', at: T(L, [276, 416, 'mag']), side: ['d', 'dr', 'dl'], lead: true },
          { key: 'adr', text: 'Adrenal cortex', role: 'cort', at: T(L, [36, 248, 'person']), side: ['r', 'dr', 'ur'], lead: true },
          { key: 'liver', text: 'Liver', role: 'glu', at: T(L, [30, 168, 'person']), side: ['r', 'ur', 'u'], lead: true }
        ];
        // the strong label names what the token is now: the hormone it carries
        var name = st.v < 0.8 ? 'Stress' : st.v < 2.85 ? 'CRH' : st.v < 3.9 ? 'ACTH' : 'Cortisol', rl = role(st.v);
        if(st.k === 6 && st.brake >= 0.5) name = 'Cortisol brakes';
        if(st.stop){ name = st.stop.id === 'pit' ? 'CRH' : 'ACTH'; rl = st.stop.id === 'pit' ? 'crh' : 'acth'; }
        if(!(st.k === 6 && st.brake < 0.5 && !st.stop)) out.push({ key: 'cur', text: name, role: rl, at: this.route.at(st.v), side: ['r', 'u', 'd', 'l'], strong: true });
        // glucose stays at the liver, where it is released
        if(st.glu >= 0.5) out.push({ key: 'glu', text: 'Glucose up', role: 'glu', at: T(L, [-46, 196, 'person']), side: ['ul', 'l', 'u'], lead: true, strong: true });
        if(st.stop && st.pile > 0.5) out.push({ key: 'pile', text: st.stop.id === 'pit' ? 'CRH builds up' : 'ACTH builds up', role: st.stop.id === 'pit' ? 'crh' : 'acth', at: st.stop.id === 'pit' ? T(L, [238, 300, 'mag']) : gap(L)[4], side: st.stop.id === 'pit' ? ['l', 'u'] : ['u', 'd'], lead: true, strong: true });
        return out;
      },
      words: function(st){
        if(st.stop) return st.stop.id === 'pit'
          ? [{ t: 'Pituitary damaged', role: 'bad' }, { t: 'no ACTH', role: 'acth' }, { t: 'no cortisol, no brake', role: 'cort' }, { t: 'CRH builds up', role: 'crh' }]
          : [{ t: 'Adrenal cortex damaged', role: 'bad' }, { t: 'no cortisol', role: 'cort' }, { t: 'no brake: ACTH builds up', role: 'acth' }];
        return [
          [{ t: 'Pain and fear', role: 'aff' }, { t: 'act on the hypothalamus', role: 'crh' }],
          [{ t: 'Hypothalamus', role: 'crh' }, { t: 'releases CRH', role: 'crh' }],
          [{ t: 'Portal veins', role: 'crh' }, { t: 'carry CRH straight to the pituitary', role: 'crh' }],
          [{ t: 'CRH', role: 'crh' }, { t: 'anterior pituitary releases ACTH', role: 'acth' }],
          [{ t: 'ACTH in the blood', role: 'acth' }, { t: 'adrenal cortex releases cortisol', role: 'cort' }],
          [{ t: 'Cortisol', role: 'cort' }, { t: 'liver makes glucose', role: 'glu' }, { t: 'blood glucose rises', role: 'glu' }],
          [{ t: 'Cortisol', role: 'cort' }, { t: 'brakes CRH and ACTH', role: 'cort' }, { t: 'negative feedback', role: 'cord' }]
        ][st.k];
      }
    });
  })();

  /* ------------------------------------------------------------------ 4. Synapse: chemical synaptic transmission */
  (function(){
    // syn: the terminal, cleft and receptor proteins (their own coordinates); tz: the trigger zone, its threshold bar
    // and the axon (centred on the trigger zone); n1, n2: the two neighbouring terminals
    var LAY = {
      tall: { w: 600, h: 600, g: { syn: [-64, 18, 1], tz: [500, 520, 1], n1: [-46, 18, 1], n2: [-108, 18, 1] } },
      wide: { w: 1080, h: 540, g: { syn: [140, 0, 1], tz: [968, 452, 1], n1: [40, 0, 1], n2: [196, 0, 1] } }
    };
    var VES = [[200, 170], [250, 140], [300, 160], [350, 130], [390, 180], [330, 220], [270, 230], [420, 240]];
    var DOCK = [[276, 300], [340, 300], [400, 300]];
    var REC = [[296, 354], [340, 354], [384, 354]];
    function role(v){ return v < 0.9 ? 'sig' : v < 1.9 ? 'ca' : v < 4.9 ? 'nt' : v < 6.95 ? 'na' : 'sig'; }
    function post(L){
      // the postsynaptic neuron: its membrane under the cleft, narrowing to the trigger zone and the axon
      var m = T(L, [0, 352, 'syn'])[1], z = T(L, [0, 0, 'tz']), w = L.w + 400, h = L.h;
      return 'M-400,' + f1(m) + ' H' + f1(z[0] - 150) + ' C' + f1(z[0] - 60) + ',' + f1(m + 4) + ' ' + f1(z[0] - 30) + ',' + f1(z[1] - 70) + ' ' + f1(z[0] - 8) + ',' + f1(z[1] - 22) +
        ' C' + f1(z[0] + 4) + ',' + f1(z[1] - 16) + ' ' + f1(z[0] + 30) + ',' + f1(z[1] - 16) + ' ' + f1(w) + ',' + f1(z[1] - 16) + ' V' + f1(z[1] + 16) +
        ' C' + f1(z[0] + 30) + ',' + f1(z[1] + 16) + ' ' + f1(z[0] + 4) + ',' + f1(z[1] + 16) + ' ' + f1(z[0] - 8) + ',' + f1(z[1] + 24) + ' C' + f1(z[0] - 30) + ',' + f1(z[1] + 50) + ' ' + f1(z[0] - 40) + ',' + f1(h) + ' ' + f1(z[0] - 44) + ',' + f1(h) + ' H0 Z';
    }
    SCENES.push({
      id: 'synapse', tab: 'Synapse', short: 'Synapse', path: 'synaptic-transmission',
      purpose: 'Carry a signal across a chemical synapse',
      cue: 'Drag the signal', token: 'the signal', thing: 'signal',
      layouts: LAY, last: 8,
      segs: function(L){
        var z = T(L, [0, 0, 'tz']), e = T(L, [0, 352, 'syn']);
        return [
          // the action potential runs along the terminal's membrane to the calcium channel
          TS(L, [[174, 64, 'syn'], [170, 110, 'syn'], [156, 170, 'syn'], [150, 230, 'syn'], [154, 278, 'syn'], [176, 304, 'syn'], [208, 312, 'syn']]),
          TS(L, [[208, 312, 'syn'], [240, 306, 'syn'], [276, 300, 'syn']]),
          TS(L, [[276, 300, 'syn'], [296, 336, 'syn']]),
          TS(L, [[296, 336, 'syn'], [338, 350, 'syn']]),
          TS(L, [[338, 350, 'syn'], [340, 374, 'syn']]),
          TS(L, [[340, 374, 'syn'], [384, 396, 'syn'], [430, 414, 'syn']]),
          TS(L, [[430, 414, 'syn']]).concat(bow(T(L, [470, 426, 'syn']), [z[0] - 16, z[1] - 4], 20, 8)).concat([[z[0], z[1]]]),
          [[z[0], z[1]], [z[0] + 24, z[1]], [z[0] + 52, z[1]]]
        ];
      },
      breaks: [
        { id: 'ca', stopV: 0.6, place: function(L){ return L.id === 'wide' ? T(L, [222, 344, 'syn']) : T(L, [198, 340, 'syn']); }, off: [0, 1], tag: 'Blocked', label: 'Block', aria: 'Block the calcium channels', name: 'Calcium channels blocked', step: 1, mark: function(L){ return T(L, [222, 318, 'syn']); } },
        { id: 'rec', stopV: 3.55, place: function(L){ return L.id === 'wide' ? T(L, [430, 372, 'syn']) : T(L, [358, 392, 'syn']); }, off: function(L){ return L.id === 'wide' ? [1, 0] : [0, 1]; }, tag: 'Blocked', label: 'Block', aria: 'Block the receptor proteins', name: 'Receptor proteins blocked', step: 4, mark: function(L){ return T(L, [296, 372, 'syn']); } }
      ],
      take: 'Electrical, then chemical, then electrical again.',
      art: function(E){
        var L = E.L, s = '<defs><radialGradient id="pe-term" cx="0.45" cy="0.35" r="0.75"><stop offset="0" stop-color="#FDF3E3"/><stop offset="1" stop-color="#F1DDBF"/></radialGradient>' +
          '<linearGradient id="pe-post" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F3E4D2"/><stop offset="1" stop-color="#E7CFB4"/></linearGradient>' +
          '<radialGradient id="pe-epsp" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#F2B33D" stop-opacity=".7"/><stop offset="1" stop-color="#F2B33D" stop-opacity="0"/></radialGradient></defs>';
        s += '<rect class="pe-ecf" x="-400" y="0" width="' + (L.w + 800) + '" height="' + L.h + '"/>';
        s += '<path class="pe-post" d="' + post(L) + '"/>';
        var z = T(L, [0, 0, 'tz']);
        s += '<path class="pe-myel" d="M' + f1(z[0] + 26) + ',' + f1(z[1] - 16) + ' h' + f1(L.w + 400 - z[0] - 26) + ' v32 h-' + f1(L.w + 400 - z[0] - 26) + ' Z"/>';
        s += '<ellipse class="pe-epsp" data-r="epsp" cx="0" cy="0" rx="10" ry="10"/>';
        s += G(L, 'tz', '<path class="pe-tz" data-r="tz" d="M-14,-26 C-4,-14 4,-6 6,0 C4,6 -4,14 -14,26"/>');
        // the threshold bar by the trigger zone: the summed EPSPs, with threshold marked
        s += G(L, 'tz', '<rect class="pe-gauge" x="-62" y="-124" width="16" height="70" rx="8"/><rect class="pe-gaugef" data-r="gauge" x="-62" y="-54" width="16" height="0" rx="8"/><path class="pe-thr" d="M-70,-108 h32"/>');
        s += G(L, 'n1', '<path class="pe-term2" d="M30,346 C10,320 20,270 60,262 C100,256 128,290 120,330 C118,342 112,350 104,352 Z"/>');
        s += G(L, 'n2', '<path class="pe-term2" d="M540,354 C536,320 560,290 600,292 C636,296 650,330 632,366 Z"/>');
        var t = '<path class="pe-term" d="M164,-40 H224 C230,60 250,86 300,92 C400,96 500,140 506,220 C510,280 470,318 440,320 L190,320 C150,318 134,280 140,230 C146,180 170,120 166,60 Z"/>';
        VES.forEach(function(v0){ t += '<g class="pe-ves"><circle cx="' + v0[0] + '" cy="' + v0[1] + '" r="17"/><circle class="pe-ntd" cx="' + (v0[0] - 5) + '" cy="' + (v0[1] - 3) + '" r="3.5"/><circle class="pe-ntd" cx="' + (v0[0] + 5) + '" cy="' + (v0[1] + 4) + '" r="3.5"/></g>'; });
        DOCK.forEach(function(d, i){ t += '<g class="pe-ves" data-r="dock' + i + '"><circle cx="' + d[0] + '" cy="' + d[1] + '" r="15"/><circle class="pe-ntd" cx="' + (d[0] - 5) + '" cy="' + (d[1] - 3) + '" r="3.5"/><circle class="pe-ntd" cx="' + (d[0] + 5) + '" cy="' + (d[1] + 4) + '" r="3.5"/></g>'; });
        t += '<g data-r="cach"><path class="pe-cach" d="M206,306 h10 v26 h-10 Z M228,306 h10 v26 h-10 Z"/><path class="pe-cach" d="M450,306 h10 v26 h-10 Z M472,306 h10 v26 h-10 Z"/></g>';
        t += '<path class="pe-upt" d="M432,312 c0,-10 18,-10 18,0 v12 h-18 Z"/>';
        REC.forEach(function(r, i){ t += '<g data-r="rec' + i + '"><path class="pe-rec" d="M' + (r[0] - 14) + ',' + (r[1] - 6) + ' h10 v30 h-10 Z M' + (r[0] + 4) + ',' + (r[1] - 6) + ' h10 v30 h-10 Z"/><path class="pe-site" d="M' + (r[0] - 14) + ',' + (r[1] - 6) + ' a7,7 0 0 1 10,0"/></g>'; });
        s += G(L, 'syn', t);
        s += '<g data-r="ions"></g><g data-r="nts"></g><g data-r="cuts"></g>';
        return s;
      },
      fxInit: function(fx, R){
        var h = '';
        for(var i = 0; i < 6; i++) h += '<circle class="pe-ca" r="5.5" cx="-50" cy="-50"/>';
        for(i = 0; i < 5; i++) h += '<circle class="pe-na" r="5" cx="-50" cy="-50"/>';
        R.ions.innerHTML = h;
        h = '';
        for(i = 0; i < 9; i++) h += '<circle class="pe-ntm" r="4.5" cx="-50" cy="-50"/>';
        R.nts.innerHTML = h;
      },
      state: function(v, br){
        var st = { v: v, k: Math.min(8, Math.floor(v + 0.12)), stop: null, ca: !!(br && br.id === 'ca'), rec: !!(br && br.id === 'rec') };
        if(br && v >= Math.min(br.stopV - 0.01, br.step - 0.12)) st.stop = br;
        st.caIn = st.ca ? 0 : bump(v, 0.7, 0.88, 1.88, 2.2);
        st.fuse = st.ca ? 0 : ramp(v, 1.7, 1.88);
        st.release = st.ca ? 0 : ramp(v, 1.7, 1.88);
        st.cross = st.ca ? 0 : ramp(v, 2.45, 3.3);
        st.bind = st.ca || st.rec ? 0 : ramp(v, 3.6, 3.88) * (1 - ramp(v, 7.88, 8));
        st.open = st.ca || st.rec ? 0 : ramp(v, 4.6, 4.88) * (1 - ramp(v, 7.88, 8));
        st.naIn = st.open * bump(v, 4.6, 4.88, 6.0, 6.6);
        st.epsp = st.ca || st.rec ? 0 : ramp(v, 5.6, 5.88) * (1 - ramp(v, 7.88, 8));
        // the EPSPs add at the trigger zone through step 8's words; threshold is reached at the end of that, then it fires
        st.sum = st.ca || st.rec ? 0 : ramp(v, 6.86, 7.3);
        st.fire = st.ca || st.rec ? 0 : bump(v, 7.22, 7.3, 7.88, 8.0);
        st.clear = st.ca ? 0 : ramp(v, 7.6, 7.88);
        return st;
      },
      paint: function(R, st, E){
        var L = E.L, i, kids = R.ions.childNodes, q;
        for(i = 0; i < 6; i++){ var x0 = i < 3 ? 222 : 466, t = ramp(st.v, 0.7 + i * 0.03, 1.4); q = T(L, [x0 + (i % 3 - 1) * 9, lerp(346, 290, t), 'syn']); sa(kids[i], 'cx', f1(q[0])); sa(kids[i], 'cy', f1(q[1])); so(kids[i], f1(st.caIn)); }
        for(i = 0; i < 5; i++){ var r = REC[i % 3], t2 = ramp(st.v, 4.7 + i * 0.05, 5.4); q = T(L, [r[0] + (i > 2 ? 4 : -4), lerp(340, 392, t2), 'syn']); sa(kids[6 + i], 'cx', f1(q[0])); sa(kids[6 + i], 'cy', f1(q[1])); so(kids[6 + i], f1(st.naIn)); }
        for(i = 0; i < 3; i++){ var d = R['dock' + i]; so(d, f1(1 - st.fuse)); sa(d, 'transform', 'translate(0,' + f1(st.fuse * 10) + ')'); }
        var nts = R.nts.childNodes;
        for(i = 0; i < 9; i++){
          var dk = DOCK[i % 3], rc = REC[i % 3], ang = i * 0.7;
          var x = lerp(dk[0], rc[0] + Math.cos(ang) * (st.rec ? 14 : 3), st.cross), y = lerp(dk[1] + 12, st.bind > 0.5 && i < 3 ? rc[1] - 4 : 338 + (i % 3) * 4, st.cross);
          if(st.clear > 0){ x = lerp(x, i % 2 ? 441 : x, st.clear); y = lerp(y, i % 2 ? 314 : y, st.clear); }
          q = T(L, [x, y, 'syn']);
          sa(nts[i], 'cx', f1(q[0])); sa(nts[i], 'cy', f1(q[1]));
          so(nts[i], f1(st.release * (1 - st.clear * (i % 2 ? 0.2 : 1)) * (st.clear > 0.95 ? 0 : 1)));
        }
        for(i = 0; i < 3; i++) sa(R['rec' + i], 'class', st.rec ? 'is-blk' : st.open > 0.5 ? 'is-open' : st.bind > 0.5 ? 'is-bound' : '');
        sa(R.cach, 'class', st.ca ? 'is-blk' : st.caIn > 0.3 ? 'is-open' : '');
        if(!R.nbs) R.nbs = [].slice.call(R.cach.ownerSVGElement.querySelectorAll('.pe-term2'));
        R.nbs.forEach(function(n){ sa(n, 'class', st.sum > 0.05 ? 'pe-term2 is-on' : 'pe-term2'); });
        var a = T(L, [340, 420, 'syn']), z = T(L, [0, 0, 'tz']), rr = 10 + st.epsp * 160;
        sa(R.epsp, 'rx', f1(rr)); sa(R.epsp, 'ry', f1(rr * 0.5)); sa(R.epsp, 'cx', f1(lerp(a[0], z[0] - 80, st.epsp * 0.6))); sa(R.epsp, 'cy', f1(lerp(a[1], z[1] - 20, st.epsp * 0.6))); so(R.epsp, f1(st.epsp));
        // the bar: empty until the EPSPs add; it reaches the threshold mark exactly when threshold is reached, then fills
        var level = st.sum * 54 + st.fire * 16;
        sa(R.gauge, 'y', f1(-54 - level)); sa(R.gauge, 'height', f1(level));
        sa(R.tz, 'class', 'pe-tz' + (st.fire > 0.3 ? ' is-on' : ''));
      },
      cut: function(){ return ''; },
      tokenRole: function(st){ return st.stop ? (st.stop.id === 'ca' ? 'sig' : 'nt') : role(st.v); },
      trailFor: function(st){ return [[0, 0.9, 'sig'], [0.9, 1.9, 'ca'], [1.9, 4.9, 'nt'], [4.9, 6.95, 'na'], [6.95, 8, 'sig']]; },
      labels: function(st, E){
        var L = E.L, out = [
          { key: 'thr', text: 'Threshold', role: 'bad', at: T(L, [-70, -108, 'tz']), side: ['l', 'u', 'd'], lead: true },
          { key: 'term', text: 'Axon terminal', role: 'sig', at: T(L, [430, 150, 'syn']), side: ['r', 'u'] },
          { key: 'ca', text: 'Ca²⁺ channel', role: 'ca', at: T(L, [472, 318, 'syn']), side: ['r', 'd', 'ur'], lead: true },
          { key: 'rec', text: 'Receptor proteins', role: 'nt', at: T(L, [340, 372, 'syn']), side: ['d', 'dl', 'l'], lead: true },
          { key: 'tz', text: 'Trigger zone', role: 'na', at: T(L, [-8, 18, 'tz']), side: ['d', 'dl', 'l'], lead: true }
        ];
        var CUR = [['Action potential', 'sig'], ['Ca²⁺ in', 'ca'], ['Vesicle fuses', 'nt'], ['Neurotransmitter', 'nt'], ['Binds', 'nt'], ['Na⁺ in', 'na'], ['EPSP', 'na'], ['EPSPs add', 'na'], ['Cleared', 'nt']][st.k];
        if(st.stop) CUR = st.stop.id === 'ca' ? ['Action potential', 'sig'] : ['Neurotransmitter', 'nt'];
        if(st.k === 8 && !st.stop){ if(st.clear > 0.5) out.push({ key: 'cur', text: CUR[0], role: CUR[1], at: T(L, [420, 338, 'syn']), side: ['u', 'r'], lead: true, strong: true }); }
        else out.push({ key: 'cur', text: CUR[0], role: CUR[1], at: this.route.at(st.v), side: ['r', 'l', 'u', 'd'], strong: true });
        if(st.fire > 0.3 || (st.k === 8 && !st.stop)) out.push({ key: 'fire', text: 'Fires', role: 'sig', at: T(L, [40, 0, 'tz']), side: ['u', 'd'], strong: true });
        return out;
      },
      words: function(st){
        if(st.stop) return st.stop.id === 'ca'
          ? [{ t: 'Ca²⁺ channels blocked', say: 'calcium channels blocked', role: 'bad' }, { t: 'no Ca²⁺ in', say: 'no calcium in', role: 'ca' }, { t: 'no transmitter released', role: 'nt' }]
          : [{ t: 'Receptor proteins blocked', role: 'bad' }, { t: 'transmitter cannot bind', role: 'nt' }, { t: 'no EPSP', role: 'na' }];
        if(st.k === 7) return st.sum < 0.999 ? [{ t: 'EPSPs from three synapses', role: 'na' }, { t: 'add up at the trigger zone', role: 'na' }]
          : [{ t: 'EPSPs add up', role: 'na' }, { t: 'threshold reached', role: 'na' }, { t: 'neuron fires', role: 'sig' }];
        return [
          [{ t: 'Action potential', role: 'sig' }, { t: 'reaches the axon terminal', role: 'sig' }],
          [{ t: 'Depolarization', role: 'sig' }, { t: 'Ca²⁺ channels open', say: 'calcium channels open', role: 'ca' }, { t: 'Ca²⁺ rushes in', say: 'calcium rushes in', role: 'ca' }],
          [{ t: 'Ca²⁺', say: 'calcium', role: 'ca' }, { t: 'vesicles fuse', role: 'nt' }, { t: 'transmitter released', role: 'nt' }],
          [{ t: 'Neurotransmitter', role: 'nt' }, { t: 'diffuses across the cleft', role: 'nt' }],
          [{ t: 'Neurotransmitter', role: 'nt' }, { t: 'binds receptor proteins', role: 'nt' }],
          [{ t: 'Receptor proteins', role: 'nt' }, { t: 'channels open', role: 'na' }, { t: 'Na⁺ flows in', say: 'sodium flows in', role: 'na' }],
          [{ t: 'Na⁺ in', say: 'sodium in', role: 'na' }, { t: 'membrane depolarizes: EPSP', role: 'na' }],
          null,
          [{ t: 'Reuptake and enzymes', role: 'nt' }, { t: 'transmitter cleared', role: 'nt' }, { t: 'synapse ready again', role: 'sig' }]
        ][st.k];
      }
    });
  })();

  /* ================================================================== the engine */
  function build(o){
    var K = window.LevlKit2, DATA = o.data;
    function pathway(id){ for(var i = 0; i < DATA.pathways.length; i++) if(DATA.pathways[i].id === id) return DATA.pathways[i]; return null; }
    var scenes = SCENES.filter(function(sc){ return !!pathway(sc.path); });
    if(!scenes.length || !K) return null;
    scenes.forEach(function(sc){ sc.p = pathway(sc.path); sc.v = 0; sc.br = null; sc.max = sc.last; });
    var cur = scenes[0], view = { v: 0, target: 0 }, raf = 0, last = 0, onScreen = true, wKey = '', E = { fs: 13, k: 1 };

    var stage = document.createElement('div'); stage.className = 'pe';
    var tabs = K.tabs({ label: 'Which pathway', items: scenes.map(function(sc){ return { value: sc.id, label: sc.tab, short: sc.short }; }), value: cur.id, big: true, onChange: function(v){ setTab(v, true); } });
    stage.appendChild(tabs.el);
    var head = K.head({ purpose: cur.purpose, how: { label: 'Show me how', onClick: function(){ startTour(); } } });
    stage.appendChild(head.el);
    var main = document.createElement('div'); main.className = 'pe-main'; main.id = 'pe-main';
    main.innerHTML = '<div class="pe-pic"><svg class="pe-svg" viewBox="0 0 ' + W + ' ' + H + '" role="img" xmlns="http://www.w3.org/2000/svg" data-ls-text="keep">' +
      '<g class="pe-art"></g><g class="pe-trail"></g><g class="pe-fx"></g><g class="pe-tok"><circle class="pe-tok-glow" r="30"/><circle class="pe-tok-c" r="20"/></g><g class="pe-labs"></g></svg>' +
      '<div class="pe-over"></div></div>' +
      '<ol class="pe-rail" aria-label="Steps reached"></ol>';
    stage.appendChild(main);
    tabs.el.querySelectorAll('.tk2-tab').forEach(function(b){ b.setAttribute('aria-controls', main.id); });
    var pic = main.querySelector('.pe-pic'), svg = main.querySelector('.pe-svg'), art = svg.querySelector('.pe-art'), trail = svg.querySelector('.pe-trail'),
      fx = svg.querySelector('.pe-fx'), tok = svg.querySelector('.pe-tok'), labs = svg.querySelector('.pe-labs'), rail = main.querySelector('.pe-rail'), over = main.querySelector('.pe-over');
    var layer = K.layer(pic);
    var lines = document.createElement('div'); lines.className = 'pe-lines';
    var cause = K.cause({ label: 'Why' });
    lines.appendChild(cause.el);
    stage.appendChild(lines);
    var live = document.createElement('p'); live.className = 'tk2-sr'; live.setAttribute('aria-live', 'polite'); stage.appendChild(live);
    function say(t){ live.textContent = ''; setTimeout(function(){ live.textContent = t; }, 40); }
    // Start over: always there (rule 8)
    var reset = document.createElement('button'); reset.type = 'button'; reset.className = 'pe-reset';
    reset.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12a8 8 0 1 0 2.4-5.7M4 4v4.5h4.5"/></svg><span>Start over</span>';
    over.appendChild(reset);

    var R = {}, handle = null, cue = null, pills = [], lastSt = null;
    /* ---- sizes: font in picture units so labels read about 13 px everywhere */
    function scale(){ var r = svg.getBoundingClientRect(); return r.width ? r.width / (E.W || W) : 1; }
    /* the composition: wide (2:1) when the stage is a desktop's, tall (1:1) on a phone or an upright tablet */
    function pickLayout(){ return (stage.clientWidth || 0) >= 900 ? 'wide' : 'tall'; }
    /* on a short wide screen (a laptop) the 2:1 picture would leave plain page at its sides: the crop widens
       (up to 400 units, half each side) so the picture still fills the stage; the drawing does not move */
    function layout(){
      var id = pickLayout(), L = cur.layouts[id], ex = 0;
      if(id === 'wide'){ var avail = Math.max(300, (window.innerHeight || 800) - 340), asp = (stage.clientWidth || 0) / avail; if(asp > 2) ex = Math.min(400, Math.round(L.h * asp - L.w)); }
      L.id = id; E.L = L; E.W = L.w + ex; E.H = L.h; E.X0 = -ex / 2;
      svg.setAttribute('viewBox', f1(E.X0) + ' 0 ' + E.W + ' ' + L.h); pic.setAttribute('data-lay', id);
      pic.style.maxWidth = id === 'wide' ? 'calc((100vh - 340px) * ' + (E.W / E.H).toFixed(4) + ')' : '';
      if(cur.Lid === id && cur.route) return false;
      cur.Lid = id; cur.L = L; cur.route = new Route(cur.segs(L));
      (cur.breaks || []).forEach(function(b){ b._cut = null; });
      trail._h = null;
      return true;
    }
    function metrics(){ var k = scale() || 1; E.k = k; E.fs = clamp((k < 0.8 ? 12.5 : 13.5) / k, 10, 27); E.gap = 6 / k; }

    /* ---- the picture of the current screen */
    function buildArt(){
      art.innerHTML = cur.art(E);
      R = {};
      art.querySelectorAll('[data-r]').forEach(function(n){ R[n.getAttribute('data-r')] = n; });
      labCache = {}; labs.innerHTML = '';
      fx.innerHTML = '';
      if(cur.fxInit) cur.fxInit(fx, R, E);
      paintCuts();
    }
    function paintCuts(){
      if(!R.cuts) return;
      R.cuts.innerHTML = cur.br && !cur.br.mark ? cur.cut(cur.br, R, cur.route.at, cutV(cur.br), E) : '';
    }

    /* ---- labels: pooled pills placed clear of each other, the token and the controls */
    var labCache = {}, lastPlace = {};
    var TW = {};
    function textW(t){
      var key = t + '|' + E.fs.toFixed(2);
      if(TW[key]) return TW[key];
      var n = document.createElementNS(NS, 'text'); n.setAttribute('class', 'pe-lab-m'); n.setAttribute('x', -999); n.setAttribute('y', -999); n.style.fontSize = E.fs.toFixed(2) + 'px'; n.textContent = t; labs.appendChild(n);
      var w = n.getComputedTextLength ? n.getComputedTextLength() : 0; labs.removeChild(n);
      return (TW[key] = w > 0 ? w : t.length * E.fs * 0.6);
    }
    function inter(a, b, g){ return a[0] < b[2] + g && a[2] > b[0] - g && a[1] < b[3] + g && a[3] > b[1] - g; }
    var OFF = { r: [1, 0], l: [-1, 0], u: [0, -1], d: [0, 1], ur: [0.8, -0.8], ul: [-0.8, -0.8], dr: [0.8, 0.8], dl: [-0.8, 0.8] };
    // the controls on the picture (Start over, the break buttons) and the cue, measured only when they change, so a
    // frame never forces a layout
    var ctrlBox = null;
    function ctrlDirty(){ ctrlBox = null; }
    function ctrls(){
      if(ctrlBox) return ctrlBox;
      var out = [], k = E.k || 1;
      [reset].concat(pills.map(function(x){ return x.el; })).forEach(function(b){
        if(!b || b.hidden || !b.offsetWidth) return;
        var pr = pic.getBoundingClientRect(), q = b.getBoundingClientRect();
        var x0 = E.X0 || 0;
        out.push([(q.left - pr.left) / k + x0, (q.top - pr.top) / k, (q.right - pr.left) / k + x0, (q.bottom - pr.top) / k]);
      });
      if(cue && cue.active()){ var c = pic.querySelector('.tk2-cue'); if(c){ var pr2 = pic.getBoundingClientRect(), q2 = c.getBoundingClientRect(); out.push([(q2.left - pr2.left) / k + (E.X0 || 0), (q2.top - pr2.top) / k, (q2.right - pr2.left) / k + (E.X0 || 0), (q2.bottom - pr2.top) / k]); } }
      return (ctrlBox = out);
    }
    function keepOut(){
      var k = E.k || 1, p = cur.route.at(view.v), r = 30 / k;
      return [[p[0] - r, p[1] - r, p[0] + r, p[1] + r]].concat(ctrls());
    }
    function placeLabels(list){
      var fs = E.fs, h = fs * 1.75, pad = fs * 0.55, placed = keepOut(), used = {}, g = E.gap;
      list.forEach(function(L){
        var w = textW(L.text) + pad * 2, at = L.at, best = null;
        var sides = (L.side || ['r', 'l', 'u', 'd']).concat(['u', 'd', 'r', 'l', 'ur', 'ul', 'dr', 'dl']);
        var dists = [0.9, 1.6, 2.4, 3.4, 4.6];
        var cands = [];
        dists.forEach(function(dd, di){ sides.forEach(function(sd, si){ cands.push({ sd: sd, dd: dd, cost: di * 10 + si }); }); });
        var prev = lastPlace[cur.id + ':' + L.key + ':' + L.text];
        if(prev) cands.unshift({ sd: prev.sd, dd: prev.dd, cost: -1 });
        for(var c = 0; c < cands.length && !best; c++){
          var q = cands[c], o2 = OFF[q.sd], d = q.dd * fs;
          var cx = at[0] + o2[0] * (w / 2 + d * 0.6) * (o2[0] ? 1 : 0), cy = at[1] + o2[1] * (h / 2 + d);
          if(!o2[0]) cx = at[0];
          var b = [cx - w / 2, cy - h / 2, cx + w / 2, cy + h / 2];
          if(b[0] < (E.X0 || 0) + 4 || b[2] > (E.X0 || 0) + E.W - 4 || b[1] < 4 || b[3] > E.H - 4) continue;
          if(placed.some(function(x){ return inter(x, b, g); })) continue;
          best = { b: b, sd: q.sd, dd: q.dd };
        }
        if(!best){
          // no spot beside it: the nearest free spot further out (with a leader line), searched on rings around it
          for(var ring = 1; ring <= 14 && !best; ring++){
            var rr = ring * fs * 1.1, nn = 8 + ring * 4, bestD = Infinity;
            for(var a = 0; a < nn; a++){
              var ang = a / nn * Math.PI * 2, cx2 = at[0] + Math.cos(ang) * (rr + w * 0.35 * Math.abs(Math.cos(ang))), cy2 = at[1] + Math.sin(ang) * rr;
              var b2 = [cx2 - w / 2, cy2 - h / 2, cx2 + w / 2, cy2 + h / 2];
              if(b2[0] < (E.X0 || 0) + 4 || b2[2] > (E.X0 || 0) + E.W - 4 || b2[1] < 4 || b2[3] > E.H - 4) continue;
              if(placed.some(function(x){ return inter(x, b2, g); })) continue;
              var dd2 = Math.hypot(cx2 - at[0], cy2 - at[1]);
              if(dd2 < bestD){ bestD = dd2; best = { b: b2, sd: 'u', dd: 99, far: true }; }
            }
          }
          if(!best){ var bx = clamp(at[0] - w / 2, (E.X0 || 0) + 4, (E.X0 || 0) + E.W - 4 - w), by = clamp(at[1] - h * 1.6, 4, E.H - 4 - h); best = { b: [bx, by, bx + w, by + h], sd: 'u', dd: 1 }; }
          if(best.far) L = Object.assign({}, L, { lead: true });
        }
        if(!best.far) lastPlace[cur.id + ':' + L.key + ':' + L.text] = { sd: best.sd, dd: best.dd };
        placed.push(best.b);
        used[L.key] = 1;
        drawLab(L, best.b, at);
      });
      Object.keys(labCache).forEach(function(k){ if(!used[k]){ labCache[k].g.remove(); delete labCache[k]; } });
    }
    function drawLab(L, b, at){
      var c = labCache[L.key];
      if(!c){
        var gEl = document.createElementNS(NS, 'g');
        gEl.innerHTML = '<path class="pe-lead"/><circle class="pe-lead-dot"/><rect/><text dy="0.36em"/>';
        labs.appendChild(gEl);
        c = labCache[L.key] = { g: gEl, lead: gEl.childNodes[0], dot: gEl.childNodes[1], rect: gEl.childNodes[2], t: gEl.childNodes[3], sig: '' };
      }
      var sig = L.text + '|' + L.role + '|' + b.map(f1).join(',') + '|' + (L.lead ? f1(at[0]) + ',' + f1(at[1]) : '') + '|' + E.fs.toFixed(2) + (L.strong ? 's' : '');
      if(sig === c.sig) return;
      c.sig = sig;
      c.g.setAttribute('class', 'pe-lab is-' + L.role + (L.strong ? ' is-strong' : ''));
      c.g.setAttribute('data-lab', L.text);
      var h = b[3] - b[1];
      c.rect.setAttribute('x', f1(b[0])); c.rect.setAttribute('y', f1(b[1])); c.rect.setAttribute('width', f1(b[2] - b[0])); c.rect.setAttribute('height', f1(h)); c.rect.setAttribute('rx', f1(h / 2));
      c.t.setAttribute('x', f1((b[0] + b[2]) / 2)); c.t.setAttribute('y', f1((b[1] + b[3]) / 2)); c.t.style.fontSize = E.fs.toFixed(2) + 'px'; c.t.textContent = L.text;
      var inside = at[0] > b[0] && at[0] < b[2] && at[1] > b[1] && at[1] < b[3];
      if(L.lead && !inside){
        var cx = clamp(at[0], b[0], b[2]), cy = clamp(at[1], b[1], b[3]);
        c.lead.setAttribute('d', 'M' + f1(cx) + ',' + f1(cy) + 'L' + f1(at[0]) + ',' + f1(at[1]));
        c.dot.setAttribute('cx', f1(at[0])); c.dot.setAttribute('cy', f1(at[1])); c.dot.setAttribute('r', f1(E.fs * 0.22));
        c.lead.style.display = c.dot.style.display = '';
      } else c.lead.style.display = c.dot.style.display = 'none';
    }

    /* ---- the rail: the steps reached, in order, named from the pathway's own data */
    function railBuild(){
      var n = cur.steps || cur.last + 1;
      rail.innerHTML = cur.p.steps.slice(0, n).map(function(s, i){
        return '<li class="pe-step" data-k="' + i + '"><span class="pe-n" aria-hidden="true">' + (i + 1) + '</span><span class="pe-sn"></span></li>';
      }).join('') + '<li class="pe-strip" aria-hidden="true"><span class="pe-strip-n"></span><span class="pe-strip-t"></span></li>';
      railKey = '';
    }
    var railKey = '';
    function railPaint(st){
      var n = cur.steps || cur.last + 1, stopAt = st.stop ? st.stop.step : 99, fl = cur.fails ? cur.fails(st) : [];
      var key = st.k + '|' + (st.stop ? st.stop.id : '') + '|' + Math.floor(st.v + 0.12) + '|' + fl.join(',') + '|' + !!st.lap;
      if(key === railKey) return; railKey = key;
      rail.querySelectorAll('.pe-step').forEach(function(li){
        var i = +li.getAttribute('data-k'), failed = (!!st.stop && i >= stopAt) || fl.indexOf(i) > -1;
        var reached = !failed && (st.lap || (st.stop ? i < stopAt : i <= st.k));
        li.className = 'pe-step' + (reached ? ' is-on' : '') + (reached && i === st.k && !st.stop ? ' is-cur' : '') + (failed ? ' is-fail' : '');
        var t = li.querySelector('.pe-sn'), name = cur.p.steps[i].label;
        t.textContent = reached || failed ? name : '';
        li.setAttribute('aria-label', 'Step ' + (i + 1) + (reached || failed ? ': ' + name : '') + (failed ? ', fails' : reached ? (i === st.k ? ', now' : ', done') : ', not reached'));
      });
      var sn = rail.querySelector('.pe-strip-n'), stt = rail.querySelector('.pe-strip-t');
      if(st.stop){ sn.textContent = 'Stops at step ' + (stopAt + 1) + ' of ' + n; stt.textContent = 'steps ' + (stopAt + 1) + ' to ' + n + ' fail'; }
      else { sn.textContent = (st.lap ? 'Back to step 1 of ' : 'Step ' + (st.k + 1) + ' of ') + n; stt.textContent = cur.p.steps[st.k].label + (fl.indexOf(st.k) > -1 ? ': fails' : ''); }
    }
    /* ---- the cut buttons (after one full run on this screen) */
    function seenEnd(){ try{ return !!localStorage.getItem('pe-end:' + cur.id); }catch(e){ return !!cur.ended; } }
    function markEnd(){ cur.ended = true; try{ localStorage.setItem('pe-end:' + cur.id, '1'); }catch(e){} }
    function makePills(){
      pills.forEach(function(x){ x.el.remove(); });
      pills = (cur.breaks || []).map(function(b){
        var el = document.createElement('button'); el.type = 'button'; el.className = 'pe-cutb';
        el.setAttribute('aria-label', b.aria); el.setAttribute('data-b', b.id);
        el.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M8.1 8.1 20 20M8.1 15.9 20 4"/></svg><span>' + esc(b.label) + '</span>';
        el.addEventListener('click', function(){ breakIt(b); });
        over.appendChild(el);
        return { el: el, b: b };
      });
      placePills();
    }
    function placePills(){
      ctrlDirty();
      var k = E.k || scale(), show = seenEnd();
      pills.forEach(function(x){
        var p = placeOf(x.b), on = cur.br && cur.br.id === x.b.id;
        x.el.hidden = !show || !!cur.br;
        x.el.setAttribute('aria-pressed', String(!!on));
        x.el.classList.toggle('is-done', !!on);
        x.el.disabled = !!on;
        x.el.classList.toggle('is-new', show && !cur.br && !cur.pillsSeen);
        var off = typeof x.b.off === 'function' ? x.b.off(E.L) : (x.b.off || [0, -1]);
        x.el.style.left = ((p[0] - (E.X0 || 0)) * k) + 'px'; x.el.style.top = (p[1] * k) + 'px';
        x.el.setAttribute('data-side', off[1] < 0 ? 'up' : off[1] > 0 ? 'down' : off[0] < 0 ? 'left' : 'right');
      });
    }
    function breakIt(b){
      if(cur.br) return;
      cur.br = b; cur.pillsSeen = true;
      // a new signal starts if the old one had already passed the break (the cut does not undo what happened)
      var m = lim();
      if(view.v > (b.pass ? b.at : m)){ jumpTo(0, true); }
      b._cut = null;
      paintCuts(); placePills(); wKey = ''; railKey = ''; draw();
      say(b.name + '. Drag the ' + cur.thing + ' again.');
      var hk = handle && handle.knob; if(hk) try{ hk.focus({ preventScroll: true }); }catch(e){}
    }
    reset.addEventListener('click', function(){
      fadeOut();
      cur.br = null; paintCuts();
      if(raf){ cancelAnimationFrame(raf); raf = 0; }
      view.v = view.target = cur.v = 0; if(handle) handle.value(0, false);
      placePills(); wKey = ''; railKey = ''; draw();
      say('Start over. ' + cur.tab + ': the ' + cur.thing + ' is at step 1.');
    });

    /* ---- the knob on the route */
    /* a broken run goes as far as the thing really goes (the break's stopV: never before the last step that happens);
       a cut is drawn a knob's width further down the route, so it stays in sight beside the stopped knob */
    function lim(){ var b = cur.br; return !b || b.pass ? cur.last : b.stopV; }
    function cutV(b){
      if(b.pass) return b.at;
      var key = cur.Lid + (E.k || 1).toFixed(3);
      if(b._cut && b._cut.key === key) return b._cut.v;
      var p0 = cur.route.at(b.stopV), need = 30 / (E.k || 1) + 10, v = Math.max(b.stopV, b.cutMin || b.stopV);
      while(v < (b.cutMax || cur.last) && Math.hypot(cur.route.at(v)[0] - p0[0], cur.route.at(v)[1] - p0[1]) < need) v += 0.01;
      b._cut = { key: key, v: +v.toFixed(2) };
      return b._cut.v;
    }
    function geoTarget(b){ var p = placeOf(b); return p; }
    function breakAt(b){ return b.mark ? b.mark(E.L) : b.pass ? placeOf(b) : cur.route.at(cutV(b)); }
    function placeOf(b){ return typeof b.place === 'function' ? b.place(E.L) : b.place; }
    function makeHandle(){
      if(handle){ handle.el.remove(); handle = null; }
      handle = K.handle(layer, { key: 'anp-pathways-knob', label: 'Move ' + cur.token + ' along the ' + cur.tab.toLowerCase(), value: view.target, min: 0, max: cur.last, step: 1, chip: false,
        at: function(v){ var q = cur.route.at(v); return [q[0] - (E.X0 || 0), q[1]]; },
        dir: function(v){ return cur.route.dir(v); },
        pick: function(x, y, v){ x += E.X0 || 0; var m = lim(), r = cur.route.near(x, y, Math.max(0, v - 0.6), Math.min(m, v + 0.6)); return r ? Math.min(r.v, m) : null; },
        keys: function(v, key){
          var m = lim();
          if(key === 'ArrowRight' || key === 'ArrowUp' || key === 'PageUp') return Math.min(m, Math.floor(v + 1e-6) + 1);
          if(key === 'ArrowLeft' || key === 'ArrowDown' || key === 'PageDown') return Math.max(0, Math.ceil(v - 1e-6) - 1);
          if(key === 'Home') return 0;
          if(key === 'End') return m;
          return null;
        },
        valuetext: function(v){ return stepText(v); },
        onStart: function(){ hideCue(true); tourDid('drag'); },
        onInput: function(v){ hideCue(true); tourDid('drag'); go(v); },
        onEnd: function(){ say(stepText(view.target)); } });
      // the knob sits above the labels' layer (the stage layer holds it)
    }
    function stepText(v){
      var st = cur.state(v, cur.br), w = cur.words(st);
      return 'Step ' + (st.k + 1) + ' of ' + (cur.steps || cur.last + 1) + ': ' + cur.p.steps[st.k].label + '. ' + w.map(function(p){ return p.say || p.t; }).join(', then ') + '.';
    }
    // a press on the route away from the knob: the token goes there (seen travelling), and the drag goes on
    svg.addEventListener('pointerdown', function(e){
      if(!handle || (e.pointerType === 'mouse' && e.button !== 0)) return;
      var r = svg.getBoundingClientRect(), k = scale(), x = (e.clientX - r.left) / k + (E.X0 || 0), y = (e.clientY - r.top) / k;
      var hit = cur.route.near(x, y, 0, lim());
      if(!hit || hit.d > 26 / k) return;
      hideCue(true); tourDid('drag');
      handle.value(hit.v, false); go(hit.v);
      handle.grab(e);
    });

    /* ---- drawing one frame */
    function draw(){
      var st = cur.state(view.v, cur.br);
      st.ended = seenEnd(); lastSt = st;
      cur.paint(R, st, E);
      // the token: what travels, at the shown position
      var p = cur.route.at(view.v), role = cur.tokenRole ? cur.tokenRole(st) : 'tok', k = E.k || 1;
      sa(tok, 'transform', 'translate(' + f1(p[0]) + ',' + f1(p[1]) + ')');
      sa(tok, 'class', 'pe-tok is-' + role + (st.stop ? ' is-stop' : ''));
      // the token is a ring round the knob's clear centre, so the part acting under it stays in sight
      sa(tok.firstChild, 'r', f1(29 / k)); sa(tok.lastChild, 'r', f1(25.5 / k)); sa(tok.lastChild, 'stroke-width', f1(5 / k));
      var tf = cur.tokenFill ? cur.tokenFill(st) : ''; if(tok.lastChild.style.stroke !== tf) tok.lastChild.style.stroke = tf;
      // the trail: where it has been
      var tv = Math.max(0, view.v), parts = cur.trailFor ? cur.trailFor(st) : cur.trail || [[0, cur.last, role]];
      // one path per part of the trail, drawn whole once per screen; the token's progress only moves its dash, so a
      // frame never rebuilds a path
      var sig = cur.id + '|' + cur.Lid + '|' + parts.map(function(pt){ return pt[0] + ':' + pt[1] + pt[2]; }).join(',');
      if(trail._h !== sig){
        trail._h = sig;
        trail.innerHTML = parts.map(function(pt){ return '<path class="pe-trail-p is-' + pt[2] + '" d="' + cur.route.path(pt[0], pt[1]) + '"/>'; }).join('');
        trail._len = parts.map(function(pt){ return cur.route.len(pt[1]) - cur.route.len(pt[0]); });
      }
      parts.forEach(function(pt, i){
        var el = trail.childNodes[i], a1 = Math.min(pt[1], tv), shown = a1 > pt[0] + 0.02 ? cur.route.len(a1) - cur.route.len(pt[0]) : 0, full = trail._len[i] + 2;
        sa(el, 'stroke-dasharray', f1(shown) + ' ' + f1(full)); sa(el, 'stroke-width', f1(6 / k));
      });
      var atEnd = !st.stop && view.v >= cur.last - 0.02;
      if(atEnd && !cur.br && !seenEnd()){ markEnd(); placePills(); }
      var LL = cur.labels(st, E);
      if(cur.br) LL.push({ key: 'brk', text: cur.br.tag, role: 'bad', at: breakAt(cur.br), side: ['u', 'd', 'l', 'r'], lead: true, strong: true });
      placeLabels(LL);
      railPaint(st);
      var ws = cur.words(st), key = JSON.stringify(ws) + (atEnd ? '|end' : '') + (st.stop ? '|stop' : '');
      if(key !== wKey){
        wKey = key;
        cause.set(ws, st.stop ? 'What fails:' : 'Step ' + (st.k + 1) + ':');
        // the end of a run: the takeaway, or after a break what failed
        if(atEnd){ cause.take(cur.br && cur.brokenTake ? cur.brokenTake : cur.take + (cur.breaks && cur.breaks.length && !cur.br ? ' Now break a part.' : '')); }
        svg.setAttribute('aria-label', cur.tab + '. ' + stepText(view.v));
      }
    }

    /* ---- the shown position chases the knob: every change is seen happening */
    function tick(ts){
      var dt = last ? Math.min(50, ts - last) : 16; last = ts;
      var d = view.target - view.v;
      if(Math.abs(d) < 0.002){ view.v = view.target; raf = 0; last = 0; draw(); return; }
      var step = d * (1 - Math.exp(-dt / 110)), min = 0.012 * dt / 16;
      view.v += Math.abs(step) < min ? Math.sign(d) * Math.min(Math.abs(d), min) : step;
      draw();
      raf = requestAnimationFrame(tick);
    }
    function fadeOut(){
      var c = svg.cloneNode(true); c.removeAttribute('id'); c.setAttribute('aria-hidden', 'true'); c.classList.add('pe-fade');
      pic.appendChild(c);
      var done = function(){ if(c.parentNode) c.parentNode.removeChild(c); };
      if(c.animate){ var an = c.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 240, easing: 'linear' }); an.onfinish = done; setTimeout(done, 450); } else done();
    }
    function go(v){
      view.target = v; cur.v = v;
      if(K.reduced() || !window.requestAnimationFrame || !onScreen){ if(raf){ cancelAnimationFrame(raf); raf = 0; } var was = view.v; view.v = v; if(Math.abs(was - v) > 0.3 && onScreen) fadeOut(); draw(); return; }
      if(!raf){ last = 0; raf = requestAnimationFrame(tick); }
    }
    function jumpTo(v, fade){ if(raf){ cancelAnimationFrame(raf); raf = 0; } if(fade && onScreen) fadeOut(); view.v = view.target = cur.v = v; if(handle) handle.value(v, false); }

    /* ---- tabs */
    function setTab(id, user){
      var sc = scenes.filter(function(x){ return x.id === id; })[0];
      if(!sc) return;
      if(raf){ cancelAnimationFrame(raf); raf = 0; }
      cur = sc; view.v = view.target = sc.v; wKey = ''; railKey = '';
      tabs.value(sc.id); head.purpose(sc.purpose); trail._h = null;
      main.setAttribute('data-scene', sc.id);
      layout(); metrics(); ctrlDirty(); buildArt(); railBuild(); makeHandle(); makePills(); draw(); refHtml();
      if(user){ try{ history.replaceState(null, '', location.pathname + location.search + '#explore/' + sc.id); }catch(e){} say(sc.tab + '. ' + stepText(view.v)); }
      if(cue && cue.active()){ cue.hide(false); makeCue(); }
    }

    /* ---- the first visit cue and "Show me how" */
    function makeCue(){
      var p = cur.route.at(view.target);
      cue = K.cue(layer, { key: 'anp-pathways', text: cur.cue, side: p[0] - (E.X0 || 0) > E.W * 0.55 ? 'left' : 'right', at: function(){ var q = cur.route.at(view.target); return [q[0] - (E.X0 || 0), q[1]]; } });
      cue.show(); ctrlDirty();
      placeLabels(cur.labels(cur.state(view.v, cur.br), E));
      setTimeout(function(){ if(cue && cue.active()){ ctrlDirty(); draw(); } }, 450);   // once the cue has settled, labels move clear of it
    }
    function hideCue(used){ if(cue && cue.active()){ cue.hide(used); ctrlDirty(); } }
    var tour = K.tour({ key: 'anp-pathways', label: 'Show me how', steps: [
      { id: 'drag', text: 'Drag along the route. Each step happens as it arrives.', target: function(){ return handle ? handle.knob : pic; } },
      { id: 'why', text: 'The line below says why each step causes the next.', target: function(){ return cause.el; } }],
      onClose: function(had){ if(had) try{ head.how.focus({ preventScroll: true }); }catch(e){} } });
    function tourDid(id){ if(tour.active()) tour.did(id); }
    function startTour(){ hideCue(false); tour.start(true); }

    /* ---- "?" for this screen */
    var ref = document.createElement('div'); ref.className = 'ls-sec pe-ref';
    var NOTE = {
      heart: 'Blue and red are the course’s colors for oxygen poor and oxygen rich blood; real blood is never blue, and blood coming back from the body still carries about 75 percent of its oxygen. Only the route through one lung is drawn; the other lung works the same way. “Stop air” stands for any time no fresh air reaches the alveoli (choking, not breathing): the heart still pumps and blood still flows through the lungs, but it picks up no new oxygen, so the body cells get less than they need.',
      reflex: 'The spinal cord is drawn enlarged beside the thigh to show the arc; the knee jerk runs through the cord segments L2 to L4, which lie inside the backbone at about the T12 and L1 vertebrae (marked), because the cord is shorter than the backbone. One sensory and one motor neuron stand for many. At the same time the hamstrings relax through an inhibitory interneuron, which is not drawn. Cutting a root after the signal has passed does not undo that kick; the next signal stops at the cut.',
      hormone: 'The hypothalamus and pituitary are enlarged in the circle. One blood vessel stands for the whole circulation: ACTH and cortisol travel through the heart and arteries to every organ. Cortisol also damps inflammation, which is not drawn. A damaged adrenal cortex is what happens in Addison disease: with cortisol low, nothing brakes the pituitary and ACTH rises very high. A damaged pituitary leaves no ACTH, so the adrenal cortex makes no cortisol, and without cortisol’s brake CRH rises.',
      synapse: 'A synapse between two neurons with an excitatory neurotransmitter. One EPSP is far too small to reach threshold alone; two neighboring synapses fire at the same moment here, so their EPSPs add at the trigger zone (spatial summation). The blockers act on every synapse of the cell, as a drug in the fluid around it would.'
    };
    function refHtml(){
      var p = cur.p, t = topicOf(p.topic), B = o.base || '../';
      ref.innerHTML = '<h3 class="ls-h">' + esc(p.title) + '</h3><p>' + p.intro + '</p>' +
        '<p class="ls-sub">Drag the ' + esc(cur.thing) + ' along the route, or use the arrow keys on it. Each step happens as it arrives; the list names the steps in order. After one full run you can break a part and send it again. Pictures are drawn to show the idea, not to scale.</p>' +
        (NOTE[cur.id] ? '<p class="ls-sub">' + NOTE[cur.id] + '</p>' : '') +
        '<p><button type="button" class="btn-outline pe-ref-q" data-p="' + esc(p.id) + '">Test yourself on this pathway</button></p>' +
        (t && t.built ? '<p>Topic: <a href="' + esc(B + 'lessons/' + t.id + '.html') + '">' + esc(t.title) + '</a> · <a href="' + esc(B + 'notes/' + t.id + '.html') + '">notes</a></p>' : '') +
        '<p><button type="button" class="tk2-link pe-ref-how">Show me how</button></p>';
    }
    function topicOf(id){ var ts = (window.AnpCurriculum || {}).topics || []; return ts.filter(function(x){ return x.id === id; })[0] || null; }
    ref.addEventListener('click', function(e){
      var q = e.target.closest('.pe-ref-q'); if(q){ if(o.studio) o.studio.close(); if(o.onQuiz) o.onQuiz(q.getAttribute('data-p')); return; }
      if(e.target.closest('.pe-ref-how')){ if(o.studio) o.studio.close(); setTimeout(startTour, 60); }
    });

    /* ---- sizes */
    var rz = 0, lastW = 0;
    function resized(){ clearTimeout(rz); rz = setTimeout(function(){ if(!stage.isConnected || !pic.offsetWidth) return; var w = pic.offsetWidth; if(w === lastW) { placePills(); if(handle) handle.place(); return; } lastW = w; layout(); metrics(); ctrlDirty(); buildArt(); draw(); placePills(); if(handle) handle.place(); if(cue && cue.active()) cue.place(); }, 60); }
    if(window.ResizeObserver){ var ro = new ResizeObserver(resized); ro.observe(pic); }
    window.addEventListener('resize', resized);

    setTab(cur.id, false);
    var started = false;
    function shown(on){
      onScreen = !!on;
      if(!on){ if(raf){ cancelAnimationFrame(raf); raf = 0; view.v = view.target; } hideCue(false); if(tour.active()) tour.stop(); return; }
      setTimeout(function(){ lastW = 0; resized(); if(!started){ started = true; makeCue(); } }, 30);
    }
    var api = {
      stage: stage, ref: ref, shown: shown,
      tab: function(v){ if(v === undefined) return cur.id; setTab(v, false); },
      pathOf: function(id){ var sc = scenes.filter(function(x){ return x.id === id; })[0]; return sc ? sc.path : null; },
      /* tabFor({ tab } | { path } | { topic, chapter, topicOf }) -> a screen id or null */
      tabFor: function(q){
        var hit = null;
        scenes.forEach(function(sc){
          if(hit) return;
          if(q.tab && q.tab === sc.id) hit = sc.id;
          else if(q.path && q.path === sc.path) hit = sc.id;
          else if(q.topic && q.topic === sc.p.topic) hit = sc.id;
          else if(q.chapter && q.topicOf){ var t = q.topicOf(sc.p.topic); if(t && t.chapter === q.chapter) hit = sc.id; }
        });
        return hit;
      },
      _scenes: scenes, _view: view, _go: go,
      _break: function(id){ var b = (cur.breaks || []).filter(function(x){ return x.id === id; })[0]; if(b){ try{ localStorage.setItem('pe-end:' + cur.id, '1'); }catch(e){} breakIt(b); } },
      _reset: function(){ reset.click(); },
      _lim: function(){ return lim(); },
      _targets: function(){ return (cur.breaks || []).map(function(b){ return { id: b.id, at: b.mark ? b.mark(E.L) : b.pass ? geoTarget(b) : cur.route.at(b.cutMin || b.stopV) }; }); },
      _x0: function(){ return E.X0 || 0; },
      _valves: function(){ return cur.valves ? cur.valves(E.L) : []; },
      _st: function(){ return { st: lastSt, words: cur.words(lastSt).map(function(p){ return p.t; }), labels: [].map.call(labs.querySelectorAll('.pe-lab'), function(g){ return g.getAttribute('data-lab'); }), tok: tok.getAttribute('class') }; },
      _frame: function(v){ if(raf){ cancelAnimationFrame(raf); raf = 0; } view.v = view.target = cur.v = v; if(handle) handle.value(v, false); draw(); }   // the frame tests draw one moment
    };
    window.AnpPathExplore.current = api;
    return api;
  }

  window.AnpPathExplore = { build: build, SCENES: SCENES };
})();
