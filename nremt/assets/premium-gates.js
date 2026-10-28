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
  // The adaptive exam has its own free attempt (owner, 2026-10-27), kept
  // apart from the timed exam's so taking one never spends the other.
  var FREE_CAT_KEY = 'nremt_free_cat_v1';
  function keyFor(kind) { return kind === 'cat' ? FREE_CAT_KEY : FREE_EXAM_KEY; }

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

  // The two exams (timed 'full' and adaptive 'cat') share the one-exam rule;
  // every other way of being shown a bank question (drills, weak-spot, flagged,
  // missed and spaced review, a search result, flashcard flips) draws on the
  // same 15.
  function quotaApplies(mode) { return locked() && mode !== 'full' && mode !== 'cat'; }

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

  function readFlag(kind) {
    try {
      var raw = window.localStorage.getItem(keyFor(kind));
      var v = raw ? JSON.parse(raw) : null;
      return v && typeof v.at === 'number' ? v : null;
    } catch (e) { return null; }
  }

  /* kind: 'full' (the timed exam, the default) or 'cat' (the adaptive exam). */
  function freeExamUsed(kind) { return !!readFlag(kind); }

  function canStartExam(kind) { return !locked() || !freeExamUsed(kind); }

  /* Called as an exam starts. Records the free exam only when it is the free
     one being spent: never before launch, never for a member. */
  function examStarted(kind) {
    if (!locked() || freeExamUsed(kind)) return;
    try { window.localStorage.setItem(keyFor(kind), JSON.stringify({ at: Date.now() })); }
    catch (e) { /* private mode: the exam still runs */ }
  }

  /* ---- whole features ---------------------------------------------------- */

  // 'readiness' (the score and the domain breakdowns) and 'scenarios' (the
  // simulator) are Premium. 'review' (missed queue and spaced review) is free
  // and shares the daily allowance: open while any of today's 15 is left, so
  // a spent allowance meets the 'daily-limit' gate, never a review lock.
  function canUse(feature) {
    if (feature === 'exam') return canStartExam('full');
    if (feature === 'cat') return canStartExam('cat');
    if (feature === 'review') return quotaLeft() > 0;
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
    FREE_CAT_KEY: FREE_CAT_KEY,
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
