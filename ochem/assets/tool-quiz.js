/* The opt-in quiz that sits under a tool.

   The tools are sandboxes and they stay sandboxes: you can put ten electrons
   on a carbon, build a molecule nobody has ever made, and turn a bond to an
   eclipsed conformation and sit there, and nothing judges you or writes it
   down. That freedom is the whole reason a sandbox teaches anything, and a
   score attached to it would quietly turn every experiment into a risk.

   But a sandbox has one failure mode, which is that you can leave it believing
   you understood something you only watched. So each tool gets a quiz you have
   to ASK for. It tests exactly the thing that tool exists to teach, it gives
   the answer and the reasoning immediately, and it ends with what to look at
   again rather than a mark out of ten.

   WHAT IS RECORDED. The sandbox: nothing, ever. A finished quiz run: one topic
   attempt per answer, filed against the curriculum topics the tool declares in
   tools-registry.js, plus the day's activity so a study day counts as a study
   day. Deliberately NOT recorded: XP. Topic attempts feed what the site offers
   you next — which lessons look shaky, what the review queue surfaces — and
   that is a genuine upgrade to learning. XP is a reward, and rewarding a
   sandbox is how a sandbox stops being one.

   That is why this calls OchemMastery.noteTopicAttempt() and not
   OchemMastery.record(): record() runs the XP layer, noteTopicAttempt() does
   not, and the difference is exactly the line being drawn here. */
(function(){

  function esc(s){
    return String(s).replace(/[&<>"]/g, function(c){
      return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c];
    });
  }

  /* Fisher-Yates. Options are shuffled on every question so the position of
     the right answer never becomes the answer — the site already does this for
     practice questions (shuffle-options.js) and a quiz that didn't would be
     learnable in a way that teaches nothing. */
  function shuffle(list){
    var a = list.slice();
    for(var i = a.length - 1; i > 0; i--){
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  /* Topics come from the registry rather than from each tool, so a tool that
     is re-scoped later reports against its new topics without anyone
     remembering to update a second list. */
  function topicsFor(slug){
    var T = window.OchemTools;
    var tool = T && T.bySlug ? T.bySlug(slug) : null;
    if(!tool || !tool.topic) return [];
    return [].concat(tool.topic);
  }

  /* One answer, filed. `share` exists because a tool covering four topics has
     not produced four topics' worth of evidence from one question — it has
     produced one, spread across them. noteTopicAttempt has no share parameter,
     so the spreading is done here by only crediting every topic on a run's
     worth of answers rather than each one. See report(). */
  function fileRun(slug, results){
    var M = window.OchemMastery;
    if(!M || !M.noteTopicAttempt) return;
    var topics = topicsFor(slug);
    if(!topics.length) return;

    /* A run of six questions against a three-topic tool files six attempts,
       dealt round-robin across the topics, rather than eighteen. The evidence
       is what it is; inflating it would make a tool look like more practice
       than it was and skew what the review queue thinks you need. */
    results.forEach(function(r, i){
      M.noteTopicAttempt(topics[i % topics.length], !!r.correct);
    });

    // A finished quiz is a study session, so it keeps the daily streak alive.
    // No XP: see the note at the top of this file.
    if(window.HubProgress && window.HubProgress.recordActivity){
      window.HubProgress.recordActivity('ochem', results.length);
    }
  }

  /* ---------------------------------------------------------------------- */

  /* mount(el, cfg)

     cfg.slug     — the tool's registry slug, for topic attribution.
     cfg.rounds   — how many questions a run is. Default 6.
     cfg.intro    — one line saying what this quiz actually tests.
     cfg.make(recent) — returns the next question, given the ids of the
                        questions just asked so a short run doesn't repeat
                        itself. Return null to end the run early (a tool whose
                        pool is genuinely exhausted).

     A question is:
       { id, prompt, options:[{ id, label, correct }], explain }
     where `explain` is HTML shown after answering — the reasoning, which is
     the part worth reading, and the reason the quiz reveals it whether you
     were right or wrong. */
  function mount(el, cfg){
    if(!el || !cfg || typeof cfg.make !== 'function') return null;

    var rounds = cfg.rounds || 6;
    var state = null;   // null when idle; { i, results, recent, q, answered }

    function idle(){
      el.innerHTML =
        '<div class="tpanel tquiz">' +
          '<div class="tpanel__head"><span>Check yourself</span></div>' +
          '<p class="tquiz__intro">' + esc(cfg.intro || 'A few questions on what this tool shows.') + '</p>' +
          '<p class="tquiz__fine">' + rounds + ' questions, answers explained as you go. ' +
            'Nothing here is scored or added to your level — it only notes which topics to bring back later.</p>' +
          '<button type="button" class="btn-press" id="tqStart">Start</button>' +
        '</div>';
      el.querySelector('#tqStart').addEventListener('click', start);
    }

    function start(){
      state = { i: 0, results: [], recent: [], q: null, answered: false };
      next();
    }

    function next(){
      if(state.i >= rounds) return finish();

      /* Declining is normal, not terminal.

         A maker returns null when it cannot build a FAIR question from the
         draw it happened to make — an IR wavenumber that two bands both claim,
         a molecule whose staggered conformers are degenerate. Treating the
         first null as the end of the run meant a six-question quiz routinely
         stopped on question one with "0 of 0", because the spectroscopy maker
         declines about a quarter of its draws and the conformations maker two
         molecules in eight. So: ask again. Only a maker that cannot produce
         anything at all, over many tries, actually ends the run. */
      var q = null;
      for(var tries = 0; tries < 40 && !q; tries++) q = cfg.make(state.recent.slice());
      if(!q) return finish();
      state.q = q;
      state.answered = false;
      state.recent.push(q.id);
      if(state.recent.length > 8) state.recent.shift();
      renderQuestion(shuffle(q.options));
    }

    function renderQuestion(options){
      var q = state.q;
      el.innerHTML =
        '<div class="tpanel tquiz">' +
          '<div class="tpanel__head">' +
            '<span>Check yourself</span>' +
            '<span class="tquiz__count">' + (state.i + 1) + ' of ' + rounds + '</span>' +
          '</div>' +
          '<div class="tquiz__prompt">' + q.prompt + '</div>' +
          '<div class="tquiz__opts" role="group" aria-label="Answer choices">' +
            options.map(function(o, i){
              return '<button type="button" class="tquiz__opt" data-i="' + i + '">' + o.label + '</button>';
            }).join('') +
          '</div>' +
          '<div class="tquiz__after" id="tqAfter" role="status" aria-live="polite"></div>' +
        '</div>';

      el.querySelectorAll('.tquiz__opt').forEach(function(btn){
        btn.addEventListener('click', function(){
          if(state.answered) return;
          answer(options[parseInt(btn.getAttribute('data-i'), 10)], options, btn);
        });
      });
    }

    function answer(chosen, options, btn){
      state.answered = true;
      var correct = !!chosen.correct;
      state.results.push({ id: state.q.id, correct: correct, prompt: state.q.prompt });

      /* Every option is marked, not just the one picked: seeing which of the
         others was right is most of the teaching in a multiple-choice item,
         and hiding it to preserve the "answer" helps nobody in an ungraded
         quiz. */
      el.querySelectorAll('.tquiz__opt').forEach(function(b, i){
        b.disabled = true;
        if(options[i].correct) b.classList.add('is-right');
        else if(b === btn) b.classList.add('is-wrong');
      });

      var after = el.querySelector('#tqAfter');
      after.innerHTML =
        '<div class="tnote ' + (correct ? 'tnote--good' : 'tnote--warn') + '">' +
          '<span class="tnote__k">' + (correct ? 'Right' : 'Not quite') + '</span>' +
          state.q.explain +
        '</div>' +
        '<button type="button" class="btn-press" id="tqNext">' +
          (state.i + 1 >= rounds ? 'See what to review' : 'Next question') +
        '</button>';
      after.querySelector('#tqNext').addEventListener('click', function(){
        state.i++;
        next();
      });
      // Moving focus to the explanation puts a keyboard or screen-reader user
      // at the feedback rather than back at the top of a list of dead buttons.
      var note = after.querySelector('.tnote');
      if(note){ note.setAttribute('tabindex', '-1'); note.focus(); }
    }

    function finish(){
      var results = state.results;
      var got = results.filter(function(r){ return r.correct; }).length;
      fileRun(cfg.slug, results);

      var missed = results.filter(function(r){ return !r.correct; });

      el.innerHTML =
        '<div class="tpanel tquiz">' +
          '<div class="tpanel__head"><span>Done</span></div>' +
          '<p class="tquiz__tally">' + got + ' of ' + results.length + '.</p>' +
          (missed.length
            ? '<p class="tquiz__fine">Worth another look:</p>' +
              '<ul class="tquiz__missed">' +
                missed.map(function(r){ return '<li>' + r.prompt + '</li>'; }).join('') +
              '</ul>'
            : '<p class="tquiz__fine">Nothing missed. The tool above is still the more interesting way to spend the next ten minutes.</p>') +
          '<div class="trow">' +
            '<button type="button" class="btn-press" id="tqAgain">Another round</button>' +
            '<button type="button" class="tchip tchip--ghost" id="tqDone">Back to the tool</button>' +
          '</div>' +
        '</div>';
      el.querySelector('#tqAgain').addEventListener('click', start);
      el.querySelector('#tqDone').addEventListener('click', idle);
      state = null;
    }

    idle();
    return { start: start, reset: idle };
  }

  window.OchemToolQuiz = { mount: mount, shuffle: shuffle, esc: esc };
})();
