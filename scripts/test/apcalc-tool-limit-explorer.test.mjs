/* Limit explorer: its model (calculus/assets/tools/math/limit-explorer.js) and its
   validator (scripts/lib/apcalc-tool-checks/limit-explorer.mjs). OWNED BY THIS
   TOOL ONLY. Same seed same problem, every key recomputed from first
   principles by the validator, planted mistakes caught, the explore gallery's
   limits and checklist right, and the shipped data passing. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { runtime } from '../lib/apcalc-tool-checks/_shared.mjs';
import { check } from '../lib/apcalc-tool-checks/limit-explorer.mjs';
import { loadMap, ROOT } from '../lib/apcalc-build.mjs';

const data = JSON.parse(readFileSync(join(ROOT, 'calculus', 'data', 'tools', 'limit-explorer.json'), 'utf8'));
const map = loadMap();

test('limit-explorer: the model registers ApCalcMath.limitExplorer, and the validator checks the frame', () => {
  const { M, model } = runtime('limit-explorer');
  assert.ok(M && model && typeof model.generate === 'function');
  const ok = { slug: 'limit-explorer', kind: 'simulator', topic: 'limits-from-plots', intro: '<p>x</p>', howItWorks: '<p>x</p>', contexts: [{ id: 'graph', topic: 'limits-from-plots', types: ['graph'] }] };
  assert.deepEqual(check(ok, map), []);
  assert.ok(check({ ...ok, topic: 'nope' }, map).some(e => /topic/.test(e)));
  assert.ok(check({ ...ok, slug: 'other' }, map).some(e => /slug/.test(e)));
  assert.ok(check({ ...ok, contexts: [{ id: 'graph', topic: 'limit-laws', types: ['graph'] }] }, map).some(e => /topic/.test(e)));
});

test('limit-explorer: the shipped data passes (300 seeds per kind, every key recomputed)', () => {
  assert.deepEqual(check(data, map), []);
  assert.equal(data.contexts.length, 12);
});

test('limit-explorer: same seed, same problem; every kind generates', () => {
  const { M, model } = runtime('limit-explorer');
  for (const c of data.contexts) {
    const a = model.generate(M.rng(4242), c, c.types[0]), b = model.generate(M.rng(4242), c, c.types[0]);
    assert.equal(a.text, b.text);
    assert.deepEqual(a.steps.map(s => s.cell ? s.cell.answer : s.correct), b.steps.map(s => s.cell ? s.cell.answer : s.correct));
    assert.equal(a.type, c.types[0]);
  }
});

test('limit-explorer: a planted wrong key is caught by the validator', () => {
  const { model } = runtime('limit-explorer');
  const orig = model.generate;
  const plant = (type, fn) => { model.generate = (r, c, t) => { const p = orig(r, c, t); fn(p); return p; }; try { return check({ ...data, contexts: data.contexts.filter(c => c.id === type) }, map); } finally { model.generate = orig; } };
  // A graph's left-hand limit off by one.
  assert.ok(plant('graph', p => { if (p.type === 'graph') p.steps[0].cell.answer += 1; }).some(e => /graph.*step left keys/.test(e)));
  // The IVT count off by one.
  assert.ok(plant('ivt', p => { if (p.type === 'ivt') p.steps[1].cell.answer += 1; }).some(e => /ivt.*count/.test(e)));
  // A classify item keyed to the wrong kind.
  assert.ok(plant('classify', p => { if (p.type === 'classify') p.steps[0].correct = (p.steps[0].correct + 1) % 4; }).some(e => /keyed kind/.test(e)));
  // A limit at infinity keyed to the wrong option.
  assert.ok(plant('infinity', p => { if (p.type === 'infinity') { const s = p.steps[1]; s.correct = (s.correct + 1) % s.options.length; } }).some(e => /pinf keyed/.test(e)));
  // An algebra simplification that is not equal to f.
  assert.ok(plant('algebra', p => { if (p.type === 'algebra') p.steps[1].cell.expr.answer += ' + 1'; }).some(e => /simplified form|graded wrong/.test(e)));
});

test('limit-explorer: the gallery limits, checklist and fill are right', () => {
  const { model } = runtime('limit-explorer');
  const g = id => model.entry(id);
  // hole: f(1) undefined, limit 2, removable; filling makes it continuous
  let c = model.check(g('hole'), false);
  assert.deepEqual([c.defined, c.exists, c.equal, c.type, c.fails], [false, true, false, 'removable', 'defined']);
  c = model.check(g('hole'), true);
  assert.ok(c.continuous);
  // a point out of place: defined and limit exists, but unequal
  c = model.check(g('move'), false);
  assert.deepEqual([c.defined, c.exists, c.equal, c.fails], [true, true, false, 'equal']);
  assert.ok(Math.abs(g('move').f(2 + 1e-7) - 4) < 1e-5);
  // jump: limit does not exist
  c = model.check(g('jump'), false);
  assert.deepEqual([c.exists, c.type, c.fails], [false, 'jump', 'exists']);
  assert.ok(Math.abs(g('jump').f(1 - 1e-9) - 2) < 1e-6 && g('jump').f(1) === 3);
  // vertical asymptote and oscillation
  assert.equal(model.check(g('vasym'), false).type, 'infinite');
  assert.ok(g('vasym').f(2 - 1e-6) < -1e5 && g('vasym').f(2 + 1e-6) > 1e5);
  assert.equal(model.check(g('osc'), false).type, 'oscillating');
  // squeeze: trapped between -|x| and |x|
  for (let x = -1; x <= 1; x += 0.001) if (x !== 0) assert.ok(Math.abs(g('squeeze').f(x)) <= Math.abs(x) + 1e-15);
  // at infinity: 2 at both ends
  assert.ok(Math.abs(g('inf').f(1e9) - 2) < 1e-8 && Math.abs(g('inf').f(-1e9) - 2) < 1e-8);
});

test('limit-explorer: zoom windows, table rows and labels', () => {
  const { model } = runtime('limit-explorer');
  const e = model.entry('hole');
  // tracers at a ± 10^-z; table rows at a ± 1, 0.1, ... appear one per power of ten
  assert.ok(Math.abs(model.view(e, 2).h - 0.01) < 1e-15);
  assert.equal(model.rows(e, 0).length, 2);
  assert.equal(model.rows(e, 3).length, 5);
  assert.equal(model.rows(e, 4).length, 5);
  assert.ok(Math.abs(model.rows(e, 3)[3].fl - 1.999) < 1e-12);
  assert.equal(model.zoomLabel(0), '1×');
  assert.equal(model.zoomLabel(3), '1,000×');
  // limits at infinity zoom out
  const inf = model.entry('inf');
  assert.ok(model.view(inf, 3).x[1] > model.view(inf, 0).x[1] * 100);
  assert.equal(model.rows(inf, 2)[3].xr, 1000);
});
