/* Organic Chemistry course nav: declares this course's tabs, then hands the
   rest to the shared site chrome (assets/site-chrome.js), which draws the
   identical two-row header every LevlPrep course uses.

   This file used to render only a five-link strip under a header each of
   ochem's 81 pages hand-wrote for itself — which is why ochem had no way back
   to the hub and NREMT did. Those hand-written headers are gone; every page
   now carries an empty <div id="site-header"></div> and this file fills it.

   Each page sets window.OCHEM_SECTION ('home'|'learn'|'practice'|'review'|
   'exams'|'glossary'|'tools'|'dashboard', or '' for none) and window.OCHEM_BASE (the
   relative path back to the ochem/ root, e.g. '' at ochem/, '../' from
   ochem/lessons/) before this script runs, since link targets and the
   active-state check both depend on where the current page lives. */
(function(){
  var base = window.OCHEM_BASE || '';
  var section = window.OCHEM_SECTION || '';
  // The same eight tabs, in the same order, as every LevlPrep course. Search
  // is reached from the header, not a tab; flashcards are a Practice mode
  // (linked from Practice and Review), so their page lights Practice.
  var ITEMS = [
    { key: 'home', label: 'Home', href: base + 'index.html' },
    { key: 'learn', label: 'Learn', href: base + 'learn.html' },
    { key: 'practice', label: 'Practice', href: base + 'practice.html' },
    { key: 'review', label: 'Review', href: base + 'review.html' },
    { key: 'exams', label: 'Exams', href: base + 'exams.html' },
    { key: 'glossary', label: 'Glossary', href: base + 'glossary.html' },
    { key: 'tools', label: 'Tools', href: base + 'tools.html' },
    { key: 'dashboard', label: 'Dashboard', href: base + 'dashboard.html' }
  ];
  // Section names a page may still carry from before the tabs were unified.
  var ALIAS = { flashcards: 'practice', mastery: 'dashboard' };
  section = ALIAS[section] || section;

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


  /* Clickable atoms a lesson or mechanism page draws by hand (a <g> or
     <circle> with class "atom") had a click handler and nothing else, so a
     keyboard or screen-reader user could not answer (audit 2026-10,
     accessibility: atomic-structure step 4 and "click the atom" items).
     Every such atom becomes a named button in the tab order, and Enter or
     Space clicks it, unless the page already handles keys itself (it calls
     preventDefault) or drew it as a static, locked picture. */
  function atomName(el){
    var t = el.querySelector && el.querySelector('text');
    var s = t ? t.textContent : '';
    var svg = el.ownerSVGElement;
    if(!s && svg && el.tagName.toLowerCase() === 'circle'){
      var cx = +el.getAttribute('cx'), cy = +el.getAttribute('cy'), r = +el.getAttribute('r') || 12;
      var texts = svg.querySelectorAll('text');
      for(var i = 0; i < texts.length && !s; i++){
        var x = +texts[i].getAttribute('x'), y = +texts[i].getAttribute('y');
        if(Math.abs(x - cx) <= r && Math.abs(y - cy) <= r + 6) s = texts[i].textContent;
      }
    }
    return (s || el.getAttribute('data-label') || 'atom').replace(/\s+/g, ' ').trim();
  }
  function enhanceAtoms(){
    var list = document.querySelectorAll('.atom:not(.atom--static):not([tabindex])');
    for(var i = 0; i < list.length; i++){
      var el = list[i];
      if(el.closest('.scene--locked')) continue;
      el.setAttribute('tabindex', '0');
      el.setAttribute('role', 'button');
      if(!el.hasAttribute('aria-label')) el.setAttribute('aria-label', atomName(el));
    }
  }
  document.addEventListener('keydown', function(e){
    if((e.key !== 'Enter' && e.key !== ' ') || e.defaultPrevented) return;
    var t = e.target;
    if(!t || !t.classList || !t.classList.contains('atom') || t.getAttribute('role') !== 'button') return;
    e.preventDefault();
    t.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
  });
  if(window.MutationObserver){
    var atomTick = false;
    new MutationObserver(function(){
      if(atomTick) return;
      atomTick = true;
      requestAnimationFrame(function(){ atomTick = false; enhanceAtoms(); });
    }).observe(document.documentElement, { childList: true, subtree: true });
  }

  if(window.LevlChrome){
    window.LevlChrome.registerServiceWorker();
    // 'ochem' selects this course's rank names (Lewis Apprentice → Ochem
    // Legend) for the same shared level number.
    window.LevlChrome.render({
      subject: 'ochem',
      course: 'Organic Chemistry',
      courseHref: base + 'index.html',
      progressHref: base + 'dashboard.html',
      items: ITEMS.map(function(it){
        return { href: it.href, label: it.label, active: it.key === section };
      })
    });
  }
})();
