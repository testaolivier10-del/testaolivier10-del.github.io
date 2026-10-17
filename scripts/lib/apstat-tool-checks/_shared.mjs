/* Shared helpers for the AP® Statistics tool validators (one per tool,
   scripts/lib/apstat-tool-checks/<slug>.mjs, run by check-apstat-content.mjs).
   Not a validator itself: its name starts with "_" and no data file is named
   after it. Forked from scripts/lib/apcalc-tool-checks/_shared.mjs.

   runtime(slug?) loads the browser's pure tool code in a vm sandbox, the
   same files the tool page loads: statistics/assets/stat-expr.js (ApStatExpr),
   stat-math.js (ApStatTex), stat-dist.js (ApStatDist, every distribution and
   procedure), stat-grade.js (ApStatGrade), tools/stat-tool-math.js (ApStatMath, the
   shared helpers) and tools/stat-plot.js (ApStatPlot, its pure svg()), then, given a slug, that tool's own
   model statistics/assets/tools/math/<slug>.js (ApStatMath.<camelSlug>). So a
   validator recomputes every number with the code students run, and each
   tool's validator loads only its own model (no author waits on another).
   Each slug gets its own sandbox, cached. */
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import vm from 'node:vm';
import { ROOT, trademarkProblems } from '../apstat-build.mjs';

const cache = new Map();
export function runtime(slug) {
  const key = slug || '';
  if (cache.has(key)) return cache.get(key);
  const ctx = {};
  ctx.window = ctx;
  vm.createContext(ctx);
  const files = ['stat-expr.js', 'stat-math.js', 'stat-dist.js', 'stat-grade.js', 'tools/stat-tool-math.js', 'tools/stat-plot.js'].map(f => join(ROOT, 'statistics', 'assets', f));
  if (slug) files.push(join(ROOT, 'statistics', 'assets', 'tools', 'math', `${slug}.js`));
  for (const p of files) if (existsSync(p)) vm.runInContext(readFileSync(p, 'utf8'), ctx, { filename: p.slice(ROOT.length + 1) });
  const M = ctx.ApStatMath;
  const out = { M, Expr: ctx.ApStatExpr, Tex: ctx.ApStatTex, Dist: ctx.ApStatDist, Grade: ctx.ApStatGrade, Plot: ctx.ApStatPlot, model: slug && M ? M[M.camel(slug)] : undefined };
  cache.set(key, out);
  return out;
}

/* A tool's topic must be a topic of the map (docs/apstat-dependency-map.json). */
export const topicOk = (id, map) => !!(map && map.topicById(id));
/* The CED's skill ids (docs/apstat-ced-map.json, practices; all assessed). */
export const SKILLS = new Set(['1.A', '2.A', '2.B', '2.C', '2.D', '2.E', '3.A', '3.B', '3.C', '3.D', '3.E', '4.A', '4.B', '4.C', '4.D', '4.E', '4.F', '4.G']);
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
