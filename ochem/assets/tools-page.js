/* The tools hub. scripts/build-tool-pages.mjs writes every tool in
   tools-registry.js into tools.html as the shared tool card
   (assets/course/hub.js), so the list reads and links without JavaScript and
   matches every other course's hub. All this adds is the Premium pill on a
   Premium tool (ochem-premium.js), in the card's top row: a span, since the
   card is a link and cannot hold a button. */
(function(){
  var G = window.OchemPremium;
  var mount = document.getElementById('toolHub');
  if(!G || !mount) return;
  Array.prototype.forEach.call(mount.querySelectorAll('[data-tool]'), function(el){
    var slug = el.getAttribute('data-tool');
    if(G.toolFree(slug)) return;
    var pill = G.pill(), top = el.querySelector('.cx-tool-top');
    if(pill && top) top.insertAdjacentHTML('beforeend', pill);
  });
})();
