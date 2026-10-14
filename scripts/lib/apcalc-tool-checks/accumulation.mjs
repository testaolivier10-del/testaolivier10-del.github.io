/* Validator for calculus/data/tools/accumulation.json (Accumulation), run by
   scripts/check-apcalc-content.mjs. OWNED BY THIS TOOL ONLY.
   check(data, map) -> problems. The explore presets are checked (pieces
   joined end to end, semicircles on the axis, lower limits on the graph,
   tank rates and units); the model's exact areas are checked against
   numerical integration; then every context and type is regenerated SEEDS
   times through the model the page runs (ApCalcMath.accumulation.generate)
   and every key is recomputed here by numerical integration and
   differentiation of the graph, never by the model's geometry: values of g,
   signs and slopes of f for each justified choice, F′ by differencing the
   integral itself, h from h′ and its absolute maximum by a fine search, and
   the tank's amount by integrating R − D. */
import { frame, sweep, close } from './_drills.mjs';
import { runtime, topicOk } from './_shared.mjs';

const TYPES = ['values', 'behavior', 'derivs', 'chain', 'netgraph', 'tank'];
const plain = s => String(s).replace(/<annotation[\s\S]*?<\/annotation>/g, '').replace(/<[^>]+>/g, '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/−/g, '-').replace(/\s+/g, ' ').trim();
const numIn = (s, re) => { const m = re.exec(plain(s)); return m ? +m[1] : NaN; };

/* f from its pieces, written here again (not the model's val). */
function fOf(P) {
  return x => {
    for (const p of P) if (x >= p.x0 - 1e-12 && x <= p.x1 + 1e-12) {
      if (p.k === 'line') return p.y0 + (p.y1 - p.y0) * (x - p.x0) / (p.x1 - p.x0);
      const r = (p.x1 - p.x0) / 2, u = x - (p.x0 + r);
      return p.s * Math.sqrt(Math.max(0, r * r - u * u));
    }
    return NaN;
  };
}
function piecesOk(P, w, errs) {
  if (!Array.isArray(P) || P.length < 2) { errs.push(`${w}: at least two pieces`); return false; }
  let ok = true;
  P.forEach((p, i) => {
    if (!(p.x1 > p.x0)) { errs.push(`${w}: piece ${i} has x1 <= x0`); ok = false; }
    if (p.k === 'semi' && Math.abs(p.s) !== 1) { errs.push(`${w}: semicircle ${i} needs s = 1 or -1`); ok = false; }
    if (!['line', 'semi'].includes(p.k)) { errs.push(`${w}: piece ${i} kind "${p.k}"`); ok = false; }
    if (i) {
      const q = P[i - 1], yq = q.k === 'line' ? q.y1 : 0, yp = p.k === 'line' ? p.y0 : 0;
      if (q.x1 !== p.x0) { errs.push(`${w}: piece ${i} does not start where piece ${i - 1} ends`); ok = false; }
      if (Math.abs(yq - yp) > 1e-9) { errs.push(`${w}: f jumps at x = ${p.x0} (${yq} to ${yp})`); ok = false; }
    }
  });
  return ok;
}

export function check(data, map) {
  const errs = [];
  frame(data, 'accumulation', 'simulator', map, errs);
  const { M, Expr, model } = runtime('accumulation');
  if (!model || typeof model.generate !== 'function') { errs.push('calculus/assets/tools/math/accumulation.js does not register ApCalcMath.accumulation with a generate()'); return errs; }
  const I = (f, a, b) => M.integral(f, a, b, 1e-10);
  // integrate a piecewise f by pieces of width 1 so every corner is a break
  const IP = (f, a, b) => { if (a > b) return -IP(f, b, a); let s = 0; for (let x = a; x < b - 1e-12; x = Math.min(b, Math.floor(x + 1 + 1e-9))) s += I(f, x, Math.min(b, Math.floor(x + 1 + 1e-9))); return s; };

  // ---- explore presets
  const E = data.explore || {}, ids = new Set();
  const seen = id => { if (!id || ids.has(id)) errs.push(`explore: missing or duplicate id "${id}"`); ids.add(id); };
  if (!(E.graphs || []).length) errs.push('explore.graphs: at least one graph');
  for (const g of E.graphs || []) {
    seen(g.id);
    if (!topicOk(g.topic, map)) errs.push(`explore ${g.id}: unknown topic "${g.topic}"`);
    if (!g.name) errs.push(`explore ${g.id}: a name`);
    if (!piecesOk(g.pieces, `explore ${g.id}`, errs)) continue;
    const D = model.domain(g.pieces);
    if (!(g.a >= D[0] && g.a <= D[1]) || !model.specials(g.pieces).includes(g.a)) errs.push(`explore ${g.id}: the lower limit ${g.a} must be a labelled point of the graph`);
    const f = fOf(g.pieces);
    for (const x of model.specials(g.pieces)) for (const a of [D[0], g.a]) {
      const want = IP(f, a, x), got = model.area(g.pieces, a, x), e = model.exact(g.pieces, a, x);
      if (!close(got, want, 1e-7, 1e-7)) errs.push(`explore ${g.id}: area from ${a} to ${x} is ${got}, numerically ${want}`);
      if (!e || !close(e.p + e.q * Math.PI, want, 1e-7, 1e-7)) errs.push(`explore ${g.id}: exact area from ${a} to ${x} is wrong`);
    }
  }
  for (const g of E.formulas || []) {
    seen(g.id);
    if (!topicOk(g.topic, map)) errs.push(`explore ${g.id}: unknown topic "${g.topic}"`);
    if (!g.tex || g.tex.includes('$') || !g.name) errs.push(`explore ${g.id}: a name and a tex (no $)`);
    let f; try { f = M.fn(g.fn); } catch (e) { errs.push(`explore ${g.id}: fn does not parse`); continue; }
    if (!(g.x[1] > g.x[0]) || g.a < g.x[0] || g.a > g.x[1]) errs.push(`explore ${g.id}: x range and lower limit`);
    for (let i = 0; i <= 100; i++) if (!Number.isFinite(f(g.x[0] + (g.x[1] - g.x[0]) * i / 100))) { errs.push(`explore ${g.id}: f is not finite on its range`); break; }
  }
  for (const t of E.tanks || []) {
    seen(t.id);
    if (!topicOk(t.topic, map)) errs.push(`explore ${t.id}: unknown topic "${t.topic}"`);
    for (const k of ['name', 'R', 'D', 'Rtex', 'Dtex', 'unit', 'unitAbbr', 'rateUnit', 'tUnit']) if (!t[k]) errs.push(`explore tank ${t.id}: "${k}" is required`);
    if (t.rateUnit && t.unit && !t.rateUnit.startsWith(t.unit + ' per ')) errs.push(`explore tank ${t.id}: the rate unit should be "${t.unit} per <time>"`);
    const R = M.fn(t.R), D = M.fn(t.D);
    for (let i = 0; i <= 120; i++) {
      const s = t.T * i / 120;
      if (R(s) < 0 || D(s) < 0) { errs.push(`explore tank ${t.id}: a rate is negative at t = ${s}`); break; }
      if (t.A0 + I(x => R(x) - D(x), 0, s) < 0) { errs.push(`explore tank ${t.id}: the tank would hold less than nothing at t = ${s}`); break; }
    }
  }

  // ---- drills
  for (const c of data.contexts || []) {
    for (const t of c.types || []) if (!TYPES.includes(t)) errs.push(`context ${c.id}: unknown type "${t}"`);
    if ((c.types || []).includes('tank')) {
      for (const k of ['lead', 'inWords', 'outWords', 'unit', 'rateUnit', 'tUnit', 'where']) if (!c[k]) errs.push(`context ${c.id}: "${k}" is required`);
      if (c.rateUnit && c.unit && !c.rateUnit.startsWith(c.unit + ' per ')) errs.push(`context ${c.id}: rateUnit should read "${c.unit} per ..."`);
    }
  }
  const step = (p, key) => p.steps.find(s => s.key === key);
  const opt = s => plain(s.options[s.correct]);
  sweep(data, errs, (r, c, t) => model.generate(r, c, t), (p, c, w) => {
    const bad = m => errs.push(`${w}: ${m}`);
    const P = p.graph, f = P ? fOf(P) : null;
    if (P) piecesOk(P, w, errs);
    const g = x => IP(f, p.a, x);
    const slope = x => (f(x + 1e-4) - f(x - 1e-4)) / 2e-4;
    if (p.type === 'values') {
      for (const k of ['g1', 'g2']) {
        const s = step(p, k), x = numIn(s.label, /g\((-?[\d.]+)\)/), want = g(x);
        if (!close(s.cell.answer, want, 1e-7, 1e-7)) bad(`${k}: g(${x}) key ${s.cell.answer}, numerically ${want}`);
      }
    } else if (p.type === 'behavior') {
      let s = step(p, 'incr'), m = /\((-?[\d.]+), (-?[\d.]+)\)/.exec(plain(s.label)), mid = (+m[1] + +m[2]) / 2;
      const pos = f(mid) > 0, o = opt(s);
      if (!(pos ? /increasing .* f\(x\) > 0/ : /decreasing .* f\(x\) < 0/).test(o)) bad(`incr: on (${m[1]}, ${m[2]}) f is ${pos ? 'positive' : 'negative'} but the key says "${o}"`);
      for (let i = 1; i < 40; i++) { const x = +m[1] + (+m[2] - +m[1]) * i / 40; if ((f(x) > 0) !== pos || Math.abs(f(x)) < 1e-12) { bad(`incr: f changes sign inside (${m[1]}, ${m[2]})`); break; } }
      s = step(p, 'extremum'); const z = numIn(s.label, /x = (-?[\d.]+)/), l = f(z - 0.01), rr = f(z + 0.01);
      if (!(l * rr < 0)) bad(`extremum: f does not change sign at ${z}`);
      if (!(l > 0 ? /relative maximum, because f changes from positive to negative/ : /relative minimum, because f changes from negative to positive/).test(opt(s))) bad(`extremum at ${z}: wrong key "${opt(s)}"`);
      s = step(p, 'concave'); m = /\((-?[\d.]+), (-?[\d.]+)\)/.exec(plain(s.label)); mid = (+m[1] + +m[2]) / 2;
      const up = slope(mid) > 0;
      if (!(up ? /^Concave up, because f is increasing/ : /^Concave down, because f is decreasing/).test(opt(s))) bad(`concave on (${m[1]}, ${m[2]}): f′ ${up ? '>' : '<'} 0 but the key says "${opt(s)}"`);
      s = step(p, 'inflect');
      if (s) {
        const D = model.domain(P), sg = x => Math.sign(slope(x));
        s.options.forEach((o, i) => {
          const x = numIn(o, /x = (-?[\d.]+)/), is = x > D[0] && x < D[1] && sg(x - 0.02) * sg(x + 0.02) < 0;
          if ((i === s.correct) !== is) bad(`inflect: x = ${x} is ${is ? '' : 'not '}an inflection point of g but the key says otherwise`);
        });
      }
    } else if (p.type === 'derivs') {
      for (const k of ['gp', 'gp2']) {
        const s = step(p, k), x = numIn(s.label, /g′\((-?[\d.]+)\)/), h = 1e-4, want = (g(x + h) - g(x - h)) / (2 * h);
        if (!close(s.cell.answer, want, 1e-5, 1e-5)) bad(`${k}: g′(${x}) key ${s.cell.answer}, by differencing g ${want}`);
      }
      const s = step(p, 'gpp'), x = numIn(s.label, /g″\((-?[\d.]+)\)/), h = 1e-3, want = (g(x + h) - 2 * g(x) + g(x - h)) / (h * h);
      if (!close(s.cell.answer, want, 1e-3, 1e-3)) bad(`gpp: g″(${x}) key ${s.cell.answer}, by differencing g ${want}`);
    } else if (p.type === 'chain') {
      const C = p.chain, h = Expr.fn(C.h.replace(/T/g, 'x')), u = M.fn(C.u);
      const F = x => (C.flip ? -1 : 1) * I(h, C.a, u(x));
      const key = M.fn(step(p, 'deriv').cell.expr.answer);
      for (const x of [0.3, 0.7, 1.1, 1.6]) {
        const d = 1e-4, want = (F(x + d) - F(x - d)) / (2 * d);
        if (!close(key(x), want, 1e-5, 1e-5)) { bad(`chain: F′(${x}) key ${key(x)}, by differencing F ${want}`); break; }
      }
      if (Math.abs(F(C.at)) > 1e-12 || step(p, 'zero').cell.answer !== 0) bad(`chain: F(${C.at}) should be 0`);
      const tx = plain(p.text);
      if (!tx.includes('F(x)')) bad('chain: the text does not define F');
    } else if (p.type === 'netgraph') {
      const k = numIn(p.text, /h\((?:-?[\d.]+)\) = (-?[\d.]+)/), D = model.domain(P), H = x => k + g(x);
      for (const key of ['h1', 'h2']) {
        const s = step(p, key), x = numIn(s.label, /h\((-?[\d.]+)\)/);
        if (!close(s.cell.answer, H(x), 1e-7, 1e-7)) bad(`${key}: h(${x}) key ${s.cell.answer}, numerically ${H(x)}`);
      }
      // a fine search on a 0.025 grid (whole numbers included), adding one small integral per step
      let best = H(D[0]), acc = best;
      for (let x = D[0]; x < D[1] - 1e-9; x += 0.025) { acc += I(f, x, Math.min(D[1], x + 0.025)); best = Math.max(best, acc); }
      if (!close(step(p, 'absmax').cell.answer, best, 1e-5, 2e-4)) bad(`absmax: key ${step(p, 'absmax').cell.answer}, search ${best}`);
    } else if (p.type === 'tank') {
      const T = p.tank, R = M.fn(T.Rx), D = M.fn(T.Dx), t1 = numIn(step(p, 'rate').label, /t = (\d+)/);
      if (!close(step(p, 'rate').cell.answer, R(t1) - D(t1))) bad(`rate: key ${step(p, 'rate').cell.answer}, R − D = ${R(t1) - D(t1)}`);
      if (!(R(t1) - D(t1) > 0 ? /^Increasing, because R\(\d+\) > D/ : /^Decreasing, because R\(\d+\) < D/).test(opt(step(p, 'dir')))) bad('dir: wrong key');
      const A = s => T.A0 + I(x => R(x) - D(x), 0, s);
      if (!close(step(p, 'total').cell.answer, A(T.T), 1e-8, 1e-8)) bad(`total: key ${step(p, 'total').cell.answer}, ${A(T.T)}`);
      let bt = 0, bv = T.A0, acc = T.A0;
      for (let i = 1; i <= 400; i++) { const s0 = T.T * (i - 1) / 400, s1 = T.T * i / 400; acc += I(x => R(x) - D(x), s0, s1); if (acc > bv) { bv = acc; bt = s1; } }
      const said = numIn(step(p, 'when').options[step(p, 'when').correct], /t = (\d+)/);
      if (Math.abs(said - bt) > 0.02) bad(`when: key t = ${said}, search ${bt}`);
      for (let i = 0; i <= 60; i++) { const s = T.T * i / 60; if (R(s) <= 0 || D(s) <= 0) { bad('a rate is not positive'); break; } }
      if (!plain(p.text).includes(`there are ${T.A0} ${c.unit}`)) bad('the text does not state the initial amount');
    } else bad(`unknown type ${p.type}`);
  }, c => c.types || [undefined]);
  return errs;
}
