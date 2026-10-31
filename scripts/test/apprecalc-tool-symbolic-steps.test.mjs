/* Symbolic steps: its model (precalculus/assets/tools/math/symbolic-steps.js) and its
   validator (scripts/lib/apprecalc-tool-checks/symbolic-steps.mjs). OWNED BY THIS
   TOOL ONLY (builder T2). The shipped data passes (300 problems per context,
   every key rebuilt from the problem's parameters); the page entry is wired;
   hand values; same seed same problem; the named Q4 slips (a log rule run
   backward, the impossible root of a quadratic in e^x, a domain-rejected log
   root, an angle outside the principal range, tan^-1 as 1/tan, a missed
   second solution); planted mistakes caught. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { runtime } from '../lib/apprecalc-tool-checks/_shared.mjs';
import { check, exploreProblems } from '../lib/apprecalc-tool-checks/symbolic-steps.mjs';
import { loadMap, ROOT } from '../lib/apprecalc-build.mjs';

const { M, model } = runtime('symbolic-steps');
const data = () => JSON.parse(readFileSync(join(ROOT, 'precalculus', 'data', 'tools', 'symbolic-steps.json'), 'utf8'));
const gen = (kind, i) => model.generate(M.rng(i), { id: kind, topic: 't', kind });
const step = (p, k) => p.steps.find(s => s.key === k);

test('symbolic-steps: the page entry is wired and the shipped data passes its validator', () => {
  const pages = JSON.parse(readFileSync(join(ROOT, 'precalculus', 'data', 'pages.json'), 'utf8'));
  const entry = pages.tools.find(t => t.slug === 'symbolic-steps');
  assert.ok(entry && entry.studio === true && entry.topic === data().topic && entry.kind === 'drill');
  assert.ok(!model.stub);
  assert.deepEqual(check(data(), loadMap()), []);
  // the trig contexts unlock with Unit 3
  const map = loadMap();
  for (const c of data().contexts.filter(c => /trig/.test(c.kind))) assert.equal(map.topicById(c.topic).chapter, 'unit-3');
});

test('symbolic-steps: hand values and the Explore checker', () => {
  assert.deepEqual(exploreProblems(model), []);
  assert.equal(model.ang(4, 6).s, '2pi/3'); assert.equal(model.ang(-1, 4).t, '-\\frac{\\pi}{4}');
  // ln(x^2) and 2 ln x: equal for x > 0 only
  const r = model.compareForms('ln(x^2)', '2ln(x)', [-3, 3]);
  assert.equal(r.pieces.length, 2); assert.equal(r.pieces[0].s, 'a'); assert.equal(r.pieces[1].s, 'same');
});

test('symbolic-steps: same seed, same problem; the named slips', () => {
  for (const kind of model.KINDS) assert.equal(JSON.stringify(gen(kind, 11)), JSON.stringify(gen(kind, 11)), kind);
  const seen = { neg: 0, two: 0, tan: 0 };
  for (let i = 1; i < 150; i++) {
    const l = gen('single-log', i), B = step(l, 'B');
    assert.match(M.diagnoseExpr(B.cell, B.cell.expr.mistakes[0].expr).why, /PRODUCT, not of a sum/);
    const q = gen('quad-ex', i), cnt = step(q, 'count');
    if (q.values.u1 * q.values.u2 < 0) { seen.neg++; assert.match(M.diagnose(cnt.cell, 2).why, /no solution: \$e\^x > 0\$/); }
    else seen.two++;
    const g = gen('log-eq', i);
    assert.match(M.diagnose(step(g, 'x').cell, g.values.r2).why, /Reject it/);
    const t = gen('trig-eq', i);
    assert.match(M.diagnose(step(t, 'count').cell, 1).why, /second solution/);
    const v = gen('inv-trig', i);
    if (v.values.fn === 'arctan') { seen.tan++; const val = model.VAL[v.values.key].v; assert.match(M.diagnose(step(v, 'v').cell, 1 / Math.tan(val)).why || '', /INVERSE function/); }
    if (v.values.fn === 'arcsin' && v.values.ang < 0) assert.match(M.diagnose(step(v, 'v').cell, Math.PI - v.values.ang).why, /outside the range/);
  }
  assert.ok(seen.neg > 20 && seen.two > 20 && seen.tan > 10);
  // a typed exact answer is graded right: ln(3), 4pi/3
  const q = gen('quad-ex', 1), x1 = step(q, 'x1');
  assert.ok(M.diagnose(x1.cell, Math.log(Math.min(...[q.values.u1, q.values.u2].filter(u => u > 0)))).ok);
});

test('symbolic-steps: a planted wrong key is caught', () => {
  const real = model.generate, map = loadMap(), d = data();
  try {
    model.generate = (r, c, t) => { const p = real(r, c, t); if (p.type === 'quad-ex') step(p, 'count').cell.answer = 2, step(p, 'count').cell.mistakes = []; return p; };
    assert.ok(check({ ...d, contexts: d.contexts.filter(c => c.kind === 'quad-ex') }, map).some(e => /real solutions|own key/.test(e)));
    model.generate = (r, c, t) => { const p = real(r, c, t); if (p.type === 'single-log') { const B = step(p, 'B'); B.cell.expr.answer = B.cell.expr.mistakes[0].expr; B.cell.expr.mistakes = []; } return p; };
    assert.ok(check({ ...d, contexts: d.contexts.filter(c => c.kind === 'single-log') }, map).some(e => /single log/.test(e)));
  } finally { model.generate = real; }
});
