/* Conditioning lab: its model (psychology/assets/tools/math/conditioning-lab.js) and
   its validator (scripts/lib/appsych-tool-checks/conditioning-lab.mjs). OWNED BY
   THIS TOOL ONLY. Phase 0: the stub registers, the page script parses, the
   tool is registered in pages.json with its topic and tier, and the frame
   check refuses a wrong slug. Phase 2 adds the model tests and the shipped
   data passing its validator. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { runtime } from '../lib/appsych-tool-checks/_shared.mjs';
import { check } from '../lib/appsych-tool-checks/conditioning-lab.mjs';
import { ROOT } from '../lib/appsych-build.mjs';

test('conditioning-lab: registers, the page script parses, it is pre-registered, the frame is checked', () => {
  const { M, model } = runtime('conditioning-lab');
  assert.ok(M && model, 'ApPsychMath.conditioningLab is registered');
  assert.doesNotThrow(() => new Function(readFileSync(join(ROOT, 'psychology', 'assets', 'tools', 'conditioning-lab.js'), 'utf8')));
  const pages = JSON.parse(readFileSync(join(ROOT, 'psychology', 'data', 'pages.json'), 'utf8'));
  const entry = pages.tools.find(t => t.slug === 'conditioning-lab');
  assert.ok(entry && entry.studio === true, 'registered in pages.json on the Tool Studio');
  assert.equal(entry.topic, 'classical-conditioning');
  assert.equal(entry.premium, 'tools');
  const map = { topicById: id => id === 'classical-conditioning' ? { id } : null };
  const ok = { slug: 'conditioning-lab', kind: 'simulator', topic: 'classical-conditioning', intro: '<p>x</p>', howItWorks: '<p>x</p>', contexts: [{ id: 'c1', topic: 'classical-conditioning' }] };
  assert.deepEqual(check(ok, map), []);
  assert.ok(check({ ...ok, slug: 'nope' }, map).some(e => /slug/.test(e)));
});
