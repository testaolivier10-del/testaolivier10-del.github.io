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
  /* ---- the lesson rail ----------------------------------------------------
     A sticky column beside the card: where you are in the course, the way
     back to the textbook, the progress bar, and every step of this lesson
     with the ones behind you ticked. Built by the engines (lesson-engine.js
     and mechanism-page.js) right after they know their steps; the shell's
     CSS lays it out beside the card once it exists. */
  var railEl = null, railItems = [];
  function esc(s){ return String(s).replace(/[&<>"]/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); }
  function buildRail(opts){
    var shell = opts.shell; if(!shell || railEl) return null;
    railEl = document.createElement('aside');
    railEl.className = 'lesson-rail';
    var eyebrow = shell.querySelector('.hero .eyebrow');
    var html = '<p class="lesson-rail-k">' + (eyebrow ? esc(eyebrow.textContent) : 'Lesson') + '</p>';
    html += '<div class="lesson-rail-links"></div>';
    html += '<div class="lesson-rail-progress"></div>';
    html += '<ol class="lesson-steps">' + opts.steps.map(function(cfg, i){
      // The eyebrow first, because it is the short label written for exactly
      // this job ("Step 2 · Attack" -> "Attack"). The title is the step's
      // question stem, a whole sentence, so preferring it filled the rail with
      // text cut off mid-question — and any step without one fell through to a
      // bare "Step 2", which tells a student nothing about what is on it.
      var label = (cfg && cfg.eyebrow) ? cfg.eyebrow : ((cfg && cfg.title) ? cfg.title : 'Step ' + (i + 1));
      label = String(label).replace(/<[^>]*>/g, '').replace(/^step\s*\d+\s*[\u00b7\-\u2013:]\s*/i, '');
      if(label.length > 64) label = label.slice(0, 61).replace(/\s+\S*$/, '') + '\u2026';
      return '<li class="lesson-step" data-step="' + i + '"><button type="button"><span class="n">' + (i + 1) + '</span><span class="t">' + esc(label) + '</span></button></li>';
    }).join('') + '</ol>';
    railEl.innerHTML = html;
    shell.insertBefore(railEl, shell.firstElementChild);
    // The links and the progress bar move in from the page body.
    var links = shell.querySelector('.lesson-mode-toggle');
    if(links) railEl.querySelector('.lesson-rail-links').appendChild(links);
    var prog = shell.querySelector('.progress-bar');
    if(prog) railEl.querySelector('.lesson-rail-progress').appendChild(prog);
    railItems = Array.prototype.slice.call(railEl.querySelectorAll('.lesson-step'));
    railItems.forEach(function(li){
      li.querySelector('button').addEventListener('click', function(){
        var i = parseInt(li.getAttribute('data-step'), 10);
        if(li.classList.contains('done') && opts.onGo) opts.onGo(i);
      });
    });
    return railEl;
  }
  function syncRail(step){
    railItems.forEach(function(li, i){
      li.classList.toggle('done', i < step);
      li.classList.toggle('current', i === step);
      li.querySelector('button').disabled = i > step;
    });
  }

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

  window.OchemStepBack = { mount: mount, sync: sync, isReplay: isReplay, furthest: furthest, rail: buildRail, syncRail: syncRail };
})();
