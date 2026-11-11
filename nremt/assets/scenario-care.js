/* The scenario simulator's care layer (nremt/assets/scenario-monitor.js loads it
   when the first patient is shown, so the simulator page does not carry it on
   arrival; docs/tool-review/done/nremt-weight.md).

   What the student has done, put on the patient: the rules that turn the
   choices taken into care given (a tourniquet, a mask, hands on the chest...),
   a finding the case later says is fixed, the birth's pin words, and the
   drawing of all of it (and of a pregnancy) on the figure, with its styles.
   Tested with the monitor in scripts/test/nremt-cases.test.mjs. */
(function(){
  'use strict';
  var S = window.NremtSim;
  if(!S || S.care) return;
  var Patient = S.Patient, sentences = S.pure.sentences, svgEl = S.util.svgEl, esc = S.util.esc;

  /* ---- What has been done to the patient (review 2026-11) --------------------
     The pins used to be the case's words only, so after the tourniquet the
     thigh still read "Spurting bleed" with nothing on the leg. Now the care
     the student chose is put on the body (a tourniquet on the limb, gauze,
     a mask, the BVM, hands on the chest, AED pads, a collar...) and a pin
     whose problem the case later says is fixed changes with it.

     CARE: rules over the choice texts the student took, oldest first. Each
     rule sets items on or off; for one choice the "on" rules run first and
     the "off" rules after, so "Stop compressions, continue ventilation"
     ends with compressions off and the bag still on. Only what a choice says
     was done is drawn; a choice that says to do it later ("apply the AED as
     soon as it arrives") puts nothing on yet. */
  var CARE_ON = [
    [/\btourniquet\b/i, { tq: 1 }],
    [/\b(direct pressure|gauze|firm, sustained pressure|pressure alone|gauze and pressure)\b/i, { gauze: 1 }],
    [/\b(oxygen|non-?rebreather|high-flow)\b/i, { o2: 1 }],
    [/\bblow-by\b/i, { blowby: 1 }],
    [/\b(bag-valve|BVM|positive-pressure ventilation|ventilations?|ventilating|rescue breaths?)\b/i, { bvm: 1 }],
    [/\b(compressions|CPR)\b/i, { cpr: 1 }],
    [/\b(apply|applies|applying|reapply) (the )?(AED|pads|pediatric pads)|\bAED pads\b|\bdeliver the shock\b|\blet the AED\b|\breapply\b/i, { pads: 1 }],
    [/\b(epinephrine|auto-injector)\b/i, { epi: 1 }],
    [/\b(administer|give|giving) naloxone|naloxone (now|immediately|via|while)/i, { nalox: 1 }],
    [/\b(oral glucose|glucose gel|give glucose now|treat the hypoglycemia)\b/i, { gel: 1 }],
    [/\b(cervical )?collar\b/i, { collar: 1 }],
    [/\bsplint/i, { splint: 1 }],
    [/\b(keep (him|her|the baby) warm|warmth|heat loss|blanket|warm, dry|dry (him|her) vigorously|dry vigorously|warm her|keep him warm)\b/i, { warm: 1 }],
    [/\bcooling\b|\bcool air\b/i, { cool: 1 }],
    [/\bgive aspirin|\baspirin \(chewed\)|\bgive aspirin,/i, { asa: 1 }],
    [/\b(assisting with her nitro|give nitro|another dose of nitro|her nitro\b)/i, { nitro: 1 }],
    [/\binhaler\b/i, { mdi: 1 }],
    [/\b(left side|left lateral|on (his|her) side|recovery position)\b/i, { side: 1 }]
  ];
  var CARE_OFF = [
    [/\b(stop everything|stop resuscitation)\b/i, { cpr: 0, bvm: 0, o2: 0 }],
    [/\bstop compressions\b|^stop, and deliver|before resuming compressions|check for a pulse right after/i, { cpr: 0 }],
    [/\bstop rescue breaths\b|compression-only/i, { bvm: 0 }],
    [/\bas soon as it arrives\b|before bothering with the AED|call for (the|an) AED|get the AED/i, { pads: 0 }],
    [/\babandon the collar\b/i, { collar: 0 }],
    [/\bstop (the aggressive )?cooling\b/i, { cool: 0 }],
    [/\b(skip naloxone|preparing naloxone)\b/i, { nalox: 0 }],
    [/\bdo not give anything by mouth\b/i, { gel: 0 }],
    [/\b(already used the inhaler)\b/i, { mdi: 0 }],
    [/\btime of epinephrine\b/i, { epi: 0 }],
    [/\boxygen only if\b/i, { o2: 0 }],
    [/\b(lift the dressing|blood pressure reading)\b/i, { gauze: 0 }]
  ];
  // after the birth, care for the newborn in an OB call goes to the baby, not the mother
  var NEWBORN_CARE = /\b(dry|stimulat|APGAR|cord|baby|newborn|positive-pressure|suction the mouth)/i;
  function care(seen, opt){
    var preg = !!(opt && opt.preg), st = {}, epi = 0, baby = false;
    seen.slice().reverse().forEach(function(n){
      var c = n.did;
      if(!c) return;
      if(preg && NEWBORN_CARE.test(c)){ baby = true; return; }
      CARE_ON.forEach(function(r){ if(r[0].test(c)) for(var k in r[1]) st[k] = r[1][k]; });
      CARE_OFF.forEach(function(r){ if(r[0].test(c)) for(var k in r[1]) st[k] = r[1][k]; });
      // each choice that gives it is a dose
      if(st.epi){ epi = /second dose/i.test(c) ? Math.max(2, epi + 1) : epi + 1; st.epi = 0; }
    });
    if(st.bvm) st.o2 = 0;           // the bag carries the oxygen; no mask under it
    if(st.blowby && !st.bvm){ st.o2 = 0; }
    var chips = [];
    if(st.tq) chips.push('Tourniquet on');
    else if(st.gauze) chips.push('Direct pressure');
    if(st.bvm) chips.push('BVM');
    if(st.o2) chips.push('Oxygen by mask');
    if(st.blowby && !st.bvm) chips.push('Blow-by oxygen');
    if(st.cpr) chips.push('CPR');
    if(st.pads) chips.push('AED pads on');
    if(epi) chips.push('Epinephrine' + (epi > 1 ? ' × ' + epi : ''));
    if(st.nalox) chips.push('Naloxone');
    if(st.gel) chips.push('Oral glucose');
    if(st.asa) chips.push('Aspirin');
    if(st.nitro) chips.push('Nitro assisted');
    if(st.mdi) chips.push('Inhaler');
    if(st.collar) chips.push('Collar');
    if(st.splint) chips.push('Splinted');
    if(st.side) chips.push('On her side'.replace('her', (opt && opt.he) ? 'his' : 'her'));
    if(st.warm) chips.push('Kept warm');
    if(st.cool) chips.push('Active cooling');
    if(baby) chips.push('Newborn care');
    return { on: st, epi: epi, chips: chips };
  }

  /* A finding the case later says has changed: the pin follows the newest
     word. [what the case says now, the pin words it cancels, the new words] */
  var RESOLVE = [
    [/\b(bleeding (stops|has stopped|is controlled|is under control)|stops the bleeding|bleeding is controlled|no longer bleeding)/i, /bleed/i, 'Bleeding controlled'],
    [/\b(starts? breathing|breathing on (his|her) own|begins to breathe|cries strongly|is crying|breathing better)/i, /Not breathing/, 'Breathing now'],
    [/\b(pulse (returns|is back)|has a pulse|ROSC|return of spontaneous circulation)/i, /No pulse/, 'Pulse back'],
    [/\b(grape|object|piece) (comes|pops|flies) out|\bis expelled\b|\bdislodges\b/i, /Choking/, 'Airway cleared'],
    [/\b(wakes|opens (his|her) eyes|becoming more responsive|more alert|answering)/i, /Unresponsive/, 'Waking']
  ];
  /* newest-first list of all sentences seen -> [{ re, words, at }] */
  function resolutions(seen){
    var out = [], i = 0;
    seen.forEach(function(n){
      sentences(n.text).forEach(function(s){
        i++;
        RESOLVE.forEach(function(r){ if(r[0].test(s)) out.push({ cancels: r[1], words: r[2], at: i }); });
      });
    });
    return out;
  }

  /* Pin words for the birth, newest sentence first: where the birth is now. */
  var BIRTH_WORDS = [
    [/\b(trunk is pink|cries strongly|grimaces)/i, 'Baby born, crying'], [/\b(body delivers|baby is blue|has not cried)/i, 'Baby born'],
    [/\bcord\b/i, 'Cord at the neck'], [/\bhead is delivered|delivers the head|head already delivering/i, 'Head delivered'],
    [/\bhead is advancing|crowning|top of the head at the vaginal/i, 'Crowning'], [/\bvaginal bleeding/i, 'Vaginal bleeding'],
    [/\bwater broke/i, 'Waters broken']
  ];
  function birthWords(list){
    // the newest step that says anything about the birth, then the furthest stage it names
    var now = list.filter(function(x){ return x.now; });
    var pool = now.some(function(x){ return BIRTH_WORDS.some(function(w){ return w[0].test(x.text); }); }) ? now : list;
    for(var j = 0; j < BIRTH_WORDS.length; j++) for(var i = 0; i < pool.length; i++) if(BIRTH_WORDS[j][0].test(pool[i].text)) return { text: BIRTH_WORDS[j][1], sev: /Crowning|Head delivered|Cord|bleeding/.test(BIRTH_WORDS[j][1]) };
    return { text: 'Birth', sev: false };
  }
  /* A pregnant patient (review 2026-11). In the OB calls the case also talks
     about the baby: "you see the top of the head at the vaginal opening" is
     the baby's head, crowning, not the mother's. When the patient is pregnant
     a sentence about the birth or the baby goes to its own place, the
     perineum and birth canal, and never to the mother's head, limbs, skin or
     primary survey; the abdomen keeps the uterus (contractions, a rigid or
     tender belly). */
  var BIRTH = { key: 'birth', label: 'Perineum and birth', re: /\b(crowning|vagina|perine|the head\b|head (is|already) |cord\b|shoulders?\b|baby|newborn|deliver|her trunk is|grimaces|cries strongly|has not cried|acrocyanosis|water broke)/i };
  var UTERUS = /\b(abdom|belly|uterus|uterine|pelvi|groin|contraction|fundus)/i;
  /* Weeks of pregnancy from the opening sentence: "at 34 weeks", "at full
     term" (taken as 40). null when the case does not say she is pregnant. */
  function pregnancy(text){
    var t = String(text || ''), m = t.match(/\bat (\d{2}) weeks\b/i);
    if(m) return +m[1];
    if(/\b(at|is) (full )?term\b|\bfull[- ]term\b/i.test(t) && !/\bnewborn\b/i.test(t)) return 40;
    if(/\bpregnan/i.test(t)) return 30;
    return null;
  }
  // which places a sentence of a pregnant patient's call goes to
  function keep(s){
    var birth = BIRTH.re.test(s);
    return function(r){
      if(r.key === 'abdomen') return UTERUS.test(s);
      return (r.key === 'birth' || !birth) && r.re.test(s);
    };
  }

  // newer words for a problem the case has since said is fixed
  function settle(hits, list, res){
    res.forEach(function(r){
      var bad = hits.filter(function(w){ return r.cancels.test(w[1]); });
      if(!bad.length) return;
      var newest = Math.min.apply(null, list.filter(function(x){ return bad.some(function(w){ return w[0].test(x.text); }); }).map(function(x){ return x.at || 1e9; }));
      if(r.at < newest){
        hits = [[/./, r.words, 0]].concat(hits.filter(function(w){ return bad.indexOf(w) < 0; }));
      }
    });
    return hits;
  }
  /* The pins the care changes: a controlled bleed under a tourniquet, the
     pregnant abdomen as the uterus, and the birth at the vaginal opening,
     below the pubis. */
  function pins(pt, items){
    var f = pt.fig, fs = pt.f || {}, c = pt.careNow;
    items.forEach(function(it){
      if(c && c.on.tq && (it.key === 'legs' || it.key === 'arms') && /controlled/i.test(it.what)){ it.what = 'Controlled by tourniquet'; it.sev = false; }
      if(pt.preg && it.key === 'abdomen') it.where = 'Uterus';
    });
    var bl = fs.birth || [];
    if(pt.preg && bl.length && pt.view === 'front' && f.landmarks && f.landmarks.pubis){
      var bw = birthWords(bl), p = f.landmarks.pubis, hr = (f.anchors.simHead || [0, 0, 44])[2];
      items.push({ key: 'birth', where: 'Perineum', what: bw.text, sev: bw.sev, fresh: bl.some(function(x){ return x.now; }), x: p[0], y: p[1] + hr * 0.35 });
    }
  }

  var CSS = [
    '.pt-gear{pointer-events:none;}',
    '.pt-care{position:absolute;left:8px;top:8px;right:8px;display:flex;flex-wrap:wrap;gap:4px;pointer-events:none;z-index:2;}',
    '.pt-care-chip{padding:3px 8px;border-radius:999px;background:var(--white);box-shadow:0 1px 3px rgba(20,40,35,.12),inset 0 0 0 1px var(--line);font:800 11.5px var(--font-ui);color:var(--good-text);}',
    '.pt-uterus .pt-ut-wall{fill:#E9A9A0;fill-opacity:.9;stroke:#B8645A;stroke-width:2;vector-effect:non-scaling-stroke;}',
    '.pt-fetus{fill:#F2C9B2;stroke:#B98468;stroke-width:1.5;vector-effect:non-scaling-stroke;}',
    '.pt-fetus-line{fill:none;stroke:#B98468;stroke-width:1.4;vector-effect:non-scaling-stroke;}',
    '.pt-crown{fill:none;stroke:#8C3B33;stroke-width:2.2;vector-effect:non-scaling-stroke;}',
    '.pt-gauze{fill:#FBFBF7;stroke:#CFCFC6;stroke-width:1;vector-effect:non-scaling-stroke;}',
    '.pt-stain{fill:#B2302B;opacity:.65;}',
    '.pt-tq{fill:#22282B;}',
    '.pt-tq-line{fill:#C9342A;}',
    '.pt-tq-rod{fill:#4B555A;stroke:#111;stroke-width:1;vector-effect:non-scaling-stroke;}',
    '.pt-tag{fill:#FFFDF4;stroke:#B9B39A;stroke-width:1;vector-effect:non-scaling-stroke;}',
    '.pt-tag-t{font-family:var(--font-mono);font-weight:800;fill:#22282B;}',
    '.pt-splint{fill:#E8D9A8;stroke:#A08B4E;stroke-width:1.2;vector-effect:non-scaling-stroke;}',
    '.pt-strap{fill:#3A4A5C;opacity:.85;}',
    '.pt-mask{fill:#DDF1EA;fill-opacity:.6;stroke:#4F8C7A;stroke-width:1.6;vector-effect:non-scaling-stroke;}',
    '.pt-res{fill:#BFE2D6;fill-opacity:.8;stroke:#6FA592;stroke-width:1.2;vector-effect:non-scaling-stroke;}',
    '.pt-tube{fill:none;stroke:#7FBFA9;stroke-width:3;stroke-linecap:round;vector-effect:non-scaling-stroke;}',
    '.pt-valve{fill:#2F6B5A;}',
    '.pt-bag{fill:#D9E2E6;stroke:#8A979E;stroke-width:1.5;vector-effect:non-scaling-stroke;}',
    '.pt-glove{fill:#7B8BE0;stroke:#4A5BB8;stroke-width:1.4;vector-effect:non-scaling-stroke;}',
    '.pt-glove2{fill:#6B7DD6;stroke:#4A5BB8;stroke-width:1.2;vector-effect:non-scaling-stroke;}',
    '.pt-glove-line{stroke:#3E4EA6;stroke-width:1.2;vector-effect:non-scaling-stroke;}',
    '.pt-pad{fill:#F4F1EA;stroke:#7A7A72;stroke-width:1.3;vector-effect:non-scaling-stroke;}',
    '.pt-pad-gel{fill:#E3B04B;opacity:.55;}',
    '.pt-collar{fill:#E8C77A;stroke:#9A7A2E;stroke-width:1.4;vector-effect:non-scaling-stroke;}',
    '.pt-collar-hole{fill:#5B4A2A;opacity:.55;}',
    '.pt-blanket{fill:#6A8DAB;fill-opacity:.82;}',
    '.pt-blanket-hem{fill:none;stroke:#B6CBDC;stroke-width:5;vector-effect:non-scaling-stroke;}',
    '.pt-ice{fill:#CFE8F7;stroke:#5E9CC4;stroke-width:1.4;vector-effect:non-scaling-stroke;}',
    '.pt-epi{fill:#F3E6C8;stroke:#8A6A2E;stroke-width:1.2;vector-effect:non-scaling-stroke;}',
    '.pt-epi-tip{fill:#E07A2E;}',
    '.pt-gel{fill:#E9EEF2;stroke:#6E7C86;stroke-width:1.2;vector-effect:non-scaling-stroke;}',
    '.pt-nalox{fill:#FFFFFF;stroke:#2F5E9E;stroke-width:1.4;vector-effect:non-scaling-stroke;}',
    '[data-theme="dark"] .pt-care-chip{background:var(--surface2);}'
  ].join('');
  function addStyle(){
    if(addStyle.done || typeof document === 'undefined' || !document.head) return;
    addStyle.done = true;
    var st = document.createElement('style');
    st.textContent = CSS;
    document.head.appendChild(st);
  }

  /* ---- The care on the body, and the pregnancy ------------------------------
     Drawn in the figure's own pixels from its landmarks (scripts/build-body-
     figures.mjs), sized by the head and limb radii, so the same code fits the
     adult, child, toddler and infant figures. Front view only, except an AED
     pad on the back for a small child's front-to-back placement. */
  function limbSite(f, fs){
    var hit = /\b(bleed|wound|spurt|lacerat|blood)/i;
    var legs = (fs.legs || []).filter(function(x){ return hit.test(x.text); });
    var arms = (fs.arms || []).filter(function(x){ return hit.test(x.text); });
    var list = legs.length ? legs : arms.length ? arms : (fs.legs || []).filter(function(x){ return /\b(hip|thigh|leg)\b/i.test(x.text); });
    if(!list.length) return null;
    var limb = legs.length || !arms.length ? 'leg' : 'arm';
    var txt = list.map(function(x){ return x.text; }).join(' ');
    var R = /\bright\b/i.test(txt), L = /\bleft\b/i.test(txt);
    var viewerLeft = R || !L;   // the patient's right is on the viewer's left
    return { limb: limb, viewerLeft: viewerLeft, hip: /\bhip\b/i.test(txt) && !/\bthigh\b/i.test(txt) };
  }
  Patient.prototype.paintGear = function(){
    addStyle();
    // the strip of care given, and the layer the care is drawn in (new with each drawing)
    if(!this.el.querySelector('.pt-care')){
      var strip = document.createElement('div');
      strip.className = 'pt-care'; strip.setAttribute('role', 'status'); strip.setAttribute('aria-label', 'Care given so far');
      this.stage.insertBefore(strip, this.el.querySelector('.pt-bar'));
    }
    if(this.fig && (!this.gearG || this.gearG.parentNode !== this.svg)) this.gearG = svgEl('g', { class: 'pt-gear', 'aria-hidden': 'true' }, this.svg);
    var g = this.gearG, f = this.fig, c = this.careNow, fs = this.f || {};
    var bar = this.el.querySelector('.pt-care');
    if(bar) bar.innerHTML = c && c.chips.length ? c.chips.map(function(t){ return '<span class="pt-care-chip">' + esc(t) + '</span>'; }).join('') : '';
    if(!g || !f) return;
    while(g.firstChild) g.removeChild(g.firstChild);
    var lm = f.landmarks || {}, an = f.anchors || {}, ln = f.lines || {};
    var head = an.simHead || [f.w / 2, 80, 44], r = head[2], cx = head[0];
    var chin = (lm.chin || [cx, head[1] + r * 1.4])[1];
    var on = (c && c.on) || {}, front = this.view === 'front';
    var E = function(tag, a, parent){ return svgEl(tag, a, parent || g); };
    var seenText = (this.seen || []).map(function(n){ return n.text; }).join(' ');

    // the pregnancy: the uterus at its height for the weeks, the baby head down
    if(this.preg && front && lm.pubis && lm.xiphoid && lm.umbilicus && lm.asisR && lm.asisL){
      var born = /\b(body delivers|delivers quickly|is born|baby is blue)\b/i.test(seenText);
      var wk = this.preg, top;
      if(born) top = lm.umbilicus[1];
      else if(wk >= 36) top = lm.xiphoid[1] + (lm.umbilicus[1] - lm.xiphoid[1]) * 0.08;
      else top = lm.umbilicus[1] - (lm.umbilicus[1] - lm.xiphoid[1]) * Math.max(0, Math.min(1, (wk - 20) / 16));
      var bot = lm.pubis[1] + r * 0.15, half = (lm.asisL[0] - lm.asisR[0]) / 2 * (born ? 0.62 : 0.98), mid = (lm.asisL[0] + lm.asisR[0]) / 2;
      var ut = E('g', { class: 'pt-uterus' });
      var hgt = bot - top;
      E('path', { class: 'pt-ut-wall', d: 'M' + mid + ' ' + top +
        ' C' + (mid + half * 1.05) + ' ' + top + ' ' + (mid + half * 1.12) + ' ' + (top + hgt * 0.55) + ' ' + (mid + half * 0.55) + ' ' + (bot - hgt * 0.06) +
        ' Q' + mid + ' ' + (bot + hgt * 0.04) + ' ' + (mid - half * 0.55) + ' ' + (bot - hgt * 0.06) +
        ' C' + (mid - half * 1.12) + ' ' + (top + hgt * 0.55) + ' ' + (mid - half * 1.05) + ' ' + top + ' ' + mid + ' ' + top + 'Z' }, ut);
      if(!born){
        // the baby, curled, head down; crowning puts the head at the opening
        var crown = /\b(crowning|top of the head at the vaginal|head is advancing|head (is )?deliver|head already delivering)/i.test(seenText);
        var hr2 = Math.min(half * 0.42, hgt * 0.17), hy = crown ? bot + hr2 * 0.15 : bot - hr2 * 1.25;
        var by = (top + hy) / 2 - hr2 * 0.2, brx = half * 0.62, bry = (hy - top) * 0.46;
        E('ellipse', { class: 'pt-fetus', cx: mid + half * 0.08, cy: by, rx: brx, ry: Math.max(bry, hr2) }, ut);
        E('path', { class: 'pt-fetus-line', d: 'M' + (mid - brx * 0.5) + ' ' + (by - bry * 0.2) + ' q' + (brx * 0.35) + ' ' + (bry * 0.5) + ' ' + (brx * 0.9) + ' ' + (bry * 0.35) + ' M' + (mid + brx * 0.1) + ' ' + (by - bry * 0.7) + ' q' + (-brx * 0.5) + ' ' + (bry * 0.1) + ' ' + (-brx * 0.6) + ' ' + (bry * 0.5) }, ut);
        E('circle', { class: 'pt-fetus', cx: mid, cy: hy, r: hr2 }, ut);
        if(crown) E('path', { class: 'pt-crown', d: 'M' + (mid - hr2 * 1.1) + ' ' + (bot + hr2 * 0.05) + ' Q' + mid + ' ' + (bot + hr2 * 0.55) + ' ' + (mid + hr2 * 1.1) + ' ' + (bot + hr2 * 0.05) }, ut);
      }
    }
    if(!front){
      if(on.pads && this.kind !== 'adult' && this.kind !== 'child' && lm.sternalAngle) padAt(E, cx, lm.sternalAngle[1] + r * 0.9, r * 0.9, r * 0.75, 0);
      return;
    }
    // the limb with the wound: gauze on it, the tourniquet above it
    var site = limbSite(f, fs);
    if(site && (on.tq || on.gauze || on.splint)){
      var paths = site.limb === 'leg' ? ['simLegL', 'simLegR'] : ['armL', 'armR'];
      var la = an[paths[site.viewerLeft ? 0 : 1]] || an[paths[0]];
      var lr = la[2] * (site.limb === 'leg' ? 1.12 : 0.95);
      var wy = site.limb === 'leg' ? (ln.groinY || la[1] - 200) + (la[1] - (ln.groinY || la[1] - 200)) * 0.78 : la[1] + lr * 0.4;
      var wx = la[0] + (site.viewerLeft ? 1 : -1) * lr * 0.12;
      if(on.splint){
        var y0 = site.hip ? (ln.hipY || wy - 200) : wy - lr * 3, y1 = f.h - 60;
        [-1, 1].forEach(function(sd){ E('rect', { class: 'pt-splint', x: wx + sd * (lr * 1.05) - lr * 0.18, y: y0, width: lr * 0.36, height: y1 - y0, rx: lr * 0.14 }); });
        for(var k = 0; k < 3; k++){ var yy = y0 + (y1 - y0) * (0.15 + k * 0.33); E('rect', { class: 'pt-strap', x: wx - lr * 1.3, y: yy, width: lr * 2.6, height: lr * 0.26, rx: lr * 0.1 }); }
      }
      if(on.gauze || on.tq){
        var gs = lr * 1.0;
        E('rect', { class: 'pt-gauze', x: wx - gs / 2, y: wy - gs * 0.45, width: gs, height: gs * 0.9, rx: gs * 0.08, transform: 'rotate(-10 ' + wx + ' ' + wy + ')' });
        if(!on.tq) E('ellipse', { class: 'pt-stain', cx: wx, cy: wy, rx: gs * 0.32, ry: gs * 0.26 });
      }
      if(on.tq){
        var ty = wy - lr * 1.3;
        E('rect', { class: 'pt-tq', x: la[0] - lr, y: ty - lr * 0.2, width: lr * 2, height: lr * 0.4, rx: lr * 0.12 });
        E('rect', { class: 'pt-tq-line', x: la[0] - lr, y: ty - lr * 0.04, width: lr * 2, height: lr * 0.08 });
        E('rect', { class: 'pt-tq-rod', x: la[0] - lr * 0.7, y: ty - lr * 0.1, width: lr * 1.4, height: lr * 0.2, rx: lr * 0.1, transform: 'rotate(-14 ' + la[0] + ' ' + ty + ')' });
        var tag = E('g', { transform: 'translate(' + (la[0] + (site.viewerLeft ? -lr * 2.9 : lr * 1.0)) + ' ' + (ty - lr * 1.15) + ')' });
        var noted = /\bnote(s|d)? the time\b|\btime of application\b/i.test(seenText);
        E('rect', { class: 'pt-tag', x: 0, y: 0, width: lr * 1.9, height: lr * 0.62, rx: lr * 0.1 }, tag);
        E('text', { class: 'pt-tag-t', x: lr * 0.95, y: lr * 0.43, 'font-size': lr * 0.36, 'text-anchor': 'middle' }, tag).textContent = noted ? 'TQ  time' : 'TQ';
      }
    }
    // the face: a mask (oxygen), the bag (BVM), blow-by held off the face
    var mouthY = chin - r * 0.6;
    if(on.cool){
      var pk = function(x, y, w, h){ E('rect', { class: 'pt-ice', x: x - w / 2, y: y - h / 2, width: w, height: h, rx: Math.min(w, h) * 0.3 }); };
      if(lm.sternalNotch){ pk(cx - r * 0.75, lm.sternalNotch[1] - r * 0.5, r * 0.5, r * 0.75); pk(cx + r * 0.75, lm.sternalNotch[1] - r * 0.5, r * 0.5, r * 0.75); }
      if(lm.midaxR && lm.midaxL){ pk(lm.midaxR[0] + r * 0.2, lm.midaxR[1] - r * 1.4, r * 0.55, r * 0.85); pk(lm.midaxL[0] - r * 0.2, lm.midaxL[1] - r * 1.4, r * 0.55, r * 0.85); }
      if(lm.pubis && lm.asisR){ pk((lm.pubis[0] + lm.asisR[0]) / 2, lm.pubis[1], r * 0.8, r * 0.5); pk((lm.pubis[0] + lm.asisL[0]) / 2, lm.pubis[1], r * 0.8, r * 0.5); }
    }
    if(on.warm && lm.umbilicus){
      var bt = (this.preg ? lm.pubis[1] + r * 0.6 : lm.umbilicus[1]), bx0 = (lm.asisR ? lm.asisR[0] : cx - r * 2) - r * 1.0, bx1 = (lm.asisL ? lm.asisL[0] : cx + r * 2) + r * 1.0;
      E('path', { class: 'pt-blanket', d: 'M' + bx0 + ' ' + (bt + r * 0.3) + ' Q' + cx + ' ' + (bt - r * 0.25) + ' ' + bx1 + ' ' + (bt + r * 0.3) + ' L' + (bx1 - r * 0.3) + ' ' + (f.h - 40) + ' L' + (bx0 + r * 0.3) + ' ' + (f.h - 40) + 'Z', 'clip-path': 'url(#' + this.uid + 'h)' });
      E('path', { class: 'pt-blanket-hem', d: 'M' + bx0 + ' ' + (bt + r * 0.3) + ' Q' + cx + ' ' + (bt - r * 0.25) + ' ' + bx1 + ' ' + (bt + r * 0.3), 'clip-path': 'url(#' + this.uid + 'h)' });
    }
    if(on.collar && lm.sternalNotch){
      var c0 = chin - r * 0.12, c1 = lm.sternalNotch[1] + r * 0.05, nw = ((an.simNeck || [cx, 0, r * 0.55])[2]) * 1.6;
      E('path', { class: 'pt-collar', d: 'M' + (cx - nw) + ' ' + c0 + ' Q' + cx + ' ' + (c0 + r * 0.25) + ' ' + (cx + nw) + ' ' + c0 + ' L' + (cx + nw * 1.08) + ' ' + c1 + ' Q' + cx + ' ' + (c1 + r * 0.2) + ' ' + (cx - nw * 1.08) + ' ' + c1 + 'Z' });
      E('rect', { class: 'pt-collar-hole', x: cx - r * 0.18, y: (c0 + c1) / 2 - r * 0.08, width: r * 0.36, height: r * 0.34, rx: r * 0.08 });
    }
    if(on.cpr && lm.sternalAngle && lm.xiphoid){
      var hy2 = lm.sternalAngle[1] + (lm.xiphoid[1] - lm.sternalAngle[1]) * 0.62, hw = r * (this.kind === 'infant' ? 0.32 : 0.62);
      if(this.kind === 'infant'){
        // two thumbs (or two fingers) on the lower sternum
        E('ellipse', { class: 'pt-glove', cx: cx - hw * 0.45, cy: hy2, rx: hw * 0.35, ry: hw * 0.6 });
        E('ellipse', { class: 'pt-glove', cx: cx + hw * 0.45, cy: hy2, rx: hw * 0.35, ry: hw * 0.6 });
      } else {
        E('path', { class: 'pt-glove', d: 'M' + (cx - hw) + ' ' + (hy2 + hw * 0.1) + ' Q' + (cx - hw) + ' ' + (hy2 - hw * 0.6) + ' ' + cx + ' ' + (hy2 - hw * 0.62) + ' Q' + (cx + hw) + ' ' + (hy2 - hw * 0.6) + ' ' + (cx + hw * 0.95) + ' ' + (hy2 + hw * 0.05) + ' L' + (cx + hw * 0.6) + ' ' + (hy2 + hw * 0.75) + ' L' + (cx - hw * 0.6) + ' ' + (hy2 + hw * 0.75) + 'Z' });
        E('path', { class: 'pt-glove2', d: 'M' + (cx - hw * 0.85) + ' ' + (hy2 - hw * 0.1) + ' Q' + cx + ' ' + (hy2 - hw * 0.5) + ' ' + (cx + hw * 0.85) + ' ' + (hy2 - hw * 0.1) + ' L' + (cx + hw * 0.55) + ' ' + (hy2 + hw * 0.55) + ' L' + (cx - hw * 0.55) + ' ' + (hy2 + hw * 0.55) + 'Z' });
        for(var fi = -1.5; fi <= 1.5; fi++) E('path', { class: 'pt-glove-line', d: 'M' + (cx + fi * hw * 0.32) + ' ' + (hy2 - hw * 0.35) + ' l0 ' + (-hw * 0.2) });
      }
    }
    if(on.pads && lm.clavicleMidR && lm.midaxL){
      if(this.kind === 'adult' || this.kind === 'child'){
        padAt(E, lm.clavicleMidR[0] + r * 0.15, lm.clavicleMidR[1] + r * 0.95, r * 1.0, r * 0.75, -8);
        padAt(E, lm.midaxL[0] - r * 0.35, (lm.heartApex || lm.midaxL)[1] + r * 0.55, r * 1.0, r * 0.75, -65);
      } else padAt(E, cx, lm.sternalAngle ? lm.sternalAngle[1] + r * 0.55 : chin + r * 2, r * 0.8, r * 0.68, 0);
    }
    if(on.epi && lm.asisL){
      var la2 = an.simLegR || an.legR, ey = (ln.groinY || la2[1] - 200) + (la2[1] - (ln.groinY || la2[1] - 200)) * 0.4, ex = la2[0] + la2[2] * 0.7;
      E('rect', { class: 'pt-epi', x: ex - r * 0.16, y: ey - r * 0.75, width: r * 0.32, height: r * 1.5, rx: r * 0.14, transform: 'rotate(18 ' + ex + ' ' + ey + ')' });
      E('rect', { class: 'pt-epi-tip', x: ex - r * 0.16, y: ey + r * 0.45, width: r * 0.32, height: r * 0.3, rx: r * 0.08, transform: 'rotate(18 ' + ex + ' ' + ey + ')' });
    }
    if(on.gel) E('rect', { class: 'pt-gel', x: cx - r * 0.95, y: mouthY - r * 0.2, width: r * 0.6, height: r * 0.26, rx: r * 0.1, transform: 'rotate(-20 ' + (cx - r * 0.65) + ' ' + mouthY + ')' });
    if(on.nalox){
      var ny = chin - r * 0.95;
      E('rect', { class: 'pt-nalox', x: cx + r * 0.05, y: ny - r * 0.05, width: r * 0.22, height: r * 0.7, rx: r * 0.08, transform: 'rotate(-25 ' + cx + ' ' + ny + ')' });
    }
    if(on.bvm){
      E('ellipse', { class: 'pt-mask', cx: cx, cy: mouthY - r * 0.12, rx: r * 0.5, ry: r * 0.6 });
      E('rect', { class: 'pt-valve', x: cx - r * 0.16, y: mouthY - r * 0.35, width: r * 0.32, height: r * 0.3, rx: r * 0.06 });
      E('path', { class: 'pt-tube', d: 'M' + (cx + r * 0.16) + ' ' + (mouthY - r * 0.2) + ' Q' + (cx + r * 0.9) + ' ' + (mouthY - r * 0.5) + ' ' + (cx + r * 1.15) + ' ' + (mouthY - r * 1.0) });
      E('ellipse', { class: 'pt-bag', cx: cx + r * 1.55, cy: mouthY - r * 1.45, rx: r * 0.42, ry: r * 0.78, transform: 'rotate(35 ' + (cx + r * 1.55) + ' ' + (mouthY - r * 1.45) + ')' });
    } else if(on.o2 || on.blowby){
      var off = on.blowby && !on.o2 ? r * 0.55 : 0;
      if(!on.blowby || on.o2) E('ellipse', { class: 'pt-res', cx: cx, cy: chin + r * 0.5, rx: r * 0.5, ry: r * 0.42 });
      E('path', { class: 'pt-tube', d: 'M' + (cx + r * 0.35) + ' ' + (chin + r * 0.2 - off) + ' Q' + (cx + r * 1.4) + ' ' + (chin + r * 0.6) + ' ' + (cx + r * 2.2) + ' ' + (chin + r * 0.2) });
      E('ellipse', { class: 'pt-mask', cx: cx + off, cy: mouthY - r * 0.12 - off * 0.3, rx: r * 0.44, ry: r * 0.56 });
    }
  };
  function padAt(E, x, y, w, h, rot){
    var p = E('g', { transform: 'rotate(' + rot + ' ' + x + ' ' + y + ')' });
    E('rect', { class: 'pt-pad', x: x - w / 2, y: y - h / 2, width: w, height: h, rx: h * 0.18 }, p);
    E('rect', { class: 'pt-pad-gel', x: x - w * 0.36, y: y - h * 0.3, width: w * 0.72, height: h * 0.6, rx: h * 0.12 }, p);
  }

  S.care = { care: care, resolutions: resolutions, birthWords: birthWords, pregnancy: pregnancy, keep: keep, BIRTH: BIRTH, settle: settle, pins: pins };
  S.pure.care = care; S.pure.resolutions = resolutions; S.pure.birthWords = birthWords; S.pure.pregnancy = pregnancy;
})();
