/* Euler and logistic: its model (calculus-bc/assets/tools/math/euler-logistic.js), page script and validator
   (scripts/lib/apcalcbc-tool-checks/euler-logistic.mjs). OWNED BY THIS TOOL ONLY (builder T3).
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
const { check } = await import('../lib/apcalcbc-tool-checks/euler-logistic.mjs');

test('euler-logistic: the model registers ApCalcMath.eulerLogistic, the page script parses, and the validator checks the frame', () => {
  const { model } = runtime('euler-logistic');
  assert.ok(model && typeof model.generate === 'function');
  assert.doesNotThrow(() => new Function(readFileSync(join(ROOT, 'calculus-bc', 'assets', 'tools', 'euler-logistic.js'), 'utf8')));
  const map = loadMap();
  const ok = { slug: 'euler-logistic', kind: 'simulator', topic: 'eulers-method', intro: '<p>x</p>', howItWorks: '<p>x</p>', contexts: [{ id: 'c1', topic: 'eulers-method' }] };
  const errs = check(ok, map);
  assert.ok(errs.every(e => /stub/.test(e)), errs.join('; '));
  assert.ok(check({ ...ok, topic: 'nope' }, map).some(e => /topic/.test(e)));
  assert.ok(check({ ...ok, slug: 'other' }, map).some(e => /slug/.test(e)));
  const pages = JSON.parse(readFileSync(join(ROOT, 'calculus-bc', 'data', 'pages.json'), 'utf8'));
  assert.equal(pages.tools.find(t => t.slug === 'euler-logistic').topic, 'eulers-method');
  const data = join(ROOT, 'calculus-bc', 'data', 'tools', 'euler-logistic.json');
  if (existsSync(data)) assert.deepEqual(check(JSON.parse(readFileSync(data, 'utf8')), map), []);
});
