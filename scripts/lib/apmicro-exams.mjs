/* AP® Microeconomics exams and the "Make it specific" trainer:
   loading, assembly and checks shared by the generator
   (scripts/build-apmicro.mjs), the content check (scripts/check-apmicro-content.mjs)
   and the tests (scripts/test/apmicro-exams.test.mjs). Formats:
   docs/apmicro-architecture.md, "Practice exams" and "Make it specific".
   Forked from AP® Psychology's (itself AP® Statistics').

     loadExams(dataDir)            { items, stimuli, forms, fifth } from data/exams/
     examVersion(q, fifth)         a bank question with the form's fifth option
     checkFifth(fifth, ctx)        problems with the fifth options
     loadJustify(dataDir, map)     every prompt, in course order
     unitRange(weight, n)          [min, max] questions a unit may have out of n
     checkForms(forms, ctx)        problems with the two fixed exams
     checkJustify(prompts, ctx)    problems with the trainer's prompts
     checkNumbers(items, prompts)  every number in an exam-only item or a
                                   prompt, recomputed here with ApMicroCalc
                                   (EXAM_NUMBERS and JUSTIFY_NUMBERS) */
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { Stats, Graph } from './apmicro-mathlib.mjs';

const readJson = p => JSON.parse(readFileSync(p, 'utf8'));
const strip = s => String(s ?? '').replace(/<\/?[A-Za-z!][^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

/* THE EXAM CONFIG, May 2027 (docs/apmicro-research/framework.md section 5;
   the same numbers as microeconomics/assets/pages/exams.js and cram.js, which
   scripts/test/apmicro-exams.test.mjs compares). Section I: 60
   multiple-choice questions in 70 minutes, 66% of the score; a four-function
   calculator allowed. Section II: 3 free-response questions in 60 minutes
   including a 10-minute reading period, 33% of the score: one long (10
   points) then two short (5 points each). Date: Tuesday 4 May 2027
   (assets/exam-date.js). */
export const MCQ_TOTAL = 60;
export const MCQ_PARTS = [{ key: '', n: 60, minutes: 70 }];
export const MCQ_WEIGHT = 66, FRQ_WEIGHT = 33;
// Answer choices per question: five, (A) to (E), as AP® Macroeconomics (spec
// section 2 and decision 5; needs-author mcq-options: the Micro exam pages do
// not state the number, and the CED exam section was not read). The practice bank keeps four options a
// question (BANK_OPTIONS, the content check); a form serves each bank
// question it uses with a fifth option of its own (data/exams/fifth.json,
// FIFTH below), so every question in a practice exam has five.
export const MCQ_OPTIONS = 5;
export const BANK_OPTIONS = 4;
/* Stimuli (needs-author mcq-sets, decided 2026-11-03): Section I questions
   stand alone. A graph, a data table or a short scenario belongs to one
   question, as in the CED's sample questions; no stimulus is shared by two
   questions in a form. EXAM_SETS bounds how many questions in a form carry
   each kind of stimulus (our estimate: College Board publishes no count). */
export const EXAM_SETS = { data: [2, 12], graph: [3, 10], text: [0, 8] };
export const EXAM_STIMULI = [8, 22];
// Exam-only questions per form (mic-exam-<form>-<nn>), where the bank is thin.
export const EXAM_ONLY = [8, 16];
export const FRQ_PARTS = [{ key: '', n: 3, minutes: 60, readingMinutes: 10 }];
export const FRQ_ORDER = ['long', 'short', 'short'];
export const FRQ_POINTS = { long: 10, short: 5 };
export const FRQ_TOTAL = 3;
export const EXAM_DATE = '2027-05-04';
// The trainer's free prompts: the first few in course order (spec section 6).
export const FREE_JUSTIFY = 3;
// Prompts per unit (about ten, as AP® Precalculus) and in the short graph
// skills chapter.
export const JUSTIFY_PER_CHAPTER = [8, 12];
export const JUSTIFY_PER_SKILLS_CHAPTER = [3, 6];
// "Make it specific" (spec section 3): the reader-report misses the trainer is
// built around (docs/apmicro-research/framework.md section 7), one per kind of
// FRQ task.
export const JUSTIFY_SKILLS = {
  graph: 'The right curve on the right graph, labeled, shifted the right way, with the new equilibrium compared with the old',
  marginal: 'The marginal rule stated with the numbers: MR = MC for output, MRP = MRC for hiring, MB = MC or MU per dollar for a consumer',
  price: 'Price read from the demand curve above the quantity where MR = MC, never from MR or MC',
  area: 'The right region named and bounded: consumer or producer surplus, tax revenue, subsidy cost, profit, deadweight loss',
  compare: 'A game theory claim with both comparisons from the matrix (dominant strategy, best response, Nash equilibrium)',
  longrun: 'The long-run chain with every link: profit or loss, entry or exit, market supply shifts, price returns to minimum ATC',
  derived: 'The derived-demand chain with every link: product demand, product price (MR), MRP, labor demand, wage and hiring',
  efficiency: 'Market quantity compared with the efficient quantity (MSB = MSC), with the deadweight loss and the corrective policy',
  calculate: 'A calculation with the formula or steps shown, not the answer alone',
  identify: 'An explicit statement of the concept, quantity or outcome asked for',
};
export function loadExams(dataDir) {
  const dir = join(dataDir, 'exams');
  if (!existsSync(join(dir, 'forms.json'))) return { items: [], stimuli: {}, forms: [], fifth: {} };
  const it = existsSync(join(dir, 'items.json')) ? readJson(join(dir, 'items.json')) : { items: [], stimuli: {} };
  const fifth = existsSync(join(dir, 'fifth.json')) ? readJson(join(dir, 'fifth.json')).options || {} : {};
  return { items: it.items || [], stimuli: it.stimuli || {}, forms: readJson(join(dir, 'forms.json')).forms || [], fifth };
}

/* A bank question as a form serves it: its four options and their
   explanations with the form's fifth option (data/exams/fifth.json:
   { option, why }) and its explanation put in at FIFTH_AT(id), a fixed
   position from the id, so the fifth is not always (E) and (E) is not the
   key only on exam-only questions. The key moves with its option; the page
   shuffles the options, but print and the review show this order. */
export function fifthAt(id) {
  let h = 0;
  for (const c of String(id)) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return h % MCQ_OPTIONS;
}
export function examVersion(q, fifth) {
  const f = fifth && fifth[q.id];
  if (!f) return q;
  const at = Math.min(fifthAt(q.id), q.options.length);
  const put = (a, x) => [...a.slice(0, at), x, ...a.slice(at)];
  const correct = Number.isInteger(q.correct) && q.correct >= at ? q.correct + 1 : q.correct;
  return { ...q, options: put(q.options, f.option), correct, why: { ...q.why, options: put((q.why || {}).options || [], f.why) } };
}

/* The fifth options: each one for a bank question a form uses, different
   from its four, explained (why names the slip, 25+ characters), and free of
   the absolute words the test-wise rule keeps out of distractors. */
export function checkFifth(fifth, ctx) {
  const errs = [], used = new Set((ctx.forms || []).flatMap(f => (f.mcq || []).flat()));
  for (const [id, f] of Object.entries(fifth || {})) {
    const q = ctx.bank.get(id), w = `fifth option for ${id}`;
    if (!q) { errs.push(`${w}: no such bank question`); continue; }
    if (!used.has(id)) errs.push(`${w}: the question is in no form`);
    if (!f || strip(f.option).length < 1) { errs.push(`${w}: option missing`); continue; }
    if (q.options.some(o => strip(o).toLowerCase() === strip(f.option).toLowerCase())) errs.push(`${w}: "${strip(f.option)}" repeats an option`);
    if (strip(f.why).length < 25) errs.push(`${w}: why needs to name the slip (25+ characters)`);
    if (/\b(always|never|only|all|none|every|completely|entirely|must|cannot)\b/i.test(strip(f.option))) errs.push(`${w}: an absolute word in a distractor gives it away`);
    if (q.fixed) errs.push(`${w}: ${id} keeps its options in order, so a fifth cannot be added`);
  }
  return errs;
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

/* ctx: { map, bank: Map(id -> item), examItems: Map(id -> item), stimuli(id) -> stimulus, frqs: { id: frq }, fifth?: { id: { option, why } }, lessonChecks?: Set(id) }.
   A form passes when Section I has exactly MCQ_TOTAL single-answer questions
   with MCQ_OPTIONS options each (a bank question's four plus its fifth);
   every question stands alone (one a block, none leaning on another, no
   stimulus shared by two questions in either form); they run in course
   order; the stimulus counts fall in EXAM_SETS and EXAM_STIMULI and the
   exam-only items in EXAM_ONLY; every unit sits inside its weight range of
   60 (and every practice inside its, once confirmed); no lesson check item;
   and Section II is 3 FRQs in the order long, short, short, worth 10, 5 and
   5 points, the long one with a graph part, no unit in two of them. No
   question or FRQ may be in both forms, and an exam-only item belongs to its
   own form. */
export function checkForms(forms, ctx) {
  const errs = [];
  const { map, bank, examItems, frqs } = ctx;
  const fifth = ctx.fifth || {};
  if (!Array.isArray(forms) || forms.length < 2) errs.push(`need at least 2 practice exams, found ${(forms || []).length}`);
  const seenQ = new Map(), seenF = new Map(), seenS = new Map();
  const units = map.chapters.filter(c => c.part === 'course');
  const pos = id => map.topics.findIndex(t => t.id === id);
  for (const [fi, f] of (forms || []).entries()) {
    const w = `${f.id || `form ${fi + 1}`}`;
    if (!f.id || !/^form-\d+$/.test(f.id)) errs.push(`${w}: id must be form-<n>`);
    if (!f.title) errs.push(`${w}: title missing`);
    const ids = (f.mcq || []).flat();
    if (ids.length !== MCQ_TOTAL) errs.push(`${w}: Section I has ${ids.length} questions, not ${MCQ_TOTAL}`);
    const count = {}, practice = {}, sets = {};
    let own = 0, stimN = 0, lastPos = -1;
    for (const [bi, block] of (f.mcq || []).entries()) {
      if (!Array.isArray(block) || !block.length) { errs.push(`${w}: block ${bi + 1} is empty`); continue; }
      // Section I questions stand alone (mcq-sets): one question a block.
      if (block.length > 1) errs.push(`${w}: block ${block.join(', ')} has ${block.length} questions; Section I questions stand alone, one a block`);
      const qs = block.map(id => bank.get(id) || examItems.get(id));
      block.forEach((id, k) => { if (!qs[k]) errs.push(`${w}: unknown question ${id}`); });
      if (qs.some(q => !q)) continue;
      for (const q of qs) {
        const mine = examItems.has(q.id);
        if (mine) own++;
        const n = (q.options || []).length + (!mine && fifth[q.id] ? 1 : 0);
        if (q.type !== 'single') errs.push(`${w}: ${q.id} is not a single-answer question`);
        else if (!mine && (q.options || []).length === BANK_OPTIONS && !fifth[q.id]) errs.push(`${w}: ${q.id} needs a fifth option (data/exams/fifth.json): every exam question has ${MCQ_OPTIONS}`);
        else if (n !== MCQ_OPTIONS) errs.push(`${w}: ${q.id} has ${n} options in the exam, not ${MCQ_OPTIONS}`);
        count[q.unit] = (count[q.unit] || 0) + 1;
        const pr = String(q.practice || '').split('.')[0];
        practice[pr] = (practice[pr] || 0) + 1;
        if (seenQ.has(q.id) && seenQ.get(q.id) !== w) errs.push(`${w}: ${q.id} is also in ${seenQ.get(q.id)}`);
        seenQ.set(q.id, w);
        const ownForm = /^mic-exam-(\d+)-\d+$/.exec(q.id);
        if (ownForm && `form-${ownForm[1]}` !== f.id) errs.push(`${w}: exam-only item ${q.id} belongs to form-${ownForm[1]}`);
        if (ctx.lessonChecks && ctx.lessonChecks.has(q.id)) errs.push(`${w}: ${q.id} is a lesson check item; use one a student has not met on a free lesson`);
        if (/\bprevious (question|set|calculation|item)\b|\bthe question before\b/i.test(strip(q.q))) errs.push(`${w}: ${q.id} leans on another question; Section I questions stand alone`);
        // Course order: the bank in course order (topic by topic), exam-only items in their topic's place.
        const p = pos(q.topic);
        if (p < lastPos) errs.push(`${w}: ${q.id} (${q.topic}) comes after a later topic; Section I runs in course order`);
        lastPos = Math.max(lastPos, p);
        const stim = q.stimulus || null;
        const st = stim && ctx.stimuli ? ctx.stimuli(stim) : null;
        if (stim) {
          stimN++;
          if (st && EXAM_SETS[st.kind]) sets[st.kind] = (sets[st.kind] || 0) + 1;
          if (seenS.has(stim)) errs.push(`${w}: ${q.id} shares stimulus ${stim} with ${seenS.get(stim)}; a stimulus carries one question in the exams`);
          else seenS.set(stim, q.id);
        }
      }
    }
    for (const [k, [lo, hi]] of Object.entries(EXAM_SETS)) if ((sets[k] || 0) < lo || (sets[k] || 0) > hi) errs.push(`${w}: Section I has ${sets[k] || 0} questions with a ${k} stimulus; a form has ${lo === hi ? lo : `${lo} to ${hi}`}`);
    if (stimN < EXAM_STIMULI[0] || stimN > EXAM_STIMULI[1]) errs.push(`${w}: ${stimN} questions carry a stimulus (${EXAM_STIMULI[0]} to ${EXAM_STIMULI[1]})`);
    if (examItems.size && (own < EXAM_ONLY[0] || own > EXAM_ONLY[1])) errs.push(`${w}: ${own} exam-only items (${EXAM_ONLY[0]} to ${EXAM_ONLY[1]})`);
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
    const frqUnits = new Map();
    fq.forEach((id, i) => {
      const q = frqs[id];
      if (!q) { errs.push(`${w}: unknown FRQ ${id}`); return; }
      if (q.type !== FRQ_ORDER[i]) errs.push(`${w}: Section II question ${i + 1} is a ${FRQ_ORDER[i]} question; ${id} is ${q.type}`);
      if (q.points !== FRQ_POINTS[q.type]) errs.push(`${w}: ${id} is worth ${q.points} points, not ${FRQ_POINTS[q.type]}`);
      if (q.placeholder) errs.push(`${w}: ${id} is a placeholder`);
      if (q.type === 'long' && !(q.parts || []).some(p => p.type === 'graph')) errs.push(`${w}: ${id} is the long question, so it has a graph part`);
      // The three questions cover different units, as the exam spreads them.
      for (const u of q.units || []) { if (frqUnits.has(u)) errs.push(`${w}: ${id} and ${frqUnits.get(u)} both cover ${u}; each FRQ in a form covers its own units`); else frqUnits.set(u, id); }
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
    // u<unit>-<words>; gs-<words> for the "Graph skills you need" chapter.
    if (!p.id || !(p.unit === 'graph-skills' ? /^gs-[a-z0-9-]+$/ : /^u[1-9]-[a-z0-9-]+$/).test(p.id)) errs.push(`${w}: id must be ${p.unit === 'graph-skills' ? 'gs' : 'u<unit>'}-<words>`);
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
    // The reader reports' top misses (framework.md section 7): a chain has its
    // links; a dominant-strategy claim makes both comparisons; hiring names MRP
    // and MRC; the monopoly price comes from demand.
    const earn = strip(p.earns?.answer || '');
    const links = (earn.match(/\b(so|which|because|then|causing|leads? to|raises?|lowers?|increases?|decreases?|shifts?)\b/gi) || []).length;
    if ((p.skill === 'longrun' || p.skill === 'derived') && links < 3) errs.push(`${w}: a chain that earns the point names at least three links ("so", "which raises", "then")`);
    if (p.skill === 'longrun' && !/\b(enter|entry|exit)\b/i.test(earn)) errs.push(`${w}: the long-run chain that earns the point names entry or exit`);
    if (p.skill === 'derived' && !/\bMRP\b|marginal revenue product/i.test(earn)) errs.push(`${w}: the derived-demand chain that earns the point names MRP`);
    if (p.skill === 'compare' && (earn.match(/\b\d+(\.\d+)?\s*(>|<|is (more|greater|less|larger|smaller) than|beats|instead of|versus|vs\.?|compared with)/gi) || []).length < 2) errs.push(`${w}: a game theory answer that earns the point makes both comparisons with the numbers ("8 > 6 ... and 5 > 3")`);
    if (p.skill === 'marginal' && !/\b(MR\s*=\s*MC|MRP\s*=\s*M[RF]C|MB\s*=\s*MC|per dollar|MU\s*\/\s*P)\b/i.test(earn)) errs.push(`${w}: a marginal answer that earns the point states the rule (MR = MC, MRP = MRC, MB = MC or MU per dollar)`);
    if (p.skill === 'price' && !/\bdemand\b/i.test(earn)) errs.push(`${w}: the price that earns the point is read from the demand curve`);
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

/* Every number in an exam-only item or a prompt, recomputed with ApMicroCalc
   (the same code the graders use): the value, and where it must appear (an
   item's keyed option, or a prompt's text). Each entry is { id, key, starts?,
   also?, check? } for an item (also: distractor values recomputed from the
   slip they name, each one an option) and { id, has: [...], check? } for a
   prompt. */
const C = (fn, ...args) => Stats.evaluate({ fn, args });
// Numbers as the options print them: thousands with commas, a fixed number of decimals.
const fmt = (v, d = 0) => Number(v.toFixed(d)).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
const pc = (v, d = 0) => `${fmt(v, d)}%`;
const usd = (v, d = 0) => `\\$${fmt(v, d)}`;
// Phase 0: no exam-only items or prompts yet. Phase 3 lists every recomputed
// number here, as AP® Macroeconomics does (scripts/lib/apmacro-exams.mjs).
export const EXAM_NUMBERS = [];
/* Every exam-only question that reads a graph: the stimulus as drawn
   (ApMicroGraph, the student's own renderer) must show what the key says:
   the curves that moved and which way, and the outcome on each axis. */
export const EXAM_GRAPHS = [];
/* stimuli: { id: stimulus }. Problems with the graphs exam-only keys read. */
export function checkGraphs(items, stimuli) {
  const errs = [];
  for (const g of EXAM_GRAPHS) {
    const q = items.get(g.id), st = q && stimuli[q.stimulus];
    if (!st || st.kind !== 'graph') { errs.push(`graphs: ${g.id} has no graph stimulus`); continue; }
    const spec = { ...st.graph, do: [] }, show = st.graph.show || {};
    const curves = Graph.curves(spec, {});
    const moved = Object.fromEntries(Object.entries(show).filter(([, v]) => v).map(([c, v]) => [c, Graph.dirWord(Graph.find(curves, c).shape, v)]));
    if (g.shifts && JSON.stringify(moved) !== JSON.stringify(g.shifts)) errs.push(`graphs: ${g.id}'s graph shows ${JSON.stringify(moved)}, the key reads ${JSON.stringify(g.shifts)}`);
    if (g.outcome) { const o = Graph.outcome(spec, show) || {}; for (const [k, v] of Object.entries(g.outcome)) if (o[k] !== v) errs.push(`graphs: ${g.id}: ${k} is ${o[k]} in the graph, the key reads ${v}`); }
    if (g.region) { const R = Graph.areas(spec).regions; if (!R[g.region]) errs.push(`graphs: ${g.id}'s graph has no region ${g.region}`); }
  }
  for (const q of items.values()) if (q.stimulus && stimuli[q.stimulus] && stimuli[q.stimulus].kind === 'graph' && !EXAM_GRAPHS.some(g => g.id === q.id)) errs.push(`graphs: ${q.id} reads a graph that EXAM_GRAPHS does not check`);
  return errs;
}
/* Every number a "Make it specific" prompt derives, recomputed: each `has`
   string must appear in the prompt's context, task, checklist or model
   answer, with the number from ApMicroCalc. Phase 0: none yet. */
export const JUSTIFY_NUMBERS = [];
export { C as calc, fmt, pc, usd };
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
