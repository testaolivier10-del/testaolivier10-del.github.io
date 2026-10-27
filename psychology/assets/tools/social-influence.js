/* Social influence trainer page (docs/appsych-spec.md section 6). OWNED BY
   THIS TOOL ONLY (builder T4). Mounts into #app with ApPsychTools; the model
   is ApPsychMath.socialInfluence (psychology/assets/tools/math/social-influence.js),
   the content psychology/data/tools/social-influence.json (served filtered
   as assets/tool-data/social-influence.json). The frame is
   ApPsychTools.modes (Explore, then Test yourself) on the Tool Studio.

   Explore: four classic situations, each a scene you change and a graph of
   the published result it came from (the source under the graph; what
   later research found is in Why):
     Conformity   Asch's line task: a row of people at a table, a card with
                  a standard line and three choices. Change how many give
                  the wrong answer first, or add one partner who answers
                  right; the graph is the percent of answers that went along
                  at each majority size Asch tested (no in-between sizes are
                  made up).
     Obedience    Milgram's lab: the teacher at the shock generator, the
                  experimenter in a gray coat, the learner. Pick a condition
                  (the learner's distance, the experimenter's presence, peers
                  who refuse, an office downtown) and see the percent who
                  went to the last switch.
     Bystanders   Darley and Latane's intercom study: a person in a booth
                  hears someone have a seizure; set how many others they
                  believe can hear it.
     Groups       an audience (pool players watched or not: social
                  facilitation) and pooled effort (shouting alone or in a
                  group: social loafing).
   Every number on a graph is a published result with its source; every
   person in a scene is an illustration. Test yourself: ApPsychTools.drill
   over the model's generate(): invented scenarios, predict then name the
   concept, then what later research found. */
(function(){
  'use strict';
  var T = window.ApPsychTools, M = window.ApPsychMath;
  if(!T || !M || !M.socialInfluence || M.socialInfluence.stub) return;
  var D = M.socialInfluence, esc = T.esc;
  var SITS = [{ v: 'conform', label: 'Conformity' }, { v: 'obey', label: 'Obedience' }, { v: 'bystand', label: 'Bystanders' }, { v: 'groups', label: 'Groups' }];
  var SIZES = [0, 1, 2, 3, 4, 8, 16];
  var SIZE_LAB = ['Alone', '1', '2', '3', '4', '8', '10 to 15'];

  var MEAS = null;
  function textW(t, size, weight){
    try{
      if(!MEAS) MEAS = document.createElement('canvas').getContext('2d');
      MEAS.font = (weight || 700) + ' ' + size + 'px ' + ((getComputedStyle(document.body).getPropertyValue('--font-ui') || '').trim() || 'sans-serif');
      return MEAS.measureText(String(t)).width;
    }catch(e){ return String(t).length * size * 0.56; }
  }
  function wrap(t, w, size){
    var words = String(t).split(' '), out = [], cur = '';
    words.forEach(function(x){ var n = cur ? cur + ' ' + x : x; if(textW(n, size, 700) > w && cur){ out.push(cur); cur = x; } else cur = n; });
    if(cur) out.push(cur); return out;
  }
  function pct(v){ return v < 1 ? '<1%' : Math.round(v) + '%'; }
  /* ---------------------------------------------------------- people
     person(o) -> svg: a flat illustrated figure standing (or sitting) on
     the floor at (x, y), o.h tall. Proportions follow age by head units (a
     toddler is about 4.5 heads tall, a 6-year-old about 5, an adult about
     7.5) so the figure looks its age. o: { x, y, h, age, pose, face, facing,
     look, shirt, pants, hair, skin, hairStyle, gray, glasses, build, prop }.
     Poses: stand, sit, write, baby (a sitting infant), reach, hold, point,
     phone, cross, cane, freeze, away. The props callback gets the hands. */
  var SKIN = ['#F2C9A5', '#D9A37A', '#B5774F', '#7D4E33'];
  var POSE = { // [elbow dx, dy, hand dx, dy] in arm lengths; dx toward the facing side
    stand: [[0.07, 0.5, 0.1, 0.98], [-0.07, 0.5, -0.1, 0.98]],
    reach: [[0.32, 0.24, 0.66, -0.06], [0.26, 0.3, 0.6, 0.02]],
    hold: [[0.06, 0.5, 0.42, 0.66], [0.02, 0.52, 0.36, 0.7]],
    point: [[0.42, 0.1, 0.94, 0.02], [-0.07, 0.5, -0.1, 0.98]],
    phone: [[0.06, 0.48, 0.32, 0.36], [0.02, 0.5, 0.28, 0.42]],
    cross: [[0.24, 0.46, -0.26, 0.4], [-0.2, 0.46, 0.26, 0.44]],
    cane: [[0.16, 0.46, 0.34, 0.82], [-0.07, 0.5, -0.1, 0.98]],
    write: [[0.22, 0.44, 0.66, 0.5], [0.16, 0.46, 0.58, 0.54]],
    sit: [[0.18, 0.46, 0.46, 0.64], [0.12, 0.48, 0.4, 0.68]],
    freeze: [[0.34, 0.36, 0.56, 0.66], [-0.3, 0.38, -0.52, 0.66]],
    away: [[-0.16, 0.48, -0.1, 0.96], [0.16, 0.48, 0.22, 0.92]]
  };
  function n1(v){ return Math.round(v * 10) / 10; }
  function person(o){
    var a = o.age == null ? 30 : o.age, h = o.h, x = o.x, y = o.y, fc = o.facing || 1, pose = o.pose || 'stand';
    if(pose === 'baby') return baby(o);
    var heads = a < 3 ? 4.4 : a < 7 ? 5.1 : a < 12 ? 5.9 : a < 16 ? 6.8 : 7.4;
    var seated = pose === 'sit' || pose === 'write';
    var HH = h / heads, R = HH * 0.54, fem = o.build === 'f';
    var skin = o.skin || SKIN[1], shirt = o.shirt || 'var(--si-shirt)', pants = o.pants || 'var(--si-pants)';
    var hair = o.gray ? (a >= 75 ? '#E6E2DA' : '#B3ACA2') : (o.hair || '#3B2A20');
    var sw = (a < 7 ? 0.78 : a < 12 ? 0.9 : a < 16 ? 1.0 : fem ? 0.98 : 1.12) * HH, hw = (a < 12 ? 0.68 : fem ? 0.92 : 0.8) * HH;
    var legW = (a < 7 ? 0.6 : 0.5) * HH, armW = (a < 7 ? 0.42 : 0.36) * HH, L = h * (a < 7 ? 0.33 : 0.37);
    var legFrac = a < 3 ? 0.36 : a < 7 ? 0.42 : a < 12 ? 0.45 : 0.47;
    var stoop = a >= 75 ? HH * 0.28 * fc : 0, g = [];
    var top = y - h, crotch = y - h * legFrac, shY = top + HH * 1.18, tl = crotch - shY;
    var seatY = y - h * 0.27;
    if(seated){ crotch = seatY; shY = seatY - tl; top = shY - HH * 1.18; }
    var hx = x + stoop, hcY = top + R + HH * 0.02, waist = shY + tl * 0.62;
    // far arm first (behind the body)
    var P = POSE[pose] || POSE.stand, shN = [hx + fc * sw * 0.84, shY + armW * 0.45], shF = [hx - fc * sw * 0.84, shY + armW * 0.45];
    function arm(sh, p){ return { s: sh, e: [sh[0] + fc * p[0] * L, sh[1] + p[1] * L], hand: [sh[0] + fc * p[2] * L, sh[1] + p[3] * L] }; }
    var far = arm(shF, P[1]), near = arm(shN, P[0]);
    g.push(limb(far, armW, shirt, skin, true));
    // legs
    if(seated){
      var thigh = h * 0.24, shinY = y - legW * 0.3;
      [-1, 1].forEach(function(s){
        var ox = s * hw * 0.32, kx = x + fc * thigh + ox * 0.4;
        g.push('<path d="M' + n1(x + ox) + ' ' + n1(crotch) + ' L' + n1(kx) + ' ' + n1(crotch) + ' L' + n1(kx + fc * HH * 0.05) + ' ' + n1(shinY) + '" fill="none" stroke="' + pants + '" stroke-width="' + n1(legW) + '" stroke-linecap="round" stroke-linejoin="round"' + (s < 0 ? ' class="si-far"' : '') + '/>');
        g.push(shoe(kx + fc * HH * 0.05, y, HH, fc));
      });
    } else {
      [-1, 1].forEach(function(s){
        var x0 = x + s * hw * 0.48, x1 = x + s * hw * 0.52 + (pose === 'away' ? s * HH * 0.18 : 0);
        g.push('<line x1="' + n1(x0) + '" y1="' + n1(crotch - HH * 0.1) + '" x2="' + n1(x1) + '" y2="' + n1(y - HH * 0.2) + '" stroke="' + pants + '" stroke-width="' + n1(legW) + '" stroke-linecap="round"/>');
        g.push(shoe(x1, y, HH, fc));
      });
    }
    // hips (pants) and torso (shirt)
    g.push('<path class="si-ol" d="M' + n1(x - hw) + ' ' + n1(waist) + ' L' + n1(x + hw) + ' ' + n1(waist) + ' L' + n1(x + hw * 0.98) + ' ' + n1(crotch) + ' L' + n1(x - hw * 0.98) + ' ' + n1(crotch) + ' Z" fill="' + pants + '"/>');
    var bw = Math.max(hw, sw * 0.82), rr = HH * 0.38;
    if(o.hairStyle === 'long') g.push('<path d="M' + n1(hx - R * 1.02) + ' ' + n1(hcY - R * 0.1) + ' Q' + n1(hx - R * 1.18) + ' ' + n1(hcY + R * 1.7) + ' ' + n1(hx - R * 0.5) + ' ' + n1(hcY + R * 2.05) + ' L' + n1(hx + R * 0.5) + ' ' + n1(hcY + R * 2.05) + ' Q' + n1(hx + R * 1.18) + ' ' + n1(hcY + R * 1.7) + ' ' + n1(hx + R * 1.02) + ' ' + n1(hcY - R * 0.1) + ' Z" fill="' + hair + '"/>');
    g.push('<path class="si-ol" d="M' + n1(hx - sw + rr) + ' ' + n1(shY) + ' Q' + n1(hx - sw) + ' ' + n1(shY) + ' ' + n1(hx - sw) + ' ' + n1(shY + rr) + ' L' + n1(x - bw) + ' ' + n1(waist + HH * 0.12) + ' L' + n1(x + bw) + ' ' + n1(waist + HH * 0.12) + ' L' + n1(hx + sw) + ' ' + n1(shY + rr) + ' Q' + n1(hx + sw) + ' ' + n1(shY) + ' ' + n1(hx + sw - rr) + ' ' + n1(shY) + ' Z" fill="' + shirt + '"/>');
    // neck with a collar notch
    g.push('<path d="M' + n1(hx - R * 0.3) + ' ' + n1(hcY + R * 0.6) + ' L' + n1(hx - R * 0.3) + ' ' + n1(shY + HH * 0.02) + ' L' + n1(hx) + ' ' + n1(shY + HH * 0.22) + ' L' + n1(hx + R * 0.3) + ' ' + n1(shY + HH * 0.02) + ' L' + n1(hx + R * 0.3) + ' ' + n1(hcY + R * 0.6) + ' Z" fill="' + skin + '"/>');
    g.push(head(hx, hcY, R, a, skin, hair, o, fc));
    g.push(limb(near, armW, shirt, skin, false));
    if(o.prop) g.push(o.prop({ x: x, hx: hx, R: R, HH: HH, sw: sw, shY: shY, hipY: crotch, hand: near.hand, far: far.hand, fc: fc, h: h }));
    return '<g class="si-person">' + g.join('') + '</g>';
  }
  function limb(A, w, shirt, skin, far){
    return '<path d="M' + n1(A.s[0]) + ' ' + n1(A.s[1]) + ' L' + n1(A.e[0]) + ' ' + n1(A.e[1]) + ' L' + n1(A.hand[0]) + ' ' + n1(A.hand[1]) + '" fill="none" stroke="' + shirt + '" stroke-width="' + n1(w) + '" stroke-linecap="round" stroke-linejoin="round"' + (far ? ' class="si-far"' : '') + '/>' +
      '<circle cx="' + n1(A.hand[0]) + '" cy="' + n1(A.hand[1]) + '" r="' + n1(w * 0.62) + '" fill="' + skin + '"' + (far ? ' class="si-far"' : '') + '/>';
  }
  function shoe(x, y, HH, fc){ return '<path class="si-shoe" d="M' + n1(x - fc * HH * 0.22) + ' ' + n1(y) + ' L' + n1(x - fc * HH * 0.22) + ' ' + n1(y - HH * 0.22) + ' Q' + n1(x + fc * HH * 0.05) + ' ' + n1(y - HH * 0.3) + ' ' + n1(x + fc * HH * 0.4) + ' ' + n1(y - HH * 0.08) + ' L' + n1(x + fc * HH * 0.4) + ' ' + n1(y) + ' Z"/>'; }
  function head(cx, cy, R, a, skin, hair, o, fc){
    var g = [], face = o.face || 'smile', away = o.look === 'away', turn = away ? -fc : fc, ex = turn * R * 0.14;
    // ear, face
    g.push('<ellipse cx="' + n1(cx - turn * R * 0.9) + '" cy="' + n1(cy + R * 0.12) + '" rx="' + n1(R * 0.2) + '" ry="' + n1(R * 0.26) + '" fill="' + skin + '" class="si-ol"/>');
    g.push('<ellipse cx="' + n1(cx) + '" cy="' + n1(cy) + '" rx="' + n1(R * 0.96) + '" ry="' + n1(R) + '" fill="' + skin + '" class="si-ol"/>');
    // hair
    if(a < 1.5) g.push('<path d="M' + n1(cx - R * 0.2) + ' ' + n1(cy - R * 0.92) + ' q' + n1(R * 0.18) + ' ' + n1(-R * 0.4) + ' ' + n1(R * 0.46) + ' ' + n1(-R * 0.14) + '" stroke="' + hair + '" stroke-width="' + n1(R * 0.14) + '" fill="none" stroke-linecap="round"/>');
    else if(o.hairStyle === 'bald') g.push('<path d="M' + n1(cx - R * 0.98) + ' ' + n1(cy + R * 0.05) + ' Q' + n1(cx - R * 1.04) + ' ' + n1(cy - R * 0.55) + ' ' + n1(cx - R * 0.72) + ' ' + n1(cy - R * 0.72) + ' L' + n1(cx - R * 0.66) + ' ' + n1(cy - R * 0.18) + ' Z M' + n1(cx + R * 0.98) + ' ' + n1(cy + R * 0.05) + ' Q' + n1(cx + R * 1.04) + ' ' + n1(cy - R * 0.55) + ' ' + n1(cx + R * 0.72) + ' ' + n1(cy - R * 0.72) + ' L' + n1(cx + R * 0.66) + ' ' + n1(cy - R * 0.18) + ' Z" fill="' + hair + '"/>');
    else if(o.hairStyle === 'curly'){ for(var k = 0; k < 7; k++){ var an = Math.PI * (1.05 + k * 0.15); g.push('<circle cx="' + n1(cx + Math.cos(an) * R * 0.9) + '" cy="' + n1(cy + Math.sin(an) * R * 0.9) + '" r="' + n1(R * 0.36) + '" fill="' + hair + '"/>'); } }
    else g.push('<path d="M' + n1(cx - R * 1.0) + ' ' + n1(cy + R * 0.12) + ' Q' + n1(cx - R * 1.12) + ' ' + n1(cy - R * 1.22) + ' ' + n1(cx) + ' ' + n1(cy - R * 1.1) + ' Q' + n1(cx + R * 1.12) + ' ' + n1(cy - R * 1.22) + ' ' + n1(cx + R * 1.0) + ' ' + n1(cy + R * 0.12) + ' Q' + n1(cx + R * 0.92) + ' ' + n1(cy - R * 0.48) + ' ' + n1(cx + turn * R * 0.2) + ' ' + n1(cy - R * 0.52) + ' Q' + n1(cx - R * 0.78) + ' ' + n1(cy - R * 0.42) + ' ' + n1(cx - R * 1.0) + ' ' + n1(cy + R * 0.12) + ' Z" fill="' + hair + '"/>');
    if(o.hairStyle === 'bun') g.push('<circle cx="' + n1(cx - turn * R * 0.55) + '" cy="' + n1(cy - R * 1.02) + '" r="' + n1(R * 0.4) + '" fill="' + hair + '"/>');
    if(away){ g.push('<path d="M' + n1(cx - R * 0.98) + ' ' + n1(cy + R * 0.2) + ' Q' + n1(cx) + ' ' + n1(cy + R * 0.42) + ' ' + n1(cx + R * 0.98) + ' ' + n1(cy + R * 0.2) + ' Q' + n1(cx + R * 1.1) + ' ' + n1(cy - R * 1.12) + ' ' + n1(cx) + ' ' + n1(cy - R * 1.1) + ' Q' + n1(cx - R * 1.1) + ' ' + n1(cy - R * 1.12) + ' ' + n1(cx - R * 0.98) + ' ' + n1(cy + R * 0.2) + ' Z" fill="' + hair + '"/>'); return g.join(''); }
    var ey = cy + R * 0.08, er = R * 0.1;
    [-1, 1].forEach(function(s){ g.push('<ellipse cx="' + n1(cx + ex + s * R * 0.36) + '" cy="' + n1(ey) + '" rx="' + n1(er) + '" ry="' + n1(er * 1.25) + '" class="si-eye"/>'); });
    var bl = face === 'angry' ? [0.26, 0.1] : face === 'sad' || face === 'cry' || face === 'worried' ? [0.1, 0.2] : [0.2, 0.2];
    [-1, 1].forEach(function(s){ g.push('<path d="M' + n1(cx + ex + s * R * 0.54) + ' ' + n1(ey - R * 0.22 - R * bl[1]) + ' L' + n1(cx + ex + s * R * 0.2) + ' ' + n1(ey - R * 0.22 - R * bl[0]) + '" class="si-brow"/>'); });
    g.push('<path d="M' + n1(cx + ex + turn * R * 0.1) + ' ' + n1(ey + R * 0.12) + ' q' + n1(turn * R * 0.12) + ' ' + n1(R * 0.14) + ' 0 ' + n1(R * 0.2) + '" class="si-nose"/>');
    var my = cy + R * 0.52, mx = cx + ex;
    if(face === 'smile') g.push('<path d="M' + n1(mx - R * 0.26) + ' ' + n1(my - R * 0.04) + ' Q' + n1(mx) + ' ' + n1(my + R * 0.24) + ' ' + n1(mx + R * 0.26) + ' ' + n1(my - R * 0.04) + '" class="si-mouth"/>');
    else if(face === 'neutral' || face === 'worried') g.push('<path d="M' + n1(mx - R * 0.18) + ' ' + n1(my + R * 0.06) + ' L' + n1(mx + R * 0.18) + ' ' + n1(my + R * 0.06) + '" class="si-mouth"/>');
    else if(face === 'cry' || face === 'angry') g.push('<ellipse cx="' + n1(mx) + '" cy="' + n1(my + R * 0.08) + '" rx="' + n1(R * 0.2) + '" ry="' + n1(R * 0.15) + '" class="si-mouth-o"/>');
    else g.push('<path d="M' + n1(mx - R * 0.22) + ' ' + n1(my + R * 0.14) + ' Q' + n1(mx) + ' ' + n1(my - R * 0.06) + ' ' + n1(mx + R * 0.22) + ' ' + n1(my + R * 0.14) + '" class="si-mouth"/>');
    if(face === 'cry') g.push('<path d="M' + n1(cx + ex + R * 0.4) + ' ' + n1(ey + R * 0.2) + ' q' + n1(R * 0.09) + ' ' + n1(R * 0.26) + ' 0 ' + n1(R * 0.36) + ' q' + n1(-R * 0.09) + ' ' + n1(-R * 0.1) + ' 0 ' + n1(-R * 0.36) + '" class="si-tear"/>');
    if(face !== 'angry') [-1, 1].forEach(function(s){ g.push('<circle cx="' + n1(cx + ex + s * R * 0.58) + '" cy="' + n1(cy + R * 0.38) + '" r="' + n1(R * 0.15) + '" class="si-blush"/>'); });
    if(a >= 60) g.push('<path d="M' + n1(cx + ex + R * 0.5) + ' ' + n1(ey - R * 0.02) + ' l' + n1(R * 0.12) + ' ' + n1(R * 0.06) + ' M' + n1(cx + ex - R * 0.5) + ' ' + n1(ey - R * 0.02) + ' l' + n1(-R * 0.12) + ' ' + n1(R * 0.06) + '" class="si-wrinkle"/>');
    if(o.glasses) g.push('<g class="si-glass"><circle cx="' + n1(cx + ex - R * 0.36) + '" cy="' + n1(ey) + '" r="' + n1(R * 0.25) + '"/><circle cx="' + n1(cx + ex + R * 0.36) + '" cy="' + n1(ey) + '" r="' + n1(R * 0.25) + '"/><path d="M' + n1(cx + ex - R * 0.11) + ' ' + n1(ey) + ' h' + n1(R * 0.22) + '"/></g>');
    return g.join('');
  }
  /* A sitting infant: o.h is the sitting height (head and trunk). */
  function baby(o){
    var x = o.x, y = o.y, h = o.h, HH = h / 2.6, R = HH * 0.58, g = [], fc = o.facing || 1;
    var skin = o.skin || SKIN[1], shirt = o.shirt || 'var(--si-kid)', hair = o.hair || '#3B2A20';
    var shY = y - h + HH * 1.1, bot = y - HH * 0.22;
    [-1, 1].forEach(function(s){ g.push('<path d="M' + n1(x + s * HH * 0.3) + ' ' + n1(bot - HH * 0.1) + ' Q' + n1(x + s * HH * 0.85) + ' ' + n1(bot) + ' ' + n1(x + s * HH * 1.0) + ' ' + n1(y - HH * 0.16) + '" fill="none" stroke="' + skin + '" stroke-width="' + n1(HH * 0.42) + '" stroke-linecap="round"/><ellipse cx="' + n1(x + s * HH * 1.08) + '" cy="' + n1(y - HH * 0.15) + '" rx="' + n1(HH * 0.22) + '" ry="' + n1(HH * 0.14) + '" fill="' + skin + '" class="si-ol"/>'); });
    g.push('<path class="si-ol" d="M' + n1(x - HH * 0.5) + ' ' + n1(shY) + ' Q' + n1(x - HH * 0.95) + ' ' + n1(bot) + ' ' + n1(x - HH * 0.6) + ' ' + n1(bot + HH * 0.06) + ' L' + n1(x + HH * 0.6) + ' ' + n1(bot + HH * 0.06) + ' Q' + n1(x + HH * 0.95) + ' ' + n1(bot) + ' ' + n1(x + HH * 0.5) + ' ' + n1(shY) + ' Z" fill="' + shirt + '"/>');
    var hn = [x + fc * HH * 0.72, shY + HH * 0.62], hf = [x - fc * HH * 0.7, shY + HH * 0.72];
    g.push(limb({ s: [x - fc * HH * 0.42, shY + HH * 0.14], e: [x - fc * HH * 0.62, shY + HH * 0.42], hand: hf }, HH * 0.3, shirt, skin, true));
    g.push(head(x, shY - R * 0.82, R, 0.5, skin, hair, o, fc));
    g.push(limb({ s: [x + fc * HH * 0.42, shY + HH * 0.14], e: [x + fc * HH * 0.62, shY + HH * 0.4], hand: hn }, HH * 0.3, shirt, skin, false));
    if(o.prop) g.push(o.prop({ x: x, R: R, HH: HH, hand: hn, fc: fc, h: h }));
    return '<g class="si-person">' + g.join('') + '</g>';
  }

  /* --------------------------------------------------------- scenes */
  function bubble(x, y, text, cls, size){
    size = size || 13; var w = Math.max(size * 1.9, textW(text, size, 900) + 14), h = size + 12;
    return '<g class="si-bub ' + (cls || '') + '"><rect x="' + n1(x - w / 2) + '" y="' + n1(y - h) + '" width="' + n1(w) + '" height="' + n1(h) + '" rx="' + n1(h / 2) + '"/><path d="M' + n1(x - 4) + ' ' + n1(y - 1) + ' l4 7 l4 -7 Z"/><text x="' + n1(x) + '" y="' + n1(y - h / 2 + size * 0.36) + '" text-anchor="middle" font-size="' + size + '">' + esc(text) + '</text></g>';
  }
  function floorRoom(X, Y, W, H, floor, cls){
    return '<rect x="' + n1(X) + '" y="' + n1(Y) + '" width="' + n1(W) + '" height="' + n1(H) + '" rx="14" class="si-room ' + (cls || '') + '"/>' +
      '<path d="M' + n1(X) + ' ' + n1(floor) + ' H' + n1(X + W) + ' V' + n1(Y + H - 14) + ' Q' + n1(X + W) + ' ' + n1(Y + H) + ' ' + n1(X + W - 14) + ' ' + n1(Y + H) + ' H' + n1(X + 14) + ' Q' + n1(X) + ' ' + n1(Y + H) + ' ' + n1(X) + ' ' + n1(Y + H - 14) + ' Z" class="si-floor"/>';
  }
  var CREW = [
    { skin: SKIN[0], hair: '#3B2A20' }, { skin: SKIN[2], hair: '#1E1A16', hairStyle: 'curly' }, { skin: SKIN[1], hair: '#6B4A2E' }, { skin: SKIN[3], hair: '#1E1A16' },
    { skin: SKIN[0], hair: '#A0522D' }, { skin: SKIN[2], hair: '#2A1C14' }, { skin: SKIN[1], hair: '#1E1A16', hairStyle: 'curly' }, { skin: SKIN[3], hair: '#2A1C14' }
  ];
  var SHIRTS = ['var(--si-s1)', 'var(--si-s2)', 'var(--si-s3)', 'var(--si-s4)'];

  /* Asch's line task: the cards on an easel, a table, the majority in a row
     and the real participant near the end (the cerulean shirt). */
  function aschScene(X, Y, W, H, n, partner, phone, o){
    o = o || {};
    var g = [], floor = Y + H * 0.8;
    g.push(floorRoom(X, Y, W, H, floor));
    // the cards
    var cw = Math.min(W * 0.24, 170), chh = Math.min(H * 0.27, 130), cy = Y + 14, gap = 12, cx0 = X + W / 2 - cw - gap / 2;
    g.push('<g class="si-card"><rect x="' + n1(cx0) + '" y="' + n1(cy) + '" width="' + n1(cw) + '" height="' + n1(chh) + '" rx="4"/><rect x="' + n1(cx0 + cw + gap) + '" y="' + n1(cy) + '" width="' + n1(cw) + '" height="' + n1(chh) + '" rx="4"/></g>');
    var base = cy + chh - 14, unit = (chh - 30) / 10;
    g.push('<line class="si-line" x1="' + n1(cx0 + cw / 2) + '" x2="' + n1(cx0 + cw / 2) + '" y1="' + n1(base) + '" y2="' + n1(base - 8 * unit) + '"/>');
    [[6.5, 'A'], [10, 'B'], [8, 'C']].forEach(function(l, i){ var lx = cx0 + cw + gap + cw * (0.22 + i * 0.28); g.push('<line class="si-line' + (i === 2 ? ' is-c' : '') + '" x1="' + n1(lx) + '" x2="' + n1(lx) + '" y1="' + n1(base) + '" y2="' + n1(base - l[0] * unit) + '"/><text class="si-cl" x="' + n1(lx) + '" y="' + n1(base + 11) + '" text-anchor="middle">' + l[1] + '</text>'); });
    g.push('<text class="si-cl" x="' + n1(cx0 + cw / 2) + '" y="' + n1(base + 11) + '" text-anchor="middle">Standard</text>');
    // the table and the people behind it
    var shown = Math.min(n, 8), seats = shown + 1, ty = Y + H * 0.66, tableX0 = X + W * 0.05, tableX1 = X + W * 0.95;
    var step = (tableX1 - tableX0) / (seats + 0.3), hh = Math.min(H * 0.5, step * 2.6);
    var pIndex = seats - (n > 1 ? 2 : 1); // the participant answers second to last, as in Asch's setup
    if(n === 0) pIndex = 0;
    var who = [], k = 0;
    for(var i = 0; i < seats; i++) who.push(i === pIndex ? 'me' : k++);
    who.forEach(function(w, i){
      var px = tableX0 + step * (i + 0.65), c = w === 'me' ? { skin: SKIN[1], hair: '#3B2A20' } : CREW[w % 8];
      g.push(person({ x: px, y: ty + hh * 0.36, h: hh, age: 20, skin: c.skin, hair: c.hair, hairStyle: c.hairStyle || 'short', shirt: w === 'me' ? 'var(--cink)' : SHIRTS[w % 4], pose: 'sit', face: w === 'me' ? 'worried' : 'neutral' }));
      if(o.bubbles !== false){
        var says = w === 'me' ? (o.me || '?') : (partner && w === 0 ? 'C' : 'B');
        g.push(bubble(px, ty - hh * 0.62, says, w === 'me' ? 'is-me' : partner && w === 0 ? 'is-right' : 'is-wrong', phone ? 12 : 13));
      }
    });
    g.push('<rect x="' + n1(tableX0) + '" y="' + n1(ty) + '" width="' + n1(tableX1 - tableX0) + '" height="' + n1(H * 0.05) + '" rx="4" class="si-table"/><rect x="' + n1(tableX0 + 6) + '" y="' + n1(ty + H * 0.05) + '" width="' + n1(tableX1 - tableX0 - 12) + '" height="' + n1(floor - ty - H * 0.05 + 4) + '" class="si-tablefront"/>');
    if(n > shown) g.push('<text class="si-note" x="' + n1(tableX1) + '" y="' + n1(floor - 6) + '" text-anchor="end">8 of ' + n + ' shown</text>');
    var meIdx = who.indexOf('me'), mx = tableX0 + step * (meIdx + 0.65);
    g.push('<text class="si-you" x="' + n1(mx) + '" y="' + n1(Y + H - 8) + '" text-anchor="middle">Participant</text>');
    return g.join('');
  }

  /* Milgram's laboratory: the generator (30 switches, 15 to 450 V), the
     teacher, the experimenter in a gray coat, the learner. */
  function milgramScene(X, Y, W, H, cond, phone){
    var g = [], floor = Y + H * 0.84, office = cond === 'office';
    g.push(floorRoom(X, Y, W, H, floor, office ? 'is-office' : ''));
    if(office){ var wx = X + W * 0.06, wy = Y + H * 0.08, ww = W * 0.2, wh = H * 0.24; g.push('<rect x="' + n1(wx) + '" y="' + n1(wy) + '" width="' + n1(ww) + '" height="' + n1(wh) + '" class="si-window"/>' + [0.15, 0.4, 0.62, 0.82].map(function(f, i){ return '<rect x="' + n1(wx + ww * f) + '" y="' + n1(wy + wh * (0.35 + (i % 2) * 0.15)) + '" width="' + n1(ww * 0.14) + '" height="' + n1(wh * (0.65 - (i % 2) * 0.15)) + '" class="si-bldg"/>'; }).join('') + '<text class="si-note" x="' + n1(wx) + '" y="' + n1(wy + wh + 14) + '">Downtown office</text>'); }
    var near = cond === 'proximity' || cond === 'touch', wall = !near;
    var wallX = X + W * (phone ? 0.68 : 0.7), hh = Math.min(H * 0.5, W * (phone ? 0.36 : 0.4));
    // the learner: behind a wall, or in the room
    if(wall){
      g.push('<rect x="' + n1(wallX) + '" y="' + n1(Y + 6) + '" width="' + n1(W * 0.025) + '" height="' + n1(floor - Y - 6) + '" class="si-wall"/>');
      var lx = wallX + (X + W - wallX) * 0.55;
      g.push('<rect x="' + n1(lx - hh * 0.35) + '" y="' + n1(floor - hh * 0.36) + '" width="' + n1(hh * 0.7) + '" height="' + n1(hh * 0.08) + '" rx="3" class="si-table"/>');
      g.push(person({ x: lx, y: floor, h: hh, age: 47, skin: SKIN[0], hair: '#B3ACA2', gray: true, hairStyle: 'bald', shirt: 'var(--si-s4)', pose: 'sit', facing: -1, face: cond === 'remote' ? 'neutral' : 'cry' }));
      g.push('<text class="si-note" x="' + n1(lx) + '" y="' + n1(Y + 22) + '" text-anchor="middle">Learner (an actor)</text>');
      if(cond !== 'remote') g.push('<text class="si-note is-bad" x="' + n1(lx) + '" y="' + n1(Y + 38) + '" text-anchor="middle">protests through the wall</text>');
      if(cond === 'voice' || cond === 'peers' || cond === 'phone' || cond === 'office') g.push('<path class="si-wave" d="M' + n1(wallX - 6) + ' ' + n1(floor - hh * 0.7) + ' q-8 10 0 20 M' + n1(wallX - 14) + ' ' + n1(floor - hh * 0.74) + ' q-10 14 0 28"/>');
      if(cond === 'remote') g.push('<text class="si-note" x="' + n1(lx) + '" y="' + n1(Y + 38) + '" text-anchor="middle">pounds on the wall</text>');
    }
    // the generator, with any peers who refuse standing behind it
    var gx = X + W * (phone ? 0.06 : 0.06), gw = Math.min(W * (phone ? 0.5 : 0.46), hh * 1.5), gy = floor - hh * 0.62, gh = hh * 0.2;
    if(cond === 'peers'){ [0, 1].forEach(function(k){ g.push(person({ x: gx + gw * (0.14 + k * 0.24), y: floor - hh * 0.04, h: hh * 0.98, age: 40, skin: CREW[k + 2].skin, hair: CREW[k + 2].hair, shirt: SHIRTS[k + 1], pose: 'cross', facing: 1, face: 'angry' })); }); g.push('<text class="si-note is-bad" x="' + n1(gx + gw * 0.26) + '" y="' + n1(floor - hh * 1.08) + '" text-anchor="middle">"I won\'t go on."</text>'); }
    g.push('<rect x="' + n1(gx) + '" y="' + n1(gy) + '" width="' + n1(gw) + '" height="' + n1(gh) + '" rx="4" class="si-gen"/><rect x="' + n1(gx + gw * 0.08) + '" y="' + n1(gy + gh) + '" width="' + n1(gw * 0.84) + '" height="' + n1(floor - gy - gh) + '" class="si-genstand"/>');
    for(var s = 0; s < 30; s++){ var sx = gx + 6 + (gw - 12) * (s + 0.5) / 30; g.push('<rect x="' + n1(sx - 1.6) + '" y="' + n1(gy + gh * 0.45) + '" width="3.2" height="' + n1(gh * 0.32) + '" rx="1" class="si-sw' + (s >= 27 ? ' is-xxx' : s >= 20 ? ' is-danger' : '') + '"/>'); }
    g.push('<text class="si-gl" x="' + n1(gx + 6) + '" y="' + n1(gy + gh * 0.32) + '">15 V</text><text class="si-gl" x="' + n1(gx + gw - 6) + '" y="' + n1(gy + gh * 0.32) + '" text-anchor="end">450 V  XXX</text>');
    // the teacher at the generator
    var tx = gx + gw * 0.5;
    g.push(person({ x: tx, y: floor, h: hh, age: 35, skin: SKIN[1], hair: '#3B2A20', shirt: 'var(--cink)', pose: cond === 'touch' ? 'reach' : 'write', facing: 1, face: 'worried' }));
    if(near){
      var lx2 = gx + gw + hh * (cond === 'touch' ? 0.3 : 0.7);
      g.push(person({ x: lx2, y: floor, h: hh, age: 47, skin: SKIN[0], hair: '#B3ACA2', gray: true, hairStyle: 'bald', shirt: 'var(--si-s4)', pose: 'sit', facing: -1, face: 'cry' }));
      if(cond === 'touch') g.push('<rect x="' + n1(lx2 - hh * 0.42) + '" y="' + n1(floor - hh * 0.5) + '" width="' + n1(hh * 0.28) + '" height="' + n1(hh * 0.05) + '" rx="2" class="si-plate"/>');
      g.push('<text class="si-note" x="' + n1(lx2) + '" y="' + n1(Y + 22) + '" text-anchor="middle">Learner (an actor)</text>');
    }
    // the experimenter, or a telephone
    var ex = Math.min(gx + gw + hh * 0.3, (wall ? wallX : X + W) - hh * 0.32);
    if(cond === 'phone') g.push('<g class="si-phone"><rect x="' + n1(gx + gw * 0.66) + '" y="' + n1(gy - hh * 0.1) + '" width="' + n1(hh * 0.16) + '" height="' + n1(hh * 0.1) + '" rx="3"/><path d="M' + n1(gx + gw * 0.66) + ' ' + n1(gy - hh * 0.11) + ' q' + n1(hh * 0.08) + ' ' + n1(-hh * 0.06) + ' ' + n1(hh * 0.16) + ' 0"/></g><text class="si-note" x="' + n1(gx + gw * 0.74) + '" y="' + n1(gy - hh * 0.2) + '" text-anchor="middle">orders by phone</text>');
    else { g.push(person({ x: ex, y: floor, h: hh * 1.04, age: 31, skin: SKIN[0], hair: '#2A1C14', shirt: 'var(--si-coat)', pants: 'var(--si-pants)', pose: 'stand', facing: -1, face: 'neutral', glasses: true })); if(!phone || W > 340) g.push(bubble(ex, floor - hh * 1.1, '"Please continue."', 'is-me', phone ? 11.5 : 12.5)); }
    return g.join('');
  }

  /* Darley and Latane's intercom study: a row of booths; the participant
     hears a seizure over the intercom and believes N others hear it too. */
  function boothScene(X, Y, W, H, others, phone){
    var g = [], floor = Y + H * 0.86, booths = 1 + others + 1;
    g.push(floorRoom(X, Y, W, H, floor));
    var bw = (W - 20) / Math.max(booths, 3), hh = Math.min(H * 0.48, bw * 2.3), btop = Math.max(Y + 40, floor - hh * 1.5);
    for(var i = 0; i < booths; i++){
      var bx = X + 10 + i * bw, me = i === 0, victim = i === booths - 1;
      g.push('<rect x="' + n1(bx + 3) + '" y="' + n1(btop) + '" width="' + n1(bw - 6) + '" height="' + n1(floor - btop) + '" rx="6" class="si-booth' + (me ? ' is-me' : '') + '"/>');
      g.push('<g class="si-intercom"><rect x="' + n1(bx + bw / 2 - 9) + '" y="' + n1(btop + 6) + '" width="18" height="12" rx="3"/>' + (victim ? '' : '<path d="M' + n1(bx + bw / 2 + 12) + ' ' + n1(btop + 7) + ' q5 5 0 10"/>') + '</g>');
      if(victim){ ['A recorded', 'voice has', 'a "seizure"'].forEach(function(t, k){ g.push('<text class="si-note is-bad" x="' + n1(bx + bw / 2) + '" y="' + n1(btop + 40 + k * 14) + '" text-anchor="middle">' + esc(t) + '</text>'); }); g.push('<path class="si-wave" d="M' + n1(bx + bw / 2 - 8) + ' ' + n1(btop + 90) + ' q-6 8 0 16 M' + n1(bx + bw / 2 + 8) + ' ' + n1(btop + 90) + ' q6 8 0 16"/>'); continue; }
      var c = me ? { skin: SKIN[1], hair: '#3B2A20' } : CREW[(i + 3) % 8];
      g.push(person({ x: bx + bw / 2, y: floor, h: hh, age: 20, skin: c.skin, hair: c.hair, hairStyle: c.hairStyle || 'short', shirt: me ? 'var(--cink)' : SHIRTS[i % 4], pose: 'sit', face: 'worried', facing: 1, prop: function(p){ return '<path d="M' + n1(p.hx - p.R * 1.05) + ' ' + n1(p.shY - p.R * 1.5) + ' q' + n1(p.R * 1.05) + ' ' + n1(-p.R * 1.6) + ' ' + n1(p.R * 2.1) + ' 0" class="si-headset"/>'; } }));
      if(me) g.push('<text class="si-note is-me" x="' + n1(bx + bw / 2) + '" y="' + n1(btop - 8) + '" text-anchor="middle">Participant</text>');
    }
    if(others) g.push('<text class="si-note" x="' + n1(X + 10 + bw * (1 + others / 2)) + '" y="' + n1(btop - 8) + '" text-anchor="middle">' + (others === 1 ? 'Another student' : 'Other students') + ' (recordings)</text>');
    return g.join('');
  }

  /* Social facilitation at the pool table, social loafing in a shouting
     study (blindfolds and headphones; pseudogroups). */
  function groupScene(X, Y, W, H, watched, skill, shouters, phone){
    var stack = phone || H > W * 0.7, g = [], half = stack ? H / 2 - 4 : H, w2 = stack ? W : W / 2 - 6;
    var floor = Y + half * 0.86;
    g.push(floorRoom(X, Y, w2, half, floor));
    var hh = Math.min(half * 0.56, w2 * 0.3), tx = X + w2 * 0.46;
    g.push('<rect x="' + n1(tx - w2 * 0.28) + '" y="' + n1(floor - hh * 0.42) + '" width="' + n1(w2 * 0.56) + '" height="' + n1(hh * 0.1) + '" rx="5" class="si-felt"/><rect x="' + n1(tx - w2 * 0.26) + '" y="' + n1(floor - hh * 0.32) + '" width="' + n1(w2 * 0.06) + '" height="' + n1(hh * 0.32) + '" class="si-tableleg"/><rect x="' + n1(tx + w2 * 0.2) + '" y="' + n1(floor - hh * 0.32) + '" width="' + n1(w2 * 0.06) + '" height="' + n1(hh * 0.32) + '" class="si-tableleg"/>');
    [0.1, 0.16, 0.22].forEach(function(f, i){ g.push('<circle cx="' + n1(tx + w2 * f - w2 * 0.12) + '" cy="' + n1(floor - hh * 0.46) + '" r="' + n1(hh * 0.035) + '" class="si-ball b' + i + '"/>'); });
    g.push(person({ x: tx - w2 * 0.32, y: floor, h: hh, age: 30, skin: SKIN[2], hair: '#1E1A16', shirt: 'var(--cink)', pose: 'hold', facing: 1, face: skill === 'good' ? (watched ? 'smile' : 'neutral') : (watched ? 'worried' : 'neutral'), prop: function(p){ return '<line x1="' + n1(p.far[0]) + '" y1="' + n1(p.far[1]) + '" x2="' + n1(p.hand[0] + p.HH * 1.6) + '" y2="' + n1(floor - hh * 0.47) + '" class="si-cue"/>'; } }));
    if(watched) [0, 1, 2, 3].forEach(function(k){ var c = CREW[k + 4]; g.push(person({ x: X + w2 * (0.62 + k * 0.1), y: floor, h: hh * 0.92, age: 25 + k * 8, skin: c.skin, hair: c.hair, hairStyle: c.hairStyle || 'short', shirt: SHIRTS[k], pose: k % 2 ? 'cross' : 'stand', facing: -1, face: 'neutral' })); });
    g.push('<text class="si-ptitle" x="' + n1(X + 12) + '" y="' + n1(Y + 22) + '">Pool: ' + (skill === 'good' ? 'a good player' : 'a weaker player') + (watched ? ', 4 watching' : ', unobserved') + '</text>');
    // shouting
    var X2 = stack ? X : X + W / 2 + 6, Y2 = stack ? Y + half + 8 : Y, f2 = Y2 + half * 0.86;
    g.push(floorRoom(X2, Y2, w2, half, f2));
    var hh2 = Math.min(half * 0.5, w2 * 0.3), cols = shouters, sp = Math.min((w2 - 20) / Math.max(cols, 2), hh2 * 0.6), sx0 = X2 + (w2 - sp * cols) / 2;
    for(var i = 0; i < cols; i++){
      var px = sx0 + sp * (i + 0.5), c2 = i === 0 ? { skin: SKIN[1], hair: '#3B2A20' } : CREW[i % 8];
      g.push(person({ x: px, y: f2, h: Math.min(hh2, sp * 2.4), age: 22, skin: c2.skin, hair: c2.hair, hairStyle: c2.hairStyle || 'short', shirt: i === 0 ? 'var(--cink)' : SHIRTS[i % 4], pose: 'stand', face: 'cry', prop: function(p){ return '<rect x="' + n1(p.hx - p.R * 0.95) + '" y="' + n1(p.shY - p.R * 1.95) + '" width="' + n1(p.R * 1.9) + '" height="' + n1(p.R * 0.36) + '" rx="' + n1(p.R * 0.16) + '" class="si-blind"/><path d="M' + n1(p.hx - p.R * 1.05) + ' ' + n1(p.shY - p.R * 1.4) + ' q' + n1(p.R * 1.05) + ' ' + n1(-p.R * 1.7) + ' ' + n1(p.R * 2.1) + ' 0" class="si-headset"/>'; } }));
    }
    g.push('<text class="si-ptitle" x="' + n1(X2 + 12) + '" y="' + n1(Y2 + 22) + '">Shouting ' + (shouters === 1 ? 'alone' : 'with ' + (shouters - 1) + (shouters === 2 ? ' other' : ' others')) + '</text>');
    g.push('<text class="si-note" x="' + n1(X2 + 12) + '" y="' + n1(Y2 + 38) + '">blindfolded, headphones on</text>');
    return g.join('');
  }

  /* --------------------------------------------------------- graphs */
  /* bars(X, Y, W, H, items, o): items [{ label, value, on, cls, note }],
     values in percent 0 to 100; o.title, o.source, o.horizontal. */
  function bars(X, Y, W, H, items, o){
    o = o || {};
    var g = [], top = Y + (o.title ? 40 : 6), bot = Y + H - (o.source ? (o.horizontal ? 30 : 46) : 18);
    if(o.title) g.push('<text class="si-gt" x="' + n1(X) + '" y="' + n1(Y + 14) + '">' + esc(o.title) + '</text>');
    if(o.horizontal){
      var lw = Math.min(W * 0.42, Math.max.apply(null, items.map(function(it){ return textW(it.label, 12, 700); })) + 10), x0 = X + lw, x1 = X + W - 44, rh = (bot - top) / items.length;
      [0, 50, 100].forEach(function(v){ var xx = x0 + (x1 - x0) * v / 100; g.push('<line class="si-grid" x1="' + n1(xx) + '" x2="' + n1(xx) + '" y1="' + n1(top) + '" y2="' + n1(bot) + '"/><text class="si-tk" x="' + n1(xx) + '" y="' + n1(bot + 13) + '" text-anchor="middle">' + v + '%</text>'); });
      items.forEach(function(it, i){
        var y = top + i * rh, bh = Math.min(22, rh * 0.62), w = (x1 - x0) * it.value / 100;
        g.push('<text class="si-bl' + (it.on ? ' is-on' : '') + '" x="' + n1(x0 - 8) + '" y="' + n1(y + rh / 2 + 4) + '" text-anchor="end">' + esc(it.label) + '</text>');
        g.push('<rect x="' + n1(x0) + '" y="' + n1(y + (rh - bh) / 2) + '" width="' + n1(Math.max(2, w)) + '" height="' + n1(bh) + '" rx="4" class="si-bar ' + (it.cls || '') + (it.on ? ' is-on' : '') + '"/>');
        g.push('<text class="si-bv' + (it.on ? ' is-on' : '') + '" x="' + n1(x0 + w + 6) + '" y="' + n1(y + rh / 2 + 4) + '">' + pct(it.value) + '</text>');
      });
    } else {
      var yy = function(v){ return bot - (bot - top) * v / (o.max || 100); }, x0v = X + 34, cw = (X + W - x0v) / items.length;
      (o.ticks || [0, 25, 50, 75, 100]).forEach(function(v){ g.push('<line class="si-grid" x1="' + n1(x0v) + '" x2="' + n1(X + W) + '" y1="' + n1(yy(v)) + '" y2="' + n1(yy(v)) + '"/><text class="si-tk" x="' + n1(x0v - 5) + '" y="' + n1(yy(v) + 4) + '" text-anchor="end">' + v + '%</text>'); });
      items.forEach(function(it, i){
        var bw = Math.min(46, cw * 0.62), bx = x0v + cw * (i + 0.5) - bw / 2;
        g.push('<rect x="' + n1(bx) + '" y="' + n1(yy(it.value)) + '" width="' + n1(bw) + '" height="' + n1(Math.max(1.5, bot - yy(it.value))) + '" rx="4" class="si-bar ' + (it.cls || '') + (it.on ? ' is-on' : '') + '"/>');
        g.push('<text class="si-bv' + (it.on ? ' is-on' : '') + '" x="' + n1(bx + bw / 2) + '" y="' + n1(yy(it.value) - 5) + '" text-anchor="middle">' + pct(it.value) + '</text>');
        var lines = String(it.label).split('\n'); if(cw < 44) lines = [lines.join(' ')].map(function(t){ return t; }) && lines;
        lines.forEach(function(l, k){ g.push('<text class="si-bl' + (it.on ? ' is-on' : '') + (cw < 52 ? ' is-s' : '') + '" x="' + n1(bx + bw / 2) + '" y="' + n1(bot + 14 + k * 13) + '" text-anchor="middle">' + esc(l) + '</text>'); });
      });
      g.push('<line class="si-axis" x1="' + n1(x0v) + '" x2="' + n1(X + W) + '" y1="' + n1(bot) + '" y2="' + n1(bot) + '"/>');
    }
    if(o.source) g.push('<text class="si-src" x="' + n1(X) + '" y="' + n1(Y + H - 2) + '">' + esc(o.source) + '</text>');
    return g.join('');
  }
  /* 40 small people: how many of Milgram's 40 men went to the last switch. */
  function forty(X, Y, W, H, k){
    var g = [], cols = 10, rows = 4, cw = W / cols, rh = H / rows, s = Math.min(cw, rh) * 0.8;
    for(var i = 0; i < 40; i++){ var c = i % cols, r = Math.floor(i / cols), cx = X + cw * (c + 0.5), cy = Y + rh * (r + 0.5), on = i < k;
      g.push('<g class="si-dot' + (on ? ' is-on' : '') + '"><circle cx="' + n1(cx) + '" cy="' + n1(cy - s * 0.26) + '" r="' + n1(s * 0.18) + '"/><path d="M' + n1(cx - s * 0.26) + ' ' + n1(cy + s * 0.4) + ' q0 ' + n1(-s * 0.48) + ' ' + n1(s * 0.26) + ' ' + n1(-s * 0.48) + ' q' + n1(s * 0.26) + ' 0 ' + n1(s * 0.26) + ' ' + n1(s * 0.48) + ' Z"/></g>'); }
    return g.join('');
  }

  /* ---------------------------------------------------------- mount */
  T.mount('social-influence', function(app, data){
    var ex = null;
    T.modes(app, { slug: 'social-influence',
      explore: function(host){ ex = explore(host, data); },
      quiz: function(host){ quiz(host, data); },
      studio: { explore: function(pane, s){ ex.studio(pane, s); } } });
  });
  function hintSlot(s, target, text, before){
    if(!target) return;
    var slot = document.createElement('div');
    slot.className = 'si-tipslot'; slot.setAttribute('aria-hidden', 'true');
    (before || target).parentNode.insertBefore(slot, before || target);
    var h = s.hint({ target: target, text: text });
    if(!h){ slot.remove(); return; }
    var EV = ['click', 'keydown', 'input', 'change'];
    function done(e){ if(e && e.type === 'keydown' && (e.key === 'Tab' || e.key === 'Shift')) return; EV.forEach(function(t){ s.root.removeEventListener(t, done, true); }); setTimeout(function(){ slot.remove(); if(h.place) h.place(); }, 0); }
    EV.forEach(function(t){ s.root.addEventListener(t, done, true); });
    if(h.place) h.place();
  }
  function chips(cls, label, items){
    return '<div class="si-grp-row ' + cls + '" role="group" aria-label="' + esc(label) + '"><p class="si-lbl" aria-hidden="true">' + esc(label) + '</p><div class="si-chips">' + items.map(function(x){ return '<button type="button" class="tchip" data-k="' + x[0] + '" aria-pressed="false">' + esc(x[1]) + '</button>'; }).join('') + '</div></div>';
  }

  /* ------------------------------------------------------------ explore */
  function explore(host, data){
    var sit = 'conform', sizeI = 5, partner = false, cond = 'remote', others = 4, watched = true, skill = 'good', shout = 6, touched = false, LS = null, nid = T.nid('si');
    function $(q){ return host.querySelector(q) || (LS ? LS.root.querySelector(q) : null); }
    host.innerHTML = '<section class="bt-problem si-card" aria-labelledby="' + nid + '-h"><h2 id="' + nid + '-h" class="sr-only">Social influence</h2>' +
      '<div class="si-fig"><svg class="si-svg" role="img" xmlns="http://www.w3.org/2000/svg"></svg></div>' +
      '<div class="si-ctl">' +
        '<div class="si-chips si-sits" role="group" aria-label="Situation">' + SITS.map(function(x){ return '<button type="button" class="tchip" data-v="' + x.v + '" aria-pressed="false">' + x.label + '</button>'; }).join('') + '</div>' +
        '<div class="si-grp si-grp-conform"><div class="si-size"></div>' + chips('si-partner', 'One person answers correctly first', [['no', 'No'], ['yes', 'Yes, a partner']]) + '</div>' +
        '<div class="si-grp si-grp-obey">' + chips('si-cond', 'Condition', D.MILGRAM.map(function(c){ return [c.id, c.short]; })) + '</div>' +
        '<div class="si-grp si-grp-bystand">' + chips('si-others', 'Others the participant thinks can hear', [['0', 'None (alone)'], ['1', '1 other'], ['4', '4 others']]) + '</div>' +
        '<div class="si-grp si-grp-groups">' + chips('si-watch', 'Pool player', [['good-1', 'Good, watched'], ['good-0', 'Good, alone'], ['poor-1', 'Weaker, watched'], ['poor-0', 'Weaker, alone']]) + chips('si-shout', 'Shouting', [['1', 'Alone'], ['2', 'With 1 other'], ['6', 'With 5 others']]) + '</div>' +
      '</div>' +
      '<div class="si-say"></div>' +
      T.moreHtml('<div class="si-opts"><label class="bt-radio"><input type="checkbox" class="si-show-graph" checked> Show the published results beside the scene</label></div>', 'graph') +
      '<div class="si-nums"></div><p class="sr-only si-live" role="status" aria-live="polite"></p></section>';
    var say = T.announcer($('.si-live'));
    var cue = T.cue('Change the situation, then read what people actually did.');
    $('.si-ctl').insertBefore(cue.el, $('.si-ctl').firstChild);
    function act(){ if(!touched){ touched = true; cue.done(); } }
    var svg = $('.si-svg'), showGraph = true;
    var sSize = T.slider({ label: 'People who give the wrong answer first', min: 0, max: SIZES.length - 1, step: 1, value: sizeI, onInput: function(v){ act(); sizeI = v; draw(); words(); say(line()); } });
    (function(){ var out = sSize.el.querySelector('output'), inp = sSize.input; function show(){ var t = SIZE_LAB[+inp.value] + (+inp.value === 0 ? '' : +inp.value === 1 ? ' person' : ' people'); out.textContent = t; inp.setAttribute('aria-valuetext', t); } inp.addEventListener('input', show); sSize.el.querySelectorAll('.bt-step').forEach(function(b){ b.addEventListener('click', show); }); show(); })();
    $('.si-size').appendChild(sSize.el);
    function onClick(e){
      var b = e.target.closest('.si-sits button');
      if(b){ act(); sit = b.getAttribute('data-v'); sync(); draw(); words(); say(SITS.filter(function(x){ return x.v === sit; })[0].label + '. ' + line()); return; }
      var c = e.target.closest('.si-grp-row button');
      if(!c) return;
      act();
      var row = c.closest('.si-grp-row'), k = c.getAttribute('data-k');
      if(row.classList.contains('si-partner')) partner = k === 'yes';
      else if(row.classList.contains('si-cond')) cond = k;
      else if(row.classList.contains('si-others')) others = +k;
      else if(row.classList.contains('si-watch')){ skill = k.split('-')[0]; watched = k.split('-')[1] === '1'; }
      else if(row.classList.contains('si-shout')) shout = +k;
      sync(); draw(); words(); say(line());
    }
    host.addEventListener('click', onClick);
    $('.si-show-graph').addEventListener('change', function(e){ showGraph = e.target.checked; draw(); if(LS && LS.setupRow) LS.setupRow.setup(showGraph ? 'Scene and results' : 'Scene only'); });
    function sync(){
      var root = LS ? LS.root : host;
      root.querySelectorAll('.si-sits button').forEach(function(b){ b.setAttribute('aria-pressed', String(b.getAttribute('data-v') === sit)); });
      var on = { 'si-partner': partner ? 'yes' : 'no', 'si-cond': cond, 'si-others': String(others), 'si-watch': skill + '-' + (watched ? 1 : 0), 'si-shout': String(shout) };
      Object.keys(on).forEach(function(cls){ root.querySelectorAll('.' + cls + ' button').forEach(function(b){ b.setAttribute('aria-pressed', String(b.getAttribute('data-k') === on[cls])); }); });
      ['conform', 'obey', 'bystand', 'groups'].forEach(function(k){ var el = $('.si-grp-' + k); if(el) el.hidden = k !== sit; });
      sSize.disable(false);
    }
    function size(){ var f = $('.si-fig'), r = f ? f.getBoundingClientRect() : { width: 600, height: 420 }; return { W: Math.max(300, Math.round(r.width)), H: Math.max(300, Math.round(r.height)) }; }
    function nNow(){ return SIZES[sizeI]; }
    function draw(){
      var z = size(), W = z.W, H = z.H, phone = W < 640, out = [], label = '';
      var gW = showGraph ? (phone ? W - 16 : Math.min(360, W * 0.38)) : 0, gH = showGraph ? (phone ? Math.round(H * (sit === 'groups' ? 0.5 : 0.44)) : H - 16) : 0;
      var sx = 8, sy = 8, sw = phone || !showGraph ? W - 16 : W - gW - 32, sh = phone && showGraph ? H - gH - 24 : H - 16;
      var gx = phone ? 8 : W - gW - 8, gy = phone ? sh + 18 : 8;
      if(sit === 'conform'){
        var n = nNow(), v = D.aschPct(n, partner);
        out.push(aschScene(sx, sy, sw, sh, n, partner && n > 0, phone, { me: n === 0 ? 'C' : '?' }));
        if(showGraph){
          var items = SIZES.map(function(s, i){ return { label: SIZE_LAB[i] === 'Alone' ? '0' : SIZE_LAB[i] === '10 to 15' ? '10-15' : SIZE_LAB[i], value: D.aschPct(s, false), on: !partner && i === sizeI }; });
          items.push({ label: 'With a\npartner', value: D.ASCH.partner, on: partner && n > 0, cls: 'is-alt' });
          out.push(bars(gx, gy, gW - (phone ? 0 : 0), gH - 40, items, { title: 'Answers that went along with a wrong majority', source: 'Asch (1951, 1952, 1956)', max: 40, ticks: [0, 10, 20, 30, 40] }));
        }
        label = 'Asch\'s line task. ' + (n === 0 ? 'The participant judges alone.' : n + ' people give the same wrong answer first' + (partner ? ', but one partner answers correctly.' : '.')) + ' ' + line();
      } else if(sit === 'obey'){
        var c = D.byId(D.MILGRAM, cond);
        out.push(milgramScene(sx, sy, sw, sh, cond, phone));
        if(showGraph){
          var fh = phone ? 0 : Math.min(gH * 0.3, gW * 0.32);
          out.push('<text class="si-gt" x="' + n1(gx) + '" y="' + n1(gy + 14) + '">' + esc(c.short) + ': ' + Math.round(c.pct * 0.4) + ' of 40 men went to 450 V</text>');
          if(!phone) out.push(forty(gx, gy + 22, gW, fh, Math.round(c.pct * 0.4)));
          out.push(bars(gx, gy + (phone ? 18 : 30 + fh), gW, gH - fh - (phone ? 20 : 70), D.MILGRAM.map(function(m){ return { label: m.short, value: m.pct, on: m.id === cond }; }), { horizontal: true, source: 'Milgram (1963, 1974); 40 men per condition' }));
        }
        label = 'Milgram\'s obedience lab, condition: ' + c.name + '. ' + line();
      } else if(sit === 'bystand'){
        out.push(boothScene(sx, sy, sw, sh, others, phone));
        if(showGraph){ var di = D.DARLEY.others.indexOf(others); out.push(bars(gx, gy, gW, gH - 40, D.DARLEY.others.map(function(o, i){ return { label: o === 0 ? 'Alone' : o + (o === 1 ? ' other' : ' others'), value: D.DARLEY.beforeEnd[i], on: i === di }; }), { title: 'Reported the seizure before it ended', source: 'Darley and Latane (1968)' })); }
        label = 'Intercom study: the participant believes ' + (others ? others + ' other' + (others > 1 ? 's' : '') + ' can' : 'no one else can') + ' hear the seizure. ' + line();
      } else {
        out.push(groupScene(sx, sy, sw, sh, watched, skill, shout, phone));
        if(showGraph){
          var side = phone, h1 = side ? gH - 30 : (gH - 52) / 2, w1 = side ? (gW - 12) / 2 : gW;
          out.push(bars(gx, gy, w1, h1, [{ label: phone ? 'Good\nalone' : 'Good,\nalone', value: D.FACIL.good[0], on: skill === 'good' && !watched }, { label: phone ? 'Good\nwatched' : 'Good,\nwatched', value: D.FACIL.good[1], on: skill === 'good' && watched }, { label: phone ? 'Weak\nalone' : 'Weaker,\nalone', value: D.FACIL.poor[0], on: skill === 'poor' && !watched, cls: 'is-alt' }, { label: phone ? 'Weak\nwatched' : 'Weaker,\nwatched', value: D.FACIL.poor[1], on: skill === 'poor' && watched, cls: 'is-alt' }], { title: 'Pool shots made', source: phone ? 'Michaels et al. (1982)' : 'Michaels and colleagues (1982)' }));
          out.push(bars(side ? gx + w1 + 12 : gx, side ? gy : gy + h1 + 12, w1, h1, D.LOAF.others.map(function(o, i){ return { label: o === 0 ? 'Alone' : phone ? (o === 1 ? '+1' : '+5') : o === 1 ? '1 other' : '5 others', value: D.LOAF.effort[i], on: shout === o + 1 }; }), { title: phone ? 'Shouting effort' : 'Effort, % of shouting alone', source: phone ? 'Latane et al. (1979)' : 'Latane, Williams and Harkins (1979)' }));
        }
        label = 'Pool player, ' + (skill === 'good' ? 'good' : 'weaker') + ', ' + (watched ? 'watched by four people' : 'unobserved') + '; shouting ' + (shout === 1 ? 'alone' : 'with ' + (shout - 1) + ' others') + '. ' + line();
      }
      svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
      svg.innerHTML = out.join('');
      svg.setAttribute('aria-label', label);
    }
    function line(){
      if(sit === 'conform'){ var n = nNow(), v = D.aschPct(n, partner); return n === 0 ? 'Judging alone, people erred on under 1% of answers.' : partner ? 'With one partner answering correctly, only about ' + pct(v) + ' of answers went along.' : 'With ' + SIZE_LAB[sizeI] + ' giving the wrong answer, about ' + pct(v) + ' of answers went along.'; }
      if(sit === 'obey'){ var c = D.byId(D.MILGRAM, cond); return c.pct + '% (' + Math.round(c.pct * 0.4) + ' of 40) went to the last switch.'; }
      if(sit === 'bystand'){ var i = D.DARLEY.others.indexOf(others); return D.DARLEY.beforeEnd[i] + '% reported it before the seizure ended.'; }
      var f = skill === 'good' ? D.FACIL.good : D.FACIL.poor, li = D.LOAF.others.indexOf(shout - 1);
      return 'Pool: ' + f[watched ? 1 : 0] + '% of shots. Shouting: ' + D.LOAF.effort[li] + '% of solo effort.';
    }
    function words(){
      var head, sub, why, pl = [], pr = [];
      if(sit === 'conform'){
        var n = nNow(), v = D.aschPct(n, partner);
        head = n === 0 ? 'Alone, almost no one gets the lines wrong.' : partner ? 'One ally breaks the spell.' : n === 1 ? 'One other person barely matters.' : n <= 3 ? 'Each extra voice adds pressure, up to about three.' : 'More than three adds little.';
        sub = line() + (n > 0 && !partner ? ' The answer is obvious, so this is mostly normative influence.' : '');
        pl = [{ k: 'Wrong answers first', html: n === 0 ? 'none' : SIZE_LAB[sizeI], tone: 'readout' }]; pr = [{ k: 'Went along', html: pct(v), tone: v > 20 ? 'warn' : 'good' }];
        why = conformWhy();
      } else if(sit === 'obey'){
        var c = D.byId(D.MILGRAM, cond);
        head = c.name + '.'; sub = line();
        pl = [{ k: 'Condition', html: c.short, tone: 'readout' }]; pr = [{ k: 'To 450 V', html: c.pct + '%', tone: c.pct > 40 ? 'warn' : 'good' }];
        why = obeyWhy();
      } else if(sit === 'bystand'){
        var i = D.DARLEY.others.indexOf(others);
        head = others === 0 ? 'Alone, the responsibility is all yours.' : 'The more people who might help, the slower each one acts.';
        sub = line() + ' By the end of the study, ' + D.DARLEY.eventually[i] + '% had reported it.';
        pl = [{ k: 'Others hearing', html: String(others), tone: 'readout' }]; pr = [{ k: 'Helped in time', html: D.DARLEY.beforeEnd[i] + '%', tone: D.DARLEY.beforeEnd[i] > 60 ? 'good' : 'warn' }];
        why = byWhy();
      } else {
        var f = skill === 'good' ? D.FACIL.good : D.FACIL.poor, li = D.LOAF.others.indexOf(shout - 1);
        head = (watched ? (skill === 'good' ? 'Watched, the good player gets better.' : 'Watched, the weaker player gets worse.') : 'Unobserved: the baseline.') + ' ' + (shout > 1 ? 'In a group, each shouts less.' : '');
        sub = line();
        pl = [{ k: 'Pool shots', html: f[watched ? 1 : 0] + '%', tone: 'readout' }]; pr = [{ k: 'Shout effort', html: D.LOAF.effort[li] + '%', tone: shout > 1 ? 'warn' : 'good' }];
        why = groupsWhy();
      }
      T.explain($('.si-say'), '<b>' + esc(head) + '</b> ' + esc(sub), why);
      nums();
      if(LS){ LS.caption('<b>' + esc(head) + '</b> ' + esc(sub), 'explore'); LS.pills(pl, 'left', 'explore'); LS.pills(pr, 'right', 'explore'); }
    }
    function conformWhy(){
      return '<p><b>The study.</b> Asch (1951) seated a college student with 7 to 9 others who were all confederates. On 12 of 18 trials, every confederate gave the same obviously wrong answer before the student. About a third of the student\'s answers went along (36.8% in the 1955 report); about three quarters went along at least once; about a quarter never did. Alone, people erred on under 1%.</p>' +
        '<p><b>What changes it.</b> Conformity rose as a unanimous majority grew from 1 to 3, then leveled off (majorities of 4, 8 and 10 to 15 were tested; the bars show only those). One partner who answered correctly cut it to about 5.5%. Writing answers privately also lowered it, which is why the effect is mostly <b>normative influence</b> (fitting in). When the answer is truly unclear, people follow others because they believe the group knows: <b>informational influence</b>.</p>' +
        '<p><b>Does it hold up?</b> Yes, broadly. A 2023 replication with 202 students in Bern found errors on about 33% of critical trials (Franzen and Mader, 2023). A meta-analysis of 133 studies (Bond and Smith, 1996) found conformity higher in more collectivist cultures and lower in later US samples. The participants in the classic studies were young American men, which limits how far the numbers generalize.</p>';
    }
    function obeyWhy(){
      return '<p><b>The study.</b> Men aged 20 to 50 from New Haven were told the study was about punishment and learning. As the "teacher," each was told to give a learner (an actor, who received no shocks) a shock for every mistake, going up 15 volts at a time to 450 V. The experimenter used four standard prods ("Please continue"). In the first report, 26 of 40 (65%) went to the last switch (Milgram, 1963).</p>' +
        '<p><b>What changes it.</b> Obedience fell when the learner was closer (same room 40%, touch 30%), when the experimenter gave orders by phone (22.5%), and when two peers refused (10%). Moving to a run-down office downtown lowered it only a little (47.5%): the authority of the role mattered more than Yale\'s name.</p>' +
        '<p><b>Does it hold up?</b> Partly. Burger (2009) stopped at 150 V, the point where the learner first demands to be let out, and found 70% continued past it, close to Milgram\'s 82.5%. Archive work found Milgram ran many conditions, and obedience averaged about 43% across 21 of them (Haslam and colleagues, 2014); some participants doubted the shocks were real. The deception and distress are why studies like this now need strict ethics review, debriefing and the right to withdraw.</p>';
    }
    function byWhy(){
      return '<p><b>The study.</b> College students talked over an intercom from separate booths, believing 0, 1 or 4 others were on the line. One "participant" (a recording) had a seizure. Alone, 85% went for help before the seizure ended; with four others believed present, 31% did (Darley and Latane, 1968). This is <b>diffusion of responsibility</b>: each person feels less responsible when others could act.</p>' +
        '<p><b>Does it hold up?</b> The effect is real, but a meta-analysis found it weaker when the danger is obvious and the bystanders know each other (Fischer and colleagues, 2011). Video of 219 real public conflicts in three countries found at least one bystander helped in about 9 of 10, and help was more likely with more people present (Philpot and colleagues, 2020). The famous Kitty Genovese story of 38 silent witnesses was exaggerated, as the newspaper that reported it later said.</p>';
    }
    function groupsWhy(){
      return '<p><b>Social facilitation.</b> An audience raises arousal, which helps on easy, well-learned tasks and hurts on hard or new ones. Good pool players made 71% of shots unobserved and 80% when four people watched; weaker players fell from 36% to 25% (Michaels and colleagues, 1982).</p>' +
        '<p><b>Social loafing.</b> When effort is pooled and no one is judged alone, people do less. Blindfolded students with headphones shouted at 82% of their solo effort when they thought one other person shouted with them, and 74% when they thought five others did; no one else was shouting (Latane, Williams and Harkins, 1979). A meta-analysis found loafing shrinks when each person\'s work is identifiable or the task matters to them (Karau and Williams, 1993).</p>' +
        '<p><b>Do not mix up.</b> Facilitation is about being watched; loafing is about being hidden in a group. Deindividuation is losing restraint when anonymous in a crowd.</p>';
    }
    function nums(){
      var el = $('.si-nums'); if(!el) return;
      el.innerHTML = '<h3 class="ls-title-l">Every number on the graphs, with its source</h3>' +
        T.dataTable(['Wrong answers first', 'Answers that went along'], SIZES.map(function(s, i){ return [SIZE_LAB[i], pct(D.aschPct(s, false))]; }).concat([['3, with one partner answering correctly', pct(D.ASCH.partner)]]), 'Asch (1951, 1952, 1956)') +
        T.dataTable(['Milgram condition', 'Went to 450 V'], D.MILGRAM.map(function(m){ return [m.name, m.pct + '% (' + Math.round(m.pct * 0.4) + ' of 40)']; }), 'Milgram (1963, 1974)') +
        T.dataTable(['Others believed present', 'Before the seizure ended', 'By the end'], D.DARLEY.others.map(function(o, i){ return [String(o), D.DARLEY.beforeEnd[i] + '%', D.DARLEY.eventually[i] + '%']; }), 'Darley and Latane (1968)') +
        T.dataTable(['Pool player', 'Unobserved', 'Watched by four'], [['Good', D.FACIL.good[0] + '%', D.FACIL.good[1] + '%'], ['Weaker', D.FACIL.poor[0] + '%', D.FACIL.poor[1] + '%']], 'Michaels and colleagues (1982)') +
        T.dataTable(['Shouting with', 'Effort (% of alone)'], D.LOAF.others.map(function(o, i){ return [o === 0 ? 'No one' : o + (o === 1 ? ' other' : ' others'), D.LOAF.effort[i] + '%']; }), 'Latane, Williams and Harkins (1979)') +
        '<p class="bt-small">Asch\'s group-size percents are his mean errors out of 12 critical trials. Sizes between those tested are not shown.</p>';
    }
    function studio(pane, s){
      LS = s;
      var sp = T.studioPane(pane, s, { stage: [$('.si-fig')], dock: [$('.si-ctl')], setup: 'Show', moreLabel: 'Graph', why: [$('.si-say')], details: [$('.si-nums')] });
      s.root.addEventListener('click', onClick);
      host.removeEventListener('click', onClick);
      LS.setupRow = sp; sp.setup('Scene and results');
      sync(); draw(); words();
      if(s.mode() === 'explore') hintSlot(s, sSize.input, 'Start here: add people who answer wrong', sSize.el);
      if(window.ResizeObserver){ var t = null; new ResizeObserver(function(){ clearTimeout(t); t = setTimeout(draw, 60); }).observe($('.si-fig')); }
    }
    sync(); draw(); words();
    return { studio: studio };
  }

  /* ------------------------------------------------------ test yourself */
  function quiz(host, data){
    T.drill(host, data, { slug: 'social-influence', noun: 'drill',
      generate: function(r, ctx, type){ return D.generate(r, ctx, type); },
      types: [{ value: 'conformity', label: 'Conformity' }, { value: 'obedience', label: 'Obedience' }, { value: 'bystander', label: 'Bystanders' }, { value: 'groups', label: 'Group effects' }, { value: 'attribution', label: 'Attribution' }, { value: 'compliance', label: 'Persuasion and compliance' }],
      typeLabel: 'Kind of problem',
      title: function(p){ return { conformity: 'Conformity', obedience: 'Obedience', bystander: 'Bystanders', groups: 'Group effects', attribution: 'Attribution', compliance: 'Persuasion and compliance' }[p.type] || 'Practice problem'; },
      extra: function(el, p, api){ api.fig = el; api.st = {}; figure(el, p, api.st); },
      onStep: function(s, right, api){ api.st[s.key] = true; figure(api.fig, api.problem, api.st); }
    });
  }
  /* The drill's figure: the situation as a scene; the published result is
     shown only once the prediction step is answered. */
  function figure(el, p, st){
    var g = p.figure; if(!g){ el.innerHTML = ''; return; }
    var phone = (window.innerWidth || 1280) <= 640, W = phone ? 360 : 640, H = phone ? 300 : 300, out = '', label = '';
    var done = !!st.predict;
    if(g.kind === 'conformity'){
      var n = Math.min(g.n, 8);
      out = aschScene(8, 8, W - 16, H - 16, n, false, phone, { me: '?' });
      label = 'A group of ' + g.n + ' answering before the person in the cerulean shirt, as in Asch\'s line task.';
    } else if(g.kind === 'obedience'){
      out = milgramScene(8, 8, W - 16, H - 16, done ? g.cond : 'voice', phone);
      label = done ? 'Milgram\'s lab in the matching condition.' : 'Milgram\'s obedience lab: teacher, experimenter and learner.';
    } else if(g.kind === 'bystander'){
      out = boothScene(8, 8, W - 16, H - 16, done ? 0 : g.others, phone);
      label = done ? 'The intercom study with the participant alone.' : 'The intercom study with ' + g.others + ' others believed present.';
    } else if(g.kind === 'groups'){
      if(g.setting === 'watched' || g.setting === 'pooled') out = groupScene(8, 8, W - 16, H - 16, g.setting === 'watched', g.task === 'hard' ? 'poor' : 'good', g.setting === 'pooled' ? 6 : 1, phone);
      else out = groupCrowd(W, H, g.setting);
      label = 'A group scene.';
    } else {
      out = talkScene(W, H);
      label = 'Two people talking.';
    }
    el.innerHTML = '<figure class="cd-fig si-qfig"><svg class="si-svg" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(label) + '">' + out + '</svg></figure>';
  }
  function groupCrowd(W, H, kind){
    var g = [], floor = H * 0.86;
    g.push(floorRoom(8, 8, W - 16, H - 16, floor));
    var n = 6, sp = (W - 40) / n, hh = Math.min(H * 0.6, sp * 2.3);
    for(var i = 0; i < n; i++){ var c = CREW[i % 8]; g.push(person({ x: 20 + sp * (i + 0.5), y: floor, h: hh, age: 25 + (i * 7) % 30, skin: c.skin, hair: c.hair, hairStyle: c.hairStyle || 'short', shirt: SHIRTS[i % 4], pose: kind === 'deindividuation' ? 'reach' : i % 2 ? 'cross' : 'stand', face: kind === 'deindividuation' ? 'smile' : 'neutral', facing: i < n / 2 ? 1 : -1, prop: kind === 'deindividuation' ? function(p){ return '<rect x="' + n1(p.hx - p.R * 0.95) + '" y="' + n1(p.shY - p.R * 2.05) + '" width="' + n1(p.R * 1.9) + '" height="' + n1(p.R * 0.6) + '" rx="' + n1(p.R * 0.25) + '" class="si-mask"/>'; } : null })); }
    if(kind !== 'deindividuation') g.push('<rect x="' + n1(W * 0.15) + '" y="' + n1(floor - hh * 0.36) + '" width="' + n1(W * 0.7) + '" height="' + n1(hh * 0.06) + '" rx="3" class="si-table"/>');
    return g.join('');
  }
  function talkScene(W, H){
    var g = [], floor = H * 0.86, hh = H * 0.62;
    g.push(floorRoom(8, 8, W - 16, H - 16, floor));
    g.push(person({ x: W * 0.36, y: floor, h: hh, age: 30, skin: SKIN[1], hair: '#3B2A20', shirt: 'var(--cink)', pose: 'point', facing: 1, face: 'neutral' }));
    g.push(person({ x: W * 0.64, y: floor, h: hh * 0.97, age: 28, skin: SKIN[3], hair: '#1E1A16', hairStyle: 'curly', shirt: 'var(--si-s2)', pose: 'cross', facing: -1, face: 'neutral' }));
    g.push(bubble(W * 0.36, floor - hh * 1.05, '…', 'is-me', 16));
    return g.join('');
  }
})();
