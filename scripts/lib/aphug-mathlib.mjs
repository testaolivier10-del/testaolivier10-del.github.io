/* The AP® Human Geography math runtime, for node: the very files the
   browser runs (human-geography/assets/hug-math.js,
   hug-calc.js, hug-grade.js, hug-map.js, hug-model.js and tools/hug-plot.js), loaded once into a vm
   context, so the generator, the content check and the tests parse, render,
   compute and plot exactly as a student's page does.

     import { Tex, Plot, Calc, Grade, HugMap, Model, mathHtml, renderDeep } from './aphug-mathlib.mjs';
     Tex   = ApHugTex   (render, html, text, plain, check)
     Plot  = ApHugPlot  (svg, expand, frame, ticks)
     Calc = ApHugCalc (rates, densities, dependency ratios, the rank-size rule, gravity, map scale)
     Grade = ApHugGrade (numbers with units and scale words, "Make it specific")
     HugMap = ApHugMap (maps from a data spec on the base maps: check, svg, overlay, legendHtml)
     Model = ApHugModel (model items: check, grade, html)
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
for (const f of ['hug-math.js', 'hug-calc.js', 'hug-grade.js', 'hug-map.js', 'hug-model.js', 'tools/hug-plot.js'])
  vm.runInContext(readFileSync(join(ROOT, 'human-geography', 'assets', f), 'utf8'), ctx, { filename: f });

export const Tex = ctx.ApHugTex;
export const Plot = ctx.ApHugPlot;
export const Calc = ctx.ApHugCalc;
export const Grade = ctx.ApHugGrade;
export const HugMap = ctx.ApHugMap;
export const Model = ctx.ApHugModel;
// wrap: long inline chains may break at = (hug-math.js), for authored prose and options.
export const mathHtml = s => Tex.html(s, { strict: true, wrap: true });

// Fields that hold keys, ids, units or expressions in the student syntax: never TeX.
export const RAW_KEYS = new Set(['id', 'slug', 'topic', 'unit', 'units', 'type', 'kind', 'answer', 'expr', 'fn', 'vars', 'mode', 'practice', 'stimulus', 'figure', 'cls', 'level', 'diff', 'href', 'src', 'set', 'from', 'verb', 'base', 'render']);
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
