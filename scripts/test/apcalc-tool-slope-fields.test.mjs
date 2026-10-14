/* Slope fields: its model (calculus/assets/tools/math/slope-fields.js) and its
   validator (scripts/lib/apcalc-tool-checks/slope-fields.mjs). OWNED BY THIS
   TOOL ONLY. The integrator against exact solutions, domain endpoints, the
   field, the sketch grader, same seed same problem, planted mistakes caught,
   and the shipped data passing the validator. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { runtime } from '../lib/apcalc-tool-checks/_shared.mjs';
import { check } from '../lib/apcalc-tool-checks/slope-fields.mjs';
import { loadMap, ROOT } from '../lib/apcalc-build.mjs';

const { M, model: S } = runtime('slope-fields');
const data = JSON.parse(readFileSync(join(ROOT, 'calculus', 'data', 'tools', 'slope-fields.json'), 'utf8'));

test('slope-fields: the model registers, and the validator checks the frame', () => {
  assert.ok(M && S && typeof S.generate === 'function');
  const map = loadMap();
  const ok = { slug: 'slope-fields', kind: 'simulator', topic: 'sketching-slope-fields', intro: '<p>x</p>', howItWorks: '<p>x</p>', contexts: [{ id: 'c1', kind: 'slopes', topic: 'sketching-slope-fields' }] };
  assert.deepEqual(check(ok, map), []);
  assert.ok(check({ ...ok, topic: 'nope' }, map).some(e => /topic/.test(e)));
  assert.ok(check({ ...ok, slug: 'other' }, map).some(e => /slug/.test(e)));
  assert.ok(check({ ...ok, contexts: [{ id: 'c1', kind: 'euler', topic: 'sketching-slope-fields' }] }, map).some(e => /kind/.test(e)));
});

test('slope-fields: the traced solution matches the exact one for every gallery equation', () => {
  for (const d of S.GALLERY) {
    const p = d.params, F = S.fns(d, p), [x0, y0] = d.start, ex = d.exact(x0, y0, p);
    const sol = S.solve(F.f, x0, y0, d.view);
    let worst = 0;
    for (const [x, y] of sol.pts) if (x >= ex.lo && x <= ex.hi) worst = Math.max(worst, Math.abs(y - ex.fn(x)) / Math.max(1, Math.abs(ex.fn(x))));
    assert.ok(worst < 1e-6, `${d.id}: traced solution off by ${worst}`);
    assert.ok(sol.pts.length > 50, `${d.id}: too few points to draw`);
    // and the slope of the curve is the field's slope
    const mid = sol.pts[Math.floor(sol.pts.length / 2)];
    assert.ok(Math.abs(M.deriv(ex.fn, mid[0]) - F.f(mid[0], mid[1])) < 1e-5, `${d.id}: slope`);
    // d2y/dx2 along the solution
    assert.ok(Math.abs(M.deriv2(ex.fn, mid[0]) - F.f2(mid[0], mid[1])) < 1e-3 * Math.max(1, Math.abs(F.f2(mid[0], mid[1]))), `${d.id}: second derivative`);
  }
});

test('slope-fields: x/y stops where the slope turns vertical, at the edge of the domain', () => {
  const d = S.de('x/y'), sol = S.solve(d.f, 2, 1, d.view); // y^2 = x^2 - 3
  assert.equal(sol.left.why, 'vertical');
  assert.ok(Math.abs(sol.left.x - Math.sqrt(3)) < 1e-3, `stopped at ${sol.left.x}`);
  assert.equal(sol.right.why, 'edge');
  const ex = d.exact(2, 1);
  assert.ok(Math.abs(ex.lo - Math.sqrt(3)) < 1e-12 && ex.hi === Infinity);
});

test('slope-fields: rk45 is accurate, and the field has one segment per grid point', () => {
  assert.ok(Math.abs(S.rk45((x, y) => y, 0, 1, 1) - Math.E) < 1e-9);
  assert.ok(Math.abs(S.rk45((x, y) => -2 * x * y, 0, 1, 1.5) - Math.exp(-2.25)) < 1e-9);
  const g = S.grid({ x: [-3, 3], y: [-3, 3] }), f = S.field((x, y) => x + y, { x: [-3, 3], y: [-3, 3] });
  assert.equal(f.length, g.xs.length * g.ys.length);
  assert.ok(f.every(s => s.m === s.x + s.y));
  assert.equal(Math.round(S.halfLife(-0.1) * 1e6), Math.round(Math.LN2 / 0.1 * 1e6));
});

test('slope-fields: the sketch grader names the slip', () => {
  const fig = { x0: 0, y0: 1, xs: [-2, -1, 1, 2, 3], eq: [0], truth: [], tol: [] };
  fig.xs.forEach(x => { const t = Math.exp(x); fig.truth.push(t); fig.tol.push(S.sketchTol(t, 1)); }); // dy/dx = y through (0, 1)
  assert.equal(S.sketchGrade(fig, fig.truth), 0);
  assert.equal(S.sketchGrade(fig, fig.truth.map((t, i) => i === 0 ? -0.5 : t)), 2, 'crossing y = 0');
  assert.equal(S.sketchGrade(fig, [1.5, 1.2, 0.5, 0.3, 0.2]), 1, 'wrong way');
  assert.equal(S.sketchGrade(fig, fig.truth.map((t, i) => i === 4 ? t * 0.6 : t)), 3, 'drifts off');
});

test('slope-fields: same seed, same problem; every kind generates', () => {
  for (const c of data.contexts) {
    const a = S.generate(M.rng(4242), c), b = S.generate(M.rng(4242), c);
    assert.equal(JSON.stringify(a), JSON.stringify(b), c.id);
    assert.equal(a.type, c.kind);
  }
});

test('slope-fields: the validator catches planted mistakes', () => {
  const map = loadMap();
  const one = kind => ({ ...data, contexts: data.contexts.filter(c => c.kind === kind).slice(0, 1) });
  const orig = S.generate;
  const plant = (kind, fn, re) => {
    S.generate = (r, c, t) => { const p = orig(r, c, t); if (p.type === kind) fn(p); return p; };
    try { const e = check(one(kind), map); assert.ok(e.some(x => re.test(x)), `${kind}: ${e[0] || 'no error'}`); } finally { S.generate = orig; }
  };
  plant('slopes', p => { p.steps[0].cell.answer += 1; }, /slope at/);
  plant('sketch', p => { p.fig.truth[0] += 0.5; }, /true solution/);
  plant('separate', p => { p.steps[3].cell.expr.answer = p.steps[3].cell.expr.mistakes.slice(-1)[0].expr; p.steps[3].cell.expr.mistakes.pop(); }, /y\(0\)|fails the equation/);
  plant('concavity', p => { p.steps[0].cell.expr.answer = p.steps[0].cell.expr.mistakes[0].expr; p.steps[0].cell.expr.mistakes.shift(); }, /implicit differentiation/);
  plant('exp', p => { p.steps[1].cell.answer = 2 / p.fig.T; }, /\bk\b/);
  plant('match', p => { p.steps[0].correct = (p.steps[0].correct + 1) % 4; }, /keyed field/);
});

test('slope-fields: the shipped data passes its validator', () => {
  assert.deepEqual(check(data, loadMap()), []);
});
