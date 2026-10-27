/* Validator for psychology/data/tools/memory-lab.json (Memory lab), run by
   scripts/check-appsych-content.mjs. OWNED BY THIS TOOL ONLY (builder T3).
   check(data, map) -> problems: the frame, then 300 problems per context and
   type regenerated with the model the page runs (ApPsychMath.memoryLab), and
   every key recomputed independently from the problem's givens with
   ApPsychStats recipes: the serial position table really shows primacy,
   recency and the recency lost after a delay (each percent a whole count of
   the group), the group means of the spacing study, the interference kind
   from which memory is retrieved, and the forgetting curve's drops and
   shape. */
import { frame, sweep, close } from './_drills.mjs';
import { runtime } from './_shared.mjs';

export const TYPES = ['serial', 'spacing', 'interference', 'forgetting'];
const stepOf = (p, k) => p.steps.find(s => s.key === k);
const rightText = s => s.options[s.correct];

export function recheck(p, c, w, errs) {
  const { Stats } = runtime('memory-lab');
  const E = (fn, ...args) => Stats.evaluate({ fn, args });
  const g = p.given || {};
  const need = (cond, msg) => { if (!cond) errs.push(`${w}: ${msg}`); };
  const key = k => { const s = stepOf(p, k); if (!s) { errs.push(`${w}: no step ${k}`); return NaN; } return s.cell.answer; };
  if (p.type === 'serial') {
    const { imm, del, k } = g;
    need(imm.length === 10 && del.length === 10, 'ten positions per group');
    need([...imm, ...del].every(v => Number.isInteger(Math.round(v * k / 100 * 1e9) / 1e9) && v >= 0 && v <= 100), 'a percent is not a whole count of the group');
    const first = a => E('mean', a.slice(0, 3)), mid = a => E('mean', a.slice(3, 7)), last = a => E('mean', a.slice(7));
    need(first(imm) > mid(imm) && last(imm) > mid(imm), 'the immediate curve is not U-shaped');
    need(last(imm) - last(del) >= 20, 'the delay does not remove the recency effect');
    need(first(del) > mid(del), 'the delayed curve lost its primacy effect');
    need(close(key('lastmean'), last(imm)), `lastmean key is not ${last(imm)}`);
    need(/^Positions 1 to 3/.test(rightText(stepOf(p, 'primacy'))), 'the primacy key is not the start of the list');
    need(/removed the recency effect/.test(rightText(stepOf(p, 'delay'))), 'the delay key is not the recency effect');
  } else if (p.type === 'spacing') {
    const ms = E('mean', g.massed), ss = E('mean', g.spaced);
    need(close(key('spaced'), ss) && close(key('massed'), ms), 'a group mean key is wrong');
    need(ss - ms >= 0.08 * g.max, `the spaced group (${ss}) does not clearly beat the massed group (${ms})`);
    need([...g.massed, ...g.spaced].every(v => Number.isInteger(v) && v >= 0 && v <= g.max), 'a score is out of range');
    need(/^Whether study time was massed/.test(rightText(stepOf(p, 'iv'))), 'the IV key is not the schedule');
    need(/spacing effect/.test(rightText(stepOf(p, 'concl'))), 'the conclusion key is not the spacing effect');
  } else if (p.type === 'interference') {
    const want = g.testOld ? 'Retroactive' : 'Proactive';
    need(rightText(stepOf(p, 'kind')).startsWith(want), `the kind key is not ${want.toLowerCase()} interference`);
    need(rightText(stepOf(p, 'which')).startsWith(g.testOld ? 'The older' : 'The newer'), 'the which key is not the memory being retrieved');
    const sc = runtime('memory-lab').model.SCENES.find(s => s.k === g.scene);
    need(sc && p.text.includes(`instead of ${g.testOld ? sc.old : sc.nw}`), 'the story does not say which memory is wanted');
  } else if (p.type === 'forgetting') {
    const v = g.pts.map(q => q[1]);
    need(g.pts.map(q => q[0]).join() === '0,1,2,7,14,30' && v[0] === 100, 'the delays are not 0, 1, 2, 7, 14, 30 days from 100%');
    need(v.every((x, i) => !i || x < v[i - 1]), 'retention does not fall at every delay');
    const d1 = E('sub', v[0], v[1]), d2 = E('sub', v[3], v[4]);
    need(close(key('drop1'), d1) && close(key('drop2'), d2), 'a drop key is wrong');
    need(d1 > 2 * d2, 'the early drop is not clearly the larger one (the shape key would not hold)');
    need(/soon after learning/.test(rightText(stepOf(p, 'shape'))) && /days 1, 3 and 7/.test(rightText(stepOf(p, 'fix'))), 'a forgetting key is wrong');
  } else errs.push(`${w}: unknown type ${p.type}`);
}

export function check(data, map) {
  const errs = [];
  frame(data, 'memory-lab', 'simulator', map, errs);
  const { model } = runtime('memory-lab');
  if (!model) errs.push('no model registered (ApPsychMath.memoryLab)');
  else if (!model.stub) {
    for (const c of data.contexts || []) {
      for (const t of c.types || []) if (!TYPES.includes(t)) errs.push(`context ${c.id}: unknown type ${t}`);
      if ((c.types || []).includes('spacing') && !(c.material && c.minutes && c.sessions && c.max)) errs.push(`context ${c.id}: a spacing context needs material, minutes, sessions, max`);
    }
    // The explore pane's models keep their published shapes.
    const n = 10, P = i => model.recallP(i, n, false), D = i => model.recallP(i, n, true);
    if (!(P(1) > P(5) && P(10) > P(5) && D(10) < P(10) - 0.3 && Math.abs(D(1) - P(1)) < 0.02)) errs.push('the serial position model lost its shape');
    const spaced = model.PRESETS.find(p => p.k === 'spaced'), massed = model.PRESETS.find(p => p.k === 'massed');
    if (!(model.retention(spaced.reviews, 30) > model.retention(massed.reviews, 30) + 10)) errs.push('spaced review does not beat massed review at day 30');
    sweep(data, errs, (r, c, t) => model.generate(r, c, t), (p, c, w) => recheck(p, c, w, errs), c => c.types || TYPES);
  }
  return errs;
}
