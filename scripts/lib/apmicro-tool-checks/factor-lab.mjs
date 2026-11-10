/* Validator for microeconomics/data/tools/factor-lab.json (Factor Market Lab), run by
   scripts/check-apmicro-content.mjs. OWNED BY THIS TOOL ONLY (builder T4).
   check(data, map) -> problems. Phase 0: the shared frame only; the builder
   adds the drill sweep (_drills.mjs: 300 problems per context and type,
   every key recomputed independently in recheck). */
import { frame } from './_drills.mjs';

export const TYPES = [];
export function check(data, map) {
  const errs = [];
  frame(data, 'factor-lab', 'simulator', map, errs);
  return errs;
}
export function recheck() { return []; }
