/* Elasticity Lab: its model (microeconomics/assets/tools/math/elasticity-lab.js) and its
   validator (scripts/lib/apmicro-tool-checks/elasticity-lab.mjs). OWNED BY THIS TOOL
   ONLY (builder T3). The shipped data passes the full sweep (300 problems per
   context and kind, every key recomputed by hand); a seed gives the same
   problem twice; the model's numbers are their ApMicroCalc recipes and its
   curve is ApMicroGraph's demand; planted mistakes are caught; the grader
   names the slips (supply shifted, demand the wrong way). */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { runtime } from '../lib/apmicro-tool-checks/_shared.mjs';
import { check, recheck, TYPES } from '../lib/apmicro-tool-checks/elasticity-lab.mjs';
import { ROOT } from '../lib/apmicro-build.mjs';

const DATA = JSON.parse(readFileSync(join(ROOT, 'microeconomics', 'data', 'tools', 'elasticity-lab.json'), 'utf8'));
const MAP = JSON.parse(readFileSync(join(ROOT, 'docs', 'apmicro-dependency-map.json'), 'utf8'));
const map = { topicById: id => MAP.topics.find(t => t.id === id) || null };
const ctxOf = id => DATA.contexts.find(c => c.id === id);
const ctxFor = t => DATA.contexts.find(c => c.types.includes(t));

test('elasticity-lab: built, the page script parses, registered free on the Tool Studio', () => {
  const { model } = runtime('elasticity-lab');
  assert.ok(model && typeof model.generate === 'function' && !model.stub);
  assert.doesNotThrow(() => new Function(readFileSync(join(ROOT, 'microeconomics', 'assets', 'tools', 'elasticity-lab.js'), 'utf8')));
  const pages = JSON.parse(readFileSync(join(ROOT, 'microeconomics', 'data', 'pages.json'), 'utf8'));
  const entry = pages.tools.find(t => t.slug === 'elasticity-lab');
  assert.ok(entry && entry.studio === true && !entry.premium, 'free (docs/apmicro-spec.md section 6)');
  assert.equal(entry.topic, 'price-elasticity-demand');
  assert.equal(entry.kind, DATA.kind);
});

test('elasticity-lab: the shipped data passes the frame and the full drill sweep', () => {
  assert.deepEqual(check(DATA, map), []);
  assert.deepEqual([...new Set(DATA.contexts.flatMap(c => c.types))].sort(), [...TYPES].sort());
  assert.equal(map.topicById(ctxOf('ped').topic).ced, '2.3');
  assert.equal(map.topicById(ctxOf('other').topic).ced, '2.5');
});

test('elasticity-lab: a seed gives the same problem twice', () => {
  const { M, model } = runtime('elasticity-lab');
  for (const t of TYPES) for (const seed of [13, 7932, 99991]) {
    const a = model.generate(M.rng(seed), ctxFor(t), t), b = model.generate(M.rng(seed), ctxFor(t), t);
    assert.deepEqual(JSON.parse(JSON.stringify(a)), JSON.parse(JSON.stringify(b)));
  }
});

test('elasticity-lab: the curve is ApMicroGraph\'s demand; numbers are ApMicroCalc recipes', () => {
  const { Graph, Calc, model } = runtime('elasticity-lab');
  const s = { kP: 2, kQ: 10 }, D = Graph.find(Graph.curves({ kind: 'sd' }, {}), 'D');
  for (const p of [2, 6, 10, 14, 18]) {
    const pt = model.at(s, p);
    assert.ok(Math.abs(Graph.y(D, pt.q / s.kQ) * s.kP - p) < 1e-9, `on D at ${p}`);
    assert.equal(pt.tr, Calc.evaluate({ fn: 'totalRevenue', args: [p, pt.q] }));
    assert.equal(model.word(pt.e), p > 10 ? 'elastic' : p < 10 ? 'inelastic' : 'unit elastic');
  }
  const a = model.arc(s, 14, 12, 'start'), b = model.arc(s, 14, 12, 'midpoint');
  assert.equal(a.e, Calc.evaluate({ fn: 'priceElasticity', args: [30, 40, 14, 12] }));
  assert.equal(b.e, Calc.evaluate({ fn: 'midpointElasticity', args: [30, 40, 14, 12] }));
  // Total revenue is largest at the midpoint.
  const trs = [2, 4, 6, 8, 10, 12, 14, 16, 18].map(p => model.at(s, p).tr);
  assert.equal(Math.max(...trs), model.at(s, 10).tr);
  // income and cross: the shift reproduces the elasticity it was built from
  for (const e of [0.5, 1.8, -0.6]) assert.ok(Math.abs(Calc.evaluate({ fn: 'incomeElasticity', args: [50, model.shift(e, 20, 50), 40000, 48000] }) - e) < 1e-9);
});

test('elasticity-lab: planted mistakes are caught', () => {
  const { M, model } = runtime('elasticity-lab');
  const p = model.generate(M.rng(9), ctxOf('ped'), 'coef'), bad = JSON.parse(JSON.stringify(p));
  bad.steps.find(s => s.key === 'e').cell.answer = 1 / p.answer.A.e;
  assert.ok(recheck(bad, ctxOf('ped'), 'x').some(e => /step e/.test(e)));
  const q = model.generate(M.rng(10), ctxOf('other'), 'income'), bad2 = JSON.parse(JSON.stringify(q));
  const g = bad2.steps.find(s => s.key === 'graph'); g.spec.key.shifts[0].dir = g.spec.key.shifts[0].dir === 'right' ? 'left' : 'right';
  assert.ok(recheck(bad2, ctxOf('other'), 'x').some(e => /shift keyed/.test(e)));
  // The sign of income elasticity is part of the answer: its absolute value is a named slip.
  const neg = (() => { for (let i = 1; i < 200; i++) { const r = model.generate(M.rng(i), ctxOf('other'), 'income'); if (r.answer.e < 0) return r; } })();
  const d = M.diagnose(neg.steps[0].cell, -neg.answer.e);
  assert.equal(d.ok, false); assert.match(d.why, /sign/);
});

test('elasticity-lab: the grader names the slips on a shift step', () => {
  const { M, Grade, model } = runtime('elasticity-lab');
  const p = model.generate(M.rng(5), ctxOf('other'), 'cross');
  const g = p.steps.find(s => s.kind === 'graph');
  if (!g) return;
  const d = g.spec.key.shifts[0].dir === 'right' ? 1 : -1;
  const viaS = Grade.graph(g.spec, { shifts: { S: d }, labels: {} });
  assert.equal(viaS.correct, false); assert.match(viaS.slip, /demand, not supply/);
  assert.equal(Grade.graph(g.spec, { shifts: { D: d }, labels: {} }).correct, true);
});
