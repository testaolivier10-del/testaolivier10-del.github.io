/* Brain map trainer page (docs/appsych-spec.md section 6). OWNED BY THIS TOOL
   ONLY (builder T2). Mounts into #app with ApPsychTools.mount; the model is
   ApPsychMath.brainMap (psychology/assets/tools/math/brain-map.js), the
   content psychology/data/tools/brain-map.json (served filtered as
   assets/tool-data/brain-map.json). The frame is ApPsychTools.modes
   (Explore, then Test yourself) on the Tool Studio.

   Explore: two scenes (the Scene switch):
     Map         an illustrated brain in two views: Outside (the left
                 hemisphere seen from the left: lobes, motor and
                 somatosensory strips, Broca's and Wernicke's areas,
                 auditory and visual cortex, cerebellum, pons, medulla) and
                 Inside (the right hemisphere's inner surface, the brain cut
                 down the middle: corpus callosum, thalamus, hypothalamus,
                 pituitary, brainstem with the reticular activating system,
                 cerebellum, and the hippocampus, amygdala and reward center
                 drawn dashed, as seen through the tissue). Tap a structure
                 (or its label) to see what it does; "If it is damaged" hatches
                 it and says what changes; selecting the motor or
                 somatosensory strip shows the side of the body it serves
                 (contralateral control). More options: labels (key parts,
                 all, none), browse every structure by name, and light up a
                 task as an fMRI scan would.
     Split brain a person seen from above, a word flashed to one visual
                 field, the corpus callosum intact or cut: the word reaches
                 the opposite hemisphere, crosses or not, the patient names it
                 or not (speech is usually in the left hemisphere), and the
                 hand run by the hemisphere that has it finds the object.
   Lobes keep one color in both views (frontal blue, parietal amber,
   temporal green, occipital purple; Okabe-Ito based, lighter in dark mode);
   the selected structure is the course cerulean. Labels sit in bands above
   and below the picture with leader lines, so they never cover the
   anatomy, and are sized in screen pixels at every width.
   Reduced motion: Flash the word shows the end state at once.
   Test yourself: ApPsychTools.drill over the model's generate(); the
   figure never shows an answer before its step is answered. */
(function(){
  'use strict';
  var T = window.ApPsychTools, M = window.ApPsychMath, P = window.ApPsychPlot;
  if(!T || !M || !M.brainMap || M.brainMap.stub) return;
  var B = M.brainMap, R = B.REGIONS, esc = T.esc, uidB = 0;
  function r1(v){ return Math.round(v * 10) / 10; }
  function lc(s){ return s.charAt(0).toLowerCase() + s.slice(1); }

  /* ----------------------------------------------------------- geometry */
  /* Catmull-Rom through points -> a smooth SVG path (closed or open). */
  function smooth(pts, closed){
    var n = pts.length, d = 'M' + r1(pts[0][0]) + ' ' + r1(pts[0][1]);
    var at = function(i){ return closed ? pts[(i + n) % n] : pts[Math.max(0, Math.min(n - 1, i))]; };
    for(var i = 0; i < (closed ? n : n - 1); i++){
      var p0 = at(i - 1), p1 = at(i), p2 = at(i + 1), p3 = at(i + 2);
      var c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6], c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
      d += ' C' + r1(c1[0]) + ' ' + r1(c1[1]) + ' ' + r1(c2[0]) + ' ' + r1(c2[1]) + ' ' + r1(p2[0]) + ' ' + r1(p2[1]);
    }
    return d + (closed ? 'Z' : '');
  }
  function poly(pts){ return 'M' + pts.map(function(p){ return r1(p[0]) + ' ' + r1(p[1]); }).join(' L') + 'Z'; }
  /* A tapered ribbon around a center line (hippocampus). */
  function ribbon(pts, w0, w1){
    var L = [], Rr = [], n = pts.length;
    for(var i = 0; i < n; i++){
      var a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy) || 1;
      var w = (w0 + (w1 - w0) * i / (n - 1)) / 2, nx = -dy / len * w, ny = dx / len * w;
      L.push([pts[i][0] + nx, pts[i][1] + ny]); Rr.unshift([pts[i][0] - nx, pts[i][1] - ny]);
    }
    return smooth(L.concat(Rr), true);
  }
  function ell(cx, cy, rx, ry, rot){ var o = []; for(var i = 0; i < 24; i++){ var a = i / 24 * Math.PI * 2, x = Math.cos(a) * rx, y = Math.sin(a) * ry, c = Math.cos(rot || 0), s = Math.sin(rot || 0); o.push([cx + x * c - y * s, cy + x * s + y * c]); } return o; }
  var DEG = Math.PI / 180;

  // The hemisphere's silhouette (the same outline in both views).
  var CER = 'M122 410 C92 330 105 230 185 165 C265 100 380 68 500 70 C640 72 770 120 855 215 C915 285 935 370 912 425 C895 465 850 488 790 505 C740 520 700 548 640 568 C560 592 430 590 350 565 C290 545 258 510 256 478 C255 460 262 452 268 448 C230 442 180 440 150 432 C132 426 124 420 122 410Z';
  var LF = [[268, 448], [320, 432], [380, 416], [440, 402], [500, 390], [560, 375], [610, 358], [640, 340], [655, 318]];
  var CS = [[540, 60], [532, 115], [518, 160], [512, 205], [500, 250], [485, 295], [470, 340], [458, 385], [452, 398]];
  var PO = [[815, 150], [800, 250], [785, 330], [775, 380], [768, 440], [765, 520]];
  var TP = [[655, 318], [700, 340], [740, 362], [775, 380]];
  function lfY(x){ for(var i = 1; i < LF.length; i++) if(x <= LF[i][0]) return LF[i - 1][1] + (x - LF[i - 1][0]) * (LF[i][1] - LF[i - 1][1]) / (LF[i][0] - LF[i - 1][0]); return LF[LF.length - 1][1]; }
  function shift(pts, dx){ return pts.map(function(p){ var x = p[0] + dx, y = p[1]; return [x, Math.min(y, lfY(x) - 4)]; }); }
  var PRE = shift(CS, -54), POST = shift(CS, 54);
  var OUT = {
    frontal: poly([[0, 0], [545, 0]].concat(CS, [[440, 402], [380, 416], [320, 432], [268, 448], [250, 470], [0, 470]])),
    parietal: poly([[545, 0], [830, 0], [815, 150], [800, 250], [785, 330], [775, 380], [740, 362], [700, 340], [655, 318], [640, 340], [610, 358], [560, 375], [500, 390]].concat(CS.slice().reverse())),
    occipital: poly([[830, 0], [1000, 0], [1000, 720], [765, 720]].concat(PO.slice().reverse())),
    temporal: poly([[0, 470], [250, 470]].concat(LF, TP.slice(1), [[768, 440], [765, 520], [765, 720], [0, 720]])),
    prefrontal: poly([[0, 0], [420, 0], [410, 90], [392, 180], [370, 270], [345, 350], [320, 430], [0, 470]]),
    motor: smooth(CS.concat(PRE.slice().reverse()), true),
    somatosensory: smooth(CS.concat(POST.slice().reverse()), true),
    broca: smooth(ell(352, 384, 46, 27, -14 * DEG), true),
    wernicke: smooth(ell(630, 383, 50, 25, -20 * DEG), true),
    auditory: smooth(ell(498, 418, 52, 14, -13 * DEG), true),
    visual: smooth(ell(900, 420, 42, 56, 10 * DEG), true),
    cerebellum: 'M655 560 C640 520 700 500 780 503 C860 506 920 520 925 565 C930 615 880 660 800 668 C720 676 668 640 655 600 C650 585 650 572 655 560Z',
    stem: 'M592 556 C566 584 563 626 585 650 C596 668 598 694 600 720 L652 720 C652 692 654 668 664 650 C678 626 674 584 656 558Z'
  };
  var CC = [[356, 292], [370, 250], [424, 222], [500, 208], [580, 206], [650, 214], [708, 232], [748, 260], [758, 290], [744, 316], [716, 320], [698, 300], [652, 268], [590, 252], [520, 250], [462, 256], [424, 272], [402, 298], [406, 330], [390, 344], [364, 332]];
  var CING = [[338, 250], [372, 198], [440, 172], [530, 160], [620, 165], [690, 180], [742, 198]];
  var POM = [[805, 150], [790, 205], [770, 255], [748, 298], [730, 330]];
  var CALC = [[730, 330], [780, 355], [840, 385], [910, 410]];
  var IN = {
    frontal: poly([[0, 0], [560, 0], [548, 70], [532, 130], [520, 165], [440, 172], [372, 198], [338, 250], [330, 300], [345, 345], [330, 400], [300, 440], [0, 470]]),
    parietal: poly([[560, 0], [830, 0], [805, 150], [790, 205], [770, 255], [748, 298], [742, 198], [690, 180], [620, 165], [530, 160], [520, 165], [532, 130], [548, 70]]),
    occipital: poly([[830, 0], [1000, 0], [1000, 520], [800, 510], [745, 430], [730, 330], [748, 298], [770, 255], [790, 205], [805, 150]]),
    visual: smooth([[730, 310], [780, 332], [840, 360], [915, 384], [915, 434], [840, 410], [780, 380], [730, 352]], true),
    callosum: smooth(CC, true),
    thalamus: smooth(ell(578, 330, 60, 34, -8 * DEG), true),
    hypothalamus: smooth(ell(492, 382, 36, 23, 18 * DEG), true),
    pituitary: smooth(ell(466, 448, 20, 14, 0), true),
    amygdala: smooth(ell(440, 484, 21, 15, -10 * DEG), true),
    hippocampus: ribbon([[462, 480], [500, 472], [540, 460], [575, 446], [602, 428], [618, 408]], 30, 16),
    reward: smooth(ell(418, 384, 18, 13, 0), true),
    cerebellum: smooth([[680, 520], [692, 480], [740, 460], [810, 465], [870, 490], [905, 535], [900, 590], [860, 635], [790, 655], [720, 640], [685, 600], [672, 560]], true),
    stem: smooth([[566, 360], [552, 400], [554, 440], [560, 462], [542, 482], [538, 522], [552, 552], [578, 564], [588, 600], [596, 660], [600, 720], [652, 720], [654, 660], [660, 600], [668, 562], [674, 520], [668, 470], [662, 430], [650, 395], [630, 368], [600, 354]], true),
    ras: 'M628 712 C625 640 620 560 614 480 C608 420 596 388 578 362'
  };
  var ARBOR = ['M690 560 C730 556 770 552 800 548', 'M760 552 C790 530 820 505 845 492', 'M790 549 C830 540 865 540 885 548', 'M780 552 C815 575 850 595 870 610', 'M745 556 C770 590 790 615 805 635', 'M720 558 C730 590 740 612 748 628', 'M735 555 C760 520 780 495 790 478', 'M800 548 C830 520 860 515 880 520', 'M820 565 C845 585 860 610 865 625'];
  /* where each structure's leader line points (view: [x, y]) */
  var ANCHOR = {
    outside: { frontal: [290, 230], parietal: [680, 205], temporal: [430, 500], occipital: [855, 300], prefrontal: [220, 330], motor: [476, 200], somatosensory: [552, 205], broca: [352, 384], wernicke: [630, 383], auditory: [498, 418], visual: [905, 430], cerebellum: [810, 615], pons: [582, 625], medulla: [622, 700] },
    inside: { frontal: [230, 260], parietal: [660, 115], occipital: [880, 300], visual: [860, 398], callosum: [600, 232], thalamus: [585, 330], hypothalamus: [492, 382], pituitary: [466, 450], hippocampus: [548, 456], amygdala: [440, 486], reward: [418, 384], cerebellum: [820, 560], pons: [556, 520], medulla: [628, 650], ras: [618, 560] }
  };
  var KEY = { outside: ['frontal', 'parietal', 'temporal', 'occipital', 'cerebellum', 'medulla'], inside: ['callosum', 'thalamus', 'hypothalamus', 'pituitary', 'hippocampus', 'amygdala', 'cerebellum', 'pons', 'medulla'] };
  var IN_VIEW = { outside: Object.keys(ANCHOR.outside), inside: Object.keys(ANCHOR.inside) };
  var LOBE = { frontal: 'f', parietal: 'p', temporal: 't', occipital: 'o', prefrontal: 'f', motor: 'f', broca: 'f', somatosensory: 'p', wernicke: 't', auditory: 't', visual: 'o' };
  var SHORT = { somatosensory: 'Somatosensory', reticular: 'RAS', ras: 'Reticular activating system' };
  function nameOf(k){ return R[k].name; }

  /* Text width in px (canvas), for the label layout. */
  var MEAS = null;
  function textW(t, size, weight){
    try{
      if(!MEAS) MEAS = document.createElement('canvas').getContext('2d');
      MEAS.font = (weight || 800) + ' ' + size + 'px ' + ((getComputedStyle(document.body).getPropertyValue('--font-ui') || '').trim() || 'sans-serif');
      return MEAS.measureText(String(t)).width;
    }catch(e){ return String(t).length * size * 0.58; }
  }

  /* The brain in one view, sized for a box of pxW x pxH screen pixels.
     o: { view, sel, damage, task (region lit by fMRI), labels: 'key' |
     'all' | 'none' | [ids], mirror, tap, body (show the body inset), fs (px),
     id }. Returns { svg (inner), vb: [x, y, w, h], label } */
  function brainArt(pxW, pxH, o){
    var view = o.view || 'outside', id = o.id || ('bm' + (++uidB)), sel = o.sel, mir = !!o.mirror, FS = o.fs || 13;
    var X0 = 40, X1 = 960, Y0 = 50, Y1 = 722, bw = X1 - X0;
    var scale = Math.min(pxW / bw, pxH / (Y1 - Y0 + 80)), fs = FS / scale, pad = 7 / scale, rowH = fs * 2.1;
    var mx = function(x){ return mir ? 1000 - x : x; };
    var g = [], A = ANCHOR[view];
    var S = view === 'outside' ? OUT : IN;
    var tapA = function(k){ return o.tap && A[k] ? ' data-r="' + k + '"' : ''; };
    var cls = function(k, base){ return base + (sel === k ? ' is-sel' : '') + (o.task === k ? ' is-task' : ''); };
    var art = [];
    art.push('<defs><clipPath id="' + id + 'C"><path d="' + CER + '"/></clipPath>' +
      '<pattern id="' + id + 'H" width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="9" height="9" class="bm-hatch-bg"/><line x1="0" y1="0" x2="0" y2="9" class="bm-hatch"/></pattern>' +
      '<radialGradient id="' + id + 'F"><stop offset="0" class="bm-fmri0"/><stop offset=".45" class="bm-fmri1"/><stop offset="1" class="bm-fmri2"/></radialGradient>' +
      '<linearGradient id="' + id + 'G" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="bm-tissue0"/><stop offset="1" class="bm-tissue1"/></linearGradient></defs>');
    // stem and cerebellum first (the cerebrum overlaps them)
    if(view === 'outside'){
      var stemClipP = id + 'P', stemClipM = id + 'Q';
      art.push('<clipPath id="' + stemClipP + '"><rect x="0" y="0" width="1000" height="648"/></clipPath><clipPath id="' + stemClipM + '"><rect x="0" y="648" width="1000" height="200"/></clipPath>');
      art.push('<path class="' + cls('pons', 'bm-r bm-stem') + '"' + tapA('pons') + ' clip-path="url(#' + stemClipP + ')" d="' + S.stem + '"/>');
      art.push('<path class="' + cls('medulla', 'bm-r bm-stem bm-med') + '"' + tapA('medulla') + ' clip-path="url(#' + stemClipM + ')" d="' + S.stem + '"/>');
      art.push('<path class="bm-edge" d="' + S.stem + '"/><path class="bm-gyrus" d="M572 648 C590 652 640 652 664 648"/>');
      art.push('<g class="' + cls('cerebellum', 'bm-r bm-cbl') + '"' + tapA('cerebellum') + '><path d="' + S.cerebellum + '"/>' + [540, 562, 584, 606, 628, 648].map(function(y, i){ return '<path class="bm-folia" d="M' + (662 + i * 3) + ' ' + y + ' C720 ' + (y - 14 + i * 2) + ' 840 ' + (y - 18 + i * 3) + ' ' + (918 - i * 8) + ' ' + (y - 4 + i * 2) + '"/>'; }).join('') + '</g>');
    } else {
      art.push('<g class="' + cls('cerebellum', 'bm-r bm-cbl') + '"' + tapA('cerebellum') + '><path d="' + S.cerebellum + '"/>' + ARBOR.map(function(d, i){ return '<path class="bm-arbor" stroke-width="' + (i === 0 ? 9 : 5) + '" d="' + d + '"/>'; }).join('') + '</g>');
      art.push('<path class="bm-vent" d="M676 470 L700 500 L680 520 Z"/>');
    }
    // the cerebrum: tissue, lobes, areas, sulci, all clipped to the outline
    art.push('<path class="bm-tissue" d="' + CER + '" fill="url(#' + id + 'G)"/>');
    art.push('<g clip-path="url(#' + id + 'C)">');
    ['frontal', 'parietal', 'temporal', 'occipital'].forEach(function(k){ if(S[k]) art.push('<path class="' + cls(k, 'bm-r bm-lobe bm-' + LOBE[k]) + '"' + tapA(k) + ' d="' + S[k] + '"/>'); });
    if(view === 'outside'){
      ['prefrontal', 'motor', 'somatosensory', 'auditory', 'wernicke', 'broca', 'visual'].forEach(function(k){ art.push('<path class="' + cls(k, 'bm-r bm-area bm-' + LOBE[k]) + '"' + tapA(k) + ' d="' + S[k] + '"/>'); });
      // sulci and gyri: the folds that make it read as a brain
      [CS, LF].forEach(function(L){ art.push('<path class="bm-sulcus" d="' + smooth(L) + '"/>'); });
      art.push('<path class="bm-sulcus is-thin" d="' + smooth(PRE) + '"/><path class="bm-sulcus is-thin" d="' + smooth(POST) + '"/>');
      [[[420, 125], [350, 140], [280, 170], [215, 215]], [[400, 300], [330, 298], [262, 308], [190, 330]], [[580, 255], [650, 240], [720, 250], [790, 285]],
       [[300, 490], [400, 468], [500, 452], [600, 430], [690, 418], [752, 398]], [[350, 540], [460, 524], [570, 506], [690, 488]], [[815, 320], [862, 350]], [[808, 450], [880, 462]], [[170, 398], [236, 394]],
       [[440, 130], [430, 200], [405, 260]], [[620, 120], [700, 150], [760, 200]], [[230, 250], [180, 290]]].forEach(function(L){ art.push('<path class="bm-gyrus" d="' + smooth(L) + '"/>'); });
    } else {
      art.push('<path class="' + cls('visual', 'bm-r bm-area bm-o') + '"' + tapA('visual') + ' d="' + S.visual + '"/>');
      [POM, CALC, CING].forEach(function(L){ art.push('<path class="bm-sulcus" d="' + smooth(L) + '"/>'); });
      [[[548, 60], [535, 120], [520, 160]], [[230, 200], [300, 168]], [[200, 300], [262, 280]], [[640, 120], [700, 140], [745, 165]], [[260, 400], [310, 380]], [[820, 470], [880, 470]], [[300, 210], [330, 175]]].forEach(function(L){ art.push('<path class="bm-gyrus" d="' + smooth(L) + '"/>'); });
      // the deep middle: corpus callosum, fornix, thalamus, hypothalamus
      art.push('<path class="bm-core" d="M340 300 C360 360 420 420 470 440 C540 470 620 470 680 440 C720 420 750 360 740 300 C700 260 600 250 500 255 C420 260 360 270 340 300Z"/>');
      art.push('<path class="' + cls('callosum', 'bm-r bm-cc') + '"' + tapA('callosum') + ' d="' + S.callosum + '"/>');
      art.push('<path class="bm-fornix" d="M706 304 C650 282 570 276 512 300 C488 314 478 336 476 362"/>');
      art.push('<path class="' + cls('thalamus', 'bm-r bm-deep0') + '"' + tapA('thalamus') + ' d="' + S.thalamus + '"/>');
      art.push('<path class="' + cls('hypothalamus', 'bm-r bm-deep0 bm-hyp') + '"' + tapA('hypothalamus') + ' d="' + S.hypothalamus + '"/>');
      art.push('<path class="bm-stalk" d="M478 402 C474 414 470 424 468 436"/><ellipse class="bm-chiasm" cx="440" cy="410" rx="15" ry="7"/>');
      art.push('<path class="' + cls('pituitary', 'bm-r bm-deep0 bm-pit') + '"' + tapA('pituitary') + ' d="' + S.pituitary + '"/>');
    }
    art.push('</g><path class="bm-outline" d="' + CER + '"/>');
    if(view === 'inside'){
      // the brainstem (midbrain, pons, medulla) is cut down the middle too:
      // drawn over the cerebrum, then what runs in it
      art.push('<path class="bm-r bm-stem bm-mid" d="' + S.stem + '"/>');
      art.push('<clipPath id="' + id + 'S"><path d="' + S.stem + '"/></clipPath>');
      art.push('<g clip-path="url(#' + id + 'S)"><rect class="' + cls('pons', 'bm-r bm-stem') + '"' + tapA('pons') + ' x="500" y="466" width="200" height="98"/><rect class="' + cls('medulla', 'bm-r bm-stem bm-med') + '"' + tapA('medulla') + ' x="500" y="564" width="200" height="160"/></g>');
      art.push('<path class="bm-edge" d="' + S.stem + '"/><path class="bm-gyrus" d="M540 470 C580 462 640 462 672 470 M548 562 C590 568 640 568 668 562"/>');
      art.push('<path class="' + cls('ras', 'bm-r bm-ras') + '"' + tapA('ras') + ' d="' + S.ras + '"/>');
      if(sel === 'reward' || o.task === 'reward') art.push('<path class="bm-da" d="M598 440 C560 420 500 398 438 388"/><path class="bm-da-h" d="M446 382 L434 388 L447 394"/>');
      ['reward', 'amygdala', 'hippocampus'].forEach(function(k){ art.push('<path class="' + cls(k, 'bm-r bm-seen') + '"' + tapA(k) + ' d="' + S[k] + '"/>'); });
    }
    // damage and fMRI overlays on the selected structure
    var shapeOf = function(k){ return k === 'pons' || k === 'medulla' ? null : S[k] || null; };
    if(o.damage && sel && shapeOf(sel)) art.push('<path class="bm-damage"' + (view === 'outside' || sel === 'visual' || /frontal|parietal|occipital/.test(sel) ? ' clip-path="url(#' + id + 'C)"' : '') + ' d="' + shapeOf(sel) + '" fill="url(#' + id + 'H)"/>');
    if(o.damage && sel && !shapeOf(sel) && A[sel]){
      if(view === 'outside') art.push('<path class="bm-damage" clip-path="url(#' + id + (sel === 'pons' ? 'P' : 'Q') + ')" d="' + S.stem + '" fill="url(#' + id + 'H)"/>');
      else art.push('<g clip-path="url(#' + id + 'S)"><rect class="bm-damage" x="500" y="' + (sel === 'pons' ? 466 : 564) + '" width="200" height="' + (sel === 'pons' ? 98 : 160) + '" fill="url(#' + id + 'H)"/></g>');
    }
    if(o.task && A[o.task]){ var ta = A[o.task]; art.push('<circle class="bm-fmri" cx="' + ta[0] + '" cy="' + ta[1] + '" r="' + (o.task === 'amygdala' || o.task === 'reward' ? 40 : 66) + '" fill="url(#' + id + 'F)"/>'); }
    // the body inset: contralateral control (outside view, motor or touch strip)
    var inner = '<g' + (mir ? ' transform="translate(1000 0) scale(-1 1)"' : '') + '>' + art.join('') + '</g>';
    // the body inset (not mirrored): the side of the body this strip serves
    if(o.body && (sel === 'motor' || sel === 'somatosensory') && view === 'outside'){
      var side = mir ? 'left' : 'right', bx = mir ? 870 : 130;
      inner += bodyInset(bx, 590, side, fs);
      inner += '<text class="bm-body-t" x="' + (mir ? X1 - 4 : X0 + 4) + '" y="' + r1(706) + '" text-anchor="' + (mir ? 'end' : 'start') + '" font-size="' + r1(fs * 0.95) + '">' + (sel === 'motor' ? 'Moves' : 'Feels') + ' the ' + side + ' side</text>';
    }
    // front marker
    var ftx = mir ? X1 - 4 : X0 + 4;
    inner += '<text class="bm-front" x="' + r1(ftx) + '" y="' + r1(Y0 + fs * 0.6) + '" text-anchor="' + (mir ? 'end' : 'start') + '" font-size="' + r1(fs * 0.9) + '">' + (mir ? 'Front →' : '← Front') + '</text>';
    // labels in bands above and below, with leader lines
    var ids = o.labels === 'none' ? [] : o.labels === 'all' ? IN_VIEW[view].slice() : Array.isArray(o.labels) ? o.labels.slice() : KEY[view].slice();
    ids = ids.filter(function(k){ return A[k]; });
    if(sel && A[sel] && ids.indexOf(sel) < 0) ids.push(sel);
    if(o.task && A[o.task] && ids.indexOf(o.task) < 0) ids.push(o.task);
    var lay = layoutLabels(ids, A, mx, fs, pad, rowH, X0, X1, Y0, Y1, scale, o);
    var vbTop = Y0 - lay.topH - (lay.topH ? fs * 0.6 : 0), vbBot = Y1 + lay.botH + (lay.botH ? fs * 0.3 : 0);
    // fill the box: grow the viewBox to the box's shape, content centered
    var vw = bw, vh = vbBot - vbTop, want = vw * pxH / pxW;
    if(want > vh){ var extra = (want - vh) / 2; vbTop -= extra; vbBot += extra; vh = want; }
    else { var wantW = vh * pxW / pxH; X0 -= (wantW - vw) / 2; vw = wantW; }
    inner += lay.svg;
    var label = (view === 'outside' ? (mir ? 'The right hemisphere seen from the right, front on the right.' : 'The left hemisphere seen from the left, front on the left.') : 'The brain cut down the middle: the inner surface of the right hemisphere, front on the left. Deep structures are drawn dashed.') +
      (sel ? ' Selected: ' + nameOf(sel) + '.' : '') + (o.damage && sel ? ' Shown damaged.' : '') + (o.task ? ' Lit up: ' + nameOf(o.task) + '.' : '') + (ids.length ? ' Labels: ' + ids.map(nameOf).join(', ') + '.' : '');
    return { svg: inner, vb: [X0, vbTop, vw, vh], label: label, scale: scale };
  }
  /* Rows of label pills above (anchors high) and below (anchors low). */
  function layoutLabels(ids, A, mx, fs, pad, rowH, X0, X1, Y0, Y1, scale, o){
    var top = [], bot = [], out = [];
    ids.forEach(function(k){ var a = A[k], it = { k: k, ax: mx(a[0]), ay: a[1], w: textW(shortName(k), Math.round(fs * scale), 800) / scale + pad * 2 }; (a[1] < 380 ? top : bot).push(it); });
    function rows(list, enlGap){
      list.sort(function(a, b){ return a.ax - b.ax; });
      var rs = [[]], width = function(r){ return r.reduce(function(s, x){ return s + x.w + pad; }, 0); };
      list.forEach(function(it){ var r = rs[rs.length - 1]; if(width(r) + it.w > (X1 - X0) - (enlGap || 0)) rs.push([it]); else r.push(it); });
      rs.forEach(function(r){
        var lo = X0, hi = X1 - (enlGap || 0);
        r.forEach(function(it){ it.x = Math.max(lo, Math.min(hi - it.w, it.ax - it.w / 2)); lo = it.x + it.w + pad; });
        for(var i = r.length - 1; i >= 0; i--){ var lim = i === r.length - 1 ? hi : r[i + 1].x - pad; if(r[i].x + r[i].w > lim) r[i].x = lim - r[i].w; }
      });
      return rs.filter(function(r){ return r.length; });
    }
    var tr = rows(top, 0), br = rows(bot, 56 / scale);
    var topH = tr.length * rowH, botH = br.length * rowH;
    function draw(rs, isTop){
      rs.forEach(function(r, ri){
        var y = isTop ? Y0 - topH + ri * rowH + rowH * 0.5 : Y1 + ri * rowH + rowH * 0.62;
        r.forEach(function(it){
          var cx = it.x + it.w / 2, ey = isTop ? y + fs * 0.62 : y - fs * 0.62, on = o.sel === it.k;
          out.push('<path class="bm-lead' + (on ? ' is-sel' : '') + '" d="M' + r1(cx) + ' ' + r1(ey) + ' L' + r1(it.ax) + ' ' + r1(it.ay) + '"/><circle class="bm-dot' + (on ? ' is-sel' : '') + '" cx="' + r1(it.ax) + '" cy="' + r1(it.ay) + '" r="' + r1(3.2 / scale) + '"/>');
          out.push('<g class="bm-lab' + (on ? ' is-sel' : '') + (o.task === it.k ? ' is-task' : '') + '"' + (o.tap ? ' data-r="' + it.k + '" role="button" tabindex="0" aria-label="' + esc(nameOf(it.k)) + (on ? ', selected' : '') + '"' : '') + '><rect x="' + r1(it.x) + '" y="' + r1(y - fs * 0.95) + '" width="' + r1(it.w) + '" height="' + r1(fs * 1.75) + '" rx="' + r1(fs * 0.875) + '"/><text x="' + r1(cx) + '" y="' + r1(y + fs * 0.34) + '" text-anchor="middle" font-size="' + r1(fs) + '">' + esc(shortName(it.k)) + '</text></g>');
        });
      });
    }
    draw(tr, true); draw(br, false);
    // leaders first so pills sit on top of them
    var leads = out.filter(function(s){ return /bm-lead|bm-dot/.test(s); }), pills = out.filter(function(s){ return !/bm-lead|bm-dot/.test(s); });
    return { svg: leads.join('') + pills.join(''), topH: topH, botH: botH };
  }
  function shortName(k){ return k === 'ras' ? 'Reticular activating system' : k === 'somatosensory' ? 'Somatosensory cortex' : nameOf(k); }
  /* A person seen from behind, one side lit. */
  function bodyInset(cx, cy, side, fs){
    var s = 0.9, g = [];
    var half = function(sgn){ return 'M' + cx + ' ' + (cy - 92 * s) + ' a' + (18 * s) + ' ' + (18 * s) + ' 0 0 ' + (sgn > 0 ? 1 : 0) + ' 0 ' + (36 * s) + ' Z' +
      'M' + cx + ' ' + (cy - 52 * s) + ' h' + (sgn * 26 * s) + ' q' + (sgn * 10 * s) + ' 0 ' + (sgn * 12 * s) + ' ' + (10 * s) + ' l' + (sgn * 14 * s) + ' ' + (62 * s) + ' l' + (-sgn * 10 * s) + ' ' + (3 * s) + ' l' + (-sgn * 14 * s) + ' ' + (-48 * s) + ' v' + (64 * s) + ' l' + (sgn * 6 * s) + ' ' + (70 * s) + ' h' + (-sgn * 14 * s) + ' l' + (-sgn * 14 * s) + ' ' + (-62 * s) + ' Z'; };
    var lit = side === 'right' ? 1 : -1;
    g.push('<g class="bm-body"><path class="bm-body-off" d="' + half(-lit) + '"/><path class="bm-body-on" d="' + half(lit) + '"/></g>');
    g.push('<text class="bm-body-lr" x="' + (cx - 46 * s) + '" y="' + (cy + 8) + '" text-anchor="middle" font-size="' + r1(fs * 0.85) + '">L</text><text class="bm-body-lr" x="' + (cx + 46 * s) + '" y="' + (cy + 8) + '" text-anchor="middle" font-size="' + r1(fs * 0.85) + '">R</text>');
    return g.join('');
  }

  /* The split-brain scene, seen from above. o: { field, cut, object, stage:
     0 setup, 1 word reached its hemisphere, 2 crossed (or not), 3 speech,
     4 hands; hand: 'left' | 'right' | 'both', fs, px } */
  function splitArt(pxW, pxH, o){
    var W = 1000, H = 1000, g = [], st = o.stage || 0, sb = B.splitBrain(o.field, o.cut);
    var scale = Math.min(pxW / W, pxH / H), fs = (o.fs || 13) / scale;
    var cx = 500, cy = 560, hx = 232, hy = 255, hemi = sb.first, sg = function(side){ return side === 'left' ? -1 : 1; };
    var lit = function(side){ return st >= 1 && (side === hemi || (st >= 2 && !o.cut)); };
    // the screen, the fixation dot and the word
    var sy = 36, sh = 120, wx = o.field === 'left' ? 300 : 700;
    g.push('<rect class="sb-screen" x="110" y="' + sy + '" width="780" height="' + sh + '" rx="16"/><circle class="sb-fix" cx="' + cx + '" cy="' + (sy + sh / 2) + '" r="7"/>');
    g.push('<text class="sb-scr-t" x="126" y="' + r1(sy + sh - 12) + '" font-size="' + r1(fs * 0.8) + '">left visual field</text><text class="sb-scr-t" x="874" y="' + r1(sy + sh - 12) + '" text-anchor="end" font-size="' + r1(fs * 0.8) + '">right visual field</text>');
    g.push('<line class="sb-mid" x1="' + cx + '" y1="' + (sy + 10) + '" x2="' + cx + '" y2="' + (sy + sh - 10) + '"/>');
    g.push('<text class="sb-word' + (st >= 1 ? ' is-on' : '') + '" x="' + wx + '" y="' + r1(sy + sh / 2 + fs * 0.55) + '" text-anchor="middle" font-size="' + r1(fs * 1.7) + '">' + esc(o.object.toUpperCase()) + '</text>');
    // hemisphere names above the head
    ['left', 'right'].forEach(function(side){ var lx = cx + sg(side) * 380; g.push('<text class="sb-hl' + (lit(side) ? ' is-on' : '') + '" x="' + lx + '" y="' + r1(cy - 120) + '" text-anchor="middle" font-size="' + r1(fs * 1.05) + '"><tspan x="' + lx + '">' + (side === 'left' ? 'Left' : 'Right') + '</tspan><tspan x="' + lx + '" dy="' + r1(fs * 1.25) + '">hemisphere</tspan></text>'); });
    // the head from above, nose toward the screen
    var top = cy - hy, bot = cy + hy;
    g.push('<path class="sb-head" d="M' + cx + ' ' + top + ' C' + (cx + hx * 0.9) + ' ' + top + ' ' + (cx + hx) + ' ' + (cy - hy * 0.4) + ' ' + (cx + hx) + ' ' + cy + ' C' + (cx + hx) + ' ' + (cy + hy * 0.75) + ' ' + (cx + hx * 0.6) + ' ' + bot + ' ' + cx + ' ' + bot + ' C' + (cx - hx * 0.6) + ' ' + bot + ' ' + (cx - hx) + ' ' + (cy + hy * 0.75) + ' ' + (cx - hx) + ' ' + cy + ' C' + (cx - hx) + ' ' + (cy - hy * 0.4) + ' ' + (cx - hx * 0.9) + ' ' + top + ' ' + cx + ' ' + top + 'Z"/>');
    g.push('<path class="sb-nose" d="M' + (cx - 24) + ' ' + (top + 6) + ' L' + cx + ' ' + (top - 30) + ' L' + (cx + 24) + ' ' + (top + 6) + '"/>');
    g.push('<ellipse class="sb-ear" cx="' + (cx - hx - 9) + '" cy="' + cy + '" rx="15" ry="32"/><ellipse class="sb-ear" cx="' + (cx + hx + 9) + '" cy="' + cy + '" rx="15" ry="32"/>');
    var hem = function(side){ var s2 = sg(side), x0 = cx + s2 * 16, x1 = cx + s2 * (hx - 30); return 'M' + x0 + ' ' + (top + 70) + ' C' + x1 + ' ' + (top + 56) + ' ' + (x1 + s2 * 8) + ' ' + (cy - 40) + ' ' + x1 + ' ' + (cy + 60) + ' C' + (x1 - s2 * 8) + ' ' + (bot - 66) + ' ' + (cx + s2 * 80) + ' ' + (bot - 26) + ' ' + x0 + ' ' + (bot - 30) + ' Z'; };
    ['left', 'right'].forEach(function(side){ g.push('<path class="sb-hemi' + (lit(side) ? ' is-on' : '') + '" d="' + hem(side) + '"/>'); });
    // the corpus callosum between them
    var c0 = cy - 150, c1 = cy + 120;
    g.push('<rect class="sb-cc' + (o.cut ? ' is-cut' : st >= 2 ? ' is-on' : '') + '" x="' + (cx - 13) + '" y="' + c0 + '" width="26" height="' + (c1 - c0) + '" rx="10"/>');
    if(o.cut) g.push('<path class="sb-cut" d="M' + (cx - 30) + ' ' + (cy - 30) + ' L' + (cx + 30) + ' ' + (cy - 14) + ' M' + (cx - 30) + ' ' + (cy - 12) + ' L' + (cx + 30) + ' ' + (cy + 4) + '"/>');
    // speech lives in the left hemisphere
    var bx = cx - 130;
    g.push('<g class="sb-speech-badge"><rect x="' + r1(bx - fs * 2.4) + '" y="' + r1(cy - 120) + '" width="' + r1(fs * 4.8) + '" height="' + r1(fs * 1.6) + '" rx="' + r1(fs * 0.8) + '"/><text x="' + bx + '" y="' + r1(cy - 120 + fs * 1.12) + '" text-anchor="middle" font-size="' + r1(fs * 0.85) + '">speech</text></g>');
    // eyes and the optic pathway: from each eye to the hemisphere opposite the field
    var ey = top + 46, eL = cx - 64, eR = cx + 64, tgt = cx + sg(hemi) * 118, back = bot - 70;
    g.push('<circle class="sb-eye" cx="' + eL + '" cy="' + ey + '" r="15"/><circle class="sb-eye" cx="' + eR + '" cy="' + ey + '" r="15"/>');
    if(st >= 1){
      g.push('<path class="sb-path is-out" d="M' + wx + ' ' + (sy + sh) + ' L' + eL + ' ' + (ey - 15) + ' M' + wx + ' ' + (sy + sh) + ' L' + eR + ' ' + (ey - 15) + '"/>');
      var near = hemi === 'left' ? eL : eR, far = hemi === 'left' ? eR : eL, side = cx + sg(hemi) * 70;
      g.push('<path class="sb-path" d="M' + near + ' ' + (ey + 15) + ' C' + near + ' ' + (ey + 80) + ' ' + side + ' ' + (ey + 120) + ' ' + side + ' ' + (cy + 20) + ' S' + tgt + ' ' + (back - 40) + ' ' + tgt + ' ' + back + '"/>');
      g.push('<path class="sb-path" d="M' + far + ' ' + (ey + 15) + ' C' + far + ' ' + (ey + 60) + ' ' + cx + ' ' + (ey + 70) + ' ' + side + ' ' + (ey + 130) + '"/>');
      g.push('<path class="sb-arrow" d="M' + (tgt - 12) + ' ' + (back - 16) + ' L' + tgt + ' ' + back + ' L' + (tgt + 12) + ' ' + (back - 16) + '"/>');
    }
    if(st >= 2 && !o.cut){ var dir = sg(hemi) * -1; g.push('<path class="sb-cross" d="M' + (cx - dir * 80) + ' ' + (cy + 60) + ' L' + (cx + dir * 80) + ' ' + (cy + 60) + '"/><path class="sb-cross-h" d="M' + (cx + dir * 80 - dir * 16) + ' ' + (cy + 48) + ' L' + (cx + dir * 80) + ' ' + (cy + 60) + ' L' + (cx + dir * 80 - dir * 16) + ' ' + (cy + 72) + '"/>'); }
    ['left', 'right'].forEach(function(side){ if(lit(side)) g.push('<text class="sb-has" x="' + (cx + sg(side) * 140) + '" y="' + r1(cy + 10) + '" text-anchor="middle" font-size="' + r1(fs * 1.25) + '">' + esc(o.object) + '</text>'); });
    g.push('<text class="sb-tk sb-cc-t" x="' + (cx - 26) + '" y="' + r1(cy + 80) + '" text-anchor="end" font-size="' + r1(fs * 0.8) + '"><tspan x="' + (cx - 26) + '">corpus</tspan><tspan x="' + (cx - 26) + '" dy="' + r1(fs * 0.95) + '">callosum' + (o.cut ? ' (cut)' : '') + '</tspan></text>');
    // hands, each wired to the opposite hemisphere, the wires leaving the head's sides
    var hyp = 880;
    ['left', 'right'].forEach(function(side){
      var s2 = sg(side), hxp = cx + s2 * 390, has = side === 'left' ? sb.leftHand : sb.rightHand, show = st >= 4 && (o.hand === 'both' || o.hand === side);
      var fx = cx - s2 * 110;
      g.push('<path class="sb-wire' + (show && has ? ' is-on' : '') + '" d="M' + fx + ' ' + (bot - 60) + ' C' + fx + ' ' + (bot + 30) + ' ' + hxp + ' ' + (bot - 10) + ' ' + hxp + ' ' + (hyp - 60) + '"/>');
      g.push('<path class="sb-hand' + (show ? (has ? ' is-yes' : ' is-no') : '') + '" d="M' + (hxp - 38) + ' ' + (hyp + 10) + ' C' + (hxp - 44) + ' ' + (hyp - 40) + ' ' + (hxp - 28) + ' ' + (hyp - 58) + ' ' + hxp + ' ' + (hyp - 58) + ' C' + (hxp + 28) + ' ' + (hyp - 58) + ' ' + (hxp + 44) + ' ' + (hyp - 40) + ' ' + (hxp + 38) + ' ' + (hyp + 10) + ' Z"/>');
      g.push('<text class="sb-tk" x="' + hxp + '" y="' + r1(hyp + 10 + fs * 1.3) + '" text-anchor="middle" font-size="' + r1(fs * 0.9) + '">' + (side === 'left' ? 'Left hand' : 'Right hand') + '</text>');
      if(show) g.push('<text class="sb-find' + (has ? ' is-yes' : ' is-no') + '" x="' + hxp + '" y="' + r1(hyp + 10 + fs * 2.5) + '" text-anchor="middle" font-size="' + r1(fs * 0.95) + '">' + (has ? 'finds the ' + esc(o.object) : 'cannot find it') + '</text>');
    });
    // what the patient says, under the head
    if(st >= 3){
      var said = sb.says ? '“' + o.object.charAt(0).toUpperCase() + o.object.slice(1) + '.”' : '“I saw nothing.”';
      var bw2 = textW(said, Math.round(fs * scale * 1.05), 800) / scale + fs * 2, by = bot + fs * 1.4;
      g.push('<g class="sb-bubble' + (sb.says ? ' is-yes' : ' is-no') + '"><rect x="' + r1(cx - bw2 / 2) + '" y="' + r1(by) + '" width="' + r1(bw2) + '" height="' + r1(fs * 2.2) + '" rx="' + r1(fs * 1.1) + '"/><text x="' + cx + '" y="' + r1(by + fs * 1.45) + '" text-anchor="middle" font-size="' + r1(fs * 1.05) + '">' + esc(said) + '</text></g>');
    }
    return { svg: g.join(''), vb: [0, 0, W, H], scale: scale };
  }

  /* ------------------------------------------------------------ mount */
  T.mount('brain-map', function(app, data){
    var ex = null;
    T.modes(app, { slug: 'brain-map',
      explore: function(host){ ex = explore(host, data); },
      quiz: function(host){ quiz(host, data); },
      onShow: function(m){ if(m !== 'explore' && ex) ex.stop(); },
      studio: { explore: function(pane, s){ ex.studio(pane, s); } } });
  });

  function hintSlot(s, target, text, before){
    if(!target) return;
    var slot = document.createElement('div');
    slot.className = 'bm-tipslot'; slot.setAttribute('aria-hidden', 'true');
    (before || target).parentNode.insertBefore(slot, before || target);
    var h = s.hint({ target: target, text: text });
    if(!h){ slot.remove(); return; }
    var EV = ['pointerdown', 'keydown', 'input', 'change'];
    function done(e){ if(e && e.type === 'keydown' && (e.key === 'Tab' || e.key === 'Shift')) return; slot.remove(); EV.forEach(function(t){ s.root.removeEventListener(t, done, true); }); if(h.place) h.place(); }
    EV.forEach(function(t){ s.root.addEventListener(t, done, true); });
    if(h.place) h.place();
  }

  /* ------------------------------------------------------------ explore */
  var TASKS = B.ACTIVE;
  function explore(host, data){
    var scene = 'map', view = 'outside', sel = null, damage = false, labels = 'key', task = '', mirror = false;
    var field = 'left', cut = true, obj = 'key', stage = 0, anim = null, LS = null, touched = false, nid = T.nid('bm');
    function $(q){ return host.querySelector(q) || (LS ? LS.root.querySelector(q) : null); }
    host.innerHTML = '<section class="bt-problem bm-card" aria-labelledby="' + nid + '-h"><h2 id="' + nid + '-h" class="sr-only">Brain map</h2>' +
      '<div class="bm-fig"><svg class="bm-svg" role="group" xmlns="http://www.w3.org/2000/svg"></svg></div>' +
      '<div class="bm-ctl">' +
        '<div class="ls-seg bm-scenes" role="group" aria-label="Scene"><button type="button" data-s="map" aria-pressed="true">Map</button><button type="button" data-s="split" aria-pressed="false">Split brain</button></div>' +
        '<div class="bm-grp bm-grp-map"><div class="ls-seg bm-views" role="group" aria-label="View"><button type="button" data-v="outside" aria-pressed="true">Outside</button><button type="button" data-v="inside" aria-pressed="false">Inside</button></div>' +
          '<div class="bm-go"><button type="button" class="bt-btn bm-dmg" aria-pressed="false" disabled>If it is damaged</button></div></div>' +
        '<div class="bm-grp bm-grp-split" hidden><div class="ls-seg bm-fields" role="group" aria-label="Flash the word to the"><button type="button" data-f="left" aria-pressed="true">Left field</button><button type="button" data-f="right" aria-pressed="false">Right field</button></div>' +
          '<div class="ls-seg bm-cuts" role="group" aria-label="Corpus callosum"><button type="button" data-c="cut" aria-pressed="true">Callosum cut</button><button type="button" data-c="intact" aria-pressed="false">Intact</button></div>' +
          '<div class="bm-go"><button type="button" class="btn-press sm ls-btn ls-pri bm-flash">Flash the word</button></div></div>' +
      '</div>' +
      '<div class="bm-say"></div>' +
      T.moreHtml('<div class="bm-more"></div>', 'labels, every structure, fMRI tasks') +
      '<div class="bm-nums"></div><p class="sr-only bm-live"></p></section>';
    var say = T.announcer($('.bm-live'));
    var cue = T.cue('Tap a part of the brain to see what it does.');
    $('.bm-ctl').insertBefore(cue.el, $('.bm-ctl').firstChild);
    function act(){ if(!touched){ touched = true; cue.done(); } }
    var svg = $('.bm-svg');
    var sLab = T.choiceSelect({ label: 'Labels', options: [{ value: 'key', label: 'Key parts' }, { value: 'all', label: 'Every structure in this view' }, { value: 'none', label: 'None (quiz yourself)' }], value: labels, onChange: function(v){ act(); labels = v; draw(); } });
    var sBrowse = T.choiceSelect({ label: 'Find a structure', options: [{ value: '', label: 'Choose one...' }].concat(B.ORDER.map(function(k){ return { value: k, label: nameOf(k) }; }).sort(function(a, b){ return a.label.localeCompare(b.label); })), value: '', onChange: function(v){ if(!v) return; act(); task = ''; sTask.set(''); pick(v, true); } });
    var sTask = T.choiceSelect({ label: 'Light up a task (as fMRI would)', options: [{ value: '', label: 'No task' }].concat(TASKS.map(function(t){ return { value: t.id, label: t.task.charAt(0).toUpperCase() + t.task.slice(1) }; })), value: '', onChange: function(v){ act(); setTask(v); } });
    var sObj = T.choiceSelect({ label: 'Word to flash', options: B.OBJECTS.map(function(x){ return { value: x, label: x }; }), value: obj, onChange: function(v){ act(); obj = v; stage = 0; stop(); draw(); words(); } });
    [sLab, sBrowse, sTask].forEach(function(c){ c.el.classList.add('bm-map-opt'); $('.bm-more').appendChild(c.el); });
    sObj.el.classList.add('bm-split-opt'); $('.bm-more').appendChild(sObj.el);

    function viewFor(k){ var v = R[k].view; return v === 'both' ? view : v; }
    function pick(k, fromList){
      if(!k){ sel = null; damage = false; }
      else {
        if(sel === k && !fromList){ sel = null; damage = false; }
        else { sel = k; damage = false; var v = viewFor(k); if(v !== view){ view = v; mirror = false; } }
      }
      sync(); draw(); words();
      if(sel) say(nameOf(sel) + '. ' + R[sel].does);
      var el = sel && svg.querySelector('.bm-lab[data-r="' + sel + '"]'); if(el && !fromList) el.focus();
    }
    function setTask(id){
      task = id; var t = TASKS.filter(function(x){ return x.id === id; })[0];
      if(t){ sel = t.region; damage = false; view = R[t.region].view === 'inside' ? 'inside' : 'outside'; mirror = t.side === 'right'; }
      else mirror = false;
      sync(); draw(); words();
      if(t) say('fMRI while participants ' + t.task + ': the ' + lc(nameOf(t.region)) + ' lights up.');
    }
    function onClick(e){
      var b;
      if((b = e.target.closest('.bm-scenes button'))){ act(); stop(); scene = b.getAttribute('data-s'); sync(); draw(); words(); return; }
      if((b = e.target.closest('.bm-views button'))){ act(); var v = b.getAttribute('data-v'); if(v !== view){ view = v; mirror = false; task = ''; sTask.set(''); if(sel && R[sel].view !== 'both' && R[sel].view !== v){ sel = null; damage = false; } sync(); draw(); words(); say(v === 'outside' ? 'Outside view: the left side of the brain.' : 'Inside view: the brain cut down the middle.'); } return; }
      if((b = e.target.closest('.bm-dmg'))){ act(); if(!sel) return; damage = !damage; sync(); draw(); words(); if(damage) say('Damage to the ' + lc(nameOf(sel)) + ': ' + R[sel].damage); return; }
      if((b = e.target.closest('.bm-fields button'))){ act(); stop(); field = b.getAttribute('data-f'); stage = 0; sync(); draw(); words(); return; }
      if((b = e.target.closest('.bm-cuts button'))){ act(); stop(); cut = b.getAttribute('data-c') === 'cut'; stage = 0; sync(); draw(); words(); return; }
      if(e.target.closest('.bm-flash')){ act(); flash(); return; }
      var r = e.target.closest('[data-r]');
      if(r && svg.contains(r)){ act(); task = ''; sTask.set(''); pick(r.getAttribute('data-r')); }
    }
    function onKey(e){ var r = e.target.closest && e.target.closest('.bm-lab[data-r]'); if(r && (e.key === 'Enter' || e.key === ' ')){ e.preventDefault(); act(); pick(r.getAttribute('data-r')); } }
    host.addEventListener('click', onClick); host.addEventListener('keydown', onKey);
    function sync(){
      var root = LS ? LS.root : host;
      var press = function(sel2, attr, val){ root.querySelectorAll(sel2).forEach(function(b){ b.setAttribute('aria-pressed', String(b.getAttribute(attr) === val)); }); };
      press('.bm-scenes button', 'data-s', scene); press('.bm-views button', 'data-v', view); press('.bm-fields button', 'data-f', field); press('.bm-cuts button', 'data-c', cut ? 'cut' : 'intact');
      var gm = $('.bm-grp-map'), gs = $('.bm-grp-split'); if(gm) gm.hidden = scene !== 'map'; if(gs) gs.hidden = scene !== 'split';
      root.querySelectorAll('.bm-map-opt').forEach(function(x){ x.hidden = scene !== 'map'; }); root.querySelectorAll('.bm-split-opt').forEach(function(x){ x.hidden = scene !== 'split'; });
      var d = $('.bm-dmg'); if(d){ d.disabled = !sel; d.setAttribute('aria-pressed', String(damage)); d.textContent = sel ? (damage ? 'Show it healthy' : 'If it is damaged') : 'Tap a part first'; }
      sBrowse.set(sel || '');
      if(LS && LS.setupRow) LS.setupRow.setup(scene === 'map' ? (task ? 'fMRI: ' + TASKS.filter(function(t){ return t.id === task; })[0].task : labels === 'key' ? 'Key labels' : labels === 'all' ? 'Every label' : 'No labels') : 'Word: ' + obj);
    }
    function stop(){ if(anim){ anim.stop(); anim = null; } var b = $('.bm-flash'); if(b) b.textContent = stage >= 4 ? 'Flash again' : 'Flash the word'; }
    function flash(){
      if(anim){ stop(); return; }
      stage = 0; var secs = 4.5;
      anim = P.loop(function(dt, t){ var s2 = Math.min(4, Math.floor(t / secs * 5)); if(s2 !== stage){ stage = s2; draw(); words(); } return t < secs; }, { duration: secs, still: function(){ stage = 4; draw(); }, onEnd: function(){ stage = 4; anim = null; stop(); draw(); words(); say(splitLine()); } });
      var b = $('.bm-flash'); if(b) b.textContent = 'Pause';
      anim.start();
    }

    function splitLine(){
      var sb = B.splitBrain(field, cut), h = sb.first;
      if(stage < 1) return 'The word will flash in the ' + field + ' visual field.';
      if(stage < 3) return 'The ' + field + ' visual field goes to the ' + h + ' hemisphere' + (cut ? ', and the cut corpus callosum keeps it there.' : ', and the corpus callosum shares it.');
      return (sb.says ? 'The patient says “' + obj + '.”' : 'The patient says they saw nothing.') + ' The ' + (sb.leftHand && sb.rightHand ? 'both hands find' : sb.leftHand ? 'left hand finds' : 'right hand finds') + ' the ' + obj + (sb.leftHand && sb.rightHand ? '.' : ' by touch.');
    }
    function words(){
      var head, sub = '', why = '';
      if(scene === 'map'){
        var t = task && TASKS.filter(function(x){ return x.id === task; })[0];
        if(t){ head = 'fMRI while participants ' + t.task + ': the ' + lc(nameOf(t.region)) + ' becomes more active' + (t.side ? ' (in the ' + t.side + ' hemisphere)' : '') + '.'; sub = R[t.region].does; }
        else if(sel){ head = nameOf(sel) + ': ' + R[sel].does; sub = damage ? 'If it is damaged: ' + R[sel].damage : (R[sel].deep ? 'Deep inside the brain, drawn dashed as if seen through.' : (sel === 'motor' || sel === 'somatosensory') ? 'Contralateral: the left hemisphere serves the right side of the body.' : ''); }
        else { head = view === 'outside' ? 'The left side of the brain. Tap a part to see what it does.' : 'The brain cut down the middle. Tap a part to see what it does.'; sub = 'Switch to ' + (view === 'outside' ? 'Inside for the corpus callosum, thalamus and the limbic system.' : 'Outside for the lobes and the language areas.'); }
        why = mapWhy();
      } else {
        head = splitLine();
        sub = stage >= 4 ? (cut ? 'The hemispheres specialize; with the corpus callosum cut, each keeps what it sees.' : 'With the corpus callosum intact, both hemispheres share the word.') : 'Choose a field, then Flash the word.';
        why = splitWhy();
      }
      T.explain($('.bm-say'), '<b>' + esc(head) + '</b>' + (sub ? ' ' + esc(sub) : ''), why);
      nums();
      if(LS){
        LS.caption('<b>' + esc(head) + '</b>' + (sub ? ' ' + esc(sub) : ''), 'explore');
        if(scene === 'map'){
          LS.pills([{ html: view === 'outside' ? (mirror ? 'Right side' : 'Left side') : 'Inside', tone: 'readout' }], 'left', 'explore');
          LS.pills(sel ? [{ html: esc(shortName(sel)), tone: damage ? 'bad' : 'accent' }] : [], 'right', 'explore');
        } else {
          var sb = B.splitBrain(field, cut);
          LS.pills([{ html: cut ? 'Corpus callosum cut' : 'Corpus callosum intact', tone: 'readout' }], 'left', 'explore');
          LS.pills(stage >= 3 ? [{ html: sb.says ? 'Names it' : 'Cannot name it', tone: sb.says ? 'good' : 'warn' }] : [], 'right', 'explore');
        }
      }
    }
    function mapWhy(){
      return '<ul class="ls-steps"><li><b>Four lobes</b> on each side: frontal (planning, movement, speech), parietal (touch and space), temporal (hearing and language), occipital (vision).</li>' +
        '<li><b>Contralateral control.</b> Each hemisphere moves and feels the opposite side of the body: the motor strip is just in front of the central sulcus, the somatosensory strip just behind it.</li>' +
        '<li><b>Language</b> usually sits in the left hemisphere: Broca’s area produces speech, Wernicke’s area understands it.</li>' +
        '<li><b>Below the cortex</b>: the thalamus relays the senses, the hypothalamus keeps the body in balance and controls the pituitary, the hippocampus stores new memories, the amygdala handles fear.</li>' +
        '<li><b>The brainstem</b> keeps you alive (the medulla: heartbeat and breathing) and awake (the reticular activating system); the cerebellum coordinates movement.</li>' +
        '<li><b>Plasticity.</b> After damage, other areas can take over some functions, especially in children.</li>' +
        '<li class="psy-myth">The hemispheres specialize, but everyone uses both, all the time. There are no “left-brained” or “right-brained” people.</li></ul>';
    }
    function splitWhy(){
      return '<ul class="ls-steps"><li><b>Each visual field goes to the opposite hemisphere.</b> Look at a dot: everything to its left reaches the right hemisphere first, and everything to its right the left hemisphere.</li>' +
        '<li><b>The corpus callosum</b> normally shares it at once. Surgeons cut it in a few people with severe epilepsy to stop seizures spreading.</li>' +
        '<li><b>Speech</b> is usually in the left hemisphere, so a split-brain patient can name only what the left hemisphere sees.</li>' +
        '<li><b>Each hand is run by the opposite hemisphere</b>, so the left hand can find by touch what only the right hemisphere saw, even when the patient says they saw nothing.</li>' +
        '<li>Roger Sperry and Michael Gazzaniga’s split-brain studies (from the 1960s) showed this; in everyday life the patients function well.</li></ul>';
    }
    function nums(){
      var el = $('.bm-nums'); if(!el) return;
      var list = function(group){ return B.ORDER.filter(function(k){ return R[k].group === group; }).map(function(k){ return '<li><b>' + esc(nameOf(k)) + '</b>: ' + esc(R[k].does) + '</li>'; }).join(''); };
      el.innerHTML = '<h3 class="ls-title-l">Every structure</h3><p class="bt-small">Lobes</p><ul class="bm-list">' + list('lobe') + '</ul><p class="bt-small">Areas of the cortex</p><ul class="bm-list">' + list('area') + '</ul><p class="bt-small">Below the cortex</p><ul class="bm-list">' + list('deep') + list('link') + '</ul><p class="bt-small">Hindbrain and brainstem</p><ul class="bm-list">' + list('stem') + '</ul>' +
        '<h3 class="ls-title-l">How we study the brain</h3><ul class="bm-list">' + Object.keys(B.METHODS).map(function(k){ return '<li><b>' + esc(B.METHODS[k].long) + '</b>: ' + esc(B.METHODS[k].does) + '</li>'; }).join('') + '</ul>' +
        '<p class="bt-small">The drawing is a simplified illustration; area borders vary from person to person.</p>';
    }

    function size(){ var rc = $('.bm-fig').getBoundingClientRect(); return [Math.max(280, Math.round(rc.width) || 640), Math.max(280, Math.round(rc.height) || 480)]; }
    function draw(){
      var wh = size(), out;
      if(scene === 'map') out = brainArt(wh[0], wh[1], { view: view, sel: sel, damage: damage, task: task ? TASKS.filter(function(t){ return t.id === task; })[0].region : null, labels: labels, mirror: mirror, tap: true, body: true, id: 'bmx', fs: wh[0] < 560 ? 12.5 : 14 });
      else out = splitArt(wh[0], wh[1], { field: field, cut: cut, object: obj, stage: stage, hand: 'both', fs: wh[0] < 560 ? 12.5 : 14 });
      svg.setAttribute('viewBox', out.vb.map(r1).join(' '));
      svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
      svg.innerHTML = out.svg;
      svg.setAttribute('aria-label', scene === 'map' ? out.label + ' Tap a structure or its label.' : 'A person seen from above, looking at a dot on a screen. The word ' + obj + ' flashes in the ' + field + ' visual field. ' + (cut ? 'The corpus callosum is cut. ' : 'The corpus callosum is intact. ') + splitLine());
    }

    function studio(pane, s){
      LS = s;
      var sp = T.studioPane(pane, s, { stage: [$('.bm-fig')], dock: [$('.bm-ctl')], setup: 'Settings', moreLabel: 'Labels, every structure, fMRI tasks', why: [$('.bm-say')], details: [$('.bm-nums')] });
      s.root.addEventListener('click', onClick); s.root.addEventListener('keydown', onKey);
      host.removeEventListener('click', onClick); host.removeEventListener('keydown', onKey);
      LS.setupRow = sp;
      sync(); draw(); words();
      if(s.mode() === 'explore') hintSlot(s, s.root.querySelector('.bm-lab[data-r="frontal"]') || s.root.querySelector('.bm-fig'), 'Start here: tap a part of the brain');
      if(window.ResizeObserver){ var t = null; new ResizeObserver(function(){ clearTimeout(t); t = setTimeout(function(){ draw(); }, 60); }).observe($('.bm-fig')); }
      try{ new MutationObserver(function(){ draw(); }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] }); }catch(e){}
    }
    sync(); draw(); words();
    return { stop: stop, studio: studio };
  }

  /* ------------------------------------------------------ test yourself */
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
  /* The drill's figure. Nothing is highlighted or labeled before it is
     answered (a "locate" problem highlights the structure it asks about). */
  function figure(el, p, st){
    st = st || {};
    var g = p.figure; if(!g){ el.innerHTML = ''; return; }
    var phone = (window.innerWidth || 1280) <= 640, Wd = phone ? 340 : 620, H = phone ? 300 : 440, out;
    if(g.kind === 'brain'){
      var known = g.show === 'before' || st.region || st.where || st.name;
      var sel = g.show === 'before' || known ? g.region : null;
      out = brainArt(Wd, H, { view: g.view, sel: sel, task: g.glow && known ? g.region : null, labels: st.name || st.region || st.where ? [g.region] : 'none', mirror: g.side === 'right', body: !!g.side && known, id: 'bmq', fs: phone ? 11.5 : 13 });
    } else {
      var stage = st.hand ? 4 : st.says ? 3 : st.hemi ? 2 : 0;
      out = splitArt(Wd, H, { field: g.field, cut: g.cut, object: g.object, stage: stage, hand: g.hand, fs: phone ? 11.5 : 13 });
    }
    el.innerHTML = '<figure class="cd-fig bm-qfig"><svg class="bm-svg" viewBox="' + out.vb.map(r1).join(' ') + '" preserveAspectRatio="xMidYMid meet" role="img" aria-label="' + esc(g.kind === 'brain' ? out.label || 'A brain' : 'A split-brain patient seen from above; the word flashes in the ' + g.field + ' visual field.') + '">' + out.svg + '</svg></figure>';
  }
})();
