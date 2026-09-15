/* nremt/assets/question-ids.js — stable question identity.

   This is the layer that decides what the numbers in a learner's records mean,
   and every one of its failure modes is silent. Point a missed queue at the
   wrong ids and the student simply reviews questions they never got wrong;
   nothing throws, and nobody finds out. So the cases that matter here are the
   ones where the bank has CHANGED since the records were written — a question
   deleted, questions reordered, questions appended — which is the entire
   reason ids exist and the one thing positions could not survive. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createBrowser } from './harness.mjs';

/* Values built inside the sandbox have that realm's Array and Object
   prototypes, which assert.deepEqual counts as a difference from the test
   realm's. The product code hands these straight to JSON.stringify on their
   way into localStorage, so comparing them the same way is both simpler than
   a cross-realm matcher and closer to what actually happens to them. */
const plain = (v) => JSON.parse(JSON.stringify(v));

function bank(ids) {
  return ids.map((id, i) => ({ id, q: 'question ' + id, options: ['a', 'b'], correct: i % 2 }));
}

function attach(ids) {
  const browser = createBrowser();
  browser.load('nremt/assets/question-ids.js');
  return browser.window.NremtQuestionIds.attach(bank(ids));
}

test('ids and positions agree on an unedited bank', () => {
  const qid = attach([0, 1, 2, 3, 4]);
  assert.equal(qid.size, 5);
  assert.equal(qid.idOf(3), 3);
  assert.equal(qid.indexOf(3), 3);
  // The property the whole design rests on: on the day ids were introduced,
  // every stored position was already a correct id, so nothing needed
  // rewriting on any device.
  assert.deepEqual(plain(qid.indicesOf([0, 1, 2, 3, 4])), [0, 1, 2, 3, 4]);
});

test('a deleted question shifts positions but not ids', () => {
  // Someone reported question 2 as wrong and it was removed from the bank.
  const qid = attach([0, 1, 3, 4]);
  // A learner who had flagged questions 3 and 4 still gets questions 3 and 4,
  // at their new positions. Under the old position-keyed scheme they would
  // have silently been handed 4 and nothing.
  assert.deepEqual(plain(qid.indicesOf([3, 4])), [2, 3]);
  assert.equal(qid.idOf(2), 3);
});

test('a deleted question drops out of a stored queue rather than aliasing', () => {
  const qid = attach([0, 1, 3, 4]);
  // Id 2 is gone. It is dropped, not silently resolved to whatever now sits
  // where it used to — and not carried forever the way an out-of-range
  // position used to sit in the missed queue.
  assert.deepEqual(plain(qid.indicesOf([1, 2, 3])), [1, 2]);
  assert.equal(qid.indexOf(2), -1);
});

test('reordering the bank does not move anyone’s records', () => {
  const sorted = attach([0, 1, 2, 3]);
  const shuffled = attach([3, 1, 0, 2]);
  // The same three ids mean the same three questions in both files.
  const before = sorted.indicesOf([0, 2, 3]).map((i) => sorted.idOf(i));
  const after = shuffled.indicesOf([0, 2, 3]).map((i) => shuffled.idOf(i));
  assert.deepEqual(plain(before).sort(), plain(after).sort());
});

test('appended questions get positions above the existing ids', () => {
  const qid = attach([0, 1, 2, 500, 501]);
  assert.equal(qid.indexOf(500), 3);
  assert.equal(qid.idOf(4), 501);
  // A gap in the id space is not a gap in the bank.
  assert.equal(qid.indexOf(7), -1);
});

test('idsOf drops out-of-range positions instead of writing undefined', () => {
  const qid = attach([0, 1, 2]);
  assert.deepEqual(plain(qid.idsOf([0, 2, 9, -1])), [0, 2]);
  assert.deepEqual(plain(qid.idsOf(null)), []);
  assert.deepEqual(plain(qid.indicesOf('not a list')), []);
});

test('string keys resolve, because object keys come back as strings', () => {
  const qid = attach([0, 1, 2]);
  // nremt_mastery is an object, so every id in it round-trips through JSON as
  // a string. Failing to resolve those would have emptied the spaced queue.
  assert.equal(qid.indexOf('2'), 2);
  assert.deepEqual(plain(qid.pruneById({ 0: { level: 3 }, 2: { level: 1 } })), {
    0: { level: 3 },
    2: { level: 1 },
  });
});

test('pruneById forgets the mastery record of a deleted question', () => {
  const qid = attach([0, 2]);
  const pruned = qid.pruneById({ 0: { level: 5 }, 1: { level: 2 }, 2: { level: 1 } });
  assert.deepEqual(Object.keys(pruned).sort(), ['0', '2']);
});

test('option orders convert from the positional array every browser has', () => {
  const qid = attach([0, 1, 2]);
  // The one record that changed shape. Reading position p as id p is exact,
  // not an approximation, because ids were numbered in file order.
  assert.deepEqual(plain(qid.readOrders([[1, 0], [0, 1], [1, 0]])), {
    0: [1, 0],
    1: [0, 1],
    2: [1, 0],
  });
});

test('option orders are idempotent once converted', () => {
  const qid = attach([0, 1, 2]);
  const once = qid.readOrders([[1, 0], [0, 1], [1, 0]]);
  // No marker key guards this, so it has to survive being run on its own
  // output — a device can be handed an already-converted copy by account sync
  // before it has ever converted one itself.
  assert.deepEqual(plain(qid.readOrders(once)), plain(once));
});

test('an option order for a deleted question is dropped on read', () => {
  const qid = attach([0, 2]);
  assert.deepEqual(plain(qid.readOrders({ 0: [1, 0], 1: [0, 1], 2: [0, 1] })), {
    0: [1, 0],
    2: [0, 1],
  });
});

test('option orders survive a bank that grew since they were written', () => {
  const qid = attach([0, 1, 2, 3]);
  // Short array = questions were appended after this was stored. The saved
  // orders still apply to the questions they were saved for.
  assert.deepEqual(plain(qid.readOrders([[1, 0], [0, 1]])), { 0: [1, 0], 1: [0, 1] });
});

test('a half-finished exam reads back under either field name', () => {
  const qid = attach([0, 1, 2, 3]);
  const legacy = qid.readExamState({ activeIndices: [3, 1], current: 1, answers: [0, null] });
  assert.deepEqual(plain(legacy.activeIndices), [3, 1]);
  assert.equal(legacy.current, 1);
  assert.deepEqual(plain(legacy.answers), [0, null]);
  assert.ok(!('activeIds' in legacy));

  const current = qid.readExamState({ activeIds: [3, 1], current: 1 });
  assert.deepEqual(plain(current.activeIndices), [3, 1]);
});

test('a half-finished exam round-trips through write and read', () => {
  const qid = attach([0, 1, 2, 3]);
  const written = qid.writeExamState({ activeIndices: [2, 0], current: 0, mode: 'full' });
  assert.deepEqual(plain(written.activeIds), [2, 0]);
  assert.ok(!('activeIndices' in written));
  assert.deepEqual(plain(qid.readExamState(written).activeIndices), [2, 0]);
  assert.equal(qid.readExamState(written).mode, 'full');
});

test('a half-finished exam is abandoned if one of its questions is gone', () => {
  const qid = attach([0, 2, 3]);
  // Grading around a hole would mean scoring an attempt against a question the
  // learner was never shown. Better to lose the attempt and say so.
  assert.equal(qid.readExamState({ activeIds: [0, 1, 2] }), null);
  assert.equal(qid.readExamState({ activeIds: [] }), null);
  assert.equal(qid.readExamState(null), null);
});

test('adaptive session-seen is advisory and tolerates a missing id', () => {
  const qid = attach([0, 2, 3]);
  const state = qid.readExamState({
    activeIds: [0, 2],
    adaptiveState: { length: 20, sessionSeen: [0, 1, 3] },
  });
  // Unlike the question list, this only steers what gets drawn next, so the
  // gone id is dropped rather than killing the attempt.
  assert.deepEqual(plain(state.adaptiveState.sessionSeen), [0, 2]);
  assert.equal(state.adaptiveState.length, 20);
});

test('a bank served without ids falls back to positions instead of dying', () => {
  const browser = createBrowser();
  browser.load('nremt/assets/question-ids.js');
  const qid = browser.window.NremtQuestionIds.attach([{ q: 'a' }, { q: 'b' }]);
  // check-site.mjs fails on this in CI. A student who somehow gets an id-less
  // bank should still get a working page.
  assert.equal(qid.idOf(1), 1);
  assert.equal(qid.indexOf(1), 1);
});

test('a duplicated id resolves to the first question holding it', () => {
  const qid = attach([0, 1, 1, 2]);
  // Also a CI failure. Resolving to the first keeps it deterministic rather
  // than depending on which entry was written last.
  assert.equal(qid.indexOf(1), 1);
});
