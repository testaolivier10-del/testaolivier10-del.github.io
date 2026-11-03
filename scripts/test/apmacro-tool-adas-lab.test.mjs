/* AD-AS lab: its model (macroeconomics/assets/tools/math/adas-lab.js) and its
   validator (scripts/lib/apmacro-tool-checks/adas-lab.mjs). OWNED BY THIS TOOL
   ONLY (builder T4). Phase 0: the stub registers, the page script parses,
   the tool is pre-registered in pages.json, and the frame check bites. The
   builder adds the real tests (shipped data, seeds, planted mistakes). */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { runtime } from '../lib/apmacro-tool-checks/_shared.mjs';
import { check } from '../lib/apmacro-tool-checks/adas-lab.mjs';
import { ROOT } from '../lib/apmacro-build.mjs';

test('adas-lab: registers, the page script parses, it is pre-registered, the frame is checked', () => {
  const { model } = runtime('adas-lab');
  assert.ok(model && typeof model.generate === 'function', 'ApMacroMath.adasLab is registered');
  assert.doesNotThrow(() => new Function(readFileSync(join(ROOT, 'macroeconomics', 'assets', 'tools', 'adas-lab.js'), 'utf8')));
  const pages = JSON.parse(readFileSync(join(ROOT, 'macroeconomics', 'data', 'pages.json'), 'utf8'));
  const entry = pages.tools.find(t => t.slug === 'adas-lab');
  assert.ok(entry && entry.studio === true, 'registered in pages.json on the Tool Studio');
  assert.equal(entry.topic, 'long-run-self-adjustment');
  const map = { topicById: id => id === 'long-run-self-adjustment' ? { id } : null };
  const ok = { slug: 'adas-lab', kind: 'simulator', topic: 'long-run-self-adjustment', intro: '<p>x</p>', howItWorks: '<p>x</p>', contexts: [{ id: 'c1', topic: 'long-run-self-adjustment' }] };
  assert.deepEqual(check(ok, map), []);
  assert.ok(check({ ...ok, slug: 'nope' }, map).some(e => /slug/.test(e)));
  assert.ok(check({ ...ok, topic: 'nope' }, map).some(e => /topic/.test(e)));
});
