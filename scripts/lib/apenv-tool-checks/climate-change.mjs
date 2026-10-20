/* Validator for environmental-science/data/tools/climate-change.json (Climate change), run
   by scripts/check-apenv-content.mjs. OWNED BY THIS TOOL ONLY (builder T4).
   check(data, map) -> problems: the frame, then 300 problems per context and
   type regenerated with the model the page runs (ApEnvMath.climateChange),
   and every key recomputed independently from the problem's givens with
   ApEnvCalc (never through the model): percent change in CO2, H+ ratio
   10^(pH drop) and its percent, thermal expansion converted to cm, CO2
   equivalent from the IPCC GWP copied here. The science keys are checked by
   their content: greenhouse gases absorb infrared, ozone absorbs UV, the
   chlorine cycle, the Montreal Protocol, sea ice not raising sea level. */
import { frame, sweep, close } from './_drills.mjs';
import { runtime } from './_shared.mjs';

export const TYPES = ['gases', 'co2', 'ph', 'sealevel', 'gwp'];
const GWP = { CO2: 1, CH4: 28, N2O: 265, 'CFC-12': 10200 };            // IPCC AR5, 100-year
const NOAA = { 285: 1850, 317: 1960, 326: 1970, 339: 1980, 354: 1990, 370: 2000, 390: 2010, 401: 2015, 414: 2020, 425: 2024 };
const stepOf = (p, k) => p.steps.find(s => s.key === k);
const keyOf = s => s.kind === 'unit' ? s.cell.numeric.answer : s.cell.answer;
const rightText = s => s.options[s.correct];
// A right answer that says the wrong thing (the confusions this tool exists to stop).
const CONFUSED = [/greenhouse gases(: | absorb )ultraviolet/i, /ozone layer(: | absorbs )infrared/i, /sea ice[^.]*raises?/i, /ozone hole[^.]*causes? (global )?warming/i, /CO₂ destroys ozone/i, /Kyoto[^.]*CFC/i];

export function recheck(p, c, w, errs) {
  const { Calc, Expr } = runtime('climate-change');
  const g = p.given || {};
  const need = (cond, msg) => { if (!cond) errs.push(`${w}: ${msg}`); };
  const setupVal = s => { const r = Expr.evaluate(s.cell.setup.answer, {}, []); return r.ok ? r : null; };
  for (const s of p.steps) if (s.kind === 'choice') for (const re of CONFUSED) need(!re.test(rightText(s)), `step ${s.key}: the key repeats a confusion (${re})`);
  if (p.type === 'gases') {
    for (const k of ['g1', 'g2', 'g3']) need(stepOf(p, k) && stepOf(p, k).options.length === 4, `${k}: four options`);
    const all = p.steps.map(rightText).join(' | ');
    need(!/Kyoto/.test(all), 'a key names Kyoto for CFCs');
    const g1 = rightText(stepOf(p, 'g1')), g2 = rightText(stepOf(p, 'g2'));
    if (/absorb\?$/.test(stepOf(p, 'g1').label)) need(/Infrared/i.test(g1), 'greenhouse gases must absorb infrared');
    if (/absorb\?$/.test(stepOf(p, 'g2').label)) need(/Ultraviolet/i.test(g2), 'ozone must absorb ultraviolet');
    if (/policy/.test(stepOf(p, 'g2').label)) need(/Montreal/.test(g2), 'the ozone policy is the Montreal Protocol');
  } else if (p.type === 'co2') {
    need(NOAA[g.C0] != null && NOAA[g.C1] != null, 'CO2 values must be the NOAA table');
    const want = Calc.evaluate({ fn: 'percentChange', args: [g.C0, g.C1] });
    need(close(keyOf(stepOf(p, 'answer')), want), `answer key is not ${want}`);
    const r = setupVal(stepOf(p, 'setup')); need(r && close(r.value, want, 1e-9, 1e-9), 'the setup key does not give the answer');
    need(/fossil fuels/.test(rightText(stepOf(p, 'why'))), 'the cause key is not fossil fuels');
  } else if (p.type === 'ph') {
    const times = Calc.evaluate({ fn: 'pow', args: [10, Calc.evaluate({ fn: 'sub', args: [g.ph0, g.ph1] })] });
    need(close(keyOf(stepOf(p, 'times')), times), `times key is not ${times}`);
    const r = setupVal(stepOf(p, 'tset')); need(r && close(r.value, times, 1e-9, 1e-9), 'the setup key does not give the ratio');
    need(close(keyOf(stepOf(p, 'answer')), (times - 1) * 100, 1e-9, 1e-9), 'percent key is not (times - 1) × 100');
    need(g.ph1 > 7, 'the ocean stays basic (pH above 7)');
    need(/carbonate/.test(rightText(stepOf(p, 'shell'))), 'the shell key is not carbonate chemistry');
  } else if (p.type === 'sealevel') {
    const m = Calc.evaluate({ fn: 'mul', args: [0.00021, g.depth, g.dT] }), cm = Calc.evaluate({ fn: 'convert', args: [m, 'm', 'cm'] });
    need(close(keyOf(stepOf(p, 'cm')), cm), `cm key is not ${cm}`);
    const r = setupVal(stepOf(p, 'exp')); need(r && close(r.value, m, 1e-9, 1e-12), 'the setup key is not the rise in m');
    need(/sea ice/.test(rightText(stepOf(p, 'ice'))), 'the "does not raise sea level" key is not sea ice');
  } else if (p.type === 'gwp') {
    need(GWP[g.gas] != null, `unknown gas ${g.gas}`);
    const want = Calc.evaluate({ fn: 'mul', args: [g.q, GWP[g.gas]] });
    need(close(keyOf(stepOf(p, 'co2e')), want), `CO2e key is not ${want}`);
    const r = setupVal(stepOf(p, 'gset')); need(r && close(r.value, want, 1e-9, 1e-9), 'the setup key does not give the CO2e');
    need(rightText(stepOf(p, 'worst')) === 'CFC-12', 'the highest GWP is CFC-12');
  } else errs.push(`${w}: unknown type ${p.type}`);
}

export function check(data, map) {
  const errs = [];
  frame(data, 'climate-change', 'simulator', map, errs);
  const { model } = runtime('climate-change');
  if (!model) errs.push('no model registered (ApEnvMath.climateChange)');
  else if (!model.stub) {
    for (const c of data.contexts || []) for (const t of c.types || []) if (!TYPES.includes(t)) errs.push(`context ${c.id}: unknown type ${t}`);
    const ex = data.explore || {};
    if (!Array.isArray(ex.co2) || ex.co2[0] !== 280) errs.push('explore.co2 must start at the preindustrial 280 ppm');
    for (const [y, v] of ex.years || []) if (NOAA[v] !== y) errs.push(`explore.years: ${y} ${v} ppm is not the NOAA table`);
    for (const [k, v] of Object.entries(model.GWP)) if (GWP[k] !== v) errs.push(`model GWP ${k} is ${v}, IPCC ${GWP[k]}`);
    if (Math.abs(model.warming(560) - 3) > 1e-9) errs.push('a doubling of CO2 must give 3 °C (IPCC AR6 best estimate)');
    if (model.ozone(0) !== 300 || model.ozone(1) >= 220) errs.push('ozone runs from 300 DU to below the 220 DU hole line');
    // Every pooled right answer, and none of them repeats a confusion.
    for (const [k, items] of Object.entries(model.POOL)) for (const it of items) for (const re of CONFUSED) if (re.test(it[1])) errs.push(`pool ${k}: "${it[1]}" repeats a confusion`);
    sweep(data, errs, (r, c, t) => model.generate(r, c, t), (p, c, w) => recheck(p, c, w, errs), c => c.types || TYPES);
  }
  return errs;
}
