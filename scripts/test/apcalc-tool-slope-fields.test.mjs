/* Slope fields: its model (calculus/assets/tools/math/slope-fields.js) and its
   validator (scripts/lib/apcalc-tool-checks/slope-fields.mjs). OWNED BY THIS
   TOOL ONLY. Phase 2 adds: same seed same problem, every key recomputed from
   first principles, planted mistakes caught, and the shipped data passing. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { runtime } from '../lib/apcalc-tool-checks/_shared.mjs';
import { check } from '../lib/apcalc-tool-checks/slope-fields.mjs';
import { loadMap } from '../lib/apcalc-build.mjs';

test('slope-fields: the model registers ApCalcMath.slopeFields, and the validator checks the frame', () => {
  const { M, model } = runtime('slope-fields');
  assert.ok(M && model && typeof model.generate === 'function');
  const map = loadMap();
  const ok = { slug: 'slope-fields', kind: 'simulator', topic: 'sketching-slope-fields', intro: '<p>x</p>', howItWorks: '<p>x</p>', contexts: [{ id: 'c1', topic: 'sketching-slope-fields' }] };
  assert.deepEqual(check(ok, map), []);
  assert.ok(check({ ...ok, topic: 'nope' }, map).some(e => /topic/.test(e)));
  assert.ok(check({ ...ok, slug: 'other' }, map).some(e => /slug/.test(e)));
});
