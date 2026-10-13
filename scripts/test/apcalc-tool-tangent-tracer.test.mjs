/* Tangent tracer: its model (calculus/assets/tools/math/tangent-tracer.js) and its
   validator (scripts/lib/apcalc-tool-checks/tangent-tracer.mjs). OWNED BY THIS
   TOOL ONLY. Phase 2 adds: same seed same problem, every key recomputed from
   first principles, planted mistakes caught, and the shipped data passing. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { runtime } from '../lib/apcalc-tool-checks/_shared.mjs';
import { check } from '../lib/apcalc-tool-checks/tangent-tracer.mjs';
import { loadMap } from '../lib/apcalc-build.mjs';

test('tangent-tracer: the model registers ApCalcMath.tangentTracer, and the validator checks the frame', () => {
  const { M, model } = runtime('tangent-tracer');
  assert.ok(M && model && typeof model.generate === 'function');
  const map = loadMap();
  const ok = { slug: 'tangent-tracer', kind: 'simulator', topic: 'derivative-definition', intro: '<p>x</p>', howItWorks: '<p>x</p>', contexts: [{ id: 'c1', topic: 'derivative-definition' }] };
  assert.deepEqual(check(ok, map), []);
  assert.ok(check({ ...ok, topic: 'nope' }, map).some(e => /topic/.test(e)));
  assert.ok(check({ ...ok, slug: 'other' }, map).some(e => /slug/.test(e)));
});
