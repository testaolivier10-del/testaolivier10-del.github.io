/* Anatomy & Physiology course nav: declares this course's tabs and hands the
   rest to the shared site chrome (assets/site-chrome.js), which draws the same
   two-row header every LevlPrep course uses. Each page sets window.ANP_SECTION
   and window.ANP_BASE (the path back to the anatomy-physiology/ root). */
(function(){
  var base = window.ANP_BASE || '';
  var section = window.ANP_SECTION || '';
  var ITEMS = [
    { key: 'home', label: 'Home', href: base + 'index.html' },
    { key: 'learn', label: 'Learn', href: base + 'learn.html' },
    { key: 'practice', label: 'Practice', href: base + 'practice.html' },
    { key: 'review', label: 'Review', href: base + 'review.html' },
    { key: 'exams', label: 'Exams', href: base + 'exams.html' },
    { key: 'tools', label: 'Tools', href: base + 'tools.html' },
    { key: 'flashcards', label: 'Flashcards', href: base + 'flashcards.html' },
    { key: 'glossary', label: 'Glossary', href: base + 'glossary.html' },
    { key: 'mastery', label: 'Dashboard', href: base + 'mastery.html' },
    { key: 'search', label: 'Search', href: base + 'search.html' }
  ];
  if(window.LevlChrome){
    window.LevlChrome.registerServiceWorker();
    window.LevlChrome.render({
      subject: 'anp',
      course: 'Anatomy & Physiology',
      courseHref: base + 'index.html',
      progressHref: base + 'mastery.html',
      items: ITEMS.map(function(it){ return { href: it.href, label: it.label, active: it.key === section }; })
    });
  }
})();
