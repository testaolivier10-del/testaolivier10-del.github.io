/* Accumulation: its model (calculus/assets/tools/math/accumulation.js) and its
   validator (scripts/lib/apcalc-tool-checks/accumulation.mjs). OWNED BY THIS
   TOOL ONLY. Phase 2 adds: same seed same problem, every key recomputed from
   first principles, planted mistakes caught, and the shipped data passing. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { runtime } from '../lib/apcalc-tool-checks/_shared.mjs';
import { check } from '../lib/apcalc-tool-checks/accumulation.mjs';
import { loadMap } from '../lib/apcalc-build.mjs';

test('accumulation: the model registers ApCalcMath.accumulation, and the validator checks the frame', () => {
  const { M, model } = runtime('accumulation');
  assert.ok(M && model && typeof model.generate === 'function');
  const map = loadMap();
  const ok = { slug: 'accumulation', kind: 'simulator', topic: 'ftc-accumulation', intro: '<p>x</p>', howItWorks: '<p>x</p>', contexts: [{ id: 'c1', topic: 'ftc-accumulation' }] };
  assert.deepEqual(check(ok, map), []);
  assert.ok(check({ ...ok, topic: 'nope' }, map).some(e => /topic/.test(e)));
  assert.ok(check({ ...ok, slug: 'other' }, map).some(e => /slug/.test(e)));
});
