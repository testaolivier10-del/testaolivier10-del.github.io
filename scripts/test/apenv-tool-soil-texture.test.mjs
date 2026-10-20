/* Soil texture: its model (environmental-science/assets/tools/math/soil-texture.js) and
   its validator (scripts/lib/apenv-tool-checks/soil-texture.mjs). OWNED BY THIS
   TOOL ONLY (builder T2). Phase 0: the model registers, the page script
   parses, the validator checks the frame. Phase 2 adds: same seed same
   problem; every key recomputed with ApEnvCalc; planted mistakes caught;
   model tests; the shipped data passing. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { runtime } from '../lib/apenv-tool-checks/_shared.mjs';
import { check } from '../lib/apenv-tool-checks/soil-texture.mjs';
import { loadMap, ROOT } from '../lib/apenv-build.mjs';

test('soil-texture: the model registers ApEnvMath.soilTexture, the page script parses, and the validator checks the frame', () => {
  const { model } = runtime('soil-texture');
  assert.ok(model && typeof model.generate === 'function');
  assert.doesNotThrow(() => new Function(readFileSync(join(ROOT, 'environmental-science', 'assets', 'tools', 'soil-texture.js'), 'utf8')));
  const map = loadMap();
  const ok = { slug: 'soil-texture', kind: 'simulator', topic: 'soil-properties', intro: '<p>x</p>', howItWorks: '<p>x</p>', contexts: [{ id: 'c1', topic: 'soil-properties' }] };
  assert.deepEqual(check(ok, map), []);
  assert.ok(check({ ...ok, topic: 'nope' }, map).some(e => /topic/.test(e)));
  assert.ok(check({ ...ok, slug: 'other' }, map).some(e => /slug/.test(e)));
  const pages = JSON.parse(readFileSync(join(ROOT, 'environmental-science', 'data', 'pages.json'), 'utf8'));
  assert.equal(pages.tools.find(t => t.slug === 'soil-texture').topic, 'soil-properties');
  const data = join(ROOT, 'environmental-science', 'data', 'tools', 'soil-texture.json');
  if (existsSync(data)) assert.deepEqual(check(JSON.parse(readFileSync(data, 'utf8')), map), []);
});
