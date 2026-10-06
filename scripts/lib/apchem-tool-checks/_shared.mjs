/* Shared helpers for the AP® Chemistry tool validators (one per tool,
   scripts/lib/apchem-tool-checks/<slug>.mjs, run by check-apchem-content.mjs).
   Not a validator itself: its name starts with "_" and no data file is named
   after it. Forked from scripts/lib/apbio-tool-checks/_shared.mjs.

   runtime() loads the browser's pure tool code (chem/assets/tools/
   chem-tool-math.js, and chem-skill-problems.js once the first drill adds
   it) in a vm sandbox, so the validators recompute every number with the
   code students run. */
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import vm from 'node:vm';
import { ROOT, trademarkProblems } from '../apchem-build.mjs';

let cached = null;
export function runtime() {
  if (cached) return cached;
  const ctx = {};
  ctx.window = ctx;
  vm.createContext(ctx);
  for (const f of ['chem-tool-math.js', 'chem-skill-problems.js']) {
    const p = join(ROOT, 'chem', 'assets', 'tools', f);
    if (existsSync(p)) vm.runInContext(readFileSync(p, 'utf8'), ctx, { filename: f });
  }
  cached = { M: ctx.ApChemMath, P: ctx.ApChemProblems };
  return cached;
}

/* A tool's topic must be a topic of the map (docs/apchem-dependency-map.json). */
export const topicOk = (id, map) => !!(map && map.topicById(id));
/* The CED's skill ids (docs/apchem-ced-map.json, sciencePractices). */
export const SKILLS = new Set(['1.A', '1.B', '2.A', '2.B', '2.C', '2.D', '2.E', '2.F', '3.A', '3.B', '3.C', '4.A', '4.B', '4.C', '4.D', '5.A', '5.B', '5.C', '5.D', '5.E', '5.F', '6.A', '6.B', '6.C', '6.D', '6.E', '6.F', '6.G']);
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
