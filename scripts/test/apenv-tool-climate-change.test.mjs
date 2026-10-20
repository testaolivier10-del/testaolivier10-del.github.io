/* Climate change: its model (environmental-science/assets/tools/math/climate-change.js) and
   its validator (scripts/lib/apenv-tool-checks/climate-change.mjs). OWNED BY THIS
   TOOL ONLY (builder T4). The frame; the shipped data passing (300 problems
   per context and type, every key recomputed with ApEnvCalc); same seed
   same problem; planted mistakes caught (including the confusions the tool
   exists to stop); the named slips; and the science: a doubling of CO2
   gives 3 °C, CFCs thin ozone and raise UV-B, CO2 lowers ocean pH by about
   0.1 from 280 to 420 ppm, and melting sea ice adds nothing to sea level. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { runtime } from '../lib/apenv-tool-checks/_shared.mjs';
import { check, recheck } from '../lib/apenv-tool-checks/climate-change.mjs';
import { loadMap, ROOT } from '../lib/apenv-build.mjs';

const { M, model: K } = runtime('climate-change');
const data = JSON.parse(readFileSync(join(ROOT, 'environmental-science', 'data', 'tools', 'climate-change.json'), 'utf8'));
const ctx = id => data.contexts.find(c => c.id === id);

test('climate-change: the model registers, the page script parses, and the validator checks the frame', () => {
  assert.ok(K && typeof K.generate === 'function' && !K.stub);
  assert.doesNotThrow(() => new Function(readFileSync(join(ROOT, 'environmental-science', 'assets', 'tools', 'climate-change.js'), 'utf8')));
  const map = loadMap();
  const ok = { slug: 'climate-change', kind: 'simulator', topic: 'greenhouse-effect', intro: '<p>x</p>', howItWorks: '<p>x</p>', explore: data.explore, contexts: [{ id: 'c1', topic: 'greenhouse-effect', types: ['gases'], lead: 'A.' }] };
  assert.deepEqual(check(ok, map), []);
  assert.ok(check({ ...ok, topic: 'nope' }, map).some(e => /topic/.test(e)));
  assert.ok(check({ ...ok, slug: 'other' }, map).some(e => /slug/.test(e)));
  assert.ok(check({ ...ok, explore: { co2: [300, 1200], years: [[2024, 430]] } }, map).some(e => /explore/.test(e)));
  const pages = JSON.parse(readFileSync(join(ROOT, 'environmental-science', 'data', 'pages.json'), 'utf8'));
  assert.equal(pages.tools.find(t => t.slug === 'climate-change').topic, 'greenhouse-effect');
});

test('climate-change: the shipped data passes (300 problems per context and type, every key rechecked)', () => {
  assert.deepEqual(check(data, loadMap()), []);
});

test('climate-change: the same seed gives the same problem, for every type', () => {
  for (const c of data.contexts) for (const t of c.types) {
    const a = K.generate(M.rng(777), c, t), b = K.generate(M.rng(777), c, t);
    assert.equal(JSON.stringify(a), JSON.stringify(b), `${c.id} ${t}`);
    assert.equal(a.type, t);
  }
});

test('climate-change: planted mistakes and confusions are caught', () => {
  const p = K.generate(M.rng(1), ctx('oyster-farm'), 'ph'), e1 = [];
  p.steps.find(s => s.key === 'times').cell.answer = 10 * (p.given.ph0 - p.given.ph1);    // 10 × the drop
  recheck(p, ctx('oyster-farm'), 'planted', e1);
  assert.ok(e1.some(e => /times key/.test(e)));
  const q = K.generate(M.rng(2), ctx('warming-ocean'), 'sealevel'), e2 = [];
  const ice = q.steps.find(s => s.key === 'ice'); ice.correct = ice.options.findIndex(o => /Greenland/.test(o));
  recheck(q, ctx('warming-ocean'), 'planted', e2);
  assert.ok(e2.some(e => /sea ice/.test(e)));
  q.steps.find(s => s.key === 'cm').cell.numeric.answer /= 100;                          // left in meters
  const e3 = []; recheck(q, ctx('warming-ocean'), 'planted', e3);
  assert.ok(e3.some(e => /cm key/.test(e)));
  const r = K.generate(M.rng(3), ctx('landfill'), 'gwp'), e4 = [];
  r.steps.find(s => s.key === 'co2e').cell.numeric.answer = r.given.q * 25;            // an old GWP
  recheck(r, ctx('landfill'), 'planted', e4);
  assert.ok(e4.some(e => /CO2e key/.test(e)));
  // A key that says greenhouse gases absorb ultraviolet is refused.
  const s = K.generate(M.rng(4), ctx('two-systems'), 'gases'), e5 = [];
  const g = s.steps[0]; g.options[g.correct] = 'Greenhouse gases absorb ultraviolet from the Sun';
  recheck(s, ctx('two-systems'), 'planted', e5);
  assert.ok(e5.some(e => /confusion/.test(e)));
});

test('climate-change: the drill feedback names the slips', () => {
  const p = K.generate(M.rng(5), ctx('coral-reef'), 'ph'), g = p.given;
  const st = p.steps.find(s => s.key === 'tset');
  assert.match(M.diagnoseSetup(st.cell, `10 * (${g.ph0} - ${g.ph1})`).why, /logarithmic/);
  const c = K.generate(M.rng(6), ctx('keeling'), 'co2'), cs = c.steps.find(s => s.key === 'setup');
  assert.match(M.diagnoseSetup(cs.cell, `${c.given.C1} - ${c.given.C0} / ${c.given.C0} * 100`).why, /brackets/);
  const sl = K.generate(M.rng(7), ctx('warming-ocean'), 'sealevel'), cm = sl.steps.find(s => s.key === 'cm');
  assert.match(M.diagnoseUnit(cm.cell, { value: String(cm.cell.numeric.answer / 100), unit: 'm' }).why, /cm/);
  // Every pooled question offers the classic wrong pairing, and its explanation corrects it.
  const all = Object.values(K.POOL).flat();
  assert.ok(all.some(it => it[3].some(w => /ultraviolet/i.test(w[0]) && /infrared/i.test(w[1]))));
  assert.ok(all.some(it => it[3].some(w => /Kyoto/.test(w[0]) && /Montreal/.test(w[1]))));
});

test('climate-change: the models behave', () => {
  assert.equal(K.forcing(280), 0);
  assert.ok(Math.abs(K.warming(560) - 3) < 1e-12, 'a doubling gives 3 °C');
  assert.ok(Math.abs(K.forcing(560) - 5.35 * Math.LN2) < 1e-12);
  for (let c = 290; c <= 1200; c += 10) assert.ok(K.warming(c) > K.warming(c - 10));
  assert.equal(K.ozone(0), 300); assert.ok(K.ozone(1) < 220);
  assert.equal(K.uvb(300), 1); assert.ok(K.uvb(K.ozone(0.5)) > 1);
  // CFCs do not change warming, CO2 does not change ozone (two separate inputs).
  assert.equal(K.ozone.length, 1); assert.equal(K.warming.length, 1);
  assert.ok(Math.abs(K.ph(280) - 8.2) < 1e-12);
  assert.ok(Math.abs(K.ph(420) - 8.1) < 0.01, 'about 8.1 at 420 ppm');
  for (let c = 300; c <= 1200; c += 50) assert.ok(K.ph(c) > 7, 'the ocean stays basic');
  assert.ok(Math.abs(K.hFactor(8.2, 8.1) - Math.pow(10, 0.1)) < 1e-9);
  assert.ok(Math.abs(K.expansion(0.00021, 700, 1) - 0.147) < 1e-12);
  assert.equal(K.GREENLAND, 7.4); assert.equal(K.ANTARCTICA, 58);
});
