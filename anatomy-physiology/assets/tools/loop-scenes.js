/* LevlPrep A&P: feedback loop scenes (tool review 2026-11,
   docs/tool-review/anatomy-physiology.md, feedback loop builder FIX).

   "Watch it work" drew the same seven boxes for every loop, so nothing showed
   the body doing it. Each loop now also gets a small drawing of the place in
   the body that answers: skin vessels narrowing and a muscle shivering for
   cold, the uterus with the head pressing on the cervix for labor, the heart
   and arteries for the baroreceptor reflex, the parathyroids, bone, kidney and
   gut for calcium, and so on. 18 drawings serve the 49 loops; LOOPS picks the
   drawing and its words for each loop.

   The drawing reacts to the live loop (feedback-loops.js mountLive):
     --fs-v      how far the variable is off its set point, 0..1 (CSS var)
     is-on       the stimulus is there (the variable is off)
     is-act      the signal has reached the effector: it is acting
   Motion is CSS; prefers-reduced-motion shows the acting state still.
   Loaded on demand by feedback-loops.js (window.AnpLoopScenes). */
(function(){
  'use strict';
  function esc(s){ return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function T(x, y, s, cls, anchor){ return '<text x="' + x + '" y="' + y + '" class="fs-t' + (cls ? ' ' + cls : '') + '"' + (anchor ? ' text-anchor="' + anchor + '"' : '') + '>' + esc(s) + '</text>'; }
  // a small arrow along a straight line, head at the end
  function A(x1, y1, x2, y2, cls){
    var a = Math.atan2(y2 - y1, x2 - x1), h = 6, w = 3.6;
    var p1 = (x2 - Math.cos(a) * h - Math.sin(a) * w).toFixed(1) + ',' + (y2 - Math.sin(a) * h + Math.cos(a) * w).toFixed(1);
    var p2 = (x2 - Math.cos(a) * h + Math.sin(a) * w).toFixed(1) + ',' + (y2 - Math.sin(a) * h - Math.cos(a) * w).toFixed(1);
    return '<g class="fs-arrow' + (cls ? ' ' + cls : '') + '"><path d="M' + x1 + ',' + y1 + ' L' + ((x2 - Math.cos(a) * h * 0.8).toFixed(1)) + ',' + ((y2 - Math.sin(a) * h * 0.8).toFixed(1)) + '"/><path class="fs-ah" d="M' + x2 + ',' + y2 + ' L' + p1 + ' L' + p2 + ' Z"/></g>';
  }
  // dots that travel by (dx, dy) while the effector acts (CSS fs-go, delay staggered)
  function movers(list, cls, dx, dy, r){
    return list.map(function(p, i){ return '<circle class="fs-mv ' + cls + '" cx="' + p[0] + '" cy="' + p[1] + '" r="' + (r || 3) + '" style="--dx:' + dx + 'px;--dy:' + dy + 'px;animation-delay:' + (i * 0.27).toFixed(2) + 's"/>'; }).join('');
  }
  function wavy(x, y, h, cls){ return '<path class="fs-heat' + (cls ? ' ' + cls : '') + '" d="M' + x + ',' + y + ' c-4,-' + (h / 4) + ' 4,-' + (h / 4) + ' 0,-' + (h / 2) + ' c-4,-' + (h / 4) + ' 4,-' + (h / 4) + ' 0,-' + (h / 2) + '"/>'; }

  /* ------------------------------------------------------------ the drawings
     Each returns the inside of a 260 x 160 drawing. o = the loop's options. */
  var D = {};

  // Skin in section: epidermis, dermis with an arteriole loop and a hair, fat, a skeletal muscle under it.
  D.skin = function(o){
    var hot = o.mode === 'hot', fev = o.mode === 'fever';
    var s = '<rect x="0" y="0" width="260" height="30" class="fs-air"/>' +
      // epidermis over wavy dermal papillae
      '<path d="M0,34 C20,30 30,38 50,34 C70,30 80,38 100,34 C120,30 130,38 150,34 C170,30 180,38 200,34 C220,30 230,38 260,34 L260,104 L0,104 Z" class="fs-derm"/>' +
      '<path d="M0,30 C40,26 80,32 130,29 C180,26 220,32 260,29 L260,36 C230,40 220,30 200,36 C180,40 170,31 150,36 C130,40 120,31 100,36 C80,40 70,31 50,36 C30,40 20,31 0,36 Z" class="fs-epi"/>' +
      // a hair and its follicle
      '<path d="M34,96 C30,70 30,44 26,10" class="fs-hair"/><path d="M28,98 C24,86 26,64 30,40 M40,98 C42,84 40,62 36,40" class="fs-foll"/>' +
      '<path d="M0,104 C40,100 80,108 130,104 C180,100 220,108 260,104 L260,128 L0,128 Z" class="fs-fat"/>' +
      [[30, 116], [70, 114], [110, 117], [150, 115], [190, 117], [230, 114]].map(function(c){ return '<ellipse cx="' + c[0] + '" cy="' + c[1] + '" rx="16" ry="8" class="fs-fatc"/>'; }).join('') +
      '<g class="fs-musc' + (hot ? '' : ' fs-shiver') + '"><rect x="0" y="128" width="260" height="32" class="fs-muscle"/>' +
        [134, 140, 146, 152].map(function(y){ return '<path d="M4,' + y + ' H256" class="fs-stri"/>'; }).join('') + '</g>' +
      // the arteriole loop under the surface: wall and lumen; its width changes when its smooth muscle acts
      '<g class="fs-ves ' + (hot ? 'fs-dilate' : 'fs-constrict') + '"><path d="M70,104 C74,78 86,54 110,54 C134,54 146,78 150,104" class="fs-vwall"/><path d="M70,104 C74,78 86,54 110,54 C134,54 146,78 150,104" class="fs-vlum"/></g>';
    if(hot){
      s += '<path d="M240,100 C232,92 248,88 240,80 C232,72 248,68 240,60 C234,52 240,44 238,34" class="fs-duct"/><ellipse cx="240" cy="104" rx="12" ry="6" class="fs-gland"/>' +
        movers([[238, 32], [238, 32], [238, 32]], 'fs-sweat', 0, -14, 2.8) +
        wavy(90, 26, 18, 'fs-out') + wavy(120, 26, 18, 'fs-out') + wavy(150, 26, 18, 'fs-out') + wavy(196, 26, 18, 'fs-out');
    } else {
      s += wavy(90, 26, 18, 'fs-loss') + wavy(120, 26, 18, 'fs-loss') + wavy(150, 26, 18, 'fs-loss') + wavy(196, 26, 18, 'fs-loss');
    }
    s += T(44, 14, fev ? 'set point raised: the body acts as if cold' : 'heat lost from the skin', 'fs-small') +
      T(hot ? 160 : 172, 62, hot ? 'arteriole widens:' : 'arteriole narrows:', 'fs-lbl fs-acts') + T(hot ? 160 : 172, 74, hot ? 'more warm blood' : 'less warm blood', 'fs-small fs-acts') + T(hot ? 160 : 172, 85, 'near the surface', 'fs-small fs-acts') +
      (hot ? T(254, 46, 'sweat', 'fs-lbl fs-acts', 'end') : '') +
      T(130, 149, hot ? 'skeletal muscle' : 'muscle shivers: heat made', 'fs-lbl fs-on-dark' + (hot ? '' : ' fs-acts'), 'middle');
    return s;
  };
  // A newborn's brown fat: cells with many small droplets, warming the blood around them.
  D.brownfat = function(){
    var s = '<rect x="0" y="0" width="260" height="160" class="fs-derm"/>';
    var cells = [[60, 60], [104, 52], [148, 62], [80, 100], [124, 104], [168, 98], [196, 58], [40, 104]];
    cells.forEach(function(c){
      s += '<g class="fs-bat"><circle cx="' + c[0] + '" cy="' + c[1] + '" r="21" class="fs-batc"/>';
      for(var i = 0; i < 7; i++){ var a = i * 0.9, rr = i ? 10 : 0; s += '<circle cx="' + (c[0] + Math.cos(a) * rr).toFixed(1) + '" cy="' + (c[1] + Math.sin(a) * rr).toFixed(1) + '" r="4.2" class="fs-batd"/>'; }
      s += '<circle cx="' + (c[0] + 12) + '" cy="' + (c[1] - 10) + '" r="3.2" class="fs-nuc"/></g>';
    });
    s += '<path d="M0,138 C70,130 150,146 260,136" class="fs-art fs-thin"/>' +
      wavy(80, 34, 16, 'fs-out') + wavy(130, 30, 16, 'fs-out') + wavy(180, 34, 16, 'fs-out') +
      T(6, 14, 'Brown fat, between the shoulder blades', 'fs-small') +
      T(130, 156, 'makes heat without shivering', 'fs-lbl fs-acts', 'middle');
    return s;
  };
  // The uterus at term with the head down on the cervix; oxytocin arriving from the pituitary.
  D.uterus = function(){
    return '<g class="fs-uterus"><path d="M130,8 C192,8 226,42 224,84 C222,114 194,130 162,136 L150,146 L110,146 L98,136 C66,130 38,114 36,84 C34,42 68,8 130,8 Z" class="fs-myo"/>' +
      '<path d="M130,22 C180,22 208,50 206,84 C204,108 182,120 156,124 L104,124 C78,120 56,108 54,84 C52,50 80,22 130,22 Z" class="fs-cavity"/></g>' +
      // the baby, curled, head down on the cervix; it moves down as the stretch (--fs-v) grows
      '<g class="fs-baby"><path d="M106,98 C88,84 86,52 108,38 C130,24 168,32 176,58 C184,84 166,104 146,104 C140,104 134,100 130,96 Z" class="fs-babyb"/>' +
        '<path d="M150,60 C140,72 140,84 150,90 M164,70 C170,80 166,92 156,96" class="fs-babyl"/><circle cx="128" cy="106" r="20" class="fs-babyh"/><path d="M118,100 C122,98 126,98 128,100" class="fs-babyl"/></g>' +
      '<path d="M110,146 L110,158 M150,146 L150,158" class="fs-cervix"/>' +
      movers([[16, 46], [16, 46], [16, 46]], 'fs-hormone', 30, 18, 3.2) +
      T(4, 36, 'oxytocin', 'fs-lbl fs-acts') +
      T(256, 30, 'uterus', 'fs-lbl', 'end') + T(256, 42, 'contracts', 'fs-lbl fs-acts', 'end') +
      T(4, 140, 'head stretches', 'fs-lbl fs-on') + T(4, 152, 'the cervix', 'fs-lbl fs-on');
  };
  // The heart with the aortic arch, a carotid artery with its sinus, and an arteriole.
  function heart(){
    return '<path d="M27,40 L27,4 L41,4 L41,42 Z" class="fs-hvein"/>' +
      '<path d="M50,46 C48,24 52,8 70,6 C86,4 96,12 97,26 L86,28 C85,19 80,16 72,17 C62,18 61,30 62,46 Z" class="fs-hart"/>' +
      '<path d="M60,52 C62,40 70,30 82,26 L88,36 C80,40 74,48 72,56 Z" class="fs-hvein"/>' +
      '<ellipse cx="24" cy="54" rx="15" ry="17" class="fs-heartm"/>' +
      '<path d="M22,62 C20,48 34,42 52,46 C70,42 92,44 100,58 C108,76 100,100 84,112 C72,121 60,122 52,116 C36,104 24,84 22,62 Z" class="fs-heartm"/>' +
      '<path d="M70,48 C72,70 66,94 56,116" class="fs-sulc"/>';
  }
  D.baro = function(o){
    var fall = o.mode === 'fall';
    return '<g transform="translate(14 30)"><g class="fs-heart ' + (fall ? 'fs-faster' : 'fs-slower') + '">' + heart() + '</g></g>' +
      // a carotid artery rising from the arch, with the swelling of the carotid sinus
      '<path d="M84,40 C84,24 86,12 88,2" class="fs-carotid"/><ellipse cx="86" cy="18" rx="6" ry="8" class="fs-sinus"/>' +
      T(98, 16, 'carotid sinus', 'fs-small') + T(98, 27, 'and aortic arch sense it', 'fs-small') +
      '<g class="fs-ves ' + (fall ? 'fs-constrict' : 'fs-dilate') + '"><path d="M150,96 H252" class="fs-vwall"/><path d="M150,96 H252" class="fs-vlum"/></g>' +
      T(201, 78, fall ? 'arterioles narrow' : 'arterioles widen', 'fs-lbl fs-acts', 'middle') + T(201, 122, fall ? 'resistance rises' : 'resistance falls', 'fs-small fs-acts', 'middle') +
      T(70, 160, fall ? 'heart: faster, stronger beats' : 'heart: slower beats', 'fs-lbl fs-acts', 'middle');
  };
  // A kidney tubule beside a capillary: what the tubule keeps or lets go into the urine.
  D.tubule = function(o){
    var keep = o.mode === 'keep', s = '';
    // the peritubular capillary with red cells, the tubule's cells (brush border toward the lumen), the tubule fluid
    s += '<rect x="0" y="10" width="260" height="34" class="fs-blood"/><path d="M0,10 H260 M0,44 H260" class="fs-capw"/>' +
      [24, 70, 118, 164, 212].map(function(x, i){ return '<ellipse cx="' + x + '" cy="' + (27 + (i % 2 ? 4 : -4)) + '" rx="9" ry="6" class="fs-rbcs"/>'; }).join('') +
      T(256, 8, 'capillary blood', 'fs-small', 'end') +
      '<rect x="0" y="62" width="260" height="58" class="fs-wall"/>' +
      [0, 52, 104, 156, 208].map(function(x){ return '<rect x="' + (x + 1) + '" y="62" width="50" height="58" rx="5" class="fs-tcell"/><circle cx="' + (x + 26) + '" cy="88" r="6" class="fs-nuc"/>' +
        [6, 14, 22, 30, 38, 46].map(function(d){ return '<path d="M' + (x + d) + ',120 V126" class="fs-brush"/>'; }).join(''); }).join('') +
      '<rect x="0" y="126" width="260" height="34" class="fs-urine"/>' + T(4, 156, 'tubule fluid, becoming urine', 'fs-small fs-on-urine');
    if(keep) s += movers([[40, 142], [130, 142], [220, 142]], 'fs-' + (o.dot || 'water'), 0, -114, 3.6);
    else s += movers([[40, 28], [130, 28], [220, 28]], 'fs-' + (o.dot || 'water'), 0, 114, 3.6);
    s += T(130, 57, o.say || (keep ? 'kept: back into the blood' : 'let go into the urine'), 'fs-lbl fs-acts', 'middle');
    if(o.second) s += movers([[86, 28], [176, 28]], 'fs-' + o.second.dot, 0, 114, 3.2) + T(256, 140, o.second.say, 'fs-lbl fs-acts fs-on-urine', 'end');
    return s;
  };
  // A glomerulus with its afferent arteriole: the arteriole's muscle narrows it.
  D.afferent = function(){
    var tuft = '';
    [[168, 70], [186, 64], [200, 78], [192, 96], [172, 98], [160, 86], [180, 82]].forEach(function(c){ tuft += '<circle cx="' + c[0] + '" cy="' + c[1] + '" r="11" class="fs-tuft"/>'; });
    return '<circle cx="180" cy="82" r="50" class="fs-capsule"/><circle cx="180" cy="82" r="42" class="fs-bspace"/>' + tuft +
      '<g class="fs-ves fs-constrict"><path d="M0,80 H150" class="fs-vwall"/><path d="M0,80 H150" class="fs-vlum"/></g>' +
      '<path d="M156,96 C130,124 96,132 40,138" class="fs-eff"/>' +
      T(70, 60, 'afferent arteriole', 'fs-lbl', 'middle') + T(70, 106, 'narrows: less inflow', 'fs-lbl fs-acts', 'middle') + T(14, 128, 'efferent arteriole', 'fs-small') +
      T(180, 146, 'glomerulus', 'fs-small', 'middle') + T(180, 158, 'lower pressure, lower GFR', 'fs-lbl fs-acts', 'middle');
  };
  // Calcium: the parathyroid glands on the thyroid, and bone, kidney and gut around the blood.
  D.calcium = function(o){
    var low = o.mode === 'low';
    var s = '<rect x="80" y="62" width="100" height="36" rx="18" class="fs-blood"/>' + T(130, 84, 'blood calcium', 'fs-lbl fs-on-blood', 'middle') +
      // thyroid with four parathyroids on its back
      '<path d="M102,10 C92,10 88,30 100,36 C110,40 118,30 130,30 C142,30 150,40 160,36 C172,30 168,10 158,10 C148,10 144,22 130,22 C116,22 112,10 102,10 Z" class="fs-thy"/>' +
      '<circle cx="100" cy="16" r="4" class="fs-para"/><circle cx="104" cy="31" r="4" class="fs-para"/><circle cx="160" cy="16" r="4" class="fs-para"/><circle cx="156" cy="31" r="4" class="fs-para"/>' +
      T(176, 14, low ? 'PTH up' : 'PTH down', 'fs-lbl fs-on') +
      // bone (left), kidney (right), gut (bottom)
      '<path d="M8,48 C2,42 6,34 14,36 C18,30 26,34 24,42 L50,108 C56,112 54,122 46,122 C42,128 34,126 34,118 Z" class="fs-bone"/>' + T(30, 140, 'bone', 'fs-lbl', 'middle') +
      '<path d="M236,50 C256,56 258,100 238,112 C226,118 214,108 222,96 C228,88 226,72 220,66 C214,56 224,46 236,50 Z" class="fs-kidney"/>' + T(236, 128, 'kidney', 'fs-lbl', 'middle') +
      '<path d="M90,132 C100,122 112,142 124,132 C136,122 148,142 160,132 C172,122 180,140 186,134" class="fs-gut"/>' + T(196, 152, 'gut', 'fs-lbl');
    if(low){
      s += movers([[40, 80], [36, 96]], 'fs-ca', 50, -4, 3.2) + movers([[224, 82]], 'fs-ca', -48, 0, 3.2) + movers([[120, 128], [146, 128]], 'fs-ca', 0, -36, 3.2) +
        T(130, 116, 'into the blood', 'fs-small fs-acts', 'middle');
    } else {
      s += movers([[96, 76]], 'fs-ca', -54, 0, 3.2) + movers([[166, 80], [170, 88]], 'fs-ca', 54, 2, 3.2) + T(130, 116, 'out of the blood', 'fs-small fs-acts', 'middle');
    }
    return s;
  };
  // Glucose: the pancreatic islet, the liver, a muscle cell and the blood between them.
  D.glucose = function(o){
    var high = o.mode === 'high';
    var s = '<rect x="0" y="60" width="260" height="40" class="fs-blood"/>' + T(6, 74, 'blood', 'fs-small fs-on-blood') +
      '<path d="M8,10 C40,0 96,6 112,20 C120,30 104,44 80,46 C50,48 14,40 8,28 Z" class="fs-liver"/>' + T(56, 30, 'liver', 'fs-lbl', 'middle') +
      '<rect x="160" y="122" width="92" height="30" rx="14" class="fs-muscle"/><path d="M168,131 H244 M168,137 H244 M168,143 H244" class="fs-stri"/>' + T(206, 140, high ? 'muscle, fat' : 'muscle', 'fs-lbl fs-on-dark', 'middle') +
      '<path d="M150,12 C170,4 214,8 248,18 C252,30 236,36 212,34 C190,32 166,34 150,26 Z" class="fs-panc"/><circle cx="196" cy="22" r="8" class="fs-islet"/>' + T(196, 52, high ? 'islet: insulin' : 'islet: glucagon', 'fs-lbl fs-on', 'middle');
    if(high) s += movers([[70, 76], [96, 86]], 'fs-glu', -4, -40, 3.2) + movers([[190, 80], [214, 90]], 'fs-glu', 0, 44, 3.2) + T(80, 116, 'glucose taken into cells', 'fs-lbl fs-acts', 'middle');
    else s += movers([[56, 44], [76, 44], [96, 40]], 'fs-glu', 4, 34, 3.2) + T(80, 116, 'liver releases glucose', 'fs-lbl fs-acts', 'middle');
    return s;
  };
  // The lungs on the diaphragm: breathing deepens and speeds up (or a breath in is cut short).
  D.breath = function(o){
    var cut = o.mode === 'cut';
    return '<path d="M130,6 V44 M130,44 C118,52 108,56 96,62 M130,44 C142,52 152,56 164,62" class="fs-trachea"/>' +
      '<g class="fs-lungs ' + (cut ? 'fs-shallow' : 'fs-deeper') + '">' +
        '<path d="M118,40 C98,30 70,40 60,70 C52,96 54,124 64,134 C82,140 106,134 118,124 Z" class="fs-lung"/>' +
        '<path d="M142,40 C162,30 190,40 200,70 C208,96 206,124 196,134 C178,140 154,134 142,124 Z" class="fs-lung"/></g>' +
      '<path d="M40,146 C80,120 180,120 220,146" class="fs-diaph ' + (cut ? 'fs-shallow' : 'fs-deeper') + '"/>' +
      T(130, 158, cut ? 'diaphragm stops: the breath in ends early' : 'diaphragm and rib muscles: deeper, faster breaths', 'fs-lbl fs-acts', 'middle') +
      (o.gas ? T(6, 14, o.gas, 'fs-small fs-on') : '');
  };
  // Low oxygen: the kidney releases EPO; red marrow in a bone sends out more red cells.
  D.marrow = function(){
    return '<path d="M200,20 C226,26 230,70 210,82 C198,88 186,78 194,66 C200,58 198,42 192,36 C186,26 194,16 200,20 Z" class="fs-kidney"/>' + T(210, 100, 'kidney', 'fs-lbl', 'middle') +
      movers([[192, 50], [192, 54]], 'fs-hormone', -104, 20, 3) + T(140, 46, 'EPO', 'fs-lbl fs-on', 'middle') +
      '<rect x="20" y="40" width="70" height="96" rx="30" class="fs-bone"/><rect x="32" y="52" width="46" height="72" rx="20" class="fs-marrow"/>' + T(55, 152, 'red marrow', 'fs-lbl', 'middle') +
      '<path d="M90,120 C140,120 160,140 256,140" class="fs-art fs-mid"/>' +
      movers([[84, 120], [84, 120], [84, 120]], 'fs-rbc', 150, 18, 4) + T(176, 128, 'more red cells', 'fs-lbl fs-acts', 'middle');
  };
  // A hormone axis: hypothalamus, pituitary, the target gland, and the gland's hormone back up.
  D.axis = function(o){
    return '<path d="M20,52 C14,16 70,0 110,6 C150,0 196,18 186,54 C180,72 150,74 130,70 C110,74 80,72 60,68 C40,66 22,64 20,52 Z" class="fs-brain"/>' +
      '<ellipse cx="110" cy="64" rx="14" ry="7" class="fs-hypo fs-on"/>' + T(126, 58, 'hypothalamus', 'fs-small') +
      '<path d="M110,71 V82" class="fs-stalk"/><ellipse cx="110" cy="88" rx="9" ry="7" class="fs-pit"/>' + T(124, 92, 'pituitary', 'fs-small') +
      movers([[110, 96], [110, 96]], 'fs-hormone', 0, 34, 3) + T(104, 116, o.down, 'fs-lbl fs-acts', 'end') +
      '<path d="M84,136 C84,128 96,126 110,128 C124,126 136,128 136,136 C136,148 124,154 110,152 C96,154 84,148 84,136 Z" class="fs-gland2"/>' + T(144, 144, o.gland, 'fs-lbl') +
      movers([[132, 132], [132, 132]], 'fs-hormone2', 70, -60, 3) + T(250, 70, o.up, 'fs-lbl fs-acts', 'end');
  };
  // The stomach and duodenum, with the pancreas.
  D.gut = function(o){
    var s = '<path d="M62,6 C44,8 24,48 34,86 C44,124 100,136 140,116 C150,110 156,104 160,100 L160,88 C146,94 124,104 100,100 C76,96 66,66 76,40 C80,28 80,8 62,6 Z" class="fs-stomachf"/>' +
      '<path d="M46,40 C40,64 46,92 70,106 M60,50 C56,72 64,92 84,100" class="fs-rugae"/>' +
      '<path d="M162,94 C186,92 196,104 196,124 C196,144 172,150 150,148" class="fs-duo"/>' +
      '<rect x="156" y="86" width="10" height="16" rx="3" class="fs-pylorus ' + (o.mode === 'brake' ? 'fs-closes' : '') + '"/>' +
      T(70, 60, 'stomach', 'fs-lbl', 'middle') + T(204, 142, 'duodenum', 'fs-lbl');
    if(o.mode === 'acid') s += movers([[52, 44], [62, 70], [80, 90]], 'fs-h', 6, 6, 3) + T(70, 140, 'parietal cells make less acid', 'fs-lbl fs-acts', 'middle') + T(6, 12, 'H+ (acid)', 'fs-small');
    if(o.mode === 'brake') s += T(150, 72, 'pylorus closes', 'fs-lbl fs-acts', 'middle') + T(70, 140, 'antrum squeezes less', 'fs-lbl fs-acts', 'middle') + movers([[120, 112], [136, 106]], 'fs-chyme', 0, 0, 4);
    if(o.mode === 'secretin') s += '<path d="M200,40 C226,36 252,44 254,56 C256,66 236,70 214,66 C204,64 196,58 196,50 Z" class="fs-panc"/>' + T(226, 32, 'pancreas', 'fs-lbl', 'middle') +
      '<path d="M200,62 C196,80 192,100 192,112" class="fs-duct"/>' + movers([[200, 66], [200, 66]], 'fs-bicarb', -8, 50, 3.2) + T(70, 140, 'bicarbonate neutralizes acid', 'fs-lbl fs-acts', 'middle') +
      movers([[176, 118], [182, 132]], 'fs-h fs-fadeout', 0, 0, 3);
    return s;
  };
  // The bladder emptying through the urethra.
  D.bladder = function(){
    return '<g class="fs-bladder"><path d="M130,14 C190,14 214,50 208,86 C202,114 172,124 146,126 L114,126 C88,124 58,114 52,86 C46,50 70,14 130,14 Z" class="fs-detrusor"/>' +
      '<path d="M130,28 C176,28 194,56 190,84 C186,104 164,112 144,112 L116,112 C96,112 74,104 70,84 C66,56 84,28 130,28 Z" class="fs-urinein"/></g>' +
      '<path d="M122,126 V158 M138,126 V158" class="fs-urethra"/>' +
      movers([[130, 120], [130, 120], [130, 120]], 'fs-flow', 0, 34, 3) +
      T(222, 60, 'detrusor', 'fs-lbl') + T(222, 72, 'contracts', 'fs-lbl fs-acts') + T(146, 152, 'more flow', 'fs-lbl fs-acts');
  };
  // An eye from the front: the circular iris muscle narrows the pupil.
  D.eye = function(){
    return '<path d="M20,80 C70,24 190,24 240,80 C190,136 70,136 20,80 Z" class="fs-sclera"/>' +
      '<circle cx="130" cy="80" r="42" class="fs-iris"/>' +
      [0, 30, 60, 90, 120, 150].map(function(a){ var r = a * Math.PI / 180; return '<path d="M' + (130 + Math.cos(r) * 20).toFixed(1) + ',' + (80 + Math.sin(r) * 20).toFixed(1) + ' L' + (130 + Math.cos(r) * 40).toFixed(1) + ',' + (80 + Math.sin(r) * 40).toFixed(1) + ' M' + (130 - Math.cos(r) * 20).toFixed(1) + ',' + (80 - Math.sin(r) * 20).toFixed(1) + ' L' + (130 - Math.cos(r) * 40).toFixed(1) + ',' + (80 - Math.sin(r) * 40).toFixed(1) + '" class="fs-irisl"/>'; }).join('') +
      '<circle cx="130" cy="80" r="18" class="fs-pupil"/>' + '<circle cx="142" cy="70" r="4" class="fs-glint"/>' +
      '<g class="fs-on">' + A(10, 10, 60, 40, 'fs-light') + A(30, 4, 80, 34, 'fs-light') + '</g>' +
      T(130, 150, 'iris sphincter narrows the pupil', 'fs-lbl fs-acts', 'middle');
  };
  // Standing and tipping forward: the calf is stretched, contracts and pulls you back.
  D.calf = function(){
    return '<g class="fs-person"><circle cx="128" cy="18" r="11" class="fs-skin"/><path d="M128,30 V86 M128,44 L110,70 M128,44 L146,70 M128,86 L120,136 M128,86 L136,136" class="fs-limb"/>' +
      '<path d="M122,98 C114,108 114,122 120,130" class="fs-calf"/><path d="M134,98 C142,108 142,122 136,130" class="fs-calf"/></g>' +
      '<path d="M100,140 H170" class="fs-ground"/><path d="M114,136 H130 M130,136 H146" class="fs-limb"/>' +
      T(196, 100, 'calf muscles', 'fs-lbl') + T(196, 112, 'contract', 'fs-lbl fs-acts') + T(254, 28, 'tipping forward', 'fs-lbl fs-on', 'end') + T(130, 156, 'pulled back upright', 'fs-lbl fs-acts', 'middle');
  };
  // A cut in a vessel wall: platelets gather, thrombin builds fibrin.
  D.clot = function(){
    var s = '<rect x="0" y="20" width="260" height="16" class="fs-wallv"/><rect x="0" y="36" width="260" height="88" class="fs-blood"/><rect x="0" y="124" width="260" height="16" class="fs-wallv"/>' +
      '<path d="M112,20 L118,36 L126,24 L134,36 L142,20 Z" class="fs-cut"/>';
    for(var i = 0; i < 9; i++) s += '<ellipse class="fs-plt fs-grow" cx="' + (106 + (i % 5) * 10) + '" cy="' + (42 + Math.floor(i / 5) * 9) + '" rx="5" ry="3" style="animation-delay:' + (i * 0.15).toFixed(2) + 's"/>';
    s += '<path class="fs-fibrin fs-grow" d="M100,40 L160,56 M104,56 L156,40 M110,62 L150,44"/>' +
      T(130, 14, 'cut in the vessel wall', 'fs-lbl fs-on', 'middle') + T(130, 92, 'platelets pile up; thrombin makes more thrombin', 'fs-lbl fs-acts fs-on-blood', 'middle');
    return s;
  };
  // Bone under load: osteoblasts lay down bone where the strain is.
  D.bone = function(){
    return '<path d="M30,40 C10,30 10,8 30,10 C40,0 60,6 58,24 L58,136 C60,154 40,160 30,150 C10,152 10,130 30,120 Z" class="fs-bone" transform="translate(70 0)"/>' +
      '<g class="fs-thicken"><rect x="122" y="34" width="10" height="92" rx="4" class="fs-newbone"/></g>' +
      A(100, 2, 100, 26, 'fs-load fs-on') + T(110, 14, 'load', 'fs-lbl fs-on') +
      T(150, 70, 'osteoblasts add bone', 'fs-lbl fs-acts') + T(150, 84, 'where it is strained', 'fs-small fs-acts');
  };

  /* ------------------------------------------------------------ the loops */
  var LOOPS = {
    'temperature-cold': ['skin', {}], 'met-thermo-cold-full': ['skin', {}], 'ig-thermo-cold': ['skin', {}],
    'fever-set-point': ['skin', { mode: 'fever' }],
    'temperature-hot': ['skin', { mode: 'hot' }], 'met-thermo-heat-full': ['skin', { mode: 'hot' }], 'ig-thermo-hot': ['skin', { mode: 'hot' }],
    'dv-newborn-brown-fat': ['brownfat', {}],
    'childbirth': ['uterus', {}], 'dv-labor-oxytocin': ['uterus', {}],
    'baroreflex-fall': ['baro', { mode: 'fall' }], 'standing-pressure': ['baro', { mode: 'fall' }], 'baroreflex-rise': ['baro', { mode: 'rise' }],
    'raas': ['tubule', { mode: 'keep', dot: 'na', say: 'Na+ and water kept; arterioles narrow' }],
    'adh-osmolarity': ['tubule', { mode: 'keep', dot: 'water', say: 'water kept: back into the blood' }],
    'anp-volume': ['tubule', { mode: 'lose', dot: 'na', say: 'Na+ and water let go into the urine' }],
    'ur-pressure-natriuresis': ['tubule', { mode: 'lose', dot: 'na', say: 'more Na+ and water into the urine' }],
    'fab-osmolality-falls': ['tubule', { mode: 'lose', dot: 'water', say: 'extra water let go: dilute urine' }],
    'potassium-aldosterone': ['tubule', { mode: 'lose', dot: 'k', say: 'K+ secreted into the urine' }],
    'fab-ph-kidney': ['tubule', { mode: 'keep', dot: 'bicarb', say: 'new HCO3- into the blood', second: { dot: 'h', say: 'H+ into the urine' } }],
    'ur-tubuloglomerular-feedback': ['afferent', {}], 'ur-myogenic-afferent': ['afferent', {}],
    'calcium-low-pth': ['calcium', { mode: 'low' }], 'bt-calcium-low': ['calcium', { mode: 'low' }],
    'calcium-high': ['calcium', { mode: 'high' }], 'bt-calcium-high': ['calcium', { mode: 'high' }],
    'glucose-high': ['glucose', { mode: 'high' }], 'glucose-high-insulin': ['glucose', { mode: 'high' }], 'glucose-low-glucagon': ['glucose', { mode: 'low' }],
    'co2-high': ['breath', { gas: 'CO2 high in the blood' }], 'o2-low': ['breath', { gas: 'O2 low in the blood' }], 'fab-ph-fixed-acid': ['breath', { gas: 'acid in the blood: pH low' }],
    'lung-inflation': ['breath', { mode: 'cut', gas: 'lungs stretched by a big breath' }],
    'oxygen-low': ['marrow', {}], 'epo-oxygen-delivery': ['marrow', {}],
    'thyroid-axis': ['axis', { down: 'TSH', gland: 'thyroid', up: 'T4 and T3' }],
    'cortisol-axis': ['axis', { down: 'ACTH', gland: 'adrenal cortex', up: 'cortisol' }],
    'rp-testosterone-axis': ['axis', { down: 'LH', gland: 'testis: Leydig cells', up: 'testosterone' }],
    'rp-inhibin-fsh': ['axis', { down: 'FSH', gland: 'testis: Sertoli cells', up: 'inhibin' }],
    'rp-follicular-fsh': ['axis', { down: 'FSH', gland: 'ovary: granulosa cells', up: 'estradiol, inhibin' }],
    'rp-lh-surge': ['axis', { down: 'LH surge', gland: 'ovary: the follicle', up: 'estradiol' }],
    'gastrin-acid': ['gut', { mode: 'acid' }], 'enterogastric-brake': ['gut', { mode: 'brake' }], 'secretin-bicarbonate': ['gut', { mode: 'secretin' }],
    'ur-micturition-flow': ['bladder', {}],
    'pupillary-light': ['eye', {}],
    'stretch-reflex-posture': ['calf', {}],
    'clotting-thrombin': ['clot', {}],
    'bt-wolff-law': ['bone', {}]
  };
  function has(l){ return !!LOOPS[l.id]; }
  function svg(l){
    var m = LOOPS[l.id];
    if(!m) return '';
    var label = 'Where it happens: ' + l.slots.effector.text + '. ' + l.slots.response.text + '.';
    return '<svg class="fl-scene fs-' + m[0] + '" viewBox="0 0 260 160" role="img" aria-label="' + esc(label) + '">' + D[m[0]](m[1]) + '</svg>';
  }
  window.AnpLoopScenes = { has: has, svg: svg, LOOPS: LOOPS };
})();
