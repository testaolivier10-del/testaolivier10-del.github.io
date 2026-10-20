/* Validator for environmental-science/data/tools/air-pollution.json (Air pollution), run
   by scripts/check-apenv-content.mjs. OWNED BY THIS TOOL ONLY (builder T3).
   check(data, map) -> problems. The frame now; Phase 2 adds: 300 problems
   per context and type regenerated with the model the page runs
   (ApEnvMath.airPollution) and every key recomputed independently from the
   problem's givens with ApEnvCalc (never through the model). */
import { frame, sweep } from './_drills.mjs';
import { runtime } from './_shared.mjs';

export const TYPES = [];

export function recheck(p, c, w, errs) {
  void p; void c; void w; void errs;
}

export function check(data, map) {
  const errs = [];
  frame(data, 'air-pollution', 'simulator', map, errs);
  const { model } = runtime('air-pollution');
  if (!model) errs.push('no model registered (ApEnvMath.airPollution)');
  else if (!model.stub) sweep(data, errs, (r, c, t) => model.generate(r, c, t), (p, c, w) => recheck(p, c, w, errs), c => c.types || (TYPES.length ? TYPES : [undefined]));
  return errs;
}
