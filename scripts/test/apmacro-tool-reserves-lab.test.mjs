/* Bank Reserves Lab: its model (macroeconomics/assets/tools/math/reserves-lab.js)
   and its validator (scripts/lib/apmacro-tool-checks/reserves-lab.mjs). OWNED BY
   THIS TOOL ONLY (builder T2). The shipped data passes; a seed gives the same
   problem twice; every effect agrees with the graphs; a graph step grades only
   the key's drawing right; planted mistakes are caught. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { runtime } from '../lib/apmacro-tool-checks/_shared.mjs';
import { check, recheck, effects } from '../lib/apmacro-tool-checks/reserves-lab.mjs';
import { ROOT } from '../lib/apmacro-build.mjs';

const MAPJ = JSON.parse(readFileSync(join(ROOT, 'docs', 'apmacro-dependency-map.json'), 'utf8'));
const map = { topicById: id => MAPJ.topics.find(t => t.id === id) || null };
const data = JSON.parse(readFileSync(join(ROOT, 'macroeconomics', 'data', 'tools', 'reserves-lab.json'), 'utf8'));
const { M, model, Grade, Graph, Calc } = runtime('reserves-lab');
const ctx = id => data.contexts.find(c => c.id === id);

test('reserves-lab: registered, the page script parses, pages.json entry', () => {
  assert.ok(model && !model.stub && typeof model.generate === 'function');
  assert.doesNotThrow(() => new Function(readFileSync(join(ROOT, 'macroeconomics', 'assets', 'tools', 'reserves-lab.js'), 'utf8')));
  const pages = JSON.parse(readFileSync(join(ROOT, 'macroeconomics', 'data', 'pages.json'), 'utf8'));
  const entry = pages.tools.find(t => t.slug === 'reserves-lab');
  assert.ok(entry && entry.studio === true && entry.premium === 'tools');
  assert.equal(entry.topic, 'monetary-policy');
  const fx = JSON.parse(readFileSync(join(ROOT, 'scripts', 'test', 'fixtures', 'apmacro-data', 'pages.json'), 'utf8')).tools.find(t => t.slug === 'reserves-lab');
  assert.deepEqual(fx, entry, 'the fixture copy matches');
});

test('reserves-lab: the shipped data passes the validator (300 problems per context and type)', () => {
  assert.deepEqual(check(data, map), []);
});

test('reserves-lab: a seed gives the same problem twice', () => {
  for (const c of data.contexts) for (const t of c.types) {
    const a = model.generate(M.rng(4242), c, t), b = model.generate(M.rng(4242), c, t);
    assert.deepEqual(a, b, `${c.id} ${t}`);
  }
});

test('reserves-lab: ample vs limited, the rules the exam scores', () => {
  // Ample: only the administered rates move the policy rate; bonds move reserve supply but not the rate.
  assert.equal(model.effect('ample', 'iorb', 1).rate, 'up');
  assert.equal(model.effect('ample', 'onrrp', -1).rate, 'down');
  const omo = model.effect('ample', 'omo', -1);
  assert.equal(omo.rate, 'same'); assert.equal(omo.shifts.reserves.RS, 1); assert.equal(omo.ad, 'none');
  assert.equal(model.effect('ample', 'rr', 1).rate, 'same');
  assert.equal(model.effect('ample', 'discount', 1).rate, 'same');
  // Limited: bonds, the discount rate and the reserve requirement move the rate; administered rates do not.
  for (const t of ['omo', 'discount', 'rr']) { const e = model.effect('limited', t, -1); assert.equal(e.rate, 'down', t); assert.equal(e.shifts.money.MS, 1, t); assert.equal(e.ad, 'right', t); }
  assert.equal(model.effect('limited', 'iorb', 1).rate, 'same');
  const errs = []; effects(model, errs); assert.deepEqual(errs, []);
});

test('reserves-lab: the shift step is a drill graph step that grades only the key drawing right', () => {
  for (const [id, seeds] of [['ample', 40], ['limited', 40]]) for (let i = 1; i <= seeds; i++) {
    const p = model.generate(M.rng(i * 31), ctx(id), 'shift'), st = p.steps.find(s => s.kind === 'graph');
    assert.equal(st.key, 'shift', 'the recorded step id stays "shift"');
    assert.equal(Graph.check(st.spec).length, 0);
    const key = Graph.keyOffsets(st.spec), c = Object.keys(key)[0];
    for (const k of model.classes(st.spec)) assert.equal(Grade.graph(st.spec, { shifts: k.shifts }).correct, JSON.stringify(k.shifts) === JSON.stringify(key));
    // Two steps the same way still counts as that curve (magnitude is never graded).
    assert.equal(Grade.graph(st.spec, { shifts: { [c]: key[c] * 2 } }).correct, true);
    assert.equal(Grade.graph(st.spec, { shifts: {} }).correct, false);
  }
});

test('reserves-lab: the money multiplier numbers come from ApMacroCalc and match by hand', () => {
  for (let i = 1; i <= 60; i++) {
    const p = model.generate(M.rng(i), ctx('multiplier'), 'multiplier'), { x, rr } = p.given;
    assert.equal(p.steps[0].cell.answer, Calc.evaluate(p.recipes.mm));
    assert.equal(p.steps[1].cell.answer, Calc.evaluate(p.recipes.max));
    assert.ok(Math.abs(p.steps[1].cell.answer - x / rr) < 1e-9);
    // The planted slips are named, never graded right.
    assert.ok(!M.diagnose(p.steps[1].cell, x).ok && /excess reserves/.test(M.diagnose(p.steps[1].cell, x).why));
    assert.ok(!M.diagnose(p.steps[0].cell, rr).ok);
  }
});

test('reserves-lab: the validator catches planted mistakes', () => {
  const bad = (mutate, c, t) => {
    const p = model.generate(M.rng(77), ctx(c), t); mutate(p);
    const errs = []; recheck(p, ctx(c), 'x', errs); return errs;
  };
  // A limited-reserves tool keyed in an ample-reserves question.
  assert.ok(bad(p => { const s = p.steps.find(x => x.key === 'tool'); s.options[s.correct] = (p.given.stance > 0 ? 'Sell bonds' : 'Buy bonds') + '.'; }, 'ample', 'tool').length);
  // The money market keyed in an ample-reserves question.
  assert.ok(bad(p => { const s = p.steps.find(x => x.key === 'graph'); s.options[s.correct] = 'The money market: the money supply shifts left.'; }, 'ample', 'tool').length);
  // A graph step keyed the wrong way.
  assert.ok(bad(p => { const s = p.steps.find(x => x.kind === 'graph'), k = s.spec.key.shifts[0]; k.dir = { up: 'down', down: 'up', left: 'right', right: 'left' }[k.dir]; }, 'ample', 'shift').length);
  // A wrong money multiplier.
  assert.ok(bad(p => { p.steps[1].cell.answer *= 0.9; }, 'multiplier', 'multiplier').length);
  // The validator's own frame bites.
  assert.ok(check({ ...data, slug: 'nope' }, map).some(e => /slug/.test(e)));
  assert.ok(check({ ...data, contexts: [{ id: 'x', topic: 'monetary-policy', types: ['tool'] }] }, map).some(e => /framework/.test(e)));
});
