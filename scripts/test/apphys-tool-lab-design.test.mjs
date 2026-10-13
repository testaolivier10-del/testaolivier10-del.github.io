/* Lab design: its model (physics/assets/tools/math/lab-design.js) and its
   validator (scripts/lib/apphys-tool-checks/lab-design.mjs). OWNED BY THIS
   TOOL ONLY. Phase 2 adds: same seed same problem, every key recomputed from
   first principles, planted mistakes caught, and the shipped data passing. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { runtime } from '../lib/apphys-tool-checks/_shared.mjs';
import { check } from '../lib/apphys-tool-checks/lab-design.mjs';
import { loadMap } from '../lib/apphys-build.mjs';

test('lab-design: the model registers ApPhysMath.labDesign, and the validator checks the frame', () => {
  const { M, model } = runtime('lab-design');
  assert.ok(M && model && typeof model.generate === 'function');
  const map = loadMap();
  const ok = { slug: 'lab-design', kind: 'simulator', topic: 'motion-representations', intro: '<p>x</p>', howItWorks: '<p>x</p>', contexts: [{ id: 'c1', topic: 'motion-representations' }] };
  assert.deepEqual(check(ok, map), []);
  assert.ok(check({ ...ok, topic: 'nope' }, map).some(e => /topic/.test(e)));
  assert.ok(check({ ...ok, slug: 'other' }, map).some(e => /slug/.test(e)));
});
