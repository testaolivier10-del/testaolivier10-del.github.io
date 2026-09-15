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

   A page only needs an empty <div id="site-header"></div>; row 2 is injected
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

  /* Keeps the button's icon, tooltip and aria-pressed in step with the stored
     preference. Called on render and again on every change, including changes
     that did not come from this button. */
  function syncSoundButton(btn){
    if(!btn || !window.LevlSound) return;
    var on = window.LevlSound.isEnabled();
    btn.innerHTML = on ? SPEAKER_ON : SPEAKER_OFF;
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
    'Study Plan':'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
    'Review':    '<path d="M3 12a9 9 0 019-9 9 9 0 017 3.4M21 12a9 9 0 01-9 9 9 9 0 01-7-3.4"/><path d="M21 3v4h-4M3 21v-4h4"/>',
    'Tools':     '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2"/>',
    'Dashboard': '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
    'Mastery':   '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
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
    nav.setAttribute('aria-label', escapeHtml(cfg.course || 'Sections') + ' sections');
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
      return '<a href="' + it.href + '"' + (it.active ? ' class="active" aria-current="page"' : '') + '>' + escapeHtml(it.label) + '</a>';
    }).join('');
    document.body.appendChild(scrim);
    document.body.appendChild(sheet);
    var more = document.getElementById('levlMoreTab');
    function setOpen(open){
      sheet.classList.toggle('open', open);
      scrim.classList.toggle('open', open);
      more.setAttribute('aria-expanded', open ? 'true' : 'false');
    }
    more.addEventListener('click', function(){ setOpen(!sheet.classList.contains('open')); });
    scrim.addEventListener('click', function(){ setOpen(false); });
    document.addEventListener('keydown', function(e){ if(e.key === 'Escape') setOpen(false); });
  }

  function render(cfg){
    var mount = document.getElementById('site-header');
    if(!mount) return;
    // The course tint (see --ctint in theme.css) keys off this.
    document.body.setAttribute('data-course', cfg.subject === 'ochem' ? 'ochem' : 'nremt');

    mount.innerHTML =
      '<div class="site-header__inner">' +
        '<span class="site-header__brand-row">' +
          '<a class="hub-back" href="' + HUB_URL + '" title="Back to LevlPrep" aria-label="Back to LevlPrep">&larr;</a>' +
          '<a class="site-header__brand" href="' + HUB_URL + '">' +
            '<span class="brand-mark" aria-hidden="true">+</span> LevlPrep' +
          '</a>' +
          (cfg.course
            ? '<a class="site-header__course" href="' + cfg.courseHref + '">' + escapeHtml(cfg.course) + '</a>'
            : '') +
        '</span>' +
        '<div class="nav-right">' +
          '<a href="' + cfg.progressHref + '" class="nav-streak" id="navStreak" title="Daily streak" hidden>' + FLAME_SVG + '<span id="navStreakCount">0</span></a>' +
          '<a href="' + cfg.progressHref + '" class="level-badge" id="levelBadge" title="Your level">L1</a>' +
          '<span id="accountSlot"></span>' +
          (window.LevlSound
            ? '<button type="button" class="theme-toggle sound-toggle" id="soundToggle"></button>'
            : '') +
          '<button type="button" class="theme-toggle" id="themeToggle" aria-label="Toggle dark mode" title="Toggle dark mode">◑</button>' +
        '</div>' +
      '</div>';

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

    var sound = document.getElementById('soundToggle');
    if(sound && window.LevlSound){
      syncSoundButton(sound);
      window.LevlSound.onChange(function(){ syncSoundButton(sound); });
      sound.addEventListener('click', function(){ window.LevlSound.toggle(); });
    }

    var toggle = document.getElementById('themeToggle');
    if(toggle) toggle.addEventListener('click', function(){
      setTheme(document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
    });

    syncHeights();
    requestAnimationFrame(syncHeights);
    if(document.fonts && document.fonts.ready) document.fonts.ready.then(syncHeights);

    mountSkipLink(nav);
    mountTutor(cfg);
    mountAnnouncer();
    mountAnalytics();
    mountMotion();
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
      if(!skip[el.tagName]) return el;
      el = el.nextElementSibling;
    }
    return null;
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
      key: cfg.subject === 'ochem' ? 'ochem' : 'nremt',
      name: cfg.course || 'LevlPrep'
    };
    var el = document.createElement('script');
    el.src = '/assets/tutor.js';
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

  window.LevlChrome = {
    render: render,
    setTheme: setTheme,
    syncHeights: syncHeights,
    registerServiceWorker: registerServiceWorker,
    HUB_URL: HUB_URL,
    THEME_KEY: THEME_KEY,
  };
})();
