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
  return errs;
}
function s(sp, i) { return sp[i].html; }
