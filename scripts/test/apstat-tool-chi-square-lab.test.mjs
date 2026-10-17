/* Chi-square lab: its model (statistics/assets/tools/math/chi-square-lab.js) and its
   validator (scripts/lib/apstat-tool-checks/chi-square-lab.mjs). OWNED BY THIS
   TOOL ONLY. Same seed, same problem; every key recomputed with ApStatDist;
   planted mistakes caught; statistical model tests (chance tables keep their
   row totals; the simulated Type I rate within 1 point of alpha); the
   shipped data passing. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { runtime } from '../lib/apstat-tool-checks/_shared.mjs';
import { check, recheck } from '../lib/apstat-tool-checks/chi-square-lab.mjs';
import { loadMap, ROOT } from '../lib/apstat-build.mjs';

const data = JSON.parse(readFileSync(join(ROOT, 'statistics', 'data', 'tools', 'chi-square-lab.json'), 'utf8'));
const ctx = id => data.contexts.find(c => c.id === id);

test('chi-square-lab: the model registers, and the validator checks the frame', () => {
  const { model } = runtime('chi-square-lab');
  assert.ok(model && typeof model.generate === 'function');
  const map = loadMap();
  const ok = { slug: 'chi-square-lab', kind: 'simulator', topic: 'chi-square-test', intro: '<p>x</p>', howItWorks: '<p>x</p>', contexts: [] };
  assert.ok(check({ ...ok, topic: 'nope' }, map).some(e => /topic/.test(e)));
  assert.ok(check({ ...ok, slug: 'other' }, map).some(e => /slug/.test(e)));
});

test('chi-square-lab: the shipped data passes the validator (300 problems per context and type)', () => {
  assert.deepEqual(check(data, loadMap()), []);
});

test('chi-square-lab: a seed gives the same problem twice', () => {
  const { M, model } = runtime('chi-square-lab');
  for (const t of ['expected', 'chooser']) {
    const a = model.generate(M.rng(2718), ctx('news'), t), b = model.generate(M.rng(2718), ctx('news'), t);
    assert.equal(JSON.stringify(a), JSON.stringify(b));
  }
});

test('chi-square-lab: keys match ApStatDist, the df and E slips are named, a planted key is caught', () => {
  const { M, model, Dist } = runtime('chi-square-lab');
  const p = model.generate(M.rng(12), ctx('lunch'), 'expected'), t = Dist.chi2table(p.data.obs);
  assert.ok(Math.abs(p.steps.find(s => s.key === 'chi2').cell.answer - t.chi2) < 1e-12);
  assert.ok(Math.abs(p.steps.find(s => s.key === 'p').cell.answer - Dist.chi2Sf(t.chi2, t.df)) < 1e-12);
  const df = p.steps.find(s => s.key === 'df'), R = p.data.obs.length, C = p.data.obs[0].length;
  assert.match(M.diagnose(df.cell, R * C - 1).why, /\(r - 1\)\(c - 1\)/);
  const E = p.steps.find(s => s.key === 'E');
  assert.match(M.diagnose(E.cell, p.data.obs[p.data.i][p.data.j]).why || '', /observed/);
  const errs = [];
  recheck(p, ctx('lunch'), 'ok', errs);
  assert.deepEqual(errs, []);
  const bad = JSON.parse(JSON.stringify(p));
  bad.steps.find(s => s.key === 'E').cell.answer += 1;
  recheck(bad, ctx('lunch'), 'bad', errs);
  assert.ok(errs.some(e => /expected count key/.test(e)));
});

test('chi-square-lab: chance tables keep row totals, and the simulated Type I rate is within 1 point of alpha', () => {
  const { M, model } = runtime('chi-square-lab');
  const obs = data.explore.studies[0].obs, r = M.rng(3);
  for (let k = 0; k < 50; k++) {
    const c = model.chance(r, obs);
    c.forEach((row, i) => assert.equal(row.reduce((a, b) => a + b, 0), obs[i].reduce((a, b) => a + b, 0)));
  }
  const rate = model.simulateTypeI(M.rng(2026), [100, 100, 100], [0.4, 0.25, 0.35], 0.05, 10000);
  assert.ok(Math.abs(rate - 0.05) <= 0.01, `rate ${rate}`);
});
