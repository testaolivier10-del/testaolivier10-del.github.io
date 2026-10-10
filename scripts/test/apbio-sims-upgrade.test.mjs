/* AP® Biology simulator upgrade (docs/tools-upgrade-notes/bio-sims.md): the
   helpers the animated stages read from ApBioMath must agree with the
   models the tools already used. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { runtime } from '../lib/apbio-tool-checks/_shared.mjs';
import { ROOT } from '../lib/apbio-build.mjs';

const { M } = runtime();
const data = slug => JSON.parse(readFileSync(join(ROOT, 'bio', 'data', 'tools', `${slug}.json`), 'utf8'));

test('osmosis trajectory: starts at 1, ends where simulate ends, moves one way', () => {
  for (const sys of data('osmosis').systems) {
    for (const C of [0, 0.15, 0.3, 0.45, 0.7, 1]) {
      for (const I of [1, 2]) {
        const c = { outC: C, outI: I, inC: 0.4, inI: 1, T: sys.defaults.T, t: sys.time.value };
        const tr = M.osmosis.trajectory(sys, c, 40), r = M.osmosis.simulate(sys, c);
        assert.equal(tr.length, 41);
        assert.equal(tr[0].W, 1);
        assert.ok(Math.abs(tr[40].W - r.W) < 1e-9, `${sys.id} ${C} ${I}: ${tr[40].W} vs ${r.W}`);
        assert.equal(tr[40].lysed, r.lysed);
        // monotone: water only ever goes the starting direction (no overshoot)
        for (let k = 1; k <= 40; k++) {
          const d = tr[k].W - tr[k - 1].W;
          if (r.startDir === 'in') assert.ok(d >= -1e-9);
          if (r.startDir === 'out') assert.ok(d <= 1e-9);
        }
        for (let k = 1; k <= 40; k++) assert.ok(tr[k].t >= tr[k - 1].t);
      }
    }
  }
});

test('osmosis trajectory: a lysed cell stays lysed', () => {
  const rbc = data('osmosis').systems.find(s => s.kind === 'animal');
  const tr = M.osmosis.trajectory(rbc, { outC: 0, outI: 1, T: 37, t: 5 }, 40);
  const first = tr.findIndex(x => x.lysed);
  assert.ok(first > 0);
  assert.ok(tr.slice(first).every(x => x.lysed));
});

test('enzyme states agree with the rate model', () => {
  for (const p of data('enzyme-activity').profiles) {
    const opt = M.enzyme.optimumT(p);
    for (const T of [5, 25, p.defaults.T, opt, p.Tm, p.Tm + 8]) {
      const c = { S: 5, T, pH: p.defaults.pH, inhibitor: 'none', I: 0 };
      const k = M.enzyme.states(p, c), f0 = M.enzyme.states(p, { ...c, T: opt });
      // tempFactor = motion × folded, normalized at the optimum
      assert.ok(Math.abs(M.enzyme.tempFactor(p, T) - k.motion * k.folded / f0.folded) < 1e-6, `${p.id} ${T}`);
      assert.ok(Math.abs(k.phOk - M.enzyme.phFactor(p, c.pH)) < 1e-12);
    }
    // occupancy times working enzyme reproduces rate / (Vmax · temp · pH)
    for (const inhibitor of ['none', 'competitive', 'noncompetitive']) {
      for (const S of [0.5, 2, 10, 20]) {
        const c = { S, T: p.defaults.T, pH: p.defaults.pH, inhibitor, I: 2 };
        const k = M.enzyme.states(p, c), r = M.enzyme.rate(p, c, S);
        const scale = p.Vmax * M.enzyme.tempFactor(p, c.T) * M.enzyme.phFactor(p, c.pH);
        assert.ok(Math.abs(r / scale - k.substrate * (1 - k.allosteric)) < 1e-9, `${p.id} ${inhibitor} ${S}`);
      }
    }
  }
});

test('operon mutant quiz: strains the quiz accepts as interchangeable give identical tables', () => {
  const P = data('operons').model;
  const lac = g => data('operons').lacStarts.map(m => { const s = M.operon.state(P, { mode: 'lac', glucose: m.glucose, lactose: m.lactose, copies: [g] }); return [s.m, s.e]; });
  const trp = g => data('operons').trpStarts.map(m => M.operon.state(P, { mode: 'trp', trp: m.trp, copies: [g] }).m);
  assert.deepEqual(lac({ I: '-', O: '+', Z: '+' }), lac({ I: '+', O: 'c', Z: '+' }));
  // trpR⁻ and trp Oᶜ cannot be told apart from haploid levels, so the quiz accepts either
  assert.deepEqual(trp({ R: '-', O: '+' }), trp({ R: '+', O: 'c' }));
  assert.notDeepEqual(trp({ R: '+', O: '+' }), trp({ R: '-', O: '+' }));
});

test('HW drift Guess N: the SD cutoffs the quiz uses separate N = 100 from N = 1000', () => {
  const sdOf = a => { const m = a.reduce((x, y) => x + y) / a.length; return Math.sqrt(a.reduce((x, y) => x + (y - m) ** 2, 0) / a.length); };
  let ok100 = 0, ok1000 = 0;
  for (let s = 1; s <= 20; s++) {
    const run = N => sdOf(M.popgen.simulate({ p0: 0.5, N, gens: 60, reps: 8, seed: s, w: [1, 1, 1], u: 0, v: 0, m: 0, F: 0, event: null }).reps.map(r => r.p[60]));
    if (run(100) > 0.15) ok100++;
    if (run(1000) < 0.1) ok1000++;
  }
  // most draws pass (so the redraw loop ends fast), and the bands do not meet
  assert.ok(ok100 >= 15 && ok1000 >= 15, `${ok100} ${ok1000}`);
});
