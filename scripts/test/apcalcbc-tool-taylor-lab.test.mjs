/* Taylor lab: its model (calculus-bc/assets/tools/math/taylor-lab.js), page script and validator
   (scripts/lib/apcalcbc-tool-checks/taylor-lab.mjs). OWNED BY THIS TOOL ONLY (builder T1).
   Every gallery derivative against a numeric derivative, P_n agreeing with f at the center to
   order n, the Lagrange bound never below the true error (and the band containing f), the
   alternating bound where it applies, same seed same problem, planted slips caught, and the
   shipped data passing its validator. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
process.env.APCALC_COURSE = 'bc';
const { loadMap, ROOT } = await import('../lib/apcalc-build.mjs');
const { runtime } = await import('../lib/apcalcbc-tool-checks/_shared.mjs');
const { check } = await import('../lib/apcalcbc-tool-checks/taylor-lab.mjs');

const { M, model: TL } = runtime('taylor-lab');
const data = JSON.parse(readFileSync(join(ROOT, 'calculus-bc', 'data', 'tools', 'taylor-lab.json'), 'utf8'));

test('taylor-lab: the model registers, the page script parses, and the validator checks the frame', () => {
  assert.ok(TL && typeof TL.generate === 'function' && !TL.stub);
  assert.doesNotThrow(() => new Function(readFileSync(join(ROOT, 'calculus-bc', 'assets', 'tools', 'taylor-lab.js'), 'utf8')));
  const map = loadMap();
  const ok = { slug: 'taylor-lab', kind: 'simulator', topic: 'taylor-polynomials', intro: '<p>x</p>', howItWorks: '<p>x</p>', contexts: [{ id: 'c1', kind: 'coef', topic: 'taylor-polynomials' }] };
  assert.deepEqual(check(ok, map), []);
  assert.ok(check({ ...ok, topic: 'nope' }, map).some(e => /topic/.test(e)));
  assert.ok(check({ ...ok, slug: 'other' }, map).some(e => /slug/.test(e)));
  assert.ok(check({ ...ok, contexts: [{ id: 'c1', kind: 'euler', topic: 'taylor-polynomials' }] }, map).some(e => /kind/.test(e)));
  const pages = JSON.parse(readFileSync(join(ROOT, 'calculus-bc', 'data', 'pages.json'), 'utf8'));
  assert.equal(pages.tools.find(t => t.slug === 'taylor-lab').topic, 'taylor-polynomials');
});

test('taylor-lab: every derivative formula matches a numeric derivative of the one before', () => {
  for (const F of TL.FUNCS) {
    for (const t of [F.centers[0], (F.centers[0] + F.centers[1]) / 2 + 0.13, F.centers[1]]) {
      assert.ok(Math.abs(F.d(0, t) - F.f(t)) < 1e-12, `${F.id}: d(0) is f`);
      for (let k = 0; k < 7; k++) {
        const h = 1e-5, num = (F.d(k, t + h) - F.d(k, t - h)) / (2 * h), want = F.d(k + 1, t);
        assert.ok(Math.abs(num - want) < 1e-5 * Math.max(1, Math.abs(want)), `${F.id}: d(${k + 1}) at ${t}: ${want} vs ${num}`);
      }
    }
  }
});

test('taylor-lab: P_n matches f at the center to order n, and the Maclaurin polynomials are the known ones', () => {
  for (const F of TL.FUNCS) for (const c of [0, F.centers[1] / 2]) for (const n of [1, 3, 6]) {
    assert.ok(Math.abs(TL.poly(F, c, n, c) - F.f(c)) < 1e-12);
    const r = h => Math.abs(F.f(c + h) - TL.poly(F, c, n, c + h)) / Math.abs(h) ** (n + 1);
    assert.ok(r(0.02) < 2 * r(0.04) + 1e-3, `${F.id} about ${c}, n = ${n}: not of order ${n + 1}`);
  }
  const e = TL.funcById('exp'), s = TL.funcById('sin');
  assert.deepEqual(Array.from(TL.coef(e, 0, 4), a => +a.toFixed(12)), [1, 1, 0.5, +(1 / 6).toFixed(12), +(1 / 24).toFixed(12)]);
  assert.equal(TL.polyTex(s, 0, 5), 'x - \\frac{x^{3}}{6} + \\frac{x^{5}}{120}');
  assert.ok(!/cdots/.test(TL.polyTex(e, 0, 6)), 'a polynomial is written without + ...');
});

test('taylor-lab: the Lagrange bound is never below the true error, and the alternating bound holds where it applies', () => {
  for (const F of TL.FUNCS) for (const c of [0, F.centers[0] / 2]) for (const n of [0, 1, 2, 4, 7]) {
    for (let i = 0; i <= 40; i++) {
      const x = F.view.x[0] + (F.view.x[1] - F.view.x[0]) * i / 40;
      if (!(x > F.lo && x < F.hi) || !isFinite(F.f(x))) continue;
      const err = Math.abs(F.f(x) - TL.poly(F, c, n, x)), L = TL.lagrange(F, c, n, x);
      assert.ok(err <= L.bound * (1 + 1e-9) + 1e-12, `${F.id} about ${c}, n = ${n}, x = ${x}: error ${err} > Lagrange ${L.bound}`);
      const A = TL.altBound(F, c, n, x);
      if (A) assert.ok(err <= A.bound * (1 + 1e-9) + 1e-12, `${F.id}, n = ${n}, x = ${x}: error ${err} > alternating ${A.bound}`);
    }
  }
  // sin: P_3 at 0.5, the bound is the x^5 term (the x^4 term is 0)
  const A = TL.altBound(TL.funcById('sin'), 0, 3, 0.5);
  assert.equal(A.k, 5); assert.ok(Math.abs(A.bound - 0.5 ** 5 / 120) < 1e-15);
  assert.equal(TL.altBound(TL.funcById('exp'), 0, 3, 0.5), null, 'e^x at a positive x does not alternate');
  // M for sin, n = 2, on [0, 2]: |f'''| = |cos| reaches 1 at 0
  assert.equal(TL.maxAbsDeriv(TL.funcById('sin'), 3, 0.2, 2), Math.max(Math.abs(Math.cos(0.2)), Math.abs(Math.cos(2))));
  assert.equal(TL.maxAbsDeriv(TL.funcById('sin'), 4, 0.2, 2), 1);
});

test('taylor-lab: same seed, same problem; every context generates its kind', () => {
  for (const c of data.contexts) {
    const a = TL.generate(M.rng(4242), c), b = TL.generate(M.rng(4242), c);
    assert.equal(JSON.stringify(a), JSON.stringify(b), c.id);
    assert.equal(a.type, c.kind);
  }
});

test('taylor-lab: the validator catches planted mistakes', () => {
  const map = loadMap(), gen = TL.generate;
  const one = id => ({ ...data, contexts: data.contexts.filter(c => c.id === id) });
  const plant = (id, f, re) => {
    TL.generate = (r, c, t) => f(gen(r, c, t));
    try { const errs = check(one(id), map); assert.ok(errs.some(e => re.test(e)), `${id}: ${errs.slice(0, 3).join(' | ') || 'no error'}`); }
    finally { TL.generate = gen; }
  };
  const step = (p, k) => p.steps.find(s => s.key === k);
  plant('table', p => { const s = step(p, 'c3') || step(p, 'd3'); s.cell.answer *= 6; return p; }, /step (c3|d3) keyed/);
  plant('table', p => { const s = step(p, 'P3'); if (s) s.cell.expr.answer = s.cell.expr.answer + ' + (x)^3'; else step(p, 'd2').cell.answer += 1; return p; }, /P3 key|step d2/);
  plant('known', p => { step(p, 'Pn').cell.expr.answer += ' + x^2'; return p; }, /order|coefficient|keyed/);
  plant('known', p => { step(p, 'dm').cell.answer /= 2; return p; }, /step dm keyed/);
  plant('built', p => { const s = step(p, 'how'); s.correct = (s.correct + 1) % s.options.length; return p; }, /"how" option/);
  plant('lagrange', p => { step(p, 'B').cell.answer *= 3; return p; }, /step B keyed/);
  plant('lagrange', p => { const s = step(p, 'tol'); s.correct = (s.correct + 1) % s.options.length; return p; }, /tolerance keyed/);
  plant('altseries', p => { step(p, 'N').cell.answer += 1; return p; }, /step N keyed/);
  plant('alttaylor', p => { step(p, 'B').cell.answer *= 5; return p; }, /step B keyed/);
});

test('taylor-lab: the shipped data passes its validator', () => {
  assert.deepEqual(check(data, loadMap()), []);
});
