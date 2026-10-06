/* ApChemQuestions numeric grading for very small keys (Ka, Kb, [OH⁻] in
   Unit 8): the floating-point slack in near() is relative, so a key such as
   1.5 × 10⁻¹¹ does not accept every small number. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createBrowser } from './harness.mjs';

const Q = createBrowser().load('chem/assets/chem-questions.js').ApChemQuestions;

test('numeric: keys far below 1 are graded on their own tolerance', () => {
  const kb = { type: 'numeric', numeric: { answer: 1.5e-11, tol: 1e-12, unit: '', sigfigs: 2, mistakes: [{ value: 1500, rel: 0.02, why: 'Value: Kb is not 1/Ka; use Kb = Kw / Ka.' }] } };
  assert.equal(Q.grade(kb, '1.5e-11').correct, true);
  assert.equal(Q.grade(kb, '1.5 × 10^-11').correct, true);
  assert.equal(Q.grade(kb, '3.0e-11').correct, false);
  assert.equal(Q.grade(kb, '1.0e-14').correct, false);
  const oh = { type: 'numeric', numeric: { answer: 2.5e-12, tol: 1e-13, unit: 'M', askUnit: true, sigfigs: 2 } };
  assert.equal(Q.grade(oh, { value: '2.5e-12', unit: 'M' }).correct, true);
  assert.equal(Q.grade(oh, { value: '4.0e-12', unit: 'M' }).correct, false);
  const zero = { type: 'numeric', numeric: { answer: 0, tol: 0, unit: '', decimals: 0 } };
  assert.equal(Q.grade(zero, '0').correct, true);
  assert.equal(Q.grade(zero, '1').correct, false);
});
