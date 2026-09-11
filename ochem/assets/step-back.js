/* "Previous step" for any lesson-style page that walks through numbered steps.

   Every step page on the site is a forward-only machine: Continue, Continue,
   Continue. Clicking Continue is a reflex, and realizing you skipped an
   explanation meant quitting to Learn and re-entering the lesson, which
   resumes you where you left off — past the step you wanted to re-read.

   Three kinds of page need this and none of them share a step loop:
   lesson-engine.js (57 lessons), mechanism-page.js (6 config-driven
   walkthroughs), and five hand-rolled pages that predate both. So the
   chrome and the one rule that makes going back safe live here, and each
   caller supplies only its own "go back one step" action.

   The rule: a step you have already moved past must not be graded twice.
   Re-reading a step, and answering its question again on the way back
   through, is not new evidence about what you know — without this, walking
   back and forth would let a lesson score be farmed (or wrecked) by
   re-answering the same card. `sync(step)` notes which step you just left,
   and `isReplay()` is true for any step you have left before, which callers
   check before recording.

   Note this is "have you left this step", not "is it behind the furthest
   one you reached": stepping back one and then forward again lands you on
   the furthest step, and that must not re-grade either. Retries WITHIN a
   step are untouched — no step change, so nothing is marked, and the step
   records exactly as it always did. */
(function(){
  var navEl = null;
  var departed = {};   // steps the student has moved away from at least once
  var maxStep = 0;
  var current = 0;

  /* Mounts the control immediately above the card, so it reads as page
     chrome rather than one of the step's own answer buttons. */
  function mount(card, onBack, label){
    if(!card || !card.parentNode || navEl) return null;
    navEl = document.createElement('div');
    navEl.className = 'lesson-step-nav';
    navEl.hidden = true;
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.id = 'lessonBackBtn';
    btn.innerHTML = '&larr; ' + (label || 'Previous step');
    btn.addEventListener('click', function(){ onBack(); });
    navEl.appendChild(btn);
    card.parentNode.insertBefore(navEl, card);
    return navEl;
  }

  // Call once per render, with the step about to be drawn.
  function sync(step){
    if(step !== current) departed[current] = true;
    current = step;
    if(step > maxStep) maxStep = step;
    if(navEl) navEl.hidden = step === 0;
  }

  function isReplay(){ return !!departed[current]; }
  function furthest(){ return maxStep; }

  window.OchemStepBack = { mount: mount, sync: sync, isReplay: isReplay, furthest: furthest };
})();
