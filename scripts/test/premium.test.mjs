/* assets/premium.js — the free/premium split, its launch switch and the
   pre-launch waitlist.

   What is worth pinning down is the contract with the database, the promise
   the card makes, and that nothing locks before launch. join_waitlist()
   in scripts/sql/schema.sql rejects a course it does not know, so a course
   added to COURSES and not to the SQL would show a card whose every sign-up
   fails at the far end. And once someone has joined, the card has to become a
   receipt and stay one, or it turns into nagging after every session. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createBrowser } from './harness.mjs';

function fresh() {
  const b = createBrowser();
  b.load('assets/premium.js');
  return { b, premium: b.window.LevlPremium };
}

test('every course with a card is one the database accepts', () => {
  const { premium } = fresh();
  const sql = readFileSync('scripts/sql/schema.sql', 'utf8');
  const fn = sql.slice(sql.indexOf('function public.join_waitlist'));
  const clause = fn.match(/p_course not in \(([^)]+)\)/);
  assert.ok(clause, 'join_waitlist() no longer validates the course');
  const accepted = [...clause[1].matchAll(/'([^']+)'/g)].map((m) => m[1]).sort();
  const offered = Object.keys(premium.COURSES).sort();
  assert.deepEqual(JSON.parse(JSON.stringify(offered)), accepted);
});

test('every course states both sides of the split', () => {
  const { premium } = fresh();
  for (const [key, c] of Object.entries(premium.COURSES)) {
    assert.ok(c.name, `${key} has no name`);
    assert.ok(c.free.length >= 3, `${key} lists too little that stays free`);
    assert.ok(c.premium.length >= 3, `${key} lists too little in Premium`);
  }
});

test('the card asks until someone joins, then becomes a receipt', () => {
  const { premium } = fresh();
  const before = premium.card('nremt', 'results');
  assert.ok(before.includes('data-premium-open="nremt"'));
  assert.ok(before.includes('data-premium-source="results"'));
  assert.ok(before.includes('Coming soon'), 'the card must not read as a live checkout');
  premium._markJoined('nremt');
  const after = premium.card('nremt', 'results');
  assert.ok(!after.includes('data-premium-open'), 'a joined card still asks');
  assert.ok(after.includes('on the Premium list'));
});

test('every course shows its lowest price on the card', () => {
  const { premium } = fresh();
  for (const [key, c] of Object.entries(premium.COURSES)) {
    const low = Math.min(...c.passes.map((p) => p.price));
    assert.ok(premium.card(key, 'x').includes('$' + low), `${key} card hides its price`);
  }
});

test('joining one course does not join the other', () => {
  const { premium } = fresh();
  premium._markJoined('nremt');
  assert.equal(premium._joined('ochem'), false);
  assert.ok(premium.card('ochem', 'summary').includes('data-premium-open="ochem"'));
});

test('an unknown course renders nothing rather than a broken card', () => {
  const { premium } = fresh();
  assert.equal(premium.card('biology', 'x'), '');
});

test('email check turns away the obvious and nothing else', () => {
  const { premium } = fresh();
  for (const ok of ['a@b.co', 'first.last+tag@school.edu', 'x@sub.domain.org']) {
    assert.equal(premium._validEmail(ok), true, ok);
  }
  for (const bad of ['', 'nope', 'a@b', '@b.co', 'a b@c.co', 'a@b.co ' + 'x'.repeat(260), null]) {
    assert.equal(premium._validEmail(bad), false, String(bad));
  }
});

test('a browser that refuses localStorage still shows a live card', () => {
  const b = createBrowser();
  b.load('assets/premium.js');
  Object.defineProperty(b.window, 'localStorage', {
    get() { throw new Error('denied'); },
    configurable: true,
  });
  assert.equal(b.window.LevlPremium._joined('nremt'), false);
  b.window.LevlPremium._markJoined('nremt');
  assert.ok(b.window.LevlPremium.card('nremt', 'results').includes('data-premium-open'));
});

test('before launch nothing is locked, but Premium is still marked', () => {
  const { premium } = fresh();
  assert.equal(premium.launched(), false);
  for (const key of Object.keys(premium.COURSES)) {
    assert.equal(premium.has(key), true, `${key} locked before launch`);
    assert.equal(premium.gate(key, 'x'), '', `${key} gate rendered before launch`);
    assert.ok(premium.badge(key).includes('data-premium-open'), `${key} has no Premium badge`);
  }
  assert.equal(premium.quota('nremt').left, Infinity);
});

test('after launch a free user meets the gates', () => {
  const { premium } = fresh();
  premium._setLaunched(true);
  assert.equal(premium.has('nremt'), false);
  const g = premium.gate('nremt', 'exam', 'results');
  assert.ok(g.includes('premium-lock') && g.includes('data-premium-open="nremt"'));
  assert.equal(premium.card('ochem', 'summary').includes('See Premium'), true);
});

test('the daily allowance counts down and stops at the limit', () => {
  const { premium } = fresh();
  premium._setLaunched(true);
  const limit = premium.COURSES.nremt.dailyFree;
  assert.equal(limit, 15);
  for (let i = 0; i < limit; i++) assert.equal(premium.quota('nremt').take(), true, `question ${i + 1}`);
  assert.equal(premium.quota('nremt').take(), false);
  assert.equal(premium.quota('nremt').left, 0);
  assert.equal(premium.quota('ochem').take(), true, 'a course without an allowance is unlimited');
});

test('a cached pass belongs to the user it was read for', () => {
  const { b, premium } = fresh();
  premium._setLaunched(true);
  const later = new b.window.Date(b.window.Date.now() + 86400000).toISOString();
  b.window.localStorage.setItem('levlprep_premium_v1', JSON.stringify({ userId: 'u1', courses: { nremt: later } }));
  b.window.StudyHubAccount = { user: () => ({ id: 'u1' }) };
  assert.equal(premium.has('nremt'), true);
  assert.equal(premium.has('ochem'), false);
  b.window.StudyHubAccount = { user: () => ({ id: 'u2' }) };
  assert.equal(premium.has('nremt'), false, 'another user inherited a pass');
  const past = new b.window.Date(b.window.Date.now() - 1000).toISOString();
  b.window.localStorage.setItem('levlprep_premium_v1', JSON.stringify({ userId: 'u2', courses: { nremt: past } }));
  assert.equal(premium.has('nremt'), false, 'an expired pass still unlocks');
});
