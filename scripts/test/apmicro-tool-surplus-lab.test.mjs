/* Surplus and Policy Lab: its model (microeconomics/assets/tools/math/surplus-lab.js) and its
   validator (scripts/lib/apmicro-tool-checks/surplus-lab.mjs). OWNED BY THIS TOOL
   ONLY (builder T3). Phase 0: the stub registers, the page script parses,
   the tool is pre-registered in pages.json, and the frame check bites. The
   builder adds the real tests (shipped data, seeds, planted mistakes). */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { runtime } from '../lib/apmicro-tool-checks/_shared.mjs';
import { check } from '../lib/apmicro-tool-checks/surplus-lab.mjs';
import { ROOT } from '../lib/apmicro-build.mjs';

test('surplus-lab: registers, the page script parses, it is pre-registered, the frame is checked', () => {
  const { model } = runtime('surplus-lab');
  assert.ok(model && typeof model.generate === 'function', 'ApMicroMath.surplusLab is registered');
  assert.doesNotThrow(() => new Function(readFileSync(join(ROOT, 'microeconomics', 'assets', 'tools', 'surplus-lab.js'), 'utf8')));
  const pages = JSON.parse(readFileSync(join(ROOT, 'microeconomics', 'data', 'pages.json'), 'utf8'));
  const entry = pages.tools.find(t => t.slug === 'surplus-lab');
  assert.ok(entry && entry.studio === true, 'registered in pages.json on the Tool Studio');
  assert.equal(entry.topic, 'government-intervention');
  const map = { topicById: id => id === 'government-intervention' ? { id } : null };
  const ok = { slug: 'surplus-lab', kind: 'simulator', topic: 'government-intervention', intro: '<p>x</p>', howItWorks: '<p>x</p>', contexts: [{ id: 'c1', topic: 'government-intervention' }] };
  assert.deepEqual(check(ok, map), []);
  assert.ok(check({ ...ok, slug: 'nope' }, map).some(e => /slug/.test(e)));
  assert.ok(check({ ...ok, topic: 'nope' }, map).some(e => /topic/.test(e)));
});
