/* Factor Market Lab: its model (microeconomics/assets/tools/math/factor-lab.js) and its
   validator (scripts/lib/apmicro-tool-checks/factor-lab.mjs). OWNED BY THIS TOOL
   ONLY (builder T4). The shipped data passes the full sweep, a seed gives the
   same problem twice, the Explore tables match their recipes and the graph,
   and planted mistakes are caught. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { runtime } from '../lib/apmicro-tool-checks/_shared.mjs';
import { check, recheck, hires, monoTable } from '../lib/apmicro-tool-checks/factor-lab.mjs';
import { ROOT } from '../lib/apmicro-build.mjs';

const data = JSON.parse(readFileSync(join(ROOT, 'microeconomics', 'data', 'tools', 'factor-lab.json'), 'utf8'));
const TOPICS = ['competitive-factor-markets', 'factor-demand-supply', 'monopsony'];
const map = { topicById: id => (TOPICS.includes(id) ? { id } : null) };

test('factor-lab: registered, page script parses, pages.json entry', () => {
  const { model } = runtime('factor-lab');
  assert.ok(model && !model.stub && typeof model.generate === 'function');
  assert.doesNotThrow(() => new Function(readFileSync(join(ROOT, 'microeconomics', 'assets', 'tools', 'factor-lab.js'), 'utf8')));
  const pages = JSON.parse(readFileSync(join(ROOT, 'microeconomics', 'data', 'pages.json'), 'utf8'));
  const entry = pages.tools.find(t => t.slug === 'factor-lab');
  assert.ok(entry && entry.studio === true && entry.topic === 'competitive-factor-markets' && entry.premium === 'tools');
});

test('factor-lab: the shipped data passes the full sweep', () => {
  assert.deepEqual(check(data, map), []);
});

test('factor-lab: a seed gives the same problem twice', () => {
  const { M, model } = runtime('factor-lab');
  for (const c of data.contexts) for (const t of c.types) {
    const a = model.generate(M.rng(99), c, t), b = model.generate(M.rng(99), c, t);
    assert.deepEqual(JSON.parse(JSON.stringify(a)), JSON.parse(JSON.stringify(b)));
  }
});

test('factor-lab: Explore numbers match their recipes and the monopsony graph', () => {
  const { model, Graph } = runtime('factor-lab');
  const c = model.competitive(4, 20);
  assert.deepEqual([...c.rows.map(r => r.mrp)], [40, 36, 32, 28, 24, 20, 16, 12]);
  assert.equal(c.hire, 6);
  assert.equal(c.bill, 120);
  assert.equal(model.competitive(6, 20).hire, hires([60, 54, 48, 42, 36, 30, 24, 18], 20));
  const m = model.monopsony(0), t = monoTable(model.MONO);
  assert.equal(m.hire, 6); assert.equal(m.wage, 16); assert.equal(m.comp, 9);
  assert.equal(t[5].mfc, 26);
  // The graph: hiring at x = 3 (6 workers), the wage 4 (x $4 = $16), the competitive x = 4.5 (9 workers).
  const h = Graph.named({ kind: 'monopsony' }, {}, 'hire'), cp = Graph.named({ kind: 'monopsony' }, {}, 'competitive');
  assert.equal(h[0] * 2, m.hire); assert.equal(h[1] * 4, m.wage); assert.equal(cp[0] * 2, m.comp);
  // A minimum wage between the monopsony and competitive wages raises employment.
  assert.ok(model.monopsony(20).hire > m.hire);
});

test('factor-lab: planted mistakes are caught', () => {
  const { M, model } = runtime('factor-lab');
  const plant = (ctxId, t, f) => { const c = data.contexts.find(x => x.id === ctxId); const p = model.generate(M.rng(5), c, t); f(p); const errs = []; recheck(p, c, 'planted', errs); return errs; };
  assert.ok(plant('bakery', 'hire', p => { p.steps.find(s => s.key === 'mrp').cell.answer += 1; }).length, 'a wrong MRP');
  assert.ok(plant('mill', 'monopsony', p => { const s = p.steps.find(x => x.key === 'wage'); s.cell.answer = s.cell.mistakes[0] ? s.cell.mistakes[0].value : s.cell.answer + 1; }).length, 'the wage read from MFC');
  assert.ok(plant('orchard', 'derived', p => { const s = p.steps.find(x => x.key === 'shift'); s.spec.key.shifts[0].dir = s.spec.key.shifts[0].dir === 'right' ? 'left' : 'right'; }).length, 'a backwards shift');
  assert.ok(plant('carwash', 'leastcost', p => { const s = p.steps.find(x => x.key === 'next'); s.correct = (s.correct + 1) % 3; }).length, 'the wrong input');
});
