/* Validator for environmental-science/data/tools/dose-response.json (Dose and response), run
   by scripts/check-apenv-content.mjs. OWNED BY THIS TOOL ONLY (builder T4).
   check(data, map) -> problems: the frame, then 300 problems per context and
   type regenerated with the model the page runs (ApEnvMath.doseResponse),
   and every key recomputed independently from the problem's givens with
   ApEnvCalc (never through the model): LD50 read off the plotted points
   (ApEnvCalc.ld50), the threshold as the last 0% point, the whole-body dose
   (doseFor), ppm up the food chain (biomagnify) and the magnification
   factor, and the "more toxic" key as the lower LD50. The curves must rise
   (never fall as the dose rises) and pass through exactly 50%. */
import { frame, sweep, close } from './_drills.mjs';
import { runtime } from './_shared.mjs';

export const TYPES = ['read', 'dose', 'magnify', 'compare'];
const stepOf = (p, k) => p.steps.find(s => s.key === k);
const keyOf = s => s.kind === 'unit' ? s.cell.numeric.answer : s.cell.answer;
const rightText = s => s.options[s.correct];

function curveOk(pts, where, errs) {
  if (!Array.isArray(pts) || pts.length < 4) { errs.push(`${where}: a curve needs at least 4 points`); return; }
  for (let i = 1; i < pts.length; i++) {
    if (!(pts[i][0] > pts[i - 1][0])) errs.push(`${where}: doses must increase`);
    if (pts[i][1] < pts[i - 1][1]) errs.push(`${where}: the response falls as the dose rises`);
  }
  if (pts[0][0] !== 0 || pts[0][1] !== 0) errs.push(`${where}: the curve must start at dose 0, 0%`);
  if (!pts.some(p => p[1] === 50)) errs.push(`${where}: no point at exactly 50%`);
  if (pts.some(p => p[1] < 0 || p[1] > 100)) errs.push(`${where}: a response outside 0 to 100%`);
}

export function recheck(p, c, w, errs) {
  const { Calc, Expr } = runtime('dose-response');
  const g = p.given || {};
  const need = (cond, msg) => { if (!cond) errs.push(`${w}: ${msg}`); };
  const setupVal = s => { const r = Expr.evaluate(s.cell.setup.answer, {}, []); return r.ok ? r : null; };
  if (p.type === 'read') {
    curveOk(g.points, w, errs);
    const L = Calc.evaluate({ fn: 'ld50', args: [g.points] });
    need(close(keyOf(stepOf(p, 'ld50')), L, 1e-9, 1e-9), `LD50 key is not ${L}`);
    let thr = 0; for (const q of g.points) { if (q[1] === 0) thr = q[0]; else break; }
    need(close(keyOf(stepOf(p, 'threshold')), thr, 1e-9, 1e-9), `threshold key is not ${thr}`);
    need(thr < L, 'the threshold must be below the LD50');
    const t = rightText(stepOf(p, 'toxic'));
    const mine = c.chem.charAt(0).toUpperCase() + c.chem.slice(1);
    need(L < g.other ? t.startsWith(mine + ', because it kills half') : t.startsWith('The other chemical, because it kills half'), 'the more-toxic key is not the lower LD50');
  } else if (p.type === 'dose') {
    const tot = Calc.evaluate({ fn: 'doseFor', args: [g.ld50, g.kg] });
    need(close(keyOf(stepOf(p, 'answer')), tot), `dose key is not ${tot}`);
    const r = setupVal(stepOf(p, 'setup'));
    need(r && close(r.value, tot, 1e-9, 1e-9) && Expr.dimText(r.dims) === 'mg', 'the setup key is not the dose in mg');
    const pk = Calc.evaluate({ fn: 'div', args: [g.ate, g.kg] });
    need(close(keyOf(stepOf(p, 'perkg')), pk), `per-kg key is not ${pk}`);
    const m = rightText(stepOf(p, 'means'));
    need((pk >= g.ld50) === /at least the LD50/.test(m), 'the meaning key disagrees with the dose');
  } else if (p.type === 'magnify') {
    const top = Calc.evaluate({ fn: 'biomagnify', args: [g.c0, g.f, g.lv] });
    need(close(keyOf(stepOf(p, 'top')), top), `top key is not ${top}`);
    const r = setupVal(stepOf(p, 'topset'));
    need(r && close(r.value, top, 1e-9, 1e-15) && Expr.dimText(r.dims) === 'ppm', 'the setup key is not the ppm at the top');
    const mid = Calc.evaluate({ fn: 'biomagnify', args: [g.c0, g.f, 1] });
    need(close(keyOf(stepOf(p, 'factor')), Calc.evaluate({ fn: 'magnification', args: [top, mid] })), 'the magnification key is wrong');
    need(/^Biomagnification: the concentration rises at each trophic level/.test(rightText(stepOf(p, 'word'))), 'the word key is not biomagnification across levels');
  } else if (p.type === 'compare') {
    const lo = Math.min(g.L1, g.L2), hi = Math.max(g.L1, g.L2), lowName = g.L1 < g.L2 ? g.names[0] : g.names[1];
    need(rightText(stepOf(p, 'which')).toLowerCase().startsWith(lowName.toLowerCase() + ', the one with the lower'), `more-toxic key is not ${lowName}`);
    need(close(keyOf(stepOf(p, 'times')), Calc.evaluate({ fn: 'div', args: [hi, lo] })), 'the times key is wrong');
  } else errs.push(`${w}: unknown type ${p.type}`);
}

export function check(data, map) {
  const errs = [];
  frame(data, 'dose-response', 'simulator', map, errs);
  const { model, Calc } = runtime('dose-response');
  if (!model) errs.push('no model registered (ApEnvMath.doseResponse)');
  else if (!model.stub) {
    for (const c of data.contexts || []) for (const t of c.types || []) if (!TYPES.includes(t)) errs.push(`context ${c.id}: unknown type ${t}`);
    if (!data.explore || !(data.explore.c0 > 0) || !Array.isArray(data.explore.factors)) errs.push('explore needs c0 and factors');
    model.CHEMICALS.forEach(ch => curveOk(ch.points, `chemical ${ch.name}`, errs));
    const L = model.CHEMICALS.map(ch => Calc.evaluate({ fn: 'ld50', args: [ch.points] }));
    if (!(L[0] < L[1] && L[1] < L[2])) errs.push('the explore chemicals should run from most to least toxic');
    sweep(data, errs, (r, c, t) => model.generate(r, c, t), (p, c, w) => recheck(p, c, w, errs), c => c.types || TYPES);
  }
  return errs;
}
