/* Unit sheets open on click (owner 2026-11-03: "dont make the entire one page sheet viewable right on the page,
   just make it so you can click it and it will open"). Every AP® course's unit-sheet page (main.<x>-sheet with a
   .<x>-sheet-grid) shows a small paper card instead: the sheet's title and its topics. Open shows the whole
   sheet full screen, with Print and Close. Printing the page still prints the full sheet (sheet-view.css).
   Loaded by assets/site-chrome.js on those pages only. */
(function(){
  var main = document.querySelector('main[class*="-sheet"]');
  var grid = main && main.querySelector('[class$="-sheet-grid"]');
  if(!grid || main.querySelector('.sv-card')) return;
  var h1 = main.querySelector('h1');
  var title = h1 ? h1.textContent.replace(/:\s*the one-page sheet\s*$/i, '') : 'Unit sheet';
  var topics = [].map.call(grid.querySelectorAll('h2'), function(h){ return h.textContent.trim(); });
  function esc(s){ return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;'); }

  var card = document.createElement('button');
  card.type = 'button';
  card.className = 'sv-card';
  card.setAttribute('aria-haspopup', 'dialog');
  card.innerHTML = '<span class="sv-paper" aria-hidden="true">' + topics.slice(0, 7).map(function(){ return '<i></i>'; }).join('') + '</span>' +
    '<span class="sv-body"><b>The one-page sheet</b><small>' + topics.length + ' topic' + (topics.length === 1 ? '' : 's') + ', prints on one page</small>' +
    '<span class="sv-list">' + topics.map(function(t){ return '<span>' + esc(t) + '</span>'; }).join('') + '</span>' +
    '<span class="sv-open">Open the sheet <span aria-hidden="true">&rarr;</span></span></span>';
  grid.parentNode.insertBefore(card, grid);
  grid.classList.add('sv-grid');

  var view = document.createElement('div');
  view.className = 'sv-view';
  view.setAttribute('role', 'dialog');
  view.setAttribute('aria-modal', 'true');
  view.setAttribute('aria-label', title + ', unit sheet');
  view.hidden = true;
  view.innerHTML = '<div class="sv-bar"><b>' + esc(title) + '</b><span class="sv-sp"></span>' +
    '<button type="button" class="sv-btn" data-sv="print">Print</button>' +
    '<button type="button" class="sv-btn sv-x" data-sv="close" aria-label="Close the sheet">Close</button></div>' +
    '<div class="sv-scroll"><div class="sv-page"></div></div>';
  document.body.appendChild(view);
  var page = view.querySelector('.sv-page'), last = null;

  function open(){
    last = document.activeElement;
    page.appendChild(grid);
    view.hidden = false;
    document.documentElement.classList.add('sv-on');
    view.querySelector('[data-sv="close"]').focus();
  }
  function close(){
    view.hidden = true;
    document.documentElement.classList.remove('sv-on');
    card.parentNode.insertBefore(grid, card.nextSibling);
    if(last && last.focus) last.focus();
  }
  card.addEventListener('click', open);
  view.addEventListener('click', function(e){
    var b = e.target.closest('[data-sv]');
    if(b && b.getAttribute('data-sv') === 'close') close();
    else if(b && b.getAttribute('data-sv') === 'print') window.print();
    else if(e.target === view) close();
  });
  document.addEventListener('keydown', function(e){ if(e.key === 'Escape' && !view.hidden) close(); });
  if(/[#&]sheet\b/.test(location.hash)) open();
})();
