/* The patient for a station run: every action you tick happens on the body.

   station-run.js runs a psychomotor station against the clock; this draws the
   patient it is run on. Each illustrated station is a script: the actions in
   the order the National Registry's sheet lists them (paraphrased, never its
   points), and for each one what changes on the patient. A tick puts gauze on
   the wound or a mask on the face; a step left out, or done out of order,
   stays visible on the patient at the end (the wound still bleeding, bare
   hands in the blood, vomit in the airway that was ventilated through).
   Since 2026-11 every station has its patient (the eight later ones are built
   by station(), below).

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
      // a flat puddle on the floor under the outer thigh (review 2026-11: a round blob beside the leg read as the wound)
      var pool = el('g', { class:'sp-pool', transform:'translate(150 872) scale(1.45 0.62)', opacity:0.82 }, P.under);
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

  /* ---- The other eight stations (review 2026-11) ------------------------------
     Before, only bleeding control and BVM had a patient; the other eight were a
     stopwatch and a list. Each now has its patient, built from one pattern:
     the sheet's actions in its order (paraphrased, never its points), a layer
     on the body for each action, and at the end what was missed or done out
     of order, marked where it shows. Critical actions left out are red;
     the rest amber. Coordinates are adult-front pixels (see L above; the
     patient's right is the viewer's left): right arm shoulder about (110,230),
     elbow (88,460), wrist (56,620); right knee (183,874), ankle (178,1120).

     station(spec) fills in update / chips / misses from:
       steps[i].at      where a miss for that step is marked
       steps[i].chip    the chip shown once it is ticked
       steps[i].miss    the words for a miss (default from the step)
       spec.order       [[a, b, text, sev]]: a must come before b
       spec.draw(P)     builds the layers: P.lay[stepId] is shown once ticked
       spec.paint(P,st) anything that depends on more than one step */
  function badge(parent, x, y, text, kind){
    var g = el('g', { class:'sp-badge sp-badge--' + (kind || 'ok'), transform:'translate(' + x + ' ' + y + ')' }, parent);
    var w = 12 + text.length * 6.9;
    el('rect', { x:-w / 2, y:-10, width:w, height:20, rx:10 }, g);
    el('text', { x:0, y:4, 'text-anchor':'middle' }, g).textContent = text;
    return g;
  }
  function band(parent, x, y, w, h, cls){ return el('rect', { x:x - w / 2, y:y - h / 2, width:w, height:h, rx:Math.min(w, h) * 0.3, class:cls || 'sp-strapx' }, parent); }
  function pulseAt(parent, x, y){
    var g = el('g', {}, parent);
    el('circle', { cx:x, cy:y, r:8, class:'sp-pulse' }, g);
    el('circle', { cx:x, cy:y, r:8, class:'sp-pulse sp-pulse2' }, g);
    el('circle', { cx:x, cy:y, r:4, fill:'#0f5c50' }, g);
    return g;
  }
  // a check of motor, sensation and circulation at a hand or foot: the pulse and a small tag
  function pms(parent, x, y, label, side){
    var g = el('g', {}, parent);
    pulseAt(g, x, y);
    badge(g, x + (side || 1) * 30, y + 30, label, 'ok');
    return g;
  }
  function bruise(parent, uid, x, y, rx, ry){
    el('ellipse', { cx:x, cy:y, rx:rx, ry:ry, fill:'#6d4a7a', opacity:0.42, filter:'url(#' + uid + 'Soft)' }, parent);
    el('ellipse', { cx:x, cy:y, rx:rx * 0.55, ry:ry * 0.55, fill:'#4f3560', opacity:0.35, filter:'url(#' + uid + 'Soft)' }, parent);
  }
  function station(spec){
    spec.build = function(P){
      P.lay = {};
      spec.steps.forEach(function(s){ P.lay[s.id] = el('g', { class:'sp-item' }, P.over); });
      spec.draw(P);
    };
    spec.update = function(P, st){
      var d = st.done, last = null, best = -1;
      for(var k in d) if(d[k] > best){ best = d[k]; last = k; }
      // a brief action (a tap, a check, a tag) shows while it is the latest tick
      spec.steps.forEach(function(s){ P.show(P.lay[s.id], has(d, s.id) && (!s.brief || (last === s.id && !P.reviewing))); });
      if(spec.paint) spec.paint(P, st);
    };
    spec.chips = function(st){
      var d = st.done, out = [];
      spec.steps.forEach(function(s){ if(s.chip && has(d, s.id)) out.push({ t:s.chip, k:s.go ? 'go' : 'ok' }); });
      return out;
    };
    spec.misses = function(st){
      var d = st.done, m = [], first = spec.steps.filter(function(s){ return s.at; })[0];
      var bsiAt = (spec.steps.filter(function(s){ return s.id === 'bsi'; })[0] || {}).at || (first && first.at) || [240, 300];
      if(spec.steps.some(function(s){ return s.id === 'bsi'; })){
        if(!has(d, 'bsi')) m.push({ key:'bsi', x:bsiAt[0], y:bsiAt[1], sev:'bad', text:'No gloves: BSI / PPE was never taken or voiced (a critical criterion).' });
        else if(touchedBare(spec, d)) m.push({ key:'bsi', x:bsiAt[0], y:bsiAt[1], sev:'bad', text:'BSI came after you had touched the patient: the first contact was bare-handed.' });
      }
      spec.steps.forEach(function(s){
        if(s.id === 'bsi' || has(d, s.id) || !s.at) return;
        m.push({ key:s.id, x:s.at[0], y:s.at[1], sev:s.critical ? 'bad' : 'warn', text:s.miss || ('Never done: ' + s.text.charAt(0).toLowerCase() + s.text.slice(1) + (s.critical ? ' (a critical criterion).' : '.')) });
      });
      (spec.order || []).forEach(function(o){
        if(before(d, o[1], o[0])){
          var s = spec.steps.filter(function(x){ return x.id === o[1]; })[0] || {};
          var at = s.at || bsiAt;
          m.push({ key:'order-' + o[0] + '-' + o[1], x:at[0] + 26, y:at[1] - 26, sev:o[3] || 'warn', text:o[2] });
        }
      });
      return m;
    };
    return spec;
  }
  var COMMON_NOTE = 'Wording and order vary between program sheets, so practice with the one you will be tested on.';

  /* ---- long bone immobilization (E217): a closed fracture of the right forearm */
  var LONGBONE = station({
    key:'longbone', match:/long bone/i,
    intro:'Adult, lying on their back: a closed, deformed fracture of the middle of the right forearm. Tick each action as you say it; it happens on the arm.',
    full:[-10, 80, 500, 820],
    focus:{ full:[-10, 80, 500, 820], arm:[-20, 380, 240, 330], hand:[-20, 520, 200, 220] },
    steps:[
      { id:'bsi', text:'Take or verbalize BSI / PPE precautions', critical:true, focus:'full', at:[160, 300], did:'Gloves on, eye protection verbalized.' },
      { id:'stab', touch:true, text:'Direct manual stabilization of the injury', critical:true, focus:'arm', at:[74, 540], chip:'Stabilized',
        did:'Your partner holds the forearm above and below the break, still.', miss:'The arm was never stabilized: the break moves with every step (a critical criterion).' },
      { id:'pms1', touch:true, text:'Check motor, sensation and circulation in the hand', critical:true, focus:'hand', at:[50, 640], chip:'Distal check: present',
        did:'Radial pulse present, fingers move, feels your touch.', cue:'Motor, sensory and circulatory function are present and normal.' },
      { id:'measure', brief:true, text:'Measure the splint against the uninjured arm', critical:false, focus:'full', at:[420, 520], did:'Splint measured on the good arm, not on the broken one.' },
      { id:'apply', touch:true, text:'Apply the padded splint', critical:false, focus:'arm', at:[100, 520], chip:'Splint on', did:'Padded board along the forearm, from above the elbow past the fingers.' },
      { id:'above', touch:true, text:'Immobilize the joint above (the elbow)', critical:true, focus:'arm', at:[92, 455], did:'Cravat at the elbow: the joint above cannot bend.' },
      { id:'below', touch:true, text:'Immobilize the joint below (the wrist)', critical:true, focus:'arm', at:[58, 610], did:'Cravat at the wrist: the joint below cannot bend.' },
      { id:'secure', touch:true, text:'Secure the entire injured arm', critical:false, focus:'arm', at:[76, 540], did:'Arm bound to the splint along its length; a sling and swathe if your program uses one.' },
      { id:'func', touch:true, text:'Place the hand in a position of function', critical:true, focus:'hand', at:[46, 660], chip:'Hand in function', did:'A roll of gauze in the palm: fingers gently curled.' },
      { id:'pms2', touch:true, text:'Recheck motor, sensation and circulation in the hand', critical:true, focus:'hand', at:[64, 690], chip:'Rechecked after', did:'Pulse, movement and sensation present after splinting.', go:true }
    ],
    order:[['stab', 'apply', 'Splint applied before the arm was stabilized: the break was moved to do it.', 'bad'],
           ['pms1', 'apply', 'Distal check after the splint was on: the first check has to come before splinting.', 'bad'],
           ['apply', 'pms2', 'The recheck came before the splint was on: it has to follow splinting.', 'bad']],
    notes:[
      '<b>Which bone.</b> The examiner chooses the limb; this run uses the forearm (radius and ulna). On a lower leg the joints are the knee and ankle and the foot goes in a position of function.',
      '<b>Sling and swathe.</b> Some programs expect a sling and swathe after an arm splint and score it under &ldquo;secures the entire injured extremity&rdquo;; others do not.',
      '<b>Distal check.</b> The sheet checks motor, sensory and circulatory function before and after; many programs say &ldquo;PMS&rdquo; or &ldquo;CMS&rdquo; for the same three.',
      COMMON_NOTE
    ],
    draw:function(P){
      var u = P.uid;
      // the deformity: swelling and a bruise at mid forearm, the forearm visibly angled
      var inj = el('g', {}, P.over);
      el('ellipse', { cx:74, cy:540, rx:20, ry:28, fill:'#fff2e6', opacity:0.5, filter:'url(#' + u + 'Soft)' }, inj);
      bruise(inj, u, 72, 540, 14, 20);
      el('path', { d:'M64 520 L80 540 L66 560', stroke:'#7a4a3a', 'stroke-width':2, fill:'none', opacity:0.55, 'stroke-linecap':'round' }, inj);
      hand(P.lay.stab, { uid:u, x:120, y:500, rot:-120, s:0.62 });
      hand(P.lay.stab, { uid:u, x:24, y:600, rot:60, s:0.62 });
      pms(P.lay.pms1, 50, 650, 'Pulse, motor, sense', 2.6);
      // the splint seen with the arm in a tape measure line
      el('path', { d:'M382 430 L436 690', stroke:'#c99b2d', 'stroke-width':5, 'stroke-dasharray':'2 7', 'stroke-linecap':'round' }, P.lay.measure);
      badge(P.lay.measure, 400, 410, 'Measured on the good arm', 'ok');
      el('path', { d:'M98 430 L40 690', stroke:'#a08b4e', 'stroke-width':26, 'stroke-linecap':'round', opacity:0.95 }, P.lay.apply);
      el('path', { d:'M98 430 L40 690', stroke:'#e8d9a8', 'stroke-width':22, 'stroke-linecap':'round' }, P.lay.apply);
      el('path', { d:'M98 430 L40 690', stroke:'#fff', 'stroke-width':6, 'stroke-linecap':'round', opacity:0.35 }, P.lay.apply);
      band(P.lay.above, 90, 455, 64, 14, 'sp-cravat');
      band(P.lay.below, 58, 612, 60, 14, 'sp-cravat');
      band(P.lay.secure, 80, 515, 62, 12, 'sp-cravat'); band(P.lay.secure, 70, 565, 62, 12, 'sp-cravat');
      el('ellipse', { cx:46, cy:658, rx:11, ry:9, fill:'url(#' + u + 'Gauze)', stroke:'#cfcfc6' }, P.lay.func);
      pms(P.lay.pms2, 50, 650, 'Rechecked', 1.8);
    },
    paint:function(P, st){
      var d = st.done;
      P.show(P.lay.pms1, has(d, 'pms1') && !has(d, 'pms2'));
      P.show(P.lay.stab, has(d, 'stab') && !has(d, 'secure'));
    }
  });

  /* ---- joint immobilization (E216): an injured right knee ---------------------- */
  var JOINT = station({
    key:'joint', match:/^joint|joint immob/i,
    intro:'Adult, lying on their back: an injured right knee, swollen and painful, the leg lying straight as found. Tick each action as you say it; it happens on the leg.',
    full:[20, 560, 440, 660],
    focus:{ full:[20, 560, 440, 660], knee:[80, 760, 220, 240], foot:[90, 1040, 200, 170], leg:[60, 620, 260, 560] },
    steps:[
      { id:'bsi', text:'Take or verbalize BSI / PPE precautions', critical:true, focus:'full', at:[300, 700], did:'Gloves on, eye protection verbalized.' },
      { id:'stab', touch:true, text:'Manually stabilize the knee in the position found', critical:true, focus:'knee', at:[183, 874], chip:'Knee supported',
        did:'Hands above and below the knee, holding it as found: no weight on the joint.', miss:'The knee was never supported: it bears the weight of the leg below it (a critical criterion).' },
      { id:'pms1', touch:true, text:'Check motor, sensation and circulation in the foot', critical:true, focus:'foot', at:[176, 1150], chip:'Distal check: present',
        did:'Pedal pulse present, toes move, feels your touch.', cue:'Motor, sensory and circulatory function are present and normal.' },
      { id:'select', brief:true, text:'Select the splint (two padded boards)', critical:false, focus:'leg', at:[320, 870], did:'Two padded boards, long enough to reach from the hip to beyond the foot.' },
      { id:'site', touch:true, text:'Immobilize the knee itself', critical:false, focus:'knee', at:[200, 874], chip:'Splinted', did:'Boards on both sides of the leg, padding in the hollows, a cravat beside the knee (not over it).' },
      { id:'above', touch:true, text:'Immobilize the bone above (the thigh)', critical:true, focus:'leg', at:[183, 760], did:'Cravats around the thigh hold the femur to the boards.' },
      { id:'below', touch:true, text:'Immobilize the bone below (the lower leg)', critical:true, focus:'leg', at:[180, 1010], did:'Cravats around the shin hold the tibia to the boards.' },
      { id:'pms2', touch:true, text:'Recheck motor, sensation and circulation in the foot', critical:true, focus:'foot', at:[190, 1170], chip:'Rechecked after', did:'Pulse, movement and sensation present after splinting.', go:true }
    ],
    order:[['stab', 'site', 'Splinted before the knee was supported: the joint took the leg’s weight.', 'bad'],
           ['pms1', 'site', 'Distal check after the splint was on: the first check has to come before splinting.', 'bad'],
           ['site', 'pms2', 'The recheck came before the splint was on: it has to follow splinting.', 'bad']],
    notes:[
      '<b>Which joint.</b> The examiner chooses; the shoulder (sling and swathe) is the other common one. For a joint the rule is the bones above and below, as the long bone rule is the joints above and below.',
      '<b>Position found.</b> A joint is splinted in the position found unless there is no distal pulse; what to do then (one attempt to realign, or not) differs between programs and medical direction.',
      '<b>Distal check.</b> The sheet checks motor, sensory and circulatory function before and after; programs call it PMS or CMS.',
      COMMON_NOTE
    ],
    draw:function(P){
      var u = P.uid;
      var inj = el('g', {}, P.over);
      el('ellipse', { cx:183, cy:874, rx:30, ry:34, fill:'#fff2e6', opacity:0.55, filter:'url(#' + u + 'Soft)' }, inj);
      bruise(inj, u, 186, 880, 16, 14);
      hand(P.lay.stab, { uid:u, x:150, y:820, rot:70, s:0.62 });
      hand(P.lay.stab, { uid:u, x:216, y:940, rot:-110, s:0.62 });
      pms(P.lay.pms1, 176, 1150, 'Pulse, motor, sense', 1);
      badge(P.lay.select, 330, 860, 'Two padded boards', 'ok');
      [[128, 1], [234, -1]].forEach(function(b){
        el('rect', { x:b[0] - 9, y:640, width:18, height:560, rx:6, fill:'#e8d9a8', stroke:'#a08b4e', 'stroke-width':1.4 }, P.lay.site);
      });
      band(P.lay.site, 181, 838, 120, 12, 'sp-cravat');
      band(P.lay.above, 181, 720, 128, 13, 'sp-cravat'); band(P.lay.above, 181, 780, 124, 13, 'sp-cravat');
      band(P.lay.below, 181, 960, 120, 13, 'sp-cravat'); band(P.lay.below, 181, 1060, 116, 13, 'sp-cravat');
      pms(P.lay.pms2, 176, 1150, 'Rechecked', 1);
    },
    paint:function(P, st){
      var d = st.done;
      P.show(P.lay.pms1, has(d, 'pms1') && !has(d, 'pms2'));
      P.show(P.lay.stab, has(d, 'stab') && !has(d, 'above'));
    }
  });

  /* ---- spinal immobilization, supine (E212): the long board from above --------- */
  var SUPINE = station({
    key:'supine', match:/supine/i,
    intro:'Adult, lying on their back with a suspected spinal injury. You are the one directing; your partner is at the head. Tick each action as you say it; it happens on the patient.',
    full:[-10, -40, 500, 1260],
    focus:{ full:[-10, -40, 500, 1260], head:[110, -30, 260, 300], limbs:[-10, 500, 500, 720], torso:[40, 180, 400, 600], legs:[60, 600, 360, 600] },
    steps:[
      { id:'bsi', text:'Take or verbalize BSI / PPE precautions', critical:true, focus:'full', at:[330, 400], did:'Gloves on, eye protection verbalized.' },
      { id:'manual', touch:true, text:'Direct your partner to hold the head in a neutral, in-line position', critical:true, focus:'head', at:[240, 60], chip:'Manual in-line',
        did:'Hands on both sides of the head from the top, neutral and in line, held until the head is secured.', miss:'The head was never held in line by hand (a critical criterion).' },
      { id:'pms1', touch:true, text:'Check motor, sensation and circulation in all four limbs', critical:true, focus:'limbs', at:[60, 660], chip:'4 limbs checked', did:'Pulse, movement and sensation in both hands and both feet.' },
      { id:'collar', touch:true, text:'Size and apply a cervical collar', critical:true, focus:'head', at:[240, 180], chip:'Collar on', did:'Collar sized and applied; your partner keeps holding the head.' },
      { id:'board', text:'Position the long board beside the patient', critical:false, focus:'full', at:[420, 600], did:'Board alongside, straps ready.' },
      { id:'roll', touch:true, text:'Log-roll onto the board on the head person’s count', critical:true, focus:'full', at:[240, 520], chip:'On the board',
        did:'Rolled as one unit and back onto the board, on the count of the person at the head.' },
      { id:'pad', touch:true, text:'Pad the voids (small of the back, behind the knees)', critical:false, focus:'legs', at:[240, 880], did:'Padding where the body does not touch the board.' },
      { id:'torso', touch:true, text:'Secure the torso to the board', critical:true, focus:'torso', at:[300, 330], chip:'Torso strapped', did:'Straps across the chest and the pelvis, snug.' },
      { id:'headpad', touch:true, text:'Pad behind the head as needed', critical:false, focus:'head', at:[300, 60], did:'Padding behind the head keeps it neutral, not tipped back.' },
      { id:'head', touch:true, text:'Secure the head to the board', critical:true, focus:'head', at:[240, 40], chip:'Head secured', did:'Head blocks on both sides, tape across the forehead and the collar. Your partner can now let go.' },
      { id:'legs', touch:true, text:'Secure the legs', critical:false, focus:'legs', at:[240, 960], did:'Straps above and below the knees.' },
      { id:'arms', touch:true, text:'Secure the arms', critical:false, focus:'torso', at:[80, 600], did:'Arms secured at the sides.' },
      { id:'pms2', touch:true, text:'Recheck motor, sensation and circulation in all four limbs', critical:true, focus:'limbs', at:[420, 660], chip:'Rechecked after', did:'Pulse, movement and sensation present in all four limbs.', go:true }
    ],
    order:[['manual', 'collar', 'Collar before the head was held in line: the neck was moved to put it on.', 'bad'],
           ['collar', 'roll', 'Rolled before the collar was on.', 'bad'],
           ['torso', 'head', 'Head secured before the torso: the body can still shift and lever the neck (a critical criterion).', 'bad'],
           ['pms1', 'collar', 'Distal check after the collar: the first check comes before you immobilize.', 'warn']],
    notes:[
      '<b>Board or not.</b> Many systems now use spinal motion restriction (a collar and a stretcher, or a vacuum mattress) rather than a long board for most patients; the skills station still tests the board.',
      '<b>Torso before head.</b> On every sheet: securing the head first leaves the body free to shift and lever the neck.',
      '<b>Who directs.</b> The person holding the head calls the roll. Some programs have you voice the roll and positioning rather than act it out.',
      COMMON_NOTE
    ],
    draw:function(P){
      var u = P.uid;
      // the board under the patient
      var bd = el('g', { class:'sp-item' }, P.under); P.lay.boardUnder = bd;
      el('rect', { x:120, y:-20, width:240, height:1240, rx:60, fill:'#e9b64a', stroke:'#a8781e', 'stroke-width':3 }, bd);
      for(var i = 0; i < 7; i++) el('rect', { x:132, y:60 + i * 170, width:18, height:44, rx:8, fill:'#a8781e', opacity:0.55 }, bd), el('rect', { x:330, y:60 + i * 170, width:18, height:44, rx:8, fill:'#a8781e', opacity:0.55 }, bd);
      // the board waiting beside the patient
      el('rect', { x:400, y:120, width:70, height:1000, rx:28, fill:'#e9b64a', stroke:'#a8781e', 'stroke-width':2.5, opacity:0.9 }, P.lay.board);
      // hands holding the head from the top
      hand(P.lay.manual, { uid:u, x:196, y:40, rot:200, s:0.62 });
      hand(P.lay.manual, { uid:u, x:284, y:40, rot:160, s:0.62, flip:true });
      [[50, 655], [430, 655], [176, 1160], [304, 1160]].forEach(function(p){ pulseAt(P.lay.pms1, p[0], p[1]); });
      badge(P.lay.pms1, 240, 1110, 'All four: present', 'ok');
      el('path', { d:'M206 146 Q240 160 274 146 L282 204 Q240 218 198 204 Z', fill:'#e8c77a', stroke:'#9a7a2e', 'stroke-width':1.6 }, P.lay.collar);
      el('rect', { x:231, y:168, width:18, height:18, rx:4, fill:'#5b4a2a', opacity:0.55 }, P.lay.collar);
      el('ellipse', { cx:240, cy:560, rx:40, ry:16, fill:'#d5e6ee', opacity:0.85 }, P.lay.pad);
      el('ellipse', { cx:182, cy:885, rx:30, ry:12, fill:'#d5e6ee', opacity:0.85 }, P.lay.pad); el('ellipse', { cx:298, cy:885, rx:30, ry:12, fill:'#d5e6ee', opacity:0.85 }, P.lay.pad);
      band(P.lay.torso, 240, 300, 300, 18, 'sp-strapx'); band(P.lay.torso, 240, 580, 290, 18, 'sp-strapx');
      el('path', { d:'M110 250 L370 420 M370 250 L110 420', stroke:'#2f4c6d', 'stroke-width':12, opacity:0.85, 'stroke-linecap':'round' }, P.lay.torso);
      el('ellipse', { cx:240, cy:60, rx:52, ry:56, fill:'#d5e6ee', opacity:0.95 }, P.lay.headpad); P.under.appendChild(P.lay.headpad);
      el('rect', { x:168, y:40, width:28, height:96, rx:8, fill:'#e05b4b', stroke:'#9b2f24', 'stroke-width':1.4 }, P.lay.head);
      el('rect', { x:284, y:40, width:28, height:96, rx:8, fill:'#e05b4b', stroke:'#9b2f24', 'stroke-width':1.4 }, P.lay.head);
      band(P.lay.head, 240, 56, 170, 12, 'sp-tape'); band(P.lay.head, 240, 170, 170, 12, 'sp-tape');
      band(P.lay.legs, 240, 800, 210, 16, 'sp-strapx'); band(P.lay.legs, 240, 980, 190, 16, 'sp-strapx');
      band(P.lay.arms, 240, 640, 420, 14, 'sp-strapx');
      [[50, 655], [430, 655], [176, 1160], [304, 1160]].forEach(function(p){ pulseAt(P.lay.pms2, p[0], p[1]); });
      badge(P.lay.pms2, 240, 1110, 'Rechecked: present', 'ok');
    },
    paint:function(P, st){
      P.show(P.lay.boardUnder, has(st.done, 'roll'));
      P.show(P.lay.board, has(st.done, 'board') && !has(st.done, 'roll'));
      P.show(P.lay.pms1, has(st.done, 'pms1') && !has(st.done, 'pms2'));
    }
  });

  /* ---- spinal immobilization, seated (E211): a vest-type device (KED) ---------- */
  var SEATED = station({
    key:'seated', match:/seated/i,
    intro:'Adult, sitting in a car seat after a crash, suspected spinal injury; seen from the front. Your partner holds the head from behind. Tick each action as you say it; the device goes on the patient.',
    full:[-10, -40, 500, 900],
    focus:{ full:[-10, -40, 500, 900], head:[110, -30, 260, 300], torso:[60, 160, 360, 520], limbs:[-10, 500, 500, 720] },
    steps:[
      { id:'bsi', text:'Take or verbalize BSI / PPE precautions', critical:true, focus:'full', at:[330, 400], did:'Gloves on, eye protection verbalized.' },
      { id:'manual', touch:true, text:'Direct your partner to hold the head neutral and in line', critical:true, focus:'head', at:[240, 60], chip:'Manual in-line',
        did:'Your partner, behind the patient, holds the head neutral and in line until it is secured.', miss:'The head was never held in line by hand (a critical criterion).' },
      { id:'pms1', touch:true, text:'Check motor, sensation and circulation in all four limbs', critical:true, focus:'limbs', at:[60, 660], chip:'4 limbs checked', did:'Pulse, movement and sensation in both hands and both feet.' },
      { id:'collar', touch:true, text:'Size and apply a cervical collar', critical:true, focus:'head', at:[240, 180], chip:'Collar on', did:'Collar sized and applied; the head is still held.' },
      { id:'device', touch:true, text:'Position the device behind the patient', critical:false, focus:'torso', at:[400, 400], did:'Vest slid down behind the back, centered, its top level with the head.' },
      { id:'torso', touch:true, text:'Secure the device to the torso (middle, then bottom, then top strap)', critical:true, focus:'torso', at:[300, 380], chip:'Torso strapped', did:'Middle, bottom and top chest straps fastened; the top one left a little loose until the end.' },
      { id:'legs', touch:true, text:'Fasten the leg (groin) straps', critical:false, focus:'torso', at:[200, 640], did:'Both leg straps around the thighs and snug.' },
      { id:'check', brief:true, text:'Check the torso fixation and adjust', critical:false, focus:'torso', at:[240, 460], did:'The device does not shift up, down or sideways; straps tightened.' },
      { id:'headpad', touch:true, text:'Pad behind the head as needed', critical:false, focus:'head', at:[300, 60], did:'Padding keeps the head neutral against the device.' },
      { id:'head', touch:true, text:'Secure the head to the device', critical:true, focus:'head', at:[240, 40], chip:'Head secured', did:'Head flaps and straps across the forehead and the collar.' },
      { id:'move', text:'Verbalize moving the patient onto a long board', critical:false, focus:'full', at:[420, 800], chip:'Ready to move', did:'Pivot and lower onto the long board as one unit, then loosen the leg straps.', go:true },
      { id:'pms2', touch:true, text:'Recheck motor, sensation and circulation in all four limbs', critical:true, focus:'limbs', at:[420, 660], chip:'Rechecked after', did:'Pulse, movement and sensation present in all four limbs.' }
    ],
    order:[['manual', 'collar', 'Collar before the head was held in line.', 'bad'],
           ['torso', 'head', 'Head secured before the torso: the device can still move on the body and lever the neck (a critical criterion).', 'bad'],
           ['device', 'torso', 'Torso straps before the device was behind the patient.', 'warn']],
    notes:[
      '<b>Strap order.</b> Many programs teach middle, bottom, then top (&ldquo;My Baby Looks Too Hot&rdquo;: middle, bottom, legs, top, head); others differ. The rule on every sheet: torso before head.',
      '<b>Rapid extrication.</b> An unstable patient or an unsafe scene calls for rapid extrication instead of a vest device; this station tests the device.',
      '<b>Moving.</b> The sheet has you verbalize moving to the long board; how far that is acted out depends on the program.',
      COMMON_NOTE
    ],
    draw:function(P){
      var u = P.uid;
      // the vest behind the patient: its edges show beside the torso and above the shoulders
      var v = P.lay.device;
      el('path', { d:'M120 40 L360 40 L380 620 L100 620 Z', fill:'#2f6b5a', opacity:0.92 }, v);
      for(var x = 140; x < 360; x += 26) el('path', { d:'M' + x + ' 60 L' + (x - 4) + ' 600', stroke:'#255648', 'stroke-width':3 }, v);
      P.under.appendChild(v);
      hand(P.lay.manual, { uid:u, x:196, y:40, rot:200, s:0.62 });
      hand(P.lay.manual, { uid:u, x:284, y:40, rot:160, s:0.62, flip:true });
      [[50, 655], [430, 655], [176, 1160], [304, 1160]].forEach(function(p){ pulseAt(P.lay.pms1, p[0], p[1]); });
      el('path', { d:'M206 146 Q240 160 274 146 L282 204 Q240 218 198 204 Z', fill:'#e8c77a', stroke:'#9a7a2e', 'stroke-width':1.6 }, P.lay.collar);
      // torso flaps wrapping the chest, three colored straps
      el('path', { d:'M104 240 Q150 250 170 300 L176 600 L104 600 Z M376 240 Q330 250 310 300 L304 600 L376 600 Z', fill:'#2f6b5a', opacity:0.92 }, P.lay.torso);
      [[300, '#c9342a'], [420, '#2a8f3a'], [530, '#e0b62d']].forEach(function(s){ band(P.lay.torso, 240, s[0], 280, 14, 'sp-kedstrap').setAttribute('fill', s[1]); });
      el('path', { d:'M150 600 Q170 700 190 700 M330 600 Q310 700 290 700', stroke:'#1f2d3a', 'stroke-width':10, fill:'none', 'stroke-linecap':'round' }, P.lay.legs);
      badge(P.lay.check, 240, 470, 'Snug, does not shift', 'ok');
      el('ellipse', { cx:240, cy:60, rx:52, ry:56, fill:'#d5e6ee', opacity:0.95 }, P.lay.headpad); P.under.appendChild(P.lay.headpad);
      el('path', { d:'M150 30 L196 40 L196 150 L150 160 Z M330 30 L284 40 L284 150 L330 160 Z', fill:'#2f6b5a' }, P.lay.head);
      band(P.lay.head, 240, 56, 180, 12, 'sp-tape'); band(P.lay.head, 240, 170, 180, 12, 'sp-tape');
      badge(P.lay.move, 240, 860, 'Pivot onto the long board', 'go');
      [[50, 655], [430, 655], [176, 1160], [304, 1160]].forEach(function(p){ pulseAt(P.lay.pms2, p[0], p[1]); });
    },
    paint:function(P, st){ P.show(P.lay.pms1, has(st.done, 'pms1') && !has(st.done, 'pms2')); }
  });

  /* ---- oxygen by non-rebreather (E204): the tank, the regulator, the mask ------ */
  var OXYGEN = station({
    key:'oxygen', match:/rebreather|oxygen admin/i,
    intro:'Adult, sitting up, short of breath; the oxygen cylinder is beside them. Tick each action as you say it; it happens to the tank and the mask.',
    full:[60, -60, 460, 560],
    focus:{ full:[60, -60, 460, 560], tank:[280, 40, 220, 420], face:[120, -20, 300, 320] },
    steps:[
      { id:'bsi', text:'Take or verbalize BSI / PPE precautions', critical:true, focus:'full', at:[160, 300], did:'Gloves on.' },
      { id:'crack', brief:true, text:'Crack the cylinder valve to clear the outlet', critical:false, focus:'tank', at:[400, 150], did:'A quick hiss: dust blown out of the outlet, pointed away from everyone.' },
      { id:'reg', text:'Assemble the regulator to the cylinder', critical:false, focus:'tank', at:[400, 170], chip:'Regulator on', did:'Washer in place, pins lined up, regulator hand-tight.' },
      { id:'open', brief:true, text:'Open the cylinder', critical:false, focus:'tank', at:[400, 130], did:'Valve opened a full turn.' },
      { id:'leaks', brief:true, text:'Check for leaks', critical:true, focus:'tank', at:[380, 190], chip:'No leaks', did:'No hiss at the seal.', miss:'Never checked for leaks: a leaking regulator is a critical criterion.' },
      { id:'psi', brief:true, text:'Check the cylinder pressure', critical:false, focus:'tank', at:[430, 190], chip:'Pressure read', did:'Gauge read: enough oxygen for the call.' },
      { id:'attach', text:'Attach the mask tubing to the regulator', critical:false, focus:'tank', at:[360, 230], did:'Tubing on the flowmeter outlet.' },
      { id:'prefill', text:'Prefill the reservoir bag', critical:true, focus:'tank', at:[300, 300], chip:'Bag full', did:'Thumb over the valve inside the mask until the bag is full.', miss:'The reservoir was not prefilled: the first breaths come from an empty bag (a critical criterion).' },
      { id:'flow', text:'Set the flow at 12 to 15 L/min', critical:true, focus:'tank', at:[430, 240], chip:'15 L/min', did:'Flow at 15 L/min: enough to keep the bag from collapsing on each breath.', miss:'No flow set: under 10 L/min the bag empties and the patient rebreathes (a critical criterion).' },
      { id:'apply', touch:true, text:'Apply the mask and adjust it to the face', critical:true, focus:'face', at:[240, 120], chip:'Mask sealed', did:'Mask over nose and mouth, nose clip pinched, strap snug.', miss:'The mask was never put on and sealed (a critical criterion).', go:true },
      { id:'remove', touch:true, text:'When told to stop: remove the mask', critical:false, focus:'face', at:[200, 120], did:'Mask off the face.', cue:'Discontinue the oxygen.' },
      { id:'off', text:'Shut off the regulator and the cylinder', critical:false, focus:'tank', at:[400, 130], did:'Cylinder closed, flow turned off.' },
      { id:'bleed', text:'Relieve the pressure in the regulator', critical:false, focus:'tank', at:[430, 210], did:'Gauge bled down to zero.' }
    ],
    order:[['reg', 'open', 'Opened the cylinder before the regulator was on.', 'bad'],
           ['prefill', 'apply', 'Mask on the face before the bag was filled: the first breaths come from an empty bag.', 'bad'],
           ['flow', 'apply', 'Mask on before the flow was set.', 'warn']],
    notes:[
      '<b>Flow.</b> The sheet asks for 12 L/min or more; most programs teach 12 to 15 L/min. Its critical criterion is a flow under 10 L/min.',
      '<b>Indication.</b> Many current guidelines titrate oxygen to the saturation; the station only tests the equipment and technique.',
      '<b>Cracking the valve.</b> Some sheets list it, some do not; it does no harm to say it.',
      COMMON_NOTE
    ],
    draw:function(P){
      var u = P.uid, t = el('g', {}, P.under);
      // the cylinder standing beside the patient's left shoulder
      el('rect', { x:380, y:180, width:56, height:300, rx:24, fill:'url(#' + u + 'Cyl)', stroke:'#174d2f', 'stroke-width':1.5 }, t);
      el('rect', { x:394, y:150, width:28, height:36, rx:6, fill:'#9aa3a8', stroke:'#5d666b' }, t);
      P.valveSpin = el('rect', { x:398, y:132, width:20, height:20, rx:4, fill:'#5d666b' }, t);
      el('path', { d:'M394 162 l-18 -8', stroke:'#cfd6da', 'stroke-width':3, 'stroke-linecap':'round' }, P.lay.crack);
      badge(P.lay.crack, 408, 108, 'Hiss: outlet clear', 'ok');
      var r = P.lay.reg;
      el('rect', { x:392, y:160, width:56, height:30, rx:6, fill:'#c7d1d6', stroke:'#5d666b' }, r);
      el('circle', { cx:438, cy:176, r:13, fill:'#fff', stroke:'#5d666b', 'stroke-width':2 }, r);
      P.needle = el('path', { d:'M438 176 L438 166', stroke:'#c9342a', 'stroke-width':2.4, 'stroke-linecap':'round' }, r);
      el('rect', { x:400, y:190, width:16, height:22, rx:4, fill:'#2f6b5a' }, r);
      badge(P.lay.open, 408, 108, 'Cylinder open', 'ok');
      badge(P.lay.leaks, 408, 108, 'No hiss: no leaks', 'ok');
      badge(P.lay.psi, 408, 108, 'Pressure read: enough', 'ok');
      el('path', { d:'M408 212 C380 260 320 230 300 250', stroke:'#7fbfa9', 'stroke-width':4, fill:'none', 'stroke-linecap':'round' }, P.lay.attach);
      badge(P.lay.flow, 470, 236, '15 L/min', 'go');
      // the mask: in the hand before it goes on (bag beside it), then on the face
      P.maskHand = el('g', { class:'sp-item' }, P.over);
      var mh = el('g', { transform:'translate(60 230)' }, P.maskHand); nrb(mh, u);
      P.bag = mh.querySelector('.sp-res');
      P.maskFace = el('g', { class:'sp-item' }, P.over); nrb(P.maskFace, u);
      P.faceBag = P.maskFace.querySelector('.sp-res');
    },
    paint:function(P, st){
      var d = st.done, on = has(d, 'apply') && !has(d, 'remove');
      P.show(P.maskHand, has(d, 'attach') && !on && !has(d, 'remove'));
      P.show(P.maskFace, on);
      var full = has(d, 'prefill') || (has(d, 'flow') && has(d, 'attach'));
      [P.bag, P.faceBag].forEach(function(b){ if(b) b.setAttribute('transform', full ? '' : 'translate(240 152) scale(1 0.45) translate(-240 -152)'); });
      if(P.needle) P.needle.setAttribute('transform', has(d, 'open') && !has(d, 'bleed') ? 'rotate(50 438 176)' : '');
      P.show(P.lay.attach, has(d, 'attach'));
      P.show(P.lay.flow, has(d, 'flow') && !has(d, 'off'));
    }
  });

  /* ---- cardiac arrest management / AED (E215) ------------------------------------ */
  var AED = station({
    key:'aed', match:/cardiac arrest|aed/i,
    intro:'Adult, collapsed, lying on their back on the floor. A second rescuer is with you. Tick each action as you say it; it happens on the patient.',
    full:[-10, -100, 560, 800],
    focus:{ full:[-10, -100, 560, 800], chest:[90, 120, 330, 380], neck:[140, 40, 200, 230], face:[110, -40, 300, 300], aed:[180, 120, 380, 460] },
    steps:[
      { id:'bsi', text:'Take or verbalize BSI / PPE precautions', critical:true, focus:'full', at:[340, 480], did:'Gloves on.' },
      { id:'scene', text:'Make sure the scene is safe', critical:false, focus:'full', at:[420, 560], did:'Scene safe.' },
      { id:'resp', brief:true, touch:true, text:'Check responsiveness', critical:true, focus:'chest', at:[150, 220], did:'Shoulders tapped, shouted: no response.' },
      { id:'help', text:'Request additional EMS assistance', critical:false, focus:'full', at:[420, 600], did:'Help and the AED requested.' },
      { id:'check', brief:true, touch:true, text:'Check breathing and the carotid pulse together, no more than 10 seconds', critical:true, focus:'neck', at:[224, 176], chip:'No pulse', did:'No breathing, no pulse, in under 10 seconds.', cue:'Apneic and pulseless.' },
      { id:'cpr', touch:true, text:'Begin chest compressions at once (2 to 2.4 inches, 100 to 120 a minute, full recoil)', critical:true, focus:'chest', at:[240, 300], chip:'Compressions', did:'Hands on the lower half of the sternum, compressing hard and fast, letting the chest recoil.', miss:'Compressions never started (a critical criterion).' },
      { id:'twomin', touch:true, text:'Two minutes of one-rescuer CPR (30:2)', critical:true, focus:'chest', at:[300, 300], did:'Five cycles of 30 compressions and 2 breaths.' },
      { id:'vent', touch:true, text:'Take over ventilation with the BVM; the second rescuer compresses', critical:false, focus:'face', at:[240, 110], chip:'BVM', did:'You ventilate; your partner compresses.' },
      { id:'power', text:'Turn the AED on', critical:false, focus:'aed', at:[470, 320], chip:'AED on', did:'AED on, following its prompts.' },
      { id:'pads', touch:true, text:'Attach the pads as the AED shows', critical:true, focus:'aed', at:[200, 260], chip:'Pads on', did:'Upper right chest and lower left side, cable plugged in. Compressions continue while you do it.', miss:'The pads were never attached (a critical criterion).' },
      { id:'clear', text:'Stop CPR and make sure everyone is clear for the analysis', critical:true, focus:'aed', at:[300, 200], chip:'Clear', did:'“Everyone clear!” Nobody touching the patient.', cue:'Shock advised.' },
      { id:'shock', text:'Make sure everyone is clear and deliver the shock', critical:true, focus:'aed', at:[470, 300], chip:'Shocked', did:'Clear, then the shock.' },
      { id:'resume', touch:true, text:'Resume compressions immediately', critical:true, focus:'chest', at:[240, 330], chip:'CPR resumed', did:'Straight back to compressions, no pulse check.', go:true }
    ],
    order:[['check', 'cpr', 'Compressions before breathing and pulse were checked.', 'warn'],
           ['clear', 'shock', 'Shocked before everyone was clear for the analysis (a critical criterion).', 'bad'],
           ['pads', 'shock', 'Shock with no pads attached.', 'bad']],
    notes:[
      '<b>Pads.</b> Most adult pads go below the right collarbone and on the left side below the armpit; some programs and devices use front-and-back placement. Follow the pictures on the pads.',
      '<b>Pauses.</b> The sheet fails an interruption of CPR of more than 10 seconds. Keep compressing while the pads go on; stop only for the analysis and the shock.',
      '<b>After the shock.</b> Resume compressions at once; no pulse check until the AED or your protocol calls for one.',
      COMMON_NOTE
    ],
    draw:function(P){
      var u = P.uid;
      hand(P.lay.resp, { uid:u, x:146, y:226, rot:120, s:0.6 }); hand(P.lay.resp, { uid:u, x:334, y:226, rot:-120, s:0.6, flip:true });
      hand(P.lay.check, { uid:u, x:206, y:186, rot:100, s:0.5 }); pulseAt(P.lay.check, 224, 176);
      P.cprHands = el('g', { class:'sp-item sp-cpr' }, P.over);
      hand(P.cprHands, { uid:u, x:240, y:300, rot:180, s:0.75 }); hand(P.cprHands, { uid:u, x:240, y:294, rot:180, s:0.72, thumb:false });
      badge(P.lay.twomin, 330, 300, '30:2 × 5', 'ok');
      el('ellipse', { cx:240, cy:112, rx:30, ry:36, fill:'url(#' + u + 'Mask)', stroke:'#4f8c7a', 'stroke-width':1.6 }, P.lay.vent);
      el('ellipse', { cx:240, cy:28, rx:26, ry:46, fill:'url(#' + u + 'Bag)', stroke:'#8a979e', 'stroke-width':1.4 }, P.lay.vent);
      // the AED beside the patient's left side, the pads and the cable
      var a = el('g', {}, P.lay.power);
      el('rect', { x:420, y:250, width:110, height:130, rx:14, fill:'#e9a33a', stroke:'#9a5f12', 'stroke-width':2 }, a);
      el('rect', { x:432, y:262, width:86, height:40, rx:6, fill:'#163a2f' }, a);
      el('text', { x:475, y:288, 'text-anchor':'middle', class:'sp-aed-t' }, a).textContent = 'AED';
      P.shockBtn = el('circle', { cx:475, cy:340, r:16, fill:'#c9342a', stroke:'#7a1b14', 'stroke-width':2 }, a);
      var pd = P.lay.pads;
      el('g', { transform:'rotate(-8 190 250)' }, pd).appendChild(padRect(190, 250));
      el('g', { transform:'rotate(-65 318 380)' }, pd).appendChild(padRect(318, 380));
      el('path', { d:'M200 230 C260 180 380 220 430 270 M330 370 C380 380 400 330 430 300', stroke:'#2d2d2d', 'stroke-width':3, fill:'none' }, pd);
      badge(P.lay.clear, 240, 200, 'Everyone clear', 'warn');
      P.flash = el('g', { class:'sp-item' }, P.over);
      el('path', { d:'M250 270 L232 300 L248 300 L230 336 L268 292 L250 292 L266 270 Z', fill:'#ffd23f', stroke:'#b8860b', 'stroke-width':1.5 }, P.flash);
      badge(P.lay.resume, 330, 340, 'Back on the chest', 'go');
      function padRect(x, y){
        var g = document.createElementNS(NS, 'g');
        el('rect', { x:x - 34, y:y - 24, width:68, height:48, rx:9, fill:'#f4f1ea', stroke:'#7a7a72', 'stroke-width':1.3 }, g);
        el('rect', { x:x - 24, y:y - 15, width:48, height:30, rx:6, fill:'#e3b04b', opacity:0.5 }, g);
        return g;
      }
    },
    paint:function(P, st){
      var d = st.done, last = null, best = -1;
      for(var k in d) if(d[k] > best){ best = d[k]; last = k; }
      var hands = (has(d, 'cpr') || has(d, 'resume')) && !(last === 'clear' || last === 'shock' || (has(d, 'clear') && !has(d, 'resume')));
      P.show(P.cprHands, hands);
      P.show(P.lay.cpr, false);
      P.show(P.flash, last === 'shock');
      P.show(P.lay.clear, has(d, 'clear') && !has(d, 'resume'));
      P.show(P.lay.twomin, has(d, 'twomin') && !has(d, 'power'));
    }
  });

  /* ---- patient assessment: trauma and medical (E201, E202) ------------------------
     The body is the exam: each phase ticked shows what it found, where it is.
     The findings are this run's own case, not the Registry's. */
  function finding(parent, x, y, text, side, sev){
    var g = el('g', {}, parent);
    el('circle', { cx:x, cy:y, r:7, class:'sp-find-dot' + (sev ? ' is-sev' : '') }, g);
    var bx = x + side * 26;
    el('path', { d:'M' + x + ' ' + y + ' L' + bx + ' ' + y, class:'sp-find-line' }, g);
    var w = 14 + text.length * 8.2;
    var gx = side > 0 ? bx : bx - w;
    el('rect', { x:gx, y:y - 14, width:w, height:28, rx:8, class:'sp-find-box' + (sev ? ' is-sev' : '') }, g);
    el('text', { x:gx + 7, y:y + 5, class:'sp-find-t' }, g).textContent = text;
    return g;
  }
  var TRAUMA = station({
    key:'trauma', match:/assessment.*trauma/i,
    intro:'This run’s case: a 34-year-old who fell about 12 feet from a ladder, lying on their back. Tick each phase as you say it; what it finds appears on the body.',
    full:[-140, -40, 760, 1260],
    focus:{ full:[-140, -40, 760, 1260], upper:[-80, -40, 640, 560], lower:[-80, 420, 640, 800] },
    steps:[
      { id:'bsi', text:'Take or verbalize BSI / PPE precautions', critical:true, focus:'full', at:[420, 400], did:'Gloves on, eye protection verbalized.' },
      { id:'scene', text:'Scene size-up: safety, mechanism, number of patients, more help, spinal precautions', critical:true, focus:'full', at:[420, 460], chip:'Scene safe', did:'Scene safe; a 12-foot fall; one patient; help requested; manual stabilization of the head.' },
      { id:'gi', touch:true, text:'General impression, responsiveness, chief complaint, life threats', critical:false, focus:'upper', at:[240, 40], did:'Responds to voice, groaning; complains of pain on the left side.' },
      { id:'airway', touch:true, text:'Airway: open and assess', critical:true, focus:'upper', at:[240, 124], did:'Airway open and clear.' },
      { id:'breath', touch:true, text:'Breathing: assess; give high-concentration oxygen', critical:true, focus:'upper', at:[240, 280], chip:'O₂ by NRB', did:'Breathing fast and shallow; non-rebreather at 15 L/min.', miss:'No high-concentration oxygen (a critical criterion).' },
      { id:'circ', touch:true, text:'Circulation: bleeding, pulse, skin', critical:true, focus:'upper', at:[60, 640], did:'No major bleeding; radial pulse fast and weak; skin pale, cool and sweaty.' },
      { id:'priority', text:'Identify a priority patient; call for transport', critical:true, focus:'upper', at:[420, 520], chip:'Priority: transport', did:'Signs of shock after a significant fall: priority patient, transport now.', go:true },
      { id:'history', text:'History: SAMPLE', critical:false, focus:'upper', at:[420, 580], did:'No allergies, no medications, healthy, ate at noon, fell reaching for a gutter.' },
      { id:'head', touch:true, text:'Head: inspect and palpate (DCAP-BTLS)', critical:false, focus:'upper', at:[200, 60], did:'Scalp abrasion at the back of the head; pupils equal and reactive.' },
      { id:'neck', touch:true, text:'Neck: trachea, veins, cervical spine; apply a collar', critical:false, focus:'upper', at:[240, 190], chip:'Collar', did:'Trachea midline, neck veins flat, tender at the back of the neck: collar on.' },
      { id:'chest', touch:true, text:'Chest: inspect, palpate, listen', critical:false, focus:'upper', at:[320, 340], did:'Bruising and tenderness over the left lower ribs; breath sounds present and equal.' },
      { id:'abd', touch:true, text:'Abdomen and pelvis: inspect, palpate', critical:false, focus:'lower', at:[290, 420], did:'Tender in the upper left; pelvis stable.' },
      { id:'legs', touch:true, text:'Legs and arms: DCAP-BTLS, then motor, sensation, circulation', critical:false, focus:'lower', at:[300, 880], did:'Left wrist swollen and tender; all four limbs move and feel, pulses present.' },
      { id:'back', touch:true, text:'Back and buttocks (on the log-roll)', critical:false, focus:'lower', at:[160, 520], did:'No findings on the back.' },
      { id:'vitals', text:'Vital signs', critical:false, focus:'upper', at:[420, 640], chip:'Vitals', did:'Pulse 124, BP 96/60, respirations 26.' },
      { id:'reassess', text:'Reassess on the way', critical:false, focus:'upper', at:[420, 700], chip:'Reassessing', did:'Every 5 minutes: unstable patient.' }
    ],
    order:[['breath', 'head', 'The head-to-toe exam began before oxygen: threats to breathing come first (a critical criterion).', 'bad'],
           ['circ', 'head', 'The head-to-toe exam began before circulation was assessed.', 'bad']],
    notes:[
      '<b>Phases, not the sheet’s points.</b> The trauma sheet scores many separate items (each body region, each check); this run groups them by phase.',
      '<b>Rapid or focused.</b> A significant mechanism gets a full rapid exam; an isolated injury gets a focused one. Programs differ on how much of the secondary is done on scene.',
      '<b>Spinal precautions.</b> Many systems use selective spinal motion restriction now; the sheet still expects you to consider it in the size-up.',
      COMMON_NOTE
    ],
    draw:function(P){
      var u = P.uid;
      finding(P.lay.gi, 240, 40, 'Responds to voice', 1);
      finding(P.lay.airway, 240, 124, 'Airway clear', 1);
      nrb(P.lay.breath, u); finding(P.lay.breath, 300, 290, 'RR 26, shallow', 1);
      finding(P.lay.circ, 70, 640, 'Pale, cool, sweaty', -1, true);
      finding(P.lay.circ, 60, 600, 'Radial fast, weak', -1, true);
      el('ellipse', { cx:240, cy:22, rx:20, ry:10, fill:'#b3523f', opacity:0.55, filter:'url(#' + u + 'Soft)' }, P.lay.head);
      finding(P.lay.head, 222, 30, 'Scalp abrasion', -1);
      el('path', { d:'M206 146 Q240 160 274 146 L282 204 Q240 218 198 204 Z', fill:'#e8c77a', stroke:'#9a7a2e', 'stroke-width':1.6 }, P.lay.neck);
      bruise(P.lay.chest, u, 312, 350, 34, 22);
      finding(P.lay.chest, 330, 350, 'Bruised, tender ribs', 1, true);
      finding(P.lay.abd, 300, 420, 'Tender, upper left', 1, true);
      finding(P.lay.abd, 240, 560, 'Pelvis stable', -1);
      el('ellipse', { cx:430, cy:618, rx:14, ry:18, fill:'#fff2e6', opacity:0.6, filter:'url(#' + u + 'Soft)' }, P.lay.legs);
      finding(P.lay.legs, 432, 618, 'Wrist swollen', 1);
      finding(P.lay.legs, 304, 1150, 'Pulses present', 1);
      finding(P.lay.back, 150, 520, 'Back: nothing', -1);
      badge(P.lay.vitals, 240, 470, 'P 124  BP 96/60  R 26', 'warn');
    }
  });
  var MEDICAL = station({
    key:'medical', match:/assessment.*medical/i,
    intro:'This run’s case: a 62-year-old with chest pain for 30 minutes, sitting up. Tick each phase as you say it; what it finds and what you do appear on the patient.',
    full:[-140, -40, 760, 900],
    focus:{ full:[-140, -40, 760, 900], upper:[-80, -40, 640, 560] },
    steps:[
      { id:'bsi', text:'Take or verbalize BSI / PPE precautions', critical:true, focus:'full', at:[420, 400], did:'Gloves on.' },
      { id:'scene', text:'Scene size-up: safety, nature of illness, number of patients, more help', critical:true, focus:'full', at:[420, 460], chip:'Scene safe', did:'Scene safe; chest pain; one patient.' },
      { id:'gi', touch:true, text:'General impression, responsiveness, chief complaint, life threats', critical:false, focus:'upper', at:[240, 40], did:'Alert, anxious, holding the chest.' },
      { id:'airway', touch:true, text:'Airway and breathing: assess; oxygen if indicated', critical:true, focus:'upper', at:[240, 124], chip:'O₂', did:'Airway open; breathing fast, SpO₂ 91%: oxygen.', miss:'No oxygen for a hypoxic patient (a critical criterion).' },
      { id:'circ', touch:true, text:'Circulation: pulse, skin, bleeding', critical:false, focus:'upper', at:[60, 640], did:'Radial pulse regular, 104; skin pale and sweaty.' },
      { id:'priority', text:'Identify a priority patient; call for transport', critical:true, focus:'upper', at:[420, 520], chip:'Priority: transport', did:'Chest pain with pale, sweaty skin: priority, transport.', go:true },
      { id:'opqrst', text:'History of the complaint: OPQRST', critical:false, focus:'upper', at:[420, 580], did:'Pressure, center of the chest, into the left arm, 8 of 10, came on at rest.' },
      { id:'sample', text:'Past history: SAMPLE', critical:false, focus:'upper', at:[420, 620], did:'No allergies; takes blood pressure pills; no nitroglycerin of their own.' },
      { id:'focused', touch:true, text:'Secondary: the body system involved (heart and lungs)', critical:false, focus:'upper', at:[300, 300], did:'Lungs clear on both sides; no leg swelling.' },
      { id:'vitals', text:'Vital signs', critical:false, focus:'upper', at:[420, 660], chip:'Vitals', did:'Pulse 104, BP 152/94, respirations 22, SpO₂ 94% on oxygen.' },
      { id:'treat', text:'Interventions per protocol or medical direction (aspirin)', critical:true, focus:'upper', at:[200, 124], chip:'Aspirin', did:'Aspirin chewed, per protocol, after checking for allergy and bleeding.', miss:'No interventions named: a medication needs a protocol or medical direction (a critical criterion when one is given without).' },
      { id:'reassess', text:'Reassess', critical:false, focus:'upper', at:[420, 700], did:'Every 5 minutes.' },
      { id:'report', text:'Verbal report to the arriving unit', critical:false, focus:'upper', at:[420, 740], chip:'Report given', did:'Age, complaint, findings, vitals, care given.' }
    ],
    order:[['airway', 'focused', 'The secondary exam began before airway and breathing were treated (a critical criterion).', 'bad']],
    notes:[
      '<b>History or exam first.</b> For a responsive medical patient most programs take the history first; the sheet lets either come first. Verify yours.',
      '<b>Oxygen.</b> Current practice gives oxygen to a hypoxic patient (SpO₂ under about 94%) or one in distress, not routinely; the sheet fails withholding it when it is needed.',
      '<b>Aspirin and nitroglycerin.</b> What an EMT may give, and whether it needs online medical direction, depends on the protocol.',
      COMMON_NOTE
    ],
    draw:function(P){
      var u = P.uid;
      finding(P.lay.gi, 240, 40, 'Alert, anxious', 1);
      nrb(P.lay.airway, u); finding(P.lay.airway, 300, 250, 'SpO₂ 91%, fast', 1, true);
      finding(P.lay.circ, 70, 640, 'Pale, sweaty', -1, true);
      finding(P.lay.circ, 60, 600, 'Radial 104', -1);
      el('ellipse', { cx:240, cy:290, rx:46, ry:30, fill:'#d1594a', opacity:0.25, filter:'url(#' + u + 'Soft)' }, P.lay.opqrst);
      el('path', { d:'M260 300 C320 330 360 380 400 450', stroke:'#d1594a', 'stroke-width':6, opacity:0.35, fill:'none', 'stroke-linecap':'round', filter:'url(#' + u + 'Soft)' }, P.lay.opqrst);
      finding(P.lay.opqrst, 240, 290, 'Pressure, into left arm', -1, true);
      finding(P.lay.focused, 330, 340, 'Lungs clear', 1);
      badge(P.lay.vitals, 240, 470, 'P 104  BP 152/94  R 22', 'warn');
      finding(P.lay.treat, 222, 140, 'Aspirin chewed', -1);
      badge(P.lay.report, 240, 500, 'Report handed over', 'go');
    }
  });

  var DEFS = [BLEEDING, BVM, LONGBONE, JOINT, SUPINE, SEATED, OXYGEN, AED, TRAUMA, MEDICAL];

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
