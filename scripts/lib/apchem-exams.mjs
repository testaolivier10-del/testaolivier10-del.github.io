/* AP® Chemistry exams and the justification trainer: loading, assembly and
   checks shared by the generator (scripts/build-apchem.mjs), the content
   check (scripts/check-apchem-content.mjs) and the tests
   (scripts/test/apchem-exams.test.mjs). Formats: docs/apchem-architecture.md,
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
const strip = s => String(s ?? '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

export const MCQ_TOTAL = 60;
// Section II as the exam: three long questions, then four short ones.
export const FRQ_SLOTS = ['long', 'long', 'long', 'short', 'short', 'short', 'short'];
// The trainer's free prompts: the first few in course order (spec section 3).
export const FREE_JUSTIFY = 3;
export const JUSTIFY_SKILLS = { coulomb: 'Coulomb\'s law, both species', imf: 'Intermolecular forces', 'q-vs-k': 'Q versus K', entropy: 'Entropy at the particle level', kinetics: 'Rates, plots and mechanisms', titration: 'Titrations and buffers', electrochem: 'Cells and electrolysis', particle: 'Particle-level reasoning', procedure: 'Lab procedure and error' };

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
   floor of the low end to ceiling of the high end, so 7-9% of 60 is 4 to 6. */
export function unitRange(weight, n = MCQ_TOTAL) {
  return [Math.floor(weight[0] / 100 * n + 1e-9), Math.ceil(weight[1] / 100 * n - 1e-9)];
}

/* ctx: { map, bank: Map(id -> item), examItems: Map(id -> item), frqs: { id: frq }, stimuliOf(item) -> bool }.
   A form passes when Section I has exactly 60 four-option single-answer
   questions, each block is a whole stimulus set in authored order (or one
   standalone question), every unit sits inside its weight range, and
   Section II is 3 long then 4 short FRQs that exist. No question or FRQ may
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
        if (String(q.practice).startsWith('3.')) errs.push(`${w}: ${q.id} is tagged practice 3, which is free response only`);
        count[q.unit] = (count[q.unit] || 0) + 1;
        if (seenQ.has(q.id) && seenQ.get(q.id) !== w) errs.push(`${w}: ${q.id} is also in ${seenQ.get(q.id)}`);
        seenQ.set(q.id, w);
        const own = /^chem-exam-(\d+)-\d+$/.exec(q.id);
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
    if (!/^[1-6]\.[A-G]$/.test(p.practice || '')) errs.push(`${w}: practice must be a skill id like "6.D"`);
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
    if (/\bdisorder/i.test(strip([p.earns?.answer, ...(p.checklist || [])].join(' ')).replace(/not rely on the word "disorder"/i, ''))) errs.push(`${w}: the model answer says "disorder"; entropy is dispersal`);
    // A prompt is practised once its unit is done, so nothing taught after the
    // unit's last topic may appear (the ordering rule, at unit level).
    const last = map.topics.filter(x => x.chapter === p.unit).pop();
    if (t && last && ctx.scanPage) for (const x of ctx.scanPage(map, `<p>${text}</p>`, last.id)) errs.push(`${w}: ORDER: ${x}`);
  }
  return errs;
}

/* Every number in an exam-only item or a prompt, recomputed: the value, and
   where it must appear (an item's keyed option, or a prompt's text). */
const R = 0.08206, F = 96485, NA = 6.022e23;
const log = Math.log10;
const sci = (x, n) => { const e = Math.floor(log(Math.abs(x))); const c = (x / 10 ** e).toFixed(n - 1); return `${c} × 10${String(e).replace('-', '⁻').replace(/\d/g, d => '⁰¹²³⁴⁵⁶⁷⁸⁹'[d])}`; };
const fix = (x, d) => (x < 0 ? '−' : '') + Math.abs(x).toFixed(d);
export const EXAM_NUMBERS = [
  // form 1, gas over water: 752 − 21.1 torr; n = PV/RT at 296.15 K.
  { id: 'chem-exam-1-01', key: `${fix(752 - 21.1, 0)} torr` },
  { id: 'chem-exam-1-02', key: `${sci((752 - 21.1) / 760 * 0.0364 / (R * 296.15), 3)} mol` },
  { id: 'chem-exam-1-04', key: `About ${fix(2 * 36.4, 0)} mL`, starts: true },
  { id: 'chem-exam-1-05', key: fix(4.74 + log((0.0250 * 0.20) / (0.0500 * 0.20)), 2) },
  { id: 'chem-exam-1-06', key: fix(4.74 + log((0.0050 - 0.0010) / (0.010 + 0.0010)), 2) },
  { id: 'chem-exam-1-09', key: sci(4.40 / 44.01 * 2 * NA, 3) },
  { id: 'chem-exam-1-10', key: `${fix(2 * (64.0 / 32.00) * 18.02, 1)} g`, check: () => 64.0 / 32.00 < (10.0 / 2.016) / 2 },
  { id: 'chem-exam-1-11', key: `${fix(0.0200 * 0.120 * 2 / 0.150 * 1000, 1)} mL` },
  { id: 'chem-exam-1-12', key: `${fix(0.800 / 2 ** (250 / 50.0), 4)} M` },
  { id: 'chem-exam-1-13', key: `${fix(-(51.6 * 4.18 * (29.60 - 21.50)) / 1000 / (1.60 / 40.00), 1)} kJ/mol` },
  { id: 'chem-exam-1-14', key: `${fix(2 * -395.7 - 2 * -296.8, 1)} kJ/mol` },
  { id: 'chem-exam-1-15', key: fix(0.156 ** 2 / (0.0220 * 0.0220), 1) },
  { id: 'chem-exam-1-16', key: fix(14 + log(2 * 0.0250), 3) },
  // form 2, permanganate line: slope 0.098 / 4.0e-5 M.
  { id: 'chem-exam-2-01', key: `${sci(0.343 / (0.098 / 4.0e-5), 3)} M` },
  { id: 'chem-exam-2-02', key: `${sci(0.343 / (0.098 / 4.0e-5) * 50.0 / 10.0, 3)} M` },
  { id: 'chem-exam-2-03', key: `${sci(0.098 / 4.0e-5 / 1.00, 3)} M⁻¹ cm⁻¹` },
  { id: 'chem-exam-2-05', key: `+${fix(0.80 - (-0.76), 2)} V` },
  { id: 'chem-exam-2-06', key: `${fix(-2 * F * (0.80 + 0.76) / 1000, 0)} kJ/mol` },
  { id: 'chem-exam-2-08', key: `It falls to +${fix(0.34 + 0.76, 2)} V`, starts: true },
  { id: 'chem-exam-2-09', key: `${fix(2 * 14.01 / 132.15 * 100, 1)}%` },
  { id: 'chem-exam-2-11', key: `It increases by a factor of ${3 ** 2 * 0.5}` },
  { id: 'chem-exam-2-12', key: `${fix(0.693 / 0.0231, 1)} min` },
  { id: 'chem-exam-2-13', key: sci(4 * (6.5e-5) ** 3, 2) },
  { id: 'chem-exam-2-14', key: `Q = ${Math.round(0.40 ** 2 / (0.10 * 0.20 ** 3))}`, starts: true },
  { id: 'chem-exam-2-15', key: fix(-log(Math.sqrt(3.0e-8 * 0.10)), 2), check: () => Math.sqrt(3.0e-8 * 0.10) / 0.10 < 0.05 },
];
export const JUSTIFY_NUMBERS = [
  { id: 'u6-specific-heat', has: [fix(1000 / (100.0 * 0.385), 1) + ' °C', fix(1000 / (100.0 * 4.18), 2) + ' °C'] },
  { id: 'u6-bond-enthalpy-sign', has: [String(436 + 242), String(2 * 431), '−' + String(2 * 431 - 436 - 242)] },
  { id: 'u7-ksp-common-ion', has: [sci(1.8e-10 / 0.10, 2) + ' M'] },
  { id: 'u8-weak-acid-meaning', has: [fix(-log(Math.sqrt(1.8e-5 * 0.10)), 2), fix(100 * Math.sqrt(1.8e-5 * 0.10) / 0.10, 1) + '%', sci(Math.sqrt(1.8e-5 * 0.10), 2) + ' M'] },
  { id: 'u8-conjugate-base-hh', has: [fix(14.00 - 4.74, 2)] },
  { id: 'u9-temperature-favorability', has: ['+' + fix(178.3 - 298 * 0.1605, 1) + ' kJ/mol', (178.3 / 0.1605).toFixed(0).replace(/^(\d)(\d{3})$/, '$1,$2').slice(0, 3)] },
  { id: 'u9-e-intensive', has: ['+' + fix(0.80 - 0.34, 2) + ' V'] },
  { id: 'u9-electrolytic-negative', has: [fix(-0.76 - 0.34, 2) + ' V'] },
  { id: 'u9-faraday-chain', has: [fix(2.00 * 965, 0).replace(/^(\d)(\d{3})$/, '$1,$2') + ' C', fix(2.00 * 965 / F, 4) + ' mol e⁻', fix(2.00 * 965 / F / 2 * 63.55, 3) + ' g'] },
  { id: 'u2-lattice-mgo-nacl', has: [String(72 + 140) + ' pm', String(102 + 181) + ' pm'] },
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
    if (n.check && !n.check()) errs.push(`numbers: ${n.id} fails its side condition (limiting reactant or the 5% rule)`);
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
