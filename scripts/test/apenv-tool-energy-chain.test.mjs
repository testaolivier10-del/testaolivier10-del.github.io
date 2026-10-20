/* Energy chain: its model (environmental-science/assets/tools/math/energy-chain.js) and
   its validator (scripts/lib/apenv-tool-checks/energy-chain.mjs). OWNED BY THIS
   TOOL ONLY (builder T3). Phase 0: the model registers, the page script
   parses, the validator checks the frame. Phase 2 adds: same seed same
   problem; every key recomputed with ApEnvCalc; planted mistakes caught;
   model tests; the shipped data passing. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { runtime } from '../lib/apenv-tool-checks/_shared.mjs';
import { check } from '../lib/apenv-tool-checks/energy-chain.mjs';
import { loadMap, ROOT } from '../lib/apenv-build.mjs';

test('energy-chain: the model registers ApEnvMath.energyChain, the page script parses, and the validator checks the frame', () => {
  const { model } = runtime('energy-chain');
  assert.ok(model && typeof model.generate === 'function');
  assert.doesNotThrow(() => new Function(readFileSync(join(ROOT, 'environmental-science', 'assets', 'tools', 'energy-chain.js'), 'utf8')));
  const map = loadMap();
  const ok = { slug: 'energy-chain', kind: 'simulator', topic: 'fossil-fuels', intro: '<p>x</p>', howItWorks: '<p>x</p>', contexts: [{ id: 'c1', topic: 'fossil-fuels' }] };
  assert.deepEqual(check(ok, map), []);
  assert.ok(check({ ...ok, topic: 'nope' }, map).some(e => /topic/.test(e)));
  assert.ok(check({ ...ok, slug: 'other' }, map).some(e => /slug/.test(e)));
  const pages = JSON.parse(readFileSync(join(ROOT, 'environmental-science', 'data', 'pages.json'), 'utf8'));
  assert.equal(pages.tools.find(t => t.slug === 'energy-chain').topic, 'fossil-fuels');
  const data = join(ROOT, 'environmental-science', 'data', 'tools', 'energy-chain.json');
  if (existsSync(data)) assert.deepEqual(check(JSON.parse(readFileSync(data, 'utf8')), map), []);
});
