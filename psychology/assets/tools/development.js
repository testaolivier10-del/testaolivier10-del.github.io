/* Development trainer page (docs/appsych-spec.md section 6). OWNED BY THIS
   TOOL ONLY (builder T4). Mounts into #app with ApPsychTools; the model is
   ApPsychMath.development (psychology/assets/tools/math/development.js), the
   content psychology/data/tools/development.json (served filtered as
   assets/tool-data/development.json). The frame is ApPsychTools.modes
   (Explore, then Test yourself) on the Tool Studio.

   Explore: one person, a whole life. Four lenses (the Lens switch):
     Lifespan    the person drawn at the chosen age, in a scene that fits it
                 (a play mat, a block tower, a desk, a backpack, a laptop, a
                 bench), over a timeline of four lanes: thinking (Piaget,
                 then adult intelligence), identity (Erikson), relationships
                 and body and roles. Drag the marker or the Age slider; the
                 bands the person is in light up. Play runs a life from birth
                 to 90 (reduced motion: the end state).
     Attachment  the strange situation in three panels (the parent leaves,
                 alone, the parent returns); pick a pattern and the child's
                 reunion changes.
     Parenting   warmth and demands on two sliders (or drag the dot on the
                 grid); the quadrant names the style and the scene says a
                 line in its voice.
     Aging mind  crystallized and fluid intelligence across adulthood (a
                 sketch of the pattern, labeled as one), the person at that
                 age, and dementia as disease, not normal aging.
   Colors by lane, the same on the timeline, in the captions and in the
   drills: thinking cerulean, identity vermillion, relationships green, body
   and roles purple. Every band is also labeled, so color is never the only cue.
   Test yourself: ApPsychTools.drill over the model's generate(); the figure
   places the person on the timeline and lights the band only once the
   stage step is answered, so it never gives the key away. */
(function(){
  'use strict';
  var T = window.ApPsychTools, M = window.ApPsychMath, P = window.ApPsychPlot;
  if(!T || !M || !M.development || M.development.stub) return;
  var D = M.development, esc = T.esc;
  var AGES = [0, 0.25, 0.5, 0.75, 1, 1.5, 2, 2.5, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 22, 25, 28, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90];
  var LENSES = [{ v: 'life', label: 'Lifespan' }, { v: 'attach', label: 'Attachment' }, { v: 'parent', label: 'Parenting' }, { v: 'aging', label: 'Aging mind' }];
  var LANE_CLS = { think: 'dv-c1', self: 'dv-c2', bond: 'dv-c3', grow: 'dv-c4' };
  var TICKS = [0, 1, 2, 5, 7, 12, 18, 25, 40, 65, 90];
  function ageWords(a){ return D.ageWords(a); }
  function ax(a){ return Math.log(1 + a) / Math.log(91); }

  /* Text width for label fitting (the svg uses the page font). */
  var MEAS = null;
  function textW(t, size, weight){
    try{
      if(!MEAS) MEAS = document.createElement('canvas').getContext('2d');
      MEAS.font = (weight || 700) + ' ' + size + 'px ' + ((getComputedStyle(document.body).getPropertyValue('--font-ui') || '').trim() || 'sans-serif');
      return MEAS.measureText(String(t)).width;
    }catch(e){ return String(t).length * size * 0.56; }
  }
  function f1(v){ return (Math.round(v * 10) / 10).toFixed(1); }

  /* ---------------------------------------------------------- people
     person(o) -> svg: a flat illustrated figure standing on (x, y), height h.
     o: { x, y, h, age, pose, face, facing, look, shirt, pants, hair, skin,
          hairStyle, gray, prop }
     Proportions follow age (a baby's head is about a quarter of its length,
     an adult's about an eighth). Poses: stand, sit, baby, reach, away,
     cross, cane, phone, hold, point, write, freeze. */
  var SKIN = ['#F2C9A5', '#D9A37A', '#B5774F', '#7D4E33'];
  function person(o){
    var a = o.age == null ? 30 : o.age, h = o.h, x = o.x, y = o.y, fc = o.facing || 1;
    var hr = a < 1.5 ? 0.2 : a < 3 ? 0.155 : a < 7 ? 0.13 : a < 12 ? 0.112 : a < 18 ? 0.09 : 0.078;
    var R = h * hr / 1.0 * 0.5 * 1.0, g = [];
    R = h * hr * 0.55;
    var skin = o.skin || SKIN[1], shirt = o.shirt || 'var(--dv-shirt)', pants = o.pants || 'var(--dv-pants)';
    var hair = o.gray ? (a >= 75 ? '#E9E6E0' : '#B9B3AA') : (o.hair || '#3B2A20');
    var sw = R * (a < 7 ? 1.05 : a < 13 ? 1.2 : 1.45), armW = R * (a < 7 ? 0.5 : 0.46), legW = sw * 0.6;
    var pose = o.pose || 'stand', stoop = a >= 75 ? R * 0.35 * fc : 0;
    if(pose === 'baby') return baby(o, R, skin, shirt, hair);
    var seated = pose === 'sit' || pose === 'write';
    var top = y - h, hcY = top + R, shY = hcY + R + R * 0.35;
    var hipY = seated ? y - h * 0.34 : shY + h * (a < 7 ? 0.27 : 0.3);
    if(seated){ shY = hipY - h * (a < 7 ? 0.27 : 0.3); hcY = shY - R - R * 0.35; }
    var hx = x + stoop;
    // legs
    if(seated){
      var kx = x + fc * h * 0.2;
      g.push('<path d="M' + (x - sw * 0.3) + ' ' + hipY + ' L' + kx + ' ' + hipY + ' L' + kx + ' ' + (y - 2) + '" fill="none" stroke="' + pants + '" stroke-width="' + legW + '" stroke-linecap="round" stroke-linejoin="round"/>');
      g.push('<ellipse cx="' + (kx + fc * legW * 0.45) + '" cy="' + (y - legW * 0.25) + '" rx="' + (legW * 0.75) + '" ry="' + (legW * 0.38) + '" class="dv-shoe"/>');
    } else {
      [-1, 1].forEach(function(s){
        var lx0 = x + s * sw * 0.42, lx1 = x + s * sw * 0.5 + (pose === 'freeze' && s > 0 ? fc * R * 0.5 : 0);
        g.push('<line x1="' + lx0 + '" y1="' + hipY + '" x2="' + lx1 + '" y2="' + (y - legW * 0.4) + '" stroke="' + pants + '" stroke-width="' + legW + '" stroke-linecap="round"/>');
        g.push('<ellipse cx="' + (lx1 + fc * legW * 0.3) + '" cy="' + (y - legW * 0.25) + '" rx="' + (legW * 0.7) + '" ry="' + (legW * 0.36) + '" class="dv-shoe"/>');
      });
    }
    // long hair behind
    if(o.hairStyle === 'long') g.push('<path d="M' + (hx - R * 1.02) + ' ' + (hcY - R * 0.1) + ' Q' + (hx - R * 1.15) + ' ' + (hcY + R * 1.6) + ' ' + (hx - R * 0.55) + ' ' + (hcY + R * 1.9) + ' L' + (hx + R * 0.55) + ' ' + (hcY + R * 1.9) + ' Q' + (hx + R * 1.15) + ' ' + (hcY + R * 1.6) + ' ' + (hx + R * 1.02) + ' ' + (hcY - R * 0.1) + ' Z" fill="' + hair + '"/>');
    // far arm (behind the body)
    var shL = hx - sw * 0.9, shR = hx + sw * 0.9, sy = shY + armW * 0.5;
    var arms = armPose(pose, a, hx, sy, sw, R, h, hipY, fc, seated);
    g.push(armPath(arms[0], armW, shirt, skin, true));
    // torso
    var rr = Math.min(sw * 0.5, R * 0.7), tb = hipY + (seated ? 0 : R * 0.15);
    g.push('<path d="M' + (hx - sw + rr) + ' ' + shY + ' Q' + (hx - sw) + ' ' + shY + ' ' + (hx - sw) + ' ' + (shY + rr) + ' L' + (x - sw * 0.88) + ' ' + tb + ' Q' + x + ' ' + (tb + R * 0.25) + ' ' + (x + sw * 0.88) + ' ' + tb + ' L' + (hx + sw) + ' ' + (shY + rr) + ' Q' + (hx + sw) + ' ' + shY + ' ' + (hx + sw - rr) + ' ' + shY + ' Z" fill="' + shirt + '"/>');
    if(o.coat) g.push('<path d="M' + (hx - sw * 0.2) + ' ' + shY + ' L' + (x - sw * 0.05) + ' ' + tb + ' M' + (hx + sw * 0.2) + ' ' + shY + ' L' + (x + sw * 0.05) + ' ' + tb + '" stroke="var(--dv-line)" stroke-width="1.2" fill="none"/>');
    // neck and head
    g.push('<rect x="' + (hx - R * 0.28) + '" y="' + (hcY + R * 0.7) + '" width="' + (R * 0.56) + '" height="' + (R * 0.7) + '" fill="' + skin + '"/>');
    g.push(head(hx, hcY, R, a, skin, hair, o, fc));
    // near arm
    g.push(armPath(arms[1], armW, shirt, skin, false));
    if(o.prop) g.push(o.prop({ x: x, hx: hx, R: R, sw: sw, shY: shY, hipY: hipY, hand: arms[1].hand, far: arms[0].hand, fc: fc, h: h }));
    return '<g class="dv-person">' + g.join('') + '</g>';
  }
  function armPose(pose, a, hx, sy, sw, R, h, hipY, fc, seated){
    var L = hx - sw * 0.88, Rr = hx + sw * 0.88, down = hipY + R * 0.2, len = h * (a < 7 ? 0.26 : 0.3);
    function arm(sx, ex, ey, mx, my){ return { s: [sx, sy], m: mx == null ? null : [mx, my], hand: [ex, ey] }; }
    var far = fc > 0 ? L : Rr, near = fc > 0 ? Rr : L;
    switch(pose){
      case 'reach': return [arm(far, far + fc * len * 0.55, sy - len * 0.7), arm(near, near + fc * len * 0.6, sy - len * 0.75)];
      case 'cross': return [arm(far, hx + fc * sw * 0.55, sy + R * 0.9, far + fc * R * 0.1, sy + R * 1.3), arm(near, hx - fc * sw * 0.55, sy + R * 0.75, near - fc * R * 0.1, sy + R * 1.2)];
      case 'cane': return [arm(far, far - fc * R * 0.15, down), arm(near, near + fc * len * 0.45, sy + len * 0.75)];
      case 'phone': return [arm(far, far - fc * R * 0.1, down), arm(near, hx + fc * R * 0.9, sy - R * 1.1, near + fc * R * 0.5, sy + R * 1.0)];
      case 'hold': return [arm(far, hx + fc * sw * 0.2, sy + len * 0.55, far + fc * R * 0.2, sy + len * 0.5), arm(near, hx + fc * sw * 1.1, sy + len * 0.5, near + fc * R * 0.2, sy + len * 0.55)];
      case 'point': return [arm(far, far - fc * R * 0.1, down), arm(near, near + fc * len * 0.95, sy - len * 0.15)];
      case 'write': return [arm(far, hx + fc * sw * 1.3, sy + len * 0.62, far + fc * R * 0.2, sy + len * 0.55), arm(near, hx + fc * sw * 1.9, sy + len * 0.66, near + fc * R * 0.3, sy + len * 0.6)];
      case 'freeze': return [arm(far, far - fc * len * 0.35, sy + len * 0.55), arm(near, near + fc * len * 0.15, sy + len * 0.62)];
      case 'away': return [arm(far, far + fc * len * 0.1, down + R * 0.2), arm(near, near - fc * len * 0.5, sy + len * 0.75)];
      case 'sit': return [arm(far, far + fc * len * 0.35, hipY - R * 0.2), arm(near, near + fc * len * 0.4, hipY - R * 0.1)];
      default: return [arm(far, far - fc * R * 0.12, down), arm(near, near + fc * R * 0.12, down)];
    }
  }
  function armPath(A, w, shirt, skin, far){
    var d = 'M' + A.s[0] + ' ' + A.s[1] + (A.m ? ' Q' + A.m[0] + ' ' + A.m[1] + ' ' : ' L') + A.hand[0] + ' ' + A.hand[1];
    return '<path d="' + d + '" fill="none" stroke="' + shirt + '" stroke-width="' + w + '" stroke-linecap="round"' + (far ? ' class="dv-far"' : '') + '/><circle cx="' + A.hand[0] + '" cy="' + A.hand[1] + '" r="' + (w * 0.55) + '" fill="' + skin + '"/>';
  }
  function head(cx, cy, R, a, skin, hair, o, fc){
    var g = [], face = o.face || 'smile', turn = o.look === 'away' ? -fc : fc, ex = turn * R * 0.12;
    g.push('<circle cx="' + (cx - turn * R * 0.86) + '" cy="' + (cy + R * 0.12) + '" r="' + (R * 0.22) + '" fill="' + skin + '"/>');
    g.push('<circle cx="' + cx + '" cy="' + cy + '" r="' + R + '" fill="' + skin + '"/>');
    // hair on top
    if(a < 1.5) g.push('<path d="M' + (cx - R * 0.25) + ' ' + (cy - R * 0.95) + ' q' + (R * 0.2) + ' ' + (-R * 0.35) + ' ' + (R * 0.45) + ' ' + (-R * 0.1) + '" stroke="' + hair + '" stroke-width="' + (R * 0.14) + '" fill="none" stroke-linecap="round"/>');
    else if(o.hairStyle === 'bald') g.push('<path d="M' + (cx - R * 1.0) + ' ' + (cy - R * 0.05) + ' Q' + (cx - R * 1.02) + ' ' + (cy - R * 0.5) + ' ' + (cx - R * 0.78) + ' ' + (cy - R * 0.62) + ' L' + (cx - R * 0.7) + ' ' + (cy - R * 0.2) + ' Z M' + (cx + R * 1.0) + ' ' + (cy - R * 0.05) + ' Q' + (cx + R * 1.02) + ' ' + (cy - R * 0.5) + ' ' + (cx + R * 0.78) + ' ' + (cy - R * 0.62) + ' L' + (cx + R * 0.7) + ' ' + (cy - R * 0.2) + ' Z" fill="' + hair + '"/>');
    else g.push('<path d="M' + (cx - R * 1.04) + ' ' + (cy + R * 0.05) + ' Q' + (cx - R * 1.12) + ' ' + (cy - R * 1.2) + ' ' + cx + ' ' + (cy - R * 1.08) + ' Q' + (cx + R * 1.12) + ' ' + (cy - R * 1.2) + ' ' + (cx + R * 1.04) + ' ' + (cy + R * 0.05) + ' Q' + (cx + R * 0.95) + ' ' + (cy - R * 0.5) + ' ' + (cx + turn * R * 0.1) + ' ' + (cy - R * 0.5) + ' Q' + (cx - R * 0.8) + ' ' + (cy - R * 0.45) + ' ' + (cx - R * 1.04) + ' ' + (cy + R * 0.05) + ' Z" fill="' + hair + '"/>');
    if(o.hairStyle === 'bun') g.push('<circle cx="' + (cx - turn * R * 0.5) + '" cy="' + (cy - R * 1.05) + '" r="' + (R * 0.38) + '" fill="' + hair + '"/>');
    if(o.look === 'away'){ g.push('<path d="M' + (cx - R * 1.04) + ' ' + (cy + R * 0.05) + ' Q' + cx + ' ' + (cy + R * 0.3) + ' ' + (cx + R * 1.04) + ' ' + (cy + R * 0.05) + ' Q' + (cx + R * 1.1) + ' ' + (cy - R * 1.1) + ' ' + cx + ' ' + (cy - R * 1.08) + ' Q' + (cx - R * 1.1) + ' ' + (cy - R * 1.1) + ' ' + (cx - R * 1.04) + ' ' + (cy + R * 0.05) + ' Z" fill="' + hair + '" opacity=".95"/>'); return g.join(''); }
    // eyes, brows, mouth
    var ey = cy + R * 0.05, er = R * 0.1;
    [-1, 1].forEach(function(s){ g.push('<ellipse cx="' + (cx + ex + s * R * 0.36) + '" cy="' + ey + '" rx="' + er + '" ry="' + (er * 1.2) + '" class="dv-eye"/>'); });
    if(face === 'sad' || face === 'cry' || face === 'worried') [-1, 1].forEach(function(s){ g.push('<path d="M' + (cx + ex + s * R * 0.52) + ' ' + (ey - R * 0.3) + ' L' + (cx + ex + s * R * 0.2) + ' ' + (ey - R * 0.38) + '" class="dv-brow"/>'); });
    if(face === 'angry') [-1, 1].forEach(function(s){ g.push('<path d="M' + (cx + ex + s * R * 0.52) + ' ' + (ey - R * 0.38) + ' L' + (cx + ex + s * R * 0.2) + ' ' + (ey - R * 0.26) + '" class="dv-brow"/>'); });
    var my = cy + R * 0.45, mx = cx + ex;
    if(face === 'smile') g.push('<path d="M' + (mx - R * 0.28) + ' ' + my + ' Q' + mx + ' ' + (my + R * 0.26) + ' ' + (mx + R * 0.28) + ' ' + my + '" class="dv-mouth"/>');
    else if(face === 'neutral' || face === 'worried') g.push('<path d="M' + (mx - R * 0.2) + ' ' + (my + R * 0.06) + ' L' + (mx + R * 0.2) + ' ' + (my + R * 0.06) + '" class="dv-mouth"/>');
    else if(face === 'cry' || face === 'angry') g.push('<ellipse cx="' + mx + '" cy="' + (my + R * 0.1) + '" rx="' + (R * 0.22) + '" ry="' + (R * 0.16) + '" class="dv-mouth-o"/>');
    else g.push('<path d="M' + (mx - R * 0.25) + ' ' + (my + R * 0.16) + ' Q' + mx + ' ' + (my - R * 0.06) + ' ' + (mx + R * 0.25) + ' ' + (my + R * 0.16) + '" class="dv-mouth"/>');
    if(face === 'cry') g.push('<path d="M' + (cx + ex + R * 0.4) + ' ' + (ey + R * 0.18) + ' q' + (R * 0.08) + ' ' + (R * 0.25) + ' 0 ' + (R * 0.35) + ' q' + (-R * 0.08) + ' ' + (-R * 0.1) + ' 0 ' + (-R * 0.35) + '" class="dv-tear"/>');
    if(face !== 'angry') [-1, 1].forEach(function(s){ g.push('<circle cx="' + (cx + ex + s * R * 0.55) + '" cy="' + (cy + R * 0.32) + '" r="' + (R * 0.14) + '" class="dv-blush"/>'); });
    if(o.glasses) g.push('<g class="dv-glass"><circle cx="' + (cx + ex - R * 0.36) + '" cy="' + ey + '" r="' + (R * 0.24) + '"/><circle cx="' + (cx + ex + R * 0.36) + '" cy="' + ey + '" r="' + (R * 0.24) + '"/><path d="M' + (cx + ex - R * 0.12) + ' ' + ey + ' h' + (R * 0.24) + '"/></g>');
    return g.join('');
  }
  function baby(o, R, skin, shirt, hair){
    var x = o.x, y = o.y, h = o.h, g = [], hcY = y - h + R, body = y - h * 0.32;
    g.push('<ellipse cx="' + x + '" cy="' + (y - h * 0.08) + '" rx="' + (R * 1.25) + '" ry="' + (h * 0.1) + '" fill="' + skin + '"/>');
    g.push('<ellipse cx="' + x + '" cy="' + (y - h * 0.1) + '" rx="' + (R * 1.05) + '" ry="' + (h * 0.09) + '" class="dv-diaper"/>');
    g.push('<ellipse cx="' + x + '" cy="' + body + '" rx="' + (R * 0.95) + '" ry="' + (h * 0.2) + '" fill="' + shirt + '"/>');
    [-1, 1].forEach(function(s){ g.push('<path d="M' + (x + s * R * 0.8) + ' ' + (body - h * 0.1) + ' Q' + (x + s * R * 1.5) + ' ' + body + ' ' + (x + s * R * 1.2) + ' ' + (body + h * 0.1) + '" stroke="' + shirt + '" stroke-width="' + (R * 0.45) + '" fill="none" stroke-linecap="round"/><circle cx="' + (x + s * R * 1.2) + '" cy="' + (body + h * 0.1) + '" r="' + (R * 0.24) + '" fill="' + skin + '"/>'); });
    g.push(head(x, hcY, R, 0.5, skin, hair, o, o.facing || 1));
    if(o.prop) g.push(o.prop({ x: x, R: R, hand: [x + R * 1.2, body + h * 0.1], h: h }));
    return '<g class="dv-person">' + g.join('') + '</g>';
  }
  /* The same person all through the life lens. */
  var ME = { skin: SKIN[1], hair: '#3B2A20', hairStyle: 'short' };
  function heightAt(a){ return a < 1 ? 0.3 : a < 2 ? 0.36 : a < 18 ? 0.36 + (a - 2) / 16 * 0.6 : 0.96 - Math.max(0, a - 75) * 0.003; }

  /* A scene for an age: the props and backdrop around the person. */
  function lifeScene(a, X, Y, W, H, phone){
    var g = [], floor = Y + H - (phone ? 10 : 16), maxH = H * 0.86, ph = maxH * heightAt(a), cx = X + W * 0.5;
    g.push('<rect x="' + X + '" y="' + Y + '" width="' + W + '" height="' + H + '" rx="14" class="dv-room"/>');
    g.push('<rect x="' + X + '" y="' + floor + '" width="' + W + '" height="' + (Y + H - floor) + '" class="dv-floor"/>');
    // window
    var wx = X + W * 0.08, wy = Y + H * 0.1, ww = Math.min(W * 0.22, 90), wh = H * 0.3;
    g.push('<rect x="' + wx + '" y="' + wy + '" width="' + ww + '" height="' + wh + '" rx="6" class="dv-window"/><path d="M' + (wx + ww / 2) + ' ' + wy + ' v' + wh + ' M' + wx + ' ' + (wy + wh / 2) + ' h' + ww + '" class="dv-mullion"/>');
    var o = { x: cx, y: floor, h: ph, age: a, skin: ME.skin, hair: ME.hair, hairStyle: a >= 60 ? 'bald' : 'short', gray: a >= 55, face: 'smile' };
    if(a < 1.5){
      o.pose = 'baby'; o.h = maxH * 0.42;
      g.push('<ellipse cx="' + cx + '" cy="' + (floor - 2) + '" rx="' + (W * 0.3) + '" ry="10" class="dv-mat"/>');
      o.prop = function(p){ return '<g class="dv-rattle"><line x1="' + p.hand[0] + '" y1="' + p.hand[1] + '" x2="' + (p.hand[0] + p.R * 0.6) + '" y2="' + (p.hand[1] - p.R * 0.9) + '"/><circle cx="' + (p.hand[0] + p.R * 0.75) + '" cy="' + (p.hand[1] - p.R * 1.1) + '" r="' + (p.R * 0.32) + '"/></g>'; };
      g.push(toyBlocks(cx - W * 0.22, floor, Math.max(10, H * 0.07), 2));
    } else if(a < 3){
      o.pose = 'hold'; o.facing = -1;
      g.push(toyBlocks(cx - ph * 0.55, floor, Math.max(10, ph * 0.13), 3));
    } else if(a < 7){
      o.pose = 'hold';
      o.prop = function(p){ return plane(p.hand[0] + p.R * 0.2, p.hand[1] - p.R * 0.4, p.R * 1.4); };
      g.push(toyBlocks(cx + ph * 0.55, floor, Math.max(9, ph * 0.1), 2));
    } else if(a < 12){
      o.pose = 'write';
      var dx = cx + ph * 0.32, dt = floor - ph * 0.42;
      g.push('<rect x="' + (dx - ph * 0.02) + '" y="' + dt + '" width="' + (ph * 0.42) + '" height="' + (ph * 0.04) + '" rx="2" class="dv-desk"/><line x1="' + (dx + ph * 0.36) + '" y1="' + dt + '" x2="' + (dx + ph * 0.36) + '" y2="' + floor + '" class="dv-deskleg"/>');
      g.push('<rect x="' + (dx + ph * 0.06) + '" y="' + (dt - ph * 0.025) + '" width="' + (ph * 0.2) + '" height="' + (ph * 0.025) + '" class="dv-book"/>');
      g.push(chair(cx - ph * 0.05, floor, ph * 0.34, -1));
      o.x = cx - ph * 0.02;
    } else if(a < 18){
      o.pose = 'phone'; o.hairStyle = 'short';
      o.prop = function(p){ return '<rect x="' + (p.hand[0] - p.R * 0.18) + '" y="' + (p.hand[1] - p.R * 0.45) + '" width="' + (p.R * 0.36) + '" height="' + (p.R * 0.62) + '" rx="' + (p.R * 0.08) + '" class="dv-phone"/>' + '<rect x="' + (p.x - p.sw * 1.15) + '" y="' + (p.shY + p.R * 0.2) + '" width="' + (p.sw * 0.5) + '" height="' + (p.R * 2.4) + '" rx="' + (p.R * 0.3) + '" class="dv-pack"/>'; };
    } else if(a < 25){
      o.pose = 'hold';
      o.prop = function(p){ return '<rect x="' + (p.hand[0] - p.R * 0.15) + '" y="' + (p.hand[1] - p.R * 0.9) + '" width="' + (p.R * 0.62) + '" height="' + (p.R * 0.8) + '" rx="' + (p.R * 0.1) + '" class="dv-mug"/><path d="M' + (p.hand[0] + p.R * 0.12) + ' ' + (p.hand[1] - p.R * 1.05) + ' q' + (p.R * 0.12) + ' ' + (-p.R * 0.25) + ' 0 ' + (-p.R * 0.5) + '" class="dv-steam"/>'; };
    } else if(a < 65){
      o.pose = a >= 40 ? 'point' : 'hold'; o.glasses = a >= 45;
      if(a >= 40){ var bx = cx + ph * 0.42; g.push('<rect x="' + bx + '" y="' + (floor - ph * 0.85) + '" width="' + (ph * 0.36) + '" height="' + (ph * 0.3) + '" rx="4" class="dv-board"/><path d="M' + (bx + ph * 0.05) + ' ' + (floor - ph * 0.62) + ' l' + (ph * 0.08) + ' ' + (-ph * 0.08) + ' l' + (ph * 0.07) + ' ' + (ph * 0.04) + ' l' + (ph * 0.1) + ' ' + (-ph * 0.1) + '" class="dv-chart"/>'); o.x = cx - ph * 0.08; }
      else o.prop = function(p){ return '<rect x="' + (p.hand[0] - p.R * 0.7) + '" y="' + (p.hand[1] - p.R * 0.1) + '" width="' + (p.R * 1.4) + '" height="' + (p.R * 1.0) + '" rx="' + (p.R * 0.12) + '" class="dv-case"/>'; };
    } else {
      o.glasses = true;
      if(a >= 75){ o.pose = 'cane'; o.prop = function(p){ return '<path d="M' + p.hand[0] + ' ' + p.hand[1] + ' L' + (p.hand[0] + p.fc * p.R * 0.3) + ' ' + floor + ' M' + p.hand[0] + ' ' + p.hand[1] + ' q' + (-p.fc * p.R * 0.4) + ' ' + (-p.R * 0.3) + ' ' + (-p.fc * p.R * 0.5) + ' ' + (p.R * 0.15) + '" class="dv-cane"/>'; }; }
      else { o.pose = 'sit'; g.push(bench(cx, floor, ph * 0.36, ph * 0.9)); }
    }
    g.push(person(o));
    return g.join('');
  }
  function toyBlocks(x, floor, s, n){ var g = [], cls = ['dv-blk1', 'dv-blk2', 'dv-blk3']; for(var i = 0; i < n; i++) g.push('<rect x="' + (x - s / 2 + (i % 2) * s * 0.12) + '" y="' + (floor - s * (i + 1)) + '" width="' + s + '" height="' + s + '" rx="2" class="' + cls[i % 3] + '"/>'); return g.join(''); }
  function plane(x, y, s){ return '<g class="dv-plane"><path d="M' + (x - s * 0.5) + ' ' + y + ' L' + (x + s * 0.5) + ' ' + y + ' L' + (x + s * 0.62) + ' ' + (y - s * 0.08) + ' L' + (x - s * 0.4) + ' ' + (y - s * 0.08) + ' Z"/><path d="M' + (x - s * 0.05) + ' ' + (y - s * 0.05) + ' L' + (x + s * 0.12) + ' ' + (y - s * 0.38) + ' L' + (x + s * 0.24) + ' ' + (y - s * 0.05) + ' Z"/><path d="M' + (x - s * 0.48) + ' ' + (y - s * 0.05) + ' L' + (x - s * 0.5) + ' ' + (y - s * 0.24) + ' L' + (x - s * 0.36) + ' ' + (y - s * 0.07) + ' Z"/></g>'; }
  function chair(x, floor, s, fc){ return '<g class="dv-chair"><rect x="' + (x - s * 0.35) + '" y="' + (floor - s * 0.98) + '" width="' + (s * 0.7) + '" height="' + (s * 0.08) + '" rx="2"/><line x1="' + (x - s * 0.3) + '" y1="' + (floor - s * 0.92) + '" x2="' + (x - s * 0.3) + '" y2="' + floor + '"/><line x1="' + (x + s * 0.3) + '" y1="' + (floor - s * 0.92) + '" x2="' + (x + s * 0.3) + '" y2="' + floor + '"/><line x1="' + (x + fc * s * 0.33) + '" y1="' + (floor - s * 0.95) + '" x2="' + (x + fc * s * 0.36) + '" y2="' + (floor - s * 2.0) + '"/></g>'; }
  function bench(x, floor, s, w){ return '<g class="dv-chair"><rect x="' + (x - w * 0.45) + '" y="' + (floor - s * 0.98) + '" width="' + (w * 0.9) + '" height="' + (s * 0.1) + '" rx="3"/><rect x="' + (x - w * 0.45) + '" y="' + (floor - s * 1.9) + '" width="' + (w * 0.9) + '" height="' + (s * 0.1) + '" rx="3"/><line x1="' + (x - w * 0.38) + '" y1="' + (floor - s * 0.9) + '" x2="' + (x - w * 0.38) + '" y2="' + floor + '"/><line x1="' + (x + w * 0.38) + '" y1="' + (floor - s * 0.9) + '" x2="' + (x + w * 0.38) + '" y2="' + floor + '"/><line x1="' + (x - w * 0.38) + '" y1="' + (floor - s * 1.9) + '" x2="' + (x - w * 0.38) + '" y2="' + (floor - s * 0.98) + '"/><line x1="' + (x + w * 0.38) + '" y1="' + (floor - s * 1.9) + '" x2="' + (x + w * 0.38) + '" y2="' + (floor - s * 0.98) + '"/></g>'; }

  /* ------------------------------------------------- the timeline */
  /* timeline(X, Y, W, H, age, o) -> svg: four lanes of bands on a log age
     axis, the current bands filled, a marker at the age. o.hide: lanes whose
     bands are drawn without labels or highlight (a drill before its step);
     o.only: one lane. Returns { svg, x(age) } so a drag can invert it. */
  function timeline(X, Y, W, H, age, o){
    o = o || {};
    var phone = W < 520, lanes = o.only ? D.LANES.filter(function(l){ return l.id === o.only; }) : D.LANES;
    var labW = phone ? 0 : 118, x0 = X + labW + 6, x1 = X + W - 12, axisH = 26;
    var laneGap = phone ? 20 : 8, lh = Math.max(22, Math.min(46, (H - axisH - lanes.length * laneGap) / lanes.length)), g = [];
    var xa = function(a){ return x0 + ax(a) * (x1 - x0); };
    var y = Y + (phone ? 16 : 4);
    lanes.forEach(function(L){
      var cls = LANE_CLS[L.id], hide = o.hide && o.hide.indexOf(L.id) > -1;
      if(phone) g.push('<text class="dv-lane-h ' + cls + '-t" x="' + x0 + '" y="' + (y - 5) + '">' + esc(L.name) + '</text>');
      else g.push('<text class="dv-lane-h ' + cls + '-t" x="' + X + '" y="' + (y + lh / 2 - 2) + '">' + esc(L.name) + '</text><text class="dv-lane-s" x="' + X + '" y="' + (y + lh / 2 + 12) + '">' + esc(L.theory.length > 22 ? L.theory.split(',')[0] : L.theory) + '</text>');
      L.bands.forEach(function(b, i){
        var bx0 = xa(b[0]) + 1, bx1 = xa(b[1]) - 1, on = !hide && age != null && age >= b[0] && (age < b[1] || (b[1] === 90 && age >= 90));
        g.push('<rect x="' + bx0.toFixed(1) + '" y="' + y + '" width="' + Math.max(1, bx1 - bx0).toFixed(1) + '" height="' + lh + '" rx="7" class="dv-band ' + cls + (on ? ' is-on' : (i % 2 ? ' is-alt' : '')) + '"/>');
        if(hide) return;
        var size = phone ? 10.5 : 12, full = b[2], short = b[3], room = bx1 - bx0 - 10, txt = textW(full, size, 800) <= room ? full : textW(short, size, 800) <= room ? short : (textW(short.charAt(0), size, 800) <= room && room > 9 ? short.charAt(0) : '');
        if(txt) g.push('<text class="dv-band-t' + (on ? ' is-on' : '') + '" x="' + ((bx0 + bx1) / 2).toFixed(1) + '" y="' + (y + lh / 2 + size * 0.36).toFixed(1) + '" text-anchor="middle" font-size="' + size + '">' + esc(txt) + '</text>');
      });
      y += lh + laneGap;
    });
    var by = y - laneGap + 6;
    g.push('<line class="dv-axis" x1="' + x0 + '" x2="' + x1 + '" y1="' + by + '" y2="' + by + '"/>');
    TICKS.forEach(function(t){
      if(phone && (t === 1 || t === 7 || t === 25)) return;
      g.push('<line class="dv-axis" x1="' + xa(t).toFixed(1) + '" x2="' + xa(t).toFixed(1) + '" y1="' + by + '" y2="' + (by + 4) + '"/><text class="dv-tick" x="' + xa(t).toFixed(1) + '" y="' + (by + 16) + '" text-anchor="middle">' + t + '</text>');
    });
    if(!phone) g.push('<text class="dv-tick" x="' + X + '" y="' + (by + 16) + '">Age (years)</text>');
    if(age != null){
      var mx = xa(Math.min(90, age)), top = Y + (phone ? 4 : 0);
      g.push('<line class="dv-mark" x1="' + mx.toFixed(1) + '" x2="' + mx.toFixed(1) + '" y1="' + top + '" y2="' + by + '"/>');
      g.push('<g class="dv-handle"><circle cx="' + mx.toFixed(1) + '" cy="' + by + '" r="9"/><text x="' + mx.toFixed(1) + '" y="' + (by + 3.6) + '" text-anchor="middle">⇔</text></g>');
    }
    return { svg: g.join(''), x: xa, x0: x0, x1: x1, bottom: by + 20 };
  }

  /* ------------------------------------------------- attachment */
  var REUNION = {
    secure: { leave: 'cry', leavePose: 'reach', back: 'smile', backPose: 'reach', note: ['Upset, protests', 'Comforted by no one fully', 'Seeks parent, calms, plays again'] },
    avoidant: { leave: 'neutral', leavePose: 'hold', back: 'neutral', backPose: 'away', note: ['Little distress', 'Keeps playing', 'Turns away, ignores the parent'] },
    anxious: { leave: 'cry', leavePose: 'reach', back: 'angry', backPose: 'cross', note: ['Very distressed', 'Clings, hard to soothe', 'Reaches, then pushes away'] },
    disorganized: { leave: 'worried', leavePose: 'freeze', back: 'worried', backPose: 'freeze', note: ['Confused reaction', 'Dazed, still', 'Approaches looking away, freezes'] }
  };
  function attachScene(style, W, H){
    var phone = W < 560, n = 3, g = [], gap = 10, A = REUNION[style];
    var cols = phone ? 1 : 3, pw = phone ? W - 16 : (W - 16 - gap * 2) / 3, ph = phone ? (H - 16 - gap * 2) / 3 : Math.min(H - 16, pw * 1.15);
    var titles = ['1. Parent leaves', '2. Alone in the room', '3. Parent returns'];
    for(var i = 0; i < n; i++){
      var px = 8 + (phone ? 0 : i * (pw + gap)), py = 8 + (phone ? i * (ph + gap) : (H - 16 - ph) / 2), floor = py + ph - 12;
      g.push('<rect x="' + px + '" y="' + py + '" width="' + pw + '" height="' + ph + '" rx="12" class="dv-room' + (i === 2 ? ' is-key' : '') + '"/><rect x="' + px + '" y="' + floor + '" width="' + pw + '" height="12" class="dv-floor"/>');
      // door on the left
      var dw = Math.min(pw * 0.18, ph * 0.28), dh = Math.min(ph * 0.7, dw * 2.3);
      g.push('<rect x="' + (px + 10) + '" y="' + (floor - dh) + '" width="' + dw + '" height="' + dh + '" rx="3" class="dv-door' + (i === 1 ? '' : ' is-open') + '"/><circle cx="' + (px + 10 + dw * 0.8) + '" cy="' + (floor - dh * 0.48) + '" r="2" class="dv-knob"/>');
      var kidH = Math.min(ph * 0.42, 90), kidX = px + pw * (phone ? 0.62 : 0.64);
      g.push(toyBlocks(kidX + kidH * 0.6, floor, Math.max(8, kidH * 0.17), 2));
      var adultH = Math.min(ph * 0.8, kidH * 2.1);
      if(i === 0) g.push(person({ x: px + 10 + dw * 0.5, y: floor, h: adultH, age: 32, skin: SKIN[2], hair: '#2A1C14', hairStyle: 'long', shirt: 'var(--dv-shirt2)', pose: 'away', facing: -1, look: 'away' }));
      if(i === 2) g.push(person({ x: px + 10 + dw + adultH * 0.18, y: floor, h: adultH, age: 32, skin: SKIN[2], hair: '#2A1C14', hairStyle: 'long', shirt: 'var(--dv-shirt2)', pose: style === 'secure' ? 'reach' : 'stand', facing: 1, face: 'smile' }));
      var face = i === 0 ? A.leave : i === 1 ? (style === 'avoidant' ? 'neutral' : style === 'secure' ? 'sad' : style === 'anxious' ? 'cry' : 'worried') : A.back;
      var pose = i === 0 ? A.leavePose : i === 1 ? (style === 'avoidant' ? 'hold' : style === 'disorganized' ? 'freeze' : 'stand') : A.backPose;
      var look = (i === 2 && (style === 'avoidant' || style === 'disorganized')) ? 'away' : null;
      var fc = i === 2 && style === 'avoidant' ? 1 : -1;
      g.push(person({ x: kidX, y: floor, h: kidH, age: 1.6, skin: SKIN[2], hair: '#2A1C14', shirt: 'var(--dv-kid)', pants: 'var(--dv-kidpants)', pose: pose, face: face, facing: fc, look: look }));
      if(style === 'disorganized' && i > 0) g.push('<text class="dv-q" x="' + (kidX + kidH * 0.32) + '" y="' + (floor - kidH * 1.05) + '">?</text>');
      g.push('<text class="dv-ptitle" x="' + (px + 10) + '" y="' + (py + 20) + '">' + titles[i] + '</text>');
      g.push('<text class="dv-pnote' + (i === 2 ? ' is-key' : '') + '" x="' + (px + pw - 10) + '" y="' + (py + 20) + '" text-anchor="end">' + (phone || pw > 230 ? A.note[i] : '') + '</text>');
    }
    return g.join('');
  }

  /* --------------------------------------------------- parenting */
  var SAYS = {
    authoritative: '“Curfew is 10. Here is why. If something comes up, let us talk.”',
    authoritarian: '“Curfew is 10. Because I said so.”',
    permissive: '“Come home whenever you like, sweetie.”',
    uninvolved: '“Mm-hm.” (still looking at the phone)'
  };
  function parentScene(w, d, W, H){
    var phone = W < 560, g = [], st = D.parentStyle(w, d);
    // grid
    var gs = phone ? Math.min(W - 70, H * 0.48) : Math.min(H - 70, W * 0.42), gx = phone ? (W - gs) / 2 + 12 : 52, gy = phone ? 16 : (H - gs) / 2 - 6;
    var sx = function(v){ return gx + v / 10 * gs; }, sy = function(v){ return gy + gs - v / 10 * gs; };
    D.PARENT.forEach(function(p){
      var qx = p.warm ? sx(5) : sx(0), qy = p.demand ? sy(10) : sy(5), on = p === st;
      g.push('<rect x="' + qx + '" y="' + qy + '" width="' + (gs / 2) + '" height="' + (gs / 2) + '" class="dv-quad' + (on ? ' is-on' : '') + '"/>');
      g.push('<text class="dv-quad-t' + (on ? ' is-on' : '') + '" x="' + (qx + gs / 4) + '" y="' + (qy + gs / 4 + 4) + '" text-anchor="middle">' + p.name + '</text>');
    });
    g.push('<rect x="' + gx + '" y="' + gy + '" width="' + gs + '" height="' + gs + '" class="dv-gridbox"/>');
    g.push('<text class="dv-axl" x="' + (gx + gs / 2) + '" y="' + (gy + gs + 24) + '" text-anchor="middle">Warmth →</text>');
    g.push('<text class="dv-axl" transform="translate(' + (gx - 14) + ',' + (gy + gs / 2) + ') rotate(-90)" text-anchor="middle">Demands and rules →</text>');
    g.push('<circle class="dv-dot" cx="' + sx(w) + '" cy="' + sy(d) + '" r="11"/>');
    // scene: parent and teen with a speech bubble
    var sX = phone ? 8 : gx + gs + 36, sY = phone ? gy + gs + 40 : 14, sW = phone ? W - 16 : W - sX - 10, sH = phone ? H - sY - 8 : H - 28;
    if(sW > 120 && sH > 90){
      g.push('<rect x="' + sX + '" y="' + sY + '" width="' + sW + '" height="' + sH + '" rx="14" class="dv-room"/>');
      var floor = sY + sH - 12, hh = Math.min(sH * 0.62, sW * 0.7);
      g.push('<rect x="' + sX + '" y="' + floor + '" width="' + sW + '" height="12" class="dv-floor"/>');
      var px = sX + sW * 0.3, tx = sX + sW * 0.7;
      g.push(person({ x: px, y: floor, h: hh, age: 42, skin: SKIN[0], hair: '#6B4A2E', hairStyle: 'bun', shirt: 'var(--dv-shirt2)', pose: st.id === 'uninvolved' ? 'phone' : st.id === 'authoritarian' ? 'point' : st.id === 'permissive' ? 'reach' : 'hold', facing: 1, face: st.id === 'authoritarian' ? 'angry' : st.id === 'uninvolved' ? 'neutral' : 'smile', look: st.id === 'uninvolved' ? null : null,
        prop: st.id === 'uninvolved' ? function(p){ return '<rect x="' + (p.hand[0] - p.R * 0.18) + '" y="' + (p.hand[1] - p.R * 0.45) + '" width="' + (p.R * 0.36) + '" height="' + (p.R * 0.62) + '" rx="' + (p.R * 0.08) + '" class="dv-phone"/>'; } : null }));
      g.push(person({ x: tx, y: floor, h: hh * 0.92, age: 15, skin: SKIN[0], hair: '#6B4A2E', shirt: 'var(--dv-kid)', pose: st.id === 'authoritarian' ? 'cross' : 'stand', facing: -1, face: st.id === 'authoritarian' ? 'sad' : st.id === 'uninvolved' ? 'worried' : 'smile' }));
      var bw = sW - 24, bx = sX + 12, byy = sY + 12, lines = wrap(SAYS[st.id], bw - 20, phone ? 12.5 : 13.5);
      var bh = 14 + lines.length * (phone ? 16 : 18);
      g.push('<rect x="' + bx + '" y="' + byy + '" width="' + bw + '" height="' + bh + '" rx="10" class="dv-bubble"/><path d="M' + (px + 6) + ' ' + (byy + bh) + ' l8 12 l6 -12 Z" class="dv-bubble"/>');
      lines.forEach(function(l, i){ g.push('<text class="dv-speech" x="' + (bx + 10) + '" y="' + (byy + 20 + i * (phone ? 16 : 18)) + '">' + esc(l) + '</text>'); });
    }
    return { svg: g.join(''), grid: { x: gx, y: gy, s: gs } };
  }
  function wrap(t, w, size){
    var words = String(t).split(' '), out = [], cur = '';
    words.forEach(function(x){ var n = cur ? cur + ' ' + x : x; if(textW(n, size, 700) > w && cur){ out.push(cur); cur = x; } else cur = n; });
    if(cur) out.push(cur); return out;
  }

  /* --------------------------------------------------- aging mind */
  function agingScene(a, W, H){
    var phone = W < 560, g = [], A = Math.max(20, a);
    var pw = phone ? W - 16 : W * 0.34, gx = phone ? 44 : pw + 64, gy = phone ? Math.round(H * 0.46) : 24, gw = W - gx - 16, gh = phone ? H - gy - 40 : H - gy - 48;
    var sceneH = phone ? gy - 30 : H - 16;
    g.push(lifeScene(A, 8, 8, pw, sceneH, phone));
    var sx = function(v){ return gx + (v - 20) / 70 * gw; }, sy = function(v){ return gy + gh - (v - 40) / 100 * gh; };
    for(var t = 20; t <= 90; t += 10) g.push('<line class="dv-grid" x1="' + sx(t) + '" x2="' + sx(t) + '" y1="' + gy + '" y2="' + (gy + gh) + '"/><text class="dv-tick" x="' + sx(t) + '" y="' + (gy + gh + 15) + '" text-anchor="middle">' + t + '</text>');
    var ptsC = [], ptsF = [];
    for(var k = 20; k <= 90; k += 1){ ptsC.push(sx(k).toFixed(1) + ',' + sy(D.crystallized(k)).toFixed(1)); ptsF.push(sx(k).toFixed(1) + ',' + sy(D.fluid(k)).toFixed(1)); }
    g.push('<polyline class="dv-cry" points="' + ptsC.join(' ') + '"/><polyline class="dv-flu" points="' + ptsF.join(' ') + '"/>');
    g.push('<line class="dv-axis" x1="' + gx + '" x2="' + (gx + gw) + '" y1="' + (gy + gh) + '" y2="' + (gy + gh) + '"/><line class="dv-axis" x1="' + gx + '" x2="' + gx + '" y1="' + gy + '" y2="' + (gy + gh) + '"/>');
    g.push('<text class="dv-tick" x="' + (gx + gw) + '" y="' + (gy + gh + 30) + '" text-anchor="end">Age (years)</text>');
    g.push('<text class="dv-lab dv-c1-t" x="' + (sx(52)) + '" y="' + (sy(D.crystallized(52)) - 10) + '" text-anchor="middle">Crystallized: knowledge, words</text>');
    g.push('<text class="dv-lab dv-c2-t" x="' + (sx(30)) + '" y="' + (sy(D.fluid(30)) + (phone ? 24 : 26)) + '" text-anchor="start">Fluid: new problems, speed</text>');
    g.push('<line class="dv-mark" x1="' + sx(A) + '" x2="' + sx(A) + '" y1="' + gy + '" y2="' + (gy + gh) + '"/><circle class="dv-pt1" cx="' + sx(A) + '" cy="' + sy(D.crystallized(A)) + '" r="6"/><circle class="dv-pt2" cx="' + sx(A) + '" cy="' + sy(D.fluid(A)) + '" r="6"/>');
    g.push('<text class="dv-note" x="' + gx + '" y="' + (gy - 8) + '">A sketch of the usual pattern, not data. People vary a lot.</text>');
    return g.join('');
  }

  /* ---------------------------------------------------------- mount */
  T.mount('development', function(app, data){
    var ex = null;
    T.modes(app, { slug: 'development',
      explore: function(host){ ex = explore(host, data); },
      quiz: function(host){ quiz(host, data); },
      onShow: function(m){ if(m !== 'explore' && ex) ex.stop(); },
      studio: { explore: function(pane, s){ ex.studio(pane, s); } } });
  });

  /* The first-run tip sits just above its target, in a slot opened for it. */
  function hintSlot(s, target, text, before){
    if(!target) return;
    var slot = document.createElement('div');
    slot.className = 'dv-tipslot'; slot.setAttribute('aria-hidden', 'true');
    (before || target).parentNode.insertBefore(slot, before || target);
    var h = s.hint({ target: target, text: text });
    if(!h){ slot.remove(); return; }
    var EV = ['pointerdown', 'keydown', 'input', 'change'];
    function done(e){ if(e && e.type === 'keydown' && (e.key === 'Tab' || e.key === 'Shift')) return; slot.remove(); EV.forEach(function(t){ s.root.removeEventListener(t, done, true); }); if(h.place) h.place(); }
    EV.forEach(function(t){ s.root.addEventListener(t, done, true); });
    if(h.place) h.place();
  }

  /* ------------------------------------------------------------ explore */
  function explore(host, data){
    var E = data.explore || {};
    var lens = 'life', ageI = AGES.indexOf(E.startAge != null ? E.startAge : 5), style = 'secure', warm = 7, dem = 7, touched = false, LS = null, anim = null, nid = T.nid('dv');
    if(ageI < 0) ageI = 10;
    function age(){ return AGES[ageI]; }
    function $(q){ return host.querySelector(q) || (LS ? LS.root.querySelector(q) : null); }
    host.innerHTML = '<section class="bt-problem dv-card" aria-labelledby="' + nid + '-h"><h2 id="' + nid + '-h" class="sr-only">Development across the lifespan</h2>' +
      '<div class="dv-fig"><svg class="dv-svg" role="img" xmlns="http://www.w3.org/2000/svg"></svg></div>' +
      '<div class="dv-ctl">' +
        '<div class="ls-seg dv-lenses" role="group" aria-label="Lens">' + LENSES.map(function(x){ return '<button type="button" data-v="' + x.v + '" aria-pressed="false">' + x.label + '</button>'; }).join('') + '</div>' +
        '<div class="dv-grp dv-grp-age"></div>' +
        '<div class="dv-grp dv-grp-attach" role="group" aria-label="Attachment pattern"><div class="ls-scroll dv-chips">' + D.ATTACH.map(function(a){ return '<button type="button" class="tchip" data-s="' + a.id + '" aria-pressed="false">' + a.name.replace(' (ambivalent)', '') + '</button>'; }).join('') + '</div></div>' +
        '<div class="dv-grp dv-grp-parent"></div>' +
        '<div class="dv-go"><button type="button" class="btn-press sm ls-btn ls-pri dv-play">Play a life</button></div>' +
      '</div>' +
      '<div class="dv-say"></div>' +
      T.moreHtml('<div class="dv-opts"><label class="bt-radio"><input type="checkbox" class="dv-lanes-all" checked> Show all four lanes on the timeline</label></div>', 'lanes') +
      '<div class="dv-nums"></div><p class="sr-only dv-live" role="status" aria-live="polite"></p></section>';
    var say = T.announcer($('.dv-live'));
    var cue = T.cue('Drag the age marker, or press Play a life.');
    $('.dv-ctl').insertBefore(cue.el, $('.dv-ctl').firstChild);
    function act(){ if(!touched){ touched = true; cue.done(); } }
    var svg = $('.dv-svg'), allLanes = true, tl = null, grid = null;
    var sAge = T.slider({ label: 'Age', min: 0, max: AGES.length - 1, step: 1, value: ageI, onInput: function(v){ act(); stop(); ageI = v; draw(); words(); say(lifeLine()); } });
    labelSlider(sAge, function(v){ return ageWords(AGES[v]); });
    $('.dv-grp-age').appendChild(sAge.el);
    var sWarm = T.slider({ label: 'Warmth', min: 0, max: 10, step: 1, value: warm, onInput: function(v){ act(); warm = v; draw(); words(); say(parentLine()); } });
    var sDem = T.slider({ label: 'Demands and rules', min: 0, max: 10, step: 1, value: dem, onInput: function(v){ act(); dem = v; draw(); words(); say(parentLine()); } });
    $('.dv-grp-parent').appendChild(sWarm.el); $('.dv-grp-parent').appendChild(sDem.el);
    function labelSlider(s, fn){
      var out = s.el.querySelector('output'), inp = s.input;
      function show(){ out.textContent = fn(+inp.value); inp.setAttribute('aria-valuetext', fn(+inp.value)); }
      inp.addEventListener('input', show); s.el.querySelectorAll('.bt-step').forEach(function(b){ b.addEventListener('click', show); });
      var set0 = s.set; s.set = function(v, fire){ set0(v, fire); show(); };
      show();
    }
    function onClick(e){
      var b = e.target.closest('.dv-lenses button');
      if(b){ setLens(b.getAttribute('data-v')); return; }
      var c = e.target.closest('.dv-chips button');
      if(c){ act(); style = c.getAttribute('data-s'); sync(); draw(); words(); say(attachLine()); return; }
      if(e.target.closest('.dv-play')){ act(); play(); }
    }
    host.addEventListener('click', onClick);
    $('.dv-lanes-all').addEventListener('change', function(e){ allLanes = e.target.checked; draw(); });
    function setLens(v){
      if(v === lens) return;
      act(); stop(); lens = v;
      if(v === 'aging' && age() < 20){ ageI = AGES.indexOf(70); sAge.set(ageI); }
      sync(); draw(); words();
      say({ life: 'Lifespan lens. ', attach: 'Attachment lens. ', parent: 'Parenting lens. ', aging: 'Aging mind lens. ' }[v] + lineNow());
    }
    function sync(){
      var root = LS ? LS.root : host;
      root.querySelectorAll('.dv-lenses button').forEach(function(b){ b.setAttribute('aria-pressed', String(b.getAttribute('data-v') === lens)); });
      root.querySelectorAll('.dv-chips button').forEach(function(b){ b.setAttribute('aria-pressed', String(b.getAttribute('data-s') === style)); });
      var show = { 'dv-grp-age': lens === 'life' || lens === 'aging', 'dv-grp-attach': lens === 'attach', 'dv-grp-parent': lens === 'parent', 'dv-go': lens === 'life' };
      Object.keys(show).forEach(function(k){ var el = $('.' + k); if(el) el.hidden = !show[k]; });
      if(LS && LS.setupRow) LS.setupRow.setup(allLanes ? 'All four lanes' : 'One lane');
    }
    function stop(){ if(anim){ anim.stop(); anim = null; } var b = $('.dv-play'); if(b) b.textContent = 'Play a life'; }
    function play(){
      if(anim){ stop(); return; }
      var i0 = ageI >= AGES.length - 1 ? 0 : ageI, n = AGES.length - 1 - i0, dur = Math.max(2, 12 * n / (AGES.length - 1));
      var b = $('.dv-play'); if(b) b.textContent = 'Pause';
      anim = P.loop(function(dt, t){ var i = Math.min(AGES.length - 1, i0 + Math.floor(t / dur * (n + 0.999))); if(i !== ageI){ ageI = i; sAge.set(i); draw(); words(); } return ageI < AGES.length - 1; },
        { duration: dur, still: function(){ ageI = AGES.length - 1; sAge.set(ageI); draw(); }, onEnd: function(){ anim = null; ageI = AGES.length - 1; sAge.set(ageI); stop(); draw(); words(); say(lifeLine()); } });
      anim.start();
    }

    /* the picture */
    function size(){ var f = $('.dv-fig'), r = f ? f.getBoundingClientRect() : { width: 600, height: 420 }; return { W: Math.max(300, Math.round(r.width)), H: Math.max(280, Math.round(r.height)) }; }
    function draw(){
      var z = size(), W = z.W, H = z.H, phone = W < 560, out = '', label = '';
      if(lens === 'life'){
        var sceneH = phone ? Math.round(H * 0.44) : Math.round(H * 0.5), sceneW = phone ? W - 16 : Math.min(W * 0.42, sceneH * 1.35);
        out += lifeScene(age(), 8, 8, sceneW, sceneH, phone);
        // the now card beside the scene (desktop)
        if(!phone){
          var cx = sceneW + 28, cy = 22, rows = D.LANES.map(function(L){ return [L, D.bandAt(L, age())]; });
          out += '<text class="dv-now-h" x="' + cx + '" y="' + (cy + 8) + '">Age ' + esc(ageWords(age())) + '</text>';
          rows.forEach(function(r, i){
            var yy = cy + 38 + i * Math.min(48, (sceneH - 40) / 4);
            out += '<circle class="dv-dotk ' + LANE_CLS[r[0].id] + '" cx="' + (cx + 6) + '" cy="' + (yy - 4) + '" r="6"/><text class="dv-now-k ' + LANE_CLS[r[0].id] + '-t" x="' + (cx + 18) + '" y="' + yy + '">' + esc(r[0].name) + '</text>';
            var lines = wrap(r[1][2], W - cx - 30, 13.5).slice(0, 2);
            lines.forEach(function(l, k){ out += '<text class="dv-now-v" x="' + (cx + 18) + '" y="' + (yy + 17 + k * 16) + '">' + esc(l) + '</text>'; });
          });
        } else out += '<text class="dv-now-h" x="16" y="30">Age ' + esc(ageWords(age())) + '</text>';
        var ty = sceneH + 22;
        tl = timeline(8, ty, W - 12, H - ty - 6, age(), { only: allLanes ? null : 'think' });
        out += tl.svg;
        label = 'Lifespan timeline at age ' + ageWords(age()) + '. ' + lifeLine();
      } else if(lens === 'attach'){
        out = attachScene(style, W, H);
        label = 'Strange situation in three panels, ' + D.byId(D.ATTACH, style).name + ' attachment. ' + attachLine();
      } else if(lens === 'parent'){
        var ps = parentScene(warm, dem, W, H); out = ps.svg; grid = ps.grid;
        label = 'Parenting grid: warmth ' + warm + ' of 10, demands ' + dem + ' of 10. ' + parentLine();
      } else {
        out = agingScene(age(), W, H);
        label = 'Graph of crystallized and fluid intelligence from age 20 to 90, a sketch of the usual pattern, with the person at ' + ageWords(Math.max(20, age())) + '. ' + agingLine();
      }
      svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
      svg.innerHTML = out;
      svg.setAttribute('aria-label', label);
    }
    /* drag on the stage: the age marker (lifespan) or the parenting dot */
    var dragging = false;
    function pt(e){ var r = svg.getBoundingClientRect(), vb = svg.viewBox.baseVal; return { x: (e.clientX - r.left) * vb.width / r.width, y: (e.clientY - r.top) * vb.height / r.height }; }
    function fromPointer(e){
      var p = pt(e);
      if(lens === 'life' && tl){
        var f = Math.max(0, Math.min(1, (p.x - tl.x0) / (tl.x1 - tl.x0))), a = Math.pow(91, f) - 1, best = 0;
        AGES.forEach(function(v, i){ if(Math.abs(ax(v) - ax(a)) < Math.abs(ax(AGES[best]) - ax(a))) best = i; });
        if(best !== ageI){ ageI = best; sAge.set(best); draw(); words(); }
      } else if(lens === 'parent' && grid){
        var w = Math.round(Math.max(0, Math.min(10, (p.x - grid.x) / grid.s * 10))), d = Math.round(Math.max(0, Math.min(10, (grid.y + grid.s - p.y) / grid.s * 10)));
        if(w !== warm || d !== dem){ warm = w; dem = d; sWarm.set(w); sDem.set(d); draw(); words(); }
      }
    }
    svg.addEventListener('pointerdown', function(e){
      if(lens === 'life' && tl){ var p = pt(e); if(p.y < tl.bottom - 200 && p.y < svg.viewBox.baseVal.height * 0.4) return; }
      if(lens !== 'life' && lens !== 'parent') return;
      act(); stop(); dragging = true; try{ svg.setPointerCapture(e.pointerId); }catch(x){} fromPointer(e);
    });
    svg.addEventListener('pointermove', function(e){ if(dragging) fromPointer(e); });
    svg.addEventListener('pointerup', function(){ if(dragging){ dragging = false; say(lineNow()); } });
    svg.addEventListener('pointercancel', function(){ dragging = false; });

    /* numbers and words */
    function lifeLine(){ var a = age(); return 'Age ' + ageWords(a) + ': ' + D.LANES.map(function(L){ return L.name.toLowerCase() + ', ' + D.bandAt(L, a)[2].toLowerCase(); }).join('; ') + '.'; }
    function attachLine(){ var A = D.byId(D.ATTACH, style); return A.name + ': the child ' + A.leave + ' and, when the parent returns, ' + A.back + '.'; }
    function parentLine(){ var st = D.parentStyle(warm, dem); return st.name + '. ' + st.line; }
    function agingLine(){ var a = Math.max(20, age()); return 'At ' + Math.round(a) + ', crystallized intelligence is ' + (a < 65 ? 'still rising' : a < 80 ? 'holding' : 'easing') + ' and fluid intelligence is ' + (a < 30 ? 'near its peak' : 'gradually lower') + '.'; }
    function lineNow(){ return lens === 'life' ? lifeLine() : lens === 'attach' ? attachLine() : lens === 'parent' ? parentLine() : agingLine(); }
    function words(){
      var head, sub = '', why = '', pills = [], pillsR = [];
      if(lens === 'life'){
        var a = age(), pg = D.stageAt(D.PIAGET, a), er = D.stageAt(D.ERIKSON, a);
        head = 'Age ' + ageWords(a) + ': ' + (a < 20 ? pg.name.toLowerCase() + ' thinking' : 'adult thinking') + ', ' + er.name.toLowerCase() + '.';
        sub = a < 20 ? pg.hallmark + ' Erikson\'s question: "' + er.q + '"' : 'Erikson\'s question: "' + er.q + '"';
        pills = [{ k: 'Piaget', html: a < 20 ? pg.short : 'Adult', tone: 'readout' }]; pillsR = [{ k: 'Erikson', html: er.short, tone: 'accent' }];
        why = lifeWhy(a);
      } else if(lens === 'attach'){
        var A = D.byId(D.ATTACH, style);
        head = A.name + ' attachment.'; sub = 'When the parent returns, the child ' + A.back + '.';
        pills = [{ k: 'Pattern', html: A.name.replace(' (ambivalent)', ''), tone: 'readout' }];
        why = attachWhy();
      } else if(lens === 'parent'){
        var st = D.parentStyle(warm, dem);
        head = st.name + ' parenting.'; sub = st.line;
        pills = [{ k: 'Warmth', html: warm + '/10', tone: 'readout' }]; pillsR = [{ k: 'Demands', html: dem + '/10', tone: 'readout' }];
        why = parentWhy();
      } else {
        var g = Math.max(20, age());
        head = 'Age ' + Math.round(g) + ': knowledge holds, speed on new problems slows.'; sub = 'Dementia is a disease, not a normal part of aging.';
        pills = [{ k: 'Crystallized', html: g < 65 ? 'rising' : g < 80 ? 'holding' : 'easing', tone: 'good' }]; pillsR = [{ k: 'Fluid', html: g < 30 ? 'peak' : 'lower', tone: 'warn' }];
        why = agingWhy();
      }
      T.explain($('.dv-say'), '<b>' + esc(head) + '</b>' + (sub ? ' ' + esc(sub) : ''), why);
      nums();
      if(LS){ LS.caption('<b>' + esc(head) + '</b>' + (sub ? ' ' + esc(sub) : ''), 'explore'); LS.pills(pills, 'left', 'explore'); LS.pills(pillsR, 'right', 'explore'); }
    }
    function lifeWhy(a){
      return '<p><b>Four lanes at once.</b> At any age a person is thinking (Piaget\'s stages, then adult intelligence), building a self (Erikson\'s psychosocial stages), relating to others (attachment, play, peers, partners) and growing up through puberty, adolescence and emerging adulthood into adult roles. The same marker crosses all four.</p>' +
        '<p><b>Piaget\'s stages.</b> Sensorimotor (birth to 2): object permanence. Preoperational (2 to 7): pretend play, egocentrism, no conservation yet. Concrete operational (7 to 11 or 12): conservation and logic about real things. Formal operational (12 on): abstract, hypothetical thinking. The ages are averages; later research found infants and preschoolers can do some of these things earlier than Piaget thought, and not every adult uses formal reasoning everywhere.</p>' +
        '<p><b>Vygotsky.</b> Learning happens in the zone of proximal development, the gap between what a child can do alone and with help; scaffolding is help that fades as skill grows.</p>' +
        '<p><b>Erikson.</b> Eight crises in order, each a question the person works through. The CED does not test Freud\'s psychosexual stages; this tool leaves them out.</p>';
    }
    function attachWhy(){
      return '<p><b>The strange situation.</b> A one-year-old and a parent come into a playroom; a stranger enters, the parent leaves and comes back. The reunion shows the pattern most clearly.</p>' +
        '<p><b>Four patterns.</b> ' + D.ATTACH.map(function(x){ return x.name + ': the child ' + x.leave + ' and, on reunion, ' + x.back + '.'; }).join(' ') + '</p>' +
        '<p><b>What it can and cannot show.</b> This is a structured observation, not an experiment, so links with later relationships are correlational: temperament, culture and the home all differ. Patterns can change when care changes.</p>' +
        '<p><b>Contact comfort.</b> In Harlow\'s monkey studies (1950s), infant monkeys clung to a soft cloth "mother" rather than a wire one that gave milk: comfort, not food, built the bond. The studies are also a standard example of research that raises serious ethical concerns.</p>';
    }
    function parentWhy(){
      return '<p><b>Two dimensions.</b> Warmth (affection, responsiveness) and demands (rules, expectations, monitoring). The four quadrants are the four styles. ' + D.PARENT.map(function(p){ return p.name + ': ' + p.line; }).join(' ') + '</p>' +
        '<p><b>What the research shows.</b> In many studies, mostly in Western countries, authoritative parenting goes with higher self-esteem and social competence. These studies are correlational: parents are not randomly assigned a style, children\'s temperament shapes how parents act, and the links differ across cultures.</p>';
    }
    function agingWhy(){
      return '<p><b>Crystallized intelligence</b> is what you know: vocabulary, facts, skills. It tends to hold or grow into late adulthood.</p><p><b>Fluid intelligence</b> is reasoning quickly about new problems. It tends to decline gradually from early adulthood.</p>' +
        '<p><b>Dementia</b> (Alzheimer\'s disease is the most common cause) is a disease that impairs memory and daily life. It becomes more common with age, but it is not normal aging: most older adults never develop it.</p>' +
        '<p><b>The curves.</b> They are a sketch of the pattern, not data from one study. Cross-sectional studies exaggerate the decline (older cohorts had less schooling); longitudinal studies show a later, gentler one.</p>';
    }
    function nums(){
      var el = $('.dv-nums'); if(!el) return;
      el.innerHTML = '<h3 class="ls-title-l">The stages and their usual ages</h3>' +
        T.dataTable(['Piaget\'s stage', 'Usual ages', 'Hallmark'], D.PIAGET.map(function(p){ return [p.name, p.from + (p.to === 90 ? ' and up' : ' to ' + p.to), p.hallmark]; }), 'Piaget\'s cognitive stages') +
        T.dataTable(['Erikson\'s crisis', 'Usual ages', 'The question'], D.ERIKSON.map(function(e){ return [e.name, e.from + (e.to === 90 ? ' and up' : ' to ' + e.to), e.q]; }), 'Erikson\'s psychosocial stages') +
        '<p class="bt-small">Ages are typical, not fixed: children reach milestones at different times.</p>';
    }
    function studio(pane, s){
      LS = s;
      var sp = T.studioPane(pane, s, { stage: [$('.dv-fig')], dock: [$('.dv-ctl')], setup: 'Timeline', moreLabel: 'Timeline lanes', why: [$('.dv-say')], details: [$('.dv-nums')] });
      s.root.addEventListener('click', onClick);
      host.removeEventListener('click', onClick);
      LS.setupRow = sp;
      sync(); draw(); words();
      if(s.mode() === 'explore') hintSlot(s, sAge.input, 'Start here: drag to move through a life', sAge.el);
      if(window.ResizeObserver){ var t = null; new ResizeObserver(function(){ clearTimeout(t); t = setTimeout(draw, 60); }).observe($('.dv-fig')); }
    }
    sync(); draw(); words();
    if(!T.studioOf(host) && window.ResizeObserver){ var t0 = null; new ResizeObserver(function(){ clearTimeout(t0); t0 = setTimeout(draw, 60); }).observe($('.dv-fig')); }
    return { stop: stop, studio: studio };
  }

  /* ------------------------------------------------------ test yourself */
  function quiz(host, data){
    T.drill(host, data, { slug: 'development', noun: 'drill',
      generate: function(r, ctx, type){ return D.generate(r, ctx, type); },
      types: [{ value: 'piaget', label: 'Piaget\'s stages' }, { value: 'erikson', label: 'Erikson\'s stages' }, { value: 'attachment', label: 'Attachment' }, { value: 'parenting', label: 'Parenting styles' }, { value: 'adolescence', label: 'Adolescence to adulthood' }, { value: 'adultcog', label: 'The aging mind' }, { value: 'methods', label: 'Studying age' }],
      typeLabel: 'Kind of problem',
      title: function(p){ return { piaget: 'Piaget\'s stages', erikson: 'Erikson\'s stages', attachment: 'Attachment', parenting: 'Parenting styles', adolescence: 'Adolescence to adulthood', adultcog: 'The aging mind', methods: 'Studying age' }[p.type] || 'Practice problem'; },
      extra: function(el, p, api){ api.fig = el; api.st = {}; figure(el, p, api.st); },
      onStep: function(s, right, api){ api.st[s.key] = true; figure(api.fig, api.problem, api.st); }
    });
  }
  /* The drill's figure, drawn from the problem: the person at their age;
     the timeline's band is lit only once the step that asks for it is done. */
  function figure(el, p, st){
    var g = p.figure; if(!g){ el.innerHTML = ''; return; }
    var phone = (window.innerWidth || 1280) <= 640, W = phone ? 360 : 640, H = phone ? 330 : 300, out = '', label = '';
    if(g.kind === 'life'){
      var sw = phone ? W - 16 : 230, sh = phone ? 150 : H - 16;
      out += lifeScene(g.age, 8, 8, sw, sh, phone);
      var lane = g.lane, open = lane === 'think' ? st.stage : lane === 'self' ? st.stage : lane === 'grow' ? st.period : st.style;
      var tx = phone ? 8 : sw + 20, ty = phone ? sh + 20 : 30;
      var t = timeline(tx, ty, W - tx - 4, phone ? H - ty - 6 : H - 60, g.age, { only: lane, hide: open ? [] : [lane] });
      out += t.svg + '<text class="dv-now-h" x="' + (tx + (phone ? 0 : 124)) + '" y="' + (ty - (phone ? 2 : 10)) + '">' + esc(g.name) + ', age ' + esc(ageWords(g.age)) + '</text>';
      label = g.name + ', age ' + ageWords(g.age) + ', on the ' + D.LANES.filter(function(l){ return l.id === lane; })[0].name.toLowerCase() + ' lane of the lifespan timeline' + (open ? '.' : '; the stages are revealed after you answer.');
    } else if(g.kind === 'parent'){
      var ps = parentScene(st.style ? g.warm : 5, st.style ? g.demand : 5, W, H);
      out = st.style ? ps.svg : ps.svg.replace(/<circle class="dv-dot"[^>]*\/>/, '');
      label = 'Parenting grid of warmth and demands' + (st.style ? ', with this home placed in its quadrant.' : '.');
    } else if(g.kind === 'adult'){
      out = agingScene(g.age, W, H);
      label = 'Crystallized and fluid intelligence across adulthood, a sketch of the usual pattern, with ' + g.name + ' at ' + Math.round(g.age) + '.';
    } else if(g.kind === 'design'){
      out = designFig(g, W, H, phone, st);
      label = (st.method ? (g.design === 'cross' ? 'Cross-sectional design: different age groups tested once.' : 'Longitudinal design: the same people tested again and again.') : 'The study\'s design, drawn as people and testing times.') + ' Scores: ' + g.data.join(', ') + ' ' + g.unit + '.';
    }
    el.innerHTML = '<figure class="cd-fig dv-qfig"><svg class="dv-svg" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(label) + '">' + out + '</svg></figure>';
  }
  function designFig(g, W, H, phone, st){
    var out = [], cols = 3, cw = (W - 24) / cols, base = H - 40, shown = !!st.method;
    out.push('<rect x="4" y="4" width="' + (W - 8) + '" height="' + (H - 8) + '" rx="14" class="dv-room"/>');
    var ages = [20, 40, 60];
    for(var i = 0; i < cols; i++){
      var cx = 12 + cw * (i + 0.5);
      out.push('<text class="dv-ptitle" x="' + cx + '" y="28" text-anchor="middle">' + (g.design === 'cross' ? 'Group ' + (i + 1) : 'Testing ' + (i + 1)) + '</text>');
      for(var k = 0; k < (g.design === 'cross' ? 3 : 1); k++){
        var a = ages[i], hgt = Math.min(H * 0.55, 130), x = cx + (g.design === 'cross' ? (k - 1) * hgt * 0.42 : 0);
        out.push(person({ x: x, y: base, h: hgt * (g.design === 'cross' ? 0.82 : 1), age: a, skin: SKIN[(i + k) % 4], hair: ['#3B2A20', '#1E1A16', '#6B4A2E'][(i + k) % 3], hairStyle: k === 1 ? 'long' : a >= 60 ? 'bald' : 'short', gray: a >= 55, glasses: a >= 45, shirt: g.design === 'cross' ? ['var(--dv-shirt)', 'var(--dv-shirt2)', 'var(--dv-kid)'][(i + k) % 3] : 'var(--dv-shirt)', face: 'smile' }));
      }
      if(shown) out.push('<text class="dv-tick" x="' + cx + '" y="' + (base + 18) + '" text-anchor="middle">age ' + ages[i] + (g.design === 'cross' ? ' (different people)' : ' (same person)') + '</text>');
      else out.push('<text class="dv-tick" x="' + cx + '" y="' + (base + 18) + '" text-anchor="middle">age ' + ages[i] + '</text>');
    }
    if(g.design === 'long' && shown) out.push('<path class="dv-arrow" d="M' + (12 + cw * 0.75) + ' ' + (base - 30) + ' H' + (12 + cw * 2.25) + '"/>');
    return out.join('');
  }
})();
