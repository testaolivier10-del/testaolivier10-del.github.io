/* ApMacroQuestions (macroeconomics/assets/mac-questions.js): numeric items (a
   unit optional), no setup items, "Make it specific" items slot by slot,
   graph items point by point (ApMacroGrade.graph), select-all partial
   credit, order, and stimulus sets kept together in authored order, labeled
   Data, Graph or Scenario. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createBrowser } from './harness.mjs';

const B = createBrowser();
for (const f of ['mac-math.js', 'mac-calc.js', 'mac-graph.js', 'mac-grade.js']) B.load(`macroeconomics/assets/${f}`);
const Q = B.load('macroeconomics/assets/mac-questions.js').ApMacroQuestions;

test('numeric: value and unit are two parts of the score', () => {
  const q = { type: 'numeric', numeric: { answer: 2, unit: '%' } };
  assert.equal(Q.grade(q, '2%').correct, true);
  const r = Q.grade(q, '2');
  assert.equal(r.correct, false); assert.equal(r.score, 0.5); assert.deepEqual([r.right, r.total], [1, 2]);
  assert.equal(Q.grade(q, 'two').valid, false);
  assert.equal(Q.parseNumber('2.5 million'), 2.5e6);
  assert.equal(Q.formatKey({ answer: 84, unit: '%' }), '84 %');
  assert.equal(Q.formatKey({ answer: 5 }), '5');
});

test('no setup items: the type is not graded as one', () => {
  assert.equal(Q.grade({ type: 'setup', setup: { answer: '70 / 2' } }, '70/2').correct, false);
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
  assert.match(Q.stimulusPanel('s', { kind: 'data', title: 'Scores', html: '<table></table>' }), /<p class="mac-stim-k">Data<\/p>/);
  assert.match(Q.stimulusPanel('s', { kind: 'graph', title: 'AD-AS', html: '' }), /Graph/);
  assert.match(Q.stimulusPanel('s', { kind: 'text', title: 'A shock', html: '' }), /Scenario/);
});

test('graph items: graded point by point, the slip named', () => {
  const q = { type: 'graph', graph: { kind: 'sd', do: ['shift', 'equilibrium'], key: { shifts: [{ curve: 'D', dir: 'right' }], because: 'a rise in income for a normal good', outcome: { price: 'up', quantity: 'up' } } } };
  const ok = Q.grade(q, { shifts: { D: 1 }, eq: [5.5, 5.5] });
  assert.equal(ok.correct, true); assert.equal(ok.score, 1);
  const bad = Q.grade(q, { shifts: { S: 1 }, eq: [5.5, 4.5] });
  assert.equal(bad.correct, false);
  assert.match(bad.slip, /You shifted supply; a rise in income for a normal good shifts demand/);
  assert.deepEqual([bad.right, bad.total], [1, 3], 'E2 sits where the drawn curves cross, so the equilibrium point is consistent');
  assert.equal(Q.grade(q, { shifts: {}, eq: [5, 5] }).valid, false, 'nothing moved is not an answer yet');
});
