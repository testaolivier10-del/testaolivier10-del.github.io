/* earth-climate: its model (environmental-science/assets/tools/math/earth-climate.js) and its
   validator (scripts/lib/apenv-tool-checks/earth-climate.mjs). OWNED BY THIS TOOL
   ONLY (builder T3). The frame; the shipped data passing (300 problems per
   context and type, every key recomputed with ApEnvCalc); the same seed
   giving the same problem; planted mistakes caught; and the model's science
   (MODEL_TESTS below). */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { runtime } from '../lib/apenv-tool-checks/_shared.mjs';
import { check, recheck, TYPES } from '../lib/apenv-tool-checks/earth-climate.mjs';
import { loadMap, ROOT } from '../lib/apenv-build.mjs';

const { M, Calc, model } = runtime('earth-climate');
const data = JSON.parse(readFileSync(join(ROOT, 'environmental-science', 'data', 'tools', 'earth-climate.json'), 'utf8'));
const ctxOf = t => data.contexts.find(c => c.types.includes(t));

test('earth-climate: the model registers ApEnvMath.earthClimate, the page script parses, and the validator checks the frame', () => {
  assert.ok(model && typeof model.generate === 'function' && !model.stub);
  assert.doesNotThrow(() => new Function(readFileSync(join(ROOT, 'environmental-science', 'assets', 'tools', 'earth-climate.js'), 'utf8')));
  const map = loadMap();
  assert.ok(check({ ...data, topic: 'nope' }, map).some(e => /topic/.test(e)));
  assert.ok(check({ ...data, slug: 'other' }, map).some(e => /slug/.test(e)));
  assert.ok(check({ ...data, contexts: [{ id: 'x', topic: data.topic, types: ['nope'] }] }, map).some(e => /types/.test(e)));
  const pages = JSON.parse(readFileSync(join(ROOT, 'environmental-science', 'data', 'pages.json'), 'utf8'));
  assert.equal(pages.tools.find(t => t.slug === 'earth-climate').topic, 'el-nino-la-nina');
});

test('earth-climate: the shipped data passes (300 problems per context and type, every key rechecked)', () => {
  assert.deepEqual(check(data, loadMap()), []);
});

test('earth-climate: every type is served by a context, and the same seed gives the same problem', () => {
  for (const t of TYPES) {
    const c = ctxOf(t);
    assert.ok(c, `no context serves ${t}`);
    const a = model.generate(M.rng(31337), c, t), b = model.generate(M.rng(31337), c, t);
    assert.equal(JSON.stringify(a), JSON.stringify(b), t);
    assert.equal(a.type, t);
  }
});

test('earth-climate: planted mistakes are caught', () => {
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

test('earth-climate: no em dashes in anything a student reads', () => {
  const texts = [JSON.stringify(data), readFileSync(join(ROOT, 'environmental-science', 'assets', 'tools', 'earth-climate.js'), 'utf8'), readFileSync(join(ROOT, 'environmental-science', 'assets', 'tools', 'math', 'earth-climate.js'), 'utf8')];
  for (const t of TYPES) for (let i = 0; i < 20; i++) texts.push(JSON.stringify(model.generate(M.rng(1000 + i), ctxOf(t), t)));
  for (const t of texts) assert.ok(!/—/.test(t), 'an em dash');
});

test('earth-climate: the sun and the seasons', () => {
  const E = model;
  // solstices and equinoxes (Cooper's formula): overhead at 23.44°N on June 21, 23.44°S on December 21, near 0 at the equinoxes
  assert.ok(Math.abs(E.declination(172) - 23.44) < 0.05);
  assert.ok(Math.abs(E.declination(355) + 23.44) < 0.05);
  assert.ok(Math.abs(E.declination(80)) < 1 && Math.abs(E.declination(266)) < 1.2);
  // noon sun angle = 90 − |lat − decl|: 73.5° at 40°N on the June solstice, 26.5° on the December solstice
  assert.equal(E.noonAngle(40, 23.5), 73.5);
  assert.equal(E.noonAngle(40, -23.5), 26.5);
  // day length: 12 h at the equator always and everywhere at an equinox; polar day and night
  assert.ok(Math.abs(E.dayLength(0, 23.44) - 12) < 1e-9 && Math.abs(E.dayLength(55, 0) - 12) < 1e-9);
  assert.ok(Math.abs(E.dayLength(40, 23.44) - 14.85) < 0.1);
  assert.equal(E.dayLength(80, 23.44), 24);
  assert.equal(E.dayLength(80, -23.44), 0);
  // daily top-of-atmosphere sunlight: equator at equinox S0/π ≈ 433 W/m²; the pole at the June solstice beats the equator
  assert.ok(Math.abs(E.insolation(0, 0) - 1361 / Math.PI) < 0.5);
  assert.ok(E.insolation(90, 23.44) > E.insolation(0, 23.44));
  assert.equal(E.insolation(-80, 23.44), 0);
});

test('earth-climate: cells, winds, rain shadow and ENSO', () => {
  const E = model;
  assert.equal(E.band(15).cell, 'Hadley'); assert.match(E.band(15).wind, /^Northeast trade/); assert.match(E.band(-15).wind, /^Southeast trade/);
  assert.equal(E.band(45).cell, 'Ferrel'); assert.equal(E.band(45).wind, 'Westerlies');
  assert.equal(E.band(75).cell, 'Polar'); assert.equal(E.band(75).wind, 'Polar easterlies');
  assert.equal(E.verticalAt(0), 'rise'); assert.equal(E.verticalAt(30), 'sink'); assert.equal(E.verticalAt(-60), 'rise'); assert.equal(E.verticalAt(90), 'sink');
  // rain shadow: cloud base ~125 m per °C of dew point spread; the far side warmer than the start
  const S = E.rainShadow({ T0: 25, H: 3, rh: 75 });
  assert.ok(Math.abs(S.lcl - 0.125 * (25 - S.Td)) < 1e-9);
  assert.ok(Math.abs(S.Ttop - (25 - 10 * S.lcl - 6 * (3 - S.lcl))) < 1e-9);
  assert.ok(Math.abs(S.Tlee - (S.Ttop + 30)) < 1e-9 && S.Tlee > 25 && S.rhLee < 75);
  const low = E.rainShadow({ T0: 25, H: 0.5, rh: 40 });
  assert.equal(low.cloud, false); assert.ok(Math.abs(low.Tlee - 25) < 1e-9);
  // ENSO: NOAA's ±0.5 °C; El Niño weakens the trades and the upwelling and deepens the east thermocline; La Niña the reverse
  assert.equal(E.enso(0.5).state, 'nino'); assert.equal(E.enso(0.4).state, 'neutral'); assert.equal(E.enso(-0.5).state, 'nina');
  const n = E.enso(1.5), a = E.enso(-1.5), z = E.enso(0);
  assert.ok(n.trade < z.trade && z.trade < a.trade);
  assert.ok(n.upwell < z.upwell && z.upwell < a.upwell);
  assert.ok(n.dE > z.dE && z.dE > a.dE);
  assert.ok(n.rainX > z.rainX && z.rainX > a.rainX, 'El Niño moves the rain east');
  assert.ok(n.sstE > z.sstE && a.sstE < z.sstE);
});
