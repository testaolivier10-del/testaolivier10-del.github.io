/* assets/errors.js — the thing that tells us a page broke.

   Every failure mode here is silent in both directions, which is the worst
   kind. A cap that does not hold floods our own database from one runaway
   animation frame and nobody notices until the bill or the rate limit does. A
   queue that does not flush reports nothing at all, and looks exactly like a
   site with no bugs. An opt-out that is checked too late sends the data anyway
   and makes the privacy policy a lie. None of the three throws.

   The queue is the case worth being careful about: this file deliberately runs
   BEFORE account.js, so at the moment of the most interesting errors the thing
   that does the sending does not exist yet. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createBrowser } from './harness.mjs';

function fresh({ optOut = false, withAccount = true } = {}) {
  const b = createBrowser();
  if (optOut) b.localStorage.setItem('levlprep_analytics_opt_out', '1');

  const calls = [];
  if (withAccount) {
    b.window.StudyHubAccount = {
      rpc: (name, args) => { calls.push({ name, args }); return Promise.resolve(true); },
    };
  }
  b.load('assets/errors.js');
  return { b, calls, errors: b.window.LevlErrors };
}

test('an error is sent once, with the page and the position', () => {
  const { calls, errors } = fresh();
  errors.report('x is not a function', 'http://localhost/nremt/practice.html', 412, 9, 'Error: x\n  at go (http://localhost/a.js:1:1)');
  assert.equal(calls.length, 1);
  assert.equal(calls[0].name, 'report_client_error');
  assert.equal(calls[0].args.p_message, 'x is not a function');
  assert.equal(calls[0].args.p_line, 412);
  assert.equal(calls[0].args.p_column, 9);
});

test('the origin is stripped so a stack reads as this site’s own files', () => {
  const { calls, errors } = fresh();
  errors.report('boom', 'http://localhost/assets/tutor.js', 5, 1, 'Error\n  at m (http://localhost/assets/tutor.js:5:1)');
  assert.equal(calls[0].args.p_source, '/assets/tutor.js');
  assert.ok(calls[0].args.p_stack.includes('/assets/tutor.js:5:1'));
  assert.ok(!calls[0].args.p_stack.includes('http://localhost'));
});

test('the same error twice in one page load is sent once', () => {
  const { calls, errors } = fresh();
  for (let i = 0; i < 20; i++) errors.report('same', '/a.js', 1, 1, '');
  assert.equal(calls.length, 1);
});

test('a flood of distinct errors stops at the cap', () => {
  const { calls, errors } = fresh();
  // The shape of a bug inside a requestAnimationFrame loop: sixty a second,
  // each one slightly different. Forwarding all of them faithfully would be a
  // denial of service against our own database.
  for (let i = 0; i < 200; i++) errors.report('error ' + i, '/a.js', i, 1, '');
  assert.equal(calls.length, 5);
});

test('opting out means nothing is sent, not sent-and-discarded', () => {
  const { calls, errors } = fresh({ optOut: true });
  errors.report('boom', '/a.js', 1, 1, '');
  assert.equal(calls.length, 0);
  assert.equal(errors._pending().length, 0);
});

test('a cross-origin "Script error." is dropped as noise', () => {
  const { calls, errors } = fresh();
  // No file, no line, no stack, and almost always an extension rather than us.
  errors.report('Script error.', '', null, null, '');
  errors.report('Script error', '', null, null, '');
  assert.equal(calls.length, 0);
});

test('an empty message is not a report', () => {
  const { calls, errors } = fresh();
  errors.report('', '/a.js', 1, 1, '');
  errors.report(null, '/a.js', 1, 1, '');
  assert.equal(calls.length, 0);
});

test('errors thrown before account.js exists are queued, not lost', () => {
  const { b, errors } = fresh({ withAccount: false });
  // This is the position the file is deliberately loaded in, and the whole
  // reason being early would otherwise cost the reports being early was for.
  errors.report('bootstrap died', '/nremt/practice.html', 800, 3, '');
  assert.equal(errors._pending().length, 1);

  const calls = [];
  b.window.StudyHubAccount = { rpc: (name, args) => { calls.push({ name, args }); return Promise.resolve(true); } };
  errors.flush();
  assert.equal(calls.length, 1);
  assert.equal(calls[0].args.p_message, 'bootstrap died');
  assert.equal(errors._pending().length, 0);
});

test('the queue cannot grow past the cap while it waits', () => {
  const { errors } = fresh({ withAccount: false });
  for (let i = 0; i < 200; i++) errors.report('error ' + i, '/a.js', i, 1, '');
  // A page that breaks before account.js arrives is exactly the page that
  // breaks repeatedly, and the queue is unbounded memory unless the same cap
  // covers it.
  assert.equal(errors._pending().length, 5);
});

test('flushing with nothing queued and no account does nothing and does not throw', () => {
  const { errors } = fresh({ withAccount: false });
  errors.flush();
  assert.equal(errors._pending().length, 0);
});

test('a message longer than the column is truncated, not dropped', () => {
  const { calls, errors } = fresh();
  errors.report('y'.repeat(5000), '/a.js', 1, 1, '');
  assert.equal(calls.length, 1);
  assert.equal(calls[0].args.p_message.length, 300);
});

test('a stack keeps only the frames near the bug', () => {
  const { calls, errors } = fresh();
  const deep = Array.from({ length: 40 }, (_, i) => `  at frame${i} (/a.js:${i}:1)`).join('\n');
  errors.report('deep', '/a.js', 1, 1, 'Error: deep\n' + deep);
  const lines = calls[0].args.p_stack.split('\n');
  assert.ok(lines.length <= 6, `kept ${lines.length} frames`);
  assert.ok(calls[0].args.p_stack.length <= 600);
});

test('a browser that refuses localStorage is treated as opted out', () => {
  const b = createBrowser();
  const calls = [];
  b.window.StudyHubAccount = { rpc: (n, a) => { calls.push({ n, a }); return Promise.resolve(true); } };
  b.load('assets/errors.js');
  // Private windows and blocked site data throw on access rather than
  // returning null. We cannot ask for consent, so we do not assume it.
  Object.defineProperty(b.window, 'localStorage', {
    get() { throw new Error('denied'); },
    configurable: true,
  });
  b.window.LevlErrors.report('boom', '/a.js', 1, 1, '');
  assert.equal(calls.length, 0);
});
