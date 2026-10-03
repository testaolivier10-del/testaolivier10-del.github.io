/* Validator for bio/data/tools/meiosis-nondisjunction.json (simulator).
   Checks the data's shape, every stimulus question and the mini FRQ, then the
   science through the model itself (ApBioMath.meiosis): meiosis halves the
   chromosome number and DNA, without crossing over a cell makes two kinds of
   gametes and all line-ups together make 2^n, crossing over makes the
   sisters differ, nondisjunction in meiosis I gives two n+1 and two n−1
   gametes while in meiosis II it gives one n+1, one n−1 and two n, a gamete
   meeting a normal one gives 2n+1 or 2n−1, mitosis keeps 2n and makes
   identical cells, and every number in the stimulus tables is recomputed
   from the model. */
import { runtime, base, question, frq } from './_shared.mjs';

const SLUG = 'meiosis-nondisjunction';
const grp = x => String(x).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

/* The rows a table's "check" spec gives (also used to write the tables). */
export function expectedRows(ck, M) {
  const Me = M.meiosis;
  if (ck.x === 'gametes') return ck.conds.map((c, i) => {
    const r = Me.simulate(c);
    return [ck.labels[i], ...r.gametes.map(g => `${g.n} (${g.label})`), String(r.kinds)];
  });
  if (ck.x === 'zygotes') return ck.conds.map((c, i) => {
    const r = Me.simulate(c);
    return [ck.labels[i], ...r.gametes.map(g => `${g.zygote} (${g.zlabel})`)];
  });
  if (ck.x === 'combos') return ck.ns.map(n => [String(n), String(2 * n), grp(Math.pow(2, n))]);
  throw new Error(`unknown check x "${ck.x}"`);
}

export function check(data, map) {
  const errs = [];
  const { M } = runtime();
  base(data, SLUG, map, errs, 'simulator');
  const Me = M.meiosis;
  if (!Me) { errs.push('ApBioMath.meiosis is missing'); return errs; }
  const opts = (data.pairs || {}).options || [];
  if (!opts.length || !opts.every(o => Number.isInteger(o.value) && o.value >= 1 && o.value <= 4)) errs.push('pairs.options: 1-4 homologous pairs each');
  if (!opts.some(o => o.value === (data.pairs || {}).value)) errs.push('pairs.value must be one of the options');
  const ids = (data.stages || []).map(s => s.id);
  if (JSON.stringify(ids) !== JSON.stringify(Array.from(Me.STAGES))) errs.push(`stages must be, in order: ${Array.from(Me.STAGES).join(', ')}`);
  for (const s of data.stages || []) if (!s.name || !s.text) errs.push(`stage ${s.id}: name and text are required`);
  for (const k of [2, 3]) {
    const n = Me.simulate({ pairs: k }), dna = st => n.stages.find(x => x.id === st).dna;
    if (!n.gametes.every(g => g.n === k && g.label === 'n' && g.zygote === 2 * k)) errs.push(`2n = ${2 * k}: normal meiosis must give four gametes of n = ${k}`);
    if (!(dna('g1')[0] === 2 && dna('s')[0] === 4 && dna('mei1').every(x => x === 2) && dna('gametes').every(x => x === 1))) errs.push('DNA per cell must go 2, 4, 2 (each cell after meiosis I), 1 (each gamete)');
    if (n.kinds !== 2) errs.push('without crossing over one cell makes two kinds of gametes');
    if (Me.series({ pairs: k }).kinds !== 2 ** k) errs.push(`every line-up together must give 2^n = ${2 ** k} kinds of gametes`);
    if (!(Me.series({ pairs: k, cross: true }).kinds > 2 ** k)) errs.push('crossing over must add kinds of gametes beyond 2^n');
    if (Me.simulate({ pairs: k, cross: true }).kinds !== 4) errs.push('with crossing over the sisters differ, so one cell makes four kinds of gametes');
    for (let p = 0; p < k; p++) {
      const one = Me.simulate({ pairs: k, nd: 'I', ndPair: p }).gametes.map(g => g.label).sort().join(',');
      if (one !== 'n+1,n+1,n−1,n−1') errs.push(`nondisjunction in meiosis I must give two n+1 and two n−1 gametes (${one})`);
      for (const cell of [0, 1]) {
        const r = Me.simulate({ pairs: k, nd: 'II', ndPair: p, ndCell: cell });
        const two = r.gametes.map(g => g.label).sort().join(',');
        if (two !== 'n,n,n+1,n−1') errs.push(`nondisjunction in meiosis II must give one n+1, one n−1 and two n gametes (${two})`);
        if (!r.gametes.every(g => g.zygote === g.n + k)) errs.push('a zygote is the gamete plus a normal gamete of n');
        const extra = r.gametes.find(g => g.label === 'n+1');
        if (!extra || extra.trisomy !== p || extra.zlabel !== '2n+1') errs.push('the n+1 gamete must give a zygote trisomic for the pair that did not separate');
      }
    }
    const mi = Me.mitosis({ pairs: k });
    if (!(mi.identical && mi.counts.every(x => x === 2 * k))) errs.push('mitosis must give two cells with 2n chromosomes, identical to the parent cell');
  }
  if (JSON.stringify(Me.simulate({ pairs: 3, cross: true })) !== JSON.stringify(Me.simulate({ pairs: 3, cross: true }))) errs.push('the model must be deterministic');
  // the stimulus tables, recomputed from the model
  for (const [sid, s] of Object.entries(data.stimuli || {})) for (const t of s.tables || []) {
    if (!t.check) { errs.push(`${sid}: every table needs a "check" spec`); continue; }
    let want;
    try { want = expectedRows(t.check, M); } catch (e) { errs.push(`${sid}: ${e.message}`); continue; }
    if (t.rows.length !== want.length) { errs.push(`${sid} "${t.caption}": ${t.rows.length} rows, the check gives ${want.length}`); continue; }
    want.forEach((row, i) => row.forEach((v, j) => {
      if (t.rows[i][j] !== v) errs.push(`${sid} "${t.caption}": row ${i + 1} column ${j + 1} says ${t.rows[i][j]}, the model gives ${v}`);
    }));
  }
  const qids = new Set();
  for (const q of data.questions || []) question(q, SLUG, map, data.stimuli, errs, qids);
  const n = (data.questions || []).length;
  if (n < 3 || n > 5) errs.push(`a simulator has 3-5 stimulus questions (${n})`);
  // the numeric item: 2^n for the species named in it
  const qn = (data.questions || []).find(q => q.id === `${SLUG}:cells:2`);
  if (qn && qn.numeric.answer !== 2 ** 4) errs.push(`${SLUG}:cells:2: answer ${qn.numeric.answer}, 2^4 = 16`);
  if (!data.frq) errs.push('a simulator ends with a mini FRQ'); else frq(data.frq, SLUG, map, errs);
  return errs;
}
