/* AP® Chemistry explore models (tools upgrade Phase 2): the pure functions
   behind the titration explorer, the buffer beaker, Q vs K with amounts,
   the particle build mode and unit cancelling (chem/assets/tools/
   chem-tool-math.js). Each is checked against an independent calculation. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { runtime } from '../lib/apchem-tool-checks/_shared.mjs';

const { M } = runtime();
const T = M.titration;
const close = (a, b, tol, msg) => assert.ok(Math.abs(a - b) <= tol, `${msg || ''} ${a} vs ${b}`);

test('titration species: mass and charge balance, landmarks', () => {
  // 25.0 mL of 0.100 M acetic acid with 0.100 M NaOH: Veq = 25.0 mL.
  const wa = { kind: 'wa', Ca: 0.1, Va: 25, Ct: 0.1, Ka: [1.8e-5] };
  for (const v of [0, 5, 12.5, 20, 25, 30, 40]) {
    const s = T.species(wa, v);
    close(s.HA + s.A, 2.5, 1e-9, `mmol acid conserved at ${v}`);
    // Charge balance in mmol: Na⁺ + H₃O⁺ = A⁻ + OH⁻.
    close(0.1 * v + s.H3O, s.A + s.OH, 1e-6, `charge at ${v}`);
    close(s.pH, T.pH(wa, v), 1e-12);
  }
  const h = T.species(wa, 12.5);
  close(h.HA / h.A, 1, 0.02, 'equal amounts at half-equivalence');
  close(h.pH, -Math.log10(1.8e-5), 0.01, 'pH = pKa at half-equivalence');
  const e = T.species(wa, 25);
  assert.ok(e.HA / e.A < 1e-3, 'almost no HA at equivalence');
  // Equivalence: 0.0500 M acetate, pOH from Kb = Kw/Ka exactly.
  const Kb = 1e-14 / 1.8e-5, oh = (-Kb + Math.sqrt(Kb * Kb + 4 * Kb * 0.05)) / 2;
  close(e.pH, 14 + Math.log10(oh), 0.01, 'equivalence pH');
  // Weak base: NH₃ with HCl.
  const wb = { kind: 'wb', Ca: 0.1, Va: 20, Ct: 0.1, Kb: 1.8e-5 };
  const b = T.species(wb, 10);
  close(b.B + b.BH, 2, 1e-9); close(b.B / b.BH, 1, 0.02);
  // Diprotic: three forms sum to the start, HA⁻ dominates at eq1.
  const di = { kind: 'di', Ca: 0.1, Va: 20, Ct: 0.1, Ka: [1e-3, 1e-8] };
  const d1 = T.species(di, 20);
  close(d1.H2A + d1.HA + d1.A, 2, 1e-9);
  assert.ok(d1.HA > 0.95 * 2, 'HA⁻ at the first equivalence point');
  const sa = T.species({ kind: 'sa', Ca: 0.1, Va: 25, Ct: 0.1 }, 10);
  close(sa.H3O, 2.5 - 1, 1e-4, 'strong acid: leftover H₃O⁺ in mmol');
});

test('titration regions and indicator crossing', () => {
  const wa = { kind: 'wa', Ca: 0.1, Va: 25, Ct: 0.1, Ka: [1.8e-5] };
  assert.equal(T.region(wa, 0), 'start');
  assert.equal(T.region(wa, 5), 'acid-rich');
  assert.equal(T.region(wa, 12.5), 'half');
  assert.equal(T.region(wa, 12.7), 'half');
  assert.equal(T.region(wa, 18), 'base-rich');
  assert.equal(T.region(wa, 25.1), 'eq');
  assert.equal(T.region(wa, 25.3), 'after', 'past the jump within a few drops');
  assert.equal(T.region(wa, 24.7), 'base-rich');
  assert.equal(T.region(wa, 30), 'after');
  const di = { kind: 'di', Ca: 0.1, Va: 20, Ct: 0.1, Ka: [1e-3, 1e-8] };
  assert.deepEqual([5, 10, 15, 20, 25, 30, 35, 40, 45].map(v => T.region(di, v)), ['b1a', 'half1', 'b1b', 'eq1', 'b2a', 'half2', 'b2b', 'eq2', 'after']);
  const v = T.cross(wa, 9, 40);
  close(T.pH(wa, v), 9, 1e-3, 'crossing pH');
  assert.ok(v > 24.9 && v < 25.1, 'phenolphthalein turns at the jump');
  assert.equal(T.cross(wa, 2, 40), 0, 'already past');
  assert.equal(T.cross(wa, 13.5, 40), Infinity, 'never reached');
  const wb = { kind: 'wb', Ca: 0.1, Va: 20, Ct: 0.1, Kb: 1.8e-5 };
  close(T.pH(wb, T.cross(wb, 5, 40)), 5, 1e-3, 'falling curve');
});

test('buffer state: Henderson-Hasselbalch inside capacity, strong excess past it', () => {
  const Ka = 1.8e-5, pKa = -Math.log10(Ka), V = 0.1;
  // 0.010 mol HA + 0.010 mol A⁻ in 100 mL.
  const s0 = M.bufferState({ Ka, nHA: 0.01, nA: 0.01, V, b: 0 });
  assert.equal(s0.method, 'hh'); close(s0.pHmethod, pKa, 1e-12); close(s0.pH, pKa, 0.01);
  const s1 = M.bufferState({ Ka, nHA: 0.01, nA: 0.01, V, b: 0.004 });
  close(s1.nHA, 0.006, 1e-15); close(s1.nA, 0.014, 1e-15);
  close(s1.pHmethod, pKa + Math.log10(0.014 / 0.006), 1e-12); close(s1.pH, s1.pHmethod, 0.01, 'HH vs exact');
  // Exactly at capacity: only A⁻ left, a weak base at 0.20 M.
  const s2 = M.bufferState({ Ka, nHA: 0.01, nA: 0.01, V, b: 0.01 });
  assert.equal(s2.method, 'weak-base'); assert.equal(s2.nHA, 0);
  const Kb = 1e-14 / Ka, oh = (-Kb + Math.sqrt(Kb * Kb + 4 * Kb * 0.2)) / 2;
  close(s2.pHmethod, 14 + Math.log10(oh), 1e-9); close(s2.pH, s2.pHmethod, 0.01);
  // Past capacity: 0.002 mol OH⁻ left in 0.100 L -> pOH 1.70, pH 12.30.
  const s3 = M.bufferState({ Ka, nHA: 0.01, nA: 0.01, V, b: 0.012 });
  assert.equal(s3.method, 'excess-base'); close(s3.exOH, 0.002, 1e-15);
  close(s3.pHmethod, 14 + Math.log10(0.02), 1e-12); close(s3.pH, 12.30, 0.01);
  // Strong acid past capacity: 0.003 mol H₃O⁺ left -> pH 1.52.
  const s4 = M.bufferState({ Ka, nHA: 0.01, nA: 0.01, V, b: -0.013 });
  assert.equal(s4.method, 'excess-acid'); close(s4.pHmethod, -Math.log10(0.03), 1e-12); close(s4.pH, s4.pHmethod, 0.01);
  // Exact pH is monotonic in added base and agrees with the titration model.
  let last = -1;
  for (let b = -0.02; b <= 0.02; b += 0.0005) { const s = M.bufferState({ Ka, nHA: 0.01, nA: 0.01, V, b }); assert.ok(s.pH > last); last = s.pH; }
  // Same water: 0.004 mol NaOH in 100 mL of pure water -> pH 12.60.
  close(s1.water, 14 + Math.log10(0.04), 1e-6);
  close(M.bufferState({ Ka, nHA: 0.01, nA: 0.01, V, b: 0 }).water, 7, 1e-9);
  // Charge balance cross-check against the titration model: 0.010 mol HA
  // titrated as a weak acid (mmol and mL) to the same point.
  const wa = { kind: 'wa', Ca: 0.2, Va: 50, Ct: 0.2, Ka: [Ka] }; // 10 mmol HA
  const st = M.bufferState({ Ka, nHA: 0.01, nA: 0, V: 0.1, b: 0.005 });
  close(st.pH, T.pH(wa, 25), 0.03, 'dilution aside, half-neutralized acid sits at pKa');
});

test('equilibrate: amounts run until Q = K, volume matters only when Δn ≠ 0', () => {
  const hi = [{ html: 'H₂', nu: -1 }, { html: 'I₂', nu: -1 }, { html: 'HI', nu: 2 }];
  const n = M.equilibrate(hi, [1, 1, 0], 2, 50);
  close(M.Q(hi, M.concOf(n, 2)), 50, 1e-6);
  close(n[2], 2 * (1 - n[0]), 1e-9, 'stoichiometry');
  close(M.Q(hi, M.concOf([0.3, 0.2, 0.5], 1)), M.Q(hi, M.concOf([0.3, 0.2, 0.5], 4)), 1e-12, 'Δn = 0: volume cancels');
  const dim = [{ html: 'A₂', nu: -1 }, { html: 'A', nu: 2 }];
  // Halving V doubles every concentration: Q = [A]²/[A₂] doubles.
  close(M.Q(dim, M.concOf([0.4, 0.4], 0.5)) / M.Q(dim, M.concOf([0.4, 0.4], 1)), 2, 1e-12);
  const caco3 = [{ html: 'CaCO₃', nu: -1, phase: 's' }, { html: 'CaO', nu: 1, phase: 's' }, { html: 'CO₂', nu: 1, phase: 'g' }];
  const m = M.equilibrate(caco3, [1, 0, 0.1], 1, 0.5);
  close(m[2], 0.5, 1e-9); close(m[0], 0.6, 1e-9, '0.4 mol CaCO₃ decomposed');
  // Too little solid: it runs out before Q reaches K.
  const s = M.equilibrate(caco3, [0.2, 0, 0.1], 1, 0.5);
  close(s[0], 0, 1e-12); close(s[2], 0.3, 1e-9);
});

test('atomsOf counts atoms from the particle templates', () => {
  assert.deepEqual({ ...M.atomsOf({ H2: 3, O2: 1 }) }, { H: 6, O: 2 });
  assert.deepEqual({ ...M.atomsOf({ H2O: 2, H2: 1 }) }, { O: 2, H: 6 });
  assert.deepEqual({ ...M.atomsOf({ NH3: 2 }) }, { N: 2, H: 6 });
});

test('units cancel', () => {
  assert.deepEqual({ ...M.unitParse('L·atm/(mol·K)') }, { L: 1, atm: 1, mol: -1, K: -1 });
  const P = M.unitMul([{ u: 'mol', p: 1 }, { u: 'L·atm/(mol·K)', p: 1 }, { u: 'K', p: 1 }, { u: 'L', p: -1 }]);
  assert.equal(M.unitText(P), 'atm');
  assert.equal(M.unitText(M.unitMul([{ u: 'g', p: 1 }, { u: 'J/(g·°C)', p: 1 }, { u: '°C', p: 1 }])), 'J');
  assert.equal(M.unitText(M.unitMul([{ u: 'g', p: 1 }, { u: 'mL', p: -1 }])), 'g/mL');
  assert.equal(M.unitText(M.unitMul([{ u: 'J', p: 1 }, { u: 'J', p: -1 }])), '');
  assert.ok(M.unitSame('L·atm/(mol·K)', 'atm·L/(K·mol)'));
  assert.ok(!M.unitSame('J/(mol·K)', 'L·atm/(mol·K)'));
});
