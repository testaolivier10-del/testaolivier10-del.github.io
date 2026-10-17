/* ApStatPlot (statistics/assets/tools/stat-plot.js): plots drawn from the
   function they claim to show, at build time and in tools. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createBrowser } from './harness.mjs';
import { Plot as P } from '../lib/apstat-mathlib.mjs';

const spec = o => ({ label: 'A test graph of a function on an interval', x: [-2, 4], y: [-2, 6], ...o });

test('svg: role="img" and a real label, or it refuses', () => {
  assert.throws(() => P.svg({ x: [0, 1], y: [0, 1] }), /label/);
  assert.throws(() => P.svg({ label: 'short' }), /20\+/);
  const s = P.svg(spec({ curves: [{ fn: 'x^2' }] }));
  assert.match(s, /^<svg class="stat-plot" viewBox="0 0 360 260"[^>]*role="img" aria-label="A test graph/);
  assert.doesNotMatch(s, /NaN|undefined|Infinity/);
  assert.doesNotMatch(s, /\bid="/, 'no ids, so a plot can appear twice on a page');
});

test('nice ticks and the frame', () => {
  assert.deepEqual([...P.ticks(-2, 4, 6)], [-2, -1, 0, 1, 2, 3, 4]);
  assert.deepEqual([...P.ticks(0, 100, 5)], [0, 20, 40, 60, 80, 100]);
  assert.equal(P.piTicks(0, Math.PI * 2).length, 5);
  const F = P.frame(spec({}));
  assert.equal(F.sx(-2), 34); assert.equal(F.sy(6), 12);
  assert.ok(Math.abs(F.ix(F.sx(1.3)) - 1.3) < 1e-12 && Math.abs(F.iy(F.sy(2.2)) - 2.2) < 1e-12);
});

test('curves break at jumps and asymptotes, not on steep continuous parts', () => {
  const F = P.frame(spec({}));
  const runs = f => P.sample(f, -2, 4, F, 600).length;
  assert.equal(runs(x => x * x), 1, 'a parabola leaving and re-entering the view is one or more clean runs');
  assert.equal(runs(x => (x < 1 ? 1 : 3)), 2, 'a jump');
  assert.equal(runs(x => 1 / (x - 1)), 2, 'a vertical asymptote');
  assert.equal(runs(x => 3 * Math.atan(50 * (x - 1))), 1, 'steep but continuous');
  assert.ok(P.sample(Math.sqrt, -2, 4, F, 300).length === 1, 'not defined for x < 0: one run from 0');
  // Every point in a run is inside the view.
  for (const r of P.sample(x => x * x * x, -2, 4, F, 300)) for (const p of r) assert.ok(p[1] >= -2 - 1e-9 && p[1] <= 6 + 1e-9);
});

test('open and closed points, shading, asymptotes, tangent and secant lines, slope fields', () => {
  const s = P.svg(spec({
    curves: [{ fn: 'x+1', domain: [-2, 1], ends: [null, 'open'] }, { fn: '3', domain: [1, 4], ends: ['closed', null] }],
    shade: [{ fn: 'x+1', domain: [0, 1] }], asymptotes: [{ x: 3 }, { y: 0 }],
    lines: [{ ...P.tangent('x^2', 1), cls: 's2' }, P.secant('x^2', 0, 2)], field: { dydx: 'x - y', step: 1 },
  }));
  assert.match(s, /class="stat-plot-pt s1 is-open" cx="190" cy="[\d.]+"/);
  assert.match(s, /class="stat-plot-pt s2" cx="190"/);
  assert.match(s, /<polygon class="stat-plot-shade"/);
  assert.equal((s.match(/class="stat-plot-asym"/g) || []).length, 2);
  assert.equal((s.match(/class="stat-plot-line/g) || []).length, 2);
  assert.ok((s.match(/<g class="stat-plot-field">/g) || []).length === 1);
  const t = P.tangent('x^2', 1);
  assert.ok(Math.abs(t.slope - 2) < 1e-6 && t.point[1] === 1);
});

test('loop: steps with dt in seconds, capped; reduced motion jumps to the end state', () => {
  const b = createBrowser();
  b.load('statistics/assets/stat-expr.js');
  const Pl = b.load('statistics/assets/tools/stat-plot.js').ApStatPlot;
  b.window.LevlMotion = { reduced: () => true };
  let still = null, ended = false;
  Pl.loop(() => {}, { duration: 2, still: t => { still = t; }, onEnd: () => { ended = true; } }).start();
  assert.equal(still, 2); assert.ok(ended);
  b.window.LevlMotion = { reduced: () => false };
  const steps = [];
  const L = Pl.loop((dt, t) => { steps.push([dt, t]); });
  L.once(0.04); L.once(0.01);
  assert.equal(L.time(), 0.05);
});

test('statistics plots are drawn from their data: dotplot, histogram, boxplot, scatter, residuals, bars, density curves', () => {
  const data = [12, 15, 9, 22, 18, 30, 14, 11, 16, 20, 13, 15, 17, 45];
  const L = { label: 'Invented data for a plot test, fourteen values' };
  const box = P.expand({ ...L, kind: 'box', data });
  // AP quartiles: Q1 = 13, Q3 = 20 for these 14 values (median of each half of 7).
  assert.deepEqual([box.rects[0].x0, box.rects[0].x1], [13, 20]);
  assert.deepEqual([...box.points.map(p => p.at[0])], [45], 'only 45 is beyond the upper fence, 20 + 1.5(7) = 30.5');
  const hist = P.expand({ ...L, kind: 'hist', data, bins: { start: 5, width: 5 } });
  assert.deepEqual([...hist.bins.counts], [1, 4, 5, 2, 0, 1, 0, 0, 1]);
  assert.equal(hist.bins.counts.reduce((a, b) => a + b, 0), data.length);
  const dot = P.expand({ ...L, kind: 'dot', data });
  assert.equal(dot.points.length, data.length);
  assert.equal(Math.max(...dot.points.map(p => p.at[1])), 1.5, 'two 15s stack');
  const xs = [1, 2, 3, 4, 5], ys = [2, 4, 5, 4, 5];
  const sc = P.expand({ ...L, kind: 'scatter', xs, ys, line: true });
  assert.ok(Math.abs(sc.fit.b - 0.6) < 1e-12 && Math.abs(sc.fit.a - 2.2) < 1e-12);
  const rs = P.expand({ ...L, kind: 'resid', xs, ys });
  assert.ok(Math.abs(rs.points.reduce((a, p) => a + p.at[1], 0)) < 1e-12, 'residuals sum to zero');
  const bi = P.expand({ ...L, kind: 'density', density: { dist: 'binom', params: { n: 10, p: 0.3 }, shade: [{ from: 4, to: 10 }] } });
  assert.equal(bi.rects.length, 11);
  assert.equal(bi.rects.filter(r => /is-shaded/.test(r.cls)).length, 7);
  for (const s of [{ kind: 'dot', data }, { kind: 'hist', data }, { kind: 'box', groups: [{ name: 'A', data }, { name: 'B', data }] },
    { kind: 'scatter', xs, ys, line: true }, { kind: 'resid', xs, ys }, { kind: 'bar', categories: ['Yes', 'No'], values: [3, 5] },
    { kind: 'density', density: { dist: 'normal', params: { mean: 100, sd: 15 }, shade: [{ from: 115, to: 200 }], marks: [{ at: 115, label: '115' }] } },
    { kind: 'density', density: { dist: 't', params: { df: 9 } } }, { kind: 'density', density: { dist: 'chi2', params: { df: 4 } } }]) {
    const out = P.svg({ ...L, ...s });
    assert.doesNotMatch(out, /NaN|undefined|Infinity/, s.kind);
  }
  assert.throws(() => P.svg({ ...L, kind: 'pie', data }), /unknown plot kind/);
});
