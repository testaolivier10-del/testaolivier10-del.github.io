/* Externality Lab: its model (microeconomics/assets/tools/math/externality-lab.js) and its
   validator (scripts/lib/apmicro-tool-checks/externality-lab.mjs). OWNED BY THIS TOOL
   ONLY (builder T4). The shipped data passes the full sweep, a seed gives the
   same problem twice, the Explore model matches its recipes, and planted
   mistakes are caught. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { runtime } from '../lib/apmicro-tool-checks/_shared.mjs';
import { check, recheck } from '../lib/apmicro-tool-checks/externality-lab.mjs';
import { ROOT } from '../lib/apmicro-build.mjs';

const data = JSON.parse(readFileSync(join(ROOT, 'microeconomics', 'data', 'tools', 'externality-lab.json'), 'utf8'));
const TOPICS = ['externalities', 'public-goods'];
const map = { topicById: id => (TOPICS.includes(id) ? { id } : null) };

test('externality-lab: registered, page script parses, pages.json entry', () => {
  const { model } = runtime('externality-lab');
  assert.ok(model && !model.stub && typeof model.generate === 'function');
  assert.doesNotThrow(() => new Function(readFileSync(join(ROOT, 'microeconomics', 'assets', 'tools', 'externality-lab.js'), 'utf8')));
  const pages = JSON.parse(readFileSync(join(ROOT, 'microeconomics', 'data', 'pages.json'), 'utf8'));
  const entry = pages.tools.find(t => t.slug === 'externality-lab');
  assert.ok(entry && entry.studio === true && entry.topic === 'externalities' && entry.premium === 'tools');
});

test('externality-lab: the shipped data passes the full sweep', () => {
  assert.deepEqual(check(data, map), []);
});

test('externality-lab: a seed gives the same problem twice', () => {
  const { M, model } = runtime('externality-lab');
  for (const c of data.contexts) for (const t of c.types) {
    const a = model.generate(M.rng(31), c, t), b = model.generate(M.rng(31), c, t);
    assert.deepEqual(JSON.parse(JSON.stringify(a)), JSON.parse(JSON.stringify(b)));
  }
});

test('externality-lab: Explore model matches the recipes', () => {
  const { model, Calc } = runtime('externality-lab');
  const s = model.state('neg-prod', 2, 0);
  assert.equal(s.market, 5); assert.equal(s.efficient, 4); assert.equal(s.dwl, Calc.evaluate({ fn: 'dwl', args: [1, 2] }));
  assert.equal(model.state('neg-prod', 2, 2).dwl, 0);
  assert.equal(model.specB('neg-prod', 2, 2), null);
  // A tax past the external cost leaves a loss on the other side: the engine shades it on the picture itself
  // (between the market quantity 3.5 and the efficient 4).
  const over = model.specB('neg-prod', 2, 3), G = globalThis.ApMicroGraph || runtime('externality-lab').Graph;
  const xs = G.areas(over).cells.filter(c => G.regionCells(over, 'dwl').includes(c.id)).flatMap(c => c.poly.map(p => p[0]));
  assert.ok(Math.min(...xs) >= 3.5 - 1e-6 && Math.max(...xs) <= 4 + 1e-6, 'the over-correction loss lies between 3.5 and 4');
  const t = model.publicTable(model.PEOPLE, 40);
  assert.deepEqual([...t.rows.map(r => r.sum)], [72, 54, 38, 24, 12]);
  assert.equal(t.efficient, 2);
  assert.ok(Math.max(...t.alone) < t.efficient);
});

test('externality-lab: planted mistakes are caught', () => {
  const { M, model } = runtime('externality-lab');
  const plant = (id, t, f) => { const c = data.contexts.find(x => x.id === id); const p = model.generate(M.rng(8), c, t); f(p); const errs = []; recheck(p, c, 'planted', errs); return errs; };
  assert.ok(plant('mill', 'dwl', p => { p.steps.find(s => s.key === 'size').cell.answer *= 2; }).length, 'DWL without the half');
  assert.ok(plant('flu', 'fix', p => { const s = p.steps.find(x => x.key === 'shift'); s.spec.key.shifts[0].curve = 'S'; }).length, 'the wrong curve');
  assert.ok(plant('bees', 'quantity', p => { const s = p.steps.find(x => x.key === 'compare'); s.options[0] = s.options[0].replace(/more|less/, m => (m === 'more' ? 'less' : 'more')); }).length, 'market and efficient swapped');
  assert.ok(plant('lights', 'public', p => { p.steps.find(s => s.key === 'eff').cell.answer += 1; }).length, 'a wrong efficient count');
});
