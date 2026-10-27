/* Evidence builder: its model (psychology/assets/tools/math/evidence-builder.js) and
   its validator (scripts/lib/appsych-tool-checks/evidence-builder.mjs). OWNED BY
   THIS TOOL ONLY. Phase 0: the stub registers, the page script parses, the
   tool is registered in pages.json with its topic and tier, and the frame
   check refuses a wrong slug. Phase 2 adds the model tests and the shipped
   data passing its validator. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { runtime } from '../lib/appsych-tool-checks/_shared.mjs';
import { check } from '../lib/appsych-tool-checks/evidence-builder.mjs';
import { ROOT } from '../lib/appsych-build.mjs';

test('evidence-builder: registers, the page script parses, it is pre-registered, the frame is checked', () => {
  const { M, model } = runtime('evidence-builder');
  assert.ok(M && model, 'ApPsychMath.evidenceBuilder is registered');
  assert.doesNotThrow(() => new Function(readFileSync(join(ROOT, 'psychology', 'assets', 'tools', 'evidence-builder.js'), 'utf8')));
  const pages = JSON.parse(readFileSync(join(ROOT, 'psychology', 'data', 'pages.json'), 'utf8'));
  const entry = pages.tools.find(t => t.slug === 'evidence-builder');
  assert.ok(entry && entry.studio === true, 'registered in pages.json on the Tool Studio');
  assert.equal(entry.topic, 'research-methods');
  assert.equal(entry.premium, 'tools');
  const map = { topicById: id => id === 'research-methods' ? { id } : null };
  const ok = { slug: 'evidence-builder', kind: 'simulator', topic: 'research-methods', intro: '<p>x</p>', howItWorks: '<p>x</p>', contexts: [{ id: 'c1', topic: 'research-methods' }] };
  assert.deepEqual(check(ok, map), []);
  assert.ok(check({ ...ok, slug: 'nope' }, map).some(e => /slug/.test(e)));
});
