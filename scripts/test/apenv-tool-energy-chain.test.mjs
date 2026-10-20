/* energy-chain: its model (environmental-science/assets/tools/math/energy-chain.js) and its
   validator (scripts/lib/apenv-tool-checks/energy-chain.mjs). OWNED BY THIS TOOL
   ONLY (builder T3). The frame; the shipped data passing (300 problems per
   context and type, every key recomputed with ApEnvCalc); the same seed
   giving the same problem; planted mistakes caught; and the model's science
   (MODEL_TESTS below). */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { runtime } from '../lib/apenv-tool-checks/_shared.mjs';
import { check, recheck, TYPES } from '../lib/apenv-tool-checks/energy-chain.mjs';
import { loadMap, ROOT } from '../lib/apenv-build.mjs';

const { M, Calc, model } = runtime('energy-chain');
const data = JSON.parse(readFileSync(join(ROOT, 'environmental-science', 'data', 'tools', 'energy-chain.json'), 'utf8'));
const ctxOf = t => data.contexts.find(c => c.types.includes(t));

test('energy-chain: the model registers ApEnvMath.energyChain, the page script parses, and the validator checks the frame', () => {
  assert.ok(model && typeof model.generate === 'function' && !model.stub);
  assert.doesNotThrow(() => new Function(readFileSync(join(ROOT, 'environmental-science', 'assets', 'tools', 'energy-chain.js'), 'utf8')));
  const map = loadMap();
  assert.ok(check({ ...data, topic: 'nope' }, map).some(e => /topic/.test(e)));
  assert.ok(check({ ...data, slug: 'other' }, map).some(e => /slug/.test(e)));
  assert.ok(check({ ...data, contexts: [{ id: 'x', topic: data.topic, types: ['nope'] }] }, map).some(e => /types/.test(e)));
  const pages = JSON.parse(readFileSync(join(ROOT, 'environmental-science', 'data', 'pages.json'), 'utf8'));
  assert.equal(pages.tools.find(t => t.slug === 'energy-chain').topic, 'fossil-fuels');
});

test('energy-chain: the shipped data passes (300 problems per context and type, every key rechecked)', () => {
  assert.deepEqual(check(data, loadMap()), []);
});

test('energy-chain: every type is served by a context, and the same seed gives the same problem', () => {
  for (const t of TYPES) {
    const c = ctxOf(t);
    assert.ok(c, `no context serves ${t}`);
    const a = model.generate(M.rng(31337), c, t), b = model.generate(M.rng(31337), c, t);
    assert.equal(JSON.stringify(a), JSON.stringify(b), t);
    assert.equal(a.type, t);
  }
});

test('energy-chain: planted mistakes are caught', () => {
  for (const t of TYPES) {
    const c = ctxOf(t), p = model.generate(M.rng(77), c, t), errs = [];
    const s = p.steps.find(x => x.kind === 'unit') || p.steps.find(x => x.kind === 'num') || p.steps.find(x => x.kind === 'choice');
    if (s.kind === 'unit') s.cell.numeric.answer *= 1.5;
    else if (s.kind === 'num') s.cell.answer *= 1.5;
    else s.correct = (s.correct + 1) % s.options.length;
    recheck(p, c, 'planted', errs);
    assert.ok(errs.length, `a planted mistake in ${t} (${s.key}) was not caught`);
  }
});

test('energy-chain: no em dashes in anything a student reads', () => {
  const texts = [JSON.stringify(data), readFileSync(join(ROOT, 'environmental-science', 'assets', 'tools', 'energy-chain.js'), 'utf8'), readFileSync(join(ROOT, 'environmental-science', 'assets', 'tools', 'math', 'energy-chain.js'), 'utf8')];
  for (const t of TYPES) for (let i = 0; i < 20; i++) texts.push(JSON.stringify(model.generate(M.rng(1000 + i), ctxOf(t), t)));
  for (const t of texts) assert.ok(!/—/.test(t), 'an em dash');
});

test('energy-chain: each plant matches its EIA heat rate, energy is conserved, and the chain is the product', () => {
  const E = model;
  for (const id of E.ORDER) {
    const S = E.SOURCES[id], c = E.chain(id, 100);
    if (S.heatRate) assert.ok(Math.abs(c.plant - 3412 / S.heatRate * 100) < 0.5, id);
    assert.ok(Math.abs(c.stages.reduce((a, s) => a + s.waste, 0) + c.delivered - 100) < 1e-6, id);
    assert.ok(Math.abs(c.total - Calc.chainEfficiency(...c.stages.map(s => s.eff))) < 1e-9, id);
    assert.ok(c.total < Math.min(...c.stages.map(s => s.eff)) * 100, id);
  }
  // the turbine is the biggest loss in every heat engine
  for (const id of ['coal', 'gas', 'nuclear']) { const c = E.chain(id, 100); const big = c.stages.reduce((a, s) => s.waste > a.waste ? s : a); assert.equal(big.id, 'turb', id); }
  // gas is more efficient and lower carbon than coal; nuclear, wind, solar, hydro emit nothing at the plant
  assert.ok(E.chain('gas', 100).total > E.chain('coal', 100).total);
  assert.ok(E.SOURCES.gas.co2 < E.SOURCES.coal.co2 / 2);
  for (const id of ['nuclear', 'hydro', 'wind', 'solar']) assert.equal(E.SOURCES[id].co2, 0);
  // the wind rotor stays under the Betz limit; intermittent sources are wind and solar
  assert.ok(E.SOURCES.wind.stages[0].eff < 16 / 27);
  assert.equal(JSON.stringify(E.ORDER.filter(id => E.SOURCES[id].intermittent)), '["wind","solar"]');
  // need(): fuel energy to deliver kWh through the whole chain
  assert.ok(Math.abs(E.need('coal', 900) * E.chain('coal', 1).total / 100 - 900) < 1e-6);
});

test('energy-chain: the setups carry units that cancel to the answer', () => {
  const { Expr } = runtime();
  const p = model.generate(M.rng(5), ctxOf('power'), 'power');
  const r = Expr.evaluate(p.steps[0].cell.setup.answer, {}, []);
  assert.equal(JSON.stringify(r.dims), '{"h":1,"kW":1}');
  const bad = M.diagnoseSetup(p.steps[0].cell, p.given.w + ' W * ' + p.given.h + ' h/day * ' + p.given.days + ' day');
  assert.equal(bad.ok, false);
  const f = model.generate(M.rng(6), ctxOf('fuel'), 'fuel');
  assert.equal(M.diagnoseSetup(f.steps[0].cell, f.given.kwh + ' kWh * ' + f.given.eff / 100).ok, false, 'multiplying by the efficiency is wrong');
});
