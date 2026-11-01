/* Shared helpers for the AP® Precalculus tool validators (one per tool,
   scripts/lib/apprecalc-tool-checks/<slug>.mjs, run by check-apprecalc-content.mjs).
   Not a validator itself: its name starts with "_" and no data file is named
   after it. Forked from scripts/lib/apcalc-tool-checks/_shared.mjs.

   runtime(slug?) loads the browser's pure tool code in a vm sandbox, the
   same files the tool page loads: precalculus/assets/pcalc-expr.js (ApPrecalcExpr),
   pcalc-math.js (ApPrecalcTex), tools/pcalc-tool-math.js (ApPrecalcMath, the
   shared helpers) and tools/pcalc-plot.js (ApPrecalcPlot, its pure svg()), then, given a slug, that tool's own
   model precalculus/assets/tools/math/<slug>.js (ApPrecalcMath.<camelSlug>). So a
   validator recomputes every number with the code students run, and each
   tool's validator loads only its own model (no author waits on another).
   Each slug gets its own sandbox, cached. */
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import vm from 'node:vm';
import { ROOT, trademarkProblems } from '../apprecalc-build.mjs';

const cache = new Map();
export function runtime(slug) {
  const key = slug || '';
  if (cache.has(key)) return cache.get(key);
  const ctx = {};
  ctx.window = ctx;
  vm.createContext(ctx);
  const files = ['pcalc-expr.js', 'pcalc-math.js', 'tools/pcalc-tool-math.js', 'tools/pcalc-plot.js'].map(f => join(ROOT, 'precalculus', 'assets', f));
  if (slug) files.push(join(ROOT, 'precalculus', 'assets', 'tools', 'math', `${slug}.js`));
  for (const p of files) if (existsSync(p)) vm.runInContext(readFileSync(p, 'utf8'), ctx, { filename: p.slice(ROOT.length + 1) });
  const M = ctx.ApPrecalcMath;
  const out = { M, Expr: ctx.ApPrecalcExpr, Tex: ctx.ApPrecalcTex, Plot: ctx.ApPrecalcPlot, model: slug && M ? M[M.camel(slug)] : undefined };
  cache.set(key, out);
  return out;
}

/* A tool's topic must be a topic of the map (docs/apprecalc-dependency-map.json). */
export const topicOk = (id, map) => !!(map && map.topicById(id));
/* The CED's skill ids (docs/apprecalc-ced-map.json, practices): three
   practices, skills A-C; none is marked not assessed. */
export const SKILLS = new Set(['1.A', '1.B', '1.C', '2.A', '2.B', '3.A', '3.B', '3.C']);
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
