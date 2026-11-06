/* Anatomy & Physiology course nav: declares this course's tabs and hands the
   rest to the shared site chrome (assets/site-chrome.js), which draws the same
   two-row header every LevlPrep course uses. Each page sets window.ANP_SECTION
   and window.ANP_BASE (the path back to the anatomy-physiology/ root). */
(function(){
  var base = window.ANP_BASE || '';
  var section = window.ANP_SECTION || '';
  // The five course tabs (docs/course-redesign-r4.md decision 1); site-chrome.js maps the section to its tab.
  if(window.LevlChrome){
    window.LevlChrome.registerServiceWorker();
    window.LevlChrome.render({
      subject: 'anp',
      course: 'Anatomy & Physiology',
      courseHref: base + 'index.html',
      progressHref: base + 'dashboard.html',
      items: window.LevlChrome.courseTabs(base, section)
    });
  }
})();
