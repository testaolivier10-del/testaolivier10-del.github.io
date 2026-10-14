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
  rules: 'Derivative rules with every step shown (chain, product, implicit)',
  setup: 'Area and volume set-ups: radii, limits, the factor of π',
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
   for a prompt. The numerical work here is our own (composite Simpson,
   bisection, a central difference), written apart from the runtime and
   from the scratch script that wrote the items, so a key that disagrees
   with the math fails the check. Calculator keys show three decimals,
   rounded, as the options do. */
const simpson = (f, a, b, n = 20000) => { const h = (b - a) / n; let s = f(a) + f(b); for (let i = 1; i < n; i++) s += f(a + i * h) * (i % 2 ? 4 : 2); return s * h / 3; };
const bisect = (f, a, b) => { let fa = f(a); for (let i = 0; i < 200; i++) { const m = (a + b) / 2, fm = f(m); if (fa * fm <= 0) b = m; else { a = m; fa = fm; } } return (a + b) / 2; };
// Every simple zero of f on [a, b], from sign changes on a fine grid.
const zeros = (f, a, b, n = 4000) => { const out = [], h = (b - a) / n; for (let i = 0; i < n; i++) { const x0 = a + i * h; if (f(x0) * f(x0 + h) < 0) out.push(bisect(f, x0, x0 + h)); } return out; };
const dif = (f, x, h = 1e-5) => (f(x + h) - f(x - h)) / (2 * h);
const r3 = x => (Math.round(x * 1000) / 1000).toFixed(3);
const m3 = x => `$${r3(x)}$`;
const most = (f, xs, best) => xs.every(x => best === x || f(best) > f(x));
const least = (f, xs, best) => xs.every(x => best === x || f(best) < f(x));

// Form 1: the tank (r in, 7 out, 50 liters at t = 0) and its set.
const rIn = t => 6 + 4 * Math.sin(t * t / 8);
const tank = x => 50 + simpson(t => rIn(t) - 7, 0, x);
const tankZ = zeros(t => rIn(t) - 7, 0, 6);
const v15 = t => 2 * Math.cos(0.8 * t) - 0.3 * t;
const fp16 = x => Math.exp(Math.sin(x)) - 1.5;
const near17 = bisect(x => (x - 2) + Math.exp(2 * x), -2, 2);            // D'(x)/2 for D = (x - 2)² + e^{2x}
const s19 = t => Math.sin(t * t), g19 = x => simpson(s19, 0, x);
const area111 = zeros(x => 4 - x * x - Math.exp(x), -3, 3);
// Form 2: the particle with v = e^{sin t} - 1.2 from x = 1.
const vp = t => Math.exp(Math.sin(t)) - 1.2;
const vpZ = zeros(vp, 0, 4);
const dist = simpson(t => Math.abs(vp(t)), 0, vpZ[0], 2000) + simpson(t => Math.abs(vp(t)), vpZ[0], vpZ[1], 2000) + simpson(t => Math.abs(vp(t)), vpZ[1], 4, 2000);
const f26 = x => x * x - 3 * Math.sin(2 * x);
const c26 = zeros(x => 2 * x - 6 * Math.cos(2 * x), -1, 3);
const z28 = zeros(x => Math.exp(x / 2) - 2 * x, -2, 6);
const T213 = t => 20 + 10 * Math.exp(-0.1 * t) * Math.cos(t / 3);

export const EXAM_NUMBERS = [
  // form 1
  { id: 'calc-exam-1-01', key: m3(tank(6)) },                                                     // 50 + ∫₀⁶ (r − 7) dt
  { id: 'calc-exam-1-02', key: m3(tankZ[1]), check: () => tankZ.length === 2 && most(tank, [0, ...tankZ, 6], tankZ[1]) },  // candidates test
  { id: 'calc-exam-1-03', key: `${m3(dif(rIn, 4))} liters per minute per minute`, check: () => Math.abs(dif(rIn, 4) - 4 * Math.cos(2)) < 1e-6 },
  { id: 'calc-exam-1-04', key: m3(bisect(x => Math.exp(x) - 2 * x - (Math.exp(2) - 5) / 2, 0.5, 2)), check: () => zeros(x => Math.exp(x) - 2 * x - (Math.exp(2) - 5) / 2, 0, 2).length === 1 },
  { id: 'calc-exam-1-05', key: `Speeding up, because $v(3) \\approx ${r3(v15(3))}$ and $a(3) \\approx ${r3(dif(v15, 3))}$ have the same sign`, check: () => v15(3) < 0 && dif(v15, 3) < 0 },
  { id: 'calc-exam-1-06', key: m3(zeros(fp16, 0, 4)[1]), check: () => zeros(fp16, 0, 4).length === 2 && fp16(2) > 0 && fp16(3.5) < 0 },
  { id: 'calc-exam-1-07', key: m3(Math.hypot(near17 - 2, Math.exp(near17))) },                   // √D at the one critical point
  { id: 'calc-exam-1-08', key: m3(2 + simpson(x => Math.sqrt(1 + x ** 3), 1, 3)) },
  { id: 'calc-exam-1-09', key: m3(g19(Math.sqrt(Math.PI))), check: () => most(g19, [0, Math.sqrt(Math.PI), Math.sqrt(2 * Math.PI), 3], Math.sqrt(Math.PI)) },
  { id: 'calc-exam-1-10', key: m3(4 * Math.log(4) - 3) },                                         // ∫₀³ ln(1 + x) dx, by parts (exact)
  { id: 'calc-exam-1-11', key: m3(simpson(x => 4 - x * x - Math.exp(x), area111[0], area111[1])), check: () => area111.length === 2 },
  { id: 'calc-exam-1-12', key: m3(Math.PI * simpson(x => (Math.log(x + 1) + 1) ** 2 - 1, 0, 3)) }, // washers about y = −1
  { id: 'calc-exam-1-13', key: m3(simpson(t => (t + 1) * Math.cos(t), 0, Math.PI / 2) - simpson(t => (t + 1) * Math.cos(t), Math.PI / 2, 4)) }, // split where v changes sign
  // form 2
  { id: 'calc-exam-2-01', key: m3(vpZ[1]), check: () => vpZ.length === 2 && vp(vpZ[1] - 0.01) > 0 && vp(vpZ[1] + 0.01) < 0 },
  { id: 'calc-exam-2-02', key: m3(1 + simpson(vp, 0, 4)) },
  { id: 'calc-exam-2-03', key: m3(dist) },
  { id: 'calc-exam-2-04', key: m3(bisect(x => 6 * x - Math.exp(x), 1, 4)), check: () => zeros(x => 6 * x - Math.exp(x), 1, 4).length === 1 },
  { id: 'calc-exam-2-05', key: `${m3(20 / (Math.PI * 3.2 ** 2))} inches per second` },           // 5 = (πh²/4) dh/dt
  { id: 'calc-exam-2-06', key: m3(f26(c26[1])), check: () => c26.length === 2 && least(f26, [-1, ...c26, 3], c26[1]) },
  { id: 'calc-exam-2-07', key: m3(zeros(x => Math.cos(x) - x * Math.sin(x), 0, 2)[0]), check: () => zeros(x => Math.cos(x) - x * Math.sin(x), 0, 2).length === 1 },
  { id: 'calc-exam-2-08', key: `$(${r3(z28[0])}, ${r3(z28[1])})$`, check: () => z28.length === 2 && Math.exp(1) - 4 < 0 },
  { id: 'calc-exam-2-09', key: m3(3 + simpson(x => Math.log(x * x + 2), 1, 4)) },
  { id: 'calc-exam-2-10', key: m3(Math.exp(0.25) + Math.exp(2.25)) },                           // midpoints 0.5 and 1.5, width 1
  { id: 'calc-exam-2-11', key: String(Math.round(simpson(t => 1200 * Math.exp(-((t - 3) ** 2) / 2), 0, 8))) },
  { id: 'calc-exam-2-12', key: m3(simpson(x => (2 * Math.exp(-x * x)) ** 2, 0, 1.2)) },         // side squared
  { id: 'calc-exam-2-13', key: `${m3(simpson(T213, 0, 10) / 10)} degrees Celsius` },
];
// The prompts' numbers, each recomputed from the prompt's own data.
const cubic = x => x ** 3 - 3 * x ** 2;                                       // u5 candidates test
const vt = y => [-2 * y, y];                                                  // x = -2y on x² + xy + y² = 12
const washer = 2 * (24 * 2 - 10 * 2 ** 3 / 3 + 2 ** 5 / 5);                  // ∫ from -2 to 2 of (5 - x²)² - 1
export const JUSTIFY_NUMBERS = [
  { id: 'u1-removable-hole', has: [`\\lim_{x \\to 3} (x + 3) = ${3 + 3}`] },
  { id: 'u2-estimate-rate-with-units', has: [`= ${(35 - 26) / (5 - 2)}$ degrees Celsius per minute`] },
  { id: 'u2-differentiable-piecewise', has: [`p'(1) = ${2 * 1}`] },
  { id: 'u3-chain-rule-from-table', has: [`= ${5 * -2}`] },
  { id: 'u3-inverse-derivative-point', has: [`f(1) = 1 + 1 + 1 = ${1 + 1 + 1}`, `f'(1) = ${3 * 1 ** 2 + 1}`, `g'(3) = \\frac{1}{${3 * 1 ** 2 + 1}}`] },
  { id: 'u4-speeding-up-signs', has: [`= ${2.5 ** 2 - 4 * 2.5 + 3}`, `a(2.5) = ${2 * 2.5 - 4}`] },
  { id: 'u4-lhospital-form-first', has: [`\\frac{${3 * Math.exp(0)}}{${Math.cos(0)}} = 3`] },
  { id: 'u5-mvt-altitude', has: [`\\frac{30 - 10}{4} = ${(30 - 10) / (6 - 2)}`] },
  { id: 'u5-candidates-absolute-min', has: [`f(-1) = ${cubic(-1)}`, `f(0) = ${cubic(0)}`, `f(2) = ${cubic(2)}`, `f(4) = ${cubic(4)}`] },
  { id: 'u5-vertical-tangent', has: [`3y^2 = 12`, `(${vt(2).join(', ')})`, `(${vt(-2).join(', ')})`] },
  { id: 'u6-left-sum-underestimate', has: [`= ${2 * 4 + 3 * 7 + 4 * 9}`] },
  { id: 'u6-lower-limit-above', has: [`5 - 6 = ${5 - 6}`] },
  { id: 'u7-separation-with-constant', has: [`\\sqrt{2x^2 + ${2 * (3 ** 2 / 2)}}`] },
  { id: 'u7-tangent-under-concave-up', has: [`3 + (-2)(0.2) = ${3 + (1 - 3) * 0.2}`, `1 - (1 - 3) = ${1 - (1 - 3)}`] },
  { id: 'u8-distance-vs-displacement', has: [`= ${(4 * 2 - 2 ** 2)}$ and`, `= ${(4 * 3 - 3 ** 2) - (4 * 2 - 2 ** 2)}$`, `= ${(4 * 2 - 2 ** 2) - ((4 * 3 - 3 ** 2) - (4 * 2 - 2 ** 2))}$ meters`] },
  { id: 'u8-position-from-later-start', has: [`5 + (-7) = ${5 - 7}`] },
  { id: 'u8-washer-about-line', has: [`\\frac{${Math.round(15 * washer)}\\pi}{15}`] },
  { id: 'u8-average-value-meaning', has: [`\\frac{840}{12} = ${840 / 12}`] },
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
