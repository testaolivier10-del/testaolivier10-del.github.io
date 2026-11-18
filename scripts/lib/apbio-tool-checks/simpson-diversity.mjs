/* Validator for bio/data/tools/simpson-diversity.json. Simpson’s diversity index D = 1 − Σ(n/N)² (built now, published with Unit 8).
   The shared skills checks (_shared.mjs skills()): topics, 300 seeded
   problems per context solve soundly, fixed problems match "expect". */
import { skills } from './_shared.mjs';

export function check(data, map) {
  const errs = [];
  const { M, P } = skills(data, 'simpson-diversity', 'simpson', map, errs);
  if (Math.abs(M.simpson([10, 10]).D - 0.5) > 1e-12) errs.push('ApBioMath.simpson: two equal species must give D = 0.5');
  for (const c of data.contexts || []) if (c.species.length < c.k[1]) errs.push(`context ${c.id}: fewer species names than k allows`);
  // The Explore plot (tools v2, docs/tools-v2-simpson-diversity-brief.md): the opening community and the Build goals.
  const ex = data.explore;
  if (!ex) errs.push('explore: the Explore plot is missing');
  else {
    const n = ex.species.length, sum = (ex.start || []).reduce((a, b) => a + b, 0);
    if (n < 2 || n > 5) errs.push('explore: 2 to 5 species (the tray and the tree drawings hold five)');
    if (new Set(ex.species.map(s => s.id)).size !== n) errs.push('explore: species ids repeat');
    if (!ex.start || ex.start.length !== n) errs.push('explore: start needs one count per species');
    if (ex.spots % 6 || ex.spots % 9) errs.push('explore: spots must fill rows of 6 (phone) and of 9');
    if (sum < 2 || sum >= ex.spots) errs.push('explore: the opening plot needs trees and some bare soil');
    if (!ex.species.some(s => s.id === ex.plant)) errs.push('explore: plant is not a species id');
    else if (ex.start[ex.species.findIndex(s => s.id === ex.plant)] !== 0) errs.push('explore: the tree picked at the opening should be one the plot does not have yet (the first tap then adds a species)');
    const present = ex.start.filter(Boolean), d0 = M.simpson(present).D;
    if (present.length < 2 || present.length >= n) errs.push('explore: the opening plot needs two or more species and one still to add');
    if (Math.max(...present) - Math.min(...present) <= 1) errs.push('explore: the opening plot must be uneven (the first Build goal raises D by evening it out)');
    if (!(d0 > 0 && d0 < 1 - 1 / present.length - 0.01)) errs.push('explore: opening D leaves no room to rise with the same species');
    if (!(ex.goalHigh > 1 - 1 / present.length && ex.goalHigh < 1 - 1 / n - 1e-9)) errs.push('explore: goalHigh must need a new species and stay below the most D can be with every species (1 - 1/S)');
  }
  return errs;
}
