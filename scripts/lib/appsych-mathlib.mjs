/* The AP® Psychology math runtime, for node: the very files the
   browser runs (psychology/assets/psy-expr.js, psy-math.js,
   psy-calc.js, psy-grade.js and tools/psy-plot.js), loaded once into a vm
   context, so the generator, the content check and the tests parse, render,
   compute and plot exactly as a student's page does.

     import { Expr, Tex, Plot, Calc, Grade, mathHtml, renderDeep } from './appsych-mathlib.mjs';
     Expr  = ApPsychExpr  (parse, evaluate, dims, gradeSetup, toTex)
     Tex   = ApPsychTex   (render, html, text, plain, check)
     Plot  = ApPsychPlot  (svg, expand, frame, ticks)
     Calc  = ApPsychCalc  (every calculation recipe of spec section 7)
     Grade = ApPsychGrade (numbers with units and scale words, "Make it specific")
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
for (const f of ['psy-expr.js', 'psy-math.js', 'psy-calc.js', 'psy-grade.js', 'tools/psy-plot.js'])
  vm.runInContext(readFileSync(join(ROOT, 'psychology', 'assets', f), 'utf8'), ctx, { filename: f });

export const Expr = ctx.ApPsychExpr;
export const Tex = ctx.ApPsychTex;
export const Plot = ctx.ApPsychPlot;
export const Calc = ctx.ApPsychCalc;
export const Grade = ctx.ApPsychGrade;
// wrap: long inline chains may break at = (psy-math.js), for authored prose and options.
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
