/* Interval capture: its model (statistics/assets/tools/math/ci-capture.js) and its
   validator (scripts/lib/apstat-tool-checks/ci-capture.mjs). OWNED BY THIS
   TOOL ONLY. Same seed same problem; every key recomputed with ApStatDist
   (the validator, over the shipped data); planted mistakes caught; the
   explore picture's fast intervals equal ApStatDist's ci1prop and ci1mean;
   and the statistical model tests: 10,000 simulated 95% intervals capture
   the parameter 94 to 96% of the time (a t interval from a normal
   population, and a z interval for a proportion with large counts), while
   z* in place of t* at small n falls short. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { runtime } from '../lib/apstat-tool-checks/_shared.mjs';
import { check, recheck } from '../lib/apstat-tool-checks/ci-capture.mjs';
import { loadMap, ROOT } from '../lib/apstat-build.mjs';

const { M, Dist, model: C } = runtime('ci-capture');
const data = JSON.parse(readFileSync(join(ROOT, 'statistics', 'data', 'tools', 'ci-capture.json'), 'utf8'));
const ctx = id => data.contexts.find(c => c.id === id);

test('ci-capture: the validator checks the frame', () => {
  const map = loadMap();
  const ok = { slug: 'ci-capture', kind: 'simulator', topic: 'ci-one-proportion-claims', intro: '<p>x</p>', howItWorks: '<p>x</p>', explore: data.explore, contexts: [{ id: 'c1', topic: 'ci-one-proportion', types: ['prop'], lead: 'A.', who: 'people', yes: 'say yes', popAll: 'all people', p: [0.4, 0.5], ns: [200] }] };
  assert.deepEqual(check(ok, map), []);
  assert.ok(check({ ...ok, topic: 'nope' }, map).some(e => /topic/.test(e)));
  assert.ok(check({ ...ok, slug: 'other' }, map).some(e => /slug/.test(e)));
  assert.ok(check({ ...ok, explore: {} }, map).some(e => /explore/.test(e)));
});

test('ci-capture: the shipped data passes (300 problems per context and type, every key rechecked)', () => {
  assert.deepEqual(check(data, loadMap()), []);
});

test('ci-capture: the same seed gives the same problem, for every type', () => {
  for (const c of data.contexts) for (const t of c.types) {
    const a = C.generate(M.rng(31337), c, t), b = C.generate(M.rng(31337), c, t);
    assert.equal(JSON.stringify(a), JSON.stringify(b), `${c.id} ${t}`);
  }
  const s = { kind: 'prop', p: 0.4, n: 50 };
  assert.deepEqual(C.batch(M.rng(5), s, 30), C.batch(M.rng(5), s, 30));
});

test('ci-capture: planted mistakes are caught', () => {
  const p = C.generate(M.rng(12), ctx('walk'), 'prop'), errs = [];
  p.steps.find(s => s.key === 'crit').cell.answer = 1.645;          // a one-tail z* (wrong at 90%? the test picks any level)
  if (Math.abs(p.given.level - 0.9) > 1e-9) { recheck(p, ctx('walk'), 'planted', errs); assert.ok(errs.some(e => /z\* key/.test(e))); }
  const q = C.generate(M.rng(13), ctx('sleep'), 'mean'), e2 = [];
  q.steps.find(s => s.key === 'crit').cell.answer = Dist.invNorm(1 - (1 - q.given.level) / 2);   // z* for a mean
  recheck(q, ctx('sleep'), 'planted', e2);
  assert.ok(e2.some(e => /t\* key/.test(e)));
  const r = C.generate(M.rng(14), ctx('claim-bike'), 'claim'), e3 = [];
  const cl = r.steps.find(s => s.key === 'claim'); cl.correct = (cl.correct + 1) % cl.options.length;
  recheck(r, ctx('claim-bike'), 'planted', e3);
  assert.ok(e3.some(e => /claim key/.test(e)));
});

test('ci-capture: the fast intervals equal ApStatDist ci1prop and ci1mean', () => {
  const sp = { kind: 'prop', p: 0.3, n: 80 }, sm = { kind: 'mean', mu: 50, sigma: 10, n: 12, shape: 'normal' };
  for (const [s, L] of [[sp, 0.9], [sm, 0.95], [sm, 0.99]]) {
    const smps = C.batch(M.rng(2), s, 200), fast = C.intervals(smps, s, L);
    smps.forEach((m, i) => {
      const iv = s.kind === 'prop' ? Dist.ci1prop(m.est, s.n, L) : Dist.ci1mean(m.est, m.s, s.n, L);
      assert.ok(Math.abs(fast.ivs[i].lo - iv.lo) < 1e-12 && Math.abs(fast.ivs[i].hi - iv.hi) < 1e-12);
      assert.equal(fast.ivs[i].hit, iv.lo <= C.param(s) && C.param(s) <= iv.hi);
    });
  }
});

test('ci-capture: 10,000 simulated 95% intervals capture 94 to 96% of the time', () => {
  const rate = (s, o) => { const smps = C.batch(M.rng(2026), s, 10000); return C.intervals(smps, s, 0.95, o).hits / 10000; };
  const t = rate({ kind: 'mean', mu: 50, sigma: 10, n: 10, shape: 'normal' });
  assert.ok(t >= 0.94 && t <= 0.96, `t interval: ${t}`);
  const z = rate({ kind: 'prop', p: 0.4, n: 500 });
  assert.ok(z >= 0.94 && z <= 0.96, `z interval for p: ${z}`);
  const wrong = rate({ kind: 'mean', mu: 50, sigma: 10, n: 5, shape: 'normal' }, { z: true });
  assert.ok(wrong < 0.92, `z* in place of t* at n = 5 should fall short: ${wrong}`);
});

test('ci-capture: the skewed population has its stated mean and SD', () => {
  const s = { kind: 'mean', mu: 30, sigma: 20, n: 1, shape: 'skewed' }, q = M.rng(4), xs = [];
  for (let i = 0; i < 100000; i++) xs.push(C.value(q, s));
  assert.ok(Math.abs(Dist.mean(xs) - 30) < 0.3, `mean ${Dist.mean(xs)}`);
  assert.ok(Math.abs(Dist.sd(xs) / 20 - 1) < 0.015, `sd ${Dist.sd(xs)}`);
});
