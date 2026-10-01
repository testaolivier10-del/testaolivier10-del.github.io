/* NREMT's Premium gates — nremt/assets/premium-gates.js on top of
   assets/premium.js, and the sync rule for the free-exam flag in nav.js.

   The promises worth pinning: before launch nothing locks, counts or writes;
   after launch a free learner gets 15 questions a day and one timed exam,
   members get everything, and the gate never fails closed when premium.js is
   missing. Plus the wiring every gated page depends on: premium.js loads, after
   account.js, before the gates. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { createBrowser } from './harness.mjs';

const FEATURES = ['daily-limit', 'exam', 'readiness', 'review', 'scenarios'];

function fresh({ launched = false, member = false, premium = true } = {}) {
  const b = createBrowser();
  if (member) {
    b.localStorage.setItem('levlprep_premium_v1', JSON.stringify({
      userId: 'u1', courses: { nremt: new Date(b.now() + 30 * 86400000).toISOString() },
    }));
  }
  if (premium) {
    b.load('assets/premium.js');
    b.window.LevlPremium._setLaunched(launched);
  }
  b.load('nremt/assets/premium-gates.js');
  return { b, g: b.window.NremtGates };
}

test('before launch nothing locks, counts or writes, and badges still show', () => {
  const { b, g } = fresh({ launched: false });
  assert.equal(g.locked(), false);
  for (const f of FEATURES) {
    assert.equal(g.gate(f), '', `${f} gated before launch`);
    assert.equal(g.canUse(f), true, `${f} closed before launch`);
  }
  assert.equal(g.quotaApplies('domain'), false);
  assert.equal(g.quotaLeft(), Infinity);
  for (let i = 0; i < 40; i++) assert.equal(g.take(), true);
  g.examStarted();
  g.examStarted();
  assert.equal(g.canStartExam(), true);
  assert.equal(b.localStorage.getItem(g.FREE_EXAM_KEY), null, 'pre-launch exam spent the free one');
  assert.equal(b.localStorage.getItem('levlprep_quota_v1'), null, 'pre-launch questions were counted');
  assert.match(g.badge(), /data-premium-open="nremt"/);
});

test('after launch, a free learner gets 15 questions a day', () => {
  const { b, g } = fresh({ launched: true });
  assert.equal(g.locked(), true);
  assert.equal(g.quotaApplies('domain'), true);
  assert.equal(g.quotaApplies('flashcard'), true);
  assert.equal(g.quotaApplies('full'), false, 'the timed exam has its own rule');
  assert.equal(g.quotaLeft(), 15);
  for (let i = 0; i < 15; i++) assert.equal(g.take(), true, `question ${i + 1} refused`);
  assert.equal(g.take(), false, 'question 16 allowed');
  assert.equal(g.quotaLeft(), 0);
  assert.match(g.gate('daily-limit'), /data-premium-feature="daily-limit"/);
  b.advanceDays(1);
  assert.equal(g.quotaLeft(), 15, 'the allowance did not reset the next day');
});

test('after launch, one timed exam is free and the second is gated', () => {
  const { b, g } = fresh({ launched: true });
  assert.equal(g.canStartExam(), true);
  assert.equal(g.gate('exam') !== '', true, 'gate() is the markup; canStartExam() is the rule');
  g.examStarted();
  assert.ok(JSON.parse(b.localStorage.getItem(g.FREE_EXAM_KEY)).at > 0);
  assert.equal(g.canStartExam(), false);
  assert.equal(g.canUse('exam'), false);
  b.advanceDays(30);
  assert.equal(g.canStartExam(), false, 'the free exam came back');
});

test('after launch, review, readiness and scenarios are gated for a free learner', () => {
  const { g } = fresh({ launched: true });
  for (const f of ['readiness', 'review', 'scenarios']) {
    assert.equal(g.canUse(f), false, f);
    const html = g.gate(f, 'test');
    assert.match(html, new RegExp(`data-premium-feature="${f}"`));
    assert.match(html, /data-premium-open="nremt"/);
  }
});

test('a member has everything, uncounted, and sees no badge', () => {
  const { b, g } = fresh({ launched: true, member: true });
  assert.equal(g.locked(), false);
  for (const f of FEATURES) assert.equal(g.gate(f), '', f);
  assert.equal(g.quotaApplies('domain'), false);
  for (let i = 0; i < 40; i++) assert.equal(g.take(), true);
  g.examStarted();
  assert.equal(b.localStorage.getItem(g.FREE_EXAM_KEY), null, 'a member spent the free exam');
  assert.equal(g.canStartExam(), true);
  assert.equal(g.badge(), '');
});

test('with premium.js missing everything stays open', () => {
  const { g } = fresh({ premium: false });
  assert.equal(g.locked(), false);
  for (const f of FEATURES) { assert.equal(g.gate(f), ''); assert.equal(g.canUse(f), true); }
  assert.equal(g.take(), true);
  assert.equal(g.badge(), '');
  let calls = 0;
  g.onChange(() => { calls++; });
  assert.equal(calls, 1, 'onChange must still render once');
});

test('the free-exam flag syncs, and once spent stays spent', () => {
  const b = createBrowser();
  let keys = null, mergers = null;
  b.window.StudyHubAccount = {
    registerNamespace(name, k, m) { if (name === 'nremt') { keys = k; mergers = m; } },
  };
  b.load('nremt/assets/nav.js');
  assert.ok(keys.includes('nremt_free_exam_v1'), 'not synced');
  const merge = mergers['nremt_free_exam_v1'];
  const early = JSON.stringify({ at: 100 }), late = JSON.stringify({ at: 200 });
  assert.equal(merge(null, early), early, 'spent on another device, not here');
  assert.equal(merge(late, null), late, 'spent here, cloud empty');
  assert.equal(merge(late, early), early);
  assert.equal(merge(early, late), early);
  assert.equal(merge('garbage', early), early);
});

test('every NREMT page that gates loads premium.js after account.js, then the gates', () => {
  const pages = readdirSync('nremt').filter((f) => f.endsWith('.html'));
  let checked = 0;
  for (const f of pages) {
    const html = readFileSync('nremt/' + f, 'utf8');
    const usesGates = /data-premium-badge|NremtGates|data-runner=/.test(html);
    if (!usesGates) continue;
    checked++;
    const tag = (src) => html.indexOf(`<script src="${src}" defer></script>`);
    const account = tag('../assets/account.js');
    const premium = tag('../assets/premium.js');
    const gates = tag('assets/premium-gates.js');
    assert.ok(account !== -1 && premium !== -1 && gates !== -1, `${f}: a script is missing or not deferred`);
    assert.ok(account < premium, `${f}: premium.js must come after account.js`);
    assert.ok(premium < gates, `${f}: premium-gates.js must come after premium.js`);
  }
  assert.ok(checked >= 5, `only ${checked} gated pages found`);
});
