/* AP® Physics 1 question engine: renders and grades every item type wherever a
   question appears (lesson checks, practice, review, exams). Forked from the
   AP® Chemistry engine (docs/apphys-spec.md decision 1); formats in
   docs/apphys-architecture.md. Numeric items are graded on three things
   separately (value, units, significant figures). Physics changes: units
   are compared in SI base units (N = kg·m/s², J = N·m, W = J/s, Pa = N/m²,
   Hz = 1/s; rad is dimensionless), an item may accept the key worked with
   the other value of g (numeric.gAlt), and the targeted feedback names the
   slips physics readers report: a sign error, a factor of 2 (½mv²), a
   forgotten square or square root, g = 9.8 vs 10, degrees vs radians, and
   cm vs m (or g vs kg).

     ApPhysQuestions.render(q, host, opts) -> { el, done() }
       opts.n         the number shown before the stem
       opts.record    false to skip ApPhysCore.record (prerequisite checks)
       opts.onAnswer(result)  result = { correct, score (0..1), q, pick }
       opts.reveal    show every option's explanation after answering (default true)
       opts.exam      grade silently, no feedback
     ApPhysQuestions.hydrate(container, items, opts) renders a list, placing one
       stimulus panel above each run of items that share a stimulus (a set),
       in authored order.
     ApPhysQuestions.grade(q, response) is the pure grader the renderer uses
       (and the tests call): single -> option index; multi -> array of indices;
       numeric -> the typed string, or { value, unit } when the item asks for
       the unit in its own box; order -> authored indices in the order the
       student placed them; predict -> { variableIndex: 'up'|'down'|'none' }.

   Options are shuffled for display, so an explanation never names a letter
   or position (check-apphys-content enforces it). An item marked "fixed" (a
   find-the-error list, options that are a scale) is never shuffled. Order
   items are shuffled for display and graded against the authored order. */
(function(){
  function esc(s){ return String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
  function html(s){ return String(s == null ? '' : s); }   // our own authored markup (<i>, <sub>)
  function shuffle(a){ a = a.slice(); for(var i = a.length - 1; i > 0; i--){ var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  var uid = 0;

  /* What a student types, split into its parts:
       "1.80 × 10^-5 M", "1.8e-5", "−286 kJ/mol", "11,300 J", "2,4", ".50"
     -> { num: the number, digits: the mantissa as typed, unit: the rest }, or
     null. A comma is a thousands separator in "1,234" and a decimal point in
     "2,4". Powers of ten may be written e-5, × 10^-5, x10^-5, *10**-5 or with
     superscripts (× 10⁻⁵). Anything after the number is the unit; it may
     carry its own exponents (mol^-1, s⁻¹, cm³) but no second number. */
  var SUP = { '⁰': '0', '¹': '1', '²': '2', '³': '3', '⁴': '4', '⁵': '5', '⁶': '6', '⁷': '7', '⁸': '8', '⁹': '9', '⁻': '-', '⁺': '+' };
  function unsup(x){ return String(x).replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹⁻⁺]/g, function(c){ return SUP[c]; }); }
  var NUM_RE = /^([+-]?)\s*([0-9][0-9,]*\.?[0-9]*|\.[0-9]+)\s*(?:[eE]\s*([+-]?[0-9]+)|[×xX*]\s*10\s*(?:\^|\*\*)?\s*([+-]?[0-9]+))?(?![0-9])\s*(.*)$/;
  function splitNumber(s){
    s = unsup(String(s == null ? '' : s)).trim().replace(/[−–]/g, '-').replace(/\s+/g, ' ');
    var m = NUM_RE.exec(s);
    if(!m) return null;
    var num = m[2], ex = m[3] != null ? m[3] : m[4], rest = (m[5] || '').trim();
    // Digits in the unit are allowed only as exponents right after a letter
    // or a closing bracket (mol-1, s^-1, cm3, (mol K)-1).
    if(/[0-9]/.test(rest.replace(/([A-Za-z°)])(\^|\*\*)?[+-]?[0-9]+/g, '$1'))) return null;
    if(/^\d{1,3}(,\d{3})+(\.\d*)?$/.test(num)) num = num.replace(/,/g, '');
    else if(/^\d+,\d+$/.test(num)) num = num.replace(',', '.');
    else if(num.indexOf(',') > -1) return null;
    var v = parseFloat(num) * (ex != null ? Math.pow(10, +ex) : 1);
    if(!isFinite(v)) return null;
    return { num: m[1] === '-' ? -v : v, digits: num, unit: rest };
  }
  function parseNumber(s){ var p = splitNumber(s); return p ? p.num : NaN; }

  /* Significant figures in a typed mantissa ("0.00450" -> 3, "1.80" -> 3,
     "1200" -> 2, "1200." -> 4). Trailing zeros without a decimal point are
     not counted (they are ambiguous); scientific notation settles them. */
  function sigFigs(digits){
    var d = String(digits || '').replace(/^[+-]/, '').replace(/,/g, '');
    var dot = d.indexOf('.') > -1, all = d.replace('.', '');
    var lead = all.replace(/^0+/, '');
    if(!lead) return dot ? Math.max(1, (d.split('.')[1] || '').length) : 1;
    return dot ? lead.length : lead.replace(/0+$/, '').length;
  }
  function places(digits){ var d = String(digits || ''); return d.indexOf('.') > -1 ? d.split('.')[1].length : 0; }

  /* Units are compared in SI base units after normalizing how they can be
     typed: "m/s^2" = "m s⁻²" = "m/s/s" = "m·s^-2"; "N" = "kg·m/s²";
     "J" = "N·m" = "kg m^2/s^2"; "W" = "J/s"; "Pa" = "N/m²"; "Hz" = "1/s";
     "newtons" = "N", "meters" = "m", "degrees" = "°" = "deg". A prefixed unit
     (cm, km, kN, g for grams) stays itself, so cm is not m (scaleTo names the
     slip). Case matters otherwise (mm is not Mm). An unreadable token is kept
     as itself, so it only ever matches the same token. */
  var DERIVED = { N: { kg: 1, m: 1, s: -2 }, J: { kg: 1, m: 2, s: -2 }, W: { kg: 1, m: 2, s: -3 }, Pa: { kg: 1, m: -1, s: -2 }, Hz: { s: -1 } };
  var WORDS = [[/\bnewtons?\b/gi, 'N'], [/\bjoules?\b/gi, 'J'], [/\bwatts?\b/gi, 'W'], [/\bpascals?\b/gi, 'Pa'], [/\bhertz\b/gi, 'Hz'],
    [/\b(kilograms?|kgs)\b/gi, 'kg'], [/\bgrams?\b/gi, 'g'], [/\b(centimet(er|re)s?)\b/gi, 'cm'], [/\b(millimet(er|re)s?)\b/gi, 'mm'], [/\b(kilomet(er|re)s?)\b/gi, 'km'],
    [/\b(met(er|re)s?)\b/gi, 'm'], [/\b(seconds?|secs?)\b/gi, 's'], [/\b(radians?)\b/gi, 'rad'], [/\b(degrees?|degs?)\b|°/gi, 'deg'], [/\b(liters?|litres?)\b/gi, 'L']];
  function normUnit(u, keepRad){
    u = unsup(String(u || '')).trim();
    WORDS.forEach(function(w){ u = u.replace(w[0], ' ' + w[1] + ' '); });
    u = u.replace(/\s*[·*•⋅]\s*/g, ' ').replace(/\^/g, '').replace(/[()]/g, ' ').replace(/[μµ]/g, 'u').replace(/\s+/g, ' ').trim();
    // "1/s" is s⁻¹: a leading 1 is not a unit.
    u = u.replace(/^1\s*\//, '/');
    var agg = {};
    u.split('/').forEach(function(part, i){
      part.trim().split(' ').filter(Boolean).forEach(function(tok){
        var m = /^([A-Za-zΩ]+)(-?\d+)?$/.exec(tok);
        if(!m){ agg['?' + tok] = 1; return; }
        var sign = (m[2] ? +m[2] : 1) * (i ? -1 : 1);
        var d = DERIVED[m[1]];
        if(d) Object.keys(d).forEach(function(k){ agg[k] = (agg[k] || 0) + d[k] * sign; });
        else agg[m[1]] = (agg[m[1]] || 0) + sign;
      });
    });
    // A radian is a ratio of two lengths: rad/s and 1/s are the same unit.
    if(!keepRad) delete agg.rad;
    return Object.keys(agg).filter(function(k){ return agg[k]; }).sort().map(function(k){ return agg[k] === 1 ? k : k + agg[k]; }).join(' ');
  }
  function unitIs(typed, list){
    var t = normUnit(typed), tr = normUnit(typed, true);
    return list.some(function(u){
      // An angle in radians needs "rad" (a bare number reads as radians, but a typed unit must say so).
      return normUnit(u, true) === 'rad' ? tr === 'rad' : normUnit(u) === t;
    });
  }

  /* The same unit with another metric prefix (cm for m, g for kg, kN for N). */
  var PREFIX = { G: 1e9, M: 1e6, k: 1e3, c: 1e-2, m: 1e-3, u: 1e-6, n: 1e-9, p: 1e-12 };
  function scaleTo(typed, want){
    var t = normUnit(typed), w = normUnit(want);
    if(t === w) return 1;
    var bases = [want, want.replace(/^[GMkcmunpμµ]/, '')];
    for(var i = 0; i < bases.length; i++){
      var fb = normUnit(bases[i]) === w ? 1 : PREFIX[want.charAt(0)] || null;
      if(fb == null) continue;
      if(normUnit(bases[i]) === t) return 1 / fb;
      for(var p in PREFIX) if(normUnit(p + bases[i]) === t) return PREFIX[p] / fb;
    }
    return null;
  }
  // Floating-point slack is relative to the key: Ksp-sized answers (1e-11) must
  // not accept everything within an absolute 1e-9.
  function slack(a){ return 1e-9 * Math.abs(a) + 1e-300; }
  function near(x, a, N){ var tol = N.rel != null ? Math.abs(a) * N.rel : (N.tol || 0); return Math.abs(x - a) <= tol + slack(a); }

  /* Grades a numeric response on its parts. Returns { valid, correct, score,
     value, parts: { value, unit, sig } (true, false, or null when not graded),
     notes: [targeted feedback], mistake: the authored slip it matched }.
     numeric: { answer, tol | rel, unit, units?, askUnit?, sigfigs? | places?,
     decimals?, gAlt?, mistakes?: [{ value, why, tol?|rel?, unit? }] } (see
     docs/apphys-architecture.md). gAlt is the key worked with the other value
     of g (10 m/s² for an item that uses 9.8, or the reverse); a value near it
     is graded right with a note, because the exam accepts either. */
  var G_RATIOS = [10 / 9.8, 9.8 / 10, Math.pow(10 / 9.8, 2), Math.pow(9.8 / 10, 2), Math.sqrt(10 / 9.8), Math.sqrt(9.8 / 10)];
  function rel(x, a, r){ return Math.abs(x - a) <= Math.abs(a) * r + slack(a); }
  function gradeNumeric(q, resp){
    var N = q.numeric || {};
    var typed = resp && typeof resp === 'object' ? resp.value : resp;
    var p = splitNumber(typed);
    if(!p) return { valid: false, correct: false, score: 0 };
    var unitTyped = resp && typeof resp === 'object' && resp.unit != null && String(resp.unit).trim() ? String(resp.unit).trim() : p.unit;
    var accepted = [N.unit].concat(N.units || []).filter(function(u){ return u; });
    // The value is right within the tolerance, or when it is the key rounded
    // to the student's own precision: a rounding choice is a significant-figures
    // matter, reported once, under significant figures.
    var own = N.places != null || (N.sigfigs == null && N.decimals != null) ? +Number(N.answer).toFixed(places(p.digits)) : +Number(N.answer).toPrecision(Math.min(21, Math.max(1, sigFigs(p.digits))));
    var valueOk = near(p.num, N.answer, N) || ((N.sigfigs != null || N.places != null) && Math.abs(p.num - own) <= slack(own));
    var notes = [], parts = { value: valueOk, unit: null, sig: null }, mistake = null, gNote = false;
    if(!valueOk && N.gAlt != null){
      var ownAlt = N.sigfigs != null ? +Number(N.gAlt).toPrecision(Math.min(21, Math.max(1, sigFigs(p.digits)))) : N.gAlt;
      if(near(p.num, N.gAlt, N) || (N.sigfigs != null && Math.abs(p.num - ownAlt) <= slack(ownAlt))){ valueOk = parts.value = true; gNote = true; }
    }
    if(N.askUnit && accepted.length){
      if(!unitTyped){ parts.unit = false; notes.push('Units: a number without its unit is incomplete. This answer is in ' + N.unit + '.'); }
      else if(unitIs(unitTyped, accepted)) parts.unit = true;
      else {
        parts.unit = false;
        var k = scaleTo(unitTyped, N.unit);
        if(k != null && near(p.num * k, N.answer, N)){ notes.push('Units: your number is right in ' + unitTyped + ', but the question asks for ' + N.unit + '. Convert before you report it.'); }
        else if(normUnit(unitTyped, true) === 'deg' && normUnit(N.unit, true) === 'rad') notes.push('Units: this answer is in radians, not degrees. π rad = 180°.');
        else if(normUnit(unitTyped, true) === 'rad' && normUnit(N.unit, true) === 'deg') notes.push('Units: this answer is in degrees, not radians. 180° = π rad.');
        else notes.push('Units: ' + unitTyped + ' is not the unit asked for. The answer is in ' + N.unit + '.');
      }
    }
    if(N.sigfigs != null){
      var sf = sigFigs(p.digits);
      parts.sig = sf === N.sigfigs;
      if(!parts.sig) notes.push('Significant figures: you gave ' + sf + '; the data support ' + N.sigfigs + '.' + (sf < N.sigfigs && /0$/.test(p.digits) && p.digits.indexOf('.') < 0 ? ' Trailing zeros without a decimal point do not count; use scientific notation.' : ''));
    } else if(N.places != null){
      var pl = places(p.digits);
      parts.sig = pl === N.places;
      if(!parts.sig) notes.push('Significant figures: for this answer the digits after the decimal point are the ones that count. Give ' + N.places + ' decimal place' + (N.places === 1 ? '' : 's') + '; you gave ' + pl + '.');
    }
    if(!parts.value){
      (N.mistakes || []).some(function(mk){
        if(near(p.num, mk.value, mk.tol != null || mk.rel != null ? mk : N) && (!mk.unit || !unitTyped || unitIs(unitTyped, [mk.unit]))){ mistake = mk; return true; }
        return false;
      });
      var A = N.answer, x = p.num, R = 0.004;
      var gOff = A && G_RATIOS.some(function(k){ return rel(x, A * k, R); });
      if(mistake) notes.unshift(mistake.why);
      else if(parts.unit === false && notes.length && /right in/.test(notes[0])){ /* the unit note already says it */ }
      else if(gOff) notes.unshift('Value: off by about 2%, the gap between g = 9.8 m/s² and g = 10 m/s². Use the value of g the question gives.');
      else if(A && near(x / 100, A, N)) notes.unshift('Value: your number is 100 times too large. Check centimeters and meters: 1 m = 100 cm.');
      else if(A && near(x * 100, A, N)) notes.unshift('Value: your number is 100 times too small. Check centimeters and meters: 1 m = 100 cm.');
      else if(A && near(x / 1000, A, N)) notes.unshift('Value: your number is 1000 times too large. Check a kilo or milli conversion (g and kg, mm and m, ms and s).');
      else if(A && near(x * 1000, A, N)) notes.unshift('Value: your number is 1000 times too small. Check a kilo or milli conversion (g and kg, mm and m, ms and s).');
      else if(A && near(-x, A, N)) notes.unshift('Value: the size is right but the sign is wrong. Check the direction you called positive.');
      else if(A && (near(x / 2, A, N) || near(x * 2, A, N))) notes.unshift('Value: off by a factor of 2. Check for a ½ (as in K = ½mv² or ½kx²) or a quantity that should be doubled.');
      else if(A && x > 0 && A > 0 && rel(x * x, A, Math.max(R, 2 * ((N.rel != null ? N.rel : (N.tol || 0) / A))))) notes.unshift('Value: your number squared is the answer. Check for a square you left out (v², r², t²).');
      else if(A && x > 0 && A > 0 && rel(Math.sqrt(x), A, Math.max(R, (N.rel != null ? N.rel : (N.tol || 0) / A)))) notes.unshift('Value: the square root of your number is the answer. Check for a square root you left out (as in v = √(2gh)).');
      else if(A && (near(x * Math.PI / 180, A, N) || near(x * 180 / Math.PI, A, N))) notes.unshift('Value: off by the factor between degrees and radians (π/180). Check the unit the angle should be in, and your calculator\'s mode.');
    }
    if(gNote) notes.push('Value: you used the other value of g. The exam accepts g = 9.8 m/s² or 10 m/s², so this counts.');
    var graded = ['value', 'unit', 'sig'].filter(function(k){ return parts[k] !== null; });
    var right = graded.filter(function(k){ return parts[k]; }).length;
    return { valid: true, correct: right === graded.length, score: right / graded.length, value: p.num, parts: parts, notes: notes, mistake: mistake, right: right, total: graded.length };
  }

  /* The key as it should be written: to the item's significant figures (or
     decimal places), in scientific notation when very large or small. */
  function formatKey(N){
    var a = Number(N.answer), out;
    if(N.sigfigs != null){
      var e = a === 0 ? 0 : Math.floor(Math.log10(Math.abs(a)));
      if(e <= -4 || e >= 5){
        var c = a / Math.pow(10, e);
        if(Math.abs(+c.toFixed(N.sigfigs - 1)) >= 10){ e++; c = a / Math.pow(10, e); }
        out = c.toFixed(N.sigfigs - 1) + ' × 10^' + e;
      } else out = a.toPrecision(N.sigfigs);
    } else out = a.toFixed(N.places != null ? N.places : N.decimals != null ? N.decimals : 2);
    return out + (N.unit ? ' ' + N.unit : '');
  }

  function grade(q, resp){
    var t = q.type;
    if(t === 'numeric') return gradeNumeric(q, resp);
    if(t === 'multi'){
      var key = [].concat(q.correct), picks = [].concat(resp || []), n = q.options.length, right = 0;
      for(var i = 0; i < n; i++) if((picks.indexOf(i) > -1) === (key.indexOf(i) > -1)) right++;
      return { valid: picks.length > 0, correct: right === n, score: right / n, right: right, total: n };
    }
    if(t === 'order'){
      var cur = resp || [], k = q.options.length, inPlace = 0;
      for(var j = 0; j < k; j++) if(cur[j] === j) inPlace++;
      return { valid: cur.length === k, correct: inPlace === k, score: inPlace / k, right: inPlace, total: k };
    }
    if(t === 'predict'){
      var vs = q.variables || [], got = 0;
      vs.forEach(function(v, idx){ if(resp && resp[idx] === v.answer) got++; });
      return { valid: true, correct: got === vs.length, score: vs.length ? got / vs.length : 0, right: got, total: vs.length };
    }
    var okc = resp === q.correct;
    return { valid: typeof resp === 'number', correct: okc, score: okc ? 1 : 0 };
  }

  /* Display order for choice options: shuffled unless the item is fixed. */
  function displayOrder(q){
    var idx = (q.options || []).map(function(o, i){ return i; });
    return q.fixed ? idx : shuffle(idx);
  }
  /* Order items: shuffled, and never shown already in order. */
  function orderStart(n){
    var cur = shuffle(Array.apply(null, { length: n }).map(function(_, i){ return i; }));
    if(n > 1 && cur.every(function(v, k){ return v === k; })) cur.reverse();
    return cur;
  }

  /* Runs of consecutive items that share a stimulus, in authored order. */
  function group(items){
    var out = [];
    (items || []).forEach(function(q){
      var last = out[out.length - 1];
      if(q.stimulus && last && last.stimulus === q.stimulus) last.items.push(q);
      else out.push({ stimulus: q.stimulus || null, items: [q] });
    });
    return out;
  }

  var KIND = { table: 'Data table', graph: 'Graph', setup: 'Experimental setup', model: 'Model', diagram: 'Diagram' };
  function base(){ return window.ApPhysBase || ''; }
  /* Stimulus HTML from the bank uses paths from physics/; prefix this page's base. */
  function placePaths(h){ return String(h || '').replace(/(src|href)="figures\//g, '$1="' + base() + 'figures/'); }
  function stimulusPanel(id, s){
    var hid = 'stim-' + id + '-' + (++uid);
    return '<section class="phys-stim" data-stim="' + esc(id) + '" aria-labelledby="' + hid + '"><p class="phys-stim-k">' + (KIND[s.kind] || 'Stimulus') + '</p>' +
      '<h3 id="' + hid + '">' + esc(s.title || '') + '</h3>' + placePaths(s.html) + '</section>';
  }

  function report(q){ return window.LevlReport ? window.LevlReport.button('apphys', q.id) : ''; }
  var DIR = [{ v: 'up', label: 'Increases' }, { v: 'down', label: 'Decreases' }, { v: 'none', label: 'No change' }];

  /* Options are one Tab stop; arrows, Home and End move, Enter or Space answers. */
  function arrowGroup(g){
    var L = [].slice.call(g.querySelectorAll('.phys-opt')), n = L.length;
    function to(j){ L.forEach(function(b, k){ b.tabIndex = k === j ? 0 : -1; }); }
    to(0);
    g.addEventListener('focusin', function(e){ var i = L.indexOf(e.target); if(i > -1) to(i); });
    g.addEventListener('keydown', function(e){
      var i = L.indexOf(document.activeElement), k = e.key;
      var j = i < 0 ? -1 : /Down|Right/.test(k) ? (i + 1) % n : /Up|Left/.test(k) ? (i + n - 1) % n : k === 'Home' ? 0 : k === 'End' ? n - 1 : -1;
      if(j > -1){ e.preventDefault(); L[j].focus(); }
    });
  }
  function markOpt(x, word, cls){ x.insertAdjacentHTML('beforeend', '<span class="phys-mark ' + cls + '">' + word + '</span>'); }

  // Practice, Review and Exams load the shared study styles (docs/course-shell.md).
  function studyPage(){ return !!document.querySelector('.cx-study'); }
  function render(q, host, opts){
    opts = opts || {};
    var reveal = opts.reveal !== false && !opts.exam;
    var done = false, busy = false;
    var getWhy = opts.why || (window.ApPhysCore && window.ApPhysCore.loadWhy ? function(x){ return window.ApPhysCore.loadWhy(base(), x); } : null);
    function explain(cb){
      if(opts.exam || (q.why && q.why.correct) || !getWhy || !q.unit) return cb();
      fb.innerHTML = '<p class="phys-small">Loading the explanation…</p>';
      getWhy(q).then(cb, cb);
    }
    var wrap = document.createElement('div');
    wrap.className = 'phys-q' + (studyPage() ? ' cx-q' : '');
    wrap.setAttribute('data-qid', q.id);
    var stemId = 'q-' + (++uid);
    wrap.innerHTML = '<p class="phys-q-stem cx-q-stem" id="' + stemId + '">' + (opts.n ? '<span class="phys-q-n">' + opts.n + '.</span> ' : '') + html(q.q) + '</p>' +
      '<div class="phys-q-body"></div><div class="phys-q-feedback cx-fb" aria-live="polite"></div><div class="phys-q-actions"></div>';
    var body = wrap.querySelector('.phys-q-body'), fb = wrap.querySelector('.phys-q-feedback'), actions = wrap.querySelector('.phys-q-actions');
    host.appendChild(wrap);

    function finish(g, detailHtml, pick, part){
      done = true;
      wrap.classList.add('is-answered');
      var result = { correct: g.correct, score: g.score, q: q, pick: pick };
      if(opts.record !== false && window.ApPhysCore) window.ApPhysCore.record(q.id, g.correct, { topic: q.topic, unit: q.unit, practice: q.practice, level: q.level, diff: q.diff, src: 'q' });
      if(!opts.exam){
        var verdict = g.correct ? 'Correct.' : g.score > 0 && part ? part : 'Not quite.';
        // On the study pages, the shared feedback box (assets/course/study.css).
        fb.innerHTML = (studyPage()
          ? '<p class="cx-fb-head"><span class="phys-verdict ' + (g.correct ? 'ok' : 'no') + '">' + verdict + '</span></p>' + (q.why && q.why.correct ? '<p class="cx-explain">' + html(q.why.correct) + '</p>' : '')
          : '<p><span class="phys-verdict ' + (g.correct ? 'ok' : 'no') + '">' + verdict + '</span> ' + (q.why && q.why.correct ? html(q.why.correct) : '') + '</p>') + (detailHtml || '') +
          (!g.correct && opts.record !== false ? '<p class="phys-small">Added to your review queue.</p>' : '');
        fb.classList.toggle('is-right', !!g.correct); fb.classList.toggle('is-wrong', !g.correct);
        try{ if(window.LevlSound && window.LevlSound.answer) window.LevlSound.answer(g.correct); }catch(e){}
      }
      actions.innerHTML = report(q);
      if(opts.onAnswer) opts.onAnswer(result);
      try{ wrap.dispatchEvent(new CustomEvent('phys:answered', { bubbles: true, detail: result })); }catch(e){}
    }

    if(q.type === 'predict') predict(); else if(q.type === 'order') order(); else if(q.type === 'multi') multi(); else if(q.type === 'numeric') numeric(); else choice();

    function optWhy(x, i){
      if(reveal && q.why && q.why.options && q.why.options[i]) x.insertAdjacentHTML('beforeend', '<span class="phys-opt-why">' + html(q.why.options[i]) + '</span>');
    }

    /* One right option: a radio group. */
    function choice(){
      body.innerHTML = '<div class="phys-opt-btns cx-opts" role="radiogroup" aria-labelledby="' + stemId + '">' + displayOrder(q).map(function(i){
        return '<button type="button" class="phys-opt cx-opt" role="radio" aria-checked="false" data-i="' + i + '">' + html(q.options[i]) + '</button>';
      }).join('') + '</div>';
      arrowGroup(body.querySelector('.phys-opt-btns'));
      body.querySelectorAll('.phys-opt').forEach(function(b){
        b.addEventListener('click', function(){
          if(done || busy) return;
          busy = true;
          explain(function(){
            var pick = +b.getAttribute('data-i'), g = grade(q, pick);
            body.querySelectorAll('.phys-opt').forEach(function(x){
              var i = +x.getAttribute('data-i');
              x.setAttribute('aria-disabled', 'true');
              if(i === pick) x.setAttribute('aria-checked', 'true');
              if(opts.exam) return;
              if(i === q.correct){ x.classList.add('is-right'); markOpt(x, i === pick ? 'Correct' : 'Correct answer', 'ok'); }
              else if(i === pick){ x.classList.add('is-wrong'); markOpt(x, 'Your answer', 'no'); }
              optWhy(x, i);
            });
            finish(g, '', pick);
          });
        });
      });
    }

    /* Select all that apply: checkboxes; the record is right only when the
       whole set is right, partial credit is said in words. */
    function multi(){
      body.innerHTML = '<p class="phys-small">Select all that apply.</p><div class="phys-opt-btns cx-opts" role="group" aria-labelledby="' + stemId + '">' + displayOrder(q).map(function(i){
        return '<button type="button" class="phys-opt cx-opt" role="checkbox" aria-checked="false" data-i="' + i + '">' + html(q.options[i]) + '</button>';
      }).join('') + '</div>';
      arrowGroup(body.querySelector('.phys-opt-btns'));
      actions.innerHTML = '<button type="button" class="btn-press sm phys-check" disabled>Check</button>';
      var check = actions.querySelector('.phys-check');
      body.querySelectorAll('.phys-opt').forEach(function(b){
        b.addEventListener('click', function(){
          if(done || busy) return;
          b.setAttribute('aria-checked', b.getAttribute('aria-checked') === 'true' ? 'false' : 'true');
          check.disabled = !body.querySelector('.phys-opt[aria-checked="true"]');
        });
      });
      check.addEventListener('click', function(){
        if(busy) return;
        busy = true;
        explain(function(){
          var picks = [];
          body.querySelectorAll('.phys-opt[aria-checked="true"]').forEach(function(x){ picks.push(+x.getAttribute('data-i')); });
          var g = grade(q, picks), key = [].concat(q.correct);
          body.querySelectorAll('.phys-opt').forEach(function(x){
            var i = +x.getAttribute('data-i'), picked = picks.indexOf(i) > -1, should = key.indexOf(i) > -1;
            x.setAttribute('aria-disabled', 'true');
            if(opts.exam) return;
            if(should){ x.classList.add('is-right'); markOpt(x, picked ? 'Correct' : 'Missed', picked ? 'ok' : 'miss'); }
            else if(picked){ x.classList.add('is-wrong'); markOpt(x, 'Your answer', 'no'); }
            optWhy(x, i);
          });
          finish(g, '', picks, g.right + ' of ' + g.total + ' options marked right.');
        });
      });
    }

    /* A typed number: labelled, Enter checks. When the item asks for the
       unit (numeric.askUnit), a second labelled box takes it; otherwise the
       unit sits beside the box. Value, units and significant figures are
       graded separately, and each gets its own line in the feedback. */
    function numeric(){
      var N = q.numeric || {}, id = 'num-' + (++uid);
      var ask = !!N.askUnit;
      var hint = ask ? 'Give the number with the significant figures the data support, then its unit.'
        : N.sigfigs != null || N.places != null ? 'Give the number with the significant figures the data support.'
        : N.decimals != null ? 'Round to ' + N.decimals + ' decimal place' + (N.decimals === 1 ? '' : 's') + '.' : '';
      body.innerHTML = '<div class="phys-num"><label for="' + id + '">Your answer' + (!ask && N.unit ? ' (' + esc(N.unit) + ')' : '') + '</label>' +
        '<span class="phys-num-row"><input type="text" id="' + id + '" autocomplete="off" spellcheck="false" aria-describedby="' + id + '-h">' +
        (!ask && N.unit ? '<span class="phys-num-unit" aria-hidden="true">' + esc(N.unit) + '</span>' : '') +
        (ask ? '<label class="phys-num-ulabel" for="' + id + '-u">Unit</label><input type="text" class="phys-num-u" id="' + id + '-u" autocomplete="off" spellcheck="false">' : '') + '</span>' +
        '<span class="phys-small" id="' + id + '-h">' + hint + ' Write powers of ten as 1.8e-5 or 1.8 × 10^-5.</span></div>';
      actions.innerHTML = '<button type="button" class="btn-press sm phys-check">Check</button>';
      var input = body.querySelector('input'), unitIn = body.querySelector('.phys-num-u'), check = actions.querySelector('.phys-check');
      function go(){
        if(done || busy) return;
        var resp = ask ? { value: input.value, unit: unitIn.value } : input.value;
        var g = grade(q, resp);
        if(!g.valid){ fb.innerHTML = '<p class="phys-small" role="alert">Type a number, for example 2.4 or 1.8e-5.</p>'; input.focus(); return; }
        busy = true;
        explain(function(){
          input.readOnly = true; if(unitIn) unitIn.readOnly = true;
          if(!opts.exam) input.parentNode.insertAdjacentHTML('beforeend', '<span class="phys-mark ' + (g.correct ? 'ok">Correct' : 'no">Your answer') + '</span>');
          var mark = function(v){ return v ? '<span class="phys-mark ok">Right</span>' : '<span class="phys-mark no">Not yet</span>'; };
          var rows = [['Value', g.parts.value]].concat(g.parts.unit !== null ? [['Units', g.parts.unit]] : []).concat(g.parts.sig !== null ? [['Significant figures', g.parts.sig]] : []);
          var detail = opts.exam ? '' : (rows.length > 1 ? '<ul class="phys-num-parts">' + rows.map(function(r){ return '<li>' + mark(r[1]) + ' ' + r[0] + '</li>'; }).join('') + '</ul>' : '') +
            (g.notes.length ? '<ul class="phys-num-notes">' + g.notes.map(function(n){ return '<li>' + esc(n) + '</li>'; }).join('') + '</ul>' : '') +
            '<p><b>Answer:</b> ' + esc(formatKey(N)) + '</p>';
          finish(g, detail, resp, g.right + ' of ' + g.total + ' parts right.');
        });
      }
      check.addEventListener('click', go);
      [input, unitIn].forEach(function(el){ if(el) el.addEventListener('keydown', function(e){ if(e.key === 'Enter'){ e.preventDefault(); go(); } }); });
    }

    /* Order: up and down buttons move a step (keyboard and phone). */
    function order(){
      var n = q.options.length, cur = orderStart(n);
      function paint(result){
        body.innerHTML = '<p class="phys-small">Put the steps in order.</p><ol class="phys-order">' + cur.map(function(i, k){
          var cls = result && !opts.exam ? (i === k ? 'pos-ok' : 'pos-no') : '';
          return '<li class="' + cls + '"><span class="phys-order-text">' + html(q.options[i]) + '</span>' +
            (result ? (opts.exam ? '' : '<span class="phys-mark ' + (i === k ? 'ok">In place' : 'no">Out of place') + '</span>') : '<button type="button" data-k="' + k + '" data-d="-1" aria-label="Move up: ' + esc(String(q.options[i]).replace(/<[^>]+>/g, '')) + '"' + (k === 0 ? ' disabled' : '') + '>↑</button><button type="button" data-k="' + k + '" data-d="1" aria-label="Move down: ' + esc(String(q.options[i]).replace(/<[^>]+>/g, '')) + '"' + (k === n - 1 ? ' disabled' : '') + '>↓</button>') + '</li>';
        }).join('') + '</ol>';
        if(result) return;
        body.querySelectorAll('button[data-k]').forEach(function(b){
          b.addEventListener('click', function(){
            if(busy) return;
            var k = +b.getAttribute('data-k'), dd = +b.getAttribute('data-d'), j = k + dd, t = cur[k];
            cur[k] = cur[j]; cur[j] = t;
            paint(false);
            var again = body.querySelector('button[data-k="' + j + '"][data-d="' + dd + '"]:not([disabled])') || body.querySelector('button[data-k="' + j + '"]:not([disabled])');
            if(again) again.focus();
          });
        });
      }
      paint(false);
      actions.innerHTML = '<button type="button" class="btn-press sm phys-check">Check order</button>';
      actions.querySelector('.phys-check').addEventListener('click', function(){
        if(busy) return;
        busy = true;
        explain(function(){
          var g = grade(q, cur);
          paint(true);
          var detail = opts.exam ? '' : '<p><b>Correct order:</b></p><ol>' + q.options.map(function(o){ return '<li>' + html(o) + '</li>'; }).join('') + '</ol>';
          finish(g, detail, cur.slice(), g.right + ' of ' + g.total + ' in place.');
        });
      });
    }

    /* Predict the change: up, down or no change per variable. */
    function predict(){
      var picks = {};
      body.innerHTML = '<table class="phys-predict"><thead><tr><th scope="col">Variable</th><th scope="col">Your prediction</th></tr></thead><tbody>' +
        q.variables.map(function(v, k){
          return '<tr data-k="' + k + '"><th scope="row">' + html(v.name) + '<div class="phys-var-why"></div></th><td><div class="phys-dir" role="radiogroup" aria-label="' + esc(String(v.name).replace(/<[^>]+>/g, '')) + '">' +
            DIR.map(function(d){ return '<button type="button" role="radio" aria-checked="false" data-v="' + d.v + '">' + d.label + '</button>'; }).join('') + '</div></td></tr>';
        }).join('') + '</tbody></table>';
      body.querySelectorAll('.phys-dir').forEach(function(g, k){
        g.querySelectorAll('button').forEach(function(b){
          b.addEventListener('click', function(){
            if(done || busy) return;
            g.querySelectorAll('button').forEach(function(x){ x.setAttribute('aria-checked', 'false'); });
            b.setAttribute('aria-checked', 'true'); picks[k] = b.getAttribute('data-v');
          });
        });
      });
      actions.innerHTML = '<button type="button" class="btn-press sm phys-check">Check predictions</button>';
      actions.querySelector('.phys-check').addEventListener('click', function(){
        if(busy) return;
        busy = true;
        explain(function(){
          var g = grade(q, picks);
          q.variables.forEach(function(v, k){
            var ok = picks[k] === v.answer, row = body.querySelector('tr[data-k="' + k + '"]');
            row.querySelectorAll('button').forEach(function(b){ b.setAttribute('aria-disabled', 'true'); });
            if(opts.exam) return;
            row.classList.add(ok ? 'var-ok' : 'var-no');
            var word = v.answer === 'up' ? 'increases' : v.answer === 'down' ? 'decreases' : 'no change';
            row.querySelector('.phys-var-why').innerHTML = '<span class="phys-mark ' + (ok ? 'ok">Right' : 'no">Wrong') + '</span> <b>' + word + '.</b> ' + html(v.why || '');
          });
          finish(g, '', Object.assign({}, picks), g.right + ' of ' + g.total + ' right.');
        });
      });
    }

    return { el: wrap, done: function(){ return done; } };
  }

  /* A list of items: each run sharing a stimulus goes under one panel, in a
     group named by the panel's title. stimuli: { id: { kind, title, html } },
     or each item carries its own as q.stim (the bank). */
  function hydrate(container, items, opts, stimuli){
    if(!container) return [];
    container.innerHTML = '';
    var n = 0, out = [];
    group(items).forEach(function(g){
      var s = g.stimulus && ((stimuli && stimuli[g.stimulus]) || g.items[0].stim);
      var host = container;
      if(s){
        host = document.createElement('div');
        host.className = 'phys-set';
        host.innerHTML = stimulusPanel(g.stimulus, s);
        container.appendChild(host);
      }
      g.items.forEach(function(q){ n++; out.push(render(q, host, Object.assign({ n: n }, opts || {}))); });
    });
    return out;
  }

  window.ApPhysQuestions = { render: render, hydrate: hydrate, grade: grade, parseNumber: parseNumber, splitNumber: splitNumber, sigFigs: sigFigs, normUnit: normUnit, formatKey: formatKey, group: group, shuffle: shuffle, displayOrder: displayOrder, orderStart: orderStart, stimulusPanel: stimulusPanel };
})();
