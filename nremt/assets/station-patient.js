/* The patient for a station run: every action you tick happens on the body.

   station-run.js runs a psychomotor station against the clock; this draws the
   patient it is run on. Each illustrated station is a script: the actions in
   the order the National Registry's sheet lists them (paraphrased, never its
   points), and for each one what changes on the patient. A tick puts gauze on
   the wound or a mask on the face; a step left out, or done out of order,
   stays visible on the patient at the end (the wound still bleeding, bare
   hands in the blood, vomit in the airway that was ventilated through).

   THE HONESTY RULES ARE station-run.js's (read its header): no points, no
   pass or fail, and the program's own sheet is the authority. Anything that
   is contested or differs between programs is in a station's `notes`, shown
   with the patient, not stated on the body as fact.

   THE FIGURE is the body map's own: the BodyParts3D model rendered flat by
   scripts/build-body-figures.mjs (body-figs/adult-front.webp), loaded through
   LevlBodyFigs. A patient lying on their back seen from above is that same
   front view, so every overlay below is placed in that image's pixels (480 x
   1200, about 0.68 px per mm: 2 to 3 inches is 35 to 52 px). Equipment is
   drawn here in SVG, over the figure and clipped to its outline where it
   wraps a limb.

     var p = NremtStationPatient.mount(el, def, { onPlace(stepIndex), live })
     p.set(done)        done: { stepId: order (1, 2, ...) } for ticked steps
     p.current(i)       the step the student is on (moves the camera)
     p.tick(sec)        the run clock, once a second
     p.review()         the end: the camera pulls back, misses are marked
     p.misses()         [{ x, y, text, sev: 'bad'|'warn', key }]
     NremtStationPatient.find(stationName) -> def | null
     NremtStationPatient.pure  the rules, for scripts/test/nremt-station-patient.test.mjs */
(function(){
  'use strict';
  if(window.NremtStationPatient) return;
  var NS = 'http://www.w3.org/2000/svg';
  var FIG = 'adult-front';

  function el(tag, attrs, parent){
    var n = document.createElementNS(NS, tag);
    if(attrs) for(var k in attrs) n.setAttribute(k, attrs[k]);
    if(parent) parent.appendChild(n);
    return n;
  }
  function esc(s){ return String(s == null ? '' : s).replace(/[&<>"]/g, function(c){ return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c]; }); }
  function reduced(){
    if(window.LevlMotion && window.LevlMotion.reduced) return window.LevlMotion.reduced();
    return !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  }
  function clock(sec){ sec = Math.max(0, Math.round(sec)); return Math.floor(sec / 60) + ':' + (sec % 60 < 10 ? '0' : '') + sec % 60; }
  function has(done, id){ return !!(done && done[id]); }
  // a before b, both done
  function before(done, a, b){ return has(done, a) && has(done, b) && done[a] < done[b]; }
  // the first step that touched the patient came before BSI was ticked
  function touchedBare(def, done){
    return def.steps.some(function(s){ return s.touch && has(done, s.id) && (!has(done, 'bsi') || done[s.id] < done.bsi); });
  }

  /* ---- landmarks, in adult-front pixels ----------------------------------
     Measured off the figure (the leg's edges at each height, the head's
     outline) and its landmark data; the patient's right is the viewer's left. */
  var L = {
    wound: [186, 792],            // laceration, anterior right mid-thigh
    thighTop: 690,                // where the right thigh separates from the groin
    kneeTop: 848, kneeBottom: 900,// the knee joint (patella) on the right leg
    mouth: [240, 124], chin: [240, 150], forehead: [240, 46],
    carotid: [224, 176], shoulderR: [146, 214], shoulderL: [334, 214],
    stomach: [268, 372], sternum: [240, 280]
  };
  var PX_PER_IN = 17.3;           // 0.68 px/mm

  /* ---- the rules (pure; tested) ------------------------------------------ */

  /* Where a tap on the patient put the tourniquet. Current EMS teaching for a
     limb tourniquet: on the limb, proximal to the wound, 2 to 3 inches above
     it, never over a joint; "high and tight" on the limb is also taught (TCCC,
     and when the wound's exact site is unclear). Below the wound or over it
     does not stop the bleeding. */
  function placeTourniquet(x, y){
    var w = L.wound;
    if(x > 239 || x < 90 || y < 600) return { ok:false, stops:false, kind:'limb', y:y,
      msg:'That is not the bleeding limb. The tourniquet goes on the injured thigh, above the wound.' };
    if(y < L.thighTop) return { ok:false, stops:false, kind:'groin', y:y,
      msg:'Too high: that is the groin, where a limb tourniquet cannot sit. On the thigh, above the wound.' };
    if(y >= L.kneeTop - 6 && y <= L.kneeBottom) return { ok:false, stops:false, kind:'joint', y:y,
      msg:'Over the knee: a tourniquet on a joint will not compress the artery. Move it onto the thigh, above the wound.' };
    if(y > w[1] + 14) return { ok:false, stops:false, kind:'distal', y:y,
      msg:'Below the wound: blood still reaches the wound from above, so it keeps bleeding. A tourniquet goes proximal to the wound.' };
    if(y > w[1] - 22) return { ok:false, stops:false, kind:'over', y:y,
      msg:'On the wound itself: it will not occlude reliably and it hides the wound. Place it 2 to 3 inches above.' };
    var gapIn = (w[1] - y) / PX_PER_IN;
    if(gapIn <= 3.6) return { ok:true, stops:true, kind:'ideal', y:y,
      msg:'2 to 3 inches above the wound, not over a joint: the placement most programs teach.' };
    return { ok:true, stops:true, kind:'high', y:y,
      msg:'High on the thigh, well above the wound. "High and tight" also stops the bleed and is taught by some programs; many sheets expect 2 to 3 inches above the wound.' };
  }

  /* One squeeze of the bag. A patient with a pulse who is not breathing gets a
     breath every 5 to 6 seconds (10 to 12 a minute), each over about a second,
     just enough to make the chest rise. A tap on a phone is not that precise, so
     a gap counts as on rate from 4.6 to 6.6 seconds (a tolerance, said so in the
     feedback). How long the button is held is a stand-in for the squeeze, not a
     measure of volume: the examiner judges volume by watching the chest. */
  var RATE_LO = 4.6, RATE_HI = 6.6;
  function breath(interval, holdSec){
    var out = { rate:'first', vol:'ok', gastric:0 };
    if(holdSec < 0.35) out.vol = 'short';
    else if(holdSec > 1.8) out.vol = 'long';
    if(interval != null){
      if(interval < RATE_LO) out.rate = 'fast';
      else if(interval > RATE_HI) out.rate = 'slow';
      else out.rate = 'ok';
    }
    if(out.rate === 'fast') out.gastric += interval < 3 ? 0.3 : 0.18;
    if(out.vol === 'long') out.gastric += 0.22;
    return out;
  }
  /* The rate over the whole run, from the gaps between squeezes: what the sheet
     judges (10 to 12 a minute), rather than any one gap. */
  function rateOf(b){
    if(!b || !b.gaps || !b.gaps.length) return null;
    var avg = b.gaps.reduce(function(a, x){ return a + x; }, 0) / b.gaps.length;
    return { avg:avg, perMin:60 / avg, n:b.gaps.length };
  }

  /* ---- art ---------------------------------------------------------------- */

  /* A hand seen from above, palm down, fingers toward -y in its own frame.
     Gloved in nitrile when BSI was taken; bare otherwise (a miss you can see). */
  function hand(parent, o){
    var g = el('g', { class:'sp-hand', transform:'translate(' + o.x + ' ' + o.y + ') rotate(' + (o.rot || 0) + ') scale(' + (o.s || 1) + ')', filter:'url(#' + o.uid + 'Drop)' }, parent);
    var inner = el('g', { transform: o.flip ? 'scale(-1 1)' : '' }, g);
    var gl = o.gloved !== false, fill = 'url(#' + o.uid + (gl ? 'Glove' : 'Skin') + ')';
    var edge = gl ? '#3c4aa0' : '#a8735a', crease = gl ? 'rgba(25,30,90,.35)' : 'rgba(120,70,50,.35)';
    // fingers: [x at the knuckle, length, width], index to little finger
    var fing = o.fingers || [[-13, 36, 10.5], [-3.5, 41, 11], [6.5, 38, 10.5], [15, 29, 9]];
    fing.forEach(function(f){
      var x = f[0], L = f[1], w = f[2] / 2, t = w * 0.82, y0 = -12;
      el('path', { d:'M' + (x - w) + ' ' + y0 + ' L' + (x - t) + ' ' + (y0 - L + t) + ' Q' + x + ' ' + (y0 - L - t * 0.6) + ' ' + (x + t) + ' ' + (y0 - L + t) + ' L' + (x + w) + ' ' + y0 + ' Z',
        fill:fill, stroke:edge, 'stroke-width':0.8, 'stroke-linejoin':'round' }, inner);
      [0.42, 0.72].forEach(function(k){ el('path', { d:'M' + (x - t * 0.8) + ' ' + (y0 - L * k) + ' q' + (t * 0.8) + ' 1.6 ' + (t * 1.6) + ' 0', stroke:crease, 'stroke-width':0.9, fill:'none' }, inner); });
    });
    // the palm (back of the hand), wider at the knuckles
    el('path', { d:'M-19.5 -12 Q-20 -18 -12 -17.5 L19 -16 Q22 -14 21 -8 L18.5 12 Q16 26 2 27 L-6 27 Q-18 26 -20 12 Z', fill:fill, stroke:edge, 'stroke-width':0.9 }, inner);
    el('path', { d:'M-17 -13 Q-4 -18 18 -13', stroke:crease, 'stroke-width':1.1, fill:'none', 'stroke-linecap':'round' }, inner);
    el('path', { d:'M-8 18 Q2 6 0 -10 M6 18 Q8 4 6 -10', stroke:gl ? 'rgba(255,255,255,.18)' : 'rgba(255,255,255,.22)', 'stroke-width':3, fill:'none', 'stroke-linecap':'round' }, inner);
    if(o.thumb !== false){
      var tr = o.thumbRot == null ? -50 : o.thumbRot;
      el('path', { d:'M-6 0 L-5.4 -24 Q0 -33 5.4 -24 L6 0 Z', fill:fill, stroke:edge, 'stroke-width':0.8, transform:'translate(-18 12) rotate(' + tr + ')' }, inner);
    }
    // a glove's cuff at the wrist
    if(gl) el('path', { d:'M-18 26 Q2 31 17 25 L16 34 Q1 39 -17 34 Z', fill:'#5868c4', stroke:edge, 'stroke-width':0.8 }, inner);
    return g;
  }

  /* The E-C clamp, from the head end, the rescuer's left hand (the patient's
     left, the viewer's right): thumb and index make a C pressing the mask down
     over the bridge of the nose and the chin; middle, ring and little fingers
     make the E along the jaw, lifting it into the mask. Drawn finger by finger,
     because no stock hand pose shows it. */
  function ecGrip(parent, uid, gloved){
    var g = el('g', { class:'sp-ec', filter:'url(#' + uid + 'Drop)' }, parent);
    var fill = gloved === false ? '#e2ae8c' : '#6b7dd6', edge = gloved === false ? '#a8735a' : '#3c4aa0';
    var limb = function(d, w){
      el('path', { d:d, stroke:edge, 'stroke-width':w + 1.8, fill:'none', 'stroke-linecap':'round', 'stroke-linejoin':'round' }, g);
      el('path', { d:d, stroke:fill, 'stroke-width':w, fill:'none', 'stroke-linecap':'round', 'stroke-linejoin':'round' }, g);
    };
    // the back of the hand, beside the head
    el('path', { d:'M286 40 Q312 44 316 76 Q318 104 300 116 Q284 118 278 100 Q270 70 286 40 Z', fill:fill, stroke:edge, 'stroke-width':1 }, g);
    // E: three fingers along the right side of the jaw to the angle of the mandible
    limb('M298 112 Q296 136 280 154', 9);
    limb('M304 106 Q306 134 290 160', 8.5);
    limb('M308 98 Q314 128 300 160', 7.5);
    // C: the index down the mask's side, the thumb across its top over the nose
    limb('M288 70 Q280 92 270 120', 9);
    limb('M286 54 Q266 66 246 78', 10);
    if(gloved !== false) el('path', { d:'M286 40 Q300 34 314 46', stroke:'#5868c4', 'stroke-width':8, fill:'none', 'stroke-linecap':'round' }, g);
  }

  function defs(svg, uid, f){
    var d = el('defs', {}, svg);
    var c = el('clipPath', { id:uid + 'Body' }, d); el('path', { d:f.outline }, c);
    var gr = el('clipPath', { id:uid + 'Grown' }, d); el('path', { d:f.hitOutline }, gr);
    var dr = el('linearGradient', { id:uid + 'Drape', x1:'0', y1:'0', x2:'1', y2:'0' }, d);
    [[0, '#0d1a24', 0.45], [0.18, '#0d1a24', 0.05], [0.38, '#ffffff', 0.12], [0.5, '#0d1a24', 0.12], [0.62, '#ffffff', 0.12], [0.82, '#0d1a24', 0.05], [1, '#0d1a24', 0.45]]
      .forEach(function(s){ el('stop', { offset:s[0], 'stop-color':s[1], 'stop-opacity':s[2] }, dr); });
    // the right leg only (the viewer's left of the midline), clipped to the body
    var rl = el('clipPath', { id:uid + 'RLeg' }, d); el('rect', { x:60, y:640, width:179, height:560 }, rl);
    var lin = function(id, stops, x2, y2){
      var g = el('linearGradient', { id:uid + id, x1:'0', y1:'0', x2:x2 == null ? '1' : x2, y2:y2 == null ? '0' : y2 }, d);
      stops.forEach(function(s){ el('stop', { offset:s[0], 'stop-color':s[1], 'stop-opacity':s[2] == null ? 1 : s[2] }, g); });
      return g;
    };
    var rad = function(id, stops, cx, cy, r){
      var g = el('radialGradient', { id:uid + id, cx:cx || '50%', cy:cy || '50%', r:r || '50%' }, d);
      stops.forEach(function(s){ el('stop', { offset:s[0], 'stop-color':s[1], 'stop-opacity':s[2] == null ? 1 : s[2] }, g); });
      return g;
    };
    lin('Glove', [[0, '#8C9BEA'], [0.55, '#6B7DD6'], [1, '#4A5BB8']]);
    lin('Skin', [[0, '#F3CDB0'], [0.6, '#E2AE8C'], [1, '#C98F6E']]);
    // a strap seen wrapping a cylinder: dark at both edges of the limb, a sheen in the middle
    lin('Strap', [[0, '#151a1d'], [0.18, '#2f373b'], [0.42, '#4b555a'], [0.6, '#323a3e'], [1, '#121618']]);
    lin('Rod', [[0, '#5d666b'], [0.5, '#1f2427'], [1, '#0d1012']], 0, 1);
    rad('Wound', [[0, '#3a0508'], [0.55, '#6e0d12'], [0.85, '#9c1c1f'], [1, '#c35a4f', 0]]);
    rad('Pool', [[0, '#7a0c10'], [0.7, '#8f1316'], [1, '#a5221f']], '42%', '40%', '60%');
    rad('Stain', [[0, '#9e1a1c', 0.95], [0.6, '#b2302b', 0.7], [1, '#c9473c', 0]]);
    rad('Mask', [[0, '#eaf6f2', 0.38], [0.75, '#cde8df', 0.5], [1, '#8fbfb0', 0.75]]);
    rad('Reservoir', [[0, '#e4f4ef', 0.55], [0.7, '#bfe2d6', 0.7], [1, '#7fb4a3', 0.85]], '40%', '35%');
    lin('Bag', [[0, '#c7d1d6'], [0.35, '#eef2f4'], [0.7, '#cfd8dc'], [1, '#98a5ac']]);
    rad('Swell', [[0, '#fff7ef', 0.95], [0.55, '#fff2e6', 0.55], [1, '#fff2e6', 0]]);
    rad('Stomach', [[0, '#e9a28f', 0.0], [0.6, '#d97b67', 0.35], [1, '#b8513f', 0.75]]);
    rad('Vomit', [[0, '#d8c768'], [0.6, '#b49a3a'], [1, '#7f6a22']], '40%', '35%');
    lin('Blanket', [[0, '#5d7f9c'], [0.5, '#6a8dab'], [1, '#56778f']], 0, 1);
    lin('Distal', [[0, '#d9cfd6', 0.42], [0.3, '#cfcdd8', 0.26], [1, '#c7cdd8', 0.3]], 0, 1);
    lin('Cyl', [[0, '#1d5f3a'], [0.5, '#3f9a66'], [1, '#174d2f']]);
    // fabric: a fine weave for gauze, a coarse one for the blanket
    var gz = el('pattern', { id:uid + 'Gauze', width:4, height:4, patternUnits:'userSpaceOnUse' }, d);
    el('rect', { width:4, height:4, fill:'#fbfbf8' }, gz);
    el('path', { d:'M0 2H4M2 0V4', stroke:'#dcdcd4', 'stroke-width':0.7 }, gz);
    var bk = el('pattern', { id:uid + 'Weave', width:10, height:10, patternUnits:'userSpaceOnUse', patternTransform:'rotate(8)' }, d);
    el('rect', { width:10, height:10, fill:'url(#' + uid + 'Blanket)' }, bk);
    el('path', { d:'M0 5H10M5 0V10', stroke:'#3c5870', 'stroke-width':0.9, opacity:0.35 }, bk);
    // ragged edges for spilled blood and vomit
    var rag = el('filter', { id:uid + 'Rag', x:'-20%', y:'-20%', width:'140%', height:'140%' }, d);
    el('feTurbulence', { type:'fractalNoise', baseFrequency:'0.045', numOctaves:'2', seed:'4', result:'t' }, rag);
    el('feDisplacementMap', { in:'SourceGraphic', in2:'t', scale:'14', xChannelSelector:'R', yChannelSelector:'G' }, rag);
    var soft = el('filter', { id:uid + 'Soft', x:'-30%', y:'-30%', width:'160%', height:'160%' }, d);
    el('feGaussianBlur', { stdDeviation:'3' }, soft);
    var ar = el('marker', { id:uid + 'Arr', viewBox:'0 0 10 10', refX:'6', refY:'5', markerWidth:'5', markerHeight:'5', orient:'auto-start-reverse' }, d);
    el('path', { d:'M0 0L10 5L0 10Z', fill:'#0f5c50' }, ar);
    var shadow = el('filter', { id:uid + 'Drop', x:'-30%', y:'-30%', width:'160%', height:'160%' }, d);
    el('feDropShadow', { dx:'1.5', dy:'3', stdDeviation:'2.5', 'flood-color':'#1b130f', 'flood-opacity':'0.35' }, shadow);
    // pallor: the figure desaturated and cooled, faded in over the skin
    var pale = el('filter', { id:uid + 'Pale', 'color-interpolation-filters':'sRGB' }, d);
    el('feColorMatrix', { type:'matrix', values:'0.33 0.42 0.1 0 0.12  0.33 0.45 0.1 0 0.13  0.33 0.42 0.16 0 0.16  0 0 0 1 0' }, pale);
    return d;
  }

  /* ---- bleeding control / shock management (sheet E213) -------------------- */

  var BLEEDING = {
    key:'bleeding', match:/bleeding/i,
    intro:'Adult, lying on their back, a deep laceration on the front of the right thigh, above the knee, bleeding steadily. Tick each action as you say it; it happens on the patient.',
    full:[-10, -10, 500, 1220],
    steps:[
      { id:'bsi', text:'Take or verbalize BSI / PPE precautions', critical:true, focus:'full',
        did:'Gloves on, eye protection verbalized.',
        why:'First thing on the sheet and on its critical list. Say it before you touch the patient.' },
      { id:'pressure', touch:true, text:'Apply direct pressure to the wound', critical:true, focus:'thigh',
        did:'Firm direct pressure with gauze, right on the wound.', cue:'The wound continues to bleed.',
        why:'The sheet expects direct pressure first in this scenario. The examiner then tells you it is still bleeding.' },
      { id:'tq', touch:true, text:'Apply a tourniquet above the wound', critical:true, focus:'thigh', place:true,
        did:'Tourniquet 2 to 3 inches above the wound, tightened until the bleeding stops; time noted.', cue:'The patient is showing signs of hypoperfusion.',
        why:'Proximal to the wound, not over a joint, tight enough that the bleeding stops. Note the time.' },
      { id:'position', touch:true, text:'Position the patient properly (supine)', critical:false, focus:'full',
        did:'Supine and flat; keep them still.' },
      { id:'o2', touch:true, text:'Give high-concentration oxygen (non-rebreather, 15 L/min)', critical:true, focus:'face',
        did:'Non-rebreather at 15 L/min, reservoir filled first.' },
      { id:'warm', touch:true, text:'Prevent heat loss (cover the patient)', critical:false, focus:'full',
        did:'Covered with a blanket, the tourniquet left in sight.' },
      { id:'transport', text:'Indicate the need for immediate transportation', critical:true, focus:'full',
        did:'Immediate transport called: a shock patient goes now.' }
    ],
    focus:{ full:[30, 130, 420, 1010], thigh:[60, 610, 280, 320], face:[110, -20, 260, 300] },
    notes:[
      '<b>Tourniquet first?</b> Current field practice (the Stop the Bleed program, TCCC and many protocols) puts a tourniquet on a <em>life-threatening</em> limb bleed straight away. This sheet scores a scripted scenario: direct pressure, then the examiner says it is still bleeding, then the tourniquet. Do it the sheet&rsquo;s way in the station.',
      '<b>Where it goes.</b> Most programs teach 2 to 3 inches above the wound and never over a joint; some teach &ldquo;high and tight&rdquo; on the limb. Tighten until the bleeding stops and the distal pulse is gone, and do not loosen it once on.',
      '<b>Positioning.</b> The sheet says &ldquo;properly positions&rdquo;. Supine is the common answer; raising the legs is no longer routinely recommended in trauma, and programs differ.',
      '<b>Oxygen.</b> Many current guidelines titrate oxygen to saturation, but this sheet lists high-concentration oxygen as a critical criterion for the shock patient.',
      'Wording and order vary between program sheets, so practice with the one you will be tested on.'
    ],

    build:function(P){
      var s = P.svg, u = P.uid, w = L.wound;
      // under the figure: the pool on the floor beside the thigh
      // the pool spreads from under the outer thigh onto the floor
      var pool = el('g', { class:'sp-pool', transform:'translate(132 836)' }, P.under);
      P.poolG = el('g', {}, pool);
      el('path', { d:'M-62 0 C-66 -34 -26 -60 10 -52 C36 -46 52 -20 48 10 C44 40 4 60 -28 52 C-50 46 -60 24 -62 0 Z', fill:'url(#' + u + 'Pool)', filter:'url(#' + u + 'Rag)', transform:'scale(1 1.25)' }, P.poolG);
      el('ellipse', { cx:-16, cy:-18, rx:16, ry:6, fill:'#fff', opacity:0.22, transform:'rotate(-18 -16 -18)' }, P.poolG);

      var o = P.over;
      // the wound and the blood running off the thigh
      P.bleed = el('g', { class:'sp-bleed' }, o);
      var runs = ['M190 798 C176 806 156 812 138 820', 'M182 800 C170 816 154 828 138 840', 'M194 802 C182 822 166 840 146 856'];
      runs.forEach(function(dd){ el('path', { d:dd, stroke:'#a52a24', 'stroke-width':6.5, 'stroke-linecap':'round', fill:'none', opacity:0.55 }, P.bleed); });
      runs.forEach(function(dd, i){ el('path', { d:dd, class:'sp-run sp-run' + i }, P.bleed); });
      var wg = el('g', { transform:'translate(' + w[0] + ' ' + w[1] + ') rotate(-24) scale(1.25)' }, o);
      el('path', { d:'M-20 0 Q-6 -8 0 -7 Q10 -7 20 0 Q8 8 0 7 Q-10 8 -20 0 Z', fill:'#b54a40', opacity:0.55, transform:'scale(1.35 1.7)' }, wg);
      el('path', { d:'M-19 0 Q-6 -6 0 -5.5 Q10 -6 19 0 Q8 6.5 0 6 Q-10 6.5 -19 0 Z', fill:'url(#' + u + 'Wound)' }, wg);
      P.gleam = el('ellipse', { cx:-3, cy:-1.5, rx:7, ry:1.6, fill:'#ffd9d0', opacity:0.5, class:'sp-gleam' }, wg);

      // the kneecap, faintly, so "over the knee" can be seen
      var knee = el('g', { opacity:0.55, 'clip-path':'url(#' + u + 'Body)' }, o);
      el('ellipse', { cx:180, cy:874, rx:15, ry:18, fill:'#f6d6c0', filter:'url(#' + u + 'Soft)' }, knee);
      el('path', { d:'M166 884 Q180 896 194 884', stroke:'#b77d62', 'stroke-width':1.6, fill:'none', opacity:0.7 }, knee);
      // pallor: the whole figure, then the limb below the tourniquet
      P.pale = el('image', { href:P.url, width:P.f.w, height:P.f.h, filter:'url(#' + u + 'Pale)', opacity:0, class:'sp-fade', 'aria-hidden':'true' }, P.skinLayer);
      P.distal = el('g', { 'clip-path':'url(#' + u + 'RLeg)', opacity:0, class:'sp-fade' }, o);
      P.distalRect = el('rect', { x:60, y:760, width:179, height:440, fill:'url(#' + u + 'Distal)', 'clip-path':'url(#' + u + 'Body)' }, P.distal);

      // gauze, the stain soaking through, and the hand holding it
      P.gauze = el('g', { class:'sp-item', transform:'translate(' + w[0] + ' ' + w[1] + ') rotate(-12)' }, o);
      el('rect', { x:-24, y:-22, width:48, height:44, rx:3, fill:'url(#' + u + 'Gauze)', filter:'url(#' + u + 'Drop)' }, P.gauze);
      P.stain = el('ellipse', { cx:2, cy:2, rx:20, ry:17, fill:'url(#' + u + 'Stain)', class:'sp-stain', opacity:0 }, P.gauze);
      el('rect', { x:-24, y:-22, width:48, height:44, rx:3, fill:'none', stroke:'#cfcfc6', 'stroke-width':1 }, P.gauze);
      P.pressHand = el('g', { class:'sp-item sp-press' }, o);

      // the tourniquet: a strap round the thigh, the windlass, the time tag
      P.tq = el('g', { class:'sp-item' }, o);
      P.tqBand = el('g', { 'clip-path':'url(#' + u + 'Body)' }, P.tq);
      P.tqStrap = el('g', { 'clip-path':'url(#' + u + 'RLeg)' }, P.tqBand);
      P.tqRod = el('g', {}, P.tq);

      // oxygen: a non-rebreather on the face
      P.nrb = el('g', { class:'sp-item' }, o);
      nrb(P.nrb, u);

      // the blanket, folded back off the injured thigh so the tourniquet stays in sight
      P.blanket = el('g', { class:'sp-item sp-blanket', filter:'url(#' + u + 'Drop)' }, o);
      var bc = el('clipPath', { id:u + 'BlArea' }, P.defs);
      el('path', { d:'M40 262 Q240 236 440 262 L440 1200 L246 1200 L246 704 Q200 672 150 690 Q100 700 40 690 Z' }, bc);
      var bl = el('g', { 'clip-path':'url(#' + u + 'BlArea)' }, P.blanket);
      // the cloth follows the body: its own outline, grown by a thick round stroke, so it drapes over the limbs
      var cm = el('mask', { id:u + 'Cloth', maskUnits:'userSpaceOnUse', x:-100, y:-100, width:700, height:1400 }, P.defs);
      el('path', { d:P.f.outline, fill:'#fff', stroke:'#fff', 'stroke-width':30, 'stroke-linejoin':'round' }, cm);
      var inner = el('g', { mask:'url(#' + u + 'Cloth)' }, bl);
      el('rect', { x:0, y:200, width:480, height:1000, fill:'url(#' + u + 'Weave)' }, inner);
      // drape: shade toward the body's edges and between the legs, light along each limb's ridge
      el('path', { d:P.f.outline, fill:'none', stroke:'#0d1a24', 'stroke-width':30, opacity:0.32, 'stroke-linejoin':'round', filter:'url(#' + u + 'Soft)' }, inner);
      el('path', { d:'M240 640 L240 1200', stroke:'#0d1a24', 'stroke-width':14, opacity:0.3, filter:'url(#' + u + 'Soft)' }, inner);
      el('path', { d:'M300 320 Q292 500 304 660 M372 300 Q384 440 380 620 M296 760 Q290 940 292 1120', stroke:'#ffffff', 'stroke-width':10, fill:'none', opacity:0.12, filter:'url(#' + u + 'Soft)' }, inner);
      // the hem at the chest and the turned-back edge over the right hip
      var hem = el('g', { mask:'url(#' + u + 'Cloth)' }, P.blanket);
      el('path', { d:'M30 263 Q240 237 450 263', stroke:'#b6cbdc', 'stroke-width':10, fill:'none' }, hem);
      el('path', { d:'M246 1200 L246 704 Q200 672 150 690 Q100 700 30 690', stroke:'#9db7cc', 'stroke-width':8, fill:'none' }, hem);
    },

    update:function(P, st){
      var d = st.done, s = P.state;
      var tq = has(d, 'tq') ? st.tq : null;
      s.controlled = !!(tq && tq.stops);
      s.bleeding = !s.controlled;
      P.show(P.gauze, has(d, 'pressure'));
      P.show(P.pressHand, has(d, 'pressure') && !has(d, 'tq'));
      if(has(d, 'pressure')){
        P.pressHand.innerHTML = '';
        hand(P.pressHand, { uid:P.uid, x:L.wound[0] - 8, y:L.wound[1] + 4, rot:72, s:0.82, gloved:before(d, 'bsi', 'pressure') });
      }
      P.show(P.tq, !!tq);
      if(tq){
        var y = tq.y;
        P.tqStrap.innerHTML = ''; P.tqRod.innerHTML = '';
        el('rect', { x:60, y:y - 13, width:179, height:26, fill:'url(#' + P.uid + 'Strap)' }, P.tqStrap);
        el('path', { d:'M60 ' + (y - 12) + ' Q150 ' + (y - 7) + ' 239 ' + (y - 12), stroke:'#6b767b', 'stroke-width':1.2, fill:'none' }, P.tqStrap);
        el('path', { d:'M60 ' + (y + 12) + ' Q150 ' + (y + 17) + ' 239 ' + (y + 12), stroke:'#0b0e10', 'stroke-width':1.5, fill:'none' }, P.tqStrap);
        el('rect', { x:60, y:y - 3, width:179, height:6, fill:'#c9342a', opacity:0.85 }, P.tqStrap);
        var cx = 178;
        el('rect', { x:cx - 34, y:y - 5, width:68, height:10, rx:5, fill:'url(#' + P.uid + 'Rod)', filter:'url(#' + P.uid + 'Drop)', transform:'rotate(-14 ' + cx + ' ' + y + ')' }, P.tqRod);
        el('rect', { x:cx - 11, y:y - 15, width:22, height:30, rx:5, fill:'#22282b', stroke:'#4d575c', 'stroke-width':1.2 }, P.tqRod);
        var tag = el('g', { transform:'translate(' + (cx + 22) + ' ' + (y - 34) + ') rotate(-6)' }, P.tqRod);
        el('rect', { x:0, y:0, width:44, height:20, rx:3, fill:'#fffdf4', stroke:'#b9b39a', 'stroke-width':1, filter:'url(#' + P.uid + 'Drop)' }, tag);
        el('text', { x:22, y:14, 'text-anchor':'middle', class:'sp-tag' }, tag).textContent = 'TQ ' + clock(st.tqAt || 0);
        if(!tq.stops) el('circle', { cx:cx, cy:y, r:26, class:'sp-wrongring' }, P.tqRod);
      }
      P.show(P.nrb, has(d, 'o2'));
      P.show(P.blanket, has(d, 'warm'));
      P.show(P.bleed, s.bleeding);
      P.distal.setAttribute('opacity', s.controlled ? 1 : 0);
      if(tq && tq.stops) P.distalRect.setAttribute('y', tq.y + 13);
      this.flow(P, st);
    },

    // the parts that move with the clock: the pool, the stain, the pallor
    flow:function(P, st){
      var s = P.state;
      var k = Math.min(1.15, 0.5 + (st.bleedSec || 0) / 90);
      P.poolG.setAttribute('transform', 'scale(' + k.toFixed(3) + ')');
      var soak = has(st.done, 'pressure') ? Math.min(1, 0.35 + (st.soakSec || 0) / 40) : 0;
      P.stain.setAttribute('opacity', soak.toFixed(2));
      P.stain.setAttribute('transform', 'scale(' + (0.6 + 0.4 * soak).toFixed(2) + ')');
      // the examiner reports hypoperfusion once the tourniquet is on; uncontrolled bleeding gets there by itself
      var pallor = Math.min(0.62, (st.bleedSec || 0) / 160 + (has(st.done, 'tq') ? 0.3 : 0));
      P.pale.setAttribute('opacity', pallor.toFixed(2));
      s.pallor = pallor;
    },

    // bleeding: real seconds while uncontrolled; slower under direct pressure
    clock:function(P, st, dt){
      if(!P.state.bleeding) return;
      st.bleedSec = (st.bleedSec || 0) + dt * (has(st.done, 'pressure') ? 0.45 : 1);
      if(has(st.done, 'pressure')) st.soakSec = (st.soakSec || 0) + dt;
    },

    chips:function(st){
      var d = st.done, out = [];
      if(has(d, 'bsi')) out.push({ t:'Gloves on', k:'ok' });
      if(has(d, 'tq')) out.push(st.tq && !st.tq.stops ? { t:'Tourniquet misplaced', k:'bad' } : { t:'TQ on at ' + clock(st.tqAt || 0), k:'ok' });
      else if(has(d, 'pressure')) out.push({ t:'Still bleeding', k:'bad' });
      if(has(d, 'position')) out.push({ t:'Supine', k:'ok' });
      if(has(d, 'o2')) out.push({ t:'O₂ 15 L/min', k:'ok' });
      if(has(d, 'warm')) out.push({ t:'Covered', k:'ok' });
      if(has(d, 'transport')) out.push({ t:'Transport now', k:'go' });
      return out;
    },

    misses:function(st){
      var d = st.done, m = [], w = L.wound;
      var stopped = has(d, 'tq') && (!st.tq || st.tq.stops);
      if(!has(d, 'bsi')) m.push({ key:'bsi', x:w[0] - 40, y:w[1] - 40, sev:'bad', text:'No gloves: BSI was never taken or voiced, so these hands are bare (a critical criterion).' });
      else if(touchedBare(BLEEDING, d)) m.push({ key:'bsi', x:w[0] - 40, y:w[1] - 40, sev:'bad', text:'BSI came after you had touched the patient: the first contact was bare-handed.' });
      if(!stopped){
        var why = has(d, 'tq') ? 'the tourniquet is not where it can stop it (' + st.tq.kind + ')'
          : has(d, 'pressure') ? 'direct pressure alone did not stop it and no tourniquet followed'
          : 'no pressure and no tourniquet';
        m.push({ key:'bleed', x:w[0], y:w[1], sev:'bad', text:'Still bleeding: ' + why + '. Failing to control the hemorrhage in time is a critical criterion.' });
      }
      if(has(d, 'tq') && !has(d, 'pressure')) m.push({ key:'order', x:w[0] + 40, y:w[1] - 70, sev:'warn', text:'Tourniquet with no direct pressure first. Right for a life-threatening bleed in the field; this sheet scores pressure first (see the notes).' });
      else if(before(d, 'tq', 'pressure')) m.push({ key:'order', x:w[0] + 40, y:w[1] - 70, sev:'warn', text:'Tourniquet before direct pressure: the sheet scores pressure first in this scenario (see the notes).' });
      if(!has(d, 'o2')) m.push({ key:'o2', x:L.mouth[0], y:L.mouth[1], sev:'bad', text:'No oxygen on the face: high-concentration oxygen is a critical criterion here.' });
      var shockFirst = ['position', 'o2', 'warm'].filter(function(k){ return has(d, k) && (!stopped || d[k] < d.tq); });
      if(shockFirst.length && stopped) m.push({ key:'abc', x:300, y:520, sev:'warn', text:'Shock care before the bleeding was controlled: the life threat comes first.' });
      if(!has(d, 'warm')) m.push({ key:'warm', x:330, y:600, sev:'warn', text:'Not covered: losing heat makes shock worse.' });
      if(!has(d, 'position')) m.push({ key:'position', x:300, y:930, sev:'warn', text:'Positioning never voiced.' });
      if(!has(d, 'transport')) m.push({ key:'transport', x:240, y:1090, sev:'bad', text:'Immediate transport never called: a critical criterion for this patient.' });
      return m;
    }
  };

  function nrb(g, u){
    // the reservoir under the chin, the mask over nose and mouth, the strap, the tubing
    el('path', { d:'M240 152 C300 154 312 196 300 232 C290 262 190 262 180 232 C168 196 180 154 240 152 Z', fill:'url(#' + u + 'Reservoir)', stroke:'#6fa592', 'stroke-width':1.2, class:'sp-res' }, g);
    el('path', { d:'M300 246 C330 256 360 250 400 234 C430 222 470 226 520 240', stroke:'#7fbfa9', 'stroke-width':4, fill:'none', 'stroke-linecap':'round', opacity:0.9 }, g);
    el('path', { d:'M199 100 Q240 96 281 100', stroke:'#2f6b5a', 'stroke-width':2.2, fill:'none', opacity:0.75 }, g);
    el('path', { d:'M240 84 C262 86 274 112 270 132 C267 146 254 152 240 152 C226 152 213 146 210 132 C206 112 218 86 240 84 Z', fill:'url(#' + u + 'Mask)', stroke:'#4f8c7a', 'stroke-width':1.6 }, g);
    el('circle', { cx:229, cy:128, r:3.2, fill:'#dfeee9', stroke:'#4f8c7a', 'stroke-width':1 }, g);
    el('circle', { cx:251, cy:128, r:3.2, fill:'#dfeee9', stroke:'#4f8c7a', 'stroke-width':1 }, g);
    el('path', { d:'M233 92 Q240 89 247 92', stroke:'#9aa7a3', 'stroke-width':2.4, fill:'none', 'stroke-linecap':'round' }, g);
  }

  /* ---- BVM ventilation of an apneic adult (sheet E203) ------------------------ */

  var BVM = {
    key:'bvm', match:/bvm|ventilation/i,
    intro:'Adult, lying on their back, unresponsive. You are kneeling at the head. Tick each action as you say it; it happens on the patient.',
    full:[60, -250, 360, 760],
    steps:[
      { id:'bsi', text:'Take or verbalize BSI / PPE precautions', critical:true, focus:'face',
        did:'Gloves on, eye protection verbalized.', why:'First on the sheet and on its critical list.' },
      { id:'resp', touch:true, text:'Check responsiveness', critical:true, focus:'upper',
        did:'Shoulders tapped, shouted: no response.' },
      { id:'help', text:'Request additional EMS assistance', critical:false, focus:'upper',
        did:'Additional help requested.' },
      { id:'check', touch:true, text:'Check breathing and pulse together, no more than 10 seconds', critical:true, focus:'neck',
        did:'Carotid pulse and chest watched together, under 10 seconds.', cue:'Unresponsive, not breathing, weak carotid pulse of 60.' },
      { id:'open', touch:true, text:'Open the airway (head-tilt, chin-lift)', critical:false, focus:'mouth',
        did:'Head tilted, chin lifted.', cue:'The mouth is full of secretions and vomitus.' },
      { id:'prep', text:'Prepare rigid suction and turn it on', critical:false, focus:'mouth',
        did:'Rigid (Yankauer) catheter on, suction running.' },
      { id:'suction', touch:true, text:'Suction the mouth and oropharynx (in without suction, suction on the way out)', critical:true, focus:'mouth',
        did:'Suctioned on the way out, no more than about 15 seconds.', cue:'The mouth and oropharynx are clear.' },
      { id:'open2', touch:true, text:'Open the airway manually again', critical:false, focus:'mouth',
        did:'Head tilted and chin lifted again, ready for the adjunct.' },
      { id:'opa', touch:true, text:'Insert an oropharyngeal airway', critical:false, focus:'mouth',
        did:'OPA sized (corner of the mouth to the earlobe) and inserted; flange on the lips.', cue:'No gag reflex; the patient accepts the adjunct.' },
      { id:'vent1', touch:true, text:'Ventilate immediately with the BVM (room air is fine at first)', critical:true, focus:'bvm',
        did:'Mask sealed (E-C grip), first breath within 30 seconds of suctioning.', cue:'Ventilation is being performed without difficulty.' },
      { id:'recheck', touch:true, text:'Recheck the pulse (no more than 10 seconds)', critical:false, focus:'neck',
        did:'Pulse rechecked: still present.' },
      { id:'oxy', touch:true, text:'Attach the reservoir and oxygen at 15 L/min', critical:true, focus:'bvm',
        did:'Reservoir on, oxygen at 15 L/min.' },
      { id:'vent2', touch:true, text:'Ventilate: chest rise, one breath every 5 to 6 seconds', critical:true, focus:'bvmchest', squeeze:true,
        did:'One breath every 5 to 6 seconds, each just enough to make the chest rise.', cue:'How would you know the volume is adequate? (Watch for chest rise.)' }
    ],
    focus:{ full:[60, -40, 360, 560], upper:[70, -40, 340, 470], neck:[140, 40, 200, 230], mouth:[160, 30, 160, 170], face:[120, -20, 240, 280], bvm:[100, -250, 280, 470], bvmchest:[40, -260, 400, 800] },
    notes:[
      '<b>Suction time.</b> The sheet fails &ldquo;excessive and prolonged&rdquo; suctioning without naming a number; no more than about 15 seconds in an adult is what most programs teach.',
      '<b>Room air first.</b> The sheet allows the first breaths before oxygen is connected, as long as ventilation starts within 30 seconds of suctioning; some programs have you connect oxygen before the first breath.',
      '<b>Rate.</b> A patient with a pulse who is not breathing gets one breath every 5 to 6 seconds (10 to 12 a minute) on this sheet; current AHA guidance says about one every 6 seconds. Each breath over about a second, just enough to see the chest rise.',
      '<b>Opening the airway.</b> Head-tilt, chin-lift unless a spinal injury is suspected; then a jaw thrust.',
      'Wording and order vary between program sheets, so practice with the one you will be tested on.'
    ],

    build:function(P){
      var o = P.over, u = P.uid;
      // a face, lightly: closed lids, the nose's shadow, lips (the figure is a faceless mannequin)
      var face = el('g', { opacity:0.8 }, o);
      el('path', { d:'M216 80 Q224 84 232 80 M248 80 Q256 84 264 80', stroke:'#a8705a', 'stroke-width':1.6, fill:'none', 'stroke-linecap':'round' }, face);
      el('path', { d:'M240 86 Q236 100 234 106 Q240 110 246 106', stroke:'#c08a70', 'stroke-width':1.6, fill:'none', 'stroke-linecap':'round' }, face);
      el('ellipse', { cx:240, cy:105, rx:8, ry:3.5, fill:'#b98068', opacity:0.35, filter:'url(#' + u + 'Soft)' }, face);
      el('path', { d:'M229 123 Q240 119 251 123 Q240 128 229 123 Z', fill:'#c7826e', opacity:0.75 }, face);
      // the chest rising: the upper trunk lit from inside on each breath
      // the chest rising: a soft swell of light over the upper chest, both sides together
      P.rise = el('g', { opacity:0, class:'sp-rise', 'clip-path':'url(#' + u + 'Body)' }, o);
      el('ellipse', { cx:240, cy:290, rx:92, ry:70, fill:'url(#' + u + 'Swell)' }, P.rise);
      P.stomach = el('g', { opacity:0, class:'sp-fade' }, o);
      el('ellipse', { cx:L.stomach[0], cy:L.stomach[1], rx:40, ry:30, fill:'url(#' + u + 'Stomach)', transform:'rotate(-18 ' + L.stomach.join(' ') + ')' }, P.stomach);
      el('ellipse', { cx:L.stomach[0], cy:L.stomach[1], rx:40, ry:30, fill:'none', stroke:'#a33d2d', 'stroke-width':1.6, 'stroke-dasharray':'4 3', transform:'rotate(-18 ' + L.stomach.join(' ') + ')' }, P.stomach);

      // the mouth: lips, teeth, tongue; what is in it; the OPA flange
      P.mouthG = el('g', { class:'sp-item' }, o);
      el('ellipse', { cx:240, cy:124, rx:15, ry:9.5, fill:'#b56b5c' }, P.mouthG);
      el('ellipse', { cx:240, cy:124.5, rx:12, ry:7, fill:'#3d1416' }, P.mouthG);
      el('path', { d:'M229.5 119.5 Q240 116.5 250.5 119.5 L250 121.5 Q240 119 230 121.5 Z', fill:'#f4efe4' }, P.mouthG);
      el('ellipse', { cx:240, cy:128.5, rx:8, ry:3.2, fill:'#c4646a' }, P.mouthG);
      P.vomit = el('g', { class:'sp-fade' }, P.mouthG);
      el('path', { d:'M228 121 C232 117 248 117 252 122 C255 127 250 132 241 132 C232 133 225 128 228 121 Z M249 129 C254 131 257 136 253 139 C250 141 247 136 249 129 Z', fill:'url(#' + u + 'Vomit)', filter:'url(#' + u + 'Rag)' }, P.vomit);
      el('ellipse', { cx:236, cy:121.5, rx:4, ry:1.2, fill:'#fff', opacity:0.5 }, P.vomit);
      P.opa = el('g', { class:'sp-item' }, P.mouthG);
      el('rect', { x:226, y:121, width:28, height:7, rx:2.5, fill:'#f2f0e8', stroke:'#9a968a', 'stroke-width':0.9 }, P.opa);
      el('rect', { x:235, y:121.8, width:10, height:5.4, rx:1.5, fill:'#2f8f6a' }, P.opa);

      // hands for the checks, the head tilt, the suction catheter
      P.tapHands = el('g', { class:'sp-item sp-shake' }, o);
      P.pulseG = el('g', { class:'sp-item' }, o);
      el('circle', { cx:L.carotid[0], cy:L.carotid[1], r:9, class:'sp-pulse' }, P.pulseG);
      el('circle', { cx:L.carotid[0], cy:L.carotid[1], r:9, class:'sp-pulse sp-pulse2' }, P.pulseG);
      P.pulseHand = el('g', {}, P.pulseG);
      P.tiltHands = el('g', { class:'sp-item' }, o);
      P.yank = el('g', { class:'sp-item', filter:'url(#' + u + 'Drop)' }, o);
      P.yankIn = el('g', {}, P.yank);
      // tubing off to the suction unit, then the handle and the curved rigid tip
      el('path', { d:'M318 30 C340 6 380 -4 430 -24 C460 -36 500 -30 540 -46', stroke:'#b9d3dc', 'stroke-width':6, fill:'none', 'stroke-linecap':'round', opacity:0.9 }, P.yankIn);
      el('path', { d:'M318 30 C340 6 380 -4 430 -24', stroke:'#fff', 'stroke-width':1.5, fill:'none', opacity:0.6 }, P.yankIn);
      el('path', { d:'M304 52 L322 26', stroke:'#d7e8ee', 'stroke-width':11, 'stroke-linecap':'round' }, P.yankIn);
      el('path', { d:'M304 52 L322 26', stroke:'#9fc0cb', 'stroke-width':11, 'stroke-linecap':'round', fill:'none', opacity:0.35, 'stroke-dasharray':'1.5 3.5' }, P.yankIn);
      el('circle', { cx:316, cy:35, r:2.6, fill:'#6f8f99' }, P.yankIn);
      P.yankRod = el('path', { d:'M304 52 C292 74 274 96 258 112 Q250 119 245 123', stroke:'#eef6f8', 'stroke-width':6, fill:'none', 'stroke-linecap':'round' }, P.yankIn);
      el('path', { d:'M304 52 C292 74 274 96 258 112 Q250 119 245 123', stroke:'#8fb0ba', 'stroke-width':6, fill:'none', 'stroke-linecap':'round', opacity:0.25, 'stroke-dasharray':'0.1 2.4' }, P.yankIn);
      el('path', { d:'M300 56 C288 78 272 98 256 113', stroke:'#fff', 'stroke-width':1.6, fill:'none', opacity:0.8 }, P.yankIn);
      el('circle', { cx:244, cy:124, r:4.6, fill:'#e6f1f4', stroke:'#8fb0ba', 'stroke-width':1 }, P.yankIn);
      // the hand on the handle, thumb over the port
      P.yankHand = el('g', {}, P.yankIn);

      // the BVM: mask on the face, the bag up past the head toward you, the reservoir
      P.bvm = el('g', { class:'sp-item' }, o);
      P.o2line = el('path', { d:'M240 -228 C250 -250 300 -250 340 -236 C380 -222 420 -232 470 -250', stroke:'#7fbfa9', 'stroke-width':4, fill:'none', 'stroke-linecap':'round' }, P.bvm);
      P.reservoir = el('g', { class:'sp-res2' }, P.bvm);
      el('path', { d:'M240 -150 C278 -152 286 -186 276 -210 C268 -228 212 -228 204 -210 C194 -186 202 -152 240 -150 Z', fill:'url(#' + u + 'Reservoir)', stroke:'#6fa592', 'stroke-width':1.2 }, P.reservoir);
      P.bag = el('g', { class:'sp-bag' }, P.bvm);
      el('path', { d:'M240 -146 C278 -142 286 -96 282 -46 C279 -6 262 30 240 34 C218 30 201 -6 198 -46 C194 -96 202 -142 240 -146 Z', fill:'url(#' + u + 'Bag)', stroke:'#7d8a91', 'stroke-width':1.4 }, P.bag);
      el('path', { d:'M220 -120 C214 -80 214 -20 224 14', stroke:'#fff', 'stroke-width':3, opacity:0.55, fill:'none', 'stroke-linecap':'round' }, P.bag);
      el('rect', { x:231, y:30, width:18, height:26, rx:4, fill:'#5b6970' }, P.bvm);
      el('rect', { x:232, y:-160, width:16, height:16, rx:3, fill:'#5b6970' }, P.bvm);
      P.bvmMask = el('path', { d:'M240 74 C262 76 278 108 276 132 C274 152 258 160 240 160 C222 160 206 152 204 132 C202 108 218 76 240 74 Z', fill:'url(#' + u + 'Mask)', stroke:'#3e7464', 'stroke-width':2.4 }, P.bvm);
      el('circle', { cx:240, cy:112, r:11, fill:'#5b6970', stroke:'#3c474c', 'stroke-width':1.2 }, P.bvm);
      el('rect', { x:235, y:52, width:10, height:58, rx:3, fill:'#6b7a81' }, P.bvm);
      P.bvmHands = el('g', {}, P.bvm);
      // help on the way: a radio by the shoulder, with signal arcs (stays once called)
      P.radio = el('g', { class:'sp-item', filter:'url(#' + u + 'Drop)' }, o);
      el('rect', { x:372, y:236, width:26, height:44, rx:5, fill:'#2c3438', stroke:'#151a1d', 'stroke-width':1.2 }, P.radio);
      el('rect', { x:377, y:244, width:16, height:11, rx:2, fill:'#9fd3c0' }, P.radio);
      el('rect', { x:390, y:220, width:4, height:18, rx:2, fill:'#2c3438' }, P.radio);
      el('path', { d:'M402 226 q8 8 0 16 M408 220 q14 14 0 28', stroke:'#0f5c50', 'stroke-width':2.4, fill:'none', 'stroke-linecap':'round' }, P.radio);
      // the suction unit, set up and running beside the head (stays once prepared)
      P.unit = el('g', { class:'sp-item', filter:'url(#' + u + 'Drop)' }, o);
      el('rect', { x:300, y:-24, width:58, height:44, rx:8, fill:'#e9eef0', stroke:'#8fa0a7', 'stroke-width':1.4 }, P.unit);
      el('circle', { cx:319, cy:-2, r:10, fill:'#fff', stroke:'#6f8f99', 'stroke-width':1.4 }, P.unit);
      el('path', { d:'M319 -2 l6 -6', stroke:'#0f5c50', 'stroke-width':2, 'stroke-linecap':'round' }, P.unit);
      el('circle', { cx:345, cy:8, r:4, fill:'#3cb371' }, P.unit);
      // the pulse rechecked after ventilation started: a small check by the neck that stays
      P.rechk = el('g', { class:'sp-item' }, o);
      el('circle', { cx:L.carotid[0] - 34, cy:L.carotid[1] + 4, r:12, fill:'#0f5c50' }, P.rechk);
      el('path', { d:'M' + (L.carotid[0] - 40) + ' ' + (L.carotid[1] + 4) + ' l4 4 l8 -8', stroke:'#fff', 'stroke-width':2.6, fill:'none', 'stroke-linecap':'round', 'stroke-linejoin':'round' }, P.rechk);
    },

    update:function(P, st){
      var d = st.done, gl = function(id){ return before(d, 'bsi', id); };
      var bvmOn = has(d, 'vent1') || has(d, 'vent2');
      P.show(P.mouthG, has(d, 'open') && !bvmOn);
      P.vomit.setAttribute('opacity', has(d, 'suction') ? 0 : 1);
      P.show(P.opa, has(d, 'opa'));
      // the transient actions are shown while they are the current step, and briefly after a tick
      var cur = P.curId;
      P.tapHands.innerHTML = '';
      if(has(d, 'resp') && P.showing('resp')){
        hand(P.tapHands, { uid:P.uid, x:L.shoulderR[0] + 8, y:L.shoulderR[1] - 6, rot:150, s:0.85, gloved:gl('resp') });
        hand(P.tapHands, { uid:P.uid, x:L.shoulderL[0] - 8, y:L.shoulderL[1] - 6, rot:-150, s:0.85, gloved:gl('resp'), flip:true });
      }
      P.show(P.tapHands, has(d, 'resp') && P.showing('resp'));
      var pulsing = (has(d, 'check') && P.showing('check')) || (has(d, 'recheck') && P.showing('recheck'));
      if(pulsing) cur = P.showing('check') ? 'check' : 'recheck';
      P.show(P.pulseG, pulsing);
      P.pulseHand.innerHTML = '';
      // two fingers in the groove beside the windpipe
      if(pulsing) hand(P.pulseHand, { uid:P.uid, x:L.carotid[0] - 42, y:L.carotid[1] + 20, rot:70, s:0.62, gloved:gl(cur), fingers:[[-13, 44, 10.5], [-3.5, 48, 11], [6.5, 18, 10.5], [15, 14, 9]], thumbRot:-20 });
      var tilt = has(d, 'open') && !bvmOn && !(has(d, 'opa') && !P.showing('opa'));
      P.tiltHands.innerHTML = '';
      if(tilt){
        // the palm on the forehead pressing the head back; two fingertips under the bony point of the chin
        hand(P.tiltHands, { uid:P.uid, x:270, y:44, rot:-90, s:0.7, gloved:gl('open') });
        hand(P.tiltHands, { uid:P.uid, x:276, y:180, rot:-52, s:0.6, gloved:gl('open'), fingers:[[-13, 44, 10.5], [-3.5, 46, 11], [6.5, 16, 10.5], [15, 13, 9]], thumbRot:-10 });
        // the tilt itself: the forehead goes back, the chin comes up
        el('path', { d:'M212 26 Q196 40 200 60', class:'sp-arrow', 'marker-end':'url(#' + P.uid + 'Arr)' }, P.tiltHands);
        el('path', { d:'M216 168 Q226 154 236 156', class:'sp-arrow', 'marker-end':'url(#' + P.uid + 'Arr)' }, P.tiltHands);
      }
      P.show(P.tiltHands, tilt);
      // the catheter: ready beside the head once prepared, in the mouth while suctioning
      var yShow = has(d, 'prep') && !bvmOn && (cur === 'prep' || cur === 'suction');
      P.yankIn.setAttribute('transform', has(d, 'suction') || cur !== 'suction' ? 'translate(70 -28)' : '');
      P.yankHand.innerHTML = '';
      if(yShow) hand(P.yankHand, { uid:P.uid, x:322, y:46, rot:-148, s:0.6, gloved:gl('prep') });
      P.show(P.yank, yShow);
      P.show(P.bvm, bvmOn);
      P.show(P.reservoir, has(d, 'oxy'));
      P.show(P.o2line, has(d, 'oxy'));
      P.bvmHands.innerHTML = '';
      if(bvmOn){
        // E-C on the mask (the left hand, from the head end) and the right hand on the bag
        var g2 = gl('vent1') || gl('vent2');
        ecGrip(P.bvmHands, P.uid, g2);
        hand(P.bvmHands, { uid:P.uid, x:282, y:-60, rot:-96, s:0.84, gloved:g2 });
      }
      P.stomach.setAttribute('opacity', Math.min(1, st.gastric || 0).toFixed(2));
      P.show(P.radio, has(d, 'help'));
      P.show(P.unit, has(d, 'prep'));
      P.show(P.rechk, has(d, 'recheck') && !P.showing('recheck'));
      P.breathing = bvmOn;
    },

    // the bag squeezed: the chest rises once (auto-breaths keep the patient ventilated between taps)
    breathe:function(P, size){
      var r = P.rise, b = P.bag;
      if(!r) return;
      r.style.setProperty('--rise', size == null ? 0.42 : size);
      r.classList.remove('go'); b.classList.remove('go');
      void r.getBoundingClientRect();
      r.classList.add('go'); b.classList.add('go');
    },

    chips:function(st){
      var d = st.done, out = [];
      if(has(d, 'bsi')) out.push({ t:'Gloves on', k:'ok' });
      if(has(d, 'help')) out.push({ t:'Help called', k:'ok' });
      if(has(d, 'check')) out.push({ t:'Apneic, pulse 60', k:'bad' });
      if(has(d, 'open') && !has(d, 'suction')) out.push({ t:'Vomit in airway', k:'bad' });
      if(has(d, 'suction')) out.push({ t:'Airway clear', k:'ok' });
      if(has(d, 'opa')) out.push({ t:'OPA in', k:'ok' });
      if(has(d, 'oxy')) out.push({ t:'O₂ 15 L/min', k:'ok' });
      else if(has(d, 'vent1')) out.push({ t:'Room air', k:'warn' });
      return out;
    },

    misses:function(st){
      var d = st.done, m = [], b = st.breaths || {};
      var vent = has(d, 'vent1') ? 'vent1' : has(d, 'vent2') ? 'vent2' : null;
      if(!has(d, 'bsi')) m.push({ key:'bsi', x:200, y:-10, sev:'bad', text:'No gloves: BSI was never taken or voiced, so these hands are bare (a critical criterion).' });
      else if(touchedBare(BVM, d)) m.push({ key:'bsi', x:200, y:-10, sev:'bad', text:'BSI came after you had touched the patient.' });
      if(!has(d, 'resp') || !has(d, 'check')) m.push({ key:'check', x:L.carotid[0] - 20, y:L.carotid[1], sev:'bad', text:'Responsiveness, then breathing and pulse together (10 seconds at most), never ' + (has(d, 'resp') ? 'finished' : 'done') + ': a critical criterion.' });
      else if(before(d, 'check', 'resp')) m.push({ key:'check', x:L.carotid[0] - 20, y:L.carotid[1], sev:'warn', text:'Breathing and pulse checked before responsiveness: the sheet has responsiveness first.' });
      if(vent && (!has(d, 'suction') || d.suction > d[vent])) m.push({ key:'suction', x:L.mouth[0] + 30, y:L.mouth[1], sev:'bad', text:'Ventilated through vomit: suction comes before the first breath, or it goes into the lungs (a critical criterion).' });
      else if(!has(d, 'suction')) m.push({ key:'suction', x:L.mouth[0] + 30, y:L.mouth[1], sev:'bad', text:'The airway was never suctioned: a critical criterion.' });
      if(!vent) m.push({ key:'vent', x:300, y:300, sev:'bad', text:'The patient was never ventilated.' });
      if(!has(d, 'oxy')) m.push({ key:'oxy', x:240, y:-190, sev:'bad', text:'No oxygen and no reservoir: room air is about 21%. High-concentration oxygen is a critical criterion.' });
      var dt = vent && has(d, 'suction') && d.suction < d[vent] && st.at ? (st.at[vent] || 0) - (st.at.suction || 0) : null;
      if(dt != null && dt > 30) m.push({ key:'t30', x:L.mouth[0], y:L.mouth[1] - 36, sev:'bad', text:'By your ticks, the first breath came ' + Math.round(dt) + ' s after suctioning: ventilation must start within 30 seconds of suctioning (a critical criterion).' });
      if(!has(d, 'help')) m.push({ key:'help', x:330, y:420, sev:'warn', text:'Additional EMS help was never requested.' });
      if(!has(d, 'open')) m.push({ key:'open', x:L.forehead[0] + 30, y:L.forehead[1], sev:'warn', text:'The airway was never opened manually before suctioning.' });
      if(!has(d, 'prep')) m.push({ key:'prep', x:330, y:60, sev:'warn', text:'Suction was never prepared (rigid catheter, power on).' });
      if(has(d, 'suction') && has(d, 'opa') && !has(d, 'open2')) m.push({ key:'open2', x:L.forehead[0] - 30, y:L.forehead[1] + 10, sev:'warn', text:'The airway was not reopened manually before the OPA.' });
      if(!has(d, 'recheck')) m.push({ key:'recheck', x:L.carotid[0] + 50, y:L.carotid[1] + 10, sev:'warn', text:'The pulse was never rechecked after the first ventilations.' });
      if(!has(d, 'opa')) m.push({ key:'opa', x:L.mouth[0] - 34, y:L.mouth[1] + 10, sev:'warn', text:'No oral airway: the tongue can fall back and block the breaths.' });
      else if(vent && d.opa > d[vent]) m.push({ key:'opa', x:L.mouth[0] - 34, y:L.mouth[1] + 10, sev:'warn', text:'The OPA went in after ventilation had started.' });
      if(vent && !has(d, 'vent2')) m.push({ key:'vent2', x:L.sternum[0] + 40, y:L.sternum[1] + 20, sev:'bad', text:'Ventilation at the right rate and volume (one breath every 5 to 6 seconds, chest rise) was never shown: two critical criteria rest on it.' });
      var rt = rateOf(b);
      if(rt && rt.n >= 3){
        var pm = Math.round(rt.perMin);
        // judged over the run, as the sheet judges it over the minute, with the tapping tolerance
        if(rt.avg < RATE_LO) m.push({ key:'rate', x:L.stomach[0], y:L.stomach[1], sev:'bad', text:'Your squeezes averaged about ' + pm + ' a minute: faster than 10 to 12. Air goes into the stomach (gastric distension) and raises the risk of vomiting; rate is a critical criterion.' });
        else if(rt.avg > RATE_HI) m.push({ key:'rate', x:L.sternum[0], y:L.sternum[1], sev:'bad', text:'Your squeezes averaged about ' + pm + ' a minute: slower than 10 to 12 (rate is a critical criterion).' });
        else if(b.fast || b.slow) m.push({ key:'rate', x:L.stomach[0], y:L.stomach[1], sev:'warn', text:'On rate overall (about ' + pm + ' a minute), but ' + (b.fast + b.slow) + ' gap' + (b.fast + b.slow === 1 ? ' was' : 's were') + ' outside one every 5 to 6 seconds: keep it even.' });
      } else if(b.n && b.n < 4 && has(d, 'vent2')) m.push({ key:'rate', x:L.sternum[0], y:L.sternum[1], sev:'warn', text:'Only ' + b.n + ' squeeze' + (b.n === 1 ? '' : 's') + ': squeeze the bag for at least four breaths to see your rate.' });
      if(b.long) m.push({ key:'vol', x:L.stomach[0] + 20, y:L.stomach[1] + 40, sev:'warn', text:b.long + ' long squeeze' + (b.long === 1 ? '' : 's') + '. Holding the button is only a stand-in: in the room, squeeze over about a second and stop at chest rise; the examiner judges volume by watching.' });
      return m;
    }
  };

  var DEFS = [BLEEDING, BVM];

  /* ---- the patient ------------------------------------------------------- */

  function Patient(host, def, opts){
    var self = this;
    this.def = def; this.opts = opts || {}; this.host = host;
    this.uid = 'sp' + Math.floor(Math.random() * 1e6);
    this.state = {};
    this.st = { done:{}, at:{}, bleedSec:0, soakSec:0, gastric:0, breaths:{ n:0, fast:0, slow:0, long:0, short:0, gaps:[] } };
    this.cam = null; this.camTo = null;
    host.classList.add('sp');
    host.innerHTML =
      '<div class="sp-stage" data-station="' + def.key + '">' +
        '<svg class="sp-svg" role="img" aria-label="The patient"><title>The patient</title></svg>' +
        '<div class="sp-chips" aria-hidden="true"></div>' +
        '<div class="sp-place" hidden></div>' +

        '<div class="sp-loading">Loading the patient…</div>' +
      '</div>' +
      '<div class="sp-squeeze" hidden>' +
        '<button type="button" class="sp-sq-btn">Squeeze the bag</button>' +
        '<span class="sp-sq-out" aria-live="polite">Hold about a second, once every 5 to 6 seconds, and watch the chest rise.</span>' +
      '</div>' +
      '<div class="sp-cue" aria-live="polite"><span class="sp-cue-did">' + esc(def.intro) + '</span></div>' +
      '<ol class="sp-misses" hidden></ol>' +
      '<details class="sp-notes"><summary>What varies by program</summary><ul>' +
        def.notes.map(function(n){ return '<li>' + n + '</li>'; }).join('') + '</ul></details>' +
      '<p class="sp-credit">Patient figure rendered from <a href="https://lifesciencedb.jp/bp3d/" target="_blank" rel="noopener">BodyParts3D</a>, © 2008 Life Science Integrated Database Center, <a href="https://creativecommons.org/licenses/by-sa/2.1/jp/deed.en" target="_blank" rel="noopener">CC BY-SA 2.1 Japan</a>.</p>';
    this.svg = host.querySelector('.sp-svg');
    this.stage = host.querySelector('.sp-stage');
    this.cue = host.querySelector('.sp-cue');
    this.chips = host.querySelector('.sp-chips');
    this.placeBox = host.querySelector('.sp-place');
    this.sq = host.querySelector('.sp-squeeze');
    if(window.LevlBodyFigs) window.LevlBodyFigs.load('body', function(F){ if(F && F.figs[FIG]) self.draw(F); else self.fail(); });
    else this.fail();
  }

  Patient.prototype.fail = function(){
    var l = this.host.querySelector('.sp-loading');
    if(l) l.textContent = 'The patient picture could not load. The checklist works without it.';
  };

  Patient.prototype.draw = function(F){
    var self = this, f = F.figs[FIG], svg = this.svg;
    this.f = f; this.url = F.url(f);
    var l = this.host.querySelector('.sp-loading'); if(l) l.remove();
    this.defs = defs(svg, this.uid, f);
    el('rect', { x:-3000, y:-3000, width:6500, height:7500, class:'sp-floor' }, svg);
    el('path', { d:f.outline, fill:'#1d241f', opacity:0.22, transform:'translate(5 8)', filter:'url(#' + this.uid + 'Soft)' }, svg);
    this.under = el('g', {}, svg);
    this.skinLayer = el('g', {}, svg);
    // clipped to the traced outline, so the edge stays smooth when the camera is close
    this.skinLayer.setAttribute('clip-path', 'url(#' + this.uid + 'Body)');
    el('image', { href:this.url, width:f.w, height:f.h, 'aria-hidden':'true' }, this.skinLayer);
    this.over = el('g', {}, svg);
    this.marks = el('g', { class:'sp-marks' }, svg);
    this.def.build(this);
    svg.addEventListener('click', function(e){ self.tap(e); });
    if(window.ResizeObserver){ this.ro = new ResizeObserver(function(){ self.camera(true); }); this.ro.observe(this.stage); }
    this.ready = true;
    this.paint();
    this.camera(true);
  };

  Patient.prototype.show = function(node, on){
    if(!node) return;
    node.classList.toggle('on', !!on);
    node.setAttribute('aria-hidden', on ? 'false' : 'true');
  };

  // which step is current, by index into def.steps (null at the end)
  /* The step the student is on. Right after a tick the action stays in view a
     moment (the hand on the carotid, the tap on the shoulders) before the camera
     moves on to the next step. */
  Patient.prototype.current = function(i){
    var s = this.def.steps[i], self = this;
    this.cur = i; this.curId = s ? s.id : null;
    clearTimeout(this.camT);
    var wait = this.freshAt ? 1400 - (Date.now() - this.freshAt) : 0;
    if(wait > 0 && !reduced()){
      this.camT = setTimeout(function(){ self.lastId = null; self.paint(); self.camera(false); }, wait);
      this.paint();
      return;
    }
    this.lastId = null;
    this.paint();
    this.camera(false);
  };
  // the step whose action is on screen: the one just ticked, until the camera moves
  Patient.prototype.showing = function(id){ return this.curId === id || this.lastId === id; };

  Patient.prototype.set = function(done, info){
    var prev = this.st.done, fresh = null;
    for(var k in done) if(!prev[k]) fresh = k;
    this.st.done = done;
    if(fresh){ this.st.at[fresh] = this.st.t || 0; this.lastId = fresh; this.freshAt = Date.now(); }
    // a tourniquet ticked without a tap goes where most programs teach: 2.5 inches above the wound
    if(fresh === 'tq'){ if(!this.st.tq) this.st.tq = placeTourniquet(L.wound[0], L.wound[1] - 2.5 * PX_PER_IN); this.st.tqAt = this.st.t || 0; }
    if(!done.tq) this.st.tq = null;
    if(fresh) this.say(fresh);
    this.paint();
    if(fresh && this.def.breathe && (fresh === 'vent1' || fresh === 'vent2')) this.def.breathe(this);
  };

  Patient.prototype.say = function(id){
    var s = this.def.steps.filter(function(x){ return x.id === id; })[0];
    if(!s) return;
    var did = s.did, cue = s.cue;
    if(id === 'tq' && this.st.tq){ did = this.st.tq.msg; if(!this.st.tq.stops) cue = 'The wound is still bleeding.'; }
    this.cue.innerHTML = '<span class="sp-cue-did">' + esc(did) + '</span>' + (cue ? '<span class="sp-cue-ex"><b>Examiner:</b> ' + esc(cue) + '</span>' : '');
  };

  Patient.prototype.tick = function(sec){
    var dt = this.st.t == null ? 0 : Math.max(0, sec - this.st.t);
    this.st.t = sec;
    if(!this.ready) return;
    if(this.def.clock) this.def.clock(this, this.st, dt);
    if(this.def.flow) this.def.flow(this, this.st);
    // between the student's own squeezes, the patient is ventilated every 6 s, so the chest is seen to rise
    if(this.breathing && this.def.breathe && !this.reviewing && sec - (this.lastBreath || 0) >= 6 && sec - (this.lastTap || -99) > 8){
      this.lastBreath = sec; this.def.breathe(this);
    }
  };

  Patient.prototype.paint = function(){
    if(!this.ready) return;
    this.def.update(this, this.st);
    var chips = this.def.chips(this.st);
    this.chips.innerHTML = chips.map(function(c){ return '<span class="sp-chip sp-chip--' + c.k + '">' + esc(c.t) + '</span>'; }).join('');
    // placing the tourniquet by tapping the thigh
    var step = this.def.steps[this.cur];
    var placing = !this.reviewing && step && step.place && !this.st.done[step.id];
    var moving = !this.reviewing && step && step.place && this.st.done[step.id] && this.st.tq && !this.st.tq.stops;
    this.placeBox.hidden = !(placing || moving);
    this.stage.classList.toggle('is-placing', !!(placing || moving));
    if(placing) this.placeBox.innerHTML = '<b>Tap the thigh</b> where the tourniquet goes, or tick the step to place it for you.';
    else if(moving) this.placeBox.innerHTML = (this.st.tq.stops ? '' : '<b>Still bleeding.</b> ') + 'Tap the thigh again to move it.';
    // the bag, squeezed by hand
    var sq = !this.reviewing && step && step.squeeze;
    this.sq.hidden = !sq;
    if(sq && !this.sqWired){ this.sqWired = true; this.wireSqueeze(); }
    this.svg.setAttribute('aria-label', 'The patient. ' + chips.map(function(c){ return c.t; }).join(', ') + (this.state.bleeding ? '. The wound is bleeding.' : ''));
  };

  /* A step done wrong in a way the student should fix where they are (a
     tourniquet that does not stop the bleed): the stepper waits on it. */
  Patient.prototype.hold = function(i){
    var step = this.def.steps[i];
    return !!(step && step.place && this.st.done[step.id] && this.st.tq && !this.st.tq.stops);
  };

  Patient.prototype.tap = function(e){
    var cur = this.def.steps[this.cur], self = this;
    // the placing step, or once it is done, a tap anywhere on the patient moves what it placed
    var step = cur && cur.place ? cur : this.def.steps.filter(function(s){ return s.place && self.st.done[s.id]; })[0];
    if(this.reviewing || !step || !this.svg.getScreenCTM) return;
    var p = this.svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY;
    var q = p.matrixTransform(this.svg.getScreenCTM().inverse());
    this.st.tq = placeTourniquet(q.x, q.y);
    var idx = this.def.steps.indexOf(step);
    if(!this.st.done[step.id]){ if(this.opts.onPlace) this.opts.onPlace(idx); }
    else { this.st.tqAt = this.st.t || 0; this.say(step.id); this.paint(); if(this.opts.onMove) this.opts.onMove(idx); }
    if(window.LevlAnnounce) window.LevlAnnounce.say(this.st.tq.msg);
  };

  Patient.prototype.wireSqueeze = function(){
    var self = this, btn = this.sq.querySelector('.sp-sq-btn'), out = this.sq.querySelector('.sp-sq-out');
    var down = 0, last = null;
    function start(e){ if(e) e.preventDefault(); if(down) return; down = performance.now(); btn.classList.add('is-down'); self.bag && self.bag.classList.add('hold'); }
    function end(){
      if(!down) return;
      var now = performance.now(), hold = (now - down) / 1000, iv = last == null ? null : (down - last) / 1000;
      last = down; down = 0; btn.classList.remove('is-down'); self.bag && self.bag.classList.remove('hold');
      var r = breath(iv, hold), b = self.st.breaths;
      b.n++; if(r.rate === 'fast') b.fast++; if(r.rate === 'slow') b.slow++; if(r.vol === 'long') b.long++; if(r.vol === 'short') b.short++;
      // a gap longer than 15 s is a pause, not part of the rate
      if(iv != null && iv < 15) (b.gaps = b.gaps || []).push(iv);
      self.st.gastric = Math.min(1, (self.st.gastric || 0) + r.gastric);
      self.lastTap = self.st.t || 0;
      self.def.breathe(self, r.vol === 'short' ? 0.12 : r.vol === 'long' ? 0.62 : 0.42);
      var t = iv == null ? 'First breath.' : iv.toFixed(1) + ' s since the last one: ' + (r.rate === 'fast' ? 'faster than one every 5 s; air starts going to the stomach.' : r.rate === 'slow' ? 'slower than one every 6 s (under 10 a minute).' : 'about one every 5 to 6 s (allowing for tapping).');
      var rt = rateOf(b);
      if(rt && rt.n >= 3) t += ' Average so far: ' + Math.round(rt.perMin) + ' a minute.';
      t += r.vol === 'short' ? ' A very quick squeeze: in the room, squeeze over about a second and watch for chest rise.' : r.vol === 'long' ? ' A long squeeze: in the room that tends to mean too much volume; squeeze over about a second, just to chest rise.' : '';
      out.textContent = t;
      self.paint();
    }
    btn.addEventListener('pointerdown', start);
    btn.addEventListener('pointerup', end);
    btn.addEventListener('pointerleave', end);
    btn.addEventListener('pointercancel', end);
    btn.addEventListener('keydown', function(e){ if((e.key === ' ' || e.key === 'Enter') && !e.repeat) start(e); });
    btn.addEventListener('keyup', function(e){ if(e.key === ' ' || e.key === 'Enter') end(); });
    btn.addEventListener('click', function(e){ e.preventDefault(); });
  };

  /* The camera: the view box eases to the current step's region; the whole
     patient at the start and the end. Sized to the stage, so it is never
     letterboxed into a sliver on a phone. */
  Patient.prototype.target = function(){
    var self = this, step = this.lastId ? this.def.steps.filter(function(x){ return x.id === self.lastId; })[0] : this.def.steps[this.cur], key = this.reviewing ? 'full' : step ? step.focus : 'full';
    return (this.def.focus[key]) || this.def.full;
  };
  Patient.prototype.camera = function(now){
    if(!this.ready) return;
    var t = this.reviewing ? this.def.full : this.target(), sw = this.stage.clientWidth || 300, sh = this.stage.clientHeight || 400;
    // grow the box to the stage's aspect, about its center
    var ar = sw / sh, w = t[2], h = t[3];
    if(w / h < ar) w = h * ar; else h = w / ar;
    // never closer than the figure's pixels hold up (about 2x on a phone)
    var minW = Math.max(170, sw / 1.6);
    if(w < minW){ h *= minW / w; w = minW; }
    var box = [t[0] + t[2] / 2 - w / 2, t[1] + t[3] / 2 - h / 2, w, h];
    var self = this, from = this.cam || box;
    this.cam = box;
    this.scale = sw / w;
    if(now || reduced()){ this.svg.setAttribute('viewBox', box.join(' ')); this.marksPaint(); return; }
    var t0 = performance.now(), dur = 650;
    cancelAnimationFrame(this.raf);
    (function step(){
      var k = Math.min(1, (performance.now() - t0) / dur), e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
      self.svg.setAttribute('viewBox', from.map(function(v, i){ return (v + (box[i] - v) * e).toFixed(1); }).join(' '));
      if(k < 1) self.raf = requestAnimationFrame(step);
    })();
    this.marksPaint();
  };

  /* The end of the run: pull back to the whole patient and number what was
     missed, on the body and in a list under it. */
  Patient.prototype.review = function(){
    this.reviewing = true;
    this.cur = null; this.curId = null;
    this.stage.classList.add('is-review');
    this.paint();
    this.camera(true);
    var m = this.misses(), list = this.host.querySelector('.sp-misses');
    list.hidden = !m.length;
    list.innerHTML = m.map(function(x, i){ return '<li class="sp-miss sp-miss--' + x.sev + '"><span class="sp-n">' + (i + 1) + '</span><span>' + esc(x.text) + '</span></li>'; }).join('');
    this.cue.innerHTML = m.length
      ? '<span class="sp-cue-did"><b>What the patient still shows,</b> numbered on the body and listed below: red where a critical criterion is involved (missed, out of order, or technique), amber for the rest.</span>'
      : '<span class="sp-cue-did"><b>Nothing left showing on the patient.</b> Every action done, in the sheet&rsquo;s order.</span>';
    this.marksPaint();
    return m;
  };
  Patient.prototype.misses = function(){ return this.def.misses(this.st); };

  Patient.prototype.marksPaint = function(){
    var g = this.marks;
    if(!g) return;
    while(g.firstChild) g.removeChild(g.firstChild);
    if(!this.reviewing) return;
    var r = 13 / (this.scale || 0.4), fs = 15 / (this.scale || 0.4);
    // marks that would overlap are pushed apart sideways, so every number reads
    var placed = [];
    this.misses().forEach(function(x, i){
      var px = x.x, py = x.y, tries = 0;
      while(tries++ < 8 && placed.some(function(q){ return Math.hypot(q[0] - px, q[1] - py) < r * 2.3; })) px += (tries % 2 ? 1 : -1) * r * 2.4 * tries;
      placed.push([px, py]);
      var m = el('g', { class:'sp-mark sp-mark--' + x.sev, transform:'translate(' + px + ' ' + py + ')' }, g);
      el('circle', { r:r * 1.55, class:'sp-mark-halo' }, m);
      el('circle', { r:r, class:'sp-mark-dot' }, m);
      el('text', { 'text-anchor':'middle', dy:'0.35em', 'font-size':fs.toFixed(1), class:'sp-mark-n' }, m).textContent = i + 1;
    });
  };

  Patient.prototype.destroy = function(){ if(this.ro) this.ro.disconnect(); cancelAnimationFrame(this.raf); };

  window.NremtStationPatient = {
    find:function(name){ return DEFS.filter(function(d){ return d.match.test(name); })[0] || null; },
    mount:function(host, def, opts){ return new Patient(host, def, opts); },
    pure:{ placeTourniquet:placeTourniquet, breath:breath, rateOf:rateOf, DEFS:DEFS, L:L, PX_PER_IN:PX_PER_IN }
  };
})();
