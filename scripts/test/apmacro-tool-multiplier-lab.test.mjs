/* Multiplier lab: its model (macroeconomics/assets/tools/math/multiplier-lab.js) and its
   validator (scripts/lib/apmacro-tool-checks/multiplier-lab.mjs). OWNED BY THIS TOOL
   ONLY (builder T3). The shipped data passes; a seed gives the same problem
   twice; every model value matches its ApMacroCalc recipe; planted mistakes
   (a multiplied gap, a positive tax multiplier, a missing limited-reserves
   label, a wrong topic) are caught. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { runtime } from '../lib/apmacro-tool-checks/_shared.mjs';
import { check, recheckProblem, TYPES } from '../lib/apmacro-tool-checks/multiplier-lab.mjs';
import { ROOT } from '../lib/apmacro-build.mjs';

const read = p => JSON.parse(readFileSync(join(ROOT, p), 'utf8'));
const dep = read('docs/apmacro-dependency-map.json');
const map = { topicById: id => dep.topics.find(t => t.id === id) || null };
const data = read('macroeconomics/data/tools/multiplier-lab.json');
const { M, Calc, model } = runtime('multiplier-lab');
const ctx = id => data.contexts.find(c => c.id === id);
const gen = (type, seed) => model.generate(M.rng(seed), ctx(type === 'gap' ? 'gap' : type === 'money' ? 'money' : 'spending'), type);
const clone = x => JSON.parse(JSON.stringify(x));

test('multiplier-lab: registered, page parses, pages.json entry, shipped data passes', () => {
  assert.ok(model && !model.stub && typeof model.generate === 'function');
  assert.doesNotThrow(() => new Function(readFileSync(join(ROOT, 'macroeconomics', 'assets', 'tools', 'multiplier-lab.js'), 'utf8')));
  const entry = read('macroeconomics/data/pages.json').tools.find(t => t.slug === 'multiplier-lab');
  assert.ok(entry && entry.studio === true && entry.premium === 'tools');
  assert.equal(entry.topic, 'multipliers');
  assert.deepEqual(check(data, map), []);
});

test('multiplier-lab: a seed gives the same problem twice, every type', () => {
  for (const t of TYPES) for (const s of [1, 99, 4242]) assert.deepEqual(gen(t, s), gen(t, s));
  assert.notDeepEqual(gen('gap', 1), gen('gap', 2));
});

test('multiplier-lab: model values match their ApMacroCalc recipes', () => {
  for (const mpc of model.MPCS) {
    const R = model.ripple('G', mpc, 40);
    assert.equal(R.total, Calc.evaluate({ fn: 'totalChange', args: [40, { fn: 'spendingMultiplier', args: [mpc] }] }));
    assert.equal(model.ripple('T', mpc, 40).total, Calc.evaluate({ fn: 'totalChange', args: [40, { fn: 'taxMultiplier', args: [mpc] }] }));
    const g = model.gap('recessionary', 100, mpc, 'G', 0);
    assert.equal(g.need, Calc.evaluate({ fn: 'gapChange', args: [100, { fn: 'spendingMultiplier', args: [mpc] }] }));
  }
  for (const rr of model.RRS) assert.equal(model.money('buyBank', rr, 500).dm, Calc.evaluate({ fn: 'maxMoneyChange', args: [500, rr] }));
  const p = gen('gap', 77), size = p.steps.find(s => s.key === 'size');
  assert.equal(size.cell.answer, Math.abs(Calc.evaluate({ fn: 'gapChange', args: [p.values.size, p.values.mult] })));
});

test('multiplier-lab: planted mistakes are caught', () => {
  let p = clone(gen('gap', 5)); const s = p.steps.find(x => x.key === 'size');
  s.cell.answer = s.cell.answer * p.steps.find(x => x.key === 'm').cell.answer ** 2;   // the multiplied gap
  assert.ok(recheckProblem(p, ctx('gap')).some(e => /gap divided/.test(e)));
  p = clone(gen('gap', 5)); p.steps.find(x => x.key === 'size').cell.mistakes = [];
  assert.ok(recheckProblem(p, ctx('gap')).some(e => /multiply-the-gap/.test(e)));
  p = clone(gen('multiplier', 8)); p.steps.find(x => x.key === 'kt').cell.answer *= -1;
  assert.ok(recheckProblem(p, ctx('spending')).some(e => /negative/.test(e)));
  p = clone(gen('money', 3)); p.text = p.text.replace('limited-reserves model', 'model');
  assert.ok(recheckProblem(p, ctx('money')).some(e => /limited-reserves/.test(e)));
  p = clone(gen('money', 3)); p.steps.find(x => x.key === 'dm').cell.answer += 100;
  assert.ok(recheckProblem(p, ctx('money')).some(e => /money supply/.test(e)));
  assert.ok(recheckProblem(gen('money', 3), ctx('spending')).some(e => /topic/.test(e)));
  assert.ok(check({ ...data, contexts: [{ id: 'x', topic: 'multipliers', types: ['money'] }] }, map).some(e => /belongs to topic/.test(e)));
  assert.ok(check({ ...data, slug: 'nope' }, map).some(e => /slug/.test(e)));
});
