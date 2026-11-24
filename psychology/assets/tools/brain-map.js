/* Brain map (docs/appsych-spec.md section 6; tools v2: docs/tools-v2-brain-map-brief.md). OWNED BY THIS TOOL ONLY.
   Mounts into #app with ApPsychTools.kit2 (the course's adapter for the shared kit, assets/course/tool-kit2.js); the
   model is ApPsychMath.brainMap (psychology/assets/tools/math/brain-map.js), the content psychology/data/tools/
   brain-map.json (served filtered as assets/tool-data/brain-map.json).

   One idea: every part of the brain has a place and a job, and damage there shows the job.
   EXPLORE, three tabs, the picture is the control:
     Outside      the left hemisphere seen from the left (front on the left): the four lobes in their colors, the
                  motor and touch strips, Broca's and Wernicke's areas, the auditory and visual cortex, the cerebellum,
                  pons and medulla. Tap any part (what is drawn under the finger, or its pin): its name opens on a card
                  beside it (K.spots), the cause line says what it does. "If damaged" grows a lesion on it and the
                  line says what changes. The motor and touch strips light the side of the body they serve.
     Inside       the brain cut down the middle (the right hemisphere's inner surface, front on the left): corpus
                  callosum, thalamus, hypothalamus, pituitary, brainstem with the reticular activating system,
                  cerebellum, and three deep parts seen through the tissue (hippocampus, amygdala, reward center).
     Split brain  a person seen from above, looking at a dot: tap a side of the screen and the word flashes there;
                  it travels to the opposite hemisphere, crosses the corpus callosum or stops at the cut, the patient
                  names it or not (speech is usually on the left) and the hand run by the hemisphere that has it
                  finds the object. Tap the corpus callosum to cut it (a person with it intact comes in instead of
                  healing it).
   Every change is animated (a part's color grows from where it was tapped, the lesion spreads, the signal travels);
   reduced motion gets a short cross fade and the result at once. Labels and the cause line read what is drawn.
   TEST YOURSELF: the step drill over the model's generate() (damage cases, methods and fMRI, split brain, one side
   of the body, name the structure), its records unchanged; its figures are drawn by the same art. */
(function(){
  'use strict';
  var T = window.ApPsychTools, M = window.ApPsychMath;
  if(!T || !M || !M.brainMap || M.brainMap.stub) return;
  var B = M.brainMap, R = B.REGIONS, esc = T.esc;
  var NS = 'http://www.w3.org/2000/svg';
  function r1(v){ return Math.round(v * 10) / 10; }
  function clamp(v, a, b){ return Math.max(a, Math.min(b, v)); }
  function ease(t){ t = clamp(t, 0, 1); return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }

  /* ----------------------------------------------------------- geometry */
  /* Catmull-Rom through points, sampled into a dense polyline (the same points draw a shape and hit-test it). */
  function curve(pts, closed, seg){
    seg = seg || 8;
    var n = pts.length, out = [], at = function(i){ return closed ? pts[(i + n) % n] : pts[Math.max(0, Math.min(n - 1, i))]; };
    for(var i = 0; i < (closed ? n : n - 1); i++){
      var p0 = at(i - 1), p1 = at(i), p2 = at(i + 1), p3 = at(i + 2);
      for(var s = 0; s < seg; s++){
        var t = s / seg, t2 = t * t, t3 = t2 * t;
        out.push([0.5 * (2 * p1[0] + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3),
          0.5 * (2 * p1[1] + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3)]);
      }
    }
    if(!closed) out.push(pts[n - 1].slice());
    return out;
  }
  function dOf(poly, closed){ return 'M' + poly.map(function(p){ return r1(p[0]) + ' ' + r1(p[1]); }).join('L') + (closed === false ? '' : 'Z'); }
  function ell(cx, cy, rx, ry, deg, n){
    var o = [], a0 = (deg || 0) * Math.PI / 180, c = Math.cos(a0), s = Math.sin(a0); n = n || 40;
    for(var i = 0; i < n; i++){ var a = i / n * Math.PI * 2, x = Math.cos(a) * rx, y = Math.sin(a) * ry; o.push([cx + x * c - y * s, cy + x * s + y * c]); }
    return o;
  }
  function shift(pts, dx, dy){ return pts.map(function(p){ return [p[0] + dx, p[1] + (dy || 0)]; }); }
  function inPoly(poly, x, y){
    var inside = false;
    for(var i = 0, j = poly.length - 1; i < poly.length; j = i++){
      var a = poly[i], b = poly[j];
      if(((a[1] > y) !== (b[1] > y)) && (x < (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]) + a[0])) inside = !inside;
    }
    return inside;
  }
  /* a band of varying width along a centre line (widths at the given points, linear between) */
  function ribbon(pts, widths, seg){
    var c = curve(pts, false, seg || 8), n = c.length, L = [], Rr = [];
    for(var i = 0; i < n; i++){
      var a = c[Math.max(0, i - 1)], b = c[Math.min(n - 1, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1;
      var f = i / (n - 1) * (widths.length - 1), k = Math.min(widths.length - 2, Math.floor(f)), w = (widths[k] + (widths[k + 1] - widths[k]) * (f - k)) / 2;
      L.push([c[i][0] - dy / l * w, c[i][1] + dx / l * w]); Rr.push([c[i][0] + dy / l * w, c[i][1] - dx / l * w]);
    }
    return L.concat(Rr.reverse());
  }
  function seeded(seed){ var s = seed >>> 0; return function(){ s = (s + 0x6D2B79F5) >>> 0; var t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

  /* ------------------------------------------------------- the two views */
  /* One frame for both views: 1000 x 720 picture units, front on the left. Every region is a polygon (hit tests and
     drawing use the same points) and the clip paths it is drawn inside (the cerebrum's outline, its lobe). */
  var VW = 1000, VH = 720;
  var TOP = [[72, 330], [80, 265], [112, 205], [165, 152], [232, 112], [312, 82], [400, 64], [495, 56], [590, 62], [680, 82], [760, 118], [830, 168], [884, 228], [920, 292], [938, 352], [935, 405], [912, 445]];
  var HEAD = curve([[300, 830], [250, 760], [150, 742], [52, 734], [18, 700], [12, 652], [-4, 628], [6, 608], [-10, 588], [2, 566], [-14, 548], [-52, 516], [-48, 490], [8, 448], [26, 404], [14, 360], [22, 300], [44, 222], [96, 140], [180, 76], [300, 34], [440, 16], [590, 22], [730, 52], [850, 112], [944, 200], [1000, 308], [1018, 430], [1004, 540], [958, 640], [900, 720], [880, 830]], true, 8);
  var G = { outside: build('outside'), inside: build('inside') };
  function build(view){
    var g = { view: view, reg: {}, order: [], sulci: [], minor: [] };
    function region(id, poly, within, lv, pin){ g.reg[id] = { id: id, poly: poly, within: within || [], lv: lv || 'high', pin: pin }; g.order.push(id); }
    if(view === 'outside'){
      var OUT = curve(TOP.concat([[872, 468], [820, 480], [768, 486], [712, 496], [650, 512], [580, 527], [505, 536], [430, 532], [360, 520], [300, 500], [262, 475], [250, 450], [258, 430], [280, 414], [232, 418], [160, 406], [108, 382], [80, 354]]), true, 8);
      g.outline = OUT;
      var SYL = curve([[280, 414], [340, 392], [420, 368], [500, 345], [560, 326], [600, 308], [635, 282]], false, 8);
      var CEN = curve([[554, 20], [548, 58], [535, 110], [514, 165], [500, 215], [480, 265], [464, 310], [455, 342]], false, 8);
      var PO = curve([[818, 100], [812, 150], [800, 250], [793, 320], [786, 410], [782, 488]], false, 8);
      var TP = curve([[635, 282], [700, 296], [793, 320]], false, 8);
      var cenEnd = CEN[CEN.length - 1];
      var sylFront = SYL.filter(function(p){ return p[0] <= cenEnd[0] + 6; });
      var sylBack = SYL.filter(function(p){ return p[0] > cenEnd[0] + 6; });
      var poUpper = PO.filter(function(p){ return p[1] <= 320; }), poLower = PO.filter(function(p){ return p[1] >= 320; });
      var F = [[-100, -100], [CEN[0][0], -100]].concat(CEN, sylFront.slice().reverse(), [[-100, 800]]);
      var Pp = [[CEN[0][0], -100], [PO[0][0], -100]].concat(poUpper, TP.slice().reverse(), sylBack.slice().reverse(), [[cenEnd[0], cenEnd[1] + 10]], CEN.slice().reverse());
      var Tt = sylFront.concat(sylBack, TP, poLower, [[782, 900], [200, 900], [200, 440]]);
      var Oo = [[PO[0][0], -100], [1100, -100], [1100, 900], [782, 900]].concat(PO.slice().reverse());
      // the lobes first, so a tap inside an area (listed later) picks the area: hit tests take the last match
      region('frontal', F, ['out'], 'high', [420, 150]);
      region('parietal', Pp, ['out'], 'high', [682, 196]);
      region('temporal', Tt, ['out'], 'high', [430, 470]);
      region('occipital', Oo, ['out'], 'high', [862, 252]);
      region('prefrontal', curve([[-100, -100], [352, -100], [352, 40], [330, 150], [310, 250], [292, 330], [279, 400], [270, 440], [-100, 800]], false, 4), ['out', 'frontal'], 'high', [185, 265]);
      region('motor', CEN.concat(shift(CEN, -52).reverse()), ['out', 'frontal'], 'high', [509, 110]);
      region('somatosensory', CEN.concat(shift(CEN, 52).reverse()), ['out', 'parietal'], 'high', [531, 205]);
      region('broca', ell(352, 354, 48, 27, -18), ['out', 'frontal'], 'high', [352, 352]);
      region('auditory', ell(500, 386, 60, 19, -17), ['out', 'temporal'], 'high', [500, 386]);
      region('wernicke', ell(652, 322, 50, 27, -22), ['out', 'temporal'], 'high', [652, 322]);
      region('visual', ell(930, 388, 46, 78, 0), ['out', 'occipital'], 'high', [912, 392]);
      g.stem = {
        cord: curve([[594, 688], [636, 688], [634, 740], [598, 740]], true, 4),
        medulla: curve([[574, 600], [648, 602], [654, 648], [642, 690], [614, 702], [588, 692], [578, 650]], true, 8),
        pons: curve([[556, 532], [610, 526], [662, 540], [670, 580], [652, 614], [604, 624], [564, 606], [550, 570]], true, 8)
      };
      g.stemAll = curve([[556, 530], [612, 522], [664, 536], [674, 578], [656, 612], [648, 640], [652, 668], [640, 700], [634, 760], [598, 760], [596, 700], [584, 668], [580, 634], [566, 610], [550, 572]], true, 8);
      g.cbl = curve([[652, 518], [704, 502], [772, 494], [842, 482], [902, 464], [934, 476], [944, 514], [922, 566], [874, 612], [804, 640], [732, 642], [678, 620], [650, 584], [642, 546]], true, 8);
      region('pons', g.stem.pons, [], 'low', [600, 572]);
      region('medulla', g.stem.medulla, [], 'low', [614, 652]);
      region('cerebellum', g.cbl, [], 'low', [806, 572]);
      g.lines = { syl: SYL, cen: CEN, pre: shift(CEN.slice(2), -52), post: shift(CEN.slice(2), 52), po: PO.slice(8), tp: TP };
      // the folds (sulci) beside the named grooves: hand placed, so they follow each lobe's real direction
      g.sulci = [
        [[178, 176], [250, 152], [332, 142], [420, 132], [466, 128]], [[138, 280], [222, 254], [302, 242], [382, 240], [434, 236]],
        [[104, 330], [160, 336], [230, 326], [268, 312]], [[262, 96], [304, 112], [362, 100]], [[128, 218], [150, 244], [140, 262]],
        [[226, 196], [244, 220], [236, 236]], [[332, 392], [326, 362], [334, 338]], [[300, 404], [286, 384]], [[396, 190], [384, 214], [394, 230]],
        [[588, 150], [640, 176], [700, 210], [760, 240], [800, 262]], [[596, 252], [624, 238], [660, 242], [676, 266]], [[700, 282], [732, 266], [764, 280]],
        [[640, 104], [690, 120], [724, 140]], [[724, 176], [752, 190], [770, 214]],
        [[300, 462], [380, 440], [460, 422], [540, 402], [610, 372], [680, 334], [730, 304]], [[330, 506], [420, 492], [520, 480], [620, 462], [720, 432], [772, 404]],
        [[822, 320], [862, 310], [906, 322]], [[828, 402], [878, 422], [920, 418]], [[838, 196], [870, 232]], [[812, 444], [852, 458]], [[878, 270], [904, 290]]
      ];
    } else {
      var INS = curve(TOP.concat([[872, 470], [820, 478], [762, 470], [704, 458], [646, 450], [580, 448], [520, 446], [470, 432], [440, 424], [400, 428], [350, 418], [290, 420], [220, 416], [150, 404], [105, 380], [80, 354]]), true, 8);
      g.outline = INS;
      var CING = curve([[176, 300], [204, 216], [282, 166], [400, 142], [520, 140], [600, 146], [640, 122], [660, 92], [668, 40]], false, 8);
      var POm = curve([[818, 100], [812, 150], [790, 222], [762, 290], [736, 342]], false, 8);
      var CAL = curve([[736, 342], [790, 360], [850, 370], [940, 372]], false, 8);
      var Fm = [[-100, -100], [560, -100], [560, 141]].concat(CING.filter(function(p){ return p[0] < 560 && p[1] > 120; }).reverse(), [[176, 300], [226, 338], [300, 384], [384, 446], [384, 800], [-100, 800]]);
      var Pm = [[560, -100], [POm[0][0], -100]].concat(POm, [[700, 300], [660, 250], [642, 180], [600, 147], [560, 141]]);
      var Om = [[POm[0][0], -100], [1100, -100], [1100, 640], [800, 640], [762, 470], [736, 400]].concat(POm.slice().reverse());
      region('frontal', Fm, ['out'], 'high', [232, 152]);
      region('parietal', Pm, ['out'], 'high', [694, 154]);
      region('occipital', Om, ['out'], 'high', [872, 296]);
      region('visual', ribbon([[740, 342], [790, 360], [850, 370], [944, 372]], [30, 52, 56, 60]), ['out', 'occipital'], 'high', [852, 376]);
      g.cbl = curve([[640, 470], [700, 466], [770, 476], [850, 480], [914, 472], [938, 510], [914, 568], [862, 614], [792, 638], [722, 630], [670, 602], [642, 562], [634, 516]], true, 8);
      g.stem = {
        mid: curve([[500, 392], [560, 384], [618, 396], [642, 430], [634, 468], [592, 474], [526, 468], [506, 438]], true, 8),
        pons: curve([[512, 466], [580, 470], [626, 480], [632, 528], [608, 562], [544, 564], [514, 540], [506, 500]], true, 8),
        medulla: curve([[548, 556], [622, 556], [628, 600], [618, 648], [602, 692], [576, 692], [562, 648], [552, 600]], true, 8),
        cord: curve([[574, 686], [606, 686], [604, 740], [576, 740]], true, 4)
      };
      g.stemAll = curve([[500, 392], [560, 384], [618, 396], [642, 430], [636, 466], [630, 480], [634, 528], [614, 558], [628, 600], [618, 648], [606, 690], [604, 760], [576, 760], [576, 690], [560, 648], [550, 600], [544, 566], [516, 542], [506, 500], [512, 466], [504, 438]], true, 8);
      g.cc = ribbon([[318, 336], [296, 292], [312, 250], [370, 222], [450, 208], [540, 206], [610, 218], [655, 246], [670, 282]], [12, 22, 21, 18, 16, 16, 17, 23, 30]);
      g.fornix = ribbon([[662, 292], [610, 304], [540, 302], [470, 318], [432, 350], [418, 382]], [11, 12, 11, 10, 9, 8]);
      g.thal = ell(522, 326, 60, 36, -8);
      g.hyp = curve([[436, 364], [478, 360], [498, 386], [484, 412], [452, 422], [428, 404], [424, 382]], true, 8);
      g.pit = ell(404, 474, 24, 17, 0);
      g.chiasm = ell(392, 428, 18, 8, -8);
      g.mam = ell(492, 424, 10, 9, 0);
      g.v4 = curve([[630, 474], [664, 508], [632, 544], [622, 508]], true, 6);
      g.amy = ell(470, 450, 25, 18, -12);
      g.hip = ribbon([[494, 454], [548, 450], [600, 444], [644, 424], [676, 388], [690, 346]], [26, 28, 26, 22, 17, 11]);
      g.rew = ell(360, 352, 22, 15, -10);
      g.ras = [[562, 398], [589, 398], [589, 640], [562, 640]];   // the dotted core only: the pons and medulla own the rest
      region('callosum', g.cc, [], 'top', [470, 212]);
      region('thalamus', g.thal, [], 'top', [530, 320]);
      region('hypothalamus', g.hyp, [], 'top', [452, 388]);
      region('pituitary', g.pit, [], 'top', [404, 474]);
      region('pons', g.stem.pons, [], 'top', [530, 508]);
      region('medulla', g.stem.medulla, [], 'top', [604, 618]);
      region('ras', g.ras, [], 'top', [584, 432]);
      region('cerebellum', g.cbl, [], 'top', [802, 560]);
      region('reward', g.rew, [], 'top', [360, 352]);
      region('amygdala', g.amy, [], 'top', [470, 450]);
      region('hippocampus', g.hip, [], 'top', [652, 404]);
      g.lines = { cing: CING, po: POm, cal: CAL };
      g.sulci = [
        [[120, 250], [170, 214], [210, 196]], [[250, 120], [300, 132], [360, 120]], [[150, 330], [200, 350], [214, 384]], [[420, 98], [470, 112], [520, 104]],
        [[700, 104], [730, 150], [744, 196]], [[860, 238], [890, 276]], [[790, 410], [850, 420], [900, 412]], [[820, 300], [860, 330]], [[296, 182], [332, 200], [384, 190]]
      ];
    }
    g.minor = folds(g, view);
    return g;
  }
  /* The folds between the named grooves: evenly spaced wavy streamlines that follow each lobe's grain (frontal folds
     run front to back, the strips beside the central sulcus run with it, temporal folds along the lateral fissure;
     on the inside they curve round the corpus callosum). Seeded, so every visit draws the same brain. */
  function folds(g, view){
    var D = 19, cell = D, grid = {}, rnd = seeded(view === 'outside' ? 1907 : 2311), out = [], n = 0;
    function add(p, id){ var k = Math.floor(p[0] / cell) + ',' + Math.floor(p[1] / cell); (grid[k] = grid[k] || []).push([p[0], p[1], id]); }
    function markLine(pts, id){ pts.forEach(function(p){ add(p, id); }); }
    g.sulci.forEach(function(sx, i){ markLine(curve(sx, false, 14), 'm' + i); });
    Object.keys(g.lines).forEach(function(k){ markLine(g.lines[k], 'L' + k); });
    function free(x, y, id, d){
      var cx = Math.floor(x / cell), cy = Math.floor(y / cell);
      for(var dx = -1; dx <= 1; dx++) for(var dy = -1; dy <= 1; dy++){
        var list = grid[(cx + dx) + ',' + (cy + dy)]; if(!list) continue;
        for(var i = 0; i < list.length; i++){ var q = list[i]; if(q[2] !== id && Math.hypot(q[0] - x, q[1] - y) < d) return false; }
      }
      return true;
    }
    var core = view === 'inside' ? ell(500, 318, 222, 128) : null;
    var cingBand = view === 'inside' ? ribbon([[176, 304], [204, 228], [282, 182], [400, 158], [520, 156], [600, 162], [652, 190], [692, 246], [704, 300]], [44, 52, 56, 58, 58, 56, 52, 48, 40]) : null;
    var lobes = ['frontal', 'parietal', 'temporal', 'occipital'];
    function zone(x, y){
      if(!inPoly(g.outline, x, y)) return null;
      if(view === 'inside'){
        if(inPoly(core, x, y) || inPoly(cingBand, x, y) || (y > 380 && x > 300 && x < 720)) return null;
        return 'm';
      }
      for(var i = 0; i < 4; i++) if(inPoly(g.reg[lobes[i]].poly, x, y)) return lobes[i];
      return null;
    }
    var cen = g.lines.cen;
    function nearCen(x, y){ var d = 1e9; if(!cen) return d; for(var i = 0; i < cen.length; i += 3) d = Math.min(d, Math.hypot(cen[i][0] - x, cen[i][1] - y)); return d; }
    function angle(x, y, z){
      var noise = 0.5 * Math.sin(x * 0.019 + y * 0.011 + 1.7) + 0.35 * Math.sin(x * 0.006 - y * 0.023 + 0.4);
      if(z === 'm') return Math.atan2(y - 318, x - 480) + Math.PI / 2 + noise * 0.5;
      if((z === 'frontal' || z === 'parietal') && nearCen(x, y) < 110) return 1.92 + noise * 0.3;
      if(z === 'frontal') return -0.1 + noise * 0.7;
      if(z === 'parietal') return 0.3 + noise * 0.9;
      if(z === 'temporal') return -0.36 + noise * 0.4;
      return 1.2 + noise;
    }
    function trace(x0, y0, z, sign, id, maxL, ph, amp){
      var pts = [], x = x0, y = y0, L = 0, st = 4;
      while(L < maxL){
        var a = angle(x, y, z) + amp * Math.sin(L * sign / 13 + ph) + (sign < 0 ? Math.PI : 0), nx = x + Math.cos(a) * st, ny = y + Math.sin(a) * st;
        if(zone(nx, ny) !== z || !free(nx, ny, id, D * 0.82)) break;
        x = nx; y = ny; L += st; pts.push([x, y]);
      }
      return pts;
    }
    var seeds = [];
    for(var gy = 50; gy < 560; gy += 17) for(var gx = 70; gx < 960; gx += 17) seeds.push([gx + (rnd() - 0.5) * 14, gy + (rnd() - 0.5) * 14, rnd()]);
    seeds.sort(function(a2, b2){ return a2[2] - b2[2]; });
    seeds.forEach(function(sd){
      var x = sd[0], y = sd[1], z = zone(x, y);
      if(!z || !free(x, y, null, D * 1.15)) return;
      var id = 'f' + (++n), maxL = 70 + rnd() * 170, ph = rnd() * 6.28, amp = 0.35 + rnd() * 0.45;
      var back = trace(x, y, z, -1, id, maxL / 2, ph, amp), fwd = trace(x, y, z, 1, id, maxL / 2, ph, amp);
      var line = back.reverse().concat([[x, y]], fwd);
      if(line.length * 4 < 30) return;
      markLine(line, id);
      out.push(line.filter(function(p, j){ return j % 3 === 0 || j === line.length - 1; }));
    });
    return out;
  }
  /* evenly spaced wavy folds inside any shape (the split-brain hemispheres seen from above) */
  function fill(poly, ang, D, seed){
    var rnd = seeded(seed), grid = {}, out = [], n = 0;
    function add(p, id){ var k = Math.floor(p[0] / D) + ',' + Math.floor(p[1] / D); (grid[k] = grid[k] || []).push([p[0], p[1], id]); }
    function free(x, y, id, d){ var cx = Math.floor(x / D), cy = Math.floor(y / D); for(var dx = -1; dx <= 1; dx++) for(var dy = -1; dy <= 1; dy++){ var l = grid[(cx + dx) + ',' + (cy + dy)]; if(l) for(var i = 0; i < l.length; i++) if(l[i][2] !== id && Math.hypot(l[i][0] - x, l[i][1] - y) < d) return false; } return true; }
    var bx = [1e9, 1e9, -1e9, -1e9]; poly.forEach(function(p){ bx[0] = Math.min(bx[0], p[0]); bx[1] = Math.min(bx[1], p[1]); bx[2] = Math.max(bx[2], p[0]); bx[3] = Math.max(bx[3], p[1]); });
    var seeds = []; for(var y = bx[1]; y < bx[3]; y += D * 0.8) for(var x = bx[0]; x < bx[2]; x += D * 0.8) seeds.push([x + (rnd() - 0.5) * D * 0.6, y + (rnd() - 0.5) * D * 0.6, rnd()]);
    seeds.sort(function(a, b){ return a[2] - b[2]; });
    seeds.forEach(function(sd){
      if(!inPoly(poly, sd[0], sd[1]) || !free(sd[0], sd[1], null, D * 1.1)) return;
      var id = ++n, ph = rnd() * 6.28, amp = 0.4 + rnd() * 0.4, maxL = D * (3 + rnd() * 5), line = [[sd[0], sd[1]]];
      [-1, 1].forEach(function(sg){
        var x = sd[0], y = sd[1], L = 0, st = D / 5, part = [];
        while(L < maxL / 2){ var a = ang(x, y) + amp * Math.sin(L * sg / (D * 0.7) + ph) + (sg < 0 ? Math.PI : 0), nx = x + Math.cos(a) * st, ny = y + Math.sin(a) * st;
          if(!inPoly(poly, nx, ny) || !free(nx, ny, id, D * 0.8)) break; x = nx; y = ny; L += st; part.push([x, y]); }
        line = sg < 0 ? part.reverse().concat(line) : line.concat(part);
      });
      if(line.length < 8) return;
      line.forEach(function(p){ add(p, id); });
      out.push(line.filter(function(p, j){ return j % 3 === 0 || j === line.length - 1; }));
    });
    return out;
  }
  function regAt(view, x, y){
    var g = G[view], hit = null;
    g.order.forEach(function(id){
      var r = g.reg[id];
      if(!inPoly(r.poly, x, y)) return;
      if(r.within.indexOf('out') > -1 && !inPoly(g.outline, x, y)) return;
      for(var i = 0; i < r.within.length; i++){ var w = r.within[i]; if(w !== 'out' && !inPoly(g.reg[w].poly, x, y)) return; }
      hit = id;
    });
    // inside view: a deep part drawn over the brainstem wins over the brainstem, the smaller parts over the larger
    return hit;
  }
  function onBrain(view, x, y){
    var g = G[view];
    if(inPoly(g.outline, x, y) || inPoly(g.cbl, x, y)) return true;
    if(inPoly(g.stemAll, x, y)) return true;
    return false;
  }

  /* --------------------------------------------------------- the art */
  var LOBE = { frontal: 'f', parietal: 'p', temporal: 't', occipital: 'o' };
  function lobeOf(id){ var r = R[id]; return LOBE[id] || (r && r.parent ? LOBE[r.parent] : null); }
  function clipDefs(view, pid){
    var g = G[view], s = '<clipPath id="' + pid + 'out"><path d="' + dOf(g.outline) + '"/></clipPath>';
    g.order.forEach(function(id){ s += '<clipPath id="' + pid + 'r-' + id + '"><path d="' + dOf(g.reg[id].poly) + '"/></clipPath>'; });
    return s;
  }
  /* a region's shape drawn inside its clip paths (outline, lobe), as nested groups */
  function within(view, id, pid, inner){
    var r = G[view].reg[id], s = inner;
    r.within.slice().reverse().forEach(function(w){ s = '<g clip-path="url(#' + pid + (w === 'out' ? 'out' : 'r-' + w) + ')">' + s + '</g>'; });
    return s;
  }
  function sulcus(pts, cls){ var c = dOf(curve(pts, false, 6), false); return '<path class="bm-sul-sh" d="' + c + '" transform="translate(1.6 2.2)"/><path class="bm-sul ' + (cls || '') + '" d="' + c + '"/><path class="bm-sul-hi ' + (cls || '') + '" d="' + c + '" transform="translate(-2.2 -2.6)"/>'; }
  /* The picture of one view as SVG markup. o: { pid (unique id prefix), sel (static highlight), dmg, glow, body
     ('motor' | 'somatosensory'), mirror (show the right hemisphere: the picture flips, the words do not), fx: true
     (empty effect layers for Explore to fill), labels: [{ id, text }], px (screen px per picture unit) } */
  function brainSvg(view, o){
    o = o || {};
    var g = G[view], pid = o.pid || 'bm', out = [];
    out.push('<defs>' + clipDefs(view, pid) +
      '<radialGradient id="' + pid + 'tis" cx="38%" cy="26%" r="78%"><stop offset="0" class="bm-t0"/><stop offset=".62" class="bm-t1"/><stop offset="1" class="bm-t2"/></radialGradient>' +
      '<radialGradient id="' + pid + 'cbg" cx="45%" cy="30%" r="80%"><stop offset="0" class="bm-c0"/><stop offset="1" class="bm-c1"/></radialGradient>' +
      '<linearGradient id="' + pid + 'stg" x1="0" x2="1" y1="0" y2="0"><stop offset="0" class="bm-s0"/><stop offset=".55" class="bm-s1"/><stop offset="1" class="bm-s2"/></linearGradient>' +
      '<radialGradient id="' + pid + 'shd" cx="50%" cy="50%" r="50%"><stop offset="0" class="bm-sh0"/><stop offset="1" class="bm-sh1"/></radialGradient>' +
      '<radialGradient id="' + pid + 'glow" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#FFE45C"/><stop offset=".45" stop-color="#FF9F1C"/><stop offset="1" stop-color="#E4572E" stop-opacity="0"/></radialGradient>' +
      '<pattern id="' + pid + 'hatch" width="12" height="12" patternUnits="userSpaceOnUse" patternTransform="rotate(40)"><rect width="12" height="12" class="bm-dmg-bg"/><path d="M0 0V12" class="bm-dmg-ln"/></pattern>' +
      '</defs>');
    out.push('<ellipse class="bm-floor" cx="520" cy="' + (view === 'outside' ? 676 : 676) + '" rx="440" ry="34" fill="url(#' + pid + 'shd)"/>');
    var tf = o.mirror ? ' transform="translate(' + VW + ' 0) scale(-1 1)"' : '';
    // on a wide stage the head is drawn round the brain, faint, so its front reads as the face
    if(o.head) out.push('<path class="bm-head" d="' + dOf(HEAD) + '"/><path class="bm-head-l" d="M22 414 Q44 402 66 412"/>');
    out.push('<g class="bm-brain"' + tf + '>');
    function fx(lv){ return o.fx ? '' : staticFx(lv); }
    function staticFx(lv){
      var s = '';
      if(o.sel && g.reg[o.sel] && g.reg[o.sel].lv === lv){
        var r = g.reg[o.sel];
        s += within(view, o.sel, pid, '<path class="bm-hl-f bm-k-' + (lobeOf(o.sel) || 'x') + '" d="' + dOf(r.poly) + '"/>');
        s += within(view, o.sel, pid, '<path class="bm-hl-e" d="' + dOf(r.poly) + '"/>');
        if(o.glow) s += within(view, o.sel, pid, '<circle cx="' + r.pin[0] + '" cy="' + r.pin[1] + '" r="110" fill="url(#' + pid + 'glow)" class="bm-glow"/>');
      }
      return s;
    }
    if(view === 'outside'){
      out.push('<path class="bm-stem" d="' + dOf(g.stemAll) + '" fill="url(#' + pid + 'stg)"/>');
      out.push('<path class="bm-stem-l" d="M590 640 Q604 680 612 720M630 636 Q632 676 624 720M566 556 Q610 546 660 560M562 584 Q612 576 664 590"/><path class="bm-stem-g" d="M568 610 Q610 630 652 614"/>');
      out.push(cbl(g, pid, false));
      out.push(fx('low'));
    }
    // the cerebrum: tissue, lobe colors, effects, folds, rim shade, outline
    out.push('<path class="bm-tis" d="' + dOf(g.outline) + '" fill="url(#' + pid + 'tis)"/>');
    out.push('<g clip-path="url(#' + pid + 'out)">');
    Object.keys(LOBE).forEach(function(k){ if(g.reg[k]) out.push('<path class="bm-lobe bm-k-' + LOBE[k] + '" d="' + dOf(g.reg[k].poly) + '"/>'); });
    if(view === 'inside') out.push('<path class="bm-cing" d="' + dOf(ribbon([[180, 300], [208, 236], [282, 190], [400, 168], [520, 166], [600, 174], [650, 200], [690, 250], [700, 300]], [30, 40, 46, 48, 48, 46, 44, 40, 30])) + '"/>');
    out.push('</g>');
    out.push(fx('high'));
    out.push('<g clip-path="url(#' + pid + 'out)" class="bm-folds">');
    g.minor.forEach(function(m){ out.push(sulcus(m, 'is-sm')); });
    g.sulci.forEach(function(s){ out.push(sulcus(s)); });
    if(view === 'outside'){
      out.push(sulcus(g.lines.pre)); out.push(sulcus(g.lines.post));
      out.push('<path class="bm-groove" d="' + dOf(g.lines.cen, false) + '"/><path class="bm-groove-hi" d="' + dOf(g.lines.cen, false) + '" transform="translate(-2.5 -3)"/>');
      out.push('<path class="bm-fiss" d="' + dOf(g.lines.syl, false) + '"/><path class="bm-groove-hi" d="' + dOf(g.lines.syl, false) + '" transform="translate(-2 -4)"/>');
      out.push('<path class="bm-sul is-faint" d="' + dOf(g.lines.po, false) + '"/>');
      out.push('<path class="bm-pfc" d="' + dOf(curve([[352, 40], [330, 150], [310, 250], [292, 330], [279, 400], [272, 430]], false, 8), false) + '"/>');
    } else {
      out.push(sulcus(g.lines.cing.slice(0, -6))); out.push('<path class="bm-groove" d="' + dOf(g.lines.po, false) + '"/>'); out.push('<path class="bm-groove" d="' + dOf(g.lines.cal, false) + '"/>');
      out.push('<path class="bm-groove" d="M548 58 Q552 76 560 92"/>');
    }
    out.push('<path class="bm-rim" d="' + dOf(g.outline) + '"/>');
    out.push('</g>');
    out.push('<path class="bm-edge" d="' + dOf(g.outline) + '"/>');
    if(view === 'inside'){
      // what the cut shows: the cerebellum and brainstem, the corpus callosum and the parts round the third ventricle
      out.push(cbl(g, pid, true));
      out.push('<path class="bm-stem is-cut is-fill" d="' + dOf(g.stemAll) + '" fill="url(#' + pid + 'stg)"/>');
      // the deep parts lie to the side of the cut: drawn see-through under the brainstem's outline
      out.push('<g class="bm-seen"><path class="bm-deep is-rew" d="' + dOf(g.rew) + '"/><path class="bm-deep is-amy" d="' + dOf(g.amy) + '"/><path class="bm-deep is-hip" d="' + dOf(g.hip) + '"/>' +
        '<path class="bm-hip-l" d="' + dOf(curve([[500, 454], [560, 450], [610, 442], [650, 420], [676, 386]], false, 6), false) + '"/></g>');
      out.push('<path class="bm-stem-e" d="' + dOf(g.stemAll) + '"/>');
      out.push('<path class="bm-stem-g" d="M512 468 Q574 462 630 480M520 548 Q576 560 616 558"/><path class="bm-stem-l" d="M520 490 Q570 486 620 496M516 512 Q570 508 626 516M520 530 Q568 530 622 534M566 600 Q576 650 586 700"/>');
      out.push('<path class="bm-v4" d="' + dOf(g.v4) + '"/>');
      var rr = seeded(77), dots = '';
      for(var i = 0; i < 46; i++){ var yy = 404 + rr() * 228, half = 11, xx = 575.5 + (rr() - 0.5) * 2 * half; dots += 'M' + r1(xx) + ' ' + r1(yy) + 'h.1'; }
      out.push('<path class="bm-ras" d="' + dots + '"/>');
      out.push('<path class="bm-fornix" d="' + dOf(g.fornix) + '"/>');
      out.push('<path class="bm-thal" d="' + dOf(g.thal) + '"/><path class="bm-thal-l" d="M480 316 Q522 302 566 318"/>');
      out.push('<path class="bm-hyp" d="' + dOf(g.hyp) + '"/><path class="bm-chi" d="' + dOf(g.chiasm) + '"/><path class="bm-hyp" d="' + dOf(g.mam) + '"/>');
      out.push('<path class="bm-stalk" d="M440 418 Q426 440 414 460"/><path class="bm-pit" d="' + dOf(g.pit) + '"/>');
      out.push('<path class="bm-cc" d="' + dOf(g.cc) + '"/><path class="bm-cc-l" d="M330 300 Q340 262 380 240 Q460 222 540 222 Q600 228 640 252"/>');
      out.push(fx('top'));
    }
    out.push('</g>');
    // the body a motor or touch strip serves (seen from behind, so its right is on the right)
    if(view === 'outside' && o.body) out.push(bodySvg(o));
    (o.labels || []).forEach(function(l){ out.push(tag(view, l.id, l.text, o.px || 0.6, !!o.mirror)); });
    return out.join('');
  }
  /* Explore's moving layer, a second svg over the picture: the picked part's color and edge, its lesion, and the
     body figure. Only this small layer repaints while something grows, never the folded brain under it. */
  function fxSvg(view, pid, o){ return view === 'outside' ? bodySvg(o) : ''; }
  function cbl(g, pid, cut){
    var s = '<path class="bm-cbl" d="' + dOf(g.cbl) + '" fill="url(#' + pid + 'cbg)"/><g clip-path="url(#' + pid + 'cb)">';
    var defs = '<clipPath id="' + pid + 'cb"><path d="' + dOf(g.cbl) + '"/></clipPath>';
    if(!cut){
      // the folia: arcs that follow the cerebellum's lower curve, smaller toward its core
      for(var k = 0; k < 11; k++){ var a = ell(806, 420, 182 - k * 6, 214 - k * 13, -10, 64).filter(function(q, j){ return j >= 4 && j <= 28; }); s += '<path class="bm-folia" d="' + dOf(a, false) + '"/>'; }
    } else {
      // the arbor vitae: white matter branching out to the folds
      var st = [[668, 528]], br = [[760, 500], [840, 486], [906, 500], [920, 548], [880, 596], [810, 624], [740, 622], [700, 592]];
      br.forEach(function(b, i){
        var m = [(st[0][0] + b[0]) / 2 + (i % 2 ? 6 : -6), (st[0][1] + b[1]) / 2 + (i % 2 ? -8 : 8)];
        s += '<path class="bm-arbor" d="M' + st[0].join(' ') + ' Q' + m.map(r1).join(' ') + ' ' + b.join(' ') + '" stroke-width="' + (i === 2 || i === 3 ? 9 : 7) + '"/>';
        s += '<path class="bm-arbor" d="M' + m.map(r1).join(' ') + ' l' + (i < 4 ? 20 : -6) + ' ' + (i < 4 ? -22 : 24) + '" stroke-width="4"/>';
      });
      for(var j = 0; j < 7; j++){ var yy = 486 + j * 22; s += '<path class="bm-folia" d="M760 ' + yy + ' C840 ' + (yy - 6) + ' 900 ' + (yy + 4) + ' 960 ' + (yy + 10) + '"/>'; }
    }
    return '<defs>' + defs + '</defs>' + s + '</g><path class="bm-cbl-e" d="' + dOf(g.cbl) + '"/>';
  }
  /* the small figure for the motor and touch strips, bottom left of the outside view */
  function bodySvg(o){
    var on = o.body || '', cls = 'bm-body' + (on ? ' is-on' : '') + (o.dmg && on ? ' is-hurt' : '') + (o.mirror ? ' is-flip' : '');
    var x = o.bx || 128, y = 492;
    var head = '<circle cx="' + x + '" cy="' + (y + 22) + '" r="21"/>';
    var L = '<path d="M' + (x - 2) + ' ' + (y + 48) + 'h-30q-10 0 -12 12l-6 66h48z"/><path d="M' + (x - 44) + ' ' + (y + 58) + 'q-12 4 -14 18l-10 62q-1 8 7 9q8 1 9 -7l10 -58z"/><path d="M' + (x - 2) + ' ' + (y + 126) + 'h-40l-4 88q0 8 8 8h16q8 0 9 -8z"/>';
    var Rr = '<path d="M' + (x + 2) + ' ' + (y + 48) + 'h30q10 0 12 12l6 66h-48z"/><path d="M' + (x + 44) + ' ' + (y + 58) + 'q12 4 14 18l10 62q1 8 -7 9q-8 1 -9 -7l-10 -58z"/><path d="M' + (x + 2) + ' ' + (y + 126) + 'h40l4 88q0 8 -8 8h-16q-8 0 -9 -8z"/>';
    // seen from behind: the person's right is on the viewer's right; a right hemisphere (mirror) lights the left
    var fs = 13 / (o.px || 0.6), txt = bodyText(on, o.dmg, o.mirror);
    return '<g class="' + cls + '" data-body><g class="bm-bd-c">' + head + '</g><g class="bm-bd-a">' + L + '</g><g class="bm-bd-b">' + Rr + '</g>' +
      (o.bx ? '<text class="bm-bd-t" x="' + x + '" y="' + r1(y - fs) + '" text-anchor="middle" font-size="' + r1(fs) + '">' + esc(txt) + '</text></g>'
        : '<text class="bm-bd-t" x="' + r1(x + 66 + 4 / (o.px || 0.6)) + '" y="' + (y + 104) + '" dy=".35em" font-size="' + r1(fs) + '">' + esc(txt) + '</text></g>');
  }
  function bodyText(on, hurt, mirror){
    if(!on) return '';
    var side = mirror ? 'Left side' : 'Right side';
    return hurt ? side + (on === 'motor' ? ': weak' : ': numb') : side;
  }
  /* a name tag on the picture (Test yourself figures), in screen pixels */
  function tag(view, id, text, px, mirror){
    var r = G[view].reg[id]; if(!r) return '';
    var fs = 13 / px, w = text.length * fs * 0.58 + fs * 1.4, h = fs * 1.9, p = r.pin.slice();
    if(mirror) p[0] = VW - p[0];
    var x = clamp(p[0] - w / 2, 8, VW - w - 8), y = p[1] - h - 26 / px;
    if(y < 8) y = p[1] + 26 / px;
    return '<g class="bm-tag"><path class="bm-tag-l" d="M' + r1(p[0]) + ' ' + r1(p[1]) + 'L' + r1(clamp(p[0], x + 6, x + w - 6)) + ' ' + r1(y + (y < p[1] ? h : 0)) + '"/><rect x="' + r1(x) + '" y="' + r1(y) + '" width="' + r1(w) + '" height="' + r1(h) + '" rx="' + r1(h / 2) + '"/>' +
      '<text x="' + r1(x + w / 2) + '" y="' + r1(y + h * 0.66) + '" text-anchor="middle" font-size="' + r1(fs) + '">' + esc(text) + '</text><circle cx="' + r1(p[0]) + '" cy="' + r1(p[1]) + '" r="' + r1(5 / px) + '"/></g>';
  }

  /* ------------------------------------------------------- split brain */
  /* A person seen from above, front (the screen) at the top, so their left is on the viewer's left. Two layouts:
     wide (1000 x 720) and tall for phones (1000 x 1150). Picture units; words are sized in screen pixels (px). */
  var SPLIT_TALL_H = 1000;
  function splitLay(tall, extra){
    extra = tall ? 0 : Math.max(0, extra || 0);
    var L = tall ? { W: 1000, H: SPLIT_TALL_H, scr: [70, 14, 860, 176], cx: 500, cy: 630, rx: 240, ry: 270 }
      : { W: 1000, H: 720, scr: [250, 14, 500, 130], cx: 500, cy: 372, rx: 150, ry: 178 };
    L.tall = !!tall; L.extra = extra;
    var hx = function(u){ return L.cx + u * L.rx; }, hy = function(v){ return L.cy + v * L.ry; };
    L.P = function(u, v){ return [r1(hx(u)), r1(hy(v))]; };
    L.fix = [500, L.scr[1] + L.scr[3] / 2];
    var wy = L.scr[1] + L.scr[3] * 0.4;   // the word sits above its field's label
    L.word = { left: [L.scr[0] + L.scr[2] * 0.25, wy], right: [L.scr[0] + L.scr[2] * 0.75, wy] };
    L.eye = { left: L.P(-0.34, -0.83), right: L.P(0.34, -0.83) };
    L.chi = L.P(0, -0.56);
    L.occ = { left: L.P(-0.33, 0.62), right: L.P(0.33, 0.62) };
    L.mid = { left: L.P(-0.36, 0.05), right: L.P(0.36, 0.05) };
    L.speech = L.P(-0.42, -0.30);
    L.cc = [hx(-0.13), hy(-0.12), L.rx * 0.26, L.ry * 0.42];
    L.sh = { left: [hx(-0.98), hy(1.12)], right: [hx(0.98), hy(1.12)] };
    // the table the person leans over: the screen and both trays stand on it; it spans the whole frame
    L.table = [-extra + 10, L.scr[1] + L.scr[3] * 0.55, 1000 + 2 * extra - 20, hy(0.92) - (L.scr[1] + L.scr[3] * 0.55)];
    if(tall){ L.tray = { left: [24, 600, 190, 170], right: [786, 600, 190, 170] }; L.hand = { left: [214, 758], right: [786, 758] }; }
    else { L.tray = { left: [130, 362, 190, 146], right: [680, 362, 190, 146] }; L.hand = { left: [316, 498], right: [684, 498] }; }
    // a natural reach into the tray, about two thirds of the way in
    L.reach = { left: [L.tray.left[0] + L.tray.left[2] * 0.45, L.tray.left[1] + L.tray.left[3] * 0.5], right: [L.tray.right[0] + L.tray.right[2] * 0.55, L.tray.right[1] + L.tray.right[3] * 0.5] };
    L.bub = tall ? [570, 196, 410, 60] : [664, 156, 300, 64];
    return L;
  }
  /* an arm from the shoulder to the hand, bent at the elbow (out to the side and a little back) */
  function armD(L, h, x, y){
    var sh = L.sh[h], s = h === 'left' ? -1 : 1, ex = (sh[0] + x) / 2 + s * L.rx * 0.36, ey = Math.max(sh[1], y) + L.ry * 0.05;
    return 'M' + sh.map(r1).join(' ') + 'L' + r1(ex) + ' ' + r1(ey) + 'L' + r1(x) + ' ' + r1(y);
  }
  /* the objects in a tray: the flashed one and two others */
  function trayObjs(L, h, object){
    var t = L.tray[h], others = B.OBJECTS.filter(function(o){ return o !== object; }), k0 = B.OBJECTS.indexOf(object);
    var list = h === 'left' ? [others[(k0 + 2) % others.length], object, others[(k0 + 5) % others.length]] : [others[(k0 + 4) % others.length], others[(k0 + 1) % others.length], object];
    return list.map(function(ob, k){ var g = objSvg(ob, t[0] + t[2] * (0.24 + 0.26 * k), t[1] + t[3] * (0.38 + (k % 2) * 0.3), Math.min(t[2], t[3]) * 0.17, 'sb-ob');
      return ob === object ? g.replace('<g class="sb-ob"', '<g class="sb-ob" data-pick="1"') : g; }).join('');
  }
  function hemiPts(L, side){
    var s = side === 'left' ? -1 : 1;
    return curve([[0.06, -0.64], [0.30, -0.63], [0.54, -0.46], [0.66, -0.14], [0.67, 0.22], [0.58, 0.54], [0.38, 0.76], [0.13, 0.82], [0.06, 0.70], [0.055, 0.30], [0.055, -0.20]], true, 8)
      .map(function(p){ return L.P(s * p[0], p[1]); });
  }
  /* the path the word's signal takes from both eyes to the hemisphere opposite the field */
  function optic(L, field){
    var to = field === 'left' ? 'right' : 'left', s = to === 'left' ? -1 : 1, o = L.occ[to];
    var tract = [L.chi, L.P(s * 0.16, -0.40), L.P(s * 0.30, -0.05), L.P(s * 0.34, 0.36), o];
    var a = dOf(curve([L.eye.left, L.P(-0.14, -0.66)].concat(tract), false, 8), false), b = dOf(curve([L.eye.right, L.P(0.14, -0.66)].concat(tract), false, 8), false);
    return [a, b];
  }
  /* st: { field, cut, object, says, hands: { left, right }, stage (0 idle .. 4 done), px } -> markup (static parts and
     the moving parts with data-sb names, which Explore animates and a Test yourself figure draws at one stage) */
  function splitSvg(L, st){
    var px = st.px || 0.6, fs = function(p){ return r1(p / px); }, out = [], S = L.scr, P = L.P;
    var pid = st.pid || 'sb';
    out.push('<defs><radialGradient id="' + pid + 'g" cx="50%" cy="40%" r="60%"><stop offset="0" class="sb-h0"/><stop offset="1" class="sb-h1"/></radialGradient>' +
      '<radialGradient id="' + pid + 'w" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#FFD54A" stop-opacity=".95"/><stop offset="1" stop-color="#FFB000" stop-opacity="0"/></radialGradient></defs>');
    // the table, then the screen on it
    var tb = L.table;
    out.push('<rect class="sb-table" x="' + r1(tb[0]) + '" y="' + r1(tb[1]) + '" width="' + r1(tb[2]) + '" height="' + r1(tb[3]) + '" rx="22"/><rect class="sb-table-e" x="' + r1(tb[0]) + '" y="' + r1(tb[1] + tb[3] - 14) + '" width="' + r1(tb[2]) + '" height="14" rx="7"/>');
    out.push('<rect class="sb-desk" x="' + (S[0] - 14) + '" y="' + (S[1] + S[3] - 6) + '" width="' + (S[2] + 28) + '" height="16" rx="8"/>');
    out.push('<rect class="sb-scr" x="' + S[0] + '" y="' + S[1] + '" width="' + S[2] + '" height="' + S[3] + '" rx="14"/><rect class="sb-glass" x="' + (S[0] + 8) + '" y="' + (S[1] + 8) + '" width="' + (S[2] - 16) + '" height="' + (S[3] - 16) + '" rx="9"/>');
    out.push('<path class="sb-mid" d="M500 ' + (S[1] + 14) + 'V' + (S[1] + S[3] - 14) + '"/>');
    out.push('<path class="sb-fix" d="M' + (500 - 9 / px) + ' ' + L.fix[1] + 'h' + 18 / px + 'M500 ' + (L.fix[1] - 9 / px) + 'v' + 18 / px + '"/>');
    out.push('<g data-sb="word" opacity="0"><text class="sb-word" x="0" y="0" text-anchor="middle" font-size="' + fs(L.tall ? 20 : 24) + '" dy=".35em"></text></g>');
    // light from the word to the eyes
    out.push('<path data-sb="rays" class="sb-ray" d="" opacity="0"/>');
    // the field labels over the light (drawn after it)
    ['left', 'right'].forEach(function(f){
      var w = L.word[f];
      out.push('<text class="sb-field" x="' + r1(w[0]) + '" y="' + r1(S[1] + S[3] - 14) + '" text-anchor="middle" font-size="' + fs(12) + '">' + (f === 'left' ? 'Left field' : 'Right field') + '</text>');
    });
    // body (shoulders and arms below the head), the trays of hidden objects, the hands
    var top = L.cy + L.ry * 0.96, X0 = L.cx - L.rx * 1.36, X1 = L.cx + L.rx * 1.36, Hb = L.H + 20;
    out.push('<path class="sb-torso" d="M' + r1(X0) + ' ' + Hb + 'L' + r1(X0) + ' ' + r1(top + L.ry * 0.34) + 'Q' + r1(X0) + ' ' + r1(top) + ' ' + r1(L.cx - L.rx * 0.9) + ' ' + r1(top) + 'H' + r1(L.cx + L.rx * 0.9) +
      'Q' + r1(X1) + ' ' + r1(top) + ' ' + r1(X1) + ' ' + r1(top + L.ry * 0.34) + 'L' + r1(X1) + ' ' + Hb + 'Z"/>');
    ['left', 'right'].forEach(function(h){
      var t = L.tray[h];
      out.push('<rect class="sb-tray" x="' + t[0] + '" y="' + t[1] + '" width="' + t[2] + '" height="' + t[3] + '" rx="16"/><rect class="sb-tray-in" x="' + (t[0] + 10) + '" y="' + (t[1] + 10) + '" width="' + (t[2] - 20) + '" height="' + (t[3] - 20) + '" rx="10"/>');
      out.push('<g data-sb="tray-' + h + '">' + trayObjs(L, h, st.object || 'key') + '</g>');
    });
    ['left', 'right'].forEach(function(h){
      var hd = L.hand[h];
      out.push('<g data-sb="arm-' + h + '"><path class="sb-arm" data-sb="armp-' + h + '" d="' + armD(L, h, hd[0], hd[1]) + '"/>' +
        '<g data-sb="hand-' + h + '" transform="translate(' + hd.join(' ') + ')">' + handSvg(h, L.tall ? 1.35 : 1) + '<g data-sb="hold-' + h + '" opacity="0">' + objSvg(st.object || 'key', 0, 0, L.tall ? 30 : 24, 'sb-held') + '</g></g></g>');
    });
    // the head from above with the brain shown inside it
    out.push('<g data-sb="person">');
    out.push('<ellipse class="sb-ear" cx="' + P(-1.0, 0.08)[0] + '" cy="' + P(-1.0, 0.08)[1] + '" rx="' + r1(L.rx * 0.12) + '" ry="' + r1(L.ry * 0.16) + '"/><ellipse class="sb-ear" cx="' + P(1.0, 0.08)[0] + '" cy="' + P(1.0, 0.08)[1] + '" rx="' + r1(L.rx * 0.12) + '" ry="' + r1(L.ry * 0.16) + '"/>');
    out.push('<ellipse class="sb-head" cx="' + L.cx + '" cy="' + L.cy + '" rx="' + L.rx + '" ry="' + L.ry + '" fill="url(#' + pid + 'g)"/>');
    out.push('<path class="sb-nose" d="M' + P(-0.13, -0.97).join(' ') + 'Q' + P(0, -1.16).join(' ') + ' ' + P(0.13, -0.97).join(' ') + 'Z"/>');
    out.push('<ellipse class="sb-skull" cx="' + L.cx + '" cy="' + r1(L.cy + L.ry * 0.07) + '" rx="' + r1(L.rx * 0.78) + '" ry="' + r1(L.ry * 0.86) + '"/>');
    ['left', 'right'].forEach(function(e){ var p = L.eye[e]; out.push('<ellipse class="sb-eye" cx="' + p[0] + '" cy="' + p[1] + '" rx="' + r1(L.rx * 0.11) + '" ry="' + r1(L.ry * 0.06) + '"/><circle class="sb-iris" cx="' + p[0] + '" cy="' + r1(p[1] - L.ry * 0.015) + '" r="' + r1(L.rx * 0.045) + '"/>'); });
    ['left', 'right'].forEach(function(h){
      var hp = hemiPts(L, h), s = h === 'left' ? -1 : 1;
      out.push('<path class="sb-hemi" d="' + dOf(hp) + '"/>');
      out.push('<path class="sb-glow" data-sb="glow-' + h + '" d="' + dOf(hp) + '" opacity="0"/>');
      var inner = curve(hp.filter(function(q, j){ return j % 2 === 0; }), true, 2).map(function(q){ return [L.cx + (q[0] - L.cx) * 0.94 + s * L.rx * 0.012, L.cy + (q[1] - L.cy) * 0.94]; });
      var f = fill(inner, function(x, y){ return (y - L.cy) / L.ry * 0.9 * s + Math.sin(x * 0.03) * 0.3; }, L.rx * 0.085, h === 'left' ? 5 : 9).map(function(l){ return dOf(curve(l, false, 4), false); }).join('');
      out.push('<path class="sb-gyr" d="' + f + '"/>');
    });
    out.push('<ellipse class="sb-speech" cx="' + L.speech[0] + '" cy="' + L.speech[1] + '" rx="' + r1(L.rx * 0.17) + '" ry="' + r1(L.ry * 0.11) + '"/>');
    // the optic nerves and tracts, both routes (each field's route lights when its word flashes)
    ['left', 'right'].forEach(function(f){ optic(L, f).forEach(function(d, i){ out.push('<path class="sb-nerve" data-sb="nerve-' + f + '-' + i + '" d="' + d + '"/>'); }); });
    // the corpus callosum: a bridge between the hemispheres; cut, its two ends pull apart
    var c = L.cc;
    out.push('<g data-sb="cc"><rect class="sb-cc" data-sb="cc-a" x="' + r1(c[0]) + '" y="' + r1(c[1]) + '" width="' + r1(c[2] / 2) + '" height="' + r1(c[3]) + '" rx="' + r1(c[2] * 0.22) + '"/>' +
      '<rect class="sb-cc" data-sb="cc-b" x="' + r1(c[0] + c[2] / 2) + '" y="' + r1(c[1]) + '" width="' + r1(c[2] / 2) + '" height="' + r1(c[3]) + '" rx="' + r1(c[2] * 0.22) + '"/>' +
      '<path class="sb-cc-l" d="M' + r1(c[0] + 6) + ' ' + r1(c[1] + c[3] * 0.3) + 'H' + r1(c[0] + c[2] - 6) + 'M' + r1(c[0] + 6) + ' ' + r1(c[1] + c[3] * 0.55) + 'H' + r1(c[0] + c[2] - 6) + 'M' + r1(c[0] + 6) + ' ' + r1(c[1] + c[3] * 0.8) + 'H' + r1(c[0] + c[2] - 6) + '"/>' +
      '<path class="sb-snip" data-sb="snip" d="M' + r1(500 - c[2] * 0.12) + ' ' + r1(c[1] - 6) + 'L' + r1(500 + c[2] * 0.12) + ' ' + r1(c[1] + c[3] + 6) + 'M' + r1(500 + c[2] * 0.12) + ' ' + r1(c[1] - 6) + 'L' + r1(500 - c[2] * 0.12) + ' ' + r1(c[1] + c[3] + 6) + '" opacity="0"/></g>');
    out.push('<path class="sb-cross" data-sb="cross" d="M' + L.mid.left.join(' ') + 'Q500 ' + r1(L.cc[1] + L.cc[3] * 0.5) + ' ' + L.mid.right.join(' ') + '" opacity="0"/>');
    out.push('</g>');
    // motor paths over the brain: each hemisphere runs the hand on the opposite side (they cross low in the brainstem)
    ['left', 'right'].forEach(function(h){
      var from = h === 'left' ? 'right' : 'left', s = from === 'left' ? -1 : 1, sh = L.sh[h];
      var d = dOf(curve([P(s * 0.30, -0.18), P(s * 0.22, 0.40), P(s * 0.05, 0.92), P(-s * 0.18, 1.04), sh], false, 8), false);
      out.push('<path class="sb-mot" data-sb="mot-' + h + '" d="' + d + '"/>');
    });
    // signals in motion (dots that travel the paths)
    out.push('<circle class="sb-pulse" data-sb="p0" r="' + r1(L.tall ? 13 : 9) + '" opacity="0"/><circle class="sb-pulse" data-sb="p1" r="' + r1(L.tall ? 13 : 9) + '" opacity="0"/><circle class="sb-pulse" data-sb="p2" r="' + r1(L.tall ? 13 : 9) + '" opacity="0"/>');
    out.push('<g data-sb="block" opacity="0"><circle class="sb-block" cx="500" cy="' + r1(L.cc[1] + L.cc[3] * 0.5) + '" r="' + r1(L.rx * 0.11) + '"/><path class="sb-block-x" d="M' + r1(500 - L.rx * 0.05) + ' ' + r1(L.cc[1] + L.cc[3] * 0.5 - L.rx * 0.05) + 'l' + r1(L.rx * 0.1) + ' ' + r1(L.rx * 0.1) + 'm0 ' + r1(-L.rx * 0.1) + 'l' + r1(-L.rx * 0.1) + ' ' + r1(L.rx * 0.1) + '"/></g>');
    // the speech bubble
    var b = L.bub, nose = P(0.08, -1.04);
    out.push('<g data-sb="bub" opacity="0" style="transform-origin:' + r1(b[0]) + 'px ' + r1(b[1] + b[3]) + 'px"><path class="sb-bub" d="M' + r1(b[0] + b[3] / 2) + ' ' + b[1] + 'H' + r1(b[0] + b[2] - b[3] / 2) + 'A' + r1(b[3] / 2) + ' ' + r1(b[3] / 2) + ' 0 0 1 ' + r1(b[0] + b[2] - b[3] / 2) + ' ' + r1(b[1] + b[3]) +
      'H' + r1(b[0] + 70) + 'L' + nose.join(' ') + 'L' + r1(b[0] + 30) + ' ' + r1(b[1] + b[3]) + 'H' + r1(b[0] + b[3] / 2) + 'A' + r1(b[3] / 2) + ' ' + r1(b[3] / 2) + ' 0 0 1 ' + r1(b[0] + b[3] / 2) + ' ' + b[1] + 'Z"/>' +
      '<text class="sb-say" x="' + r1(b[0] + b[2] / 2) + '" y="' + r1(b[1] + b[3] / 2) + '" dy=".35em" text-anchor="middle" font-size="' + fs(14) + '"></text></g>');
    // labels (1 to 3 words, on what they name)
    out.push(lab(L.tall ? [L.cx - L.rx - 8, L.cy - L.ry * 0.25] : [L.cx - L.rx - 14, L.cy - L.ry * 0.2], L.tall ? ['Left', 'hemisphere'] : ['Left hemisphere'], 'end', px, 'sb-lab'));
    out.push(lab(L.tall ? [L.cx + L.rx + 8, L.cy - L.ry * 0.25] : [L.cx + L.rx + 14, L.cy - L.ry * 0.2], L.tall ? ['Right', 'hemisphere'] : ['Right hemisphere'], 'start', px, 'sb-lab'));
    out.push(lab([L.speech[0], L.speech[1]], ['Speech'], 'middle', px, 'sb-lab is-sm', true));
    out.push('<path class="sb-lead" d="M500 ' + r1(L.cc[1] + L.cc[3] + 4) + 'V' + r1(L.cy + L.ry * 1.06) + '"/>');
    out.push('<g data-sb="cclab">' + lab([500, L.cy + L.ry * 1.06 + 10 / px], ['Corpus callosum'], 'middle', px, 'sb-lab is-pill', true, 'cclab-t') + '</g>');
    var hy = function(t){ return t[1] + t[3] - 15 / px; };   // inside the tray, clear of the table's edge
    out.push(lab([L.tray.left[0] + L.tray.left[2] / 2, hy(L.tray.left)], ['Left hand'], 'middle', px, 'sb-lab', false));
    out.push(lab([L.tray.right[0] + L.tray.right[2] / 2, hy(L.tray.right)], ['Right hand'], 'middle', px, 'sb-lab', false));
    return out.join('');
  }
  function lab(p, lines, anchor, px, cls, pill, nm){
    var fs = (/is-sm/.test(cls) ? 12 : 13) / px, lh = fs * 1.15, y0 = p[1] - (lines.length - 1) * lh / 2;
    var t = '<text class="' + cls + '" x="' + r1(p[0]) + '" y="' + r1(y0) + '" dy=".35em" text-anchor="' + anchor + '" font-size="' + r1(fs) + '"' + (nm ? ' data-sb="' + nm + '"' : '') + '>' +
      lines.map(function(l, i){ return '<tspan x="' + r1(p[0]) + '" dy="' + (i ? r1(lh) : '.35em') + '">' + esc(l) + '</tspan>'; }).join('') + '</text>';
    if(!pill) return t;
    return '<g class="sb-pill-g">' + '<rect class="sb-pill" data-pill="1" x="0" y="0" width="0" height="0"/>' + t + '</g>';
  }
  function handSvg(h, k){
    var s = h === 'left' ? 1 : -1;
    return '<g class="sb-hand" transform="scale(' + (s * k) + ' ' + k + ')"><path d="M-14 -18q-6 10 -4 24q2 12 14 14h14q10 -2 12 -12l4 -20q1 -6 -5 -6q-5 0 -6 5l-2 8v-22q0 -6 -6 -6q-5 0 -5 6v-4q0 -6 -6 -6q-5 0 -5 6v2q0 -5 -5 -5q-5 0 -5 6z"/></g>';
  }
  function objSvg(ob, x, y, s, cls){
    var t = 'translate(' + r1(x) + ' ' + r1(y) + ') scale(' + r1(s / 20) + ')', d;
    switch(ob){
      case 'key': d = '<circle cx="-10" cy="0" r="8" class="m"/><circle cx="-10" cy="0" r="3" class="h"/><path d="M-2 -3h22v6h-4v5h-4v-5h-4v4h-4v-4h-6z" class="m"/>'; break;
      case 'spoon': d = '<ellipse cx="-12" cy="0" rx="9" ry="6" class="m"/><path d="M-4 -2h24v4h-24z" class="m"/>'; break;
      case 'pencil': d = '<path d="M-20 -4h30l8 4l-8 4h-30z" class="y"/><path d="M10 -4l8 4l-8 4z" class="w"/><path d="M-20 -4h6v8h-6z" class="p"/>'; break;
      case 'ball': d = '<circle r="12" class="r"/><path d="M-12 0q12 -8 24 0M-8 -8q8 8 0 16" class="ln"/>'; break;
      case 'cup': d = '<path d="M-12 -10h20l-2 20h-16z" class="c"/><path d="M8 -6q8 0 8 6t-8 6" class="ln"/>'; break;
      case 'coin': d = '<circle r="11" class="y"/><circle r="7" class="ln"/>'; break;
      case 'comb': d = '<path d="M-18 -6h36v5h-36z" class="p"/><path d="M-16 -1v9M-11 -1v9M-6 -1v9M-1 -1v9M4 -1v9M9 -1v9M14 -1v9" class="ln2"/>'; break;
      default: d = '<path d="M-20 -1h24M4 -6v10M8 -6v10M12 -6v10M16 -6v10" class="ln2"/><path d="M4 -2h12v4h-12z" class="m"/>';
    }
    return '<g class="' + cls + '" transform="' + t + '">' + d + '</g>';
  }

  /* the box a part is drawn in (its polygon cut to the cerebrum and its lobe), for its effect svg */
  function boxOf(view, id){
    var g = G[view], r = g.reg[id], b = [1e9, 1e9, -1e9, -1e9];
    r.poly.forEach(function(p){ b[0] = Math.min(b[0], p[0]); b[1] = Math.min(b[1], p[1]); b[2] = Math.max(b[2], p[0]); b[3] = Math.max(b[3], p[1]); });
    r.within.forEach(function(w){ var pts = w === 'out' ? g.outline : g.reg[w].poly, c = [1e9, 1e9, -1e9, -1e9];
      pts.forEach(function(p){ c[0] = Math.min(c[0], p[0]); c[1] = Math.min(c[1], p[1]); c[2] = Math.max(c[2], p[0]); c[3] = Math.max(c[3], p[1]); });
      b = [Math.max(b[0], c[0]), Math.max(b[1], c[1]), Math.min(b[2], c[2]), Math.min(b[3], c[3])]; });
    return [b[0] - 8, b[1] - 8, b[2] + 8, b[3] + 8];
  }
  /* the clip paths, mask and hatch one part's effect needs, with this svg's own ids */
  function partDefs(view, id, pid){
    var g = G[view], r = g.reg[id], d = '';
    r.within.forEach(function(w){ d += '<clipPath id="' + pid + (w === 'out' ? 'out' : 'r-' + w) + '"><path d="' + dOf(w === 'out' ? g.outline : g.reg[w].poly) + '"/></clipPath>'; });
    if(r.lv === 'low') d += '<mask id="' + pid + 'low" maskUnits="userSpaceOnUse" x="-400" y="-200" width="1800" height="1200"><rect x="-400" y="-200" width="1800" height="1200" fill="#fff"/><path d="' + dOf(g.outline) + '" fill="#000"/></mask>';
    return d + '<pattern id="' + pid + 'hatch" width="12" height="12" patternUnits="userSpaceOnUse" patternTransform="rotate(40)"><rect width="12" height="12" class="bm-dmg-bg"/><path d="M0 0V12" class="bm-dmg-ln"/></pattern>';
  }

  /* ------------------------------------------------------------ mount */
  T.mount('brain-map', function(app, data){
    T.kit2(app, { slug: 'brain-map',
      explore: function(host){ return explore(host, data); },
      quiz: function(host){ quiz(host, data); } });
  });

  /* ============================================================ EXPLORE */
  var TABS = [{ value: 'outside', label: 'Outside', purpose: 'Where each part of the brain’s surface is, and its job' },
    { value: 'inside', label: 'Inside', purpose: 'The parts deep inside the brain, and their jobs' },
    { value: 'split', label: 'Split brain', purpose: 'What happens when the two hemispheres cannot share' }];
  var ACCEPT = { callosum: ['corpus callosum', 'callosum'], ras: ['RAS', 'reticular formation', 'reticular'], reward: ['nucleus accumbens', 'reward', 'reward system'],
    somatosensory: ['sensory cortex', 'touch strip', 'sensory strip', 'primary somatosensory cortex'], motor: ['motor strip', 'primary motor cortex', 'motor'], broca: ['broca', 'brocas area'],
    wernicke: ['wernicke', 'wernickes area'], pituitary: ['master gland', 'pituitary'], medulla: ['medulla oblongata'], visual: ['primary visual cortex', 'V1', 'vision'],
    auditory: ['hearing', 'primary auditory cortex'], prefrontal: ['PFC', 'prefrontal'], hippocampus: ['hippocampi'], cerebellum: ['little brain'] };
  var PREF = 'appsych_brainmap_v2';
  function load(){ try{ return JSON.parse(localStorage.getItem(PREF) || '{}') || {}; }catch(e){ return {}; } }
  function save(p){ try{ localStorage.setItem(PREF, JSON.stringify(p)); }catch(e){} }

  function explore(host, data){
    var K = window.LevlKit2;
    if(!K) return { stage: host, shown: function(){} };
    var pref = load(), tabV = (/^#view\/(outside|inside|split)\b/.exec(location.hash) || [])[1] || pref.tab || 'outside';
    if(!TABS.some(function(t){ return t.value === tabV; })) tabV = 'outside';
    var picks = pref.picks || { outside: 'frontal', inside: 'thalamus' };
    var dmg = false, onScreen = false, LS = null, cue = null, cueDone = false;
    var S = { cut: true, field: null, word: 0, run: null, stage: 0, swap: 0, grow: 0 };

    var stage = document.createElement('div'); stage.className = 'bmx';
    var tabs = K.tabs({ label: 'What to look at', items: TABS.map(function(t){ return { value: t.value, label: t.label }; }), value: tabV, big: true, onChange: function(v){ setTab(v, true); } });
    stage.appendChild(tabs.el);
    var head = K.head({ purpose: '', how: { label: 'Show me how', onClick: function(){ startTour(); } } });
    stage.appendChild(head.el);
    var scene = document.createElement('div'); scene.className = 'bmx-scene'; scene.id = 'bmx-scene';
    scene.innerHTML = '<div class="bmx-plate"><div class="bmx-pic"><svg class="bmx-svg" xmlns="http://www.w3.org/2000/svg" role="img" focusable="false" data-ls-text="keep"></svg><svg class="bmx-fxl" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false" data-ls-text="keep"></svg></div>' +
      '<p class="bmx-front" aria-hidden="true"><span>Front</span></p>' +
      '<form class="bmx-find" role="search"><button type="button" class="bmx-find-b" aria-label="Find a part by name" aria-expanded="false"></button><label class="tk2-sr" for="bmx-find-in">Find a part by name</label>' +
      '<input id="bmx-find-in" class="bmx-find-in" type="search" placeholder="Find a part" autocomplete="off" spellcheck="false" enterkeyhint="search"></form></div>';
    stage.appendChild(scene);
    tabs.el.querySelectorAll('.tk2-tab').forEach(function(b){ b.setAttribute('aria-controls', scene.id); });
    var plate = scene.querySelector('.bmx-plate'), pic = scene.querySelector('.bmx-pic'), svg = scene.querySelector('.bmx-svg'),
      fxl = scene.querySelector('.bmx-fxl'), form = scene.querySelector('.bmx-find'), fin = scene.querySelector('.bmx-find-in'), fb = scene.querySelector('.bmx-find-b'), front = scene.querySelector('.bmx-front');
    var layer = K.layer(pic);
    var lines = document.createElement('div'); lines.className = 'bmx-lines';
    var cause = K.cause({ label: 'What it does' });
    lines.appendChild(cause.el);
    var dbtn = document.createElement('button'); dbtn.type = 'button'; dbtn.className = 'bmx-dmg'; dbtn.setAttribute('aria-pressed', 'false');
    dbtn.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M13 2L4 14h7l-1 8 9-12h-7z"/></svg><span>If damaged</span>';
    lines.appendChild(dbtn);
    stage.appendChild(lines);
    var live = document.createElement('p'); live.className = 'tk2-sr'; live.setAttribute('aria-live', 'polite'); stage.appendChild(live);
    function say(t){ live.textContent = ''; setTimeout(function(){ live.textContent = t; }, 40); }

    var view = tabV === 'split' ? 'outside' : tabV, spots = {}, taps = [], L = null, px = 0.6;
    function isSplit(){ return tabV === 'split'; }
    /* -------------------------------------------- size: the picture fits the stage */
    /* The frame in picture units (the svg viewBox) and where the drawing's own units sit in it (TX, TY): on a wide
       stage the frame is wider and the drawing centred (the head round the brain); on a phone the brain views are
       cropped to the brain, so it is drawn larger. The pins, taps and cue use picture units. */
    var FW = VW, FH = VH, TX = 0, TY = 0;
    function frame(){ return [FW, FH]; }
    function fit(){
      if(!stage.isConnected || !scene.clientWidth) return false;
      var ps = getComputedStyle(plate), padX = parseFloat(ps.paddingLeft) + parseFloat(ps.paddingRight), padY = parseFloat(ps.paddingTop) + parseFloat(ps.paddingBottom);
      var w = scene.clientWidth - padX, H = window.innerHeight, room;
      var tall = isSplit() && w < 560;

      if(window.innerWidth >= 1000){
        var sb = LS && LS.stage ? LS.stage.getBoundingClientRect().bottom : H, bottom = Math.min(H, sb > 0 ? sb : H);
        room = Math.max(300, bottom - plate.getBoundingClientRect().top - lines.offsetHeight - 20 - padY);
      } else room = H * (window.innerWidth <= 640 ? (isSplit() ? 0.7 : 0.6) : 0.62) - padY;
      var baseH = isSplit() ? (tall ? SPLIT_TALL_H : VH) : VH;
      FW = !tall && w / room > 1.62 && w >= 700 ? Math.round(Math.min(1640, baseH * w / room)) : VW;
      FH = baseH; TX = (FW - VW) / 2; TY = 0;
      if(!isSplit() && w < 640){ FW = 910; FH = 690; TX = -45; TY = -30; }
      if(isSplit() && (!L || L.tall !== tall || L.extra !== TX)){ L = splitLay(tall, TX); }
      var f = frame();
      var k = Math.min(w / f[0], room / f[1], 1.25);
      var W = Math.round(f[0] * k), Hh = Math.round(f[1] * k);
      var changed = Math.abs(W - (pic._w || 0)) > 1 || Math.abs(Hh - (pic._h || 0)) > 1;
      pic.style.width = W + 'px'; pic.style.height = Hh + 'px'; pic._w = W; pic._h = Hh;
      var npx = W / f[0], key = FW + '|' + FH + '|' + TX + '|' + TY;
      if(changed || Math.abs(npx - px) > 0.001 || key !== fit._k){ px = npx; fit._k = key; return true; }
      return false;
    }
    /* --------------------------------------------- the brain views */
    var sel = null, anim = {};
    function drawBrain(){
      var off = TX, head = FW >= 1300, tf = '<g transform="translate(' + TX + ' ' + TY + ')">';
      svg.setAttribute('viewBox', '0 0 ' + FW + ' ' + FH);
      svg.innerHTML = tf + brainSvg(view, { pid: 'bmx' + view, fx: true, px: px, head: head }) + '</g>';
      fxl.setAttribute('viewBox', '0 0 ' + FW + ' ' + FH); fxl.hidden = false;
      fxl.innerHTML = tf + fxSvg(view, 'bmf' + view, { px: px, bx: head ? Math.round(Math.min(1000 + off * 0.55, 1000 + off - 10 - 64 / px)) : 0 }) + '</g>';
      front.hidden = head;   // the face shows the front on a wide stage
      makeSpots(view);
      if(cue && cue.active()) setTimeout(function(){ if(cue && cue.active()) requestAnimationFrame(makeCue); }, 40);
      svg.setAttribute('aria-label', view === 'outside' ? 'The left hemisphere seen from the left, front on the left: the four lobes, the motor and touch strips, the language areas, the cerebellum and the brainstem.' :
        'The brain cut down the middle, seen from the inside, front on the left: the corpus callosum, thalamus, hypothalamus, pituitary gland, brainstem and cerebellum, and the hippocampus, amygdala and reward center seen through the tissue.');
      paintSel(false);
    }
    function itemsFor(v){
      var g = G[v], out = [];
      g.order.forEach(function(id){ var q = g.reg[id].pin; out.push({ id: id, name: R[id].name, at: [[q[0] + TX, q[1] + TY]], side: q[0] > 520 ? 'right' : 'left', accept: ACCEPT[id] || [] }); });
      return out;
    }
    function makeSpots(v){
      var key = TX + '|' + TY, old = spots[v];
      if(old && old._key === key) return old;
      if(old) old.el.remove();
      var tx = TX, ty = TY;
      var sp = K.spots(layer, { key: 'appsych-brainmap-spots', label: v === 'outside' ? 'Parts of the brain, outside' : 'Parts of the brain, inside', items: itemsFor(v), chip: false,
        avoid: function(){ var a = [fb.getBoundingClientRect(), front.getBoundingClientRect()], bt = fxl.querySelector('.bm-body.is-on .bm-bd-t'); if(bt && bt.textContent) a.push(bt.getBoundingClientRect()); return a; },
        under: function(x, y){ return regAt(v, x - tx, y - ty); },
        blank: function(x, y){ return !onBrain(v, x - tx, y - ty); },
        onMiss: function(){ hideCue(true); },
        onPick: function(it, how){
          if(v !== view) return;
          sel = it ? it.id : null;
          if(it){ picks[v] = it.id; pref.picks = picks; save(pref); }
          paintSel(how !== 'set' || !!it);
          if(how === 'tap' || how === 'key' || how === 'find'){ hideCue(true); tourDid(how === 'find' ? 'find' : 'tap'); if(it) say(R[it.id].name + ': ' + (dmg ? 'if it is damaged, ' + R[it.id].hurt : R[it.id].job) + '.'); }
        } });
      spots[v] = sp; sp._key = key;
      sp.hide(v !== view || isSplit());
      // a rebuilt set keeps the part that was named
      if(old && old.picked()){ var was = old.picked().id; if(v === view){ sp.pick(was, 'set'); } }
      return sp;
    }
    /* the selected part: its color grows from the pin, its edge draws; damage spreads from the pin */
    function paintSel(animate){
      Object.keys(anim).forEach(function(k){ cancelAnimationFrame(anim[k]); });
      anim = {};
      var g = G[view];
      pic.querySelectorAll('.bmx-fxp.bm-fx-on').forEach(function(e){ e.classList.remove('bm-fx-on'); e.classList.add('bm-fx-off'); setTimeout(function(){ if(e.parentNode) e.parentNode.removeChild(e); }, K.reduced() ? 160 : 260); });
      var body = fxl.querySelector('[data-body]');
      if(body){ var bon = sel === 'motor' || sel === 'somatosensory'; body.classList.toggle('is-on', bon); if(!bon) body.classList.remove('is-hurt'); }
      dbtn.disabled = !sel; dbtn.setAttribute('aria-pressed', String(dmg && !!sel));
      // the words wait for the picture: a lesion's effect is named once the damage has spread over half the part
      var late = dmg && animate && !K.reduced() && !!sel;
      if(!late) line(); else cause.set([{ t: R[sel].name, role: 'k' + (lobeOf(sel) || 'x') }]);   // the name at once, the damage once it shows
      if(!sel || !g.reg[sel]) return;
      var r = g.reg[sel];
      var pid = 'bmp' + (++S.grow), gid = pid + 'grow';
      var reach = 0; r.poly.forEach(function(p){ reach = Math.max(reach, Math.hypot(p[0] - r.pin[0], p[1] - r.pin[1])); });
      reach = Math.min(reach, 1300) + 10;
      // the part's own small svg, the size of its box: only it repaints while the colour or the lesion grows
      var bb = boxOf(view, sel), wrap = document.createElementNS(NS, 'svg');
      wrap.setAttribute('class', 'bmx-fxp bm-fx-on' + (dmg ? ' is-dmg' : '')); wrap.setAttribute('aria-hidden', 'true'); wrap.setAttribute('data-ls-text', 'keep');
      wrap.setAttribute('viewBox', [bb[0], bb[1], bb[2] - bb[0], bb[3] - bb[1]].map(r1).join(' '));
      wrap.style.left = ((bb[0] + TX) * px).toFixed(1) + 'px'; wrap.style.top = ((bb[1] + TY) * px).toFixed(1) + 'px';
      wrap.style.width = ((bb[2] - bb[0]) * px).toFixed(1) + 'px'; wrap.style.height = ((bb[3] - bb[1]) * px).toFixed(1) + 'px';
      var d = dOf(r.poly), k = lobeOf(sel) || 'x', red = K.reduced() || !animate;
      wrap.innerHTML = '<defs><clipPath id="' + gid + '"><circle cx="' + r.pin[0] + '" cy="' + r.pin[1] + '" r="' + (red ? reach : 0) + '"/></clipPath>' + partDefs(view, sel, pid) + '</defs>' +
        within(view, sel, pid, '<g clip-path="url(#' + gid + ')"><path class="bm-hl-f bm-k-' + k + '" d="' + d + '"/>' + (dmg ? '<path class="bm-dmg" d="' + d + '" fill="url(#' + pid + 'hatch)"/><path class="bm-dmg-t" d="' + d + '"/>' : '') + '</g>') +
        within(view, sel, pid, '<path class="bm-hl-e' + (dmg ? ' is-dmg' : '') + '" d="' + d + '" pathLength="1"' + (red ? '' : ' style="stroke-dasharray:1;stroke-dashoffset:1"') + '/>');
      if(r.lv === 'low'){ var inner = wrap.innerHTML.replace('</defs>', '</defs><g mask="url(#' + pid + 'low)">'); wrap.innerHTML = inner + '</g>'; }
      if(red){ wrap.classList.add('is-fade'); }
      pic.insertBefore(wrap, fxl);
      if(red){ requestAnimationFrame(function(){ wrap.classList.add('is-in'); }); return; }
      var circ = wrap.querySelector('clipPath circle'), edge = wrap.querySelector('.bm-hl-e'), t0 = performance.now(), dur = dmg ? 560 : 340;
      function step(now){
        var t = clamp((now - t0) / dur, 0, 1), e = ease(t);
        circ.setAttribute('r', r1(reach * e));
        edge.style.strokeDashoffset = String(1 - e);
        if(late && t >= 0.5){ late = false; line(); }
        if(t < 1) anim.sel = requestAnimationFrame(step); else { edge.style.strokeDasharray = ''; edge.style.strokeDashoffset = ''; }
      }
      anim.sel = requestAnimationFrame(step);
    }
    function line(){
      if(isSplit()) return;
      var body = fxl.querySelector('[data-body]');
      if(body && (sel === 'motor' || sel === 'somatosensory')){ body.classList.toggle('is-hurt', dmg); body.querySelector('.bm-bd-t').textContent = bodyText(sel, dmg, false); }
      if(!sel){ cause.set([]); return; }
      var r = R[sel], role = 'k' + (lobeOf(sel) || 'x');
      if(dmg) cause.set([{ t: r.name, role: role }, { t: 'damaged', role: 'dmg' }, { t: r.hurt, role: 'hurt', say: 'If it is damaged: ' + r.hurt }]);
      else cause.set([{ t: r.name, role: role }, { t: r.job, role: 'job', say: r.job }]);
    }
    dbtn.addEventListener('click', function(){ if(!sel) return; dmg = !dmg; hideCue(true); tourDid('dmg'); paintSel(true); say(dmg ? 'If ' + R[sel].name + ' is damaged: ' + R[sel].hurt + '.' : R[sel].name + ', healthy: ' + R[sel].job + '.'); });

    /* -------------------------------------------------- split brain */
    var SB = {};
    function drawSplit(){
      if(!L) L = splitLay(false);
      fxl.innerHTML = ''; fxl.hidden = true;
      svg.setAttribute('viewBox', '0 0 ' + FW + ' ' + FH);
      svg.innerHTML = '<g transform="translate(' + TX + ' ' + TY + ')">' + splitSvg(L, { pid: 'sbx', px: px, object: B.OBJECTS[S.word % B.OBJECTS.length] }) + '</g>';
      SB = {}; svg.querySelectorAll('[data-sb]').forEach(function(e){ SB[e.getAttribute('data-sb')] = e; });
      fitPills();
      paintCut(false);
      splitTaps();
      if(S.stage && S.field) frameAt(S.field, S.cut, 9);   // keep the result after a resize
      else splitLine();
      svg.setAttribute('aria-label', 'A person seen from above, looking at a dot in the middle of a screen. Their brain is drawn inside the head: the left and right hemispheres, joined by the corpus callosum, which is ' + (S.cut ? 'cut' : 'intact') + '. Trays of hidden objects sit under each hand.');
    }
    function fitPills(){
      svg.querySelectorAll('.sb-pill-g').forEach(function(gr){
        var t = gr.querySelector('text'), rc = gr.querySelector('rect'); if(!t || !rc) return;
        try{ var bb = t.getBBox(), pd = 6 / px; rc.setAttribute('x', r1(bb.x - pd * 1.6)); rc.setAttribute('y', r1(bb.y - pd)); rc.setAttribute('width', r1(bb.width + pd * 3.2)); rc.setAttribute('height', r1(bb.height + pd * 2)); rc.setAttribute('rx', r1((bb.height + pd * 2) / 2)); }catch(e){}
      });
    }
    function splitTaps(){
      taps.forEach(function(t){ t.el.remove(); }); taps = [];
      var S0 = L.scr;
      ['left', 'right'].forEach(function(f){
        var t = K.tap(layer, { key: 'appsych-brainmap-flash', label: 'Flash the word in the ' + f + ' visual field', box: [(f === 'left' ? S0[0] + 10 : 500 + 4) + TX, S0[1] + 10 + TY, S0[2] / 2 - 14, S0[3] - 20], chip: false,
          onClick: function(){ hideCue(true); tourDid('flash'); flash(f); } });
        t.el.classList.add('bmx-tap-scr'); taps.push(t);
      });
      var c = L.cc, ct = K.tap(layer, { key: 'appsych-brainmap-cut', label: '', box: [c[0] - 10 + TX, c[1] - 10 + TY, c[2] + 20, c[3] + 20], chip: false, onClick: function(){ hideCue(true); tourDid('cut'); toggleCut(); } });
      ct.el.classList.add('bmx-tap-cc'); taps.push(ct);
      ccLabel();
    }
    function ccLabel(){
      var ct = taps[2]; if(ct) ct.el.setAttribute('aria-label', S.cut ? 'Corpus callosum, cut. Tap for a person whose corpus callosum is intact.' : 'Corpus callosum, intact. Tap to cut it, as split-brain surgery does.');
      var t = SB['cclab-t']; if(t){ t.firstChild.textContent = S.cut ? 'Corpus callosum: cut' : 'Corpus callosum: intact'; fitPills(); }
      if(SB.cclab) SB.cclab.classList.toggle('is-cut', S.cut);
    }
    /* cut: the two ends pull apart and the cut marks show; intact: a different person comes in (a cut never heals) */
    function paintCut(animate){
      var a = SB['cc-a'], b = SB['cc-b'], sn = SB.snip; if(!a) return;
      var gap = L.cc[2] * 0.16;
      function set(e){ a.setAttribute('transform', 'translate(' + r1(-gap * e) + ' 0)'); b.setAttribute('transform', 'translate(' + r1(gap * e) + ' 0)'); sn.setAttribute('opacity', r1(e)); }
      if(!animate || K.reduced()){ set(S.cut ? 1 : 0); return; }
      if(S.cut){ var t0 = performance.now(); (function st(now){ var t = clamp((now - t0) / 420, 0, 1); set(ease(t)); if(t < 1) anim.cut = requestAnimationFrame(st); })(t0); }
    }
    function toggleCut(){
      stopRun(true);
      S.cut = !S.cut; S.stage = 0; S.field = null;
      var person = SB.person;
      if(!S.cut && person && !K.reduced()){
        person.style.transition = 'opacity .22s ease-in'; person.style.opacity = '0';
        setTimeout(function(){ if(!SB['cc-a']) return; paintCut(false); ccLabel(); person.style.transition = 'opacity .3s ease-out'; person.style.opacity = '1'; splitLine(); }, 240);
      } else { paintCut(true); ccLabel(); splitLine(); }
      say(S.cut ? 'The corpus callosum is cut, as in split-brain surgery: the hemispheres cannot share.' : 'A different person, with the corpus callosum intact: the hemispheres share what each sees.');
    }
    function splitLine(stg, field){
      if(!isSplit()) return;
      if(!field){ cause.set(S.cut ? [{ t: 'Corpus callosum cut', role: 'cut' }, { t: 'hemispheres can’t share', role: 'job' }] : [{ t: 'Corpus callosum intact', role: 'cc' }, { t: 'hemispheres share', role: 'job' }]); return; }
      var sb = B.splitBrain(field, S.cut), parts = [{ t: field === 'left' ? 'Left field' : 'Right field', role: 'word' }];
      if(stg >= 1) parts.push({ t: sb.first + ' hemisphere', role: 'hemi' });
      if(stg >= 2 && !S.cut) parts.push({ t: 'crosses over', role: 'cc' });
      if(stg >= 3) parts.push(sb.says ? { t: 'names it', role: 'yes' } : { t: 'can’t name it', role: 'no' });
      if(stg >= 4) parts.push(sb.leftHand && sb.rightHand ? { t: 'both hands', role: 'yes' } : { t: (sb.leftHand ? 'left' : 'right') + ' hand finds it', role: 'yes' });
      cause.set(parts);
    }
    /* one flash, as a timeline (seconds): word 0 to 1.1; light to the eyes .3 to .7; along the optic routes .7 to
       1.5; the hemisphere lights 1.5 to 1.8; the corpus callosum 1.8 to 2.4 (crosses, or stops at the cut); speech
       and the hand 2.4 to 3.4. The cause line reads the stage the picture has reached. */
    var DUR = 3.5;
    function flash(field){
      stopRun(false);
      S.field = field; S.word = (S.word + 1) % B.OBJECTS.length; S.stage = 0;
      var obj = B.OBJECTS[S.word];
      SB.word.querySelector('text').textContent = obj.toUpperCase();
      SB.bub.querySelector('text').textContent = '';
      ['left', 'right'].forEach(function(h){ var o = SB['hold-' + h]; if(o) o.innerHTML = objSvg(obj, 0, 0, L.tall ? 30 : 24, 'sb-held'); if(SB['tray-' + h]) SB['tray-' + h].innerHTML = trayObjs(L, h, obj); });
      splitLine(0, field);
      if(K.reduced()){ svg.classList.add('is-fade'); frameAt(field, S.cut, 9); requestAnimationFrame(function(){ svg.classList.remove('is-fade'); }); splitDone(field); return; }
      if(window.innerWidth < 1000){ var rc = pic.getBoundingClientRect(); if(rc.top < 0 || rc.bottom > window.innerHeight) pic.scrollIntoView({ block: 'center', behavior: 'smooth' }); }
      var t0 = performance.now();
      S.run = { field: field };
      (function st(now){
        if(!S.run) return;
        var t = (now - t0) / 1000;
        frameAt(field, S.cut, t);
        if(t < DUR) S.run.raf = requestAnimationFrame(st); else { S.run = null; splitDone(field); }
      })(t0);
    }
    function splitDone(field){
      var sb = B.splitBrain(field, S.cut), obj = B.OBJECTS[S.word];
      say((sb.says ? 'The patient says “' + obj + '.”' : 'The patient says they saw nothing.') + ' ' + (sb.leftHand && sb.rightHand ? 'Either hand finds the ' + obj + '.' : (sb.leftHand ? 'The left' : 'The right') + ' hand finds the ' + obj + ' by touch.'));
    }
    function stopRun(clear){
      if(S.run && S.run.raf) cancelAnimationFrame(S.run.raf);
      S.run = null;
      if(clear && SB.word) frameAt(S.field || 'left', S.cut, -1);
    }
    function pointOn(path, f){ try{ var l = path.getTotalLength(); return path.getPointAtLength(l * clamp(f, 0, 1)); }catch(e){ return { x: 0, y: 0 }; } }
    /* the picture at time t of a flash (t > DUR: the end; t < 0: idle) */
    function frameAt(field, cut, t){
      if(!SB.word) return;
      var sb = B.splitBrain(field, cut), to = sb.first, other = to === 'left' ? 'right' : 'left';
      var idle = t < 0, wv = idle ? 0 : t < 0.3 ? t / 0.3 : t < 0.9 ? 1 : t < 1.2 ? 1 - (t - 0.9) / 0.3 : 0;
      // reduced motion shows the end at once: the word stays in its field, a still mark of what was flashed
      if(t > DUR && K.reduced()) wv = 1;
      var w = L.word[field];
      SB.word.setAttribute('opacity', r1(wv * 100) / 100);
      SB.word.setAttribute('transform', 'translate(' + r1(w[0]) + ' ' + r1(w[1]) + ') scale(' + r1(0.7 + 0.3 * Math.min(1, wv * 1.4)) + ')');
      // light to the eyes
      var rv = idle ? 0 : t < 0.3 ? 0 : t < 0.7 ? (t - 0.3) / 0.4 : t < 1.4 ? 1 - (t - 0.7) / 0.7 : 0;
      var ry0 = L.scr[1] + L.scr[3] + 2;   // from the screen's lower edge, below the field's label
      SB.rays.setAttribute('d', 'M' + r1(w[0]) + ' ' + r1(ry0) + 'L' + L.eye.left.join(' ') + 'M' + r1(w[0]) + ' ' + r1(ry0) + 'L' + L.eye.right.join(' '));
      SB.rays.setAttribute('opacity', r1(rv * 100) / 100);
      // the optic routes
      ['left', 'right'].forEach(function(f){ [0, 1].forEach(function(i){ var n = SB['nerve-' + f + '-' + i]; if(n) n.classList.toggle('is-on', !idle && f === field && t >= 0.7); }); });
      var pf = (t - 0.7) / 0.8;
      [0, 1].forEach(function(i){
        var p = SB['p' + i], path = SB['nerve-' + field + '-' + i];
        if(idle || pf <= 0 || pf >= 1){ p.setAttribute('opacity', '0'); return; }
        var q = pointOn(path, ease(pf)); p.setAttribute('cx', r1(q.x)); p.setAttribute('cy', r1(q.y)); p.setAttribute('opacity', '1');
      });
      var g1 = idle ? 0 : clamp((t - 1.5) / 0.3, 0, 1);
      SB['glow-' + to].setAttribute('opacity', r1(g1 * 0.85 * 100) / 100);
      // the corpus callosum
      var cf = (t - 1.8) / 0.6, p2 = SB.p2;
      if(idle || cf <= 0){ p2.setAttribute('opacity', '0'); SB.block.setAttribute('opacity', '0'); SB.cross.setAttribute('opacity', '0'); SB['glow-' + other].setAttribute('opacity', '0'); }
      else {
        var from = L.mid[to], dest = L.mid[other], mx = 500, my = L.cc[1] + L.cc[3] * 0.5;
        var f2 = cut ? Math.min(cf, 0.5) : Math.min(cf, 1);
        var e2 = ease(f2), u = e2, bx = (1 - u) * (1 - u) * from[0] + 2 * (1 - u) * u * mx + u * u * dest[0], by = (1 - u) * (1 - u) * from[1] + 2 * (1 - u) * u * my + u * u * dest[1];
        p2.setAttribute('cx', r1(bx)); p2.setAttribute('cy', r1(by));
        p2.setAttribute('opacity', cut ? (cf < 0.5 ? '1' : r1(clamp(1 - (cf - 0.5) / 0.3, 0, 1) * 100) / 100) : (cf < 1 ? '1' : '0'));
        SB.cross.setAttribute('opacity', cut ? '0' : r1(clamp(cf, 0, 1) * 0.9 * 100) / 100);
        SB.block.setAttribute('opacity', cut && cf >= 0.45 ? '1' : '0');
        SB['glow-' + other].setAttribute('opacity', cut ? '0' : r1(clamp((t - 2.4) / 0.3, 0, 1) * 0.85 * 100) / 100);
      }
      // speech and the hands
      var bv = idle ? 0 : clamp((t - 2.4) / 0.25, 0, 1);
      SB.bub.setAttribute('opacity', r1(bv * 100) / 100);
      SB.bub.style.transform = 'scale(' + r1(0.6 + 0.4 * ease(bv)) + ')';
      SB.bub.querySelector('text').textContent = bv > 0 ? (sb.says ? '“' + B.OBJECTS[S.word].charAt(0).toUpperCase() + B.OBJECTS[S.word].slice(1) + '!”' : '“I saw nothing.”') : '';
      SB.bub.classList.toggle('is-no', !sb.says);
      ['left', 'right'].forEach(function(h){
        var has = h === 'left' ? sb.leftHand : sb.rightHand, hand = SB['hand-' + h], hold = SB['hold-' + h], mot = SB['mot-' + h], arm = SB['armp-' + h];
        var a = L.hand[h], z = L.reach[h], hv = idle || !has ? 0 : clamp((t - 2.6) / 0.8, 0, 1);
        var go = hv < 0.5 ? ease(hv * 2) : 1 - ease((hv - 0.5) * 2) * 0.7;
        var x = a[0] + (z[0] - a[0]) * go, y = a[1] + (z[1] - a[1]) * go;
        hand.setAttribute('transform', 'translate(' + r1(x) + ' ' + r1(y) + ')');
        arm.setAttribute('d', armD(L, h, x, y));
        var pk = SB['tray-' + h] && SB['tray-' + h].querySelector('[data-pick]'); if(pk) pk.style.opacity = hv >= 0.5 ? '0' : '';
        hold.setAttribute('opacity', hv >= 0.5 ? '1' : '0');
        mot.classList.toggle('is-on', !idle && has && t >= 2.5);
      });
      // the cause line follows the picture
      var stg = idle ? 0 : t >= 3.2 ? 4 : t >= 2.55 ? 3 : t >= (cut ? 2.2 : 2.45) ? 2 : t >= 1.72 ? 1 : 0;
      if(t > DUR) stg = 4;
      if(stg !== S.stage || idle){ S.stage = idle ? 0 : stg; if(isSplit()) splitLine(stg, idle ? null : field); }
    }

    /* ----------------------------------------------------- tabs */
    function setTab(v, user){
      stopRun(false);
      tabV = v; tabs.value(v); pref.tab = v; save(pref);
      var t = TABS.filter(function(x){ return x.value === v; })[0];
      head.purpose(t.purpose);
      stage.setAttribute('data-tab', v);
      hideCue(false);
      Object.keys(spots).forEach(function(k){ spots[k].hide(true); });
      pic.querySelectorAll('.bmx-fxp').forEach(function(e){ e.remove(); });
      taps.forEach(function(x){ x.el.remove(); }); taps = [];
      pic.classList.add('is-swap');
      var token = ++S.swap;
      setTimeout(function(){
        if(token !== S.swap) return;
        if(v === 'split'){ S.stage = 0; S.field = null; L = null; fit(); drawSplit(); dbtn.hidden = true; form.hidden = true; front.hidden = true; }
        else {
          view = v; dbtn.hidden = false; form.hidden = false;
          fit(); drawBrain();
          var sp = makeSpots(v); sp.hide(false); sp.place();
          var first = picks[v] && G[v].reg[picks[v]] ? picks[v] : G[v].order[0];
          if(!sp.picked() || sp.picked().id !== first) sp.pick(first, 'set'); else { sel = first; paintSel(false); }
        }
        requestAnimationFrame(function(){ if(token === S.swap) pic.classList.remove('is-swap'); });
        if(onScreen) setTimeout(function(){ requestAnimationFrame(makeCue); }, K.reduced() ? 220 : 300);
      }, user && !K.reduced() ? 150 : 0);
      fin.value = ''; form.classList.remove('is-miss', 'is-open');
      refHtml();
      if(user){ try{ history.replaceState(null, '', location.pathname + location.search + '#view/' + v); }catch(e){} say(t.label + '. ' + t.purpose + '.'); }
    }

    /* ----------------------------------------------- find by name */
    function doFind(){
      var q = fin.value.trim(); if(!q){ form.classList.remove('is-miss'); return; }
      var sp = spots[view], it = sp && sp.match(q), other = view === 'outside' ? 'inside' : 'outside';
      if(!it){
        var o2 = makeSpots(other), it2 = o2.match(q);
        if(it2){ picks[other] = it2.id; setTab(other, true); form.classList.remove('is-miss'); tourDid('find'); say(it2.name + ' is in the ' + other + ' view.'); return; }
      }
      if(it) sp.find(q);
      form.classList.toggle('is-miss', !it);
      if(!it) say('No part called ' + q + '.');
    }
    form.addEventListener('submit', function(e){ e.preventDefault(); doFind(); });
    function openFind(on){ form.classList.toggle('is-open', on); fb.setAttribute('aria-expanded', String(on)); if(on){ fin.focus(); hideCue(true); } }
    fb.addEventListener('click', function(){ openFind(true); });
    fin.addEventListener('blur', function(){ setTimeout(function(){ if(!fin.value.trim() && document.activeElement !== fin){ openFind(false); form.classList.remove('is-miss'); } }, 120); });
    fin.addEventListener('keydown', function(e){ if(e.key === 'Escape'){ fin.value = ''; openFind(false); fb.focus(); } });
    var ft = 0;
    fin.addEventListener('input', function(){ clearTimeout(ft); ft = setTimeout(function(){ if(fin.value.trim().length >= 3) doFind(); else form.classList.remove('is-miss'); }, 320); });
    // a tap on the plate or on the picture beside the brain (the head, the backdrop) closes the card
    plate.addEventListener('click', function(e){ if((e.target === plate || (pic.contains(e.target) && !e.target.closest('.tk2-layer'))) && !isSplit() && spots[view] && spots[view].picked()) spots[view].pick(null, 'tap'); });

    /* ------------------------------------------------------ cue */
    function makeCue(){
      if(cueDone || !onScreen) return;
      hideCue(false);
      var cands = [], text, key = 'appsych-brainmap-' + (isSplit() ? 'split' : 'map');
      if(isSplit()){
        text = 'Tap a side of the screen';
        var pu = function(q){ return [q[0] + TX, q[1] + TY]; };
        cands = (L.tall ? [] : [[pu([L.scr[0] - 6, L.fix[1]]), 'left']]).concat([[pu([L.word.left[0], L.scr[1] + L.scr[3] - 4]), 'below'], [pu([L.word.right[0], L.scr[1] + L.scr[3] - 4]), 'below']]);
      } else {
        var sp = spots[view]; if(!sp || !sp.picked()) return;
        text = 'Tap any part';
        var open = sp.picked();
        sp.items.filter(function(it){ return it !== open; }).sort(function(a, b){ return Math.hypot(b.at[0][0] - open.at[0][0], b.at[0][1] - open.at[0][1]) - Math.hypot(a.at[0][0] - open.at[0][0], a.at[0][1] - open.at[0][1]); })
          .forEach(function(it){ ['below', 'right', 'left'].forEach(function(sd){ cands.push([it.at[0], sd, it.id]); }); });
      }
      var R2 = function(e){ return e.getBoundingClientRect(); }, meet = function(a, b){ return a.left < b.right + 3 && a.right > b.left - 3 && a.top < b.bottom + 3 && a.bottom > b.top - 3; };
      for(var i = 0; i < cands.length; i++){
        // a pin's cue follows that pin when the frame changes (a rebuilt set of pins has new picture units)
        var c = K.cue(layer, { key: key, text: text, side: cands[i][1], at: (function(q, id){ return function(){ var sp = id && spots[view], it = sp && sp.items.filter(function(x){ return x.id === id; })[0]; return it ? it.at[0] : q; }; })(cands[i][0], cands[i][2]) });
        if(!c.show()) return;
        var box = layer.el.querySelector('.tk2-cue'), r = box && R2(box), pr = R2(pic), bad = !r || r.left < pr.left || r.right > pr.right || r.top < pr.top || r.bottom > pr.bottom;
        if(!bad) [].forEach.call(layer.el.querySelectorAll('.tk2-spots:not([hidden]) .tk2-spot-pin, .tk2-spot-card:not([hidden]), .tk2-tap .tk2-badge'), function(e){ if(e.offsetParent !== null && meet(R2(e), r)) bad = true; });
        [fb, front].forEach(function(e){ if(!bad && e.offsetParent !== null && !e.closest('[hidden]') && meet(R2(e), r)) bad = true; });
        if(isSplit() && !bad) svg.querySelectorAll(L.tall ? 'text, .sb-eye' : 'text, .sb-head, .sb-eye').forEach(function(t){ if(!bad && (t.textContent || t.tagName !== 'text') && meet(R2(t), r)) bad = true; });
        if(!bad){ cue = c; return; }
        c.hide(false);
      }
    }
    function hideCue(used){ if(cue && cue.active()){ cue.hide(used); if(used) cueDone = true; } }
    var tour = K.tour({ key: 'appsych-brainmap', label: 'Show me how', steps: [
      { id: 'tap', text: 'Tap any part of the brain. Its name opens beside it, and the line below says its job.', target: function(){ return isSplit() ? pic : (spots[view] && spots[view].items[2] ? spots[view].items[2]._b : pic); } },
      { id: 'dmg', text: 'Press “If damaged” to see what changes when that part is hurt.', target: function(){ return dbtn.hidden ? lines : dbtn; } },
      { id: 'find', text: 'Or find a part by its name here.', target: function(){ return form.hidden ? pic : form.classList.contains('is-open') ? fin : fb; } }],
      onClose: function(had){ if(had) try{ head.how.focus({ preventScroll: true }); }catch(e){} } });
    var tourSplit = K.tour({ key: 'appsych-brainmap-split', label: 'Show me how', steps: [
      { id: 'flash', text: 'Tap a side of the screen. The word flashes there while the person looks at the dot.', target: function(){ return taps[0] ? taps[0].el : pic; } },
      { id: 'watch', text: 'Watch which hemisphere gets it, what the person says and which hand finds it.', target: function(){ return cause.el; } },
      { id: 'cut', text: 'Tap the corpus callosum to compare a person whose hemispheres can share.', target: function(){ return taps[2] ? taps[2].el : pic; } }],
      onClose: function(had){ if(had) try{ head.how.focus({ preventScroll: true }); }catch(e){} } });
    function tourDid(id){ [tour, tourSplit].forEach(function(t){ if(t.active()) t.did(id); }); if(id === 'flash' && tourSplit.active()) setTimeout(function(){ if(tourSplit.active()) tourSplit.did('watch'); }, 3600); }
    function startTour(){ hideCue(false); (isSplit() ? tourSplit : tour).start(true); }

    /* ------------------------------------------------------ "?" */
    var ref = document.createElement('div'); ref.className = 'ls-sec bmx-ref';
    function list(group){ return B.ORDER.filter(function(k){ return R[k].group === group; }).map(function(k){ return '<li><b>' + esc(R[k].name) + '</b>: ' + esc(R[k].does) + ' <span class="bmx-ref-d">If damaged: ' + esc(R[k].damage) + '</span></li>'; }).join(''); }
    function refHtml(){
      var h = '<p class="bmx-howref"><button type="button" class="tk2-how" data-how>Show me how</button> to use this tab.</p>';
      if(isSplit()){
        h += '<h3 class="ls-h">The split-brain test</h3><ul class="ls-steps">' +
          '<li><span><b>Each visual field goes to the opposite hemisphere.</b> Looking at the dot, everything to its left reaches the right hemisphere first, through both eyes (half of each optic nerve crosses at the optic chiasm).</span></li>' +
          '<li><span><b>The corpus callosum</b> normally shares it at once. Surgeons cut it in a few people with severe epilepsy to stop seizures spreading.</span></li>' +
          '<li><span><b>Speech</b> is in the left hemisphere for most people, so a split-brain patient can name only what the left hemisphere saw.</span></li>' +
          '<li><span><b>Each hand is run by the opposite hemisphere</b>, so the left hand can find by touch what only the right hemisphere saw, even while the patient says they saw nothing.</span></li>' +
          '<li><span>Roger Sperry and Michael Gazzaniga showed this from the 1960s. The word flashes for about a tenth of a second, too fast for the eyes to move. In everyday life the patients function well: moving their eyes sends what they see to both sides.</span></li>' +
          '<li class="psy-myth"><span>The hemispheres specialize, but everyone uses both, all the time. There are no “left-brained” or “right-brained” people.</span></li></ul>' +
          '<p class="ls-sub">Each flash uses the next word from: ' + esc(B.OBJECTS.join(', ')) + '. The trays hold the objects out of sight.</p>';
      } else {
        h += '<h3 class="ls-h">' + (view === 'outside' ? 'The outside: the left hemisphere, seen from the left' : 'The inside: the brain cut down the middle') + '</h3>' +
          '<p>' + (view === 'outside' ? 'Front is on the left. The four lobes keep one color each (frontal blue, parietal yellow, temporal green, occipital purple); language is drawn on the left, as it is for most people.' :
            'Front is on the left: the inner surface of the right hemisphere after the brain is cut between the hemispheres. The hippocampus, amygdala and reward center are not on the cut surface: they lie deeper, to the side, and are drawn see-through where they would be.') + '</p>' +
          '<p class="ls-sub">Areas work together in networks, and their borders vary from person to person: a color marks where a job is mostly done, not the only place it happens. After damage, other areas can take over some jobs (plasticity), especially in children.</p>' +
          '<h3 class="ls-h">Every structure</h3><p class="ls-sub">Lobes</p><ul class="bm-list">' + list('lobe') + '</ul><p class="ls-sub">Areas of the cortex</p><ul class="bm-list">' + list('area') + '</ul>' +
          '<p class="ls-sub">Below the cortex</p><ul class="bm-list">' + list('deep') + list('link') + '</ul><p class="ls-sub">Hindbrain and brainstem</p><ul class="bm-list">' + list('stem') + '</ul>' +
          '<h3 class="ls-h">What lights up during a task (fMRI)</h3><ul class="bm-list">' + B.ACTIVE.map(function(a){ return '<li>Participants ' + esc(a.task) + ': <b>' + esc(R[a.region].name) + '</b>' + (a.side ? ' (' + a.side + ' hemisphere)' : '') + '.</li>'; }).join('') + '</ul>' +
          '<h3 class="ls-h">How we study the brain</h3><ul class="bm-list">' + Object.keys(B.METHODS).map(function(k){ return '<li><b>' + esc(B.METHODS[k].long) + '</b>: ' + esc(B.METHODS[k].does) + '</li>'; }).join('') + '</ul>' +
          '<p class="psy-myth">The hemispheres specialize, but everyone uses both, all the time. There are no “left-brained” or “right-brained” people, and we use far more than 10% of the brain.</p>' +
          '<p class="ls-sub">Named cases: Phineas Gage (Harlow, 1868); H.M. (Scoville and Milner, 1957), whose surgery removed parts of both medial temporal lobes, including most of both hippocampi; S.M. (Feinstein and colleagues, 2011), with damage to the amygdala on both sides. The drawing is a simplified illustration. Test yourself asks about damage cases, imaging methods and fMRI, split brain, one side of the body and naming a structure.</p>';
      }
      ref.innerHTML = h;
    }
    ref.addEventListener('click', function(e){ if(e.target.closest('[data-how]')){ if(LS && LS.close) LS.close(); setTimeout(startTour, 280); } });

    /* --------------------------------------------------- resize */
    var rz = 0;
    function relayout(){
      if(!onScreen && !LS) return;
      var ch = fit();
      if(isSplit()){ if(ch) drawSplit(); }
      else { if(ch) drawBrain(); if(spots[view]) spots[view].place(); }
      // a new frame moves the pins in picture units: place the cue again from scratch, not just its old point
      if(cue && cue.active()) makeCue();
      taps.forEach(function(t){ t.place(); });
    }
    function resized(){ clearTimeout(rz); rz = setTimeout(relayout, 60); }
    window.addEventListener('resize', resized);
    if(window.ResizeObserver){ new ResizeObserver(resized).observe(scene); }

    function shown(m){
      onScreen = m === 'explore';
      if(!onScreen){ var was = !!S.run; stopRun(false); if(S.field && (was || S.stage)) frameAt(S.field, S.cut, 9); hideCue(false); [tour, tourSplit].forEach(function(t){ if(t.active()) t.stop(); }); clearTimeout(ft); clearTimeout(rz); return; }
      setTimeout(function(){ relayout(); makeCue(); }, 40);
      setTimeout(function(){ if(onScreen && cue && cue.active()) makeCue(); }, 700);   // once more when the page has settled
    }
    function ready(s){
      LS = s; setTab(tabV, false); refHtml();
      setTimeout(function(){ relayout(); }, 30);
    }
    if(!T.studioOf || !T.studioOf(host)){ host.appendChild(stage); setTimeout(function(){ setTab(tabV, false); onScreen = true; }, 0); }
    var api = { stage: stage, ref: ref, shown: shown, ready: ready,
      tab: function(v){ if(v === undefined) return tabV; setTab(v, false); },
      pick: function(id){ var sp = spots[view]; return sp ? sp.pick(id, 'set') : null; },
      damage: function(on){ if(on === undefined) return dmg; if(!!on !== dmg){ dbtn.click(); } },
      flash: flash, cut: function(on){ if(on === undefined) return S.cut; if(!!on !== S.cut) toggleCut(); },
      frameAt: function(t){ frameAt(S.field || 'left', S.cut, t); }, running: function(){ return !!S.run; },
      // the frame check: stop any run and draw the flash of this field at time t (seconds)
      _seek: function(field, t){ stopRun(false); if(S.field !== field){ S.field = field; } frameAt(field, S.cut, t); }, _dur: DUR,
      _spots: function(){ return spots[view]; }, _regAt: regAt, _G: G, _L: function(){ return L; }, _px: function(){ return px; }, _t: function(){ return { tx: TX, ty: TY, px: px }; }, _cue: function(){ cueDone = false; makeCue(); return !!(cue && cue.active()); }, _view: function(){ return view; } };
    window.BrainMapExplore = api;   // for the sweep and frame checks (scripts/tools-v2/brain-map-*.mjs)
    return api;
  }

  /* ======================================================= TEST YOURSELF */
  function quiz(host, data){
    T.drill(host, data, { slug: 'brain-map', noun: 'drill',
      generate: function(r, ctx, type){ return B.generate(r, ctx, type); },
      types: [{ value: 'lesion', label: 'Damage cases' }, { value: 'imaging', label: 'Methods and fMRI' }, { value: 'split', label: 'Split brain' }, { value: 'contra', label: 'One side of the body' }, { value: 'locate', label: 'Name the structure' }],
      typeLabel: 'Kind of problem',
      title: function(p){ return { lesion: 'Which region?', imaging: 'Studying the brain', split: 'A split-brain trial', contra: 'A one-sided stroke', locate: 'Name the structure' }[p.type] || 'Practice problem'; },
      extra: function(el, p, api){ api.fig = el; api.st = {}; figure(el, p, api.st); },
      onStep: function(s, right, api){ api.st[s.key] = true; figure(api.fig, api.problem, api.st); }
    });
  }
  /* The drill's figure, drawn by the same art. Nothing is highlighted or named before it is answered (a "locate"
     problem highlights the structure it asks about). */
  var figN = 0;
  function figure(el, p, st, wReal){
    st = st || {};
    var g = p.figure; if(!g){ el.innerHTML = ''; return; }
    var phone = (window.innerWidth || 1280) <= 640, wpx = wReal || (phone ? 330 : 600), inner, vb, label;
    // the words are sized in screen px: once the figure is on the page, draw it again at its real width
    if(!wReal) requestAnimationFrame(function(){ var sv = el.querySelector('svg'), w = sv && sv.getBoundingClientRect().width; if(w && Math.abs(w - wpx) / wpx > 0.08 && el.contains(sv)) figure(el, p, st, w); });
    var pid = 'bmq' + (++figN);
    if(g.kind === 'brain'){
      var known = g.show === 'before' || st.region || st.where || st.name || st.side;
      var sel = g.show === 'before' || known ? g.region : null, view = G[g.view] && G[g.view].reg[g.region] ? g.view : 'outside';
      var named = st.name || st.region || st.where;
      var mirror = g.side === 'right', bodyOn = !!g.side && known && (g.region === 'motor' || g.region === 'somatosensory');
      inner = brainSvg(view, { pid: pid, sel: sel, glow: g.glow && known, mirror: mirror, body: bodyOn ? g.region : null, dmg: bodyOn && p.type === 'contra', px: wpx / VW, labels: named ? [{ id: g.region, text: R[g.region].name }] : [] });
      vb = '0 0 ' + VW + ' ' + VH;
      label = (view === 'outside' ? (mirror ? 'The right hemisphere seen from the right, front on the right.' : 'The left hemisphere seen from the left, front on the left.') : 'The brain cut down the middle, front on the left.') + (sel ? ' One structure is highlighted' + (named ? ': ' + R[g.region].name + '.' : '.') : '');
    } else {
      var Ls = splitLay(phone), stage = st.hand ? 9 : st.says ? 2.9 : st.hemi ? 1.9 : -1;
      inner = splitSvg(Ls, { pid: pid, px: wpx / Ls.W, object: g.object });
      vb = '0 0 ' + Ls.W + ' ' + Ls.H;
      label = 'A split-brain test seen from above: the word ' + g.object + ' flashes in the ' + g.field + ' visual field; the corpus callosum is ' + (g.cut ? 'cut' : 'intact') + '.';
      el.innerHTML = '<figure class="cd-fig bm-qfig"><svg class="bm-qsvg" data-ls-text="keep" viewBox="' + vb + '" preserveAspectRatio="xMidYMid meet" role="img" aria-label="' + esc(label) + '">' + inner + '</svg></figure>';
      staticSplit(el.querySelector('svg'), Ls, g, stage, wpx / Ls.W);
      return;
    }
    el.innerHTML = '<figure class="cd-fig bm-qfig"><svg class="bm-qsvg" data-ls-text="keep" viewBox="' + vb + '" preserveAspectRatio="xMidYMid meet" role="img" aria-label="' + esc(label) + '">' + inner + '</svg></figure>';
  }
  /* a Test yourself split-brain figure at one moment: the word in its field, then (as steps are answered) the
     hemisphere that got it, what was said, which hand found it */
  function staticSplit(svg, L, g, t, px){
    var E = {}; svg.querySelectorAll('[data-sb]').forEach(function(e){ E[e.getAttribute('data-sb')] = e; });
    var sb = B.splitBrain(g.field, g.cut), to = sb.first, other = to === 'left' ? 'right' : 'left';
    var w = L.word[g.field];
    E.word.setAttribute('opacity', '1'); E.word.setAttribute('transform', 'translate(' + r1(w[0]) + ' ' + r1(w[1]) + ')');
    E.word.querySelector('text').textContent = g.object.toUpperCase();
    var gap = L.cc[2] * 0.16;
    if(g.cut){ E['cc-a'].setAttribute('transform', 'translate(' + r1(-gap) + ' 0)'); E['cc-b'].setAttribute('transform', 'translate(' + r1(gap) + ' 0)'); E.snip.setAttribute('opacity', '1'); }
    E['cclab-t'].firstChild.textContent = g.cut ? 'Corpus callosum: cut' : 'Corpus callosum: intact';
    if(t >= 1.9){ E['glow-' + to].setAttribute('opacity', '.85'); [0, 1].forEach(function(i){ E['nerve-' + g.field + '-' + i].classList.add('is-on'); }); if(!g.cut){ E['glow-' + other].setAttribute('opacity', '.85'); E.cross.setAttribute('opacity', '.9'); } else E.block.setAttribute('opacity', '1'); }
    if(t >= 2.9){ E.bub.setAttribute('opacity', '1'); E.bub.querySelector('text').textContent = sb.says ? '“' + g.object.charAt(0).toUpperCase() + g.object.slice(1) + '!”' : '“I saw nothing.”'; E.bub.classList.toggle('is-no', !sb.says); }
    if(t >= 9){
      ['left', 'right'].forEach(function(h){
        var has = h === 'left' ? sb.leftHand : sb.rightHand; if(!has || (g.hand && g.hand !== 'both' && g.hand !== h)) return;
        var z = L.reach[h], a = L.hand[h], x = a[0] + (z[0] - a[0]) * 0.3, y = a[1] + (z[1] - a[1]) * 0.3;
        E['hand-' + h].setAttribute('transform', 'translate(' + r1(x) + ' ' + r1(y) + ')'); E['armp-' + h].setAttribute('d', armD(L, h, x, y)); var pk = E['tray-' + h].querySelector('[data-pick]'); if(pk) pk.style.opacity = '0';
        E['hold-' + h].innerHTML = objSvg(g.object, 0, 0, L.tall ? 30 : 24, 'sb-held'); E['hold-' + h].setAttribute('opacity', '1'); E['mot-' + h].classList.add('is-on');
      });
    }
    // pills round the labels need the rendered text: measure once the figure is in the page
    requestAnimationFrame(function(){ svg.querySelectorAll('.sb-pill-g').forEach(function(gr){ var tx = gr.querySelector('text'), rc = gr.querySelector('rect'); try{ var bb = tx.getBBox(), pd = 6 / px; rc.setAttribute('x', r1(bb.x - pd * 1.6)); rc.setAttribute('y', r1(bb.y - pd)); rc.setAttribute('width', r1(bb.width + pd * 3.2)); rc.setAttribute('height', r1(bb.height + pd * 2)); rc.setAttribute('rx', r1((bb.height + pd * 2) / 2)); }catch(e){} }); });
  }
})();
