/* ApPhysQuestions grading (physics/assets/phys-questions.js): the pure grader every
   rendered item uses. Numeric answers graded on value, units and significant
   figures separately, typed with units, powers of ten, commas or a
   typographic minus, with targeted feedback for common slips; select-all partial credit; order graded
   against the authored order; predict; stimulus sets grouped in authored
   order; fixed items never shuffled, order items never shown solved. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createBrowser } from './harness.mjs';

const Q = createBrowser().load('physics/assets/phys-questions.js').ApPhysQuestions;
const plain = x => JSON.parse(JSON.stringify(x));

test('numeric: very small keys (Ksp) are not swamped by floating-point slack', () => {
  const q = { type: 'numeric', numeric: { answer: 1.8e-11, tol: 1e-12, unit: '', sigfigs: 2 } };
  assert.equal(Q.grade(q, '1.8e-11').correct, true);
  assert.equal(Q.grade(q, '1.8 × 10^-11').correct, true);
  assert.equal(Q.grade(q, '5.0e-11').parts.value, false);
  assert.equal(Q.grade(q, '9.9e-10').parts.value, false);
});

test('numeric: value within the tolerance, and the key rounded to the student\'s precision', () => {
  const q = { type: 'numeric', numeric: { answer: 2.4, tol: 0.05, unit: '°C/min', decimals: 1 } };
  assert.equal(Q.grade(q, '2.4').correct, true);
  assert.equal(Q.grade(q, '2.45').correct, true);
  assert.equal(Q.grade(q, '2.46').correct, false);
  assert.equal(Q.grade(q, '24').correct, false);
  const r = { type: 'numeric', numeric: { answer: 0.0821, rel: 0.005, unit: 'M', sigfigs: 3 } };
  assert.equal(Q.grade(r, '0.0821').correct, true);
  assert.deepEqual(plain(Q.grade(r, '0.082').parts), { value: true, unit: null, sig: false }, 'rounded too far: the value is right, sig figs are not');
  assert.deepEqual(plain(Q.grade(r, '0.09').parts), { value: false, unit: null, sig: false });
});

test('numeric: what a student types, powers of ten included', () => {
  assert.equal(Q.parseNumber('11.3 kJ'), 11.3);
  assert.equal(Q.parseNumber(' 11,300 J'), 11300);
  assert.equal(Q.parseNumber('2,4'), 2.4);
  assert.equal(Q.parseNumber('−0.75'), -0.75);
  assert.equal(Q.parseNumber('.5'), 0.5);
  assert.ok(Math.abs(Q.parseNumber('1.8e-5') - 1.8e-5) < 1e-18);
  assert.ok(Math.abs(Q.parseNumber('1.80 × 10^-5 M') - 1.8e-5) < 1e-18);
  assert.ok(Math.abs(Q.parseNumber('1.8x10⁻⁵') - 1.8e-5) < 1e-18);
  assert.ok(Math.abs(Q.parseNumber('6.02 × 10²³ mol⁻¹') - 6.02e23) < 1e9);
  assert.equal(Q.parseNumber('8.314 J mol-1 K-1'), 8.314, 'a unit may carry its own exponents');
  assert.ok(Number.isNaN(Q.parseNumber('')));
  assert.ok(Number.isNaN(Q.parseNumber('abc')));
  assert.ok(Number.isNaN(Q.parseNumber('2.4 or 3')), 'a second number is not a unit');
  assert.equal(Q.grade({ type: 'numeric', numeric: { answer: 3.84, tol: 0.01, unit: '', places: 2 } }, 'about').valid, false);
});

test('significant figures are counted as written', () => {
  for (const [d, n] of [['0.00450', 3], ['1.80', 3], ['1200', 2], ['1200.', 4], ['6.022', 4], ['0.5', 1], ['100.0', 4], ['3', 1]]) assert.equal(Q.sigFigs(d), n, d);
  assert.equal(Q.formatKey({ answer: 1.8e-5, sigfigs: 2, unit: 'M' }), '1.8 × 10^-5 M');
  assert.equal(Q.formatKey({ answer: 3e23, sigfigs: 3, unit: 'molecules' }), '3.00 × 10^23 molecules');
  assert.equal(Q.formatKey({ answer: 0.5, sigfigs: 3, unit: 'mol' }), '0.500 mol');
  assert.equal(Q.formatKey({ answer: 4.74, places: 2 }), '4.74');
});

test('units: physics units normalize to SI base units, the unit is graded on its own, and a prefix slip is named', () => {
  for (const [x, y] of [['N', 'kg·m/s²'], ['N', 'kg m s^-2'], ['newtons', 'N'], ['J', 'N·m'], ['J', 'kg m^2/s^2'], ['W', 'J/s'], ['W', 'N·m/s'],
    ['Pa', 'N/m²'], ['Pa', 'N/m^2'], ['m/s^2', 'm/s/s'], ['m/s²', 'm·s⁻²'], ['Hz', '1/s'], ['rad/s', '1/s'], ['kg·m²', 'kg m^2'], ['kg·m/s', 'N·s'], ['meters', 'm']])
    assert.equal(Q.normUnit(x), Q.normUnit(y), `${x} = ${y}`);
  assert.notEqual(Q.normUnit('cm'), Q.normUnit('m'), 'a prefixed unit stays itself');
  assert.notEqual(Q.normUnit('mm'), Q.normUnit('Mm'));
  const q = { type: 'numeric', numeric: { answer: 24.5, rel: 0.005, unit: 'J', askUnit: true, sigfigs: 3 } };
  const right = Q.grade(q, { value: '24.5', unit: 'N·m' });
  assert.equal(right.correct, true, 'N·m is a joule'); assert.equal(right.score, 1);
  assert.equal(Q.grade(q, { value: '24.5', unit: 'kg·m²/s²' }).correct, true);
  const kj = Q.grade(q, { value: '0.0245', unit: 'kJ' });
  assert.deepEqual(plain(kj.parts), { value: false, unit: false, sig: true });
  assert.match(kj.notes.join(' '), /right in kJ, but the question asks for J/);
  const none = Q.grade(q, { value: '24.5', unit: '' });
  assert.deepEqual(plain(none.parts), { value: true, unit: false, sig: true });
  assert.match(none.notes[0], /without its unit/);
  assert.equal(none.score, 2 / 3, 'partial credit by part');
  assert.equal(Q.grade(q, '24.5 J').correct, true, 'the unit may follow the number in one box');
  // cm for m is named as a prefix slip when the value is right in cm.
  const len = { type: 'numeric', numeric: { answer: 0.45, tol: 0.01, unit: 'm', askUnit: true, sigfigs: 2 } };
  assert.match(Q.grade(len, { value: '45', unit: 'cm' }).notes.join(' '), /right in cm, but the question asks for m/);
  // Angles: degrees are not radians.
  const ang = { type: 'numeric', numeric: { answer: 1.57, tol: 0.01, unit: 'rad', askUnit: true, sigfigs: 3 } };
  assert.match(Q.grade(ang, { value: '1.57', unit: 'deg' }).notes.join(' '), /radians, not degrees/);
  assert.equal(Q.grade(ang, { value: '1.57', unit: 'rad' }).correct, true);
});

test('numeric: targeted feedback for the slips physics readers report', () => {
  const ke = { type: 'numeric', numeric: { answer: 9.0, tol: 0.1, unit: 'J', sigfigs: 2 } };
  assert.match(Q.grade(ke, '18').notes[0], /factor of 2/, 'forgot the ½ in ½mv²');
  assert.match(Q.grade(ke, '-9.0').notes[0], /sign is wrong/);
  assert.match(Q.grade(ke, '3.0').notes[0], /squared is the answer/, 'forgot to square');
  assert.match(Q.grade(ke, '81').notes[0], /square root/, 'squared instead of rooting');
  assert.match(Q.grade(ke, '900').notes[0], /100 times too large.*centimeters/);
  assert.match(Q.grade(ke, '9000').notes[0], /1000 times too large/);
  const v = { type: 'numeric', numeric: { answer: 4.43, tol: 0.02, unit: 'm/s', sigfigs: 3 } };
  assert.match(Q.grade(v, '4.47').notes[0], /9\.8 m\/s² and g = 10/, 'g = 10 where the item uses 9.8 (√g)');
  const ang = { type: 'numeric', numeric: { answer: 0.524, tol: 0.002, unit: 'rad', sigfigs: 3 } };
  assert.match(Q.grade(ang, '30.0').notes[0], /degrees and radians/);
  const authored = { type: 'numeric', numeric: { answer: 0.80, tol: 0.01, unit: 'm', sigfigs: 2, mistakes: [{ value: 1.4, why: 'Value: that is the final position, not the change in position.' }] } };
  assert.match(Q.grade(authored, '1.4').notes[0], /final position/, 'an authored mistake is named first');
});

test('numeric: gAlt accepts the key worked with the other value of g, with a note', () => {
  // h = 2.0 m, v = √(2gh): 6.26 m/s with g = 9.8, 6.32 m/s with g = 10.
  const q = { type: 'numeric', numeric: { answer: 6.26, tol: 0.02, unit: 'm/s', sigfigs: 3, gAlt: 6.32 } };
  const r = Q.grade(q, '6.32');
  assert.equal(r.correct, true);
  assert.match(r.notes.join(' '), /other value of g/);
  assert.equal(Q.grade(q, '6.26').correct, true);
  assert.equal(Q.grade(q, '6.29').correct, false, 'only near either key');
  const strict = { type: 'numeric', numeric: { answer: 6.26, tol: 0.02, unit: 'm/s', sigfigs: 3 } };
  assert.equal(Q.grade(strict, '6.32').correct, false, 'without gAlt the item asks for its own g');
  assert.match(Q.grade(strict, '6.32').notes[0], /9\.8 m\/s² and g = 10/);
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

test('ApPhysMath: shared helpers only (constants, g, rounding, seeded rng, diagnose, vectors, register)', () => {
  const M = createBrowser().load('physics/assets/tools/phys-tool-math.js').ApPhysMath;
  assert.equal(M.C.g, 9.8); assert.equal(M.C.G_ALT, 10); assert.equal(M.C.G, 6.67e-11);
  assert.equal(M.g({ g: 10 }), 10); assert.equal(M.g({}), 9.8);
  assert.equal(M.sig(0.049989, 3), 0.05);
  assert.equal(M.fixed(4.745, 2), '4.75');
  assert.equal(M.fmt(-0.000123, 2), '−1.2 × 10⁻⁴');
  const a = M.rng(7), b = M.rng(7);
  assert.deepEqual([a(), a(), a()], [b(), b(), b()], 'same seed, same numbers');
  const c = M.cell(9.0, 0.01, [{ value: 9.0, why: 'dropped: equals the key' }, { value: 4.5, why: 'Halved.' }]);
  assert.equal(c.mistakes.length, 1);
  assert.equal(M.diagnose(c, 9.0).ok, true);
  assert.equal(M.diagnose(c, 4.5).why, 'Halved.');
  assert.match(M.diagnose(c, 18).why, /factor of 2/);
  assert.match(M.diagnose(c, -9).why, /sign/);
  assert.match(M.diagnose(M.cell(4.43, 0.002), 4.47).why, /9\.8 m\/s² against 10/);
  assert.match(M.diagnose(c, 900).why, /centimeters/);
  const v = M.vec.components(10, 30);
  assert.ok(Math.abs(v.x - 8.660) < 1e-3 && Math.abs(v.y - 5) < 1e-9);
  assert.ok(Math.abs(M.vec.angle({ x: 0, y: 2 }) - 90) < 1e-9);
  assert.equal(M.camel('free-body-diagrams'), 'freeBodyDiagrams');
  M.register('exampleTool', { ok: 1 });
  assert.equal(M.exampleTool.ok, 1);
  assert.throws(() => M.register('exampleTool', {}), /already registered/);
  assert.throws(() => M.register('rng', {}), /already registered/, 'a model cannot overwrite a shared helper');
  // No chemistry left in the shared file.
  assert.equal(M.weakAcid, undefined); assert.equal(M.pH, undefined);
});
