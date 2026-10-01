/* Premium — the free/premium split for every course, in one file.

   docs/premium.md has the plan and the research behind it. The rule is the
   same in every course: teaching and reference stay free, the first part of
   each course stays fully open, and Premium is serious practice — volume,
   exam simulation and the analytics on top. Passes are one-time and never
   auto-renew. Progress someone has earned is never locked.

   THE LAUNCH SWITCH
   -----------------
   LAUNCHED below is false until the checkout is connected (Polar products,
   the Worker's /premium routes and the premium_passes table; docs/premium.md
   lists the steps). Until then:
     - has() is true for everyone, so nothing anywhere is locked;
     - badge() still marks what will be Premium, so the split is visible
       from day one and the launch takes nothing away by surprise;
     - the dialog collects launch-email sign-ups, as before.
   Flipping it to true is the launch: gates lock for free users, and the
   dialog sells passes instead.

   It is a soft gate. GitHub Pages serves every file to anyone, so a
   determined visitor can always read the data; what this controls is the
   app. That is the plan's deliberate first step.

   API (window.LevlPremium)
   ------------------------
   has(course)                 true if this browser may use that course's Premium
   isFreeChapter(course, ch)   true if a chapter id is in the always-open part
   gate(course, feature, src)  '' when allowed, else the HTML of a locked card
   badge(course)               a small "Premium" pill to put next to a feature
   card(course, source)        the end-of-session upsell card ('' for members)
   open(course, source)        open the dialog directly
   quota(course)               daily free allowance: {limit, used, left, take()}
   freeExam(course)            the one free exam: {available, used, use()}
   onChange(fn)                called (now and) whenever access changes
   Locked cards and pills open the dialog through one delegated listener
   ([data-premium-open]), so a page only renders HTML. */
(function (window, document) {
  'use strict';

  var LAUNCHED = true;

  // The Cloudflare Worker that creates checkouts and receives Polar's
  // webhooks (worker/src/premium.js).
  var ENDPOINT = 'https://levlprep-ask.testaolivier10.workers.dev';

  var STORE_KEY = 'levlprep_waitlist_v1';
  var ACCESS_KEY = 'levlprep_premium_v1';
  var QUOTA_KEY = 'levlprep_quota_v1';

  /* Founding-member offer: shown in the dialog, applied at checkout by the
     Worker (its FOUNDING_DISCOUNT_ID). Set `until` to null to end it. */
  var FOUNDING = { off: 30, until: '2027-01-31' };

  /* The split, per course. `free` and `premium` are what the dialog lists, so
     what someone pays for is exactly what is written here. `passes` must match
     PASSES in worker/src/premium.js; `freeChapters` is the always-open part.
     `dailyFree` is the free daily practice allowance, where a course has one. */
  var COURSES = {
    nremt: {
      name: 'NREMT-EMT Prep',
      dailyFree: 15,
      freeChapters: [],
      passes: [
        { id: 'nremt-90', label: '90 days', price: 29 },
      ],
      guarantee: 'Fail the NREMT while your pass is active and we extend it free until you pass.',
      free: [
        'Study notes, glossary, flowcharts, mnemonics, flashcards and the body map',
        '15 practice or review questions a day, any topic',
        'One full timed exam',
        'Your progress, XP, streak and weak topics',
      ],
      premium: [
        'The full 2,106-question bank, unlimited',
        'Unlimited timed 100-question exams',
        'Unlimited missed-question review and spaced repetition',
        'Readiness score and domain breakdowns',
        'The clinical scenario simulator',
      ],
    },
    ochem: {
      name: 'Organic Chemistry',
      dailyFree: 15,
      freeChapters: ['foundations', 'electron-movement', 'nomenclature', 'acids-bases'],
      passes: [
        { id: 'ochem-semester', label: 'Semester (5 months)', price: 29 },
        { id: 'ochem-year', label: 'Full year', price: 49 },
      ],
      free: [
        'The textbook section for every topic, and the flashcards',
        'The first four chapters, fully interactive',
        '15 practice or review questions a day from any chapter',
        'One full exam, and three of the interactive tools',
        'Your progress, XP, streak and weak topics',
      ],
      premium: [
        'Every interactive lesson and mechanism walkthrough',
        'The full 3,795-question bank, unlimited practice and review',
        'Unlimited exams',
        'Mastery dashboard and gap detection',
        'All eight interactive tools',
      ],
    },
    anp: {
      name: 'Anatomy & Physiology',
      dailyFree: 15,
      freeChapters: ['orientation', 'chem-physics', 'cells', 'tissues', 'cell-communication'],
      passes: [
        { id: 'anp-semester', label: 'Semester (5 months)', price: 29 },
        { id: 'anp-year', label: 'Full year (A&P I and II)', price: 49 },
      ],
      free: [
        'The notes page for every topic, the glossary and the flashcards',
        'The Foundations chapters, fully interactive',
        '15 practice or review questions a day from any chapter',
        'One full exam, and three of the interactive tools',
        'Your progress, XP, streak and weak topics',
      ],
      premium: [
        'Every interactive lesson',
        'The full question bank, unlimited practice and review',
        'Unlimited exams',
        'All the interactive tools, including the lab practical',
        'Detailed dashboard analytics',
      ],
    },
  };

  var overlay = null;
  var lastFocused = null;
  var active = null; // { course, source }
  var listeners = [];

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function readJson(key) {
    try { return JSON.parse(window.localStorage.getItem(key)) || {}; }
    catch (e) { return {}; }
  }
  function writeJson(key, value) {
    try { window.localStorage.setItem(key, JSON.stringify(value)); }
    catch (e) { /* private mode: nothing to remember, nothing breaks */ }
  }

  /* ---- access ---------------------------------------------------------- */

  /* { userId, courses: { nremt: '2027-01-01T…Z' } }, cached so a page knows on
     first paint, and tied to the user it was read for so signing out (or in as
     somebody else) never inherits another person's pass. */
  function access() { return readJson(ACCESS_KEY); }

  function currentUserId() {
    var a = window.StudyHubAccount;
    var u = a && a.user ? a.user() : null;
    return u ? u.id : null;
  }

  function expiry(course) {
    var a = access();
    // Before the session has been restored on page load the user is not known
    // yet; the cache is trusted until then so a member never sees a flash of
    // locks. A sign-out clears it (see refresh).
    var uid = currentUserId();
    if (!a.courses || !a.userId || (uid && a.userId !== uid)) return null;
    var t = a.courses[course] ? Date.parse(a.courses[course]) : NaN;
    return isNaN(t) ? null : t;
  }

  function has(course) {
    if (!LAUNCHED) return true;
    var t = expiry(course);
    return t !== null && t > Date.now();
  }

  function isFreeChapter(course, chapter) {
    var c = COURSES[course];
    return !!c && c.freeChapters.indexOf(chapter) !== -1;
  }

  function notify() {
    for (var i = 0; i < listeners.length; i++) {
      try { listeners[i](); } catch (e) { /* one page's bug is not another's */ }
    }
  }
  function onChange(fn) { listeners.push(fn); fn(); }

  /* Asks the database which passes this user holds. my_premium() in
     scripts/sql/schema.sql answers only for the signed-in user. */
  var seenUser = false;
  function refresh() {
    var a = window.StudyHubAccount;
    var uid = currentUserId();
    if (!uid) {
      // Only a real sign-out clears the cache; the null every page load starts
      // with, before the session is restored, does not.
      if (seenUser && access().userId) { writeJson(ACCESS_KEY, {}); notify(); }
      return;
    }
    seenUser = true;
    if (!a || !a.rpcData) return;
    a.rpcData('my_premium', {}).then(function (rows) {
      if (!Array.isArray(rows)) return; // offline: keep what we knew
      var courses = {};
      rows.forEach(function (r) { if (r && r.course) courses[r.course] = r.expires_at; });
      writeJson(ACCESS_KEY, { userId: uid, courses: courses });
      notify();
    });
  }

  /* ---- the daily free allowance ----------------------------------------- */

  function today() {
    var d = new Date();
    return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
  }

  /* Counted in this browser, reset at local midnight. Members and courses
     without an allowance get an unlimited quota, so callers never branch. */
  function quota(course) {
    var c = COURSES[course];
    var unlimited = !c || !c.dailyFree || has(course);
    var store = readJson(QUOTA_KEY);
    var mine = store[course] && store[course].day === today() ? store[course].used : 0;
    var limit = unlimited ? Infinity : c.dailyFree;
    return {
      limit: limit,
      used: mine,
      left: Math.max(0, limit - mine),
      take: function (n) {
        if (unlimited) return true;
        n = n || 1;
        var s = readJson(QUOTA_KEY);
        var used = s[course] && s[course].day === today() ? s[course].used : 0;
        if (used + n > limit) return false;
        s[course] = { day: today(), used: used + n };
        writeJson(QUOTA_KEY, s);
        return true;
      },
    };
  }

  /* The Premium funnel: Umami gets the event as before, and an anonymous
     daily count goes to the database (count_premium_step in
     scripts/sql/schema.sql), so the funnel can be read back without Umami:
     limit hit -> dialog opened -> checkout started -> paid. No user, no
     browser id, just a number per day; skipped when analytics is turned off.
     A gate counts once per page load per feature, however often it repaints. */
  var funnelSeen = {};
  function funnel(step, course, data) {
    var an = window.LevlAnalytics;
    if (an) an.event('premium-' + step, data);
    if (step === 'gate-shown') {
      var k = course + ':' + (data && data.feature);
      if (funnelSeen[k]) return;
      funnelSeen[k] = true;
    }
    if (an && an.optedOut && an.optedOut()) return;
    var a = window.StudyHubAccount;
    if (a && a.rpc && course) a.rpc('count_premium_step', { p_course: course, p_step: step });
  }

  /* ---- the free exam -------------------------------------------------------

     One full exam per course for free users. Used up when it starts (an
     attempt in progress can always be finished); remembered in this browser.
     Members and pre-launch visitors are never limited. NREMT keeps its own
     synced flag (nremt/assets/premium-gates.js) and does not use this. */
  var EXAM_KEY = 'levlprep_free_exam_v1';
  function freeExam(course) {
    var unlimited = !COURSES[course] || has(course);
    var used = !unlimited && readJson(EXAM_KEY)[course] === true;
    return {
      unlimited: unlimited,
      used: used,
      available: unlimited || !used,
      use: function () {
        if (unlimited) return true;
        var s = readJson(EXAM_KEY);
        if (s[course] === true) return false;
        s[course] = true;
        writeJson(EXAM_KEY, s);
        return true;
      },
    };
  }

  /* ---- what a page renders ---------------------------------------------- */

  function openAttrs(course, source) {
    return ' data-premium-open="' + esc(course) + '" data-premium-source="' + esc(source || '') + '"';
  }

  function badge(course) {
    if (!COURSES[course]) return '';
    if (LAUNCHED && has(course)) return '';
    return '<button type="button" class="premium-badge"' + openAttrs(course, 'badge') +
      ' title="' + (LAUNCHED ? 'Part of Premium' : 'Part of Premium — free until it launches') + '">Premium</button>';
  }

  function fromPrice(c) {
    var p = c.passes.map(function (x) { return x.price; });
    return '$' + Math.min.apply(null, p);
  }

  function gate(course, feature, source) {
    var c = COURSES[course];
    if (!c || has(course)) return '';
    funnel('gate-shown', course, { course: course, feature: feature || '' });
    return '<div class="premium-card premium-lock" data-premium-feature="' + esc(feature || '') + '">' +
      '<span class="premium-card__tag">Premium</span>' +
      '<b>' + esc(lockTitle(feature)) + '</b>' +
      '<p>' + esc(c.premium.slice(0, 3).join(' · ')) + '.</p>' +
      '<span class="premium-card__price">From ' + fromPrice(c) + ', one-time. No subscription.</span>' +
      '<button type="button" class="btn-press sm"' + openAttrs(course, source || feature) + '>See Premium</button>' +
    '</div>';
  }

  function lockTitle(feature) {
    if (feature === 'daily-limit') return 'That’s today’s 15 free questions';
    if (feature === 'exam') return 'You’ve used your free timed exam';
    return 'This is part of Premium';
  }

  function joined(course) { return readJson(STORE_KEY)[course] === true; }
  function markJoined(course) {
    var s = readJson(STORE_KEY);
    s[course] = true;
    writeJson(STORE_KEY, s);
  }

  /* The card under a finished session. Before launch it asks for a launch
     email; after, it offers the passes. Members see nothing. */
  function card(course, source) {
    var c = COURSES[course];
    if (!c) return '';
    if (LAUNCHED && has(course)) return '';
    if (!LAUNCHED && joined(course)) {
      return '<div class="premium-card is-joined">' +
        '<b>You’re on the Premium list</b>' +
        '<p>We’ll email you once, when it launches.</p>' +
      '</div>';
    }
    return '<div class="premium-card">' +
      '<span class="premium-card__tag">' + (LAUNCHED ? 'Premium' : 'Coming soon') + '</span>' +
      '<b>Premium for ' + esc(c.name) + '</b>' +
      '<span class="premium-card__price">From ' + fromPrice(c) + ', one-time</span>' +
      '<p>' + esc(c.premium.slice(0, 3).join(' · ')) + '.</p>' +
      '<button type="button" class="btn-press sm"' + openAttrs(course, source) + '>' +
        (LAUNCHED ? 'See Premium' : 'Get notified') + '</button>' +
    '</div>';
  }

  /* ---- the dialog ------------------------------------------------------- */

  function foundingLive() {
    return !!(FOUNDING.until && Date.now() < Date.parse(FOUNDING.until + 'T23:59:59Z'));
  }

  function passHtml(course, p) {
    var now = foundingLive() ? Math.round(p.price * (100 - FOUNDING.off)) / 100 : null;
    return '<li class="premium-pass">' +
      '<span><b>' + esc(p.label) + '</b>' +
      (now !== null
        ? ' <s>$' + p.price + '</s> <b class="premium-pass__now">$' + now.toFixed(2).replace(/\.00$/, '') + '</b>'
        : ' <b class="premium-pass__now">$' + p.price + '</b>') +
      '</span>' +
      '<button type="button" class="auth-modal-submit premium-buy" data-premium-buy="' + esc(p.id) + '">Get it</button>' +
    '</li>';
  }

  function ensureDialog() {
    if (overlay) return overlay;
    overlay = document.createElement('div');
    overlay.className = 'auth-modal-overlay premium-overlay';
    overlay.id = 'premiumOverlay';
    overlay.innerHTML =
      '<div class="auth-modal premium-modal" role="dialog" aria-modal="true" aria-labelledby="premiumTitle" aria-describedby="premiumSub">' +
        '<button type="button" class="auth-modal-close" id="premiumClose" aria-label="Close">&times;</button>' +
        '<h2 id="premiumTitle">Premium</h2>' +
        '<p class="auth-modal-sub" id="premiumSub"></p>' +
        '<div class="premium-lists" id="premiumLists"></div>' +
        '<div id="premiumBody"></div>' +
        '<div class="auth-modal-msg" id="premiumMsg" role="alert" aria-live="polite"></div>' +
        '<p class="premium-fine" id="premiumFine"></p>' +
      '</div>';
    document.body.appendChild(overlay);

    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) { close(); return; }
      var buy = e.target.closest && e.target.closest('[data-premium-buy]');
      if (buy) checkout(buy.getAttribute('data-premium-buy'), buy);
    });
    document.getElementById('premiumClose').addEventListener('click', close);
    overlay.addEventListener('submit', submitWaitlist);

    // On the document, not the overlay, for the reason report-question.js
    // gives: a disabled submit blurs focus to <body> and an overlay-bound
    // handler would stop hearing Escape at exactly that moment.
    document.addEventListener('keydown', function (e) {
      if (!overlay.classList.contains('open')) return;
      if (e.key === 'Escape') { close(); return; }
      if (e.key !== 'Tab') return;
      var list = Array.prototype.filter.call(
        overlay.querySelectorAll('button:not([disabled]), input:not([disabled])'),
        function (n) { return n.offsetParent !== null || n === document.activeElement; }
      );
      if (!list.length) return;
      var first = list[0], last = list[list.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });
    return overlay;
  }

  function listHtml(title, items) {
    return '<div><h3>' + esc(title) + '</h3><ul>' +
      items.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') + '</ul></div>';
  }

  function setMsg(text, kind) {
    var msg = document.getElementById('premiumMsg');
    msg.className = 'auth-modal-msg' + (kind ? ' ' + kind : '');
    msg.textContent = text || '';
  }

  function open(course, source, button) {
    var c = COURSES[course];
    if (!c) return;
    ensureDialog();
    active = { course: course, source: source || '' };
    lastFocused = button || document.activeElement;
    setMsg('');

    document.getElementById('premiumTitle').textContent =
      LAUNCHED ? 'Premium for ' + c.name : 'Premium is coming';
    document.getElementById('premiumLists').innerHTML =
      listHtml('Premium', c.premium) + listHtml('Always free', c.free);

    var body = document.getElementById('premiumBody');
    var fine = document.getElementById('premiumFine');
    if (LAUNCHED) {
      document.getElementById('premiumSub').textContent =
        'One-time passes. No subscription, nothing renews. Prices in US dollars, plus any sales tax or VAT, shown before you pay.' +
        (foundingLive() ? ' Founding-member price: ' + FOUNDING.off + '% off until ' + FOUNDING.until + '.' : '');
      body.innerHTML = '<ul class="premium-passes">' +
        c.passes.map(function (p) { return passHtml(course, p); }).join('') + '</ul>';
      // innerHTML for the one link; every other part is a fixed string or
      // escaped, as elsewhere in this dialog.
      fine.innerHTML = esc((c.guarantee ? c.guarantee + ' ' : '') +
        'When a pass ends, your progress stays; only the Premium parts lock again. ' +
        'Full refund within 7 days of buying, once per account. Sold by Polar, our merchant of record. ' +
        (course === 'nremt' ? 'Not affiliated with or endorsed by the National Registry of EMTs. ' : '')) +
        '<a href="/terms.html#premium" target="_blank" rel="noopener">Terms and refunds</a>';
    } else {
      document.getElementById('premiumSub').textContent =
        'Premium for ' + c.name + ' (from ' + fromPrice(c) + ', one-time, no subscription) isn’t on sale yet, ' +
        'and until it is, everything marked Premium is free. Leave your email and we’ll tell you when it launches.';
      body.innerHTML =
        '<form id="premiumForm" novalidate>' +
          '<label for="premiumEmail">Email' +
            '<input type="email" id="premiumEmail" autocomplete="email" maxlength="254" required>' +
          '</label>' +
          '<button type="submit" class="auth-modal-submit" id="premiumSubmit">Tell me when it launches</button>' +
        '</form>';
      fine.textContent = 'One email when it launches. No newsletter.';
      var input = document.getElementById('premiumEmail');
      var a = window.StudyHubAccount;
      var user = a && a.user ? a.user() : null;
      if (user && user.email) input.value = user.email;
    }

    overlay.classList.add('open');
    document.documentElement.classList.add('auth-modal-open');
    var first = overlay.querySelector('#premiumEmail, .premium-buy');
    if (first) first.focus();

    funnel('interest', course, { course: course, source: active.source });
  }

  function close() {
    if (!overlay) return;
    overlay.classList.remove('open');
    document.documentElement.classList.remove('auth-modal-open');
    if (lastFocused && lastFocused.focus) { try { lastFocused.focus(); } catch (e) { /* gone from the DOM */ } }
    lastFocused = null;
    active = null;
  }

  /* Buying needs an account: the pass is attached to it, so it follows the
     student to every device. Not signed in → sign in first, then come back to
     this dialog. Signed in → the Worker makes a Polar checkout and we go there. */
  function checkout(passId, button) {
    var a = window.StudyHubAccount;
    if (!a) { setMsg('Couldn’t reach checkout just now. Try again in a moment.', 'error'); return; }
    if (!currentUserId()) {
      var resume = active;
      close();
      var once = false;
      a.onAuthChange(function (u) { if (u && !once && resume) { once = true; open(resume.course, resume.source); } });
      a.openAuthModal('signup');
      return;
    }
    funnel('checkout-start', passId.split('-')[0], { course: active && active.course, pass: passId });
    button.disabled = true;
    button.textContent = 'Opening…';
    var course = passId.split('-')[0];
    a.accessToken().then(function (token) {
      if (!token) throw new Error('no session');
      return fetch(ENDPOINT + '/premium/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
        body: JSON.stringify({ pass: passId, returnTo: window.location.href }),
      });
    }).then(function (res) {
      return res.json().then(function (body) { return { ok: res.ok, body: body }; });
    }).then(function (r) {
      if (!r.ok || !r.body || !r.body.url) throw new Error((r.body && r.body.error) || 'checkout failed');
      var url = r.body.url;
      /* Pay on top of this page in Polar's own checkout frame. If that frame
         can't load (blocked script, old browser), fall back to Polar's page. */
      return loadEmbed().then(function (Embed) {
        close();
        return Embed.create(url, { theme: pageTheme() }).then(function (embed) {
          embed.addEventListener('success', function (ev) {
            ev.preventDefault(); // stay here instead of following the success URL
            embed.close();
            funnel('checkout-paid', course, { course: course, pass: passId });
            if (window.LevlAnnounce) window.LevlAnnounce.say('Payment received. Unlocking Premium…');
            pollForPass(course);
          });
        });
      }, function () { window.location.href = url; });
    }).catch(function () {
      button.disabled = false;
      button.textContent = 'Get it';
      setMsg('Checkout didn’t open — you may be offline. Nothing was charged. Try again in a moment.', 'error');
    });
  }

  /* Polar's embed script, pinned with its hash like the Supabase SDK in
     account.js, and loaded only when someone actually buys. The pages' CSP
     allows the frame it opens (frame-src polar.sh). */
  var EMBED_SRC = 'https://cdn.jsdelivr.net/npm/@polar-sh/checkout@0.4.1/dist/embed.global.js';
  var EMBED_INTEGRITY = 'sha384-e+NbGcSWhyE0uyrB+P19KffckB1jt91+Jk0PrKhB/hqpFXVT5bgULrccH8Xyz3jT';
  var embedPromise = null;
  function loadEmbed() {
    if (window.Polar && window.Polar.EmbedCheckout) return Promise.resolve(window.Polar.EmbedCheckout);
    if (embedPromise) return embedPromise;
    embedPromise = new Promise(function (resolve, reject) {
      var s = document.createElement('script');
      s.src = EMBED_SRC;
      s.integrity = EMBED_INTEGRITY;
      s.crossOrigin = 'anonymous';
      s.async = true;
      var timer = setTimeout(function () { reject(new Error('timeout')); }, 8000);
      s.onload = function () {
        clearTimeout(timer);
        if (window.Polar && window.Polar.EmbedCheckout) resolve(window.Polar.EmbedCheckout);
        else reject(new Error('no embed'));
      };
      s.onerror = function () { clearTimeout(timer); reject(new Error('load failed')); };
      document.head.appendChild(s);
    });
    embedPromise.catch(function () { embedPromise = null; });
    return embedPromise;
  }

  function pageTheme() {
    var t = document.documentElement.getAttribute('data-theme');
    if (t === 'dark' || t === 'light') return t;
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  /* The webhook that records the pass can land a few seconds after payment,
     so ask a few times before giving up quietly. */
  function pollForPass(course) {
    var tries = 0;
    (function poll() {
      refresh();
      if (course && expiry(course) && expiry(course) > Date.now()) {
        if (window.LevlAnnounce) window.LevlAnnounce.say('Premium is unlocked. Thank you!');
        notify();
        return;
      }
      if (++tries < 8) setTimeout(poll, 2500);
    })();
  }

  /* Coming back from Polar. Our success_url carries ?premium=success&course=,
     but Polar can send the buyer back with only ?customer_session_token=,
     so that counts too, with the course read from the page's folder.
     Payment is confirmed by the webhook, which can land a few seconds after
     the redirect, so ask again a few times before saying anything is wrong. */
  function returnCourse(search, pathname) {
    var q = {};
    String(search || '').replace(/^\?/, '').split('&').forEach(function (pair) {
      if (!pair) return;
      var i = pair.indexOf('=');
      var k = i === -1 ? pair : pair.slice(0, i);
      try { q[decodeURIComponent(k)] = i === -1 ? '' : decodeURIComponent(pair.slice(i + 1)); } catch (e) { /* skip */ }
    });
    if (q.premium !== 'success' && !Object.prototype.hasOwnProperty.call(q, 'customer_session_token')) return null;
    var course = q.course;
    if (course && Object.prototype.hasOwnProperty.call(COURSES, course)) return course;
    var path = String(pathname || '');
    if (path.indexOf('/nremt/') !== -1) return 'nremt';
    if (path.indexOf('/ochem/') !== -1) return 'ochem';
    if (path.indexOf('/anatomy-physiology/') !== -1) return 'anp';
    return '';
  }

  function handleReturn() {
    var course = returnCourse(window.location.search, window.location.pathname);
    if (course === null) return;
    try {
      var params = new URLSearchParams(window.location.search);
      ['premium', 'course', 'checkout_id', 'customer_session_token'].forEach(function (k) { params.delete(k); });
      var q = params.toString();
      window.history.replaceState(null, '', window.location.pathname + (q ? '?' + q : '') + window.location.hash);
    } catch (e) { /* old browser: the query just stays */ }
    pollForPass(course);
  }

  function validEmail(s) {
    return typeof s === 'string' && s.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
  }

  function submitWaitlist(e) {
    e.preventDefault();
    if (!active) return;
    var submitBtn = document.getElementById('premiumSubmit');
    var email = document.getElementById('premiumEmail').value.trim();
    if (!validEmail(email)) { setMsg('That doesn’t look like an email address.', 'error'); return; }
    var a = window.StudyHubAccount;
    if (!a || !a.rpc) { setMsg('Couldn’t send that just now. Try again in a moment.', 'error'); return; }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending…';
    setMsg('');
    var sending = active;
    a.rpc('join_waitlist', {
      p_course: sending.course,
      p_email: email,
      p_source: sending.source || null,
    }).then(function (ok) {
      if (!ok) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Tell me when it launches';
        setMsg('That didn’t send — you may be offline. Try again when you’re back.', 'error');
        return;
      }
      markJoined(sending.course);
      repaint(sending.course);
      if (window.LevlAnalytics) window.LevlAnalytics.event('premium-waitlist-joined', { course: sending.course, source: sending.source });
      close();
      if (window.LevlAnnounce) window.LevlAnnounce.say('You’re on the list.');
    });
  }

  function repaint(course) {
    var all = document.querySelectorAll('.premium-card [data-premium-open="' + course + '"]');
    for (var i = 0; i < all.length; i++) {
      var box = all[i].closest('.premium-card');
      if (box && !box.classList.contains('premium-lock')) box.outerHTML = card(course);
    }
  }

  function mount() {
    if (window.__levlPremiumMounted) return;
    window.__levlPremiumMounted = true;
    document.addEventListener('click', function (e) {
      var btn = e.target && e.target.closest && e.target.closest('[data-premium-open]');
      if (!btn) return;
      e.preventDefault();
      open(btn.getAttribute('data-premium-open'), btn.getAttribute('data-premium-source'), btn);
    });
    var a = window.StudyHubAccount;
    if (a && a.onAuthChange) a.onAuthChange(function () { refresh(); });
    handleReturn();
  }

  window.LevlPremium = {
    launched: function () { return LAUNCHED; },
    COURSES: COURSES,
    has: has,
    isFreeChapter: isFreeChapter,
    gate: gate,
    badge: badge,
    card: card,
    open: open,
    quota: quota,
    freeExam: freeExam,
    onChange: onChange,
    refresh: refresh,
    /* Exported for scripts/test/premium.test.mjs. */
    _joined: joined,
    _markJoined: markJoined,
    _validEmail: validEmail,
    _returnCourse: returnCourse,
    _setLaunched: function (v) { LAUNCHED = !!v; },
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount);
  else mount();
})(window, document);
