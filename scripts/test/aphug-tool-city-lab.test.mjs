/* City lab: its model (human-geography/assets/tools/math/city-lab.js) and its
   validator (scripts/lib/aphug-tool-checks/city-lab.mjs). OWNED BY THIS TOOL
   ONLY (builder T4). Phase 0: the stub registers, the page script parses,
   the tool is pre-registered in pages.json, and the frame check bites. The
   builder adds the real tests (shipped data, seeds, planted mistakes). */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { runtime } from '../lib/aphug-tool-checks/_shared.mjs';
import { check } from '../lib/aphug-tool-checks/city-lab.mjs';
import { ROOT } from '../lib/aphug-build.mjs';

test('city-lab: registers, the page script parses, it is pre-registered, the frame is checked', () => {
  const { model } = runtime('city-lab');
  assert.ok(model && typeof model.generate === 'function', 'ApHugMath.cityLab is registered');
  assert.doesNotThrow(() => new Function(readFileSync(join(ROOT, 'human-geography', 'assets', 'tools', 'city-lab.js'), 'utf8')));
  const pages = JSON.parse(readFileSync(join(ROOT, 'human-geography', 'data', 'pages.json'), 'utf8'));
  const entry = pages.tools.find(t => t.slug === 'city-lab');
  assert.ok(entry && entry.studio === true, 'registered in pages.json on the Tool Studio');
  assert.equal(entry.topic, 'von-thunen');
  const map = { topicById: id => id === 'von-thunen' ? { id } : null };
  const ok = { slug: 'city-lab', kind: 'simulator', topic: 'von-thunen', intro: '<p>x</p>', howItWorks: '<p>x</p>', contexts: [{ id: 'c1', topic: 'von-thunen' }] };
  assert.deepEqual(check(ok, map), []);
  assert.ok(check({ ...ok, slug: 'nope' }, map).some(e => /slug/.test(e)));
  assert.ok(check({ ...ok, topic: 'nope' }, map).some(e => /topic/.test(e)));
});
