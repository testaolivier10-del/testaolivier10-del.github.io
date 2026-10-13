/* Oscillator lab: its model (physics/assets/tools/math/oscillator-lab.js) and its
   validator (scripts/lib/apphys-tool-checks/oscillator-lab.mjs). OWNED BY THIS
   TOOL ONLY. Same seed same problem; the shipped data passes (300 seeds per
   context, every key recomputed); planted mistakes are caught; energy is
   conserved within 0.1% in undamped runs; the measured period matches
   2π√(m/k) and 2π√(ℓ/g) and does not depend on amplitude (spring) or mass. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runtime } from '../lib/apphys-tool-checks/_shared.mjs';
import { check } from '../lib/apphys-tool-checks/oscillator-lab.mjs';
import { loadMap, ROOT } from '../lib/apphys-build.mjs';

const data = JSON.parse(readFileSync(`${ROOT}/physics/data/tools/oscillator-lab.json`, 'utf8'));
const { M, model } = runtime('oscillator-lab');
const close = (a, b, rel = 1e-9) => Math.abs(a - b) <= rel * Math.abs(b) + 1e-12;
const TAU = 2 * Math.PI;

test('oscillator-lab: the shipped data passes its validator', () => {
  const map = loadMap();
  assert.deepEqual(check(data, map), []);
  assert.ok(check({ ...data, kind: 'drill' }, map).some(e => /kind/.test(e)));
});

test('oscillator-lab: same seed, same problem; every type generates', () => {
  for (const c of data.contexts) for (const t of c.types) {
    const a = model.generate(M.rng(5150), c, t), b = model.generate(M.rng(5150), c, t);
    assert.equal(JSON.stringify(a), JSON.stringify(b));
    assert.equal(a.type, t);
  }
});

test('oscillator-lab: the validator catches a planted wrong key and a wrong factor', () => {
  const map = loadMap(), gen = model.generate;
  try {
    model.generate = (r, c, t) => { const p = gen(r, c, t); const s = p.steps.find(x => x.cell); s.cell = M.cell(s.cell.answer * 2, 0.02, []); return p; };
    assert.ok(check(data, map).length >= data.contexts.length);
    model.generate = (r, c, t) => { const p = gen(r, c, t); if (p.type === 'change') { const s = p.steps.find(x => x.key === 'factor'); s.correct = (s.correct + 1) % 4; } return p; };
    assert.ok(check(data, map).some(e => /factor/.test(e)));
  } finally { model.generate = gen; }
});

test('oscillator-lab: energy is conserved within 0.1% in undamped runs', () => {
  for (const sys of [
    { type: 'spring', m: 0.4, k: 30, A: 0.12, g: 9.8 },
    { type: 'vspring', m: 1.2, k: 45, A: 0.08, g: 9.8 },
    { type: 'pendulum', m: 0.5, L: 0.9, A: 12, g: 9.8 },
    { type: 'pendulum', m: 0.5, L: 2, A: 70, g: 1.62 }
  ]) {
    let s = model.init(sys); const E0 = model.energy(sys, s).E;
    let worst = 0;
    for (let i = 0; i < 1200; i++) { s = model.advance(sys, s, 1 / 60); worst = Math.max(worst, Math.abs(model.energy(sys, s).E - E0) / E0); }
    assert.ok(worst < 1e-3, `${sys.type}: worst energy error ${worst}`);
  }
});

test('oscillator-lab: the measured period matches the formula; amplitude and pendulum mass do not change it', () => {
  for (const [m, k] of [[0.25, 25], [1, 16], [2, 200]]) for (const A of [0.02, 0.2]) {
    const sys = { type: 'spring', m, k, A, g: 9.8 };
    assert.ok(close(model.measure(sys, 4), TAU * Math.sqrt(m / k), 1e-4));
    assert.ok(close(model.period({ ...sys, type: 'vspring' }), TAU * Math.sqrt(m / k)));
  }
  for (const [L, g] of [[0.5, 9.8], [1.5, 1.62], [1, 24.8]]) for (const m of [0.1, 5]) {
    const sys = { type: 'pendulum', m, L, A: 3, g };
    assert.ok(close(model.measure(sys, 3), TAU * Math.sqrt(L / g), 2e-4), `small-angle pendulum L=${L} g=${g}`);
  }
  // Large angle: longer than 2π√(ℓ/g), as the series says.
  const big = { type: 'pendulum', m: 1, L: 1, A: 60, g: 9.8 };
  assert.ok(close(model.measure(big, 3), model.period(big) * model.largeAngle(60), 2e-4));
  assert.ok(model.largeAngle(60) > 1.07);
});

test('oscillator-lab: at x = 0 speed is greatest; at the ends acceleration is greatest', () => {
  const sys = { type: 'spring', m: 0.5, k: 50, A: 0.1, g: 9.8 };
  let s = model.init(sys), vmax = 0, xAtVmax = 1;
  for (let i = 0; i < 2000; i++) { s = model.step(sys, s, 1e-4 * 3); if (Math.abs(s.v) > vmax) { vmax = Math.abs(s.v); xAtVmax = s.x; } }
  assert.ok(Math.abs(xAtVmax) < 0.002);
  assert.ok(close(vmax, 0.1 * Math.sqrt(100), 1e-3));
  assert.ok(close(Math.abs(model.accel(sys, 0.1)), 10));
});
