/* The interval answer type (docs/apcalcbc-architecture.md, "interval items"):
   calculus-bc/assets/cbc-interval.js, called by AB's question engine (calc-questions.js): interval notation and inequalities
   read alike; the two endpoints and the two brackets are graded separately; each slip is
   named (an endpoint not tested, the radius for the interval, the wrong center, a squared
   radius); exact and three-decimal endpoints; all reals and a single point; authored slips. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const ctx = { Math, Number, String, Array, Object, JSON, Error, isFinite, isNaN, parseFloat, RegExp, Infinity, NaN };
ctx.window = ctx; vm.createContext(ctx);
for (const f of ['calculus/assets/calc-expr.js', 'calculus-bc/assets/cbc-interval.js', 'calculus/assets/calc-questions.js']) vm.runInContext(readFileSync(f, 'utf8'), ctx);
const Q = ctx.ApCalcQuestions;
const item = I => ({ type: 'interval', interval: I });
const g = (I, s) => Q.grade(item(I), s);

test('interval notation and inequalities read alike', () => {
  const I = { lo: '1', hi: '5', loIn: true, hiIn: false };
  for (const s of ['[1, 5)', '1 <= x < 5', '1 ≤ x < 5', ' [ 1 , 5 ) ']) assert.equal(g(I, s).correct, true, s);
  assert.equal(g(I, 'banana').valid, false);
  assert.equal(g(I, '[1, 5').valid, false);
});

test('endpoints and brackets are four parts, and the untested endpoint is named', () => {
  const I = { lo: '1', hi: '5', loIn: true, hiIn: false };
  const r = g(I, '[1, 5]');
  assert.equal(r.correct, false); assert.equal(r.score, 0.75);
  assert.equal(r.parts.lo && r.parts.hi && r.parts.loIn, true); assert.equal(r.parts.hiIn, false);
  assert.match(r.notes[0], /x = 5/);
  assert.match(g({ ...I, ends: { hi: 'Harmonic series at x = 5.' } }, '[1, 5]').notes[0], /Harmonic/);
});

test('the slips CR reports name: radius for interval, wrong center, squared radius, factor of 2', () => {
  const I = { lo: '1', hi: '5', loIn: true, hiIn: false, center: '3' };
  assert.match(g(I, '2').notes[0], /radius/);
  assert.match(g(I, '[2, 6)').notes[0], /centered/);
  assert.match(g({ lo: '0', hi: '6', loIn: true }, '[-3, 9)').notes[0], /factor of 2/);
  assert.match(g({ lo: '-sqrt(3)', hi: 'sqrt(3)' }, '(-3, 3)').notes[0], /√3/);
});

test('exact endpoints, three-decimal endpoints with a note, all reals, one point', () => {
  const R3 = { lo: '-sqrt(3)', hi: 'sqrt(3)' };
  assert.equal(g(R3, '(-sqrt(3), sqrt(3))').correct, true);
  const d = g(R3, '(-1.732, 1.732)'); assert.equal(d.correct, true); assert.match(d.notes[0], /exact/);
  for (const s of ['all real numbers', '(-inf, inf)', '(-∞, ∞)']) assert.equal(g({ lo: '-inf', hi: 'inf' }, s).correct, true, s);
  assert.equal(g({ lo: '-inf', hi: 'inf' }, '[0, inf)').correct, false);
  for (const s of ['x = 0', '{0}', '[0, 0]']) assert.equal(g({ point: '0' }, s).correct, true, s);
});

test('an authored slip is matched first', () => {
  const I = { lo: '1', hi: '5', loIn: true, hiIn: false, mistakes: [{ answer: '(1, 5)', why: 'Authored: test x = 1.' }] };
  const r = g(I, '1 < x < 5'); assert.equal(r.correct, false); assert.equal(r.mistake.why, 'Authored: test x = 1.');
});

test('AB items grade exactly as before; without BC\'s file an interval item is not gradable', () => {
  const c2 = { Math, Number, String, Array, Object, JSON, Error, isFinite, isNaN, parseFloat, RegExp, Infinity, NaN }; c2.window = c2; vm.createContext(c2);
  for (const f of ['calculus/assets/calc-expr.js', 'calculus/assets/calc-questions.js']) vm.runInContext(readFileSync(f, 'utf8'), c2);
  assert.equal(c2.ApCalcQuestions.grade(item({ lo: '1', hi: '5' }), '(1, 5)').valid, false);
  assert.equal(Q.grade({ type: 'single', correct: 2 }, 2).correct, true);
  assert.equal(Q.grade({ type: 'numeric', numeric: { answer: 'pi/4' } }, '0.785').correct, true);
});

test('small values: on BC a decimal below 0.005 must be right to three significant digits; AB keeps the plain rule', () => {
  const load = cfg => {
    const c = { Math, Number, String, Array, Object, JSON, Error, isFinite, isNaN, parseFloat, RegExp, Infinity, NaN };
    c.window = c; if (cfg) c.ApCalcCourse = cfg; vm.createContext(c);
    for (const f of ['calculus/assets/calc-expr.js', 'calculus-bc/assets/cbc-interval.js', 'calculus/assets/calc-questions.js']) vm.runInContext(readFileSync(f, 'utf8'), c);
    return c.ApCalcQuestions;
  };
  const bc = load({ key: 'apcalcbc', smallValues: true }), ab = load(null);
  const q = A => ({ type: 'numeric', calc: true, numeric: { answer: A } });
  // The weakness: 0.000 for 0.0004 and 0.0010 for 0.0014 pass the plain three-place rule.
  assert.equal(ab.grade(q(0.0004), '0.000').correct, true);
  assert.equal(ab.grade(q(0.0014), '0.0010').correct, true);
  assert.equal(bc.grade(q(0.0004), '0.000').correct, false);
  assert.equal(bc.grade(q(0.0014), '0.0010').correct, false);
  assert.match(bc.grade(q(0.0014), '0.0010').notes[0], /significant digits/);
  for (const s of ['0.00137', '0.00136', '0.001369', '0.0013691']) assert.equal(bc.grade(q(0.0013691), s).correct, true, s);
  assert.equal(bc.grade({ type: 'numeric', numeric: { answer: '1/729' } }, '1/729').correct, true);
  assert.equal(bc.grade({ type: 'numeric', numeric: { answer: '1/729' } }, '0.00137').correct, true);
  assert.equal(bc.grade({ type: 'numeric', numeric: { answer: '1/1000' } }, '0.00137').correct, false);
  // At 0.005 and above, and for 0, BC grades as AB.
  for (const [A, s] of [[0.0123456, '0.012'], [0.0123456, '0.0123'], [0, '0.000'], [2.34567, '2.345']]) assert.equal(bc.grade(q(A), s).correct, ab.grade(q(A), s).correct, `${A} ${s}`);
});
