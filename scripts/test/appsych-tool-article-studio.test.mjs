/* Article analysis studio: its model (psychology/assets/tools/math/article-studio.js) and
   its validator (scripts/lib/appsych-tool-checks/article-studio.mjs). OWNED BY
   THIS TOOL ONLY. Phase 0: the stub registers, the page script parses, the
   tool is registered in pages.json with its topic and tier, and the frame
   check refuses a wrong slug. Phase 2 adds the model tests and the shipped
   data passing its validator. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { runtime } from '../lib/appsych-tool-checks/_shared.mjs';
import { check } from '../lib/appsych-tool-checks/article-studio.mjs';
import { ROOT } from '../lib/appsych-build.mjs';

test('article-studio: registers, the page script parses, it is pre-registered, the frame is checked', () => {
  const { M, model } = runtime('article-studio');
  assert.ok(M && model, 'ApPsychMath.articleStudio is registered');
  assert.doesNotThrow(() => new Function(readFileSync(join(ROOT, 'psychology', 'assets', 'tools', 'article-studio.js'), 'utf8')));
  const pages = JSON.parse(readFileSync(join(ROOT, 'psychology', 'data', 'pages.json'), 'utf8'));
  const entry = pages.tools.find(t => t.slug === 'article-studio');
  assert.ok(entry && entry.studio === true, 'registered in pages.json on the Tool Studio');
  assert.equal(entry.topic, 'research-methods');
  assert.equal(entry.premium, undefined);
  const map = { topicById: id => id === 'research-methods' ? { id } : null };
  const ok = { slug: 'article-studio', kind: 'simulator', topic: 'research-methods', intro: '<p>x</p>', howItWorks: '<p>x</p>', contexts: [{ id: 'c1', topic: 'research-methods' }] };
  assert.deepEqual(check(ok, map), []);
  assert.ok(check({ ...ok, slug: 'nope' }, map).some(e => /slug/.test(e)));
});
