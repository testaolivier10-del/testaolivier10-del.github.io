/* AP® Chemistry question engine: renders and grades every item type wherever a
   question appears (lesson checks, practice, review, exams). Forked from the
   AP® Biology engine (docs/apchem-spec.md decision 1); formats in
   docs/apchem-architecture.md. New here: numeric items are graded on three
   things separately (value, units, significant figures) with targeted
   feedback for the slips the exam's readers keep seeing (kJ vs J, °C vs K,
   ln vs log).

     ApChemQuestions.render(q, host, opts) -> { el, done() }
       opts.n         the number shown before the stem
       opts.record    false to skip ApChemCore.record (prerequisite checks)
       opts.onAnswer(result)  result = { correct, score (0..1), q, pick }
       opts.reveal    show every option's explanation after answering (default true)
       opts.exam      grade silently, no feedback
     ApChemQuestions.hydrate(container, items, opts) renders a list, placing one
       stimulus panel above each run of items that share a stimulus (a set),
       in authored order.
     ApChemQuestions.grade(q, response) is the pure grader the renderer uses
       (and the tests call): single -> option index; multi -> array of indices;
       numeric -> the typed string, or { value, unit } when the item asks for
       the unit in its own box; order -> authored indices in the order the
       student placed them; predict -> { variableIndex: 'up'|'down'|'none' }.

   Options are shuffled for display, so an explanation never names a letter
   or position (check-apchem-content enforces it). An item marked "fixed" (a
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

  /* Units are compared after normalizing how they can be typed:
     "kJ/mol" = "kJ mol^-1" = "kJ·mol⁻¹" = "kJ mol-1"; "L·atm/(mol·K)" =
     "L atm mol-1 K-1"; "degC" = "°C"; "liters" = "L". Case matters otherwise
     (mM is not MM). An unreadable token is kept as itself, so it only ever
     matches the same token. */
  function normUnit(u){
    u = unsup(String(u || '')).trim();
    u = u.replace(/\s*[·*•⋅]\s*/g, ' ').replace(/\^/g, '').replace(/[()]/g, ' ').replace(/\s+/g, ' ').trim();
    u = u.replace(/\bdeg\s*C\b|º\s*C|°\s*C/g, '°C').replace(/\b(liters?|litres?)\b/gi, 'L').replace(/(^|[^A-Za-z])l(?![A-Za-z])/g, '$1L');
    u = u.replace(/[μµ]/g, 'u').replace(/\bmoles?\b/g, 'mol').replace(/\bgrams?\b/g, 'g').replace(/\b(seconds?|sec)\b/g, 's');
    var agg = {};
    u.split('/').forEach(function(part, i){
      part.trim().split(' ').filter(Boolean).forEach(function(tok){
        var m = /^([A-Za-z°Ω]+)(-?\d+)?$/.exec(tok);
        if(!m){ agg['?' + tok] = 1; return; }
        var sign = (m[2] ? +m[2] : 1) * (i ? -1 : 1);
        // Standalone M is molarity, mol/L.
        if(m[1] === 'M'){ agg.mol = (agg.mol || 0) + sign; agg.L = (agg.L || 0) - sign; return; }
        agg[m[1]] = (agg[m[1]] || 0) + sign;
      });
    });
    return Object.keys(agg).filter(function(k){ return agg[k]; }).sort().map(function(k){ return agg[k] === 1 ? k : k + agg[k]; }).join(' ');
  }
  function unitIs(typed, list){ var t = normUnit(typed); return list.some(function(u){ return normUnit(u) === t; }); }

  /* The same unit with another metric prefix (J for kJ, mL for L). */
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
  function near(x, a, N){ var tol = N.rel != null ? Math.abs(a) * N.rel : (N.tol || 0); return Math.abs(x - a) <= tol + 1e-9 * Math.max(1, Math.abs(a)); }

  /* Grades a numeric response on its parts. Returns { valid, correct, score,
     value, parts: { value, unit, sig } (true, false, or null when not graded),
     notes: [targeted feedback], mistake: the authored slip it matched }.
     numeric: { answer, tol | rel, unit, units?, askUnit?, sigfigs? | places?,
     decimals?, mistakes?: [{ value, why, tol?|rel?, unit? }] } (see
     docs/apchem-architecture.md). */
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
    var valueOk = near(p.num, N.answer, N) || ((N.sigfigs != null || N.places != null) && Math.abs(p.num - own) <= 1e-9 * Math.max(1, Math.abs(own)));
    var notes = [], parts = { value: valueOk, unit: null, sig: null }, mistake = null;
    if(N.askUnit && accepted.length){
      if(!unitTyped){ parts.unit = false; notes.push('Units: a number without its unit is incomplete. This answer is in ' + N.unit + '.'); }
      else if(unitIs(unitTyped, accepted)) parts.unit = true;
      else {
        parts.unit = false;
        var k = scaleTo(unitTyped, N.unit);
        if(k != null && near(p.num * k, N.answer, N)){ notes.push('Units: your number is right in ' + unitTyped + ', but the question asks for ' + N.unit + '. Convert before you report it.'); }
        else if(normUnit(unitTyped) === '°C' && normUnit(N.unit) === 'K') notes.push('Units: gas laws and thermodynamics need kelvin: K = °C + 273.15.');
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
      if(!parts.sig) notes.push('Significant figures: for a logarithm such as pH, the digits after the decimal point are the significant ones. Give ' + N.places + ' decimal place' + (N.places === 1 ? '' : 's') + '; you gave ' + pl + '.');
    }
    if(!parts.value){
      (N.mistakes || []).some(function(mk){
        if(near(p.num, mk.value, mk.tol != null || mk.rel != null ? mk : N) && (!mk.unit || !unitTyped || unitIs(unitTyped, [mk.unit]))){ mistake = mk; return true; }
        return false;
      });
      var A = N.answer;
      if(mistake) notes.unshift(mistake.why);
      else if(parts.unit === false && notes.length && /right in/.test(notes[0])){ /* the unit note already says it */ }
      else if(A && near(p.num / 1000, A, N)) notes.unshift('Value: your number is 1000 times too large. Check a kilo or milli conversion (J and kJ, mL and L).');
      else if(A && near(p.num * 1000, A, N)) notes.unshift('Value: your number is 1000 times too small. Check a kilo or milli conversion (J and kJ, mL and L).');
      else if(A && (near(p.num - 273.15, A, N) || near(p.num + 273.15, A, N))) notes.unshift('Value: off by 273. Check whether the temperature should be in kelvin or degrees Celsius.');
      else if(A && (near(p.num / 2.303, A, N) || near(p.num * 2.303, A, N))) notes.unshift('Value: off by a factor of 2.303, the gap between ln and log. Check which logarithm the equation uses.');
      else if(A && near(-p.num, A, N)) notes.unshift('Value: the size is right but the sign is wrong. Check the direction of the change.');
    }
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

  var KIND = { table: 'Data table', graph: 'Graph', setup: 'Experimental setup', model: 'Model', particle: 'Particle view' };
  function base(){ return window.ApChemBase || ''; }
  /* Stimulus HTML from the bank uses paths from chem/; prefix this page's base. */
  function placePaths(h){ return String(h || '').replace(/(src|href)="figures\//g, '$1="' + base() + 'figures/'); }
  function stimulusPanel(id, s){
    var hid = 'stim-' + id + '-' + (++uid);
    return '<section class="chem-stim" data-stim="' + esc(id) + '" aria-labelledby="' + hid + '"><p class="chem-stim-k">' + (KIND[s.kind] || 'Stimulus') + '</p>' +
      '<h3 id="' + hid + '">' + esc(s.title || '') + '</h3>' + placePaths(s.html) + '</section>';
  }

  function report(q){ return window.LevlReport ? window.LevlReport.button('apchem', q.id) : ''; }
  var DIR = [{ v: 'up', label: 'Increases' }, { v: 'down', label: 'Decreases' }, { v: 'none', label: 'No change' }];

  /* Options are one Tab stop; arrows, Home and End move, Enter or Space answers. */
  function arrowGroup(g){
    var L = [].slice.call(g.querySelectorAll('.chem-opt')), n = L.length;
    function to(j){ L.forEach(function(b, k){ b.tabIndex = k === j ? 0 : -1; }); }
    to(0);
    g.addEventListener('focusin', function(e){ var i = L.indexOf(e.target); if(i > -1) to(i); });
    g.addEventListener('keydown', function(e){
      var i = L.indexOf(document.activeElement), k = e.key;
      var j = i < 0 ? -1 : /Down|Right/.test(k) ? (i + 1) % n : /Up|Left/.test(k) ? (i + n - 1) % n : k === 'Home' ? 0 : k === 'End' ? n - 1 : -1;
      if(j > -1){ e.preventDefault(); L[j].focus(); }
    });
  }
  function markOpt(x, word, cls){ x.insertAdjacentHTML('beforeend', '<span class="chem-mark ' + cls + '">' + word + '</span>'); }

  // Practice, Review and Exams load the shared study styles (docs/course-shell.md).
  function studyPage(){ return !!document.querySelector('.cx-study'); }
  function render(q, host, opts){
    opts = opts || {};
    var reveal = opts.reveal !== false && !opts.exam;
    var done = false, busy = false;
    var getWhy = opts.why || (window.ApChemCore && window.ApChemCore.loadWhy ? function(x){ return window.ApChemCore.loadWhy(base(), x); } : null);
    function explain(cb){
      if(opts.exam || (q.why && q.why.correct) || !getWhy || !q.unit) return cb();
      fb.innerHTML = '<p class="chem-small">Loading the explanation…</p>';
      getWhy(q).then(cb, cb);
    }
    var wrap = document.createElement('div');
    wrap.className = 'chem-q' + (studyPage() ? ' cx-q' : '');
    wrap.setAttribute('data-qid', q.id);
    var stemId = 'q-' + (++uid);
    wrap.innerHTML = '<p class="chem-q-stem cx-q-stem" id="' + stemId + '">' + (opts.n ? '<span class="chem-q-n">' + opts.n + '.</span> ' : '') + html(q.q) + '</p>' +
      '<div class="chem-q-body"></div><div class="chem-q-feedback cx-fb" aria-live="polite"></div><div class="chem-q-actions"></div>';
    var body = wrap.querySelector('.chem-q-body'), fb = wrap.querySelector('.chem-q-feedback'), actions = wrap.querySelector('.chem-q-actions');
    host.appendChild(wrap);

    function finish(g, detailHtml, pick, part){
      done = true;
      wrap.classList.add('is-answered');
      var result = { correct: g.correct, score: g.score, q: q, pick: pick };
      if(opts.record !== false && window.ApChemCore) window.ApChemCore.record(q.id, g.correct, { topic: q.topic, unit: q.unit, practice: q.practice, level: q.level, diff: q.diff, src: 'q' });
      if(!opts.exam){
        var verdict = g.correct ? 'Correct.' : g.score > 0 && part ? part : 'Not quite.';
        // On the study pages, the shared feedback box (assets/course/study.css).
        fb.innerHTML = (studyPage()
          ? '<p class="cx-fb-head"><span class="chem-verdict ' + (g.correct ? 'ok' : 'no') + '">' + verdict + '</span></p>' + (q.why && q.why.correct ? '<p class="cx-explain">' + html(q.why.correct) + '</p>' : '')
          : '<p><span class="chem-verdict ' + (g.correct ? 'ok' : 'no') + '">' + verdict + '</span> ' + (q.why && q.why.correct ? html(q.why.correct) : '') + '</p>') + (detailHtml || '') +
          (!g.correct && opts.record !== false ? '<p class="chem-small">Added to your review queue.</p>' : '');
        fb.classList.toggle('is-right', !!g.correct); fb.classList.toggle('is-wrong', !g.correct);
        try{ if(window.LevlSound && window.LevlSound.answer) window.LevlSound.answer(g.correct); }catch(e){}
      }
      actions.innerHTML = report(q);
      if(opts.onAnswer) opts.onAnswer(result);
      try{ wrap.dispatchEvent(new CustomEvent('chem:answered', { bubbles: true, detail: result })); }catch(e){}
    }

    if(q.type === 'predict') predict(); else if(q.type === 'order') order(); else if(q.type === 'multi') multi(); else if(q.type === 'numeric') numeric(); else choice();

    function optWhy(x, i){
      if(reveal && q.why && q.why.options && q.why.options[i]) x.insertAdjacentHTML('beforeend', '<span class="chem-opt-why">' + html(q.why.options[i]) + '</span>');
    }

    /* One right option: a radio group. */
    function choice(){
      body.innerHTML = '<div class="chem-opt-btns cx-opts" role="radiogroup" aria-labelledby="' + stemId + '">' + displayOrder(q).map(function(i){
        return '<button type="button" class="chem-opt cx-opt" role="radio" aria-checked="false" data-i="' + i + '">' + html(q.options[i]) + '</button>';
      }).join('') + '</div>';
      arrowGroup(body.querySelector('.chem-opt-btns'));
      body.querySelectorAll('.chem-opt').forEach(function(b){
        b.addEventListener('click', function(){
          if(done || busy) return;
          busy = true;
          explain(function(){
            var pick = +b.getAttribute('data-i'), g = grade(q, pick);
            body.querySelectorAll('.chem-opt').forEach(function(x){
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
      body.innerHTML = '<p class="chem-small">Select all that apply.</p><div class="chem-opt-btns cx-opts" role="group" aria-labelledby="' + stemId + '">' + displayOrder(q).map(function(i){
        return '<button type="button" class="chem-opt cx-opt" role="checkbox" aria-checked="false" data-i="' + i + '">' + html(q.options[i]) + '</button>';
      }).join('') + '</div>';
      arrowGroup(body.querySelector('.chem-opt-btns'));
      actions.innerHTML = '<button type="button" class="btn-press sm chem-check" disabled>Check</button>';
      var check = actions.querySelector('.chem-check');
      body.querySelectorAll('.chem-opt').forEach(function(b){
        b.addEventListener('click', function(){
          if(done || busy) return;
          b.setAttribute('aria-checked', b.getAttribute('aria-checked') === 'true' ? 'false' : 'true');
          check.disabled = !body.querySelector('.chem-opt[aria-checked="true"]');
        });
      });
      check.addEventListener('click', function(){
        if(busy) return;
        busy = true;
        explain(function(){
          var picks = [];
          body.querySelectorAll('.chem-opt[aria-checked="true"]').forEach(function(x){ picks.push(+x.getAttribute('data-i')); });
          var g = grade(q, picks), key = [].concat(q.correct);
          body.querySelectorAll('.chem-opt').forEach(function(x){
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
      body.innerHTML = '<div class="chem-num"><label for="' + id + '">Your answer' + (!ask && N.unit ? ' (' + esc(N.unit) + ')' : '') + '</label>' +
        '<span class="chem-num-row"><input type="text" id="' + id + '" autocomplete="off" spellcheck="false" aria-describedby="' + id + '-h">' +
        (!ask && N.unit ? '<span class="chem-num-unit" aria-hidden="true">' + esc(N.unit) + '</span>' : '') +
        (ask ? '<label class="chem-num-ulabel" for="' + id + '-u">Unit</label><input type="text" class="chem-num-u" id="' + id + '-u" autocomplete="off" spellcheck="false">' : '') + '</span>' +
        '<span class="chem-small" id="' + id + '-h">' + hint + ' Write powers of ten as 1.8e-5 or 1.8 × 10^-5.</span></div>';
      actions.innerHTML = '<button type="button" class="btn-press sm chem-check">Check</button>';
      var input = body.querySelector('input'), unitIn = body.querySelector('.chem-num-u'), check = actions.querySelector('.chem-check');
      function go(){
        if(done || busy) return;
        var resp = ask ? { value: input.value, unit: unitIn.value } : input.value;
        var g = grade(q, resp);
        if(!g.valid){ fb.innerHTML = '<p class="chem-small" role="alert">Type a number, for example 2.4 or 1.8e-5.</p>'; input.focus(); return; }
        busy = true;
        explain(function(){
          input.readOnly = true; if(unitIn) unitIn.readOnly = true;
          if(!opts.exam) input.parentNode.insertAdjacentHTML('beforeend', '<span class="chem-mark ' + (g.correct ? 'ok">Correct' : 'no">Your answer') + '</span>');
          var mark = function(v){ return v ? '<span class="chem-mark ok">Right</span>' : '<span class="chem-mark no">Not yet</span>'; };
          var rows = [['Value', g.parts.value]].concat(g.parts.unit !== null ? [['Units', g.parts.unit]] : []).concat(g.parts.sig !== null ? [['Significant figures', g.parts.sig]] : []);
          var detail = opts.exam ? '' : (rows.length > 1 ? '<ul class="chem-num-parts">' + rows.map(function(r){ return '<li>' + mark(r[1]) + ' ' + r[0] + '</li>'; }).join('') + '</ul>' : '') +
            (g.notes.length ? '<ul class="chem-num-notes">' + g.notes.map(function(n){ return '<li>' + esc(n) + '</li>'; }).join('') + '</ul>' : '') +
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
        body.innerHTML = '<p class="chem-small">Put the steps in order.</p><ol class="chem-order">' + cur.map(function(i, k){
          var cls = result && !opts.exam ? (i === k ? 'pos-ok' : 'pos-no') : '';
          return '<li class="' + cls + '"><span class="chem-order-text">' + html(q.options[i]) + '</span>' +
            (result ? (opts.exam ? '' : '<span class="chem-mark ' + (i === k ? 'ok">In place' : 'no">Out of place') + '</span>') : '<button type="button" data-k="' + k + '" data-d="-1" aria-label="Move up: ' + esc(String(q.options[i]).replace(/<[^>]+>/g, '')) + '"' + (k === 0 ? ' disabled' : '') + '>↑</button><button type="button" data-k="' + k + '" data-d="1" aria-label="Move down: ' + esc(String(q.options[i]).replace(/<[^>]+>/g, '')) + '"' + (k === n - 1 ? ' disabled' : '') + '>↓</button>') + '</li>';
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
      actions.innerHTML = '<button type="button" class="btn-press sm chem-check">Check order</button>';
      actions.querySelector('.chem-check').addEventListener('click', function(){
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
      body.innerHTML = '<table class="chem-predict"><thead><tr><th scope="col">Variable</th><th scope="col">Your prediction</th></tr></thead><tbody>' +
        q.variables.map(function(v, k){
          return '<tr data-k="' + k + '"><th scope="row">' + html(v.name) + '<div class="chem-var-why"></div></th><td><div class="chem-dir" role="radiogroup" aria-label="' + esc(String(v.name).replace(/<[^>]+>/g, '')) + '">' +
            DIR.map(function(d){ return '<button type="button" role="radio" aria-checked="false" data-v="' + d.v + '">' + d.label + '</button>'; }).join('') + '</div></td></tr>';
        }).join('') + '</tbody></table>';
      body.querySelectorAll('.chem-dir').forEach(function(g, k){
        g.querySelectorAll('button').forEach(function(b){
          b.addEventListener('click', function(){
            if(done || busy) return;
            g.querySelectorAll('button').forEach(function(x){ x.setAttribute('aria-checked', 'false'); });
            b.setAttribute('aria-checked', 'true'); picks[k] = b.getAttribute('data-v');
          });
        });
      });
      actions.innerHTML = '<button type="button" class="btn-press sm chem-check">Check predictions</button>';
      actions.querySelector('.chem-check').addEventListener('click', function(){
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
            row.querySelector('.chem-var-why').innerHTML = '<span class="chem-mark ' + (ok ? 'ok">Right' : 'no">Wrong') + '</span> <b>' + word + '.</b> ' + html(v.why || '');
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
        host.className = 'chem-set';
        host.innerHTML = stimulusPanel(g.stimulus, s);
        container.appendChild(host);
      }
      g.items.forEach(function(q){ n++; out.push(render(q, host, Object.assign({ n: n }, opts || {}))); });
    });
    return out;
  }

  window.ApChemQuestions = { render: render, hydrate: hydrate, grade: grade, parseNumber: parseNumber, splitNumber: splitNumber, sigFigs: sigFigs, normUnit: normUnit, formatKey: formatKey, group: group, shuffle: shuffle, displayOrder: displayOrder, orderStart: orderStart, stimulusPanel: stimulusPanel };
})();
