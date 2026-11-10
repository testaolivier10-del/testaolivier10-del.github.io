/* ApHugCalc (human-geography/assets/hug-calc.js): the rates, natural
   increase and doubling time, migration, dependency and sex ratios, the three
   densities, percent change, the rank-size rule, the gravity model and map
   scale; recipes that nest and refuse a non-number; the transition stage a
   pair of rates is consistent with. And ApHugGrade (hug-grade.js): numbers
   with an optional unit, the slips named, and the "Make it specific"
   builders with the human-geography hint flags (an explain has its link, a
   compare both sides, a degree is stated, a scale is named). The exam has no
   calculator, so the course's numbers are small; the library is exact anyway. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createBrowser } from './harness.mjs';

const B = createBrowser();
for (const f of ['hug-calc.js', 'hug-grade.js']) B.load(`human-geography/assets/${f}`);
const S = B.window.ApHugCalc, G = B.window.ApHugGrade;

test('rates: crude birth and death rates, natural increase in percent, doubling time by the rule of 70', () => {
  assert.equal(S.cbr(30000, 1000000), 30);
  assert.equal(S.cdr(10000, 1000000), 10);
  assert.equal(S.rni(30, 10), 2, 'per 1,000 becomes a percent: (30 - 10) / 10');
  assert.equal(S.rniPer1000(30, 10), 20);
  assert.equal(S.doublingTime(2), 35);
  assert.equal(S.doublingTime(0), null, 'a population that is not growing does not double');
  assert.equal(S.doublingTime(-0.3), null);
  assert.throws(() => S.evaluate({ fn: 'doublingTime', args: [0] }), /not growing/, 'never a silent key');
  assert.throws(() => S.cbr(10, 0), /population must be more than 0/);
  assert.throws(() => S.cbr(-1, 100), /births cannot be negative/);
});

test('migration: the net migration rate and growth with migration', () => {
  assert.equal(S.netMigrationRate(6000, 2000, 1000000), 4);
  assert.equal(S.netMigrationRate(1000, 3000, 1000000), -2, 'more leaving than arriving is negative');
  assert.equal(S.growthRate(12, 9, -2), 1, 'per 1,000: births minus deaths plus net migration');
});

test('age and sex: total, youth and elderly dependency ratios, and the sex ratio', () => {
  assert.equal(S.dependency(30, 20, 100), 50, 'dependents per 100 of working age');
  assert.equal(S.youthDependency(30, 100), 30);
  assert.equal(S.elderlyDependency(20, 100), 20);
  assert.equal(S.sexRatio(105, 100), 105);
  assert.throws(() => S.dependency(30, 20, 0), /people 15-64 must be more than 0/);
});

test('density: arithmetic, physiological and agricultural', () => {
  assert.equal(S.arithmeticDensity(1000000, 50000), 20);
  assert.equal(S.physiologicalDensity(1000000, 5000), 200);
  assert.equal(S.agriculturalDensity(100000, 5000), 20);
  assert.ok(S.physiologicalDensity(1000000, 5000) > S.arithmeticDensity(1000000, 50000), 'farmland is a part of the land');
});

test('change, cities and interaction: percent change, rank-size, gravity; map scale both ways', () => {
  assert.equal(S.percentChange(120, 150), 25);
  assert.equal(S.percentChange(200, 150), -25);
  assert.equal(S.share(25, 200), 12.5);
  assert.equal(S.rankSize(12000000, 3), 4000000);
  assert.throws(() => S.rankSize(100, 1.5), /whole number/);
  assert.equal(S.gravity(4, 3, 2), 3);
  assert.equal(S.gravity(4, 3, 4), 0.75, 'twice as far, a quarter of the interaction');
  assert.equal(S.mapToGround(4, 50000), 2, '4 cm at 1:50,000 is 2 km');
  assert.equal(S.groundToMap(2, 50000), 4);
  assert.equal(S.scaleDenominator(4, 2), 50000);
});

test('the transition stage a pair of rates is consistent with (words, never a key)', () => {
  assert.deepEqual([[38, 30], [40, 12], [20, 8], [11, 9], [8, 11]].map(([b, d]) => S.transitionStage({ cbr: b, cdr: d }).stage), [1, 2, 3, 4, 5]);
  assert.ok(!S.FNS.includes('transitionStage'), 'words are not recipes');
});

test('recipes nest; an unknown recipe or a non-number is an error, never a silent key', () => {
  assert.equal(S.evaluate({ fn: 'rni', args: [{ fn: 'cbr', args: [30000, 1000000] }, { fn: 'cdr', args: [10000, 1000000] }] }), 2);
  assert.equal(S.evaluate({ fn: 'doublingTime', args: [{ fn: 'rni', args: [24, 10] }] }), 50);
  assert.equal(S.evaluate({ fn: 'div', args: [1, 3] }), 0.333333333333, '12 significant digits');
  assert.equal(S.evaluate({ fn: 'mean', args: [[3, 5, 7, 5]] }), 5);
  assert.throws(() => S.evaluate({ fn: 'nope', args: [] }), /unknown recipe/);
  assert.throws(() => S.evaluate({ fn: 'div', args: [1, 0] }), /division by 0/);
  for (const old of ['median', 'sd', 'z', 'rulePct', 'r', 'convert']) assert.ok(!S.FNS.includes(old), `${old} is not in this course`);
});

test('numeric: a number with an optional unit, tolerance and the named slips', () => {
  assert.equal(G.numeric({ answer: 5 }, '5').correct, true);
  assert.equal(G.numeric({ answer: 5 }, '5.04').correct, true, 'within 1%');
  assert.equal(G.numeric({ answer: 5 }, '6').correct, false);
  const N = { answer: 68, unit: '%' };
  assert.equal(G.numeric(N, '68%').correct, true);
  assert.equal(G.numeric(N, { value: '68', unit: 'percent' }).correct, true);
  const nu = G.numeric(N, '68');
  assert.equal(nu.score, 0.5); assert.match(nu.notes[0], /needs its unit/);
  assert.match(G.numeric(N, '0.68%').notes[0], /100 times too small/);
  assert.match(G.numeric({ answer: -2 }, '2').notes[0], /negative/);
  const m = G.numeric({ answer: 5, mistakes: [{ value: 20, why: 'Placeholder: that is the total; divide by the count.' }] }, '20');
  assert.equal(m.mistake.value, 20); assert.deepEqual([...m.notes], ['Placeholder: that is the total; divide by the count.']);
  assert.equal(G.numeric({ answer: 5 }, 'five').valid, false);
});

test('"Make it specific": slots graded exactly; the human-geography flags are hints only', () => {
  const SP = { slots: { place: { options: ['Egypt', 'some countries'], correct: 0 }, effect: { options: ['more schools are needed', 'it changes'], correct: 0 } } };
  assert.equal(G.specific(SP, { place: 0, effect: 0 }).correct, true);
  const half = G.specific(SP, { place: 1, effect: 0 });
  assert.deepEqual({ ...half.slots }, { place: false, effect: true });
  assert.match(half.notes[0], /the place/);
  const W = { write: { mechanism: true, both: true, degree: true, scale: true } };
  const bad = G.flags(W, 'Egypt has a high physiological density.');
  for (const r of ['mechanism', 'both', 'degree', 'scale']) assert.ok(bad.some(f => f.rule === r && !f.ok), `${r} flagged`);
  assert.ok(bad.every(f => !('score' in f)), 'never a score');
  const good = G.flags(W, 'To a high degree: at the national scale Egypt\'s farmland is crowded, whereas Canada\'s is not, because Egypt farms only along the Nile.');
  assert.ok(good.every(f => f.ok), JSON.stringify(good));
});
