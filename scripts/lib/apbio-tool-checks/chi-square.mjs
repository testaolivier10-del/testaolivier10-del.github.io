/* Validator for bio/data/tools/chi-square.json. Chi-square goodness of fit, with the critical value table for df 1-8.
   The shared skills checks (_shared.mjs skills()): topics, 300 seeded
   problems per context solve soundly, fixed problems match "expect". */
import { skills } from './_shared.mjs';

export function check(data, map) {
  const errs = [];
  const { M, P } = skills(data, 'chi-square', 'chi', map, errs);
  // The standard table (formula sheet), typed here independently of the runtime.
  const P05 = [3.84, 5.99, 7.81, 9.49, 11.07, 12.59, 14.07, 15.51], P01 = [6.63, 9.21, 11.34, 13.28, 15.09, 16.81, 18.48, 20.09];
  P05.forEach((v, i) => { if (M.CHI_CRIT['0.05'][i + 1] !== v) errs.push(`critical value at p = 0.05, df = ${i + 1} must be ${v}`); });
  P01.forEach((v, i) => { if (M.CHI_CRIT['0.01'][i + 1] !== v) errs.push(`critical value at p = 0.01, df = ${i + 1} must be ${v}`); });
  const sumOk = a => Math.abs(a.reduce((s, x) => s + x, 0) - 1) < 1e-9;
  for (const c of data.contexts || []) {
    if (!sumOk(c.props)) errs.push(`context ${c.id}: expected proportions must add up to 1`);
    if (c.cats.length !== c.props.length || c.cats.length < 2 || c.cats.length > 9) errs.push(`context ${c.id}: 2-9 categories, one proportion each`);
    if (Math.min(...c.props) * c.N[0] < 5) errs.push(`context ${c.id}: the smallest N gives an expected count under 5`);
  }
  for (const p of data.problems || []) {
    const x = p.input, N = x.obs.reduce((a, b) => a + b, 0);
    if (!sumOk(x.props)) errs.push(`problem ${p.id}: expected proportions must add up to 1`);
    if (x.props.some(q => q * N < 5)) errs.push(`problem ${p.id}: an expected count is under 5`);
    const chi = x.obs.reduce((a, o, i) => a + (o - N * x.props[i]) ** 2 / (N * x.props[i]), 0);
    if (Math.abs(chi - M.chiSquare(x.obs, x.props.map(q => N * q)).chi2) > 1e-9) errs.push(`problem ${p.id}: χ² does not match Σ(o − e)²/e`);
  }
  return errs;
}
