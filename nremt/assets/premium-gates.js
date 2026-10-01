/* NREMT's side of Premium. assets/premium.js owns the split (COURSES.nremt)
   and the launch switch; this turns it into the decisions the NREMT pages make,
   so they ask one place and the rules are testable without a page.
   Before launch nothing here locks, counts or writes. Without premium.js
   everything stays open: a soft gate, never a broken page. Locks hide doors,
   never records: missed lists, mastery, history and XP keep accruing.
   The free exam is spent when it starts (so reading one and abandoning it is
   not a loop); nav.js syncs the flag. */
(function (window) {
  'use strict';

  var COURSE = 'nremt';
  var FREE_EXAM_KEY = 'nremt_free_exam_v1';

  function api() { return window.LevlPremium || null; }

  /* True only after launch, for someone without an active pass. */
  function locked() {
    var p = api();
    return !!(p && p.launched && p.launched() && !p.has(COURSE));
  }

  function badge() {
    var p = api();
    return p ? p.badge(COURSE) : '';
  }

  /* The locked card for `feature`, or '' when it is open. Only ever non-empty
     when locked(), so a caller can use it as the test as well as the markup. */
  function gate(feature, source) {
    var p = api();
    return locked() && p ? p.gate(COURSE, feature, source || feature) : '';
  }

  /* ---- the daily allowance ---------------------------------------------- */

  // The timed exam has its own one-exam rule; every other way of being shown a
  // bank question (drills, weak-spot, flagged, a search result, flashcard
  // flips) draws on the same 15.
  function quotaApplies(mode) { return locked() && mode !== 'full'; }

  function quotaLeft() {
    if (!locked()) return Infinity;
    return api().quota(COURSE).left;
  }

  /* Counts one question served. True when it may be shown. */
  function take() {
    if (!locked()) return true;
    return api().quota(COURSE).take(1);
  }

  /* ---- the one free exam ------------------------------------------------ */

  function readFlag() {
    try {
      var raw = window.localStorage.getItem(FREE_EXAM_KEY);
      var v = raw ? JSON.parse(raw) : null;
      return v && typeof v.at === 'number' ? v : null;
    } catch (e) { return null; }
  }

  function freeExamUsed() { return !!readFlag(); }

  function canStartExam() { return !locked() || !freeExamUsed(); }

  /* Called as an exam starts. Records the free exam only when it is the free
     one being spent: never before launch, never for a member. */
  function examStarted() {
    if (!locked() || freeExamUsed()) return;
    try { window.localStorage.setItem(FREE_EXAM_KEY, JSON.stringify({ at: Date.now() })); }
    catch (e) { /* private mode: the exam still runs */ }
  }

  /* ---- whole features ---------------------------------------------------- */

  // 'review' (missed queue and spaced review), 'readiness' (the score and the
  // domain breakdowns), 'scenarios' (the simulator).
  function canUse(feature) {
    if (feature === 'exam') return canStartExam();
    return !locked();
  }

  /* Calls fn now and whenever access changes (sign-in, a pass bought). */
  function onChange(fn) {
    var p = api();
    if (p && p.onChange) p.onChange(fn);
    else fn();
  }

  window.NremtGates = {
    FREE_EXAM_KEY: FREE_EXAM_KEY,
    locked: locked,
    badge: badge,
    gate: gate,
    quotaApplies: quotaApplies,
    quotaLeft: quotaLeft,
    take: take,
    freeExamUsed: freeExamUsed,
    canStartExam: canStartExam,
    examStarted: examStarted,
    canUse: canUse,
    onChange: onChange,
  };
})(window);
