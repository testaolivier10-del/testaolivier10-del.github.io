/* AD-AS lab: its model (macroeconomics/assets/tools/math/adas-lab.js) and its
   validator (scripts/lib/apmacro-tool-checks/adas-lab.mjs). OWNED BY THIS TOOL
   ONLY (builder T4). The shipped data passes the full sweep (300 problems per
   context and kind, every key recomputed); a seed gives the same problem
   twice; the model's numbers follow their ApMacroCalc recipes and its graph
   keys are what ApMacroGraph computes; planted mistakes are caught. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { runtime } from '../lib/apmacro-tool-checks/_shared.mjs';
import { check, recheck, TYPES } from '../lib/apmacro-tool-checks/adas-lab.mjs';
import { ROOT } from '../lib/apmacro-build.mjs';

const DATA = JSON.parse(readFileSync(join(ROOT, 'macroeconomics', 'data', 'tools', 'adas-lab.json'), 'utf8'));
const MAP = JSON.parse(readFileSync(join(ROOT, 'docs', 'apmacro-dependency-map.json'), 'utf8'));
const map = { topicById: id => MAP.topics.find(t => t.id === id) || null };
const ctxOf = id => DATA.contexts.find(c => c.id === id);

test('adas-lab: registers, the page script parses, it is registered on the Tool Studio', () => {
  const { model } = runtime('adas-lab');
  assert.ok(model && typeof model.generate === 'function' && !model.stub, 'ApMacroMath.adasLab is built');
  assert.doesNotThrow(() => new Function(readFileSync(join(ROOT, 'macroeconomics', 'assets', 'tools', 'adas-lab.js'), 'utf8')));
  const pages = JSON.parse(readFileSync(join(ROOT, 'macroeconomics', 'data', 'pages.json'), 'utf8'));
  const entry = pages.tools.find(t => t.slug === 'adas-lab');
  assert.ok(entry && entry.studio === true);
  assert.equal(entry.topic, 'long-run-self-adjustment');
  assert.equal(DATA.topic, entry.topic);
});

test('adas-lab: the shipped data passes the frame and the full drill sweep', () => {
  assert.deepEqual(check(DATA, map), []);
  assert.deepEqual([...new Set(DATA.contexts.flatMap(c => c.types))].sort(), [...TYPES].sort());
  // Each context unlocks with its own unit (Phillips with Unit 5).
  assert.equal(map.topicById(ctxOf('phillips').topic).chapter, 'unit-5');
  for (const id of ['shocks', 'gaps', 'selfadjust']) assert.equal(map.topicById(ctxOf(id).topic).chapter, 'unit-3');
});

test('adas-lab: a seed gives the same problem twice', () => {
  const { M, model } = runtime('adas-lab');
  for (const c of DATA.contexts) for (const seed of [13, 7932, 99991]) {
    const a = model.generate(M.rng(seed), c, c.types[0]), b = model.generate(M.rng(seed), c, c.types[0]);
    assert.deepEqual(JSON.parse(JSON.stringify(a)), JSON.parse(JSON.stringify(b)));
  }
});

test('adas-lab: the model agrees with ApMacroGraph and ApMacroCalc', () => {
  const { M, Graph, Calc, model } = runtime('adas-lab');
  // state(): the crossing is ApMacroGraph's, the Phillips point is (10 - Y, PL), SRPC moves against SRAS.
  for (const [a, s] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1], [2, -1], [1.5, 0.5]]) {
    const st = model.state(a, s), e = Graph.eq({ kind: 'adas' }, { AD: a, SRAS: s });
    assert.deepEqual(st.eq, e);
    assert.ok(Math.abs(st.point[0] - (10 - e[0])) < 1e-9 && st.point[1] === e[1]);
    assert.equal(st.srpc, -s);
    // the point lies on SRPC as shifted
    const srpc = Graph.find(Graph.curves({ kind: 'phillips' }, { SRPC: st.srpc }), 'SRPC');
    assert.ok(Math.abs(Graph.y(srpc, st.point[0]) - st.point[1]) < 1e-9, `point on SRPC for ${a}, ${s}`);
    // long run: SRAS where AD meets LRAS
    assert.ok(Math.abs(Graph.eq({ kind: 'adas' }, { AD: a, SRAS: st.longRunS })[0] - 5) < 1e-9);
    assert.equal(st.gap, Math.abs(e[0] - 5) < 1e-6 ? 'none' : e[0] < 5 ? 'recessionary' : 'inflationary');
  }
  // the gap kind's numbers are their recipes
  for (let i = 1; i <= 50; i++) {
    const p = model.generate(M.rng(i * 31), ctxOf('gaps'), 'gap'), a = p.answer;
    assert.equal(p.steps[0].cell.answer, Calc.evaluate({ fn: 'sub', args: [a.Y, a.yf] }));
    assert.equal(p.steps[2].cell.answer, Calc.evaluate({ fn: 'cyclicalRate', args: [a.u, a.un] }));
  }
  // every cause in the model has a curve and a direction the graph accepts
  for (const s of model.SHOCKS) assert.ok(['AD', 'SRAS'].includes(s.curve) && Math.abs(s.dir) === 1 && s.because.length >= 8, s.id);
});

test('adas-lab: the grader names the reader-report slips on a graph step', () => {
  const { M, Graph, Grade, model } = runtime('adas-lab');
  const p = model.generate(M.rng(4242), ctxOf('selfadjust'), 'selfadjust');
  const g = p.steps.find(s => s.graph).graph, rec = p.answer.gap === 'recessionary';
  const viaAD = Grade.graph(g, { shifts: { AD: rec ? 1 : -1 }, eq: Graph.eq(g, { AD: rec ? 1 : -1 }) });
  assert.equal(viaAD.correct, false);
  assert.match(viaAD.slip, /nominal wages and SRAS/);
  const sh = p.steps.find(s => s.graph);
  assert.equal(sh.options.length, 2); assert.equal(sh.correct, 0);
  const shock = model.generate(M.rng(77), ctxOf('shocks'), 'shock'), gs = shock.steps[0].graph, other = gs.key.shifts[0].curve === 'AD' ? 'SRAS' : 'AD';
  assert.match(Grade.graph(gs, { shifts: { [other]: 1 }, eq: null }).slip, /shifts (AD|SRAS), not (AD|SRAS)/);
});

test('adas-lab: planted mistakes are caught by the recheck', () => {
  const { M, model } = runtime('adas-lab');
  const c = ctxOf('shocks');
  const p = model.generate(M.rng(5), c, 'shock');
  const k = p.steps[0].graph.key.shifts[0];
  k.dir = k.dir === 'right' ? 'left' : 'right';
  assert.ok(recheck(p, c, 'planted').some(e => /graph key/.test(e)));
  const q = model.generate(M.rng(6), c, 'shock');
  q.steps[1].correct = (q.steps[1].correct + 1) % 4;
  assert.ok(recheck(q, c, 'planted').some(e => /outcome keyed/.test(e)));
  const g = model.generate(M.rng(7), ctxOf('gaps'), 'gap');
  g.steps[0].cell.answer = -g.steps[0].cell.answer;
  assert.ok(recheck(g, ctxOf('gaps'), 'planted').some(e => /gap/.test(e)));
  const s = model.generate(M.rng(8), ctxOf('selfadjust'), 'selfadjust');
  s.steps[1].graph.key.shifts = [{ curve: 'AD', dir: s.answer.gap === 'recessionary' ? 'right' : 'left' }];
  s.figure.spec = s.steps[1].graph;
  assert.ok(recheck(s, ctxOf('selfadjust'), 'planted').some(e => /self-adjustment keyed/.test(e)));
  const ph = model.generate(M.rng(9), ctxOf('phillips'), 'phillips');
  ph.steps[2].correct = (ph.steps[2].correct + 1) % 4;
  assert.ok(recheck(ph, ctxOf('phillips'), 'planted').some(e => /long run keyed/.test(e)));
  assert.ok(check({ ...DATA, contexts: [{ id: 'x', topic: 'phillips-curve', types: ['nope'] }] }, map).some(e => /unknown type/.test(e)));
});
