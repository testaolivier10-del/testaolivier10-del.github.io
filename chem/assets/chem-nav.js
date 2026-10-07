/* AP® Chemistry course nav: declares the course's tabs (the site's one tab set,
   A&P decision 70) and hands the rest to the shared site chrome
   (assets/site-chrome.js). Each page sets window.ApChemSection and
   window.ApChemBase (the path back to chem/). Also wires [data-print] and
   [data-copy] (Copy link) buttons without an inline handler. */
(function(){
  var base = window.ApChemBase || '';
  var section = window.ApChemSection || '';
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
        subject: 'apchem',
        course: 'AP® Chemistry',
        courseShort: 'Chem',
        courseHref: base + 'index.html',
        progressHref: base + 'dashboard.html',
        items: ITEMS.map(function(it){ return { href: it.href, label: it.label, active: it.key === section }; })
      });
    }
  }catch(e){}
  document.addEventListener('click', function(e){
    var b = e.target && e.target.closest ? e.target.closest('[data-print]') : null;
    if(b){ e.preventDefault(); window.print(); return; }
    // Copy link (the share bar on lessons, notes, unit sheets and FRQs).
    var c = e.target && e.target.closest ? e.target.closest('[data-copy]') : null;
    if(!c) return;
    e.preventDefault();
    var url = c.getAttribute('data-copy'), label = c.getAttribute('data-label') || c.textContent;
    c.setAttribute('data-label', label);
    function said(t){ c.textContent = t; setTimeout(function(){ c.textContent = label; }, 2500); }
    try{
      navigator.clipboard.writeText(url).then(function(){ said('Link copied'); }, function(){ window.prompt('Copy this link:', url); });
    }catch(x){ window.prompt('Copy this link:', url); }
  });
})();
