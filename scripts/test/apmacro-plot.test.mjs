/* ApMacroPlot (macroeconomics/assets/tools/mac-plot.js): every data figure is
   drawn from its numbers (line, bar, scatter with its least-squares trend),
   with role="img" and a real label, or it refuses. The statistics kinds of
   AP® Psychology (histogram, normal) and the environmental science kinds
   (dual, pyramid, curve) are gone: the economics graphs are mac-graph.js. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { createBrowser } from './harness.mjs';

const B = createBrowser();
B.load('macroeconomics/assets/mac-calc.js');
const P = B.load('macroeconomics/assets/tools/mac-plot.js').ApMacroPlot;
const L = 'A placeholder figure for the plot tests';
const count = (h, tag) => (h.match(new RegExp(`<${tag}\\b`, 'g')) || []).length;

test('svg: role="img" and a real label, or it refuses', () => {
  assert.throws(() => P.svg({ kind: 'line', series: [{ points: [[0, 1], [1, 2]] }] }), /label of 20\+ characters/);
  const h = P.svg({ kind: 'line', label: L, series: [{ points: [[0, 1], [1, 2]] }] });
  assert.match(h, new RegExp(`^<svg class="mac-plot"[^>]*role="img" aria-label="${L}"`));
});

test('nice ticks and least squares', () => {
  assert.deepEqual([...P.ticks(0, 100, 5)], [0, 20, 40, 60, 80, 100]);
  assert.deepEqual({ ...P.lsq([[1, 2], [2, 4], [3, 6]]) }, { a: 0, b: 2 });
});

test('line, bar and scatter come from their data', () => {
  const line = P.svg({ kind: 'line', label: L, series: [{ name: 'A', points: [[0, 1], [1, 2], [2, 4]] }, { name: 'B', points: [[0, 2], [2, 3]], dashed: true }] });
  assert.equal(count(line, 'polyline'), 2);
  assert.match(line, /class="mac-plot-curve s2 is-dashed"/);
  assert.match(line, /class="mac-plot-legend"/, 'two series get a legend');
  const bar = P.svg({ kind: 'bar', label: L, categories: ['Control', 'Caffeine'], values: [310, 270] });
  assert.equal((bar.match(/class="mac-plot-bar/g) || []).length, 2);
  assert.match(bar, />Control</);
  const spec = { kind: 'scatter', label: L, points: [[1, 2], [2, 4], [3, 6.1]], trend: true };
  const sc = P.svg(spec);
  assert.equal((sc.match(/class="mac-plot-pt/g) || []).length, 3);
  assert.match(sc, /class="mac-plot-line s2 is-dashed"/, 'the trend line');
});

test('the statistics and environmental science kinds are gone', () => {
  for (const k of ['dual', 'pyramid', 'curve', 'histogram', 'normal']) assert.throws(() => P.svg({ kind: k, label: L }), /unknown plot kind/);
  assert.throws(() => P.svg({ label: L, curves: [{ fn: 'x^2' }] }), /a curve is a function/);
});

/* The Tool Studio hint on a full-width target never widens the page at 390 px
   (the shared assets/course/tool-studio.*). */
test('Tool Studio hint: ring inside its target, tip a line in the layout', () => {
  const js = readFileSync('assets/course/tool-studio.js', 'utf8'), css = readFileSync('assets/course/tool-studio.css', 'utf8');
  // Pass 3: the ring sits inside its target's own box (inset shadows only) and the tip is a line in the layout.
  assert.match(js, /ring\.style\.width = \(rr - rl\) \+ 'px'/);
  assert.match(css, /\.ls-halo\{[^}]*box-shadow:inset 0 0 0 2px var\(--cink\),inset /);
  assert.match(css, /\.ls-coach\{display:flex;[^}]*width:fit-content;max-width:100%;/);
  assert.match(css, /\.ls-halo\{[^}]*box-sizing:border-box;max-width:100vw;/);
});

test('the left margin fits the widest y tick label (measured, not fixed), so long labels are never cut', () => {
  const base = { kind: 'line', label: L, series: [{ points: [[0, 0], [1, 4]] }], y: [0, 4] };
  const short = P.frame(P.expand(base)).pad.l;
  const long = P.frame(P.expand({ ...base, yTickList: [{ v: 4, text: 'Awake' }, { v: 3, text: 'REM sleep' }, { v: 0, text: 'N3' }] })).pad.l;
  assert.equal(short, 38, 'short numbers keep the 38 px minimum');
  assert.ok(long > short && long >= 'REM sleep'.length * 6.4 + 12, `margin ${long}`);
  const h = P.svg({ ...base, yTickList: [{ v: 4, text: 'REM sleep' }] });
  const x = +h.match(/<text x="([\d.]+)" y="[\d.]+" text-anchor="end">REM sleep</)[1];
  assert.ok(x - 'REM sleep'.length * 6.4 >= 0, 'the label starts inside the picture');
});

test('shared tool helpers: hintSlot in mac-tools.js, the crumb hidden by the Tool Studio and the tip slot in mac-tools.css; no trainer keeps a copy', () => {
  const js = readFileSync('macroeconomics/assets/tools/mac-tools.js', 'utf8'), css = readFileSync('macroeconomics/assets/tools/mac-tools.css', 'utf8');
  assert.match(js, /function hintSlot\(s, target, text, opts\)/);
  assert.match(js, /hintSlot: hintSlot/);
  assert.match(readFileSync('assets/course/tool-studio.css', 'utf8'), /body\.ls-on \.mac-crumb/);
  assert.match(css, /\.mac-tipslot\{/);
  // Launch: the trainers' own copies are gone (docs/apmacro-spec.md decision 13).
  for (const f of readdirSync('macroeconomics/assets/tools').filter(f => /\.(js|css)$/.test(f) && !f.startsWith('mac-'))) {
    const src = readFileSync(`macroeconomics/assets/tools/${f}`, 'utf8');
    assert.doesNotMatch(src, /function hint(Slot|Now)\(|\.mac-crumb\{display:none/, f);
  }
});
