/* Diffusion lab: its model (human-geography/assets/tools/math/diffusion-lab.js) and its
   validator (scripts/lib/aphug-tool-checks/diffusion-lab.mjs). OWNED BY THIS TOOL
   ONLY (builder T4). Phase 0: the stub registers, the page script parses,
   the tool is pre-registered in pages.json, and the frame check bites. The
   builder adds the real tests (shipped data, seeds, planted mistakes). */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { runtime } from '../lib/aphug-tool-checks/_shared.mjs';
import { check } from '../lib/aphug-tool-checks/diffusion-lab.mjs';
import { ROOT } from '../lib/aphug-build.mjs';

test('diffusion-lab: registers, the page script parses, it is pre-registered, the frame is checked', () => {
  const { model } = runtime('diffusion-lab');
  assert.ok(model && typeof model.generate === 'function', 'ApHugMath.diffusionLab is registered');
  assert.doesNotThrow(() => new Function(readFileSync(join(ROOT, 'human-geography', 'assets', 'tools', 'diffusion-lab.js'), 'utf8')));
  const pages = JSON.parse(readFileSync(join(ROOT, 'human-geography', 'data', 'pages.json'), 'utf8'));
  const entry = pages.tools.find(t => t.slug === 'diffusion-lab');
  assert.ok(entry && entry.studio === true, 'registered in pages.json on the Tool Studio');
  assert.equal(entry.topic, 'diffusion-types');
  const map = { topicById: id => id === 'diffusion-types' ? { id } : null };
  const ok = { slug: 'diffusion-lab', kind: 'simulator', topic: 'diffusion-types', intro: '<p>x</p>', howItWorks: '<p>x</p>', contexts: [{ id: 'c1', topic: 'diffusion-types' }] };
  assert.deepEqual(check(ok, map), []);
  assert.ok(check({ ...ok, slug: 'nope' }, map).some(e => /slug/.test(e)));
  assert.ok(check({ ...ok, topic: 'nope' }, map).some(e => /topic/.test(e)));
});
