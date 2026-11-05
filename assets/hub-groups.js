/* Hub: the course cards in four groups (owner, live session 2026-11-05;
   docs/design-rules.md). The cards stay in index.html in the order the
   build scripts write them; this only moves them under group headings. */
(function(){
  var grid = document.querySelector('#subjects .subject-grid');
  if(!grid) return;
  var cards = {};
  [].forEach.call(grid.querySelectorAll('.ccard'), function(a){ cards[a.getAttribute('data-tint')] = a; });
  var GROUPS = [
    ['College and health', ['nremt', 'anp', 'ochem']],
    ['AP® sciences', ['bio', 'apchem', 'apphys', 'apenv']],
    ['AP® math', ['apprecalc', 'apcalc', 'apcalcbc', 'apstat']],
    ['AP® social sciences', ['appsych', 'apmacro']]
  ];
  var wrap = document.createElement('div');
  wrap.className = 'hub-groups';
  var placed = {};
  GROUPS.forEach(function(g){
    var have = g[1].filter(function(k){ return cards[k]; });
    if(!have.length) return;
    var sec = document.createElement('section');
    sec.className = 'hub-group';
    sec.innerHTML = '<h3>' + g[0] + ' <small>' + have.length + (have.length === 1 ? ' course' : ' courses') + '</small></h3><div class="subject-grid"></div>';
    var box = sec.querySelector('.subject-grid');
    have.forEach(function(k){ box.appendChild(cards[k]); placed[k] = 1; });
    wrap.appendChild(sec);
  });
  // A course added later and not yet in a group still shows, at the end.
  var rest = Object.keys(cards).filter(function(k){ return !placed[k]; });
  if(rest.length){
    var more = document.createElement('section');
    more.className = 'hub-group';
    more.innerHTML = '<h3>More courses</h3><div class="subject-grid"></div>';
    rest.forEach(function(k){ more.querySelector('.subject-grid').appendChild(cards[k]); });
    wrap.appendChild(more);
  }
  grid.parentNode.replaceChild(wrap, grid);
})();
