/* ApPsychStats (psychology/assets/psy-stats.js): central tendency and
   variation, the normal curve (the 68-95-99.7 rule exactly, z scores,
   percentiles, the CDF), correlation and its words, recipes that nest and
   refuse a non-number; and ApPsychGrade (psy-grade.js): numbers with an
   optional unit, the slips named, and the "Make it specific" builders with
   the psychology hint flags (cite a source, name a concept, avoid a
   restricted term). The exam has no calculator, so the course's numbers are
   small; the library is exact anyway. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createBrowser } from './harness.mjs';

const B = createBrowser();
for (const f of ['psy-stats.js', 'psy-grade.js']) B.load(`psychology/assets/${f}`);
const S = B.window.ApPsychStats, G = B.window.ApPsychGrade;
const near = (a, b, e = 1e-6) => assert.ok(Math.abs(a - b) <= e * Math.max(1, Math.abs(b)), `${a} vs ${b}`);

test('central tendency: mean, median (odd and even), mode (and every mode)', () => {
  assert.equal(S.mean([4, 6, 7, 7, 11]), 7);
  assert.equal(S.median([20, 2, 8, 3, 5]), 5, 'sorted first');
  assert.equal(S.median([1, 2, 3, 10]), 2.5, 'even count: the two middle values averaged');
  assert.equal(S.mode([3, 4, 4, 4, 6, 9]), 4);
  assert.deepEqual([...S.modes([1, 1, 2, 2, 3])], [1, 2], 'bimodal');
  assert.throws(() => S.mean([]), /at least 1/);
  assert.throws(() => S.mean([1, 'x']), /finite number/);
});

test('variation: range, population and sample standard deviation and variance', () => {
  assert.equal(S.range([2, 3, 5, 8, 20]), 18);
  assert.equal(S.sd([2, 4, 4, 4, 5, 5, 7, 9]), 2, 'the textbook data set: SD 2 dividing by n');
  near(S.sampleSd([2, 4, 4, 4, 5, 5, 7, 9]), Math.sqrt(32 / 7));
  assert.equal(S.variance([2, 4, 6, 8]), 5);
  near(S.sampleVariance([2, 4, 6, 8]), 20 / 3);
  assert.throws(() => S.sampleSd([5]), /at least 2/);
});

test('the normal curve: z scores, the 68-95-99.7 rule exactly, percentiles and the CDF', () => {
  assert.equal(S.z(130, 100, 15), 2);
  assert.equal(S.z(85, 100, 15), -1, 'below the mean, negative');
  assert.equal(S.fromZ(-2, 100, 15), 70);
  assert.throws(() => S.z(1, 0, 0), /positive/);
  assert.equal(S.rulePct(-1, 1), 68);
  assert.equal(S.rulePct(-2, 2), 95);
  assert.equal(S.rulePct(-3, 3), 99.7);
  assert.equal(S.rulePct(1, null), 16, 'above +1 SD');
  assert.equal(S.rulePct(null, -2), 2.5, 'below -2 SD');
  assert.equal(S.rulePct(1, 2), 13.5);
  assert.equal(S.rulePct(2, 3), 2.35);
  assert.equal(S.rulePct(null, null), 100);
  assert.deepEqual([-3, -2, -1, 0, 1, 2, 3].map(z => S.percentileRule(z)), [0.15, 2.5, 16, 50, 84, 97.5, 99.85]);
  assert.throws(() => S.rulePct(0.5, 1), /whole standard deviations/);
  assert.throws(() => S.rulePct(2, 1), /lower one/);
  near(S.cdf(0), 0.5); near(S.cdf(1), 0.8413447, 1e-6); near(S.cdf(-1.96), 0.0249979, 1e-5);
  near(S.percentile(115, 100, 15), 84.13447, 1e-5);
  near(S.between(85, 115, 100, 15), 68.26895, 1e-5, 'the CDF gives 68.27, the rule rounds to 68');
  assert.equal(S.percentRank(80, [60, 70, 80, 90, 100]), 50, 'ties count half');
});

test('correlation: r, the least-squares line, strength and direction in words', () => {
  near(S.r([[1, 2], [2, 4], [3, 6]]), 1);
  near(S.r([[1, 6], [2, 4], [3, 2]]), -1);
  near(S.r([[1, 62], [2, 70], [3, 68], [4, 80], [5, 84], [6, 83]]), 0.9378, 1e-3);
  assert.equal(S.slope([[1, 2], [2, 4], [3, 6]]), 2);
  assert.equal(S.intercept([[1, 3], [2, 5], [3, 7]]), 1);
  assert.throws(() => S.r([[1, 2], [1, 3], [1, 4]]), /does not vary/);
  assert.throws(() => S.r([[1, 2], [2, 3]]), /three/);
  assert.deepEqual([0.85, -0.5, 0.2, 0.05].map(S.strength), ['strong', 'moderate', 'weak', 'none']);
  assert.deepEqual([0.6, -0.6, 0.02].map(S.direction), ['positive', 'negative', 'none']);
  assert.equal(S.describe(-0.82), 'a strong negative correlation');
  assert.equal(S.describe(0.03), 'little or no correlation');
  assert.throws(() => S.strength(1.4), /between -1 and 1/);
});

test('recipes nest; an unknown recipe or a non-number is an error, never a silent key', () => {
  assert.equal(S.evaluate({ fn: 'mean', args: [[3, 5, 7, 5]] }), 5);
  assert.equal(S.evaluate({ fn: 'sub', args: [{ fn: 'mean', args: [[14, 14]] }, { fn: 'median', args: [[8, 9, 10]] }] }), 5);
  assert.equal(S.evaluate({ fn: 'percentileRule', args: [1] }), 84);
  assert.equal(S.evaluate({ fn: 'div', args: [1, 3] }), 0.333333333333, '12 significant digits');
  assert.throws(() => S.evaluate({ fn: 'nope', args: [] }), /unknown recipe/);
  assert.throws(() => S.evaluate({ fn: 'div', args: [1, 0] }), /division by 0/);
  assert.ok(S.FNS.includes('rulePct') && S.FNS.includes('r') && !S.FNS.includes('describe'), 'words are not recipes');
  for (const old of ['percentChange', 'ruleOf70', 'convert', 'chain']) assert.ok(!S.FNS.includes(old), `${old} is not in this course`);
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

test('"Make it specific": slots graded exactly; the psychology flags are hints only', () => {
  const SP = { slots: { method: { options: ['an experiment', 'a correlational study'], correct: 0 }, opdef: { options: ['presses counted', 'motivation'], correct: 0 } } };
  assert.equal(G.specific(SP, { method: 0, opdef: 0 }).correct, true);
  const half = G.specific(SP, { method: 1, opdef: 0 });
  assert.deepEqual({ ...half.slots }, { method: false, opdef: true });
  assert.match(half.notes[0], /research method/);
  const W = { write: { cite: true, concept: ['schema', 'top-down processing'], restricted: ['mean', 'memory'] } };
  const bad = G.flags(W, 'The mean recall was higher, so memory improved.');
  assert.ok(bad.some(f => f.rule === 'cite' && !f.ok), 'no source cited');
  assert.ok(bad.some(f => f.rule === 'concept' && !f.ok));
  assert.ok(bad.some(f => f.rule === 'restricted' && !f.ok && /does not count/.test(f.hint)), 'a restricted term is flagged');
  assert.ok(bad.every(f => !('score' in f)), 'never a score');
  const good = G.flags(W, 'According to Source 2, recall was higher with a title, because a schema guided top-down processing.');
  assert.ok(good.every(f => f.ok), JSON.stringify(good));
});
