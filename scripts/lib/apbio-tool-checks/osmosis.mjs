/* Validator for bio/data/tools/osmosis.json (simulator). Checks the data's
   shape, the stimulus questions and the mini FRQ, then the science through
   the model (ApBioMath.osmosis): ψs = −iCRT with the formula sheet's R and T,
   water moving from higher to lower ψ, turgor in plant cells, plasmolysis,
   lysis of animal cells in water, NaCl counting double, and every number in
   the stimulus table recomputed. */
import { runtime, base, question, frq } from './_shared.mjs';

const signed = v => (v > 0 ? '+' : v < 0 ? '−' : '') + Math.abs(v).toFixed(1);
export function check(data, map) {
  const errs = [];
  const { M } = runtime();
  base(data, 'osmosis', map, errs, 'simulator');
  const O = M.osmosis, sys = id => (data.systems || []).find(s => s.id === id);
  const potato = sys('potato'), rbc = sys('rbc'), bag = sys('bag');
  if (!potato || !rbc || !bag) { errs.push('systems potato, rbc and bag are required'); return errs; }
  const i = id => (data.solutes || []).find(s => s.id === id)?.i;
  if (i('sucrose') !== 1 || i('nacl') !== 2) errs.push('solutes: sucrose has i = 1 and NaCl i = 2');
  for (const s of data.systems) {
    if (!['plant', 'animal', 'bag'].includes(s.kind)) errs.push(`system ${s.id}: kind must be plant, animal or bag`);
    if (!(s.time && s.time.max > 0 && s.time.step > 0 && s.time.value <= s.time.max)) errs.push(`system ${s.id}: time {max, step, value} is required`);
    if (!s.note) errs.push(`system ${s.id}: a note is required`);
  }
  const run = (s, c) => O.simulate(s, { outI: 1, inI: 1, T: s.defaults.T, t: s.time.value, ...c });
  // direction and states
  const pw = run(potato, { outC: 0 }), ps = run(potato, { outC: 1 });
  if (!(pw.pct > 0 && pw.state === 'turgid' && pw.startDir === 'in')) errs.push('potato in water must gain mass and end turgid');
  if (!(ps.pct < 0 && ps.state === 'plasmolyzed' && ps.startDir === 'out')) errs.push('potato in 1.0 M sucrose must lose mass and plasmolyze');
  if (!(pw.equilibrium && ps.equilibrium)) errs.push('after the default time the potato must be at equilibrium (water potentials equal)');
  if (Math.abs(pw.end.psi) > 0.05 || pw.end.psiP <= 0) errs.push('a turgid potato cell in pure water ends with ψ = 0 and ψp > 0');
  if (Math.abs(ps.end.psi - ps.psiO) > 0.05 || ps.end.psiP !== 0) errs.push('a plasmolyzed cell ends with ψp = 0 and ψ equal to the solution');
  const iso = O.isotonicC(potato, { outI: 1, T: 22 });
  if (Math.abs(run(potato, { outC: iso }).pct) > 0.05) errs.push('no mass change at the isotonic concentration');
  const isoNa = O.isotonicC(potato, { outI: 2, T: 22 });
  if (Math.abs(isoNa - iso / 2) > 1e-9) errs.push('NaCl (i = 2) must balance at half the sucrose molarity');
  if (!run(rbc, { outC: 0 }).lysed) errs.push('red blood cells in distilled water must burst');
  const rIso = run(rbc, { outC: rbc.osmIn / 2, outI: 2 });
  if (rIso.lysed || Math.abs(rIso.pct) > 0.5) errs.push('red blood cells in NaCl at half their osmolarity (isotonic) must keep their size');
  if (run(rbc, { outC: 0.6 }).state !== 'shriveled') errs.push('red blood cells in 0.6 M sucrose must shrivel');
  const bIn = run(bag, { inC: 1, outC: 0 }), bOut = run(bag, { inC: 0, outC: 1 }), bEq = run(bag, { inC: 0.4, outC: 0.4 });
  if (!(bIn.pct > 0 && bOut.pct < 0 && Math.abs(bEq.pct) < 1e-9)) errs.push('a bag gains mass when its sucrose is stronger than the beaker’s, loses it when weaker, and is unchanged when equal');
  if (Math.abs(M.psiS(1, 0.3, 22) - -(0.3 * 0.0831 * 295)) > 1e-9) errs.push('ψs must be −iCRT with R = 0.0831 and T = °C + 273');
  // the stimulus table, recomputed
  for (const [sid, s] of Object.entries(data.stimuli || {})) for (const t of s.tables || []) {
    const ck = t.check, sy = sys(ck?.system);
    if (!sy) { errs.push(`${sid}: every table needs a "check" with a system`); continue; }
    for (const row of t.rows) {
      const want = signed(M.round(O.simulate(sy, { outC: Number(row[0]), outI: i(ck.solute), T: ck.T, t: ck.t }).pct, 1));
      if (row[1] !== want) errs.push(`${sid}: at ${row[0]} M the table says ${row[1]}, the model gives ${want}`);
    }
  }
  const ids = new Set();
  for (const q of data.questions || []) question(q, 'osmosis', map, data.stimuli, errs, ids);
  const n = (data.questions || []).length;
  if (n < 3 || n > 5) errs.push(`a simulator has 3-5 stimulus questions (${n})`);
  const q1 = (data.questions || []).find(q => q.id === 'osmosis:potato:1');
  if (q1 && Math.abs(q1.numeric.answer - iso) > q1.numeric.tol) errs.push(`osmosis:potato:1: the model's zero crossing (${iso.toFixed(3)} M) must be within the tolerance`);
  const q2 = (data.questions || []).find(q => q.id === 'osmosis:potato:2');
  if (q2 && Math.abs(q2.numeric.answer - M.psiS(1, 0.3, 22)) > 0.006) errs.push('osmosis:potato:2: ψ of 0.30 M sucrose at 22 °C is −7.35 bar');
  if (!data.frq) errs.push('a simulator ends with a mini FRQ'); else frq(data.frq, 'osmosis', map, errs);
  return errs;
}
