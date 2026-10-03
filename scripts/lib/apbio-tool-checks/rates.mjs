/* Validator for bio/data/tools/rates.json. Rates of change and percent change.
   The shared skills checks (_shared.mjs skills()): topics, 300 seeded
   problems per context solve soundly, fixed problems match "expect". */
import { skills } from './_shared.mjs';

export function check(data, map) {
  const errs = [];
  const { M, P } = skills(data, 'rates', 'rates', map, errs);
  for (const c of data.contexts || []) if (c.mode === 'pct' && !(c.gainItems?.length && c.lossItems?.length)) errs.push(`context ${c.id}: gainItems and lossItems are required`);
  return errs;
}
