/* Validator for bio/data/tools/signal-transduction-amplification.json
   (simulator). Checks the data's shape, every stimulus question and the mini
   FRQ, then the science through the model itself (ApBioMath.signal):
   amplification at the enzyme steps and none at the binding steps, the signal
   ending after washout, each drug or toxin acting where the data says, the
   antagonist being surmountable, and every number in the stimulus tables
   recomputed from the model. */
import { runtime, base, question, frq } from './_shared.mjs';

const SLUG = 'signal-transduction-amplification';
const NONE = { L: 0, tOff: 120, antagonist: false, gprotein: 'normal', pde: false, pka: false };

/* The rows a table's "check" spec gives (also used to write the tables). */
export function expectedRows(ck, data, M) {
  const S = M.signal, p = data.model, cond = o => ({ ...NONE, ...ck.base, ...o });
  if (ck.x === 'stage') {
    const a = S.at(S.simulate(p, cond({})), ck.t);
    return ck.stages.map(id => [data.stages.find(s => s.id === id).name, S.fmt(a[id])]);
  }
  const val = (c, t) => (S.at(S.simulate(p, c), t)[ck.stage] / (ck.scale || 1)).toFixed(ck.d);
  if (ck.x === 't') {
    const sims = ck.series.map(o => S.simulate(p, cond(o)));
    return ck.at.map(t => [String(t), ...sims.map(s => (S.at(s, t)[ck.stage] / (ck.scale || 1)).toFixed(ck.d))]);
  }
  if (ck.x === 'L') return ck.at.map(L => [String(L), ...ck.series.map(o => val(cond({ ...o, L }), ck.t))]);
  throw new Error(`unknown check x "${ck.x}"`);
}

export function check(data, map) {
  const errs = [];
  const { M } = runtime();
  base(data, SLUG, map, errs, 'simulator');
  const S = M.signal, p = data.model;
  if (!p) { errs.push('no "model" parameters'); return errs; }
  for (const k of ['dt', 'sample', 'tEnd', 'Rtot', 'Kd', 'kR', 'antag', 'Gtot', 'kAct', 'kBasal', 'kHyd', 'ACtot', 'KG', 'kAC', 'kPDE', 'pdeLeft', 'n', 'Kc', 'PKAtot', 'pkaBlock', 'Ktot', 'k1', 'kp1', 'Ptot', 'k2', 'kp2', 'kGP'])
    if (typeof p[k] !== 'number') errs.push(`model.${k} must be a number`);
  const ids = (data.stages || []).map(s => s.id);
  if (ids.join() !== S.STAGES.join()) errs.push(`stages must be ${S.STAGES.join(', ')} in pathway order`);
  const at = (c, t) => S.at(S.simulate(p, { ...NONE, ...c }), t);
  const on = at({ L: 10 }, 60), rest = at({}, 60);
  // the "amplifies" flags match the model's counts at 10 nM, 60 s
  (data.stages || []).forEach((s, i) => {
    if (!i) return;
    const ratio = on[s.id] / on[ids[i - 1]];
    if (s.amplifies && !(ratio > 2)) errs.push(`stage ${s.id} is marked as amplifying, but the model gives ${ratio.toFixed(2)} per ${ids[i - 1]}`);
    if (!s.amplifies && !(ratio < 1)) errs.push(`stage ${s.id} is marked as not amplifying, but the model gives ${ratio.toFixed(2)} per ${ids[i - 1]}`);
  });
  if (!(on.rate / on.R > 1000)) errs.push('the overall amplification (glucose per second per bound receptor) must be large');
  if (!(rest.rate < 0.01 * on.rate)) errs.push('a resting cell must release little glucose');
  if (Math.abs(on.R / p.Rtot - 10 / (10 + p.Kd)) > 0.01) errs.push('receptor occupancy must reach L/(L + Kd)');
  // termination after washout
  const off = at({ L: 10, tOff: 120 }, 240);
  if (!(off.rate < 0.02 * on.rate && off.G < 2 * rest.G)) errs.push('the signal must end within 2 minutes of washout');
  // each block acts at its step
  const pde = at({ L: 10, tOff: 120, pde: true }, 240), lockOn = at({ tOff: 120, L: 10, gprotein: 'on' }, 240);
  if (!(pde.rate > 0.5 * on.rate && pde.cAMP > 10 * rest.cAMP)) errs.push('a phosphodiesterase inhibitor must keep cAMP and the response up after washout');
  if (!(lockOn.G > 0.9 * p.Gtot)) errs.push('a locked-on G protein must stay active after washout');
  const lockOff = at({ L: 100, gprotein: 'off' }, 60);
  if (!(lockOff.R > 0.8 * p.Rtot && lockOff.G < 1 && lockOff.rate < 0.001 * on.rate)) errs.push('a locked-off G protein must stop the signal after the receptor');
  const pka = at({ L: 10, pka: true }, 60);
  if (Math.abs(pka.cAMP / on.cAMP - 1) > 1e-9 || pka.PKA !== 0 || !(pka.rate < 0.001 * on.rate)) errs.push('a PKA inhibitor must leave cAMP unchanged and stop every step after PKA');
  const a10 = at({ L: 10, antagonist: true }, 60), a200 = at({ L: 200, antagonist: true }, 60), n200 = at({ L: 200 }, 60);
  if (!(a10.rate < 0.2 * on.rate && a200.rate > 0.8 * n200.rate)) errs.push('the antagonist must block at 10 nM and be overcome at 200 nM (competitive)');
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
  // the numeric item: cAMP per bound receptor from Table 1's rounded values
  const q2 = (data.questions || []).find(q => q.id === `${SLUG}:liver:2`);
  if (q2) {
    const t1 = data.stimuli['sig-s1'].tables[0].rows, num = r => Number(r[1].replace(/,/g, ''));
    const want = num(t1[3]) / num(t1[0]);
    if (Math.abs(q2.numeric.answer - want) > 0.5) errs.push(`${SLUG}:liver:2: answer ${q2.numeric.answer}, Table 1 gives ${want}`);
  }
  if (!data.frq) errs.push('a simulator ends with a mini FRQ'); else frq(data.frq, SLUG, map, errs);
  return errs;
}
