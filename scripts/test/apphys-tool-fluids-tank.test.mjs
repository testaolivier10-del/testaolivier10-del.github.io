/* Fluids tank: its model (physics/assets/tools/math/fluids-tank.js) and its
   validator (scripts/lib/apphys-tool-checks/fluids-tank.mjs). OWNED BY THIS
   TOOL ONLY. Same seed same problem; the physics of the explorer (floating
   fraction, the drop settling where F_b = F_g, the spring scale, pressure,
   continuity, Bernoulli, Torricelli) against first principles; the slips
   named; planted mistakes caught; the shipped data passing. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { runtime } from '../lib/apphys-tool-checks/_shared.mjs';
import { check } from '../lib/apphys-tool-checks/fluids-tank.mjs';
import { loadMap, ROOT } from '../lib/apphys-build.mjs';

const { M, model: FT } = runtime('fluids-tank');
const map = loadMap();
const data = JSON.parse(readFileSync(join(ROOT, 'physics', 'data', 'tools', 'fluids-tank.json'), 'utf8'));
const near = (a, b, rel = 1e-9, abs = 1e-12) => assert.ok(Math.abs(a - b) <= rel * Math.abs(b) + abs, `${a} vs ${b}`);
const g = 9.8;

test('fluids-tank: the shipped data pass the validator (300 seeds per context and type)', () => {
  assert.deepEqual(check(data, map), []);
});

test('fluids-tank: same seed, same problem; different seeds vary', () => {
  for (const c of data.contexts) for (const t of c.types) {
    assert.equal(JSON.stringify(FT.generate(M.rng(99), c, t)), JSON.stringify(FT.generate(M.rng(99), c, t)));
    const seen = new Set([1, 2, 3, 4, 5, 6, 7, 8].map(s => FT.generate(M.rng(s * 31), c, t).text));
    assert.ok(seen.size >= 3, `${c.id} ${t} varies`);
  }
});

test('fluids-tank: float or sink, and the floating fraction is ρ_obj/ρ_fluid for both shapes', () => {
  for (const o of Object.values(FT.OBJECTS)) for (const f of Object.values(FT.FLUIDS)) {
    const s = FT.settle(o, f.rho);
    if (o.rho < f.rho * (1 - FT.HOVER)) {
      assert.equal(s.state, 'floats');
      near(FT.submerged(o, s.y) / FT.volume(o), o.rho / f.rho, 1e-6);
      // at that depth the buoyant force equals the weight
      const F = FT.forces(o, f.rho, s.y, 0.3); near(F.Fb, F.Fg, 1e-6);
    } else if (o.rho > f.rho * (1 + FT.HOVER)) assert.equal(s.state, 'sinks');
    else assert.equal(s.state, 'hovers');
  }
  // the hollow ball hovers in water, floats in salt water and sinks in oil
  assert.equal(FT.settle(FT.OBJECTS.ball, 1000).state, 'hovers');
  assert.equal(FT.settle(FT.OBJECTS.ball, 1025).state, 'floats');
  assert.equal(FT.settle(FT.OBJECTS.ball, 800).state, 'sinks');
  // a sphere's submerged volume: half of it at the equator, all of it at 2r
  const b = FT.OBJECTS.ball; near(FT.submerged(b, b.r), FT.volume(b) / 2, 1e-12); near(FT.submerged(b, 2 * b.r), FT.volume(b), 1e-12);
});

test('fluids-tank: a drop settles where the model says (a stable integration)', () => {
  for (const [ok, fk] of [['wood', 'water'], ['ice', 'salt'], ['ice', 'water'], ['aluminum', 'oil'], ['wood', 'oil']]) {
    const o = FT.OBJECTS[ok], rho = FT.FLUIDS[fk].rho, s = FT.sim(o, rho, 0.30, -0.10);
    for (let i = 0; i < 1200 && !s.state.still; i++) s.step(1 / 60);
    const end = FT.settle(o, rho);
    assert.ok(s.state.still, `${ok} in ${fk} comes to rest`);
    if (end.state === 'floats') near(s.state.y, end.y, 0.01); else near(s.state.y, 0.30, 1e-6);
    assert.ok(Number.isFinite(s.state.v) && Math.abs(s.state.v) < 0.01);
  }
  // pushed under and let go, a floating block comes back up to float
  const w = FT.OBJECTS.wood, s2 = FT.sim(w, 1000, 0.30, 0.25);
  for (let i = 0; i < 1200 && !s2.state.still; i++) s2.step(1 / 60);
  near(s2.state.y, FT.settle(w, 1000).y, 0.01);
});

test('fluids-tank: spring scale, pressure, continuity, Bernoulli and the hole', () => {
  const al = FT.OBJECTS.aluminum, V = al.side ** 3;
  near(FT.scale(al, 1000, -0.01).reading, al.rho * V * g, 1e-9);            // in air: the weight
  near(FT.scale(al, 1000, 0.2).reading, (al.rho - 1000) * V * g, 1e-9);     // fully under: F_g − F_b
  near(FT.scale(al, 1000, 0.1).reading, FT.scale(al, 1000, 0.2).reading, 1e-12); // independent of depth once under
  assert.equal(FT.scale(FT.OBJECTS.wood, 1000, 0.2).slack, true);           // a floater slackens the string
  const P = FT.pressure(10, 1000); near(P.gauge, 98000, 1e-12); near(P.abs, 198000, 1e-12);
  const pp = FT.pipe({ rho: 1000, v1: 1, d1: 0.06, d2: 0.03, y1: 0, y2: 1, P1: 150000 });
  near(pp.v2, 4, 1e-12); near(pp.P2, 150000 + 500 * (1 - 16) - 9800, 1e-12);
  // energy per volume is the same at both points
  near(150000 + 500 * 1, pp.P2 + 500 * 16 + 9800, 1e-12);
  const h = FT.hole(1.5, 0.5); near(h.v, Math.sqrt(2 * g * 1), 1e-12); near(h.range, 2 * Math.sqrt(1 * 0.5), 1e-9);
});

test('fluids-tank: the drill names the slips readers report', () => {
  const ctx = id => data.contexts.find(c => c.id === id);
  const p = FT.generate(M.rng(5), ctx('buoyancy'), 'buoyant'), Fb = p.steps.find(s => s.key === 'Fb').cell;
  assert.match(M.diagnose(Fb, p.values.rhoO * p.values.V * g).why, /FLUID/);   // the object's density
  const a = FT.generate(M.rng(6), ctx('buoyancy'), 'apparent'), T = a.steps.find(s => s.key === 'T').cell;
  assert.match(M.diagnose(T, a.values.Fg + a.values.Fb).why, /UP/);            // F_g + F_b
  const pr = FT.generate(M.rng(7), ctx('pressure'), 'pressure'), abs = pr.steps.find(s => s.key === 'abs').cell;
  assert.match(M.diagnose(abs, pr.values.gauge / 1000).why, /gauge/);          // gauge for absolute
  const co = FT.generate(M.rng(8), ctx('flow'), 'continuity'), v2 = co.steps.find(s => s.key === 'v2').cell;
  assert.match(M.diagnose(v2, co.values.v1 * co.values.d1 / co.values.d2).why, /SQUARED|squared/);
});

test('fluids-tank: the validator catches planted mistakes', () => {
  const bad = structuredClone(data); bad.contexts[0].types = ['nope'];
  assert.ok(check(bad, map).some(e => /types/.test(e)));
  const bad2 = structuredClone(data); bad2.contexts[1].fluids = ['mercury'];
  assert.ok(check(bad2, map).some(e => /unknown fluid/.test(e)));
  const bad3 = structuredClone(data); bad3.scenes.push({ id: 'vortex', topic: 'buoyancy' });
  assert.ok(check(bad3, map).some(e => /vortex/.test(e)));
  // a model whose buoyant force used the object's density would be caught by the recheck
  const orig = FT.generate;
  try {
    FT.generate = (r, c, t) => { const p = orig(r, c, t); if (p.type === 'buoyant') p.steps.find(s => s.key === 'Fb').cell.answer *= 1.1; return p; };
    assert.ok(check(data, map).some(e => /F_b is not/.test(e)));
  } finally { FT.generate = orig; }
});
