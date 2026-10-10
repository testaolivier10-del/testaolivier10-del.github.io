/* NREMT's side of the Tool Studio (docs/tools-calm.md; API at the top of
   ../../assets/course/tool-studio.js). One call per tool page:

     var s = NremtStudio.mount({ title, slug, stage, dock, why, details, modes, caption, hint, about });

   It mounts the calm frame in place of the page's .wrap (the slim bar's back
   arrow goes to tools.html, the menu has Copy link, About, Report a problem,
   Ask the tutor, Course home, All tools), moves the page-head's promise into
   About and the page footer to the end of About, and hides what is left of
   .wrap (the old title card). Each page then moves its own parts with s.add,
   so its element references, listeners and deep links keep working.

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
    return n && n.classList.contains('wrap') && n.querySelector(':scope > footer') ? n : null;
  }

  function mount(o){
    if(!window.LevlStudio || off()) return null;
    var wrap = document.querySelector('.wrap');
    var foot = footer(wrap);
    var head = wrap && wrap.querySelector(':scope > .page-head');
    var about = document.createElement('div');
    about.className = 'ls-sec';
    var lede = head && head.querySelector('.lede');
    if(o.about) list(o.about).forEach(function(el){ about.appendChild(el); });
    else if(lede) about.appendChild(lede);
    var opts = {};
    for(var k in o) opts[k] = o[k];
    opts.course = 'NREMT-EMT';
    opts.back = opts.back || 'tools.html';
    opts.home = opts.home || 'index.html';
    opts.slug = 'nremt-' + o.slug;
    opts.host = wrap || undefined;
    opts.footer = foot ? [foot] : [];
    opts.about = about.children.length ? about : null;
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
    var wrap = document.querySelector('.wrap');
    if(!wrap) return null;
    document.body.classList.add('nx-slim-on');
    var bar = document.createElement('header');
    bar.className = 'nx-slim-bar';
    var title = o.title || document.title;
    bar.innerHTML = '<a class="nx-slim-back" href="' + (o.back || 'tools.html') + '" aria-label="' + (o.backLabel || 'Back to all tools') + '">' +
      '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M15 5l-7 7 7 7"/></svg></a>' +
      '<p class="nx-slim-title"></p><span class="nx-slim-sp"></span>' +
      '<a class="nx-slim-home" href="index.html">Course home</a>';
    bar.querySelector('.nx-slim-title').textContent = title;
    wrap.parentNode.insertBefore(bar, wrap);
    wrap.classList.add('nx-slim');
    var head = wrap.querySelector(':scope > .page-head');
    if(head) head.classList.add('nx-slim-head');
    return { bar: bar, wrap: wrap };
  }

  window.NremtStudio = { mount: mount, slim: slim };
})();
