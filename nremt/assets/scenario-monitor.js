/* The scenario simulator's live patient: a monitor and a body to examine.

   ONE JOB: put the patient in front of the student, so the numbers move
   because of what they chose and a finding is something they go and look for.

   NOTHING HERE IS INVENTED. Every number on the monitor is a number the case
   already prints in that node's `vitals` line (scenario-sim.html). Between
   nodes the values slide from the old to the new; nothing in between is a
   claim, only motion. A tile the node does not mention shows a dash, not the
   last value: a vital nobody took is not a vital.

   HESITATION. At a few forks the case itself says what waiting costs: one of
   the choices is "wait / do something else first", and the node it leads to
   prints worse vitals. Only at those forks (HESITATE, below, checked by
   scripts/test/nremt-cases.test.mjs) does the monitor drift, slowly, from the
   current values toward that node's values while the student decides, and it
   never goes past them. Labeled as simulated.

   FLAGS. A value is flagged against the site's own reference card for the
   patient's age (REF, the same numbers as reference-cards.html, pinned by the
   test) and the formulary's hypoxia line (SpO2 under 94%). No other ranges.

   THE BODY. Tapping a region lists the sentences from what the student has
   seen in this call (node text and the vitals line) that mention it. If the
   case says nothing about the legs, it says so. */
(function(){
  'use strict';

  /* ---- Reference ranges: reference-cards.html "Pediatric vital signs" ---- */
  // [label, from (months, inclusive), to (months, exclusive), HR, RR, SBP low (array = range in the card)]
  var REF = [
    { key: 'newborn',    label: 'Newborn (0–1 mo)',     from: 0,   to: 1,   hr: [100, 180], rr: [30, 60], sbp: [60] },
    { key: 'infant',     label: 'Infant (1–12 mo)',     from: 1,   to: 12,  hr: [100, 160], rr: [25, 50], sbp: [70] },
    { key: 'toddler',    label: 'Toddler (1–3 y)',      from: 12,  to: 36,  hr: [90, 150],  rr: [20, 30], sbp: [72, 76] },
    { key: 'preschool',  label: 'Preschool (3–6 y)',    from: 36,  to: 72,  hr: [80, 140],  rr: [20, 25], sbp: [76, 82] },
    { key: 'school',     label: 'School age (6–12 y)',  from: 72,  to: 144, hr: [70, 120],  rr: [15, 20], sbp: [82, 90] },
    { key: 'adolescent', label: 'Adolescent (12–18 y)', from: 144, to: 216, hr: [60, 100],  rr: [12, 20], sbp: [90] },
    { key: 'adult',      label: 'Adult',                     from: 216, to: 1e9, hr: [60, 100],  rr: [12, 20], sbp: [90, 140] }
  ];
  var SPO2_LOW = 94; // formulary.html, Oxygen: "Hypoxia (SpO2 under 94% on room air)"

  function refFor(months){
    if(months == null || !isFinite(months)) return null;
    for(var i = 0; i < REF.length; i++) if(months >= REF[i].from && months < REF[i].to) return REF[i];
    return REF[REF.length - 1];
  }

  /* Lowest acceptable systolic. reference-cards.html: "For a child aged 1 to
     10, ... roughly 70 + (2 x age in years)"; otherwise the row's figure
     (the lower end where the card gives a range, the adult 90). */
  function sbpLow(months){
    var r = refFor(months);
    if(!r) return null;
    if(months >= 12 && months < 132) return 70 + 2 * Math.floor(months / 12);
    /* Past 10 the floor stays at 90 (PALS); the school-age row's 82–90 means
       90 at its older end. */
    if(months >= 132 && r.key !== 'adult' && r.sbp.length > 1) return r.sbp[r.sbp.length - 1];
    return r.sbp[0];
  }

  /* 'normal' | 'low' | 'high' | null (no rule for it). */
  function judge(kind, value, months){
    if(value == null || !isFinite(value)) return null;
    if(kind === 'spo2') return value < SPO2_LOW ? 'low' : 'normal';
    var r = refFor(months);
    if(!r) return null;
    if(kind === 'hr' || kind === 'rr'){
      var band = r[kind];
      return value < band[0] ? 'low' : value > band[1] ? 'high' : 'normal';
    }
    if(kind === 'sbp'){
      var lo = sbpLow(months);
      if(value < lo) return 'low';
      if(r.key === 'adult' && value > r.sbp[1]) return 'high';
      return 'normal';
    }
    return null;
  }

  /* ---- Patient age, from the case's opening sentence -------------------- */
  var WORDS = { one:1, two:2, three:3, four:4, five:5, six:6, seven:7, eight:8, nine:9, ten:10, eleven:11, twelve:12 };
  function ageMonths(text){
    var t = String(text || '');
    if(/\bnewborn\b/i.test(t)) return 0;
    var m = t.match(/\b(\d+|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)[- ](year|month|week)s?[- ]old\b/i);
    if(!m) return null;
    var n = /\d/.test(m[1]) ? parseInt(m[1], 10) : WORDS[m[1].toLowerCase()];
    var unit = m[2].toLowerCase();
    return unit === 'year' ? n * 12 : unit === 'month' ? n : n / 4.345;
  }
  function ageWords(months){
    if(months == null) return 'this patient';
    if(months === 0) return 'a newborn';
    if(months < 24) return 'a ' + Math.round(months) + '-month-old';
    return 'a ' + Math.floor(months / 12) + '-year-old';
  }

  /* ---- The vitals line ---------------------------------------------------- */
  /* "HR 118 · BP 108/70 · RR 22 · SpO₂ 96% · Temp 103.1 °F" and its variants.
     Whatever is not one of the four monitor values stays as a note, worded
     exactly as the case wrote it. */
  function parseVitals(str){
    var o = { hr: null, sys: null, dia: null, rr: null, rrText: '', spo2: null, pulseless: false, notes: [] };
    if(!str) return o;
    String(str).split(/\s*·\s*/).forEach(function(part){
      var p = part.trim(), m, used = false;
      if(!p) return;
      if((m = p.match(/\bHR (\d+)/))){ o.hr = +m[1]; used = true; }
      if((m = p.match(/\bBP (\d+)\/(\d+)/))){ o.sys = +m[1]; o.dia = +m[2]; used = !/lying|sitting/.test(p); }
      if((m = p.match(/\bRR (?:assisted at |~)?(\d+)/))){ o.rr = +m[1]; used = !/shallow|Observed/.test(p); if(/assisted/.test(p)) o.rrText = 'assisted'; }
      else if(/\bRR \(?assisted\)?/.test(p)){ o.rrText = 'assisted'; used = true; }
      if((m = p.match(/SpO(?:₂|2) (\d+)%/))){ o.spo2 = +m[1]; used = true; }
      if(/\bno pulse\b/i.test(p)){ o.pulseless = true; used = true; }
      if(/^(no breathing|no normal breathing)$/i.test(p)){ o.rr = 0; o.rrText = 'none'; used = true; }
      if(/^agonal respirations$/i.test(p)){ o.rrText = 'agonal'; used = true; }
      if(/^CPR in progress$/i.test(p)){ o.pulseless = true; o.notes.push(p); used = true; }
      if(!used) o.notes.push(p);
    });
    // "Observed: diaphoretic, RR 26" keeps its wording as a note too.
    return o;
  }

  /* ---- Time-critical forks ------------------------------------------------- */
  /* fork node -> the node a "wait / something else first" choice leads to.
     The drift heads for THAT node's printed vitals and stops there. */
  var HESITATE = {
    s1_start: 's1_delayed',
    s1_lifted_dressing: 's1_wait_worse',
    s1_pressure_still_bleeding: 's1_wait_worse',
    s5_start: 's5_wait_bad',
    s5_assess_good: 's5_delay_call',
    s8_start: 's8_recovery_bad',
    s11_treated: 's11_missed',
    s12_start: 's12_reassured',
    s16_start: 's16_underestimated',
    s23_start: 's23_delayed'
  };
  var GRACE_MS = 6000, DRIFT_MS = 45000;

  /* Pure: where the drift has got to after `ms` of hesitation. */
  function driftAt(from, to, ms){
    var f = Math.max(0, Math.min(1, (ms - GRACE_MS) / DRIFT_MS));
    var out = {};
    ['hr', 'sys', 'dia', 'rr', 'spo2'].forEach(function(k){
      out[k] = (from[k] != null && to[k] != null) ? from[k] + (to[k] - from[k]) * f : from[k];
    });
    out.f = f;
    return out;
  }

  /* ---- Findings from the case text ----------------------------------------- */
  var REGIONS = [
    { key: 'head',    label: 'Head and face', re: /\b(head|face|facial|pupils?|eyes?(?! protection)|lips?|mouth|jaw|fontanelle|speech|slurr|nose|drool|forehead|grimace)/i },
    { key: 'neck',    label: 'Neck and airway', re: /\b(neck|throat|airway|chok|cough|stridor|swallow|voice|noise on the way in|gurgl|bark)/i },
    { key: 'chest',   label: 'Chest and breathing', re: /\b(chest|ribs?|lungs?|wheez|crackles|breath|breathing|retraction|flaring|apneic|respirat)/i },
    { key: 'abdomen', label: 'Abdomen and pelvis', re: /\b(abdom|belly|uterus|pelvi|vagina|groin|contraction|crowning|cord)/i },
    { key: 'arms',    label: 'Arms and hands', re: /\b(arms?|hands?|wrists?|fingers?|needle)\b/i },
    { key: 'legs',    label: 'Legs and feet', re: /\b(legs?|thighs?|knees?|hips?|ankles?|feet|foot)\b/i },
    { key: 'skin',    label: 'Skin', re: /\b(skin|pale|sweat|clammy|mottl|blotch|diaphore|hives|flush|cyan|blue|grey|gray|color|colour|hot|warm|cool|bruis)/i }
  ];
  /* The back view's region. Not in REGIONS: it would change what the front
     regions find (a "back blows" sentence is not a finding about the back of
     the body), so it only matches the body's own back, buttocks and spine. */
  var BACK = { key: 'back', label: 'Back and spine', re: /\b(back of (his|her|the) (body|trunk|chest)|across (his|her|the) (upper |lower )?back|on (his|her) back\b(?! seat)|upper back|lower back|spine|spinal|buttock)/i };
  var SURVEY = [
    { key: 'ms',   label: 'Mental status', re: /\b(alert|confused|unresponsive|responsive|drowsy|oriented|hard to wake|sleepy|agitated|awake|does not know|limp|floppy|answering|talking|quiet|seiz|shouting|wandering)/i },
    { key: 'air',  label: 'Airway', re: /\b(airway|chok|throat|stridor|drool|swallow|voice|noise on the way in|gurgl|bark|tight)/i },
    { key: 'brth', label: 'Breathing', re: /\b(breath|breathing|wheez|crackles|retraction|flaring|apneic|respirat|SpO|saturation|cough)/i },
    { key: 'circ', label: 'Circulation', re: /\b(pulse|bleed|blood|pale|sweat|clammy|mottl|blotch|capillary|cap refill|skin|blue|cyan|diaphore|heart rate)/i }
  ];
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

  var DCAP = [
    ['D', 'Deformity', /\b(deform|shortened|rotated)/i],
    ['C', 'Contusion', /\b(bruis|contusion)/i],
    ['A', 'Abrasion', /\babras/i],
    ['P', 'Puncture', /\b(puncture|penetrat)/i],
    ['B', 'Burn', /\bburn(ed)?\b/i],
    ['T', 'Tenderness', /\b(tender|winces|cries when)/i],
    ['L', 'Laceration', /\blacerat/i],
    ['S', 'Swelling', /\bswell/i]
  ];

  function sentences(text){
    return String(text || '').replace(/\s+/g, ' ').split(/(?<=[.!?]["”']?)\s+(?=[A-Z"“'])/).map(function(s){ return s.trim(); }).filter(Boolean);
  }

  /* Pure: findings for each region / survey item from a list of seen nodes,
     newest first. [{ text, vitals, now }] -> { head: [{ text, now, dcap }] } */
  function findings(seen, opt){
    var out = {}, preg = !!(opt && opt.preg);
    REGIONS.concat(SURVEY, [BACK, BIRTH]).forEach(function(r){ out[r.key] = []; });
    var dupe = {}, at = 0;
    seen.forEach(function(n){
      var bits = sentences(n.text), first = at + 1, nText = bits.length;
      at += nText;
      parseVitals(n.vitals).notes.forEach(function(x){ bits.push(x.replace(/^Observed:\s*/i, '')); });
      bits.forEach(function(s, bi){
        var pos = bi < nText ? first + bi : at;
        var birth = preg && BIRTH.re.test(s);
        (preg ? REGIONS.concat(SURVEY, [BACK, BIRTH]) : REGIONS.concat(SURVEY, [BACK])).forEach(function(r){
          if(preg){
            if(r.key === 'abdomen'){ if(!UTERUS.test(s)) return; }
            else if(r.key !== 'birth' && birth) return;
          }
          if(r.key !== 'abdomen' || !preg) if(!r.re.test(s)) return;
          var k = r.key + '|' + s;
          if(dupe[k]) return;
          dupe[k] = true;
          var tags = DCAP.filter(function(d){ return d[2].test(s); }).map(function(d){ return d[0]; });
          out[r.key].push({ text: s, now: !!n.now, dcap: tags, at: pos });
        });
      });
    });
    return out;
  }

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

  /* ---- DOM helpers ---------------------------------------------------------- */
  function esc(s){
    return String(s == null ? '' : s).replace(/[&<>"]/g, function(c){ return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c]; });
  }
  function reduced(){
    return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }
  function token(name, fallback){
    try{ return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback; }catch(e){ return fallback; }
  }
  var NS = 'http://www.w3.org/2000/svg';

  /* ---- The monitor ------------------------------------------------------------ */
  function Monitor(opts){
    var self = this;
    this.months = opts.months;
    this.shown = { hr: null, sys: null, dia: null, rr: null, spo2: null };
    this.target = parseVitals('');
    this.el = document.createElement('section');
    this.el.className = 'mon';
    this.el.setAttribute('aria-label', 'Patient monitor, simulated');
    this.el.innerHTML =
      '<div class="mon-top"><span class="mon-live" aria-hidden="true"></span><span class="mon-title">Monitor</span>' +
        '<span class="mon-sim">Simulated · numbers from the case</span></div>' +
      '<div class="mon-screen">' +
      '<div class="mon-body">' +
        '<div class="mon-traces" aria-hidden="true">' +
          '<div class="mon-lane mon-lane-ecg"><span class="mon-lane-l">II <i>ECG</i></span><span class="mon-lane-r">×1</span><canvas class="mon-ecg"></canvas><span class="mon-off" data-off="ecg"></span></div>' +
          '<div class="mon-lane mon-lane-pleth"><span class="mon-lane-l">Pleth</span><canvas class="mon-pleth"></canvas><span class="mon-off" data-off="pleth"></span></div>' +
        '</div>' +
        '<div class="mon-tiles">' +
          tile('hr', 'HR', '/min', '<svg class="mon-heart" viewBox="0 0 12 11" aria-hidden="true"><path d="M6 10.4 C2.6 7.7 .5 5.9 .5 3.6 C.5 1.8 1.9 .5 3.5 .5 C4.6 .5 5.5 1.1 6 2 C6.5 1.1 7.4 .5 8.5 .5 C10.1 .5 11.5 1.8 11.5 3.6 C11.5 5.9 9.4 7.7 6 10.4 Z"/></svg>') +
          tile('spo2', 'SpO₂', '%', '<span class="mon-bar" aria-hidden="true"><i></i></span>') +
          tile('bp', 'NIBP', 'mmHg', '') + tile('rr', 'RR', '/min', '') +
        '</div>' +
      '</div>' +
      '</div>' +
      '<div class="mon-notes"></div>' +
      '<div class="mon-drift" hidden></div>' +
      '<p class="sr-only mon-sr"></p>';
    function tile(k, l, u, extra){
      return '<div class="mon-tile" data-k="' + k + '"><span class="mon-k">' + l + extra + '</span>' +
        '<span class="mon-v">—</span><span class="mon-u">' + u + '</span><span class="mon-flag"></span></div>';
    }
    this.ecg = this.el.querySelector('.mon-ecg');
    this.pleth = this.el.querySelector('.mon-pleth');
    this.phase = 0; this.pphase = 0; this.last = 0; this.raf = 0; this.tween = null;
    this.drift = null;
    this.loop = function(t){ self.frame(t); };
    this.raf = requestAnimationFrame(this.loop);
  }

  Monitor.prototype.destroy = function(){
    cancelAnimationFrame(this.raf); this.raf = 0;
    this.stopDrift();
    if(this.el.parentNode) this.el.parentNode.removeChild(this.el);
  };

  /* Show a node's vitals. `hesitateTo` is the vitals string of the node waiting
     costs, when this is a time-critical fork. */
  Monitor.prototype.show = function(vitals, hesitateTo){
    var v = parseVitals(vitals);
    this.target = v;
    this.stopDrift();
    var from = {}, self = this;
    ['hr', 'sys', 'dia', 'rr', 'spo2'].forEach(function(k){ from[k] = self.shown[k]; });
    this.tween = { from: from, to: v, t0: performance.now(), dur: reduced() ? 0 : 1100 };
    if(this.tween.dur === 0) this.applyTween(1);
    // Notes: the case's own words for everything that is not a monitor number.
    var notes = this.el.querySelector('.mon-notes');
    notes.innerHTML = v.notes.map(function(n){ return '<span class="mon-note">' + esc(n) + '</span>'; }).join('');
    notes.hidden = !v.notes.length;
    var parts = [];
    if(v.pulseless) parts.push('no pulse');
    if(v.hr != null) parts.push('heart rate ' + v.hr);
    if(v.spo2 != null) parts.push('oxygen saturation ' + v.spo2 + ' percent');
    if(v.sys != null) parts.push('blood pressure ' + v.sys + ' over ' + v.dia);
    if(v.rr != null) parts.push('respirations ' + v.rr + (v.rrText === 'assisted' ? ', assisted' : ''));
    this.el.querySelector('.mon-sr').textContent = parts.length ? 'Monitor: ' + parts.join(', ') + '.' : 'Monitor: no numbers in this part of the call.';
    if(hesitateTo) this.startDrift(v, parseVitals(hesitateTo));
  };

  Monitor.prototype.applyTween = function(f){
    var tw = this.tween, s = this.shown;
    ['hr', 'sys', 'dia', 'rr', 'spo2'].forEach(function(k){
      var a = tw.from[k], b = tw.to[k];
      if(b == null){ s[k] = null; return; }
      s[k] = (a == null) ? b : a + (b - a) * f;
    });
    this.paint();
  };

  Monitor.prototype.startDrift = function(from, to){
    var self = this;
    this.drift = { from: from, to: to, t0: Date.now(), said: false };
    this.driftTimer = setInterval(function(){
      if(!self.drift) return;
      var ms = Date.now() - self.drift.t0;
      var d = driftAt(self.drift.from, self.drift.to, ms);
      if(d.f <= 0) return;
      ['hr', 'sys', 'dia', 'rr', 'spo2'].forEach(function(k){ if(self.target[k] != null && d[k] != null) self.shown[k] = d[k]; });
      self.tween = null;
      self.paint();
      var box = self.el.querySelector('.mon-drift');
      box.hidden = false;
      box.textContent = d.f >= 1
        ? 'Simulated: this is where the case says waiting takes the patient.'
        : 'Simulated: the patient is getting worse while you decide.';
      self.el.classList.add('is-drifting');
      if(!self.drift.said && window.LevlAnnounce){
        self.drift.said = true;
        window.LevlAnnounce.say('The monitor is trending worse while you decide.');
      }
    }, 500);
  };
  Monitor.prototype.stopDrift = function(){
    if(this.driftTimer){ clearInterval(this.driftTimer); this.driftTimer = 0; }
    this.drift = null;
    var box = this.el.querySelector('.mon-drift');
    if(box){ box.hidden = true; box.textContent = ''; }
    this.el.classList.remove('is-drifting');
  };
  Monitor.prototype.hesitation = function(){
    return this.drift ? Date.now() - this.drift.t0 : 0;
  };

  Monitor.prototype.paint = function(){
    var s = this.shown, t = this.target, m = this.months, el = this.el;
    function set(k, text, flag){
      var tl = el.querySelector('.mon-tile[data-k="' + k + '"]');
      tl.querySelector('.mon-v').textContent = text;
      tl.classList.toggle('is-low', flag === 'low');
      tl.classList.toggle('is-high', flag === 'high');
      tl.classList.toggle('is-none', text === '—');
      tl.querySelector('.mon-flag').textContent = flag === 'low' ? 'low' : flag === 'high' ? 'high' : '';
    }
    var r = function(x){ return Math.round(x); };
    set('hr', t.pulseless ? '0' : s.hr == null ? '—' : r(s.hr), t.pulseless ? 'low' : judge('hr', s.hr, m));
    set('spo2', s.spo2 == null ? '—' : r(s.spo2), judge('spo2', s.spo2, m));
    // No saturation in the case yet: the probe is not on, which is what a real monitor would show (audit 2026-10).
    el.querySelector('.mon-tile[data-k="spo2"] .mon-u').textContent = s.spo2 == null ? 'probe not on yet' : '%';
    set('bp', s.sys == null ? '—' : r(s.sys) + '/' + r(s.dia), judge('sbp', s.sys, m));
    set('rr', s.rr == null ? (t.rrText === 'assisted' ? 'BVM' : t.rrText === 'agonal' ? 'agonal' : '—') : r(s.rr), t.rrText === 'assisted' || t.rrText === 'agonal' ? null : judge('rr', s.rr, m));
    var rrTile = el.querySelector('.mon-tile[data-k="rr"] .mon-u');
    rrTile.textContent = t.rrText === 'assisted' ? (s.rr == null ? 'assisted' : '/min, assisted') : '/min';
    el.querySelector('[data-off="ecg"]').textContent = t.pulseless ? 'No pulse' : s.hr == null ? 'Not measured' : '';
    el.querySelector('[data-off="pleth"]').textContent = s.spo2 == null ? 'Pulse ox not on yet' : '';
  };

  /* Stylized traces. The ECG is a rate marker drawn as a generic complex, not
     a rhythm to interpret (EMTs do not read rhythms; the label says
     simulated). */
  function ecgY(p){
    // p in [0,1) through one beat
    if(p < 0.10) return 0;
    if(p < 0.16) return 0.12 * Math.sin((p - 0.10) / 0.06 * Math.PI);     // P
    if(p < 0.22) return 0;
    if(p < 0.24) return -0.12 * (p - 0.22) / 0.02;                         // Q
    if(p < 0.27) return -0.12 + 1.12 * (p - 0.24) / 0.03;                  // R up
    if(p < 0.30) return 1 - 1.25 * (p - 0.27) / 0.03;                      // R down
    if(p < 0.32) return -0.25 + 0.25 * (p - 0.30) / 0.02;                  // S
    if(p < 0.44) return 0;
    if(p < 0.58) return 0.22 * Math.sin((p - 0.44) / 0.14 * Math.PI);     // T
    return 0;
  }
  function plethY(p){
    if(p < 0.35) return Math.sin(p / 0.35 * Math.PI / 2);
    var q = (p - 0.35) / 0.65;
    return Math.max(0, 1 - q) * (0.75 + 0.18 * Math.sin(q * Math.PI * 1.6)) ;
  }

  Monitor.prototype.frame = function(t){
    this.raf = requestAnimationFrame(this.loop);
    if(this.tween && this.tween.dur){
      var f = Math.min(1, (t - this.tween.t0) / this.tween.dur);
      this.applyTween(1 - Math.pow(1 - f, 3));
      if(f >= 1) this.tween = null;
    }
    var dt = this.last ? Math.min(0.1, (t - this.last) / 1000) : 0;
    this.last = t;
    var still = reduced();
    var hr = this.target.pulseless ? null : this.shown.hr;
    // the heart's own clock: beats advance at the shown rate, so a sweeping
    // monitor writes each beat once where it happened
    var prev = this.beat || 0;
    if(hr != null && !still) this.beat = prev + dt * hr / 60;
    if(hr != null && !still && Math.floor(this.beat - 0.27) > Math.floor(prev - 0.27)){
      var tl = this.el.querySelector('.mon-tile[data-k="hr"]');
      if(tl){ tl.classList.remove('is-beat'); void tl.offsetWidth; tl.classList.add('is-beat'); }
    }
    this.drawLane(this.ecg, hr, ecgY, 'ecg', dt, still);
    this.drawLane(this.pleth, this.shown.spo2 == null ? null : hr, plethY, 'pleth', dt, still);
    var bar = this.el.querySelector('.mon-bar i');
    if(bar){ var sp = this.shown.spo2; bar.style.height = sp == null ? '0' : Math.max(0, Math.min(100, (sp - 70) / 30 * 100)).toFixed(0) + '%'; }
  };

  Monitor.prototype.drawLane = function(cv, rate, fn, kind, dt, still){
    if(!cv.isConnected) return;
    var w = cv.clientWidth, h = cv.clientHeight, dpr = Math.min(2, window.devicePixelRatio || 1);
    if(!w || !h) return;
    if(cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)){ cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); }
    var ctx = cv.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    // monitor colours: ECG green, pleth cyan (the convention on bedside monitors)
    var col = kind === 'ecg' ? '#3DF08B' : '#3CD7F2';
    var mid = kind === 'ecg' ? h * 0.64 : h * 0.86, amp = kind === 'ecg' ? h * 0.5 : h * 0.66;
    var secs = 4; // seconds across the strip
    if(kind === 'ecg'){
      // faint ECG paper grid: 0.2 s major squares
      ctx.strokeStyle = 'rgba(61,240,139,0.07)'; ctx.lineWidth = 1; ctx.beginPath();
      for(var gx = 0; gx <= w; gx += w / (secs * 5)){ ctx.moveTo(Math.round(gx) + 0.5, 0); ctx.lineTo(Math.round(gx) + 0.5, h); }
      for(var gy = mid % (w / (secs * 5)); gy <= h; gy += w / (secs * 5)){ ctx.moveTo(0, Math.round(gy) + 0.5); ctx.lineTo(w, Math.round(gy) + 0.5); }
      ctx.stroke();
    }
    ctx.lineWidth = 1.8; ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.strokeStyle = col;
    if(rate == null){
      ctx.globalAlpha = 0.45; ctx.setLineDash([4, 5]);
      ctx.beginPath(); ctx.moveTo(0, mid); ctx.lineTo(w, mid); ctx.stroke();
      ctx.setLineDash([]); ctx.globalAlpha = 1;
      return;
    }
    var bps = rate / 60;
    var key = kind === 'ecg' ? 'phase' : 'pphase';
    if(!still) this[key] = (this[key] + dt / secs) % 1;
    var head = still ? 1 : this[key];       // sweep position 0..1
    var now = (this.beat || 0) - (kind === 'pleth' ? 0.18 * bps : 0);   // the pulse reaches the finger a little after the R wave
    var gap = 0.035;
    function path(fill){
      ctx.beginPath();
      var started = false, x0 = 0;
      for(var x = 0; x <= w; x += 1){
        var u = x / w;
        if(!still && u > head && u < head + gap){ if(started && fill){ ctx.lineTo(x - 1, mid + 2); ctx.lineTo(x0, mid + 2); ctx.closePath(); } started = false; continue; }
        var age = still ? (1 - u) * secs : ((head - u + 1) % 1) * secs;
        var p = (((now - age * bps) % 1) + 1) % 1;
        var y = mid - fn(p) * amp;
        if(!started){ if(fill){ ctx.moveTo(x, mid + 2); x0 = x; ctx.lineTo(x, y); } else ctx.moveTo(x, y); started = true; } else ctx.lineTo(x, y);
      }
      if(fill && started){ ctx.lineTo(w, mid + 2); ctx.lineTo(x0, mid + 2); ctx.closePath(); }
    }
    if(kind === 'pleth'){
      var g = ctx.createLinearGradient(0, mid - amp, 0, mid);
      g.addColorStop(0, 'rgba(60,215,242,0.32)'); g.addColorStop(1, 'rgba(60,215,242,0.02)');
      ctx.fillStyle = g; path(true); ctx.fill();
    }
    ctx.shadowColor = col; ctx.shadowBlur = 6;
    path(false); ctx.stroke();
    ctx.shadowBlur = 0;
    if(!still){
      // the writing point
      var hp = (((now) % 1) + 1) % 1;
      ctx.fillStyle = '#fff';
      ctx.shadowColor = col; ctx.shadowBlur = 10;
      ctx.beginPath(); ctx.arc(head * w, mid - fn(hp) * amp, 2.2, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;
    }
  };

  /* ---- The patient ------------------------------------------------------------
     The figure is the body map's own 3D model (BodyParts3D, CC BY-SA 2.1 JP)
     in the body map's look, translucent skin over the skeleton and organs,
     rendered flat by scripts/build-body-figures.mjs; its region paths come
     from the skeleton (neck line at the shoulders, arm lines down the axilla,
     chest from abdomen at T12/L1, pelvis down to the groin). A child under 12
     gets the child figure, with a child's larger head and shorter legs. Both
     arms are one region and both legs another (findings name "arms" and
     "legs", not sides); the back has its own view, and shows what the case
     says about the back, buttocks or spine. A region with findings carries a
     short callout beside the body: where (with the side, when the case names
     one) and a word or two taken from the case's own words. */
  var VIEW_REGIONS = {
    front: [['head', ['simHead']], ['neck', ['simNeck']], ['chest', ['upper']], ['abdomen', ['simAbdomen']],
            ['arms', ['armL', 'armR']], ['legs', ['simLegL', 'simLegR']]],
    back:  [['head', ['simHead']], ['neck', ['simNeck']], ['back', ['simBack']], ['arms', ['armL', 'armR']], ['legs', ['legL', 'legR']]]
  };
  var SHORT = { head:'Head', neck:'Neck', chest:'Chest', abdomen:'Abdomen', arms:'Arms', legs:'Legs', back:'Back', ms:'Head', birth:'Perineum' };
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
  /* Callout words: the first one or two of these the case's sentences contain,
     most urgent first. `sev` marks the ones drawn in red. */
  var WORDS = [
    [/\bspurt/i, 'Spurting bleed', 1], [/\b(bleeding heavily|heavy bleeding|pooling|soaked)/i, 'Heavy bleeding', 1],
    [/\b(no pulse|pulseless)/i, 'No pulse', 1], [/\b(not breathing|apneic)/i, 'Not breathing', 1], [/\bunresponsive/i, 'Unresponsive', 1],
    [/\bbleed|\bblood\b/i, 'Bleeding'], [/\bdeform/i, 'Deformity'], [/\bshortened/i, 'Shortened'], [/\brotated/i, 'Rotated'],
    [/\bburn(ed|s)?\b/i, 'Burns'], [/\blacerat/i, 'Laceration'], [/\bwound/i, 'Wound'], [/\b(bruis|contusion)/i, 'Bruising'],
    [/\bswell/i, 'Swelling'], [/\bhives/i, 'Hives'], [/\babras/i, 'Abrasion'], [/\b(puncture|penetrat)/i, 'Puncture'],
    [/\bstridor/i, 'Stridor'], [/\bwheez/i, 'Wheezing'], [/\bcrackles/i, 'Crackles'], [/\bretraction/i, 'Retractions'],
    [/\bgurgl/i, 'Gurgling'], [/\bchok/i, 'Choking'], [/\bdrool/i, 'Drooling'], [/\bcough/i, 'Coughing'],
    [/\b(cyan|blue)/i, 'Cyanosis'], [/\bmottl/i, 'Mottled'], [/\bpale/i, 'Pale'], [/\b(sweat|diaphore|clammy)/i, 'Sweaty'],
    [/\bflush/i, 'Flushed'], [/\bdroop/i, 'Facial droop'], [/\bslurr/i, 'Slurred speech'], [/\bpupils?\b/i, 'Pupils'],
    [/\bweak/i, 'Weakness'], [/\bnumb/i, 'Numbness'], [/\b(confus|disorient|does not know)/i, 'Confused'],
    [/\b(drowsy|sleepy|hard to wake)/i, 'Drowsy'], [/\bseiz/i, 'Seizure'], [/\bagitated/i, 'Agitated'], [/\balert/i, 'Alert'],
    [/\b(tender|winces|cries when)/i, 'Tender'], [/\bpain/i, 'In pain'], [/\bcontraction/i, 'Contractions'], [/\bcrowning/i, 'Crowning']
  ];
  function words(list, res){
    var txt = list.map(function(x){ return x.text; }).join(' ');
    var hits = WORDS.filter(function(w){ return w[0].test(txt); });
    // a problem the case has since said is fixed gives way to the newer words
    (res || []).forEach(function(r){
      var bad = hits.filter(function(w){ return r.cancels.test(w[1]); });
      if(!bad.length) return;
      var newest = Math.min.apply(null, list.filter(function(x){ return bad.some(function(w){ return w[0].test(x.text); }); }).map(function(x){ return x.at || 1e9; }));
      if(r.at < newest){
        hits = [[/./, r.words, 0]].concat(hits.filter(function(w){ return bad.indexOf(w) < 0; }));
      }
    });
    if(!hits.length) return { text: list.length + ' finding' + (list.length === 1 ? '' : 's'), sev: false };
    var t = hits[0][1];
    if(hits[1] && (t + ', ' + hits[1][1]).length <= 22) t += ', ' + hits[1][1].toLowerCase();
    return { text: t, sev: !!hits[0][2] };
  }
  var PARTS = /\b(thigh|knee|shin|calf|ankle|foot|feet|hip|leg|shoulder|upper arm|elbow|forearm|wrist|hand|fingers?|arm)s?\b/i;
  function where(key, list){
    if(key !== 'arms' && key !== 'legs') return SHORT[key];
    var txt = list.map(function(x){ return x.text; }).join(' ');
    var R = /\bright\b/i.test(txt), L = /\bleft\b/i.test(txt), m = txt.match(PARTS);
    var part = m ? m[0].toLowerCase() : SHORT[key].toLowerCase();
    if(R === L) return part.charAt(0).toUpperCase() + part.slice(1);
    return (R ? 'Right ' : 'Left ') + part;
  }
  function svgEl(tag, attrs, parent){
    var n = document.createElementNS(NS, tag);
    for(var k in attrs) n.setAttribute(k, attrs[k]);
    if(parent) parent.appendChild(n);
    return n;
  }
  /* Where a region's callout points: the label anchor of its first path,
     on the viewer's right-hand limb for arms and legs so callouts fan out. */
  function anchorOf(f, key, paths){
    var k = paths.length > 1 ? paths[1] : paths[0];
    return f.anchors[k] || f.anchors[paths[0]];
  }

  function Patient(opts){
    var self = this;
    this.months = opts.months;
    this.kid = this.months != null && this.months < 144;
    /* The figure for the age: an infant under 1, a toddler under 5 (both in the
       'case' figure set), the 5-to-12 child, or the adult. */
    this.kind = this.months == null || this.months >= 144 ? 'adult' : this.months < 12 ? 'infant' : this.months < 60 ? 'toddler' : 'child';
    this.preg = opts.preg || null;
    this.he = !!opts.he;
    this.seen = [];
    this.view = 'front';
    this.open = opts.open || null;
    this.el = document.createElement('section');
    this.el.className = 'pt';
    this.el.setAttribute('aria-labelledby', 'ptH');
    this.el.innerHTML =
      '<div class="pt-head"><h3 id="ptH">Assess the patient</h3><span class="pt-age">' + esc(ageWords(this.months)) + '</span></div>' +
      '<p class="pt-hint">Tap the body or a survey step to see what this call has shown you.</p>' +
      '<div class="pt-survey" role="group" aria-label="Primary survey">' +
        SURVEY.map(function(s){ return '<button type="button" class="pt-chip" data-r="' + s.key + '">' + s.label + '</button>'; }).join('') +
      '</div>' +
      '<div class="pt-stage">' +
        '<div class="pt-fig"><svg class="pt-svg" role="group" aria-label="Patient body, front. Tap a region."></svg></div>' +
        '<svg class="pt-lines" aria-hidden="true"></svg><div class="pt-cos" aria-hidden="true"></div>' +
        '<div class="pt-care" role="status" aria-label="Care given so far"></div>' +
        '<div class="pt-bar">' +
          '<div class="pt-seg" role="group" aria-label="View">' +
            '<button type="button" data-v="front" aria-pressed="true">Front</button>' +
            '<button type="button" data-v="back" aria-pressed="false">Back</button></div>' +
          '<button type="button" class="pt-chip pt-skin" data-r="skin">Skin</button>' +
        '</div>' +
      '</div>' +
      '<div class="pt-out" aria-live="polite"></div>' +
      '<p class="pt-credit">Figure rendered from <a href="https://lifesciencedb.jp/bp3d/" target="_blank" rel="noopener">BodyParts3D</a>, © 2008 Life Science Integrated Database Center, <a href="https://creativecommons.org/licenses/by-sa/2.1/jp/deed.en" target="_blank" rel="noopener">CC BY-SA 2.1 Japan</a>.</p>';
    this.svg = this.el.querySelector('.pt-svg');
    this.stage = this.el.querySelector('.pt-stage');
    this.figBox = this.el.querySelector('.pt-fig');
    this.lines = this.el.querySelector('.pt-lines');
    this.cos = this.el.querySelector('.pt-cos');
    this.flip = this.el.querySelector('[data-v="back"]');
    this.el.querySelector('.pt-seg').addEventListener('click', function(e){
      var b = e.target.closest('[data-v]');
      if(b && b.getAttribute('data-v') !== self.view) self.setView(b.getAttribute('data-v'));
    });
    this.el.addEventListener('click', function(e){
      var t = e.target.closest('[data-r]');
      if(t) self.pick(t.getAttribute('data-r'));
    });
    this.el.addEventListener('keydown', function(e){
      var t = e.target.closest('.pt-part');
      if(t && (e.key === 'Enter' || e.key === ' ')){ e.preventDefault(); self.pick(t.getAttribute('data-r')); }
    });
    if(window.ResizeObserver){
      this.ro = new ResizeObserver(function(){ self.layout(); });
      this.ro.observe(this.stage);
    }
    // The case's findings can arrive before the figure does (the first step of
    // every call): draw, then lay the callouts out for what has been seen.
    if(window.LevlBodyFigs) window.LevlBodyFigs.load('body', function(F){
      var go = function(){ self.F = F; self.draw(); self.update(self.seen); };
      if(self.kind === 'infant' || self.kind === 'toddler') window.LevlBodyFigs.load('case', function(G){ if(!G || !G.figs[self.kind + '-front']) self.kind = 'child'; go(); });
      else go();
    });
  }

  Patient.prototype.setView = function(v){
    this.view = v;
    Array.prototype.forEach.call(this.el.querySelectorAll('.pt-seg [data-v]'), function(b){
      b.setAttribute('aria-pressed', b.getAttribute('data-v') === v ? 'true' : 'false');
    });
    this.svg.setAttribute('aria-label', 'Patient body, ' + v + '. Tap a region.');
    if(v === 'front' && this.current === 'back') this.current = null;
    this.draw();
    if(this.seen) this.update(this.seen);
  };

  Patient.prototype.draw = function(){
    var F = this.F, svg = this.svg;
    if(!F) return;
    var f = F.figs[this.kind + '-' + this.view] || F.figs[(this.kid ? 'child' : 'adult') + '-' + this.view];
    if(!f) return;
    this.fig = f;
    while(svg.firstChild) svg.removeChild(svg.firstChild);
    svg.setAttribute('viewBox', '0 0 ' + f.w + ' ' + f.h);
    var uid = 'pt' + Math.floor(Math.random() * 1e6);
    var defs = svgEl('defs', {}, svg);
    var clip = svgEl('clipPath', { id: uid + 'c' }, defs); svgEl('path', { d: f.outline }, clip);
    var hit = svgEl('clipPath', { id: uid + 'h' }, defs); svgEl('path', { d: f.hitOutline }, hit);
    svgEl('ellipse', { cx: f.w / 2, cy: f.h - 8, rx: f.w * 0.31, ry: 12, class: 'pt-floor' }, svg);
    svgEl('image', { href: F.base + (f.anat || f.src), width: f.w, height: f.h, class: 'pt-skin-img', 'aria-hidden': 'true' }, svg);
    var tint = svgEl('g', { 'clip-path': 'url(#' + uid + 'c)', 'aria-hidden': 'true' }, svg);
    svgEl('path', { d: f.outline, class: 'pt-outline', 'aria-hidden': 'true' }, svg);
    var parts = svgEl('g', {}, svg);
    var self = this;
    this.parts = {};
    VIEW_REGIONS[this.view].forEach(function(r){
      var key = r[0];
      var t = svgEl('g', { class: 'pt-tint', 'data-tint': key }, tint);
      r[1].forEach(function(p){ svgEl('path', { d: f.regions[p] }, t); });
      var g = svgEl('g', { class: 'pt-part', 'data-r': key, tabindex: '0', role: 'button', 'clip-path': 'url(#' + uid + 'h)' }, parts);
      r[1].forEach(function(p){ svgEl('path', { d: f.regions[p], class: 'pt-hit' }, g); });
      var lab = (REGIONS.concat([BACK]).filter(function(x){ return x.key === key; })[0] || {}).label;
      g.setAttribute('aria-label', lab);
      self.parts[key] = { g: g, tint: t, at: anchorOf(f, key, r[1]), paths: r[1] };
    });
    this.uid = uid;
    this.gearG = svgEl('g', { class: 'pt-gear', 'aria-hidden': 'true' }, svg);
    this.paintGear();
    this.layout();
  };

  /* The callouts: for each region with findings, a dot on the body, a leader
     out to the side and a small card (where / what). A region of the case's
     current step is coral, an earlier one the accent, a bleed red. The mental
     status, which has no region of its own, rides on the head when the head
     has nothing else to say. */
  Patient.prototype.items = function(){
    var f = this.fig, fs = this.f || {}, items = [], self = this;
    if(!f) return items;
    for(var key in this.parts){
      var list = fs[key] || [];
      var k = key;
      if(!list.length && key === 'head' && (fs.ms || []).length){ list = fs.ms; k = 'ms'; }
      if(!list.length) continue;
      var at = this.parts[key].at, pr = this.parts[key].paths;
      // a limb finding that names a side points at that limb (front view: the
      // patient's right is on the viewer's left; back view: the reverse)
      if(pr.length > 1){
        var txt = list.map(function(x){ return x.text; }).join(' ');
        var R = /\bright\b/i.test(txt), L = /\bleft\b/i.test(txt);
        if(R !== L){
          var viewerLeft = (R === (this.view === 'front'));
          at = f.anchors[pr[viewerLeft ? 0 : 1]] || at;
        }
        // a thigh finding points at the thigh, not the knee
        if(key === 'legs' && /\bthigh/i.test(txt) && f.lines && f.lines.groinY) at = [at[0], f.lines.groinY + (at[1] - f.lines.groinY) * 0.55];
      }
      var w = words(list, this.res);
      if(this.careNow && this.careNow.on.tq && (key === 'legs' || key === 'arms') && /controlled/i.test(w.text)) w = { text: 'Controlled by tourniquet', sev: false };
      items.push({ key: k, where: this.preg && k === 'abdomen' ? 'Uterus' : where(k, list), what: w.text, sev: w.sev,
        fresh: list.some(function(x){ return x.now; }), x: at[0], y: at[1] });
    }
    // the birth: at the vaginal opening, below the pubis
    var bl = fs.birth || [];
    if(this.preg && bl.length && this.view === 'front' && f.landmarks && f.landmarks.pubis){
      var bw = birthWords(bl), p = f.landmarks.pubis, hr = (f.anchors.simHead || [0, 0, 44])[2];
      items.push({ key: 'birth', where: 'Perineum', what: bw.text, sev: bw.sev, fresh: bl.some(function(x){ return x.now; }), x: p[0], y: p[1] + hr * 0.35 });
    }
    return items;
  };

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

  Patient.prototype.layout = function(){
    var f = this.fig, st = this.stage, self = this;
    if(!f || !st.clientWidth) return;
    var SW = st.clientWidth, SH = st.clientHeight, bar = 46;
    // the figure fills the stage height; the toolbar sits beside the feet
    var FH = SH - 18, FW = FH * f.w / f.h;
    if(FW > SW * 0.62){ FW = SW * 0.62; FH = FW * f.h / f.w; }
    var box = { x: (SW - FW) / 2, y: Math.max(8, (SH - FH) / 2 - 1), w: FW, h: FH }, k = FW / f.w;
    var fs = this.figBox.style;
    fs.left = box.x + 'px'; fs.top = box.y + 'px'; fs.width = FW + 'px'; fs.height = FH + 'px';
    var lines = this.lines, cos = this.cos;
    while(lines.firstChild) lines.removeChild(lines.firstChild);
    cos.innerHTML = '';
    lines.setAttribute('viewBox', '0 0 ' + SW + ' ' + SH);
    var items = this.items(), mid = f.w / 2, cnt = { '-1': 0, '1': 0 };
    items.forEach(function(i){
      i.side = i.x < mid - 2 ? -1 : i.x > mid + 2 ? 1 : 0;
      if(i.side) cnt[i.side]++;
    });
    items.forEach(function(i){ if(!i.side){ i.side = cnt['1'] <= cnt['-1'] ? 1 : -1; cnt[i.side]++; } });
    var pad = 6, gap = 20;
    [-1, 1].forEach(function(s){
      var col = items.filter(function(i){ return i.side === s; }).sort(function(a, b){ return a.y - b.y; });
      var next = pad;
      col.forEach(function(i){
        var ax = box.x + i.x * k, ay = box.y + i.y * k;
        var c = document.createElement('div');
        c.className = 'pt-co' + (i.fresh ? ' is-fresh' : '') + (i.sev ? ' is-severe' : '') + (self.current === i.key ? ' on' : '');
        c.setAttribute('data-r', i.key);
        c.innerHTML = '<span class="pt-co-r">' + esc(i.where) + '</span><span class="pt-co-t">' + esc(i.what) + '</span>';
        cos.appendChild(c);
        var room = s < 0 ? ax - gap - pad : SW - ax - gap - pad;
        c.style.maxWidth = Math.max(84, Math.min(124, room)) + 'px';
        var cw = c.offsetWidth, ch = c.offsetHeight;
        var cy = Math.max(next, Math.min(SH - bar - ch - pad, ay - ch / 2));
        next = cy + ch + 6;
        var cx = s < 0 ? Math.max(pad, ax - gap - cw) : Math.min(SW - cw - pad, ax + gap);
        c.style.left = cx + 'px'; c.style.top = cy + 'px';
        var ex = s < 0 ? cx + cw : cx, ey = cy + ch / 2, mx = (ax + ex) / 2;
        var cls = i.sev ? ' is-severe' : i.fresh ? ' is-fresh' : '';
        svgEl('path', { d: 'M' + ax + ' ' + ay + 'C' + mx + ' ' + ay + ' ' + mx + ' ' + ey + ' ' + ex + ' ' + ey, class: 'pt-co-line' + cls }, lines);
        if(i.sev) svgEl('circle', { cx: ax, cy: ay, r: 11, class: 'pt-co-ring' }, lines);
        svgEl('circle', { cx: ax, cy: ay, r: 5, class: 'pt-co-dot' + cls }, lines);
      });
    });
  };

  Patient.prototype.update = function(seen){
    this.seen = seen;
    this.f = findings(seen, { preg: this.preg });
    this.careNow = care(seen, { preg: this.preg, he: this.he });
    this.res = resolutions(seen);
    this.paintGear();
    var f = this.f;
    Array.prototype.forEach.call(this.el.querySelectorAll('[data-r], [data-tint]'), function(b){
      var key = b.getAttribute('data-r') || b.getAttribute('data-tint');
      var list = f[key] || [];
      var fresh = list.some(function(x){ return x.now; });
      b.classList.toggle('has', list.length > 0);
      b.classList.toggle('fresh', fresh);
      var base = (REGIONS.concat(SURVEY, [BACK, BIRTH]).filter(function(r){ return r.key === key; })[0] || {}).label;
      if(b.tagName.toLowerCase() === 'g' && b.hasAttribute('data-r')) b.setAttribute('aria-label', base + (list.length ? ', ' + list.length + ' finding' + (list.length === 1 ? '' : 's') : ', nothing reported'));
    });
    // the Back button says when the back has something to show
    var nb = (f.back || []).length;
    this.flip.classList.toggle('has', nb > 0);
    this.flip.classList.toggle('fresh', this.view === 'front' && (f.back || []).some(function(x){ return x.now; }));
    this.flip.setAttribute('aria-label', 'Back' + (nb ? ', ' + nb + ' finding' + (nb === 1 ? '' : 's') : ''));
    this.layout();
    if(this.current) this.pick(this.current, true);
  };

  Patient.prototype.pick = function(key, quiet){
    this.current = key;
    var all = REGIONS.concat(SURVEY, [BACK, BIRTH]);
    var def = all.filter(function(r){ return r.key === key; })[0];
    if(!def) return;
    Array.prototype.forEach.call(this.el.querySelectorAll('[data-r], [data-tint]'), function(b){
      var on = (b.getAttribute('data-r') || b.getAttribute('data-tint')) === key;
      b.classList.toggle('on', on);
      if(b.tagName.toLowerCase() === 'button') b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    var list = (this.f && this.f[key]) || [];
    var out = this.el.querySelector('.pt-out');
    out.innerHTML = '<div class="pt-out-h">' + esc(def.label) + '</div>' + (list.length
      ? '<ul>' + list.map(function(x){
          return '<li' + (x.now ? ' class="now"' : '') + '>' +
            (x.dcap.length ? '<span class="pt-dcap" title="DCAP-BTLS">' + x.dcap.join(' ') + '</span>' : '') +
            esc(x.text) + (x.now ? '' : ' <span class="pt-earlier">earlier</span>') + '</li>';
        }).join('') + '</ul>' +
        (key !== 'ms' && key !== 'air' && key !== 'brth' && key !== 'circ' && list.some(function(x){ return x.dcap.length; })
          ? '<p class="pt-note">Letters are <a href="mnemonics.html#m-dcap-btls">DCAP-BTLS</a> findings named in the case.</p>' : '')
      : '<p class="pt-none">The case has not told you anything about this yet. On a real call you would still look.</p>');
    Array.prototype.forEach.call(this.cos.querySelectorAll('.pt-co'), function(c){ c.classList.toggle('on', c.getAttribute('data-r') === key); });
    if(!quiet && window.LevlAnnounce) window.LevlAnnounce.say(def.label + ': ' + (list.length ? list.map(function(x){ return x.text; }).join(' ') : 'nothing reported so far.'));
  };

  window.NremtSim = {
    Monitor: Monitor, Patient: Patient, HESITATE: HESITATE,
    pure: { parseVitals: parseVitals, ageMonths: ageMonths, refFor: refFor, sbpLow: sbpLow, judge: judge,
            driftAt: driftAt, findings: findings, words: words, care: care, resolutions: resolutions, pregnancy: pregnancy, birthWords: birthWords, where: where, sentences: sentences, REF: REF, SPO2_LOW: SPO2_LOW,
            GRACE_MS: GRACE_MS, DRIFT_MS: DRIFT_MS }
  };
})();
