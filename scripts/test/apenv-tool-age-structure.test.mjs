/* Age structure: its model (environmental-science/assets/tools/math/age-structure.js) and
   its validator (scripts/lib/apenv-tool-checks/age-structure.mjs). OWNED BY THIS
   TOOL ONLY (builder T1). Phase 0: the model registers, the page script
   parses, the validator checks the frame. Phase 2 adds: same seed same
   problem; every key recomputed with ApEnvCalc; planted mistakes caught;
   model tests; the shipped data passing. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { runtime } from '../lib/apenv-tool-checks/_shared.mjs';
import { check } from '../lib/apenv-tool-checks/age-structure.mjs';
import { loadMap, ROOT } from '../lib/apenv-build.mjs';

test('age-structure: the model registers ApEnvMath.ageStructure, the page script parses, and the validator checks the frame', () => {
  const { model } = runtime('age-structure');
  assert.ok(model && typeof model.generate === 'function');
  assert.doesNotThrow(() => new Function(readFileSync(join(ROOT, 'environmental-science', 'assets', 'tools', 'age-structure.js'), 'utf8')));
  const map = loadMap();
  const ok = { slug: 'age-structure', kind: 'simulator', topic: 'age-structure', intro: '<p>x</p>', howItWorks: '<p>x</p>', contexts: [{ id: 'c1', topic: 'age-structure' }] };
  assert.deepEqual(check(ok, map), []);
  assert.ok(check({ ...ok, topic: 'nope' }, map).some(e => /topic/.test(e)));
  assert.ok(check({ ...ok, slug: 'other' }, map).some(e => /slug/.test(e)));
  const pages = JSON.parse(readFileSync(join(ROOT, 'environmental-science', 'data', 'pages.json'), 'utf8'));
  assert.equal(pages.tools.find(t => t.slug === 'age-structure').topic, 'age-structure');
  const data = join(ROOT, 'environmental-science', 'data', 'tools', 'age-structure.json');
  if (existsSync(data)) assert.deepEqual(check(JSON.parse(readFileSync(data, 'utf8')), map), []);
});
