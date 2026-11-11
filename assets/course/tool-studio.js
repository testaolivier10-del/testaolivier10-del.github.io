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
     s.hint({ target, text, key })  first-run hint, once per tool per device: one
                                    short line in the layout next to the target (never
                                    over anything) and a ring inside the target's box;
                                    gone after the first action
     s.suspend(on)                  hide the studio and give the page its
                                    chrome back (an error)
     s.lock(html | el | false)      a Premium tool for someone without the pass: the bar
                                    stays, the lock card takes the stage and dock's place
                                    (false gives the tool back). A course core that puts
                                    its .premium-lock card in a [data-studio] mount gets
                                    this by itself (adopt, at the end of this file).
     s.startOver(fn)                what the menu's Start over does (opts.menu.startOver
                                    too; false hides it). Default: the tool's own visible
                                    "Start over" button, else a reload without the setup
                                    saved in the link.
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
   - A clamped caption gets a "More" button. The first-run hint is a line in
     the layout (under its target's row, under the caption for a stage target,
     at the top of a sticky band), so it never covers anything.
   - On-stage text under 12 px is raised to 12 px (svg text by at most 2.2x;
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
    restart: '<path d="M4 12a8 8 0 1 0 2.4-5.7"/><path d="M4 4v4.5h4.5"/>',
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
    var s = {}, mode = null, lastFocus = null, sheetOpen = false, tab = 'why', locked = false;
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
        (slim ? '' : '<button type="button" class="ls-ib ls-help" aria-label="Explanation of what is on screen" aria-controls="' + ids.why + '">' + icon('help') + '</button>') +
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
            '<button type="button" class="ls-why" aria-controls="' + ids.why + '">' + icon('bulb') + '<span>' + esc(opts.whyTitle || 'Explanation') + '</span></button></div>' +
          '<div class="ls-dock-body"></div>' +
          '<button type="button" class="ls-detbtn" aria-controls="' + ids.det + '" hidden>' + icon('sliders') + '<span class="ls-detbtn-t"></span>' + icon('chev', 'ls-detbtn-c') + '</button>' +
        '</section>' +
        '<aside class="ls-sheet" aria-labelledby="' + ids.sheetH + '" tabindex="-1" hidden>' +
          '<div class="ls-grab" aria-hidden="true"></div>' +
          '<div class="ls-sheet-head"><h2 class="ls-sheet-t" id="' + ids.sheetH + '">' + esc(opts.whyTitle || 'Explanation') + '</h2>' +
            '<div class="ls-seg ls-tabs" role="tablist" aria-label="Why, or the rest of the tool">' +
              '<button type="button" role="tab" id="' + ids.why + '-tab" aria-controls="' + ids.why + '" aria-selected="true" data-tab="why">' + esc(opts.whyTitle || 'Explanation') + '</button>' +
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
      // About gets its own button too, so credits and how-to are never hidden behind Explanation.
      detBtn.hidden = !has && aboutS.hidden;
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
      /* Owner 2026-11-03: the sheet shows only what its button named (Explanation, or Data & settings / About);
         nothing else is tucked behind a second tab. */
      var tt = root.querySelector('.ls-tabs [data-tab="' + tab + '"]'), th = q('.ls-sheet-t');
      if(th && tt) th.textContent = tt.textContent;
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

    /* Chip overflow (tool review pass 3, shared fix 3). A row of more than five chips (examples, scenes,
       presets) shows the first four, the one that is on, and a "More" chip that opens the rest in place;
       "Fewer" folds them again. Nothing is removed (the chips are only hidden, with their listeners and
       state), the selected chip always shows, and a chip that becomes selected while folded shows too.
       Never in a quiz mode, never on an answer set: data-ls-answer, data-ls-allchips (opt out) and the
       groups in NOCHIPS keep every chip visible. Chips are short in-flow buttons; figure hotspots
       (positioned buttons) and long cards are not chips. */
    var NOCHIPS = '[data-ls-allchips], [data-ls-answer], .ls-sheet, .ls-bar, .ls-modes, .ls-zbar, .ls-tabs, [role=tablist], [role=radiogroup], [role=listbox], [role=menu], ' +
      // Answer sets and task structure (docs/tool-review/pass2/shared.md, "Opted out"):
      '.pw-bank, .us-tray, .eb-chips, .eb-parts, .as-parts, .lp-fig, .pb-palette, .run-pick, .picker-grid, .sl-marks, .pt-qs';
    var CHIP_ON = '.on, .is-on, .active, .is-active, .sel, .is-sel, .selected, [aria-pressed="true"], [aria-checked="true"], [aria-selected="true"], [aria-current="true"]';
    var chipState = {}, chipT = 0, chipBusy = false;
    function quizOnly(el){
      var m = el.closest('[data-ls-only]');
      if(QUIZ === true) return true;
      if(m && m.getAttribute('data-ls-only').split(/\s+/).some(function(x){ return QUIZ.indexOf(x) >= 0; })) return true;
      return !!el.closest('.ls-stepper, form');
    }
    function chipish(b){
      if(b.classList.contains('ls-more-chip')) return false;
      var r = b.getAttribute('role');
      if(r === 'tab' || r === 'radio' || r === 'option' || r === 'menuitem' || b.closest('svg')) return false;
      var cs = getComputedStyle(b);
      if(cs.position === 'absolute' || cs.position === 'fixed') return false;
      var t = (b.textContent || '').replace(/\s+/g, ' ').trim();
      return t.length > 0 && t.length <= 32 && !b.querySelector('p, div, h2, h3, h4, ul');
    }
    function chipKids(g){
      var out = [];
      Array.prototype.forEach.call(g.children, function(k){
        var b = k.tagName === 'BUTTON' ? k : (k.children.length === 1 && /^(LI|SPAN)$/.test(k.tagName) && k.firstElementChild.tagName === 'BUTTON' ? k.firstElementChild : null);
        if(b && !b.classList.contains('ls-more-chip')) out.push({ b: b, box: k });
      });
      return out;
    }
    function chipKey(g){ return (g.id || '') + '|' + String(g.className).replace(/\s*ls-chips-(folded|open)/g, '') + '|' + (g.getAttribute('aria-label') || ''); }
    function chips(){
      chipT = 0;
      if(chipBusy) return;
      chipBusy = true;
      var seen = [];
      Array.prototype.forEach.call(root.querySelectorAll('.ls-stage-body button, .ls-dock button, .ls-pbar button'), function(b){
        var g = b.parentElement; if(g && g.tagName !== 'DIV' && g.children.length === 1 && /^(LI|SPAN)$/.test(g.tagName)) g = g.parentElement;
        if(g && seen.indexOf(g) < 0) seen.push(g);
      });
      seen.forEach(function(g){
        var kids = chipKids(g).filter(function(k){ return !k.box.hidden && !k.b.hidden; });
        var more = g.querySelector(':scope > .ls-more-chip');
        var mine = kids.filter(function(k){ return k.box.classList.contains('ls-chip-off') || k.box.getClientRects().length; });
        var ok = mine.length > 5 && !g.closest(NOCHIPS) && !quizOnly(g) && mine.every(function(k){ return chipish(k.b); });
        if(!ok){
          if(more){ more.remove(); g.classList.remove('ls-chips-folded', 'ls-chips-open'); mine.forEach(function(k){ k.box.classList.remove('ls-chip-off'); }); }
          return;
        }
        var key = chipKey(g), open = !!chipState[key];
        var onI = -1;
        mine.forEach(function(k, i){ if(onI < 0 && (k.b.matches(CHIP_ON) || k.box.matches(CHIP_ON))) onI = i; });
        var show = 4, hidden = 0;
        mine.forEach(function(k, i){ var off = !open && i >= show && i !== onI; if(off) hidden++; });
        if(!open && hidden < 2){ show = mine.length; hidden = 0; }
        mine.forEach(function(k, i){
          var off = !open && i >= show && i !== onI;
          if(k.box.classList.contains('ls-chip-off') !== off) k.box.classList.toggle('ls-chip-off', off);
        });
        if(hidden === 0 && !open){ if(more){ more.remove(); g.classList.remove('ls-chips-folded'); } return; }
        if(!g.id) g.id = nid('chips');
        if(!more){
          more = document.createElement('button');
          more.type = 'button';
          more.className = 'ls-more-chip ' + (mine[0].b.classList.contains('tchip') ? 'tchip' : String(mine[0].b.className).split(/\s+/).filter(function(c){ return c && !/^(on|is-on|active|is-active|sel|is-sel|selected)$/.test(c); }).join(' '));
          more.setAttribute('aria-controls', g.id);
          more.addEventListener('click', function(e){
            e.stopPropagation();
            var gk = chipKey(g), was = !!chipState[gk];
            chipState[gk] = !was;
            var first = !was ? chipKids(g).filter(function(k){ return k.box.classList.contains('ls-chip-off'); })[0] : null;
            chips();
            if(first) first.b.focus(); else more.focus();
          });
        }
        if(more.parentNode !== g || more !== g.lastElementChild) g.appendChild(more);
        var n = open ? 0 : hidden, lab = open ? 'Fewer' : 'More (' + n + ')';
        if(more.textContent !== lab) more.textContent = lab;
        var aria = open ? 'Show fewer options' : 'Show ' + n + ' more option' + (n === 1 ? '' : 's');
        if(more.getAttribute('aria-label') !== aria) more.setAttribute('aria-label', aria);
        if(more.getAttribute('aria-expanded') !== String(open)) more.setAttribute('aria-expanded', String(open));
        g.classList.toggle('ls-chips-folded', !open); g.classList.toggle('ls-chips-open', open);
      });
      chipBusy = false;
    }
    function queueChips(d){ if(!chipT) chipT = setTimeout(function(){ requestAnimationFrame(chips); }, d == null ? 30 : d); }
    s.chips = function(){ queueChips(0); return s; };
    if(window.MutationObserver) new MutationObserver(function(recs){
      if(chipBusy) return;
      // Our own More chip going in or out is not a change to react to.
      if(recs.every(function(r){ return Array.prototype.every.call(r.addedNodes, function(n){ return n.classList && n.classList.contains('ls-more-chip'); }) && Array.prototype.every.call(r.removedNodes, function(n){ return n.classList && n.classList.contains('ls-more-chip'); }); })) return;
      queueChips();
    }).observe(q('.ls-main'), { childList: true, subtree: true });
    // A selection made by a tap or a key (aria-pressed, .on) can change which chip must show.
    ['click', 'change', 'keyup'].forEach(function(t){ root.addEventListener(t, function(){ queueChips(); }, true); });
    [0, 400, 1200].forEach(function(t){ setTimeout(function(){ queueChips(0); }, t); });

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
       Phone text under 12 px on the stage is raised (see the header). */
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
    // 12 px: the phone rule for words on a picture (docs/tools-phone-pass.md; consistency audit 2026-11, C4).
    var MINPX = 12;
    function unbump(){ Array.prototype.forEach.call(stageBody.querySelectorAll('[' + FS0 + ']'), function(el){ el.style.fontSize = el.getAttribute(FS0); el.removeAttribute(FS0); }); }
    function bumpOn(){ return !!(phoneQ && phoneQ.matches) && !big; }
    function raise(el, px){ if(!el.hasAttribute(FS0)) el.setAttribute(FS0, el.style.fontSize || ''); el.style.fontSize = (Math.round(px * 100) / 100) + 'px'; }
    function bumpIn(box){
      if(!bumpOn() || !box || box.nodeType !== 1 || box.closest('[data-ls-text=keep]')) return;
      var texts = box.matches('text, tspan, textPath') ? [box] : box.querySelectorAll('text, tspan, textPath');
      Array.prototype.forEach.call(texts, function(t){
        if(t.hasAttribute(FS0) || t.closest('[data-ls-text=keep]') || !t.textContent.trim()) return;
        var m = t.getScreenCTM && t.getScreenCTM(); if(!m){ unlaid = true; return; }
        var fs = parseFloat(getComputedStyle(t).fontSize), k = Math.hypot(m.a, m.b), eff = fs * k;
        // Not laid out yet (a figure drawn while its box had no size): measured again shortly.
        if(!(eff > 0)){ unlaid = true; return; }
        if(eff >= MINPX - 0.05) return;
        if(t.tagName !== 'text' && t.parentNode && parseFloat(getComputedStyle(t.parentNode).fontSize) === fs) return;
        raise(t, fs * Math.min(2.2, MINPX / eff));
      });
      if(box instanceof SVGElement) return;
      var els = [box].concat(Array.prototype.slice.call(box.querySelectorAll('*')));
      els.forEach(function(el){
        if(el instanceof SVGElement || el.hasAttribute(FS0) || /^(SUB|SUP|CANVAS|INPUT|SELECT|TEXTAREA|OPTION)$/.test(el.tagName) || el.closest('[data-ls-text=keep]')) return;
        if(!Array.prototype.some.call(el.childNodes, function(n){ return n.nodeType === 3 && n.textContent.trim(); }) || !el.getClientRects().length) return;
        var fs = parseFloat(getComputedStyle(el).fontSize);
        if(fs > 0 && fs < MINPX - 0.05) raise(el, MINPX);
      });
    }
    var unlaid = false, relaid = 0;
    function bump(){ unbump(); unlaid = false; bumpIn(stageBody); if(unlaid && relaid++ < 6) queueTidy(true); }
    if(window.MutationObserver) new MutationObserver(function(recs){
      if(!bumpOn()) return;
      var seen = [];
      recs.forEach(function(r){
        var list = r.type === 'characterData' ? [r.target.parentNode] : Array.prototype.slice.call(r.addedNodes);
        list.forEach(function(n){ if(n && n.nodeType === 3) n = n.parentNode; if(n && n.nodeType === 1 && seen.indexOf(n) < 0){ seen.push(n); } });
      });
      unlaid = false;
      seen.forEach(function(n){ if(n.isConnected && !seen.some(function(o){ return o !== n && o.contains(n); })) bumpIn(n.matches('tspan') ? n.closest('text') || n : n); });
      if(unlaid){ relaid = 0; queueTidy(true); }
    }).observe(stageBody, { childList: true, subtree: true, characterData: true });
    // tidy: edge fades, wrapping rows, the action row's height (after any
    // change, at most every 400 ms); a resize or Enlarge also re-raises text.
    var tidyT = 0, tidyAt = 0, tidyAll = false;
    /* Nothing on the picture under Enlarge (consistency audit 2026-11, C3: "360°", "t (s)", "Ties" sat under it):
       when a label meets the button, the stage keeps a strip free for it at its foot, from then on (so a redraw
       cannot make it flip back and forth). */
    function enlClear(){
      if(enlBtn.hidden || big || stageBody.classList.contains('ls-enl-pad')) return;
      var e = enlBtn.getBoundingClientRect();
      if(!e.width) return;
      var hit = Array.prototype.some.call(stageBody.querySelectorAll('svg text, svg tspan, .ls-pill, p, span, b, label, output'), function(t){
        if(!t.textContent || !t.textContent.trim() || t.closest('[hidden]')) return false;
        var r = t.getBoundingClientRect();
        return r.width > 0 && Math.min(r.right, e.right) - Math.max(r.left, e.left) > 2 && Math.min(r.bottom, e.bottom) - Math.max(r.top, e.top) > 2;
      });
      if(hit){ stageBody.classList.add('ls-enl-pad'); remeasure(); }
    }
    function tidy(){ tidyT = 0; tidyAt = Date.now(); if(tidyAll){ tidyAll = false; bump(); } sweep(); paintActH(); enlClear(); }
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
      // Start over (consistency audit 2026-11, C2): every full tool has it, first in the menu. A locked tool has
      // nothing to start over.
      if(!slim && menuO.startOver !== false && !locked){ h += item('restart', 'restart', 'Start over'); acts.restart = startOver; }
      if(menuO.copyLink && !locked){ h += item('copy', 'link', 'Copy link to this setup'); acts.copy = copyLink; }
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
    /* Start over: the tool's own reset (menu.startOver: fn, or s.startOver(fn)); else a visible "Start over"
       button the tool already has; else the tool reloaded without the setup saved in its link (?chapter= is
       where you came from, not tool state, so it stays). */
    function startOver(){
      if(typeof menuO.startOver === 'function'){ menuO.startOver(); say('Started over.'); return; }
      var own = Array.prototype.filter.call(root.querySelectorAll('button'), function(b){
        return /^\s*start over\s*$/i.test(b.textContent) && !b.disabled && b.getClientRects().length && !menu.contains(b);
      })[0];
      if(own){ own.click(); say('Started over.'); return; }
      var keep = '';
      try{ var c = new URLSearchParams(location.search).get('chapter'); if(c) keep = '?chapter=' + encodeURIComponent(c); }catch(e){}
      var to = location.pathname + keep;
      if(to === location.pathname + location.search && !location.hash) location.reload();
      else location.replace(to);
    }
    s.startOver = function(fn){ menuO.startOver = fn; buildMenu(); return s; };
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

    /* ---------------- lock (a Premium tool for someone without the pass)
       The tool screen stays: the bar (back, ?, the menu) and, in place of the
       stage and dock, the lock card (consistency audit 2026-11, C1; model:
       NREMT scenario-sim). s.lock(html | element) shows it, s.lock(false)
       gives the tool back (a pass confirmed after load). */
    var lockP = null;
    s.lock = function(card){
      var on = card !== false && card != null && card !== '';
      if(on){
        if(!lockP){
          lockP = document.createElement('section');
          lockP.className = 'ls-lockp';
          lockP.setAttribute('aria-label', (opts.title || 'Tool') + ': Premium');
          q('.ls-main').insertBefore(lockP, q('.ls-main').firstChild);
        }
        if(typeof card === 'string') lockP.innerHTML = card;
        else { lockP.innerHTML = ''; list(card).forEach(function(el){ lockP.appendChild(el); }); }
        // "?" still answers: what this tool does (the page's own description) when the tool has not explained itself.
        if(!whyP.children.length){
          var d = document.querySelector('meta[name="description"]');
          if(d && d.content) whyP.innerHTML = '<p class="ls-lockwhy">' + esc(d.content) + '</p>';
        }
        if(big) s.enlarge(false);
      } else if(lockP){ lockP.remove(); lockP = null; }
      if(locked !== on){ locked = on; root.classList.toggle('is-locked', on); buildMenu(); }
      return s;
    };
    s.locked = function(){ return locked; };

    /* ---------------- hint */
    s.hint = function(o){ return locked ? null : hint(s, o, opts.slug); };

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
    list(opts.footer || (slim ? null : 'body > footer, body > .xshell > footer, body > .bio-foot, body > .chem-foot, body > .phys-foot, body > .calc-foot, body > .pcalc-foot, body > .stat-foot')).forEach(function(f){
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

  /* ---------------- first-run hint
     One quiet line IN THE LAYOUT, never a bubble over the page (tool review pass 3, shared fix 1): under its
     target's row in the dock; for a target on the stage, under the caption; for a target in a sticky band at the
     foot of a phone (the primary slider, the action row), at the top of that band. It covers nothing because it
     takes its own room, and it goes on the first action (after the finger lifts, so a drag never jumps). The
     ring is drawn inside the target's own box (shared fix 2): it never reaches a neighbor's label or value, and
     reduced motion shows it still. "Start here:" is dropped: the tap icon already says it. */
  var COACH_ROW = /^(LABEL|BUTTON|A|P|SPAN|SUMMARY|LEGEND|OUTPUT|H[1-6]|LI|TD|TH)$/;
  function hint(s, o, slug){
    if(!o || !o.target) return null;
    var key = 'levl_hint_' + (o.key || slug || location.pathname);
    if(store(key)) return null;
    // A target the tool redraws (an svg handle) is found again by its tag and classes.
    var again = null;
    function find(){
      if(typeof o.target === 'string') return s.root.querySelector(o.target) || document.querySelector(o.target);
      if(again && !document.contains(o.target)){ try{ return s.root.querySelector(again) || o.target; }catch(e){} }
      return o.target;
    }
    var target = find();
    if(!target) return null;
    if(typeof o.target !== 'string'){
      var cls = String(target.className && target.className.baseVal != null ? target.className.baseVal : target.className || '').trim().split(/\s+/).filter(function(c){ return c && /^[\w-]+$/.test(c); });
      if(cls.length) again = target.tagName.toLowerCase() + '.' + cls[0];
    }
    var ring = document.createElement('div'), tip = document.createElement('div');
    ring.className = 'ls-halo' + (reduced() ? ' is-static' : '');
    ring.setAttribute('aria-hidden', 'true');
    tip.className = 'ls-coach';
    tip.setAttribute('role', 'note');
    var text = String(o.text || '').replace(/^\s*start here\s*:\s*/i, '');
    text = text.charAt(0).toUpperCase() + text.slice(1);
    tip.innerHTML = icon('tap') + '<span>' + esc(text) + '</span>';
    tip.id = nid('hint');
    document.body.appendChild(ring);
    // Screen readers: the line describes the target, and only while it shows.
    function describe(el, on){
      var ids = (el.getAttribute('aria-describedby') || '').split(/\s+/).filter(function(x){ return x && x !== tip.id; });
      if(on) ids.push(tip.id);
      if(ids.length) el.setAttribute('aria-describedby', ids.join(' ')); else el.removeAttribute('aria-describedby');
    }
    describe(target, true);
    var gone = false, raf = 0, host = null;
    function stickyBand(t){
      var b = t.closest('.ls-pbar');
      if(b) return b;
      var a = t.closest('.ls-act, .bt-actions');
      if(!a){ try{ a = t.closest(':is(div,p):has(> .btn-press,> .ls-pri):not(:has(input,select,textarea,fieldset,.ls-stepper,.ls-act))'); }catch(e){ a = null; } }
      return a && a.closest('.ls-dock') && getComputedStyle(a).position === 'sticky' ? a : null;
    }
    // Where the line goes: { parent, before }.
    function spot(){
      var band = stickyBand(target);
      if(band) return { parent: band, before: band.firstChild, band: true };
      var cap = s.root.querySelector('.ls-cap');
      if(target.closest('.ls-stage') && !target.closest('.ls-dock')){
        // Under the caption; on a phone whose sticky band covers the caption, at the top of that band.
        var bands = Array.prototype.filter.call(s.root.querySelectorAll('.ls-pbar, .ls-dock .ls-act, .ls-dock .bt-actions'), function(a){
          return a.getClientRects().length && !a.hidden && getComputedStyle(a).position === 'sticky';
        });
        var cr = cap && cap.getClientRects().length ? cap.getBoundingClientRect() : null;
        var hid = !cr || bands.some(function(a){ var b = a.getBoundingClientRect(); return b.top < cr.bottom + 30 && b.bottom > cr.top; });
        if(!hid) return { parent: cap.parentNode, before: cap.nextSibling };
        if(bands.length) return { parent: bands[0], before: bands[0].firstChild, band: true };
        if(cr) return { parent: cap.parentNode, before: cap.nextSibling };
      }
      var node = target.ownerSVGElement ? target.ownerSVGElement : target;
      while(node.ownerSVGElement) node = node.ownerSVGElement;
      var stop = target.closest('.ls-dock-body, .ls-stage-body, .ls-dock, .ls-stage') || document.body;
      while(node.parentElement && node.parentElement !== stop){
        var p = node.parentElement, cs = getComputedStyle(p), d = cs.display;
        var block = d === 'block' || d === 'flow-root' || d === 'list-item' || (/flex/.test(d) && /column/.test(cs.flexDirection)) ||
          (/grid/.test(d) && cs.gridTemplateColumns.split(' ').length < 2);
        if(block && !COACH_ROW.test(p.tagName) && !p.closest('svg')) break;
        node = p;
      }
      return { parent: node.parentElement || stop, before: node.nextSibling };
    }
    function put(){
      var at = spot();
      if(host && host !== at.parent) host.classList.remove('ls-coach-host');
      host = at.band ? at.parent : null;
      if(host) host.classList.add('ls-coach-host');
      tip.classList.toggle('is-band', !!at.band);
      if(tip.parentNode !== at.parent || (at.before !== tip && tip.nextSibling !== at.before)) at.parent.insertBefore(tip, at.before === tip ? tip.nextSibling : at.before);
    }
    function radius(r, el){
      if(o.round != null) return o.round;
      if(target.ownerSVGElement) return /^(circle|ellipse)$/.test(target.tagName) ? Math.min(r.width, r.height) / 2 : Math.min(10, Math.min(r.width, r.height) / 2);
      var br = parseFloat(getComputedStyle(el).borderTopLeftRadius) || 0;
      return Math.min(br || 8, Math.min(r.width, r.height) / 2);
    }
    function place(){
      raf = 0;
      if(gone) return;
      // A tool that redraws its parts replaces the target: follow the new one.
      if(!document.contains(target)){
        var t = find();
        if(t && t !== target){ describe(target, false); target = t; describe(target, true); }
      }
      if(!document.contains(target)){ ring.style.display = 'none'; return; }
      if(!tip.isConnected || tip.parentNode !== spot().parent) put();
      // A control's wrapper (label, slider, value) rings only its slider or field, so the label and value stay clear.
      var rt0 = target;
      if(!target.ownerSVGElement && !target.matches('input, select, textarea, button, [role=slider]')){
        var inner = target.querySelectorAll('input:not([type=hidden]), select, textarea, [role=slider]');
        if(inner.length === 1 && inner[0].getClientRects().length) rt0 = inner[0];
      }
      var r = rt0.getBoundingClientRect();
      if(!r.width && !r.height){ ring.style.display = 'none'; return; }
      // Inside the target's own box, clipped to the stage that scrolls it.
      var rt = r.top, rb = r.bottom, rl = r.left, rr = r.right;
      var clip = target.closest('.ls-stage'), cb = clip && !target.closest('.ls-dock') ? clip.getBoundingClientRect() : null;
      if(cb){ rt = Math.max(rt, cb.top); rb = Math.min(rb, cb.bottom); rl = Math.max(rl, cb.left); rr = Math.min(rr, cb.right); }
      // Nor over a sticky band at the foot of a phone (the primary slider, the action row) that the target
      // has scrolled under: the ring stops at the band's top edge.
      Array.prototype.forEach.call(s.root.querySelectorAll('.ls-pbar, .ls-dock .ls-act, .ls-dock .bt-actions, .ls-coach-host'), function(a){
        if(a.contains(rt0) || !a.getClientRects().length || getComputedStyle(a).position !== 'sticky') return;
        var b = a.getBoundingClientRect();
        if(b.top < rb && b.bottom > rt && b.left < rr && b.right > rl) rb = Math.min(rb, b.top);
      });
      if(rb - rt < 8 || rr - rl < 8){ ring.style.display = 'none'; return; }
      ring.style.display = '';
      ring.style.left = (rl + window.scrollX) + 'px'; ring.style.top = (rt + window.scrollY) + 'px';
      ring.style.width = (rr - rl) + 'px'; ring.style.height = (rb - rt) + 'px';
      ring.style.borderRadius = radius(r, rt0) + 'px';
    }
    function queue(){ if(!raf) raf = requestAnimationFrame(place); }
    var ro = window.ResizeObserver ? new ResizeObserver(queue) : null;
    function dismiss(){
      if(gone) return;
      gone = true;
      store(key, '1');
      ring.remove(); tip.remove();
      if(host) host.classList.remove('ls-coach-host');
      describe(target, false);
      Array.prototype.forEach.call(document.querySelectorAll('[aria-describedby]'), function(el){ if((' ' + el.getAttribute('aria-describedby') + ' ').indexOf(' ' + tip.id + ' ') >= 0) describe(el, false); });
      window.removeEventListener('resize', queue); window.removeEventListener('scroll', queue, true);
      ['pointerdown', 'click', 'keydown', 'input', 'change'].forEach(function(t){ s.root.removeEventListener(t, onUse, true); });
      if(ro) ro.disconnect();
      clearInterval(iv);
      if(s.fit) s.fit();
    }
    var pressed = false;
    function lift(e){
      window.removeEventListener('pointerup', lift, true); window.removeEventListener('pointercancel', lift, true);
      pressed = false;
      // A finger that only scrolled the page (the browser cancels the pointer) is not use.
      if(e.type === 'pointerup') dismiss();
    }
    function onUse(e){
      if(gone || pressed) return;
      if(e.type === 'keydown' && (e.key === 'Tab' || e.key === 'Shift')) return;
      if(e.target.closest && e.target.closest('.ls-bar')) return;
      // A drag keeps the line until the finger lifts, so nothing moves under it.
      if(e.type === 'pointerdown'){ pressed = true; window.addEventListener('pointerup', lift, true); window.addEventListener('pointercancel', lift, true); return; }
      dismiss();
    }
    window.addEventListener('resize', queue); window.addEventListener('scroll', queue, true);
    ['pointerdown', 'click', 'keydown', 'input', 'change'].forEach(function(t){ s.root.addEventListener(t, onUse, true); });
    put();
    if(ro){ ro.observe(s.root); ro.observe(document.documentElement); }
    // The layout can still be settling (fonts, a late redraw) and a handle can move by itself: follow it
    // until the hint goes (cheap: one box read a frame at most).
    var iv = setInterval(queue, 200);
    queue();
    if(s.fit) s.fit();
    return { dismiss: dismiss, place: queue, el: tip };
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

  /* ---------------- a gated tool page (consistency audit 2026-11, C1)
     A course's core replaces a locked tool's mount with its Premium card
     before the tool can mount the studio (the AP® cores and A&P: the card
     inside the [data-studio] mount). Then the studio is built here around the
     card, so a locked tool opens as the tool screen too: the bar (back to the
     tools, ?, the menu) and the card, never the course page. */
  function adopt(){
    if(current) return;
    var card = document.querySelector('[data-studio] .premium-lock');
    if(!card) return;
    var mountEl = card.closest('[data-studio]'), gate = card.parentNode !== mountEl ? card.parentNode : card;
    var main = mountEl.closest('main') || document.body;
    var h1 = main.querySelector('h1'), crumbs = main.querySelectorAll('nav[aria-label="Breadcrumb"] a');
    var tools = Array.prototype.filter.call(crumbs, function(a){ return /tools\.html$/.test(a.getAttribute('href') || ''); })[0];
    var home = crumbs.length > 1 ? crumbs[1] : null;
    var rep = document.querySelector('[data-report-course][data-report-question]');
    var s = mount({
      title: h1 ? h1.textContent.trim() : document.title, course: home ? home.textContent.trim() : '',
      back: tools ? tools.getAttribute('href') : '../tools.html', home: home ? home.getAttribute('href') : '../',
      slug: mountEl.getAttribute('data-slug') || '', host: mountEl,
      menu: rep ? { report: { course: rep.getAttribute('data-report-course'), id: rep.getAttribute('data-report-question') } } : {}
    });
    if(main.tagName === 'MAIN') main.classList.add('ls-host');
    s.lock(gate);
    mountEl.hidden = true;
  }
  // After every DOMContentLoaded handler (the cores mount their card in one).
  function later(){ setTimeout(adopt, 0); }
  // Deferred scripts run before DOMContentLoaded (readyState 'interactive'); load is the fallback.
  if(document.readyState !== 'complete'){ document.addEventListener('DOMContentLoaded', later); window.addEventListener('load', adopt); }
  else later();

  window.LevlStudio = { mount: mount, stepper: stepper, on: function(){ return !!current; }, get: function(){ return current; }, icon: icon };
})();
