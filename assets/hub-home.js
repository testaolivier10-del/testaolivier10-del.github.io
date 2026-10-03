/* The hub's returning-student and search extras, kept out of index.html so the
   hub page stays inside its weight budget (scripts/check-weight.mjs).

   LevlHubContinue(card, info) adds one "Continue" link per started course to
   the progress card the hub's inline script draws. The header, its search
   link and the "/" shortcut come from site-chrome.js like every page's. */
(function(){
  // One "Continue" link per started course. Built with the DOM rather than an
  // HTML string: the URL comes from storage, and the site's link checker reads
  // any quoted href attribute in an .html file as a literal path.
  function renderContinue(card, info){
    // courses:begin COURSE_LIST key,name,path,status (generated from assets/courses.js by scripts/build-courses.mjs; edit there)
    var COURSE_LIST = [
      { key: 'nremt', name: 'NREMT-EMT', path: '/nremt/', status: 'live' },
      { key: 'ochem', name: 'Organic Chemistry', path: '/ochem/', status: 'live' },
      { key: 'anp', name: 'Anatomy & Physiology', path: '/anatomy-physiology/', status: 'beta' },
      { key: 'apbio', name: 'AP® Biology', path: '/bio/', status: 'beta' },
    ];
    // courses:end
    var COURSES = COURSE_LIST.filter(function(c){ return c.status !== 'hidden'; }).map(function(c){
      return { k: c.key, name: c.name, home: c.path };
    });
    var ptr = {};
    try{ ptr = JSON.parse(localStorage.getItem('levl_resume') || '{}') || {}; }catch(e){}
    var row = document.createElement('div');
    row.className = 'hub-continue';
    COURSES.forEach(function(c){
      // The hero already offers the most recent course (index.html).
      if(c.k === window.__levlHeroContinue) return;
      var p = ptr[c.k];
      var url = p && typeof p.url === 'string' && p.url.charAt(0) === '/' && p.url.charAt(1) !== '/' ? p.url : null;
      if(!url && !((info.subjects || {})[c.k] > 0)) return;
      var a = document.createElement('a');
      a.href = url || c.home;
      var small = document.createElement('small');
      small.textContent = 'Continue \u00b7 ' + c.name;
      var b = document.createElement('b');
      b.textContent = (url && p.label ? p.label : 'Open the course') + ' \u2192';
      a.appendChild(small); a.appendChild(b);
      row.appendChild(a);
    });
    if(row.firstChild && card) card.appendChild(row);
  }

  window.LevlHubContinue = renderContinue;
})();
