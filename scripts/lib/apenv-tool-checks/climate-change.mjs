/* Validator for environmental-science/data/tools/climate-change.json (Climate change), run
   by scripts/check-apenv-content.mjs. OWNED BY THIS TOOL ONLY (builder T4).
   check(data, map) -> problems. The frame now; Phase 2 adds: 300 problems
   per context and type regenerated with the model the page runs
   (ApEnvMath.climateChange) and every key recomputed independently from the
   problem's givens with ApEnvCalc (never through the model). */
import { frame, sweep } from './_drills.mjs';
import { runtime } from './_shared.mjs';

export const TYPES = [];

export function recheck(p, c, w, errs) {
  void p; void c; void w; void errs;
}

export function check(data, map) {
  const errs = [];
  frame(data, 'climate-change', 'simulator', map, errs);
  const { model } = runtime('climate-change');
  if (!model) errs.push('no model registered (ApEnvMath.climateChange)');
  else if (!model.stub) sweep(data, errs, (r, c, t) => model.generate(r, c, t), (p, c, w) => recheck(p, c, w, errs), c => c.types || (TYPES.length ? TYPES : [undefined]));
  return errs;
}
