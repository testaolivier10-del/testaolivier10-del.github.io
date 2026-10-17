/* p-value explorer: its model (statistics/assets/tools/math/p-value-explorer.js) and its
   validator (scripts/lib/apstat-tool-checks/p-value-explorer.mjs). OWNED BY THIS
   TOOL ONLY. Phase 2 adds: same seed same problem, every key recomputed with
   ApStatDist, planted mistakes caught, statistical model tests (capture
   rates, simulated SDs), and the shipped data passing. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { runtime } from '../lib/apstat-tool-checks/_shared.mjs';
import { check } from '../lib/apstat-tool-checks/p-value-explorer.mjs';
import { loadMap } from '../lib/apstat-build.mjs';

test('p-value-explorer: the model registers ApStatMath.pValueExplorer, and the validator checks the frame', () => {
  const { M, model } = runtime('p-value-explorer');
  assert.ok(M && model && typeof model.generate === 'function');
  const map = loadMap();
  const ok = { slug: 'p-value-explorer', kind: 'simulator', topic: 'p-values', intro: '<p>x</p>', howItWorks: '<p>x</p>', contexts: [{ id: 'c1', topic: 'p-values' }] };
  assert.deepEqual(check(ok, map), []);
  assert.ok(check({ ...ok, topic: 'nope' }, map).some(e => /topic/.test(e)));
  assert.ok(check({ ...ok, slug: 'other' }, map).some(e => /slug/.test(e)));
});
