/* "Practise this in —" : the link from a topic back to the tool that drills it.

   tools-registry.js has always declared, for each tool, which curriculum
   topics it belongs to. Nothing read the field. The result was a site where
   every tool offered a way back to the course and the course offered no way
   forward to the tools — so the Conformation Lab was reachable from the tools
   hub and from nowhere else, and a student who had just finished the ring-flip
   lesson, who is precisely the person it was built for, would never learn it
   existed.

   This reads the field. Given a topic id — which every lesson and every
   mechanism page already declares as CFG.topicId — it finds the tools that
   cover it and renders them. One function, called from the two places a
   student finishes something, so all fifty-eight lessons and ten mechanisms
   are covered without editing any of them.

   Silent when there is no tool for a topic, which is most of them. An empty
   box saying "no tools for this" is worse than no box. */
(function(){

  function esc(s){
    return String(s).replace(/[&<>"]/g, function(c){
      return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c];
    });
  }

  /* Every tool whose declared topics include this one. Order follows the
     registry so the list is stable rather than dependent on lookup order. */
  function forTopic(topicId){
    var T = window.OchemTools;
    if(!T || !T.ALL || !topicId) return [];
    return T.ALL.filter(function(tool){
      return [].concat(tool.topic || []).indexOf(topicId) >= 0;
    });
  }

  /* `base` is the path back to /ochem/ from the calling page — '../' from a
     lesson or a mechanism, '' from a page already at the root. Passed in
     rather than guessed from location.pathname, which breaks the moment the
     site is served from a subdirectory. */
  function html(topicId, base){
    var tools = forTopic(topicId);
    if(!tools.length) return '';
    base = base === undefined ? '' : base;

    return '<div class="tool-suggest">' +
      '<span class="tool-suggest__k">Now go play with it</span>' +
      '<div class="tool-suggest__row">' +
        tools.map(function(t){
          return '<a class="tool-suggest__link" href="' + esc(base) + 'tools/' + esc(t.slug) + '.html">' +
            '<svg viewBox="0 0 24 24" aria-hidden="true">' + t.icon + '</svg>' +
            esc(t.name) +
          '</a>';
        }).join('') +
      '</div>' +
    '</div>';
  }

  /* Convenience for a page that has a slot sitting empty. */
  function mount(el, topicId, base){
    if(!el) return;
    var markup = html(topicId, base);
    if(markup) el.innerHTML = markup;
  }

  window.OchemToolSuggest = { forTopic: forTopic, html: html, mount: mount };
})();
