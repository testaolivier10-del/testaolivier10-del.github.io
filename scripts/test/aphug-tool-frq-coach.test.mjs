/* FRQ coach: its model (human-geography/assets/tools/math/frq-coach.js) and its
   validator (scripts/lib/aphug-tool-checks/frq-coach.mjs). OWNED BY THIS TOOL
   ONLY (builder T2). Phase 0: the stub registers, the page script parses,
   the tool is pre-registered in pages.json, and the frame check bites. The
   builder adds the real tests (shipped data, seeds, planted mistakes). */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { runtime } from '../lib/aphug-tool-checks/_shared.mjs';
import { check } from '../lib/aphug-tool-checks/frq-coach.mjs';
import { ROOT } from '../lib/aphug-build.mjs';

test('frq-coach: registers, the page script parses, it is pre-registered, the frame is checked', () => {
  const { model } = runtime('frq-coach');
  assert.ok(model && typeof model.generate === 'function', 'ApHugMath.frqCoach is registered');
  assert.doesNotThrow(() => new Function(readFileSync(join(ROOT, 'human-geography', 'assets', 'tools', 'frq-coach.js'), 'utf8')));
  const pages = JSON.parse(readFileSync(join(ROOT, 'human-geography', 'data', 'pages.json'), 'utf8'));
  const entry = pages.tools.find(t => t.slug === 'frq-coach');
  assert.ok(entry && entry.studio === true, 'registered in pages.json on the Tool Studio');
  assert.equal(entry.topic, 'skills-frq');
  const map = { topicById: id => id === 'skills-frq' ? { id } : null };
  const ok = { slug: 'frq-coach', kind: 'simulator', topic: 'skills-frq', intro: '<p>x</p>', howItWorks: '<p>x</p>', contexts: [{ id: 'c1', topic: 'skills-frq' }] };
  assert.deepEqual(check(ok, map), []);
  assert.ok(check({ ...ok, slug: 'nope' }, map).some(e => /slug/.test(e)));
  assert.ok(check({ ...ok, topic: 'nope' }, map).some(e => /topic/.test(e)));
});
