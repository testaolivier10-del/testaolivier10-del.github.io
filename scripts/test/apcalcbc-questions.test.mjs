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
