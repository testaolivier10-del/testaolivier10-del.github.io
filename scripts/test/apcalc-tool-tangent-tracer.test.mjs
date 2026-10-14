/* Tangent tracer: its model (calculus/assets/tools/math/tangent-tracer.js) and its
   validator (scripts/lib/apcalc-tool-checks/tangent-tracer.mjs). OWNED BY THIS
   TOOL ONLY. Same seed same problem, the shipped data passing the validator
   (300 problems per context, every key recomputed), the model's numerics
   (difference quotients closing in, one-sided slopes at corners, cusps,
   vertical tangents, jumps and endpoints), the sketch grader's named misses,
   and planted mistakes caught. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { runtime } from '../lib/apcalc-tool-checks/_shared.mjs';
import { check, recheck, sides } from '../lib/apcalc-tool-checks/tangent-tracer.mjs';
import { loadMap, ROOT } from '../lib/apcalc-build.mjs';

const data = JSON.parse(readFileSync(join(ROOT, 'calculus', 'data', 'tools', 'tangent-tracer.json'), 'utf8'));
const { M, model: TT } = runtime('tangent-tracer');
const ctx = id => data.contexts.find(c => c.id === id);
const strip = p => JSON.parse(JSON.stringify(p));

test('tangent-tracer: the shipped data passes the validator (every context, 300 seeds)', () => {
  assert.deepEqual(check(data, loadMap()), []);
});

test('tangent-tracer: the frame is checked (slug, topic, contexts, types)', () => {
  const map = loadMap();
  assert.ok(check({ ...data, topic: 'nope' }, map).some(e => /topic/.test(e)));
  assert.ok(check({ ...data, slug: 'other' }, map).some(e => /slug/.test(e)));
  assert.ok(check({ ...data, contexts: [{ id: 'x', topic: 'derivative-definition', types: ['nope'] }] }, map).some(e => /types/.test(e)));
  assert.ok(check({ ...data, contexts: [{ id: 'x', topic: 'derivative-definition', types: ['tanline'] }] }, map).some(e => /source/.test(e)));
});

test('tangent-tracer: same seed, same problem; every kind is reachable', () => {
  const seen = new Set();
  for (const c of data.contexts) for (let s = 1; s < 40; s++) {
    const a = TT.generate(M.rng(s * 101), c), b = TT.generate(M.rng(s * 101), c);
    assert.deepEqual(strip(a), strip(b));
    seen.add(a.type + (a.kind ? ':' + a.kind : '') + (a.variant ? ':' + a.variant : '') + (a.source ? ':' + a.source : ''));
  }
  for (const k of ['estimate', 'table', 'whichgraph', 'sketch:cubic', 'sketch:quad', 'sketch:lines', 'tanline:given', 'tanline:power', 'tanline:trans',
    'notdiff:corner', 'notdiff:cusp', 'notdiff:vertical', 'notdiff:jump', 'notdiff:hole']) assert.ok(seen.has(k), `never generated ${k}`);
});

test('tangent-tracer: secant slopes close in on the derivative from both sides', () => {
  const f = x => x * x, rows = TT.table(f, 1);
  assert.equal(rows.map(r => r.h).join(), '1,0.1,0.01,0.001');
  rows.forEach(r => { assert.ok(Math.abs(r.right - (2 + r.h)) < 1e-9); assert.ok(Math.abs(r.left - (2 - r.h)) < 1e-9); });
  assert.ok(Number.isNaN(TT.dq(TT.FUNCS.ln.f, 0.5, -1)), 'Q off the domain gives no slope');
  for (const k of TT.ORDER) {
    const F = TT.FUNCS[k];
    if (F.special.some(s => s.x === F.a)) continue;
    const r = TT.table(F.f, F.a), d = F.d(F.a);
    assert.ok(Math.abs(r[3].right - d) < 0.01 && Math.abs(r[3].left - d) < 0.01, `${k}: h = ±0.001 within 0.01 of f'(a)`);
  }
});

test('tangent-tracer: one-sided slopes name each way a derivative fails', () => {
  const F = TT.FUNCS;
  assert.deepEqual([TT.classify(F.abs.f, 0).kind, TT.classify(F.abs.f, 0).L, TT.classify(F.abs.f, 0).R], ['corner', -1, 1]);
  const pc = TT.classify(F.corner.f, 1); assert.equal(pc.kind, 'corner'); assert.ok(Math.abs(pc.L - 2) < 1e-4 && Math.abs(pc.R + 1) < 1e-4);
  assert.equal(TT.classify(F.smooth.f, 1).kind, 'smooth', 'pieces with matching slopes join smoothly');
  assert.equal(TT.classify(F.cbrt.f, 0).kind, 'vertical');
  assert.equal(TT.classify(F.cusp.f, 0).kind, 'cusp');
  assert.equal(TT.classify(F.jump.f, 1).kind, 'jump');
  const ep = TT.classify(F.sqrt.f, 0); assert.equal(ep.kind, 'endpoint'); assert.equal(ep.R, Infinity);
  assert.equal(TT.classify(F.ln.f, -1).kind, 'undefined');
  for (const x of [-2.3, -0.4, 0.7, 2.9]) assert.equal(TT.classify(F.cubic.f, x).kind, 'smooth');
  // a typed function: the corner of |x - 1| is found numerically, and f' breaks there
  const c = TT.custom('x^2 + |x - 1|');
  assert.ok(c.ok);
  assert.equal(TT.classify(c.f, 1).kind, 'corner');
  assert.ok(Number.isNaN(c.dn(1)) && Math.abs(c.dn(2) - 5) < 1e-6 && Math.abs(c.dn(0) - (-1)) < 1e-6);
  assert.ok(Number.isNaN(TT.slopeAt(c, 1)) && Math.abs(TT.slopeAt(c, 0.5) - 0) < 1e-6);
  assert.equal(TT.custom('x +* 2').ok, false);
  assert.equal(TT.custom('ln(-x - 10)').ok, false, 'no values in the window');
});

test('tangent-tracer: the h slider is a log scale with both sides and a middle at h = 0.001', () => {
  assert.equal(TT.hOf(1), 0.001); assert.equal(TT.hOf(-1), -0.001); assert.equal(TT.hOf(1000), 2); assert.equal(TT.hOf(0), 0.001);
  for (const h of [0.001, 0.01, 0.1, 1, -0.1]) assert.ok(Math.abs(TT.hOf(TT.sOf(h)) - h) <= 0.03 * Math.abs(h) + 1e-9);
  assert.ok(Math.abs(TT.sOf(0.01) - 303) <= 2, 'a decade is about 303 steps of 1000');
});

test('tangent-tracer: tangent lines are written the way a teacher would, and mean the right line', () => {
  const cases = [[2, 4, -3, 'y = 4 - 3(x - 2)'], [-2, 1, 0.5, 'y = 1 + 0.5(x + 2)'], [0, 1, 1, 'y = 1 + x'], [1, 0, 2, 'y = 2(x - 1)'], [3, -1, -1, 'y = -1 - (x - 3)'], [2, 5, 0, 'y = 5']];
  for (const [a, fa, m, tex] of cases) {
    const L = TT.line(a, fa, m);
    assert.equal(L.tex, tex);
    const g = M.fn(L.typed);
    for (const x of [-1.3, 0, 2.2]) assert.ok(Math.abs(g(x) - (fa + m * (x - a))) < 1e-9, `${L.typed} at ${x}`);
  }
  const L = TT.line({ typed: 'pi/2', tex: '\\frac{\\pi}{2}', v: Math.PI / 2 }, 0, -1);
  assert.equal(L.typed, '-(x - pi/2)');
});

test('tangent-tracer: the sketch grader names each miss', () => {
  const p = TT.generate(M.rng(5), ctx('sketch-fprime'), 'sketch'), s = p.steps[0];
  assert.equal(TT.gradeSketch(s, s.answers).ok, true);
  const codes = v => TT.gradeSketch(s, v).points.map(q => q.code);
  assert.ok(codes(s.xs.map(() => null)).every(c => c === 'unset'));
  const k = s.answers.findIndex(m => m !== 0), z = s.answers.findIndex(m => m === 0);
  const flip = s.answers.slice(); flip[k] = -flip[k];
  assert.ok(['sign', 'height'].includes(codes(flip)[k]));
  const zero = s.answers.slice(); zero[k] = 0;
  assert.ok(['zero', 'fzero'].includes(codes(zero)[k]));
  const far = s.answers.slice(); far[k] = s.answers[k] * 2.2;
  if (Math.abs(far[k]) <= s.Y) assert.ok(['steep', 'height'].includes(codes(far)[k]));
  if (z > -1){ const lift = s.answers.slice(); lift[z] = s.Y * 0.6; assert.equal(codes(lift)[z], 'notzero'); assert.match(TT.gradeSketch(s, lift).points[z].why, /flat|peak|valley/); }
  // the height trap: plotting f(x) where it differs from f'(x)
  for (let seed = 1; seed < 200; seed++) {
    const q = TT.generate(M.rng(seed), ctx('sketch-fprime'), 'sketch').steps[0];
    const j = q.xs.findIndex((x, i) => Math.abs(q.fvals[i] - q.answers[i]) > q.tol * 2 && Math.abs(q.fvals[i]) <= q.Y && Math.abs(q.fvals[i]) > q.zeroTol);
    if (j < 0) continue;
    const v = q.answers.slice(); v[j] = q.fvals[j];
    assert.equal(TT.gradeSketch(q, v).points[j].code, 'height'); break;
  }
});

test('tangent-tracer: planted mistakes are caught by the independent recheck', () => {
  const est = TT.generate(M.rng(9), ctx('slope-graph'));
  assert.deepEqual(recheck(est, ctx('slope-graph'), { figures: true }), []);
  const e1 = strip(est); e1.fn = est.fn; e1.steps[0].cell.answer += 0.5;
  assert.ok(recheck(e1, ctx('slope-graph')).some(x => /slope key/.test(x)));
  const tab = TT.generate(M.rng(9), ctx('rate-table')), t1 = strip(tab);
  t1.steps[1].cell.answer = -t1.steps[1].cell.answer - 1;
  assert.ok(recheck(t1, ctx('rate-table')).some(x => /difference quotient/.test(x)));
  const wg = TT.generate(M.rng(9), ctx('which-fprime')), w1 = strip(wg);
  w1.steps[0].correct = (w1.steps[0].correct + 1) % 4;
  assert.ok(recheck(w1, ctx('which-fprime')).some(x => /keyed graph/.test(x)));
  const tl = TT.generate(M.rng(9), ctx('tangent-power')), l1 = strip(tl);
  l1.steps[2].cell.expr.answer = l1.steps[2].cell.expr.answer.replace(/\(x - /, '(x + ');
  assert.ok(recheck(l1, ctx('tangent-power')).some(x => /line key/.test(x)));
  const nd = TT.generate(M.rng(9), ctx('not-differentiable')), n1 = { ...nd, steps: nd.steps.map(s => ({ ...s })) };
  n1.steps[2] = { ...n1.steps[2], correct: 1 - n1.steps[2].correct };
  assert.ok(recheck(n1, ctx('not-differentiable')).some(x => /continuity key/.test(x)));
  const sk = TT.generate(M.rng(9), ctx('sketch-fprime')), s1 = { ...sk, steps: [{ ...sk.steps[0], answers: sk.steps[0].answers.map(v => v + 1) }] };
  assert.ok(recheck(s1, ctx('sketch-fprime')).length > 0);
});

test('tangent-tracer: the validator\'s own one-sided test agrees with the textbook cases', () => {
  assert.equal(sides(Math.abs, 0).diff, false);
  assert.equal(sides(Math.abs, 0).continuous, true);
  assert.equal(sides(x => x * x, 0.3).diff, true);
  assert.equal(sides(x => (x < 1 ? 0 : 1), 1).continuous, false);
  const cb = sides(TT.cbrt, 0); assert.ok(cb.L.inf && cb.R.inf && cb.L.sign === cb.R.sign);
});
