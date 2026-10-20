/* air-pollution: its model (environmental-science/assets/tools/math/air-pollution.js) and its
   validator (scripts/lib/apenv-tool-checks/air-pollution.mjs). OWNED BY THIS TOOL
   ONLY (builder T3). The frame; the shipped data passing (300 problems per
   context and type, every key recomputed with ApEnvCalc); the same seed
   giving the same problem; planted mistakes caught; and the model's science
   (MODEL_TESTS below). */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { runtime } from '../lib/apenv-tool-checks/_shared.mjs';
import { check, recheck, TYPES } from '../lib/apenv-tool-checks/air-pollution.mjs';
import { loadMap, ROOT } from '../lib/apenv-build.mjs';

const { M, Calc, model } = runtime('air-pollution');
const data = JSON.parse(readFileSync(join(ROOT, 'environmental-science', 'data', 'tools', 'air-pollution.json'), 'utf8'));
const ctxOf = t => data.contexts.find(c => c.types.includes(t));

test('air-pollution: the model registers ApEnvMath.airPollution, the page script parses, and the validator checks the frame', () => {
  assert.ok(model && typeof model.generate === 'function' && !model.stub);
  assert.doesNotThrow(() => new Function(readFileSync(join(ROOT, 'environmental-science', 'assets', 'tools', 'air-pollution.js'), 'utf8')));
  const map = loadMap();
  assert.ok(check({ ...data, topic: 'nope' }, map).some(e => /topic/.test(e)));
  assert.ok(check({ ...data, slug: 'other' }, map).some(e => /slug/.test(e)));
  assert.ok(check({ ...data, contexts: [{ id: 'x', topic: data.topic, types: ['nope'] }] }, map).some(e => /types/.test(e)));
  const pages = JSON.parse(readFileSync(join(ROOT, 'environmental-science', 'data', 'pages.json'), 'utf8'));
  assert.equal(pages.tools.find(t => t.slug === 'air-pollution').topic, 'photochemical-smog');
});

test('air-pollution: the shipped data passes (300 problems per context and type, every key rechecked)', () => {
  assert.deepEqual(check(data, loadMap()), []);
});

test('air-pollution: every type is served by a context, and the same seed gives the same problem', () => {
  for (const t of TYPES) {
    const c = ctxOf(t);
    assert.ok(c, `no context serves ${t}`);
    const a = model.generate(M.rng(31337), c, t), b = model.generate(M.rng(31337), c, t);
    assert.equal(JSON.stringify(a), JSON.stringify(b), t);
    assert.equal(a.type, t);
  }
});

test('air-pollution: planted mistakes are caught', () => {
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

test('air-pollution: no em dashes in anything a student reads', () => {
  const texts = [JSON.stringify(data), readFileSync(join(ROOT, 'environmental-science', 'assets', 'tools', 'air-pollution.js'), 'utf8'), readFileSync(join(ROOT, 'environmental-science', 'assets', 'tools', 'math', 'air-pollution.js'), 'utf8')];
  for (const t of TYPES) for (let i = 0; i < 20; i++) texts.push(JSON.stringify(model.generate(M.rng(1000 + i), ctxOf(t), t)));
  for (const t of texts) assert.ok(!/—/.test(t), 'an em dash');
});
import { science } from '../lib/apenv-tool-checks/air-pollution.mjs';

test('air-pollution: the smog day has the textbook timing and responds the right way', () => {
  assert.deepEqual(science(model), []);
  const d = model.smogDay({});
  assert.ok(d.peaks.NO.hour < d.peaks.NO2.hour && d.peaks.NO2.hour < d.peaks.O3.hour);
  // ozone at night is far below its afternoon peak; NO at 3 a.m. is near zero
  assert.ok(d.at('O3', 2) < d.peaks.O3.value / 2);
  // fewer cars: less NO and less ozone; an inversion: more of both NO2 and ozone
  const lo = model.smogDay({ cars: 0.5 }), inv = model.smogDay({ inversion: true });
  assert.ok(lo.peaks.NO.value < d.peaks.NO.value && lo.peaks.O3.value < d.peaks.O3.value);
  assert.ok(inv.peaks.NO2.value > d.peaks.NO2.value && inv.peaks.O3.value > d.peaks.O3.value);
  // the model is deterministic (cached, and a fresh run agrees)
  assert.equal(model.smogDay({}).peaks.O3.value, d.peaks.O3.value);
});

test('air-pollution: rain pH, buffering and the tolerance chart', () => {
  assert.ok(Math.abs(model.rainPH(0) - 5.6) < 1e-9);
  for (let f = 0.1; f <= 1; f += 0.1) assert.ok(model.rainPH(f) < model.rainPH(f - 0.1));
  for (const r of [4.2, 4.6, 5.0]) assert.ok(model.lakePH(r, true) > model.lakePH(r, false), 'limestone buffers');
  const T = model.TOLERANCE;
  assert.equal(T.find(a => a.name === 'Frogs').ph, 4.0);
  assert.equal(T.find(a => a.name === 'Mayfly').ph, 5.5);
  // the acid-rain gases are SO2 and NOx only
  assert.equal(Object.keys(model.POLL).filter(k => model.POLL[k].acid).join(','), 'NOx,SO2,H2SO4');
  // pH drill: 10^(difference)
  const p = model.generate(M.rng(9), ctxOf('ph'), 'ph');
  assert.ok(Math.abs(p.steps.find(s => s.key === 'times').cell.answer - Math.pow(10, p.given.b - p.given.a)) < 1e-6);
});
