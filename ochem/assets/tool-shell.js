/* Shared chrome for a tool page.

   Every tool page is the same three things above the tool itself — a way back
   to the hub, the tool's own name and one-line promise, and a row that
   switches to any other tool without going back to the hub first. Rendering
   them from tools-registry.js rather than pasting them into seven files means
   a renamed tool is renamed everywhere, and a new tool appears in all six
   other switchers the moment it is added to the list.

   The page sets window.OCHEM_TOOL to its slug; everything else is looked up. */
(function(){
  var T = window.OchemTools;
  var mount = document.getElementById('tool-top');
  if(!T || !mount) return;

  var slug = window.OCHEM_TOOL || '';
  var tool = T.bySlug(slug);
  if(!tool) return;

  function esc(s){
    return String(s).replace(/[&<>"]/g, function(c){
      return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c];
    });
  }

  mount.innerHTML =
    '<a class="tool-back" href="../tools.html">&larr; All tools</a>' +
    '<div class="tool-title">' +
      '<span class="tool-tile__mark"><svg viewBox="0 0 24 24" aria-hidden="true">' + tool.icon + '</svg></span>' +
      '<h1>' + esc(tool.name) + '</h1>' +
    '</div>' +
    '<p class="tool-lede">' + esc(tool.blurb) + '</p>' +
    '<div class="tool-share" id="tool-share"></div>' +
    '<nav class="tool-switch" aria-label="Other tools">' +
      T.ALL.map(function(t){
        return '<a href="' + esc(t.slug) + '.html"' + (t.slug === slug ? ' class="on" aria-current="page"' : '') +
               '>' + esc(t.name) + '</a>';
      }).join('') +
    '</nav>';

  /* Every tool can be linked to in the state you left it in, so the control
     is part of the shared chrome rather than something each tool remembers to
     add. Tools that keep nothing in the URL still get a working link to
     themselves, which is the honest floor. */
  if(window.OchemToolState){
    window.OchemToolState.mountShare(document.getElementById('tool-share'));
  }

  /* The tool is not the end of the road: each one has a lesson behind it, and
     a student who has just watched an octet blow up is exactly the person who
     should be offered the lesson that explains why. Rendered only where the
     page leaves a slot for it. */
  var foot = document.getElementById('tool-foot');
  if(foot){
    foot.className = 'tool-foot';
    foot.innerHTML =
      '<p>Tools are for playing with. When you want the same chemistry with a right answer attached, ' +
      'that is what Practice is for.</p>' +
      '<div class="trow">' +
        '<a class="btn-press" href="../practice.html">Go to Practice</a>' +
        '<a class="link-quiet" href="../learn.html">Browse the textbook &rarr;</a>' +
      '</div>';
  }
})();
