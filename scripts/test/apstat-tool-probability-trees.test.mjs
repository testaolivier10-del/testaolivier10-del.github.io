/* Probability trees: its model (statistics/assets/tools/math/probability-trees.js) and its
   validator (scripts/lib/apstat-tool-checks/probability-trees.mjs). OWNED BY THIS
   TOOL ONLY. Same seed same problem and same simulation, the shipped data
   passing, planted mistakes caught, the probability rules against hand
   values, the Venn overlap solved to the joint probability, and the
   simulation: 10,000 trials estimate every probability (conditional ones
   included) within 4 standard errors, and the estimate's error shrinks as
   trials grow. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { runtime } from '../lib/apstat-tool-checks/_shared.mjs';
import { check } from '../lib/apstat-tool-checks/probability-trees.mjs';
import { loadMap, ROOT } from '../lib/apstat-build.mjs';

const DATA = JSON.parse(readFileSync(join(ROOT, 'statistics', 'data', 'tools', 'probability-trees.json'), 'utf8'));

test('probability-trees: the model registers ApStatMath.probabilityTrees, and the validator checks the frame', () => {
  const { M, model } = runtime('probability-trees');
  assert.ok(M && model && typeof model.generate === 'function');
  const map = loadMap();
  const ok = { slug: 'probability-trees', kind: 'simulator', topic: 'conditional-probability', intro: '<p>x</p>', howItWorks: '<p>x</p>', contexts: [{ id: 'c1', topic: 'conditional-probability' }] };
  assert.ok(check({ ...ok, topic: 'nope' }, map).some(e => /topic/.test(e)));
  assert.ok(check({ ...ok, slug: 'other' }, map).some(e => /slug/.test(e)));
});

test('probability-trees: the shipped data passes its validator', () => {
  assert.deepEqual(check(DATA, loadMap()), []);
});

test('probability-trees: the rules match hand values (screening: 0.05, 0.9, 0.08)', () => {
  const { model } = runtime('probability-trees');
  const J = model.joint(0.05, 0.9, 0.08);
  assert.ok(Math.abs(J.AB - 0.045) < 1e-12 && Math.abs(J.B - 0.121) < 1e-12);
  assert.ok(Math.abs(J.AgB - 0.045 / 0.121) < 1e-12);
  assert.ok(Math.abs(J.AorB - (0.05 + 0.121 - 0.045)) < 1e-12);
  assert.ok(Math.abs(model.value(J, 'BgA') - 0.9) < 1e-12 && Math.abs(model.value(J, 'AgnB') - 0.005 / 0.879) < 1e-12);
  assert.equal(model.joint(0.5, 1 / 3, 1 / 3).indep, true);
  assert.equal(J.indep, false);
});

test('probability-trees: the Venn circles overlap in exactly P(A and B), including the edge cases', () => {
  const { model } = runtime('probability-trees');
  for (const [a, b, ab] of [[0.05, 0.121, 0.045], [0.45, 0.3375, 0.1125], [0.3, 0.215, 0.18], [0.5, 1 / 3, 1 / 6], [0.4, 0.3, 0], [0.2, 0.6, 0.2], [0.9, 0.85, 0.8]]) {
    const V = model.venn(a, b, ab, { w: 488, h: 280 });
    assert.ok(Math.abs(V.overlap - ab) < 1e-6, `${a} ${b} ${ab}: ${V.overlap}`);
    assert.ok(2 * Math.max(V.rA, V.rB) <= 0.92 * 280 + 1e-9);
  }
});

test('probability-trees: a seed gives the same problem and the same simulation twice', () => {
  const { M, model } = runtime('probability-trees');
  for (const c of DATA.contexts) for (const t of model.TYPES) assert.equal(JSON.stringify(model.generate(M.rng(777), c, t)), JSON.stringify(model.generate(M.rng(777), c, t)));
  const J = model.joint(0.3, 0.6, 0.05);
  assert.deepEqual(model.simulate(M.rng(5), J, 200), model.simulate(M.rng(5), J, 200));
});

test('probability-trees: 10,000 simulated trials estimate every probability within 4 standard errors, and more trials get closer', () => {
  const { M, model } = runtime('probability-trees');
  for (const sc of DATA.explore.scenes) {
    const J = model.joint(sc.pA, sc.pBgA, sc.pBgNA), outs = model.simulate(M.rng(2026), J, 10000);
    for (const q of Object.keys(model.QS)) {
      const e = model.estimate(outs, q), p = model.value(J, q);
      if (!e.d) continue;
      const se = Math.sqrt(p * (1 - p) / e.d) || 1e-9;
      assert.ok(Math.abs(e.p - p) <= 4 * se + 1e-9, `${sc.id} ${q}: ${e.p} vs ${p}`);
    }
  }
  // the average error at 10,000 trials is well under the error at 100
  const J = model.joint(0.3, 0.6, 0.05);
  let small = 0, big = 0;
  for (let s = 1; s <= 200; s++) { const o = model.simulate(M.rng(s), J, 10000), p = model.value(J, 'AgB'); big += Math.abs(model.estimate(o, 'AgB', 100).p - p) || 0; small += Math.abs(model.estimate(o, 'AgB', 10000).p - p); }
  assert.ok(small < big / 5, `error ${small / 200} at 10,000 vs ${big / 200} at 100`);
});

test('probability-trees: planted mistakes are caught', () => {
  const { model } = runtime('probability-trees');
  const map = loadMap();
  const bad = JSON.parse(JSON.stringify(DATA)); bad.explore.scenes[0].pBgA = 1.2;
  assert.ok(check(bad, map).some(e => /P\(A\)/.test(e)));
  const bad2 = JSON.parse(JSON.stringify(DATA)); delete bad2.contexts[0].rules;
  assert.ok(check(bad2, map).some(e => /rules/.test(e)));
  const real = model.generate;
  try {
    model.generate = (r, c, t) => { const p = real(r, c, t); const s = p.steps.find(x => x.key === 'AgB'); if (s) s.cell.answer = p.figure.pBgA; return p; };
    assert.ok(check(DATA, map).some(e => /P\(A \| B\) key/.test(e)));
    model.generate = (r, c, t) => { const p = real(r, c, t); const s = p.steps.find(x => x.key === 'indep'); if (s) s.correct = (s.correct + 1) % 2; return p; };
    assert.ok(check(DATA, map).some(e => /independence verdict/.test(e)));
    model.generate = (r, c, t) => { const p = real(r, c, t); const s = p.steps.find(x => x.key === 'AorB'); if (s && p.figure.pA != null && p.figure.pB != null) s.cell.answer = p.figure.pA + p.figure.pB; return p; };
    assert.ok(check(DATA, map).some(e => /P\(A or B\) key/.test(e)));
  } finally { model.generate = real; }
});
