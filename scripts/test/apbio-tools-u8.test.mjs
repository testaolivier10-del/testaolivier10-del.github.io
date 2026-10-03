/* AP® Biology Unit 8 simulators (kept apart from apbio-tools.test.mjs so
   other units' additions merge cleanly): the population growth and energy
   flow models in bio-tool-math.js, and their validators on planted mistakes.
   The shipped data files are checked by apbio-tools.test.mjs ("every tool
   data file passes its validator"). */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { runtime } from '../lib/apbio-tool-checks/_shared.mjs';
import { ROOT } from '../lib/apbio-build.mjs';

const { M } = runtime();
const same = (a, b) => assert.equal(JSON.stringify(a), JSON.stringify(b));
const near = (a, b, t = 1e-9) => assert.ok(Math.abs(a - b) <= t, `${a} vs ${b}`);
const data = slug => JSON.parse(readFileSync(join(ROOT, 'bio', 'data', 'tools', `${slug}.json`), 'utf8'));

test('population model: exponential and logistic forms, Euler steps, events, a change in K', () => {
  const P = M.population;
  near(P.rate('exp', 0.4, 1000, 250), 100);
  near(P.rate('log', 0.4, 1000, 250), 75);
  near(P.perCap('log', 0.4, 1000, 1000), 0);
  assert.ok(P.rate('log', 0.4, 1000, 1200) < 0, 'above K the population shrinks');
  same(P.peak(0.4, 1000), { N: 500, dNdt: 100 });
  // Δt = 1: exponential is N0(1 + r)^t exactly; one logistic step by hand
  const ex = P.simulate({ model: 'exp', N0: 20, r: 0.4, K: 1000, dt: 1, tEnd: 5 });
  near(P.at(ex, 5).N, 20 * 1.4 ** 5, 1e-9);
  const lg = P.simulate({ model: 'log', N0: 20, r: 0.4, K: 1000, dt: 1, tEnd: 30 });
  near(P.at(lg, 1).N, 20 + 0.4 * 20 * 0.98);
  assert.ok(Math.abs(P.at(lg, 30).N - 1000) < 0.5);
  // a smaller step approaches the smooth exponential curve
  const err = dt => Math.abs(P.at(P.simulate({ model: 'exp', N0: 10, r: 0.5, K: 1, dt, tEnd: 4 }), 4).N - 10 * Math.exp(2));
  assert.ok(err(0.1) < err(1));
  // events remove a fixed share; a change in K applies from its time
  const ev = P.simulate({ model: 'log', N0: 20, r: 0.4, K: 1000, dt: 1, tEnd: 30, disasters: [{ t: 14, f: 0.5 }] });
  const at14 = P.at(ev, 14); near(at14.N, at14.pre / 2); assert.ok(at14.perCap > P.at(ev, 13).perCap);
  const kc = P.simulate({ model: 'log', N0: 1000, r: 0.4, K: 1000, dt: 0.1, tEnd: 60, kChange: { t: 10, K: 600 } });
  assert.equal(P.at(kc, 9).K, 1000); assert.equal(P.at(kc, 10).K, 600);
  assert.ok(Math.abs(P.at(kc, 60).N - 600) < 1);
  // the exponential run stops past nMax; deterministic
  assert.ok(P.simulate({ model: 'exp', N0: 200, r: 1, K: 1, dt: 1, tEnd: 80, nMax: 1e6 }).stopped > 0);
  assert.equal(JSON.stringify(ev), JSON.stringify(P.simulate({ model: 'log', N0: 20, r: 0.4, K: 1000, dt: 1, tEnd: 30, disasters: [{ t: 14, f: 0.5 }] })), 'deterministic');
});

test('energy flow model: NPP, the stored fraction, heat, conservation, biomass, biomagnification', () => {
  const E = M.energyFlow, c = { gpp: 20000, prodResp: 0.5, eff: 0.1, resp: 0.8, levels: 4, c0: 0.04, retain: 1, pb: [1, 5, 1, 0.5], kcalPerG: 4 };
  const s = E.simulate(c), L = s.levels;
  assert.equal(s.npp, 10000);
  same(L.map(x => +x.stored.toFixed(6)), [10000, 1000, 100, 10]);
  same(L.map(x => +x.heat.toFixed(6)), [10000, 4000, 400, 40]);
  near(s.heat + s.decomp, 20000, 1e-6);
  same(L.map(x => +x.biomass.toFixed(6)), [2500, 50, 25, 5]);
  same(L.map(x => +x.conc.toFixed(6)), [0.04, 0.2, 1, 5]);
  near(s.factor, 5);
  // open water: inverted biomass at the base, upright energy
  const w = E.simulate({ ...c, pb: [200, 10, 1, 0.5] });
  assert.ok(w.levels[0].biomass < w.levels[1].biomass && w.levels[0].stored > w.levels[1].stored);
  // a level cannot absorb more than the level below stores
  assert.throws(() => E.simulate({ ...c, eff: 0.2, resp: 0.85 }));
  // lower respiration (an ectotherm-like level) lowers the toxin's rise per level
  assert.ok(E.simulate({ ...c, resp: 0.5 }).factor < s.factor);
});

test('Unit 8 validators catch planted mistakes', async () => {
  const pg = (await import('../lib/apbio-tool-checks/population-growth.mjs')).check, ef = (await import('../lib/apbio-tool-checks/energy-flow.mjs')).check;
  assert.deepEqual(pg(data('population-growth'), null), []);
  assert.deepEqual(ef(data('energy-flow'), null), []);
  const a = data('population-growth'); a.stimuli['pg-s1'].tables[0].rows[6][2] = '99.0';
  assert.ok(pg(a, null).some(e => /the model gives/.test(e)));
  const b = data('population-growth'); b.questions[0].numeric.answer = 100;
  assert.ok(pg(b, null).some(e => /growth:1/.test(e)));
  const c = data('population-growth'); c.defaults.dt = 0.3;
  assert.ok(pg(c, null).some(e => /dt/.test(e)));
  const d = data('energy-flow'); d.stimuli['ef-s1'].tables[2].rows[3][1] = '0.40';
  assert.ok(ef(d, null).some(e => /the model gives/.test(e)));
  const e = data('energy-flow'); e.questions[0].numeric.answer = 10000;
  assert.ok(ef(e, null).some(e2 => /chain:1/.test(e2)));
  const f = data('energy-flow'); f.ecosystems[1].pb = [1, 1, 1, 1, 1];
  assert.ok(ef(f, null).length > 0, 'turnover change breaks the inverted pyramid and Table 2');
  const g = data('energy-flow'); g.questions[3].topic = 'not-a-topic';
  assert.ok(ef(g, null).some(e2 => /unknown topic/.test(e2)));
});
