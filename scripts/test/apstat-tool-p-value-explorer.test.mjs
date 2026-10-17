/* p-value explorer: its model (statistics/assets/tools/math/p-value-explorer.js) and its
   validator (scripts/lib/apstat-tool-checks/p-value-explorer.mjs). OWNED BY THIS
   TOOL ONLY. Same seed, same problem; every key recomputed with ApStatDist;
   planted mistakes caught; statistical model tests (the simulated Type I rate
   within 1 point of alpha, simulated power against the normal model); the
   shipped data passing. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { runtime } from '../lib/apstat-tool-checks/_shared.mjs';
import { check, recheck } from '../lib/apstat-tool-checks/p-value-explorer.mjs';
import { loadMap, ROOT } from '../lib/apstat-build.mjs';

const data = JSON.parse(readFileSync(join(ROOT, 'statistics', 'data', 'tools', 'p-value-explorer.json'), 'utf8'));
const ctxOf = t => data.contexts.find(c => c.types.includes(t));

test('p-value-explorer: the model registers, and the validator checks the frame', () => {
  const { M, model } = runtime('p-value-explorer');
  assert.ok(M && model && typeof model.generate === 'function');
  const map = loadMap();
  const ok = { slug: 'p-value-explorer', kind: 'simulator', topic: 'p-values', intro: '<p>x</p>', howItWorks: '<p>x</p>', contexts: [] };
  assert.ok(check({ ...ok, topic: 'nope' }, map).some(e => /topic/.test(e)));
  assert.ok(check({ ...ok, slug: 'other' }, map).some(e => /slug/.test(e)));
});

test('p-value-explorer: the shipped data passes the validator (300 problems per context and type)', () => {
  assert.deepEqual(check(data, loadMap()), []);
});

test('p-value-explorer: a seed gives the same problem twice', () => {
  const { M, model } = runtime('p-value-explorer');
  for (const t of ['pvalue', 'tmean', 'meaning', 'errors']) {
    const a = model.generate(M.rng(4242), ctxOf(t), t), b = model.generate(M.rng(4242), ctxOf(t), t);
    assert.equal(JSON.stringify(a), JSON.stringify(b));
    assert.equal(a.type, t);
  }
});

test('p-value-explorer: the keys match ApStatDist and a planted wrong key is caught', () => {
  const { M, model, Dist } = runtime('p-value-explorer');
  const p = model.generate(M.rng(99), ctxOf('pvalue'), 'pvalue'), d = p.data;
  const z = (d.x / d.n - d.p0) / Math.sqrt(d.p0 * (1 - d.p0) / d.n);
  assert.ok(Math.abs(p.steps.find(s => s.key === 'z').cell.answer - z) < 1e-12);
  const errs = [];
  recheck(p, ctxOf('pvalue'), 'ok', errs);
  assert.deepEqual(errs, []);
  const bad = JSON.parse(JSON.stringify(p));
  bad.steps.find(s => s.key === 'p').cell.answer = 1 - bad.steps.find(s => s.key === 'p').cell.answer;
  recheck(bad, ctxOf('pvalue'), 'bad', errs);
  assert.ok(errs.some(e => /p-value key/.test(e)));
  // The p-hat-in-the-SE slip and the wrong tail are named, not just marked wrong.
  const se = p.steps.find(s => s.key === 'se');
  const wrongSE = Math.sqrt((d.x / d.n) * (1 - d.x / d.n) / d.n);
  if (Math.abs(wrongSE - se.cell.answer) > 0.0003) assert.match(M.diagnose(se.cell, wrongSE).why, /p_0/);
  const pv = p.steps.find(s => s.key === 'p');
  assert.ok(M.diagnose(pv.cell, 1 - pv.cell.answer).why);
  // The t test: df is n - 1 and the p-value is the t tail.
  const q = model.generate(M.rng(7), ctxOf('tmean'), 'tmean'), e = q.data;
  const t = (e.xbar - e.mu0) / (e.s / Math.sqrt(e.n));
  const l = Dist.tCdf(t, e.n - 1), pt = e.ha === 'less' ? l : e.ha === 'greater' ? 1 - l : 2 * Math.min(l, 1 - l);
  assert.ok(Math.abs(q.steps.find(s => s.key === 'p').cell.answer - pt) < 1e-12);
  assert.equal(q.steps.find(s => s.key === 'df').cell.answer, e.n - 1);
});

test('p-value-explorer: the simulated Type I rate is within 1 point of alpha', () => {
  const { M, model } = runtime('p-value-explorer');
  for (const [ha, alpha] of [['greater', 0.05], ['two', 0.05], ['less', 0.10]]) {
    const rate = model.simulateTypeI(M.rng(2026), 0.5, 400, alpha, ha, 10000);
    assert.ok(Math.abs(rate - alpha) <= 0.01, `${ha} ${alpha}: ${rate}`);
  }
});

test('p-value-explorer: the power from the normal model matches simulated tests', () => {
  const { M, model, Dist } = runtime('p-value-explorer');
  const sc = { p0: 0.5, n: 500, ha: 'greater' }, alpha = 0.05, pa = 0.55;
  const e = model.errors(sc, alpha, pa);
  assert.ok(Math.abs(e.power + e.typeII - 1) < 1e-12);
  const r = M.rng(11);
  let rej = 0;
  for (let i = 0; i < 10000; i++) { const x = M.bernoulli(r, pa, sc.n); if (Dist.z1prop(x / sc.n, sc.p0, sc.n).p.greater < alpha) rej++; }
  assert.ok(Math.abs(rej / 10000 - e.power) < 0.02, `simulated ${rej / 10000} vs ${e.power}`);
  // More power with a larger n, a larger alpha, a true value farther away.
  assert.ok(model.errors({ ...sc, n: 900 }, alpha, pa).power > e.power);
  assert.ok(model.errors(sc, 0.10, pa).power > e.power);
  assert.ok(model.errors(sc, alpha, 0.58).power > e.power);
  // A two-sided test: alpha at the null value itself.
  assert.ok(Math.abs(model.errors({ ...sc, ha: 'two' }, alpha, 0.5).power - alpha) < 1e-9);
});
