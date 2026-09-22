/* ochem/assets/flashcard-scheduler.js — when a flashcard comes back — plus the
   two pieces of ochem-xp.js that exist because of it: the sync merge for the
   schedule and the flashcard XP.

   Same failure modes as the concept schedule: nothing throws when an interval
   grows too eagerly or studying ahead quietly buries a card for months — the
   student just stops seeing it. And the merge is the one place a second
   device can un-review a whole evening's cards. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createBrowser } from './harness.mjs';

const MIN = 60000;
// Values built inside the VM have the VM's Array/Object prototypes, which
// deepEqual treats as different; compare their plain JSON shape instead.
const plain = (x) => JSON.parse(JSON.stringify(x));
const DAY = 86400000;

function fresh(){
  const b = createBrowser();
  b.load('ochem/assets/flashcard-scheduler.js');
  return { b, S: b.window.OchemCardScheduler };
}

// Local midnight `days` after the day containing `ms`, computed independently.
function midnight(ms, days){
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + days);
  return d.getTime();
}

test('a new card: Again is minutes, Hard and Good a day, Easy four days', () => {
  const { b, S } = fresh();
  const now = b.now();
  const again = S.next(null, S.AGAIN, now);
  assert.equal(again.i, 0);
  assert.equal(again.d, now + 10 * MIN);
  assert.equal(again.l, 0, 'forgetting a card never learned is not a lapse');
  assert.equal(S.next(null, S.HARD, now).i, 1);
  assert.equal(S.next(null, S.GOOD, now).i, 1);
  assert.equal(S.next(null, S.EASY, now).i, 4);
});

test('day intervals land at local midnight, not 24 hours on', () => {
  const { b, S } = fresh();
  const late = new Date(b.now()); late.setHours(23, 30, 0, 0);
  const s = S.next(null, S.GOOD, late.getTime());
  assert.equal(s.d, midnight(late.getTime(), 1));
  assert.ok(S.isDue(s, midnight(late.getTime(), 1)), 'due from the first minute of tomorrow');
  assert.ok(!S.isDue(s, midnight(late.getTime(), 1) - 1), 'not before');
});

test('Good climbs the 1, 3, then x-ease ladder', () => {
  const { b, S } = fresh();
  let s = null;
  const seen = [];
  for(let k = 0; k < 5; k++){
    s = S.next(s, S.GOOD, b.now());
    seen.push(s.i);
    b.setNow(s.d);
  }
  // 1, 3, then round(3 x 2.5) = 8, round(8 x 2.5) = 20, round(20 x 2.5) = 50.
  assert.deepEqual(seen, [1, 3, 8, 20, 50]);
});

test('Hard grows slowly and costs ease; Easy grows fast and earns it', () => {
  const { b, S } = fresh();
  const base = { i: 10, e: 2.5, d: b.now(), r: 3, l: 0, t: b.now() - 10 * DAY };
  const hard = S.next(base, S.HARD, b.now());
  assert.equal(hard.i, 12);                 // max(11, round(10 x 1.2))
  assert.equal(hard.e, 2.35);
  const good = S.next(base, S.GOOD, b.now());
  assert.equal(good.i, 25);
  const easy = S.next(base, S.EASY, b.now());
  assert.equal(easy.i, Math.round(10 * 2.5 * 1.3));
  assert.equal(easy.e, 2.65);
  assert.ok(hard.i < good.i && good.i < easy.i);
});

test('forgetting a learned card is a lapse: back to learning, ease down', () => {
  const { b, S } = fresh();
  const base = { i: 20, e: 2.5, d: b.now(), r: 4, l: 0, t: b.now() - 20 * DAY };
  const s = S.next(base, S.AGAIN, b.now());
  assert.equal(s.i, 0);
  assert.equal(s.r, 0);
  assert.equal(s.l, 1);
  assert.equal(s.e, 2.3);
  // And it relearns from the bottom of the ladder, not from 20 days.
  assert.equal(S.next(s, S.GOOD, b.now() + 10 * MIN).i, 1);
});

test('ease stays within 1.3..2.8 and intervals within a year', () => {
  const { b, S } = fresh();
  let s = { i: 5, e: 1.35, d: b.now(), r: 2, l: 0, t: 1 };
  for(let k = 0; k < 5; k++) s = S.next({ ...s, i: 5 }, S.AGAIN, b.now());
  assert.equal(s.e, 1.3);
  s = { i: 5, e: 2.75, d: b.now(), r: 2, l: 0, t: 1 };
  for(let k = 0; k < 5; k++) s = S.next({ ...s, i: 5 }, S.EASY, b.now());
  assert.equal(s.e, 2.8);
  const huge = S.next({ i: 300, e: 2.8, d: b.now(), r: 9, l: 0, t: 1 }, S.EASY, b.now());
  assert.equal(huge.i, S.MAX_IVL);
});

test('next() never mutates the state it is given', () => {
  const { b, S } = fresh();
  const base = Object.freeze({ i: 3, e: 2.5, d: b.now(), r: 2, l: 0, t: 1 });
  assert.doesNotThrow(() => S.next(base, S.EASY, b.now()));
  assert.equal(base.i, 3);
});

test('studying ahead does not push a card out — only Again changes it', () => {
  const { b, S } = fresh();
  S.grade('x', S.GOOD, b.now());               // new -> 1 day
  b.advanceDays(1);
  S.grade('x', S.GOOD, b.now());               // due -> 3 days
  const scheduled = S.get('x');
  assert.equal(scheduled.i, 3);
  b.setNow(b.now() + 2 * 3600000);             // two hours later: not due
  const res = S.grade('x', S.EASY, b.now(), { cram: true });
  assert.equal(res.early, true);
  assert.equal(res.scheduled, false, 'an early review is not scheduled work');
  assert.deepEqual(S.get('x'), scheduled, 'Easy ahead of schedule changes nothing');
  S.grade('x', S.AGAIN, b.now());
  assert.equal(S.get('x').i, 0, 'but forgetting it early still counts');
  assert.equal(S.get('x').l, 1);
});

test('a card missed in a session can be passed later in the same session', () => {
  const { b, S } = fresh();
  S.grade('y', S.AGAIN, b.now());
  // Three cards later — well inside the ten minutes — it is not "early".
  b.setNow(b.now() + 90000);
  const res = S.grade('y', S.GOOD, b.now());
  assert.equal(res.early, false);
  assert.equal(S.get('y').i, 1);
});

test('the queue: most overdue first, then new cards up to the daily allowance', () => {
  const { b, S } = fresh();
  const store = S.load();
  store.cards.a = { i: 3, e: 2.5, d: b.now() - 1 * DAY, r: 2, l: 0, t: 1 };
  store.cards.b = { i: 3, e: 2.5, d: b.now() - 5 * DAY, r: 2, l: 0, t: 1 };
  store.cards.c = { i: 3, e: 2.5, d: b.now() + 2 * DAY, r: 2, l: 0, t: 1 };
  S.save(store);
  const ids = ['a', 'b', 'c'].concat(Array.from({ length: 30 }, (_, k) => 'n' + k));
  const q = S.queue(ids, b.now());
  assert.deepEqual(plain(q.due), ['b', 'a']);
  assert.equal(q.fresh.length, S.NEW_PER_DAY);
  assert.equal(q.fresh[0], 'n0', 'new cards keep the order given (course order)');
  assert.equal(q.newTotal, 30);
  assert.equal(q.learned, 3);
});

test('new cards introduced today use up the allowance until tomorrow', () => {
  const { b, S } = fresh();
  const ids = Array.from({ length: 40 }, (_, k) => 'n' + k);
  for(let k = 0; k < 15; k++) S.grade('n' + k, S.GOOD, b.now());
  assert.equal(S.introducedToday(b.now()), 15);
  let q = S.queue(ids, b.now());
  assert.equal(q.fresh.length, S.NEW_PER_DAY - 15);
  // Regrading a card already introduced does not count twice.
  S.grade('n0', S.AGAIN, b.now());
  assert.equal(S.introducedToday(b.now()), 15);
  b.advanceDays(1);
  q = S.queue(ids, b.now());
  assert.equal(q.fresh.length, S.NEW_PER_DAY);
  assert.equal(q.due.length, 15, 'yesterday’s fourteen Good cards are due, and the one missed');
});

test('a corrupt store reads as empty rather than throwing', () => {
  const { b, S } = fresh();
  b.localStorage.setItem(S.KEY, '{not json');
  assert.deepEqual(plain(S.load().cards), {});
  b.localStorage.setItem(S.KEY, JSON.stringify({ v: 99, cards: { a: {} } }));
  assert.deepEqual(plain(S.load().cards), {});
});

test('preview labels what each button would do', () => {
  const { b, S } = fresh();
  assert.deepEqual(plain(S.preview(null, b.now())), { 1: '10m', 2: '1d', 3: '1d', 4: '4d' });
  const ahead = { i: 30, e: 2.5, d: b.now() + 5 * DAY, r: 4, l: 0, t: 1 };
  const p = S.preview(ahead, b.now(), S.isEarly(ahead, b.now()));
  assert.equal(p[3], 'no change');
  assert.equal(p[1], '10m');
});

/* ---- ochem-xp.js: the sync merge and the XP ------------------------------ */

function withXp(){
  const b = createBrowser();
  const registered = {};
  b.window.StudyHubAccount = {
    registerNamespace(name, keys, merge){ registered[name] = { keys, merge: merge || {} }; },
  };
  b.load('assets/hub-progress.js');
  b.load('ochem/assets/ochem-xp.js');
  return { b, X: b.window.OchemXP, H: b.window.HubProgress, registered };
}

test('the schedule is synced in the ochem namespace, with a merge', () => {
  const { registered } = withXp();
  // Registered alongside the other ochem keys, so a sync from ANY ochem page
  // carries it rather than dropping it from the account.
  assert.ok(registered.ochem.keys.includes('ochem_flashcards_v1'));
  assert.equal(typeof registered.ochem.merge.ochem_flashcards_v1, 'function');
});

test('merging two devices keeps the more recently graded copy of each card', () => {
  const { X } = withXp();
  const local = { v: 1, cards: { a: { i: 3, t: 200 }, b: { i: 1, t: 50 } }, fresh: { day: '2026-01-15', n: 4 } };
  const cloud = { v: 1, cards: { a: { i: 1, t: 100 }, b: { i: 8, t: 90 }, c: { i: 2, t: 10 } }, fresh: { day: '2026-01-15', n: 9 } };
  const out = JSON.parse(X.mergeFlashcards(JSON.stringify(local), JSON.stringify(cloud)));
  assert.equal(out.cards.a.i, 3, 'local graded later');
  assert.equal(out.cards.b.i, 8, 'cloud graded later');
  assert.equal(out.cards.c.i, 2, 'a card only the other device knows survives');
  assert.equal(out.fresh.n, 9, 'same day: the larger count');
  const later = { ...local, fresh: { day: '2026-01-16', n: 1 } };
  assert.equal(JSON.parse(X.mergeFlashcards(JSON.stringify(later), JSON.stringify(cloud))).fresh.day, '2026-01-16');
});

test('a malformed copy never wins a merge', () => {
  const { X } = withXp();
  const good = JSON.stringify({ v: 1, cards: { a: { i: 3, t: 1 } }, fresh: { day: '', n: 0 } });
  assert.equal(X.mergeFlashcards(good, 'garbage'), good);
  assert.equal(X.mergeFlashcards(good, JSON.stringify({ v: 2 })), good);
  assert.equal(X.mergeFlashcards(null, good), good);
});

test('flashcard XP: per card, capped per day, and it keeps the streak', () => {
  const { b, X, H } = withXp();
  // The first activity of a day pays hub-progress's show-up bonus; take it
  // first so what is measured below is the flashcard XP alone.
  H.recordActivity('ochem', 1);
  const before = H.subjectXp('ochem');
  const r = X.onCards(5);
  assert.equal(H.subjectXp('ochem') - before, 5 * X.CARD_XP);
  assert.equal(r.awards[0].xp, 5 * X.CARD_XP);
  const days = JSON.parse(b.localStorage.getItem('hub_activity_v1')).days;
  assert.equal(Object.values(days)[0].ochem, 6, 'the cards count as a day of study');
  // Far more than the cap in one go pays the cap and no more, today.
  X.onCards(1000);
  assert.equal(H.subjectXp('ochem') - before, X.CARD_XP_DAILY_CAP);
  assert.equal(X.onCards(3).awards.length, 0, 'nothing left today');
  b.advanceDays(1);
  H.recordActivity('ochem', 1);
  const nextDay = H.subjectXp('ochem');
  X.onCards(3);
  assert.equal(H.subjectXp('ochem') - nextDay, 3 * X.CARD_XP, 'a new day, a new cap');
  assert.equal(X.onCards(0), null);
});
