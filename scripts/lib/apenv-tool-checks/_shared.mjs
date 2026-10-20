/* Shared helpers for the AP® Environmental Science tool validators (one per
   tool, scripts/lib/apenv-tool-checks/<slug>.mjs, run by
   check-apenv-content.mjs). Not a validator itself: its name starts with "_"
   and no data file is named after it. Forked from
   scripts/lib/apstat-tool-checks/_shared.mjs.

   runtime(slug?) loads the browser's pure tool code in a vm sandbox, the
   same files the tool page loads: environmental-science/assets/env-expr.js
   (ApEnvExpr), env-math.js (ApEnvTex), env-calc.js (ApEnvCalc, every
   calculation recipe), env-grade.js (ApEnvGrade), tools/env-tool-math.js
   (ApEnvMath, the shared helpers) and tools/env-plot.js (ApEnvPlot, its pure
   svg()), then, given a slug, that tool's own model
   environmental-science/assets/tools/math/<slug>.js (ApEnvMath.<camelSlug>).
   So a validator recomputes every number with the code students run, and
   each tool's validator loads only its own model (no builder waits on
   another). Each slug gets its own sandbox, cached. */
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import vm from 'node:vm';
import { ROOT, trademarkProblems } from '../apenv-build.mjs';

const cache = new Map();
export function runtime(slug) {
  const key = slug || '';
  if (cache.has(key)) return cache.get(key);
  const ctx = {};
  ctx.window = ctx;
  vm.createContext(ctx);
  const files = ['env-expr.js', 'env-math.js', 'env-calc.js', 'env-grade.js', 'tools/env-tool-math.js', 'tools/env-plot.js'].map(f => join(ROOT, 'environmental-science', 'assets', f));
  if (slug) files.push(join(ROOT, 'environmental-science', 'assets', 'tools', 'math', `${slug}.js`));
  for (const p of files) if (existsSync(p)) vm.runInContext(readFileSync(p, 'utf8'), ctx, { filename: p.slice(ROOT.length + 1) });
  const M = ctx.ApEnvMath;
  const out = { M, Expr: ctx.ApEnvExpr, Tex: ctx.ApEnvTex, Calc: ctx.ApEnvCalc, Grade: ctx.ApEnvGrade, Plot: ctx.ApEnvPlot, model: slug && M ? M[M.camel(slug)] : undefined };
  cache.set(key, out);
  return out;
}

/* A tool's topic must be a topic of the map (docs/apenv-dependency-map.json). */
export const topicOk = (id, map) => !!(map && map.topicById(id));
/* The CED's assessed skill ids (docs/apenv-ced-map.json, practices; 3.D,
   3.E and 4.D are not assessed). */
export const SKILLS = new Set(['1.A', '1.B', '1.C', '2.A', '2.B', '2.C', '3.A', '3.B', '3.C', '4.A', '4.B', '4.C', '4.E',
  '5.A', '5.B', '5.C', '5.D', '5.E', '6.A', '6.B', '6.C', '7.A', '7.B', '7.C', '7.D', '7.E', '7.F']);
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
