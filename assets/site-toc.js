/* The "On this page" rail beside the long text pages (privacy, terms,
   sources, what's new), built from the page's own headings so it cannot
   drift from them: each <nav class="sp-toc"> lists the h2s of the .sp-prose
   next to it. With data-months (what's new) it lists months instead, and
   puts a month heading before each month's first entry. The rail is hidden
   on small screens by assets/site-pages.css. */
(function(){
  function slug(s){
    return s.toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'section';
  }
  function build(nav){
    var doc = nav.parentNode && nav.parentNode.querySelector('.sp-prose');
    if(!doc) return;
    var items = [];
    var heads = [].filter.call(doc.children, function(el){ return el.tagName === 'H2'; });
    if(nav.hasAttribute('data-months')){
      var seen = {};
      heads.forEach(function(h){
        var d = h.querySelector('.date');
        var m = d && /([A-Za-z]+) (\d{4})\s*$/.exec(d.textContent);
        if(!m) return;
        var id = 'm-' + m[2] + '-' + m[1].toLowerCase();
        if(seen[id]) return;
        seen[id] = 1;
        var p = document.createElement('p');
        p.className = 'sp-mon';
        p.id = id;
        p.appendChild(document.createTextNode(m[1] + ' '));
        var y = document.createElement('span');
        y.textContent = m[2];
        p.appendChild(y);
        h.parentNode.insertBefore(p, h);
        items.push([id, m[1] + ' ' + m[2]]);
      });
    } else {
      heads.forEach(function(h){
        if(!h.id){
          var base = slug(h.textContent), id = base, n = 2;
          while(document.getElementById(id)) id = base + '-' + (n++);
          h.id = id;
        }
        items.push([h.id, h.textContent.replace(/\s+/g, ' ').trim()]);
      });
    }
    if(items.length < (nav.hasAttribute('data-months') ? 2 : 3)){ nav.hidden = true; return; }
    var label = document.createElement('p');
    label.textContent = nav.getAttribute('data-label') || 'On this page';
    nav.appendChild(label);
    var links = {};
    items.forEach(function(it){
      var a = document.createElement('a');
      a.href = '#' + it[0];
      a.textContent = it[1];
      nav.appendChild(a);
      links[it[0]] = a;
    });
    if(!('IntersectionObserver' in window)) return;
    var current = null;
    function mark(id){
      if(current === id || !links[id]) return;
      if(current && links[current]) links[current].removeAttribute('aria-current');
      links[id].setAttribute('aria-current', 'true');
      current = id;
    }
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(e){ if(e.isIntersecting) mark(e.target.id); });
    }, { rootMargin: '0px 0px -70% 0px' });
    items.forEach(function(it){ var t = document.getElementById(it[0]); if(t) io.observe(t); });
  }
  function run(){ [].forEach.call(document.querySelectorAll('nav.sp-toc'), build); }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run);
  else run();
})();
