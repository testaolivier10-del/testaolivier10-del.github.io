/* The tools hub: every tool as a card, each one a link into the tool itself.

   This file used to BE a tool — the ungraded molecule sandbox lived here, and
   tools.html was that sandbox plus a list of six things that did not exist
   yet. Now the sandbox is one tool among seven at tools/arrow-pusher.html and
   this page's whole job is to get you into the right one, so what is left is
   a renderer over tools-registry.js.

   Kept out of an inline <script> for the same reason as learn-page.js: the CI
   link-checker scans raw HTML for href="..." and would read the generated
   markup below as a set of broken links. */
(function(){
  var T = window.OchemTools;
  var mount = document.getElementById('toolHub');
  if(!T || !mount) return;

  function esc(s){
    return String(s).replace(/[&<>"]/g, function(c){
      return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c];
    });
  }

  mount.innerHTML = T.ALL.map(function(t){
    return '<a class="tool-tile" href="tools/' + esc(t.slug) + '.html">' +
      '<span class="tool-tile__mark"><svg viewBox="0 0 24 24" aria-hidden="true">' + t.icon + '</svg></span>' +
      '<span class="tool-tile__name">' + esc(t.name) + '</span>' +
      '<span class="tool-tile__tag">' + esc(t.tagline) + '</span>' +
      '<span class="tool-tile__blurb">' + esc(t.blurb) + '</span>' +
      '<span class="tool-tile__foot">' +
        '<span>' + esc(t.teaches) + '</span>' +
        '<span class="tool-tile__go">Open &rarr;</span>' +
      '</span>' +
    '</a>';
  }).join('');
})();
