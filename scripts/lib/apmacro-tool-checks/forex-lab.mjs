/* Validator for macroeconomics/data/tools/forex-lab.json (Foreign exchange
   lab), run by scripts/check-apmacro-content.mjs. OWNED BY THIS TOOL ONLY
   (builder T4). check(data, map) -> problems: the shared frame, then the
   drill sweep (_drills.mjs: 300 problems per context and type), every key
   recomputed here with this file's own rules: its own table of which curve
   each change shifts in the market for the currency, the mirror market (the
   other curve, same way), appreciation from the price on the axis
   (others per unit of this currency), 1 / rate and amount x rate by hand,
   and every graph step graded by ApMacroGrade.graph on the key (right) and
   on the slips readers report (the other curve, the wrong direction, the
   flipped axis ratio: wrong). */
import { frame, sweep, close } from './_drills.mjs';
import { runtime } from './_shared.mjs';

export const TYPES = ['axis', 'shift', 'nx', 'flows'];
const SETS = ['goods', 'policy'];
// curve, direction in the market for the currency: this file's own table.
const CAUSE = {
  'tastes-f': ['D', 1], 'tastes-f-down': ['D', -1], 'tastes-h': ['S', 1], 'income-f': ['D', 1], 'income-f-down': ['D', -1],
  'income-h': ['S', 1], 'prices-h': ['D', -1], 'prices-f': ['S', -1], tourism: ['D', 1],
  'rate-h': ['D', 1], 'rate-h-down': ['D', -1], 'rate-f': ['S', 1], 'mp-h-tight': ['D', 1], 'mp-h-easy': ['D', -1], 'deficit-h': ['D', 1], 'mp-f-tight': ['S', 1],
};
const SET_OF = { 'rate-h': 'policy', 'rate-h-down': 'policy', 'rate-f': 'policy', 'mp-h-tight': 'policy', 'mp-h-easy': 'policy', 'deficit-h': 'policy', 'mp-f-tight': 'policy' };
const plural = w => (/s$/.test(w) ? w : `${w}s`);
const word = d => (d > 0 ? 'right' : 'left');

function shiftChecks(Graph, Grade, g, curve, dir, w, errs) {
  const bad = Graph.check(g);
  if (bad.length) { errs.push(`${w}: graph spec: ${bad[0]}`); return; }
  const k = g.key.shifts[0];
  if (g.key.shifts.length !== 1 || k.curve !== curve || k.dir !== word(dir)) errs.push(`${w}: graph key ${k.curve} ${k.dir}, expected ${curve} ${word(dir)}`);
  const resp = sh => ({ shifts: sh, eq: Graph.eq(g, sh), labels: {}, point: null });
  if (!Grade.graph(g, resp({ [curve]: dir })).correct) errs.push(`${w}: the graph key is graded wrong`);
  const other = curve === 'D' ? 'S' : 'D';
  for (const [why, sh] of [['the other curve', { [other]: dir }], ['the wrong direction', { [curve]: -dir }]]) {
    const r = Grade.graph(g, resp(sh));
    if (r.correct || !r.slip) errs.push(`${w}: the slip (${why}) is ${r.correct ? 'graded right' : 'not named'}`);
  }
  // The price on the axis (others per unit) rises with demand right or supply left.
  const e1 = Graph.eq(g, { [curve]: dir }), up = (curve === 'D' ? dir : -dir) > 0;
  if (!(up ? e1[1] > 5 : e1[1] < 5)) errs.push(`${w}: the drawn equilibrium price moves the wrong way`);
}

export function recheck(p, ctx, w) {
  const errs = [];
  const { Graph, Grade } = runtime('forex-lab');
  const step = k => p.steps.find(s => s.key === k);
  const pick = k => { const s = step(k); return s ? s.options[s.correct] : ''; };
  if (!ctx.types.includes(p.type)) errs.push(`${w}: type ${p.type} is not one of the context's types`);
  if (p.topic !== ctx.topic) errs.push(`${w}: topic ${p.topic} is not the context's ${ctx.topic}`);
  for (const s of p.steps) if (s.kind === 'graph') {
    if (!p.figure || JSON.stringify(p.figure.spec) !== JSON.stringify(s.spec)) errs.push(`${w}: graph step ${s.key} grades a different graph from the one drawn`);
  }
  const a = p.answer || {}, X = a.X, Y = a.Y;
  if (!X || !Y || X === Y) { errs.push(`${w}: the two currencies are not named`); return errs; }
  const g = step('graph') && step('graph').spec;
  if (g && (g.names.currency !== X || g.names.other !== Y)) errs.push(`${w}: the graph is not the market for ${plural(X)}`);
  if (p.type === 'axis') {
    const inv = 1 / a.p2, cost = a.A * a.p2, up = a.p2 > a.p1;
    if (!close(step('inverse').cell.answer, inv)) errs.push(`${w}: inverse ${step('inverse').cell.answer} != ${inv}`);
    if (!close(step('convert').cell.answer, cost)) errs.push(`${w}: cost ${step('convert').cell.answer} != ${cost}`);
    if (!pick('dir').startsWith(`The ${X} ${up ? 'appreciated' : 'depreciated'} and the ${Y} ${up ? 'depreciated' : 'appreciated'}`)) errs.push(`${w}: direction keyed "${pick('dir')}"`);
    const ok = { x: 'fxQuantity', y: 'fxPrice', D: 'D', S: 'S' };
    if (!Grade.graph(g, { labels: ok }).correct) errs.push(`${w}: the right labels are graded wrong`);
    const flipped = Grade.graph(g, { labels: { ...ok, y: 'fxPriceFlipped' } });
    if (flipped.correct || !/per/.test(flipped.slip)) errs.push(`${w}: the flipped currency ratio is not caught`);
    if (Graph.labelText('fxPrice', g.names) !== `Price of the ${X} (${plural(Y)} per ${X})`) errs.push(`${w}: the axis reads "${Graph.labelText('fxPrice', g.names)}"`);
    return errs;
  }
  if (p.type === 'nx') {
    const v = a.value, stronger = v > 0;
    if (!p.text.includes(stronger ? 'appreciates' : 'depreciates')) errs.push(`${w}: text and key disagree`);
    if (!pick('exports').startsWith(stronger ? 'They cost more, so its exports fall' : 'They cost less, so its exports rise')) errs.push(`${w}: exports keyed "${pick('exports')}"`);
    if (pick('imports') !== (stronger ? 'Imports rise' : 'Imports fall')) errs.push(`${w}: imports keyed "${pick('imports')}"`);
    if (pick('nxad') !== (stronger ? 'Net exports fall, so AD shifts left' : 'Net exports rise, so AD shifts right')) errs.push(`${w}: net exports keyed "${pick('nxad')}"`);
    return errs;
  }
  const c = CAUSE[p.shock];
  if (!c) { errs.push(`${w}: unknown change "${p.shock}"`); return errs; }
  const [curve, dir] = c, up = (curve === 'D' ? dir : -dir) > 0;
  shiftChecks(Graph, Grade, g, curve, dir, w, errs);
  const val = `The ${X} ${up ? 'appreciates' : 'depreciates'} against the ${Y}`;
  if (pick('value') !== val) errs.push(`${w}: value keyed "${pick('value')}", expected "${val}"`);
  if (p.type === 'shift') {
    if ((SET_OF[p.shock] || 'goods') !== (ctx.set || 'goods')) errs.push(`${w}: change ${p.shock} is not in the context's set ${ctx.set}`);
    const m = `${curve === 'D' ? 'Supply of' : 'Demand for'} ${plural(Y)} shifts ${word(dir)}`;
    if (pick('mirror') !== m) errs.push(`${w}: mirror keyed "${pick('mirror')}", expected "${m}"`);
  } else if (p.type === 'flows') {
    if (curve !== 'D') errs.push(`${w}: a home real-rate change is keyed on foreign buying (demand)`);
    // Either side is accepted (key.alt): the supply of X the other way, with the same change in its value.
    const alt = (((g && g.key.alt) || [])[0] || [])[0] || {};
    if (alt.curve !== 'S' || alt.dir !== word(-dir)) errs.push(`${w}: the accepted other shift should be supply ${word(-dir)}, not ${alt.curve} ${alt.dir}`);
    else { const { Graph } = runtime('forex-lab'), a = Graph.outcome(g, { S: -dir }), k = Graph.outcome(g, { D: dir }); if (a['value of the currency'] !== k['value of the currency']) errs.push(`${w}: the two accepted shifts move the value of ${X} different ways`); }
    if (!pick('flow').startsWith(dir > 0 ? 'More flows into' : 'Less flows into')) errs.push(`${w}: flow keyed "${pick('flow')}"`);
    if (pick('nx') !== (up ? 'Net exports fall' : 'Net exports rise')) errs.push(`${w}: net exports keyed "${pick('nx')}"`);
  } else errs.push(`${w}: unknown type ${p.type}`);
  return errs;
}

export function check(data, map) {
  const errs = [];
  frame(data, 'forex-lab', 'simulator', map, errs);
  for (const c of data.contexts || []) {
    if (!Array.isArray(c.types) || !c.types.length) errs.push(`context ${c.id}: lists no types`);
    for (const t of c.types || []) if (!TYPES.includes(t)) errs.push(`context ${c.id}: unknown type "${t}" (${TYPES.join(', ')})`);
    if (c.set && !SETS.includes(c.set)) errs.push(`context ${c.id}: set is one of ${SETS.join(', ')}`);
  }
  if (errs.length) return errs;
  const { model } = runtime('forex-lab');
  if (!model || model.stub) return [...errs, 'ApMacroMath.forexLab is not built'];
  for (const s of model.SHOCKS) if (!CAUSE[s.id]) errs.push(`change ${s.id}: not in the validator's table`);
  sweep(data, errs, (r, c, t) => model.generate(r, c, t), (p, c, w) => errs.push(...recheck(p, c, w)), c => c.types);
  return errs;
}
