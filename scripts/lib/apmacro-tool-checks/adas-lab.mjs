/* Validator for macroeconomics/data/tools/adas-lab.json (AD-AS lab), run by
   scripts/check-apmacro-content.mjs. OWNED BY THIS TOOL ONLY (builder T4).
   check(data, map) -> problems: the shared frame, then the drill sweep
   (_drills.mjs: 300 problems per context and type), every key recomputed
   here with this file's own rules (recheck): its own table of which curve
   each cause shifts, its own AD-AS arithmetic (straight lines of slope -1
   and +1 crossing at x = 5 + (a + s) / 2, y = 5 + (a - s) / 2), and every
   graph step graded by ApMacroGrade.graph on the key (right) and on the
   reader-report slips (wrong curve, wrong direction, AD in a
   self-adjustment: wrong). */
import { frame, sweep, close } from './_drills.mjs';
import { runtime } from './_shared.mjs';

export const TYPES = ['shock', 'selfadjust', 'gap', 'phillips'];

// Which curve each cause shifts, and which way (+1 right, -1 left): this
// validator's own table, not the model's.
const CAUSE = {
  'confidence-up': ['AD', 1], 'gov-up': ['AD', 1], 'tax-cut': ['AD', 1], 'abroad-up': ['AD', 1], 'expect-up': ['AD', 1],
  'wealth-down': ['AD', -1], 'gov-down': ['AD', -1], 'tax-up': ['AD', -1], 'abroad-down': ['AD', -1], 'rates-up': ['AD', -1],
  'oil-up': ['SRAS', -1], 'wages-up': ['SRAS', -1], drought: ['SRAS', -1], 'expect-infl': ['SRAS', -1],
  'oil-down': ['SRAS', 1], 'inputs-down': ['SRAS', 1], subsidy: ['SRAS', 1],
};
const crossing = (a, s) => [5 + (a + s) / 2, 5 + (a - s) / 2];
const word = d => (d > 0 ? 'right' : 'left');

function gradeSpec(Graph, Grade, spec, w, errs, wrongs) {
  const bad = Graph.check(spec);
  if (bad.length) { errs.push(`${w}: graph spec: ${bad[0]}`); return; }
  const off = Graph.keyOffsets(spec);
  const resp = { shifts: off, eq: Graph.eq(spec, off), point: null, labels: {} };
  if ((spec.do || []).includes('point')) resp.point = wrongs.point;
  if (!Grade.graph(spec, resp).correct) errs.push(`${w}: the graph key is graded wrong`);
  for (const [why, r] of Object.entries(wrongs.list || {})) {
    const g = Grade.graph(spec, { labels: {}, point: null, eq: null, ...r });
    if (g.correct) errs.push(`${w}: a planted slip (${why}) is graded right`);
    else if (!g.slip) errs.push(`${w}: the slip (${why}) has no feedback line`);
  }
}

export function recheck(p, ctx, w) {
  const errs = [];
  const { Graph, Grade } = runtime('adas-lab');
  const step = k => p.steps.find(s => s.key === k);
  const pick = k => { const s = step(k); return s ? s.options[s.correct] : ''; };
  if (!ctx.types.includes(p.type)) errs.push(`${w}: type ${p.type} is not one of the context's types`);
  if (p.topic !== ctx.topic) errs.push(`${w}: topic ${p.topic} is not the context's ${ctx.topic}`);
  for (const s of p.steps) if (s.kind === 'graph') {
    if (!p.figure || JSON.stringify(p.figure.spec) !== JSON.stringify(s.spec)) errs.push(`${w}: graph step ${s.key} grades a different graph from the one drawn`);
  }
  if (p.type === 'gap') {
    const a = p.answer, gap = a.Y - a.yf, cyc = a.u - a.un;
    if (!close(step('gap').cell.answer, gap)) errs.push(`${w}: gap ${step('gap').cell.answer} != ${gap}`);
    if (!close(step('cyclical').cell.answer, cyc, 1e-6, 1e-9)) errs.push(`${w}: cyclical ${step('cyclical').cell.answer} != ${cyc}`);
    if (Math.sign(gap) !== -Math.sign(cyc)) errs.push(`${w}: output and unemployment gaps disagree in sign`);
    const rec = gap < 0;
    if (!pick('kind').includes(rec ? 'recessionary' : 'inflationary')) errs.push(`${w}: gap kind keyed "${pick('kind')}"`);
    if (!pick('adjust').startsWith(rec ? 'Nominal wages fall, so SRAS shifts right' : 'Nominal wages rise, so SRAS shifts left')) errs.push(`${w}: adjustment keyed "${pick('adjust')}"`);
    const fig = p.figure && p.figure.spec;
    if (!fig || fig.kind !== 'adas' || Math.sign((fig.start || {}).AD || 0) !== Math.sign(gap)) errs.push(`${w}: the figure does not show the gap`);
    return errs;
  }
  const c = CAUSE[p.shock];
  if (!c) { errs.push(`${w}: unknown cause "${p.shock}"`); return errs; }
  const [curve, dir] = c, other = curve === 'AD' ? 'SRAS' : 'AD';
  const a = curve === 'AD' ? dir : 0, s = curve === 'SRAS' ? dir : 0;
  const [x1, y1] = crossing(a, s);
  if (p.type === 'shock') {
    const g = step('graph').spec, k = (g.key.shifts || [])[0] || {};
    if (g.key.shifts.length !== 1 || k.curve !== curve || k.dir !== word(dir)) errs.push(`${w}: graph key ${k.curve} ${k.dir}, expected ${curve} ${word(dir)}`);
    const wrongEq = (cv, d) => { const sh = { [cv]: d }; return { shifts: sh, eq: Graph.eq(g, sh) }; };
    gradeSpec(Graph, Grade, g, w, errs, { list: { 'the other curve': wrongEq(other, dir), 'the wrong direction': wrongEq(curve, -dir), 'E2 left on E1': { shifts: { [curve]: dir }, eq: [5, 5] } } });
    const pl = y1 > 5 ? 'rises' : 'falls', y = x1 > 5 ? 'rises' : 'falls';
    if (pick('outcome') !== `The price level ${pl} and real GDP ${y}`) errs.push(`${w}: outcome keyed "${pick('outcome')}", expected price level ${pl}, real GDP ${y}`);
    if (!pick('gap').toLowerCase().includes(x1 < 5 ? 'recessionary' : 'inflationary')) errs.push(`${w}: gap keyed "${pick('gap')}"`);
  } else if (p.type === 'selfadjust') {
    const g = step('graph').spec, rec = x1 < 5, k = (g.key.shifts || [])[0] || {};
    if ((g.start || {})[curve] !== dir) errs.push(`${w}: the starting gap is not the cause's shift`);
    if (g.key.shifts.length !== 1 || k.curve !== 'SRAS' || k.dir !== (rec ? 'right' : 'left')) errs.push(`${w}: self-adjustment keyed ${k.curve} ${k.dir}`);
    // After the key the economy is back on LRAS (x = 5).
    const ks = s + (rec ? 1 : -1), [x2] = crossing(a, ks);
    if (!close(x2, 5)) errs.push(`${w}: the key does not return output to full employment (x = ${x2})`);
    gradeSpec(Graph, Grade, g, w, errs, { list: { 'self-adjustment through AD': { shifts: { AD: rec ? 1 : -1 }, eq: Graph.eq(g, { AD: rec ? 1 : -1 }) }, 'SRAS the wrong way': { shifts: { SRAS: rec ? -1 : 1 }, eq: Graph.eq(g, { SRAS: rec ? -1 : 1 }) } } });
    if (!pick('wages').startsWith(rec ? 'Nominal wages and input prices fall' : 'Nominal wages and input prices rise')) errs.push(`${w}: wages keyed "${pick('wages')}"`);
    if (pick('adjust') !== `The price level ${rec ? 'falls' : 'rises'} and real GDP ${rec ? 'rises' : 'falls'}`) errs.push(`${w}: adjustment keyed "${pick('adjust')}"`);
    if (!/natural rate of unemployment/.test(pick('unemp'))) errs.push(`${w}: unemployment keyed "${pick('unemp')}"`);
    if (!p.text.includes(rec ? 'recessionary gap' : 'inflationary gap')) errs.push(`${w}: the text names the wrong gap`);
  } else if (p.type === 'phillips') {
    const g = step('graph').spec;
    const expMove = curve === 'AD' ? (dir > 0 ? 'A move up along SRPC' : 'A move down along SRPC') : (dir < 0 ? 'SRPC shifts right' : 'SRPC shifts left');
    if (!pick('move').startsWith(expMove)) errs.push(`${w}: move keyed "${pick('move')}", expected ${expMove}`);
    if (curve === 'AD') {
      // The short-run point: unemployment 10 - x, inflation y, on SRPC at 5.
      const pt = [10 - x1, y1], opp = [10 - crossing(-a, 0)[0], crossing(-a, 0)[1]];
      if (!close(pt[1], 5 - (pt[0] - 5))) errs.push(`${w}: the Phillips point is off SRPC`);
      gradeSpec(Graph, Grade, g, w, errs, { point: pt, list: { 'the opposite way along SRPC': { point: opp }, 'off the curve': { point: [pt[0], pt[1] + 1.5] } } });
    } else {
      const k = (g.key.shifts || [])[0] || {};
      if (k.curve !== 'SRPC' || k.dir !== (dir < 0 ? 'right' : 'left')) errs.push(`${w}: Phillips key ${k.curve} ${k.dir}`);
      gradeSpec(Graph, Grade, g, w, errs, { list: { 'LRPC moved': { shifts: { LRPC: -dir } }, 'SRPC the wrong way': { shifts: { SRPC: dir } } } });
    }
    // Long run: SRAS ends at -a, so inflation (the price-level height) ends at 5 + a.
    const fy = crossing(a, -a)[1], exp = fy > 5 ? 'higher than' : fy < 5 ? 'lower than' : 'where it started';
    if (!pick('longrun').includes(exp)) errs.push(`${w}: long run keyed "${pick('longrun')}", expected inflation ${exp}`);
  } else errs.push(`${w}: unknown type ${p.type}`);
  return errs;
}

export function check(data, map) {
  const errs = [];
  frame(data, 'adas-lab', 'simulator', map, errs);
  for (const c of data.contexts || []) {
    if (!Array.isArray(c.types) || !c.types.length) errs.push(`context ${c.id}: lists no types`);
    for (const t of c.types || []) if (!TYPES.includes(t)) errs.push(`context ${c.id}: unknown type "${t}" (${TYPES.join(', ')})`);
  }
  if (errs.length) return errs;
  const { model } = runtime('adas-lab');
  if (!model || model.stub) return [...errs, 'ApMacroMath.adasLab is not built'];
  sweep(data, errs, (r, c, t) => model.generate(r, c, t), (p, c, w) => errs.push(...recheck(p, c, w)), c => c.types);
  return errs;
}
