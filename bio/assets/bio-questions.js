/* AP® Biology question engine: renders and grades every item type wherever a
   question appears (lesson checks, practice, review, exams). Forked from the
   A&P engine (docs/apbio-spec.md decision 1); formats in docs/apbio-architecture.md.

     ApBioQuestions.render(q, host, opts) -> { el, done() }
       opts.n         the number shown before the stem
       opts.record    false to skip ApBioCore.record (prerequisite checks)
       opts.onAnswer(result)  result = { correct, score (0..1), q, pick }
       opts.reveal    show every option's explanation after answering (default true)
       opts.exam      grade silently, no feedback
     ApBioQuestions.hydrate(container, items, opts) renders a list, placing one
       stimulus panel above each run of items that share a stimulus (a set),
       in authored order.
     ApBioQuestions.grade(q, response) is the pure grader the renderer uses
       (and the tests call): single -> option index; multi -> array of indices;
       numeric -> the typed string; order -> authored indices in the order the
       student placed them; predict -> { variableIndex: 'up'|'down'|'none' }.

   Options are shuffled for display, so an explanation never names a letter
   or position (check-apbio-content enforces it). An item marked "fixed" (a
   find-the-error list, options that are a scale) is never shuffled. Order
   items are shuffled for display and graded against the authored order. */
(function(){
  function esc(s){ return String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
  function html(s){ return String(s == null ? '' : s); }   // our own authored markup (<i>, <sub>)
  function shuffle(a){ a = a.slice(); for(var i = a.length - 1; i > 0; i--){ var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  var uid = 0;

  /* "11,300", "11.3 kJ", "−2.4", ".5", "2,4" -> a number, or NaN. A comma is a
     thousands separator in "1,234" and a decimal point in "2,4". Anything after
     the number must be a unit, not more digits. */
  function parseNumber(s){
    s = String(s == null ? '' : s).trim().replace(/[−–]/g, '-').replace(/\s+/g, ' ');
    var m = /^([+-]?)\s*([0-9][0-9,]*\.?[0-9]*|\.[0-9]+)(?:[eE]([+-]?[0-9]+))?\s*(.*)$/.exec(s);
    if(!m) return NaN;
    var num = m[2], rest = m[4];
    if(/[0-9]/.test(rest)) return NaN;
    if(/^\d{1,3}(,\d{3})+(\.\d*)?$/.test(num)) num = num.replace(/,/g, '');
    else if(/^\d+,\d+$/.test(num)) num = num.replace(',', '.');
    else if(num.indexOf(',') > -1) return NaN;
    var v = parseFloat(num) * (m[3] ? Math.pow(10, +m[3]) : 1);
    return m[1] === '-' ? -v : v;
  }

  function grade(q, resp){
    var t = q.type;
    if(t === 'numeric'){
      var x = parseNumber(resp), N = q.numeric || {};
      if(isNaN(x)) return { valid: false, correct: false, score: 0 };
      var ok = Math.abs(x - N.answer) <= (N.tol || 0) + 1e-9;
      return { valid: true, correct: ok, score: ok ? 1 : 0, value: x };
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

  var KIND = { table: 'Data table', graph: 'Graph', setup: 'Experimental setup', model: 'Model' };
  function base(){ return window.ApBioBase || ''; }
  /* Stimulus HTML from the bank uses paths from bio/; prefix this page's base. */
  function placePaths(h){ return String(h || '').replace(/(src|href)="figures\//g, '$1="' + base() + 'figures/'); }
  function stimulusPanel(id, s){
    var hid = 'stim-' + id + '-' + (++uid);
    return '<section class="bio-stim" data-stim="' + esc(id) + '" aria-labelledby="' + hid + '"><p class="bio-stim-k">' + (KIND[s.kind] || 'Stimulus') + '</p>' +
      '<h3 id="' + hid + '">' + esc(s.title || '') + '</h3>' + placePaths(s.html) + '</section>';
  }

  function report(q){ return window.LevlReport ? window.LevlReport.button('apbio', q.id) : ''; }
  var DIR = [{ v: 'up', label: 'Increases' }, { v: 'down', label: 'Decreases' }, { v: 'none', label: 'No change' }];

  /* Options are one Tab stop; arrows, Home and End move, Enter or Space answers. */
  function arrowGroup(g){
    var L = [].slice.call(g.querySelectorAll('.bio-opt')), n = L.length;
    function to(j){ L.forEach(function(b, k){ b.tabIndex = k === j ? 0 : -1; }); }
    to(0);
    g.addEventListener('focusin', function(e){ var i = L.indexOf(e.target); if(i > -1) to(i); });
    g.addEventListener('keydown', function(e){
      var i = L.indexOf(document.activeElement), k = e.key;
      var j = i < 0 ? -1 : /Down|Right/.test(k) ? (i + 1) % n : /Up|Left/.test(k) ? (i + n - 1) % n : k === 'Home' ? 0 : k === 'End' ? n - 1 : -1;
      if(j > -1){ e.preventDefault(); L[j].focus(); }
    });
  }
  function markOpt(x, word, cls){ x.insertAdjacentHTML('beforeend', '<span class="bio-mark ' + cls + '">' + word + '</span>'); }

  function render(q, host, opts){
    opts = opts || {};
    var reveal = opts.reveal !== false && !opts.exam;
    var done = false, busy = false;
    var getWhy = opts.why || (window.ApBioCore && window.ApBioCore.loadWhy ? function(x){ return window.ApBioCore.loadWhy(base(), x); } : null);
    function explain(cb){
      if(opts.exam || (q.why && q.why.correct) || !getWhy || !q.unit) return cb();
      fb.innerHTML = '<p class="bio-small">Loading the explanation…</p>';
      getWhy(q).then(cb, cb);
    }
    var wrap = document.createElement('div');
    wrap.className = 'bio-q';
    wrap.setAttribute('data-qid', q.id);
    var stemId = 'q-' + (++uid);
    wrap.innerHTML = '<p class="bio-q-stem" id="' + stemId + '">' + (opts.n ? '<span class="bio-q-n">' + opts.n + '.</span> ' : '') + html(q.q) + '</p>' +
      '<div class="bio-q-body"></div><div class="bio-q-feedback" aria-live="polite"></div><div class="bio-q-actions"></div>';
    var body = wrap.querySelector('.bio-q-body'), fb = wrap.querySelector('.bio-q-feedback'), actions = wrap.querySelector('.bio-q-actions');
    host.appendChild(wrap);

    function finish(g, detailHtml, pick, part){
      done = true;
      wrap.classList.add('is-answered');
      var result = { correct: g.correct, score: g.score, q: q, pick: pick };
      if(opts.record !== false && window.ApBioCore) window.ApBioCore.record(q.id, g.correct, { topic: q.topic, unit: q.unit, practice: q.practice, level: q.level, diff: q.diff, src: 'q' });
      if(!opts.exam){
        fb.innerHTML = '<p><span class="bio-verdict ' + (g.correct ? 'ok' : 'no') + '">' +
          (g.correct ? 'Correct.' : g.score > 0 && part ? part : 'Not quite.') + '</span> ' + (q.why && q.why.correct ? html(q.why.correct) : '') + '</p>' + (detailHtml || '') +
          (!g.correct && opts.record !== false ? '<p class="bio-small">Added to your review queue.</p>' : '');
        try{ if(window.LevlSound && window.LevlSound.answer) window.LevlSound.answer(g.correct); }catch(e){}
      }
      actions.innerHTML = report(q);
      if(opts.onAnswer) opts.onAnswer(result);
      try{ wrap.dispatchEvent(new CustomEvent('bio:answered', { bubbles: true, detail: result })); }catch(e){}
    }

    if(q.type === 'predict') predict(); else if(q.type === 'order') order(); else if(q.type === 'multi') multi(); else if(q.type === 'numeric') numeric(); else choice();

    function optWhy(x, i){
      if(reveal && q.why && q.why.options && q.why.options[i]) x.insertAdjacentHTML('beforeend', '<span class="bio-opt-why">' + html(q.why.options[i]) + '</span>');
    }

    /* One right option: a radio group. */
    function choice(){
      body.innerHTML = '<div class="bio-opt-btns" role="radiogroup" aria-labelledby="' + stemId + '">' + displayOrder(q).map(function(i){
        return '<button type="button" class="bio-opt" role="radio" aria-checked="false" data-i="' + i + '">' + html(q.options[i]) + '</button>';
      }).join('') + '</div>';
      arrowGroup(body.querySelector('.bio-opt-btns'));
      body.querySelectorAll('.bio-opt').forEach(function(b){
        b.addEventListener('click', function(){
          if(done || busy) return;
          busy = true;
          explain(function(){
            var pick = +b.getAttribute('data-i'), g = grade(q, pick);
            body.querySelectorAll('.bio-opt').forEach(function(x){
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
      body.innerHTML = '<p class="bio-small">Select all that apply.</p><div class="bio-opt-btns" role="group" aria-labelledby="' + stemId + '">' + displayOrder(q).map(function(i){
        return '<button type="button" class="bio-opt" role="checkbox" aria-checked="false" data-i="' + i + '">' + html(q.options[i]) + '</button>';
      }).join('') + '</div>';
      arrowGroup(body.querySelector('.bio-opt-btns'));
      actions.innerHTML = '<button type="button" class="btn-press sm bio-check" disabled>Check</button>';
      var check = actions.querySelector('.bio-check');
      body.querySelectorAll('.bio-opt').forEach(function(b){
        b.addEventListener('click', function(){
          if(done || busy) return;
          b.setAttribute('aria-checked', b.getAttribute('aria-checked') === 'true' ? 'false' : 'true');
          check.disabled = !body.querySelector('.bio-opt[aria-checked="true"]');
        });
      });
      check.addEventListener('click', function(){
        if(busy) return;
        busy = true;
        explain(function(){
          var picks = [];
          body.querySelectorAll('.bio-opt[aria-checked="true"]').forEach(function(x){ picks.push(+x.getAttribute('data-i')); });
          var g = grade(q, picks), key = [].concat(q.correct);
          body.querySelectorAll('.bio-opt').forEach(function(x){
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

    /* A typed number: labelled, decimal keyboard on phones, the unit beside
       it, a tolerance in the grading, Enter checks. */
    function numeric(){
      var N = q.numeric || {}, id = 'num-' + (++uid);
      var hint = N.decimals != null ? 'Round to ' + N.decimals + ' decimal place' + (N.decimals === 1 ? '' : 's') + '.' : '';
      body.innerHTML = '<div class="bio-num"><label for="' + id + '">Your answer' + (N.unit ? ' (' + esc(N.unit) + ')' : '') + '</label>' +
        '<span class="bio-num-row"><input type="text" id="' + id + '" inputmode="decimal" autocomplete="off" spellcheck="false" aria-describedby="' + id + '-h">' +
        (N.unit ? '<span class="bio-num-unit" aria-hidden="true">' + esc(N.unit) + '</span>' : '') + '</span>' +
        '<span class="bio-small" id="' + id + '-h">' + hint + '</span></div>';
      actions.innerHTML = '<button type="button" class="btn-press sm bio-check">Check</button>';
      var input = body.querySelector('input'), check = actions.querySelector('.bio-check');
      function go(){
        if(done || busy) return;
        var g = grade(q, input.value);
        if(!g.valid){ fb.innerHTML = '<p class="bio-small" role="alert">Type a number, for example 2.4.</p>'; input.focus(); return; }
        busy = true;
        explain(function(){
          input.readOnly = true;
          var key = Number(N.answer).toFixed(N.decimals != null ? N.decimals : 2) + (N.unit ? ' ' + N.unit : '');
          if(!opts.exam) input.parentNode.insertAdjacentHTML('beforeend', '<span class="bio-mark ' + (g.correct ? 'ok">Correct' : 'no">Your answer') + '</span>');
          finish(g, opts.exam ? '' : '<p><b>Answer:</b> ' + esc(key) + '</p>', input.value);
        });
      }
      check.addEventListener('click', go);
      input.addEventListener('keydown', function(e){ if(e.key === 'Enter'){ e.preventDefault(); go(); } });
    }

    /* Order: up and down buttons move a step (keyboard and phone). */
    function order(){
      var n = q.options.length, cur = orderStart(n);
      function paint(result){
        body.innerHTML = '<p class="bio-small">Put the steps in order.</p><ol class="bio-order">' + cur.map(function(i, k){
          var cls = result && !opts.exam ? (i === k ? 'pos-ok' : 'pos-no') : '';
          return '<li class="' + cls + '"><span class="bio-order-text">' + html(q.options[i]) + '</span>' +
            (result ? (opts.exam ? '' : '<span class="bio-mark ' + (i === k ? 'ok">In place' : 'no">Out of place') + '</span>') : '<button type="button" data-k="' + k + '" data-d="-1" aria-label="Move up: ' + esc(String(q.options[i]).replace(/<[^>]+>/g, '')) + '"' + (k === 0 ? ' disabled' : '') + '>↑</button><button type="button" data-k="' + k + '" data-d="1" aria-label="Move down: ' + esc(String(q.options[i]).replace(/<[^>]+>/g, '')) + '"' + (k === n - 1 ? ' disabled' : '') + '>↓</button>') + '</li>';
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
      actions.innerHTML = '<button type="button" class="btn-press sm bio-check">Check order</button>';
      actions.querySelector('.bio-check').addEventListener('click', function(){
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
      body.innerHTML = '<table class="bio-predict"><thead><tr><th scope="col">Variable</th><th scope="col">Your prediction</th></tr></thead><tbody>' +
        q.variables.map(function(v, k){
          return '<tr data-k="' + k + '"><th scope="row">' + html(v.name) + '<div class="bio-var-why"></div></th><td><div class="bio-dir" role="radiogroup" aria-label="' + esc(String(v.name).replace(/<[^>]+>/g, '')) + '">' +
            DIR.map(function(d){ return '<button type="button" role="radio" aria-checked="false" data-v="' + d.v + '">' + d.label + '</button>'; }).join('') + '</div></td></tr>';
        }).join('') + '</tbody></table>';
      body.querySelectorAll('.bio-dir').forEach(function(g, k){
        g.querySelectorAll('button').forEach(function(b){
          b.addEventListener('click', function(){
            if(done || busy) return;
            g.querySelectorAll('button').forEach(function(x){ x.setAttribute('aria-checked', 'false'); });
            b.setAttribute('aria-checked', 'true'); picks[k] = b.getAttribute('data-v');
          });
        });
      });
      actions.innerHTML = '<button type="button" class="btn-press sm bio-check">Check predictions</button>';
      actions.querySelector('.bio-check').addEventListener('click', function(){
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
            row.querySelector('.bio-var-why').innerHTML = '<span class="bio-mark ' + (ok ? 'ok">Right' : 'no">Wrong') + '</span> <b>' + word + '.</b> ' + html(v.why || '');
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
        host.className = 'bio-set';
        host.innerHTML = stimulusPanel(g.stimulus, s);
        container.appendChild(host);
      }
      g.items.forEach(function(q){ n++; out.push(render(q, host, Object.assign({ n: n }, opts || {}))); });
    });
    return out;
  }

  window.ApBioQuestions = { render: render, hydrate: hydrate, grade: grade, parseNumber: parseNumber, group: group, shuffle: shuffle, displayOrder: displayOrder, orderStart: orderStart, stimulusPanel: stimulusPanel };
})();
