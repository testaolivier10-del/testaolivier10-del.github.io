/* AP® Psychology question engine: renders and grades every item type
   wherever a question appears (lesson checks, practice, review, exams).
   Forked from the AP® Statistics engine (docs/appsych-spec.md decision 1);
   formats in docs/appsych-architecture.md. Forked from AP® Environmental
   Science's engine (spec decision 1), without setup items (the exam has no
   calculator and no typed setups): `numeric` items take a number worked by
   hand (a mean, a median, a percent under the normal curve), a unit
   optional, graded by ApPsychGrade.numeric; `specific` items ("Make it
   specific": method, variable, operational definition, claim, citation)
   are a builder graded slot by slot (ApPsychGrade.specific) plus a
   free-text box whose rule flags are hints only.

     ApPsychQuestions.render(q, host, opts) -> { el, done() }
       opts.n         the number shown before the stem
       opts.record    false to skip ApPsychCore.record (prerequisite checks)
       opts.onAnswer(result)  result = { correct, score (0..1), q, pick }
       opts.reveal    show every option's explanation after answering (default true)
       opts.exam      grade silently, no feedback
     ApPsychQuestions.hydrate(container, items, opts) renders a list, placing one
       stimulus panel above each run of items that share a stimulus (a set),
       in authored order.
     ApPsychQuestions.grade(q, response) is the pure grader the renderer uses
       (and the tests call): single -> option index; multi -> array of
       indices; numeric -> the typed string or { value, unit }; specific ->
       { slot: option index }; order -> authored indices in the order placed.

   Options are shuffled for display, so an explanation never names a letter
   or position (check-appsych-content enforces it). An item marked "fixed" (a
   find-the-error list, options that are a scale) is never shuffled. */
(function(){
  function esc(s){ return String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
  function html(s){ return String(s == null ? '' : s); }   // our own authored markup (<i>, <sub>)
  function shuffle(a){ a = a.slice(); for(var i = a.length - 1; i > 0; i--){ var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  var uid = 0;

  function G(){ return window.ApPsychGrade; }
  function T(){ return window.ApPsychTex; }

  function formatKey(N){ return G() ? G().formatKey(N) : String(N.answer) + (N.unit ? ' ' + N.unit : ''); }
  function parseNumber(s){ var r = G() && G().readNumber(s); return r ? r.value : NaN; }

  function grade(q, resp){
    var t = q.type;
    if(t === 'numeric'){
      var gn = G().numeric(q.numeric || {}, resp);
      return { valid: gn.valid, correct: gn.correct, score: gn.score || 0, value: gn.value, notes: gn.notes || [], mistake: gn.mistake, parts: gn.parts, right: gn.right, total: gn.total };
    }
    if(t === 'specific'){
      var gp = G().specific(q.specific || {}, resp);
      var names = Object.keys(gp.slots || {}), rc = names.filter(function(n){ return gp.slots[n]; }).length;
      return { valid: gp.valid, correct: gp.correct, score: names.length ? rc / names.length : 0, notes: gp.notes || [], slots: gp.slots, right: rc, total: names.length };
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

  var KIND = { study: 'Study', data: 'Data', visual: 'Figure' };
  function base(){ return window.ApPsychBase || ''; }
  /* Stimulus HTML from the bank uses paths from psychology/; prefix this page's base. */
  function placePaths(h){ return String(h || '').replace(/(src|href)="figures\//g, '$1="' + base() + 'figures/'); }
  function stimulusPanel(id, s){
    var hid = 'stim-' + id + '-' + (++uid);
    return '<section class="psy-stim" data-stim="' + esc(id) + '" aria-labelledby="' + hid + '"><p class="psy-stim-k">' + (KIND[s.kind] || 'Stimulus') + '</p>' +
      '<h3 id="' + hid + '">' + html(s.title || '') + '</h3>' + placePaths(s.html) + '</section>';
  }

  function report(q){ return window.LevlReport ? window.LevlReport.button('appsych', q.id) : ''; }

  /* Options are one Tab stop; arrows, Home and End move, Enter or Space answers. */
  function arrowGroup(g){
    var L = [].slice.call(g.querySelectorAll('.psy-opt')), n = L.length;
    function to(j){ L.forEach(function(b, k){ b.tabIndex = k === j ? 0 : -1; }); }
    to(0);
    g.addEventListener('focusin', function(e){ var i = L.indexOf(e.target); if(i > -1) to(i); });
    g.addEventListener('keydown', function(e){
      var i = L.indexOf(document.activeElement), k = e.key;
      var j = i < 0 ? -1 : /Down|Right/.test(k) ? (i + 1) % n : /Up|Left/.test(k) ? (i + n - 1) % n : k === 'Home' ? 0 : k === 'End' ? n - 1 : -1;
      if(j > -1){ e.preventDefault(); L[j].focus(); }
    });
  }
  function markOpt(x, word, cls){ x.insertAdjacentHTML('beforeend', '<span class="psy-mark ' + cls + '">' + word + '</span>'); }

  // Practice, Review and Exams load the shared study styles (docs/course-shell.md).
  function studyPage(){ return !!document.querySelector('.cx-study'); }
  function render(q, host, opts){
    opts = opts || {};
    var reveal = opts.reveal !== false && !opts.exam;
    var done = false, busy = false;
    var getWhy = opts.why || (window.ApPsychCore && window.ApPsychCore.loadWhy ? function(x){ return window.ApPsychCore.loadWhy(base(), x); } : null);
    function explain(cb){
      if(opts.exam || (q.why && q.why.correct) || !getWhy || !q.unit) return cb();
      fb.innerHTML = '<p class="psy-small">Loading the explanation…</p>';
      getWhy(q).then(cb, cb);
    }
    var wrap = document.createElement('div');
    wrap.className = 'psy-q' + (studyPage() ? ' cx-q' : '');
    wrap.setAttribute('data-qid', q.id);
    var stemId = 'q-' + (++uid);
    wrap.innerHTML = '<p class="psy-q-stem cx-q-stem" id="' + stemId + '">' + (opts.n ? '<span class="psy-q-n">' + opts.n + '.</span> ' : '') + '' + html(q.q) + '</p>' +
      '<div class="psy-q-body"></div><div class="psy-q-feedback cx-fb" aria-live="polite"></div><div class="psy-q-actions"></div>';
    var body = wrap.querySelector('.psy-q-body'), fb = wrap.querySelector('.psy-q-feedback'), actions = wrap.querySelector('.psy-q-actions');
    host.appendChild(wrap);
    // Flag toggle on the study pages (assets/course/flags.js); opts.flag 'session' for an exam-only item.
    if(studyPage() && window.LevlFlags && opts.flag !== false) window.LevlFlags.attach(wrap, 'appsych', q.id, opts.flag);

    function finish(g, detailHtml, pick, part){
      done = true;
      wrap.classList.add('is-answered');
      var result = { correct: g.correct, score: g.score, q: q, pick: pick };
      if(opts.record !== false && window.ApPsychCore) window.ApPsychCore.record(q.id, g.correct, { topic: q.topic, unit: q.unit, practice: q.practice, level: q.level, diff: q.diff, src: 'q' });
      if(!opts.exam){
        var verdict = g.correct ? 'Correct.' : g.score > 0 && part ? part : 'Not quite.';
        // On the study pages, the shared feedback box (assets/course/study.css).
        fb.innerHTML = (studyPage()
          ? '<p class="cx-fb-head"><span class="psy-verdict ' + (g.correct ? 'ok' : 'no') + '">' + verdict + '</span></p>' + (q.why && q.why.correct ? '<p class="cx-explain">' + html(q.why.correct) + '</p>' : '')
          : '<p><span class="psy-verdict ' + (g.correct ? 'ok' : 'no') + '">' + verdict + '</span> ' + (q.why && q.why.correct ? html(q.why.correct) : '') + '</p>') + (detailHtml || '') +
          (!g.correct && opts.record !== false ? '<p class="psy-small">Added to your review queue.</p>' : '');
        fb.classList.toggle('is-right', !!g.correct); fb.classList.toggle('is-wrong', !g.correct);
        try{ if(window.LevlSound && window.LevlSound.answer) window.LevlSound.answer(g.correct); }catch(e){}
      }
      actions.innerHTML = report(q);
      if(opts.onAnswer) opts.onAnswer(result);
      try{ wrap.dispatchEvent(new CustomEvent('psy:answered', { bubbles: true, detail: result })); }catch(e){}
    }

    if(q.type === 'order') order(); else if(q.type === 'multi') multi(); else if(q.type === 'numeric') numeric();
    else if(q.type === 'specific') specificItem(); else choice();

    function optWhy(x, i){
      if(reveal && q.why && q.why.options && q.why.options[i]) x.insertAdjacentHTML('beforeend', '<span class="psy-opt-why">' + html(q.why.options[i]) + '</span>');
    }

    /* One right option: a radio group. */
    function choice(){
      body.innerHTML = '<div class="psy-opt-btns cx-opts" role="radiogroup" aria-labelledby="' + stemId + '">' + displayOrder(q).map(function(i){
        return '<button type="button" class="psy-opt cx-opt" role="radio" aria-checked="false" data-i="' + i + '">' + html(q.options[i]) + '</button>';
      }).join('') + '</div>';
      arrowGroup(body.querySelector('.psy-opt-btns'));
      body.querySelectorAll('.psy-opt').forEach(function(b){
        b.addEventListener('click', function(){
          if(done || busy) return;
          busy = true;
          explain(function(){
            var pick = +b.getAttribute('data-i'), g = grade(q, pick);
            body.querySelectorAll('.psy-opt').forEach(function(x){
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
      body.innerHTML = '<p class="psy-small">Select all that apply.</p><div class="psy-opt-btns cx-opts" role="group" aria-labelledby="' + stemId + '">' + displayOrder(q).map(function(i){
        return '<button type="button" class="psy-opt cx-opt" role="checkbox" aria-checked="false" data-i="' + i + '">' + html(q.options[i]) + '</button>';
      }).join('') + '</div>';
      arrowGroup(body.querySelector('.psy-opt-btns'));
      actions.innerHTML = '<button type="button" class="btn-press sm psy-check" disabled>Check</button>';
      var check = actions.querySelector('.psy-check');
      body.querySelectorAll('.psy-opt').forEach(function(b){
        b.addEventListener('click', function(){
          if(done || busy) return;
          b.setAttribute('aria-checked', b.getAttribute('aria-checked') === 'true' ? 'false' : 'true');
          check.disabled = !body.querySelector('.psy-opt[aria-checked="true"]');
        });
      });
      check.addEventListener('click', function(){
        if(busy) return;
        busy = true;
        explain(function(){
          var picks = [];
          body.querySelectorAll('.psy-opt[aria-checked="true"]').forEach(function(x){ picks.push(+x.getAttribute('data-i')); });
          var g = grade(q, picks), key = [].concat(q.correct);
          body.querySelectorAll('.psy-opt').forEach(function(x){
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

    /* A number with its unit: two labeled boxes when the item has a unit
       (the number, then the unit; a unit typed after the number in the first
       box is read too), Enter checks. Value and unit are graded separately,
       each with its own line in the feedback (spec section 7, rule 2). */
    function numeric(){
      var N = q.numeric || {}, id = 'num-' + (++uid), ask = N.unit != null && N.unit !== '' && N.askUnit !== false;
      body.innerHTML = '<div class="psy-num"><span class="psy-num-row"><label class="psy-num-vlabel" for="' + id + '">Your answer</label><input type="text" id="' + id + '" autocomplete="off" autocapitalize="off" spellcheck="false" aria-describedby="' + id + '-h">' +
        (ask ? '<label class="psy-num-ulabel" for="' + id + '-u">Unit</label><input type="text" class="psy-num-u" id="' + id + '-u" autocomplete="off" spellcheck="false">' : (N.unit ? '<span class="psy-num-unit" aria-hidden="true">' + esc(N.unit) + '</span>' : '')) + '</span>' +
        '<span class="psy-small" id="' + id + '-h">A number, worked out by hand (no calculator on the exam)' + (ask ? ', then its unit (' + esc(N.unit) + ').' : '.') + '</span></div>';
      actions.innerHTML = '<button type="button" class="btn-press sm psy-check">Check</button>';
      var input = body.querySelector('input'), unitIn = body.querySelector('.psy-num-u'), check = actions.querySelector('.psy-check');
      function go(){
        if(done || busy) return;
        var resp = ask ? { value: input.value, unit: unitIn.value } : input.value;
        var g = grade(q, resp);
        if(!g.valid){ fb.innerHTML = '<p class="psy-small" role="alert">' + esc((g.notes && g.notes[0]) || 'Type a number.') + '</p>'; input.focus(); return; }
        busy = true;
        explain(function(){
          input.readOnly = true; if(unitIn) unitIn.readOnly = true;
          if(!opts.exam) input.parentNode.insertAdjacentHTML('beforeend', '<span class="psy-mark ' + (g.correct ? 'ok">Correct' : 'no">Your answer') + '</span>');
          var mark = function(v){ return v ? '<span class="psy-mark ok">Right</span>' : '<span class="psy-mark no">Not yet</span>'; };
          var rows = [['Value', g.parts.value]].concat(g.parts.unit !== null ? [['Units', g.parts.unit]] : []);
          var detail = opts.exam ? '' : (rows.length > 1 ? '<ul class="psy-num-parts">' + rows.map(function(r){ return '<li>' + mark(r[1]) + ' ' + r[0] + '</li>'; }).join('') + '</ul>' : '') +
            notesHtml(g.notes) + '<p><b>Answer:</b> ' + esc(formatKey(N)) + '</p>';
          finish(g, detail, resp, g.right + ' of ' + g.total + ' parts right.');
        });
      }
      check.addEventListener('click', go);
      [input, unitIn].forEach(function(el){ if(el) el.addEventListener('keydown', function(e){ if(e.key === 'Enter'){ e.preventDefault(); if(el === input && unitIn && !unitIn.value.trim() && !G().readNumber(input.value || '0').unit) unitIn.focus(); else go(); } }); });
    }

    function notesHtml(list){ return list && list.length ? '<ul class="psy-num-notes">' + list.map(function(n){ return '<li>' + esc(n) + '</li>'; }).join('') + '</ul>' : ''; }

    /* "Make it specific" (spec section 7, rule 4): write it in your own
       words first (optional; the rule flags are hints, never a score), then
       build it slot by slot, each slot graded exactly, the feedback naming
       the slot that is wrong; then the answer that earns the point. */
    function specificItem(){
      var SP = q.specific || {}, slots = SP.slots || {}, names = Object.keys(slots), base0 = 'sp-' + (++uid);
      body.innerHTML = (SP.write ? '<div class="psy-cl-write"><label for="' + base0 + '-w">Write it in your own words first (optional)</label><textarea id="' + base0 + '-w" rows="3"></textarea><div class="psy-cl-flags" aria-live="polite"></div></div>' : '') +
        (SP.frame ? '<p class="psy-sp-frame">' + html(SP.frame) + '</p>' : '') +
        '<div class="psy-cl">' + names.map(function(n, k){
          var sl = slots[n];
          return '<label class="psy-cl-slot" for="' + base0 + '-' + k + '"><span>' + esc(sl.label || n) + '</span><select id="' + base0 + '-' + k + '" data-slot="' + esc(n) + '"><option value="">Choose</option>' +
            sl.options.map(function(o, i){ return '<option value="' + i + '">' + esc(T() ? T().plain(o) : o) + '</option>'; }).join('') + '</select></label>';
        }).join('') + '</div>';
      actions.innerHTML = '<button type="button" class="btn-press sm psy-check">Check</button>';
      var check = actions.querySelector('.psy-check'), area = body.querySelector('textarea');
      if(area) area.addEventListener('blur', function(){
        if(!area.value.trim()) return;
        var fl = G().flags(SP, area.value).filter(function(f){ return !f.ok; });
        body.querySelector('.psy-cl-flags').innerHTML = fl.length ? '<ul class="psy-num-notes">' + fl.map(function(f){ return '<li>' + esc(f.hint) + '</li>'; }).join('') + '</ul>' : '<p class="psy-small">No flags. Compare it with the answer that earns the point after you check.</p>';
      });
      check.addEventListener('click', function(){
        if(done || busy) return;
        var picks = {};
        body.querySelectorAll('select[data-slot]').forEach(function(sel){ if(sel.value !== '') picks[sel.getAttribute('data-slot')] = +sel.value; });
        var g = grade(q, picks);
        if(!g.valid){ fb.innerHTML = '<p class="psy-small" role="alert">Choose an option in every blank.</p>'; return; }
        busy = true;
        explain(function(){
          body.querySelectorAll('select[data-slot]').forEach(function(sel){
            sel.disabled = true;
            if(!opts.exam) sel.parentNode.insertAdjacentHTML('beforeend', '<span class="psy-mark ' + (g.slots[sel.getAttribute('data-slot')] ? 'ok">Right' : 'no">Check this') + '</span>');
          });
          var model = SP.model ? '<p><b>An answer that earns the point:</b> ' + html(SP.model) + '</p>' : '';
          finish(g, opts.exam ? '' : notesHtml(g.notes) + model, picks, g.right + ' of ' + g.total + ' blanks right.');
        });
      });
    }

    /* Order: up and down buttons move a step (keyboard and phone). */
    function order(){
      var n = q.options.length, cur = orderStart(n);
      function paint(result){
        body.innerHTML = '<p class="psy-small">Put the steps in order.</p><ol class="psy-order">' + cur.map(function(i, k){
          var cls = result && !opts.exam ? (i === k ? 'pos-ok' : 'pos-no') : '';
          return '<li class="' + cls + '"><span class="psy-order-text">' + html(q.options[i]) + '</span>' +
            (result ? (opts.exam ? '' : '<span class="psy-mark ' + (i === k ? 'ok">In place' : 'no">Out of place') + '</span>') : '<button type="button" data-k="' + k + '" data-d="-1" aria-label="Move up: ' + esc(String(q.options[i]).replace(/<[^>]+>/g, '')) + '"' + (k === 0 ? ' disabled' : '') + '>↑</button><button type="button" data-k="' + k + '" data-d="1" aria-label="Move down: ' + esc(String(q.options[i]).replace(/<[^>]+>/g, '')) + '"' + (k === n - 1 ? ' disabled' : '') + '>↓</button>') + '</li>';
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
      actions.innerHTML = '<button type="button" class="btn-press sm psy-check">Check order</button>';
      actions.querySelector('.psy-check').addEventListener('click', function(){
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
        host.className = 'psy-set';
        host.innerHTML = stimulusPanel(g.stimulus, s);
        container.appendChild(host);
      }
      g.items.forEach(function(q){ n++; out.push(render(q, host, Object.assign({ n: n }, opts || {}))); });
    });
    return out;
  }

  window.ApPsychQuestions = { render: render, hydrate: hydrate, grade: grade, parseNumber: parseNumber, formatKey: formatKey, group: group, shuffle: shuffle, displayOrder: displayOrder, orderStart: orderStart, stimulusPanel: stimulusPanel };
})();
