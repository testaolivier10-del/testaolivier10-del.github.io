/* Validator for psychology/data/tools/development.json (Development), run by
   scripts/check-appsych-content.mjs. OWNED BY THIS TOOL ONLY (builder T4).
   check(data, map) -> problems: the frame, then 300 problems per context and
   type regenerated with the model the page runs (ApPsychMath.development),
   and every key recomputed independently from the problem's givens with the
   tables copied here (never through the model): Piaget's and Erikson's
   stages from the person's age, the concept from the scenario's wording, the
   attachment pattern and parenting style from their defining behaviors, the
   research design from how the study samples people, and the mean through
   ApPsychStats. Also: no psychosexual stages (a CED exclusion), every scene
   invented, no em dashes in what a student reads. */
import { frame, sweep, close } from './_drills.mjs';
import { runtime } from './_shared.mjs';

export const TYPES = ['piaget', 'erikson', 'attachment', 'parenting', 'adolescence', 'adultcog', 'methods'];
// Usual textbook ages (lower bound inclusive, upper exclusive).
const PIAGET = [[0, 2, 'Sensorimotor'], [2, 7, 'Preoperational'], [7, 12, 'Concrete operational'], [12, 200, 'Formal operational']];
const ERIKSON = [[0, 1, 'Trust vs. mistrust'], [1, 3, 'Autonomy vs. shame and doubt'], [3, 6, 'Initiative vs. guilt'], [6, 12, 'Industry vs. inferiority'], [12, 20, 'Identity vs. role confusion'], [20, 40, 'Intimacy vs. isolation'], [40, 65, 'Generativity vs. stagnation'], [65, 200, 'Integrity vs. despair']];
const PERIOD = [[0, 10, 'Childhood'], [10, 18, 'Adolescence'], [18, 25, 'Emerging adulthood'], [25, 65, 'Adulthood']];
const at = (list, a) => (list.find(([lo, hi]) => a >= lo && a < hi) || [])[2];
// The concept a Piaget scene shows, from its own words.
const PIAGET_CUE = [[/marble|thinks it.s still/i, 'Theory of mind'], [/hides a rattle|out of sight|behind the couch|peekaboo|cloth off/i, 'Object permanence'], [/glass|coins|clay/i, 'Conservation'], [/video call|present for Mom/i, 'Egocentrism'], [/debate|pendulum/i, 'Abstract (hypothetical) reasoning'], [/tie shoes|long division/i, 'Scaffolding'], [/banana/i, 'Pretend play']];
const TEEN_CUE = [[/stare|remember it for years/i, 'Imaginary audience'], [/not me|felt pain like mine/i, 'Personal fable'], [/family bakery/i, 'Identity foreclosure'], [/switched majors/i, 'Identity moratorium'], [/chosen social work/i, 'Identity achievement'], [/don.t really care/i, 'Identity diffusion'], [/full adult yet/i, 'Emerging adulthood'], [/feels behind/i, 'Social clock']];
const ADULT_CUE = [[/vocabulary game|grammar errors/i, 'Crystallized intelligence'], [/puzzle game|pattern problems/i, 'Fluid intelligence'], [/getting lost|pay bills/i, 'Dementia (a disease)'], [/moment to recall/i, 'Normal aging']];
const ATTACH_CUE = [[/comfort, calms quickly/i, 'Secure'], [/ignoring the return/i, 'Avoidant'], [/pushes away angrily/i, 'Anxious (ambivalent)'], [/head turned away, then freezes/i, 'Disorganized']];
const PARENT_CUE = [[/explain why|talks through why/i, 'Authoritative'], [/Because I said so|obedience without discussion/i, 'Authoritarian'], [/set .{0,4} own bedtime|be your friend/i, 'Permissive'], [/rarely home/i, 'Uninvolved']];
const cue = (list, text) => (list.find(([re]) => re.test(text)) || [])[1];
const BANNED = /psychosexual|oral stage|anal stage|phallic|latency stage|genital stage|Oedipus|—/;

const stepOf = (p, k) => p.steps.find(s => s.key === k);
const right = s => s && s.options[s.correct];
const plain = h => String(h).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');

export function recheck(p, c, w, errs) {
  const { Stats } = runtime('development');
  const g = p.given || {}, text = plain(p.text);
  const need = (cond, msg) => { if (!cond) errs.push(`${w}: ${msg}`); };
  const all = [p.text, ...p.solution, ...p.steps.flatMap(s => [s.label, ...(s.options || []), ...(s.why || [])])].join(' ');
  need(!BANNED.test(all), 'mentions psychosexual stages or uses an em dash');
  need(p.ctx === c.id && p.topic === c.topic, 'problem context or topic does not match its context');
  need(new RegExp(`\\b${g.name}\\b`).test(text) || p.type === 'methods', 'the person is not named in the scene');
  if (p.type === 'piaget') {
    need(right(stepOf(p, 'stage')) === at(PIAGET, g.age), `stage key "${right(stepOf(p, 'stage'))}" is not ${at(PIAGET, g.age)} at age ${g.age}`);
    need(right(stepOf(p, 'concept')) === cue(PIAGET_CUE, text), `concept key "${right(stepOf(p, 'concept'))}" is not what the scene shows (${cue(PIAGET_CUE, text)})`);
    if (/conserve|conservation/i.test(p.solution[1]) && /tall glass now has more|longer row has more/.test(text)) need(g.age < 7, 'a child who fails conservation should be preoperational');
  } else if (p.type === 'erikson') {
    const k = at(ERIKSON, g.age), i = ERIKSON.findIndex(e => e[2] === k);
    need(right(stepOf(p, 'stage')) === k, `stage key "${right(stepOf(p, 'stage'))}" is not ${k} at age ${g.age}`);
    const want = i < ERIKSON.length - 1 ? ERIKSON[i + 1][2] : ERIKSON[i - 1][2];
    need(right(stepOf(p, 'next')) === want, `next key "${right(stepOf(p, 'next'))}" is not ${want}`);
  } else if (p.type === 'attachment') {
    need(right(stepOf(p, 'style')) === cue(ATTACH_CUE, text), `style key "${right(stepOf(p, 'style'))}" does not match the reunion`);
    need(/correlational/.test(right(stepOf(p, 'claim'))), 'the claim key does not say the evidence is correlational');
    need(g.age >= 1 && g.age < 2, 'the strange situation is for children of about 1 to 2');
  } else if (p.type === 'parenting') {
    need(right(stepOf(p, 'style')) === cue(PARENT_CUE, text), `style key "${right(stepOf(p, 'style'))}" does not match the home`);
    need(/correlational/.test(right(stepOf(p, 'claim'))), 'the claim key does not say the research is correlational');
  } else if (p.type === 'adolescence') {
    need(right(stepOf(p, 'concept')) === cue(TEEN_CUE, text), `concept key "${right(stepOf(p, 'concept'))}" does not match the scene (${cue(TEEN_CUE, text)})`);
    need(right(stepOf(p, 'period')) === at(PERIOD, g.age), `period key "${right(stepOf(p, 'period'))}" is not ${at(PERIOD, g.age)} at ${g.age}`);
  } else if (p.type === 'adultcog') {
    need(right(stepOf(p, 'concept')) === cue(ADULT_CUE, text), `concept key "${right(stepOf(p, 'concept'))}" does not match the scene`);
    const tr = right(stepOf(p, 'trend'));
    const want = { 'Crystallized intelligence': /hold steady or grow/, 'Fluid intelligence': /decline gradually/, 'Dementia (a disease)': /not a normal part of aging/, 'Normal aging': /Small slowing is normal/ }[cue(ADULT_CUE, text)];
    need(want && want.test(tr), `trend key "${tr}" is wrong for ${cue(ADULT_CUE, text)}`);
    need(g.age >= 55, 'an aging scene needs an older adult');
  } else if (p.type === 'methods') {
    const design = /same group of people|same 200 children/.test(text) ? 'Longitudinal study' : /groups of|age groups/.test(text) ? 'Cross-sectional study' : null;
    need(right(stepOf(p, 'method')) === design, `method key "${right(stepOf(p, 'method'))}" is not ${design}`);
    need(design === 'Cross-sectional study' ? /cohort/i.test(right(stepOf(p, 'limit'))) : /drop out/i.test(right(stepOf(p, 'limit'))), 'limit key is not the weakness of this design');
    const nums = (text.match(/\(([a-z ]+)\):\s*([\d, ]+)\./) || [])[2];
    need(!!nums, 'the scores are not printed in the problem');
    if (nums) {
      const data = nums.split(',').map(Number);
      need(JSON.stringify(data) === JSON.stringify(g.data), 'printed scores differ from the givens');
      const mean = Stats.evaluate({ fn: 'mean', args: [data] });
      need(close(stepOf(p, 'mean').cell.answer, mean), `mean key ${stepOf(p, 'mean').cell.answer} is not ${mean}`);
    }
    need(/Invented study for practice/.test(text), 'the study is not labeled invented');
  } else errs.push(`${w}: unknown type ${p.type}`);
}

export function check(data, map) {
  const errs = [];
  frame(data, 'development', 'simulator', map, errs);
  const { model } = runtime('development');
  if (!model) errs.push('no model registered (ApPsychMath.development)');
  else if (!model.stub) {
    for (const c of data.contexts || []) for (const t of c.types || []) if (!TYPES.includes(t)) errs.push(`context ${c.id}: unknown type ${t}`);
    // The about text may say the excluded stages are left out, and nothing more.
    for (const k of ['intro', 'howItWorks']) if (BANNED.test(String(data[k] || '').replace(/Freud's psychosexual stages are not part of the AP® Psychology course, so they are left out\./, ''))) errs.push(`${k}: psychosexual stages or an em dash`);
    // The model's tables agree with the ones copied here.
    for (const s of model.PIAGET) if (at(PIAGET, s.from) !== s.name) errs.push(`model PIAGET ${s.name} starts at ${s.from}`);
    for (const s of model.ERIKSON) if (at(ERIKSON, s.from) !== s.name) errs.push(`model ERIKSON ${s.name} starts at ${s.from}`);
    if (model.ERIKSON.length !== 8 || model.PIAGET.length !== 4) errs.push('Erikson has eight stages and Piaget four');
    sweep(data, errs, (r, c, t) => model.generate(r, c, t), (p, c, w) => recheck(p, c, w, errs), c => c.types || TYPES);
  }
  return errs;
}
