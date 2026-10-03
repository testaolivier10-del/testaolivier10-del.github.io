/* Validator for bio/data/tools/cell-cycle-checkpoints.json (simulator).
   Checks the data's shape, every stimulus question and the mini FRQ, then the
   science through the model itself (ApBioMath.cellCycle): a normal dish
   doubles in about a day, no growth factor sends cells to G0, Rb loss,
   cyclin D–CDK overactivity and a stuck ras-like protein each let cells
   divide without growth factor, p53 lets few damaged cells divide while its
   loss lets many through, a spindle poison holds cells in M with 4 units of
   DNA, and every number in the stimulus tables is recomputed from the model. */
import { runtime, base, question, frq } from './_shared.mjs';

const SLUG = 'cell-cycle-checkpoints';
const NORMAL = { gf: 1, damage: 0, p53: true, rb: false, cycd: false, ras: false, spindle: false };

/* The rows a table's "check" spec gives (also used to write the tables). */
export function expectedRows(ck, data, M) {
  const C = M.cellCycle, p = data.model, at = c => C.at(C.simulate(p, { ...NORMAL, ...c }), ck.t);
  if (ck.x === 'cond') return ck.conds.map((c, i) => { const a = at(c); return [ck.labels[i], ...ck.cols.map(([k, d]) => a[k].toFixed(d))]; });
  if (ck.x === 'hist') { const as = ck.conds.map(at); return data.histBins.map((b, i) => [b, ...as.map(a => (100 * a.hist[i] / a.N).toFixed(1))]); }
  throw new Error(`unknown check x "${ck.x}"`);
}

export function check(data, map) {
  const errs = [];
  const { M } = runtime();
  base(data, SLUG, map, errs, 'simulator');
  const C = M.cellCycle, p = data.model;
  if (!p) { errs.push('no "model" parameters'); return errs; }
  for (const k of ['dt', 'G1', 'G1min', 'G1fast', 'S', 'G2', 'M', 'kre', 'repair', 'apoptosis', 'escape', 'warm', 'N0', 'tEnd'])
    if (typeof p[k] !== 'number') errs.push(`model.${k} must be a number`);
  if (Math.abs(p.G1 + p.S + p.G2 + p.M - 24) > 1e-9) errs.push('the phase lengths must add up to the 24-hour cycle the data describes');
  if ((data.histBins || []).length !== 6) errs.push('histBins needs 6 labels (2, four S classes, 4)');
  const at = (c, t = 48) => C.at(C.simulate(p, { ...NORMAL, ...c }), t);
  const n0 = at({}, 0), n24 = at({}, 24), n48 = at({});
  if (Math.abs(n0.N - p.N0) > 1e-6) errs.push(`the dish must start with ${p.N0} cells`);
  if (!(n24.N / n0.N > 1.9 && n24.N / n0.N < 2.1)) errs.push(`a normal dish must about double in 24 h (${(n24.N / n0.N).toFixed(2)})`);
  const sum = n48.pctG1 + n48.pctS + n48.pctG2M;
  if (Math.abs(sum - 100) > 1e-6) errs.push('the phase percentages must add up to 100');
  if (Math.abs(n48.hist.reduce((a, b) => a + b, 0) - n48.N) > 1e-6) errs.push('the DNA histogram must count every cell');
  // growth factor and the G1 checkpoint
  const noGF = at({ gf: 0 });
  if (!(noGF.divRate < 0.01 && noGF.G0 / noGF.N > 0.95)) errs.push('without growth factor normal cells must stop in G0');
  for (const k of ['rb', 'cycd', 'ras']) {
    const m = at({ gf: 0, [k]: true });
    if (!(m.divRate > 0.8 * n48.divRate)) errs.push(`${k}: the mutation must let cells keep dividing without growth factor`);
  }
  const half = at({ gf: 0.5 });
  if (!(half.divRate > noGF.divRate && half.divRate < n48.divRate)) errs.push('half the growth factor must give an in-between division rate');
  if (!(at({ cycd: true }, 72).N > at({}, 72).N)) errs.push('cyclin D–CDK overactivity must make the population grow faster');
  // damage and p53
  const dam = at({ damage: 0.02 }), lost = at({ damage: 0.02, p53: false });
  if (!(dam.pctDivDam < 3 && lost.pctDivDam > 10 * dam.pctDivDam)) errs.push('with working p53 few damaged cells may divide; losing p53 must let many more through');
  if (!(dam.cumDied > 0 && lost.cumDied === 0)) errs.push('apoptosis needs working p53');
  if (at({ p53: false }).N !== n48.N) errs.push('without damage, losing p53 must change nothing');
  // the spindle checkpoint
  const sp = at({ spindle: true }, 24);
  if (!(sp.div === 0 && sp.hist[5] / sp.N > 0.95)) errs.push('a spindle poison must stop division and hold cells with 4 units of DNA');
  // the stimulus tables, recomputed from the model
  for (const [sid, s] of Object.entries(data.stimuli || {})) for (const t of s.tables || []) {
    if (!t.check) { errs.push(`${sid}: every table needs a "check" spec`); continue; }
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
  // the numeric item: the ratio of the two damaged-division percentages in Table 1
  const q3 = (data.questions || []).find(q => q.id === `${SLUG}:dish:3`);
  if (q3) {
    const t1 = data.stimuli['cc-s1'].tables[0].rows, want = Math.round(Number(t1[2][5]) / Number(t1[1][5]));
    if (q3.numeric.answer !== want) errs.push(`${SLUG}:dish:3: answer ${q3.numeric.answer}, Table 1 gives ${want}`);
  }
  if (!data.frq) errs.push('a simulator ends with a mini FRQ'); else frq(data.frq, SLUG, map, errs);
  return errs;
}
