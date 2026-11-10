/* AP® Human Geography exams and the "Make it specific" trainer:
   loading, assembly and checks shared by the generator
   (scripts/build-aphug.mjs), the content check (scripts/check-aphug-content.mjs)
   and the tests (scripts/test/aphug-exams.test.mjs). Formats:
   docs/aphug-architecture.md, "Practice exams" and "Make it specific".
   Forked from AP® Psychology's.

     loadExams(dataDir)            { items, stimuli, forms } from data/exams/
     fifthAt(id), examVersion(q, fifth)  a bank question as a form serves it,
                                   with the form's fifth option put in place
     servedForm(f, ctx)            a form's 60 questions as served (five options)
     checkFifth(forms, ctx)        problems with the forms' fifth options
     keyRisks(q, stimulus)         a key that hinges on a disputed place or a
                                   figure that goes stale
     checkReads(items, stimuli)    every map, pyramid and table read in an
                                   exam-only item, recomputed from its data
                                   (EXAM_READS)
     loadJustify(dataDir, map)     every prompt, in course order
     unitRange(weight, n)          [min, max] questions a unit may have out of n
     MCQ_PARTS, MCQ_OPTIONS, EXAM_SETS, FRQ_PARTS, FRQ_ORDER, FRQ_TYPES,
     FRQ_STIMULI, FRQ_LABELS, VERBS  the May 2027 format (framework.md section 5)
     checkForms(forms, ctx)        problems with the two fixed exams
     checkJustify(prompts, ctx)    problems with the trainer's prompts
     checkNumbers(items, prompts)  every number in an exam-only item or a
                                   prompt, recomputed here with ApHugCalc
                                   (EXAM_NUMBERS and JUSTIFY_NUMBERS) */
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { Calc } from './aphug-mathlib.mjs';

const readJson = p => JSON.parse(readFileSync(p, 'utf8'));
const strip = s => String(s ?? '').replace(/<\/?[A-Za-z!][^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

export const MCQ_TOTAL = 60;
// Section I as the May 2027 exam: one part, 60 questions in 60 minutes, 50% of
// the score, no calculator; about 30-40% with a stimulus, some in sets
// (framework.md section 5). Five options (A-E) on the exam forms, four in the
// bank (as AP® Macroeconomics; needs-author mcq-options). The official set
// counts are not published, so the forms hold 1 to 4 map sets, 1 to 4 data
// sets, 0 to 3 image sets and 0 to 3 text sets until a person confirms them
// (docs/aphug-needs-author.md, mcq-sets).
export const MCQ_PARTS = [{ key: '', n: 60, minutes: 60 }];
export const MCQ_OPTIONS = { form: 5, bank: 4 };
export const EXAM_SETS = { map: [1, 4], data: [1, 4], image: [0, 3], text: [0, 3] };
// Questions with a stimulus in a form: about 30 to 40 percent (framework.md
// section 5), so 18 to 24 of 60.
export const EXAM_STIMULI = [0.3, 0.4];
// Exam-only questions per form (data/exams/items.json, hug-exam-<form>-<nn>):
// enough to carry the stimuli the bank has no whole set for and the reader
// report traps, the rest reviewed bank questions with a fifth option.
export const EXAM_ONLY = [6, 16];
// Section II: 3 questions in 75 minutes, 7 points each (one per part A-G),
// 50% of the score, in this order: no stimulus, one stimulus, two stimuli.
export const FRQ_PARTS = [{ key: '', n: 3, minutes: 75 }];
export const FRQ_ORDER = ['none', 'one', 'two'];
export const FRQ_TYPES = { none: 'Q1: No stimulus', one: 'Q2: One stimulus', two: 'Q3: Two stimuli' };
export const FRQ_STIMULI = { none: 0, one: 1, two: 2 };
export const FRQ_LABELS = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
export const FRQ_POINTS = 7;
export const FRQ_TOTAL = 3;
// The task verbs (CED exam section, our words; framework.md section 4) and
// what each demands for its point. Every FRQ part names one; the FRQ page
// shows the demand beside the prompt.
export const VERBS = {
  identify: { name: 'Identify', demand: 'Give the information asked for: a word or short phrase can earn the point, with no reasons needed.' },
  define: { name: 'Define', demand: 'Give the specific meaning of the term, in your own words, not an example of it.' },
  describe: { name: 'Describe', demand: 'Give the relevant characteristics: what it is like, where and how much. A name alone earns nothing.' },
  explain: { name: 'Explain', demand: 'Say how or why, with every link of the chain: a cause, then because or so, then its effect, tied to the place or data asked about.' },
  compare: { name: 'Compare', demand: 'Give a similarity or a difference and say it about both things, not one.' },
  'explain-degree': { name: 'Explain the degree', demand: 'State the degree first (to a high, moderate or low degree), then explain why with evidence.' },
};
// The trainer's free prompts: the first few in course order (spec section 6).
export const FREE_JUSTIFY = 3;
// Prompts per unit and in the skills chapter.
export const JUSTIFY_PER_CHAPTER = [8, 12];
export const JUSTIFY_PER_SKILLS_CHAPTER = [3, 6];
// "Make it specific" (spec section 7): the reader-report misses the trainer
// is built around (docs/aphug-research/framework.md section 7), one per task
// verb demand and the specifics readers ask for.
export const JUSTIFY_SKILLS = {
  describe: 'Characteristics, not a name: what the pattern or process is like, where, and how much',
  explain: 'A cause and its effect with every link: because, so, therefore',
  compare: 'Both sides of the comparison, in one sentence each or one sentence for both',
  degree: 'A stated degree (high, moderate, low), then the evidence for it',
  place: 'A named real place, region or country, not "some countries"',
  scale: 'The scale of analysis named and used: the scale of the data, not the size of the map',
  limitation: 'What the source cannot show, and why',
  model: 'How well a named model fits this case, with one limit of the model',
  legend: 'Read the legend: the class, the unit and what each shade or symbol stands for, before you say what the map shows',
};

export function loadExams(dataDir) {
  const dir = join(dataDir, 'exams');
  if (!existsSync(join(dir, 'forms.json'))) return { items: [], stimuli: {}, forms: [] };
  const it = existsSync(join(dir, 'items.json')) ? readJson(join(dir, 'items.json')) : { items: [], stimuli: {} };
  return { items: it.items || [], stimuli: it.stimuli || {}, forms: readJson(join(dir, 'forms.json')).forms || [] };
}

/* A bank question as a form serves it: its four options and their
   explanations with the form's fifth option (f.fifth[id] = { text, why })
   put in at fifthAt(id), a fixed position from the id, so the fifth is not
   always (E) and the key is not kept off (E). The key moves with its
   option. The page shuffles options; print and the review show this order. */
export function fifthAt(id) {
  let h = 0;
  for (const c of String(id)) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return h % MCQ_OPTIONS.form;
}
export function examVersion(q, fifth) {
  const f = fifth && fifth[q.id];
  if (!f || !Array.isArray(q.options)) return q;
  const at = Math.min(fifthAt(q.id), q.options.length);
  const put = (a, x) => [...a.slice(0, at), x, ...a.slice(at)];
  const correct = Number.isInteger(q.correct) && q.correct >= at ? q.correct + 1 : q.correct;
  return { ...q, options: put(q.options, f.text), correct, why: { ...q.why, options: put((q.why || {}).options || [], f.why) } };
}
/* ctx: { bank: Map, examItems: Map }. The form's questions in order, as served. */
export function servedForm(f, ctx) {
  return (f.mcq || []).flat().map(id => ctx.examItems.get(id) || (ctx.bank.get(id) && examVersion(ctx.bank.get(id), f.fifth))).filter(Boolean);
}
/* The fifth options: one for each bank question of the form and none for
   anything else; new text (not one of the four), a why that names the slip,
   and never on a fixed item (its order is the content). */
export function checkFifth(forms, ctx) {
  const errs = [];
  for (const f of forms || []) {
    const ids = new Set((f.mcq || []).flat());
    for (const id of ids) if (ctx.bank.has(id) && !(f.fifth && f.fifth[id])) errs.push(`${f.id}: ${id} needs a fifth option in the form's fifth map: every exam question has ${MCQ_OPTIONS.form}`);
    for (const [id, x] of Object.entries(f.fifth || {})) {
      const q = ctx.bank.get(id), w = `${f.id}: fifth option for ${id}`;
      if (!ids.has(id)) { errs.push(`${w}: ${id} is not in this form`); continue; }
      if (!q) { errs.push(`${w}: only a bank question gets a fifth (an exam-only one has five)`); continue; }
      if (q.fixed) errs.push(`${w}: ${id} keeps its options in order, so a fifth cannot be added`);
      if (!x || strip(x.text).length < 1) { errs.push(`${w}: text missing`); continue; }
      if (strip(x.why).length < 15) errs.push(`${w}: needs a why that names the slip (15+ characters)`);
      const t = strip(x.text).toLowerCase();
      if ((q.options || []).some(o => strip(o).toLowerCase() === t)) errs.push(`${w}: repeats one of the four options`);
    }
  }
  return errs;
}
/* A key that hinges on a disputed place (accuracy-risks.md section 4) or on
   a real figure that goes stale (a share, a count or a rank with no
   stimulus to read it from, or read from undated data). Historical years
   are fine; numbers recomputed from an invented stimulus or the stem are too. */
export const DISPUTED_KEY = /\b(Taiwan|Kosovo|Western Sahara|Palestin\w*|Crimea|Kashmir|Falkland|Malvinas|Somaliland|Northern Cyprus|Gaza|West Bank|Spratly|Paracel|Golan)\b/i;
const FIGURE = /\d[\d,.]*\s*(%|percent|million|billion|thousand|people|members|countries|states)\b/i;
export function keyRisks(q, stim) {
  const out = [];
  const key = strip((q.options || [])[q.correct]);
  if (DISPUTED_KEY.test(key)) out.push(`${q.id}: the key names a disputed place ("${key.match(DISPUTED_KEY)[0]}"); no answer may depend on a disputed status`);
  if (FIGURE.test(key)) {
    const invented = stim && (stim.invented || (stim.map && stim.map.invented));
    const dated = stim && /\b(19|20)\d\d\b/.test(String(stim.source || (stim.map && stim.map.source) || ''));
    const own = /\binvented\b/i.test(q.q || '');
    if (!invented && !dated && !own) out.push(`${q.id}: the key is a figure ("${key}") with no invented or dated data to read it from: it goes stale`);
  }
  return out;
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

/* ctx: { map, bank: Map(id -> item), examItems: Map(id -> item), stimuli(id) -> stimulus, frqs: { id: frq }, orderOf(id), lessonChecks?: Set(id) }.
   A form passes when Section I has exactly 60 single-answer questions of
   five options (MCQ_OPTIONS.form: an exam-only item, or a bank item given a
   fifth option in the form's `fifth` map); each block is a whole stimulus set
   in authored order (or one standalone question); its sets fall in
   EXAM_SETS (map, data, image, text); every unit sits inside its weight
   range of 60 and every practice inside its; and Section II is 3 FRQs in
   the order none, one, two, 7 points each, that exist. No question or
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
        const nOpt = (q.options || []).length + (f.fifth && f.fifth[q.id] ? 1 : 0);
        if (q.type !== 'single' || nOpt !== MCQ_OPTIONS.form) errs.push(`${w}: ${q.id} is not a ${MCQ_OPTIONS.form}-option single-answer question (a bank item needs its fifth option in the form's fifth map)`);
        count[q.unit] = (count[q.unit] || 0) + 1;
        const pr = String(q.practice || '').split('.')[0];
        practice[pr] = (practice[pr] || 0) + 1;
        if (seenQ.has(q.id) && seenQ.get(q.id) !== w) errs.push(`${w}: ${q.id} is also in ${seenQ.get(q.id)}`);
        seenQ.set(q.id, w);
        const own = /^hug-exam-(\d+)-\d+$/.exec(q.id);
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
      // A set is whole: every exam-eligible item of its stimulus (four-option
      // single answer, not a lesson check item a student met on a free lesson)
      // is in the block.
      if (stim && (qs.length > 1 || !examItems.has(qs[0].id))) {
        const left = [...bank.values(), ...examItems.values()].filter(q => q.stimulus === stim && !block.includes(q.id) &&
          q.type === 'single' && (q.options || []).length >= MCQ_OPTIONS.bank && !(ctx.lessonChecks && ctx.lessonChecks.has(q.id)));
        if (left.length) errs.push(`${w}: set ${stim} leaves out ${left.map(q => q.id).join(', ')}; a set in a form includes every one of its usable questions`);
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
    // Each FRQ from different units: no unit in two FRQs of a form.
    const fu = fq.flatMap(id => (frqs[id] || {}).units || []);
    for (const u of new Set(fu.filter((u, i) => fu.indexOf(u) !== i))) errs.push(`${w}: ${u} is in two of the form's FRQs; each FRQ comes from different units`);
    // About 30 to 40 percent of Section I with a stimulus.
    const withStim = ids.map(id => bank.get(id) || examItems.get(id)).filter(q => q && q.stimulus).length;
    const [slo, shi] = EXAM_STIMULI.map((x, i) => i ? Math.floor(x * MCQ_TOTAL + 1e-9) : Math.ceil(x * MCQ_TOTAL - 1e-9));
    if (withStim < slo || withStim > shi) errs.push(`${w}: ${withStim} questions have a stimulus; the exam has about ${EXAM_STIMULI[0] * 100} to ${EXAM_STIMULI[1] * 100}% (${slo} to ${shi} of ${MCQ_TOTAL})`);
    const own = ids.filter(id => examItems.has(id)).length;
    if (own < EXAM_ONLY[0] || own > EXAM_ONLY[1]) errs.push(`${w}: ${own} exam-only questions (${EXAM_ONLY[0]} to ${EXAM_ONLY[1]})`);
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
    // u<unit>-<words>; gs-<words> for the "Skills you need" chapter.
    if (!p.id || !(p.unit === 'geo-skills' ? /^gs-[a-z0-9-]+$/ : /^u[1-9]-[a-z0-9-]+$/).test(p.id)) errs.push(`${w}: id must be ${p.unit === 'geo-skills' ? 'gs' : 'u<unit>'}-<words>`);
    if (ids.has(p.id)) errs.push(`${w}: duplicate id`); ids.add(p.id);
    const t = map.topicById(p.topic);
    if (!t) errs.push(`${w}: unknown topic "${p.topic}"`);
    else if (t.chapter !== p.unit) errs.push(`${w}: topic ${p.topic} is in ${t.chapter}, not ${p.unit}`);
    if (p.file && p.file !== `${p.unit}.json`) errs.push(`${w}: lives in ${p.file}; a prompt goes in its unit's file`);
    if (!/^[1-5]\.[A-F]$/.test(p.practice || '')) errs.push(`${w}: practice must be a skill id like "2.B"`);
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
    // The reader reports' top misses (framework.md section 7): an explain
    // has its because, a compare speaks of both, a degree is stated, a place
    // is named.
    const earn = strip(p.earns?.answer || '');
    if (p.skill === 'explain' && !/\b(because|so|therefore|which (means|leads|causes)|as a result|this (leads|causes|means))\b/i.test(earn)) errs.push(`${w}: an explanation that earns the point carries its link (because, so, therefore)`);
    if (p.skill === 'degree' && !/\b(high|moderate|low|great|small|large|limited|significant)\s+(degree|extent)\b/i.test(earn)) errs.push(`${w}: an answer that earns a degree point states the degree first ("to a high degree")`);
    if (p.skill === 'compare' && !/\b(both|whereas|while|but|than|unlike|similarly|in contrast)\b/i.test(earn)) errs.push(`${w}: a comparison that earns the point speaks of both sides (whereas, both, than)`);
    if (p.skill === 'scale' && !/\b(global|regional|national|local)\s+scale\b/i.test(earn)) errs.push(`${w}: a scale answer names the scale of analysis ("national scale")`);
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

/* Every number in an exam-only item or a prompt, recomputed with ApHugCalc
   (the same code the graders use): the value, and where it must appear (an
   item's keyed option, or a prompt's text). Each entry is { id, key, starts?,
   also?, check? } for an item (also: distractor values recomputed from the
   slip they name, each one an option) and { id, has: [...], check? } for a
   prompt. */
const C = (fn, ...args) => Calc.evaluate({ fn, args });
// "About 400,000" style: whole numbers with thousands commas.
const about = (n, unit = '') => `About ${Number(Math.round(n * 10) / 10).toLocaleString('en-US')}${unit}`;
export const EXAM_NUMBERS = [
  // Physiological density: people per unit of arable land; the arithmetic density slip and the factor of 10.
  { id: 'hug-exam-1-05', key: `${C('physiologicalDensity', 40000000, 20000).toLocaleString('en-US')} people per square kilometer of arable land`,
    also: [`${C('arithmeticDensity', 40000000, 400000)} people per square kilometer of total land`, `${C('div', C('physiologicalDensity', 40000000, 20000), 10)} people per square kilometer of arable land`] },
  // Doubling time by the rule of 70 from RNI = (CBR - CDR) / 10, and its slips.
  { id: 'hug-exam-2-02', key: about(C('doublingTime', C('rni', 32, 7)), ' years'),
    also: [about(C('div', 70, C('sub', 32, 7)), ' years'), about(C('sub', 32, 7), ' years'), about(C('round', C('div', 70, C('div', 32, 10)), 0), ' years'), about(70, ' years')] },
  // Comparative advantage: a shirt costs K 4/20 phones and L 10/30 phones.
  { id: 'hug-exam-2-08', key: 'Country K, because each shirt costs it fewer phones', check: () => C('div', 4, 20) < C('div', 10, 30) },
];
export const JUSTIFY_NUMBERS = [
  // The rank-size rule's second city for Lima (about 9.5 million, INEI 2017): half of it.
  { id: 'u6-model-lima', has: [`about ${C('div', C('rankSize', 9500000, 2), 1000000)} million`] },
  // Internet access in Province X: 30% to 75% is 45 points and two and a half times.
  { id: 'gs-read-the-classes', has: [`${C('sub', 75, 30)} percentage points`], check: () => C('div', 75, 30) === 2.5 },
];

/* Every map, pyramid and table read in an exam-only item, checked against
   the stimulus it reads: read(stimulus) gives the key (and also the
   distractors the slips predict), from the data, never typed by hand. */
const sumOf = a => C('sum', a);
const symbolsDesc = s => s.map.symbols.items.map(x => x.value).sort((a, b) => b - a);
export const EXAM_READS = [
  // The scale of analysis is the scale of the data: one value per province of Country A is local (subnational).
  { id: 'hug-exam-1-01', read: s => s.map.base === 'country-a' && Object.keys(s.map.values).length === 8 ? 'Local (subnational), because each value is for one province' : 'not provincial data' },
  // Under 15: the three youngest groups on both sides.
  { id: 'hug-exam-1-02', read: s => about(C('round', sumOf([...s.plot.left.slice(0, 3), ...s.plot.right.slice(0, 3)]), 0), '%'),
    also: s => [about(C('round', sumOf(s.plot.left.slice(0, 3)), 0), '%'), about(C('round', C('add', s.plot.left[0], s.plot.right[0]), 0), '%'),
      about(C('round', sumOf([...s.plot.left.slice(3, 13), ...s.plot.right.slice(3, 13)]), 0), '%'), about(C('round', sumOf([...s.plot.left.slice(13), ...s.plot.right.slice(13)]), 0), '%')],
    check: s => Math.abs(sumOf([...s.plot.left, ...s.plot.right]) - 100) < 1e-6 },
  // Rank-size from the map's largest city (thousands), and the slips.
  { id: 'hug-exam-1-03', read: s => about(C('rankSize', symbolsDesc(s)[0] * 1000, 3)),
    also: s => [about(C('rankSize', symbolsDesc(s)[0] * 1000, 2)), about(symbolsDesc(s)[2] * 1000), about(C('round', C('div', symbolsDesc(s)[0] * 1000, 9), -3)), about(C('rankSize', symbolsDesc(s)[0] * 1000, 4))] },
  // A primate city: the largest more than four (and under five) times the second.
  { id: 'hug-exam-1-04', read: s => { const v = symbolsDesc(s), r = C('div', v[0], v[1]); return r > 4 && r < 5 ? 'It has a primate city: the largest is more than four times the second' : `ratio ${r}`; } },
  // The keyed mark sits in the Strait of Hormuz (about 56.4° E, 26.6° N), and no other mark does.
  { id: 'hug-exam-2-05', read: s => { const m = s.map.marks.filter(x => x.at[0] > 55.5 && x.at[0] < 57.5 && x.at[1] > 25.5 && x.at[1] < 27.5); return m.length === 1 ? m[0].text : `${m.length} marks in the strait`; } },
];
/* items: Map(id -> item); stimuli: { id: stimulus }. Returns problems. */
export function checkReads(items, stimuli) {
  const errs = [];
  for (const r of EXAM_READS) {
    const q = items.get(r.id);
    if (!q) { errs.push(`reads: ${r.id} not found`); continue; }
    const s = stimuli[q.stimulus];
    if (!s) { errs.push(`reads: ${r.id} has no stimulus`); continue; }
    const key = strip(q.options[q.correct]), want = r.read(s);
    if (key !== want) errs.push(`reads: ${r.id} keys "${key}"; its ${s.kind} gives "${want}"`);
    if (r.check && !r.check(s)) errs.push(`reads: ${r.id}: its ${s.kind} fails its side condition`);
    for (const a of r.also ? r.also(s) : []) if (!q.options.some((o, i) => i !== q.correct && strip(o) === a)) errs.push(`reads: ${r.id} should have the distractor "${a}" (the slip, read from the data)`);
  }
  // Every exam-only item that reads a map or a data figure has its read checked here.
  for (const q of items.values()) if (q.stimulus && stimuli[q.stimulus] && ['map', 'data'].includes(stimuli[q.stimulus].kind) && !EXAM_READS.some(r => r.id === q.id)) errs.push(`reads: ${q.id} reads a ${stimuli[q.stimulus].kind} that EXAM_READS does not check`);
  return errs;
}
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
