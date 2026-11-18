/* NREMT's side of the Tool Studio (docs/tools-calm.md; API at the top of
   ../../assets/course/tool-studio.js). One call per tool page:

     var s = NremtStudio.mount({ title, slug, stage, dock, why, details, modes, caption, hint, about });

   It mounts the calm frame in place of the page's .wrap (the slim bar's back
   arrow goes to tools.html, the menu has Copy link, About, Report a problem,
   Ask the tutor, Course home, All tools), moves the page-head's promise into
   About and the page footer to the end of About, and hides what is left of
   .wrap (the old title card). Each page then moves its own parts with s.add,
   so its element references, listeners and deep links keep working.

   Since F2 (docs/tools-frame-2026-11.md) mount() opts into the standard frame (std: true): the page head's lede,
   or o.lede, is the one line under the name; the modes sit in the bar; "?" opens the second tab. Each page
   sets its task, picker and finished card itself.

   NremtStudio.slim(opts) is the reference-page version: the same slim top bar
   over the page's own content, which keeps scrolling as a normal page (for
   long cheat sheets, where a stage and dock would hide the information).

   Without tool-studio.js (or with ?studio=0) both return null and the page
   stays as it was. */
(function(){
  'use strict';
  function off(){ try{ return /[?&]studio=0\b/.test(location.search); }catch(e){ return false; } }
  function list(x){ if(!x) return []; if(x.nodeType) return [x]; return Array.prototype.slice.call(x).filter(Boolean); }

  /* The page footer: still in .wrap, or already lifted by site-chrome.js
     into the .wrap right after it (contentinfo must not sit inside main). */
  function footer(wrap){
    if(!wrap) return null;
    var f = wrap.querySelector(':scope > footer');
    if(f) return f;
    var n = wrap.nextElementSibling;
    return n && (n.classList.contains('wrap') || n.classList.contains('xshell')) && n.querySelector(':scope > footer') ? n : null;
  }
  /* The page's content wrapper: .wrap, or .xshell on the newer pages (not
     the breadcrumb row, which is an .xshell too). */
  function shell(){ return document.querySelector('body > .wrap, body > .xshell:not([data-crumb])'); }

  function mount(o){
    if(!window.LevlStudio || off()) return null;
    var wrap = shell();
    var foot = footer(wrap);
    var head = wrap && wrap.querySelector(':scope > .page-head');
    var about = document.createElement('div');
    about.className = 'ls-sec';
    var lede = head && head.querySelector('.lede');
    if(o.about) list(o.about).forEach(function(el){ about.appendChild(el); });
    else if(lede) about.appendChild(lede);
    var opts = {};
    for(var k in o) opts[k] = o[k];
    /* The standard frame (docs/tools-frame-2026-11.md, F2): name and one line in the bar, the modes there too,
       Share and "?" (the second tab: reference and settings). o.std === false keeps the calm frame. */
    if(o.std !== false){
      opts.std = true;
      if(!opts.lede && lede) opts.lede = lede.textContent.replace(/\s+/g, ' ').trim();
    }
    opts.course = 'NREMT-EMT';
    opts.back = opts.back || 'tools.html';
    opts.home = opts.home || 'index.html';
    opts.slug = 'nremt-' + o.slug;
    opts.host = wrap || undefined;
    opts.footer = foot ? [foot] : [];
    opts.about = about.children.length ? about : null;
    opts.use = true; // counted as a tool though it is not in a tools/ folder (tool-studio.js, watchUse)
    opts.menu = o.menu || { copyLink: true, report: { course: 'nremt', id: 'tool:' + o.slug }, note: o.note || null };
    var s = window.LevlStudio.mount(opts);
    s.root.classList.add('nx-ls', 'nx-' + o.slug);
    // site-chrome.js made .wrap the main landmark and the skip link's target;
    // the studio is the content now.
    if(wrap && wrap.id === 'levl-main'){ wrap.removeAttribute('id'); s.root.id = 'levl-main'; s.root.setAttribute('data-skip-target', ''); s.root.setAttribute('tabindex', '-1'); }
    if(wrap) wrap.removeAttribute('role');
    if(!document.querySelector('main, [role="main"]')) s.root.setAttribute('role', 'main');
    if(wrap) wrap.hidden = true;
    return s;
  }

  /* Reference pages: the slim bar only, over the page's own scrolling
     content, with calmer type (nremt-studio.css, .nx-slim). The page-head
     card goes; its promise stays as one line under the bar. */
  function slim(o){
    if(off()) return null;
    o = o || {};
    var wrap = shell();
    if(!wrap) return null;
    document.body.classList.add('nx-slim-on');
    var bar = document.createElement('header');
    bar.className = 'nx-slim-bar';
    var title = o.title || document.title;
    bar.innerHTML = '<a class="nx-slim-back" href="' + (o.back || 'tools.html') + '" aria-label="' + (o.backLabel || 'Back to all tools') + '">' +
      '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M15 5l-7 7 7 7"/></svg></a>' +
      '<h1 class="nx-slim-title"></h1><span class="nx-slim-sp"></span>' +
      '<button type="button" class="nx-slim-home nx-slim-tutor">Ask the tutor</button>' +
      '<a class="nx-slim-home" href="index.html">Course home</a>';
    bar.querySelector('.nx-slim-title').textContent = title;
    // The tutor's floating button is hidden on these pages (nothing floats
    // over the content); this opens the same tutor.
    bar.querySelector('.nx-slim-tutor').addEventListener('click', function(){
      var b = document.querySelector('.lp-launch');
      if(b){ b.click(); return; }
      window.__levlTutorOpenOnLoad = true;
      var sc = document.createElement('script'); sc.src = '/assets/tutor.js'; document.head.appendChild(sc);
    });
    wrap.parentNode.insertBefore(bar, wrap);
    wrap.classList.add('nx-slim');
    var head = wrap.querySelector(':scope > .page-head');
    if(head) head.classList.add('nx-slim-head');
    if(window.LevlStudio && window.LevlStudio.use) window.LevlStudio.use({ area: wrap, any: true });
    // site-chrome.js pointed the skip link at the wrapper; the bar sits above it, so that stays right.
    return { bar: bar, wrap: wrap };
  }

  /* A part that scrolls inside the stage must be reachable by keyboard
     (axe scrollable-region-focusable) when it holds nothing focusable. */
  function scrollable(els, label){
    list(els).forEach(function(el){
      if(el.hasAttribute('tabindex')) return;
      el.setAttribute('tabindex', '0');
      if(!el.getAttribute('role')){ el.setAttribute('role', 'region'); el.setAttribute('aria-label', label || 'Scrollable area'); }
    });
  }

  /* NremtStudio.kit2(s, o): the tools v2 arrangement (docs/tools-v2-standard.md), NREMT's adapter for the shared kit
     (assets/course/tool-kit2.js, loaded only by a page rebuilt to v2; the pattern of ApBioTools.studioKit2). The
     tool builds its own Explore stage with the kit and hands it over:
       o.stage    element   the picture with its controls on it and the lines around it. EXPLORE shows it alone,
                            full width (no side panel, nothing graded).
       o.ref      element   the reference behind "?".
       o.parts    [{ value, label, stage, dock, task: {..} | fn }]   TEST YOURSELF parts. A part with its own stage
                            shows it in place of the Explore picture; its dock is the side panel.
       o.start    fn(hash) -> { mode, part } | null   where a deep link opens (default: #test or #<part value>
                            opens that part; anything else Explore).
       o.onShow   fn(mode, part) after every switch (mode 'explore' | 'quiz').
     Two modes only: Explore and Test yourself; with more than one part, one dropdown on the stage picks it.
     Returns { mode(), part(), go(mode, part) }; also at s.kit2. Other NREMT pages do not call it. */
  function kit2(s, o){
    var K = window.LevlKit2;
    if(!s || !K) return null;
    K.on(s);
    var parts = (o.parts || []).slice(), cur = { mode: 'explore', part: parts[0] ? parts[0].value : null };
    function partOf(v){ return parts.filter(function(p){ return p.value === v; })[0] || parts[0] || null; }
    s.add('stage', o.stage, parts.length ? { mode: 'explore' } : null);
    if(o.ref) s.add('details', o.ref);
    parts.forEach(function(p){
      if(p.stage) s.add('stage', p.stage, { mode: 'quiz' });
      if(p.dock) s.add('dock', p.dock, { mode: 'quiz' });
    });
    var pick = parts.length > 1 ? s.picker({ label: 'What to practice', items: parts.map(function(p){ return { value: p.value, label: p.label }; }), value: cur.part,
      onChange: function(v){ show('quiz', v, true); } }, 'quiz') : null;
    function show(mode, part, user){
      var p = partOf(part), quiz = mode === 'quiz' && !!p;
      cur = { mode: quiz ? 'quiz' : 'explore', part: p ? p.value : null };
      if(s.mode() !== cur.mode) s.mode(cur.mode);
      o.stage.hidden = quiz;
      parts.forEach(function(x){ var on = quiz && x === p; if(x.stage) x.stage.hidden = !on; if(x.dock) x.dock.hidden = !on; });
      if(pick && quiz && pick.value() !== p.value) pick.value(p.value);
      if(quiz && p.task) s.task(typeof p.task === 'function' ? p.task() : p.task, 'quiz');
      if(o.onShow) o.onShow(cur.mode, quiz ? cur.part : null, user);
    }
    if(parts.length) s.modes({ items: [{ value: 'explore', label: 'Explore' }, { value: 'quiz', label: 'Test yourself' }], value: 'explore',
      onChange: function(v){ show(v, cur.part, true); } });
    var h = location.hash, start = { mode: 'explore', part: cur.part };
    var custom = o.start ? o.start(h) : null;
    if(custom) start = { mode: custom.mode, part: custom.part || cur.part };
    else if(/^#test\b/.test(h)) start = { mode: 'quiz', part: cur.part };
    else parts.forEach(function(p){ if(new RegExp('^#' + p.value + '\\b').test(h)) start = { mode: 'quiz', part: p.value }; });
    s.mode(start.mode);
    show(start.mode, start.part, false);
    s.kit2 = { mode: function(){ return cur.mode; }, part: function(){ return cur.part; }, go: function(m, p){ show(m, p == null ? cur.part : p, false); } };
    return s.kit2;
  }

  window.NremtStudio = { mount: mount, slim: slim, scrollable: scrollable, kit2: kit2 };
})();
