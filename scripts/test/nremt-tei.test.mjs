// The NREMT technology-enhanced items (nremt/assets/tei-items.js) and the
// adaptive exam model (nremt/assets/cat.js): scoring, text, and the bank's
// dnd and table items being well formed.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
require('../../nremt/assets/tei-items.js');
require('../../nremt/assets/cat.js');
const T = globalThis.NremtTei, C = globalThis.NremtCat;
const bank = JSON.parse(readFileSync('nremt/assets/questions.json', 'utf8'));
const tei = bank.filter((q) => q.type === 'dnd' || q.type === 'table');

const dnd = { type: 'dnd', q: 'Sort', options: ['a', 'b', 'c'], bins: ['X', 'Y'], correct: [0, 1, 0] };

test('all or nothing, marked per row', () => {
  assert.equal(T.answered(dnd, [0, 1, null]), false);
  assert.equal(T.correct(dnd, [0, 1, null]), false);
  assert.equal(T.correct(dnd, [0, 1, 0]), true);
  assert.equal(T.correct(dnd, [0, 0, 0]), false);
  assert.deepEqual(T.rowsRight(dnd, [0, 0, 0]), [true, false, true]);
  assert.equal(T.rightCount(dnd, [0, 0, 0]), 2);
});

test('reordering rows keeps each key with its row and the groups in place', () => {
  const q = { ...dnd, options: dnd.options.slice(), correct: dnd.correct.slice() };
  T.reorder(q, [2, 0, 1]);
  assert.deepEqual(q.options, ['c', 'a', 'b']);
  assert.deepEqual(q.correct, [0, 0, 1]);
  assert.deepEqual(q.bins, ['X', 'Y']);
});

test('answer text and the results breakdown', () => {
  assert.equal(T.userText(dnd, [null, null, null]), null);
  assert.match(T.keyText(dnd), /X: a; c\. Y: b/);
  const html = T.reviewHtml(dnd, [0, 0, null]);
  assert.equal((html.match(/is-ok/g) || []).length, 1);
  assert.equal((html.match(/is-bad/g) || []).length, 2);
  assert.match(html, /not placed/);
  const order = { type: 'order', options: ['p', 'q'], correct: [1, 0] };
  assert.match(T.reviewHtml(order, [0, 1]), /you had: p/);
});

test('every drag-and-drop and table item in the bank is well formed', () => {
  assert.ok(tei.length >= 60, `only ${tei.length} dnd/table items`);
  for (const q of tei) {
    const g = q.type === 'dnd' ? q.bins : q.cols;
    assert.ok(Array.isArray(g) && g.length >= 2 && g.length <= 4, `#${q.id}: 2 to 4 groups`);
    assert.equal(q.correct.length, q.options.length, `#${q.id}: one key per row`);
    assert.ok(q.correct.every((k) => Number.isInteger(k) && k >= 0 && k < g.length), `#${q.id}: key out of range`);
    assert.ok(g.every((_, k) => q.correct.includes(k)), `#${q.id}: a group no row belongs to`);
    assert.ok(q.options.length >= 4 && q.options.length <= 6, `#${q.id}: 4 to 6 rows`);
    assert.ok(new Set(q.options).size === q.options.length, `#${q.id}: duplicate row`);
    assert.ok(String(q.explain).length > 200, `#${q.id}: explanation too short`);
    assert.doesNotMatch(q.q + q.options.join(' ') + q.explain + g.join(' '), /—/, `#${q.id}: em dash`);
  }
  // No row-position tell: the first stored row is not always in the first group.
  const firstInFirst = tei.filter((q) => q.correct[0] === 0).length / tei.length;
  assert.ok(firstInFirst < 0.6, `first row keys to the first group in ${Math.round(firstInFirst * 100)}% of items`);
});

test('the adaptive model: estimate, stop rule, domains', () => {
  assert.equal(C.prob(0, 0), 0.5);
  const right = Array.from({ length: 70 }, () => ({ b: 0, right: true }));
  const wrong = Array.from({ length: 70 }, () => ({ b: -1, right: false }));
  const half = Array.from({ length: 120 }, (_, i) => ({ b: 0, right: i % 2 === 0 }));
  assert.equal(C.decide(right.slice(0, 69)).stop, false, 'never stops before the minimum');
  assert.deepEqual([C.decide(right).stop, C.decide(right).pass, C.decide(right).reason], [true, true, 'above']);
  assert.deepEqual([C.decide(wrong).stop, C.decide(wrong).pass, C.decide(wrong).reason], [true, false, 'below']);
  assert.equal(C.decide(half).reason, 'max');
  assert.equal(C.decide(right.slice(0, 30), true).pass, false, 'out of time before the minimum is not a pass');
  assert.equal(C.domainBand([], 0).band, 'none');
  assert.equal(C.domainBand(right.slice(0, 20), 1.5).band, 'above');
  assert.equal(C.domainBand(wrong.slice(0, 20), -1.5).band, 'below');
});

test('the adaptive picker keeps the domain proportions and targets the estimate', () => {
  const targets = { A: 41, B: 22, C: 17, D: 13, E: 7 };
  const pool = [];
  for (let i = 0; i < 1000; i++) pool.push({ i, domain: 'ABCDE'[i % 5], diff: ['easy', 'medium', 'hard', 'expert'][i % 4] });
  const counts = {}, used = new Set();
  let rnd = 1;
  for (let n = 0; n < 100; n++) {
    const i = C.pick(pool.filter((x) => !used.has(x.i)), counts, targets, 0.1, null, () => (rnd = (rnd * 16807) % 2147483647) / 2147483647);
    used.add(i);
    counts[pool[i].domain] = (counts[pool[i].domain] || 0) + 1;
    assert.equal(pool[i].diff, 'hard', 'the item nearest an estimate of 0.1 is a hard one');
  }
  for (const [d, w] of Object.entries(targets)) assert.ok(Math.abs(counts[d] - w) <= 1, `${d}: ${counts[d]} of 100, target ${w}`);
});

test('the engine routes every answer path through the new types', () => {
  const src = readFileSync('nremt/practice-engine.js', 'utf8');
  for (const fn of ['isAnswered', 'isAnswerCorrect', 'formatUserAnswerText', 'formatCorrectAnswerText']) {
    const body = src.slice(src.indexOf(`function ${fn}(`), src.indexOf('\n}', src.indexOf(`function ${fn}(`)));
    assert.match(body, /TEI\.isTei\(q\)/, `${fn} does not handle dnd and table`);
  }
  assert.match(src, /TEI\.reorder\(q, order\)/, 'the option shuffle does not keep row keys');
  assert.match(src, /mode !== 'full' && mode !== 'cat'/, 'the adaptive exam shows answers as it goes');
  const gates = readFileSync('nremt/assets/premium-gates.js', 'utf8');
  assert.match(gates, /mode !== 'cat'/, 'the adaptive exam is not treated as an exam by the Premium gates');
});
