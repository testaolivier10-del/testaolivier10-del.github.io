/* Cost Curve Lab: its model (microeconomics/assets/tools/math/cost-lab.js) and its
   validator (scripts/lib/apmicro-tool-checks/cost-lab.mjs). OWNED BY THIS TOOL
   ONLY (builder T2). The shipped data passes the full sweep (300 problems per
   context and kind, every key recomputed); a seed gives the same problem
   twice; the explore table follows its ApMicroCalc recipes and lands on the
   curves ApMicroGraph draws (MC through the minimums); planted mistakes are
   caught. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { runtime } from '../lib/apmicro-tool-checks/_shared.mjs';
import { check, recheck, TYPES } from '../lib/apmicro-tool-checks/cost-lab.mjs';
import { ROOT } from '../lib/apmicro-build.mjs';

const DATA = JSON.parse(readFileSync(join(ROOT, 'microeconomics', 'data', 'tools', 'cost-lab.json'), 'utf8'));
const MAP = JSON.parse(readFileSync(join(ROOT, 'docs', 'apmicro-dependency-map.json'), 'utf8'));
const map = { topicById: id => MAP.topics.find(t => t.id === id) || null };

test('cost-lab: registers, the page script parses, it is registered on the Tool Studio', () => {
  const { model } = runtime('cost-lab');
  assert.ok(model && typeof model.generate === 'function' && !model.stub);
  assert.doesNotThrow(() => new Function(readFileSync(join(ROOT, 'microeconomics', 'assets', 'tools', 'cost-lab.js'), 'utf8')));
  const pages = JSON.parse(readFileSync(join(ROOT, 'microeconomics', 'data', 'pages.json'), 'utf8'));
  const entry = pages.tools.find(t => t.slug === 'cost-lab');
  assert.ok(entry && entry.studio === true);
  assert.equal(entry.topic, 'short-run-costs');
  assert.equal(DATA.topic, entry.topic);
  const ok = { slug: 'cost-lab', kind: 'simulator', topic: 'short-run-costs', intro: '<p>x</p>', howItWorks: '<p>x</p>', contexts: [{ id: 'c1', topic: 'short-run-costs', types: ['mc'] }] };
  assert.ok(check({ ...ok, slug: 'nope' }, map).some(e => /slug/.test(e)));
  assert.ok(check({ ...ok, topic: 'nope' }, map).some(e => /topic/.test(e)));
});

test('cost-lab: the shipped data passes the frame and the full drill sweep', () => {
  assert.deepEqual(check(DATA, map), []);
  assert.deepEqual([...new Set(DATA.contexts.flatMap(c => c.types))].sort(), [...TYPES].sort());
  for (const c of DATA.contexts) assert.equal(map.topicById(c.topic).chapter, 'unit-3');
});

test('cost-lab: a seed gives the same problem twice', () => {
  const { M, model } = runtime('cost-lab');
  for (const c of DATA.contexts) for (const t of c.types) for (const seed of [13, 7932, 99991]) {
    const a = model.generate(M.rng(seed), c, t), b = model.generate(M.rng(seed), c, t);
    assert.deepEqual(JSON.parse(JSON.stringify(a)), JSON.parse(JSON.stringify(b)));
  }
});

test('cost-lab: the explore table follows its recipes and lands on the engine’s curves', () => {
  const { Graph: G, Calc: C, model } = runtime('cost-lab');
  const p = G.COST.firm, E = model.EXPLORE;
  // each worker's output is where the engine's variable cost reaches wage × L (to a whole unit)
  const tvc = x => 10 * (p.a * x - p.b * x * x + p.c * x ** 3);
  E.labor.forEach((L, i) => { if (!L) return; let lo = 0, hi = 12; for (let k = 0; k < 80; k++) { const m = (lo + hi) / 2; if (tvc(m) < E.wage * L) lo = m; else hi = m; } assert.ok(Math.abs(lo * 10 - E.tp[i]) < 1.5, `TP of worker ${L}`); });
  const mp = E.tp.slice(1).map((t, i) => t - E.tp[i]), top = mp.indexOf(Math.max(...mp));
  mp.forEach((v, i) => { if (i && i <= top) assert.ok(v > mp[i - 1]); if (i > top) assert.ok(v < mp[i - 1]); });
  for (const [tfc, mats] of [[80, 0], [120, 0], [40, 1.5], [160, 3]]) {
    const t = model.table({ tfc, mats }), off = model.offsets(tfc, mats), spec = { kind: 'costs', afc: true }, cs = G.curves(spec, off);
    const y = id => x => G.y(G.find(cs, id), x);
    for (let i = 1; i < t.tp.length; i++) {
      const Q = t.tp[i];
      assert.equal(t.tvc[i], E.wage * E.labor[i] + mats * Q);
      assert.equal(t.tc[i], C.evaluate({ fn: 'totalCost', args: [tfc, t.tvc[i]] }));
      assert.ok(Math.abs(t.mc[i] - C.evaluate({ fn: 'marginalCost', args: [t.tc[i - 1], t.tc[i], t.tp[i - 1], Q] })) < 1e-9);
      assert.ok(Math.abs(t.afc[i] - tfc / Q) < 1e-9 && Math.abs(t.atc[i] - t.afc[i] - t.avc[i]) < 1e-9);
      // the row's points sit on the curves (whole-unit output: within a small rounding band)
      assert.ok(Math.abs(t.avc[i] - y('AVC')(Q / 10)) < 0.15, `AVC row ${i} ${tfc} ${mats}`);
      assert.ok(Math.abs(t.atc[i] - y('ATC')(Q / 10)) < 0.3, `ATC row ${i} ${tfc} ${mats}`);
      assert.ok(Math.abs(t.afc[i] - y('AFC')(Q / 10)) < 1e-6, `AFC row ${i}`);
      if (t.mc[i] < 10) assert.ok(Math.abs(t.mc[i] - y('MC')((t.tp[i - 1] + Q) / 20)) < 0.3, `MC row ${i}`);
    }
    // MC passes through the minimum of AVC and ATC
    for (const [name, id] of [['min-avc', 'AVC'], ['min-atc', 'ATC']]) { const m = G.named(spec, off, name); assert.ok(Math.abs(y('MC')(m[0]) - m[1]) < 1e-3, `MC through ${name}`); }
  }
  // a fixed cost moves ATC and AFC only; materials move MC, AVC and ATC
  const a = model.table({ tfc: 80 }), b = model.table({ tfc: 140 }), c = model.table({ tfc: 80, mats: 2 });
  for (let i = 1; i < a.tp.length; i++) {
    assert.equal(b.mc[i], a.mc[i]); assert.equal(b.avc[i], a.avc[i]); assert.ok(b.atc[i] > a.atc[i]);
    assert.ok(Math.abs(c.mc[i] - a.mc[i] - 2) < 1e-9 && Math.abs(c.avc[i] - a.avc[i] - 2) < 1e-9); assert.equal(c.afc[i], a.afc[i]);
  }
});

test('cost-lab: planted mistakes are caught', () => {
  const { M, model } = runtime('cost-lab');
  const ctx = id => DATA.contexts.find(c => c.id === id);
  const tweak = (p, key, f) => { const q = JSON.parse(JSON.stringify(p)); const s = q.steps.find(x => x.key === key); f(s); return q; };
  const tab = model.generate(M.rng(17), ctx('labor'), 'table');
  assert.deepEqual(recheck(tab, ctx('labor'), 'ok'), []);
  // MC without dividing by the change in output
  assert.ok(recheck(tweak(tab, 'mc', s => { s.cell.answer = tab.answer.w; }), ctx('labor'), 'w').some(e => /MC/.test(e)));
  const fx = model.generate(M.rng(5), ctx('changes'), 'fixed');
  // a fixed cost that moves MC
  const bad = tweak(fx, 'graph', s => { s.spec.key.shifts = [{ curve: 'MC', dir: 'up' }, { curve: 'ATC', dir: 'up' }]; });
  if (fx.answer.lump) assert.ok(recheck(bad, ctx('changes'), 'w').some(e => /shifts keyed/.test(e)));
  const sd = model.generate(M.rng(9), ctx('shutdown'), 'shutdown');
  // the shutdown price at the minimum of ATC
  assert.ok(recheck(tweak(sd, 'shut', s => { s.cell.answer = sd.answer.even; }), ctx('shutdown'), 'w').some(e => /shutdown price/.test(e)));
  const mn = model.generate(M.rng(3), ctx('output'), 'min');
  assert.ok(recheck(tweak(mn, 'qatc', s => { s.cell.answer = mn.answer.qavc; }), ctx('output'), 'w').some(e => /min ATC/.test(e)));
});
