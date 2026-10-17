/* Data explorer: its model (statistics/assets/tools/math/data-explorer.js) and its
   validator (scripts/lib/apstat-tool-checks/data-explorer.mjs). OWNED BY THIS
   TOOL ONLY. Same seed same problem; the AP quartile rule and the fences on
   reference data; the shapes the drills claim hold over many seeds; a planted
   wrong key or a wrong choice is caught; the shipped data passes. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runtime } from '../lib/apstat-tool-checks/_shared.mjs';
import { check, recheck } from '../lib/apstat-tool-checks/data-explorer.mjs';
import { loadMap, ROOT } from '../lib/apstat-build.mjs';

const data = JSON.parse(readFileSync(`${ROOT}/statistics/data/tools/data-explorer.json`, 'utf8'));
const { M, model } = runtime('data-explorer');
const ctxOf = id => data.contexts.find(c => c.id === id);

test('data-explorer: the validator checks the frame', () => {
  const map = loadMap();
  const ok = { slug: 'data-explorer', kind: 'simulator', topic: 'summary-statistics', intro: '<p>x</p>', howItWorks: '<p>x</p>', contexts: [] };
  assert.ok(check({ ...ok, topic: 'nope' }, map).some(e => /topic/.test(e)));
  assert.ok(check({ ...ok, slug: 'other' }, map).some(e => /slug/.test(e)));
});

test('data-explorer: summaries follow the AP rules (reference values by hand)', () => {
  // n odd: the median is left out of both halves
  const S = model.stats([1, 2, 3, 4, 5, 6, 7, 8, 100]);
  assert.equal(S.med, 5); assert.equal(S.q1, 2.5); assert.equal(S.q3, 7.5); assert.equal(S.iqr, 5);
  assert.deepEqual([...S.fences], [-5, 15]); assert.deepEqual([...S.outliers], [100]); assert.deepEqual([...S.whiskers], [1, 8]);
  assert.equal(model.inclusiveIqr([1, 2, 3, 4, 5, 6, 7, 8, 100]), 4);
  // the sample SD divides by n - 1
  assert.ok(Math.abs(model.stats([2, 4, 4, 4, 5, 5, 7, 9]).sd - 2.138089935) < 1e-8);
  // bins are [a, a + w): a value on an edge counts to the right
  assert.deepEqual([...model.bins([0, 5, 5, 9, 10], 0, 5).counts], [1, 3, 1]);
  assert.equal(model.shape([1, 1, 2, 2, 2, 3, 3, 4, 9, 15]).key, 'right');
});

test('data-explorer: the explore data sets compute as stated', () => {
  const c = data.explore.datasets.find(d => d.id === 'commute'), S = model.stats(c.values);
  assert.equal(S.n, 20); assert.ok(Math.abs(S.mean - 17.75) < 1e-12); assert.equal(S.med, 15);
  assert.deepEqual([...S.outliers], [48]); assert.equal(S.shape.key, 'right');
});

test('data-explorer: a seed gives the same problem twice', () => {
  for (const c of data.contexts) for (const t of c.types) {
    const a = model.generate(M.rng(777), c, t), b = model.generate(M.rng(777), c, t);
    assert.deepEqual(JSON.parse(JSON.stringify(a)), JSON.parse(JSON.stringify(b)));
  }
});

test('data-explorer: drill shapes hold over 500 seeds (skewed data have the mean on the tail side)', () => {
  const c = ctxOf('songs-describe');
  let right = 0, left = 0, sym = 0;
  for (let i = 1; i <= 500; i++) {
    const p = model.generate(M.rng(i * 31 + 7), c, 'describe'), S = model.stats(p.data.values);
    if (p.data.shape === 'right') { right++; assert.ok(S.mean > S.med && S.g >= 0.8); }
    if (p.data.shape === 'left') { left++; assert.ok(S.mean < S.med && S.g <= -0.8); }
    if (p.data.shape === 'sym') { sym++; assert.ok(Math.abs(S.g) <= 0.25); }
  }
  assert.ok(right > 100 && left > 100 && sym > 100, 'every shape is drawn often');
  // the outlier drill asks both ways: about 60% have an outlier
  let out = 0;
  for (let i = 1; i <= 400; i++) { const p = model.generate(M.rng(i * 13 + 1), ctxOf('pulse-fences'), 'fences'); if (p.steps.find(s => s.key === 'isout').options[p.steps.find(s => s.key === 'isout').correct] === 'Yes') out++; }
  assert.ok(out > 180 && out < 300, `outlier share ${out}/400`);
});

test('data-explorer: a planted wrong key or a wrong choice is caught', () => {
  const p = model.generate(M.rng(99), ctxOf('commute-summary'), 'summary');
  const errs0 = []; recheck(p, ctxOf('commute-summary'), errs0, 'w'); assert.deepEqual(errs0, []);
  const bad = JSON.parse(JSON.stringify(p)); bad.steps[0].cell.answer += 0.01;
  const errs = []; recheck(bad, ctxOf('commute-summary'), errs, 'w'); assert.ok(errs.some(e => /mean/.test(e)));
  const q = model.generate(M.rng(5), ctxOf('pulse-fences'), 'fences'), s = q.steps.find(x => x.key === 'isout');
  s.correct = 1 - s.correct; const e2 = []; recheck(q, ctxOf('pulse-fences'), e2, 'w'); assert.ok(e2.some(e => /isout/.test(e)));
});

test('data-explorer: the shipped data passes its validator', () => {
  assert.deepEqual(check(data, loadMap()), []);
});
