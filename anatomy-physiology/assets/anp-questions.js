/* A&P question engine: renders and grades every question type in the course
   (docs/anp-phase1-architecture.md, "Questions"), wherever a question appears —
   a lesson's checks, practice, review, exams.

     AnpQuestions.render(q, host, opts) -> controller
       opts.n            the number shown before the stem
       opts.record       false to skip AnpCore.record (prerequisite checks)
       opts.onAnswer(result)   result = { correct, score (0..1), q }
       opts.reveal       true to show every option's explanation after answering
                         (default true)
       opts.exam         true: grade silently, no feedback (exam mode)

   Options are shuffled for display every time a question is drawn, so an
   explanation must never say "option B" (the content check enforces it); the
   explanation shown under each option is its own why.options entry, carried
   with the option through the shuffle. */
(function(){
  function esc(s){ return String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
  function shuffle(a){ a = a.slice(); for(var i = a.length - 1; i > 0; i--){ var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  // Author content may carry inline markup (<i>, <sub>); it is our own data.
  function html(s){ return String(s == null ? '' : s); }
  /* Covered labels, and the pinned label an identification question asks
     about (a highlighted box with an arrow). Shared with the exams page. */
  function figMarks(fig){
    var at = function(b){ return 'left:' + b[0] + '%;top:' + b[1] + '%;width:' + b[2] + '%;height:' + b[3] + '%'; };
    return (fig.covers || []).map(function(b){ return '<span class="anp-cover" aria-hidden="true" style="' + at(b) + '"></span>'; }).join('') +
      // A label printed with a typo, with the right spelling drawn over it.
      (fig.fixes || '') +   // generator-built SVG (scripts/lib/anp-build.mjs fixSvg)
      (fig.pin ? '<span class="anp-pin" role="img" aria-label="The label in question" style="' + at(fig.pin) + '"><span aria-hidden="true">?</span></span>' : '');
  }
  function report(q){ return window.LevlReport ? window.LevlReport.button('anp', q.id) : ''; }
  var DIR = [{ v: 'up', label: 'Increases' }, { v: 'down', label: 'Decreases' }, { v: 'none', label: 'No change' }];

  /* Options are one Tab stop; arrows, Home and End move, Enter/Space answers. */
  function arrowGroup(g){
    var L = [].slice.call(g.querySelectorAll('.anp-opt')), n = L.length;
    function to(j){ L.forEach(function(b, k){ b.tabIndex = k === j ? 0 : -1; }); }
    to(0);
    g.addEventListener('focusin', function(e){ var i = L.indexOf(e.target); if(i > -1) to(i); });
    g.addEventListener('keydown', function(e){
      var i = L.indexOf(document.activeElement), k = e.key;
      var j = i < 0 ? -1 : /Down|Right/.test(k) ? (i + 1) % n : /Up|Left/.test(k) ? (i + n - 1) % n : k === 'Home' ? 0 : k === 'End' ? n - 1 : -1;
      if(j > -1){ e.preventDefault(); L[j].focus(); }
    });
  }
  // The colour's meaning in words, for a screen reader.
  function markOpt(x, text){ x.insertAdjacentHTML('beforeend', '<span class="sr-only"> (' + text + ')</span>'); }

  function render(q, host, opts){
    opts = opts || {};
    var reveal = opts.reveal !== false && !opts.exam;
    var done = false, busy = false;
    /* The explanation may not be loaded yet: the bank serves explanations
       from <chapter>-why.json after a question is answered (AnpCore.loadWhy,
       audit 2026-10). explain(cb) fetches it if needed, then marks the answer.
       An exam marks nothing until its review, so it never waits. */
    var getWhy = opts.why || (window.AnpCore && window.AnpCore.loadWhy ? function(x){ return window.AnpCore.loadWhy(window.ANP_BASE || '', x); } : null);
    function explain(cb){
      if(opts.exam || (q.why && q.why.correct) || !getWhy || !q.chapter) return cb();
      fb.innerHTML = '<p class="anp-small">Loading the explanation…</p>';
      getWhy(q).then(cb, cb);
    }
    // AVIF copies (scripts/build-figure-variants.py), JPG as fallback.
    function figPicture(f){
      var base = window.ANP_BASE || '';
      var img = '<img src="' + esc(base + f.src) + '" alt="' + esc(f.alt) + '" width="' + f.w + '" height="' + f.h + '" loading="lazy">';
      var m = /^figures\/([\w.-]+)\.jpg$/.exec(f.src);
      if(!m) return img;
      var set = [480, 800].filter(function(w){ return w < f.w; }).map(function(w){ return base + 'figures/avif/' + m[1] + '-' + w + '.avif ' + w + 'w'; });
      set.push(base + 'figures/avif/' + m[1] + '.avif ' + f.w + 'w');
      return '<picture><source type="image/avif" srcset="' + esc(set.join(', ')) + '" sizes="(max-width: 760px) 100vw, 720px">' + img + '</picture>';
    }
    var wrap = document.createElement('div');
    wrap.className = 'anp-q';
    wrap.setAttribute('data-qid', q.id);
    var stem = '<p class="anp-q-stem">' + (opts.n ? '<span class="anp-q-n">' + opts.n + '.</span> ' : '') + html(q.q) + '</p>';
    var fig = q.fig ? '<div class="anp-q-fig anp-figimg">' + figPicture(q.fig) +
      figMarks(q.fig) + '</div>' + (q.fig.credit ? '<p class="anp-credit anp-q-credit">' + esc(q.fig.credit) + '</p>' : '') : '';
    wrap.innerHTML = stem + fig + '<div class="anp-q-body"></div><div class="anp-q-feedback" aria-live="polite"></div><div class="anp-q-actions"></div>';
    var body = wrap.querySelector('.anp-q-body');
    var fb = wrap.querySelector('.anp-q-feedback');
    var actions = wrap.querySelector('.anp-q-actions');
    host.appendChild(wrap);

    function finish(correct, score, detailHtml, pick, part){
      done = true;
      wrap.classList.add('is-answered');
      var result = { correct: correct, score: score, q: q, pick: pick };
      if(opts.record !== false && window.AnpCore) window.AnpCore.record(q.id, correct, { topic: q.topic, core: q.core, level: q.level, diff: q.diff, src: 'q' });
      if(!opts.exam){
        fb.innerHTML = '<p><span class="anp-verdict ' + (correct ? 'ok' : 'no') + '">' +
          (correct ? 'Correct.' : score > 0 && part ? part : score > 0 ? 'Partly right.' : 'Not quite.') + '</span> ' +
          (q.why && q.why.correct ? html(q.why.correct) : '') + '</p>' + (detailHtml || '') +
          (!correct && opts.record !== false ? '<p class="anp-small">Added to your review queue.</p>' : '');
        if(window.LevlSound && window.LevlSound.answer) try{ window.LevlSound.answer(correct); }catch(e){}
      }
      actions.innerHTML = report(q);
      if(opts.onAnswer) opts.onAnswer(result);
      // Lets a lesson open its Continue button (anp-lesson.js).
      try{ wrap.dispatchEvent(new CustomEvent('anp:answered', { bubbles: true, detail: result })); }catch(e){}
    }

    var type = q.type;
    if(type === 'predict') predict(); else if(type === 'order') order(); else if(type === 'multi') multi(); else choice();

    /* single, vignette, graph, image, missing, error: one right option. */
    function choice(){
      // A find-the-error item lists a pathway's steps in order, and the order
      // is part of what it tests, so it is never shuffled (audit 2026-10).
      // The author varies where the wrong step sits instead.
      var items = (q.options || []).map(function(o, i){ return { o: o, i: i }; });
      if(type !== 'error') items = shuffle(items);
      // One answer, so a radio group like NREMT's, not toggle buttons
      // (audit 2026-10): arrows move between options, Enter or Space answers.
      body.innerHTML = '<div class="anp-opt-btns" role="radiogroup" aria-label="Answer options">' + items.map(function(it){
        return '<button type="button" class="anp-opt" role="radio" aria-checked="false" data-i="' + it.i + '">' + html(it.o) + '</button>';
      }).join('') + '</div>';
      arrowGroup(body.querySelector('.anp-opt-btns'));
      body.querySelectorAll('.anp-opt').forEach(function(b){
        b.addEventListener('click', function(){
          if(done || busy) return;
          busy = true;
          explain(function(){
          var pick = +b.getAttribute('data-i');
          var ok = pick === q.correct;
          body.querySelectorAll('.anp-opt').forEach(function(x){
            var i = +x.getAttribute('data-i');
            // aria-disabled: disabling would drop the keyboard focus.
            x.setAttribute('aria-disabled', 'true');
            if(i === pick) x.setAttribute('aria-checked', 'true');
            if(opts.exam) return;
            if(i === q.correct){ x.classList.add('is-right'); markOpt(x, i === pick ? 'your answer, correct' : 'correct answer'); }
            else if(i === pick){ x.classList.add('is-wrong'); markOpt(x, 'your answer, incorrect'); }
            if(reveal && q.why && q.why.options && q.why.options[i]) x.insertAdjacentHTML('beforeend', '<span class="anp-opt-why">' + html(q.why.options[i]) + '</span>');
          });
          finish(ok, ok ? 1 : 0, '', pick);
          });
        });
      });
    }

    /* Select all that apply. Partial credit for the display; the record is
       right only when the whole set is right. */
    function multi(){
      var items = shuffle((q.options || []).map(function(o, i){ return { o: o, i: i }; }));
      body.innerHTML = '<p class="anp-small">Select all that apply.</p><div class="anp-opt-btns" role="group" aria-label="Answer options">' + items.map(function(it){
        return '<button type="button" class="anp-opt" role="checkbox" aria-checked="false" data-i="' + it.i + '">' + html(it.o) + '</button>';
      }).join('') + '</div>';
      arrowGroup(body.querySelector('.anp-opt-btns'));
      // Nothing picked is not an answer: Check waits for at least one pick.
      function syncCheck(){
        var c = actions.querySelector('.anp-check');
        if(c) c.disabled = !body.querySelector('.anp-opt[aria-checked="true"]');
      }
      body.querySelectorAll('.anp-opt').forEach(function(b){
        b.addEventListener('click', function(){ if(!done && !busy){ b.setAttribute('aria-checked', b.getAttribute('aria-checked') === 'true' ? 'false' : 'true'); syncCheck(); } });
      });
      actions.innerHTML = '<button type="button" class="btn-press sm anp-check" disabled>Check</button>';
      actions.querySelector('.anp-check').addEventListener('click', function(){
        if(busy) return;
        busy = true;
        explain(function(){
        var key = [].concat(q.correct), right = 0, total = q.options.length, chosen = [];
        body.querySelectorAll('.anp-opt').forEach(function(x){
          var i = +x.getAttribute('data-i'), picked = x.getAttribute('aria-checked') === 'true', should = key.indexOf(i) > -1;
          x.setAttribute('aria-disabled', 'true');
          if(picked) chosen.push(i);
          if(picked === should) right++;
          if(opts.exam) return;
          if(should){ x.classList.add('is-right'); markOpt(x, picked ? 'selected, correct' : 'should have been selected'); }
          else if(picked){ x.classList.add('is-wrong'); markOpt(x, 'selected, incorrect'); }
          if(reveal && q.why && q.why.options && q.why.options[i]) x.insertAdjacentHTML('beforeend', '<span class="anp-opt-why">' + html(q.why.options[i]) + '</span>');
        });
        finish(right === total, right / total, '', chosen, right + ' of ' + total + ' options marked right.');
        var first = body.querySelector('.anp-opt');
        if(first && (!document.activeElement || document.activeElement === document.body)) first.focus();
        });
      });
    }

    /* Sequencing (the NREMT order format, with per-position feedback). Up and
       down buttons move a step, so it works by keyboard and on a phone. */
    function order(){
      var n = (q.options || []).length;
      var cur = shuffle(q.options.map(function(o, i){ return i; }));
      if(cur.every(function(v, k){ return v === k; }) && n > 1) cur.reverse();
      function paint(result){
        body.innerHTML = '<p class="anp-small">Put the steps in order.</p><ol class="anp-order">' + cur.map(function(i, k){
          var cls = result && !opts.exam ? (i === k ? 'pos-ok' : 'pos-no') : '';
          return '<li class="' + cls + '"><span class="anp-order-text">' + html(q.options[i]) + '</span>' +
            (result ? '' : '<button type="button" data-k="' + k + '" data-d="-1" aria-label="Move up"' + (k === 0 ? ' disabled' : '') + '>↑</button><button type="button" data-k="' + k + '" data-d="1" aria-label="Move down"' + (k === n - 1 ? ' disabled' : '') + '>↓</button>') + '</li>';
        }).join('') + '</ol>';
        if(result) return;
        body.querySelectorAll('button[data-k]').forEach(function(b){
          b.addEventListener('click', function(){
            if(busy) return;
            var k = +b.getAttribute('data-k'), dd = +b.getAttribute('data-d'), j = k + dd;
            var t = cur[k]; cur[k] = cur[j]; cur[j] = t;
            paint(false);
            var again = body.querySelector('button[data-k="' + j + '"][data-d="' + dd + '"]') || body.querySelector('button[data-k="' + j + '"]');
            if(again) again.focus();
          });
        });
      }
      paint(false);
      actions.innerHTML = '<button type="button" class="btn-press sm anp-check">Check order</button>';
      actions.querySelector('.anp-check').addEventListener('click', function(){
        if(busy) return;
        busy = true;
        explain(function(){
        var right = cur.filter(function(v, k){ return v === k; }).length;
        // Exam mode redraws without feedback and without the move buttons.
        paint(true);
        var detail = opts.exam ? '' : '<p><b>Correct order:</b></p><ol>' + q.options.map(function(o){ return '<li>' + html(o) + '</li>'; }).join('') + '</ol>';
        finish(right === n, right / n, detail, cur.slice(), right + ' of ' + n + ' in place.');
        });
      });
    }

    /* Predict the change: up, down or no change for each variable, marked one
       by one, with partial credit and a causal chain for each. */
    function predict(){
      var picks = {};
      body.innerHTML = '<table class="anp-predict"><thead><tr><th scope="col">Variable</th><th scope="col">Your prediction</th></tr></thead><tbody>' +
        q.variables.map(function(v, k){
          return '<tr data-k="' + k + '"><th scope="row">' + html(v.name) + '<div class="anp-var-why"></div></th><td><div class="anp-dir" role="group" aria-label="' + esc(v.name) + '">' +
            DIR.map(function(d){ return '<button type="button" aria-pressed="false" data-v="' + d.v + '">' + d.label + '</button>'; }).join('') + '</div></td></tr>';
        }).join('') + '</tbody></table>';
      body.querySelectorAll('.anp-dir').forEach(function(g, k){
        g.querySelectorAll('button').forEach(function(b){
          b.addEventListener('click', function(){
            if(done || busy) return;
            g.querySelectorAll('button').forEach(function(x){ x.setAttribute('aria-pressed', 'false'); });
            b.setAttribute('aria-pressed', 'true'); picks[k] = b.getAttribute('data-v');
          });
        });
      });
      actions.innerHTML = '<button type="button" class="btn-press sm anp-check">Check predictions</button>';
      actions.querySelector('.anp-check').addEventListener('click', function(){
        if(busy) return;
        busy = true;
        explain(function(){
        var right = 0;
        q.variables.forEach(function(v, k){
          var ok = picks[k] === v.answer;
          if(ok) right++;
          var row = body.querySelector('tr[data-k="' + k + '"]');
          row.querySelectorAll('button').forEach(function(b){ b.disabled = true; });
          if(opts.exam) return;
          row.classList.add(ok ? 'var-ok' : 'var-no');
          var dirLabel = v.answer === 'up' ? 'increases' : v.answer === 'down' ? 'decreases' : 'no change';
          row.querySelector('.anp-var-why').innerHTML = (ok ? '✓ ' : '✗ ') + '<b>' + dirLabel + '.</b> ' + html(v.why || '');
        });
        finish(right === q.variables.length, right / q.variables.length, '', Object.assign({}, picks), right + ' of ' + q.variables.length + ' right.');
        });
      });
    }

    return { el: wrap, done: function(){ return done; } };
  }

  /* Swap a page's static questions (readable without JavaScript) for live ones. */
  function hydrate(container, questions, opts){
    if(!container) return [];
    container.innerHTML = '';
    return questions.map(function(q, i){
      return render(q, container, Object.assign({ n: i + 1 }, opts || {}));
    });
  }

  window.AnpQuestions = { render: render, hydrate: hydrate, shuffle: shuffle, figMarks: figMarks };
})();
