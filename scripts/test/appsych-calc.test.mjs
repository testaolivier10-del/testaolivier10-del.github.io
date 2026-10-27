/* ApPsychCalc (psychology/assets/psy-calc.js): every calculation
   type of docs/appsych-spec.md section 7 as a recipe, nested recipes, unit
   chains that refuse a factor that does not cancel; and ApPsychGrade
   (psy-grade.js): numbers read with scale words and powers of ten, units in
   any common spelling, the value and the unit graded separately, and the
   slips the Chief Reader Reports name. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createBrowser } from './harness.mjs';

const B = createBrowser();
for (const f of ['psy-expr.js', 'psy-calc.js', 'psy-grade.js']) B.load(`psychology/assets/${f}`);
const C = B.window.ApPsychCalc, G = B.window.ApPsychGrade;
const near = (a, b, e = 1e-9) => assert.ok(Math.abs(a - b) <= e * Math.max(1, Math.abs(b)), `${a} vs ${b}`);

test('percents, populations and doubling', () => {
  assert.equal(C.percentChange(120, 150), 25);
  assert.equal(C.percentChange(150, 120), -20);
  assert.equal(C.percentOf(10, 5000), 500);
  assert.equal(C.ruleOf70(2), 35);
  assert.equal(C.doublingYear(2020, 2), 2055, '"in what year": the start year plus the doubling time');
  assert.equal(C.naturalIncrease(30, 10), 2, 'per 1,000 to percent: divide by 10');
  near(C.growthRate(1000, 20, 10, 5, 3), 32833.333333333336 / 1);
  near(C.exponential(100, 2, 35), 100 * Math.pow(1.02, 35));
  near(C.continuous(100, 2, 35), 201.37527074704767);
  assert.equal(C.afterDoublings(100, 70, 35), 400);
  near(C.tfr([20, 100, 120, 80, 40, 10, 2]), 1.86);
  near(C.aboveReplacement(2.5), 0.4);
});

test('energy flow, efficiency, cost and emissions', () => {
  assert.equal(C.evaluate({ fn: 'tenPercent', args: [10000, 2] }), 100, 'two steps up: × 0.01, no float noise in a key');
  assert.equal(C.npp(100, 40), 60);
  assert.equal(C.gpp(60, 40), 100);
  assert.equal(C.efficiency(35, 100), 35);
  near(C.chainEfficiency(0.35, 0.9, 0.05), 1.575);
  near(C.chainEfficiency(35, 90, 5), 1.575); // percents over 1 read as percents
  assert.equal(C.inputNeeded(30, 30), 100);
  assert.equal(C.cost(500, 0.12), 60);
  assert.equal(C.savings(1000, 600, 0.12), 48);
  assert.equal(C.emissions(5000, 0.9), 4500);
});

test('half-life, toxicology and water', () => {
  assert.equal(C.halfLives(15, 5), 3);
  near(C.halfLifeLeft(80, 5, 15), 10);
  assert.equal(C.timeToFraction(0.125, 5), 15);
  assert.equal(C.ld50([[0, 0], [10, 20], [20, 50], [40, 90]]), 20);
  assert.equal(C.doseAt([[0, 0], [10, 20], [20, 40], [40, 90]], 50), 24, 'read off the curve by linear interpolation');
  assert.equal(C.doseFor(50, 70), 3500);
  assert.equal(C.biomagnify(0.01, 10, 3), 10);
  assert.equal(C.waterVolume(0.5, 10000), 5000);
  assert.equal(C.perCapita(2.5e9, 1e6), 2500);
  assert.equal(C.density(500, 25), 20);
});

test('units: conversions and chains that cancel, or refuse', () => {
  assert.deepEqual([C.convert(1, 'kWh', 'J'), C.convert(1, 'ha', 'm2'), C.convert(1, 'km2', 'ha'), C.convert(2, 'km', 'm')], [3600000, 10000, 100, 2000]);
  assert.deepEqual({ ...C.chain(5000, 'kWh', [[0.9, 'kg CO2', 1, 'kWh']]) }, { value: 4500, unit: 'kg CO2' });
  assert.throws(() => C.chain(5000, 'kWh', [[0.9, 'kg CO2', 1, 'gal']]), /gal, which is not there to cancel/);
  assert.throws(() => C.chain(5000, 'kWh', [[0.9, 'kg CO2', 'kWh']]), /must be \[num, numUnit, den, denUnit\]/);
});

test('recipes nest; an unknown recipe or a non-number is an error, never a silent key', () => {
  assert.equal(C.evaluate({ fn: 'add', args: [{ fn: 'ruleOf70', args: [2] }, 2020] }), 2055);
  assert.equal(C.evaluate({ fn: 'chain', args: [5000, 'kWh', [[0.9, 'kg CO2', 1, 'kWh']]], pick: 'value' }), 4500);
  assert.throws(() => C.evaluate({ fn: 'nope', args: [] }), /unknown recipe "nope"/);
  assert.throws(() => C.evaluate({ fn: 'chain', args: [5000, 'kWh', [[0.9, 'kg', 1, 'kWh']]] }), /use pick/);
  assert.throws(() => C.efficiency([1, 2], 3), /finite number/);
  for (const fn of ['percentChange', 'ruleOf70', 'doublingYear', 'naturalIncrease', 'tenPercent', 'npp', 'halfLifeLeft', 'chain', 'efficiency', 'emissions', 'ld50', 'biomagnify', 'waterVolume']) assert.ok(C.FNS.includes(fn), fn);
});

test('readNumber: scale words, powers of ten, thousands commas, superscripts, minus signs', () => {
  assert.deepEqual({ ...G.readNumber('2.5 million people') }, { value: 2500000, unit: 'people', scale: 'million', digits: '2.5' });
  assert.equal(G.readNumber('2.5 × 10^6 kWh').value, 2500000);
  assert.equal(G.readNumber('2.5 × 10^6 kWh').unit, 'kWh');
  assert.equal(G.readNumber('2.5x10⁶').value, 2500000);
  assert.equal(G.readNumber('2.5e6').value, 2500000);
  assert.equal(G.readNumber('1,250 kg').value, 1250);
  assert.equal(G.readNumber('−3.4 %').value, -3.4);
  assert.equal(G.readNumber('4.5 billion').value, 4.5e9);
  for (const bad of ['abc', '12 34', '1,25', '']) assert.equal(G.readNumber(bad), null, bad);
});

test('units in any common spelling read the same', () => {
  const same = (...u) => { const k = G.normUnit(u[0]); for (const x of u) assert.equal(G.normUnit(x), k, x); };
  same('kWh', 'kW·h', 'kW h', 'kW*h');
  same('people/km^2', 'people per km²', 'persons/square kilometer');
  same('%', 'percent');
  same('yr', 'year', 'years');
  assert.notEqual(G.normUnit('kg'), G.normUnit('kWh'));
  assert.deepEqual([G.unitIs('kilowatt hours', ['kWh']), G.unitIs('kW·h', ['kWh']), G.unitIs('kg', ['kWh'])], [true, true, false]);
});

test('numeric: value and unit graded apart, tolerance, and the named slips', () => {
  const N = { answer: 25, unit: '%' };
  const g = t => G.numeric(N, t);
  assert.deepEqual({ ...g('25%').parts }, { value: true, unit: true });
  assert.equal(g({ value: '25', unit: 'percent' }).correct, true);
  assert.equal(g('25.2 %').correct, true, 'within 1%');
  assert.equal(g('26 %').correct, false);
  const nu = g('25');
  assert.equal(nu.score, 0.5); assert.deepEqual({ ...nu.parts }, { value: true, unit: false });
  assert.match(nu.notes[0], /needs its unit/);
  assert.match(g('25 kg').notes[0], /kg is not the unit/);
  assert.match(g('0.25%').notes[0], /100 times too small/);
  assert.match(g('-25%').notes[0], /sign is wrong/);
  assert.match(G.numeric({ answer: 4500, unit: 'kg' }, '4.5 kg').notes[0], /factor of 1000/);
  assert.match(G.numeric({ answer: 2.5e6, unit: 'people' }, '2.5 people').notes[0], /factor of a million/);
  assert.equal(G.numeric({ answer: 2.5e6, unit: 'people' }, '2.5 million people').correct, true);
  assert.match(G.numeric({ answer: 5000, unit: 'kWh' }, '5 MWh').notes[0], /right in MWh, but the question asks for kWh/);
  const m = G.numeric({ answer: 2, unit: '%', mistakes: [{ value: 20, why: 'Per 1,000: divide by 10.' }] }, '20%');
  assert.equal(m.mistake.value, 20); assert.deepEqual([...m.notes], ['Per 1,000: divide by 10.'], 'an authored slip comes first and alone');
  assert.deepEqual([G.tolerance({ answer: 25 }), G.tolerance({ answer: 25, tol: 0.5 }), G.tolerance({ answer: 25, rel: 0.05 })], [0.25, 0.5, 1.25]);
  assert.equal(G.formatKey({ answer: 2500000, unit: 'kWh' }), '2,500,000 kWh');
  assert.equal(G.numeric(N, 'about twenty').valid, false);
});

test('"Make it specific": slots graded exactly; the free-text flags are hints only', () => {
  const S = { slots: { cause: { options: ['a', 'b'], correct: 0 }, effect: { options: ['c', 'd'], correct: 1 } }, write: { directional: true, mechanism: true, context: ['young'], forbid: ['affect'] } };
  assert.equal(G.specific(S, { cause: 0, effect: 1 }).correct, true);
  const half = G.specific(S, { cause: 1, effect: 1 });
  assert.deepEqual({ ...half.slots }, { cause: false, effect: true });
  assert.match(half.notes[0], /cause/);
  assert.equal(G.specific(S, { cause: 0 }).valid, false);
  const vague = G.flags(S, 'It will affect the population.');
  assert.ok(vague.some(f => f.rule === 'directional' && !f.ok));
  assert.ok(vague.some(f => f.rule === 'mechanism' && !f.ok));
  assert.ok(vague.every(f => !('score' in f)), 'never a score');
  const good = G.flags(S, 'Because many young people will reach child-bearing age, births increase, so the population grows.');
  assert.ok(good.every(f => f.ok), JSON.stringify(good));
});

/* Phase 3: metric tons as t or MT (never Mt, a megaton); "X per Y" and
   "X/Y" read the same, so a rate keyed with a slash accepts every spelling,
   and a bare unit on a rate key loses the unit point. */
test('metric tons and rates in every spelling', () => {
  const G = B.window.ApPsychGrade;
  for (const u of ['t', 'MT', 'tonne', 'tonnes', 'metric ton', 'metric tons', 'metric tonnes', 'Metric Tons']) assert.equal(G.normUnit(u), G.normUnit('metric tons'), u);
  assert.notEqual(G.normUnit('Mt'), G.normUnit('metric tons'), 'Mt is a megaton');
  assert.notEqual(G.normUnit('t'), G.normUnit('ton'), 'a metric ton is not a short ton');
  for (const [a, b] of [['°C per decade', '°C/decade'], ['degrees C per decade', '°C/decade'], ['kg per person per year', 'kg/person/yr'], ['kg/person/year', 'kg per person per yr'], ['people per square kilometer', 'people/km²'], ['nanograms per liter', 'ng/L']]) assert.equal(G.normUnit(a), G.normUnit(b), `${a} = ${b}`);
  const rate = { answer: 0.15, unit: '°C/decade' };
  assert.equal(G.numeric(rate, '0.15 °C per decade').correct, true);
  assert.equal(G.numeric(rate, '0.15 degrees C per decade').correct, true);
  const bare = G.numeric(rate, '0.15 °C');
  assert.equal(bare.correct, false); assert.equal(bare.parts.value, true); assert.equal(bare.parts.unit, false);
  assert.equal(G.numeric({ answer: 40, unit: 'metric tons' }, '40 t').correct, true);
});

/* Phase 3 (coordinator): numbers in a unit's denominator, and "how many
   times" answers written as a power of ten or a scale word. */
test('units with a number in the denominator: per 1,000 people = /1000 people = per thousand', () => {
  const G = B.window.ApPsychGrade;
  const n = s => G.normUnit(s);
  assert.equal(n('births per 1,000 people'), n('births/1000 people'));
  assert.equal(n('per 1,000 people'), n('/1000 people'));
  assert.equal(n('per 1,000 people'), n('per thousand people'));
  assert.equal(n('per 100,000'), n('/100000'));
  assert.notEqual(n('per 1,000'), n('per 100,000'));
  const N = { answer: 20, unit: 'births per 1,000 people' };
  for (const t of ['20 births per 1,000 people', '20 per 1000 people', '20 births/1000', '20 per thousand', '20 per 1,000']) assert.equal(G.numeric(N, t).correct, true, t);
  assert.equal(G.numeric(N, '20 per 100').correct, false);
  assert.equal(G.numeric(N, '20 %').parts.unit, false);
  assert.deepEqual({ ...G.readNumber('20 births per 1,000 people') }.value, 20, 'the 1,000 is part of the unit, not a second number');
});

test('"how many times": 10^6, 10⁶ times, 1 × 10^6 times and a million times all read as 1,000,000', () => {
  const G = B.window.ApPsychGrade;
  for (const s of ['10^6 times', '10^6', '10^(6)', '1 × 10^6 times', 'a million times', 'one million', '1,000,000 x', '10⁶ times', '1e6 fold']) assert.equal(G.readNumber(s).value, 1e6, s);
  assert.equal(G.readNumber('10^-3').value, 0.001);
  const N = { answer: 1e6, unit: 'times', units: ['x', 'fold'] };
  for (const s of ['10^6 times', '10^6', 'a million times', '1,000,000 x', '1000000']) assert.equal(G.numeric(N, s).correct, true, s);
  assert.equal(G.numeric(N, '10^6 kg').correct, false, 'a real unit on a multiplier is wrong');
  assert.equal(G.numeric({ answer: 100, unit: 'times' }, '100').correct, true, 'the word times is optional');
});

/* Phase 3 (u1-math review): a scale word in the key's unit and the same word
   typed cancel; a bare number in the key's scale still reads right. */
test('keys with a scale word in the unit: "10.8 billion metric tons" is right, as is 1.08e10 t', () => {
  const G = B.window.ApPsychGrade;
  const N = { answer: 10.8, unit: 'billion metric tons', mistakes: [{ value: 6.1, why: 'Only the carbon released, not the net change.' }] };
  for (const t of ['10.8 billion metric tons', '10.8 billion t', '1.08e10 metric tons', '10,800,000,000 metric tons', '1.08 × 10^10 t']) assert.equal(G.numeric(N, t).correct, true, t);
  assert.equal(G.numeric(N, '10.8').parts.value, true, 'a bare number in the key scale is the right value (its unit is missing)');
  assert.equal(G.numeric(N, '10.8 million metric tons').parts.value, false);
  assert.match(G.numeric(N, '6.1 billion metric tons').notes[0], /carbon released/, 'authored mistakes match in the same scale');
  assert.equal(G.numeric({ answer: 24, unit: 'million people' }, '24 million people').correct, true);
});
