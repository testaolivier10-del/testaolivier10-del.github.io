/* The NREMT drawn patient's shared pieces (tools v2): what an EMT puts on a patient and the face it is put on, one
   drawing for every NREMT tool that draws a patient from above (Protocol flowcharts, nremt/assets/flow-explore.js, and
   the Scenario simulator, nremt/assets/scenario-explore.js). Moved here from flow-explore.js after its review rounds
   (docs/tools-v2-nremt-flowcharts-brief.md); the flowcharts' look is unchanged (same markup at its own size).

   Every piece is drawn in the body figure's pixels (body-figs/, adult-front: 480 x 1200, the head about 200..282
   across). (cx, cy) moves a piece and s scales it: the adult figure at its own size is s = 1. p is the tool's class
   prefix ('fx2-', 'scx-'): the tool styles the classes, the module only draws.

     NremtPatientDraw.shapes(p)                       -> { glove, two }   a nitrile glove (back of the hand; fingers to
                                                         -y, wrist at +y; about 46 local px wide) and two fingers out
     .glove(p, x, y, rot, cls, sc, shape)             one glove at (x, y), turned rot degrees, scaled sc (1.45 adult)
     .cpr(p, cx, cy, s)                               two hands for compressions, the heel of one on the lower half of
                                                         the breastbone, the other on top, the forearms from the
                                                         patient's right (cx, cy = 227, 290 on the adult)
     .face(p, cx, cy, s, o)                           nose, brows, eyes open (.eo), closed (.ec), o.half: half closed
                                                         (.eh); mouth, lips, sweat (cx, cy = 240, 77, the eye line)
     .bvm(p, cx, cy, s)                               the bag valve mask's mask, rim, valve and bag (mask at 240, 120)
     .pads(p, c1, c2, s, wire)                        two AED pads (centres c1, c2) and their leads to the wire point
     .aed(p, x, y, s)                                 the AED with its screen, trace, words and shock button
     .grads(p, list, o)                               cloth gradients 'name:#dark:#light' (o.x1, o.x2: one shading
                                                         across the figure, userSpaceOnUse, so pieces of one garment match)
     .tp(d, cx, cy, s, ox, oy)                        move and scale an absolute path drawn about (ox, oy)
     .DRAWN(p, on)                                    the keep-out list: what a word on the picture must never cover
                                                         (the face and, of what is on the patient now, gloves, forearms,
                                                         pads, tourniquet, wound, jets, mask)
     .drawnBoxes(root, sel, P)                        those elements' boxes in stage px (P maps figure px to stage px)
     .place(pt, w, h, o)                              where a word goes: the first spot around pt, nearest first, that
                                                         keeps inside o.bounds and off o.taken, o.keep and o.drawn */
(function(){
  'use strict';
  if(window.NremtPatientDraw) return;

  function q(v){ var r = Math.round(v); return Math.abs(v - r) < 1e-9 ? String(r) : (Math.round(v * 10) / 10).toString(); }
  function sc(v, s){ return s === 1 ? String(v) : (Math.round(v * s * 1000) / 1000).toString(); }

  var GLOVE = '<g class="#gl"><path class="#glove" d="M13 -4C18 -11 24 -18 29 -18C33 -17 33 -12 30 -8L19 6Z"/>' +
    '<rect class="#glove" x="-15" y="-50" width="8" height="30" rx="4"/><rect class="#glove" x="-6" y="-54" width="8.5" height="34" rx="4.2"/>' +
    '<rect class="#glove" x="3.5" y="-51" width="8" height="31" rx="4"/><rect class="#glove" x="12" y="-43" width="7" height="23" rx="3.5"/>' +
    '<path class="#glove" d="M-16 16C-19 4 -18 -12 -15 -24C-8 -28 9 -28 17 -22C20 -10 18 4 13 16Z"/>' +
    '<path class="#gl-cr" d="M-14 -23q3 -2.5 6 0M-5 -25q3.2 -2.5 6.4 0M4.5 -24q3 -2.5 6 0M12.5 -21q2.6 -2 5.2 0M-6 -6q6 3 13 0"/>' +
    '<path class="#gl-hi" d="M-12.5 -45V-30M-3.4 -49V-31M6 -46V-30M14.5 -39V-27M-12 6C-14 -4 -14 -12 -12 -19"/>' +
    '<rect class="#glove #cuff" x="-15" y="12" width="29" height="12" rx="4"/><rect class="#rim" x="-16" y="21" width="31" height="5" rx="2.5"/></g>';
  var TWO = '<g class="#gl"><path class="#glove" d="M-15 -4C-21 -10 -23 -18 -19 -22C-15 -24 -12 -18 -11 -12Z"/>' +
    '<rect class="#glove" x="-9.5" y="-60" width="8.5" height="44" rx="4.2"/><rect class="#glove" x="0.5" y="-66" width="8.5" height="50" rx="4.2"/>' +
    '<rect class="#glove" x="8" y="-30" width="8" height="14" rx="4"/><rect class="#glove" x="13.5" y="-26" width="7" height="12" rx="3.5"/>' +
    '<path class="#glove" d="M-16 22C-19 8 -18 -6 -15 -18C-8 -22 9 -22 17 -16C20 -4 18 10 13 22Z"/>' +
    '<path class="#gl-cr" d="M-8 -17q3 -2.5 6 0M1.5 -17q3 -2.5 6 0M9 -18q3 -2 6 0M14 -15q2.6 -2 5.2 0"/>' +
    '<path class="#gl-hi" d="M-7 -55V-22M3 -61V-22M-12 12C-14 2 -14 -6 -12 -13"/>' +
    '<rect class="#glove #cuff" x="-15" y="18" width="29" height="12" rx="4"/><rect class="#rim" x="-16" y="27" width="31" height="5" rx="2.5"/></g>';
  var cache = {};
  function shapes(p){ return cache[p] || (cache[p] = { glove: GLOVE.replace(/#/g, p), two: TWO.replace(/#/g, p) }); }
  function glove(p, x, y, rot, cls, s, shape){
    return '<g' + (cls ? ' class="' + cls + '"' : '') + ' transform="translate(' + x + ' ' + y + ') rotate(' + rot + ') scale(' + (s || 1.45) + ')">' + (shape || shapes(p).glove) + '</g>';
  }

  /* an absolute path drawn about (ox, oy), moved to (cx, cy) and scaled by s; relative commands are only scaled */
  function tp(d, cx, cy, s, ox, oy){
    return d.replace(/([MLQCTSHVZmlqctshvz])([^MLQCTSHVZmlqctshvz]*)/g, function(all, c, nums){
      var n = (nums.match(/-?\d*\.?\d+(?:e-?\d+)?/g) || []).map(Number);
      if(!n.length) return c;
      var up = c === c.toUpperCase();
      var out = n.map(function(v, i){
        if(c === 'H' || c === 'h') return q(up ? cx + (v - ox) * s : v * s);
        if(c === 'V' || c === 'v') return q(up ? cy + (v - oy) * s : v * s);
        var isY = i % 2 === 1;
        return q(up ? (isY ? cy + (v - oy) * s : cx + (v - ox) * s) : v * s);
      });
      return c + out.join(' ');
    });
  }

  /* compressions: two hands, forearms in from the patient's right (adult: cx, cy = 227, 290) */
  function cpr(p, cx, cy, s){
    var P = function(d){ return tp(d, cx, cy, s, 227, 290); };
    return '<path class="' + p + 'sleeve" d="' + P('M60 262L212 268L212 290L60 294Z') + '"/><path class="' + p + 'sleeve ' + p + 'sleeve2" d="' + P('M60 306L214 292L214 312L60 336Z') + '"/>' +
      glove(p, q(cx - 3 * s), q(cy - 11 * s), 96, '', sc(1.35, s)) + glove(p, q(cx + 3 * s), q(cy + 11 * s), 84, p + 'top', sc(1.35, s));
  }

  /* the face about the eye line (adult: 240, 77) */
  var FACE = {
    brow: 'M215 66Q224 60 233 64M247 64Q256 60 265 66',
    lidC: 'M216 77Q224 81 232 77M248 77Q256 81 264 77',
    lidH: 'M215 76Q224 70 233 76Z M247 76Q256 70 265 76Z',
    nose: 'M240 80Q237 92 236 99Q240 103 245 99',
    mouthN: 'M230 119Q240 123 250 119',
    mouthO: 'M231 117Q240 113 249 117Q248 128 240 129Q232 128 231 117Z',
    sweat: 'M222 40q-3 6 0 9q3 -3 0 -9zM252 36q-3 6 0 9q3 -3 0 -9zM268 52q-3 6 0 9q3 -3 0 -9zM212 88q-3 6 0 9q3 -3 0 -9zM270 94q-3 6 0 9q3 -3 0 -9z'
  };
  function face(p, cx, cy, s, o){
    o = o || {};
    var P = function(d){ return tp(d, cx, cy, s, 240, 77); }, X = function(x){ return q(cx + (x - 240) * s); }, Y = function(y){ return q(cy + (y - 77) * s); }, S = function(v){ return q(v * s); };
    function eye(x){ return '<ellipse class="' + p + 'white" cx="' + X(x) + '" cy="' + Y(77) + '" rx="' + S(7.5) + '" ry="' + S(4.2) + '"/><circle class="' + p + 'iris" cx="' + X(x) + '" cy="' + Y(77) + '" r="' + S(3.4) + '"/><circle class="' + p + 'pupil" cx="' + X(x) + '" cy="' + Y(77) + '" r="' + S(1.5) + '"/>'; }
    return '<g class="' + p + 'face"><path class="' + p + 'nose" d="' + P(FACE.nose) + '"/><path class="' + p + 'brow" d="' + P(FACE.brow) + '"/>' +
      '<g class="' + p + 'eo">' + eye(224) + eye(256) + '</g><g class="' + p + 'ec"><path class="' + p + 'lid" d="' + P(FACE.lidC) + '"/></g>' +
      (o.half ? '<g class="' + p + 'eh">' + eye(224) + eye(256) + '<path class="' + p + 'lidh" d="' + P(FACE.lidH) + '"/></g>' : '') +
      '<path class="' + p + 'mouth ' + p + 'mn" d="' + P(FACE.mouthN) + '"/><path class="' + p + 'mo" d="' + P(FACE.mouthO) + '"/>' +
      '<ellipse class="' + p + 'lips" cx="' + X(240) + '" cy="' + Y(120) + '" rx="' + S(13) + '" ry="' + S(6) + '"/>' +
      '<path class="' + p + 'sweat" d="' + P(FACE.sweat) + '"/></g>';
  }

  /* the bag valve mask on the face (adult: the mask at 240, 120; the bag above the head) */
  function bvm(p, cx, cy, s){
    var X = function(x){ return q(cx + (x - 240) * s); }, Y = function(y){ return q(cy + (y - 120) * s); }, S = function(v){ return q(v * s); };
    return '<ellipse class="' + p + 'mask" cx="' + X(240) + '" cy="' + Y(120) + '" rx="' + S(32) + '" ry="' + S(38) + '"/><ellipse class="' + p + 'mask-r" cx="' + X(240) + '" cy="' + Y(120) + '" rx="' + S(22) + '" ry="' + S(27) + '"/><rect class="' + p + 'valve" x="' + X(226) + '" y="' + Y(56) + '" width="' + S(28) + '" height="' + S(22) + '" rx="' + S(6) + '"/>' +
      '<ellipse class="' + p + 'bag" cx="' + X(240) + '" cy="' + Y(-24) + '" rx="' + S(34) + '" ry="' + S(70) + '"/>';
  }

  /* two AED pads, centres c1 (upper right chest) and c2 (left side), leads to the wire point w (adult: 192,249; 343,351; 520,90) */
  function pads(p, c1, c2, s, w){
    var A = function(dx, dy){ return q(c1[0] + dx * s) + ' ' + q(c1[1] + dy * s); }, B = function(dx, dy){ return q(c2[0] + dx * s) + ' ' + q(c2[1] + dy * s); }, W = function(dx, dy){ return q(w[0] + dx * s) + ' ' + q(w[1] + dy * s); };
    return '<rect class="' + p + 'pad" x="' + q(c1[0] - 32 * s) + '" y="' + q(c1[1] - 23 * s) + '" width="' + q(64 * s) + '" height="' + q(46 * s) + '" rx="' + q(10 * s) + '" transform="rotate(-10 ' + q(c1[0]) + ' ' + q(c1[1]) + ')"/>' +
      '<rect class="' + p + 'pad" x="' + q(c2[0] - 25 * s) + '" y="' + q(c2[1] - 33 * s) + '" width="' + q(50 * s) + '" height="' + q(66 * s) + '" rx="' + q(10 * s) + '"/>' +
      '<path class="' + p + 'wire" d="M' + A(-2, -21) + 'C' + A(8, -89) + ' ' + W(-200, 30) + ' ' + W(0, 0) + 'M' + B(3, -33) + 'C' + B(37, -91) + ' ' + W(-50, 70) + ' ' + W(0, 20) + '"/>';
  }

  /* the AED: 170 x 118 local px, the screen (a rhythm, "Shock advised", "Shock given") and the shock button */
  function aed(p, x, y, s){
    return '<g class="' + p + 'aed" transform="translate(' + x.toFixed(1) + ' ' + y.toFixed(1) + ') scale(' + s.toFixed(3) + ')">' +
      '<rect class="' + p + 'aed-b" x="0" y="0" width="170" height="118" rx="16"/><rect class="' + p + 'aed-s" x="10" y="10" width="150" height="64" rx="6"/>' +
      '<path class="' + p + 'vf" transform="translate(0 64) scale(1 .62) translate(0 -54)" d="M22 54q6 -16 10 0t10 0t9 -2t11 4t9 -14t10 12t10 -6t9 10t10 -12t9 4t9 -6t9 6t9 -8"/>' +
      '<text class="' + p + 'aed-t" x="85" y="32" text-anchor="middle">Shock advised</text><text class="' + p + 'aed-t2" x="85" y="48" text-anchor="middle">Shock given</text>' +
      '<circle class="' + p + 'aed-btn" cx="85" cy="96" r="14"/><path class="' + p + 'aed-bolt" d="M82 88l-5 9h6l-3 8l9 -11h-6l3 -6z"/></g>';
  }

  /* cloth gradients: 'name:#dark:#light' -> <linearGradient id="<p>g-name"> dark, light, dark across */
  function grads(p, list, o){
    o = o || {};
    return list.map(function(g){
      var c = g.split(':');
      return '<linearGradient id="' + p + 'g-' + c[0] + '" x1="' + (o.x1 != null ? o.x1 : 0) + '" x2="' + (o.x2 != null ? o.x2 : 1) + '"' + (o.x1 != null ? ' y1="0" y2="0" gradientUnits="userSpaceOnUse"' : '') + '><stop offset="0" stop-color="' + c[1] + '"/><stop offset=".5" stop-color="' + c[2] + '"/><stop offset="1" stop-color="' + c[1] + '"/></linearGradient>';
    }).join('');
  }

  /* the keep-out list (one list for every tool): his face and, of what is on him now, these */
  var KEEP_PARTS = ['glove', 'sleeve', 'pad', 'tq-b', 'jet-e', 'wound-r', 'mask'];
  function DRAWN(p, on){ return '.' + p + 'face, ' + KEEP_PARTS.map(function(k){ return on + ' .' + p + k; }).join(', '); }
  function drawnBoxes(root, sel, P){
    var out = [], cm = root.getCTM();
    if(!cm) return out;
    var inv = cm.inverse();
    root.querySelectorAll(sel).forEach(function(e){
      var bb, m; try{ bb = e.getBBox(); m = inv.multiply(e.getCTM()); }catch(err){ return; }
      if(!bb.width && !bb.height) return;
      var xs = [], ys = [];
      [[bb.x, bb.y], [bb.x + bb.width, bb.y], [bb.x, bb.y + bb.height], [bb.x + bb.width, bb.y + bb.height]].forEach(function(c){
        var r = new DOMPoint(c[0], c[1]).matrixTransform(m), s2 = P(r.x, r.y); xs.push(s2[0]); ys.push(s2[1]); });
      out.push({ l: Math.min.apply(0, xs), r: Math.max.apply(0, xs), t: Math.min.apply(0, ys), b: Math.max.apply(0, ys) });
    });
    return out;
  }
  /* a word's place: o.bounds { x, y, w, h }, o.taken [], o.keep box | null, o.drawn [] (stage px) */
  var DIRS = [[0, -1], [0, 1], [1, -1], [-1, -1], [1, 1], [-1, 1], [1, 0], [-1, 0]];
  function place(pt, w, h, o){
    var sc = o.bounds, best = null, keep = o.keep, taken = o.taken || [], drawn = o.drawn || [];
    (o.dists || [26, 44, 64, 88, 120, 160]).some(function(d){
      return (o.dirs || DIRS).some(function(dd){
        var cx = pt[0] + dd[0] * (d + w / 2), cy = pt[1] + dd[1] * (d * 0.8 + h / 2);
        var b = { l: cx - w / 2, t: cy - h / 2, r: cx + w / 2, b: cy + h / 2 };
        if(b.l < sc.x + 6 || b.r > sc.x + sc.w - 6 || b.t < sc.y + 6 || b.b > sc.y + sc.h - 6) return false;
        if(taken.some(function(t){ return !(b.r + 5 < t.l || b.l > t.r + 5 || b.b + 5 < t.t || b.t > t.b + 5); })) return false;
        if(keep && !(b.r + 4 < keep.l || b.l > keep.r + 4 || b.b + 4 < keep.t || b.t > keep.b + 4)) return false;
        if(drawn.some(function(k){ return !(b.r + 3 < k.l || b.l > k.r + 3 || b.b + 3 < k.t || b.t > k.b + 3); })) return false;
        best = b; return true;
      });
    });
    return best;
  }

  window.NremtPatientDraw = { shapes: shapes, glove: glove, cpr: cpr, face: face, bvm: bvm, pads: pads, aed: aed, grads: grads, tp: tp,
    DRAWN: DRAWN, drawnBoxes: drawnBoxes, place: place, FACE: FACE, KEEP_PARTS: KEEP_PARTS };
})();
