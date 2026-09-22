/* Organic Chemistry course nav: declares this course's tabs, then hands the
   rest to the shared site chrome (assets/site-chrome.js), which draws the
   identical two-row header every LevlPrep course uses.

   This file used to render only a five-link strip under a header each of
   ochem's 81 pages hand-wrote for itself — which is why ochem had no way back
   to the hub and NREMT did. Those hand-written headers are gone; every page
   now carries an empty <div id="site-header"></div> and this file fills it.

   Each page sets window.OCHEM_SECTION ('home'|'learn'|'practice'|'review'|
   'flashcards'|'tools'|'mastery'|'search') and window.OCHEM_BASE (the
   relative path back to the ochem/ root, e.g. '' at ochem/, '../' from
   ochem/lessons/) before this script runs, since link targets and the
   active-state check both depend on where the current page lives. */
(function(){
  var base = window.OCHEM_BASE || '';
  var section = window.OCHEM_SECTION || '';
  var ITEMS = [
    { key: 'home', label: 'Home', href: base + 'index.html' },
    { key: 'learn', label: 'Learn', href: base + 'learn.html' },
    { key: 'practice', label: 'Practice', href: base + 'practice.html' },
    { key: 'review', label: 'Review', href: base + 'review.html' },
    // Beside Review: the same habit, for the facts problems lean on.
    { key: 'flashcards', label: 'Flashcards', href: base + 'flashcards.html' },
    { key: 'tools', label: 'Tools', href: base + 'tools.html' },
    { key: 'mastery', label: 'Mastery', href: base + 'mastery.html' },
    // Last, because it is a way of getting somewhere rather than a place. The
    // tab row scrolls horizontally (see .course-nav__inner), so an eighth item
    // costs nothing on a phone — NREMT's row has carried eight for a while.
    { key: 'search', label: 'Search', href: base + 'search.html' }
  ];

  /* A lesson's eyebrow names the chapter it belongs to, and nothing else:
     the number used to be typed in by hand, and inserting a chapter
     renumbered every page below it without breaking anything. The chapter
     id is on the element, so the position is read off the curriculum here
     and prefixed at runtime — the one place it cannot go stale. Pages that
     do not load curriculum.js simply keep the name. */
  var eyebrow = document.querySelector('.eyebrow[data-chapter]');
  var CU = window.OchemCurriculum;
  if(eyebrow && CU && CU.MODULES){
    for(var i = 0; i < CU.MODULES.length; i++){
      if(CU.MODULES[i].id === eyebrow.getAttribute('data-chapter')){
        eyebrow.textContent = 'Chapter ' + (i + 1) + ' \u00b7 ' + CU.MODULES[i].title;
        break;
      }
    }
  }

  if(window.LevlChrome){
    window.LevlChrome.registerServiceWorker();
    // 'ochem' selects this course's rank names (Lewis Apprentice → Ochem
    // Legend) for the same shared level number.
    window.LevlChrome.render({
      subject: 'ochem',
      course: 'Organic Chemistry',
      courseHref: base + 'index.html',
      progressHref: base + 'mastery.html',
      items: ITEMS.map(function(it){
        return { href: it.href, label: it.label, active: it.key === section };
      })
    });
  }
})();
