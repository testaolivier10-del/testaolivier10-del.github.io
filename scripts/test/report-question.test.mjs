/* assets/report-question.js — the "this looks wrong" flow.

   Two things here are worth pinning down, and both fail quietly.

   The first is the once-per-browser rule. It is not rate limiting for its own
   sake: the same question appears in a review list and on a flashcard, and a
   button that comes back live after a report was sent invites the reader to
   send it again — which they will, because nothing told them the first one
   landed. So the store has to survive a re-render and has to be bounded, since
   somebody working through a bank for months should not accumulate an
   unbounded object in localStorage.

   The second is what a report is allowed to say. The reason list is a contract
   with the database: report_question() in scripts/sql/schema.sql rejects a
   reason it does not recognise, so the two drifting apart means every report
   silently fails at the far end while the dialog says thank you. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createBrowser } from './harness.mjs';

function fresh() {
  const b = createBrowser();
  b.load('assets/report-question.js');
  return { b, report: b.window.LevlReport };
}

test('a question is not reported until it is', () => {
  const { report } = fresh();
  assert.equal(report._alreadyReported('nremt', 42), false);
  report._markReported('nremt', 42);
  assert.equal(report._alreadyReported('nremt', 42), true);
});

test('the two courses have their own numbering and do not collide', () => {
  const { report } = fresh();
  // NREMT ids are integers and ochem references are strings that start with a
  // topic. Keying on the id alone would still be wrong the day they overlap.
  report._markReported('nremt', 7);
  assert.equal(report._alreadyReported('ochem', 7), false);
});

test('a report survives the list it was sent from being re-rendered', () => {
  const { b, report } = fresh();
  report._markReported('nremt', 7);
  // Same browser, fresh page: the receipt has to come from storage, not from
  // a variable that died with the last render.
  const again = createBrowser();
  for (const k of ['levlprep_reported_v1']) again.localStorage.setItem(k, b.localStorage.getItem(k));
  again.load('assets/report-question.js');
  assert.equal(again.window.LevlReport._alreadyReported('nremt', 7), true);
});

test('the store is bounded, and forgets the oldest first', () => {
  const { b, report } = fresh();
  for (let i = 0; i < 400; i++) report._markReported('nremt', i);
  const store = JSON.parse(b.localStorage.getItem('levlprep_reported_v1'));
  assert.ok(Object.keys(store).length <= 300, `kept ${Object.keys(store).length}`);
  // The most recent report is the one whose button is on screen.
  assert.equal(report._alreadyReported('nremt', 399), true);
  assert.equal(report._alreadyReported('nremt', 0), false);
});

test('the reason list is exactly what the database accepts', () => {
  const { report } = fresh();
  const sql = readFileSync('scripts/sql/schema.sql', 'utf8');
  const clause = sql.match(/p_reason not in \(([^)]+)\)/);
  assert.ok(clause, 'report_question() no longer validates the reason');
  const accepted = [...clause[1].matchAll(/'([^']+)'/g)].map((m) => m[1]).sort();
  // Copied out of the sandbox realm: assert.deepEqual counts that realm's
  // Array prototype as a difference all by itself.
  const offered = JSON.parse(JSON.stringify(report.REASONS)).map((r) => r[0]).sort();
  // If these drift apart, every report of the orphaned reason is rejected by
  // Postgres while the dialog closes and says thank you.
  assert.deepEqual(offered, accepted);
});

test('every offered reason has a label a reader would recognise', () => {
  const { report } = fresh();
  for (const [value, label] of JSON.parse(JSON.stringify(report.REASONS))) {
    assert.ok(value && /^[a-z-]+$/.test(value), `odd reason value: ${value}`);
    assert.ok(label && label.length > 8, `unhelpful label for ${value}`);
  }
});

test('a button carries the course and the question it belongs to', () => {
  const { report } = fresh();
  const html = report.button('ochem', 'lb:pka:14:8x1z');
  assert.ok(html.includes('data-report-course="ochem"'));
  assert.ok(html.includes('data-report-question="lb:pka:14:8x1z"'));
  assert.ok(html.includes('Report a problem'));
});

test('a browser that refuses localStorage still renders a live button', () => {
  const b = createBrowser();
  b.load('assets/report-question.js');
  Object.defineProperty(b.window, 'localStorage', {
    get() { throw new Error('denied'); },
    configurable: true,
  });
  // Private mode loses the receipt, which is a smaller cost than a dialog that
  // will not open — and marking has to swallow the same throw.
  assert.equal(b.window.LevlReport._alreadyReported('nremt', 1), false);
  b.window.LevlReport._markReported('nremt', 1);
});
