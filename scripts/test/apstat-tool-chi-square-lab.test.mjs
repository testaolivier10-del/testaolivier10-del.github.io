/* Chi-square lab: its model (statistics/assets/tools/math/chi-square-lab.js) and its
   validator (scripts/lib/apstat-tool-checks/chi-square-lab.mjs). OWNED BY THIS
   TOOL ONLY. Phase 2 adds: same seed same problem, every key recomputed with
   ApStatDist, planted mistakes caught, statistical model tests (capture
   rates, simulated SDs), and the shipped data passing. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { runtime } from '../lib/apstat-tool-checks/_shared.mjs';
import { check } from '../lib/apstat-tool-checks/chi-square-lab.mjs';
import { loadMap } from '../lib/apstat-build.mjs';

test('chi-square-lab: the model registers ApStatMath.chiSquareLab, and the validator checks the frame', () => {
  const { M, model } = runtime('chi-square-lab');
  assert.ok(M && model && typeof model.generate === 'function');
  const map = loadMap();
  const ok = { slug: 'chi-square-lab', kind: 'simulator', topic: 'chi-square-test', intro: '<p>x</p>', howItWorks: '<p>x</p>', contexts: [{ id: 'c1', topic: 'chi-square-test' }] };
  assert.deepEqual(check(ok, map), []);
  assert.ok(check({ ...ok, topic: 'nope' }, map).some(e => /topic/.test(e)));
  assert.ok(check({ ...ok, slug: 'other' }, map).some(e => /slug/.test(e)));
});
