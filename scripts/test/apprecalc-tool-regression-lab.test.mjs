/* Regression lab: its model (precalculus/assets/tools/math/regression-lab.js)
   and its validator (scripts/lib/apprecalc-tool-checks/regression-lab.mjs).
   OWNED BY THIS TOOL ONLY (builder T1). The shipped data passes (300 problems
   per context, keys from an independent QR least squares); fits against hand
   values (exact data recovered exactly); the residual plot reads a pattern
   only where there is one; calculator answers graded by the three-decimal
   rule with the rounded-constants slip named; planted mistakes caught. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { runtime } from '../lib/apprecalc-tool-checks/_shared.mjs';
import { check, exploreProblems, ownFit, qrLsq } from '../lib/apprecalc-tool-checks/regression-lab.mjs';
import { loadMap, ROOT } from '../lib/apprecalc-build.mjs';

const { M, model } = runtime('regression-lab');
const data = () => JSON.parse(readFileSync(join(ROOT, 'precalculus', 'data', 'tools', 'regression-lab.json'), 'utf8'));
const plain = s => String(s).replace(/<annotation[\s\S]*?<\/annotation>/g, '').replace(/<span class="sr-only">[\s\S]*?<\/span>/g, '').replace(/<[^>]+>/g, '');

test('regression-lab: the page entry is wired (Premium) and the shipped data passes its validator', () => {
  const pages = JSON.parse(readFileSync(join(ROOT, 'precalculus', 'data', 'pages.json'), 'utf8'));
  const entry = pages.tools.find(t => t.slug === 'regression-lab');
  assert.ok(entry && entry.studio === true && entry.premium === 'tools');
  assert.equal(data().topic, entry.topic);
  assert.deepEqual(check(data(), loadMap()), []);
  const map = loadMap();
  assert.ok(check({ ...data(), datasets: [{ id: 'tides', topic: 'model-construction' }] }, map).some(e => /unknown data set/.test(e)));
});

test('regression-lab: exact data are recovered, and the forms are the calculator\'s', () => {
  assert.deepEqual(exploreProblems(model), []);
  const xs = [1, 2, 3, 4, 5, 6, 7, 8];
  const near = (a, b) => assert.ok(Math.abs(a - b) < 1e-8, a + ' vs ' + b);
  let F = model.fit('linear', xs, xs.map(x => 3 * x - 2)); near(F.k[0], 3); near(F.k[1], -2); near(F.sse, 0);
  F = model.fit('quartic', xs, xs.map(x => 0.5 * x ** 4 - x ** 3 + 2 * x - 7)); [0.5, -1, 0, 2, -7].forEach((c, i) => near(F.k[i], c));
  F = model.fit('exponential', xs, xs.map(x => 40 * 0.8 ** x)); near(F.k[0], 40); near(F.k[1], 0.8);
  F = model.fit('logarithmic', xs, xs.map(x => 5 + 2 * Math.log(x))); near(F.k[0], 5); near(F.k[1], 2);
  const ys = xs.map(x => 2 * Math.sin(0.9 * x + 0.4) + 6);
  F = model.fit('sinusoidal', xs, ys); assert.ok(F.sse < 1e-12, 'a sinusoid is recovered'); near(F.k[0], 2); near(F.k[1], 0.9); near(F.k[3], 6);
  assert.equal(model.fit('exponential', xs, xs.map(x => x - 3)), null, 'ExpReg needs y > 0');
  assert.equal(model.fit('logarithmic', [0, 1, 2, 3, 4], [1, 2, 3, 4, 5]), null, 'LnReg needs x > 0');
  assert.equal(model.eqTex('exponential', [40, 0.8]), 'y = 40.000(0.800)^{x}');
  // the validator's QR agrees with a hand line
  const c = qrLsq([[1, 1], [2, 1], [3, 1]], [2, 4, 7]); near(c[0], 2.5); near(c[1], -2 / 3);
  assert.ok(ownFit('linear', [1, 2, 3], [2, 4, 7]));
});

test('regression-lab: the residual plot reads a pattern only where there is one', () => {
  const xs = Array.from({ length: 12 }, (_, i) => i + 1);
  const curved = model.fit('linear', xs, xs.map(x => x * x));
  assert.ok(model.pattern(xs, curved.res).pattern, 'a line through a parabola leaves a U of residuals');
  const r = M.rng(5), noisy = xs.map(x => 2 * x + 3 + (r() - 0.5));
  // alternating signs: no pattern
  assert.equal(model.pattern(xs, xs.map((x, i) => (i % 2 ? 1 : -1))).pattern, false);
  assert.ok(model.fit('linear', xs, noisy));
});

test('regression-lab: three decimals, the rounded-constants slip, same seed same problem', () => {
  for (const kind of model.KINDS) {
    const ctx = { id: kind, topic: 't', kind };
    assert.equal(model.generate(M.rng(8), ctx).text, model.generate(M.rng(8), ctx).text, kind);
  }
  let named = 0;
  for (let i = 1; i < 80; i++) {
    const p = model.generate(M.rng(i), { id: 'e', topic: 't', kind: 'exponential' }), s = p.steps.find(x => x.key === 'p'), A = s.cell.answer;
    assert.ok(M.diagnose(s.cell, M.r3(A)).ok && M.diagnose(s.cell, M.t3(A)).ok, 'rounded or truncated to three decimals is right');
    const k = p.values.k, rounded = M.round(k[0], 2) * Math.pow(M.round(k[1], 2), p.values.x0), d = M.diagnose(s.cell, rounded);
    if (!d.ok && d.why && /rounded/.test(plain(d.why))) named++;
  }
  assert.ok(named > 20, 'the rounded-constants slip is named');
  const res = model.generate(M.rng(3), { id: 'r', topic: 't', kind: 'residual' }), st = res.steps[0];
  assert.match(plain(M.diagnose(st.cell, -st.cell.answer).why), /actual − predicted/);
});

test('regression-lab: the validator catches planted mistakes', () => {
  const g0 = model.generate;
  try {
    model.generate = (r, c, t) => { const p = g0(r, c, t); if (p.type === 'linear') p.steps[2].cell.answer = M.r3(p.steps[2].cell.answer) + 0.01; return p; };
    assert.ok(check(data(), loadMap()).some(e => /prediction key/.test(e)));
    model.generate = (r, c, t) => { const p = g0(r, c, t); if (p.type === 'linear') p.steps[0].cell.abs = 0.01; return p; };
    assert.ok(check(data(), loadMap()).some(e => /three decimals/.test(e)));
  } finally { model.generate = g0; }
  const f0 = model.fit;
  try {
    model.fit = (k, xs, ys) => { const F = f0(k, xs, ys); if (F && k === 'quadratic') F.k = F.k.map(c => c * 1.001); return F; };
    assert.ok(exploreProblems(model).some(e => /QR gives/.test(e)));
  } finally { model.fit = f0; }
});
