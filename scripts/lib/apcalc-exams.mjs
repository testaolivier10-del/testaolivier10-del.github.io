/* AP® Calculus AB exams and the justification trainer: loading, assembly and
   checks shared by the generator (scripts/build-apcalc.mjs), the content
   check (scripts/check-apcalc-content.mjs) and the tests
   (scripts/test/apcalc-exams.test.mjs). Formats: docs/apcalc-architecture.md,
   "Practice exams" and "Justification trainer".

     loadExams(dataDir)            { items, stimuli, forms } from data/exams/
     loadJustify(dataDir, map)     every prompt, in course order
     unitRange(weight, n)          [min, max] questions a unit may have out of n
     checkForms(forms, ctx)        problems with the two fixed exams
     checkJustify(prompts, ctx)    problems with the trainer's prompts
     checkNumbers()                every number in an exam-only item or a
                                   prompt, recomputed here (EXAM_NUMBERS) */
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const readJson = p => JSON.parse(readFileSync(p, 'utf8'));
const strip = s => String(s ?? '').replace(/<\/?[A-Za-z!][^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

export const MCQ_TOTAL = 42;
// Section I as the May 2027 exam: Part A without a calculator, Part B with one.
export const MCQ_PARTS = [{ key: 'A', n: 29, minutes: 62, calc: false }, { key: 'B', n: 13, minutes: 38, calc: true }];
// Section II: Part A, 2 questions with a calculator; Part B, 4 without; 9 points each.
export const FRQ_PARTS = [{ key: 'A', n: 2, minutes: 30, calc: true }, { key: 'B', n: 4, minutes: 60, calc: false }];
export const FRQ_POINTS = 9;
export const FRQ_TOTAL = 6;
// The trainer's free prompts: the first few in course order (spec section 3).
export const FREE_JUSTIFY = 3;
// The reader-report misses the trainer is built around (framework.md section 8).
export const JUSTIFY_SKILLS = {
  theorems: 'Name the theorem and check its hypotheses (IVT, MVT, EVT)',
  limits: 'Limits, continuity and L\'Hospital\'s rule',
  extrema: 'Local and global extrema: sign changes and the candidates test',
  behavior: 'Increasing, decreasing and concavity, from the right function',
  accumulation: 'Accumulation functions and the Fundamental Theorem',
  motion: 'Motion: direction, speeding up, displacement and distance',
  context: 'Meaning in context, with units and the interval',
  de: 'Differential equations and slope fields',
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

/* A unit's share of Section I, from its exam weight range in percent:
   floor of the low end to ceiling of the high end, so 5-10% of 42 is 2 to 5,
   10-15% is 4 to 7 and 15-20% is 6 to 9. */
export function unitRange(weight, n = MCQ_TOTAL) {
  return [Math.floor(weight[0] / 100 * n + 1e-9), Math.ceil(weight[1] / 100 * n - 1e-9)];
}

/* ctx: { map, bank: Map(id -> item), examItems: Map(id -> item), frqs: { id: frq }, orderOf(id) }.
   A form passes when Section I has exactly 42 four-option single-answer
   questions, the 29 no-calculator ones (Part A) before the 13 calculator
   ones (Part B); each block is a whole stimulus set in authored order (or
   one standalone question) and never mixes the parts; every unit sits
   inside its weight range of 42; and Section II is 2 calculator FRQs then 4
   no-calculator FRQs, 9 points each, that exist, with no type more than
   twice. No question or FRQ may be in both forms, and an exam-only item
   belongs to its own form. */
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
    const count = {}, calcSeq = [];
    for (const [bi, block] of (f.mcq || []).entries()) {
      if (!Array.isArray(block) || !block.length) { errs.push(`${w}: block ${bi + 1} is empty`); continue; }
      const qs = block.map(id => bank.get(id) || examItems.get(id));
      block.forEach((id, k) => { if (!qs[k]) errs.push(`${w}: unknown question ${id}`); });
      if (qs.some(q => !q)) continue;
      for (const q of qs) {
        if (q.type !== 'single' || (q.options || []).length !== 4) errs.push(`${w}: ${q.id} is not a four-option single-answer question`);
        if (String(q.practice).startsWith('4.')) errs.push(`${w}: ${q.id} is tagged practice 4 (Communication and Notation), which multiple choice does not assess`);
        count[q.unit] = (count[q.unit] || 0) + 1;
        calcSeq.push(!!q.calc);
        if (seenQ.has(q.id) && seenQ.get(q.id) !== w) errs.push(`${w}: ${q.id} is also in ${seenQ.get(q.id)}`);
        seenQ.set(q.id, w);
        const own = /^calc-exam-(\d+)-\d+$/.exec(q.id);
        if (own && `form-${own[1]}` !== f.id) errs.push(`${w}: exam-only item ${q.id} belongs to form-${own[1]}`);
      }
      if (qs.some(q => !!q.calc !== !!qs[0].calc)) errs.push(`${w}: block ${block.join(', ')} mixes calculator and no-calculator questions`);
      const stim = qs[0].stimulus || null;
      if (qs.length === 1 && stim && !examItems.has(qs[0].id)) errs.push(`${w}: ${qs[0].id} needs its stimulus, so it goes in a block with the rest of its set`);
      if (qs.length > 1) {
        if (!stim || qs.some(q => q.stimulus !== stim)) errs.push(`${w}: block ${block.join(', ')} mixes stimuli; a block is one set or one question`);
        if (qs.length < 2 || qs.length > 5) errs.push(`${w}: set ${stim} has ${qs.length} questions in the exam (2 to 5)`);
        const order = qs.map(q => ctx.orderOf(q.id));
        if (order.some((x, i) => i && x <= order[i - 1])) errs.push(`${w}: set ${stim} is not in authored order`);
      }
    }
    // The parts: 29 without a calculator, then 13 with one.
    const nA = calcSeq.filter(c => !c).length, nB = calcSeq.length - nA;
    if (nA !== MCQ_PARTS[0].n || nB !== MCQ_PARTS[1].n) errs.push(`${w}: Section I has ${nA} no-calculator and ${nB} calculator questions; Part A is ${MCQ_PARTS[0].n} and Part B ${MCQ_PARTS[1].n}`);
    if (calcSeq.some((c, i) => i && calcSeq[i - 1] && !c)) errs.push(`${w}: Part A (no calculator) comes before Part B (calculator); a no-calculator question follows a calculator one`);
    for (const u of units) {
      const [lo, hi] = unitRange(u.weight);
      const n = count[u.id] || 0;
      if (n < lo || n > hi) errs.push(`${w}: Unit ${u.n} has ${n} questions; its ${u.weight[0]}-${u.weight[1]}% weight allows ${lo} to ${hi}`);
    }
    for (const u of Object.keys(count)) if (!units.some(x => x.id === u)) errs.push(`${w}: questions from ${u}, which is not a course unit`);
    const fq = f.frq || [];
    if (fq.length !== FRQ_TOTAL) errs.push(`${w}: Section II has ${fq.length} questions, not ${FRQ_TOTAL}`);
    const types = {};
    fq.forEach((id, i) => {
      const q = frqs[id];
      if (!q) { errs.push(`${w}: unknown FRQ ${id}`); return; }
      const wantCalc = i < FRQ_PARTS[0].n;
      if (!!q.calc !== wantCalc) errs.push(`${w}: Section II question ${i + 1} is in Part ${wantCalc ? 'A (calculator)' : 'B (no calculator)'}; ${id} is a ${q.calc ? 'calculator' : 'no-calculator'} question`);
      if (q.points !== FRQ_POINTS) errs.push(`${w}: ${id} is worth ${q.points} points, not ${FRQ_POINTS}`);
      types[q.type] = (types[q.type] || 0) + 1;
      if (q.placeholder) errs.push(`${w}: ${id} is a placeholder`);
      if (seenF.has(id) && seenF.get(id) !== w) errs.push(`${w}: FRQ ${id} is also in ${seenF.get(id)}`);
      seenF.set(id, w);
    });
    for (const [t, n] of Object.entries(types)) if (n > 2) errs.push(`${w}: Section II has ${n} questions of type ${t} (at most 2)`);
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
    if (!/^[1-4]\.[A-G]$/.test(p.practice || '')) errs.push(`${w}: practice must be a skill id like "3.C"`);
    if (!JUSTIFY_SKILLS[p.skill]) errs.push(`${w}: skill must be one of ${Object.keys(JUSTIFY_SKILLS).join(', ')}`);
    if (!p.title || p.title.length < 10) errs.push(`${w}: title missing`);
    if (strip(p.prompt).length < 30 || !/<b>[A-Z][a-z]+<\/b>/.test(p.prompt || '')) errs.push(`${w}: prompt needs a bold task verb (<b>Explain</b>, <b>Justify</b> ...)`);
    if (!Array.isArray(p.checklist) || p.checklist.length < 2 || p.checklist.length > 4) errs.push(`${w}: checklist has 2 to 4 rubric lines`);
    for (const c of p.checklist || []) if (strip(c).length < 25) errs.push(`${w}: checklist line "${c}" is too short to self-check against`);
    for (const k of ['earns', 'misses']) {
      if (!p[k] || strip(p[k].answer).length < 40 || strip(p[k].why).length < 40) errs.push(`${w}: ${k} needs an answer and a why (40+ characters each)`);
    }
    if (p.earns && p.misses && strip(p.earns.answer).length <= strip(p.misses.answer).length * 0.8) errs.push(`${w}: the answer that earns the point should be the fuller one`);
    const text = [p.title, p.context, p.prompt, ...(p.checklist || []), p.earns?.answer, p.earns?.why, p.misses?.answer, p.misses?.why].join('\n');
    if (ctx.trademarkProblems) for (const x of ctx.trademarkProblems(text)) errs.push(`${w}: trademark: ${x}`);
    // The reader reports' top miss: a theorem used without its hypotheses.
    if (/\b(Intermediate|Mean|Extreme) Value Theorem\b/.test(strip(p.earns?.answer || '')) && !/continuous/i.test(strip(p.earns?.answer || ''))) errs.push(`${w}: the model answer names a value theorem but never says the function is continuous; check the hypotheses`);
    // A prompt is practised once its unit is done, so nothing taught after the
    // unit's last topic may appear (the ordering rule, at unit level).
    const last = map.topics.filter(x => x.chapter === p.unit).pop();
    if (t && last && ctx.scanPage) for (const x of ctx.scanPage(map, `<p>${text}</p>`, last.id)) errs.push(`${w}: ORDER: ${x}`);
  }
  return errs;
}

/* Every number in an exam-only item or a prompt, recomputed: the value, and
   where it must appear (an item's keyed option, or a prompt's text). Each
   entry is { id, key, starts?, check? } for an item and { id, has: [...] }
   for a prompt. Phase 3 fills both lists as the forms and prompts are
   written; calculus keys can also be recomputed with ApCalcMath (integral,
   deriv, root) from scripts/lib/apcalc-tool-checks/_shared.mjs. */
export const EXAM_NUMBERS = [];
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
  }
  const byId = new Map(prompts.map(p => [p.id, p]));
  for (const n of JUSTIFY_NUMBERS) {
    const p = byId.get(n.id);
    if (!p) { errs.push(`numbers: prompt ${n.id} not found`); continue; }
    const text = strip([p.context, p.prompt, ...(p.checklist || []), p.earns.answer].join(' '));
    for (const h of n.has) if (!text.includes(h)) errs.push(`numbers: prompt ${n.id} should show "${h}"`);
  }
  return errs;
}
