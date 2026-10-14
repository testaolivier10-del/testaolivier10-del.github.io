/* Riemann sums: its model (calculus/assets/tools/math/riemann-sums.js) and its
   validator (scripts/lib/apcalc-tool-checks/riemann-sums.mjs). OWNED BY THIS
   TOOL ONLY. Same seed same problem, the sums against hand values, the
   over/under rules against the actual error, every key recomputed by the
   validator on the shipped data, and planted mistakes caught. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { runtime } from '../lib/apcalc-tool-checks/_shared.mjs';
import { check } from '../lib/apcalc-tool-checks/riemann-sums.mjs';
import { loadMap, ROOT } from '../lib/apcalc-build.mjs';

const { M, model: R } = runtime('riemann-sums');
const data = JSON.parse(readFileSync(join(ROOT, 'calculus', 'data', 'tools', 'riemann-sums.json'), 'utf8'));
const near = (a, b, e = 1e-9) => Math.abs(a - b) <= e * Math.max(1, Math.abs(b));

test('riemann-sums: sums match hand computation, on functions and on tables', () => {
  const sq = x => x * x;
  assert.ok(near(R.total(R.pieces(sq, R.partition(0, 1, 4), 'left')), 0.21875));
  assert.ok(near(R.total(R.pieces(sq, R.partition(0, 1, 4), 'right')), 0.46875));
  assert.ok(near(R.total(R.pieces(sq, R.partition(0, 1, 4), 'mid')), 0.328125));
  assert.ok(near(R.total(R.pieces(sq, R.partition(0, 1, 4), 'trap')), 0.34375));
  // a straight line: midpoint and trapezoid are exact
  const ln = x => 3 * x + 1;
  for (const k of ['mid', 'trap']) assert.ok(near(R.total(R.pieces(ln, R.partition(0, 2, 3), k)), 8));
  // a table with unequal widths: 0, 2, 5, 7, 12
  const xs = [0, 2, 5, 7, 12], ys = [12, 20, 25, 28, 33];
  assert.equal(R.total(R.tablePieces(xs, ys, 'left')), 2 * 12 + 3 * 20 + 2 * 25 + 5 * 28);
  assert.equal(R.total(R.tablePieces(xs, ys, 'right')), 2 * 20 + 3 * 25 + 2 * 28 + 5 * 33);
  assert.equal(R.total(R.tablePieces(xs, ys, 'trap')), (2 * 32 + 3 * 45 + 2 * 53 + 5 * 61) / 2);
  assert.equal(R.total(R.tablePieces(xs, ys, 'mid')), 5 * 20 + 7 * 28);
  assert.equal(R.tablePieces([0, 1, 2, 3], [1, 2, 3, 4], 'mid').length, 0, 'a midpoint sum needs pairs');
  // the trapezoid is the average of left and right
  const f = M.fn('e^(-x) + sin(3x)');
  const L = R.total(R.pieces(f, R.partition(0, 2, 7), 'left')), Rt = R.total(R.pieces(f, R.partition(0, 2, 7), 'right'));
  assert.ok(near(R.total(R.pieces(f, R.partition(0, 2, 7), 'trap')), (L + Rt) / 2));
});

test('riemann-sums: errors shrink like 1/n (left, right) and 1/n² (midpoint, trapezoid)', () => {
  const f = M.fn('x^2/4 + 1'), I = M.integral(f, 0, 4);
  for (const k of R.KINDS) {
    const e1 = Math.abs(R.total(R.pieces(f, R.partition(0, 4, 20), k)) - I), e2 = Math.abs(R.total(R.pieces(f, R.partition(0, 4, 40), k)) - I);
    const ratio = e2 / e1;
    if (k === 'left' || k === 'right') assert.ok(Math.abs(ratio - 0.5) < 0.05, `${k}: ratio ${ratio}`);
    else assert.ok(Math.abs(ratio - 0.25) < 0.01, `${k}: ratio ${ratio}`);
  }
});

test('riemann-sums: over/under verdicts agree with the actual error on every preset', () => {
  for (const p of [...data.explore.functions, ...data.explore.flows]) {
    const f = M.fn(p.fn), I = M.integral(f, p.a, p.b), sh = R.shape(f, p.a, p.b);
    for (const k of R.KINDS) for (const n of [2, 5, 13]) {
      const v = R.verdict(k, sh), S = R.total(R.pieces(f, R.partition(p.a, p.b, n), k));
      if (v.v) assert.equal(v.v, S > I ? 'over' : 'under', `${p.id} ${k} n=${n}: ${v.why}`);
    }
  }
  assert.equal(JSON.stringify(R.shape('x^2', 0, 2)), JSON.stringify({ inc: 'up', conc: 'up' }));
  assert.equal(JSON.stringify(R.shape('sin(x)', 0, 3)), JSON.stringify({ inc: null, conc: 'down' }));
  assert.equal(R.verdict('left', { inc: 'up', conc: 'up' }).v, 'under');
  assert.equal(R.verdict('right', { inc: 'up', conc: 'down' }).v, 'over');
  assert.equal(R.verdict('mid', { inc: 'down', conc: 'up' }).v, 'under');
  assert.equal(R.verdict('trap', { inc: 'down', conc: 'up' }).v, 'over');
  assert.equal(R.verdict('left', { inc: null, conc: 'up' }).v, null);
});

test('riemann-sums: same seed, same problem; every type is generated', () => {
  for (const c of data.contexts) for (const t of c.types) {
    const a = R.generate(M.rng(777), c, t), b = R.generate(M.rng(777), c, t);
    assert.equal(a.type, t);
    assert.equal(JSON.stringify(a), JSON.stringify(b), `${c.id} ${t}`);
  }
});

test('riemann-sums: the common-width slip and the missing half are named', () => {
  const c = data.contexts.find(x => x.id === 'tank');
  for (let seed = 1; seed < 400; seed++) {
    const p = R.generate(M.rng(seed), c, 'table'), st = p.steps.find(s => s.key === 'sum');
    if (p.figure.sumKind !== 'trap') continue;
    const g = M.diagnose(st.cell, 2 * st.cell.answer);
    assert.equal(g.ok, false);
    assert.match(g.why, /÷ 2|half|factor of 2/i);
    return;
  }
  assert.fail('no trapezoid table in 400 seeds');
});

test('riemann-sums: the shipped data passes its validator (300 problems per context and type)', () => {
  assert.deepEqual(check(data, loadMap()), []);
});

test('riemann-sums: the validator catches planted mistakes', () => {
  const map = loadMap();
  const clone = () => JSON.parse(JSON.stringify(data));
  let d = clone(); d.explore.tables[0].ys[2] += 1;
  assert.ok(check(d, map).some(e => /not the trend/.test(e)));
  d = clone(); d.explore.tables[0].xs = [0, 2, 4, 6, 8];
  assert.ok(check(d, map).some(e => /unequal widths/.test(e)));
  d = clone(); d.explore.flows[0].rateUnit = 'gallons per minute';
  assert.ok(check(d, map).some(e => /rate unit/.test(e)));
  d = clone(); d.contexts[0].types = ['table', 'nope'];
  assert.ok(check(d, map).some(e => /unknown type/.test(e)));
  d = clone(); d.topic = 'nope';
  assert.ok(check(d, map).some(e => /topic/.test(e)));
  // a model whose sum key is wrong is caught by the independent recheck
  const gen = R.generate;
  R.generate = (r, c, t) => { const p = gen(r, c, t); const s = p.steps.find(x => x.key === 'sum'); if (s) s.cell.answer += 1; return p; };
  try { assert.ok(check(clone(), map).some(e => /recomputed/.test(e))); } finally { R.generate = gen; }
});
