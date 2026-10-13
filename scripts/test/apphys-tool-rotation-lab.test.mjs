/* Rotation lab: its model (physics/assets/tools/math/rotation-lab.js) and its
   validator (scripts/lib/apphys-tool-checks/rotation-lab.mjs). OWNED BY THIS
   TOOL ONLY. Same seed same problem; the shipped data passes (300 seeds per
   context, every key recomputed); planted mistakes are caught; rolling speeds
   match energy conservation (closed form and integrated), the stool keeps L,
   and the integrated orbit keeps E and L (circular and elliptical). */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runtime } from '../lib/apphys-tool-checks/_shared.mjs';
import { check } from '../lib/apphys-tool-checks/rotation-lab.mjs';
import { loadMap, ROOT } from '../lib/apphys-build.mjs';

const data = JSON.parse(readFileSync(`${ROOT}/physics/data/tools/rotation-lab.json`, 'utf8'));
const { M, model } = runtime('rotation-lab');
const close = (a, b, rel = 1e-9) => Math.abs(a - b) <= rel * Math.abs(b) + 1e-12;

test('rotation-lab: the shipped data passes its validator; the frame and Kepler are checked', () => {
  const map = loadMap();
  assert.deepEqual(check(data, map), []);
  assert.ok(check({ ...data, slug: 'x' }, map).some(e => /slug/.test(e)));
  assert.ok(check({ ...data, intro: data.intro + ' Kepler\'s second law.' }, map).some(e => /Kepler/.test(e)));
});

test('rotation-lab: same seed, same problem; every type generates', () => {
  for (const c of data.contexts) for (const t of c.types) {
    const a = model.generate(M.rng(77), c, t), b = model.generate(M.rng(77), c, t);
    assert.equal(JSON.stringify(a), JSON.stringify(b));
    assert.equal(a.type, t);
  }
});

test('rotation-lab: the validator catches a planted wrong key and a wrong winner', () => {
  const map = loadMap(), gen = model.generate;
  try {
    model.generate = (r, c, t) => { const p = gen(r, c, t); const s = p.steps.find(x => x.cell); s.cell = M.cell(s.cell.answer * 0.9, 0.02, []); return p; };
    assert.ok(check(data, map).length >= data.contexts.length);
    model.generate = (r, c, t) => { const p = gen(r, c, t); if (p.type === 'race') { const s = p.steps.find(x => x.key === 'first'); s.correct = (s.correct + 1) % 3; } return p; };
    assert.ok(check(data, map).some(e => /winner/.test(e)));
  } finally { model.generate = gen; }
});

test('rotation-lab: rolling speeds match energy conservation, closed form and integrated', () => {
  const g = 9.8, o = { theta: 25, len: 2, m: 1.5, r: 0.1, g }, h = 2 * Math.sin(25 * Math.PI / 180);
  const times = {};
  for (const sh of ['hoop', 'disk', 'sphere', 'block']) {
    const b = model.roll.SHAPES[sh].beta, end = model.roll.at(sh, 99, o);
    assert.ok(close(o.m * g * h, end.K + end.Krot, 1e-9), `${sh}: m g h = K + K_rot`);
    assert.ok(close(end.v, Math.sqrt(2 * g * h / (1 + b)), 1e-9));
    if (b) assert.ok(close(end.om * o.r, end.v), `${sh}: v = r omega`);
    // Integrate with small steps: same speed at the bottom.
    let st = { s: 0, v: 0 }; const dt = 1e-4; let t = 0;
    while (st.s < o.len) { st = model.roll.step(sh, st, dt, o); t += dt; }
    assert.ok(close(st.v, end.v, 2e-3), `${sh}: integrated ${st.v} vs ${end.v}`);
    times[sh] = end.tEnd;
  }
  assert.ok(times.block < times.sphere && times.sphere < times.disk && times.disk < times.hoop, 'race order: block, sphere, disk, hoop');
});

test('rotation-lab: the stool conserves angular momentum and K rises as the arms come in', () => {
  const o = { I0: 1.8, m: 3, d0: 0.8, w0: 2 };
  for (const d of [0.6, 0.4, 0.2]) {
    assert.ok(close(model.stool.I(o, d) * model.stool.omega(o, d), model.stool.I(o, 0.8) * 2));
    assert.ok(model.stool.K(o, d) > model.stool.K(o, 0.8));
  }
});

test('rotation-lab: the orbit integrator keeps E and L (circle and ellipse)', () => {
  const GM = 3.986e14;
  for (const k of [1, 1.15, 0.85]) {
    const r0 = 8e6; let s = model.orbit.start({ r0, k, GM }); const e0 = model.orbit.energy(s, GM, 500);
    let rmin = Infinity, rmax = 0;
    for (let i = 0; i < 40000; i++) { s = model.orbit.step(s, 1, GM); const r = Math.hypot(s.x, s.y); rmin = Math.min(rmin, r); rmax = Math.max(rmax, r); }
    const e1 = model.orbit.energy(s, GM, 500);
    assert.ok(close(e1.E, e0.E, 1e-4), `E drift at k=${k}`);
    assert.ok(close(e1.L, e0.L, 1e-6), `L drift at k=${k}`);
    if (k === 1) assert.ok(close(rmax, rmin, 1e-3), 'a circle stays a circle');
    else assert.ok(close(k > 1 ? rmax : rmin, model.orbit.farPoint(r0, k), 2e-3), 'the other turning point matches E and L');
  }
  assert.ok(close(model.orbit.vesc(GM, 7e6), Math.SQRT2 * model.orbit.vc(GM, 7e6)));
});
