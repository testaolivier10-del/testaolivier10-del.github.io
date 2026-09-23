/* assets/account.js — the "save your progress" prompt.

   Two things are pinned here. The wording names what this browser stands to
   lose, so each line has to be true for the student it is shown to: a streak
   line for someone with no streak, or a review-queue line with nothing in the
   queue, is exactly the kind of prompt people learn to ignore. And the
   re-ask rules are the whole difference between a reminder and nagging, so
   they are worth a test rather than a careful read. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createBrowser } from './harness.mjs';

function account() {
  const b = createBrowser();
  b.load('assets/account.js');
  return b.window.StudyHubAccount;
}

const plain = (o) => JSON.parse(JSON.stringify(o));

test('a streak of three or more leads, and is named exactly', () => {
  const c = plain(account()._saveCopy({ kind: 'exam', score: 70, total: 100 }, { streak: 12 }));
  assert.equal(c.id, 'streak');
  assert.ok(c.title.startsWith('12-day streak'));
});

test('a short streak is never made into a big deal', () => {
  const a = account();
  for (const streak of [0, 1, 2]) {
    const c = plain(a._saveCopy({ kind: 'exam', score: 70, total: 100 }, { streak }));
    assert.notEqual(c.id, 'streak');
    assert.ok(!/streak/i.test(c.title + c.sub), `streak mentioned at ${streak} days`);
  }
});

test('a held freeze and a met goal each get their own line', () => {
  const a = account();
  assert.equal(a._saveCopy({}, { streak: 5, freezes: 1 }).id, 'freeze');
  assert.equal(a._saveCopy({}, { streak: 5, metToday: true }).id, 'goal');
});

test('the exam line only mentions a review queue that exists', () => {
  const a = account();
  const withQueue = plain(a._saveCopy({ kind: 'exam', score: 78, total: 100, missed: 22 }, {}));
  assert.equal(withQueue.id, 'exam');
  assert.ok(withQueue.title.includes('22 missed questions'));
  const noQueue = plain(a._saveCopy({ kind: 'exam', score: 100, total: 100, missed: 0 }, {}));
  assert.ok(!/missed/.test(noQueue.title));
  assert.equal(a._saveCopy({ kind: 'exam', score: 9, total: 10, missed: 1 }, {}).title, '9/10 — and 1 missed question queued for review');
});

test('a level-up names the level, and its title when it has one', () => {
  const c = plain(account()._saveCopy({ kind: 'level', level: 7, title: 'Rig Veteran' }, { level: 7, xp: 1085 }));
  assert.equal(c.id, 'level');
  assert.equal(c.title, 'Level 7 — Rig Veteran · 1,085 XP');
});

test('with nothing to name, it falls back to the old plain wording', () => {
  const c = plain(account()._saveCopy({ kind: 'session', answered: 8 }, { level: 1 }, 'Session finished — 8 questions'));
  assert.equal(c.id, 'generic');
  assert.equal(c.title, 'Session finished — 8 questions');
  assert.equal(c.sub, 'This is saved in this browser only. Keep it on every device?');
});

test('no line invents urgency', () => {
  const a = account();
  const cases = [
    [{}, { streak: 9 }], [{}, { streak: 9, freezes: 2 }], [{}, { streak: 9, metToday: true }],
    [{ kind: 'exam', score: 50, total: 100, missed: 50 }, {}], [{ kind: 'level', level: 4 }, { level: 4 }], [{}, {}],
  ];
  for (const [ctx, stake] of cases) {
    const c = plain(a._saveCopy(ctx, stake));
    assert.ok(!/last chance|hurry|expires|only today|now or never/i.test(c.title + c.sub), c.id);
    assert.ok(c.yes && c.yes.length < 20, `button label for ${c.id}`);
  }
});

const fresh = { shown: 0, dismissed: 0, ignored: 0, last: null, stake: null };

test('the first ask needs nothing but a qualifying moment', () => {
  assert.equal(account()._promptEligible(fresh, Infinity, { streak: 0, level: 1 }), true);
});

test('asks are at least two days apart', () => {
  const a = account();
  const st = { ...fresh, shown: 1, ignored: 1, last: 'x' };
  assert.equal(a._promptEligible(st, 1, { streak: 0, level: 1 }), false);
  assert.equal(a._promptEligible(st, 2, { streak: 0, level: 1 }), true);
});

test('after one "Not now" it asks again only with more at stake', () => {
  const a = account();
  const st = { ...fresh, shown: 1, dismissed: 1, last: 'x', stake: { streak: 5, level: 3 } };
  assert.equal(a._promptEligible(st, 10, { streak: 5, level: 3 }), false, 'nothing new to lose');
  assert.equal(a._promptEligible(st, 10, { streak: 2, level: 3 }), false, 'streak went down');
  assert.equal(a._promptEligible(st, 10, { streak: 6, level: 3 }), true, 'longer streak');
  assert.equal(a._promptEligible(st, 10, { streak: 0, level: 4 }), true, 'higher level');
  assert.equal(a._promptEligible(st, 1, { streak: 9, level: 5 }), false, 'still two days apart');
});

test('two "Not now"s is final', () => {
  const st = { ...fresh, shown: 2, dismissed: 2, last: 'x', stake: { streak: 1, level: 1 } };
  assert.equal(account()._promptEligible(st, 99, { streak: 50, level: 20 }), false);
});

test('an ignored prompt does not use up one of the three asks, but is still capped', () => {
  const a = account();
  // Three shows, all ignored: none of them was an answer.
  assert.equal(a._promptEligible({ ...fresh, shown: 3, ignored: 3, last: 'x' }, 5, { streak: 0, level: 1 }), true);
  // Three answered asks is the limit.
  assert.equal(a._promptEligible({ ...fresh, shown: 4, ignored: 1, dismissed: 1, last: 'x', stake: { streak: 0, level: 0 } }, 5, { streak: 9, level: 9 }), false);
  // A browser that never looks stops being asked.
  assert.equal(a._promptEligible({ ...fresh, shown: 4, ignored: 4, last: 'x' }, 30, { streak: 0, level: 1 }), false);
});

test('a record from before this change keeps its limits', () => {
  // Old records had no `ignored`, so every show counts as an answered ask.
  // promptState() fills a missing `ignored` with 0, so this is what they read as.
  const a = account();
  assert.equal(a._promptEligible({ shown: 3, dismissed: 0, ignored: 0, last: '2026-01-01', stake: null }, 99, { streak: 9, level: 9 }), false);
});
