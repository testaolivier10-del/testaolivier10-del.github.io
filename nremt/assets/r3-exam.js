/* Site redesign round 3, step B3 (docs/site-redesign.md, board R10-Exam-Live): while the timed exam runs,
   the site's top bar and course tabs give way to the slim exam bar (.r3-focusbar in exams.html, shown by
   r3-inner.css); its buttons press the engine's own Exit and Submit buttons.
   The results are the shared score card (docs/score-card.md), drawn by practice-engine.js renderEnd; the cover
   band and domain card this file used to add above them are gone, since the card's band carries the score. */
(function(){
  document.addEventListener('click', function(e){
    var b = e.target.closest && e.target.closest('[data-r3-click]');
    if(!b) return;
    var t = document.querySelector(b.getAttribute('data-r3-click'));
    if(t){ e.preventDefault(); t.click(); }
  });
})();
