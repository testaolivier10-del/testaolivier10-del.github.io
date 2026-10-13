/* Free-body diagrams: its model (physics/assets/tools/math/free-body-diagrams.js) and its
   validator (scripts/lib/apphys-tool-checks/free-body-diagrams.mjs). OWNED BY THIS
   TOOL ONLY. Phase 2 adds: same seed same problem, every key recomputed from
   first principles, planted mistakes caught, and the shipped data passing. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { runtime } from '../lib/apphys-tool-checks/_shared.mjs';
import { check } from '../lib/apphys-tool-checks/free-body-diagrams.mjs';
import { loadMap } from '../lib/apphys-build.mjs';

test('free-body-diagrams: the model registers ApPhysMath.freeBodyDiagrams, and the validator checks the frame', () => {
  const { M, model } = runtime('free-body-diagrams');
  assert.ok(M && model && typeof model.generate === 'function');
  const map = loadMap();
  const ok = { slug: 'free-body-diagrams', kind: 'simulator', topic: 'forces-fbd', intro: '<p>x</p>', howItWorks: '<p>x</p>', contexts: [{ id: 'c1', topic: 'forces-fbd' }] };
  assert.deepEqual(check(ok, map), []);
  assert.ok(check({ ...ok, topic: 'nope' }, map).some(e => /topic/.test(e)));
  assert.ok(check({ ...ok, slug: 'other' }, map).some(e => /slug/.test(e)));
});
