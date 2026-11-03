/* Graph studio: its model (macroeconomics/assets/tools/math/graph-studio.js) and its
   validator (scripts/lib/apmacro-tool-checks/graph-studio.mjs). OWNED BY THIS TOOL
   ONLY (builder T1). Phase 0: the stub registers, the page script parses,
   the tool is pre-registered in pages.json, and the frame check bites. The
   builder adds the real tests (shipped data, seeds, planted mistakes). */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { runtime } from '../lib/apmacro-tool-checks/_shared.mjs';
import { check } from '../lib/apmacro-tool-checks/graph-studio.mjs';
import { ROOT } from '../lib/apmacro-build.mjs';

test('graph-studio: registers, the page script parses, it is pre-registered, the frame is checked', () => {
  const { model } = runtime('graph-studio');
  assert.ok(model && typeof model.generate === 'function', 'ApMacroMath.graphStudio is registered');
  assert.doesNotThrow(() => new Function(readFileSync(join(ROOT, 'macroeconomics', 'assets', 'tools', 'graph-studio.js'), 'utf8')));
  const pages = JSON.parse(readFileSync(join(ROOT, 'macroeconomics', 'data', 'pages.json'), 'utf8'));
  const entry = pages.tools.find(t => t.slug === 'graph-studio');
  assert.ok(entry && entry.studio === true, 'registered in pages.json on the Tool Studio');
  assert.equal(entry.topic, 'shifts-movements');
  const map = { topicById: id => id === 'shifts-movements' ? { id } : null };
  const ok = { slug: 'graph-studio', kind: 'simulator', topic: 'shifts-movements', intro: '<p>x</p>', howItWorks: '<p>x</p>', contexts: [{ id: 'c1', topic: 'shifts-movements' }] };
  assert.deepEqual(check(ok, map), []);
  assert.ok(check({ ...ok, slug: 'nope' }, map).some(e => /slug/.test(e)));
  assert.ok(check({ ...ok, topic: 'nope' }, map).some(e => /topic/.test(e)));
});
