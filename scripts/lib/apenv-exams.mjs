/* AP® Environmental Science exams and the "Make it specific" trainer:
   loading, assembly and checks shared by the generator
   (scripts/build-apenv.mjs), the content check (scripts/check-apenv-content.mjs)
   and the tests (scripts/test/apenv-exams.test.mjs). Formats:
   docs/apenv-architecture.md, "Practice exams" and "Make it specific".
   Forked from AP® Statistics'.

     loadExams(dataDir)            { items, stimuli, forms } from data/exams/
     loadJustify(dataDir, map)     every prompt, in course order
     unitRange(weight, n)          [min, max] questions a unit may have out of n
     checkForms(forms, ctx)        problems with the two fixed exams
     checkJustify(prompts, ctx)    problems with the trainer's prompts
     checkNumbers(items, prompts)  every number in an exam-only item or a
                                   prompt, recomputed here with ApEnvCalc
                                   (EXAM_NUMBERS, JUSTIFY_NUMBERS: Phase 3) */
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { Calc } from './apenv-mathlib.mjs';

const readJson = p => JSON.parse(readFileSync(p, 'utf8'));
const strip = s => String(s ?? '').replace(/<\/?[A-Za-z!][^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

export const MCQ_TOTAL = 80;
// Section I as the May 2027 exam: one part, 80 four-option questions in 90
// minutes, individual items plus sets with a stimulus: 3-5 quantitative data
// sets, 3-5 visual or model sets, 2 text sets (framework.md section 4).
export const MCQ_PARTS = [{ key: '', n: 80, minutes: 90 }];
export const EXAM_SETS = { quantitative: [3, 5], visual: [3, 5], text: [2, 2] };
// Section II: 3 questions in 70 minutes, 10 points each, in this order.
export const FRQ_PARTS = [{ key: '', n: 3, minutes: 70 }];
export const FRQ_ORDER = ['design', 'data', 'calc'];
export const FRQ_POINTS = 10;
export const FRQ_TOTAL = 3;
// The trainer's free prompts: the first few in course order (spec section 6).
export const FREE_JUSTIFY = 3;
// "Make it specific" (spec section 6): the reader-report misses the trainer
// is built around (docs/apenv-research/framework.md section 6).
export const JUSTIFY_SKILLS = {
  hypothesis: 'A testable, directional hypothesis: if [change], then [variable] will increase or decrease, because ...',
  variables: 'The independent and dependent variable the scenario actually measures',
  control: 'A control group and what it is for, and a variable held constant',
  chain: 'A complete cause-and-effect chain, every link named',
  trend: 'A data trend described with numbers and explained',
  solution: 'A solution fitted to the scenario: its scale, its constraints, and how it works',
  policy: 'A policy (a law or rule) when a policy is asked, not a technology',
  tradeoff: 'An advantage and a disadvantage, each with its reason',
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
   in percent: floor of the low end to ceiling of the high end, so 6-8% of
   80 is 4 to 7 and 15-20% is 12 to 16. */
export function unitRange(weight, n = MCQ_TOTAL) {
  return [Math.floor(weight[0] / 100 * n + 1e-9), Math.ceil(weight[1] / 100 * n - 1e-9)];
}

/* ctx: { map, bank: Map(id -> item), examItems: Map(id -> item), stimuli(id) -> stimulus, frqs: { id: frq }, orderOf(id) }.
   A form passes when Section I has exactly 80 four-option single-answer
   questions; each block is a whole stimulus set in authored order (or one
   standalone question); its sets are 3-5 quantitative, 3-5 visual and 2
   text (docs/apenv-spec.md decision 7); every unit sits inside its weight
   range of 80 and every practice inside its; and Section II is 3 FRQs in
   the order design, data, calc, 10 points each, that exist. No question or
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
        const own = /^env-exam-(\d+)-\d+$/.exec(q.id);
        if (own && `form-${own[1]}` !== f.id) errs.push(`${w}: exam-only item ${q.id} belongs to form-${own[1]}`);
      }
      const stim = qs[0].stimulus || null;
      const st = stim && ctx.stimuli ? ctx.stimuli(stim) : null;
      if (st && EXAM_SETS[st.kind]) sets[st.kind] = (sets[st.kind] || 0) + 1;
      if (qs.length === 1 && stim && !examItems.has(qs[0].id)) errs.push(`${w}: ${qs[0].id} needs its stimulus, so it goes in a block with the rest of its set`);
      if (qs.length > 1) {
        if (!stim || qs.some(q => q.stimulus !== stim)) errs.push(`${w}: block ${block.join(', ')} mixes stimuli; a block is one set or one question`);
        if (qs.length < 2 || qs.length > 5) errs.push(`${w}: set ${stim} has ${qs.length} questions in the exam (2 to 5; the exam's sets are 3 or 4)`);
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
    if (!/^[1-7]\.[A-F]$/.test(p.practice || '')) errs.push(`${w}: practice must be a skill id like "4.A"`);
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
    // The reader reports' top misses (spec section 7 rule 4): a hypothesis
    // that earns the point is a statement with a direction; an answer that
    // earns a solution point says how it works.
    const earn = strip(p.earns?.answer || '');
    if (p.skill === 'hypothesis' && (/\?/.test(earn) || !/\b(increase|decrease|higher|lower|more|less|fewer|greater)/i.test(earn))) errs.push(`${w}: a hypothesis that earns the point is a directional statement, not a question`);
    if (p.skill === 'solution' && !/\b(because|by |which|so that|reduc|prevent|absorb|trap|filter|remov)/i.test(earn)) errs.push(`${w}: a solution that earns the point says how it works`);
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

/* Every number in an exam-only item or a prompt, recomputed with ApEnvCalc
   (the same code the graders use): the value, and where it must appear (an
   item's keyed option, or a prompt's text). Each entry is { id, key, starts?,
   also?, check? } for an item (also: distractor values recomputed from the
   slip they name, each one an option) and { id, has: [...], check? } for a
   prompt. Every number comes from ApEnvCalc (scripts/lib/apenv-mathlib.mjs,
   Calc), the same code the graders use. */
const C = (fn, ...args) => Calc.evaluate({ fn, args });
// Thousands commas, as the options print numbers.
const nf = (x, d = 0) => Number(x.toFixed(d)).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
const r12 = x => +x.toPrecision(12);
// Form 1, set exam-1-s1: GPP 24,000, respiration 9,000, 10% per level.
const g1 = { gpp: 24000, r: 9000 }, npp1 = C('npp', g1.gpp, g1.r);
// Form 1, set exam-1-s2: Country P, CBR 28, CDR 8 in 2025; 40 million doubles to 80 million.
const ni1 = C('naturalIncrease', 28, 8);
// Form 1, set exam-1-s3: 400 tubes, 32 W to 15 W, 2,000 h, $0.12 and 0.4 kg per kWh.
const tubes = 400, hrs = 2000, kwhSaved = C('div', C('mul', tubes, C('sub', 32, 15), hrs), 1000), kwhLed = C('div', C('mul', tubes, 15, hrs), 1000), kwhOld = C('div', C('mul', tubes, 32, hrs), 1000);
// Form 2, set exam-2-s1: 1,200,000 to 1,500,000; 1.4% per year from 2025.
// Form 2, set exam-2-s2: 40 ha, 6,000 m3/ha, drip 40% less, $0.25 per m3.
const dripHa = C('mul', 6000, C('sub', 1, 0.40)), savedHa = C('sub', 6000, dripHa), savedFarm = C('mul', savedHa, 40);
// Form 2, set exam-2-s3: sea level 0, 32, 66, 103 mm in 1993, 2003, 2013, 2023.
const sea = [0, 32, 66, 103];
export const EXAM_NUMBERS = [
  { id: 'env-exam-1-01', key: `${nf(npp1)} kcal/m²/yr`, also: [`${nf(C('gpp', g1.gpp, g1.r))} kcal/m²/yr`, `${nf(C('tenPercent', g1.gpp, 1))} kcal/m²/yr`, `${nf(g1.r)} kcal/m²/yr`] },
  { id: 'env-exam-1-02', key: `${nf(C('tenPercent', npp1, 2))} kcal/m²/yr`, also: [`${nf(C('tenPercent', npp1, 1))} kcal/m²/yr`, `${nf(C('tenPercent', npp1, 3))} kcal/m²/yr`, `${nf(C('tenPercent', g1.gpp, 2))} kcal/m²/yr`] },
  { id: 'env-exam-1-04', key: `${ni1.toFixed(1)}%`, also: [`${nf(28 - 8)}%`, `${((28 - 8) / 100).toFixed(1)}%`, `${C('naturalIncrease', 28, -8).toFixed(1)}%`] },
  { id: 'env-exam-1-05', key: `${C('doublingYear', 2025, ni1)}`, check: () => C('mul', 40, 2) === 80,
    also: [`${Math.round(C('doublingYear', 2025, 20))}`, `${Math.round(C('doublingYear', 2025, 3.6))}`, `${2025 + 70}`] },
  { id: 'env-exam-1-11', key: `${nf(kwhSaved)} kWh`, also: [`${nf(kwhSaved * 1000)} kWh`, `${nf(kwhLed)} kWh`, `${nf(kwhSaved / tubes)} kWh`] },
  { id: 'env-exam-1-12', key: `\\$${nf(C('cost', kwhSaved, 0.12))}`, also: [`\\$${nf(C('div', kwhSaved, 0.12))}`, `\\$${nf(C('cost', kwhOld, 0.12))}`, `\\$${nf(C('cost', kwhLed, 0.12))}`] },
  { id: 'env-exam-1-13', key: `${nf(C('emissions', kwhSaved, 0.4))} kg`, also: [`${nf(C('div', kwhSaved, 0.4))} kg`, `${nf(C('emissions', kwhLed, 0.4))} kg`, `${nf(C('emissions', kwhSaved, 0.4) / 1000, 2)} kg`] },
  { id: 'env-exam-1-18', key: `Pesticide X is ${C('magnification', 500, 50)} times as toxic as pesticide Y`, also: [`Pesticide Y is ${C('magnification', 500, 50)} times as toxic as pesticide X`, `Pesticide X is ${C('sub', 500, 50)} times as toxic as pesticide Y`] },
  { id: 'env-exam-1-21', key: `About ${Math.round(C('percentChange', 316, 420))}%`, also: [`About ${Math.round(C('percentChange', 316, 420) * 316 / 420)}%`, `About ${C('sub', 420, 316)}%`, `About ${(420 / 316).toFixed(1)}%`] },
  { id: 'env-exam-2-05', key: `${C('percentChange', 1200000, 1500000)}%`, also: [`${C('fractionOf', 300000, 1500000)}%`, `${C('percentChange', 1200000, 1500000) / 100}%`, `${C('fractionOf', 1500000, 1200000)}%`] },
  { id: 'env-exam-2-06', key: `${C('doublingYear', 2025, 1.4)}`, check: () => C('mul', 1500000, 2) === 3000000,
    also: [`${C('doublingYear', 2025, 14)}`, `${C('doublingYear', 2000, 1.4)}`, `${2025 + 70}`] },
  { id: 'env-exam-2-07', key: `It would double, to about ${C('ruleOf70', 0.7)} years`, check: () => C('ruleOf70', 0.7) === 2 * C('ruleOf70', 1.4),
    also: [`It would halve, to about ${C('ruleOf70', 1.4) / 2} years`, `It would stay at about ${C('ruleOf70', 1.4)} years, since the population is the same`] },
  { id: 'env-exam-2-12', key: `${nf(dripHa)} m³`, also: [`${nf(C('percentOf', 40, 6000))} m³`, `${nf(6000 - 40)} m³`, `${nf(C('mul', 6000, 1.40))} m³`] },
  { id: 'env-exam-2-13', key: `${nf(savedFarm)} m³`, also: [`${nf(C('mul', dripHa, 40))} m³`, `${nf(C('mul', 6000, 40))} m³`, `${nf(savedHa)} m³`] },
  { id: 'env-exam-2-14', key: `\\$${nf(C('cost', savedFarm, 0.25))}`, also: [`\\$${nf(C('div', savedFarm, 0.25))}`, `\\$${nf(C('cost', C('mul', dripHa, 40), 0.25))}`, `\\$${nf(C('cost', C('mul', 6000, 40), 0.25))}`] },
  { id: 'env-exam-2-15', key: `About ${Math.round(C('chainEfficiency', 35, 90, 90))}%`, check: () => Math.abs(r12(0.35 * 0.9 * 0.9) - 0.2835) < 1e-12,
    also: [`About ${Math.round((35 + 90 + 90) / 3)}%`, `About ${35 - 10 - 10}%`, `About 35%`] },
  { id: 'env-exam-2-19', key: `${C('biomagnify', 0.04, 10, 3)} ppm`, also: [`${C('biomagnify', 0.04, 10, 2)} ppm`, `${C('biomagnify', 0.04, 10, 1)} ppm`, `${r12(0.04 * 10 * 3)} ppm`] },
  { id: 'env-exam-2-20', key: `About ${C('div', sea[3] - sea[0], 2023 - 1993).toFixed(1)} mm per year`, also: [`About ${Math.round(C('div', sea[3] - sea[0], 3))} mm per year`, `About ${C('div', sea[3] - sea[2], 10).toFixed(1)} mm per year`, `About ${C('div', 30, 103).toFixed(2)} mm per year`] },
  { id: 'env-exam-2-21', key: 'Sea level rose in each decade, and the rise per decade grew', check: () => { const d = sea.slice(1).map((v, i) => v - sea[i]); return d.every((x, i) => !i || x > d[i - 1]) && d.join() === '32,34,37'; } },
];
// Every number a prompt shows, recomputed, in the text where it must appear.
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
