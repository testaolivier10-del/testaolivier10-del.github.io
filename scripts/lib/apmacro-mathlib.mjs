/* The AP® Macroeconomics math runtime, for node: the very files the
   browser runs (macroeconomics/assets/mac-math.js,
   mac-calc.js, mac-grade.js and tools/mac-plot.js), loaded once into a vm
   context, so the generator, the content check and the tests parse, render,
   compute and plot exactly as a student's page does.

     import { Tex, Plot, Calc, Graph, Grade, mathHtml, renderDeep } from './apmacro-mathlib.mjs';
     Tex   = ApMacroTex   (render, html, text, plain, check)
     Plot  = ApMacroPlot  (svg, expand, frame, ticks)
     Calc  = ApMacroCalc  (GDP, price indices, rates, multipliers; Stats is the same object,
             the name the forked code uses)
     Graph = ApMacroGraph (the economics graphs: model, checker, SVG)
     Grade = ApMacroGrade (numbers with units and scale words, "Make it specific")
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
for (const f of ['mac-math.js', 'mac-calc.js', 'mac-graph.js', 'mac-grade.js', 'tools/mac-plot.js'])
  vm.runInContext(readFileSync(join(ROOT, 'macroeconomics', 'assets', f), 'utf8'), ctx, { filename: f });

export const Tex = ctx.ApMacroTex;
export const Plot = ctx.ApMacroPlot;
export const Stats = ctx.ApMacroCalc;
export const Calc = ctx.ApMacroCalc;
export const Graph = ctx.ApMacroGraph;
export const Grade = ctx.ApMacroGrade;
// wrap: long inline chains may break at = (mac-math.js), for authored prose and options.
export const mathHtml = s => Tex.html(s, { strict: true, wrap: true });

// Fields that hold keys, ids, units or expressions in the student syntax: never TeX.
export const RAW_KEYS = new Set(['id', 'slug', 'topic', 'unit', 'units', 'type', 'kind', 'answer', 'expr', 'fn', 'vars', 'mode', 'practice', 'stimulus', 'figure', 'cls', 'level', 'diff', 'href', 'src', 'set', 'from', 'graph', 'curve', 'dir', 'do', 'auto']);
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
