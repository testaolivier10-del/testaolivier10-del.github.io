/* Ochem sub-nav — one small bar under the shared site header, injected into
   #ochem-subnav so every page (home, learn, practice, review, tools,
   mastery, and every lesson at any folder depth) stays in sync without
   hand-copying the same five links everywhere.

   Each page sets window.OCHEM_SECTION ('home'|'learn'|'practice'|'review'|
   'tools'|'mastery') and window.OCHEM_BASE (the relative path back to the
   ochem/ root, e.g. '' at ochem/, '../' from ochem/lessons/) before this
   script runs, since link targets and the active-state check both depend
   on where the current page lives. */
(function(){
  var base = window.OCHEM_BASE || '';
  var section = window.OCHEM_SECTION || '';
  var ITEMS = [
    { key: 'learn', label: 'Learn', href: base + 'learn.html' },
    { key: 'practice', label: 'Practice', href: base + 'practice.html' },
    { key: 'review', label: 'Review', href: base + 'review.html' },
    { key: 'tools', label: 'Tools', href: base + 'tools.html' },
    { key: 'mastery', label: 'Mastery', href: base + 'mastery.html' }
  ];

  var mount = document.getElementById('ochem-subnav');
  if(!mount) return;

  mount.innerHTML = '<div class="ochem-subnav__inner">' +
    ITEMS.map(function(it){
      var active = it.key === section;
      return '<a href="' + it.href + '"' + (active ? ' class="active" aria-current="page"' : '') + '>' + it.label + '</a>';
    }).join('') +
  '</div>';
})();
