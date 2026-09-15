/* assets/reminders.js — when to ask, and what the notification says.

   Two things here are worth pinning and both fail silently in the expensive
   direction.

   The asking rules spend the scarcest thing this site has. A browser gives a
   site exactly one notification permission prompt; a "no" is usually permanent
   and cannot be asked for again from script. A rule that is one condition too
   loose does not throw — it burns that one prompt on a stranger who has been
   here once, and the answer is no forever.

   The composed sentence is the product. A reminder saying "12 questions due"
   to somebody who cleared them this morning is worse than no reminder at all:
   it is a reason to distrust the next one, and the next one is the one that
   was going to work. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createBrowser } from './harness.mjs';

function fresh({ permission = 'default', days = 5, configured = true } = {}) {
  const b = createBrowser();
  b.window.Notification = { permission, requestPermission: () => Promise.resolve('granted') };
  b.window.PushManager = function () {};
  b.window.navigator.serviceWorker = { ready: Promise.resolve({ pushManager: {} }) };
  b.localStorage.setItem('levlprep_visits', JSON.stringify({ days }));
  b.load('assets/reminders.js');
  const R = b.window.LevlReminders;
  // Set BOTH ways explicitly rather than letting the unconfigured case rely on
  // the shipped file still having a blank key. It does not, now that a real
  // site has one — and a test that silently starts asserting the opposite of
  // what it says is worse than a test that fails.
  R._setKeys(configured ? 'BTestKeyNotReal' : '', configured ? 'https://example.workers.dev' : '');
  return { b, R };
}

/* The sandbox has a clock the test controls (harness.mjs), and the module
   under test reads it. A test that computes an age from the REAL Date.now()
   is comparing two different years, which is how "thirty days ago" ended up
   eight months in the module's future. Everything below dates from b.now(). */
function due(R, course, n, label) {
  R.report(course, { due: n, label: label || course, url: '/' + course + '/' });
}

// ---- what it says ---------------------------------------------------------

test('one course names the course and the count', () => {
  const { R } = fresh();
  due(R, 'nremt', 12, 'NREMT-EMT Prep');
  const text = R.compose();
  assert.match(text.title, /12 questions due/);
  assert.match(text.body, /NREMT-EMT Prep/);
  assert.equal(text.url, '/nremt/');
});

test('one question is not "1 questions"', () => {
  const { R } = fresh();
  due(R, 'nremt', 1, 'NREMT-EMT Prep');
  assert.match(R.compose().title, /^1 question due/);
});

test('two courses are both named, largest first', () => {
  const { R } = fresh();
  due(R, 'ochem', 4, 'Organic Chemistry');
  due(R, 'nremt', 20, 'NREMT-EMT Prep');
  const text = R.compose();
  assert.match(text.title, /24 due/);
  assert.ok(text.body.indexOf('NREMT') < text.body.indexOf('Organic'), text.body);
  // No single course to open, so it lands on the hub.
  assert.equal(text.url, '/');
});

test('nothing due and no streak means nothing is sent', () => {
  const { R } = fresh();
  // The important half of this feature. A study app that notifies you when it
  // has nothing to say teaches you to swipe it away without reading it, and
  // then the one that mattered gets swiped away too.
  assert.equal(R.compose(), null);
});

test('nothing due but a real streak protects the streak', () => {
  const { b, R } = fresh();
  b.window.HubProgress = { streak: () => ({ current: 12 }) };
  const text = R.compose();
  assert.match(text.title, /12-day streak/);
});

test('a two-day streak is not worth a notification', () => {
  const { b, R } = fresh();
  // Two days is not a run somebody would be upset to lose, and interrupting
  // them to say so is how a reminder becomes a nuisance.
  b.window.HubProgress = { streak: () => ({ current: 2 }) };
  assert.equal(R.compose(), null);
});

test('a stale course record is not quoted', () => {
  const { b, R } = fresh();
  b.localStorage.setItem('levlprep_reminder_state', JSON.stringify({
    nremt: { due: 40, label: 'NREMT-EMT Prep', url: '/nremt/', at: b.now() - 30 * 86400000 },
  }));
  // A month-old count is not evidence of anything current. Quoting it is how a
  // reminder ends up citing a number from last month.
  assert.equal(R.compose(), null);
});

test('a cleared queue stops being quoted the moment it is cleared', () => {
  const { R } = fresh();
  due(R, 'nremt', 12, 'NREMT-EMT Prep');
  assert.ok(R.compose());
  due(R, 'nremt', 0, 'NREMT-EMT Prep');
  assert.equal(R.compose(), null);
});

// ---- when it asks ---------------------------------------------------------

test('it never asks a stranger', () => {
  const { R } = fresh({ days: 1 });
  due(R, 'nremt', 12);
  // One prompt, ever, and a no is permanent. Spending it on somebody who has
  // been here once is spending it on somebody who is probably not coming back.
  assert.equal(R._mayAsk(), false);
});

test('it asks a returning student who has work waiting', () => {
  const { R } = fresh({ days: 4 });
  due(R, 'nremt', 12);
  assert.equal(R._mayAsk(), true);
});

test('it never asks when there is nothing to remind them about', () => {
  const { R } = fresh({ days: 10 });
  // Otherwise it is not an offer, it is just a permission prompt.
  assert.equal(R._mayAsk(), false);
});

test('a permission already answered is never asked again', () => {
  for (const permission of ['granted', 'denied']) {
    const { R } = fresh({ permission });
    due(R, 'nremt', 12);
    assert.equal(R._mayAsk(), false, permission);
  }
});

test('two refusals is the end of it', () => {
  const { b, R } = fresh();
  due(R, 'nremt', 12);
  b.localStorage.setItem('levlprep_reminder_ask', JSON.stringify({ shown: 2, refused: 2, last: 0 }));
  assert.equal(R._mayAsk(), false);
});

test('three showings is the end of it even with no refusal', () => {
  const { b, R } = fresh();
  due(R, 'nremt', 12);
  b.localStorage.setItem('levlprep_reminder_ask', JSON.stringify({ shown: 3, last: 0 }));
  assert.equal(R._mayAsk(), false);
});

test('there is a week between asks', () => {
  const { b, R } = fresh();
  due(R, 'nremt', 12);
  b.localStorage.setItem('levlprep_reminder_ask', JSON.stringify({ shown: 1, last: b.now() - 2 * 86400000 }));
  assert.equal(R._mayAsk(), false);
  b.localStorage.setItem('levlprep_reminder_ask', JSON.stringify({ shown: 1, last: b.now() - 8 * 86400000 }));
  assert.equal(R._mayAsk(), true);
});

test('a browser that once said no is never asked again, even years later', () => {
  const { b, R } = fresh();
  due(R, 'nremt', 12);
  b.localStorage.setItem('levlprep_reminder_ask', JSON.stringify({ denied: true, last: 0 }));
  assert.equal(R._mayAsk(), false);
});

test('an unconfigured build asks nobody anything', () => {
  const { R } = fresh({ configured: false });
  due(R, 'nremt', 12);
  // Same rule as analytics.js: no keys means no prompt, no button, no request.
  assert.equal(R.configured(), false);
  assert.equal(R._mayAsk(), false);
});

test('a browser without push is never asked', () => {
  const b = createBrowser();
  b.window.Notification = { permission: 'default' };
  // No PushManager: an iPhone on Safari that has not been added to the home
  // screen, which is a large share of the people this site is for.
  b.localStorage.setItem('levlprep_visits', JSON.stringify({ days: 9 }));
  b.load('assets/reminders.js');
  const R = b.window.LevlReminders;
  R._setKeys('BTestKeyNotReal', 'https://example.workers.dev');
  R.report('nremt', { due: 12, label: 'NREMT' });
  assert.equal(R.supported(), false);
  assert.equal(R._mayAsk(), false);
});

// ---- when it sends --------------------------------------------------------

test('the send time is the next occurrence of the chosen hour, locally', () => {
  const { b, R } = fresh();
  const at = R._nextSendAt(19);
  assert.equal(at.getHours(), 19);
  assert.ok(at.getTime() > b.now());
  // Never more than a day out: a reminder scheduled two days ahead is a
  // reminder about a queue that will have changed.
  assert.ok(at.getTime() - b.now() <= 24 * 60 * 60 * 1000 + 1000);
});

test('an hour a few minutes away is pushed to tomorrow', () => {
  const { b, R } = fresh();
  const soon = new Date(b.now());
  const at = R._nextSendAt(soon.getHours());
  // Otherwise somebody studying at 18:58 is reminded at 19:00 about the
  // session they are still in.
  assert.ok(at.getTime() > b.now() + 10 * 60 * 1000, 'scheduled too soon');
});
