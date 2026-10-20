/* Validator for environmental-science/data/tools/water-pollution.json (Water pollution), run
   by scripts/check-apenv-content.mjs. OWNED BY THIS TOOL ONLY (builder T4).
   check(data, map) -> problems. The frame now; Phase 2 adds: 300 problems
   per context and type regenerated with the model the page runs
   (ApEnvMath.waterPollution) and every key recomputed independently from the
   problem's givens with ApEnvCalc (never through the model). */
import { frame, sweep } from './_drills.mjs';
import { runtime } from './_shared.mjs';

export const TYPES = [];

export function recheck(p, c, w, errs) {
  void p; void c; void w; void errs;
}

export function check(data, map) {
  const errs = [];
  frame(data, 'water-pollution', 'simulator', map, errs);
  const { model } = runtime('water-pollution');
  if (!model) errs.push('no model registered (ApEnvMath.waterPollution)');
  else if (!model.stub) sweep(data, errs, (r, c, t) => model.generate(r, c, t), (p, c, w) => recheck(p, c, w, errs), c => c.types || (TYPES.length ? TYPES : [undefined]));
  return errs;
}
