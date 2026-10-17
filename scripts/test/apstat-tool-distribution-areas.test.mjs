/* Distribution areas: its model (statistics/assets/tools/math/distribution-areas.js) and its
   validator (scripts/lib/apstat-tool-checks/distribution-areas.mjs). OWNED BY THIS
   TOOL ONLY. Same seed, same problem; every key recomputed with ApStatDist;
   planted mistakes caught; statistical model tests (simulated normal areas
   and binomial frequencies against the exact values); the shipped data
   passing. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { runtime } from '../lib/apstat-tool-checks/_shared.mjs';
import { check, recheck } from '../lib/apstat-tool-checks/distribution-areas.mjs';
import { loadMap, ROOT } from '../lib/apstat-build.mjs';

const data = JSON.parse(readFileSync(join(ROOT, 'statistics', 'data', 'tools', 'distribution-areas.json'), 'utf8'));
const ctxOf = t => data.contexts.find(c => c.types.includes(t));

test('distribution-areas: the model registers, and the validator checks the frame', () => {
  const { model } = runtime('distribution-areas');
  assert.ok(model && typeof model.generate === 'function');
  const map = loadMap();
  const ok = { slug: 'distribution-areas', kind: 'simulator', topic: 'normal-distribution', intro: '<p>x</p>', howItWorks: '<p>x</p>', contexts: [] };
  assert.ok(check({ ...ok, topic: 'nope' }, map).some(e => /topic/.test(e)));
  assert.ok(check({ ...ok, slug: 'other' }, map).some(e => /slug/.test(e)));
});

test('distribution-areas: the shipped data passes the validator (300 problems per context and type)', () => {
  assert.deepEqual(check(data, loadMap()), []);
});

test('distribution-areas: a seed gives the same problem twice', () => {
  const { M, model } = runtime('distribution-areas');
  for (const t of ['normal', 'inverse', 'binomial', 'empirical']) {
    const a = model.generate(M.rng(31337), ctxOf(t), t), b = model.generate(M.rng(31337), ctxOf(t), t);
    assert.equal(JSON.stringify(a), JSON.stringify(b));
    assert.equal(a.type, t);
  }
});

test('distribution-areas: words become the right counts, and the usual slips are named', () => {
  const { M, model, Dist } = runtime('distribution-areas');
  const b = (rel, k) => model.binom(10, 0.3, rel, k);
  assert.deepEqual([b('fewer', 3).lo, b('fewer', 3).hi], [0, 2]);
  assert.deepEqual([b('atMost', 3).lo, b('atMost', 3).hi], [0, 3]);
  assert.deepEqual([b('more', 3).lo, b('more', 3).hi], [4, 10]);
  assert.deepEqual([b('atLeast', 3).lo, b('atLeast', 3).hi], [3, 10]);
  assert.ok(Math.abs(b('fewer', 3).p - Dist.binomCdf(2, 10, 0.3)) < 1e-12);
  assert.ok(Math.abs(b('atLeast', 4).p + Dist.binomCdf(3, 10, 0.3) - 1) < 1e-12);
  assert.ok(Math.abs(model.normal(64, 2.5, 'greater', 68).p - (1 - Dist.normCdf(1.6))) < 1e-12);
  assert.equal(model.empirical(-1, 2), 81.5);
  assert.equal(model.empirical(-3, 3), 99.7);
  // "Fewer than" read as "at most" is caught and explained.
  for (let s = 1; s < 400; s++) {
    const p = model.generate(M.rng(s), ctxOf('binomial'), 'binomial');
    if (p.data.rel !== 'fewer') continue;
    const st = p.steps.find(x => x.key === 'p'), wrong = model.binom(p.data.n, p.data.p, 'atMost', p.data.k).p;
    const g = M.diagnose(st.cell, wrong);
    assert.equal(g.ok, false);
    if (Math.abs(wrong - st.cell.answer) > 0.003) assert.match(g.why, /Off by one/);
    break;
  }
  const p = model.generate(M.rng(5), ctxOf('normal'), 'normal');
  const errs = [];
  recheck(p, ctxOf('normal'), 'ok', errs);
  assert.deepEqual(errs, []);
  const bad = JSON.parse(JSON.stringify(p));
  bad.steps.find(s => s.key === 'p').cell.answer += 0.05;
  recheck(bad, ctxOf('normal'), 'bad', errs);
  assert.ok(errs.some(e => /probability key/.test(e)));
});

test('distribution-areas: simulated normal draws and binomial counts match the exact model', () => {
  const { M, model, Dist } = runtime('distribution-areas');
  const sim = model.simulateNormal(M.rng(77), 64, 2.5, 62, 68, 20000), exact = model.normal(64, 2.5, 'between', 62, 68).p;
  assert.ok(Math.abs(sim - exact) < 0.01, `${sim} vs ${exact}`);
  const fr = model.simulateBinom(M.rng(78), 12, 0.35, 20000);
  for (let k = 0; k <= 12; k++) assert.ok(Math.abs(fr[k] - Dist.binomPmf(k, 12, 0.35)) < 0.01, `k = ${k}`);
  // The inverse normal inverts the area.
  const inv = model.inverse(500, 100, 0.9, 'left');
  assert.ok(Math.abs(Dist.normCdf(inv.z) - 0.9) < 1e-12 && Math.abs(inv.x - (500 + 100 * inv.z)) < 1e-9);
});
