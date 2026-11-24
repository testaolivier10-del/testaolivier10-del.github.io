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
  exploreCheck(data.explore, errs);
  return errs;
}
/* Explore (tools v2, docs/tools-v2-chem-q-vs-k-brief.md): a cylinder of whole particles; each press adds `drop`
   particles of a gas or one lump of a solid; the reaction runs one whole event at a time while an event brings Q nearer
   K. Recomputed here, without the page's code: the equations balance atom by atom, Kc goes with M and Kp with atm, only
   gases are in Q, the start is at equilibrium (Q = K exactly), the K values match their sources (CaCO₃: the CO₂
   pressure over calcite at 800 °C, Baker 1962), and the directions are right: adding a reactant gas runs forward and a
   product gas runs back (both at least one whole event from the start), a solid changes nothing, and squeezing the
   cylinder runs toward the side with fewer gas particles (at least one event at the smallest and largest volume). Every
   settled state over every volume stays inside the caps. */
const ATOMS = { A: { A: 1 }, B: { B: 1 }, AB: { A: 1, B: 1 }, CaCO3: { Ca: 1, C: 1, O: 3 }, CaO: { Ca: 1, O: 1 }, CO2: { C: 1, O: 2 } };
function exploreCheck(ex, errs) {
  if (!ex || !Array.isArray(ex.reactions) || ex.reactions.length !== 2) { errs.push('explore: two reactions expected'); return; }
  if (!(ex.drop >= 1) || !Array.isArray(ex.volumes) || !ex.volumes.includes(ex.V0)) errs.push('explore: drop, volumes and V0 (one of the volumes) are needed');
  const vols = ex.volumes || [1];
  for (const r of ex.reactions) {
    const w = 'explore ' + r.id, sp = r.species;
    if (!['Kc', 'Kp'].includes(r.K) || (r.K === 'Kc') !== (r.unit === 'M')) errs.push(`${w}: Kc goes with M and Kp with atm`);
    const bal = {};
    sp.forEach(x => { const a = ATOMS[x.key]; if (!a) errs.push(`${w}: no atoms for ${x.key}`); else for (const [el, n] of Object.entries(a)) bal[el] = (bal[el] || 0) + n * x.nu; });
    if (Object.values(bal).some(v => v !== 0)) errs.push(`${w}: the equation does not balance`);
    if (!r.tab || !r.chip || !r.perText || !r.ref) errs.push(`${w}: tab, chip, perText and ref are needed`);
    // Q of whole counts at volume V: gases only, each particle per / V (M or atm); NaN when 0 / 0
    const Q = (c, V) => { let top = 1, bot = 1, zt = false, zb = false; sp.forEach((x, i) => { if (x.phase !== 'g') return; const v = (c[i] * r.per) / V; if (x.nu > 0) { if (!v) zt = true; top *= v ** x.nu; } else { if (!v) zb = true; bot *= v ** -x.nu; } }); return zt && zb ? NaN : zb ? Infinity : zt ? 0 : top / bot; };
    const D = q => (q > 0 && isFinite(q) ? Math.abs(Math.log(q / r.Kval)) : Infinity);
    const step = (c, V) => { const q = Q(c, V); if (q !== q || Math.abs(q / r.Kval - 1) < 1e-9) return 0; const d = q < r.Kval ? 1 : -1, c2 = c.map((n, i) => n + d * sp[i].nu); if (c2.some(n => n < 0)) return 0; return D(Q(c2, V)) < D(q) ? d : 0; };
    const settle = (c, V) => { let n = 0; for (;;) { const d = step(c, V); if (!d) return { c, n }; c = c.map((x, i) => x + d * sp[i].nu); if (++n > 200) return { c, n }; } };
    if (Math.abs(Q(r.n0, ex.V0) / r.Kval - 1) > 1e-9) errs.push(`${w}: the start is not at equilibrium (Q ${Q(r.n0, ex.V0)}, K ${r.Kval})`);
    if (sp.some(x => x.phase !== 'g' && x.phase !== 's')) errs.push(`${w}: phases are g or s here`);
    if (r.id === 'caco3') {
      const baker = 10 ** (7.079 - 8308 / 1073.15), table = 168 / 760;
      if (Math.abs(r.Kval / baker - 1) > 0.03 || Math.abs(r.Kval / table - 1) > 0.03) errs.push(`${w}: Kp ${r.Kval} is not the CO₂ pressure over calcite at 800 °C (${baker.toFixed(3)}, ${table.toFixed(3)} atm)`);
      if (r.T !== '800 °C') errs.push(`${w}: K is for 800 °C`);
    }
    // adding: a reactant gas runs forward, a product gas runs back, at least one whole event; a solid changes nothing
    sp.forEach((x, i) => {
      const c = r.n0.slice(); c[i] += x.phase === 'g' ? ex.drop : 1;
      const s0 = settle(c, ex.V0), d = s0.n ? Math.sign((s0.c[0] - c[0]) * sp[0].nu) : 0;   // forward moves each count the way of its coefficient
      if (x.phase === 's') { if (s0.n) errs.push(`${w}: adding ${x.key} (a solid) made it react`); return; }
      if (!s0.n) errs.push(`${w}: adding ${ex.drop} ${x.key} runs no whole event`);
      else if (d !== (x.nu < 0 ? 1 : -1)) errs.push(`${w}: adding ${x.key} runs the wrong way`);
      if (c[i] > r.cap[i]) errs.push(`${w}: one press of ${x.key} from the start is over its cap`);
    });
    // squeezing runs toward fewer gas particles; every volume settles inside the caps
    const dn = sp.reduce((a, x) => a + (x.phase === 'g' ? x.nu : 0), 0);
    vols.forEach(V => {
      const s0 = settle(r.n0.slice(), V), d = s0.n ? Math.sign((s0.c[0] - r.n0[0]) * sp[0].nu) : 0;
      if ((V === vols[0] || V === vols[vols.length - 1]) && !s0.n) errs.push(`${w}: at ${V} L nothing runs`);
      if (s0.n && dn !== 0) { const want = (V < ex.V0) === (dn < 0) ? 1 : -1; if (d !== want) errs.push(`${w}: at ${V} L it runs ${d > 0 ? 'forward' : 'back'}, toward more gas particles`); }
      if (s0.c.some((n, i) => n > r.cap[i] || n < 0)) errs.push(`${w}: at ${V} L the settled counts ${s0.c} leave the caps`);
      const gas = s0.c.reduce((a, n, i) => a + (sp[i].phase === 'g' ? n : 0), 0); if (gas > r.gasCap) errs.push(`${w}: at ${V} L ${gas} gas particles, over the cap ${r.gasCap}`);
      const q = Q(s0.c, V); if (Math.abs(Math.log(q / r.Kval)) > Math.log(1.2)) errs.push(`${w}: at ${V} L the nearest whole counts give Q ${q}, more than 20% from K`);
    });
  }
}
