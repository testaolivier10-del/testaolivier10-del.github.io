/* Polar lab: its model (calculus-bc/assets/tools/math/polar-lab.js), page script and validator
   (scripts/lib/apcalcbc-tool-checks/polar-lab.mjs). OWNED BY THIS TOOL ONLY (builder T2).
   The shipped data passes (300 problems per context, keys recomputed from the givens); the frame
   and curve list are checked; polar areas against their closed forms and a numeric integral (the
   cardioid 6π, a petal 3π/4, the limaçon's inner loop π − 3√3/2); dy/dx in polar; toward or away
   from the sign of r·dr/dθ; same seed same problem; the named slips (the ½ dropped, r not squared,
   (R − r)², dr/dθ as the slope); a planted wrong key caught. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
process.env.APCALC_COURSE = 'bc';
const { loadMap, ROOT } = await import('../lib/apcalc-build.mjs');
const { runtime } = await import('../lib/apcalcbc-tool-checks/_shared.mjs');
const { check, curveProblems } = await import('../lib/apcalcbc-tool-checks/polar-lab.mjs');

const { M, Expr, model } = runtime('polar-lab');
const data = () => JSON.parse(readFileSync(join(ROOT, 'calculus-bc', 'data', 'tools', 'polar-lab.json'), 'utf8'));
const close = (a, b, e = 1e-9) => Math.abs(a - b) <= e * Math.max(1, Math.abs(b));
const S = (p, k) => p.steps.find(s => s.key === k);
const PI = Math.PI;

test('polar-lab: the shipped data passes its validator (300 problems per context, keys recomputed)', () => {
  assert.deepEqual(check(data(), loadMap()), []);
});

test('polar-lab: the page script parses, pages.json names the topic, the frame and curve list are checked', () => {
  assert.doesNotThrow(() => new Function(readFileSync(join(ROOT, 'calculus-bc', 'assets', 'tools', 'polar-lab.js'), 'utf8')));
  const pages = JSON.parse(readFileSync(join(ROOT, 'calculus-bc', 'data', 'pages.json'), 'utf8'));
  assert.equal(pages.tools.find(t => t.slug === 'polar-lab').topic, 'polar-derivatives');
  const map = loadMap(), d = { ...data(), contexts: [] };
  assert.ok(check({ ...d, slug: 'other' }, map).some(e => /slug/.test(e)));
  assert.ok(check({ ...d, curves: [{ id: 'nope', topic: 'polar-derivatives' }] }, map).some(e => /unknown curve/.test(e)));
  assert.ok(check({ ...d, curves: [{ id: 'moon', topic: 'polar-derivatives' }] }, map).some(e => /polar-area-between/.test(e)));
  assert.ok(check({ ...d, contexts: [{ id: 'x', topic: 'polar-derivatives', kind: 'area' }] }, map).some(e => /belongs to topic/.test(e)));
});

test('polar-lab: areas against closed forms and a numeric integral; slopes; toward or away', () => {
  assert.deepEqual(curveProblems(model, Expr), []);
  const C = model.CURVES;
  assert.ok(close(model.area(C.cardioid, 0, 2 * PI), 6 * PI));
  assert.ok(close(model.area(C.rose3, 0, PI / 3), 3 * PI / 4));
  assert.ok(close(model.area(C.rose3, 0, PI), 9 * PI / 4));
  assert.ok(close(model.area(C.limacon, 2 * PI / 3, 4 * PI / 3), PI - 3 * Math.sqrt(3) / 2));
  assert.ok(close(model.area(C.limacon, 0, 2 * PI), 3 * PI));                 // the inner loop counted twice
  for (const id of model.PORDER) { const p = model.PAIRS[id], L = model.limits(p); assert.ok(close(model.area(p, L[0].v, L[1].v), p.exact)); }
  // a polar area against a plain midpoint sum of ½r²
  const f = Expr.fn(C.rose4.r, ['theta']); let s = 0; const n = 50000, h = (PI / 2) / n;
  for (let i = 0; i < n; i++) { const r = f(-PI / 4 + (i + 0.5) * h); s += r * r / 2 * h; }
  assert.ok(close(model.area(C.rose4, -PI / 4, PI / 4), s, 1e-8));
  const a = model.at(C.cardioid, PI / 2);                                      // r = 2, r' = -2: slope 1
  assert.ok(close(a.slope, 1) && close(a.x, 0) && close(a.y, 2));
  assert.equal(model.motion(2, -1), 'toward');
  assert.equal(model.motion(-2, 1), 'toward');                                 // r < 0: |r| shrinks
  assert.equal(model.motion(-2, -1), 'away');
});

test('polar-lab: same seed, same problem; the slips are named', () => {
  for (const kind of model.KINDS) {
    const ctx = { id: kind, topic: 't', kind };
    assert.equal(model.generate(M.rng(7), ctx).text, model.generate(M.rng(7), ctx).text, kind);
  }
  let negR = 0;
  for (let i = 1; i < 80; i++) {
    const ar = model.generate(M.rng(i), { id: 'a', topic: 't', kind: 'area' }), A = ar.values.area;
    assert.match(M.diagnose(S(ar, 'area').cell, 2 * A).why || '', /½|1}{2}|frac/);                  // the ½ dropped
    assert.match(String(S(ar, 'setup').why[2]), /Square/);                                          // r not squared
    const bt = model.generate(M.rng(i), { id: 'b', topic: 't', kind: 'between' });
    assert.match(String(S(bt, 'setup').why[1]), /R\^2 - r\^2|R2|squar|Square/i);                     // (R − r)²
    const co = model.generate(M.rng(i), { id: 'c', topic: 't', kind: 'coords' });
    assert.match(M.diagnose(S(co, 'dydx').cell, co.values.dr).why || '', /rate of change of/);       // dr/dθ as the slope
    if (Expr.fn(co.values.given.r, ['theta'])(co.values.th) < 0) negR++;
  }
  assert.ok(negR > 0, 'some coordinate problems have r < 0');
});

test('polar-lab: a planted wrong key is caught', () => {
  const real = model.generate;
  model.generate = (r, c, t) => { const p = real(r, c, t); if (p.type === 'area') { const s = S(p, 'area'); s.cell.answer *= 2; s.cell.mistakes = []; } return p; };
  try { const d = data(); assert.ok(check({ ...d, contexts: d.contexts.filter(c => c.kind === 'area') }, loadMap()).some(e => /area key/.test(e))); }
  finally { model.generate = real; }
});
