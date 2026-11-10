/* Elasticity Lab: its model (microeconomics/assets/tools/math/elasticity-lab.js) and its
   validator (scripts/lib/apmicro-tool-checks/elasticity-lab.mjs). OWNED BY THIS TOOL
   ONLY (builder T3). Phase 0: the stub registers, the page script parses,
   the tool is pre-registered in pages.json, and the frame check bites. The
   builder adds the real tests (shipped data, seeds, planted mistakes). */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { runtime } from '../lib/apmicro-tool-checks/_shared.mjs';
import { check } from '../lib/apmicro-tool-checks/elasticity-lab.mjs';
import { ROOT } from '../lib/apmicro-build.mjs';

test('elasticity-lab: registers, the page script parses, it is pre-registered, the frame is checked', () => {
  const { model } = runtime('elasticity-lab');
  assert.ok(model && typeof model.generate === 'function', 'ApMicroMath.elasticityLab is registered');
  assert.doesNotThrow(() => new Function(readFileSync(join(ROOT, 'microeconomics', 'assets', 'tools', 'elasticity-lab.js'), 'utf8')));
  const pages = JSON.parse(readFileSync(join(ROOT, 'microeconomics', 'data', 'pages.json'), 'utf8'));
  const entry = pages.tools.find(t => t.slug === 'elasticity-lab');
  assert.ok(entry && entry.studio === true, 'registered in pages.json on the Tool Studio');
  assert.equal(entry.topic, 'price-elasticity-demand');
  const map = { topicById: id => id === 'price-elasticity-demand' ? { id } : null };
  const ok = { slug: 'elasticity-lab', kind: 'simulator', topic: 'price-elasticity-demand', intro: '<p>x</p>', howItWorks: '<p>x</p>', contexts: [{ id: 'c1', topic: 'price-elasticity-demand' }] };
  assert.deepEqual(check(ok, map), []);
  assert.ok(check({ ...ok, slug: 'nope' }, map).some(e => /slug/.test(e)));
  assert.ok(check({ ...ok, topic: 'nope' }, map).some(e => /topic/.test(e)));
});
