/* The "⋯" menu on reading pages (course redesign r4, decision 4): Share to Google Classroom, Copy link and Print
   in one overflow menu for secondary actions (NN/g), styles in assets/course/r3-reading.css (.lmore).

   Markup (scripts/lib/r3-reading.mjs moreMenu on notes and unit pages; assets/course/learn.js in the textbook):
     <div class="lmore"><button class="lmore-btn" aria-haspopup="menu" aria-expanded="false">
       <div class="lmore-menu" role="menu" hidden> ...the page's own controls, role="menuitem"... </div></div>
   The controls keep their own classes and data attributes, so the scripts that already wire them ([data-copy] and
   [data-print] in book.js or a course's nav script, NREMT's #copyBtn and #printBtn) still do. Controls marked
   data-lm-copy="<url>" or data-lm-print are wired here (the textbook's menu, which no other script knows).
   A share group drawn later by a page script (NREMT's chapter header: .bk-actions with Copy link and Print the
   book) is folded into a menu the same way when it appears.

   Keyboard: Enter or Space opens and focuses the first item; Up, Down, Home and End move; Escape closes and returns
   focus to the button; Tab or a click outside closes. Choosing an item closes the menu, except Copy link, which
   stays open so its "Link copied" can be read. */
(function(){
  if(window.__lmoreBound) return;
  window.__lmoreBound = true;
  var DOTS = '<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true" focusable="false"><circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/></svg>';

  function items(menu){ return [].slice.call(menu.querySelectorAll('[role="menuitem"]')).filter(function(x){ return !x.hidden && x.offsetParent !== null; }); }
  function parts(box){ return { btn: box.querySelector(':scope > .lmore-btn'), menu: box.querySelector(':scope > .lmore-menu') }; }
  function close(box, focus){
    var p = parts(box);
    if(!p.menu || p.menu.hidden) return;
    p.menu.hidden = true;
    p.btn.setAttribute('aria-expanded', 'false');
    box.classList.remove('open');
    var up = box.closest('.lmore-up');
    if(up) up.classList.remove('lmore-up');
    if(focus) p.btn.focus();
  }
  function closeAll(except){ [].forEach.call(document.querySelectorAll('.lmore.open'), function(b){ if(b !== except) close(b, false); }); }
  function open(box, at){
    var p = parts(box);
    closeAll(box);
    p.menu.hidden = false;
    p.btn.setAttribute('aria-expanded', 'true');
    box.classList.add('open');
    // The band over a notes page sits under the reading card: lift it while its menu is open.
    var top = box.closest('.r3-read-top, .r3-learn-top');
    if(top) top.classList.add('lmore-up');
    place(p);
    var list = items(p.menu);
    if(list.length) list[at === 'last' ? list.length - 1 : 0].focus();
  }

  /* The menu is placed against the viewport, under its button, so a band that clips its overflow (the cover
     band's glow) or the edge of a phone screen never cuts it off. Scrolling or resizing closes it. */
  function place(p){
    var r = p.btn.getBoundingClientRect(), m = p.menu, vw = document.documentElement.clientWidth;
    m.style.position = 'fixed';
    m.style.top = Math.round(r.bottom + 6) + 'px';
    m.style.right = 'auto';
    var w = m.offsetWidth, end = p.btn.parentNode.classList.contains('lmore-end') || p.btn.parentNode.classList.contains('lmore-folded');
    var left = end ? r.right - w : r.left;
    m.style.left = Math.round(Math.max(8, Math.min(left, vw - w - 8))) + 'px';
  }
  window.addEventListener('resize', function(){ closeAll(null); });
  window.addEventListener('scroll', function(){
    [].forEach.call(document.querySelectorAll('.lmore.open'), function(b){ var p = parts(b), r = p.btn.getBoundingClientRect(); if(r.bottom < 0 || r.top > window.innerHeight) close(b, false); else place(p); });
  }, { passive: true });

  /* A share group drawn by a page script becomes a menu (its controls move in, listeners and all). */
  var n = 0;
  function fold(group){
    var ctrls = [].slice.call(group.querySelectorAll('a,button'));
    if(!ctrls.length || !ctrls.some(function(c){ return /copy|print|classroom/i.test(c.textContent + ' ' + (c.getAttribute('href') || '')); })) return;
    var label = 'Share, copy link or print';
    var box = document.createElement('div');
    box.className = 'lmore lmore-folded';
    box.innerHTML = '<button type="button" class="lmore-btn" aria-haspopup="menu" aria-expanded="false" aria-label="' + label + '">' + DOTS + '</button><div class="lmore-menu" role="menu" aria-label="' + label + '" hidden></div>';
    var menu = box.lastChild;
    menu.id = 'lmore-' + (++n);
    box.firstChild.setAttribute('aria-controls', menu.id);
    ctrls.forEach(function(c){ c.setAttribute('role', 'menuitem'); c.classList.add('lmore-item'); menu.appendChild(c); });
    group.innerHTML = '';
    group.removeAttribute('role');
    group.classList.add('lmore-host');
    group.appendChild(box);
  }
  function scan(root){
    [].forEach.call((root || document).querySelectorAll('.lmore-menu:not([id])'), function(m){
      m.id = 'lmore-' + (++n);
      var b = m.parentNode.querySelector(':scope > .lmore-btn');
      if(b) b.setAttribute('aria-controls', m.id);
    });
    [].forEach.call((root || document).querySelectorAll('main .bk-actions:not(.lmore-host)'), function(g){ if(!g.closest('.lmore')) fold(g); });
  }

  function copy(el, url){
    var was = el.getAttribute('data-label') || el.textContent;
    el.setAttribute('data-label', was);
    var said = function(s){ el.textContent = s; setTimeout(function(){ el.textContent = was; }, 2500); };
    try{ navigator.clipboard.writeText(url).then(function(){ said('Link copied'); }, function(){ window.prompt('Copy this link:', url); }); }
    catch(x){ window.prompt('Copy this link:', url); }
  }

  document.addEventListener('click', function(e){
    var t = e.target && e.target.closest ? e.target : null;
    if(!t) return;
    var btn = t.closest('.lmore-btn');
    if(btn){
      var box = btn.parentNode;
      if(box.classList.contains('open')) close(box, false); else open(box);
      return;
    }
    var item = t.closest('.lmore [role="menuitem"]');
    if(item){
      var host = item.closest('.lmore');
      if(item.hasAttribute('data-lm-print')){ e.preventDefault(); close(host, true); window.print(); return; }
      if(item.hasAttribute('data-lm-copy')){ e.preventDefault(); copy(item, item.getAttribute('data-lm-copy') || location.href); return; }
      var isCopy = item.hasAttribute('data-copy') || item.id === 'copyBtn';
      if(!isCopy) setTimeout(function(){ close(host, false); }, 0);
      return;
    }
    closeAll(null);
  });

  document.addEventListener('keydown', function(e){
    var box = e.target && e.target.closest && e.target.closest('.lmore');
    if(!box) return;
    var p = parts(box), onBtn = e.target === p.btn;
    if(onBtn && (e.key === 'ArrowDown' || e.key === 'ArrowUp')){ e.preventDefault(); open(box, e.key === 'ArrowUp' ? 'last' : 'first'); return; }
    if(p.menu.hidden) return;
    if(e.key === 'Escape'){ e.preventDefault(); close(box, true); return; }
    if(e.key === 'Tab'){ close(box, false); return; }
    var list = items(p.menu), i = list.indexOf(document.activeElement);
    if(i < 0) return;
    var to = e.key === 'ArrowDown' ? (i + 1) % list.length : e.key === 'ArrowUp' ? (i - 1 + list.length) % list.length : e.key === 'Home' ? 0 : e.key === 'End' ? list.length - 1 : -1;
    if(to >= 0){ e.preventDefault(); list[to].focus(); }
    // Space on a link item works as it does on a button.
    if(e.key === ' ' && document.activeElement.tagName === 'A'){ e.preventDefault(); document.activeElement.click(); }
  });

  function start(){
    scan(document);
    var q = false;
    new MutationObserver(function(){ if(q) return; q = true; setTimeout(function(){ q = false; scan(document); }, 50); }).observe(document.body, { childList: true, subtree: true });
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
