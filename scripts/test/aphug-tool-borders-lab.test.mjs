/* Borders lab: its model (human-geography/assets/tools/math/borders-lab.js) and its
   validator (scripts/lib/aphug-tool-checks/borders-lab.mjs). OWNED BY THIS TOOL
   ONLY (builder T4). */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { runtime } from '../lib/aphug-tool-checks/_shared.mjs';
import { check, recheck } from '../lib/aphug-tool-checks/borders-lab.mjs';
import { ROOT } from '../lib/aphug-build.mjs';

const read = p => JSON.parse(readFileSync(join(ROOT, p), 'utf8'));
const dep = read('docs/aphug-dependency-map.json');
const map = { topicById: id => dep.topics.find(t => t.id === id) };
const data = read('human-geography/data/tools/borders-lab.json');

test('borders-lab: registered, the page script parses, pages.json entry', () => {
  const { model } = runtime('borders-lab');
  assert.ok(model && !model.stub && typeof model.generate === 'function');
  assert.doesNotThrow(() => new Function(readFileSync(join(ROOT, 'human-geography/assets/tools/borders-lab.js'), 'utf8')));
  const entry = read('human-geography/data/pages.json').tools.find(t => t.slug === 'borders-lab');
  assert.equal(entry.topic, 'defining-boundaries'); assert.equal(entry.premium, 'tools');
  assert.deepEqual(read('scripts/test/fixtures/aphug-data/pages.json').tools.find(t => t.slug === 'borders-lab'), entry);
});

test('borders-lab: the shipped data passes the 300-seed sweep', () => {
  assert.deepEqual(check(data, map), []);
});

test('borders-lab: UNCLOS zones and the sea model item', () => {
  const { model, Model } = runtime('borders-lab');
  assert.equal(model.zoneAt(12).id, 'ts'); assert.equal(model.zoneAt(13).id, 'cz'); assert.equal(model.zoneAt(24).id, 'cz');
  assert.equal(model.zoneAt(200).id, 'eez'); assert.equal(model.zoneAt(201).id, 'hs');
  const m = model.seaModel();
  assert.equal(Model.check(m).length, 0);
  const g = Model.grade(m, { z1: 'eez', z2: 'cz', z3: 'ts', z4: 'hs' });
  assert.equal(g.correct, false); assert.match(g.slip, /200/);
});

test('borders-lab: the validator catches planted mistakes', () => {
  const { M, model } = runtime('borders-lab');
  const ctx = data.contexts.find(c => c.id === 'boundaries');
  const p = model.generate(M.rng(4), ctx, 'boundary');
  const bad = structuredClone(p), st = bad.steps.find(x => x.key === 'when'); st.correct = 1 - st.correct;
  const errs = []; recheck(bad, ctx, 'planted', errs);
  assert.ok(errs.some(e => /when key/.test(e)), errs.join('\n'));
  const sctx = data.contexts.find(c => c.id === 'sea');
  const s = model.generate(M.rng(5), sctx, 'sea'); s.steps.find(x => x.key === 'overlap').cell.answer = 400;
  const e2 = []; recheck(s, sctx, 'planted', e2); assert.ok(e2.some(e => /overlap/.test(e)));
});
