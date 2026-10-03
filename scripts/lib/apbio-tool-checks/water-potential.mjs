/* Validator for bio/data/tools/water-potential.json. Water potential: ψs = −iCRT with R = 0.0831 and T = °C + 273, ψ = ψs + ψp.
   The shared skills checks (_shared.mjs skills()): topics, 300 seeded
   problems per context solve soundly, fixed problems match "expect". */
import { skills } from './_shared.mjs';

export function check(data, map) {
  const errs = [];
  const { M, P } = skills(data, 'water-potential', 'wp', map, errs);
  if (Math.abs(M.R - 0.0831) > 1e-12 || M.K0 !== 273) errs.push('ApBioMath must use R = 0.0831 L·bar/(mol·K) and T = °C + 273 (the formula sheet)');
  if (Math.abs(M.psiS(1, 0.3, 22) - -7.35435) > 1e-6) errs.push('ψs of 0.3 M sucrose at 22 °C must be −7.35 bar');
  return errs;
}
