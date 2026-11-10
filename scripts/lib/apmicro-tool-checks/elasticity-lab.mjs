/* Validator for microeconomics/data/tools/elasticity-lab.json (Elasticity Lab), run by
   scripts/check-apmicro-content.mjs. OWNED BY THIS TOOL ONLY (builder T3).
   check(data, map) -> problems: the shared frame, then the drill sweep
   (_drills.mjs: 300 problems per context and type), every key recomputed
   here with this file's own arithmetic (recheck): the straight demand line
   Q = (choke - P) kQ / kP, percent changes from the starting values or the
   midpoint, |Ed|, TR = P x Q, income and cross-price elasticity with their
   signs, the class each implies (elastic above the midpoint, normal or
   inferior, substitutes or complements) and the direction each shift step
   keys, by this file's own rules, not the model's. A shift step is also
   graded on the planted slips (supply moved, demand moved the wrong way). */
import { frame, sweep, close } from './_drills.mjs';
import { runtime } from './_shared.mjs';

export const TYPES = ['coef', 'trtest', 'range', 'income', 'cross'];
const pct = (a, b) => (b - a) / a * 100;
const mpct = (a, b) => (b - a) / ((a + b) / 2) * 100;

export function recheck(p, ctx, w) {
  const errs = [];
  const { Graph, Grade } = runtime('elasticity-lab');
  if (!ctx.types.includes(p.type)) errs.push(`${w}: type ${p.type} is not one of the context's types`);
  if (p.topic !== ctx.topic) errs.push(`${w}: topic ${p.topic} is not the context's ${ctx.topic}`);
  const step = k => p.steps.find(s => s.key === k), want = (k, x) => { const s = step(k); if (!s) errs.push(`${w}: no step ${k}`); else if (!close(s.cell.answer, x, 1e-6, 1e-6)) errs.push(`${w}: step ${k} keyed ${s.cell.answer}, by hand ${x}`); };
  const pick = k => { const s = step(k); return s ? s.options[s.correct] : ''; };
  const a = p.answer, qOf = (s, P) => (10 * s.kP - P) * s.kQ / s.kP;
  if (p.type === 'coef') {
    const q1 = qOf(a.s, a.p1), q2 = qOf(a.s, a.p2), f = a.method === 'midpoint' ? mpct : pct;
    const pq = f(q1, q2), pp = f(a.p1, a.p2), e = Math.abs(pq / pp);
    want('pq', pq); want('pp', pp); want('e', e);
    if (pick('class') !== (e > 1 ? 'Elastic: |Ed| is greater than 1' : 'Inelastic: |Ed| is less than 1')) errs.push(`${w}: class keyed "${pick('class')}" for |Ed| ${e}`);
    const e2 = Math.abs((a.method === 'midpoint' ? pct : mpct)(q1, q2) / (a.method === 'midpoint' ? pct : mpct)(a.p1, a.p2));
    if ((e > 1) !== (e2 > 1)) errs.push(`${w}: the two methods disagree on the class`);
    // Above the midpoint price both points: elastic (a straight line).
    const midP = 5 * a.s.kP;
    if (Math.min(a.p1, a.p2) >= midP && !(e > 1)) errs.push(`${w}: above the midpoint but not elastic`);
  }
  if (p.type === 'trtest') {
    const tr1 = a.pa * qOf(a.s, a.pa), tr2 = a.pb * qOf(a.s, a.pb);
    want('tr1', tr1); want('tr2', tr2);
    if (!pick('dir').includes(tr2 > tr1 ? 'rises' : 'falls')) errs.push(`${w}: direction keyed "${pick('dir')}"`);
    const opposite = (a.pb - a.pa) * (tr2 - tr1) < 0;
    if (pick('class') !== (opposite ? 'Elastic: price and total revenue move in opposite directions' : 'Inelastic: price and total revenue move in the same direction')) errs.push(`${w}: class keyed "${pick('class')}"`);
  }
  if (p.type === 'range') {
    want('mid', 5 * a.s.kP); want('qmax', 5 * a.s.kQ);
    const P = a.ask === 'A' ? a.pA : a.pB, el = P > 5 * a.s.kP;
    if (pick('class') !== (el ? 'Elastic: |Ed| is greater than 1' : 'Inelastic: |Ed| is less than 1')) errs.push(`${w}: class keyed "${pick('class')}"`);
    if (!pick('advice').startsWith(el ? 'Cut' : 'Raise')) errs.push(`${w}: advice keyed "${pick('advice')}"`);
  }
  if (p.type === 'income' || p.type === 'cross') {
    const e = p.type === 'income' ? pct(a.q1, a.q2) / pct(a.i1, a.i2) : pct(a.q1, a.q2) / pct(a.py1, a.py2);
    want('e', e);
    const cls = pick('class');
    if (p.type === 'income') {
      const exp = e < 0 ? 'An inferior good' : e > 1 ? 'A normal good and a luxury' : 'A normal good and a necessity';
      if (!cls.startsWith(exp)) errs.push(`${w}: class keyed "${cls}", expected ${exp}`);
    } else {
      const exp = Math.abs(e) < 1e-9 ? 'Unrelated' : e > 0 ? 'Substitutes' : 'Complements: the cross-price elasticity is negative';
      if (!cls.startsWith(exp)) errs.push(`${w}: class keyed "${cls}", expected ${exp}`);
    }
    const g = step('graph');
    if (Math.abs(e) > 1e-9) {
      if (!g) { errs.push(`${w}: no shift step`); return errs; }
      const dir = Math.sign(e) * a.next > 0 ? 'right' : 'left', k = g.spec.key.shifts[0];
      if (k.curve !== 'D' || k.dir !== dir) errs.push(`${w}: shift keyed ${k.curve} ${k.dir}, expected D ${dir}`);
      const d = dir === 'right' ? 1 : -1;
      for (const [why, sh] of [['supply moved', { S: d }], ['demand the wrong way', { D: -d }]]) {
        const r = Grade.graph(g.spec, { shifts: sh, eq: null, point: null, labels: {}, line: null, shade: [] });
        if (r.correct) errs.push(`${w}: a planted slip (${why}) is graded right`); else if (!r.slip) errs.push(`${w}: the slip (${why}) has no feedback line`);
      }
      if (!Grade.graph(g.spec, { shifts: { D: d }, eq: null, point: null, labels: {}, line: null, shade: [] }).correct) errs.push(`${w}: the key shift grades wrong`);
      void Graph;
    } else if (g) errs.push(`${w}: an unrelated good has a shift step`);
  }
  return errs;
}

export function check(data, map) {
  const errs = [];
  frame(data, 'elasticity-lab', 'simulator', map, errs);
  const { model } = runtime('elasticity-lab');
  if (!model || model.stub) { errs.push('ApMicroMath.elasticityLab is not built'); return errs; }
  for (const c of data.contexts || []) for (const t of c.types || []) if (!TYPES.includes(t)) errs.push(`context ${c.id}: unknown type ${t}`);
  sweep(data, errs, (r, c, t) => model.generate(r, c, t), (p, c, w) => errs.push(...recheck(p, c, w)), c => c.types || []);
  return errs;
}
