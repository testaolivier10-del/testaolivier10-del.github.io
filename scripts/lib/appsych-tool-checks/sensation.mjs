/* Validator for psychology/data/tools/sensation.json (Sensation and
   perception), run by scripts/check-appsych-content.mjs. OWNED BY THIS TOOL
   ONLY (builder T2). check(data, map) -> problems: the frame, then 300
   problems per context and type regenerated with the model the page runs
   (ApPsychMath.sensation), every key recomputed independently:
     sdt         the outcome named by its definition; the hit or false-alarm
                 rate from the counts with ApPsychStats; the four counts add
                 up to the trials; the criterion key from its direction
     weber       the JND as fraction x stimulus (ApPsychStats), the Weber
                 fractions against the table below; noticed iff the change
                 reaches the JND
     threshold   the 50% point read from the table (and the table rising)
     afterimage  the opponent color from the pairs below; the theory
     adapt       adaptation vs habituation and each theory case
     depth       each scene's cue, monocular or binocular from the CED's lists
     gestalt     each figure's principle
   Also: the CED's depth cues and Gestalt principles only; no em dashes. */
import { frame, sweep } from './_drills.mjs';
import { runtime } from './_shared.mjs';

export const TYPES = ['sdt', 'weber', 'threshold', 'afterimage', 'adapt', 'depth', 'gestalt'];
const WEBER = { weight: 0.02, brightness: 0.08, loudness: 0.05, pitch: 0.003, salt: 0.08 };
const OPP = { red: 'green', green: 'red', blue: 'yellow', yellow: 'blue' };
const MONO = ['relative-size', 'interposition', 'linear-perspective', 'texture-gradient', 'relative-clarity'], BINO = ['retinal-disparity', 'convergence'];
const GESTALT = ['closure', 'figure-ground', 'proximity', 'similarity'];
const SCENE_CUE = { road: 'linear-perspective', trees: 'relative-size', hills: 'interposition', field: 'texture-gradient', mountains: 'relative-clarity', vr: 'retinal-disparity', finger: 'convergence' };
const SCENE_LAW = { kanizsa: 'closure', vase: 'figure-ground', pairs: 'proximity', rows: 'similarity' };
const THEORY = { 'rg-blind': 'Trichromatic theory', flag: 'Opponent-process theory', night: 'Rods', detail: 'Cones', high: 'Place theory', low: 'Frequency theory', phantom: 'Phantom limb sensation', rub: 'Gate-control theory' };
const ADAPT = { pool: 'Sensory adaptation', perfume: 'Sensory adaptation', watch: 'Sensory adaptation', fridge: 'Habituation' };
const OUT = { hit: 'A hit', miss: 'A miss', fa: 'A false alarm', cr: 'A correct rejection' };
const EM = /—/;

const stepOf = (p, k) => p.steps.find(s => s.key === k);
const rightText = s => s.options[s.correct];

export function recheck(p, c, w, errs) {
  const { Stats, model: X } = runtime('sensation');
  const g = p.given || {};
  const need = (cond, msg) => { if (!cond) errs.push(`${w}: ${msg}`); };
  const all = [p.text, ...p.solution, ...p.steps.flatMap(s => [s.label, s.hint || '', ...(s.options || []), ...(s.why || []), ...((s.cell && s.cell.mistakes) || []).map(m => m.why)])].join(' ');
  need(!EM.test(all), 'a text has an em dash');
  if (p.type === 'sdt') {
    need(g.hits + g.misses === g.sigN && g.fas + g.crs === g.noiseN, 'the counts do not add up to the trials');
    need(g.hits >= 0 && g.misses >= 0 && g.fas >= 0 && g.crs >= 0, 'a negative count');
    const lab = stepOf(p, 'outcome').label, present = /signal is present/.test(lab), yes = !/does not notice|correctly says nothing/.test(lab);
    const want = present ? (yes ? 'hit' : 'miss') : (yes ? 'fa' : 'cr');
    need(want === g.outcome && rightText(stepOf(p, 'outcome')) === OUT[want], `the trial described is ${OUT[want]}`);
    const rate = g.askHit ? Stats.evaluate({ fn: 'round', args: [{ fn: 'mul', args: [100, { fn: 'div', args: [g.hits, g.sigN] }] }, 0] }) : Stats.evaluate({ fn: 'round', args: [{ fn: 'mul', args: [100, { fn: 'div', args: [g.fas, g.noiseN] }] }, 0] });
    need(stepOf(p, 'rate').cell.answer === rate, `rate key is not ${rate}`);
    need(/hit rate/.test(stepOf(p, 'rate').label) === g.askHit, 'the rate asked is not the rate keyed');
    need(rightText(stepOf(p, 'criterion')).startsWith(g.strict ? 'Fewer false alarms' : 'More hits, but also'), 'the criterion key has the wrong direction');
  } else if (p.type === 'weber') {
    need(Math.abs(g.k - WEBER[g.sense]) < 1e-12, `${g.sense} Weber fraction is ${WEBER[g.sense]}`);
    const j = Stats.evaluate({ fn: 'mul', args: [g.I, WEBER[g.sense]] });
    need(Math.abs(stepOf(p, 'jnd').cell.answer - j) < 1e-9, `jnd key is not ${j}`);
    const noticed = g.add >= j - 1e-9;
    need(rightText(stepOf(p, 'notice')).startsWith(noticed ? 'Yes' : 'No'), `the notice key disagrees (change ${g.add}, JND ${j})`);
  } else if (p.type === 'threshold') {
    const i = g.pct.findIndex(v => v === 50);
    need(i > -1 && stepOf(p, 'thresh').cell.answer === g.levels[i], 'the threshold key is not the intensity detected 50% of the time');
    need(g.pct.every((v, k) => k === 0 || v >= g.pct[k - 1]), 'detection does not rise with intensity');
    need(/half the time/.test(rightText(stepOf(p, 'what'))), 'the definition key is wrong');
  } else if (p.type === 'afterimage') {
    const opp = OPP[g.color];
    need(rightText(stepOf(p, 'color')).toLowerCase() === opp, `the afterimage of ${g.color} is ${opp}`);
    need(rightText(stepOf(p, 'theory')) === 'Opponent-process theory', 'afterimages are opponent-process');
  } else if (p.type === 'adapt') {
    if (g.kind) need(rightText(stepOf(p, 'kind')) === ADAPT[g.case], `case ${g.case} is ${ADAPT[g.case]}`);
    else need(rightText(stepOf(p, 'theory')) === THEORY[g.case], `case ${g.case} is ${THEORY[g.case]}`);
  } else if (p.type === 'depth') {
    const cue = SCENE_CUE[g.scene];
    need(cue === g.cue, `scene ${g.scene} shows ${cue}`);
    need(rightText(stepOf(p, 'cue')) === X.DEPTH[cue].name, 'the cue key is wrong');
    need(rightText(stepOf(p, 'mono')).startsWith(MONO.includes(cue) ? 'Monocular' : 'Binocular'), `${cue} is ${MONO.includes(cue) ? 'monocular' : 'binocular'}`);
  } else if (p.type === 'gestalt') {
    need(SCENE_LAW[g.scene] === g.law && rightText(stepOf(p, 'law')) === X.GESTALT[g.law].name, `figure ${g.scene} is ${SCENE_LAW[g.scene]}`);
    need(/^Top-down/.test(rightText(stepOf(p, 'other'))), 'Gestalt is top-down organization');
  } else errs.push(`${w}: unknown type ${p.type}`);
}

export function check(data, map) {
  const errs = [];
  frame(data, 'sensation', 'simulator', map, errs);
  const { model, Stats } = runtime('sensation');
  if (!model) errs.push('no model registered (ApPsychMath.sensation)');
  else if (!model.stub) {
    for (const [k, v] of Object.entries(WEBER)) if (!model.WEBER[k] || model.WEBER[k].k !== v) errs.push(`model Weber fraction for ${k} is not ${v}`);
    const cues = Object.keys(model.DEPTH);
    if (cues.length !== MONO.length + BINO.length || !MONO.concat(BINO).every(k => cues.includes(k))) errs.push('the depth cues are not exactly the CED’s');
    for (const k of MONO) if (model.DEPTH[k].kind !== 'monocular') errs.push(`${k} is monocular`);
    for (const k of BINO) if (model.DEPTH[k].kind !== 'binocular') errs.push(`${k} is binocular`);
    if (Object.keys(model.GESTALT).sort().join() !== GESTALT.slice().sort().join()) errs.push('the Gestalt principles are not exactly the CED’s four');
    // the signal detection curves: hits and false alarms from the normal CDF
    const r = model.sdt(1, 0.5), hit = Stats.evaluate({ fn: 'mul', args: [100, { fn: 'sub', args: [1, { fn: 'cdf', args: [-0.5] }] }] });
    if (Math.abs(r.hit - hit) > 1e-9 || Math.abs(r.hit + r.miss - 100) > 1e-9 || Math.abs(r.fa + r.cr - 100) > 1e-9) errs.push('sdt() disagrees with the normal curve');
    for (const c of data.contexts || []) for (const t of c.types || []) if (!TYPES.includes(t)) errs.push(`context ${c.id}: unknown type ${t}`);
    const walk = (v, path) => { if (typeof v === 'string') { if (EM.test(v)) errs.push(`${path}: em dash in student text`); } else if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) walk(x, path ? `${path}.${k}` : k); };
    walk(data, '');
    sweep(data, errs, (r2, c, t) => model.generate(r2, c, t), (p, c, w) => recheck(p, c, w, errs), c => c.types || TYPES);
  }
  return errs;
}
