/* Validator for psychology/data/tools/conditioning-lab.json (Conditioning
   lab), run by scripts/check-appsych-content.mjs. OWNED BY THIS TOOL ONLY
   (builder T3). check(data, map) -> problems: the frame, then 300 problems
   per context and type regenerated with the model the page runs
   (ApPsychMath.conditioningLab), and every key recomputed independently from
   the problem's givens: the four labels from the scenario table, the
   classical record read off the plotted points with its phase from the trial
   kinds and its block mean through ApPsychStats, the schedule from whether
   the reward depends on responses or time and whether the requirement is
   fixed, and the operant term from added or removed and up or down (so
   negative reinforcement is never keyed as punishment). The explore pane's
   cumulative records are checked for their four shapes. */
import { frame, sweep, close } from './_drills.mjs';
import { runtime } from './_shared.mjs';

export const TYPES = ['labels', 'phases', 'schedule', 'operant'];
const stepOf = (p, k) => p.steps.find(s => s.key === k);
const rightText = s => s.options[s.correct];
const cap = s => s.charAt(0).toUpperCase() + s.slice(1);

/* The four shapes, from a session's presses (seconds) and rewards. */
export function shapes(model) {
  const out = {};
  for (const k of ['fr', 'vr', 'fi', 'vi']) {
    const s = model.session(k, 11, 30), rate = s.presses.length / 30;
    // Presses in the first and the last quarter of the gaps between rewards.
    let early = 0, late = 0;
    for (let i = 1; i < s.rewards.length; i++) {
      const a = s.rewards[i - 1], b = s.rewards[i], q = (b - a) / 4;
      for (const t of s.presses) { if (t > a && t <= a + q) early++; else if (t > b - q && t <= b) late++; }
    }
    out[k] = { rate, early, late, rewards: s.rewards.length };
  }
  return out;
}

export function recheck(p, c, w, errs) {
  const { Stats, model } = runtime('conditioning-lab');
  const E = (fn, ...args) => Stats.evaluate({ fn, args });
  const g = p.given || {};
  const need = (cond, msg) => { if (!cond) errs.push(`${w}: ${msg}`); };
  if (p.type === 'labels') {
    const sc = model.SCENARIOS.find(s => s.k === g.scene);
    need(!!sc, 'unknown scenario');
    for (const k of g.order) need(rightText(stepOf(p, k)) === cap(sc[k]) + '.', `the ${k} key is not "${sc[k]}"`);
    need(new Set(['ucs', 'ucr', 'cs', 'cr'].map(k => sc[k])).size === 4, 'two labels read the same');
  } else if (p.type === 'phases') {
    const pt = g.pts.find(q => q[0] === g.ask), kind = g.kinds[g.ask - 1];
    need(pt && close(stepOf(p, 'read').cell.answer, pt[1], 0, 1e-9), 'the read key is not the plotted value');
    const want = g.ask <= g.nA ? 'Acquisition.' : g.ask === g.restAt + 1 ? 'Spontaneous recovery.' : g.ask <= g.nA + g.nE ? 'Extinction.' : null;
    need(want && rightText(stepOf(p, 'phase')) === want, `the phase key is not ${want}`);
    need(kind === (g.ask <= g.nA ? 'pair' : 'tone'), 'the trial kinds disagree with the phases');
    const last4 = g.pts.slice(g.nA - 4, g.nA).map(q => q[1]);
    need(close(stepOf(p, 'mean').cell.answer, E('mean', last4)), 'the mean key is wrong');
    const v = g.pts.map(q => q[1]), endA = v[g.nA - 1], endE = v[g.nA + g.nE - 1], rec = v[g.restAt];
    need(endA > v[0] && endE < endA / 2 && rec > endE && rec < endA, `the record does not show acquisition, extinction and recovery (${v.join(',')})`);
    need(/suppressed the response/.test(rightText(stepOf(p, 'recov'))), 'the recovery key is wrong');
  } else if (p.type === 'schedule') {
    const sc = model.schedOf(g.k), story = p.text.replace(/<[^>]+>/g, '');
    need(model.SCHED_STORIES[g.k].includes(story), 'the story is not one of this schedule\'s');
    need(rightText(stepOf(p, 'sched')) === sc.name + '.', `the schedule key is not ${sc.name}`);
    need(/variable schedule/i.test(rightText(stepOf(p, 'resist'))), 'the extinction key is not a variable schedule');
  } else if (p.type === 'operant') {
    const name = (g.add ? 'Positive' : 'Negative') + ' ' + (g.up ? 'reinforcement' : 'punishment');
    need(rightText(stepOf(p, 'name')) === name + '.', `the term key is not ${name}`);
    need(rightText(stepOf(p, 'addrem')).startsWith(g.add ? 'Added' : 'Removed'), 'the added-or-removed key is wrong');
    need(rightText(stepOf(p, 'updown')).startsWith(g.up ? 'Reinforced' : 'Punished'), 'the reinforced-or-punished key is wrong');
    need(p.text.includes(g.up ? 'more frequent' : 'less frequent'), 'the story does not say which way the behavior went');
  } else errs.push(`${w}: unknown type ${p.type}`);
}

export function check(data, map) {
  const errs = [];
  frame(data, 'conditioning-lab', 'simulator', map, errs);
  const { model } = runtime('conditioning-lab');
  if (!model) errs.push('no model registered (ApPsychMath.conditioningLab)');
  else if (!model.stub) {
    for (const c of data.contexts || []) for (const t of c.types || []) if (!TYPES.includes(t)) errs.push(`context ${c.id}: unknown type ${t}`);
    // The cumulative records keep their shapes: ratio schedules faster than
    // interval ones, VR steepest, VI slowest, FI scalloped (presses bunch at
    // the end of each interval), FR pauses after a reward.
    const sh = shapes(model);
    if (!(sh.vr.rate > sh.fr.rate && sh.fr.rate > sh.vi.rate && sh.fr.rate > sh.fi.rate)) errs.push('the ratio schedules are not faster than the interval ones');
    if (!(sh.fi.late > 4 * sh.fi.early)) errs.push('the fixed-interval record is not scalloped');
    if (!(sh.fr.late > 1.5 * sh.fr.early)) errs.push('the fixed-ratio record has no post-reward pause');
    if (!(sh.vi.late < 2 * sh.vi.early + 5)) errs.push('the variable-interval record is not steady');
    // Every operant item is named by its two facts, and both directions of negative appear.
    for (const o of model.OPERANT) if (model.OP_NAMES[o.add + ',' + o.up] !== (o.add ? 'Positive' : 'Negative') + ' ' + (o.up ? 'reinforcement' : 'punishment')) errs.push(`operant item "${o.b}" is misnamed`);
    sweep(data, errs, (r, c, t) => model.generate(r, c, t), (p, c, w) => recheck(p, c, w, errs), c => c.types || TYPES);
  }
  return errs;
}
