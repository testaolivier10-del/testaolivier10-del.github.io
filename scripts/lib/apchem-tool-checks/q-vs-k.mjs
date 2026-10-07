/* Validator for chem/data/tools/q-vs-k.json. 300 seeded problems per context
   from ApChemMath.qk.generate (_drills.mjs), and here, without the
   generator: Q is recomputed from the amounts (particle counts × the
   concentration per particle; solids and liquids left out), the comparison
   and the direction follow from Q and K, and the justification marked right
   states both values and the right direction. */
import { runtime } from './_shared.mjs';
import { frame, sweep, close } from './_drills.mjs';

export function check(data, map) {
  const errs = [];
  const { M } = runtime();
  frame(data, 'q-vs-k', 'simulator', map, errs);
  for (const c of data.contexts || []) {
    if (c.mode === 'particles' && (!(c.per > 0) || c.species.some(s => !s.draw))) errs.push(`context ${c.id}: particle mode needs per and a draw template for every species`);
    if (c.mode !== 'particles' && !(Array.isArray(c.c) && c.c[0] > 0 && c.c[1] > c.c[0])) errs.push(`context ${c.id}: numbers mode needs a range c`);
  }
  const dirs = new Set();
  sweep(data, errs, (r, c) => M.qk.generate(r, c), (p, c, w) => {
    const amt = c.species.map((s, i) => (p.counts ? p.counts[i] * c.per : p.c[i]));
    const q = c.species.reduce((x, s, i) => (s.phase === 's' || s.phase === 'l' ? x : x * amt[i] ** s.nu), 1);
    const step = k => p.steps.find(x => x.key === k);
    if (!close(step('Q').cell.answer, q, 1e-9)) errs.push(`${w}: Q is ${step('Q').cell.answer}, recomputed ${q}`);
    const r = p.K / q, dir = Math.abs(r - 1) <= 0.025 ? 'eq' : r > 1 ? 'f' : 'r';
    if (dir !== p.dir) errs.push(`${w}: direction ${p.dir}, Q and K give ${dir}`);
    if (dir !== 'eq' && Math.abs(Math.log10(r)) < 0.45) errs.push(`${w}: Q and K are too close to call (${q} vs ${p.K})`);
    const want = { f: 0, r: 1, eq: 2 }[dir];
    if (step('cmp').correct !== want || step('dir').correct !== want) errs.push(`${w}: the comparison or direction key is wrong`);
    const j = step('just'), good = j.options[j.correct];
    if (!good.includes(M.fmt(p.K, 2)) || !good.includes(M.fmt(p.Q, 2))) errs.push(`${w}: the right justification does not state both Q and K`);
    if (!/forward|reverse|no net change/.test(good)) errs.push(`${w}: the right justification gives no direction`);
    dirs.add(dir);
  });
  for (const d of ['f', 'r', 'eq']) if (!dirs.has(d)) errs.push(`no problem with direction ${d} was generated`);
  return errs;
}
