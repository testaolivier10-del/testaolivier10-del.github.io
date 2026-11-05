/* AP® courses: each unit's share of the exam on the Learn page (owner, 2026-11-05: unit weights matter for AP
   classes). The weights come from the course home's contents list, so there is one copy of them. Design preview;
   moves into the Learn builder once approved. */
(function(){
  var W = null;
  function add(){
    if(!W) return;
    [].forEach.call(document.querySelectorAll('.tb-chapter-head'), function(h){
      if(h.querySelector('.tb-weight')) return;
      var eb = h.querySelector('.tb-chapter-eyebrow'), meta = h.querySelector('.tb-chapter-meta');
      var m = eb && /Unit\s+(\d+)/.exec(eb.textContent);
      var w = m && W[String(+m[1])];
      if(w && meta) meta.insertAdjacentHTML('beforeend', '<span class="tb-weight">' + w + ' of the exam</span>');
    });
  }
  fetch('index.html').then(function(r){ return r.text(); }).then(function(t){
    var doc = new DOMParser().parseFromString(t, 'text/html');
    W = {};
    [].forEach.call(doc.querySelectorAll('.toc li'), function(li){
      var n = li.querySelector('.n'), w = li.querySelector('.w');
      if(!n || !w || w.classList.contains('txt') || !/^\d+$/.test(n.textContent.trim())) return;
      var v = (w.firstChild && w.firstChild.nodeType === 3 ? w.firstChild.textContent : '').trim();
      if(/%$/.test(v)) W[String(+n.textContent.trim())] = v;
    });
    add();
    if(window.MutationObserver) new MutationObserver(add).observe(document.getElementById('main') || document.body, { childList: true, subtree: true });
  }).catch(function(){});
})();
