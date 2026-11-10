/* Model Studio: its model (human-geography/assets/tools/math/model-studio.js) and its
   validator (scripts/lib/aphug-tool-checks/model-studio.mjs). OWNED BY THIS TOOL
   ONLY (builder T1). Phase 0: the stub registers, the page script parses,
   the tool is pre-registered in pages.json, and the frame check bites. The
   builder adds the real tests (shipped data, seeds, planted mistakes). */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { runtime } from '../lib/aphug-tool-checks/_shared.mjs';
import { check } from '../lib/aphug-tool-checks/model-studio.mjs';
import { ROOT } from '../lib/aphug-build.mjs';

test('model-studio: registers, the page script parses, it is pre-registered, the frame is checked', () => {
  const { model } = runtime('model-studio');
  assert.ok(model && typeof model.generate === 'function', 'ApHugMath.modelStudio is registered');
  assert.doesNotThrow(() => new Function(readFileSync(join(ROOT, 'human-geography', 'assets', 'tools', 'model-studio.js'), 'utf8')));
  const pages = JSON.parse(readFileSync(join(ROOT, 'human-geography', 'data', 'pages.json'), 'utf8'));
  const entry = pages.tools.find(t => t.slug === 'model-studio');
  assert.ok(entry && entry.studio === true, 'registered in pages.json on the Tool Studio');
  assert.equal(entry.topic, 'transition-model');
  const map = { topicById: id => id === 'transition-model' ? { id } : null };
  const ok = { slug: 'model-studio', kind: 'simulator', topic: 'transition-model', intro: '<p>x</p>', howItWorks: '<p>x</p>', contexts: [{ id: 'c1', topic: 'transition-model' }] };
  assert.deepEqual(check(ok, map), []);
  assert.ok(check({ ...ok, slug: 'nope' }, map).some(e => /slug/.test(e)));
  assert.ok(check({ ...ok, topic: 'nope' }, map).some(e => /topic/.test(e)));
});
