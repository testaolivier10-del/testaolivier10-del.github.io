/* Reserves lab: its model (macroeconomics/assets/tools/math/reserves-lab.js) and its
   validator (scripts/lib/apmacro-tool-checks/reserves-lab.mjs). OWNED BY THIS TOOL
   ONLY (builder T2). Phase 0: the stub registers, the page script parses,
   the tool is pre-registered in pages.json, and the frame check bites. The
   builder adds the real tests (shipped data, seeds, planted mistakes). */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { runtime } from '../lib/apmacro-tool-checks/_shared.mjs';
import { check } from '../lib/apmacro-tool-checks/reserves-lab.mjs';
import { ROOT } from '../lib/apmacro-build.mjs';

test('reserves-lab: registers, the page script parses, it is pre-registered, the frame is checked', () => {
  const { model } = runtime('reserves-lab');
  assert.ok(model && typeof model.generate === 'function', 'ApMacroMath.reservesLab is registered');
  assert.doesNotThrow(() => new Function(readFileSync(join(ROOT, 'macroeconomics', 'assets', 'tools', 'reserves-lab.js'), 'utf8')));
  const pages = JSON.parse(readFileSync(join(ROOT, 'macroeconomics', 'data', 'pages.json'), 'utf8'));
  const entry = pages.tools.find(t => t.slug === 'reserves-lab');
  assert.ok(entry && entry.studio === true, 'registered in pages.json on the Tool Studio');
  assert.equal(entry.topic, 'monetary-policy');
  const map = { topicById: id => id === 'monetary-policy' ? { id } : null };
  const ok = { slug: 'reserves-lab', kind: 'simulator', topic: 'monetary-policy', intro: '<p>x</p>', howItWorks: '<p>x</p>', contexts: [{ id: 'c1', topic: 'monetary-policy' }] };
  assert.deepEqual(check(ok, map), []);
  assert.ok(check({ ...ok, slug: 'nope' }, map).some(e => /slug/.test(e)));
  assert.ok(check({ ...ok, topic: 'nope' }, map).some(e => /topic/.test(e)));
});
