/* Surplus and Policy Lab: its model (microeconomics/assets/tools/math/surplus-lab.js) and its
   validator (scripts/lib/apmicro-tool-checks/surplus-lab.mjs). OWNED BY THIS TOOL
   ONLY (builder T3). The shipped data passes the full sweep (300 problems per
   context and kind, every key recomputed by hand); a seed gives the same
   problem twice; every area the model computes (ApMicroCalc) equals the
   region ApMicroGraph shades, measured as a polygon, for every policy;
   planted mistakes are caught; the grader names the reader-report slips. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { runtime } from '../lib/apmicro-tool-checks/_shared.mjs';
import { check, recheck, TYPES } from '../lib/apmicro-tool-checks/surplus-lab.mjs';
import { ROOT } from '../lib/apmicro-build.mjs';

const DATA = JSON.parse(readFileSync(join(ROOT, 'microeconomics', 'data', 'tools', 'surplus-lab.json'), 'utf8'));
const MAP = JSON.parse(readFileSync(join(ROOT, 'docs', 'apmicro-dependency-map.json'), 'utf8'));
const map = { topicById: id => MAP.topics.find(t => t.id === id) || null };
const ctxOf = id => DATA.contexts.find(c => c.id === id);
const ctxFor = t => DATA.contexts.find(c => c.types.includes(t));

test('surplus-lab: built, the page script parses, registered on the Tool Studio as Premium', () => {
  const { model } = runtime('surplus-lab');
  assert.ok(model && typeof model.generate === 'function' && !model.stub);
  assert.doesNotThrow(() => new Function(readFileSync(join(ROOT, 'microeconomics', 'assets', 'tools', 'surplus-lab.js'), 'utf8')));
  const pages = JSON.parse(readFileSync(join(ROOT, 'microeconomics', 'data', 'pages.json'), 'utf8'));
  const entry = pages.tools.find(t => t.slug === 'surplus-lab');
  assert.ok(entry && entry.studio === true && entry.premium === 'tools');
  assert.equal(entry.topic, 'government-intervention');
  assert.equal(DATA.topic, entry.topic);
});

test('surplus-lab: the shipped data passes the frame and the full drill sweep', () => {
  assert.deepEqual(check(DATA, map), []);
  assert.deepEqual([...new Set(DATA.contexts.flatMap(c => c.types))].sort(), [...TYPES].sort());
  // Each context unlocks with its own topic, all in Unit 2.
  for (const c of DATA.contexts) assert.equal(map.topicById(c.topic).chapter, 'unit-2', c.id);
  assert.ok(check({ ...DATA, slug: 'nope' }, map).some(e => /slug/.test(e)));
});

test('surplus-lab: a seed gives the same problem twice', () => {
  const { M, model } = runtime('surplus-lab');
  for (const t of TYPES) for (const seed of [13, 7932, 99991]) {
    const a = model.generate(M.rng(seed), ctxFor(t), t), b = model.generate(M.rng(seed), ctxFor(t), t);
    assert.deepEqual(JSON.parse(JSON.stringify(a)), JSON.parse(JSON.stringify(b)));
  }
});

test('surplus-lab: every area the model computes is the area ApMicroGraph shades', () => {
  const { Graph, model } = runtime('surplus-lab');
  const cellArea = (A, names) => [...new Set([].concat(names).flatMap(n => A.regions[n] || []))].reduce((s, id) => s + Graph.polyArea(A.cells.find(c => c.id === id).poly), 0);
  const close = (a, b) => Math.abs(a - b) < 1e-6 * Math.max(1, Math.abs(b));
  for (const m of [{ sD: 0, sS: 0, kP: 2, kQ: 10 }, { sD: -1, sS: -2, kP: 4, kQ: 50 }, { sD: -2, sS: 0, kP: 10, kQ: 10 }]) {
    const k = model.market(m);
    const pols = [{ type: 'none' }, { type: 'ceiling', at: k.pe - 1.5 * m.kP }, { type: 'floor', at: k.pe + 1.5 * m.kP }, { type: 'tax', amount: 2 * m.kP }, { type: 'subsidy', amount: 2 * m.kP },
      { type: 'world', at: k.pe - 1.5 * m.kP }, { type: 'world', at: k.pe + 1.5 * m.kP }, { type: 'tariff', at: k.pe - 3 * m.kP, amount: m.kP }];
    for (const pol of pols) {
      if (pol.at != null && (pol.at <= k.floor + m.kP / 2)) continue;
      const v = model.values(m, pol), A = Graph.areas(model.spec(m, pol)), s = m.kP * m.kQ, w = `${JSON.stringify(m)} ${JSON.stringify(pol)}`;
      assert.ok(close(cellArea(A, 'cs') * s, v.cs), `${w}: cs ${cellArea(A, 'cs') * s} vs ${v.cs}`);
      assert.ok(close(cellArea(A, 'ps') * s, v.ps), `${w}: ps`);
      if (v.dwl) assert.ok(close(cellArea(A, 'dwl') * s, v.dwl), `${w}: dwl`);
      if (pol.type === 'tax') assert.ok(close(cellArea(A, 'tax-revenue') * s, v.rev), `${w}: tax revenue`);
      if (pol.type === 'subsidy') assert.ok(close(cellArea(A, 'subsidy-cost') * s, v.rev), `${w}: subsidy cost`);
      if (pol.type === 'tariff') assert.ok(close(cellArea(A, 'tariff-revenue') * s, v.rev), `${w}: tariff revenue`);
      if (pol.type === 'world') assert.ok(close(cellArea(A, 'gain') * s, v.gain), `${w}: gain`);
      // the partition colors every cell once, with an area name
      const part = model.partition(model.spec(m, pol));
      assert.equal(Object.keys(part).length, A.cells.length, w);
      for (const c of Object.values(part)) assert.ok(['cs', 'ps', 'rev', 'gain', 'dwl'].includes(c), w);
    }
  }
});

test('surplus-lab: the numbers are their ApMicroCalc recipes; incidence follows elasticity', () => {
  const { Calc, model } = runtime('surplus-lab');
  const m = { sD: 0, sS: 0, kP: 2, kQ: 10 }, v = model.values(m, { type: 'tax', amount: 4 });
  assert.equal(v.rev, Calc.evaluate({ fn: 'taxRevenue', args: [4, 40] }));
  assert.equal(v.dwl, Calc.evaluate({ fn: 'dwl', args: [10, 4] }));
  assert.equal(v.cs, Calc.evaluate({ fn: 'consumerSurplus', args: [40, 20, 12] }));
  const sub = model.values(m, { type: 'subsidy', amount: 4 });
  assert.equal(sub.rev, Calc.evaluate({ fn: 'subsidyCost', args: [4, 60] }));
  // Less elastic demand bears more of the tax; equal slopes split it evenly.
  const I1 = model.incidence({ a: 90, b: 1, c: 50, d: 3, t: 4 }), I2 = model.incidence({ a: 100, b: 2, c: 60, d: 2, t: 4 });
  assert.ok(I1.buyers > I1.sellers && I1.ed < I1.es);
  assert.equal(I2.buyers, I2.sellers);
});

test('surplus-lab: planted mistakes are caught', () => {
  const { M, model } = runtime('surplus-lab');
  const p = model.generate(M.rng(4242), ctxOf('taxes'), 'tax');
  const bad = JSON.parse(JSON.stringify(p));
  bad.steps.find(s => s.key === 'rev').cell.answer *= 2;
  assert.ok(recheck(bad, ctxOf('taxes'), 'x').some(e => /rev/.test(e)));
  const bad2 = JSON.parse(JSON.stringify(p));
  bad2.steps.find(s => s.key === 'shade-dwl').spec.key.shade = 'tax-revenue';
  assert.ok(recheck(bad2, ctxOf('taxes'), 'x').length > 0, 'a shade key that is not the computed area');
  const bad3 = JSON.parse(JSON.stringify(model.generate(M.rng(77), ctxOf('controls'), 'control')));
  const ks = bad3.steps.find(s => s.key === 'kind'); ks.correct = (ks.correct + 1) % ks.options.length;
  assert.ok(recheck(bad3, ctxOf('controls'), 'x').some(e => /kind keyed/.test(e)));
});

test('surplus-lab: the grader names the reader-report slips on a shade step', () => {
  const { M, Graph, Grade, model } = runtime('surplus-lab');
  // Subsidy cost shaded only out to the old quantity: "only part", with the NEW-quantity hint.
  const p = model.generate(M.rng(31), ctxOf('subsidies'), 'subsidy'), sp = p.steps.find(s => s.key === 'shade-cost').spec;
  const A = Graph.areas(sp), oldQ = A.regions['subsidy-cost'].filter(c => !['c', 'f', 'g'].includes(c));
  const g = Grade.graph(sp, { shifts: {}, labels: {}, shade: oldQ });
  assert.equal(g.correct, false);
  assert.match(g.slip, /only part/i);
  assert.match(g.slip, /NEW, larger quantity/);
  // Deadweight loss shaded for tax revenue: the slip names it.
  const t = model.generate(M.rng(32), ctxOf('taxes'), 'tax'), ts = t.steps.find(s => s.key === 'shade-rev').spec;
  const g2 = Grade.graph(ts, { shifts: {}, labels: {}, shade: Graph.areas(ts).regions.dwl });
  assert.equal(g2.correct, false);
  assert.match(g2.slip, /deadweight loss/);
  // Tax revenue at the old quantity is a named numeric slip.
  const rev = t.steps.find(s => s.key === 'rev');
  const old = M.diagnose(rev.cell, t.answer.v.amount * t.answer.v.qe);
  assert.equal(old.ok, false); assert.match(old.why, /after the tax/);
});
