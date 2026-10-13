/* Free-body diagrams (simulator, the course's flagship trainer; docs/apphys-spec.md
   section 6). OWNED BY THIS TOOL ONLY. The model is ApPhysMath.freeBodyDiagrams
   (physics/assets/tools/math/free-body-diagrams.js); arrows come from ApPhysScene;
   the frame is ApPhysTools.modes on the Tool Studio.

   Explore: eleven illustrated scenes (book on a table, bucket on a rope, sign on
   two ropes, smooth and rough ramps, dragged crate, elevator, Atwood machine,
   car on a curve, block on a spring, block in water). The student moves the
   situation's sliders and sees the free-body diagram drawn to scale from the
   object's dot, the forces added tip to tail (the net force), the acceleration,
   and, on Run, the motion that follows. Tap a force for its readout; "Why?"
   holds Newton's second law along each axis with numbers. Components shows
   the tilted axes on a ramp.

   Test yourself: the student BUILDS the diagram: picks forces from a palette,
   drags each tip to aim and size it (or uses the keys / the dock's buttons),
   labels who exerts it, and checks. The model grades force by force and names
   the miss (extra force with no agent, net or centripetal force drawn, missing
   force, wrong direction, lengths that do not fit the motion, a force not
   starting on the object, a third-law partner on the wrong object). Then
   Newton's second law along an axis (choice) and a number with units. First
   tries are recorded as free-body-diagrams:<context>:<step>.

   Contexts unlock with their units (data file): basic 2.2, acceleration 2.5,
   friction 2.7, spring 2.8, circular 2.9, buoyancy 8.3. */
(function(){
  'use strict';
  var T = window.ApPhysTools, M = window.ApPhysMath, A = window.ApPhysScene;
  if(!T || !M || !M.freeBodyDiagrams || !A) return;
  var FB = M.freeBodyDiagrams, TY = FB.TYPES, esc = T.esc, SLUG = 'free-body-diagrams', G = M.C.g;
  var W = 400, H = 300, NS = 'http://www.w3.org/2000/svg';

  // Own stylesheet, next to this script (the generator loads only the shared one).
  (function(){
    try{
      var me = document.currentScript, href = me && me.src ? me.src.replace(/\.js(\?.*)?$/, '.css') : '';
      if(href && !document.querySelector('link[href$="tools/free-body-diagrams.css"]')){
        var l = document.createElement('link'); l.rel = 'stylesheet'; l.href = href; document.head.appendChild(l);
      }
    }catch(e){}
  })();

  function rad(d){ return d * Math.PI / 180; }
  function n1(x){ return Math.round(x * 10) / 10; }
  function f2(x){ return M.fmt(x, 2); }
  function f3(x){ return M.fmt(x, 3); }
  function N(x){ return M.fmt(x, 3) + ' N'; }
  function sub(t){ return FB.sub(t); }
  function plain(h){ return String(h).replace(/<sub>(.*?)<\/sub>/g, '$1').replace(/<[^>]+>/g, ''); }
  function dirText(ang){
    ang = FB.norm(Math.round(ang));
    var words = { 0: 'right', 90: 'up', 180: 'left', 270: 'down' };
    if(words[ang] != null) return words[ang];
    var up = ang < 180, right = ang < 90 || ang > 270, h = Math.min(FB.adiff(ang, 0), FB.adiff(ang, 180));
    return (up ? 'up' : 'down') + ' and to the ' + (right ? 'right' : 'left') + ', ' + Math.round(h) + '° from the horizontal';
  }
  /* A to-scale arrow length: a "nice" number of newtons per 50 px so that the
     largest force is at most ~110 px. */
  function scaleOf(maxF){
    if(!(maxF > 0)) return { per50: 10, ppN: 5 };
    var raw = maxF * 50 / 110, p = Math.pow(10, Math.floor(Math.log10(raw))), per = 10 * p;
    [1, 2, 2.5, 5, 10].some(function(k){ if(raw <= k * p + 1e-9){ per = k * p; return true; } return false; });
    return { per50: per, ppN: 50 / per };
  }
  function pv(ang, L){ return { x: L * Math.cos(rad(ang)), y: -L * Math.sin(rad(ang)) }; }

  /* ---------------------------------------------------------------- scenes
     Each scene draws itself in a 400 × 300 box from its parameters and the
     motion offset, and returns { g: svg, dot, on(x, y), ins: { x, y }, acc } */
  function R(x, y, w, h, cls, rx, extra){ return '<rect class="' + cls + '" x="' + n1(x) + '" y="' + n1(y) + '" width="' + n1(w) + '" height="' + n1(h) + '"' + (rx ? ' rx="' + rx + '"' : '') + (extra || '') + '/>'; }
  function Ln(x1, y1, x2, y2, cls, extra){ return '<line class="' + cls + '" x1="' + n1(x1) + '" y1="' + n1(y1) + '" x2="' + n1(x2) + '" y2="' + n1(y2) + '"' + (extra || '') + '/>'; }
  function Pg(pts, cls){ return '<polygon class="' + cls + '" points="' + pts.map(function(p){ return n1(p[0]) + ',' + n1(p[1]); }).join(' ') + '"/>'; }
  function Tx(x, y, t, cls, anchor){ return '<text class="' + (cls || 'fb-t') + '" x="' + n1(x) + '" y="' + n1(y) + '"' + (anchor ? ' text-anchor="' + anchor + '"' : '') + '>' + t + '</text>'; }
  function defs(id){
    return '<defs><pattern id="' + id + '-h" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line class="fb-hl" x1="0" y1="0" x2="0" y2="7"/></pattern>' +
      '<pattern id="' + id + '-r" width="6" height="6" patternUnits="userSpaceOnUse"><circle class="fb-grit" cx="1.5" cy="1.5" r="1"/><circle class="fb-grit" cx="4.5" cy="4" r=".8"/></pattern></defs>';
  }
  function ground(id, y, x0, x1){ x0 = x0 == null ? 0 : x0; x1 = x1 == null ? W : x1; return R(x0, y, x1 - x0, H - y, 'fb-gnd') + R(x0, y, x1 - x0, H - y, 'fb-hatch', 0, ' fill="url(#' + id + '-h)"') + Ln(x0, y, x1, y, 'fb-edge'); }
  function inBox(x, y, b){ return x >= b[0] && x <= b[0] + b[2] && y >= b[1] && y <= b[1] + b[3]; }
  function wood(x, y, w, h, extra){ return R(x, y, w, h, 'fb-wood', 4, extra) + Ln(x + 6, y + h * 0.35, x + w - 6, y + h * 0.35, 'fb-grain') + Ln(x + 6, y + h * 0.7, x + w - 6, y + h * 0.7, 'fb-grain'); }

  var SC = {};
  SC.table = function(P, o, id){
    var b = [145, 156, 110, 34], g = ground(id, 272) + R(92, 204, 12, 68, 'fb-wood') + R(296, 204, 12, 68, 'fb-wood') + R(70, 190, 260, 14, 'fb-wood', 3) +
      Tx(200, 290, 'Table', 'fb-t fb-t-on', 'middle');
    var book = R(b[0] - 2, b[1] - 2, b[2] + 4, b[3] + 4, 'fb-glow', 6) + R(b[0], b[1], b[2], b[3], 'fb-book fb-obj', 4) + R(b[0] + 12, b[1] + 5, b[2] - 17, b[3] - 10, 'fb-pages', 2) +
      Ln(b[0] + 16, b[1] + 12, b[0] + b[2] - 9, b[1] + 12, 'fb-pl') + Ln(b[0] + 16, b[1] + 18, b[0] + b[2] - 9, b[1] + 18, 'fb-pl') + Ln(b[0] + 16, b[1] + 24, b[0] + b[2] - 9, b[1] + 24, 'fb-pl');
    var hand = (P.push || 0) > 0 ? R(156, -10, 34, 96, 'fb-cloth', 12) + R(160, 70, 26, 70, 'fb-skin', 11) + R(150, 128, 44, 28, 'fb-skin', 12) + Ln(160, 150, 186, 150, 'fb-crease') : '';
    return { g: g + book + hand, dot: { x: 200, y: 173 }, on: function(x, y){ return inBox(x, y, b); }, ins: { x: 296, y: 10 }, acc: { x: 262, y: 150 } };
  };
  SC.hang1 = function(P, o, id){
    var dy = o.dy || 0;
    var g = R(120, 0, 160, 14, 'fb-metal') + R(120, 0, 160, 14, 'fb-hatch', 0, ' fill="url(#' + id + '-h)"') + Ln(200, 14, 200, 112 + dy, 'fb-rope');
    var y = 134 + dy, bk = '<path class="fb-wire" d="M174 ' + n1(y + 2) + ' Q200 ' + n1(y - 40) + ' 226 ' + n1(y + 2) + '"/>' +
      Pg([[166, y - 4], [234, y - 4], [226, y + 58], [174, y + 58]], 'fb-glow') + Pg([[168, y], [232, y], [224, y + 56], [176, y + 56]], 'fb-metal fb-obj') + R(164, y - 4, 72, 8, 'fb-rim', 4) + Ln(171, y + 20, 229, y + 20, 'fb-band');
    return { g: g + bk, dot: { x: 200, y: y + 28 }, on: function(x, yy){ return x >= 166 && x <= 234 && yy >= y - 4 && yy <= y + 58; }, ins: { x: 8, y: 10 }, acc: { x: 250, y: y + 10 } };
  };
  SC.hang2 = function(P, o, id){
    var K = { x: 200, y: 112 }, dl = (K.y - 14) / Math.tan(rad(P.al)), dr = (K.y - 14) / Math.tan(rad(P.be));
    var g = R(0, 0, W, 14, 'fb-metal') + R(0, 0, W, 14, 'fb-hatch', 0, ' fill="url(#' + id + '-h)"') +
      Ln(K.x, K.y, K.x - dl, 14, 'fb-rope') + Ln(K.x, K.y, K.x + dr, 14, 'fb-rope') +
      '<path class="fb-arc" d="M' + n1(K.x - 34) + ' ' + K.y + ' A34 34 0 0 1 ' + n1(K.x - 34 * Math.cos(rad(P.al))) + ' ' + n1(K.y - 34 * Math.sin(rad(P.al))) + '"/>' +
      '<path class="fb-arc" d="M' + n1(K.x + 34) + ' ' + K.y + ' A34 34 0 0 0 ' + n1(K.x + 34 * Math.cos(rad(P.be))) + ' ' + n1(K.y - 34 * Math.sin(rad(P.be))) + '"/>' +
      Ln(K.x - 60, K.y, K.x + 60, K.y, 'fb-guide') +
      Tx(K.x - 48, K.y - 8, 'α', 'fb-t fb-ang', 'end') + Tx(K.x + 48, K.y - 8, 'β', 'fb-t fb-ang');
    var b = [145, 124, 110, 62];
    var s = R(b[0] - 3, b[1] - 3, b[2] + 6, b[3] + 6, 'fb-glow', 8) + wood(b[0], b[1], b[2], b[3], '') + R(b[0], b[1], b[2], b[3], 'fb-obj fb-none', 4) + Ln(K.x, K.y, K.x, b[1], 'fb-wire') + '<circle class="fb-ring" cx="200" cy="112" r="5"/>';
    return { g: g + s, dot: { x: 200, y: 155 }, on: function(x, y){ return inBox(x, y, b); }, ins: { x: 8, y: 188 }, acc: { x: 262, y: 130 } };
  };
  function ramp(P, o, id, rough){
    var th = P.th, s = Math.sin(rad(th)), c = Math.cos(rad(th)), Hh = th > 0.5 ? Math.min(320, 225 / s) : 320;
    var B = { x: 385, y: 262 }, C = { x: B.x - Hh * c, y: B.y - Hh * s };
    var u = Math.min(Hh - 44, Math.max(36, 0.34 * Hh + (o.u || 0)));
    var d = { x: c, y: s }, nn = { x: s, y: -c }, cx = C.x + d.x * u + nn.x * 21, cy = C.y + d.y * u + nn.y * 21;
    var g = ground(id, 262) + Pg([[C.x, 262], [B.x, B.y], [C.x, C.y]], 'fb-ramp' + (rough ? ' is-rough' : '')) +
      (rough ? '<line class="fb-sand" x1="' + n1(C.x) + '" y1="' + n1(C.y) + '" x2="' + B.x + '" y2="' + B.y + '" stroke="url(#' + id + '-r)"/>' : Ln(C.x, C.y, B.x, B.y, 'fb-slick')) +
      (th > 3 ? '<path class="fb-arc" d="M' + (B.x - 42) + ' ' + B.y + ' A42 42 0 0 1 ' + n1(B.x - 42 * c) + ' ' + n1(B.y - 42 * s) + '"/>' + Tx(B.x - 56 * Math.cos(rad(th / 2)) - 4, B.y - 56 * Math.sin(rad(th / 2)) + 5, 'θ', 'fb-t fb-ang', 'middle') : '') +
      Tx((C.x + B.x) / 2 - 20, 284, rough ? 'Rough ramp' : 'Frictionless ramp', 'fb-t fb-t-on', 'middle');
    var blk = '<g transform="translate(' + n1(cx) + ' ' + n1(cy) + ') rotate(' + n1(th) + ')">' + R(-32, -23, 64, 46, 'fb-glow', 6) + R(-30, -21, 60, 42, 'fb-block fb-obj', 4) + Ln(-24, -10, 24, -10, 'fb-shine') + '</g>';
    return { g: g + blk, dot: { x: cx, y: cy }, ins: { x: 8, y: 10 }, acc: { x: cx + nn.x * 46, y: cy + nn.y * 46 }, end: u >= Hh - 44 - 1e-6, start: u <= 36 + 1e-6,
      on: function(x, y){ var dx = x - cx, dy = y - cy, lx = dx * c + dy * s, ly = -dx * s + dy * c; return Math.abs(lx) <= 31 && Math.abs(ly) <= 22; }, axisTilt: th };
  }
  SC.incline = function(P, o, id){ return ramp(P, o, id, false); };
  SC.rough = function(P, o, id){ return ramp(P, o, id, true); };
  SC.crate = function(P, o, id){
    var x0 = Math.min(250, 92 + (o.dx || 0)), b = [x0, 152, 90, 80], pull = P.mode !== 'push', phi = P.phi || 0, extra = '';
    var g = ground(id, 232) + Tx(36, 254, 'Floor', 'fb-t fb-t-on');
    if(pull){
      var R0 = { x: x0 + 90, y: 180 }, E = { x: R0.x + 160 * Math.cos(rad(phi)), y: R0.y - 160 * Math.sin(rad(phi)) };
      extra = Ln(R0.x, R0.y, E.x, E.y, 'fb-rope') + '<circle class="fb-skin" cx="' + n1(E.x) + '" cy="' + n1(E.y) + '" r="10"/>' + Ln(E.x, E.y, E.x + 40 * Math.cos(rad(phi)), E.y - 40 * Math.sin(rad(phi)), 'fb-sleeve');
    } else {
      var L0 = { x: x0, y: 168 }, dx = Math.cos(rad(phi)), dy = Math.sin(rad(phi));
      extra = Ln(L0.x - 150 * dx, L0.y - 150 * dy, L0.x - 22 * dx, L0.y - 22 * dy, 'fb-sleeve') + '<circle class="fb-skin" cx="' + n1(L0.x - 10 * dx) + '" cy="' + n1(L0.y - 10 * dy) + '" r="11"/>';
    }
    var cr = R(b[0] - 3, b[1] - 3, b[2] + 6, b[3] + 6, 'fb-glow', 6) + R(b[0], b[1], b[2], b[3], 'fb-wood fb-obj', 3) + R(b[0] + 7, b[1] + 7, b[2] - 14, b[3] - 14, 'fb-plank', 2) +
      Ln(b[0] + 9, b[1] + b[3] - 9, b[0] + b[2] - 9, b[1] + 9, 'fb-brace');
    return { g: g + extra + cr, dot: { x: x0 + 45, y: 192 }, on: function(x, y){ return inBox(x, y, b); }, ins: pull ? { x: 8, y: 10 } : { x: 296, y: 10 }, acc: { x: x0 + 45, y: 140 }, end: x0 >= 250 };
  };
  SC.elevator = function(P, o, id){
    var off = ((o.dy || 0) % 60 + 60) % 60, ticks = '';
    for(var y = -60 + off; y < H + 60; y += 60) ticks += Ln(100, y, 112, y, 'fb-tick') + Ln(288, y, 300, y, 'fb-tick');
    var g = R(88, 0, 24, H, 'fb-shaft') + R(288, 0, 24, H, 'fb-shaft') + ticks + Ln(200, 0, 200, 52, 'fb-cable') +
      R(128, 52, 144, 206, 'fb-cab', 6) + R(128, 246, 144, 12, 'fb-cabfloor', 2) + Ln(200, 60, 200, 244, 'fb-door');
    var per = '<g class="fb-person">' + '<circle class="fb-glow" cx="200" cy="126" r="17"/>' + R(181, 141, 38, 58, 'fb-glow', 15) + R(184, 194, 32, 54, 'fb-glow', 8) +
      R(187, 194, 12, 52, 'fb-pants', 5) + R(201, 194, 12, 52, 'fb-pants', 5) + R(184, 144, 32, 54, 'fb-cloth fb-obj', 12) + '<circle class="fb-skin fb-obj" cx="200" cy="126" r="14"/></g>';
    return { g: g + per, dot: { x: 200, y: 182 }, on: function(x, y){ return x >= 182 && x <= 218 && y >= 110 && y <= 248; }, ins: { x: -6, y: 10 }, acc: null, side: { x: 344 } };
  };
  function blockSide(m){ return 30 + 12 * Math.sqrt(m); }
  SC.atwood = function(P, o, id){
    var off = Math.max(-55, Math.min(55, o.dy || 0)), s1 = blockSide(P.m1), s2 = blockSide(P.m2), y1 = 190 + off, y2 = 190 - off, which = P.which || 1;
    var g = R(140, 0, 120, 12, 'fb-metal') + R(140, 0, 120, 12, 'fb-hatch', 0, ' fill="url(#' + id + '-h)"') + Ln(200, 12, 200, 56, 'fb-wire') +
      '<path class="fb-rope" d="M154 ' + n1(y1 - s1 / 2) + ' V56 A46 46 0 0 1 246 56 V' + n1(y2 - s2 / 2) + '"/>' +
      '<circle class="fb-wheel" cx="200" cy="56" r="46"/><circle class="fb-hub" cx="200" cy="56" r="40"/>' +
      [0, 60, 120].map(function(a){ return Ln(200 + 36 * Math.cos(rad(a)), 56 + 36 * Math.sin(rad(a)), 200 - 36 * Math.cos(rad(a)), 56 - 36 * Math.sin(rad(a)), 'fb-spoke'); }).join('') +
      '<circle class="fb-axle" cx="200" cy="56" r="6"/>';
    function blk(k, x, y, s){
      var me = k === which;
      return '<g class="fb-blk' + (me ? ' is-me' : '') + '" data-blk="' + k + '">' + (me ? R(x - s / 2 - 3, y - s / 2 - 3, s + 6, s + 6, 'fb-glow', 6) : '') + R(x - s / 2, y - s / 2, s, s, 'fb-block' + (me ? ' fb-obj' : ' fb-dim'), 4) +
        Tx(x - s / 2 + 5, y - s / 2 + 15, 'm<tspan dy="3" font-size="0.75em">' + k + '</tspan>', 'fb-t fb-on-blk' + (me ? '' : ' fb-on-dim')) + '</g>';
    }
    var me = which === 2 ? { x: 246, y: y2, s: s2 } : { x: 154, y: y1, s: s1 };
    return { g: g + blk(1, 154, y1, s1) + blk(2, 246, y2, s2), dot: { x: me.x, y: me.y }, on: function(x, y){ return Math.abs(x - me.x) <= me.s / 2 + 1 && Math.abs(y - me.y) <= me.s / 2 + 1; },
      ins: { x: 296, y: 120 }, acc: { x: me.x + (which === 2 ? 1 : -1) * (me.s / 2 + 18), y: me.y }, end: Math.abs(off) >= 55 };
  };
  SC.car = function(P, o, id){
    var g = R(0, 238, W, 40, 'fb-road') + ground(id, 278) + [20, 120, 220, 320].map(function(x){ return R(x, 256, 44, 5, 'fb-lane', 2); }).join('') +
      A.arrow(104, 150, -88, 0, { cls: 'fb-center', width: 2, head: 8 }) + Tx(14, 172, 'Center of', 'fb-t fb-t-s') + Tx(14, 188, 'the curve', 'fb-t fb-t-s');
    var car = '<g class="fb-car">' + R(126, 206, 30, 36, 'fb-tire', 7) + R(244, 206, 30, 36, 'fb-tire', 7) +
      '<path class="fb-glow" d="M137 152 L154 104 L246 104 L263 152 Z"/>' + R(112, 146, 176, 74, 'fb-glow', 18) +
      '<path class="fb-body" d="M140 152 L156 108 L244 108 L260 152 Z"/>' + R(116, 150, 168, 66, 'fb-body fb-obj', 14) +
      '<path class="fb-win" d="M150 148 L163 114 L237 114 L250 148 Z"/>' + R(122, 162, 28, 12, 'fb-tail', 3) + R(250, 162, 28, 12, 'fb-tail', 3) +
      R(120, 198, 160, 12, 'fb-bumper', 5) + R(182, 178, 36, 14, 'fb-plate', 2) + '</g>';
    // From above: the curve, and where the car is on it (o.top: { x, y, ang, path }).
    var tp = o.top || { x: 0, y: -1, h: 180 }, cx = 345, cy = 68, rr = 34, k = rr;
    var top = R(296, 8, 98, 112, 'fb-inset', 10) + Tx(345, 24, 'From above', 'fb-t fb-t-s', 'middle') +
      '<circle class="fb-path" cx="' + cx + '" cy="' + cy + '" r="' + rr + '"/>' + '<circle class="fb-cdot" cx="' + cx + '" cy="' + cy + '" r="2.5"/>' +
      (tp.trail && tp.trail.length > 1 ? '<polyline class="fb-trail" points="' + tp.trail.map(function(q){ return n1(cx + q.x * k) + ',' + n1(cy - q.y * k); }).join(' ') + '"/>' : '') +
      '<g transform="translate(' + n1(cx + tp.x * k) + ' ' + n1(cy - tp.y * k) + ') rotate(' + n1(-tp.h) + ')">' + R(-7, -4.5, 14, 9, 'fb-body', 2.5) + '</g>';
    return { g: g + car + top, dot: { x: 200, y: 180 }, on: function(x, y){ return x >= 116 && x <= 284 && y >= 104 && y <= 216; }, ins: { x: 8, y: 10 }, acc: { x: 200, y: 92 } };
  };
  SC.spring = function(P, o, id){
    var x = o.x != null ? o.x : P.x, xL = 210 + x * 400, b = [xL, 172, 70, 60];
    var coils = 12, pts = [], x0 = 38, L = xL - x0;
    for(var i = 0; i <= coils * 2; i++){ var t = i / (coils * 2); pts.push([x0 + 8 + (L - 16) * t, 202 + (i === 0 || i === coils * 2 ? 0 : (i % 2 ? -13 : 13))]); }
    var g = ground(id, 240, 38) + R(18, 104, 20, 136, 'fb-metal') + R(18, 104, 20, 136, 'fb-hatch', 0, ' fill="url(#' + id + '-h)"') + R(38, 232, 362, 8, 'fb-rail', 2) +
      Ln(210, 132, 210, 238, 'fb-guide') + Tx(206, 128, 'relaxed length', 'fb-t fb-t-s', 'end') +
      '<polyline class="fb-coil" points="' + [[x0, 202]].concat(pts, [[xL, 202]]).map(function(p){ return n1(p[0]) + ',' + n1(p[1]); }).join(' ') + '"/>' +
      (Math.abs(x) > 0.004 ? A.arrow(210, 164, xL - 210, 0, { cls: 'fb-dim-arrow', width: 1.6, head: 6 }) + Tx((210 + xL) / 2, 160, 'x', 'fb-t fb-ang', 'middle') : '');
    var blk = R(b[0] - 3, b[1] - 3, b[2] + 6, b[3] + 6, 'fb-glow', 6) + R(b[0], b[1], b[2], b[3], 'fb-block fb-obj', 4) + Ln(b[0] + 8, b[1] + 12, b[0] + b[2] - 8, b[1] + 12, 'fb-shine');
    return { g: g + blk, dot: { x: xL + 35, y: 202 }, on: function(xx, y){ return inBox(xx, y, b); }, ins: { x: 8, y: 10 }, acc: { x: xL + 35, y: 120 } };
  };
  SC.water = function(P, o, id){
    var floats = P.rho < FB.RHO_W, sz = 52 * Math.cbrt(P.V / 0.001), surf = 112, g = '', obj, dot, box;
    g += (P.held && !floats ? R(140, 20, 120, 10, 'fb-metal', 3) : '') +
      R(62, surf, 236, 158, 'fb-water') + '<path class="fb-surf" d="M62 ' + surf + ' q 14.75 -4 29.5 0 t 29.5 0 t 29.5 0 t 29.5 0 t 29.5 0 t 29.5 0 t 29.5 0 t 29.5 0"/>' +
      '<path class="fb-glass" d="M60 58 V272 H300 V58"/>' + Tx(290, 262, 'Water', 'fb-t fb-t-on', 'end');
    if(floats){
      var f = P.rho / FB.RHO_W, w = sz * 1.4, h = sz * 0.9, top = surf - (1 - f) * h, x0 = 180 - w / 2;
      box = [x0, top, w, h]; dot = { x: 180, y: top + h / 2 };
      obj = R(x0 - 3, top - 3, w + 6, h + 6, 'fb-glow', 6) + wood(x0, top, w, h, '') + R(x0, top, w, h, 'fb-obj fb-none', 4);
    } else {
      var cy = P.held ? 186 : Math.min(268 - sz / 2, 164 + (o.dy || 0)), r = sz / 2;
      box = [180 - r, cy - r, 2 * r, 2 * r]; dot = { x: 180, y: cy };
      var rock = [[-1, -0.55], [-0.55, -0.98], [0.3, -0.92], [0.95, -0.45], [1, 0.3], [0.6, 0.92], [-0.3, 0.98], [-0.92, 0.55]].map(function(q){ return [180 + q[0] * r, cy + q[1] * r]; });
      obj = (P.held ? Ln(200, 30, 180, cy - r * 0.95, 'fb-string') : '') + '<polygon class="fb-glow" points="' + rock.map(function(q){ return n1(180 + (q[0] - 180) * 1.08) + ',' + n1(cy + (q[1] - cy) * 1.08); }).join(' ') + '"/>' + Pg(rock, 'fb-stone fb-obj');
      o.end = cy >= 268 - sz / 2 - 1e-6;
    }
    return { g: g + obj, dot: dot, on: function(x, y){ return inBox(x, y, box); }, ins: { x: 304, y: 10 }, acc: { x: dot.x + 62, y: dot.y - 10 }, end: o.end };
  };
  /* The params a scene's picture needs from a problem or the sliders. */
  function scene(sc, P, o, id){ return SC[sc](P, o || {}, id); }

  /* Arrows of a solved situation, to scale, from the dot. */
  function fbdArrows(forces, dot, sc, o){
    o = o || {};
    return forces.map(function(f, i){
      var L = f.mag * sc.ppN, v = pv(f.ang, L);
      return '<g class="fb-f' + (o.sel === i ? ' is-sel' : '') + '"' + (o.tap ? ' data-f="' + i + '" tabindex="0" role="button" aria-label="' + esc(plain(sub(f.sym)) + ', ' + f.agent + ' on ' + (o.obj || 'object') + ': ' + f3(f.mag) + ' newtons, ' + dirText(f.ang)) + '"' : '') + '>' +
        (o.tap ? Ln(dot.x, dot.y, dot.x + v.x, dot.y + v.y, 'fb-hit') : '') + A.arrow(dot.x, dot.y, v.x, v.y, { cls: TY[f.type].cls + ' fb-a', label: f.sym, width: 4, head: 11 }) + '</g>';
    }).join('') + '<circle class="fb-dot" cx="' + n1(dot.x) + '" cy="' + n1(dot.y) + '" r="4.5"/>';
  }
  /* Forces tip to tail, and the dashed ΣF from start to end: the net force,
     shown beside the picture (never on the FBD itself). */
  function sumInset(forces, at, title){
    var pts = [{ x: 0, y: 0 }], s = { x: 0, y: 0 };
    forces.forEach(function(f){ s = { x: s.x + f.mag * Math.cos(rad(f.ang)), y: s.y + f.mag * Math.sin(rad(f.ang)) }; pts.push(s); });
    var mx = Math.max.apply(null, forces.map(function(f){ return f.mag; }).concat([1e-9]));
    var xs = pts.map(function(p){ return p.x; }), ys = pts.map(function(p){ return p.y; });
    var x0 = Math.min.apply(null, xs), x1 = Math.max.apply(null, xs), y0 = Math.min.apply(null, ys), y1 = Math.max.apply(null, ys);
    var k = Math.min(72 / Math.max(x1 - x0, 1e-9), 64 / Math.max(y1 - y0, 1e-9), 60 / mx);
    var bx = at.x + 49 - (x0 + x1) / 2 * k, by = at.y + 62 + (y0 + y1) / 2 * k;
    var out = R(at.x, at.y, 98, 118, 'fb-inset', 10) + Tx(at.x + 49, at.y + 18, title || 'Tip to tail', 'fb-t fb-t-s', 'middle');
    // A force straight back along the one before it is nudged sideways so both stay visible.
    var off = 0;
    forces.forEach(function(f, i){ var a = pts[i], b = pts[i + 1], back = i > 0 && FB.adiff(f.ang, forces[i - 1].ang) > 179;
      off = back ? (off ? 0 : 7) : off; var ox = off * Math.sin(rad(f.ang)), oy = off * Math.cos(rad(f.ang));
      out += A.arrow(bx + a.x * k + ox, by - a.y * k + oy, (b.x - a.x) * k, -(b.y - a.y) * k, { cls: TY[f.type].cls, width: 2.4, head: 7 }); });
    var net = pts[pts.length - 1], tiny = Math.sqrt(net.x * net.x + net.y * net.y) < 1e-6 * mx + 1e-9;
    if(tiny) out += Tx(at.x + 49, at.y + 111, 'ΣF = 0', 'fb-t fb-net-t', 'middle');
    else out += A.arrow(bx, by, net.x * k, -net.y * k, { cls: 'net', width: 2.4, head: 8, dashed: true }) + Tx(at.x + 49, at.y + 111, 'ΣF dashed', 'fb-t fb-t-s', 'middle');
    return out;
  }
  function scaleBar(sc, x, y){ return Ln(x, y, x + 50, y, 'fb-scale') + Ln(x, y - 4, x, y + 4, 'fb-scale') + Ln(x + 50, y - 4, x + 50, y + 4, 'fb-scale') + Tx(x + 56, y + 4, '= ' + M.fmt(sc.per50, 2) + ' N', 'fb-t'); }
  /* Component view: axes through the dot (tilted on a ramp) and the dashed
     components of every force that is not along one of them. */
  function components(res, dot, sc){
    var a0 = res.axis.tilt ? -res.axis.tilt : 0, out = '';
    [a0, a0 + 90].forEach(function(ax){ var v = pv(ax, 130); out += Ln(dot.x - v.x, dot.y - v.y, dot.x + v.x, dot.y + v.y, 'fb-axis'); });
    res.forces.forEach(function(f){
      [a0, a0 + 90].forEach(function(ax){
        var c = f.mag * Math.cos(rad(f.ang - ax)), d = FB.adiff(f.ang, ax);
        if(Math.abs(c) < 1e-6 * f.mag || d < 0.5 || d > 179.5) return;
        var v = pv(ax, c * sc.ppN);
        out += A.arrow(dot.x, dot.y, v.x, v.y, { cls: TY[f.type].cls + ' fb-comp', width: 2, head: 7, dashed: true });
      });
    });
    return out;
  }

  /* ------------------------------------------------------------ explore */
  var DEF = {
    table: { m: 1.5, push: 0 }, hang1: { m: 3, a: 0 }, hang2: { m: 4, al: 40, be: 40 }, incline: { m: 2, th: 30 },
    rough: { m: 2, th: 25, mus: 0.6, muk: 0.4, start: 'rest' }, crate: { m: 20, F: 120, phi: 25, mode: 'pull', mus: 0.5, muk: 0.35 },
    elevator: { m: 60, a: 0, v: 'rest' }, atwood: { m1: 2, m2: 3, which: 1 }, car: { m: 1200, v: 12, r: 50, mus: 0.7 },
    spring: { m: 1, k: 100, x: 0.15 }, water: { rho: 600, V: 0.001, held: false }
  };
  function sl(key, label, min, max, step, unit, d){ return { key: key, label: label, min: min, max: max, step: step, unit: unit, d: d }; }
  function ch(key, label, opts){ return { key: key, label: label, opts: opts }; }
  var CTL = {
    table: { main: [sl('push', 'Hand pressing down', 0, 20, 1, 'N', 0)], more: [sl('m', 'Mass of the book', 0.5, 5, 0.1, 'kg', 1)] },
    hang1: { main: [sl('a', 'Acceleration (up is +)', -5, 5, 0.5, 'm/s²', 1)], more: [sl('m', 'Mass of the bucket', 0.5, 10, 0.5, 'kg', 1)] },
    hang2: { main: [sl('al', 'Left rope angle α', 15, 75, 5, '°', 0), sl('be', 'Right rope angle β', 15, 75, 5, '°', 0)], more: [sl('m', 'Mass of the sign', 1, 10, 0.5, 'kg', 1)] },
    incline: { main: [sl('th', 'Ramp angle θ', 0, 60, 1, '°', 0)], more: [sl('m', 'Mass of the block', 0.5, 5, 0.5, 'kg', 1)] },
    rough: { main: [sl('th', 'Ramp angle θ', 0, 60, 1, '°', 0), sl('mus', 'Static friction μs', 0, 1, 0.05, '', 2)],
      more: [ch('start', 'At the start', [['rest', 'Released from rest'], ['up', 'Shoved up the ramp at 3 m/s']]), sl('muk', 'Kinetic friction μk (at most μs)', 0, 1, 0.05, '', 2), sl('m', 'Mass of the block', 0.5, 5, 0.5, 'kg', 1)] },
    crate: { main: [sl('F', 'Force on the crate', 0, 300, 5, 'N', 0), sl('phi', 'Angle φ from the horizontal', 0, 60, 5, '°', 0)],
      more: [ch('mode', 'How', [['pull', 'A rope pulls (φ above the horizontal)'], ['push', 'A person pushes (φ below the horizontal)']]), sl('mus', 'Static friction μs', 0, 1, 0.05, '', 2), sl('muk', 'Kinetic friction μk (at most μs)', 0, 1, 0.05, '', 2), sl('m', 'Mass of the crate', 5, 50, 5, 'kg', 0)] },
    elevator: { main: [sl('a', 'Elevator acceleration (up is +)', -5, 5, 0.5, 'm/s²', 1)], more: [ch('v', 'At the start the elevator is', [['rest', 'at rest'], ['up', 'moving up at 2 m/s'], ['down', 'moving down at 2 m/s']]), sl('m', 'Mass of the person', 30, 100, 5, 'kg', 0)] },
    atwood: { main: [sl('m1', 'Left block m₁', 0.5, 5, 0.5, 'kg', 1), sl('m2', 'Right block m₂', 0.5, 5, 0.5, 'kg', 1)], more: [ch('which', 'Diagram of', [['1', 'the left block (m₁)'], ['2', 'the right block (m₂)']])] },
    car: { main: [sl('v', 'Speed', 0, 30, 1, 'm/s', 0)], more: [sl('r', 'Radius of the curve', 20, 150, 5, 'm', 0), sl('mus', 'Static friction μs', 0.1, 1, 0.05, '', 2), sl('m', 'Mass of the car', 800, 2000, 100, 'kg', 0)] },
    spring: { main: [sl('x', 'Stretch x (− is compressed)', -0.25, 0.25, 0.01, 'm', 2)], more: [sl('k', 'Spring constant k', 20, 300, 10, 'N/m', 0), sl('m', 'Mass of the block', 0.5, 5, 0.5, 'kg', 1)] },
    water: { main: [sl('rho', 'Density of the object', 200, 3000, 50, 'kg/m³', 0)], more: [sl('VL', 'Volume', 0.5, 2, 0.1, 'L', 1), ch('held', 'Under water, a dense object', [['0', 'is let go (it sinks)'], ['1', 'hangs from a string']])] }
  };

  function explore(host, data){
    var scenes = FB.ORDER.filter(function(s){ return (data.contexts || []).some(function(c){ return (c.scenes || []).indexOf(s) > -1; }); });
    if(!scenes.length) scenes = ['table'];
    var sc = scenes[0], P = {}, LS = null, comps = false, run = null, motion = { t: 0 }, sel = -1, start = null;
    scenes.forEach(function(s){ P[s] = Object.assign({}, DEF[s]); });
    host.innerHTML = '<section class="bt-problem fb-ex" aria-labelledby="fbx-h"><h2 id="fbx-h" class="sr-only">Explore the forces</h2>' +
      '<div class="fb-stage"><svg class="phys-scene fb-svg" viewBox="0 0 ' + W + ' ' + H + '" role="group" aria-labelledby="fbx-d"><title id="fbx-d">Free-body diagram scene</title><g class="fb-root"></g></svg></div>' +
      '<p class="sr-only fb-live" aria-live="polite"></p>' +
      '<div class="fb-dock"><div class="fb-pick"></div><div class="fb-main"></div><div class="bt-buttons fb-btns"><button type="button" class="bt-btn fb-run" aria-pressed="false">▶ Run</button><button type="button" class="bt-btn fb-comp-b" aria-pressed="false">Components</button></div></div>' +
      '<div class="fb-why"></div><div class="fb-nums"></div>' +
      T.moreHtml('<div class="fb-more"></div>', 'mass, friction and other settings') + '</section>';
    var q = function(s){ return host.querySelector(s) || (LS ? LS.root.querySelector(s) : null); };
    var svg = q('.fb-svg'), root = q('.fb-root'), live = T.announcer(q('.fb-live')), title = q('#fbx-d');
    var pickSel = T.choiceSelect({ label: 'Scene', options: scenes.map(function(s){ return { value: s, label: FB.SCENES[s].name }; }), value: sc, onChange: function(v){ stop(true); sc = v; sel = -1; controls(); draw(); } });
    q('.fb-pick').appendChild(pickSel.el);
    start = T.cue('Drag a slider and watch the forces change. Then press Run.');
    q('.fb-main').appendChild(start.el);
    var runB = q('.fb-run'), compB = q('.fb-comp-b');
    runB.addEventListener('click', function(){ if(run && run.running()) stop(true); else if(motion.t > 0) { stop(true); draw(); } else go(); });
    compB.addEventListener('click', function(){ comps = !comps; compB.setAttribute('aria-pressed', String(comps)); draw(); });
    svg.addEventListener('click', function(e){
      var b = e.target.closest('[data-blk]');
      if(b && sc === 'atwood'){ P.atwood.which = +b.getAttribute('data-blk'); stop(true); controls(); draw(); return; }
      var f = e.target.closest('[data-f]');
      sel = f ? +f.getAttribute('data-f') : -1; draw(); if(f) tell();
    });
    svg.addEventListener('keydown', function(e){ var f = e.target.closest('[data-f]'); if(f && (e.key === 'Enter' || e.key === ' ')){ e.preventDefault(); sel = +f.getAttribute('data-f'); draw(); tell(); var n = root.querySelector('[data-f="' + sel + '"]'); if(n) n.focus(); } });

    function controls(){
      var main = q('.fb-main'), more = q('.fb-more');
      Array.prototype.slice.call(main.children).forEach(function(c){ if(c !== start.el) c.remove(); });
      more.innerHTML = '';
      function make(spec, host2){
        var p = P[sc];
        if(spec.opts){
          var c = T.choiceSelect({ label: spec.label, options: spec.opts.map(function(o){ return { value: o[0], label: o[1] }; }), value: String(spec.key === 'held' ? (p.held ? 1 : 0) : p[spec.key]),
            onChange: function(v){ stop(true); p[spec.key] = spec.key === 'held' ? v === '1' : spec.key === 'which' ? +v : v; draw(); } });
          host2.appendChild(c.el); return;
        }
        var val = spec.key === 'VL' ? p.V * 1000 : p[spec.key];
        var s = T.slider({ label: spec.label, min: spec.min, max: spec.max, step: spec.step, value: val, unit: spec.unit, decimals: spec.d,
          onInput: function(v){
            stop(true); start.done();
            if(spec.key === 'VL') p.V = v / 1000; else p[spec.key] = v;
            if(spec.key === 'muk' && p.muk > p.mus){ p.muk = p.mus; s.set(p.muk); }
            if(spec.key === 'mus' && p.muk > p.mus){ p.muk = p.mus; var mk = more.querySelector('[data-k="muk"] input'); if(mk){ mk.value = String(p.muk); mk.dispatchEvent(new Event('input')); } }
            draw();
          } });
        s.el.setAttribute('data-k', spec.key);
        host2.appendChild(s.el);
      }
      CTL[sc].main.forEach(function(s){ make(s, main); });
      CTL[sc].more.forEach(function(s){ make(s, more); });
      more.insertAdjacentHTML('beforeend', '<p class="bt-small">g = 9.8 m/s². Arrows are drawn to scale (the bar under the picture). Ropes, springs and pulleys are ideal.</p>');
    }

    /* The situation at time t of a run (exact for constant acceleration;
       the spring is x₀ cos ωt; a skidding car is integrated). */
    function state(t){
      var p = P[sc], o = {}, res, run2 = t > 0;
      if(sc === 'rough' && p.start === 'up'){
        var th = rad(p.th), up = G * (Math.sin(th) + p.muk * Math.cos(th)), v0 = 3, ts = v0 / up, q0;
        if(t <= ts){ q0 = v0 * t - 0.5 * up * t * t; res = FB.solve('rough', Object.assign({}, p, { start: 'up' }), G); }
        else {
          q0 = v0 * ts / 2; var after = FB.solve('rough', Object.assign({}, p, { start: 'rest' }), G);
          if(after.amag > 1e-9){ var t2 = t - ts; q0 -= 0.5 * after.amag * t2 * t2; }
          res = after;
        }
        o.u = -q0 * 30;
      } else if(sc === 'spring'){
        var w = Math.sqrt(p.k / p.m); o.x = p.x * Math.cos(w * t); res = FB.solve('spring', Object.assign({}, p, { x: o.x }), G);
      } else if(sc === 'car'){
        res = FB.solve('car', p, G); o.top = carTop(p, t, res);
      } else {
        var pp = Object.assign({}, p); if(sc === 'water') pp.held = !!p.held;
        res = FB.solve(sc, pp, G);
        var a = res.a, am = res.amag, s = 0.5 * am * t * t;
        if(sc === 'incline' || sc === 'rough') o.u = s * 30;
        else if(sc === 'crate') o.dx = s * 30;
        else if(sc === 'hang1') o.dy = -0.5 * a.y * t * t * 30;
        else if(sc === 'atwood') o.dy = -0.5 * a.y * t * t * 30 * (p.which === 2 ? -1 : 1);
        else if(sc === 'water') o.dy = -0.5 * a.y * t * t * 30;
        else if(sc === 'elevator'){ var v0e = p.v === 'up' ? 2 : p.v === 'down' ? -2 : 0; o.dy = (v0e * t + 0.5 * a.y * t * t) * 30; o.vy = v0e + a.y * t; }
      }
      o.run = run2;
      return { res: res, o: o };
    }
    var carCache = null;
    function carTop(p, t, res){
      // Units of the curve's radius; the car starts at the bottom of the
      // circle moving counterclockwise (seen from above).
      if(!res.skid){ var ph = p.v * t / p.r - Math.PI / 2; return { x: Math.cos(ph), y: Math.sin(ph), h: M.deg(ph) + 90, trail: null }; }
      var key = [p.v, p.r, p.mus, p.m].join();
      if(!carCache || carCache.key !== key) carCache = { key: key, t: 0, s: { x: 0, y: -p.r, vx: p.v, vy: 0 }, trail: [{ x: 0, y: -1 }] };
      if(t < carCache.t){ carCache = null; return carTop(p, t, res); }
      var h = 1 / 240, fmax = p.mus * G, s = carCache.s;
      // Semi-implicit Euler with the friction limit μs·g toward the center
      // (sliding friction is taken at the same limit), stable for this step.
      while(carCache.t + h <= t){
        var r = Math.sqrt(s.x * s.x + s.y * s.y);
        s.vx += -fmax * s.x / r * h; s.vy += -fmax * s.y / r * h; s.x += s.vx * h; s.y += s.vy * h; carCache.t += h;
        if(carCache.trail.length < 400 && Math.round(carCache.t * 240) % 6 === 0) carCache.trail.push({ x: s.x / p.r, y: s.y / p.r });
      }
      var sc2 = 1 / p.r, x = Math.max(-1.35, Math.min(1.35, s.x * sc2)), y = Math.max(-1.35, Math.min(1.35, s.y * sc2));
      return { x: x, y: y, h: M.deg(Math.atan2(s.vy, s.vx)), trail: carCache.trail };
    }
    var DUR = { incline: 2.6, rough: 3.2, crate: 2.6, elevator: 3, atwood: 2.6, car: 4, spring: 4, water: 2.4, hang1: 2.4, table: 1, hang2: 1 };
    function go(){
      start.done();
      var s0 = state(0);
      if(s0.res.amag < 1e-9 && sc !== 'elevator' && !(sc === 'rough' && P.rough.start === 'up') && sc !== 'spring' && sc !== 'car'){
        draw(); if(LS) LS.pills([{ html: 'Nothing moves: the forces balance', tone: 'ghost' }], 'right', 'explore'); live('Nothing moves: the forces on the ' + FB.SCENES[sc].obj + ' balance.', true); return;
      }
      carCache = null;
      run = A.loop(function(dt, t){ motion.t = t; return draw(); }, { duration: DUR[sc], still: function(t){ motion.t = t; draw(); }, onEnd: function(){ runB.setAttribute('aria-pressed', 'false'); runB.textContent = '↺ Reset'; } });
      runB.setAttribute('aria-pressed', 'true'); runB.textContent = '❚❚ Stop';
      run.start();
    }
    function stop(reset){
      if(run){ run.stop(); run = null; }
      if(reset) motion.t = 0;
      runB.setAttribute('aria-pressed', 'false'); runB.textContent = motion.t > 0 ? '↺ Reset' : '▶ Run';
    }
    function draw(){
      var st = state(motion.t), res = st.res, p = P[sc], view = scene(sc, p, st.o, 'fbx'), sc2 = scaleOf(Math.max.apply(null, res.forces.map(function(f){ return f.mag; }).concat([1e-9])));
      if(sel >= res.forces.length) sel = -1;
      var acc = '';
      if(res.amag > 0.01 && view.acc){ var L = Math.min(64, 7 * res.amag), v = { x: res.a.x / res.amag * L, y: -res.a.y / res.amag * L }; acc = A.arrow(view.acc.x, view.acc.y, v.x, v.y, { cls: 'acc', label: 'a', width: 3, head: 9 }); }
      if(view.side){
        var vy = st.o.vy != null ? st.o.vy : (p.v === 'up' ? 2 : p.v === 'down' ? -2 : 0);
        acc = (Math.abs(vy) > 0.02 ? A.arrow(view.side.x, 150, 0, -vy * 16, { cls: 'vel', label: 'v', width: 3, head: 9 }) : Tx(view.side.x, 140, 'v = 0', 'fb-t', 'middle')) +
          (res.amag > 0.01 ? A.arrow(view.side.x + 30, 150, 0, -res.a.y * 9, { cls: 'acc', label: 'a', width: 3, head: 9 }) : Tx(view.side.x + 22, 172, 'a = 0', 'fb-t', 'middle'));
      }
      root.innerHTML = defs('fbx') + view.g + (comps ? components(res, view.dot, sc2) : '') + fbdArrows(res.forces, view.dot, sc2, { tap: true, sel: sel, obj: res.obj }) + acc +
        sumInset(res.forces, view.ins) + scaleBar(sc2, 276, 288);
      title.textContent = FB.SCENES[sc].name + '. Forces on the ' + res.obj + ': ' + res.forces.map(function(f){ return plain(sub(f.sym)) + ' ' + f3(f.mag) + ' N ' + dirText(f.ang); }).join('; ') + '. ' + stateWords(res).replace(/<[^>]+>/g, '');
      if(sel > -1){ var n = root.querySelector('[data-f="' + sel + '"]'); if(n && document.activeElement && document.activeElement.closest && document.activeElement.closest('.fb-svg')) n.focus(); }
      report(res, st);
      if(sc === 'spring' || sc === 'car' || sc === 'rough') return true;
      return !view.end;
    }
    function stateWords(res){
      var s = res.state, w = FB.aWords(res);
      if(sc === 'car') return res.skid ? 'Skids outward' : 'Turns with the curve';
      if(sc === 'water') return s === 'float' ? 'Floats at rest' : s === 'held' ? 'Held at rest' : 'Sinks, speeding up';
      if(sc === 'elevator'){ var v = P.elevator.v; if(res.amag < 1e-9) return v === 'rest' ? 'At rest' : 'Constant velocity'; return 'Accelerating ' + w; }
      if(res.amag < 1e-9) return s === 'steady' ? 'Constant velocity' : 'At rest';
      if(sc === 'rough' && s === 'slowing') return 'Slowing down';
      if(sc === 'spring') return 'Accelerating ' + w;
      return 'Accelerating ' + w;
    }
    function say(res){
      var p = P[sc], fs = res.forces, by = function(t){ return fs.filter(function(f){ return f.type === t; })[0]; }, Wt = by('grav') ? by('grav').mag : 0;
      switch(sc){
        case 'table': return p.push ? 'The table pushes up harder than gravity pulls down: F<sub>N</sub> = mg + F<sub>A</sub> = ' + N(by('normal').mag) + '.' : 'At rest: F<sub>N</sub> and F<sub>g</sub> balance (' + N(Wt) + ' each).';
        case 'hang1': return Math.abs(p.a) < 1e-9 ? 'No acceleration: F<sub>T</sub> = F<sub>g</sub> = ' + N(Wt) + '.' : 'Accelerating ' + (p.a > 0 ? 'up: F<sub>T</sub> (' + N(by('tension').mag) + ') beats' : 'down: F<sub>T</sub> (' + N(by('tension').mag) + ') is less than') + ' F<sub>g</sub> (' + N(Wt) + ').';
        case 'hang2': return 'The ropes\' vertical parts hold up F<sub>g</sub>: F<sub>T1</sub> = ' + N(res.T1) + ', F<sub>T2</sub> = ' + N(res.T2) + '. Shallower ropes pull harder.';
        case 'incline': return 'F<sub>N</sub> = mg cos θ = ' + N(by('normal') ? by('normal').mag : 0) + ', less than F<sub>g</sub>; the block speeds up at g sin θ = ' + f3(res.amag) + ' m/s².';
        case 'rough':
          var nf = by('normal') ? by('normal').mag : 0;
          if(by('fs')) return 'Static friction holds it: f<sub>s</sub> = mg sin θ = ' + N(by('fs').mag) + ', below its limit μ<sub>s</sub>F<sub>N</sub> = ' + N(p.mus * nf) + '.';
          if(res.state === 'slowing' && FB.adiff(by('fk').ang, -p.th) < 1) return 'Sliding up: kinetic friction (' + N(by('fk').mag) + ') points down the ramp, with gravity\'s part.';
          return 'Sliding down: kinetic friction μ<sub>k</sub>F<sub>N</sub> = ' + N(by('fk').mag) + ' points up the ramp' + (res.state === 'slowing' ? ' and wins: the block slows.' : '.');
        case 'crate':
          if(res.lift) return 'The ' + (p.mode === 'push' ? 'push' : 'rope') + ' lifts the crate off the floor: no normal force, no friction.';
          if(by('fs')) return 'The crate stays put: static friction matches F cos φ = ' + N(by('fs').mag) + ' (its limit is ' + N(p.mus * res.N) + ').';
          return 'Sliding: F cos φ = ' + N(p.F * Math.cos(rad(p.phi))) + ' beats kinetic friction ' + N(by('fk').mag) + '. F<sub>N</sub> = ' + N(res.N) + ', not mg.';
        case 'elevator': var nn = by('normal') ? by('normal').mag : 0;
          return nn <= 1e-9 ? 'Free fall: the floor does not push at all. The person feels weightless.' : Math.abs(p.a) < 1e-9 ? 'No acceleration: the scale reads mg = ' + N(Wt) + ', moving or not.' : 'The scale reads F<sub>N</sub> = ' + N(nn) + ', ' + (p.a > 0 ? 'more' : 'less') + ' than mg (' + N(Wt) + '): the person feels ' + (p.a > 0 ? 'heavier' : 'lighter') + '.';
        case 'atwood': return Math.abs(p.m1 - p.m2) < 1e-9 ? 'Equal masses: F<sub>T</sub> = mg and nothing accelerates.' : 'The heavier block goes down. a = ' + f3(res.am) + ' m/s²; F<sub>T</sub> = ' + N(res.T) + ', between the two weights.';
        case 'car': return p.v < 1e-9 ? 'Parked: no friction is needed.' : res.skid ? 'It needs mv²/r = ' + N(res.need) + ', but friction gives at most ' + N(res.max) + ': the car skids outward.' : 'Static friction points to the center: f<sub>s</sub> = mv²/r = ' + N(res.need) + ' (at most ' + N(res.max) + ').';
        case 'spring': var fsp = by('spring'); return !fsp ? 'At the relaxed length the spring exerts no force.' : 'The ' + (fsp.ang > 90 ? 'stretched spring pulls' : 'compressed spring pushes') + ' the block back toward the relaxed length: k|x| = ' + N(fsp.mag) + '.';
        case 'water': return res.floats ? 'Floats: F<sub>b</sub> = F<sub>g</sub> = ' + N(Wt) + '; ' + Math.round(res.sub * 100) + '% of the block is under water.' : 'F<sub>b</sub> = ρ<sub>water</sub>Vg = ' + N(res.Fb) + ', less than F<sub>g</sub> = ' + N(Wt) + (P.water.held ? ': the string holds the rest.' : ': it sinks.');
      }
      return '';
    }
    function report(res, st){
      var head = say(res), ls = FB.laws(res);
      if(sel > -1){ var f = res.forces[sel]; head = '<b>' + sub(f.sym) + ', ' + esc(f.agent) + ' on ' + esc(res.obj) + ':</b> ' + N(f.mag) + ', ' + dirText(f.ang) + '. ' + f.dirWhy; }
      var why = '<h3 class="ls-title-l">Newton\'s second law, axis by axis</h3>' + ls.map(function(l){
        return '<div class="fb-law"><p class="fb-law-h">' + esc(l.axis) + ' <span>(positive: ' + esc(l.pos) + ')</span></p>' +
          '<p class="fb-eq">' + (l.empty ? 'No force has a part this way, so a = 0 here.' : 'ΣF = ' + l.sym + '</p><p class="fb-eq fb-eq-n">' + l.num) + '</p>' +
          '<p class="fb-law-r">' + (Math.abs(l.sum) < 1e-6 * (1 + res.m) ? 'Balanced: no acceleration this way.' : 'a = ΣF / m = ' + M.minus(f3(l.sum)) + ' N / ' + f3(res.m) + ' kg = ' + M.minus(f3(l.sum / res.m)) + ' m/s².') + '</p></div>';
      }).join('') +
        '<h3 class="ls-title-l">Why each force is there</h3><ul class="fb-list">' + res.forces.map(function(f){ return '<li><b>' + sub(f.sym) + ', ' + esc(f.agent) + ' on ' + esc(res.obj) + '.</b> ' + f.dirWhy + '</li>'; }).join('') + '</ul>' +
        '<p class="bt-small">The dashed arrow in the box is the net force ΣF: the forces added tip to tail. It is not one more force, so it never goes on the free-body diagram.</p>';
      var whyEl = q('.fb-why'); if(whyEl) whyEl.innerHTML = why;
      var nums = q('.fb-nums');
      if(nums) nums.innerHTML = '<h3 class="ls-title-l">The forces</h3><table class="ls-tbl fb-tbl"><caption class="sr-only">Forces on the ' + esc(res.obj) + '</caption><thead><tr><th scope="col">Force</th><th scope="col" class="r">Size</th><th scope="col">Direction</th></tr></thead><tbody>' +
        res.forces.map(function(f){ return '<tr><th scope="row">' + sub(f.sym) + ', ' + esc(f.agent) + ' on ' + esc(res.obj) + '</th><td class="r">' + N(f.mag) + '</td><td>' + dirText(f.ang) + '</td></tr>'; }).join('') +
        '<tr class="hl"><th scope="row">Acceleration</th><td class="r">' + f3(res.amag) + ' m/s²</td><td>' + (res.amag > 1e-9 ? FB.aWords(res) : '(none)') + '</td></tr></tbody></table>';
      if(LS){
        LS.caption(head, 'explore');
        var tone = /skid|Sinks/i.test(stateWords(res)) ? 'warn' : res.amag > 1e-9 ? 'accent' : 'ghost';
        LS.pills([{ k: 'a', html: f3(res.amag) + ' m/s²', tone: 'readout' }, { html: '<span class="fb-pill-st">' + stateWords(res) + '</span>', tone: tone }], 'left', 'explore');
        LS.pills([], 'right', 'explore');
      } else {
        var cap = q('.fb-cap'); if(cap) cap.innerHTML = head;
      }
      if(!st.o.run) live(plain(head));
    }
    function tell(){ /* the caption already carries the tapped force */ }

    /* Tool Studio: the picture on the stage; scene, sliders, Run and
       Components in the dock; Newton's law in Why; settings and the force
       table in Details. */
    function studio(pane, s){
      LS = s;
      if(s.detailsTitle) s.detailsTitle('Numbers & settings');
      var o = { mode: 'explore' };
      var stage = document.createElement('div'); stage.className = 'fb-ls-stage'; stage.appendChild(q('.fb-stage')); stage.appendChild(q('.fb-live'));
      s.add('stage', stage, o);
      var dock = q('.fb-dock'); dock.classList.add('fb-ls-dock');
      s.add('dock', dock, o);
      var why = document.createElement('div'); why.className = 'ls-sec fb-ls-why'; why.appendChild(q('.fb-why'));
      s.add('why', why, o);
      var det = document.createElement('div'); det.className = 'ls-sec fb-ls-det';
      var more = q('details.bt-more'); more.classList.add('fb-ls-more'); more.open = true; more.querySelector('summary').textContent = 'Settings for this scene';
      det.appendChild(more); det.appendChild(q('.fb-nums'));
      Array.prototype.slice.call(pane.querySelectorAll(':scope > *')).forEach(function(k){ if(k.textContent.trim()) det.appendChild(k); });
      s.add('details', det, o);
      controls(); draw();
      if(s.mode() === 'explore') s.hint({ target: s.root.querySelector('.fb-main input[type=range]'), text: 'Drag to change the situation' });
    }
    if(!(window.LevlStudio && T.studioOf(host))){
      host.querySelector('.fb-stage').insertAdjacentHTML('afterend', '<p class="tx-where fb-cap"></p>');
      controls(); draw();
    }
    return { studio: studio, stop: function(){ stop(false); } };
  }

  /* ------------------------------------------------------- test yourself */
  function seedFromUrl(){ try{ var m = /[?&#]seed=(\d+)/.exec(location.search + location.hash); if(m) return +m[1]; }catch(e){} return 0; }
  function freshSeed(){ return 10000 + Math.floor(Math.random() * 89999); }

  function quiz(host, data){
    var contexts = data.contexts || [], seed = seedFromUrl() || freshSeed(), only = '', LS = T.studioOf(host);
    var allScenes = FB.ORDER.filter(function(s){ return contexts.some(function(c){ return (c.scenes || []).indexOf(s) > -1; }); });
    host.innerHTML = '<section class="bt-problem fb-q" aria-labelledby="fbq-h"><h2 id="fbq-h" class="sr-only">Test yourself: draw the free-body diagram</h2>' +
      '<div class="fb-qstage"><div class="fb-stage"><svg class="phys-scene fb-svg fb-build" viewBox="0 0 ' + W + ' ' + H + '" role="group" aria-labelledby="fbq-d"><title id="fbq-d">Your free-body diagram</title><g class="fb-bg"></g><g class="fb-layer"></g></svg></div><p class="sr-only fb-qlive" aria-live="polite"></p></div>' +
      '<div class="fb-qdock"><div class="fb-done" hidden></div><div class="fb-step"></div><div class="bt-next fb-next"></div></div>' +
      '<div class="fb-qwhy"><h3 class="ls-title-l">Worked solution</h3><p class="ls-sub">It appears here once every step is answered.</p></div>' +
      '<div class="fb-qdet"><h3 class="ls-title-l">This problem</h3><div class="bt-context fb-qtext"></div><p class="bt-code fb-code"></p><div class="fb-qpick"></div>' +
      '<div class="bt-small fb-keys"><p><b>Drawing without a mouse.</b> Tab to a force arrow, then: ← → turn it (Page Up / Page Down turn 45°), ↑ ↓ make it longer or shorter, Shift + arrow keys move it, Delete removes it. The buttons under the palette do the same.</p></div></div></section>';
    var $ = function(s){ return host.querySelector(s) || (LS ? LS.root.querySelector(s) : null); };
    var svg = $('.fb-build'), bg = $('.fb-bg'), layer = $('.fb-layer'), qlive = T.announcer($('.fb-qlive')), stepEl = $('.fb-step'), nextEl = $('.fb-next'), doneEl = $('.fb-done');
    if(allScenes.length > 1){
      var pk = T.choiceSelect({ label: 'Scenes to practice', options: [{ value: '', label: 'Any scene' }].concat(allScenes.map(function(s){ return { value: s, label: FB.SCENES[s].name }; })), value: '',
        onChange: function(v){ only = v; seed = freshSeed(); load(true); } });
      $('.fb-qpick').appendChild(pk.el);
    }
    if(LS){
      var o = { mode: 'quiz' };
      var stg = document.createElement('div'); stg.className = 'fb-ls-qstage'; stg.appendChild($('.fb-qstage'));
      LS.add('stage', stg, o);
      var dk = $('.fb-qdock'); dk.classList.add('fb-ls-qdock'); LS.add('dock', dk, o);
      var wy = document.createElement('div'); wy.className = 'ls-sec'; wy.appendChild($('.fb-qwhy')); LS.add('why', wy, o);
      var dt = document.createElement('div'); dt.className = 'ls-sec'; dt.appendChild($('.fb-qdet'));
      LS.add('details', dt, o);
    }

    var p, view, sc2, arrows, selId, uid = 0, results, tries, locked, results0;
    function pickCtx(r){
      var ok = contexts.filter(function(c){ return !only || (c.scenes || []).indexOf(only) > -1; });
      return r.pick(ok.length ? ok : contexts);
    }
    function load(focus){
      var r = M.rng(seed), ctx = pickCtx(r);
      p = FB.generate(r, ctx, only || undefined);
      arrows = []; selId = null; results = []; locked = false; tries = 0;
      view = scene(p.scene, p.params, {}, 'fbq');
      var mx = Math.max.apply(null, p.res.forces.map(function(f){ return f.mag; }));
      sc2 = scaleOf(mx);
      $('.fb-qtext').innerHTML = '<p>' + p.text + '</p>';
      $('.fb-code').innerHTML = 'Problem code <b>' + seed + '</b> <a href="?seed=' + seed + '">Link to this problem</a>';
      $('.fb-qwhy').innerHTML = '<h3 class="ls-title-l">Worked solution</h3><p class="ls-sub">It appears here once every step is answered.</p>';
      bg.innerHTML = defs('fbq') + '<g class="fb-muted">' + view.g + '</g><circle class="fb-dot" cx="' + n1(view.dot.x) + '" cy="' + n1(view.dot.y) + '" r="5"/>';
      nextEl.innerHTML = ''; doneEl.hidden = true; doneEl.innerHTML = '';
      if(LS){ LS.pills([], 'left', 'quiz'); LS.pills([], 'right', 'quiz'); }
      stepFbd();
      render();
      if(focus){ var b = stepEl.querySelector('button, select, input'); if(b) b.focus(); }
    }

    /* ---- the drawing ---- */
    function cur(){ return arrows.filter(function(a){ return a.id === selId; })[0] || null; }
    function tip(a){ var v = pv(a.ang, a.len); return { x: a.tx + v.x, y: a.ty + v.y }; }
    function onObj(a){ return Math.hypot(a.tx - view.dot.x, a.ty - view.dot.y) < 2 || view.on(a.tx, a.ty); }
    function label(a){
      var L = FB.labelsOf(p.scene).filter(function(l){ return l.agent === a.agent && l.rev === !!a.rev; })[0];
      return L ? L.text : 'not labeled yet';
    }
    function describe(a){ return TY[a.type].name + ', ' + label(a) + ', pointing ' + dirText(a.ang) + ', length ' + Math.round(a.len) + (onObj(a) ? '' : ', starting off the object'); }
    function render(keepFocus){
      var fid = keepFocus ? selId : null;
      layer.innerHTML = arrows.map(function(a, i){
        var t = tip(a), v = pv(a.ang, a.len), T0 = TY[a.type], st = a.mark ? ' is-' + a.mark.st : '';
        var lab = a.agent || T0.fam === 'fake' ? sub(T0.sym) : sub(T0.sym) + '?';
        return '<g class="fb-ua' + (a.id === selId ? ' is-sel' : '') + st + '" data-a="' + a.id + '" tabindex="0" role="button" aria-label="' + esc(describe(a)) + (a.mark ? '. ' + (a.mark.st === 'ok' ? 'Correct' : 'Needs a fix, note ' + a.mark.n) : '') + '">' +
          Ln(a.tx, a.ty, t.x, t.y, 'fb-hit', ' data-h="move"') +
          A.arrow(a.tx, a.ty, v.x, v.y, { cls: T0.cls + ' fb-a', width: 4, head: 11 }) +
          '<text class="fb-ulab" x="' + n1(t.x + Math.cos(rad(a.ang)) * 14 + (Math.abs(Math.sin(rad(a.ang))) > 0.7 ? 10 : 0)) + '" y="' + n1(t.y - Math.sin(rad(a.ang)) * 14 + 5) + '" text-anchor="' + (Math.cos(rad(a.ang)) < -0.3 ? 'end' : 'start') + '">' + svgSub(lab) + '</text>' +
          (a.mark ? '<g class="fb-badge"><circle cx="' + n1(t.x - v.x * 0.45) + '" cy="' + n1(t.y - v.y * 0.45) + '" r="10"/><text x="' + n1(t.x - v.x * 0.45) + '" y="' + n1(t.y - v.y * 0.45 + 4) + '" text-anchor="middle">' + (a.mark.st === 'ok' ? '✓' : a.mark.n) + '</text></g>' : '') +
          (locked ? '' : '<circle class="fb-handle" cx="' + n1(t.x) + '" cy="' + n1(t.y) + '" r="15" data-h="tip"/>') + '</g>';
      }).join('') + (p && p.shown ? '' : '');
      if(fid != null){ var n = layer.querySelector('[data-a="' + fid + '"]'); if(n) n.focus(); }
      edit();
    }
    function svgSub(t){ return String(t).replace(/<sub>(.*?)<\/sub>/g, '<tspan dy="4" font-size="0.75em">$1</tspan><tspan dy="-4"></tspan>'); }
    function add(type){
      var hw = stepEl.querySelector('.fb-how'); if(hw) hw.hidden = true;
      var n = arrows.length, ang = FB.norm(30 + n * 50), a = { id: ++uid, type: type, agent: '', rev: false, ang: ang, len: 70, tx: view.dot.x, ty: view.dot.y };
      arrows.push(a); selId = a.id; clearMarks(); render();
      qlive(TY[type].name + ' added, pointing ' + dirText(ang) + '. Drag its tip, or use the turn and length buttons, then choose who exerts it.', true);
      var s = stepEl.querySelector('.fb-agent select'); if(s) s.focus();
    }
    function clearMarks(){ arrows.forEach(function(a){ a.mark = null; }); var fb = stepEl.querySelector('.fb-fb'); if(fb && !locked) fb.innerHTML = ''; }
    function change(a, fn, say){ if(locked || !a) return; fn(a); a.ang = FB.norm(Math.round(a.ang)); a.len = Math.max(22, Math.min(150, a.len)); clearMarks(); render(true); if(say) qlive(describe(a)); }

    // Pointer: drag a tip to aim and size, drag the shaft to move the arrow.
    var drag = null;
    function pt(e){ var m = svg.getScreenCTM(); if(!m) return { x: 0, y: 0 }; var q0 = svg.createSVGPoint(); q0.x = e.clientX; q0.y = e.clientY; var r = q0.matrixTransform(m.inverse()); return { x: r.x, y: r.y }; }
    svg.addEventListener('pointerdown', function(e){
      if(locked) return;
      var g = e.target.closest('[data-a]');
      if(!g){ if(selId != null){ selId = null; render(); } return; }
      var a = arrows.filter(function(x){ return x.id === +g.getAttribute('data-a'); })[0], h = e.target.getAttribute('data-h') || 'move';
      selId = a.id; drag = { a: a, h: h, p0: pt(e), t0: { x: a.tx, y: a.ty }, moved: false };
      try{ svg.setPointerCapture(e.pointerId); }catch(x){}
      e.preventDefault(); render();
    });
    svg.addEventListener('pointermove', function(e){
      if(!drag) return;
      var q1 = pt(e), a = drag.a;
      if(Math.hypot(q1.x - drag.p0.x, q1.y - drag.p0.y) > 3) drag.moved = true;
      if(!drag.moved) return;
      if(drag.h === 'tip'){
        var dx = q1.x - a.tx, dy = q1.y - a.ty;
        a.ang = FB.norm(Math.round(M.deg(Math.atan2(-dy, dx)) / 5) * 5); a.len = Math.max(22, Math.min(150, Math.hypot(dx, dy)));
      } else {
        a.tx = drag.t0.x + q1.x - drag.p0.x; a.ty = drag.t0.y + q1.y - drag.p0.y;
        if(Math.hypot(a.tx - view.dot.x, a.ty - view.dot.y) < 16){ a.tx = view.dot.x; a.ty = view.dot.y; }
        a.tx = Math.max(4, Math.min(W - 4, a.tx)); a.ty = Math.max(4, Math.min(H - 4, a.ty));
      }
      clearMarks(); render();
    });
    function endDrag(){ if(!drag) return; var a = drag.a; drag = null; qlive(describe(a)); }
    svg.addEventListener('pointerup', endDrag); svg.addEventListener('pointercancel', endDrag);
    layer.addEventListener('keydown', function(e){
      var g = e.target.closest('[data-a]'); if(!g || locked) return;
      var a = arrows.filter(function(x){ return x.id === +g.getAttribute('data-a'); })[0]; selId = a.id;
      var k = e.key, sh = e.shiftKey, hit = true;
      if(sh && /^Arrow/.test(k)) change(a, function(x){ var d = { ArrowLeft: [-6, 0], ArrowRight: [6, 0], ArrowUp: [0, -6], ArrowDown: [0, 6] }[k]; x.tx += d[0]; x.ty += d[1]; if(Math.hypot(x.tx - view.dot.x, x.ty - view.dot.y) < 7){ x.tx = view.dot.x; x.ty = view.dot.y; } }, true);
      else if(k === 'ArrowLeft') change(a, function(x){ x.ang += 5; }, true);
      else if(k === 'ArrowRight') change(a, function(x){ x.ang -= 5; }, true);
      else if(k === 'PageUp') change(a, function(x){ x.ang += 45; }, true);
      else if(k === 'PageDown') change(a, function(x){ x.ang -= 45; }, true);
      else if(k === 'ArrowUp') change(a, function(x){ x.len += 8; }, true);
      else if(k === 'ArrowDown') change(a, function(x){ x.len -= 8; }, true);
      else if(k === 'Delete' || k === 'Backspace') remove(a);
      else if(k === 'Enter' || k === ' '){ render(true); var s = stepEl.querySelector('.fb-agent select'); if(s) s.focus(); }
      else hit = false;
      if(hit) e.preventDefault();
    });
    layer.addEventListener('focusin', function(e){ var g = e.target.closest('[data-a]'); if(g && +g.getAttribute('data-a') !== selId){ selId = +g.getAttribute('data-a'); edit(); layer.querySelectorAll('.fb-ua').forEach(function(n){ n.classList.toggle('is-sel', +n.getAttribute('data-a') === selId); }); } });
    function remove(a){ arrows = arrows.filter(function(x){ return x !== a; }); selId = null; clearMarks(); render(); qlive(TY[a.type].name + ' removed. ' + arrows.length + ' force' + (arrows.length === 1 ? '' : 's') + ' drawn.', true); var b = stepEl.querySelector('.fb-pal button'); if(b) b.focus(); }

    /* ---- step 1: the diagram ---- */
    function palHtml(){
      return '<div class="fb-pal" role="group" aria-label="Add a force">' + FB.PALETTE.map(function(t){
        return '<button type="button" class="fb-chip" data-t="' + t + '" aria-label="Add ' + esc(TY[t].name.toLowerCase().replace(' (a push)', '')) + '"><svg viewBox="0 0 22 22" aria-hidden="true" class="fb-sw ' + TY[t].cls + '"><line x1="3" y1="11" x2="14" y2="11"/><polygon points="20,11 13,6.5 13,15.5"/></svg><span>' + esc(TY[t].short) + '</span></button>';
      }).join('') + '</div>';
    }
    function stepFbd(){
      var s = p.steps[0];
      stepEl.innerHTML = '<p class="fb-label"><span class="fb-n">Step 1 of 3</span> Draw the free-body diagram of the ' + (p.scene === 'atwood' ? 'block ' + p.params.which : esc(p.res.obj)) + '.</p><p class="bt-small fb-how">Tap a force to add it. Drag its tip to aim and size it, then choose who exerts it.</p>' +
        '<div class="cd-fb fb-fb" role="status" aria-live="polite"></div>' +
        '<div class="fb-edit"></div><div class="fb-palw">' + palHtml() + '</div>' +
        '<div class="bt-actions fb-acts"><button type="button" class="btn-press sm fb-check">Check my diagram</button></div>';
      stepEl.querySelector('.fb-pal').addEventListener('click', function(e){ var b = e.target.closest('[data-t]'); if(b && !locked){ add(b.getAttribute('data-t')); if(firstTouch) firstTouch(); } });
      stepEl.querySelector('.fb-check').addEventListener('click', checkFbd);
      caption(p.text);
      if(LS && LS.mode() === 'quiz') LS.hint({ target: stepEl.querySelector('.fb-chip'), text: 'Tap a force to add it' });
    }
    var firstTouch = null;
    function edit(){
      var box = stepEl.querySelector('.fb-edit'); if(!box) return;
      var a = cur();
      if(!a || locked){ box.innerHTML = ''; box.hidden = true; return; }
      box.hidden = false;
      var opts = FB.labelsOf(p.scene), v = a.agent ? (a.rev ? 'r:' : 'a:') + a.agent : '';
      box.innerHTML = '<div class="fb-ed-h"><svg viewBox="0 0 22 22" aria-hidden="true" class="fb-sw ' + TY[a.type].cls + '"><line x1="3" y1="11" x2="14" y2="11"/><polygon points="20,11 13,6.5 13,15.5"/></svg><b>' + sub(TY[a.type].sym) + '</b> ' + esc(TY[a.type].name) + '</div>' +
        '<div class="bt-ctl bt-select fb-agent"><label for="fbq-ag" class="sr-only">Who exerts it?</label><select id="fbq-ag"><option value="">Who exerts it? Choose…</option>' +
        opts.map(function(l){ var k = (l.rev ? 'r:' : 'a:') + l.agent; return '<option value="' + esc(k) + '"' + (k === v ? ' selected' : '') + '>' + esc(plain(sub(TY[a.type].sym)) + ', ' + l.text) + '</option>'; }).join('') + '</select></div>' +
        '<div class="fb-ed-row" role="group" aria-label="Adjust ' + esc(TY[a.type].name) + '">' +
        '<button type="button" class="bt-btn fb-ib" data-e="ccw" aria-label="Turn counterclockwise 5 degrees">⟲</button><button type="button" class="bt-btn fb-ib" data-e="cw" aria-label="Turn clockwise 5 degrees">⟳</button>' +
        '<button type="button" class="bt-btn fb-ib" data-e="short" aria-label="Shorter">−</button><button type="button" class="bt-btn fb-ib" data-e="long" aria-label="Longer">+</button>' +
        '<button type="button" class="bt-btn fb-ib fb-rm" data-e="rm" aria-label="Remove this force">🗑</button><button type="button" class="bt-btn fb-ib fb-ok" data-e="ok" aria-label="Done with this force">✓</button></div>';
      box.querySelector('select').addEventListener('change', function(){ var x = this.value; a.agent = x ? x.slice(2) : ''; a.rev = x.charAt(0) === 'r'; clearMarks(); render(); qlive(describe(a)); });
      box.querySelectorAll('[data-e]').forEach(function(b){
        var k = b.getAttribute('data-e'), fn = { ccw: function(x){ x.ang += 5; }, cw: function(x){ x.ang -= 5; }, short: function(x){ x.len -= 8; }, long: function(x){ x.len += 8; } }[k], rep = null;
        if(fn){
          var stopRep = function(){ clearTimeout(rep); clearInterval(rep); rep = null; };
          b.addEventListener('pointerdown', function(e){ e.preventDefault(); change(a, fn); stopRep(); rep = setTimeout(function(){ rep = setInterval(function(){ change(a, fn); }, 70); }, 380); });
          ['pointerup', 'pointerleave', 'pointercancel'].forEach(function(ev){ b.addEventListener(ev, function(){ if(rep){ stopRep(); qlive(describe(a)); } }); });
          b.addEventListener('click', function(e){ if(e.detail === 0) change(a, fn, true); });
        } else if(k === 'rm') b.addEventListener('click', function(){ remove(a); });
        else b.addEventListener('click', function(){ selId = null; render(); var c = stepEl.querySelector('.fb-pal button'); if(c) c.focus(); });
      });
      stepEl.querySelector('.fb-palw').hidden = false;
    }
    function checkFbd(){
      if(locked) return;
      var fb = stepEl.querySelector('.fb-fb');
      if(!arrows.length){ fb.innerHTML = '<span class="bt-small">Add at least one force from the palette first.</span>'; return; }
      var unl = arrows.filter(function(a){ return !a.agent && TY[a.type].fam !== 'fake'; });
      if(unl.length){ fb.innerHTML = '<span class="bt-small">Label every force first: select ' + (unl.length === 1 ? 'the arrow marked with "?"' : 'each arrow marked with "?"') + ' and choose who exerts it.</span>'; selId = unl[0].id; render(); return; }
      tries++;
      var st = p.steps[0], g = FB.grade(arrows.map(function(a){ return { type: a.type, agent: a.agent, rev: a.rev, ang: a.ang, len: a.len, onObj: onObj(a) }; }), st);
      var notes = [], k = 0;
      arrows.forEach(function(a, i){ var r = g.arrows[i]; a.mark = { st: r.st === 'ok' ? 'ok' : 'bad' }; if(r.st !== 'ok' && r.code !== 'length'){ a.mark.n = ++k; notes.push('<li><span class="fb-nb">' + k + '</span> <b>' + sub(TY[a.type].sym) + ':</b> ' + r.why + '</li>'); } });
      g.notes.forEach(function(n){ var nn = ++k; n.arrows.forEach(function(i){ if(!arrows[i].mark.n) arrows[i].mark.n = nn; }); notes.push('<li><span class="fb-nb">' + nn + '</span> ' + n.why + '</li>'); });
      g.missing.forEach(function(m){ notes.push('<li><span class="fb-nb fb-nb-m">+</span> ' + m.why + '</li>'); });
      selId = null; render();
      if(g.ok){
        locked = true; render();
        fb.innerHTML = '<span class="phys-mark ok">Correct</span> Every force is there, each from a real agent, aimed and sized to fit the motion.';
        pass(0, tries === 1);
        return;
      }
      if(LS) LS.pills([{ html: 'Not yet: ' + (notes.length) + ' to fix', tone: 'warn' }], 'left', 'quiz');
      fb.innerHTML = '<span class="phys-mark no">Not yet</span><ul class="cd-notes fb-notes">' + notes.join('') + '</ul><div class="bt-actions"><button type="button" class="bt-btn fb-show">Show the answer</button></div>';
      fb.querySelector('.fb-show').addEventListener('click', showFbd);
      try{ fb.scrollIntoView({ block: 'nearest' }); }catch(e){}
      caption('<b>Fix the numbered forces, then check again.</b> ' + p.text);
      qlive('Not yet. ' + plain(notes.join(' ').replace(/<li>/g, ' ')), true);
    }
    function showFbd(){
      locked = true; uid = 0;
      arrows = p.res.forces.map(function(f){ return { id: ++uid, type: f.type, agent: f.agent, rev: false, ang: f.ang, len: Math.max(22, f.mag * sc2.ppN), tx: view.dot.x, ty: view.dot.y, mark: null }; });
      selId = null; render();
      stepEl.querySelector('.fb-fb').innerHTML = '<span class="phys-mark no">Shown</span> The correct diagram is drawn, to scale: <ul class="fb-list">' + p.res.forces.map(function(f){ return '<li><b>' + sub(f.sym) + ', ' + esc(f.agent) + ' on ' + esc(p.res.obj) + '</b> (' + N(f.mag) + '): ' + f.dirWhy + '</li>'; }).join('') + '</ul>';
      pass(0, false);
    }

    /* ---- steps 2 and 3, then the result ---- */
    function pass(i, right){
      var s = p.steps[i];
      results.push({ id: SLUG + ':' + p.ctx + ':' + s.key, correct: right, topic: (data.partTopics && data.partTopics[s.key]) || p.topic, practice: s.practice, level: 'apply', diff: 2, group: s.key });
      var chips = ['Diagram', 'Equation', 'Answer'];
      doneEl.hidden = false;
      doneEl.innerHTML = results.map(function(r, k){ return '<span class="fb-dchip ' + (r.correct ? 'ok' : 'no') + '">' + (r.correct ? '✓ ' : '✗ ') + chips[k] + '</span>'; }).join('');
      var fbStep = stepEl.querySelector('.fb-fb'), acts = stepEl.querySelector('.bt-actions.fb-acts, .bt-actions');
      if(acts && i === 0){ acts.innerHTML = '<button type="button" class="btn-press sm fb-go">Next: Newton\'s second law</button>'; acts.querySelector('.fb-go').addEventListener('click', function(){ stepChoice(); }); acts.querySelector('.fb-go').focus(); stepEl.querySelector('.fb-palw').hidden = true; stepEl.querySelector('.fb-edit').hidden = true; caption((right ? '<b>Right the first time.</b> ' : '<b>Compare with the diagram on the picture.</b> ') + p.text); if(LS) LS.pills([{ html: right ? 'Diagram right' : 'Diagram shown', tone: right ? 'good' : 'warn' }], 'left', 'quiz'); return; }
      if(i === 1) return stepNum();
      finish();
    }
    function axisMark(ang){
      var v = pv(ang, 120), d = view.dot;
      layer.insertAdjacentHTML('afterbegin', '<g class="fb-axisq">' + Ln(d.x - v.x, d.y - v.y, d.x + v.x, d.y + v.y, 'fb-axis') + Tx(d.x + v.x * 1.05, d.y + v.y * 1.05 + 4, '+', 'fb-t fb-plus', 'middle') + '</g>');
    }
    function stepChoice(){
      var s = p.steps[1], order = window.ApPhysQuestions ? window.ApPhysQuestions.shuffle(s.options.map(function(x, k){ return k; })) : [0, 1, 2, 3], st = 0;
      axisMark(lawAxis());
      stepEl.innerHTML = '<form class="cd-step fb-cstep" novalidate><p class="fb-label" id="fbq-l2"><span class="fb-n">Step 2 of 3</span> ' + s.label + '</p><fieldset class="cd-opts"><legend class="sr-only">' + esc(plain(s.label)) + '</legend>' +
        order.map(function(k){ return '<div class="bt-radio cd-opt"><input type="radio" name="fbq-c" id="fbq-c' + k + '" value="' + k + '"><label for="fbq-c' + k + '"><span class="fb-eqo">' + s.options[k] + '</span></label></div>'; }).join('') +
        '</fieldset><div class="bt-actions"><button type="submit" class="btn-press sm">Check</button></div><div class="cd-fb" role="status" aria-live="polite"></div></form>';
      caption(p.text + ' <span class="fb-capk">The + on the picture marks the positive direction.</span>');
      var form = stepEl.querySelector('form'), fb = form.querySelector('.cd-fb'), done = false;
      form.addEventListener('submit', function(e){
        e.preventDefault(); if(done) return;
        var c = form.querySelector('input:checked');
        if(!c){ fb.innerHTML = '<span class="bt-small">Choose an equation first.</span>'; return; }
        st++; var k = +c.value;
        if(k === s.correct){ done = true; lockForm(form); fb.innerHTML = '<span class="phys-mark ok">Correct</span> ' + s.why[k]; nextBtn(form, 'Next: solve it', function(){ pass(1, st === 1); }); return; }
        fb.innerHTML = '<span class="phys-mark no">Not yet</span> ' + s.why[k] + '<div class="bt-actions"><button type="button" class="bt-btn fb-show">Show the answer</button></div>';
        fb.querySelector('.fb-show').addEventListener('click', function(){ done = true; var r = form.querySelector('input[value="' + s.correct + '"]'); r.checked = true; lockForm(form); fb.innerHTML = '<span class="phys-mark no">Shown</span> ' + s.why[s.correct]; nextBtn(form, 'Next: solve it', function(){ pass(1, false); }); });
      });
      var first = form.querySelector('input'); if(first) first.focus();
    }
    function lawAxis(){
      var sc = p.scene, pr = p.params, ask = p.ask, th = pr.th;
      if(sc === 'incline') return ask === 'N' ? 90 - th : -th;
      if(sc === 'rough') return -th;
      if(sc === 'crate') return ask === 'N' ? 90 : 0;
      if(sc === 'atwood'){ var mine = pr.which === 2 ? pr.m2 : pr.m1, oth = pr.which === 2 ? pr.m1 : pr.m2; return mine > oth ? 270 : 90; }
      if(sc === 'car') return 180;
      if(sc === 'spring') return 0;
      if(sc === 'water') return ask === 'a' ? 270 : 90;
      return 90;
    }
    function lockForm(form){ form.querySelectorAll('input').forEach(function(x){ if(x.type === 'radio') x.disabled = true; else x.readOnly = true; }); var a = form.querySelector('.bt-actions'); if(a) a.innerHTML = ''; }
    function nextBtn(form, text, fn){
      var a = form.querySelector(':scope > .bt-actions'); if(!a){ a = document.createElement('div'); a.className = 'bt-actions'; form.appendChild(a); }
      a.innerHTML = '<button type="button" class="btn-press sm">' + esc(text) + '</button>';
      var b = a.querySelector('button'); b.addEventListener('click', fn); b.focus();
    }
    function stepNum(){
      var s = p.steps[2], st = 0;
      stepEl.innerHTML = '<form class="cd-step bt-part" novalidate><p class="fb-label"><span class="fb-n">Step 3 of 3</span> ' + s.label + '</p>' +
        '<div class="bt-num-row cd-num"><label class="sr-only" for="fbq-n">' + esc(plain(s.label)) + '</label><input type="text" id="fbq-n" inputmode="decimal" autocomplete="off" spellcheck="false" aria-describedby="fbq-nh"><span class="bt-unit">' + esc(s.unit) + '</span></div>' +
        '<p class="bt-small" id="fbq-nh">Give 2 or 3 significant figures. g = ' + (p.g === 10 ? '10' : '9.8') + ' m/s².</p>' +
        '<div class="bt-actions"><button type="submit" class="btn-press sm">Check</button></div><div class="cd-fb" role="status" aria-live="polite"></div></form>';
      caption(p.text);
      var form = stepEl.querySelector('form'), inp = form.querySelector('input'), fb = form.querySelector('.cd-fb'), done = false;
      form.addEventListener('submit', function(e){
        e.preventDefault(); if(done) return;
        var raw = inp.value.trim(); if(!raw){ fb.innerHTML = '<span class="bt-small">Type a number first, for example 12.5.</span>'; return; }
        var x = window.ApPhysQuestions ? window.ApPhysQuestions.parseNumber(raw) : parseFloat(raw), d = M.diagnose(s.cell, x);
        if(d.blank){ fb.innerHTML = '<span class="bt-small">Type a number, for example 12.5 or 1.2e3.</span>'; return; }
        st++;
        if(d.ok){ done = true; inp.classList.add('is-right'); lockForm(form); fb.innerHTML = '<span class="phys-mark ok">Correct</span> ' + f3(s.cell.answer) + ' ' + esc(s.unit) + '.'; nextBtn(form, 'See the result', function(){ pass(2, st === 1); }); return; }
        inp.classList.add('is-wrong');
        fb.innerHTML = '<span class="phys-mark no">Not yet</span> ' + (d.why || 'Recheck the arithmetic.') + '<div class="bt-actions"><button type="button" class="bt-btn fb-show">Show the answer</button></div>';
        fb.querySelector('.fb-show').addEventListener('click', function(){ done = true; inp.value = f3(s.cell.answer); lockForm(form); fb.innerHTML = '<span class="phys-mark no">Shown</span> ' + f3(s.cell.answer) + ' ' + esc(s.unit) + '. The worked solution is under Why.'; nextBtn(form, 'See the result', function(){ pass(2, false); }); });
      });
      inp.addEventListener('input', function(){ inp.classList.remove('is-wrong'); });
      inp.focus();
    }
    function finish(){
      var right = results.filter(function(r){ return r.correct; }).length;
      T.record(SLUG, results);
      T.event('apphys-drill-check', { tool: SLUG, correct: right, total: results.length });
      $('.fb-qwhy').innerHTML = '<h3 class="ls-title-l">Worked solution</h3><ol class="bt-steps">' + p.solution.map(function(x){ return '<li>' + x + '</li>'; }).join('') + '</ol>';
      stepEl.innerHTML = '';
      nextEl.innerHTML = '<p class="bt-result" role="status">' + right + ' of ' + results.length + ' steps right the first time.</p><div class="bt-actions"><button type="button" class="btn-press sm ls-btn ls-pri fb-again">New problem</button>' + T.report(SLUG + ':' + p.ctx) + '</div>';
      nextEl.querySelector('.fb-again').addEventListener('click', function(){ seed = freshSeed(); load(true); });
      T.keepGoing(nextEl, { topic: p.topic, also: results.filter(function(x){ return !x.correct; }).map(function(x){ return x.topic; }) });
      if(LS){ LS.pills([{ html: right + ' of ' + results.length + ' right', tone: right === results.length ? 'good' : 'warn' }], 'left', 'quiz'); }
      caption('<b>' + right + ' of ' + results.length + ' steps right the first time.</b> The worked solution is under Why.');
      nextEl.querySelector('.fb-again').focus();
    }
    function caption(h){ if(LS) LS.caption(h, 'quiz'); else { var c = $('.fb-qcap'); if(c) c.innerHTML = h; } }
    if(!LS) $('.fb-qstage').insertAdjacentHTML('afterend', '<p class="tx-where fb-qcap"></p>');
    load(false);
  }

  T.mount(SLUG, function(app, data){
    var ex = null;
    T.modes(app, { slug: SLUG, labels: ['Explore', 'Test yourself'],
      explore: function(host){ ex = explore(host, data); },
      quiz: function(host){ quiz(host, data); },
      onShow: function(m){ if(m !== 'explore' && ex) ex.stop(); },
      studio: { explore: function(pane, s){ ex.studio(pane, s); } } });
  });
})();
