/* ApStatQuestions grading (statistics/assets/stat-questions.js) and the
   statistics graders behind it (stat-grade.js, ApStatGrade; spec section 7):
   numeric items by kind, with the table route and authored slips; a p-value
   on the wrong side of alpha always wrong; a p-value range from a table;
   intervals typed in one box; setup items graded by value and structure;
   conclusions built slot by slot, plus the write-it-yourself hints. Then
   select-all partial credit, order, stimulus sets, fixed items, and the
   shared tool math. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createBrowser } from './harness.mjs';

const B = createBrowser();
B.load('statistics/assets/stat-expr.js');
B.load('statistics/assets/stat-dist.js');
B.load('statistics/assets/stat-grade.js');
const Q = B.load('statistics/assets/stat-questions.js').ApStatQuestions;
const G = B.window.ApStatGrade;
const plain = x => JSON.parse(JSON.stringify(x));
const num = (answer, kind, extra = {}) => ({ type: 'numeric', numeric: { answer, kind, ...extra } });

test('numeric by kind: the tolerance each kind allows (spec section 7, rule 2)', () => {
  // prob: 0.002 absolute; under 0.1, 1% relative.
  assert.equal(Q.grade(num(0.3504, 'prob'), '0.352').correct, true);
  assert.equal(Q.grade(num(0.3504, 'prob'), '0.353').correct, false);
  assert.equal(Q.grade(num(0.0412, 'prob'), '0.0415').correct, true);
  assert.equal(Q.grade(num(0.0412, 'prob'), '0.042').correct, false);
  assert.equal(Q.grade(num(0.25, 'prob'), '25%').correct, true, 'a percent is read for a probability');
  // z and t: 0.02; chi-square 0.05 above 10.
  assert.equal(Q.grade(num(-1.2, 'z'), '-1.22').correct, true);
  assert.equal(Q.grade(num(-1.2, 'z'), '-1.23').correct, false);
  assert.equal(Q.grade(num(12.31, 'chi2'), '12.35').correct, true);
  // stat: half a unit in the item's places, or 0.5%.
  assert.equal(Q.grade(num(18.36, 'stat', { places: 1 }), '18.4').correct, true);
  assert.equal(Q.grade(num(18.36, 'stat', { places: 1 }), '18.5').correct, false);
  // count and df exact; df accepts the conservative value when the item lists it.
  assert.equal(Q.grade(num(13, 'count'), '13').correct, true);
  assert.equal(Q.grade(num(13, 'count'), '13.4').correct, false);
  assert.equal(Q.grade(num(40.51, 'df', { tol: 0.05, alts: [17] }), '17').correct, true);
  // critical values: 0.005.
  assert.equal(Q.grade(num(2.262, 'critical'), '2.26').correct, true);
  assert.equal(Q.grade(num(2.262, 'critical'), '2.27').correct, false);
  assert.equal(Q.grade(num(0.5, 'prob'), 'half').valid, false);
});

test('p-values: the wrong side of alpha is always wrong, a table range is read, one-sided vs two-sided is named', () => {
  const q = num(0.0123, 'pvalue', { alpha: 0.05 });
  assert.equal(Q.grade(q, '0.012').correct, true);
  assert.equal(Q.grade(q, '0.0135').correct, true, 'within 10% relative');
  assert.equal(Q.grade(num(0.048, 'pvalue', { alpha: 0.05 }), '0.052').correct, false, 'inside the tolerance but across alpha');
  assert.match(Q.grade(num(0.048, 'pvalue', { alpha: 0.05 }), '0.052').notes.join(' '), /other side of α/);
  assert.equal(Q.grade(q, '0.01 to 0.02').correct, true, 'a range from Table B or C that contains the key');
  assert.equal(Q.grade(q, 'between 0.02 and 0.025').correct, false);
  assert.equal(Q.grade(num(0.04, 'pvalue', { alpha: 0.05 }), '0.025 to 0.1').correct, false, 'a range that straddles alpha cannot decide');
  assert.match(Q.grade(q, '0.0246').notes.join(' '), /one-sided or two-sided/);
});

test('numeric: authored slips first, then the complement and the sign', () => {
  const q = num(0.115, 'pvalue', { mistakes: [{ value: 0.1003, why: 'That SE used p-hat; a test uses p0.' }] });
  assert.equal(Q.grade(q, '0.1003').notes[0], 'That SE used p-hat; a test uses p0.');
  assert.match(Q.grade(num(0.3504, 'prob'), '0.6496').notes[0], /complement/);
  assert.match(Q.grade(num(1.28, 'z'), '-1.28').notes[0], /sign/);
  assert.equal(Q.keyText({ answer: 0.11506967, kind: 'pvalue' }), '0.1151');
  assert.equal(Q.keyText({ answer: -1.2000001, kind: 'z' }), '-1.2');
});

test('intervals: one box, read three ways; the parts graded and the slips named', () => {
  const q = { type: 'interval', interval: { lo: 0.3516, hi: 0.4884, places: 3 } };
  for (const t of ['from 0.3516 to 0.4884', '(0.352, 0.488)', '0.352 to 0.488', '0.42 +/- 0.0684', '0.42 ± 0.0684']) assert.equal(Q.grade(q, t).correct, true, t);
  const wrongCenter = Q.grade(q, '(0.40, 0.5368)');
  assert.equal(wrongCenter.correct, false); assert.match(wrongCenter.notes.join(' '), /centered in the wrong place/);
  assert.match(Q.grade(q, '0.42 +/- 0.05').notes.join(' '), /margin of error/);
  assert.equal(Q.grade(q, '0.3516-0.4884').valid, false, 'a hyphen is a subtraction, as in Bluebook');
  assert.match(Q.grade(q, '(0.4884, 0.3516)').notes.join(' '), /lower end first/);
  assert.equal(Q.grade(q, { lo: 0.3516, hi: 0.4884 }).correct, true);
});

test('setup items: the value and the structure, as the CED asks (expression, substitution, answer)', () => {
  const q = { type: 'setup', setup: { answer: '(0.47 - 0.5)/sqrt(0.5*0.5/400)', bind: { 'p-hat': 0.47, p0: 0.5, n: 400 }, mustUse: ['p0'], mustNotUse: ['p-hat in sqrt'],
    mistakes: [{ expr: '(0.47-0.5)/sqrt(0.47*0.53/400)', why: 'A test standard error uses p0, not p-hat.' }] } };
  for (const t of ['(0.47 - 0.5)/sqrt(0.5*0.5/400)', '(p-hat - p_0)/sqrt(p_0*(1-p_0)/n)', '(0.47-0.5)/sqrt(0.5(1-0.5)/400)']) assert.equal(Q.grade(q, t).correct, true, t);
  const slip = Q.grade(q, '(0.47-0.5)/sqrt(0.47*0.53/400)');
  assert.equal(slip.correct, false); assert.equal(slip.notes[0], 'A test standard error uses p0, not p-hat.');
  const bare = Q.grade(q, '-1.2');
  assert.equal(bare.correct, false); assert.equal(bare.score, 0.5, 'the value is right, the work is not shown');
  assert.match(bare.notes[0], /Show p0/);
  assert.equal(Q.grade(q, '(0.47 - 0.5)/sqrt(').valid, false);
  // Binomial probabilities: combinations typed three ways.
  const b = { type: 'setup', setup: { answer: '10C3 * 0.3^3 * 0.7^7', bind: {} } };
  for (const t of ['10C3*0.3^3*0.7^7', 'C(10,3) * 0.3^3 * 0.7^7', 'nCr(10,3)*0.3^3*(1-0.3)^7', '10!/(3!*7!)*0.3^3*0.7^7']) assert.equal(Q.grade(b, t).correct, true, t);
  // An interval typed with +/-.
  const iv = { type: 'setup', setup: { answer: '0.42 +/- 1.96*sqrt(0.42*0.58/200)', bind: {} } };
  assert.equal(Q.grade(iv, '0.42 ± 1.96*sqrt(0.42*0.58/200)').correct, true);
  assert.match(Q.grade(iv, '0.42').notes[0], /two ends/);
});

test('conclusions: the builder is graded slot by slot; the written box only gives hints', () => {
  const C = { mode: 'test', p: 0.012, alpha: 0.05,
    slots: { decision: { options: ['reject', 'fail to reject'], correct: 0 }, evidence: { options: ['convincing', 'not convincing', 'proof'], correct: 0, why: { 2: 'A test never proves.' } } },
    write: { context: ['voters'], direction: 'greater', compare: { p: 0.012, alpha: 0.05 } } };
  const q = { type: 'conclude', conclude: C };
  assert.equal(Q.grade(q, { decision: 0, evidence: 0 }).correct, true);
  const one = Q.grade(q, { decision: 0, evidence: 2 });
  assert.equal(one.correct, false); assert.equal(one.score, 0.5); assert.match(one.notes[0], /evidence wording: A test never proves/);
  assert.equal(Q.grade(q, { decision: 0 }).valid, false, 'every blank chosen');
  const good = 'Because the p-value of 0.012 is less than 0.05, we reject H0. There is convincing evidence that the true proportion of all district voters who support the bond is greater than 0.5.';
  assert.equal(G.flags(C, good).filter(f => !f.ok).length, 0);
  const badText = 'The p-value is small so this proves the voters support it.';
  const missed = G.flags(C, badText).filter(f => !f.ok).map(f => f.rule);
  for (const r of ['parameter', 'direction', 'evidence', 'compare', 'forbid']) assert.ok(missed.includes(r), r);
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

test('order is graded against the authored order', () => {
  const o = { type: 'order', options: ['s1', 's2', 's3', 's4'] };
  assert.equal(Q.grade(o, [0, 1, 2, 3]).correct, true);
  const g = Q.grade(o, [1, 0, 2, 3]);
  assert.equal(g.correct, false); assert.equal(g.right, 2);
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

test('ApStatMath: shared helpers and seeded samplers', () => {
  const b = createBrowser();
  b.load('statistics/assets/stat-expr.js');
  b.load('statistics/assets/stat-dist.js');
  const M = b.load('statistics/assets/tools/stat-tool-math.js').ApStatMath;
  assert.equal(M.sig(0.049989, 3), 0.05);
  assert.equal(M.fixed(4.745, 2), '4.75');
  const a = M.rng(7), c = M.rng(7);
  assert.deepEqual([a(), a(), a()], [c(), c(), c()], 'same seed, same numbers');
  const cell = M.cell(0.3, 0.001, [{ value: 0.3, why: 'dropped: equals the key' }, { value: 0.15, why: 'Halved.' }]);
  assert.equal(cell.mistakes.length, 1);
  assert.equal(M.diagnose(cell, 0.3).ok, true);
  assert.equal(M.diagnose(cell, 0.15).why, 'Halved.');
  assert.match(M.diagnose(cell, 0.7).why, /complement/);
  assert.match(M.diagnose(cell, 0.6).why, /one-sided or two-sided/);
  assert.match(M.diagnose(M.cell(1.28, 0.001), -1.28).why, /sign/);
  // Samplers: reproducible, the right sizes, and statistically right.
  const r = M.rng(2027);
  const pop = Array.from({ length: 100 }, (_, i) => i);
  const s1 = M.sample(r, pop, 10);
  assert.equal(new Set(s1).size, 10, 'without replacement: no repeats');
  assert.deepEqual(plain(M.sample(M.rng(1), pop, 5)), plain(M.sample(M.rng(1), pop, 5)));
  assert.throws(() => M.sample(r, [1, 2], 3), /larger than the population/);
  const shuffled = M.shuffle(M.rng(3), pop);
  assert.deepEqual(plain(shuffled.slice().sort((x, y) => x - y)), pop);
  const draws = M.repeat(20000, () => M.normal(r, 50, 10));
  const mean = draws.reduce((x, y) => x + y, 0) / draws.length, sd = Math.sqrt(draws.reduce((x, y) => x + (y - mean) ** 2, 0) / (draws.length - 1));
  assert.ok(Math.abs(mean - 50) < 0.3 && Math.abs(sd - 10) < 0.3, `${mean}, ${sd}`);
  const counts = M.repeat(20000, () => M.bernoulli(r, 0.3, 10));
  const p4 = counts.filter(k => k >= 4).length / counts.length;
  assert.ok(Math.abs(p4 - (1 - M.Dist().binomCdf(3, 10, 0.3))) < 0.015, `simulated P(X >= 4) = ${p4}`);
});
