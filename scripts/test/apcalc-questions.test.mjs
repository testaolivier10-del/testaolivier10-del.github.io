/* ApCalcQuestions grading (calculus/assets/calc-questions.js): the pure grader every
   rendered item uses. Numeric items follow the exam's calculator rules (a
   calculator answer correct to three decimal places, rounded or truncated;
   a no-calculator answer exact, typed as a number or an expression), with
   optional loose units and targeted feedback; expr items grade by
   evaluation; select-all partial credit; order graded against the authored
   order; predict; stimulus sets grouped in authored order; fixed items never
   shuffled, order items never shown solved. Then the shared tool math. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createBrowser } from './harness.mjs';

const B = createBrowser();
B.load('calculus/assets/calc-expr.js');
const Q = B.load('calculus/assets/calc-questions.js').ApCalcQuestions;
const plain = x => JSON.parse(JSON.stringify(x));

test('numeric, calculator: the three-decimal rule (rounded or truncated)', () => {
  const q = { type: 'numeric', calc: true, numeric: { answer: 0.7468241328 } };
  for (const t of ['0.747', '0.746', '0.7468', '0.74682', '.747']) assert.equal(Q.grade(q, t).correct, true, t);
  for (const t of ['0.748', '0.745', '0.7449']) assert.equal(Q.grade(q, t).correct, false, t);
  const short = Q.grade(q, '0.75');
  assert.equal(short.correct, false);
  assert.match(short.notes[0], /three places after the decimal point/);
  assert.match(Q.grade(q, '0.7449').notes[0], /Round only at the end/);
  // An exact answer typed as an expression is right too.
  assert.equal(Q.grade({ type: 'numeric', calc: true, numeric: { answer: Math.PI / 4 } }, 'pi/4').correct, true);
  // Rounding carries: 2.9995 rounds to 3.000.
  assert.equal(Q.grade({ type: 'numeric', calc: true, numeric: { answer: 2.99953 } }, '3.000').correct, true);
  assert.equal(Q.grade({ type: 'numeric', calc: true, numeric: { answer: 2.99953 } }, '2.999').correct, true, 'truncated');
  // Negative answers.
  assert.equal(Q.grade({ type: 'numeric', calc: true, numeric: { answer: -1.23456 } }, '-1.235').correct, true);
  assert.equal(Q.grade({ type: 'numeric', calc: true, numeric: { answer: -1.23456 } }, '−1.234').correct, true);
  assert.equal(Q.threeOk(1.2345, 1.23449), true);
});

test('numeric, no calculator: exact forms by evaluation, decimals noted', () => {
  const q = (answer, extra = {}) => ({ type: 'numeric', numeric: { answer, ...extra } });
  for (const t of ['1/3', '2/6', '(1/3)', 'x'.replace('x', '1/3')]) assert.equal(Q.grade(q('1/3', { value: 1 / 3 }), t).correct, true, t);
  assert.equal(Q.grade(q(Math.SQRT2 / 2), 'sqrt(2)/2').correct, true);
  assert.equal(Q.grade(q(Math.SQRT2 / 2), '1/sqrt(2)').correct, true);
  assert.equal(Q.grade(q(Math.E ** 2 - 1), 'e^2 - 1').correct, true);
  assert.equal(Q.grade(q(Math.PI / 2), 'π/2').correct, true);
  assert.equal(Q.grade(q(Math.log(3)), 'ln 3').correct, true);
  assert.equal(Q.grade(q(2), '2').correct, true);
  assert.equal(Q.grade(q(2), '2.0').correct, true);
  const dec = Q.grade(q(Math.PI / 4), '0.785');
  assert.equal(dec.correct, true);
  assert.match(dec.notes[0], /exact value/);
  assert.equal(Q.grade(q(Math.PI / 4), 'pi/3').correct, false);
  assert.equal(Q.grade(q(2), 'banana').valid, false);
});

test('numeric: authored mistakes, sign, a missing pi, a factor of 2', () => {
  const q = { type: 'numeric', calc: true, numeric: { answer: 4 * Math.PI, mistakes: [{ value: 8, why: 'Squared the wrong radius.' }] } };
  assert.equal(Q.grade(q, '8').notes[0], 'Squared the wrong radius.');
  assert.match(Q.grade(q, '4').notes[0], /factor of π/);
  assert.match(Q.grade(q, '-12.566').notes[0], /sign/);
  assert.match(Q.grade(q, '6.283').notes[0], /factor of 2/);
  // An exact mistake key.
  const e = { type: 'numeric', numeric: { answer: '1/3', value: 1 / 3, mistakes: [{ value: '1/2', why: 'That is the integral of x.' }] } };
  assert.equal(Q.grade(e, '1/2').notes[0], 'That is the integral of x.');
});

test('numeric: optional units, compared loosely', () => {
  const q = { type: 'numeric', calc: true, numeric: { answer: 62.5, unit: 'liters', askUnit: true, units: ['L'] } };
  for (const u of ['liters', 'L', 'liter', 'Liters']) assert.equal(Q.grade(q, { value: '62.5', unit: u }).correct, true, u);
  const none = Q.grade(q, { value: '62.5', unit: '' });
  assert.equal(none.correct, false); assert.equal(none.parts.value, true); assert.equal(none.score, 0.5);
  assert.equal(Q.normUnit('feet per minute'), Q.normUnit('ft/min'));
  assert.equal(Q.normUnit('cubic centimeters per second'), Q.normUnit('cm^3/s'));
  assert.equal(Q.normUnit('cm³/s'), Q.normUnit('cm^3 / sec'));
  assert.equal(Q.normUnit('square feet'), Q.normUnit('ft^2'));
  assert.notEqual(Q.normUnit('ft/min'), Q.normUnit('ft/s'));
  // A unit typed after the number in one box.
  assert.equal(Q.grade({ type: 'numeric', calc: true, numeric: { answer: 62.5 } }, '62.5 liters').correct, true);
});

test('numeric: the key as written', () => {
  assert.equal(Q.formatKey({ answer: 0.7468241328 }, true), '0.747');
  assert.equal(Q.formatKey({ answer: 62.5, unit: 'liters' }, true), '62.500 liters');
  assert.match(Q.formatKey({ answer: '1/3', value: 1 / 3, answerHtml: '<math>x</math>' }, false), /^<math>x<\/math> ≈ 0\.333$/);
  assert.equal(Q.formatKey({ answer: 2 }, false), '2');
});

test('expr items grade through ApCalcExpr: equivalent forms right, wrong forms named', () => {
  const b = createBrowser();
  b.load('calculus/assets/calc-expr.js');
  b.load('calculus/assets/calc-math.js');
  const QQ = b.load('calculus/assets/calc-questions.js').ApCalcQuestions;
  const q = { type: 'expr', expr: { answer: '2x*cos(x^2)', domain: [-2, 2], mistakes: [{ expr: 'cos(x^2)', why: 'Forgot the chain rule.' }] } };
  for (const t of ['2x cos(x^2)', 'cos(x^2)*2x', '2*x*cos(x²)', 'x cos(x^2) + x cos(x^2)']) assert.equal(QQ.grade(q, t).correct, true, t);
  const g = QQ.grade(q, 'cos(x^2)');
  assert.equal(g.correct, false); assert.equal(g.notes[0], 'Forgot the chain rule.');
  assert.equal(QQ.grade(q, '2x cos(x').valid, false);
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

test('ApCalcMath: shared helpers, the expression layer and the numerics', () => {
  const b = createBrowser();
  b.load('calculus/assets/calc-expr.js');
  const M = b.load('calculus/assets/tools/calc-tool-math.js').ApCalcMath;
  assert.equal(M.sig(0.049989, 3), 0.05);
  assert.equal(M.fixed(4.745, 2), '4.75');
  assert.equal(M.r3(2.71828), 2.718); assert.equal(M.t3(2.7189), 2.718);
  assert.ok(M.three(0.746, 0.7468) && M.three(0.747, 0.7468) && !M.three(0.748, 0.7468));
  const a = M.rng(7), c = M.rng(7);
  assert.deepEqual([a(), a(), a()], [c(), c(), c()], 'same seed, same numbers');
  const cell = M.cell(9.0, 0.001, [{ value: 9.0, why: 'dropped: equals the key' }, { value: 4.5, why: 'Halved.' }]);
  assert.equal(cell.mistakes.length, 1);
  assert.equal(M.diagnose(cell, 9.0).ok, true);
  assert.equal(M.diagnose(cell, 4.5).why, 'Halved.');
  assert.match(M.diagnose(cell, 18).why, /factor of 2/);
  assert.match(M.diagnose(cell, -9).why, /sign/);
  assert.match(M.diagnose(M.cell(Math.PI * 2, 0.0001), 2).why, /factor of π/);
  // Numerics against known values.
  const near = (x, y, t = 1e-8) => Math.abs(x - y) < t;
  assert.ok(near(M.deriv('x^3', 2), 12, 1e-6));
  assert.ok(near(M.deriv2('sin(x)', 1), -Math.sin(1), 1e-4));
  assert.ok(near(M.integral('e^(-x^2)', 0, 1), 0.746824132812427));
  assert.ok(near(M.integral(x => x * x, 1, 0), -1 / 3));
  assert.ok(near(M.riemann('x^2', 0, 2, 4, 'left'), 0.5 * (0 + 0.25 + 1 + 2.25)));
  assert.ok(near(M.riemann('x^2', 0, 2, 4, 'trap'), 0.5 * (0 / 2 + 0.25 + 1 + 2.25 + 4 / 2)));
  assert.equal(M.riemannTable([0, 2, 5, 9], [4, 7, 6, 10], 'right'), 72);
  assert.equal(M.riemannTable([0, 2, 5, 9], [4, 7, 6, 10], 'trap'), 62.5);
  assert.equal(M.riemannTable([0, 1, 3], [1, 2, 3], 'mid'), 6);
  assert.ok(near(M.root('x^2 - 2', 0, 2), Math.SQRT2));
  assert.deepEqual(plain(M.roots('x^3 - x', -2, 2).map(x => Math.round(x * 1e6) / 1e6)), [-1, 0, 1]);
  assert.deepEqual(plain(M.roots('tan(x)', 1, 2)), [], 'a pole is not a zero');
  const ex = M.extrema('x^3 - 3x', -3, 2);
  assert.ok(near(ex.min[0], -3) && near(ex.max[1], 2, 1e-6));
  assert.equal(ex.critical.length, 2);
  // Expression drill steps.
  const step = M.exprCell('3x^2', { mistakes: [{ expr: '3x^3', why: 'Lower the power.' }] });
  assert.equal(M.diagnoseExpr(step, 'x^2*3').ok, true);
  assert.equal(M.diagnoseExpr(step, '3x^3').why, 'Lower the power.');
  assert.ok(M.diagnoseExpr(step, '3x^').error);
  assert.equal(M.camel('tangent-tracer'), 'tangentTracer');
  M.register('exampleTool', { ok: 1 });
  assert.equal(M.exampleTool.ok, 1);
  assert.throws(() => M.register('exampleTool', {}), /already registered/);
  assert.throws(() => M.register('integral', {}), /already registered/, 'a model cannot overwrite a shared helper');
  assert.equal(M.vec, undefined, 'no physics left in the shared file'); assert.equal(M.g, undefined);
});
