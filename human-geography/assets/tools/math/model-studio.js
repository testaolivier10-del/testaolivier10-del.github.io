/* Model Studio model: ApHugMath.modelStudio (docs/aphug-architecture.md, "Tools";
   docs/aphug-spec.md section 3.1). OWNED BY THIS TOOL ONLY (builder T1,
   docs/aphug-briefs/t1.md): no other tool edits this file, and this tool edits
   no shared file. Pure functions, no DOM, so the validator
   (scripts/lib/aphug-tool-checks/model-studio.mjs) and the test
   (scripts/test/aphug-tool-model-studio.test.mjs) run exactly this code.

   Content lives in human-geography/data/tools/model-studio.json: one context
   per model the CED names (its topic, so it unlocks with that topic), each
   with its model (ApHugModel: rings, sectors, stages, tiers or free spots on
   a drawn figure), its decoy pieces, the reasons each piece goes where it
   does, how to apply it (apply.kind), and its limits.

   A problem (generate(r, ctx), for ApHugTools.drill) has three parts:
     build   a model step: the pieces (shuffled, with up to two decoys) into
             their places, graded piece by piece, the slip named
     apply   one or two steps on a case: a map (ApHugMap spec), a plot
             (ApHugPlot spec) or a table; every number from ApHugCalc
     limits  a choice: one real limitation, against what the model claims
             and statements that misread it
   p.figs.build and p.figs.apply say what the stage shows for each part;
   each step names its figure (step.fig).

   Figures (figure(id, model)): the drawings for the free layouts (and the
   transition model's chart). Shapes only: every word, and every slot
   number, is HTML laid over the picture by percent (spots, labels) or under
   it (legend), so it stays legible at 360 px. overlaps(fig, px) measures
   those boxes at a given width. */
(function(root){
  'use strict';
  var M = root.ApHugMath;
  if(!M) return;
  function Calc(){ return root.ApHugCalc; }
  function Mdl(){ return root.ApHugModel; }
  function r1(v){ return Math.round(v * 10) / 10; }
  function esc(s){ return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function plain(s){ return String(s == null ? '' : s).replace(/<[^>]+>/g, ''); }
  function thou(n){ return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ','); }
  var COUNTRIES = ['Country K', 'Country L', 'Country N', 'Country P', 'Country R', 'Country T'];

  /* ------------------------------------------------------------ figures */
  var W = 600, H = 400;
  var COL = { land: '#F3EEE2', line: '#5B564E', water: '#BFD9EA', waterLine: '#5E8FB0', rail: '#3A3631', road: '#C99A2E', z: ['#E1F1F4', '#F2E3C9', '#E4DCF0', '#DCEFE2', '#F5D9CF', '#D7E6F5'], core: '#FFFFFF', ink: '#1B1B1B', accent: '#094953' };
  function pt(cx, cy, r, a){ var t = a * Math.PI / 180; return [r1(cx + r * Math.cos(t)), r1(cy + r * Math.sin(t))]; }
  function wedge(cx, cy, r0, r1_, a0, a1, fill){
    var p0 = pt(cx, cy, r1_, a0), p1 = pt(cx, cy, r1_, a1), q1 = pt(cx, cy, r0, a1), q0 = pt(cx, cy, r0, a0), big = (a1 - a0) > 180 ? 1 : 0;
    return '<path d="M' + q0 + 'L' + p0 + 'A' + r1_ + ' ' + r1_ + ' 0 ' + big + ' 1 ' + p1 + 'L' + q1 + (r0 > 0 ? 'A' + r0 + ' ' + r0 + ' 0 ' + big + ' 0 ' + q0 : '') + 'Z" fill="' + fill + '" stroke="' + COL.line + '" stroke-width="1.2" stroke-linejoin="round"/>';
  }
  function circle(cx, cy, r, fill, extra){ return '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="' + fill + '" stroke="' + COL.line + '" stroke-width="1.2"' + (extra || '') + '/>'; }
  function hex(cx, cy, r, attrs){ var p = []; for(var i = 0; i < 6; i++) p.push(pt(cx, cy, r, 60 * i + 30).join(' ')); return '<polygon points="' + p.join(' ') + '" ' + attrs + '/>'; }
  function rail(d){ return '<path d="' + d + '" fill="none" stroke="' + COL.rail + '" stroke-width="5"/><path d="' + d + '" fill="none" stroke="#FFFFFF" stroke-width="2" stroke-dasharray="7 7"/>'; }
  function road(d, w){ return '<path d="' + d + '" fill="none" stroke="#7A6A3A" stroke-width="' + ((w || 6) + 2) + '" stroke-linecap="round" stroke-linejoin="round"/><path d="' + d + '" fill="none" stroke="' + COL.road + '" stroke-width="' + (w || 6) + '" stroke-linecap="round" stroke-linejoin="round"/>'; }
  function blob(cx, cy, rx, ry, fill, rot){ return '<ellipse cx="' + cx + '" cy="' + cy + '" rx="' + rx + '" ry="' + ry + '" fill="' + fill + '" stroke="' + COL.line + '" stroke-width="1.2"' + (rot ? ' transform="rotate(' + rot + ' ' + cx + ' ' + cy + ')"' : '') + '/>'; }
  function arrowHead(x, y, a, c){ var p1 = pt(x, y, 13, a + 155), p2 = pt(x, y, 13, a - 155); return '<path d="M' + x + ' ' + y + 'L' + p1 + 'L' + p2 + 'Z" fill="' + (c || COL.ink) + '"/>'; }
  function arrow(x1, y1, x2, y2, c, w, dash){
    var a = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI, e = pt(x2, y2, 10, a + 180);
    return '<path d="M' + x1 + ' ' + y1 + 'L' + e + '" stroke="' + (c || COL.ink) + '" stroke-width="' + (w || 3) + '" fill="none" stroke-linecap="round"' + (dash ? ' stroke-dasharray="' + dash + '"' : '') + '/>' + arrowHead(x2, y2, a, c);
  }
  function pct(x, y){ return [r1(100 * x / W), r1(100 * y / H)]; }
  function frame(inner, label){ return '<svg class="ms-fig-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(label) + '"><rect width="' + W + '" height="' + H + '" fill="#FFFFFF"/>' + inner + '</svg>'; }
  var LEG = {
    rail: { sw: 'rail', text: 'Rail line' }, road: { sw: 'road', text: 'Main road or highway' }, water: { sw: 'water', text: 'Water' },
    line: { sw: 'line', text: 'Boundary' }, relict: { sw: 'dash', text: 'Old boundary line, no longer used' }, hatch: { sw: 'hatch', text: 'Where one language group lives' },
    move: { sw: 'arrow', text: 'A flow of migrants' }
  };

  /* Each figure: { svg, spots: [[x%, y%] per slot, or a list of them], labels: [{ x, y, text }], legend: [...] }.
     spots are listed by slot index; a slot drawn in two places has two. */
  var FIGS = {
    hoyt: function(){
      var cx = 300, cy = 200, R = 178, o = [];
      o.push('<rect x="0" y="0" width="70" height="400" fill="' + COL.water + '"/><path d="M70 0V400" stroke="' + COL.waterLine + '" stroke-width="2"/>');
      var cut = [[-22.5, 22.5, 0], [22.5, 67.5, 1], [-67.5, -22.5, 1], [67.5, 135, 2], [-135, -67.5, 2], [135, 225, 3]];
      cut.forEach(function(c){ o.push(wedge(cx, cy, 0, R, c[0], c[1], COL.z[c[2]])); });
      o.push(rail('M' + cx + ' ' + cy + 'L600 ' + cy));
      o.push(road('M' + cx + ' ' + cy + 'L70 ' + cy, 7));
      o.push(circle(cx, cy, 36, COL.core));
      return { svg: frame(o.join(''), 'Hoyt sector model: wedges of land use around the CBD, a rail line to the east and a boulevard to the lakeshore in the west'),
        spots: [[pct(420, 200)], [pct(375, 125), pct(375, 275)], [pct(285, 95), pct(285, 305)], [pct(165, 135)]],
        labels: [{ x: 50, y: 50, text: 'CBD' }, { x: 6, y: 8, text: 'Lake' }], legend: [LEG.rail, { sw: 'road', text: 'Boulevard to the lakeshore' }, LEG.water] };
    },
    nuclei: function(){
      var o = [];
      o.push('<rect width="600" height="400" fill="' + COL.land + '"/>');
      o.push('<path d="M0 290 C120 300 160 360 230 400 L0 400Z" fill="' + COL.water + '" stroke="' + COL.waterLine + '" stroke-width="2"/>');
      o.push(rail('M60 330 C180 280 240 210 300 195 L600 195'));
      o.push(road('M300 195 L300 0', 6)); o.push(road('M300 195 L120 30', 6)); o.push(road('M300 195 L480 400', 6)); o.push(road('M300 195 C400 150 470 110 600 80', 6));
      o.push(blob(300, 195, 52, 40, COL.z[0]));
      o.push(blob(400, 222, 46, 22, COL.z[1]));
      o.push(blob(118, 318, 62, 34, COL.z[4], -18));
      o.push(blob(478, 98, 48, 34, COL.z[2]));
      o.push(blob(130, 105, 70, 46, COL.z[3]));
      o.push(blob(512, 300, 56, 38, COL.z[5]));
      return { svg: frame(o.join(''), 'A drawn city with six separate centers of activity, a river port at the lower left, a rail line and highways'),
        spots: [[pct(300, 195)], [pct(400, 222)], [pct(118, 318)], [pct(478, 98)], [pct(130, 105)], [pct(512, 300)]],
        labels: [{ x: 6, y: 93, text: 'River port' }], legend: [LEG.rail, LEG.road, { sw: 'water', text: 'River' }] };
    },
    galactic: function(){
      var cx = 300, cy = 200, o = [];
      o.push('<rect width="600" height="400" fill="' + COL.land + '"/>');
      [[-45, 0], [135, 0], [30, 0], [210, 0], [-110, 0], [80, 0]].forEach(function(a){ var e = pt(cx, cy, 340, a[0]); o.push(road('M' + cx + ' ' + cy + 'L' + e.join(' '), 5)); });
      o.push('<circle cx="' + cx + '" cy="' + cy + '" r="128" fill="none" stroke="#7A6A3A" stroke-width="10"/><circle cx="' + cx + '" cy="' + cy + '" r="128" fill="none" stroke="' + COL.road + '" stroke-width="8"/>');
      o.push(circle(cx, cy, 34, COL.z[0]));
      var ec = pt(cx, cy, 128, -45); o.push(blob(ec[0], ec[1], 32, 26, COL.z[2]));
      o.push(blob(118, 300, 56, 30, COL.z[3], 25)); o.push(blob(470, 330, 46, 28, COL.z[3], -20)); o.push(blob(92, 92, 46, 26, COL.z[3], -30));
      o.push('<g transform="translate(470 210) rotate(-25)"><rect x="-58" y="-26" width="116" height="52" rx="8" fill="' + COL.z[5] + '" stroke="' + COL.line + '" stroke-width="1.2"/><path d="M-46 -6H46M-46 10H46" stroke="#5B564E" stroke-width="5"/></g>');
      return { svg: frame(o.join(''), 'Galactic city model: an old central city, a beltway around it, highways out from the center, and centers of activity spread along them'),
        spots: [[pct(cx, cy)], [pct(ec[0], ec[1])], [pct(118, 300), pct(470, 330)], [pct(470, 210)]],
        labels: [], legend: [{ sw: 'road', text: 'Highway (the loop is a ring road)' }] };
    },
    latin: function(){
      var cx = 300, cy = 205, o = [];
      o.push(circle(cx, cy, 190, COL.z[4])); o.push(circle(cx, cy, 140, COL.z[3])); o.push(circle(cx, cy, 88, COL.z[2]));
      o.push(wedge(cx, cy, 30, 190, -76, -44, COL.z[1]));
      o.push(wedge(cx, cy, 30, 190, 82, 104, '#D9D2C3'));
      o.push(road('M' + cx + ' ' + cy + 'L' + pt(cx, cy, 196, -60).join(' '), 6));
      o.push('<path d="M' + pt(cx, cy, 40, 93).join(' ') + 'C' + pt(cx, cy, 90, 99).join(' ') + ' ' + pt(cx, cy, 140, 88).join(' ') + ' ' + pt(cx, cy, 200, 94).join(' ') + '" fill="none" stroke="' + COL.waterLine + '" stroke-width="5"/>');
      o.push(circle(cx, cy, 30, COL.core));
      return { svg: frame(o.join(''), 'Latin American city model: a CBD, a spine running out along a main avenue, rings of housing and a wedge along a river'),
        spots: [[pct(cx, cy)], [pct.apply(null, pt(cx, cy, 128, -60))], [pct.apply(null, pt(cx, cy, 60, 190))], [pct.apply(null, pt(cx, cy, 114, 160))], [pct.apply(null, pt(cx, cy, 165, 205))], [pct.apply(null, pt(cx, cy, 150, 94))]],
        labels: [], legend: [{ sw: 'road', text: 'Main avenue' }, { sw: 'water', text: 'River' }] };
    },
    seasia: function(){
      var o = [];
      o.push('<rect width="600" height="400" fill="' + COL.z[3] + '"/>');
      o.push('<path d="M0 0H600V70C470 90 130 90 0 70Z" fill="#E9E4D3" stroke="' + COL.line + '" stroke-width="1.2"/>');
      o.push('<path d="M40 330 C120 210 480 210 560 330Z" fill="' + COL.z[2] + '" stroke="' + COL.line + '" stroke-width="1.2"/>');
      o.push('<path d="M150 330 C200 260 400 260 450 330Z" fill="' + COL.z[1] + '" stroke="' + COL.line + '" stroke-width="1.2"/>');
      o.push('<rect x="235" y="300" width="130" height="40" rx="6" fill="' + COL.z[0] + '" stroke="' + COL.line + '" stroke-width="1.2"/>');
      o.push('<rect x="0" y="335" width="600" height="65" fill="' + COL.water + '"/><path d="M0 335H600" stroke="' + COL.waterLine + '" stroke-width="2"/>');
      o.push(blob(70, 170, 34, 22, COL.z[4])); o.push(blob(540, 160, 34, 22, COL.z[4])); o.push(blob(300, 140, 30, 20, COL.z[4]));
      return { svg: frame(o.join(''), 'Southeast Asian city model: a port on the sea, commercial zones beside it, housing around them and a band of farmland at the edge'),
        spots: [[pct(300, 320)], [pct(300, 282)], [pct(70, 170), pct(540, 160)], [pct(300, 38)]],
        labels: [{ x: 9, y: 93, text: 'Sea' }], legend: [LEG.water] };
    },
    africa: function(){
      var o = [];
      o.push('<rect width="600" height="400" fill="' + COL.land + '"/>');
      o.push('<ellipse cx="300" cy="200" rx="215" ry="150" fill="' + COL.z[3] + '" stroke="' + COL.line + '" stroke-width="1.2"/>');
      o.push(wedge(300, 200, 60, 250, -14, 14, COL.z[5]).replace('<path', '<path clip-path="url(#msaf)"'));
      o.push('<clipPath id="msaf"><ellipse cx="300" cy="200" rx="215" ry="150"/></clipPath>');
      o.push(rail('M300 200 L600 200'));
      var g = []; for(var i = 0; i < 4; i++){ g.push('M' + (222 + 12 * i) + ' 136V196'); g.push('M218 ' + (140 + 14 * i) + 'H272'); }
      o.push('<rect x="214" y="132" width="62" height="68" rx="6" fill="' + COL.z[0] + '" stroke="' + COL.line + '" stroke-width="1.2"/><path d="' + g.join('') + '" stroke="#8FA9AE" stroke-width="1.5"/>');
      o.push('<path d="M330 140 C350 126 384 134 388 156 C394 182 376 202 352 200 C328 198 318 170 330 140Z" fill="' + COL.z[1] + '" stroke="' + COL.line + '" stroke-width="1.2"/>');
      o.push(blob(300, 252, 46, 22, COL.z[2]));
      o.push(blob(58, 340, 40, 24, COL.z[4])); o.push(blob(548, 60, 36, 22, COL.z[4])); o.push(blob(70, 52, 34, 20, COL.z[4]));
      return { svg: frame(o.join(''), 'African city model: three central areas side by side, neighborhoods around them, a wedge along the rail line and settlements beyond the edge'),
        spots: [[pct(245, 166)], [pct(357, 168)], [pct(300, 252)], [pct(150, 230)], [pct(470, 200)], [pct(58, 340), pct(548, 60)]],
        labels: [], legend: [LEG.rail] };
    },
    christaller: function(){
      var cx = 300, cy = 200, o = [], rs = 46;
      o.push(hex(cx, cy, 182, 'fill="' + COL.z[0] + '" stroke="' + COL.accent + '" stroke-width="3"'));
      for(var i = 0; i < 6; i++){ var t = pt(cx, cy, 106, 60 * i); o.push(hex(t[0], t[1], 70, 'fill="none" stroke="#7FA7AE" stroke-width="1.6" stroke-dasharray="5 4"')); }
      var vill = pt(cx, cy, 106, 30);
      o.push(hex(vill[0], vill[1], rs * 0.62, 'fill="' + COL.z[1] + '" stroke="' + COL.line + '" stroke-width="1.2"'));
      o.push('<circle cx="' + cx + '" cy="' + cy + '" r="15" fill="' + COL.ink + '"/>');
      for(var j = 0; j < 6; j++){ var q = pt(cx, cy, 106, 60 * j); o.push('<circle cx="' + q[0] + '" cy="' + q[1] + '" r="9" fill="' + COL.ink + '"/>'); }
      for(var k = 0; k < 6; k++){ var v = pt(cx, cy, 106, 60 * k + 30); o.push('<circle cx="' + v[0] + '" cy="' + v[1] + '" r="5" fill="' + COL.ink + '"/>'); }
      var town = pt(cx, cy, 106, 0), v2 = pt(cx, cy, 106, 210), shade = pt(cx, cy, 106, 30);
      return { svg: frame(o.join(''), 'Central place theory: a large hexagon market area around a city, with towns and villages at the corners of smaller hexagons'),
        spots: [[pct(cx, cy + 34)], [pct(town[0] + 30, town[1])], [pct(v2[0], v2[1] + 28)], [pct(shade[0] + 4, shade[1] + 26)]],
        labels: [], legend: [{ sw: 'big', text: 'Large dot: a big place' }, { sw: 'small', text: 'Small dot: a small place' }, { sw: 'dash', text: 'Edge of a market area' }] };
    },
    bidrent: function(){
      var o = [], X0 = 70, Y0 = 350;
      o.push('<path d="M' + X0 + ' 30V' + Y0 + 'H580" fill="none" stroke="' + COL.ink + '" stroke-width="2.5"/>');
      var seg = [[70, 60, 170, 190], [170, 190, 300, 262], [300, 262, 440, 316], [440, 316, 580, 340]];
      seg.forEach(function(s, i){ o.push('<path d="M' + s[0] + ' ' + Y0 + 'V' + s[1] + 'L' + s[2] + ' ' + s[3] + 'V' + Y0 + 'Z" fill="' + COL.z[i] + '"/>'); if(i) o.push('<path d="M' + s[0] + ' ' + s[1] + 'V' + Y0 + '" stroke="#8C877E" stroke-width="1.5" stroke-dasharray="5 5"/>'); });
      o.push('<path d="M70 60L170 190L300 262L440 316L580 340" fill="none" stroke="' + COL.accent + '" stroke-width="4" stroke-linejoin="round"/>');
      return { svg: frame(o.join(''), 'Bid-rent graph: rent falls with distance from the CBD, in four parts, steepest near the center'),
        spots: [[pct(130, 250)], [pct(235, 300)], [pct(370, 330)], [pct(510, 300)]],
        labels: [{ x: 6, y: 5, text: 'Rent' }, { x: 80, y: 96, text: 'Distance from the CBD' }, { x: 11.7, y: 96, text: 'CBD' }], legend: [] };
    },
    malthus: function(){
      var o = [], X0 = 70, Y0 = 350;
      o.push('<path d="M' + X0 + ' 30V' + Y0 + 'H580" fill="none" stroke="' + COL.ink + '" stroke-width="2.5"/>');
      var pop = [], food = [];
      for(var x = 0; x <= 500; x += 10){ pop.push((X0 + x) + ' ' + r1(Y0 - 30 * Math.pow(2, x / 100))); food.push((X0 + x) + ' ' + r1(Y0 - 30 - 0.52 * x)); }
      var cross = 0; for(var t = 0; t <= 500; t += 1){ if(30 * Math.pow(2, t / 100) >= 30 + 0.52 * t){ cross = t; if(t > 50) break; } }
      o.push('<path d="M' + pop.slice(0, 41).join('L') + '" fill="none" stroke="#B5481F" stroke-width="4"/>');
      o.push('<path d="M' + food.join('L') + '" fill="none" stroke="' + COL.accent + '" stroke-width="4"/>');
      var cy = Y0 - 30 * Math.pow(2, cross / 100);
      o.push('<circle cx="' + (X0 + cross) + '" cy="' + r1(cy) + '" r="9" fill="' + COL.ink + '"/>');
      o.push('<path d="M' + (X0 + cross + 8) + ' ' + r1(cy) + 'L' + (X0 + 400) + ' ' + r1(Y0 - 30 * Math.pow(2, 4)) + 'L' + (X0 + 400) + ' ' + r1(Y0 - 30 - 208) + 'Z" fill="#F5D9CF" opacity=".75"/>');
      return { svg: frame(o.join(''), 'Malthus: a curved line that grows faster and faster, a straight line that grows steadily, and the point where they cross'),
        spots: [[pct(X0 + 345, Y0 - 30 * Math.pow(2, 3.45) - 22)], [pct(X0 + 470, Y0 - 30 - 0.52 * 470 + 30)], [pct(X0 + cross - 30, cy + 12)], [pct(X0 + 392, Y0 - 200)]],
        labels: [{ x: 6, y: 5, text: 'Amount' }, { x: 89, y: 96, text: 'Time' }], legend: [], cross: cross };
    },
    ravenstein: function(){
      var o = [];
      o.push('<rect width="600" height="400" fill="' + COL.land + '"/>');
      o.push(circle(320, 200, 38, COL.z[1]));
      [[140, 300], [470, 110], [440, 320]].forEach(function(t){ o.push(circle(t[0], t[1], 18, COL.z[0])); });
      [[70, 250], [90, 360], [200, 360], [210, 250], [560, 50], [380, 40], [80, 60], [560, 370]].forEach(function(v){ o.push('<circle cx="' + v[0] + '" cy="' + v[1] + '" r="7" fill="' + COL.ink + '"/>'); });
      o.push(arrow(78, 256, 124, 290)); o.push(arrow(96, 352, 126, 314)); o.push(arrow(196, 352, 154, 314)); o.push(arrow(205, 258, 158, 292));
      o.push(arrow(556, 56, 484, 98)); o.push(arrow(458, 124, 352, 182));
      o.push(arrow(344, 230, 426, 306, '#B5481F', 3, '8 6'));
      o.push(arrow(88, 66, 288, 180, COL.ink, 3));
      return { svg: frame(o.join(''), 'Ravenstein: arrows of migrants in an invented region with one large city, three towns and many villages'),
        spots: [[pct(140, 250)], [pct(520, 128)], [pct(410, 248)], [pct(178, 140)]],
        labels: [], legend: [{ sw: 'big', text: 'Large circle: the big city' }, { sw: 'ring', text: 'Small circle: a town' }, { sw: 'small', text: 'Dot: a village' }, LEG.move] };
    },
    boundaries: function(){
      var o = [];
      o.push('<rect width="600" height="400" fill="' + COL.water + '"/>');
      o.push('<path d="M30 40 C160 10 440 14 572 44 C590 150 584 280 560 362 C420 392 170 392 40 360 C18 260 16 140 30 40Z" fill="' + COL.land + '" stroke="' + COL.line + '" stroke-width="2"/>');
      o.push('<defs><pattern id="mshatch" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="10" height="10" fill="#E4DCF0"/><path d="M0 0V10" stroke="#9A86C0" stroke-width="3"/></pattern></defs>');
      o.push('<path d="M330 120 C380 110 470 130 500 170 C520 220 500 290 470 330 C420 352 360 344 340 300 C320 250 300 160 330 120Z" fill="url(#mshatch)" stroke="none"/>');
      o.push('<path d="M150 250 C200 230 260 236 286 270 C300 300 270 350 230 360 C190 366 140 340 130 300 C126 278 134 258 150 250Z" fill="url(#mshatch)" stroke="none"/>');
      var B = function(d, dash){ return '<path d="' + d + '" fill="none" stroke="' + COL.ink + '" stroke-width="3.5"' + (dash ? ' stroke-dasharray="9 7"' : '') + ' stroke-linejoin="round"/>'; };
      o.push(B('M30 120 L572 120'));
      o.push(B('M200 22 C210 60 190 90 205 120'));
      o.push(B('M330 120 C300 160 320 250 340 300 C350 330 360 350 370 382'));
      o.push(B('M30 230 C90 236 140 222 180 236 C220 250 250 230 300 224'));
      o.push(B('M210 236 L220 382'));
      o.push(B('M420 120 C440 170 400 200 430 250 C450 290 520 300 568 300', true));
      return { svg: frame(o.join(''), 'An invented continent with six numbered boundary lines, a straight line along a parallel, and two areas where one language group lives'),
        spots: [[pct(90, 120)], [pct(208, 66)], [pct(326, 210)], [pct(100, 232)], [pct(217, 330)], [pct(440, 220)]],
        labels: [], legend: [LEG.line, LEG.relict, LEG.hatch] };
    },
    diffusion: function(){
      var o = [], nodes = [[300, 52], [150, 170], [450, 170], [340, 300], [450, 300], [560, 300]];
      var L = function(a, b){ return '<path d="M' + nodes[a][0] + ' ' + (nodes[a][1] + 26) + 'L' + nodes[b][0] + ' ' + (nodes[b][1] - 26) + '" stroke="' + COL.line + '" stroke-width="2.5"/>'; };
      o.push(L(0, 1) + L(0, 2) + L(2, 3) + L(2, 4) + L(2, 5));
      nodes.forEach(function(n, i){ o.push('<rect x="' + (n[0] - (i ? 36 : 64)) + '" y="' + (n[1] - 26) + '" width="' + (i ? 72 : 128) + '" height="52" rx="10" fill="' + (i ? COL.z[i % 4] : COL.z[0]) + '" stroke="' + COL.line + '" stroke-width="1.5"/>'); });
      return { svg: frame(o.join(''), 'A tree of diffusion types: one box at the top branches into two, and the right one branches into three'),
        spots: [[pct(150, 170)], [pct(450, 170)], [pct(340, 300)], [pct(450, 300)], [pct(560, 300)]],
        labels: [{ x: 50, y: 13, text: 'Diffusion' }], legend: [] };
    },
    leastcost: function(){
      var o = [];
      o.push('<rect width="600" height="400" fill="' + COL.land + '"/>');
      o.push('<path d="M0 352 C150 330 450 330 600 352V400H0Z" fill="' + COL.water + '" stroke="' + COL.waterLine + '" stroke-width="2"/>');
      o.push(rail('M110 110 L490 110')); o.push(rail('M110 110 L300 318')); o.push(rail('M490 110 L300 318'));
      o.push('<path d="M70 120 L110 70 L150 120Z" fill="#8C7B65" stroke="' + COL.line + '" stroke-width="1.5"/><path d="M96 120 l14 -18 14 18z" fill="#3A3631"/>');
      o.push('<g fill="' + COL.z[2] + '" stroke="' + COL.line + '" stroke-width="1.5"><rect x="456" y="72" width="22" height="48"/><rect x="480" y="56" width="26" height="64"/><rect x="508" y="84" width="20" height="36"/></g>');
      o.push('<path d="M270 312 H330 L320 330 H280Z" fill="#5E8FB0" stroke="' + COL.line + '" stroke-width="1.5"/><path d="M300 312 V290 H316" fill="none" stroke="' + COL.line + '" stroke-width="2"/>');
      return { svg: frame(o.join(''), 'Least cost theory: a mine, a market city and a port, joined by rail lines'),
        spots: [[pct(110, 172)], [pct(490, 172)], [pct(300, 252)]],
        labels: [{ x: 18.3, y: 12, text: 'Mine' }, { x: 81.7, y: 8, text: 'Market' }, { x: 64, y: 80, text: 'Port' }], legend: [LEG.rail, LEG.water] };
    },
    /* The demographic transition: birth and death rates over five stages,
       one column a stage (the drawing for a `stages` model). */
    dtm: function(){
      var o = [], X0 = 40, X1 = 580, Y0 = 360, T = 40, w = (X1 - X0) / 5;
      for(var i = 0; i < 5; i++) o.push('<rect x="' + (X0 + w * i) + '" y="' + T + '" width="' + w + '" height="' + (Y0 - T) + '" fill="' + (i % 2 ? '#F6F3EC' : '#FFFFFF') + '"/>');
      for(var j = 1; j < 5; j++) o.push('<path d="M' + (X0 + w * j) + ' ' + T + 'V' + Y0 + '" stroke="#B9B3A8" stroke-width="1.2" stroke-dasharray="4 4"/>');
      o.push('<path d="M' + X0 + ' ' + T + 'V' + Y0 + 'H' + X1 + '" fill="none" stroke="' + COL.ink + '" stroke-width="2.5"/>');
      var birth = 'M40 92 L148 90 C210 90 240 96 256 110 C300 160 330 250 364 270 C400 290 440 288 472 290 C510 292 540 300 580 304';
      var death = 'M40 100 C80 110 110 96 148 104 C190 160 220 240 256 262 C300 284 330 290 364 292 C400 294 440 292 472 290 C510 286 540 276 580 272';
      var pop = 'M40 340 C100 338 140 336 148 334 C200 316 240 270 256 250 C300 200 330 170 364 158 C420 142 460 140 472 140 C520 142 550 148 580 152';
      o.push('<path d="' + pop + '" fill="none" stroke="#7A4F9E" stroke-width="3" stroke-dasharray="2 6" stroke-linecap="round"/>');
      o.push('<path d="' + birth + '" fill="none" stroke="' + COL.accent + '" stroke-width="4"/>');
      o.push('<path d="' + death + '" fill="none" stroke="#B5481F" stroke-width="4" stroke-dasharray="12 6"/>');
      var spots = []; for(var k = 0; k < 5; k++) spots.push([pct(X0 + w * (k + 0.5), 22)]);
      return { svg: frame(o.join(''), 'Demographic transition model: birth rate and death rate across five stages, with total population rising'),
        spots: spots, labels: [], legend: [{ sw: 'birth', text: 'Birth rate' }, { sw: 'death', text: 'Death rate' }, { sw: 'pop', text: 'Total population' }] };
    }
  };
  var figCache = {};
  function figure(id){
    if(!FIGS[id]) return null;
    if(!figCache[id]) figCache[id] = FIGS[id]();
    return figCache[id];
  }
  /* The label boxes over a figure drawn `px` wide: a slot number is a 30 px
     badge; a label is about 8 px a character plus 14 px of padding, 24 px
     tall. Returns the pairs that touch (or would leave the picture). */
  function overlaps(fig, px){
    var k = px / W, hpx = H * k, boxes = [], out = [];
    (fig.spots || []).forEach(function(list, i){ list.forEach(function(p){ var x = p[0] / 100 * px, y = p[1] / 100 * hpx; boxes.push({ t: 'spot ' + (i + 1), b: [x - 17, y - 17, x + 17, y + 17] }); }); });
    (fig.labels || []).forEach(function(l){ var w = String(l.text).length * 8 + 14, x = l.x / 100 * px, y = l.y / 100 * hpx; boxes.push({ t: 'label "' + l.text + '"', b: [x - w / 2, y - 12, x + w / 2, y + 12] }); });
    boxes.forEach(function(a, i){
      if(a.b[0] < -2 || a.b[1] < -2 || a.b[2] > px + 2 || a.b[3] > hpx + 2) out.push(a.t + ' leaves the picture at ' + px + ' px');
      boxes.slice(i + 1).forEach(function(c){ if(a.b[0] < c.b[2] && c.b[0] < a.b[2] && a.b[1] < c.b[3] && c.b[1] < a.b[3]) out.push(a.t + ' and ' + c.t + ' touch at ' + px + ' px'); });
    });
    return out;
  }

  /* ------------------------------------------------------------ build */
  /* The model a student builds: the context's model (or one generated from
     numbers: rank-size, gravity), its pieces shuffled with up to two decoys
     from the pool; a decoy's own reason becomes a slip on every place. */
  function buildModel(r, ctx){
    var g = GEN[ctx.build] ? GEN[ctx.build](r, ctx) : null;
    var base = g || ctx.model;
    var m = JSON.parse(JSON.stringify(base));
    var room = Math.max(0, Math.min(2, m.slots.length + 3 - m.pieces.length));
    var decoys = M.shuffle(r, (g && g.decoys) || ctx.decoys || []).slice(0, room);
    m.slips = (m.slips || []).slice();
    decoys.forEach(function(d){
      m.pieces.push({ id: d.id, text: d.text });
      if(d.why) m.slots.forEach(function(s){ m.slips.push({ piece: d.id, slot: s.id, why: d.why }); });
    });
    m.pieces = M.shuffle(r, m.pieces);
    delete m.decoys;
    return m;
  }
  var GEN = {
    /* Rank-size: the largest city L (thousands) and the rule's 1/n for ranks 1-4. */
    ranksize: function(r, ctx){
      var L = r.pick([1200, 2400, 3600, 4800]), C = Calc();
      var slots = [1, 2, 3, 4].map(function(n){ return { id: 'r' + n, name: n === 1 ? 'Rank 1 (largest city)' : 'Rank ' + n }; });
      var pieces = [1, 2, 3, 4].map(function(n){ return { id: 'c' + n, text: 'City of ' + thou(1000 * C.evaluate({ fn: 'rankSize', args: [L, n] })) }; });
      var key = {}; [1, 2, 3, 4].forEach(function(n){ key['r' + n] = 'c' + n; });
      return { layout: 'tiers', title: 'Rank-size rule: cities of Country ' + r.pick(['K', 'L', 'N']) + ' (invented)', slots: slots, pieces: pieces, key: key, L: L,
        decoys: [{ id: 'c5', text: 'City of ' + thou(1000 * C.evaluate({ fn: 'rankSize', args: [L, 5] })), why: 'That is the size the rule gives the city ranked 5: one fifth of the largest.' },
          { id: 'cx', text: 'City of ' + thou(1000 * C.evaluate({ fn: 'mul', args: [L, 2 / 3] })), why: 'The rule divides the largest city by its rank, so no city here is two thirds of it.' }] };
    },
    /* Gravity: three pairs of towns (populations in millions, distance in
       hundreds of km), ranked by P1 × P2 ÷ d², with clear gaps between them. */
    gravity: function(r, ctx){
      var C = Calc(), pairs, guard = 0;
      do {
        pairs = ['A', 'B', 'C'].map(function(n){ var p1 = r.int(2, 9), p2 = r.int(1, 6), d = r.int(1, 4); return { n: n, p1: p1, p2: p2, d: d, v: C.evaluate({ fn: 'gravity', args: [p1, p2, d] }) }; });
        var s = pairs.map(function(p){ return p.v; }).sort(function(a, b){ return b - a; });
      } while(guard++ < 200 && !(s[0] >= 1.4 * s[1] && s[1] >= 1.4 * s[2]));
      var order = pairs.slice().sort(function(a, b){ return b.v - a.v; });
      var names = ['Most interaction', 'Middle', 'Least interaction'];
      return { layout: 'tiers', title: 'Gravity model: three pairs of towns (invented)', pairs: pairs,
        slots: names.map(function(t, i){ return { id: 't' + i, name: t }; }),
        pieces: pairs.map(function(p){ return { id: 'p' + p.n, text: 'Pair ' + p.n + ': ' + p.p1 + ' and ' + p.p2 + ' million, ' + (100 * p.d) + ' km' }; }),
        key: { t0: 'p' + order[0].n, t1: 'p' + order[1].n, t2: 'p' + order[2].n }, decoys: [] };
    }
  };

  /* ------------------------------------------------------------ steps */
  function choiceFrom(right, wrongs, extra){
    var o = { kind: 'choice', options: [right.t].concat(wrongs.map(function(w){ return w.t; })), correct: 0,
      why: ['Yes. ' + right.why].concat(wrongs.map(function(w){ return 'Not this one. ' + w.why; })) };
    Object.keys(extra || {}).forEach(function(k){ o[k] = extra[k]; });
    return o;
  }
  function pool(r, item){ return M.shuffle(r, item.wrong).slice(0, 3); }
  function limitsStep(r, ctx){
    var L = ctx.limits, right = r.pick(L.right);
    var wrong = M.shuffle(r, L.claims.map(function(t){ return { t: t, why: 'That is what the model says, not a limit of it.' }; }).concat(L.wrong)).slice(0, 3);
    return choiceFrom(right, wrong, { key: 'limits', fig: 'build', practice: '1.E', level: 'analyze',
      label: '<b>Find a limit.</b> Which statement is a limitation of the ' + esc(ctx.name.charAt(0).toLowerCase() + ctx.name.slice(1)) + '?' });
  }
  function numStep(key, label, answer, mistakes, d, unit, rel){
    var ms = (mistakes || []).slice();
    if(answer) ms.push({ value: -answer, why: 'The size is right but the sign is wrong.' });
    return { kind: 'num', key: key, label: label, cell: M.cell(answer, rel == null ? 0.005 : rel, ms, d != null ? Math.pow(10, -d) / 2 : 0), d: d, unit: unit, practice: '3.B', level: 'apply', fig: 'apply' };
  }

  /* Apply: (r, ctx) -> { fig, steps, say }. fig: { kind: 'map', map } | { kind: 'plot', spec } |
     { kind: 'table', cols, rows, caption } | null (the build figure stays). */
  var APPLY = {
    /* An authored case: one item from the pool (its map, or the build figure). */
    choice: function(r, ctx){
      var it = r.pick(ctx.apply.pool), st = choiceFrom(it.right, pool(r, it), { key: 'apply', practice: it.practice || '1.D', level: 'apply', label: '<b>Apply it.</b> ' + it.q });
      st.fig = it.map ? 'apply' : 'build';
      return { fig: it.map ? { kind: 'map', map: it.map } : null, steps: [st], say: it.right.t };
    },
    /* Demographic transition: an invented country's rates. */
    rates: function(r, ctx){
      var C = Calc(), stage = r.int(1, 5), b, d;
      if(stage === 1){ b = r.int(38, 46); d = r.int(28, Math.min(36, b - 2)); }
      else if(stage === 2){ b = r.int(36, 46); d = r.int(10, 17); }
      else if(stage === 3){ b = r.int(20, 28); d = r.int(6, 10); }
      else if(stage === 4){ d = r.int(8, 11); b = d + r.int(0, 3); }
      else { d = r.int(10, 13); b = d - r.int(1, 3); }
      var got = C.transitionStage({ cbr: b, cdr: d }).stage;
      if(got !== stage) throw new Error('model-studio: rates ' + b + '/' + d + ' fall in stage ' + got + ', not ' + stage);
      var name = r.pick(COUNTRIES), rni = C.evaluate({ fn: 'rni', args: [b, d] });
      var spec = { kind: 'bar', label: name + ' (invented data): crude birth rate ' + b + ' and crude death rate ' + d + ' per 1,000 people', categories: ['Birth rate', 'Death rate'], values: [b, d], y: [0, 50], yStep: 10, yLabel: 'per 1,000 people' };
      var why = ['both rates are high', 'the birth rate is high but the death rate has fallen', 'the birth rate is falling toward a low death rate', 'both rates are low and close together', 'deaths outnumber births'];
      var claim = ['Stage 1 has high birth and death rates', 'Stage 2 has a high birth rate and a falling death rate', 'Stage 3 has a falling birth rate and a low death rate', 'Stage 4 has low birth and death rates', 'Stage 5 has fewer births than deaths'];
      var opts = [1, 2, 3, 4, 5].map(function(n){ return 'Stage ' + n; });
      var st1 = { kind: 'choice', key: 'apply', fig: 'apply', practice: '2.B', level: 'apply', fixed: true, options: opts, correct: stage - 1,
        why: opts.map(function(o, i){ return i === stage - 1 ? 'Yes. With a birth rate of ' + b + ' and a death rate of ' + d + ', ' + why[i] + ': the data are consistent with stage ' + stage + '.' : 'Not this one. ' + claim[i] + ', but here ' + why[stage - 1] + '.'; }),
        label: '<b>Apply it.</b> ' + name + ' (invented) has a crude birth rate of ' + b + ' and a crude death rate of ' + d + ' per 1,000 people. Which stage of the model are these data consistent with?' };
      var st2 = numStep('rate', '<b>Now the growth.</b> What is ' + name + '’s rate of natural increase (RNI), as a percent?', rni,
        [{ value: b - d, why: 'That is the gap per 1,000 people. RNI is a percent: divide it by 10.' }, { value: (b + d) / 10, why: 'RNI is births minus deaths, not births plus deaths.' }], 1, '%');
      return { fig: { kind: 'plot', spec: spec }, steps: [st1, st2], say: 'stage ' + stage + ', RNI ' + M.fixed(rni, 1) + '%' };
    },
    /* Epidemiological transition: invented causes of death and life expectancy. */
    epi: function(r, ctx){
      var stage = r.int(1, 4), inf, le;
      if(stage === 1){ inf = r.int(58, 70); le = r.int(25, 35); }
      else if(stage === 2){ inf = r.int(36, 48); le = r.int(42, 52); }
      else if(stage === 3){ inf = r.int(10, 20); le = r.int(62, 70); }
      else { inf = r.int(3, 7); le = r.int(80, 84); }
      var name = r.pick(COUNTRIES), names = ['Stage 1: pestilence and famine', 'Stage 2: receding pandemics', 'Stage 3: degenerative and human-made diseases', 'Stage 4: delayed degenerative diseases'];
      var why = ['infections and famine cause most deaths and lives are short', 'infections still cause many deaths, but fewer than before, and life expectancy is rising', 'chronic diseases such as heart disease and cancer cause most deaths, and life expectancy is in the 60s', 'chronic diseases cause most deaths, but at much older ages: life expectancy is over 80'];
      return { fig: { kind: 'table', cols: ['Measure', 'Value'], rows: [['Share of deaths from infectious diseases', inf + '%'], ['Life expectancy at birth', le + ' years']], caption: name + ' (invented data for practice)' },
        steps: [{ kind: 'choice', key: 'apply', fig: 'apply', practice: '3.B', level: 'apply', fixed: true, options: names, correct: stage - 1,
          why: names.map(function(n, i){ return i === stage - 1 ? 'Yes. Here ' + why[i] + '.' : 'Not this one. In ' + n.split(':')[0].toLowerCase() + ', ' + why[i] + '; these data do not show that.'; }),
          label: '<b>Apply it.</b> Read the table for ' + name + ' (invented). Which stage of the epidemiological transition do these data fit best?' }],
        say: names[stage - 1] };
    },
    /* Malthus: invented indexes of population and food output, 1960 = 100. */
    malthus: function(r, ctx){
      var gp = r.between(0.14, 0.22, 2), faster = r() < 0.5, years = [], pop = [], food = [], a;
      if(!faster) a = Math.round(100 * (Math.pow(1 + gp, 6) - 1) / 6 * r.between(0.45, 0.65, 2));
      for(var k = 0; k <= 6; k++){
        years.push(1960 + 10 * k);
        pop.push(Math.round(100 * Math.pow(1 + gp, k)));
        food.push(faster ? Math.round(100 * Math.pow(1 + gp + 0.07, k)) : 100 + a * k);
      }
      var name = r.pick(COUNTRIES), last = pop.length - 1;
      var spec = { kind: 'line', label: name + ' (invented data): population and food output as indexes, 1960 = 100, from 1960 to 2020', yLabel: 'Index (1960 = 100)', xLabel: 'Year',
        series: [{ name: 'Population', points: years.map(function(y, i){ return [y, pop[i]]; }) }, { name: 'Food output', points: years.map(function(y, i){ return [y, food[i]]; }), dashed: true }] };
      var fit = food[last] < pop[last];
      var A = { t: 'Yes: population grew faster than food output', why: 'Population reached ' + pop[last] + ' and food output only ' + food[last] + ', the squeeze Malthus predicted.' };
      var B = { t: 'No: food output grew faster than population', why: 'Food output reached ' + food[last] + ' and population ' + pop[last] + ': output kept ahead, as critics of Malthus point out.' };
      var right = fit ? A : B, other = fit ? B : A;
      return { fig: { kind: 'plot', spec: spec }, steps: [choiceFrom(right, [{ t: other.t, why: 'Compare the two lines in 2020: ' + (fit ? 'population' : 'food output') + ' ended higher.' },
        { t: 'Yes: food and population grew at the same rate', why: 'The lines end at ' + pop[last] + ' and ' + food[last] + ', so they did not grow at the same rate.' },
        { t: 'No: population fell over the period', why: 'Population rose from 100 to ' + pop[last] + '.' }],
        { key: 'apply', fig: 'apply', practice: '3.C', level: 'analyze', label: '<b>Apply it.</b> Do these invented data for ' + name + ' match what Malthus predicted?' })], say: right.t, fit: fit, last: [pop[last], food[last]] };
    },
    /* Ravenstein: invented migration data for Country A. */
    ravenstein: function(r, ctx){
      var name = r.pick(COUNTRIES);
      if(r() < 0.5){
        var v = [r.int(110, 150)], cats = ['Under 50 km', '50 to 199 km', '200 to 499 km', '500 km or more'];
        for(var i = 1; i < 4; i++) v.push(Math.round(v[i - 1] * r.between(0.35, 0.6, 2)));
        var spec = { kind: 'bar', label: name + ' (invented data): migrants by distance moved, falling from ' + v[0] + ' thousand under 50 km to ' + v[3] + ' thousand at 500 km or more', categories: cats, values: v, yLabel: 'Migrants (thousands)' };
        return { fig: { kind: 'plot', spec: spec }, data: { kind: 'distance', v: v }, steps: [choiceFrom({ t: 'Most migrants move only a short distance', why: 'The tallest bar is the shortest distance, and each longer distance has fewer migrants.' },
          [{ t: 'Each flow produces a counterflow', why: 'That law is real, but this chart shows distances, not flows in both directions.' },
            { t: 'Most migrants move to another continent', why: 'The chart shows the fewest migrants at the longest distance.' },
            { t: 'Long-distance migrants go to farm villages', why: 'Ravenstein said long-distance migrants go to big cities, and this chart does not show where they go.' }],
          { key: 'apply', fig: 'apply', practice: '3.B', level: 'apply', label: '<b>Apply it.</b> Which of Ravenstein’s laws do these invented data for ' + name + ' support?' })], say: 'most moves are short' };
      }
      var city = 'City ' + r.pick(['M', 'Q', 'V']), inn = [], out = [], years = ['Year 1', 'Year 2', 'Year 3'];
      for(var j = 0; j < 3; j++){ inn.push(r.int(40, 70)); out.push(Math.round(inn[j] * r.between(0.4, 0.7, 2))); }
      var spec2 = { kind: 'bar', label: city + ' (invented data): people who moved in and people who moved out in each of three years', categories: years, series: [{ name: 'Moved in', values: inn }, { name: 'Moved out', values: out }], yLabel: 'People (thousands)' };
      return { fig: { kind: 'plot', spec: spec2 }, data: { kind: 'counter', inn: inn, out: out }, steps: [choiceFrom({ t: 'Each migration flow produces a counterflow', why: 'Every year many people moved out of ' + city + ' as others moved in.' },
        [{ t: 'Most migrants move only a short distance', why: 'That law is real, but this chart shows flows in and out, not distances.' },
          { t: 'Migrants never leave a city once they arrive', why: 'The chart shows thousands moving out of ' + city + ' each year.' },
          { t: 'More people leave the city than arrive', why: 'Each year the "moved in" bar is taller than the "moved out" bar.' }],
        { key: 'apply', fig: 'apply', practice: '3.B', level: 'apply', label: '<b>Apply it.</b> Which of Ravenstein’s laws do these invented data for ' + city + ' support?' })], say: 'each flow has a counterflow' };
    },
    /* Bid-rent: four land uses bid for land; the highest bid wins. */
    bidrent: function(r, ctx){
      var C = Calc(), uses, d, bids, best, guard = 0;
      do {
        uses = [{ n: 'Retail and offices', a: r.int(95, 110), b: r.int(28, 34) }, { n: 'Industry', a: r.int(66, 74), b: r.int(11, 14) }, { n: 'Housing', a: r.int(42, 48), b: r.int(4, 6) }, { n: 'Farming', a: r.int(16, 20), b: 1 }];
        d = r.pick([0.5, 1, 2, 3, 5, 7, 8]);
        bids = uses.map(function(u){ return C.evaluate({ fn: 'sub', args: [u.a, { fn: 'mul', args: [u.b, d] }] }); });
        var s = bids.slice().sort(function(x, y){ return y - x; });
        best = bids.indexOf(s[0]);
      } while(guard++ < 200 && !(s[0] - s[1] >= 4 && s[0] > 0));
      var series = uses.map(function(u){ var pts = []; for(var x = 0; x <= 9; x += 0.5){ var y = u.a - u.b * x; if(y >= 0) pts.push([x, r1(y)]); } return { name: u.n, points: pts }; });
      var spec = { kind: 'line', label: 'Bid-rent lines for four land uses in an invented city, from the CBD out to 9 km', x: [0, 9], y: [0, 120], xLabel: 'Distance from the CBD (km)', yLabel: 'Bid (rent per square meter)', series: series };
      var tbl = uses.map(function(u){ return u.n + ' bids ' + u.a + ' at the CBD and ' + u.b + ' less each km'; }).join('; ');
      var st1 = { kind: 'choice', key: 'apply', fig: 'apply', practice: '2.B', level: 'apply', fixed: true, options: uses.map(function(u){ return u.n; }), correct: best,
        why: uses.map(function(u, i){ return (i === best ? 'Yes. ' : 'Not this one. ') + u.n + ' bids ' + u.a + ' − ' + u.b + ' × ' + d + ' = ' + M.fmt(bids[i], 4) + (i === best ? ', the highest bid there.' : ', but ' + uses[best].n.toLowerCase() + ' bids ' + M.fmt(bids[best], 4) + '.'); }),
        label: '<b>Apply it.</b> In an invented city, ' + tbl + '. Which land use outbids the others ' + d + ' km from the CBD?' };
      var st2 = numStep('rent', '<b>Now the number.</b> What does the winning use bid there, in rent per square meter?', bids[best],
        [{ value: uses[best].a, why: 'That is the bid at the CBD. Subtract what it loses over ' + d + ' km.' }, { value: uses[best].a + uses[best].b * d, why: 'Bids fall with distance: subtract, do not add.' }], 1, null, 0.001);
      return { fig: { kind: 'plot', spec: spec }, steps: [st1, st2], uses: uses, d: d, say: uses[best].n + ' (' + M.fmt(bids[best], 4) + ')' };
    },
    /* Central place: the threshold a store needs, against market areas. */
    christaller: function(r, ctx){
      var pl = [{ n: 'Village', p: 1000 * r.int(2, 5) }, { n: 'Town', p: 1000 * r.int(15, 40) }, { n: 'City', p: 1000 * r.int(120, 300) }];
      var lvl = r.int(0, 2), lo = lvl ? pl[lvl - 1].p : 500, T = 1000 * Math.round(r.between(lo * 1.3, pl[lvl].p * 0.8, 3) / 1000);
      if(T <= lo) T = lo + 1000;
      var good = ['a small grocery', 'a shoe store', 'a specialist hospital'][lvl];
      return { fig: { kind: 'table', cols: ['Place', 'People in its market area'], rows: pl.map(function(x){ return [x.n, thou(x.p)]; }), caption: 'An invented region (invented data for practice)' }, T: T, pl: pl,
        steps: [{ kind: 'choice', key: 'apply', fig: 'apply', practice: '2.B', level: 'apply', fixed: true, options: pl.map(function(x){ return x.n; }), correct: lvl,
          why: pl.map(function(x, i){ return i === lvl ? 'Yes. ' + x.n + ' has ' + thou(x.p) + ' people in its market area, at least the ' + thou(T) + ' the store needs, and ' + (lvl ? 'the ' + pl[lvl - 1].n.toLowerCase() + ' has too few.' : 'it is the smallest place.') : x.p < T ? 'Not this one. ' + thou(x.p) + ' people is below the threshold of ' + thou(T) + '.' : 'Not this one. ' + x.n + ' could support it, but a smaller place can too: the question asks for the smallest.'; }),
          label: '<b>Apply it.</b> ' + good.charAt(0).toUpperCase() + good.slice(1) + ' needs at least ' + thou(T) + ' people in its market area to stay open (its threshold). Which is the smallest place in the table that can support it?' }],
        say: pl[lvl].n };
    },
    /* Rank-size or primate: invented city sizes, and the rule's number. */
    ranksize: function(r, ctx){
      var C = Calc(), L = r.pick([1200, 2400, 3600, 4800]), primate = r() < 0.5, pops = [L];
      for(var n = 2; n <= 5; n++) pops.push(primate ? Math.round(L / r.int(4, 6) / n * 2 / 10) * 10 : Math.round(L / n * r.between(0.95, 1.05, 3) / 10) * 10);
      if(primate) pops = [L].concat(pops.slice(1).sort(function(a, b){ return b - a; }));
      var name = r.pick(COUNTRIES), cats = pops.map(function(p, i){ return 'Rank ' + (i + 1); });
      var spec = { kind: 'bar', label: name + ' (invented data): populations of its five largest cities, in thousands, largest ' + thou(L) + ' thousand', categories: cats, values: pops, yLabel: 'People (thousands)' };
      var R = { t: primate ? 'A primate city: the largest is far bigger than the rest' : 'The rank-size rule: each city is about 1/n of the largest', why: primate ? 'The largest city has ' + thou(pops[0]) + ' thousand people, more than three times the second (' + thou(pops[1]) + ' thousand).' : 'The second city is about half the largest, the third about a third, and so on.' };
      var Wr = [{ t: primate ? 'The rank-size rule: each city is about 1/n of the largest' : 'A primate city: the largest is far bigger than the rest', why: primate ? 'By the rule the second city would be about ' + thou(L / 2) + ' thousand, but it is only ' + thou(pops[1]) + ' thousand.' : 'The largest is only about twice the second, as the rule expects.' },
        { t: 'All the cities are about the same size', why: 'The bars fall from ' + thou(pops[0]) + ' to ' + thou(pops[4]) + ' thousand.' },
        { t: 'Smaller cities have higher ranks than larger ones', why: 'Rank 1 is the largest city, and size falls as the rank number rises.' }];
      var k = r.pick([3, 4]), want = C.evaluate({ fn: 'rankSize', args: [L, k] });
      var st2 = numStep('rule', '<b>Now the rule.</b> The largest city has ' + thou(L) + ' thousand people. By the rank-size rule, how many people would the city ranked ' + k + ' have, in thousands?', want,
        [{ value: L * k, why: 'The rule divides by the rank: the city ranked ' + k + ' has 1/' + k + ' of the largest.' }, { value: L - L / k, why: 'Divide the largest city by the rank; do not subtract.' }, { value: L / (k - 1), why: 'That is the city ranked ' + (k - 1) + '. Divide by ' + k + '.' }], 0, 'thousand');
      st2.practice = '3.B';
      return { fig: { kind: 'plot', spec: spec }, steps: [choiceFrom(R, Wr, { key: 'apply', fig: 'apply', practice: '3.C', level: 'analyze', label: '<b>Apply it.</b> Which pattern do these invented data for ' + name + ' show?' }), st2], primate: primate, pops: pops, L: L, k: k, say: R.t };
    },
    /* Gravity: one pair's index, and what halving the distance does. */
    gravity: function(r, ctx, model){
      var C = Calc(), pr = model.pairs, p = r.pick(pr), v = C.evaluate({ fn: 'gravity', args: [p.p1, p.p2, p.d] });
      var st1 = numStep('apply', '<b>Apply it.</b> Work out the interaction index for Pair ' + p.n + ': P1 × P2 ÷ d², with populations in millions and the distance in hundreds of km.', v,
        [{ value: p.p1 * p.p2 / p.d, why: 'Square the distance before you divide: d², not d.' }, { value: p.p1 * p.p2 * p.d * p.d, why: 'Divide by the distance squared; interaction falls with distance.' }, { value: p.p1 * p.p2, why: 'You left out the distance. Divide by d².' }], 2, null, 0.01);
      st1.fig = 'build';
      var st2 = choiceFrom({ t: 'It becomes 4 times as large', why: 'Interaction falls with the square of distance, so half the distance gives (1/2)² in the divisor: 4 times the interaction.' },
        [{ t: 'It doubles', why: 'Distance is squared in the model, so halving it does more than double the interaction.' }, { t: 'It falls by half', why: 'A shorter distance raises interaction; it does not lower it.' }, { t: 'It stays the same', why: 'Distance is in the model, so changing it changes the interaction.' }],
        { key: 'apply2', fig: 'build', practice: '1.D', level: 'apply', label: '<b>And then.</b> A new highway halves the travel distance for Pair ' + p.n + '. What happens to the interaction the model predicts?' });
      return { fig: null, steps: [st1, st2], p: p, say: 'index ' + M.fmt(v, 3) };
    },
    /* Least cost: ship the ore or ship the product. */
    leastcost: function(r, ctx){
      var C = Calc(), losing = r() < 0.5, D = 50 * r.int(2, 8), c = r.int(1, 4);
      var inW = losing ? r.int(3, 6) : r.pick([0.2, 0.4, 0.5]), outW = 1;
      var shipIn = C.evaluate({ fn: 'mul', args: [inW, D, c] }), shipOut = C.evaluate({ fn: 'mul', args: [outW, D, c] });
      var what = losing ? 'A copper smelter turns ' + inW + ' tons of ore from the mine into 1 ton of copper.' : 'A bottling plant turns ' + inW + ' tons of syrup from the mine region’s factory into 1 ton of drinks by adding local water.';
      var st1 = numStep('apply', '<b>Apply it.</b> ' + what + ' The mine and the market are ' + D + ' km apart, and rail freight costs $' + c + ' per ton per km. What does it cost to ship the inputs for 1 ton of product from the mine to a plant at the market, in dollars?', shipIn,
        [{ value: shipOut, why: 'That is the cost of shipping the finished ton. Here you ship the inputs: ' + inW + ' tons.' }, { value: inW * D, why: 'Multiply by the freight rate too: $' + c + ' per ton per km.' }, { value: inW * c, why: 'Multiply by the distance too: ' + D + ' km.' }], 0, 'dollars');
      var near = shipIn > shipOut;
      var st2 = choiceFrom({ t: near ? 'Near the mine, where the raw material is' : 'In the market city', why: near ? 'Shipping the inputs costs $' + thou(shipIn) + ' but the product only $' + thou(shipOut) + ': the process loses weight, so it locates near the raw material.' : 'The inputs cost $' + thou(shipIn) + ' to ship but the product $' + thou(shipOut) + ': the process gains weight, so it locates near the market.' },
        [{ t: near ? 'In the market city' : 'Near the mine, where the raw material is', why: 'Compare the two shipping costs: $' + thou(shipIn) + ' for the inputs and $' + thou(shipOut) + ' for the product.' },
          { t: 'Halfway between the two', why: 'Least cost theory puts the plant where total transport cost is lowest, here at one end of the route.' },
          { t: 'Wherever land is most expensive', why: 'The model minimizes costs; expensive land raises them.' }],
        { key: 'apply2', fig: 'build', practice: '2.C', level: 'analyze', label: '<b>And then.</b> Where does least cost theory expect this plant to locate?' });
      return { fig: null, steps: [st1, st2], losing: losing, D: D, c: c, inW: inW, say: near ? 'near the mine' : 'at the market' };
    },
    /* World system: three invented countries; which fits a tier. Then commodity dependence. */
    worldsystem: function(r, ctx){
      var C = Calc(), tiers = M.shuffle(r, ['core', 'semi', 'periphery']), names = ['Country P', 'Country Q', 'Country R'], rows = [];
      var gen = { core: function(){ return [r.int(5, 15), r.int(30, 45), r.int(25, 40)]; }, semi: function(){ return [r.int(30, 45), r.int(10, 18), r.int(10, 18)]; }, periphery: function(){ return [r.int(70, 90), r.int(1, 4), r.int(0, 3)]; } };
      var vals = tiers.map(function(t){ return gen[t](); });
      names.forEach(function(n, i){ rows.push([n, vals[i][0] + '%', '$' + vals[i][1], vals[i][2] + '%']); });
      var ask = r.pick(['periphery', 'core']), idx = tiers.indexOf(ask), word = ask === 'core' ? 'the core' : 'the periphery';
      var st1 = { kind: 'choice', key: 'apply', fig: 'apply', practice: '3.C', level: 'analyze', fixed: true, options: names.slice(), correct: idx,
        why: names.map(function(n, i){ return (i === idx ? 'Yes. ' : 'Not this one. ') + n + ' gets ' + vals[i][0] + '% of its exports from raw materials, pays about $' + vals[i][1] + ' an hour and sells ' + vals[i][2] + '% high-tech goods' + (i === idx ? ', the pattern of ' + word + '.' : ', which does not fit ' + word + ' best.'); }),
        label: '<b>Apply it.</b> Read the table of invented countries. Which country’s data fit ' + word + ' of the world system best?' };
      var share = r.int(70, 85), total = 10 * r.int(2, 9), crop = r.pick(['coffee', 'cocoa', 'copper', 'cotton']);
      var one = C.evaluate({ fn: 'mul', args: [total, share / 100] });
      var st2 = choiceFrom({ t: 'Its income rises and falls with one world price', why: crop.charAt(0).toUpperCase() + crop.slice(1) + ' brings in about $' + M.fmt(one, 3) + ' billion of $' + total + ' billion, so a fall in its price cuts most export income: commodity dependence.' },
        [{ t: 'It has a large and varied industrial base', why: 'One raw material earning ' + share + '% of exports is the opposite of a varied economy.' },
          { t: 'It sets the world price of ' + crop, why: 'A single exporter that depends on one product usually takes the world price; it does not set it.' },
          { t: 'Its exports are protected from price swings', why: 'Depending on one product makes export income more exposed to price swings, not less.' }],
        { key: 'apply2', fig: 'apply', practice: '1.D', level: 'apply', label: '<b>And then.</b> In ' + names[tiers.indexOf('periphery')] + ', ' + crop + ' earns ' + share + '% of the country’s $' + total + ' billion in exports (invented). Which risk of commodity dependence does this bring?' });
      return { fig: { kind: 'table', cols: ['Country (invented)', 'Exports from raw materials', 'Average hourly wage', 'High-tech exports'], rows: rows, caption: 'Three invented countries (invented data for practice)' },
        steps: [st1, st2], tiers: tiers, vals: vals, ask: ask, say: names[idx] + ' fits ' + word };
    }
  };

  /* A problem for ApHugTools.drill. */
  function generate(r, ctx, type){
    var model = buildModel(r, ctx);
    var build = { kind: 'model', key: 'build', fig: 'build', practice: '1.A', level: 'apply', model: model,
      label: '<b>Build it.</b> Put each piece of the ' + esc(ctx.name.charAt(0).toLowerCase() + ctx.name.slice(1)) + ' in its place.' + (model.pieces.length > model.slots.length ? ' Some pieces do not belong.' : '') };
    var ap = APPLY[ctx.apply.kind](r, ctx, model);
    var lim = limitsStep(r, ctx);
    var steps = [build].concat(ap.steps, [lim]);
    var keyText = model.slots.map(function(s, i){ return Mdl().slotName(model, i) + ': ' + plain(Mdl().pieceText(model, model.key[s.id])); }).join('; ');
    var lt = lim.options[lim.correct];
    return {
      ctx: ctx.id, topic: ctx.topic, type: (ctx.types || [ctx.id])[0], title: ctx.name, apply: ap,
      text: '<p>Build the ' + esc(ctx.name.charAt(0).toLowerCase() + ctx.name.slice(1)) + ', apply it to a case, then find one of its limits.</p>',
      steps: steps,
      figs: { build: { kind: 'model', figure: ctx.figure || null }, apply: ap.fig },
      solution: ['<b>The model.</b> ' + esc(keyText) + '.', '<b>The case.</b> ' + esc(ap.say) + '.', '<b>A limit.</b> ' + esc(lt) + '.']
    };
  }

  var TYPES = ['dtm', 'epidemiological', 'malthus', 'ravenstein', 'diffusion', 'boundaries', 'von-thunen', 'bid-rent', 'rank-size', 'gravity', 'central-place', 'burgess', 'hoyt', 'multiple-nuclei', 'galactic', 'latin-american', 'southeast-asian', 'african', 'least-cost', 'rostow', 'world-system'];
  M.register('modelStudio', { TYPES: TYPES, generate: generate, buildModel: buildModel, figure: figure, figureIds: Object.keys(FIGS), overlaps: overlaps, APPLY: APPLY, GEN: GEN, limitsStep: limitsStep, W: W, H: H });
})(typeof window !== 'undefined' ? window : globalThis);
