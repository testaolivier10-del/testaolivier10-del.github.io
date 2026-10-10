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
    { key: 'head',    label: 'Head and face', re: /\b(head|face|facial|pupils?|eyes?|lips?|mouth|jaw|fontanelle|speech|slurr|nose|drool|forehead|grimace)/i },
    { key: 'neck',    label: 'Neck and airway', re: /\b(neck|throat|airway|chok|cough|stridor|swallow|voice|noise on the way in|gurgl|bark)/i },
    { key: 'chest',   label: 'Chest and breathing', re: /\b(chest|ribs?|lungs?|wheez|crackles|breath|breathing|retraction|flaring|apneic|respirat)/i },
    { key: 'abdomen', label: 'Abdomen and pelvis', re: /\b(abdom|belly|uterus|pelvi|vagina|groin|contraction|crowning|cord)/i },
    { key: 'arms',    label: 'Arms and hands', re: /\b(arms?|hands?|wrists?|fingers?|needle)\b/i },
    { key: 'legs',    label: 'Legs and feet', re: /\b(legs?|thighs?|knees?|hips?|ankles?|feet|foot)\b/i },
    { key: 'skin',    label: 'Skin', re: /\b(skin|pale|sweat|clammy|mottl|blotch|diaphore|hives|flush|cyan|blue|grey|gray|color|colour|hot|warm|cool|bruis)/i }
  ];
  var SURVEY = [
    { key: 'ms',   label: 'Mental status', re: /\b(alert|confused|unresponsive|responsive|drowsy|oriented|hard to wake|sleepy|agitated|awake|does not know|limp|floppy|answering|talking|quiet|seiz|shouting|wandering)/i },
    { key: 'air',  label: 'Airway', re: /\b(airway|chok|throat|stridor|drool|swallow|voice|noise on the way in|gurgl|bark|tight)/i },
    { key: 'brth', label: 'Breathing', re: /\b(breath|breathing|wheez|crackles|retraction|flaring|apneic|respirat|SpO|saturation|cough)/i },
    { key: 'circ', label: 'Circulation', re: /\b(pulse|bleed|blood|pale|sweat|clammy|mottl|blotch|capillary|cap refill|skin|blue|cyan|diaphore|heart rate)/i }
  ];
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
  function findings(seen){
    var out = {};
    REGIONS.concat(SURVEY).forEach(function(r){ out[r.key] = []; });
    var dupe = {};
    seen.forEach(function(n){
      var bits = sentences(n.text);
      parseVitals(n.vitals).notes.forEach(function(x){ bits.push(x.replace(/^Observed:\s*/i, '')); });
      bits.forEach(function(s){
        REGIONS.concat(SURVEY).forEach(function(r){
          if(!r.re.test(s)) return;
          var k = r.key + '|' + s;
          if(dupe[k]) return;
          dupe[k] = true;
          var tags = DCAP.filter(function(d){ return d[2].test(s); }).map(function(d){ return d[0]; });
          out[r.key].push({ text: s, now: !!n.now, dcap: tags });
        });
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
    set('bp', s.sys == null ? '—' : r(s.sys) + '/' + r(s.dia), judge('sbp', s.sys, m));
    set('rr', s.rr == null ? (t.rrText === 'assisted' ? 'BVM' : t.rrText === 'agonal' ? 'agonal' : '—') : r(s.rr), t.rrText === 'assisted' || t.rrText === 'agonal' ? null : judge('rr', s.rr, m));
    var rrTile = el.querySelector('.mon-tile[data-k="rr"] .mon-u');
    rrTile.textContent = t.rrText === 'assisted' ? (s.rr == null ? 'assisted' : '/min, assisted') : '/min';
    el.querySelector('[data-off="ecg"]').textContent = t.pulseless ? 'No pulse' : s.hr == null ? 'Not measured' : '';
    el.querySelector('[data-off="pleth"]').textContent = s.spo2 == null ? 'No reading' : '';
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

  /* ---- The patient ------------------------------------------------------------ */
  /* Proportions only: a child's head is larger against the body. */
  function figure(months){
    var kid = months != null && months < 144, baby = months != null && months < 24;
    var head = baby ? 30 : kid ? 25 : 20;
    var cx = 80, top = 14;
    var hy = top + head;
    var neckY = hy + head + 2;
    var torsoH = baby ? 70 : kid ? 82 : 96;
    var chestH = torsoH * 0.48;
    var shoulderW = baby ? 30 : kid ? 34 : 40;
    var hipY = neckY + 10 + torsoH;
    var legH = baby ? 70 : kid ? 100 : 130;
    var armL = baby ? 66 : kid ? 82 : 100;
    var H = hipY + legH + 14;
    function rr(x, y, w, h, r){ return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="' + r + '"/>'; }
    var parts = {
      head: '<circle cx="' + cx + '" cy="' + hy + '" r="' + head + '"/>',
      neck: rr(cx - 8, neckY - 6, 16, 18, 6),
      chest: rr(cx - shoulderW, neckY + 10, shoulderW * 2, chestH, 14),
      abdomen: rr(cx - shoulderW + 4, neckY + 10 + chestH + 3, shoulderW * 2 - 8, torsoH - chestH - 3, 12),
      arms: rr(cx - shoulderW - 18, neckY + 12, 15, armL, 8) + rr(cx + shoulderW + 3, neckY + 12, 15, armL, 8),
      legs: rr(cx - shoulderW + 6, hipY + 2, shoulderW - 9, legH, 9) + rr(cx + 3, hipY + 2, shoulderW - 9, legH, 9)
    };
    return { parts: parts, h: H };
  }

  function Patient(opts){
    var self = this;
    this.months = opts.months;
    this.seen = [];
    this.open = opts.open || null;
    this.el = document.createElement('section');
    this.el.className = 'pt';
    this.el.setAttribute('aria-labelledby', 'ptH');
    var fig = figure(this.months);
    var regionOrder = ['head', 'neck', 'chest', 'abdomen', 'arms', 'legs'];
    this.el.innerHTML =
      '<div class="pt-head"><h3 id="ptH">Assess the patient</h3><span class="pt-age">' + esc(ageWords(this.months)) + '</span></div>' +
      '<p class="pt-hint">Tap a part of the body, or a step of the primary survey, to see what this call has shown you so far.</p>' +
      '<div class="pt-survey" role="group" aria-label="Primary survey">' +
        SURVEY.map(function(s){ return '<button type="button" class="pt-chip" data-r="' + s.key + '">' + s.label + '</button>'; }).join('') +
      '</div>' +
      '<div class="pt-wrap">' +
        '<svg class="pt-svg" viewBox="0 0 160 ' + fig.h + '" role="group" aria-label="Patient body, tap a region">' +
          regionOrder.map(function(k){
            var r = REGIONS.filter(function(x){ return x.key === k; })[0];
            return '<g class="pt-part" data-r="' + k + '" tabindex="0" role="button" aria-label="' + r.label + '">' + fig.parts[k] + '<circle class="pt-dot" r="4"/></g>';
          }).join('') +
        '</svg>' +
        '<button type="button" class="pt-chip pt-skin" data-r="skin">Skin</button>' +
      '</div>' +
      '<div class="pt-out" aria-live="polite"></div>';
    // Place each region's dot on its shape.
    Array.prototype.forEach.call(this.el.querySelectorAll('.pt-part'), function(g){
      var shape = g.firstElementChild, dot = g.querySelector('.pt-dot');
      var x, y;
      if(shape.tagName === 'circle'){ x = +shape.getAttribute('cx') + 10; y = +shape.getAttribute('cy') - 6; }
      else { x = +shape.getAttribute('x') + +shape.getAttribute('width') / 2; y = +shape.getAttribute('y') + Math.min(16, +shape.getAttribute('height') / 2); }
      dot.setAttribute('cx', x); dot.setAttribute('cy', y);
    });
    this.el.addEventListener('click', function(e){
      var t = e.target.closest('[data-r]');
      if(t) self.pick(t.getAttribute('data-r'));
    });
    this.el.addEventListener('keydown', function(e){
      var t = e.target.closest('.pt-part');
      if(t && (e.key === 'Enter' || e.key === ' ')){ e.preventDefault(); self.pick(t.getAttribute('data-r')); }
    });
  }

  Patient.prototype.update = function(seen){
    this.seen = seen;
    this.f = findings(seen);
    var f = this.f;
    Array.prototype.forEach.call(this.el.querySelectorAll('[data-r]'), function(b){
      var list = f[b.getAttribute('data-r')] || [];
      var fresh = list.some(function(x){ return x.now; });
      b.classList.toggle('has', list.length > 0);
      b.classList.toggle('fresh', fresh);
      var base = (REGIONS.concat(SURVEY).filter(function(r){ return r.key === b.getAttribute('data-r'); })[0] || {}).label;
      if(b.tagName.toLowerCase() === 'g') b.setAttribute('aria-label', base + (list.length ? ', ' + list.length + ' finding' + (list.length === 1 ? '' : 's') : ', nothing reported'));
    });
    if(this.current) this.pick(this.current, true);
  };

  Patient.prototype.pick = function(key, quiet){
    this.current = key;
    var all = REGIONS.concat(SURVEY);
    var def = all.filter(function(r){ return r.key === key; })[0];
    if(!def) return;
    Array.prototype.forEach.call(this.el.querySelectorAll('[data-r]'), function(b){
      var on = b.getAttribute('data-r') === key;
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
    if(!quiet && window.LevlAnnounce) window.LevlAnnounce.say(def.label + ': ' + (list.length ? list.map(function(x){ return x.text; }).join(' ') : 'nothing reported so far.'));
  };

  window.NremtSim = {
    Monitor: Monitor, Patient: Patient, HESITATE: HESITATE,
    pure: { parseVitals: parseVitals, ageMonths: ageMonths, refFor: refFor, sbpLow: sbpLow, judge: judge,
            driftAt: driftAt, findings: findings, sentences: sentences, REF: REF, SPO2_LOW: SPO2_LOW,
            GRACE_MS: GRACE_MS, DRIFT_MS: DRIFT_MS }
  };
})();
