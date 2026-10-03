/* Validator for bio/data/tools/simpson-diversity.json. Simpson’s diversity index D = 1 − Σ(n/N)² (built now, published with Unit 8).
   The shared skills checks (_shared.mjs skills()): topics, 300 seeded
   problems per context solve soundly, fixed problems match "expect". */
import { skills } from './_shared.mjs';

export function check(data, map) {
  const errs = [];
  const { M, P } = skills(data, 'simpson-diversity', 'simpson', map, errs);
  if (Math.abs(M.simpson([10, 10]).D - 0.5) > 1e-12) errs.push('ApBioMath.simpson: two equal species must give D = 0.5');
  for (const c of data.contexts || []) if (c.species.length < c.k[1]) errs.push(`context ${c.id}: fewer species names than k allows`);
  return errs;
}
