/* Validator for microeconomics/data/tools/firm-market.json (Firm and Market Lab), run by
   scripts/check-apmicro-content.mjs. OWNED BY THIS TOOL ONLY (builder T2).
   check(data, map) -> problems: the shared frame, then the drill sweep
   (_drills.mjs: 300 problems per context and type), every key recomputed
   here with this file's own arithmetic (MC as differences of total cost, MR
   as differences of P × Q, the last unit whose marginal benefit covers its
   marginal cost, profit = TR − TC or (P − ATC) × q, its own shutdown rule and
   its own table of the long-run chain), and every graph step graded by
   ApMicroGrade.graph on the key (right) and on the reader-report slips: the
   firm's q at the bottom of ATC, the monopoly price read from MR, consumer
   surplus or the wrong box shaded, demand moved by entry in perfect
   competition, costs moved by entry in monopolistic competition (all wrong). */
import { frame, sweep, close } from './_drills.mjs';
import { runtime } from './_shared.mjs';

export const TYPES = ['quantity', 'shutdown', 'longrun', 'monopoly', 'monocomp'];

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
// the last unit (1-based rows) whose marginal benefit is at least its marginal cost
const lastCovered = (gain, cost) => { let last = 0; for (let i = 1; i < cost.length; i++) { if (gain(i) >= cost[i]) last = i; else break; } return last; };

export function recheck(p, ctx, w) {
  const errs = [];
  const { Graph, Grade } = runtime('firm-market');
  const step = k => p.steps.find(s => s.key === k);
  const val = k => step(k).cell.answer;
  const a = p.answer;
  if (!ctx.types.includes(p.type)) errs.push(`${w}: type ${p.type} is not one of the context's types`);
  if (p.topic !== ctx.topic) errs.push(`${w}: topic ${p.topic} is not the context's ${ctx.topic}`);
  if (p.type === 'quantity') {
    const mc = a.tc.map((c, i) => i ? c - a.tc[i - 1] : null);
    if (mc.includes(a.P)) errs.push(`${w}: a unit's MC equals the price`);
    const qs = lastCovered(() => a.P, mc), tr = a.P * qs, prof = tr - a.tc[qs];
    if (step('mr').correct !== 0) errs.push(`${w}: MR keyed wrong`);
    if (!close(val('q'), qs)) errs.push(`${w}: q ${val('q')} != ${qs}`);
    if (!close(val('tr'), tr)) errs.push(`${w}: TR ${val('tr')} != ${tr}`);
    if (!close(val('profit'), prof, 1e-9, 1e-9)) errs.push(`${w}: profit ${val('profit')} != ${prof}`);
    const spec = step('graph').spec;
    graded(Graph, Grade, spec, w, errs, { 'q at the bottom of ATC': { point: Graph.named(spec, {}, 'min-atc') }, 'q where MC is lowest': { point: Graph.named({ kind: 'costs' }, {}, 'min-mc') } });
  } else if (p.type === 'shutdown') {
    const prof = (a.P - a.atc) * a.q, tfc = (a.atc - a.avc) * a.q;
    if (!close(val('profit'), prof, 1e-9, 1e-9)) errs.push(`${w}: profit ${val('profit')} != ${prof}`);
    if (!close(val('tfc'), tfc)) errs.push(`${w}: TFC ${val('tfc')} != ${tfc}`);
    if (!(a.avc > 0 && a.avc < a.atc && a.P > 0)) errs.push(`${w}: impossible costs`);
    const want = a.P > a.atc ? 0 : a.P >= a.avc ? 1 : 2;
    if (a.P === a.atc || a.P === a.avc) errs.push(`${w}: the price equals a cost, so the decision is a tie`);
    if (step('decide').correct !== want) errs.push(`${w}: decision keyed ${step('decide').correct}, expected ${want}`);
    const spec = step('graph').spec;
    if (want === 2) graded(Graph, Grade, spec, w, errs, { 'min ATC for shutdown': { point: Graph.named(spec, {}, 'min-atc') } });
    else {
      if (spec.key.shade !== (want === 0 ? 'profit' : 'loss')) errs.push(`${w}: the area keyed is ${spec.key.shade}`);
      const R = Graph.areas(spec).regions;
      graded(Graph, Grade, spec, w, errs, { 'total revenue shaded': { shade: R.tr }, 'total cost shaded': { shade: R.tc } });
    }
  } else if (p.type === 'longrun') {
    const up = a.up;
    const want = { price: up ? 0 : 1, profit: up ? 0 : 1, entry: up ? 0 : 1, lrprice: 0, lrq: up ? 0 : 1 };
    for (const [k, v] of Object.entries(want)) if (step(k).correct !== v) errs.push(`${w}: ${k} keyed ${step(k).correct}, expected ${v}`);
    if (!/profit/.test(step('entry').options[0]) || /demand rose/.test(step('entry').options[0])) errs.push(`${w}: entry is not tied to profit`);
    const spec = step('graph').spec, k0 = spec.key.shifts[0];
    if (spec.key.shifts.length !== 1 || k0.curve !== 'S' || k0.dir !== (up ? 'right' : 'left')) errs.push(`${w}: long-run shift keyed ${JSON.stringify(spec.key.shifts)}`);
    const d = up ? 1 : -1;
    // after the key the price is back where it started (the minimum of ATC)
    const e = Graph.eq(spec, Graph.keyOffsets(spec)), e0 = Graph.eq({ kind: 'pc' }, {});
    if (Math.abs(e[1] - e0[1]) > 1e-6) errs.push(`${w}: the key does not bring the price back to its start`);
    graded(Graph, Grade, spec, w, errs, { 'demand shifted again': { shifts: { D: -d } }, 'supply the wrong way': { shifts: { S: -d } } });
  } else if (p.type === 'monopoly') {
    const tr = a.p.map((x, i) => x * a.q[i]), mr = tr.map((v, i) => i ? v - tr[i - 1] : null), mc = a.tc.map((c, i) => i ? c - a.tc[i - 1] : null);
    const qs = lastCovered(i => mr[i], mc);
    if (!close(val('mr'), mr[a.k])) errs.push(`${w}: MR ${val('mr')} != ${mr[a.k]}`);
    if (!close(val('q'), qs)) errs.push(`${w}: Q ${val('q')} != ${qs}`);
    if (!close(val('p'), a.p[qs])) errs.push(`${w}: P ${val('p')} != ${a.p[qs]}`);
    if (!close(val('profit'), tr[qs] - a.tc[qs])) errs.push(`${w}: profit wrong`);
    if (!(a.p[qs] > mr[qs])) errs.push(`${w}: price not above MR`);
    for (let i = 2; i < a.p.length; i++) if (!(a.p[i] < a.p[i - 1])) errs.push(`${w}: demand does not slope down`);
    const s1 = step('graph').spec, pm = Graph.named(s1, {}, 'profit-max'), mm = Graph.named(s1, {}, 'mr=mc');
    graded(Graph, Grade, s1, w, errs, { 'price read from MR': { point: mm }, 'the allocative point': { point: Graph.named(s1, {}, 'allocative') } });
    if (!(pm[1] > mm[1] + 0.5)) errs.push(`${w}: the graph's price is not clearly above MR`);
    const s2 = step('graph2').spec, R = Graph.areas(s2).regions;
    graded(Graph, Grade, s2, w, errs, { 'consumer surplus': { shade: R.cs }, 'deadweight loss': { shade: R.dwl }, 'total revenue': { shade: R.tr } });
  } else if (p.type === 'monocomp') {
    const s1 = step('graph').spec, R = Graph.areas(s1).regions;
    graded(Graph, Grade, s1, w, errs, { 'consumer surplus': { shade: R.cs }, 'total revenue': { shade: R.tr } });
    const s2 = step('graph2').spec;
    if (JSON.stringify(s2.key.shifts) !== JSON.stringify([{ curve: 'D', dir: 'left' }])) errs.push(`${w}: entry keyed ${JSON.stringify(s2.key.shifts)}`);
    graded(Graph, Grade, s2, w, errs, { 'ATC moved': { shifts: { ATC: 1 } }, 'demand right': { shifts: { D: 1 } } });
    // the long run really is zero profit with excess capacity, on the engine's own long-run graph
    const L = { kind: 'monocomp', run: 'long' }, pm = Graph.named(L, {}, 'profit-max'), atc = Graph.y(Graph.find(Graph.curves(L, {}), 'ATC'), pm[0]), mn = Graph.named(L, {}, 'min-atc');
    if (Math.abs(pm[1] - atc) > 0.05) errs.push(`${w}: the long-run graph is not at zero profit`);
    if (!(pm[0] < mn[0])) errs.push(`${w}: no excess capacity on the long-run graph`);
    for (const [k, v] of Object.entries({ entry: 0, lr: 0, cap: 0 })) if (step(k).correct !== v) errs.push(`${w}: ${k} keyed wrong`);
  } else errs.push(`${w}: unknown type ${p.type}`);
  return errs;
}

export function check(data, map) {
  const errs = [];
  frame(data, 'firm-market', 'simulator', map, errs);
  const { model } = runtime('firm-market');
  if (!model || model.stub) { errs.push('ApMicroMath.firmMarket is not built'); return errs; }
  sweep(data, errs, (r, c, t) => model.generate(r, c, t), (p, c, w) => { for (const e of recheck(p, c, w)) errs.push(e); }, c => c.types || TYPES);
  return errs;
}
