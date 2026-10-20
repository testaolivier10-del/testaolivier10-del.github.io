/* Validator for environmental-science/data/tools/water-pollution.json (Water pollution), run
   by scripts/check-apenv-content.mjs. OWNED BY THIS TOOL ONLY (builder T4).
   check(data, map) -> problems: the frame, then 300 problems per context and
   type regenerated with the model the page runs (ApEnvMath.waterPollution),
   and every key recomputed independently from the problem's givens with
   ApEnvCalc (never through the model): percent changes, the stage-by-stage
   BOD, the nitrate load by unit conversion (mg to kg), the oxygen
   saturation against the USGS table copied here, and the graph's lowest
   point and the hypoxic answer read off the plotted series. */
import { frame, sweep, close } from './_drills.mjs';
import { runtime } from './_shared.mjs';

export const TYPES = ['chain', 'dochange', 'thermal', 'sewage', 'load'];
// USGS dissolved oxygen solubility in fresh water at 760 mm Hg, mg/L, rounded to 0.1.
const USGS = { 0: 14.6, 5: 12.8, 10: 11.3, 15: 10.1, 20: 9.1, 25: 8.3, 30: 7.6, 35: 7.0 };

const stepOf = (p, k) => p.steps.find(s => s.key === k);
const keyOf = s => s.kind === 'unit' ? s.cell.numeric.answer : s.kind === 'setup' ? null : s.cell.answer;
const rightText = s => s.options[s.correct];

export function recheck(p, c, w, errs) {
  const { Calc, Expr, M } = runtime('water-pollution');
  const g = p.given || {};
  const need = (cond, msg) => { if (!cond) errs.push(`${w}: ${msg}`); };
  const setupVal = s => { const r = Expr.evaluate(s.cell.setup.answer, {}, []); return r.ok ? r.value : NaN; };
  if (p.type === 'chain') {
    const mins = Calc.evaluate({ fn: 'min', args: g.series.map(q => q[1]) });
    need(close(keyOf(stepOf(p, 'lowest')), mins, 1e-9, 1e-9), `lowest key ${keyOf(stepOf(p, 'lowest'))} is not the plotted minimum ${mins}`);
    const dead = stepOf(p, 'dead'), says = /^Yes/.test(rightText(dead));
    need(says === (mins < 2), `dead-zone key says ${says ? 'yes' : 'no'} for a minimum of ${mins} mg/L`);
    need(g.series.length === 61 && g.series.every(q => q[1] >= 0 && q[1] <= 15), 'the series is not 61 daily values in 0 to 15 mg/L');
    // The model's oxygen and saturation agree with the table at this temperature.
    const run = runtime('water-pollution').model.lake(g.level, g.T);
    need(g.series.every((q, i) => close(q[1], M.round(run.O[i], 1), 0, 1e-9)), 'the plotted series is not the lake model');
    need(rightText(stepOf(p, 'bloom')).startsWith('The algae multiply'), 'the first link is not the bloom');
  } else if (p.type === 'dochange') {
    const want = Calc.evaluate({ fn: 'percentChange', args: [g.before, g.after] });
    need(close(keyOf(stepOf(p, 'answer')), want), `answer key ${keyOf(stepOf(p, 'answer'))} is not ${want}`);
    need(close(setupVal(stepOf(p, 'setup')), want, 1e-9, 1e-9), 'the setup key does not evaluate to the answer');
    need(want < 0, 'dissolved oxygen should fall');
    need(/below 2 mg\/L/.test(rightText(stepOf(p, 'hyp'))) === (g.after < 2), 'hypoxic key disagrees with the reading');
  } else if (p.type === 'thermal') {
    for (const [t, v] of g.table) need(USGS[t] === v, `table at ${t} °C is ${v}, USGS ${USGS[t]}`);
    const d0 = USGS[g.t0], d1 = USGS[g.t1];
    need(d0 != null && d1 != null, 'temperatures must be table rows');
    need(close(keyOf(stepOf(p, 'read')), d0, 1e-9, 1e-9), `read key is not ${d0}`);
    const want = Calc.evaluate({ fn: 'percentChange', args: [d0, d1] });
    need(close(keyOf(stepOf(p, 'answer')), want), `answer key is not ${want}`);
    need(close(setupVal(stepOf(p, 'setup')), want, 1e-9, 1e-9), 'the setup key does not evaluate to the answer');
    need(/dissolve less in warmer/.test(rightText(stepOf(p, 'why'))), 'the why key is not solubility');
  } else if (p.type === 'sewage') {
    const a1 = Calc.evaluate({ fn: 'sub', args: [g.bod, { fn: 'percentOf', args: [g.p1, g.bod] }] });
    const a2 = Calc.evaluate({ fn: 'sub', args: [a1, { fn: 'percentOf', args: [g.p2, a1] }] });
    need(close(keyOf(stepOf(p, 'after1')), a1), `after1 key is not ${a1}`);
    need(close(keyOf(stepOf(p, 'after2a')), a2), `after2 key is not ${a2}`);
    need(close(setupVal(stepOf(p, 'after2')), a2, 1e-9, 1e-9), 'the setup key does not evaluate to the answer');
    const want = { nutrients: 'Tertiary treatment', pathogens: 'Disinfection with chlorine, ozone or UV light', organic: 'Secondary treatment', solids: 'Primary treatment' }[g.stage];
    need(rightText(stepOf(p, 'stage')) === want, `stage key is not ${want}`);
  } else if (p.type === 'load') {
    const kg = Calc.evaluate({ fn: 'convert', args: [Calc.evaluate({ fn: 'mul', args: [g.conc, g.flow] }), 'mg', 'kg'] });
    need(close(keyOf(stepOf(p, 'load')), kg), `load key is not ${kg}`);
    const s = stepOf(p, 'loadset'), r = Expr.evaluate(s.cell.setup.answer, {}, []);
    need(r.ok && close(r.value, kg, 1e-9, 1e-9) && Expr.dimText(r.dims) === 'kg/day', 'the setup key is not the load in kg/day');
    const left = Calc.evaluate({ fn: 'percentOf', args: [100 - g.cut, kg] });
    need(close(keyOf(stepOf(p, 'reduce')), left), `reduce key is not ${left}`);
  } else errs.push(`${w}: unknown type ${p.type}`);
}

export function check(data, map) {
  const errs = [];
  frame(data, 'water-pollution', 'simulator', map, errs);
  const { model } = runtime('water-pollution');
  if (!model) errs.push('no model registered (ApEnvMath.waterPollution)');
  else if (!model.stub) {
    for (const c of data.contexts || []) for (const t of c.types || []) if (!TYPES.includes(t)) errs.push(`context ${c.id}: unknown type ${t}`);
    if (!data.explore || !Array.isArray(data.explore.temps) || !data.explore.temps.every(t => t in USGS)) errs.push('explore.temps must be USGS table temperatures');
    for (const [t, v] of model.OSAT) if (USGS[t] !== v) errs.push(`model OSAT at ${t} °C is ${v}, USGS ${USGS[t]}`);
    sweep(data, errs, (r, c, t) => model.generate(r, c, t), (p, c, w) => recheck(p, c, w, errs), c => c.types || TYPES);
  }
  return errs;
}
