/* AP® Statistics exams and the justification trainer: loading, assembly and
   checks shared by the generator (scripts/build-apstat.mjs), the content
   check (scripts/check-apstat-content.mjs) and the tests
   (scripts/test/apstat-exams.test.mjs). Formats: docs/apstat-architecture.md,
   "Practice exams" and "Justification trainer". Forked from AP® Calculus AB's.

     loadExams(dataDir)            { items, stimuli, forms } from data/exams/
     loadJustify(dataDir, map)     every prompt, in course order
     unitRange(weight, n)          [min, max] questions a unit may have out of n
     checkForms(forms, ctx)        problems with the two fixed exams
     checkJustify(prompts, ctx)    problems with the trainer's prompts
     checkNumbers()                every number in an exam-only item or a
                                   prompt, recomputed here (EXAM_NUMBERS) */
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { Dist } from './apstat-mathlib.mjs';

const readJson = p => JSON.parse(readFileSync(p, 'utf8'));
const strip = s => String(s ?? '').replace(/<\/?[A-Za-z!][^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

export const MCQ_TOTAL = 42;
// Section I as the May 2027 exam: one part, 42 four-option questions in 90
// minutes, with exactly one probability set and one regression set of 3.
export const MCQ_PARTS = [{ key: '', n: 42, minutes: 90 }];
export const EXAM_SETS = ['probability', 'regression'];
// Section II: 4 questions in 90 minutes, 10 points each, in this order.
export const FRQ_PARTS = [{ key: '', n: 4, minutes: 90 }];
export const FRQ_ORDER = ['collect', 'analyze', 'inference', 'multi'];
export const FRQ_POINTS = 10;
export const FRQ_TOTAL = 4;
// The trainer's free prompts: the first few in course order (spec section 6).
export const FREE_JUSTIFY = 3;
// "Say it in context" (spec section 6): the reader-report misses the trainer is
// built around (docs/apstat-research/framework.md section 6).
export const JUSTIFY_SKILLS = {
  describe: 'Describe a distribution: shape, center, spread, unusual features, in context',
  compare: 'Compare distributions with comparison words, not two separate lists',
  sampling: 'Sampling: name the bias and its direction; write a procedure that can be followed',
  design: 'Experiments: random assignment, what it allows, and blinding',
  probability: 'Define the random variable, name the distribution, tie the probability to the claim',
  interval: 'Interpret a confidence interval and the confidence level',
  test: 'State a test conclusion: compare, evidence, direction, parameter, context',
  errors: 'Type I and Type II errors in context, with the conditional clause',
  conditions: 'Check conditions in words, with the numbers',
  regression: 'Interpret slope, intercept, r squared, s and a residual in context',
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
   in percent: floor of the low end to ceiling of the high end, so 20-30% of
   42 is 8 to 13, 15-25% is 6 to 11 and 10-20% is 4 to 9. */
export function unitRange(weight, n = MCQ_TOTAL) {
  return [Math.floor(weight[0] / 100 * n + 1e-9), Math.ceil(weight[1] / 100 * n - 1e-9)];
}

/* ctx: { map, bank: Map(id -> item), examItems: Map(id -> item), stimuli(id) -> stimulus, frqs: { id: frq }, orderOf(id) }.
   A form passes when Section I has exactly 42 four-option single-answer
   questions; each block is a whole stimulus set in authored order (or one
   standalone question); it has exactly one probability set and one
   regression set of 3 (docs/apstat-spec.md decision 7); every unit sits
   inside its weight range of 42 and every practice inside its; and Section
   II is 4 FRQs in the order collect, analyze, inference, multi, 10 points
   each, that exist. No question or FRQ may be in both forms, and an
   exam-only item belongs to its own form. */
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
        const own = /^stat-exam-(\d+)-\d+$/.exec(q.id);
        if (own && `form-${own[1]}` !== f.id) errs.push(`${w}: exam-only item ${q.id} belongs to form-${own[1]}`);
      }
      const stim = qs[0].stimulus || null;
      const st = stim && ctx.stimuli ? ctx.stimuli(stim) : null;
      if (st && st.set) { sets[st.set] = (sets[st.set] || 0) + 1; if (qs.length !== 3) errs.push(`${w}: the ${st.set} set ${stim} has ${qs.length} questions in the exam (exactly 3)`); }
      if (qs.length === 1 && stim && !examItems.has(qs[0].id)) errs.push(`${w}: ${qs[0].id} needs its stimulus, so it goes in a block with the rest of its set`);
      if (qs.length > 1) {
        if (!stim || qs.some(q => q.stimulus !== stim)) errs.push(`${w}: block ${block.join(', ')} mixes stimuli; a block is one set or one question`);
        if (qs.length < 2 || qs.length > 5) errs.push(`${w}: set ${stim} has ${qs.length} questions in the exam (2 to 5)`);
        const order = qs.map(q => ctx.orderOf(q.id));
        if (order.some((x, i) => i && x <= order[i - 1])) errs.push(`${w}: set ${stim} is not in authored order`);
      }
    }
    for (const s of EXAM_SETS) if ((sets[s] || 0) !== 1) errs.push(`${w}: Section I has ${sets[s] || 0} ${s} sets; the exam has exactly one`);
    for (const u of units) {
      const [lo, hi] = unitRange(u.weight);
      const n = count[u.id] || 0;
      if (n < lo || n > hi) errs.push(`${w}: Unit ${u.n} has ${n} questions; its ${u.weight[0]}-${u.weight[1]}% weight allows ${lo} to ${hi}`);
    }
    for (const p of map.practices || []) {
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
    const text = [p.title, p.context, p.prompt, ...(p.checklist || []), p.earns?.answer, p.earns?.why, p.misses?.answer, p.misses?.why,
      ...Object.values(p.conclude?.slots || {}).flatMap(sl => [...(sl.options || []), ...Object.values(sl.why || {})])].join('\n');
    if (ctx.trademarkProblems) for (const x of ctx.trademarkProblems(text)) errs.push(`${w}: trademark: ${x}`);
    // The reader reports' top misses (spec section 7 rule 5, architecture
    // "Justification trainer"): a model answer never accepts or proves, and a
    // test or interval answer names the parameter.
    const earn = strip(p.earns?.answer || '');
    if (/\b(prove[sn]?|accept (the null|h_?0)|h_?0 is true|the null hypothesis is true|95% of the data)\b/i.test(earn)) errs.push(`${w}: the model answer says "accept", "prove", "H0 is true" or "95% of the data"`);
    if ((p.skill === 'test' || p.skill === 'interval') && !/\b(true|population|all)\b[^.]*\b(proportion|mean|difference)/i.test(earn)) errs.push(`${w}: a ${p.skill} answer names the parameter ("the true proportion of all ...")`);
    // The builder (spec section 6: "plus the conclusion builder where the
    // answer has components"): every slot has 2 to 4 options, one correct, a
    // why for each wrong option; a test's decision slot comes from p and alpha.
    if (p.conclude) {
      const Cn = p.conclude, slots = Cn.slots || {};
      if (!['test', 'interval', 'error', 'slope', 'r2', 'residual', 'level', 'pvalue'].includes(Cn.mode)) errs.push(`${w}: conclude.mode "${Cn.mode}" is not one the builder uses`);
      if (Cn.mode === 'test' && !(Cn.p > 0 && Cn.p < 1 && Cn.alpha > 0 && Cn.alpha < 1)) errs.push(`${w}: a test builder needs p and alpha (the decision slot is built from them)`);
      if (Cn.mode === 'test' && Cn.p != null && !strip(p.earns?.answer).includes(String(Cn.p))) errs.push(`${w}: the builder's p-value ${Cn.p} is not the one in the model answer`);
      if (Object.keys(slots).length < 2) errs.push(`${w}: the builder has ${Object.keys(slots).length} slot(s); it needs 2 or more`);
      for (const [k, sl] of Object.entries(slots)) {
        const n = (sl.options || []).length;
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

/* Every number in an exam-only item or a prompt, recomputed: the value, and
   where it must appear (an item's keyed option, or a prompt's text). Each
   entry is { id, key, starts?, also?, check? } for an item (also: distractor
   values recomputed from the slip they name, each one an option) and
   { id, has: [...], check? } for a prompt. Every number comes from ApStatDist
   (scripts/lib/apstat-mathlib.mjs, Dist), the same code the graders use. */
const f2 = x => x.toFixed(2), f3 = x => x.toFixed(3);
// Form 1: the commuter flight set (X binomial, n = 15, p = 0.12).
const bin = { n: 15, p: 0.12 };
const atLeast3 = 1 - Dist.binomCdf(2, bin.n, bin.p);
// 1-07: eggs, normal with mean 58 g and SD 4.5 g, above 65 g (Table A z to two places, and technology).
const eggZ = (65 - 58) / 4.5;
// 1-08: 278 of 500, H0: p = 0.5.
const rail = Dist.z1prop(278 / 500, 0.5, 500);
// 1-11: commute times, n = 25, x-bar 31.4, s 8.2, 95%.
const commute = Dist.ci1mean(31.4, 8.2, 25, 0.95);
// Form 2: the jobs table (rows grades 9-10 and 11-12; columns job, no job).
const jobs = [[30, 170], [90, 110]], N = 400;
// 2-07: 136 of 400 households, 90%.
const thermo = Dist.ci1prop(136 / 400, 400, 0.90);
// 2-08: 70 of 250 with a reminder, 30 of 150 without.
const remind = Dist.z2prop(70, 250, 30, 150);
// 2-10: loaves, n = 16, x-bar 489, s 24, H0: mu = 500, Ha: mu < 500.
const loaf = Dist.t1(489, 500, 24, 16);
// 2-11 to 2-13: price = 24.60 - 1.85 age, R-sq 79.2%.
export const EXAM_NUMBERS = [
  { id: 'stat-exam-1-05', key: f3(atLeast3), also: [f3(1 - Dist.binomCdf(3, bin.n, bin.p)), f3(Dist.binomPmf(3, bin.n, bin.p)), f3(Dist.binomCdf(2, bin.n, bin.p))] },
  { id: 'stat-exam-1-06', key: `Mean ${(bin.n * bin.p).toFixed(1)}, standard deviation ${f2(Math.sqrt(bin.n * bin.p * (1 - bin.p)))}`, check: () => Math.abs(bin.n * bin.p - 1.8) < 1e-9,
    also: [`Mean 1.8, standard deviation ${f2(bin.n * bin.p * (1 - bin.p))}`, `Mean ${f2(bin.n * (1 - bin.p)).replace(/0$/, '')}, standard deviation ${f2(Math.sqrt(bin.n * bin.p * (1 - bin.p)))}`, `Mean 1.8, standard deviation ${f2(Math.sqrt(bin.p * (1 - bin.p)))}`] },
  { id: 'stat-exam-1-07', key: f3(1 - Dist.normCdf(eggZ)), check: () => Math.abs((1 - Dist.normCdf(Math.round(eggZ * 100) / 100)) - (1 - Dist.normCdf(eggZ))) < 0.001,
    also: [f3(1 - Dist.normCdf((65 - 58) / 4.5 ** 2)), f3(Dist.normCdf(eggZ))] },
  { id: 'stat-exam-1-08', key: `$z \\approx ${f2(rail.z)}$`, also: [`$z \\approx ${f2((278 / 500 - 0.5) / Math.sqrt(0.556 * 0.444 / 500))}$`, `$z \\approx ${rail.p.greater.toFixed(4)}$`] },
  { id: 'stat-exam-1-11', key: `From ${f2(commute.lo)} to ${f2(commute.hi)} minutes`, check: () => f3(commute.crit) === '2.064',
    also: [`From ${f2(31.4 - Dist.invNorm(0.975) * 8.2 / 5)} to ${f2(31.4 + Dist.invNorm(0.975) * 8.2 / 5)} minutes`, `From ${f2(31.4 - commute.crit * 8.2 / 25)} to ${f2(31.4 + commute.crit * 8.2 / 25)} minutes`] },
  { id: 'stat-exam-2-03', key: f3(jobs[1][0] / (jobs[1][0] + jobs[1][1])), also: [f3(jobs[1][0] / N), f3((jobs[0][0] + jobs[1][0]) / N), f3(jobs[1][0] / (jobs[0][0] + jobs[1][0]))] },
  { id: 'stat-exam-2-04', key: f3((jobs[0][0] + jobs[1][0] + 200 - jobs[1][0]) / N), also: [f3((120 + 200) / N), f3(jobs[1][0] / N), f3((jobs[0][0] + jobs[1][1]) / N)] },
  { id: 'stat-exam-2-05', key: `No, because $P(\\text{job} \\mid \\text{grades 11 and 12}) = ${f2(90 / 200)}$ is not equal to $P(\\text{job}) = ${f2(120 / N)}$.`},
  { id: 'stat-exam-2-07', key: `From ${f3(thermo.lo)} to ${f3(thermo.hi)}`, check: () => f3(thermo.crit) === '1.645',
    also: [`From ${f3(Dist.ci1prop(0.34, 400, 0.95).lo)} to ${f3(Dist.ci1prop(0.34, 400, 0.95).hi)}`, `From ${f3(Dist.ci1prop(0.34, 400, 0.80).lo)} to ${f3(Dist.ci1prop(0.34, 400, 0.80).hi)}`, `From ${f3(0.34 - thermo.crit * Math.sqrt(0.34 * 0.66) / 400)} to ${f3(0.34 + thermo.crit * Math.sqrt(0.34 * 0.66) / 400)}`] },
  { id: 'stat-exam-2-08', key: `$z \\approx ${f2(remind.z)}$`, check: () => remind.pc === 0.25,
    also: [`$z \\approx ${f2((remind.p1 - remind.p2) / Math.sqrt(remind.p1 * (1 - remind.p1) / 250 + remind.p2 * (1 - remind.p2) / 150))}$`, `$z \\approx ${f2((remind.p1 - remind.p2) / (Math.sqrt(remind.pc * (1 - remind.pc) / 250) + Math.sqrt(remind.pc * (1 - remind.pc) / 150)))}$`, `$z \\approx ${f2(remind.p1 - remind.p2)}$`] },
  { id: 'stat-exam-2-10', key: `Because the p-value of ${f3(loaf.p.less)} is less than 0.05, reject $H_0$.`, starts: true, check: () => f2(loaf.t) === '-1.83' && loaf.df === 15,
    also: [`Because the p-value of ${f3(loaf.p.two)} is greater than 0.05, fail to reject $H_0$. There is not convincing evidence that the true mean weight is less than 500 grams.`] },
  { id: 'stat-exam-2-12', key: `${f2(24.60 - 1.85 * 6)} thousand dollars`, also: [`${f2(24.60 + 1.85 * 6)} thousand dollars`, `${f2(24.60 - 1.85)} thousand dollars`, `${f2(1.85 * 6)} thousand dollars`] },
  { id: 'stat-exam-2-13', key: `$-${f3(Math.sqrt(0.792))}$`, also: [`${f3(0.792)}`, `${f3(Math.sqrt(0.792))}`] },
];
// Every number a prompt shows, recomputed, in the text where it must appear.
const f4 = x => x.toFixed(4);
const bus = Dist.z1prop(93 / 300, 0.25, 300), teen = Dist.ci1prop(151 / 500, 500, 0.95), trail = Dist.ci1mean(11.9, 0.56, 18, 0.95);
const phone = Dist.t1(19.2, 20, 1.8, 25), fert = Dist.t2(14.2, 2.1, 20, 12.9, 2.4, 20), hz = (68 - 64.5) / 2.5;
export const JUSTIFY_NUMBERS = [
  { id: 'u1-describe-commute', has: [`= 30 + ${1.5 * (30 - 15)} = ${30 + 1.5 * (30 - 15)}`, `$30 - 15 = ${30 - 15}$`] },
  { id: 'u1-compare-clinics', has: [`$44 - 20 = ${44 - 20}$`, `$25 - 12 = ${25 - 12}$`, `range ${70 - 8} vs ${41 - 5}`] },
  { id: 'u1-outlier-rule', has: [`$240 - 120 = ${240 - 120}$`, `240 + 1.5(120) = ${240 + 1.5 * 120}$`] },
  { id: 'u2-binomial-work', has: [`1 - ${f4(Dist.binomCdf(3, 10, 0.3))} = ${f3(1 - Dist.binomCdf(3, 10, 0.3))}`] },
  { id: 'u2-probability-claim', has: [`about ${f3(Dist.binomCdf(12, 20, 0.8))}`] },
  { id: 'u2-conditional-reversed', has: [`\\frac{20}{80} = ${20 / 80}`, `\\frac{20}{120} \\approx ${f3(20 / 120)}`] },
  { id: 'u2-independence-check', has: [`0.40(0.25) = ${f2(0.40 * 0.25)}`, `\\frac{0.15}{0.40} = ${f3(0.15 / 0.40)}`] },
  { id: 'u2-normal-work', has: [`= ${f2(hz)}$`, `$1 - ${f4(Dist.normCdf(f2(hz) * 1))} = ${f4(1 - Dist.normCdf(hz))}$`] },
  { id: 'u2-simulation-evidence', has: [`\\frac{2}{200} = ${2 / 200}`], check: () => 1 - Dist.binomCdf(8, 10, 0.5) < 0.02 },
  { id: 'u3-pvalue-meaning', has: [`$z = ${f2(bus.z)}$`, `p-value of ${f4(bus.p.greater)}`, `$\\hat{p} = ${93 / 300}$`] },
  { id: 'u3-test-conclusion', has: [`p-value of ${f4(bus.p.greater)} is less than`] },
  { id: 'u3-conditions-prop-test', has: [`300(0.25) = ${300 * 0.25}`, `300(0.75) = ${300 * 0.75}`] },
  { id: 'u3-interval-interpret', has: [`from ${f3(teen.lo)} to ${f3(teen.hi)}`] },
  { id: 'u3-chi-square-conclusion', has: [`$\\text{df} = ${(3 - 1) * (4 - 1)}$`, `p-value of ${f3(1 - Dist.chi2Cdf(14.6, 6))}`] },
  { id: 'u4-t-interval-interpret', has: [`from ${f2(trail.lo)} to ${f2(trail.hi)} ounces`] },
  { id: 'u4-t-test-conclusion', has: [`$t = ${f2(phone.t)}$`, `$\\text{df} = ${phone.df}$`, `p-value of ${f3(phone.p.less)}`] },
  { id: 'u4-two-sample-conclusion', has: [`$t = ${f2(fert.t)}$`, `$\\text{df} = ${fert.df.toFixed(1)}$`, `p-value of ${f3(fert.p.greater)}`] },
  { id: 'u5-residual', has: [`54.3 + 3.2(6) = ${(54.3 + 3.2 * 6).toFixed(1)}`, `81 - 73.5 = ${81 - 73.5}`] },
  { id: 'u5-extrapolation', has: [`54.3 + 3.2(25) = ${(54.3 + 3.2 * 25).toFixed(1)}`] },
];
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
