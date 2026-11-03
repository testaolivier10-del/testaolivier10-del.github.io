/* Unit sheets, one sheet per lesson (owner 2026-11-03: "each lesson 1.1, 1.2 etc open to their own one page
   sheet"). Every AP® course's unit-sheet page (main.<x>-sheet with a .<x>-sheet-grid of topic sections) shows a
   plain list of its lessons instead of the whole grid. Clicking a lesson opens that lesson's sheet full screen,
   with Previous, Next, Print (that lesson only) and Close. Printing the page itself still prints every lesson
   (sheet-view.css). Loaded by assets/site-chrome.js on those pages only. */
(function(){
  var main = document.querySelector('main[class*="-sheet"]');
  var grid = main && main.querySelector('[class$="-sheet-grid"]');
  if(!grid || main.querySelector('.sv-list')) return;
  var secs = [].slice.call(grid.children).filter(function(s){ return s.querySelector('h2'); });
  if(!secs.length) return;
  function esc(s){ return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;'); }
  function parts(sec){
    var h = sec.querySelector('h2'), n = h.querySelector('span');
    var num = n ? n.textContent.trim() : '';
    return { num: num, title: h.textContent.replace(num, '').trim() };
  }

  var list = document.createElement('ul');
  list.className = 'sv-list';
  list.setAttribute('aria-label', 'Lesson sheets');
  list.innerHTML = secs.map(function(sec, i){
    var p = parts(sec);
    return '<li><button type="button" class="sv-item" data-i="' + i + '" aria-haspopup="dialog">' +
      '<span class="sv-paper" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></span>' +
      (p.num ? '<span class="sv-num">' + esc(p.num) + '</span>' : '') +
      '<span class="sv-title">' + esc(p.title) + '</span><span class="sv-go">Open <span aria-hidden="true">&rarr;</span></span></button></li>';
  }).join('');
  grid.parentNode.insertBefore(list, grid);
  grid.classList.add('sv-grid');

  var view = document.createElement('div');
  view.className = 'sv-view';
  view.setAttribute('role', 'dialog');
  view.setAttribute('aria-modal', 'true');
  view.hidden = true;
  view.innerHTML = '<div class="sv-bar"><b class="sv-head"></b><span class="sv-sp"></span>' +
    '<button type="button" class="sv-btn" data-sv="prev" aria-label="Previous lesson">&larr;</button>' +
    '<button type="button" class="sv-btn" data-sv="next" aria-label="Next lesson">&rarr;</button>' +
    '<button type="button" class="sv-btn" data-sv="print">Print</button>' +
    '<button type="button" class="sv-btn" data-sv="close">Close</button></div>' +
    '<div class="sv-scroll"><div class="sv-page"></div></div>';
  document.body.appendChild(view);
  var page = view.querySelector('.sv-page'), head = view.querySelector('.sv-head');
  var cur = -1, home = null, last = null;

  function put(i){
    if(cur > -1) home.parentNode.insertBefore(secs[cur], home), home.remove();
    cur = i;
    home = document.createComment('sv');
    secs[i].parentNode.insertBefore(home, secs[i]);
    page.appendChild(secs[i]);
    var p = parts(secs[i]);
    head.textContent = (p.num ? p.num + ' ' : '') + p.title;
    view.setAttribute('aria-label', head.textContent + ', lesson sheet');
    view.querySelector('[data-sv="prev"]').disabled = i === 0;
    view.querySelector('[data-sv="next"]').disabled = i === secs.length - 1;
    view.querySelector('.sv-scroll').scrollTop = 0;
  }
  function open(i){
    last = document.activeElement;
    put(i);
    view.hidden = false;
    document.documentElement.classList.add('sv-on');
    view.querySelector('[data-sv="close"]').focus();
  }
  function close(){
    if(cur > -1){ home.parentNode.insertBefore(secs[cur], home); home.remove(); cur = -1; }
    view.hidden = true;
    document.documentElement.classList.remove('sv-on');
    if(last && last.focus) last.focus();
  }
  list.addEventListener('click', function(e){ var b = e.target.closest('.sv-item'); if(b) open(+b.getAttribute('data-i')); });
  view.addEventListener('click', function(e){
    var b = e.target.closest('[data-sv]'), a = b && b.getAttribute('data-sv');
    if(a === 'close' || e.target === view) close();
    else if(a === 'prev' && cur > 0) put(cur - 1);
    else if(a === 'next' && cur < secs.length - 1) put(cur + 1);
    else if(a === 'print') window.print();
  });
  document.addEventListener('keydown', function(e){
    if(view.hidden) return;
    if(e.key === 'Escape') close();
    else if(e.key === 'ArrowLeft' && cur > 0) put(cur - 1);
    else if(e.key === 'ArrowRight' && cur < secs.length - 1) put(cur + 1);
  });
  var m = /[#&]sheet-(\d+)/.exec(location.hash);
  if(m && secs[+m[1] - 1]) open(+m[1] - 1);
})();
