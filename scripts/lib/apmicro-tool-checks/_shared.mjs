/* Shared helpers for the AP® Microeconomics tool validators (one per
   tool, scripts/lib/apmicro-tool-checks/<slug>.mjs, run by
   check-apmicro-content.mjs). Not a validator itself: its name starts with "_"
   and no data file is named after it. Forked from
   scripts/lib/appsych-tool-checks/_shared.mjs.

   runtime(slug?) loads the browser's pure tool code in a vm sandbox, the
   same files the tool page loads: microeconomics/assets/mic-math.js
   (ApMicroTex), mic-calc.js (ApMicroCalc), mic-graph.js (ApMicroGraph), mic-matrix.js
   (ApMicroMatrix), mic-grade.js
   (ApMicroGrade), tools/mic-tool-math.js
   (ApMicroMath, the shared helpers) and tools/mic-plot.js (ApMicroPlot, its pure
   svg()), then, given a slug, that tool's own model
   microeconomics/assets/tools/math/<slug>.js (ApMicroMath.<camelSlug>).
   So a validator recomputes every number with the code students run, and
   each tool's validator loads only its own model (no builder waits on
   another). Each slug gets its own sandbox, cached. */
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import vm from 'node:vm';
import { ROOT, trademarkProblems } from '../apmicro-build.mjs';

const cache = new Map();
export function runtime(slug) {
  const key = slug || '';
  if (cache.has(key)) return cache.get(key);
  const ctx = {};
  ctx.window = ctx;
  vm.createContext(ctx);
  const files = ['mic-math.js', 'mic-calc.js', 'mic-graph.js', 'mic-matrix.js', 'mic-grade.js', 'tools/mic-tool-math.js', 'tools/mic-plot.js'].map(f => join(ROOT, 'microeconomics', 'assets', f));
  if (slug) files.push(join(ROOT, 'microeconomics', 'assets', 'tools', 'math', `${slug}.js`));
  for (const p of files) if (existsSync(p)) vm.runInContext(readFileSync(p, 'utf8'), ctx, { filename: p.slice(ROOT.length + 1) });
  const M = ctx.ApMicroMath;
  const out = { M, Tex: ctx.ApMicroTex, Calc: ctx.ApMicroCalc, Graph: ctx.ApMicroGraph, Matrix: ctx.ApMicroMatrix, Stats: ctx.ApMicroCalc, Grade: ctx.ApMicroGrade, Plot: ctx.ApMicroPlot, model: slug && M ? M[M.camel(slug)] : undefined };
  cache.set(key, out);
  return out;
}

/* A tool's topic must be a topic of the map (docs/apmicro-dependency-map.json). */
export const topicOk = (id, map) => !!(map && map.topicById(id));
/* The CED's skill ids (docs/apmicro-ced-map.json, practices): 1.A-1.D
   principles and models, 2.A-2.C interpretation, 3.A-3.C manipulation,
   4.A-4.C graphing (graph steps and free-response trainers). */
export const SKILLS = new Set(['1.A', '1.B', '1.C', '1.D', '2.A', '2.B', '2.C', '3.A', '3.B', '3.C', '4.A', '4.B', '4.C']);
export const LEVELS = ['recall', 'apply', 'analyze'];
// An explanation never names an option by letter or position (options are shuffled).
export const POS_RE = /\b[Oo]ptions?\s+(one|two|three|four|five|[1-6]|[A-F])\b|\b(first|second|third|fourth|fifth|last|above|below)\s+(option|choice|answer)\b|\b(choice|answer)\s+[A-F]\b|\(\s*[A-E]\s*\)|\b[A-E]\s+(and|or)\s+[A-E]\b/;

/* Every string anywhere in the data: the trademark wording. */
export function trademark(data, errs, where = '') {
  const walk = (v, path) => {
    if (typeof v === 'string') { for (const p of trademarkProblems(v)) errs.push(`${where}${path}: ${p}`); return; }
    if (Array.isArray(v)) v.forEach((x, i) => walk(x, `${path}[${i}]`));
    else if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) walk(x, path ? `${path}.${k}` : k);
  };
  walk(data, '');
}
