/* Shared chrome for a tool page.

   Above the tool: a way back to the hub, the tool's own name and one-line
   promise, and the share control, kept short so that on a phone the tool
   itself is on the first screen. Under it: the Keep going strip (lessons,
   glossary terms, Practice, the other tools), which build-tool-pages.mjs
   writes into the page from tools-registry.js, curriculum.js and the
   glossary. Rendering them from the registry rather than pasting them into
   eight files means a renamed tool is renamed everywhere.

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

  /* "Reaction Predictor" -> "Reaction predictor" (studio titles are sentence
     case); words with capitals inside (3D, SN2, Acid/Base) stay as they are. */
  function sentence(s){
    return String(s).split(' ').map(function(w, i){ return i && /^[A-Z][a-z]+$/.test(w) ? w.toLowerCase() : w; }).join(' ');
  }

  /* Same markup as topHtml() in build-tool-pages.mjs, which writes it into
     the page first; change both together. */
  mount.innerHTML =
    '<div class="tool-topbar">' +
      '<a class="tool-back" href="../tools.html">&larr; All tools</a>' +
      '<div class="tool-share" id="tool-share"></div>' +
    '</div>' +
    '<div class="tool-title">' +
      '<span class="tool-tile__mark"><svg viewBox="0 0 24 24" aria-hidden="true">' + tool.icon + '</svg></span>' +
      '<h1>' + esc(tool.name) + '</h1>' +
    '</div>' +
    '<p class="tool-lede">' + esc(tool.blurb) + '</p>';

  /* Premium tools (all but OchemPremium.FREE_TOOLS): a badge by the name,
     and once Premium launches, the gate in place of the tool for anyone
     without it. The tool's own script still runs underneath, unseen. */
  var G = window.OchemPremium, studio = null;

  /* Tool Studio (docs/tools-calm.md): a tool with `studio: true` in the
     registry gets the calm frame: slim top bar, stage + dock, Why / Details.
     The frame is built here; the tool's own script fills the stage and the
     dock through window.OchemStudio (see reaction-predictor.js). Keep going
     and Check yourself move into Details, the name and promise into About.
     Other tools are untouched until they set the flag. */
  if(tool.studio && window.LevlStudio){
    mount.parentNode.classList.add('ls-host');
    var about = document.createElement('div');
    about.className = 'ls-sec';
    about.innerHTML = '<p>' + esc(tool.blurb) + '</p><p class="ls-sub">' + esc(tool.tagline) + '</p>';
    var paid = G && !G.toolFree(slug);
    studio = window.LevlStudio.mount({
      title: sentence(tool.name), course: 'Organic Chemistry', back: '../tools.html', home: '../', slug: 'ochem-' + slug,
      host: mount,
      menu: {
        copyLink: true,
        report: { course: 'ochem', id: 'tool:' + slug },
        note: paid ? { label: 'Premium tool.', html: 'Part of Organic Chemistry Premium.' } : null
      },
      about: about,
      details: [document.getElementById('tool-quiz'), document.getElementById('tool-foot')]
    });
    if(!document.querySelector('main')) studio.root.setAttribute('role', 'main');
    // The tool's drawings are styled under .tool-root (tools.css).
    studio.root.classList.add('tool-root');
    /* The site footer now lives at the end of About, inside the main
       landmark, where a <footer> no longer means the page's contentinfo (and
       check-a11y flags a footer inside main). Same links, same text, as a
       plain group. Shared layer request filed. */
    [].slice.call(studio.root.querySelectorAll('footer')).forEach(function(f){
      var d = document.createElement('div');
      d.className = (f.className ? f.className + ' ' : '') + 'ls-foot-c';
      d.setAttribute('role', 'group'); d.setAttribute('aria-label', 'Site links');
      while(f.firstChild) d.appendChild(f.firstChild);
      f.parentNode.replaceChild(d, f);
    });

    /* Focus trap in the phone sheet, for content the shared trap misreads:
       controls inside a closed <details> count as visible there (Chrome keeps
       their boxes), so Tab from the last real control left the sheet. This
       runs first and wraps at the true ends. Shared layer request filed. */
    (function(){
      var sheet = studio.root.querySelector('.ls-sheet');
      if(!sheet) return;
      sheet.addEventListener('keydown', function(e){
        if(e.key !== 'Tab' || sheet.getAttribute('aria-modal') !== 'true') return;
        var f = [].filter.call(sheet.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea, summary, [tabindex]:not([tabindex="-1"])'), function(el){
          if(el.offsetParent === null && el !== document.activeElement) return false;
          var d = el.parentNode && el.parentNode.closest ? el.parentNode.closest('details:not([open])') : null;
          return !(d && !(el.tagName === 'SUMMARY' && el.parentNode === d));
        });
        if(!f.length) return;
        var first = f[0], last = f[f.length - 1];
        if(e.shiftKey && document.activeElement === first){ e.preventDefault(); e.stopPropagation(); last.focus(); }
        else if(!e.shiftKey && document.activeElement === last){ e.preventDefault(); e.stopPropagation(); first.focus(); }
      }, true);
    })();
    window.OchemStudio = studio;
  }

  /* Small helpers the ochem tools share when they arrange themselves in the
     studio (each tool's "Tool Studio" block uses them).
       seg(seg, attr)    adopt the tool's own .tseg as the mode switch; its
                         buttons' [attr] values are the mode names, and a
                         click switches the studio's mode-only parts. Returns
                         a function giving the mode now showing.
       builder(box)      a mounted molecule builder made calm: the type row
                         and its quick picks first, the canvas, palette and
                         atom tools behind "Draw it yourself".
       scrollChips(el)   every .tchips row inside el becomes one scrolling
                         row on a phone; group labels become .ls-lbl. */
  window.OchemStudioKit = {
    seg: function(seg, attr){
      if(!studio || !seg) return function(){ return null; };
      function now(){ var b = seg.querySelector('button.on') || seg.querySelector('button'); return b ? b.getAttribute(attr) : null; }
      seg.classList.add('ls-seg');
      studio.modes({ el: seg, value: now() });
      seg.addEventListener('click', function(e){
        if(e.target.closest('button')) studio.mode(now());
      });
      return now;
    },
    builder: function(box){
      var mb = box && box.querySelector('.mb');
      if(!mb || mb.getAttribute('data-ls')) return;
      mb.setAttribute('data-ls', '1');
      var d = document.createElement('details');
      d.className = 'tool-more mb-ls-draw';
      d.innerHTML = '<summary>Draw it yourself</summary>';
      ['.mb__canvaswrap', '.mb__tools'].forEach(function(s){ var e = mb.querySelector(s); if(e) d.appendChild(e); });
      // The checker's report goes in there too; a structure it cannot read
      // opens the drawer, so the reason is never hidden.
      var st = mb.querySelector('.mb__status');
      mb.appendChild(d);
      if(st){
        d.appendChild(st);
        if(window.MutationObserver) new MutationObserver(function(){ if(st.querySelector('.tnote--bad')) d.open = true; }).observe(st, { childList: true, subtree: true });
      }
      var q = mb.querySelector('.mb__quick'); if(q) q.classList.add('ls-scroll');
    },
    scrollChips: function(el){
      if(!el) return;
      el.querySelectorAll('.tchips').forEach(function(c){ c.classList.add('ls-scroll'); });
      el.querySelectorAll('.ap-group__label').forEach(function(l){ l.classList.add('ls-lbl'); });
    }
  };

  if(G && !G.toolFree(slug) && studio){
    // The gate replaces the whole studio and gives the page its chrome back.
    G.lock({
      feature: 'tool', source: 'tool-' + slug,
      hide: [studio.root].concat([].slice.call(mount.parentNode.children).filter(function(el){ return el !== mount && el !== studio.root; })),
      after: mount,
      notes: '../learn.html', notesText: 'Read the free textbook',
      locked: function(){ var on = G.locked(); studio.suspend(on); return on; },
      badgeIn: mount.querySelector('h1'),
      badge: G.badge()
    });
  } else if(G && !G.toolFree(slug)){
    var top = mount;
    G.lock({
      feature: 'tool', source: 'tool-' + slug,
      hide: [].slice.call(top.parentNode.children).filter(function(el){ return el !== top; }),
      after: top,
      notes: '../learn.html', notesText: 'Read the free textbook',
      locked: function(){ return G.locked(); },
      badgeIn: top.querySelector('.eyebrow') || top.querySelector('h1'),
      badge: G.badge()
    });
  }

  /* Every tool can be linked to in the state you left it in, so the control
     is part of the shared chrome rather than something each tool remembers to
     add. Tools that keep nothing in the URL still get a working link to
     themselves, which is the honest floor. */
  if(window.OchemToolState){
    window.OchemToolState.mountShare(document.getElementById('tool-share'));
  }

  /* The Keep going strip (#tool-foot) is static markup from
     build-tool-pages.mjs, so it reads and links without JavaScript;
     tool-quiz.js points each answered question at its own lesson and term
     from the same links. */

  /* After a pick from a list that sits ABOVE or BELOW the work area, a phone may show no change
     at all because the work area is off-screen. showWork(el) brings it into view when it is not
     already mostly visible; on a wide screen it does nothing. */
  window.OchemShowWork = function(el){
    if(!el || window.innerWidth >= 900) return;
    var r = el.getBoundingClientRect(), vh = window.innerHeight;
    if(r.top >= 60 && r.top < vh * 0.55) return;
    var reduce = false; try{ reduce = matchMedia('(prefers-reduced-motion: reduce)').matches; }catch(e){}
    var head = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--site-header-h')) || 64;
    window.scrollTo({ top: window.scrollY + r.top - head - 8, behavior: reduce ? 'auto' : 'smooth' });
  };
})();
