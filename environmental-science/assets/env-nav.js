/* AP® Environmental Science course nav: declares the course's section (the five tabs live in
   site-chrome.js courseTabs) and hands the rest to the shared site chrome
   (assets/site-chrome.js). Each page sets window.ApEnvSection and
   window.ApEnvBase (the path back to environmental-science/). Also wires [data-print] and
   [data-copy] (Copy link) buttons without an inline handler. */
(function(){
  var base = window.ApEnvBase || '';
  var section = window.ApEnvSection || '';
  // The five course tabs (docs/course-redesign-r4.md decision 1); site-chrome.js maps the section to its tab.
  try{
    if(window.LevlChrome){
      window.LevlChrome.registerServiceWorker();
      window.LevlChrome.render({
        subject: 'apenv',
        course: 'AP® Environmental Science',
        courseShort: 'Env Science',
        courseHref: base + 'index.html',
        progressHref: base + 'dashboard.html',
        items: window.LevlChrome.courseTabs(base, section)
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
