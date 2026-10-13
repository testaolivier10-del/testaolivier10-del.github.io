/* Scaling drills: its model (physics/assets/tools/math/scaling-drills.js) and its
   validator (scripts/lib/apphys-tool-checks/scaling-drills.mjs). OWNED BY THIS
   TOOL ONLY. Phase 2 adds: same seed same problem, every key recomputed from
   first principles, planted mistakes caught, and the shipped data passing. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { runtime } from '../lib/apphys-tool-checks/_shared.mjs';
import { check } from '../lib/apphys-tool-checks/scaling-drills.mjs';
import { loadMap } from '../lib/apphys-build.mjs';

test('scaling-drills: the model registers ApPhysMath.scalingDrills, and the validator checks the frame', () => {
  const { M, model } = runtime('scaling-drills');
  assert.ok(M && model && typeof model.generate === 'function');
  const map = loadMap();
  const ok = { slug: 'scaling-drills', kind: 'skill', topic: 'math-proportional', intro: '<p>x</p>', howItWorks: '<p>x</p>', contexts: [{ id: 'c1', topic: 'math-proportional' }] };
  assert.deepEqual(check(ok, map), []);
  assert.ok(check({ ...ok, topic: 'nope' }, map).some(e => /topic/.test(e)));
  assert.ok(check({ ...ok, slug: 'other' }, map).some(e => /slug/.test(e)));
});
