/* Brain map: its model (psychology/assets/tools/math/brain-map.js) and
   its validator (scripts/lib/appsych-tool-checks/brain-map.mjs). OWNED BY
   THIS TOOL ONLY. Phase 0: the stub registers, the page script parses, the
   tool is registered in pages.json with its topic and tier, and the frame
   check refuses a wrong slug. Phase 2 adds the model tests and the shipped
   data passing its validator. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { runtime } from '../lib/appsych-tool-checks/_shared.mjs';
import { check } from '../lib/appsych-tool-checks/brain-map.mjs';
import { ROOT } from '../lib/appsych-build.mjs';

test('brain-map: registers, the page script parses, it is pre-registered, the frame is checked', () => {
  const { M, model } = runtime('brain-map');
  assert.ok(M && model, 'ApPsychMath.brainMap is registered');
  assert.doesNotThrow(() => new Function(readFileSync(join(ROOT, 'psychology', 'assets', 'tools', 'brain-map.js'), 'utf8')));
  const pages = JSON.parse(readFileSync(join(ROOT, 'psychology', 'data', 'pages.json'), 'utf8'));
  const entry = pages.tools.find(t => t.slug === 'brain-map');
  assert.ok(entry && entry.studio === true, 'registered in pages.json on the Tool Studio');
  assert.equal(entry.topic, 'brain');
  assert.equal(entry.premium, undefined);
  const map = { topicById: id => id === 'brain' ? { id } : null };
  const ok = { slug: 'brain-map', kind: 'simulator', topic: 'brain', intro: '<p>x</p>', howItWorks: '<p>x</p>', contexts: [{ id: 'c1', topic: 'brain' }] };
  assert.deepEqual(check(ok, map), []);
  assert.ok(check({ ...ok, slug: 'nope' }, map).some(e => /slug/.test(e)));
});
