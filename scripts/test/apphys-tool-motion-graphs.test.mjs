/* Motion graphs: its model (physics/assets/tools/math/motion-graphs.js) and its
   validator (scripts/lib/apphys-tool-checks/motion-graphs.mjs). OWNED BY THIS
   TOOL ONLY. Phase 2 adds: same seed same problem, every key recomputed from
   first principles, planted mistakes caught, and the shipped data passing. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { runtime } from '../lib/apphys-tool-checks/_shared.mjs';
import { check } from '../lib/apphys-tool-checks/motion-graphs.mjs';
import { loadMap } from '../lib/apphys-build.mjs';

test('motion-graphs: the model registers ApPhysMath.motionGraphs, and the validator checks the frame', () => {
  const { M, model } = runtime('motion-graphs');
  assert.ok(M && model && typeof model.generate === 'function');
  const map = loadMap();
  const ok = { slug: 'motion-graphs', kind: 'simulator', topic: 'motion-representations', intro: '<p>x</p>', howItWorks: '<p>x</p>', contexts: [{ id: 'c1', topic: 'motion-representations' }] };
  assert.deepEqual(check(ok, map), []);
  assert.ok(check({ ...ok, topic: 'nope' }, map).some(e => /topic/.test(e)));
  assert.ok(check({ ...ok, slug: 'other' }, map).some(e => /slug/.test(e)));
});
