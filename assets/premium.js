/* Premium, before there is a Premium — the waitlist.

   Every course on the site is free, and nothing here changes that. What this
   file does is find out whether anyone would pay, before a checkout, a price
   or a single locked page gets built. docs/premium.md has the whole plan and
   the research behind it; the short version is that a paywall on a new site
   mostly costs visitors, so the first step is a question rather than a gate.

   The question is asked in one place per course: the end of a real session,
   which is the moment a student has just seen what the site does for them.
   Not on page load, not in a banner, not on every page — a card under the
   score, with a button that says what it does.

   DESIGN NOTES
   ------------
   - **One file for every course.** COURSES below is the free/premium split
     for each course, written once, in the same shape, so a new course is one
     more entry rather than a new design. It is also the list the dialog
     shows, so what someone signs up for is exactly what is written here.
   - **It does not pretend.** The card says Premium is coming, not that it is
     here, and the dialog says what happens next: one email, when it launches.
     A fake door that looks like a real checkout gets clicks that mean nothing
     and costs the trust of the people who clicked.
   - **An email, not just a click.** Clicks come from curiosity and misreads;
     an address typed into a box is the signal worth counting. Both are
     counted (premium-interest, premium-waitlist-joined) so the gap between
     them is visible.
   - **Once per browser per course.** After joining, the card becomes a
     receipt. Asking again after every session would turn a question into
     nagging.
   - **It reuses the auth dialog's styles**, like report-question.js and for
     the same reason: one design system, in theme.css.
   - **A failure is never silent.** If the write does not land it says so and
     keeps the address in the box.

   Pages opt in by rendering LevlPremium.card(course, source) where the card
   belongs; one delegated listener handles every button. */
(function (window, document) {
  'use strict';

  var STORE_KEY = 'levlprep_waitlist_v1';

  /* The split, per course. Same rule everywhere: teaching and reference stay
     free, the first part of every course stays fully open, and Premium is
     serious practice — volume, exam simulation and the analytics on top.
     `price` is shown on the card and in the dialog: an address left beside
     a price is a much stronger signal than one left beside "coming soon".
     One-time passes, never auto-renewing; docs/premium.md has the reasoning. */
  var COURSES = {
    nremt: {
      name: 'NREMT-EMT Prep',
      price: '$29 for 90 days',
      free: [
        'Study notes, glossary, flowcharts, mnemonics and the body map',
        'Daily practice questions',
        'One full timed exam',
        'Your progress, XP and streak',
      ],
      premium: [
        'The full 2,106-question bank, unlimited',
        'Unlimited timed 100-question exams',
        'Readiness score and domain breakdowns',
        'Missed-question review and spaced repetition',
        'The clinical scenario simulator',
      ],
    },
    ochem: {
      name: 'Organic Chemistry',
      price: '$39 a semester',
      free: [
        'The textbook section for every topic',
        'Foundations chapters, fully interactive',
        'Some of the interactive tools',
        'Your progress, XP and streak',
      ],
      premium: [
        'Every interactive lesson and mechanism walkthrough',
        'The full 3,630-question practice bank',
        'Mastery dashboard and gap detection',
        'Spaced-repetition flashcards',
        'All eight interactive tools',
      ],
    },
  };

  var overlay = null;
  var lastFocused = null;
  var active = null; // { course, source }

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function readStore() {
    try { return JSON.parse(window.localStorage.getItem(STORE_KEY)) || {}; }
    catch (e) { return {}; }
  }

  function joined(course) { return readStore()[course] === true; }

  function markJoined(course) {
    try {
      var store = readStore();
      store[course] = true;
      window.localStorage.setItem(STORE_KEY, JSON.stringify(store));
    } catch (e) { /* private mode: the card just stays live */ }
  }

  /* Deliberately loose. The database checks the same shape, and the real test
     of an address is whether the launch email arrives; a strict pattern here
     only turns away valid addresses nobody thought of. */
  function validEmail(s) {
    return typeof s === 'string' && s.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
  }

  function card(course, source) {
    var c = COURSES[course];
    if (!c) return '';
    if (joined(course)) {
      return '<div class="premium-card is-joined">' +
        '<b>You’re on the Premium list</b>' +
        '<p>We’ll email you once, when it launches.</p>' +
      '</div>';
    }
    return '<div class="premium-card">' +
      '<span class="premium-card__tag">Coming soon</span>' +
      '<b>Premium for ' + esc(c.name) + '</b>' +
      (c.price ? '<span class="premium-card__price">' + esc(c.price) + ', one-time</span>' : '') +
      '<p>' + esc(c.premium.slice(0, 3).join(' · ')) + '.</p>' +
      '<button type="button" class="btn-press sm" data-premium-waitlist="' + esc(course) + '"' +
        ' data-premium-source="' + esc(source || '') + '">Get notified</button>' +
    '</div>';
  }

  function repaint(course) {
    var all = document.querySelectorAll('[data-premium-waitlist="' + course + '"]');
    for (var i = 0; i < all.length; i++) {
      var box = all[i].closest('.premium-card');
      if (box) box.outerHTML = card(course);
    }
  }

  function ensureDialog() {
    if (overlay) return overlay;
    overlay = document.createElement('div');
    overlay.className = 'auth-modal-overlay premium-overlay';
    overlay.id = 'premiumOverlay';
    overlay.innerHTML =
      '<div class="auth-modal premium-modal" role="dialog" aria-modal="true" aria-labelledby="premiumTitle" aria-describedby="premiumSub">' +
        '<button type="button" class="auth-modal-close" id="premiumClose" aria-label="Close">&times;</button>' +
        '<h2 id="premiumTitle">Premium is coming</h2>' +
        '<p class="auth-modal-sub" id="premiumSub"></p>' +
        '<div class="premium-lists" id="premiumLists"></div>' +
        '<form id="premiumForm" novalidate>' +
          '<label for="premiumEmail">Email' +
            '<input type="email" id="premiumEmail" autocomplete="email" maxlength="254" required>' +
          '</label>' +
          '<div class="auth-modal-msg" id="premiumMsg" role="alert" aria-live="polite"></div>' +
          '<button type="submit" class="auth-modal-submit" id="premiumSubmit">Tell me when it launches</button>' +
        '</form>' +
        '<p class="premium-fine">One email when it launches. No newsletter, and nothing changes on the site until then.</p>' +
      '</div>';
    document.body.appendChild(overlay);

    overlay.addEventListener('click', function (e) { if (e.target === overlay) close(); });
    document.getElementById('premiumClose').addEventListener('click', close);
    document.getElementById('premiumForm').addEventListener('submit', submit);

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

  function open(course, source, button) {
    var c = COURSES[course];
    if (!c) return;
    ensureDialog();
    active = { course: course, source: source || '' };
    lastFocused = button || document.activeElement;

    document.getElementById('premiumSub').textContent =
      'Premium for ' + c.name + (c.price ? ' (' + c.price + ', one-time, no subscription)' : '') +
      ' isn’t available yet. Leave your email and we’ll tell you when it is.';
    document.getElementById('premiumLists').innerHTML =
      listHtml('Premium', c.premium) + listHtml('Always free', c.free);
    var input = document.getElementById('premiumEmail');
    var account = window.StudyHubAccount;
    var user = account && account.user ? account.user() : null;
    if (!input.value && user && user.email) input.value = user.email;
    var msg = document.getElementById('premiumMsg');
    msg.textContent = '';
    msg.className = 'auth-modal-msg';
    var submitBtn = document.getElementById('premiumSubmit');
    submitBtn.disabled = false;
    submitBtn.textContent = 'Tell me when it launches';

    overlay.classList.add('open');
    document.documentElement.classList.add('auth-modal-open');
    input.focus();

    if (window.LevlAnalytics) window.LevlAnalytics.event('premium-interest', { course: course, source: active.source });
  }

  function close() {
    if (!overlay) return;
    overlay.classList.remove('open');
    document.documentElement.classList.remove('auth-modal-open');
    if (lastFocused && lastFocused.focus) { try { lastFocused.focus(); } catch (e) { /* gone from the DOM */ } }
    lastFocused = null;
    active = null;
  }

  function submit(e) {
    e.preventDefault();
    if (!active) return;
    var msg = document.getElementById('premiumMsg');
    var submitBtn = document.getElementById('premiumSubmit');
    var email = document.getElementById('premiumEmail').value.trim();

    if (!validEmail(email)) {
      msg.className = 'auth-modal-msg error';
      msg.textContent = 'That doesn’t look like an email address.';
      return;
    }
    var account = window.StudyHubAccount;
    if (!account || !account.rpc) {
      msg.className = 'auth-modal-msg error';
      msg.textContent = 'Couldn’t send that just now. Try again in a moment.';
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending…';
    msg.className = 'auth-modal-msg';
    msg.textContent = '';

    var sending = active;
    account.rpc('join_waitlist', {
      p_course: sending.course,
      p_email: email,
      p_source: sending.source || null,
    }).then(function (ok) {
      if (!ok) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Tell me when it launches';
        msg.className = 'auth-modal-msg error';
        msg.textContent = 'That didn’t send — you may be offline. Try again when you’re back.';
        return;
      }
      markJoined(sending.course);
      repaint(sending.course);
      if (window.LevlAnalytics) window.LevlAnalytics.event('premium-waitlist-joined', { course: sending.course, source: sending.source });
      close();
      if (window.LevlAnnounce) window.LevlAnnounce.say('You’re on the list.');
    });
  }

  function mount() {
    if (window.__levlPremiumMounted) return;
    window.__levlPremiumMounted = true;
    document.addEventListener('click', function (e) {
      var btn = e.target && e.target.closest && e.target.closest('[data-premium-waitlist]');
      if (!btn) return;
      e.preventDefault();
      open(btn.getAttribute('data-premium-waitlist'), btn.getAttribute('data-premium-source'), btn);
    });
  }

  window.LevlPremium = {
    card: card,
    COURSES: COURSES,
    /* Exported for scripts/test/premium.test.mjs. */
    _joined: joined,
    _markJoined: markJoined,
    _validEmail: validEmail,
  };

  mount();
})(window, document);
