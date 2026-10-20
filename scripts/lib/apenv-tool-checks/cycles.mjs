/* Validator for environmental-science/data/tools/cycles.json (Cycles), run
   by scripts/check-apenv-content.mjs. OWNED BY THIS TOOL ONLY (builder T2).
   check(data, map) -> problems. The frame; then 300 problems per context and
   type regenerated with the model the page runs (ApEnvMath.cycles), every
   step sound (_drills.mjs), and every key recomputed independently: numbers
   from the problem's givens through ApEnvCalc, choices against the model's
   own tables (the process's endpoints, the nitrogen order). */
import { frame, sweep, close } from './_drills.mjs';
import { runtime } from './_shared.mjs';

export const TYPES = ['process', 'nitrogen', 'reservoir', 'human', 'budget', 'residence'];
const CYCLES = ['carbon', 'nitrogen', 'phosphorus', 'water'];
const ORDER = ['Nitrogen fixation', 'Nitrification', 'Assimilation', 'Ammonification', 'Denitrification'];

const stepOf = (p, key) => p.steps.find(s => s.key === key);
const key = s => s.options[s.correct];

export function recheck(p, c, w, errs) {
  const { Calc, M, model: Y } = runtime('cycles');
  const g = p.givens || {};
  const want = (k, v) => { const s = stepOf(p, k), a = s && s.cell.numeric.answer; if (!close(a, v)) errs.push(`${w}: step ${k} key ${a} but ApEnvCalc gives ${v}`); };
  const setupIs = (k, v, rel = 1e-6) => { const s = stepOf(p, k), r = s && M.evaluate(s.cell.setup.answer, {}, []); if (!r || !r.ok || !close(r.value, v, rel)) errs.push(`${w}: step ${k} setup does not evaluate to ${v}`); };
  switch (p.type) {
    case 'process': {
      const P = Y.proc(g.cycle, g.process);
      if (!P) { errs.push(`${w}: unknown process ${g.process}`); break; }
      if (g.cycle !== c.cycle) errs.push(`${w}: context cycle ${c.cycle}, problem cycle ${g.cycle}`);
      if (key(stepOf(p, 'name')) !== P.name) errs.push(`${w}: name key "${key(stepOf(p, 'name'))}" is not ${P.name}`);
      // no distractor moves the element between the same two reservoirs
      for (const o of stepOf(p, 'name').options) {
        if (o === P.name) continue;
        const q = Y.CYCLES[g.cycle].processes.find(x => x.name === o);
        if (!q) errs.push(`${w}: distractor "${o}" is not a process of the ${g.cycle} cycle`);
        else if (q.from === P.from && q.to === P.to) errs.push(`${w}: distractor "${o}" is also right`);
      }
      const a = stepOf(p, 'agent'); if (a && key(a) !== P.agent) errs.push(`${w}: agent key is not ${P.agent}`);
      break;
    }
    case 'nitrogen': {
      const i = ORDER.indexOf(Y.proc('nitrogen', g.start).name);
      p.steps.filter(s => /^n\d$/.test(s.key)).forEach((s, j) => { if (key(s) !== ORDER[i + 1 + j]) errs.push(`${w}: step ${s.key} key "${key(s)}" but the order gives ${ORDER[i + 1 + j]}`); });
      const who = stepOf(p, 'who');
      if (who) {
        const last = Y.NORDER[i + 2], ex = { fix: 'Nitrogen-fixing bacteria', nitr: 'Nitrifying bacteria', denit: 'Denitrifying bacteria', assim: 'Plant roots' }[last];
        if (key(who) !== ex) errs.push(`${w}: who key "${key(who)}" but ${last} is done by ${ex}`);
      }
      break;
    }
    case 'reservoir': {
      g.qs.forEach((qi, j) => { const q = Y.RES_Q[qi], s = stepOf(p, 'r' + (j + 1)); if (!q || key(s) !== q.options[0]) errs.push(`${w}: reservoir step ${j + 1} key is not the table's answer`); if (q && c.cycle && q.cycle !== c.cycle) errs.push(`${w}: a ${q.cycle} question in a ${c.cycle} context`); });
      // the facts the reservoir questions rest on, checked against the model's amounts
      const R = id => Y.res('carbon', id).amount;
      if (!(R('rock') > R('ocean') && R('ocean') > R('soil') && R('soil') > R('atm'))) errs.push(`${w}: carbon reservoir sizes no longer match the questions`);
      const Wr = id => Y.res('water', id).amount;
      if (!(Wr('ice') > Wr('ground') && Wr('ground') > Wr('lakes') && Wr('lakes') > Wr('atm'))) errs.push(`${w}: water reservoir sizes no longer match the questions`);
      break;
    }
    case 'human': {
      const list = Y.HUMAN_Q[g.cycle];
      g.qs.forEach((qi, j) => { const s = stepOf(p, 'h' + (j + 1)); if (key(s) !== list[qi].options[0]) errs.push(`${w}: human step ${j + 1} key is not the table's answer`); });
      if (g.qs[0] === g.qs[1]) errs.push(`${w}: the same question twice`);
      break;
    }
    case 'budget': {
      const net = Calc.evaluate({ fn: 'sub', args: [{ fn: 'add', args: [g.ff, g.luc] }, { fn: 'add', args: [g.oc, g.ld] }] });
      want('gain', net); setupIs('setup', net);
      want('ppm', Calc.evaluate({ fn: 'div', args: [net, 2.12] }));
      if (!(net > 0)) errs.push(`${w}: the atmosphere must gain carbon`);
      const f = net / (g.ff + g.luc), ex = f < 0.4 ? 'Less than half' : f <= 0.6 ? 'About half' : 'More than half';
      if (key(stepOf(p, 'air')) !== ex) errs.push(`${w}: airborne share ${f} keyed "${key(stepOf(p, 'air'))}"`);
      if (Math.abs(f - 0.4) < 0.03 || Math.abs(f - 0.6) < 0.03) errs.push(`${w}: airborne share ${f} is too close to a boundary`);
      break;
    }
    case 'residence': {
      const yrs = Calc.evaluate({ fn: 'div', args: [g.S, g.F] });
      const ans = g.out === 'days' ? Calc.evaluate({ fn: 'convert', args: [yrs, 'yr', 'day'] }) : yrs;
      // the page asks for × 365; a Julian year is 365.25 days, within the 2% tolerance
      want('ans', ans); setupIs('setup', ans, 0.003);
      break;
    }
    default: errs.push(`${w}: unknown type ${p.type}`);
  }
}

export function check(data, map) {
  const errs = [];
  frame(data, 'cycles', 'simulator', map, errs);
  for (const c of data.contexts || []) {
    if (!CYCLES.includes(c.cycle)) errs.push(`context ${c.id}: cycle must be one of ${CYCLES.join(', ')}`);
    for (const t of c.types || []) if (!TYPES.includes(t)) errs.push(`context ${c.id}: unknown type ${t}`);
    if ((c.types || []).includes('budget') && c.cycle !== 'carbon') errs.push(`context ${c.id}: the budget is a carbon problem`);
    if ((c.types || []).includes('nitrogen') && c.cycle !== 'nitrogen') errs.push(`context ${c.id}: the order problem is a nitrogen problem`);
    if ((c.types || []).includes('residence') && !['carbon', 'water'].includes(c.cycle)) errs.push(`context ${c.id}: residence time has carbon and water problems only`);
    const want = { carbon: 'carbon-cycle', nitrogen: 'nitrogen-cycle', phosphorus: 'phosphorus-cycle', water: 'water-cycle' }[c.cycle];
    if (want && c.topic !== want) errs.push(`context ${c.id}: a ${c.cycle} context belongs to topic ${want}`);
  }
  const X = data.explore || {};
  if (X.cycle && !CYCLES.includes(X.cycle)) errs.push(`explore.cycle must be one of ${CYCLES.join(', ')}`);
  const { model } = runtime('cycles');
  if (!model) errs.push('no model registered (ApEnvMath.cycles)');
  else if (!model.stub) sweep(data, errs, (r, c, t) => model.generate(r, c, t), (p, c, w) => recheck(p, c, w, errs), c => c.types || TYPES);
  return errs;
}
