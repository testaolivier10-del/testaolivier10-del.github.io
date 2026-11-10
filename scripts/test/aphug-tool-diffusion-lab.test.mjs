/* Diffusion lab: its model (human-geography/assets/tools/math/diffusion-lab.js) and its
   validator (scripts/lib/aphug-tool-checks/diffusion-lab.mjs). OWNED BY THIS TOOL
   ONLY (builder T4). The shipped data passes the full sweep; each spread reads
   as its kind; the validator catches planted mistakes. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { runtime } from '../lib/aphug-tool-checks/_shared.mjs';
import { check, recheck, classify } from '../lib/aphug-tool-checks/diffusion-lab.mjs';
import { ROOT } from '../lib/aphug-build.mjs';

const read = p => JSON.parse(readFileSync(join(ROOT, p), 'utf8'));
const dep = read('docs/aphug-dependency-map.json');
const map = { topicById: id => dep.topics.find(t => t.id === id) };
const data = read('human-geography/data/tools/diffusion-lab.json');

test('diffusion-lab: registered, the page script parses, pages.json entry', () => {
  const { model } = runtime('diffusion-lab');
  assert.ok(model && !model.stub && typeof model.generate === 'function');
  assert.doesNotThrow(() => new Function(readFileSync(join(ROOT, 'human-geography/assets/tools/diffusion-lab.js'), 'utf8')));
  const entry = read('human-geography/data/pages.json').tools.find(t => t.slug === 'diffusion-lab');
  assert.equal(entry.topic, 'diffusion-types'); assert.equal(entry.studio, true); assert.equal(entry.premium, 'tools');
  const fx = read('scripts/test/fixtures/aphug-data/pages.json').tools.find(t => t.slug === 'diffusion-lab');
  assert.deepEqual(fx, entry);
});

test('diffusion-lab: the shipped data passes the 300-seed sweep', () => {
  assert.deepEqual(check(data, map), []);
});

test('diffusion-lab: every spread reads as its kind from the picture alone', () => {
  const { model } = runtime('diffusion-lab');
  assert.equal(classify(model.spread('hierarchical', 'cap'), model), 'hierarchical');
  assert.equal(classify(model.spread('contagious', 'v13'), model), 'contagious');
  assert.equal(classify(model.spread('stimulus', 'v13'), model), 'stimulus');
  assert.equal(classify(model.spread('relocation', 'v9', ['n2', 'n4']), model), 'relocation');
  // Hierarchical: a far large city before a village next to the hearth.
  const h = model.spread('hierarchical', 'cap');
  assert.ok(h.steps.n1 < h.steps.v11 && model.dist('cap', 'v11') < model.dist('cap', 'n1'));
  // Contagious: only the hearth at Step 1.
  const c = model.spread('contagious', 'v13');
  assert.deepEqual(Object.keys(c.steps).filter(k => c.steps[k] === 1), ['v13']);
});

test('diffusion-lab: the validator catches planted mistakes', () => {
  const { M, model } = runtime('diffusion-lab');
  const ctx = data.contexts.find(c => c.id === 'diffusion');
  let p;
  for (let s = 1; s < 200; s++) { p = model.generate(M.rng(s), ctx, 'diffusion'); if (p.given.kind === 'hierarchical') break; }
  const errs = [];
  const bad = structuredClone(p); const st = bad.steps.find(x => x.key === 'type'); st.correct = st.options.indexOf('Contagious diffusion');
  recheck(bad, ctx, 'planted', errs);
  assert.ok(errs.some(e => /type key/.test(e)), errs.join('\n'));
  const e2 = []; const b2 = structuredClone(p); b2.text = b2.text.replace('Invented case', 'A case'); recheck(b2, ctx, 'planted', e2);
  assert.ok(e2.some(e => /invented/.test(e)));
  const rctx = data.contexts.find(c => c.id === 'ravenstein');
  const r = model.generate(M.rng(9), rctx, 'ravenstein'); const e3 = []; r.steps[0].cell.answer += 1; recheck(r, rctx, 'planted', e3);
  assert.ok(e3.length > 0);
});
