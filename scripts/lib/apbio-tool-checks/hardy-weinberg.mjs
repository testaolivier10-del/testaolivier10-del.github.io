/* Validator for bio/data/tools/hardy-weinberg.json. Hardy-Weinberg (built now, published with Unit 7).
   The shared skills checks (_shared.mjs skills()): topics, 300 seeded
   problems per context solve soundly, fixed problems match "expect". */
import { skills } from './_shared.mjs';

export function check(data, map) {
  const errs = [];
  const { M, P } = skills(data, 'hardy-weinberg', 'hw', map, errs);
  const h = M.hwCounts(36, 48, 16);
  if (Math.abs(h.p - 0.6) > 1e-12 || Math.abs(h.pq2 - 0.48) > 1e-12) errs.push('ApBioMath.hwCounts is wrong for 36 AA, 48 Aa, 16 aa (p must be 0.6, 2pq 0.48)');
  return errs;
}
