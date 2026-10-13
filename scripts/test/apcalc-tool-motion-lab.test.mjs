/* Motion lab: its model (calculus/assets/tools/math/motion-lab.js) and its
   validator (scripts/lib/apcalc-tool-checks/motion-lab.mjs). OWNED BY THIS
   TOOL ONLY. Phase 2 adds: same seed same problem, every key recomputed from
   first principles, planted mistakes caught, and the shipped data passing. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { runtime } from '../lib/apcalc-tool-checks/_shared.mjs';
import { check } from '../lib/apcalc-tool-checks/motion-lab.mjs';
import { loadMap } from '../lib/apcalc-build.mjs';

test('motion-lab: the model registers ApCalcMath.motionLab, and the validator checks the frame', () => {
  const { M, model } = runtime('motion-lab');
  assert.ok(M && model && typeof model.generate === 'function');
  const map = loadMap();
  const ok = { slug: 'motion-lab', kind: 'simulator', topic: 'straight-line-motion', intro: '<p>x</p>', howItWorks: '<p>x</p>', contexts: [{ id: 'c1', topic: 'straight-line-motion' }] };
  assert.deepEqual(check(ok, map), []);
  assert.ok(check({ ...ok, topic: 'nope' }, map).some(e => /topic/.test(e)));
  assert.ok(check({ ...ok, slug: 'other' }, map).some(e => /slug/.test(e)));
});
