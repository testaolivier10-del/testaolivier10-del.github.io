/* Validator for bio/data/tools/enzyme-activity.json (simulator). Checks the
   data's shape, every stimulus question and the mini FRQ, then the science
   through the model itself (ApBioMath.enzyme): each enzyme's stated best
   temperature and pH, competitive inhibition raising Km with Vmax unchanged,
   noncompetitive lowering Vmax with Km unchanged, saturation, and every
   number in the stimulus tables recomputed from the model. */
import { runtime, base, question, frq } from './_shared.mjs';

const fmt = v => v.toFixed(1);
export function check(data, map) {
  const errs = [];
  const { M } = runtime();
  base(data, 'enzyme-activity', map, errs, 'simulator');
  const E = M.enzyme;
  const ids = new Set();
  for (const p of data.profiles || []) {
    for (const k of ['Km', 'Vmax', 'Ea', 'Tm', 'w', 'pKa1', 'pKa2', 'Ki']) if (!(typeof p[k] === 'number')) errs.push(`profile ${p.id}: ${k} must be a number`);
    if (Math.abs(E.optimumT(p) - p.optT) > 1.5) errs.push(`profile ${p.id}: stated best temperature ${p.optT} °C, the model's is ${E.optimumT(p).toFixed(1)} °C`);
    if (Math.abs(E.optimumPH(p) - p.optPH) > 0.2) errs.push(`profile ${p.id}: stated best pH ${p.optPH}, the model's is ${E.optimumPH(p).toFixed(2)}`);
    const c = { T: p.defaults.T, pH: p.defaults.pH, inhibitor: 'none' };
    const k0 = E.params(p, c), kc = E.params(p, { ...c, inhibitor: 'competitive', I: 2 }), kn = E.params(p, { ...c, inhibitor: 'noncompetitive', I: 2 });
    if (!(kc.km > k0.km) || Math.abs(kc.vmax - k0.vmax) > 1e-9) errs.push(`profile ${p.id}: a competitive inhibitor must raise Km and leave Vmax unchanged`);
    if (!(kn.vmax < k0.vmax) || Math.abs(kn.km - k0.km) > 1e-9) errs.push(`profile ${p.id}: a noncompetitive inhibitor must lower Vmax and leave Km unchanged`);
    const half = E.rate(p, c, k0.km), sat = E.rate(p, c, 1000 * p.Km);
    if (Math.abs(half - k0.vmax / 2) > 1e-6 || Math.abs(sat / k0.vmax - 1) > 0.002) errs.push(`profile ${p.id}: rate must be Vmax/2 at Km and approach Vmax at saturating substrate`);
    // competitive inhibition is overcome by substrate; noncompetitive is not
    const big = 1000 * p.Km;
    if (E.rate(p, { ...c, inhibitor: 'competitive', I: 2 }, big) / sat < 0.99) errs.push(`profile ${p.id}: saturating substrate must overcome a competitive inhibitor`);
    if (Math.abs(E.rate(p, { ...c, inhibitor: 'noncompetitive', I: 2 }, big) / sat - 1 / (1 + 2 / p.Ki)) > 0.003) errs.push(`profile ${p.id}: a noncompetitive inhibitor must cap the rate at Vmax/(1 + [I]/Ki)`);
    // cold slows, heat denatures
    if (!(E.tempFactor(p, p.optT - 20) < 0.6 && E.tempFactor(p, p.Tm + 15) < 0.05)) errs.push(`profile ${p.id}: activity must fall well below the optimum when cold and collapse above the unfolding temperature`);
  }
  if (!(data.profiles || []).length) errs.push('no enzyme profiles');
  // the stimulus tables, recomputed from the model
  for (const [sid, s] of Object.entries(data.stimuli || {})) for (const t of s.tables || []) {
    const ck = t.check; if (!ck) { errs.push(`${sid}: every table needs a "check" spec`); continue; }
    const p = (data.profiles || []).find(x => x.id === ck.profile);
    if (!p) { errs.push(`${sid}: unknown profile ${ck.profile}`); continue; }
    for (const row of t.rows) ck.series.forEach((inh, j) => {
      const x = Number(row[0]);
      const c = { S: ck.S, T: ck.T, pH: ck.pH, inhibitor: inh, I: ck.I || 0 };
      c[ck.x] = x;
      const want = fmt(E.rate(p, c, c.S));
      if (row[j + 1] !== want) errs.push(`${sid} "${t.caption}": at ${ck.x} = ${row[0]}, ${inh}: table says ${row[j + 1]}, the model gives ${want}`);
    });
  }
  for (const q of data.questions || []) question(q, 'enzyme-activity', map, data.stimuli, errs, ids);
  const n = (data.questions || []).length;
  if (n < 3 || n > 5) errs.push(`a simulator has 3-5 stimulus questions (${n})`);
  // the percent-decrease item: 2 mM of a noncompetitive inhibitor with Ki 1 mM removes 2/3 of the activity
  const pd = (data.questions || []).find(q => q.id === 'enzyme-activity:inhibitors:5');
  if (pd && Math.abs(pd.numeric.answer - 100 * (1 - 1 / 3)) > pd.numeric.tol) errs.push('enzyme-activity:inhibitors:5: the percent decrease must be 66.7');
  // Explore (tools v2, docs/tools-v2-enzyme-activity-brief.md): four tabs on one enzyme, each showing its idea by the model
  const ex = data.explore, xp = ex && (data.profiles || []).find(p => p.id === ex.profile);
  if (!ex || !xp) errs.push('explore: a block with a known profile is required');
  else {
    const ids = (ex.tabs || []).map(t => t.id).join(',');
    if (ids !== 'sub,temp,ph,inh') errs.push(`explore: tabs must be sub, temp, ph, inh (${ids})`);
    for (const t of ex.tabs || []) if (!t.tab || !t.control || !t.purpose || !t.role || t.lo == null || t.hi == null) errs.push(`explore tab ${t.id}: tab, control, purpose, role, lo and hi are required`);
    for (const k of ['substrate', 'temperature', 'pH', 'inhibitor', 'inhSubstrate']) { const r = ex[k]; if (!(r && r.max > r.min && r.step > 0 && r.value >= r.min && r.value <= r.max)) errs.push(`explore: ${k} {min, max, step, value} is required`); }
    const f = ex.fixed || {}, c = { S: f.S, T: f.T, pH: f.pH, inhibitor: 'none', I: 0 }, R = (o, S) => E.rate(xp, { ...c, ...o }, S == null ? ({ ...c, ...o }).S : S);
    if (!(f.S > 0 && E.tempFactor(xp, f.T) > 0.6 && E.phFactor(xp, f.pH) > 0.9)) errs.push('explore: the fixed conditions must let the enzyme work well');
    else {
      const vm = E.params(xp, c).vmax;
      if (!(R({}, 0) === 0 && R({}, ex.substrate.max) / vm > 0.85 && Math.abs(R({}, ex.substrate.value) / vm - 0.5) < 0.15)) errs.push('explore: the substrate tab must run from no reaction to near saturation and open near half the top rate');
      const ot = E.optimumT(xp), top = R({ T: ot });
      if (!(ot > ex.temperature.min + 10 && ot < ex.temperature.max - 10 && R({ T: ex.temperature.min }) / top < 0.25 && R({ T: ex.temperature.max }) / top < 0.02)) errs.push('explore: the temperature tab must be slow when cold and stopped (denatured) at its hot end');
      const op = E.optimumPH(xp), topP = R({ pH: op });
      if (!(Math.abs(ex.pH.value - op) < 0.3 && R({ pH: ex.pH.min }) / topP < 0.02 && R({ pH: ex.pH.max }) / topP < 0.02)) errs.push('explore: the pH tab must open at the best pH and stop at both ends');
      const s0 = ex.inhSubstrate.value, sm = ex.inhSubstrate.max, im = ex.inhibitor.max;
      if (ex.inhibitor.value !== 0) errs.push('explore: the inhibitor tab opens with no inhibitor');
      for (const kind of ['competitive', 'noncompetitive']) if (!(R({ inhibitor: kind, I: im, S: s0 }) < 0.6 * R({ S: s0 }))) errs.push(`explore: the most ${kind} inhibitor must slow the rate plainly`);
      const I2 = 2, rc = R({ inhibitor: 'competitive', I: I2, S: sm }) / R({ S: sm }), rn = R({ inhibitor: 'noncompetitive', I: I2, S: sm }) / R({ S: sm });
      if (!(rc >= 0.8 && rn < 0.5)) errs.push(`explore: at the most substrate a competitive inhibitor (2 mM) must be mostly overcome and a noncompetitive one not (${rc.toFixed(2)}, ${rn.toFixed(2)})`);
    }
  }
  if (!data.frq) errs.push('a simulator ends with a mini FRQ'); else frq(data.frq, 'enzyme-activity', map, errs);
  return errs;
}
