/* Validator for macroeconomics/data/tools/ppc-trade.json (PPC and trade), run by
   scripts/check-apmacro-content.mjs. OWNED BY THIS TOOL ONLY (builder T3).
   check(data, map) -> problems.

   1. The frame; each context's types and the topic each type belongs to.
   2. Explore: the PPC events (shift or a move inside), the marginal cost
      rising along the bowed PPC, and the trade scenarios swept over the
      terms of trade: both gain exactly when the terms lie strictly between
      the two opportunity costs, each side's gain checked here, and no
      consumption below zero.
   3. 300 seeded problems per context and type (_drills.mjs sweep): the
      point's region by this file's own geometry (and ApMacroGraph.region),
      the PPC event from this file's answer sheet, opportunity costs from
      output data (other ÷ this) and input data (this ÷ other), comparative
      advantage as the lower cost, and terms of trade strictly between. */
import { frame, sweep, close } from './_drills.mjs';
import { runtime } from './_shared.mjs';

export const TYPES = ['ppc-point', 'ppc-oc', 'output', 'input', 'terms'];
export const TOPIC = { 'ppc-point': 'opportunity-cost-ppc', 'ppc-oc': 'opportunity-cost-ppc', output: 'comparative-advantage', input: 'comparative-advantage', terms: 'comparative-advantage' };
const strip = s => String(s).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
const MOVES = [[/new technology|new workers join/i, 'out'], [/flood destroys/i, 'in'], [/recession leaves/i, 'inside'], [/chooses to make more/i, 'along']];
const MOVE_LABEL = { out: 'The PPC shifts outward', in: 'The PPC shifts inward', inside: 'No shift: the economy moves to a point inside the PPC', along: 'No shift: the economy moves along its PPC' };
const n2 = x => String(+x.toFixed(2));

export function exploreProblems(model, Graph) {
  const errs = [];
  for (const e of model.PPC_EVENTS) {
    const want = { tech: [1, null], workers: [1, null], disaster: [-1, null], recession: [0, 0.7], recover: [0, 1] }[e.id];
    if (!want) { errs.push(`PPC event ${e.id}: not on the answer sheet`); continue; }
    if (e.shift !== want[0] || e.eff !== want[1]) errs.push(`PPC event ${e.id}: shift ${e.shift} eff ${e.eff}, want ${want}`);
  }
  let last = -1;
  for (let x = 0; x <= 5; x++) { const m = model.marginal(x, 0); if (!(m > last)) errs.push(`the cost of the next unit must rise along the bowed PPC (x = ${x})`); last = m; }
  const spec = model.ppcSpec({ x: 'A', y: 'B' });
  if (Graph.region(spec, {}, model.ppcAt(3, 1, 0)) !== 'on') errs.push('ppcAt(x, 1) is not on the PPC');
  if (Graph.region(spec, {}, model.ppcAt(3, 0.7, 0)) !== 'inside') errs.push('ppcAt(x, 0.7) is not inside the PPC');
  if (Graph.region(spec, { PPC: 1 }, model.ppcAt(3, 1, 1)) !== 'on') errs.push('ppcAt on a shifted PPC is not on it');
  for (const sc of model.SCENARIOS) {
    const oA = sc.A.y / sc.A.x, oB = sc.B.y / sc.B.x, lo = Math.min(oA, oB), hi = Math.max(oA, oB);
    for (let i = 0; i <= 60; i++) {
      const t = lo * 0.5 + (hi * 1.6 - lo * 0.5) * i / 60, T = model.trade(sc, t, true);
      if (!close(T.ocA, oA, 1e-9) || !close(T.ocB, oB, 1e-9)) { errs.push(`scenario ${sc.id}: opportunity costs`); break; }
      const xer = oA < oB ? 'A' : 'B', yer = xer === 'A' ? 'B' : 'A';
      if (T.xer !== xer) { errs.push(`scenario ${sc.id}: the exporter of ${sc.goods[0]} should be ${sc[xer].name}`); break; }
      const gX = T.q * t - T.q * lo, gY = T.q * hi - T.q * t;
      if (!close(T.gain[xer], gX, 1e-9, 1e-9) || !close(T.gain[yer], gY, 1e-9, 1e-9)) { errs.push(`scenario ${sc.id} t ${t}: gains ${JSON.stringify(T.gain)}, want ${gX}, ${gY}`); break; }
      if (T.both !== (t > lo + 1e-9 && t < hi - 1e-9)) { errs.push(`scenario ${sc.id} t ${t}: "both gain" is wrong`); break; }
      if (t <= T.tMax + 1e-9 && Object.values(T.after).some(p => p[0] < -1e-9 || p[1] < -1e-9)) { errs.push(`scenario ${sc.id} t ${t}: a country consumes below zero`); break; }
    }
  }
  return errs;
}

export function recheckProblem(p, c, Graph) {
  const errs = [], v = p.values, step = k => p.steps.find(s => s.key === k), ans = k => step(k).cell.answer, opt0 = k => strip(step(k).options[0]);
  if (c && c.topic !== TOPIC[p.type]) errs.push(`type ${p.type} belongs to topic ${TOPIC[p.type]}, the context says ${c.topic}`);
  for (const s of p.steps) if (s.kind === 'choice' && s.correct !== 0) errs.push(`step ${s.key}: the key is not option 0`);
  if (p.type === 'ppc-point') {
    const d = Math.hypot(v.point[0], v.point[1]), own = Math.abs(d - 7) <= 0.4 ? 'on' : d < 7 ? 'inside' : 'outside';
    if (own !== v.region) errs.push(`point at distance ${d}: ${own}, not ${v.region}`);
    if (Graph.region(p.fig.graph, {}, v.point) !== own) errs.push('ApMacroGraph places the point elsewhere');
    if (!opt0('region').toLowerCase().startsWith(own)) errs.push(`region keyed "${opt0('region')}"`);
    if (v.point.some(x => x < 0.3 || x > 9.7)) errs.push('the point is too close to an axis or the edge');
    const hit = MOVES.find(([re]) => re.test(step('event').label));
    if (!hit) errs.push('a PPC event not on the answer sheet');
    else if (opt0('event') !== MOVE_LABEL[hit[1]]) errs.push(`event keyed "${opt0('event')}", the answer sheet says ${hit[1]}`);
    if (!/opportunity cost/.test(opt0('shape') + strip(step('shape').why[0]))) errs.push('the shape step must name increasing opportunity cost');
  }
  if (p.type === 'ppc-oc') {
    const i = v.i, gave = v.ys[i] - v.ys[i + 1], gained = v.xs[i + 1] - v.xs[i];
    if (!close(ans('gave'), gave, 1e-12)) errs.push(`given up ${ans('gave')}, want ${gave}`);
    if (!close(ans('per'), gave / gained, 1e-9)) errs.push(`per unit ${ans('per')}, want ${gave / gained}`);
    const inc = v.ys.slice(1).map((y, k) => v.ys[k] - y), same = inc.every(d => d === inc[0]), rising = inc.every((d, k) => !k || d > inc[k - 1]);
    if (!same && !rising) errs.push('the table is neither constant nor increasing cost');
    if (!opt0('shape').startsWith(same ? 'It stays the same' : 'It rises')) errs.push(`shape keyed "${opt0('shape')}"`);
    if (v.ys[4] !== 0 || v.xs[0] !== 0) errs.push('the table should run from all of one good to all of the other');
  }
  if (p.type === 'output' || p.type === 'terms') {
    const A = v.c.A, B = v.c.B, oA = A.y / A.x, oB = B.y / B.x;
    if (Math.abs(oA - oB) < 0.1) errs.push('the two opportunity costs are too close');
    const ca = oA < oB ? A : B, other = ca === A ? B : A;
    if (p.type === 'output') {
      if (!close(ans('ocA'), oA, 1e-9) || !close(ans('ocB'), oB, 1e-9)) errs.push(`opportunity costs ${ans('ocA')}, ${ans('ocB')}, want ${oA}, ${oB}`);
      if (opt0('ca') !== ca.name) errs.push(`comparative advantage keyed ${opt0('ca')}, want ${ca.name}`);
      if (opt0('spec') !== v.c.goods[1]) errs.push(`${other.name} should specialize in ${v.c.goods[1]}`);
    } else {
      const lo = Math.min(oA, oB), hi = Math.max(oA, oB);
      if (opt0('exp') !== ca.name) errs.push(`exporter keyed ${opt0('exp')}, want ${ca.name}`);
      if (!(v.good > lo && v.good < hi)) errs.push(`the keyed terms ${v.good} are not strictly between ${lo} and ${hi}`);
      if (!(v.below < lo) || !(v.above > hi)) errs.push('a distractor lies between the opportunity costs');
      if (!opt0('tot').includes(`for ${n2(v.good)} `)) errs.push(`terms keyed "${opt0('tot')}"`);
    }
  }
  if (p.type === 'input') {
    const a = v.a, b = v.b, oA = a.hx / a.hy, oB = b.hx / b.hy;
    if (!close(ans('ocA'), oA, 1e-9) || !close(ans('ocB'), oB, 1e-9)) errs.push(`input opportunity costs ${ans('ocA')}, ${ans('ocB')}, want ${oA}, ${oB}`);
    const ca = oA < oB ? a : b;
    if (opt0('ca') !== ca.name) errs.push(`comparative advantage keyed ${opt0('ca')}, want ${ca.name}`);
    const inv = step('ocA').cell.mistakes.find(m => close(m.value, a.hy / a.hx, 1e-9));
    if (Math.abs(oA - 1) > 0.05 && !inv) errs.push('the flipped (output-rule) ratio is not named as a slip');
  }
  return errs;
}

export function check(data, map) {
  const errs = [];
  frame(data, 'ppc-trade', 'simulator', map, errs);
  const { model, Graph } = runtime('ppc-trade');
  if (!model || typeof model.generate !== 'function') { errs.push('the model ApMacroMath.ppcTrade is not registered (macroeconomics/assets/tools/math/ppc-trade.js)'); return errs; }
  if (model.stub) { errs.push('the model is still the Phase 0 stub'); return errs; }
  for (const c of data.contexts || []) {
    if (!Array.isArray(c.types) || !c.types.length) { errs.push(`context ${c.id}: list its types`); continue; }
    for (const t of c.types) {
      if (!TYPES.includes(t)) errs.push(`context ${c.id}: unknown type "${t}" (one of ${TYPES.join(', ')})`);
      else if (TOPIC[t] !== c.topic) errs.push(`context ${c.id}: type ${t} belongs to topic ${TOPIC[t]}, not ${c.topic}`);
    }
  }
  for (const s of model.SCENARIOS) if (Graph.check({ kind: 'ppc', names: { x: s.goods[0], y: s.goods[1] }, do: ['point'], key: { point: { region: 'on' } } }).length) errs.push(`scenario ${s.id}: not a valid PPC spec`);
  errs.push(...exploreProblems(model, Graph));
  sweep(data, errs, (r, c, t) => model.generate(r, c, t), (p, c, w) => { for (const e of recheckProblem(p, c, Graph)) errs.push(`${w}: ${e}`); }, c => (c.types || []).filter(t => TYPES.includes(t)));
  return errs;
}
export function recheck(p, c) { return recheckProblem(p, c, runtime('ppc-trade').Graph); }
