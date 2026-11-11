/* ApHugPlot (human-geography/assets/tools/hug-plot.js): every data figure is
   drawn from its numbers (line, bar, scatter with its least-squares trend,
   the population pyramid with its age groups in a gutter), with role="img"
   and a real label, or it refuses. Psychology's histogram and normal curve
   are gone. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { createBrowser } from './harness.mjs';

const B = createBrowser();
B.load('human-geography/assets/hug-calc.js');
const P = B.load('human-geography/assets/tools/hug-plot.js').ApHugPlot;
const L = 'A placeholder figure for the plot tests';
const count = (h, tag) => (h.match(new RegExp(`<${tag}\\b`, 'g')) || []).length;

test('svg: role="img" and a real label, or it refuses', () => {
  assert.throws(() => P.svg({ kind: 'line', series: [{ points: [[0, 1], [1, 2]] }] }), /label of 20\+ characters/);
  const h = P.svg({ kind: 'line', label: L, series: [{ points: [[0, 1], [1, 2]] }] });
  assert.match(h, new RegExp(`^<svg class="hug-plot"[^>]*role="img" aria-label="${L}"`));
});

test('nice ticks and least squares', () => {
  assert.deepEqual([...P.ticks(0, 100, 5)], [0, 20, 40, 60, 80, 100]);
  assert.deepEqual({ ...P.lsq([[1, 2], [2, 4], [3, 6]]) }, { a: 0, b: 2 });
});

test('line, bar and scatter come from their data; a scatter carries its trend', () => {
  const line = P.svg({ kind: 'line', label: L, series: [{ name: 'A', points: [[0, 1], [1, 2], [2, 4]] }, { name: 'B', points: [[0, 2], [2, 3]], dashed: true }] });
  assert.equal(count(line, 'polyline'), 2);
  assert.match(line, /class="hug-plot-curve s2 is-dashed"/);
  assert.match(line, /class="hug-plot-legend"/, 'two series get a legend');
  const bar = P.svg({ kind: 'bar', label: L, categories: ['Control', 'Caffeine'], values: [310, 270] });
  assert.equal((bar.match(/class="hug-plot-bar/g) || []).length, 2);
  assert.match(bar, />Control</);
  const spec = { kind: 'scatter', label: L, points: [[1, 2], [2, 4], [3, 6.1]], trend: true };
  const sc = P.svg(spec);
  assert.equal((sc.match(/class="hug-plot-pt/g) || []).length, 3);
  assert.match(sc, /class="hug-plot-line s2 is-dashed"/, 'the trend line');
  assert.ok(P.expand(spec).fit.b > 1.9, 'the least-squares slope');
});

test('population pyramid: males left, females right, age groups in a gutter between the halves, ticks read outward', () => {
  const spec = { kind: 'pyramid', label: L, groups: ['0-14', '15-29', '30-44', '45+'], left: [12, 10, 8, 6], right: [11, 10, 8, 7], xLabel: 'Percent of the population' };
  const e = P.expand(spec), h = P.svg(spec);
  assert.equal((h.match(/class="hug-plot-bar s1"/g) || []).length, 4 + 1, 'four male bars and the legend swatch');
  assert.equal((h.match(/class="hug-plot-bar s2"/g) || []).length, 4 + 1);
  for (const g of spec.groups) assert.ok(h.includes(`>${g}<`), g);
  assert.ok(e.gutter > 0, 'a gutter between the halves');
  const zero = e.xTickList.filter(t => t.text === '0');
  assert.equal(zero.length, 2, 'each half reads from 0 outward');
  assert.ok(e.rects.every(r => r.x1 <= -e.gutter + 1e-9 || r.x0 >= e.gutter - 1e-9), 'no bar reaches into the gutter');
  assert.match(h, /role="img" aria-label="A placeholder figure/);
  assert.throws(() => P.svg({ ...spec, right: [1, 2] }), /same length/);
  assert.throws(() => P.svg({ ...spec, max: 5 }), /longer than max/);
  for (const k of ['histogram', 'normal', 'dual', 'curve']) assert.throws(() => P.svg({ kind: k, label: L }), /unknown plot kind/);
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

test('shared tool helpers: hintSlot in hug-tools.js, the crumb hidden by the Tool Studio and the tip slot in hug-tools.css; no trainer keeps a copy', () => {
  const js = readFileSync('human-geography/assets/tools/hug-tools.js', 'utf8'), css = readFileSync('human-geography/assets/tools/hug-tools.css', 'utf8');
  assert.match(js, /function hintSlot\(s, target, text, opts\)/);
  assert.match(js, /hintSlot: hintSlot/);
  assert.match(readFileSync('assets/course/tool-studio.css', 'utf8'), /body\.ls-on \.hug-crumb/);
  assert.match(css, /\.hug-tipslot\{/);
  // Launch: the trainers' own copies are gone (docs/aphug-spec.md decision 13).
  for (const f of readdirSync('human-geography/assets/tools').filter(f => /\.(js|css)$/.test(f) && !f.startsWith('hug-'))) {
    const src = readFileSync(`human-geography/assets/tools/${f}`, 'utf8');
    assert.doesNotMatch(src, /function hint(Slot|Now)\(|\.hug-crumb\{display:none/, f);
  }
});
