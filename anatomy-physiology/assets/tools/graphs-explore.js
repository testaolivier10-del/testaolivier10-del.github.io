/* A&P Graphs, tools v2 Explore (docs/tools-v2-anp-graphs-brief.md; standard docs/tools-v2-standard.md).

   One idea: a physiology graph is a record of something a body part is doing. Five screens, each one graph from
   data/tools/graphs.json (the reviewed numbers, read through AnpGraphMath.curveFn, the curve the old chart drew)
   beside the drawn part it describes: the left heart (wiggers), the chest and lungs (spirogram), a red blood cell in
   a capillary (oxygen-hemoglobin), a patch of axon membrane (neuron-action-potential) and one sarcomere
   (mt-length-tension).

   The one control on every screen is the graph itself (LevlKit2 K.scrub): drag anywhere on it, or the knob above
   it, or use the arrow keys; a dot rides each curve. The picture is a pure function of one number, the x it shows
   (a moment of the recording, a PO2 or a sarcomere length). That number chases the cursor (tau 90 ms), so a jump
   is seen happening (the heart beats through the moments between), a drag follows at once, and the labels and the
   cause line, made from the same number, can never disagree with the picture. Things that cross a boundary (blood
   through a valve, air in the airway, ions through a channel) are placed by how much has crossed by that moment,
   so they move only while the cursor moves, and backward when it goes back. Reduced motion: the new picture at
   once with a short cross fade.

   AnpGraphExplore.build({ data, base, studio, onQuiz(graphId) }) -> { stage, ref, tab(v?), tabFor(q), graphOf(tab),
   shown(on) }. graphs.js hands stage and ref to AnpToolKit.kit2. */
(function(){
  'use strict';
  if(window.AnpGraphExplore) return;
  var NS = 'http://www.w3.org/2000/svg';
  var PW = 520, PH = 400;   // the picture's viewBox
  function clamp(v, a, b){ return v < a ? a : v > b ? b : v; }
  function lerp(a, b, t){ return a + (b - a) * t; }
  function ss(t){ t = clamp(t, 0, 1); return t * t * (3 - 2 * t); }
  function ramp(x, a, b){ return ss((x - a) / (b - a)); }
  function f1(v){ return (Math.round(v * 10) / 10).toFixed(1); }
  function n0(v){ return String(Math.round(v)).replace(/\B(?=(\d{3})+(?!\d))/g, ','); }
  function esc(s){ return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function minus(s){ return String(s).replace(/-/g, '−'); }
  function now(){ return window.performance ? performance.now() : Date.now(); }
  function svgEl(tag, attrs){ var e = document.createElementNS(NS, tag); for(var k in attrs) if(attrs[k] != null) e.setAttribute(k, attrs[k]); return e; }
  // a fixed scatter in [0,1]^2 (golden ratio), the same on every visit
  function scatter(n, seed){ var a = [], i; for(i = 0; i < n; i++) a.push([((i + 1) * 0.6180339887 + (seed || 0)) % 1, ((i + 1) * 0.7548776662 + (seed || 0) * 0.37) % 1]); return a; }
  function P(pts){ return pts.map(function(p, i){ return (i ? 'L' : 'M') + p[0].toFixed(1) + ',' + p[1].toFixed(1); }).join(''); }

  /* ------------------------------------------------------------------ label pills on the picture */
  /* lab(E, x, y, text, role, { anchor, to: [x, y], strong }) -> svg. Font size is set so the label reads at about
     13 px on every screen; the box is measured from the text length. role colours the border and the text. */
  function lab(E, x, y, text, role, o){
    o = o || {};
    var fs = E.fs, w = text.length * fs * 0.56 + fs * 1.1, h = fs * 1.75, a = o.anchor || 'middle';
    var x0 = a === 'start' ? x : a === 'end' ? x - w : x - w / 2;
    x0 = clamp(x0, 3, PW - w - 3);
    var y0 = clamp(y - h / 2, 3, PH - h - 3);
    var s = '';
    if(o.to){
      var cx = clamp(o.to[0], x0, x0 + w), cy = clamp(o.to[1], y0, y0 + h);
      s += '<path class="gx-lead is-' + role + '" d="M' + cx.toFixed(1) + ',' + cy.toFixed(1) + 'L' + o.to[0].toFixed(1) + ',' + o.to[1].toFixed(1) + '"/>' +
        '<circle class="gx-lead-dot is-' + role + '" cx="' + o.to[0].toFixed(1) + '" cy="' + o.to[1].toFixed(1) + '" r="' + (fs * 0.22).toFixed(1) + '"/>';
    }
    return s + '<g class="gx-lab is-' + role + (o.strong ? ' is-strong' : '') + '" data-lab="' + esc(text) + '"><rect x="' + x0.toFixed(1) + '" y="' + y0.toFixed(1) + '" width="' + w.toFixed(1) + '" height="' + h.toFixed(1) + '" rx="' + (h / 2).toFixed(1) + '"/>' +
      '<text x="' + (x0 + w / 2).toFixed(1) + '" y="' + (y0 + h / 2).toFixed(1) + '" dy="0.36em" style="font-size:' + fs.toFixed(2) + 'px">' + esc(text) + '</text></g>';
  }
  /* a big number on the picture (one per screen) */
  function readout(E, x, y, big, small, role, anchor){
    var fs = E.fs * 1.5;
    return '<g class="gx-num is-' + role + '" data-lab="' + esc(big) + '"><text x="' + x.toFixed(1) + '" y="' + y.toFixed(1) + '" text-anchor="' + (anchor || 'middle') + '" style="font-size:' + fs.toFixed(2) + 'px">' + esc(big) +
      (small ? '<tspan class="gx-num-s" dx="' + (fs * 0.25).toFixed(1) + '" style="font-size:' + (fs * 0.62).toFixed(2) + 'px">' + esc(small) + '</tspan>' : '') + '</text></g>';
  }
  function arrowHead(x, y, ang, s){
    var a = ang, c = Math.cos(a), d = Math.sin(a);
    return 'M' + (x - c * s - d * s * 0.6).toFixed(1) + ',' + (y - d * s + c * s * 0.6).toFixed(1) + 'L' + x.toFixed(1) + ',' + y.toFixed(1) + 'L' + (x - c * s + d * s * 0.6).toFixed(1) + ',' + (y - d * s - c * s * 0.6).toFixed(1);
  }
  function flowArrow(pts, cls, s){
    var a = pts[pts.length - 2], b = pts[pts.length - 1], ang = Math.atan2(b[1] - a[1], b[0] - a[0]);
    return '<path class="gx-flow ' + cls + '" d="' + P(pts) + '"/><path class="gx-flow-h ' + cls + '" d="' + arrowHead(b[0], b[1], ang, s || 9) + '"/>';
  }

  /* ================================================================== the five screens */
  var SCENES = [];

  /* ---------------------------------------------------------------- 1 Heart: the cardiac cycle (wiggers) */
  (function(){
    // valve events from the graph's own dashed lines (vlines): mitral closes 0.205, aortic opens 0.25, aortic closes 0.52, mitral opens 0.60
    var EV = { mc: 0.205, ao: 0.25, ac: 0.52, mo: 0.6 }, VR = 0.012;   // a valve swings over about 24 ms of the recording
    function mitral(t){ return t < 0.4 ? 1 - ramp(t, EV.mc - VR, EV.mc + VR) : ramp(t, EV.mo - VR, EV.mo + VR); }
    function aortic(t){ return ramp(t, EV.ao - VR, EV.ao + VR) * (1 - ramp(t, EV.ac - VR, EV.ac + VR)); }
    // the atrium squeezes in atrial systole (the graph's region 0.06 to 0.205) and refills while the mitral valve is shut
    function atrium(t){
      if(t >= 0.06 && t < 0.205){ var u = (t - 0.06) / 0.145; return 1 - 0.16 * Math.sin(Math.PI * Math.min(1, u * 1.15)); }
      if(t >= 0.205 && t < 0.6) return 1 + 0.12 * ss((t - 0.205) / 0.395);
      var v = t >= 0.6 ? (t - 0.6) / 0.26 : (t + 0.2) / 0.26;   // passive emptying through the open valve
      return 1.12 - 0.12 * ss(v);
    }
    function phase(t, mo, ao){
      if(ao > 0.5) return 'ej';
      if(mo <= 0.5) return t < 0.4 ? 'ivc' : 'ivr';
      if(t >= 0.06 && t < 0.205) return 'as';
      return 'fill';
    }
    var NAME = { ej: 'Ejection', ivc: 'Isovolumetric contraction', ivr: 'Isovolumetric relaxation', as: 'Atrial systole', fill: 'Filling' };
    var REG = { ej: [0.25, 0.52], ivc: [0.205, 0.25], ivr: [0.52, 0.6], as: [0.06, 0.205] };
    SCENES.push({
      id: 'heart', graph: 'wiggers', tab: 'Heart', short: 'Heart',
      purpose: 'Pressure differences open and shut the heart’s valves',
      series: [
        { id: 'aortic', role: 'ao', label: 'aorta', at: [0.66, 0], dy: -12 },
        { id: 'lv', role: 'lv', label: 'left ventricle', at: [0.365, 0], dy: -12 },
        { id: 'la', role: 'la', label: 'left atrium', at: [0.7, 0], dy: -10 }
      ],
      step: 0.005, start: 0.3, xName: 'Time', xUnit: 's', xFmt: function(x){ return x.toFixed(2) + ' s'; },
      cueText: 'Drag the graph',
      region: function(t){ var m = mitral(t), a = aortic(t), p = phase(t, m, a); return REG[p] ? { x0: REG[p][0], x1: REG[p][1], ph: p } : { x0: t < 0.4 ? 0 : 0.6, x1: t < 0.4 ? 0.06 : 0.8, ph: 'fill' }; },
      init: function(E){
        // how much blood has come in through the mitral valve and out through the aortic valve by each moment
        var vol = E.fn('vol'), n = 800, dt = 0.8 / n, inn = [0], out = [0], prev = vol(0);
        for(var i = 1; i <= n; i++){ var v = vol(i * dt), d = v - prev; inn.push(inn[i - 1] + Math.max(0, d)); out.push(out[i - 1] + Math.max(0, -d)); prev = v; }
        this.cum = function(t, which){ var a = which === 'in' ? inn : out, k = clamp(t / dt, 0, n), j = Math.floor(k), f = k - j; return j >= n ? a[n] : a[j] + (a[j + 1] - a[j]) * f; };
        this.flow = function(t){ var h = 0.004; return (vol(clamp(t + h, 0, 0.8)) - vol(clamp(t - h, 0, 0.8))) / (2 * h); };   // mL per s
      },
      geo: function(t, E){
        var V = clamp(E.fn('vol')(t), 55, 135), s = Math.sqrt(V / 130), squeeze = clamp((1 - s) / (1 - Math.sqrt(60 / 130)), 0, 1);
        var a = 70 * s, b = 80 * s, top = 224, cx = 232, cy = top + b * 0.82;
        var wall = 18 + 18 * squeeze;   // the wall thickens as the cavity empties
        return { V: V, s: s, a: a, b: b, cx: cx, cy: cy, top: top, wall: wall, mo: mitral(t), ao: aortic(t), la: atrium(t) };
      },
      draw: function(E, t){
        var G = this.geo(t, E), self = this, s = '';
        function egg(cx, cy, a, b){
          return 'M' + (cx - a).toFixed(1) + ',' + (cy - b * 0.32).toFixed(1) + 'C' + (cx - a).toFixed(1) + ',' + (cy - b * 1.02).toFixed(1) + ' ' + (cx + a).toFixed(1) + ',' + (cy - b * 1.02).toFixed(1) + ' ' + (cx + a).toFixed(1) + ',' + (cy - b * 0.32).toFixed(1) +
            'C' + (cx + a).toFixed(1) + ',' + (cy + b * 0.5).toFixed(1) + ' ' + (cx + a * 0.34).toFixed(1) + ',' + (cy + b).toFixed(1) + ' ' + cx.toFixed(1) + ',' + (cy + b).toFixed(1) +
            'C' + (cx - a * 0.34).toFixed(1) + ',' + (cy + b).toFixed(1) + ' ' + (cx - a).toFixed(1) + ',' + (cy + b * 0.5).toFixed(1) + ' ' + (cx - a).toFixed(1) + ',' + (cy - b * 0.32).toFixed(1) + 'Z';
        }
        s += '<rect class="gx-bg-chest" x="0" y="0" width="' + PW + '" height="' + PH + '"/>';
        // the ventricle's muscle (cut open), then the cavity: its area is the volume
        var oa = G.a + G.wall, ob = G.b + G.wall * 0.9, ocy = G.cy - G.wall * 0.15;
        s += '<path class="gx-myo" d="' + egg(G.cx, ocy, oa, ob) + '"/>';
        s += '<path class="gx-blood gx-lv-cav" d="' + egg(G.cx, G.cy, G.a, G.b) + '"/>';
        // papillary muscles on the floor, the chordae run from them to the mitral leaflets
        var pm1 = [G.cx - G.a * 0.52, G.cy + G.b * 0.5], pm2 = [G.cx + G.a * 0.12, G.cy + G.b * 0.66];
        s += '<ellipse class="gx-pap" cx="' + pm1[0].toFixed(1) + '" cy="' + pm1[1].toFixed(1) + '" rx="' + (9 * G.s + 3).toFixed(1) + '" ry="' + (15 * G.s + 4).toFixed(1) + '" transform="rotate(20 ' + pm1[0].toFixed(1) + ' ' + pm1[1].toFixed(1) + ')"/>';
        s += '<ellipse class="gx-pap" cx="' + pm2[0].toFixed(1) + '" cy="' + pm2[1].toFixed(1) + '" rx="' + (9 * G.s + 3).toFixed(1) + '" ry="' + (14 * G.s + 4).toFixed(1) + '" transform="rotate(-12 ' + pm2[0].toFixed(1) + ' ' + pm2[1].toFixed(1) + ')"/>';
        // aorta: three branches off the arch, then the arch itself from the aortic valve over to the right and down
        [[318, 76, 306, -6], [345, 64, 344, -6], [372, 64, 386, -6]].forEach(function(br){
          var d = 'M' + br[0] + ',' + br[1] + ' L' + br[2] + ',' + br[3];
          s += '<path class="gx-br-wall" d="' + d + '"/><path class="gx-br-blood" d="' + d + '"/>';
        });
        var aoPath = 'M272,228 C270,176 266,128 288,100 C314,66 392,58 424,88 C446,110 452,150 452,410';
        s += '<path class="gx-ao-wall" d="' + aoPath + '"/><path class="gx-ao-blood" d="' + aoPath + '"/><path class="gx-ao-hi" d="M260,200 C258,160 258,128 278,104 C300,78 352,68 384,70"/>';
        // pulmonary veins bring blood from the lungs into the left atrium
        ['M-10,98 C40,100 76,110 118,122', 'M-10,160 C40,160 80,156 118,150'].forEach(function(d){ s += '<path class="gx-pv-wall" d="' + d + '"/><path class="gx-pv-blood" d="' + d + '"/>'; });
        // left atrium: its size follows its filling and its squeeze; its funnel opens onto the mitral valve
        var la = G.la, lx = 172, ly = 140, lw = 58 * la, lh = 44 * la;
        var laPath = 'M' + (lx - lw).toFixed(1) + ',' + ly + 'C' + (lx - lw).toFixed(1) + ',' + (ly - lh * 1.25).toFixed(1) + ' ' + (lx + lw).toFixed(1) + ',' + (ly - lh * 1.25).toFixed(1) + ' ' + (lx + lw).toFixed(1) + ',' + ly +
          'C' + (lx + lw).toFixed(1) + ',' + (ly + lh * 0.55).toFixed(1) + ' 220,200 216,226 L164,226 C' + (lx - lw * 0.7).toFixed(1) + ',' + (ly + lh * 0.8).toFixed(1) + ' ' + (lx - lw).toFixed(1) + ',' + (ly + lh * 0.5).toFixed(1) + ' ' + (lx - lw).toFixed(1) + ',' + ly + 'Z';
        s += '<path class="gx-la" d="' + laPath + '"/>';
        s += '<path class="gx-ring" d="M160,226 L218,226 M246,226 L298,226"/>';
        // blood cells moving through the valves, placed by how much has crossed by now (in three lanes)
        var cin = self.cum(t, 'in'), cout = self.cum(t, 'out');
        var inPts = [[150, 128], [176, 166], [188, 204], [190, 232], [194, 266], [202, 298]], outPts = [[250, 300], [262, 262], [272, 226], [270, 180], [274, 132], [298, 96], [344, 74], [400, 72]];
        function along(pts, u){
          var Ls = [0], i; for(i = 1; i < pts.length; i++) Ls.push(Ls[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
          var d = u * Ls[Ls.length - 1];
          for(i = 1; i < pts.length; i++) if(d <= Ls[i] || i === pts.length - 1){ var f = (d - Ls[i - 1]) / ((Ls[i] - Ls[i - 1]) || 1); return [lerp(pts[i - 1][0], pts[i][0], f), lerp(pts[i - 1][1], pts[i][1], f), Math.atan2(pts[i][1] - pts[i - 1][1], pts[i][0] - pts[i - 1][0])]; }
        }
        function stream(pts, c, n, wide){
          var o = '';
          for(var i = 0; i < n; i++){
            var lane = (i % 3) - 1, u = ((c / 16 + i / n + lane * 0.017) % 1 + 1) % 1, p = along(pts, u), op = Math.min(1, u * 7, (1 - u) * 7);
            var x = p[0] - Math.sin(p[2]) * lane * wide, y = p[1] + Math.cos(p[2]) * lane * wide;
            o += '<ellipse class="gx-rbc" cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" rx="4.6" ry="2.9" transform="rotate(' + (p[2] * 57.3 + 90).toFixed(0) + ' ' + x.toFixed(1) + ' ' + y.toFixed(1) + ')" opacity="' + op.toFixed(2) + '"/>';
          }
          return o;
        }
        s += '<g class="gx-cells">' + stream(inPts, cin, 18, 8) + stream(outPts, cout, 24, 7) + '</g>';
        // mitral valve: two leaflets from the ring; shut they meet in the middle, open they hang into the ventricle
        var mo = G.mo, mL = [168, 226], mR = [212, 226], len = 27;
        var angL = lerp(-0.1, 1.3, mo), angR = Math.PI - angL;
        var tipL = [mL[0] + Math.cos(angL) * len, mL[1] + Math.sin(angL) * len], tipR = [mR[0] + Math.cos(angR) * len, mR[1] + Math.sin(angR) * len];
        s += '<path class="gx-chord" d="M' + tipL[0].toFixed(1) + ',' + tipL[1].toFixed(1) + 'L' + pm1[0].toFixed(1) + ',' + (pm1[1] - 10).toFixed(1) + 'M' + tipR[0].toFixed(1) + ',' + tipR[1].toFixed(1) + 'L' + pm2[0].toFixed(1) + ',' + (pm2[1] - 10).toFixed(1) + '"/>';
        [[mL, tipL], [mR, tipR]].forEach(function(v){ s += '<path class="gx-valve" d="M' + v[0][0] + ',' + v[0][1] + 'Q' + ((v[0][0] + v[1][0]) / 2).toFixed(1) + ',' + ((v[0][1] + v[1][1]) / 2 - 6 * (1 - mo)).toFixed(1) + ' ' + v[1][0].toFixed(1) + ',' + v[1][1].toFixed(1) + '"/>'; });
        // aortic valve: cusps that meet in the middle when shut (cups facing the aorta) and lie against the wall when open
        var ao = G.ao, aL = [251, 226], aR = [293, 226], al = 22;
        var bL = lerp(-0.2, -1.45, ao), bR = Math.PI - bL;
        var cL = [aL[0] + Math.cos(bL) * al, aL[1] + Math.sin(bL) * al], cR = [aR[0] + Math.cos(bR) * al, aR[1] + Math.sin(bR) * al];
        s += '<path class="gx-valve" d="M' + aL[0] + ',' + aL[1] + 'Q' + ((aL[0] + cL[0]) / 2 + 3 * (1 - ao)).toFixed(1) + ',' + ((aL[1] + cL[1]) / 2 + 8 * (1 - ao)).toFixed(1) + ' ' + cL[0].toFixed(1) + ',' + cL[1].toFixed(1) + '"/>';
        s += '<path class="gx-valve" d="M' + aR[0] + ',' + aR[1] + 'Q' + ((aR[0] + cR[0]) / 2 - 3 * (1 - ao)).toFixed(1) + ',' + ((aR[1] + cR[1]) / 2 + 8 * (1 - ao)).toFixed(1) + ' ' + cR[0].toFixed(1) + ',' + cR[1].toFixed(1) + '"/>';
        // which way blood moves at this moment (only while it moves)
        var fl = self.flow(t);
        if(fl > 60 && mo > 0.5) s += flowArrow([[186, 186], [189, 222], [194, 256]], 'is-blood', 9);
        if(fl < -60 && ao > 0.5) s += flowArrow([[268, 268], [271, 228], [272, 184]], 'is-blood', 9);
        s += readout(E, G.cx + 4, G.cy + G.b * 0.2, n0(G.V), 'mL', 'lv');
        s += lab(E, 92, 52, 'Left atrium', 'la', { to: [138, 112] });
        s += lab(E, 76, 330, 'Left ventricle', 'lv', { to: [G.cx - oa + G.wall * 0.4, G.cy + G.b * 0.35] });
        s += lab(E, 470, 26, 'Aorta', 'ao', { to: [420, 80] });
        s += lab(E, 74, 262, 'Mitral valve', 'valve', { to: [174, 230] });
        s += lab(E, 376, 248, 'Aortic valve', 'valve', { to: [294, 222] });
        return s;
      },
      words: function(E, t){
        var mo = mitral(t), ao = aortic(t), p = phase(t, mo, ao);
        if(p === 'ej') return [{ t: 'Ventricle above aorta', role: 'lv', say: 'pressure in the ventricle rises above the aorta' }, { t: 'aortic valve open', role: 'valve' }, { t: 'blood pushed out', role: 'blood' }, { t: NAME.ej, role: 'phase' }];
        if(p === 'ivc') return [{ t: 'Ventricle contracts', role: 'lv' }, { t: 'both valves shut', role: 'valve' }, { t: NAME.ivc, role: 'phase' }];
        if(p === 'ivr') return [{ t: 'Ventricle relaxes', role: 'lv' }, { t: 'both valves shut', role: 'valve' }, { t: NAME.ivr, role: 'phase' }];
        if(p === 'as') return [{ t: 'Atrium contracts', role: 'la' }, { t: 'last blood pushed in', role: 'blood' }, { t: NAME.as, role: 'phase' }];
        return [{ t: 'Ventricle below atrium', role: 'lv', say: 'pressure in the ventricle is below the atrium' }, { t: 'mitral valve open', role: 'valve' }, { t: 'blood fills it', role: 'blood' }, { t: NAME.fill, role: 'phase' }];
      },
      say: function(E, t){ var G = this.geo(t, E); return 'At ' + t.toFixed(2) + ' s: ' + E.text(t) + ' Mitral valve ' + (G.mo > 0.5 ? 'open' : 'shut') + ', aortic valve ' + (G.ao > 0.5 ? 'open' : 'shut') + ', ventricle holds ' + n0(G.V) + ' mL.'; }
    });
  })();

  /* ---------------------------------------------------------------- 2 Lungs: the spirogram */
  (function(){
    var VMIN = 1200, VMAX = 5900;
    SCENES.push({
      id: 'lungs', graph: 'spirogram', tab: 'Lungs', short: 'Lungs',
      purpose: 'The trace is the air in your lungs',
      series: [{ id: 'trace', role: 'air', label: 'air in the lungs', at: [24, 0], dy: -14 }],
      step: 0.1, start: 2, xName: 'Time', xUnit: 's', xFmt: function(x){ return x.toFixed(1) + ' s'; },
      cueText: 'Drag the graph',
      bands: [{ y0: 0, y1: 1200, role: 'rv', label: 'residual volume' }],
      init: function(E){ this.V = E.fn('trace'); this.dV = function(t){ var h = 0.15; return (this.V(clamp(t + h, 0, 30)) - this.V(clamp(t - h, 0, 30))) / (2 * h); }; },
      draw: function(E, t){
        var V = this.V(t), f = clamp((V - VMIN) / (VMAX - VMIN), 0, 1), d = this.dV(t), s = '';
        var grow = 0.8 + 0.2 * f, base = 108;                          // lungs hang from the top; the diaphragm sets the floor
        var floor = lerp(262, 356, f), chestW = lerp(0.95, 1.05, f);
        s += '<rect class="gx-bg-skin" x="0" y="0" width="' + PW + '" height="' + PH + '"/>';
        // body: neck, shoulders and the chest wall
        s += '<path class="gx-body" d="M212,-4 L212,40 C150,52 70,62 40,110 C18,150 20,300 30,410 L490,410 C500,300 502,150 480,110 C450,62 370,52 308,40 L308,-4 Z"/>';
        // ribs: arcs that lift and widen as the chest grows
        var ribs = '';
        for(var r = 0; r < 6; r++){
          var y = 104 + r * 40, w = (176 + r * 14) * chestW, dy = 26 + r * 3 - f * 8;
          ribs += '<path class="gx-rib" d="M' + (260 - w).toFixed(1) + ',' + (y + dy).toFixed(1) + ' Q' + (260 - w * 0.55).toFixed(1) + ',' + (y - 8).toFixed(1) + ' 248,' + (y + 4) + '"/>';
          ribs += '<path class="gx-rib" d="M' + (260 + w).toFixed(1) + ',' + (y + dy).toFixed(1) + ' Q' + (260 + w * 0.55).toFixed(1) + ',' + (y - 8).toFixed(1) + ' 272,' + (y + 4) + '"/>';
        }
        s += '<g class="gx-ribs">' + ribs + '</g><rect class="gx-sternum" x="250" y="96" width="20" height="' + (floor - 120).toFixed(1) + '" rx="8"/>';
        // two lungs: their floor is the diaphragm
        function lung(side){
          var sx = side, cx = 260 + sx * 92 * chestW, w = 78 * chestW * grow, top = base, bot = floor;
          var inner = 260 + sx * 20, outer = cx + sx * w;
          return 'M' + inner + ',' + (top + 30) + ' C' + inner + ',' + (top + 6) + ' ' + (cx - sx * 10) + ',' + (top - 10) + ' ' + cx + ',' + (top - 6) +
            ' C' + (outer - sx * 6) + ',' + (top + 10) + ' ' + outer + ',' + (top + 80) + ' ' + outer + ',' + ((top + bot) / 2 + 30) +
            ' C' + outer + ',' + (bot - 10) + ' ' + (outer - sx * 10) + ',' + (bot + 4) + ' ' + (cx + sx * 6) + ',' + (bot - 2) +
            ' C' + (cx - sx * 30) + ',' + (bot - 12) + ' ' + (inner + sx * 8) + ',' + (bot - 20) + ' ' + (inner + sx * 2) + ',' + (bot - 40) +
            ' C' + (inner + sx * 30) + ',' + ((top + bot) / 2) + ' ' + inner + ',' + (top + 60) + ' ' + inner + ',' + (top + 30) + 'Z';
        }
        s += '<path class="gx-lung" d="' + lung(-1) + '"/><path class="gx-lung" d="' + lung(1) + '"/>';
        // alveolar texture and the airway tree inside each lung
        var tex = '', pts = scatter(26, 0.21);
        [-1, 1].forEach(function(sx){
          pts.forEach(function(p, i){
            var cx = 260 + sx * (40 + p[0] * 118 * chestW * grow), cy = base + 18 + p[1] * (floor - base - 40);
            if(Math.abs(cx - 260) < 34 + (cy - base) * 0.1) return;
            tex += '<circle class="gx-alv" cx="' + cx.toFixed(1) + '" cy="' + cy.toFixed(1) + '" r="' + (7 + (i % 3) * 2) + '"/>';
          });
        });
        s += '<g class="gx-alvs">' + tex + '</g>';
        var tree = 'M260,-4 L260,104 M260,104 C240,112 222,122 206,140 M260,104 C280,112 298,122 314,140' +
          ' M206,140 C194,160 186,184 180,' + (floor - 60) + ' M206,140 C220,170 226,200 228,' + (floor - 70) +
          ' M314,140 C326,160 334,184 340,' + (floor - 60) + ' M314,140 C300,170 294,200 292,' + (floor - 70) +
          ' M206,140 C180,146 158,160 140,176 M314,140 C340,146 362,160 380,176';
        s += '<path class="gx-airway-w" d="' + tree + '"/><path class="gx-airway" d="' + tree + '"/>';
        s += '<path class="gx-trachea-rings" d="M252,14 h16 M252,30 h16 M252,46 h16 M252,62 h16 M252,78 h16 M252,94 h16"/>';
        // air in the windpipe: its place follows the volume, so it goes down as air comes in and up as it leaves
        var air = '';
        for(var i = 0; i < 6; i++){
          var u = (((V / 260) + i / 6) % 1 + 1) % 1, y2 = lerp(-4, 104, u), op = Math.min(1, u * 5, (1 - u) * 5);
          air += '<circle class="gx-air" cx="' + (260 + (i % 2 ? 3 : -3)) + '" cy="' + y2.toFixed(1) + '" r="4" opacity="' + op.toFixed(2) + '"/>';
        }
        s += '<g>' + air + '</g>';
        // the diaphragm: a dome under the lungs; it flattens and drops as it contracts
        var dome = lerp(34, 14, f), mus = d > 120 ? 1 : 0, push = d < -120 && V < 2350;
        s += '<path class="gx-dia' + (mus ? ' is-on' : '') + '" d="M30,' + (floor + 34).toFixed(1) + ' C120,' + (floor - dome).toFixed(1) + ' 220,' + (floor - dome - 6).toFixed(1) + ' 260,' + (floor - dome + 4).toFixed(1) +
          ' C300,' + (floor - dome - 6).toFixed(1) + ' 400,' + (floor - dome).toFixed(1) + ' 490,' + (floor + 34).toFixed(1) + '"/>';
        if(mus) s += flowArrow([[150, floor - 2], [150, floor + 24]], 'is-mus', 8) + flowArrow([[370, floor - 2], [370, floor + 24]], 'is-mus', 8);
        if(push) s += flowArrow([[150, floor + 60], [150, floor + 34]], 'is-mus', 8) + flowArrow([[370, floor + 60], [370, floor + 34]], 'is-mus', 8);
        // which way air moves now
        if(d > 120) s += flowArrow([[288, 6], [288, 60]], 'is-air', 9) + lab(E, 344, 30, 'Air in', 'air');
        else if(d < -120) s += flowArrow([[288, 60], [288, 6]], 'is-air', 9) + lab(E, 344, 30, 'Air out', 'air');
        s += readout(E, 132, floor - 52, n0(V), 'mL', 'air');
        s += lab(E, 404, Math.min(floor - 70, 230), 'Lungs', 'air', { to: [372, Math.min(floor - 100, 200)] });
        s += lab(E, 444, floor + 22, 'Diaphragm', 'mus', { to: [410, floor + 8] });
        if(V < 1500) s += lab(E, 132, floor - 18, 'Residual air', 'rv');
        return s;
      },
      words: function(E, t){
        var V = this.V(t), d = this.dV(t);
        if(V < 1350) return [{ t: 'Small airways squeezed shut', role: 'rv' }, { t: 'air trapped', role: 'air' }, { t: 'Residual volume', role: 'phase' }];
        if(V > 5750) return [{ t: 'Chest as big as it gets', role: 'mus' }, { t: 'lungs full', role: 'air' }, { t: 'Total lung capacity', role: 'phase' }];
        if(d > 120){
          if(V > 2950) return [{ t: 'Diaphragm and rib muscles pull hard', role: 'mus' }, { t: 'extra air in', role: 'air' }, { t: 'Inspiratory reserve', role: 'phase' }];
          if(V < 2350) return [{ t: 'Muscles let go', role: 'mus' }, { t: 'chest springs back', role: 'mus' }, { t: 'air flows in', role: 'air' }];
          return [{ t: 'Diaphragm contracts', role: 'mus' }, { t: 'chest gets bigger', role: 'mus' }, { t: 'air flows in', role: 'air' }, { t: 'Tidal volume', role: 'phase' }];
        }
        if(d < -120){
          if(V < 2350) return [{ t: 'Belly muscles push up', role: 'mus' }, { t: 'extra air out', role: 'air' }, { t: 'Expiratory reserve', role: 'phase' }];
          if(V > 2950) return [{ t: 'Muscles relax', role: 'mus' }, { t: 'lungs recoil', role: 'mus' }, { t: 'air flows out', role: 'air' }];
          return [{ t: 'Diaphragm relaxes', role: 'mus' }, { t: 'lungs recoil', role: 'mus' }, { t: 'air flows out', role: 'air' }, { t: 'Tidal volume', role: 'phase' }];
        }
        return V > 2650 ? [{ t: 'End of a breath in', role: 'air' }, { t: 'no air moving', role: 'air' }] : [{ t: 'End of a breath out', role: 'air' }, { t: 'no air moving', role: 'air' }];
      },
      say: function(E, t){ return 'At ' + t.toFixed(1) + ' s the lungs hold ' + n0(this.V(t)) + ' mL. ' + E.text(t); }
    });
  })();

  /* ---------------------------------------------------------------- 3 Red blood cell: the oxygen-hemoglobin curve */
  (function(){
    var SITES = 24;
    // where in the body a PO2 is found (course notes, oxygen transport): lungs about 100, resting tissue about 40, working muscle about 20
    function place(p){ return { lung: ramp(p, 74, 86), rest: ramp(p, 28, 34) * (1 - ramp(p, 52, 60)), work: 1 - ramp(p, 22, 28) }; }
    function nOf(S){ return S / 100 * SITES + 0.25; }   // sites drawn bound: hemoglobin fills one molecule at a time (cooperative binding)
    SCENES.push({
      id: 'rbc', graph: 'oxygen-hemoglobin', tab: 'Red blood cell', short: 'Red cell',
      purpose: 'How much oxygen hemoglobin holds at each PO2',
      series: [{ id: 'normal', role: 'o2', label: 'hemoglobin saturation', at: [62, 0], dy: 20 }],
      step: 1, start: 100, xName: 'PO2', xUnit: 'mm Hg', xFmt: function(x){ return Math.round(x) + ' mm Hg'; },
      cueText: 'Drag the graph',
      region: function(p){ return p >= 60 ? { x0: 60, x1: 100, name: 'flat top' } : p >= 10 && p <= 50 ? { x0: 10, x1: 50, name: 'steep middle' } : null; },
      init: function(E){ this.S = E.fn('normal'); this.hb = scatter(SITES, 0.4); this.o2 = scatter(30, 0.13); },
      draw: function(E, p){
        var S = clamp(this.S(p), 0, 100), pl = place(p), s = '', k;
        s += '<rect class="gx-bg-tissue" x="0" y="0" width="' + PW + '" height="' + PH + '"/>';
        // the place around the capillary
        if(pl.lung > 0.01){
          var al = '';
          [[60, 64, 58], [176, 52, 52], [300, 66, 62], [430, 56, 56], [80, 344, 54], [206, 352, 58], [332, 340, 56], [458, 352, 54]].forEach(function(c){
            al += '<circle class="gx-sac" cx="' + c[0] + '" cy="' + c[1] + '" r="' + c[2] + '"/>';
            scatter(5, c[0] / 97).forEach(function(q){ al += '<g class="gx-o2m" transform="translate(' + (c[0] + (q[0] - 0.5) * c[2] * 1.1).toFixed(1) + ',' + (c[1] + (q[1] - 0.5) * c[2] * 1.1).toFixed(1) + ')"><circle cx="-3" r="3.6"/><circle cx="3" r="3.6"/></g>'; });
          });
          s += '<g opacity="' + pl.lung.toFixed(2) + '">' + al + '</g>';
        }
        if(pl.rest > 0.01){
          var ce = '';
          for(k = 0; k < 9; k++){ var x = 30 + k * 58, y1 = 60 + (k % 2) * 10, y2 = 346 - (k % 2) * 12;
            ce += '<path class="gx-cell" d="M' + (x - 26) + ',' + (y1 - 40) + ' L' + (x + 26) + ',' + (y1 - 46) + ' L' + (x + 30) + ',' + (y1 + 36) + ' L' + (x - 24) + ',' + (y1 + 42) + 'Z"/><circle class="gx-nuc" cx="' + x + '" cy="' + y1 + '" r="10"/>';
            ce += '<path class="gx-cell" d="M' + (x - 26) + ',' + (y2 - 40) + ' L' + (x + 26) + ',' + (y2 - 36) + ' L' + (x + 30) + ',' + (y2 + 46) + ' L' + (x - 24) + ',' + (y2 + 40) + 'Z"/><circle class="gx-nuc" cx="' + x + '" cy="' + y2 + '" r="10"/>'; }
          s += '<g opacity="' + pl.rest.toFixed(2) + '">' + ce + '</g>';
        }
        if(pl.work > 0.01){
          var mf = '';
          [[0, 18, 96], [0, 300, 104]].forEach(function(b){
            for(var j = 0; j < 3; j++){ var yy = b[1] + j * (b[2] / 3);
              mf += '<rect class="gx-fiber" x="-6" y="' + yy.toFixed(1) + '" width="' + (PW + 12) + '" height="' + (b[2] / 3 - 4).toFixed(1) + '" rx="12"/>';
              for(var q = 0; q < 26; q++) mf += '<path class="gx-stria" d="M' + (8 + q * 20) + ',' + (yy + 3).toFixed(1) + 'v' + (b[2] / 3 - 10).toFixed(1) + '"/>'; }
          });
          s += '<g opacity="' + pl.work.toFixed(2) + '">' + mf + '</g>';
        }
        // the capillary and the plasma
        s += '<rect class="gx-cap-wall" x="-10" y="118" width="' + (PW + 20) + '" height="164" rx="0"/><rect class="gx-plasma" x="-10" y="128" width="' + (PW + 20) + '" height="144"/>';
        // dissolved O2 in the plasma: as many as the PO2 says (up to 30 at 100 mm Hg)
        var nd = Math.round(p / 100 * 30), d = '';
        this.o2.forEach(function(q, i){
          if(i >= nd) return;
          var x = 14 + q[0] * (PW - 28), y = 136 + q[1] * 128;
          if(x > 108 && x < 412 && y > 150 && y < 250) y = q[1] < 0.5 ? 140 + q[1] * 12 : 258 + (q[1] - 0.5) * 12;
          d += '<g class="gx-o2m" transform="translate(' + x.toFixed(1) + ',' + y.toFixed(1) + ')"><circle cx="-3" r="3.6"/><circle cx="3" r="3.6"/></g>';
        });
        s += '<g>' + d + '</g>';
        // the red blood cell, cut open, with six hemoglobin molecules of four subunits each
        s += '<ellipse class="gx-rbc-rim" cx="260" cy="200" rx="160" ry="66"/><ellipse class="gx-rbc-in" cx="260" cy="200" rx="146" ry="54"/>';
        var nb = nOf(S), hb = '', o2b = '';
        for(var m = 0; m < 6; m++){
          var mx = 140 + m * 48, my = 200 + (m % 2 ? 14 : -14);
          for(var u = 0; u < 4; u++){
            var ux = mx + (u % 2 ? 9 : -9), uy = my + (u < 2 ? -9 : 9), idx = m * 4 + u, b = clamp(nb - idx, 0, 1);
            hb += '<circle class="gx-hb is-' + (u < 2 ? 'a' : 'b') + '" cx="' + ux + '" cy="' + uy + '" r="10.5"/><circle class="gx-heme' + (b > 0.5 ? ' is-on' : '') + '" cx="' + ux + '" cy="' + uy + '" r="4"/>';
            if(b > 0){
              // an O2 flies in from the plasma above or below the cell as the site fills, and back out as it empties
              var sx = ux + (u % 2 ? 30 : -30), sy = uy < 200 ? 142 : 258, bx = lerp(sx, ux, b), by = lerp(sy, uy - 0.5, b);
              o2b += '<g class="gx-o2m is-bound" transform="translate(' + bx.toFixed(1) + ',' + by.toFixed(1) + ')"><circle cx="-2.6" r="3.2"/><circle cx="2.6" r="3.2"/></g>';
            }
          }
        }
        s += '<g>' + hb + '</g><g>' + o2b + '</g>';
        s += readout(E, 260, 366, Math.round(S) + '%', 'saturated', 'o2');
        var where = pl.lung > 0.5 ? 'In the lungs' : pl.rest > 0.5 ? 'Resting tissue' : pl.work > 0.5 ? 'Working muscle' : '';
        if(where) s += lab(E, 12, 100, where, 'place', { anchor: 'start', strong: true });
        s += lab(E, 470, 100, 'Red blood cell', 'rbc', { to: [392, 172], anchor: 'end' });
        s += lab(E, 140, 304, 'Hemoglobin', 'hb', { to: [140, 222] });
        s += lab(E, 440, 304, 'Dissolved O₂', 'o2', { to: [452, 262] });
        return s;
      },
      words: function(E, p){
        var S = Math.round(clamp(this.S(p), 0, 100)), pl = place(p), sat = { t: S + '% saturated', role: 'phase' };
        if(pl.lung > 0.5) return [{ t: 'In the lungs', role: 'place' }, { t: 'PO₂ high', role: 'o2', say: 'PO2 is high' }, { t: 'O₂ binds hemoglobin', role: 'hb', say: 'oxygen binds hemoglobin' }, sat];
        if(p >= 60) return [{ t: 'Flat top', role: 'place' }, { t: 'PO₂ still high', role: 'o2', say: 'PO2 is still high' }, { t: 'hemoglobin stays loaded', role: 'hb' }, sat];
        if(pl.rest > 0.5) return [{ t: 'Resting tissue', role: 'place' }, { t: 'PO₂ lower', role: 'o2', say: 'PO2 is lower' }, { t: 'O₂ unloads', role: 'hb', say: 'oxygen unloads' }, sat];
        if(pl.work > 0.5) return [{ t: 'Working muscle', role: 'place' }, { t: 'PO₂ low', role: 'o2', say: 'PO2 is low' }, { t: 'much more O₂ unloads', role: 'hb', say: 'much more oxygen unloads' }, sat];
        return [{ t: 'Steep middle', role: 'place' }, { t: 'small PO₂ change', role: 'o2', say: 'a small change in PO2' }, { t: 'big change in O₂ held', role: 'hb', say: 'a big change in the oxygen held' }, sat];
      },
      say: function(E, p){ return 'At a PO2 of ' + Math.round(p) + ' mm Hg hemoglobin is ' + Math.round(this.S(p)) + ' percent saturated. ' + E.text(p); }
    });
  })();

  /* ---------------------------------------------------------------- 4 Axon: the action potential */
  (function(){
    // channel states from the moment of the recording (course notes, action potential basics): Na+ channels open fast
    // at threshold, inactivate near the peak and reset once repolarized; K+ channels open slowly, about when Na+ ones
    // shut, and are slow to close (the hyperpolarization)
    function naOpen(t){ return ramp(t, 2.95, 3.08) * (1 - ramp(t, 3.38, 3.56)); }   // open, then inactivated (and closed again once reset)
    function inact(t){ return ramp(t, 3.38, 3.56) * (1 - ramp(t, 4.4, 5.0)); }
    function kOpen(t){ return ramp(t, 3.3, 3.62) * (1 - ramp(t, 4.9, 6.7)); }
    var NA = [116, 336], KK = [226, 446], MY = 200, MH = 54;   // channel x places, membrane middle and thickness
    SCENES.push({
      id: 'axon', graph: 'neuron-action-potential', tab: 'Axon', short: 'Axon',
      purpose: 'Which channels are open makes each part of the spike',
      series: [{ id: 'ap', role: 'v', label: 'membrane potential', at: [3.55, 0], dy: -12, anchor: 'start' }],
      step: 0.05, start: 0, xName: 'Time', xUnit: 'ms', xFmt: function(x){ return x.toFixed(2) + ' ms'; },
      cueText: 'Drag the graph',
      region: function(t){ var r = null; (E0.g.regions || []).forEach(function(q){ if(t >= q.x0 && t <= q.x1) r = q; }); return r ? { x0: r.x0, x1: r.x1 } : null; },
      init: function(E){
        var na = [0], kk = [0], n = 1600, dt = 8 / n;
        for(var i = 1; i <= n; i++){ var t = i * dt; na.push(na[i - 1] + naOpen(t) * dt); kk.push(kk[i - 1] + kOpen(t) * dt); }
        function at(a, t){ var k = clamp(t / dt, 0, n), j = Math.floor(k), f = k - j; return j >= n ? a[n] : a[j] + (a[j + 1] - a[j]) * f; }
        this.naC = function(t){ return at(na, t) / at(na, 8); };   // 0 before, 1 after: the share of this spike's Na+ that has crossed
        this.kC = function(t){ return at(kk, t) / at(kk, 8); };
        this.V = E.fn('ap');
      },
      draw: function(E, t){
        var V = this.V(t), s = '', i, na = naOpen(t), h = inact(t), kk = kOpen(t), nac = this.naC(t), kc = this.kC(t);
        s += '<rect class="gx-out" x="0" y="0" width="' + PW + '" height="' + (MY - MH / 2) + '"/><rect class="gx-in" x="0" y="' + (MY + MH / 2) + '" width="' + PW + '" height="' + (PH - MY - MH / 2) + '"/>';
        // the lipid bilayer: two rows of heads with tails
        var bl = '';
        for(i = 0; i < 40; i++){
          var x = 6 + i * 13.2;
          if(NA.concat(KK).some(function(c){ return Math.abs(x - c) < 26; })) continue;
          bl += '<path class="gx-tail" d="M' + (x - 2) + ',' + (MY - MH / 2 + 6) + 'v18M' + (x + 2) + ',' + (MY - MH / 2 + 6) + 'v18M' + (x - 2) + ',' + (MY + MH / 2 - 6) + 'v-18M' + (x + 2) + ',' + (MY + MH / 2 - 6) + 'v-18"/>' +
            '<circle class="gx-head" cx="' + x + '" cy="' + (MY - MH / 2 + 3) + '" r="6"/><circle class="gx-head" cx="' + x + '" cy="' + (MY + MH / 2 - 3) + '" r="6"/>';
        }
        s += '<g>' + bl + '</g>';
        // the charge across the membrane: + and - whose size follows the voltage (PhET's way); they swap sides above 0 mV
        var mag = clamp(Math.abs(V) / 75, 0, 1.2), outPlus = V < 0, ch = '';
        if(mag > 0.06) for(i = 0; i < 9; i++){
          var cx2 = 30 + i * 58, sz = 3 + 5 * mag;
          var top = '<path class="gx-chg is-' + (outPlus ? 'p' : 'm') + '" d="M' + (cx2 - sz) + ',' + (MY - MH / 2 - 16) + 'h' + (2 * sz) + (outPlus ? 'M' + cx2 + ',' + (MY - MH / 2 - 16 - sz) + 'v' + (2 * sz) : '') + '"/>';
          var bot = '<path class="gx-chg is-' + (outPlus ? 'm' : 'p') + '" d="M' + (cx2 - sz) + ',' + (MY + MH / 2 + 16) + 'h' + (2 * sz) + (outPlus ? '' : 'M' + cx2 + ',' + (MY + MH / 2 + 16 - sz) + 'v' + (2 * sz)) + '"/>';
          ch += top + bot;
        }
        s += '<g>' + ch + '</g>';
        // channels: two protein halves around a pore; the pore opens with the channel; Na+ channels have a plug inside
        function channel(cx, kind, open, plug){
          var gap = 3 + 11 * open, o = '';
          o += '<path class="gx-prot is-' + kind + '" d="M' + (cx - gap - 22) + ',' + (MY - MH / 2 - 8) + ' h22 v' + (MH + 16) + ' h-22 q-6,-' + ((MH + 16) / 2) + ' 0,-' + (MH + 16) + 'Z"/>';
          o += '<path class="gx-prot is-' + kind + '" d="M' + (cx + gap + 22) + ',' + (MY - MH / 2 - 8) + ' h-22 v' + (MH + 16) + ' h22 q6,-' + ((MH + 16) / 2) + ' 0,-' + (MH + 16) + 'Z"/>';
          if(kind === 'na'){
            var px = cx + 24 - 22 * plug, py = MY + MH / 2 + 18 - 12 * plug;
            o += '<path class="gx-plug-l is-na" d="M' + (cx + gap + 4) + ',' + (MY + MH / 2 + 8) + ' Q' + (cx + 28) + ',' + (MY + MH / 2 + 24) + ' ' + px.toFixed(1) + ',' + py.toFixed(1) + '"/><circle class="gx-plug is-na" cx="' + px.toFixed(1) + '" cy="' + py.toFixed(1) + '" r="7"/>';
          }
          return o;
        }
        NA.forEach(function(cx){ s += channel(cx, 'na', na, h); });
        KK.forEach(function(cx){ s += channel(cx, 'k', kk, 0); });
        // ions: Na+ mostly outside, K+ mostly inside; those that cross this spike move through the pores
        var ions = '', i2;
        scatter(22, 0.31).forEach(function(q){ var x = 10 + q[0] * (PW - 20), y = 14 + q[1] * (MY - MH / 2 - 44); if(NA.concat(KK).some(function(c){ return Math.abs(x - c) < 30; }) && y > MY - MH / 2 - 60) return; ions += '<circle class="gx-ion is-na" cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="8"/><path class="gx-ion-p" d="M' + (x - 3.5).toFixed(1) + ',' + y.toFixed(1) + 'h7M' + x.toFixed(1) + ',' + (y - 3.5).toFixed(1) + 'v7"/>'; });
        scatter(22, 0.77).forEach(function(q){ var x = 10 + q[0] * (PW - 20), y = MY + MH / 2 + 46 + q[1] * (PH - MY - MH / 2 - 60); if(NA.concat(KK).some(function(c){ return Math.abs(x - c) < 30; }) && y < MY + MH / 2 + 70) return; ions += '<circle class="gx-ion is-k" cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="8"/><path class="gx-ion-p" d="M' + (x - 3.5).toFixed(1) + ',' + y.toFixed(1) + 'h7M' + x.toFixed(1) + ',' + (y - 3.5).toFixed(1) + 'v7"/>'; });
        function crossing(cx, c, kind, dir){
          var o = '';
          for(i2 = 0; i2 < 4; i2++){
            var u = clamp(c * 5 - i2, 0, 1), y0 = dir > 0 ? MY - MH / 2 - 40 : MY + MH / 2 + 40, y1 = dir > 0 ? MY + MH / 2 + 40 + i2 * 6 : MY - MH / 2 - 40 - i2 * 6;
            var x = cx + (i2 % 2 ? 1 : -1) * (u > 0 && u < 1 ? 0 : 14 + i2 * 3), y = lerp(y0 - dir * i2 * 14, y1, u);
            o += '<circle class="gx-ion is-' + kind + '" cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="8"/><path class="gx-ion-p" d="M' + (x - 3.5).toFixed(1) + ',' + y.toFixed(1) + 'h7M' + x.toFixed(1) + ',' + (y - 3.5).toFixed(1) + 'v7"/>';
          }
          return o;
        }
        NA.forEach(function(cx){ ions += crossing(cx, nac, 'na', 1); });
        KK.forEach(function(cx){ ions += crossing(cx, kc, 'k', -1); });
        s += '<g>' + ions + '</g>';
        // flow arrows only while ions are crossing
        if(na > 0.3) NA.forEach(function(cx){ s += flowArrow([[cx - 34, MY - MH / 2 - 30], [cx - 34, MY + MH / 2 + 26]], 'is-na', 8); });
        if(kk > 0.3 && t < 6.6) KK.forEach(function(cx){ s += flowArrow([[cx - 34, MY + MH / 2 + 30], [cx - 34, MY - MH / 2 - 26]], 'is-k', 8); });
        s += lab(E, 12, 22, 'Outside', 'side', { anchor: 'start' }) + lab(E, 12, PH - 22, 'Inside', 'side', { anchor: 'start' });
        s += readout(E, PW - 14, PH - 18, minus(Math.round(V)), 'mV inside', 'v', 'end');
        s += lab(E, NA[0], MY - MH / 2 - 70, 'Na⁺ channel', 'na', { to: [NA[0], MY - MH / 2 - 10] });
        s += lab(E, KK[1], MY - MH / 2 - 70, 'K⁺ channel', 'k', { to: [KK[1], MY - MH / 2 - 10] });
        return s;
      },
      words: function(E, t){
        var V = this.V(t), na = naOpen(t), h = inact(t), kk = kOpen(t);
        if(na > 0.5) return [{ t: 'Threshold reached', role: 'v' }, { t: 'Na⁺ channels open', role: 'na', say: 'sodium channels open' }, { t: 'Na⁺ rushes in', role: 'na', say: 'sodium rushes in' }, { t: 'Depolarization', role: 'phase' }];
        if(h > 0.5 && kk > 0.5 && V > -70) return [{ t: 'Na⁺ channels plugged', role: 'na', say: 'sodium channels inactivate' }, { t: 'K⁺ channels open', role: 'k', join: '+', say: 'potassium channels open' }, { t: 'K⁺ out', role: 'k', say: 'potassium flows out' }, { t: 'Repolarization', role: 'phase' }];
        if(V < -71.2 && kk > 0.05) return [{ t: 'K⁺ channels slow to close', role: 'k', say: 'potassium channels are slow to close' }, { t: 'extra K⁺ out', role: 'k', say: 'extra potassium leaves' }, { t: 'Hyperpolarization', role: 'phase' }];
        if(t >= 0.4 && t <= 2.1 && V > -69.5) return [{ t: 'Weak stimulus', role: 'v' }, { t: 'small depolarization', role: 'v' }, { t: 'below threshold', role: 'v' }, { t: 'Graded potential', role: 'phase' }];
        if(t > 2.35 && t < 3.0 && V > -69.5) return [{ t: 'Stronger stimulus', role: 'v' }, { t: 'nears threshold', role: 'v', say: 'the membrane depolarizes toward threshold' }, { t: 'Graded potential', role: 'phase' }];
        return [{ t: 'Voltage-gated channels shut', role: 'side', say: 'the voltage-gated channels are shut' }, { t: 'inside more negative', role: 'v', say: 'the inside is more negative than the outside' }, { t: 'Resting potential', role: 'phase' }];
      },
      say: function(E, t){ return 'At ' + t.toFixed(2) + ' ms the inside is at ' + Math.round(this.V(t)) + ' millivolts. ' + E.text(t); }
    });
  })();
  var E0 = { g: { regions: [] } };   // the axon's region() reads its graph's regions (set in build)

  /* ---------------------------------------------------------------- 5 Sarcomere: length and tension */
  (function(){
    // frog fiber numbers from the graph's own intro: thick filament 1.6 um, thin filaments 1.0 um from each Z disc,
    // 100 percent = 2.1 um. 120 picture units per um.
    var U = 120, THICK = 1.6, THIN = 1.0, BARE = 0.155, REST = 2.1, CX = 260;
    var ROWS = [150, 200, 250], TROWS = [125, 175, 225, 275];
    function heads(){ var h = [], x; for(x = BARE + 0.05; x <= THICK / 2 - 0.02; x += 0.1){ h.push(x); } return h; }
    var HX = heads();
    SCENES.push({
      id: 'sarcomere', graph: 'mt-length-tension', tab: 'Sarcomere', short: 'Sarcomere',
      purpose: 'Filament overlap sets how hard a muscle fiber can pull',
      series: [{ id: 'lt', role: 'xb', label: 'active tension', at: [140, 0], dy: -14, anchor: 'start' }],
      step: 1, start: 100, xName: 'Sarcomere length', xUnit: '% of resting', xFmt: function(x){ return Math.round(x) + '%'; },
      cueText: 'Drag the graph',
      region: function(x){ var r = null; (E0.gs.regions || []).forEach(function(q){ if(x >= q.x0 && x <= q.x1) r = q; }); return r ? { x0: r.x0, x1: r.x1 } : null; },
      init: function(E){ this.T = E.fn('lt'); },
      draw: function(E, x){
        var L = x / 100 * REST, half = L / 2, T = clamp(this.T(x), 0, 100), s = '';
        var zl = CX - half * U, zr = CX + half * U;
        var tl = Math.min(THICK, L - 0.06) / 2;                        // the thick filament is stopped by the Z discs
        var crush = clamp((THICK - (L - 0.06)) / 0.5, 0, 1);
        s += '<rect class="gx-bg-myo" x="0" y="0" width="' + PW + '" height="' + PH + '"/>';
        // the band of myofibril and its neighbors' faint ends
        s += '<rect class="gx-fibril" x="-10" y="92" width="' + (PW + 20) + '" height="216" rx="20"/>';
        // thin filaments (actin): from each Z disc toward the middle, two strands twisted
        var thin = '';
        TROWS.forEach(function(y, r){
          [[zl, 1], [zr, -1]].forEach(function(z){
            var x0 = z[0], x1 = z[0] + z[1] * THIN * U, yo = (z[1] > 0 ? -2 : 2) * clamp((THIN * 2 - L) / 0.3, 0, 1);
            thin += '<path class="gx-actin" d="M' + x0.toFixed(1) + ',' + (y + yo).toFixed(1) + 'L' + x1.toFixed(1) + ',' + (y + yo).toFixed(1) + '"/>';
            for(var b = 0; b < 15; b++){ var bx = x0 + z[1] * (b + 0.5) * THIN * U / 15; thin += '<circle class="gx-actin-b" cx="' + bx.toFixed(1) + '" cy="' + (y + yo + (b % 2 ? 2.2 : -2.2)).toFixed(1) + '" r="3.1"/>'; }
          });
        });
        s += '<g>' + thin + '</g>';
        // thick filaments (myosin) with heads; heads in reach of actin pointing the right way attach (cross-bridges)
        var thick = '', bridges = '', want = Math.round(T / 100 * HX.length * 2 * ROWS.length * 2), cand = [];
        ROWS.forEach(function(y, r){
          var kink = crush * 7;
          thick += '<path class="gx-myosin" d="M' + (CX - tl * U).toFixed(1) + ',' + y + ' L' + (CX - tl * U * 0.6).toFixed(1) + ',' + (y - kink).toFixed(1) + ' L' + (CX - tl * U * 0.3).toFixed(1) + ',' + (y + kink).toFixed(1) + ' L' + (CX + tl * U * 0.3).toFixed(1) + ',' + (y - kink).toFixed(1) + ' L' + (CX + tl * U * 0.6).toFixed(1) + ',' + (y + kink).toFixed(1) + ' L' + (CX + tl * U).toFixed(1) + ',' + y + '"/>';
          [-1, 1].forEach(function(side){
            HX.forEach(function(hx, i){
              var sc = tl / (THICK / 2), px = CX + side * hx * U * sc;
              [-1, 1].forEach(function(up){
                var ty = y + up * 25, ownTip = half - THIN;   // the own-side thin filament reaches from the Z disc to |x| = half - THIN
                cand.push({ px: px, y: y, ty: ty, up: up, side: side, d: hx, ok: hx * sc >= ownTip - 0.02 && hx * sc <= half });
              });
            });
          });
        });
        // the tension the graph gives is the number of heads attached; they attach outermost first (the middle is where
        // thin filaments from both ends crowd past each other on a short sarcomere)
        var ok = cand.filter(function(c){ return c.ok; }).sort(function(a, b){ return b.d - a.d; }), attached = 0;
        ok.slice(0, want).forEach(function(c){ c.on = true; attached++; });
        cand.forEach(function(c){
          var ang = c.side > 0 ? -1 : 1, hx2 = c.px + ang * 6, hy = c.y + c.up * (c.on ? 17 : 11);
          if(c.on){ bridges += '<path class="gx-xb" d="M' + c.px.toFixed(1) + ',' + (c.y + c.up * 3) + ' L' + hx2.toFixed(1) + ',' + (c.ty - c.up * 4).toFixed(1) + '"/><circle class="gx-xb-h" cx="' + hx2.toFixed(1) + '" cy="' + (c.ty - c.up * 5).toFixed(1) + '" r="4.2"/>'; }
          else thick += '<path class="gx-head-m" d="M' + c.px.toFixed(1) + ',' + (c.y + c.up * 3) + ' L' + (c.px - ang * 5).toFixed(1) + ',' + hy.toFixed(1) + '"/>';
        });
        s += '<g>' + thick + '</g><g>' + bridges + '</g>';
        // Z discs and the M line
        [zl, zr].forEach(function(z){ var d = 'M' + z + ',100'; for(var k = 0; k < 10; k++) d += 'L' + (z + (k % 2 ? 6 : -6)) + ',' + (110 + k * 20); s += '<path class="gx-z" d="' + d + 'L' + z + ',300"/>'; });
        s += '<path class="gx-mline" d="M' + CX + ',110 V290"/>';
        // overlap brackets would be numbers: the tension is the readout
        s += readout(E, CX, 388, Math.round(T) + '%', 'of max tension', 'xb');
        s += lab(E, 8, 66, 'Z disc', 'z', { to: [zl, 104], anchor: 'start' });
        s += lab(E, CX, 40, 'Thick filament', 'myo', { to: [CX + tl * U * 0.45, ROWS[0] - 4] });
        s += lab(E, Math.min(PW - 66, zr + 8), 330, 'Thin filament', 'actin', { to: [zr - 30, TROWS[3] + 2] });
        if(attached) s += lab(E, Math.max(70, zl - 10), 330, 'Cross-bridges', 'xb', { to: [ok[0].px + (ok[0].side > 0 ? -6 : 6), ok[0].ty - ok[0].up * 5] });
        return s;
      },
      words: function(E, x){
        var T = this.T(x);
        if(x >= 169) return [{ t: 'Stretched so far', role: 'actin' }, { t: 'no overlap', role: 'actin' }, { t: 'no cross-bridges', role: 'xb' }, { t: 'No active tension', role: 'phase' }];
        if(x > 110) return [{ t: 'Stretched', role: 'actin' }, { t: 'less overlap', role: 'actin' }, { t: 'fewer cross-bridges', role: 'xb' }, { t: Math.round(T) + '% tension', role: 'phase' }];
        if(x >= 95) return [{ t: 'Thin filaments over every head', role: 'actin' }, { t: 'most cross-bridges', role: 'xb' }, { t: 'Greatest tension', role: 'phase' }];
        if(x >= 79) return [{ t: 'Thin filaments crowd the middle', role: 'actin' }, { t: 'they get in the way', role: 'actin' }, { t: Math.round(T) + '% tension', role: 'phase' }];
        if(x > 61) return [{ t: 'Thick filaments hit the Z discs', role: 'myo' }, { t: 'fewer cross-bridges', role: 'xb' }, { t: Math.round(T) + '% tension', role: 'phase' }];
        return [{ t: 'Thick filaments jammed into the Z discs', role: 'myo' }, { t: 'No active tension', role: 'phase' }];
      },
      say: function(E, x){ return 'At ' + Math.round(x) + ' percent of resting length the fiber can produce ' + Math.round(this.T(x)) + ' percent of its greatest tension. ' + E.text(x); }
    });
  })();

  /* ================================================================== the engine */
  function build(o){
    var K = window.LevlKit2, GM = window.AnpGraphMath, DATA = o.data;
    function graph(id){ for(var i = 0; i < DATA.graphs.length; i++) if(DATA.graphs[i].id === id) return DATA.graphs[i]; return null; }
    var scenes = SCENES.filter(function(sc){ return !!graph(sc.graph); });
    if(!scenes.length || !K || !GM) return null;
    E0.g = graph('neuron-action-potential') || { regions: [] };
    E0.gs = graph('mt-length-tension') || { regions: [] };
    var cur = scenes[0], view = { x: cur.start, target: cur.start }, raf = 0, last = 0, onScreen = true, wKey = '', E = null;

    var stage = document.createElement('div'); stage.className = 'gx';
    var tabs = K.tabs({ label: 'Which graph', items: scenes.map(function(sc){ return { value: sc.id, label: sc.tab, short: sc.short }; }), value: cur.id, big: true, onChange: function(v){ setTab(v, true); } });
    stage.appendChild(tabs.el);
    var head = K.head({ purpose: cur.purpose, how: { label: 'Show me how', onClick: function(){ startTour(); } } });
    stage.appendChild(head.el);
    var scene = document.createElement('div'); scene.className = 'gx-scene'; scene.id = 'gx-scene';
    scene.innerHTML = '<div class="gx-pic"><svg class="gx-psvg" viewBox="0 0 ' + PW + ' ' + PH + '" role="img" xmlns="http://www.w3.org/2000/svg" data-ls-text="keep"><defs>' +
      '<radialGradient id="gx-gm" cx="0.38" cy="0.32" r="0.8"><stop offset="0" stop-color="#D4685A"/><stop offset="0.65" stop-color="#B2463A"/><stop offset="1" stop-color="#86281F"/></radialGradient>' +
      '<radialGradient id="gx-gb" cx="0.4" cy="0.35" r="0.75"><stop offset="0" stop-color="#F08A72"/><stop offset="1" stop-color="#D2523E"/></radialGradient>' +
      '<radialGradient id="gx-gl" cx="0.4" cy="0.35" r="0.8"><stop offset="0" stop-color="#F7B7B9"/><stop offset="1" stop-color="#E58C93"/></radialGradient>' +
      '<radialGradient id="gx-gr" cx="0.45" cy="0.3" r="0.8"><stop offset="0" stop-color="#E5563F"/><stop offset="1" stop-color="#A3200F"/></radialGradient>' +
      '</defs><g class="gx-dyn"></g></svg></div>' +
      '<div class="gx-plot"><svg class="gx-gsvg" role="img" xmlns="http://www.w3.org/2000/svg" data-ls-text="keep"><g class="gx-gs"></g><g class="gx-gd"></g></svg></div>';
    stage.appendChild(scene);
    tabs.el.querySelectorAll('.tk2-tab').forEach(function(b){ b.setAttribute('aria-controls', scene.id); });
    var psvg = scene.querySelector('.gx-psvg'), dyn = scene.querySelector('.gx-dyn'), plotBox = scene.querySelector('.gx-plot'), gsvg = scene.querySelector('.gx-gsvg'), gS = gsvg.querySelector('.gx-gs'), gD = gsvg.querySelector('.gx-gd');
    var layer = K.layer(plotBox);
    var lines = document.createElement('div'); lines.className = 'gx-lines';
    var cause = K.cause({ label: 'Why' });
    lines.appendChild(cause.el);
    stage.appendChild(lines);
    var live = document.createElement('p'); live.className = 'tk2-sr'; live.setAttribute('aria-live', 'polite'); stage.appendChild(live);
    function say(t){ live.textContent = ''; setTimeout(function(){ live.textContent = t; }, 40); }

    // per screen: the graph, its curve functions and its plot geometry
    function fnFor(sc){
      var g = graph(sc.graph), cache = {};
      return function(id){
        if(cache[id]) return cache[id];
        var f = null;
        g.panels.forEach(function(p){ (p.series || []).forEach(function(se){ if(se.id === id) f = GM.seriesFn(se); }); });
        cache[id] = f ? function(x){ var v = f(clamp(x, g.x.min, g.x.max)); return v == null ? 0 : v; } : function(){ return 0; };
        return cache[id];
      };
    }
    scenes.forEach(function(sc){
      var ctx = { fn: fnFor(sc), g: graph(sc.graph) };
      if(sc.init) sc.init(ctx);
      sc.g = ctx.g; sc.fn = ctx.fn; sc.x = sc.start;
    });

    /* ---- the plot: drawn in screen pixels (viewBox = its box) so its text is the same size everywhere */
    var PL = null, scrub = null, cue = null;
    function panelOf(sc){ var g = sc.g, k = 0; g.panels.forEach(function(p, i){ (p.series || []).forEach(function(se){ if(se.id === sc.series[0].id) k = i; }); }); return g.panels[k]; }
    function plot(){
      var sc = cur, g = sc.g, p = panelOf(sc), r = plotBox.getBoundingClientRect(), w = Math.max(240, Math.round(r.width)), h = Math.max(180, Math.round(r.height));
      var phone = w < 420, ML = phone ? 60 : 64, MR = 26, MT = 50, MB = 40;
      var x0 = ML, x1 = w - MR, y0 = MT, y1 = h - MB, X = g.x, Y = p.y;
      function sx(x){ return x0 + (x - X.min) / (X.max - X.min) * (x1 - x0); }
      function sy(v){ return y1 - (v - Y.min) / (Y.max - Y.min) * (y1 - y0); }
      gsvg.setAttribute('viewBox', '0 0 ' + w + ' ' + h); gsvg.setAttribute('width', w); gsvg.setAttribute('height', h);
      gsvg.setAttribute('aria-label', g.alt || g.title);
      var s = '<rect class="gx-pbg" x="' + x0 + '" y="' + y0 + '" width="' + (x1 - x0) + '" height="' + (y1 - y0) + '" rx="6"/>';
      (sc.bands || []).forEach(function(b){ s += '<rect class="gx-band is-' + b.role + '" x="' + x0 + '" y="' + sy(b.y1) + '" width="' + (x1 - x0) + '" height="' + (sy(b.y0) - sy(b.y1)) + '"/><text class="gx-band-t is-' + b.role + '" x="' + (x1 - 6) + '" y="' + (sy(b.y1) + 15) + '" text-anchor="end">' + esc(b.label) + '</text>'; });
      s += '<g class="gx-reg"></g>';
      var yt = (Y.ticks || []).filter(function(v){ return v >= Y.min && v <= Y.max; });
      if(phone && yt.length > 5) yt = yt.filter(function(v, i){ return i % 2 === 0; });
      yt.forEach(function(v){ s += '<path class="gx-grid" d="M' + x0 + ',' + sy(v).toFixed(1) + 'H' + x1 + '"/><text class="gx-tick" x="' + (x0 - 6) + '" y="' + sy(v).toFixed(1) + '" dy="0.34em" text-anchor="end">' + minus(v >= 1000 ? n0(v) : v) + '</text>'; });
      var xt = (X.ticks || []).filter(function(v){ return v >= X.min && v <= X.max; });
      if(phone && xt.length > 6) xt = xt.filter(function(v, i){ return i % 2 === 0; });
      xt.forEach(function(v, i){ var first = !i && v === X.min; s += '<path class="gx-xt" d="M' + sx(v).toFixed(1) + ',' + y1 + 'v5"/><text class="gx-tick" x="' + (sx(v) + (first ? -2 : 0)).toFixed(1) + '" y="' + (y1 + 18) + '" text-anchor="' + (first ? 'start' : 'middle') + '">' + minus(v) + '</text>'; });
      s += '<path class="gx-axis" d="M' + x0 + ',' + y0 + 'V' + y1 + 'H' + x1 + '"/>';
      s += '<text class="gx-alab" x="' + ((x0 + x1) / 2) + '" y="' + (h - 6) + '" text-anchor="middle">' + esc(sc.xName + ' (' + sc.xUnit + ')') + '</text>';
      var yl = Y.label + (Y.unit ? ' (' + Y.unit + ')' : '');
      if(yl.length * 7 > y1 - y0) yl = Y.label;
      s += '<text class="gx-alab" transform="translate(13,' + ((y0 + y1) / 2).toFixed(1) + ') rotate(-90)" text-anchor="middle">' + esc(yl) + '</text>';
      (p.hlines || []).forEach(function(l){ if(l.y < Y.min || l.y > Y.max || l.faint) return; s += '<path class="gx-hl" d="M' + x0 + ',' + sy(l.y).toFixed(1) + 'H' + x1 + '"/><text class="gx-hl-t" x="' + (x1 - 4) + '" y="' + (sy(l.y) - 5).toFixed(1) + '" text-anchor="end">' + esc(l.label.replace(/,.*$/, '')) + '</text>'; });
      sc.series.forEach(function(se){
        var f = sc.fn(se.id), d = '', n = 220;
        for(var i = 0; i <= n; i++){ var xx = X.min + (X.max - X.min) * i / n; d += (i ? 'L' : 'M') + sx(xx).toFixed(1) + ',' + sy(clamp(f(xx), Y.min, Y.max)).toFixed(1); }
        s += '<path class="gx-curve is-' + se.role + '" d="' + d + '"/>';
      });
      // curve names on the lines, kept apart
      var placed = [];
      sc.series.forEach(function(se){
        var f = sc.fn(se.id), lx = se.at[0], ly = sy(f(lx)) + (se.dy || -12), a = se.anchor || 'middle', tw = se.label.length * 6.6;
        var bx = a === 'start' ? sx(lx) : a === 'end' ? sx(lx) - tw : sx(lx) - tw / 2;
        if(bx < x0 + 2){ bx = x0 + 2; a = 'start'; lx = X.min + (bx - x0) / (x1 - x0) * (X.max - X.min); }
        if(bx + tw > x1 - 2){ bx = x1 - 2 - tw; a = 'start'; }
        ly = clamp(ly, y0 + 26, y1 - 4);   // clear of the knob and the first-visit cue above the plot
        placed.forEach(function(q){ if(Math.abs(q - ly) < 14) ly = q + 15; });
        placed.push(ly);
        s += '<text class="gx-cname is-' + se.role + '" x="' + bx.toFixed(1) + '" y="' + ly.toFixed(1) + '" text-anchor="start">' + esc(se.label) + '</text>';
      });
      gS.innerHTML = s;
      PL = { sx: sx, sy: sy, x0: x0, x1: x1, y0: y0, y1: y1, w: w, h: h, Y: Y };
      var rect = [x0, y0, x1, y1];
      if(!scrub || scrub._for !== sc.id){
        if(scrub) scrub.el.remove();
        scrub = K.scrub(plotBox, { key: 'anp-graphs-x', label: sc.xName + ' on the ' + sc.tab.toLowerCase() + ' graph', min: X.min, max: X.max, step: sc.step, value: view.target, rect: rect, chip: false,
          valuetext: function(v){ return sc.xFmt(v) + '. ' + E.text(v); },
          onStart: function(){ hideCue(true); tourDid('drag'); },
          onInput: function(v){ hideCue(true); tourDid('drag'); go(v); },
          onEnd: function(){ say(cur.say(E, view.target)); } });
        scrub._for = sc.id;
        // the knob is part of the graph, above its first frame of the stage layer
        layer.el.parentNode.appendChild(layer.el);
      } else scrub.place(rect, X.min, X.max);
      paintPlot();
      if(cue && cue.active()) cue.place();
    }
    function paintPlot(){
      if(!PL) return;
      var sc = cur, x = view.x, d = '';
      // the region the shown moment is in, shaded (named on the cause line)
      var reg = sc.region ? sc.region(x) : null, rg = gS.querySelector('.gx-reg');
      if(rg){
        var rk = reg ? reg.x0 + ':' + reg.x1 : '';
        if(rg.getAttribute('data-k') !== rk){ rg.setAttribute('data-k', rk); rg.innerHTML = reg ? '<rect class="gx-regr" x="' + PL.sx(reg.x0).toFixed(1) + '" y="' + PL.y0 + '" width="' + (PL.sx(reg.x1) - PL.sx(reg.x0)).toFixed(1) + '" height="' + (PL.y1 - PL.y0) + '"/>' + (reg.name ? '<text class="gx-reg-t" x="' + ((PL.sx(reg.x0) + PL.sx(reg.x1)) / 2).toFixed(1) + '" y="' + (PL.y1 - 8) + '" text-anchor="middle">' + esc(reg.name) + '</text>' : '') : ''; }
      }
      sc.series.forEach(function(se){
        var v = clamp(sc.fn(se.id)(x), PL.Y.min, PL.Y.max);
        d += '<circle class="gx-pt is-' + se.role + '" cx="' + PL.sx(x).toFixed(1) + '" cy="' + PL.sy(v).toFixed(1) + '" r="6"/>';
      });
      gD.innerHTML = d;
    }

    /* ---- the picture */
    function scale(){ var r = psvg.getBoundingClientRect(); return r.width ? r.width / PW : 1; }
    E = {
      fs: 14, text: function(x){ return cause.text(); },
      words: function(x){ return cur.words(E, x); }
    };
    function draw(){
      var k = scale(); E.fs = clamp((k < 0.8 ? 12 : 13.2) / k, 9, 26); E.fn = cur.fn; E.g = cur.g;
      dyn.innerHTML = cur.draw(E, view.x);
      psvg.setAttribute('aria-label', cur.tab + ': ' + cur.say(E, view.x));
      paintPlot();
      var ws = cur.words(E, view.x), key = JSON.stringify(ws);
      if(key !== wKey){ wKey = key; cause.set(ws); }
    }
    E.text = function(x){ var ws = cur.words(E, x); return ws.map(function(p, i){ return (i ? (p.join === '+' ? ' and ' : ', then ') : '') + (p.say || p.t); }).join('') + '.'; };

    /* ---- the shown x chases the cursor: every change is seen happening */
    function tick(ts){
      var dt = last ? Math.min(50, ts - last) : 16; last = ts;
      var d = view.target - view.x, span = cur.g.x.max - cur.g.x.min;
      if(Math.abs(d) < span * 0.0004){ view.x = view.target; raf = 0; last = 0; draw(); return; }
      var step = d * (1 - Math.exp(-dt / 90)), min = span * 0.0025 * dt / 16;
      view.x += Math.abs(step) < min ? Math.sign(d) * Math.min(Math.abs(d), min) : step;
      draw();
      raf = requestAnimationFrame(tick);
    }
    function fade(){
      var g = document.createElementNS(NS, 'g'); g.setAttribute('class', 'gx-fade'); g.innerHTML = dyn.innerHTML; psvg.appendChild(g);
      var done = function(){ if(g.parentNode) g.parentNode.removeChild(g); };
      if(g.animate){ var an = g.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 220, easing: 'linear' }); an.onfinish = done; setTimeout(done, 400); } else done();
    }
    function go(v){
      view.target = v; cur.x = v;
      if(K.reduced() || !window.requestAnimationFrame || !onScreen){ if(raf){ cancelAnimationFrame(raf); raf = 0; } var was = view.x; view.x = v; if(was !== v && onScreen) fade(); draw(); return; }
      if(!raf){ last = 0; raf = requestAnimationFrame(tick); }
    }

    /* ---- tabs */
    function setTab(id, user){
      var sc = scenes.filter(function(x){ return x.id === id; })[0];
      if(!sc) return;
      if(raf){ cancelAnimationFrame(raf); raf = 0; }
      cur = sc; view.x = view.target = sc.x; wKey = '';
      tabs.value(sc.id); head.purpose(sc.purpose);
      scene.setAttribute('data-scene', sc.id);
      plot(); draw(); refHtml();
      if(user){ try{ history.replaceState(null, '', location.pathname + location.search + '#explore/' + sc.id); }catch(e){} say(sc.tab + '. ' + sc.say(E, view.x)); }
      if(cue){ if(cue.active()){ cue.hide(false); makeCue(); } }
    }

    /* ---- the first-visit cue and "Show me how" */
    function makeCue(){
      var right = !PL || PL.sx(view.target) < (PL.x0 + PL.x1) / 2;
      cue = K.cue(layer, { key: 'anp-graphs', text: cur.cueText, side: right ? 'right' : 'left', at: function(){ return PL ? [PL.sx(view.target), PL.y0 - 14] : [0, 0]; } });
      cue.show();
    }
    function hideCue(used){ if(cue && cue.active()) cue.hide(used); }
    stage.addEventListener('keydown', function(e){ if(/^(Arrow|Page|Home|End)/.test(e.key) && e.target.classList && e.target.classList.contains('tk2-in')) hideCue(true); }, true);
    var tour = K.tour({ key: 'anp-graphs', label: 'Show me how', steps: [
      { id: 'drag', text: 'Drag along the graph. The picture follows the moment you are on.', target: function(){ return scrub ? scrub.el.querySelector('.tk2-knob') : plotBox; } },
      { id: 'read', text: 'Watch the part change: what it does is what the curve records.', target: function(){ return scene.querySelector('.gx-pic'); } },
      { id: 'why', text: 'The line below says why, in the colours of the parts.', target: function(){ return cause.el; } }],
      onClose: function(had){ if(had) try{ head.how.focus({ preventScroll: true }); }catch(e){} } });
    function tourDid(id){ if(tour.active()) tour.did(id); }
    function startTour(){ hideCue(false); tour.start(true); }

    /* ---- "?" for this screen */
    var ref = document.createElement('div'); ref.className = 'ls-sec gx-ref';
    function topicLink(id){ var ts = (window.AnpCurriculum || {}).topics || [], t = ts.filter(function(x){ return x.id === id; })[0]; return t ? t : null; }
    function refHtml(){
      var g = cur.g, t = topicLink(g.topic), B = o.base || '../';
      ref.innerHTML = '<h3 class="ls-h">' + esc(g.title) + '</h3><p>' + g.intro + '</p>' +
        '<p class="ls-sub">Drag anywhere on the graph, or use the arrow keys on it. The picture shows that moment; the line under it says why. Pictures are drawn to show the idea, not to scale.</p>' +
        '<p><button type="button" class="btn-outline gx-ref-q" data-g="' + esc(g.id) + '">Questions on this graph (' + g.questions.length + ')</button></p>' +
        (t && t.built ? '<p>Topic: <a href="' + esc(B + 'lessons/' + t.id + '.html') + '">' + esc(t.title) + '</a> · <a href="' + esc(B + 'notes/' + t.id + '.html') + '">notes</a></p>' : '') +
        '<p><button type="button" class="tk2-link gx-ref-how">Show me how</button></p>';
    }
    ref.addEventListener('click', function(e){
      var q = e.target.closest('.gx-ref-q'); if(q){ if(o.studio) o.studio.close(); if(o.onQuiz) o.onQuiz(q.getAttribute('data-g')); return; }
      if(e.target.closest('.gx-ref-how')){ if(o.studio) o.studio.close(); setTimeout(startTour, 60); }
    });

    /* ---- sizes */
    var rz = 0;
    function resized(){ clearTimeout(rz); rz = setTimeout(function(){ if(!stage.isConnected || !plotBox.offsetWidth) return; plot(); draw(); }, 60); }
    if(window.ResizeObserver){ var ro = new ResizeObserver(resized); ro.observe(plotBox); ro.observe(scene.querySelector('.gx-pic')); }
    window.addEventListener('resize', resized);

    setTab(cur.id, false);
    var started = false;
    function shown(on){
      onScreen = !!on;
      if(!on){ hideCue(false); return; }
      setTimeout(function(){ plot(); draw(); if(!started){ started = true; makeCue(); } }, 30);
    }
    var api = {
      stage: stage, ref: ref, shown: shown,
      tab: function(v){ if(v === undefined) return cur.id; setTab(v, false); },
      graphOf: function(id){ var sc = scenes.filter(function(x){ return x.id === id; })[0]; return sc ? sc.graph : null; },
      /* tabFor({ tab } | { graph } | { topic, chapter, topicOf }) -> a screen id or null */
      tabFor: function(q){
        var hit = null;
        scenes.forEach(function(sc){
          if(hit) return;
          if(q.tab && q.tab === sc.id) hit = sc.id;
          else if(q.graph && q.graph === sc.graph) hit = sc.id;
          else if(q.topic && q.topic === sc.g.topic) hit = sc.id;
          else if(q.chapter && q.topicOf){ var t = q.topicOf(sc.g.topic); if(t && t.chapter === q.chapter) hit = sc.id; }
        });
        return hit;
      },
      _scenes: scenes, _view: view, _go: go
    };
    window.AnpGraphExplore.current = api;   // for the sweep test (scripts/tools-v2/anp-graphs-sweep.mjs)
    return api;
  }

  window.AnpGraphExplore = { build: build, SCENES: SCENES };
})();
