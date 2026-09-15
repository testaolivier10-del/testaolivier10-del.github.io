/* Stable identity for the NREMT question bank.

   Every record a learner accumulates here refers to questions by number:
   which they have been served (nremt_seen_questions), which they missed
   (nremt_exam100_missed), which they flagged (nremt_exam100_flagged), the
   per-question mastery record the spaced queue is built from (nremt_mastery),
   the shuffled option order each question is displayed in
   (nremt_option_order), and the half-finished attempt on disk
   (nremt_inprogress_exam).

   Those numbers used to be POSITIONS in questions.json. That made the bank
   append-only forever: deleting a wrong question, deduplicating two near
   copies, or sorting the file would shift every position after the edit and
   silently re-point every one of those records at a different question. A
   learner's missed queue would quietly fill with questions they had never
   seen, and nothing would throw. The cost of that constraint only grows with
   the number of people who have records.

   So each question now carries an `id` (scripts/build-question-bank.mjs
   assigns it, and never reassigns or reuses one), and everything above is
   keyed by id instead.

   WHY THERE IS NO MIGRATION STEP
   ------------------------------
   The ids were introduced by numbering the bank in its existing order, so at
   the moment of the change `id === index` for all 2,084 questions. Every
   number already on every device was therefore *already* a correct id, and
   the millions of stored integers needed no rewriting at all. That is the
   whole reason this file is small.

   Only one record changed shape rather than meaning: nremt_option_order was a
   positional ARRAY, and an array cannot survive a question being removed. It
   becomes an object keyed by id. readOrders() accepts either and returns the
   object, so the conversion happens the first time a browser loads the page
   and needs no marker, no version key and no ordering guarantee against
   account sync — which matters, because a device that has not yet converted
   can still be handed a synced copy from one that has.

   Everything here is shape-tolerant and idempotent for the same reason.
   Unknown ids (a question that has since been deleted) are dropped on read
   rather than carried, which is also the behaviour the old code should have
   had: a stale position past the end of the bank used to sit in the missed
   queue forever.

   Pure translation only — no localStorage access. The page owns its own reads
   and writes; this owns what the numbers in them mean.
   Tested in scripts/test/question-ids.test.mjs. */
(function (global) {
  'use strict';

  function attach(questions) {
    var list = Array.isArray(questions) ? questions : [];
    var idByIndex = new Array(list.length);
    var indexById = Object.create(null);

    for (var i = 0; i < list.length; i++) {
      var q = list[i];
      var id = q && q.id;
      // A bank built without ids (someone served the repo without running the
      // build script) falls back to the position, which is exactly what the id
      // would have been. Loud in CI — check-site.mjs fails on a missing id —
      // and silent here, because a missing build step should not hand a
      // student a dead page.
      if (typeof id !== 'number' || !isFinite(id)) id = i;
      idByIndex[i] = id;
      // First writer wins, so a duplicated id cannot make two positions
      // collapse into whichever came last.
      if (!(id in indexById)) indexById[id] = i;
    }

    function idOf(index) {
      return index >= 0 && index < idByIndex.length ? idByIndex[index] : undefined;
    }

    function indexOf(id) {
      var n = typeof id === 'string' ? Number(id) : id;
      var at = indexById[n];
      return at === undefined ? -1 : at;
    }

    /* Positions -> ids, for writing. Anything out of range is dropped. */
    function idsOf(indices) {
      var out = [];
      if (!Array.isArray(indices)) return out;
      for (var i = 0; i < indices.length; i++) {
        var id = idOf(indices[i]);
        if (id !== undefined) out.push(id);
      }
      return out;
    }

    /* Ids -> positions, for reading. An id no longer in the bank is dropped,
       which is how a deleted question leaves someone's queues. */
    function indicesOf(ids) {
      var out = [];
      if (!Array.isArray(ids)) return out;
      for (var i = 0; i < ids.length; i++) {
        var at = indexOf(ids[i]);
        if (at !== -1) out.push(at);
      }
      return out;
    }

    /* An object keyed by id (mastery) -> the same object with only the
       entries whose question still exists. */
    function pruneById(map) {
      var out = {};
      if (!map || typeof map !== 'object') return out;
      Object.keys(map).forEach(function (k) {
        if (indexOf(k) !== -1) out[k] = map[k];
      });
      return out;
    }

    /* nremt_option_order, in either shape, as an object keyed by id.

       The array form is what every browser has stored today: orders[position].
       Since id === index for every question that existed when ids came in,
       reading position p as id p is not an approximation — it is the identity
       the ids were chosen to give. */
    function readOrders(raw) {
      var out = {};
      if (!raw || typeof raw !== 'object') return out;
      if (Array.isArray(raw)) {
        for (var i = 0; i < raw.length; i++) {
          if (Array.isArray(raw[i])) out[i] = raw[i];
        }
        return out;
      }
      Object.keys(raw).forEach(function (k) {
        if (Array.isArray(raw[k]) && indexOf(k) !== -1) out[k] = raw[k];
      });
      return out;
    }

    /* The saved half-finished attempt. Its question list was `activeIndices`
       and is now `activeIds`; both are read, newest name first, and both mean
       ids for the reason above. Returns null when the attempt can no longer be
       reconstructed — a bank edit that removed a question it was asking is not
       something to grade around. */
    function readExamState(state) {
      if (!state || typeof state !== 'object') return null;
      var stored = Array.isArray(state.activeIds) ? state.activeIds
                 : Array.isArray(state.activeIndices) ? state.activeIndices
                 : null;
      if (!stored || !stored.length) return null;

      var indices = [];
      for (var i = 0; i < stored.length; i++) {
        var at = indexOf(stored[i]);
        if (at === -1) return null; // a question it was asking is gone
        indices.push(at);
      }

      var out = {};
      Object.keys(state).forEach(function (k) {
        if (k !== 'activeIds' && k !== 'activeIndices') out[k] = state[k];
      });
      out.activeIndices = indices;

      if (out.adaptiveState && Array.isArray(out.adaptiveState.sessionSeen)) {
        // Seen-in-this-session is advisory — it only steers what gets drawn
        // next — so a missing id here is dropped rather than fatal.
        out.adaptiveState = Object.assign({}, out.adaptiveState, {
          sessionSeen: indicesOf(out.adaptiveState.sessionSeen),
        });
      }
      return out;
    }

    function writeExamState(state) {
      var out = {};
      Object.keys(state || {}).forEach(function (k) {
        if (k !== 'activeIndices') out[k] = state[k];
      });
      out.activeIds = idsOf(state && state.activeIndices);
      if (out.adaptiveState && Array.isArray(out.adaptiveState.sessionSeen)) {
        out.adaptiveState = Object.assign({}, out.adaptiveState, {
          sessionSeen: idsOf(out.adaptiveState.sessionSeen),
        });
      }
      return out;
    }

    return {
      size: list.length,
      idOf: idOf,
      indexOf: indexOf,
      idsOf: idsOf,
      indicesOf: indicesOf,
      pruneById: pruneById,
      readOrders: readOrders,
      readExamState: readExamState,
      writeExamState: writeExamState,
    };
  }

  global.NremtQuestionIds = { attach: attach };
})(typeof window !== 'undefined' ? window : globalThis);
