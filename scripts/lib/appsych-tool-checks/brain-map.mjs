/* Validator for psychology/data/tools/brain-map.json (Brain map), run by
   scripts/check-appsych-content.mjs. OWNED BY THIS TOOL ONLY (builder T2).
   check(data, map) -> problems: the frame, then 300 problems per context and
   type regenerated with the model the page runs (ApPsychMath.brainMap), every
   key recomputed independently from the reference tables below (written from
   introductory neuroscience, not copied from the model):
     lesion   each case's region; the method of a named real case
     imaging  each scenario's method; each fMRI task's region
     split    which hemisphere gets the word (the opposite of the visual
              field), whether the patient can say it (speech in the left
              hemisphere; with the corpus callosum cut nothing crosses),
              whether the asked hand can find it (contralateral control)
     contra   the side of the body (opposite the hemisphere), motor vs
              somatosensory by the symptom
     locate   the highlighted region's name and job
   Also: every region the CED lists for 1.4 is in the model; no
   "left-brained" or "right-brained" people; no em dashes in student text. */
import { frame, sweep } from './_drills.mjs';
import { runtime } from './_shared.mjs';

export const TYPES = ['lesion', 'imaging', 'split', 'contra', 'locate'];
// CED 1.4 structures the tool must cover.
const CED_REGIONS = ['medulla', 'ras', 'reward', 'cerebellum', 'frontal', 'parietal', 'temporal', 'occipital', 'prefrontal', 'motor', 'somatosensory',
  'thalamus', 'hypothalamus', 'pituitary', 'hippocampus', 'amygdala', 'callosum', 'broca', 'wernicke'];
const LESION_KEY = { gage: 'prefrontal', hm: 'hippocampus', sm: 'amygdala', broca: 'broca', wernicke: 'wernicke', ataxia: 'cerebellum', breath: 'medulla',
  coma: 'ras', hunger: 'hypothalamus', visual: 'occipital', neglect: 'parietal', faces: 'temporal', gland: 'pituitary', relay: 'thalamus', olds: 'reward' };
const IMAGING_KEY = { sleep: 'EEG', 'faces-fmri': 'fMRI', seizure: 'EEG', decision: 'fMRI', rare: 'Case study', rats: 'Lesioning' };
const TASK_KEY = { music: 'auditory', pictures: 'visual', tap: 'motor', touch: 'somatosensory', fear: 'amygdala', plan: 'prefrontal', talk: 'broca', listen: 'wernicke', balance: 'cerebellum' };
const EM = /—/;
const MYTH = /\b(left|right)-brain(ed)? (people|person|thinkers?|learners?)\b/i;
// A myth may be named only inside an element with the class psy-myth, which corrects it (authoring guide).
const MYTH_BOX = /<(\w+)[^>]*class="[^"]*\bpsy-myth\b[^"]*"[^>]*>[\s\S]*?<\/\1>/g;

const stepOf = (p, k) => p.steps.find(s => s.key === k);
const rightText = s => s.options[s.correct];

export function recheck(p, c, w, errs) {
  const { model: B } = runtime('brain-map');
  const g = p.given || {};
  const need = (cond, msg) => { if (!cond) errs.push(`${w}: ${msg}`); };
  const all = [p.text, ...p.solution, ...p.steps.flatMap(s => [s.label, s.hint || '', ...(s.options || []), ...(s.why || [])])].join(' ');
  need(!EM.test(all), 'a text has an em dash');
  need(!MYTH.test(all.replace(/no “left-brained” or “right-brained” people/g, '')), 'a text sorts people into left- or right-brained');
  const name = k => B.REGIONS[k].name;
  if (p.type === 'lesion') {
    const k = LESION_KEY[g.case];
    need(k === g.region, `case ${g.case} is the ${k}, the problem says ${g.region}`);
    need(rightText(stepOf(p, 'region')) === name(k), `region key is not ${name(k)}`);
    const also = stepOf(p, 'also');
    if (g.case === 'hunger') need(/^Lesioning/.test(rightText(also)), 'the hunger studies are lesioning');
    else if (['gage', 'hm', 'sm'].includes(g.case)) need(/^A case study/.test(rightText(also)), `${g.case} is a case study`);
    else if (g.case === 'olds') need(/stimulation/.test(rightText(also)), 'Olds and Milner used brain stimulation');
    else need(rightText(also) === B.REGIONS[k].does, 'the function key is not the region’s function');
    need(p.figure.region === k, 'the figure shows another region');
  } else if (p.type === 'imaging') {
    need(rightText(stepOf(p, 'method')) === IMAGING_KEY[g.case], `method key is not ${IMAGING_KEY[g.case]}`);
    need(TASK_KEY[g.task] === g.region, `task ${g.task} lights the ${TASK_KEY[g.task]}`);
    need(rightText(stepOf(p, 'where')) === name(TASK_KEY[g.task]), 'the fMRI region key is wrong');
  } else if (p.type === 'split') {
    const first = g.field === 'left' ? 'right' : 'left';
    need(rightText(stepOf(p, 'hemi')) === (first === 'left' ? 'Left hemisphere' : 'Right hemisphere'), 'the hemisphere key is not the opposite of the field');
    const leftHas = first === 'left' || !g.cut, rightHas = first === 'right' || !g.cut;
    const says = leftHas; // speech is in the left hemisphere
    need(/^“Nothing/.test(rightText(stepOf(p, 'says'))) === !says, `the speech key disagrees (left hemisphere ${leftHas ? 'has' : 'lacks'} the word)`);
    const handOk = g.hand === 'left' ? rightHas : leftHas;
    need(rightText(stepOf(p, 'hand')).startsWith(handOk ? 'Yes' : 'No'), `the ${g.hand} hand key disagrees`);
    need(rightText(stepOf(p, 'hand')).includes((g.hand === 'left' ? 'right' : 'left') + ' hemisphere'), 'the hand key names the wrong hemisphere');
  } else if (p.type === 'contra') {
    const body = g.side === 'left' ? 'right' : 'left';
    need(rightText(stepOf(p, 'side')) === `The ${body} side`, `the side key is not the ${body} side`);
    need(rightText(stepOf(p, 'region')) === (g.area === 'motor' ? 'Motor cortex' : 'Somatosensory cortex'), 'the region key does not match the symptom');
    const lab = stepOf(p, 'region').label;
    need(g.area === 'motor' ? /cannot lift|weakness/.test(lab) : /feel/.test(lab), 'the symptom does not match the area');
  } else if (p.type === 'locate') {
    need(rightText(stepOf(p, 'name')) === name(g.region), 'the name key is not the highlighted region');
    need(rightText(stepOf(p, 'job')) === B.REGIONS[g.region].does, 'the job key is not the region’s function');
    need(p.figure.region === g.region && p.figure.show === 'before', 'the figure does not highlight the region');
    const v = B.REGIONS[g.region].view;
    need(v === 'both' || v === g.view, `${g.region} is not drawn in the ${g.view} view`);
  } else errs.push(`${w}: unknown type ${p.type}`);
}

export function check(data, map) {
  const errs = [];
  frame(data, 'brain-map', 'simulator', map, errs);
  const { model } = runtime('brain-map');
  if (!model) errs.push('no model registered (ApPsychMath.brainMap)');
  else if (!model.stub) {
    for (const k of CED_REGIONS) if (!model.REGIONS[k]) errs.push(`the model is missing ${k} (CED 1.4)`);
    for (const c of model.LESIONS) if (LESION_KEY[c.id] !== c.region) errs.push(`model case ${c.id} disagrees with the reference table`);
    for (const c of model.IMAGING) if (model.METHODS[c.method].name !== IMAGING_KEY[c.id]) errs.push(`model imaging case ${c.id} disagrees`);
    for (const a of model.ACTIVE) if (TASK_KEY[a.id] !== a.region) errs.push(`model task ${a.id} disagrees`);
    const sb = model.splitBrain('right', true);
    if (!(sb.first === 'left' && sb.says && sb.rightHand && !sb.leftHand)) errs.push('splitBrain: the right field goes to the left hemisphere, which speaks and runs the right hand');
    for (const c of data.contexts || []) {
      for (const t of c.types || []) if (!TYPES.includes(t)) errs.push(`context ${c.id}: unknown type ${t}`);
      for (const id of c.cases || []) if (!(id in LESION_KEY) && !(id in IMAGING_KEY)) errs.push(`context ${c.id}: unknown case ${id}`);
    }
    const walk = (v, path) => { if (typeof v === 'string') { if (EM.test(v)) errs.push(`${path}: em dash in student text`); if (MYTH.test(v.replace(MYTH_BOX, ' '))) errs.push(`${path}: left- or right-brained people`); } else if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) walk(x, path ? `${path}.${k}` : k); };
    walk(data, '');
    sweep(data, errs, (r, c, t) => model.generate(r, c, t), (p, c, w) => recheck(p, c, w, errs), c => c.types || TYPES);
  }
  return errs;
}
