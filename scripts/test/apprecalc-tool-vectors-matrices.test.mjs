/* Vectors and matrices: its model (precalculus/assets/tools/math/vectors-matrices.js)
   and its validator (scripts/lib/apprecalc-tool-checks/vectors-matrices.mjs).
   OWNED BY THIS TOOL ONLY (builder T4). The page entry (Unit 4, beyond the
   exam); same seed, same problem; presets and helpers against hand values;
   every drill key against an independent computation; the named slips
   (rows for columns, ad + bc, Δx/Δy, reciprocal entries); no calculus
   wording; the shipped data passing; planted mistakes caught. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { runtime } from '../lib/apprecalc-tool-checks/_shared.mjs';
import { check, presetProblems } from '../lib/apprecalc-tool-checks/vectors-matrices.mjs';
import { loadMap, ROOT } from '../lib/apprecalc-build.mjs';

const { M, model } = runtime('vectors-matrices');
const data = () => JSON.parse(readFileSync(join(ROOT, 'precalculus', 'data', 'tools', 'vectors-matrices.json'), 'utf8'));
const plain = s => String(s).replace(/<annotation[\s\S]*?<\/annotation>/g, '').replace(/<[^>]+>/g, '');
const near = (a, b, e = 1e-9) => Math.abs(a - b) <= e;

test('vectors-matrices: page entry wired to a Unit 4 topic, marked beyond the exam', () => {
  assert.ok(model && !model.stub);
  const pages = JSON.parse(readFileSync(join(ROOT, 'precalculus', 'data', 'pages.json'), 'utf8'));
  const entry = pages.tools.find(t => t.slug === 'vectors-matrices'), map = loadMap();
  assert.ok(entry && entry.studio === true && entry.topic === data().topic);
  assert.equal(map.topicById(entry.topic).chapter, 'unit-4');
  assert.match(entry.desc, /Beyond the exam/);
  assert.match(data().intro, /Beyond the exam/);
});

test('vectors-matrices: the shipped data passes its validator (300 problems per context, keys recomputed)', () => {
  assert.deepEqual(check(data(), loadMap()), []);
});

test('vectors-matrices: presets and helpers match hand values', () => {
  assert.deepEqual(presetProblems(model), []);
  assert.equal(model.det([[2, 1], [4, 2]]), 0);
  assert.equal(model.inverse([[2, 1], [4, 2]]), null);
  assert.deepEqual([...model.inverse([[2, 1], [1, 1]]).map(r => [...r])], [[1, -1], [-1, 2]]);
  assert.deepEqual([...model.apply([[0, -1], [1, 0]], [2, 1])], [-1, 2]);
  assert.equal(model.dot([1, 2], [-2, 1]), 0);
  assert.equal(model.rootTex(148), '2\\sqrt{37}'); assert.equal(model.rootTex(25), '5');
  assert.equal(model.frac(-6, 4), '-\\frac{3}{2}');
  assert.equal(model.dirWords(-1, 2), 'left and up');
  const R = model.avgRates(model.PATHS.line, 0, 2);
  assert.ok(near(R.rx, 1.5) && near(R.ry, -1) && near(R.slope, -2 / 3));
});

test('vectors-matrices: same seed, same problem; keys independent; the slips are named', () => {
  for (const kind of model.KINDS) {
    const ctx = { id: kind, topic: 't', kind };
    assert.equal(model.generate(M.rng(7), ctx).text, model.generate(M.rng(7), ctx).text, kind);
  }
  let sing = 0;
  for (let i = 1; i <= 200; i++) {
    const t = model.generate(M.rng(i), { id: 'transform', topic: 't', kind: 'transform' }), A = t.values.A, p = t.values.p;
    const qx = t.steps.find(s => s.key === 'qx');
    assert.equal(qx.cell.answer, A[0][0] * p[0] + A[0][1] * p[1]);
    const colsFirst = A[0][0] * p[0] + A[1][0] * p[1];
    if (colsFirst !== qx.cell.answer) assert.match(plain(M.diagnose(qx.cell, colsFirst).why), /column/);
    const ar = t.steps.find(s => s.key === 'area'), plus = A[0][0] * A[1][1] + A[0][1] * A[1][0];
    if (Math.abs(plus) !== ar.cell.answer) assert.match(plain(M.diagnose(ar.cell, plus).why), /subtracts/);
    const inv = model.generate(M.rng(i), { id: 'inverse', topic: 't', kind: 'inverse' }), B = inv.values.A, D = B[0][0] * B[1][1] - B[0][1] * B[1][0];
    if (!D) { sing++; assert.match(plain(inv.steps.find(s => s.key === 'inv').options[0]), /^No/); }
    else { const i11 = inv.steps.find(s => s.key === 'i11'); assert.ok(near(i11.cell.answer, B[1][1] / D)); }
    const pr = model.generate(M.rng(i), { id: 'prates', topic: 't', kind: 'prates' }), m = pr.steps.find(s => s.key === 'm'), v = pr.values;
    const dx = model.pEval(v.cx, v.t2) - model.pEval(v.cx, v.t1), dy = model.pEval(v.cy, v.t2) - model.pEval(v.cy, v.t1);
    assert.ok(near(m.cell.answer, dy / dx));
    if (!near(dx / dy, dy / dx)) assert.match(plain(M.diagnose(m.cell, dx / dy).why), /upside down/);
    for (const q of [t, inv, pr]) for (const s of q.steps) for (const mm of (s.cell && s.cell.mistakes) || []) assert.doesNotMatch(plain(mm.why), /derivative|instantaneous/i);
  }
  assert.ok(sing > 10, `singular matrices in 200 seeds: ${sing}`);
});

test('vectors-matrices: a planted wrong key is caught', () => {
  const real = model.generate;
  model.generate = (r, c, t) => { const p = real(r, c, t); if (p.type === 'transform') { const s = p.steps.find(x => x.key === 'area'); s.cell.answer = p.values.det + 100; s.cell.mistakes = []; } return p; };
  try { const d = data(); assert.ok(check({ ...d, contexts: d.contexts.filter(c => c.kind === 'transform') }, loadMap()).some(e => /area keyed/.test(e))); }
  finally { model.generate = real; }
  assert.ok(check({ ...data(), intro: '<p>No note.</p>' }, loadMap()).some(e => /beyond the exam/.test(e)));
  assert.ok(check({ ...data(), matrices: ['spin'] }, loadMap()).some(e => /unknown matrix/.test(e)));
});
