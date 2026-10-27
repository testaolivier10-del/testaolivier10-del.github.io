/* Video cards in the course readers (each course's learn.html and nremt/study-notes.html).
   The reader draws its chapters with JavaScript, so the page carries its cards as inline JSON
   (id="lpv-reader", written by scripts/lib/videos.mjs, kept current by scripts/build-videos.mjs):
   [{ id, at: "<selector of the chapter or topic header>", html: "<the click-to-load card>" }].
   Whenever the reader draws, each card goes in right after its header, once. The card is the same
   facade as on notes pages: nothing loads from YouTube until play is pressed (video.js). */
(function(){
  var el = document.getElementById('lpv-reader');
  if(!el) return;
  var cards;
  try { cards = JSON.parse(el.textContent); } catch(e){ return; }
  if(!cards || !cards.length) return;
  var loaded = false;
  function assets(){
    if(loaded) return; loaded = true;
    if(!document.querySelector('link[href="/assets/video/video.css"]')){
      var l = document.createElement('link'); l.rel = 'stylesheet'; l.href = '/assets/video/video.css';
      document.head.appendChild(l);
    }
    if(!document.querySelector('script[src="/assets/video/video.js"]')){
      var s = document.createElement('script'); s.src = '/assets/video/video.js'; s.defer = true;
      document.head.appendChild(s);
    }
  }
  function place(){
    cards.forEach(function(c){
      var heads = document.querySelectorAll(c.at);
      for(var i = 0; i < heads.length; i++){
        var h = heads[i], next = h.nextElementSibling;
        if(h.closest('.print-chapter')) continue;
        if(next && next.getAttribute('data-video') === c.id) continue;
        var box = document.createElement('div');
        box.innerHTML = c.html;
        var card = box.firstElementChild;
        if(!card) continue;
        assets();
        h.parentNode.insertBefore(card, h.nextSibling);
      }
    });
  }
  var t;
  function soon(){ clearTimeout(t); t = setTimeout(place, 30); }
  function start(){ place(); new MutationObserver(soon).observe(document.body, { childList: true, subtree: true }); }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
