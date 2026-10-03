/* Shared site chrome for every LevlPrep course.

   LevlPrep is the site; NREMT Prep and Organic Chemistry are courses inside
   it. Before this file each course drew its own header — NREMT built a single
   crowded row in nremt/assets/nav.js, ochem hand-copied a three-element header
   into all 81 of its pages — so the two read as unrelated apps and only one of
   them had a way back to the hub.

   One structure now, for both, and it's the two-tier pattern every
   multi-section product app uses:

     Row 1 (#site-header)  global chrome, identical everywhere:
                           back arrow -> hub, the LevlPrep wordmark, the
                           current course's name, and on the right the streak
                           chip, level badge, account button, the mute switch
                           for the correct-answer chime and the theme toggle.
     Row 2 (.course-nav)   the current course's section tabs.

   A page only needs an empty <header id="site-header"></header>; row 2 is injected
   directly after it, so no page has to know the two-row shape exists.

   Height vars, both set from the real rendered boxes since the tab row wraps
   or scrolls at narrow widths:
     --site-header-h   total chrome height. What page content offsets against
                       (sticky exam timers, scroll-margin-top on anchors), so
                       it deliberately covers BOTH rows.
     --chrome-row1-h   row 1 alone — what row 2 itself sticks beneath. */
(function(){
  var HUB_URL = '/';
  var THEME_KEY = 'nremt_theme'; // named before the site had a second course;
                                 // renaming it would silently reset everyone's
                                 // saved theme, so it stays.

  function escapeHtml(s){
    return String(s).replace(/[&<>"']/g, function(c){
      return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c];
    });
  }

  /* Authored strings across the courses (lesson feedback, explanations,
     options) carry inline markup for formulas and emphasis:
     C<sub>6</sub>H<sub>4</sub>, <i>cis</i>, &alpha;. Written with textContent
     they print as literal tags; written with raw innerHTML any stray tag
     becomes live markup. This is the one sanitizer for them: only the inline
     tags below survive, every attribute is dropped, any other element is
     reduced to its text (script, style and template to nothing), and the
     parse happens in an inert <template>, so nothing in the string can run.
       LevlInline.set(el, s)  replace el's contents with the sanitized string
       LevlInline.html(s)     the sanitized string as HTML, for concatenation
       LevlInline.text(s)     plain text: tags dropped, entities decoded. For
                              screen-reader announcements and attributes. A
                              string with no markup comes back unchanged, so
                              plain text such as "pKa < 5" is never parsed.
     Defined first, before anything below can throw, because lesson and
     practice scripts call it when they render feedback. */
  var INLINE_TAGS = { SUB: 1, SUP: 1, I: 1, B: 1, EM: 1, STRONG: 1, BR: 1 };
  var INLINE_DROP = { SCRIPT: 1, STYLE: 1, TEMPLATE: 1, NOSCRIPT: 1, IFRAME: 1, OBJECT: 1 };
  var HAS_MARKUP = /<\/?[a-z][^>]*>|&(#\d+|#x[0-9a-f]+|[a-z]+\d*);/i;
  function inlineFragment(s){
    var tpl = document.createElement('template');
    tpl.innerHTML = String(s == null ? '' : s);
    (function clean(node){
      Array.prototype.slice.call(node.childNodes).forEach(function(c){
        if(c.nodeType === 1){
          if(INLINE_DROP[c.tagName]){ node.removeChild(c); return; }
          clean(c);
          if(INLINE_TAGS[c.tagName]){
            while(c.attributes.length) c.removeAttribute(c.attributes[0].name);
          } else {
            while(c.firstChild) node.insertBefore(c.firstChild, c);
            node.removeChild(c);
          }
        } else if(c.nodeType !== 3){
          node.removeChild(c);
        }
      });
    })(tpl.content);
    return tpl.content;
  }
  window.LevlInline = {
    set: function(el, s){ el.textContent = ''; el.appendChild(inlineFragment(s)); },
    html: function(s){ var d = document.createElement('div'); d.appendChild(inlineFragment(s)); return d.innerHTML; },
    text: function(s){
      s = String(s == null ? '' : s);
      return HAS_MARKUP.test(s) ? inlineFragment(s).textContent : s;
    }
  };

  var FLAME_SVG =
    '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true">' +
      '<path d="M12 2c1 4-3 5-3 9a3 3 0 006 0c1.5 1 2 3 2 4.5A5.5 5.5 0 0111.5 21 6 6 0 016 15c0-5 4-6 4-9 0-1.5-.5-2.5-1-3.5C10.5 2 11 2 12 2z" fill="currentColor"/>' +
    '</svg>';

  /* Two speaker glyphs for the correct-answer chime's mute switch: waves on when
     it's on, a slash when it's muted. */
  var SPEAKER_ON =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" ' +
      'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<path d="M11 5 6 9H3v6h3l5 4V5z" fill="currentColor" stroke="none"/>' +
      '<path d="M15.5 8.5a5 5 0 010 7"/><path d="M18.5 5.5a9 9 0 010 13"/>' +
    '</svg>';
  var SPEAKER_OFF =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" ' +
      'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<path d="M11 5 6 9H3v6h3l5 4V5z" fill="currentColor" stroke="none"/>' +
      '<path d="M16 9.5l5 5"/><path d="M21 9.5l-5 5"/>' +
    '</svg>';

  /* The theme toggle: a moon in light mode (tap for dark), a sun in dark mode.
     Both are in the button and theme.css shows the one that fits, so the icon
     is right before any script runs. It replaced a "◑" glyph that rendered as
     a barely visible speck at 14px. */
  var THEME_ICONS =
    '<svg class="ti-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" ' +
      'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<path d="M20 14.5A8 8 0 019.5 4a8 8 0 1010.5 10.5z"/></svg>' +
    '<svg class="ti-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" ' +
      'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>';
  var SEARCH_ICON =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" ' +
      'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/></svg>';
  /* What the header calls each course where there is no room for its full
     name: beside the wordmark on a phone. */
  // courses:begin COURSE_LIST key,short,dir (generated from assets/courses.js by scripts/build-courses.mjs; edit there)
  var COURSE_LIST = [
    { key: 'nremt', short: 'NREMT', dir: 'nremt' },
    { key: 'ochem', short: 'Ochem', dir: 'ochem' },
    { key: 'anp', short: 'A&P', dir: 'anatomy-physiology' },
    { key: 'apbio', short: 'Biology', dir: 'bio' },
  ];
  // courses:end
  var COURSE_SHORT = {};
  COURSE_LIST.forEach(function(c){ COURSE_SHORT[c.key] = c.short; });

  /* "/" opens site search from anywhere that is not a text field — the
     convention GitHub, YouTube and MDN all share. On the search page itself it
     focuses the box instead of reloading. Exposed so the hub, which draws its
     own header, wires the same key the same way. */
  /* A course key with the token "ap" in it (apbio) never goes into a URL
     (docs/apbio-spec.md decision 2): it travels as its folder ("bio"), which
     site search accepts as an alias. */
  function urlCourse(courseKey){
    var t = String(courseKey || '').toLowerCase().split(/[^a-z0-9]+/);
    if(t.indexOf('ap') === -1 && t.indexOf('apbio') === -1) return courseKey;
    for(var i = 0; i < COURSE_LIST.length; i++) if(COURSE_LIST[i].key === courseKey) return COURSE_LIST[i].dir;
    return courseKey;
  }
  function searchUrl(courseKey){
    return '/search.html' + (courseKey ? '?course=' + encodeURIComponent(urlCourse(courseKey)) : '');
  }
  function wireSearchKey(courseKey){
    if(window.__levlSearchKey) return;
    window.__levlSearchKey = true;
    document.addEventListener('keydown', function(e){
      if(e.key !== '/' || e.ctrlKey || e.metaKey || e.altKey || e.defaultPrevented) return;
      var t = e.target, tag = t && t.tagName;
      if(tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || (t && t.isContentEditable)) return;
      e.preventDefault();
      if(/\/search\.html$/.test(location.pathname)){
        var box = document.querySelector('input[type="search"], input[name="q"]');
        if(box){ box.focus(); if(box.select) box.select(); return; }
      }
      openSearchOverlay(courseKey);
    });
  }

  /* "/" opens search over the page instead of leaving it, so a student in a
     lesson keeps their place and the course chrome (audit 2026-10). The
     overlay is the search page itself in embed mode (search.html?embed=1),
     so there is one search, not two; a result opens in this window. A modal
     dialog: the page behind is inert, Esc or the close button returns focus
     to where it was. */
  var overlayState = null;
  function openSearchOverlay(courseKey){
    if(overlayState) return;
    var back = document.activeElement;
    var wrap = document.createElement('div');
    wrap.className = 'lso';
    wrap.innerHTML =
      '<div class="lso-scrim"></div>' +
      '<div class="lso-panel" role="dialog" aria-modal="true" aria-label="Search">' +
        '<div class="lso-bar"><b>Search</b>' +
          '<a href="' + searchUrl(courseKey) + '">Open the search page</a>' +
          '<button type="button" class="lso-close" aria-label="Close search">Esc</button></div>' +
        '<iframe title="Search" src="/search.html?embed=1' + (courseKey ? '&course=' + encodeURIComponent(urlCourse(courseKey)) : '') + '"></iframe>' +
      '</div>';
    var hidden = [];
    Array.prototype.forEach.call(document.body.children, function(el){
      if(el.tagName === 'SCRIPT' || el.hasAttribute('inert')) return;
      el.setAttribute('inert', ''); hidden.push(el);
    });
    document.body.appendChild(wrap);
    document.documentElement.classList.add('lso-open');
    var frame = wrap.querySelector('iframe');
    frame.addEventListener('load', function(){
      try{ var b = frame.contentDocument.getElementById('ssQ'); if(b) b.focus(); else frame.focus(); }catch(e){ frame.focus(); }
    });
    function close(){
      if(!overlayState) return;
      hidden.forEach(function(el){ el.removeAttribute('inert'); });
      wrap.remove();
      document.documentElement.classList.remove('lso-open');
      window.removeEventListener('message', onMsg);
      document.removeEventListener('keydown', onKey, true);
      overlayState = null;
      if(back && back.focus) back.focus();
    }
    function onMsg(e){ if(e.origin === location.origin && e.data && e.data.levl === 'close-search') close(); }
    function onKey(e){ if(e.key === 'Escape'){ e.preventDefault(); close(); } }
    window.addEventListener('message', onMsg);
    document.addEventListener('keydown', onKey, true);
    wrap.querySelector('.lso-scrim').addEventListener('click', close);
    wrap.querySelector('.lso-close').addEventListener('click', close);
    overlayState = { close: close };
  }
  /* Not window.LevlSearch: that name is the search engine (assets/site-search.js),
     which A&P search loads only when the name is free (audit 2026-10, fix 6). */
  window.LevlSearchChrome = { url: searchUrl, wireKey: wireSearchKey, icon: SEARCH_ICON, open: function(k){ openSearchOverlay(k || ''); } };

  /* Where each course would send a returning student. Each course home works
     this out for its own "Continue" button and leaves it here, under
     localStorage['levl_resume'] = { nremt|ochem|anp: { url, label, t } }, so
     the hub can link straight to the same place without loading three
     curricula. set(key) with no url clears that course's entry.
     ctaReady(el) un-hides a hero button that the page's inline script hid
     (class cta-pending) while its returning-student label was worked out. */
  var RESUME_KEY = 'levl_resume';
  window.LevlResume = {
    get: function(){
      try{ return JSON.parse(localStorage.getItem(RESUME_KEY) || '{}') || {}; }catch(e){ return {}; }
    },
    set: function(key, url, label){
      try{
        var all = window.LevlResume.get();
        if(url) all[key] = { url: url, label: label || '', t: Date.now() };
        else delete all[key];
        localStorage.setItem(RESUME_KEY, JSON.stringify(all));
      }catch(e){}
    },
    ctaReady: function(el){ if(el) el.classList.remove('cta-pending'); }
  };

  /* Keeps the button's icon, tooltip and aria-pressed in step with the stored
     preference. Called on render and again on every change, including changes
     that did not come from this button. */
  function syncSoundButton(btn){
    if(!btn || !window.LevlSound) return;
    var on = window.LevlSound.isEnabled();
    btn.innerHTML = (on ? SPEAKER_ON : SPEAKER_OFF) + '<span class="chrome-menu__lbl">Answer sounds: ' + (on ? 'on' : 'off') + '</span>';
    btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    var label = on ? 'Turn answer sounds off' : 'Turn answer sounds on';
    btn.setAttribute('aria-label', label);
    btn.title = label;
    btn.classList.toggle('is-muted', !on);
  }

  function setTheme(mode){
    if(mode === 'dark') document.documentElement.setAttribute('data-theme', 'dark');
    else document.documentElement.removeAttribute('data-theme');
    try{ localStorage.setItem(THEME_KEY, mode); }catch(e){}
  }
  /* With nothing saved, the inline script in every <head> takes the OS
     setting (prefers-color-scheme) before first paint, so there is no flash.
     Follow the OS when it changes too, until the student picks a theme. */
  try{
    var darkQuery = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)');
    if(darkQuery && darkQuery.addEventListener) darkQuery.addEventListener('change', function(e){
      var saved = null;
      try{ saved = localStorage.getItem(THEME_KEY); }catch(err){}
      if(saved) return;
      if(e.matches) document.documentElement.setAttribute('data-theme', 'dark');
      else document.documentElement.removeAttribute('data-theme');
    });
  }catch(e){}

  /* Both rows are measured, not assumed: row 2 wraps to a second line on a
     tablet and scrolls sideways on a phone, and an exam timer parked at a
     stale offset covers the tabs it was supposed to clear. */
  function syncHeights(){
    var header = document.getElementById('site-header');
    if(!header) return;
    var nav = document.querySelector('.course-nav');
    var row1 = header.offsetHeight;
    var root = document.documentElement.style;
    root.setProperty('--chrome-row1-h', row1 + 'px');
    root.setProperty('--site-header-h', (row1 + (nav ? nav.offsetHeight : 0)) + 'px');
  }
  var resizeTimer;
  window.addEventListener('resize', function(){
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(syncHeights, 150);
  });

  /* The tab row scrolls sideways on a phone with its scrollbar hidden, so the
     stylesheet fades its right edge to say there's more. Drop the fade once
     there's nothing left to scroll to, or the last tab sits half-dimmed
     forever. */
  function wireOverflowFade(inner){
    if(!inner) return;
    var syncEnd = function(){
      var atEnd = inner.scrollLeft + inner.clientWidth >= inner.scrollWidth - 2;
      inner.classList.toggle('at-end', atEnd);
    };
    inner.addEventListener('scroll', syncEnd, { passive: true });
    window.addEventListener('resize', syncEnd);
    // Measured synchronously the row can still look un-scrollable — the
    // stylesheet or the web font may not have applied yet — which wrongly
    // marks it "at end" and kills the fade for good, since nothing scrolls it
    // afterwards. Hence the re-measures.
    syncEnd();
    requestAnimationFrame(syncEnd);
    window.addEventListener('load', syncEnd);
    if(window.ResizeObserver) new ResizeObserver(syncEnd).observe(inner);
    if(document.fonts && document.fonts.ready) document.fonts.ready.then(syncEnd);
    // Open on the tab you're actually on, so the current section is never the
    // one parked off-screen. Scroll the minimum needed to reveal it and no
    // further: scrolling *to* it instead would push the row off its left
    // padding even when it was already fully visible, leaving the first tab
    // sliced by the screen edge. Deferred until layout has settled, since the
    // pre-web-font metrics this measures against are not the final ones.
    var revealActive = function(){
      var active = inner.querySelector('.course-nav__link.active');
      if(!active) return;
      var overflow = active.offsetLeft + active.offsetWidth - inner.clientWidth + 16;
      if(overflow > inner.scrollLeft) inner.scrollLeft = overflow;
      syncEnd();
    };
    requestAnimationFrame(revealActive);
    if(document.fonts && document.fonts.ready) document.fonts.ready.then(revealActive);
  }

  /* cfg:
       subject      HubProgress subject key ('nremt' | 'ochem') — picks the
                    course's rank names for the shared level number.
       course       the course's display name, shown beside the wordmark.
       courseHref   the course's own homepage.
       progressHref where the streak/level chips link (the course's progress
                    page). Passed in because ochem pages live at three folder
                    depths and each needs its own relative path.
       items        [{ href, label, active }] — the row 2 tabs.  */
  /* Bottom tab bar icons, by the tab's label. A tab without one gets the
     generic page glyph. */
  var TAB_ICONS = {
    'Home':      '<path d="M3 11l9-7 9 7v9a1 1 0 01-1 1h-5v-6h-6v6H4a1 1 0 01-1-1z"/>',
    'Practice':  '<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/>',
    'Learn':     '<path d="M4 5h6a3 3 0 013 3v12a2 2 0 00-2-2H4zM20 5h-6a3 3 0 00-3 3v12a2 2 0 012-2h7z"/>',
    'Notes':     '<path d="M4 4h12l4 4v12H4z"/><path d="M16 4v4h4M8 13h8M8 17h6"/>',
    // A stopwatch for timed exams; an "Aa" page for the glossary.
    'Exams':     '<circle cx="12" cy="14" r="7"/><path d="M12 14V10.5M10 3h4M12 3v4M18.5 7.5l1.5-1.5"/>',
    'Glossary':  '<path d="M5 4h11a3 3 0 013 3v13H8a3 3 0 01-3-3z"/><path d="M5 17a3 3 0 013-3h11"/><path d="M9 11l1.6-4 1.6 4M9.6 9.8h2"/>',
    'Review':    '<path d="M3 12a9 9 0 019-9 9 9 0 017 3.4M21 12a9 9 0 01-9 9 9 9 0 01-7-3.4"/><path d="M21 3v4h-4M3 21v-4h4"/>',
    'Tools':     '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2"/>',
    'Dashboard': '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
    'More':      '<circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/>',
  };
  var GENERIC_ICON = '<path d="M5 3h9l5 5v13H5z"/><path d="M14 3v5h5"/>';
  function tabIcon(label){
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      (TAB_ICONS[label] || GENERIC_ICON) + '</svg>';
  }

  /* The phone-width tab bar: the first four tabs, then "More" for the rest.
     A page with four tabs or fewer gets them all and no More. */
  function renderBottomNav(cfg, mount){
    var items = cfg.items || [];
    if(!items.length) return;
    var old = document.getElementById('levlBottomNav');
    if(old) old.remove();
    var oldSheet = document.getElementById('levlBottomSheet');
    if(oldSheet) oldSheet.remove();
    var oldScrim = document.getElementById('levlBottomScrim');
    if(oldScrim) oldScrim.remove();

    var shown = items.length > 5 ? items.slice(0, 4) : items;
    var rest = items.length > 5 ? items.slice(4) : [];
    var restActive = rest.some(function(it){ return it.active; });

    var nav = document.createElement('nav');
    nav.id = 'levlBottomNav';
    nav.className = 'bottom-nav';
    nav.setAttribute('aria-label', (cfg.course || 'Sections') + ' sections');
    nav.innerHTML = shown.map(function(it){
      return '<a href="' + it.href + '" class="bottom-nav__item' + (it.active ? ' active' : '') + '"' +
        (it.active ? ' aria-current="page"' : '') + '><span class="i">' + tabIcon(it.label) + '</span><span class="t">' + escapeHtml(it.label) + '</span></a>';
    }).join('') + (rest.length
      ? '<button type="button" class="bottom-nav__item' + (restActive ? ' active' : '') + '" id="levlMoreTab" aria-haspopup="true" aria-expanded="false"><span class="i">' + tabIcon('More') + '</span><span class="t">More</span></button>'
      : '');
    document.body.appendChild(nav);

    if(!rest.length) return;
    var scrim = document.createElement('div');
    scrim.id = 'levlBottomScrim';
    scrim.className = 'bottom-scrim';
    var sheet = document.createElement('div');
    sheet.id = 'levlBottomSheet';
    sheet.className = 'bottom-sheet';
    sheet.setAttribute('role', 'dialog');
    sheet.setAttribute('aria-label', 'More sections');
    sheet.innerHTML = '<div class="bottom-sheet__grab"></div>' + rest.map(function(it){
      return '<a href="' + it.href + '"' + (it.active ? ' class="active" aria-current="page"' : '') + '><span class="i">' + tabIcon(it.label) + '</span>' + escapeHtml(it.label) + '</a>';
    }).join('');
    document.body.appendChild(scrim);
    document.body.appendChild(sheet);
    var more = document.getElementById('levlMoreTab');
    more.setAttribute('aria-controls', 'levlBottomSheet');
    /* Closed, the sheet sits off-screen but its links were still in the tab
       order (audit 2026-10, fix-first 12): inert + aria-hidden take it out of
       both the tab order and the accessibility tree until it opens. */
    function setOpen(open){
      var was = sheet.classList.contains('open');
      sheet.classList.toggle('open', open);
      scrim.classList.toggle('open', open);
      more.setAttribute('aria-expanded', open ? 'true' : 'false');
      if(open){ sheet.removeAttribute('inert'); sheet.removeAttribute('aria-hidden'); }
      else { sheet.setAttribute('inert', ''); sheet.setAttribute('aria-hidden', 'true'); }
      if(open && !was){ var first = sheet.querySelector('a'); if(first) first.focus(); }
      if(!open && was && sheet.contains(document.activeElement)) more.focus();
    }
    setOpen(false);
    more.addEventListener('click', function(){ setOpen(!sheet.classList.contains('open')); });
    scrim.addEventListener('click', function(){ setOpen(false); });
    document.addEventListener('keydown', function(e){
      if(e.key === 'Escape' && sheet.classList.contains('open')){ setOpen(false); more.focus(); }
    });
  }

  // A course's own key; anything else is treated as the registry's first
  // course, NREMT, the original one, exactly as before A&P existed.
  function courseKeyOf(subject){
    return Object.prototype.hasOwnProperty.call(COURSE_SHORT, subject) ? subject : COURSE_LIST[0].key;
  }

  var MENU_ICON =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" ' +
      'stroke-linecap="round" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg>';

  /* Row 1, the same on every page of the site (audit 2026-10: the hub, 404,
     search, terms and the courses each showed a different set of controls).
     The wordmark goes to the hub and the course name to the course home; the
     back arrow that also went to the hub read as "previous page" on a lesson
     and is gone. On a phone, account, answer sounds and theme fold into one
     menu (.chrome-menu); from 641px up the same nodes sit in the row, because
     the menu is display:contents there. */
  function headerHtml(o){
    var link = function(cls, id, title, inner, hidden){
      return o.progressHref
        ? '<a href="' + o.progressHref + '" class="' + cls + '" id="' + id + '" title="' + title + '"' + (hidden ? ' hidden' : '') + '>' + inner + '</a>'
        : '<span class="' + cls + '" id="' + id + '" title="' + title + '"' + (hidden ? ' hidden' : '') + '>' + inner + '</span>';
    };
    return '<div class="site-header__inner">' +
        '<span class="site-header__brand-row">' +
          '<a class="site-header__brand" href="' + HUB_URL + '"' + (o.course ? '' : ' aria-label="LevlPrep home"') + '>' +
            '<span class="brand-mark" aria-hidden="true">+</span><span class="brand-text">LevlPrep</span>' +
          '</a>' +
          (o.course
            ? '<a class="site-header__course" href="' + o.courseHref + '" aria-label="' + escapeHtml(o.course) + ' home">' +
                '<span class="site-header__course-full">' + escapeHtml(o.course) + '</span>' +
                '<span class="site-header__course-short" aria-hidden="true">' + escapeHtml(o.courseShort || COURSE_SHORT[o.courseKey] || o.course) + '</span>' +
              '</a>'
            : '') +
        '</span>' +
        '<div class="nav-right">' +
          '<a href="' + searchUrl(o.courseKey) + '" class="theme-toggle search-toggle" id="searchToggle" aria-label="Search' + (o.courseKey ? '' : ' all courses') + '" title="Search (press /)">' + SEARCH_ICON + '</a>' +
          link('nav-streak', 'navStreak', 'Daily streak', FLAME_SVG + '<span id="navStreakCount">0</span>', true) +
          link('level-badge', 'levelBadge', 'Your level', 'L1', true) +
          '<button type="button" class="theme-toggle chrome-more" id="chromeMenuBtn" aria-haspopup="true" aria-expanded="false" aria-controls="chromeMenu" aria-label="Account and settings" title="Account and settings">' + MENU_ICON + '</button>' +
          '<div class="chrome-menu" id="chromeMenu">' +
            '<span id="accountSlot"></span>' +
            (window.LevlSound ? '<button type="button" class="theme-toggle sound-toggle" id="soundToggle"></button>' : '') +
            '<button type="button" class="theme-toggle" id="themeToggle" aria-label="Dark mode" title="Dark mode">' + THEME_ICONS + '<span class="chrome-menu__lbl">Dark mode</span></button>' +
          '</div>' +
        '</div>' +
      '</div>';
  }

  /* The phone menu. Closed it is display:none (so out of the tab order);
     Esc or a click elsewhere closes it and focus goes back to the button. A
     click inside the account menu or the sign-in dialog, which are drawn
     outside it, does not count as elsewhere. */
  function wireChromeMenu(){
    var btn = document.getElementById('chromeMenuBtn');
    var menu = document.getElementById('chromeMenu');
    if(!btn || !menu) return;
    function setOpen(open, refocus){
      menu.classList.toggle('open', open);
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      if(open){ var first = menu.querySelector('button, a'); if(first) first.focus(); }
      else if(refocus) btn.focus();
    }
    btn.addEventListener('click', function(){ setOpen(!menu.classList.contains('open')); });
    document.addEventListener('click', function(e){
      if(!menu.classList.contains('open')) return;
      var t = e.target;
      if(menu.contains(t) || btn.contains(t) || (t.closest && t.closest('#accountMenu, .auth-modal, .modal-overlay'))) return;
      setOpen(false);
    }, true);
    document.addEventListener('keydown', function(e){
      if(e.key === 'Escape' && menu.classList.contains('open') && !document.getElementById('accountMenu')) setOpen(false, true);
    });
  }

  function wireControls(courseKey){
    var sound = document.getElementById('soundToggle');
    if(sound && window.LevlSound){
      syncSoundButton(sound);
      window.LevlSound.onChange(function(){ syncSoundButton(sound); });
      sound.addEventListener('click', function(){ window.LevlSound.toggle(); });
    }
    var toggle = document.getElementById('themeToggle');
    if(toggle){
      var syncPressed = function(){ toggle.setAttribute('aria-pressed', document.documentElement.getAttribute('data-theme') === 'dark' ? 'true' : 'false'); };
      syncPressed();
      toggle.addEventListener('click', function(){
        setTheme(document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
        syncPressed();
      });
    }
    wireChromeMenu();
    wireSearchKey(courseKey);
  }

  function render(cfg){
    var mount = document.getElementById('site-header');
    if(!mount) return;
    var courseKey = courseKeyOf(cfg.subject);
    // The course tint (see --ctint in theme.css) keys off this.
    document.body.setAttribute('data-course', courseKey);

    mount.innerHTML = headerHtml({
      course: cfg.course, courseHref: cfg.courseHref, courseShort: cfg.courseShort,
      courseKey: courseKey, progressHref: cfg.progressHref
    });

    var nav = document.querySelector('.course-nav');
    if(!nav){
      nav = document.createElement('div');
      nav.className = 'course-nav';
      mount.parentNode.insertBefore(nav, mount.nextSibling);
    }
    nav.innerHTML = '<nav class="course-nav__inner" aria-label="' + escapeHtml(cfg.course || 'Sections') + ' sections">' +
      (cfg.items || []).map(function(it){
        return '<a href="' + it.href + '" class="course-nav__link' + (it.active ? ' active' : '') + '"' +
          (it.active ? ' aria-current="page"' : '') + '>' + escapeHtml(it.label) + '</a>';
      }).join('') +
    '</nav>';

    // A no-JS fallback nav some pages carry; the real one is up now.
    var fallback = document.querySelector('.site-nav-fallback');
    if(fallback) fallback.remove();

    if(window.HubProgress) window.HubProgress.mount(cfg.subject, { href: cfg.progressHref });
    if(window.StudyHubAccount) window.StudyHubAccount.renderAccountUI();

    wireOverflowFade(nav.querySelector('.course-nav__inner'));
    renderBottomNav(cfg, mount);
    wireControls(courseKey);

    syncHeights();
    requestAnimationFrame(syncHeights);
    if(document.fonts && document.fonts.ready) document.fonts.ready.then(syncHeights);

    mountSkipLink(nav);
    mountTutor(cfg);
    mountAnnouncer();
    mountAnalytics();
    mountReminders();
    mountMotion();
  }

  /* The same row 1 for the pages outside any course: the hub, search, 404,
     terms, privacy, sources, the changelog and the account page. No course
     name, no tabs, the neutral rank names. Each of those pages carries the
     wordmark in its HTML so the row is never empty before this runs. */
  function renderSite(opts){
    opts = opts || {};
    var mount = document.getElementById('site-header');
    if(!mount) return;
    mount.innerHTML = headerHtml({ courseKey: '', progressHref: opts.progressHref || '' });
    if(window.HubProgress) window.HubProgress.mount('hub', { href: opts.progressHref || '' });
    if(window.StudyHubAccount) window.StudyHubAccount.renderAccountUI();
    wireControls('');
    syncHeights();
    requestAnimationFrame(syncHeights);
    mountMotion();
  }

  /* Study reminders, mounted here for the same reason as the three above: the
     scheduler that decides what is due lives in each course, but the thing
     that can say so belongs on every page. assets/reminders.js is inert until
     a VAPID key is configured in it, so this is a no-op until then. */
  function mountReminders(){
    // Already loaded means a page asked for it directly — privacy.html does,
    // because it carries the on/off switch and draws its own header rather
    // than calling render(), so this hook never runs there.
    if(window.__levlRemindersMounted || window.LevlReminders) return;
    window.__levlRemindersMounted = true;
    var el = document.createElement('script');
    el.src = '/assets/reminders.js';
    el.defer = true;
    document.head.appendChild(el);
  }

  /* The XP chip, the level-up toast and the bars filling on arrival. Mounted
     here for the same reason as the announcer: every page renders this
     header, so no page has to ask. Loaded async — the progression engine
     fires plain DOM events, so a page that awards XP before this lands
     simply misses one chip. */
  function mountMotion(){
    if(window.__levlMotionMounted) return;
    window.__levlMotionMounted = true;
    var el = document.createElement('script');
    el.src = '/assets/motion.js';
    el.defer = true;
    document.head.appendChild(el);
  }

  /* Where "skip to content" should land. A real <main> if the page has one,
     otherwise the first real element after the tab row — every page on the
     site opens its content with a .xshell or .wrap right there. Script,
     style and the no-JS nav fallback are stepped over: the fallback is
     removed a few lines above this runs, but not on a page that never had
     one, and landing the skip link on an empty noscript is landing it
     nowhere. */
  function findContentStart(nav){
    var explicit = document.querySelector('main');
    if(explicit) return explicit;
    var el = nav && nav.nextElementSibling;
    var skip = { NOSCRIPT:1, SCRIPT:1, STYLE:1, TEMPLATE:1, LINK:1 };
    while(el){
      // The breadcrumb row (build-crumbs.mjs) is navigation, not content.
      if(!skip[el.tagName] && !el.hasAttribute('data-crumb')) return el;
      el = el.nextElementSibling;
    }
    return null;
  }

  /* The page footer is contentinfo, which must not sit inside main (axe
     landmark-contentinfo-is-top-level; audit 2026-10 found it inside on most
     pages, because the content wrapper that becomes main also holds the
     footer). When the footer is the last thing in main, its block moves to a
     sibling wrapper with the same width classes right after main, so the
     layout is unchanged. A footer elsewhere (inside an article) is left. */
  function liftFooter(main){
    if(!main) return;
    var f = main.querySelector('footer');
    if(!f) return;
    var top = f;
    while(top.parentNode && top.parentNode !== main) top = top.parentNode;
    if(top.parentNode !== main || (top !== f && top.textContent.trim() !== f.textContent.trim())) return;
    var after = top.nextElementSibling;
    while(after && /^(SCRIPT|STYLE|TEMPLATE|NOSCRIPT)$/.test(after.tagName)) after = after.nextElementSibling;
    if(after) return;
    var shell = document.createElement('div');
    shell.className = (main.className.match(/\b(xshell|wrap|narrow)\b/g) || ['xshell']).join(' ');
    // .wrap pads top and bottom: the footer takes over the bottom padding.
    if(/\bwrap\b/.test(shell.className)){ shell.style.paddingTop = '0'; main.style.paddingBottom = '0'; }
    main.parentNode.insertBefore(shell, main.nextSibling);
    shell.appendChild(top);
  }

  /* Injected rather than written into all 110 pages, for the same reason the
     header itself is: one place to fix, and a page added later gets it
     without anyone remembering to. Inserted as the first child of <body> so
     it is the first thing the keyboard reaches — anywhere further down and it
     is behind the chrome it exists to skip. */
  function mountSkipLink(nav){
    if(document.getElementById('levlSkipLink')) return;
    var target = findContentStart(nav);
    if(!target) return;
    if(!target.id) target.id = 'levl-main';
    target.setAttribute('data-skip-target', '');
    if(!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');

    /* The same element is the page's main landmark, which almost no page here
       declared: four files out of 180 had a <main>. The skip link and the
       landmark are two answers to one question — "where does the content
       start" — and this function has already worked it out, so a page that
       does not say for itself gets the answer applied both ways rather than
       only to the link.

       role="main" rather than swapping the tag, because these are <div>s and
       <section>s that pages build their own layout out of; the role is what a
       screen reader's landmark list reads, and changing the element under a
       page's CSS is a much larger thing to do from here. A page that already
       declares <main> keeps it — nothing below overrides one. */
    if(!document.querySelector('main, [role="main"]')){
      target.setAttribute('role', 'main');
    }

    liftFooter(document.querySelector('main, [role="main"]'));

    var a = document.createElement('a');
    a.id = 'levlSkipLink';
    a.className = 'skip-link';
    a.href = '#' + target.id;
    a.textContent = 'Skip to content';
    document.body.insertBefore(a, document.body.firstChild);
  }

  /* The study assistant. Mounted here rather than per page because every page
     in both courses already renders this header — one hook covers all of them,
     including ochem's 140-odd lesson, mechanism and tool pages, and any page
     added later gets it for free. The tutor reads the course off
     window.LEVLPREP_COURSE to pick which material to index. */
  function mountTutor(cfg){
    if(window.__levlTutorMounted) return;
    window.__levlTutorMounted = true;
    // cfg.subject is the course's own identifier — the same one it uses to
    // namespace sync and pick its rank names — so the tutor keys off that
    // rather than guessing from a URL.
    window.LEVLPREP_COURSE = {
      key: courseKeyOf(cfg.subject),
      name: cfg.course || 'LevlPrep'
    };
    // Only the corner button; it fetches assets/tutor.js on first reach
    // (site audit 2026-10, performance).
    var el = document.createElement('script');
    el.src = '/assets/tutor-launcher.js';
    el.defer = true;
    document.head.appendChild(el);
  }

  /* The screen-reader announcer, mounted the same way and for the same reason
     as the tutor: it belongs on every page of every course, so no page should
     have to remember to ask for it. Loaded async — every caller guards on
     window.LevlAnnounce, and nothing announces anything until the user has
     answered something, long after this has landed. */
  function mountAnnouncer(){
    if(window.__levlAnnouncerMounted) return;
    window.__levlAnnouncerMounted = true;
    var el = document.createElement('script');
    el.src = '/assets/announce.js';
    el.defer = true;
    document.head.appendChild(el);
  }

  /* Analytics, mounted here for the same reason as the two above: every page
     of both courses renders this header, so one hook covers all 173 of them
     without a script tag per page. assets/analytics.js is inert until a
     website id is configured in it, so this is a no-op until then. */
  function mountAnalytics(){
    if(window.__levlAnalyticsLoaderMounted) return;
    window.__levlAnalyticsLoaderMounted = true;
    var el = document.createElement('script');
    el.src = '/assets/analytics.js';
    el.defer = true;
    el.onload = function(){
      if(window.LevlAnalytics) window.LevlAnalytics.mount();
    };
    document.head.appendChild(el);
  }

  /* Offline support: one root-scoped worker for the whole site, so its scope
     covers the shared /assets/ modules every course depends on. */
  function registerServiceWorker(){
    if(!('serviceWorker' in navigator)) return;
    window.addEventListener('load', function(){
      navigator.serviceWorker.register('/sw.js').catch(function(){ /* best-effort */ });
    });
    // A new worker takes over open tabs at once (skipWaiting + claim) while
    // the page on screen is still the old one: offer a reload. The first
    // install also fires controllerchange, with nothing old to replace.
    var hadController = !!navigator.serviceWorker.controller;
    navigator.serviceWorker.addEventListener('controllerchange', function(){
      if(hadController && !document.querySelector('.lp-update-toast')) showUpdateToast();
      hadController = true;
    });
  }

  function showUpdateToast(){
    var box = document.createElement('div');
    box.className = 'lp-update-toast';
    box.setAttribute('role', 'status');
    box.style.cssText = 'position:fixed;left:16px;right:16px;bottom:16px;margin:auto;max-width:420px;z-index:2147483000;' +
      'display:flex;gap:12px;align-items:center;padding:10px 14px;border-radius:12px;background:#17241F;color:#fff;font:600 14px/1.4 system-ui,sans-serif';
    box.innerHTML = '<span style="flex:1">A new version of LevlPrep is ready.</span>' +
      '<button type="button" style="font:inherit;border:0;border-radius:8px;padding:6px 12px;cursor:pointer">Reload</button>' +
      '<button type="button" aria-label="Dismiss" style="font:inherit;border:0;background:none;color:#fff;cursor:pointer">×</button>';
    var b = box.querySelectorAll('button');
    b[0].onclick = function(){ location.reload(); };
    b[1].onclick = function(){ box.remove(); };
    document.body.appendChild(box);
  }


  /* ---- "add to home screen" -------------------------------------------

     An installed copy is a different product from a tab: it keeps its own
     icon on the home screen, opens without browser chrome, works offline
     through the worker above, and on iPhone it is the only way the site
     could ever be allowed to send a notification. People who install come
     back; people with a bookmark buried in a tab list mostly do not.

     Chrome hands us the moment on a plate via beforeinstallprompt, which is
     deferred here so the browser's own bar does not appear at whatever
     instant it feels like. Safari has no such event and no API at all, so
     iOS gets the two-step instruction instead — worth saying out loud,
     because "Share, then Add to Home Screen" is not discoverable and is the
     exact step an iPhone user has to take.

     Never on a first visit. Someone still deciding whether this site is any
     good does not want a box asking them to install it; that is the pop-up
     everyone has learned to dismiss without reading, and spending the ask
     there wastes it. The visit history analytics.js already keeps says
     whether they have been back. */
  var INSTALL_KEY = 'levlprep_install_prompt';
  var INSTALL_MAX_SHOWN = 2;
  var INSTALL_COOLDOWN_DAYS = 14;
  var deferredInstall = null;

  function readJSONSafe(key, fallback){
    try {
      var raw = JSON.parse(localStorage.getItem(key) || 'null');
      return (raw && typeof raw === 'object') ? raw : fallback;
    } catch(e){ return fallback; }
  }

  function installState(){ return readJSONSafe(INSTALL_KEY, { shown: 0, dismissed: 0, last: null }); }

  function writeInstallState(st){
    try { localStorage.setItem(INSTALL_KEY, JSON.stringify(st)); } catch(e){ /* private mode */ }
  }

  function daysSinceDayKey(key){
    if(!key) return Infinity;
    var p = String(key).split('-');
    if(p.length !== 3) return Infinity;
    var then = new Date(+p[0], +p[1] - 1, +p[2]);
    var now = new Date();
    now = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return Math.round((now - then) / 86400000);
  }

  function todayKey(){
    var d = new Date();
    return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2);
  }

  function isStandalone(){
    try {
      if(window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) return true;
    } catch(e){ /* older browser */ }
    return !!window.navigator.standalone; // iOS reports it here and nowhere else
  }

  function isIosSafari(){
    var ua = navigator.userAgent || '';
    var ios = /iPad|iPhone|iPod/.test(ua) ||
      // iPadOS 13+ reports itself as a Mac; the touch points give it away.
      (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
    if(!ios) return false;
    // Chrome and Firefox on iOS cannot install anything; only Safari can.
    return !/CriOS|FxiOS|EdgiOS|OPiOS/.test(ua);
  }

  function hasBeenBackBefore(){
    // Written by assets/analytics.js. Absent means either a first visit or a
    // browser that refuses storage; both are reasons not to ask.
    var v = readJSONSafe('levlprep_visits', null);
    return !!(v && (v.days || 0) >= 2);
  }

  function mayShowInstall(){
    if(isStandalone()) return false;             // already installed
    if(document.querySelector('.levl-prompt')) return false;
    if(!hasBeenBackBefore()) return false;
    var st = installState();
    if(st.shown >= INSTALL_MAX_SHOWN) return false;
    // One "no" is enough here. Installing is a bigger ask than signing in and
    // a second pitch after a refusal is just badgering.
    if(st.dismissed >= 1) return false;
    return daysSinceDayKey(st.last) >= INSTALL_COOLDOWN_DAYS;
  }

  function showInstallPrompt(){
    if(!mayShowInstall()) return;

    var st = installState();
    st.shown += 1;
    st.last = todayKey();
    writeInstallState(st);

    var ios = !deferredInstall && isIosSafari();
    var el = document.createElement('div');
    el.className = 'levl-prompt';
    el.id = 'installPrompt';
    el.setAttribute('role', 'status');
    el.innerHTML =
      '<div class="levl-prompt__text">' +
        '<b>Keep LevlPrep on your home screen</b>' +
        '<small>' + (ios
          ? 'Tap Share, then “Add to Home Screen”. It opens full screen and works offline.'
          : 'Opens full screen, works offline, and keeps your place.') +
        '</small>' +
      '</div>' +
      '<div class="levl-prompt__actions">' +
        (ios ? '' : '<button type="button" class="levl-prompt__yes" id="installPromptYes">Install</button>') +
        '<button type="button" class="levl-prompt__no" id="installPromptNo">' + (ios ? 'Got it' : 'Not now') + '</button>' +
      '</div>';
    document.body.appendChild(el);
    requestAnimationFrame(function(){ el.classList.add('show'); });

    function close(dismissed){
      if(dismissed){
        var s2 = installState();
        s2.dismissed += 1;
        writeInstallState(s2);
      }
      el.classList.remove('show');
      setTimeout(function(){ if(el.parentNode) el.parentNode.removeChild(el); }, 350);
    }

    var yes = document.getElementById('installPromptYes');
    if(yes) yes.addEventListener('click', function(){
      close(false);
      if(!deferredInstall) return;
      var evt = deferredInstall;
      deferredInstall = null;   // a beforeinstallprompt event is single-use
      evt.prompt();
      evt.userChoice.then(function(choice){
        if(window.LevlAnalytics) window.LevlAnalytics.event('install-prompt-choice', { outcome: choice && choice.outcome });
      }).catch(function(){ /* dismissed by the browser */ });
    });
    document.getElementById('installPromptNo').addEventListener('click', function(){
      // On iOS this button is an acknowledgement, not a refusal — there is
      // nothing to accept, so treating it as a "no" would burn the one ask.
      close(!ios);
    });

    setTimeout(function(){ if(el.parentNode) close(false); }, 15000);
    if(window.LevlAnalytics) window.LevlAnalytics.event('install-prompt-shown', { platform: ios ? 'ios' : 'other' });
  }

  function watchForInstall(){
    window.addEventListener('beforeinstallprompt', function(e){
      e.preventDefault();          // ours to time, not the browser's
      deferredInstall = e;
      setTimeout(showInstallPrompt, 6000);
    });
    window.addEventListener('appinstalled', function(){
      if(window.LevlAnalytics) window.LevlAnalytics.event('installed');
      // Nothing left to ask for; make sure a later visit never asks again.
      writeInstallState({ shown: INSTALL_MAX_SHOWN, dismissed: 1, last: todayKey() });
    });
    // Safari fires no event, so the iOS path has to start its own clock. Long
    // enough that it lands after the page is read rather than during arrival.
    if(isIosSafari()) setTimeout(showInstallPrompt, 12000);
  }

  /* Whether the viewer has asked their OS to keep motion down.

     The CSS half of this is a blanket rule in theme.css, but a good deal of
     the site's movement is driven from JavaScript and cannot be reached that
     way: a smooth scroll asked for by scrollTo, a camera flight on the body
     map. Those call sites ask here.

     Lives on the chrome because the chrome is the one module every page in
     both courses already loads blocking, so a page script can call it while
     it parses without checking whether it has arrived yet. Read live rather
     than cached: the preference can be toggled in the OS while the page is
     open, and matchMedia reflects that immediately. */
  function reducedMotion(){
    return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }

  /* Scroll to a position, honoring that preference. Every smooth scroll on the
     site goes through this rather than passing behavior:'smooth' directly. */
  function scrollToY(top){
    window.scrollTo(reducedMotion() ? { top: top } : { top: top, behavior: 'smooth' });
  }

  /* Same, for bringing an element into view. */
  function scrollIntoView(el, opts){
    if(!el) return;
    var o = {};
    for(var k in (opts || {})) if(Object.prototype.hasOwnProperty.call(opts, k)) o[k] = opts[k];
    o.behavior = reducedMotion() ? 'auto' : 'smooth';
    el.scrollIntoView(o);
  }

  window.LevlMotion = {
    reduced: reducedMotion,
    scrollToY: scrollToY,
    scrollIntoView: scrollIntoView
  };

  /* At module scope rather than inside render(): Chrome can fire
     beforeinstallprompt before a page has called render(), and an event with
     no listener is simply gone — with it, the only chance to offer the
     install on our own terms. This file is deferred on every page, so the
     listener is attached everywhere and costs nothing where it never fires. */
  watchForInstall();

  /* A page outside the courses marks its header with data-site-header and
     loads this file; that is all it needs for the shared row 1. */
  function autoSite(){
    var h = document.getElementById('site-header');
    if(h && h.hasAttribute('data-site-header')) renderSite();
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', autoSite);
  else autoSite();

  window.LevlChrome = {
    render: render,
    renderSite: renderSite,
    setTheme: setTheme,
    syncHeights: syncHeights,
    registerServiceWorker: registerServiceWorker,
    HUB_URL: HUB_URL,
    THEME_KEY: THEME_KEY,
  };
})();
