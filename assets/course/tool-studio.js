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
     backLabel 'Back to all tools'   the back arrow's accessible name
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
                items: [{ label, onClick | href }],
                allTools: false | { label, href } (last item; default All tools) }
     slim     true                   bar only (reference pages; no About, footer stays)
     whyTitle 'Why' (tab label)
     detailsTitle 'Data & settings'  names the second tab AND the dock button that
                                    opens it: say what is in there (settings,
                                    tables, formulas). With nothing but About
                                    in it, the tab says 'About' and there is no
                                    dock button. Why holds explanation only.
     footer   selector               the site footer, moved to the end of About
                                     (default: the page's footer elements)
     quiz     ['test', 'review'] | true   which modes are a quiz (Practice / Test
                                    yourself). Default: quiz, practice, test,
                                    drill, predict, puzzle, chal, questions,
                                    practical; with no modes, a dock holding a
                                    stepper or a text box. true: always.
   Methods (all return s unless noted):
     s.add(region, els, { mode })   move els into 'stage' | 'dock' | 'why' |
                                    'details' | 'about'; with mode, they show
                                    only in that mode ('explore', 'practice'...)
     s.mode(v)                      switch modes (shows/hides mode-only parts)
     s.modes(m)                     set up or replace the mode switch (as opts.modes)
     s.caption(html, mode?)         set the caption line (polite live region)
     s.pills(list, side?, mode?)    result pills on the stage: list of
                                    { html, tone: 'accent'|'good'|'bad'|'warn'|
                                    'ghost'|'readout', k } ; side 'left' (default)
                                    or 'right'. Caption and pills are kept per
                                    mode (given, or the one showing) and come
                                    back when that mode does.
     s.open(tab, focusEl?, stay?)   open the sheet on 'why' | 'details' | 'about'
                                    (stay: a desktop drawer leaves focus where it is)
     s.reveal(el | [els])           scroll them above the sticky action row
     s.fit()                        re-fit the phone stage (after a big redraw)
     s.detailsTitle(t)              rename the second tab and its dock button
     s.close()
     s.enlarge(on?)                 the stage full screen (zoom, pinch); no arg -> state.
                                    opts.enlarge false hides the button. Hooks for tool
                                    CSS: .ls-phone (root), --ls-scale / --ls-zoom and
                                    .is-big (stage); docs/tools-calm.md "Phones"
     s.hint({ target, text, key, inside })  pulse + tooltip on target, once per tool
                                     (inside: true puts it inside a big target)
                                    per device; gone on first interaction
     s.suspend(on)                  hide the studio and give the page its
                                    chrome back (a Premium gate, an error)
     s.root, s.stage, s.dock, s.why, s.details, s.about   the regions
   LevlStudio.stepper(container, opts) -> { go(i, focus?), refresh(), review(on) }
     One step at a time over existing graded inputs. opts:
       items   selector (inside container) of the step elements
       submit  selector of an element to show only on the last step
       total   number | fn() -> number (default: items found)
       label   'Step'
       done    fn() -> true when graded (shows every step, for review); optional
     New items appearing later (a drill that appends the next step after a
     Check) are picked up and become current. Back/Next move between steps;
     Next stops at the last step that exists.
   .ls-act on a dock row keeps it in view at the dock's foot (primary actions).
   LevlStudio.on()                  true when a studio is mounted on the page

   Phones (portrait, <= 640 px): what the shell does for every tool
   -----------------------------------------------------------------
   - data-ls-primary on ONE dock control (a slider's wrapper, say
     <div class="bt-ctl bt-slider" data-ls-primary>) pins it on a phone: the
     studio moves it into a sticky band (.ls-pbar) just above the sticky
     action row, so the main slider is always on screen; on a wider screen
     (or Enlarge) it goes back where it was. Same node, so listeners and ids
     keep working; style it by its own class, not by its old parent. It
     follows its home's visibility (a mode-only parent hides it). Do not put
     it inside markup the tool rebuilds with innerHTML.
   - In a quiz mode (opts.quiz) the stage shrinks to its content (a text-only
     problem is just its text; an empty stage disappears), the caption is
     shown whole, and after Check / Next / Enter the current step's box (or
     the feedback) is scrolled above the sticky action row. s.reveal(el)
     does the same for any element.
   - A quiz answered by taps (a card bank, choice buttons) marks that group
     data-ls-answer: the fit and the reveal treat it like the current box.
   - In Explore the stage gives up height (down to 45% of the screen) so the dock fits
     down to its sticky action row on load; nothing is left under the row.
   - A clamped caption gets a "More" button. Coach bubbles sit below their
     target (above it only when there is no room), never over it.
   - On-stage text under 11 px is raised to 11 px (svg text by at most 2x;
     data-ls-text="keep" on an svg or text opts out). Sideways scrollers in
     the stage and dock get an edge fade while more is hidden that way. The
     dock clips sideways overflow, so no row can make the page scroll sideways.
   Root classes: .ls-quiz (a quiz mode showing), .has-pbar. CSS variables on
   <html>: --ls-act-h, the sticky action row's height, and --ls-pbar-h, the
   primary band's (0 when none). */
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
    sliders: '<path d="M4 7h10M18 7h2M4 17h4M12 17h8"/><circle cx="16" cy="7" r="2"/><circle cx="10" cy="17" r="2"/>',
    chev: '<path d="M9 6l6 6-6 6"/>',
    star: '<path d="M12 4l2.4 5 5.4.6-4 3.7 1.1 5.3L12 16l-4.9 2.6 1.1-5.3-4-3.7 5.4-.6z"/>',
    expand: '<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    minus: '<path d="M5 12h14"/>',
    rotate: '<rect x="3" y="8" width="13" height="12" rx="2"/><path d="M14 3a7 7 0 0 1 7 7M18.5 7.5L21 10l2.5-2.5"/>'
  };
  function mq(q){ try{ return matchMedia(q); }catch(e){ return null; } }
  // A phone in either orientation (the .ls-phone hook; docs/tools-calm.md).
  var PHONE = '(max-width: 640px), (max-width: 999.98px) and (max-height: 540px)';
  function icon(n, cls){ return '<svg class="ls-i' + (cls ? ' ' + cls : '') + '" viewBox="0 0 24 24" aria-hidden="true" focusable="false">' + ICON[n] + '</svg>'; }

  var current = null;

  function mount(opts){
    opts = opts || {};
    if(current) return current;
    var s = {}, mode = null, lastFocus = null, sheetOpen = false, tab = 'why';
    var menuO = opts.menu || {}, slim = !!opts.slim;
    var ids = { title: nid('t'), why: nid('why'), det: nid('det'), sheetH: nid('sh'), menu: nid('m'), cap: nid('cap') };

    var root = document.createElement('div');
    root.className = 'ls-root' + (slim ? ' ls-slim' : '');
    root.setAttribute('data-ls', '');
    root.innerHTML =
      '<header class="ls-bar">' +
        '<a class="ls-ib ls-back" href="' + esc(opts.back || '../tools.html') + '" aria-label="' + esc(opts.backLabel || 'Back to all tools') + '">' + icon('back') + '</a>' +
        '<h1 class="ls-title" id="' + ids.title + '"><span class="ls-title-t">' + esc(opts.title || document.title) + '</span>' +
          (opts.course ? ' <span class="ls-course">' + esc(opts.course) + '</span>' : '') + '</h1>' +
        '<span class="ls-sp"></span>' +
        (menuO.tutor === false ? '' : '<button type="button" class="ls-tutor-btn" data-ls-act="tutor"><span class="ls-tutor-dot">' + icon('bot') + '</span>Ask the tutor</button>') +
        (slim ? '' : '<button type="button" class="ls-ib ls-help" aria-label="Why? Explain what is on screen" aria-controls="' + ids.why + '">' + icon('help') + '</button>') +
        '<div class="ls-menu-wrap"><button type="button" class="ls-ib ls-more" aria-label="More" aria-haspopup="true" aria-expanded="false" aria-controls="' + ids.menu + '">' + icon('more') + '</button>' +
          '<div class="ls-menu" id="' + ids.menu + '" hidden></div></div>' +
      '</header>' +
      '<div class="ls-main"' + (slim ? ' hidden' : '') + '>' +
        '<section class="ls-stage" aria-label="' + esc((opts.title || 'Tool') + ': the picture') + '">' +
          '<div class="ls-zbar" role="group" aria-label="Zoom" hidden><span class="ls-zbar-t">' + esc(opts.title || '') + '</span>' +
            '<button type="button" class="ls-ib" data-z="-1" aria-label="Zoom out">' + icon('minus') + '</button>' +
            '<output class="ls-zval" aria-live="polite">100%</output>' +
            '<button type="button" class="ls-ib" data-z="1" aria-label="Zoom in">' + icon('plus') + '</button>' +
            '<button type="button" class="ls-ib ls-rot" aria-label="Rotate the view" hidden>' + icon('rotate') + '</button>' +
            '<button type="button" class="ls-ib ls-enl-x" aria-label="Close the enlarged picture">' + icon('close') + '</button></div>' +
          '<div class="ls-pills"><div class="ls-pills-l"></div><div class="ls-pills-r"></div></div>' +
          '<div class="ls-stage-body"></div>' +
          '<button type="button" class="ls-ib ls-enl" aria-label="Enlarge the picture" hidden>' + icon('expand') + '</button>' +
        '</section>' +
        '<section class="ls-dock" aria-label="Controls">' +
          '<div class="ls-modes"></div>' +
          '<div class="ls-cap"><div class="ls-capw"><p class="ls-caption" id="' + ids.cap + '" aria-live="polite"></p>' +
            '<button type="button" class="ls-capmore" aria-controls="' + ids.cap + '" aria-expanded="false" hidden>More</button></div>' +
            '<button type="button" class="ls-why" aria-controls="' + ids.why + '">' + icon('bulb') + '<span>Why?</span></button></div>' +
          '<div class="ls-dock-body"></div>' +
          '<button type="button" class="ls-detbtn" aria-controls="' + ids.det + '" hidden>' + icon('sliders') + '<span class="ls-detbtn-t"></span>' + icon('chev', 'ls-detbtn-c') + '</button>' +
        '</section>' +
        '<aside class="ls-sheet" aria-labelledby="' + ids.sheetH + '" tabindex="-1" hidden>' +
          '<div class="ls-grab" aria-hidden="true"></div>' +
          '<div class="ls-sheet-head"><h2 class="sr-only" id="' + ids.sheetH + '">Why and more</h2>' +
            '<div class="ls-seg ls-tabs" role="tablist" aria-label="Why, or the rest of the tool">' +
              '<button type="button" role="tab" id="' + ids.why + '-tab" aria-controls="' + ids.why + '" aria-selected="true" data-tab="why">' + esc(opts.whyTitle || 'Why') + '</button>' +
              '<button type="button" role="tab" id="' + ids.det + '-tab" aria-controls="' + ids.det + '" aria-selected="false" tabindex="-1" data-tab="details"></button>' +
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
    // A full tool owns the screen: no site header, course tabs or cover band (Olivier, 2026-10-26: "clicking on a
    // tool brought you to just the tool, like in full"). Slim reference pages keep the header on a desktop.
    if(!slim) document.body.classList.add('ls-full');

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
      if(region === 'details' || region === 'about') paintDet();
      if(mode) paintMode();
      return s;
    };
    /* The second tab is named for what it holds, and gets its own button in
       the dock, so settings and data are never found by tapping "Why?". */
    var detTitle = opts.detailsTitle || '', detBtn = q('.ls-detbtn'), detTab = q('.ls-tabs [data-tab=details]');
    function detHas(){
      return Array.prototype.some.call(detP.children, function(c){ return !c.hidden && !c.classList.contains('ls-off'); });
    }
    function paintDet(){
      if(!detTab) return;
      var has = detHas(), t = has ? (detTitle || 'Data & settings') : 'About';
      detTab.textContent = t;
      detBtn.hidden = !has;
      detBtn.querySelector('.ls-detbtn-t').textContent = t;
    }
    s.detailsTitle = function(t){ detTitle = t || ''; paintDet(); return s; };
    detBtn.addEventListener('click', function(){ sheetOpen && tab === 'details' ? s.close() : s.open('details'); });
    paintDet();
    function paintMode(){
      modeOnly.forEach(function(el){ el.classList.toggle('ls-off', el.getAttribute('data-ls-only').split(/\s+/).indexOf(mode) < 0); });
      paintDet();
      root.setAttribute('data-mode', mode || '');
    }

    /* ---------------- modes */
    var modeBtns = null, modesO = null;
    s.mode = function(v){
      if(v == null) return mode;
      mode = v;
      if(modeBtns) modeBtns.forEach(function(b){ var on = b.getAttribute('data-v') === v; b.setAttribute('aria-pressed', String(on)); b.classList.toggle('on', on); });
      paintMode();
      if(capEl){ showCap(); showPills(); }
      if(current === s){ fitN = 0; fitRevUntil = Date.now() + 2500; queueFit(30); queueTidy(true); }
      return s;
    };
    // One listener, for whatever s.modes() set last.
    modesEl.addEventListener('click', function(e){
      var m = modesO;
      if(!m || m.el) return;
      var b = e.target.closest('button[data-v]'); if(!b) return;
      var v = b.getAttribute('data-v');
      if(v === mode) return;
      s.mode(v);
      if(m.onChange) m.onChange(v);
    });
    function setupModes(m){
      modesEl.hidden = !m;
      if(!m) return;
      modesO = m;
      if(m.el){
        modeBtns = null;
        Array.prototype.slice.call(modesEl.children).forEach(function(c){ if(c !== m.el) modesEl.removeChild(c); });
        m.el.classList.add('ls-seg', 'ls-seg-adopted');
        modesEl.appendChild(m.el);
        if(m.value) s.mode(m.value);
        return;
      }
      modesEl.innerHTML = '<div class="ls-seg" role="group" aria-label="Mode">' + m.items.map(function(it){
        return '<button type="button" data-v="' + esc(it.value) + '" aria-pressed="false">' + esc(it.label) + '</button>';
      }).join('') + '</div>';
      modeBtns = Array.prototype.slice.call(modesEl.querySelectorAll('button'));
      s.mode(m.value || m.items[0].value);
    }

    /* ---------------- caption and pills */
    /* Caption and pills are kept per mode: s.caption(html, 'practice') sets
       the practice caption even while Explore is showing, and switching modes
       brings each mode's own back. Without a mode they belong to the mode
       showing now (or to the page when there are no modes). */
    var capBy = {}, pillBy = {};
    function key(m){ return m || mode || '*'; }
    function showCap(){ var h = capBy[key()]; if(h == null) h = capBy['*'] || ''; capEl.innerHTML = h; q('.ls-cap').classList.toggle('is-empty', !h); capEl.classList.remove('is-full'); paintMore(); }
    // A phone shows three lines of the caption; a tap (or "More") shows the rest (screen readers get it all).
    var capMore = q('.ls-capmore');
    function paintMore(){
      var full = capEl.classList.contains('is-full');
      capEl.classList.remove('is-full');
      var cut = capEl.scrollHeight > capEl.clientHeight + 2;
      capEl.classList.toggle('is-full', full && cut);
      capMore.hidden = !cut;
      capMore.setAttribute('aria-expanded', String(full && cut));
      capMore.textContent = full && cut ? 'Less' : 'More';
    }
    function toggleCap(){ if(capMore.hidden) return; capEl.classList.toggle('is-full'); var f = capEl.classList.contains('is-full'); capMore.setAttribute('aria-expanded', String(f)); capMore.textContent = f ? 'Less' : 'More'; }
    capEl.addEventListener('click', function(e){ if(!e.target.closest('a, button')) toggleCap(); });
    capMore.addEventListener('click', toggleCap);
    function showPills(){
      ['left', 'right'].forEach(function(side){
        var p = pillBy[key() + '|' + side]; if(p == null) p = pillBy['*|' + side] || '';
        q(side === 'right' ? '.ls-pills-r' : '.ls-pills-l').innerHTML = p;
      });
    }
    s.caption = function(html, m){ capBy[key(m)] = html || ''; if(key(m) === key() || key(m) === '*') showCap(); return s; };
    var TONES = { accent: 1, good: 1, bad: 1, warn: 1, ghost: 1, readout: 1 };
    s.pills = function(items, side, m){
      pillBy[key(m) + '|' + (side === 'right' ? 'right' : 'left')] = (items || []).filter(Boolean).map(function(p){
        var tone = TONES[p.tone] ? p.tone : 'accent';
        return '<span class="ls-pill ls-pill-' + tone + '">' + (p.k ? '<span class="ls-pill-k">' + p.k + '</span> ' : '') + '<span class="ls-pill-t">' + p.html + '</span></span>';
      }).join('');
      if(key(m) === key() || key(m) === '*') showPills();
      return s;
    };
    s.pill = function(html, tone, side, m){ return s.pills(html ? [{ html: html, tone: tone }] : [], side, m); };

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
        if(el !== document.activeElement && (el.offsetParent === null || el.tabIndex < 0)) return false;
        // In a closed <details> only its own summary is focusable.
        var d = el.parentNode && el.parentNode.closest ? el.parentNode.closest('details:not([open])') : null;
        return !d || (el.tagName === 'SUMMARY' && el.parentNode === d);
      });
    }
    s.open = function(t, focusEl, stay){
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
      [q('.ls-help'), q('.ls-why')].forEach(function(b){ if(b) b.setAttribute('aria-expanded', 'true'); });
      requestAnimationFrame(function(){
        sheet.classList.add('is-open');
        var f = focusEl || (t === 'about' ? q('.ls-about .ls-h') : null) || root.querySelector('.ls-tabs [aria-selected=true]');
        if(stay && !modal) f = null;
        if(f){ try{ f.focus({ preventScroll: t !== 'about' }); }catch(e){ f.focus(); } }
        if(t === 'about' && aboutS.scrollIntoView) aboutS.scrollIntoView({ block: 'start' });
        if(current === s) queueTidy();
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
      [q('.ls-help'), q('.ls-why')].forEach(function(b){ if(b) b.setAttribute('aria-expanded', 'false'); });
      var done = function(){ if(!sheetOpen) sheet.hidden = true; };
      if(reduced()) done(); else setTimeout(done, 260);
      if(lastFocus && document.contains(lastFocus) && lastFocus.focus){ try{ lastFocus.focus({ preventScroll: true }); }catch(e){ lastFocus.focus(); } }
      return s;
    };
    if(!slim) q('.ls-help').addEventListener('click', function(){ sheetOpen && tab === 'why' ? s.close() : s.open('why'); });
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

    /* ---------------- phone hook, Enlarge, zoom */
    /* .ls-phone on the root (a phone, either way up) and --ls-scale / --ls-zoom
       on the stage are the hooks a tool's CSS uses for on-stage text that is
       not inside a scaling svg. Enlarge puts the same stage (the same nodes,
       so drags and listeners keep working) over the whole screen: page
       fullscreen where the browser has it, a fixed overlay always; zoom is a
       real layout size (pinch, ctrl+wheel, + / -, the buttons), and every
       change sends the window 'resize' event tools already redraw on. */
    var stg = s.stageEl, big = false, zoom = 1, enlBtn = q('.ls-enl'), zbar = q('.ls-zbar'), zval = q('.ls-zval'),
      rotBtn = q('.ls-rot'), enlOff = opts.enlarge === false, phoneQ = mq(PHONE), preFocus = null, sizing = false;
    function paintScale(){
      var ph = !!(phoneQ && phoneQ.matches);
      root.classList.toggle('ls-phone', ph);
      stg.style.setProperty('--ls-zoom', String(zoom));
      stg.style.setProperty('--ls-scale', String(Math.round((ph ? 1.15 : 1) * zoom * 100) / 100));
    }
    if(phoneQ){ if(phoneQ.addEventListener) phoneQ.addEventListener('change', paintScale); else if(phoneQ.addListener) phoneQ.addListener(paintScale); }
    function remeasure(){
      requestAnimationFrame(function(){
        sizing = true;
        try{ window.dispatchEvent(new Event('resize')); stg.dispatchEvent(new CustomEvent('ls-stage', { detail: { big: big, zoom: zoom } })); }catch(e){}
        sizing = false;
      });
    }
    function hasPic(){
      return Array.prototype.some.call(stageBody.querySelectorAll('svg:not(.ls-i), canvas, img'), function(e){ return e.getBoundingClientRect().width >= 120; });
    }
    var picQ = 0;
    function paintEnl(){ picQ = 0; enlBtn.hidden = enlOff || big || !hasPic(); }
    if(window.MutationObserver) new MutationObserver(function(){ if(!picQ) picQ = requestAnimationFrame(paintEnl); }).observe(stageBody, { childList: true, subtree: true });
    function setZoom(z, cx, cy){
      z = Math.max(1, Math.min(4, Math.round(z * 100) / 100));
      var b = stageBody, r = b.getBoundingClientRect(), fx = cx == null ? r.width / 2 : cx - r.left, fy = cy == null ? r.height / 2 : cy - r.top;
      var px = (b.scrollLeft + fx) / zoom, py = (b.scrollTop + fy) / zoom;
      if(z === zoom && cx == null) return;
      var cs = getComputedStyle(b), w = b.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight),
        h = b.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
      zoom = z;
      b.classList.toggle('is-z', z > 1);
      b.style.setProperty('--ls-zw', Math.round(w * z) + 'px');
      b.style.setProperty('--ls-zh', Math.round(h * z) + 'px');
      b.scrollLeft = px * z - fx; b.scrollTop = py * z - fy;
      zval.textContent = Math.round(z * 100) + '%';
      paintScale();
    }
    function zoomBy(d){ setZoom(zoom * (d > 0 ? 1.5 : 1 / 1.5)); remeasure(); }
    function inert(on){ [q('.ls-bar'), s.dockEl, sheet].forEach(function(el){ if(on) el.setAttribute('inert', ''); else el.removeAttribute('inert'); }); }
    function fsEl(){ return document.fullscreenElement || document.webkitFullscreenElement || null; }
    function paintRot(){ rotBtn.hidden = !(big && fsEl() && screen.orientation && screen.orientation.lock); }
    s.enlarge = function(on){
      if(on === undefined) return big;
      if(!!on === big) return s;
      big = !!on;
      if(big){
        preFocus = document.activeElement;
        s.close(); setMenu(false);
        stg.classList.add('is-big'); root.classList.add('ls-big');
        stg.setAttribute('role', 'dialog'); stg.setAttribute('aria-modal', 'true');
        document.documentElement.classList.add('ls-lock');
        inert(true);
        zbar.hidden = false; enlBtn.hidden = true;
        var d = document.documentElement, rq = d.requestFullscreen || d.webkitRequestFullscreen;
        if(rq && !fsEl()){ try{ var p = rq.call(d); if(p && p.then) p.then(paintRot, function(){}); }catch(e){} }
        if(phoneQ && phoneQ.matches && innerHeight > innerWidth) say('Turn your phone sideways to see it wider.');
        q('.ls-enl-x').focus();
      } else {
        setZoom(1);
        stg.classList.remove('is-big'); root.classList.remove('ls-big');
        stg.removeAttribute('role'); stg.removeAttribute('aria-modal');
        if(!sheetOpen) document.documentElement.classList.remove('ls-lock');
        inert(false);
        zbar.hidden = true;
        try{ if(screen.orientation && screen.orientation.unlock) screen.orientation.unlock(); }catch(e){}
        if(fsEl()){ try{ var x = (document.exitFullscreen || document.webkitExitFullscreen).call(document); if(x && x.catch) x.catch(function(){}); }catch(e){} }
        paintEnl();
        var f = enlBtn.hidden ? preFocus : enlBtn;
        if(f && f.focus && document.contains(f)){ try{ f.focus({ preventScroll: true }); }catch(e){ f.focus(); } }
      }
      paintRot(); paintScale(); remeasure();
      return s;
    };
    enlBtn.addEventListener('click', function(){ s.enlarge(true); });
    q('.ls-enl-x').addEventListener('click', function(){ s.enlarge(false); });
    zbar.addEventListener('click', function(e){ var b = e.target.closest('[data-z]'); if(b) zoomBy(+b.getAttribute('data-z')); });
    rotBtn.addEventListener('click', function(){
      var o = screen.orientation, t = /landscape/.test(o.type) ? 'portrait' : 'landscape';
      o.lock(t).catch(function(){ say('Turn your phone to rotate the view.'); });
    });
    ['fullscreenchange', 'webkitfullscreenchange'].forEach(function(t){
      document.addEventListener(t, function(){ if(!fsEl() && big) s.enlarge(false); else { paintRot(); remeasure(); } });
    });
    stg.addEventListener('keydown', function(e){
      if(!big) return;
      if(e.key === 'Escape'){ e.preventDefault(); e.stopPropagation(); s.enlarge(false); return; }
      var typing = e.target.matches && e.target.matches('input, select, textarea, [contenteditable]');
      if(!typing && (e.key === '+' || e.key === '=' || e.key === '-')){ e.preventDefault(); zoomBy(e.key === '-' ? -1 : 1); return; }
      if(e.key !== 'Tab') return;
      var f = Array.prototype.filter.call(stg.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])'), function(el){ return el.offsetParent !== null || el === document.activeElement; });
      if(!f.length) return;
      if(e.shiftKey && document.activeElement === f[0]){ e.preventDefault(); f[f.length - 1].focus(); }
      else if(!e.shiftKey && document.activeElement === f[f.length - 1]){ e.preventDefault(); f[0].focus(); }
    });
    stageBody.addEventListener('wheel', function(e){
      if(!big || !e.ctrlKey) return;
      e.preventDefault(); setZoom(zoom * (e.deltaY < 0 ? 1.1 : 1 / 1.1), e.clientX, e.clientY); remeasure();
    }, { passive: false });
    // Two fingers: pinch to zoom, move to pan (one finger stays with the tool).
    (function(){
      var g = null, raf = 0, last = null;
      function mid(t){ return { x: (t[0].clientX + t[1].clientX) / 2, y: (t[0].clientY + t[1].clientY) / 2, d: Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY) || 1 }; }
      stageBody.addEventListener('touchstart', function(e){
        if(!big || e.touches.length !== 2) return;
        var m = mid(e.touches), r = stageBody.getBoundingClientRect();
        g = { z: zoom, d: m.d, px: (stageBody.scrollLeft + m.x - r.left) / zoom, py: (stageBody.scrollTop + m.y - r.top) / zoom };
      }, { passive: true });
      stageBody.addEventListener('touchmove', function(e){
        if(!g || e.touches.length !== 2) return;
        e.preventDefault();
        last = mid(e.touches);
        if(raf) return;
        raf = requestAnimationFrame(function(){
          raf = 0;
          var z = Math.max(1, Math.min(4, g.z * last.d / g.d)), r = stageBody.getBoundingClientRect();
          setZoom(z);
          stageBody.scrollLeft = g.px * zoom - (last.x - r.left); stageBody.scrollTop = g.py * zoom - (last.y - r.top);
        });
      }, { passive: false });
      function end(e){ if(g && e.touches.length < 2){ g = null; remeasure(); } }
      stageBody.addEventListener('touchend', end); stageBody.addEventListener('touchcancel', end);
    })();
    window.addEventListener('resize', function(){
      if(sizing) return;
      paintScale();
      if(big && zoom > 1) setZoom(zoom, 0, 0);
    });
    paintScale();

    /* ---------------- phone layout (see "Phones" in the header) */
    var PORTRAIT = mq('(max-width: 640px)'), QUIZ = opts.quiz === true ? true : (opts.quiz || ['quiz', 'practice', 'test', 'drill', 'predict', 'puzzle', 'chal', 'questions', 'practical']);
    var ACT = '.ls-act, .bt-actions, :is(div,p):has(> .btn-press,> .ls-pri):not(:has(input,select,textarea,fieldset,.ls-stepper,.ls-act))';
    var dockEl = s.dockEl, de = document.documentElement;
    function portrait(){ return !!(PORTRAIT && PORTRAIT.matches); }
    function shown(el){ return !!el && el.getClientRects().length > 0 && !el.closest('[hidden], .ls-off, .ls-step-off'); }
    function isQuiz(){
      if(QUIZ === true) return true;
      if(mode) return QUIZ.indexOf(mode) >= 0;
      return !!dockBody.querySelector('.ls-stepper, input[type=text], input:not([type]), input[type=number], textarea');
    }
    // The sticky action row(s) showing now, and the band of the screen above them.
    function actRows(){
      return Array.prototype.filter.call(dockEl.querySelectorAll(ACT), function(el){ return shown(el) && getComputedStyle(el).position === 'sticky'; });
    }
    function paintActH(){
      var h = 0;
      actRows().forEach(function(el){ h = Math.max(h, el.getBoundingClientRect().height); });
      de.style.setProperty('--ls-act-h', Math.round(h) + 'px');
      var pb = q('.ls-pbar');
      de.style.setProperty('--ls-pbar-h', (pb && !pb.hidden ? Math.round(pb.getBoundingClientRect().height) : 0) + 'px');
    }
    function scroller(el){
      for(var p = el.parentElement; p && p !== document.body; p = p.parentElement){
        var oy = getComputedStyle(p).overflowY;
        if((oy === 'auto' || oy === 'scroll') && p.scrollHeight > p.clientHeight + 1 && !p.classList.contains('ls-stage-body')) return p;
      }
      return null;
    }
    /* s.reveal(el | [els]): scroll the page (or the dock, where it scrolls)
       just enough that the elements sit above the sticky action row. */
    var revAgain = [];
    s.reveal = function(els, again){
      els = list(els).filter(shown);
      if(!els.length || big || sheetOpen && !wide()) return s;
      /* A tool often redraws (a figure, a stage re-fit) just after the answer
         that asked for this, which moves the page under the scroll: look
         again twice as that settles and close the gap without animating. */
      if(!again){
        revAgain.forEach(clearTimeout);
        revAgain = [450, 1000].map(function(t){ return setTimeout(function(){ s.reveal(els, true); }, t); });
      }
      var box = null;
      els.forEach(function(el){ var b = el.getBoundingClientRect(); box = box ? { top: Math.min(box.top, b.top), bottom: Math.max(box.bottom, b.bottom) } : { top: b.top, bottom: b.bottom }; });
      var sc = scroller(els[0]), top = 8, bot = innerHeight - 8;
      if(sc){ var r = sc.getBoundingClientRect(); top = r.top + 8; bot = Math.min(bot, r.bottom - 8); }
      actRows().concat([q('.ls-pbar')]).forEach(function(a){
        if(!a || !shown(a) || els.some(function(e){ return a.contains(e); })) return;
        var b = a.getBoundingClientRect();
        if(b.bottom >= bot - 4 && b.top < bot) bot = Math.min(bot, b.top - 8);
      });
      var dy = 0;
      if(box.bottom > bot) dy = box.bottom - bot;
      if(box.top - dy < top) dy = box.top - top;
      if(Math.abs(dy) < (again ? 6 : 2)) return s;
      var smooth = reduced() || again ? 'auto' : 'smooth';
      if(sc) sc.scrollBy({ top: dy, behavior: smooth }); else window.scrollBy({ top: dy, behavior: smooth });
      return s;
    };
    /* data-ls-answer: a tool whose answers are taps (a bank of cards, a row of
       choice buttons) marks that group; it counts as the current answer box.
       Its first ~2 rows are what must show, so a tall bank stands in by a
       child near its top. */
    function answerEl(){
      var a = Array.prototype.filter.call(root.querySelectorAll('.ls-dock [data-ls-answer]'), function(el){ return shown(el) && el.offsetHeight > 0; })[0];
      if(!a) return null;
      var top = a.getBoundingClientRect().top, kids = Array.prototype.filter.call(a.querySelectorAll('button, [role=button], label'), shown), pick = a;
      kids.forEach(function(k){ var b = k.getBoundingClientRect(); if(b.bottom - top <= 120) pick = k; });
      return pick;
    }
    function fillable(el){ return el.matches('select') ? !el.value : !el.value || !String(el.value).trim(); }
    function revealNow(changed){
      var a = document.activeElement, t = [];
      var boxes = Array.prototype.filter.call(root.querySelectorAll('.ls-stage-body input:not([type=hidden]):not([type=radio]):not([type=checkbox]):not([type=range]):not([readonly]):not([disabled]), .ls-dock input:not([type=hidden]):not([type=radio]):not([type=checkbox]):not([type=range]):not([readonly]):not([disabled]), .ls-root select:not([disabled]), .ls-root textarea:not([readonly])'), function(el){ return shown(el) && !el.closest('.ls-sheet, .ls-bar'); });
      var empty = boxes.filter(fillable)[0];
      if(changed && changed.length) t = changed;
      else if(empty) t = [empty];
      else if(answerEl()) t = [answerEl()];
      else if(a && boxes.indexOf(a) >= 0) t = [a];
      if(t.length === 1 && t[0] !== empty && empty && Math.abs(empty.getBoundingClientRect().top - t[0].getBoundingClientRect().top) < 240) t.push(empty);
      if(t.length) s.reveal(t);
    }
    // After Check / Next / Enter in a quiz: the current box (or the feedback) comes into view.
    function liveText(){ return Array.prototype.map.call(dockBody.querySelectorAll('[role=status], [aria-live], .bt-result, .cd-fb'), function(el){ return [el, el.textContent]; }); }
    var revQ = 0;
    function queueReveal(before){
      if(!isQuiz()) return;
      clearTimeout(revQ);
      revQ = setTimeout(function(){
        requestAnimationFrame(function(){
          var changed = (before || []).filter(function(p){ return p[0].textContent !== p[1] && p[0].textContent.trim() && shown(p[0]); }).map(function(p){ return p[0]; });
          paintActH(); revealNow(changed.slice(-1));
        });
      }, 90);
    }
    // The live text as it was before the tool's own click handler ran (capture phase).
    var liveBefore = null;
    root.addEventListener('click', function(e){ liveBefore = isQuiz() && e.target.closest && e.target.closest('button, [role=button], input[type=submit]') ? liveText() : null; }, true);
    root.addEventListener('click', function(e){
      var b = e.target.closest('button, [role=button], input[type=submit]');
      // A Check the tool swaps out (for Next) while handling the click is no longer in the page: still reveal.
      if(!b || b.isConnected && (!root.querySelector('.ls-main').contains(b) || b.closest('.ls-sheet, .ls-zbar, .ls-modes, .ls-cap'))) return;
      queueReveal(liveBefore || liveText());
      liveBefore = null;
    });
    root.addEventListener('keydown', function(e){
      if(e.key === 'Enter' && e.target.matches && e.target.matches('input, select')) queueReveal(liveText());
    });
    s.revealStep = function(el){ if(isQuiz()) queueReveal([]); return s; };

    /* The stage on a phone (portrait): in a quiz it shrinks to what it holds
       (text only: its text; nothing: gone); with a picture, it gives up
       height so the current box and the action row fit. Outside a quiz it
       gives up height (to 300 px) so the dock fits down to its sticky row. */
    function pic(){
      return Array.prototype.some.call(stageBody.querySelectorAll('svg:not(.ls-i), canvas, img, video'), function(e){ var b = e.getBoundingClientRect(); return b.width >= 60 && b.height >= 40 && !e.closest('.ls-off, [hidden]'); });
    }
    function holds(){
      if(q('.ls-pills .ls-pill')) return true;
      return Array.prototype.some.call(stageBody.children, function(c){ return shown(c) && (c.textContent.trim() || c.querySelector('svg, canvas, img, video, input, button')); });
    }
    function naturalBottom(el){
      var ps = el.style.position; el.style.position = 'static';
      var b = el.getBoundingClientRect().bottom + window.scrollY;
      el.style.position = ps;
      return b;
    }
    var fitT = 0, fitW = innerWidth;
    function fit(){
      fitT = 0;
      var quiz = isQuiz();
      root.classList.toggle('ls-quiz', quiz);
      paintPrimary();
      var kind = '', sh = null;
      if(portrait() && !big){
        var hasPic = pic();
        if(quiz && !hasPic) kind = holds() ? 'ls-q-text' : 'ls-q-none';
        else {
          // From the stage's height now (no reset, so a tool that redraws on
          // resize settles): what it must give up for the dock to fit.
          var rows = actRows(), cur = stg.getBoundingClientRect().height, need = -1e4, lim = innerHeight + window.scrollY - 8;
          var full = Math.max(300, Math.round(innerHeight * 0.62)), floor = quiz ? Math.min(240, Math.round(innerHeight * 0.3)) : Math.max(300, Math.round(innerHeight * 0.45));
          rows.forEach(function(r){ need = Math.max(need, naturalBottom(r) - lim); });
          if(quiz){
            var inp = answerEl() || Array.prototype.filter.call(dockBody.querySelectorAll('input:not([type=hidden]):not([type=checkbox]):not([type=range]):not([type=search]), select, textarea'), function(el){ return shown(el) && !el.closest('details:not([open])'); })[0];
            if(inp){
              // A choice question: aim for its second option too (one option alone reads as the only one).
              if(inp.type === 'radio' && inp.name){
                var grp = Array.prototype.filter.call(dockBody.querySelectorAll('input[type=radio]'), function(r){ return r.name === inp.name && shown(r); });
                if(grp[1]) inp = grp[1];
              }
              inp = inp.closest('.bt-radio, label') || inp;
              var ah = 0; rows.forEach(function(r){ ah = Math.max(ah, r.getBoundingClientRect().height); });
              need = Math.max(need, inp.getBoundingClientRect().bottom + window.scrollY + ah + 12 - lim);
            }
          }
          var want = Math.round(Math.min(full, Math.max(floor, cur - need)));
          if(want < full - 1) sh = want;
        }
        /* A long problem (or a stage that is all text): even the smallest stage
           leaves the answer under the row, so just after load or a mode switch,
           while the student has not scrolled, the page scrolls to show it. */
        if(quiz && Date.now() < fitRevUntil){
          clearTimeout(fitRevT);
          fitRevT = setTimeout(function(){
            if(window.scrollY > 4 || Date.now() > fitRevUntil) return;
            var t = answerEl() || Array.prototype.filter.call(dockBody.querySelectorAll('input:not([type=hidden]):not([type=checkbox]):not([type=range]):not([type=search]), select, textarea'), function(el){ return shown(el) && !el.closest('details:not([open])'); })[0];
            if(!t) return;
            if(t.type === 'radio' && t.name){ var g = Array.prototype.filter.call(dockBody.querySelectorAll('input[type=radio]'), function(r){ return r.name === t.name && shown(r); }); if(g[1]) t = g[1]; }
            t = t.closest('.bt-radio, label') || t;
            var line = innerHeight; actRows().forEach(function(r){ line = Math.min(line, r.getBoundingClientRect().top); });
            if(t.getBoundingClientRect().bottom > line - 4) s.reveal(t, true);
          }, 260);
        }
      }
      var moved = false;
      ['ls-q-text', 'ls-q-none'].forEach(function(c){ if(stg.classList.contains(c) !== (c === kind)){ stg.classList.toggle(c, c === kind); moved = true; } });
      var had = stg.style.getPropertyValue('--ls-sh');
      if(sh == null){ if(had){ stg.style.removeProperty('--ls-sh'); moved = true; } }
      else if(Math.abs(parseFloat(had || '0') - sh) > 2){ stg.style.setProperty('--ls-sh', sh + 'px'); moved = true; }
      paintActH();
      // The tool redraws for its new stage size (window resize and ls-stage, as Enlarge does).
      if(moved && fitN++ < 6) remeasure();
    }
    var fitN = 0, fitRevT = 0, fitRevUntil = Date.now() + 3500;
    function queueFit(d){ clearTimeout(fitT); fitT = setTimeout(function(){ requestAnimationFrame(fit); }, d || 60); }
    s.fit = function(){ fitN = 0; queueFit(0); return s; };
    if(PORTRAIT){ if(PORTRAIT.addEventListener) PORTRAIT.addEventListener('change', function(){ queueFit(); }); else if(PORTRAIT.addListener) PORTRAIT.addListener(function(){ queueFit(); }); }
    window.addEventListener('resize', function(){ if(sizing || innerWidth === fitW) return; fitW = innerWidth; queueFit(120); });
    // The layout settles after fonts and the tool's first draws.
    [150, 700, 1600].forEach(function(t){ setTimeout(function(){ queueFit(0); }, t); });
    window.addEventListener('load', function(){ queueFit(100); });
    // A quiz stage follows its content (a new problem with or without a figure).
    if(window.MutationObserver) new MutationObserver(function(){ if(isQuiz() || root.classList.contains('ls-quiz')) queueFit(120); }).observe(stageBody, { childList: true, subtree: true });

    /* data-ls-primary: the tool's main control rides in a sticky band above
       the action row on a phone (portrait), and goes home everywhere else. */
    var pbar = document.createElement('div');
    pbar.className = 'ls-pbar'; pbar.hidden = true;
    dockEl.insertBefore(pbar, q('.ls-detbtn'));
    var prim = null, pmark = null;
    function paintPrimary(){
      var el = prim || dockBody.querySelector('[data-ls-primary]');
      if(!el){ pbar.hidden = true; return; }
      if(!prim){
        prim = el; pmark = document.createElement('span'); pmark.className = 'ls-pmark'; pmark.hidden = true; el.parentNode.insertBefore(pmark, el);
        // Its own hidden state or mode (s.add with { mode }) shows or hides the band.
        if(window.MutationObserver) new MutationObserver(function(){ if(prim === el){ paintPrimary(); paintActH(); } }).observe(el, { attributes: true, attributeFilter: ['hidden', 'class'] });
      }
      var home = pmark.parentElement, out = portrait() && !big && home && document.contains(pmark) && shown(home);
      if(out && prim.parentNode !== pbar){ pbar.appendChild(prim); root.classList.add('has-pbar'); }
      else if(!out && prim.parentNode === pbar && document.contains(pmark)){ pmark.parentNode.insertBefore(prim, pmark.nextSibling); root.classList.remove('has-pbar'); }
      if(!document.contains(pmark)){ if(prim.parentNode === pbar) pbar.removeChild(prim); prim = pmark = null; root.classList.remove('has-pbar'); }
      var on = !!(prim && pbar.children.length && !prim.hidden && !prim.classList.contains('ls-off'));
      if(pbar.hidden !== !on) pbar.hidden = !on;
      root.classList.toggle('has-pbar', on);
      // Just before the action row, so the two stack in the same order
      // stuck or not (a stepper's own children stay its steps).
      var rows = pbar.hidden ? [] : actRows().filter(function(r){ return r !== pbar && !pbar.contains(r); }), at = rows[rows.length - 1];
      var spot = at && !at.parentNode.classList.contains('ls-stepper') ? at : null;
      if(spot){ if(pbar.nextSibling !== spot) spot.parentNode.insertBefore(pbar, spot); }
      else if(pbar.parentNode !== dockEl) dockEl.insertBefore(pbar, q('.ls-detbtn'));
    }

    /* Sideways scrollers in the stage and dock: an edge fade while more is
       hidden that way. Rows of chips that stick out without scrolling wrap.
       Phone text under 11 px on the stage is raised (see the header). */
    function edge(el){
      var max = el.scrollWidth - el.clientWidth;
      el.classList.toggle('ls-xs', el.scrollLeft > 2);
      el.classList.toggle('ls-xe', el.scrollLeft < max - 2);
    }
    function chipRow(el){
      var k = el.children;
      if(k.length < 2) return false;
      for(var i = 0; i < k.length; i++){ var t = k[i].tagName; if(!/^(BUTTON|SPAN|LABEL|A|B|I|EM|STRONG|LI)$/.test(t) || k[i].getBoundingClientRect().width > el.clientWidth * 0.7) return false; }
      return true;
    }
    function sweep(){
      (sheetOpen ? [stageBody, dockBody, pbar, sheet] : [stageBody, dockBody, pbar]).forEach(function(box){
        Array.prototype.forEach.call(box.querySelectorAll('*'), function(el){
          if(el instanceof SVGElement || !el.children.length || !shown(el)) return;
          var over = el.scrollWidth > el.clientWidth + 1;
          if(!over){ if(el.classList.contains('ls-xf')) el.classList.remove('ls-xf', 'ls-xs', 'ls-xe'); return; }
          var cs = getComputedStyle(el);
          if(cs.overflowX === 'auto' || cs.overflowX === 'scroll'){
            if(!el.classList.contains('ls-xf') && !/linear-gradient/.test(cs.webkitMaskImage || cs.maskImage || '')){ el.classList.add('ls-xf'); el.addEventListener('scroll', function(){ edge(el); }, { passive: true }); }
            if(el.classList.contains('ls-xf')) edge(el);
          } else if(cs.display === 'flex' && cs.flexDirection === 'row' && cs.flexWrap === 'nowrap' && portrait() && chipRow(el)) el.classList.add('ls-xw');
        });
      });
    }
    // Text is raised as it appears (in the observer, before it is painted),
    // so a tool that redraws every frame does not flicker.
    var FS0 = 'data-ls-fs0';
    function unbump(){ Array.prototype.forEach.call(stageBody.querySelectorAll('[' + FS0 + ']'), function(el){ el.style.fontSize = el.getAttribute(FS0); el.removeAttribute(FS0); }); }
    function bumpOn(){ return !!(phoneQ && phoneQ.matches) && !big; }
    function raise(el, px){ if(!el.hasAttribute(FS0)) el.setAttribute(FS0, el.style.fontSize || ''); el.style.fontSize = (Math.round(px * 100) / 100) + 'px'; }
    function bumpIn(box){
      if(!bumpOn() || !box || box.nodeType !== 1 || box.closest('[data-ls-text=keep]')) return;
      var texts = box.matches('text, tspan, textPath') ? [box] : box.querySelectorAll('text, tspan, textPath');
      Array.prototype.forEach.call(texts, function(t){
        if(t.hasAttribute(FS0) || t.closest('[data-ls-text=keep]') || !t.textContent.trim()) return;
        var m = t.getScreenCTM && t.getScreenCTM(); if(!m) return;
        var fs = parseFloat(getComputedStyle(t).fontSize), k = Math.hypot(m.a, m.b), eff = fs * k;
        if(!(eff > 0) || eff >= 10.95) return;
        if(t.tagName !== 'text' && t.parentNode && parseFloat(getComputedStyle(t.parentNode).fontSize) === fs) return;
        raise(t, fs * Math.min(2, 11 / eff));
      });
      if(box instanceof SVGElement) return;
      var els = [box].concat(Array.prototype.slice.call(box.querySelectorAll('*')));
      els.forEach(function(el){
        if(el instanceof SVGElement || el.hasAttribute(FS0) || /^(SUB|SUP|CANVAS|INPUT|SELECT|TEXTAREA|OPTION)$/.test(el.tagName) || el.closest('[data-ls-text=keep]')) return;
        if(!Array.prototype.some.call(el.childNodes, function(n){ return n.nodeType === 3 && n.textContent.trim(); }) || !el.getClientRects().length) return;
        var fs = parseFloat(getComputedStyle(el).fontSize);
        if(fs > 0 && fs < 10.95) raise(el, 11);
      });
    }
    function bump(){ unbump(); bumpIn(stageBody); }
    if(window.MutationObserver) new MutationObserver(function(recs){
      if(!bumpOn()) return;
      var seen = [];
      recs.forEach(function(r){
        var list = r.type === 'characterData' ? [r.target.parentNode] : Array.prototype.slice.call(r.addedNodes);
        list.forEach(function(n){ if(n && n.nodeType === 3) n = n.parentNode; if(n && n.nodeType === 1 && seen.indexOf(n) < 0){ seen.push(n); } });
      });
      seen.forEach(function(n){ if(n.isConnected && !seen.some(function(o){ return o !== n && o.contains(n); })) bumpIn(n.matches('tspan') ? n.closest('text') || n : n); });
    }).observe(stageBody, { childList: true, subtree: true, characterData: true });
    // tidy: edge fades, wrapping rows, the action row's height (after any
    // change, at most every 400 ms); a resize or Enlarge also re-raises text.
    var tidyT = 0, tidyAt = 0, tidyAll = false;
    function tidy(){ tidyT = 0; tidyAt = Date.now(); if(tidyAll){ tidyAll = false; bump(); } sweep(); paintActH(); }
    function queueTidy(all){
      if(all) tidyAll = true;
      if(tidyT) return;
      tidyT = setTimeout(function(){ requestAnimationFrame(tidy); }, Math.max(60, 400 - (Date.now() - tidyAt)));
    }
    if(window.MutationObserver){
      var mo = new MutationObserver(function(){ queueTidy(); });
      [stageBody, dockBody].forEach(function(b){ mo.observe(b, { childList: true, subtree: true }); });
    }
    window.addEventListener('resize', function(){ if(!sizing) queueTidy(true); });
    stg.addEventListener('ls-stage', function(){ queueTidy(true); queueFit(80); });
    [200, 900, 1800].forEach(function(t){ setTimeout(function(){ queueTidy(true); }, t); });

    /* The worked solution opens by itself when a quiz problem ends: a
       .bt-solution (or [data-ls-solution]) put in Why while a quiz shows.
       opts.autoSolution false turns it off. */
    var solLast = '';
    if(window.MutationObserver && opts.autoSolution !== false) new MutationObserver(function(recs){
      var hit = null;
      recs.forEach(function(r){ Array.prototype.forEach.call(r.addedNodes, function(n){
        if(n.nodeType !== 1) return;
        var el = n.matches('.bt-solution, [data-ls-solution]') ? n : n.querySelector('.bt-solution, [data-ls-solution]');
        if(el && el.textContent.trim() && el.textContent !== solLast) hit = el;
      }); });
      if(!hit || !isQuiz() || sheetOpen || big) return;
      solLast = hit.textContent;
      hit.hidden = false;
      // A phone: the sheet (focus moves into it, Close brings it back). A
      // desktop: the drawer opens beside the dock and focus stays put.
      // Course drill engines leave this to the shell (one open per problem end).
      // On a phone focus goes to the solution's heading, so a screen reader
      // starts there; closing returns to what had focus (New problem).
      setTimeout(function(){
        if(sheetOpen || !whyP.contains(hit) || !isQuiz()) return;
        var h = hit.querySelector('h2, h3, h4');
        if(h && !h.hasAttribute('tabindex')) h.setAttribute('tabindex', '-1');
        s.open('why', h || null, wide());
      }, 600);
    }).observe(whyP, { childList: true, subtree: true });

    /* ---------------- menu */
    function say(t){ toast.textContent = t; toast.classList.add('show'); clearTimeout(say.t); say.t = setTimeout(function(){ toast.classList.remove('show'); toast.textContent = ''; }, 3200); }
    s.say = say;
    s.modes = function(m){ setupModes(m); return s; };
    var acts = {};
    function item(key, ic, label, extra){ return '<button type="button" class="ls-mi" data-ls-act="' + key + '"' + (extra || '') + '>' + icon(ic) + '<span>' + label + '</span></button>'; }
    function buildMenu(){
      var h = '';
      if(menuO.copyLink){ h += item('copy', 'link', 'Copy link to this setup'); acts.copy = copyLink; }
      if(!slim){ h += item('about', 'info', 'About this tool'); acts.about = function(){ s.open('about'); }; }
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
      var all = menuO.allTools;
      if(all !== false){
        all = all && typeof all === 'object' ? all : {};
        h += '<a class="ls-mi" href="' + esc(all.href || opts.back || '../tools.html') + '">' + icon(all.icon || 'grid') + '<span>' + esc(all.label || 'All tools') + '</span></a>';
      }
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
      if(!slim) document.body.classList.toggle('ls-full', !on);
      document.documentElement.classList.toggle('ls-page', !on);
      return s;
    };

    /* ---------------- hint */
    s.hint = function(o){ return hint(s, o, opts.slug); };

    /* The site footer (legal links, the course's notes) goes to the end of
       About, so the page is exactly one screen and nothing is lost. */
    // About is in main, where a <footer> may not be (check-a11y): a moved one becomes a group.
    function unfooter(f){
      var d = document.createElement('div');
      d.className = (f.className ? f.className + ' ' : '') + 'ls-foot-c';
      d.setAttribute('role', 'group'); d.setAttribute('aria-label', 'Site links');
      while(f.firstChild) d.appendChild(f.firstChild);
      f.parentNode.replaceChild(d, f);
      return d;
    }
    list(opts.footer || (slim ? null : 'body > footer, body > .xshell > footer, body > .bio-foot, body > .chem-foot, body > .phys-foot, body > .calc-foot, body > .stat-foot')).forEach(function(f){
      if(!f.parentNode || root.contains(f)) return;
      var wrap = f.parentNode !== document.body && f.parentNode.children.length === 1 ? f.parentNode : f;
      aboutB.appendChild(wrap);
      if(wrap.tagName === 'FOOTER') wrap = unfooter(wrap);
      wrap.classList.add('ls-foot');
      Array.prototype.slice.call(wrap.querySelectorAll('footer')).forEach(unfooter);
      aboutS.hidden = false;
    });

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
    function find(){ return typeof o.target === 'string' ? s.root.querySelector(o.target) || document.querySelector(o.target) : o.target; }
    var target = find();
    if(!target) return null;
    var ring = document.createElement('div'), tip = document.createElement('div');
    ring.className = 'ls-halo' + (reduced() ? ' is-static' : '');
    ring.setAttribute('aria-hidden', 'true');
    tip.className = 'ls-coach';
    tip.setAttribute('role', 'note');
    tip.innerHTML = icon('tap') + '<span>' + esc(o.text) + '</span>';
    document.body.appendChild(ring); document.body.appendChild(tip);
    // Screen readers: the tip describes the target, and only while it shows.
    tip.id = nid('hint');
    function describe(el, on){
      var ids = (el.getAttribute('aria-describedby') || '').split(/\s+/).filter(function(x){ return x && x !== tip.id; });
      if(on) ids.push(tip.id);
      if(ids.length) el.setAttribute('aria-describedby', ids.join(' ')); else el.removeAttribute('aria-describedby');
    }
    describe(target, true);
    var gone = false, raf = 0;
    function box(sel){ var e = s.root.querySelector(sel); if(!e || !e.offsetParent) return null; var b = e.getBoundingClientRect(); return b.width && b.height ? b : null; }
    function over(a, b){ return b ? Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left)) * Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top)) : 0; }
    function place(){
      raf = 0;
      if(gone) return;
      // A tool that redraws its parts replaces the target: follow the new one.
      if(!document.contains(target)){
        var t = find();
        if(t && t !== target){ describe(target, false); target = t; describe(target, true); }
      }
      var r = target.getBoundingClientRect();
      if(!r.width && !r.height){ ring.style.display = tip.style.display = 'none'; return; }
      ring.style.display = tip.style.display = '';
      var sx = window.scrollX, sy = window.scrollY, pad = 4, vw0 = document.documentElement.clientWidth;
      // The ring never reaches past the viewport's sides: a full-width target
      // (a row, a figure) would otherwise push it out by the padding and make
      // the page scroll sideways on a phone. Its outer glow is a shadow, which
      // never adds scroll.
      var rl = Math.max(0, r.left - pad), rr2 = Math.min(vw0, r.right + pad);
      ring.style.left = (rl + sx) + 'px'; ring.style.top = (r.top + sy - pad) + 'px';
      ring.style.width = Math.max(0, rr2 - rl) + 'px'; ring.style.height = (r.height + pad * 2) + 'px';
      var round = Math.min(r.width, r.height) / 2 + pad;
      ring.style.borderRadius = (o.round != null ? o.round : round) + 'px';
      var tw = tip.offsetWidth, th = tip.offsetHeight, vw = document.documentElement.clientWidth, vh = window.innerHeight;
      // Below the target (above it only when there is no room below), never
      // over it: the bubble points at the thing and leaves its text readable.
      var reg = target.closest('.ls-stage, .ls-dock'), rr = reg ? reg.getBoundingClientRect() : null;
      var lo = Math.max(8, rr ? rr.left + 4 : 8), hi = Math.min(vw - 8, rr ? rr.right - 4 : vw - 8);
      var left = Math.max(lo, Math.min(hi - tw, r.left + r.width / 2 - 28));
      if(left < 8) left = 8;
      // The sticky action row and the primary band at the foot of the screen
      // count as off-screen for a bubble pointing at something else.
      var foot = vh - 8;
      Array.prototype.forEach.call(s.root.querySelectorAll('.ls-pbar, .ls-dock .ls-act, .ls-dock .bt-actions'), function(a){
        if(!a.offsetParent || a.contains(target) || target.contains(a)) return;
        var b = a.getBoundingClientRect();
        if(b.height && b.bottom >= vh - 4 && b.top < foot) foot = b.top - 4;
      });
      var keep = [box('.ls-bar'), box('.ls-cap')], best = null;
      [r.bottom + 12, r.top - th - 12].forEach(function(top, i){
        var t0 = Math.max(8, Math.min(top, vh - 8 - th));
        var c = { left: left, right: left + tw, top: t0, bottom: t0 + th };
        var cost = over(c, r) * 50 + over(c, keep[0]) * 4 + over(c, keep[1]) * 2 + (t0 + th > foot ? 1e5 + (t0 + th - foot) * 100 : 0) + Math.abs(t0 - top) * 10 + (i ? 1 : 0);
        if(!best || cost < best.cost) best = { cost: cost, top: t0, below: i === 0 };
      });
      // A large text box: sit inside it, top left, so the tip never covers the
      // question written just above it (justification trainers).
      if(o.inside && r.height > th + 40){ left = Math.max(8, r.left + 14); best = { top: Math.max(8, r.top + 14), below: true, inside: true }; }
      // Wider than the room left: pull it back so its right edge stays inside.
      if(left + tw > vw - 8) left = Math.max(8, vw - 8 - tw);
      tip.style.left = (left + sx) + 'px';
      tip.style.top = (best.top + sy) + 'px';
      tip.classList.toggle('is-below', best.below);
      tip.classList.toggle('no-arrow', best.inside || (best.below ? best.top > r.bottom + 14 : best.top + th < r.top - 14));
      tip.style.setProperty('--ax', Math.max(14, Math.min(tw - 26, r.left + r.width / 2 - left - 6)) + 'px');
    }
    function queue(){ if(!raf) raf = requestAnimationFrame(place); }
    function dismiss(){
      if(gone) return;
      gone = true;
      store(key, '1');
      ring.remove(); tip.remove();
      describe(target, false);
      Array.prototype.forEach.call(document.querySelectorAll('[aria-describedby]'), function(el){ if((' ' + el.getAttribute('aria-describedby') + ' ').indexOf(' ' + tip.id + ' ') >= 0) describe(el, false); });
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
    nav.className = 'ls-step-nav ls-act';
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
      // Back shows once there is a step behind; Next only when the next step
      // exists (a drill adds it after a Check), so the current step's own
      // Check is the one way forward.
      back.hidden = at === 0;
      next.hidden = at >= n - 1 || at >= tot - 1;
      nav.hidden = reviewing || (back.hidden && next.hidden);
      if(o.submit){ list(o.submit, container).forEach(function(el){ el.classList.add('ls-act'); el.classList.toggle('ls-step-off', !reviewing && at !== tot - 1); }); }
      tone();
      if(focus){
        var f = it[at].querySelector('input:not([type=hidden]):not([readonly]):not([disabled]), select, textarea, button:not([disabled])') || it[at];
        if(f === it[at]) it[at].setAttribute('tabindex', '-1');
        try{ f.focus({ preventScroll: true }); }catch(e){ f.focus(); }
      }
    }
    // Next is secondary when the step has its own primary action (a Check).
    function tone(){
      var cur = items()[at], own = false;
      if(cur && !reviewing){
        own = Array.prototype.some.call(cur.querySelectorAll('.btn-press, .ls-pri, button[type=submit]'), function(b){ return !b.disabled && b.offsetParent !== null && !nav.contains(b); });
        if(!own && o.submit) own = list(o.submit, container).some(function(el){ return !el.classList.contains('ls-step-off') && el.offsetParent !== null; });
      }
      next.classList.toggle('is-sec', own);
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
          else tone();
        });
      }).observe(container, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
    }
    seen = items().length; at = o.start || 0;
    paint(false);
    // go() moves focus only if it is already in the stepper (not on load), unless told.
    return { go: function(i, focus){ at = i; paint(focus != null ? !!focus : container.contains(document.activeElement)); }, refresh: refresh, review: function(on){ o.done = null; reviewing = !!on; paint(false); }, head: head, nav: nav };
  }

  window.LevlStudio = { mount: mount, stepper: stepper, on: function(){ return !!current; }, get: function(){ return current; }, icon: icon };
})();
