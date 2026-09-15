/* "This looks wrong" — reporting a bad question.

   sources.html has promised a way to tell us when a question is wrong since it
   was written. It explained the correction policy, said where corrections get
   listed, and then never said how to report one: the only address anywhere on
   the site was at the bottom of the privacy policy. So the promise was kept by
   nobody, which for a bank of 2,084 NREMT questions and 1,860 ochem ones is
   the most expensive gap on the site. No script can check whether an answer is
   clinically right. A student who has just answered a question and thinks the
   key is wrong is the only reviewer who can, and they are on the one screen
   where saying so costs them a tap.

   So it is a tap. It sits under the explanation, which is the moment the
   disagreement happens, not on a contact page the reader would have to go
   looking for while holding the thought.

   DESIGN NOTES
   ------------
   - **Four reasons and a box.** Most reports are one of a few things, and
     making someone write a sentence to say "the key is wrong" loses most of
     them. The note is optional and stays optional.
   - **Reported once per browser, and it says so.** The button becomes an inert
     "Reported" for that question from then on. It stops one reader sending the
     same report forty times from a review list, and — more to the point — it
     tells them their first one landed, which is the only reason they would not
     press it again.
   - **A question id, never a position.** Reports outlive edits to the bank; a
     report that named a position would point at a different question by the
     time anyone read it. See nremt/assets/question-ids.js.
   - **It reuses the auth dialog's styles rather than bringing its own.** There
     is one design system in theme.css on purpose — the two per-course copies
     that once existed drifted apart — and the same rule applies to the second
     dialog on the site as to the first.
   - **It behaves like a dialog**, for the same reasons the auth one does:
     Escape closes, Tab is trapped, focus returns to the button that opened it,
     the page behind cannot scroll, failures are announced through role="alert",
     and the textarea is 16px so iOS does not zoom the page on focus.
   - **A failure is never silent.** If the report does not land, it says so and
     leaves the button live, rather than thanking someone for something that
     went nowhere.

   Pages opt in by rendering a button with data-report-question="<id>" and
   data-report-course="<course>" anywhere in the document; one delegated
   listener covers every one of them, including buttons rendered after this
   file ran, which is all of them. */
(function (window, document) {
  'use strict';

  var STORE_KEY = 'levlprep_reported_v1';
  var REASONS = [
    ['wrong-answer', 'The marked answer is wrong'],
    ['unclear', 'The question is unclear or ambiguous'],
    ['typo', 'A typo or formatting problem'],
    ['outdated', 'It disagrees with current guidance'],
    ['other', 'Something else'],
  ];

  var overlay = null;
  var lastFocused = null;
  var active = null; // { course, id, button }

  function readStore() {
    try { return JSON.parse(window.localStorage.getItem(STORE_KEY)) || {}; }
    catch (e) { return {}; }
  }

  function keyFor(course, id) { return course + ':' + id; }

  function alreadyReported(course, id) {
    return readStore()[keyFor(course, id)] === true;
  }

  function markReported(course, id) {
    try {
      var store = readStore();
      store[keyFor(course, id)] = true;
      // Bounded. Someone working through a bank for months should not carry an
      // unbounded object in localStorage, and the oldest entries matter least:
      // the button they belong to is one they are not looking at.
      var keys = Object.keys(store);
      while (keys.length > 300) delete store[keys.shift()];
      window.localStorage.setItem(STORE_KEY, JSON.stringify(store));
    } catch (e) { /* private mode: the button just stays live */ }
  }

  /* Repaint every button on the page for a question that has been reported.
     The same question can appear more than once — a review list and a
     flashcard, say — and leaving the other copies live would invite a second
     report of something already sent. */
  function refreshButtons(course, id) {
    var all = document.querySelectorAll('[data-report-question]');
    for (var i = 0; i < all.length; i++) {
      var btn = all[i];
      if (btn.getAttribute('data-report-course') !== course) continue;
      if (btn.getAttribute('data-report-question') !== String(id)) continue;
      setReported(btn);
    }
  }

  function setReported(btn) {
    btn.disabled = true;
    btn.classList.add('is-reported');
    btn.textContent = 'Reported — thank you';
  }

  function ensureDialog() {
    if (overlay) return overlay;

    overlay = document.createElement('div');
    // The auth dialog's own classes. One design system; see the note above.
    overlay.className = 'auth-modal-overlay report-overlay';
    overlay.id = 'reportOverlay';
    overlay.innerHTML =
      '<div class="auth-modal report-modal" role="dialog" aria-modal="true" aria-labelledby="reportTitle" aria-describedby="reportSub">' +
        '<button type="button" class="auth-modal-close" id="reportClose" aria-label="Close">&times;</button>' +
        '<h2 id="reportTitle">Report this question</h2>' +
        '<p class="auth-modal-sub" id="reportSub">Thanks — this goes straight to whoever maintains the bank. Corrections are listed, dated, on What’s new.</p>' +
        '<form id="reportForm">' +
          '<fieldset class="report-reasons">' +
            '<legend>What’s wrong with it?</legend>' +
            REASONS.map(function (r, i) {
              return '<label class="report-reason">' +
                '<input type="radio" name="reportReason" value="' + r[0] + '"' + (i === 0 ? ' checked' : '') + '>' +
                '<span>' + r[1] + '</span>' +
              '</label>';
            }).join('') +
          '</fieldset>' +
          '<label class="report-note-label" for="reportNote">Anything to add? <span>Optional</span>' +
            '<textarea id="reportNote" rows="3" maxlength="1000" placeholder="If you know what the right answer is, or what your program teaches, say so here."></textarea>' +
          '</label>' +
          '<div class="auth-modal-msg" id="reportMsg" role="alert" aria-live="polite"></div>' +
          '<button type="submit" class="auth-modal-submit" id="reportSubmit">Send report</button>' +
        '</form>' +
      '</div>';
    document.body.appendChild(overlay);

    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) close();
    });
    document.getElementById('reportClose').addEventListener('click', close);
    document.getElementById('reportForm').addEventListener('submit', submit);

    /* Bound on the document rather than the overlay: disabling the submit
       button while a report is in flight blurs it to <body>, and a handler
       living on the overlay would go deaf at exactly that moment. Same lesson
       the auth dialog learned. */
    document.addEventListener('keydown', function (e) {
      if (!overlay.classList.contains('open')) return;
      if (e.key === 'Escape') { close(); return; }
      if (e.key !== 'Tab') return;
      var list = Array.prototype.filter.call(
        overlay.querySelectorAll('button:not([disabled]), input:not([disabled]), textarea, [tabindex]:not([tabindex="-1"])'),
        function (n) { return n.offsetParent !== null || n === document.activeElement; }
      );
      if (!list.length) return;
      var first = list[0], last = list[list.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });

    return overlay;
  }

  function open(course, id, button) {
    ensureDialog();
    active = { course: course, id: id, button: button };
    lastFocused = button || document.activeElement;

    document.getElementById('reportNote').value = '';
    document.getElementById('reportMsg').textContent = '';
    document.getElementById('reportMsg').className = 'auth-modal-msg';
    var submitBtn = document.getElementById('reportSubmit');
    submitBtn.disabled = false;
    submitBtn.textContent = 'Send report';
    var first = overlay.querySelector('input[name="reportReason"]');
    if (first) first.checked = true;

    overlay.classList.add('open');
    document.documentElement.classList.add('auth-modal-open');
    if (first) first.focus();

    if (window.LevlAnalytics) window.LevlAnalytics.event('report-opened', { course: course });
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

    var msg = document.getElementById('reportMsg');
    var submitBtn = document.getElementById('reportSubmit');
    var checked = overlay.querySelector('input[name="reportReason"]:checked');
    var reason = checked ? checked.value : 'other';
    var note = document.getElementById('reportNote').value.slice(0, 1000);

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
    account.rpc('report_question', {
      p_course: sending.course,
      p_question_id: String(sending.id),
      p_reason: reason,
      p_note: note || null,
    }).then(function (ok) {
      if (!ok) {
        // Never thank someone for something that went nowhere. Offline is the
        // common case here — the whole site works offline — and the honest
        // answer is that this one thing does not.
        submitBtn.disabled = false;
        submitBtn.textContent = 'Send report';
        msg.className = 'auth-modal-msg error';
        msg.textContent = 'That didn’t send — you may be offline. The report isn’t saved, so try again when you’re back.';
        return;
      }
      markReported(sending.course, sending.id);
      refreshButtons(sending.course, sending.id);
      if (window.LevlAnalytics) window.LevlAnalytics.event('report-sent', { course: sending.course, reason: reason });
      close();
      if (window.LevlAnnounce) window.LevlAnnounce.say('Report sent. Thank you.');
    });
  }

  /* One delegated listener for every button on the page, including the ones
     rendered after this file ran — which is all of them, since every question
     view on the site is built at runtime. */
  function mount() {
    if (window.__levlReportMounted) return;
    window.__levlReportMounted = true;

    document.addEventListener('click', function (e) {
      var btn = e.target && e.target.closest && e.target.closest('[data-report-question]');
      if (!btn || btn.disabled) return;
      e.preventDefault();
      /* The button can sit inside something that is itself clickable — the
         flashcard is one big click target that flips on any click in it. Left
         alone, pressing Report flipped the card away, which hid the button
         mid-dialog and left Escape with nothing to return focus to.

         This has to be stopped in the CAPTURE phase (see the listener's third
         argument below), not on the way back up: #fcCard's own handler is
         bound to the element, so by the time a bubbling document-level
         listener sees the click the card has already flipped. */
      e.stopPropagation();
      var id = btn.getAttribute('data-report-question');
      var course = btn.getAttribute('data-report-course') || 'nremt';
      if (alreadyReported(course, id)) { setReported(btn); return; }
      open(course, id, btn);
    }, true);

    // A button for an already-reported question should not come up live just
    // because the list it is in was re-rendered. Cheap enough to re-check on
    // every paint the page does, via the same delegated pass.
    document.addEventListener('levl:questions-rendered', paintAll);
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', paintAll);
    else paintAll();
  }

  function paintAll() {
    var store = readStore();
    var all = document.querySelectorAll('[data-report-question]');
    for (var i = 0; i < all.length; i++) {
      var btn = all[i];
      var k = keyFor(btn.getAttribute('data-report-course') || 'nremt', btn.getAttribute('data-report-question'));
      if (store[k] === true) setReported(btn);
    }
  }

  window.LevlReport = {
    mount: mount,
    paint: paintAll,
    /* The HTML for a button, so the pages that render question views do not
       each carry their own copy of the markup and the label. */
    button: function (course, id, extraClass) {
      return '<button type="button" class="report-btn' + (extraClass ? ' ' + extraClass : '') + '"' +
        ' data-report-course="' + course + '" data-report-question="' + String(id) + '">' +
        'Report a problem</button>';
    },
    /* Exported for scripts/test/report-question.test.mjs. */
    REASONS: REASONS,
    _alreadyReported: alreadyReported,
    _markReported: markReported,
  };

  mount();
})(window, document);
