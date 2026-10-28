/* Validator for psychology/data/tools/neuron.json (Neuron), run by
   scripts/check-appsych-content.mjs. OWNED BY THIS TOOL ONLY (builder T2).
   check(data, map) -> problems: the frame, then 300 problems per context and
   type regenerated with the model the page runs (ApPsychMath.neuron), every
   key recomputed independently:
     trace        the spike count by counting upward crossings of 0 mV in the
                  plotted series (never through the model's spike list),
                  threshold minus rest with ApPsychStats, the why and
                  stronger keys against what the series shows (all-or-none:
                  every spike peaks at the same height; a pulse below
                  threshold never fires; a pulse in the refractory period
                  does not), and the series against the model's simulate()
     drug         the drug's class and neurotransmitter against the table
                  below (copied from pharmacology references, not from the
                  model), the signal direction from the class
     transmitter  each case's neurotransmitter against the table below
     parts        each case's part against the table below
   Also: the neurotransmitters are exactly the eight the CED lists, and no
   text a student reads has an em dash. */
import { frame, sweep } from './_drills.mjs';
import { runtime } from './_shared.mjs';

export const TYPES = ['trace', 'drug', 'transmitter', 'parts'];
// CED 1.3: only these neurotransmitters.
const CED_NT = ['acetylcholine', 'dopamine', 'serotonin', 'norepinephrine', 'glutamate', 'gaba', 'endorphins', 'substanceP'];
// Real drugs: what each acts on and how (introductory psychology's classes).
const DRUG_KEY = {
  nicotine: ['acetylcholine', 'agonist'], curare: ['acetylcholine', 'antagonist'], ropinirole: ['dopamine', 'agonist'],
  haloperidol: ['dopamine', 'antagonist'], cocaine: ['dopamine', 'reuptake'], ssri: ['serotonin', 'reuptake'],
  atomoxetine: ['norepinephrine', 'reuptake'], propranolol: ['norepinephrine', 'antagonist'], ketamine: ['glutamate', 'antagonist'],
  benzo: ['gaba', 'agonist'], tiagabine: ['gaba', 'reuptake'], morphine: ['endorphins', 'agonist'], naloxone: ['endorphins', 'antagonist'],
  aprepitant: ['substanceP', 'antagonist']
};
const CLASS_NAME = { agonist: 'Agonist', antagonist: 'Antagonist', reuptake: 'Reuptake inhibitor' };
const CASE_NT = { naloxone: 'endorphins', runner: 'endorphins', parkinson: 'dopamine', reward: 'dopamine', ssri: 'serotonin', myasthenia: 'acetylcholine',
  alzheimer: 'acetylcholine', seizure: 'gaba', alcohol: 'gaba', learning: 'glutamate', migraine: 'glutamate', alert: 'norepinephrine', pain: 'substanceP' };
const CASE_PART = { ms: 'Myelin sheath', receive: 'Dendrites', release: 'Axon terminals', carry: 'Axon', support: 'Glial cells', sum: 'Cell body (soma)' };
const EM = /—/;

const stepOf = (p, k) => p.steps.find(s => s.key === k);
const keyOf = s => s.cell.answer;
const rightText = s => s.options[s.correct];

export function recheck(p, c, w, errs) {
  const { Stats, model: N, M } = runtime('neuron');
  const g = p.given || {};
  const need = (cond, msg) => { if (!cond) errs.push(`${w}: ${msg}`); };
  const all = [p.text, ...p.solution, ...p.steps.flatMap(s => [s.label, s.hint || '', ...(s.options || []), ...(s.why || []), ...((s.cell && s.cell.mistakes) || []).map(m => m.why)])].join(' ');
  need(!EM.test(all), 'a text has an em dash');
  if (p.type === 'trace') {
    const ser = g.series;
    let n = 0; const peaks = [];
    for (let i = 1; i < ser.length; i++) if (ser[i][1] >= 0 && ser[i - 1][1] < 0) n++;
    let cur = -Infinity, inSpike = false;
    for (const [, v] of ser) { if (v >= 0) { inSpike = true; cur = Math.max(cur, v); } else if (inSpike) { peaks.push(cur); cur = -Infinity; inSpike = false; } }
    need(keyOf(stepOf(p, 'count')) === n, `count key ${keyOf(stepOf(p, 'count'))} is not the ${n} spikes in the series`);
    need(peaks.every(v => Math.abs(v - 40) <= 0.6), 'all-or-none: a spike does not peak at +40 mV');
    const up = Stats.evaluate({ fn: 'sub', args: [g.thresh, g.rest] });
    need(keyOf(stepOf(p, 'gap')) === up, `gap key is not threshold minus rest (${up})`);
    need(ser.every(q => q[1] >= g.rest - 10.5 && q[1] <= 40.5), 'the series leaves the range from 10 mV below rest to +40 mV');
    need(ser.every((q, i) => !(i && q[1] >= 0 && ser[i - 1][1] < 0 && q[0] > 23)), 'a spike is cut off at the end of the recording');
    // the series is the model's own run
    const run = N.simulate({ mode: g.mode, S: g.S, gap: g.gap == null ? 3 : g.gap, rest: g.rest, thresh: g.thresh, dur: 25, t0: 2 });
    const ser2 = N.series(run, 0.1);
    need(ser2.length === ser.length && ser2.every((q, i) => q[1] === ser[i][1]), 'the plotted series is not the model');
    if (g.mode === 'pulse') {
      need((n === 1) === (g.S >= up), `a ${g.S} mV pulse with threshold ${up} mV above rest ${n ? 'fired' : 'did not fire'}`);
      need(n <= 1, 'one pulse fired more than once');
      need(/past threshold/.test(rightText(stepOf(p, 'why'))) === (n === 1), 'the why key disagrees with the trace');
    } else if (g.mode === 'pair') {
      need(g.S >= up, 'a pair must fire on its first pulse');
      need(n === 1 || n === 2, 'a pair fired neither once nor twice');
      if (g.gap < 2) need(n === 1, `a second pulse ${g.gap} ms later (absolute refractory period) fired`);
      if (g.gap >= 5) need(n === 2, `a second pulse ${g.gap} ms later (after the refractory period) did not fire`);
      need(/after the refractory period/.test(rightText(stepOf(p, 'why'))) === (n === 2), 'the why key disagrees with the trace');
    } else {
      need(n >= 2, 'a held stimulus above threshold fired fewer than twice');
      need(/more often/.test(rightText(stepOf(p, 'stronger'))), 'the stronger key is not the rate code');
      // stronger held stimulus never fires fewer
      need(N.rate(Math.min(40, g.S + 8), { rest: g.rest, thresh: g.thresh }) >= n, 'a stronger held stimulus fired fewer spikes');
    }
    if (g.mode !== 'held') need(/same size/.test(rightText(stepOf(p, 'stronger'))), 'the stronger key is not all-or-none');
  } else if (p.type === 'drug') {
    if (g.drug) {
      const k = DRUG_KEY[g.drug];
      need(!!k, `unknown drug ${g.drug}`);
      if (k) need(k[0] === g.nt && k[1] === g.cls, `${g.drug} is ${k[1]} on ${k[0]}, the problem says ${g.cls} on ${g.nt}`);
    }
    need(CED_NT.includes(g.nt), `${g.nt} is not a CED neurotransmitter`);
    need(rightText(stepOf(p, 'cls')) === CLASS_NAME[g.cls], `class key is not ${CLASS_NAME[g.cls]}`);
    const more = g.cls !== 'antagonist';
    need(rightText(stepOf(p, 'signal')).startsWith(more ? 'It increases' : 'It decreases'), 'the signal direction disagrees with the class');
    need(stepOf(p, 'cls').options.includes('A neurotransmitter'), 'the drug is not contrasted with a neurotransmitter');
  } else if (p.type === 'transmitter') {
    const nt = CASE_NT[g.case];
    need(nt === g.nt, `case ${g.case} is ${nt}, the problem says ${g.nt}`);
    need(rightText(stepOf(p, 'nt')) === N.NT[nt].name, 'the neurotransmitter key is not the case’s');
    need(rightText(stepOf(p, 'drugnt')) === CLASS_NAME[g.cls], 'the drug class key is wrong');
  } else if (p.type === 'parts') {
    need(rightText(stepOf(p, 'part')) === CASE_PART[g.case], `case ${g.case} is ${CASE_PART[g.case]}`);
    need(/spinal cord/.test(rightText(stepOf(p, 'next'))), 'the reflex arc key is not through the spinal cord');
  } else errs.push(`${w}: unknown type ${p.type}`);
}

export function check(data, map) {
  const errs = [];
  frame(data, 'neuron', 'simulator', map, errs);
  const { model } = runtime('neuron');
  if (!model) errs.push('no model registered (ApPsychMath.neuron)');
  else if (!model.stub) {
    const nts = Object.keys(model.NT);
    if (nts.length !== CED_NT.length || !CED_NT.every(k => nts.includes(k))) errs.push('the model’s neurotransmitters are not exactly the eight the CED lists');
    for (const d of model.DRUGS) { const k = DRUG_KEY[d.id]; if (!k || k[0] !== d.nt || k[1] !== d.cls) errs.push(`model drug ${d.id} disagrees with the reference table`); }
    for (const c of model.NT_CASES) if (CASE_NT[c.id] !== c.nt) errs.push(`model case ${c.id} disagrees with the reference table`);
    for (const c of data.contexts || []) for (const t of c.types || []) if (!TYPES.includes(t)) errs.push(`context ${c.id}: unknown type ${t}`);
    if (data.explore && data.explore.nt && !CED_NT.includes(data.explore.nt)) errs.push('explore.nt is not a CED neurotransmitter');
    const walk = (v, path) => { if (typeof v === 'string') { if (EM.test(v)) errs.push(`${path}: em dash in student text`); } else if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) walk(x, path ? `${path}.${k}` : k); };
    walk(data, '');
    sweep(data, errs, (r, c, t) => model.generate(r, c, t), (p, c, w) => recheck(p, c, w, errs), c => c.types || TYPES);
  }
  return errs;
}
