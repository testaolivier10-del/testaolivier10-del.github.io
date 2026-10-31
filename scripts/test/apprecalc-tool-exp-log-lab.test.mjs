/* Exponential and log lab: its model (precalculus/assets/tools/math/exp-log-lab.js) and its
   validator (scripts/lib/apprecalc-tool-checks/exp-log-lab.mjs). OWNED BY THIS
   TOOL ONLY (builder T2). The shipped data passes (300 problems per context,
   every key recomputed from the problem's own text); the page entry is wired;
   hand values (the table, the overtaking point, the log rules, the semi-log
   fit); same seed same problem; the named slips (a rounded b, the slope read
   as b, a ratio for a difference); planted mistakes caught. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { runtime } from '../lib/apprecalc-tool-checks/_shared.mjs';
import { check, exploreProblems } from '../lib/apprecalc-tool-checks/exp-log-lab.mjs';
import { loadMap, ROOT } from '../lib/apprecalc-build.mjs';

const { M, model } = runtime('exp-log-lab');
const data = () => JSON.parse(readFileSync(join(ROOT, 'precalculus', 'data', 'tools', 'exp-log-lab.json'), 'utf8'));

test('exp-log-lab: the page entry is wired and the shipped data passes its validator', () => {
  const pages = JSON.parse(readFileSync(join(ROOT, 'precalculus', 'data', 'pages.json'), 'utf8'));
  const entry = pages.tools.find(t => t.slug === 'exp-log-lab');
  assert.ok(entry && entry.studio === true && entry.topic === data().topic);
  assert.ok(!model.stub);
  assert.deepEqual(check(data(), loadMap()), []);
});

test('exp-log-lab: the frame and the lists are checked', () => {
  const map = loadMap(), d = { ...data(), contexts: [] };
  assert.ok(check({ ...d, views: [{ id: 'nope', topic: 'semi-log-plots' }] }, map).some(e => /unknown view/.test(e)));
  assert.ok(check({ ...d, datasets: [{ id: 'nope', topic: 'semi-log-plots' }] }, map).some(e => /unknown data set/.test(e)));
  assert.ok(check({ ...d, contexts: [{ id: 'q', topic: 'semi-log-plots', kind: 'nope' }] }, map).some(e => /unknown kind/.test(e)));
});

test('exp-log-lab: hand values', () => {
  assert.deepEqual(exploreProblems(model), []);
  const rows = model.table(2, 3, 1.5, 4, 1);
  assert.equal(rows[3].L, 11); assert.equal(rows[3].E, 6.75); assert.equal(rows[2].dL, 3); assert.equal(rows[4].rE, 1.5);
  // 2·1.5^x passes 2 + 3x between x = 5 and x = 6
  const t = model.overtake(2, 3, 1.5); assert.ok(t > 5 && t < 6);
  assert.equal(model.overtake(2, 3, 0.9), null);
  const p = model.rule('product', 2, 2, 4); assert.ok(Math.abs(p.lhs - 3) < 1e-12 && Math.abs(p.rhs - 3) < 1e-12);
  assert.ok(Math.abs(model.rule('power', 3, 9, 2).lhs - 4) < 1e-12);
  // exact exponential data fit exactly
  const f = model.fit([[0, 5], [1, 10], [2, 20], [3, 40]]);
  assert.ok(Math.abs(f.b - 2) < 1e-12 && Math.abs(f.a - 5) < 1e-12 && Math.abs(f.r - 1) < 1e-12);
  // the linear data set is visibly less straight on a semi-log plot than the exponential ones
  assert.ok(Math.abs(model.fit(model.DATASETS.linear.pts).r) < Math.abs(model.fit(model.DATASETS.bacteria.pts).r));
});

test('exp-log-lab: same seed, same problem; the named slips', () => {
  for (const kind of model.KINDS) {
    const ctx = { id: kind, topic: 't', kind };
    assert.equal(JSON.stringify(model.generate(M.rng(11), ctx)), JSON.stringify(model.generate(M.rng(11), ctx)), kind);
  }
  let rounded = 0, lin = 0, exp = 0;
  for (let i = 1; i < 120; i++) {
    const m = model.generate(M.rng(i), { id: 'model', topic: 't', kind: 'model' }), pr = m.steps.find(s => s.key === 'pred');
    if (pr.cell.mistakes.some(x => /rounded \$b\$/.test(x.why))) rounded++;
    const s = model.generate(M.rng(i), { id: 'semilog', topic: 't', kind: 'semilog' }), b = s.steps.find(x => x.key === 'b');
    assert.match(M.diagnose(b.cell, s.values.m).why, /slope is \$\\log_\{10\} b\$/);
    const tb = model.generate(M.rng(i), { id: 'table', topic: 't', kind: 'table' });
    if (tb.values.lin) lin++; else { exp++; const k = tb.steps.find(x => x.key === 'k'); assert.match(M.diagnose(k.cell, tb.values.ys[1] - tb.values.ys[0]).why || '', /first difference/); }
    const ty = tb.steps.find(x => x.key === 'type'), vague = ty.options.findIndex(o => /because/.test(o));
    assert.match(ty.why[vague], /reason earns nothing/);
  }
  assert.ok(rounded > 60, 'the rounded-b slip is offered on most model problems');
  assert.ok(lin > 20 && exp > 20);
});

test('exp-log-lab: a planted wrong key is caught', () => {
  const real = model.generate, map = loadMap(), d = data();
  try {
    model.generate = (r, c, t) => { const p = real(r, c, t); if (p.type === 'semilog') { const s = p.steps.find(x => x.key === 'b'); s.cell.answer = Math.exp(p.values.m); s.cell.mistakes = []; } return p; };
    assert.ok(check({ ...d, contexts: d.contexts.filter(c => c.kind === 'semilog') }, map).some(e => /semi-log model/.test(e)));
    model.generate = (r, c, t) => { const p = real(r, c, t); if (p.type === 'table') { const s = p.steps.find(x => x.key === 'next'); s.cell.answer += 1; s.cell.mistakes = []; } return p; };
    assert.ok(check({ ...d, contexts: d.contexts.filter(c => c.kind === 'table') }, map).some(e => /next value/.test(e)));
  } finally { model.generate = real; }
});
