/* ApPsychPlot (psychology/assets/tools/psy-plot.js): every data figure is
   drawn from its numbers (line, bar, scatter with its least-squares trend
   and r, a histogram whose bins touch, the normal curve with its SD bands
   and a shaded region whose share ApPsychStats computes), with role="img"
   and a real label, or it refuses. The environmental science kinds (dual,
   pyramid, curve) are gone. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createBrowser } from './harness.mjs';

const B = createBrowser();
B.load('psychology/assets/psy-stats.js');
const P = B.load('psychology/assets/tools/psy-plot.js').ApPsychPlot;
const L = 'A placeholder figure for the plot tests';
const count = (h, tag) => (h.match(new RegExp(`<${tag}\\b`, 'g')) || []).length;

test('svg: role="img" and a real label, or it refuses', () => {
  assert.throws(() => P.svg({ kind: 'line', series: [{ points: [[0, 1], [1, 2]] }] }), /label of 20\+ characters/);
  const h = P.svg({ kind: 'line', label: L, series: [{ points: [[0, 1], [1, 2]] }] });
  assert.match(h, new RegExp(`^<svg class="psy-plot"[^>]*role="img" aria-label="${L}"`));
});

test('nice ticks and least squares', () => {
  assert.deepEqual([...P.ticks(0, 100, 5)], [0, 20, 40, 60, 80, 100]);
  assert.deepEqual({ ...P.lsq([[1, 2], [2, 4], [3, 6]]) }, { a: 0, b: 2 });
});

test('line, bar and scatter come from their data; a scatter carries its r', () => {
  const line = P.svg({ kind: 'line', label: L, series: [{ name: 'A', points: [[0, 1], [1, 2], [2, 4]] }, { name: 'B', points: [[0, 2], [2, 3]], dashed: true }] });
  assert.equal(count(line, 'polyline'), 2);
  assert.match(line, /class="psy-plot-curve s2 is-dashed"/);
  assert.match(line, /class="psy-plot-legend"/, 'two series get a legend');
  const bar = P.svg({ kind: 'bar', label: L, categories: ['Control', 'Caffeine'], values: [310, 270] });
  assert.equal((bar.match(/class="psy-plot-bar/g) || []).length, 2);
  assert.match(bar, />Control</);
  const spec = { kind: 'scatter', label: L, points: [[1, 2], [2, 4], [3, 6.1]], trend: true };
  const sc = P.svg(spec);
  assert.equal((sc.match(/class="psy-plot-pt/g) || []).length, 3);
  assert.match(sc, /class="psy-plot-line s2 is-dashed"/, 'the trend line');
  assert.ok(P.expand(spec).r > 0.99, 'r from ApPsychStats');
});

test('histogram: touching bins, edges ticked; gaps are refused', () => {
  const spec = { kind: 'histogram', label: L, bins: [[4, 5, 2], [5, 6, 5], [6, 7, 9], [7, 8, 6]] };
  const h = P.svg(spec);
  assert.equal((h.match(/class="psy-plot-bar s1"/g) || []).length, 4);
  for (const t of ['>4<', '>5<', '>8<']) assert.ok(h.includes(t), t);
  assert.throws(() => P.svg({ ...spec, bins: [[4, 5, 2], [6, 7, 3]] }), /must touch/);
});

test('normal curve: ticks at the mean and every SD, the 68-95-99.7 bands, a shaded region and its share', () => {
  const spec = { kind: 'normal', label: L, mean: 100, sd: 15, bands: true, region: { from: 115, to: null } };
  const e = P.expand(spec), h = P.svg(spec);
  assert.deepEqual([...e.xTickList.map(t => t.v)], [55, 70, 85, 100, 115, 130, 145]);
  for (const t of ['34%', '13.5%', '2.35%']) assert.equal((h.match(new RegExp(`>${t.replace('.', '\\.')}<`, 'g')) || []).length, 2, t);
  assert.match(h, /class="psy-plot-shade s1"/);
  assert.ok(Math.abs(e.share - 15.87) < 0.01, `share ${e.share}`);
  assert.ok(Math.abs(P.expand({ ...spec, region: { from: 85, to: 115 } }).share - 68.27) < 0.01);
  assert.throws(() => P.svg({ ...spec, sd: 0 }), /positive sd/);
  assert.throws(() => P.svg({ ...spec, region: { from: 120, to: 110 } }), /empty/);
  for (const k of ['dual', 'pyramid', 'curve']) assert.throws(() => P.svg({ kind: k, label: L }), /unknown plot kind/);
  assert.throws(() => P.svg({ label: L, curves: [{ fn: 'x^2' }] }), /a curve is a function/);
});

/* The Tool Studio hint on a full-width target never widens the page at 390 px
   (the shared assets/course/tool-studio.*). */
test('Tool Studio hint: ring clamped to the viewport, tip kept inside it', () => {
  const js = readFileSync('assets/course/tool-studio.js', 'utf8'), css = readFileSync('assets/course/tool-studio.css', 'utf8');
  assert.match(js, /var rl = Math\.max\(0, r\.left - pad\), rr2 = Math\.min\(vw0, r\.right \+ pad\);/);
  assert.match(css, /\.ls-halo\{[^}]*box-sizing:border-box;max-width:100vw;/);
});
