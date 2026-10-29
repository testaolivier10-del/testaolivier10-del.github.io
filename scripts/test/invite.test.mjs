/* assets/invite.js — when the invite card may appear, and what the account
   page says. The rewards themselves are the database's (2026-10m-referrals.sql,
   scripts/test/sql-migration.test.mjs). */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createBrowser } from './harness.mjs';

function load(){
  const b = createBrowser();
  b.load('assets/invite.js');
  return b.window.LevlInvite;
}
const DAY = 86400000;

test('the card comes after a good session, never after a weak or short one', () => {
  const I = load();
  const now = 100 * DAY;
  assert.equal(I.cardEligible({ kind: 'exam', score: 8, total: 10 }, {}, now), true);
  assert.equal(I.cardEligible({ kind: 'exam', score: 5, total: 10 }, {}, now), false);
  assert.equal(I.cardEligible({ kind: 'exam', score: 3, total: 3 }, {}, now), false);
  assert.equal(I.cardEligible({ kind: 'session', answered: 8 }, {}, now), true);
  assert.equal(I.cardEligible({ kind: 'session', answered: 5 }, {}, now), false);
  assert.equal(I.cardEligible({ level: 3 }, {}, now), true);
});

test('at most once every 4 days, and quiet for 30 days after three "Not now"s', () => {
  const I = load();
  const now = 100 * DAY, ctx = { kind: 'session', answered: 10 };
  assert.equal(I.cardEligible(ctx, { last: now - 3 * DAY }, now), false);
  assert.equal(I.cardEligible(ctx, { last: now - 5 * DAY }, now), true);
  assert.equal(I.cardEligible(ctx, { last: now - 10 * DAY, dismissed: 3 }, now), false);
  assert.equal(I.cardEligible(ctx, { last: now - 31 * DAY, dismissed: 3 }, now), true);
});

test('the card copy names both rewards and, signed out, that collecting needs an account', () => {
  const I = load();
  assert.match(I.cardCopy(false).sub, /3 days of Premium free.*7 days.*20 questions.*free account to collect/);
  assert.doesNotMatch(I.cardCopy(true).sub, /free account/);
  for (const c of [I.cardCopy(true), I.cardCopy(false)]) assert.doesNotMatch(c.title + c.sub, /—/);
});

test('the account panel counts friends, studiers and days earned', () => {
  const I = load();
  assert.equal(I.statusText({ joined: 0 }), 'Nobody has joined from your link yet.');
  assert.equal(I.statusText({ joined: 3, studying: 2, rewarded: 2, days_each: 7 }),
    '3 friends joined, 2 answered 20+ questions. You’ve earned 14 days of Premium.');
  assert.match(I.statusText({ joined: 10, studying: 10, rewarded: 8, waiting: 2, cap: 8 }), /2 more rewards are over this year’s limit of 8/);
});

test('a course page names its course; other pages none', () => {
  const I = load();
  assert.equal(I.courseOfPath('/nremt/practice.html'), 'nremt');
  assert.equal(I.courseOfPath('/bio/'), 'apbio');
  assert.equal(I.courseOfPath('/premium.html'), null);
});
