/* Related rates: its model (calculus/assets/tools/math/related-rates.js) and its
   validator (scripts/lib/apcalc-tool-checks/related-rates.mjs). OWNED BY THIS
   TOOL ONLY. Same seed same problem, every scene's rates equal to the time
   derivatives of its quantities, the classic answers, the named misses
   (substituting before differentiating, the wrong sign), planted mistakes
   caught, and the shipped data passing. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runtime } from '../lib/apcalc-tool-checks/_shared.mjs';
import { check, sceneProblems } from '../lib/apcalc-tool-checks/related-rates.mjs';
import { loadMap, ROOT } from '../lib/apcalc-build.mjs';

const { M, model } = runtime('related-rates');
const data = () => JSON.parse(readFileSync(`${ROOT}/calculus/data/tools/related-rates.json`, 'utf8'));

test('related-rates: the shipped data passes its validator (300 problems per context, keys recomputed)', () => {
  assert.deepEqual(check(data(), loadMap()), []);
});

test('related-rates: the frame is checked', () => {
  const map = loadMap(), d = data();
  assert.ok(check({ ...d, topic: 'nope' }, map).some(e => /topic/.test(e)));
  assert.ok(check({ ...d, slug: 'other' }, map).some(e => /slug/.test(e)));
  assert.ok(check({ ...d, contexts: [{ id: 'x', topic: 'related-rates-intro', kind: 'kite' }] }, map).some(e => /kind/.test(e)));
});

test('related-rates: the textbook answers', () => {
  const L = model.SCENES.ladder.at(5, 2);
  assert.ok(Math.abs(L.q.y - 12) < 1e-12 && Math.abs(L.d.y + 10 / 12) < 1e-12);
  const C = model.SCENES.cone.at(5, 3);          // r = 2h/5: dh/dt = 3 / (π (4/25) 25) = 3/(4π)
  assert.ok(Math.abs(C.d.h - 3 / (4 * Math.PI)) < 1e-12 && Math.abs(C.d.r - 0.4 * C.d.h) < 1e-12);
  const S = model.SCENES.shadow.at(20, 5);        // s = 2x/3 at every distance
  assert.ok(Math.abs(S.d.s - 10 / 3) < 1e-12 && Math.abs(S.d.z - 25 / 3) < 1e-12);
  const R = model.SCENES.ripple.at(4, 3);
  assert.ok(Math.abs(R.d.A - 24 * Math.PI) < 1e-12);
  const B = model.SCENES.balloon.at(500, 140);    // sec² = 2: dθ/dt = 140/1000
  assert.ok(Math.abs(B.d.t - 0.14) < 1e-12);
});

test('related-rates: every scene\'s readout rates are the derivatives along its motion', () => {
  assert.deepEqual(sceneProblems(model), []);
  // The cone plays exactly: equal volume steps, not equal depth steps.
  const C = model.SCENES.cone, h1 = C.advance(3, 3, 2);
  assert.ok(Math.abs(C.vol(h1) - C.vol(3) - 6) < 1e-9);
  // Play stops at the ends.
  assert.equal(model.step(model.SCENES.ladder, 12.3, 2, 5), model.SCENES.ladder.driver.max);
});

test('related-rates: same seed, same problem; the misses are named', () => {
  const ctx = { id: 'ladder', topic: 'related-rates-intro', kind: 'ladder' };
  const a = model.generate(M.rng(42), ctx), b = model.generate(M.rng(42), ctx);
  assert.equal(a.text, b.text);
  assert.deepEqual(a.steps.map(s => s.cell && s.cell.answer), b.steps.map(s => s.cell && s.cell.answer));
  for (let i = 1; i < 60; i++) {
    const p = model.generate(M.rng(i), ctx), rate = p.steps.find(s => s.key === 'rate');
    // Substituting before differentiating gives 0: named.
    assert.match(M.diagnose(rate.cell, 0).why, /before differentiating/);
    // The opposite sign is named, not passed.
    const g = M.diagnose(rate.cell, -rate.cell.answer);
    assert.equal(g.ok, false); assert.match(g.why, /sign|negative|positive/i);
    // The derivative with x held constant (substituted first) is named.
    const diff = p.steps.find(s => s.key === 'diff'), held = p.values.top ? '2x*dx/dt' : '2y*dy/dt';
    const ge = M.diagnoseExpr(diff.cell, held);
    assert.equal(ge.ok, false); assert.match(ge.why, /constant|substitute/i);
    assert.equal(M.diagnoseExpr(diff.cell, '2x dx/dt + 2y dy/dt').ok, true);
    assert.equal(M.diagnoseExpr(diff.cell, '2y(dy/dt) + 2x(dx/dt)').ok, true);
  }
});

test('related-rates: a planted wrong key is caught', () => {
  const real = model.generate;
  model.generate = (r, c, t) => { const p = real(r, c, t); if (p.type === 'cone') p.steps.find(s => s.key === 'rate').cell.answer *= 3; return p; };
  try { assert.ok(check(data(), loadMap()).some(e => /dh\/dt/.test(e))); }
  finally { model.generate = real; }
});
