/* Validator for bio/data/tools/water-potential.json. Water potential: ψs = −iCRT with R = 0.0831 and T = °C + 273, ψ = ψs + ψp.
   The shared skills checks (_shared.mjs skills()): topics, 300 seeded
   problems per context solve soundly, fixed problems match "expect". */
import { skills } from './_shared.mjs';

export function check(data, map) {
  const errs = [];
  const { M, P } = skills(data, 'water-potential', 'wp', map, errs);
  if (Math.abs(M.R - 0.0831) > 1e-12 || M.K0 !== 273) errs.push('ApBioMath must use R = 0.0831 L·bar/(mol·K) and T = °C + 273 (the formula sheet)');
  if (Math.abs(M.psiS(1, 0.3, 22) - -7.35435) > 1e-6) errs.push('ψs of 0.3 M sucrose at 22 °C must be −7.35 bar');
  // Explore (tools v2): each solute potential is rounded to 0.1 bar before adding, pressure cannot lift the cell's
  // total above 0, and the opening setting has water moving in with "equal" reachable on the pressure grid.
  const e = data.explore, r1 = v => Math.round(v * 10) / 10;
  if (!e || !e.cell || !e.pressure || !e.outside) errs.push('explore { T, cell, pressure, outside } is required');
  else {
    const cs = r1(M.psiS(e.cell.i, e.cell.C, e.T));
    if (e.cell.i !== 1 || e.outside.i !== 1) errs.push('explore: the cell sap and the outside solute are non-ionizing (i = 1)');
    if (Math.abs(e.pressure.max + cs) > 1e-9) errs.push(`explore: pressure.max must be ${-cs} bar (the cell's total cannot pass 0, the value of pure water)`);
    if (e.pressure.min !== 0 || e.pressure.step !== 0.1) errs.push('explore: pressure runs from 0 in steps of 0.1 bar');
    if (!(e.outside.max > e.cell.C)) errs.push('explore: the outside must be able to pass the cell sap concentration');
    const out0 = r1(M.psiS(1, e.outside.value, e.T)), cell0 = r1(cs + e.pressure.value);
    if (!(out0 > cell0)) errs.push('explore: the opening setting must have water moving in (outside higher than the cell)');
    if (!(out0 - cs >= 0 && out0 - cs <= e.pressure.max)) errs.push('explore: "equal" must be reachable with the pressure knob at the opening solute');
    if (r1(M.psiS(1, 0, e.T)) !== 0) errs.push('explore: pure water has a water potential of 0');
  }
  return errs;
}
