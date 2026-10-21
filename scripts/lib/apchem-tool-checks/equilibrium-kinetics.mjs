/* Validator for chem/data/tools/equilibrium-kinetics.json (the particle-level
   equilibrium and kinetics simulator).

   The reactions: K at the reference temperature reproduces the data's
   source (N2O4: Kp from ΔG° = +4.73 kJ/mol at 298.15 K; HI: Kc = 54.3 near
   703 K, Δn = 0 so Kc = Kp); ΔH° signs (N2O4 endothermic, HI exothermic);
   the catalyst lowers Ea but leaves Ea > 0; the starting mixture's exact
   equilibrium satisfies Q = Kc; rates are equal there (kr = kf/Kc); the
   stepper approaches Q = K from both sides without overshooting.

   The problems: SEEDS seeded problems per context, each step sound
   (_drills.mjs), and the keys recomputed here without the generator: K
   changes only for heat and cool, the shift from Q against the new K
   (van 't Hoff with the data's ΔH°, and Q from the concentrations after the
   stress, including (V-factor)^Δn), no shift for a catalyst or for a volume
   change when Δn = 0, and the rate change right after the stress. */
import { runtime } from './_shared.mjs';
import { frame, sweep, close } from './_drills.mjs';

export function check(data, map) {
  const errs = [];
  const { M } = runtime();
  const E = M.eqk;
  frame(data, 'equilibrium-kinetics', 'simulator', map, errs);
  const R = 8.314, RL = 0.08206;
  const rxOf = id => (data.reactions || []).find(r => r.id === id);
  for (const rx of data.reactions || []) {
    const w = `reaction ${rx.id}`, dn = rx.species.reduce((n, s) => n + s.nu, 0);
    if (rx.id === 'n2o4') {
      const KpRef = Math.exp(-4.73e3 / (R * 298.15)) / 1.01325;
      if (!close(rx.Kp, KpRef, 0.005)) errs.push(`${w}: Kp ${rx.Kp} vs ${KpRef.toFixed(4)} from ΔG°`);
      if (!(rx.dH > 0)) errs.push(`${w}: N2O4 dissociation is endothermic`);
    }
    if (rx.id === 'hi') {
      if (dn !== 0) errs.push(`${w}: Δn must be 0`);
      if (!close(rx.Kp, 54.3, 0.01) || Math.abs(rx.Tref - 703.15) > 5) errs.push(`${w}: K = 54.3 near 703 K`);
      if (!(rx.dH < 0)) errs.push(`${w}: HI formation from I2(g) is exothermic`);
    }
    for (const T of [rx.T[0], rx.T[2], rx.T[1]]) {
      const Kc = E.Kc(rx, T), Kref = rx.Kp * Math.exp(-rx.dH * 1000 / R * (1 / T - 1 / rx.Tref)) / Math.pow(RL * T, dn);
      if (!close(Kc, Kref, 1e-9)) errs.push(`${w}: Kc at ${T} K`);
      const c = E.equilibrium(rx, rx.start, T), q = rx.species.reduce((x, s, i) => x * c[i] ** s.nu, 1);
      if (!close(q, Kc, 1e-6)) errs.push(`${w}: equilibrium at ${T} K gives Q ${q} vs K ${Kc}`);
      if (c.some(x => !(x > 0))) errs.push(`${w}: a species runs out at ${T} K`);
      const r = E.rates(rx, c, T, false);
      if (!close(r.f, r.r, 1e-5)) errs.push(`${w}: rates unequal at equilibrium (${r.f} vs ${r.r})`);
      const rc = E.rates(rx, c, T, true);
      if (!close(rc.f / r.f, Math.exp(rx.catDrop * 1000 / (R * T)), 1e-9) || !close(rc.r / r.r, rc.f / r.f, 1e-9)) errs.push(`${w}: the catalyst must speed both directions by e^(ΔEa/RT)`);
      // From far below and far above K: Q moves monotonically to K.
      for (const start of [rx.start, rx.species.map((s, i) => (s.nu > 0 ? 0.3 : 0.02))]) {
        let x = start.slice(), side = null, ok = true;
        for (let i = 0; i < 3000; i++) {
          x = E.step(rx, x, T, false, 0.05).c;
          const lq = Math.log(rx.species.reduce((p, s, j) => p * Math.max(x[j], 1e-300) ** s.nu, 1) / Kc);
          const sg = Math.sign(lq);
          if (side === null && Math.abs(lq) > 1e-6) side = sg;
          if (side !== null && sg === -side && Math.abs(lq) > 1e-6) { ok = false; break; }
        }
        if (!ok) errs.push(`${w}: overshoots K at ${T} K`);
      }
    }
    if (!(rx.catDrop > 0 && rx.catDrop < rx.Ea)) errs.push(`${w}: catalyst drop`);
    // Maxwell-Boltzmann: normalized, and the tail matches the integral.
    const T = rx.T[2]; let area = 0, tail = 0; const de = 0.01;
    for (let e = de / 2; e < 400; e += de) { const f = E.mb(e, T); area += f * de; if (e >= rx.Ea) tail += f * de; }
    if (Math.abs(area - 1) > 1e-3) errs.push(`${w}: MB area ${area}`);
    if (!close(E.mbAbove(rx.Ea, T), tail, 0.02, 1e-14)) errs.push(`${w}: MB tail ${E.mbAbove(rx.Ea, T)} vs ${tail}`);
  }
  const seen = new Set();
  sweep(data, errs, (r, c) => E.generate(r, c, rxOf(c.reaction)), (p, c, w) => {
    const rx = rxOf(c.reaction), T = p.T, sp = rx.species, dn = sp.reduce((n, s) => n + s.nu, 0), st = p.stress;
    seen.add(c.reaction + ':' + st);
    const step = k => p.steps.find(s => s.key === k), K0 = E.Kc(rx, T);
    const T2 = st === 'heat' ? T + 30 : st === 'cool' ? T - 30 : T, K2 = rx.Kp * Math.exp(-rx.dH * 1000 / R * (1 / T2 - 1 / rx.Tref)) / Math.pow(RL * T2, dn);
    let c2 = p.c0.slice();
    const iR = sp.findIndex(s => s.nu < 0), iP = sp.findIndex(s => s.nu > 0);
    if (st === 'addR') c2[iR] += Math.max(p.c0[iR], 0.05) * 0.6; if (st === 'removeR') c2[iR] *= 0.4;
    if (st === 'addP') c2[iP] += Math.max(p.c0[iP], 0.05) * 0.6; if (st === 'removeP') c2[iP] *= 0.4;
    if (st === 'compress') c2 = c2.map(x => 2 * x); if (st === 'expand') c2 = c2.map(x => x / 2);
    const Q2 = sp.reduce((x, s, i) => x * c2[i] ** s.nu, 1), lr = Math.log(K2 / Q2);
    const dir = st === 'catalyst' || Math.abs(lr) < 1e-9 ? 2 : lr > 0 ? 0 : 1;
    if (step('dir').correct !== dir) errs.push(`${w}: ${st} keyed ${step('dir').options[step('dir').correct]}, recomputed ${['forward', 'reverse', 'none'][dir]}`);
    // Le Chatelier as stated in the book, independently of Q and K:
    const lc = { heat: rx.dH > 0 ? 0 : 1, cool: rx.dH > 0 ? 1 : 0, addR: 0, removeP: 0, addP: 1, removeR: 1, catalyst: 2, compress: dn === 0 ? 2 : dn > 0 ? 1 : 0, expand: dn === 0 ? 2 : dn > 0 ? 0 : 1 }[st];
    if (lc !== dir) errs.push(`${w}: ${st}: Q-vs-K and Le Chatelier disagree`);
    const what = st === 'heat' || st === 'cool' ? 0 : st === 'catalyst' ? 2 : 1;
    if (step('qk').correct !== what) errs.push(`${w}: what changes keyed wrong for ${st}`);
    if (!close(p.after.K, K2, 1e-9) || !close(p.after.Q, Q2, 1e-9)) errs.push(`${w}: Q or K after ${st}`);
    const rs = step('rate'), key = rs.options[rs.correct];
    const want = { heat: 'Both rates increase', cool: 'Both rates decrease', catalyst: 'Both rates increase', compress: 'Both rates increase', expand: 'Both rates decrease', addR: 'Only the forward rate increases at first', removeR: 'Only the forward rate decreases at first', addP: 'Only the reverse rate increases at first', removeP: 'Only the reverse rate decreases at first' }[st];
    if (key !== want) errs.push(`${w}: rate after ${st} keyed "${key}", want "${want}"`);
    if (!rs.options.includes(want)) errs.push(`${w}: rate options miss the key`);
    void K0;
  });
  for (const c of data.contexts || []) for (const s of c.stresses) if (!seen.has(c.reaction + ':' + s)) errs.push(`context ${c.id}: stress ${s} never generated`);
  return errs;
}
