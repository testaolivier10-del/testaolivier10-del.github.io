/* FRQ coach: its model (human-geography/assets/tools/math/frq-coach.js) and its
   validator (scripts/lib/aphug-tool-checks/frq-coach.mjs). OWNED BY THIS TOOL
   ONLY (builder T2). The shipped data pass (300 seeds per context and type,
   every key recomputed); the verb demands are the exam's words; drills are
   reproducible by seed; the writing box's flags tell a sample from a weak
   answer; planted mistakes are caught. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { runtime } from '../lib/aphug-tool-checks/_shared.mjs';
import { check } from '../lib/aphug-tool-checks/frq-coach.mjs';
import { VERBS } from '../lib/aphug-exams.mjs';
import { ROOT } from '../lib/aphug-build.mjs';

const data = JSON.parse(readFileSync(join(ROOT, 'human-geography', 'data', 'tools', 'frq-coach.json'), 'utf8'));
const topics = new Set(['skills-frq', ...data.contexts.map(c => c.topic)]);
const map = { topicById: id => topics.has(id) ? { id } : null };
const { M, Grade, model } = runtime('frq-coach');
const copy = x => JSON.parse(JSON.stringify(x));

test('frq-coach: registered, the page script parses, Premium, the shipped data pass', () => {
  assert.ok(model && !model.stub && typeof model.generate === 'function');
  assert.doesNotThrow(() => new Function(readFileSync(join(ROOT, 'human-geography', 'assets', 'tools', 'frq-coach.js'), 'utf8')));
  const pages = JSON.parse(readFileSync(join(ROOT, 'human-geography', 'data', 'pages.json'), 'utf8'));
  const entry = pages.tools.find(t => t.slug === 'frq-coach');
  assert.equal(entry.topic, 'skills-frq');
  assert.equal(entry.premium, 'tools');
  assert.deepEqual(check(data, map), []);
});

test('frq-coach: the verbs are the exam\'s, word for word', () => {
  for (const [k, v] of Object.entries(VERBS)) { assert.equal(model.VERBS[k].demand, v.demand); assert.equal(model.VERBS[k].name, v.name); }
});

test('frq-coach: a seed gives the same drill; keys are the sample and the verb', () => {
  for (const t of model.TYPES) {
    const a = copy(model.generate(M.rng(99), data.contexts[2], t)), b = copy(model.generate(M.rng(99), data.contexts[2], t));
    assert.deepEqual(a, b, t);
  }
  const p = model.generate(M.rng(3), data.contexts[0], 'earns');
  assert.equal(p.steps.length, data.contexts[0].parts.length);
  p.steps.forEach((s, i) => assert.equal(s.options[s.correct], data.contexts[0].parts[i].sample));
});

test('frq-coach: the writing box flags a weak explain and passes the sample', () => {
  for (const c of data.contexts) for (const p of c.parts) {
    const spec = copy(model.flagsFor(p));
    if (p.verb === 'explain') {
      assert.ok(Grade.flags(spec, p.sample).find(f => f.rule === 'mechanism').ok, `${c.id} ${p.label} sample`);
      if (p.slip === 'no-link') assert.ok(!Grade.flags(spec, p.weak).find(f => f.rule === 'mechanism').ok, `${c.id} ${p.label} weak`);
    }
    if (p.verb === 'compare' && p.slip === 'one-side') assert.ok(!Grade.flags(spec, p.weak).find(f => f.rule === 'both').ok);
  }
});

test('frq-coach: planted mistakes are caught', () => {
  const bad = copy(data);
  const t = bad.contexts.find(c => c.id === 'transition');
  t.parts[1].prompt = 'Describe why the crude death rate falls.';                 // verb not in the prompt
  t.parts[2].weak = 'Both measure births, whereas they count differently.';       // a "one-side" answer that speaks of both
  t.parts[3].sample = 'The model leaves out migration, so it predicts poorly.';   // degree not first
  bad.contexts[0].parts[2].chain = undefined;                                     // explain without its chain
  bad.contexts[1].parts[0].label = 'B';                                           // labels out of order
  const errs = check(bad, map);
  assert.ok(errs.some(e => /opens with its verb/.test(e)), 'prompt verb');
  assert.ok(errs.some(e => /one-side weak answer/.test(e)), 'one-side weak');
  assert.ok(errs.some(e => /opens with the degree/.test(e)), 'degree first');
  assert.ok(errs.some(e => /has its chain/.test(e)), 'chain');
  assert.ok(errs.some(e => /labels run/.test(e)), 'labels');
  const em = copy(data); em.contexts[0].scenario += ' — x';
  assert.ok(check(em, map).some(e => /em dash/.test(e)));
  // A wrong key in a generated drill is caught by the sweep's recheck.
  const orig = model.generate;
  model.generate = (r, c, ty) => { const p = orig(r, c, ty); const s = p.steps.find(x => x.key.startsWith('earns')); if (s) s.correct = 1; return p; };
  try { assert.ok(check(data, map).some(e => /keyed answer is not the sample/.test(e))); } finally { model.generate = orig; }
});
