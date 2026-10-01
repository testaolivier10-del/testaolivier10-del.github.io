/* ochem/glossary.html: renders every definition from assets/glossary.json
   (the file the notes popups already use, so it is fetched once for the whole
   course) into the letter sections the page ships with, then filters them by
   what you type and by chapter. Without this script the page still lists
   every term, each linking to the section that teaches it.
   Generated page, hand-written script: see scripts/build-ochem-glossary.mjs. */
(function(){
  function esc(s){ return String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

  function start(){
    var list = document.getElementById('oglList');
    var input = document.getElementById('oglFilter');
    var chapter = document.getElementById('oglChapter');
    var count = document.getElementById('oglCount');
    var none = document.getElementById('oglNone');
    if(!list || !input || !chapter) return;

    fetch('assets/glossary.json')
      .then(function(r){ if(!r.ok) throw new Error(r.status); return r.json(); })
      .then(function(data){ render(data); })
      .catch(function(){ /* the static name list stays; it is already useful */ });

    var rows = [];
    function render(data){
      var byId = {}, byName = {};
      data.terms.forEach(function(t){ byId[t.id] = t; byName[t.term] = t; });
      list.querySelectorAll('.ogl-letter').forEach(function(section){
        var names = section.querySelector('.ogl-names');
        if(!names) return;
        var html = '';
        // Each letter gets the terms the generator listed under it, in its
        // order, so the alphabetizing rules live in one place.
        var terms = [];
        names.querySelectorAll('li').forEach(function(li){
          var t = byName[li.textContent];
          if(t) terms.push(t);
        });
        terms.forEach(function(t){
          var tp = data.topics[t.topic] || ['', ''];
          var see = (t.see || []).map(function(id){
            return byId[id] ? '<a href="#g-' + id + '">' + esc(byId[id].term) + '</a>' : '';
          }).filter(Boolean);
          html += '<div class="ogl-t" id="g-' + t.id + '" data-ch="' + tp[1] + '"><dt>' + esc(t.term) + '</dt><dd>' + esc(t.def) +
            ' <span class="ogl-src">Taught in <a href="notes/' + t.topic + '.html">' + esc(tp[0]) + '</a> (ch.&nbsp;' + tp[1] + ').</span>' +
            (see.length ? '<span class="ogl-see">See also ' + see.join(', ') + '.</span>' : '') + '</dd></div>';
        });
        var dl = document.createElement('dl');
        dl.innerHTML = html;
        names.replaceWith(dl);
        Array.prototype.forEach.call(dl.children, function(el, i){
          var t = terms[i];
          rows.push({ el: el, section: section, ch: el.getAttribute('data-ch'), keys: [t.term].concat(t.aka || []).join('|').toLowerCase() });
        });
      });
      // A deep link (#g-enolate) can only land once the entry exists.
      if(location.hash.indexOf('#g-') === 0){
        var target = document.getElementById(location.hash.slice(1));
        if(target) target.scrollIntoView();
      }
      var q = new URLSearchParams(location.search).get('q');
      if(q){ input.value = q; }
      apply();
    }

    function apply(){
      if(!rows.length) return;
      var q = input.value.trim().toLowerCase();
      var ch = chapter.value;
      var shown = 0;
      rows.forEach(function(r){
        // Match at the start of a word, so "enol" finds enolate but not phenol.
        var at = q ? r.keys.indexOf(q) : 0, word = !q;
        while(!word && at !== -1){
          word = at === 0 || /[\s|\-,(\/]/.test(r.keys.charAt(at - 1));
          at = r.keys.indexOf(q, at + 1);
        }
        var hit = word && (!ch || r.ch === ch);
        r.el.hidden = !hit;
        if(hit) shown++;
      });
      document.querySelectorAll('.ogl-letter').forEach(function(s){
        var any = !!s.querySelector('.ogl-t:not([hidden])');
        s.hidden = !any;
        var link = document.querySelector('.ogl-letters a[href="#' + s.id + '"]');
        if(link) link.classList.toggle('is-empty', !any);
      });
      if(none) none.hidden = shown !== 0;
      if(count) count.textContent = (q || ch) ? shown + ' of ' + rows.length + ' terms' : rows.length + ' terms';
    }

    input.addEventListener('input', apply);
    chapter.addEventListener('change', apply);
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
