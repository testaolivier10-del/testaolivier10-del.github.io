/* Validator for environmental-science/data/tools/air-pollution.json (Air pollution), run
   by scripts/check-apenv-content.mjs. OWNED BY THIS TOOL ONLY (builder T3).
   check(data, map) -> problems. The frame; the smog model's science (NO
   peaks first, with the morning rush; NO2 after it; ozone in the early
   afternoon, near zero at night; less sun or fewer cars, less ozone; an
   inversion, more), the inversion profile and the rain pH; then 300 problems
   per context and type regenerated with the model the page runs
   (ApEnvMath.airPollution) with every key recomputed independently (the
   curve order from the model's peaks, 10^(pH difference), percent change
   through ApEnvCalc, the fix and the acid-rain answer from the pollutant). */
import { frame, sweep, close } from './_drills.mjs';
import { runtime } from './_shared.mjs';

export const TYPES = ['smog', 'inversion', 'ph', 'reduce', 'pct'];
const step = (p, k) => p.steps.find(s => s.key === k);
const right = s => String(s.options[s.correct]).replace(/<[^>]+>/g, ' ');
const FIX = { NOx: /catalytic converter/i, SO2: /scrubber/i, PM: /precipitator/i, VOC: /vapor recovery/i, CO: /catalytic converter/i };

export function science(model) {
  const errs = [], bad = m => errs.push(`model: ${m}`);
  const d = model.smogDay({}), pk = d.peaks;
  if (!(pk.NO.hour >= 7 && pk.NO.hour <= 9.5)) bad(`NO should peak with the morning rush, got ${pk.NO.hour}`);
  if (!(pk.NO2.hour > pk.NO.hour && pk.NO2.hour <= 11)) bad(`NO2 should peak after NO, got ${pk.NO2.hour}`);
  if (!(pk.O3.hour >= 12 && pk.O3.hour <= 16)) bad(`O3 should peak in the early afternoon, got ${pk.O3.hour}`);
  if (!(d.at('O3', 3) < pk.O3.value * 0.6)) bad('ozone should be low before dawn');
  const cl = model.smogDay({ cloudy: true }), lo = model.smogDay({ cars: 0.5 }), inv = model.smogDay({ inversion: true });
  if (!(cl.peaks.O3.value < pk.O3.value * 0.7)) bad('clouds should cut ozone');
  if (!(lo.peaks.O3.value < pk.O3.value)) bad('fewer cars should cut ozone');
  if (!(inv.peaks.O3.value > pk.O3.value * 1.3 && inv.peaks.NO2.value > pk.NO2.value)) bad('an inversion should trap more pollution');
  const P = model.inversionProfile(true), N = model.inversionProfile(false);
  if (!(N.pts.every((p, i) => !i || p[1] < N.pts[i - 1][1]))) bad('normal air cools with height');
  if (!(P.pts.some((p, i) => i && p[1] > P.pts[i - 1][1]))) bad('an inversion has a warm layer above');
  if (Math.abs(model.rainPH(0) - 5.6) > 0.01) bad('clean rain pH 5.6');
  if (!(model.rainPH(1) < 4.5 && model.rainPH(0.5) < model.rainPH(0.25))) bad('acid rain pH falls with the load');
  return errs;
}

export function recheck(p, c, w, errs) {
  const { Calc, Expr, model } = runtime('air-pollution');
  const g = p.given, bad = m => errs.push(`${w}: ${m}`);
  if (!g) return bad('no givens on the problem');
  if (p.type === 'smog') {
    const d = model.smogDay({ cars: g.cars }), o3 = `Curve ${g.order.indexOf('O3') + 1}`;
    if (!right(step(p, 'o3')).startsWith(o3)) bad('ozone curve key');
    if (Math.abs(g.peaks.O3 - d.peaks.O3.hour) > 1e-9) bad('peak given');
    if (!/^NO,/.test(right(step(p, 'first')))) bad('first key');
    if (!/^Ozone/.test(right(step(p, 'secondary')))) bad('secondary key');
  } else if (p.type === 'inversion') {
    if (!/^A layer of warm air sitting on top of cooler/.test(right(step(p, 'what')))) bad('inversion definition key');
  } else if (p.type === 'ph') {
    const t = Calc.evaluate({ fn: 'pow', args: [10, g.b - g.a] });
    if (!close(step(p, 'times').cell.answer, t, 1e-9)) bad('times key');
    const r = Expr.evaluate(step(p, 'setup').cell.setup.answer, {}, []);
    if (!r.ok || !close(r.value, t, 1e-9)) bad('setup value');
    if (!/^Sulfur dioxide and nitrogen oxides/.test(right(step(p, 'cause')))) bad('cause key');
    if (!(g.a < 5.6)) bad('the acid rain must be below 5.6');
  } else if (p.type === 'reduce') {
    if (!FIX[g.id].test(right(step(p, 'fix')))) bad(`fix key for ${g.id}`);
    if (!/^Primary/.test(right(step(p, 'kind')))) bad('kind key');
    const acid = g.id === 'NOx' || g.id === 'SO2';
    if (!(acid ? /^Yes/ : /^No/).test(right(step(p, 'acid')))) bad('acid key');
  } else if (p.type === 'pct') {
    const pc = Calc.evaluate({ fn: 'percentChange', args: [g.from, g.to] });
    if (!close(step(p, 'pct').cell.numeric.answer, pc)) bad('percent key');
    const r = Expr.evaluate(step(p, 'setup').cell.setup.answer, {}, []);
    if (!r.ok || !close(r.value, pc)) bad('setup value');
  } else bad(`unknown type ${p.type}`);
}

export function check(data, map) {
  const errs = [];
  frame(data, 'air-pollution', 'simulator', map, errs);
  const { model } = runtime('air-pollution');
  if (!model || typeof model.generate !== 'function' || model.stub) { errs.push('environmental-science/assets/tools/math/air-pollution.js does not register ApEnvMath.airPollution with a generate()'); return errs; }
  errs.push(...science(model));
  for (const c of data.contexts || []) {
    if (!Array.isArray(c.types) || !c.types.length || c.types.some(t => !TYPES.includes(t))) errs.push(`context ${c.id}: types must be some of ${TYPES.join(', ')}`);
    if (c.types && c.types.includes('pct')) {
      if (!(c.series || []).length) errs.push(`context ${c.id}: pct needs a series`);
      for (const s of c.series || []) if (!(s.from > 0 && s.to >= 0) || !s.source || !s.what || !s.unit) errs.push(`context ${c.id}: a series needs what, unit, from, to and a source (a public source or "invented data for practice")`);
    }
    if (c.types && c.types.includes('inversion')) for (const x of c.cities || []) if (!x.name || !x.where) errs.push(`context ${c.id}: a city needs name and where`);
  }
  if (errs.length) return errs;
  sweep(data, errs, model.generate, (p, c, w) => recheck(p, c, w, errs), c => c.types);
  return errs;
}
