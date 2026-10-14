/* Accumulation: its model (calculus/assets/tools/math/accumulation.js) and its
   validator (scripts/lib/apcalc-tool-checks/accumulation.mjs). OWNED BY THIS
   TOOL ONLY. Exact areas from geometry against hand values and numerical
   integration, FTC part 1 on random graphs (g′ = f), the reading of g from
   f, same seed same problem, every key recomputed by the validator on the
   shipped data, and planted mistakes caught. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { runtime } from '../lib/apcalc-tool-checks/_shared.mjs';
import { check } from '../lib/apcalc-tool-checks/accumulation.mjs';
import { loadMap, ROOT } from '../lib/apcalc-build.mjs';

const { M, model: A } = runtime('accumulation');
const data = JSON.parse(readFileSync(join(ROOT, 'calculus', 'data', 'tools', 'accumulation.json'), 'utf8'));
const exam = data.explore.graphs.find(g => g.id === 'exam').pieces;
const near = (a, b, e = 1e-9) => Math.abs(a - b) <= e * Math.max(1, Math.abs(b));

test('accumulation: exact areas from triangles and circles, signed, limits either way round', () => {
  // exam graph: segment (-4,-2)-(-2,0), semicircle up on [-2, 2], segment (2,0)-(4,-2), flat -2 to 6, up to (7, 0)
  assert.ok(near(A.area(exam, -2, 2), 2 * Math.PI));
  assert.ok(near(A.area(exam, 0, 4), Math.PI - 2));
  assert.ok(near(A.area(exam, 0, -4), 2 - Math.PI), 'g(−4) = −∫ from −4 to 0');
  assert.ok(near(A.area(exam, 4, 7), -5));
  const e = A.exact(exam, 0, 4);
  assert.equal(e.p, -2); assert.equal(e.q, 1);
  assert.equal(A.pi(e.p, e.q), 'π − 2');
  assert.equal(A.pi(4, -2), '4 − 2π');
  assert.equal(A.pi(0, 0.5), 'π/2');
  assert.equal(A.pi(-1.5, 0.75), '3π/4 − 3/2');
  assert.equal(A.pi(-1, -0.5), '−1 − π/2');
  assert.equal(A.pi(3, 0), '3');
  assert.equal(A.exact(exam, 0, 1.3), null, 'inside a semicircle away from its centre there is no exact form');
  // against numerical integration
  for (const [a, b] of [[-4, 7], [0, 5.5], [3, -3], [-1, 1]]) assert.ok(near(A.area(exam, a, b), M.integral(x => A.val(exam, x), a, b, 1e-10), 1e-7), `${a} to ${b}`);
});

test('accumulation: reading g from f on the exam graph', () => {
  const z = JSON.parse(JSON.stringify(A.zeros(exam)));
  assert.deepEqual(z.map(q => q.x), [-2, 2, 7]);
  assert.deepEqual(z.find(q => q.x === -2), { x: -2, from: -1, to: 1 }, 'g has a relative minimum at −2');
  assert.deepEqual(z.find(q => q.x === 2), { x: 2, from: 1, to: -1 }, 'and a relative maximum at 2');
  // f rises then falls through the top of the semicircle (x = 0); at 4 and 6 f's slope only goes to or from 0, so g bends over an interval, not at a point
  assert.deepEqual([...A.inflections(exam)], [0]);
});

test('accumulation: FTC part 1 on random graphs: the slope of g is f', () => {
  for (let seed = 1; seed <= 40; seed++) {
    const P = A.randGraph(M.rng(seed)), D = A.domain(P), a = D[0];
    for (let i = 1; i < 12; i++) {
      const x = D[0] + (D[1] - D[0]) * (i + 0.37) / 13, h = 1e-5;
      const slope = (A.area(P, a, x + h) - A.area(P, a, x - h)) / (2 * h);
      assert.ok(Math.abs(slope - A.val(P, x)) < 1e-4, `seed ${seed} x ${x}: ${slope} vs ${A.val(P, x)}`);
    }
    // joined end to end, continuous
    for (let k = 1; k < P.length; k++) assert.equal(P[k].x0, P[k - 1].x1);
  }
});

test('accumulation: a tank holds its initial amount plus the net inflow', () => {
  const t = data.explore.tanks[0], R = M.fn(t.R), D = M.fn(t.D);
  // by hand: ∫ from 0 to 12 of (10 + 15 sin(πt/6) − 2t) dt = 120 − 144 + 0 = −24
  assert.ok(near(A.amount(t.A0, R, D, 12), t.A0 - 24, 1e-8));
  assert.ok(near(A.amount(t.A0, R, D, 0), t.A0));
});

test('accumulation: same seed, same problem; every type is generated', () => {
  for (const c of data.contexts) for (const t of c.types) {
    const a = A.generate(M.rng(4242), c, t), b = A.generate(M.rng(4242), c, t);
    assert.equal(a.type, t);
    assert.equal(JSON.stringify(a), JSON.stringify(b), `${c.id} ${t}`);
  }
});

test('accumulation: the usual slips are named', () => {
  const c = data.contexts.find(x => x.id === 'graph-values');
  let sawSign = false;
  for (let seed = 1; seed < 200 && !sawSign; seed++) {
    const p = A.generate(M.rng(seed), c, 'values');
    const s = p.steps.find(x => x.key === 'g2');
    const x = +String(s.label).replace(/<[^>]+>/g, '').replace(/−/g, '-').replace(/^g\((.*)\)$/, '$1');
    if (!(x < p.a) || Math.abs(s.cell.answer) < 0.1) continue;
    const g = M.diagnose(s.cell, -s.cell.answer);
    if (g.why && /flip the sign|sign/i.test(g.why)) sawSign = true;
  }
  assert.ok(sawSign, 'a reversed-limits value with the wrong sign is named');
  const ch = A.generate(M.rng(9), data.contexts.find(x => x.id === 'variable-limit'), 'chain');
  const st = ch.steps.find(x => x.key === 'deriv'), miss = st.cell.expr.mistakes[0];
  const g = M.diagnoseExpr(st.cell, miss.expr);
  assert.equal(g.ok, false); assert.match(g.why, /chain rule/);
  const tk = A.generate(M.rng(5), data.contexts.find(x => x.id === 'tank-water'), 'tank');
  const tot = tk.steps.find(x => x.key === 'total');
  assert.match(M.diagnose(tot.cell, tot.cell.answer - tk.tank.A0).why, /Add the/);
});

test('accumulation: the shipped data passes its validator (300 problems per context and type)', () => {
  assert.deepEqual(check(data, loadMap()), []);
});

test('accumulation: the validator catches planted mistakes', () => {
  const map = loadMap(), clone = () => JSON.parse(JSON.stringify(data));
  let d = clone(); d.explore.graphs[0].pieces[2].y0 = 1;
  assert.ok(check(d, map).some(e => /jumps/.test(e)));
  d = clone(); d.explore.graphs[0].pieces[1].s = 2;
  assert.ok(check(d, map).some(e => /s = 1 or -1/.test(e)));
  d = clone(); d.explore.graphs[0].a = 0.5;
  assert.ok(check(d, map).some(e => /lower limit/.test(e)));
  d = clone(); d.explore.tanks[0].A0 = 5;
  assert.ok(check(d, map).some(e => /less than nothing/.test(e)));
  d = clone(); d.contexts[0].types = ['values', 'nope'];
  assert.ok(check(d, map).some(e => /unknown type/.test(e)));
  // a model whose key is off is caught by the independent recheck
  const gen = A.generate;
  A.generate = (r, c, t) => { const p = gen(r, c, t); const s = p.steps.find(x => x.key === 'g1' || x.key === 'h1' || x.key === 'total'); if (s) s.cell.answer += 0.5; return p; };
  try {
    d = clone(); d.contexts = d.contexts.filter(c => ['graph-values', 'net-change', 'tank-water'].includes(c.id));
    const errs = check(d, map);
    for (const k of ['g1', 'h1', 'total']) assert.ok(errs.some(e => e.includes(k + ':')), k);
  } finally { A.generate = gen; }
});
