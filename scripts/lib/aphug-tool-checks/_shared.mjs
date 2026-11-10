/* Shared helpers for the AP® Human Geography tool validators (one per
   tool, scripts/lib/aphug-tool-checks/<slug>.mjs, run by
   check-aphug-content.mjs). Not a validator itself: its name starts with "_"
   and no data file is named after it. Forked from
   scripts/lib/apenv-tool-checks/_shared.mjs.

   runtime(slug?) loads the browser's pure tool code in a vm sandbox, the
   same files the tool page loads: human-geography/assets/hug-math.js
   (ApHugTex), hug-calc.js (ApHugCalc, the arithmetic), hug-grade.js
   (ApHugGrade), hug-map.js (ApHugMap), hug-model.js (ApHugModel), tools/hug-tool-math.js
   (ApHugMath, the shared helpers) and tools/hug-plot.js (ApHugPlot, its pure
   svg()), then, given a slug, that tool's own model
   human-geography/assets/tools/math/<slug>.js (ApHugMath.<camelSlug>).
   So a validator recomputes every number with the code students run, and
   each tool's validator loads only its own model (no builder waits on
   another). Each slug gets its own sandbox, cached. */
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import vm from 'node:vm';
import { ROOT, trademarkProblems } from '../aphug-build.mjs';

const cache = new Map();
export function runtime(slug) {
  const key = slug || '';
  if (cache.has(key)) return cache.get(key);
  const ctx = {};
  ctx.window = ctx;
  vm.createContext(ctx);
  const files = ['hug-math.js', 'hug-calc.js', 'hug-grade.js', 'hug-map.js', 'hug-model.js', 'tools/hug-tool-math.js', 'tools/hug-plot.js'].map(f => join(ROOT, 'human-geography', 'assets', f));
  if (slug) files.push(join(ROOT, 'human-geography', 'assets', 'tools', 'math', `${slug}.js`));
  for (const p of files) if (existsSync(p)) vm.runInContext(readFileSync(p, 'utf8'), ctx, { filename: p.slice(ROOT.length + 1) });
  const M = ctx.ApHugMath;
  const out = { M, Tex: ctx.ApHugTex, Calc: ctx.ApHugCalc, Grade: ctx.ApHugGrade, Plot: ctx.ApHugPlot, Map: ctx.ApHugMap, Model: ctx.ApHugModel, model: slug && M ? M[M.camel(slug)] : undefined };
  cache.set(key, out);
  return out;
}

/* A tool's topic must be a topic of the map (docs/aphug-dependency-map.json). */
export const topicOk = (id, map) => !!(map && map.topicById(id));
/* The CED's skill ids (docs/aphug-ced-map.json, practices): five
   categories, 1.A-1.E concepts and processes, 2.A-2.E spatial relationships,
   3.A-3.F data analysis, 4.A-4.F source analysis, 5.A-5.D scale analysis. */
export const SKILLS = new Set(['1.A', '1.B', '1.C', '1.D', '1.E', '2.A', '2.B', '2.C', '2.D', '2.E', '3.A', '3.B', '3.C', '3.D', '3.E', '3.F', '4.A', '4.B', '4.C', '4.D', '4.E', '4.F', '5.A', '5.B', '5.C', '5.D']);
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
