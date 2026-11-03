/* Validator for macroeconomics/data/tools/reserves-lab.json (Bank Reserves
   Lab), run by scripts/check-apmacro-content.mjs. OWNED BY THIS TOOL ONLY
   (builder T2). check(data, map) -> problems: the frame, the model's effect
   table against an independent table of the economics (ample vs limited
   reserves, docs/apmacro-authoring-guide.md), then 300 problems per context
   and type regenerated with the model the page runs (ApMacroMath.reservesLab),
   every key recomputed here: the stance from the situation, the tool from
   the framework (and no second right action), the graph and the chain from
   the stance, every graph step's options graded by ApMacroGrade.graph (only
   the key's option right) with the rate read off ApMacroGraph, and the money
   multiplier numbers by this file's own arithmetic. */
import { frame, sweep, close } from './_drills.mjs';
import { runtime } from './_shared.mjs';

export const TYPES = ['tool', 'shift', 'multiplier'];
const stepOf = (p, k) => p.steps.find(s => s.key === k);
const right = s => s.options[s.correct];

/* The economics, written out once more by hand: [framework][tool] -> what
   tightening (stance +1) does to the policy rate, and the curve it moves on
   the reserve market (null: none). Easing is the mirror image. */
const TABLE = {
  ample: { iorb: ['up', 'RD'], onrrp: ['up', 'RD'], omo: ['same', 'RS'], discount: ['same', null], rr: ['same', null] },
  limited: { iorb: ['same', null], onrrp: ['same', null], omo: ['up', 'RS'], discount: ['up', 'RS'], rr: ['up', 'RD'] }
};
const flip = d => (d === 'up' ? 'down' : d === 'down' ? 'up' : 'same');
const ACTS = { iorb: ['Raise the IORB rate', 'Lower the IORB rate'], onrrp: ['Raise the ON RRP rate', 'Lower the ON RRP rate'], omo: ['Sell bonds', 'Buy bonds'],
  discount: ['Raise the discount rate', 'Lower the discount rate'], rr: ['Raise the reserve requirement', 'Lower the reserve requirement'] };
const FW_OF = { iorb: 'ample', onrrp: 'ample', omo: 'limited', discount: 'limited', rr: 'limited' };

export function effects(model, errs) {
  const { Graph } = runtime('reserves-lab');
  for (const fw of ['ample', 'limited']) for (const t of Object.keys(TABLE.ample)) for (const s of [1, -1]) {
    const e = model.effect(fw, t, s), [r, curve] = TABLE[fw][t], want = s > 0 ? r : flip(r), w = `effect ${fw} ${t} ${s > 0 ? 'tighten' : 'ease'}`;
    if (e.rate !== want) errs.push(`${w}: the policy rate ${e.rate}, should be ${want}`);
    const moved = Object.keys(e.shifts.reserves).filter(c => e.shifts.reserves[c]);
    if ((curve ? [curve] : []).join() !== moved.join()) errs.push(`${w}: the reserve market moves ${moved.join() || 'nothing'}, should move ${curve || 'nothing'}`);
    if (e.act !== ACTS[t][s > 0 ? 0 : 1]) errs.push(`${w}: the action reads "${e.act}"`);
    if (want === 'same') { if (e.ad !== 'none' || e.output !== 'same') errs.push(`${w}: AD moves although the rate does not`); continue; }
    // A higher rate: interest rates up, investment down, AD left, output and prices down (and the mirror).
    const tight = want === 'up';
    const ad = Graph.outcome({ kind: 'adas' }, e.shifts.adas) || {};
    if (e.i !== want) errs.push(`${w}: the nominal interest rate ${e.i}, should follow the policy rate`);
    const mo = Graph.outcome(model.specs(fw).money, e.shifts.money) || {};
    if (mo['nominal interest rate'] !== want) errs.push(`${w}: the money market does not show the rate moving ${want}`);
    if (e.inv !== (tight ? 'down' : 'up')) errs.push(`${w}: investment ${e.inv}`);
    if (e.ad !== (tight ? 'left' : 'right')) errs.push(`${w}: AD shifts ${e.ad}`);
    if (ad.output !== (tight ? 'down' : 'up') || ad['price level'] !== (tight ? 'down' : 'up')) errs.push(`${w}: the AD-AS graph does not show output and prices ${tight ? 'falling' : 'rising'}`);
    if (e.output !== ad.output || e.price !== ad['price level']) errs.push(`${w}: the words disagree with the AD-AS graph`);
    if (!e.works) errs.push(`${w}: a tool that moves the rate is marked as not working`);
  }
}

export function recheck(p, c, w, errs) {
  const { Graph, Grade, model } = runtime('reserves-lab');
  const need = (cond, msg) => { if (!cond) errs.push(`${w}: ${msg}`); };
  const g = p.given || {}, tight = g.stance > 0;
  if (c.framework) need(g.fw === c.framework, `framework ${g.fw}, the context sets ${c.framework}`);
  if (p.type === 'tool') {
    const sit = p.text.replace(/<[^>]+>/g, '');
    need(model.SITUATION[tight ? 'tight' : 'ease'].some(x => sit.includes(x)), 'the situation does not match the stance');
    need(/ample reserves|limited reserves/.test(sit) && sit.includes(g.fw === 'ample' ? 'ample reserves' : 'limited reserves'), 'the text does not name the framework');
    need(right(stepOf(p, 'stance')).startsWith(tight ? 'Contractionary: raise' : 'Expansionary: lower'), 'the stance key is wrong');
    need(FW_OF[g.tool] === g.fw, `the keyed tool ${g.tool} is not a ${g.fw}-reserves tool`);
    const st = stepOf(p, 'tool');
    need(right(st) === ACTS[g.tool][tight ? 0 : 1] + '.', 'the tool key is wrong');
    // No other option is also a right action: a tool of this framework used the right way.
    for (const [i, o] of st.options.entries()) if (i !== st.correct) for (const [t, a] of Object.entries(ACTS)) if (o === a[tight ? 0 : 1] + '.' && FW_OF[t] === g.fw && TABLE[g.fw][t][0] !== 'same') errs.push(`${w}: option "${o}" is also right`);
    const gr = right(stepOf(p, 'graph'));
    need(g.fw === 'ample' ? gr.startsWith('The reserve market: the flat part of reserve demand shifts ' + (tight ? 'up' : 'down')) : gr.startsWith('The money market: the money supply shifts ' + (tight ? 'left' : 'right')), 'the graph key is wrong');
    const ch = right(stepOf(p, 'chain'));
    need(ch.includes('investment ' + (tight ? 'falls' : 'rises')) && ch.includes('AD shifts ' + (tight ? 'left' : 'right')), 'the chain key is wrong');
  } else if (p.type === 'shift') {
    const st = p.steps.find(s => s.kind === 'graph');
    need(!!st, 'no graph step');
    if (!st) return;
    const spec = st.spec;
    for (const e of Graph.check(spec)) errs.push(`${w}: graph spec: ${e}`);
    const key = spec.key.shifts[0];
    if (g.fw === 'ample') need(g.tool === 'omo' ? key.curve === 'RS' && key.dir === (tight ? 'left' : 'right') : key.curve === 'RD' && key.dir === (tight ? 'up' : 'down'), 'the key shifts the wrong curve or way');
    else need(spec.kind === 'money' && key.curve === 'MS' && key.dir === (tight ? 'left' : 'right'), 'the limited-reserves key is not the money supply');
    need(spec.kind === (g.fw === 'ample' ? 'reserves' : 'money'), 'the graph kind does not fit the framework');
    // Of the end states a student can draw (one curve one way, or several),
    // only the key's grades right, and every other one names its slip.
    const ks = model.classes(spec), keyed = JSON.stringify(Graph.keyOffsets(spec));
    for (const k of ks) {
      const r = Grade.graph(spec, { shifts: k.shifts });
      if (r.correct !== (JSON.stringify(k.shifts) === keyed)) errs.push(`${w}: drawing "${k.text}" is graded ${r.correct ? 'right' : 'wrong'} by ApMacroGrade.graph`);
      else if (!r.correct && !r.slip) errs.push(`${w}: drawing "${k.text}" has no slip line`);
    }
    // The rate, read off the graph as drawn with the key's shift.
    const o = Graph.outcome(spec.kind === 'reserves' ? { ...spec } : spec, Graph.keyOffsets(spec));
    const d = spec.kind === 'reserves' ? o['policy rate'] : o['nominal interest rate'];
    const want = d === 'up' ? 'It rises.' : d === 'down' ? 'It falls.' : 'It stays the same.';
    need(right(stepOf(p, 'rate')) === want, `the rate key is not "${want}"`);
    if (d === 'same') need(right(stepOf(p, 'next')).startsWith(ACTS.iorb[tight ? 0 : 1]), 'the "instead" key is not the IORB rate');
    else need(right(stepOf(p, 'chain')).includes('investment ' + (tight ? 'falls' : 'rises')), 'the chain key is wrong');
  } else if (p.type === 'multiplier') {
    const { x, rr } = g;
    need([0.1, 0.2, 0.25].includes(rr), `ratio ${rr} is not four-function friendly`);
    need(close(stepOf(p, 'mm').cell.answer, 1 / rr), 'the money multiplier key is wrong');
    need(close(stepOf(p, 'max').cell.answer, x * (1 / rr)), 'the maximum change key is wrong');
    need(p.text.includes('$' + x + ' million') && p.text.includes(Math.round(rr * 100) + ' percent'), 'the text does not state the numbers');
    need(/maximum|exact/.test(stepOf(p, 'most').label) && /excess reserves/.test(right(stepOf(p, 'most'))), 'the "why a maximum" key is wrong');
    for (const k of ['mm', 'max']) for (const m of stepOf(p, k).cell.mistakes) need(!close(m.value, stepOf(p, k).cell.answer, 1e-3), `a ${k} mistake equals the key`);
  } else errs.push(`${w}: unknown type ${p.type}`);
}

export function check(data, map) {
  const errs = [];
  frame(data, 'reserves-lab', 'simulator', map, errs);
  const { model } = runtime('reserves-lab');
  if (!model) { errs.push('no model registered (ApMacroMath.reservesLab)'); return errs; }
  if (model.stub) return errs;
  for (const c of data.contexts || []) {
    for (const t of c.types || []) if (!TYPES.includes(t)) errs.push(`context ${c.id}: unknown type ${t}`);
    if (c.framework && !['ample', 'limited'].includes(c.framework)) errs.push(`context ${c.id}: framework is ample or limited`);
    if ((c.types || []).some(t => t !== 'multiplier') && !c.framework) errs.push(`context ${c.id}: a tool or shift context names its framework`);
  }
  effects(model, errs);
  sweep(data, errs, (r, c, t) => model.generate(r, c, t), (p, c, w) => recheck(p, c, w, errs), c => c.types || TYPES);
  return errs;
}
