/* Distribution areas: its model (statistics/assets/tools/math/distribution-areas.js) and its
   validator (scripts/lib/apstat-tool-checks/distribution-areas.mjs). OWNED BY THIS
   TOOL ONLY. Phase 2 adds: same seed same problem, every key recomputed with
   ApStatDist, planted mistakes caught, statistical model tests (capture
   rates, simulated SDs), and the shipped data passing. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { runtime } from '../lib/apstat-tool-checks/_shared.mjs';
import { check } from '../lib/apstat-tool-checks/distribution-areas.mjs';
import { loadMap } from '../lib/apstat-build.mjs';

test('distribution-areas: the model registers ApStatMath.distributionAreas, and the validator checks the frame', () => {
  const { M, model } = runtime('distribution-areas');
  assert.ok(M && model && typeof model.generate === 'function');
  const map = loadMap();
  const ok = { slug: 'distribution-areas', kind: 'simulator', topic: 'normal-distribution', intro: '<p>x</p>', howItWorks: '<p>x</p>', contexts: [{ id: 'c1', topic: 'normal-distribution' }] };
  assert.deepEqual(check(ok, map), []);
  assert.ok(check({ ...ok, topic: 'nope' }, map).some(e => /topic/.test(e)));
  assert.ok(check({ ...ok, slug: 'other' }, map).some(e => /slug/.test(e)));
});
