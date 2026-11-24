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
  exploreCheck(data, M, errs);
  return errs;
}

/* Explore (tools v2, docs/tools-v2-chem-buffers-brief.md): two buffers, each with its drill context; at every drop the
   tool can draw (both amounts, acid and base, past capacity) the meter's pH rises with each drop of base, reads pKa
   at equal amounts (the half-equivalence point of a titration), stays within 0.01 of the exact pH wherever it uses
   Henderson-Hasselbalch, and a single drop moves the buffer far less than the same drop in water. */
function exploreCheck(data, M, errs) {
  const ex = data.explore;
  if (!ex) { errs.push('explore: missing'); return; }
  if (!Array.isArray(ex.buffers) || ex.buffers.length !== 2) { errs.push('explore: two buffers expected'); return; }
  if (!(ex.V0 > 0 && ex.drop && ex.drop.mL > 0 && ex.drop.M > 0)) errs.push('explore: V0 and the drop must be positive');
  const perDrop = ex.drop.mL * ex.drop.M;   // mmol in one drop
  if (Math.abs(perDrop - 1) > 1e-9) errs.push('explore: one drop must be 1 mmol (one particle)');
  const Kw = M.C.Kw;
  for (const b of ex.buffers) {
    const w = 'explore ' + b.id, c = (data.contexts || []).find(x => x.id === b.context);
    if (!c) { errs.push(`${w}: no drill context ${b.context}`); continue; }
    if (!!b.Ka === !!b.Kb) errs.push(`${w}: give Ka or Kb`);
    if (b.Ka && (!c.acid || c.acid.Ka !== b.Ka || c.acid.HA !== b.HA.html || c.acid.A !== b.A.html)) errs.push(`${w}: Ka or names differ from the drill context`);
    if (b.Kb && (!c.base || c.base.Kb !== b.Kb || c.base.BH !== b.HA.html || c.base.B !== b.A.html)) errs.push(`${w}: Kb or names differ from the drill context`);
    const Ka = b.Ka || Kw / b.Kb, pKa = -Math.log10(Ka);
    for (const n of ex.amounts) {
      const lim = n + ex.extra;
      if (lim > ex.maxDrops) errs.push(`${w} ${n}: the drop limit is above the beaker's`);
      let last = -Infinity;
      for (let k = -lim; k <= lim; k++) {
        const h = Math.max(0, n - Math.max(0, k)) + Math.max(0, Math.min(n, -k)), a = 2 * n - h, oh = Math.max(0, k - n), h3o = Math.max(0, -k - n), V = ex.V0 + Math.abs(k) * ex.drop.mL;
        const s = M.bufferMeter({ Ka, h, a, oh, h3o, V }), st = M.bufferState({ Ka, nHA: n / 1000, nA: n / 1000, V: V / 1000, b: k / 1000 });
        if (Math.abs(s.exact - st.pH) > 1e-9) errs.push(`${w} ${n} drop ${k}: the drawn counts give another exact pH than the stoichiometry`);
        if (!(s.pH > last)) errs.push(`${w} ${n} drop ${k}: the pH does not rise with base`);
        last = s.pH;
        if (s.how === 'hh' && Math.abs(s.pH - s.exact) > 0.01) errs.push(`${w} ${n} drop ${k}: Henderson-Hasselbalch is ${Math.abs(s.pH - s.exact).toFixed(3)} from the exact pH`);
        if (k === 0 && Math.abs(s.pH - pKa) > 1e-12) errs.push(`${w} ${n}: equal amounts do not read pKa`);
        if (Math.abs(k) >= n && s.how === 'hh') errs.push(`${w} ${n} drop ${k}: one form is gone, the meter must not use Henderson-Hasselbalch`);
        const wat = M.bufferMeter.water(k / 1000, V / 1000);
        if (k === 0 && Math.abs(wat - 7) > 1e-9) errs.push(`${w}: water does not start at 7`);
        if (k !== 0 && Math.abs(wat - (k > 0 ? 14 + Math.log10(k / V) : -Math.log10(-k / V))) > 0.01) errs.push(`${w} ${n} drop ${k}: the water pH is not the strong acid or base pH`);
        if (Math.abs(k) === 1 && !(Math.abs(s.pH - pKa) < 0.3 && Math.abs(wat - 7) > 4)) errs.push(`${w} ${n}: one drop does not show the buffer holding against water`);
      }
    }
  }
}
