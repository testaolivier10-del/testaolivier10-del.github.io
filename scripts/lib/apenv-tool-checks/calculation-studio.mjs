/* Validator for environmental-science/data/tools/calculation-studio.json (Calculation studio), run
   by scripts/check-apenv-content.mjs. OWNED BY THIS TOOL ONLY (builder T1).
   check(data, map) -> problems. The frame (slug, kind, topic, intro,
   contexts), the explore chains (each key reached through ApEnvCalc.chain,
   so its units really cancel to the target), then 300 problems per context
   and type regenerated with the model the page runs
   (ApEnvMath.calculationStudio) and every key recomputed independently from
   the problem's givens with ApEnvCalc (never through the model): the setup
   key's value through ApEnvExpr, the answer, the year, the count of
   half-lives or doublings, and the right choice where it depends on a number
   (TFR against replacement). Every spec section 7 calculation type must have
   a context. */
import { frame, sweep, close } from './_drills.mjs';
import { runtime } from './_shared.mjs';

export const TYPES = ['pct-change', 'pct-of', 'doubling', 'growth', 'projection', 'ten-percent', 'npp', 'half-life', 'convert', 'per-capita',
  'efficiency', 'cost', 'emissions', 'dose', 'biomag', 'tfr', 'water', 'scale'];
const step = (p, k) => p.steps.find(s => s.key === k);
const ans = s => s.kind === 'unit' ? s.cell.numeric.answer : s.cell.answer;
const plain = s => String(s).replace(/<[^>]+>/g, ' ');

export function recheck(p, c, w, errs) {
  const { Calc: K, Expr } = runtime();
  const ev = (fn, args) => K.evaluate({ fn, args });
  const g = p.given, bad = m => errs.push(`${w}: ${m}`);
  if (!g) return bad('no givens on the problem');
  const want = (k, v, what) => { const s = step(p, k); if (!s) return bad(`no ${k} step`); if (!close(ans(s), v, 1e-9, 1e-12)) bad(`${what || k} key ${ans(s)}, recomputed ${v}`); };
  // The setup key's value (ApEnvExpr, units as value-1 factors) equals the answer.
  const setupIs = (v) => {
    const s = step(p, 'setup'); if (!s) return bad('no setup step');
    const S = s.cell.setup, r = Expr.evaluate(S.answer, S.bind || {}, S.units || []);
    if (!r.ok) return bad(`setup key "${S.answer}" does not parse: ${r.error}`);
    if (!close(r.value, v, 1e-9, 1e-12)) bad(`setup key "${S.answer}" = ${r.value}, recomputed ${v}`);
  };
  switch (p.type) {
    case 'pct-change': { const v = ev('percentChange', [g.old, g.nw]); setupIs(v); want('answer', v); if (!/\(/.test(step(p, 'setup').cell.setup.answer)) bad('percent change setup without brackets'); break; }
    case 'pct-of': { const v = ev('percentOf', [g.pct, g.q]); setupIs(v); want('answer', v); break; }
    case 'doubling': { const td = ev('ruleOf70', [g.rate]); setupIs(td); want('answer', td); want('year', ev('doublingYear', [g.y0, g.rate])); break; }
    case 'growth': {
      if (g.N != null) { const v = ev('growthRate', [g.b, g.d, g.im, g.em, g.N]); setupIs(v); want('answer', v); }
      else { const v = ev('naturalIncrease', [g.cbr, g.cdr]); setupIs(v); want('answer', v); want('year', ev('ruleOf70', [v]), 'doubling time'); }
      break;
    }
    case 'projection': {
      if (g.k != null) { const td = ev('ruleOf70', [g.rate]); want('n', g.t / td, 'doublings'); const v = ev('afterDoublings', [g.n0, g.t, td]); setupIs(v); want('answer', v); }
      else { const v = ev('exponential', [g.n0, g.rate, g.t]); setupIs(v); want('answer', v); }
      break;
    }
    case 'ten-percent': { const v = ev('tenPercent', [g.E, g.n]); setupIs(v); want('answer', v); break; }
    case 'npp': {
      const v = g.mode === 'npp' ? ev('npp', [g.gpp, g.resp]) : g.mode === 'gpp' ? ev('gpp', [ev('npp', [g.gpp, g.resp]), g.resp]) : ev('sub', [g.gpp, ev('npp', [g.gpp, g.resp])]);
      setupIs(v); want('answer', v); if (!/^NPP/.test(plain(step(p, 'why').options[0]))) bad('NPP choice key'); break;
    }
    case 'half-life': { want('n', ev('halfLives', [g.t, g.hl])); const v = ev('halfLifeLeft', [g.a, g.hl, g.t]); setupIs(v); want('answer', v); break; }
    case 'convert': case 'emissions': { const v = K.chain(g.v, g.startUnit, g.factors).value; setupIs(v); want('answer', v); break; }
    case 'water': { const v = ev('waterPerArea', [g.vol, g.area]); setupIs(v); want('answer', v); break; }
    case 'per-capita': case 'scale': { const v = ev(c.density ? 'density' : 'perCapita', [g.tot, g.N]); setupIs(v); want('answer', v); break; }
    case 'efficiency': {
      const o = ev('chainEfficiency', g.es); setupIs(o); want('answer', o);
      if (g.out != null) want('compare', ev('inputNeeded', [g.out, o]), 'input');
      break;
    }
    case 'cost': { const v = ev('mul', [ev('savings', [g.before, g.after, g.price]), g.perN]); setupIs(v); want('answer', v); if ([g.before, g.after].some(x => Math.abs(v - x) < 0.5)) bad(`the saving ${v} equals a number printed in the problem`); break; }
    case 'dose': { const ld = ev('ld50', [g.pts]); want('read', ld, 'LD50'); const v = ev('doseFor', [ld, g.kg]); setupIs(v); want('answer', v); break; }
    case 'biomag': { const v = ev('biomagnify', [g.c0, g.f, g.n]); setupIs(v); want('answer', v); break; }
    case 'tfr': {
      const t = ev('tfr', [g.asfr, 5]), a = ev('aboveReplacement', [t]); setupIs(t); want('answer', t);
      const k = plain(step(p, 'compare').options[0]);
      if (!(a > 0.05 ? /^Above/ : a < -0.05 ? /^Below/ : /^About at/).test(k)) bad(`TFR ${t} compared as "${k.slice(0, 30)}"`);
      break;
    }
    default: bad(`unknown type ${p.type}`);
  }
  // Every problem is one of the exam's: a setup, then an answer with its unit.
  if (!step(p, 'setup') || !step(p, 'answer')) bad('a problem needs a setup step and an answer step');
  const u = step(p, 'answer');
  if (u && u.kind !== 'unit') bad('the answer step must take a unit');
}

export function check(data, map) {
  const errs = [];
  frame(data, 'calculation-studio', 'simulator', map, errs);
  const { model, Calc: K } = runtime('calculation-studio');
  if (!model) { errs.push('no model registered (ApEnvMath.calculationStudio)'); return errs; }
  if (model.stub) return errs;
  // Every calculation type of spec section 7 has a context.
  const have = new Set((data.contexts || []).flatMap(c => c.types || []));
  for (const t of TYPES) if (!have.has(t)) errs.push(`no context drills the calculation type "${t}"`);
  for (const c of data.contexts || []) for (const t of c.types || []) if (!TYPES.includes(t)) errs.push(`context ${c.id}: unknown type "${t}"`);
  // The explore chains, recomputed outside the model: the key's factors typed
  // as a setup and read by ApEnvExpr, so the value is the product and the units
  // must cancel to the target, at every start value the slider allows.
  const { Expr } = runtime('calculation-studio');
  const typed = u => String(u).replace(/\*/g, ' ');
  for (const id of (data.explore && data.explore.chains) || []) {
    const scn = model.CHAINS[id];
    if (!scn) { errs.push(`explore chain "${id}" is not in the model`); continue; }
    const units = ['bulb', 'bulbs'], bind = { CO2: 1 }, want = Expr.unitDims(typed(scn.target).replace(/\s*CO2\b/g, ''), units);
    for (let v = scn.start.min; v <= scn.start.max; v += scn.start.step) {
      const fs = model.keyFactors(scn);
      if (fs.length !== scn.tray.filter(t => !t.decoy).length) { errs.push(`chain ${id}: the key does not use every real factor`); break; }
      const src = `${v} ${typed(scn.start.unit)}` + fs.map(f => ` * ${f[0]} ${typed(f[1])} / (${f[2]} ${typed(f[3])})`).join('');
      const r = Expr.evaluate(src, bind, units);
      if (!r.ok) { errs.push(`chain ${id}: "${src}" does not parse: ${r.error}`); break; }
      if (Expr.dimText(r.dims) !== Expr.dimText(want)) { errs.push(`chain ${id}: units come out as ${Expr.dimText(r.dims)}, not ${Expr.dimText(want)}`); break; }
      const val = fs.reduce((a, f) => K.evaluate({ fn: 'mul', args: [a, { fn: 'div', args: [f[0], f[2]] }] }), v);
      if (!close(r.value, val, 1e-9) || !close(model.chainKey(scn, v), val, 1e-9)) { errs.push(`chain ${id} at ${v}: key ${model.chainKey(scn, v)}, recomputed ${val}`); break; }
      const s = model.chainState(scn, v, model.keyOrder(scn));
      if (!s.done) { errs.push(`chain ${id}: the key order leaves ${s.leftText}, not ${s.targetText}`); break; }
      if (!close(s.value, val, 1e-9)) { errs.push(`chain ${id}: the running value ${s.value} is not ${val}`); break; }
      const sv = Expr.evaluate(s.setup, bind, units);
      if (!sv.ok || !close(sv.value, val, 1e-9)) { errs.push(`chain ${id}: its typed setup "${s.setup}" is not the key`); break; }
    }
  }
  sweep(data, errs, (r, c, t) => model.generate(r, c, t), (p, c, w) => recheck(p, c, w, errs), c => c.types || [undefined]);
  return errs;
}
