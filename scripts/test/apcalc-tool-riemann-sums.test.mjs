/* Riemann sums: its model (calculus/assets/tools/math/riemann-sums.js) and its
   validator (scripts/lib/apcalc-tool-checks/riemann-sums.mjs). OWNED BY THIS
   TOOL ONLY. Phase 2 adds: same seed same problem, every key recomputed from
   first principles, planted mistakes caught, and the shipped data passing. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { runtime } from '../lib/apcalc-tool-checks/_shared.mjs';
import { check } from '../lib/apcalc-tool-checks/riemann-sums.mjs';
import { loadMap } from '../lib/apcalc-build.mjs';

test('riemann-sums: the model registers ApCalcMath.riemannSums, and the validator checks the frame', () => {
  const { M, model } = runtime('riemann-sums');
  assert.ok(M && model && typeof model.generate === 'function');
  const map = loadMap();
  const ok = { slug: 'riemann-sums', kind: 'simulator', topic: 'riemann-sums', intro: '<p>x</p>', howItWorks: '<p>x</p>', contexts: [{ id: 'c1', topic: 'riemann-sums' }] };
  assert.deepEqual(check(ok, map), []);
  assert.ok(check({ ...ok, topic: 'nope' }, map).some(e => /topic/.test(e)));
  assert.ok(check({ ...ok, slug: 'other' }, map).some(e => /slug/.test(e)));
});
