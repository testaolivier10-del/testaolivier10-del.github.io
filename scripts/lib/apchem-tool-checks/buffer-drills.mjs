/* Validator for chem/data/tools/buffer-drills.json. 300 seeded problems per
   context and type from ApChemMath.buffer.generate (_drills.mjs), and here,
   without the generator: pKa from Ka (or 14 − pKb), pH from
   Henderson-Hasselbalch on the amounts in the problem text, the ratio from
   10^(pH − pKa), the moles after the strong acid or base reacts, and the
   capacity as the moles of the component the addition uses up. */
import { runtime } from './_shared.mjs';
import { frame, sweep, close } from './_drills.mjs';

const TYPES = ['ph', 'ratio', 'add', 'capacity'];

export function check(data, map) {
  const errs = [];
  const { M } = runtime();
  frame(data, 'buffer-drills', 'drill', map, errs);
  for (const c of data.contexts || []) {
    if (!!c.acid === !!c.base) errs.push(`context ${c.id}: give an acid or a base, not both`);
    if (!Array.isArray(c.types) || c.types.some(t => !TYPES.includes(t))) errs.push(`context ${c.id}: types must come from ${TYPES.join(', ')}`);
  }
  sweep(data, errs, (r, c, t) => M.buffer.generate(r, c, t), (p, c, w) => {
    const pKa = c.acid ? -Math.log10(c.acid.Ka) : 14 + Math.log10(c.base.Kb), v = p.values;
    const step = k => p.steps.find(x => x.key === k);
    if (!close(v.pKa, pKa, 1e-9)) errs.push(`${w}: pKa ${v.pKa}, recomputed ${pKa}`);
    if (step('pKa') && !close(step('pKa').cell.answer, pKa, 1e-9)) errs.push(`${w}: the pKa step disagrees`);
    if (p.type === 'ph' && !close(step('pH').cell.answer, pKa + Math.log10(v.cA / v.cH), 1e-9)) errs.push(`${w}: pH disagrees with Henderson-Hasselbalch`);
    if (p.type === 'ph' && !p.text.includes(M.fmt(v.cA, 3))) errs.push(`${w}: the text does not show [A⁻]`);
    if (p.type === 'ratio') {
      if (!close(step('ratio').cell.answer, 10 ** (v.target - pKa), 1e-9)) errs.push(`${w}: ratio disagrees with 10^(pH − pKa)`);
      if (step('more').correct !== (v.target > pKa ? 0 : 1)) errs.push(`${w}: which form is in excess is wrong`);
    }
    const shows = (...xs) => { for (const [x, n] of xs) if (!p.text.includes(M.fmt(x, n))) errs.push(`${w}: the text does not show ${M.fmt(x, n)}`); };
    if (p.type === 'add') {
      const L = v.L, nH = v.cH * L, nA = v.cA * L, n = v.added, acid = v.acidAdded;
      shows([v.cH, 3], [v.cA, 3], [n, 2], [L * 1000, 3]);
      if (!p.text.includes(acid ? 'HCl' : 'NaOH')) errs.push(`${w}: the text names the wrong strong acid or base`);
      const A2 = acid ? nA - n : nA + n, H2 = acid ? nH + n : nH - n;
      if (!(A2 > 0 && H2 > 0)) errs.push(`${w}: the addition exhausts the buffer`);
      if (!close(step('nA').cell.answer, A2, 1e-6) || !close(step('nH').cell.answer, H2, 1e-6)) errs.push(`${w}: moles after the reaction disagree`);
      const pH = pKa + Math.log10(A2 / H2), pH0 = pKa + Math.log10(nA / nH);
      if (!close(step('pH').cell.answer, pH, 1e-6)) errs.push(`${w}: the new pH disagrees`);
      if (acid ? pH >= pH0 : pH <= pH0) errs.push(`${w}: the pH moves the wrong way`);
    }
    if (p.type === 'capacity') {
      const { cH: h1, cA: a1 } = v.b1, { cH: h2, cA: a2 } = v.b2;
      shows([h1, 3], [a1, 3], [h2, 3], [a2, 3], [v.L * 1000, 3]);
      if (!close(a1 / h1, a2 / h2, 1e-6)) errs.push(`${w}: the two buffers do not share a ratio`);
      const big = a1 > a2 ? 0 : 1, acid = /strong acid/.test(step('which').label);
      if (acid !== v.vsAcid) errs.push(`${w}: the question and the key disagree on acid or base`);
      if (step('which').correct !== big) errs.push(`${w}: the higher-capacity buffer is wrong`);
      const cap = (acid ? Math.max(a1, a2) : Math.max(h1, h2)) * v.L;
      if (!close(step('cap').cell.answer, cap, 1e-6)) errs.push(`${w}: capacity ${step('cap').cell.answer}, recomputed ${cap}`);
    }
  }, c => c.types);
  return errs;
}
