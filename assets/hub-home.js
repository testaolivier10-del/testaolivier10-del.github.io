/* The hub's returning-student and search extras, kept out of index.html so the
   hub page stays inside its weight budget (scripts/check-weight.mjs).

   LevlHubContinue(card, info) adds one "Continue" link per started course to
   the progress card the hub's inline script draws. The search link and "/"
   shortcut go into the hub's own header, which does not come from
   site-chrome.js. */
(function(){
  // One "Continue" link per started course. Built with the DOM rather than an
  // HTML string: the URL comes from storage, and the site's link checker reads
  // any quoted href attribute in an .html file as a literal path.
  function renderContinue(card, info){
    var COURSES = [
      { k: 'nremt', name: 'NREMT-EMT', home: '/nremt/' },
      { k: 'ochem', name: 'Organic Chemistry', home: '/ochem/' },
      { k: 'anp', name: 'Anatomy & Physiology', home: '/anatomy-physiology/' }
    ];
    var ptr = {};
    try{ ptr = JSON.parse(localStorage.getItem('levl_resume') || '{}') || {}; }catch(e){}
    var row = document.createElement('div');
    row.className = 'hub-continue';
    COURSES.forEach(function(c){
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

  // Search: the hub draws its own header, so it adds the same search link and
  // "/" shortcut the course pages get from site-chrome.js (site-wide, so no
  // course filter here).
  function addSearch(){
    var toggle = document.getElementById('themeToggle');
    if(!toggle) return;
    var a = document.createElement('a');
    a.className = 'theme-toggle search-toggle';
    a.href = '/search.html';
    a.setAttribute('aria-label', 'Search all courses');
    a.title = 'Search (press /)';
    a.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/></svg>';
    var right = toggle.closest('.nav-right');
    if(right) right.insertBefore(a, right.firstChild);
    else toggle.parentNode.insertBefore(a, toggle);
    document.addEventListener('keydown', function(e){
      if(e.key !== '/' || e.ctrlKey || e.metaKey || e.altKey || e.defaultPrevented) return;
      var t = e.target, tag = t && t.tagName;
      if(tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || (t && t.isContentEditable)) return;
      e.preventDefault();
      location.href = '/search.html';
    });
  }

  window.LevlHubContinue = renderContinue;
  // Runs after hub-progress.js has built the header's right-hand cluster
  // (index.html calls HubProgress.mount on DOMContentLoaded, before this).
  document.addEventListener('DOMContentLoaded', function(){ setTimeout(addSearch, 0); });
})();
