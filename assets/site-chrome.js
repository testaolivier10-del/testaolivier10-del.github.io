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
  function render(cfg){
    var mount = document.getElementById('site-header');
    if(!mount) return;

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

    mountTutor(cfg);
    mountAnnouncer();
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

  /* Offline support: one root-scoped worker for the whole site, so its scope
     covers the shared /assets/ modules every course depends on. */
  function registerServiceWorker(){
    if(!('serviceWorker' in navigator)) return;
    window.addEventListener('load', function(){
      navigator.serviceWorker.register('/sw.js').catch(function(){ /* best-effort */ });
    });
  }

  window.LevlChrome = {
    render: render,
    setTheme: setTheme,
    syncHeights: syncHeights,
    registerServiceWorker: registerServiceWorker,
    HUB_URL: HUB_URL,
    THEME_KEY: THEME_KEY,
  };
})();
