/* City lab: its model (human-geography/assets/tools/math/city-lab.js) and its
   validator (scripts/lib/aphug-tool-checks/city-lab.mjs). OWNED BY THIS TOOL
   ONLY (builder T4). */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { runtime } from '../lib/aphug-tool-checks/_shared.mjs';
import { check, recheck } from '../lib/aphug-tool-checks/city-lab.mjs';
import { ROOT } from '../lib/aphug-build.mjs';

const read = p => JSON.parse(readFileSync(join(ROOT, p), 'utf8'));
const dep = read('docs/aphug-dependency-map.json');
const map = { topicById: id => dep.topics.find(t => t.id === id) };
const data = read('human-geography/data/tools/city-lab.json');

test('city-lab: registered, the page script parses, pages.json entry', () => {
  const { model } = runtime('city-lab');
  assert.ok(model && !model.stub && typeof model.generate === 'function');
  assert.doesNotThrow(() => new Function(readFileSync(join(ROOT, 'human-geography/assets/tools/city-lab.js'), 'utf8')));
  const entry = read('human-geography/data/pages.json').tools.find(t => t.slug === 'city-lab');
  assert.equal(entry.topic, 'von-thunen'); assert.equal(entry.premium, 'tools');
  assert.deepEqual(read('scripts/test/fixtures/aphug-data/pages.json').tools.find(t => t.slug === 'city-lab'), entry);
});

test('city-lab: the shipped data passes the 300-seed sweep', () => {
  assert.deepEqual(check(data, map), []);
});

test('city-lab: bid rent gives von Thunen\'s rings and responds to change', () => {
  const { model, Model } = runtime('city-lab');
  const rings = model.rings(model.FARM, {});
  assert.equal(rings.map(b => b.id).join(), 'dairy,forest,grain,ranch');
  assert.ok(Math.abs(rings[0].to - 4) < 0.06 && Math.abs(rings[1].to - 12) < 0.06 && Math.abs(rings[2].to - 32) < 0.06);
  assert.ok(model.rings(model.FARM, { fridge: true })[0].to > rings[0].to);
  assert.equal(Model.check(model.vtModel()).length, 0);
  assert.equal(Model.check(model.burgessModel()).length, 0);
  assert.equal(Model.grade(model.vtModel(), { r1: 'dairy', r2: 'grain', r3: 'forest', r4: 'ranch' }).slip.includes('forest ring comes second'), true);
});

test('city-lab: the validator catches planted mistakes', () => {
  const { M, model } = runtime('city-lab');
  const ctx = data.contexts.find(c => c.id === 'farm');
  const p = model.generate(M.rng(3), ctx, 'bidrent'); p.steps[0].cell.answer += 5;
  const errs = []; recheck(p, ctx, 'planted', errs); assert.ok(errs.some(e => /bidU/.test(e)), errs.join('\n'));
  const pc = data.contexts.find(c => c.id === 'places');
  const q = model.generate(M.rng(8), pc, 'ranksize'); q.steps[0].cell.answer *= 2;
  const e2 = []; recheck(q, pc, 'planted', e2); assert.ok(e2.some(e => /expected/.test(e)));
  const cc = data.contexts.find(c => c.id === 'city');
  const m = model.generate(M.rng(2), cc, 'models'); m.text = m.text.replace('Invented description', 'Invented description. McGee says');
  const e3 = []; recheck(m, cc, 'planted', e3); assert.ok(e3.some(e => /unnamed/.test(e)));
});
