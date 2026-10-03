/* Shared helpers for the AP® Biology tool validators (one per tool,
   scripts/lib/apbio-tool-checks/<slug>.mjs, run by check-apbio-content.mjs).
   Not a validator itself: its name starts with "_" and no data file is named
   after it.

   runtime() loads the browser's pure tool code (bio/assets/tools/
   bio-tool-math.js and bio-skill-problems.js) in a vm sandbox, so the
   validators recompute every number with the code students run. */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import vm from 'node:vm';
import { ROOT, STUB_PATH, trademarkProblems } from '../apbio-build.mjs';

let cached = null;
export function runtime() {
  if (cached) return cached;
  const ctx = {};
  vm.createContext(ctx);
  for (const f of ['bio-tool-math.js', 'bio-skill-problems.js']) vm.runInContext(readFileSync(join(ROOT, 'bio', 'assets', 'tools', f), 'utf8'), ctx, { filename: f });
  cached = { M: ctx.ApBioMath, P: ctx.ApBioProblems };
  return cached;
}

/* Topic ids the tools use, from the draft dependency map (branch
   claude/apbio-map, 2026-10-03). Until docs/apbio-dependency-map.json lands
   (and while tests run on the stub map) a tool topic must be one of these;
   once the real map is present it must be in the map, so any id the final
   map renames fails here and is re-tagged (docs/apbio-architecture.md,
   "Tools: topic ids"). */
export const PLACEHOLDER_TOPICS = {
  'enzyme-catalysis': 'unit-3', 'enzyme-environment': 'unit-3', 'cellular-respiration': 'unit-3', 'photosynthesis': 'unit-3',
  'cell-communication': 'unit-4', 'signal-transduction-intro': 'unit-4', 'signal-transduction-pathways': 'unit-4', 'cell-cycle': 'unit-4', 'cell-cycle-regulation': 'unit-4',
  'meiosis': 'unit-5', 'meiosis-genetic-diversity': 'unit-5', 'mendelian-genetics': 'unit-5', 'non-mendelian-genetics': 'unit-5', 'environment-phenotype': 'unit-5',
  'dna-rna-structure': 'unit-6', 'dna-replication': 'unit-6', 'transcription-rna-processing': 'unit-6', 'translation': 'unit-6', 'gene-regulation': 'unit-6', 'cell-specialization': 'unit-6', 'mutations': 'unit-6', 'biotechnology': 'unit-6',
  'membrane-transport': 'unit-2', 'tonicity-osmoregulation': 'unit-2', 'cell-size': 'unit-2', 'plasma-membrane': 'unit-2',
  'stats-descriptive': 'skills-stats', 'stats-plots': 'skills-stats', 'stats-sd-se': 'skills-stats', 'stats-rates': 'skills-stats',
  'stats-confidence-intervals': 'skills-stats', 'stats-water-potential': 'skills-stats', 'stats-chi-square': 'skills-stats',
  'stats-hardy-weinberg': 'skills-stats', 'stats-simpson': 'skills-stats',
  'design-variables': 'skills-design', 'design-controls': 'skills-design', 'design-null-hypothesis': 'skills-design',
  'design-cer': 'skills-design', 'design-prediction-mechanism': 'skills-design',
};
export const UNITS = ['unit-1', 'unit-2', 'unit-3', 'unit-4', 'unit-5', 'unit-6', 'unit-7', 'unit-8'];
const realMap = map => map && map.path && map.path !== STUB_PATH;
export function topicOk(id, map) {
  if (realMap(map)) return !!map.topicById(id);
  return id in PLACEHOLDER_TOPICS;
}
/* The CED's skill ids (docs/apbio-ced-map.json). */
export const SKILLS = new Set(['1.A', '1.B', '1.C', '2.A', '2.B', '2.C', '2.D', '3.A', '3.B', '3.C', '3.D', '3.E', '4.A', '4.B', '5.A', '5.B', '5.C', '5.D', '6.A', '6.B', '6.C', '6.D', '6.E']);
export const LEVELS = ['recall', 'apply', 'analyze'];
// An explanation never names an option by letter or position (options are shuffled).
export const POS_RE = /\b[Oo]ptions?\s+(one|two|three|four|five|[1-6]|[A-F])\b|\b(first|second|third|fourth|fifth|last|above|below)\s+(option|choice|answer)\b|\b(choice|answer)\s+[A-F]\b|\(\s*[A-E]\s*\)|\b[A-E]\s+(and|or)\s+[A-E]\b/;

/* Every string anywhere in the data: the trademark wording. */
export function trademark(data, errs, where = '') {
  const walk = (v, path) => {
    if (typeof v === 'string') { for (const p of trademarkProblems(v)) errs.push(`${where}${path}: ${p}`); }
    else if (Array.isArray(v)) v.forEach((x, i) => walk(x, `${path}[${i}]`));
    else if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) walk(x, path ? `${path}.${k}` : k);
  };
  walk(data, '');
}

export function base(data, slug, map, errs, kind) {
  if (data.slug !== slug) errs.push(`slug "${data.slug}" must be "${slug}" (the file name)`);
  if (kind && data.kind !== kind) errs.push(`kind must be "${kind}"`);
  if (!data.topic || !topicOk(data.topic, map)) errs.push(`topic "${data.topic}" is not a known topic id`);
  for (const k of ['intro', 'howItWorks']) if (!data[k] || typeof data[k] !== 'string') errs.push(`"${k}" (HTML) is required`);
  if (data.partTopics) for (const [k, t] of Object.entries(data.partTopics)) if (!topicOk(t, map)) errs.push(`partTopics.${k}: unknown topic "${t}"`);
  trademark(data, errs);
}

/* A stimulus question in the bank format (docs/apbio-architecture.md). */
export function question(q, slug, map, stimuli, errs, seen) {
  const w = q.id || '(no id)';
  if (!q.id || !q.id.startsWith(`${slug}:`) || q.id.split(':').length !== 3) errs.push(`${w}: id must be "${slug}:<content>:<item>"`);
  if (seen.has(q.id)) errs.push(`${w}: duplicate id`); seen.add(q.id);
  if (!topicOk(q.topic, map)) errs.push(`${w}: unknown topic "${q.topic}"`);
  if (!SKILLS.has(q.practice)) errs.push(`${w}: practice "${q.practice}" is not a skill id like "4.B"`);
  if (!LEVELS.includes(q.level)) errs.push(`${w}: level must be recall, apply or analyze`);
  if (![1, 2, 3].includes(q.diff)) errs.push(`${w}: diff must be 1, 2 or 3`);
  if (q.stimulus && !(stimuli || {})[q.stimulus]) errs.push(`${w}: unknown stimulus "${q.stimulus}"`);
  if (!q.q) errs.push(`${w}: no question text`);
  if (!q.why || !q.why.correct) errs.push(`${w}: why.correct is required`);
  if (q.type === 'single' || q.type === 'multi') {
    if (!Array.isArray(q.options) || q.options.length < 3) errs.push(`${w}: at least three options`);
    const key = [].concat(q.correct);
    if (key.some(k => !Number.isInteger(k) || k < 0 || k >= (q.options || []).length)) errs.push(`${w}: correct out of range`);
    if (!q.why || !Array.isArray(q.why.options) || q.why.options.length !== (q.options || []).length) errs.push(`${w}: why.options needs one explanation per option`);
    for (const t of (q.why && q.why.options) || []) if (POS_RE.test(t)) errs.push(`${w}: an explanation names an option by letter or position`);
  } else if (q.type === 'numeric') {
    const N = q.numeric || {};
    if (typeof N.answer !== 'number' || typeof N.tol !== 'number' || N.tol < 0) errs.push(`${w}: numeric needs answer and tol`);
    if (Number.isInteger(N.decimals) && Math.abs(Math.round(N.answer * 10 ** N.decimals) - N.answer * 10 ** N.decimals) > 1e-6) errs.push(`${w}: the answer has more decimals than "decimals"`);
  } else errs.push(`${w}: type must be single, multi or numeric`);
}

export function frq(f, slug, map, errs) {
  const w = `frq ${f.id || '(no id)'}`;
  if (!f.id || !f.title) errs.push(`${w}: id and title are required`);
  if (!topicOk(f.topic, map)) errs.push(`${w}: unknown topic "${f.topic}"`);
  if (!Array.isArray(f.parts) || f.parts.length < 2 || f.parts.length > 3) errs.push(`${w}: a mini FRQ has 2 or 3 parts`);
  const labels = new Set();
  for (const p of f.parts || []) {
    if (labels.has(p.label)) errs.push(`${w}: duplicate part label ${p.label}`); labels.add(p.label);
    if (!SKILLS.has(p.practice)) errs.push(`${w} (${p.label}): practice "${p.practice}" is not a skill id`);
    if (!p.prompt || !p.sample) errs.push(`${w} (${p.label}): prompt and sample are required`);
    if (!Array.isArray(p.rubric) || p.rubric.length !== p.points) errs.push(`${w} (${p.label}): one rubric line per point (${p.points} points, ${(p.rubric || []).length} lines)`);
    for (const r of p.rubric || []) if (!r.point || !Array.isArray(r.accept)) errs.push(`${w} (${p.label}): each rubric line has "point" and "accept" []`);
  }
}

/* A skills tool: every context generates sound problems for 300 seeds, and
   every fixed problem solves to the answers written in its "expect". */
export function skills(data, slug, kind, map, errs) {
  const { M, P } = runtime();
  base(data, slug, map, errs, kind);
  const ids = new Set();
  const ctxs = data.contexts || [], probs = data.problems || [];
  if (!ctxs.length && !probs.length) errs.push('no contexts and no problems');
  const sound = (sol, w) => {
    if (!sol.parts.length) errs.push(`${w}: no parts`);
    for (const p of sol.parts) {
      if (p.type === 'num' && (!Number.isFinite(p.answer) || !(p.tol > 0))) errs.push(`${w}: part ${p.key} has no finite answer`);
      if (p.type === 'choice' && !(p.correct >= 0 && p.correct < p.options.length)) errs.push(`${w}: part ${p.key} has no right option`);
      if (!SKILLS.has(p.practice)) errs.push(`${w}: part ${p.key} practice ${p.practice}`);
    }
    if (!sol.steps.length) errs.push(`${w}: no worked steps`);
    if (sol.steps.some(s => /NaN|undefined|Infinity/.test(s))) errs.push(`${w}: a worked step prints NaN, undefined or Infinity`);
  };
  for (const c of ctxs) {
    const w = `context ${c.id}`;
    if (!c.id || ids.has(c.id)) errs.push(`${w}: missing or duplicate id`); ids.add(c.id);
    if (!topicOk(c.topic, map)) errs.push(`${w}: unknown topic "${c.topic}"`);
    for (let seed = 1; seed <= 300; seed++) {
      let x, sol;
      try { x = P.generate[kind](M.rng(seed * 7919 + 13), c); sol = P.solve[kind](x); } catch (e) { errs.push(`${w} seed ${seed}: ${e.message}`); break; }
      const before = errs.length;
      sound(sol, `${w} seed ${seed}`);
      if (/\{\w+\}/.test(x.text || '')) errs.push(`${w}: template placeholder left in the text`);
      if (errs.length > before) break;
    }
  }
  for (const p of probs) {
    const w = `problem ${p.id}`;
    if (!p.id || ids.has(p.id)) errs.push(`${w}: missing or duplicate id`); ids.add(p.id);
    if (!topicOk(p.topic, map)) errs.push(`${w}: unknown topic "${p.topic}"`);
    if (!p.input || p.input.kind !== kind) { errs.push(`${w}: input.kind must be "${kind}"`); continue; }
    const sol = P.solve[kind](p.input);
    sound(sol, w);
    if (!p.expect) errs.push(`${w}: "expect" (the answers, for reviewers) is missing`);
    else for (const part of sol.parts) {
      const e = p.expect[part.key];
      const got = part.type === 'num' ? Number(M.fixed(part.answer, part.d)) : part.options[part.correct];
      if (e === undefined) errs.push(`${w}: expect.${part.key} missing (solver: ${got})`);
      else if (part.type === 'num' ? Math.abs(e - got) > 1e-9 : e !== got) errs.push(`${w}: expect.${part.key} is ${e}, the solver gives ${got}`);
    }
  }
  return { M, P };
}
