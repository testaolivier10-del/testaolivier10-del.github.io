/* Validator for microeconomics/data/tools/cost-lab.json (Cost Curve Lab), run by
   scripts/check-apmicro-content.mjs. OWNED BY THIS TOOL ONLY (builder T2).
   check(data, map) -> problems: the shared frame, then the drill sweep
   (_drills.mjs: 300 problems per context and type), every key recomputed
   here with this file's own arithmetic (differences and quotients of the
   table's columns, its own search for the lowest AVC and ATC rows, its own
   shutdown rule), and every graph step graded by ApMicroGrade.graph on the
   key (right) and on the reader-report slips (MC moved by a fixed cost, the
   point at the wrong minimum, MC and ATC labels swapped: wrong). */
import { frame, sweep, close } from './_drills.mjs';
import { runtime } from './_shared.mjs';

export const TYPES = ['table', 'mc', 'min', 'shutdown', 'fixed'];

const argmin = col => { let b = 1; for (let i = 2; i < col.length; i++) if (col[i] < col[b]) b = i; return b; };
const uniqueMin = col => { const b = argmin(col); return col.slice(1).every((v, j) => j + 1 === b || v > col[b] + 1e-9); };

function graded(Graph, Grade, spec, w, errs, slips) {
  const bad = Graph.check(spec);
  if (bad.length) { errs.push(`${w}: graph spec: ${bad[0]}`); return; }
  if (!Grade.graph(spec, Graph.keyResponse(spec)).correct) errs.push(`${w}: the graph key is graded wrong`);
  for (const [why, resp] of Object.entries(slips)) {
    const g = Grade.graph(spec, { shifts: {}, eq: null, point: null, labels: {}, line: null, shade: [], ...resp });
    if (g.correct) errs.push(`${w}: a planted slip (${why}) is graded right`);
    else if (!g.slip) errs.push(`${w}: the slip (${why}) has no feedback line`);
  }
}

export function recheck(p, ctx, w) {
  const errs = [];
  const { Graph, Grade } = runtime('cost-lab');
  const step = k => p.steps.find(s => s.key === k);
  const val = k => step(k).cell.answer;
  if (ctx.types && !ctx.types.includes(p.type)) errs.push(`${w}: type ${p.type} is not one of the context's types`);
  if (p.topic !== ctx.topic) errs.push(`${w}: topic ${p.topic} is not the context's ${ctx.topic}`);
  const pt = name => Graph.named({ kind: 'costs' }, {}, name);
  const a = p.answer;
  if (p.type === 'table') {
    const k = a.k, mp = a.tp[k] - a.tp[k - 1], tvc = a.w * k, mc = a.w / mp, avc = tvc / a.tp[k];
    if (!(mp > 0)) errs.push(`${w}: marginal product ${mp} is not positive`);
    if (!close(val('mp'), mp)) errs.push(`${w}: MP ${val('mp')} != ${mp}`);
    if (!close(val('tvc'), tvc)) errs.push(`${w}: TVC ${val('tvc')} != ${tvc}`);
    if (!close(val('mc'), mc)) errs.push(`${w}: MC ${val('mc')} != ${mc}`);
    if (!close(val('avc'), avc)) errs.push(`${w}: AVC ${val('avc')} != ${avc}`);
    // MP rises then falls: diminishing marginal returns set in
    const mps = a.tp.slice(1).map((t, i) => t - a.tp[i]);
    const top = mps.indexOf(Math.max(...mps));
    if (!(top > 0 && top < mps.length - 1)) errs.push(`${w}: MP does not rise then fall`);
    graded(Graph, Grade, step('graph').spec, w, errs, { 'the minimum of ATC': { point: pt('min-atc') }, 'the minimum of AVC': { point: pt('min-avc') } });
  } else if (p.type === 'mc') {
    const k = a.k, mc = (a.tc[k] - a.tc[k - 1]) / (a.q[k] - a.q[k - 1]);
    if (a.q[k] - a.q[k - 1] === 1) errs.push(`${w}: output rises by 1, so dividing by the change in output is not tested`);
    if (!close(val('tfc'), a.tc[0])) errs.push(`${w}: TFC ${val('tfc')} != ${a.tc[0]}`);
    if (!close(val('mc'), mc)) errs.push(`${w}: MC ${val('mc')} != ${mc}`);
    if (!close(val('atc'), a.tc[k] / a.q[k])) errs.push(`${w}: ATC wrong`);
    if (!close(val('afc'), a.tc[0] / a.q[k])) errs.push(`${w}: AFC wrong`);
    const spec = step('graph').spec, key = Graph.keyResponse(spec);
    graded(Graph, Grade, spec, w, errs, { 'MC and ATC swapped': { labels: { ...key.labels, MC: 'ATC', ATC: 'MC' } }, 'axes swapped': { labels: { ...key.labels, x: key.labels.y, y: key.labels.x } } });
  } else if (p.type === 'min') {
    const q = a.q, tc = a.tc, avc = tc.map((c, i) => i ? (c - tc[0]) / q[i] : null), atc = tc.map((c, i) => i ? c / q[i] : null);
    if (!uniqueMin(avc) || !uniqueMin(atc)) errs.push(`${w}: a tie for the lowest average`);
    if (!close(val('qavc'), q[argmin(avc)])) errs.push(`${w}: min AVC output ${val('qavc')} != ${q[argmin(avc)]}`);
    if (!close(val('qatc'), q[argmin(atc)])) errs.push(`${w}: min ATC output ${val('qatc')} != ${q[argmin(atc)]}`);
    if (!(argmin(atc) > argmin(avc))) errs.push(`${w}: ATC bottoms out before AVC`);
    if (step('why').correct !== 0 || !/below ATC/.test(step('why').options[0])) errs.push(`${w}: the reason is keyed wrong`);
    graded(Graph, Grade, step('graph').spec, w, errs, { 'the minimum of AVC': { point: pt('min-avc') }, 'the minimum of MC': { point: pt('min-mc') } });
  } else if (p.type === 'shutdown') {
    const q = a.q, tc = a.tc, avc = tc.map((c, i) => i ? (c - tc[0]) / q[i] : null), atc = tc.map((c, i) => i ? c / q[i] : null);
    const lo = avc[argmin(avc)], hi = atc[argmin(atc)];
    if (!close(val('shut'), lo)) errs.push(`${w}: shutdown price ${val('shut')} != ${lo}`);
    if (!close(val('even'), hi)) errs.push(`${w}: break-even price ${val('even')} != ${hi}`);
    const want = a.P < lo ? 0 : a.P < hi ? 1 : 2;
    if (Math.min(Math.abs(a.P - lo), Math.abs(a.P - hi)) < 0.25) errs.push(`${w}: the price ${a.P} is too close to a key price`);
    if (step('decide').correct !== want) errs.push(`${w}: decision keyed ${step('decide').correct}, expected ${want}`);
    graded(Graph, Grade, step('graph').spec, w, errs, { 'the minimum of ATC': { point: pt('min-atc') } });
  } else if (p.type === 'fixed') {
    const k = a.k, d = a.up * a.amt, tcNew = a.lump ? a.tc[k] + d : a.tc[k] + d * a.q[k];
    if (!close(val('atc'), tcNew / a.q[k])) errs.push(`${w}: new ATC ${val('atc')} != ${tcNew / a.q[k]}`);
    if (a.lump ? a.tc[0] + d <= 0 : Math.min(...a.tc.slice(1).map((c, i) => (c - a.tc[i]) / (a.q[i + 1] - a.q[i]))) + d <= 0) errs.push(`${w}: the cut takes a cost to zero or below`);
    const mcWant = a.lump ? 0 : a.up > 0 ? 1 : 2;
    if (step('mc').correct !== mcWant) errs.push(`${w}: MC change keyed ${step('mc').correct}, expected ${mcWant}`);
    const spec = step('graph').spec, dir = a.up > 0 ? 'up' : 'down', want = a.lump ? ['ATC'] : ['ATC', 'MC'];
    const got = spec.key.shifts.map(s => s.curve).sort();
    if (got.join() !== want.join() || spec.key.shifts.some(s => s.dir !== dir)) errs.push(`${w}: shifts keyed ${JSON.stringify(spec.key.shifts)}`);
    const s1 = a.up > 0 ? 1 : -1;
    graded(Graph, Grade, spec, w, errs, a.lump
      ? { 'MC moved by a fixed cost': { shifts: { MC: s1, ATC: s1 } }, 'only MC moved': { shifts: { MC: s1 } }, 'the wrong way': { shifts: { ATC: -s1 } } }
      : { 'ATC only for a per-unit cost': { shifts: { ATC: s1 } }, 'the wrong way': { shifts: { MC: -s1, ATC: -s1 } } });
  } else errs.push(`${w}: unknown type ${p.type}`);
  return errs;
}

export function check(data, map) {
  const errs = [];
  frame(data, 'cost-lab', 'simulator', map, errs);
  const { M, model } = runtime('cost-lab');
  if (!model || model.stub) { errs.push('ApMicroMath.costLab is not built'); return errs; }
  void M;
  sweep(data, errs, (r, c, t) => model.generate(r, c, t), (p, c, w) => { for (const e of recheck(p, c, w)) errs.push(e); }, c => c.types || TYPES);
  return errs;
}
