/* Shared helpers for the AP® Calculus BC tool validators (one per trainer,
   scripts/lib/apcalcbc-tool-checks/<slug>.mjs, run by check-apcalcbc-content.mjs).
   Not a validator itself (its name starts with "_").

   runtime(slug?) loads, in a vm, the very files a BC trainer page loads: AB's
   shared runtime (calculus/assets/calc-expr.js, calc-math.js, calc-questions.js,
   tools/calc-tool-math.js, tools/calc-plot.js; BC runs AB's runtime, no copies)
   and then, given a slug, the trainer's own model, calculus-bc/assets/tools/math/
   <slug>.js (ApCalcMath.<camelSlug>). Each slug gets its own sandbox, cached, so a
   builder's validator loads only its own model. AB's frame and step checks
   (../apcalc-tool-checks/_drills.mjs) are reused as they are. */
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import vm from 'node:vm';
import { ROOT } from '../apcalc-build.mjs';
export { topicOk, SKILLS, LEVELS, POS_RE, trademark } from '../apcalc-tool-checks/_shared.mjs';

const cache = new Map();
export function runtime(slug) {
  const key = slug || '';
  if (cache.has(key)) return cache.get(key);
  const ctx = { Math, Number, String, Array, Object, JSON, Error, isFinite, isNaN, parseFloat, RegExp, Infinity, NaN };
  ctx.window = ctx;
  vm.createContext(ctx);
  const files = ['calc-expr.js', 'calc-math.js', 'calc-questions.js', 'tools/calc-tool-math.js', 'tools/calc-plot.js'].map(f => join(ROOT, 'calculus', 'assets', f));
  if (slug) files.push(join(ROOT, 'calculus-bc', 'assets', 'tools', 'math', `${slug}.js`));
  for (const p of files) if (existsSync(p)) vm.runInContext(readFileSync(p, 'utf8'), ctx, { filename: p.slice(ROOT.length + 1) });
  const M = ctx.ApCalcMath;
  const out = { M, Expr: ctx.ApCalcExpr, Tex: ctx.ApCalcTex, Plot: ctx.ApCalcPlot, Questions: ctx.ApCalcQuestions, model: slug && M ? M[M.camel(slug)] : undefined };
  cache.set(key, out);
  return out;
}

/* The six BC trainers (docs/apcalcbc-spec.md section 6): slug -> [kind, context topic, builder]. */
export const BC_TOOLS = {
  'series-lab': ['simulator', 'series-convergence', 'T1'],
  'taylor-lab': ['simulator', 'taylor-polynomials', 'T1'],
  'parametric-motion': ['simulator', 'parametric-derivatives', 'T2'],
  'polar-lab': ['simulator', 'polar-derivatives', 'T2'],
  'integration-methods': ['skill', 'integration-by-parts', 'T3'],
  'euler-logistic': ['simulator', 'eulers-method', 'T3'],
};
