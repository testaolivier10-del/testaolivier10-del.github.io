/* Tool state that survives a reload, and can be sent to someone.

   None of the seven tools stored anything. Reload the Reaction Predictor and
   your substrate, reagent and solvent were gone; there was no way to bookmark
   a setup, and no way for an instructor to post "compare THESE two acids" or
   for a student to send a friend the case that confused them. Every tool was a
   thing you arrived at empty.

   The fix is the URL, not storage. A URL is the thing people already know how
   to share, it survives a reload for free, and it keeps the tools honest about
   having no server: everything a link carries is in the link.

   Two halves. `write` keeps the address bar in step with what you are looking
   at, using replaceState so that setting up a comparison does not bury the
   back button under thirty history entries. `read` hands a tool its setup on
   load. Tools own their own key names; this only moves them.

   localStorage is deliberately not used. It is per-browser, invisible, and
   cannot be sent to anyone — and the one thing every one of these requests
   turned out to be about was sending it to someone. */
(function(){

  function read(){
    var out = {};
    try{
      var p = new URLSearchParams(window.location.search);
      p.forEach(function(v, k){ out[k] = v; });
    }catch(e){}
    return out;
  }

  function get(key, fallback){
    var v = read()[key];
    return v === undefined ? fallback : v;
  }

  /* Empty, null and undefined values are dropped rather than written as
     blanks, so a default setup gives a clean URL and only what has actually
     been chosen shows up in the link. */
  function write(obj){
    try{
      var p = new URLSearchParams();
      Object.keys(obj || {}).forEach(function(k){
        var v = obj[k];
        if(v === null || v === undefined || v === '' || v === false) return;
        p.set(k, v === true ? '1' : String(v));
      });
      var q = p.toString();
      window.history.replaceState(null, '',
        window.location.pathname + (q ? '?' + q : '') + window.location.hash);
    }catch(e){}
  }

  /* The share control, rendered into whatever slot the page offers. Copying is
     best-effort: the clipboard API needs a secure context and a user gesture,
     and where it is unavailable the input is selected instead so that the
     usual copy shortcut works. Nothing here should ever leave someone with a
     button that silently did nothing. */
  function mountShare(el, opts){
    if(!el) return null;
    opts = opts || {};
    el.innerHTML =
      '<button type="button" class="tchip tchip--ghost tool-share__btn" id="toolShareBtn">' +
        (opts.label || 'Copy link to this setup') +
      '</button>' +
      '<span class="tool-share__said" id="toolShareSaid" role="status" aria-live="polite"></span>';

    var btn = el.querySelector('#toolShareBtn');
    var said = el.querySelector('#toolShareSaid');

    btn.addEventListener('click', function(){
      var url = window.location.href;
      function done(msg){
        said.textContent = msg;
        setTimeout(function(){ said.textContent = ''; }, 4000);
      }
      if(navigator.clipboard && navigator.clipboard.writeText){
        navigator.clipboard.writeText(url).then(function(){
          done('Copied — that link reopens exactly this.');
        }, function(){ fallback(); });
      } else {
        fallback();
      }
      function fallback(){
        var box = document.createElement('input');
        box.className = 'tool-share__url';
        box.value = url;
        el.appendChild(box);
        box.select();
        done('Press ' + (navigator.platform.indexOf('Mac') >= 0 ? '⌘C' : 'Ctrl+C') + ' to copy.');
      }
    });
    return { said: said };
  }

  window.OchemToolState = { read: read, get: get, write: write, mountShare: mountShare };
})();
