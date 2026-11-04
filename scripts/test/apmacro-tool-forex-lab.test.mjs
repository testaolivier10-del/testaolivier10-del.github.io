/* Foreign exchange lab: its model (macroeconomics/assets/tools/math/forex-lab.js)
   and its validator (scripts/lib/apmacro-tool-checks/forex-lab.mjs). OWNED BY
   THIS TOOL ONLY (builder T4). The shipped data passes the full sweep (300
   problems per context and kind, every key recomputed); a seed gives the
   same problem twice; the model's numbers follow their ApMacroCalc recipes,
   the axis reads "others per unit", the mirror market is exact; planted
   mistakes (a flipped ratio, the wrong curve, a wrong mirror) are caught. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { runtime } from '../lib/apmacro-tool-checks/_shared.mjs';
import { check, recheck, TYPES } from '../lib/apmacro-tool-checks/forex-lab.mjs';
import { ROOT } from '../lib/apmacro-build.mjs';

const DATA = JSON.parse(readFileSync(join(ROOT, 'macroeconomics', 'data', 'tools', 'forex-lab.json'), 'utf8'));
const MAP = JSON.parse(readFileSync(join(ROOT, 'docs', 'apmacro-dependency-map.json'), 'utf8'));
const map = { topicById: id => MAP.topics.find(t => t.id === id) || null };
const ctxOf = id => DATA.contexts.find(c => c.id === id);

test('forex-lab: registers, the page script parses, it is registered on the Tool Studio', () => {
  const { model } = runtime('forex-lab');
  assert.ok(model && typeof model.generate === 'function' && !model.stub, 'ApMacroMath.forexLab is built');
  assert.doesNotThrow(() => new Function(readFileSync(join(ROOT, 'macroeconomics', 'assets', 'tools', 'forex-lab.js'), 'utf8')));
  const pages = JSON.parse(readFileSync(join(ROOT, 'macroeconomics', 'data', 'pages.json'), 'utf8'));
  const entry = pages.tools.find(t => t.slug === 'forex-lab');
  assert.ok(entry && entry.studio === true);
  assert.equal(entry.topic, 'foreign-exchange-market');
  assert.equal(DATA.topic, entry.topic);
});

test('forex-lab: the shipped data passes the frame and the full drill sweep', () => {
  assert.deepEqual(check(DATA, map), []);
  assert.deepEqual([...new Set(DATA.contexts.flatMap(c => c.types))].sort(), [...TYPES].sort());
  for (const c of DATA.contexts) assert.equal(map.topicById(c.topic).chapter, 'unit-6', c.id);
});

test('forex-lab: a seed gives the same problem twice', () => {
  const { M, model } = runtime('forex-lab');
  for (const c of DATA.contexts) for (const seed of [13, 7932, 99991]) {
    const a = model.generate(M.rng(seed), c, c.types[0]), b = model.generate(M.rng(seed), c, c.types[0]);
    assert.deepEqual(JSON.parse(JSON.stringify(a)), JSON.parse(JSON.stringify(b)));
  }
});

test('forex-lab: numbers are their recipes; the axis and the mirror market are right', () => {
  const { M, Graph, Calc, model } = runtime('forex-lab');
  for (let i = 1; i <= 60; i++) {
    const p = model.generate(M.rng(i * 17), ctxOf('axis'), 'axis'), a = p.answer;
    assert.equal(p.steps.find(s => s.key === 'inverse').cell.answer, Calc.evaluate({ fn: 'inverseRate', args: [a.p2] }));
    assert.equal(p.steps.find(s => s.key === 'convert').cell.answer, Calc.evaluate({ fn: 'convert', args: [a.A, a.p2] }));
  }
  assert.equal(Graph.labelText('fxPrice', { currency: 'euro', other: 'dollar' }), 'Price of the euro (dollars per euro)');
  // The display rate of the mirror market is exactly the inverse (heights y and 10 - y).
  for (const y of [3, 4.5, 5, 6, 7.25]) assert.ok(Math.abs(model.rate(1.1, y) * model.rate(1 / 1.1, 10 - y) - 1) < 1e-12);
  // More demand for X is more supply of Y: X up exactly when Y down.
  for (const s of model.SHOCKS) {
    const shX = { [s.curve]: s.dir }, shY = { [model.mirror(s.curve)]: s.dir };
    const eX = Graph.eq({ kind: 'forex', names: { currency: 'x', other: 'y' } }, shX), eY = Graph.eq({ kind: 'forex', names: { currency: 'y', other: 'x' } }, shY);
    assert.ok(Math.abs((eX[1] - 5) + (eY[1] - 5)) < 1e-9, `${s.id}: mirror price`);
    assert.equal(Math.sign(eX[1] - 5), model.value(s.curve, s.dir), `${s.id}: value`);
  }
  for (const p of model.PAIRS) assert.ok(p[2].length >= 3 && p[3].length >= 3 && model.CUR[p[0]] && model.CUR[p[1]], p.join(' '));
  // The drills use invented countries and currencies (authoring guide, "Invented countries").
  for (const p of model.DRILL_PAIRS) assert.ok(p[2].length >= 3 && p[3].length >= 3 && model.DRILL_CUR[p[0]] && model.DRILL_CUR[p[1]], p.join(' '));
  for (let i = 1; i <= 20; i++) assert.ok(model.DRILL_CUR[model.generate(M.rng(i), DATA.contexts[i % DATA.contexts.length]).answer.X], 'a drill names an invented currency');
});

test('forex-lab: the grader catches the flipped ratio and the wrong curve', () => {
  const { M, Grade, Graph, model } = runtime('forex-lab');
  const p = model.generate(M.rng(5), ctxOf('axis'), 'axis'), g = p.steps[0].spec;
  const ok = { x: 'fxQuantity', y: 'fxPrice', D: 'D', S: 'S' };
  assert.equal(Grade.graph(g, { labels: ok }).correct, true);
  const flipped = Grade.graph(g, { labels: { ...ok, y: 'fxPriceFlipped' } });
  assert.equal(flipped.correct, false);
  assert.match(flipped.slip, /per unit of this one/);
  const q = model.generate(M.rng(6), ctxOf('shifts'), 'shift'), gs = q.steps[0].spec, k = gs.key.shifts[0];
  const other = k.curve === 'D' ? 'S' : 'D', dir = k.dir === 'right' ? 1 : -1;
  const r = Grade.graph(gs, { shifts: { [other]: dir }, eq: Graph.eq(gs, { [other]: dir }) });
  assert.equal(r.correct, false);
  assert.match(r.slip, /Here the change is in what/);
});

test('forex-lab: planted mistakes are caught by the recheck', () => {
  const { M, model } = runtime('forex-lab');
  const c = ctxOf('shifts');
  const p = model.generate(M.rng(21), c, 'shift');
  p.steps[2].correct = (p.steps[2].correct + 1) % 4;
  assert.ok(recheck(p, c, 'planted').some(e => /mirror keyed/.test(e)));
  const q = model.generate(M.rng(22), c, 'shift');
  q.steps[0].spec.key.shifts[0].curve = q.steps[0].spec.key.shifts[0].curve === 'D' ? 'S' : 'D';
  q.figure.spec = q.steps[0].spec;
  assert.ok(recheck(q, c, 'planted').some(e => /graph key/.test(e)));
  const a = model.generate(M.rng(23), ctxOf('axis'), 'axis');
  a.steps.find(s => s.key === 'inverse').cell.answer = a.answer.p2;
  assert.ok(recheck(a, ctxOf('axis'), 'planted').some(e => /inverse/.test(e)));
  const n = model.generate(M.rng(24), ctxOf('netexports'), 'nx');
  n.steps[2].correct = (n.steps[2].correct + 1) % 4;
  assert.ok(recheck(n, ctxOf('netexports'), 'planted').some(e => /net exports keyed/.test(e)));
  const f = model.generate(M.rng(25), ctxOf('flows'), 'flows');
  f.steps[0].correct = (f.steps[0].correct + 1) % 3;
  assert.ok(recheck(f, ctxOf('flows'), 'planted').some(e => /flow keyed/.test(e)));
  assert.ok(check({ ...DATA, contexts: [{ id: 'x', topic: 'exchange-rates', types: ['axis'], set: 'nope' }] }, map).some(e => /set is one of/.test(e)));
});

test('forex-lab: a real interest rate change says only that, and either side of the market is graded right', () => {
  const { M, Graph, Grade, model } = runtime('forex-lab');
  for (let i = 1; i <= 20; i++) {
    const p = model.generate(M.rng(i * 13), ctxOf('flows'), 'flows'), s = p.steps.find(x => x.kind === 'graph'), g = s.spec;
    assert.match(p.text, /The real interest rate in .* (rises|falls) relative to/);
    assert.doesNotMatch(p.text, /investors buy/, 'no actor named');
    const d = p.answer.dir;
    assert.equal(Grade.graph(g, Graph.keyResponse(g)).correct, true);
    const sh = { S: -d };
    assert.equal(Grade.graph(g, { shifts: sh, eq: Graph.eq(g, sh) }).correct, true, 'supply the other way is accepted');
    const wrong = { S: d };
    assert.equal(Grade.graph(g, { shifts: wrong, eq: Graph.eq(g, wrong) }).correct, false);
  }
});
