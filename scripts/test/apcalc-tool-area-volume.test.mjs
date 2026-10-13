/* Area and volume: its model (calculus/assets/tools/math/area-volume.js) and its
   validator (scripts/lib/apcalc-tool-checks/area-volume.mjs). OWNED BY THIS
   TOOL ONLY. Phase 2 adds: same seed same problem, every key recomputed from
   first principles, planted mistakes caught, and the shipped data passing. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { runtime } from '../lib/apcalc-tool-checks/_shared.mjs';
import { check } from '../lib/apcalc-tool-checks/area-volume.mjs';
import { loadMap } from '../lib/apcalc-build.mjs';

test('area-volume: the model registers ApCalcMath.areaVolume, and the validator checks the frame', () => {
  const { M, model } = runtime('area-volume');
  assert.ok(M && model && typeof model.generate === 'function');
  const map = loadMap();
  const ok = { slug: 'area-volume', kind: 'simulator', topic: 'area-between-curves-x', intro: '<p>x</p>', howItWorks: '<p>x</p>', contexts: [{ id: 'c1', topic: 'area-between-curves-x' }] };
  assert.deepEqual(check(ok, map), []);
  assert.ok(check({ ...ok, topic: 'nope' }, map).some(e => /topic/.test(e)));
  assert.ok(check({ ...ok, slug: 'other' }, map).some(e => /slug/.test(e)));
});
