/* The AP® Precalculus math runtime, for node: the very files the browser runs
   (precalculus/assets/pcalc-expr.js, pcalc-math.js and tools/pcalc-plot.js), loaded
   once into a vm context, so the generator, the content check and the tests
   parse, render and plot exactly as a student's page does.

     import { Expr, Tex, Plot, mathHtml, renderDeep } from './apprecalc-mathlib.mjs';
     Expr  = ApPrecalcExpr (parse, fn, compare, grade, number, toTex)
     Tex   = ApPrecalcTex  (render, html, text, plain, check)
     Plot  = ApPrecalcPlot (svg, frame, ticks, sample)
     mathHtml(str)     $...$ rendered to MathML, strict: a typo throws; long chains wrap
     renderDeep(value, skip)  every string field with $ rendered (questions,
                       FRQs, tool data), except the keys in `skip` */
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const ROOT = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const ctx = { Math, Number, String, Array, Object, JSON, Error, isFinite, parseFloat, RegExp };
ctx.globalThis = ctx;
vm.createContext(ctx);
for (const f of ['pcalc-expr.js', 'pcalc-math.js', 'tools/pcalc-plot.js'])
  vm.runInContext(readFileSync(join(ROOT, 'precalculus', 'assets', f), 'utf8'), ctx, { filename: f });

export const Expr = ctx.ApPrecalcExpr;
export const Tex = ctx.ApPrecalcTex;
export const Plot = ctx.ApPrecalcPlot;
// wrap: long inline chains may break at = (pcalc-math.js), for authored prose and options.
export const mathHtml = s => Tex.html(s, { strict: true, wrap: true });

// Fields that hold keys, ids or expressions in the student syntax: never TeX.
export const RAW_KEYS = new Set(['id', 'slug', 'topic', 'unit', 'type', 'kind', 'answer', 'expr', 'fn', 'fn2', 'dydx', 'vars', 'mode', 'practice', 'stimulus', 'figure', 'cls', 'domain', 'level', 'diff', 'calc', 'href', 'src']);
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
