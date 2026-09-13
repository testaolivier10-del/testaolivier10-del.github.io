/* ochem/assets/mastery-engine.js — per-concept strength, decay, and the
   spaced-repetition schedule.

   This is the code that decides what a student is shown next and how well the
   site thinks they know it. Every one of its failure modes is silent: an
   interval that doubles too eagerly buries a shaky concept for four months, a
   decay curve that bites too hard makes yesterday's work look undone, a leech
   rule that never releases benches a concept forever. Nothing throws; the
   student just gets worse practice.

   Loaded against the real concepts.js rather than a stub, so a concept id that
   stops existing fails here rather than in front of a user. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createBrowser } from './harness.mjs';

const DAY = 86400000;

function fresh(){
  const b = createBrowser();
  b.load('ochem/assets/concepts.js');
  b.load('ochem/assets/mastery-engine.js');
  const M = b.window.OchemMastery;
  // A real concept id, taken from the curriculum rather than invented.
  const id = b.window.OchemConcepts.ALL[0].id;
  return { b, M, id, C: b.window.OchemConcepts };
}

test('an unseen concept is null, not zero', () => {
  const { M, id } = fresh();
  // The distinction the source calls out: "never attempted" must not look like
  // "attempted and scored zero", or the recommender drills what you know.
  assert.equal(M.strength(id), null);
  const p = M.profile(id);
  assert.equal(p.attempts, 0);
  assert.equal(p.strength, null);
  assert.equal(p.accuracy, null);
});

test('an unknown concept id is refused rather than recorded', () => {
  const { M } = fresh();
  assert.equal(M.record('not-a-real-concept', true), null);
  assert.equal(M.record('', true), null);
});

test('right answers raise strength, wrong answers lower it, within bounds', () => {
  const { b, M, id } = fresh();
  let prev = 0;
  for(let i = 0; i < 6; i++){
    M.record(id, true);
    b.advanceDays(1);
    const s = M.strength(id);
    assert.ok(s > prev, `answer ${i + 1} should raise strength (${prev} -> ${s})`);
    assert.ok(s <= 1, 'strength never exceeds 1');
    prev = s;
  }
  const high = M.strength(id);
  M.record(id, false);
  const after = M.strength(id);
  assert.ok(after < high, 'a miss lowers it');
  assert.ok(after >= 0, 'strength never goes below 0');
});

test('one miss cannot wipe out a well-established concept', () => {
  const { b, M, id } = fresh();
  for(let i = 0; i < 10; i++){ M.record(id, true); b.advanceDays(1); }
  const before = M.strength(id);
  M.record(id, false);
  const after = M.strength(id);
  // The learning rate is meant to settle as evidence accumulates. Without
  // that, a single bad question on a mastered concept undoes weeks.
  assert.ok(after > before * 0.5, `a single miss took ${before} down to ${after}`);
});

test('same-day repeats consolidate without advancing the schedule', () => {
  const { M, id } = fresh();
  M.record(id, true);
  const firstInterval = M.profile(id).interval;
  // Eight correct in one sitting is one day's evidence. The source guards this
  // explicitly; without the guard a single good session reaches months.
  for(let i = 0; i < 8; i++) M.record(id, true);
  const after = M.profile(id).interval;
  assert.equal(after, firstInterval,
    'the interval must not move on same-day repeats');
  assert.ok(after <= 1, `expected a day or less, got ${after}`);
});

test('the interval grows across days and is capped', () => {
  const { b, M, id } = fresh();
  const seen = [];
  for(let i = 0; i < 20; i++){
    M.record(id, true);
    seen.push(M.profile(id).interval);
    b.advanceDays(M.profile(id).interval || 1);
  }
  for(let i = 1; i < seen.length; i++){
    assert.ok(seen[i] >= seen[i - 1], `interval shrank on a correct answer: ${seen}`);
  }
  assert.ok(Math.max(...seen) <= 120, `interval exceeded the 120-day cap: ${seen}`);
  assert.ok(seen[5] > seen[0], 'it does grow');
});

test('a miss puts the concept back in the deck immediately', () => {
  const { b, M, id } = fresh();
  for(let i = 0; i < 6; i++){ M.record(id, true); b.advanceDays(M.profile(id).interval || 1); }
  assert.ok(M.profile(id).interval > 3, 'set up a long interval first');

  M.record(id, false);
  const p = M.profile(id);
  assert.equal(p.interval, 0, 'a miss resets the interval');
  // "Later this session" — minutes out, not months, and not literally next.
  const minutesOut = (p.due - b.now()) / 60000;
  assert.ok(minutesOut > 0 && minutesOut <= 15,
    `expected the next look within the session, got ${minutesOut} minutes`);
});

test('strength decays with time away, but not below the floor', () => {
  const { b, M, id } = fresh();
  for(let i = 0; i < 4; i++){ M.record(id, true); b.advanceDays(1); }
  const fresh0 = M.strength(id);

  b.advanceDays(30);
  const month = M.strength(id);
  assert.ok(month < fresh0, 'a month away costs something');

  b.advanceDays(365);
  const year = M.strength(id);
  assert.ok(year <= month, 'longer away is never stronger');
  // The source floors the decay factor at 0.45 — knowledge fades, it does not
  // vanish, and a returning student should not be told they know nothing.
  assert.ok(year >= fresh0 * 0.44, `decayed past the floor: ${fresh0} -> ${year}`);
});

test('a concept is due when its interval has elapsed and not before', () => {
  const { b, M, id } = fresh();
  M.record(id, true);
  b.advanceDays(1);
  M.record(id, true);                       // now on a multi-day interval
  const ivl = M.profile(id).interval;
  assert.ok(ivl >= 1, 'has an interval to wait out');

  assert.equal(M.profile(id).isDue, false, 'not due the moment it is answered');
  assert.equal(M.due().some(p => p.id === id), false);

  b.advanceDays(ivl + 1);
  assert.equal(M.profile(id).isDue, true, 'due once the interval has passed');
  assert.equal(M.due().some(p => p.id === id), true);
});

test('weakest ignores concepts with too little evidence', () => {
  const { b, M, C } = fresh();
  const [a, bb] = [C.ALL[0].id, C.ALL[1].id];
  M.record(a, false);                        // one attempt only
  for(let i = 0; i < 4; i++){ M.record(bb, false); b.advanceDays(1); }

  const ids = M.weakest(5).map(p => p.id);
  assert.ok(ids.includes(bb), 'four wrong answers is evidence of weakness');
  assert.ok(!ids.includes(a), 'one attempt is not enough to call something weak');
});

test('a leech is benched, and re-reading the lesson releases it', () => {
  const { b, M, C } = fresh();
  // noteLesson works in topics, so start from one and take a concept it owns.
  const topicId = C.ALL[0].topics[0];
  const id = C.byTopic(topicId)[0];
  assert.ok(id, 'the topic has at least one concept');

  for(let i = 0; i < 5; i++){ M.record(id, false); b.advanceDays(1); }
  assert.ok(M.isLeech(M.profile(id)), 'five misses on a weak concept is a leech');
  assert.ok(M.leeches().some(x => x.id === id), 'and it shows up as one');

  // The bench exists to send the student back to the lesson. Doing that has to
  // lift it, or the site sets homework and then ignores that it was done.
  const touched = M.noteLesson(topicId);
  assert.ok(touched > 0, 'reading the lesson marks its concepts');
  assert.ok(M.lessonReadAt(id) > 0, 'and the read is on record');

  assert.equal(M.isLeech(M.profile(id)), false, 'reading the lesson lifts the bench');
  assert.equal(M.leeches().some(x => x.id === id), false, 'so it is no longer benched');

  // Getting it wrong again after the read re-benches it: the demand was met
  // once, not permanently waived.
  b.advanceDays(1);
  M.record(id, false);
  assert.equal(M.isLeech(M.profile(id)), true, 'a fresh miss after the read benches it again');
});

test('the daily review cap counts down and stops at zero', () => {
  const { b, M } = fresh();
  assert.equal(M.reviewsRemainingToday(), M.DAILY_REVIEW_CAP);
  for(let i = 0; i < M.DAILY_REVIEW_CAP + 5; i++) M.noteReview();
  assert.equal(M.reviewsToday(), M.DAILY_REVIEW_CAP + 5);
  assert.equal(M.reviewsRemainingToday(), 0, 'remaining never goes negative');

  b.advanceDays(1);
  assert.equal(M.reviewsRemainingToday(), M.DAILY_REVIEW_CAP, 'a new day resets it');
});

test('mistakes are keyed by question, and fixing one stops it being served', () => {
  const { M, id } = fresh();
  M.recordMistake({ qid: 'q1', conceptId: id, topicId: 't', prompt: 'why' });
  M.recordMistake({ qid: 'q1', conceptId: id, topicId: 't', prompt: 'why' });
  assert.equal(M.mistakes().filter(m => m.qid === 'q1').length, 1,
    'the same question missed twice occupies one slot');

  M.clearMistake('q1');
  assert.equal(M.mistakes().some(m => m.qid === 'q1'), false,
    'a fixed mistake stops being served');
});

test('reachedTier records the hardest tier answered correctly and never drops', () => {
  const { b, M, id } = fresh();
  M.record(id, true, { tier: 3 });
  assert.equal(M.reachedTier(id), 3);
  b.advanceDays(1);
  M.record(id, true, { tier: 1 });
  assert.equal(M.reachedTier(id), 3, 'an easier question does not demote it');
  b.advanceDays(1);
  M.record(id, false, { tier: 4 });
  assert.equal(M.reachedTier(id), 3, 'a wrong answer at tier 4 does not promote it');
});
