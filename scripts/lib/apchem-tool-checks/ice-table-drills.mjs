/* Validator for chem/data/tools/ice-table-drills.json. For every context and
   type, 300 seeded problems from ApChemMath.ice.generate are checked
   (_drills.mjs) and recomputed here without the generator: the E row is
   I + coefficient × x, K is the expression evaluated on the E row, the
   small-x answer solves the simplified equation, the 5% check is the
   largest reactant change over its start, and an exact x puts Q at K. */
import { runtime } from './_shared.mjs';
import { frame, sweep, close } from './_drills.mjs';

const TYPES = ['findK', 'smallx', 'square'];
const Qof = (sp, c) => sp.reduce((q, s, i) => (s.phase === 's' || s.phase === 'l' ? q : q * c[i] ** s.nu), 1);

export function check(data, map) {
  const errs = [];
  const { M } = runtime();
  frame(data, 'ice-table-drills', 'drill', map, errs);
  for (const c of data.contexts || []) {
    if (!['Kc', 'Kp'].includes(c.K)) errs.push(`context ${c.id}: K must be Kc or Kp`);
    if (!Array.isArray(c.types) || !c.types.length || c.types.some(t => !TYPES.includes(t))) errs.push(`context ${c.id}: types must come from ${TYPES.join(', ')}`);
    if ((c.types || []).includes('smallx') && !c.Ksmall) errs.push(`context ${c.id}: smallx needs Ksmall`);
    if ((c.types || []).includes('square') && (!c.Ksq || c.species.filter(s => s.nu < 0).length !== 2)) errs.push(`context ${c.id}: square needs Ksq and two reactants`);
    if (c.Kfail && c.species.reduce((n, s) => n + (s.nu > 0 ? s.nu : 0), 0) !== 2) errs.push(`context ${c.id}: Kfail needs products whose powers add to 2 (a quadratic)`);
  }
  const seenTypes = new Set();
  sweep(data, errs, (r, c, t) => M.ice.generate(r, c, t), (p, c, w) => {
    seenTypes.add(p.type);
    const sp = c.species, E = sp.map((s, i) => p.c0[i] + s.nu * p.x);
    E.forEach((e, i) => { if (!close(p.E[i], e)) errs.push(`${w}: E row for ${s(sp, i)} is ${p.E[i]}, I + C gives ${e}`); if (!(e > 0)) errs.push(`${w}: ${s(sp, i)} is not positive at equilibrium`); });
    const step = k => p.steps.find(x => x.key === k);
    step('I').cells.forEach((cl, i) => { if (!close(cl.answer, p.c0[i], 1e-9, 1e-12)) errs.push(`${w}: I cell ${i} is not the initial amount`); });
    step('C').cells.forEach((cl, i) => { if (cl.answer !== sp[i].nu) errs.push(`${w}: C cell ${i} is not the coefficient ${sp[i].nu}`); });
    step('E').cells.forEach((cl, i) => { if (!close(cl.answer, E[i])) errs.push(`${w}: E cell ${i} disagrees`); });
    const Kat = Qof(sp, E);
    if (p.type === 'findK') {
      if (!close(step('K').cell.answer, Kat)) errs.push(`${w}: K is ${step('K').cell.answer}, the E row gives ${Kat}`);
    } else if (p.type === 'smallx') {
      // The simplified equation: products from coefficient × x, reactants at their start.
      const lhs = sp.reduce((q, s, i) => (s.nu > 0 ? q * (s.nu * p.xApprox) ** s.nu : q / p.c0[i] ** -s.nu), 1);
      if (!close(lhs, p.K, 1e-6)) errs.push(`${w}: the small-x value does not solve the simplified equation`);
      const pct = Math.max(...sp.map((x, i) => (x.nu < 0 ? (100 * -x.nu * p.xApprox) / p.c0[i] : 0)));
      if (!close(step('pct').cell.answer, pct)) errs.push(`${w}: the 5% check is ${step('pct').cell.answer}, recomputed ${pct}`);
      if (step('okay').correct !== (pct <= 5 ? 0 : 1)) errs.push(`${w}: the verdict on the 5% check is wrong`);
      if (pct <= 5) { if (!close(p.x, p.xApprox)) errs.push(`${w}: the approximation holds but x is not the small-x value`); }
      else if (!close(Kat, p.K, 1e-6)) errs.push(`${w}: the exact x does not give Q = K (${Kat} vs ${p.K})`);
      if (pct <= 5 && Math.abs(p.xApprox - p.xExact) / p.xExact > 0.05) errs.push(`${w}: the small-x value is more than 5% from the exact one`);
    } else if (!close(Kat, p.K, 1e-6)) errs.push(`${w}: the perfect-square x does not give Q = K`);
  }, c => c.types);
  for (const t of new Set((data.contexts || []).flatMap(c => c.types || []))) if (!seenTypes.has(t)) errs.push(`no problem of type ${t} was generated`);
  if (!(data.contexts || []).some(c => c.Kfail)) errs.push('no context exercises a failed 5% check');
  exploreCheck(data.explore, errs);
  return errs;
}
/* Explore (tools v2, docs/tools-v2-chem-ice-tables-brief.md): each step of x is one reaction event, drawn as whole
   molecules. Recomputed here: the atoms balance, every species stays at or above zero over the handle's range, Q of the
   drawn counts crosses K once, the step nearest K is within 2% of it, the exact x (Q = K, solved by bisection) rounds
   to that step at three significant figures, and the gauge's range holds K and Q from the first step to the last. */
const ATOMS = { H2: { H: 2 }, I2: { I: 2 }, HI: { H: 1, I: 1 }, N2O4: { N: 2, O: 4 }, NO2: { N: 1, O: 2 } };
function exploreCheck(ex, errs) {
  if (!ex || !Array.isArray(ex.reactions) || ex.reactions.length !== 2) { errs.push('explore: two reactions expected'); return; }
  const sig3 = v => Number(v.toPrecision(3));
  for (const r of ex.reactions) {
    const w = 'explore ' + r.id, sp = r.species;
    if (!['Kc', 'Kp'].includes(r.K) || (r.K === 'Kc') !== (r.unit === 'M')) errs.push(`${w}: Kc goes with M and Kp with atm`);
    const bal = {};
    sp.forEach(s => { const a = ATOMS[s.key]; if (!a) errs.push(`${w}: no atoms for ${s.key}`); else for (const [el, n] of Object.entries(a)) bal[el] = (bal[el] || 0) + n * s.nu; });
    if (Object.values(bal).some(v => v !== 0)) errs.push(`${w}: the equation does not balance`);
    if (r.n0.length !== sp.length) errs.push(`${w}: n0 has the wrong length`);
    const at = k => r.n0.map((n, i) => n + sp[i].nu * k), Qk = k => at(k).reduce((q, n, i) => q * (n * r.per) ** sp[i].nu, 1);
    for (let k = 0; k <= r.steps; k++) if (at(k).some(n => n < 0)) errs.push(`${w}: a species runs out before step ${k}`);
    if (at(r.steps).some(n => n <= 0)) errs.push(`${w}: the last step leaves a species at zero (Q would have no value)`);
    let cross = 0;
    for (let k = 1; k <= r.steps; k++) if ((Qk(k - 1) - r.Kval) * (Qk(k) - r.Kval) < 0) cross++;
    if (cross !== 1) errs.push(`${w}: Q should cross K exactly once over the handle (crosses ${cross})`);
    let best = 0; for (let k = 1; k <= r.steps; k++) if (Math.abs(Math.log(Qk(k) / r.Kval)) < Math.abs(Math.log(Qk(best) / r.Kval))) best = k;
    if (Math.abs(Qk(best) / r.Kval - 1) > 0.02) errs.push(`${w}: the nearest step gives Q ${Qk(best)}, more than 2% from K ${r.Kval}`);
    // the exact x: Q(x) = K on concentrations, by bisection between the two steps around it
    const Qx = x => r.n0.reduce((q, n, i) => q * (n * r.per + sp[i].nu * x) ** sp[i].nu, 1);
    let lo = 0, hi = (r.steps) * r.per; for (let i = 0; i < 200; i++) { const m = (lo + hi) / 2; if (Qx(m) < r.Kval) lo = m; else hi = m; }
    if (sig3(lo) !== sig3(best * r.per)) errs.push(`${w}: the exact x ${lo} does not round to the drawn step ${best * r.per}`);
    const [g0, g1] = r.gauge;
    if (!(Math.log10(r.Kval) > g0 && Math.log10(r.Kval) < g1)) errs.push(`${w}: K is off the gauge`);
    if (!(Math.log10(Qk(1)) >= g0 - 1e-9)) errs.push(`${w}: the first step's Q ${Qk(1)} is below the gauge`);
    if (!(Math.log10(Qk(r.steps)) <= g1 + 1e-9)) errs.push(`${w}: the last step's Q ${Qk(r.steps)} is above the gauge`);
    if (!(r.Kval > 0) || !r.T || !r.source) errs.push(`${w}: K, its temperature and its source are needed`);
  }
}
function s(sp, i) { return sp[i].html; }
