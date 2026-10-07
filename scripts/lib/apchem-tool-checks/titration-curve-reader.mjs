/* Validator for chem/data/tools/titration-curve-reader.json. 300 seeded
   curves per context from ApChemMath.titration.generate (_drills.mjs), and
   here, without the generator:
   - the equivalence volume is moles of analyte ÷ titrant molarity;
   - every drawn point satisfies the charge balance it was solved from
     (residual below 1e-6 of the largest term);
   - the curve rises (or falls, for a base) and is steepest at equivalence;
   - pH at half-equivalence is pKa within 0.05 (the buffer region), and
     the key for pKa is that pH;
   - pH at equivalence is 7 for HCl, above 7 for a weak acid, below for a
     weak base, and the keyed indicator is the one table range containing it;
   - the species named at the marked point fit the volume's region. */
import { runtime } from './_shared.mjs';
import { frame, sweep, close } from './_drills.mjs';

export function check(data, map) {
  const errs = [];
  const { M } = runtime();
  frame(data, 'titration-curve-reader', 'simulator', map, errs);
  const T = M.titration;
  const kinds = new Set();
  sweep(data, errs, (r, c) => T.generate(r, c), (p, c, w) => {
    const s = p.sys, Kw = M.C.Kw;
    kinds.add(s.kind);
    const e = s.Ca * s.Va / s.Ct;
    if (!close(p.eqs[0], e, 1e-12)) errs.push(`${w}: equivalence volume ${p.eqs[0]}, moles give ${e}`);
    if (s.kind === 'di' && !close(p.eqs[1], 2 * e, 1e-12)) errs.push(`${w}: second equivalence volume wrong`);
    let worst = 0;
    for (const [v, pH] of p.curve) {
      const h = 10 ** -pH, oh = Kw / h, V = s.Va + v, CA = s.Ca * s.Va / V, CT = s.Ct * v / V;
      let res, big;
      if (s.kind === 'sa') { res = h + CT - oh - CA; big = Math.max(h, CT, oh, CA); }
      else if (s.kind === 'wb') { const Ka = Kw / s.Kb, bh = CA * h / (h + Ka); res = h + bh - oh - CT; big = Math.max(h, bh, oh, CT); }
      else {
        const [K1, K2] = s.Ka, D = h * h + (K2 ? h * K1 + K1 * K2 : 0);
        const lost = K2 ? (h * K1 + 2 * K1 * K2) / D : K1 / (h + K1);
        res = h + CT - oh - CA * lost; big = Math.max(h, CT, oh, CA * lost);
      }
      worst = Math.max(worst, Math.abs(res) / big);
    }
    if (worst > 1e-6) errs.push(`${w}: a curve point misses the charge balance (relative residual ${worst.toExponential(1)})`);
    const sign = s.kind === 'wb' ? -1 : 1;
    if (p.curve.some((q, i) => i && sign * (q[1] - p.curve[i - 1][1]) < -1e-9)) errs.push(`${w}: the curve is not monotonic`);
    const last = p.eqs[p.eqs.length - 1];
    const slope = v => Math.abs(T.pH(s, v + 0.05) - T.pH(s, v - 0.05));
    if (!(slope(last) > slope(last - 3) && slope(last) > slope(last + 3))) errs.push(`${w}: the curve is not steepest at the equivalence point`);
    const step = k => p.steps.find(x => x.key === k);
    if (!close(step('eq').cell.answer, p.eqs[0], 1e-12)) errs.push(`${w}: the equivalence step key is wrong`);
    if (s.kind !== 'sa') {
      if (!close(step('half').cell.answer, e / 2, 1e-12)) errs.push(`${w}: half-equivalence is not half the equivalence volume`);
      const pKa = s.kind === 'wb' ? 14 + Math.log10(s.Kb) : -Math.log10(s.Ka[0]);
      const at = T.pH(s, e / 2);
      if (Math.abs(at - pKa) > 0.05) errs.push(`${w}: pH at half-equivalence ${at.toFixed(3)} is not pKa ${pKa.toFixed(3)}`);
      if (!close(step('pKa').cell.answer, at, 1e-9)) errs.push(`${w}: the pKa key is not the pH at half-equivalence`);
    }
    if (s.kind === 'di') {
      const at2 = T.pH(s, 1.5 * e), pKa2 = -Math.log10(s.Ka[1]);
      if (Math.abs(at2 - pKa2) > 0.05) errs.push(`${w}: pH halfway between the equivalence points is not pKa2`);
      if (!close(step('pKa2').cell.answer, at2, 1e-9)) errs.push(`${w}: the pKa2 key is wrong`);
    }
    const phEq = T.pH(s, last);
    if (s.kind === 'sa' && Math.abs(phEq - 7) > 0.01) errs.push(`${w}: strong acid–strong base equivalence pH is ${phEq}, not 7`);
    if ((s.kind === 'wa' || s.kind === 'di') && !(phEq > 7)) errs.push(`${w}: weak acid equivalence pH should be above 7`);
    if (s.kind === 'wb' && !(phEq < 7)) errs.push(`${w}: weak base equivalence pH should be below 7`);
    const fits = T.INDICATORS.map((d, i) => (d.lo <= phEq && phEq <= d.hi ? i : -1)).filter(i => i > -1);
    if (fits.length !== 1 || step('indicator').correct !== fits[0]) errs.push(`${w}: the indicator key is not the one range containing pH ${phEq.toFixed(2)}`);
    const v = p.point.v, reg = p.point.region, want = region(s.kind, v, p.eqs);
    if (want !== reg) errs.push(`${w}: the marked point at ${v} mL is in region ${want}, keyed ${reg}`);
    if (step('species').options[step('species').correct] !== p.point.options[p.point.correct]) errs.push(`${w}: the species key is wrong`);
  });
  for (const k of ['sa', 'wa', 'wb', 'di']) if (!kinds.has(k)) errs.push(`no ${k} curve: strong acid, weak acid, weak base and diprotic are all required`);
  return errs;
}
function region(kind, v, eqs) {
  // Marked volumes are rounded to 0.01 mL.
  const e = eqs[0], at = x => Math.abs(v - x) < 0.006;
  if (v === 0) return 'start';
  if (kind === 'sa') return at(e) ? 'eq' : v < e ? 'before' : 'after';
  if (kind === 'di') return at(e) ? 'eq1' : at(eqs[1]) ? 'eq2' : v < e ? 'buffer1' : v < eqs[1] ? 'buffer2' : 'after';
  return at(e / 2) ? 'half' : at(e) ? 'eq' : v < e ? 'buffer' : 'after';
}
