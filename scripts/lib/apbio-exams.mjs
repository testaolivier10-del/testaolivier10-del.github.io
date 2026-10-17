/* AP® Biology justification trainer: loading and checks shared by the
   generator (scripts/build-apbio.mjs), the content check
   (scripts/check-apbio-content.mjs) and the tests
   (scripts/test/apbio-justify.test.mjs). Format: docs/apbio-architecture.md,
   "Justification trainer". Forked from scripts/lib/apcalc-exams.mjs (the
   Calculus, Physics and Chemistry trainers share one runtime shape).

     loadJustify(dataDir, map)     every prompt, in course order
     checkJustify(prompts, ctx)    problems with the trainer's prompts */
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const readJson = p => JSON.parse(readFileSync(p, 'utf8'));
const strip = s => String(s ?? '').replace(/<\/?[A-Za-z!][^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

// The trainer's free prompts: the first few in course order (as the other courses).
export const FREE_JUSTIFY = 3;
// The free-response points students most often lose on this exam's written
// answers: each prompt practises one.
export const JUSTIFY_SKILLS = {
  mechanism: 'Explain with a mechanism, not a restatement',
  data: 'Describe data with values, units and the comparison',
  design: 'Variables, controls and what a control rules out',
  prediction: 'Predict a result and justify it with a mechanism',
  argument: 'Support or refute a claim with evidence and reasoning',
  models: 'Use a model or diagram to explain a process',
  stats: 'Error bars, variation and whether a difference is meaningful',
};

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

/* ctx: { map, trademarkProblems, orderingProblems }. */
export function checkJustify(prompts, ctx) {
  const errs = [];
  const ids = new Set();
  const { map } = ctx;
  for (const p of prompts) {
    const w = `justify ${p.id || '(no id)'}`;
    if (!p.id || !/^u[1-8]-[a-z0-9-]+$/.test(p.id)) errs.push(`${w}: id must be u<unit>-<words>`);
    if (ids.has(p.id)) errs.push(`${w}: duplicate id`); ids.add(p.id);
    const t = map.topicById(p.topic);
    if (!t) errs.push(`${w}: unknown topic "${p.topic}"`);
    else if (t.chapter !== p.unit) errs.push(`${w}: topic ${p.topic} is in ${t.chapter}, not ${p.unit}`);
    if (p.file && p.file !== `${p.unit}.json`) errs.push(`${w}: lives in ${p.file}; a prompt goes in its unit's file`);
    if (!/^[1-6]\.[A-E]$/.test(p.practice || '')) errs.push(`${w}: practice must be a skill id like "6.E"`);
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
    // Mechanisms, not purposes (docs/apbio-authoring-guide.md) in the model answer.
    if (/\b(wants? to|in order to|tries to|so that it can)\b/i.test(strip(p.earns?.answer || ''))) errs.push(`${w}: the model answer explains by purpose ("wants to", "in order to"); give the mechanism`);
    // A table in the context is a keyboard-scrollable region, as every bio table.
    if (/<table\b/.test(p.context || '') && !/class="table-wrap"/.test(p.context || '')) errs.push(`${w}: wrap a context table in <div class="table-wrap" tabindex="0" role="region" aria-label="...">`);
    // A prompt is practised once its unit is done, so nothing taught after the
    // unit's last topic may appear (the ordering rule, at unit level).
    const last = map.topics.filter(x => x.chapter === p.unit).pop();
    if (t && last && ctx.orderingProblems) for (const x of ctx.orderingProblems(map, last.id, [text])) errs.push(`${w}: ${x}`);
  }
  return errs;
}
