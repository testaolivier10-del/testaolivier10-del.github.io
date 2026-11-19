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

  /* ------------------------------------------------------------------ 1. Heart: blood through the heart and body */
  (function(){
    var DE = '4F6FA8', OX = 'D2452A';
    var segs = [
      [[282, 238], [286, 283]],
      [[286, 283], [296, 320], [300, 345]],
      [[300, 345], [322, 330], [338, 300], [341, 262]],
      [[341, 262], [341, 190], [328, 160], [290, 140], [250, 128]],
      [[250, 128], [218, 112], [196, 88], [205, 62], [225, 56]],
      [[225, 56], [252, 60], [276, 82], [292, 112], [330, 150], [400, 190], [430, 214], [440, 236]],
      [[440, 236], [444, 283]],
      [[444, 283], [434, 320], [422, 350]],
      [[422, 350], [396, 330], [382, 298], [379, 262]],
      [[379, 262], [379, 180], [400, 154], [470, 152], [570, 154], [602, 186], [602, 300]],
      [[602, 300], [602, 455], [576, 488], [400, 488]],
      [[400, 488], [232, 488], [202, 460], [202, 380]],
      [[202, 380], [202, 300], [222, 268], [255, 250], [282, 238]]
    ];
    var R0 = new Route(segs);
    var ALV = [[200, 50], [222, 36], [246, 40], [266, 56], [214, 76], [240, 74], [264, 86], [190, 98], [282, 66]];
    var CELLS = [[250, 515], [312, 512], [374, 516], [436, 513], [498, 516], [560, 514], [282, 462], [344, 460], [406, 463], [468, 460], [530, 462], [60, 515], [122, 512], [184, 516], [646, 513], [700, 516], [96, 462], [656, 462]];
    // the colour the blood cell is drawn: loads in the lung capillaries (step 6's words come once it is red), unloads in the body
    function ox(v, br){ var up = br ? 0 : ramp(v, 4.9, 5.6); return up * (1 - ramp(v, 10.9, 11.6)); }
    function tube(pts, cls, w){ return '<path class="pe-vw" style="stroke-width:' + w + 'px" d="' + P(pts) + '"/><path class="pe-vb ' + cls + '" style="stroke-width:' + (w - 7) + 'px" d="' + P(pts) + '"/>'; }
    function leaflet(x, y, dx, cls){ return '<path class="pe-leaf ' + cls + '" d="M' + x + ',' + y + 'l' + dx + ',0"/>'; }
    SCENES.push({
      id: 'heart', tab: 'Heart', short: 'Heart', path: 'blood-flow',
      purpose: 'Carry one blood cell through the heart, lungs and body',
      cue: 'Drag the blood cell', token: 'the blood cell', thing: 'blood cell',
      route: R0, last: 13, steps: 13, cycle: true,
      breaks: [{ id: 'air', at: 4.5, pass: true, place: [362, 30], off: [0, 1], tag: 'No fresh air', label: 'Stop air', aria: 'Stop fresh air reaching the lungs', name: 'No fresh air in the lungs', step: 5 }],
      take: 'Right heart pumps to the lungs, left heart to the body.',
      art: function(E){
        var s = '<defs><radialGradient id="pe-lung" cx="0.45" cy="0.4" r="0.75"><stop offset="0" stop-color="#F9C9CB"/><stop offset="1" stop-color="#E9969C"/></radialGradient>' +
          '<radialGradient id="pe-myo" cx="0.4" cy="0.35" r="0.85"><stop offset="0" stop-color="#D4685A"/><stop offset="0.7" stop-color="#B2463A"/><stop offset="1" stop-color="#86281F"/></radialGradient>' +
          '<linearGradient id="pe-tis" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F3D5C6"/><stop offset="1" stop-color="#E9BFA9"/></linearGradient></defs>';
        s += '<rect class="pe-bg" x="0" y="0" width="' + W + '" height="' + H + '"/>';
        // lungs, trachea and bronchi
        var lungL = 'M330,40 C320,16 290,8 262,12 C210,20 168,58 158,108 C154,130 170,140 196,138 C240,134 290,132 322,130 C336,110 338,70 330,40 Z';
        s += '<path class="pe-lung" d="' + lungL + '"/><path class="pe-lung" transform="translate(724,0) scale(-1,1)" d="' + lungL + '"/>';
        s += '<path class="pe-trach" d="M362,0 V40 M362,40 L326,64 M362,40 L398,64"/><path class="pe-trach-r" d="M354,8 h16 M354,18 h16 M354,28 h16"/>';
        ALV.forEach(function(a, i){ s += '<circle class="pe-alv" data-r="alv' + i + '" cx="' + a[0] + '" cy="' + a[1] + '" r="13"/>'; });
        // body tissue with its cells
        s += '<path class="pe-tissue" d="M0,448 H720 V540 H0 Z"/>';
        CELLS.forEach(function(c, i){ s += '<g data-r="cell' + i + '"><rect class="pe-tcell" x="' + (c[0] - 27) + '" y="' + (c[1] - 19) + '" width="54" height="38" rx="14"/><circle class="pe-tnuc" cx="' + (c[0] - 6) + '" cy="' + c[1] + '" r="6"/></g>'; });
        // vessels behind the heart: the right pulmonary veins (to the left atrium), the other lung's vessels
        s += tube([[292, 112], [330, 150], [400, 190], [430, 214], [440, 232]], 'is-ox', 18);
        // pulmonary trunk and artery, the capillary loop in the lung
        s += tube([[341, 290], [341, 190], [328, 160], [290, 140], [250, 128], [222, 114]], 'is-de', 22);
        s += '<path class="pe-cap is-de" d="' + P(segs[4]) + '"/><path class="pe-cap is-ox" data-r="pcap2" d="' + P(segs[5].slice(0, 4)) + '"/>';
        // systemic: aorta, arteries down to the body, capillaries, veins back
        s += tube([[379, 290], [379, 180], [400, 154], [470, 152], [570, 154], [602, 186], [602, 455], [578, 486]], 'is-ox', 24);
        s += '<path class="pe-cap is-ox" d="M578,488 H400"/><path class="pe-cap is-de" d="M400,488 H232"/>';
        s += tube([[232, 488], [202, 460], [202, 300], [222, 268], [252, 252]], 'is-de', 24);
        s += tube([[272, 150], [274, 205]], 'is-de', 20);   // superior vena cava, from the head and arms
        // the heart: muscle, then the four chambers
        s += '<path class="pe-myo" d="M246,198 C220,214 222,290 232,330 C250,396 330,444 430,432 C482,424 508,372 502,300 C498,252 492,214 472,200 C440,190 300,188 246,198 Z"/>';
        s += '<ellipse class="pe-cav is-de" cx="284" cy="240" rx="42" ry="36"/><ellipse class="pe-cav is-ox" cx="444" cy="238" rx="40" ry="33"/>';
        s += '<path class="pe-cav is-de" data-r="rv" d="M254,290 C250,340 278,392 330,406 C346,380 350,330 350,290 Z"/>';
        s += '<path class="pe-cav is-ox" data-r="lv" d="M372,290 C372,340 380,394 420,412 C462,398 478,340 472,290 Z"/>';
        s += tube([[341, 296], [341, 250]], 'is-de', 22) + tube([[379, 296], [379, 250]], 'is-ox', 24);
        // valves: two leaflets each, hinged on the ring
        s += '<path class="pe-ring" d="M256,283 H316 M416,283 H474"/>';
        s += '<g data-r="tri">' + leaflet(260, 283, 26, 'a') + leaflet(312, 283, -26, 'b') + '</g>';
        s += '<g data-r="mit">' + leaflet(418, 283, 27, 'a') + leaflet(470, 283, -27, 'b') + '</g>';
        s += '<g data-r="pv">' + leaflet(332, 262, 9, 'a') + leaflet(350, 262, -9, 'b') + '</g>';
        s += '<g data-r="av">' + leaflet(369, 262, 10, 'a') + leaflet(389, 262, -10, 'b') + '</g>';
        s += '<g data-r="cuts"></g><g data-r="gas"></g>';
        return s;
      },
      fxInit: function(fx, R){
        var g = R.gas, h = '';
        for(var i = 0; i < 6; i++) h += '<circle class="pe-o2m" r="5.5" cx="-50" cy="-50"/>';
        for(i = 0; i < 4; i++) h += '<circle class="pe-co2m" r="5" cx="-50" cy="-50"/>';
        g.innerHTML = h;
      },
      state: function(v, br){
        var noAir = !!(br && br.id === 'air');
        // a step's words show from 0.12 before its place, except a ventricle's: they come as its inlet valve starts to shut
        var k = Math.min(12, Math.floor(v + 0.12)); if(v >= 1.71 && v < 1.88) k = 2; if(v >= 7.71 && v < 7.88) k = 8;
        var st = { v: v, lap: v >= 12.9, k: v >= 12.9 ? 0 : k, stop: null, noAir: noAir };
        st.ox = ox(v, noAir);
        // each step's words show from 0.12 before it (k = floor(v + 0.12)); its event is fully drawn by then and holds
        // through its words, and the next event happens in the short band before the next words
        st.tri = bump(v, 0.58, 0.88, 1.69, 1.86); st.rvSq = bump(v, 1.69, 1.95, 3.3, 3.7); st.pv = bump(v, 2.6, 2.88, 3.88, 4.1);
        st.mit = bump(v, 6.58, 6.88, 7.69, 7.86); st.lvSq = bump(v, 7.69, 7.95, 9.3, 9.7); st.av = bump(v, 8.6, 8.88, 9.88, 10.1);
        st.lungX = bump(v, 4.7, 4.88, 5.88, 6.05);   // exchange in the lung: O2 in, CO2 out
        st.bodyX = bump(v, 10.7, 10.88, 11.88, 12.05);
        st.lungDone = noAir ? 0 : ramp(v, 4.6, 5.2);
        return st;
      },
      fails: function(st){ var f = []; if(st.noAir){ if(st.v >= 4.88 || st.lap) f.push(5); if(st.v >= 10.88 || st.lap) f.push(11); } return f; },
      paint: function(R, st, E){
        function open(g, t, ang){ var a = g.childNodes[0], b = g.childNodes[1]; var d = t * ang; a.setAttribute('transform', 'rotate(' + f1(d) + ' ' + a.getAttribute('d').match(/M([\d.]+),([\d.]+)/).slice(1).join(' ') + ')'); b.setAttribute('transform', 'rotate(' + f1(-d) + ' ' + b.getAttribute('d').match(/M([\d.]+),([\d.]+)/).slice(1).join(' ') + ')'); }
        open(R.tri, st.tri, 68); open(R.mit, st.mit, 68); open(R.pv, st.pv, -70); open(R.av, st.av, -70);
        R.rv.setAttribute('transform', st.rvSq ? 'translate(302,330) scale(' + (1 - st.rvSq * 0.2).toFixed(3) + ') translate(-302,-330)' : '');
        R.lv.setAttribute('transform', st.lvSq ? 'translate(422,335) scale(' + (1 - st.lvSq * 0.2).toFixed(3) + ') translate(-422,-335)' : '');
        ALV.forEach(function(a, i){ R['alv' + i].setAttribute('class', 'pe-alv' + (st.noAir ? ' is-stale' : '')); });
        // gas: O2 from the alveoli into the cell, CO2 out (lungs); O2 out to the cells, CO2 in (body)
        var p = this.route.at(st.v), kids = R.gas.childNodes, i, t;
        for(i = 0; i < 6; i++){
          var c = kids[i], a = ALV[i], b = CELLS[i];
          if(st.lungX > 0 && !st.noAir){ t = ramp(st.v, 4.88 + i * 0.04, 5.6); c.setAttribute('cx', f1(lerp(a[0], p[0], t))); c.setAttribute('cy', f1(lerp(a[1], p[1], t))); c.style.opacity = f1(st.lungX); }
          else if(st.bodyX > 0 && (!st.noAir ? true : i < 1)){ t = ramp(st.v, 10.88 + i * 0.04, 11.6); c.setAttribute('cx', f1(lerp(p[0], b[0], t))); c.setAttribute('cy', f1(lerp(p[1], b[1], t))); c.style.opacity = f1(st.bodyX); }
          else c.style.opacity = '0';
        }
        for(i = 0; i < 4; i++){
          var d = kids[6 + i], a2 = ALV[5 + i % 4], b2 = CELLS[6 + i];
          if(st.lungX > 0 && !st.noAir){ t = ramp(st.v, 4.88 + i * 0.05, 5.6); d.setAttribute('cx', f1(lerp(p[0], a2[0], t))); d.setAttribute('cy', f1(lerp(p[1], a2[1], t))); d.style.opacity = f1(st.lungX); }
          else if(st.bodyX > 0){ t = ramp(st.v, 10.88 + i * 0.05, 11.6); d.setAttribute('cx', f1(lerp(b2[0], p[0], t))); d.setAttribute('cy', f1(lerp(b2[1], p[1], t))); d.style.opacity = f1(st.bodyX); }
          else d.style.opacity = '0';
        }
        // the cells that got O2 this lap look fed
        for(i = 0; i < CELLS.length; i++) R['cell' + i].setAttribute('class', st.v >= 11.4 && !st.lap && (!st.noAir || i < 1) ? 'is-fed' : '');
      },
      tokenRole: function(st){ return st.ox > 0.5 ? 'o2' : 'de'; },
      tokenFill: function(st){ return mix(DE, OX, st.ox); },
      trailFor: function(st){ return st.noAir ? [[0, 13, 'de']] : [[0, 4.95, 'de'], [4.95, 10.95, 'o2'], [10.95, 13, 'de']]; },
      labels: function(st, E){
        var wide = E.k >= 0.75, L = [
          { key: 'lungs', text: 'Lungs', role: 'air', at: [470, 60], side: ['r', 'u'] },
          { key: 'body', text: 'Body cells', role: 'mus', at: [160, 500], side: ['l', 'u'] }
        ];
        var CUR = [
          ['Right atrium', [284, 236], 'de'], ['Tricuspid valve', [286, 283], 'valve'], ['Right ventricle', [300, 352], 'de'], ['Pulmonary valve', [341, 262], 'valve'],
          ['Pulmonary artery', [250, 128], 'de'], ['Lung capillaries', [236, 60], st.noAir ? 'de' : 'o2'], ['Left atrium', [444, 236], st.noAir ? 'de' : 'o2'], ['Mitral valve', [444, 283], 'valve'],
          ['Left ventricle', [422, 352], st.noAir ? 'de' : 'o2'], ['Aortic valve', [379, 262], 'valve'], ['Aorta', [602, 300], st.noAir ? 'de' : 'o2'], ['Body capillaries', [400, 488], 'de'], ['Vena cava', [202, 380], 'de']
        ], c = CUR[st.k];
        if(wide){
          [['Right atrium', [270, 226], 'de'], ['Right ventricle', [290, 370], 'de'], ['Left atrium', [458, 226], 'o2'], ['Left ventricle', [430, 372], 'o2']].forEach(function(x){
            if(x[0] !== c[0]) L.push({ key: x[0], text: x[0], role: st.noAir && x[2] === 'o2' ? 'de' : x[2], at: x[1], side: ['l', 'r', 'd'] });
          });
        }
        L.push({ key: 'cur', text: c[0], role: c[2], at: c[1], side: ['l', 'r', 'u', 'd'], lead: true, strong: true });
        if(st.lungX > 0.2 && !st.noAir){ L.push({ key: 'o2', text: 'O₂ in', role: 'o2', at: [190, 30], side: ['l', 'u'] }); }
        if(st.bodyX > 0.2){ L.push({ key: 'o2b', text: st.noAir ? 'Less O₂ out' : 'O₂ out', role: st.noAir ? 'bad' : 'o2', at: [470, 470], side: ['u', 'r'] }); }
        return L;
      },
      words: function(st){
        var na = st.noAir;
        if(st.lap) return [{ t: 'Body', role: 'de' }, { t: 'veins', role: 'de' }, { t: 'back to the right atrium', role: 'de' }];
        return [
          [{ t: 'Blood from the body', role: 'de' }, { t: 'right atrium', role: 'de' }],
          [{ t: 'Atrium fuller than ventricle', role: 'de' }, { t: 'tricuspid valve opens', role: 'valve' }],
          [{ t: 'Right ventricle squeezes', role: 'mus' }, { t: 'tricuspid valve shuts', role: 'valve' }, { t: 'blood pushed up', role: 'de' }],
          [{ t: 'Pressure opens the pulmonary valve', role: 'valve' }, { t: 'blood to the lungs', role: 'de' }],
          [{ t: 'Pulmonary artery', role: 'de' }, { t: 'low O₂ blood to the lungs', say: 'low oxygen blood to the lungs', role: 'de' }],
          na ? [{ t: 'No fresh air', role: 'bad' }, { t: 'blood picks up no new O₂', say: 'blood picks up no new oxygen', role: 'de' }]
             : [{ t: 'Air in the alveoli', role: 'air' }, { t: 'O₂ in, CO₂ out', say: 'oxygen in, carbon dioxide out', role: 'o2' }],
          [{ t: 'Pulmonary veins', role: na ? 'de' : 'o2' }, { t: na ? 'low O₂ blood to the left atrium' : 'O₂ rich blood to the left atrium', say: na ? 'low oxygen blood to the left atrium' : 'oxygen rich blood to the left atrium', role: na ? 'de' : 'o2' }],
          [{ t: 'Atrium fuller than ventricle', role: na ? 'de' : 'o2' }, { t: 'mitral valve opens', role: 'valve' }],
          [{ t: 'Left ventricle squeezes', role: 'mus' }, { t: 'mitral valve shuts', role: 'valve' }, { t: 'pressure builds', role: na ? 'de' : 'o2' }],
          [{ t: 'Pressure opens the aortic valve', role: 'valve' }, { t: 'blood into the aorta', role: na ? 'de' : 'o2' }],
          [{ t: 'Aorta and arteries', role: na ? 'de' : 'o2' }, { t: na ? 'low O₂ blood to every organ' : 'O₂ rich blood to every organ', say: na ? 'low oxygen blood to every organ' : 'oxygen rich blood to every organ', role: na ? 'de' : 'o2' }],
          na ? [{ t: 'Little O₂ arrives', say: 'little oxygen arrives', role: 'bad' }, { t: 'body cells get less O₂', say: 'body cells get less oxygen', role: 'bad' }]
             : [{ t: 'Body cells take O₂', say: 'body cells take oxygen', role: 'o2' }, { t: 'blood picks up CO₂', say: 'blood picks up carbon dioxide', role: 'de' }],
          [{ t: 'Veins', role: 'de' }, { t: 'low O₂ blood back to the heart', say: 'low oxygen blood back to the heart', role: 'de' }]
        ][st.k];
      },
      cut: function(b){ return '<g class="pe-cut"><rect class="pe-plug" x="350" y="6" width="24" height="30" rx="5"/><path class="pe-cutend" d="M346,12 l32,18 M378,12 l-32,18"/></g>'; }
    });
  })();

  /* ------------------------------------------------------------------ 2. Reflex arc: the knee jerk */
  (function(){
    var KNEE = [404, 334];   // the lower leg turns here
    function rot(p, a){ var c = Math.cos(a), s = Math.sin(a), x = p[0] - KNEE[0], y = p[1] - KNEE[1]; return [KNEE[0] + x * c - y * s, KNEE[1] + x * s + y * c]; }
    var SENS = [[290, 296], [276, 282], [300, 214], [350, 178], [385, 120], [405, 92], [440, 93], [465, 96], [494, 116], [503, 150], [505, 172]];
    var MOT = [[516, 186], [482, 204], [458, 206], [392, 198], [356, 192], [307, 225], [264, 266], [226, 296]];
    var segs = [
      [[441, 362], [438, 332], [420, 302], [360, 292], [290, 296]],
      [[290, 296], [276, 282], [300, 214], [350, 178], [385, 120], [405, 92]],
      [[405, 92], [440, 93], [465, 96], [494, 116], [503, 150], [505, 172]],
      [[505, 172], [516, 186], [482, 204], [458, 206]],
      [[458, 206], [392, 198], [356, 192], [307, 225], [264, 266], [226, 296]],
      [[226, 296], [292, 299], [352, 296]]
    ];
    var R0 = new Route(segs);
    SCENES.push({
      id: 'reflex', tab: 'Reflex arc', short: 'Reflex', path: 'reflex-arc-knee',
      purpose: 'Send the knee jerk signal around the reflex arc',
      cue: 'Drag the signal', token: 'the signal', thing: 'signal',
      route: R0, last: 6,
      breaks: [
        { id: 'dorsal', at: 2.42, tag: 'Cut', label: 'Cut', aria: 'Cut the dorsal root', name: 'Dorsal root cut', step: 2 },
        { id: 'ventral', at: 3.62, off: [0, 1], tag: 'Cut', label: 'Cut', aria: 'Cut the ventral root', name: 'Ventral root cut', step: 4 }
      ],
      take: 'Receptor, sensory neuron, synapse, motor neuron, effector.',
      art: function(E){
        var s = '';
        s += '<defs><linearGradient id="pe-skin" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F6DCC8"/><stop offset="1" stop-color="#E8BFA4"/></linearGradient>' +
          '<linearGradient id="pe-mus" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#D86A57"/><stop offset="1" stop-color="#A9402F"/></linearGradient>' +
          '<linearGradient id="pe-shirt" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#7F95AE"/><stop offset="1" stop-color="#9DB1C6"/></linearGradient>' +
          '<radialGradient id="pe-wm" cx="0.45" cy="0.4" r="0.7"><stop offset="0" stop-color="#FFFDF7"/><stop offset="1" stop-color="#EDE2CF"/></radialGradient>' +
          '<radialGradient id="pe-gm" cx="0.5" cy="0.5" r="0.6"><stop offset="0" stop-color="#E9C9CF"/><stop offset="1" stop-color="#D5A7B0"/></radialGradient></defs>';
        s += '<rect class="pe-bg" x="0" y="0" width="' + W + '" height="' + H + '"/>';
        // the chair under the thigh
        s += '<path class="pe-chair" d="M0,404 H352 a10,10 0 0 1 0,20 H0 Z"/><path class="pe-chair-leg" d="M300,424 V540 M40,424 V540"/>';
        // the seated body: back and belly in a shirt, the backbone faint inside it, the lumbar part where the arc runs
        s += '<path class="pe-shirt" d="M0,0 H92 C104,80 118,170 122,250 C124,282 112,300 90,304 L0,306 Z"/>';
        // a window into the lower back: the stacked vertebrae with their discs; the lumbar one where the arc runs
        s += '<path class="pe-backwin" d="M8,30 C30,24 56,24 72,30 L72,290 C56,296 30,296 8,290 Z"/>';
        for(var v0 = 0; v0 < 8; v0++){ var vy = 38 + v0 * 32, vx = 20 + Math.sin(v0 / 7 * Math.PI) * 6; s += '<path class="pe-vert' + (v0 === 5 ? ' is-lum' : '') + '" d="M' + vx + ',' + vy + ' h30 a4,4 0 0 1 4,4 v16 a4,4 0 0 1 -4,4 h-30 a4,4 0 0 1 -4,-4 v-16 a4,4 0 0 1 4,-4 Z"/><path class="pe-disc" d="M' + (vx + 2) + ',' + (vy + 27) + ' h26"/>'; }
        // the lower leg (turns at the knee; its top is round about the knee so it turns cleanly)
        s += '<g data-r="leg"><path class="pe-skin" d="M360,334 A44,44 0 0 1 448,334 C450,410 448,460 452,494 C470,496 500,500 528,512 C538,520 534,534 520,534 L400,534 C380,532 374,520 372,500 C368,470 362,420 360,334 Z"/>' +
          '<path class="pe-bone" d="M382,350 C380,420 384,470 388,494 L408,494 C410,470 414,420 418,350 Z"/></g>';
        // thigh (skin), the femur and the quadriceps under it
        s += '<path class="pe-skin" d="M0,262 C120,252 300,258 392,266 C434,270 454,300 452,334 C450,366 420,392 384,396 C250,400 120,404 0,404 Z"/>';
        s += '<path class="pe-bone" d="M0,346 C120,340 300,338 376,336 C400,326 420,334 422,350 C420,368 398,372 380,362 C300,360 120,364 0,364 Z"/>';
        s += '<g data-r="quad"><path class="pe-mus" data-r="quadm" d="M10,274 C120,264 300,270 392,282 C410,288 418,300 414,312 C380,318 300,320 200,322 C120,324 40,322 10,320 Z"/>';
        for(var i = 0; i < 9; i++){ var x = 40 + i * 40; s += '<path class="pe-stria" d="M' + x + ',' + (276 - i * 0.3) + ' C' + (x + 12) + ',' + 292 + ' ' + (x + 8) + ',' + 306 + ' ' + (x + 18) + ',' + 318 + '"/>'; }
        s += '</g>';
        s += '<path class="pe-shirt" d="M0,240 C40,236 90,240 118,250 C124,282 112,300 90,304 L0,306 Z"/>';
        // muscle spindle and its sensory ending
        s += '<g data-r="spindle"><ellipse class="pe-spindle" cx="300" cy="298" rx="30" ry="7"/><path class="pe-anulo" data-r="anulo" d="M286,298 c2,-7 4,7 6,0 c2,-7 4,7 6,0 c2,-7 4,7 6,0 c2,-7 4,7 6,0"/></g>';
        // the quadriceps tendon, the patella and the patellar ligament
        s += '<path class="pe-tendon" d="M392,286 C412,292 428,302 436,314"/>';
        s += '<path class="pe-lig" data-r="lig" d="M438,334 C442,350 440,368 432,392"/>';
        s += '<ellipse class="pe-patella" data-r="pat" cx="438" cy="320" rx="12" ry="18"/>';
        // reflex hammer (a triangular rubber head on a handle)
        s += '<g data-r="hammer"><path class="pe-ham-h" d="M478,370 L548,500"/><path class="pe-ham" d="M448,368 L494,346 L500,380 Z"/></g>';
        // the lumbar part of the backbone, enlarged: where the arc meets the cord
        s += '<path class="pe-zoom" d="M58,198 L452,96 M58,222 L470,214"/>';
        // spinal cord, cross section
        s += '<g class="pe-cord"><ellipse class="pe-wm" cx="532" cy="150" rx="104" ry="78"/>' +
          '<path class="pe-gm" d="M532,118 C520,96 498,84 484,92 C478,104 494,118 508,128 C504,140 496,152 486,166 C474,184 486,204 508,202 C522,198 528,186 532,176 C536,186 542,198 556,202 C578,204 590,184 578,166 C568,152 560,140 556,128 C570,118 586,104 580,92 C566,84 544,96 532,118 Z"/>' +
          '<circle class="pe-canal" cx="532" cy="152" r="4"/></g>';
        // the nerve: a sheath that holds both neurons, then splitting into the two roots
        s += '<path class="pe-sheath" d="' + P([[262, 268], [304, 220], [352, 186], [360, 186]]) + '"/>';
        s += '<path class="pe-root" d="' + P([[352, 184], [384, 124], [405, 92], [440, 93], [470, 98]]) + '"/>';
        s += '<path class="pe-root" d="' + P([[352, 188], [392, 198], [458, 206], [486, 202]]) + '"/>';
        s += '<ellipse class="pe-drg" cx="405" cy="92" rx="20" ry="13"/>';
        // the two neurons, drawn whole
        s += '<path class="pe-aff" data-r="aff" d="' + P(SENS) + '"/><circle class="pe-aff-soma" cx="405" cy="92" r="6.5"/>';
        s += '<path class="pe-eff" data-r="eff" d="' + P(MOT) + '"/><path class="pe-eff-soma" d="M516,186 l-9,-11 l13,2 l6,-9 l3,13 l11,4 l-12,6 l-1,10 l-8,-8 Z"/>';
        // nerve endings in the muscle
        s += '<path class="pe-eff" d="M226,296 l-12,8 M226,296 l-4,12 M226,296 l10,10"/>';
        s += '<g data-r="syn"><circle class="pe-syn" cx="505" cy="172" r="5"/></g>';
        // cuts (drawn when made)
        s += '<g data-r="cuts"></g>';
        return s;
      },
      state: function(v, br){
        var st = { v: v, k: Math.min(6, Math.floor(v + 0.12)), stop: null };
        if(br && v >= Math.min(br.at - 0.02, br.step - 0.12)) st.stop = br;
        st.kick = st.stop ? 0 : ramp(v, 5.6, 5.88);
        st.squeeze = st.stop ? 0 : ramp(v, 5.45, 5.8);
        st.stretch = 1 - ramp(v, 0.88, 1.3);
        st.fire = bump(v, 0.7, 0.88, 1.88, 2.1);
        st.synOn = br && br.id === 'dorsal' ? 0 : bump(v, 2.7, 2.88, 3.88, 4.1);
        st.motor = v >= 3 && !(st.stop && st.stop.id === 'dorsal');
        st.hit = 1 - ramp(v, 0, 0.45);
        return st;
      },
      paint: function(R, st, E){
        var a = -st.kick * 28 * Math.PI / 180;
        R.leg.setAttribute('transform', 'rotate(' + f1(a * 180 / Math.PI) + ' ' + KNEE[0] + ' ' + KNEE[1] + ')');
        var p0 = [438, 336], p1 = rot([432, 392], a);
        R.lig.setAttribute('d', 'M' + f1(p0[0]) + ',' + f1(p0[1]) + ' C' + f1(p0[0] + 4 - st.hit * 7) + ',' + f1(p0[1] + 18) + ' ' + f1(p1[0] + 8 - st.hit * 9) + ',' + f1(p1[1] - 22) + ' ' + f1(p1[0]) + ',' + f1(p1[1]));
        R.pat.setAttribute('cx', f1(438 + st.kick * 3)); R.pat.setAttribute('cy', f1(320 - st.kick * 6));
        // the hammer touches at the tap, then swings back out of the way
        var hb = 1 - st.hit;
        R.hammer.setAttribute('transform', 'translate(' + f1(hb * 92) + ',' + f1(hb * 30) + ') rotate(' + f1(hb * 18) + ' 548 500)');
        R.quadm.setAttribute('class', 'pe-mus' + (st.squeeze > 0.5 ? ' is-on' : ''));
        var sx = 1 - st.squeeze * 0.06, sy = 1 + st.squeeze * 0.16;
        R.quad.setAttribute('transform', st.squeeze ? 'translate(10,297) scale(' + sx.toFixed(3) + ',' + sy.toFixed(3) + ') translate(-10,-297)' : '');
        R.anulo.setAttribute('class', 'pe-anulo' + (st.fire > 0.3 ? ' is-on' : ''));
        R.spindle.setAttribute('transform', st.stretch ? 'translate(300,298) scale(' + (1 + st.stretch * 0.1).toFixed(3) + ',' + (1 - st.stretch * 0.15).toFixed(3) + ') translate(-300,-298)' : '');
        R.syn.setAttribute('class', st.synOn > 0.3 ? 'is-on' : '');
      },
      trail: [[0, 3, 'aff'], [3, 6, 'eff']],
      labels: function(st, E){
        var L = [
          { key: 'quad', text: 'Quadriceps', role: 'mus', at: [150, 282], side: ['u', 'd'] },
          { key: 'cord', text: 'Spinal cord', role: 'cord', at: [575, 90], side: ['u', 'r', 'd'] },
          { key: 'sens', text: 'Sensory neuron', role: 'aff', at: [330, 196], side: ['l', 'u', 'ul'], lead: true },
          { key: 'mot', text: 'Motor neuron', role: 'eff', at: [286, 246], side: ['d', 'dl', 'l'], lead: true }
        ];
        var cur = [
          { text: 'Tap', at: [446, 368], role: 'cord', side: ['r', 'd'] },
          { text: 'Muscle spindle', at: [300, 298], role: 'aff', side: ['d', 'u'] },
          { text: 'Dorsal root', at: [430, 92], role: 'aff', side: ['u', 'ul'] },
          { text: 'Synapse', at: [505, 172], role: 'cord', side: ['r', 'd'] },
          { text: 'Ventral root', at: [462, 206], role: 'eff', side: ['d', 'dr'] },
          { text: 'Neuromuscular junction', at: [226, 296], role: 'eff', side: ['d', 'dr', 'dl'] },
          { text: 'Knee straightens', at: [470, 470], role: 'mus', side: ['r', 'u'] }
        ][st.k];
        if(cur && !(st.k === 6 && st.kick < 0.9)) L.push({ key: 'cur', text: cur.text, role: cur.role, at: cur.at, side: cur.side, lead: true, strong: true });
        if(st.stop) L.push({ key: 'fail', text: 'No kick', role: 'bad', at: [470, 470], side: ['r', 'u'], strong: true });
        return L;
      },
      words: function(st){
        if(st.stop){
          return st.stop.id === 'dorsal' ? [{ t: 'Dorsal root cut', role: 'bad' }, { t: 'signal never reaches the cord', role: 'aff' }, { t: 'no kick', role: 'bad' }]
            : [{ t: 'Ventral root cut', role: 'bad' }, { t: 'signal never reaches the muscle', role: 'eff' }, { t: 'no kick', role: 'bad' }];
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
      cut: function(b, R, at){
        // two cut ends with a gap, across the root
        var p = at(b.at), q = at(b.at + 0.03), ang = Math.atan2(q[1] - p[1], q[0] - p[0]), c = Math.cos(ang), s = Math.sin(ang), g = 7;
        return '<g class="pe-cut"><path class="pe-cutgap" d="M' + f1(p[0] - c * g) + ',' + f1(p[1] - s * g) + 'L' + f1(p[0] + c * g) + ',' + f1(p[1] + s * g) + '"/>' +
          '<path class="pe-cutend" d="M' + f1(p[0] - c * g - s * 9) + ',' + f1(p[1] - s * g + c * 9) + 'L' + f1(p[0] - c * g + s * 9) + ',' + f1(p[1] - s * g - c * 9) + 'M' + f1(p[0] + c * g - s * 9) + ',' + f1(p[1] + s * g + c * 9) + 'L' + f1(p[0] + c * g + s * 9) + ',' + f1(p[1] + s * g - c * 9) + '"/></g>';
      },
      tokenRole: function(st){ return st.v < 3 ? 'aff' : 'eff'; },
      say: function(st){ return null; }
    });
  })();

  /* ------------------------------------------------------------------ 3. Hormones: the stress axis (HPA) */
  (function(){
    // left: the hypothalamus and pituitary, enlarged (a magnifier from the person's head); right: the person, with the
    // liver, kidneys and adrenal glands in a window. One blood vessel joins them.
    var C = [215, 235], RAD = 195;
    var segs = [
      [[120, 120], [160, 160], [184, 190], [206, 232], [215, 262]],
      [[215, 262], [230, 292], [242, 324]],
      [[242, 324], [252, 350], [258, 366]],
      [[258, 366], [306, 382], [360, 352], [408, 292], [470, 206], [540, 152], [580, 146], [580, 250], [572, 296], [556, 312]],
      [[556, 312], [578, 296], [584, 262], [566, 244], [540, 238]],
      [[540, 238], [582, 228], [584, 150], [540, 156], [470, 206], [400, 200], [330, 206], [306, 210]]
    ];
    var R0 = new Route(segs);
    function role(v){ return v < 0.8 ? 'aff' : v < 2.85 ? 'crh' : v < 3.9 ? 'acth' : 'cort'; }
    var SPOTS = [[226, 286], [236, 306], [230, 318], [244, 296], [222, 300], [240, 314]];   // CRH in the portal veins
    var BLOOD = [[470, 206], [508, 178], [580, 196], [440, 246], [496, 190], [580, 222]];   // ACTH in the blood
    SCENES.push({
      id: 'hormone', tab: 'Hormones', short: 'Hormones', path: 'hpa-axis',
      purpose: 'Follow stress from the brain to cortisol and back',
      cue: 'Drag the signal', token: 'the signal', thing: 'signal',
      route: R0, last: 6,
      breaks: [
        { id: 'pit', at: 2.92, place: [168, 410], off: [0, 1], tag: 'Damaged', label: 'Damage', aria: 'Damage the pituitary gland', name: 'Pituitary damaged', step: 3 },
        { id: 'adr', at: 4.0, place: [548, 330], off: [0, 1], tag: 'Damaged', label: 'Damage', aria: 'Damage the adrenal cortex', name: 'Adrenal cortex damaged', step: 4 }
      ],
      take: 'Three glands in a chain, braked by cortisol’s feedback.',
      art: function(E){
        var s = '<defs><radialGradient id="pe-brain" cx="0.45" cy="0.3" r="0.8"><stop offset="0" stop-color="#F3DCD8"/><stop offset="1" stop-color="#DDB0AC"/></radialGradient>' +
          '<linearGradient id="pe-skin2" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#EBC3A9"/><stop offset="0.5" stop-color="#F6DCC8"/><stop offset="1" stop-color="#E5B99E"/></linearGradient>' +
          '<linearGradient id="pe-shirt2" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#4F7B60"/><stop offset="0.5" stop-color="#6A9A7C"/><stop offset="1" stop-color="#4F7B60"/></linearGradient>' +
          '<radialGradient id="pe-liver" cx="0.4" cy="0.35" r="0.8"><stop offset="0" stop-color="#B5574A"/><stop offset="1" stop-color="#7E2F26"/></radialGradient>' +
          '<clipPath id="pe-mag"><circle cx="' + C[0] + '" cy="' + C[1] + '" r="' + RAD + '"/></clipPath></defs>';
        s += '<rect class="pe-bg" x="0" y="0" width="' + W + '" height="' + H + '"/>';
        // the person
        s += '<path class="pe-skin2" d="M556,104 h48 v40 h-48 Z"/>';
        s += '<path class="pe-shirt2" d="M500,160 C520,146 548,140 580,140 C612,140 640,146 660,160 C676,200 680,300 672,470 L488,470 C480,300 484,200 500,160 Z"/>';
        s += '<path class="pe-skin2" d="M500,162 C478,200 470,300 474,400 L492,402 C494,320 498,240 512,190 Z M660,162 C682,200 690,300 686,400 L668,402 C666,320 662,240 648,190 Z"/>';
        s += '<path class="pe-pants" d="M488,466 H672 L668,540 H588 L580,500 L572,540 H492 Z"/>';
        s += '<circle class="pe-skin2" cx="580" cy="66" r="44"/><path class="pe-hair" d="M536,62 C536,30 560,18 584,20 C610,22 626,40 624,62 C612,46 596,40 580,42 C562,44 548,52 536,62 Z"/>';
        s += '<circle class="pe-pitdot" cx="580" cy="74" r="7"/>';
        // the window into the trunk: liver, kidneys and adrenal glands, the main vessel
        s += '<path class="pe-win" d="M512,206 C540,196 620,196 648,206 L648,420 C620,428 540,428 512,420 Z"/>';
        s += '<path class="pe-liverS" data-r="liver" d="M518,226 C536,214 580,212 616,220 C630,226 624,250 604,256 C576,264 540,264 524,256 C510,248 508,234 518,226 Z"/>';
        s += '<path class="pe-kid" d="M532,330 C526,350 532,378 548,382 C562,384 568,360 566,342 C564,326 552,318 544,320 Z"/><path class="pe-kid" d="M628,330 C634,350 628,378 612,382 C598,384 592,360 594,342 C596,326 608,318 616,320 Z"/>';
        s += '<g data-r="adr"><path class="pe-adr" d="M532,320 C534,302 548,296 562,304 C568,310 566,322 556,326 C546,330 534,328 532,320 Z"/><path class="pe-adrm" d="M542,316 C544,308 552,307 556,312 C558,316 554,320 548,320 C545,320 542,318 542,316 Z"/>' +
          '<path class="pe-adr" d="M628,320 C626,302 612,296 598,304 C592,310 594,322 604,326 C614,330 626,328 628,320 Z"/></g>';
        s += '<path class="pe-bv" d="' + P([[580, 104], [580, 146], [580, 296], [572, 300], [556, 312]]) + '"/><path class="pe-bv" d="' + P([[580, 230], [566, 242], [540, 238]]) + '"/>';
        // the magnifier: lines from the head to the enlarged view
        s += '<path class="pe-zoom" d="M570,58 L180,42 M572,86 L330,400"/>';
        s += '<path class="pe-bv" d="' + P([[306, 382], [360, 352], [408, 292], [470, 206], [540, 152], [580, 146]]) + '"/><path class="pe-bv" d="' + P([[470, 206], [400, 200]]) + '"/>';
        s += '<circle class="pe-magbg" cx="' + C[0] + '" cy="' + C[1] + '" r="' + RAD + '"/>';
        s += '<g clip-path="url(#pe-mag)">';
        s += '<path class="pe-brain" d="M0,0 H430 V218 C380,236 320,246 270,250 C240,252 226,256 215,262 C204,256 190,252 160,250 C110,246 50,236 0,218 Z"/>';
        s += '<path class="pe-gyri" d="M60,90 c20,-14 30,10 50,-2 M90,150 c22,-10 34,12 56,0 M300,90 c16,12 36,4 48,18 M320,160 c18,-8 28,8 46,0"/>';
        s += '<path class="pe-vent" d="M208,120 C204,150 206,180 212,206 C218,180 222,150 218,120 Z"/>';
        s += '<path class="pe-hypo" data-r="hypo" d="M150,186 C170,168 260,168 282,186 C292,206 270,236 240,246 C226,250 204,250 190,246 C160,236 140,206 150,186 Z"/>';
        [[176, 196], [214, 184], [254, 198]].forEach(function(n){ s += '<path class="pe-crhn" d="M' + n[0] + ',' + n[1] + ' C' + n[0] + ',' + (n[1] + 30) + ' 214,236 215,258"/><circle class="pe-crhs" cx="' + n[0] + '" cy="' + n[1] + '" r="8"/>'; });
        s += '<path class="pe-stalk" d="M196,256 C200,290 208,320 212,340 L250,340 C246,318 240,288 234,256 Z"/>';
        s += '<path class="pe-plex" d="M200,262 c6,-8 12,8 18,0 c6,-8 12,8 18,0"/>';
        s += '<path class="pe-portal" d="M228,266 C232,290 238,316 244,340 M218,268 C222,292 230,318 236,342"/>';
        s += '<path class="pe-sella" d="M100,350 C110,420 150,440 215,440 C280,440 330,420 340,350"/>';
        s += '<g data-r="pit"><ellipse class="pe-pitp" cx="168" cy="372" rx="44" ry="38"/><ellipse class="pe-pita" data-r="pita" cx="262" cy="372" rx="64" ry="44"/>' +
          '<circle class="pe-cortico" cx="246" cy="362" r="6"/><circle class="pe-cortico" cx="270" cy="382" r="6"/><circle class="pe-cortico" cx="288" cy="360" r="6"/></g>';
        s += '<path class="pe-bv" d="' + P([[258, 366], [306, 382], [360, 352], [420, 280]]) + '"/><path class="pe-bv is-thin" d="' + P([[420, 200], [330, 206], [276, 214], [250, 222]]) + '"/>';
        s += '</g><circle class="pe-magring" cx="' + C[0] + '" cy="' + C[1] + '" r="' + RAD + '"/>';
        s += '<g data-r="mol"></g><g data-r="brk"></g><g data-r="cuts"></g>';
        return s;
      },
      fxInit: function(fx, R){
        var h = '';
        for(var i = 0; i < 6; i++) h += '<circle class="pe-mol is-crh" r="5.5" cx="-50" cy="-50"/>';
        for(i = 0; i < 6; i++) h += '<rect class="pe-mol is-acth" width="10" height="10" rx="2" x="-50" y="-50"/>';
        for(i = 0; i < 5; i++) h += '<path class="pe-mol is-glu" d="M0,-6 L5.2,-3 L5.2,3 L0,6 L-5.2,3 L-5.2,-3 Z" transform="translate(-50,-50)"/>';
        R.mol.innerHTML = h;
        R.brk.innerHTML = '<g class="pe-brake" data-r="b1"><circle cx="262" cy="240" r="13"/><path d="M255,240 h14"/></g><g class="pe-brake" data-r="b2"><circle cx="330" cy="338" r="13"/><path d="M323,338 h14"/></g>';
        R.b1 = R.brk.childNodes[0]; R.b2 = R.brk.childNodes[1];
      },
      state: function(v, br){
        var st = { v: v, k: Math.min(6, Math.floor(v + 0.12)), stop: null };
        if(br && v >= Math.min(br.at - 0.02, br.step - 0.12)) st.stop = br;
        var pit = br && br.id === 'pit', adr = br && br.id === 'adr';
        st.stress = bump(v, -1, 0, 0.5, 1.0);
        st.crh = ramp(v, 0.6, 0.88);                     // CRH released into the stalk's capillaries
        st.crhDown = ramp(v, 1.0, 2.2);                  // carried down the portal veins
        st.acth = pit ? 0 : ramp(v, 2.6, 2.88);
        st.cort = adr || pit ? 0 : ramp(v, 3.6, 3.88);
        st.glu = adr || pit ? 0 : ramp(v, 4.6, 4.88);
        st.brake = adr || pit ? 0 : ramp(v, 5.6, 5.88);
        st.pile = st.stop ? ramp(v, st.stop.step - 0.4, st.stop.step - 0.12) : 0;   // no cortisol, no brake: the hormone above the break builds up
        st.pit = pit; st.adr = adr;
        return st;
      },
      paint: function(R, st, E){
        var kids = R.mol.childNodes, i, p = this.route.at(st.v);
        // CRH: released at the hypothalamus, carried to the pituitary; more of it when the brake is gone (pituitary damaged)
        for(i = 0; i < 6; i++){
          var c = kids[i], on = i < 3 ? st.crh * (1 - st.brake * 0.6) : st.pit ? st.pile : 0, sp = SPOTS[i], t = i < 3 ? st.crhDown : 1;
          c.setAttribute('cx', f1(lerp(212 + i * 4, sp[0], t))); c.setAttribute('cy', f1(lerp(262, sp[1], t)));
          c.style.opacity = f1(on);
        }
        for(i = 0; i < 6; i++){
          var a = kids[6 + i], b = BLOOD[i], onA = i < 3 ? st.acth * (1 - st.brake * 0.6) : st.adr ? st.pile : 0;
          a.setAttribute('x', f1(b[0] - 5)); a.setAttribute('y', f1(b[1] - 5)); a.style.opacity = f1(onA);
        }
        for(i = 0; i < 5; i++){
          var g = kids[12 + i]; g.setAttribute('transform', 'translate(' + f1(530 + i * 20) + ',' + f1(280 + (i % 2) * 10 + st.glu * 8) + ')'); g.style.opacity = f1(st.glu);
        }
        R.hypo.setAttribute('class', 'pe-hypo' + (st.crh > 0.3 && st.brake < 0.5 ? ' is-on' : ''));
        R.pita.setAttribute('class', 'pe-pita' + (st.pit && st.stop ? ' is-dead' : st.pit ? ' is-dead' : st.acth > 0.3 && st.brake < 0.5 ? ' is-on' : ''));
        R.adr.setAttribute('class', st.adr ? 'is-dead' : st.cort > 0.3 ? 'is-on' : '');
        R.liver.setAttribute('class', 'pe-liverS' + (st.glu > 0.4 ? ' is-on' : ''));
        R.b1.style.opacity = R.b2.style.opacity = f1(st.brake);
      },
      cut: function(b){ return ''; },
      tokenRole: function(st){ return role(st.v); },
      trailFor: function(st){ return [[0, 0.8, 'aff'], [0.8, 2.85, 'crh'], [2.85, 3.9, 'acth'], [3.9, 6, 'cort']]; },
      labels: function(st, E){
        var L = [
          { key: 'hypo', text: 'Hypothalamus', role: 'crh', at: [150, 200], side: ['l', 'ul', 'u'], lead: true },
          { key: 'pit', text: 'Pituitary', role: 'acth', at: [262, 404], side: ['d', 'dl', 'dr'], lead: true },
          { key: 'adr', text: 'Adrenal cortex', role: 'cort', at: [612, 312], side: ['r', 'dr', 'd'], lead: true },
          { key: 'liver', text: 'Liver', role: 'glu', at: [622, 232], side: ['r', 'u'], lead: true }
        ];
        var CUR = [['Stress', 'aff'], ['CRH', 'crh'], ['CRH', 'crh'], ['ACTH', 'acth'], ['Cortisol', 'cort'], ['Glucose up', 'glu'], ['Cortisol brakes', 'cort']][st.k];
        if(st.stop) CUR = st.stop.id === 'pit' ? ['No ACTH', 'bad'] : ['No cortisol', 'bad'];
        var p = this.route.at(st.v);
        if(!(st.k === 5 && st.glu < 0.5) && !(st.k === 6 && st.brake < 0.5)) L.push({ key: 'cur', text: CUR[0], role: CUR[1], at: p, side: ['r', 'u', 'd', 'l'], lead: false, strong: true });
        if(st.stop && st.pile > 0.5) L.push({ key: 'pile', text: st.stop.id === 'pit' ? 'CRH builds up' : 'ACTH builds up', role: st.stop.id === 'pit' ? 'crh' : 'acth', at: st.stop.id === 'pit' ? [236, 304] : [470, 206], side: st.stop.id === 'pit' ? ['l', 'r'] : ['u', 'd'], strong: true });
        return L;
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
    var segs = [
      [[190, 30], [204, 110], [262, 190], [236, 286], [222, 312]],
      [[222, 312], [250, 304], [276, 300]],
      [[276, 300], [296, 336]],
      [[296, 336], [338, 350]],
      [[338, 350], [340, 374]],
      [[340, 374], [384, 396], [430, 414]],
      [[430, 414], [540, 448], [628, 470]],
      [[628, 470], [664, 472], [704, 472]]
    ];
    var R0 = new Route(segs);
    function role(v){ return v < 0.9 ? 'sig' : v < 1.9 ? 'ca' : v < 4.9 ? 'nt' : v < 6.95 ? 'na' : 'sig'; }
    var VES = [[200, 170], [250, 140], [300, 160], [350, 130], [390, 180], [330, 220], [270, 230], [420, 240]];
    var DOCK = [[276, 300], [340, 300], [400, 300]];
    var REC = [[296, 354], [340, 354], [384, 354]];
    SCENES.push({
      id: 'synapse', tab: 'Synapse', short: 'Synapse', path: 'synaptic-transmission',
      purpose: 'Carry a signal across a chemical synapse',
      cue: 'Drag the signal', token: 'the signal', thing: 'signal',
      route: R0, last: 8,
      breaks: [
        { id: 'ca', at: 0.95, place: [222, 318], off: [-1, 0], tag: 'Blocked', label: 'Block', aria: 'Block the calcium channels', name: 'Calcium channels blocked', step: 1 },
        { id: 'rec', at: 3.95, place: [384, 360], off: [1, 0], tag: 'Blocked', label: 'Block', aria: 'Block the receptor proteins', name: 'Receptor proteins blocked', step: 4 }
      ],
      take: 'Electrical, then chemical, then electrical again.',
      art: function(E){
        var s = '<defs><radialGradient id="pe-term" cx="0.45" cy="0.35" r="0.75"><stop offset="0" stop-color="#FDF3E3"/><stop offset="1" stop-color="#F1DDBF"/></radialGradient>' +
          '<linearGradient id="pe-post" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F3E4D2"/><stop offset="1" stop-color="#E7CFB4"/></linearGradient>' +
          '<radialGradient id="pe-epsp" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#F2B33D" stop-opacity=".7"/><stop offset="1" stop-color="#F2B33D" stop-opacity="0"/></radialGradient></defs>';
        s += '<rect class="pe-ecf" x="0" y="0" width="' + W + '" height="' + H + '"/>';
        // the postsynaptic neuron: its body below, narrowing to the trigger zone and its axon on the right
        s += '<path class="pe-post" d="M0,352 C120,350 220,350 460,352 C560,354 620,380 660,430 C676,450 690,456 720,456 V490 C690,490 676,500 664,520 L650,540 H0 Z"/>';
        s += '<path class="pe-myel" d="M690,456 h30 v34 h-30 Z"/>';
        s += '<ellipse class="pe-epsp" data-r="epsp" cx="340" cy="420" rx="10" ry="10"/>';
        s += '<path class="pe-tz" data-r="tz" d="M640,446 C652,460 660,470 664,480 C660,492 652,504 640,512"/>';
        // two neighbouring terminals (they fire with this one)
        s += '<g data-r="nb"><path class="pe-term2" d="M30,346 C10,320 20,270 60,262 C100,256 128,290 120,330 C118,342 112,350 104,352 Z"/><path class="pe-term2" d="M540,354 C536,320 560,290 600,292 C636,296 650,330 632,366 Z"/></g>';
        // the presynaptic axon and its terminal
        s += '<path class="pe-term" d="M164,0 H224 C230,60 250,86 300,92 C400,96 500,140 506,220 C510,280 470,318 440,320 L190,320 C150,318 134,280 140,230 C146,180 170,120 166,60 Z"/>';
        s += '<path class="pe-myel" d="M160,0 h68 v26 h-68 Z"/>';
        VES.forEach(function(v0, i){ s += '<g class="pe-ves"><circle cx="' + v0[0] + '" cy="' + v0[1] + '" r="17"/><circle class="pe-ntd" cx="' + (v0[0] - 5) + '" cy="' + (v0[1] - 3) + '" r="3.5"/><circle class="pe-ntd" cx="' + (v0[0] + 5) + '" cy="' + (v0[1] + 4) + '" r="3.5"/></g>'; });
        DOCK.forEach(function(d, i){ s += '<g class="pe-ves" data-r="dock' + i + '"><circle cx="' + d[0] + '" cy="' + d[1] + '" r="15"/></g>'; });
        // calcium channels in the terminal's membrane, reuptake transporter, receptor proteins with their channels
        s += '<g data-r="cach"><path class="pe-cach" d="M206,306 h10 v26 h-10 Z M228,306 h10 v26 h-10 Z"/><path class="pe-cach" d="M450,306 h10 v26 h-10 Z M472,306 h10 v26 h-10 Z"/></g>';
        s += '<path class="pe-upt" d="M432,312 c0,-10 18,-10 18,0 v12 h-18 Z"/>';
        REC.forEach(function(r, i){ s += '<g data-r="rec' + i + '"><path class="pe-rec" d="M' + (r[0] - 14) + ',' + (r[1] - 6) + ' h10 v30 h-10 Z M' + (r[0] + 4) + ',' + (r[1] - 6) + ' h10 v30 h-10 Z"/><path class="pe-site" d="M' + (r[0] - 14) + ',' + (r[1] - 6) + ' a7,7 0 0 1 10,0"/></g>'; });
        s += '<g data-r="ions"></g><g data-r="nts"></g><g data-r="cuts"></g>';
        s += '<rect class="pe-gauge" x="672" y="380" width="16" height="64" rx="8"/><rect class="pe-gaugef" data-r="gauge" x="672" y="444" width="16" height="0" rx="8"/><path class="pe-thr" d="M666,396 h28"/>';
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
        if(br && v >= Math.min(br.at - 0.02, br.step - 0.12)) st.stop = br;
        st.caIn = st.ca ? 0 : bump(v, 0.7, 0.88, 1.88, 2.2);
        st.fuse = st.ca ? 0 : ramp(v, 1.7, 1.88);
        st.release = st.ca ? 0 : ramp(v, 1.7, 1.88);
        st.cross = st.ca ? 0 : ramp(v, 2.45, 3.3);
        st.bind = st.ca || st.rec ? 0 : ramp(v, 3.6, 3.88) * (1 - ramp(v, 7.88, 8));
        st.open = st.ca || st.rec ? 0 : ramp(v, 4.6, 4.88) * (1 - ramp(v, 7.88, 8));
        st.naIn = st.open * bump(v, 4.6, 4.88, 6.0, 6.6);
        st.epsp = st.ca || st.rec ? 0 : ramp(v, 5.6, 5.88) * (1 - ramp(v, 7.88, 8));
        st.sum = st.ca || st.rec ? 0 : ramp(v, 5.88, 6.88);
        st.fire = st.ca || st.rec ? 0 : bump(v, 6.75, 6.88, 7.88, 8.0);
        st.clear = st.ca ? 0 : ramp(v, 7.6, 7.88);
        return st;
      },
      paint: function(R, st, E){
        var i, kids = R.ions.childNodes;
        for(i = 0; i < 6; i++){ var c = kids[i], x0 = i < 3 ? 222 : 466, t = ramp(st.v, 0.7 + i * 0.03, 1.4); c.setAttribute('cx', f1(x0 + (i % 3 - 1) * 9)); c.setAttribute('cy', f1(lerp(346, 290, t))); c.style.opacity = f1(st.caIn); }
        for(i = 0; i < 5; i++){ var n = kids[6 + i], r = REC[i % 3], t2 = ramp(st.v, 4.7 + i * 0.05, 5.4); n.setAttribute('cx', f1(r[0] + (i > 2 ? 4 : -4))); n.setAttribute('cy', f1(lerp(340, 392, t2))); n.style.opacity = f1(st.naIn); }
        for(i = 0; i < 3; i++){ var d = R['dock' + i]; d.style.opacity = f1(1 - st.fuse); d.setAttribute('transform', 'translate(0,' + f1(st.fuse * 10) + ')'); }
        var nts = R.nts.childNodes;
        for(i = 0; i < 9; i++){
          var m = nts[i], dk = DOCK[i % 3], rc = REC[i % 3], ang = i * 0.7;
          var x = lerp(dk[0], rc[0] + Math.cos(ang) * (st.rec ? 14 : 3), st.cross), y = lerp(dk[1] + 12, st.bind > 0.5 && i < 3 ? rc[1] - 4 : 338 + (i % 3) * 4, st.cross);
          // cleared: taken back up into the terminal and broken down by enzymes in the cleft
          if(st.clear > 0){ x = lerp(x, i % 2 ? 441 : x, st.clear); y = lerp(y, i % 2 ? 314 : y, st.clear); }
          m.setAttribute('cx', f1(x)); m.setAttribute('cy', f1(y));
          m.style.opacity = f1(st.release * (1 - st.clear * (i % 2 ? 0.2 : 1)) * (st.clear > 0.95 ? 0 : 1));
        }
        for(i = 0; i < 3; i++) R['rec' + i].setAttribute('class', st.rec ? 'is-blk' : st.open > 0.5 ? 'is-open' : st.bind > 0.5 ? 'is-bound' : '');
        R.cach.setAttribute('class', st.ca ? 'is-blk' : st.caIn > 0.3 ? 'is-open' : '');
        R.nb.setAttribute('class', st.sum > 0.1 ? 'is-on' : '');
        var rr = 10 + st.epsp * 170;
        R.epsp.setAttribute('rx', f1(rr)); R.epsp.setAttribute('ry', f1(rr * 0.5)); R.epsp.setAttribute('cx', f1(340 + st.epsp * 120)); R.epsp.setAttribute('cy', f1(420 + st.epsp * 20)); R.epsp.style.opacity = f1(st.epsp);
        var gh = 60 * clamp(st.sum * 0.78 + st.fire * 0.22, 0, 1);
        R.gauge.setAttribute('y', f1(444 - gh)); R.gauge.setAttribute('height', f1(gh));
        R.tz.setAttribute('class', 'pe-tz' + (st.fire > 0.3 ? ' is-on' : ''));
      },
      cut: function(b){ return ''; },
      tokenRole: function(st){ return st.stop ? (st.stop.id === 'ca' ? 'sig' : 'nt') : role(st.v); },
      trailFor: function(st){ return [[0, 0.9, 'sig'], [0.9, 1.9, 'ca'], [1.9, 4.9, 'nt'], [4.9, 6.95, 'na'], [6.95, 8, 'sig']]; },
      labels: function(st, E){
        var L = [
          { key: 'term', text: 'Axon terminal', role: 'sig', at: [430, 150], side: ['r', 'u'] },
          { key: 'ca', text: 'Ca²⁺ channel', role: 'ca', at: [472, 318], side: ['r', 'd', 'ur'], lead: true },
          { key: 'rec', text: 'Receptor proteins', role: 'nt', at: [340, 372], side: ['d', 'dl', 'l'], lead: true },
          { key: 'tz', text: 'Trigger zone', role: 'na', at: [654, 476], side: ['d', 'l', 'u'], lead: true }
        ];
        var CUR = [['Action potential', 'sig'], ['Ca²⁺ in', 'ca'], ['Vesicle fuses', 'nt'], ['Neurotransmitter', 'nt'], ['Binds', 'nt'], ['Na⁺ in', 'na'], ['EPSP', 'na'], ['Threshold', 'na'], ['Cleared', 'nt']][st.k];
        if(st.stop) CUR = st.stop.id === 'ca' ? ['No Ca²⁺ in', 'bad'] : ['Cannot bind', 'bad'];
        if(st.k === 8){ if(st.clear > 0.5) L.push({ key: 'cur', text: CUR[0], role: CUR[1], at: [420, 338], side: ['u', 'r'], lead: true, strong: true }); }
        else if(!(st.k === 7 && st.fire < 0.3 && !st.stop)) L.push({ key: 'cur', text: CUR[0], role: CUR[1], at: this.route.at(st.v), side: ['r', 'l', 'u', 'd'], strong: true });
        if(st.fire > 0.3 || (st.k === 8 && !st.stop)) L.push({ key: 'fire', text: 'Fires', role: 'sig', at: [690, 472], side: ['u', 'd'], strong: true });
        return L;
      },
      words: function(st){
        if(st.stop) return st.stop.id === 'ca'
          ? [{ t: 'Ca²⁺ channels blocked', say: 'calcium channels blocked', role: 'bad' }, { t: 'no Ca²⁺ in', say: 'no calcium in', role: 'ca' }, { t: 'no transmitter released', role: 'nt' }]
          : [{ t: 'Receptor proteins blocked', role: 'bad' }, { t: 'transmitter cannot bind', role: 'nt' }, { t: 'no EPSP', role: 'na' }];
        return [
          [{ t: 'Action potential', role: 'sig' }, { t: 'reaches the axon terminal', role: 'sig' }],
          [{ t: 'Depolarization', role: 'sig' }, { t: 'Ca²⁺ channels open', say: 'calcium channels open', role: 'ca' }, { t: 'Ca²⁺ rushes in', say: 'calcium rushes in', role: 'ca' }],
          [{ t: 'Ca²⁺', say: 'calcium', role: 'ca' }, { t: 'vesicles fuse', role: 'nt' }, { t: 'transmitter released', role: 'nt' }],
          [{ t: 'Neurotransmitter', role: 'nt' }, { t: 'diffuses across the cleft', role: 'nt' }],
          [{ t: 'Neurotransmitter', role: 'nt' }, { t: 'binds receptor proteins', role: 'nt' }],
          [{ t: 'Receptor proteins', role: 'nt' }, { t: 'channels open', role: 'na' }, { t: 'Na⁺ flows in', say: 'sodium flows in', role: 'na' }],
          [{ t: 'Na⁺ in', say: 'sodium in', role: 'na' }, { t: 'membrane depolarizes: EPSP', role: 'na' }],
          [{ t: 'EPSPs add up', role: 'na' }, { t: 'threshold reached', role: 'na' }, { t: 'neuron fires', role: 'sig' }],
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
    function scale(){ var r = svg.getBoundingClientRect(); return r.width ? r.width / W : 1; }
    function metrics(){ var k = scale() || 1; E.k = k; E.fs = clamp((k < 0.8 ? 12.5 : 13.5) / k, 10, 27); E.gap = 4 / k; }

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
      R.cuts.innerHTML = cur.br ? cur.cut(cur.br, R, cur.route.at) : '';
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
    function keepOut(){
      var out = [], k = E.k || 1;
      var p = cur.route.at(view.v), r = 30 / k;
      out.push([p[0] - r, p[1] - r, p[0] + r, p[1] + r]);
      // the controls on the picture (Start over, the cut buttons) and the cue
      [reset].concat(pills.map(function(x){ return x.el; })).forEach(function(b){
        if(!b || b.hidden || !b.offsetWidth) return;
        var pr = pic.getBoundingClientRect(), q = b.getBoundingClientRect();
        out.push([(q.left - pr.left) / k, (q.top - pr.top) / k, (q.right - pr.left) / k, (q.bottom - pr.top) / k]);
      });
      if(cue && cue.active()){ var c = pic.querySelector('.tk2-cue'); if(c){ var pr2 = pic.getBoundingClientRect(), q2 = c.getBoundingClientRect(); out.push([(q2.left - pr2.left) / k, (q2.top - pr2.top) / k, (q2.right - pr2.left) / k, (q2.bottom - pr2.top) / k]); } }
      return out;
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
          if(b[0] < 4 || b[2] > W - 4 || b[1] < 4 || b[3] > H - 4) continue;
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
              if(b2[0] < 4 || b2[2] > W - 4 || b2[1] < 4 || b2[3] > H - 4) continue;
              if(placed.some(function(x){ return inter(x, b2, g); })) continue;
              var dd2 = Math.hypot(cx2 - at[0], cy2 - at[1]);
              if(dd2 < bestD){ bestD = dd2; best = { b: b2, sd: 'u', dd: 99, far: true }; }
            }
          }
          if(!best){ var bx = clamp(at[0] - w / 2, 4, W - 4 - w), by = clamp(at[1] - h * 1.6, 4, H - 4 - h); best = { b: [bx, by, bx + w, by + h], sd: 'u', dd: 1 }; }
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
        el.setAttribute('aria-label', b.aria);
        el.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M8.1 8.1 20 20M8.1 15.9 20 4"/></svg><span>' + esc(b.label) + '</span>';
        el.addEventListener('click', function(){ breakIt(b); });
        over.appendChild(el);
        return { el: el, b: b };
      });
      placePills();
    }
    function placePills(){
      var k = E.k || scale(), show = seenEnd();
      pills.forEach(function(x){
        var p = x.b.place || cur.route.at(x.b.at), on = cur.br && cur.br.id === x.b.id;
        x.el.hidden = !show || !!cur.br;
        x.el.setAttribute('aria-pressed', String(!!on));
        x.el.classList.toggle('is-done', !!on);
        x.el.disabled = !!on;
        x.el.classList.toggle('is-new', show && !cur.br && !cur.pillsSeen);
        var off = x.b.off || [0, -1];
        x.el.style.left = (p[0] * k) + 'px'; x.el.style.top = (p[1] * k) + 'px';
        x.el.setAttribute('data-side', off[1] < 0 ? 'up' : off[1] > 0 ? 'down' : off[0] < 0 ? 'left' : 'right');
      });
    }
    function breakIt(b){
      if(cur.br) return;
      cur.br = b; cur.pillsSeen = true;
      // a new signal starts if the old one had already passed the break (the cut does not undo what happened)
      if(view.v > b.at){ jumpTo(0, true); }
      if(handle && !b.pass) handle.value(Math.min(handle.value(), b.at), false);
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
    function lim(){ return cur.br && !cur.br.pass ? cur.br.at : cur.last; }
    function makeHandle(){
      if(handle){ handle.el.remove(); handle = null; }
      handle = K.handle(layer, { key: 'anp-pathways-knob', label: 'Move ' + cur.token + ' along the ' + cur.tab.toLowerCase(), value: view.target, min: 0, max: cur.last, step: 1, chip: false,
        at: function(v){ return cur.route.at(v); },
        dir: function(v){ return cur.route.dir(v); },
        pick: function(x, y, v){ var m = lim(), r = cur.route.near(x, y, Math.max(0, v - 0.6), Math.min(m, v + 0.6)); return r ? Math.min(r.v, m) : null; },
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
      var r = svg.getBoundingClientRect(), k = scale(), x = (e.clientX - r.left) / k, y = (e.clientY - r.top) / k;
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
      tok.setAttribute('transform', 'translate(' + f1(p[0]) + ',' + f1(p[1]) + ')');
      tok.setAttribute('class', 'pe-tok is-' + role + (st.stop ? ' is-stop' : ''));
      tok.firstChild.setAttribute('r', f1(30 / k)); tok.lastChild.setAttribute('r', f1(19 / k));
      if(cur.tokenFill){ tok.lastChild.style.fill = cur.tokenFill(st); } else tok.lastChild.style.fill = '';
      // the trail: where it has been
      var tv = Math.max(0, view.v), parts = cur.trailFor ? cur.trailFor(st) : cur.trail || [[0, cur.last, role]];
      // one path per part of the trail, made once per screen and only reshaped as the token moves
      var sig = cur.id + '|' + parts.map(function(pt){ return pt[2]; }).join(',');
      if(trail._h !== sig){ trail._h = sig; trail.innerHTML = parts.map(function(pt){ return '<path class="pe-trail-p is-' + pt[2] + '"/>'; }).join(''); }
      parts.forEach(function(pt, i){
        var el = trail.childNodes[i], a0 = pt[0], a1 = Math.min(pt[1], tv);
        if(a1 - a0 > 0.02){ el.setAttribute('d', cur.route.path(a0, a1)); el.style.strokeWidth = f1(6 / k) + 'px'; el.style.display = ''; } else el.style.display = 'none';
      });
      var atEnd = !st.stop && view.v >= cur.last - 0.02;
      if(atEnd && !cur.br && !seenEnd()){ markEnd(); placePills(); }
      var LL = cur.labels(st, E);
      if(cur.br) LL.push({ key: 'brk', text: cur.br.tag, role: 'bad', at: cur.br.place || cur.route.at(cur.br.at), side: ['u', 'd', 'l', 'r'], lead: true, strong: true });
      placeLabels(LL);
      railPaint(st);
      var ws = cur.words(st), key = JSON.stringify(ws) + (atEnd ? '|end' : '') + (st.stop ? '|stop' : '');
      if(key !== wKey){
        wKey = key;
        cause.set(ws, st.stop ? 'What fails:' : 'Step ' + (st.k + 1) + ':');
        if(atEnd){ cause.take(cur.take + (cur.breaks && cur.breaks.length && !cur.br ? ' Now break a part.' : '')); }
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
      metrics(); buildArt(); railBuild(); makeHandle(); makePills(); draw(); refHtml();
      if(user){ try{ history.replaceState(null, '', location.pathname + location.search + '#explore/' + sc.id); }catch(e){} say(sc.tab + '. ' + stepText(view.v)); }
      if(cue && cue.active()){ cue.hide(false); makeCue(); }
    }

    /* ---- the first visit cue and "Show me how" */
    function makeCue(){
      var p = cur.route.at(view.target);
      cue = K.cue(layer, { key: 'anp-pathways', text: cur.cue, side: p[0] > W * 0.55 ? 'left' : 'right', at: function(){ var q = cur.route.at(view.target); return [q[0], q[1]]; } });
      cue.show();
      placeLabels(cur.labels(cur.state(view.v, cur.br), E));
      setTimeout(function(){ if(cue && cue.active()) draw(); }, 450);   // once the cue has settled, labels move clear of it
    }
    function hideCue(used){ if(cue && cue.active()){ cue.hide(used); } }
    var tour = K.tour({ key: 'anp-pathways', label: 'Show me how', steps: [
      { id: 'drag', text: 'Drag along the route. Each step happens as it arrives.', target: function(){ return handle ? handle.knob : pic; } },
      { id: 'rail', text: 'The steps it has reached are named here, in order.', target: function(){ return rail; } },
      { id: 'why', text: 'The line below says why each step causes the next.', target: function(){ return cause.el; } }],
      onClose: function(had){ if(had) try{ head.how.focus({ preventScroll: true }); }catch(e){} } });
    function tourDid(id){ if(tour.active()) tour.did(id); }
    function startTour(){ hideCue(false); tour.start(true); }

    /* ---- "?" for this screen */
    var ref = document.createElement('div'); ref.className = 'ls-sec pe-ref';
    var NOTE = {
      heart: 'Blue and red are the course’s colours for oxygen poor and oxygen rich blood; real blood is never blue, and blood coming back from the body still carries about 75 percent of its oxygen. Only the route through one lung is drawn; the other lung works the same way. “Stop air” stands for any time no fresh air reaches the alveoli (choking, not breathing): the heart still pumps and blood still flows through the lungs, but it picks up no new oxygen, so the body cells get less than they need.',
      reflex: 'The spinal cord is drawn enlarged beside the thigh to show the arc; the knee jerk runs through the lumbar cord (about L2 to L4) in the lower back. One sensory and one motor neuron stand for many. At the same time the hamstrings relax through an inhibitory interneuron, which is not drawn. Cutting a root after the signal has passed does not undo that kick; the next signal stops at the cut.',
      hormone: 'The hypothalamus and pituitary are enlarged in the circle. One blood vessel stands for the whole circulation: ACTH and cortisol travel through the heart and arteries to every organ. Cortisol also damps inflammation, which is not drawn. A damaged adrenal cortex is what happens in Addison disease: with cortisol low, nothing brakes the pituitary and ACTH rises very high. A damaged pituitary leaves no ACTH, so the adrenal cortex makes no cortisol, and without cortisol’s brake CRH rises.',
      synapse: 'A synapse between two neurons with an excitatory neurotransmitter. One EPSP is far too small to reach threshold alone; two neighbouring synapses fire at the same moment here, so their EPSPs add at the trigger zone (spatial summation). The bar by the trigger zone shows the sum; the red mark is threshold. The blockers act on every synapse of the cell, as a drug in the fluid around it would.'
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
    function resized(){ clearTimeout(rz); rz = setTimeout(function(){ if(!stage.isConnected || !pic.offsetWidth) return; var w = pic.offsetWidth; if(w === lastW) { placePills(); if(handle) handle.place(); return; } lastW = w; metrics(); buildArt(); draw(); placePills(); if(handle) handle.place(); if(cue && cue.active()) cue.place(); }, 60); }
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
      _st: function(){ return { st: lastSt, words: cur.words(lastSt).map(function(p){ return p.t; }), labels: [].map.call(labs.querySelectorAll('.pe-lab'), function(g){ return g.getAttribute('data-lab'); }), tok: tok.getAttribute('class') }; },
      _frame: function(v){ if(raf){ cancelAnimationFrame(raf); raf = 0; } view.v = view.target = cur.v = v; if(handle) handle.value(v, false); draw(); }   // the frame tests draw one moment
    };
    window.AnpPathExplore.current = api;
    return api;
  }

  window.AnpPathExplore = { build: build, SCENES: SCENES };
})();
