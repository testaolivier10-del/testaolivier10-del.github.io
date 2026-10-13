/* AP® Physics 1 exams and the justification trainer: loading, assembly and
   checks shared by the generator (scripts/build-apphys.mjs), the content
   check (scripts/check-apphys-content.mjs) and the tests
   (scripts/test/apphys-exams.test.mjs). Formats: docs/apphys-architecture.md,
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
// Section II as the May 2027 exam: one of each type, in this fixed order.
export const FRQ_SLOTS = ['mr', 'tbr', 'lab', 'qqt'];
export const FRQ_POINTS = { mr: 10, tbr: 12, lab: 10, qqt: 8 };
// The trainer's free prompts: the first few in course order (spec section 3).
export const FREE_JUSTIFY = 3;
// The reader-report misses the trainer is built around (framework.md section 8).
export const JUSTIFY_SKILLS = { forces: 'Forces and free-body diagrams', conservation: 'Name the conserved quantity and its condition', 'energy-momentum': 'Energy or momentum: which applies', 'functional-dependence': 'How a quantity scales', graphs: 'Graphs and what slope or area means', procedure: 'Lab procedure and measurement', fluids: 'Buoyancy and pressure' };

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
   floor of the low end to ceiling of the high end, so 5-8% of 42 is 2 to 4,
   10-15% is 4 to 7 and 18-23% is 7 to 10. */
export function unitRange(weight, n = MCQ_TOTAL) {
  return [Math.floor(weight[0] / 100 * n + 1e-9), Math.ceil(weight[1] / 100 * n - 1e-9)];
}

/* ctx: { map, bank: Map(id -> item), examItems: Map(id -> item), frqs: { id: frq }, stimuliOf(item) -> bool }.
   A form passes when Section I has exactly 42 four-option single-answer
   questions, each block is a whole stimulus set in authored order (or one
   standalone question), every unit sits inside its weight range, and
   Section II is one mr, tbr, lab and qqt FRQ, in that order, that exist. No question or FRQ may
   be in both forms, and an exam-only item belongs to its own form. */
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
    const count = {};
    for (const [bi, block] of (f.mcq || []).entries()) {
      if (!Array.isArray(block) || !block.length) { errs.push(`${w}: block ${bi + 1} is empty`); continue; }
      const qs = block.map(id => bank.get(id) || examItems.get(id));
      block.forEach((id, k) => { if (!qs[k]) errs.push(`${w}: unknown question ${id}`); });
      if (qs.some(q => !q)) continue;
      for (const q of qs) {
        if (q.type !== 'single' || (q.options || []).length !== 4) errs.push(`${w}: ${q.id} is not a four-option single-answer question`);
        if (String(q.practice).startsWith('1.')) errs.push(`${w}: ${q.id} is tagged practice 1 (Creating Representations), which is free response only`);
        count[q.unit] = (count[q.unit] || 0) + 1;
        if (seenQ.has(q.id) && seenQ.get(q.id) !== w) errs.push(`${w}: ${q.id} is also in ${seenQ.get(q.id)}`);
        seenQ.set(q.id, w);
        const own = /^phys-exam-(\d+)-\d+$/.exec(q.id);
        if (own && `form-${own[1]}` !== f.id) errs.push(`${w}: exam-only item ${q.id} belongs to form-${own[1]}`);
      }
      const stim = qs[0].stimulus || null;
      if (qs.length === 1 && stim && !examItems.has(qs[0].id)) errs.push(`${w}: ${qs[0].id} needs its stimulus, so it goes in a block with the rest of its set`);
      if (qs.length > 1) {
        if (!stim || qs.some(q => q.stimulus !== stim)) errs.push(`${w}: block ${block.join(', ')} mixes stimuli; a block is one set or one question`);
        if (qs.length < 3 || qs.length > 5) errs.push(`${w}: set ${stim} has ${qs.length} questions in the exam (3 to 5)`);
        const order = qs.map(q => ctx.orderOf(q.id));
        if (order.some((x, i) => i && x <= order[i - 1])) errs.push(`${w}: set ${stim} is not in authored order`);
      }
    }
    for (const u of units) {
      const [lo, hi] = unitRange(u.weight);
      const n = count[u.id] || 0;
      if (n < lo || n > hi) errs.push(`${w}: Unit ${u.n} has ${n} questions; its ${u.weight[0]}-${u.weight[1]}% weight allows ${lo} to ${hi}`);
    }
    for (const u of Object.keys(count)) if (!units.some(x => x.id === u)) errs.push(`${w}: questions from ${u}, which is not a course unit`);
    const fq = f.frq || [];
    if (fq.length !== FRQ_SLOTS.length) errs.push(`${w}: Section II has ${fq.length} questions, not ${FRQ_SLOTS.length}`);
    fq.forEach((id, i) => {
      const q = frqs[id];
      if (!q) { errs.push(`${w}: unknown FRQ ${id}`); return; }
      if (q.type !== FRQ_SLOTS[i]) errs.push(`${w}: Section II question ${i + 1} must be ${FRQ_SLOTS[i]}, ${id} is ${q.type}`);
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
    if (!/^[1-3]\.[A-D]$/.test(p.practice || '')) errs.push(`${w}: practice must be a skill id like "3.C"`);
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
    // A circular justification is the reader reports' top miss ("conserved because of conservation").
    if (/\bconserved because (of )?(the )?(law of )?conservation\b/i.test(strip(p.earns?.answer || ''))) errs.push(`${w}: the model answer is circular; name the condition (zero net external force or torque)`);
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
   for a prompt. g follows the item: 9.8 m/s² unless it says 10. */
const G = 9.8;
const fix = (x, d) => (x < 0 ? '−' : '') + Math.abs(x).toFixed(d);
const sup = n => String(n).replace('-', '⁻').replace(/\d/g, d => '⁰¹²³⁴⁵⁶⁷⁸⁹'[d]);
const sci = (x, n) => { const e = Math.floor(Math.log10(Math.abs(x))); return `${(x / 10 ** e).toFixed(n - 1)} × 10${sup(e)}`; };
export const EXAM_NUMBERS = [
  // form 1
  { id: 'phys-exam-1-01', key: `${fix(2 * 14.7 / G, 1)} s` },                                   // up and down: 2v₀/g
  { id: 'phys-exam-1-02', key: `${fix(1.0 * G / (3.9 + 1.0), 1)} m/s²` },                       // a = m_b g / (m_c + m_b)
  { id: 'phys-exam-1-03', key: '40 N, static friction', check: () => 40 < 0.50 * 12 * G },      // push below μ_s mg, so static friction = push
  { id: 'phys-exam-1-04', key: `${fix(0.5 * 250 * 0.12 ** 2, 1)} J` },                          // ½k(Δx)²
  { id: 'phys-exam-1-05', key: `${fix(Math.sqrt(2 * (0.5 * 250 * 0.12 ** 2) / 0.40), 1)} m/s` },
  { id: 'phys-exam-1-06', key: `${fix(0.5 * 250 * 0.12 ** 2 / (0.40 * G), 2)} m` },             // mgh = ½k(Δx)²
  { id: 'phys-exam-1-07', key: `${(0.24 / 0.12) ** 2} times as high` },                          // h ∝ (Δx)²
  { id: 'phys-exam-1-08', key: `${fix(0.50 * (4.0 - -6.0) / 0.020, 0)} N` },                    // F = mΔv/Δt, velocity reverses
  { id: 'phys-exam-1-09', key: `${fix(30 * 1.5 / 45, 1)} m right of the pivot`, check: () => 30 * 1.5 / 45 <= 5.0 / 2 },
  { id: 'phys-exam-1-10', key: `${fix(0.020 * 3.0 / (0.020 + 0.10 * 0.20 ** 2), 1)} rad/s` },   // Iω constant, clay adds mr²
  { id: 'phys-exam-1-11', key: `${fix(1.2e-3 * 1.5 / 4.0e-4, 1)} m/s` },                        // A₁v₁ = A₂v₂
  { id: 'phys-exam-1-12', key: `${sci(0.5 * 1000 * ((1.2e-3 * 1.5 / 4.0e-4) ** 2 - 1.5 ** 2), 2)} Pa` }, // ½ρ(v₂² − v₁²)
  // form 2
  { id: 'phys-exam-2-01', key: `${fix(3.0 * Math.sqrt(2 * 1.2 / G), 1)} m` },                   // x = v_x √(2h/g)
  { id: 'phys-exam-2-02', key: `${sci(1200 * 12 ** 2 / 40, 2)} N` },                            // mv²/r
  { id: 'phys-exam-2-03', key: `${fix(6 * 2.0 + 0.5 * 6 * 2.0, 0)} J` },                        // area: rectangle + triangle
  { id: 'phys-exam-2-04', key: `${fix(Math.sqrt(2 * (6 * 2.0 + 0.5 * 6 * 2.0) / 2.0), 1)} m/s` },
  { id: 'phys-exam-2-06', key: `+${fix((0.50 * 0.80 - 0.30 * 0.75) / 0.50, 2)} m/s` },          // momentum before = after
  { id: 'phys-exam-2-07', key: `${fix(0.5 * 0.50 * 0.80 ** 2 - (0.5 * 0.50 * ((0.50 * 0.80 - 0.30 * 0.75) / 0.50) ** 2 + 0.5 * 0.30 * 0.75 ** 2), 3)} J`, check: () => 0.5 * 0.50 * 0.35 ** 2 + 0.5 * 0.30 * 0.75 ** 2 < 0.5 * 0.50 * 0.80 ** 2 },
  { id: 'phys-exam-2-09', key: `${fix(0.5 * 30 * 5.0, 0)} rad` },                               // average ω times t
  { id: 'phys-exam-2-10', key: `${fix(0.50 / 0.25 * 3.0, 1)} rad/s` },                          // α = τ/I, ω = αt
  { id: 'phys-exam-2-11', key: `${fix(1.0e5 / (1000 * G), 1)} m` },                             // P_gauge = ρgh
  { id: 'phys-exam-2-12', key: `${fix(600 / 1000 * 100, 0)}%` },                                // fraction under = ρ_obj/ρ_fluid
];
export const JUSTIFY_NUMBERS = [
  { id: 'u1-slope-of-position-graph', has: [fix((10.0 - 2.0) / 4.0, 1) + ' m/s'] },
  { id: 'u1-area-under-velocity-graph', has: [fix(0.5 * 3.0 * 6.0, 1) + ' m', `${0.5 * 3.0 * 6.0 + 3.0 * 6.0} m`] },
  { id: 'u2-normal-force-on-ramp', has: [fix(5.0 * G * Math.cos(Math.PI / 6), 0) + ' N', fix(5.0 * G, 0) + ' N'] },
  { id: 'u2-hanging-mass-doubled', has: [fix(0.50 * G / 2.50, 2) + ' m/s²', fix(1.0 * G / 3.0, 2) + ' m/s²'] },
  { id: 'u3-power-same-lift', has: [fix(20 * G * 3.0, 0) + ' J', fix(20 * G * 3.0 / 3.0, 0) + ' W', fix(20 * G * 3.0 / 6.0, 0) + ' W'] },
  { id: 'u4-sticky-collision-start', has: [fix(0.20 * 5.0 / 1.00, 1) + ' m/s', fix(0.5 * 0.20 * 5.0 ** 2, 1) + ' J', fix(0.5 * 1.00 * (0.20 * 5.0 / 1.00) ** 2, 2) + ' J'] },
  { id: 'u4-impulse-from-graph', has: [fix(0.5 * 400 * 0.010, 1) + ' N·s', fix(0.5 * 400 * 0.010 / 0.050, 0) + ' m/s'] },
  { id: 'u5-wheelbarrow-lift', has: [fix((420 * 0.50 + 140 * 0.60) / 1.40, 0) + ' N', fix(420 * 0.50 + 140 * 0.60, 0) + ' N·m', fix(420 + 140 - (420 * 0.50 + 140 * 0.60) / 1.40, 0) + ' N'] },
  { id: 'u5-slope-gives-inertia', has: [fix((1.20 - 0.40) / (6.0 - 2.0), 2) + ' kg·m²'] },
  { id: 'u7-pendulum-finds-g', has: [fix(4 * Math.PI ** 2 / 4.0, 2) + ' m/s²'] },
  { id: 'u8-sinking-stone', has: [fix(G * (1 - 1000 / 2700), 1) + ' m/s²'] },
  { id: 'u8-pressure-depth-graph', has: [sci(1.0e4 / G, 2) + ' kg/m³', String(Math.round(1.0e4 / G / 10) * 10) + ' kg/m³'] },
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
    if (n.check && !n.check()) errs.push(`numbers: ${n.id} fails its side condition (static friction holds, the seat fits on the plank, kinetic energy falls)`);
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
