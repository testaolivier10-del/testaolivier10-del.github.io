/* Validator for microeconomics/data/tools/graph-studio.json (Graph Studio), run by
   scripts/check-apmicro-content.mjs. OWNED BY THIS TOOL ONLY (builder T1).
   check(data, map) -> problems.

   Independent of the model where it can be:
   - which curve each shifter moves and which way (SHIFTER, written from the
     course's graph rules, docs/apmicro-authoring-guide.md, not from the data);
   - the result of every shift on a straight-line market (price and quantity,
     wage and workers) from this file's own arithmetic (slopes -1 and +1);
   - every named point (MR = MC priced from demand, P = MC on the firm, MRP =
     MFC with the wage on supply, MSB = MSC, the bottoms of AVC, ATC and
     LRATC ...) solved here in closed form or by its own search, from the cost
     model's coefficients, and compared with ApMicroGraph.named and the key;
   - every shaded area's size from its own formula (a rectangle, a triangle,
     an integral) against the cells the key names (ApMicroGraph.areas).
   The graphs themselves are checked by ApMicroGraph.check and graded by
   ApMicroGrade.graph, the code students run.

   Then the drill sweep (_drills.mjs: 300 problems per context and kind) and
   recheck(p): every graph step's key earns its point and an untouched graph
   does not; a planted slip (the wrong curve, the other named point) loses the
   point with a note; the result step's key is this file's outcome; the
   shift-or-movement step names the scenario's curve. */
import { frame, sweep, close } from './_drills.mjs';
import { runtime, topicOk } from './_shared.mjs';

export const TYPES = ['draw', 'shift', 'shade', 'mark', 'move'];
const GRAPHS = ['ppc', 'sd', 'policy', 'costs', 'pc', 'monopoly', 'monocomp', 'labor', 'monopsony', 'externality', 'lorenz'];
const KIND = { ppc: 'ppc', sd: 'sd', policy: 'sd-micro', costs: 'costs', pc: 'pc', monopoly: 'monopoly', monocomp: 'monocomp', labor: 'labor', monopsony: 'monopsony', externality: 'externality', lorenz: 'lorenz' };

/* What each shifter does (graph:shifter): shifts [[curve, dir]], a point
   ({ at } or { region }), 'along:<curve>', or 'area' (a shading scenario). */
export const SHIFTER = {
  'ppc:resources-up': [['PPC', 'out']], 'ppc:resources-down': [['PPC', 'in']],
  'ppc:point-inside': { region: 'inside' }, 'ppc:point-on': { region: 'on' }, 'ppc:point-outside': { region: 'outside' },
  'sd:income-normal-up': [['D', 'right']], 'sd:sub-price-up': [['D', 'right']], 'sd:comp-price-up': [['D', 'left']],
  'sd:tastes-down': [['D', 'left']], 'sd:buyers-up': [['D', 'right']], 'sd:expect-price-up': [['D', 'right']],
  'sd:input-price-up': [['S', 'left']], 'sd:tech-up': [['S', 'right']], 'sd:sellers-up': [['S', 'right']],
  'sd:own-price-down': 'along:D', 'sd:own-price-up': 'along:S',
  'policy:area': 'area', 'policy:ceiling': { line: 'Pc', side: 'below' }, 'policy:floor': { line: 'Pf', side: 'above' },
  'policy:tax-per-unit': [['S', 'left']], 'policy:subsidy': [['S', 'right']],
  'costs:per-unit-cost-up': [['MC', 'up']], 'costs:per-unit-cost-down': [['MC', 'down']],
  'costs:fixed-cost-up': [['ATC', 'up']], 'costs:fixed-cost-down': [['ATC', 'down']],
  'costs:min-atc': { at: 'min-atc' }, 'costs:min-avc': { at: 'min-avc' }, 'costs:mes': { at: 'mes' },
  'pc:market-demand-up': [['D', 'right']], 'pc:market-demand-down': [['D', 'left']], 'pc:market-supply-up': [['S', 'right']],
  'pc:entry': [['S', 'right']], 'pc:firm-profit': { at: 'firm' }, 'pc:firm-loss': { at: 'firm' }, 'pc:min-avc': { at: 'min-avc' },
  'monopoly:profit-max': { at: 'profit-max' }, 'monopoly:area': 'area', 'monopoly:demand-up': [['D', 'right']],
  'monopoly:allocative': { at: 'allocative' }, 'monopoly:revenue-max': { at: 'revenue-max' }, 'monopoly:fair-return': { at: 'fair-return' },
  'monocomp:profit-max': { at: 'profit-max' }, 'monocomp:area': 'area',
  'labor:product-price-up': [['DL', 'right'], ['MRP', 'right']], 'labor:productivity-up': [['DL', 'right'], ['MRP', 'right']],
  'labor:workers-up': [['SL', 'right']], 'labor:firm-hire': { at: 'firm' },
  'monopsony:hire': { at: 'hire' }, 'monopsony:area': 'area', 'monopsony:mrp-up': [['MRP', 'right']], 'monopsony:competitive': { at: 'competitive' },
  'externality:efficient': { at: 'efficient' }, 'externality:market': { at: 'market' },
  'externality:corrective-tax': [['S', 'left']], 'externality:corrective-subsidy': [['D', 'right']],
  'lorenz:toward': [['LC', 'toward']], 'lorenz:away': [['LC', 'away']], 'lorenz:area': 'area'
};
/* A corrective tax or subsidy closes the whole gap: its steps equal ext.gap. */
const DASH = /[—–]/;

/* -------------------------------------------- the data file itself */
export function check(data, map) {
  const errs = [];
  frame(data, 'graph-studio', 'simulator', map, errs);
  const { Graph: G, model: GS, M } = runtime('graph-studio');
  if (!GS || GS.stub) { errs.push('the model is still the Phase 0 stub'); return errs; }
  // No em or en dash anywhere a student reads.
  const walk = (v, p) => { if (typeof v === 'string') { if (DASH.test(v)) errs.push(`${p}: an em or en dash (use a colon, a comma or two sentences)`); } else if (Array.isArray(v)) v.forEach((x, i) => walk(x, `${p}[${i}]`)); else if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) walk(x, p ? `${p}.${k}` : k); };
  walk(data, '');
  const ids = (data.graphs || []).map(g => g.id);
  if (JSON.stringify(ids) !== JSON.stringify(GRAPHS)) errs.push(`graphs must be ${GRAPHS.join(', ')} in that order (got ${ids.join(', ')})`);
  for (const g of data.graphs || []) {
    for (const k of ['title', 'shows', 'axes', 'movement']) if (!g[k]) errs.push(`graph ${g.id}: "${k}" is required`);
    if (!topicOk(g.topic, map)) errs.push(`graph ${g.id}: unknown topic "${g.topic}"`);
    if (!Array.isArray(g.shifters) || !g.shifters.length) errs.push(`graph ${g.id}: "shifters" lists what moves each curve`);
    try { const f = GS.freeSpec(g.id, data); G.svg(f, {}); G.mount; if (f.key && f.key.point && !G.named(f, {}, f.key.point.at)) errs.push(`graph ${g.id}: free mark ${f.key.point.at} is not on the graph`); }
    catch (e) { errs.push(`graph ${g.id}: free spec: ${e.message}`); }
  }
  const seen = new Set();
  for (const sc of data.scenarios || []) {
    const w = `scenario ${sc.id}`;
    if (!sc.id || seen.has(sc.id)) errs.push(`${w}: missing or duplicate id`); seen.add(sc.id);
    if (!GRAPHS.includes(sc.graph)) { errs.push(`${w}: unknown graph "${sc.graph}"`); continue; }
    if (!topicOk(sc.topic, map)) errs.push(`${w}: unknown topic "${sc.topic}"`);
    if (!sc.title || !sc.cause) errs.push(`${w}: "title" and "cause" are required`);
    const want = SHIFTER[`${sc.graph}:${sc.shifter}`];
    if (!want) { errs.push(`${w}: shifter "${sc.shifter}" is not in the validator's SHIFTER table for ${sc.graph}`); continue; }
    if (Array.isArray(want)) {
      const got = (sc.shifts || []).map(s => [s.curve, s.dir]);
      if (JSON.stringify(got.slice().sort()) !== JSON.stringify(want.slice().sort())) errs.push(`${w}: shifts ${JSON.stringify(got)}, but ${sc.shifter} moves ${JSON.stringify(want)}`);
      if (!sc.because) errs.push(`${w}: "because" names the cause in a few words`);
      if ((sc.shifter === 'corrective-tax' || sc.shifter === 'corrective-subsidy') && sc.shifts.some(s => s.steps !== ((sc.spec && sc.spec.ext && sc.spec.ext.gap) || 2))) errs.push(`${w}: a corrective tax or subsidy equal to the external cost or benefit closes the whole gap (steps = ext.gap)`);
      if (sc.spec && sc.spec.policy && ['tax', 'subsidy'].includes(sc.spec.policy.type) && sc.shifts.some(s => (s.steps || 1) !== sc.spec.policy.amount)) errs.push(`${w}: the drawn shift is the per-unit ${sc.spec.policy.type} (steps = policy.amount)`);
    } else if (typeof want === 'string' && want.startsWith('along:')) {
      if (sc.along !== want.slice(6)) errs.push(`${w}: a change in the good's own price is a movement along ${want.slice(6)}, not ${sc.along || 'a shift'}`);
      if (sc.shifts) errs.push(`${w}: a movement along a curve has no shifts`);
    } else if (want === 'area') {
      if (!sc.shade) errs.push(`${w}: an area scenario names the region to shade`);
      if (sc.shifts || sc.point || sc.line) errs.push(`${w}: an area scenario only shades`);
    } else if (want.line) {
      if (!sc.line || sc.line.id !== want.line || !sc.line.key || sc.line.key.side !== want.side) errs.push(`${w}: a binding ${want.line === 'Pc' ? 'ceiling' : 'floor'} is the line ${want.line} ${want.side} the equilibrium`);
      const sw = sc.shadeWith && sc.shadeWith.policy, e0 = 5;
      if (sw && (want.side === 'below' ? !(sw.at < e0) : !(sw.at > e0))) errs.push(`${w}: shadeWith draws the ${want.line === 'Pc' ? 'ceiling' : 'floor'} on the wrong side of the equilibrium`);
    } else {
      const k = (sc.point && sc.point.key) || {};
      if (want.region && k.region !== want.region) errs.push(`${w}: ${sc.shifter} is a point ${want.region} the curve, not ${k.region}`);
      if (want.at && k.at !== want.at) errs.push(`${w}: ${sc.shifter} is the named point ${want.at}, not ${k.at}`);
    }
    if (sc.point && (!sc.point.ask || !sc.point.why)) errs.push(`${w}: a point needs "ask" and "why"`);
    for (const [i, c] of (sc.check || []).entries()) {
      if (!c.label || !Array.isArray(c.options) || c.options.length !== 4) errs.push(`${w}: check[${i}] needs a label and four options`);
      else {
        if (!Array.isArray(c.why) || c.why.length !== 4) errs.push(`${w}: check[${i}]: one reason per option`);
        if (new Set(c.options).size !== 4) errs.push(`${w}: check[${i}]: two options read the same`);
        if (!(Number.isInteger(c.correct || 0) && (c.correct || 0) >= 0 && (c.correct || 0) < 4)) errs.push(`${w}: check[${i}].correct is out of range`);
      }
    }
    // Every {word} fills from every name set of its graph.
    const sets = (data.names && data.names[sc.graph]) || [{}];
    const texts = JSON.stringify([sc.cause, sc.because, sc.setting, data.settings && data.settings[sc.graph], sc.ask, sc.askShift, sc.why, sc.check, sc.slips, sc.point, sc.line, sc.shadeWhy]);
    for (const s of sets) { const left = /\{(\w+)\}/.exec(GS.fill(texts, s)); if (left) { errs.push(`${w}: {${left[1]}} has no word in names.${sc.graph}`); break; } }
  }
  for (const g of GRAPHS) if (!(data.contexts || []).some(c => c.graph === g)) errs.push(`graph ${g} has no drill context`);
  for (const c of data.contexts || []) {
    if (!GRAPHS.includes(c.graph)) errs.push(`context ${c.id}: unknown graph "${c.graph}"`);
    for (const t of c.types || []) if (!TYPES.includes(t)) errs.push(`context ${c.id}: unknown type "${t}"`);
    for (const t of c.types || []) if (!GS.poolOf(c, t, data).length) errs.push(`context ${c.id}: type ${t} has no scenario`);
  }
  if (errs.length) return errs;
  sweep(data, errs, (r, c, t) => GS.generate(r, c, t, data), (p, c, w) => recheck(p, c, w, data, errs), c => c.types);
  void M;
  return errs;
}

/* ------------------------------------------------ own arithmetic */
const at = (spec, off, id, base) => base + ((spec.start || {})[id] || 0) + (off[id] || 0);
function mergeOff(a, b) { const o = { ...(a || {}) }; for (const [k, v] of Object.entries(b || {})) o[k] = (o[k] || 0) + v; return o; }
// A straight-line market: demand slope -1 through (aD, 5), supply +1 through (aS, 5).
const cross = (aD, aS) => [(aD + aS) / 2, 5 + (aD - aS) / 2];
const dir = (a, b) => Math.abs(a - b) < 1e-6 ? 'same' : a > b ? 'up' : 'down';
function marketPair(kind) { return kind === 'labor' ? ['DL', 'SL', 'wage', 'quantity of labor'] : ['D', 'S', 'price', 'quantity']; }
/* The outcome of the key's shifts on the market, by hand. */
export function ownOutcome(spec, off) {
  const [d, s, y, x] = marketPair(spec.kind), aD0 = at(spec, {}, d, 5), aS0 = at(spec, {}, s, 5), aD1 = at(spec, off, d, 5), aS1 = at(spec, off, s, 5);
  const e0 = cross(aD0, aS0), e1 = cross(aD1, aS1);
  return { [y]: dir(e1[1], e0[1]), [x]: dir(e1[0], e0[0]) };
}
/* The cost model's coefficients are the engine's data (G.COST); the curves
   and their solutions below are this file's own algebra. */
function cost(G, kind, natural) { return kind === 'monopoly' && natural ? G.COST.natural : kind === 'monopoly' || kind === 'monocomp' ? G.COST.monopoly : G.COST.firm; }
const MCf = (p, o) => q => p.a - 2 * p.b * q + 3 * p.c * q * q + o;
const AVCf = (p, o) => q => p.a - p.b * q + p.c * q * q + o;
const ATCf = (p, o, s) => q => p.a - p.b * q + p.c * q * q + o + Math.max(0.4, p.F + s * p.Fstep) / q;
// The larger root of A q^2 + B q + C = 0 (the rising part of MC).
function bigRoot(A, B, C) { if (Math.abs(A) < 1e-12) return -C / B; const disc = B * B - 4 * A * C; return disc < 0 ? null : (-B + Math.sqrt(disc)) / (2 * A); }
function argmin(f, lo, hi) { let a = lo, b = hi; for (let i = 0; i < 200; i++) { const m1 = a + (b - a) / 3, m2 = b - (b - a) / 3; if (f(m1) < f(m2)) b = m2; else a = m1; } return (a + b) / 2; }
function bisect(f, lo, hi) { let fl = f(lo); for (let i = 0; i < 100; i++) { const m = (lo + hi) / 2, fm = f(m); if (fl * fm <= 0) hi = m; else { lo = m; fl = fm; } } return (lo + hi) / 2; }
/* A named point by hand, or undefined when this file has no formula for it. */
export function ownPoint(G, spec, off, name, lineV) {
  const k = spec.kind, p = cost(G, k, spec.natural), oMC = at(spec, off, 'MC', 0), sATC = at(spec, off, 'ATC', 0);
  const MC = MCf(p, oMC), ATC = ATCf(p, oMC, sATC), AVC = AVCf(p, oMC);
  if (k === 'monopoly' || k === 'monocomp') {
    const aD = k === 'monocomp' && spec.run === 'long' ? G.find(G.curves(spec, {}), 'D').at + (off.D || 0) : at(spec, off, 'D', 5);
    const D = q => 5 - (q - aD);
    // MR = 5 + aD - 2q = MC: 3c q^2 + (2 - 2b) q + (a + oMC - 5 - aD) = 0
    if (name === 'profit-max' || name === 'mr=mc') { const q = bigRoot(3 * p.c, 2 - 2 * p.b, p.a + oMC - 5 - aD); return name === 'mr=mc' ? [q, 5 + aD - 2 * q] : [q, D(q)]; }
    if (name === 'allocative') { const q = bigRoot(3 * p.c, 1 - 2 * p.b, p.a + oMC - 5 - aD); return [q, D(q)]; }
    if (name === 'revenue-max') { const q = (5 + aD) / 2; return [q, D(q)]; }
    if (name === 'fair-return') { const g = q => D(q) - ATC(q); let q = null; for (let x = 10; x > 0.4; x -= 0.05) if (g(x) * g(x - 0.05) <= 0) { q = bisect(g, x - 0.05, x); break; } return q == null ? null : [q, D(q)]; }
    if (name === 'min-atc') { const q = argmin(ATC, 0.3, 10); return [q, ATC(q)]; }
  }
  if (k === 'costs' || k === 'pc') {
    if (name === 'min-atc') { const q = argmin(ATC, 0.3, 10); return [q, ATC(q)]; }
    if (name === 'min-avc') { const q = p.b / (2 * p.c); return [q, AVC(q)]; }
    if (name === 'mes') return [5, 3 + at(spec, off, 'LRATC', 0)];
    if (name === 'firm') { const P = lineV != null ? lineV : cross(at(spec, off, 'D', 5), at(spec, off, 'S', 5))[1]; const q = bigRoot(3 * p.c, -2 * p.b, p.a + oMC - P); return [q, P]; }
  }
  if (k === 'labor' && name === 'firm') { const W = lineV != null ? lineV : cross(at(spec, off, 'DL', 5), at(spec, off, 'SL', 5))[1]; return [5 + at(spec, off, 'MRP', 5) - W, W]; }
  if (k === 'monopsony') {
    const aS = at(spec, off, 'SL', 4), aR = at(spec, off, 'MRP', 5);
    // MFC = 5 - aS + 2L, MRP = 5 + aR - L, SL = 5 + L - aS
    if (name === 'hire') { const L = (aR + aS) / 3; return [L, 5 + L - aS]; }
    if (name === 'mrp=mfc') { const L = (aR + aS) / 3; return [L, 5 + aR - L]; }
    if (name === 'competitive') { const L = (aR + aS) / 2; return [L, 5 + L - aS]; }
  }
  if (k === 'externality') {
    const e = spec.ext, gap = e.gap || 2, aD = at(spec, off, 'D', 5), aS = at(spec, off, 'S', 5);
    if (name === 'market') return cross(aD, aS);
    // The social curve sits gap steps from the private one, fixed where the private curve started.
    if (name === 'efficient') { const sign = { 'neg-prod': -1, 'pos-prod': 1, 'pos-cons': 1, 'neg-cons': -1 }[e.type]; return /prod/.test(e.type) ? cross(aD, 5 + sign * gap) : cross(5 + sign * gap, aS); }
  }
  return undefined;
}
/* The area of a named region by its own formula, or undefined. */
export function ownArea(G, spec, region) {
  const off = mergeOff(G.fixedOffsets(spec), {}), k = spec.kind, P = spec.policy;
  const aD = at(spec, off, 'D', 5), aS = at(spec, off, 'S', 5), D = x => 5 - (x - aD), S = x => 5 + (x - aS);
  const [Qe, Pe] = cross(at(spec, {}, 'D', 5), at(spec, {}, 'S', 5)), D0 = x => 5 - (x - at(spec, {}, 'D', 5)), S0 = x => 5 + (x - at(spec, {}, 'S', 5));
  const tri = (b, h) => 0.5 * b * h;
  if (k === 'sd-micro' && !P) return { cs: tri(Qe, D0(0) - Pe), ps: tri(Qe, Pe - S0(0)), ts: tri(Qe, D0(0) - S0(0)) }[region];
  if (k === 'sd-micro' && P.type === 'ceiling') { const Q = P.at - 5 + at(spec, {}, 'S', 5); return { dwl: tri(Qe - Q, D0(Q) - S0(Q)), cs: Q * (D0(0) + D0(Q)) / 2 - P.at * Q }[region]; }
  if (k === 'sd-micro' && P.type === 'floor') { const Q = 5 + at(spec, {}, 'D', 5) - P.at; return { dwl: tri(Qe - Q, D0(Q) - S0(Q)), ps: P.at * Q - Q * (S0(0) + S0(Q)) / 2 }[region]; }
  if (k === 'sd-micro' && P.type === 'tax') { const t = P.amount, Q = Qe - t / 2; return { 'tax-revenue': t * Q, dwl: tri(Qe - Q, t), 'buyer-burden': (D0(Q) - Pe) * Q }[region]; }
  if (k === 'sd-micro' && P.type === 'subsidy') { const s = P.amount, Q = Qe + s / 2; return { 'subsidy-cost': s * Q, dwl: tri(Q - Qe, s) }[region]; }
  if (k === 'sd-micro' && P.type === 'world') { const w = P.at, Qd = 5 + at(spec, {}, 'D', 5) - w, Qs = w - 5 + at(spec, {}, 'S', 5); return { gain: tri(Qd - Qs, Pe - w), ps: Qs * (w - S0(0)) / 2, cs: tri(Qd, D0(0) - w) }[region]; }
  if (k === 'sd-micro' && P.type === 'tariff') { const w = P.at, t = w + P.amount, qd = x => 5 + at(spec, {}, 'D', 5) - x, qs = x => x - 5 + at(spec, {}, 'S', 5); return { 'tariff-revenue': P.amount * (qd(t) - qs(t)), dwl: tri(qs(t) - qs(w), P.amount) + tri(qd(w) - qd(t), P.amount) }[region]; }
  if (k === 'pc') {
    const p = cost(G, k), Pm = cross(aD, aS)[1], q = bigRoot(3 * p.c, -2 * p.b, p.a + at(spec, off, 'MC', 0) - Pm), A = ATCf(p, at(spec, off, 'MC', 0), at(spec, off, 'ATC', 0))(q);
    return { profit: (Pm - A) * q, loss: (A - Pm) * q }[region];
  }
  if (k === 'monopoly' || k === 'monocomp') {
    const p = cost(G, k, spec.natural), pm = ownPoint(G, spec, off, 'profit-max'), al = ownPoint(G, spec, off, 'allocative'), A = ATCf(p, at(spec, off, 'MC', 0), at(spec, off, 'ATC', 0))(pm[0]);
    const Dm = x => 5 - (x - (k === 'monocomp' && spec.run === 'long' ? G.find(G.curves(spec, {}), 'D').at : aD)), MC = MCf(p, at(spec, off, 'MC', 0));
    let dwl = 0; const n = 400; for (let i = 0; i < n; i++) { const x = pm[0] + (al[0] - pm[0]) * (i + 0.5) / n; dwl += (Dm(x) - MC(x)) * (al[0] - pm[0]) / n; }
    return { profit: (pm[1] - A) * pm[0], loss: (A - pm[1]) * pm[0], cs: tri(pm[0], Dm(0) - pm[1]), dwl }[region];
  }
  if (k === 'monopsony') { const h = ownPoint(G, spec, off, 'hire'), c = ownPoint(G, spec, off, 'competitive'), mrpH = 5 + at(spec, off, 'MRP', 5) - h[0]; return { 'wage-bill': h[0] * h[1], dwl: tri(c[0] - h[0], mrpH - h[1]) }[region]; }
  if (k === 'externality') { const g = spec.ext.gap || 2; return { dwl: tri(g / 2, g) }[region]; }
  if (k === 'lorenz') { const c = G.find(G.curves(spec, off), 'LC'), e = Math.max(1.08, 2.2 - 0.35 * c.at); return { gini: 50 - 100 / (e + 1) }[region]; }
  return undefined;
}

/* ------------------------------------------------- each problem */
export function recheck(p, ctx, w, data, errs = []) {
  const push = m => errs.push(`${w}: ${m}`);
  const { Graph: G, Grade: GR, model: GS } = runtime('graph-studio');
  const sc = (data.scenarios || []).find(s => s.id === p.scenario);
  if (!sc) { push(`unknown scenario ${p.scenario}`); return errs; }
  if (p.kind !== KIND[sc.graph]) push(`kind ${p.kind} is not ${KIND[sc.graph]}`);
  for (const s of p.steps) {
    if (s.kind === 'graph') {
      const sp = s.spec, bad = G.check(sp);
      if (bad.length) { push(`step ${s.key}: ${bad.join('; ')}`); continue; }
      const key = G.keyResponse(sp), g = GR.graph(sp, key), pt = g.points.find(x => x.id === s.task);
      if (!pt || !pt.ok) { push(`step ${s.key}: its key does not earn the ${s.task} point`); continue; }
      const blank = { shifts: {}, eq: G.eq(sp, {}), point: null, labels: {}, line: G.lineStart(sp), shade: [] };
      // A later step starts from the earlier steps' (right) answers: the line from the old price after the key's shift.
      if (s.task === 'line' || s.task === 'point') blank.shifts = key.shifts;
      if (s.task !== 'equilibrium' && GR.graph(sp, blank).points.find(x => x.id === s.task).ok) push(`step ${s.key}: an untouched graph earns the ${s.task} point`);
      if (s.task === 'shift') {
        // Planted slip: the right curves the wrong way lose the point with a note.
        const wrong = {}; for (const [c, v] of Object.entries(key.shifts)) wrong[c] = -v;
        const q = GR.graph(sp, { ...key, shifts: wrong }).points.find(x => x.id === 'shift');
        if (q.ok || !q.note) push(`step ${s.key}: shifting the right curve the wrong way is not caught`);
        if (sc.slips) for (const c of Object.keys(sc.slips).filter(c => G.movable(sp).includes(c) && !key.shifts[c])) {
          const q2 = GR.graph(sp, { ...key, shifts: { [c]: 1 } }).points.find(x => x.id === 'shift');
          if (q2.ok || q2.note !== sp.slips[c]) push(`step ${s.key}: shifting ${c} does not give its authored slip`);
        }
      }
      if (s.task === 'point' && sp.key.point.at) {
        const off = mergeOff(G.fixedOffsets(sp), key.shifts), lineV = sp.do.includes('line') ? key.line : null;
        const mine = ownPoint(G, sp, off, sp.key.point.at, lineV), eng = G.named(sp, off, sp.key.point.at, lineV);
        if (mine === undefined) push(`step ${s.key}: no independent formula for ${sp.key.point.at} on ${sp.kind}`);
        else if (!mine || !eng || Math.abs(mine[0] - eng[0]) > 0.02 || Math.abs(mine[1] - eng[1]) > 0.02) push(`step ${s.key}: ${sp.key.point.at} by hand is ${JSON.stringify(mine)}, the engine says ${JSON.stringify(eng)}`);
        // A slip point (the other named point) loses the point, with the slip named.
        for (const [want, other, note] of GS.POINT_SLIP) {
          if (want !== sp.key.point.at) continue;
          const o = G.named(sp, off, other, lineV); if (!o || Math.hypot(o[0] - eng[0], o[1] - eng[1]) < 0.7) continue;
          const r = { ...key, point: o }, q = GR.graph(sp, r).points.find(x => x.id === 'point');
          if (q.ok) push(`step ${s.key}: placing ${other} for ${want} is graded right`);
          else if (GS.refine(sp, 'point', r, q.note) !== note) push(`step ${s.key}: placing ${other} for ${want} does not name the slip`);
        }
      }
      if (s.task === 'point' && sp.key.point.region) {
        const P2 = key.point, r0 = Math.hypot(P2[0], P2[1]), c = G.find(G.curves(sp, {}), 'PPC').at, mine = Math.abs(r0 - c) <= 0.4 ? 'on' : r0 < c ? 'inside' : 'outside';
        if (mine !== sp.key.point.region) push(`step ${s.key}: the key point is ${mine} the PPC by hand, not ${sp.key.point.region}`);
      }
      if (s.task === 'line') {
        const KL = sp.key.line, e = G.eq(sp, key.shifts);
        if (KL.to === 'eq') { const [d0, s0] = marketPair(sp.kind), mine = cross(at(sp, key.shifts, d0, 5), at(sp, key.shifts, s0, 5))[1]; if (Math.abs(mine - key.line) > 1e-6) push(`step ${s.key}: the line key ${key.line} is not the market's new price ${mine}`); }
        if (KL.side && (KL.side === 'below' ? !(key.line < e[1]) : !(key.line > e[1]))) push(`step ${s.key}: the line key is not ${KL.side} the equilibrium`);
      }
      if (s.task === 'shade') {
        const A = G.areas(sp), names = [].concat(sp.key.shade);
        if (names.length === 1) {
          const cells = G.regionCells(sp, names[0]), got = A.cells.filter(c => cells.includes(c.id)).reduce((n, c) => n + G.polyArea(c.poly), 0), mine = ownArea(G, sp, names[0]);
          if (mine === undefined) push(`step ${s.key}: no independent formula for ${names[0]} on ${sp.kind}${sp.policy ? ' ' + sp.policy.type : ''}`);
          else if (!(mine > 0.05) || !close(got, mine, 0.02, 0.02)) push(`step ${s.key}: ${names[0]} by hand is ${mine.toFixed(3)}, the shaded cells make ${got.toFixed(3)}`);
        }
      }
    } else if (s.key === 'outcome') {
      const sp = p.main, o = ownOutcome(sp, G.keyOffsets(sp)), key = s.keys[s.correct];
      for (const [k, v] of Object.entries(key)) if (o[k] !== v) push(`outcome: the key says ${k} ${v}, by hand it is ${o[k]}`);
    } else if (s.key === 'move') {
      const want = SHIFTER[`${sc.graph}:${sc.shifter}`], k2 = s.keys[s.correct];
      if (typeof want === 'string' ? k2.along !== want.slice(6) : k2.shift !== want[0][0]) push(`move: the key ${JSON.stringify(k2)} does not match ${JSON.stringify(want)}`);
    }
    if (s.kind === 'choice' && /^check-/.test(s.key)) {
      const c = sc.check[+s.key.split('-')[1] - 1];
      if (s.options[s.correct] !== GS.fill(c.options[c.correct || 0], p.words)) push(`${s.key}: the shuffled key is not the authored answer`);
    }
  }
  return errs;
}
