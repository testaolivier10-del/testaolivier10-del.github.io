/* Collision lab: its model (physics/assets/tools/math/collision-lab.js) and its
   validator (scripts/lib/apphys-tool-checks/collision-lab.mjs). OWNED BY THIS
   TOOL ONLY. Momentum conserved in every collision, the center of mass at
   constant velocity, impulse = area = Δp whatever the stiffness, the same
   seed giving the same problem, slips named, planted mistakes caught, and
   the shipped data passing. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runtime } from '../lib/apphys-tool-checks/_shared.mjs';
import { check } from '../lib/apphys-tool-checks/collision-lab.mjs';
import { loadMap } from '../lib/apphys-build.mjs';

const { M, model: C } = runtime('collision-lab');
const data = () => JSON.parse(readFileSync(new URL('../../physics/data/tools/collision-lab.json', import.meta.url), 'utf8'));
const ctx = { id: 't', topic: 'collisions' };
const KE = (m1, m2, a, b) => 0.5 * m1 * a * a + 0.5 * m2 * b * b;

test('collision-lab: the frame is checked (slug, topic)', () => {
  const map = loadMap();
  const ok = { slug: 'collision-lab', kind: 'simulator', topic: 'collisions', intro: '<p>x</p>', howItWorks: '<p>x</p>', contexts: [{ id: 'c1', topic: 'collisions', types: ['cm'] }] };
  assert.deepEqual(check(ok, map), []);
  assert.ok(check({ ...ok, topic: 'nope' }, map).some(e => /topic/.test(e)));
  assert.ok(check({ ...ok, slug: 'other' }, map).some(e => /slug/.test(e)));
});

test('momentum is conserved in every collision, elastic to sticky, and K only when e = 1', () => {
  const r = M.rng(11);
  for (let i = 0; i < 400; i++) {
    const m1 = 0.25 + 3 * r(), m2 = 0.25 + 3 * r(), v1 = 3 * r() - 0.5, v2 = v1 - 0.2 - 3 * r(), e = i % 5 === 0 ? 1 : i % 5 === 1 ? 0 : r();
    const f = C.outcome(m1, m2, v1, v2, e);
    assert.ok(Math.abs(m1 * f.v1 + m2 * f.v2 - (m1 * v1 + m2 * v2)) < 1e-9);
    const K0 = KE(m1, m2, v1, v2), K1 = KE(m1, m2, f.v1, f.v2);
    if (e === 1) assert.ok(Math.abs(K1 - K0) < 1e-9 * K0); else assert.ok(K1 < K0);
    if (e === 0) assert.ok(Math.abs(f.v1 - f.v2) < 1e-12, 'sticky: one common velocity');
  }
});

test('the animated run: p constant at every instant, CM at constant velocity, ends at the outcome', () => {
  for (const o of [{ m1: 1, m2: 0.5, v1: 1.5, v2: -0.5, e: 1, k: 2000 }, { m1: 2, m2: 1, v1: 1.2, v2: 0, e: 0, k: 600 }, { m1: 0.5, m2: 2, v1: 2, v2: -1, e: 0.5, k: 9000 }]) {
    const R = C.run(o), p0 = o.m1 * o.v1 + o.m2 * o.v2;
    for (let t = 0; t < 3; t += 0.0005) {
      const s = R.at(t);
      assert.ok(Math.abs(o.m1 * s.v1 + o.m2 * s.v2 - p0) < 1e-9);
      assert.ok(Math.abs((o.m1 * s.x1 + o.m2 * s.x2) / (o.m1 + o.m2) - (R.xcm0 + R.vcm * t)) < 1e-9);
      assert.ok(s.x2 - s.x1 >= R.L - R.xm - 1e-9, 'the carts never pass through each other');
    }
    const f = C.outcome(o.m1, o.m2, o.v1, o.v2, o.e), end = R.at(2.95);
    assert.ok(Math.abs(end.v1 - f.v1) < 1e-9 && Math.abs(end.v2 - f.v2) < 1e-9);
  }
});

test('impulse = area under F-t = Δp; a stiffer bumper is shorter and taller with the same area', () => {
  const base = { m1: 1, m2: 0.5, v1: 1.5, v2: -0.5, e: 1 };
  const soft = C.run({ ...base, k: 1000 }), stiff = C.run({ ...base, k: 16000 });
  const dp = 0.5 * (soft.v2f - base.v2);
  for (const R of [soft, stiff]) assert.ok(Math.abs(C.area(R.pulse, 0, R.Tc) - dp) < 1e-6 * dp);
  assert.ok(stiff.Tc < soft.Tc / 3.9 && stiff.Fmax > soft.Fmax * 3.9, 'k × 16: a quarter of the time, four times the peak');
  const sticky = C.run({ ...base, e: 0, k: 3000 });
  assert.ok(Math.abs(C.area(sticky.pulse, 0, sticky.Tc) - 0.5 * (sticky.v2f - base.v2)) < 1e-6);
});

test('explosion from rest: total momentum 0, CM stays put, K equals the spring energy', () => {
  const R = C.run({ mode: 'explode', m1: 1.5, m2: 0.5, E: 2, k: 4000 });
  assert.ok(Math.abs(1.5 * R.v1f + 0.5 * R.v2f) < 1e-12);
  assert.ok(Math.abs(KE(1.5, 0.5, R.v1f, R.v2f) - 2) < 1e-12);
  for (let t = 0; t < 2; t += 0.01) { const s = R.at(t); assert.ok(Math.abs((1.5 * s.x1 + 0.5 * s.x2) / 2 - R.xcm0) < 1e-9); }
});

test('generators: same seed same problem, every type comes out', () => {
  for (const t of C.TYPES) {
    const a = C.generate(M.rng(9), ctx, t), b = C.generate(M.rng(9), ctx, t);
    assert.equal(JSON.stringify(a), JSON.stringify(b));
    assert.equal(a.type, t);
  }
});

test('feedback names the slips: energy for a sticky collision, the sign of a leftward cart, peak force × time, ΔK as ½m(Δv)²', () => {
  let signSeen = false;
  for (let i = 1; i < 60; i++) {
    const p = C.generate(M.rng(i), ctx, 'sticky'), v = p.values, vf = p.steps.find(s => s.key === 'vf');
    assert.match(M.diagnose(vf.cell, Math.sqrt(2 * KE(v.m1, v.m2, v.v1, v.v2) / (v.m1 + v.m2))).why || '', /Energy conservation does not hold|Start from momentum/);
    const pp = p.steps.find(s => s.key === 'p');
    if (v.v2 < 0) { assert.match(M.diagnose(pp.cell, v.m1 * v.v1 - v.m2 * v.v2).why, /negative/); signSeen = true; }
  }
  assert.ok(signSeen);
  for (let i = 1; i < 40; i++) {
    const p = C.generate(M.rng(i), ctx, 'impulse'), f = p.figure;
    if (f.shape === 'rect') continue;
    assert.match(M.diagnose(p.steps[0].cell, f.dir * f.Fm * f.dt).why, /area/);
    break;
  }
});

test('the shipped data passes, and the validator catches planted mistakes', () => {
  const map = loadMap(), d = data();
  assert.deepEqual(check(d, map), []);
  const orig = C.generate;
  try {
    C.generate = (r, c, t) => { const p = orig(r, c, t); if (p.type === 'sticky') p.steps[1].cell.answer *= 1.1; return p; };
    assert.ok(check(d, map).some(e => /step vf/.test(e)));
    C.generate = (r, c, t) => { const p = orig(r, c, t); if (p.type === 'bars') p.steps[0].cells[5].answer += 1; return p; };
    assert.ok(check(d, map).some(e => /bar fT/.test(e)));
    C.generate = (r, c, t) => { const p = orig(r, c, t); if (p.type === 'ke') p.steps[2].correct = 1 - p.steps[2].correct; return p; };
    assert.ok(check(d, map).some(e => /step cons keyed/.test(e)));
  } finally { C.generate = orig; }
});
