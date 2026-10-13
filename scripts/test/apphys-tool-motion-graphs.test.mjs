/* Motion graphs: its model (physics/assets/tools/math/motion-graphs.js) and its
   validator (scripts/lib/apphys-tool-checks/motion-graphs.mjs). OWNED BY THIS
   TOOL ONLY. Same seed same problem, the kinematics recomputed from first
   principles, the measured (detector) slopes, the match score, planted
   mistakes caught, and the shipped data passing. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { runtime } from '../lib/apphys-tool-checks/_shared.mjs';
import { check } from '../lib/apphys-tool-checks/motion-graphs.mjs';
import { loadMap, ROOT } from '../lib/apphys-build.mjs';

const { M, model } = runtime('motion-graphs');
const data = JSON.parse(readFileSync(join(ROOT, 'physics', 'data', 'tools', 'motion-graphs.json'), 'utf8'));
const near = (a, b, tol = 1e-9) => Math.abs(a - b) <= tol * Math.max(1, Math.abs(b));

test('motion-graphs: the shipped data passes its validator (300 seeds per context)', () => {
  assert.deepEqual(check(data, loadMap()), []);
});

test('motion-graphs: the validator catches a wrong frame, a wrong topic and an unreachable target', () => {
  const map = loadMap();
  assert.ok(check({ ...data, slug: 'other' }, map).some(e => /slug/.test(e)));
  assert.ok(check({ ...data, contexts: [{ id: 'x', topic: 'motion-2d', kind: 'slope' }] }, map).some(e => /belongs to topic/.test(e)));
  const far = { id: 'far', kind: 'v', name: 'Too far', pts: [[0, 2], [10, 2]] };
  assert.ok(check({ ...data, targets: [far] }, map).some(e => /leave the track/.test(e)));
  const fast = { id: 'fast', kind: 'x', name: 'Too fast', pts: [[0, -5], [1, 5], [10, 5]] };
  assert.ok(check({ ...data, targets: [fast] }, map).some(e => /too fast/.test(e)));
});

test('motion-graphs: constant-acceleration pieces follow x = x0 + v0 t + at²/2 and v = v0 + at', () => {
  const mo = model.motion(-2, 1.5, [{ dur: 2, a: -1 }, { dur: 3, a: 0 }, { dur: 5, a: 0.4 }]);
  // By hand: after 2 s, x = -2 + 3 - 2 = -1, v = -0.5; after 5 s, x = -2.5, v = -0.5;
  // at 7 s: x = -2.5 - 1 + 0.8 = -2.7, v = 0.3.
  const s = mo.at(7);
  assert.ok(near(s.x, -2.7) && near(s.v, 0.3) && s.a === 0.4);
  assert.ok(near(mo.at(2).x, -1) && near(mo.at(5).v, -0.5));
  // Area under v-t equals the change in x (sampled finely).
  const g = model.sample(mo, 10, 0.001);
  assert.ok(Math.abs(model.areaTo(g.t, g.v, 0, 10) - (mo.at(10).x - mo.at(0).x)) < 1e-4);
  // Area under a-t equals the change in v.
  assert.ok(Math.abs(model.areaTo(g.t, g.a, 0, 10) - (mo.at(10).v - mo.at(0).v)) < 2e-3);
});

test('motion-graphs: the detector slopes recover v and a from positions alone', () => {
  const mo = model.motion(-3, 0.5, [{ dur: 10, a: 0.2 }]);
  const g = model.sample(mo, 6, 0.05);
  const d = model.derive(g.t, g.x);
  for (const i of [20, 60, 100]) {
    assert.ok(Math.abs(d.v[i] - mo.at(g.t[i]).v) < 1e-6, `v at ${g.t[i]}`);
    assert.ok(Math.abs(d.a[i] - 0.2) < 1e-6, `a at ${g.t[i]}`);
  }
  // A recording at uneven frame times resamples onto the 0.05 s grid.
  const ts = [0, 0.013, 0.05, 0.081, 0.12, 0.2], xs = ts.map(t => 2 * t);
  const r = model.resample(ts, xs, 0.2, 0.05);
  assert.equal(r.t.map(t => t.toFixed(2)).join(' '), '0.00 0.05 0.10 0.15 0.20');
  assert.ok(r.x.every((x, i) => near(x, 2 * r.t[i], 1e-9)));
});

test('motion-graphs: area helpers split at v = 0 for distance', () => {
  const pts = [[0, 2], [2, -2]];
  assert.ok(near(model.plArea(pts, 0, 2), 0));
  assert.ok(near(model.plArea(pts, 0, 2, true), 2));
  assert.ok(near(model.plAt(pts, 0.5), 1));
});

test('motion-graphs: describe() names direction and speeding up or slowing down by the signs of v and a', () => {
  assert.equal(model.describe(2, 1).change, 'up');
  assert.equal(model.describe(-2, 1).change, 'down');
  assert.equal(model.describe(-2, -1).change, 'up');
  assert.equal(model.describe(1, 0).change, 'const');
  assert.equal(model.describe(0, 0).change, 'rest');
  assert.equal(model.describe(0, -1).change, 'turn');
});

test('motion-graphs: a perfect match scores 100 and a constant offset loses points where it is', () => {
  const target = t => (t < 5 ? -3 + t : 2);
  const t = Array.from({ length: 201 }, (_, i) => i * 0.05);
  assert.equal(model.score('x', target, t, t.map(target)).score, 100);
  const off = model.score('x', target, t, t.map(x => target(x) + (x >= 7 && x < 8 ? 1.5 : 0)));
  assert.ok(off.score < 100 && off.score > 50);
  assert.equal(off.worst.t0, 7);
  assert.equal(off.worst.sign, 1);
});

test('motion-graphs: same seed, same problem; every type generates', () => {
  for (const c of data.contexts) {
    const a = model.generate(M.rng(4242), c), b = model.generate(M.rng(4242), c);
    assert.equal(a.text, b.text);
    assert.deepEqual(a.steps.map(s => s.cell ? s.cell.answer : s.correct), b.steps.map(s => s.cell ? s.cell.answer : s.correct));
    assert.equal(a.type, c.kind);
  }
});

test('motion-graphs: planted slips get their own feedback', () => {
  const p = model.generate(M.rng(99), { id: 'slope', topic: 'motion-representations', kind: 'slope' });
  const s = p.steps.find(x => x.key === 'v');
  const dx = p.values.xs[p.values.k + 1] - p.values.xs[p.values.k];
  if (dx && Math.abs(dx - s.cell.answer) > 0.05) assert.match(M.diagnose(s.cell, dx).why || '', /Δx alone/);
  const q = model.generate(M.rng(7), { id: 'turn', topic: 'motion-representations', kind: 'turn', g: 9.8 });
  const top = q.steps.find(x => x.key === 'ttop');
  if (top) assert.match(M.diagnose(top.cell, top.cell.answer * 10 / 9.8).why || '', /g = 9.8/);
});
