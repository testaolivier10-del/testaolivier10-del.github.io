/* Carrying a structure from one tool to the next.

   Five of the seven tools let you draw your own molecule, and each one then
   treated it as private. Draw a structure in the Arrow Pusher, wonder what
   shape it actually is, and the only route to the 3D viewer was drawing it
   again from scratch — which nobody does, so the question goes unanswered and
   the seven tools stay seven islands rather than one workspace.

   Nothing new is needed to fix that. mol-builder.js already serializes a
   structure to a short text form, tool-state.js already puts a tool's setup in
   the URL, and two tools already read `?build=` on load. All that was missing
   was the other three reading it, and a control that offers the trip.

   So: `mountSend` puts a row of destinations under a builder, each one a plain
   link carrying the encoded structure, and `readIncoming` is what a tool calls
   to pick one up. Links rather than scripted navigation, because a link can be
   opened in a new tab, bookmarked, or sent to someone — which is the same
   reasoning that put tool state in the URL in the first place.

   Only tools that can actually do something with an arbitrary structure are
   offered. The Acid/Base Comparator needs a measured pKa and the Conformation
   Lab needs a specific bond to rotate; neither can take a structure off the
   street, and offering them would be offering a dead end. */
(function(){

  function esc(s){
    return String(s).replace(/[&<>"]/g, function(c){
      return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c];
    });
  }

  /* What each destination does with what you send it. Written as a promise
     about the destination rather than its name, because "Spectroscopy Lab" does
     not tell you why you would go there with this molecule in your hand. */
  var ACCEPTS = [
    { slug:'viewer-3d',          does:'see its real shape in 3D' },
    { slug:'arrow-pusher',       does:'push electrons on it' },
    { slug:'resonance',          does:'hunt for its resonance forms' },
    { slug:'spectroscopy',       does:'predict its ¹H NMR' },
    { slug:'reaction-predictor', does:'use it as a substrate' }
  ];

  function nameOf(slug){
    var T = window.OchemTools;
    var t = T && T.bySlug ? T.bySlug(slug) : null;
    return t ? t.name : slug;
  }

  /* mountSend(el, getStructure)

     `getStructure` returns the current structure, or null when there is
     nothing to send. Called on every refresh rather than captured once, so
     the links always carry what is on screen now. */
  function mountSend(el, getStructure){
    if(!el || !window.OchemBuilder) return null;

    function refresh(){
      var st = null;
      try{ st = getStructure(); }catch(e){ st = null; }
      if(!st){ el.innerHTML = ''; return; }

      var code;
      try{ code = window.OchemBuilder.encode(st); }catch(e){ code = null; }
      if(!code){ el.innerHTML = ''; return; }

      var here = window.OCHEM_TOOL || '';
      var targets = ACCEPTS.filter(function(t){ return t.slug !== here; });
      if(!targets.length){ el.innerHTML = ''; return; }

      el.className = 'tool-send';
      el.innerHTML =
        '<span class="tool-send__k">Take this molecule to</span>' +
        '<div class="tool-send__row">' +
          targets.map(function(t){
            return '<a class="tool-send__link" href="' + esc(t.slug) + '.html?build=' +
              encodeURIComponent(code) + '">' +
              '<b>' + esc(nameOf(t.slug)) + '</b>' +
              '<small>' + esc(t.does) + '</small>' +
            '</a>';
          }).join('') +
        '</div>';
    }

    refresh();
    return { refresh: refresh };
  }

  /* readIncoming(apply)

     Called by a tool on load. `apply` is handed the encoded text if the URL
     carries one; the tool decides what opening its builder means. Returns
     whether anything was delivered, so a tool can skip its own default setup
     rather than briefly showing one molecule and then another. */
  function readIncoming(apply){
    if(!window.OchemToolState || typeof apply !== 'function') return false;
    var built = window.OchemToolState.read().build;
    if(!built) return false;
    try{ apply(built); }catch(e){ return false; }
    return true;
  }

  /* decode(text) — the structure itself, for a tool that wants to act on it
     rather than hand it to a builder. Null when the text is not a structure,
     which is the only sensible answer for a hand-edited URL. */
  function decode(text){
    if(!window.OchemBuilder || !window.OchemBuilder.decode) return null;
    try{ return window.OchemBuilder.decode(text); }catch(e){ return null; }
  }

  window.OchemToolHandoff = {
    ACCEPTS: ACCEPTS,
    mountSend: mountSend,
    readIncoming: readIncoming,
    decode: decode
  };
})();
