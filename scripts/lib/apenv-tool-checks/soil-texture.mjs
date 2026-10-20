/* Validator for environmental-science/data/tools/soil-texture.json (Soil
   texture), run by scripts/check-apenv-content.mjs. OWNED BY THIS TOOL ONLY
   (builder T2). check(data, map) -> problems. The frame; then 300 problems
   per context and type regenerated with the model the page runs
   (ApEnvMath.soilTexture), every step sound (_drills.mjs), and every key
   recomputed independently: percents through ApEnvCalc and summing to 100,
   the class by the USDA rules written out again here (not the model's
   function), the percolation rate from the givens. */
import { frame, sweep, close } from './_drills.mjs';
import { runtime } from './_shared.mjs';

export const TYPES = ['classify', 'missing', 'porosity', 'horizons', 'erosion', 'percolation'];

/* The USDA texture classes (Soil Survey Manual 2017), restated for the
   validator so a slip in the model's classify() is caught. */
export function usda(sand, silt, clay) {
  const s = sand, si = silt, c = clay;
  if (si + 1.5 * c < 15) return 'Sand';
  if (si + 2 * c < 30) return 'Loamy sand';
  if ((c >= 7 && c < 20 && s > 52) || (c < 7 && si < 50)) return 'Sandy loam';
  if (c >= 7 && c < 27 && si >= 28 && si < 50 && s <= 52) return 'Loam';
  if (si >= 80 && c < 12) return 'Silt';
  if ((si >= 50 && c >= 12 && c < 27) || (si >= 50 && si < 80 && c < 12)) return 'Silt loam';
  if (c >= 20 && c < 35 && si < 28 && s > 45) return 'Sandy clay loam';
  if (c >= 27 && c < 40 && s > 20 && s <= 45) return 'Clay loam';
  if (c >= 27 && c < 40 && s <= 20) return 'Silty clay loam';
  if (c >= 35 && s > 45) return 'Sandy clay';
  if (c >= 40 && si >= 40) return 'Silty clay';
  return 'Clay';
}

const stepOf = (p, k) => p.steps.find(s => s.key === k);
const key = s => s.options[s.correct];

export function recheck(p, c, w, errs) {
  const { Calc, M, model: S } = runtime('soil-texture');
  const g = p.givens || {};
  const want = (k, v) => { const s = stepOf(p, k), a = s && s.cell.numeric.answer; if (!close(a, v)) errs.push(`${w}: step ${k} key ${a} but ApEnvCalc gives ${v}`); };
  const setupIs = (k, v) => { const s = stepOf(p, k), r = s && M.evaluate(s.cell.setup.answer, {}, []); if (!r || !r.ok || !close(r.value, v)) errs.push(`${w}: step ${k} setup does not evaluate to ${v}`); };
  const sumOk = () => { const t = Calc.evaluate({ fn: 'add', args: [g.sand, g.silt, g.clay] }); if (t !== 100) errs.push(`${w}: ${g.sand} + ${g.silt} + ${g.clay} = ${t}, not 100`); if ([g.sand, g.silt, g.clay].some(x => x < 0 || x !== Math.round(x))) errs.push(`${w}: percents must be whole and not negative`); };
  switch (p.type) {
    case 'classify': {
      sumOk();
      const name = usda(g.sand, g.silt, g.clay);
      if (key(stepOf(p, 'class')) !== name) errs.push(`${w}: ${g.sand}/${g.silt}/${g.clay} keyed "${key(stepOf(p, 'class'))}", USDA gives ${name}`);
      if (S.margin(g.sand, g.silt, g.clay) < 3) errs.push(`${w}: the point is within 3 points of a class boundary`);
      const d = stepOf(p, 'drain'), r = S.INFIL[g.cls] / S.INFIL.loam, ex = r > 1.5 ? 'Faster' : r < 1 / 1.5 ? 'Slower' : 'About the same';
      if (key(d) !== ex) errs.push(`${w}: drainage keyed "${key(d)}" for ${g.cls}, expected ${ex}`);
      break;
    }
    case 'missing': {
      sumOk();
      const known = ['sand', 'silt', 'clay'].filter(n => n !== g.which);
      const v = Calc.evaluate({ fn: 'sub', args: [100, { fn: 'add', args: [g[known[0]], g[known[1]]] }] });
      want('ans', v); setupIs('setup', v);
      if (v !== g[g.which]) errs.push(`${w}: missing ${g.which} is ${v}, givens say ${g[g.which]}`);
      const name = usda(g.sand, g.silt, g.clay);
      if (key(stepOf(p, 'class')) !== name) errs.push(`${w}: class keyed "${key(stepOf(p, 'class'))}", USDA gives ${name}`);
      break;
    }
    case 'porosity': {
      g.qs.forEach((qi, j) => { const q = S.PORO_Q[qi], s = stepOf(p, 'p' + (j + 1)); if (key(s) !== q.options[0]) errs.push(`${w}: porosity step ${j + 1} key is not the table's answer`); });
      if (g.qs[0] === g.qs[1]) errs.push(`${w}: the same question twice`);
      break;
    }
    case 'erosion': {
      g.qs.forEach((qi, j) => { const q = S.EROSION_Q[qi], s = stepOf(p, 'e' + (j + 1)); if (key(s) !== q.options[0]) errs.push(`${w}: erosion step ${j + 1} key is not the table's answer`); });
      if (g.qs[0] === g.qs[1]) errs.push(`${w}: the same question twice`);
      break;
    }
    case 'horizons': {
      for (const [k, id] of [['h1', g.a], ['h2', g.b]]) { const H = S.HORIZONS.find(h => h.id === id); if (key(stepOf(p, k)) !== H.name) errs.push(`${w}: ${k} keyed "${key(stepOf(p, k))}", not ${H.name}`); }
      if (key(stepOf(p, 'order')) !== 'O, A, E, B, C, R') errs.push(`${w}: horizon order key is wrong`);
      if ([...S.HORIZONS].map(h => h.id).join('') !== 'OAEBCR') errs.push(`${w}: horizons out of order in the model`);
      break;
    }
    case 'percolation': {
      const hrs = Calc.evaluate({ fn: 'convert', args: [g.mins, 'min', 'h'] });
      const v = Calc.evaluate({ fn: 'div', args: [g.drop, hrs] });
      want('ans', v); setupIs('setup', v);
      const sandy = ['sand', 'loamy-sand', 'sandy-loam'].includes(g.cls);
      if (sandy && !(v >= 1.5)) errs.push(`${w}: a sandy soil at ${v} cm/hr is too slow to call sandy`);
      if (!sandy && !(v < 1.2)) errs.push(`${w}: a clayey soil at ${v} cm/hr is too fast to call clayey`);
      if (key(stepOf(p, 'soil')) !== (sandy ? 'Sandy: water soaks in fast' : 'Clayey: water soaks in slowly')) errs.push(`${w}: soil keyed wrong for ${g.cls}`);
      break;
    }
    default: errs.push(`${w}: unknown type ${p.type}`);
  }
}

export function check(data, map) {
  const errs = [];
  frame(data, 'soil-texture', 'simulator', map, errs);
  for (const c of data.contexts || []) for (const t of c.types || []) if (!TYPES.includes(t)) errs.push(`context ${c.id}: unknown type ${t}`);
  const X = data.explore || {};
  if (X.start && (X.start.length !== 3 || X.start.reduce((a, b) => a + b, 0) !== 100)) errs.push('explore.start must be [sand, silt, clay] summing to 100');
  const { model } = runtime('soil-texture');
  if (!model) errs.push('no model registered (ApEnvMath.soilTexture)');
  else if (!model.stub) {
    // the model's classifier agrees with the restated rules at every whole-percent point
    let bad = 0;
    for (let cl = 0; cl <= 100 && bad < 3; cl++) for (let sa = 0; sa + cl <= 100 && bad < 3; sa++) {
      const si = 100 - sa - cl;
      if (model.nameOf(model.classify(sa, si, cl)) !== usda(sa, si, cl)) { errs.push(`classify(${sa}, ${si}, ${cl}) is ${model.classify(sa, si, cl)}, USDA gives ${usda(sa, si, cl)}`); bad++; }
    }
    sweep(data, errs, (r, c, t) => model.generate(r, c, t), (p, c, w) => recheck(p, c, w, errs), c => c.types || TYPES);
  }
  return errs;
}
