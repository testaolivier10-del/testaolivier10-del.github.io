/* Validator for bio/data/tools/confidence-intervals.json. 95% confidence intervals (mean ± 2 SE) and error bars.
   The shared skills checks (_shared.mjs skills()): topics, 300 seeded
   problems per context solve soundly, fixed problems match "expect". */
import { skills } from './_shared.mjs';

export function check(data, map) {
  const errs = [];
  const { M, P } = skills(data, 'confidence-intervals', 'ci', map, errs);
  for (const p of data.problems || []) if (P.ciBorderline(p.input)) errs.push(`problem ${p.id}: the two intervals nearly touch; the overlap rule of thumb cannot decide it`);
  for (const c of data.contexts || []) if ((c.groups || []).length !== 2) errs.push(`context ${c.id}: two groups`);
  return errs;
}
