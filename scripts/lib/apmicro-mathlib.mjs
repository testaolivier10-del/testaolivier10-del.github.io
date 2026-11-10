/* The AP® Microeconomics math runtime, for node: the very files the
   browser runs (microeconomics/assets/mic-math.js,
   mic-calc.js, mic-graph.js, mic-matrix.js, mic-grade.js and tools/mic-plot.js), loaded once into a vm
   context, so the generator, the content check and the tests parse, render,
   compute and plot exactly as a student's page does.

     import { Tex, Plot, Calc, Graph, Matrix, Grade, mathHtml, renderDeep } from './apmicro-mathlib.mjs';
     Tex   = ApMicroTex   (render, html, text, plain, check)
     Plot  = ApMicroPlot  (svg, expand, frame, ticks)
     Calc  = ApMicroCalc  (elasticities, costs, profit, factor markets, areas; Stats is the same object,
             the name the forked code uses)
     Graph = ApMicroGraph (the economics graphs: model, areas, checker, SVG)
     Matrix = ApMicroMatrix (payoff matrices: dominant strategies, Nash equilibria, grader, HTML)
     Grade = ApMicroGrade (numbers with units and scale words, "Make it specific")
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
for (const f of ['mic-math.js', 'mic-calc.js', 'mic-graph.js', 'mic-matrix.js', 'mic-grade.js', 'tools/mic-plot.js'])
  vm.runInContext(readFileSync(join(ROOT, 'microeconomics', 'assets', f), 'utf8'), ctx, { filename: f });

export const Tex = ctx.ApMicroTex;
export const Plot = ctx.ApMicroPlot;
export const Stats = ctx.ApMicroCalc;
export const Calc = ctx.ApMicroCalc;
export const Graph = ctx.ApMicroGraph;
export const Grade = ctx.ApMicroGrade;
export const Matrix = ctx.ApMicroMatrix;
// wrap: long inline chains may break at = (mic-math.js), for authored prose and options.
export const mathHtml = s => Tex.html(s, { strict: true, wrap: true });

// Fields that hold keys, ids, units or expressions in the student syntax: never TeX.
export const RAW_KEYS = new Set(['id', 'slug', 'topic', 'unit', 'units', 'type', 'kind', 'answer', 'expr', 'fn', 'vars', 'mode', 'practice', 'stimulus', 'figure', 'cls', 'level', 'diff', 'href', 'src', 'set', 'from', 'graph', 'matrix', 'curve', 'dir', 'do', 'auto']);
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
