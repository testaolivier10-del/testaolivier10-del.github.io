/* The site's screen-reader announcer.

   Every quiz surface here tells you how you did by swapping text into the
   page — a feedback panel appears, a choice turns green, a score ticks up.
   A sighted user sees that instantly. A screen reader user is told nothing:
   assistive tech only speaks a DOM change if the changed node sits inside a
   live region, and the site had none, anywhere. The audible half of the same
   feedback (assets/chime.js) has been there the whole time; this is its
   counterpart for people who navigate by speech.

   Announcements go to one polite region rather than making each feedback
   panel live, because those panels are written with innerHTML into cards that
   are themselves replaced wholesale between questions. A live region has to
   be in the document *before* the text lands in it — a node that appears and
   is populated in the same breath is routinely missed — so a region that is
   rebuilt with the card cannot be relied on. One region, created at load,
   outliving every card, always is.

   "Polite" and not "assertive": the feedback is worth hearing, but it should
   wait for the user to stop typing or navigating rather than cutting them
   off. Nothing here is urgent enough to interrupt.

   Usage:  window.LevlAnnounce.say('Correct. Nitrogen is more electronegative.')
           window.LevlAnnounce.answer(true, 'Nitrogen is more electronegative.')

   site-chrome.js loads this on every page, so pages do not reference it. */
(function(){
  var region = null;
  var clearTimer = null;

  function ensureRegion(){
    if(region && region.isConnected) return region;
    region = document.createElement('div');
    region.className = 'sr-only';
    region.id = 'levlAnnouncer';
    region.setAttribute('role', 'status');
    region.setAttribute('aria-live', 'polite');
    // The whole message is read as one utterance rather than just the words
    // that changed, which for "Correct." -> "Not quite." would otherwise be
    // an unhelpful fragment.
    region.setAttribute('aria-atomic', 'true');
    document.body.appendChild(region);
    return region;
  }

  /* Screen readers suppress a repeat of text identical to what the region
     already holds — and "Correct." twice in a row is the single most likely
     thing to happen here. Emptying the region first, then writing on a later
     frame, makes the second one a genuine change again. */
  function say(text){
    text = String(text == null ? '' : text).replace(/\s+/g, ' ').trim();
    if(!text) return;
    var el = ensureRegion();
    el.textContent = '';
    if(clearTimer) clearTimeout(clearTimer);
    clearTimer = setTimeout(function(){ el.textContent = text; }, 60);
  }

  /* The common case: right or wrong, plus whatever the page explains. The
     verdict leads so it is heard first, before any length of explanation. */
  function answer(good, detail){
    say((good ? 'Correct. ' : 'Incorrect. ') + (detail || ''));
  }

  if(document.body) ensureRegion();
  else document.addEventListener('DOMContentLoaded', ensureRegion);

  window.LevlAnnounce = { say: say, answer: answer };
})();
