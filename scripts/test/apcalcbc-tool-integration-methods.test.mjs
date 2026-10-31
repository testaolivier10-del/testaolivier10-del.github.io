/* Integration methods: its model (calculus-bc/assets/tools/math/integration-methods.js), page script and validator
   (scripts/lib/apcalcbc-tool-checks/integration-methods.mjs). OWNED BY THIS TOOL ONLY (builder T3).
   The parts gallery against numeric integrals, the uv picture adding up,
   partial fractions recombining, improper limits, same seed same problem,
   planted slips caught, and the shipped data passing. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
process.env.APCALC_COURSE = 'bc';
const { loadMap, ROOT } = await import('../lib/apcalc-build.mjs');
const { runtime } = await import('../lib/apcalcbc-tool-checks/_shared.mjs');
const { check } = await import('../lib/apcalcbc-tool-checks/integration-methods.mjs');
const { M, model: I } = runtime('integration-methods');
const data = JSON.parse(readFileSync(join(ROOT, 'calculus-bc', 'data', 'tools', 'integration-methods.json'), 'utf8'));
const map = loadMap();

test('integration-methods: the model registers, the page script parses, and the validator checks the frame', () => {
  assert.ok(I && typeof I.generate === 'function' && !I.stub);
  assert.doesNotThrow(() => new Function(readFileSync(join(ROOT, 'calculus-bc', 'assets', 'tools', 'integration-methods.js'), 'utf8')));
  const ok = { slug: 'integration-methods', kind: 'skill', topic: 'integration-by-parts', intro: '<p>x</p>', howItWorks: '<p>x</p>', contexts: [{ id: 'c1', kind: 'parts', topic: 'integration-by-parts' }] };
  assert.deepEqual(check(ok, map), []);
  assert.ok(check({ ...ok, topic: 'nope' }, map).some(e => /topic/.test(e)));
  assert.ok(check({ ...ok, slug: 'other' }, map).some(e => /slug/.test(e)));
  assert.ok(check({ ...ok, contexts: [{ id: 'c1', kind: 'euler', topic: 'integration-by-parts' }] }, map).some(e => /kind/.test(e)));
  const pages = JSON.parse(readFileSync(join(ROOT, 'calculus-bc', 'data', 'pages.json'), 'utf8'));
  assert.equal(pages.tools.find(t => t.slug === 'integration-methods').topic, 'integration-by-parts');
});

test('integration-methods: each parts antiderivative matches a numeric integral, and the uv picture adds up', () => {
  for (const g of I.PARTS) {
    const b = g.b0, num = M.integral(g.f, g.a, b, 1e-11);
    assert.ok(Math.abs(g.F(b) - g.F(g.a) - num) < 1e-8, `${g.id}: ${num}`);
    const P = I.partsPicture(g, b);
    // ∫u dv + ∫v du = [uv]: the v du area by a numeric integral of v(x) u'(x)
    const vdu = M.integral(x => g.v(x) * M.deriv(g.u, x), g.a, b, 1e-10);
    assert.ok(Math.abs(P.vdu - vdu) < 1e-6, `${g.id}: v du ${P.vdu} vs ${vdu}`);
    assert.ok(Math.abs(P.udv + P.vdu - (P.uvb - P.uva)) < 1e-12);
  }
  // ∫_0^1 x e^x dx = 1, ∫_1^e ln x dx = 1
  assert.ok(Math.abs(I.parts('xex').F(1) - I.parts('xex').F(0) - 1) < 1e-12);
  assert.ok(Math.abs(I.parts('lnx').F(Math.E) - I.parts('lnx').F(1) - 1) < 1e-12);
});

test('integration-methods: partial fractions recombine, improper limits are right', () => {
  for (const g of I.PF) for (const x of [-4.3, -0.4, 0.7, 5.1]) {
    const whole = (g.c * x + g.d) / ((x - g.p) * (x - g.q)), split = g.A / (x - g.p) + g.B / (x - g.q);
    assert.ok(Math.abs(whole - split) < 1e-12, `${g.id} at ${x}`);
  }
  for (const g of I.IMPROPER) {
    const far = g.kind === 'inf' ? 1e9 : 1e-9, v = I.partial(g, far);
    if (Number.isFinite(g.limit)) assert.ok(Math.abs(v - g.limit) < 1e-3, `${g.id}: ${v}`);
    else assert.ok(v > 15, `${g.id} should diverge: ${v}`);
    const b = g.kind === 'inf' ? g.a + 2 : g.a / 3, sim = g.kind === 'inf' ? M.integral(g.f, g.a, b, 1e-11) : M.integral(g.f, b, g.a, 1e-11);
    assert.ok(Math.abs(I.partial(g, b) - sim) < 1e-8, `${g.id}: partial`);
  }
});

test('integration-methods: same seed, same problem; every kind generates', () => {
  for (const c of data.contexts) {
    const a = I.generate(M.rng(42), c, c.kind), b = I.generate(M.rng(42), c, c.kind);
    assert.equal(JSON.stringify(a), JSON.stringify(b));
    assert.equal(a.type, c.kind);
  }
});

test('integration-methods: planted slips are caught', () => {
  const ctx = k => [data.contexts.find(x => x.kind === k)];
  const p = I.generate(M.rng(9), ctx('partial')[0], 'partial'), fa = p.steps[0];
  assert.match(M.diagnose(fa.cell, p.fig.B).why || '', /That is B/);
  const pr = I.generate(M.rng(3), ctx('parts')[0], 'parts'), last = pr.steps.find(s => s.key === 'pr');
  const wrongSign = last.cell.expr.mistakes.find(m => /Sign/.test(m.why));
  assert.ok(wrongSign && !M.diagnoseExpr(last.cell, wrongSign.expr + ' + C').ok);
  assert.match(M.diagnoseExpr(last.cell, wrongSign.expr + ' + C').why || '', /Sign/);
  const orig = I.generate;
  try {
    I.generate = (r, c, t) => { const q = orig(r, c, t); if (q.type === 'partial') q.steps[0].cell.answer += 1; return q; };
    assert.ok(check({ ...data, contexts: ctx('partial') }, map).some(e => /A keyed/.test(e)));
    I.generate = (r, c, t) => { const q = orig(r, c, t); const s = q.steps.find(x => x.key === 'ic'); s.correct = (s.correct + 1) % 4; return q; };
    assert.ok(check({ ...data, contexts: ctx('improper') }, map).some(e => /keyed/.test(e)));
    I.generate = (r, c, t) => { const q = orig(r, c, t); const s = q.steps.find(x => x.key === 'cm'); s.correct = (s.correct + 1) % 4; return q; };
    assert.ok(check({ ...data, contexts: ctx('choose') }, map).some(e => /method keyed/.test(e)));
    I.generate = (r, c, t) => { const q = orig(r, c, t); const s = q.steps.find(x => x.key === 'tr'); s.cell.expr.answer += ' + x'; return q; };
    assert.ok(check({ ...data, contexts: ctx('tabular') }, map).some(e => /antiderivative is wrong|graded/.test(e)));
  } finally { I.generate = orig; }
});

test('integration-methods: the shipped data passes the validator (300 problems per kind)', () => {
  assert.deepEqual(check(data, map), []);
});
