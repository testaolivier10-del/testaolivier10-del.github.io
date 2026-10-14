/* AP® Calculus AB question engine: renders and grades every item type wherever a
   question appears (lesson checks, practice, review, exams). Forked from the
   AP® Physics 1 engine (docs/apcalc-spec.md decision 1); formats in
   docs/apcalc-architecture.md. Calculus changes: `expr` items (a typed
   expression graded by evaluation through ApCalcExpr, calc-expr.js, with a
   live preview rendered by ApCalcTex, calc-math.js); numeric items follow
   the exam's calculator rules (q.calc: correct to three decimal places,
   rounded or truncated; no calculator: the exact value, typed as a number
   or an expression such as pi/4); units are optional and loose (askUnit).
   A calculator item carries a "Calculator" tag outside exams.

     ApCalcQuestions.render(q, host, opts) -> { el, done() }
       opts.n         the number shown before the stem
       opts.record    false to skip ApCalcCore.record (prerequisite checks)
       opts.onAnswer(result)  result = { correct, score (0..1), q, pick }
       opts.reveal    show every option's explanation after answering (default true)
       opts.exam      grade silently, no feedback
     ApCalcQuestions.hydrate(container, items, opts) renders a list, placing one
       stimulus panel above each run of items that share a stimulus (a set),
       in authored order.
     ApCalcQuestions.grade(q, response) is the pure grader the renderer uses
       (and the tests call): single -> option index; multi -> array of indices;
       numeric -> the typed string, or { value, unit } when the item asks for
       the unit in its own box; expr -> the typed expression; order -> authored indices in the order the
       student placed them; predict -> { variableIndex: 'up'|'down'|'none' }.

   Options are shuffled for display, so an explanation never names a letter
   or position (check-apcalc-content enforces it). An item marked "fixed" (a
   find-the-error list, options that are a scale) is never shuffled. Order
   items are shuffled for display and graded against the authored order. */
(function(){
  function esc(s){ return String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
  function html(s){ return String(s == null ? '' : s); }   // our own authored markup (<i>, <sub>)
  function shuffle(a){ a = a.slice(); for(var i = a.length - 1; i > 0; i--){ var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  var uid = 0;

  function X(){ return window.ApCalcExpr; }
  function T(){ return window.ApCalcTex; }

  /* A typed number: a decimal ("2.718", "-0.5", ".25", "1,234.5", "1.2e-3")
     or, failing that, an exact expression read by ApCalcExpr ("3/4", "pi/2",
     "sqrt(2)/2", "e^2 - 1", "ln 3"). -> { value, decimal, places } or null. */
  var DEC_RE = /^[+-]?(?:\d{1,3}(?:,\d{3})+|\d+)?(?:\.(\d+))?(?:[eE][+-]?\d+)?$/;
  function readNumber(s){
    s = String(s == null ? '' : s).trim().replace(/[−–]/g, '-').replace(/\s+/g, ' ');
    if(!s) return null;
    var m = DEC_RE.exec(s.replace(/\s/g, ''));
    if(m && /\d/.test(s)){
      var v = parseFloat(s.replace(/[,\s]/g, ''));
      if(isFinite(v)) return { value: v, decimal: true, places: m[1] ? m[1].length : 0 };
    }
    var e = X() ? X().number(s) : NaN;
    return isFinite(e) ? { value: e, decimal: false, places: Infinity } : null;
  }
  function parseNumber(s){ var r = readNumber(s); return r ? r.value : NaN; }
  /* The number and a unit typed after it ("12.5 ft/min"). */
  function splitNumber(s){
    s = String(s == null ? '' : s).trim();
    var r = readNumber(s);
    if(r) return { num: r.value, read: r, unit: '' };
    var m = /^(.*?[0-9)])\s*([A-Za-z°][A-Za-z°\/^ 0-9²³]*)$/.exec(s);
    if(m){ r = readNumber(m[1]); if(r) return { num: r.value, read: r, unit: m[2].trim() }; }
    return null;
  }

  /* Units are optional in calculus answers and compared loosely: words and
     symbols ("feet per minute" = "ft/min"), plurals, "square"/"cubic"
     and ² ³ ("cubic centimeters per second" = "cm^3/s"), masses, volumes,
     counts (people, tickets, bacteria), degrees and "cubic units". */
  var UNIT_WORDS = { feet: 'ft', foot: 'ft', ft: 'ft', inch: 'in', inches: 'in', in: 'in', mile: 'mi', miles: 'mi', mi: 'mi', yard: 'yd', yards: 'yd',
    meter: 'm', meters: 'm', metre: 'm', metres: 'm', m: 'm', centimeter: 'cm', centimeters: 'cm', cm: 'cm', kilometer: 'km', kilometers: 'km', km: 'km',
    millimeter: 'mm', millimeters: 'mm', mm: 'mm', second: 's', seconds: 's', sec: 's', secs: 's', s: 's', minute: 'min', minutes: 'min', min: 'min', mins: 'min',
    hour: 'hr', hours: 'hr', hr: 'hr', hrs: 'hr', h: 'hr', day: 'day', days: 'day', week: 'wk', weeks: 'wk', year: 'yr', years: 'yr', yr: 'yr',
    gallon: 'gal', gallons: 'gal', gal: 'gal', liter: 'L', liters: 'L', litre: 'L', litres: 'L', l: 'L', milliliter: 'mL', milliliters: 'mL', ml: 'mL',
    degree: 'deg', degrees: 'deg', deg: 'deg', '°': 'deg', '°f': 'degF', '°c': 'degC', radian: 'rad', radians: 'rad', rad: 'rad',
    person: 'person', people: 'person', persons: 'person', dollar: 'dollar', dollars: 'dollar', pound: 'lb', pounds: 'lb', lb: 'lb', lbs: 'lb',
    kilogram: 'kg', kilograms: 'kg', kilo: 'kg', kilos: 'kg', kg: 'kg', kgs: 'kg', gram: 'g', grams: 'g', g: 'g', gm: 'g', gms: 'g',
    milligram: 'mg', milligrams: 'mg', mg: 'mg', mgs: 'mg', ounce: 'oz', ounces: 'oz', oz: 'oz', ton: 'ton', tons: 'ton',
    ticket: 'ticket', tickets: 'ticket', bacterium: 'bacteria', bacteria: 'bacteria', cell: 'cell', cells: 'cell', car: 'car', cars: 'car',
    unit: 'unit', units: 'unit', fahrenheit: 'degF', celsius: 'degC' };
  function normUnit(u){
    u = String(u || '').toLowerCase().replace(/²/g, '^2').replace(/³/g, '^3').replace(/\bmph\b/g, 'mi/hr')
      // "degrees Fahrenheit", "deg F", "° F" are one unit (°f); "per", "each" and "every" divide.
      .replace(/(?:\bdegrees?\b|\bdeg\b|°)\s*(fahrenheit|f|celsius|c)\b/g, function(m, x){ return x.charAt(0) === 'f' ? ' °f ' : ' °c '; })
      .replace(/\b(?:per|each|every)\b/g, '/').replace(/[·*]/g, ' ').trim();
    var sides = u.split('/'), agg = {};
    sides.forEach(function(side, i){
      var toks = side.trim().split(/\s+/).filter(Boolean), pw = 1;
      toks.forEach(function(tok){
        if(tok === '1' || tok === 'of') return;   // "1/hr", "cubic feet of water" is not a unit word
        if(tok === 'square' || tok === 'sq'){ pw = 2; return; }
        if(tok === 'cubic' || tok === 'cu'){ pw = 3; return; }
        if(tok === 'squared'){ var k2 = Object.keys(agg).pop(); if(k2){ agg[k2] += (i ? -1 : 1); } return; }
        if(tok === 'cubed'){ var k3 = Object.keys(agg).pop(); if(k3){ agg[k3] += 2 * (i ? -1 : 1); } return; }
        var m = /^([a-z°]+)\^?(\d)?$/.exec(tok);
        var name = m ? (UNIT_WORDS[m[1]] || m[1].replace(/s$/, '')) : tok;
        var e = (m && m[2] ? +m[2] : 1) * pw * (i ? -1 : 1);
        agg[name] = (agg[name] || 0) + e; pw = 1;
      });
    });
    return Object.keys(agg).filter(function(k){ return agg[k]; }).sort().map(function(k){ return agg[k] === 1 ? k : k + agg[k]; }).join(' ');
  }
  function unitIs(typed, list){ var t = normUnit(typed); return list.some(function(u){ return normUnit(u) === t; }); }

  /* The three-decimal rule (AP® Calculus AB scoring): a decimal answer must
     be correct to three places after the decimal point, rounded or
     truncated. r3/t3 work on the decimal string's value, so 2.9995 rounds up. */
  function r3(x){ return Math.sign(x) * Math.round(Math.abs(x) * 1000 + 1e-7) / 1000; }
  function t3(x){ return Math.sign(x) * Math.floor(Math.abs(x) * 1000 + 1e-7) / 1000; }
  function same(a, b){ return Math.abs(a - b) <= 1e-9 * Math.max(1, Math.abs(a), Math.abs(b)); }
  function threeOk(v, A){
    var ok = [r3(A), t3(A)];
    return [r3(v), t3(v)].some(function(x){ return ok.some(function(y){ return same(x, y); }); });
  }
  function keyValue(N){
    if(N.value != null) return +N.value;
    if(typeof N.answer === 'string') return X() ? X().number(N.answer) : NaN;
    return +N.answer;
  }
  function near(x, a){ return Math.abs(x - a) <= Math.max(0.0005, 1e-6 * Math.abs(a)); }

  /* Grades a numeric response. A calculator item (q.calc) wants a decimal
     correct to three places (or the exact value); a no-calculator item wants
     the exact value, typed as a number or an expression (3/4, pi/2,
     sqrt(2)/2), and also accepts a decimal correct to three places. Units are
     graded only when the item asks for them (numeric.askUnit). Returns
     { valid, correct, score, value, parts: { value, unit }, notes, mistake }.
     numeric: { answer (number or exact expression), unit?, units?, askUnit?,
     mistakes?: [{ value (number or expression), why }] }. */
  function gradeNumeric(q, resp){
    var N = q.numeric || {}, calc = !!q.calc;
    var typed = resp && typeof resp === 'object' ? resp.value : resp;
    var p = splitNumber(typed);
    if(!p) return { valid: false, correct: false, score: 0 };
    var r = p.read, v = p.num, A = keyValue(N);
    var unitTyped = resp && typeof resp === 'object' && resp.unit != null && String(resp.unit).trim() ? String(resp.unit).trim() : p.unit;
    var accepted = [N.unit].concat(N.units || []).filter(function(u){ return u; });
    var notes = [], mistake = null;
    var exact = same(v, A), dec3 = r.decimal && r.places >= 3 && threeOk(v, A);
    var valueOk = exact || dec3;
    var parts = { value: valueOk, unit: null };
    if(valueOk && !exact && !calc) notes.push('Right to three decimal places. On a no-calculator question, give the exact value.');
    if(N.askUnit && accepted.length){
      if(!unitTyped){ parts.unit = false; notes.push('Units: an answer in context needs its unit. This one is in ' + N.unit + '.'); }
      else if(unitIs(unitTyped, accepted)) parts.unit = true;
      else { parts.unit = false; notes.push('Units: ' + unitTyped + ' is not the unit of this quantity. It is in ' + N.unit + '.'); }
    }
    if(!valueOk){
      (N.mistakes || []).some(function(mk){
        var mv = typeof mk.value === 'string' ? (X() ? X().number(mk.value) : NaN) : +mk.value;
        if(isFinite(mv) && (same(v, mv) || (r.decimal && r.places >= 3 && threeOk(v, mv)))){ mistake = mk; return true; }
        return false;
      });
      if(mistake) notes.unshift(mistake.why);
      else if(r.decimal && r.places < 3 && Math.abs(v - A) < Math.pow(10, -r.places)) notes.unshift('Three decimal places: you gave ' + r.places + '. The exam marks a decimal answer right only when it is correct to three places after the decimal point (rounded or truncated).');
      else if(r.decimal && Math.abs(v - A) < 0.01) notes.unshift('Close, but not correct to three decimal places. Round only at the end: keep full precision (store values in the calculator) through the work.');
      else if(A && near(-v, A)) notes.unshift('The size is right but the sign is wrong. Check a subtraction order or a direction.');
      else if(A && (near(v * Math.PI, A) || near(v / Math.PI, A))) notes.unshift('Off by a factor of π. Check for a missing (or extra) π, as in a volume of revolution.');
      else if(A && (near(v / 2, A) || near(v * 2, A))) notes.unshift('Off by a factor of 2. Check a ½ (a triangle\'s area, an antiderivative of x) or a doubled term.');
      else if(calc && A && (near(v * Math.PI / 180, A) || near(v * 180 / Math.PI, A))) notes.unshift('Off by the factor between degrees and radians. Calculus uses radians: check your calculator\'s mode.');
    }
    var graded = ['value', 'unit'].filter(function(k){ return parts[k] !== null; });
    var right = graded.filter(function(k){ return parts[k]; }).length;
    return { valid: true, correct: right === graded.length, score: right / graded.length, value: v, parts: parts, notes: notes, mistake: mistake, right: right, total: graded.length };
  }

  /* The key as HTML: an exact key as rendered math with its decimal, a
     calculator key to three decimal places. The same rule as formatKey in
     scripts/lib/apcalc-build.mjs. */
  function formatKey(N, calc){
    var v = keyValue(N), u = N.unit ? ' ' + esc(N.unit) : '';
    if(N.answerHtml) return N.answerHtml + (Number.isInteger(v) ? '' : ' ≈ ' + v.toFixed(3)) + u;
    if(calc) return v.toFixed(3) + u;
    return String(+v.toPrecision(12)) + u;
  }

  function grade(q, resp){
    var t = q.type;
    if(t === 'numeric') return gradeNumeric(q, resp);
    if(t === 'expr'){
      if(!X()) return { valid: false, correct: false, score: 0, error: 'The expression checker did not load.' };
      return X().grade(q, resp);
    }
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

  var KIND = { table: 'Table', graph: 'Graph', diagram: 'Diagram' };
  function base(){ return window.ApCalcBase || ''; }
  /* Stimulus HTML from the bank uses paths from calculus/; prefix this page's base. */
  function placePaths(h){ return String(h || '').replace(/(src|href)="figures\//g, '$1="' + base() + 'figures/'); }
  function stimulusPanel(id, s){
    var hid = 'stim-' + id + '-' + (++uid);
    return '<section class="calc-stim" data-stim="' + esc(id) + '" aria-labelledby="' + hid + '"><p class="calc-stim-k">' + (KIND[s.kind] || 'Stimulus') + '</p>' +
      '<h3 id="' + hid + '">' + html(s.title || '') + '</h3>' + placePaths(s.html) + '</section>';
  }

  function report(q){ return window.LevlReport ? window.LevlReport.button('apcalc', q.id) : ''; }
  var DIR = [{ v: 'up', label: 'Increases' }, { v: 'down', label: 'Decreases' }, { v: 'none', label: 'No change' }];

  /* Options are one Tab stop; arrows, Home and End move, Enter or Space answers. */
  function arrowGroup(g){
    var L = [].slice.call(g.querySelectorAll('.calc-opt')), n = L.length;
    function to(j){ L.forEach(function(b, k){ b.tabIndex = k === j ? 0 : -1; }); }
    to(0);
    g.addEventListener('focusin', function(e){ var i = L.indexOf(e.target); if(i > -1) to(i); });
    g.addEventListener('keydown', function(e){
      var i = L.indexOf(document.activeElement), k = e.key;
      var j = i < 0 ? -1 : /Down|Right/.test(k) ? (i + 1) % n : /Up|Left/.test(k) ? (i + n - 1) % n : k === 'Home' ? 0 : k === 'End' ? n - 1 : -1;
      if(j > -1){ e.preventDefault(); L[j].focus(); }
    });
  }
  function markOpt(x, word, cls){ x.insertAdjacentHTML('beforeend', '<span class="calc-mark ' + cls + '">' + word + '</span>'); }

  // Practice, Review and Exams load the shared study styles (docs/course-shell.md).
  function studyPage(){ return !!document.querySelector('.cx-study'); }
  function render(q, host, opts){
    opts = opts || {};
    var reveal = opts.reveal !== false && !opts.exam;
    var done = false, busy = false;
    var getWhy = opts.why || (window.ApCalcCore && window.ApCalcCore.loadWhy ? function(x){ return window.ApCalcCore.loadWhy(base(), x); } : null);
    function explain(cb){
      if(opts.exam || (q.why && q.why.correct) || !getWhy || !q.unit) return cb();
      fb.innerHTML = '<p class="calc-small">Loading the explanation…</p>';
      getWhy(q).then(cb, cb);
    }
    var wrap = document.createElement('div');
    wrap.className = 'calc-q' + (studyPage() ? ' cx-q' : '');
    wrap.setAttribute('data-qid', q.id);
    var stemId = 'q-' + (++uid);
    wrap.innerHTML = '<p class="calc-q-stem cx-q-stem" id="' + stemId + '">' + (opts.n ? '<span class="calc-q-n">' + opts.n + '.</span> ' : '') + (q.calc && !opts.exam ? '<span class="calc-q-calc">Calculator</span> ' : '') + html(q.q) + '</p>' +
      '<div class="calc-q-body"></div><div class="calc-q-feedback cx-fb" aria-live="polite"></div><div class="calc-q-actions"></div>';
    var body = wrap.querySelector('.calc-q-body'), fb = wrap.querySelector('.calc-q-feedback'), actions = wrap.querySelector('.calc-q-actions');
    host.appendChild(wrap);

    function finish(g, detailHtml, pick, part){
      done = true;
      wrap.classList.add('is-answered');
      var result = { correct: g.correct, score: g.score, q: q, pick: pick };
      if(opts.record !== false && window.ApCalcCore) window.ApCalcCore.record(q.id, g.correct, { topic: q.topic, unit: q.unit, practice: q.practice, level: q.level, diff: q.diff, src: 'q' });
      if(!opts.exam){
        var verdict = g.correct ? 'Correct.' : g.score > 0 && part ? part : 'Not quite.';
        // On the study pages, the shared feedback box (assets/course/study.css).
        fb.innerHTML = (studyPage()
          ? '<p class="cx-fb-head"><span class="calc-verdict ' + (g.correct ? 'ok' : 'no') + '">' + verdict + '</span></p>' + (q.why && q.why.correct ? '<p class="cx-explain">' + html(q.why.correct) + '</p>' : '')
          : '<p><span class="calc-verdict ' + (g.correct ? 'ok' : 'no') + '">' + verdict + '</span> ' + (q.why && q.why.correct ? html(q.why.correct) : '') + '</p>') + (detailHtml || '') +
          (!g.correct && opts.record !== false ? '<p class="calc-small">Added to your review queue.</p>' : '');
        fb.classList.toggle('is-right', !!g.correct); fb.classList.toggle('is-wrong', !g.correct);
        try{ if(window.LevlSound && window.LevlSound.answer) window.LevlSound.answer(g.correct); }catch(e){}
      }
      actions.innerHTML = report(q);
      if(opts.onAnswer) opts.onAnswer(result);
      try{ wrap.dispatchEvent(new CustomEvent('calc:answered', { bubbles: true, detail: result })); }catch(e){}
    }

    if(q.type === 'predict') predict(); else if(q.type === 'order') order(); else if(q.type === 'multi') multi(); else if(q.type === 'numeric') numeric(); else if(q.type === 'expr') expr(); else choice();

    function optWhy(x, i){
      if(reveal && q.why && q.why.options && q.why.options[i]) x.insertAdjacentHTML('beforeend', '<span class="calc-opt-why">' + html(q.why.options[i]) + '</span>');
    }

    /* One right option: a radio group. */
    function choice(){
      body.innerHTML = '<div class="calc-opt-btns cx-opts" role="radiogroup" aria-labelledby="' + stemId + '">' + displayOrder(q).map(function(i){
        return '<button type="button" class="calc-opt cx-opt" role="radio" aria-checked="false" data-i="' + i + '">' + html(q.options[i]) + '</button>';
      }).join('') + '</div>';
      arrowGroup(body.querySelector('.calc-opt-btns'));
      body.querySelectorAll('.calc-opt').forEach(function(b){
        b.addEventListener('click', function(){
          if(done || busy) return;
          busy = true;
          explain(function(){
            var pick = +b.getAttribute('data-i'), g = grade(q, pick);
            body.querySelectorAll('.calc-opt').forEach(function(x){
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
      body.innerHTML = '<p class="calc-small">Select all that apply.</p><div class="calc-opt-btns cx-opts" role="group" aria-labelledby="' + stemId + '">' + displayOrder(q).map(function(i){
        return '<button type="button" class="calc-opt cx-opt" role="checkbox" aria-checked="false" data-i="' + i + '">' + html(q.options[i]) + '</button>';
      }).join('') + '</div>';
      arrowGroup(body.querySelector('.calc-opt-btns'));
      actions.innerHTML = '<button type="button" class="btn-press sm calc-check" disabled>Check</button>';
      var check = actions.querySelector('.calc-check');
      body.querySelectorAll('.calc-opt').forEach(function(b){
        b.addEventListener('click', function(){
          if(done || busy) return;
          b.setAttribute('aria-checked', b.getAttribute('aria-checked') === 'true' ? 'false' : 'true');
          check.disabled = !body.querySelector('.calc-opt[aria-checked="true"]');
        });
      });
      check.addEventListener('click', function(){
        if(busy) return;
        busy = true;
        explain(function(){
          var picks = [];
          body.querySelectorAll('.calc-opt[aria-checked="true"]').forEach(function(x){ picks.push(+x.getAttribute('data-i')); });
          var g = grade(q, picks), key = [].concat(q.correct);
          body.querySelectorAll('.calc-opt').forEach(function(x){
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
       unit sits beside the box. Value and units are graded separately, each
       with its own line in the feedback. */
    function numeric(){
      var N = q.numeric || {}, id = 'num-' + (++uid);
      var ask = !!N.askUnit;
      var hint = q.calc ? 'Calculator allowed: give a decimal correct to three places (or the exact value).'
        : 'No calculator: give the exact value, such as 3/4, 2pi, sqrt(3)/2 or e^2.';
      body.innerHTML = '<div class="calc-num"><label for="' + id + '">Your answer' + (!ask && N.unit ? ' (' + esc(N.unit) + ')' : '') + '</label>' +
        '<span class="calc-num-row"><input type="text" id="' + id + '" autocomplete="off" autocapitalize="off" spellcheck="false" aria-describedby="' + id + '-h">' +
        (!ask && N.unit ? '<span class="calc-num-unit" aria-hidden="true">' + esc(N.unit) + '</span>' : '') +
        (ask ? '<label class="calc-num-ulabel" for="' + id + '-u">Unit</label><input type="text" class="calc-num-u" id="' + id + '-u" autocomplete="off" spellcheck="false">' : '') + '</span>' +
        '<span class="calc-small" id="' + id + '-h">' + hint + (ask ? ' Then its unit.' : '') + '</span></div>';
      actions.innerHTML = '<button type="button" class="btn-press sm calc-check">Check</button>';
      var input = body.querySelector('input'), unitIn = body.querySelector('.calc-num-u'), check = actions.querySelector('.calc-check');
      function go(){
        if(done || busy) return;
        var resp = ask ? { value: input.value, unit: unitIn.value } : input.value;
        var g = grade(q, resp);
        if(!g.valid){ fb.innerHTML = '<p class="calc-small" role="alert">Type a number, such as 2.718, or an exact value, such as 3/4 or pi/2.</p>'; input.focus(); return; }
        busy = true;
        explain(function(){
          input.readOnly = true; if(unitIn) unitIn.readOnly = true;
          if(!opts.exam) input.parentNode.insertAdjacentHTML('beforeend', '<span class="calc-mark ' + (g.correct ? 'ok">Correct' : 'no">Your answer') + '</span>');
          var mark = function(v){ return v ? '<span class="calc-mark ok">Right</span>' : '<span class="calc-mark no">Not yet</span>'; };
          var rows = [['Value', g.parts.value]].concat(g.parts.unit !== null ? [['Units', g.parts.unit]] : []);
          var detail = opts.exam ? '' : (rows.length > 1 ? '<ul class="calc-num-parts">' + rows.map(function(r){ return '<li>' + mark(r[1]) + ' ' + r[0] + '</li>'; }).join('') + '</ul>' : '') +
            (g.notes.length ? '<ul class="calc-num-notes">' + g.notes.map(function(n){ return '<li>' + esc(n) + '</li>'; }).join('') + '</ul>' : '') +
            '<p><b>Answer:</b> ' + formatKey(N, q.calc) + '</p>';
          finish(g, detail, resp, g.right + ' of ' + g.total + ' parts right.');
        });
      }
      check.addEventListener('click', go);
      [input, unitIn].forEach(function(el){ if(el) el.addEventListener('keydown', function(e){ if(e.key === 'Enter'){ e.preventDefault(); go(); } }); });
    }

    /* A typed expression (docs/apcalc-architecture.md, "expr items"): a
       labelled box with the item's left-hand side ("f'(x) ="), a live
       preview of how the answer is read, rendered as math, and Enter to
       check. Graded by evaluation at many points (ApCalcExpr.grade). */
    function expr(){
      var E = q.expr || {}, id = 'ex-' + (++uid), vars = E.vars || ['x'];
      var lhsText = E.lhs && T() ? T().text(E.lhs) : '';
      body.innerHTML = '<div class="calc-expr"><label for="' + id + '">Your answer' + (lhsText ? '<span class="sr-only"> for ' + esc(lhsText) + '</span>' : '') + '</label>' +
        '<span class="calc-expr-row">' + (E.lhsHtml ? '<span class="calc-expr-lhs" aria-hidden="true">' + E.lhsHtml + '</span>' : '') +
        '<input type="text" id="' + id + '" autocomplete="off" autocapitalize="off" spellcheck="false" aria-describedby="' + id + '-p ' + id + '-h">' +
        (E.mode === 'constant' ? '<span class="calc-small calc-expr-c">Include + C</span>' : '') + '</span>' +
        '<div class="calc-expr-preview" id="' + id + '-p" aria-live="polite"><span class="calc-small">Your answer will show here as math.</span></div>' +
        '<span class="calc-small" id="' + id + '-h">Use ^ for powers and brackets for function inputs: 3x^2 + sin(2x), e^(x^2), sqrt(x+1), ln(x)/x, pi. Variable' + (vars.length > 1 ? 's: ' : ': ') + esc(vars.join(', ')) + '.</span></div>';
      actions.innerHTML = '<button type="button" class="btn-press sm calc-check">Check</button>';
      var input = body.querySelector('input'), prev = body.querySelector('.calc-expr-preview'), check = actions.querySelector('.calc-check');
      var pending = null;
      function paint(){
        pending = null;
        var v = input.value.trim();
        if(!v || !X()){ prev.innerHTML = '<span class="calc-small">Your answer will show here as math.</span>'; return; }
        var r = X().read(v, { vars: vars, allowC: E.mode === 'constant' });
        prev.innerHTML = r.ok ? '<span class="calc-small">Reads as</span> ' + (T() ? T().render(r.tex + '') : esc(v)) : '<span class="calc-expr-err">' + esc(r.error) + '</span>';
      }
      input.addEventListener('input', function(){ if(!pending) pending = setTimeout(paint, 120); });
      function go(){
        if(done || busy) return;
        var g = grade(q, input.value);
        if(!g.valid){ fb.innerHTML = '<p class="calc-small" role="alert">' + esc(g.error || 'Type an expression.') + '</p>'; input.focus(); return; }
        busy = true;
        explain(function(){
          input.readOnly = true;
          if(!opts.exam) input.parentNode.insertAdjacentHTML('beforeend', '<span class="calc-mark ' + (g.correct ? 'ok">Correct' : 'no">Your answer') + '</span>');
          var detail = opts.exam ? '' : (g.notes.length ? '<ul class="calc-num-notes">' + g.notes.map(function(n){ return '<li>' + html(n) + '</li>'; }).join('') + '</ul>' : '') +
            '<p><b>Answer:</b> ' + (E.lhsHtml ? E.lhsHtml + ' ' : '') + (E.answerHtml || esc(E.answer)) + '</p>' +
            (g.correct ? '' : '<p class="calc-small">Any equivalent form is right: answers are checked by their values, not their spelling.</p>');
          finish(g, detail, input.value);
        });
      }
      check.addEventListener('click', go);
      input.addEventListener('keydown', function(e){ if(e.key === 'Enter'){ e.preventDefault(); go(); } });
    }

    /* Order: up and down buttons move a step (keyboard and phone). */
    function order(){
      var n = q.options.length, cur = orderStart(n);
      function paint(result){
        body.innerHTML = '<p class="calc-small">Put the steps in order.</p><ol class="calc-order">' + cur.map(function(i, k){
          var cls = result && !opts.exam ? (i === k ? 'pos-ok' : 'pos-no') : '';
          return '<li class="' + cls + '"><span class="calc-order-text">' + html(q.options[i]) + '</span>' +
            (result ? (opts.exam ? '' : '<span class="calc-mark ' + (i === k ? 'ok">In place' : 'no">Out of place') + '</span>') : '<button type="button" data-k="' + k + '" data-d="-1" aria-label="Move up: ' + esc(String(q.options[i]).replace(/<[^>]+>/g, '')) + '"' + (k === 0 ? ' disabled' : '') + '>↑</button><button type="button" data-k="' + k + '" data-d="1" aria-label="Move down: ' + esc(String(q.options[i]).replace(/<[^>]+>/g, '')) + '"' + (k === n - 1 ? ' disabled' : '') + '>↓</button>') + '</li>';
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
      actions.innerHTML = '<button type="button" class="btn-press sm calc-check">Check order</button>';
      actions.querySelector('.calc-check').addEventListener('click', function(){
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
      body.innerHTML = '<table class="calc-predict"><thead><tr><th scope="col">Variable</th><th scope="col">Your prediction</th></tr></thead><tbody>' +
        q.variables.map(function(v, k){
          return '<tr data-k="' + k + '"><th scope="row">' + html(v.name) + '<div class="calc-var-why"></div></th><td><div class="calc-dir" role="radiogroup" aria-label="' + esc(String(v.name).replace(/<[^>]+>/g, '')) + '">' +
            DIR.map(function(d){ return '<button type="button" role="radio" aria-checked="false" data-v="' + d.v + '">' + d.label + '</button>'; }).join('') + '</div></td></tr>';
        }).join('') + '</tbody></table>';
      body.querySelectorAll('.calc-dir').forEach(function(g, k){
        g.querySelectorAll('button').forEach(function(b){
          b.addEventListener('click', function(){
            if(done || busy) return;
            g.querySelectorAll('button').forEach(function(x){ x.setAttribute('aria-checked', 'false'); });
            b.setAttribute('aria-checked', 'true'); picks[k] = b.getAttribute('data-v');
          });
        });
      });
      actions.innerHTML = '<button type="button" class="btn-press sm calc-check">Check predictions</button>';
      actions.querySelector('.calc-check').addEventListener('click', function(){
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
            row.querySelector('.calc-var-why').innerHTML = '<span class="calc-mark ' + (ok ? 'ok">Right' : 'no">Wrong') + '</span> <b>' + word + '.</b> ' + html(v.why || '');
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
        host.className = 'calc-set';
        host.innerHTML = stimulusPanel(g.stimulus, s);
        container.appendChild(host);
      }
      g.items.forEach(function(q){ n++; out.push(render(q, host, Object.assign({ n: n }, opts || {}))); });
    });
    return out;
  }

  window.ApCalcQuestions = { render: render, hydrate: hydrate, grade: grade, parseNumber: parseNumber, readNumber: readNumber, splitNumber: splitNumber, threeOk: threeOk, normUnit: normUnit, formatKey: formatKey, group: group, shuffle: shuffle, displayOrder: displayOrder, orderStart: orderStart, stimulusPanel: stimulusPanel };
})();
