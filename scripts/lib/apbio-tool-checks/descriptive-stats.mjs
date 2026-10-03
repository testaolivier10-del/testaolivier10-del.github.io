/* Validator for bio/data/tools/descriptive-stats.json. Descriptive statistics: mean, median, range, sample SD (n − 1) and SE.
   The shared skills checks (_shared.mjs skills()): topics, 300 seeded
   problems per context solve soundly, fixed problems match "expect". */
import { skills } from './_shared.mjs';

export function check(data, map) {
  const errs = [];
  const { M, P } = skills(data, 'descriptive-stats', 'descriptive', map, errs);
  for (const c of data.contexts || []) if (!(c.n && c.n[0] >= 3)) errs.push(`context ${c.id}: n must be at least 3 (an SD needs n − 1 ≥ 2)`);
  for (const p of data.problems || []) {
    const v = p.input.values || [];
    if (v.length < 3) errs.push(`problem ${p.id}: at least three values`);
    // the sample SD, independently: Σ(x − x̄)² / (n − 1)
    const m = v.reduce((a, b) => a + b, 0) / v.length, s = Math.sqrt(v.reduce((a, x) => a + (x - m) ** 2, 0) / (v.length - 1));
    if (Math.abs(s - M.sd(v)) > 1e-9) errs.push(`problem ${p.id}: ApBioMath.sd is not the n − 1 sample SD`);
  }
  return errs;
}
