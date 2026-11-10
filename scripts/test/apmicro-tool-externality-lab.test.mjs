/* Externality Lab: its model (microeconomics/assets/tools/math/externality-lab.js) and its
   validator (scripts/lib/apmicro-tool-checks/externality-lab.mjs). OWNED BY THIS TOOL
   ONLY (builder T4). Phase 0: the stub registers, the page script parses,
   the tool is pre-registered in pages.json, and the frame check bites. The
   builder adds the real tests (shipped data, seeds, planted mistakes). */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { runtime } from '../lib/apmicro-tool-checks/_shared.mjs';
import { check } from '../lib/apmicro-tool-checks/externality-lab.mjs';
import { ROOT } from '../lib/apmicro-build.mjs';

test('externality-lab: registers, the page script parses, it is pre-registered, the frame is checked', () => {
  const { model } = runtime('externality-lab');
  assert.ok(model && typeof model.generate === 'function', 'ApMicroMath.externalityLab is registered');
  assert.doesNotThrow(() => new Function(readFileSync(join(ROOT, 'microeconomics', 'assets', 'tools', 'externality-lab.js'), 'utf8')));
  const pages = JSON.parse(readFileSync(join(ROOT, 'microeconomics', 'data', 'pages.json'), 'utf8'));
  const entry = pages.tools.find(t => t.slug === 'externality-lab');
  assert.ok(entry && entry.studio === true, 'registered in pages.json on the Tool Studio');
  assert.equal(entry.topic, 'externalities');
  const map = { topicById: id => id === 'externalities' ? { id } : null };
  const ok = { slug: 'externality-lab', kind: 'simulator', topic: 'externalities', intro: '<p>x</p>', howItWorks: '<p>x</p>', contexts: [{ id: 'c1', topic: 'externalities' }] };
  assert.deepEqual(check(ok, map), []);
  assert.ok(check({ ...ok, slug: 'nope' }, map).some(e => /slug/.test(e)));
  assert.ok(check({ ...ok, topic: 'nope' }, map).some(e => /topic/.test(e)));
});
