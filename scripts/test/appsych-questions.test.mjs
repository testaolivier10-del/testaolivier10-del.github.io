/* ApPsychQuestions (psychology/assets/psy-questions.js): numeric
   items graded on value and unit, setup items with a value step (setup.then),
   "Make it specific" items slot by slot, select-all partial credit, order,
   and stimulus sets kept together in authored order. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createBrowser } from './harness.mjs';

const B = createBrowser();
for (const f of ['psy-expr.js', 'psy-math.js', 'psy-calc.js', 'psy-grade.js']) B.load(`psychology/assets/${f}`);
const Q = B.load('psychology/assets/psy-questions.js').ApPsychQuestions;

test('numeric: value and unit are two parts of the score', () => {
  const q = { type: 'numeric', numeric: { answer: 2, unit: '%' } };
  assert.equal(Q.grade(q, '2%').correct, true);
  const r = Q.grade(q, '2');
  assert.equal(r.correct, false); assert.equal(r.score, 0.5); assert.deepEqual([r.right, r.total], [1, 2]);
  assert.equal(Q.grade(q, 'two').valid, false);
  assert.equal(Q.parseNumber('2.5 million'), 2.5e6);
  assert.equal(Q.formatKey({ answer: 4500, unit: 'kg' }), '4500 kg');
  assert.equal(Q.formatKey({ answer: 45000, unit: 'kg' }), '45,000 kg');
});

test('setup with a value step: both steps graded, the record right only when both are', () => {
  const q = { type: 'setup', setup: { answer: '(150 - 120) / 120 * 100', then: { answer: 25, unit: '%' } } };
  const ok = Q.grade(q, { expr: '(150-120)/120*100', value: '25 %' });
  assert.equal(ok.correct, true); assert.deepEqual({ ...ok.parts }, { setup: true, value: true, unit: true });
  const nu = Q.grade(q, { expr: '(150-120)/120*100', value: '25' });
  assert.equal(nu.correct, false); assert.equal(nu.score, 0.75); assert.deepEqual([nu.right, nu.total], [2, 3]);
  const ns = Q.grade(q, { expr: '30/120*100', value: '25 %' });
  assert.equal(ns.correct, false); assert.equal(ns.parts.setup, false);
  assert.equal(Q.grade(q, { expr: '(150-120)/120*100', value: '' }).valid, false);
  assert.equal(Q.grade({ type: 'setup', setup: { answer: '70 / 2' } }, '70/2').correct, true, 'a setup alone');
});

test('"Make it specific": graded slot by slot, partial credit', () => {
  const q = { type: 'specific', specific: { slots: { cause: { options: ['a', 'b'], correct: 0 }, effect: { options: ['c', 'd'], correct: 1 } } } };
  assert.equal(Q.grade(q, { cause: 0, effect: 1 }).correct, true);
  const r = Q.grade(q, { cause: 0, effect: 0 });
  assert.equal(r.score, 0.5); assert.deepEqual({ ...r.slots }, { cause: true, effect: false });
});

test('single, multi and order', () => {
  assert.equal(Q.grade({ type: 'single', options: ['a', 'b', 'c', 'd'], correct: 2 }, 2).correct, true);
  assert.equal(Q.grade({ type: 'single', options: ['a', 'b', 'c', 'd'], correct: 2 }, 1).correct, false);
  const m = Q.grade({ type: 'multi', options: ['a', 'b', 'c', 'd'], correct: [0, 2] }, [0, 1]);
  assert.equal(m.correct, false); assert.equal(m.score, 0.5);
  assert.equal(Q.grade({ type: 'order', options: ['a', 'b', 'c'] }, [0, 1, 2]).correct, true);
  for (let i = 0; i < 20; i++) { const s = Q.orderStart(4); assert.ok(!s.every((v, k) => v === k), 'never starts solved'); }
  assert.deepEqual([...Q.displayOrder({ options: ['a', 'b', 'c'], fixed: true })], [0, 1, 2]);
});

test('stimulus sets: consecutive items sharing a stimulus, authored order kept; the kind is labeled', () => {
  const g = Q.group([{ id: 1, stimulus: 's' }, { id: 2, stimulus: 's' }, { id: 3 }, { id: 4, stimulus: 't' }]);
  assert.deepEqual(JSON.parse(JSON.stringify(g.map(x => [x.stimulus, x.items.map(i => i.id)]))), [['s', [1, 2]], [null, [3]], ['t', [4]]]);
  assert.match(Q.stimulusPanel('s', { kind: 'quantitative', title: 'Rates', html: '<table></table>' }), /<p class="psy-stim-k">Data<\/p>/);
  assert.match(Q.stimulusPanel('s', { kind: 'visual', title: 'A pyramid', html: '' }), /Model or diagram/);
  assert.match(Q.stimulusPanel('s', { kind: 'text', title: 'A passage', html: '' }), /Passage/);
});
