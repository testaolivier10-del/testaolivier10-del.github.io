/* assets/exam-date.js: the per-course default exam date (AP® Biology's
   fixed date), which replaced the dashboard writing it into storage. Other
   courses keep no default. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createBrowser } from './harness.mjs';

function load() {
  const b = createBrowser();
  b.load('assets/exam-date.js');
  return { b, X: b.window.LevlExamDate, ls: b.window.localStorage };
}

test('AP® Biology counts down to 3 May 2027 until the student sets a date', () => {
  const { X, ls } = load();
  assert.equal(X.read('apbio'), '2027-05-03');
  assert.equal(X.isDefault('apbio'), true);
  assert.equal(ls.getItem('apbio_exam_date'), null, 'the default is not written to storage');
  ls.setItem('apbio_exam_date', '2027-05-10');
  assert.equal(X.read('apbio'), '2027-05-10');
  assert.equal(X.isDefault('apbio'), false);
});

test('clearing the date keeps the default from coming back', () => {
  const { X, ls } = load();
  assert.equal(X.DEFAULTS.apbio.label, 'AP® Biology exam (Mon, May 3, 2027)');
  ls.setItem('apbio_exam_date', 'none');
  assert.equal(X.read('apbio'), null);
  assert.equal(X.isDefault('apbio'), false);
});

test('other courses have no default, and a passed default is not shown', () => {
  const { b, X } = load();
  for (const c of ['nremt', 'ochem', 'anp']) assert.equal(X.read(c), null, c);
  b.setNow(Date.UTC(2027, 4, 4, 12));
  assert.equal(X.read('apbio'), null);
});

test('AP® Chemistry counts down to Thursday 6 May 2027 by default', () => {
  const { X, ls } = load();
  assert.equal(X.read('apchem'), '2027-05-06');
  assert.equal(X.isDefault('apchem'), true);
  assert.equal(X.DEFAULTS.apchem.label, 'AP® Chemistry exam (Thu, May 6, 2027)');
  assert.equal(ls.getItem('apchem_exam_date'), null, 'the default is not written to storage');
});
