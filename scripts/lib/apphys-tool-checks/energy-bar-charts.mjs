/* Validator for physics/data/tools/energy-bar-charts.json (Energy bar charts), run by
   scripts/check-apphys-content.mjs. OWNED BY THIS TOOL ONLY.
   check(data, map) -> problems. It recomputes every number through the same
   model the page runs (runtime('energy-bar-charts').model, ApPhysMath.energyBarCharts).
   Phase 0: the frame only (slug, kind, topic, intro, contexts). Phase 2 adds
   sweep(data, errs, gen, recheck) from _drills.mjs with an independent
   recheck of every answer. */
import { frame } from './_drills.mjs';
import { runtime } from './_shared.mjs';

export function check(data, map) {
  const errs = [];
  frame(data, 'energy-bar-charts', 'simulator', map, errs);
  const { model } = runtime('energy-bar-charts');
  if (!model || typeof model.generate !== 'function') errs.push('physics/assets/tools/math/energy-bar-charts.js does not register ApPhysMath.energyBarCharts with a generate()');
  return errs;
}
