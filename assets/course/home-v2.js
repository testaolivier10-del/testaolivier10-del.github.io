/* Course home, design preview (owner, live session 2026-11-05; docs/design-rules.md):
   - "In this course" and "Ways to study" become one short row: Learn, Practice, Review, Exams.
   - Free and Premium becomes one clean comparison table from assets/premium.js (the rows premium.html uses),
     with the Premium column standing out and one button under each column.
   The path card (assets/course/path.js) is the main thing on the page; the banner buttons are hidden in r3.css.
   Once the owner approves, this moves into the builder (scripts/lib/r3-home.mjs). */
(function(){
  var main = document.querySelector('main.r3-home');
  if(!main) return;
  var key = main.getAttribute('data-cover');
  function esc(t){ return String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;'); }
  var I = {
    learn: '<path d="M4 5h6a3 3 0 013 3v12a2 2 0 00-2-2H4zM20 5h-6a3 3 0 00-3 3v12a2 2 0 012-2h7z"/>',
    practice: '<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/>',
    review: '<path d="M3 12a9 9 0 019-9 9 9 0 017 3.4M21 12a9 9 0 01-9 9 9 9 0 01-7-3.4"/><path d="M21 3v4h-4M3 21v-4h4"/>',
    exams: '<circle cx="12" cy="14" r="7"/><path d="M12 14V10.5M10 3h4M12 3v4M18.5 7.5l1.5-1.5"/>'
  };
  function svg(k){ return '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + I[k] + '</svg>'; }

  /* ---- one row: Learn, Practice, Review, Exams ---- */
  var lead = main.querySelector('.lead');
  if(lead && !lead.querySelector('.study4')){
    var rows = [].slice.call(lead.querySelectorAll('.toc li'));
    var units = rows.filter(function(li){ return !li.querySelector('.w.txt'); }).length;
    var skills = rows.length - units;
    var learnLine;
    if(key === 'nremt') learnLine = 'Every chapter of the notes, the glossary and the body map.';
    else if(units) learnLine = units + ' units' + (skills ? ' and ' + skills + ' skills track' + (skills > 1 ? 's' : '') : '') + '. Notes, lessons and the glossary.';
    else learnLine = 'Every chapter, in order. Notes, lessons and the glossary.';
    var W = [
      ['learn.html', 'learn', 'Learn', learnLine],
      ['practice.html', 'practice', 'Practice', 'Questions on any topic, and every answer explains why.'],
      ['review.html', 'review', 'Review', 'What you missed comes back right before you would forget it.'],
      ['exams.html', 'exams', 'Exams', 'Timed and full length, like the real thing.']
    ];
    lead.classList.add('lead--v2');
    lead.innerHTML = '<section class="study4" aria-labelledby="study4-h"><h2 id="study4-h">Ways to <span>study</span></h2><ul>' + W.map(function(w){
      return '<li><a href="' + w[0] + '"><span class="ic">' + svg(w[1]) + '</span><span class="tx"><b>' + w[2] + '</b><small>' + esc(w[3]) + '</small></span></a></li>';
    }).join('') + '</ul></section>';
  }

  /* ---- Free and Premium: one comparison table ---- */
  function cell(v){
    if(v === 'yes') return '<span class="ck" aria-label="Included"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></span>';
    if(v === 'no') return '<span class="no" aria-label="Not included">&ndash;</span>';
    return esc(v);
  }
  function founding(root){
    var n = Date.now();
    [].forEach.call(root.querySelectorAll('[data-founding-until]'), function(e){ e.hidden = n > Date.parse(e.getAttribute('data-founding-until') + 'T23:59:59Z'); });
    [].forEach.call(root.querySelectorAll('[data-founding-after]'), function(e){ e.hidden = !(n > Date.parse(e.getAttribute('data-founding-after') + 'T23:59:59Z')); });
  }
  function deal(){
    var d = document.getElementById('r3Deal'), P = window.LevlPremium, c = P && P.COURSES && P.COURSES[key];
    if(!d || !c || !c.rows || d.classList.contains('deal-v2')) return;
    var amt = d.querySelector('.plan--premium .plan__amt'), buy = d.querySelector('.plan--premium .btn-gold'),
        alt = d.querySelector('.plan--premium .plan__alt'), free = d.querySelector('.plan:not(.plan--premium) .btn-ghost'),
        cmp = d.querySelector('.plan__compare');
    var low = c.passes.reduce(function(a, b){ return b.price < a.price ? b : a; });
    var term = low.until ? 'Good through the exam' : 'One payment for ' + low.label.toLowerCase();
    var until = P.FOUNDING && P.FOUNDING.until;
    var note = (until ? '<span data-founding-until="' + until + '">Founding price, then $' + low.price + ' · </span>' : '') + term;
    d.classList.add('deal-v2');
    d.innerHTML = '<h2 class="deal-h">Free or <span>Premium</span></h2>' +
      '<div class="deal-t" role="table" aria-label="Free and Premium in ' + esc(c.name) + '">' +
        '<div class="r hd" role="row"><span role="columnheader"></span>' +
          '<span class="f" role="columnheader"><b>Free</b><small>$0</small></span>' +
          '<span class="p" role="columnheader"><b>Premium</b><small class="amt">' + (amt ? amt.innerHTML : '') + '</small><em>' + note + '</em></span></div>' +
        c.rows.map(function(r){ return '<div class="r" role="row"><span class="w" role="rowheader">' + esc(r[0]) + '</span><span class="f" role="cell">' + cell(r[1]) + '</span><span class="p" role="cell">' + cell(r[2]) + '</span></div>'; }).join('') +
        '<div class="r ft" role="row"><span role="cell"></span>' +
          '<span class="f" role="cell">' + (free ? '<a class="btn-ghost" href="' + free.getAttribute('href') + '">Start free</a>' : '') + '</span>' +
          '<span class="p" role="cell">' + (buy ? buy.outerHTML : '') + (alt ? alt.outerHTML : '') + '<small class="sure">7 day refund · never renews</small></span></div>' +
      '</div>' + (cmp ? '<p class="deal-more"><a href="' + cmp.getAttribute('href') + '">See every detail</a></p>' : '');
    founding(d);
  }
  if(window.LevlPremium) deal();
  else {
    var s = document.createElement('script');
    s.src = '../assets/premium.js';
    s.onload = deal;
    document.head.appendChild(s);
  }
})();
