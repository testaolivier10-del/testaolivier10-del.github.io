/* Regression lab: its model (statistics/assets/tools/math/regression-lab.js) and its
   validator (scripts/lib/apstat-tool-checks/regression-lab.mjs). OWNED BY THIS
   TOOL ONLY. The fit against reference values; least squares beats any other
   line; influence and curvature flags; same seed same problem; the strength
   bands the drills claim hold; a planted wrong key is caught; the shipped data
   passes. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runtime } from '../lib/apstat-tool-checks/_shared.mjs';
import { check, recheck, myFit } from '../lib/apstat-tool-checks/regression-lab.mjs';
import { loadMap, ROOT } from '../lib/apstat-build.mjs';

const data = JSON.parse(readFileSync(`${ROOT}/statistics/data/tools/regression-lab.json`, 'utf8'));
const { M, model } = runtime('regression-lab');
const ctxOf = id => data.contexts.find(c => c.id === id);

test('regression-lab: the fit matches reference values (computed by hand)', () => {
  // x 1..5, y 2, 4, 5, 4, 5: b = 0.6, a = 2.2, r = 0.7746, s = 0.8944
  const F = model.fit([1, 2, 3, 4, 5], [2, 4, 5, 4, 5]);
  assert.ok(Math.abs(F.b - 0.6) < 1e-12 && Math.abs(F.a - 2.2) < 1e-12);
  assert.ok(Math.abs(F.r - 0.7745966692) < 1e-9 && Math.abs(F.s - 0.894427191) < 1e-9);
  assert.ok(Math.abs(F.sse - 2.4) < 1e-12);
});

test('regression-lab: no line beats least squares', () => {
  const d = data.explore.datasets[0], F = model.fit(d.xs, d.ys), r = M.rng(3);
  for (let i = 0; i < 2000; i++) {
    const a = F.a + (r() - 0.5) * 20, b = F.b + (r() - 0.5) * 4;
    assert.ok(model.sse(d.xs, d.ys, a, b) >= F.sse - 1e-9);
  }
});

test('regression-lab: outlier, leverage, influence and curvature flags', () => {
  const xs = [1, 2, 3, 4, 5, 6, 7, 8], ys = [3, 5, 7, 9, 11, 13, 15, 17];
  const out = ys.slice(); out[3] = 30;
  assert.ok(model.point(xs, out, 3).outlier);
  const far = xs.concat([30]), fy = ys.concat([5]);
  const q = model.point(far, fy, 8);
  assert.ok(q.leverage && q.influential);
  const st = data.explore.datasets.find(d => d.id === 'stopping'), F = model.fit(st.xs, st.ys);
  assert.ok(Math.abs(model.curvature(st.xs, F.residuals)) > 0.6, 'stopping distances bend');
  const lin = data.explore.datasets.find(d => d.id === 'study'), G = model.fit(lin.xs, lin.ys);
  assert.ok(Math.abs(model.curvature(lin.xs, G.residuals)) < 0.6, 'study time is linear');
});

test('regression-lab: a seed gives the same problem twice', () => {
  for (const c of data.contexts) for (const t of c.types) {
    const a = model.generate(M.rng(4242), c, t), b = model.generate(M.rng(4242), c, t);
    assert.deepEqual(JSON.parse(JSON.stringify(a)), JSON.parse(JSON.stringify(b)));
  }
});

test('regression-lab: the describe drill draws every strength band and its r agrees', () => {
  const c = ctxOf('study-describe'), seen = { strong: 0, moderate: 0, weak: 0 };
  for (let i = 1; i <= 300; i++) {
    const p = model.generate(M.rng(i * 17 + 3), c, 'describe'), F = myFit(p.data.xs, p.data.ys);
    seen[p.data.band]++;
    assert.equal(model.strength(F.r), p.data.band);
  }
  assert.ok(seen.strong > 50 && seen.moderate > 50 && seen.weak > 50);
});

test('regression-lab: a planted wrong key is caught', () => {
  const c = ctxOf('cars-lsrl'), p = model.generate(M.rng(11), c, 'lsrl');
  const e0 = []; recheck(p, c, e0, 'w'); assert.deepEqual(e0, []);
  const bad = JSON.parse(JSON.stringify(p)); bad.steps[0].cell.answer *= 1.02;
  const e1 = []; recheck(bad, c, e1, 'w'); assert.ok(e1.some(e => /\bb\b/.test(e)));
  const r = ctxOf('study-residual'), q = model.generate(M.rng(12), r, 'residual'); q.steps[0].cell.answer = -q.steps[0].cell.answer;
  const e2 = []; recheck(q, r, e2, 'w'); assert.ok(e2.some(e => /resid/.test(e)));
});

test('regression-lab: the shipped data passes its validator', () => {
  assert.deepEqual(check(data, loadMap()), []);
});
