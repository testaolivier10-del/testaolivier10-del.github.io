/* PPC and trade: its model (macroeconomics/assets/tools/math/ppc-trade.js) and its
   validator (scripts/lib/apmacro-tool-checks/ppc-trade.mjs). OWNED BY THIS TOOL ONLY
   (builder T3). The shipped data passes; a seed gives the same problem twice;
   model values match their ApMacroCalc recipes and ApMacroGraph; planted
   mistakes (a flipped input ratio, terms outside the range, a wrong region, a
   recession drawn as a shift) are caught. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { runtime } from '../lib/apmacro-tool-checks/_shared.mjs';
import { check, recheckProblem, exploreProblems, TYPES } from '../lib/apmacro-tool-checks/ppc-trade.mjs';
import { ROOT } from '../lib/apmacro-build.mjs';

const read = p => JSON.parse(readFileSync(join(ROOT, p), 'utf8'));
const dep = read('docs/apmacro-dependency-map.json');
const map = { topicById: id => dep.topics.find(t => t.id === id) || null };
const data = read('macroeconomics/data/tools/ppc-trade.json');
const { M, Calc, Graph, model } = runtime('ppc-trade');
const ctxOf = t => data.contexts.find(c => c.types.includes(t));
const gen = (t, s) => model.generate(M.rng(s), ctxOf(t), t);
const clone = x => JSON.parse(JSON.stringify(x));

test('ppc-trade: registered, page parses, pages.json entry (free), shipped data passes', () => {
  assert.ok(model && !model.stub);
  assert.doesNotThrow(() => new Function(readFileSync(join(ROOT, 'macroeconomics', 'assets', 'tools', 'ppc-trade.js'), 'utf8')));
  const entry = read('macroeconomics/data/pages.json').tools.find(t => t.slug === 'ppc-trade');
  assert.ok(entry && entry.studio === true && !entry.premium);
  assert.equal(entry.topic, 'comparative-advantage');
  assert.deepEqual(check(data, map), []);
});

test('ppc-trade: a seed gives the same problem twice, every type', () => {
  for (const t of TYPES) for (const s of [3, 50, 9001]) assert.deepEqual(gen(t, s), gen(t, s));
});

test('ppc-trade: model values match ApMacroCalc and ApMacroGraph', () => {
  const sc = model.SCENARIOS[0], T = model.trade(sc, 0.75, true);
  assert.equal(T.ocA, Calc.evaluate({ fn: 'opportunityCost', args: [sc.A.y, sc.A.x] }));
  assert.equal(T.ocB, Calc.evaluate({ fn: 'opportunityCost', args: [sc.B.y, sc.B.x] }));
  assert.ok(T.both && T.gain.A > 0 && T.gain.B > 0);
  assert.ok(!model.trade(sc, T.lo, true).both, 'terms equal to one opportunity cost help only one side');
  const p = gen('ppc-point', 21);
  assert.equal(Graph.region(p.fig.graph, {}, p.values.point), p.values.region);
  const o = gen('ppc-oc', 21), i = o.values.i;
  assert.equal(o.steps.find(s => s.key === 'per').cell.answer, Calc.evaluate({ fn: 'opportunityCost', args: [o.values.ys[i] - o.values.ys[i + 1], o.values.xs[i + 1] - o.values.xs[i]] }));
});

test('ppc-trade: planted mistakes are caught', () => {
  let p = clone(gen('input', 4)); const a = p.values.a;
  p.steps.find(s => s.key === 'ocA').cell.answer = a.hy / a.hx;
  if (a.hx !== a.hy) assert.ok(recheckProblem(p, ctxOf('input'), Graph).some(e => /input opportunity costs/.test(e)));
  p = clone(gen('terms', 4)); p.values.good = p.values.hi + 0.5;
  assert.ok(recheckProblem(p, ctxOf('terms'), Graph).some(e => /strictly between/.test(e)));
  p = clone(gen('ppc-point', 4)); p.values.region = p.values.region === 'on' ? 'inside' : 'on';
  assert.ok(recheckProblem(p, ctxOf('ppc-point'), Graph).some(e => /point at distance/.test(e)));
  const ev = model.PPC_EVENTS.find(e => e.id === 'recession'); ev.shift = -1;
  assert.ok(exploreProblems(model, Graph).some(e => /recession/.test(e)));
  ev.shift = 0;
  assert.ok(check({ ...data, contexts: [{ id: 'x', topic: 'comparative-advantage', types: ['ppc-oc'] }] }, map).some(e => /belongs to topic/.test(e)));
});
