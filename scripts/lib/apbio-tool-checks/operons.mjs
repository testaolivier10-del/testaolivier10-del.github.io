/* Validator for bio/data/tools/operons.json (simulator).
   Checks the data's shape, every stimulus question and the mini FRQ, then the
   science through the model itself (ApBioMath.operon): the lac operon is on
   only with lactose, and fully only without glucose (CAP–cAMP); lacI⁻ and Oᶜ
   make it constitutive, lacIˢ makes it uninducible, lacZ⁻ keeps the mRNA but
   loses the enzyme; in the merodiploid lacI⁺ is dominant over lacI⁻ (trans),
   lacIˢ is dominant over lacI⁺, and Oᶜ acts only on its own copy (cis); the
   trp operon is off with tryptophan unless trpR⁻ or its operator is Oᶜ; the
   mRNA changes faster than the stable enzyme. Every number in the stimulus
   tables and the numeric answer is recomputed from the model. */
import { runtime, base, question, frq } from './_shared.mjs';

const SLUG = 'operons';
const WT_LAC = { I: '+', O: '+', Z: '+' }, WT_TRP = { R: '+', O: '+' };

/* The rows a table's "check" spec gives (also used to write the tables). */
export function expectedRows(ck, data, M) {
  const O = M.operon, p = data.model;
  if (ck.x === 'steady') return ck.strains.map(s => [s.label, ...ck.conds.map(c => O.state(p, { mode: ck.mode, ...c, copies: s.copies })[ck.field].toFixed(ck.d))]);
  if (ck.x === 'course') {
    const co = O.course(p, { mode: ck.mode, ...ck.before, copies: ck.copies }, { mode: ck.mode, ...ck.after, copies: ck.copies });
    return ck.times.map(t => { const a = O.at(co, t); return [String(t), a.m.toFixed(ck.d), a.e.toFixed(ck.d)]; });
  }
  throw new Error(`unknown check x "${ck.x}"`);
}

export function check(data, map) {
  const errs = [];
  const { M } = runtime();
  base(data, SLUG, map, errs, 'simulator');
  const O = M.operon, p = data.model;
  if (!p) { errs.push('no "model" parameters'); return errs; }
  for (const k of ['basal', 'full', 'noCap', 'trpOn', 'mHalf', 'eDouble', 'tStart', 'tEnd', 'dt'])
    if (typeof p[k] !== 'number') errs.push(`model.${k} must be a number`);
  if (!(p.basal < p.noCap && p.noCap < p.full)) errs.push('the lac rates must order basal < no CAP < full');
  for (const k of ['lacGenes', 'trpGenes', 'lacStarts', 'trpStarts']) if (!Array.isArray(data[k]) || !data[k].length) errs.push(`"${k}" is required`);
  const lac = (copies, c) => O.state(p, { mode: 'lac', ...c, copies });
  const trp = (copies, c) => O.state(p, { mode: 'trp', ...c, copies });
  const GL = { glucose: true, lactose: false }, GLL = { glucose: true, lactose: true }, NL = { glucose: false, lactose: false }, ON = { glucose: false, lactose: true };
  const wt = [WT_LAC];
  // wild type: Table 16.2's pattern
  if (!(lac(wt, GL).m === p.basal && lac(wt, NL).m === p.basal)) errs.push('without lactose the repressor must hold the lac operon at the basal rate');
  if (!(lac(wt, ON).m === p.full && lac(wt, GLL).m === p.noCap)) errs.push('with lactose the lac operon must be fully on without glucose and low with glucose');
  if (lac(wt, NL).cap !== true || lac(wt, GL).cap !== false) errs.push('CAP–cAMP must bind only without glucose');
  // single mutations
  const mut = k => [{ ...WT_LAC, ...k }];
  if (!(lac(mut({ I: '-' }), NL).m === p.full && lac(mut({ I: '-' }), GL).m === p.noCap)) errs.push('lacI⁻ must make the operon constitutive');
  if (!(lac(mut({ O: 'c' }), NL).m === p.full)) errs.push('Oᶜ must make the operon constitutive');
  if (lac(mut({ I: 's' }), ON).m !== p.basal) errs.push('lacIˢ must keep the operon off even with lactose');
  if (!(lac(mut({ Z: '-' }), ON).m === p.full && lac(mut({ Z: '-' }), ON).e === 0)) errs.push('lacZ⁻ must keep the mRNA and lose the enzyme');
  // merodiploids: trans and cis
  const md = (a, b) => [{ ...WT_LAC, ...a }, { ...WT_LAC, ...b }];
  if (lac(md({ I: '-' }, {}), NL).m !== 2 * p.basal) errs.push('lacI⁻ / F′ lacI⁺: the F′ repressor must act on both operators (trans)');
  if (lac(md({ I: 's' }, {}), ON).m !== 2 * p.basal) errs.push('lacIˢ must be dominant over lacI⁺');
  const cis = lac(md({ O: 'c', Z: '-' }, {}), NL);
  if (!(cis.m === p.full + p.basal && cis.e === p.basal)) errs.push('Oᶜ lacZ⁻ / F′ O⁺ lacZ⁺: Oᶜ must free only its own copy (cis)');
  // trp
  if (!(trp([WT_TRP], { trp: true }).m === p.basal && trp([WT_TRP], { trp: false }).m === p.trpOn)) errs.push('the trp operon must be off with tryptophan and on without it');
  if (trp([{ ...WT_TRP, R: '-' }], { trp: true }).m !== p.trpOn || trp([{ ...WT_TRP, O: 'c' }], { trp: true }).m !== p.trpOn) errs.push('trpR⁻ and a trp Oᶜ operator must keep the trp operon on');
  // dynamics: mRNA settles faster than the enzyme; steady state before 0 min
  const co = O.course(p, { mode: 'lac', ...GL, copies: wt }, { mode: 'lac', ...ON, copies: wt });
  const at = t => O.at(co, t);
  if (at(p.tStart).m !== p.basal || at(0).e !== p.basal) errs.push('the time course must start at the steady state of the starting condition');
  if (!(at(10).m > 0.9 * p.full && at(10).e < 0.25 * p.full)) errs.push('after induction the mRNA must rise within minutes and the enzyme more slowly');
  if (!(at(p.tEnd).e > at(30).e && at(p.tEnd).e < p.full)) errs.push('the enzyme must still be rising toward steady state at the end');
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
  // the numeric item: the enzyme's rate of increase between 20 and 40 min in Table 2
  const q3 = (data.questions || []).find(q => q.id === `${SLUG}:lac:3`);
  if (q3) {
    const rows = data.stimuli['op-s1'].tables[1].rows, v = t => Number(rows.find(r => r[0] === String(t))[2]);
    const want = Math.round((v(40) - v(20)) / 20 * 10) / 10;
    if (Math.abs(q3.numeric.answer - want) > 1e-9) errs.push(`${SLUG}:lac:3: answer ${q3.numeric.answer}, Table 2 gives ${want}`);
  }
  if (!data.frq) errs.push('a simulator ends with a mini FRQ'); else frq(data.frq, SLUG, map, errs);
  return errs;
}
