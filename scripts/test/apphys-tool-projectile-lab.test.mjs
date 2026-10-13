/* Projectile lab: its model (physics/assets/tools/math/projectile-lab.js) and
   its validator (scripts/lib/apphys-tool-checks/projectile-lab.mjs). OWNED BY
   THIS TOOL ONLY. The flight against hand-worked values, v_x constant, the
   complementary-angle range, the frames, same seed same problem, planted
   mistakes caught, and the shipped data passing. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { runtime } from '../lib/apphys-tool-checks/_shared.mjs';
import { check } from '../lib/apphys-tool-checks/projectile-lab.mjs';
import { loadMap, ROOT } from '../lib/apphys-build.mjs';

const { M, model } = runtime('projectile-lab');
const data = JSON.parse(readFileSync(join(ROOT, 'physics', 'data', 'tools', 'projectile-lab.json'), 'utf8'));
const near = (a, b, tol = 1e-9) => Math.abs(a - b) <= tol * Math.max(1, Math.abs(b));

test('projectile-lab: the shipped data passes its validator (300 seeds per context)', () => {
  assert.deepEqual(check(data, loadMap()), []);
});

test('projectile-lab: the validator catches a wrong frame, a missing g and a wrong topic', () => {
  const map = loadMap();
  assert.ok(check({ ...data, slug: 'other' }, map).some(e => /slug/.test(e)));
  assert.ok(check({ ...data, contexts: [{ id: 'c', topic: 'motion-2d', kind: 'range' }] }, map).some(e => /state g/.test(e)));
  assert.ok(check({ ...data, contexts: [{ id: 'c', topic: 'motion-2d', kind: 'relative', g: 9.8 }] }, map).some(e => /belongs to topic/.test(e)));
});

test('projectile-lab: hand-worked flights (g = 9.8 and 10)', () => {
  // 20 m/s at 30° from the ground, g = 10: vy = 10, T = 2 s, R = 34.64 m, H = 5 m.
  const a = model.launch({ v: 20, angle: 30, h: 0, g: 10 });
  assert.ok(near(a.T, 2) && near(a.R, 20 * Math.cos(Math.PI / 6) * 2) && near(a.H, 5) && near(a.tTop, 1));
  // Rolled off a 19.6 m cliff at 5 m/s, g = 9.8: T = 2 s, R = 10 m.
  const b = model.launch({ v: 5, angle: 0, h: 19.6, g: 9.8 });
  assert.ok(near(b.T, 2) && near(b.R, 10) && near(b.H, 19.6) && b.tTop === 0);
  // Thrown down at 10 m/s, 90° below: 10t + 4.9t² = 15 -> t = 1 s.
  const c = model.launch({ v: 10, angle: -90, h: 14.9, g: 9.8 });
  assert.ok(near(c.T, 1, 1e-9) && Math.abs(c.R) < 1e-9);
});

test('projectile-lab: v_x never changes, y returns to 0 at T, and the energy per kilogram is conserved', () => {
  const L = model.launch({ v: 17, angle: 52, h: 8, g: 9.8 });
  const e = s => 0.5 * (s.vx * s.vx + s.vy * s.vy) + 9.8 * s.y;
  const e0 = e(L.at(0));
  for (let k = 0; k <= 20; k++) {
    const s = L.at(L.T * k / 20);
    assert.ok(near(s.vx, L.vx));
    assert.ok(Math.abs(e(s) - e0) <= 1e-9 * e0, `energy at step ${k}`);
  }
  assert.ok(Math.abs(L.at(L.T).y) < 1e-9);
});

test('projectile-lab: complementary angles give the same range on level ground; 45° is the farthest', () => {
  const R = a => model.launch({ v: 15, angle: a, h: 0, g: 9.8 }).R;
  for (const a of [10, 25, 33, 40]) assert.ok(near(R(a), R(90 - a), 1e-9));
  assert.ok(R(45) > R(44) && R(45) > R(46));
});

test('projectile-lab: frames differ by the cart velocity; the ball lands back on the cart', () => {
  const K = model.cartLaunch({ u: 3, w: 9.8, g: 9.8 });
  assert.ok(near(K.T, 2) && near(K.D, 6) && near(K.H, 4.9));
  for (const t of [0, 0.5, 1.3, 2]) {
    const g = K.ground(t), c = K.cart(t);
    assert.ok(near(g.vx - c.vx, 3) && near(g.vy, c.vy) && near(g.y, c.y));
    assert.ok(near(g.x - g.cart, c.x - c.cart));
  }
});

test('projectile-lab: same seed, same problem; every type generates with its own topic', () => {
  for (const c of data.contexts) {
    const a = model.generate(M.rng(31337), c), b = model.generate(M.rng(31337), c);
    assert.equal(a.text, b.text);
    assert.equal(a.type, c.kind);
    assert.equal(a.topic, c.topic);
  }
});

test('projectile-lab: planted slips get their own feedback', () => {
  const p = model.generate(M.rng(5), { id: 'components', topic: 'motion-2d', kind: 'components', g: 9.8 });
  const vx = p.steps.find(s => s.key === 'vx');
  assert.match(M.diagnose(vx.cell, p.values.v * Math.sin(p.values.angle * Math.PI / 180)).why || '', /v sin θ/);
  const q = model.generate(M.rng(5), { id: 'range', topic: 'motion-2d', kind: 'range', g: 9.8 });
  const t = q.steps.find(s => s.key === 't');
  assert.match(M.diagnose(t.cell, t.cell.answer / 2).why || '', /time to the top|factor of 2/);
});
