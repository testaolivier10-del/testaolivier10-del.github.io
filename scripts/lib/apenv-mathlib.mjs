/* The AP® Environmental Science math runtime, for node: the very files the
   browser runs (environmental-science/assets/env-expr.js, env-math.js,
   env-calc.js, env-grade.js and tools/env-plot.js), loaded once into a vm
   context, so the generator, the content check and the tests parse, render,
   compute and plot exactly as a student's page does.

     import { Expr, Tex, Plot, Calc, Grade, mathHtml, renderDeep } from './apenv-mathlib.mjs';
     Expr  = ApEnvExpr  (parse, evaluate, dims, gradeSetup, toTex)
     Tex   = ApEnvTex   (render, html, text, plain, check)
     Plot  = ApEnvPlot  (svg, expand, frame, ticks)
     Calc  = ApEnvCalc  (every calculation recipe of spec section 7)
     Grade = ApEnvGrade (numbers with units and scale words, "Make it specific")
     mathHtml(str)     $...$ rendered to MathML, strict: a typo throws; long chains wrap
     renderDeep(value, skip)  every string field with $ rendered, except the keys in `skip` */
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const ROOT = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const ctx = { Math, Number, String, Array, Object, JSON, Error, isFinite, parseFloat, RegExp };
ctx.globalThis = ctx;
vm.createContext(ctx);
for (const f of ['env-expr.js', 'env-math.js', 'env-calc.js', 'env-grade.js', 'tools/env-plot.js'])
  vm.runInContext(readFileSync(join(ROOT, 'environmental-science', 'assets', f), 'utf8'), ctx, { filename: f });

export const Expr = ctx.ApEnvExpr;
export const Tex = ctx.ApEnvTex;
export const Plot = ctx.ApEnvPlot;
export const Calc = ctx.ApEnvCalc;
export const Grade = ctx.ApEnvGrade;
// wrap: long inline chains may break at = (env-math.js), for authored prose and options.
export const mathHtml = s => Tex.html(s, { strict: true, wrap: true });

// Fields that hold keys, ids, units or expressions in the student syntax: never TeX.
export const RAW_KEYS = new Set(['id', 'slug', 'topic', 'unit', 'units', 'type', 'kind', 'answer', 'expr', 'fn', 'vars', 'mode', 'practice', 'stimulus', 'figure', 'cls', 'level', 'diff', 'href', 'src', 'set', 'from']);
export function renderDeep(v, skip = RAW_KEYS) {
  if (typeof v === 'string') return v.includes('$') ? mathHtml(v) : v;
  if (Array.isArray(v)) return v.map(x => renderDeep(x, skip));
  if (v && typeof v === 'object') {
    const out = {};
    for (const [k, x] of Object.entries(v)) out[k] = skip.has(k) ? x : renderDeep(x, skip);
    return out;
  }
  return v;
}
