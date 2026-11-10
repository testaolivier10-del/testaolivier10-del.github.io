/* Validator for microeconomics/data/tools/externality-lab.json (Externality Lab), run by
   scripts/check-apmicro-content.mjs. OWNED BY THIS TOOL ONLY (builder T4).
   check(data, map) -> problems: the frame, each context's fields, the Explore
   model (every type, size and policy: market and efficient quantities, the
   loss left, and the shading spec agreeing with the picture), then 300
   problems per context and type regenerated with the model the page runs
   (ApMicroMath.externalityLab), every key recomputed with this file's own
   arithmetic: the quantities, the deadweight loss (1/2 x base x height), the
   corrective policy and its size, the efficient point (ApMicroGraph.named
   against own algebra), the shift, and the public good's summed benefits. */
import { frame, sweep, close } from './_drills.mjs';
import { runtime } from './_shared.mjs';

export const TYPES = ['quantity', 'dwl', 'fix', 'public'];
const EXTS = ['neg-prod', 'pos-prod', 'pos-cons', 'neg-cons'];
// Own table: the side the externality is on, whether the market overproduces, the corrective policy.
export const OWN = {
  'neg-prod': { curve: 'S', over: true, dir: 'left', policy: 'A per-unit tax on producers' },
  'pos-prod': { curve: 'S', over: false, dir: 'right', policy: 'A per-unit subsidy to producers' },
  'pos-cons': { curve: 'D', over: false, dir: 'right', policy: 'A per-unit subsidy to consumers' },
  'neg-cons': { curve: 'D', over: true, dir: 'left', policy: 'A per-unit tax on consumers' }
};
const step = (p, k) => p.steps.find(s => s.key === k);
// D: P = 10 - Q, S: P = Q (graph units); the social curve gap away; efficient Q = 5 -/+ gap/2.
export const effQ = (ext, gap) => 5 + (OWN[ext].over ? -gap : gap) / 2;

export function recheck(p, c, w, errs) {
  const { Graph, Grade } = runtime('externality-lab');
  const need = (ok, m) => { if (!ok) errs.push(`${w}: ${m}`); };
  if (p.type === 'public') {
    const g = p.given, sums = [0, 1, 2, 3].map(u => g.people.reduce((a, q) => a + q.mb[u], 0));
    let eff = 0; sums.forEach((s, i) => { if (s >= g.mc) eff = i + 1; });
    need(close(step(p, 'sum').cell.answer, sums[g.k - 1]), 'summed benefit key');
    need(step(p, 'eff').cell.answer === eff && eff >= 1, `efficient units, own ${eff}`);
    const alone = Math.max(...g.people.map(q => q.mb.filter(v => v >= g.mc).length));
    need(alone < eff, 'one person alone would already buy the efficient amount');
    for (const q of g.people) need(q.mb.every((v, i) => i === 0 || v <= q.mb[i - 1]), 'marginal benefit rises');
    return;
  }
  const n = p.given, o = OWN[c.ext], Qm = 5 * n.qk, Qe = effQ(c.ext, n.gap) * n.qk, ext = n.gap * n.pk, dwl = 0.5 * Math.abs(Qm - Qe) * ext;
  need(p.text.includes(`$${ext} `) && p.text.includes(`sells ${Qm} `), 'the story states the wrong numbers');
  need(o.over ? Qm > Qe : Qm < Qe, 'market vs efficient quantity');
  if (p.type === 'quantity') {
    const pt = step(p, 'point'), at = pt.spec.key.point.at, want = at === 'efficient' ? [effQ(c.ext, n.gap), effQ(c.ext, n.gap) + (c.ext === 'neg-prod' ? n.gap : c.ext === 'pos-prod' ? -n.gap : 0) + (5 - effQ(c.ext, n.gap)) * 0] : [5, 5];
    const got = Graph.named(pt.spec, {}, at);
    need(got && close(got[0], want[0], 0, 1e-6), `the ${at} point's quantity`);
    if (at === 'efficient') need(!Grade.graph(pt.spec, { shifts: {}, eq: null, point: [5, 5], labels: {}, line: null, shade: [] }).correct, 'the market point is graded right as efficient');
    need(step(p, 'type').correct === EXTS.indexOf(c.ext), 'the type key');
    need(step(p, 'compare').options[0].includes(o.over ? 'more' : 'less') && step(p, 'compare').options[0].includes(String(Qe)), 'the comparison key');
  } else if (p.type === 'dwl') {
    need(close(step(p, 'size').cell.answer, dwl), `DWL key, own ${dwl}`);
    const sp = step(p, 'shade').spec, R = Graph.areas(sp).regions;
    need(R.dwl && R.dwl.length === 1, 'the deadweight loss is not one triangle');
    const big = c.ext.startsWith('neg') && c.ext.endsWith('prod') || c.ext === 'neg-cons' ? 'ext-cost' : 'ext-benefit';
    need(!Grade.graph(sp, { shifts: {}, eq: null, point: null, labels: {}, line: null, shade: R[big] || [] }).correct, 'the whole external cost or benefit is graded right');
    need(step(p, 'point').options[0].startsWith(`Its tip is at the efficient quantity, ${Qe}`), 'the direction key');
  } else if (p.type === 'fix') {
    const pol = step(p, 'policy');
    need(pol.options[pol.correct] === o.policy, 'the policy key');
    need(close(step(p, 'amount').cell.answer, ext), 'the per-unit amount equals the external cost or benefit');
    const k = step(p, 'shift').spec.key.shifts[0];
    need(k.curve === o.curve && k.dir === o.dir, 'the shift key');
    const sp = step(p, 'shift').spec, e = Graph.eq(sp, Graph.keyOffsets(sp));
    need(e && close(e[0], effQ(c.ext, n.gap), 0, 1e-6), 'the key shift does not land on the efficient quantity');
  }
}

export function check(data, map) {
  const errs = [];
  frame(data, 'externality-lab', 'simulator', map, errs);
  for (const c of data.contexts || []) {
    if (!Array.isArray(c.types) || !c.types.length || c.types.some(t => !TYPES.includes(t))) errs.push(`context ${c.id}: types from ${TYPES.join(', ')}`);
    if ((c.types || []).includes('public')) { if (!Array.isArray(c.people) || c.people.length !== 3 || !c.unit || !c.unitOne) errs.push(`context ${c.id}: three people, unit and unitOne`); }
    else if (!EXTS.includes(c.ext) || !c.one || !c.unit || !c.who || !Array.isArray(c.pk) || !Array.isArray(c.qk)) errs.push(`context ${c.id}: ext, one, unit, who, pk, qk`);
  }
  const { model, Graph } = runtime('externality-lab');
  if (!model || model.stub) { errs.push('ApMicroMath.externalityLab is not built'); return errs; }
  // Explore: every type, size and policy; the shading spec's market and efficient quantities match the picture's.
  for (const t of EXTS) for (const gap of [1, 2, 3]) for (let pol = 0; pol <= gap + 1; pol++) {
    const st = model.state(t, gap, pol), A = model.specA(t, gap, pol), B = model.specB(t, gap, pol), w = `explore ${t} gap ${gap} policy ${pol}`;
    const mA = Graph.eq(A, Graph.fixedOffsets(A)), eA = Graph.named(A, {}, 'efficient');
    if (!close(mA[0], st.market, 0, 1e-6) || !close(eA[0], effQ(t, gap), 0, 1e-6) || !close(st.efficient, effQ(t, gap), 0, 1e-6)) errs.push(`${w}: market or efficient quantity`);
    const left = Math.abs(gap - pol), dwl = 0.25 * left * left;
    if (!close(st.dwl, dwl, 1e-9, 1e-9)) errs.push(`${w}: DWL ${st.dwl}, own ${dwl}`);
    if (!left) { if (B) errs.push(`${w}: a loss is shaded when none is left`); continue; }
    const mB = Graph.eq(B, Graph.fixedOffsets(B)), eB = Graph.named(B, Graph.fixedOffsets(B), 'efficient');
    if (!close(mB[0], st.market, 0, 1e-6) || !close(eB[0], effQ(t, gap), 0, 1e-6)) errs.push(`${w}: the shading spec's quantities differ from the picture`);
    const cells = Graph.areas(B).cells.filter(x => Graph.regionCells(B, 'dwl').includes(x.id));
    const area = cells.reduce((a, x) => a + Graph.polyArea(x.poly), 0);
    if (!close(area, dwl, 0.03, 0.01)) errs.push(`${w}: shaded area ${area}, own ${dwl}`);
  }
  if (errs.length) return errs;
  sweep(data, errs, (r, c, t) => model.generate(r, c, t), (p, c, w) => recheck(p, c, w, errs), c => c.types);
  return errs;
}
