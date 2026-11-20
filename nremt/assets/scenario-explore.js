/* NREMT Scenario simulator, tools v2 Explore (docs/tools-v2-nremt-scenario-sim-brief.md). One idea: each choice on a
   call changes the patient. Nothing is invented: the numbers are the case's vitals (NremtSim.Monitor), the signs its
   words (stateOf), the care the old tested rules (NremtSim.care) plus the case's own words (careOf), the drawing the
   shared NREMT patient (nremt/assets/patient-draw.js). Free play; the scored run is Test yourself.
     NremtScenarioExplore.build({ studio, scenarios, cats, catOf, gate }) -> { stage, ref, show(id), shown(), hidden() } */
(function(){
  'use strict';
  if(window.NremtScenarioExplore) return;
  var NS = 'http://www.w3.org/2000/svg';
  function esc(s){ return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function el(tag, cls, html){ var e = document.createElement(tag); if(cls) e.className = cls; if(html != null) e.innerHTML = html; return e; }
  function clamp(v, a, b){ return Math.max(a, Math.min(b, v)); }
  function rng(seed){ var s = seed >>> 0; return function(){ s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
  function f1(v){ return (Math.round(v * 10) / 10).toString(); }

  /* ---- each call's look -------------------------------------------------------------------------------------- */
  var LOOK = {
    s1: { v: 'floor', set: 'road', top: 'jacket', bot: 'jeans' },
    s2: { v: 'up', set: 'store', top: 'blouse', bot: 'slacks' },
    s3: { v: 'up', set: 'street', top: 'dress', bot: 'dress' },
    s4: { v: 'up', set: 'kitchen', top: 'tee', bot: 'jeans' },
    s5: { v: 'up', set: 'backyard', top: 'tee2', bot: 'shorts' },
    s6: { v: 'floor', set: 'gym', top: 'tank', bot: 'shorts' },
    s7: { v: 'up', set: 'yard', top: 'gown', bot: 'gown' },
    s8: { v: 'floor', set: 'alley', top: 'hoodie', bot: 'jeans' },
    s9: { v: 'floor', set: 'living', top: 'pjs', bot: 'pjs' },
    s10: { v: 'up', set: 'bedroom', top: 'pjs2', bot: 'pjs2' },
    s11: { v: 'up', set: 'kitchen', top: 'tee3', bot: 'leggings' },
    s12: { v: 'floor', set: 'arms', top: 'onesie', bot: 'onesie' },
    s13: { v: 'floor', set: 'couch', top: 'onesie2', bot: 'diaper' },
    s14: { v: 'floor', set: 'pool', top: 'swim', bot: 'swim' },
    s15: { v: 'floor', set: 'car', top: 'maternity', bot: 'slacks' },
    s16: { v: 'floor', set: 'bath', top: 'maternity2', bot: 'slacks' },
    s17: { v: 'floor', set: 'bedfloor', top: 'maternity3', bot: 'slacks' },
    s18: { v: 'floor', set: 'towel', top: 'none', bot: 'none' },
    s19: { v: 'up', set: 'lot', top: 'jacket2', bot: 'jeans' },
    s20: { v: 'up', set: 'bedroom2', top: 'sweater', bot: 'leggings' },
    s21: { v: 'up', set: 'night', top: 'none', bot: 'jeans' },
    s22: { v: 'up', set: 'room', top: 'shirt', bot: 'slacks' },
    s23: { v: 'up', set: 'race', top: 'singlet', bot: 'shorts' },
    s24: { v: 'floor', set: 'kitchenfloor', top: 'cardigan', bot: 'slacks' },
    s25: { v: 'up', set: 'living2', top: 'flannel', bot: 'jeans' }
  };

  /* ---- what the case's words say about the body --------------------------------------------------------------- */
  var EYES = [
    [/\b(unresponsive|limp|not breathing|apneic|hard to wake|harder to rouse|unconscious|barely responsive|no response|does not respond|not responding|eyes (are )?closed|lifeless|collapsed|slumped|goes limp|pulseless|no pulse|still pulseless|does not react)\b/ig, 'closed'],
    [/\b(drowsy|postictal|sleepy|less responsive)\b/ig, 'half'],
    [/\b(alert|awake|talking|talks|answering|answers|crying|cries|opens? (his|her) eyes|eyes open|oriented|shouting|confused|agitated|pacing|calm|speaking|wakes|waking|more responsive|becoming more responsive|insisting|groaning|moaning|coughing|wheezing|irritable|tearful|embarrassed|anxious|distressed|struggle|fights you|apologetic|breathe on (his|her) own|breath of (his|her) own|moving (his|her) arms)\b/ig, 'open']
  ];
  /* A sentence about someone else (the mother says..., police are...) says nothing about the patient's body. */
  var OTHER = /^(her|his|the|a|one|both|all|everyone'?s?) ?(mother|father|parents?|wife|husband|partner|roommate|daughter|son|neighbou?r|caregiver|staff|bystanders?|police|officers?|family|volunteers?|crowd|dispatch|medical direction|stroke team|hospital|receiving)\b|^(bystanders?|police|staff|dispatch|medical direction|ALS)\b/i;
  function lastWord(text, list){
    var best = null, at = -1;
    list.forEach(function(r){ r[0].lastIndex = 0; var m; while((m = r[0].exec(text))){ if(m.index >= at){ at = m.index; best = r[1]; } } });
    return best;
  }
  var SENT = /(?<=[.!?]["”']?)\s+(?=[A-Z"“'])/;
  /* the patient's own sentences of a step: not about someone else and, in a birth, not about the baby */
  function own(text, preg){
    return String(text || '').replace(/\s+/g, ' ').split(SENT).filter(function(x){
      return !OTHER.test(x.trim()) && !(preg && PREG_BABY.test(x));
    }).join(' ');
  }
  var PREG_BABY = /\b(baby|newborn|cord|crown\w*|the head|shoulders?|grimaces|cries|has not cried|her trunk|delivers?|delivered|breathed|heart rate)\b/i;
  function newest(seen, fn, preg){
    for(var i = 0; i < seen.length; i++){ var v = fn(own(seen[i].text, preg), seen[i]); if(v != null) return { v: v, i: i }; }
    return null;
  }
  var SKIN = [
    [/\b(pink(er)?|color (is|looks|has) (better|improv|return)|colou?r (is )?back|good colou?r|color improves|colour improves|color returns)\b/ig, 'ok'],
    [/\b(pale|paler|pallor|ashen|grey|gray|washed out)\b/ig, 'pale'],
    [/\b(blue|bluish|cyanos\w*|cyanotic|dusky)\b/ig, 'blue'],
    [/\b(mottled|mottling|blotchy)\b/ig, 'mottled'],
    [/\b(flushed|hot (and dry|to the touch)|skin (is )?hot|red-faced|beet red)\b/ig, 'hot']
  ];
  var SWEAT = [[/\b(sweat\w*|diaphore\w*|clammy|drenched)\b/ig, 1], [/\b(hot and dry|skin (is )?dry|dry to the touch)\b/ig, 0]];
  var HIVES = [[/\bhives (are |have )?(fad|resolv|less|receding|settl|gone)\w*/ig, 0], [/\bhives\b/ig, 1]];
  var BLEED = [
    [/\b(bleeding (stops|has stopped|is controlled|is under control)|stops the bleeding|bleeding is controlled|no longer bleeding|controls? the bleeding|bleeding completely|stops completely)\b/ig, 'stop'],
    [/\b(spurt\w*)\b/ig, 'spurt'],
    [/\b(soaking through|bleeding continues|bleeding picks back up|still bleeding|bleeding hasn't slowed|bleeding never stopped|larger pool|pool of blood|bleeding continued|unchecked)\b/ig, 'bleed']
  ];
  /* the case's words, newest step first, into the drawn state. care: NremtSim.care.care(seen) ({ on: {...} }). */
  function stateOf(seen, care, months, preg){
    seen = seen || [];
    var on = (care && care.on) || {};
    var eyes = newest(seen, function(t){ return lastWord(t, EYES); }, preg);
    var skin = newest(seen, function(t){ return lastWord(t, SKIN); }, preg);
    var sweat = newest(seen, function(t){ return lastWord(t, SWEAT); }, preg);
    var hives = newest(seen, function(t){ return lastWord(t, HIVES); }, preg);
    var wound = seen.some(function(n){ return /\b(thigh|leg|arm)\b[^.]*\b(wound|bleed|spurt|blood)|\b(wound|bleed|spurt|blood)[^.]*\b(thigh|leg|arm)\b/i.test(n.text || ''); });
    var bl = wound ? newest(seen, function(t){ return lastWord(t, BLEED); }) : null;
    var bleed = !wound ? 'none' : on.tq ? 'stop' : bl ? bl.v : 'bleed';
    if(bleed === 'spurt' && on.gauze) bleed = 'bleed';
    var pool = 0;
    if(wound){
      var running = true;
      for(var i = seen.length - 1; i >= 0; i--){
        var n = seen[i], w = lastWord(n.text || '', BLEED);
        if(w === 'stop') running = false;
        else if(w === 'spurt' || w === 'bleed') running = true;
        if(running) pool++;
        if(n.did && /\btourniquet\b/i.test(n.did) && !/\b(wait|skip|instead of)\b/i.test(n.did)) running = false;
      }
    }
    var all = seen.map(function(n){ return n.text || ''; }).join(' ');
    return {
      eyes: eyes ? eyes.v : 'open',
      skin: skin ? skin.v : 'ok',
      sweat: !!(sweat && sweat.v),
      hives: !!(hives && hives.v),
      bleed: bleed,
      pool: pool,
      tripod: /\b(sitting forward|tripod|hands on (her|his) knees)\b/i.test(all) && !/\b(sitting up comfortably|lying)\b/i.test(seen[0] ? seen[0].text : ''),
      shirtless: false,
      months: months
    };
  }

  /* The care on the patient: the old patient's rules over the choices taken (NremtSim.care), plus what the case's */
  var NEG = /\b(never|not|no|without|until|if|unless|whether|confirm\w*|can't|cannot|isn't|wasn't|doesn't|didn't|won't|hasn't)\b|n't\b/i;
  var TEXT_CARE = [
    { re: /\byou (finally )?(re)?apply (firm |direct |sustained )*pressure\b/i, set: { gauze: 1 } },
    { re: /\b(breathe on (his|her) own|breath of (his|her) own|starts? (to )?breathe|then cries|cries strongly|return of spontaneous circulation|ROSC|pulse (returns|is back)|no further shock|achieves return)\b/i, set: { cpr: 0 } },
    { re: /\b(breathing adequately|breathe on (his|her) own|breathing on (his|her) own|respiratory drive returns|then cries|cries strongly)\b/i, set: { bvm: 0 } },
    { re: /\b(analy[sz]es|analy[sz]ing|everyone is clear|stand clear|shock advised|advises a shock)\b/i, set: { cpr: 0 }, now: true, unless: /\b(compressions resume|resume compressions|resumes? compressions)\b/i },
    { re: /\b(pulseless|no pulse)\b/i, set: { o2: 0 } }
  ];
  function sentencesOf(t){ return String(t || '').replace(/\s+/g, ' ').split(SENT); }
  function textCare(text, now){
    var out = {};
    TEXT_CARE.forEach(function(r){
      if(r.now && !now) return;
      if(r.unless && r.unless.test(text)) return;
      sentencesOf(text).forEach(function(x){ var m = r.re.exec(x); if(m && !NEG.test(x.slice(0, m.index))) for(var k in r.set) out[k] = r.set[k]; });
    });
    return out;
  }
  /* The care on the patient: the old patient's rules over the choices taken (NremtSim.care), then, step by step, what */
  function careOf(J, seen, opt){
    var C = J.care;
    if(!C) return { on: {}, chips: [], epi: 0 };
    var c = C.care(seen, opt), ov = {};
    for(var i = seen.length - 1; i >= 0; i--){
      // the choice that led here (taken at the step before): whatever it puts on or takes off wins over the words
      var pv = seen[i + 1];
      if(pv && pv.did){ var one = C.care([{ text: '', did: pv.did }], opt).on; for(var k in one) delete ov[k]; }
      if(opt && opt.skipNow && i === 0) continue;
      var t = textCare(own(seen[i].text, opt && opt.preg), i === 0);
      for(var k1 in t) ov[k1] = t[k1];
    }
    for(var k2 in ov) c.on[k2] = ov[k2];
    if(c.on.cpr || c.on.bvm) c.on.o2 = 0;     // an oxygen mask never sits under compressions or the bag
    c.on.epi = c.epi > 0 ? 1 : 0;             // the dose given, drawn at the thigh
    if(c.on.gauze && !c.on.tq && c.chips.indexOf('Direct pressure') < 0) c.chips.unshift('Direct pressure');
    return c;
  }

  /* ---- better or worse, from the drawn numbers --------------------------------------------------------------- */
  function off(J, kind, v, months){
    if(v == null || !isFinite(v)) return null;
    var P = J.pure, r = P.refFor(months);
    if(kind === 'spo2') return v < P.SPO2_LOW ? (P.SPO2_LOW - v) / 10 : 0;
    if(!r) return null;
    if(kind === 'hr' || kind === 'rr'){ var b = r[kind]; return v < b[0] ? (b[0] - v) / b[0] : v > b[1] ? (v - b[1]) / b[1] : 0; }
    if(kind === 'sys'){ var lo = P.sbpLow(months); if(v < lo) return (lo - v) / lo; if(r.key === 'adult' && v > r.sbp[1]) return (v - r.sbp[1]) / r.sbp[1]; return 0; }
    return null;
  }
  var VNAME = { hr: 'HR', sys: 'BP', rr: 'RR', spo2: 'SpO₂' };
  /* a change counts only when it is big enough to mean something at the bedside: HR by 10 a minute or 10%, systolic */
  var MEANS = { hr: function(v, months){ return months != null && months < 12 ? Math.min(10, v * 0.1) : Math.max(10, v * 0.1); }, sys: function(){ return 10; }, rr: function(){ return 4; }, spo2: function(){ return 2; } };
  function direction(J, a, b, months){
    if(!a || !b) return null;
    if(a.pulseless && b.pulseless) return { dir: 'same', k: null, word: 'Still no pulse' };
    if(a.pulseless && !b.pulseless && b.hr != null) return { dir: 'better', k: 'hr', from: 0, to: b.hr, word: 'Pulse back' };
    if(!a.pulseless && b.pulseless) return a.hadPulse ? { dir: 'worse', k: 'hr', from: a.hr, to: 0, word: 'No pulse' } : { dir: null, k: null, word: 'No pulse' };
    var sum = 0, n = 0, big = null, seenAny = false;
    ['hr', 'sys', 'rr', 'spo2'].forEach(function(k){
      var x = a[k], y = b[k];
      if(x == null || y == null) return;
      var ox = off(J, k, x, months), oy = off(J, k, y, months);
      if(ox == null || oy == null) return;
      seenAny = true;
      var real = Math.abs(y - x) >= MEANS[k](x, months) - 1e-9;
      if(real){ n++; sum += oy - ox; }
      var mag = (real ? 10 : 0) + Math.abs(oy - ox) + Math.abs(y - x) / 1000;
      if(Math.round(x) !== Math.round(y) && (!big || mag > big.mag)) big = { k: k, from: x, to: y, mag: mag, d: oy - ox };
    });
    if(!seenAny) return null;
    var dir = !n ? 'same' : sum < -0.02 ? 'better' : sum > 0.02 ? 'worse' : 'same';
    return { dir: dir, k: big ? big.k : null, from: big ? big.from : null, to: big ? big.to : null };
  }
  function pill2(d, b){
    if(!d) return '';
    if(d.word) return d.word;
    if(!d.k) return 'Numbers hold';
    if(d.k === 'sys') return 'BP ' + Math.round(d.from) + ' → ' + Math.round(d.to);
    return VNAME[d.k] + ' ' + Math.round(d.from) + ' → ' + Math.round(d.to);
  }

  /* The action in a few words, for the cause line: the choice's first clause. */
  function shortAction(t){
    var s = String(t || '').replace(/\s+/g, ' ').trim();
    s = s.split(/,|;| and then | then | while | before | rather than | instead of |(?<!\d):(?!\d)| — | – /)[0].trim();
    var w = s.split(' ');
    if(w.length > 4) s = w.slice(0, 4).join(' ') + '…';
    return s.replace(/[.…]+$/, function(m){ return m.indexOf('…') >= 0 ? '…' : ''; });
  }

  var SILENT = /\b(stops coughing|can't make (any )?sound|cannot make (a|any) sound|no air movement|not moving (any )?air|no sound)\b/i;
  var CRYING = /\b(cry|cries|crying|pops free|flies out|comes out|huge, gasping breath|gasping breath)\b/i;
  var BORN = /\b(body delivers|delivers quickly|is born|baby is born|the baby is out|baby is blue|placenta)\b/i;
  var PURE = { femaleOf: femaleOf, stateOf: stateOf, careOf: careOf, direction: direction, shortAction: shortAction, pill2: pill2, LOOK: LOOK };

  /* ---- the settings ------------------------------------------------------------------------------------------- */
  var SET = {
    road: { g: 'asphalt', b: 'street' }, store: { g: 'tile', b: 'store' }, street: { g: 'concrete', b: 'street' },
    kitchen: { g: 'tile', b: 'kitchen' }, backyard: { g: 'grass', b: 'backyard' }, gym: { g: 'gym', b: 'gym' },
    yard: { g: 'grass', b: 'yard' }, alley: { g: 'concrete', b: 'alley' }, living: { g: 'wood', b: 'living' },
    bedroom: { g: 'carpet', b: 'bedroom' }, arms: { g: 'lap', b: 'living' }, couch: { g: 'wood', b: 'living' },
    pool: { g: 'pool', b: 'yard' }, car: { g: 'seat', b: 'street' }, bath: { g: 'bathtile', b: 'bath' },
    bedfloor: { g: 'carpet', b: 'bedroom2' }, towel: { g: 'towel', b: 'bath' }, lot: { g: 'asphalt', b: 'lot' },
    bedroom2: { g: 'carpet', b: 'bedroom2' }, night: { g: 'asphalt', b: 'night' }, room: { g: 'wood', b: 'room' },
    race: { g: 'asphalt', b: 'race' }, kitchenfloor: { g: 'tile', b: 'kitchen' }, living2: { g: 'wood', b: 'living2' }
  };
  function R(x, y, w, h, fill, extra){ return '<rect x="' + f1(x) + '" y="' + f1(y) + '" width="' + f1(Math.max(0, w)) + '" height="' + f1(Math.max(0, h)) + '" fill="' + fill + '"' + (extra || '') + '/>'; }
  /* the ground's grain as a small tile (a pattern), not hundreds of dots: one element however large the picture */
  function grainTile(id, n, seed, cols, rmin, rmax, size){
    var r = rng(seed), out = [];
    for(var i = 0; i < n; i++) out.push('<circle cx="' + f1(r() * size) + '" cy="' + f1(r() * size) + '" r="' + f1(rmin + r() * (rmax - rmin)) + '" fill="' + cols[i % cols.length] + '"/>');
    return '<pattern id="' + id + '" width="' + size + '" height="' + size + '" patternUnits="userSpaceOnUse">' + out.join('') + '</pattern>';
  }
  function bladeTile(){
    var r = rng(29), g = [];
    for(var b = 0; b < 26; b++){ var bx = r() * 70, by = r() * 70, a = -0.6 + r() * 1.2, L = 6 + r() * 9; g.push('M' + f1(bx) + ' ' + f1(by) + 'l' + f1(Math.sin(a) * L) + ' ' + f1(-Math.cos(a) * L)); }
    return '<pattern id="scx-blades" width="70" height="70" patternUnits="userSpaceOnUse"><path d="' + g.join('') + '" stroke="#5E8F3E" stroke-width="1.6" stroke-linecap="round" opacity=".7"/></pattern>';
  }
  function grain(id, W, H, x0, y0){ return R(x0, y0, W, H, 'url(#' + id + ')'); }
  /* the ground seen from above, filling x0..x0+W, y0..y0+H; wide: the long side is horizontal */
  function ground(kind, W, H, x0, y0, o){
    o = o || {};
    var out = [], r = rng(7);
    x0 = x0 || 0; y0 = y0 || 0;
    if(kind === 'asphalt'){
      out.push(R(x0, y0, W, H, 'url(#scx-asph)'));
      out.push(grain('scx-gr-a', W, H, x0, y0));
      if(o.lines !== false){
        out.push(R(x0, y0 + H * 0.16, W, 7, '#E9E4D2', ' opacity=".85"'));
        out.push(R(x0, y0, W, H * 0.11, '#B9B6AE'), R(x0, y0 + H * 0.11, W, 9, '#8F8C85'));
        for(var k = 0; k < W; k += 120) out.push(R(x0 + k, y0, 2, H * 0.11, '#9E9B94'));
      }
    } else if(kind === 'concrete' || kind === 'pool'){
      out.push(R(x0, y0, W, H, kind === 'pool' ? '#D9D3C6' : '#BDB8AE'));
      out.push(grain('scx-gr-c', W, H, x0, y0));
      for(var j = 160; j < W; j += 220) out.push(R(x0 + j, y0, 2.5, H, 'rgba(90,85,78,.35)'));
      for(var i2 = 150; i2 < H; i2 += 200) out.push(R(x0, y0 + i2, W, 2.5, 'rgba(90,85,78,.35)'));
      if(kind === 'pool'){
        for(var wp = 0; wp < 7; wp++) out.push('<ellipse cx="' + f1(x0 + W * (0.2 + r() * 0.6)) + '" cy="' + f1(y0 + H * (0.35 + r() * 0.5)) + '" rx="' + f1(W * (0.06 + r() * 0.1)) + '" ry="' + f1(H * (0.04 + r() * 0.08)) + '" fill="#9E9688" opacity=".35"/>');
        out.push(R(x0, y0, W, H * 0.13, 'url(#scx-water)'), R(x0, y0 + H * 0.13, W, 12, '#EDE7DA'), R(x0, y0 + H * 0.13 + 12, W, 3, '#B9B1A2'));
        for(var w2 = 0; w2 < 7; w2++) out.push('<path d="M' + f1(x0 + r() * W) + ' ' + f1(y0 + H * (0.03 + r() * 0.08)) + 'q14 -5 28 0t28 0" fill="none" stroke="#E6F6FB" stroke-width="2" opacity=".7"/>');
      }
    } else if(kind === 'tile' || kind === 'bathtile'){
      var t = kind === 'tile' ? 54 : 32;
      out.push(R(x0, y0, W, H, kind === 'tile' ? 'url(#scx-tile)' : 'url(#scx-btile)'));
      if(o.wet) out.push('<ellipse cx="' + f1(x0 + W * 0.82) + '" cy="' + f1(y0 + H * 0.3) + '" rx="' + f1(Math.min(90, W * 0.12)) + '" ry="' + f1(Math.min(40, H * 0.08)) + '" fill="#DCEBF2" opacity=".75" stroke="#FFFFFF" stroke-width="2"/>');
      void t;
    } else if(kind === 'wood' || kind === 'gym'){
      out.push(R(x0, y0, W, H, kind === 'gym' ? 'url(#scx-maple)' : 'url(#scx-oak)'));
      if(kind === 'gym'){
        out.push(R(x0, y0 + H * 0.12, W, 8, '#2F6FA8'), '<path d="M' + f1(x0 + W * 0.62) + ' ' + f1(y0 + H) + 'A' + f1(H * 0.55) + ' ' + f1(H * 0.55) + ' 0 0 1 ' + f1(x0 + W * 0.62 + H * 1.1) + ' ' + f1(y0 + H) + '" fill="none" stroke="#B5462F" stroke-width="7"/>');
      } else if(o.rug){
        out.push('<rect x="' + f1(x0 + W * 0.08) + '" y="' + f1(y0 + H * 0.16) + '" width="' + f1(W * 0.84) + '" height="' + f1(H * 0.74) + '" rx="10" fill="#8E5A4C"/>' +
          '<rect x="' + f1(x0 + W * 0.08 + 14) + '" y="' + f1(y0 + H * 0.16 + 14) + '" width="' + f1(W * 0.84 - 28) + '" height="' + f1(H * 0.74 - 28) + '" rx="6" fill="#B07A5E" stroke="#E2C59C" stroke-width="3"/>');
      }
    } else if(kind === 'grass'){
      out.push(R(x0, y0, W, H, 'url(#scx-lawn)'));
      out.push(R(x0, y0, W, H, 'url(#scx-blades)'));
    } else if(kind === 'carpet'){
      out.push(R(x0, y0, W, H, '#CDBFA6'), grain('scx-gr-k', W, H, x0, y0));
    } else if(kind === 'seat'){
      out.push(R(x0, y0, W, H, '#4A4F57'));
      for(var c = 0; c < 5; c++){ var cy = y0 + H * (0.1 + c * 0.2); out.push(R(x0, cy, W, H * 0.17, 'url(#scx-seat)'), R(x0, cy + H * 0.17, W, 3, '#2E3238')); }
      out.push(R(x0, y0, W, 18, '#2A2E33'), R(x0, y0 + H - 22, W, 22, '#2A2E33'));
    } else if(kind === 'towel'){
      out.push(R(x0, y0, W, H, 'url(#scx-btile)'));
      out.push('<rect x="' + f1(x0 + W * 0.12) + '" y="' + f1(y0 + H * 0.08) + '" width="' + f1(W * 0.76) + '" height="' + f1(H * 0.84) + '" rx="14" fill="#F3EEE6" stroke="#D9D0C2" stroke-width="3"/>');
      out.push('<rect x="' + f1(x0 + W * 0.12) + '" y="' + f1(y0 + H * 0.08) + '" width="' + f1(W * 0.76) + '" height="' + f1(H * 0.84) + '" rx="14" fill="url(#scx-terry)"/>');
    } else if(kind === 'lap'){
      out.push(R(x0, y0, W, H, '#7C6A5B'));
      out.push('<rect x="' + f1(x0 + W * 0.06) + '" y="' + f1(y0 + H * 0.06) + '" width="' + f1(W * 0.88) + '" height="' + f1(H * 0.88) + '" rx="' + f1(Math.min(W, H) * 0.2) + '" fill="url(#scx-denim)"/>');
    }
    return out.join('');
  }
  var DEFS = grainTile('scx-gr-a', 14, 11, ['#6E7377', '#4B4F52', '#7A7F82', '#55595C'], 0.8, 2.2, 110) + grainTile('scx-gr-c', 9, 13, ['#C9C4BA', '#AEA99F', '#B4AFA5'], 0.8, 2.4, 110) +
    grainTile('scx-gr-k', 30, 17, ['#C3B49A', '#D8CBB4', '#BBAD93'], 0.6, 1.4, 80) + bladeTile() + '<linearGradient id="scx-asph" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5E6265"/><stop offset="1" stop-color="#4E5255"/></linearGradient>' +
    '<linearGradient id="scx-water" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2E8FB8"/><stop offset="1" stop-color="#58B7D6"/></linearGradient>' +
    '<pattern id="scx-tile" width="54" height="54" patternUnits="userSpaceOnUse"><rect width="54" height="54" fill="#D9D2C3"/><rect width="27" height="27" fill="#E8E2D5"/><rect x="27" y="27" width="27" height="27" fill="#E8E2D5"/><path d="M0 0H54M0 27H54M0 0V54M27 0V54" stroke="#BDB4A2" stroke-width="1.5"/></pattern>' +
    '<pattern id="scx-btile" width="32" height="32" patternUnits="userSpaceOnUse"><rect width="32" height="32" fill="#F1F2EF"/><path d="M0 0H32M0 0V32" stroke="#C9CDC8" stroke-width="2"/></pattern>' +
    '<pattern id="scx-oak" width="240" height="56" patternUnits="userSpaceOnUse"><rect width="240" height="28" fill="#A8774A"/><rect y="28" width="240" height="28" fill="#9C6D42"/><path d="M0 28H240M0 56H240M70 0V28M190 28V56" stroke="#7A5232" stroke-width="1.5"/><path d="M10 10q40 -4 80 0M120 40q50 4 100 0" stroke="#B9875A" stroke-width="1.2" fill="none" opacity=".6"/></pattern>' +
    '<pattern id="scx-maple" width="300" height="44" patternUnits="userSpaceOnUse"><rect width="300" height="22" fill="#D9B27C"/><rect y="22" width="300" height="22" fill="#D0A670"/><path d="M0 22H300M0 44H300M110 0V22M240 22V44" stroke="#B88C54" stroke-width="1.2"/></pattern>' +
    '<pattern id="scx-lawn" width="40" height="40" patternUnits="userSpaceOnUse"><rect width="40" height="40" fill="#79A957"/><circle cx="8" cy="12" r="6" fill="#86B562"/><circle cx="28" cy="30" r="7" fill="#6E9E4E"/></pattern>' +
    '<pattern id="scx-seat" width="20" height="20" patternUnits="userSpaceOnUse"><rect width="20" height="20" fill="#565C65"/><path d="M0 10H20" stroke="#4E535B" stroke-width="2"/></pattern>' +
    '<pattern id="scx-terry" width="8" height="8" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1.2" fill="#E3DCCF"/><circle cx="6" cy="6" r="1.2" fill="#E3DCCF"/></pattern>' +
    '<pattern id="scx-denim" width="10" height="10" patternUnits="userSpaceOnUse"><rect width="10" height="10" fill="#4F6E96"/><path d="M0 10L10 0" stroke="#5D7DA6" stroke-width="2"/></pattern>' +
    '<linearGradient id="scx-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8FC3E6"/><stop offset="1" stop-color="#D7ECF4"/></linearGradient>' +
    '<linearGradient id="scx-dusk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5B6EA0"/><stop offset=".7" stop-color="#E5A27A"/><stop offset="1" stop-color="#F2C894"/></linearGradient>' +
    '<linearGradient id="scx-nite" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#151B2E"/><stop offset="1" stop-color="#2D3550"/></linearGradient>' +
    '<radialGradient id="scx-lamp"><stop offset="0" stop-color="#FFE7A6" stop-opacity=".75"/><stop offset="1" stop-color="#FFE7A6" stop-opacity="0"/></radialGradient>' +
    '<radialGradient id="scx-pool"><stop offset="0" stop-color="#6E0B07"/><stop offset=".7" stop-color="#8E130B"/><stop offset="1" stop-color="#A8190F"/></radialGradient>' +
    '<radialGradient id="scx-nit" cx=".4" cy=".35" r=".85"><stop offset="0" stop-color="#A29EF4"/><stop offset=".55" stop-color="#736ED9"/><stop offset="1" stop-color="#4E48B6"/></radialGradient>' +
    '<radialGradient id="scx-nit2" cx=".4" cy=".35" r=".85"><stop offset="0" stop-color="#B3AFF7"/><stop offset=".55" stop-color="#837EE3"/><stop offset="1" stop-color="#5D57C4"/></radialGradient>' +
    '<radialGradient id="scx-belly" cx=".45" cy=".4" r=".6"><stop offset="0" stop-color="#FFFFFF" stop-opacity=".38"/><stop offset=".7" stop-color="#FFFFFF" stop-opacity=".08"/><stop offset="1" stop-color="#000000" stop-opacity=".12"/></radialGradient>' +
    '<radialGradient id="scx-sheen"><stop offset="0" stop-color="#FFFFFF" stop-opacity="1"/><stop offset="1" stop-color="#FFFFFF" stop-opacity="0"/></radialGradient>' +
    '<radialGradient id="scx-light" cx=".42" cy=".45" r=".7"><stop offset="0" stop-color="#FFFFFF" stop-opacity=".16"/><stop offset="1" stop-color="#000000" stop-opacity=".16"/></radialGradient>' +
    '<pattern id="scx-mot" width="44" height="40" patternUnits="userSpaceOnUse"><path d="M0 8Q8 2 16 9T30 6T44 10M2 8Q6 20 2 30M16 9Q20 18 14 26Q10 34 16 40M30 6Q26 16 32 24Q38 30 34 40M44 10Q40 20 44 30M2 30Q10 24 14 26M14 26Q22 30 32 24M32 24Q38 22 44 30" fill="none" stroke="#7A5C9C" stroke-width="2.6" stroke-linecap="round" opacity=".55"/></pattern>';

  /* what is behind someone sitting or standing: the scene's wall or street, with the ground as a band at the foot */
  function back(kind, W, H, gnd){
    var out = [], hz = H * 0.74, r = rng(23);
    function win(x, y, w, h, night){
      return '<rect x="' + f1(x - 6) + '" y="' + f1(y - 6) + '" width="' + f1(w + 12) + '" height="' + f1(h + 12) + '" rx="4" fill="#E9E3D6"/>' +
        R(x, y, w, h, night ? 'url(#scx-nite)' : 'url(#scx-sky)') + R(x + w / 2 - 2, y, 4, h, '#E9E3D6') + R(x, y + h / 2 - 2, w, 4, '#E9E3D6') +
        (night ? '<circle cx="' + f1(x + w * 0.75) + '" cy="' + f1(y + h * 0.25) + '" r="' + f1(Math.min(w, h) * 0.09) + '" fill="#F4EBC8"/>' : '');
    }
    var wall = { store: '#EEF0EA', kitchen: '#F1E9D8', living: '#E6DDD0', living2: '#DCD6E3', bedroom: '#D8E0EA', bedroom2: '#E8DCE0', room: '#DCE3D6', bath: '#E3ECEE', gym: '#E9E3D7' }[kind];
    if(wall){
      out.push(R(0, 0, W, hz, wall), R(0, hz - 14, W, 14, '#B9AE9C'));
      if(kind === 'store'){
        for(var sh = 0; sh < 3; sh++){
          var sy = H * (0.08 + sh * 0.2);
          out.push(R(0, sy + H * 0.15, W, 8, '#9AA3A8'));
          for(var bx = 6; bx < W; bx += 34 + r() * 22){ var bw = 22 + r() * 16, bh = H * (0.07 + r() * 0.07);
            out.push(R(bx, sy + H * 0.15 - bh, bw, bh, ['#D3554A', '#3F7FB5', '#E8B44A', '#5E9B62', '#E7E2D6', '#8E6BA8'][Math.floor(r() * 6)], ' rx="2"')); }
        }
      } else if(kind === 'kitchen'){
        out.push(R(0, H * 0.05, W, H * 0.22, '#B9895B'), R(0, H * 0.27, W, 5, '#8F6A47'));
        for(var dx = 0; dx < W; dx += 110) out.push('<rect x="' + f1(dx + 6) + '" y="' + f1(H * 0.06) + '" width="98" height="' + f1(H * 0.2) + '" rx="4" fill="none" stroke="#9C7148" stroke-width="2"/>');
        out.push(R(0, H * 0.48, W, 12, '#7E7A72'), R(0, H * 0.48 + 12, W, hz - H * 0.48 - 12, '#C69C6D'));
        for(var dx2 = 0; dx2 < W; dx2 += 110) out.push('<rect x="' + f1(dx2 + 6) + '" y="' + f1(H * 0.48 + 20) + '" width="98" height="' + f1(hz - H * 0.48 - 40) + '" rx="4" fill="none" stroke="#A47A4E" stroke-width="2"/>');
        out.push(win(W * 0.62, H * 0.3, Math.min(160, W * 0.2), H * 0.15, false));
      } else if(kind === 'bedroom' || kind === 'bedroom2'){
        out.push(win(W * 0.68, H * 0.1, Math.min(170, W * 0.22), H * 0.24, kind === 'bedroom'));
        out.push('<rect x="' + f1(W * 0.04) + '" y="' + f1(H * 0.32) + '" width="' + f1(W * 0.6) + '" height="' + f1(H * 0.1) + '" rx="10" fill="#7E5B45"/>');
        out.push('<rect x="' + f1(W * 0.03) + '" y="' + f1(H * 0.42) + '" width="' + f1(W * 0.62) + '" height="' + f1(hz - H * 0.42) + '" rx="12" fill="' + (kind === 'bedroom' ? '#6F8FB8' : '#B985A0') + '"/>');
        out.push('<rect x="' + f1(W * 0.06) + '" y="' + f1(H * 0.38) + '" width="' + f1(W * 0.16) + '" height="' + f1(H * 0.08) + '" rx="12" fill="#F2EEE6"/>');
      } else if(kind === 'living' || kind === 'living2' || kind === 'room'){
        out.push(win(W * 0.08, H * 0.1, Math.min(170, W * 0.2), H * 0.24, kind === 'living2'));
        out.push('<rect x="' + f1(W * 0.42) + '" y="' + f1(H * 0.36) + '" width="' + f1(W * 0.56) + '" height="' + f1(H * 0.2) + '" rx="22" fill="' + (kind === 'room' ? '#6E8A6A' : '#8B6F9E') + '"/>' +
          '<rect x="' + f1(W * 0.4) + '" y="' + f1(H * 0.5) + '" width="' + f1(W * 0.6) + '" height="' + f1(hz - H * 0.5) + '" rx="16" fill="' + (kind === 'room' ? '#5E7A5A' : '#7A5F8E') + '"/>');
        if(kind === 'living2'){ out.push(R(W * 0.27, H * 0.38, W * 0.08, hz - H * 0.38, '#8D9295', ' rx="4"'), R(W * 0.28, H * 0.42, W * 0.06, H * 0.05, '#5B6063', ' rx="2"'));
          for(var v = 0; v < 4; v++) out.push(R(W * 0.285, H * (0.5 + v * 0.04), W * 0.05, 3, '#6E7376')); }
      } else if(kind === 'bath'){
        out.push(R(0, 0, W, hz, 'url(#scx-btile)'));
        out.push('<rect x="' + f1(W * 0.5) + '" y="' + f1(H * 0.4) + '" width="' + f1(W * 0.5) + '" height="' + f1(hz - H * 0.4) + '" rx="16" fill="#F8F8F6" stroke="#C9CDC8" stroke-width="3"/>');
      } else if(kind === 'gym'){
        out.push(R(0, H * 0.1, W, H * 0.06, '#2F6FA8'), R(0, H * 0.3, W, H * 0.3, '#C9CCCF'));
        for(var gx = 20; gx < W; gx += 80) out.push(R(gx, H * 0.3, 4, H * 0.3, '#A9ADB1'));
      }
    } else if(kind === 'street' || kind === 'alley' || kind === 'night' || kind === 'lot' || kind === 'race'){
      var nite = kind === 'night';
      out.push(R(0, 0, W, hz, nite ? 'url(#scx-nite)' : kind === 'lot' ? 'url(#scx-dusk)' : 'url(#scx-sky)'));
      if(kind === 'street' || kind === 'alley' || nite){
        for(var bxx = 0; bxx < W; bxx += 150 + r() * 80){ var bw2 = 120 + r() * 70, bh2 = H * (0.32 + r() * 0.3);
          out.push(R(bxx, hz - bh2, bw2, bh2, nite ? '#262C40' : ['#B5806A', '#C9B8A2', '#9AA5AE'][Math.floor(r() * 3)]));
          for(var wy = hz - bh2 + 18; wy < hz - 40; wy += 46) for(var wx = bxx + 14; wx < bxx + bw2 - 26; wx += 40)
            out.push(R(wx, wy, 20, 26, nite ? (r() > 0.6 ? '#E8C877' : '#353C55') : '#E3EEF3', ' rx="2"'));
        }
        if(nite) out.push('<circle cx="' + f1(W * 0.8) + '" cy="' + f1(H * 0.18) + '" r="' + f1(H * 0.22) + '" fill="url(#scx-lamp)"/>' + R(W * 0.8 - 3, H * 0.18, 6, hz - H * 0.18, '#3A3F4F') + R(W * 0.8 - 18, H * 0.16, 36, 8, '#4A4F60', ' rx="4"'));
      } else if(kind === 'lot'){
        var cx0 = W * 0.52, cw = Math.min(W * 0.42, 380), cy0 = hz - H * 0.2;
        out.push('<path d="M' + f1(cx0) + ' ' + f1(cy0 + H * 0.12) + 'L' + f1(cx0 + cw * 0.08) + ' ' + f1(cy0 + H * 0.04) + 'L' + f1(cx0 + cw * 0.3) + ' ' + f1(cy0 + H * 0.03) + 'L' + f1(cx0 + cw * 0.42) + ' ' + f1(cy0 - H * 0.05) +
          'L' + f1(cx0 + cw * 0.74) + ' ' + f1(cy0 - H * 0.05) + 'L' + f1(cx0 + cw * 0.86) + ' ' + f1(cy0 + H * 0.03) + 'L' + f1(cx0 + cw) + ' ' + f1(cy0 + H * 0.05) + 'L' + f1(cx0 + cw) + ' ' + f1(cy0 + H * 0.14) + 'Z" fill="#8A3E3A"/>' +
          '<path d="M' + f1(cx0 + cw * 0.45) + ' ' + f1(cy0 - H * 0.035) + 'L' + f1(cx0 + cw * 0.72) + ' ' + f1(cy0 - H * 0.035) + 'L' + f1(cx0 + cw * 0.8) + ' ' + f1(cy0 + H * 0.03) + 'L' + f1(cx0 + cw * 0.38) + ' ' + f1(cy0 + H * 0.03) + 'Z" fill="#B9D3E0"/>' +
          '<circle cx="' + f1(cx0 + cw * 0.22) + '" cy="' + f1(cy0 + H * 0.14) + '" r="' + f1(H * 0.045) + '" fill="#222"/><circle cx="' + f1(cx0 + cw * 0.8) + '" cy="' + f1(cy0 + H * 0.14) + '" r="' + f1(H * 0.045) + '" fill="#222"/>');
      } else if(kind === 'race'){
        out.push(R(0, hz - H * 0.12, W, H * 0.03, '#AEB4B9'));
        for(var fx = 0; fx < W; fx += 18) out.push(R(fx, hz - H * 0.12, 3, H * 0.1, '#9AA0A5'));
        out.push(R(0, hz - H * 0.025, W, 5, '#9AA0A5'));
        out.push('<g transform="translate(' + f1(W * 0.78) + ' ' + f1(H * 0.12) + ')"><rect x="-3" y="20" width="6" height="' + f1(hz - H * 0.12 - 20) + '" fill="#6B7176"/><rect x="-34" y="-10" width="68" height="44" rx="6" fill="#E8542F"/><text x="0" y="22" text-anchor="middle" font-size="26" font-weight="900" fill="#fff" font-family="var(--font-ui)">19</text></g>');
      }
    } else if(kind === 'backyard' || kind === 'yard'){
      out.push(R(0, 0, W, hz, kind === 'backyard' ? 'url(#scx-dusk)' : 'url(#scx-sky)'));
      if(kind === 'backyard'){
        for(var fp = 0; fp < W; fp += 26) out.push(R(fp, H * 0.3, 23, hz - H * 0.3, '#A57B54'), '<path d="M' + f1(fp) + ' ' + f1(H * 0.3) + 'l11.5 -10l11.5 10Z" fill="#A57B54"/>');
        out.push(R(0, H * 0.4, W, 6, '#8B6441'), R(0, H * 0.62, W, 6, '#8B6441'));
        out.push('<path d="M0 ' + f1(H * 0.12) + 'Q' + f1(W * 0.5) + ' ' + f1(H * 0.24) + ' ' + f1(W) + ' ' + f1(H * 0.1) + '" stroke="#333" stroke-width="1.5" fill="none"/>');
        for(var lb = 0; lb < 14; lb++){ var tx = W * (lb + 0.5) / 14, tq = 4 * (tx / W) * (1 - tx / W); out.push('<circle cx="' + f1(tx) + '" cy="' + f1(H * 0.12 + tq * H * 0.1 + 5) + '" r="5" fill="#FFE08A"/>'); }
      } else {
        out.push(R(0, H * 0.1, W, hz - H * 0.1, '#B8CAD6'));
        for(var sd = H * 0.1; sd < hz; sd += 22) out.push(R(0, sd, W, 2, '#9FB3C1'));
        out.push(win(W * 0.18, H * 0.2, Math.min(150, W * 0.18), H * 0.22, false));
        out.push('<ellipse cx="' + f1(W * 0.85) + '" cy="' + f1(hz - 10) + '" rx="' + f1(W * 0.14) + '" ry="' + f1(H * 0.12) + '" fill="#4E7E3E"/>');
      }
    }
    out.push('<g>' + ground(gnd, W, H - hz, 0, hz, { lines: false }) + '</g>');
    out.push(R(0, hz, W, 10, 'rgba(0,0,0,.12)'));
    return out.join('');
  }
  /* ---- the patient -------------------------------------------------------------------------------------------- */
  var HAIR = { s1: ['#3B2A20', 0], s2: ['#8D8378', 0], s3: ['#B98A4E', 1], s4: ['#4A3426', 0], s5: ['#C9A363', 0], s6: ['#9A948C', 0], s7: ['#E4E0D8', 1],
    s8: ['#1F1B1A', 0], s9: ['#A7774A', 1], s10: ['#5A3E2B', 0], s11: ['#2B1F1A', 1], s12: ['#6B5544', 0], s13: ['#3A2C24', 0], s14: ['#D7B66E', 1],
    s15: ['#2A1E1A', 1], s16: ['#8C4A2C', 1], s17: ['#1E1A19', 1], s18: null, s19: ['#2F2520', 0], s20: ['#5B4232', 1], s21: ['#22201F', 0],
    s22: ['#7D766C', 0], s23: ['#6B4E36', 0], s24: ['#ECE9E2', 0], s25: ['#4F3B2C', 0] };
  var SHOES = { s1: '#3A2A22', s6: '#E9ECEF', s8: '#2B2B2B', s19: '#2B2B2B', s21: '#2B2B2B', s23: '#E9ECEF' };
  var CLOTH = { jacket: ['#2B2F36', '#4A515C'], jeans: ['#3C5A80', '#5878A4'], blouse: ['#C26D82', '#DD90A4'], slacks: ['#3E4450', '#5C6472'],
    dress: ['#E07A9A', '#F4A0BA'], tee: ['#4F7F6E', '#6FA08D'], tee2: ['#E2A93B', '#F4C866'], shorts: ['#33465E', '#4F6684'], tank: ['#C0392B', '#DC5A4C'],
    gown: ['#B9C7E8', '#D6E0F6'], hoodie: ['#56606B', '#76818D'], pjs: ['#F2B8C8', '#FAD6E0'], pjs2: ['#8DB7E0', '#B2D3F2'], tee3: ['#7E62B5', '#A086D2'],
    leggings: ['#2F3542', '#4A5264'], onesie: ['#BFE0D2', '#DCF1E8'], onesie2: ['#F6D58A', '#FCE8B6'], diaper: ['#ECECEA', '#FFFFFF'], swim: ['#E8546E', '#F57E94'],
    maternity: ['#5C8FB0', '#7EAFCF'], maternity2: ['#A07CC0', '#BD9CD8'], maternity3: ['#D4896A', '#E9A88A'], jacket2: ['#4C5A3E', '#6A7A52'],
    sweater: ['#9AA6B3', '#B8C3CE'], shirt: ['#D8D2C4', '#EEE9DE'], singlet: ['#1E88C8', '#4AA8E2'], cardigan: ['#8C6C9C', '#A98BB8'], flannel: ['#A33B32', '#C4564B'] };
  var PD = window.NremtPatientDraw, DUMMY = { classList: { toggle: function(){} } };
  function clothGrad(name, w){ var c = CLOTH[name]; return c ? PD.grads('scx-', [name + ':' + c[0] + ':' + c[1]], { x1: 0, x2: w || 480 }) : ''; }
  /* the figure's measures: head, face lines, the clothes' edges and centimetres to pixels */
  function measure(f, kind, months){
    var lm = f.landmarks, an = f.anchors, ln = f.lines || {};
    var hd = an.simHead, hx = hd[0], hy = hd[1], r = hd[2], chin = lm.chin[1], kid = kind === 'infant' || kind === 'toddler' || kind === 'child';
    var top = hy - r * (kid ? 1.55 : 1.62), hcy = (top + chin) / 2, hry = (chin - top) / 2;
    var len = months == null || months >= 216 ? (kind === 'female' ? 165 : 175) : months <= 0 ? 50 : months < 12 ? 50 + months * 2.2 : months < 60 ? 75 + (months - 12) * 0.62 : months < 144 ? 105 + (months - 60) * 0.55 : 152 + (months - 144) * 0.3;
    var cm = f.h * 0.97 / len;
    var legA = an.simLegL || an.legL, legB = an.simLegR || an.legR;
    var knee = legA[1], groin = ln.groinY || lm.pubis[1];
    var legW = legA[2];
    return {
      hx: hx, hy: hy, r: r, chin: chin, top: top, hcy: hcy, hry: hry, hrx: r * 1.0, kid: kid, cm: cm,
      eyeY: hy + (chin - hy) * (kid ? 0.16 : 0.04), eyeDx: r * (kid ? 0.34 : 0.36), noseY: hy + (chin - hy) * 0.4, mouthY: hy + (chin - hy) * 0.64,
      notch: lm.sternalNotch[1], sAngle: lm.sternalAngle[1], xiph: lm.xiphoid[1], umb: lm.umbilicus[1], asis: lm.asisR[1], pubis: lm.pubis[1],
      torsoL: Math.min(lm.midaxR[0], lm.midaxL[0]) - 6, torsoR: Math.max(lm.midaxR[0], lm.midaxL[0]) + 6, legL: Math.min(legA[0], legB[0]) - legW * 1.05, legR: Math.max(legA[0], legB[0]) + legW * 1.05,
      groin: groin, knee: knee, ankle: f.h * 0.93, wrist: groin - f.h * 0.02, sleeve: lm.sternalNotch[1] + (an.armL[1] - lm.sternalNotch[1]) * 0.75,
      neckR: an.simNeck[2], neckY: an.simNeck[1], w: f.w, h: f.h
    };
  }
  function clothes(M, top, bot){
    var out = [], shY = M.notch - (M.notch - M.chin) * 0.32, nw = M.neckR * 1.25, dip = M.notch + M.r * 0.12, waist = M.asis + M.r * 0.15;
    var neckline = 'M-40 ' + f1(shY) + 'L' + f1(M.hx - nw) + ' ' + f1(shY) + 'Q' + f1(M.hx) + ' ' + f1(dip + M.r * 0.25) + ' ' + f1(M.hx + nw) + ' ' + f1(shY) + 'L' + f1(M.w + 40) + ' ' + f1(shY);
    function P(d, name){ return '<path class="scx-cl" d="' + d + '" fill="url(#scx-g-' + name + ')"/>'; }
    if(bot && bot !== 'none' && bot !== top){
      var end = bot === 'shorts' ? M.groin + (M.knee - M.groin) * 0.5 : bot === 'diaper' ? M.groin + (M.knee - M.groin) * 0.22 : M.ankle;
      out.push(P('M' + f1(M.legL) + ' ' + f1(waist - M.r * 0.3) + 'L' + f1(M.legR) + ' ' + f1(waist - M.r * 0.3) + 'L' + f1(M.legR + 6) + ' ' + f1(end) + 'L' + f1(M.legL - 6) + ' ' + f1(end) + 'Z', bot));
      if(bot === 'jeans' || bot === 'slacks') out.push('<path d="M' + f1(M.hx) + ' ' + f1(M.pubis) + 'L' + f1(M.hx) + ' ' + f1(end) + '" stroke="rgba(0,0,0,.18)" stroke-width="3"/>');
    }
    if(!top || top === 'none') return out.join('');
    var long = /jacket|hoodie|pjs|onesie|sweater|cardigan|flannel|gown|maternity|shirt|blouse/.test(top) && top !== 'tee';
    var sleeveless = top === 'tank' || top === 'singlet' || top === 'swim';
    if(sleeveless){
      var t0 = top === 'swim' ? M.notch + M.r * 0.35 : M.notch + M.r * 0.15, t1 = top === 'swim' ? M.groin : waist;
      out.push(P('M' + f1(M.torsoL + 10) + ' ' + f1(t0) + 'Q' + f1(M.hx) + ' ' + f1(t0 + M.r * 0.6) + ' ' + f1(M.torsoR - 10) + ' ' + f1(t0) + 'L' + f1(M.torsoR) + ' ' + f1(t1) + 'L' + f1(M.torsoL) + ' ' + f1(t1) + 'Z', top));
      if(top === 'singlet') out.push('<rect x="' + f1(M.hx - M.r * 0.9) + '" y="' + f1(M.xiph) + '" width="' + f1(M.r * 1.8) + '" height="' + f1(M.r * 1.1) + '" rx="4" fill="#FFFFFF"/><text x="' + f1(M.hx) + '" y="' + f1(M.xiph + M.r * 0.82) + '" text-anchor="middle" font-size="' + f1(M.r * 0.75) + '" font-weight="900" fill="#1E2A3A" font-family="var(--font-ui)">417</text>');
      return out.join('');
    }
    var sl = long ? M.wrist : M.sleeve;
    var bodyEnd = top === 'dress' ? M.knee - M.r * 0.2 : top === 'gown' ? M.ankle - M.r * 0.6 : /onesie/.test(top) ? (top === 'onesie' ? M.ankle : M.groin + M.r * 0.4) : /maternity/.test(top) ? M.groin - M.r * 0.1 : waist;
    var d = neckline + 'L' + f1(M.w + 40) + ' ' + f1(sl) + 'L' + f1(M.torsoR) + ' ' + f1(sl) + 'L' + f1(M.torsoR) + ' ' + f1(Math.min(sl, waist)) + 'L-40 ' + f1(Math.min(sl, waist)) + 'Z';
    if(long){
      d = neckline + 'L' + f1(M.w + 40) + ' ' + f1(sl) + 'L' + f1(M.legR + 4) + ' ' + f1(sl) + 'L' + f1(M.legR + 4) + ' ' + f1(waist) + 'L' + f1(M.legL - 4) + ' ' + f1(waist) + 'L' + f1(M.legL - 4) + ' ' + f1(sl) + 'L-40 ' + f1(sl) + 'Z';
    }
    out.push(P(d, top));
    var skirtW = top === 'dress' || top === 'gown' ? 12 : 0;
    out.push(P('M' + f1(M.torsoL) + ' ' + f1(M.notch) + 'L' + f1(M.torsoR) + ' ' + f1(M.notch) + 'L' + f1(Math.max(M.torsoR, M.legR) + skirtW) + ' ' + f1(bodyEnd) + 'L' + f1(Math.min(M.torsoL, M.legL) - skirtW) + ' ' + f1(bodyEnd) + 'Z', top));
    if(/jacket|hoodie|cardigan|flannel|shirt/.test(top)) out.push('<path d="M' + f1(M.hx) + ' ' + f1(dip + M.r * 0.25) + 'L' + f1(M.hx) + ' ' + f1(bodyEnd) + '" stroke="rgba(0,0,0,.22)" stroke-width="3"/>');
    if(top === 'flannel') for(var y = M.notch; y < bodyEnd; y += M.r * 0.55) out.push('<path d="M-40 ' + f1(y) + 'H' + f1(M.w + 40) + '" stroke="rgba(30,10,10,.25)" stroke-width="4"/>');
    return out.join('');
  }
  function hair(M, h, kind, look){
    if(!h) return '';
    var a = M.hrx * 1.07, b = M.hry * 1.04, cy = M.hcy, x = M.hx, col = h[0];
    if(kind === 'infant') return '<path class="scx-hair" d="M' + f1(x - a * 0.6) + ' ' + f1(cy - b * 0.72) + 'Q' + f1(x) + ' ' + f1(cy - b * 1.02) + ' ' + f1(x + a * 0.6) + ' ' + f1(cy - b * 0.72) + 'Q' + f1(x) + ' ' + f1(cy - b * 0.84) + ' ' + f1(x - a * 0.6) + ' ' + f1(cy - b * 0.72) + 'Z" fill="' + col + '" opacity=".75"/>';
    var line = cy - b * (kind === 'toddler' ? 0.42 : 0.5);
    var cap = 'M' + f1(x - a) + ' ' + f1(cy - b * 0.05) + 'A' + f1(a) + ' ' + f1(b) + ' 0 0 1 ' + f1(x + a) + ' ' + f1(cy - b * 0.05) +
      'L' + f1(x + a * 0.9) + ' ' + f1(cy - b * 0.1) + 'Q' + f1(x + a * 0.55) + ' ' + f1(line - b * 0.04) + ' ' + f1(x) + ' ' + f1(line) + 'Q' + f1(x - a * 0.55) + ' ' + f1(line - b * 0.04) + ' ' + f1(x - a * 0.9) + ' ' + f1(cy - b * 0.1) + 'Z';
    var out = '';
    if(h[1]){
      var y1 = M.chin + M.r * 0.75;
      out += '<path class="scx-hair" d="M' + f1(x - a) + ' ' + f1(cy - b * 0.1) + 'C' + f1(x - a * 1.15) + ' ' + f1(cy + b * 0.5) + ' ' + f1(x - a * 1.25) + ' ' + f1(y1 - M.r * 0.2) + ' ' + f1(x - a * 1.05) + ' ' + f1(y1) +
        'Q' + f1(x - a * 0.85) + ' ' + f1(y1 + M.r * 0.12) + ' ' + f1(x - a * 0.78) + ' ' + f1(cy + b * 0.35) + 'Z" fill="' + col + '"/>';
      out += '<path class="scx-hair" d="M' + f1(x + a) + ' ' + f1(cy - b * 0.1) + 'C' + f1(x + a * 1.15) + ' ' + f1(cy + b * 0.5) + ' ' + f1(x + a * 1.25) + ' ' + f1(y1 - M.r * 0.2) + ' ' + f1(x + a * 1.05) + ' ' + f1(y1) +
        'Q' + f1(x + a * 0.85) + ' ' + f1(y1 + M.r * 0.12) + ' ' + f1(x + a * 0.78) + ' ' + f1(cy + b * 0.35) + 'Z" fill="' + col + '"/>';
    }
    return out + '<path class="scx-hair" d="' + cap + '" fill="' + col + '"/><path d="' + cap + '" fill="url(#scx-light)"/>';
  }
  function face(M){ return PD.face('scx-', M.hx, M.eyeY, M.r / 44.3, { half: true }); }
  function glove(x, y, rot, cm, cls){ return PD.glove('scx-', f1(x), f1(y), f1(rot), cls || '', (1.45 * cm / 6.9).toFixed(3)); }

  /* the care on the patient, each item its own group (shown with is-on). site: the limb with the wound. */
  function items(M, f, kind, site, view, minFig){
    var out = {}, cm = M.cm, r = M.r, x = M.hx, lm = f.landmarks, an = f.anchors;
    var ped = kind === 'infant' || kind === 'toddler';
    if(site){
      var w = site.at, lr = site.r, wy = w[1], wx = w[0];
      out.wound = '<ellipse class="scx-wound-r" cx="' + f1(wx) + '" cy="' + f1(wy) + '" rx="' + f1(lr * 0.32) + '" ry="' + f1(lr * 0.6) + '" fill="#7A100B"/><path d="M' + f1(wx - lr * 0.06) + ' ' + f1(wy - lr * 0.45) + 'Q' + f1(wx + lr * 0.12) + ' ' + f1(wy) + ' ' + f1(wx - lr * 0.04) + ' ' + f1(wy + lr * 0.45) + '" stroke="#3A0604" stroke-width="' + f1(lr * 0.06) + '" fill="none"/>';
      out.gauze = '<rect x="' + f1(wx - cm * 5) + '" y="' + f1(wy - cm * 5) + '" width="' + f1(cm * 10) + '" height="' + f1(cm * 10) + '" rx="' + f1(cm * 0.8) + '" fill="#FBFBF6" stroke="#CFCFC4" stroke-width="2" transform="rotate(-8 ' + f1(wx) + ' ' + f1(wy) + ')"/>' +
        '<ellipse class="scx-stain" cx="' + f1(wx) + '" cy="' + f1(wy) + '" rx="' + f1(cm * 3) + '" ry="' + f1(cm * 3.6) + '" fill="#A3241B" opacity=".75"/>';
      out.press = glove(wx + (site.viewerLeft ? 1 : -1) * cm * 1, wy + cm * 3, site.viewerLeft ? -18 : 18, cm);
      var ty = wy - cm * 7, tw = lr * 1.1;
      out.tq = '<rect x="' + f1(wx - tw) + '" y="' + f1(ty - cm * 1.9) + '" width="' + f1(tw * 2) + '" height="' + f1(cm * 3.8) + '" rx="' + f1(cm * 0.8) + '" fill="#23282B" class="scx-tq-b"/>' +
        '<rect x="' + f1(wx - tw) + '" y="' + f1(ty - cm * 0.3) + '" width="' + f1(tw * 2) + '" height="' + f1(cm * 0.6) + '" fill="#C9342A"/>' +
        '<rect x="' + f1(wx - cm * 7.5) + '" y="' + f1(ty - cm * 0.8) + '" width="' + f1(cm * 15) + '" height="' + f1(cm * 1.6) + '" rx="' + f1(cm * 0.8) + '" fill="#4B555A" stroke="#111" stroke-width="1.5" transform="rotate(-16 ' + f1(wx) + ' ' + f1(ty) + ')"/>' +
        (function(){ var fs = Math.max(cm * 2.9, minFig || 0), tw2 = fs * 2.6, th = fs * 1.6;
          return '<g transform="translate(' + f1(wx + (site.viewerLeft ? -1 : 1) * (tw + cm * 2) + (site.viewerLeft ? -tw2 : 0)) + ' ' + f1(ty - th / 2) + ')"><rect width="' + f1(tw2) + '" height="' + f1(th) + '" rx="' + f1(fs * 0.2) + '" fill="#FFFDF4" stroke="#B9B39A" stroke-width="2"/>' +
          '<text class="scx-tqt" x="' + f1(tw2 / 2) + '" y="' + f1(th * 0.72) + '" text-anchor="middle" font-size="' + f1(fs) + '" font-weight="900" font-family="var(--font-mono,monospace)" fill="#23282B">TQ</text></g>'; })();
      out.splint = '<rect x="' + f1(wx - lr * 1.25) + '" y="' + f1(wy - lr * 4) + '" width="' + f1(lr * 0.36) + '" height="' + f1(lr * 8) + '" rx="' + f1(lr * 0.12) + '" fill="#E8D9A8" stroke="#A08B4E" stroke-width="2"/>' +
        '<rect x="' + f1(wx + lr * 0.89) + '" y="' + f1(wy - lr * 4) + '" width="' + f1(lr * 0.36) + '" height="' + f1(lr * 8) + '" rx="' + f1(lr * 0.12) + '" fill="#E8D9A8" stroke="#A08B4E" stroke-width="2"/>' +
        [-2.6, 0, 2.6].map(function(k){ return '<rect x="' + f1(wx - lr * 1.35) + '" y="' + f1(wy + k * lr - lr * 0.15) + '" width="' + f1(lr * 2.7) + '" height="' + f1(lr * 0.3) + '" rx="' + f1(lr * 0.1) + '" fill="#3A4A5C"/>'; }).join('');
    }
    var mY = (M.noseY + M.mouthY) / 2, mrx = r * 0.5, mry = r * 0.6;
    var mask = function(dx){ return '<ellipse class="scx-mask" cx="' + f1(x + dx) + '" cy="' + f1(mY) + '" rx="' + f1(mrx) + '" ry="' + f1(mry) + '" fill="#DDF1EA" fill-opacity=".55" stroke="#3E8A73" stroke-width="' + f1(r * 0.05) + '"/>' +
      '<ellipse cx="' + f1(x + dx) + '" cy="' + f1(mY + mry * 0.15) + '" rx="' + f1(mrx * 0.38) + '" ry="' + f1(mry * 0.3) + '" fill="#9CCFBF" fill-opacity=".7"/>'; };
    out.o2 = '<path d="M' + f1(x - mrx) + ' ' + f1(mY - mry * 0.3) + 'L' + f1(x - M.hrx * 1.05) + ' ' + f1(mY - mry * 0.6) + 'M' + f1(x + mrx) + ' ' + f1(mY - mry * 0.3) + 'L' + f1(x + M.hrx * 1.05) + ' ' + f1(mY - mry * 0.6) + '" stroke="#5B9C88" stroke-width="' + f1(r * 0.04) + '"/>' +
      '<ellipse cx="' + f1(x) + '" cy="' + f1(M.chin + mry * 0.9) + '" rx="' + f1(mrx * 0.9) + '" ry="' + f1(mry * 0.75) + '" fill="#BFE2D6" fill-opacity=".85" stroke="#6FA592" stroke-width="2"/>' + mask(0) +
      '<path d="M' + f1(x + mrx * 0.6) + ' ' + f1(M.chin + mry * 1.3) + 'Q' + f1(x + r * 1.6) + ' ' + f1(M.chin + r * 1.6) + ' ' + f1(x + r * 2.6) + ' ' + f1(M.chin + r * 0.8) + '" stroke="#7FBFA9" stroke-width="' + f1(r * 0.09) + '" fill="none" stroke-linecap="round"/>';
    out.blowby = mask(r * 0.95) + '<path d="M' + f1(x + r * 1.3) + ' ' + f1(mY + mry * 0.5) + 'Q' + f1(x + r * 2.2) + ' ' + f1(mY + r * 1.2) + ' ' + f1(x + r * 2.8) + ' ' + f1(mY + r * 0.4) + '" stroke="#7FBFA9" stroke-width="' + f1(r * 0.09) + '" fill="none" stroke-linecap="round"/>';
    var fs1 = M.r / 44.3;
    // an infant's sealing hand drawn smaller than life, so the baby stays visible
    out.bvm = PD.bvm('scx-', x, M.mouthY - 3 * fs1, fs1) + glove(x - mrx * 0.95, mY - mry * 0.1, 70, kind === 'infant' ? cm * 0.45 : cm);
    var hy2 = M.sAngle + (M.xiph - M.sAngle) * 0.62, hs = cm / 6.9;
    if(kind === 'infant'){
      // two thumb encircling: the shared gloves round the chest, fingers wrapping toward the back, and the two thumbs
      // side by side on the lower breastbone
      var cw = Math.abs(lm.midaxL[0] - lm.midaxR[0]) / 2, gs = (1.45 * cm / 6.9 * 0.42).toFixed(3);
      var thumb = function(x0){ return '<rect class="scx-glove" x="' + f1(x0) + '" y="' + f1(hy2 - cm * 2.4) + '" width="' + f1(cm * 1.05) + '" height="' + f1(cm * 3.6) + '" rx="' + f1(cm * 0.52) + '"/>'; };
      out.cpr = '<g class="scx-push">' + PD.glove('scx-', f1(x - cw * 0.72), f1(hy2 + cm * 2.2), -50, '', gs) + PD.glove('scx-', f1(x + cw * 0.72), f1(hy2 + cm * 2.2), 50, 'scx-top', gs) +
        thumb(x - cm * 1.12) + thumb(x + cm * 0.07) + '</g>';
    } else out.cpr = '<g class="scx-push">' + PD.cpr('scx-', x - 13 * hs, hy2 - 5 * hs, hs) + '</g>';
    var aedS = cm * 28 / 170, aedX = lm.acromionL[0] + cm * 14, aedY = M.sAngle - cm * 10, wire = [aedX, aedY + 40 * aedS];
    if(!ped){
      out.pads = PD.pads('scx-', [lm.clavicleMidR[0] + 9 * hs, lm.clavicleMidR[1] + 38 * hs], [lm.midaxL[0] + 11 * hs, lm.midaxL[1] + 5 * hs], hs, wire);
    } else {
      var cy3 = M.sAngle + cm * 3, cw3 = (lm.midaxL[0] - lm.midaxR[0]) / 2;
      out.pads = '<rect class="scx-pad scx-pad-back" x="' + f1(x + cw3 - cm * 1) + '" y="' + f1(cy3 - cm * 3.5) + '" width="' + f1(cm * 3) + '" height="' + f1(cm * 7) + '" rx="' + f1(cm * 1) + '"/>' +
        '<rect class="scx-pad" x="' + f1(x - cm * 4) + '" y="' + f1(cy3 - cm * 3) + '" width="' + f1(cm * 8) + '" height="' + f1(cm * 6) + '" rx="' + f1(cm * 1.2) + '"/>' +
        '<path class="scx-wire" d="M' + f1(x + cm * 3) + ' ' + f1(cy3 - cm * 2) + 'C' + f1(x + cm * 10) + ' ' + f1(cy3 - cm * 12) + ' ' + f1(wire[0] - cm * 8) + ' ' + f1(wire[1] + cm * 2) + ' ' + f1(wire[0]) + ' ' + f1(wire[1]) + 'M' + f1(x + cw3 + cm * 1.5) + ' ' + f1(cy3) + 'C' + f1(x + cw3 + cm * 6) + ' ' + f1(cy3 - cm * 2) + ' ' + f1(wire[0] - cm * 4) + ' ' + f1(wire[1] + cm * 6) + ' ' + f1(wire[0]) + ' ' + f1(wire[1] + cm * 2) + '"/>';
    }
    out.pads += PD.aed('scx-', aedX, aedY, aedS);
    var thigh = an.simLegR || an.legR, ey2 = M.groin + (M.knee - M.groin) * 0.3, ex2 = thigh[0] + thigh[2] * 0.7;
    out.epi = '<g transform="rotate(14 ' + f1(ex2) + ' ' + f1(ey2) + ')"><rect x="' + f1(ex2 - cm * 1.2) + '" y="' + f1(ey2 - cm * 8) + '" width="' + f1(cm * 2.4) + '" height="' + f1(cm * 15) + '" rx="' + f1(cm * 1.1) + '" fill="#F3E6C8" stroke="#8A6A2E" stroke-width="2"/>' +
      '<rect x="' + f1(ex2 - cm * 1.2) + '" y="' + f1(ey2 + cm * 4.6) + '" width="' + f1(cm * 2.4) + '" height="' + f1(cm * 2.6) + '" rx="' + f1(cm * 0.6) + '" fill="#E07A2E"/><rect x="' + f1(ex2 - cm * 1.2) + '" y="' + f1(ey2 - cm * 8) + '" width="' + f1(cm * 2.4) + '" height="' + f1(cm * 2.2) + '" rx="' + f1(cm * 0.6) + '" fill="#2F6FA8"/></g>';
    out.nalox = '<g transform="rotate(-28 ' + f1(x + r * 0.08) + ' ' + f1(M.noseY) + ')"><rect x="' + f1(x + r * 0.02) + '" y="' + f1(M.noseY - cm * 0.5) + '" width="' + f1(cm * 2.4) + '" height="' + f1(cm * 6) + '" rx="' + f1(cm * 0.6) + '" fill="#FFFFFF" stroke="#2F5E9E" stroke-width="2"/>' +
      '<rect x="' + f1(x + r * 0.02 + cm * 0.7) + '" y="' + f1(M.noseY - cm * 2) + '" width="' + f1(cm * 1) + '" height="' + f1(cm * 1.8) + '" rx="' + f1(cm * 0.4) + '" fill="#2F5E9E"/></g>';
    out.gel = '<g transform="rotate(-24 ' + f1(x - r * 0.7) + ' ' + f1(M.mouthY) + ')"><rect x="' + f1(x - r * 0.7 - cm * 9) + '" y="' + f1(M.mouthY - cm * 1.5) + '" width="' + f1(cm * 9) + '" height="' + f1(cm * 3) + '" rx="' + f1(cm * 0.8) + '" fill="#E9EEF2" stroke="#6E7C86" stroke-width="2"/>' +
      '<rect x="' + f1(x - r * 0.7 - cm * 9) + '" y="' + f1(M.mouthY - cm * 1.5) + '" width="' + f1(cm * 2.4) + '" height="' + f1(cm * 3) + '" rx="' + f1(cm * 0.6) + '" fill="#E8B23E"/></g>';
    var ix = x + M.hrx * 1.35, iy = M.mouthY;
    out.mdi = '<g transform="rotate(-70 ' + f1(ix) + ' ' + f1(iy) + ')"><rect x="' + f1(ix - cm * 1.6) + '" y="' + f1(iy - cm * 0.2) + '" width="' + f1(cm * 3.2) + '" height="' + f1(cm * 3) + '" rx="' + f1(cm * 0.6) + '" fill="#4F8FC8"/>' +
      '<rect x="' + f1(ix - cm * 1.4) + '" y="' + f1(iy + cm * 2.4) + '" width="' + f1(cm * 2.8) + '" height="' + f1(cm * 8) + '" rx="' + f1(cm * 1) + '" fill="#D2DCE4" stroke="#5E7282" stroke-width="2"/></g>';
    var c0 = M.chin - r * 0.05, c1 = M.notch + r * 0.1, nw = M.neckR * 1.7;
    out.collar = '<path d="M' + f1(x - nw) + ' ' + f1(c0) + 'Q' + f1(x) + ' ' + f1(c0 + r * 0.3) + ' ' + f1(x + nw) + ' ' + f1(c0) + 'L' + f1(x + nw * 1.08) + ' ' + f1(c1) + 'Q' + f1(x) + ' ' + f1(c1 + r * 0.25) + ' ' + f1(x - nw * 1.08) + ' ' + f1(c1) + 'Z" fill="#E8C77A" stroke="#9A7A2E" stroke-width="2"/>' +
      '<rect x="' + f1(x - r * 0.2) + '" y="' + f1((c0 + c1) / 2 - r * 0.05) + '" width="' + f1(r * 0.4) + '" height="' + f1(r * 0.34) + '" rx="' + f1(r * 0.08) + '" fill="#5B4A2A" opacity=".55"/>';
    var pk = function(px, py, a){ return '<rect x="' + f1(px - cm * 5) + '" y="' + f1(py - cm * 3.5) + '" width="' + f1(cm * 10) + '" height="' + f1(cm * 7) + '" rx="' + f1(cm * 2) + '" fill="#CFE8F7" stroke="#5E9CC4" stroke-width="2" transform="rotate(' + a + ' ' + f1(px) + ' ' + f1(py) + ')"/>'; };
    out.cool = pk(x - M.neckR * 1.7, M.notch - r * 0.2, 70) + pk(x + M.neckR * 1.7, M.notch - r * 0.2, -70) + pk(lm.midaxR[0] + cm * 2, lm.midaxR[1] - cm * 6, 80) + pk(lm.midaxL[0] - cm * 2, lm.midaxL[1] - cm * 6, -80) +
      pk((M.legL + M.hx) / 2, M.groin - cm * 2, 30) + pk((M.legR + M.hx) / 2, M.groin - cm * 2, -30);
    var bt = view !== 'up' ? (kind === 'infant' ? M.pubis - r * 0.2 : M.xiph) : M.notch + r * 0.1;
    out.warm = view !== 'up'
      ? '<path d="M' + f1(-r * 0.6) + ' ' + f1(bt) + 'Q' + f1(x) + ' ' + f1(bt - r * 0.5) + ' ' + f1(f.w + r * 0.6) + ' ' + f1(bt) + 'L' + f1(f.w + r * 0.2) + ' ' + f1(f.h * 0.98) + 'L' + f1(-r * 0.2) + ' ' + f1(f.h * 0.98) + 'Z" fill="#6A8DAB"/>' +
        '<path d="M' + f1(-r * 0.6) + ' ' + f1(bt) + 'Q' + f1(x) + ' ' + f1(bt - r * 0.5) + ' ' + f1(f.w + r * 0.6) + ' ' + f1(bt) + '" stroke="#B6CBDC" stroke-width="' + f1(r * 0.22) + '" fill="none"/>' +
        [0.3, 0.5, 0.7].map(function(k){ return '<path d="M' + f1(f.w * k) + ' ' + f1(bt + r) + 'Q' + f1(f.w * k + r * 0.3) + ' ' + f1((bt + f.h) / 2) + ' ' + f1(f.w * k - r * 0.2) + ' ' + f1(f.h * 0.95) + '" stroke="rgba(30,50,70,.25)" stroke-width="' + f1(r * 0.12) + '" fill="none"/>'; }).join('')
      : '<path d="M' + f1(lm.acromionR[0] - r * 0.5) + ' ' + f1(bt) + 'Q' + f1(x) + ' ' + f1(bt - r * 0.8) + ' ' + f1(lm.acromionL[0] + r * 0.5) + ' ' + f1(bt) + 'L' + f1(lm.acromionL[0] + r * 0.7) + ' ' + f1(M.groin) + 'L' + f1(lm.midaxL[0] - r * 0.1) + ' ' + f1(M.groin) + 'L' + f1(lm.clavicleMidL[0]) + ' ' + f1(bt + r * 0.6) + 'L' + f1(lm.clavicleMidR[0]) + ' ' + f1(bt + r * 0.6) + 'L' + f1(lm.midaxR[0] + r * 0.1) + ' ' + f1(M.groin) + 'L' + f1(lm.acromionR[0] - r * 0.7) + ' ' + f1(M.groin) + 'Z" fill="#6A8DAB"/>';
    return out;
  }
  /* which limb bleeds: the old patient's rule (a bleeding or wound sentence about a leg or an arm, the side it names) */
  function limbSite(f, fnd){
    var hit = /\b(bleed|wound|spurt|lacerat|blood)/i;
    var legs = (fnd.legs || []).filter(function(x){ return hit.test(x.text); });
    var arms = (fnd.arms || []).filter(function(x){ return hit.test(x.text); });
    var list = legs.length ? legs : arms;
    if(!list.length) return null;
    var limb = legs.length ? 'leg' : 'arm', txt = list.map(function(x){ return x.text; }).join(' ');
    var viewerLeft = /\bright\b/i.test(txt) || !/\bleft\b/i.test(txt);
    var an = f.anchors, a = an[limb === 'leg' ? (viewerLeft ? 'simLegL' : 'simLegR') : (viewerLeft ? 'armL' : 'armR')];
    var g = (f.lines && f.lines.groinY) || a[1] - 200;
    var y = limb === 'leg' ? g + (a[1] - g) * 0.62 : a[1] + a[2] * 0.4;
    return { limb: limb, viewerLeft: viewerLeft, at: [a[0], y], r: a[2] * (limb === 'leg' ? 1.12 : 0.95) };
  }
  function splintSite(f, fnd){
    var arms = (fnd.arms || []), legs = (fnd.legs || []), an = f.anchors;
    var useArm = arms.some(function(x){ return /\b(arm|bruis|spiral)/i.test(x.text); }) && !legs.some(function(x){ return /\b(hip|leg|thigh)/i.test(x.text); });
    var txt = (useArm ? arms : legs).map(function(x){ return x.text; }).join(' ');
    var viewerLeft = /\bright\b/i.test(txt) || !/\bleft\b/i.test(txt);
    var a = an[useArm ? (viewerLeft ? 'armL' : 'armR') : (viewerLeft ? 'simLegL' : 'simLegR')];
    return { limb: useArm ? 'arm' : 'leg', viewerLeft: viewerLeft, at: [a[0], a[1]], r: a[2] * (useArm ? 0.95 : 1.12) };
  }
  var ITEM_LABEL = { tq: 'Tourniquet', gauze: 'Direct pressure', o2: 'Oxygen mask', blowby: 'Blow by oxygen', bvm: 'Bag and mask', cpr: 'Compressions',
    pads: 'AED pads', epi: 'Epinephrine', nalox: 'Naloxone', gel: 'Oral glucose', collar: 'Collar', splint: 'Splint', warm: 'Blanket', cool: 'Cold packs', mdi: 'Inhaler' };
  var ITEM_ORDER = ['warm', 'splint', 'gauze', 'tq', 'press', 'collar', 'cool', 'pads', 'cpr', 'epi', 'o2', 'blowby', 'bvm', 'nalox', 'gel', 'mdi'];
  function who(months, female, open){
    var m = months, y = m == null ? null : Math.floor(m / 12);
    if(m === 0 || /\bnewborn\b/i.test(open)) return 'Newborn';
    var kid = m != null && m < 216, w = female ? (kid ? 'Girl' : 'Woman') : (kid ? 'Boy' : 'Man');
    if(m != null && m < 24) return (female ? 'Baby girl' : 'Baby boy') + ', ' + Math.round(m) + ' months';
    return w + (y != null ? ', ' + y : '');
  }

  /* who the patient is: the noun after "N-year-old" when it names one ("his 2-year-old daughter"), else the care */
  function femaleOf(open, fallback){
    var m = String(open || '').match(/\b(?:\d+|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)[- ](?:year|month|week)s?[- ]old (\w+)/i);
    if(m && /^(daughter|girl|woman|mother|wife|runner-?girl)$/i.test(m[1])) return true;
    if(m && /^(son|boy|man|father|husband)$/i.test(m[1])) return false;
    return fallback;
  }
  function build(o){
    var K = window.LevlKit2, J = window.NremtSim, studio = o.studio, SC = o.scenarios || [];
    var St = { id: null, node: null, path: [], on: false, busy: false, view: 'floor', months: null, female: false, preg: null, kind: 'adult', F: null, cued: false, pend: null, dirs: [] };
    var timers = [];
    function later(fn, ms){ var t = setTimeout(function(){ timers = timers.filter(function(x){ return x !== t; }); fn(); }, ms); timers.push(t); return t; }
    function clearTimers(){ timers.forEach(clearTimeout); timers = []; }
    function rd(){ return K && K.reduced ? K.reduced() : !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches); }
    function call(){ return SC.filter(function(s){ return s.id === St.id; })[0]; }
    function node(){ var c = call(); return c && c.nodes[St.node]; }

    /* ------------------------------------------------------------------ the stage */
    var stage = el('div', 'scx');
    var head = K.head({ purpose: 'Pick what you do next. Watch the patient answer.', how: { label: 'Show me how', onClick: function(){ startTour(); } } });
    stage.appendChild(head.el);
    var gateBox = el('div', 'scx-gate'); gateBox.hidden = true; stage.appendChild(gateBox);
    var box = el('div', 'scx-scene');
    box.innerHTML =
      '<div class="scx-pic" role="img"><div class="scx-layers">' +
        '<svg class="scx-svg scx-l0" xmlns="' + NS + '" aria-hidden="true" data-ls-text="keep"><defs></defs><g class="scx-bg"></g><g class="scx-under"></g></svg>' +
        '<svg class="scx-svg scx-l1" xmlns="' + NS + '" aria-hidden="true" data-ls-text="keep"><g class="scx-poolg"></g><g class="scx-fig"></g></svg>' +
        '<svg class="scx-svg scx-l2" xmlns="' + NS + '" aria-hidden="true" data-ls-text="keep"><g class="scx-on"></g></svg></div>' +
        '<svg class="scx-lead" aria-hidden="true"></svg><div class="scx-labs" aria-hidden="true"></div><div class="scx-mon"></div><p class="scx-who"></p></div>' +
      '<div class="scx-board">' +
        '<div class="scx-clip" aria-hidden="true"><span></span></div>' +
        '<div class="scx-paper">' +
          '<div class="scx-top"><p class="scx-call"></p>' +
            '<button type="button" class="scx-back" aria-label="Back one decision"><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M8 5L3 10l5 5M3.5 10H13a4 4 0 0 1 0 8h-2"/></svg><span>Back</span></button>' +
            '<button type="button" class="scx-reset">Start over</button></div>' +
          '<ol class="scx-path" aria-label="Your decisions so far: go back to one"></ol>' +
          '<div class="scx-body"><p class="scx-what" hidden><b>What happened</b><span></span></p><p class="scx-now"><b>Now</b><span></span></p></div>' +
          '<div class="scx-acts"><p class="scx-q">What do you do?<span class="scx-tc" hidden>Time critical</span></p><div class="scx-ch" role="group" aria-label="What you could do"></div></div>' +
          '<div class="scx-end" hidden><p class="scx-out"></p><div class="scx-endb"><button type="button" class="scx-eb scx-eback">Back one step</button><button type="button" class="scx-eb scx-eagain">Start over</button><button type="button" class="scx-eb scx-enext">Next call</button></div></div>' +
        '</div>' +
      '</div>' +
      '<div class="scx-cuehost"></div>';
    stage.appendChild(box);
    var pic = box.querySelector('.scx-pic'), layers = box.querySelector('.scx-layers'), svgs = [].slice.call(box.querySelectorAll('.scx-svg')), svg = svgs[1], svgOn = svgs[2],
      defs = svgs[0].querySelector('defs'), gBg = svgs[0].querySelector('.scx-bg'), gUnder = svgs[0].querySelector('.scx-under'),
      gFig = svg.querySelector('.scx-fig'), gPool = svg.querySelector('.scx-poolg'), gOn = svgOn.querySelector('.scx-on'), lead = box.querySelector('.scx-lead'), labs = box.querySelector('.scx-labs'), monHost = box.querySelector('.scx-mon'),
      whoEl = box.querySelector('.scx-who'), board = box.querySelector('.scx-board'), pathEl = box.querySelector('.scx-path'), chEl = box.querySelector('.scx-ch'), whatEl = box.querySelector('.scx-what'),
      nowEl = box.querySelector('.scx-now'), actsEl = box.querySelector('.scx-acts'), endEl = box.querySelector('.scx-end'), bodyEl = box.querySelector('.scx-body');
    var layer = K.layer(box.querySelector('.scx-cuehost'));
    var cause = K.cause({ label: 'What your choice did' });
    var lines = el('div', 'scx-lines'); lines.appendChild(cause.el); stage.appendChild(lines);
    var live = el('p', 'tk2-sr'); live.setAttribute('aria-live', 'polite'); stage.appendChild(live);
    function say(t){ live.textContent = ''; setTimeout(function(){ live.textContent = t; }, 40); }

    /* ------------------------------------------------------------------ the patient and the picture */
    var G = null, M = null, monitor = null, figLoaded = false;
    function look(){ return LOOK[St.id] || { v: 'floor', set: 'living', top: 'tee', bot: 'jeans' }; }
    function fig(){ var F = St.F; if(!F) return null; if((St.view === 'prone' || St.view === 'side') && F.figs[St.kind + '-back']) return F.figs[St.kind + '-back']; return F.figs[St.kind + '-front'] || F.figs[(St.kind === 'female' ? 'adult' : St.months != null && St.months < 144 ? 'child' : 'adult') + '-front'] || F.figs['adult-front']; }
    function loadFigs(cb){
      if(!window.LevlBodyFigs) return;
      window.LevlBodyFigs.load('body', function(F){ window.LevlBodyFigs.load('case', function(F2){ St.F = F2 || F; figLoaded = true; cb(); }); });
    }
    function seen(){
      var c = call(), out = [], n = node();
      if(!c || !n) return out;
      out.push({ text: n.text, vitals: vline(n), now: true });
      for(var i = St.path.length - 1; i >= 0; i--){ var p = St.path[i], m = c.nodes[p.from]; if(m) out.push({ text: m.text, vitals: vline(m), now: false, did: p.text }); }
      return out;
    }
    /* a step's vitals line, as the patient's: in a birth, a line about the newborn ("Newborn HR 128 · crying") is the */
    function vline(n){ var v = n && n.vitals || ''; return St.preg && /^\s*newborn\b/i.test(v) ? '' : v; }
    function careNow(sn){ return careOf(J, sn, { preg: !!St.preg, he: !St.female }); }
    /* how the patient lies: as the call opens, on the ground once compressions or the AED start, and face down while */
    var PRONE = /\b(face-down|face down|prone|on his (front|stomach)|on her (front|stomach)|weight across (his|her) back)\b/i, UNPRONE = /\b(off (his|her) front|onto (his|her) back|turned (him|her) over|rolled (him|her) over|on (his|her) back|sits? up)\b/i;
    function prone(){
      var sn = seen();
      for(var i = 0; i < sn.length; i++){ var t = own(sn[i].text, St.preg); if(UNPRONE.test(t)) return false; if(PRONE.test(t)) return true; }
      return false;
    }
    /* the posture the newest words give (a step's own text, then the choice that led to it, newest first): on the
       side or in the recovery position, lying flat, sitting up */
    var P_SIDE = /\b(onto (his|her) (left )?side|on (his|her) (left )?side|recovery position|left lateral)\b/i,
      P_FLAT = /\b(lay (him|her) (flat|down)|flat on (his|her) back|lying flat|lie (him|her) flat|supine)\b/i,
      P_SIT = /\b(sit (him|her) (back )?up|sits? (back )?up|sitting up|upright)\b/i,
      SEATED = /\b(sitting (up )?on (the edge of )?(his|her|a|the) (bed|bench|kitchen chair|chair)|sitting forward)\b/i,
      P_TRIP = /\b(sits? forward|sitting forward|leaning forward|tripod\w*|hands on (his|her) knees)\b/i;
    function posture(){
      var sn = seen(), test = function(t){ var out = null; [['side', P_SIDE], ['flat', P_FLAT], ['sit', P_SIT], ['trip', P_TRIP]].forEach(function(r){ var m = r[1].exec(t); if(m && !NEG.test(t.slice(Math.max(0, m.index - 20), m.index)) && (!out || m.index > out.at)) out = { p: r[0], at: m.index }; }); return out && out.p; };
      for(var i = 0; i < sn.length; i++){
        var a = test(own(sn[i].text, St.preg)); if(a) return a;
        var nx = sn[i + 1]; if(nx && nx.did){ var b = test(nx.did); if(b) return b; }
      }
      return null;
    }
    function viewFor(care){
      var v = look().v, ps = posture();
      if(ps === 'flat' && v === 'up') v = 'floor';
      if(ps === 'sit') v = look().v === 'up' ? 'up' : v;
      if(v === 'up' && care && (care.on.cpr || care.on.pads)) v = 'floor';
      if(v === 'up' && (ps === 'trip' || SEATED.test(call().nodes[call().startNode].text))) v = 'sit';
      if(ps === 'side' && !(care && (care.on.cpr || care.on.bvm))) v = 'side';
      if(prone() && !(care && care.on.cpr)) v = 'prone';
      return v;
    }

    /* the layout: picture beside the card on a wide stage, the card under the picture on a narrow one */
    function layout(){
      var w = stage.clientWidth || box.clientWidth || 0;
      var wide = w >= 900;
      box.classList.toggle('is-wide', wide);
      if(!wide){ if(St.lw !== w || !St.ph){ St.lw = w; St.ph = Math.round(clamp((window.innerHeight || 800) * 0.56, 360, 540)); } pic.style.height = St.ph + 'px'; }
      else pic.style.height = '';
      if(!wide && lines.parentNode !== box){ box.insertBefore(lines, board); }
      else if(wide && lines.parentNode === box){ stage.insertBefore(lines, live); }
    }
    function geom(){
      var W = pic.clientWidth, H = pic.clientHeight, wide = box.classList.contains('is-wide'), f = fig();
      if(!W || !H || !f) return null;
      var g = { W: W, H: H, wide: wide, f: f, view: St.view === 'sit' ? 'up' : St.view };
      // a wide stage whose picture is taller than wide (about 1024 px) is framed as a phone is: the monitor across the
      // top, a lying patient head up and as large as the picture allows (never a strip on an empty floor)
      var land = wide && H < W * 0.95;
      var mw = land ? clamp(W * 0.34, 270, 330) : W - (wide ? 24 : 16), mh = land ? 170 : wide ? 150 : 104;
      g.mon = { x: W - mw - 12, y: 12, w: mw, h: mh };
      var area = land ? (g.view !== 'up' ? { x: 16, y: mh + 30, w: W - 32, h: H - mh - 38 } : { x: 8, y: 8, w: W - mw - 40, h: H - 8 })
        : { x: 8, y: mh + 24, w: W - 16, h: H - mh - 28 };
      g.area = area;
      if(g.view !== 'up' && land){
        var k = Math.min(area.w / (f.h * 1.02), area.h / (f.w * 1.04));
        g.k = k; g.rot = true;
        g.ox = area.x + (area.w - f.h * k) / 2; g.oy = area.y + area.h / 2 + f.w * k / 2;
      } else if(g.view !== 'up'){
        var span = Math.min(f.h, (f.anchors.simLegL || f.anchors.legL)[1] * 1.06), k2 = Math.min(area.h / (span * 1.02), area.w / (f.w * 1.1));
        g.k = k2; g.rot = false; g.ox = area.x + (area.w - f.w * k2) / 2; g.oy = area.y + Math.max(0, (area.h - span * k2) / 2);
      } else {
        var cut = St.view === 'sit' ? f.lines.groinY + (f.h - f.lines.groinY) * 0.6 : (f.lines.groinY) + ((f.anchors.simLegL || f.anchors.legL)[1] - f.lines.groinY) * 0.62, k3 = Math.min(area.h / (cut + 10), area.w / (f.w * 1.15));
        g.k = k3; g.rot = false; g.ox = area.x + (area.w - f.w * k3) / 2; g.oy = H - cut * k3;
        if(g.oy > 10) g.oy = Math.max(10, H - cut * k3);
      }
      return g;
    }
    function P(x, y){ return G.rot ? [G.ox + y * G.k, G.oy - x * G.k] : [G.ox + x * G.k, G.oy + y * G.k]; }
    function tf(){ return G.rot ? 'translate(' + f1(G.ox) + ' ' + f1(G.oy) + ') rotate(-90) scale(' + G.k.toFixed(4) + ')' : 'translate(' + f1(G.ox) + ' ' + f1(G.oy) + ') scale(' + G.k.toFixed(4) + ')'; }

    function draw(){
      G = geom();
      if(!G) return;
      var f = G.f, c = call(), L = look(), set = SET[L.set] || SET.living;
      M = measure(f, St.kind, St.months);
      svgs.forEach(function(v){ v.setAttribute('viewBox', '0 0 ' + G.W + ' ' + G.H); v.setAttribute('width', G.W); v.setAttribute('height', G.H); });
      var top = L.top, bot = L.bot;
      defs.innerHTML = DEFS + clothGrad(top, f.w) + clothGrad(bot, f.w) + '<clipPath id="scx-body"><path d="' + f.outline + '"/></clipPath>';
      gBg.innerHTML = G.view !== 'up'
        ? ground(set.g, G.W, G.H, 0, 0, { wet: St.id === 's24', rug: L.set === 'living' || L.set === 'couch' }) + '<rect width="' + G.W + '" height="' + G.H + '" fill="url(#scx-light)"/>'
        : back(set.b, G.W, G.H, set.g);
      var T = tf(), under = [];
      if(G.view !== 'up' && L.set === 'road'){
        var hc = M.cm;
        under.push('<g transform="' + T + '"><g transform="translate(' + f1(M.hx + M.r * 3.1) + ' ' + f1(M.hy + M.r * 0.8) + ') rotate(-25)"><ellipse rx="' + f1(hc * 11) + '" ry="' + f1(hc * 13) + '" fill="#C23A2B"/><ellipse rx="' + f1(hc * 11) + '" ry="' + f1(hc * 13) + '" fill="url(#scx-belly)"/>' +
          '<path d="M' + f1(-hc * 9.5) + ' ' + f1(-hc * 5) + 'Q0 ' + f1(-hc * 12) + ' ' + f1(hc * 9.5) + ' ' + f1(-hc * 5) + 'L' + f1(hc * 8.6) + ' ' + f1(-hc * 2.2) + 'Q0 ' + f1(-hc * 8.4) + ' ' + f1(-hc * 8.6) + ' ' + f1(-hc * 2.2) + 'Z" fill="#1D2226"/></g></g>');
      }
      if(G.view !== 'up' && L.set === 'alley') under.push('<g transform="' + T + '"><g transform="translate(' + f1(f.anchors.armR[0] + M.cm * 18) + ' ' + f1(M.groin - M.cm * 4) + ') rotate(35)"><rect x="-' + f1(M.cm * 0.6) + '" y="-' + f1(M.cm * 5) + '" width="' + f1(M.cm * 1.2) + '" height="' + f1(M.cm * 8) + '" rx="' + f1(M.cm * 0.4) + '" fill="#F2F4F5" stroke="#8A969C" stroke-width="2"/>' +
        '<rect x="-' + f1(M.cm * 0.15) + '" y="' + f1(M.cm * 3) + '" width="' + f1(M.cm * 0.3) + '" height="' + f1(M.cm * 3) + '" fill="#9AA4AA"/><rect x="-' + f1(M.cm * 1.1) + '" y="-' + f1(M.cm * 6) + '" width="' + f1(M.cm * 2.2) + '" height="' + f1(M.cm * 1) + '" fill="#E07A2E"/></g></g>');
      var mom = '';
      if(L.set === 'arms' && G.view !== 'up'){
        var ac = M.cm, w5 = ac * 7.5, sk = '#D9A383', sl = '#B65A6E';
        // the mother's arms: a darker edge, the colour, and a soft light down the middle, so they read round
        var limb = function(x0, y0, x1, y1, w, col){ var d = 'M' + f1(x0) + ' ' + f1(y0) + 'L' + f1(x1) + ' ' + f1(y1);
          return '<path d="' + d + '" stroke="rgba(60,30,20,.3)" stroke-width="' + f1(w + ac * 0.8) + '" stroke-linecap="round"/><path d="' + d + '" stroke="' + col + '" stroke-width="' + f1(w) + '" stroke-linecap="round"/>' +
            '<path d="' + d + '" stroke="#FFFFFF" stroke-opacity=".16" stroke-width="' + f1(w * 0.4) + '" stroke-linecap="round"/>'; };
        var hand = function(x, y, rot){ var e = 'stroke="rgba(60,30,20,.3)" stroke-width="' + f1(ac * 0.35) + '"';
          return '<g transform="translate(' + f1(x) + ' ' + f1(y) + ') rotate(' + rot + ')"><ellipse rx="' + f1(ac * 4.8) + '" ry="' + f1(ac * 4) + '" fill="' + sk + '" ' + e + '/>' +
            '<path d="M' + f1(ac * 2) + ' ' + f1(-ac * 3.4) + 'Q' + f1(ac * 9) + ' ' + f1(-ac * 3.6) + ' ' + f1(ac * 9) + ' 0Q' + f1(ac * 9) + ' ' + f1(ac * 3.6) + ' ' + f1(ac * 2) + ' ' + f1(ac * 3.4) + 'Z" fill="' + sk + '" ' + e + '/>' +
            [-1.15, 0, 1.15].map(function(k){ return '<path d="M' + f1(ac * 4.5) + ' ' + f1(k * ac * 1.15) + 'L' + f1(ac * 8.2) + ' ' + f1(k * ac * 1.15) + '" stroke="rgba(120,70,50,.35)" stroke-width="' + f1(ac * 0.25) + '" stroke-linecap="round"/>'; }).join('') +
            '<ellipse cx="' + f1(ac * 1) + '" cy="' + f1(-ac * 4) + '" rx="' + f1(ac * 3) + '" ry="' + f1(ac * 1.4) + '" fill="' + sk + '" ' + e + ' transform="rotate(25 ' + f1(ac) + ' ' + f1(-ac * 4) + ')"/>' +
            '<ellipse cx="' + f1(ac * 1.5) + '" cy="' + f1(-ac * 1) + '" rx="' + f1(ac * 3) + '" ry="' + f1(ac * 2) + '" fill="#FFFFFF" fill-opacity=".14"/></g>'; };
        var ey0 = M.top - ac * 6;
        under.push('<g transform="' + T + '"><rect x="' + f1(-ac * 30) + '" y="' + f1(M.top - ac * 20) + '" width="' + f1(f.w + ac * 60) + '" height="' + f1(f.h + ac * 30) + '" rx="' + f1(ac * 16) + '" fill="url(#scx-denim)" opacity=".9"/>' +
          limb(M.hx - ac * 40, ey0 - ac * 10, M.hx, ey0, w5 * 1.25, sl) + limb(M.hx, ey0, M.hx, M.groin + ac * 2, w5, sk) + hand(M.hx, M.groin + ac * 6, 90) + '</g>');
        mom = limb(f.w + ac * 34, M.umb + ac * 8, f.w + ac * 8, M.umb + ac * 5, w5 * 1.25, sl) + limb(f.w + ac * 8, M.umb + ac * 5, M.hx + ac * 6, M.umb + ac * 1, w5, sk) + hand(M.hx + ac * 2, M.umb, 180);
      }
      var fnd0 = J.pure.findings(seen(), { preg: !!St.preg }), site = limbSite(f, fnd0);
      St.site = site;
      var poolSvg = '';
      if(site && G.view !== 'up') poolSvg = ('<g transform="' + T + '"><g class="scx-pool" style="transform-origin:' + f1(site.at[0] + (site.viewerLeft ? -1 : 1) * site.r * 1.4) + 'px ' + f1(site.at[1] + site.r * 0.6) + 'px"><path d="' +
        blob(site.at[0] + (site.viewerLeft ? -1 : 1) * site.r * 1.4, site.at[1] + site.r * 0.6, site.r * 2.3, site.r * 2.9) + '" fill="url(#scx-pool)"/><path d="' + blob(site.at[0] + (site.viewerLeft ? -1 : 1) * site.r * 1.1, site.at[1], site.r * 0.8, site.r * 1.1) + '" fill="#B8251A" opacity=".5"/></g></g>');
      // the pool lies in the patient's layer, so the setting's layer never repaints
      gUnder.innerHTML = under.join('');
      gPool.innerHTML = poolSvg;
      var shoe = SHOES[St.id], h = [];
      if(St.view === 'side'){
        var cc = function(n){ return CLOTH[n] ? CLOTH[n][0] : null; };
        h.push(PD.lateral('scx-', { x: M.hx, hcy: M.hcy, hry: M.hry, notch: M.notch, groin: M.groin, knee: M.knee, ankle: M.ankle, cm: M.cm,
          hair: (HAIR[St.id] || ['#2B2B2B'])[0], shirt: cc(top), pants: cc(bot) || cc(top), shoe: shoe, preg: St.preg }));
      } else {
      if(St.view === 'sit'){
        // sitting forward on a chair, hands on the knees: the thighs come toward us, so only the knees and shins show
        var sc2 = M.cm, kw = (M.legR - M.legL) / 2, ky2 = M.groin + sc2 * 5, pc = CLOTH[bot] || CLOTH[top] || ['#3E4450'];
        defs.innerHTML += '<clipPath id="scx-sitclip"><rect x="-999" y="-999" width="' + f1(f.w + 1998) + '" height="' + f1(M.groin + sc2 * 2 + 999) + '"/>' +
          '<rect x="-999" y="0" width="' + f1(M.legL + 999 - sc2 * 1.5) + '" height="' + f1(f.h * 0.64) + '"/><rect x="' + f1(M.legR + sc2 * 1.5) + '" y="0" width="999" height="' + f1(f.h * 0.64) + '"/></clipPath>';
        var bed = /bedroom/.test(L.set);
        // what she sits on: the edge of a bed (a mattress across the picture) or a chair or bench (a seat and two legs)
        h.push(bed ? '<rect x="' + f1(-f.w) + '" y="' + f1(M.groin - sc2 * 4) + '" width="' + f1(f.w * 3) + '" height="' + f1(sc2 * 24) + '" rx="' + f1(sc2 * 3) + '" fill="#DCE3EA" stroke="rgba(0,0,0,.18)" stroke-width="' + f1(sc2 * 0.4) + '"/><rect x="' + f1(-f.w) + '" y="' + f1(M.groin + sc2 * 20) + '" width="' + f1(f.w * 3) + '" height="' + f1(sc2 * 6) + '" fill="#8C6A4E"/>'
          : '<rect x="' + f1(M.hx - kw * 1.15) + '" y="' + f1(M.groin - sc2 * 3) + '" width="' + f1(kw * 2.3) + '" height="' + f1(sc2 * 5) + '" rx="' + f1(sc2) + '" fill="#8A5A3A"/>' +
          '<rect x="' + f1(M.hx - kw * 1.05) + '" y="' + f1(M.groin + sc2 * 2) + '" width="' + f1(sc2 * 3) + '" height="' + f1(sc2 * 44) + '" fill="#6E4630"/><rect x="' + f1(M.hx + kw * 1.05 - sc2 * 3) + '" y="' + f1(M.groin + sc2 * 2) + '" width="' + f1(sc2 * 3) + '" height="' + f1(sc2 * 44) + '" fill="#6E4630"/>');
        [-1, 1].forEach(function(sd){ var kx = sd < 0 ? M.legL - sc2 * 1.5 : M.legR + sc2 * 1.5;
          h.push('<rect x="' + f1(kx - sc2 * 6) + '" y="' + f1(ky2) + '" width="' + f1(sc2 * 12) + '" height="' + f1(sc2 * 40) + '" rx="' + f1(sc2 * 5) + '" fill="' + pc[0] + '" stroke="rgba(0,0,0,.25)" stroke-width="' + f1(sc2 * 0.4) + '"/>' +
            '<ellipse cx="' + f1(kx) + '" cy="' + f1(ky2 + sc2 * 40) + '" rx="' + f1(sc2 * 6.5) + '" ry="' + f1(sc2 * 3.5) + '" fill="' + (shoe || '#E9ECEF') + '"/>' +
            '<ellipse cx="' + f1(kx) + '" cy="' + f1(ky2) + '" rx="' + f1(sc2 * 9) + '" ry="' + f1(sc2 * 7.5) + '" fill="' + (pc[1] || pc[0]) + '" stroke="rgba(0,0,0,.25)" stroke-width="' + f1(sc2 * 0.4) + '"/>'); });
        h.push('<g clip-path="url(#scx-sitclip)">');
      }
      if(G.view !== 'up') h.push('<path d="' + f.outline + '" fill="rgba(20,20,20,.2)" transform="translate(' + f1(-M.cm * 1.2) + ' ' + f1(M.cm * 1.5) + ')"/>');
      h.push('<image href="' + St.F.url(f) + '" x="0" y="0" width="' + f.w + '" height="' + f.h + '"/>');
      h.push('<g clip-path="url(#scx-body)">' +
        '<path class="scx-sk scx-hot" d="' + f.outline + '"/><rect class="scx-sk scx-mot" x="-40" y="' + f1(M.notch - M.neckR * 0.3) + '" width="' + f1(f.w + 80) + '" height="' + f1(f.h) + '"/><path class="scx-sk scx-pale" d="' + f.outline + '"/><path class="scx-sk scx-blue" d="' + f.outline + '"/>' +
        '<g class="scx-hives">' + hives(f, M) + '</g>' +
        clothes(M, top, bot) +
        (St.view === 'sit' ? '<rect x="' + f1(M.legL) + '" y="' + f1(M.asis) + '" width="' + f1(M.legR - M.legL) + '" height="' + f1(M.groin - M.asis + M.cm * 3) + '" fill="' + (CLOTH[bot] || CLOTH[top] || ['#3E4450'])[0] + '"/>' : '') +
        (shoe ? '<rect x="0" y="' + f1(f.h * 0.94) + '" width="' + f.w + '" height="' + f1(f.h * 0.06) + '" fill="' + shoe + '"/>' : '') +
        '<ellipse class="scx-breath" cx="' + f1(M.hx) + '" cy="' + f1((M.sAngle + M.xiph) / 2) + '" rx="' + f1(Math.abs(f.landmarks.midaxL[0] - f.landmarks.midaxR[0]) * 0.4) + '" ry="' + f1((M.xiph - M.notch) * 0.6) + '"/>' +
        (St.preg ? '<ellipse class="scx-belly" cx="' + f1(M.hx) + '" cy="' + f1(M.umb) + '" rx="' + f1(Math.abs(f.landmarks.asisL[0] - f.landmarks.asisR[0]) * 0.62) + '" ry="' + f1((M.pubis - M.xiph) * 0.55) + '" fill="url(#scx-belly)"/>' : '') +
        '</g>');
      if(St.view === 'sit') h.push('</g>');
      }
      if(St.view === 'side'){ /* head drawn with the pose */ }
      else if(St.view === 'prone'){
        var hcol = (HAIR[St.id] || ['#2B2B2B'])[0];
        h.push('<ellipse cx="' + f1(M.hx) + '" cy="' + f1(M.hcy) + '" rx="' + f1(M.hrx * 1.04) + '" ry="' + f1(M.hry * 1.02) + '" fill="' + hcol + '"/><ellipse cx="' + f1(M.hx) + '" cy="' + f1(M.hcy) + '" rx="' + f1(M.hrx * 1.04) + '" ry="' + f1(M.hry * 1.02) + '" fill="url(#scx-light)"/>');
      } else h.push(face(M), hair(M, HAIR[St.id], St.kind, L));
      gFig.setAttribute('transform', T);
      gFig.innerHTML = h.join('');
      var isBack = St.view === 'prone', onSide = St.view === 'side', it = isBack ? {} : items(M, f, St.kind, site, G.view, 12.5 / G.k);
      // on the side: only the blanket stays drawn (a mask on the face cannot be seen from behind)
      if(onSide){ var mx = M.hx + M.cm * 2 + M.hry * 0.86, my = M.hcy + M.hry * 0.12, mr = M.hry * 0.3;
        it = { warm: it.warm, o2: it.o2 && '<ellipse class="scx-mask" cx="' + f1(mx) + '" cy="' + f1(my) + '" rx="' + f1(mr * 0.85) + '" ry="' + f1(mr * 1.2) + '" fill="#DDF1EA" fill-opacity=".6" stroke="#3E8A73" stroke-width="' + f1(mr * 0.12) + '"/>' +
          '<ellipse cx="' + f1(mx + mr * 0.9) + '" cy="' + f1(my + mr * 1.6) + '" rx="' + f1(mr * 0.9) + '" ry="' + f1(mr * 1.1) + '" fill="#BFE2D6" fill-opacity=".85" stroke="#6FA592" stroke-width="' + f1(mr * 0.08) + '"/>' +
          '<path d="M' + f1(mx + mr * 1.6) + ' ' + f1(my + mr * 2.2) + 'Q' + f1(mx + mr * 4) + ' ' + f1(my + mr * 4) + ' ' + f1(mx + mr * 6) + ' ' + f1(my + mr * 2) + '" stroke="#7FBFA9" stroke-width="' + f1(mr * 0.25) + '" fill="none" stroke-linecap="round"/>',
          blowby: it.blowby && '<ellipse class="scx-mask" cx="' + f1(mx + mr * 1.6) + '" cy="' + f1(my) + '" rx="' + f1(mr * 0.85) + '" ry="' + f1(mr * 1.2) + '" fill="#DDF1EA" fill-opacity=".6" stroke="#3E8A73" stroke-width="' + f1(mr * 0.12) + '"/>' +
          '<path d="M' + f1(mx + mr * 2.4) + ' ' + f1(my + mr * 0.4) + 'Q' + f1(mx + mr * 4.5) + ' ' + f1(my + mr * 2) + ' ' + f1(mx + mr * 6) + ' ' + f1(my + mr * 0.6) + '" stroke="#7FBFA9" stroke-width="' + f1(mr * 0.25) + '" fill="none" stroke-linecap="round"/>' }; }
      if(!site && !isBack && !onSide){ var it2 = items(M, f, St.kind, splintSite(f, fnd0), G.view, 12.5 / G.k); it.splint = it2.splint; }
      var on = [];
      if(mom) on.push('<g class="scx-mom">' + mom + '</g>');
      if(St.preg && !onSide){
        // the newborn on her chest once the case says the baby is born (shown by paint)
        var bc = M.cm, bx = M.hx, by = M.xiph + (M.umb - M.xiph) * 0.45, sk3 = '#E8A89C', ln3 = 'rgba(0,0,0,.25)';
        on.push('<g class="scx-nb">' +
          '<ellipse cx="' + f1(bx - bc * 5) + '" cy="' + f1(by + bc * 10) + '" rx="' + f1(bc * 3) + '" ry="' + f1(bc * 5) + '" fill="' + sk3 + '" stroke="' + ln3 + '" stroke-width="' + f1(bc * 0.3) + '" transform="rotate(25 ' + f1(bx - bc * 5) + ' ' + f1(by + bc * 10) + ')"/>' +
          '<ellipse cx="' + f1(bx + bc * 5) + '" cy="' + f1(by + bc * 10) + '" rx="' + f1(bc * 3) + '" ry="' + f1(bc * 5) + '" fill="' + sk3 + '" stroke="' + ln3 + '" stroke-width="' + f1(bc * 0.3) + '" transform="rotate(-25 ' + f1(bx + bc * 5) + ' ' + f1(by + bc * 10) + ')"/>' +
          '<ellipse cx="' + f1(bx) + '" cy="' + f1(by + bc * 2) + '" rx="' + f1(bc * 7) + '" ry="' + f1(bc * 9.5) + '" fill="' + sk3 + '" stroke="' + ln3 + '" stroke-width="' + f1(bc * 0.3) + '"/>' +
          '<path d="M' + f1(bx - bc * 8) + ' ' + f1(by + bc * 3) + ' Q' + f1(bx) + ' ' + f1(by - bc * 1) + ' ' + f1(bx + bc * 8) + ' ' + f1(by + bc * 3) + ' L' + f1(bx + bc * 7) + ' ' + f1(by + bc * 12) + ' Q' + f1(bx) + ' ' + f1(by + bc * 15) + ' ' + f1(bx - bc * 7) + ' ' + f1(by + bc * 12) + 'Z" fill="#F4EFE6" stroke="' + ln3 + '" stroke-width="' + f1(bc * 0.3) + '"/>' +
          '<ellipse cx="' + f1(bx - bc * 6) + '" cy="' + f1(by - bc * 3) + '" rx="' + f1(bc * 2) + '" ry="' + f1(bc * 3.5) + '" fill="' + sk3 + '" stroke="' + ln3 + '" stroke-width="' + f1(bc * 0.3) + '"/>' +
          '<ellipse cx="' + f1(bx + bc * 6) + '" cy="' + f1(by - bc * 3) + '" rx="' + f1(bc * 2) + '" ry="' + f1(bc * 3.5) + '" fill="' + sk3 + '" stroke="' + ln3 + '" stroke-width="' + f1(bc * 0.3) + '"/>' +
          '<circle cx="' + f1(bx) + '" cy="' + f1(by - bc * 10) + '" r="' + f1(bc * 6) + '" fill="' + sk3 + '" stroke="' + ln3 + '" stroke-width="' + f1(bc * 0.3) + '"/>' +
          '<path d="M' + f1(bx - bc * 2.4) + ' ' + f1(by - bc * 11) + ' q' + f1(bc * 1) + ' ' + f1(bc * 0.8) + ' ' + f1(bc * 2) + ' 0 M' + f1(bx + bc * 0.4) + ' ' + f1(by - bc * 11) + ' q' + f1(bc * 1) + ' ' + f1(bc * 0.8) + ' ' + f1(bc * 2) + ' 0" stroke="#5A3A30" stroke-width="' + f1(bc * 0.4) + '" fill="none" stroke-linecap="round"/>' +
          '<ellipse cx="' + f1(bx) + '" cy="' + f1(by - bc * 7.6) + '" rx="' + f1(bc * 1.2) + '" ry="' + f1(bc * 0.9) + '" fill="#9A4A44"/></g>');
      }
      if(isBack){
        var cm4 = M.cm, ky = M.notch + (M.xiph - M.notch) * 0.9;
        on.push('<g class="scx-it is-on scx-weight" data-k="weight"><path class="scx-cop scx-sleeve" d="M' + f1(-cm4 * 40) + ' ' + f1(ky - cm4 * 6) + 'L' + f1(M.hx + cm4 * 2) + ' ' + f1(ky - cm4 * 9) + 'Q' + f1(M.hx + cm4 * 12) + ' ' + f1(ky - cm4 * 8) + ' ' + f1(M.hx + cm4 * 12) + ' ' + f1(ky + cm4 * 1) + 'L' + f1(M.hx + cm4 * 4) + ' ' + f1(ky + cm4 * 8) + 'L' + f1(-cm4 * 40) + ' ' + f1(ky + cm4 * 9) + 'Z"/>' +
          '<ellipse class="scx-cop2 scx-sleeve" cx="' + f1(M.hx + cm4 * 4) + '" cy="' + f1(ky) + '" rx="' + f1(cm4 * 7.5) + '" ry="' + f1(cm4 * 8) + '"/>' +
          glove(f.landmarks.acromionR[0] - cm4 * 2, f.landmarks.acromionR[1] + cm4 * 4, 200, cm4) + '</g>');
      }
      ITEM_ORDER.forEach(function(k){ if(it[k]) on.push('<g class="scx-it" data-k="' + k + '">' + it[k] + '</g>'); });
      if(site) on.unshift('<g class="scx-it is-on" data-k="wound">' + it.wound + '</g>', '<g class="scx-jets" style="--hb:1s">' + jets(site) + '</g>');
      gOn.setAttribute('transform', T);
      gOn.innerHTML = on.join('');
      if(G.rot) gOn.querySelectorAll('.scx-tqt').forEach(function(t){ var x = t.getAttribute('x'), y = +t.getAttribute('y') - M.cm; t.setAttribute('transform', 'rotate(90 ' + x + ' ' + y + ')'); });
      gFig.classList.toggle('is-floor', G.view !== 'up');
      var m = G.mon; monHost.style.left = m.x + 'px'; monHost.style.top = m.y + 'px'; monHost.style.width = m.w + 'px'; monHost.style.height = m.h + 'px';
      whoEl.textContent = who(St.months, St.female, c ? c.nodes[c.startNode].text : '');
      var first = !St.drawn;
      paint(St.drawn || stateNow(), false); rates();
      if(first && !St.busy){ var l0 = labelList(null); St.labs = l0; St.labsOn = true; if(!St.path.length) cause.set(openCause()); }
      if(St.labsOn){ cancelAnimationFrame(St.labFrame); St.labFrame = requestAnimationFrame(function(){ St.labFrame = 0; if(St.labsOn) placeLabels(); }); }
    }
    function blob(cx, cy, rx, ry){
      var r = rng(Math.round(cx + cy)), n = 9, pts = [];
      for(var i = 0; i < n; i++){ var a = i / n * Math.PI * 2, k = 0.82 + r() * 0.3; pts.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]); }
      var d = 'M' + f1((pts[0][0] + pts[n - 1][0]) / 2) + ' ' + f1((pts[0][1] + pts[n - 1][1]) / 2);
      for(var j = 0; j < n; j++){ var p = pts[j], q = pts[(j + 1) % n]; d += 'Q' + f1(p[0]) + ' ' + f1(p[1]) + ' ' + f1((p[0] + q[0]) / 2) + ' ' + f1((p[1] + q[1]) / 2); }
      return d + 'Z';
    }
    function jets(site){
      var x = site.at[0], y = site.at[1], s = site.viewerLeft ? -1 : 1, r = site.r;
      return [[0.9, -0.2], [1.3, 0.5], [0.7, 0.9]].map(function(q, i){
        return '<path class="scx-jet scx-jet-e scx-jet' + i + '" d="M' + f1(x) + ' ' + f1(y) + 'Q' + f1(x + s * r * q[0] * 0.8) + ' ' + f1(y + r * (q[1] - 0.6)) + ' ' + f1(x + s * r * q[0] * 1.9) + ' ' + f1(y + r * q[1] * 1.6) + '"/>';
      }).join('');
    }
    function hives(f, M){
      var r = rng(5), out = [], lm = f.landmarks, an = f.anchors;
      [[an.armL, 1], [an.armR, 1], [[M.hx, (M.sAngle + M.xiph) / 2, M.r * 1.6], 1.4]].forEach(function(z){
        var a = z[0];
        for(var i = 0; i < 9; i++){ var x = a[0] + (r() - 0.5) * a[2] * 1.4 * z[1], y = a[1] + (r() - 0.3) * a[2] * 4 * z[1] * 0.6, s = M.r * (0.1 + r() * 0.1);
          out.push('<ellipse cx="' + f1(x) + '" cy="' + f1(y + (a === an.armL || a === an.armR ? M.r * 2 : 0)) + '" rx="' + f1(s * 1.3) + '" ry="' + f1(s) + '" fill="#E46A6A" stroke="#F6C1B5" stroke-width="' + f1(M.r * 0.03) + '"/>'); }
      });
      void lm;
      return out.join('');
    }

    /* the drawn state: what the case says now, faded or grown in (CSS transitions; reduced motion: a short cross fade) */
    function paint(S, anim){
      if(!G) return;
      var sk = S.skin, spo2 = monitor && monitor.shown ? monitor.shown.spo2 : null;
      gFig.classList.toggle('no-anim', !anim);
      gOn.classList.toggle('no-anim', !anim);
      svg.querySelector('.scx-pale') && svg.querySelector('.scx-pale').classList.toggle('is-on', sk === 'pale');
      var blue = sk === 'blue' && (spo2 == null || spo2 < J.pure.SPO2_LOW);
      (svg.querySelector('.scx-blue') || DUMMY).classList.toggle('is-on', blue);
      (svg.querySelector('.scx-hot') || DUMMY).classList.toggle('is-on', sk === 'hot');
      (svg.querySelector('.scx-mot') || DUMMY).classList.toggle('is-on', sk === 'mottled');
      (svg.querySelector('.scx-hives') || DUMMY).classList.toggle('is-on', !!S.hives);
      var belly = svg.querySelector('.scx-belly'); if(belly) belly.classList.toggle('is-off', !!S.born); var nbg = svgOn.querySelector('.scx-nb'); if(nbg) nbg.classList.toggle('is-on', !!S.born);
      gFig.setAttribute('data-eyes', S.eyes);
      gFig.classList.toggle('is-blue', blue);
      gFig.classList.toggle('is-sweat', !!S.sweat);
      gOn.querySelectorAll('.scx-it').forEach(function(g){
        var k = g.getAttribute('data-k');
        if(k === 'weight') return;
        var on = k === 'wound' ? S.bleed !== 'none' : k === 'press' ? !!(S.care.gauze && !S.care.tq) : !!S.care[k];
        if(k === 'gauze') on = !!S.care.gauze;
        g.classList.toggle('is-on', on);
      });
      var stain = gOn.querySelector('.scx-stain'); if(stain) stain.classList.toggle('is-wet', S.bleed === 'bleed' || S.bleed === 'spurt');
      var jt = gOn.querySelector('.scx-jets'); if(jt) jt.classList.toggle('is-on', S.bleed === 'spurt');
      var pool = gPool.querySelector('.scx-pool');
      if(pool){ var sc = S.pool ? Math.min(1.25, 0.45 + Math.sqrt(S.pool) * 0.34) : 0; pool.style.transform = 'scale(' + sc.toFixed(3) + ')'; pool.classList.toggle('is-on', sc > 0); }
      St.drawn = S;
    }
    /* the rates the picture moves at: the drawn numbers of the monitor */
    function rates(){
      var s = monitor ? monitor.shown : {}, t = monitor ? monitor.target : {};
      var rr = t.rrText === 'none' ? 0 : s.rr, hr = t.pulseless ? 0 : s.hr;
      var br = gFig.querySelector('.scx-breath');
      if(br){ br.classList.toggle('is-on', !!(rr && rr > 0) && !(St.drawn && St.drawn.care.bvm)); if(rr) gFig.style.setProperty('--br', (60 / rr).toFixed(2) + 's'); }
      var dc = St.drawn ? St.drawn.care : {};
      gOn.classList.toggle('is-nrp', St.months === 0 && !!dc.cpr);
      var bag = gOn.querySelector('.scx-bag');
      if(bag){ var ar = t.rrText === 'assisted' && rr ? rr : null; gOn.classList.toggle('is-bagging', !!ar); if(ar) gOn.style.setProperty('--bag', (60 / ar).toFixed(2) + 's'); }
      var jt = gOn.querySelector('.scx-jets'); if(jt && hr) jt.style.setProperty('--hb', (60 / hr).toFixed(2) + 's');
    }

    /* ------------------------------------------------------------------ the words on the picture */
    function labelList(prevCare){
      if(!G) return [];
      var out0 = [], f = G.f, sn = seen(), fnd = J.pure.findings(sn, { preg: !!St.preg }), res = J.care ? J.care.resolutions(sn) : null;
      var fnew = {}, k0;
      for(k0 in fnd){ var L0 = fnd[k0] || []; fnew[k0] = !L0.length ? L0 : L0[0].now ? L0.filter(function(x){ return x.now; }) : [L0[0]]; }
      var pins = J.pure.pinsFor(f, St.view === 'prone' || St.view === 'side' ? 'back' : 'front', fnew, res);
      var silent = false, crying = false;
      sn.some(function(x){ return own(x.text, St.preg).split(SENT).reverse().some(function(y){ if(!/cough|sound|voice|cry|air|breath/i.test(y)) return false; silent = SILENT.test(y); crying = !silent && CRYING.test(y); return true; }); });
      var born = !!St.preg && BORN.test(sn.map(function(x){ return x.text; }).join(' '));
      var cr = St.drawn ? St.drawn.careObj : null;
      if(J.care && cr) J.care.pins({ fig: f, f: fnd, careNow: cr, preg: St.preg, view: St.view === 'prone' || St.view === 'side' ? 'back' : 'front' }, pins);
      if(St.view === 'side') out0.push({ text: /recovery/i.test(sn.map(function(x){ return (x.did || '') + ' ' + x.text; }).join(' ')) ? 'Recovery position' : St.female ? 'On her left side' : 'On his left side', at: [f.w / 2, M.asis], tone: 'act' });
      if(St.view === 'prone'){ var wg = gOn.querySelector('.scx-weight .scx-cop2'); if(wg){ var wb = wg.getBBox(); out0.push({ text: 'Knee on his back', at: [wb.x + wb.width / 2, wb.y + wb.height / 2], tone: 'bad' }); } }
      var out = out0, it = St.drawn ? St.drawn.care : {};
      var fresh = ITEM_ORDER.filter(function(k){ return ITEM_LABEL[k] && it[k] && !(prevCare && prevCare[k]); });
      fresh.slice(0, 2).forEach(function(k){ var p = itemAt(k); if(p) out.push({ text: ITEM_LABEL[k], at: p, tone: 'act' }); });
      pins.sort(function(a, b){ return (b.fresh - a.fresh) || (b.sev - a.sev); });
      var bl = St.drawn ? St.drawn.bleed : 'none';
      pins.forEach(function(p){
        if(out.length >= (G.wide ? 3 : 2)) return;
        var t = p.what, sev = p.sev;
        if((p.key === 'legs' || p.key === 'arms') && /bleed|Bleeding|Controlled/i.test(t) && bl !== 'none'){
          t = bl === 'spurt' ? 'Spurting bleed' : bl === 'bleed' ? 'Still bleeding' : it.tq ? 'Tourniquet holds' : 'Bleeding stopped';
          sev = bl !== 'stop';
          if(bl === 'stop' && fresh.indexOf('tq') >= 0) return;
        }
        if(born && (p.key === 'birth' || /Contraction|Crowning|Baby born|Head delivered|Cord|Birth/.test(t))) return;
        if(/Cough/.test(t) && silent){ t = 'Cannot cough'; sev = true; }
        else if(/Cough/.test(t) && crying){ t = 'Crying'; sev = false; }
        if(p.key === 'head' || p.key === 'ms') t = t.split(', ')[0];
        var at = (p.key === 'head' || p.key === 'ms') && M ? [M.hx, M.top + M.hry * 0.18] : [p.x, p.y];
        if(/^Mottled/.test(t) && M) at = [M.hx + M.neckR * 0.8, M.notch];
        if(/^\d+ findings?$/.test(t) || out.some(function(x){ return x.text === t; })) return;
        out.push({ text: t, at: at, tone: sev ? 'bad' : 'see' });
      });
      // a step that ends with the patient crying (the newborn after 3:1) says so even with no cough to replace
      if(crying && M && sn[0] && /\b(cries|crying)\b/i.test(own(sn[0].text, St.preg)) && !out.some(function(x){ return x.text === 'Crying'; })) out.push({ text: 'Crying', at: [M.hx, M.chin], tone: 'see' });
      return out;
    }
    function itemAt(k){
      var g = gOn.querySelector('.scx-it[data-k="' + k + '"]'); if(!g) return null;
      if(k === 'pads') g = g.querySelector('.scx-pad-back') || g.querySelector('.scx-pad') || g;  // a pad (the back pad's edge: the front one is under the hands), not the AED
      try{ var b = g.getBBox(); return [b.x + b.width / 2, b.y + b.height / 2]; }catch(e){ return null; }
    }
    function rel(n){ var r = n.getBoundingClientRect(), h = pic.getBoundingClientRect(); if(!r.width) return null; return { l: r.left - h.left, t: r.top - h.top, r: r.right - h.left, b: r.bottom - h.top }; }
    var DRAWN = PD.DRAWN('scx-', '.scx-on > g.is-on');
    function drawnBoxes(){ var id = function(x, y){ return [x, y]; }; return PD.drawnBoxes(svg, DRAWN, id).concat(PD.drawnBoxes(svgOn, DRAWN, id)); }
    function placeLabels(list){
      if(list) St.labs = list;
      St.labsOn = true;
      labs.innerHTML = ''; lead.innerHTML = '';
      if(!G || !St.labs) return;
      lead.setAttribute('viewBox', '0 0 ' + G.W + ' ' + G.H);
      var taken = [], drawn = drawnBoxes(), mon = G.mon;
      taken.push({ l: mon.x, t: mon.y, r: mon.x + mon.w, b: mon.y + mon.h });
      var wr = rel(whoEl); if(wr) taken.push(wr);
      St.labs.forEach(function(L){
        var e = el('span', 'scx-lab is-' + L.tone, esc(L.text)); labs.appendChild(e);
        var w = e.offsetWidth, h = e.offsetHeight, p = P(L.at[0], L.at[1]);
        var best = PD.place(p, w, h, { bounds: { x: 0, y: 0, w: G.W, h: G.H }, taken: taken, keep: null, drawn: drawn, dists: [30, 48, 70, 96, 130, 170, 220] });
        if(!best){ e.remove(); return; }
        e.style.left = best.l.toFixed(1) + 'px'; e.style.top = best.t.toFixed(1) + 'px';
        taken.push(best);
        var ex = clamp(p[0], best.l + 6, best.r - 6), ey = p[1] < best.t ? best.t : p[1] > best.b ? best.b : (best.t + best.b) / 2;
        lead.insertAdjacentHTML('beforeend', '<line class="scx-ld is-' + L.tone + '" x1="' + f1(p[0]) + '" y1="' + f1(p[1]) + '" x2="' + f1(ex) + '" y2="' + f1(ey) + '"/><circle class="scx-dot is-' + L.tone + '" cx="' + f1(p[0]) + '" cy="' + f1(p[1]) + '" r="3.5"/>');
        void e.offsetWidth; e.classList.add('is-in');
      });
    }
    function clearLabels(){ cancelAnimationFrame(St.labFrame); St.labFrame = 0; St.labsOn = false; labs.innerHTML = ''; lead.innerHTML = ''; }

    /* ------------------------------------------------------------------ the call */
    function vit(n){ var v = J.pure.parseVitals(vline(n)); v.pulseless = !!St.pls; v.hadPulse = hadPulse(); return v; }
    // did any step so far show a pulse (a heart rate, or the case's words)?
    function hadPulse(){
      return seen().some(function(x){ var v = J.pure.parseVitals(x.vitals), t = own(x.text, St.preg), m = PLS_OFF.exec(t);
        return (v.hr != null && v.hr > 0 && !v.pulseless) || (m && !NEG.test(t.slice(0, m.index))); });
    }
    /* no pulse, carried across the steps: the vitals line or the case's own words set it, a heart rate or the pulse's */
    var PLS_ON = /\b(pulseless|no pulse|can't feel a pulse|cannot feel a pulse|without a pulse)\b/i, PLS_OFF = /\b(pulse (returns|is back)|has a pulse|return of spontaneous circulation|ROSC|pulse is present|achieves return|no further shock|breathe on (his|her) own|breath of (his|her) own|starts? (to )?breathe)\b/i;
    function plsNow(){
      var sn = seen().slice().reverse(), on = false;
      sn.forEach(function(x){
        var v = J.pure.parseVitals(x.vitals), t = own(x.text, St.preg), m;
        if(v.pulseless) on = true;
        else if(v.hr != null) on = false;
        else if((m = PLS_OFF.exec(t)) && !NEG.test(t.slice(0, m.index))) on = false;
        else if((m = PLS_ON.exec(t)) && !NEG.test(t.slice(Math.max(0, m.index - 12), m.index))) on = true;
      });
      return on;
    }
    function stateNow(skipNow){
      var sn = seen(), care = careOf(J, sn, { preg: !!St.preg, he: !St.female, skipNow: !!skipNow }), S = stateOf(sn, care, St.months, St.preg);
      S.care = care.on; S.careObj = care;
      S.born = !!St.preg && BORN.test(sn.map(function(x){ return x.text; }).join(' '));
      return S;
    }
    var T_CHANGE = 1150;
    function show(id, user){
      var c = SC.filter(function(s){ return s.id === id; })[0];
      if(!c) return false;
      clearTimers(); St.busy = false; St.pend = null;
      St.id = id; St.node = c.startNode; St.path = []; St.dirs = []; St.drawn = null;
      var open = c.nodes[c.startNode].text;
      St.months = J.pure.ageMonths(open);
      var pt = { kind: 'x', he: true };
      St.preg = J.care ? J.care.pregnancy(open, pt) : null;
      St.female = femaleOf(open, !pt.he);
      St.kind = St.months == null || St.months >= 144 ? (St.female ? 'female' : 'adult') : St.months < 12 ? 'infant' : St.months < 60 ? 'toddler' : 'child';
      St.pls = plsNow();
      box.querySelector('.scx-call').textContent = c.title;
      box.setAttribute('data-call', id);
      if(pick && user !== 'pick') pick.value(id);
      if(monitor){ monitor.destroy(); monitor = null; }
      monitor = new J.Monitor({ months: St.months, compact: true });
      monHost.innerHTML = ''; monHost.appendChild(monitor.el);
      monitor.show(vline(c.nodes[c.startNode]), null);
      if(!St.on) monitor.pause();
      var S = stateNow();
      St.view = viewFor(S.careObj);
      clearLabels();
      // the words are placed on the next frame, once the new drawing's geometry is in (a new call's boxes)
      var go = function(){ layout(); draw(); paint(S, false); rates(); var ll = labelList(null); St.labs = ll; St.labsOn = true; if(!St.path.length) cause.set(openCause());
        cancelAnimationFrame(St.labFrame); St.labFrame = requestAnimationFrame(function(){ St.labFrame = 0; placeLabels(ll); if(cue && cue.active()) cue.place(); }); };
      if(St.F) go(); else loadFigs(go);
      renderBoard(false);
      cause.set(openCause(S));
      if(user && o.onAct) o.onAct('call', id);
      if(user && window.LevlAnalytics) window.LevlAnalytics.event('scenario-start', { scenario: id, mode: 'explore' });
      return true;
    }
    function openCause(){
      var c = call(), w = who(St.months, St.female, c.nodes[c.startNode].text), tops = (St.labs || []).filter(function(l){ return l.tone !== 'act'; });
      var first = tops[0] ? tops[0].text : '';
      if(!first && G){ var sn = seen(), p = J.pure.pinsFor(G.f, 'front', J.pure.findings(sn, { preg: !!St.preg }), null).filter(function(x){ return !/^\d+ findings?$/.test(x.what); }); if(p[0]) first = p[0].what; }
      return [{ t: w, role: 'pt' }].concat(first ? [{ t: first, role: 'pt' }] : []);
    }

    /* the card: the decisions so far, what happened, what you see now, what you could do */
    function renderBoard(anim){
      var c = call(), n = node(); if(!c || !n) return;
      pathEl.innerHTML = St.path.map(function(p, i){
        var d = St.dirs[i] || 'same';
        return '<li><button type="button" class="scx-pp is-' + d + '" data-i="' + i + '" aria-label="Go back to decision ' + (i + 1) + ': ' + esc(p.text) + '" title="' + esc(p.text) + '"><span>' + (i + 1) + '</span></button></li>';
      }).join('');
      pathEl.hidden = !St.path.length;
      var last = St.path[St.path.length - 1];
      whatEl.hidden = !(last && last.consequence);
      whatEl.querySelector('span').textContent = last && last.consequence ? last.consequence : '';
      nowEl.querySelector('b').textContent = St.path.length ? (n.ending ? 'How it went' : 'Now') : 'On scene';
      nowEl.querySelector('span').textContent = n.text;
      box.querySelector('.scx-back').disabled = !St.path.length;
      box.querySelector('.scx-reset').disabled = !St.path.length;
      if(n.ending){
        actsEl.hidden = true; endEl.hidden = false;
        var out = endEl.querySelector('.scx-out');
        out.className = 'scx-out is-' + n.ending;
        out.textContent = n.ending === 'good' ? 'Good outcome' : n.ending === 'bad' ? 'Poor outcome' : 'Mixed outcome';
        var nx = nextCall();
        endEl.querySelector('.scx-enext').textContent = 'Next call: ' + nx.title;
      } else {
        actsEl.hidden = false; endEl.hidden = true;
        actsEl.querySelector('.scx-tc').hidden = !(J.HESITATE && J.HESITATE[St.node]);
        chEl.innerHTML = n.choices.map(function(ch, i){ return '<button type="button" class="scx-c" data-i="' + i + '"><span class="scx-cn" aria-hidden="true">' + 'ABCDEF'.charAt(i) + '</span><span class="scx-ct">' + esc(ch.text) + '</span></button>'; }).join('');
      }
      bodyEl.scrollTop = 0; moreFade();
      board.classList.toggle('is-in', !!anim);
      if(anim){ void board.offsetWidth; board.classList.add('is-turn'); later(function(){ board.classList.remove('is-turn'); }, 400); }
    }
    function moreFade(){ bodyEl.classList.toggle('is-more', bodyEl.scrollHeight - bodyEl.scrollTop - bodyEl.clientHeight > 4); }
    bodyEl.addEventListener('scroll', moreFade, { passive: true });
    function nextCall(){ var i = SC.findIndex(function(s){ return s.id === St.id; }); return SC[(i + 1) % SC.length]; }

    /* a choice: the care goes on, the numbers slide, the signs follow; the card and the words wait for the picture */
    function choose(i){
      var c = call(), n = node();
      if(St.busy || !n || !n.choices || !n.choices[i]) return;
      var ch = n.choices[i];
      if(cue) cue.hide(true);
      tour.did('pick');
      var before = vit(n), prevCare = St.drawn ? St.drawn.care : {};
      St.kbd = !!(document.activeElement && board.contains(document.activeElement) && document.activeElement.matches(':focus-visible'));
      St.path.push({ from: St.node, index: i, text: ch.text, consequence: ch.consequence || '' });
      St.node = ch.next;
      step(before, prevCare, ch.text, 'pick', i);
    }
    function step(before, prevCare, actText, how, i){
      var c = call(), n = node();
      St.busy = true;
      clearLabels();
      chEl.querySelectorAll('.scx-c').forEach(function(b, k){ b.disabled = true; b.classList.toggle('is-picked', how === 'pick' && k === i); b.classList.toggle('is-other', !(how === 'pick' && k === i)); });
      board.classList.add('is-busy');
      var S = stateNow(), nv = vit(n), v2 = viewFor(S.careObj), anim = !rd();
      cause.set([{ t: shortAction(actText), role: 'act' }]);
      /* a step whose own words tell a sequence (compressions with the bag at 3:1, then he breathes and cries): the
         chosen care plays first, for a few cycles, then the picture turns to what the words say happened */
      var Sm = how === 'pick' ? stateNow(true) : null, hold = 0;
      /* laid flat by the choice, then the words sit her back up (s11): show her down first, then up again */
      if(anim && how === 'pick' && P_FLAT.test(actText) && (v2 === 'up' || v2 === 'sit')){
        var swap = function(v, S2){ St.view = v; layers.classList.add('is-fade'); later(function(){ draw(); paint(S2, false); rates(); layers.classList.remove('is-fade'); }, 260); };
        swap('floor', Sm);
        later(function(){ if(monitor && vline(n)) monitor.show(vline(n), null); swap(v2, S); }, 2600);
        St.pend = { before: before, prevCare: prevCare, actText: actText, how: how };
        later(function(){ finish(); }, 2600 + T_CHANGE);
        return;
      }
      if(anim && Sm && v2 === St.view && ((Sm.care.cpr && !S.care.cpr) || (Sm.care.bvm && !S.care.bvm))){
        hold = St.months === 0 ? 4000 : 3000;
        Sm.eyes = St.drawn ? St.drawn.eyes : Sm.eyes; Sm.skin = St.drawn ? St.drawn.skin : Sm.skin;
        paint(Sm, true); rates();
        later(function(){ if(monitor && vline(n)) monitor.show(vline(n), null); paint(S, true); rates(); }, hold);
        St.pend = { before: before, prevCare: prevCare, actText: actText, how: how };
        later(function(){ finish(); }, hold + T_CHANGE);
        return;
      }
      var go = function(){
        if(monitor && !(n.ending && !vline(n)) && !(St.preg && n.vitals && !vline(n))) monitor.show(vline(n), null);
        if(v2 !== St.view){
          St.view = v2;
          layers.classList.add('is-fade');
          later(function(){ draw(); paint(S, false); rates(); layers.classList.remove('is-fade'); }, anim ? 260 : 0);
        } else { paint(S, anim); }
      };
      go();
      St.pend = { before: before, prevCare: prevCare, actText: actText, how: how };
      later(function(){ finish(); }, anim ? T_CHANGE : 200);
    }
    function finish(){
      var pd = St.pend; if(!pd) return;
      St.pend = null;
      var c = call(), n = node();
      if(monitor && monitor.tween && monitor.tween.dur){ monitor.applyTween(1); monitor.tween = null; }
      rates();
      St.pls = plsNow();
      var after = monitor ? { hr: monitor.shown.hr, sys: monitor.shown.sys, rr: monitor.shown.rr, spo2: monitor.shown.spo2, pulseless: St.pls } : vit(n);
      var d = direction(J, pd.before, after, St.months);
      if(pd.how === 'pick') St.dirs[St.path.length - 1] = d ? d.dir : 'same';
      St.busy = false;
      board.classList.remove('is-busy');
      renderBoard(true);
      if(St.kbd){ St.kbd = false; var fc = chEl.querySelector('.scx-c') || endEl.querySelector('.scx-eb'); if(fc && !fc.closest('[hidden]')) fc.focus(); }
      var ll = labelList(pd.prevCare); St.labs = ll; St.labsOn = true;
      cancelAnimationFrame(St.labFrame); St.labFrame = requestAnimationFrame(function(){ St.labFrame = 0; placeLabels(ll); });
      var parts = [{ t: shortAction(pd.actText), role: 'act' }];
      if(n.ending){
        if(monitor) monitor.pause();
        var oc = n.ending === 'good' ? 'Good outcome' : n.ending === 'bad' ? 'Poor outcome' : 'Mixed outcome';
        parts.push({ t: oc, role: n.ending === 'good' ? 'up' : n.ending === 'bad' ? 'down' : 'same' });
        cause.set(parts);
        later(function(){ cause.take(oc + '. Tap a number on the card to try another way.'); }, rd() ? 0 : 900);
        if(window.LevlAnalytics) window.LevlAnalytics.event('scenario-finish', { scenario: St.id, ending: n.ending, mode: 'explore' });
        say(oc + '. ' + n.text);
      } else {
        var p2 = pill2(d, after), nb = St.preg && /^\s*newborn\b:?\s*/i.exec(n.vitals || '');
        // a step about the baby: say what the baby does, not the mother's steady numbers
        if(nb){ p2 = 'Baby ' + n.vitals.slice(nb[0].length).split('·').slice(0, 2).map(function(x){ return x.trim(); }).join(', '); d = null; }
        if(!p2){ var tops = (St.labs || []).filter(function(l){ return l.tone !== 'act'; }); p2 = tops[0] ? tops[0].text : ''; }
        if(p2) parts.push({ t: p2, role: 'pt' });
        if(d && d.dir) parts.push({ t: d.dir === 'better' ? 'Better' : d.dir === 'worse' ? 'Worse' : 'About the same', role: d.dir === 'better' ? 'up' : d.dir === 'worse' ? 'down' : 'same' });
        cause.set(parts);
        var last = St.path[St.path.length - 1];
        say(cause.text().replace(/\.+$/, '') + '. ' + (pd.how === 'pick' && last && last.consequence ? last.consequence + ' ' : '') + n.text);
      }
      if(!box.classList.contains('is-wide')) keepBoardInView();
    }
    function finishNow(){ if(St.pend){ clearTimers(); var nn = node(); if(monitor && vline(nn) && !(nn.ending && !vline(nn))) monitor.show(vline(nn), null); layers.classList.remove('is-fade'); if(St.view !== viewFor(stateNow().careObj)){ St.view = viewFor(stateNow().careObj); draw(); } paint(stateNow(), false); finish(); } }
    /* back to an earlier decision (free play: the other branch is one tap away) */
    function backTo(i){
      if(St.busy){ finishNow(); }
      if(i < 0 || i >= St.path.length) return;
      var before = vit(node()), prevCare = St.drawn ? St.drawn.care : {}, p = St.path[i];
      St.path = St.path.slice(0, i); St.dirs = St.dirs.slice(0, i);
      St.node = p.from;
      if(monitor) monitor.resume();
      if(!St.on && monitor) monitor.pause();
      step(before, prevCare, 'Back to decision ' + (i + 1), 'back');
      tour.did('back');
    }
    function reset(){ if(St.busy) finishNow(); if(!St.path.length) return; backTo(0); }
    function keepBoardInView(){
      var r = board.getBoundingClientRect(), vh = window.innerHeight || 800;
      if(r.top > vh * 0.75) try{ window.scrollBy({ top: r.top - vh * 0.45, behavior: rd() ? 'auto' : 'smooth' }); }catch(e){}
    }

    board.addEventListener('click', function(e){
      var b = e.target.closest('button'); if(!b || b.disabled) return;
      if(b.classList.contains('scx-c')) choose(+b.getAttribute('data-i'));
      else if(b.classList.contains('scx-pp')) backTo(+b.getAttribute('data-i'));
      else if(b.classList.contains('scx-back') || b.classList.contains('scx-eback')) backTo(St.path.length - 1);
      else if(b.classList.contains('scx-reset') || b.classList.contains('scx-eagain')) reset();
      else if(b.classList.contains('scx-enext')){ var nx = nextCall(); show(nx.id, true); setHash(nx.id); }
    });
    chEl.addEventListener('click', function(){
      if(box.classList.contains('is-wide')) return;
      var r = pic.getBoundingClientRect();
      if(r.bottom < 60 || r.top < -r.height * 0.4) try{ pic.scrollIntoView({ block: 'start', behavior: rd() ? 'auto' : 'smooth' }); }catch(e){}
    });
    box.addEventListener('pointerdown', function(e){ if(cue && cue.active() && e.target.closest('.scx-board')) cue.hide(true); });

    /* ------------------------------------------------------------------ the call picker, the cue, the tour, "?" */
    var CATS = o.cats || [], catOf = o.catOf || function(){ return ''; };
    var pick = studio && studio.picker ? studio.picker({ label: 'Call', value: SC[0] && SC[0].id,
      groups: CATS.map(function(c){ return { label: c.label, items: SC.filter(function(x){ return catOf(x) === c.k; }).map(function(x){ return { value: x.id, label: x.title, sub: c.label }; }) }; }).filter(function(g){ return g.items.length; }),
      onChange: function(v){ show(v, 'pick'); if(o.onAct) o.onAct('call', v); setHash(v); } }, 'explore') : null;
    function setHash(id){ if(history.replaceState) try{ history.replaceState(null, '', location.pathname + location.search.replace(/[?&]scenario=[^&]*/, '').replace(/^&/, '?') + '#call-' + id); }catch(e){} }
    var cue = null;
    function firstChoice(){ return chEl.querySelector('.scx-c'); }
    function makeCue(){
      var wide = box.classList.contains('is-wide');
      cue = K.cue(layer, { key: 'nremt-scenario-sim', text: 'Pick what you would do', side: wide ? 'left' : 'above', at: function(){
        var b = firstChoice(), h = box.getBoundingClientRect(); if(!b) return [0, 0];
        var r = b.getBoundingClientRect();
        return wide ? [r.left - h.left - 6, r.top - h.top + r.height / 2] : [r.left - h.left + Math.min(120, r.width / 2), r.top - h.top - 8];
      } });
    }
    var tour = K.tour({ key: 'nremt-scenario-sim', label: 'Show me how', steps: [
      { id: 'pick', text: 'Read the card, then pick what you would do. The patient and the monitor answer.', target: function(){ return firstChoice() || board; } },
      { id: 'look', text: 'Watch the patient: the care you give goes on, and the skin, eyes and breathing follow the case.', target: function(){ return pic; } },
      { id: 'back', text: 'Tap a number on the card to go back to that decision and try another choice. The scored run is in Test yourself.', target: function(){ return pathEl.hidden ? box.querySelector('.scx-back') : pathEl; } }
    ] });
    function startTour(){ if(cue) cue.hide(true); tour.start(true); }

    var ref = el('div', 'scx-ref');
    ref.innerHTML =
      '<h3>What you are looking at</h3>' +
      '<p>One EMT call, its patient drawn where the call takes place, the monitor beside them and the call card on a clipboard. The card says what you see now and what you could do. Pick one: the care you chose goes onto the patient, the monitor slides to the numbers the case gives for what happens next, and the patient’s skin, eyes and breathing follow what the case says. Then the card turns to what happened.</p>' +
      '<ul class="scx-ref-l">' +
      '<li><b>Nothing is invented.</b> Every number on the monitor is one the case prints for that step; a number the case does not give shows a dash. The signs on the body come from the case’s own words, newest first, and the words on the patient are short forms of them.</li>' +
      '<li><b>Better or worse.</b> The line under the picture compares the numbers before and after against the reference ranges for the patient’s age (the same ranges as the Reference cards; SpO₂ under 94% is low). It describes the numbers, not whether the choice was right.</li>' +
      '<li><b>Colors.</b> <span class="scx-k is-act">Teal</span> is what you did, <span class="scx-k is-pt">brown</span> what it did to the patient, <span class="scx-k is-up">green</span> better and <span class="scx-k is-down">red</span> worse.</li>' +
      '<li><b>Going back.</b> The numbers on the card are your decisions. Tap one to stand at that decision again; Start over goes back to the first. Explore keeps no score and nothing goes to your Review queue.</li>' +
      '<li><b>Time critical.</b> At a few decisions the case says waiting costs the patient. In Explore that is a tag on the card; in <button type="button" class="tk2-link scx-ref-test">Test yourself</button> the monitor drifts while you decide, the run is scored and each call you could have made better goes to Review.</li>' +
      '</ul>' +
      '<p class="scx-ref-p"><button type="button" class="tk2-how scx-ref-how">Show me how</button></p>' +
      '<div class="scx-ref-more"></div>' +
      '<p class="scx-ref-s">Patient figure rendered from <a href="https://lifesciencedb.jp/bp3d/" target="_blank" rel="noopener">BodyParts3D</a>, © 2008 Life Science Integrated Database Center, <a href="https://creativecommons.org/licenses/by-sa/2.1/jp/deed.en" target="_blank" rel="noopener">CC BY-SA 2.1 JP</a>. Clothes, faces, settings and equipment are drawn for this site. The calls are made up; the monitor is simulated.</p>';
    ref.querySelector('.scx-ref-how').addEventListener('click', function(){ if(studio){ if(studio.kit2 && studio.kit2.mode() !== 'explore') studio.kit2.go('explore'); if(studio.close) studio.close(); } setTimeout(startTour, 60); });
    ref.querySelector('.scx-ref-test').addEventListener('click', function(){ if(studio && studio.kit2){ if(studio.close) studio.close(); studio.kit2.go('quiz'); } });
    if(o.more) ref.querySelector('.scx-ref-more').appendChild(o.more);

    /* Premium: before launch, or with a pass, the call is open; locked, the stage shows the gate instead */
    function gated(){
      var g = o.gate ? o.gate() : '';
      gateBox.hidden = !g; box.hidden = !!g; lines.hidden = !!g; head.el.hidden = !!g;
      if(g) gateBox.innerHTML = g;
      if(pick) pick.el.classList.toggle('ls-off', !!g);
      return !!g;
    }

    var rt = 0;
    if(window.ResizeObserver) new ResizeObserver(function(){ clearTimeout(rt); rt = setTimeout(function(){
      if(!St.on) return;
      layout();
      var g = geom(); if(g && (!G || Math.abs(g.W - G.W) > 1 || Math.abs(g.H - G.H) > 1 || g.wide !== G.wide)){ draw(); rates(); }
      if(cue && cue.active()) cue.place();
    }, 60); }).observe(stage);
    document.addEventListener('visibilitychange', function(){ if(document.hidden && St.on){ finishNow(); if(monitor) monitor.pause(); } else if(!document.hidden && St.on && monitor) monitor.resume(); });

    /* the care rules live in scenario-care.js, which the run's monitor fetches with its first patient; Explore needs */
    function needCare(){
      if(J.care || needCare.on) return;
      needCare.on = true;
      var t = document.createElement('script'), mon = document.querySelector('script[src*="scenario-monitor.js"]');
      t.src = (mon ? mon.src.replace(/[^\/]*$/, '') : 'assets/') + 'scenario-care.js';
      t.onload = function(){ if(St.id && !St.path.length) show(St.id, false); else if(St.id){ var S = stateNow(); St.view = viewFor(S.careObj); draw(); paint(S, false); rates(); placeLabels(labelList(null)); } };
      document.head.appendChild(t);
    }
    needCare();
    show((SC[0] || {}).id, false);
    var api = {
      stage: stage, ref: ref,
      shown: function(){
        St.on = true; gated(); layout();
        var g = geom(); if(g && (!G || g.W !== G.W || g.H !== G.H || g.wide !== G.wide)){ draw(); }
        if(monitor) monitor.resume();
        rates(); stage.classList.remove('is-off');
        if(St.labsOn) placeLabels();
        if(!St.cued && !gateBox.innerHTML){ St.cued = true; later(function(){ if(!cue) makeCue(); if(St.on && !St.path.length && cue.show()) cue.place(); }, 350); }
      },
      hidden: function(){
        finishNow(); clearTimers();
        St.on = false; if(monitor) monitor.pause(); stage.classList.add('is-off');
        if(cue) cue.hide(false);
      },
      refresh: function(){ if(St.on) gated(); },
      show: function(id){ return show(id, false); }, id: function(){ return St.id; },
      _state: function(){ var n = node(); return { id: St.id, node: St.node, path: St.path.map(function(p){ return p.index; }), busy: St.busy, view: St.view, on: St.on, timers: timers.length,
        chain: cause.text(), take: cause.el.classList.contains('is-take') ? cause.el.textContent : '', drawn: St.drawn ? { eyes: St.drawn.eyes, skin: St.drawn.skin, bleed: St.drawn.bleed, pool: St.drawn.pool, care: St.drawn.care } : null,
        shown: monitor ? { hr: monitor.shown.hr, sys: monitor.shown.sys, rr: monitor.shown.rr, spo2: monitor.shown.spo2 } : null, hadSpo2: !!(monitor && monitor.hadSpo2), tween: !!(monitor && monitor.tween && monitor.tween.dur), raf: !!(monitor && monitor.raf),
        ending: n && n.ending || '', labs: (St.labs || []).map(function(l){ return l.text; }), kind: St.kind, pend: !!St.pend,
        geo: G && M ? { W: G.W, H: G.H, wide: G.wide, mon: G.mon, drawn: drawnBoxes() } : null }; }
    };
    window.NremtScenarioExplore.last = api;
    return api;
  }
  window.NremtScenarioExplore = { build: build, pure: PURE };
})();
