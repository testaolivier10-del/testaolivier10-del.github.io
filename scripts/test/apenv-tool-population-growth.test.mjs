/* Population growth: its model (environmental-science/assets/tools/math/population-growth.js) and
   its validator (scripts/lib/apenv-tool-checks/population-growth.mjs). OWNED BY THIS
   TOOL ONLY (builder T1). The frame; the shipped data passing (300 problems
   per context and type, every key recomputed with ApEnvCalc); the same seed
   giving the same problem; planted mistakes caught; and the model: the
   J-curve is ApEnvCalc.exponential year by year, the S-curve levels off at K
   with its fastest growth near K/2, overshoot passes K, dies back below it
   and settles near the damaged range's lower K without going extinct, the
   phases read in order, the rule of 70, and survivorship kept apart from r
   and K (the reader-report mix-up). */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { runtime } from '../lib/apenv-tool-checks/_shared.mjs';
import { check, recheck, TYPES } from '../lib/apenv-tool-checks/population-growth.mjs';
import { loadMap, ROOT } from '../lib/apenv-build.mjs';

const { M, Calc, model: S } = runtime('population-growth');
const data = JSON.parse(readFileSync(join(ROOT, 'environmental-science', 'data', 'tools', 'population-growth.json'), 'utf8'));
const ctx = id => data.contexts.find(c => c.id === id);
const stp = (p, k) => p.steps.find(s => s.key === k);

test('population-growth: the model registers, the page script parses, the validator checks the frame', () => {
  assert.ok(S && typeof S.generate === 'function' && !S.stub);
  assert.doesNotThrow(() => new Function(readFileSync(join(ROOT, 'environmental-science', 'assets', 'tools', 'population-growth.js'), 'utf8')));
  const map = loadMap();
  const ok = { ...data };
  assert.ok(check({ ...ok, topic: 'nope' }, map).some(e => /topic/.test(e)));
  assert.ok(check({ ...ok, slug: 'other' }, map).some(e => /slug/.test(e)));
  assert.ok(check({ ...ok, contexts: data.contexts.filter(c => !c.types.includes('survivorship')) }, map).some(e => /survivorship/.test(e)));
  assert.ok(check({ ...ok, contexts: [{ ...ctx('surv-oysters'), curve: 'IV' }] }, map).some(e => /curve must be/.test(e)));
  const pages = JSON.parse(readFileSync(join(ROOT, 'environmental-science', 'data', 'pages.json'), 'utf8'));
  const entry = pages.tools.find(t => t.slug === 'population-growth');
  assert.equal(entry.topic, 'population-growth');
  assert.equal(entry.premium, 'tools');
});

test('population-growth: the shipped data passes (300 problems per context and type, every key rechecked)', () => {
  assert.deepEqual(check(data, loadMap()), []);
});

test('population-growth: the same seed gives the same problem; every type is drilled', () => {
  const seen = new Set();
  for (const c of data.contexts) for (const t of c.types) {
    seen.add(t);
    const a = S.generate(M.rng(5150), c, t), b = S.generate(M.rng(5150), c, t);
    assert.equal(JSON.stringify(a), JSON.stringify(b), `${c.id} ${t}`);
  }
  assert.deepEqual([...seen].sort(), [...TYPES].sort());
});

test('population-growth: planted mistakes are caught', () => {
  const w = 'planted';
  let errs = [], p = S.generate(M.rng(3), ctx('island-deer'), 'doubling');
  stp(p, 'year').cell.answer = stp(p, 'answer').cell.numeric.answer;      // the doubling time as the year
  recheck(p, ctx('island-deer'), w, errs);
  assert.ok(errs.some(e => /year key/.test(e)), errs.join('; '));
  errs = []; p = S.generate(M.rng(4), ctx('surv-oysters'), 'survivorship');
  stp(p, 'curve').correct = 0;                                           // Type I for oysters
  recheck(p, ctx('surv-oysters'), w, errs);
  assert.ok(errs.some(e => /curve key/.test(e)), errs.join('; '));
  errs = []; p = S.generate(M.rng(5), ctx('rk-albatross'), 'rk');
  stp(p, 'rk').correct = 1;                                              // r-selected for an albatross
  recheck(p, ctx('rk-albatross'), w, errs);
  assert.ok(errs.some(e => /strategy key/.test(e)), errs.join('; '));
  errs = []; p = S.generate(M.rng(6), ctx('yeast'), 'logistic');
  stp(p, 'k').cell.answer = p.given.K / 2;                               // K/2 read as K
  recheck(p, ctx('yeast'), w, errs);
  assert.ok(errs.some(e => /k key/.test(e)), errs.join('; '));
});

test('population-growth: the J-curve is ApEnvCalc.exponential and doubles in the rule-of-70 time', () => {
  const s = S.simulate({ model: 'exp', r: 0.07, K: 1e9, n0: 100, years: 30 });
  for (const t of [1, 10, 30]) assert.equal(s.n[t], Calc.evaluate({ fn: 'exponential', args: [100, 7, t] }));
  assert.equal(S.doublingTime(0.07), 10);
  // the rule of 70 is an approximation: within 3% of the exact doubling at 7%
  assert.ok(Math.abs(s.n[10] / 200 - 1) < 0.03);
});

test('population-growth: the S-curve levels off at K, fastest near K/2, phases in order', () => {
  const s = S.simulate({ model: 'log', r: 0.4, K: 2000, n0: 100, years: 40 });
  assert.ok(Math.abs(s.n[40] - 2000) < 1);
  const inc = s.n.slice(1).map((v, i) => v - s.n[i]), at = inc.indexOf(Math.max(...inc));
  assert.ok(s.n[at] > 2000 * 0.3 && s.n[at + 1] < 2000 * 0.7, `fastest growth at N = ${s.n[at]}`);
  const order = ['lag', 'exponential', 'slowing', 'at K'], phases = s.n.map((_, i) => S.phase(s, i));
  let k = 0; for (const ph of phases) { assert.ok(order.indexOf(ph) >= k, `phase ${ph} after ${order[k]}`); k = order.indexOf(ph); }
  assert.equal(phases[40], 'at K');
});

test('population-growth: overshoot passes K, dies back below it and settles near the damaged K (never extinct)', () => {
  for (const r of [0.3, 0.45, 0.6]) {
    const s = S.simulate({ model: 'over', r, K: 2000, n0: 120, years: 50, lag: 2, crash: 0.55 });
    assert.ok(s.peak > 2000, `r=${r} peak ${s.peak}`);
    assert.ok(Math.min(...s.n.slice(s.peakT)) < 2000);
    assert.ok(Math.min(...s.n) > 20, `r=${r} never extinct`);
    assert.ok(Math.abs(s.K[50] - 1100) < 5, 'K falls to 55% after overgrazing');
    assert.ok(Math.abs(s.n[50] / s.K[50] - 1) < 0.25, `r=${r} settles near the lower K (${s.n[50]})`);
    assert.equal(S.phase(s, s.peakT), 'overshoot');
    assert.equal(S.phase(s, s.peakT + 1), 'dieback');
  }
});

test('population-growth: survivorship curves are kept apart from r and K', () => {
  // Type II: a constant death rate, a straight line on a log scale.
  const r = S.CURVES.II.slice(1).map((v, i) => Math.log(v / S.CURVES.II[i]));
  assert.ok(r.every(x => Math.abs(x - r[0]) < 0.05));
  assert.ok(S.CURVES.I[5] > 800 && S.CURVES.III[1] < 100, 'Type I: late deaths; Type III: early deaths');
  for (const c of data.contexts.filter(x => x.types.includes('survivorship'))) {
    const p = S.generate(M.rng(8), c, 'survivorship'), link = stp(p, 'link');
    assert.match(link.options[link.correct], /not the same thing/);
    assert.ok(link.options.some(o => /two names for the same idea/.test(o)), 'the mix-up is offered as a distractor');
  }
});

test('population-growth: no em dashes in what a student reads', () => {
  for (const f of ['population-growth.js', 'math/population-growth.js']) assert.ok(!/—/.test(readFileSync(join(ROOT, 'environmental-science', 'assets', 'tools', f), 'utf8')), f);
  assert.ok(!/—/.test(JSON.stringify(data)));
});
