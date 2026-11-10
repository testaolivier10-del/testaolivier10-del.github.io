/* Validator for microeconomics/data/tools/surplus-lab.json (Surplus and Policy Lab), run by
   scripts/check-apmicro-content.mjs. OWNED BY THIS TOOL ONLY (builder T3).
   check(data, map) -> problems: the shared frame, then the drill sweep
   (_drills.mjs: 300 problems per context and type), every key recomputed
   here with this file's own arithmetic (recheck):
     - the market in closed form: demand P = c - sQ, supply P = f + sQ
       (c = kP (10 + sD), f = -kP sS, s = kP / kQ), every quantity, price and
       area by hand-written formulas, not the model's or ApMicroCalc's;
     - every shade step's region measured on ApMicroGraph.areas (polygon
       area x kP x kQ) and matched to the number the next step keys, so the
       area the student shades is the area the number is;
     - the reader-report slips planted on each shade step (the wrong area,
       the subsidy rectangle at the old quantity, one of two tariff triangles)
       graded wrong with a feedback line. */
import { frame, sweep, close } from './_drills.mjs';
import { runtime } from './_shared.mjs';

export const TYPES = ['surplus', 'control', 'tax', 'incidence', 'subsidy', 'trade', 'tariff'];

function mkt(m) {
  const c = m.kP * (10 + m.sD), f = -m.kP * m.sS, s = m.kP / m.kQ;
  const qe = (c - f) / (2 * s), pe = (c + f) / 2;
  return { c, f, s, qe, pe, qD: p => (c - p) / s, qS: p => (p - f) / s, pDq: q => c - s * q, pSq: q => f + s * q };
}
// What each type's numeric steps must be, by hand.
function expected(p) {
  const a = p.answer, m = a.m, k = m && mkt(m), v = a.v, E = {};
  const tri = (b, h) => b * h / 2;
  if (p.type === 'surplus') { E.cs = tri(k.qe, k.c - k.pe); E.ps = tri(k.qe, k.pe - k.f); }
  if (p.type === 'control') {
    const at = v.at, qs = k.qS(at), qd = k.qD(at), q = Math.min(qs, qd);
    E.gap = Math.abs(qd - qs); E.dwl = tri(k.qe - q, Math.abs(k.pDq(q) - k.pSq(q)));
    E._kind = qd > qs ? 'shortage' : 'surplus';
  }
  if (p.type === 'tax') { const t = v.amount, q = (k.c - k.f - t) / (2 * k.s); E.rev = t * q; E.dwl = tri(k.qe - q, t); E.burden = k.pDq(q) - k.pe; }
  if (p.type === 'subsidy') { const t = v.amount, q = (k.c - k.f + t) / (2 * k.s); E.cost = t * q; E.dwl = tri(q - k.qe, t); }
  if (p.type === 'trade') { const w = v.at, im = k.qD(w) - k.qS(w); E.imports = im; E.gain = tri(im, k.pe - w); }
  if (p.type === 'tariff') {
    const w = v.at, t = v.amount, pt = w + t;
    E.imports = k.qD(pt) - k.qS(pt); E.rev = t * E.imports; E.dwl = tri(k.qS(pt) - k.qS(w), t) + tri(k.qD(w) - k.qD(pt), t);
  }
  if (p.type === 'incidence') {
    const o = a.o, p0 = (o.a - o.c) / (o.b + o.d), pb = (o.a - o.c + o.d * o.t) / (o.b + o.d);
    E.p0 = p0; E.pb = pb; E._who = o.b === o.d ? 'evenly' : o.b < o.d ? 'Buyers' : 'Sellers';
  }
  return E;
}
// The area a shade step's region covers, in dollars.
function regionDollars(Graph, spec, m) {
  const A = Graph.areas(spec), names = [].concat(spec.key.shade);
  const cells = new Set(names.flatMap(n => A.regions[n] || []));
  return [...cells].reduce((s, id) => s + Graph.polyArea(A.cells.find(c => c.id === id).poly), 0) * m.kP * m.kQ;
}
const NEXT = { shade: { surplus: null, control: 'dwl', trade: 'gain' }, 'shade-rev': 'rev', 'shade-dwl': 'dwl', 'shade-cost': 'cost' };

export function recheck(p, ctx, w) {
  const errs = [];
  const { Graph, Grade } = runtime('surplus-lab');
  if (!ctx.types.includes(p.type)) errs.push(`${w}: type ${p.type} is not one of the context's types`);
  if (p.topic !== ctx.topic) errs.push(`${w}: topic ${p.topic} is not the context's ${ctx.topic}`);
  const E = expected(p), step = k => p.steps.find(s => s.key === k);
  for (const [k, x] of Object.entries(E)) {
    if (k.startsWith('_')) continue;
    const s = step(k);
    if (!s) { errs.push(`${w}: no step ${k}`); continue; }
    if (!close(s.cell.answer, x, 1e-6, 1e-6)) errs.push(`${w}: step ${k} keyed ${s.cell.answer}, by hand ${x}`);
  }
  const pick = k => { const s = step(k); return s ? s.options[s.correct] : ''; };
  if (E._kind && pick('kind') !== (E._kind === 'shortage' ? 'A shortage: quantity demanded is greater than quantity supplied' : 'A surplus: quantity supplied is greater than quantity demanded')) errs.push(`${w}: kind keyed "${pick('kind')}", expected a ${E._kind}`);
  if (E._who && !pick('who').includes(E._who)) errs.push(`${w}: incidence keyed "${pick('who')}", expected ${E._who}`);
  for (const s of p.steps.filter(x => x.kind === 'graph')) {
    const sp = s.spec;
    if (!p.figure || JSON.stringify(p.figure.spec.policy) !== JSON.stringify(sp.policy) || JSON.stringify(p.figure.spec.start) !== JSON.stringify(sp.start)) errs.push(`${w}: shade step ${s.key} grades a different graph from the one drawn`);
    const nk = typeof NEXT[s.key] === 'string' ? NEXT[s.key] : NEXT[s.key] && NEXT[s.key][p.type];
    const target = nk ? E[nk] : p.type === 'surplus' ? E[p.answer.first] : null;
    if (target != null && !close(regionDollars(Graph, sp, p.answer.m), target, 1e-6, 1e-6)) errs.push(`${w}: step ${s.key}: the shaded region measures ${regionDollars(Graph, sp, p.answer.m)}, the number is ${target}`);
    // Planted slips: every other named region (and a part of the key) graded wrong, with a line.
    const A = Graph.areas(sp), keyCells = Graph.regionCells(sp, sp.key.shade);
    const wrongs = Object.entries(A.regions).filter(([n, c]) => JSON.stringify([...c].sort()) !== JSON.stringify(keyCells)).map(([n, c]) => [n, c]);
    if (keyCells.length > 1) wrongs.push(['part of the key', keyCells.slice(0, 1)]);
    if (sp.key.shade === 'subsidy-cost') wrongs.push(['the rectangle at the old quantity', (A.regions['subsidy-cost'] || []).filter(c => !(A.regions.dwl || []).includes(c) && !['c', 'f'].includes(c))]);
    for (const [why, cells] of wrongs) {
      if (!cells.length) continue;
      const g = Grade.graph(sp, { shifts: {}, eq: null, point: null, labels: {}, line: null, shade: [...cells].sort() });
      if (g.correct) errs.push(`${w}: step ${s.key}: shading ${why} is graded right`);
      else if (!g.slip) errs.push(`${w}: step ${s.key}: shading ${why} gets no feedback line`);
    }
  }
  return errs;
}

export function check(data, map) {
  const errs = [];
  frame(data, 'surplus-lab', 'simulator', map, errs);
  const { model } = runtime('surplus-lab');
  if (!model || model.stub) { errs.push('ApMicroMath.surplusLab is not built'); return errs; }
  for (const c of data.contexts || []) for (const t of c.types || []) if (!TYPES.includes(t)) errs.push(`context ${c.id}: unknown type ${t}`);
  sweep(data, errs, (r, c, t) => model.generate(r, c, t), (p, c, w) => errs.push(...recheck(p, c, w)), c => c.types || []);
  return errs;
}
