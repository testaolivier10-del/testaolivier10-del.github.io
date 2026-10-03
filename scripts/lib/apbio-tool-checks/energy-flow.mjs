/* Validator for bio/data/tools/energy-flow.json (simulator, Unit 8).
   Checks the data's shape, every stimulus question and the mini FRQ, then the
   science through the model itself (ApBioMath.energyFlow): NPP = GPP − the
   producers' respiration; each level stores the stated fraction of the level
   below's; energy is conserved (GPP = heat + to decomposers); the energy
   pyramid narrows upward at every level while the biomass pyramid of the
   open-water food chain is inverted at its base; a persistent toxin's
   concentration rises by retain / (1 − resp) at each level. Every number in
   the stimulus tables and the numeric answer is recomputed from the model. */
import { runtime, base, question, frq } from './_shared.mjs';

const SLUG = 'energy-flow';

export function conditions(data, ck) {
  const eco = (data.ecosystems || []).find(e => e.id === ck.eco);
  if (!eco) throw new Error(`unknown ecosystem "${ck.eco}"`);
  return { ...data.defaults, ...ck.c, pb: eco.pb, kcalPerG: data.kcalPerG };
}

/* The rows a table's "check" spec gives (also used to write the tables). */
export function expectedRows(ck, data, M) {
  if (ck.x !== 'levels') throw new Error(`unknown check x "${ck.x}"`);
  const sim = M.energyFlow.simulate(conditions(data, ck));
  return sim.levels.map((L, i) => [ck.labels[i], ...ck.cols.map(c => M.fixed(L[c.f], c.d))]);
}

export function check(data, map) {
  const errs = [];
  const { M } = runtime();
  base(data, SLUG, map, errs, 'simulator');
  const E = M.energyFlow, d = data.defaults;
  if (!d || !data.ranges || typeof data.kcalPerG !== 'number') { errs.push('"defaults", "ranges" and "kcalPerG" are required'); return errs; }
  if (!Array.isArray(data.levelNames) || data.levelNames.length < 5) errs.push('"levelNames" needs five trophic levels');
  for (const e of data.ecosystems || []) {
    if (!Array.isArray(e.pb) || e.pb.length < 5 || !e.pb.every(x => x > 0)) errs.push(`ecosystem ${e.id}: pb needs five positive turnover rates`);
    if (!Array.isArray(e.organisms) || e.organisms.length < 5) errs.push(`ecosystem ${e.id}: organisms needs five names`);
  }
  if (!(data.ecosystems || []).length) { errs.push('"ecosystems" is required'); return errs; }
  if (d.resp > 1 - d.eff) errs.push('defaults: resp must be at most 1 − eff');
  const run = (eco, c) => E.simulate({ ...d, levels: 5, ...c, pb: data.ecosystems.find(e => e.id === eco).pb, kcalPerG: data.kcalPerG });
  const land = run(data.ecosystems[0].id, {});
  if (Math.abs(land.npp - d.gpp * (1 - d.prodResp)) > 1e-6) errs.push('NPP must equal GPP minus the producers\' respiration');
  if (Math.abs(land.heat + land.decomp - d.gpp) > 1e-6) errs.push('energy must be conserved: GPP = heat + to decomposers');
  land.levels.forEach((L, i) => {
    if (i && Math.abs(L.stored / land.levels[i - 1].stored - d.eff) > 1e-9) errs.push(`level ${i} must store eff × the level below`);
    if (i && Math.abs(L.conc / land.levels[i - 1].conc - d.retain / (1 - d.resp)) > 1e-9) errs.push(`level ${i}: the toxin must concentrate by retain / (1 − resp)`);
    if (L.heat < 0 || L.decomp < -1e-9) errs.push(`level ${i}: heat and decomposer shares cannot be negative`);
  });
  const water = data.ecosystems.find(e => e.id === 'water');
  if (water) { const w = run('water', {}); if (!(w.levels[0].biomass < w.levels[1].biomass)) errs.push('the open-water chain must show an inverted biomass pyramid at its base'); }
  try { E.simulate({ ...d, levels: 3, eff: 0.2, resp: 0.9, pb: [1, 1, 1], kcalPerG: 4 }); errs.push('the model must refuse a level that absorbs more than the level below stores'); } catch (e) { /* expected */ }
  // the stimulus tables, recomputed from the model
  const tables = {};
  for (const [sid, s] of Object.entries(data.stimuli || {})) for (const t of s.tables || []) {
    if (!t.check) { errs.push(`${sid}: every table needs a "check" spec`); continue; }
    if (t.id) tables[t.id] = t;
    let want;
    try { want = expectedRows(t.check, data, M); } catch (e) { errs.push(`${sid}: ${e.message}`); continue; }
    if (t.rows.length !== want.length) { errs.push(`${sid} "${t.caption}": ${t.rows.length} rows, the check gives ${want.length}`); continue; }
    want.forEach((row, i) => row.forEach((v, j) => {
      if (t.rows[i][j] !== v) errs.push(`${sid} "${t.caption}": row ${i + 1} column ${j + 1} says ${t.rows[i][j]}, the model gives ${v}`);
    }));
  }
  const qids = new Set();
  for (const q of data.questions || []) question(q, SLUG, map, data.stimuli, errs, qids);
  const n = (data.questions || []).length;
  if (n < 3 || n > 5) errs.push(`a simulator has 3-5 stimulus questions (${n})`);
  // the numeric item: GPP = stored + heat for the producers in the land table
  const q1 = (data.questions || []).find(q => q.id === `${SLUG}:chain:1`);
  const t1 = tables.land;
  if (q1 && t1) {
    const row = t1.rows[0], want = Number(row[1]) + Number(row[2]);
    if (Math.abs(q1.numeric.answer - want) > 1e-9) errs.push(`${SLUG}:chain:1: answer ${q1.numeric.answer}, the land table gives ${want}`);
  } else errs.push(`${SLUG}:chain:1 (the numeric item) and the table with id "land" are required`);
  if (!data.frq) errs.push('a simulator ends with a mini FRQ'); else frq(data.frq, SLUG, map, errs);
  return errs;
}
