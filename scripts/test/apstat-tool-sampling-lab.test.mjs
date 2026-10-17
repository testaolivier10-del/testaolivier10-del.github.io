/* Sampling lab: its model (statistics/assets/tools/math/sampling-lab.js) and its
   validator (scripts/lib/apstat-tool-checks/sampling-lab.mjs). OWNED BY THIS
   TOOL ONLY. Same seed same problem and same sample, the shipped data
   passing, planted mistakes caught, and statistical model tests: the simple
   random sample is unbiased with the SD the formula gives (finite population
   correction), stratifying narrows the spread, clustering by street widens
   it, every label has the same chance in a systematic sample, and the two
   nonrandom methods are biased in the direction each scene says. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { runtime } from '../lib/apstat-tool-checks/_shared.mjs';
import { check } from '../lib/apstat-tool-checks/sampling-lab.mjs';
import { loadMap, ROOT } from '../lib/apstat-build.mjs';

const DATA = JSON.parse(readFileSync(join(ROOT, 'statistics', 'data', 'tools', 'sampling-lab.json'), 'utf8'));
const scene = id => DATA.explore.scenes.find(s => s.id === id);

test('sampling-lab: the model registers ApStatMath.samplingLab, and the validator checks the frame', () => {
  const { M, model } = runtime('sampling-lab');
  assert.ok(M && model && typeof model.generate === 'function');
  const map = loadMap();
  const ok = { slug: 'sampling-lab', kind: 'simulator', topic: 'random-sampling', intro: '<p>x</p>', howItWorks: '<p>x</p>', contexts: [{ id: 'c1', topic: 'random-sampling' }] };
  assert.ok(check({ ...ok, topic: 'nope' }, map).some(e => /topic/.test(e)));
  assert.ok(check({ ...ok, slug: 'other' }, map).some(e => /slug/.test(e)));
});

test('sampling-lab: the shipped data passes its validator', () => {
  assert.deepEqual(check(DATA, loadMap()), []);
});

test('sampling-lab: a seed gives the same problem and the same sample twice', () => {
  const { M, model } = runtime('sampling-lab');
  for (const c of DATA.contexts) for (const t of model.TYPES) {
    const a = model.generate(M.rng(4242), c, t), b = model.generate(M.rng(4242), c, t);
    assert.equal(JSON.stringify(a), JSON.stringify(b));
  }
  const sc = scene('street'), pop = model.population(sc);
  for (const m of model.METHODS) assert.deepEqual(model.draw(M.rng(99), pop, m, 10, sc).picks, model.draw(M.rng(99), pop, m, 10, sc).picks);
});

test('sampling-lab: planted mistakes are caught', () => {
  const { model } = runtime('sampling-lab');
  const map = loadMap();
  const bad = JSON.parse(JSON.stringify(DATA));
  bad.contexts[0].strata.groups[0].size += 10;
  assert.ok(check(bad, map).some(e => /strata sizes add/.test(e)));
  const bad2 = JSON.parse(JSON.stringify(DATA));
  bad2.contexts[1].sysN.push(7);
  assert.ok(check(bad2, map).some(e => /does not divide/.test(e)));
  const bad4 = JSON.parse(JSON.stringify(DATA));
  bad4.intro = '<p>A sample — any sample.</p>';
  assert.ok(check(bad4, map).some(e => /dash/.test(e)));
  // a generator that keys the wrong method, or a wrong k, is caught by the recheck
  const real = model.generate;
  try {
    model.generate = (r, c, t) => { const p = real(r, c, t); if (p.type === 'method') { const s = p.steps[0]; s.correct = (s.correct + 1) % s.options.length; } return p; };
    assert.ok(check(DATA, map).some(e => /the key/.test(e)));
    model.generate = (r, c, t) => { const p = real(r, c, t); const k = p.steps.find(s => s.key === 'k'); if (k) k.cell.answer += 1; return p; };
    assert.ok(check(DATA, map).some(e => /k = /.test(e)));
    model.generate = (r, c, t) => { const p = real(r, c, t); const a = p.steps.find(s => s.key === 'alloc'); if (a) a.cell.answer += 1; return p; };
    assert.ok(check(DATA, map).some(e => /allocation/.test(e)));
  } finally { model.generate = real; }
});

const K = 10000;
function sdOf(a) { const m = a.reduce((x, y) => x + y, 0) / a.length; return Math.sqrt(a.reduce((s, x) => s + (x - m) * (x - m), 0) / (a.length - 1)); }
function meanOf(a) { return a.reduce((x, y) => x + y, 0) / a.length; }

test('sampling-lab: a simple random sample is unbiased, and its SD of x-bar matches sigma / root n with the finite population correction (within 3%)', () => {
  const { M, model } = runtime('sampling-lab');
  for (const id of ['street', 'field', 'school']) {
    const sc = scene(id), pop = model.population(sc), n = sc.n;
    const ms = model.repeatMeans(M.rng(2024), pop, 'srs', n, sc, K);
    const want = pop.sigma / Math.sqrt(n) * Math.sqrt((pop.N - n) / (pop.N - 1));
    assert.ok(Math.abs(meanOf(ms) - pop.mu) < 4 * want / Math.sqrt(K), `${id}: mean of x-bar ${meanOf(ms)} vs mu ${pop.mu}`);
    assert.ok(Math.abs(sdOf(ms) / want - 1) < 0.03, `${id}: SD ${sdOf(ms)} vs ${want}`);
  }
});

test('sampling-lab: stratifying narrows the spread; clusters of similar units widen it; both stay unbiased', () => {
  const { M, model } = runtime('sampling-lab');
  for (const id of ['street', 'school']) {
    const sc = scene(id), pop = model.population(sc), n = sc.n;
    const srs = sdOf(model.repeatMeans(M.rng(1), pop, 'srs', n, sc, 4000));
    const st = model.repeatMeans(M.rng(2), pop, 'strat', n, sc, 4000), cl = model.repeatMeans(M.rng(3), pop, 'cluster', n, sc, 4000);
    assert.ok(sdOf(st) < 0.8 * srs, `${id}: stratified ${sdOf(st)} vs SRS ${srs}`);
    assert.ok(sdOf(cl) > 1.5 * srs, `${id}: cluster ${sdOf(cl)} vs SRS ${srs}`);
    assert.ok(Math.abs(meanOf(st) - pop.mu) < 4 * sdOf(st) / Math.sqrt(4000));
    assert.ok(Math.abs(meanOf(cl) - pop.mu) < 4 * sdOf(cl) / Math.sqrt(4000));
  }
});

test('sampling-lab: in a systematic sample every label has the same chance, n / N (within 1 point)', () => {
  const { M, model } = runtime('sampling-lab');
  const sc = scene('street'), pop = model.population(sc), r = M.rng(77), hits = new Array(pop.N).fill(0);
  for (let j = 0; j < K; j++) for (const i of model.draw(r, pop, 'sys', sc.n, sc).picks) hits[i]++;
  for (const h of hits) assert.ok(Math.abs(h / K - sc.n / pop.N) < 0.01, `inclusion ${h / K}`);
});

test('sampling-lab: convenience and voluntary response samples are biased the way each scene says', () => {
  const { M, model } = runtime('sampling-lab');
  const dir = { street: { conv: -1, vol: 1 }, field: { conv: -1 }, school: { conv: 1, vol: -1 } };
  for (const id of Object.keys(dir)) {
    const sc = scene(id), pop = model.population(sc);
    for (const [m, d] of Object.entries(dir[id])) {
      const ms = model.repeatMeans(M.rng(5), pop, m, sc.n, sc, 2000);
      const off = meanOf(ms) - pop.mu, se = pop.sigma / Math.sqrt(sc.n);
      assert.ok(Math.sign(off) === d && Math.abs(off) > se, `${id} ${m}: off by ${off}`);
    }
  }
});

test('sampling-lab: proportional allocation adds to n and matches the shares', () => {
  const { model } = runtime('sampling-lab');
  assert.deepEqual(model.allocate([600, 450, 450], 75), [30, 23, 22]);
  assert.deepEqual(model.allocate([340, 310, 290, 260], 60), [17, 16, 14, 13]);
  for (const n of [5, 17, 40, 99]) assert.equal(model.allocate([3, 5, 7, 11], n).reduce((a, b) => a + b, 0), n);
});
