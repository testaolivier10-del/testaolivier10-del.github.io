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
    var step = 0;

    var shell = card.parentNode;
    var progressBarEl = shell.querySelector('.progress-bar');
    var notesMode = /(^|[?&])notes=1(&|$)/.test(location.search);
    var toggleBar = document.createElement('div');
    toggleBar.className = 'lesson-mode-toggle';
    shell.insertBefore(toggleBar, progressBarEl || card);

    if(notesMode && opts.notesHtml){
      if(progressBarEl) progressBarEl.style.display = 'none';
      toggleBar.innerHTML = '<a href="' + location.pathname + '" class="link-quiet">&larr; Back to the interactive lesson</a>';
      card.innerHTML = '<div class="notes-view">' + opts.notesHtml + '</div><div class="actions" style="margin-top:8px;"><a href="' + doneHref + '" class="btn-press alt">Back to Learn</a></div>';
      return;
    }
    if(opts.notesHtml){
      toggleBar.innerHTML = '<a href="' + location.pathname + '?notes=1" class="link-quiet">&#128221; View lesson notes</a>';
    }

    function record(correct){ window.OchemCurriculum.recordAttempt(topicId, correct); }
    function updateProgress(){
      progFill.style.width = Math.round((step/TOTAL)*100) + '%';
      progLabel.textContent = 'Step ' + (step+1) + ' / ' + (TOTAL+1);
    }
    function feedbackHtml(id){ return '<div class="feedback" id="' + id + '"></div>'; }
    function showFeedback(el, good, text){ el.className = 'feedback show ' + (good?'good':'bad'); el.textContent = text; }
    function nextButtonHtml(label, enabled){ return '<div class="actions"><button class="btn-press" id="nextBtn"' + (enabled?'':' disabled') + '>' + label + '</button></div>'; }
    function doneBoxHtml(){ return '<div class="actions" style="margin-top:8px;"><a href="' + doneHref + '" class="btn-press">Back to Learn</a></div>'; }

    function advance(){ step++; render(); }

    function head(cfg){
      return (cfg.eyebrow ? '<div class="step-eyebrow">' + cfg.eyebrow + '</div>' : '') +
        (cfg.title ? '<h2 class="step-title">' + cfg.title + '</h2>' : '') +
        (cfg.prereqNote ? '<div class="prereq-note">' + cfg.prereqNote + '</div>' : '');
    }

    function renderDeclarative(cfg){
      var isExplain = cfg.type === 'explain';
      var isFinal = cfg.type === 'final';
      card.innerHTML = head(cfg) +
        (cfg.bodyHtml || '') +
        (cfg.diagramHtml || '') +
        (isExplain ? '' :
          '<div class="choice-row">' + cfg.options.map(function(o,i){
            return '<button class="choice-btn" data-i="' + i + '">' + o + '</button>';
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
            if(isFinal) card.querySelector('#doneBox').innerHTML = doneBoxHtml();
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
