/* Validator for environmental-science/data/tools/energy-chain.json (Energy chain), run
   by scripts/check-apenv-content.mjs. OWNED BY THIS TOOL ONLY (builder T3).
   check(data, map) -> problems. The frame, the model's source table (each
   fossil and nuclear plant's stages multiply to within 0.5 percentage
   points of 3,412 / heat rate, the EIA figure), then 300 problems per context
   and type regenerated with the model the page runs (ApEnvMath.energyChain)
   and every key recomputed independently from the problem's givens with
   ApEnvCalc (chainEfficiency, inputNeeded, emissions, convert, efficiency) and
   every setup evaluated to its key with its units cancelling. */
import { frame, sweep, close } from './_drills.mjs';
import { runtime } from './_shared.mjs';

export const TYPES = ['chain', 'fuel', 'co2', 'power', 'heatrate'];
const step = (p, k) => p.steps.find(s => s.key === k);
const uk = s => s.cell.numeric.answer;
const right = s => String(s.options[s.correct]).replace(/<[^>]+>/g, ' ');

export function recheck(p, c, w, errs) {
  const { Calc, M, Expr } = runtime();
  const g = p.given, bad = m => errs.push(`${w}: ${m}`);
  if (!g) return bad('no givens on the problem');
  const sv = k => { const s = step(p, k), r = Expr.evaluate(s.cell.setup.answer, s.cell.setup.bind || {}, []); return r.ok ? r : { value: NaN }; };
  const E = (fn, args) => Calc.evaluate({ fn, args });
  if (p.type === 'chain') {
    const tot = E('chainEfficiency', g.effs);
    if (!close(uk(step(p, 'total')), tot)) bad('total key');
    if (!close(sv('setup').value, tot)) bad('setup value');
    if (!close(uk(step(p, 'delivered')), E('percentOf', [tot, g.E0]))) bad('delivered key');
    if (!(tot < Math.min(...g.effs) * 100)) bad('the chain must be below its weakest step');
    if (!/turbine/i.test(right(step(p, 'where')))) bad('the biggest loss is the turbine');
  } else if (p.type === 'fuel') {
    const fuel = E('inputNeeded', [g.kwh, g.eff]);
    if (!close(uk(step(p, 'fuel')), fuel)) bad('fuel key');
    const s1 = sv('setup'); if (!close(s1.value, fuel) || JSON.stringify(s1.dims) !== '{"kWh":1}') bad('setup must give kWh');
    const btu = E('mul', [M.sig(fuel, 6), 3412]);
    if (!close(uk(step(p, 'btu')), btu)) bad('BTU key');
    if (!close(btu, Calc.convert(fuel, 'kWh', 'BTU'), 2e-4)) bad('BTU key far from the exact conversion');
    const s2 = sv('setup2'); if (!close(s2.value, btu) || JSON.stringify(s2.dims) !== '{"BTU":1}') bad('setup2 must give BTU');
  } else if (p.type === 'co2') {
    const lb = E('emissions', [g.kwh, g.f]);
    if (!close(uk(step(p, 'lb')), lb)) bad('lb key');
    if (!close(uk(step(p, 'tons')), Calc.convert(lb, 'lb', 'ton'))) bad('ton key');
    const s1 = sv('setup'); if (!close(s1.value, lb) || JSON.stringify(s1.dims) !== '{"lb":1}') bad('setup must give lb');
    if (g.source === 'coal' && !/more than half/.test(right(step(p, 'switch')))) bad('coal to gas key');
    if (g.source === 'gas' && !/double/.test(right(step(p, 'switch')))) bad('gas to coal key');
  } else if (p.type === 'power') {
    const kwh = Calc.convert(g.w * g.h * g.days, 'Wh', 'kWh');
    if (!close(uk(step(p, 'kwh')), kwh)) bad('kWh key');
    if (!close(uk(step(p, 'cost')), E('cost', [kwh, g.price]))) bad('cost key');
    { const cents = Math.round(E('cost', [kwh, g.price]) * 100) / 100; if (!M.diagnoseUnit(step(p, 'cost').cell, { value: String(cents), unit: '$' }).ok) bad(`the cost rounded to the cent ($${cents}) grades wrong`); }
    const s1 = sv('setup'); if (!close(s1.value, kwh) || JSON.stringify(s1.dims) !== '{"h":1,"kW":1}') bad(`setup must give kWh, got ${JSON.stringify(s1.dims)}`);
  } else if (p.type === 'heatrate') {
    const eff = E('efficiency', [3412, g.hr]);
    if (!close(uk(step(p, 'eff')), eff)) bad('efficiency key');
    if (!close(sv('setup').value, eff)) bad('setup value');
    if (!/^Is more efficient/.test(right(step(p, 'lower')))) bad('lower heat rate key');
  } else bad(`unknown type ${p.type}`);
}

export function check(data, map) {
  const errs = [];
  frame(data, 'energy-chain', 'simulator', map, errs);
  const { model } = runtime('energy-chain');
  if (!model || typeof model.generate !== 'function' || model.stub) { errs.push('environmental-science/assets/tools/math/energy-chain.js does not register ApEnvMath.energyChain with a generate()'); return errs; }
  for (const id of model.ORDER) {
    const S = model.SOURCES[id], c = model.chain(id, 100);
    if (S.heatRate && Math.abs(c.plant - 3412 / S.heatRate * 100) > 0.5) errs.push(`source ${id}: its stages give ${c.plant.toFixed(2)}%, the EIA heat rate ${(3412 / S.heatRate * 100).toFixed(2)}%`);
    if (!(c.total > 0 && c.total < 100) || Math.abs(c.delivered - c.total) > 1e-6) errs.push(`source ${id}: chain totals`);
    if (Math.abs(c.stages.reduce((a, s) => a + s.waste, 0) + c.delivered - 100) > 1e-6) errs.push(`source ${id}: energy is not conserved in the chain`);
  }
  for (const c of data.contexts || []) if (!Array.isArray(c.types) || !c.types.length || c.types.some(t => !TYPES.includes(t))) errs.push(`context ${c.id}: types must be some of ${TYPES.join(', ')}`);
  if (errs.length) return errs;
  sweep(data, errs, model.generate, (p, c, w) => recheck(p, c, w, errs), c => c.types);
  return errs;
}
