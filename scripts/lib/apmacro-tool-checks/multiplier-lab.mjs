/* Validator for macroeconomics/data/tools/multiplier-lab.json (Multiplier lab), run by
   scripts/check-apmacro-content.mjs. OWNED BY THIS TOOL ONLY (builder T3).
   check(data, map) -> problems.

   1. The frame; each context's types (multiplier, total, gap, money) and the
      topic each type belongs to.
   2. Explore: the ripple rounds add up to the multiplier total, the gap
      closes exactly at gap ÷ multiplier, and the money rounds add up to the
      money multiplier total, all against this file's own arithmetic.
   3. 300 seeded problems per context and type (_drills.mjs sweep), every
      key recomputed here from the problem's numbers (1 / (1 - MPC),
      -MPC / (1 - MPC), gap / multiplier, excess / ratio), the direction and
      the gap kind keyed right, the multiply-the-gap slip named, and the
      money problems labeled as the limited-reserves model. */
import { frame, sweep, close } from './_drills.mjs';
import { runtime } from './_shared.mjs';

export const TYPES = ['multiplier', 'total', 'gap', 'money'];
export const TOPIC = { multiplier: 'multipliers', total: 'multipliers', gap: 'fiscal-policy', money: 'banking-money-supply' };
const strip = s => String(s).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
const K = mpc => 1 / (1 - mpc), KT = mpc => -mpc / (1 - mpc);

export function exploreProblems(model) {
  const errs = [];
  for (const mpc of model.MPCS) for (const kind of ['G', 'T', 'BB']) for (const amt of [-30, 10, 50]) {
    const R = model.ripple(kind, mpc, amt, 400), want = kind === 'G' ? amt * K(mpc) : kind === 'T' ? amt * KT(mpc) : amt;
    if (!close(R.total, want, 1e-9, 1e-9)) errs.push(`ripple ${kind} mpc ${mpc}: total ${R.total}, want ${want}`);
    if (!close(R.shown, want, 1e-6, 1e-6)) errs.push(`ripple ${kind} mpc ${mpc}: the rounds add to ${R.shown}, not ${want}`);
    const first = kind === 'T' ? -mpc * amt : kind === 'BB' ? amt - mpc * amt : amt;
    if (!close(R.rounds[0].net, first, 1e-9, 1e-9)) errs.push(`ripple ${kind} mpc ${mpc}: first round ${R.rounds[0].net}, want ${first}`);
  }
  for (const mpc of model.MPCS) for (const kind of ['recessionary', 'inflationary']) for (const tool of ['G', 'T']) {
    const g0 = model.gap(kind, 80, mpc, tool, 0), m = tool === 'G' ? K(mpc) : KT(mpc), need = (kind === 'recessionary' ? 80 : -80) / m;
    if (!close(g0.need, need, 1e-9, 1e-9)) errs.push(`gap ${kind} ${tool} mpc ${mpc}: need ${g0.need}, want ${need}`);
    const g1 = model.gap(kind, 80, mpc, tool, need);
    if (!close(g1.frac, 1, 1e-9, 1e-9)) errs.push(`gap ${kind} ${tool} mpc ${mpc}: the needed change does not close the gap (${g1.frac})`);
    const wantDir = (kind === 'recessionary') === (tool === 'G') ? 'raise' : 'cut';
    if (g0.dir !== wantDir) errs.push(`gap ${kind} ${tool}: direction ${g0.dir}, want ${wantDir}`);
  }
  for (const rr of model.RRS) for (const scn of Object.keys(model.SCN)) {
    const X = 1000, m = model.money(scn, rr, X, 600);
    const ex = scn === 'cash' || scn === 'buyPublic' ? X * (1 - rr) : scn === 'buyBank' ? X : -X;
    const dm = (scn === 'buyPublic' ? X : 0) + ex / rr;
    if (!close(m.ex, ex, 1e-9, 1e-9)) errs.push(`money ${scn} rr ${rr}: excess ${m.ex}, want ${ex}`);
    if (!close(m.dm, dm, 1e-9, 1e-9)) errs.push(`money ${scn} rr ${rr}: change ${m.dm}, want ${dm}`);
    const sum = m.rounds.reduce((s, v) => s + v, 0);
    if (!close(sum, ex / rr, 1e-6, 1e-6)) errs.push(`money ${scn} rr ${rr}: the loan rounds add to ${sum}, not ${ex / rr}`);
  }
  return errs;
}

/* The keys of one problem, recomputed. Returns the problems found. */
export function recheckProblem(p, c) {
  const errs = [], v = p.values, step = k => p.steps.find(s => s.key === k), ans = k => step(k).cell.answer, opt0 = k => strip(step(k).options[0]);
  const all = [p.text, ...p.solution, ...p.steps.flatMap(s => [s.label, ...(s.options || []), ...(s.why || [])])].map(strip).join(' ');
  if (c && c.topic !== TOPIC[p.type]) errs.push(`type ${p.type} belongs to topic ${TOPIC[p.type]}, the context says ${c.topic}`);
  for (const s of p.steps) if (s.kind === 'choice' && s.correct !== 0) errs.push(`step ${s.key}: the key is not option 0`);
  if (p.type === 'multiplier') {
    if (!close(ans('k'), K(v.mpc), 1e-9)) errs.push(`spending multiplier ${ans('k')}, want ${K(v.mpc)}`);
    if (!close(ans('kt'), KT(v.mpc), 1e-9)) errs.push(`tax multiplier ${ans('kt')}, want ${KT(v.mpc)}`);
    if (!(ans('kt') < 0)) errs.push('the tax multiplier must be negative');
    const net = v.amt * K(v.mpc) + v.amt * KT(v.mpc);
    if (!close(net, v.amt, 1e-9)) errs.push('equal changes in purchases and taxes do not net to the change');
    if (!opt0('bb').includes(`rises by $${v.amt} billion`)) errs.push(`the balanced change keys "${opt0('bb')}"`);
    if (v.giveMps ? !p.text.includes(`MPS = ${String(+(1 - v.mpc).toFixed(2))}`) : !p.text.includes(`MPC = ${v.mpc}`)) errs.push('the text does not state the MPC or MPS used');
  }
  if (p.type === 'total') {
    const tool = v.cs[0] === 'T' ? 'T' : 'G', sign = v.cs[1] === '+' ? 1 : -1, m = tool === 'G' ? K(v.mpc) : KT(v.mpc);
    if (!close(ans('m'), Math.abs(m), 1e-9)) errs.push(`multiplier size ${ans('m')}, want ${Math.abs(m)}`);
    const dy = sign * v.amt * m;
    if (!close(ans('dy'), dy, 1e-9)) errs.push(`change in real GDP ${ans('dy')}, want ${dy}`);
    const up = (tool === 'G' && sign > 0) || (tool === 'T' && sign < 0);
    if ((ans('dy') > 0) !== up) errs.push(`case ${v.cs}: real GDP should ${up ? 'rise' : 'fall'}`);
    if (!p.text.includes(`$${v.amt} billion`)) errs.push('the text does not state the change');
  }
  if (p.type === 'gap') {
    const rec = v.y < v.yf, size = Math.abs(v.yf - v.y), m = v.tool === 'G' ? K(v.mpc) : KT(v.mpc);
    if (rec !== (v.kind === 'recessionary')) errs.push(`real GDP ${v.y} vs ${v.yf}: the gap is ${rec ? 'recessionary' : 'inflationary'}, not ${v.kind}`);
    if (!opt0('kind').startsWith(rec ? 'A recessionary gap' : 'An inflationary gap') || !opt0('kind').includes(`$${size.toLocaleString('en-US')} billion`)) errs.push(`gap kind keyed "${opt0('kind')}"`);
    const dir = v.tool === 'G' ? (rec ? 'Increase' : 'Decrease') : (rec ? 'Cut' : 'Raise');
    if (!opt0('dir').startsWith(dir)) errs.push(`direction keyed "${opt0('dir')}", want ${dir}`);
    if (!close(ans('m'), Math.abs(m), 1e-9)) errs.push(`multiplier ${ans('m')}, want ${Math.abs(m)}`);
    if (!close(ans('size'), size / Math.abs(m), 1e-9)) errs.push(`policy change ${ans('size')}, want ${size / Math.abs(m)} (the gap divided)`);
    if (!close(ans('size') * Math.abs(m), size, 1e-9)) errs.push('the policy change times the multiplier is not the gap');
    const slip = step('size').cell.mistakes.find(x => close(x.value, size * Math.abs(m), 1e-9));
    if (Math.abs(m) !== 1 && (!slip || !/multipl/i.test(slip.why) || !/divide/i.test(slip.why))) errs.push('the multiply-the-gap slip is not named');
  }
  if (p.type === 'money') {
    const X = v.X, rr = v.rr, ex = v.scn === 'cash' || v.scn === 'buyPublic' ? X - X * rr : v.scn === 'buyBank' ? X : -X;
    const dm = (v.scn === 'buyPublic' ? X : 0) + ex / rr;
    if (!close(ans('ex'), ex, 1e-9)) errs.push(`excess reserves ${ans('ex')}, want ${ex}`);
    if (!close(ans('mm'), 1 / rr, 1e-9)) errs.push(`money multiplier ${ans('mm')}, want ${1 / rr}`);
    if (!close(ans('dm'), dm, 1e-9)) errs.push(`change in the money supply ${ans('dm')}, want ${dm}`);
    if (!/limited-reserves model/.test(p.text)) errs.push('a money multiplier problem must say it uses the limited-reserves model');
    if (!/ample reserves/.test(all)) errs.push('the worked solution must contrast the ample-reserves framework');
  }
  return errs;
}

export function check(data, map) {
  const errs = [];
  frame(data, 'multiplier-lab', 'skill', map, errs);
  const { model } = runtime('multiplier-lab');
  if (!model || typeof model.generate !== 'function') { errs.push('the model ApMacroMath.multiplierLab is not registered (macroeconomics/assets/tools/math/multiplier-lab.js)'); return errs; }
  if (model.stub) { errs.push('the model is still the Phase 0 stub'); return errs; }
  for (const c of data.contexts || []) {
    if (!Array.isArray(c.types) || !c.types.length) { errs.push(`context ${c.id}: list its types`); continue; }
    for (const t of c.types) {
      if (!TYPES.includes(t)) errs.push(`context ${c.id}: unknown type "${t}" (one of ${TYPES.join(', ')})`);
      else if (TOPIC[t] !== c.topic) errs.push(`context ${c.id}: type ${t} belongs to topic ${TOPIC[t]}, not ${c.topic}`);
    }
  }
  errs.push(...exploreProblems(model));
  sweep(data, errs, (r, c, t) => model.generate(r, c, t), (p, c, w) => { for (const e of recheckProblem(p, c)) errs.push(`${w}: ${e}`); }, c => (c.types || []).filter(t => TYPES.includes(t)));
  return errs;
}
export function recheck(p, c) { return recheckProblem(p, c); }
