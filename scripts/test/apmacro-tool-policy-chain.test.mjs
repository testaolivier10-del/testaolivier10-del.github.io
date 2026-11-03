/* Policy chain: its model (macroeconomics/assets/tools/math/policy-chain.js) and its
   validator (scripts/lib/apmacro-tool-checks/policy-chain.mjs). OWNED BY THIS TOOL
   ONLY (builder T2). Phase 0: the stub registers, the page script parses,
   the tool is pre-registered in pages.json, and the frame check bites. The
   builder adds the real tests (shipped data, seeds, planted mistakes). */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { runtime } from '../lib/apmacro-tool-checks/_shared.mjs';
import { check } from '../lib/apmacro-tool-checks/policy-chain.mjs';
import { ROOT } from '../lib/apmacro-build.mjs';

test('policy-chain: registers, the page script parses, it is pre-registered, the frame is checked', () => {
  const { model } = runtime('policy-chain');
  assert.ok(model && typeof model.generate === 'function', 'ApMacroMath.policyChain is registered');
  assert.doesNotThrow(() => new Function(readFileSync(join(ROOT, 'macroeconomics', 'assets', 'tools', 'policy-chain.js'), 'utf8')));
  const pages = JSON.parse(readFileSync(join(ROOT, 'macroeconomics', 'data', 'pages.json'), 'utf8'));
  const entry = pages.tools.find(t => t.slug === 'policy-chain');
  assert.ok(entry && entry.studio === true, 'registered in pages.json on the Tool Studio');
  assert.equal(entry.topic, 'policy-short-run');
  const map = { topicById: id => id === 'policy-short-run' ? { id } : null };
  const ok = { slug: 'policy-chain', kind: 'simulator', topic: 'policy-short-run', intro: '<p>x</p>', howItWorks: '<p>x</p>', contexts: [{ id: 'c1', topic: 'policy-short-run' }] };
  assert.deepEqual(check(ok, map), []);
  assert.ok(check({ ...ok, slug: 'nope' }, map).some(e => /slug/.test(e)));
  assert.ok(check({ ...ok, topic: 'nope' }, map).some(e => /topic/.test(e)));
});
