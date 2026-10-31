/* Parametric motion: its model (calculus-bc/assets/tools/math/parametric-motion.js), page script and validator
   (scripts/lib/apcalcbc-tool-checks/parametric-motion.mjs). OWNED BY THIS TOOL ONLY (builder T2).
   Phase 0: the model registers on AB's runtime, the page script parses, the validator checks
   the frame and refuses the stub. Phase 2 adds: same seed same problem, keys recomputed,
   planted slips caught, model tests, the shipped data passing. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
process.env.APCALC_COURSE = 'bc';
const { loadMap, ROOT } = await import('../lib/apcalc-build.mjs');
const { runtime } = await import('../lib/apcalcbc-tool-checks/_shared.mjs');
const { check } = await import('../lib/apcalcbc-tool-checks/parametric-motion.mjs');

test('parametric-motion: the model registers ApCalcMath.parametricMotion, the page script parses, and the validator checks the frame', () => {
  const { model } = runtime('parametric-motion');
  assert.ok(model && typeof model.generate === 'function');
  assert.doesNotThrow(() => new Function(readFileSync(join(ROOT, 'calculus-bc', 'assets', 'tools', 'parametric-motion.js'), 'utf8')));
  const map = loadMap();
  const ok = { slug: 'parametric-motion', kind: 'simulator', topic: 'parametric-derivatives', intro: '<p>x</p>', howItWorks: '<p>x</p>', contexts: [{ id: 'c1', topic: 'parametric-derivatives' }] };
  const errs = check(ok, map);
  assert.ok(errs.every(e => /stub/.test(e)), errs.join('; '));
  assert.ok(check({ ...ok, topic: 'nope' }, map).some(e => /topic/.test(e)));
  assert.ok(check({ ...ok, slug: 'other' }, map).some(e => /slug/.test(e)));
  const pages = JSON.parse(readFileSync(join(ROOT, 'calculus-bc', 'data', 'pages.json'), 'utf8'));
  assert.equal(pages.tools.find(t => t.slug === 'parametric-motion').topic, 'parametric-derivatives');
  const data = join(ROOT, 'calculus-bc', 'data', 'tools', 'parametric-motion.json');
  if (existsSync(data)) assert.deepEqual(check(JSON.parse(readFileSync(data, 'utf8')), map), []);
});
