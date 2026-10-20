/* ApEnvPlot (environmental-science/assets/tools/env-plot.js): every data
   figure is drawn from its numbers (line, bar, scatter with its least-squares
   trend, dual axis, population pyramid, a dose-response curve with its marked
   point), with role="img" and a real label, or it refuses. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createBrowser } from './harness.mjs';

const B = createBrowser();
for (const f of ['env-expr.js', 'env-calc.js']) B.load(`environmental-science/assets/${f}`);
const P = B.load('environmental-science/assets/tools/env-plot.js').ApEnvPlot;
const L = 'A placeholder figure for the plot tests';
const count = (h, tag) => (h.match(new RegExp(`<${tag}\\b`, 'g')) || []).length;

test('svg: role="img" and a real label, or it refuses', () => {
  assert.throws(() => P.svg({ kind: 'line', series: [{ points: [[0, 1], [1, 2]] }] }), /label of 20\+ characters/);
  const h = P.svg({ kind: 'line', label: L, series: [{ points: [[0, 1], [1, 2]] }] });
  assert.match(h, new RegExp(`^<svg class="env-plot"[^>]*role="img" aria-label="${L}"`));
});

test('nice ticks, interpolation and least squares', () => {
  assert.deepEqual([...P.ticks(0, 100, 5)], [0, 20, 40, 60, 80, 100]);
  assert.equal(P.interpX([[0, 0], [10, 20], [20, 50]], 50), 20);
  assert.equal(P.interpY([[0, 0], [10, 20]], 5), 10);
  assert.deepEqual({ ...P.lsq([[1, 2], [2, 4], [3, 6]]) }, { a: 0, b: 2 });
});

test('line, bar and scatter come from their data', () => {
  const line = P.svg({ kind: 'line', label: L, series: [{ name: 'A', points: [[0, 1], [1, 2], [2, 4]] }, { name: 'B', points: [[0, 2], [2, 3]], dashed: true }] });
  assert.equal(count(line, 'polyline'), 2);
  assert.match(line, /class="env-plot-curve s2 is-dashed"/);
  assert.match(line, /class="env-plot-legend"/, 'two series get a legend');
  const bar = P.svg({ kind: 'bar', label: L, categories: ['Coal', 'Gas', 'Wind'], values: [50, 30, 20] });
  assert.equal((bar.match(/class="env-plot-bar/g) || []).length, 3);
  assert.match(bar, />Coal</);
  const sc = P.svg({ kind: 'scatter', label: L, points: [[1, 2], [2, 4], [3, 6.1]], trend: true });
  assert.equal((sc.match(/class="env-plot-pt/g) || []).length, 3);
  assert.match(sc, /class="env-plot-line s2 is-dashed"/, 'the trend line');
});

test('dual axis, pyramid and a dose-response curve with LD50 marked', () => {
  const dual = P.svg({ kind: 'dual', label: L, series: [{ name: 'CO2', points: [[0, 300], [10, 400]], axis: 'left' }, { name: 'Temp', points: [[0, 14], [10, 15]], axis: 'right' }], yRight: [13, 16], yRightLabel: 'Temperature' });
  assert.equal(count(dual, 'polyline'), 2);
  assert.match(dual, /Temperature/);
  const pyr = P.svg({ kind: 'pyramid', label: L, groups: ['0-14', '15-29', '30+'], left: [10, 8, 5], right: [9, 8, 6], leftLabel: 'Male', rightLabel: 'Female' });
  assert.equal((pyr.match(/<rect[^>]*class="env-plot-bar s[12]"/g) || []).length, 8, 'one bar per group per side, plus the two legend keys');
  assert.match(pyr, /Male/); assert.match(pyr, /Female/); assert.match(pyr, /0-14/);
  const spec = { kind: 'curve', label: L, points: [[0, 0], [10, 20], [20, 50], [40, 90]], mark: { y: 50, label: 'LD50' } };
  const e = P.expand(spec);
  assert.deepEqual({ ...e.mark }, { x: 20, y: 50 }, 'the marked dose read off the curve');
  assert.ok(e.polys.some(p => p.dashed), 'dashed guides to the axes');
  assert.match(P.svg(spec), /LD50/);
});

/* Phase 3 (author C, docs/apenv-needs-author.md): a dual-axis plot at the
   default width names both axes in a band above the plot, never inside it or
   on top of each other, and its legend wraps instead of running off the edge. */
test('dual axis at the default width: axis names above the plot, apart; the legend wraps inside the picture', () => {
  const spec = { kind: 'dual', label: L, xLabel: 'Weeks after the spring runoff', yLabel: 'Algae (µg per L)', yRightLabel: 'Dawn dissolved oxygen (mg per L)',
    series: [{ name: 'Algae', points: [[0, 5], [12, 60]], axis: 'left' }, { name: 'Bottom dissolved oxygen', points: [[0, 8], [12, 1]], axis: 'right' }] };
  const h = P.svg(spec), F = P.frame(P.expand(spec));
  const lab = [...h.matchAll(/<text class="env-plot-axlabel" x="([\d.]+)" y="([\d.]+)" text-anchor="(\w+)">([^<]*)<\/text>/g)].map(m => ({ x: +m[1], y: +m[2], a: m[3], t: m[4] }));
  const left = lab.find(l => /Algae/.test(l.t)), right = lab.find(l => /oxygen/.test(l.t));
  assert.ok(left && right);
  assert.ok(left.y < F.pad.t && right.y < F.pad.t, 'both names sit above the plot area');
  const lw = P.textW(left.t), rw = P.textW(right.t);
  assert.ok(left.y !== right.y || left.x + lw + 8 <= right.x - rw, 'on one line only when they do not meet');
  assert.ok(right.x <= F.w && right.x - rw >= 0 && left.x + lw <= F.w, 'inside the picture');
  const vbW = +h.match(/viewBox="0 0 (\d+)/)[1];
  for (const m of h.matchAll(/<g class="env-plot-legend">([\s\S]*?)<\/g>/g)) for (const t of m[1].matchAll(/<text x="([\d.]+)"[^>]*>([^<]*)</g)) assert.ok(+t[1] + P.textW(t[2]) <= vbW + 1, `legend "${t[2]}" fits`);
  assert.equal(F.w, 360, 'the default width');
});
