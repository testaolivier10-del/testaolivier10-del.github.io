/* ApChemQuestions grading (chem/assets/chem-questions.js): the pure grader every
   rendered item uses. Numeric answers graded on value, units and significant
   figures separately, typed with units, powers of ten, commas or a
   typographic minus, with targeted feedback for common slips; select-all partial credit; order graded
   against the authored order; predict; stimulus sets grouped in authored
   order; fixed items never shuffled, order items never shown solved. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createBrowser } from './harness.mjs';

const Q = createBrowser().load('chem/assets/chem-questions.js').ApChemQuestions;
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

test('units: spellings agree, the unit is graded on its own, and a prefix slip is named', () => {
  for (const [a, b] of [['kJ/mol', 'kJ mol^-1'], ['kJ/mol', 'kJ·mol⁻¹'], ['L·atm/(mol·K)', 'L atm mol-1 K-1'], ['M', 'mol/L'], ['J/(mol K)', 'J mol-1 K-1'], ['liters', 'L'], ['degC', '°C']])
    assert.equal(Q.normUnit(a), Q.normUnit(b), `${a} = ${b}`);
  assert.notEqual(Q.normUnit('mM'), Q.normUnit('MM'));
  const q = { type: 'numeric', numeric: { answer: -286, rel: 0.005, unit: 'kJ/mol', askUnit: true, sigfigs: 3 } };
  const right = Q.grade(q, { value: '-286', unit: 'kJ mol^-1' });
  assert.equal(right.correct, true); assert.equal(right.score, 1);
  const joules = Q.grade(q, { value: '-286000', unit: 'J/mol' });
  assert.deepEqual(plain(joules.parts), { value: false, unit: false, sig: true });
  assert.match(joules.notes.join(' '), /right in J\/mol, but the question asks for kJ\/mol/);
  const none = Q.grade(q, { value: '-286', unit: '' });
  assert.deepEqual(plain(none.parts), { value: true, unit: false, sig: true });
  assert.match(none.notes[0], /without its unit/);
  assert.equal(none.score, 2 / 3, 'partial credit by part');
  // The unit may be typed after the number in the one box.
  assert.equal(Q.grade(q, '-286 kJ/mol').correct, true);
  const kelvin = Q.grade({ type: 'numeric', numeric: { answer: 298, tol: 1, unit: 'K', askUnit: true, sigfigs: 3 } }, { value: '25.0', unit: '°C' });
  assert.match(kelvin.notes.join(' '), /kelvin/);
});

test('numeric: targeted feedback for the slips readers keep seeing', () => {
  const ph = { type: 'numeric', numeric: { answer: 4.74, tol: 0.01, unit: '', places: 2, mistakes: [{ value: 10.92, tol: 0.01, why: 'Value: you used ln instead of log in the Henderson-Hasselbalch equation.' }] } };
  assert.match(Q.grade(ph, '10.92').notes[0], /ln instead of log/, 'an authored mistake is named');
  assert.match(Q.grade(ph, '4.7').notes.join(' '), /decimal point are the significant ones/, 'pH: places, not sig figs');
  const big = { type: 'numeric', numeric: { answer: 11.3, tol: 0.05, unit: 'kJ', sigfigs: 3 } };
  assert.match(Q.grade(big, '11300').notes[0], /1000 times too large/);
  assert.match(Q.grade(big, '-11.3').notes[0], /sign is wrong/);
  const lnlog = { type: 'numeric', numeric: { answer: 2.0, tol: 0.01, unit: '', sigfigs: 2 } };
  assert.match(Q.grade(lnlog, '4.61').notes[0], /ln and log/);
  const t = { type: 'numeric', numeric: { answer: 25.0, tol: 0.1, unit: '°C', sigfigs: 3 } };
  assert.match(Q.grade(t, '298.15').notes[0], /off by 273/);
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

test('ApChemMath: equations-sheet constants, sig-fig rounding, seeded drills, acid-base and free energy', () => {
  const M = createBrowser().load('chem/assets/tools/chem-tool-math.js').ApChemMath;
  assert.equal(M.C.R_J, 8.314); assert.equal(M.C.R_LATM, 0.08206); assert.equal(M.C.F, 96485); assert.equal(M.C.Kw, 1e-14);
  assert.equal(M.sig(0.049989, 3), 0.05);
  assert.equal(M.fixed(4.745, 2), '4.75');
  const a = M.rng(7), b = M.rng(7);
  assert.deepEqual([a(), a(), a()], [b(), b(), b()], 'same seed, same numbers');
  const w = M.weakAcid(0.10, 1.8e-5);
  assert.ok(Math.abs(w.pH - 2.87) < 0.01, `0.10 M acetic acid pH ${w.pH}`);
  assert.ok(Math.abs(M.hh(4.74, 0.10, 0.10) - 4.74) < 1e-12, 'equal buffer: pH = pKa');
  assert.ok(Math.abs(M.dG(-92.2, 298, -198.7) - -33.0) < 0.1, 'ΔG° = ΔH° − TΔS° with ΔS° in J');
  assert.ok(Math.abs(M.dGfromE(2, 1.10) - -212.3) < 0.1, 'ΔG° = −nFE°');
  assert.ok(M.KfromDG(-10, 298) > 1 && M.KfromDG(10, 298) < 1);
});
