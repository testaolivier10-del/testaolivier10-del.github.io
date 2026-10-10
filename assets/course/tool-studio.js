/* Tool Studio: the one calm layout every interactive tool uses (docs/tools-calm.md).

   One screen, one job. A slim top bar (back, tool name, "?" and a "⋯" menu), a
   full-width STAGE (the visual, with result pills on it) and one compact DOCK
   (the mode switch, one live caption line with "Why?", 1 to 3 primary
   controls). Everything else is one tap away in the Why / Details sheet: a
   bottom sheet on a phone, a drawer on the far right on a desktop that pushes
   the dock aside and never covers it. Nothing is deleted: elements are MOVED
   into the studio (never copied), so a tool's getElementById, listeners and
   hidden toggles keep working.

   On a tool page with the studio on, body gets .ls-on, which hides the site
   header, the course tabs, the breadcrumb, the hero, the bottom tab bar and
   the floating tutor and periodic-table buttons. The menu keeps each of them
   reachable (Ask the tutor, Periodic table, Course home, All tools).

   API (window.LevlStudio)
   -----------------------
   var s = LevlStudio.mount(opts)   build the studio and return it. opts:
     title    'Reaction predictor'   sentence case
     course   'Organic Chemistry'    shown beside the title on a desktop
     back     '../tools.html'        the back arrow (to the course tools page)
     home     '../'                  course home (menu)
     slug     'reaction-predictor'   hint storage key, report id
     host     element                the studio goes in place of / before it
                                     (default: start of <main>, else <body>)
     stage, dock, why, details, about   element | selector | array: moved in
     modes    { items: [{ value, label }], value, onChange(v) }  a segmented
              switch the studio draws; or { el, value } to adopt a tool's own
              switch (the tool then calls s.mode(v) when it changes)
     caption  html                   the live caption line
     hint     { target, text }       first-run hint (see s.hint)
     menu     { copyLink: true | fn() -> url, note: { label, html },
                report: { course, id } | fn, tutor: true (default),
                periodic: true (default when a .pt-fab exists),
                items: [{ label, onClick | href }] }
     whyTitle 'Why' (tab label)      detailsTitle 'Details'
   Methods (all return s unless noted):
     s.add(region, els, { mode })   move els into 'stage' | 'dock' | 'why' |
                                    'details' | 'about'; with mode, they show
                                    only in that mode ('explore', 'practice'...)
     s.mode(v)                      switch modes (shows/hides mode-only parts)
     s.caption(html)                set the caption line (polite live region)
     s.pills(list, side)            result pills on the stage: list of
                                    { html, tone: 'accent'|'good'|'bad'|'warn'|
                                    'ghost'|'readout', k } ; side 'left' (default)
                                    or 'right'
     s.open(tab, focusEl?)          open the sheet on 'why' | 'details' | 'about'
     s.close()
     s.hint({ target, text, key })  pulse + tooltip on target, once per tool
                                    per device; gone on first interaction
     s.suspend(on)                  hide the studio and give the page its
                                    chrome back (a Premium gate, an error)
     s.root, s.stage, s.dock, s.why, s.details, s.about   the regions
   LevlStudio.stepper(container, opts) -> { go(i), refresh(), review(on) }
     One step at a time over existing graded inputs. opts:
       items   selector (inside container) of the step elements
       submit  selector of an element to show only on the last step
       total   number | fn() -> number (default: items found)
       label   'Step'
       done    fn() -> true when graded (shows every step, for review)
     New items appearing later (a drill that appends the next step after a
     Check) are picked up and become current. Back/Next move between steps;
     Next stops at the last step that exists.
   LevlStudio.on()                  true when a studio is mounted on the page */
(function(){
  'use strict';
  if(window.LevlStudio) return;

  var uid = 0;
  function nid(p){ return 'ls-' + (p || 'x') + '-' + (++uid); }
  function esc(s){ return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function list(x, scope){
    if(!x) return [];
    if(typeof x === 'string') return Array.prototype.slice.call((scope || document).querySelectorAll(x));
    if(x.nodeType) return [x];
    return Array.prototype.slice.call(x).filter(Boolean);
  }
  function store(k, v){
    try{ if(v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); }catch(e){}
    return null;
  }
  function reduced(){
    try{ if(window.LevlMotion && window.LevlMotion.reduced) return !!window.LevlMotion.reduced(); return matchMedia('(prefers-reduced-motion: reduce)').matches; }catch(e){ return false; }
  }
  function wide(){ try{ return matchMedia('(min-width: 1000px)').matches; }catch(e){ return false; } }

  var ICON = {
    back: '<path d="M15 5l-7 7 7 7"/>',
    help: '<circle cx="12" cy="12" r="9"/><path d="M9.6 9.3a2.5 2.5 0 0 1 4.8 1c0 1.7-2.4 2.1-2.4 3.6"/><path d="M12 17.2h.01"/>',
    more: '<circle cx="5.5" cy="12" r="1.2"/><circle cx="12" cy="12" r="1.2"/><circle cx="18.5" cy="12" r="1.2"/>',
    close: '<path d="M6 6l12 12M18 6L6 18"/>',
    bulb: '<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.6 10.8c.7.6 1.1 1.3 1.1 2.2h5c0-.9.4-1.6 1.1-2.2A6 6 0 0 0 12 3z"/>',
    tap: '<path d="M9 11V5.5a1.5 1.5 0 0 1 3 0V10"/><path d="M12 10V8.5a1.5 1.5 0 0 1 3 0V11"/><path d="M15 11v-1a1.5 1.5 0 0 1 3 0v4.5A6.5 6.5 0 0 1 11.5 21h-.6a5 5 0 0 1-4-2l-2.6-3.6a1.5 1.5 0 0 1 2.3-1.9L9 15.5V11"/>',
    link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
    flag: '<path d="M5 21V4M5 4h11l-2 4 2 4H5"/>',
    bot: '<rect x="4" y="7" width="16" height="11" rx="4"/><path d="M12 7V4M9 12h.01M15 12h.01"/>',
    home: '<path d="M4 11l8-7 8 7v9H4z"/><path d="M10 20v-6h4v6"/>',
    grid: '<rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/><rect x="13" y="13" width="7" height="7" rx="1.5"/>',
    atom: '<circle cx="12" cy="12" r="1.6"/><ellipse cx="12" cy="12" rx="9" ry="3.6"/><ellipse cx="12" cy="12" rx="9" ry="3.6" transform="rotate(60 12 12)"/><ellipse cx="12" cy="12" rx="9" ry="3.6" transform="rotate(120 12 12)"/>',
    star: '<path d="M12 4l2.4 5 5.4.6-4 3.7 1.1 5.3L12 16l-4.9 2.6 1.1-5.3-4-3.7 5.4-.6z"/>'
  };
  function icon(n, cls){ return '<svg class="ls-i' + (cls ? ' ' + cls : '') + '" viewBox="0 0 24 24" aria-hidden="true" focusable="false">' + ICON[n] + '</svg>'; }

  var current = null;

  function mount(opts){
    opts = opts || {};
    if(current) return current;
    var s = {}, mode = null, lastFocus = null, sheetOpen = false, tab = 'why';
    var menuO = opts.menu || {};
    var ids = { title: nid('t'), why: nid('why'), det: nid('det'), sheetH: nid('sh'), menu: nid('m'), cap: nid('cap') };

    var root = document.createElement('div');
    root.className = 'ls-root';
    root.setAttribute('data-ls', '');
    root.innerHTML =
      '<header class="ls-bar">' +
        '<a class="ls-ib ls-back" href="' + esc(opts.back || '../tools.html') + '" aria-label="Back to all tools">' + icon('back') + '</a>' +
        '<h1 class="ls-title" id="' + ids.title + '"><span class="ls-title-t">' + esc(opts.title || document.title) + '</span>' +
          (opts.course ? ' <span class="ls-course">' + esc(opts.course) + '</span>' : '') + '</h1>' +
        '<span class="ls-sp"></span>' +
        (menuO.tutor === false ? '' : '<button type="button" class="ls-tutor-btn" data-ls-act="tutor"><span class="ls-tutor-dot">' + icon('bot') + '</span>Ask the tutor</button>') +
        '<button type="button" class="ls-ib ls-help" aria-label="Why? Explain what is on screen" aria-controls="' + ids.why + '">' + icon('help') + '</button>' +
        '<div class="ls-menu-wrap"><button type="button" class="ls-ib ls-more" aria-label="More" aria-haspopup="true" aria-expanded="false" aria-controls="' + ids.menu + '">' + icon('more') + '</button>' +
          '<div class="ls-menu" id="' + ids.menu + '" hidden></div></div>' +
      '</header>' +
      '<div class="ls-main">' +
        '<section class="ls-stage" aria-label="' + esc((opts.title || 'Tool') + ': the picture') + '">' +
          '<div class="ls-pills"><div class="ls-pills-l"></div><div class="ls-pills-r"></div></div>' +
          '<div class="ls-stage-body"></div>' +
        '</section>' +
        '<section class="ls-dock" aria-label="Controls">' +
          '<div class="ls-modes"></div>' +
          '<div class="ls-cap"><p class="ls-caption" id="' + ids.cap + '" aria-live="polite"></p>' +
            '<button type="button" class="ls-why" aria-controls="' + ids.why + '">' + icon('bulb') + '<span>Why?</span></button></div>' +
          '<div class="ls-dock-body"></div>' +
        '</section>' +
        '<aside class="ls-sheet" aria-labelledby="' + ids.sheetH + '" tabindex="-1" hidden>' +
          '<div class="ls-grab" aria-hidden="true"></div>' +
          '<div class="ls-sheet-head"><h2 class="sr-only" id="' + ids.sheetH + '">Why and details</h2>' +
            '<div class="ls-seg ls-tabs" role="tablist" aria-label="Why or details">' +
              '<button type="button" role="tab" id="' + ids.why + '-tab" aria-controls="' + ids.why + '" aria-selected="true" data-tab="why">' + esc(opts.whyTitle || 'Why') + '</button>' +
              '<button type="button" role="tab" id="' + ids.det + '-tab" aria-controls="' + ids.det + '" aria-selected="false" tabindex="-1" data-tab="details">' + esc(opts.detailsTitle || 'Details') + '</button>' +
            '</div>' +
            '<button type="button" class="ls-ib ls-close" aria-label="Close">' + icon('close') + '</button></div>' +
          '<div class="ls-panel ls-why-panel" role="tabpanel" id="' + ids.why + '" aria-labelledby="' + ids.why + '-tab" tabindex="-1"></div>' +
          '<div class="ls-panel ls-det-panel" role="tabpanel" id="' + ids.det + '" aria-labelledby="' + ids.det + '-tab" tabindex="-1" hidden>' +
            '<div class="ls-det-body"></div>' +
            '<section class="ls-about" aria-labelledby="' + ids.det + '-ab" hidden><h3 class="ls-h" id="' + ids.det + '-ab" tabindex="-1">About this tool</h3><div class="ls-about-body"></div></section>' +
          '</div>' +
        '</aside>' +
      '</div>' +
      '<div class="ls-scrim" hidden></div>' +
      '<p class="ls-toast" role="status" aria-live="polite"></p>';

    var host = opts.host && opts.host.nodeType ? opts.host : null;
    if(host) host.parentNode.insertBefore(root, host);
    else {
      var main = document.querySelector('main') || document.body;
      main.insertBefore(root, main.firstChild);
    }

    var q = function(sel){ return root.querySelector(sel); };
    var stageBody = q('.ls-stage-body'), dockBody = q('.ls-dock-body'), whyP = q('.ls-why-panel'),
      detP = q('.ls-det-body'), aboutS = q('.ls-about'), aboutB = q('.ls-about-body'), sheet = q('.ls-sheet'),
      scrim = q('.ls-scrim'), menu = q('.ls-menu'), moreBtn = q('.ls-more'), toast = q('.ls-toast'),
      modesEl = q('.ls-modes'), capEl = q('.ls-caption');
    var regions = { stage: stageBody, dock: dockBody, why: whyP, details: detP, about: aboutB };
    s.root = root; s.stage = stageBody; s.dock = dockBody; s.why = whyP; s.details = detP; s.about = aboutB;
    s.stageEl = q('.ls-stage'); s.dockEl = q('.ls-dock');

    document.documentElement.classList.add('ls-page');
    document.body.classList.add('ls-on');

    /* ---------------- regions */
    var modeOnly = [];
    s.add = function(region, els, o){
      var box = regions[region];
      if(!box) return s;
      list(els).forEach(function(el){
        box.appendChild(el);
        if(o && o.mode){ el.setAttribute('data-ls-only', o.mode); modeOnly.push(el); }
      });
      if(region === 'about') aboutS.hidden = !aboutB.children.length;
      if(mode) paintMode();
      return s;
    };
    function paintMode(){
      modeOnly.forEach(function(el){ el.classList.toggle('ls-off', el.getAttribute('data-ls-only').split(/\s+/).indexOf(mode) < 0); });
      root.setAttribute('data-mode', mode || '');
    }

    /* ---------------- modes */
    var modeBtns = null;
    s.mode = function(v){
      if(v == null) return mode;
      mode = v;
      if(modeBtns) modeBtns.forEach(function(b){ var on = b.getAttribute('data-v') === v; b.setAttribute('aria-pressed', String(on)); b.classList.toggle('on', on); });
      paintMode();
      return s;
    };
    function setupModes(m){
      if(!m) { modesEl.hidden = true; return; }
      if(m.el){
        m.el.classList.add('ls-seg', 'ls-seg-adopted');
        modesEl.appendChild(m.el);
        if(m.value) s.mode(m.value);
        return;
      }
      modesEl.innerHTML = '<div class="ls-seg" role="group" aria-label="Mode">' + m.items.map(function(it){
        return '<button type="button" data-v="' + esc(it.value) + '" aria-pressed="false">' + esc(it.label) + '</button>';
      }).join('') + '</div>';
      modeBtns = Array.prototype.slice.call(modesEl.querySelectorAll('button'));
      modesEl.addEventListener('click', function(e){
        var b = e.target.closest('button[data-v]'); if(!b) return;
        var v = b.getAttribute('data-v');
        if(v === mode) return;
        s.mode(v);
        if(m.onChange) m.onChange(v);
      });
      s.mode(m.value || m.items[0].value);
    }

    /* ---------------- caption and pills */
    s.caption = function(html){ capEl.innerHTML = html || ''; q('.ls-cap').classList.toggle('is-empty', !html); return s; };
    var TONES = { accent: 1, good: 1, bad: 1, warn: 1, ghost: 1, readout: 1 };
    s.pills = function(items, side){
      var box = q(side === 'right' ? '.ls-pills-r' : '.ls-pills-l');
      box.innerHTML = (items || []).filter(Boolean).map(function(p){
        var tone = TONES[p.tone] ? p.tone : 'accent';
        return '<span class="ls-pill ls-pill-' + tone + '">' + (p.k ? '<span class="ls-pill-k">' + p.k + '</span> ' : '') + p.html + '</span>';
      }).join('');
      return s;
    };
    s.pill = function(html, tone, side){ return s.pills(html ? [{ html: html, tone: tone }] : [], side); };

    /* ---------------- sheet (Why / Details) */
    function setTab(t){
      tab = t === 'about' ? 'details' : t;
      root.querySelectorAll('.ls-tabs [role=tab]').forEach(function(b){
        var on = b.getAttribute('data-tab') === tab;
        b.setAttribute('aria-selected', String(on)); b.tabIndex = on ? 0 : -1;
      });
      whyP.hidden = tab !== 'why';
      q('.ls-det-panel').hidden = tab !== 'details';
    }
    function focusables(){
      return Array.prototype.filter.call(sheet.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea, summary, [tabindex]:not([tabindex="-1"])'), function(el){
        return el.offsetParent !== null || el === document.activeElement;
      });
    }
    s.open = function(t, focusEl){
      if(!sheetOpen) lastFocus = document.activeElement;
      setTab(t || 'why');
      sheet.hidden = false;
      sheetOpen = true;
      root.classList.add('is-sheet');
      var modal = !wide();
      sheet.setAttribute('role', 'dialog');
      sheet.setAttribute('aria-modal', modal ? 'true' : 'false');
      scrim.hidden = !modal;
      if(modal) document.documentElement.classList.add('ls-lock');
      [q('.ls-help'), q('.ls-why')].forEach(function(b){ b.setAttribute('aria-expanded', 'true'); });
      requestAnimationFrame(function(){
        sheet.classList.add('is-open');
        var f = focusEl || (t === 'about' ? q('.ls-about .ls-h') : null) || root.querySelector('.ls-tabs [aria-selected=true]');
        if(f){ try{ f.focus({ preventScroll: t !== 'about' }); }catch(e){ f.focus(); } }
        if(t === 'about' && aboutS.scrollIntoView) aboutS.scrollIntoView({ block: 'start' });
      });
      return s;
    };
    s.close = function(){
      if(!sheetOpen) return s;
      sheetOpen = false;
      sheet.classList.remove('is-open');
      root.classList.remove('is-sheet');
      scrim.hidden = true;
      document.documentElement.classList.remove('ls-lock');
      [q('.ls-help'), q('.ls-why')].forEach(function(b){ b.setAttribute('aria-expanded', 'false'); });
      var done = function(){ if(!sheetOpen) sheet.hidden = true; };
      if(reduced()) done(); else setTimeout(done, 260);
      if(lastFocus && document.contains(lastFocus) && lastFocus.focus){ try{ lastFocus.focus({ preventScroll: true }); }catch(e){ lastFocus.focus(); } }
      return s;
    };
    q('.ls-help').addEventListener('click', function(){ sheetOpen && tab === 'why' ? s.close() : s.open('why'); });
    q('.ls-why').addEventListener('click', function(){ sheetOpen && tab === 'why' ? s.close() : s.open('why'); });
    q('.ls-close').addEventListener('click', s.close);
    scrim.addEventListener('click', s.close);
    q('.ls-tabs').addEventListener('click', function(e){ var b = e.target.closest('[data-tab]'); if(b){ setTab(b.getAttribute('data-tab')); b.focus(); } });
    q('.ls-tabs').addEventListener('keydown', function(e){
      if(e.key !== 'ArrowRight' && e.key !== 'ArrowLeft' && e.key !== 'Home' && e.key !== 'End') return;
      e.preventDefault();
      var nt = e.key === 'Home' ? 'why' : e.key === 'End' ? 'details' : (tab === 'why' ? 'details' : 'why');
      setTab(nt); root.querySelector('.ls-tabs [data-tab="' + nt + '"]').focus();
    });
    sheet.addEventListener('keydown', function(e){
      if(e.key === 'Escape'){ e.stopPropagation(); s.close(); return; }
      if(e.key !== 'Tab' || sheet.getAttribute('aria-modal') !== 'true') return;
      var f = focusables(); if(!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if(e.shiftKey && document.activeElement === first){ e.preventDefault(); last.focus(); }
      else if(!e.shiftKey && document.activeElement === last){ e.preventDefault(); first.focus(); }
    });
    // Drag the handle down to close (phone).
    (function(){
      var grab = q('.ls-grab'), y0 = null, dy = 0;
      grab.addEventListener('pointerdown', function(e){ y0 = e.clientY; dy = 0; try{ grab.setPointerCapture(e.pointerId); }catch(x){} });
      grab.addEventListener('pointermove', function(e){ if(y0 == null) return; dy = Math.max(0, e.clientY - y0); sheet.style.transform = 'translateY(' + dy + 'px)'; });
      function end(){ if(y0 == null) return; y0 = null; sheet.style.transform = ''; if(dy > 80) s.close(); }
      grab.addEventListener('pointerup', end); grab.addEventListener('pointercancel', end);
    })();
    // A resize across the breakpoint switches modal and drawer.
    window.addEventListener('resize', function(){
      if(!sheetOpen) return;
      var modal = !wide();
      sheet.setAttribute('aria-modal', modal ? 'true' : 'false');
      scrim.hidden = !modal;
      document.documentElement.classList.toggle('ls-lock', modal);
    });

    /* ---------------- menu */
    function say(t){ toast.textContent = t; toast.classList.add('show'); clearTimeout(say.t); say.t = setTimeout(function(){ toast.classList.remove('show'); toast.textContent = ''; }, 3200); }
    s.say = say;
    var acts = {};
    function item(key, ic, label, extra){ return '<button type="button" class="ls-mi" data-ls-act="' + key + '"' + (extra || '') + '>' + icon(ic) + '<span>' + label + '</span></button>'; }
    function buildMenu(){
      var h = '';
      if(menuO.copyLink){ h += item('copy', 'link', 'Copy link to this setup'); acts.copy = copyLink; }
      h += item('about', 'info', 'About this tool'); acts.about = function(){ s.open('about'); };
      if(menuO.report){
        var r = menuO.report;
        if(typeof r === 'function'){ h += item('report', 'flag', 'Report a problem'); acts.report = r; }
        else h += item('report', 'flag', 'Report a problem', ' data-report-course="' + esc(r.course) + '" data-report-question="' + esc(r.id) + '"');
      }
      if(menuO.tutor !== false){ h += item('tutor', 'bot', 'Ask the tutor'); }
      if(menuO.periodic || (menuO.periodic !== false && document.querySelector('.pt-fab'))){ h += item('periodic', 'atom', 'Periodic table'); acts.periodic = function(){ var b = document.querySelector('.pt-fab'); if(b) b.click(); }; }
      (menuO.items || []).forEach(function(it, i){
        if(it.href) h += '<a class="ls-mi" href="' + esc(it.href) + '">' + icon(it.icon || 'grid') + '<span>' + esc(it.label) + '</span></a>';
        else { h += item('x' + i, it.icon || 'grid', esc(it.label)); acts['x' + i] = it.onClick; }
      });
      h += '<div class="ls-mdiv" role="presentation"></div>';
      if(opts.home) h += '<a class="ls-mi" href="' + esc(opts.home) + '">' + icon('home') + '<span>Course home</span></a>';
      h += '<a class="ls-mi" href="' + esc(opts.back || '../tools.html') + '">' + icon('grid') + '<span>All tools</span></a>';
      if(menuO.note) h += '<p class="ls-mnote">' + icon('star') + '<span><b>' + esc(menuO.note.label) + '</b> ' + (menuO.note.html || '') + '</span></p>';
      menu.innerHTML = h;
    }
    acts.tutor = function(){
      var b = document.querySelector('.lp-launch');
      if(b){ b.click(); return; }
      window.__levlTutorOpenOnLoad = true;
      var sc = document.createElement('script'); sc.src = '/assets/tutor.js'; document.head.appendChild(sc);
    };
    function copyLink(){
      var url = typeof menuO.copyLink === 'function' ? menuO.copyLink() : window.location.href;
      function fallback(){ try{ window.prompt('Copy this link', url); }catch(e){} }
      if(navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(url).then(function(){ say('Link copied. It reopens exactly this.'); }, fallback);
      else fallback();
    }
    function setMenu(open){
      menu.hidden = !open;
      moreBtn.setAttribute('aria-expanded', String(open));
      if(open){ var f = menu.querySelector('.ls-mi'); if(f) f.focus(); }
    }
    moreBtn.addEventListener('click', function(){ setMenu(menu.hidden); });
    menu.addEventListener('keydown', function(e){
      var items = Array.prototype.slice.call(menu.querySelectorAll('.ls-mi')), i = items.indexOf(document.activeElement);
      if(e.key === 'Escape'){ e.preventDefault(); setMenu(false); moreBtn.focus(); }
      else if(e.key === 'ArrowDown'){ e.preventDefault(); items[(i + 1) % items.length].focus(); }
      else if(e.key === 'ArrowUp'){ e.preventDefault(); items[(i - 1 + items.length) % items.length].focus(); }
      else if(e.key === 'Tab'){ setMenu(false); }
    });
    document.addEventListener('click', function(e){ if(!menu.hidden && !e.target.closest('.ls-menu-wrap')) setMenu(false); });
    root.addEventListener('click', function(e){
      var b = e.target.closest('[data-ls-act]');
      if(!b) return;
      var a = b.getAttribute('data-ls-act');
      if(menu.contains(b)) setMenu(false);
      if(a === 'report' && !acts.report){
        // report-question.js handles [data-report-question] clicks; load it on demand.
        if(!window.LevlReport){
          e.preventDefault();
          var sc = document.createElement('script'); sc.src = '/assets/report-question.js';
          sc.onload = function(){ b.click(); };
          document.head.appendChild(sc);
        }
        return;
      }
      if(acts[a]) acts[a]();
    });
    buildMenu();
    s.menu = function(o){ for(var k in o) menuO[k] = o[k]; buildMenu(); return s; };

    /* ---------------- suspend (a gate in place of the tool) */
    s.suspend = function(on){
      root.hidden = !!on;
      document.body.classList.toggle('ls-on', !on);
      document.documentElement.classList.toggle('ls-page', !on);
      return s;
    };

    /* ---------------- hint */
    s.hint = function(o){ return hint(s, o, opts.slug); };

    current = s;
    setupModes(opts.modes);
    ['stage', 'dock', 'why', 'details', 'about'].forEach(function(r){ if(opts[r]) s.add(r, opts[r]); });
    s.caption(opts.caption || '');
    if(opts.hint) s.hint(opts.hint);
    return s;
  }

  /* ---------------- first-run hint */
  function hint(s, o, slug){
    if(!o || !o.target) return null;
    var key = 'levl_hint_' + (o.key || slug || location.pathname);
    if(store(key)) return null;
    var target = typeof o.target === 'string' ? s.root.querySelector(o.target) || document.querySelector(o.target) : o.target;
    if(!target) return null;
    var ring = document.createElement('div'), tip = document.createElement('div');
    ring.className = 'ls-halo' + (reduced() ? ' is-static' : '');
    ring.setAttribute('aria-hidden', 'true');
    tip.className = 'ls-coach';
    tip.setAttribute('role', 'note');
    tip.innerHTML = icon('tap') + '<span>' + esc(o.text) + '</span>';
    document.body.appendChild(ring); document.body.appendChild(tip);
    // Screen readers: the tip is described on the target.
    tip.id = nid('hint');
    var prevDesc = target.getAttribute('aria-describedby');
    target.setAttribute('aria-describedby', (prevDesc ? prevDesc + ' ' : '') + tip.id);
    var gone = false, raf = 0;
    function place(){
      raf = 0;
      if(gone) return;
      var r = target.getBoundingClientRect();
      if(!r.width && !r.height){ ring.style.display = tip.style.display = 'none'; return; }
      ring.style.display = tip.style.display = '';
      var sx = window.scrollX, sy = window.scrollY, pad = 4;
      ring.style.left = (r.left + sx - pad) + 'px'; ring.style.top = (r.top + sy - pad) + 'px';
      ring.style.width = (r.width + pad * 2) + 'px'; ring.style.height = (r.height + pad * 2) + 'px';
      var round = Math.min(r.width, r.height) / 2 + pad;
      ring.style.borderRadius = (o.round != null ? o.round : round) + 'px';
      var tw = tip.offsetWidth, th = tip.offsetHeight, vw = document.documentElement.clientWidth;
      var above = r.top > th + 18;
      var left = Math.max(8, Math.min(vw - tw - 8, r.left + r.width / 2 - 28));
      tip.style.left = (left + sx) + 'px';
      tip.style.top = (above ? r.top + sy - th - 12 : r.bottom + sy + 12) + 'px';
      tip.classList.toggle('is-below', !above);
      tip.style.setProperty('--ax', Math.max(14, Math.min(tw - 26, r.left + r.width / 2 - left - 6)) + 'px');
    }
    function queue(){ if(!raf) raf = requestAnimationFrame(place); }
    function dismiss(){
      if(gone) return;
      gone = true;
      store(key, '1');
      ring.remove(); tip.remove();
      if(prevDesc) target.setAttribute('aria-describedby', prevDesc); else target.removeAttribute('aria-describedby');
      window.removeEventListener('resize', queue); window.removeEventListener('scroll', queue, true);
      ['pointerdown', 'keydown', 'input', 'change'].forEach(function(t){ s.root.removeEventListener(t, onUse, true); });
      clearInterval(iv);
    }
    function onUse(e){
      if(e.type === 'keydown' && (e.key === 'Tab' || e.key === 'Shift')) return;
      if(e.target.closest && e.target.closest('.ls-bar')) return;
      dismiss();
    }
    window.addEventListener('resize', queue); window.addEventListener('scroll', queue, true);
    ['pointerdown', 'keydown', 'input', 'change'].forEach(function(t){ s.root.addEventListener(t, onUse, true); });
    // The layout can still be settling (fonts, a late redraw): follow it briefly.
    var n = 0, iv = setInterval(function(){ queue(); if(++n > 20) clearInterval(iv); }, 150);
    queue();
    return { dismiss: dismiss, place: queue };
  }

  /* ---------------- practice stepper */
  function stepper(container, o){
    o = o || {};
    if(!container) return null;
    var label = o.label || 'Step', at = 0, seen = 0, reviewing = false, lastDone = false;
    var head = document.createElement('div'), nav = document.createElement('div');
    head.className = 'ls-step-head';
    head.innerHTML = '<p class="ls-step-n" aria-live="polite"></p><span class="ls-dots" aria-hidden="true"></span>';
    nav.className = 'ls-step-nav';
    nav.innerHTML = '<button type="button" class="ls-btn ls-step-back">Back</button><button type="button" class="ls-btn ls-step-next">Next</button>';
    container.classList.add('ls-stepper');
    container.insertBefore(head, container.firstChild);
    container.appendChild(nav);
    var back = nav.querySelector('.ls-step-back'), next = nav.querySelector('.ls-step-next');
    function items(){ return list(o.items || ':scope > *', container).filter(function(el){ return el !== head && el !== nav; }); }
    function total(n){ var t = typeof o.total === 'function' ? o.total() : o.total; return Math.max(n, t || 0); }
    function paint(focus){
      var it = items(), n = it.length, tot = total(n);
      if(!n){ head.hidden = nav.hidden = true; return; }
      if(o.done) reviewing = !!o.done();
      at = Math.max(0, Math.min(at, n - 1));
      head.hidden = false;
      container.classList.toggle('is-review', reviewing);
      it.forEach(function(el, i){ el.classList.toggle('ls-step-off', !reviewing && i !== at); });
      head.querySelector('.ls-step-n').textContent = reviewing ? 'All ' + tot + ' ' + label.toLowerCase() + 's' : label + ' ' + (at + 1) + ' of ' + tot;
      var dots = '';
      for(var i = 0; i < tot; i++) dots += '<i class="' + (i === at && !reviewing ? 'on' : i < n ? 'done' : '') + '"></i>';
      head.querySelector('.ls-dots').innerHTML = dots;
      nav.hidden = reviewing || tot < 2;
      back.disabled = at === 0;
      next.disabled = at >= n - 1;
      next.hidden = at >= tot - 1;
      if(o.submit){ list(o.submit, container).forEach(function(el){ el.classList.toggle('ls-step-off', !reviewing && at !== tot - 1); }); }
      if(focus){
        var f = it[at].querySelector('input:not([type=hidden]):not([readonly]):not([disabled]), select, textarea, button:not([disabled])') || it[at];
        if(f === it[at]) it[at].setAttribute('tabindex', '-1');
        try{ f.focus({ preventScroll: true }); }catch(e){ f.focus(); }
      }
    }
    back.addEventListener('click', function(){ at--; paint(true); });
    next.addEventListener('click', function(){ at++; paint(true); });
    // Enter in a step's field moves on (not on the last step, where it submits).
    container.addEventListener('keydown', function(e){
      if(e.key !== 'Enter' || reviewing || !e.target.matches || !e.target.matches('input[type=text], input:not([type])')) return;
      var it = items(), tot = total(it.length);
      if(at < tot - 1 && at < it.length - 1){ e.preventDefault(); at++; paint(true); }
    });
    function refresh(){
      var n = items().length;
      if(n > seen){ at = n - 1; }
      seen = n;
      paint(false);
    }
    if(window.MutationObserver){
      // Only a change in the number of steps or in done() repaints, so the
      // stepper's own edits cannot loop.
      var queued = false;
      new MutationObserver(function(){
        if(queued) return;
        queued = true;
        requestAnimationFrame(function(){
          queued = false;
          var d = !!(o.done && o.done());
          if(items().length !== seen || d !== lastDone){ lastDone = d; refresh(); }
        });
      }).observe(container, { childList: true, subtree: true, attributes: !!o.done, attributeFilter: ['class'] });
    }
    seen = items().length; at = o.start || 0;
    paint(false);
    return { go: function(i){ at = i; paint(true); }, refresh: refresh, review: function(on){ o.done = null; reviewing = !!on; paint(false); }, head: head, nav: nav };
  }

  window.LevlStudio = { mount: mount, stepper: stepper, on: function(){ return !!current; }, get: function(){ return current; }, icon: icon };
})();
