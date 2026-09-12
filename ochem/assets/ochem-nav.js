/* Organic Chemistry course nav: declares this course's tabs, then hands the
   rest to the shared site chrome (assets/site-chrome.js), which draws the
   identical two-row header every LevlPrep course uses.

   This file used to render only a five-link strip under a header each of
   ochem's 81 pages hand-wrote for itself — which is why ochem had no way back
   to the hub and NREMT did. Those hand-written headers are gone; every page
   now carries an empty <div id="site-header"></div> and this file fills it.

   Each page sets window.OCHEM_SECTION ('home'|'learn'|'practice'|'review'|
   'tools'|'mastery') and window.OCHEM_BASE (the relative path back to the
   ochem/ root, e.g. '' at ochem/, '../' from ochem/lessons/) before this
   script runs, since link targets and the active-state check both depend on
   where the current page lives. */
(function(){
  var base = window.OCHEM_BASE || '';
  var section = window.OCHEM_SECTION || '';
  var ITEMS = [
    { key: 'home', label: 'Home', href: base + 'index.html' },
    { key: 'learn', label: 'Learn', href: base + 'learn.html' },
    { key: 'practice', label: 'Practice', href: base + 'practice.html' },
    { key: 'review', label: 'Review', href: base + 'review.html' },
    { key: 'tools', label: 'Tools', href: base + 'tools.html' },
    { key: 'mastery', label: 'Mastery', href: base + 'mastery.html' }
  ];

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
