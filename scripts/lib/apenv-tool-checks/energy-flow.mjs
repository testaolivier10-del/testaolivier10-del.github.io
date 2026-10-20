/* Validator for environmental-science/data/tools/energy-flow.json (Energy flow), run
   by scripts/check-apenv-content.mjs. OWNED BY THIS TOOL ONLY (builder T2).
   check(data, map) -> problems. The frame; then 300 problems per context and
   type regenerated with the model the page runs (ApEnvMath.energyFlow), every
   step sound (_drills.mjs), and every key recomputed independently from the
   problem's givens with ApEnvCalc (never through the model). */
import { frame, sweep, close } from './_drills.mjs';
import { runtime } from './_shared.mjs';

export const TYPES = ['tenpct', 'reverse', 'npp', 'efficiency', 'pyramid', 'web'];
const ECOS = ['grassland', 'pond', 'forest'];
const PYR_ECOS = ['pond', 'forest'];

const stepOf = (p, key) => p.steps.find(s => s.key === key);
const unitAns = (p, key) => { const s = stepOf(p, key); return s && s.cell && s.cell.numeric ? s.cell.numeric.answer : NaN; };

export function recheck(p, c, w, errs) {
  const { Calc, M } = runtime('energy-flow');
  const g = p.givens || {};
  const want = (key, v) => { const a = unitAns(p, key); if (!close(a, v)) errs.push(`${w}: step ${key} key ${a} but ApEnvCalc gives ${v}`); };
  const setupIs = (key, v) => { const s = stepOf(p, key); const r = s && M.evaluate(s.cell.setup.answer, {}, []); if (!r || !r.ok || !close(r.value, v)) errs.push(`${w}: step ${key} setup "${s && s.cell.setup.answer}" does not evaluate to ${v}`); };
  if (c.eco && g.eco !== c.eco && p.type !== 'pyramid') errs.push(`${w}: context eco ${c.eco}, problem eco ${g.eco}`);
  switch (p.type) {
    case 'tenpct': {
      const n = g.to - g.from, v = Calc.evaluate({ fn: 'trophicEnergy', args: [g.e0, g.from, g.to] });
      want('ans', v); setupIs('setup', v);
      if (stepOf(p, 'steps').options[stepOf(p, 'steps').correct] !== String(n)) errs.push(`${w}: transfers key is not ${n}`);
      break;
    }
    case 'reverse': {
      const v = Calc.evaluate({ fn: 'div', args: [g.need, { fn: 'tenPercent', args: [1, g.steps] }] });
      want('ans', v); setupIs('setup', v);
      if (!(v > g.need)) errs.push(`${w}: producers must hold more than the top`);
      break;
    }
    case 'npp': {
      if (g.find === 'npp') {
        const npp = Calc.evaluate({ fn: 'npp', args: [g.gpp, g.r] });
        want('ans', npp); setupIs('setup', npp);
        want('prim', Calc.evaluate({ fn: 'tenPercent', args: [npp, 1] }));
      } else {
        const gpp = Calc.evaluate({ fn: 'gpp', args: [g.npp, g.r] });
        want('ans', gpp); setupIs('setup', gpp);
      }
      const h = stepOf(p, 'heat');
      if (!h || !/heat/.test(h.options[h.correct])) errs.push(`${w}: respiration energy must leave as heat`);
      break;
    }
    case 'efficiency': {
      const v = Calc.evaluate({ fn: 'efficiency', args: [g.eb, g.ea] });
      want('ans', v); setupIs('setup', v);
      const s = stepOf(p, 'cmp'), more = v > 10;
      if (s.options[s.correct] !== (more ? 'more efficient than 10%' : 'less efficient than 10%')) errs.push(`${w}: comparison with 10% is wrong for ${v}%`);
      if (Math.abs(v - 10) < 1e-9) errs.push(`${w}: an efficiency of exactly 10% has no right comparison`);
      break;
    }
    case 'pyramid': {
      if (!PYR_ECOS.includes(g.eco)) errs.push(`${w}: pyramid problems need an inverted ecosystem (pond or forest), got ${g.eco}`);
      const { model } = runtime('energy-flow');
      const P = model.pyramid(g.eco, 20000, 50, 0.1);
      if (!model.inverted(P, g.key)) errs.push(`${w}: the ${g.key} pyramid of the ${g.eco} is not inverted`);
      if (model.inverted(P, 'energy')) errs.push(`${w}: an energy pyramid came out inverted`);
      const e = stepOf(p, 'energy'); if (e.options[e.correct] !== 'No, never') errs.push(`${w}: energy pyramid key must be "No, never"`);
      break;
    }
    case 'web': {
      // Recompute the first effects by the rule itself: a consumer whose
      // every food is gone dies out; prey of what is gone increase; eaters
      // of what is gone decrease.
      const { model } = runtime('energy-flow');
      const web = model.webOf(g.eco), by = id => web.find(s => s.id === id);
      const gone = new Set([g.x]); let grew = true;
      while (grew) { grew = false; for (const s of web) if (!gone.has(s.id) && s.eats.length && s.eats.every(f => gone.has(f))) { gone.add(s.id); grew = true; } }
      const expect = id => {
        if (gone.has(id)) return 'Die out';
        if ([...gone].some(gid => by(gid).eats.includes(id))) return 'Increase';
        if (by(id).eats.some(f => gone.has(f))) return 'Decrease';
        return null;
      };
      ['w1', 'w2'].forEach((k, i) => {
        const s = stepOf(p, k), e = expect(g.ys[i]);
        if (!e) errs.push(`${w}: ${g.ys[i]} has no direct link to the removed ${g.x}; ask only direct effects`);
        else if (s.options[s.correct] !== e) errs.push(`${w}: ${g.ys[i]} after removing ${g.x}: key "${s.options[s.correct]}", expected "${e}"`);
      });
      if (g.ys[0] === g.ys[1]) errs.push(`${w}: the two questions ask about the same species`);
      break;
    }
    default: errs.push(`${w}: unknown type ${p.type}`);
  }
}

export function check(data, map) {
  const errs = [];
  frame(data, 'energy-flow', 'simulator', map, errs);
  for (const c of data.contexts || []) {
    if (!ECOS.includes(c.eco)) errs.push(`context ${c.id}: eco must be one of ${ECOS.join(', ')}`);
    for (const t of c.types || []) if (!TYPES.includes(t)) errs.push(`context ${c.id}: unknown type ${t}`);
    if ((c.types || []).includes('pyramid') && !PYR_ECOS.includes(c.eco)) errs.push(`context ${c.id}: pyramid problems need the pond or the forest`);
  }
  const X = data.explore || {};
  if (X.eco && !ECOS.includes(X.eco)) errs.push(`explore.eco must be one of ${ECOS.join(', ')}`);
  if (X.gpp != null && !(X.gpp >= 2000 && X.gpp <= 40000 && X.gpp % 1000 === 0)) errs.push('explore.gpp must be 2000 to 40000 in steps of 1000 (the slider)');
  if (X.eff != null && !(X.eff >= 5 && X.eff <= 20)) errs.push('explore.eff must be 5 to 20 (%)');
  if (X.rPct != null && !(X.rPct >= 30 && X.rPct <= 70 && X.rPct % 5 === 0)) errs.push('explore.rPct must be 30 to 70 in steps of 5');
  const { model } = runtime('energy-flow');
  if (!model) errs.push('no model registered (ApEnvMath.energyFlow)');
  else if (!model.stub) sweep(data, errs, (r, c, t) => model.generate(r, c, t), (p, c, w) => recheck(p, c, w, errs), c => c.types || TYPES);
  return errs;
}
