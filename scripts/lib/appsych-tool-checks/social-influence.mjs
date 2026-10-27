/* Validator for psychology/data/tools/social-influence.json (Social
   influence), run by scripts/check-appsych-content.mjs. OWNED BY THIS TOOL
   ONLY (builder T4). check(data, map) -> problems: the frame, the published
   numbers the Explore graphs draw (checked against the values copied here
   from the papers, so a typo in the model cannot slip through), then 300
   problems per context and type regenerated with the model the page runs
   (ApPsychMath.socialInfluence) and every key recomputed independently: the
   kind of influence from the task (an obvious answer said in public is
   normative, an unclear one informational), the direction of each change
   from the published result it rests on, the bystander percent through
   ApPsychStats, the attribution and compliance concepts from the scene's
   wording. Every scenario must say it is invented; no em dashes. */
import { frame, sweep, close } from './_drills.mjs';
import { runtime } from './_shared.mjs';

export const TYPES = ['conformity', 'obedience', 'bystander', 'groups', 'attribution', 'compliance'];
// Published values (see the model's header for the sources).
const PUB = {
  asch: { 0: 0.7, 1: 2.8, 2: 12.8, 3: 33.3, 4: 35, 8: 32, 16: 31.3, partner: 5.5, errors: { 1: 0.33, 2: 1.53, 3: 4.0, 4: 4.2, 8: 3.84, 16: 3.75 } },
  milgram: { remote: 65, voice: 62.5, proximity: 40, touch: 30, phone: 22.5, office: 47.5, peers: 10 },
  darley: { 0: [85, 100], 1: [62, 85], 4: [31, 62] },
  facil: { good: [71, 80], poor: [36, 25] },
  loaf: { 0: 100, 1: 82, 5: 74 }
};
const CONCEPT = { normative: 'Normative social influence', informational: 'Informational social influence', obedience: 'Obedience', diffusion: 'Diffusion of responsibility', facilitation: 'Social facilitation', loafing: 'Social loafing', deindividuation: 'Deindividuation', polarization: 'Group polarization', groupthink: 'Groupthink', fae: 'Fundamental attribution error', actorObserver: 'Actor-observer bias', selfServing: 'Self-serving bias', foot: 'Foot-in-the-door technique', door: 'Door-in-the-face technique', reciprocity: 'Reciprocity norm', halo: 'Halo effect' };
const GROUP_CUE = [[/jury/, 'polarization'], [/stays silent/, 'groupthink'], [/masked/, 'deindividuation']];
const ATTR_CUE = [[/selfish jerk|must be shy/, 'fae'], [/Traffic was awful/, 'actorObserver'], [/I'm smart/, 'selfServing']];
const COMP_CUE = [[/small petition/, 'foot'], [/\$500/, 'door'], [/free sample/, 'reciprocity'], [/good-looking/, 'halo']];
const cue = (list, text) => (list.find(([re]) => re.test(text)) || [])[1];
const stepOf = (p, k) => p.steps.find(s => s.key === k);
const right = s => s && s.options[s.correct];
const plain = h => String(h).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');

export function recheck(p, c, w, errs) {
  const { Stats } = runtime('social-influence');
  const g = p.given || {}, text = plain(p.text);
  const need = (cond, msg) => { if (!cond) errs.push(`${w}: ${msg}`); };
  const all = [p.text, ...p.solution, ...p.steps.flatMap(s => [s.label, ...(s.options || []), ...(s.why || [])])].join(' ');
  need(!/—/.test(all), 'an em dash in student text');
  need(/^Invented scenario\./.test(text.trim()), 'the scenario is not labeled invented');
  need(p.ctx === c.id && p.topic === c.topic, 'problem context or topic does not match its context');
  const dir = (k, want) => need(right(stepOf(p, k)) === want, `${k} key "${right(stepOf(p, k))}" should be "${want}"`);
  if (p.type === 'conformity') {
    need(right(stepOf(p, 'concept')) === CONCEPT[g.task === 'clear' ? 'normative' : 'informational'], `concept key "${right(stepOf(p, 'concept'))}" is wrong for a ${g.task} task`);
    // partner and private answers lowered conformity; a majority growing 1 to 3 raised it (Asch).
    const want = g.change === 'bigger' ? (PUB.asch[3] > PUB.asch[1] ? 'Higher' : 'Lower') : (PUB.asch.partner < PUB.asch[3] ? 'Lower' : 'Higher');
    dir('predict', want);
    need(/33%/.test(right(stepOf(p, 'study'))) && /Franzen and Mader, 2023/.test(right(stepOf(p, 'study'))), 'the study key is not the 2023 replication');
  } else if (p.type === 'obedience') {
    need(right(stepOf(p, 'concept')) === 'Obedience', 'concept key is not obedience');
    const base = PUB.milgram.remote, want = g.change === 'uniform' ? 'Higher' : PUB.milgram[g.change] < base ? 'Lower' : 'Higher';
    dir('predict', want);
    need(/Burger, 2009/.test(right(stepOf(p, 'study'))) && /70%/.test(right(stepOf(p, 'study'))) && /82\.5%/.test(right(stepOf(p, 'study'))), 'the study key is not Burger (2009)');
  } else if (p.type === 'bystander') {
    need(right(stepOf(p, 'concept')) === CONCEPT.diffusion, 'concept key is not diffusion of responsibility');
    dir('predict', PUB.darley[0][0] > PUB.darley[4][0] ? 'Higher' : 'Lower');
    const want = Stats.evaluate({ fn: 'mul', args: [{ fn: 'div', args: [g.helped, g.total] }, 100] });
    need(close(stepOf(p, 'percent').cell.answer, want), `percent key ${stepOf(p, 'percent').cell.answer} is not ${want}`);
    need(new RegExp(`\\b${g.total} times\\b`).test(text) && new RegExp(`in ${g.helped} of them`).test(text), 'the survey numbers are not printed as given');
    need(g.helped < g.total, 'more helped than scenes');
    need(/Philpot/.test(right(stepOf(p, 'study'))), 'the study key is not the later research');
  } else if (p.type === 'groups') {
    if (g.setting === 'watched' || g.setting === 'pooled') {
      const want = g.setting === 'pooled' ? 'loafing' : 'facilitation';
      need(right(stepOf(p, 'concept')) === CONCEPT[want], `concept key "${right(stepOf(p, 'concept'))}" is not ${CONCEPT[want]}`);
      const better = g.setting === 'watched' && g.task === 'easy' ? PUB.facil.good[1] > PUB.facil.good[0] : g.setting === 'watched' ? PUB.facil.poor[1] > PUB.facil.poor[0] : PUB.loaf[5] > PUB.loaf[0];
      dir('predict', better ? 'Better' : 'Worse');
    } else {
      need(right(stepOf(p, 'concept')) === CONCEPT[cue(GROUP_CUE, text)], `concept key "${right(stepOf(p, 'concept'))}" does not match the scene`);
      need(stepOf(p, 'which').correct >= 0 && !/larger|less time|most confident/.test(right(stepOf(p, 'which'))), 'the fix key would make it worse');
    }
  } else if (p.type === 'attribution') {
    const k = cue(ATTR_CUE, text);
    need(right(stepOf(p, 'concept')) === CONCEPT[k], `concept key "${right(stepOf(p, 'concept'))}" does not match the scene (${CONCEPT[k]})`);
    need(k === 'fae' ? /^A dispositional/.test(right(stepOf(p, 'kind'))) : /^Both/.test(right(stepOf(p, 'kind'))), 'the attribution kind key is wrong');
  } else if (p.type === 'compliance') {
    const k = cue(COMP_CUE, text);
    need(right(stepOf(p, 'concept')) === CONCEPT[k], `concept key "${right(stepOf(p, 'concept'))}" does not match the scene (${CONCEPT[k]})`);
  } else errs.push(`${w}: unknown type ${p.type}`);
}

export function check(data, map) {
  const errs = [];
  frame(data, 'social-influence', 'simulator', map, errs);
  const { model } = runtime('social-influence');
  if (!model) errs.push('no model registered (ApPsychMath.socialInfluence)');
  else if (!model.stub) {
    for (const c of data.contexts || []) for (const t of c.types || []) if (!TYPES.includes(t)) errs.push(`context ${c.id}: unknown type ${t}`);
    for (const k of ['intro', 'howItWorks']) if (/—/.test(data[k] || '')) errs.push(`${k}: an em dash`);
    // The Explore graphs: every published value as the papers report it.
    for (const n of [0, 1, 2, 3, 4, 8, 16]) if (!close(model.aschPct(n, false), PUB.asch[n], 1e-9, 1e-9)) errs.push(`Asch at ${n}: model ${model.aschPct(n, false)}, published ${PUB.asch[n]}`);
    for (const [n, e] of Object.entries(PUB.asch.errors)) if (Math.abs(e / 12 * 100 - PUB.asch[n]) > 0.1) errs.push(`Asch at ${n}: ${PUB.asch[n]}% is not ${e} errors of 12`);
    if (model.aschPct(3, true) !== PUB.asch.partner) errs.push('Asch partner value');
    for (const m of model.MILGRAM) { if (PUB.milgram[m.id] !== m.pct) errs.push(`Milgram ${m.id}: ${m.pct}, published ${PUB.milgram[m.id]}`); if (m.n !== 40 || !Number.isInteger(m.pct * 0.4)) errs.push(`Milgram ${m.id}: not a whole number of 40 men`); }
    model.DARLEY.others.forEach((o, i) => { if (PUB.darley[o][0] !== model.DARLEY.beforeEnd[i] || PUB.darley[o][1] !== model.DARLEY.eventually[i]) errs.push(`Darley and Latane at ${o} others`); });
    if (JSON.stringify(model.FACIL.good) !== JSON.stringify(PUB.facil.good) || JSON.stringify(model.FACIL.poor) !== JSON.stringify(PUB.facil.poor)) errs.push('Michaels and colleagues values');
    model.LOAF.others.forEach((o, i) => { if (PUB.loaf[o] !== model.LOAF.effort[i]) errs.push(`Latane, Williams and Harkins at ${o} others`); });
    sweep(data, errs, (r, c, t) => model.generate(r, c, t), (p, c, w) => recheck(p, c, w, errs), c => c.types || TYPES);
  }
  return errs;
}
