/* Torque balance: its model (physics/assets/tools/math/torque-balance.js) and its
   validator (scripts/lib/apphys-tool-checks/torque-balance.mjs). OWNED BY THIS
   TOOL ONLY. Same seed same problem; the shipped data passes the validator
   (300 seeds per context, every key recomputed); planted mistakes are caught;
   the Explore physics: torques, I, the support force, α = τ/I, energy kept
   in a free swing, and the inertia race against Newton's laws and energy. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runtime } from '../lib/apphys-tool-checks/_shared.mjs';
import { check } from '../lib/apphys-tool-checks/torque-balance.mjs';
import { loadMap, ROOT } from '../lib/apphys-build.mjs';

const data = JSON.parse(readFileSync(`${ROOT}/physics/data/tools/torque-balance.json`, 'utf8'));
const { M, model } = runtime('torque-balance');
const close = (a, b, rel = 1e-9) => Math.abs(a - b) <= rel * Math.abs(b) + 1e-12;

test('torque-balance: the shipped data passes its validator, and the frame is checked', () => {
  const map = loadMap();
  assert.deepEqual(check(data, map), []);
  assert.ok(check({ ...data, topic: 'nope' }, map).some(e => /topic/.test(e)));
  assert.ok(check({ ...data, slug: 'other' }, map).some(e => /slug/.test(e)));
  assert.ok(check({ ...data, contexts: [{ id: 'x', topic: 'torque', types: ['bogus'] }] }, map).some(e => /types/.test(e)));
});

test('torque-balance: same seed, same problem; every type generates', () => {
  for (const c of data.contexts) for (const t of c.types) {
    const a = model.generate(M.rng(4242), c, t), b = model.generate(M.rng(4242), c, t);
    assert.equal(JSON.stringify(a), JSON.stringify(b));
    assert.equal(a.type, t);
    assert.ok(a.steps.length >= 3);
  }
});

test('torque-balance: the validator catches a planted wrong key', () => {
  const map = loadMap(), gen = model.generate;
  try {
    model.generate = (r, c, t) => { const p = gen(r, c, t); const s = p.steps.find(x => x.cell); s.cell = M.cell(s.cell.answer * 1.1, 0.02, []); return p; };
    const errs = check(data, map);
    assert.ok(errs.length >= data.contexts.length, errs.join('\n'));
  } finally { model.generate = gen; }
  try {
    // A balance problem whose mark forgets the stick's own weight.
    model.generate = (r, c, t) => { const p = gen(r, c, t); if (p.type === 'balance') { const s = p.steps.find(x => x.key === 'x2'); const v = p.values; s.cell = M.cell(v.p + v.m1 * (v.p - v.x1) / v.m2, 0.01, [], 0.004); } return p; };
    assert.ok(check(data, map).some(e => /x2|d2/.test(e)));
  } finally { model.generate = gen; }
});

test('torque-balance: torques, inertia, support force and alpha for a hand-worked beam', () => {
  const g = 9.8, s = { L: 1, mb: 0.1, pivot: 0.4, h: 0.2, masses: [{ m: 0.3, x: 0.1 }, { m: 0.2, x: 0.8 }], force: null };
  const t = model.torques(s, g);
  // ccw: 0.3 g 0.3 = 0.882; cw: 0.1 g 0.1 = 0.098 and 0.2 g 0.4 = 0.784
  assert.ok(close(t.ccw, 0.882)); assert.ok(close(t.cw, 0.882));
  assert.ok(Math.abs(t.net) < 1e-12, 'this beam balances');
  assert.ok(close(t.I, 0.1 / 12 + 0.1 * 0.01 + 0.3 * 0.09 + 0.2 * 0.16));
  assert.ok(close(t.support.y, 0.6 * g));
  // Move the 0.2 kg mass out to 0.9 m: net clockwise, alpha = net / I.
  s.masses[1].x = 0.9; const t2 = model.torques(s, g);
  assert.ok(close(t2.net, -0.2 * g * 0.1));
  assert.ok(close(t2.alpha, t2.net / t2.I));
  // A pull at an angle: tau = r F sin(theta); the support carries W - F sin(theta).
  s.force = { F: 2, x: 0.9, ang: 150 };
  const t3 = model.torques(s, g), pull = t3.items.find(i => i.kind === 'pull');
  assert.ok(close(pull.tau, 0.5 * 2 * Math.sin(150 * Math.PI / 180)));
  assert.ok(close(pull.arm, 0.5 * Math.sin(150 * Math.PI / 180)));
  assert.ok(close(t3.support.y, 0.6 * g - 2 * Math.sin(150 * Math.PI / 180)));
  assert.ok(close(t3.support.x, -2 * Math.cos(150 * Math.PI / 180)));
});

test('torque-balance: the tipping beam keeps energy within 0.1% and starts with alpha = tau / I', () => {
  const g = 9.8, s = { L: 1, mb: 0.12, pivot: 0.5, h: 1, stop: 80, masses: [{ m: 0.3, x: 0.2 }, { m: 0.1, x: 0.9 }], force: { F: 1.5, x: 0.7, ang: 60 } };
  let th = 0, om = 0; const E0 = model.energy(s, th, om, g), I = model.inertiaOf(s);
  const a0 = model.tauAt(s, 0, g) / I;
  assert.ok(close(a0, model.torques(s, g).alpha));
  const dt = 1e-3, r1 = model.tip(s, th, om, dt, g);
  assert.ok(close(r1.om / dt, a0, 1e-3), 'the first step accelerates at tau/I');
  for (let i = 0; i < 3000; i++) { const r = model.tip(s, th, om, 0.002, g); th = r.th; om = r.om; }
  const E1 = model.energy(s, th, om, g), scale = Math.abs(0.5 * I * om * om) + Math.abs(E0) + 1e-9;
  assert.ok(Math.abs(E1 - E0) / scale < 1e-3, `energy drift ${E1 - E0}`);
  // Stops: the beam rests where an end meets a stop (or the table).
  const lim = model.limits({ ...s, h: 0.2, stop: 10 });
  assert.ok(close(lim.hi, Math.min(10 * Math.PI / 180, Math.asin(0.2 / 0.5))));
});

test('torque-balance: the inertia race agrees with Newton\'s laws and with energy', () => {
  const g = 9.8, m = 0.2, r = 0.04;
  for (const d of [0.05, 0.1, 0.2]) {
    const I = model.race.inertia(0.0015, 0.25, d), o = { m, r, I, h: 0.8, g };
    const a = model.race.accel(m, r, I, g);
    // Weight: m g - T = m a; wheel: T r = I alpha = I a / r.
    const T = m * (g - a);
    assert.ok(close(T * r, I * a / r));
    const end = model.race.at(o, 100);
    assert.ok(close(end.K + end.Krot, m * g * 0.8, 1e-9), 'm g h = K + K_rot at the floor');
    assert.ok(close(end.v, end.om * r));
  }
  assert.ok(model.race.accel(m, r, model.race.inertia(0.0015, 0.25, 0.05), g) > model.race.accel(m, r, model.race.inertia(0.0015, 0.25, 0.2), g));
});
