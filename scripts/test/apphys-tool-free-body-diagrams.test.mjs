/* Free-body diagrams: its model (physics/assets/tools/math/free-body-diagrams.js) and its
   validator (scripts/lib/apphys-tool-checks/free-body-diagrams.mjs). OWNED BY THIS
   TOOL ONLY. Same seed same problem; the shipped data passes the validator
   (300 problems per context and scene, every force and answer recomputed and
   every planted miss caught); hand-worked cases; the grader names each
   reader-report miss; the validator itself catches planted errors. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import vm from 'node:vm';
import { runtime } from '../lib/apphys-tool-checks/_shared.mjs';
import { check, physics } from '../lib/apphys-tool-checks/free-body-diagrams.mjs';
import { loadMap, ROOT } from '../lib/apphys-build.mjs';

const { M, model: F } = runtime('free-body-diagrams');
const data = JSON.parse(readFileSync(join(ROOT, 'physics', 'data', 'tools', 'free-body-diagrams.json'), 'utf8'));
const near = (a, b, tol = 1e-9) => Math.abs(a - b) <= tol * (1 + Math.abs(b));
const by = (res, t) => res.forces.find(f => f.type === t);
const g = 9.8;

test('free-body-diagrams: the validator checks the frame', () => {
  const map = loadMap();
  const ok = { slug: 'free-body-diagrams', kind: 'simulator', topic: 'forces-fbd', intro: '<p>x</p>', howItWorks: '<p>x</p>', contexts: [{ id: 'c1', topic: 'forces-fbd', scenes: ['table'] }] };
  assert.deepEqual(check(ok, map), []);
  assert.ok(check({ ...ok, topic: 'nope' }, map).some(e => /topic/.test(e)));
  assert.ok(check({ ...ok, slug: 'other' }, map).some(e => /slug/.test(e)));
  assert.ok(check({ ...ok, contexts: [{ id: 'c1', topic: 'forces-fbd', scenes: ['moon'] }] }, map).some(e => /unknown scene/.test(e)));
});

test('free-body-diagrams: the shipped data passes the validator (300 seeds per context and scene)', () => {
  assert.deepEqual(check(data, loadMap()), []);
});

test('free-body-diagrams: contexts unlock with their units', () => {
  const t = Object.fromEntries(data.contexts.map(c => [c.id, c.topic]));
  assert.deepEqual(t, { basic: 'forces-fbd', accel: 'second-law', friction: 'friction', spring: 'spring-forces', circular: 'circular-motion', buoyancy: 'buoyancy' });
  const scenes = new Set(data.contexts.flatMap(c => c.scenes));
  for (const s of F.ORDER) assert.ok(scenes.has(s), `scene ${s} is in some context`);
});

test('free-body-diagrams: the same seed gives the same problem', () => {
  for (const c of data.contexts) {
    const a = F.generate(M.rng(4242), c), b = F.generate(M.rng(4242), c);
    assert.equal(a.text, b.text);
    assert.equal(a.steps[2].cell.answer, b.steps[2].cell.answer);
  }
});

test('free-body-diagrams: hand-worked cases', () => {
  // 2.0 kg block, 30° frictionless ramp: N = mg cos 30 = 16.97 N, a = g sin 30 = 4.9 m/s².
  let r = F.solve('incline', { m: 2, th: 30 }, g);
  assert.ok(near(by(r, 'normal').mag, 16.974097914175, 1e-9));
  assert.ok(near(r.amag, 4.9));
  // 60 kg in an elevator accelerating up at 2.0 m/s²: N = 60(9.8 + 2) = 708 N.
  r = F.solve('elevator', { m: 60, a: 2 }, g);
  assert.ok(near(by(r, 'normal').mag, 708));
  // Atwood 2 kg and 3 kg: a = g/5 = 1.96 m/s², T = 2·2·3·g/5 = 23.52 N.
  r = F.solve('atwood', { m1: 2, m2: 3, which: 1 }, g);
  assert.ok(near(r.amag, 1.96) && near(by(r, 'tension').mag, 23.52));
  assert.ok(r.a.y > 0, 'the lighter block accelerates up');
  // Sign on two ropes at 30° each, 4 kg: T = mg / (2 sin 30) = 39.2 N each.
  r = F.solve('hang2', { m: 4, al: 30, be: 30 }, g);
  assert.ok(near(r.T1, 39.2) && near(r.T2, 39.2));
  // Crate pulled with 100 N at 30°, 20 kg, μk 0.3 (moving): N = 196 − 50 = 146 N, a = (86.60 − 43.8)/20.
  r = F.solve('crate', { m: 20, F: 100, phi: 30, mode: 'pull', mus: 0.35, muk: 0.3 }, g);
  assert.ok(near(by(r, 'normal').mag, 146) && near(r.a.x, (100 * Math.cos(Math.PI / 6) - 0.3 * 146) / 20));
  // The same crate pushed 30° below with μs 0.4: N = 196 + 50 = 246 N; static friction holds it (86.6 < 0.4·246).
  r = F.solve('crate', { m: 20, F: 100, phi: 30, mode: 'push', mus: 0.4, muk: 0.3 }, g);
  assert.ok(near(by(r, 'normal').mag, 246) && by(r, 'fs') && r.amag === 0);
  // Car 1000 kg, 15 m/s, r = 50 m, μs 0.8: f = 4500 N < 7840 N; at 25 m/s it would need 12 500 N: skids.
  r = F.solve('car', { m: 1000, v: 15, r: 50, mus: 0.8 }, g);
  assert.ok(near(by(r, 'fs').mag, 4500) && !r.skid);
  assert.ok(F.solve('car', { m: 1000, v: 25, r: 50, mus: 0.8 }, g).skid);
  // Block on a rough 20° ramp held by static friction when μs > tan 20°.
  r = F.solve('rough', { m: 3, th: 20, mus: 0.5, muk: 0.3, start: 'rest' }, g);
  assert.ok(by(r, 'fs') && near(by(r, 'fs').mag, 3 * g * Math.sin(20 * Math.PI / 180)) && r.amag === 0);
  // Wood (600 kg/m³, 1 L) floats with Fb = mg; stone (2500 kg/m³, 1 L) on a string: T = 24.5 − 9.8 = 14.7 N.
  r = F.solve('water', { rho: 600, V: 0.001 }, g);
  assert.ok(near(by(r, 'buoy').mag, 0.6 * g) && r.amag === 0 && near(r.sub, 0.6));
  r = F.solve('water', { rho: 2500, V: 0.001, held: true }, g);
  assert.ok(near(by(r, 'tension').mag, 14.7));
  // Spring k = 100 N/m stretched 0.15 m: 15 N back toward the relaxed length (left).
  r = F.solve('spring', { m: 1, k: 100, x: 0.15 }, g);
  assert.ok(near(by(r, 'spring').mag, 15) && by(r, 'spring').ang === 180 && near(r.a.x, -15));
});

test('free-body-diagrams: every solved scene obeys ΣF = ma, and the validator\'s own physics agrees', () => {
  const r = M.rng(77);
  for (const c of data.contexts) for (const s of c.scenes) for (let i = 0; i < 40; i++) {
    const p = F.generate(r, c, s), res = p.res, mine = physics(s, p.params, p.g);
    const sx = res.forces.reduce((a, f) => a + f.mag * Math.cos(f.ang * Math.PI / 180), 0);
    const sy = res.forces.reduce((a, f) => a + f.mag * Math.sin(f.ang * Math.PI / 180), 0);
    assert.ok(near(sx, res.m * res.a.x, 1e-9) || Math.abs(sx - res.m * res.a.x) < 1e-9, `${s} x`);
    assert.ok(Math.abs(sy - res.m * res.a.y) < 1e-6, `${s} y`);
    assert.ok(near(res.amag, Math.hypot(mine.a.x, mine.a.y), 1e-9), `${s} acceleration`);
  }
});

test('free-body-diagrams: the grader names each reader-report miss', () => {
  const ctx = data.contexts.find(c => c.id === 'basic');
  // A steep ramp (θ ≥ 35°), where F_N = mg cos θ is visibly shorter than F_g.
  let p; for (let s = 1; !p; s++){ const q = F.generate(M.rng(s), ctx, 'incline'); if (q.params.th >= 35) p = q; }
  const step = p.steps[0];
  const N = step.forces.find(f => f.type === 'normal'), W = step.forces.find(f => f.type === 'grav');
  const arrow = (f, o = {}) => ({ type: f.type, agent: f.agent, rev: false, ang: f.ang, len: 30 + 100 * f.mag / W.mag, onObj: true, ...o });
  assert.ok(F.grade([arrow(W), arrow(N)], step).ok);
  // Normal drawn straight up on a ramp.
  let r = F.grade([arrow(W), arrow(N, { ang: 90 })], step);
  assert.equal(r.arrows[1].code, 'dir'); assert.match(r.arrows[1].why, /perpendicular/);
  // Normal drawn as long as gravity on a ramp.
  r = F.grade([arrow(W, { len: 100 }), arrow(N, { len: 100 })], step);
  assert.ok(r.notes.length && /cos θ/.test(r.notes[0].why));
  // A force down the slope with no agent ("force of motion" drawn as an applied push).
  r = F.grade([arrow(W), arrow(N), { type: 'applied', agent: 'ground', rev: false, ang: -30, len: 50, onObj: true }], step);
  assert.equal(r.arrows[2].st, 'extra');
  r = F.grade([arrow(W), arrow(N), { type: 'motion', agent: '', rev: false, ang: -30, len: 50, onObj: true }], step);
  assert.equal(r.arrows[2].code, 'fake-motion');
  // Missing the normal force.
  r = F.grade([arrow(W)], step);
  assert.equal(r.missing[0].code, 'missing-normal');
  // The third-law partner: "block on ramp".
  r = F.grade([arrow(W), arrow(N, { rev: true })], step);
  assert.equal(r.arrows[1].code, 'partner');
  // Net force drawn as a force.
  r = F.grade([arrow(W), arrow(N), { type: 'net', agent: '', rev: false, ang: -30, len: 40, onObj: true }], step);
  assert.equal(r.arrows[2].code, 'fake-net');
  // A force that does not start on the block.
  r = F.grade([arrow(W, { onObj: false }), arrow(N)], step);
  assert.equal(r.arrows[0].code, 'tail');

  // Car on a curve: a separate centripetal force is named; friction toward the center is right.
  const cc = data.contexts.find(c => c.id === 'circular'), car = F.generate(M.rng(2), cc, 'car').steps[0];
  const cf = car.forces.map(f => ({ type: f.type, agent: f.agent, rev: false, ang: f.ang, len: 60, onObj: true }));
  const fair = car.forces.map(f => ({ type: f.type, agent: f.agent, rev: false, ang: f.ang, len: f.type === 'fs' ? 30 + 100 * f.mag / Math.max(...car.forces.map(x => x.mag)) : 100, onObj: true }));
  assert.ok(F.grade(fair, car).ok);
  r = F.grade([...fair, { type: 'centripetal', agent: '', rev: false, ang: 180, len: 50, onObj: true }], car);
  assert.equal(r.arrows[r.arrows.length - 1].code, 'fake-centripetal'); assert.match(r.arrows[r.arrows.length - 1].why, /static friction/);
  // Friction drawn pointing outward (the "flung out" idea).
  r = F.grade(fair.map(a => a.type === 'fs' ? { ...a, ang: 0 } : a), car);
  assert.ok(r.arrows.some(a => a.code === 'dir'));

  // Elevator accelerating up: N drawn equal to mg is a length miss; the cable's tension is not on the person.
  const ac = data.contexts.find(c => c.id === 'accel');
  let el; for (let s = 1; s < 200 && !el; s++){ const q = F.generate(M.rng(s), ac, 'elevator'); if (q.params.a > 0) el = q; }
  const es = el.steps[0], eN = es.forces.find(f => f.type === 'normal'), eW = es.forces.find(f => f.type === 'grav');
  r = F.grade([{ type: 'grav', agent: 'Earth', rev: false, ang: 270, len: 80, onObj: true }, { type: 'normal', agent: 'floor', rev: false, ang: 90, len: 80, onObj: true }], es);
  assert.ok(!r.ok && r.notes.length && /larger|accelerates/.test(r.notes[0].why));
  r = F.grade([{ type: 'grav', agent: 'Earth', rev: false, ang: 270, len: 80, onObj: true }, { type: 'normal', agent: 'floor', rev: false, ang: 90, len: 80 * eN.mag / eW.mag, onObj: true }, { type: 'tension', agent: 'cable', rev: false, ang: 90, len: 40, onObj: true }], es);
  assert.equal(r.arrows[2].code, 'no-agent'); assert.match(r.arrows[2].why, /cable pulls on the elevator/);

  // Rough ramp at rest: kinetic friction where it is static is a kind miss.
  const fc = data.contexts.find(c => c.id === 'friction');
  let rr; for (let s = 1; s < 300 && !rr; s++){ const q = F.generate(M.rng(s), fc, 'rough'); if (q.res.state === 'rest') rr = q; }
  const rs = rr.steps[0], mx = Math.max(...rs.forces.map(f => f.mag));
  r = F.grade(rs.forces.map(f => ({ type: f.type === 'fs' ? 'fk' : f.type, agent: f.agent, rev: false, ang: f.ang, len: 30 + 100 * f.mag / mx, onObj: true })), rs);
  assert.ok(r.arrows.some(a => a.code === 'kind'));
});

test('free-body-diagrams: the validator catches planted errors in the model', () => {
  const src = readFileSync(join(ROOT, 'physics', 'assets', 'tools', 'math', 'free-body-diagrams.js'), 'utf8');
  const shared = readFileSync(join(ROOT, 'physics', 'assets', 'tools', 'phys-tool-math.js'), 'utf8');
  const load = code => { const ctx = {}; ctx.window = ctx; vm.createContext(ctx); vm.runInContext(shared, ctx); vm.runInContext(code, ctx); return ctx.ApPhysMath; };
  const bugs = [
    ["normalF('ramp', W * Math.cos(rad(th)), 90 - th, 'block', true)]", "normalF('ramp', W, 90 - th, 'block', true)]"],
    ['T = 2 * m1 * m2 * g / (m1 + m2), am', 'T = m1 * g, am'],
    ["if(T.fam === 'fake') res[i]", 'if(false) res[i]'],
    ['if(ratio >= 1.12 && la <= lb * 1.03)', 'if(ratio >= 3 && la <= lb * 1.03)']
  ];
  for (const [a, b] of bugs) {
    assert.ok(src.includes(a), a);
    const Mb = load(src.replace(a, b)), Fb = Mb.freeBodyDiagrams;
    let caught = false;
    for (const c of data.contexts) for (const s of c.scenes) for (let i = 1; i <= 60 && !caught; i++) {
      const p = Fb.generate(Mb.rng(i * 31), c, s), st = p.steps[0], ph = physics(s, p.params, p.g);
      const key = st.forces, mx = Math.max(...key.map(f => f.mag));
      const sameForces = ph.forces.filter(f => f.mag > 1e-9).every(f => key.some(k => k.type === f.type && k.agent === f.agent && near(k.mag, f.mag, 1e-9)));
      const good = key.map(f => ({ type: f.type, agent: f.agent, rev: false, ang: f.ang, len: 30 + 100 * f.mag / mx, onObj: true }));
      const fakeCaught = Fb.grade([...good, { type: 'net', agent: '', rev: false, ang: 0, len: 40, onObj: true }], st).arrows.slice(-1)[0].code === 'fake-net';
      const opp = key.findIndex((f, k) => key.some((h, j) => j !== k && Math.abs(Math.abs(f.ang - h.ang) - 180) < 1 && Math.max(f.mag, h.mag) / Math.min(f.mag, h.mag) > 1.3));
      let lenCaught = true;
      if (opp > -1) { const j = key.findIndex((h, j2) => j2 !== opp && Math.abs(Math.abs(key[opp].ang - h.ang) - 180) < 1); lenCaught = !Fb.grade(good.map((a, k) => k === opp || k === j ? { ...a, len: 80 } : a), st).ok; }
      if (!sameForces || !fakeCaught || !lenCaught) caught = true;
    }
    assert.ok(caught, `planted bug not caught: ${b}`);
  }
});
