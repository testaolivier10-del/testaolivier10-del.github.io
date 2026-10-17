/* Shared lesson chrome for A&P and the four AP courses (window.LevlLesson).
   The course lesson scripts (<course>-lesson.js) keep the stepped view and
   the questions; this adds what is the same everywhere:

   1. Phones (600px and less): the step list folds behind one toggle,
      "Step 3 of 11: How it works", so the lesson starts on the first screen.
      The builders write the toggle (.cx-ls-toggle) and lesson.css hides the
      list until it is opened; desktop keeps the side list and never shows the
      toggle. Picking a step folds the list again.
   2. After "Check yourself" is finished, one quiet offer under the result
      (never a modal): the Premium card when the next lesson is Premium for
      this visitor, otherwise, when signed out, "Sign in to save your progress
      across devices". "Not now" hides it for a week.

   The shell (.cx-ls) carries data-course and, when there is a next lesson,
   data-next-title, data-next-unit and data-next-free (the builders). The
   course lesson script calls LevlLesson.checked(afterEl) once every check
   question is answered. */
(function(){
  var NUDGE_KEY = 'levlprep_lesson_nudge';
  var WEEK = 7 * 86400000;
  function esc(s){ return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }

  function steps(shell){
    var btn = shell.querySelector('.cx-ls-toggle'), list = shell.querySelector('.cx-ls-steps');
    if(!btn || !list) return;
    var now = btn.querySelector('.cx-ls-now');
    function sync(){
      var items = list.querySelectorAll('li'), cur = list.querySelector('li.current') || items[0];
      var i = [].indexOf.call(items, cur), t = cur && cur.querySelector('.t');
      if(now && i > -1) now.textContent = 'Step ' + (i + 1) + ' of ' + items.length + (t ? ': ' + t.textContent : '');
    }
    function open(on){
      list.classList.toggle('is-open', on);
      btn.setAttribute('aria-expanded', on ? 'true' : 'false');
    }
    btn.addEventListener('click', function(){ open(list.className.indexOf('is-open') < 0); });
    list.addEventListener('click', function(e){ if(e.target.closest('a')) open(false); });
    if(window.MutationObserver) new MutationObserver(sync).observe(list, { subtree: true, attributes: true, attributeFilter: ['class'] });
    sync();
  }

  function signedOut(){
    var A = window.StudyHubAccount;
    if(!A || !A.user) return false;
    if(A.user()) return false;
    return !(A.pendingUserId && A.pendingUserId());
  }
  function nextLocked(shell){
    var P = window.LevlPremium, course = shell.getAttribute('data-course');
    var title = shell.getAttribute('data-next-title');
    if(!P || !course || !title || shell.getAttribute('data-next-free') === '1') return false;
    try{
      if(!P.launched(course) || P.has(course)) return false;
      var unit = shell.getAttribute('data-next-unit');
      return !(unit && P.isFreeChapter(course, unit));
    }catch(e){ return false; }
  }
  function snoozed(){ try{ return Date.now() - (+localStorage.getItem(NUDGE_KEY) || 0) < WEEK; }catch(e){ return false; } }

  function checked(after){
    var shell = document.querySelector('.cx-ls');
    if(!shell || !after || document.querySelector('.cx-ls-nudge') || snoozed()) return;
    var course = shell.getAttribute('data-course'), html = '';
    if(nextLocked(shell)){
      var card = window.LevlPremium.card(course, 'lesson-next');
      if(card) html = '<p class="cx-ls-nudge-t">Next up, <b>' + esc(shell.getAttribute('data-next-title')) + '</b>, is a Premium lesson. Its notes stay free.</p>' + card;
    } else if(signedOut()){
      html = '<p class="cx-ls-nudge-t"><b>Sign in to save your progress across devices.</b> Until then your lessons, XP and review queue live on this browser only.</p>' +
        '<div class="cx-ls-nudge-a"><button type="button" class="btn-press sm" data-nudge="signin">Sign in</button></div>';
    }
    if(!html) return;
    var box = document.createElement('div');
    box.className = 'cx-ls-nudge';
    box.innerHTML = html + '<button type="button" class="cx-ls-nudge-x" data-nudge="later">Not now</button>';
    after.parentNode.insertBefore(box, after.nextSibling);
    box.addEventListener('click', function(e){
      var b = e.target.closest('[data-nudge]');
      if(!b) return;
      if(b.getAttribute('data-nudge') === 'signin' && window.StudyHubAccount && window.StudyHubAccount.openAuthModal) window.StudyHubAccount.openAuthModal('signin');
      if(b.getAttribute('data-nudge') === 'later'){ try{ localStorage.setItem(NUDGE_KEY, String(Date.now())); }catch(err){} box.remove(); }
    });
  }

  function boot(){ var s = document.querySelector('.cx-ls'); if(s) steps(s); }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
  window.LevlLesson = { checked: checked };
})();
