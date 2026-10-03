/* ApBioQuestions grading (bio/assets/bio-questions.js): the pure grader every
   rendered item uses. Numeric answers within a tolerance, typed with units,
   commas or a typographic minus; select-all partial credit; order graded
   against the authored order; predict; stimulus sets grouped in authored
   order; fixed items never shuffled, order items never shown solved. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createBrowser } from './harness.mjs';

const Q = createBrowser().load('bio/assets/bio-questions.js').ApBioQuestions;
const plain = x => JSON.parse(JSON.stringify(x));

test('numeric: tolerance, inclusive at the edge', () => {
  const q = { type: 'numeric', numeric: { answer: 2.4, tol: 0.05, unit: '°C/min', decimals: 1 } };
  assert.equal(Q.grade(q, '2.4').correct, true);
  assert.equal(Q.grade(q, '2.45').correct, true);
  assert.equal(Q.grade(q, '2.35').correct, true);
  assert.equal(Q.grade(q, '2.46').correct, false);
  assert.equal(Q.grade(q, '24').correct, false);
  const z = { type: 'numeric', numeric: { answer: 11.3, tol: 0, unit: 'kJ', decimals: 1 } };
  assert.equal(Q.grade(z, '11.30').correct, true);
  assert.equal(Q.grade(z, '11.31').correct, false);
});

test('numeric: what a student types', () => {
  assert.equal(Q.parseNumber('11.3 kJ'), 11.3);
  assert.equal(Q.parseNumber(' 11,300 J'), 11300);
  assert.equal(Q.parseNumber('2,4'), 2.4);
  assert.equal(Q.parseNumber('−0.75'), -0.75);
  assert.equal(Q.parseNumber('.5'), 0.5);
  assert.equal(Q.parseNumber('1.2e3'), 1200);
  assert.ok(Number.isNaN(Q.parseNumber('')));
  assert.ok(Number.isNaN(Q.parseNumber('abc')));
  assert.ok(Number.isNaN(Q.parseNumber('2.4 or 3')), 'a second number is not a unit');
  const q = { type: 'numeric', numeric: { answer: 3.84, tol: 0.01, unit: '', decimals: 2 } };
  assert.equal(Q.grade(q, 'about').valid, false);
  assert.equal(Q.grade(q, '3.84').valid, true);
});

test('single and multi', () => {
  assert.equal(Q.grade({ type: 'single', correct: 2, options: ['a', 'b', 'c'] }, 2).correct, true);
  assert.equal(Q.grade({ type: 'single', correct: 2, options: ['a', 'b', 'c'] }, 0).correct, false);
  const m = { type: 'multi', correct: [0, 1], options: ['a', 'b', 'c', 'd'] };
  assert.deepEqual(plain(Q.grade(m, [1, 0])), { valid: true, correct: true, score: 1, right: 4, total: 4 });
  const part = Q.grade(m, [0, 2]);
  assert.equal(part.correct, false); assert.equal(part.right, 2); assert.equal(part.score, 0.5);
  assert.equal(Q.grade(m, []).valid, false, 'nothing picked is not an answer');
});

test('order is graded against the authored order; predict per variable', () => {
  const o = { type: 'order', options: ['s1', 's2', 's3', 's4'] };
  assert.equal(Q.grade(o, [0, 1, 2, 3]).correct, true);
  const g = Q.grade(o, [1, 0, 2, 3]);
  assert.equal(g.correct, false); assert.equal(g.right, 2);
  const p = { type: 'predict', variables: [{ answer: 'up' }, { answer: 'none' }, { answer: 'down' }] };
  assert.equal(Q.grade(p, { 0: 'up', 1: 'none', 2: 'down' }).correct, true);
  assert.equal(Q.grade(p, { 0: 'up', 1: 'down' }).right, 1);
});

test('stimulus sets: consecutive items sharing a stimulus, authored order kept', () => {
  const items = [{ id: 'a', stimulus: 's1' }, { id: 'b', stimulus: 's1' }, { id: 'c' }, { id: 'd', stimulus: 's2' }, { id: 'e', stimulus: 's2' }, { id: 'f' }];
  assert.deepEqual(plain(Q.group(items)).map(g => [g.stimulus, g.items.map(i => i.id).join('')]), [['s1', 'ab'], [null, 'c'], ['s2', 'de'], [null, 'f']]);
});

test('fixed items keep their order; order items never start solved', () => {
  const fixed = { options: ['1', '2', '3', '4', '5'], fixed: true };
  for (let i = 0; i < 20; i++) assert.deepEqual(plain(Q.displayOrder(fixed)), [0, 1, 2, 3, 4]);
  for (let i = 0; i < 50; i++) { const s = Q.orderStart(3); assert.notDeepEqual(plain(s), [0, 1, 2]); assert.deepEqual(plain(s).sort(), [0, 1, 2]); }
});
