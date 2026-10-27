/* AP® Psychology exams and the "Make it specific" trainer:
   loading, assembly and checks shared by the generator
   (scripts/build-appsych.mjs), the content check (scripts/check-appsych-content.mjs)
   and the tests (scripts/test/appsych-exams.test.mjs). Formats:
   docs/appsych-architecture.md, "Practice exams" and "Make it specific".
   Forked from AP® Statistics'.

     loadExams(dataDir)            { items, stimuli, forms } from data/exams/
     loadJustify(dataDir, map)     every prompt, in course order
     unitRange(weight, n)          [min, max] questions a unit may have out of n
     checkForms(forms, ctx)        problems with the two fixed exams
     checkJustify(prompts, ctx)    problems with the trainer's prompts
     checkNumbers(items, prompts)  every number in an exam-only item or a
                                   prompt, recomputed here with ApPsychStats
                                   (EXAM_NUMBERS: Phase 3; JUSTIFY_NUMBERS
                                   empty until the prompts are written) */
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { Stats } from './appsych-mathlib.mjs';

const readJson = p => JSON.parse(readFileSync(p, 'utf8'));
const strip = s => String(s ?? '').replace(/<\/?[A-Za-z!][^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

export const MCQ_TOTAL = 75;
// Section I as the May 2027 exam: one part, 75 four-option questions in 90
// minutes, 66.7% of the score, no calculator; standalone items plus sets
// sharing one study description or data display (framework.md section 5).
// The official set counts are not published (third party: "sets" only), so
// the forms hold 2 to 6 study sets, 2 to 6 data sets and 0 to 4 figure sets
// until a person confirms them (docs/appsych-needs-author.md, mcq-sets).
export const MCQ_PARTS = [{ key: '', n: 75, minutes: 90 }];
export const EXAM_SETS = { study: [2, 6], data: [2, 6], visual: [0, 4] };
// Section II: 2 questions in 70 minutes, 7 points each, 33.3% of the score,
// in this order: the Article Analysis Question, then the Evidence-Based Question.
export const FRQ_PARTS = [{ key: '', n: 2, minutes: 70 }];
export const FRQ_ORDER = ['aaq', 'ebq'];
export const FRQ_POINTS = 7;
export const FRQ_TOTAL = 2;
// The trainer's free prompts: the first few in course order (spec section 6).
export const FREE_JUSTIFY = 3;
// "Make it specific" (spec section 7): the reader-report misses the trainer
// is built around (docs/appsych-research/framework.md section 7), one per
// part of the AAQ and the EBQ.
export const JUSTIFY_SKILLS = {
  method: 'The one research method the study used, named exactly (an experiment, a correlational study ...)',
  opdef: 'The operational definition: how this study measured the variable, not what the concept means',
  statistic: 'What a reported statistic or difference shows about these groups, with its direction',
  ethics: 'An ethical safeguard the summary describes, and how the researchers applied it',
  generalize: 'Whether the results generalize to a named population, from the participants\' characteristics',
  argue: 'A specific result used to support or refute the hypothesis, explained',
  claim: 'A defensible claim that answers the question, not a topic sentence',
  evidence: 'A specific, accurate result from one source, cited',
  reasoning: 'How the evidence supports the claim, with a psychology concept applied (not a research word)',
};

export function loadExams(dataDir) {
  const dir = join(dataDir, 'exams');
  if (!existsSync(join(dir, 'forms.json'))) return { items: [], stimuli: {}, forms: [] };
  const it = existsSync(join(dir, 'items.json')) ? readJson(join(dir, 'items.json')) : { items: [], stimuli: {} };
  return { items: it.items || [], stimuli: it.stimuli || {}, forms: readJson(join(dir, 'forms.json')).forms || [] };
}

export function loadJustify(dataDir, map) {
  const dir = join(dataDir, 'justify');
  if (!existsSync(dir)) return [];
  const out = [];
  for (const f of readdirSync(dir).filter(f => f.endsWith('.json')).sort()) for (const p of readJson(join(dir, f)).prompts || []) out.push({ ...p, file: f });
  if (map) {
    const pos = id => map.topics.findIndex(t => t.id === id);
    const ch = id => map.chapters.findIndex(c => c.id === id);
    out.sort((a, b) => ch(a.unit) - ch(b.unit) || pos(a.topic) - pos(b.topic));
  }
  return out;
}

/* A unit's (or a practice's) share of Section I, from its exam weight range
   in percent: floor of the low end to ceiling of the high end, so 15-25%
   of 75 is 11 to 19. */
export function unitRange(weight, n = MCQ_TOTAL) {
  return [Math.floor(weight[0] / 100 * n + 1e-9), Math.ceil(weight[1] / 100 * n - 1e-9)];
}

/* ctx: { map, bank: Map(id -> item), examItems: Map(id -> item), stimuli(id) -> stimulus, frqs: { id: frq }, orderOf(id) }.
   A form passes when Section I has exactly 75 four-option single-answer
   questions; each block is a whole stimulus set in authored order (or one
   standalone question); its sets fall in EXAM_SETS (study, data, figure;
   docs/appsych-spec.md decision 8); every unit sits inside its weight
   range of 75 and every practice inside its; and Section II is 2 FRQs in
   the order AAQ, EBQ, 7 points each, that exist. No question or
   FRQ may be in both forms, and an exam-only item belongs to its own form. */
export function checkForms(forms, ctx) {
  const errs = [];
  const { map, bank, examItems, frqs } = ctx;
  if (!Array.isArray(forms) || forms.length < 2) errs.push(`need at least 2 practice exams, found ${(forms || []).length}`);
  const seenQ = new Map(), seenF = new Map();
  const units = map.chapters.filter(c => c.part === 'course');
  for (const [fi, f] of (forms || []).entries()) {
    const w = `${f.id || `form ${fi + 1}`}`;
    if (!f.id || !/^form-\d+$/.test(f.id)) errs.push(`${w}: id must be form-<n>`);
    if (!f.title) errs.push(`${w}: title missing`);
    const ids = (f.mcq || []).flat();
    if (ids.length !== MCQ_TOTAL) errs.push(`${w}: Section I has ${ids.length} questions, not ${MCQ_TOTAL}`);
    const count = {}, practice = {}, sets = {};
    for (const [bi, block] of (f.mcq || []).entries()) {
      if (!Array.isArray(block) || !block.length) { errs.push(`${w}: block ${bi + 1} is empty`); continue; }
      const qs = block.map(id => bank.get(id) || examItems.get(id));
      block.forEach((id, k) => { if (!qs[k]) errs.push(`${w}: unknown question ${id}`); });
      if (qs.some(q => !q)) continue;
      for (const q of qs) {
        if (q.type !== 'single' || (q.options || []).length !== 4) errs.push(`${w}: ${q.id} is not a four-option single-answer question`);
        count[q.unit] = (count[q.unit] || 0) + 1;
        const pr = String(q.practice || '').split('.')[0];
        practice[pr] = (practice[pr] || 0) + 1;
        if (seenQ.has(q.id) && seenQ.get(q.id) !== w) errs.push(`${w}: ${q.id} is also in ${seenQ.get(q.id)}`);
        seenQ.set(q.id, w);
        const own = /^psy-exam-(\d+)-\d+$/.exec(q.id);
        if (own && `form-${own[1]}` !== f.id) errs.push(`${w}: exam-only item ${q.id} belongs to form-${own[1]}`);
      }
      const stim = qs[0].stimulus || null;
      const st = stim && ctx.stimuli ? ctx.stimuli(stim) : null;
      if (st && EXAM_SETS[st.kind]) sets[st.kind] = (sets[st.kind] || 0) + 1;
      if (qs.length === 1 && stim && !examItems.has(qs[0].id)) errs.push(`${w}: ${qs[0].id} needs its stimulus, so it goes in a block with the rest of its set`);
      if (qs.length > 1) {
        if (!stim || qs.some(q => q.stimulus !== stim)) errs.push(`${w}: block ${block.join(', ')} mixes stimuli; a block is one set or one question`);
        if (qs.length < 2 || qs.length > 5) errs.push(`${w}: set ${stim} has ${qs.length} questions in the exam (2 to 5)`);
        const order = qs.map(q => ctx.orderOf(q.id));
        if (order.some((x, i) => i && x <= order[i - 1])) errs.push(`${w}: set ${stim} is not in authored order`);
      }
    }
    for (const [k, [lo, hi]] of Object.entries(EXAM_SETS)) if ((sets[k] || 0) < lo || (sets[k] || 0) > hi) errs.push(`${w}: Section I has ${sets[k] || 0} ${k} sets; the exam has ${lo === hi ? lo : `${lo} to ${hi}`}`);
    for (const u of units) {
      const [lo, hi] = unitRange(u.weight);
      const n = count[u.id] || 0;
      if (n < lo || n > hi) errs.push(`${w}: Unit ${u.n} has ${n} questions; its ${u.weight[0]}-${u.weight[1]}% weight allows ${lo} to ${hi}`);
    }
    // Practice weights are third party (needs-author practice-weights): checked
    // only when the map marks them confirmed.
    for (const p of map.practicesConfirmed ? map.practices || [] : []) {
      if (!Array.isArray(p.mcqWeight)) continue;
      const [lo, hi] = unitRange(p.mcqWeight), n = practice[String(p.id)] || 0;
      if (n < lo || n > hi) errs.push(`${w}: practice ${p.id} has ${n} questions; its ${p.mcqWeight[0]}-${p.mcqWeight[1]}% weight allows ${lo} to ${hi}`);
    }
    for (const u of Object.keys(count)) if (!units.some(x => x.id === u)) errs.push(`${w}: questions from ${u}, which is not a course unit`);
    const fq = f.frq || [];
    if (fq.length !== FRQ_TOTAL) errs.push(`${w}: Section II has ${fq.length} questions, not ${FRQ_TOTAL}`);
    fq.forEach((id, i) => {
      const q = frqs[id];
      if (!q) { errs.push(`${w}: unknown FRQ ${id}`); return; }
      if (q.type !== FRQ_ORDER[i]) errs.push(`${w}: Section II question ${i + 1} is a ${FRQ_ORDER[i]} question; ${id} is ${q.type}`);
      if (q.points !== FRQ_POINTS) errs.push(`${w}: ${id} is worth ${q.points} points, not ${FRQ_POINTS}`);
      if (q.placeholder) errs.push(`${w}: ${id} is a placeholder`);
      if (seenF.has(id) && seenF.get(id) !== w) errs.push(`${w}: FRQ ${id} is also in ${seenF.get(id)}`);
      seenF.set(id, w);
    });
  }
  return errs;
}

/* Which units a form needs published before it can be served. */
export function formUnits(f, ctx) {
  const u = new Set();
  for (const id of (f.mcq || []).flat()) { const q = ctx.bank.get(id) || ctx.examItems.get(id); if (q) u.add(q.unit); }
  for (const id of f.frq || []) for (const x of (ctx.frqs[id] || {}).units || []) u.add(x);
  return [...u];
}

/* ctx: { map, trademarkProblems, scanPage }. */
export function checkJustify(prompts, ctx) {
  const errs = [];
  const ids = new Set();
  const { map } = ctx;
  for (const p of prompts) {
    const w = `justify ${p.id || '(no id)'}`;
    if (!p.id || !/^u[1-9]-[a-z0-9-]+$/.test(p.id)) errs.push(`${w}: id must be u<unit>-<words>`);
    if (ids.has(p.id)) errs.push(`${w}: duplicate id`); ids.add(p.id);
    const t = map.topicById(p.topic);
    if (!t) errs.push(`${w}: unknown topic "${p.topic}"`);
    else if (t.chapter !== p.unit) errs.push(`${w}: topic ${p.topic} is in ${t.chapter}, not ${p.unit}`);
    if (p.file && p.file !== `${p.unit}.json`) errs.push(`${w}: lives in ${p.file}; a prompt goes in its unit's file`);
    if (!/^[1-4]\.[A-D]$/.test(p.practice || '')) errs.push(`${w}: practice must be a skill id like "2.B"`);
    if (!JUSTIFY_SKILLS[p.skill]) errs.push(`${w}: skill must be one of ${Object.keys(JUSTIFY_SKILLS).join(', ')}`);
    if (!p.title || p.title.length < 10) errs.push(`${w}: title missing`);
    if (strip(p.prompt).length < 30 || !/<b>[A-Z][a-z]+<\/b>/.test(p.prompt || '')) errs.push(`${w}: prompt needs a bold task verb (<b>Explain</b>, <b>Justify</b> ...)`);
    if (!Array.isArray(p.checklist) || p.checklist.length < 2 || p.checklist.length > 4) errs.push(`${w}: checklist has 2 to 4 rubric lines`);
    for (const c of p.checklist || []) if (strip(c).length < 25) errs.push(`${w}: checklist line "${c}" is too short to self-check against`);
    for (const k of ['earns', 'misses']) {
      if (!p[k] || strip(p[k].answer).length < 40 || strip(p[k].why).length < 40) errs.push(`${w}: ${k} needs an answer and a why (40+ characters each)`);
    }
    if (p.earns && p.misses && strip(p.earns.answer).length <= strip(p.misses.answer).length * 0.8) errs.push(`${w}: the answer that earns the point should be the fuller one`);
    const text = [p.title, p.context, p.prompt, ...(p.checklist || []), p.earns?.answer, p.earns?.why, p.misses?.answer, p.misses?.why,
      ...Object.values(p.specific?.slots || {}).flatMap(sl => [...(sl.options || []), ...Object.values(sl.why || {})])].join('\n');
    if (ctx.trademarkProblems) for (const x of ctx.trademarkProblems(text)) errs.push(`${w}: trademark: ${x}`);
    // The reader reports' top misses (framework.md section 7): a claim is a
    // statement, not a question; evidence names its source; reasoning links
    // the evidence to the claim.
    const earn = strip(p.earns?.answer || '');
    if (p.skill === 'claim' && /\?/.test(earn)) errs.push(`${w}: a claim that earns the point is a statement, not a question`);
    if (p.skill === 'evidence' && !/\bSource\s*[1-3]\b/.test(earn)) errs.push(`${w}: evidence that earns the point cites its source ("Source 2")`);
    if (p.skill === 'reasoning' && !/\b(because|this shows|which|so|suggests|supports|explains)\b/i.test(earn)) errs.push(`${w}: reasoning that earns the point links the evidence to the claim`);
    // The builder (spec section 6, "slot builders where the answer has
    // components"): every slot has 2 to 4 options, one correct, a label, and
    // a why for each wrong option naming the slip.
    if (p.specific) {
      const slots = p.specific.slots || {};
      if (Object.keys(slots).length < 2) errs.push(`${w}: the builder has ${Object.keys(slots).length} slot(s); it needs 2 or more`);
      for (const [k, sl] of Object.entries(slots)) {
        const n = (sl.options || []).length;
        if (!sl.label) errs.push(`${w}: builder slot ${k} needs a label`);
        if (n < 2 || n > 4 || !Number.isInteger(sl.correct) || sl.correct < 0 || sl.correct >= n) errs.push(`${w}: builder slot ${k} needs 2 to 4 options and a correct index`);
        for (let i = 0; i < n; i++) if (i !== sl.correct && !(sl.why && strip(sl.why[i]).length >= 15)) errs.push(`${w}: builder slot ${k} option ${i + 1} needs a why naming the slip`);
        if (new Set((sl.options || []).map(strip)).size !== n) errs.push(`${w}: builder slot ${k} repeats an option`);
      }
    }
    // A prompt is practised once its unit is done, so nothing taught after the
    // unit's last topic may appear (the ordering rule, at unit level).
    const last = map.topics.filter(x => x.chapter === p.unit).pop();
    if (t && last && ctx.scanPage) for (const x of ctx.scanPage(map, `<p>${text}</p>`, last.id)) errs.push(`${w}: ORDER: ${x}`);
  }
  return errs;
}

/* Every number in an exam-only item or a prompt, recomputed with ApPsychStats
   (the same code the graders use): the value, and where it must appear (an
   item's keyed option, or a prompt's text). Each entry is { id, key, starts?,
   also?, check? } for an item (also: distractor values recomputed from the
   slip they name, each one an option) and { id, has: [...], check? } for a
   prompt. */
const C = (fn, ...args) => Stats.evaluate({ fn, args });
// Form 1, set exam-1-s1: sleep onset means 31 (caffeine) and 14 (placebo) minutes.
const onset = { caf: 31, pla: 14 };
// Form 1, set exam-1-s2: words recalled out of 20.
const meaning = [14, 21, 9, 17, 14], letters = [6, 9, 5, 8, 7];
// Form 2, set exam-2-s2: stress symptoms in one week (Ben's 19 is the outlier).
const symptoms = [5, 19, 3, 2, 6, 3, 4];
export const EXAM_NUMBERS = [
  { id: 'psy-exam-1-04', key: `On average the caffeine group took ${C('sub', onset.caf, onset.pla)} minutes longer to fall asleep, a gap unlikely to be due to chance`,
    also: [`On average the placebo group took ${C('sub', onset.caf, onset.pla)} minutes longer to fall asleep, a gap unlikely to be due to chance`] },
  { id: 'psy-exam-1-05', key: `${C('mean', meaning)} words`, also: [`${C('median', meaning)} words`, `${C('sum', meaning)} words`, `${C('range', meaning)} words`] },
  { id: 'psy-exam-1-06', key: `${C('median', meaning)} words`, also: [`${C('mean', meaning)} words`, `${meaning[2]} words`, `${Math.max(...meaning)} words`] },
  { id: 'psy-exam-1-07', key: `The meaning group's scores were more spread out (range ${C('range', meaning)} versus ${C('range', letters)})`,
    also: [`The letters group's scores were more spread out (range ${C('range', letters)} versus ${C('range', meaning)})`], check: () => C('mean', meaning) > C('mean', letters) },
  { id: 'psy-exam-1-08', key: 'Deep processing: thinking about meaning led to better recall', check: () => C('mean', meaning) === 15 && C('mean', letters) === 7 },
  { id: 'psy-exam-1-14', key: `The ${C('percentileRule', C('z', 60, 50, 10))}th percentile`, also: [`The ${C('rulePct', 0, 1)}th percentile`, `The ${C('rulePct', -1, 1)}th percentile`] },
  { id: 'psy-exam-1-19', key: `About ${C('percentileRule', C('z', 130, 100, 15))}%`, also: [`About ${C('rulePct', -2, 2)}%`, `About ${C('rulePct', 2, null)}%`, `About ${C('rulePct', 0, 2)}%`] },
  { id: 'psy-exam-2-05', key: `${C('mean', symptoms)} symptoms`, also: [`${C('median', symptoms)} symptoms`, `${C('mode', symptoms)} symptoms`, `${C('sum', symptoms)} symptoms`] },
  { id: 'psy-exam-2-06', key: `${C('median', symptoms)} symptoms`, also: [`${C('mean', symptoms)} symptoms`, `${symptoms[3]} symptoms`, `${C('range', symptoms)} symptoms`] },
  { id: 'psy-exam-2-07', key: `The median, because Ben's ${Math.max(...symptoms)} symptoms pull the mean up`, check: () => C('mean', symptoms) > C('median', symptoms) && C('mode', symptoms) === 3 },
  { id: 'psy-exam-2-08', key: `${C('range', symptoms)} symptoms`, also: [`${Math.max(...symptoms)} symptoms`, `${C('mean', symptoms)} symptoms`, `${C('count', symptoms)} symptoms`] },
  { id: 'psy-exam-2-15', key: `About ${C('rulePct', C('z', 2900, 3400, 500), C('z', 3900, 3400, 500))}%`, also: [`About ${C('rulePct', 0, 1)}%`, `About ${C('rulePct', -2, 2)}%`, `About ${C('rulePct', null, 0)}%`] },
  { id: 'psy-exam-2-20', key: `Memory ${C('z', 80, 70, 5)} SD above; vocabulary ${C('z', 85, 80, 10)} SD above`,
    also: [`Memory ${C('sub', 80, 70)} SD above; vocabulary ${C('sub', 85, 80)} SD above`, `Memory ${C('z', 85, 80, 10)} SD above; vocabulary ${C('z', 80, 70, 5)} SD above`] },
];
export const JUSTIFY_NUMBERS = [];
/* items: Map(id -> item); prompts: list. Returns problems. */
export function checkNumbers(items, prompts) {
  const errs = [];
  for (const n of EXAM_NUMBERS) {
    const q = items.get(n.id);
    if (!q) { errs.push(`numbers: ${n.id} not found`); continue; }
    const key = strip(q.options[q.correct]);
    const ok = n.starts ? key.startsWith(n.key) : key === n.key;
    if (!ok) errs.push(`numbers: ${n.id} keys "${key}", the recomputed value is "${n.key}"`);
    if (n.check && !n.check()) errs.push(`numbers: ${n.id} fails its side condition`);
    if (q.options.filter(o => strip(o) === key).length !== 1) errs.push(`numbers: ${n.id} has its key twice`);
    for (const a of n.also || []) if (!q.options.some((o, i) => i !== q.correct && strip(o) === a)) errs.push(`numbers: ${n.id} should have the distractor "${a}" (the slip it names, recomputed)`);
  }
  const byId = new Map(prompts.map(p => [p.id, p]));
  for (const n of JUSTIFY_NUMBERS) {
    const p = byId.get(n.id);
    if (!p) { errs.push(`numbers: prompt ${n.id} not found`); continue; }
    const text = strip([p.context, p.prompt, ...(p.checklist || []), p.earns.answer].join(' '));
    for (const h of n.has) if (!text.includes(h)) errs.push(`numbers: prompt ${n.id} should show "${h}"`);
    if (n.check && !n.check()) errs.push(`numbers: prompt ${n.id} fails its side condition`);
  }
  return errs;
}
