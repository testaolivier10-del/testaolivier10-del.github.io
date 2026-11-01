/* Euler and logistic: its model (calculus-bc/assets/tools/math/euler-logistic.js), page script and validator
   (scripts/lib/apcalcbc-tool-checks/euler-logistic.mjs). OWNED BY THIS TOOL ONLY (builder T3).
   Euler against a hand-worked table, the gallery's exact solutions against
   RK4, Euler's error shrinking with the step size, the logistic facts, same
   seed same problem, planted slips caught, and the shipped data passing. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
process.env.APCALC_COURSE = 'bc';
const { loadMap, ROOT } = await import('../lib/apcalc-build.mjs');
const { runtime } = await import('../lib/apcalcbc-tool-checks/_shared.mjs');
const { check } = await import('../lib/apcalcbc-tool-checks/euler-logistic.mjs');
const { M, model: E } = runtime('euler-logistic');
const DATA = join(ROOT, 'calculus-bc', 'data', 'tools', 'euler-logistic.json');
const data = JSON.parse(readFileSync(DATA, 'utf8'));
const map = loadMap();
const plain = v => JSON.parse(JSON.stringify(v));

test('euler-logistic: the model registers, the page script parses, and the validator checks the frame', () => {
  assert.ok(E && typeof E.generate === 'function' && !E.stub);
  assert.doesNotThrow(() => new Function(readFileSync(join(ROOT, 'calculus-bc', 'assets', 'tools', 'euler-logistic.js'), 'utf8')));
  const ok = { slug: 'euler-logistic', kind: 'simulator', topic: 'eulers-method', intro: '<p>x</p>', howItWorks: '<p>x</p>', contexts: [{ id: 'c1', kind: 'euler', topic: 'eulers-method' }] };
  assert.deepEqual(check(ok, map), []);
  assert.ok(check({ ...ok, topic: 'nope' }, map).some(e => /topic/.test(e)));
  assert.ok(check({ ...ok, slug: 'other' }, map).some(e => /slug/.test(e)));
  assert.ok(check({ ...ok, contexts: [{ id: 'c1', kind: 'taylor', topic: 'eulers-method' }] }, map).some(e => /kind/.test(e)));
  const pages = JSON.parse(readFileSync(join(ROOT, 'calculus-bc', 'data', 'pages.json'), 'utf8'));
  assert.equal(pages.tools.find(t => t.slug === 'euler-logistic').topic, 'eulers-method');
});

test('euler-logistic: Euler matches a hand-worked table', () => {
  // dy/dx = x + y, y(0) = 1, h = 0.5: (0, 1) m 1 -> 1.5; (0.5, 1.5) m 2 -> 2.5; (1, 2.5) m 3.5 -> 4.25
  const rows = E.euler((x, y) => x + y, 0, 1, 0.5, 3);
  assert.deepEqual(plain(rows.map(r => [r.x, r.y, r.m])), [[0, 1, 1], [0.5, 1.5, 2], [1, 2.5, 3.5], [1.5, 4.25, 5.75]]);
  assert.deepEqual(plain(rows.map(r => r.dy)), [0.5, 1, 1.75, 2.875]);
  // dy/dt = -0.2(H - 20), H(0) = 80, h = 1: 80 -> 68 -> 58.4
  const c = E.euler((t, H) => -0.2 * (H - 20), 0, 80, 1, 2);
  assert.deepEqual(plain(c.map(r => r.y)), [80, 68, 58.4]);
});

test('euler-logistic: the gallery solutions are exact, and Euler errs on the side its concavity says', () => {
  for (const d of E.GALLERY) {
    const [x0, y0] = d.start, ex = d.exact(x0, y0), x1 = x0 + 1;
    assert.ok(Math.abs(ex.fn(x0) - y0) < 1e-12, `${d.id}: through the start`);
    const t = E.rk4(d.f, x0, y0, x1, 4000);
    assert.ok(Math.abs(t - ex.fn(x1)) < 1e-8, `${d.id}: exact vs RK4 ${ex.fn(x1)} ${t}`);
    assert.ok(Math.abs(M.deriv2(ex.fn, x0 + 0.5) - d.f2(x0 + 0.5, ex.fn(x0 + 0.5))) < 1e-3 * Math.max(1, Math.abs(d.f2(x0 + 0.5, ex.fn(x0 + 0.5)))), `${d.id}: f2 along the solution`);
    // concave up at the start on these: Euler is low
    const e = E.euler(d.f, x0, y0, 0.25, 4);
    const up = d.f2(x0, y0) > 0;
    assert.equal(e[4].y < ex.fn(x1), up, `${d.id}: Euler ${e[4].y} vs true ${ex.fn(x1)}`);
  }
  // error is first order: halving h about halves it
  const d = E.de('y'), err = h => Math.abs(E.euler(d.f, 0, 1, h, Math.round(1 / h))[Math.round(1 / h)].y - Math.E);
  const q = err(0.01) / err(0.005);
  assert.ok(q > 1.9 && q < 2.1, `ratio ${q}`);
});

test('euler-logistic: logistic facts', () => {
  const L = E.logistic(0.5, 800, 100);
  assert.equal(L.half, 400); assert.equal(L.maxRate, 100);
  assert.ok(Math.abs(L.P(0) - 100) < 1e-12 && Math.abs(L.P(60) - 800) < 1e-6);
  assert.ok(Math.abs(L.P(L.tHalf) - 400) < 1e-9);
  assert.ok(Math.abs(M.deriv(L.P, 3) - L.rate(L.P(3))) < 1e-5);
  assert.ok(Math.abs(M.deriv2(L.P, L.tHalf)) < 1e-3);
});

test('euler-logistic: same seed, same problem; every kind generates', () => {
  for (const c of data.contexts) {
    const a = E.generate(M.rng(42), c, c.kind), b = E.generate(M.rng(42), c, c.kind);
    assert.equal(JSON.stringify(a), JSON.stringify(b));
    assert.equal(a.type, c.kind);
  }
});

test('euler-logistic: planted slips are caught', () => {
  const c = data.contexts.find(x => x.kind === 'euler');
  const p = E.generate(M.rng(7), c, 'euler');
  const s = p.steps.find(x => x.key === 'y1'), R = p.fig.rows[0];
  // the slips are named, and the key is not one of them
  assert.ok(M.diagnose(s.cell, s.cell.answer).ok);
  assert.match(M.diagnose(s.cell, R.y + R.m).why || '', /step size/);
  // a wrong key is caught by the validator
  const ctxs = [{ ...c }];
  const orig = E.generate;
  try {
    E.generate = (r, cc, t) => { const q = orig(r, cc, t); q.steps[1].cell.answer += 0.5; return q; };
    assert.ok(check({ ...data, contexts: ctxs }, map).some(e => /after step 1/.test(e)));
    E.generate = (r, cc, t) => { const q = orig(r, cc, t); q.steps[q.steps.length - 1].correct = (q.steps[q.steps.length - 1].correct + 1) % 4; return q; };
    assert.ok(check({ ...data, contexts: [data.contexts.find(x => x.kind === 'logistic')] }, map).some(e => /shape keyed/.test(e)));
    assert.ok(check({ ...data, contexts: [data.contexts.find(x => x.kind === 'overunder')] }, map).some(e => /keyed/.test(e)));
  } finally { E.generate = orig; }
});

test('euler-logistic: the shipped data passes the validator (300 problems per kind)', () => {
  assert.deepEqual(check(data, map), []);
});
