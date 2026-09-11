/* Shared step-machine for Ochem lessons. Formal Charge, SN1, SN2, and E2
   each hand-wrote this (progress bar, feedback box, choice buttons, retry
   logic) inline. With eight more Module 1 lessons to author, the pattern is
   the same often enough to pull into one engine — each lesson now supplies
   a small array of step configs instead of rewriting the plumbing.

   Two kinds of step:
   - Declarative ('explain' | 'mcq' | 'final'): plain data, rendered by this
     file. Covers the common case — some explanation text, optionally a
     diagram, optionally a multiple-choice question.
   - Custom (`render` function instead of `type`): full control for a
     lesson's one genuinely hands-on interaction (clicking atoms, counting
     bonds, placing a dipole arrow). Gets the same helpers the declarative
     steps use, plus `advance()` to move the engine forward.

   Every mcq/final/custom step that grades an answer calls
   OchemCurriculum.recordAttempt itself (via the `record` helper), same as
   the earlier hand-written lessons — this file doesn't guess correctness
   for custom steps, only for declarative 'mcq'/'final' ones.

   Going back: every step keeps a Back control above the card once you are
   past the first one, because Continue is a reflex and re-reading the step
   you clicked through should not mean quitting to Learn and re-entering the
   lesson. The control and the don't-grade-it-twice rule come from
   step-back.js, shared with the mechanism pages and the hand-rolled lessons
   so all three behave identically. Stepping back re-renders that step live
   rather than replaying a snapshot — these steps are short and re-answering
   one is harmless — but a step already moved past never records a second
   attempt, so walking back and forth cannot inflate (or deflate) a score.

   Notes mode: the interactive step flow is great for a first pass, but bad
   for "wait, what did this lesson actually say about X" — getting back to
   an explanation means re-clicking through MCQs you already answered. If a
   lesson supplies `opts.notesHtml`, this engine also renders a read-only,
   non-gated recap of the whole lesson (every explanation, restated
   findings from the hands-on steps, and the why-it-matters/challenge
   takeaways) whenever the page is opened with `?notes=1`. A small toggle
   link is injected either way so both views are always one click apart. */
(function(){
  function start(opts){
    var topicId = opts.topicId;
    var steps = opts.steps;
    var card = opts.card;
    var progFill = opts.progFill;
    var progLabel = opts.progLabel;
    var doneHref = opts.doneHref || '../learn.html';
    var TOTAL = steps.length - 1;
    var begin = window.OchemCurriculum.beginLessonRun(topicId, steps.length);
    var step = begin.step;

    var shell = card.parentNode;
    var progressBarEl = shell.querySelector('.progress-bar');
    var notesMode = /(^|[?&])notes=1(&|$)/.test(location.search);
    var toggleBar = document.createElement('div');
    toggleBar.className = 'lesson-mode-toggle';
    shell.insertBefore(toggleBar, progressBarEl || card);

    var backLinkHtml = '<a href="' + doneHref + '" class="link-quiet lesson-back-link">&larr; Back to Learn</a>';

    if(notesMode && opts.notesHtml){
      if(progressBarEl) progressBarEl.style.display = 'none';
      toggleBar.innerHTML = backLinkHtml + '<a href="' + location.pathname + '" class="link-quiet">&larr; Back to the interactive lesson</a>';
      card.innerHTML = '<div class="notes-view">' + opts.notesHtml + '</div><div class="actions" style="margin-top:8px;"><a href="' + doneHref + '" class="btn-press alt">Back to Learn</a></div>';
      return;
    }
    toggleBar.innerHTML = backLinkHtml + (opts.notesHtml ? '<a href="' + location.pathname + '?notes=1" class="link-quiet">&#128221; View lesson notes</a>' : '');

    if(begin.resumed){
      var resumeNote = document.createElement('div');
      resumeNote.className = 'lesson-resume-note';
      resumeNote.innerHTML = 'Resumed from where you left off (step ' + (step+1) + ' of ' + steps.length + '). <a href="#" class="link-quiet" id="lessonStartOverLink">Start over instead</a>';
      shell.insertBefore(resumeNote, progressBarEl || card);
      resumeNote.querySelector('#lessonStartOverLink').addEventListener('click', function(e){
        e.preventDefault();
        window.OchemCurriculum.resetRun(topicId);
        location.reload();
      });
    }

    /* Lesson answers feed the same concept model Practice and Review use.
       Before this, lessons wrote only to OchemCurriculum (a per-topic lesson
       score) and the concept engine never heard about them — so nailing a
       lesson moved nothing in Practice, and the leech rule could send a
       student to a lesson, watch them do it, and leave the concept benched.
       The tier/share/first-attempt rules live in the mastery engine so the
       hand-written mechanism pages can share them verbatim. */
    var M = window.OchemMastery;
    var rec = M ? M.lessonRecorder(topicId) : null;

    /* Which concepts a step is testing, best source first:
         1. the lesson-concepts map, authored per step (assets/lesson-concepts.js)
         2. a `concept` on the step config itself
         3. keyword inference over the step's own text
         4. the topic's primary concept
       Inference alone was not good enough to rely on: measured across all 57
       engine-driven lessons it collapsed 34 of them onto a single concept,
       averaging 1.5 distinct concepts recorded against 4.25 available per
       topic. A lesson that teaches seven ideas and records one is barely
       better than not recording at all, hence the authored map. */
    var LC = window.OchemLessonConcepts;
    var mapped = LC ? LC.forTopic(topicId, steps.length) : null;

    var SB = window.OchemStepBack;

    function record(correct, conceptId){
      /* Re-answering a step reached by going back is a re-read, not new
         evidence, so it never reaches the curriculum or the mastery engine
         a second time. Retries within a step are unaffected. */
      if(SB && SB.isReplay()) return;
      window.OchemCurriculum.recordAttempt(topicId, correct);
      if(!rec) return;
      var cfg = steps[step] || {};
      rec(correct, step, {
        concepts: (!conceptId && mapped) ? mapped[step] : null,
        concept: conceptId || cfg.concept,
        text: [cfg.title, cfg.prompt, cfg.bodyHtml].filter(Boolean).join(' ')
      });
    }
    function updateProgress(){
      progFill.style.width = Math.round((step/TOTAL)*100) + '%';
      progLabel.textContent = 'Step ' + (step+1) + ' / ' + (TOTAL+1);
      window.OchemCurriculum.saveStep(topicId, step);
    }
    function feedbackHtml(id){ return '<div class="feedback" id="' + id + '"></div>'; }
    function showFeedback(el, good, text){ el.className = 'feedback show ' + (good?'good':'bad'); el.textContent = text; }
    function nextButtonHtml(label, enabled){ return '<div class="actions"><button class="btn-press" id="nextBtn"' + (enabled?'':' disabled') + '>' + label + '</button></div>'; }
    function doneBoxHtml(){ return '<div class="actions" style="margin-top:8px;"><a href="' + doneHref + '" class="btn-press">Back to Learn</a></div>'; }

    function advance(){ step++; render(); }
    function goBack(){ if(step > 0){ step--; render(); } }

    /* Mounted by the engine, so a lesson's custom (hands-on) steps get the
       Back control for free without each of them drawing one. */
    if(SB) SB.mount(card, goBack);

    function head(cfg){
      return (cfg.eyebrow ? '<div class="step-eyebrow">' + cfg.eyebrow + '</div>' : '') +
        (cfg.title ? '<h2 class="step-title">' + cfg.title + '</h2>' : '') +
        (cfg.prereqNote ? '<div class="prereq-note">' + cfg.prereqNote + '</div>' : '');
    }

    function renderDeclarative(cfg){
      var isExplain = cfg.type === 'explain';
      var isFinal = cfg.type === 'final';
      /* Options are shuffled per sitting rather than rendered in authored
         order — see shuffle-options.js. Without it, 178 of the 193 check
         questions in these lessons were answerable by clicking the first
         button, and the concept model banked that as learning. `data-i` stays
         the AUTHOR's index so the correctness test below is unchanged. */
      var shuf = (!isExplain && window.OchemShuffle)
        ? window.OchemShuffle.apply(cfg.options, topicId + ':' + step)
        : { options: isExplain ? [] : cfg.options, toOriginal: null };
      card.innerHTML = head(cfg) +
        (cfg.bodyHtml || '') +
        (cfg.diagramHtml || '') +
        (isExplain ? '' :
          '<div class="choice-row">' + shuf.options.map(function(o,i){
            var orig = shuf.toOriginal ? shuf.toOriginal[i] : i;
            return '<button class="choice-btn" data-i="' + orig + '">' + o + '</button>';
          }).join('') + '</div>' + feedbackHtml('fb')
        ) +
        (isExplain ? nextButtonHtml(cfg.nextLabel || 'Continue', true) : (isFinal ? '<div id="doneBox"></div>' : nextButtonHtml(cfg.nextLabel || 'Continue', false)));

      if(isExplain){
        card.querySelector('#nextBtn').addEventListener('click', advance);
        return;
      }

      var fb = card.querySelector('#fb');
      var next = isFinal ? null : card.querySelector('#nextBtn');
      card.querySelectorAll('.choice-btn').forEach(function(btn){
        btn.addEventListener('click', function(){
          var i = parseInt(btn.getAttribute('data-i'), 10);
          var isCorrect = i === cfg.correctIndex;
          card.querySelectorAll('.choice-btn').forEach(function(b){ b.disabled = true; });
          btn.classList.add(isCorrect ? 'correct' : 'wrong');
          record(isCorrect);
          if(isCorrect){
            showFeedback(fb, true, cfg.correctFeedback || 'Correct.');
            if(isFinal){
              window.OchemCurriculum.completeLessonRun(topicId);
              if(M) M.noteLesson(topicId);
              card.querySelector('#doneBox').innerHTML = doneBoxHtml();
            }
            else next.disabled = false;
          } else {
            showFeedback(fb, false, cfg.wrongFeedback || 'Not quite — try again.');
            card.querySelectorAll('.choice-btn').forEach(function(b){ b.disabled = false; b.classList.remove('wrong'); });
          }
        });
      });
      if(next) next.addEventListener('click', advance);
    }

    function render(){
      updateProgress();
      if(SB) SB.sync(step);
      var cfg = steps[step];
      if(typeof cfg.render === 'function'){
        cfg.render({
          card: card, feedbackHtml: feedbackHtml, showFeedback: showFeedback,
          nextButtonHtml: nextButtonHtml, doneBoxHtml: doneBoxHtml, record: record, advance: advance,
          isLast: step === steps.length - 1
        });
        return;
      }
      renderDeclarative(cfg);
    }

    render();
  }

  window.OchemLessonEngine = { start: start };
})();
