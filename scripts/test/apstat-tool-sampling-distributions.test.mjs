/* Sampling distributions: its model (statistics/assets/tools/math/sampling-distributions.js) and its
   validator (scripts/lib/apstat-tool-checks/sampling-distributions.mjs). OWNED BY THIS
   TOOL ONLY. Same seed same problem; every key recomputed with ApStatDist
   (the validator, over the shipped data); planted mistakes caught; and the
   statistical model tests: the population's exact mu and sigma, the
   simulated mean and SD of x-bar and p-hat against the formulas (within 3%),
   a difference's SD, and the AP® shape rules. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { runtime } from '../lib/apstat-tool-checks/_shared.mjs';
import { check, recheck } from '../lib/apstat-tool-checks/sampling-distributions.mjs';
import { loadMap, ROOT } from '../lib/apstat-build.mjs';

const { M, Dist, model: S } = runtime('sampling-distributions');
const data = JSON.parse(readFileSync(join(ROOT, 'statistics', 'data', 'tools', 'sampling-distributions.json'), 'utf8'));
const ctx = id => data.contexts.find(c => c.id === id);

test('sampling-distributions: the validator checks the frame', () => {
  const map = loadMap();
  const ok = { slug: 'sampling-distributions', kind: 'simulator', topic: 'sampling-distributions', intro: '<p>x</p>', howItWorks: '<p>x</p>', explore: { populations: ['commute'] }, contexts: [{ id: 'c1', topic: 'sampling-dist-proportion', types: ['prop'], lead: 'A.', yes: 'say yes', who: 'people', popAll: 'all people', p: [0.4, 0.5], ns: [100] }] };
  assert.deepEqual(check(ok, map), []);
  assert.ok(check({ ...ok, topic: 'nope' }, map).some(e => /topic/.test(e)));
  assert.ok(check({ ...ok, slug: 'other' }, map).some(e => /slug/.test(e)));
  assert.ok(check({ ...ok, explore: { populations: ['nowhere'] } }, map).some(e => /not in the model/.test(e)));
  assert.ok(check({ ...ok, contexts: [{ ...ok.contexts[0], types: ['bogus'] }] }, map).some(e => /types/.test(e)));
});

test('sampling-distributions: the shipped data passes (300 problems per context and type, every key rechecked)', () => {
  assert.deepEqual(check(data, loadMap()), []);
});

test('sampling-distributions: the same seed gives the same problem, for every type', () => {
  for (const c of data.contexts) for (const t of c.types) {
    const a = S.generate(M.rng(4242), c, t), b = S.generate(M.rng(4242), c, t);
    assert.equal(JSON.stringify(a), JSON.stringify(b), `${c.id} ${t}`);
    assert.equal(a.type, t);
  }
  assert.deepEqual(S.simulate(M.rng(9), S.population(S.POPS.commute), 5, 50), S.simulate(M.rng(9), S.population(S.POPS.commute), 5, 50));
});

test('sampling-distributions: planted mistakes are caught', () => {
  const errs = [], w = 'planted';
  const p = S.generate(M.rng(77), ctx('commute'), 'mean');
  const sd = p.steps.find(s => s.key === 'sd');
  sd.cell.answer = p.given.sigma;                                 // sigma in place of sigma / sqrt(n)
  recheck(p, ctx('commute'), w, errs);
  assert.ok(errs.some(e => /SD key/.test(e)), errs.join('; '));
  const q = S.generate(M.rng(78), ctx('lefties'), 'prop'), e2 = [];
  const c = q.steps.find(s => s.key === 'counts'); c.correct = (c.correct + 1) % c.options.length;  // the wrong large counts verdict
  recheck(q, ctx('lefties'), w, e2);
  assert.ok(e2.some(e => /large counts/.test(e)));
  const r = S.generate(M.rng(79), ctx('two-towns'), 'diff'), e3 = [];
  const pr = r.steps.find(s => s.key === 'prob');
  if (pr) { pr.cell.answer = 1 - pr.cell.answer; recheck(r, ctx('two-towns'), w, e3); assert.ok(e3.some(e => /probability key/.test(e))); }
});

test('sampling-distributions: each population has its exact mu and sigma (100,000 draws within 1%)', () => {
  for (const id of ['commute', 'wait', 'geyser', 'heights']) {
    const pop = S.population(S.POPS[id]), q = S.stream(M.rng(5)), xs = [];
    for (let i = 0; i < 100000; i++) xs.push(S.value(q, pop));
    assert.ok(Math.abs(Dist.mean(xs) - pop.mu) < 0.01 * pop.sigma * 3, `${id} mean ${Dist.mean(xs)} vs ${pop.mu}`);
    assert.ok(Math.abs(Dist.sd(xs) / pop.sigma - 1) < 0.01, `${id} sd ${Dist.sd(xs)} vs ${pop.sigma}`);
  }
  const wait = S.population(S.POPS.wait);
  assert.ok(Math.abs(wait.mu - 10) < 1e-9 && Math.abs(wait.sigma - 20 / Math.sqrt(12)) < 1e-9, 'uniform on 0 to 20: mu 10, sigma 20/sqrt(12)');
});

test('sampling-distributions: the simulated SD of x-bar is within 3% of sigma / sqrt(n), its mean near mu', () => {
  for (const [id, n] of [['commute', 4], ['commute', 30], ['geyser', 10], ['heights', 2]]) {
    const pop = S.population(S.POPS[id]), xb = S.simulate(M.rng(n * 31 + 1), pop, n, 20000), th = S.theory(pop, n);
    assert.ok(Math.abs(Dist.sd(xb) / th.sd - 1) < 0.03, `${id} n=${n}: ${Dist.sd(xb)} vs ${th.sd}`);
    assert.ok(Math.abs(Dist.mean(xb) - th.center) < 4 * th.sd / Math.sqrt(20000), `${id} n=${n} mean`);
  }
});

test('sampling-distributions: the simulated SD of p-hat and of a difference match the formulas within 3%', () => {
  const pop = S.population({ kind: 'prop', p: 0.3 }), n = 50, ph = S.simulate(M.rng(3), pop, n, 20000), th = S.theory(pop, n);
  assert.ok(Math.abs(Dist.sd(ph) / th.sd - 1) < 0.03, `p-hat ${Dist.sd(ph)} vs ${th.sd}`);
  assert.ok(Math.abs(Dist.mean(ph) - 0.3) < 4 * th.sd / Math.sqrt(20000));
  const A = S.population(S.POPS.commute), B = S.population(S.POPS.heights), r = M.rng(8), d = [];
  const a = S.simulate(r, A, 10, 20000), b = S.simulate(r, B, 10, 20000);
  for (let i = 0; i < a.length; i++) d.push(a[i] - b[i]);
  const td = S.theoryDiff(S.theory(A, 10), S.theory(B, 10));
  assert.ok(Math.abs(Dist.sd(d) / td.sd - 1) < 0.03, `difference ${Dist.sd(d)} vs ${td.sd}`);
});

test('sampling-distributions: the AP® shape rules', () => {
  const sk = S.population(S.POPS.commute), no = S.population(S.POPS.heights);
  assert.equal(S.theory(sk, 29).normal, false);
  assert.equal(S.theory(sk, 30).normal, true);
  assert.equal(S.theory(no, 2).normal, true);
  const p = S.population({ kind: 'prop', p: 0.1 });
  assert.equal(S.theory(p, 99).normal, false);   // np = 9.9
  assert.equal(S.theory(p, 100).normal, true);   // np = 10
});
