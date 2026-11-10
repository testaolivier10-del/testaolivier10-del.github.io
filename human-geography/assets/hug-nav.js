/* AP® Human Geography course nav: declares the course's section (the five tabs live in
   site-chrome.js courseTabs) and hands the rest to the shared site chrome
   (assets/site-chrome.js). Each page sets window.ApHugSection and
   window.ApHugBase (the path back to human-geography/). Also wires [data-print] and
   [data-copy] (Copy link) buttons without an inline handler, and Enlarge on
   figures (.hug-figimg [data-zoom], or a tap on a drawing shown smaller than
   its own width): a full-screen dialog with the drawing at its own width, so
   its words are their authored size; scroll or pinch to move, Close or Esc. */
(function(){
  var base = window.ApHugBase || '';
  var section = window.ApHugSection || '';
  // The five course tabs (docs/course-redesign-r4.md decision 1); site-chrome.js maps the section to its tab.
  try{
    if(window.LevlChrome){
      window.LevlChrome.registerServiceWorker();
      window.LevlChrome.render({
        subject: 'aphug',
        course: 'AP® Human Geography',
        courseShort: 'Human Geography',
        courseHref: base + 'index.html',
        progressHref: base + 'dashboard.html',
        items: window.LevlChrome.courseTabs(base, section)
      });
    }
  }catch(e){}
  var zoomed = null;
  function closeZoom(){
    if(!zoomed) return;
    var z = zoomed; zoomed = null;
    z.el.remove(); document.documentElement.classList.remove('hug-zoom-open');
    document.removeEventListener('keydown', z.key, true);
    try{ z.back.focus(); }catch(x){}
  }
  function openZoom(img, back){
    closeZoom();
    var w = +img.getAttribute('width') || img.naturalWidth || 720;
    var d = document.createElement('div');
    d.className = 'hug-zoom'; d.setAttribute('role', 'dialog'); d.setAttribute('aria-modal', 'true'); d.setAttribute('aria-label', 'Figure, full size');
    d.innerHTML = '<div class="hug-zoom-bar"><p class="hug-zoom-t">Scroll or pinch to move around the figure.</p><button type="button" class="btn-press sm hug-zoom-x">Close</button></div><div class="hug-zoom-body" tabindex="0"><div class="hug-figimg"><img alt=""></div></div>';
    var im = d.querySelector('img');
    im.src = img.currentSrc || img.src; im.alt = img.alt || ''; im.style.width = Math.max(w, 320) + 'px';
    document.body.appendChild(d); document.documentElement.classList.add('hug-zoom-open');
    var x = d.querySelector('.hug-zoom-x');
    x.addEventListener('click', closeZoom);
    var key = function(e){
      if(e.key === 'Escape'){ e.preventDefault(); closeZoom(); }
      else if(e.key === 'Tab'){ var f = [x, d.querySelector('.hug-zoom-body')], i = f.indexOf(document.activeElement); e.preventDefault(); f[(i + (e.shiftKey ? f.length - 1 : 1)) % f.length].focus(); }
    };
    document.addEventListener('keydown', key, true);
    zoomed = { el: d, key: key, back: back || img };
    x.focus();
  }
  document.addEventListener('click', function(e){
    var t = e.target && e.target.closest ? e.target : null;
    var zb = t && t.closest('[data-zoom]');
    if(zb){ var zi = zb.closest('.hug-figimg'); zi = zi && zi.querySelector('img'); if(zi){ e.preventDefault(); openZoom(zi, zb); } return; }
    // A tap on a drawing shown at under 85% of its own width (not a labeled
    // figure: there a tap reveals a hidden label).
    var pic = t && t.tagName === 'IMG' && t.closest('.hug-figimg:not(.has-masks)');
    if(pic && !t.closest('.hug-zoom') && pic.querySelector('[data-zoom]')){
      var nat = +t.getAttribute('width') || t.naturalWidth;
      if(nat && t.clientWidth < 0.85 * nat){ e.preventDefault(); openZoom(t, pic.querySelector('[data-zoom]')); return; }
    }
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
