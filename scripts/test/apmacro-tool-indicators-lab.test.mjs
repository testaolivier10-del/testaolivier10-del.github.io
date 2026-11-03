/* Indicators lab: its model (macroeconomics/assets/tools/math/indicators-lab.js) and its
   validator (scripts/lib/apmacro-tool-checks/indicators-lab.mjs). OWNED BY THIS TOOL
   ONLY (builder T3). Phase 0: the stub registers, the page script parses,
   the tool is pre-registered in pages.json, and the frame check bites. The
   builder adds the real tests (shipped data, seeds, planted mistakes). */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { runtime } from '../lib/apmacro-tool-checks/_shared.mjs';
import { check } from '../lib/apmacro-tool-checks/indicators-lab.mjs';
import { ROOT } from '../lib/apmacro-build.mjs';

test('indicators-lab: registers, the page script parses, it is pre-registered, the frame is checked', () => {
  const { model } = runtime('indicators-lab');
  assert.ok(model && typeof model.generate === 'function', 'ApMacroMath.indicatorsLab is registered');
  assert.doesNotThrow(() => new Function(readFileSync(join(ROOT, 'macroeconomics', 'assets', 'tools', 'indicators-lab.js'), 'utf8')));
  const pages = JSON.parse(readFileSync(join(ROOT, 'macroeconomics', 'data', 'pages.json'), 'utf8'));
  const entry = pages.tools.find(t => t.slug === 'indicators-lab');
  assert.ok(entry && entry.studio === true, 'registered in pages.json on the Tool Studio');
  assert.equal(entry.topic, 'price-indices-inflation');
  const map = { topicById: id => id === 'price-indices-inflation' ? { id } : null };
  const ok = { slug: 'indicators-lab', kind: 'skill', topic: 'price-indices-inflation', intro: '<p>x</p>', howItWorks: '<p>x</p>', contexts: [{ id: 'c1', topic: 'price-indices-inflation' }] };
  assert.deepEqual(check(ok, map), []);
  assert.ok(check({ ...ok, slug: 'nope' }, map).some(e => /slug/.test(e)));
  assert.ok(check({ ...ok, topic: 'nope' }, map).some(e => /topic/.test(e)));
});
