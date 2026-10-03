/* AP® Biology course nav: declares the course's tabs (the site's one tab set,
   A&P decision 70) and hands the rest to the shared site chrome
   (assets/site-chrome.js). Each page sets window.ApBioSection and
   window.ApBioBase (the path back to bio/). Also wires [data-print] buttons
   (the unit sheets) without an inline handler. */
(function(){
  var base = window.ApBioBase || '';
  var section = window.ApBioSection || '';
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
  var ALIAS = { flashcards: 'practice', frq: 'exams' };
  section = ALIAS[section] || section;
  try{
    if(window.LevlChrome){
      window.LevlChrome.registerServiceWorker();
      window.LevlChrome.render({
        subject: 'apbio',
        course: 'AP® Biology',
        courseShort: 'Bio',
        courseHref: base + 'index.html',
        progressHref: base + 'dashboard.html',
        items: ITEMS.map(function(it){ return { href: it.href, label: it.label, active: it.key === section }; })
      });
    }
  }catch(e){}
  document.addEventListener('click', function(e){
    var b = e.target && e.target.closest ? e.target.closest('[data-print]') : null;
    if(b){ e.preventDefault(); window.print(); }
  });
})();
