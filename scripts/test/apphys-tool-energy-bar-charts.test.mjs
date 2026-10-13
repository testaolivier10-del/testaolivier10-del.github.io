/* Energy bar charts: its model (physics/assets/tools/math/energy-bar-charts.js) and its
   validator (scripts/lib/apphys-tool-checks/energy-bar-charts.mjs). OWNED BY THIS
   TOOL ONLY. Same seed same problem, the explore run conserves energy and its
   bars balance for every system, every key recomputed by the validator,
   planted mistakes caught, and the shipped data passing. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runtime } from '../lib/apphys-tool-checks/_shared.mjs';
import { check } from '../lib/apphys-tool-checks/energy-bar-charts.mjs';
import { loadMap } from '../lib/apphys-build.mjs';

const { M, model: E } = runtime('energy-bar-charts');
const data = () => JSON.parse(readFileSync(new URL('../../physics/data/tools/energy-bar-charts.json', import.meta.url), 'utf8'));
const ctx = { id: 't', topic: 'energy-conservation' };

test('energy-bar-charts: the frame is checked (slug, topic)', () => {
  const map = loadMap();
  const ok = { slug: 'energy-bar-charts', kind: 'simulator', topic: 'energy-conservation', intro: '<p>x</p>', howItWorks: '<p>x</p>', contexts: [{ id: 'c1', topic: 'energy-conservation', types: ['speed'] }] };
  assert.deepEqual(check(ok, map), []);
  assert.ok(check({ ...ok, topic: 'nope' }, map).some(e => /topic/.test(e)));
  assert.ok(check({ ...ok, slug: 'other' }, map).some(e => /slug/.test(e)));
  assert.ok(check({ ...ok, contexts: [{ id: 'c1', topic: 'power', types: ['heat'] }] }, map).some(e => /types/.test(e)));
});

test('the skater on a frictionless track: K + Ug constant to 0.1% (exactly, in fact), and it comes back to its start height', () => {
  for (const track of ['valley', 'hill', 'drop']) {
    const S = E.sim('skater', { track, s0: 0.3 }), s0 = S.state();
    let ymax = 0, s = s0;
    for (let i = 0; i < 1800; i++) {
      s = S.step(1 / 60);
      assert.ok(Math.abs(s.K + s.Ug - s0.Ug) <= 1e-3 * s0.Ug, `${track} at t = ${s.t}`);
      if (s.t > 2) ymax = Math.max(ymax, s.y);
    }
    assert.ok(Math.abs(ymax - s0.y) < 0.01, `${track}: returns to ${s0.y}, got ${ymax}`);
  }
});

test('the speed at the bottom of the valley matches √(2gh), and mass does not change it', () => {
  const v = m => { const S = E.sim('skater', { track: 'valley', s0: 0.3, m }); const y0 = S.state().y; let best = 0; for (let i = 0; i < 300; i++) best = Math.max(best, S.step(1 / 60).speed); return { best, y0 }; };
  const a = v(40), b = v(80);
  assert.ok(Math.abs(a.best - Math.sqrt(2 * 9.8 * a.y0)) < 0.02 * a.best);
  assert.ok(Math.abs(a.best - b.best) < 1e-6);
});

test('friction: thermal energy grows, the total stays fixed, the ramp block stops at d = h/μ along the floor', () => {
  const S = E.sim('ramp', { h: 1.5, mu: 0.4, m: 2 }), s0 = S.state();
  let s = s0;
  while (!S.settled() && s.t < 20) s = S.step(1 / 60);
  assert.ok(S.settled());
  assert.ok(Math.abs(s.Eth - 2 * 9.8 * 1.5) < 1e-9);
  // From the start of the rough patch: μ m g d = m g h.
  const startX = S.path.floorX, d = s.x - startX;
  assert.ok(Math.abs(d - 1.5 / 0.4) < 0.08, `slides ${d} m on the floor`);
});

test('the bars balance for every system: start + W = now, and W = 0 only when every agent is inside', () => {
  const S = E.sim('launcher', { k: 400, x: 0.35, m: 1 }), s0 = S.state();
  let s = s0; for (let i = 0; i < 200; i++) s = S.step(1 / 60);
  for (const sys of [{}, { earth: true }, { spring: true }, { earth: true, spring: true }]) {
    const L = E.ledger(s0, s, sys);
    assert.ok(L.balanced, JSON.stringify(sys));
    assert.equal(Math.abs(L.W) < 1e-9, !!(sys.earth && sys.spring), JSON.stringify(sys));
  }
  const L = E.ledger(s0, s, {});
  assert.equal(L.start.Us, null, 'the spring outside: no Us bar');
  assert.ok(L.work.spring > 0 && L.work.grav < 0, 'the spring does positive work, gravity negative');
});

test('the lift: work by the cable = mgh, average power = mgh/T, P = Fv at steady speed', () => {
  const S = E.sim('lift', { H: 6, v: 1, a: 1.5, m: 40 });
  let s; while (!S.settled()) s = S.step(1 / 60);
  assert.ok(Math.abs(s.Wc - 40 * 9.8 * 6) < 1e-9);
  assert.ok(Math.abs(S.work() - 40 * 9.8 * 6) < 1e-9, 'the work from the tension, piecewise, agrees');
  const S2 = E.sim('lift', { H: 6, v: 1, a: 1.5, m: 40 }); const mid = S2.step(S2.T / 2);
  assert.ok(Math.abs(mid.P - 40 * 9.8 * 1) < 1e-9);
});

test('generators: same seed same problem; every type comes out; the bar chart adds up in units', () => {
  for (const t of E.TYPES) {
    const a = E.generate(M.rng(42), ctx, t), b = E.generate(M.rng(42), ctx, t);
    assert.equal(JSON.stringify(a), JSON.stringify(b));
    assert.equal(a.type, t);
  }
  for (let i = 1; i < 200; i++) {
    const p = E.generate(M.rng(i), ctx, 'bars'), row = p.steps.find(s => s.key === 'bars'), cells = p.figure.cells;
    const sum = g => cells.reduce((s, c, k) => s + (c.grp === g ? row.cells[k].answer : 0), 0);
    assert.equal(sum('i') + sum('w'), sum('f'));
  }
});

test('feedback names the slips: Ug with the wrong system, forgetting thermal energy, KE not squared, the sign of work', () => {
  let wrongSys = false, thermal = false;
  for (let i = 1; i < 400 && !(wrongSys && thermal); i++) {
    const p = E.generate(M.rng(i), ctx, 'bars'), row = p.steps.find(s => s.key === 'bars');
    for (const c of row.cells) for (const m of c.mistakes) {
      if (/wrong system/.test(m.why) && !M.diagnose(c, m.value).ok && M.diagnose(c, m.value).why === m.why) wrongSys = true;
      if (/Forgetting thermal/.test(m.why)) thermal = true;
    }
  }
  assert.ok(wrongSys && thermal);
  const h = E.generate(M.rng(3), ctx, 'height'), K = h.steps.find(s => s.key === 'K');
  const v = h.values; assert.match(M.diagnose(K.cell, 0.5 * v.m * v.v).why, /not squared/);
  const f = E.generate(M.rng(5), { id: 'w', topic: 'work-by-forces', types: ['friction'] }, 'friction'), W = f.steps.find(s => s.key === 'W');
  assert.match(M.diagnose(W.cell, -W.cell.answer).why, /sign/);
});

test('the shipped data passes, and the validator catches planted mistakes', () => {
  const map = loadMap(), d = data();
  assert.deepEqual(check(d, map), []);
  const orig = E.generate;
  try {
    E.generate = (r, c, t) => { const p = orig(r, c, t); if (p.type === 'bars') p.steps.find(s => s.key === 'bars').cells[0].answer += 1; return p; };
    assert.ok(check(d, map).some(e => /recomputed|before \+ W/.test(e)));
    E.generate = (r, c, t) => { const p = orig(r, c, t); if (p.type === 'speed') p.steps[1].cell.answer *= 1.05; return p; };
    assert.ok(check(d, map).some(e => /step v/.test(e)));
    E.generate = (r, c, t) => { const p = orig(r, c, t); if (p.type === 'power') p.steps[1].cell.mistakes.push({ value: p.steps[1].cell.answer, why: 'planted' }); return p; };
    assert.ok(check(d, map).some(e => /would be graded right/.test(e)));
  } finally { E.generate = orig; }
});
