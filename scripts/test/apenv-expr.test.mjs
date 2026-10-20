/* ApEnvExpr (environmental-science/assets/env-expr.js): the setup parser.
   Friendly input (x between numbers, thousands commas, units after a
   number), clear errors and no eval, units that cancel (or do not), and
   gradeSetup's value-and-structure grading: brackets before a division, × 100
   for a percent, values that must (or must not) appear, units required. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createBrowser } from './harness.mjs';

const B = createBrowser();
B.load('environmental-science/assets/env-expr.js');
const X = B.window.ApEnvExpr;

test('friendly input: the forms students type all read the same', () => {
  for (const s of ['(150 - 120) / 120 * 100', '(150-120)/120*100', '(150 − 120) ÷ 120 × 100', '(150 - 120) / 120 x 100']) assert.equal(X.evaluate(s).value, 25, s);
  assert.equal(X.evaluate('80 * 0.5^(15/5)').value, 10);
  assert.equal(X.evaluate('1,250 * 2').value, 2500, 'thousands commas');
  assert.equal(X.evaluate('2.5 x 10^6 people / 300 km^2').value, 2.5e6 / 300);
});

test('clear errors, and no eval anywhere', () => {
  const r = X.evaluate('(1 + 2');
  assert.equal(r.ok, false); assert.match(r.error, /bracket is not closed/);
  assert.equal(X.evaluate('').ok, false);
  const src = readFileSync('environmental-science/assets/env-expr.js', 'utf8');
  assert.doesNotMatch(src, /\beval\(|new Function/);
});

test('units are factors with a dimension: they cancel, or the sum is mixed', () => {
  const r = X.evaluate('5000 kWh * 0.9 kg/kWh');
  assert.equal(r.value, 4500); assert.deepEqual({ ...r.dims }, { kg: 1 });
  assert.equal(X.dimText(r.dims), 'kg');
  assert.equal(X.evaluate('5 kg + 3 kWh').dims, null, 'kg plus kWh has no unit');
  const d = X.evaluate('2.5 x 10^6 people / 300 km^2').dims;
  assert.deepEqual({ ...d }, { person: 1, km: -2 }, 'a unit binds to its number, never into an exponent');
  assert.deepEqual(JSON.parse(JSON.stringify(X.used(X.read('70 / 2').tree))), { names: [], numbers: [70, 2], units: [] });
});

test('TeX for the preview and the key', () => {
  assert.equal(X.evaluate('(150 - 120) / 120 * 100').tex, '\\frac{150 - 120}{120} \\cdot 100');
  assert.match(X.evaluate('5000 kWh * 0.9 kg/kWh').tex, /\\text\{kWh\}/);
});

test('gradeSetup: brackets before a division, × 100, authored slips', () => {
  const S = { type: 'setup', setup: { answer: '(150 - 120) / 120 * 100', mistakes: [{ expr: '(150 - 120) / 150 * 100', why: 'Divide by the old value.' }] } };
  const g = t => X.gradeSetup(S, t);
  assert.equal(g('(150-120)/120*100').correct, true);
  const np = g('150 - 120 / 120 * 100');
  assert.equal(np.correct, false); assert.match(np.notes[0], /brackets before you divide/);
  const v = g('30/120*100');
  assert.equal(v.valueOk, true); assert.equal(v.structOk, false, 'the right number without the visible difference loses the setup point');
  assert.deepEqual([...g('(150 - 120) / 150 * 100').notes], ['Divide by the old value.']);
  assert.match(g('(150 - 120) / 120').notes[0], /Multiply by 100/);
});

test('gradeSetup: units required and cancelling; values that must or must not appear', () => {
  const U = { type: 'setup', setup: { answer: '5000 kWh * 0.9 kg/kWh', unit: 'kg', requireUnits: true } };
  assert.equal(X.gradeSetup(U, '5000 kWh * 0.9 kg/kWh').correct, true);
  assert.match(X.gradeSetup(U, '5000 * 0.9').notes[0], /Write the units in the setup/);
  assert.match(X.gradeSetup(U, '5000 kWh * 0.9 kWh/kg').notes[0], /come out as kWh\^2\/kg, not kg/);
  const M = { type: 'setup', setup: { answer: '70 / 2', mustUse: ['70', '2'], mustNotUse: ['0.02'] } };
  const bare = X.gradeSetup(M, '35');
  assert.equal(bare.valueOk, true); assert.equal(bare.correct, false);
  assert.match(bare.notes[0], /Show 70 in the setup/);
  assert.ok(X.gradeSetup(M, '70 / 0.02 / 100').notes.some(n => /0\.02 does not belong/.test(n)));
});

/* Phase 3 (author F's report, docs/apenv-needs-author.md "Author F"; the
   coordinator's metric-ton and rate cases): the units setups had to drop. */
test('units authors needed: seconds, nanograms, kiloliters, degrees, decades, metric tons, and squares times lengths', () => {
  const r = X.evaluate('50000 L/s * 86400 s');
  assert.equal(r.value, 4.32e9); assert.equal(X.dimText(r.dims), 'L', 'seconds cancel');
  assert.equal(X.dimText(X.evaluate('5 ng/L * 2 L').dims), 'ng');
  assert.equal(X.dimText(X.evaluate('3000 m2 * 2 m').dims), 'm^3', 'm2 times m is m3');
  assert.deepEqual({ ...X.unitDims('m3') }, { m: 3 }); assert.deepEqual({ ...X.unitDims('m^3') }, { m: 3 });
  assert.equal(X.dimText(X.evaluate('120 ha * 10000 m2/ha * 0.5 m').dims), 'm^3');
  assert.deepEqual({ ...X.evaluate('1420 / m2 * 3000 m2').dims }, {}, 'a density times an area is a count');
  assert.equal(X.dimText(X.evaluate('40 t * 1000 kg/t').dims), 'kg', 't is a metric ton');
  assert.equal(X.dimText(X.evaluate('40 MT').dims), 'tonne');
  assert.equal(X.dimText(X.evaluate('0.9 °C / 6 decades').dims), '°C/decade');
  assert.equal(X.dimText(X.evaluate('5 µg/L * 10 L').dims), 'ug');
  assert.equal(X.evaluate('2 kL').ok, true);
  // A one-letter unit is a whole word only: "kgs" is not kg times s.
  assert.equal(X.evaluate('2 kgs').ok, false);
  // gradeSetup with requireUnits now works for these setups.
  const item = { setup: { answer: '50000 L/s * 86400 s', unit: 'L', requireUnits: true } };
  assert.equal(X.gradeSetup(item, '50000 L/s * 86400 s').correct, true);
  assert.equal(X.gradeSetup(item, '50000 L/s * 24 h').correct, false);
});

test('a conversion factor with a compound unit divides as one quantity: 5000 W / 1000 W/kW is 5 kW', () => {
  for (const s of ['5000 W / 1000 W/kW', '5000 W / (1000 W/kW)', '5000 W * 1 kW/1000 W', '1500 W * 4 h / 1000 W/kW']) {
    const r = X.evaluate(s); assert.ok(r.ok, s);
    assert.ok(['kW', 'h kW'].includes(X.dimText(r.dims)), `${s}: ${X.dimText(r.dims)}`);
  }
  assert.equal(X.evaluate('1500 W * 4 h / 1000 W/kW').value, 6);
  assert.equal(X.evaluate('6 / 2 / 3').value, 1, 'plain numbers keep left-to-right division');
  const item = { setup: { answer: '1500 W * 4 h * 1 kW / 1000 W', unit: 'kW h', requireUnits: true } };
  assert.equal(X.gradeSetup(item, '1500 W * 4 h / 1000 W/kW').correct, true);
});
